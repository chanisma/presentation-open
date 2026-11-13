// test/live/contract-e2e.mjs — Phase 6 통합 E2E
//
// 실행: node test/live/contract-e2e.mjs (실서버 대상 — 세션 생성에 비밀구절 불필요, v10)
// 검증 범위:
//   · Deck Contract v1: deck.js 크롬(진행바·하단 네비·카운터), 해시 딥링크, 키보드 네비
//   · quiz.json: 콘솔 미리보기 → 미니바 [문항 ▾] 열기 → 학생 응답 → 공개
//   · 콘솔 주도: '덱 문항' 카드에서 exit 열기 → 학생 별점 → 콘솔 공개
//   · 뷰어: 검색 필터, LIVE 배지, [▶ 발표 시작] → 콘솔 덱 프리필
//   · 회귀: ?live= 없이 열면 크롬만 있는 일반 덱

import { chromium } from 'playwright';
import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PORT = 3213;
const BASE = `http://localhost:${PORT}`;
const DECK = '/data/dev/테스트 수업 자료/동적씬-버블정렬/';   // 디렉터리 URL (실서버의 .html 리다이렉트-쿼리 소실 대응과 동일 형태)
const DECK_PATH = 'data/dev/테스트 수업 자료/동적씬-버블정렬/index.html';
const SNAP_DIR = process.env.SNAP_DIR || '';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
};
const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, BASE).pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.resolve(ROOT, '.' + p);
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(await fs.readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(PORT, r));

