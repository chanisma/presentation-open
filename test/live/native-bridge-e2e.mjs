/* 네이티브 React 덱 LiveBridge E2E — Supabase RPC를 라우트 인터셉션으로 스텁.
   검증 경로: 런타임 동적 로드 → 세션 복구 → 미니바 장착 → deck-sync 슬라이드
   동기화(setSlide RPC) → 컨텍스트 [문항 열기] → 문항 모달 표시.
   실행: 먼저 dev 서버(포트 5199) 기동 후  node test/live/native-bridge-e2e.mjs */
import { chromium } from 'playwright';

const BASE = 'http://localhost:5199';
const CODE = 'ZTEST9';
const results = [];
const ok = (name, cond, extra = '') =>
  results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);

const rpcCalls = [];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });

// 호스트 세션을 이 브라우저에 심는다 (교사 콘솔에서 세션을 연 상태 재현)
await ctx.addInitScript(
  ([code]) => {
    localStorage.setItem(
      'lp.host.' + code,
      JSON.stringify({ code, hostToken: 'tok-test', sessionId: 'sess-test', savedAt: Date.now() })
    );
  },
  [CODE]
);

let dockInteract = false;   // 독의 [학생 조작] 토글이 뒤집는 세션 플래그(v11)

// Supabase RPC 스텁 — 실제 서버·데이터에는 일절 접근하지 않는다
await ctx.route('**/rest/v1/rpc/**', (route) => {
  const fn = route.request().url().split('/rpc/')[1].split('?')[0];
  let body = null;
  try {
    body = route.request().postDataJSON();
  } catch {
    /* 무시 */
  }
  rpcCalls.push({ fn, body });
  const reply = (json) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(json) });
  if (fn === 'lp_resume_session')
    return reply({
      sessionId: 'sess-test',
      code: CODE,
      status: 'open',
      currentSlide: 0,
      title: '브리지 테스트',
      nameMode: 'anonymous',
    });
  if (fn === 'lp_set_interact') {
    dockInteract = !!body?.p_on;
    return reply({ allowInteract: dockInteract });
  }
  if (fn === 'lp_host_state')
    return reply({
      session: {
        id: 'sess-test', code: CODE, status: 'open', gamify: false,
        // 덱 연결 세션이어야 학생 미러가 생긴다 → [학생 조작] 토글 노출 조건
        deckPath: 'index.html?deck=python-conditionals',
        allowInteract: dockInteract,
      },
      participantCount: 3,
      participants: [],
      activities: [],
    });
  if (fn === 'lp_set_slide') return reply({ ok: true });
  if (fn === 'lp_open_activity')
    return reply({
      id: 'act-1',
      slideKey: body?.p_slide_key ?? 'q-colon',
      kind: 'ox',
      prompt: 'if 문에서 조건 뒤의 콜론(:)과 다음 줄 들여쓰기는 생략해도 된다.',
      config: {},
      status: 'open',
    });
  return reply({});
});
// realtime websocket은 스텁하지 않음 — 실패 시 폴링 모드로 degrade되는 것까지가 사양

const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

// 1. 호스트 모드로 네이티브 덱 진입
await page.goto(`${BASE}/index.html?deck=python-conditionals&live=${CODE}&host=1#1`, {
  waitUntil: 'networkidle',
});
await page.waitForSelector('.lp-hud', { timeout: 15000 }).catch(() => {});
ok('미니바(.lp-hud) 장착', (await page.locator('.lp-hud').count()) === 1);
// bolt 독 통합: 라이브 세그먼트가 엔진 도구 pill(.noir-bar) 안에 장착되어야 함
await page.waitForSelector('.noir-dock .noir-bar .lp-seg', { timeout: 8000 }).catch(() => {});
ok('독 내부 세그먼트 통합', (await page.locator('.noir-dock .noir-bar .lp-seg').count()) === 1);
ok('세션 코드 표시', (await page.locator('.lp-hud__code').textContent().catch(() => '')) === CODE);
const meta = await page.locator('.lp-seg .lp-hud__meta').first().textContent().catch(() => '');
ok('참여 인원 표시', /3/.test(meta ?? ''), meta ?? '');

