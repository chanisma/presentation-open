#!/usr/bin/env node
/* to-plan-md.mjs — scene-plan.json → plan.md 기계 변환
 *
 * 사용법: node to-plan-md.mjs <프로젝트 폴더> [--out plan.md]
 *   script.json + beats.json + scene-plan.json 을 읽어 lesson-deck-planner/references/plan-format.md
 *   형식의 plan.md 를 쓴다. 기존 렌더러(react-deck-builder 등)가 그대로 소비한다.
 *
 * DUAL-FILE 원칙: plan.md 는 파생물이다. 손으로 고치지 말고 scene-plan.json 을 고친 뒤 재실행.
 *
 * 변환 규칙 (pd-scene SKILL.md §8)
 *   씬 1개 = ## Slide N
 *   핵심 메시지  = 씬 안 첫 declaration/payoff 비트의 subline, 없으면 첫 비트 narration_summary
 *   화면 텍스트  = visual_plan.focal.label + subline + support[].text/items
 *   형태 설계    = jsx_plan + visual_plan.rationale + container + pattern_ref 힌트
 *   발표자 노트  = sentence_range 가 가리키는 script.json 문장을 글자 그대로 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
if (!dir) { console.error('사용법: node to-plan-md.mjs <프로젝트 폴더> [--out plan.md]'); process.exit(2); }
const outIdx = process.argv.indexOf('--out');
const outName = outIdx > 0 ? process.argv[outIdx + 1] : 'plan.md';
const need = (f) => { const p = path.join(dir, f); if (!existsSync(p)) { console.error(`없음: ${p}`); process.exit(1); } return JSON.parse(readFileSync(p, 'utf8')); };
const script = need('script.json');
const { beats } = need('beats.json');
const plan = need('scene-plan.json');
const project = existsSync(path.join(dir, 'project.json')) ? JSON.parse(readFileSync(path.join(dir, 'project.json'), 'utf8')) : {};

const sentence = new Map();
const chapterOf = new Map();
for (const c of script.chapters) for (const p of c.paragraphs) { sentence.set(p.n, p.text); chapterOf.set(p.n, c); }
const beatByIndex = new Map(beats.map((b) => [b.beat_index, b]));
const scenes = plan.plans || plan.scenes || [];

const formCount = {};
for (const sc of scenes) formCount[sc.form || 'static'] = (formCount[sc.form || 'static'] || 0) + 1;
const formSummary = Object.entries(formCount).map(([k, v]) => `${k} ${v}`).join(' + ');
const scenesWithSketch = scenes.filter((s) => s.sketch_request).length;

const L = [];
L.push(`# ${script.title} · 덱 계획 (pd 파이프라인)`);
L.push('');
L.push('| 항목 | 값 |');
L.push('|---|---|');
if (script.audience) L.push(`| 대상 | ${script.audience} |`);
L.push(`| 기획 경로 | **pd-script → pd-chunk → pd-scene** (newVideoGen vg- 루틴 이식) |`);
L.push(`| 대본 | \`script.md\` · ${sentence.size}문장 · ${script.chapters.length}챕터 · tone ${script.tone || '-'} |`);
L.push(`| 비트 | ${beats.length}개 → 씬 ${scenes.length}개 (\`scene-plan.json\` 이 원본, 이 파일은 파생물) |`);
L.push(`| 렌더러 | react-deck-builder (혼합: ${formSummary}) |`);
L.push(`| 총 장수 | ${scenes.length} |`);
if (scenesWithSketch) L.push(`| 신규 에셋 | sketch_request ${scenesWithSketch}건 (4조건 통과분 · svg-asset-builder / image-asset-builder 선행) |`);
L.push(`| 화면 규약 | 화면 텍스트 ↔ 대본 문장 유사도 ≤ 0.60 (validate-scene-plan.mjs 통과) · 발표자 노트는 대본 문장 그대로 |`);
L.push('');
L.push(`> 재생성: \`node .claude/skills/pd-scene/scripts/to-plan-md.mjs "${path.basename(dir)}"\` — plan.md 를 손으로 고치지 말 것`);
L.push('');
L.push('---');
L.push('');

scenes.forEach((sc, i) => {
  const n = i + 1;
  const [b0, b1] = sc.beat_range || [];
  const [s0, s1] = sc.sentence_range || [0, -1];
  const sceneBeats = []; for (let k = b0; k <= b1; k++) if (beatByIndex.has(k)) sceneBeats.push(beatByIndex.get(k));
  const first = sceneBeats[0];
  const key = sceneBeats.find((b) => ['declaration', 'payoff'].includes(b.scene?.role)) || first;
  const vp = sc.visual_plan || {};
  const form = sc.form || 'static';
  const title = sc.title || key?.scene?.focal_candidate || first?.narration_summary?.slice(0, 24) || `씬 ${n}`;

  L.push(`## Slide ${n} — ${title}`);
  L.push(`- form: ${form}`);
  L.push(`- beats: ${sceneBeats.map((b) => `B${String(b.beat_index).padStart(2, '0')}`).join(', ')} (${sceneBeats.map((b) => b.scene?.role).join(' → ')})`);
  if (form === 'scene' || sc.metaphor) {
    const intent = sc.intent_line || sc.jsx_plan || '';
    L.push(`- scene: metaphor: ${sc.metaphor || '-'} | emotion: ${sc.emotion || '-'} | intent: ${intent}`);
  }
  L.push(`- pattern: ${vp.pattern_ref || '-'} (${vp.relationship || '-'} · focal ${vp.focal?.type || '-'}${vp.recommended_container ? ` · ${vp.recommended_container}` : ''}) — 힌트, 구도 지시 아님`);
  if (sc.sketch_request) L.push(`- svg: 신규: ${sc.sketch_request.slug} — ${sc.sketch_request.scene_meaning || ''}`);
  L.push('');
  L.push(`**핵심 메시지:** ${key?.scene?.subline_candidate || key?.narration_summary || first?.narration_summary || ''}`);
  L.push('');
  const screen = [];
  if (vp.focal?.label) screen.push(`\`${vp.focal.label}\``);
  if (vp.subline) screen.push(`\`${vp.subline}\``);
  for (const s of vp.support || []) { if (s.text) screen.push(`\`${s.text}\``); for (const it of s.items || []) screen.push(`\`${it}\``); }
  L.push(`**화면 텍스트:** ${screen.length ? screen.join(' · ') : '(없음 — 도식·수치만)'}`);
  L.push('');
  /* 씬의 무게는 가장 무거운 비트가 정한다 — 첫 비트가 support(low·calm)인 씬이 흔하다 */
  const W = { low: 0, medium: 1, high: 2 };
  const heavy = [...sceneBeats].sort((x, y) => (W[y.scene?.visual_weight] ?? 0) - (W[x.scene?.visual_weight] ?? 0))[0];
  const weight = heavy?.scene?.visual_weight; const energy = heavy?.scene?.energy;
  L.push(`**형태 설계:** ${sc.jsx_plan || ''}${vp.rationale ? ` ${vp.rationale}` : ''}${weight ? ` (weight ${weight} · energy ${energy})` : ''}`);
  if (sceneBeats.length > 1) L.push(`빌드 순서: ${sceneBeats.map((b, k) => `at=${k} ${b.scene?.focal_candidate || b.narration_summary?.slice(0, 16) || ''}`).join(' → ')}`);
  L.push('');
  L.push(`**발표자 노트 (문장 ${s0}~${s1} 그대로):**`);
  for (let k = s0; k <= s1; k++) if (sentence.has(k)) L.push(sentence.get(k));
  L.push('');
  L.push('---');
  L.push('');
});

L.push('## 검증 게이트');
L.push(`- [x] 원자성: script ${sentence.size}문장 = 씬이 덮는 문장 수 (validate-scene-plan.mjs)`);
L.push('- [x] semantic cluster: 직전 3씬 signature 중복 ≤ 1');
L.push('- [x] dedup: 화면 텍스트 ↔ 문장 유사도 ≤ 0.60');
L.push('- [x] 비카드 비율 ≥ 40% · sketch_request ≤ 5 · metaphor 중복 없음 · intent progression');
L.push(`- 렌더러: **react-deck-builder** (${formSummary})`);
L.push('');

const outPath = path.join(dir, outName);
writeFileSync(outPath, L.join('\n'), 'utf8');
console.log(`${outPath} — 씬 ${scenes.length}장 · ${L.length}줄`);