const results = [];
function check(name, ok, detail = '') {
  results.push([name, !!ok]);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function snap(page, name) {
  if (!SNAP_DIR) return;
  await page.screenshot({ path: path.join(SNAP_DIR, name + '.png') }).catch(() => {});
}

const browser = await chromium.launch();
let CODE = 'unknown';
try {
  const hostCtx = await browser.newContext();

  // 0) 뷰어: 검색 + LIVE 배지 + [발표 시작] 프리필
  const vp = await hostCtx.newPage();
  await vp.goto(`${BASE}/`);
  await vp.waitForSelector('.card', { timeout: 15000 });
  const totalCards = await vp.evaluate(() => document.querySelectorAll('.card').length);
  await vp.fill('#searchInput', '버블');
  await sleep(300);
  const filtered = await vp.evaluate(() => document.querySelectorAll('.card').length);
  check('뷰어 검색 필터 (버블 → 1장)', totalCards > 1 && filtered === 1, `${totalCards}→${filtered}`);
  check('뷰어 LIVE 배지', await vp.evaluate(() => !!document.querySelector('.badge-live')));
  await snap(vp, 'p6-1-뷰어-검색-LIVE배지');
  await vp.click('.card-go-live');
  await vp.waitForSelector('#deckSelect', { timeout: 15000 });
  const preselected = await vp.inputValue('#deckSelect');
  await vp.waitForFunction(() => /라이브 문항 2개/.test(
    document.querySelector('#quizJsonPreview')?.textContent || ''), null, { timeout: 15000 });
  check('발표 시작 → 콘솔 덱 프리필 + quiz.json 미리보기', preselected === DECK_PATH, preselected);
  await snap(vp, 'p6-2-콘솔-덱프리필-미리보기');

  // 1) 세션 생성 (프리필된 폼 그대로)
  await vp.fill('#titleInput', 'Phase6 E2E');
  await vp.click('#createBtn');
  await vp.waitForSelector('.bigcode', { timeout: 15000 });
  CODE = (await vp.textContent('.bigcode')).trim();
  check('세션 생성', /^[A-Z0-9]{6}$/.test(CODE), `code=${CODE}`);
  await vp.waitForFunction(() =>
    document.querySelectorAll('#deckActsCard .sess-item').length === 2, null, { timeout: 15000 });
  check("콘솔 '덱 문항' 카드 (quiz.json 2개)", true);

  // 2) 학생 참여 → 미러 모드 (호스트 덱이 iframe으로 보임, 문항 대기)
  const sCtx = await browser.newContext();
  const sp = await sCtx.newPage();
  await sp.goto(`${BASE}/live/join/classic.html?code=${CODE}`);
  await sp.fill('#nickInput', '계약학생');
  await sp.click('#joinBtn');
  await sp.waitForFunction(() => document.body.classList.contains('mirror')
    && document.body.classList.contains('idle'), null, { timeout: 15000 });
  const mirrorFrame = sp.frameLocator('#mirrorFrame');
  await mirrorFrame.locator('.slide.active').waitFor({ timeout: 15000 });
  const pill = await sp.textContent('#mirrorMsg');
  check('학생 미러 모드 (덱 표시 + 문항 대기 안내)', /따라가는 중/.test(pill));
  await snap(sp, 'p6-5-학생-미러대기');

  // 3) Contract 덱 호스트 모드: 크롬 + 해시 딥링크 + 미니바
  const dp = await hostCtx.newPage();
  await dp.goto(`${BASE}${DECK}?live=${CODE}&host=1#3`);
  await dp.waitForSelector('.dk-nav', { timeout: 15000 });
  await dp.waitForSelector('.lp-hud', { timeout: 15000 });
  const counter = (await dp.textContent('.dk-nav__counter')).trim();
  const activeIdx = await dp.evaluate(() =>
    [...document.querySelectorAll('.slide')].findIndex((s) => s.classList.contains('active')));
  check('deck.js 크롬 + 해시 딥링크 (#3 → 3/6)', counter === '3 / 6' && activeIdx === 2, `counter=${counter}`);
  const deckTitle = await dp.textContent('.dk-nav__title');
  check('크롬 제목/과목 칩', /버블 정렬/.test(deckTitle));

  // 4) 슬라이드 미러 동기화: 호스트가 넘기면 학생 미러도 따라옴
  await dp.click('body');
  await dp.keyboard.press('ArrowRight'); // 3→4쪽 (해시 #3 진입 상태)
  await sp.waitForFunction(() => {
    const doc = document.getElementById('mirrorFrame')?.contentDocument;
    const slides = doc ? [...doc.querySelectorAll('.slide')] : [];
    return slides.findIndex((s) => s.classList.contains('active')) === 3;
  }, null, { timeout: 20000 });
  check('학생 미러 슬라이드 동기화 (호스트 4쪽 → 학생 4쪽)', true);

  // 5) [문항 ▾] 목록에서 quiz.json 문항 열기 → 호스트 문항 모달 + 학생 모달
  await dp.click('[data-act="list"]');
  await dp.waitForSelector('.lp-hud__panel--list', { timeout: 10000 });
  const listText = await dp.textContent('.lp-hud__panel--list');
  check('[문항 ▾] 목록: quiz.json 2개 표시', /한 패스/.test(listText) && /이해했나요/.test(listText));
  await snap(dp, 'p6-3-미니바-문항목록');
  await dp.click('[data-act="open"][data-key="check-pass"]');
  await dp.waitForSelector('.lp-question', { timeout: 10000 });
  check('호스트 문항 모달 (슬라이드 위 표시)', /한 패스/.test(await dp.textContent('.lp-question')));
  await snap(dp, 'p6-6-호스트-문항모달');

  // 6) 학생: 미러 위 모달로 문항 표시 → 응답 → 공개
  await sp.waitForSelector('.choice button', { timeout: 15000 });
  const studentModal = await sp.evaluate(() =>
    document.body.classList.contains('mirror') && !document.body.classList.contains('idle')
    && !!document.getElementById('mirrorFrame'));
  check('학생 문항 모달 (미러 위, 슬라이드 배경 유지)', studentModal);
  await snap(sp, 'p6-7-학생-문항모달');
  await sp.click('.choice button[data-i="1"]');
  await sp.click('#submitBtn');
  await sp.waitForSelector('.done', { timeout: 10000 });
  await dp.waitForSelector('[data-act="reveal"][data-key="check-pass"]', { timeout: 15000 });
  await dp.click('[data-act="reveal"][data-key="check-pass"]');
  await dp.waitForSelector('.lp-result', { timeout: 10000 });
  check('공개 오버레이 (덱)', /정답/.test(await dp.textContent('.lp-result')));
  await sp.waitForFunction(() => /정답이에요/.test(document.body.textContent), null, { timeout: 15000 });
  check('학생 정답 피드백', true);

  // 6) 콘솔 주도: '덱 문항'에서 exit 열기 → 학생 별점 → 콘솔에서 공개
  await vp.bringToFront();
  await vp.click('#deckActsCard [data-ljopen="1"]');
  await sp.waitForSelector('.rating button', { timeout: 15000 });
  await sp.click('.rating button[data-r="5"]');
  await sp.click('#submitBtn');
  await sp.waitForSelector('.done', { timeout: 10000 });
  await vp.waitForFunction(() => [...document.querySelectorAll('.act')].some((el) =>
    el.textContent.includes('이해했나요') && el.textContent.includes('응답 1')), null, { timeout: 15000 });
  const exitAct = await vp.evaluateHandle(() =>
    [...document.querySelectorAll('.act')].find((el) => el.textContent.includes('이해했나요'))
      ?.querySelector('[data-do="reveal"]'));
  await exitAct.asElement().click();
  await sp.waitForFunction(() => /평균 이해도/.test(document.body.textContent), null, { timeout: 15000 });
  check('콘솔 주도 exit (열기→응답→공개)', /5\.0/.test(await sp.textContent('.lp-chart')));
  await snap(sp, 'p6-4-학생-출구티켓');

  // 7) 회귀: ?live= 없이 = 크롬만 있는 일반 덱 (미니바 없음, 키보드 네비+해시)
  const rp = await hostCtx.newPage();
  await rp.goto(`${BASE}${DECK}`);
  await rp.waitForSelector('.dk-nav', { timeout: 15000 });
  await sleep(1500);
  const noHud = await rp.evaluate(() => !document.querySelector('.lp-hud'));
  await rp.click('body');
  await rp.keyboard.press('ArrowRight');
  await sleep(400);
  const c2 = (await rp.textContent('.dk-nav__counter')).trim();
  const hash = await rp.evaluate(() => location.hash);
  check('회귀: 미니바 없음 + 키보드 네비 + 해시 동기화', noHud && c2 === '2 / 6' && hash === '#2',
    `counter=${c2} hash=${hash}`);

  // 8) 종료
  await vp.bringToFront();
  await vp.click('#endBtn');
  await vp.click('#endBtn');
  await vp.waitForSelector('#createBtn', { timeout: 40000 });
  check('세션 종료', true);
} catch (e) {
  check('예외 없음', false, e.message.slice(0, 250));
} finally {
  await browser.close();
  server.close();
}

console.log('');
const fails = results.filter(([, ok]) => !ok);
console.log(`결과: ${results.length - fails.length}/${results.length} 통과  ·  세션 코드: ${CODE}`);
if (fails.length) console.log('실패:', fails.map(([n]) => n).join(', '));
process.exit(fails.length ? 1 : 0);
