// pixel_review.mjs — 씬별 풀해상도 PNG 렌더 + 밀도 검사 (BLOCKING 게이트 2/2)
//
// 사용법: node pixel_review.mjs <덱 index.html 경로> [출력폴더=_pixel_review]
//
// 각 data-scene 씬을 활성화 → 히어로 프레임(t≈1.6s)에서 1280×720 캡처.
// 콘텐츠 밀도(배경 레이어 제외 요소 커버리지) < 12% → near-empty로 BLOCK.
// 산출물: <출력폴더>/<scene-id>.png + report.json + index.html(컨택트시트)
// 주의: 통과해도 사람이 PNG를 한 장씩 눈으로 검수해야 한다. 스키마 통과 ≠ 픽셀 통과.

import { chromium } from 'playwright';
import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const deckArg = process.argv[2];
if (!deckArg) {
  console.error('사용법: node pixel_review.mjs <덱 index.html 경로> [출력폴더]');
  process.exit(2);
}
const deckPath = path.resolve(deckArg);
const ROOT = process.cwd();
const outDir = path.resolve(process.argv[3] || path.join(path.dirname(deckPath), '_pixel_review'));
await fs.mkdir(outDir, { recursive: true });

// ── 정적 서버 (base 태그·상대경로 대응) ──
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2',
};
const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.resolve(ROOT, '.' + p);
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    const data = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const rel = path.relative(ROOT, deckPath).split(path.sep).join('/');
const url = `http://localhost:${port}/${rel.split('/').map(encodeURIComponent).join('/')}`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(url, { waitUntil: 'networkidle' });

const sceneIds = await page.evaluate(() =>
  [...document.querySelectorAll('.slide[data-scene]')].map((s) => s.dataset.scene));
if (!sceneIds.length) {
  console.log('data-scene 씬이 없습니다.');
  await browser.close(); server.close();
  process.exit(0);
}

const report = [];
for (const id of sceneIds) {
  // 씬 활성화 (덱 네비게이션과 동일한 class 토글 → SceneMotion이 t=0부터 재생)
  await page.evaluate((sceneId) => {
    document.querySelectorAll('.slide').forEach((s) =>
      s.classList.toggle('active', s.dataset.scene === sceneId));
  }, id);
  await page.waitForTimeout(1650); // 히어로 프레임 (규약: t ≤ 1.5s 도달)

  const file = path.join(outDir, `${id}.png`);
  await page.screenshot({ path: file });

  // 콘텐츠 밀도: 씬 내 가시 요소의 bbox가 덮는 셀 비율 (전면 배경 레이어 제외)
  const density = await page.evaluate((sceneId) => {
    const scene = document.querySelector(`.slide[data-scene="${sceneId}"]`);
    const sr = scene.getBoundingClientRect();
    const COLS = 48, ROWS = 27;
    const grid = new Uint8Array(COLS * ROWS);
    const REPLACED = ['IMG', 'SVG', 'CANVAS', 'VIDEO', 'PATH', 'CIRCLE', 'LINE', 'RECT', 'TEXT', 'ELLIPSE', 'POLYGON'];
    const isPainted = (el, cs) => {
      // 직접 소유한 텍스트 노드 (자식 요소의 텍스트는 그 자식이 따로 집계)
      const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      return ownText ||
        REPLACED.includes(el.tagName.toUpperCase()) ||
        (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') ||
        (cs.backgroundImage && cs.backgroundImage !== 'none') ||
        cs.borderTopWidth !== '0px' || cs.boxShadow !== 'none';
    };
    for (const el of scene.querySelectorAll('*')) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || Number(cs.opacity) < 0.05) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      if ((r.width * r.height) / (sr.width * sr.height) > 0.85) continue; // 배경 레이어 제외
      if (!isPainted(el, cs)) continue;
      const x0 = Math.max(0, Math.floor(((r.left - sr.left) / sr.width) * COLS));
      const x1 = Math.min(COLS - 1, Math.ceil(((r.right - sr.left) / sr.width) * COLS) - 1);
      const y0 = Math.max(0, Math.floor(((r.top - sr.top) / sr.height) * ROWS));
      const y1 = Math.min(ROWS - 1, Math.ceil(((r.bottom - sr.top) / sr.height) * ROWS) - 1);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) grid[y * COLS + x] = 1;
    }
    let covered = 0;
    grid.forEach((v) => { covered += v; });
    return covered / (COLS * ROWS);
  }, id);

  const ok = density >= 0.12;
  report.push({ id, file: path.basename(file), density: Math.round(density * 100) / 100, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  밀도 ${(density * 100).toFixed(0)}%${ok ? '' : '  ← near-empty'}`);
}

await browser.close();
server.close();

// 컨택트시트 + 리포트
const sheet = `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><title>픽셀 검수</title>
<style>body{font-family:'Noto Sans KR',sans-serif;background:#0f172a;color:#e2e8f0;padding:24px}
h1{font-size:18px}figure{margin:0 0 28px}img{width:100%;max-width:960px;border-radius:8px;border:1px solid #334155}
figcaption{margin:6px 0 10px;font-size:14px}.bad{color:#f87171;font-weight:700}</style></head><body>
<h1>픽셀 검수 — ${rel} (씬 ${report.length}개)</h1>
<p>한 장씩 눈으로 확인: 텍스트 겹침 · 잘림 · 빈 화면 · 메타포 전달력. 스키마 통과 ≠ 픽셀 통과.</p>
${report.map((r) => `<figure><figcaption>${r.id} — 밀도 ${(r.density * 100).toFixed(0)}%${r.ok ? '' : ' <span class="bad">NEAR-EMPTY</span>'}</figcaption><img src="${r.file}" alt="${r.id}"></figure>`).join('\n')}
</body></html>`;
await fs.writeFile(path.join(outDir, 'index.html'), sheet, 'utf-8');
await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2), 'utf-8');

const fails = report.filter((r) => !r.ok);
console.log(`\n리포트: ${path.join(outDir, 'index.html')}`);
if (fails.length) {
  console.log(`BLOCK: near-empty ${fails.length}씬 — ${fails.map((f) => f.id).join(', ')}`);
  process.exit(1);
}
console.log(`통과: ${report.length}씬 — PNG를 직접 눈으로 검수할 것`);
