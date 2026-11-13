---
name: asset-library
description: >-
  재활용 에셋 레지스트리(assets/manifest.json)를 관리하는 스킬 (newVideoGen
  vg-assets 이식). 에셋 스캔·시각 분석 태깅·검색 규약, 그리고 NotebookLM
  이미지 재사용의 스타일 보수 원칙을 담당. "에셋 정리", "에셋 태깅", "manifest
  갱신", "재사용할 이미지 찾아줘", "에셋 라이브러리", "쓸 수 있는 일러스트"
  등을 언급하거나, 덱 기획·저작 중 재사용 자산을 조사할 때 사용.
---

# Asset Library — 재활용 에셋 레지스트리 관리

`assets/manifest.json`이 단일 레지스트리. 원칙:
- **이미지(NotebookLM 등)는 원본 위치를 참조** — 수업 폴더에서 복사하지
  않는다 (레거시 재사용 단위는 자산, 소유는 원 수업).
- **생성 SVG는 `assets/svg/`에 저장** (svg-asset-builder가 생성·등록).
  **재사용 후보는 `reusable: true`(2세대 · `clean-hand-illustration` · 2026-09-29
  이후 생성)만이다.** 그 이전 SVG는 `reusable: false` — 쓰던 덱에서만 유지한다.
- **생성 래스터**(image-asset-builder)는 두 갈래: 무대 배경은 수업 폴더
  `images/stage-NN.png`에 두고 원본 위치를 참조, **배우 스프라이트는
  `assets/sprites/<세트명>/`**에 두어 여러 덱이 함께 쓴다. 등록은
  `register_images.mjs`가 하고 `kind`(stage|sprite)·`w`·`h`가 추가된다.

## manifest 항목 스키마

```json
{
  "file": "경로 (루트 기준)",
  "type": "svg | image",
  "origin": "generated | notebooklm | photo | external",
  "set": "NotebookLM 생성 세트명 (수업 폴더명) — 이미지에 필수",
  "style": "whiteboard | etching | watercolor-ghibli | ink-sketch | …",
  "tags": ["한국어+영어 5~10개 — 주제·감정·행동·개념"],
  "alt": "1줄 설명 (검색과 접근성 겸용)",
  "usedIn": ["사용된 덱 id/수업명"]
}
```

SVG(2세대)는 아래 필드를 더 갖는다 — 상세는 svg-asset-builder 5절.

```json
{
  "reusable": true,
  "created": "YYYY-MM-DD",
  "palette": { "ink": "#…", "…": "#…" },
  "anchors": "덱이 좌표를 맞출 지점 (배출구·인면 등)",
  "variantOf": "원본 slug (색·굵기 변형 파일일 때만)",
  "contexts": [
    { "deck": "덱 id", "slide": 6, "role": "장면에서 맡은 일", "metaphor": "살린 비유",
      "placement": "위치·크기", "adaptation": "무엇을 바꿨나", "background": "배경색" }
  ]
}
```

## 스캔·태깅 (refresh)

1. `data/*/images/slide-*.png`(NotebookLM 세트)와 `assets/svg/*.svg`를
   스캔해 manifest에 없는 파일을 빈 태그로 추가 (`tags: []` = 미태깅)
2. 미태깅 항목을 Read(멀티모달)로 **시각 분석**해 tags·alt 작성 —
   구체 키워드 + 추상 개념 + 감정/톤 혼합
3. `style`은 세트 단위로 동일하게 — 표지 1장만 보고 판정해도 됨
4. 새 NotebookLM 수업이 생기면 그 세트를 등록 (notebooklm-lesson-deck
   파이프라인 마지막에 이 스킬 호출 권장)

## 검색 규약 (planner·renderer가 사용)

재사용 후보 조사는 manifest의 tags·alt·style을 검색한다:
```bash
# 예: "비유" 관련 whiteboard 이미지 찾기
grep -n '비유\|주문\|요리' assets/manifest.json
```

## SVG 재사용 — 2세대만, 판단을 거쳐서 (2026-09-29 사용자 결정)

- 후보 조회: `type: "svg"` 이고 `reusable: true` 인 항목만 올린다.
- 그림 자체를 렌더해 보고 판단한다. `contexts`는 판단을 돕는 재료이지 조건이
  아니다 — 맥락이 달라도 그림만 보고 재사용할 수 있다.
- **그대로 붙이지 않는다.** 배경 명도·팔레트·표시 크기에서의 선 굵기·시점과
  밀도가 이 슬라이드 디자인과 맞는지 따지고, 안 맞으면 팔레트를 바꾼 변형 파일
  (`<slug>--<덱id>.svg`, `variantOf`)을 만들거나 새로 그린다.
- 재사용한 덱은 `usedIn`과 `contexts`에 자기 항목을 추가한다.

## ⚠ 이미지 재사용 보수 원칙 (스타일 톤 일치 — 절대 조건)

NotebookLM 이미지는 **내용이 맞아도 분위기가 다르면 재사용하지 않는다**
— 스타일이 섞이면 덱의 일관성이 무너진다 (사용자 피드백, 2026-07-19).

판단 순서:
0. **덱 자체의 분위기와 조화하는가 — 최상위 게이트.** set·style이 서로
   일치해도 **덱의 테마·톤과 충돌하면 재사용 금지**. 예: 다크 터미널 덱에
   밝은 흰 배경의 화이트보드 사진 → 세트가 통일돼 있어도 덱 일관성이
   깨진다 (2026-07-19 claude-code-guide 사례 — 잉크 스케치 SVG 저작으로
   교체). 이미지가 덱과 "같은 화면 언어"인지 먼저 묻는다.
1. **같은 set** (같은 수업에서 생성된 이미지) — 자유롭게 혼합 가능.
2. **같은 style** (whiteboard끼리, watercolor끼리) — 신중히 허용하되,
   선 굵기·팔레트·질감을 눈으로 비교해 이질감이 없을 때만.
3. **다른 style** — 재사용 금지. 대안: ① 해당 스타일로 신규 생성
   (notebooklm-lesson-deck) ② form 변경(scene/static) ③ svg-asset-builder로
   덱 스타일에 맞는 일러스트 직필 (0번 게이트에 걸릴 때도 이 대안).

한 덱의 image form은 **한 세트(이상적) 또는 한 스타일(허용)**로 통일한다.
plan.md 헤더의 재사용 자산 표기에 set·style을 명시할 것.

적용 범위 명확화:
- 이 보수 원칙의 대상은 **image form(풀블리드 일러스트 슬라이드)**이다.
  다른 수업 폴더의 세트라도 **한 덱에서 한 세트만** 쓰면 허용 — 반드시
  manifest `usedIn`에 기록.
- **부분 에셋은 별도 트랙**: 생성 SVG는 한 덱에서 같은 계열(2세대는
  `clean-hand-illustration` · 같은 잉크색)로 통일, 브랜드 로고는 원본 그대로(리컬러·변형 금지)만 허용.
  단, 부분 에셋도 덱 테마와 색이 충돌하면 넣지 않는다.
- 미태깅(tags 빈) 이미지는 내용을 모르는 상태 — **시각 확인 없이 재사용
  금지** (refresh로 태깅하거나 직접 Read 후 판단).
