// test/live/code-e2e.mjs — Phase 5 코드 실행 참여 E2E
//
// 실행: node test/live/code-e2e.mjs (실서버 대상 — 세션 생성에 비밀구절 불필요, v10)
// 시나리오 (호스트 액션은 REST RPC로 직접 수행, 학생은 UI):
//   python 문항: 학생이 정답 코드 작성 → Pyodide 실행·채점(2/2) → 제출
//   → 부분 정답으로 수정 → 재제출(갱신) → 서버 히스토그램 검증 → 공개(차트)
//   → web 문항: HTML 작성 → 미리보기 → 제출 → 교사 코드 열람 RPC 검증
// 주의: Pyodide ~10MB CDN 다운로드 포함 (최초 실행 1~2분)

import { chromium } from 'playwright';
import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PORT = 3212;
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

const browser = await chromium.launch();
let SID = null, CODE = 'unknown';
try {
  // 1) 세션 + python 문항 (호스트는 RPC로)
  const sess = await rpc('lp_create_session', { p_title: '코드 E2E' });
  SID = sess.sessionId; CODE = sess.code;
  const TOKEN = sess.hostToken;
  const pyAct = await rpc('lp_open_activity', {
    p_session_id: SID, p_host_token: TOKEN, p_slide_key: 'py-sum', p_slide_index: null,
    p_kind: 'code', p_prompt: '1부터 n까지의 합을 구하는 sum_to(n)을 완성하세요.',
    p_config: {
      language: 'python', starter: 'def sum_to(n):\n    return 0',
      tests: [{ call: 'sum_to(5)', expected: '15' }, { call: 'sum_to(10)', expected: '55' }],
      solution: 'def sum_to(n):\n    return n * (n + 1) // 2',
    },
  });
  check('학생 전송 config에 solution 없음 (v6)', !(pyAct.config || {}).solution);
  check('세션+python 문항 생성 (RPC)', !!pyAct.id, `code=${CODE}`);

  // 2) 학생: 에디터 표시 + starter 프리필
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/live/join/classic.html?code=${CODE}`);
  await page.fill('#nickInput', '코딩학생');
  await page.click('#joinBtn');
  await page.waitForSelector('#codeEditor', { timeout: 15000 });
  const starter = await page.inputValue('#codeEditor');
  check('코드 에디터 + starter 프리필', starter.includes('def sum_to'), starter.split('\n')[0]);

  // 3) 정답 코드 → 실행·채점 (Pyodide 로드 포함 — 넉넉한 타임아웃)
  await page.fill('#codeEditor', 'def sum_to(n):\n    return n * (n + 1) // 2');
  await page.click('#runBtn');
  await page.waitForSelector('.tests .t', { timeout: 180000 });
  const okCount = await page.evaluate(() => document.querySelectorAll('.tests .t.ok').length);
  check('Pyodide 실행 + 테스트 2/2 통과', okCount === 2, `ok=${okCount}`);
  await snap(page, 'c1-학생-파이썬-채점');

  // 4) 제출
  await page.click('#submitBtn');
  await page.waitForFunction(() => /제출 완료 \(2\/2 통과\)/.test(document.body.textContent), null, { timeout: 15000 });
  check('제출 (2/2)', true);

  // 5) 부분 정답으로 수정 → 재제출(갱신)
  await page.fill('#codeEditor', 'def sum_to(n):\n    return 15 if n == 5 else 0');
  await page.click('#runBtn');
  await page.waitForFunction(() => document.querySelectorAll('.tests .t.no').length === 1, null, { timeout: 60000 });
  await page.click('#submitBtn');
  await page.waitForFunction(() => /1\/2 통과.*갱신됨/.test(document.body.textContent), null, { timeout: 15000 });
  check('수정 후 재제출 (1/2, 갱신)', true);

  // 6) 서버 집계: 제출 1건 유지(중복 아님) + 히스토그램이 최신 제출 반영
  const hs = await rpc('lp_host_state', { p_session_id: SID, p_host_token: TOKEN });
  const agg = hs.activities[0].aggregates;
  check('서버 히스토그램: 총 1명, 1개 통과=1', agg.total === 1 && agg.histogram[1] === 1 && agg.histogram[2] === 0,
    JSON.stringify(agg));

  // 7) 공개 → 학생 화면에 통과 히스토그램 + 케이스별 통과율
  await rpc('lp_reveal_activity', { p_session_id: SID, p_host_token: TOKEN, p_activity_id: pyAct.id });
  await page.waitForFunction(() => /개 통과/.test(document.body.textContent), null, { timeout: 15000 });
  const chartText = await page.textContent('.lp-chart');
  check('공개: 히스토그램+케이스별 통과율', /1개 통과/.test(chartText) && /케이스 1/.test(chartText));
  check('학생 공개 화면에 모범 답안 비노출', !/모범 답안/.test(await page.textContent('body')));
  await snap(page, 'c2-학생-코드-공개차트');

  // 7.5) 호스트 결과 오버레이 (덱 미니바): 모범 답안 표시 + 전체 통과자 없음 → 통과 코드 섹션 없음
  const hostCtx = await browser.newContext();
  const dp = await hostCtx.newPage();
  await dp.addInitScript(([code, sid, token]) => {
    localStorage.setItem('lp.host.' + code,
      JSON.stringify({ code, sessionId: sid, hostToken: token, savedAt: Date.now() }));
  }, [CODE, SID, TOKEN]);
  // 픽스처 덱의 quiz.json에 같은 id(py-sum)가 있어 [문항 ▾] 목록에 DB 상태가 연결된다
  await dp.goto(`${BASE}/test/live/fixtures/code-deck/index.html?live=${CODE}&host=1`);
  await dp.waitForSelector('.lp-hud [data-act="list"]', { timeout: 15000 });
  await dp.click('.lp-hud [data-act="list"]');
  await dp.waitForSelector('[data-act="show"][data-key="py-sum"]', { timeout: 10000 });
  await dp.click('[data-act="show"][data-key="py-sum"]');
  await dp.waitForFunction(() => /모범 답안/.test(document.querySelector('.lp-result')?.textContent || ''),
    null, { timeout: 15000 });
  const hostResult = await dp.textContent('.lp-result');
  check('호스트 결과: 모범 답안 표시', /n \* \(n \+ 1\)/.test(hostResult));
  check('호스트 결과: 전체 통과자 없음 → 통과 코드 섹션 없음', !/모든 테스트 통과/.test(hostResult));
  await snap(dp, 'c2b-호스트-모범답안');
  await dp.close();

  // 8) web 문항 → 에디터+미리보기 → 제출
  await rpc('lp_open_activity', {
    p_session_id: SID, p_host_token: TOKEN, p_slide_key: 'web-intro', p_slide_index: null,
    p_kind: 'code', p_prompt: '나를 소개하는 카드를 만들어보세요.',
    p_config: { language: 'web', starter: '<h1>내 이름</h1>' },
  });
  await page.waitForSelector('#webPreview', { timeout: 15000 });
  const html = '<h1>코딩학생</h1>\n<p>E2E가 만든 카드</p>\n<style>h1{color:teal}</style>';
  await page.fill('#codeEditor', html);
  await page.click('#runBtn');
  const srcdoc = await page.getAttribute('#webPreview', 'srcdoc');
  check('web 미리보기 (iframe srcdoc)', srcdoc.includes('E2E가 만든 카드'));
  await page.click('#submitBtn');
  await page.waitForFunction(() => /제출 완료/.test(document.body.textContent), null, { timeout: 15000 });
  await snap(page, 'c3-학생-웹에디터');

  // 9) 교사 코드 열람 RPC
  const subs = await rpc('lp_code_submissions', {
    p_session_id: SID, p_host_token: TOKEN,
    p_activity_id: (await rpc('lp_host_state', { p_session_id: SID, p_host_token: TOKEN }))
      .activities.find((a) => a.slideKey === 'web-intro').id,
  });
  check('교사 코드 열람 (닉네임+코드)', subs.length === 1 && subs[0].nickname === '코딩학생'
    && subs[0].code.includes('E2E가 만든 카드'));

  // 10) 종료
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
