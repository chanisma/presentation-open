// diorama 슬라이드 픽셀 검수 캡처 — 무대 연출은 1프레임으로 볼 수 없다.
// 한 슬라이드를 여러 시각(입장 직후 / 연기 중 / 마지막 상태)에서 찍는다.
//
// 사용:  node capture_diorama.mjs <deckId> <슬라이드번호> <스케줄> [출력폴더]
//   스케줄 항목: 숫자 = 그 시각(초)에 캡처 · c = 클릭(빌드 한 단계 진행)
//   예:  node .claude/skills/diorama-deck-builder/scripts/capture_diorama.mjs \
//          diorama-demo 4 0.8,2.6,c,6 tmp/diorama-shots
//
// t0 정렬: 직전 슬라이드에서 →키로 진입해 씬 활성화 시점을 0으로 맞춘다
// (직전 슬라이드의 빌드 클릭이 자동 소진된다).
// dev 서버(기본 5199, SMOKE_BASE로 변경)가 떠 있어야 한다.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const [deckId, slideArg, scheduleArg, outArg] = process.argv.slice(2);
if (!deckId || !slideArg || !scheduleArg) {
  console.error('usage: capture_diorama.mjs <deckId> <slideNo> <t|c,...> [outdir]');
  process.exit(1);
}
const slideNo = Number(slideArg);
const schedule = scheduleArg.split(',').map((s) => s.trim());
const OUT = outArg || 'tmp/diorama-shots';
const BASE = process.env.SMOKE_BASE || 'http://localhost:5199';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

// 직전 슬라이드 로드 → 안정화 → 해시가 목표 슬라이드가 될 때까지 ArrowRight
// 1쪽은 2쪽에서 ←로, 그 외는 직전 쪽에서 →로 진입한다 — 어느 쪽이든
// 슬라이드가 새로 마운트되며 씬 t가 0으로 리셋된다 (페이지 로드 시각과 무관).
const startAt = slideNo === 1 ? 2 : slideNo - 1;
await page.goto(`${BASE}/?deck=${deckId}#${startAt}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1400);
const key = slideNo === 1 ? 'ArrowLeft' : 'ArrowRight';
for (let i = 0; i < 20; i++) {
  await page.keyboard.press(key);
  if ((await page.evaluate(() => location.hash)) === `#${slideNo}`) break;
  await page.waitForTimeout(140);
}
await page.waitForTimeout(120); // 씬 마운트

const t0 = Date.now();
let clicks = 0;
for (const item of schedule) {
  if (item === 'c') {
    await page.keyboard.press('ArrowRight');
    clicks++;
    console.log(`  · click ${clicks} (t≈${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    continue;
  }
  const t = Number(item);
  if (Number.isNaN(t)) continue;
  const wait = t * 1000 - (Date.now() - t0);
  if (wait > 0) await page.waitForTimeout(wait);
  const file = `${OUT}/${deckId}-s${slideNo}-t${t}${clicks ? `-c${clicks}` : ''}.png`;
  await page.screenshot({ path: file });
  console.log('captured', file);
}
await browser.close();
