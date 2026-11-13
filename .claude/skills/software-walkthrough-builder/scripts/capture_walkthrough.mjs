// walkthrough 씬 픽셀 검수 캡처 — 직전 슬라이드에서 →키로 진입해 t0을
// 슬라이드 활성화 시점에 정렬한다 (직전 슬라이드의 빌드 클릭 자동 소진).
//
// 사용:  node capture_walkthrough.mjs <deckId> <슬라이드번호> <t목록> [출력폴더]
// 예:    node .claude/skills/software-walkthrough-builder/scripts/capture_walkthrough.mjs \
//          claude-code-guide 7 1.5,6,13.5 tmp/walk-shots
// dev 서버(기본 5199, SMOKE_BASE로 변경)가 떠 있어야 한다.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const [deckId, slideArg, timesArg, outArg] = process.argv.slice(2);
if (!deckId || !slideArg || !timesArg) {
  console.error('usage: capture_walkthrough.mjs <deckId> <slideNo> <t,t,t> [outdir]');
  process.exit(1);
}
const slideNo = Number(slideArg);
const times = timesArg.split(',').map(Number);
const OUT = outArg || 'tmp/walk-shots';
const BASE = process.env.SMOKE_BASE || 'http://localhost:5199';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

// 직전 슬라이드 로드 → 안정화 → 해시가 바뀔 때까지 ArrowRight
await page.goto(`${BASE}/?deck=${deckId}#${slideNo - 1}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
for (let i = 0; i < 16; i++) {
  await page.keyboard.press('ArrowRight');
  const h = await page.evaluate(() => location.hash);
  if (h === `#${slideNo}`) break;
  await page.waitForTimeout(120);
}
const t0 = Date.now();
for (const t of times) {
  const wait = t * 1000 - (Date.now() - t0);
  if (wait > 0) await page.waitForTimeout(wait);
  const file = `${OUT}/${deckId}-s${slideNo}-t${t}.png`;
  await page.screenshot({ path: file });
  console.log('captured', file);
}
await browser.close();
