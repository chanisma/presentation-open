#!/usr/bin/env node
/* validate-scene-plan.mjs — scene-plan.json 렌더 ready 게이트 (원문 /vg-scene v1.2 ZERO-TOLERANCE)
 *
 * 사용법: node validate-scene-plan.mjs <프로젝트 폴더>
 *   script.json + beats.json + scene-plan.json 을 읽는다.
 *
 * 게이트
 *   1. 원자성 — Σ scene.sentence_range 길이 === script 문장 총수, 겹침 0, 빈틈 0
 *   2. visual_plan.pattern_ref 전 씬 존재 + 카탈로그 어휘
 *   3. semantic cluster — 직전 3씬과 signature(pattern_ref+focal.type) 2개 이상 동일 → FAIL
 *   4. dedup — focal.label / support[].text / subline vs 씬이 덮는 문장 유사도 > 0.6 → FAIL
 *   5. 비카드 비율 ≥ 40%
 *   6. sketch_request — 4조건 모두 true 인 것만, 덱당 ≤ 5
 *   7. metaphor 중복 없음
 *   8. intent progression — emphasize 2연속 · define/explain 3연속 · compare 뒤 결론 · 첫/마지막 씬
 *   9. 씬 크기 — 비트 2~4개 (1개·5개+ 경고) */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
if (!dir) { console.error('사용법: node validate-scene-plan.mjs <프로젝트 폴더>'); process.exit(2); }
const need = (f) => { const p = path.join(dir, f); if (!existsSync(p)) { console.error(`없음: ${p}`); process.exit(1); } return JSON.parse(readFileSync(p, 'utf8')); };
const script = need('script.json');
const { beats } = need('beats.json');
const plan = need('scene-plan.json');

/* 카탈로그 어휘 — references/pattern-catalog.md 의 표에서 id·focal_type·non_card 를 읽는다 */
const catalogPath = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', 'references', 'pattern-catalog.md');
const catalog = new Map();
if (existsSync(catalogPath)) {
  for (const line of readFileSync(catalogPath, 'utf8').split('\n')) {
    const m = /^\|\s*`(P\d+_[a-z_]+)`\s*\|\s*(\w+)\s*\|\s*(\w+)\s*\|[^|]*\|[^|]*\|\s*(true|false)\s*\|/.exec(line);
    if (m) catalog.set(m[1], { relationship: m[2], focal: m[3], non_card: m[4] === 'true' });
  }
}

const sentenceText = new Map();
for (const c of script.chapters) for (const p of c.paragraphs) sentenceText.set(p.n, p.text);
const total = sentenceText.size;
const beatByIndex = new Map(beats.map((b) => [b.beat_index, b]));
const scenes = plan.plans || plan.scenes || [];
const errors = [];
const warns = [];

/* 1. 원자성 */
let prevEnd = 0;
let coveredCount = 0;
for (const sc of scenes) {
  const [a, b] = sc.sentence_range || [];
  const id = `S${sc.scene_index}`;
  if (!(a >= 1 && b >= a)) { errors.push(`${id}: sentence_range 없음/역전`); continue; }
  if (a !== prevEnd + 1) errors.push(`${id}: sentence_range ${a}~${b} — 이전 끝 ${prevEnd} 과 ${a - prevEnd - 1 > 0 ? '빈틈' : '겹침'}`);
  coveredCount += b - a + 1;
  prevEnd = Math.max(prevEnd, b);
}
if (coveredCount !== total) errors.push(`원자성: 씬이 덮는 문장 ${coveredCount} ≠ script 문장 ${total}`);

