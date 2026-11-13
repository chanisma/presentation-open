/* React host/join 오버홀 E2E — Supabase RPC 스텁 (실서버 미접촉).
   join: 입장 → 객관식 제출 → 제출 완료 → 결과 공개(verdict + 차트)
   host: 세션 생성 → 대시보드(QR·참여) → 문항 현황 → 결과 공개 → 학생 조작 토글
   mirror: 미러 입장 → 클릭 차단막 존재 → 교사가 풀면 제거 → 다시 잠그면 복구
   실행: dev 서버(5199) 기동 후  node test/live/react-live-e2e.mjs */
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_BASE || 'http://localhost:5199';
const results = [];
const ok = (name, cond, extra = '') =>
  results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);

const browser = await chromium.launch();

/* ══ 학생(join) 흐름 ══ */
{
  const CODE = 'ZJOIN1';
  const activity = {
    id: 'act-1', kind: 'choice', prompt: 'HTTP 상태코드 404의 의미는?',
    status: 'open', round: 1,
    config: { options: ['서버 오류', '페이지 없음', '권한 없음'] },
  };
  let revealed = false;
  const ctx = await browser.newContext({ viewport: { width: 900, height: 900 } });
  await ctx.route('**/rest/v1/rpc/**', (route) => {
    const fn = route.request().url().split('/rpc/')[1].split('?')[0];
    const reply = (json) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(json) });
    if (fn === 'lp_join')
      return reply({
        sessionId: 's1', participantId: 'p1', code: CODE, title: '테스트 수업',
        nameMode: 'anonymous', myStudentNo: null, currentActivity: activity,
        currentSlide: 0, deckPath: null, myResponses: [],
      });
    if (fn === 'lp_submit') return reply({ ok: true, round: 1 });
    if (fn === 'lp_student_state')
      return reply(
        revealed
          ? {
              status: 'open',
              currentActivity: { ...activity, status: 'revealed' },
              currentSlide: 0,
              revealedAggregates: { total: 3, counts: [1, 2, 0], answer: 1 },
            }
          : { status: 'open', currentActivity: activity, currentSlide: 0, revealedAggregates: null }
      );
    return reply({});
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto(`${BASE}/?app=join&code=${CODE}`, { waitUntil: 'load' });
  await page.waitForSelector('#lvNick', { timeout: 10000 });
  ok('join: 코드 프리필', (await page.inputValue('#lvCode')) === CODE);
  await page.fill('#lvNick', '테스트학생');
  await page.click('button:has-text("참여하기")');
  await page.waitForSelector('.lv-prompt', { timeout: 10000 }).catch(() => {});
  ok('join: 문항 표시', (await page.locator('.lv-prompt').textContent().catch(() => ''))?.includes('404'));
  await page.click('.lv-choice >> nth=1');
  ok('join: 보기 선택', (await page.locator('.lv-choice.sel').count()) === 1);
  await page.click('button:has-text("제출하기")');
  await page.waitForSelector('h2:has-text("제출 완료")', { timeout: 8000 }).catch(() => {});
  ok('join: 제출 완료 화면', (await page.locator('h2:has-text("제출 완료")').count()) === 1);

  revealed = true; // 다음 폴링부터 공개 상태
  await page.waitForSelector('.lv-verdict', { timeout: 12000 }).catch(() => {});
  const verdict = await page.locator('.lv-verdict').textContent().catch(() => '');
  ok('join: 공개 후 정오답 배너', (verdict ?? '').includes('정답'), (verdict ?? '').trim());
  const chartFilled = await page
    .locator('.lv-card [class*="lp-"]')
    .count()
    .then((n) => n > 0)
    .catch(() => false);
  ok('join: 집계 차트 렌더', chartFilled);
  await page.screenshot({ path: 'test/join-revealed.png' });
  ok('join: 페이지 오류 없음', errors.length === 0, errors.join(' / '));
  await ctx.close();
}

