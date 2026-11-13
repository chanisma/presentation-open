// assets/pyrun/py-runner.js — 교육용 파이썬 실행기 웹 컴포넌트 <py-runner>
//
// 덱(React 감싸개 src/pyrun/PyRunner.tsx)과 정적 HTML 활동지가 같은 부품을 쓴다.
//   <script type="module" src="…/assets/pyrun/py-runner.js"></script>
//   <py-runner vars step dots persist="ex1">
//     <script type="text/x-python">
//   name = "민지"
//   print(name)
//     </script>
//   </py-runner>
//
// 속성
//   vars              변수 상자 보이기
//   step              한 줄씩 보기 단추 보이기 (mode="step"이면 기본 동작도 한 줄씩)
//   mode="step"       처음부터 한 줄씩 보기 모드
//   dots              들여쓰기 빈칸을 옅은 점으로 표시
//   layout="stack"    편집 칸 위, 변수 상자·출력 아래 (기본은 좌우)
//   rows="8"          편집 칸 최소 줄 수
//   readonly          편집 금지
//   mask="2-3"        그 줄들을 흐리게 가린다 ([가린 줄 보기] 단추가 생긴다)
//   predict           실행 전에 출력 예측을 먼저 적어야 실행 단추가 열린다
//   persist="key"     쓰던 코드를 브라우저(localStorage)에 임시 보관
//   lazy              화면에 붙어도 엔진을 미리 불러오지 않는다
//   label="…"         머리 띠 제목 (기본 "파이썬")
//   inputs='["2"]'    미리 넣은 입력 (JSON 문자열 배열, 또는 줄마다 하나). input()이 차례로 이 값을 받는다
//   types             변수 상자에 자료형 이름(문자열 str · 정수형 int · 실수형 float)을 표시하고 정수·실수를 색으로 나눈다
// 속성(프로퍼티)
//   .code             현재 코드 (설정하면 처음 코드도 바뀐다)
//   .inputs           미리 넣은 입력 배열
//   .checks           [{label, inputs?, test(result) => boolean}] 자동 점검 규칙.
//                     inputs가 있으면 그 시험 입력으로 따로 실행한 결과(입력 줄을 열지 않는다)를 test에 넘긴다
// 입력 — input()은 "다시 실행" 방식이다. 입력 기록이 떨어지면 출력 칸에 입력 줄을 열고,
//   값을 받으면 기록에 더해 처음부터 다시 실행한다(출력은 교체되므로 이어서 실행된 것처럼 보인다).
//   코드를 고치거나 [▶ 실행]·[↺ 처음 코드로]를 누르면 기록을 버린다.
// 이벤트 (bubbles · composed)
//   pyrun-run         {code, output, prog, error, vars, info, checks, prediction, inputs, status} — 실행이 끝났을 때만
//   pyrun-input       {prompt, inputs} — 입력을 기다리기 시작할 때
//   pyrun-change      {code}
//   pyrun-step        {step, steps, line, vars, frames, output} — 한 줄씩 보기에서 단계를 옮길 때
// 자가 점검 API
//   el.run() · el.setCode(s) · el.getCode() · el.next() · el.prev() · el.getState()
//   el.sendInput(s) — 기다리는 입력 줄에 값을 보낸다 · el.test(inputs) — 시험 입력으로 실행한 결과(화면은 그대로)
//   window.__pyrun.list() — 페이지의 모든 실행기

import { run as engineRun, preload, onStatus } from './engine.js';
import { explain, original } from './explain.js';

