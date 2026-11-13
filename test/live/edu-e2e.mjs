// test/live/edu-e2e.mjs — Phase 3 교육적 강화 E2E
//
// 실행: node test/live/edu-e2e.mjs (실서버 대상 — 세션 생성에 비밀구절 불필요, v10)
// 시나리오 (콘솔 즉석 문항 주도, 덱 불필요):
//   기명 세션 생성 → 학생 3명 학번 입력 참여
//   → PI 객관식: 1차 투표(1명만 정답) → 2차 투표(전원 정답) → 공개(1·2차 비교)
//   → 출구티켓(별점+한마디) → 워드클라우드 → 시트 아카이브 → 종료

import { chromium } from 'playwright';
import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PORT = 3211;
const BASE = `http://localhost:${PORT}`;
const HEADED = process.env.HEADED === '1';
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
    const data = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  } catch (e) { res.writeHead(404).end('not found'); }
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

// 콘솔에서 즉석 문항 열기
async function openAdhoc(hp, { kind, prompt, options, answer, pi }) {
  await hp.selectOption('#adhocKind', kind);
  await hp.fill('#adhocPrompt', prompt);
  if (options) {
    await hp.fill('#adhocOptions', options.join('\n'));
    await sleep(150); // sync()가 정답 select를 갱신할 시간
  }
  if (answer !== undefined) await hp.selectOption('#adhocAnswer', String(answer));
  if (pi) await hp.check('#adhocPi');
  await hp.click('#adhocBtn');
}

// 학생 페이지에서 객관식 n번 선택 후 제출
async function voteChoice(page, idx) {
  await page.waitForSelector('.choice button', { timeout: 12000 });
  await page.click(`.choice button[data-i="${idx}"]`);
  await page.click('#submitBtn');
  await page.waitForSelector('.done', { timeout: 10000 });
}