/* ══ 교사(host) 흐름 ══ */
{
  const CODE = 'ZHOST1';
  const activity = {
    id: 'act-9', slideKey: 'adhoc-1', slideIndex: null, kind: 'ox',
    prompt: 'OX 테스트 문항', status: 'open', currentRound: 1,
    config: { answer: true }, roundCounts: [2, 0], responseCount: 2,
    aggregates: { total: 2, counts: { O: 1, X: 1 } }, revealedAt: null,
  };
  const rpcCalls = [];
  let hostInteract = false;   // lp_set_interact 로 뒤집히는 세션 플래그(v11)
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 1000 } });
  await ctx.route('**/rest/v1/rpc/**', (route) => {
    const fn = route.request().url().split('/rpc/')[1].split('?')[0];
    rpcCalls.push(fn);
    const reply = (json) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(json) });
    if (fn === 'lp_create_session')
      return reply({ sessionId: 's9', code: CODE, hostToken: 'tok-9' });
    if (fn === 'lp_set_interact') {
      hostInteract = JSON.parse(route.request().postData() || '{}').p_on;
      return reply({ allowInteract: hostInteract });
    }
    if (fn === 'lp_host_state')
      return reply({
        session: {
          id: 's9', code: CODE, status: 'open', gamify: false,
          deckPath: 'index.html?deck=ai-changing-world', allowInteract: hostInteract,
        },
        participantCount: 2,
        participants: [
          { nickname: '학생A', studentNo: '10101' },
          { nickname: '학생B', studentNo: null },
        ],
        activities: [activity],
      });
    if (fn === 'lp_reveal_activity')
      return reply({ total: 2, counts: { O: 1, X: 1 }, answer: true });
    return reply({});
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto(`${BASE}/?app=host`, { waitUntil: 'load' });
  await page.waitForSelector('#lvTitle', { timeout: 10000 });
  await page.fill('#lvTitle', 'E2E 테스트 세션');
  await page.click('button:has-text("세션 만들기")');
  await page.waitForSelector('.lv-bigcode', { timeout: 10000 }).catch(() => {});
  ok('host: 세션 생성 → 대시보드', (await page.locator('.lv-bigcode').textContent().catch(() => '')) === CODE);
  await page.waitForSelector('.lv-qr svg', { timeout: 8000 }).catch(() => {});
  ok('host: QR 렌더', (await page.locator('.lv-qr svg').count()) === 1);
  await page.waitForSelector('.lv-chip', { timeout: 8000 }).catch(() => {});
  ok('host: 참가자 칩 2명', (await page.locator('.lv-chip').count()) === 2);
  ok('host: 문항 현황 표시', (await page.locator('.lv-act__prompt').first().textContent().catch(() => ''))?.includes('OX'));
  await page.click('.lv-act__btns button:has-text("결과 공개")');
  await page.waitForTimeout(1200);
  ok('host: 결과 공개 RPC', rpcCalls.includes('lp_reveal_activity'));

  // 학생 조작(미러 클릭 차단) 토글 — 덱 연결 세션에서만 노출
  const interactBtn = page.locator('button:has-text("학생 조작")');
  ok('host: 학생 조작 토글 노출', (await interactBtn.count()) === 1);
  await interactBtn.click();
  await page.waitForTimeout(1200);
  ok('host: 학생 조작 허용 RPC', rpcCalls.includes('lp_set_interact') && hostInteract === true);
  ok(
    'host: 토글 라벨 반전',
    (await page.locator('button:has-text("학생 조작")').textContent().catch(() => ''))?.includes('허용됨')
  );
  await page.screenshot({ path: 'test/host-dashboard.png' });
  ok('host: 페이지 오류 없음', errors.length === 0, errors.join(' / '));
  await ctx.close();
}

