# Walkthrough Grammar — 절차 시연 씬의 세부 문법

SKILL.md의 절차를 실제 코드로 옮길 때의 세부 규칙. 레퍼런스 구현
(`data/AI전문적학습동아리/클로드코드-사용안내/deck.tsx`의 `NodeInstallWalk`·
`ClaudeInstallWalk`·`ClaudeLoginWalk`·`Fix*`)을 옆에 두고 읽으면 빠르다.

## 0. 실사 확인 절차 (SKILL 0단계의 실행법)

웹 절차라면 dev 의존성 Playwright로 실물을 채집한다:

```js
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto('https://…', { waitUntil: 'networkidle' });
await page.screenshot({ path: 'real.png' });          // ① 실물 스크린샷
const labels = await page.evaluate(() =>              // ② 클릭 대상 라벨 덤프
  [...document.querySelectorAll('main button, main select, main a[href*="download"]')]
    .map((el) => el.textContent.trim()));
```

절차가 여러 페이지에 걸치면 실제로 클릭해 **다음 페이지도 같은 방식으로**
채집한다 (예: 다운로드 페이지 → 파일 href 확인). 멀티모달 Read로 스크린샷을
보고 랜드마크 3~5개와 기본값(버전 번호·기본 선택지)을 결정한 뒤에야 목업
JSX를 쓴다. 비웹 프로그램은 공식 문서·공식 페이지 검색으로 대신한다 —
공식 소스 우선, 비공식 캡처는 버전 확인 후 참고만.

## 1. 시각표(timeline) 패턴

국면 시각은 전부 **이름 있는 상수**로 컴포넌트 상단에 모은다. 포인터
웨이포인트·창 popIn·타이핑 delay·조건 렌더(`t > X && …`)가 전부 이 상수를
공유해야 나중에 페이스 조정이 한 줄로 끝난다.

```tsx
const CLICK_LTS = 2.0;          // ① 클릭
const WIZ_IN = 4.3;             // ② 창 등장
const TERM_IN = 9.5;            // ③ 창 등장
const CMD = 'node --version';
const typeAt = 10.3;
const outAt = typedDoneAt(CMD, typeAt, 13) + 0.5;  // 출력은 타이핑 완료에서 파생
```

- 파생 가능한 시각(`outAt`)은 하드코딩하지 말고 `typedDoneAt`으로 계산.
- 국면 사이 최소 0.4s 홀드 — 학생 눈이 따라올 시간.
- 총 길이 8~15s. 그보다 길면 절차를 슬라이드 두 장으로.

## 2. 좌표 계산 — 씬 % 규약

`Pointer`의 x/y는 **씬 컨테이너의 %**다. 클릭 대상의 씬 좌표는 창 배치에서
산수로 구한다:

```
버튼 씬 x = 창 left% + 창 width% × 버튼의 창내 가로비
버튼 씬 y = 창 top%  + 창 height% × 버튼의 창내 세로비
```

예: 창 `left 37.5% width 27%`, 버튼이 창 내 가로 80% 지점이면
x = 37.5 + 27×0.80 ≈ 59.

**이 산수는 초안일 뿐이고, 최종 좌표는 반드시 실측한다.** 산수는 창 크로뮴을
못 본다 — `AppWindow`의 제목줄이 약 36px을 먹고, 본문의 flex·padding이
버튼을 예상과 다른 자리로 민다. 실제로 한 덱에서 225px(약 12%p) 어긋난
채로 "거의 맞는 것 같다"며 통과된 적이 있다(2026-09-15).

절차: 클릭 대상에 `data-pt="이름"`을 달고 **클릭 시각**으로 검산기를 돌린다.

```bash
node .claude/skills/software-walkthrough-builder/scripts/measure_pointer.mjs <deckId> <슬라이드> <클릭 시각들>
```

`✓`는 화살촉이 대상 bbox 안, `✗`는 밖이며 넣을 좌표를 함께 알려 준다.
전부 `✓`가 될 때까지 상수를 고쳐 다시 돌린다. 상세는 SKILL.md의 6-a.

- 창 높이를 지정하지 않으면(터미널 등) 내용만큼 자란다 — 이 경우 버튼 y는
  산수로 구할 수 없으므로 검산기로만 확정한다.
- 대상의 위치는 시간에 따라 변한다: `popIn` 정착 전, `dimAfter`·`shrinkAfter`로
  물러난 뒤, 타이핑으로 옆 라벨 길이가 바뀐 뒤가 모두 다르다. **그 대상을
  클릭하는 시각에** 재야 한다.
- 같은 자리 연속 클릭(마법사 [다음]×N)은 같은 좌표의 웨이포인트를 t만 바꿔
  나열한다.

## 3. 목업 수위 — 랜드마크 원칙

목업은 "그 화면임을 알아보는 최소한"이다. 실물 스크린샷을 베끼지 않는다.

- **랜드마크 3~5개**: 로고 워드마크(텍스트로), 핵심 버튼, 주소창 URL,
  구분되는 구조 1개(내비 바·진행 점 등). 그 외 디테일은 hair 색 막대
  스텁으로 암시.
