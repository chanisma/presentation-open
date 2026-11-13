---
name: react-deck-builder
description: >-
  bolt-slides 기반 네이티브 React 덱(웹앱 덱)을 저작·등록하는 스킬.
  "React 덱", "웹앱 덱", "인터랙티브 덱", "bolt 덱", "새 덱 만들어서 registry 등록",
  "?deck= 덱" 등을 언급하거나, 정적 HTML 덱이 아닌 React 컴포넌트 덱을
  src/decks/에 만들 때 사용. 저작 규칙은 references/bolt-authoring.md(원본
  bolt-slides SKILL)를 따르고, 이 문서는 이 저장소 고유의 등록·라이브·검증
  절차를 담는다.
---

# React 덱 저작 + 저장소 통합

이 저장소는 bolt-slides 프레임워크(React 18 + Vite 5 + framer-motion)와
레거시 HTML 덱 허브가 병합된 구조다. 네이티브 React 덱 한 개를 추가하는
전체 절차:

> **계획 선행**: 소재만 있고 슬라이드 구성이 없다면 먼저 `lesson-deck-planner`
> 스킬로 `data/<그룹>/<과목>/<수업>/plan.md`를 만든다. plan.md가 있으면 각 슬라이드의
> form(image/scene/static/build/live)과 형태 설계를 그대로 따라 저작한다 —
> 혼합 form 패턴은 `?deck=mixed-demo` 참조.

## 0. 저작 규칙 (필수 선행 독해)

`references/bolt-authoring.md` — 원본 bolt-slides 스킬. 3대 하드 룰:
1. `src/deck/` 엔진·크롬과 `src/styles/base.css`는 절대 수정 금지.
2. 스타터 리스킨 금지 — 실제 수업 내용으로 처음부터 저작.
3. 사이드 비주얼 없는 슬라이드는 반드시 중앙 정렬(`<Slide center>`).

테마는 registry의 `theme`(CSS 변수 오버라이드)으로만 — `tokens.css`의
`:root`는 공유 기본값이므로 덱별로 건드리지 않는다.

추가 저작 규칙:
- **클릭 링크**: 수업 중 접속할 URL은 반드시 `<a href target="_blank"
  rel="noopener">`로 클릭 가능하게 — 표기만 하고 링크를 빼먹지 않는다.
  스타일은 accent 색 + 밑줄 계열로 링크임이 보이게.
- **인물·생물 figural**: SVG로 흉내내지 말고 `image-asset-builder`로 생성
  이미지를 만들어 크롭해 쓴다(`assets/sprites/`). 원+캡슐+선 조합(졸라맨) 금지.
- **부분 에셋 SVG**: 사물·소품 시각물은 `assets/manifest.json`에서 `reusable: true`
  SVG 검색 → 덱 디자인에 맞는지 판단해 재사용(필요하면 팔레트 변형 파일,
  `<img src="assets/svg/<slug>.svg">`, 서빙 URL 참조 — 번들 import 금지)
  → 없으면 `svg-asset-builder`로 생성. 쓴 뒤 manifest `contexts`에 기록. 씬의 부분 요소로 새 래스터
  이미지를 생성하지 않는다(생성 래스터는 image form 전체 화면 전용).

## 1. 덱 파일 저작

**`data/<그룹>/<과목>/<수업>/deck.tsx`** — 덱 소스는 레거시 HTML 덱과 같은
data/ 구조에 둔다 (콘텐츠는 data, 프레임워크는 src). 엔진/컴포넌트는
`../../../src/deck/…`, `../../../src/components/…`로 import.
기존 예시: `data/dev/테스트 수업 자료/클로드코드-웹앱덱/deck.tsx`,
`data/dev/테스트 수업 자료/파이썬-조건문-웹앱덱/deck.tsx`(커스텀 SVG 시각화 포함).
컴포넌트 카탈로그는 `?deck=demo`로 실행해 눈으로 확인.

**씬(타임라인) 덱**: 정적 나열이 아닌 모션 씬은 `src/scene`의
`Scene`/`useSceneTime`/`interpolate`/`spring`/`riseIn`으로 저작 —
모든 모션은 t(초)의 순수 함수(Remotion/newVideoGen 원칙), 썸네일에서는
freeze 상태로 정지된다. 패턴 예시: `data/dev/테스트 수업 자료/씬-데모/deck.tsx`
(`?deck=scene-demo`). **씬 저작 전 `.claude/rules/scene-grammar.md` 필독**
— Lazy Defaults·씬당 고유 메타포·레이아웃 계약(zone/z-order/헤드라인
keep-all/화살표 앵커)·픽셀 검수 프로토콜.

**디오라마(diorama) 슬라이드**: 사건·여정·역사·줄거리처럼 "누가 무엇을
했는가"가 뼈대인 장은 `diorama-deck-builder` 스킬로 — 생성 무대 배경 위에
크롭 캐릭터 스프라이트를 세우고 라벨·말풍선·스탬프를 얹는다(`src/diorama`).
자산은 `image-asset-builder`가 먼저 만든다. 레퍼런스: `?deck=diorama-demo`.