/* ══ 학생 미러 — 클릭 차단막 해제/재잠금 (v11) ══ */
{
  const CODE = 'ZMIRR1';
  let allow = false;     // 교사 토글 상태 (studentState 로 수렴)
  let hostSlide = 0;     // 교사가 보고 있는 슬라이드
  const ctx = await browser.newContext({ viewport: { width: 900, height: 900 } });
  await ctx.route('**/rest/v1/rpc/**', (route) => {
    const fn = route.request().url().split('/rpc/')[1].split('?')[0];
    const reply = (json) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(json) });
    if (fn === 'lp_join')
      return reply({
        sessionId: 's2', participantId: 'p2', code: CODE, title: '미러 수업',
        nameMode: 'anonymous', myStudentNo: null, currentActivity: null,
        currentSlide: hostSlide, deckPath: 'index.html?deck=python-conditionals',
        allowInteract: allow, myResponses: [],
      });
    if (fn === 'lp_student_state')
      return reply({
        status: 'open', currentActivity: null, currentSlide: hostSlide,
        allowInteract: allow, revealedAggregates: null,
      });
    return reply({});
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?app=join&code=${CODE}`, { waitUntil: 'load' });
  await page.waitForSelector('#lvNick', { timeout: 10000 });
  await page.fill('#lvNick', '미러학생');
  await page.click('button:has-text("참여하기")');
  await page.waitForSelector('.lv-mirror-wrap', { timeout: 10000 }).catch(() => {});
  ok('mirror: 선생님 화면 미러', (await page.locator('.lv-mirror-wrap iframe').count()) === 1);
  ok('mirror: 기본은 클릭 차단', (await page.locator('.lv-mirror-shield').count()) === 1);

  allow = true; // 교사가 [학생 조작]을 품 — 다음 폴링에서 수렴
  const unlocked = await page
    .waitForFunction(() => !document.querySelector('.lv-mirror-shield'), null, { timeout: 15000 })
    .then(() => true)
    .catch(() => false);
  ok('mirror: 허용 시 차단막 제거', unlocked);

  // 차단막이 걷히면 클릭이 iframe으로 들어가 학생이 직접 넘길 수 있다
  const hash = () =>
    page.evaluate(() => document.querySelector('.lv-mirror-wrap iframe').contentWindow.location.hash);
  await page.mouse.click(450, 400);   // 미러 화면 클릭 → iframe 포커스
  await page.waitForTimeout(300);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(1200);
  const moved = await hash();
  ok('mirror: 학생이 직접 슬라이드 이동', moved === '#2', moved);

  // 폴링(5초)이 학생이 옮긴 위치를 되돌리면 안 된다 — 교사가 실제로 움직일 때만 따라간다
  await page.waitForTimeout(7000);
  ok('mirror: 폴링이 학생 위치를 되돌리지 않음', (await hash()) === moved, `${moved} → ${await hash()}`);

  hostSlide = 4; // 교사가 이동 → 다시 끌려온다
  const resynced = await page
    .waitForFunction(
      () => document.querySelector('.lv-mirror-wrap iframe').contentWindow.location.hash === '#5',
      null, { timeout: 15000 }
    ).then(() => true).catch(() => false);
  ok('mirror: 교사 이동 시 재동기화', resynced, await hash());

  allow = false; // 다시 잠금
  const relocked = await page
    .waitForFunction(() => !!document.querySelector('.lv-mirror-shield'), null, { timeout: 15000 })
    .then(() => true)
    .catch(() => false);
  ok('mirror: 재잠금 시 차단막 복구', relocked);

  const beforeLocked = await hash();
  await page.mouse.click(450, 400);
  await page.waitForTimeout(300);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(1200);
  ok('mirror: 잠금 상태에선 조작 불가', (await hash()) === beforeLocked, `${beforeLocked} → ${await hash()}`);
  await page.screenshot({ path: 'test/join-mirror.png' });
  await ctx.close();
}

await browser.close();
console.log(results.join('\n'));
process.exitCode = results.some((r) => r.startsWith('FAIL')) ? 1 : 0;