/* 2~7. 씬별 */
const sigHistory = [];
const metaphors = new Map();
let nonCard = 0;
let sketches = 0;
const norm = (s) => String(s).replace(/[\s·`'"“”‘’.,!?()\[\]—\-–~:;]/g, '');
function dice(x, y) {
  const A = norm(x); const B = norm(y);
  if (A.length < 2 || B.length < 2) return A === B && A.length ? 1 : 0;
  const g = (s) => { const m = new Map(); for (let i = 0; i < s.length - 1; i++) { const k = s.slice(i, i + 2); m.set(k, (m.get(k) || 0) + 1); } return m; };
  const ga = g(A); const gb = g(B); let inter = 0;
  for (const [k, v] of ga) inter += Math.min(v, gb.get(k) || 0);
  return (2 * inter) / (A.length - 1 + B.length - 1);
}

for (const sc of scenes) {
  const id = `S${sc.scene_index}`;
  const vp = sc.visual_plan;
  const [a, b] = sc.sentence_range || [0, -1];
  const lines = []; for (let n = a; n <= b; n++) if (sentenceText.has(n)) lines.push(sentenceText.get(n));

  if (!sc.metaphor) errors.push(`${id}: metaphor 없음`);
  else { const k = sc.metaphor.trim(); if (metaphors.has(k)) errors.push(`${id}: metaphor "${k}" 중복 — ${metaphors.get(k)} 과 동일`); metaphors.set(k, id); }
  if (!sc.emotion) warns.push(`${id}: emotion 없음`);
  if (!sc.jsx_plan) warns.push(`${id}: jsx_plan 없음`);

  const nb = sc.beat_range ? sc.beat_range[1] - sc.beat_range[0] + 1 : 0;
  if (nb === 1) warns.push(`${id}: 비트 1개 — 연결 비트를 독립 씬으로 만들지 않았는지 확인`);
  if (nb >= 5) warns.push(`${id}: 비트 ${nb}개 — 기본 목표 2~4`);

  if (!vp || !vp.pattern_ref) { errors.push(`${id}: visual_plan.pattern_ref 없음`); continue; }
  const cat = catalog.get(vp.pattern_ref);
  if (catalog.size && !cat) errors.push(`${id}: pattern_ref "${vp.pattern_ref}" 카탈로그에 없음`);
  const focalType = vp.focal?.type || cat?.focal || '?';
  if (cat?.non_card) nonCard++;

  /* 3. cluster */
  const sig = `${vp.pattern_ref}+${focalType}`;
  const recent = sigHistory.slice(-3);
  const same = recent.filter((s) => s === sig).length;
  if (same >= 2) errors.push(`${id}: [FAIL:semantic-cluster] signature "${sig}" 가 직전 3씬 중 ${same}개와 동일 — 같은 relationship 의 다른 focal_type 으로 회피`);
  else if (same === 1) warns.push(`${id}: signature "${sig}" 직전 3씬 중 1개와 동일 (한 번 더 겹치면 FAIL)`);
  sigHistory.push(sig);

  /* 4. dedup */
  const screen = [vp.focal?.label, vp.subline, ...(vp.support || []).flatMap((s) => [s.text, ...(s.items || [])])].filter(Boolean);
  for (const t of screen) {
    let hi = 0; let src = '';
    for (const l of lines) { const v = dice(t, l); if (v > hi) { hi = v; src = l; } }
    if (hi > 0.6) errors.push(`${id}: [FAIL:subtitle-visual-dedup] 화면 "${t}" ↔ 문장 "${src.slice(0, 40)}…" 유사도 ${hi.toFixed(2)} > 0.60`);
  }

  /* 6. sketch */
  if (sc.sketch_request) {
    sketches++;
    const j = sc.sketch_request.justification || '';
    const four = ['figural_essential', 'no_realsource', 'no_iconify', 'decomposable'];
    const miss = four.filter((k) => !(sc.sketch_request[k] === true || j.includes(k)));
    if (miss.length) errors.push(`${id}: sketch_request 4조건 미충족 — ${miss.join(', ')} (비워 둘 것)`);
    if (!sc.sketch_request.slug || !sc.sketch_request.decomposition_hint) errors.push(`${id}: sketch_request slug/decomposition_hint 없음`);
  }
}

/* 5. 비카드 */
if (scenes.length && catalog.size) {
  const ratio = nonCard / scenes.length;
  if (ratio < 0.4) errors.push(`비카드 비율 ${(ratio * 100).toFixed(0)}% < 40% — non_card 패턴을 늘릴 것`);
}
if (sketches > 5) errors.push(`sketch_request ${sketches}개 > 5 — 이전 것을 추상화하거나 덱의 핵심 시그니처로 승격`);

/* 8. intent progression — 씬의 intent 는 첫 비트의 role 을 intent 어휘로 환산 */
const ROLE2INTENT = { declaration: 'define', comparison: 'compare', escalation: 'explain', evidence: 'explain', sequence: 'explain', payoff: 'emphasize', pause: 'pause', metaphor: 'example', cluster: 'list', support: 'explain' };
const intents = scenes.map((sc) => {
  if (sc.intent) return sc.intent;
  const first = beatByIndex.get(sc.beat_range?.[0]);
  return ROLE2INTENT[first?.scene?.role] || '?';
});
for (let i = 1; i < intents.length; i++) {
  if (intents[i] === 'emphasize' && intents[i - 1] === 'emphasize') errors.push(`S${scenes[i].scene_index}: emphasize 2연속`);
  if (i >= 2 && ['define', 'explain'].includes(intents[i]) && ['define', 'explain'].includes(intents[i - 1]) && ['define', 'explain'].includes(intents[i - 2])) errors.push(`S${scenes[i].scene_index}: define/explain 3연속`);
  if (intents[i - 1] === 'compare' && !['emphasize', 'example'].includes(intents[i])) errors.push(`S${scenes[i].scene_index}: compare 뒤에 ${intents[i]} — emphasize 또는 example 이어야 함`);
}
if (intents.length && !['define', 'emphasize'].includes(intents[0])) warns.push(`첫 씬 intent=${intents[0]} — define 또는 emphasize 권장`);
if (intents.length >= 2 && !intents.slice(-2).every((x) => ['emphasize', 'list'].includes(x))) warns.push(`마지막 두 씬 ${intents.slice(-2).join('→')} — emphasize/list 권장`);

/* 출력 */
console.log(`씬 ${scenes.length}개 · 비트 ${beats.length}개 · 문장 ${total}개`);
console.log(`intent: ${intents.join(' → ')}`);
console.log(`signature: ${sigHistory.join(' | ')}`);
if (catalog.size) console.log(`비카드 ${nonCard}/${scenes.length} (${((nonCard / Math.max(1, scenes.length)) * 100).toFixed(0)}%) · sketch ${sketches}/5`);
for (const w of warns) console.log(`  경고: ${w}`);
for (const e of errors) console.log(`  오류: ${e}`);
if (errors.length) { console.log(`\nBLOCK: 오류 ${errors.length}건 — 우회 플래그 없음. 메타포·패턴·화면 텍스트를 고칠 것`); process.exit(1); }
console.log(`\n통과 (경고 ${warns.length}건) — to-plan-md.mjs 로 변환 가능`);
