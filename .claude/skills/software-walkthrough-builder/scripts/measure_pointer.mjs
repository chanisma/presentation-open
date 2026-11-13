// walkthrough 포인터 좌표 검산 — 클릭 대상의 실제 화면 좌표를 재고,
// 그 시각에 포인터 화살촉이 대상 안에 있는지 판정한다.
//
// 왜: 창 배치 px를 눈으로 %로 환산해 적은 좌표는 어긋난다. AppWindow의
// 제목줄(약 36px)과 본문의 flex·padding이 추정과 다르기 때문이다. 실제로
// 한 덱에서 「모델 업로드」 버튼이 225px 어긋나 있었다(2026-09-15).
//
// 준비: 클릭 대상 요소에 data-pt="이름" 속성을 단다.
//   <span data-pt="upload" style={{ ...ring(T.UPLOAD) }}>☁ 모델 업로드</span>
//
// 사용:  node measure_pointer.mjs <deckId> <슬라이드번호> <t목록> [--json]
// 예:    node .claude/skills/software-walkthrough-builder/scripts/measure_pointer.mjs \
//          ai-how-to-learn 18 1.4,5.0,7.2,8.8,11.2,12.4
//   t목록은 **클릭이 일어나는 시각**을 그대로 넣는다(시각표 상수 T.*).
// dev 서버(기본 5199, SMOKE_BASE로 변경)가 떠 있어야 한다.
//
// 읽는 법:
//   ✓  포인터 화살촉이 그 대상 bbox 안에 있다 — 그대로 두면 된다.
//   ✗  대상 밖이다. 아래 「대상 중심」 값을 코드의 좌표 상수에 넣는다.
//   ·  그 시각에 화면에 있는 다른 대상들(참고용).
//
// 주의: popIn이 끝나기 전이나 창이 축소(shrinkAfter)된 뒤에 재면 값이 달라진다.
// 각 대상은 **그 대상을 클릭하는 시각**에 재야 하고, 그때 창이 정착 상태여야 한다.

import { createRequire } from 'node:module';
const require = createRequire(process.cwd() + '/package.json');
const { chromium } = require('playwright');

const [deckId, slideArg, timesArg, ...rest] = process.argv.slice(2);
if (!deckId || !slideArg || !timesArg) {
  console.error('usage: measure_pointer.mjs <deckId> <slideNo> <t,t,t> [--json]');
  process.exit(1);
}
const asJson = rest.includes('--json');
const slideNo = Number(slideArg);
const times = timesArg.split(',').map(Number);
const BASE = process.env.SMOKE_BASE || 'http://localhost:5199';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const out = {};

for (const t of times) {
  // 상태마다 새로 연다 — 해시만 바꾸면 이전 재생 상태가 남는다
  await page.goto('about:blank');
  await page.goto(`${BASE}/?deck=${deckId}#${slideNo}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.evaluate(
    (time) => window.dispatchEvent(new CustomEvent('deck-scene-control', { detail: { action: 'seek', time } })),
    t
  );
  await page.waitForTimeout(400);

  const res = await page.evaluate(() => {
    const root = document.querySelector('.slide.active [data-scene-root]') || document.querySelector('[data-scene-root]');
    if (!root) return { error: '씬 루트를 찾지 못했다 — 이 슬라이드에 <Scene>이 있는지 확인' };
    const r = root.getBoundingClientRect();
    const pct = (px, py) => [((px - r.left) / r.width) * 100, ((py - r.top) / r.height) * 100];

    // 포인터 화살촉 끝 — 박스 좌상단에서 (size/6, size/12) 만큼 안쪽
    let tip = null;
    const pv = document.querySelector('[data-walkthrough-pointer]');
    if (pv) {
      const b = pv.getBoundingClientRect();
      const size = Number(pv.getAttribute('data-pointer-size')) || 30;
      const style = getComputedStyle(pv);
      if (b.width > 0 && Number(style.opacity) > 0.05) tip = pct(b.left + size / 6, b.top + size / 12);
    }

    const targets = [];
    document.querySelectorAll('[data-pt]').forEach((el) => {
      const b = el.getBoundingClientRect();
      if (b.width === 0 || b.height === 0) return;
      const [x0, y0] = pct(b.left, b.top);
      const [x1, y1] = pct(b.right, b.bottom);
      targets.push({ name: el.getAttribute('data-pt'), x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 });
    });
    return { tip, targets };
  });

  if (res.error) { console.error(`t=${t}  ${res.error}`); continue; }
  const round = (v) => Math.round(v * 100) / 100;
  out[t] = {
    tip: res.tip ? res.tip.map(round) : null,
    targets: Object.fromEntries(res.targets.map((g) => [g.name, [round(g.cx), round(g.cy)]])),
  };

  if (asJson) continue;
  const tipTxt = res.tip ? `(${round(res.tip[0])}, ${round(res.tip[1])})` : '숨김/없음';
  console.log(`\nt=${t}  포인터 화살촉 ${tipTxt}`);
  if (res.targets.length === 0) { console.log('  (data-pt 대상이 화면에 없다)'); continue; }
  const inside = res.tip
    ? res.targets.filter((g) => res.tip[0] >= g.x0 && res.tip[0] <= g.x1 && res.tip[1] >= g.y0 && res.tip[1] <= g.y1)
    : [];
  for (const g of res.targets) {
    const hit = inside.includes(g);
    const mark = res.tip ? (hit ? '✓' : inside.length === 0 ? '✗' : '·') : '·';
    const dist = res.tip ? Math.hypot(res.tip[0] - g.cx, res.tip[1] - g.cy) : null;
    const distTxt = dist === null ? '' : `  거리 ${round(dist)}%p`;
    console.log(`  ${mark} ${g.name.padEnd(12)} 대상 중심 { x: ${round(g.cx)}, y: ${round(g.cy)} }${distTxt}`);
  }
  if (res.tip && inside.length === 0) {
    const near = res.targets.slice().sort((a, b) => Math.hypot(res.tip[0] - a.cx, res.tip[1] - a.cy) - Math.hypot(res.tip[0] - b.cx, res.tip[1] - b.cy))[0];
    console.log(`  → 화살촉이 어느 대상에도 닿지 않는다. 가장 가까운 것은 ${near.name} — 좌표를 { x: ${round(near.cx)}, y: ${round(near.cy)} }로 고친다.`);
  }
}

if (asJson) console.log(JSON.stringify(out, null, 2));
await browser.close();
