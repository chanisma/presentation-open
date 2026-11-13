---
name: composite-deck-builder
description: >-
  deck.json 매니페스트만으로 혼합 덱을 엮는 컴포지트 덱 저작 스킬.
  "컴포지트 덱", "composite 덱", "deck.json으로 만들어줘", "JSON으로 수업 엮어줘",
  "이미지로 덱 엮어줘", "○○ 수업 이미지 재사용해서 덱", "매니페스트 덱" 등을
  언급하거나, 코드 배포 없이 타이틀·NotebookLM 이미지(KenBurns)·불릿을
  시퀀싱한 덱을 만들 때 사용. 레거시 재사용의 단위는 페이지가 아니라
  자산(이미지)이라는 원칙을 따른다.
---

# 컴포지트 덱 저작 (deck.json 매니페스트)

`?composite=<data/…/deck.json>` 라우트가 매니페스트를 fetch해 bolt 덱으로
확장한다 (`src/composite/CompositeDeck.tsx`). **deck.tsx도 registry 등록도
없다** — JSON 파일 하나와 pages.json 등록이 전부.

## 0. 계획 선행 (선택)

소재만 있고 구성이 없다면 `lesson-deck-planner`로 `plan.md`를 먼저 만든다.
plan.md가 있으면 헤더+슬라이드 블록을 deck.json segments로 기계 변환한다
(title/images/bullets 대응, live 블록은 quiz.json으로).

## 1. 소재 파악

- 재사용할 이미지: NotebookLM 수업 폴더의 `images/slide-NN.png` (01부터
  2자리 패딩). `ls "data/<그룹>/<과목>/<수업>/images"`로 장수·번호 확인.
- 이미지에 구워진 텍스트가 많은 장은 캡션과 충돌한다 — 캡션을 `null`로
  두거나(순수 전면) 텍스트가 적은 장을 고른다.

## 2. deck.json 저작 — `data/<그룹>/<과목>/<수업>/deck.json`

스키마 전체는 `src/composite/CompositeDeck.tsx` 상단 주석이 원전.
예시: `data/dev/테스트 수업 자료/컴포지트-데모/deck.json`.

```json
{
  "title": "탭 제목", "favicon": "🧩",
  "theme": { "--bg": "…", "--primary": "…", "--accent": "…", "--accent-ink": "…" },
  "segments": [
    { "type": "title", "kicker": "…", "title": "…", "lead": "…", "nav": "타이틀", "notes": "…" },
    { "type": "images", "src": "images", "pages": [1, 2, 4],
      "captions": [ { "kicker": "…", "title": "…", "body": "…" }, { "title": "…" }, null ],
      "nav": "일러스트", "notes": "…" },
    { "type": "bullets", "kicker": "…", "title": "…", "items": ["…", "…"], "nav": "정리" },
    { "type": "html", "src": "활동지.html", "nav": "활동지" }
  ]
}
```

규칙:
- **경로는 전부 매니페스트 파일 기준 상대** — 다른 수업 폴더 참조는
  `"src": "../../정보/<수업>/images"` 식. 루트 기준 절대 경로 아님에 주의.
- `images`는 쪽당 슬라이드 1장으로 전개, `captions`는 `pages`와 인덱스 짝
  (`null` = 캡션 없는 전면 이미지). KenBurns 줌·팬과 flip 교차는 자동.
- `html` 세그먼트는 활동지 등 니치용만 — 레거시 덱 페이지 임베드를
  기본 세그먼트로 권하지 않는다(재사용 단위는 자산).
- 텍스트 줄바꿈(keep-all)·헤드라인 정렬은 컴포넌트가 처리하므로 JSON은
  내용만 신경 쓴다.

## 3. pages.json 등록

해당 과목 `pages`에 추가 — path는 반드시 `index.html?composite=<경로>`:

```json
{
  "title": "🧩 …",
  "path": "index.html?composite=data/<그룹>/<과목>/<수업>/deck.json",
  "emoji": "🧩", "description": "…",
  "tags": [{"label": "컴포지트", "color": "green"}],
  "gradient": "linear-gradient(90deg, …)",
  "type": "deck"
}
```

## 4. 라이브 문항 (선택)

매니페스트 **옆**에 `quiz.json` (레거시 덱과 동일 스키마 — live-quiz-builder
스킬). `slide`는 확장된 최종 쪽 인덱스(0-based) 기준 — 타이틀 1장 +
images 3장이면 불릿 쪽은 4. 발표는 `…&live=<코드>&host=1`.

## 5. 검증 (Definition of Done)

코드 변경이 없으므로 tsc/build는 불필요. dev 서버(5199)에서:

1. `/?composite=<경로>#1` 로드 — 탭 제목·테마 확인
2. `g`(그리드)로 총 쪽수 = 기대 쪽수 (엔진은 활성 슬라이드만 DOM에 올리므로
   `.slide` 카운트가 아니라 그리드 `.noir-thumb` 수로 센다)
3. 이미지 쪽 실제 로드(깨진 경로는 검은 화면) + 캡션 가독성 스크린샷 검수
4. `node test/composite-e2e.mjs` (데모 회귀) — 컴포넌트를 고쳤을 때만

## 마무리 — 프롬프트 기록 (모든 덱·활동지 작업 공통)

작업을 끝내기 직전, 사용자가 이 자료를 위해 입력한 프롬프트를 자료 폴더의 `prompts.md`에
**전문 그대로** 덧붙인다. 형식과 제외 규칙은 `.claude/rules/prompt-log.md`. 최초 요청이면
머리글에 이 스킬 이름을 적는다 (`· /<스킬명>`). 첨부 이미지는 세션 id와 순번만.
