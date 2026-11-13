// test/live/_latency-e2e.mjs — 호스트 슬라이드 변경 → 학생 미러 반영 지연 계측 (임시)
//
// 방법: 호스트 덱에서 ArrowRight 직전 시각(t0, Node) → 학생 페이지의 rAF 감시자가
//       미러 iframe의 active 인덱스 변화를 감지해 콜백(t1, Node) → t1-t0.
//       Node→브라우저 명령 오버헤드(~10–30ms)가 포함되므로 실제보다 보수적인 수치.
// 목표: median < 500ms

import { chromium } from 'playwright';
import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PORT = 3215;
const BASE = `http://localhost:${PORT}`;
const SUPA = 'https://your-project-ref.supabase.co';
const ANON = 'YOUR_SUPABASE_ANON_KEY';
async function rpc(fn, args) {
  const res = await fetch(`${SUPA}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args) });
  const d = await res.json().catch(() => null);
  if (!res.ok) throw new Error(fn + ': ' + JSON.stringify(d).slice(0, 150));
  return d;
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8' };
const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, BASE).pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.resolve(ROOT, '.' + p);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(await fs.readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(PORT, r));

const browser = await chromium.launch();
let CODE = 'unknown';
try {
  const sess = await rpc('lp_create_session', {
    p_title: '지연 계측', p_deck_path: 'data/dev/테스트 수업 자료/동적씬-버블정렬/index.html' });
  CODE = sess.code;

  // 학생: 미러 준비 + rAF 감시자 (인덱스 변화 시 Node 콜백)
  const sCtx = await browser.newContext();
  const sp = await sCtx.newPage();
  let resolveSlide = null;
  let expectIdx = -1;
  await sp.exposeFunction('__slideChanged', (idx) => {
    if (idx === expectIdx && resolveSlide) { const r = resolveSlide; resolveSlide = null; r(Date.now()); }
  });
  await sp.goto(`${BASE}/live/join/classic.html?code=${CODE}`);
  await sp.fill('#nickInput', '지연계측');
  await sp.click('#joinBtn');
  await sp.waitForFunction(() => document.body.classList.contains('mirror'), null, { timeout: 15000 });
  await sp.frameLocator('#mirrorFrame').locator('.slide.active').waitFor({ timeout: 15000 });
  await sp.evaluate(() => {
    let last = -1;
    const tick = () => {
      try {
        const doc = document.getElementById('mirrorFrame').contentDocument;
        const slides = doc ? [...doc.querySelectorAll('.slide')] : [];
        const idx = slides.findIndex((s) => s.classList.contains('active'));
        if (idx !== last) { last = idx; window.__slideChanged(idx); }
      } catch (e) { /* 무시 */ }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  // 호스트 덱 (같은 브라우저, 다른 컨텍스트 — localStorage 핸드오프 수동)
  const hCtx = await browser.newContext();
  const dp = await hCtx.newPage();
  await dp.addInitScript(([code, info]) => {
    localStorage.setItem('lp.host.' + code, JSON.stringify(info));
  }, [CODE, { code: CODE, hostToken: sess.hostToken, sessionId: sess.sessionId }]);
  await dp.goto(`${BASE}/data/dev/테스트 수업 자료/동적씬-버블정렬/?live=${CODE}&host=1`);
  await dp.waitForSelector('.lp-hud', { timeout: 15000 });
  await dp.click('body');
  await sp.waitForTimeout(1200); // 채널 안정화

  // 왕복 계측: 앞으로 5장 → 뒤로 5장 × 2 = 20 샘플
  const samples = [];
  let cur = 0;
  for (let round = 0; round < 2; round++) {
    for (const dir of ['ArrowRight', 'ArrowLeft']) {
      for (let i = 0; i < 5; i++) {
        cur += dir === 'ArrowRight' ? 1 : -1;
        expectIdx = cur;
        const waiter = new Promise((r) => { resolveSlide = r; });
        const t0 = Date.now();
        await dp.keyboard.press(dir);
        const t1 = await Promise.race([waiter, new Promise((r) => setTimeout(() => r(null), 5000))]);
        if (t1 === null) { samples.push({ ms: 5000, timeout: true }); resolveSlide = null; }
        else samples.push({ ms: t1 - t0 });
        await dp.waitForTimeout(250); // 전환 간격
      }
    }
  }

  const times = samples.map((s) => s.ms).sort((a, b) => a - b);
  const med = times[Math.floor(times.length / 2)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const timeouts = samples.filter((s) => s.timeout).length;
  console.log('슬라이드 샘플(ms):', samples.map((s) => s.ms).join(', '));
  console.log(`슬라이드: median=${med}ms  p95=${p95}ms  max=${times[times.length - 1]}ms  timeout=${timeouts}`);

  // ── 문항 열기/마감 반응 (호스트 클릭 → 학생 모달 표시/해제) — RPC 왕복 포함 ──
  let resolveAct = null;
  let expectShown = null;
  await sp.exposeFunction('__actChanged', (shown) => {
    if (shown === expectShown && resolveAct) { const r = resolveAct; resolveAct = null; r(Date.now()); }
  });
  await sp.evaluate(() => {
    let lastShown = null;
    const tick = () => {
      const shown = document.body.classList.contains('mirror') && !document.body.classList.contains('idle');
      if (shown !== lastShown) { lastShown = shown; window.__actChanged(shown); }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await dp.click('[data-act="list"]');
  await dp.waitForSelector('[data-act="open"][data-key="check-pass"]', { timeout: 10000 });
  const actSamples = [];
  const raceT = (p) => Promise.race([p, new Promise((r) => setTimeout(() => r(null), 6000))]);
  for (let i = 0; i < 3; i++) {
    expectShown = true;
    let w = new Promise((r) => { resolveAct = r; });
    let t0 = Date.now();
    await dp.click('[data-act="open"][data-key="check-pass"]');
    let t1 = await raceT(w);
    actSamples.push(t1 ? t1 - t0 : 6000);
    await dp.waitForTimeout(350);
    expectShown = false;
    w = new Promise((r) => { resolveAct = r; });
    t0 = Date.now();
    await dp.click('[data-act="close"][data-key="check-pass"]');
    t1 = await raceT(w);
    actSamples.push(t1 ? t1 - t0 : 6000);
    await dp.waitForTimeout(350);
  }
  const at = [...actSamples].sort((a, b) => a - b);
  const amed = at[Math.floor(at.length / 2)];
  const amax = at[at.length - 1];
  console.log('문항 열기/마감 샘플(ms):', actSamples.join(', '));
  console.log(`문항: median=${amed}ms  max=${amax}ms  (RPC 왕복 포함)`);

  const pass = med < 500 && p95 < 500 && amed < 500 && amax < 700;
  console.log(`\n목표(슬라이드<500ms, 문항 median<500ms): ${pass ? 'PASS' : 'FAIL'}  ·  SESSION=${CODE}`);
  process.exitCode = pass ? 0 : 1;
} catch (e) {
  console.error('오류:', e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  server.close();
}
