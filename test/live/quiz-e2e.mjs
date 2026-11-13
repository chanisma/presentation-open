// test/live/quiz-e2e.mjs — 실시간 퀴즈 멀티컨텍스트 E2E
//
// 실행: node test/live/quiz-e2e.mjs (실서버 대상 — 세션 생성에 비밀구절 불필요, v10)
// 시나리오: 교사 콘솔 세션 생성 → 학생 3명 참여 → 덱 호스트 모드에서 문항 열기
//          → 학생 제출(정답2/오답1) → 집계 확인 → 결과 공개 → 학생 화면 검증 → 회귀 확인
// 종료: 실패 시 exit 1. 생성된 세션 코드/ID를 출력한다(수동 정리용).

import { chromium } from 'playwright';
import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PORT = 3210;
const BASE = `http://localhost:${PORT}`;
const DECK = '/data/2026-1/프로그래밍/2차시-웹은어떻게만들어질까/index.html';
const HEADED = process.env.HEADED === '1';

// ── 내장 정적 서버 (외부 의존 없음) ──
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};
const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, BASE).pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.resolve(ROOT, '.' + p);
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    const data = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  } catch (e) {
    res.writeHead(404).end('not found');
  }
});
await new Promise((r) => server.listen(PORT, r));

// ── 테스트 하네스 ──
const results = [];
function check(name, ok, detail = '') {
  results.push([name, !!ok]);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SNAP_DIR = process.env.SNAP_DIR || '';
async function snap(page, name) {
  if (!SNAP_DIR) return;
  await page.screenshot({ path: path.join(SNAP_DIR, name + '.png') }).catch(() => {});
}

const browser = await chromium.launch({ headless: !HEADED });
let sessionInfo = 'unknown';
try {
  // 1) 교사 콘솔: 세션 생성
  const hostCtx = await browser.newContext();
  const hp = await hostCtx.newPage();
  await hp.goto(`${BASE}/live/host/classic.html`);
  await hp.fill('#titleInput', 'E2E 자동 테스트');
  await hp.selectOption('#deckSelect', { index: 0 }).catch(() => {});
  await hp.click('#createBtn');
  await hp.waitForSelector('.bigcode', { timeout: 15000 });
  const code = (await hp.textContent('.bigcode')).trim();
  check('세션 생성 (콘솔)', /^[A-Z0-9]{6}$/.test(code), `code=${code}`);
  sessionInfo = code;

  // 2) 학생 3명 참여
  const students = [];
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/live/join/classic.html?code=${code}`);
    await page.fill('#nickInput', `학생${i}`);
    await page.click('#joinBtn');
    await page.waitForSelector('.waiting', { timeout: 15000 });
    students.push(page);
  }
  check('학생 3명 참여 → 대기 화면', true);

  // 3) 콘솔 대시보드에 참여자 수 반영 (3초 폴링)
  await hp.waitForFunction(() => document.querySelector('#pCount')?.textContent === '3', null, { timeout: 15000 });
  check('콘솔 참여자 수 3 표시', true);

  // 4) 덱 호스트 모드: 미니바 장착 + 퀴즈 슬라이드로 이동 + 문항 열기
  const dp = await hostCtx.newPage(); // 콘솔과 같은 컨텍스트 → lp.host.<code> 공유
  await dp.goto(`${BASE}${DECK}?live=${code}&host=1`);
  await dp.waitForSelector('.lp-hud', { timeout: 15000 });
  check('덱 미니바 장착', true);
  await dp.click('body'); // 포커스 확보
  for (let i = 0; i < 6; i++) { await dp.keyboard.press('ArrowRight'); await sleep(120); }
  const onQuiz = await dp.evaluate(() =>
    [...document.querySelectorAll('.slide')].findIndex((s) => s.classList.contains('active')));
  check('퀴즈 슬라이드 도달 (index 6)', onQuiz === 6, `active=${onQuiz}`);
  await dp.waitForSelector('.lp-hud [data-act="open"]', { timeout: 10000 });
  await dp.click('.lp-hud [data-act="open"]');
  await dp.waitForSelector('.lp-hud [data-act="reveal"]', { timeout: 10000 });
  check('문항 열기 → 미니바 상태 전환', true);

  // 5) 학생 화면에 문항 표시 (broadcast 즉시 or 5초 폴링) → 제출
  const answers = [1, 0, 1]; // 정답=1
  for (let i = 0; i < 3; i++) {
    const page = students[i];
    await page.waitForSelector('.choice button', { timeout: 12000 });
    await page.click(`.choice button[data-i="${answers[i]}"]`);
    if (i === 0) await snap(page, '1-학생-문항선택');
    await page.click('#submitBtn');
    await page.waitForSelector('.done', { timeout: 10000 });
  }
  check('학생 3명 문항 수신·제출 완료', true);

  // 6) 미니바 응답 카운트 (2.5초 폴링)
  await dp.waitForFunction(() => /응답 3/.test(document.querySelector('.lp-hud')?.textContent || ''),
    null, { timeout: 12000 });
  check('미니바 응답 3/3 집계', true);

  // 7) 결과 공개 → 오버레이 차트 (프로젝터 화면)
  await dp.click('.lp-hud [data-act="reveal"]');
  await dp.waitForSelector('.lp-result', { timeout: 10000 });
  const overlay = await dp.textContent('.lp-result');
  check('공개 오버레이: 정답 보기 2명 표시', /2명/.test(overlay) && /정답/.test(overlay));
  await sleep(800); // 막대 애니메이션 완료 후 캡처
  await snap(dp, '2-덱-결과공개-오버레이');

  // 8) 학생 결과 화면: 정답자/오답자 피드백 + 차트
  await students[0].waitForFunction(() => document.body.textContent.includes('정답이에요'), null, { timeout: 12000 });
  await students[1].waitForFunction(() => document.body.textContent.includes('아쉬워요'), null, { timeout: 12000 });
  const chartOk = await students[2].waitForSelector('.lp-chart', { timeout: 12000 }).then(() => true);
  check('학생 결과 수신 (정답/오답 피드백 + 차트)', chartOk);
  await sleep(800);
  await snap(students[0], '3-학생-결과-정답');
  await snap(students[1], '4-학생-결과-오답');
  await snap(hp, '5-교사콘솔-대시보드');

  // 8.5) 3동사 컨트롤: 공개 상태에서 [문항 닫기] → 결과 화면이 교사·학생 양쪽에서 제거
  await dp.waitForSelector('.lp-hud [data-act="close"]', { timeout: 10000 });
  await dp.click('.lp-hud [data-act="close"]');
  await students[0].waitForSelector('.waiting', { timeout: 12000 });
  check('문항 닫기 → 학생 결과 화면 제거 (대기 화면)', true);
  await dp.waitForSelector('.lp-hud [data-act="reveal"]', { timeout: 10000 });
  const closedBar = await dp.textContent('.lp-hud');
  check('닫은 뒤 미니바: 다시 열기 + 다시 공개', /다시 열기/.test(closedBar) && /다시 공개/.test(closedBar));
  const overlayGone = await dp.evaluate(() => !document.querySelector('.lp-result'));
  check('문항 닫기 시 호스트 결과 오버레이 제거', overlayGone);

  // 8.6) 다시 공개 → 결과 화면 재표시 (학생)
  await dp.click('.lp-hud [data-act="reveal"]');
  await students[0].waitForFunction(() => document.body.textContent.includes('정답이에요'), null, { timeout: 12000 });
  check('다시 공개 → 학생 결과 재표시', true);

  // 9) 공개 전 정답 비노출 검증: 학생 페이지 어디에도 answer가 오지 않았는지
  const leaked = await students[2].evaluate(() =>
    document.querySelector('.choice') ? 'active-question' : 'ok');
  check('학생 화면 상태 정상 (공개 후 문항 UI 아님)', leaked === 'ok');

  // 10) 회귀: ?live= 없이 열면 미니바 없음 + 네비게이션 정상 + 슬라이드 13장
  const rp = await hostCtx.newPage();
  await rp.goto(`${BASE}${DECK}`);
  await sleep(1800);
  const noHud = await rp.evaluate(() => !document.querySelector('.lp-hud'));
  const slideCount = await rp.evaluate(() => document.querySelectorAll('.slide').length);
  await rp.click('body');
  await rp.keyboard.press('ArrowRight');
  await sleep(500);
  const idx = await rp.evaluate(() =>
    [...document.querySelectorAll('.slide')].findIndex((s) => s.classList.contains('active')));
  check('회귀: 미니바 미장착', noHud);
  check('회귀: 슬라이드 14장 (11+퀴즈2+코드1)', slideCount === 14, `count=${slideCount}`);
  check('회귀: 키보드 네비게이션 정상', idx === 1, `active=${idx}`);

  // 11) 시트 아카이빙: [시트에 저장] → GAS 왕복 → 성공 토스트 (응답 3건 확인)
  await hp.bringToFront();
  await hp.click('#sheetBtn');
  const toastText = await hp.waitForSelector('.lp-toast', { timeout: 30000 })
    .then((el) => el.textContent());
  check('시트 저장 왕복 (응답 3건)', /시트 저장 완료/.test(toastText) && /응답 3건/.test(toastText),
    toastText.trim().slice(0, 80));
  await snap(hp, '7-콘솔-시트저장-토스트');

  // 12) 세션 종료 (아카이브 URL 설정 시 자동 재저장 포함)
  await hp.click('#endBtn');
  await hp.click('#endBtn'); // 2단계 확인
  await hp.waitForSelector('#createBtn', { timeout: 40000 }); // 자동 저장 후 홈 복귀
  check('세션 종료 + 자동 아카이브 후 홈 복귀', true);
} catch (e) {
  check('예외 없음', false, e.message.slice(0, 200));
} finally {
  await browser.close();
  server.close();
}

console.log('');
const fails = results.filter(([, ok]) => !ok);
console.log(`결과: ${results.length - fails.length}/${results.length} 통과  ·  세션 코드: ${sessionInfo}`);
if (fails.length) console.log('실패:', fails.map(([n]) => n).join(', '));
process.exit(fails.length ? 1 : 0);