- **브랜드 색은 한 색만**: Node 초록(#6cc24a), Claude 코랄 등 인지를 돕는
  힌트 1색. 나머지는 tokens 변수 — 덱 테마 안에 앉힌다.
- **텍스트는 실물보다 크게**: 목업 안 글자도 교실 뒤에서 읽혀야 한다.
  clamp(11px,1.2vw,13px) 미만 금지.
- 목업 내용은 **한국어로 의역**한다 (실제 화면이 영어라도). 단, 학생이
  실제로 보게 될 원문 라벨(버튼명 등)이 중요하면 원문을 유지 — 10쪽
  SelectMock처럼 "화면 그대로" 보여주는 게 목적일 때.
- 창 본문 여백이 화면의 1/4 이상 비면 창 height를 줄여라 (near-empty 검사
  대상).

## 4. 창 배치 — 구도 카탈로그가 아니라 절차의 지형

창 배치는 절차의 **구조**를 따라 매번 새로 설계한다 (같은 덱에서 구도 반복
금지 — scene-grammar 쌍둥이 차단과 동일):

- 직렬 절차(A 끝나면 B) → 릴레이 캐스케이드 + 연결선
- 왕복 절차(A→B→A) → 두 창 + 시선이 되돌아오는 배치 (+ 좌측 서사 컬럼)
- 분기 절차(A에서 B 또는 C) → 갈림 배치 + 분기선
- 단일 화면 반복 조작(폼 채우기 등) → 창 하나 크게 + 포인터 동선만

배지(badge ①②③)와 절차 연결선은 창이 2개 이상일 때 넣는다. 연결선
드로우온은 dash가 아니라 **clip 사각형**으로 (preserveAspectRatio=none에서
dash 왜곡):

```tsx
<clipPath id="s7-lead"><rect x={0} y={0}
  width={interpolate(t, [0.6, TERM_IN + 0.4], [0, 100], easeInOut)} height={100} /></clipPath>
<path d="…" clipPath="url(#s7-lead)" vectorEffect="non-scaling-stroke" … />
```

clipPath id는 슬라이드마다 유일하게 (`s7-…`, `s9-…`).

## 5. CLI 표기

- **프롬프트 기호 금지** — `$`, `>`, `PS C:\>` 전부. 초심자는 기호까지
  입력한다. 명령 구분은 fontWeight 650 + 타이핑 모션 + 캐럿으로.
- 출력 라인은 fg-muted, 성공 판정은 ✓ + mint 계열, 주석성 안내는 fg-faint
  이탤릭 (여기도 `#` 붙이지 않는다).
- 캐럿은 "지금 입력 중인 라인"에만 하나. 타이핑이 끝나고 출력이 나오면
  캐럿을 출력 뒤로 옮기거나 마지막 성공 라인에만 남긴다.

## 6. 검증 캡처 — t0 정렬

씬 t는 **슬라이드 진입 시점**에 리셋된다(엔진이 활성 슬라이드만 마운트).
따라서 URL로 대상 슬라이드를 직접 열면 페이지 로드 지연만큼 t가 앞서 있다.
`scripts/capture_walkthrough.mjs`는 **직전 슬라이드를 연 뒤 ArrowRight로
진입해 그 순간을 t0으로** 잡는다 — 직전 슬라이드의 빌드 클릭도 자동 소진.

검수 프레임 선택: ① hero(≤1.5s) ② 각 클릭 직후(파동이 보이는 +0.3s)
③ 최종 상태(freezeAt와 동일). 각 프레임에서 볼 것:

- 포인터 팁이 대상 버튼 위에 있는가 — 눈으로 보지 말고 measure_pointer.mjs로 판정한다 (팁 = SVG의 (4,2), 좌표점과 일치)
- 창 겹침으로 가려진 텍스트가 없는가 / 연결선이 창 위를 관통하지 않는가
- 목업 글자 줄바꿈·말줄임이 어색하지 않은가
- 마지막 프레임이 "성공 요약 컷"으로 읽히는가

## 7. 흔한 실패

| 증상 | 원인/처방 |
|---|---|
| 연결선이 파편으로 흩어짐 | dash 드로우온 + preserveAspectRatio=none → clip 방식으로 |
| 뒤 창·선이 창을 관통해 비침 | 창 배경이 반투명(surface 토큰) — AppWindow 기본(불투명 color-mix) 유지, opacity 디밍 금지(dimAfter는 밝기 필터) |
| 포인터가 버튼 옆에 착지 | 좌표 산수만 믿음 — data-pt를 달고 measure_pointer.mjs로 실측해 상수 교체 |
| 클릭 순간 포인터가 안 보임 | 앞선 hide가 끝까지 유지됨 — hide는 다음 웨이포인트에서 복귀하므로, 다음 클릭 키가 있는지 확인 |
| 클릭이 안 보임 | clickFlash 피드백 누락 — 파동(포인터)과 버튼 발광 둘 다 |
| 썸네일이 빈 화면 | freezeAt 기본(완료 상태)을 깨는 조건 렌더 — 마지막 국면이 모든 창을 보여주는지 확인 |
| 타이핑이 답답함/조급함 | cps 11~14 밖 — 명령 길이에 맞춰 조정 |
