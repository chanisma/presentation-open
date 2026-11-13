/* 로컬 덱 에디터 E2E — ?app=edit
   dev 서버 전용 기능이라 dev 서버(기본 5199)가 떠 있어야 한다.
   실제 수업 파일을 고치고 되돌리므로, 끝에 git으로 원상 복구한다. */
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_BASE || 'http://localhost:5199';
const DECK = 'python-conditionals';
const DIR = 'data/dev/테스트 수업 자료/파이썬-조건문-웹앱덱';
const SRC = `${DIR}/deck.tsx`;
const QUIZ = `${DIR}/quiz.json`;
const LOG = `${DIR}/edits.md`;
const PLAN = `${DIR}/slides-plan.md`;
const REG = 'src/decks/registry.tsx';
/* 두 번째 시험 대상 — 24장에 씬·빌드·walkthrough가 섞인 3,500줄짜리 덱.
   발표자 노트가 notes.ts에 따로 있어서 조건이 다르다. */
const V2 = {
  deck: 'ai-how-to-learn-v2',
  dir: 'data/2026-2/인공지능기초/인공지능은-어떻게-배울까-v2',
};
V2.src = `${V2.dir}/deck.tsx`;

const results = [];
const ok = (name, cond, extra = '') =>
  results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const quizSlides = () =>
  JSON.parse(read(QUIZ)).activities.map((a) => `${a.id}:${a.slide}`).join(' ');
const regSlides = () =>
  Number(read(REG).match(new RegExp(`id: '${DECK}',[\\s\\S]{0,1200}?slides: (\\d+),`))?.[1]);

const before = { src: read(SRC), quiz: quizSlides(), reg: regSlides() };
const v2Before = read(V2.src);
/* 손댄 파일만 원래 내용으로 되돌린다. git checkout으로 폴더를 통째로 되돌리면
   아직 커밋하지 않은 다른 작업까지 날아간다(2026-09-19에 실제로 겪었다). */
const snapshot = [SRC, QUIZ, REG, V2.src].map((f) => [f, read(f)]);
const restore = () => {
  for (const [f, text] of snapshot) if (read(f) !== text) writeFileSync(f, text, 'utf8');
  for (const f of [LOG, PLAN, `${V2.dir}/edits.md`, `${V2.dir}/slides-plan.md`])
    if (existsSync(f)) rmSync(f);
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => {
  // 400은 "깨지는 저장 거부"를 일부러 부른 것 — 그 자리에서 따로 확인한다
  if (m.type() === 'error' && !/favicon|400 \(Bad Request\)/i.test(m.text()))
    errors.push('console: ' + m.text());
});

/** 레일에 보이는 슬라이드 이름 목록 (숨긴 것 포함) */
const rail = () => page.locator('.ed-rail-label').allInnerTexts();
/** 미리보기를 다시 읽고 원본 경계까지 받아 올 때까지 기다린다.
    visible=화면에 보이는 쪽 수, total=레일 자리 수(숨긴 것 포함, 기본은 같다) */
const settle = async (visible, total = visible) => {
  await page.waitForFunction(
    ([v, t]) =>
      (document.querySelector('.ed-stage-foot .ed-num')?.textContent ?? '').endsWith(`/ ${v}`) &&
      document.querySelectorAll('.ed-rail-item').length === t,
    [visible, total],
    { timeout: 25000 }
  );
  await page.waitForTimeout(600);
};
/** 쪽 수가 그대로인 조작(순서 바꾸기)은 첫 이름이 바뀌기를 기다린다 */
const settleFirst = async (label) => {
  await page.waitForFunction(
    (t) => document.querySelector('.ed-rail-label')?.textContent === t,
    label,
    { timeout: 25000 }
  );
  await page.waitForTimeout(500);
};
/** 조작 도구는 고른 줄에만 나오므로, 그 줄을 먼저 고르고 누른다 */
const tool = async (i, title) => {
  await page.locator('.ed-rail-item').nth(i).locator('.ed-rail-go').click();
  await page.waitForTimeout(250);
  await page.locator('.ed-rail-item').nth(i).locator(`button[title="${title}"]`).click();
};

