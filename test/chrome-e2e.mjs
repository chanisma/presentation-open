/* 범용 bolt 크롬 E2E — 레거시 덱(합성 키 구동)·컨트랙트 덱(DeckController) 검증.
   핵심: 키 한 번에 정확히 1장 이동(이중 처리 없음), 그리드 점프, 카운터 동기화.
   실행: dev 서버(5199) 기동 후  node test/chrome-e2e.mjs */
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_BASE || 'http://localhost:5199';
const results = [];
const ok = (name, cond, extra = '') =>
  results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);

const DECKS = [
  { label: '레거시(다크)', url: '/data/2026-1/프로그래밍/오리엔테이션/index.html', shot: 'test/chrome-legacy-dark.png' },
  { label: '레거시(NotebookLM 라이트)', url: '/data/2026-1/정보/2027프로그래밍선택과목/index.html', shot: 'test/chrome-legacy-light.png' },
  { label: '컨트랙트(deck.js)', url: '/data/dev/테스트 수업 자료/css-첫걸음/index.html', shot: 'test/chrome-contract.png' },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

const counter = async () => {
  const t = await page.locator('.bc-counter b').textContent().catch(() => null);
  return t ? parseInt(t, 10) : null;
};

for (const d of DECKS) {
  await page.goto(BASE + d.url, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const hasDock = (await page.locator('.bc-dock').count()) === 1;
  ok(`${d.label}: 독 장착`, hasDock);
  if (!hasDock) continue;

  const total = await page.locator('.bc-counter span').textContent();
  const start = await counter();
  ok(`${d.label}: 카운터 초기값 1`, start === 1, `${start}${total}`);

  // 키 1회 = 정확히 1장 (이중 처리 없음)
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(700);
  const after = await counter();
  ok(`${d.label}: →키 1회 = 2쪽`, after === 2, `${after}쪽`);

  // 독 버튼으로 이전
  await page.click('.bc-dock [data-act="prev"]');
  await page.waitForTimeout(700);
  ok(`${d.label}: 독 ◀ = 1쪽`, (await counter()) === 1);

  // 그리드 열기 → 4번째 셀 점프
  await page.keyboard.press('g');
  await page.waitForTimeout(500);
  const cells = await page.locator('.bc-cell').count();
  ok(`${d.label}: 그리드 셀`, cells >= 4, `${cells}개`);
  await page.locator('.bc-cell').nth(3).click();
  await page.waitForTimeout(1600); // 합성 키 스텝 이동 시간
  const jumped = await counter();
  ok(`${d.label}: 그리드 점프 → 4쪽`, jumped === 4, `${jumped}쪽`);

  await page.keyboard.press('ArrowLeft'); // 프레임 정리용 이동
  await page.waitForTimeout(400);
  await page.screenshot({ path: d.shot });
}

await browser.close();
console.log(results.join('\n'));
console.log('\n페이지 오류:', errors.length ? errors.join('\n') : '없음');
process.exitCode = results.some((r) => r.startsWith('FAIL')) ? 1 : 0;
