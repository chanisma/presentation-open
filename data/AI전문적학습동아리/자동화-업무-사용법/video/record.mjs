// 자막 영상 내보내기 1/2 — 덱을 1920×1080으로 실시간 녹화한다 (CDP 스크린캐스트).
// deck-narration-builder 의 record.mjs 와 같은 방식이되, 발표자 영상이 없으므로
// 단계마다 머무는 시간을 덱의 시간표(window.__AUG_TIMING — deck.tsx 의 TIMING)에서 읽는다.
//
// 사용: node video/record.mjs <rec_dir> [--from N] [--to M]
//   dev 서버가 떠 있어야 한다 (DECK_BASE, 기본 http://localhost:5199)
// 클립(H.264 mp4)을 재생해야 하므로 번들 Chromium(H.264 미지원)이 아니라 설치된 Chrome(channel: 'chrome')으로 연다.
// 결과: <rec_dir>/frames/*.jpg + frames.json(프레임별 에포크 초) + events.json(단계 시작 시각·길이)
//       + subs.json(화면 자막이 바뀐 에포크 초·문구)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(path.resolve('package.json'));
const { chromium } = require('playwright');

const argv = process.argv.slice(2);
const opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const OUT = argv.find((a, i) => !a.startsWith('--') && !['--from', '--to'].includes(argv[i - 1]));
if (!OUT) { console.error('usage: node video/record.mjs <rec_dir> [--from N] [--to M]'); process.exit(1); }
const DECK = 'automation-guide';
const BASE = process.env.DECK_BASE ?? 'http://localhost:5199';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

fs.mkdirSync(path.join(OUT, 'frames'), { recursive: true });
const b = await chromium.launch({ channel: 'chrome', args: ['--hide-scrollbars', '--mute-audio', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push(String(e)));
// 실제로 불러온 실화면 파일 — 쓰지 않는 screens/*.jpg 정리용
const usedScreens = new Set();
p.on('request', (r) => { const m = decodeURIComponent(r.url()).match(/screens\/([^/?]+)\.jpg/); if (m) usedScreens.add(m[1]); });

const FROM = Number(opt('--from', 1));
// FROM이 첫 장이 아니면 직전 장 마지막 단계에서 넘기며 시작해 등장 애니메이션까지 담는다
const start = FROM > 1 ? FROM - 1 : FROM;
await p.goto(`${BASE}/?deck=${DECK}#${start}`, { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
await sleep(2000);
const TIMING = await p.evaluate(() => window.__AUG_TIMING);
const TO = Number(opt('--to', TIMING.length));
await p.keyboard.press('h');
await p.mouse.move(960, 500); // 아래 모서리에 두면 덱 크롬 막대가 드러난다
if (start < FROM) for (let i = 0; i < TIMING[start - 1].length - 1; i++) { await p.keyboard.press('ArrowRight'); await sleep(900); }
await sleep(1200);

// 화면에 보이는 자막([data-sub])이 바뀐 실제 시각을 남긴다 — 나레이션 합성(compose.py --voice)이
// 씬 시계의 지연과 무관하게 목소리를 자막 전환에 맞춘다
await p.evaluate(() => {
  const log = (window.__SUBLOG = []);
  let last = null;
  const tick = () => {
    const el = [...document.querySelectorAll('[data-sub]')].find((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.left > -10 && r.left < innerWidth - 10;
    });
    const text = el ? el.getAttribute('data-sub') : null;
    if (text !== last) { log.push({ t: (performance.timeOrigin + performance.now()) / 1000, text }); last = text; }
    requestAnimationFrame(tick);
  };
  tick();
});

const cdp = await ctx.newCDPSession(p);
const frames = [];
let n = 0;
cdp.on('Page.screencastFrame', async (f) => {
  const file = `${String(++n).padStart(6, '0')}.jpg`;
  fs.writeFileSync(path.join(OUT, 'frames', file), Buffer.from(f.data, 'base64'));
  frames.push({ file, ts: f.metadata.timestamp });
  await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
await sleep(800);

const events = [];
for (let s = FROM; s <= TO; s++) {
  const steps = TIMING[s - 1];
  for (let k = 0; k < steps.length; k++) {
    if (!(s === FROM && k === 0 && start === FROM)) await p.keyboard.press('ArrowRight');
    // 첫 장은 페이지를 연 뒤 이미 몇 초 재생됐으므로 녹화 시작에 맞춰 처음으로 되감는다
    else await p.evaluate(() => window.dispatchEvent(new CustomEvent('deck-scene-control', { detail: { action: 'restart' } })));
    events.push({ slide: s, step: k, t: Date.now() / 1000, dur: steps[k] });
    process.stdout.write(`${s}.${k} `);
    await sleep(steps[k] * 1000);
  }
}
await sleep(400);
await cdp.send('Page.stopScreencast');
await sleep(300);
fs.writeFileSync(path.join(OUT, 'frames.json'), JSON.stringify(frames));
fs.writeFileSync(path.join(OUT, 'events.json'), JSON.stringify(events, null, 1));
fs.writeFileSync(path.join(OUT, 'subs.json'), JSON.stringify(await p.evaluate(() => window.__SUBLOG), null, 1));
fs.writeFileSync(path.join(OUT, 'used-screens.json'), JSON.stringify([...usedScreens].sort()));
console.log(`\nframes ${frames.length}, errors`, errs.slice(0, 5));
await b.close();
