// 덱이 실제로 렌더한 텍스트를 슬라이드별로 뽑는다 — 소스가 아니라 학생이 보는 것을 검증하기 위해.
// 빌드 클릭을 끝까지 눌러 숨은 텍스트까지 모으고, 발표자 노트는 소스의 notes= 속성에서 가져온다.
//
// 사용:  node extract-deck-text.mjs <deckId> <총장수> [출력폴더] [deck.tsx경로]
//   예:  node .claude/skills/adversarial-review/scripts/extract-deck-text.mjs info-research-data-value 18 tmp/review
//
// dev 서버가 5199에 떠 있어야 한다 (SMOKE_BASE로 변경 가능).
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const [deckId, slidesArg, outArg, srcArg] = process.argv.slice(2);
if (!deckId || !slidesArg) {
  console.error('usage: extract-deck-text.mjs <deckId> <slideCount> [outDir] [deckTsxPath]');
  process.exit(1);
}
const TOTAL = Number(slidesArg);
const OUT = outArg || 'tmp/review';
const BASE = process.env.SMOKE_BASE || 'http://localhost:5199';
mkdirSync(OUT, { recursive: true });

// 발표자 노트 — deck.tsx의 notes="…"를 슬라이드 순서대로
let notes = [];
if (srcArg) {
  try {
    const src = readFileSync(srcArg, 'utf8');
    notes = [...src.matchAll(/notes="([^"]*)"/g)].map((m) => m[1]);
  } catch {
    console.warn('(노트 추출 건너뜀) deck.tsx를 읽지 못했다:', srcArg);
  }
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));

const out = [`# 덱 실제 렌더 텍스트 — ${deckId} (${TOTAL}장)\n`];
for (let n = 1; n <= TOTAL; n++) {
  await page.goto(`${BASE}/?deck=${deckId}#${n}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1600); // 씬 모션이 자리를 잡을 시간
  const texts = new Set();
  const grab = async () => {
    const t = await page.evaluate(() => {
      const el = document.querySelector('.slide') || document.body;
      return el.innerText.replace(/ /g, ' ');
    });
    t.split('\n').map((x) => x.trim()).filter(Boolean).forEach((x) => texts.add(x));
  };
  await grab();
  // 같은 슬라이드에 머무는 동안만 빌드를 진행한다
  for (let c = 0; c < 6; c++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(700);
    if ((await page.evaluate(() => location.hash)) !== `#${n}`) break;
    await grab();
  }
  out.push(`\n## 슬라이드 ${n}\n`);
  out.push('화면 텍스트(빌드 클릭 후 전부 포함):');
  [...texts].forEach((x) => out.push('- ' + x));
  if (notes[n - 1]) out.push(`\n발표자 노트: ${notes[n - 1]}`);
}
await browser.close();

const path = `${OUT}/deck-text.md`;
writeFileSync(path, out.join('\n'), 'utf8');
console.log('저장:', path, '· 슬라이드', TOTAL, '· 페이지 오류', errs.length ? errs.slice(0, 3) : '없음');
