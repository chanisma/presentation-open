/* 병합 스모크 테스트 — 허브/네이티브 덱/레거시 덱/라이브 앱 로드 검증 */
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_BASE || 'http://localhost:5199';
const results = [];
const ok = (name, cond, extra = '') =>
  results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('console: ' + m.text());
});

// 0. 메인(/) = 학생 참여 페이지
await page.goto(BASE + '/', { waitUntil: 'load' });
await page.waitForTimeout(1200);
ok('메인 = 학생 참여', (await page.content()).includes('세션 코드'));
ok('메인에 허브 아님', (await page.locator('.hub-search input').count()) === 0);

// 1. 허브 (/hub)
await page.goto(BASE + '/hub', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
ok('허브 타이틀', (await page.title()).includes('수업 자료 허브'));
ok('허브 검색창', (await page.locator('.hub-search input').count()) === 1);
const groupChips = await page.locator('.hub-seg-btn').count();
ok('학기·구분 세그먼트', groupChips >= 3, `${groupChips}개`);
const sectionCount = await page.locator('.hub-section').count();
ok('과목 섹션 렌더', sectionCount >= 7, `${sectionCount}개`);
const cardCount = await page.locator('.hub-card').count();
ok('카드 렌더', cardCount >= 60, `${cardCount}장`);
// 기대치는 pages.json의 네이티브 덱(?deck=) 등록 수 — registry 추가 시 자동 추종
const pagesJson = JSON.parse(
  await readFile(new URL('../pages.json', import.meta.url), 'utf8')
);
const expectedApps = pagesJson.subjects
  .flatMap((s) => s.pages)
  .filter((p) => p.path?.includes('index.html?deck=')).length;
const nativeBadges = await page.locator('.hub-badge-app').count();
ok('웹앱 배지', nativeBadges === expectedApps, `${nativeBadges}/${expectedApps}개`);
const liveBadges = await page.locator('.hub-badge-quiz').count();
ok('QUIZ 배지', liveBadges >= 5, `${liveBadges}개`);
// 발표는 문항 유무와 무관 — 문서형(자료)을 뺀 모든 카드에 '발표'가 붙는다
const docCount = await page.locator('.hub-badge-doc').count();
const presentCount = await page.locator('.hub-present').count();
ok(
  '발표 액션 — 문서형 제외 전 카드',
  presentCount === cardCount - docCount,
  `${presentCount}개 (카드 ${cardCount} − 자료 ${docCount})`
);
const openCount = await page.locator('.hub-open').count();
ok('열기 액션 — 전 카드', openCount === cardCount, `${openCount}개`);
await page.screenshot({ path: 'test/hub.png', fullPage: false });

// 검색 필터
await page.fill('.hub-search input', '조건문');
await page.waitForTimeout(300);
const filtered = await page.locator('.hub-card').count();
ok('검색 필터링', filtered >= 1 && filtered < cardCount, `${filtered}장`);
await page.fill('.hub-search input', '');

// 탭 필터
await page.click('.hub-tab:has-text("정보")');
await page.waitForTimeout(300);
ok('탭 필터링', (await page.locator('.hub-section').count()) === 1);

// 학기 그룹 필터 (?group= 딥링크)
await page.goto(BASE + '/hub?group=2026-1', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
const groupSections = await page.locator('.hub-section h2').allTextContents();
ok(
  '2026-1 그룹 필터',
  groupSections.length === 4 &&
    !groupSections.some((t) => t.includes('테스트') || t.includes('동아리')),
  groupSections.join(' / ')
);

// 2. 네이티브 덱 열기
await page.goto(BASE + '/?deck=python-conditionals#1', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
ok('네이티브 덱 타이틀', (await page.title()).includes('파이썬 조건문'));
const slideVisible = await page.locator('.slide').first().isVisible();
ok('덱 슬라이드 렌더', slideVisible);
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(600);
ok('덱 내비게이션(hash)', page.url().includes('#'), page.url().split('?')[1] || '');
await page.screenshot({ path: 'test/deck-native.png' });

// 3. 레거시 덱
await page.goto(BASE + '/data/2026-1/프로그래밍/오리엔테이션/index.html', { waitUntil: 'load' });
await page.waitForTimeout(1200);
const legacySlides = await page.locator('.slide').count();
ok('레거시 덱 슬라이드', legacySlides > 3, `${legacySlides}장`);
await page.screenshot({ path: 'test/deck-legacy.png' });

// 4. 교사 콘솔(React, ?app=host) — 구 URL 리다이렉트 + 네이티브 덱 옵션
await page.goto(BASE + '/live/host/', { waitUntil: 'load' }); // 리다이렉트 검증 겸
await page.waitForTimeout(2200);
ok('구 콘솔 URL 리다이렉트', page.url().includes('app=host'));
const hostHtml = await page.content();
ok('교사 콘솔 로드', hostHtml.includes('교사 콘솔'));
const nativeOpt = await page
  .locator('.lv-deckrow[data-path="index.html?deck=python-conditionals"]')
  .count();
ok('콘솔 덱 목록에 네이티브 덱', nativeOpt === 1);
// 검색으로 좁혀지는지 (드롭다운 → 검색 목록 전환의 핵심)
await page.fill('#lvDeckSearch', '조건문');
await page.waitForTimeout(300);
const searched = await page.locator('.lv-deckrow').count();
ok('콘솔 덱 검색', searched >= 1 && searched < 20, `${searched}건`);
await page.fill('#lvDeckSearch', '');

// 5. 학생 참여 페이지(React, ?app=join)
await page.goto(BASE + '/?app=join', { waitUntil: 'load' });
await page.waitForTimeout(1500);
ok('학생 참여 페이지 로드', (await page.content()).includes('세션 코드'));
await page.screenshot({ path: 'test/join-react.png' });

// 6. 허브 발표 시작 링크가 콘솔 프리필로 이어지는지
await page.goto(
  BASE + '/?app=host&deck=' + encodeURIComponent('index.html?deck=python-conditionals'),
  { waitUntil: 'load' }
);
await page.waitForTimeout(2200);
const preselected = await page
  .locator('.lv-deckpick')
  .getAttribute('data-selected-path')
  .catch(() => '(픽커 없음)');
ok('콘솔 딥링크 프리필', preselected === 'index.html?deck=python-conditionals', String(preselected));
await page.screenshot({ path: 'test/host-react.png' });

await browser.close();
console.log(results.join('\n'));
const relevantErrors = errors.filter(
  (e) => !e.includes('favicon') && !e.includes('net::ERR_') && !e.includes('404')
);
console.log('\n콘솔/페이지 오류:', relevantErrors.length ? relevantErrors.join('\n') : '없음');