const browser = await chromium.launch({ headless: !HEADED });
let sessionInfo = 'unknown';
try {
  // 1) 기명 세션 생성
  const hostCtx = await browser.newContext();
  const hp = await hostCtx.newPage();
  await hp.goto(`${BASE}/live/host/classic.html`);
  await hp.fill('#titleInput', 'Phase3 E2E');
  await hp.selectOption('#nameModeSelect', 'named');
  await hp.click('#createBtn');
  await hp.waitForSelector('.bigcode', { timeout: 15000 });
  const code = (await hp.textContent('.bigcode')).trim();
  sessionInfo = code;
  check('기명 세션 생성', /^[A-Z0-9]{6}$/.test(code), `code=${code}`);

  // 2) 학생 3명: 닉네임 → 학번 단계 → 대기
  const students = [];
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/live/join/classic.html?code=${code}`);
    await page.fill('#nickInput', `학생${i}`);
    await page.click('#joinBtn');
    await page.waitForSelector('#snoInput', { timeout: 12000 }); // 기명 → 학번 폼
    await page.fill('#snoInput', `1010${i}`);
    await page.click('#snoBtn');
    await page.waitForSelector('.waiting', { timeout: 12000 });
    students.push(page);
  }
  check('학생 3명 학번 입력 후 참여', true);

  // 3) 참가자 칩에 학번 표시
  await hp.waitForFunction(() => document.querySelector('#pChips')?.textContent.includes('10101'),
    null, { timeout: 15000 });
  check('콘솔 참가자 칩에 학번 표시', true);

  // 4) PI 객관식 1차: 학생1만 정답(1), 나머지 오답(0)
  await openAdhoc(hp, {
    kind: 'choice', prompt: '변수에 값을 저장하는 연산자는?',
    options: ['==', '=', '+', 'in'], answer: 1, pi: true,
  });
  await voteChoice(students[0], 1);
  await voteChoice(students[1], 0);
  await voteChoice(students[2], 0);
  await hp.waitForFunction(() => /1차 3/.test(document.querySelector('#actList')?.textContent || ''),
    null, { timeout: 15000 });
  check('PI 1차 투표 3건 집계 (1차 3 표시)', true);

  // 5) 2차 투표 시작 → 학생 화면에 2차 배너 + 1차 선택 표시
  await hp.click('[data-do="round2"]');
  await students[1].waitForSelector('.round-banner', { timeout: 15000 });
  const banner = await students[1].textContent('.round-banner');
  check('2차 투표 배너 + 1차 선택 표시', /2차 투표/.test(banner) && /1차 선택: 1번/.test(banner),
    banner.trim().slice(0, 60));
  await snap(students[1], 'p3-1-학생-2차투표배너');

  // 6) 2차: 전원 정답 → 공개 → 1·2차 비교 차트
  await voteChoice(students[0], 1);
  await voteChoice(students[1], 1);
  await voteChoice(students[2], 1);
  await hp.waitForFunction(() => /2차 3/.test(document.querySelector('#actList')?.textContent || ''),
    null, { timeout: 15000 });
  await hp.click('[data-do="reveal"]');
  await students[0].waitForSelector('.lp-pi-bar', { timeout: 15000 });
  const piText = (await students[0].textContent('.lp-chart')).replace(/\s+/g, ' ');
  check('학생 PI 비교 차트 (정답 1차 1명·33% → 2차 3명·100% 수렴)',
    /1차 3명 → 2차 3명/.test(piText) && /정답/.test(piText)
    && /1차 1명 · 33%/.test(piText) && /2차 3명 · 100%/.test(piText),
    piText.slice(0, 90));
  const verdict1 = await students[1].textContent('body');
  check('2차 정답 전환 학생 → 정답 피드백', /정답이에요/.test(verdict1));
  await snap(students[0], 'p3-2-학생-PI비교차트');
  await snap(hp, 'p3-3-콘솔-PI집계');

  // 7) 출구티켓: 별점 + 한마디
  await openAdhoc(hp, { kind: 'exit', prompt: '오늘 수업을 마무리하며' });
  const ratings = [4, 5, 3];
  for (let i = 0; i < 3; i++) {
    const page = students[i];
    await page.waitForSelector('.rating button', { timeout: 12000 });
    await page.click(`.rating button[data-r="${ratings[i]}"]`);
    if (i === 0) await page.fill('#exitText', '오늘 재밌었어요! 변수 부분 한 번 더 설명해주세요.');
    await page.click('#submitBtn');
    await page.waitForSelector('.done', { timeout: 10000 });
  }
  await hp.waitForFunction(() => /응답 3/.test(document.querySelector('#actList')?.textContent || ''),
    null, { timeout: 15000 });
  await hp.click('[data-do="reveal"]');
  await students[0].waitForFunction(() => /평균 이해도/.test(document.body.textContent), null, { timeout: 15000 });
  const exitText = await students[0].textContent('.lp-chart');
  check('출구티켓 공개 (평균 4.0 + 한마디)', /4\.0/.test(exitText) && /재밌었어요/.test(exitText));
  await snap(students[0], 'p3-4-학생-출구티켓결과');

  // 8) 워드클라우드
  await openAdhoc(hp, { kind: 'wordcloud', prompt: '오늘 수업을 한 단어로!' });
  const words = ['파이썬', '파이썬', '변수'];
  for (let i = 0; i < 3; i++) {
    const page = students[i];
    await page.waitForSelector('#cloudInput', { timeout: 12000 });
    await page.fill('#cloudInput', words[i]);
    await page.click('#submitBtn');
    await page.waitForSelector('.done', { timeout: 10000 });
  }
  await hp.waitForFunction(() => {
    const acts = document.querySelector('#actList')?.textContent || '';
    return acts.includes('한 단어로');
  }, null, { timeout: 15000 });
  // 최신(워드클라우드) 활동의 공개 버튼 클릭
  await hp.waitForFunction(() => [...document.querySelectorAll('.act')].some((el) =>
    el.textContent.includes('한 단어로') && el.textContent.includes('응답 3')), null, { timeout: 15000 });
  const revealBtn = await hp.evaluateHandle(() =>
    [...document.querySelectorAll('.act')].find((el) => el.textContent.includes('한 단어로'))
      ?.querySelector('[data-do="reveal"]'));
  await revealBtn.asElement().click();
  await students[2].waitForSelector('.lp-cloud', { timeout: 15000 });
  const cloudText = await students[2].textContent('.lp-cloud');
  check('워드클라우드 공개 (파이썬×2 크게)', /파이썬/.test(cloudText) && /변수/.test(cloudText));
  await snap(students[2], 'p3-5-학생-워드클라우드');

  // 9) 시트 아카이브: PI 6건 + 출구 3건 + 클라우드 3건 = 응답 12건
  await hp.click('#sheetBtn');
  const toastText = await hp.waitForSelector('.lp-toast', { timeout: 30000 }).then((el) => el.textContent());
  check('시트 아카이브 (응답 12건: PI 1·2차 분리 기록)', /시트 저장 완료/.test(toastText) && /응답 12건/.test(toastText),
    toastText.trim().slice(0, 80));

  // 10) 종료
  await hp.click('#endBtn');
  await hp.click('#endBtn');
  await hp.waitForSelector('#createBtn', { timeout: 40000 });
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