// 2. 슬라이드 이동 → deck-sync 구독 → lp_set_slide 디바운스 호출
const before = rpcCalls.filter((c) => c.fn === 'lp_set_slide').length;
await page.keyboard.press('ArrowRight'); // #1 → #2 (표지는 빌드 없음)
await page.waitForTimeout(900); // 디바운스 400ms 대기
const setCalls = rpcCalls.filter((c) => c.fn === 'lp_set_slide');
ok(
  '슬라이드 동기화 RPC',
  setCalls.length > before,
  `호출 ${setCalls.length}회, 마지막 index=${setCalls.at(-1)?.body?.p_slide_index}`
);

// 3. 문항 있는 슬라이드(4쪽 = index 3, q-colon)로 이동 → 컨텍스트 버튼
await page.evaluate(() => {
  location.hash = '#4';
});
await page.waitForTimeout(900);
const openBtn = page.locator('[data-act="open"]');
ok('컨텍스트 [문항 열기] 버튼', (await openBtn.count()) >= 1);

// 4. 문항 열기 → 모달 표시 + lp_open_activity 호출
if ((await openBtn.count()) >= 1) {
  await openBtn.first().click();
  await page.waitForSelector('.lp-question', { timeout: 8000 }).catch(() => {});
  ok('문항 모달 표시', (await page.locator('.lp-question').count()) === 1);
  const prompt = await page.locator('.lp-question__prompt').textContent().catch(() => '');
  ok('문항 프롬프트', (prompt ?? '').includes('콜론'), (prompt ?? '').slice(0, 40));
  const opened = rpcCalls.find((c) => c.fn === 'lp_open_activity');
  ok('lp_open_activity 호출', !!opened, `slideKey=${opened?.body?.p_slide_key}`);
} else {
  ok('문항 모달 표시', false, '버튼 없음');
  ok('문항 프롬프트', false);
  ok('lp_open_activity 호출', false);
}

// 5. [문항 ▾] 전체 목록 (슬라이드 비귀속 포함 7개)
await page.locator('[data-act="list"]').first().click().catch(() => {});
await page.waitForTimeout(400);
const rows = await page.locator('.lp-act-row').count();
ok('문항 목록 7개', rows === 7, `${rows}개`);

// 6. [학생 조작] 토글 — 학생 미러의 클릭 차단 해제 (v11)
await page.locator('[data-act="list"]').first().click().catch(() => {});  // 목록 접기
await page.waitForTimeout(300);
const interactBtn = page.locator('[data-act="interact"]');
ok('학생 조작 토글 노출', (await interactBtn.count()) >= 1);
await interactBtn.first().click().catch(() => {});
await page.waitForTimeout(900);
ok(
  'lp_set_interact 호출 (on)',
  rpcCalls.some((c) => c.fn === 'lp_set_interact' && c.body?.p_on === true) && dockInteract === true
);
const interactTxt = await page.locator('[data-act="interact"]').first().textContent().catch(() => '');
ok('토글 라벨 반전', (interactTxt ?? '').includes('🔓'), (interactTxt ?? '').trim());

await page.screenshot({ path: 'test/live-bridge.png' });

