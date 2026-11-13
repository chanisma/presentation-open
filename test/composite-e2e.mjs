/* 컴포지트 덱 E2E — deck.json 매니페스트 로드·세그먼트 확장·테마·내비 검증
   실행: dev 서버(5199) 기동 후  node test/composite-e2e.mjs */
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_BASE || 'http://localhost:5199';
const MANIFEST = 'data/dev/테스트 수업 자료/컴포지트-데모/deck.json';
const results = [];
const ok = (name, cond, extra = '') =>
  results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('console: ' + m.text());
});

// 1. 매니페스트 로드 + 세그먼트 확장 (타이틀 1 + 이미지 3 + 불릿 1 = 5쪽)
await page.goto(`${BASE}/?composite=${encodeURIComponent(MANIFEST)}#1`, {
  waitUntil: 'networkidle',
});
await page.waitForTimeout(1500);
ok('탭 제목(매니페스트)', (await page.title()).includes('컴포지트 데모'));
ok('타이틀 슬라이드 렌더', await page.locator('.slide').first().isVisible());
// 엔진은 활성 슬라이드만 스테이지에 올린다 — 총 쪽수는 그리드 썸네일로 계수
await page.keyboard.press('g');
await page.waitForTimeout(500);
const thumbs = await page.locator('.noir-grid-list .noir-thumb').count();
ok('세그먼트 확장 5쪽(그리드)', thumbs === 5, `${thumbs}쪽`);
await page.keyboard.press('Escape');
await page.waitForTimeout(300);

// 2. 매니페스트 테마 적용
const primary = await page.evaluate(() =>
  getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
);
ok('테마 적용(--primary)', primary === '#4fe5b0', primary);

// 3. 이미지 세그먼트 — 상대 경로 해석 + KenBurns 렌더 + 캡션
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(900);
ok('내비게이션(hash)', page.url().includes('#2'), page.url().split('#')[1] || '');
const img = page.locator('.slide img[src*="slide-01.png"]');
ok('NotebookLM 이미지 로드', await img.first().isVisible());
const natural = await img
  .first()
  .evaluate((el) => el.naturalWidth);
ok('이미지 실제 로드(naturalWidth)', natural > 0, `${natural}px`);
ok(
  '캡션 렌더',
  (await page.locator('text=수업 이미지가 그대로 슬라이드로').count()) > 0
);

// 4. 캡션 없는 순수 이미지 쪽 (#4) — 스크림 없이 이미지만
await page.goto(`${BASE}/?composite=${encodeURIComponent(MANIFEST)}#4`, {
  waitUntil: 'networkidle',
});
await page.waitForTimeout(1200);
ok(
  '캡션 없는 쪽(slide-04)',
  await page.locator('.slide img[src*="slide-04.png"]').first().isVisible()
);

// 5. 불릿 세그먼트 (#5) — 빌드 3개
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(600);
const bulletsText = await page.locator('.slide', {
  hasText: '이 덱이 증명하는 것',
}).count();
ok('불릿 슬라이드', bulletsText > 0);

// 6. 프레젠터 복구 정보 저장
const saved = await page.evaluate(() =>
  JSON.parse(localStorage.getItem('composite:current') || 'null')
);
ok('composite:current 저장', saved?.path === MANIFEST, saved?.path ?? '없음');

console.log(results.join('\n'));
console.log(errors.length ? '오류:\n' + errors.join('\n') : '콘솔/페이지 오류: 없음');
await browser.close();
process.exit(results.some((r) => r.startsWith('FAIL')) ? 1 : 0);
