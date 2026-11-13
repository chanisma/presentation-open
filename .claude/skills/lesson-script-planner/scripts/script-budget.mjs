#!/usr/bin/env node
/* script-budget.mjs — 교사 발화 시간 검산 + 화면↔발화 dedup 검사
 *
 * 사용법:
 *   node script-budget.mjs <script.md>                 # 구간별 시간 검산
 *   node script-budget.mjs <script.md> --dedup <plan.md>  # + 화면 텍스트 유사도
 *
 * script.md 규약
 *   ## [구간명] N분        구간 헤더. N분이 예산이다
 *   한 줄 = 한 문장        줄바꿈이 호흡 단위
 *   [행동]                 발화가 아닌 진행. 기본 20초, [행동 · 45초]면 45초
 *   > …                    메타(대상·차시). 시간에 넣지 않는다
 *
 * 계산 기준 (교실 실측 근사)
 *   발화 260자/분 + 문장당 0.4초 (마침표 호흡)
 *   낭독은 350자/분이지만 수업은 판서·시선·대기가 섞여 더 느리다
 */
import { readFileSync } from 'node:fs';

const CPM = 260;          // 분당 글자 수
const PAUSE_PER_LINE = 0.4; // 문장 사이 호흡(초)
const ACTION_DEFAULT = 20;  // [행동] 기본 소요(초)
const TOLERANCE = 0.2;      // 구간 예산 허용 오차 ±20%
/* 구간 시간을 발화로 100% 채우면 쉼 없이 떠드는 수업이 된다. 학생 되묻기,
   판서, 시선 이동, 잠깐의 정적이 실제로 들어간다. 강의 구간의 발화 목표는
   예산의 SLACK 비율. [행동]으로 명시한 블록은 이미 실제 시간이므로
   이중으로 깎지 않는다. */
const SLACK = Number((process.argv.find((a) => a.startsWith('--slack=')) || '').split('=')[1]) || 0.8;

const scriptPath = process.argv[2];
if (!scriptPath) {
  console.error('사용법: node script-budget.mjs <script.md> [--dedup <plan.md>]');
  process.exit(2);
}

/* ── ① script.md 파싱 ─────────────────────────────────────────────── */

const SECTION_RE = /^##\s*\[([^\]]+)\]\s*(?:(\d+(?:\.\d+)?)\s*분)?/;
const ACTION_RE = /^\[(.+)\]$/;
const ACTION_SEC_RE = /(\d+(?:\.\d+)?)\s*(초|분)/;

function parseScript(md) {
  const sections = [];
  let cur = null;
  let lineNo = 0;
  for (const raw of md.split(/\r?\n/)) {
    lineNo += 1;
    const line = raw.trim();
    const sec = SECTION_RE.exec(line);
    if (sec) {
      cur = { name: sec[1].trim(), budgetMin: sec[2] ? Number(sec[2]) : null, lines: [] };
      sections.push(cur);
      continue;
    }
    if (!line || line.startsWith('#') || line.startsWith('>') || line.startsWith('---')) continue;
    if (!cur) continue;
    const act = ACTION_RE.exec(line);
    if (act) {
      const m = ACTION_SEC_RE.exec(act[1]);
      const sec2 = m ? (m[2] === '분' ? Number(m[1]) * 60 : Number(m[1])) : ACTION_DEFAULT;
      cur.lines.push({ kind: 'action', text: act[1], seconds: sec2, lineNo });
    } else {
      cur.lines.push({ kind: 'say', text: line, lineNo });
    }
  }
  return sections;
}

function sectionSeconds(sec) {
  let s = 0;
  for (const l of sec.lines) {
    if (l.kind === 'action') s += l.seconds;
    else s += (l.text.length / CPM) * 60 + PAUSE_PER_LINE;
  }
  return s;
}

const fmt = (s) => {
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return m ? `${m}분 ${String(r).padStart(2, '0')}초` : `${r}초`;
};

const md = readFileSync(scriptPath, 'utf8');
const sections = parseScript(md);

if (!sections.length) {
  console.error('구간 헤더를 못 찾았습니다. `## [도입] 5분` 형식이 필요합니다.');
  process.exit(1);
}

let fail = 0;
let totalSec = 0;
let totalBudget = 0;
let totalSay = 0;

