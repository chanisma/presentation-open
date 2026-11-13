// 로컬 덱 에디터 API — Vite dev 서버 전용 플러그인 (apply: 'serve').
// 브라우저 에디터(?app=edit)가 data/ 아래 원본 파일을 직접 고치게 해 준다.
// DB·온라인 저장 없음. 배포본(vite build)에는 들어가지 않는다.
//
//   GET  /__edit/info                     → { root }
//   POST /__edit/locate  {text, dir, hintFile?, hintLine?}   → { candidates[] }
//   POST /__edit/patch   {file, start, end, expect, replacement, dir?} → { ok, line }
//   POST /__edit/slides  {file, anchors, op, index, to?, dir, deckId?, quizFile?} → { ok, slides }
//   POST /__edit/geometry       {file, line}                  → { items[] }  자리·크기 찾기
//   POST /__edit/geometry/save  {file, start, end, expect, kind, nums, …} → { ok, fixes[] }
//   POST /__edit/undo                     → { ok, file }
//   GET  /__edit/json?file=               → 파일 내용(JSON)
//   POST /__edit/json    {file, data, dir?} → { ok }
//
// 안전장치: ① 요청은 localhost에서만 ② 경로는 data/ 아래 + 확장자 화이트리스트
// ③ patch는 expect(바꾸기 전 원문)가 그 자리에 그대로 있을 때만 ④ tsx/ts는
// 저장 전에 esbuild로 구문 검사 — 실패하면 쓰지 않는다 ⑤ 저장마다 되돌리기 스택.
//
// 저장할 때마다 수업 폴더의 `edits.md`에 무엇을 어떻게 고쳤는지 덧붙인다
// (prompts.md와 같은 자리·같은 취지 — 세션은 지워져도 자료 옆 기록은 남는다).
// 이 파일이 있으면 다음에 이 자료를 여는 사람도 인공지능도 "사람이 화면에서 직접
// 고친 문구"를 알아볼 수 있고, plan.md 같은 상위 원본과 어긋난 자리를 짚을 수 있다.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, relative, extname, join, sep, isAbsolute } from 'node:path';
import { transformWithEsbuild } from 'vite';

const TEXT_EXT = new Set(['.tsx', '.ts', '.html']);
const JSON_EXT = new Set(['.json']);
const MAX_UNDO = 50;

