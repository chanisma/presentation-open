/* 자료(doc) 라우팅 E2E — 활동지/문서는 원본으로, 미분류 문서는 뷰어 폴백으로 */
import { chromium } from 'playwright';
const BASE = process.env.SMOKE_BASE || 'http://localhost:5199';
const results = [];
const ok = (n, c, x = '') => results.push(`${c ? 'PASS' : 'FAIL'} ${n}${x ? ' — ' + x : ''}`);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });

// 1. 허브에서 자료 카드가 원본으로 열리는지 (기말고사대비 = doc)
await p.goto(BASE + '/hub', { waitUntil: 'networkidle' });
await p.waitForTimeout(800);
await p.fill('.hub-search input', '기말고사');
await p.waitForTimeout(400);
const docBadges = await p.locator('.hub-badge-doc').count();
ok('자료 배지 표시', docBadges >= 1, `${docBadges}개`);
await p.locator('.hub-card').first().click();
await p.waitForTimeout(1500);
ok('자료 카드 → 원본 직접 열기', decodeURIComponent(p.url()).includes('기말고사대비/index.html'), p.url().slice(-40));
ok('뷰어 미경유', !p.url().includes('legacy='));
const bodyText = await p.locator('body').textContent();
ok('자료 내용 로드', (bodyText ?? '').includes('기말고사'));

// 2. 미분류 문서가 뷰어로 들어와도 원본으로 자동 전환 (런타임 안전망)
await p.goto(BASE + '/?legacy=' + encodeURIComponent('data/2026-1/프로그래밍/기말고사대비/index.html'), { waitUntil: 'load' });
await p.waitForTimeout(2500);
ok('뷰어 폴백 → 원본 전환', !p.url().includes('legacy=') && decodeURIComponent(p.url()).includes('기말고사대비'), decodeURIComponent(p.url()).slice(-50));

// 3. 교사 콘솔 픽커에서 자료 제외
await p.goto(BASE + '/?app=host', { waitUntil: 'load' });
await p.waitForTimeout(2000);
const docOpt = await p.locator('.lv-deckrow[data-path="data/2026-1/프로그래밍/기말고사대비/index.html"]').count();
const deckOpt = await p.locator('.lv-deckrow[data-path="data/2026-1/정보/반복문/index.html"]').count();
ok('콘솔 픽커: 자료 제외', docOpt === 0);
ok('콘솔 픽커: 덱 유지', deckOpt === 1);

await b.close();
console.log(results.join('\n'));
process.exitCode = results.some((r) => r.startsWith('FAIL')) ? 1 : 0;