console.log(`발화 목표 = 구간 예산 × ${SLACK} (--slack= 으로 조정)\n`);
console.log('구간          문장   글자    발화+행동    목표      판정');
console.log('-'.repeat(66));
for (const sec of sections) {
  const say = sec.lines.filter((l) => l.kind === 'say');
  const chars = say.reduce((a, l) => a + l.text.length, 0);
  const est = sectionSeconds(sec);
  totalSec += est;
  totalSay += say.length;
  let verdict = '—';
  let goalTxt = '-';
  if (sec.budgetMin != null) {
    const budget = sec.budgetMin * 60;
    totalBudget += budget;
    const actions = sec.lines.filter((l) => l.kind === 'action').reduce((a, l) => a + l.seconds, 0);
    // [행동]이 먹는 시간은 그대로 두고, 남는 시간에만 slack을 적용한다
    const goal = actions + Math.max(0, budget - actions) * SLACK;
    goalTxt = fmt(goal);
    const diff = (est - goal) / goal;
    if (Math.abs(diff) <= TOLERANCE) verdict = 'OK';
    else { verdict = diff > 0 ? `초과 ${Math.round(diff * 100)}%` : `부족 ${Math.round(-diff * 100)}%`; fail += 1; }
  }
  console.log(
    sec.name.padEnd(14) +
    String(say.length).padEnd(7) +
    String(chars).padEnd(8) +
    fmt(est).padEnd(13) +
    goalTxt.padEnd(10) +
    verdict,
  );
}
console.log('-'.repeat(66));
console.log(`합계  발화 ${totalSay}문장 · 예상 ${fmt(totalSec)}` +
  (totalBudget ? ` · 예산 ${fmt(totalBudget)}` : ''));

/* ── ② dedup — 화면 텍스트 ↔ 발화 유사도 ─────────────────────────── */

const dedupIdx = process.argv.indexOf('--dedup');
if (dedupIdx > 0 && process.argv[dedupIdx + 1]) {
  const planPath = process.argv[dedupIdx + 1];
  const plan = readFileSync(planPath, 'utf8');

  // 슬라이드 블록에서 "화면 텍스트:" 줄을 뽑는다
  const blocks = plan.split(/^## (?=Slide )/m).slice(1);
  const norm = (s) => s.replace(/[\s·`'"“”‘’.,!?()\[\]—-]/g, '');

  // 2-gram Dice 계수 — 한국어에서 Levenshtein보다 어절 재배치에 강하다
  function similarity(a, b) {
    const A = norm(a);
    const B = norm(b);
    if (!A.length || !B.length) return 0;
    if (A.length < 2 || B.length < 2) return A === B ? 1 : 0;
    const g = (s) => { const m = new Map(); for (let i = 0; i < s.length - 1; i++) { const k = s.slice(i, i + 2); m.set(k, (m.get(k) || 0) + 1); } return m; };
    const ga = g(A); const gb = g(B);
    let inter = 0;
    for (const [k, v] of ga) inter += Math.min(v, gb.get(k) || 0);
    const na = A.length - 1; const nb = B.length - 1;
    return (2 * inter) / (na + nb);
  }

  const sayLines = sections.flatMap((s) => s.lines.filter((l) => l.kind === 'say').map((l) => l.text));

  console.log('\n화면 ↔ 발화 dedup (한도 0.60)');
  console.log('-'.repeat(66));
  let worst = 0;
  let dedupFail = 0;
  for (const b of blocks) {
    const title = (b.split('\n')[0] || '').trim();
    const m = /\*\*화면 텍스트:\*\*\s*(.+)/.exec(b);
    if (!m) { console.log(`  ${title.padEnd(34)} 화면 텍스트 줄 없음 (건너뜀)`); continue; }
    const screens = m[1].split(/\s*·\s*|\s*\/\s*/).map((x) => x.replace(/`/g, '').trim()).filter(Boolean);
    let hi = 0; let hiPair = ['', ''];
    for (const sc of screens) {
      for (const say of sayLines) {
        const v = similarity(sc, say);
        if (v > hi) { hi = v; hiPair = [sc, say]; }
      }
    }
    worst = Math.max(worst, hi);
    const bad = hi > 0.6;
    if (bad) dedupFail += 1;
    console.log(`  ${title.padEnd(34)} 최대 ${hi.toFixed(2)} ${bad ? 'FAIL' : 'OK'}`);
    if (bad) console.log(`      화면 "${hiPair[0]}"\n      발화 "${hiPair[1]}"`);
  }
  console.log('-'.repeat(66));
  console.log(`전체 최댓값 ${worst.toFixed(2)} · 초과 ${dedupFail}건`);
  fail += dedupFail;
}

if (fail) {
  console.log(`\nBLOCK: ${fail}건 — 슬라이드를 고치지 말고 발화와 화면 텍스트를 고칠 것`);
  process.exit(1);
}
console.log('\n통과');