const CSS = String.raw`
:host {
  --pr-font: var(--pyrun-font, 16px);
  --pr-ui: var(--pyrun-ui-font, 15px);
  --pr-editor: var(--pyrun-editor, #1d2433);
  --pr-editor-ink: var(--pyrun-editor-ink, #e6e9f2);
  --pr-paper: var(--pyrun-paper, #fbf8f1);
  --pr-ink: var(--pyrun-ink, #1f1a14);
  --pr-mute: var(--pyrun-mute, #6b6357);
  --pr-primary: var(--pyrun-primary, #2346a0);
  --pr-tag: var(--pyrun-tag, #d6336c);
  --pr-str: var(--pyrun-str, #c2410c);
  --pr-num: var(--pyrun-num, #2346a0);
  --pr-ok: var(--pyrun-ok, #1f7a4d);
  --pr-err: var(--pyrun-err, #c0392b);
  --pr-mono: var(--pyrun-mono, 'JetBrains Mono', 'D2Coding', Consolas, 'Malgun Gothic', monospace);
  --pr-sans: var(--pyrun-sans, 'Pretendard', 'Noto Sans KR', 'Malgun Gothic', system-ui, sans-serif);
  --pr-lh: 1.62;
  display: block;
  font-family: var(--pr-sans);
  font-size: var(--pr-ui);
  color: var(--pr-ink);
}
* { box-sizing: border-box; }
.root {
  height: 100%;
  display: flex; flex-direction: column;
  background: var(--pr-paper);
  border: 2px solid color-mix(in srgb, var(--pr-ink) 16%, transparent);
  border-radius: 1.1em;
  overflow: hidden;
  box-shadow: 0 1.4em 3em -2.2em color-mix(in srgb, var(--pr-ink) 60%, transparent);
}
button { font: inherit; cursor: pointer; }
/* 머리 띠 */
.bar {
  display: flex; align-items: center; gap: .55em;
  padding: .55em .7em .55em 1em;
  border-bottom: 1.5px solid color-mix(in srgb, var(--pr-ink) 12%, transparent);
  flex-wrap: wrap;
}
.title { font-weight: 800; letter-spacing: -.01em; }
.status { display: inline-flex; align-items: center; gap: .4em; font-size: .86em; color: var(--pr-mute); white-space: nowrap; }
.status i { width: .62em; height: .62em; border-radius: 50%; background: #b9b1a3; display: inline-block; }
.status[data-s="loading"] i, .status[data-s="running"] i { background: #e0a100; animation: blink 1s infinite; }
.status[data-s="ready"] i { background: var(--pr-ok); }
.status[data-s="error"] i { background: var(--pr-err); }
@keyframes blink { 50% { opacity: .25; } }
.grow { flex: 1; }
.btn {
  border: 1.5px solid color-mix(in srgb, var(--pr-ink) 22%, transparent);
  background: transparent; color: var(--pr-ink);
  border-radius: .6em; padding: .38em .8em; font-weight: 650; white-space: nowrap;
}
.btn:hover:not(:disabled) { background: color-mix(in srgb, var(--pr-ink) 7%, transparent); }
.btn:disabled { opacity: .38; cursor: not-allowed; }
.btn.run {
  background: var(--pr-primary); border-color: var(--pr-primary); color: #fff;
  padding: .42em 1.05em; font-weight: 800;
}
.btn.run:hover:not(:disabled) { background: color-mix(in srgb, var(--pr-primary) 85%, #000); }
.btn.run kbd { font: 600 .72em var(--pr-mono); opacity: .75; margin-left: .45em; }
.stepper { display: inline-flex; align-items: center; gap: .35em; }
.stepper .count { font: 650 .86em var(--pr-mono); color: var(--pr-mute); min-width: 4.6em; text-align: center; }
.btn.step { border-color: color-mix(in srgb, var(--pr-primary) 45%, transparent); color: var(--pr-primary); }
/* 예측 */
.predict { padding: .7em 1em; border-bottom: 1.5px dashed color-mix(in srgb, var(--pr-ink) 18%, transparent); background: color-mix(in srgb, #f6c445 14%, var(--pr-paper)); }
.predict label { font-weight: 750; display: block; margin-bottom: .35em; }
.predict label small { font-weight: 500; color: var(--pr-mute); margin-left: .4em; }
.predict textarea { width: 100%; min-height: 4.2em; font: var(--pr-font)/1.5 var(--pr-mono); border: 1.5px solid color-mix(in srgb, var(--pr-ink) 22%, transparent); border-radius: .5em; padding: .45em .6em; background: #fff; color: var(--pr-ink); resize: vertical; }
/* 본문 */
.body { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr); }
:host([layout="stack"]) .body { grid-template-columns: 1fr; grid-template-rows: auto auto; }
:host(:not([vars])) .vars { display: none; }
/* 편집 칸 */
.ed { background: var(--pr-editor); color: var(--pr-editor-ink); overflow: auto; position: relative; min-height: 0; }
.inner { display: flex; min-width: 100%; width: max-content; padding: .7em 0; font: var(--pr-font)/var(--pr-lh) var(--pr-mono); }
.gutter { padding: 0 .7em 0 .9em; text-align: right; color: #6d7891; user-select: none; flex-shrink: 0; }
.gutter div { height: calc(var(--pr-font) * var(--pr-lh)); }
.gutter div.cur { color: #ffd166; font-weight: 700; }
.gutter div.err { color: #ff8a80; font-weight: 700; }
.codecol { position: relative; flex: 1; padding-right: 1.2em; }
.hl { margin: 0; font: inherit; white-space: pre; pointer-events: none; }
.hl .ln { height: calc(var(--pr-font) * var(--pr-lh)); padding-left: .2em; border-radius: .25em; }
.hl .ln.cur { background: rgba(255, 209, 102, .16); box-shadow: inset .22em 0 0 #ffd166; }
.hl .ln.next { box-shadow: inset .22em 0 0 rgba(255, 209, 102, .5); }
.hl .ln.err { background: rgba(255, 99, 88, .2); box-shadow: inset .22em 0 0 #ff6358; }
.hl .ln.mask { filter: blur(.42em); opacity: .7; }
textarea.src {
  position: absolute; inset: 0; width: 100%; height: 100%;
  margin: 0; border: 0; outline: 0; resize: none; overflow: hidden;
  padding: 0 1.2em 0 .2em; background: transparent;
  font: inherit; white-space: pre; color: transparent; caret-color: #ffd166;
  -webkit-text-fill-color: transparent;
}
textarea.src::selection { background: rgba(120, 160, 255, .35); -webkit-text-fill-color: transparent; }
.ed:focus-within { box-shadow: inset 0 0 0 2px color-mix(in srgb, #ffd166 55%, transparent); }
.t-kw { color: #c79bff; font-weight: 600; }
.t-bi { color: #6ad1ff; }
.t-fn { color: #ffd166; }
.t-call { color: #8fe3b0; }
.t-str { color: #ffb38a; }
.t-fx { color: #ffe08a; font-weight: 700; }
.t-num { color: #ff9ecb; }
.t-com { color: #7f8aa3; font-style: italic; }
.sp { position: relative; }
.sp::after { content: ''; position: absolute; left: 50%; top: 50%; width: .18em; height: .18em; margin: -.09em; border-radius: 50%; background: rgba(230, 233, 242, .32); }
/* 오른쪽: 변수 상자 + 출력 */
.side { display: flex; flex-direction: column; min-height: 0; border-left: 1.5px solid color-mix(in srgb, var(--pr-ink) 12%, transparent); }
:host([layout="stack"]) .side { border-left: 0; border-top: 1.5px solid color-mix(in srgb, var(--pr-ink) 12%, transparent); flex-direction: row; }
:host([layout="stack"]) .side > * { flex: 1; min-width: 0; }
:host([layout="stack"]) .vars { border-bottom: 0; border-right: 1.5px solid color-mix(in srgb, var(--pr-ink) 12%, transparent); }
.head { font-size: .78em; font-weight: 800; letter-spacing: .12em; color: var(--pr-mute); margin-bottom: .55em; display: flex; gap: .6em; align-items: center; }
.vars { padding: .8em 1em; border-bottom: 1.5px solid color-mix(in srgb, var(--pr-ink) 12%, transparent); overflow: auto; flex: 1 1 0; min-height: 0; }
.vars .empty, .out .empty { color: color-mix(in srgb, var(--pr-mute) 75%, transparent); font-size: .9em; }
.rows { display: flex; flex-direction: column; gap: .5em; }
.row { display: flex; align-items: center; gap: 0; }
.tag {
  position: relative; display: inline-flex; align-items: center;
  font: 700 calc(var(--pr-font) * .92) var(--pr-mono); color: #fff;
  background: var(--pr-tag); padding: .16em .7em .16em 1.25em;
  clip-path: polygon(.62em 0, 100% 0, 100% 100%, .62em 100%, 0 50%);
  white-space: nowrap;
}
.tag::before { content: ''; position: absolute; left: .55em; top: 50%; width: .34em; height: .34em; margin-top: -.17em; border-radius: 50%; background: var(--pr-paper); }
.string { width: 1.6em; height: 0; border-top: 2px dashed color-mix(in srgb, var(--pr-tag) 70%, transparent); flex-shrink: 0; }
.val {
  font: 650 calc(var(--pr-font) * .95) var(--pr-mono); padding: .14em .6em; border-radius: .4em;
  border: 2px solid; background: #fff; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: pre;
}
.val.str { color: var(--pr-str); border-color: color-mix(in srgb, var(--pr-str) 45%, transparent); }
.val.str::before, .val.str::after { content: '"'; color: color-mix(in srgb, var(--pr-str) 55%, transparent); font-weight: 800; }
.val.num { color: var(--pr-num); border-color: color-mix(in srgb, var(--pr-num) 45%, transparent); background: color-mix(in srgb, var(--pr-num) 7%, #fff); border-radius: .2em; font-variant-numeric: tabular-nums; }
:host([types]) .val.num.float { color: var(--pyrun-float, #6741d9); border-color: color-mix(in srgb, var(--pyrun-float, #6741d9) 45%, transparent); background: color-mix(in srgb, var(--pyrun-float, #6741d9) 7%, #fff); border-radius: .9em; }
:host([types]) .kind { font: 700 .76em var(--pr-mono); }
:host([types]) .kind.str { color: var(--pr-str); }
:host([types]) .kind.int { color: var(--pr-num); }
:host([types]) .kind.float { color: var(--pyrun-float, #6741d9); }
/* 입력 */
.o .sp-p { color: var(--pr-ink); }
.o .sp-e { color: var(--pr-primary); font-weight: 700; text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: .18em; }
.inrow { display: flex; align-items: center; gap: .4em; margin-top: .15em; }
.inrow input {
  flex: 0 1 7em; width: 7em; min-width: 3em; font: 700 var(--pr-font)/1.4 var(--pr-mono); color: var(--pr-primary);
  border: 0; border-bottom: 2.5px solid var(--pr-primary); background: color-mix(in srgb, var(--pr-primary) 7%, #fff);
  padding: .1em .35em; outline: 0; border-radius: .3em .3em 0 0;
}
.inrow input:focus { background: color-mix(in srgb, #ffd166 30%, #fff); }
.inrow .btn { padding: .2em .6em; font-size: .78em; font-family: var(--pr-sans); border-color: var(--pr-primary); color: var(--pr-primary); }
.wait { display: none; font-size: 1.05em; letter-spacing: 0; font-weight: 800; color: #a15c00; background: color-mix(in srgb, #f6c445 30%, #fff); border-radius: .4em; padding: .05em .55em; animation: waitpulse 1.4s infinite; }
@keyframes waitpulse { 50% { opacity: .62; } }
.out.waiting .wait { display: inline-block; }
.checks .ck small { color: var(--pr-mute); font-size: .85em; margin-left: .2em; }
.checks .busy { color: var(--pr-mute); font-size: .9em; }
.compare .bad { background: color-mix(in srgb, #f6c445 45%, #fff); border-radius: .2em; }
.val.func { color: #6a3fb5; border-style: dashed; border-color: #b49be0; }
.val.func::before { content: '함수 '; font-family: var(--pr-sans); font-weight: 700; font-size: .8em; }
.val.bool, .val.none, .val.coll, .val.other { color: #5b5346; border-color: #cfc6b6; }
.kind { font-size: .72em; color: var(--pr-mute); margin-left: .5em; white-space: nowrap; }
.row.changed .val { animation: pop .7s cubic-bezier(.2, 1.4, .4, 1); }
.row.changed .string { animation: tug .7s ease-out; }
.row.new { animation: slidein .5s cubic-bezier(.2, 1, .3, 1); }
@keyframes pop { 0% { transform: translateX(.8em) scale(.85); opacity: .2; background: #fff3c4; } 100% { transform: none; opacity: 1; } }
@keyframes tug { 0% { width: 2.6em; } 100% { width: 1.6em; } }
@keyframes slidein { 0% { transform: translateX(-.8em); opacity: 0; } 100% { transform: none; opacity: 1; } }
.frame { margin-top: .7em; padding: .6em .7em .7em; border: 2px dashed color-mix(in srgb, var(--pr-primary) 50%, transparent); border-radius: .7em; background: color-mix(in srgb, var(--pr-primary) 5%, var(--pr-paper)); animation: slidein .45s ease-out; }
.frame .fh { font-weight: 800; font-size: .85em; color: var(--pr-primary); margin-bottom: .45em; font-family: var(--pr-mono); }
.side.has-err .vars { flex: .5 1 0; }
.out { padding: .8em 1em; display: flex; flex-direction: column; flex: 1.15 1 0; min-height: 0; overflow: auto; }
.o { margin: 0; font: var(--pr-font)/1.55 var(--pr-mono); white-space: pre-wrap; word-break: break-all; color: var(--pr-ink); }
.err-box { margin-top: .7em; border-radius: .7em; border: 2px solid color-mix(in srgb, var(--pr-err) 55%, transparent); background: color-mix(in srgb, var(--pr-err) 6%, #fff); padding: .6em .8em; }
.err-box .where { font-weight: 800; color: var(--pr-err); font-size: .85em; }
.err-box .orig { font: 600 calc(var(--pr-font) * .74)/1.4 var(--pr-mono); color: var(--pr-err); margin: .25em 0 .4em; word-break: break-all; }
.err-box .why { line-height: 1.45; word-break: keep-all; font-size: .95em; }
.err-box .why b { display: inline-block; font-size: .78em; background: var(--pr-err); color: #fff; border-radius: .35em; padding: .05em .45em; margin-right: .45em; vertical-align: .1em; }
.note { margin-top: .5em; font-size: .85em; color: var(--pr-mute); }
/* 점검·비교 */
.checks { padding: .65em 1em; border-top: 1.5px solid color-mix(in srgb, var(--pr-ink) 12%, transparent); display: flex; flex-wrap: wrap; gap: .4em .9em; background: color-mix(in srgb, var(--pr-ink) 3%, var(--pr-paper)); }
.checks .ck { display: inline-flex; gap: .35em; align-items: center; font-size: .92em; }
.checks .ck i { font-style: normal; width: 1.25em; height: 1.25em; border-radius: 50%; display: inline-grid; place-items: center; font-size: .8em; font-weight: 900; border: 1.5px solid #bdb4a4; color: transparent; }
.checks .ck.ok i { background: var(--pr-ok); border-color: var(--pr-ok); color: #fff; }
.checks .ck:not(.ok) { color: var(--pr-mute); }
.checks .sum { font-weight: 800; margin-right: .3em; }
.compare { padding: .7em 1em; border-top: 1.5px solid color-mix(in srgb, var(--pr-ink) 12%, transparent); display: grid; grid-template-columns: 1fr 1fr; gap: .4em 1em; }
.compare h4 { margin: 0; font-size: .8em; letter-spacing: .1em; color: var(--pr-mute); }
.compare pre { margin: 0; font: var(--pr-font)/1.5 var(--pr-mono); white-space: pre-wrap; background: #fff; border-radius: .5em; padding: .4em .6em; border: 1.5px solid #e2dace; }
.compare .verdict { grid-column: 1 / -1; font-weight: 700; word-break: keep-all; }
.compare .verdict.same { color: var(--pr-ok); }
.compare .verdict.diff { color: #a15c00; }
[hidden] { display: none !important; }
`;