try {
  // 0. 덱 고르기 화면 — 웹앱 덱만
  await page.goto(`${BASE}/?app=edit`, { waitUntil: 'load' });
  await page.waitForSelector('.ed-picker', { timeout: 10000 });
  const rows = await page.locator('.ed-row').count();
  ok('고르기 화면에 웹앱 덱 34개', rows === 34, `${rows}개`);

  // 1. 작업 화면 — 레일·무대
  await page.goto(`${BASE}/?app=edit&deck=${DECK}`, { waitUntil: 'load' });
  await page.waitForSelector('.ed-rail-item', { timeout: 15000 });
  await page.waitForTimeout(800);
  ok('슬라이드 레일 = 14장', (await page.locator('.ed-rail-item').count()) === 14);
  ok('레일 라벨이 nav prop', (await rail())[0] === '도입');
  ok('수업 폴더를 찾았다', (await page.locator('.ed-top .ed-path').innerText()).includes('파이썬-조건문'));
  ok(
    '덱 테마가 에디터를 덮지 않는다',
    (await page.locator('.ed-root').evaluate((n) => getComputedStyle(n).backgroundColor)) ===
      'rgb(8, 11, 16)'
  );
  ok('발표자 노트를 읽었다', (await page.locator('.ed-notes').innerText()).includes('학교 오는 길'));

  // 2. 미리보기에서 글자 집기
  const frame = page.frameLocator('.ed-frame iframe');
  await frame.locator('text=고등학교 정보 · 파이썬').first().click({ timeout: 10000 });
  await page.waitForSelector('.ed-cand', { timeout: 10000 });
  ok('집은 글자의 원본을 찾았다', (await page.locator('.ed-cand').count()) >= 1);
  ok('후보가 deck.tsx', (await page.locator('.ed-cand').first().innerText()).includes('deck.tsx'));

  // 3. 문구 저장
  await page.locator('.ed-panel textarea').nth(1).fill('고등학교 정보 · 파이썬 테스트');
  await page.locator('.ed-btn--primary').first().click();
  await page.waitForTimeout(1200);
  ok('원본 파일이 바뀌었다', read(SRC).includes('kicker="고등학교 정보 · 파이썬 테스트"'));
  ok('편집 기록(edits.md)이 생겼다', existsSync(LOG));
  ok('기록에 이전·이후가 있다', read(LOG).includes('- 이전:') && read(LOG).includes('테스트'));
  ok('기록에 상위 원본 주의가 있다', read(LOG).includes('plan.md'));

  // 4. 되돌리기
  await page.locator('.ed-btn', { hasText: '되돌리기' }).click();
  await page.waitForTimeout(1200);
  ok('되돌리기로 원문 복구', read(SRC) === before.src);
  ok('되돌리기도 기록된다', read(LOG).includes('되돌리기 ·'));

  // 5. 구문이 깨지는 저장은 거부 — JSX 본문에 꺾쇠
  await frame.locator('text=오늘도 만나는').first().click();
  await page.waitForSelector('.ed-cand', { timeout: 10000 });
  await page.locator('.ed-panel textarea').nth(1).fill('오늘도 <만나는>,');
  await page.locator('.ed-btn--primary').first().click();
  await page.waitForTimeout(900);
  ok(
    '깨지는 저장은 거부',
    (await page.locator('.ed-note--bad').count()) > 0 && read(SRC) === before.src
  );

  // ── 슬라이드 조작 ────────────────────────────────────────────────
  const undoBtn = page.locator('.ed-btn', { hasText: '되돌리기' });

  // 6. 순서 바꾸기 — 1번째를 아래로
  const order0 = await rail();
  await tool(0, '아래로');
  await settleFirst(order0[1]);
  const order1 = await rail();
  ok('슬라이드 순서 바꿈', order1[0] === order0[1] && order1[1] === order0[0], order1.slice(0, 2).join(' / '));
  ok('원본도 순서가 바뀌었다', read(SRC).indexOf('nav="조건문이란"') < read(SRC).indexOf('nav="도입"'));
  ok('순서 바꾸기는 slides 수를 건드리지 않는다', regSlides() === before.reg);

  await undoBtn.click();
  await settleFirst(order0[0]);
  ok('순서 바꾸기 되돌리기', read(SRC) === before.src);

  // 7. 복제 — 장수와 registry가 함께 는다
  await tool(0, '복제');
  await settle(15);
  const dup = await rail();
  ok('복제로 15장', dup.length === 15 && dup[0] === dup[1], dup.slice(0, 2).join(' / '));
  ok('registry slides도 15', regSlides() === 15, String(regSlides()));
  ok('복제는 문항 쪽 번호를 건드리지 않는다', quizSlides() === before.quiz);

  await undoBtn.click();
  await settle(14);
  ok('복제 되돌리기 — 원본·registry 둘 다', read(SRC) === before.src && regSlides() === before.reg);

  // 8. 숨기기 — 자리는 레일에 남고 화면에서만 빠진다
  await tool(0, '숨기기');
  await settle(13, 14);
  ok('숨겨도 레일에는 14자리가 남는다', (await page.locator('.ed-rail-item').count()) === 14);
  ok('숨긴 자리 표시', (await page.locator('.ed-rail-item.is-hidden').count()) === 1);
  ok('화면에는 13장', regSlides() === 13, String(regSlides()));
  ok('숨김은 지우지 않는다', read(SRC).includes('숨김(에디터)') && read(SRC).includes('nav="도입"'));
  ok(
    '숨기면 문항 쪽 번호도 당겨진다',
    quizSlides() === 'warmup-if:1 q-colon:2 q-elif:4 pi-compare:5 q-or:6 code-evenodd:9 exit:last',
    quizSlides()
  );

  // 9. 다시 보이기
  await tool(0, '다시 보이기');
  await settle(14);
  ok(
    '다시 보이기로 원상 복구',
    read(SRC) === before.src && quizSlides() === before.quiz && regSlides() === before.reg
  );

  // 10. 빈 슬라이드 추가 — 자리만 잡고 계획은 slides-plan.md로
  await tool(0, '이 아래에 빈 슬라이드 추가');
  await page.waitForSelector('.ed-row-btns', { timeout: 10000 });
  await page.locator('.ed-panel input.ed-input').fill('조건이 여러 개일 때');
  await page.locator('.ed-panel textarea.ed-input').fill('elif를 왜 쓰는지 학생이 스스로 말하게 하고 싶다.');
  await page.locator('.ed-btn--primary', { hasText: '자리 만들기' }).click();
  await settle(15);
  ok('빈 슬라이드가 들어갔다', (await rail())[1] === '⬚ 조건이 여러 개일 때', (await rail())[1]);
  ok('원본에 자리표시가 생겼다', /TODO\(계획\) plan-/.test(read(SRC)));
  ok('계획 파일이 생겼다', existsSync(PLAN));
  ok(
    '계획에 사용자가 적은 맥락이 그대로 들어갔다',
    read(PLAN).includes('elif를 왜 쓰는지 학생이 스스로 말하게 하고 싶다.')
  );
  ok('계획 파일이 인공지능에게 무엇을 할지 알려 준다', read(PLAN).includes('lesson-deck-planner'));
  ok('추가도 registry에 반영', regSlides() === 15, String(regSlides()));

  await undoBtn.click();
  await settle(14);
  ok('추가 되돌리기', read(SRC) === before.src && regSlides() === before.reg);

  // 11. 삭제 — 문항 쪽 번호가 따라 당겨진다
  page.once('dialog', (d) => d.accept());
  await tool(0, '삭제');
  await settle(13);
  ok('삭제로 13장', (await page.locator('.ed-rail-item').count()) === 13);
  ok('registry slides도 13', regSlides() === 13, String(regSlides()));
  ok('삭제도 기록된다', read(LOG).includes('슬라이드 · 삭제') && read(LOG).includes('쪽 →'));

  await undoBtn.click();
  await settle(14);
  ok(
    '삭제 되돌리기 — 원본·문항·registry 셋 다',
    read(SRC) === before.src && quizSlides() === before.quiz && regSlides() === before.reg
  );

  // 9. 문항 탭
  await page.locator('.ed-tabs button', { hasText: '문항' }).click();
  await page.waitForSelector('.ed-act', { timeout: 10000 });
  ok('quiz.json 문항을 읽었다', (await page.locator('.ed-act').count()) === 7);
  await page.locator('.ed-act textarea').first().fill('테스트로 바꾼 질문');
  await page.locator('.ed-quiz-bar .ed-btn--primary').click();
  await page.waitForTimeout(1000);
  const quizNow = JSON.parse(read(QUIZ));
  ok('문항이 저장됐다', quizNow.activities[0].prompt === '테스트로 바꾼 질문');
  ok('quiz.json 서식 유지(2칸+끝개행)', read(QUIZ).startsWith('{\n  "') && read(QUIZ).endsWith('}\n'));
  ok('모르는 필드를 보존했다', JSON.stringify(quizNow.activities).includes('misconceptions'));
  ok('문항 변경도 기록된다', read(LOG).includes('- 수정 ·') && read(LOG).includes('질문:'));

  // ── 12. 큰 덱 — 24장에 씬·빌드·walkthrough가 섞여 있고 노트는 notes.ts에 있다 ──
  // 작은 덱만으로는 못 잡는 것들을 본다: 문자열 리터럴 안의 이스케이프된 따옴표,
  // 3,500줄짜리 한 파일에서 같은 문구가 여러 곳에 있을 때, 씬 슬라이드의 장면 멈춤.
  await page.goto(`${BASE}/?app=edit&deck=${V2.deck}`, { waitUntil: 'load' });
  await page.waitForSelector('.ed-rail-item', { timeout: 20000 });
  await page.waitForTimeout(2500);
  ok('큰 덱 — 레일 24장', (await page.locator('.ed-rail-item').count()) === 24);
  ok('큰 덱 — notes.ts의 노트를 읽는다', (await page.locator('.ed-notes').innerText()).includes('펼친 실험 노트'));

  // 노트에는 큰따옴표가 이스케이프되어 들어 있다 — 그래도 원본을 찾아야 한다
  await page.locator('.ed-btn--ghost', { hasText: '이 노트 고치기' }).click();
  await page.waitForTimeout(1500);
  ok(
    '큰 덱 — 이스케이프된 따옴표가 든 노트를 찾는다',
    (await page.locator('.ed-cand').count()) > 0 &&
      (await page.locator('.ed-cand .ed-num').first().innerText()).startsWith('notes.ts')
  );

  // 같은 문구가 nav와 본문 두 군데에 있다 — 둘 다 후보로 보여 줘야 고를 수 있다
  await page.locator('.ed-panel textarea').first().fill('뉴런을 흉내 낸 계산기');
  await page.locator('.ed-btn--ghost', { hasText: '원본에서 찾기' }).click();
  await page.waitForTimeout(1200);
  const where = (await page.locator('.ed-cand .ed-num').allInnerTexts()).join(' ');
  ok('큰 덱 — 같은 문구가 여러 곳이면 모두 보여 준다', where.split('deck.tsx').length - 1 >= 2, where);

  // ── 같은 글자가 여러 곳일 때 ────────────────────────────────────
  // 제목과 레일 이름을 짝지어 적어 두는 일이 잦다. 어느 것이 누른 자리인지 보여 주고,
  // 한꺼번에 바꿀 수도 있어야 한다. 한쪽만 바뀌면 덱과 레일이 어긋난다.
  await page.locator('.ed-rail-item').nth(8).locator('.ed-rail-go').click();
  await page.waitForTimeout(3000);
  const scale9 = await page
    .locator('.ed-frame iframe')
    .evaluate((el) => Number(getComputedStyle(el).transform.match(/matrix\(([\d.]+)/)?.[1] ?? 1));
  const head9 = await page
    .frameLocator('.ed-frame iframe')
    .locator('body')
    .evaluate(() => {
      const e = [...document.querySelectorAll('.slide h1, .slide h2')].find((x) =>
        (x.textContent ?? '').includes('퍼셉트론')
      );
      if (!e) return null;
      const r = e.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
  if (!head9) ok('큰 덱 — 9쪽 제목을 집는다', false, '제목을 못 찾음');
  else {
    // 앞선 손찾기의 후보가 아직 떠 있다 — 목록이 새로 그려질 때까지 기다린다
    const stale = (await page.locator('.ed-cand .ed-num').allInnerTexts()).join(' ');
    await page.locator('.ed-frame iframe').click({ position: { x: head9.x * scale9, y: head9.y * scale9 } });
    await page.waitForFunction(
      (old) =>
        [...document.querySelectorAll('.ed-cand .ed-num')].map((n) => n.textContent).join(' ') !== old,
      stale,
      { timeout: 15000 }
    );
    await page.waitForTimeout(400);
    ok('큰 덱 — 같은 글자 3곳', (await page.locator('.ed-cand').count()) === 3);
    ok('큰 덱 — 누른 자리를 딱 하나만 표시', (await page.locator('.ed-here').count()) === 1);
    ok(
      '큰 덱 — 누른 자리가 맨 위',
      (await page.locator('.ed-cand').first().innerText()).includes('누른 자리')
    );
    const allBtn = page.locator('.ed-btn', { hasText: '곳 모두' });
    ok('큰 덱 — 모두 바꾸기 단추', (await allBtn.count()) === 1, await allBtn.innerText());
    await page.locator('.ed-panel textarea').nth(1).fill('퍼셉트론 테스트');
    await allBtn.click();
    await page.waitForTimeout(1800);
    ok(
      '큰 덱 — 3곳이 한꺼번에 바뀐다',
      (read(V2.src).match(/퍼셉트론 테스트/g) ?? []).length === 3,
      String((read(V2.src).match(/퍼셉트론 테스트/g) ?? []).length)
    );
    await page.locator('.ed-btn', { hasText: '↶ 되돌리기' }).click();
    await page.waitForTimeout(1500);
    ok('큰 덱 — 되돌리기 한 번에 3곳 복구', read(V2.src) === v2Before);
  }

  // 씬 슬라이드에서는 장면 멈춤 단추가 나온다 (글자가 움직이면 겨냥하기 어렵다)
  await page.locator('.ed-rail-item').nth(3).locator('.ed-rail-go').click();
  await page.waitForTimeout(2000);
  ok('큰 덱 — 씬에서 장면 멈춤 단추', (await page.locator('.ed-btn', { hasText: '장면' }).count()) === 1);

  await tool(5, '이 아래에 빈 슬라이드 추가');
  await page.waitForSelector('.ed-row-btns', { timeout: 10000 });
  await page.locator('.ed-panel textarea.ed-input').fill('손잡이를 너무 세게 돌리면 어떻게 되는지 보여 주고 싶다.');
  await page.locator('.ed-btn--primary', { hasText: '자리 만들기' }).click();
  await settle(25);
  ok('큰 덱 — 빈 슬라이드 추가', /TODO\(계획\)/.test(read(V2.src)));
  await page.locator('.ed-btn', { hasText: '되돌리기' }).click();
  await settle(24);
  ok('큰 덱 — 추가 되돌리기', read(V2.src) === v2Before);

  // ── 13. 자리·크기 + 워크스루 포인터 자동 재측정 ──────────────────
  // 창을 옮기면 포인터가 찍는 자리(TG21)가 조용히 틀어진다. 그래서 저장할 때 다시 재서
  // 같이 고친다. 이 항목이 깨지면 "화면은 멀쩡한데 마우스만 엉뚱한 곳"이 된다.
  const win = () => read(V2.src).match(/^const WIN1 = \{ x: (-?[\d.]+)/m)?.[1];
  const card = () => read(V2.src).match(/card: \{ x: (-?[\d.]+)/)?.[1];
  const win0 = win();
  const card0 = card();

  await page.locator('.ed-rail-item').nth(20).locator('.ed-rail-go').click();
  await page.waitForTimeout(3500);
  const scale = await page
    .locator('.ed-frame iframe')
    .evaluate((el) => Number(getComputedStyle(el).transform.match(/matrix\(([\d.]+)/)?.[1] ?? 1));
  const at = await page
    .frameLocator('.ed-frame iframe')
    .locator('body')
    .evaluate(() => {
      const box = document.querySelector('[data-pt="w1-card"]');
      if (!box) return null;
      const leaf = [...box.querySelectorAll('*')].find((x) =>
        [...x.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim().length > 2)
      );
      const r = (leaf ?? box).getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
  if (!at) ok('큰 덱 — 워크스루 창 안 글자를 집는다', false, '창이 아직 안 나왔다');
  else {
    await page.locator('.ed-frame iframe').click({ position: { x: at.x * scale, y: at.y * scale } });
    await page.waitForSelector('.ed-geo', { timeout: 10000 });
    const label = await page.locator('.ed-panel .ed-note').last().innerText();
    ok('큰 덱 — 창 안을 누르면 창 상자가 잡힌다', label.includes('WIN1'), label.replace(/\s+/g, ' ').slice(0, 60));

    await page.locator('.ed-geo input').first().fill('160');
    await page.locator('.ed-btn--primary', { hasText: '자리 저장' }).click();
    // 포인터를 두 번 재느라 1분 가까이 걸린다
    await page.waitForFunction(
      () => !document.querySelector('.ed-geo'),
      null,
      { timeout: 180000 }
    );
    await page.waitForTimeout(1500);
    ok('큰 덱 — 창을 옮겼다', win() === '160', `x=${win()}`);
    ok('큰 덱 — 포인터 좌표를 다시 재서 고쳤다', card() !== card0, `${card0} → ${card()}`);
    const msg = await page.locator('.ed-side .ed-note').first().innerText();
    ok('큰 덱 — 다시 재고도 빗나가는 자리는 없다', !msg.includes('⚠'), msg.replace(/\s+/g, ' ').slice(0, 90));

    await page.locator('.ed-btn', { hasText: '되돌리기' }).click();
    await page.waitForTimeout(2500);
    ok('큰 덱 — 되돌리기 한 번에 창과 포인터가 함께 복구', win() === win0 && card() === card0, `x=${win()}, card=${card()}`);
  }

  // ── 14. 낱말 안쪽은 걸리지 않는다 (읽기만 한다) ──────────────────
  // 좁혀 찾을 때 `첫 명령`이 `첫 명령을` 안쪽에 걸리면, 바꾸고 나서 `첫 명령이다을`이 된다.
  // 사용자가 실제로 겪은 자리라 그대로 시험에 남긴다 (2026-09-19).
  const probe = await page.evaluate(async () => {
    const r = await fetch('/__edit/locate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '첫 명령', dir: 'data/2026-2/바이브코딩/에이전트에게-첫-명령' }),
    });
    const j = await r.json();
    return (j.candidates ?? []).map((c) => `${c.file.split('/').pop()}:${c.line}`);
  });
  ok('낱말 안쪽은 걸리지 않는다', probe.length > 0 && !probe.includes('slides-a.tsx:76'), probe.join(' '));

  ok('콘솔 오류 없음', errors.length === 0, errors.slice(0, 3).join(' | '));
} catch (e) {
  ok('예외 없이 완주', false, String(e.message).split('\n')[0]);
} finally {
  await browser.close();
  restore();
}

console.log(results.join('\n'));
const failed = results.filter((r) => r.startsWith('FAIL')).length;
console.log(`\n${results.length - failed}/${results.length} 통과`);
process.exit(failed ? 1 : 0);
