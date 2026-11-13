// 나레이션 1/3 — 슬라이드 소스의 자막(SUBS)을 읽어 video/narration.json 을 만들거나 갱신한다.
// 자막이 곧 대본이다(화면 글자와 목소리가 어긋나지 않게). 읽기용 문장은 say 에 두며,
// 사람이 say 를 고쳐 둔 줄은 자막이 바뀌지 않는 한 그대로 둔다.
//
// 사용: node video/subs.mjs        (이 수업 폴더 안 어디서든)
// 결과: video/narration.json — [{ key, slide, idx, at?, text, say }]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SLIDES = path.join(HERE, '..', 'slides');
const OUT = path.join(HERE, 'narration.json');

/** `const SUBS ... = [` 의 배열 리터럴을 괄호 짝으로 잘라 평가한다 (문자열·숫자만 든 리터럴) */
function readSubs(src, file) {
  const m = /const SUBS[^=]*=\s*\[/.exec(src);
  if (!m) throw new Error(`${file}: SUBS 없음`);
  let i = m.index + m[0].length - 1;
  let depth = 0;
  let q = null;
  const start = i;
  for (; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '\\') i++;
      else if (c === q) q = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') q = c;
    else if (c === '[') depth++;
    else if (c === ']' && --depth === 0) break;
  }
  // at 이 `T.NOTE` 처럼 같은 파일의 단순 상수를 쓰는 경우가 있어, SUBS 앞의 숫자·객체 리터럴 상수를 함께 평가한다
  const consts = [...src.slice(0, m.index).matchAll(/^const (\w+)\s*=\s*(-?[\d.]+|\{[^;{}]*\});/gm)]
    .map(([, k, v]) => `const ${k} = ${v};`)
    .join('\n');
  return new Function(`${consts}\nreturn ${src.slice(start, i + 1)}`)();
}

/** 화면용 기호를 걷어 읽기 좋은 문장으로 — 고칠 발음은 narration.json 의 say 에서 손으로 */
function speakable(text) {
  return text
    .replace(/[«»]/g, '')
    .replace(/\[([^\]]+)\]/g, '$1')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : [];
const keep = new Map(prev.map((l) => [l.key, l]));
const lines = [];
for (const f of fs.readdirSync(SLIDES).filter((f) => /^s\d+\.tsx$/.test(f)).sort()) {
  const slide = Number(f.slice(1, 3));
  const subs = readSubs(fs.readFileSync(path.join(SLIDES, f), 'utf8'), f);
  subs.forEach((s, idx) => {
    const text = typeof s === 'string' ? s : s.text;
    const key = `s${String(slide).padStart(2, '0')}_${idx}`;
    const old = keep.get(key);
    const say = old && old.text === text ? old.say : speakable(text);
    lines.push({ key, slide, idx, ...(typeof s === 'string' ? {} : { at: s.at }), text, say });
  });
}
fs.writeFileSync(OUT, JSON.stringify(lines, null, 1) + '\n');
const changed = lines.filter((l) => keep.get(l.key)?.text !== l.text).length;
console.log(`${lines.length}줄 (새로 쓰거나 바뀐 줄 ${changed})  →  ${path.relative(process.cwd(), OUT)}`);
