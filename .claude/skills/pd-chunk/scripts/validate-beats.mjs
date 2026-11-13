#!/usr/bin/env node
/* validate-beats.mjs — beats.json 게이트 (pd-chunk → pd-scene 사이)
 *
 * 사용법: node validate-beats.mjs <프로젝트 폴더>
 *   폴더 안의 script.json + beats.json 을 읽는다.
 *
 * 검사 (원문 /vg-chunk 강제 규칙 + Step 3 필수 조건)
 *   1. 원자성 — script.json 문장 총수 === Σ beat.sentences.length, 중복 0, 순서 보존
 *   2. 필수 필드 — scene.role / semantic_shape / merge_hint / visual_weight / energy
 *   3. subline 필수 — role ∈ {declaration, evidence, comparison, payoff} 이면 subline_candidate 필수
 *   4. emphasis_tokens ≤ 5
 *   5. 비트 길이 — 8문장+ 는 경고 (원문 12초+ "거의 항상 분할")
 *   6. 어휘 — 각 필드 값이 허용 집합 안에 있는가 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
if (!dir) { console.error('사용법: node validate-beats.mjs <프로젝트 폴더>'); process.exit(2); }
const need = (f) => { const p = path.join(dir, f); if (!existsSync(p)) { console.error(`없음: ${p}`); process.exit(1); } return JSON.parse(readFileSync(p, 'utf8')); };
const script = need('script.json');
const beatsFile = need('beats.json');

const ROLE = ['declaration', 'comparison', 'escalation', 'evidence', 'sequence', 'payoff', 'pause', 'metaphor', 'cluster', 'support'];
const SHAPE = ['contrast', 'flow', 'cluster', 'metric', 'hierarchy', 'transformation', 'symbol', 'evidence', 'summary'];
const MERGE = ['standalone', 'merge_prev', 'merge_next', 'candidate_for_merge'];
const WEIGHT = ['low', 'medium', 'high'];
const ENERGY = ['calm', 'neutral', 'sharp', 'explosive'];
const SUBLINE_REQUIRED = new Set(['declaration', 'evidence', 'comparison', 'payoff']);

const sentences = script.chapters.flatMap((c) => c.paragraphs.map((p) => p.n));
const total = sentences.length;
const beats = beatsFile.beats || [];
const errors = [];
const warns = [];

/* 1. 원자성 */
const covered = beats.flatMap((b) => b.sentences || []);
const seen = new Set();
for (const n of covered) { if (seen.has(n)) errors.push(`원자성: 문장 ${n} 중복 배정`); seen.add(n); }
const missing = sentences.filter((n) => !seen.has(n));
if (missing.length) errors.push(`원자성: 문장 ${missing.length}개 누락 — ${missing.slice(0, 8).join(', ')}${missing.length > 8 ? ' …' : ''}`);
const extra = covered.filter((n) => !sentences.includes(n));
if (extra.length) errors.push(`원자성: script.json 에 없는 문장 번호 — ${[...new Set(extra)].slice(0, 8).join(', ')}`);
for (let i = 1; i < covered.length; i++) if (covered[i] <= covered[i - 1]) { errors.push(`원자성: 순서 역전 — 문장 ${covered[i - 1]} 다음에 ${covered[i]}`); break; }
if (beatsFile.total_sentences != null && beatsFile.total_sentences !== total) errors.push(`total_sentences ${beatsFile.total_sentences} ≠ script 문장 수 ${total}`);

/* 2~6. 비트별 */
beats.forEach((b, i) => {
  const id = `B${String(b.beat_index ?? i).padStart(2, '0')}`;
  const s = b.scene || {};
  if (!Array.isArray(b.sentences) || !b.sentences.length) errors.push(`${id}: sentences[] 비어 있음`);
  if (!b.narration_summary) warns.push(`${id}: narration_summary 없음`);
  const chk = (k, v, set) => { if (v == null) errors.push(`${id}: scene.${k} 없음`); else if (!set.includes(v)) errors.push(`${id}: scene.${k}="${v}" 허용 어휘 아님`); };
  chk('role', s.role, ROLE);
  chk('semantic_shape', s.semantic_shape, SHAPE);
  chk('merge_hint', s.merge_hint, MERGE);
  chk('visual_weight', s.visual_weight, WEIGHT);
  chk('energy', s.energy, ENERGY);
  if (SUBLINE_REQUIRED.has(s.role) && !s.subline_candidate) errors.push(`${id}: role=${s.role} 인데 subline_candidate 없음 (원문 3e 필수)`);
  if (s.focal_candidate == null && s.role !== 'pause') warns.push(`${id}: focal_candidate 없음`);
  if (Array.isArray(s.support_candidates) && s.support_candidates.length > 3) warns.push(`${id}: support_candidates ${s.support_candidates.length}개 (1~3 권장)`);
  if (Array.isArray(b.semantic?.emphasis_tokens) && b.semantic.emphasis_tokens.length > 5) errors.push(`${id}: emphasis_tokens ${b.semantic.emphasis_tokens.length}개 > 5`);
  const len = (b.sentences || []).length;
  if (len >= 8) warns.push(`${id}: ${len}문장 — 원문 "12초+ 거의 항상 분할". 주장+설명 / 숫자+비교 / 질문+답 / 예시+결론 중 둘 이상이면 나눌 것`);
  else if (len >= 6) warns.push(`${id}: ${len}문장 — 하나의 시각 사건인지 확인`);
});

/* 요약 */
const roleCount = {};
for (const b of beats) roleCount[b.scene?.role] = (roleCount[b.scene?.role] || 0) + 1;
const standalone = beats.filter((b) => b.scene?.merge_hint === 'standalone').length;

console.log(`script ${total}문장 → beats ${beats.length}개 (평균 ${(total / Math.max(1, beats.length)).toFixed(1)}문장/비트)`);
console.log(`role 분포: ${Object.entries(roleCount).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
console.log(`merge_hint standalone ${standalone}/${beats.length} (SPLIT-FIRST — 과반이 standalone 이어야 정상)`);
for (const w of warns) console.log(`  경고: ${w}`);
for (const e of errors) console.log(`  오류: ${e}`);
if (errors.length) { console.log(`\nBLOCK: 오류 ${errors.length}건 — pd-scene 호출 금지`); process.exit(1); }
console.log(`\n통과 (경고 ${warns.length}건) — 원자성 유지: ${total} 문장 → ${covered.length} 배정`);
