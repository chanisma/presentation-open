/* pages.json 각 항목에 type("deck"|"doc")을 기록한다 — 런타임 분류.
   일부 덱은 슬라이드를 JS로 생성하므로 정적 스캔으로는 판정할 수 없다.
   실제 브라우저로 로드해 뷰어와 동일한 기준(.slide 2장 이상)으로 판정한다.
   실행: dev 서버 기동 후  node scripts/classify-pages.mjs  (BASE 환경변수로 대상 변경)
   자료를 추가/변경한 뒤 이 스크립트를 다시 돌리면 허브 라우팅이 갱신된다. */
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:5199';
const data = JSON.parse(readFileSync('pages.json', 'utf-8'));

const browser = await chromium.launch();
const page = await browser.newPage();
const stats = { deck: 0, native: 0, doc: 0, error: 0 };

for (const subj of data.subjects) {
  for (const p of subj.pages) {
    const path = p.path || '';
    if (path.includes('?deck=')) {
      p.type = 'deck'; // 네이티브 React 덱
      stats.native++;
      continue;
    }
    try {
      await page.goto(`${BASE}/${encodeURI(path)}`, { waitUntil: 'load', timeout: 20000 });
      let n = await page.evaluate(() => document.querySelectorAll('.slide').length);
      if (n < 2) {
        // 비동기 렌더 덱 대비 한 박자 재확인
        await page.waitForTimeout(900);
        n = await page.evaluate(() => document.querySelectorAll('.slide').length);
      }
      p.type = n >= 2 ? 'deck' : 'doc';
      stats[p.type]++;
      if (p.type === 'doc') console.log(`  doc: ${path}`);
    } catch (e) {
      p.type = 'doc'; // 로드 실패 — 뷰어에 태우지 않는 게 안전
      stats.error++;
      console.log(`  (로드 실패 → doc) ${path} — ${e.message.slice(0, 60)}`);
    }
  }
}

await browser.close();
writeFileSync('pages.json', JSON.stringify(data, null, 2) + '\n', 'utf-8');
console.log(
  `완료 — deck ${stats.deck} · native ${stats.native} · doc ${stats.doc} · 실패 ${stats.error}`
);
