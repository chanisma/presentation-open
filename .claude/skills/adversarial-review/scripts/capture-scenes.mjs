// 씬 슬라이드를 시점·클릭 단계별로 캡처한다 — 씬 연출은 한 프레임으로 심사할 수 없다.
//
// 사용:  node capture-scenes.mjs <deckId> "<계획>" [출력폴더] [뷰포트폭]
//   계획 문법:  "슬라이드:클릭수,클릭수,… 슬라이드:…"
//   예:  "2:0,1,2,3 5:0,1,1 9:0,0,1"
//        → 2쪽은 진입/클릭1/클릭2/클릭3, 5쪽은 진입/클릭1/다시클릭1(누적), 9쪽은 진입/대기/클릭1
//   각 프레임 사이에 기본 2.4초를 기다린다(WAIT_MS로 변경).
//
// 주의: 슬라이드에 진입한 직후 바로 키를 누르면 Build 등록 전이라 다음 장으로 넘어간다.
//       이 스크립트는 진입 후 반드시 한 번 기다린 뒤 클릭한다.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const [deckId, planArg, outArg, wArg] = process.argv.slice(2);
if (!deckId || !planArg) {
  console.error('usage: capture-scenes.mjs <deckId> "2:0,1,2,3 5:0,1,1" [outDir] [viewportWidth]');
  process.exit(1);
}
const OUT = outArg || 'tmp/scene-shots';
const W = Number(wArg || 1600);
const H = Math.round((W * 9) / 16);
const WAIT = Number(process.env.WAIT_MS || 2400);
const BASE = process.env.SMOKE_BASE || 'http://localhost:5199';
mkdirSync(OUT, { recursive: true });

const plan = planArg.trim().split(/\s+/).map((chunk) => {
  const [slide, steps] = chunk.split(':');
  return { slide: Number(slide), steps: (steps || '0').split(',').map(Number) };
});

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));

for (const { slide, steps } of plan) {
  await page.goto(`${BASE}/?deck=${deckId}#${slide}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800); // Build 등록 대기 — 이걸 빼면 첫 키가 슬라이드를 넘긴다
  let done = 0;
  for (let i = 0; i < steps.length; i++) {
    for (let c = 0; c < steps[i]; c++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(350);
      done++;
    }
    await page.waitForTimeout(WAIT);
    const hash = await page.evaluate(() => location.hash);
    if (hash !== `#${slide}`) {
      console.warn(`  !! 슬라이드 ${slide}에서 벗어났다(${hash}) — 클릭 수를 줄여라`);
      break;
    }
    const name = `s${String(slide).padStart(2, '0')}-${i}-c${done}.png`;
    await page.screenshot({ path: `${OUT}/${name}` });
    console.log('캡처:', name);
  }
}
await browser.close();
console.log('페이지 오류:', errs.length ? errs.slice(0, 3) : '없음');
