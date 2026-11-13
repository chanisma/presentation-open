/* 레거시 뷰어 E2E — 진짜 bolt 엔진 크롬으로 HTML 덱을 컨트롤.
   실행: dev 서버(5199) 기동 후  node test/viewer-e2e.mjs */
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_BASE || 'http://localhost:5199';
const DECK = 'data/2026-1/프로그래밍/오리엔테이션/index.html'; // 12장 정적 레거시 덱
const results = [];
const ok = (name, cond, extra = '') =>
  results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

const frame = () =>
  page.frames().find((f) => {
    if (f === page.mainFrame()) return false;
    try {
      return decodeURIComponent(f.url()).includes('오리엔테이션');
    } catch {
      return false;
    }
  });
const activeIdx = () =>
  frame()?.evaluate(() =>
    [...document.querySelectorAll('.slide')].findIndex((s) => s.classList.contains('active'))
  );

await page.goto(`${BASE}/?legacy=${encodeURIComponent(DECK)}#1`, { waitUntil: 'load' });
await page.waitForSelector('.noir-dock', { timeout: 15000 }).catch(() => {});
ok('진짜 엔진 독(.noir-dock)', (await page.locator('.noir-dock').count()) === 1);
// iframe "내부"까지 검사 — 메인 프레임만 보면 항상 0이라 무의미하다
await page.waitForTimeout(600);
const bcInFrame = await frame()
  ?.evaluate(() => document.querySelectorAll('.bc-dock, .dk-nav').length)
  .catch(() => -1);
ok('iframe 내부 자체 독 억제(?chrome=0)', bcInFrame === 0, `${bcInFrame}개`);
await page.waitForTimeout(1200);
ok('콘텐츠 iframe 1쪽 활성', (await activeIdx()) === 0, `idx=${await activeIdx()}`);

// 부모 키 입력 → 엔진 → deck-sync → iframe 동기화
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(700);
ok('→키 = iframe 2쪽', (await activeIdx()) === 1, `idx=${await activeIdx()}`);
ok('엔진 hash 동기화', page.url().includes('#2'), page.url().split('#')[1] ?? '');

// iframe 내부 클릭(포커스 이동) 후 키 입력 → 캡처 포워딩으로 정확히 1장 이동
await page.mouse.click(720, 450);
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(700);
ok('iframe 포커스 상태 →키 = 3쪽 (이중 이동 없음)', (await activeIdx()) === 2, `idx=${await activeIdx()}`);

// 진짜 그리드 뷰 (엔진 G) — 미니 iframe 썸네일
await page.keyboard.press('g');
await page.waitForTimeout(1500);
const gridOpen = (await page.locator('.noir-grid').count()) === 1;
ok('엔진 그리드 뷰', gridOpen);
if (gridOpen) {
  const thumbs = await page.locator('.noir-grid iframe').count();
  ok('그리드 미니 iframe 썸네일', thumbs >= 12, `${thumbs}개`);
  await page.screenshot({ path: 'test/viewer-grid.png' });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
}

// 사이드바 레일 (엔진 S)
await page.keyboard.press('s');
await page.waitForTimeout(1000);
ok('엔진 사이드바 레일', (await page.locator('.noir-rail').count()) >= 1);
await page.keyboard.press('s');
await page.waitForTimeout(300);
await page.screenshot({ path: 'test/viewer-main.png' });

// ── 라이브 호스트 모드: 진짜 noir 독 안에 라이브 세그먼트 ──
const CODE = 'ZTEST9';
await ctx.addInitScript(
  ([code]) => {
    localStorage.setItem(
      'lp.host.' + code,
      JSON.stringify({ code, hostToken: 'tok', sessionId: 's1', savedAt: Date.now() })
    );
  },
  [CODE]
);
await ctx.route('**/rest/v1/rpc/**', (route) => {
  const fn = route.request().url().split('/rpc/')[1].split('?')[0];
  const reply = (json) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(json) });
  if (fn === 'lp_resume_session')
    return reply({ sessionId: 's1', code: CODE, status: 'open', currentSlide: 0 });
  if (fn === 'lp_host_state')
    return reply({ session: { id: 's1', gamify: false }, participantCount: 1, participants: [], activities: [] });
  return reply({ ok: true });
});
const page2 = await ctx.newPage();
await page2.goto(
  `${BASE}/?legacy=${encodeURIComponent('data/2026-1/정보/반복문/index.html')}&live=${CODE}&host=1#1`,
  { waitUntil: 'load' }
);
await page2.waitForSelector('.noir-dock .noir-bar .lp-seg', { timeout: 15000 }).catch(() => {});
ok('뷰어 라이브: 독 내부 세그먼트', (await page2.locator('.noir-dock .noir-bar .lp-seg').count()) === 1);
ok(
  '뷰어 라이브: quiz.json 문항 버튼',
  (await page2.locator('[data-act="list"]').count()) === 1
);
await page2.screenshot({ path: 'test/viewer-live.png' });

await browser.close();
console.log(results.join('\n'));
console.log('\n페이지 오류:', errors.length ? errors.join('\n') : '없음');
process.exitCode = results.some((r) => r.startsWith('FAIL')) ? 1 : 0;