// ── 레거시 덱(.bc-dock) 독 통합 시나리오 ──
// data-live 마크업 + live.js 스크립트를 가진 클래식 라이브 덱에서
// 라이브 세그먼트가 chrome.js 독 안에 장착되는지 확인
const page2 = await ctx.newPage();
await page2.goto(
  `${BASE}/data/2026-1/프로그래밍/2차시-웹은어떻게만들어질까/index.html?live=${CODE}&host=1`,
  { waitUntil: 'load' }
);
await page2.waitForSelector('.bc-dock .lp-seg', { timeout: 15000 }).catch(() => {});
ok('레거시 덱: 독 장착', (await page2.locator('.bc-dock').count()) === 1);
ok('레거시 덱: 독 내부 라이브 세그먼트', (await page2.locator('.bc-dock .lp-seg').count()) === 1);
ok(
  '레거시 덱: 세그먼트에 세션 코드',
  (await page2.locator('.bc-dock .lp-hud__code').textContent().catch(() => '')) === CODE
);
await page2.screenshot({ path: 'test/live-bridge-legacy.png' });

// ── 수업 종료 시나리오 ──
// 발표 중 [종료]를 누르면 미니바가 조작 버튼을 걷고 '수업 종료됨' 상태만 남기는지.
// 별도 컨텍스트에서 lp_end_session 호출 이후 hostState가 ended를 반환하도록 스텁.
let sessionEnded = false;
let ctx2Calls = 0;
const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx2.addInitScript(
  ([code]) => {
    localStorage.setItem(
      'lp.host.' + code,
      JSON.stringify({ code, hostToken: 'tok-test', sessionId: 'sess-test', savedAt: Date.now() })
    );
  },
  [CODE]
);
await ctx2.route('**/rest/v1/rpc/**', (route) => {
  const fn = route.request().url().split('/rpc/')[1].split('?')[0];
  ctx2Calls += 1;
  const reply = (json) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(json) });
  if (fn === 'lp_end_session') { sessionEnded = true; return reply({ ok: true }); }
  if (fn === 'lp_resume_session')
    return reply({ sessionId: 'sess-test', code: CODE, status: 'open', currentSlide: 0,
                   title: '브리지 테스트', nameMode: 'anonymous' });
  if (fn === 'lp_host_state')
    return reply({ session: { id: 'sess-test', code: CODE, gamify: false,
                              status: sessionEnded ? 'ended' : 'open' },
                   participantCount: 5, participants: [], activities: [] });
  return reply({});
});
const page3 = await ctx2.newPage();
page3.on('pageerror', (e) => errors.push('pageerror(ended): ' + e.message));
await page3.goto(`${BASE}/index.html?deck=python-conditionals&live=${CODE}&host=1#1`, {
  waitUntil: 'networkidle',
});
await page3.waitForSelector('.lp-hud [data-act="end"]', { timeout: 15000 }).catch(() => {});
// [종료] → [정말 종료?] 2단 확인
await page3.locator('[data-act="end"]').first().click();
await page3.waitForTimeout(200);
await page3.locator('[data-act="end"]').first().click();
await page3.waitForSelector('.lp-hud__btn--done', { timeout: 10000 }).catch(() => {});
const doneTxt = await page3.locator('.lp-hud__btn--done').first().textContent().catch(() => '');
ok('종료 후: 종료 표시 버튼', (doneTxt ?? '').includes('종료됨'), (doneTxt ?? '').trim());
ok(
  '종료 후: 버튼 비활성',
  await page3.locator('.lp-hud__btn--done').first().isDisabled().catch(() => false)
);
ok(
  '종료 후: 조작 버튼 사라짐',
  (await page3.locator('[data-act="end"], [data-act="qr"], [data-act="list"], [data-act="open"]').count()) === 0
);
// 종료 후에는 더 이상 폴링하지 않는다 (hostState 호출이 늘지 않아야 함)
const pollBase = ctx2Calls;
await page3.waitForTimeout(6000);
ok('종료 후: 폴링 중단', ctx2Calls === pollBase, `추가 호출 ${ctx2Calls - pollBase}건`);
await page3.screenshot({ path: 'test/live-bridge-ended.png' });

await browser.close();

console.log(results.join('\n'));
console.log('\n페이지 오류:', errors.length ? errors.join('\n') : '없음');
process.exitCode = results.some((r) => r.startsWith('FAIL')) ? 1 : 0;
