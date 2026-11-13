/* 3D 개념 모형 헤드리스 검수 — 상태별 스크린샷 + snapshot() 수집 + 콘솔 오류 검출.

   node .claude/skills/3d-model-builder/scripts/model-check.mjs \
     --page "data/dev/테스트 수업 자료/<폴더>/index.html" --api diffusionApp \
     --states states.json --out tmp/model-shots [--base http://localhost:5199] [--query "paused=1"]

   states.json: [{ "name": "01-hero", "set": { …setState 인자… }, "wait": 250 }, …]
   결과: <out>/<name>.png, <out>/summary.json (상태별 snapshot 요약 + errors). 오류가 있으면 종료 코드 1.
   dev 서버(포트 5199)를 먼저 띄운다: npm run dev -- --port 5199 */
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../../..');
const { chromium } = createRequire(resolve(repoRoot, 'package.json'))('playwright');

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => { if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]); return acc; }, []));
if (!args.page || !args.api) { console.error('사용법: --page <index.html 경로> --api <window 객체 이름> [--states <json>] [--out <폴더>] [--base <url>] [--query <쿼리>]'); process.exit(2); }
const base = args.base || process.env.SMOKE_BASE || 'http://localhost:5199';
const pageUrl = `${base}/${args.page.split('/').map(encodeURIComponent).join('/')}?${args.query || 'paused=1'}`;
const out = resolve(repoRoot, args.out || 'tmp/model-shots') + '/';
mkdirSync(out, { recursive: true });
const states = args.states ? JSON.parse(readFileSync(resolve(repoRoot, args.states), 'utf8')) : [{ name: '01-default', set: {} }];

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1672, height: 941 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));

console.log('열기:', pageUrl);
await page.goto(pageUrl, { waitUntil: 'load' });
try { await page.waitForFunction((api) => window[api], args.api, { timeout: 30000 }); }
catch { errors.push(`window.${args.api}가 30초 안에 나타나지 않음 — 모듈 import 경로나 API 이름을 확인`); }
await page.waitForTimeout(500);

const summary = { page: pageUrl, api: args.api, states: {}, errors };
for (const st of states) {
  let snap = null;
  try { snap = await page.evaluate(([api, set]) => { const app = window[api]; if (!app) return null; return app.setState ? app.setState(set) : app.snapshot(); }, [args.api, st.set || {}]); }
  catch (e) { errors.push(`[setState ${st.name}] ${e.message.split('\n')[0]}`); }
  await page.waitForTimeout(st.wait ?? 250);
  await page.screenshot({ path: `${out}${st.name}.png` });
  const brief = snap ? Object.fromEntries(Object.entries(snap).filter(([k]) => k !== 'weights' && k !== 'outputs')) : null;
  summary.states[st.name] = brief;
  console.log(`  ${st.name}: 저장${snap && snap.renderer ? ` · 드로우콜 ${snap.renderer.calls} · 삼각형 ${snap.renderer.triangles}` : ''}`);
}
writeFileSync(`${out}summary.json`, JSON.stringify(summary, null, 2));
await browser.close();
console.log(`요약: ${out}summary.json`);
if (errors.length) { console.error('오류:', errors.join('\n')); process.exit(1); }
console.log('콘솔 오류 없음. 스크린샷을 Read로 직접 확인할 것.');