export default function deckEditorApi() {
  let root = process.cwd();
  /** @type {{file:string, before:string}[]} */
  const undo = [];
  /** @type {import('vite').ViteDevServer} */
  let server;

  const toRel = (abs) => relative(root, abs).split(sep).join('/');

  /** 요청 경로 → 절대 경로. data/ 밖이거나 허용 확장자가 아니면 throw */
  function safe(file, exts) {
    if (typeof file !== 'string' || !file) throw new Error('file이 없습니다');
    const clean = decodeURIComponent(file).replace(/^\/+/, '').split('?')[0];
    const abs = isAbsolute(clean) ? resolve(clean) : resolve(root, clean);
    const rel = toRel(abs);
    if (rel.startsWith('..') || !rel.startsWith('data/'))
      throw new Error(`data/ 밖의 파일은 고칠 수 없습니다: ${rel}`);
    if (!exts.has(extname(abs).toLowerCase()))
      throw new Error(`편집 대상이 아닌 확장자입니다: ${rel}`);
    return abs;
  }

  /** html·json은 Vite가 전체 리로드를 걸기 때문에 쓰는 동안 감시를 잠깐 뗀다.
      tsx/ts는 HMR이 미리보기를 갱신해야 하므로 그대로 둔다. */
  function write(abs, content) {
    const quiet = !/\.tsx?$/.test(abs);
    if (quiet) server.watcher.unwatch(abs);
    writeFileSync(abs, content, 'utf8');
    if (quiet) setTimeout(() => server.watcher.add(abs), 400);
  }

  /** 되돌리기 기록. 조작 하나가 파일 여러 개를 고칠 수 있으므로(슬라이드 삭제는
      deck.tsx·quiz.json·registry.tsx를 함께 건드린다) 한 항목이 파일 목록을 들고 있고,
      되돌리기 한 번에 전부 물러난다. `after`(우리가 쓴 내용)를 같이 들고 있다가 되돌릴 때
      파일이 아직 그대로인지 확인한다 — 에디터 밖에서 고친 내용을 덮어쓰지 않기 위해서다. */
  function pushUndo(dirAbs, files) {
    if (!files.length) return;
    // 한 조작이 같은 파일을 두 번 고칠 수 있다(자리를 옮긴 뒤 포인터를 다시 재서 또 쓴다).
    // 처음의 before와 마지막의 after만 남겨 한 항목으로 합친다 — 그러지 않으면
    // 중간 상태를 기준으로 삼아 "밖에서 바뀌었다"며 되돌리기를 거부한다.
    const merged = new Map();
    for (const f of files) {
      const cur = merged.get(f.file);
      merged.set(f.file, { file: f.file, before: cur ? cur.before : f.before, after: f.after });
    }
    undo.push({ dir: dirAbs, files: [...merged.values()] });
    if (undo.length > MAX_UNDO) undo.shift();
  }

  /* ── 편집 기록 (수업 폴더의 edits.md) ─────────────────────────────
     자동 기록이라 사람이 쓴 prompts.md와는 파일을 나눈다. 한 줄 요약이 아니라
     이전/이후를 같이 남긴다 — 무엇이 바뀌었는지 모르면 기록이 쓸모가 없다. */
  const HEAD = (name) =>
    `# ${name} · 편집 기록\n\n` +
    `> 로컬 덱 에디터(\`?app=edit\`)로 고친 내용을 저장할 때마다 자동으로 남긴다. 시간순.\n` +
    `> 화면에서 직접 고친 자리이므로, 이 자료에 \`plan.md\`·\`scene-plan.json\` 같은 상위\n` +
    `> 원본이 있다면 아래 변경이 그쪽에는 반영되어 있지 않다. 자료를 다시 뽑기 전에 확인할 것.\n`;

  function stamp() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  /** 여러 줄 문구를 기록용 한 덩어리로 — 인용 부호로 감싸고 너무 길면 자른다 */
  function quote(s, max = 300) {
    const t = String(s ?? '').replace(/\r?\n/g, ' ⏎ ');
    return '`' + (t.length > max ? t.slice(0, max) + ' …' : t) + '`';
  }

  function appendLog(dirAbs, body) {
    if (!dirAbs) return;
    try {
      const path = join(dirAbs, 'edits.md');
      const name = dirAbs.split(sep).pop();
      const head = existsSync(path) ? readFileSync(path, 'utf8').replace(/\s*$/, '\n') : HEAD(name);
      const quiet = !existsSync(path) || true; // .md는 늘 조용히 — 전체 리로드 방지
      if (quiet) server?.watcher.unwatch(path);
      writeFileSync(path, `${head}\n## ${stamp()} · ${body}\n`, 'utf8');
      if (quiet) setTimeout(() => server?.watcher.add(path), 400);
    } catch {
      // 기록 실패가 저장을 막지는 않는다
    }
  }

  /** quiz.json 두 판을 견줘 문항 단위로 무엇이 달라졌는지 적는다 */
  function diffQuiz(before, after) {
    const list = (x) => (Array.isArray(x?.activities) ? x.activities : []);
    const A = list(before);
    const B = list(after);
    const byId = (arr) => new Map(arr.map((a) => [a.id, a]));
    const ma = byId(A);
    const mb = byId(B);
    const lines = [];
    for (const b of B) {
      const a = ma.get(b.id);
      if (!a) {
        lines.push(`- 추가 · ${b.kind} · ${b.slide === 'last' ? '마지막' : Number(b.slide) + 1}쪽 — ${quote(b.prompt, 120)}`);
        continue;
      }
      const fields = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(
        (k) => JSON.stringify(a[k]) !== JSON.stringify(b[k])
      );
      if (!fields.length) continue;
      lines.push(`- 수정 · \`${b.id}\` — ${fields.join(', ')}`);
      if (fields.includes('prompt')) lines.push(`  - 질문: ${quote(a.prompt, 120)} → ${quote(b.prompt, 120)}`);
      for (const k of fields.filter((f) => f !== 'prompt'))
        lines.push(`  - ${k}: ${quote(JSON.stringify(a[k]), 120)} → ${quote(JSON.stringify(b[k]), 120)}`);
    }
    for (const a of A) if (!mb.has(a.id)) lines.push(`- 삭제 · \`${a.id}\` — ${quote(a.prompt, 120)}`);
    const orderA = A.map((x) => x.id).join(',');
    const orderB = B.map((x) => x.id).join(',');
    if (A.length === B.length && orderA !== orderB && !lines.length) lines.push('- 문항 순서를 바꿨다');
    return lines;
  }

  /** 폴더 안의 편집 가능한 소스 (하위 1단계까지 — slides-a.tsx, notes.ts 등) */
  function sourcesIn(dirAbs) {
    const out = [];
    const walk = (d, depth) => {
      for (const name of readdirSync(d)) {
        const p = join(d, name);
        const st = statSync(p);
        if (st.isDirectory()) {
          if (depth < 1 && !/^(media|images|assets|node_modules)$/.test(name)) walk(p, depth + 1);
        } else if (TEXT_EXT.has(extname(name).toLowerCase())) out.push(p);
      }
    };
    walk(dirAbs, 0);
    return out;
  }

  /** 화면 글자 → 소스를 찾을 정규식. 소스와 화면은 세 가지가 다르다.
      ① 줄바꿈·들여쓰기 — 화면에서는 공백 하나로 접힌다
      ② 따옴표 — 문자열 리터럴 안에서는 `\"`처럼 역슬래시가 붙어 있다
      ③ 줄바꿈 문자 — 소스에는 `\n` 두 글자로 들어 있다 */
  function looseRegex(text, limit) {
    let tokens = text.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) return null;
    if (limit) tokens = tokens.slice(0, limit);
    const esc = (s) =>
      s
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        // 이스케이프된 따옴표도 같은 글자로 본다
        .replace(/(["'`])/g, '\\\\?$1');
    /* 앞뒤로 글자가 더 붙어 있으면 다른 낱말이다. 이 울타리가 없으면 좁혀 찾을 때
       `첫 명령`이 `첫 명령을` 안쪽에 걸려, 바꾸고 나면 `첫 명령이다을`이 된다. */
    const edge = '[\\p{L}\\p{N}_]';
    return new RegExp(
      `(?<!${edge})${tokens.map(esc).join('(?:\\s|\\\\n)+')}(?!${edge})`,
      'gu'
    );
  }

  /** 매치가 문자열 리터럴 안인지 — 같은 줄에서 앞쪽의 따옴표 개수로 판정(홀수면 안) */
  function literalQuote(src, start) {
    const lineStart = src.lastIndexOf('\n', start - 1) + 1;
    const head = src.slice(lineStart, start);
    for (const q of ['`', '"', "'"]) {
      let n = 0;
      for (let i = 0; i < head.length; i++)
        if (head[i] === q && head[i - 1] !== '\\') n++;
      if (n % 2 === 1) return q;
    }
    // 여러 줄 템플릿 리터럴 — 파일 처음부터 백틱 개수
    let ticks = 0;
    for (let i = 0; i < start; i++) if (src[i] === '`' && src[i - 1] !== '\\') ticks++;
    return ticks % 2 === 1 ? '`' : null;
  }

  /** esbuild의 오류 덩어리에서 사람이 읽을 한 줄을 뽑는다 (첫 줄은 "Transform failed"뿐이다) */
  function esbuildWhy(e) {
    const first = e?.errors?.[0];
    if (first?.text) {
      const at = first.location ? ` (${first.location.line}번째 줄)` : '';
      return first.text + at;
    }
    return String(e?.message ?? e)
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !/^Transform failed/.test(l))[0] ?? String(e?.message ?? e);
  }

  /** encode의 반대 — 소스에 적힌 `\"`·`\n`을 사람이 읽는 글자로 되돌린다.
      편집 상자에는 이 꼴을 보여 주고, 저장할 때 encode가 다시 이스케이프한다. */
  function decode(s, quote) {
    if (!quote) return s;
    let out = '';
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '\\' && i + 1 < s.length) {
        const c = s[++i];
        out += c === 'n' ? '\n' : c === 't' ? '\t' : c;
      } else out += s[i];
    }
    return out;
  }

  /** 들어갈 자리의 문법에 맞게 새 문구를 이스케이프 */
  function encode(replacement, quote, ext) {
    if (quote === '`')
      return replacement.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
    if (quote)
      return replacement
        .replace(/\\/g, '\\\\')
        .replace(new RegExp(quote, 'g'), '\\' + quote)
        .replace(/\r?\n/g, '\\n');
    if (ext === '.html')
      return replacement.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // JSX 텍스트 — 중괄호·꺾쇠는 문법이라 그대로 넣을 수 없다
    if (/[{}<>]/.test(replacement))
      throw new Error('이 자리는 JSX 본문이라 { } < > 문자를 넣을 수 없습니다');
    return replacement;
  }

  /* 화면의 한 덩어리가 소스에서는 `{앞} ({가운데}) · {뒤}`처럼 여러 조각일 때가 많다.
     그러면 통째로는 찾히지 않으므로, 앞부분 몇 낱말로 좁혀 가며 다시 찾는다.
     사용자가 직접 문구를 줄이지 않아도 되게 하려는 것이고, 몇 낱말로 찾았는지는 알려 준다. */
  function locate({ text, dir, hintFile, hintLine, hintLines }) {
    const words = String(text ?? '').trim().split(/\s+/).filter(Boolean);
    const total = words.length;
    // 마지막 한 낱말까지 좁혀 본다. 너무 짧은 낱말(·, 1 등)은 아무 데나 걸리므로 뺀다
    const ladder = [0, 8, 5, 3, 2, ...(words[0]?.length >= 2 ? [1] : [])];
    for (const limit of ladder) {
      if (limit && limit >= total) continue;
      const found = locateOnce({ text, dir, hintFile, hintLine, hintLines, limit });
      if (found.length) return { candidates: found, words: limit || total, total };
    }
    return { candidates: [], words: total, total };
  }

  function locateOnce({ text, dir, hintFile, hintLine, hintLines, limit }) {
    const re = looseRegex(String(text ?? ''), limit);
    if (!re) return [];
    /* 힌트 줄은 하나가 아니라 사슬이다. 누른 글자의 가장 가까운 소스 자리는 그 글자를 그리는
       컴포넌트 정의 안일 때가 많고(예: <Head> 안의 h2), 정작 고칠 문구는 그 컴포넌트를
       부르는 쪽에 적혀 있다. 그래서 조상들의 자리를 모두 받아 가까운 쪽을 우선한다. */
    const hints = (
      Array.isArray(hintLines) && hintLines.length
        ? hintLines
        : hintLine !== undefined
          ? [hintLine]
          : []
    ).map(Number);
    const dirAbs = safeDir(dir);
    const hintAbs = hintFile ? resolve(hintFile) : null;
    const files = sourcesIn(dirAbs);
    if (hintAbs && !files.includes(hintAbs) && existsSync(hintAbs) && toRel(hintAbs).startsWith('data/'))
      files.unshift(hintAbs);
    const out = [];
    for (const abs of files) {
      const src = readFileSync(abs, 'utf8');
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(src)) && out.length < 40) {
        const line = src.slice(0, m.index).split('\n').length;
        const ls = src.lastIndexOf('\n', m.index - 1) + 1;
        let le = src.indexOf('\n', m.index + m[0].length);
        if (le < 0) le = src.length;
        const isHint = hintAbs === abs;
        const q = literalQuote(src, m.index);
        out.push({
          file: toRel(abs),
          start: m.index,
          end: m.index + m[0].length,
          expect: m[0],
          // 편집 상자에 보여 줄 꼴 — 이스케이프를 푼 것
          display: decode(m[0], q),
          line,
          preview: src.slice(ls, le).trim().slice(0, 220),
          // 방금 화면에서 누른 그 자리인가 — 같은 파일에서 소스 줄이 가까우면 그렇게 본다
          hinted: isHint && hints.some((h) => Math.abs(line - h) <= 12),
          inLiteral: !!q,
          // 누른 요소의 소스 자리에 가까울수록 위로. 사슬에서 먼 조상일수록 조금 뒤로 민다
          score:
            (isHint ? 0 : 100000) +
            (isHint && hints.length
              ? Math.min(...hints.map((h, k) => Math.abs(line - h) + k * 3))
              : 0),
        });
        if (m[0].length === 0) re.lastIndex++;
      }
    }
    const sorted = out.sort((a, b) => a.score - b.score);
    // 조상 사슬에는 슬라이드 감싸개까지 들어 있어서 여러 후보가 걸린다.
    // "누른 자리" 표시는 가장 가까운 한 곳에만 남긴다 — 둘 이상이면 표시가 쓸모없다.
    let marked = false;
    for (const c of sorted) {
      if (c.hinted && !marked) marked = true;
      else c.hinted = false;
    }
    return sorted;
  }

  function safeDir(dir) {
    const clean = decodeURIComponent(String(dir ?? '')).replace(/^\/+/, '');
    const abs = isAbsolute(clean) ? resolve(clean) : resolve(root, clean);
    const rel = toRel(abs);
    if (rel.startsWith('..') || !rel.startsWith('data/') || !existsSync(abs))
      throw new Error(`수업 폴더를 찾을 수 없습니다: ${rel}`);
    return abs;
  }

  /** 기록을 남길 수업 폴더 — 클라이언트가 준 dir이 우선, 없으면 고친 파일의 폴더 */
  function logDir(dir, abs) {
    try {
      return dir ? safeDir(dir) : abs.slice(0, abs.lastIndexOf(sep));
    } catch {
      return abs.slice(0, abs.lastIndexOf(sep));
    }
  }

  /** spots를 주면 한 파일의 여러 자리를 한꺼번에 바꾼다 (같은 문구가 nav와 본문에 함께
      있는 일이 잦다 — 한쪽만 고치면 어긋난다). 뒤에서부터 고쳐야 앞의 위치가 밀리지 않고,
      자리마다 문법이 달라서(문자열 안인지 JSX 본문인지) 이스케이프도 따로 한다. */
  async function patch({ file, start, end, expect, replacement, dir, spots }) {
    const abs = safe(file, TEXT_EXT);
    const before = readFileSync(abs, 'utf8');
    const list = (Array.isArray(spots) && spots.length ? spots : [{ start, end, expect }])
      .slice()
      .sort((a, b) => b.start - a.start);
    for (const s of list)
      if (before.slice(s.start, s.end) !== s.expect)
        throw new Error('파일이 그사이 바뀌었습니다. 문구를 다시 선택해 주세요');
    const ext = extname(abs).toLowerCase();
    let after = before;
    for (const s of list) {
      const enc = encode(String(replacement ?? ''), literalQuote(before, s.start), ext);
      after = after.slice(0, s.start) + enc + after.slice(s.end);
    }
    if (ext !== '.html') {
      try {
        await transformWithEsbuild(after, abs, { loader: ext.slice(1), jsx: 'preserve' });
      } catch (e) {
        throw new Error('저장하면 문법이 깨져서 취소했습니다: ' + esbuildWhy(e));
      }
    }
    const lineOf = (s) => before.slice(0, s).split('\n').length;
    const lines = list.map((s) => lineOf(s.start)).sort((a, b) => a - b);
    const dirAbs = logDir(dir, abs);
    write(abs, after);
    pushUndo(dirAbs, [{ file: abs, before, after }]);
    const name = toRel(abs).split('/').pop();
    appendLog(
      dirAbs,
      `문구 · \`${name}\` ${lines.join('·')}번째 줄${lines.length > 1 ? ` (${lines.length}곳 한꺼번에)` : ''}\n\n` +
        `- 이전: ${quote(list[list.length - 1].expect)}\n- 이후: ${quote(replacement)}\n`
    );
    return { ok: true, file: toRel(abs), line: lines[0], count: lines.length, undo: undo.length };
  }

  /* ── 슬라이드 조작 (순서·삭제·복제·숨김·추가) ─────────────────────
     JSX 파서를 새로 만들지 않는다. 컴파일러가 덱의 최상위 자식마다 남긴 소스 위치
     (React dev 빌드의 `element._source`)를 클라이언트가 그대로 넘겨 주므로, 그 줄을
     경계 삼아 원본을 토막 내고 순서만 바꿔 다시 붙이면 된다. 덱 34개 전부에서 이
     경계가 한 파일 안에 순서대로 놓여 있는 것을 확인하고 택한 방법이다.

     토막은 절대 다시 들여쓰지 않는다 — 여러 덱이 code={`…`} 템플릿 리터럴을 품고
     있어서, 들여쓰기를 손대면 화면에 나오는 코드가 바뀐다. */

  const HIDE_MARK = '{/* 숨김(에디터) */ false && (';
  const HIDE_RE = /^[ \t]*\{\/\* 숨김\(에디터\) \*\/ false && \(\r?$/gm;
  const eolOf = (src) => (src.includes('\r\n') ? '\r\n' : '\n');
  const isCommentLine = (l) => /^\s*\{\/\*.*\*\/\}\s*$/.test(l);

  /* dev 변환이 모듈 앞에 Fast Refresh 준비 코드를 덧붙이므로, React가 알려 주는 줄 번호는
     원본보다 일정하게 뒤로 밀려 있다(플러그인 판마다 길이가 다르다). 밀린 양은 파일 전체에
     대해 하나뿐이므로, 모든 슬라이드가 동시에 여는 꺾쇠에 떨어지는 값을 찾아 되돌린다.
     같은 들여쓰기까지 맞는 값을 우선한다. 슬라이드를 숨기면 눈에 보이는 슬라이드가 줄어
     값이 흔들릴 수 있으므로, 한 번 알아낸 값은 파일별로 기억해 두고 먼저 맞춰 본다. */
  const shiftCache = new Map();

  function shiftFits(lines, anchors, d) {
    let indent = null;
    let same = true;
    for (const [line] of anchors) {
      const L = lines[Number(line) - d - 1];
      if (L === undefined) return null;
      const t = L.trimStart();
      if (!t.startsWith('<')) return null;
      const ind = L.length - t.length;
      if (indent === null) indent = ind;
      else if (ind !== indent) same = false;
    }
    return { d, same };
  }

  function detectShift(src, anchors, absPath) {
    if (!Array.isArray(anchors) || !anchors.length) throw new Error('슬라이드 위치가 없습니다');
    const lines = src.split('\n');
    // 기억해 둔 값은 "들여쓰기까지 맞을 때"만 믿는다. 앞에 줄이 하나 끼면 한 칸 밀린
    // 자리(바로 위 줄)도 꺾쇠로 시작해 어설프게 들어맞기 때문이다.
    const cached = absPath && shiftCache.get(absPath);
    if (cached !== undefined && cached !== false && shiftFits(lines, anchors, cached)?.same)
      return cached;
    const hits = [];
    for (let d = 0; d <= 200; d++) {
      const f = shiftFits(lines, anchors, d);
      if (f) hits.push(f);
    }
    const tidy = hits.filter((h) => h.same);
    const pick = tidy.length ? tidy : hits;
    if (!pick.length)
      throw new Error('원본과 화면이 어긋났습니다. 화면을 새로 고친 뒤 다시 해 주세요');
    if (pick.length > 1) throw new Error('원본에서 슬라이드 경계를 하나로 특정하지 못했습니다');
    if (absPath) shiftCache.set(absPath, pick[0].d);
    return pick[0].d;
  }

  function lineStartAt(src, line) {
    let i = 0;
    for (let n = 1; n < line; n++) {
      const nl = src.indexOf('\n', i);
      if (nl < 0) throw new Error('원본이 그사이 짧아졌습니다. 화면을 새로 고쳐 주세요');
      i = nl + 1;
    }
    return i;
  }

  /** 슬라이드가 차지하는 줄의 시작 — 바로 위에 붙은 한 줄짜리 주석도 함께 데려간다 */
  function withLeadingComments(src, lineStart) {
    let b = lineStart;
    while (b > 0) {
      const prevStart = src.lastIndexOf('\n', b - 2) + 1;
      if (!isCommentLine(src.slice(prevStart, b - 1))) break;
      b = prevStart;
    }
    return b;
  }

  /** 원본을 슬라이드 단위로 토막 낸다. 숨긴 슬라이드는 화면에 없으므로 소스에서 찾는다. */
  function readSlides(src, anchors, absPath) {
    const shift = detectShift(src, anchors, absPath);
    const marks = [];
    HIDE_RE.lastIndex = 0;
    for (let m; (m = HIDE_RE.exec(src)); ) marks.push(m.index);
    const all = [
      ...anchors.map(([line]) => ({
        begin: withLeadingComments(src, lineStartAt(src, Number(line) - shift)),
        hidden: false,
      })),
      ...marks.map((i) => ({ begin: withLeadingComments(src, i), hidden: true })),
    ].sort((a, b) => a.begin - b.begin);
    if (!all.length) throw new Error('슬라이드를 찾지 못했습니다');
    for (let i = 1; i < all.length; i++)
      if (all[i].begin <= all[i - 1].begin)
        throw new Error('슬라이드 둘이 한 줄에 있어서 이 덱은 다루지 못합니다');
    const close = src.indexOf('</Deck>', all[all.length - 1].begin);
    if (close < 0) throw new Error('</Deck>를 찾지 못했습니다');
    const tail = src.lastIndexOf('\n', close) + 1;
    if (tail <= all[all.length - 1].begin) throw new Error('마지막 슬라이드의 끝을 찾지 못했습니다');
    const bounds = [...all.map((a) => a.begin), tail];
    const parts = all.map((a, i) => {
      const text = src.slice(bounds[i], bounds[i + 1]);
      return { ...a, text, label: text.match(/nav="([^"]*)"/)?.[1] ?? '' };
    });
    return { head: src.slice(0, bounds[0]), parts, tailText: src.slice(tail), shift };
  }

  /** 슬라이드를 `false &&`로 감싸 화면에서 뺀다. 주석으로 막지 않는 이유는 슬라이드
      안에 또 주석이 있으면 깨지기 때문이다. 괄호 안에는 식이 하나만 올 수 있으므로
      앞에 붙은 주석 줄은 밖에 남긴다. */
  function hideText(text, eol) {
    const lines = text.split(eol);
    let s = 0;
    while (s < lines.length && (lines[s].trim() === '' || isCommentLine(lines[s]))) s++;
    if (s >= lines.length) throw new Error('슬라이드 본문을 찾지 못했습니다');
    if (lines[s].includes('숨김(에디터)')) throw new Error('이미 숨긴 슬라이드입니다');
    let e = lines.length - 1;
    while (e > s && lines[e].trim() === '') e--;
    const ind = lines[s].match(/^[ \t]*/)[0];
    return [
      ...lines.slice(0, s),
      ind + HIDE_MARK,
      ...lines.slice(s, e + 1),
      ind + ')}',
      ...lines.slice(e + 1),
    ].join(eol);
  }

  function showText(text, eol) {
    const lines = text.split(eol);
    const mi = lines.findIndex((l) => l.includes('숨김(에디터)'));
    if (mi < 0) throw new Error('숨긴 슬라이드가 아닙니다');
    let e = lines.length - 1;
    while (e > mi && lines[e].trim() === '') e--;
    if (lines[e].trim() !== ')}') throw new Error('숨김 표시의 끝을 찾지 못했습니다');
    return [...lines.slice(0, mi), ...lines.slice(mi + 1, e), ...lines.slice(e + 1)].join(eol);
  }

  /** 빈 슬라이드가 쓸 Slide 컴포넌트를 불러오게 한다 (이미 있으면 그대로) */
  function ensureSlideImport(src, eol) {
    if (/^import\s+Slide\s+from\s+/m.test(src)) return src;
    const m = src.match(/^import Deck from '(.+)\/Deck';\r?$/m);
    if (!m) throw new Error('Slide를 불러올 경로를 찾지 못해 빈 슬라이드를 넣지 못했습니다');
    return src.replace(m[0].replace(/\r$/, ''), `${m[0].replace(/\r$/, '')}${eol}import Slide from '${m[1]}/Slide';`);
  }

  const attrText = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().replace(/"/g, '&quot;');
  const bodyText = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().replace(/[<>{}]/g, '');

  /** 자리만 잡은 슬라이드. 내용은 나중에 계획을 읽고 저작한다. */
  function placeholder(ind, eol, id, title, plan) {
    const t = bodyText(title) || '새 슬라이드';
    const p = bodyText(plan) || '무엇을 담을지 아직 적지 않았다';
    return (
      [
        `${ind}{/* TODO(계획) ${id} — 자리만 잡은 슬라이드다. 담을 내용은 slides-plan.md에 있다. */}`,
        `${ind}<Slide nav="⬚ ${attrText(t)}" notes="계획 · ${attrText(plan)}">`,
        `${ind}  <p className="kicker">계획만 세운 자리 · ${id}</p>`,
        `${ind}  <h2 className="headline">${t}</h2>`,
        `${ind}  <p className="lead">${p}</p>`,
        `${ind}</Slide>`,
        '',
        '',
      ].join(eol)
    );
  }

  /** 계획은 자료 폴더의 slides-plan.md에 모은다 — 나중에 인공지능이 읽고 저작한다 */
  const PLAN_HEAD = (name) =>
    `# ${name} · 만들 슬라이드 계획\n\n` +
    `> 에디터에서 자리만 잡고 내용은 비워 둔 슬라이드다. 사용자가 적어 둔 맥락을 읽고\n` +
    `> 그 자리에 들어갈 슬라이드를 저작하면 된다. 형태(씬·디오라마·화이트보드 등)는 정해져\n` +
    `> 있지 않으니 \`lesson-deck-planner\`로 판단한다. 저작을 마치면 \`deck.tsx\`의\n` +
    `> \`TODO(계획)\` 자리표시와 아래 항목을 함께 지운다.\n`;

  function appendPlan(dirAbs, id, pos, title, plan) {
    if (!dirAbs) return;
    try {
      const path = join(dirAbs, 'slides-plan.md');
      const head = existsSync(path)
        ? readFileSync(path, 'utf8').replace(/\s*$/, '\n')
        : PLAN_HEAD(dirAbs.split(sep).pop());
      const body =
        `\n## ${id} · ${pos}번째 자리${title ? ` · ${String(title).trim()}` : ''}\n\n` +
        `> ${stamp()}에 적음. 아직 비어 있다.\n\n` +
        `${String(plan ?? '').trim() || '(맥락을 적지 않았다)'}\n`;
      server?.watcher.unwatch(path);
      writeFileSync(path, head + body, 'utf8');
      setTimeout(() => server?.watcher.add(path), 400);
    } catch {
      /* 계획 기록 실패가 저장을 막지는 않는다 */
    }
  }

  /** registry.tsx의 slides 수 — 덱 하나의 값만 고친다 (일반 편집 경로가 아니다) */
  function setRegistrySlides(deckId, n, touched) {
    if (!/^[\w-]+$/.test(String(deckId ?? ''))) return null;
    const abs = resolve(root, 'src/decks/registry.tsx');
    if (!existsSync(abs)) return null;
    const src = readFileSync(abs, 'utf8');
    const re = new RegExp(`(id: '${deckId}',[\\s\\S]{0,1200}?slides: )(\\d+)(,)`);
    const m = src.match(re);
    if (!m || Number(m[2]) === n) return null;
    const out = src.replace(re, `$1${n}$3`);
    write(abs, out);
    touched.push({ file: abs, before: src, after: out });
    return { from: Number(m[2]), to: n };
  }

  /** 슬라이드가 움직이면 quiz.json의 쪽 번호도 따라 옮긴다 (번호는 보이는 쪽 기준) */
  function remapQuiz(quizFile, map, fallback, touched) {
    if (!quizFile) return [];
    let abs;
    try {
      abs = safe(quizFile, JSON_EXT);
    } catch {
      return [];
    }
    if (!existsSync(abs)) return [];
    const text = readFileSync(abs, 'utf8');
    const data = JSON.parse(text);
    if (!Array.isArray(data.activities)) return [];
    const notes = [];
    let changed = false;
    for (const a of data.activities) {
      if (!Number.isInteger(a.slide)) continue;
      const old = a.slide;
      let now = map.get(old);
      if (now === undefined) {
        // 이 문항이 붙어 있던 쪽이 사라지거나 숨겨졌다 — 지우지 않고 앞 쪽으로 옮기고 크게 남긴다
        now = Math.max(0, fallback);
        notes.push(
          `- ⚠ \`${a.id}\`이(가) 붙어 있던 ${old + 1}쪽이 화면에서 빠져서 ${now + 1}쪽으로 옮겼다 — 확인이 필요하다`
        );
      } else if (now === old) continue;
      else notes.push(`- \`${a.id}\` ${old + 1}쪽 → ${now + 1}쪽`);
      a.slide = now;
      changed = true;
    }
    if (!changed) return [];
    const out = JSON.stringify(data, null, 2) + '\n';
    write(abs, out);
    touched.push({ file: abs, before: text, after: out });
    return notes;
  }

  const OP_LABEL = {
    move: '순서 바꿈',
    delete: '삭제',
    duplicate: '복제',
    hide: '숨김',
    show: '다시 보이기',
    insert: '빈 슬라이드 추가',
  };

  async function slides(body) {
    const { file, anchors, op, index, to, dir, deckId, quizFile, title, plan } = body;
    const abs = safe(file, TEXT_EXT);
    if (extname(abs).toLowerCase() !== '.tsx')
      throw new Error('네이티브 React 덱(deck.tsx)에서만 슬라이드를 다룰 수 있습니다');
    const before = readFileSync(abs, 'utf8');
    const eol = eolOf(before);
    let { head, parts, tailText } = readSlides(before, anchors, abs);
    const n = parts.length;
    const i = Number(index);
    if (!(i >= 0 && i < n)) throw new Error('슬라이드 번호가 범위를 벗어났습니다');

    // next[k] = { from: 옛 토막 번호(새로 넣었으면 null), hidden, text }
    let next = parts.map((p, k) => ({ from: k, hidden: p.hidden, text: p.text }));
    let planId = null;
    if (op === 'move') {
      const j = Number(to);
      if (!(j >= 0 && j < n)) throw new Error('옮길 자리가 범위를 벗어났습니다');
      if (j === i) return { ok: true, file: toRel(abs), slides: n, undo: undo.length, skipped: true };
      next.splice(j, 0, next.splice(i, 1)[0]);
    } else if (op === 'delete') {
      if (n < 2) throw new Error('슬라이드가 하나뿐이라 지울 수 없습니다');
      next.splice(i, 1);
    } else if (op === 'duplicate') {
      next.splice(i + 1, 0, { ...next[i] });
    } else if (op === 'hide') {
      if (parts.filter((p) => !p.hidden).length < 2)
        throw new Error('보이는 슬라이드가 하나뿐이라 숨길 수 없습니다');
      next[i] = { ...next[i], hidden: true, text: hideText(next[i].text, eol) };
    } else if (op === 'show') {
      next[i] = { ...next[i], hidden: false, text: showText(next[i].text, eol) };
    } else if (op === 'insert') {
      const ind = (parts[i].text.split(eol).find((l) => l.trim().startsWith('<')) ?? '      ').match(
        /^[ \t]*/
      )[0];
      planId = `plan-${Date.now().toString(36).slice(-5)}`;
      // import는 첫 슬라이드 앞(head)에 있다. 원본을 다시 읽으면 줄 번호가 밀리므로
      // 이미 잘라 둔 head만 고친다.
      head = ensureSlideImport(head, eol);
      next.splice(i + 1, 0, {
        from: null,
        hidden: false,
        text: placeholder(ind, eol, planId, title, plan),
      });
    } else throw new Error(`모르는 조작입니다: ${op}`);

    const after = head + next.map((x) => x.text).join('') + tailText;
    try {
      await transformWithEsbuild(after, abs, { loader: 'tsx', jsx: 'preserve' });
    } catch (e) {
      throw new Error('저장하면 문법이 깨져서 취소했습니다: ' + esbuildWhy(e));
    }

    // 보이는 쪽 번호가 어떻게 옮겨졌는지 — quiz.json이 이 표를 쓴다
    const oldVis = new Map();
    let v = 0;
    parts.forEach((p, k) => {
      if (!p.hidden) oldVis.set(k, v++);
    });
    const newVisOfOld = new Map();
    let w = 0;
    for (const x of next) {
      if (!x.hidden) {
        if (x.from !== null && !newVisOfOld.has(x.from)) newVisOfOld.set(x.from, w);
        w++;
      }
    }
    const map = new Map();
    for (const [oldPart, oldV] of oldVis) {
      const nv = newVisOfOld.get(oldPart);
      if (nv !== undefined) map.set(oldV, nv);
    }

    const dirAbs = logDir(dir, abs);
    // 되돌릴 대상은 디스크에 있는 원본이다 (import를 더한 before가 아니다)
    const touched = [{ file: abs, before: readFileSync(abs, 'utf8'), after }];
    write(abs, after);

    // 복제는 같은 옛 번호가 두 번 나오므로 문항을 어느 쪽에 붙일지 알 수 없다 — 건드리지 않는다
    const quizNotes =
      op === 'duplicate' ? [] : remapQuiz(quizFile, map, Math.max(0, (oldVis.get(i) ?? 1) - 1), touched);
    const reg = op === 'move' ? null : setRegistrySlides(deckId, w, touched);
    pushUndo(dirAbs, touched);
    if (planId) appendPlan(dirAbs, planId, i + 2, title, plan);

    appendLog(
      dirAbs,
      `슬라이드 · ${OP_LABEL[op]}\n\n` +
        `- ${i + 1}번째 슬라이드${op === 'move' ? ` → ${Number(to) + 1}번째 자리` : ''}` +
        ` (전체 ${n}장 → ${next.length}장, 화면에 보이는 것 ${oldVis.size}장 → ${w}장)\n` +
        (reg ? `- registry.tsx의 slides: ${reg.from} → ${reg.to}\n` : '') +
        (op === 'move' ? '- 슬라이드 번호를 적어 둔 주석은 그대로다\n' : '') +
        (planId
          ? `- 자리만 잡았다. 담을 내용은 slides-plan.md의 \`${planId}\` 항목을 보고 저작한다\n`
          : '') +
        (op === 'duplicate' ? '- 복제본의 문구와 발표자 노트는 아직 원본과 같다\n' : '') +
        (quizNotes.length
          ? '- quiz.json 쪽 번호를 따라 옮겼다\n' + quizNotes.map((l) => '  ' + l).join('\n') + '\n'
          : '')
    );
    return { ok: true, file: toRel(abs), slides: w, undo: undo.length, planId };
  }

  /* ── 위치·크기 ─────────────────────────────────────────────────────
     씬·워크스루의 구체적인 값을 다 열어 주는 것은 무리다. 대신 "요소를 통째로 옮기고
     키우는" 것만 연다. 이 저장소의 덱은 자리를 두 가지 꼴로만 적는다.
       ① abs(x, y, w, h) — 숫자를 바로 적은 호출 (덱 4개에 515곳)
       ② const WIN1 = { x: 60, y: 208, w: 640, h: 420 } — 이름 붙인 상자
     둘 다 숫자 리터럴이라 그 자리만 고쳐 쓸 수 있다. 계산해서 만든 좌표는 다루지 않는다. */

  const ABS_RE = /\babs\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:,\s*(-?[\d.]+)\s*)?(?:,\s*(-?[\d.]+)\s*)?\)/g;
  const NUM_KEY = /\b([a-z][a-zA-Z0-9]*)\s*:\s*(-?[\d.]+)\b/g;

  /** 이름 붙인 상자 — `const NAME = { x: 1, y: 2, … };` 한 줄짜리만 본다 */
  function findRect(src, name) {
    const re = new RegExp(`^const ${name}\\s*=\\s*\\{([^}]*)\\}\\s*;`, 'm');
    const m = src.match(re);
    if (!m) return null;
    const nums = {};
    NUM_KEY.lastIndex = 0;
    for (let k; (k = NUM_KEY.exec(m[1])); ) nums[k[1]] = Number(k[2]);
    if (!Object.keys(nums).length) return null;
    return { start: m.index, end: m.index + m[0].length, text: m[0], nums, name };
  }

  /** 집은 요소와 그 위 조상들의 소스 줄 언저리에서 고칠 수 있는 자리를 모은다.
      글자를 눌렀어도 옮기고 싶은 것은 그 글자를 담은 상자나 창일 때가 많다. */
  function findGeometry({ file, line, lines: hintLines }) {
    const list = Array.isArray(hintLines) && hintLines.length ? hintLines : [line];
    const seenRect = new Set();
    const all = [];
    list.slice(0, 5).forEach((ln, depth) => {
      for (const it of findGeometryAt(file, ln, seenRect))
        all.push({ ...it, dist: it.dist + depth * 20 });
    });
    return { items: all.sort((a, b) => a.dist - b.dist).slice(0, 6) };
  }

  function findGeometryAt(file, line, seen) {
    const abs = safe(file, TEXT_EXT);
    const src = readFileSync(abs, 'utf8');
    const lines = src.split('\n');
    const at = Math.max(1, Number(line) || 1);
    const from = Math.max(0, at - 2);
    const to = Math.min(lines.length, at + 10);
    // 줄 → 파일 안 위치
    const offsetOf = (i) => lines.slice(0, i).reduce((s, l) => s + l.length + 1, 0);
    const items = [];
    for (let i = from; i < to; i++) {
      const L = lines[i];
      const base = offsetOf(i);
      ABS_RE.lastIndex = 0;
      for (let m; (m = ABS_RE.exec(L)); ) {
        const nums = { x: Number(m[1]), y: Number(m[2]) };
        if (m[3] !== undefined) nums.w = Number(m[3]);
        if (m[4] !== undefined) nums.h = Number(m[4]);
        items.push({
          kind: 'abs',
          start: base + m.index,
          end: base + m.index + m[0].length,
          text: m[0],
          nums,
          line: i + 1,
          label: '이 요소의 자리',
          dist: Math.abs(i + 1 - at),
        });
      }
      // NAME.x / NAME.w 처럼 상자를 참조하는 자리 → 그 상자의 정의를 연다
      for (let m2, r = /\b([A-Z][A-Z0-9_]{1,})\.(x|y|w|h|left|top|width|height)\b/g; (m2 = r.exec(L)); ) {
        if (seen.has(m2[1])) continue;
        const rect = findRect(src, m2[1]);
        if (!rect) continue;
        seen.add(m2[1]);
        items.push({
          kind: 'rect',
          start: rect.start,
          end: rect.end,
          text: rect.text,
          nums: rect.nums,
          line: src.slice(0, rect.start).split('\n').length,
          label: `${m2[1]} — 이름 붙인 상자`,
          dist: Math.abs(i + 1 - at) + 0.5,
        });
      }
    }
    return items;
  }

  /** 고른 숫자만 바꿔 넣는다. 서식과 나머지 열쇠는 그대로 둔다. */
  function rebuildGeometry(kind, text, nums) {
    if (kind === 'abs') {
      const order = ['x', 'y', 'w', 'h'].filter((k) => nums[k] !== undefined && nums[k] !== null);
      return `abs(${order.map((k) => nums[k]).join(', ')})`;
    }
    let out = text;
    for (const [k, v] of Object.entries(nums)) {
      const re = new RegExp(`(\\b${k}\\s*:\\s*)-?[\\d.]+`);
      if (re.test(out)) out = out.replace(re, `$1${v}`);
    }
    return out;
  }

  /* ── 워크스루 포인터 자동 재측정 ──────────────────────────────────
     포인터가 찍는 자리(TG21 등)는 계산값이 아니라 브라우저에서 한 번 재서 적어 둔 값이다.
     창을 옮기거나 키우면 화면은 멀쩡한데 마우스만 옛 자리를 가리킨다 — 조용히 틀리는 고장이다.
     그래서 자리를 고칠 때마다 다시 재서 고쳐 쓴다.

     어느 시각에 어느 대상을 찍는지는 소스를 뜯지 않고 알아낸다. 고치기 **전에** 한 번 재서
     "화살촉이 대상 안에 있는" 짝을 기억해 두고, 고친 **뒤에** 같은 시각에 그 대상의 새 중심을
     읽어 넣는다. 대상은 창을 따라 움직이지만 어느 대상을 찍으려 했는지는 변하지 않는다.
     재는 일은 walkthrough 스킬의 measure_pointer.mjs에 맡긴다(같은 자를 쓴다). */

  const MEASURE = '.claude/skills/software-walkthrough-builder/scripts/measure_pointer.mjs';

  /** 고친 자리에서 가장 가까운 시각표(`const T21 = { … }`)의 숫자들.
      워크스루 컴포넌트는 자기 시각표를 바로 위에 두므로 앞쪽에서 가장 가까운 것을 고른다.
      (창 좌표·포인터 좌표는 <Deck> 자식 바깥에 있어서 슬라이드 범위로는 못 가른다.) */
  function walkTimes(src, offset) {
    const tables = [];
    for (let m, re = /^const T\d+\s*=\s*\{([^}]*)\}/gm; (m = re.exec(src)); )
      tables.push({ at: m.index, body: m[1] });
    if (!tables.length) return [];
    const before = tables.filter((t) => t.at <= offset);
    const pick = before.length ? before[before.length - 1] : tables[0];
    const out = new Set();
    // 시각표의 열쇠는 CARD·TRAIN_ON처럼 대문자다 (상자의 x·y와 규칙이 다르다)
    for (let k, re = /\b[A-Za-z][A-Za-z0-9_]*\s*:\s*(-?[\d.]+)/g; (k = re.exec(pick.body)); )
      out.add(Number(k[1]));
    return [...out].filter((t) => t > 0).sort((a, b) => a - b);
  }

  async function measure(deckId, slideNo, times) {
    const { execFile } = await import('node:child_process');
    const port = server?.config?.server?.port ?? 5199;
    return new Promise((done) => {
      execFile(
        process.execPath,
        [resolve(root, MEASURE), deckId, String(slideNo), times.join(','), '--json'],
        { cwd: root, env: { ...process.env, SMOKE_BASE: `http://localhost:${port}` }, timeout: 180000 },
        (err, stdout) => {
          if (err) return done(null);
          try {
            done(JSON.parse(stdout.slice(stdout.indexOf('{'))));
          } catch {
            done(null);
          }
        }
      );
    });
  }

  /** 어느 시각에 어느 대상을 찍으려 했는지 — 재 본 결과에서 뽑는다.
      포인터 경로가 대상 중심을 그대로 쓰므로, 진짜 클릭 순간에는 거리가 거의 0이다.
      대상 하나당 **가장 정확히 겨눈 순간 하나만** 남긴다. 창이 움직이는 도중에도
      우연히 가까워지는 순간이 있어서, 그것까지 세면 엉뚱한 값을 집어 온다. */
  function hitPairs(m) {
    const best = new Map();
    for (const [t, r] of Object.entries(m ?? {})) {
      if (!r?.tip) continue;
      for (const [name, c] of Object.entries(r.targets ?? {})) {
        const d = Math.hypot(r.tip[0] - c[0], r.tip[1] - c[1]);
        if (d > 1.5) continue;
        const cur = best.get(name);
        if (!cur || d < cur.d) best.set(name, { t: Number(t), d });
      }
    }
    return [...best].map(([name, v]) => ({ name, t: v.t }));
  }

  /** TG21.card = { x, y } 한 자리를 고쳐 쓴다. 이름은 data-pt의 `w1-card` 꼴에서 따온다 */
  function writeTarget(src, key, xy) {
    const re = new RegExp(`(\\b${key}\\s*:\\s*\\{\\s*x:\\s*)-?[\\d.]+(\\s*,\\s*y:\\s*)-?[\\d.]+`);
    if (!re.test(src)) return null;
    return src.replace(re, `$1${xy[0]}$2${xy[1]}`);
  }

  async function repairPointer({ deckId, slideNo, absPath, before, touched }) {
    // 고치기 전에 알아낸 (시각, 대상) 짝의 시각만 다시 잰다 — 시각표 전체를 다시 재면 두 배 걸린다
    const times = [...new Set(before.pairs.map((p) => p.t))];
    if (!times.length) return { skipped: '찍는 자리를 찾지 못했다' };
    const after = await measure(deckId, slideNo, times);
    if (!after) return { skipped: '다시 재지 못했다 (dev 서버 확인)' };
    const fixes = [];
    let src = readFileSync(absPath, 'utf8');
    for (const { t, name } of before.pairs) {
      const c = after[t]?.targets?.[name];
      if (!c) continue;
      const key = name.replace(/^w\d+-/, '');
      const next = writeTarget(src, key, c);
      if (next && next !== src) {
        src = next;
        fixes.push(`${key} → { x: ${c[0]}, y: ${c[1]} }`);
      }
    }
    if (!fixes.length) return { fixes: [], misses: [] };
    const prev = readFileSync(absPath, 'utf8');
    write(absPath, src);
    touched.push({ file: absPath, before: prev, after: src });

    // 고쳐 놓고 끝내지 않는다 — 다시 재서 화살촉이 실제로 대상에 닿는지 확인한다.
    // 조용히 빗나가는 것이 이 기능을 만든 이유이므로, 못 맞춘 자리는 그대로 알린다.
    await new Promise((r) => setTimeout(r, 1200));
    const check = await measure(deckId, slideNo, times);
    const misses = [];
    for (const { t, name } of before.pairs) {
      const r = check?.[t];
      const c = r?.targets?.[name];
      if (!r?.tip || !c) continue;
      const d = Math.hypot(r.tip[0] - c[0], r.tip[1] - c[1]);
      if (d > 1.5) misses.push(`${name} (${d.toFixed(1)}%p 어긋남)`);
    }
    return { fixes, misses };
  }

  async function saveGeometry(body) {
    const { file, start, end, expect, kind, nums, dir, deckId, slideNo } = body;
    const abs = safe(file, TEXT_EXT);
    const before = readFileSync(abs, 'utf8');
    if (before.slice(start, end) !== expect)
      throw new Error('파일이 그사이 바뀌었습니다. 다시 고른 뒤 해 주세요');

    // 워크스루라면 고치기 전에 포인터가 무엇을 찍고 있었는지 먼저 재 둔다.
    // 지금 보고 있는 쪽에 클릭 대상과 포인터가 있는지는 화면 쪽이 판정해 알려 준다.
    let walk = null;
    if (body.walkthrough && deckId && slideNo) {
      const times = walkTimes(before, start);
      if (!times.length) walk = { pairs: [], skipped: '시각표를 찾지 못했다' };
      else walk = { pairs: hitPairs(await measure(deckId, slideNo, times)) };
    }

    const after = before.slice(0, start) + rebuildGeometry(kind, expect, nums) + before.slice(end);
    try {
      await transformWithEsbuild(after, abs, { loader: 'tsx', jsx: 'preserve' });
    } catch (e) {
      throw new Error('저장하면 문법이 깨져서 취소했습니다: ' + esbuildWhy(e));
    }
    const dirAbs = logDir(dir, abs);
    const touched = [{ file: abs, before, after }];
    write(abs, after);

    let repair = null;
    if (walk?.pairs?.length) {
      // HMR이 새 자리를 반영할 틈을 준다
      await new Promise((r) => setTimeout(r, 1200));
      repair = await repairPointer({ deckId, slideNo, absPath: abs, before: walk, touched });
    }
    pushUndo(dirAbs, touched);

    const line = before.slice(0, start).split('\n').length;
    appendLog(
      dirAbs,
      `자리·크기 · \`${toRel(abs).split('/').pop()}\` ${line}번째 줄\n\n` +
        `- 이전: ${quote(expect)}\n- 이후: ${quote(rebuildGeometry(kind, expect, nums))}\n` +
        (repair?.fixes?.length
          ? `- 워크스루 포인터를 다시 재서 고쳤다\n` + repair.fixes.map((f) => `  - ${f}`).join('\n') + '\n'
          : walk
            ? `- 워크스루 슬라이드다. ${repair?.skipped ?? '포인터 좌표는 바뀌지 않았다'}\n`
            : '') +
        (repair?.misses?.length
          ? `- ⚠ 다시 재고도 화살촉이 닿지 않는 자리가 있다: ${repair.misses.join(', ')}\n`
          : '')
    );
    return {
      ok: true,
      file: toRel(abs),
      line,
      undo: undo.length,
      walkthrough: !!walk,
      fixes: repair?.fixes ?? [],
      misses: repair?.misses ?? [],
      skipped: repair?.skipped ?? walk?.skipped ?? null,
    };
  }

  const routes = {
    'GET /__edit/info': () => ({ root: root.split(sep).join('/'), undo: undo.length }),
    'POST /__edit/geometry': (body) => findGeometry(body),
    'POST /__edit/geometry/save': (body) => saveGeometry(body),
    'POST /__edit/locate': (body) => locate(body),
    'POST /__edit/patch': (body) => patch(body),
    // 덱을 읽은 직후 한 번 — 줄 번호 밀림을 재고, 이 덱의 슬라이드를 옮길 수 있는지 답한다
    'POST /__edit/anchors': ({ file, anchors }) => {
      const abs = safe(file, TEXT_EXT);
      try {
        const src = readFileSync(abs, 'utf8');
        const { parts, shift } = readSlides(src, anchors, abs);
        // 숨긴 슬라이드는 화면에 없으므로 레일이 그릴 수 있게 소스에서 읽어 함께 돌려준다
        return {
          ok: true,
          shift,
          list: parts.map((p) => ({ hidden: p.hidden, label: p.label })),
        };
      } catch (e) {
        return { ok: false, reason: String(e.message) };
      }
    },
    'POST /__edit/slides': (body) => slides(body),
    'POST /__edit/undo': () => {
      const last = undo.pop();
      if (!last) throw new Error('되돌릴 저장 기록이 없습니다');
      // 한 파일이라도 밖에서 바뀌었으면 통째로 물러나지 않는다 (반만 되돌리면 더 나쁘다)
      for (const f of last.files) {
        const now = existsSync(f.file) ? readFileSync(f.file, 'utf8') : null;
        if (now !== f.after) {
          undo.push(last);
          throw new Error(
            `${toRel(f.file).split('/').pop()}이(가) 에디터 밖에서 바뀌어서 되돌리지 않았습니다`
          );
        }
      }
      for (const f of last.files) write(f.file, f.before);
      const names = last.files.map((f) => toRel(f.file).split('/').pop());
      // 되돌리기도 기록한다 — 앞 항목을 지우면 "무엇을 시도했다가 물렀는지"가 사라진다
      appendLog(last.dir, `되돌리기 · \`${names.join('`, `')}\` — 바로 앞 저장을 물렀다\n`);
      return { ok: true, file: names[0], files: names, undo: undo.length };
    },
    'GET /__edit/json': (_b, q) => {
      const abs = safe(q.get('file'), JSON_EXT);
      if (!existsSync(abs)) return { exists: false, data: null };
      return { exists: true, data: JSON.parse(readFileSync(abs, 'utf8')) };
    },
    'POST /__edit/json': ({ file, data, dir }) => {
      const abs = safe(file, JSON_EXT);
      if (data === undefined || data === null) throw new Error('data가 없습니다');
      const dirAbs = logDir(dir, abs);
      const had = existsSync(abs);
      const prevText = had ? readFileSync(abs, 'utf8') : '';
      const prev = had ? JSON.parse(prevText) : null;
      // 저장소의 JSON 관례: 들여쓰기 2칸 + 끝 개행 (stamp-created.mjs와 동일)
      const text = JSON.stringify(data, null, 2) + '\n';
      write(abs, text);
      // 새로 만든 파일은 되돌릴 이전 내용이 없으므로 스택에 넣지 않는다
      if (had) pushUndo(dirAbs, [{ file: abs, before: prevText, after: text }]);
      const name = toRel(abs).split('/').pop();
      const lines = name === 'quiz.json' ? diffQuiz(prev, data) : [];
      appendLog(
        dirAbs,
        `문항 · \`${name}\`${had ? '' : ' (새로 만듦)'}\n\n` +
          (lines.length ? lines.join('\n') + '\n' : '- 내용이 달라진 문항은 없다\n')
      );
      return { ok: true, file: toRel(abs), undo: undo.length };
    },
  };

  return {
    name: 'deck-editor-api',
    apply: 'serve',
    configResolved(config) {
      root = config.root;
    },
    configureServer(s) {
      server = s;
      s.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        const handler = routes[`${req.method} ${url.pathname}`];
        if (!handler) return next();
        const send = (code, obj) => {
          res.statusCode = code;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(obj));
        };
        // dev 서버를 --host로 열어도 다른 기기에서는 파일을 못 고치게 한다
        const ip = req.socket.remoteAddress ?? '';
        if (!/^(::1|::ffff:127\.|127\.)/.test(ip)) return send(403, { error: '로컬에서만 쓸 수 있습니다' });
        // 다른 사이트가 열어 둔 탭에서 localhost로 쏘는 요청(CSRF)도 막는다
        const origin = req.headers.origin;
        if (origin && new URL(origin).host !== req.headers.host)
          return send(403, { error: '에디터 화면에서만 쓸 수 있습니다' });
        try {
          let body = {};
          if (req.method === 'POST') {
            const chunks = [];
            for await (const c of req) chunks.push(c);
            body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
          }
          send(200, await handler(body, url.searchParams));
        } catch (e) {
          send(400, { error: String(e?.message ?? e) });
        }
      });
    },
  };
}
