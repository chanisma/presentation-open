---
name: dynamic-scene-builder
description: 에이전트가 동적인 슬라이드 씬(장면)을 씬마다 처음부터 자유 저작하는 스킬. "동적 슬라이드", "움직이는 슬라이드", "씬 만들어줘", "다이나믹 씬", "애니메이션 슬라이드", "장면 생성", "dynamic scene" 등을 언급하거나, 정적 나열이 아닌 시각 메타포·모션이 있는 수업 덱을 만들 때 사용. 템플릿 재사용 대신 씬별 고유 코드를 쓰고 validator + 픽셀 검수로 품질을 강제한다.
---

# Dynamic Scene Builder — 씬 단위 자유 저작 + 엄격 검증

newVideoGen 프로젝트의 핵심 철학을 슬라이드덱에 이식한 스킬이다.

> **"이 덱의 적은 '무난함'이다. 규칙을 더하지 말고 표현을 해방하라. 대신 결과물만 엄격하게 측정하라."**

- **표현 층 = 자유**: 씬(슬라이드 한 장)마다 마크업·스타일·모션 코드를 **처음부터** 쓴다. 재사용 가능한 씬 템플릿·공용 표현 컴포넌트를 만드는 것 자체가 안티패턴이다 (모든 씬이 같은 구조로 수렴 → generic).
- **측정 층 = 엄격**: 완성물은 두 개의 BLOCKING 게이트를 통과해야 한다.
  - `scripts/validate_scene.py` — 구조 시그니처 쌍둥이 차단, 의도 주석, 결정론, Lazy Defaults
  - `scripts/pixel_review.mjs` — 씬별 풀해상도 PNG + 밀도(near-empty) 검사 + 컨택트시트

시작 전에 `references/scene-philosophy.md`와 **`.claude/rules/scene-grammar.md`**
(newVideoGen 장면 조립 수칙의 슬라이드덱판 — Lazy Defaults·고유 메타포·
레이아웃 계약·픽셀 검수)를 반드시 읽는다.

## 절차

### 1. 씬 계획 (코드 작성 금지 단계)

`data/<그룹>/<과목>/<수업>/plan.md`(lesson-deck-planner 산출물)가 있으면 그 안의
`- scene: metaphor: … | emotion: … | intent: …` 라인들을 씬 목록으로 그대로
사용한다(문법 동일). 없으면 수업 자료/학습 목표에서 씬 목록을 만든다.
씬마다 한 줄씩:

```
sc-03 | metaphor: 저울 | emotion: 아하! | intent: 비교가 정렬의 원자 행동임을 보인다
```

- **씬마다 고유 시각 메타포**가 있어야 한다. "직전 씬들과 시각적으로 어떻게 다른가?"에
  "텍스트만 다르고 구도 같음"이라고 답하게 되면 → 멈추고 메타포를 재발명한다.
- 씬 수는 8±3이 적정. 씬 하나 = 하나의 아이디어.

### 2. 덱 셸 준비 (Deck Contract v1)

덱 = 콘텐츠(.slide 씬들)만. 크롬·네비·모션 런타임·라이브 연동은 공통 컨트롤러가 제공한다:

```html
<head> …base 태그 보정 스크립트… 폰트 … 덱 전역 스타일(.slide 오버레이 등) </head>
<body data-deck-title="제목" data-subject="과목">
  <div class="slide active" data-scene="sc-01">…</div> ×N
  <script type="module" src="../../live/runtime/deck.js?v=1"></script>
  <script type="module">/* SceneMotion.register(...) — deck.js 전역 사용, 반드시 deck.js 태그 뒤 */</script>
</body>
```

- 진행바·하단 네비·해시 딥링크·SceneMotion/interpolate/springy 전역·`?live=` 라이브 연동 = deck.js 몫
- 씬 타임라인 스크립트는 **`type="module"`이어야 deck.js 이후에 실행**된다 (classic script면 전역 미정의 오류)
- 라이브 문항은 `<수업폴더>/quiz.json`으로 (live-quiz-builder 스킬) — 덱 마크업 불필요
- 레퍼런스: `data/dev/테스트 수업 자료/동적씬-버블정렬/index.html`

