// [선택] 영상 내보내기 1/2 — 덱을 1920×1080으로 실시간 녹화한다 (CDP 스크린캐스트).
// 크롬 UI(H 키)와 발표자는 숨기고(발표자는 compose.py가 따로 얹는다), 단계마다 그 단계 발표자 영상 길이만큼 머문다
// → 빌드가 말과 같은 순간에 뜬다. 목소리(캐스트)가 바뀌면 단계 길이가 달라지므로 녹화부터 다시 한다.
//
// 사용: node record.mjs <presenter_dir> <rec_dir> [--cast id] [--from N] [--to M]
//   dev 서버가 떠 있어야 한다 (DECK_BASE, 기본 http://localhost:5199)
// 결과: <rec_dir>/frames/*.jpg + frames.json(프레임별 시각) + events.json(단계 시작 시각·길이)
//   프레임은 21장 20분 기준 약 7만 장·9GB — compose.py가 base.mp4로 편 뒤 지워도 된다
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const [PDIR, OUT] = argv.filter((a, i) => !a.startsWith('--') && !['--cast', '--from', '--to'].includes(argv[i - 1]));
const CAST = opt('--cast', '');
const nar = JSON.parse(fs.readFileSync(path.join(PDIR, 'narration.json'), 'utf8'));
const slides = Object.keys(nar.slides).map(Number).sort((a, b) => a - b);
const FROM = Number(opt('--from', slides[0]));
const TO = Number(opt('--to', slides[slides.length - 1]));
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const MEDIA = process.env.NARR_MEDIA_DIR ?? path.join(process.env.NARR_MEDIA ?? path.join(REPO, 'presenter-media'), nar.overlay.media + (CAST ? `-${CAST}` : ''));
const FFPROBE = process.env.NARR_FFPROBE ?? 'C:/Users/User/Desktop/08_소프트웨어/ffmpeg-2024-11-25-git-04ce01df0b-essentials_build/bin/ffprobe.exe';
const BASE = process.env.DECK_BASE ?? 'http://localhost:5199';
const steps = (s) => nar.slides[String(s)].length;
const dur = (f) => Number(execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

fs.mkdirSync(path.join(OUT, 'frames'), { recursive: true });
const b = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio', '--hide-scrollbars'] });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
// 덱 안의 발표자는 숨긴다 — 영상 요청을 막으면 Presenter가 스스로 사라진다 (주소가 VITE_PRESENTER_BASE여도 경로로 잡는다)
await p.route(new RegExp(`/${nar.overlay.media}(-[\\w-]+)?/s\\d{2}-step\\d+\\.`), (r) => r.abort());
const errs = [];
p.on('pageerror', (e) => errs.push(String(e)));

// 시작: FROM이 첫 장이면 거기서 바로(첫 등장 애니메이션은 못 담는다 — compose --fade-in으로 연다),
// 아니면 직전 장의 마지막 단계에서 넘기며 시작해 등장 애니메이션까지 담는다
const start = FROM > slides[0] ? FROM - 1 : FROM;
await p.goto(`${BASE}/?deck=${nar.deck}#${start}`, { waitUntil: 'load' });
await p.evaluate(() => document.fonts.ready);
await sleep(1500);
await p.keyboard.press('h');
await p.mouse.move(960, 400);
if (start < FROM) for (let i = 0; i < steps(start) - 1; i++) { await p.keyboard.press('ArrowRight'); await sleep(300); }
await sleep(1500);

const cdp = await ctx.newCDPSession(p);
const frames = [];
let n = 0;
cdp.on('Page.screencastFrame', async (f) => {
  const file = `${String(++n).padStart(6, '0')}.jpg`;
  fs.writeFileSync(path.join(OUT, 'frames', file), Buffer.from(f.data, 'base64'));
  frames.push({ file, ts: f.metadata.timestamp }); // 에포크 초 — Date.now()/1000과 같은 시간축
  await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
await sleep(800);

const events = [];
for (const s of slides.filter((x) => x >= FROM && x <= TO)) {
  for (let k = 0; k < steps(s); k++) {
    const d = dur(path.join(MEDIA, `s${String(s).padStart(2, '0')}-step${k}.mp4`));
    if (!(s === FROM && k === 0 && start === FROM)) await p.keyboard.press('ArrowRight');
    events.push({ slide: s, step: k, t: Date.now() / 1000, dur: d });
    process.stdout.write(`${s}.${k} `);
    await sleep(d * 1000);
  }
}
await sleep(600);
await cdp.send('Page.stopScreencast');
await sleep(300);
fs.writeFileSync(path.join(OUT, 'frames.json'), JSON.stringify(frames));
fs.writeFileSync(path.join(OUT, 'events.json'), JSON.stringify(events, null, 1));
console.log(`\nframes ${frames.length}, errors`, errs.slice(0, 5));
await b.close();