let sheet = null;
function getSheet() {
  if (sheet) return sheet;
  try { sheet = new CSSStyleSheet(); sheet.replaceSync(CSS); } catch (e) { sheet = null; }
  return sheet;
}

const KW = new Set(['def', 'return', 'if', 'elif', 'else', 'for', 'while', 'in', 'not', 'and', 'or', 'is', 'True', 'False', 'None', 'import', 'from', 'as', 'class', 'pass', 'break', 'continue', 'try', 'except', 'finally', 'with', 'lambda', 'global', 'del', 'yield', 'raise']);
const BI = new Set(['print', 'len', 'input', 'int', 'str', 'float', 'range', 'type', 'round', 'abs', 'max', 'min', 'sum', 'list', 'bool']);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function hlFString(tok) {
  // f"...{name}..." — 중괄호 안을 따로 칠한다
  let html = '';
  let i = 0;
  const re = /\{[^{}]*\}/g;
  let m;
  while ((m = re.exec(tok))) {
    html += `<span class="t-str">${esc(tok.slice(i, m.index))}</span><span class="t-fx">${esc(m[0])}</span>`;
    i = m.index + m[0].length;
  }
  return html + `<span class="t-str">${esc(tok.slice(i))}</span>`;
}

function highlightLine(line, dots) {
  const re = /(#.*$)|([fF]?(?:"(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?))|(\b\d+(?:\.\d+)?\b)|([A-Za-z_가-힣][\w가-힣]*)|(\s+)|([^\s])/g;
  let html = '';
  let m;
  let prevWord = '';
  let atStart = true;
  while ((m = re.exec(line))) {
    const [tok, com, str, num, word, ws] = m;
    if (com) html += `<span class="t-com">${esc(com)}</span>`;
    else if (str) html += /^[fF]/.test(str) ? hlFString(str) : `<span class="t-str">${esc(str)}</span>`;
    else if (num) html += `<span class="t-num">${num}</span>`;
    else if (word) {
      const rest = line.slice(re.lastIndex);
      let cls = '';
      if (KW.has(word)) cls = 't-kw';
      else if (prevWord === 'def') cls = 't-fn';
      else if (BI.has(word)) cls = 't-bi';
      else if (/^\s*\(/.test(rest)) cls = 't-call';
      html += cls ? `<span class="${cls}">${esc(word)}</span>` : esc(word);
      prevWord = word;
    } else if (ws) {
      html += atStart && dots ? ws.replace(/ /g, '<span class="sp"> </span>') : ws;
    } else html += esc(tok);
    if (!ws) atStart = false;
    if (!word && !ws) prevWord = '';
  }
  return html || ' ';
}

function dedent(s) {
  const lines = String(s).replace(/\r/g, '').replace(/^\n+/, '').replace(/\s+$/, '').split('\n');
  const ind = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return lines.map((l) => l.slice(Number.isFinite(ind) ? ind : 0)).join('\n');
}

function parseRange(s) {
  const set = new Set();
  String(s || '').split(',').forEach((part) => {
    const [a, b] = part.split('-').map((x) => parseInt(x, 10));
    if (!a) return;
    for (let i = a; i <= (b || a); i++) set.add(i);
  });
  return set;
}

const STATUS_TEXT = { idle: '대기', loading: '파이썬 준비 중…', ready: '준비됨', running: '실행 중…', error: '엔진 오류' };
const KIND_TEXT = { str: '문자열', num: '숫자', bool: '참·거짓', none: '없음', func: '', coll: '묶음', other: '' };

const instances = new Set();
if (typeof window !== 'undefined') {
  window.__pyrun = window.__pyrun || { list: () => [...instances] };
}

class PyRunner extends HTMLElement {
  static get observedAttributes() { return ['mask', 'readonly', 'dots', 'label', 'rows', 'types']; }

  constructor() {
    super();
    this._hist = [];
    this._waiting = null;
    this._waitKind = null;
    this._presetInputs = null;
    this._code = null;
    this._initial = '';
    this._checks = null;
    this._result = null;
    this._trace = null;
    this._step = -1;
    this._prevVals = new Map();
    this._unmasked = false;
    this._status = 'idle';
    this._built = false;
  }

  /* ── 프로퍼티 ── */
  get code() { return this._ta ? this._ta.value : (this._code ?? ''); }
  set code(v) {
    this._code = String(v ?? '');
    this._initial = this._code;
    if (this._ta) { this._ta.value = this._code; this._onEdit(false); }
  }
  get checks() { return this._checks; }
  set checks(v) { this._checks = Array.isArray(v) ? v : null; }
  get inputs() {
    if (this._presetInputs) return this._presetInputs.slice();
    const a = this.getAttribute('inputs');
    if (a == null) return [];
    try { const j = JSON.parse(a); if (Array.isArray(j)) return j.map(String); } catch (e) { /* 줄 단위 */ }
    return a.split('\n');
  }
  set inputs(v) { this._presetInputs = Array.isArray(v) ? v.map(String) : null; this._clearInput(); }

  connectedCallback() {
    instances.add(this);
    if (!this._built) this._build();
    this._unsub = onStatus((s) => this._setStatus(s));
    if (!this.hasAttribute('lazy')) preload();
  }

  disconnectedCallback() {
    instances.delete(this);
    if (this._unsub) this._unsub();
  }

  attributeChangedCallback() { if (this._built) { this._render(); this._renderBar(); } }

  /* ── 구성 ── */
  _build() {
    this._built = true;
    if (this._code == null) {
      const src = this.querySelector('script[type="text/x-python"]');
      this._code = src ? dedent(src.textContent) : '';
      this._initial = this._code;
    }
    const persistKey = this.getAttribute('persist');
    if (persistKey) {
      try {
        const saved = localStorage.getItem('pyrun:' + persistKey);
        if (saved != null) this._code = saved;
      } catch (e) { /* 저장소를 쓸 수 없으면 처음 코드로 */ }
    }
    const root = this.attachShadow({ mode: 'open' });
    const sh = getSheet();
    if (sh) root.adoptedStyleSheets = [sh];
    else { const st = document.createElement('style'); st.textContent = CSS; root.appendChild(st); }
    const wrap = document.createElement('div');
    wrap.className = 'root';
    wrap.innerHTML = `
      <div class="bar">
        <span class="title"></span>
        <span class="status"><i></i><span></span></span>
        <span class="grow"></span>
        <button class="btn mask-btn" hidden></button>
        <span class="stepper" hidden>
          <button class="btn step prev" title="이전 줄">◀ 이전 줄</button>
          <span class="count"></span>
          <button class="btn step next" title="다음 줄">다음 줄 ▶</button>
        </span>
        <button class="btn reset" title="처음 코드로">↺ 처음 코드로</button>
        <button class="btn run">▶ 실행<kbd>Ctrl+Enter</kbd></button>
      </div>
      <div class="predict" hidden>
        <label>실행하기 전에 출력을 예측해 적어 보세요<small>적어야 실행 단추가 열려요</small></label>
        <textarea class="pred" spellcheck="false" placeholder="예측한 출력"></textarea>
      </div>
      <div class="body">
        <div class="ed"><div class="inner"><div class="gutter"></div><div class="codecol"><pre class="hl"></pre><textarea class="src" spellcheck="false" autocapitalize="off" autocomplete="off" wrap="off" aria-label="파이썬 코드"></textarea></div></div></div>
        <div class="side">
          <div class="vars"><div class="head">변수 상자</div><div class="vbody"></div></div>
          <div class="out"><div class="head">출력<span class="wait">입력을 기다리는 중 · 값을 쓰고 Enter</span></div><pre class="o"></pre><div class="errs"></div></div>
        </div>
      </div>
      <div class="checks" hidden></div>
      <div class="compare" hidden></div>`;
    root.appendChild(wrap);
    const $ = (s) => wrap.querySelector(s);
    this._ta = $('textarea.src');
    this._hl = $('.hl');
    this._gut = $('.gutter');
    this._out = $('.o');
    this._errs = $('.errs');
    this._vbody = $('.vbody');
    this._checksEl = $('.checks');
    this._compareEl = $('.compare');
    this._pred = $('textarea.pred');
    this._runBtn = $('.btn.run');
    this._resetBtn = $('.btn.reset');
    this._maskBtn = $('.mask-btn');
    this._stepper = $('.stepper');
    this._count = $('.count');
    this._statusEl = $('.status');
    this._ta.value = this._code;

    this._runBtn.addEventListener('click', () => this.run());
    this._resetBtn.addEventListener('click', () => this.reset());
    $('.btn.prev').addEventListener('click', () => this.prev());
    $('.btn.next').addEventListener('click', () => this.next());
    this._maskBtn.addEventListener('click', () => { this._unmasked = !this._unmasked; this._render(); this._renderBar(); });
    this._ta.addEventListener('input', () => this._onEdit(true));
    this._ta.addEventListener('keydown', (e) => this._onKey(e));
    this._pred.addEventListener('input', () => this._renderBar());
    // 덱 안에서 키 입력이 슬라이드 넘김으로 새지 않게 막는다
    for (const type of ['keydown', 'keyup', 'keypress']) {
      this.addEventListener(type, (e) => {
        if (e.composedPath()[0] === this) return;
        e.stopPropagation();
        if (type === 'keydown' && e.key === 'Escape') {
          const a = this.shadowRoot.activeElement;
          if (a && a.blur) a.blur();
        }
      });
    }
    this._render();
    this._renderOut();
    this._renderBar();
  }

  _setStatus(s) {
    this._status = s;
    if (!this._statusEl) return;
    this._statusEl.dataset.s = s;
    this._statusEl.lastElementChild.textContent = STATUS_TEXT[s] || s;
  }

  /* ── 편집 ── */
  _clearInput() {
    this._hist = [];
    this._waiting = null;
    this._waitKind = null;
    this._cont = null;
  }

  _onEdit(user) {
    this._trace = null;
    this._step = -1;
    this._errLine = null;
    if (this._waiting != null) { this._result = null; this._renderOut && this._renderOut(); }
    this._clearInput();
    this._render();
    this._renderBar();
    if (user) {
      const key = this.getAttribute('persist');
      if (key) {
        clearTimeout(this._saveT);
        this._saveT = setTimeout(() => { try { localStorage.setItem('pyrun:' + key, this._ta.value); } catch (e) { /* 무시 */ } }, 300);
      }
      this.dispatchEvent(new CustomEvent('pyrun-change', { bubbles: true, composed: true, detail: { code: this._ta.value } }));
    }
  }

  _insert(text) {
    const ta = this._ta;
    ta.focus();
    if (!document.execCommand || !document.execCommand('insertText', false, text)) {
      ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, 'end');
      this._onEdit(true);
    }
  }

  _onKey(e) {
    if (e.isComposing || e.keyCode === 229) return;
    const ta = this._ta;
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); this.run(); return; }
    if (this.hasAttribute('readonly')) return;
    const v = ta.value;
    const s = ta.selectionStart;
    const lineStart = v.lastIndexOf('\n', s - 1) + 1;
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        const lead = v.slice(lineStart).match(/^ {1,4}/);
        if (lead) {
          ta.setSelectionRange(lineStart, lineStart + lead[0].length);
          this._insert('');
        }
      } else {
        this._insert('    ');
      }
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      const cur = v.slice(lineStart, s);
      let ind = cur.match(/^ */)[0];
      if (/:\s*$/.test(cur)) ind += '    ';
      this._insert('\n' + ind);
      return;
    }
    if (e.key === 'Backspace' && ta.selectionStart === ta.selectionEnd) {
      const before = v.slice(lineStart, s);
      if (before.length >= 4 && /^ +$/.test(before) && before.length % 4 === 0) {
        e.preventDefault();
        ta.setSelectionRange(s - 4, s);
        this._insert('');
      }
    }
  }

  /* ── 공개 API ── */
  getCode() { return this.code; }
  setCode(s) { this._ta.value = String(s); this._onEdit(true); }
  reset() {
    this._ta.value = this._initial;
    this._result = null;
    this._prevVals = new Map();
    this._onEdit(true);
    this._renderOut();
    this._checksEl.hidden = true;
    this._compareEl.hidden = true;
  }

  /** 새로 실행한다. 입력 기록은 미리 넣은 입력으로 되돌린다. */
  async run() {
    if (this._busy) return;
    if (this.hasAttribute('predict') && !this._pred.value.trim()) { this._pred.focus(); return; }
    this._clearInput();
    this._hist = this.inputs;
    if (this.getAttribute('mode') === 'step') {
      this._trace = null;
      this._cont = 'last';
      if (await this._ensureTrace()) this._continue();
      return;
    }
    return this._runOnce();
  }

  _fail(err, trace) {
    return { status: 'error', out: '', prog: '', segs: [], error: { type: '실행 멈춤', msg: err.message, line: null, engine: true }, vars: [], steps: trace ? [] : null, info: {} };
  }

  async _runOnce() {
    this._busy = true;
    this._renderBar();
    let res;
    try {
      res = await engineRun(this._ta.value, { trace: false, inputs: this._hist, interactive: true });
    } catch (err) {
      res = this._fail(err, false);
    }
    this._busy = false;
    this._trace = null;
    this._step = -1;
    this._result = res;
    this._errLine = res.error ? res.error.line : null;
    if (res.status === 'waiting_input') { this._wait('run', res); return res; }
    this._waiting = null;
    this._render();
    this._renderOut();
    this._renderBar();
    await this._afterRun(res);
    return res;
  }

  /** 입력 줄을 열고 기다린다. 값을 받으면 _submitInput이 같은 종류의 실행을 다시 한다. */
  _wait(kind, res) {
    this._waiting = res.prompt == null ? '' : res.prompt;
    this._waitKind = kind;
    this._render();
    this._renderOut();
    this._renderBar();
    this.dispatchEvent(new CustomEvent('pyrun-input', { bubbles: true, composed: true, detail: { prompt: this._waiting, inputs: this._hist.slice() } }));
    if (this._inEl && this._focusInput !== false) { try { this._inEl.focus({ preventScroll: true }); } catch (e) { /* 무시 */ } }
  }

  /** 기다리는 입력 줄에 값을 보낸다. */
  async sendInput(value) {
    if (this._waiting == null || this._busy) return false;
    this._hist = this._hist.concat([String(value ?? '')]);
    const kind = this._waitKind;
    this._waiting = null;
    this._waitKind = null;
    if (kind === 'trace') {
      if (await this._ensureTrace()) this._continue();
    } else {
      await this._runOnce();
    }
    return true;
  }

  /** 시험 입력으로 실행한 결과를 돌려준다(화면·입력 기록은 그대로). 입력이 모자라면 status 'input_short'. */
  async test(inputs, code) {
    try {
      return await engineRun(code == null ? this._ta.value : code, { trace: false, inputs: (inputs || []).map(String), interactive: false });
    } catch (err) {
      return this._fail(err, false);
    }
  }

  async _ensureTrace() {
    if (this._trace) return true;
    if (this._waiting == null && !this._hist.length) this._hist = this.inputs;
    this._busy = true;
    this._renderBar();
    let res;
    try {
      res = await engineRun(this._ta.value, { trace: true, maxSteps: 400, inputs: this._hist, interactive: true });
    } catch (err) {
      res = this._fail(err, true);
    }
    this._busy = false;
    if (res.status === 'waiting_input') {
      // 한 줄씩 보기 전에 입력을 먼저 다 받는다(받을 때마다 처음부터 다시 추적한다)
      this._trace = null;
      this._step = -1;
      this._result = res;
      this._wait('trace', res);
      return false;
    }
    this._waiting = null;
    this._trace = res;
    this._prevVals = new Map();
    this._result = this._trace;
    await this._afterRun(this._trace);
    return true;
  }

  _continue() {
    const cont = this._cont || 'next';
    this._cont = null;
    if (cont === 'last') this._goto(this._trace ? this._lastStep() : -1);
    else {
      const n = (this._trace.steps || []).length - 1;
      if (n <= 0) { this._goto(-1, true); return; }
      this._goto(Math.min(this._step + 1, n - 1));
    }
  }

  _lastStep() { return Math.max(0, (this._trace.steps || []).length - 2); }

  async next() {
    if (this._busy) return;
    if (this._waiting != null) { if (this._inEl) this._inEl.focus(); return; }
    if (this.hasAttribute('predict') && !this._pred.value.trim()) { this._pred.focus(); return; }
    if (!this._trace) { this._hist = this.inputs; this._cont = 'next'; }
    if (!(await this._ensureTrace())) return;
    this._cont = 'next';
    this._continue();
  }

  async prev() {
    if (this._busy || !this._trace) return;
    this._goto(Math.max(this._step - 1, -1));
  }

  _goto(i, showError) {
    this._step = i;
    const steps = (this._trace && this._trace.steps) || [];
    const n = steps.length - 1;
    const atEnd = n <= 0 || i >= n - 1;
    this._errLine = atEnd && this._trace.error ? this._trace.error.line : null;
    this._render();
    this._renderOut(showError || atEnd);
    this._renderBar();
    const st = i < 0 ? null : steps[Math.min(i + 1, steps.length - 1)];
    this.dispatchEvent(new CustomEvent('pyrun-step', {
      bubbles: true, composed: true,
      detail: { step: i, steps: n, line: i >= 0 && steps[i] ? steps[i].line : null, vars: st ? st.g : [], frames: st ? st.frames : [], output: st ? st.out : '' },
    }));
  }

  getState() {
    const r = this._result;
    const steps = this._trace && this._trace.steps;
    return {
      status: this._status,
      code: this.code,
      output: r ? r.out : null,
      error: r ? r.error : null,
      vars: r ? Object.fromEntries((r.vars || []).map(([k, v]) => [k, v.r])) : null,
      step: this._step,
      steps: steps ? steps.length - 1 : null,
      waiting: this._waiting != null,
      prompt: this._waiting,
      inputs: this._hist.slice(),
      runStatus: r ? r.status || (r.error ? 'error' : 'completed') : null,
    };
  }

  async _afterRun(res) {
    let checks = null;
    if (!this._checks) this._checksEl.hidden = true;
    else {
      const list = this._checks;
      const token = (this._checkToken = (this._checkToken || 0) + 1);
      if (list.some((c) => c.inputs)) {
        this._checksEl.hidden = false;
        this._checksEl.innerHTML = '<span class="busy">자동 점검 중… 시험 입력으로 실행해 보고 있어요</span>';
      }
      checks = [];
      for (const c of list) {
        let r = res;
        if (c.inputs) r = await this.test(c.inputs);
        let ok = false;
        try { ok = !!c.test(r, res); } catch (e) { ok = false; }
        checks.push({ label: c.label, ok, inputs: c.inputs ? c.inputs.map(String) : null });
      }
      if (token !== this._checkToken) return; // 그사이 다시 실행했다
      const done = checks.filter((c) => c.ok).length;
      this._checksEl.hidden = false;
      this._checksEl.innerHTML = `<span class="sum">자동 점검 ${done}/${checks.length}</span>` +
        checks.map((c) => `<span class="ck${c.ok ? ' ok' : ''}"><i>✓</i>${esc(c.label)}${c.inputs && c.inputs.length ? `<small>시험 입력: ${esc(c.inputs.join(', '))}</small>` : ''}</span>`).join('');
    }
    let prediction = null;
    if (this.hasAttribute('predict')) {
      prediction = this._pred.value;
      const lines = (s) => String(s || '').replace(/\r/g, '').split('\n').map((l) => l.trim()).filter(Boolean);
      const pl = lines(prediction);
      const al = lines(res.prog != null ? res.prog : res.out);
      const bad = [];
      for (let i = 0; i < Math.max(pl.length, al.length); i++) if (pl[i] !== al[i]) bad.push(i + 1);
      const same = !bad.length;
      const mark = (arr) => arr.map((l, i) => (bad.includes(i + 1) ? `<span class="bad">${esc(l)}</span>` : esc(l))).join('\n');
      this._compareEl.hidden = false;
      this._compareEl.innerHTML = `<h4>내 예측</h4><h4>실제 출력</h4><pre>${mark(pl) || esc(prediction)}</pre><pre>${al.length ? mark(al) : res.error ? '(오류)' : '(출력 없음)'}</pre>` +
        `<div class="verdict ${same ? 'same' : 'diff'}">${same ? '예측과 같아요.' : `${bad.join(', ')}번째 줄이 예측과 달라요. 맞고 틀림이 아니라 비교예요. 왜 달랐는지 생각해 보세요.`}</div>`;
    }
    this.dispatchEvent(new CustomEvent('pyrun-run', {
      bubbles: true, composed: true,
      detail: { code: this.code, output: res.out, prog: res.prog, error: res.error, vars: res.vars, info: res.info, checks, prediction, inputs: this._hist.slice(), status: res.status },
    }));
  }

  /* ── 그리기 ── */
  _render() {
    if (!this._ta) return;
    const lines = this._ta.value.split('\n');
    const dots = this.hasAttribute('dots');
    const mask = this._unmasked ? new Set() : parseRange(this.getAttribute('mask'));
    const steps = this._trace && this._trace.steps;
    let cur = null;
    let nxt = null;
    if (steps && steps.length) {
      if (this._step >= 0) cur = steps[this._step].line;
      else nxt = steps[0].line;
    }
    const rows = Math.max(parseInt(this.getAttribute('rows'), 10) || 0, lines.length);
    let hl = '';
    let gut = '';
    for (let i = 0; i < rows; i++) {
      const no = i + 1;
      const cls = ['ln'];
      if (no === cur) cls.push('cur');
      if (no === nxt) cls.push('next');
      if (no === this._errLine) cls.push('err');
      if (mask.has(no)) cls.push('mask');
      hl += `<div class="${cls.join(' ')}">${i < lines.length ? highlightLine(lines[i], dots) : ' '}</div>`;
      gut += `<div class="${no === cur || no === nxt ? 'cur' : no === this._errLine ? 'err' : ''}">${i < lines.length ? no : ''}</div>`;
    }
    this._hl.innerHTML = hl;
    this._gut.innerHTML = gut;
    this._ta.readOnly = this.hasAttribute('readonly');
  }

  _renderBar() {
    if (!this._runBtn) return;
    this.shadowRoot.querySelector('.title').textContent = this.getAttribute('label') || '파이썬';
    const stepOn = this.hasAttribute('step') || this.getAttribute('mode') === 'step';
    this._stepper.hidden = !stepOn;
    const needPred = this.hasAttribute('predict') && !this._pred.value.trim();
    this.shadowRoot.querySelector('.predict').hidden = !this.hasAttribute('predict');
    this._runBtn.disabled = !!this._busy || needPred;
    this._runBtn.firstChild.textContent = this.getAttribute('mode') === 'step' ? '▶ 끝까지 실행' : '▶ 실행';
    const steps = this._trace && this._trace.steps;
    const n = steps ? steps.length - 1 : 0;
    this.shadowRoot.querySelector('.btn.next').disabled = !!this._busy || needPred || this._waiting != null || (steps && this._step >= n - 1);
    this.shadowRoot.querySelector('.btn.prev').disabled = !!this._busy || !steps || this._step < 0;
    this._count.textContent = steps ? (this._step < 0 ? `시작 전 · ${n}단계` : `${this._step + 1} / ${n}단계`) : '';
    const hasMask = !!this.getAttribute('mask');
    this._maskBtn.hidden = !hasMask;
    this._maskBtn.textContent = this._unmasked ? '다시 가리기' : '가린 줄 보기';
  }

  _varsHtml(list, prev, next) {
    if (!list.length) return '';
    return '<div class="rows">' + list.map(([k, v]) => {
      const key = k;
      const old = prev.get(key);
      next.set(key, v.r + '|' + v.t);
      const st = old === undefined ? 'new' : old !== v.r + '|' + v.t ? 'changed' : '';
      let kind = KIND_TEXT[v.t] ? `<span class="kind">${KIND_TEXT[v.t]}</span>` : '';
      let cls = v.t;
      if (this.hasAttribute('types')) {
        if (v.t === 'str') kind = '<span class="kind str">문자열 str</span>';
        else if (v.t === 'num' && v.n) { kind = v.n === 'float' ? '<span class="kind float">실수형 float</span>' : '<span class="kind int">정수형 int</span>'; cls += ' ' + v.n; }
      }
      return `<div class="row ${st}"><span class="tag">${esc(k)}</span><span class="string"></span><span class="val ${cls}">${esc(v.r)}</span>${kind}</div>`;
    }).join('') + '</div>';
  }

  _renderOut(showError = true) {
    if (!this._out) return;
    let out;
    let vars;
    let frames = [];
    let err = null;
    const steps = this._trace && this._trace.steps;
    if (steps) {
      const st = this._step < 0 ? { g: [], frames: [], out: '' } : steps[Math.min(this._step + 1, steps.length - 1)];
      out = st.out;
      vars = st.g;
      frames = st.frames || [];
      if (showError) err = this._trace.error;
      if (!steps.length) { err = this._trace.error; }
    } else if (this._result) {
      out = this._result.out;
      vars = this._result.vars;
      err = this._result.error;
    }
    const waiting = this._waiting != null && !steps;
    const segs = !steps && this._result && this._result.segs;
    if (segs && segs.length) {
      // 프로그램 출력 · 안내 문구 · 입력 메아리(밑줄)를 나눠 그린다
      let html = segs.map(([k, s]) => (k === 'o' ? esc(s) : `<span class="sp-${k}">${esc(s)}</span>`)).join('');
      if (!waiting) html = html.replace(/\n(<\/span>)?$/, '$1');
      this._out.innerHTML = html;
      if (this._result.out_cut) this._out.insertAdjacentHTML('beforeend', '\n<span class="empty">… 출력이 너무 길어 이하 생략</span>');
    } else {
      this._out.innerHTML = out ? esc(out.replace(/\n$/, '')) : waiting ? '' : `<span class="empty">${this._result ? '(출력 없음)' : '[▶ 실행]을 누르면 여기에 결과가 나와요.'}</span>`;
    }
    this._out.closest('.out').classList.toggle('waiting', waiting);
    this._inEl = null;
    if (waiting) {
      // 입력 줄: 마지막 안내 문구 바로 뒤에 붙인다
      const row = document.createElement('span');
      row.className = 'inrow';
      row.style.display = 'inline-flex';
      row.style.verticalAlign = 'baseline';
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.setAttribute('aria-label', this._waiting ? `입력: ${this._waiting}` : '입력');
      inp.autocomplete = 'off';
      inp.spellcheck = false;
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.type = 'button';
      btn.textContent = '보내기';
      let sent = false;
      const send = () => {
        if (sent) return;
        sent = true;
        inp.disabled = true;
        btn.disabled = true;
        this.sendInput(inp.value);
      };
      inp.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        if (e.isComposing || e.keyCode === 229) return; // 한글 조합 중 Enter는 조합 확정일 뿐이다
        e.preventDefault();
        if (!e.repeat) send();
      });
      btn.addEventListener('click', send);
      row.append(inp, btn);
      this._out.appendChild(row);
      this._inEl = inp;
    }
    // 변수 상자
    const next = new Map();
    const prev = this._prevVals;
    let vh = this._varsHtml((vars || []).filter(([, v]) => v), prev, next);
    for (const f of frames) {
      vh += `<div class="frame"><div class="fh">${esc(f.name)} 안</div>${this._varsHtml(f.vars, new Map([...prev].filter(([k]) => k.startsWith(f.name + '.')).map(([k, v]) => [k.slice(f.name.length + 1), v])), new Map()) || '<span class="empty">아직 이름표 없음</span>'}</div>`;
      f.vars.forEach(([k, v]) => next.set(f.name + '.' + k, v.r + '|' + v.t));
    }
    this._prevVals = next;
    this._vbody.innerHTML = vh || `<span class="empty">${vars ? '아직 만든 변수가 없어요.' : '실행하면 이름표와 값이 여기에 보여요.'}</span>`;
    // 오류
    if (waiting) err = null;
    this._out.closest('.side').classList.toggle('has-err', !!err);
    if (err) {
      const lines = this._ta.value.split('\n');
      const lineText = err.line ? lines[err.line - 1] || '' : '';
      const names = (vars || []).map(([k]) => k);
      const why = err.engine ? null : explain(err, { names, lineText });
      this._errs.innerHTML = `<div class="err-box">${err.line ? `<div class="where">${err.line}번째 줄에서 멈췄어요</div>` : ''}` +
        `<div class="orig">${esc(err.engine ? err.msg : original(err))}</div>` +
        (why ? `<div class="why"><b>풀이</b>${esc(why)}</div>` : '') + '</div>';
    } else if (steps && this._trace.truncated && this._step >= steps.length - 2) {
      this._errs.innerHTML = '<div class="note">단계가 너무 많아 앞부분만 보여 줘요.</div>';
    } else {
      this._errs.innerHTML = '';
    }
  }
}

if (!customElements.get('py-runner')) customElements.define('py-runner', PyRunner);

export { preload };