### 3. 씬 저작 (씬당 반복)

`references/motion-utils.md`의 씬 규약을 따른다. 요체:

```html
<!-- scene: sc-03 | metaphor: 저울 | intent: 비교가 정렬의 원자 행동임을 보인다 -->
<div class="slide" data-scene="sc-03">
  <style>
    /* 모든 셀렉터는 [data-scene="sc-03"] 하위로 한정. @keyframes 이름은 sc-03- 접두사 */
    [data-scene="sc-03"] .beam { ... }
  </style>
  ... 자유 마크업 (이 씬만을 위한 레이아웃) ...
</div>
```

모션은 씬 하단(또는 덱 하단)에서 등록 — **t(활성화 후 경과 초)의 순수 함수**:

```js
SceneMotion.register('sc-03', (t, el) => {
  el.querySelector('.beam').style.transform = `rotate(${interpolate(t, [0.3, 1.2], [0, -8], easeOut)}deg)`;
});
```

씬당 자문 게이트 (코드 작성 전):
1. 이 씬의 메타포는 직전 씬들과 시각적으로 다른가?
2. 각 요소는 "왜 여기 있는가"에 답할 수 있는가? (못 하면 삭제 — 필러 금지)
3. 히어로 프레임(모든 요소가 가장 잘 보이는 순간)이 **t ≤ 1.5초**에 도달하는가? (픽셀 검수가 t≈1.6s에 캡처)
4. Lazy Defaults를 쓰고 있지 않은가? (아래 금지 목록)

### 4. 게이트 통과 (BLOCKING — 통과 전 완료 선언 금지)

```bash
python .claude/skills/dynamic-scene-builder/scripts/validate_scene.py <덱경로>
node   .claude/skills/dynamic-scene-builder/scripts/pixel_review.mjs <덱경로> <출력폴더>
```

- validator 오류 = 수정 후 재실행. 규칙을 우회하려 마크업을 비틀지 말고 **표현을 재발명**한다.
- pixel_review가 만든 PNG를 **한 장씩 직접 보고**(축소 그리드만 보지 말 것) 텍스트 겹침·잘림·빈 화면을 확인한다. 스키마 통과 ≠ 픽셀 통과.

### 5. 등록

```bash
python .claude/skills/notebooklm-lesson-deck/scripts/update_pages_json.py <path> <title> ...
```

## 금지 목록 (Lazy Defaults — validator가 오류로 차단)

| 금지 | 이유 |
|---|---|
| 이모지 | 씬은 자기 시각 언어로 말한다. 이모지는 표현의 외주 |
| `repeat(N,1fr)`·`1fr 1fr 1fr` 균등 그리드 | 파워포인트 회귀. 비대칭이 기본 |
| `Math.random()` / `Date.now()` | 모션은 t의 순수 함수 (재현·검수 가능해야 함) |
| 씬 스코프 밖 셀렉터 | 씬 간 스타일 간섭 → 유지보수 불능 |
| 의도 주석 없는 씬 | 요소 증명 책임 — 씬의 존재 이유를 코드에 남긴다 |
| 같은 metaphor 재사용 | 씬당 고유 메타포 강제 |
| 씬 3개 이상 동일 구조 | 구조 시그니처 클러스터 ≤ 2 |

## 관련 파일

- 철학: `references/scene-philosophy.md` (작성 전 필독)
- 모션 규약 + 캐노니컬 런타임: `references/motion-utils.md`
- 게이트: `scripts/validate_scene.py`, `scripts/pixel_review.mjs`
- 예시 덱: `data/dev/테스트 수업 자료/동적씬-버블정렬/index.html` + `quiz.json` (이 스킬로 제작된 Contract v1 레퍼런스)
- 공통 컨트롤러: `live/runtime/deck.js` (크롬·네비·모션 전역·라이브 로더)