**그림 문법 슬라이드**: 한 장의 성격에 맞는 시각 문법 스킬이 따로 있다 —
`whiteboard-deck-builder`(한 획씩 그려지는 판서 · `src/whiteboard`),
`vox-collage-deck-builder`(넓은 종이 세계 + 카메라 여행 · `src/vox`),
`watercolor-deck-builder`(붓이 차오르는 wash · `src/watercolor`).
레퍼런스: `?deck=whiteboard-demo` · `?deck=vox-demo` · `?deck=watercolor-demo`.
**한 덱에 두 문법을 섞지 마라** — 스타일 계열은 덱당 하나다.

**절차 시연(walkthrough) 슬라이드**: 소프트웨어 절차(사이트 조작·설치·CLI·
앱 사용법)를 다루는 장은 `software-walkthrough-builder` 스킬로 — 창 목업 +
포인터 + 타이핑을 `src/walkthrough` 역학 모듈로 조립한다. 레퍼런스:
`?deck=claude-code-guide#7`(3창 릴레이)·`#9`(2창 왕복).

## 2. registry 등록 — `src/decks/registry.tsx`

```ts
{
  id: '<id>',                       // 파일명과 일치, URL ?deck=<id>
  title, kicker, description,
  slides: <장수>,                   // quiz.json 'last' 해석에도 쓰임
  favicon: '<이모지>', accent: '#…',
  theme: { '--bg': …, '--primary': …, '--accent': …, '--accent-ink': …,
           '--bg-grad-1': …, '--bg-grad-2': …, '--glow': … },
  subject: '<pages.json subjects[].name과 일치>',  // 허브 과목 섹션 병합용
  tags: ['…'],                      // 허브 검색·칩
  quizJson: 'data/<그룹>/<과목>/<수업>/quiz.json',  // 라이브 문항 있을 때만 — QUIZ 배지 조건
  Component: <임포트한 덱>,
}
```

## 3. pages.json 등록 (허브·교사 콘솔·레거시 허브 공용 레지스트리)

해당 과목 `pages` 맨 앞에 추가. **path는 반드시 `index.html?deck=<id>`
형식** — 교사 콘솔의 덱 픽커·딥링크 프리필이 이 문자열과 정확히 일치해야
한다. React 허브는 이 항목을 registry 카드로 승격하므로 중복 표시되지
않는다. 저장은 `json.dump(..., ensure_ascii=False, indent=2)` 규약.

```json
{
  "title": "🐍 … (인터랙티브 웹앱)",
  "path": "index.html?deck=<id>",
  "emoji": "🐍", "description": "…",
  "tags": [{"label": "웹앱 덱", "color": "green"}],
  "gradient": "linear-gradient(90deg, …)",
  "live": true            // quizJson 있을 때만
}
```

## 4. 라이브 문항 (선택) — `<수업폴더>/quiz.json`

**deck.tsx 옆에 둔다** — 레거시 덱과 같은 자리, 같은 스키마(live-quiz-builder
스킬 참조). 네이티브 덱은 URL(`?deck=<id>`)에 폴더가 없으므로 registry의
`quizJson`에 그 경로를 적어야 콘솔·미니바가 문항을 찾는다.
`slide`는 0-based 인덱스 또는 `"last"`.
예시: `data/dev/테스트 수업 자료/파이썬-조건문-웹앱덱/quiz.json`.
발표 흐름: 교사 콘솔(live/host)에서 세션 생성 → "덱을 호스트 모드로 열기"
→ 덱 URL에 `&live=<코드>&host=1` → `src/live/LiveBridge.tsx`가 미니바 장착.
LiveBridge는 앱 런타임(`live/runtime/*`)을 번들 없이 서빙 URL에서 동적
import하므로 레거시 덱과 문자 그대로 같은 코드가 돈다 — live/runtime 수정
시 양쪽 모두에 반영된다.

## 5. 검증 (Definition of Done)

```bash
npx tsc --noEmit && npm run build          # 타입 + 프로덕션 빌드(정적 복사 포함)
npx vite --port 5199 --strictPort &        # dev 서버
node test/merge-smoke.mjs                  # 허브/덱/콘솔 스모크 (16 체크)
node test/live/native-bridge-e2e.mjs       # 라이브 브리지 E2E (RPC 스텁, 9 체크)
```

새 덱은 최소한: 허브 카드 노출(과목 섹션·웹앱 배지), `?deck=<id>#1` 진입,
키보드 내비게이션, (라이브 시) 미니바 장착과 문항 목록을 확인한다.

## 마무리 — 프롬프트 기록 (모든 덱·활동지 작업 공통)

작업을 끝내기 직전, 사용자가 이 자료를 위해 입력한 프롬프트를 자료 폴더의 `prompts.md`에
**전문 그대로** 덧붙인다. 형식과 제외 규칙은 `.claude/rules/prompt-log.md`. 최초 요청이면
머리글에 이 스킬 이름을 적는다 (`· /<스킬명>`). 첨부 이미지는 세션 id와 순번만.
