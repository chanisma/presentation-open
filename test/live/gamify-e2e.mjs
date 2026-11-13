// test/live/gamify-e2e.mjs — gamification(스피드 퀴즈, 세션 단위) E2E
//
// 실행: node test/live/gamify-e2e.mjs (실서버 대상 — 세션 생성에 비밀구절 불필요, v10)
// 시나리오 (호스트 액션은 REST RPC, 학생은 UI):
//   gamify 세션 생성 → 일반 choice 문항(문항 gamify 필드 없음) 열기 → 자동 점수 대상
//   → 학생 3명 순차 제출(정답·정답·오답) → 점수 검증(1등 1000/2등 950/오답 0)
//   → 공개 payload 리더보드 순서 검증 → 학생 공개 화면 탑5 표시
//   → 2번째 문항으로 누적 역전 → 세션 종료

import { chromium } from 'playwright';
import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PORT = 3213;
const BASE = `http://localhost:${PORT}`;
const SNAP_DIR = process.env.SNAP_DIR || '';

const SUPA = 'https://your-project-ref.supabase.co';
const ANON = 'YOUR_SUPABASE_ANON_KEY';
async function rpc(fn, args) {
  const res = await fetch(`${SUPA}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${fn}: ${JSON.stringify(data).slice(0, 200)}`);
  return data;
}

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
async function snap(page, name) {
  if (!SNAP_DIR) return;
  await page.screenshot({ path: path.join(SNAP_DIR, name + '.png') }).catch(() => {});
}

// 학생 페이지에서 보기(idx)를 눌러 제출하고 완료 화면까지 대기
async function submitChoice(page, idx) {
  await page.waitForSelector('.choice button', { timeout: 15000 });
  await page.click(`.choice button[data-i="${idx}"]`);
  await page.click('#submitBtn');
  await page.waitForSelector('.done', { timeout: 10000 });
}

const browser = await chromium.launch();
let SID = null, CODE = 'unknown';
try {
  // 1) gamify 세션 생성 + 일반 choice 문항 (문항에 gamify 필드 없음 — 세션이 결정)
  const sess = await rpc('lp_create_session', { p_title: '게임화 E2E', p_gamify: true });
  SID = sess.sessionId; CODE = sess.code;
  const TOKEN = sess.hostToken;
  check('gamify 세션 생성', sess.gamify === true, `code=${sess.code}`);
  const q1 = await rpc('lp_open_activity', {
    p_session_id: SID, p_host_token: TOKEN, p_slide_key: 'g1', p_slide_index: null,
    p_kind: 'choice', p_prompt: 'HTTP의 기본 포트는?',
    p_config: { options: ['21', '80', '443', '8080'], answer: 1 },
  });
  check('점수 대상 표식(gamify) 자동 부여 + answer 제거',
    q1.gamify === true && (q1.config || {}).answer === undefined);

  // 2) 학생 3명 참여
  const students = [];
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/live/join/classic.html?code=${CODE}`);
    await page.fill('#nickInput', `학생${i}`);
    await page.click('#joinBtn');
    students.push(page);
  }

  // 3) 스피드 배너 + 순차 제출 (학생1 정답 → 학생2 정답 → 학생3 오답)
  await students[0].waitForFunction(() => /스피드 퀴즈/.test(document.body.textContent), null, { timeout: 15000 });
  check('학생 문항 화면에 ⚡ 스피드 퀴즈 배너', true);
  await snap(students[0], 'g1-학생-스피드배너');
  await submitChoice(students[0], 1);
  await submitChoice(students[1], 1);
  await submitChoice(students[2], 0);
  check('학생 3명 순차 제출 완료', true);

  // 4) 공개 → payload 리더보드: 학생1 1000 > 학생2 950, 오답 학생3 제외
  const agg1 = await rpc('lp_reveal_activity', { p_session_id: SID, p_host_token: TOKEN, p_activity_id: q1.id });
  const lb1 = agg1.leaderboard || [];
  check('리더보드: 1등 학생1 1000점', lb1[0]?.nickname === '학생1' && lb1[0]?.score === 1000,
    JSON.stringify(lb1).slice(0, 120));
  check('리더보드: 2등 학생2 950점', lb1[1]?.nickname === '학생2' && lb1[1]?.score === 950);
  check('리더보드: 오답자 제외 (2명만)', lb1.length === 2);

  // 5) 학생 공개 화면에 탑5 표시
  await students[2].waitForFunction(() => /탑5/.test(document.body.textContent), null, { timeout: 15000 });
  const lbText = await students[2].textContent('body');
  check('학생 공개 화면: 🏆 탑5 리더보드', /학생1/.test(lbText) && /1,000점|1000점/.test(lbText));
  await snap(students[2], 'g2-학생-리더보드');

  // 6) 교사 상태: session.gamify + 세션 리더보드
  const hs = await rpc('lp_host_state', { p_session_id: SID, p_host_token: TOKEN });
  check('lp_host_state: session.gamify + leaderboard',
    hs.session.gamify === true && Array.isArray(hs.leaderboard) && hs.leaderboard.length === 2);

  // 7) 문항 2로 누적 역전: 학생2가 1등(+1000) → 누적 1950으로 선두
  const q2 = await rpc('lp_open_activity', {
    p_session_id: SID, p_host_token: TOKEN, p_slide_key: 'g2', p_slide_index: null,
    p_kind: 'ox', p_prompt: 'HTTPS는 암호화된 HTTP다.',
    p_config: { answer: true },
  });
  for (const [i, val] of [[1, 'true'], [0, 'false']]) {  // 학생2 정답 먼저, 학생1 오답
    const page = students[i];
    await page.waitForSelector('.oxwrap button', { timeout: 15000 });
    await page.click(`.oxwrap button[data-ox="${val}"]`);
    await page.click('#submitBtn');
    await page.waitForSelector('.done', { timeout: 10000 });
  }
  const agg2 = await rpc('lp_reveal_activity', { p_session_id: SID, p_host_token: TOKEN, p_activity_id: q2.id });
  const lb2 = agg2.leaderboard || [];
  check('누적 역전: 학생2 1950점 선두', lb2[0]?.nickname === '학생2' && lb2[0]?.score === 1950,
    JSON.stringify(lb2).slice(0, 120));

  // 8) 종료
  await rpc('lp_end_session', { p_session_id: SID, p_host_token: TOKEN });
  check('세션 종료', true);
} catch (e) {
  check('예외 없음', false, e.message.slice(0, 250));
} finally {
  await browser.close();
  server.close();
}

console.log('');
const fails = results.filter(([, ok]) => !ok);
console.log(`결과: ${results.length - fails.length}/${results.length} 통과  ·  세션: ${CODE} (${SID})`);
if (fails.length) console.log('실패:', fails.map(([n]) => n).join(', '));
process.exit(fails.length ? 1 : 0);
