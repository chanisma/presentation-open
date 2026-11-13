# Whiteboard 스타일 가이드

## 디자인 자산 위치

| 파일 | 위치 | 용도 |
|------|------|------|
| 디자인 프롬프트 | `data/2026-1/정보/slide_prompt_whiteboard.txt` | NotebookLM 자료 2번 |
| 스타일 참조 이미지 | `data/2026-1/정보/slide_template_whiteboard.png` | NotebookLM 자료 3번 |

NotebookLM에 자료 업로드 시 위 두 파일을 `_notebooklm_sources/02_디자인_프롬프트.txt`, `_notebooklm_sources/03_스타일_참조.png`로 복사해 넣는다.

## NotebookLM Instruction (반복 사용)

다음 문구를 instruction에 그대로 포함하면 화이트보드 스타일이 충실히 적용된다:

```
디자인_프롬프트.txt와 스타일_참조.png에 묘사된 화이트보드 손글씨 마커 스타일
(검정/파랑/빨강/초록 마커, 손그림 결정 마름모, 화살표, 경고 표지판,
사람·동물·컴퓨터 손그림)로 모든 슬라이드를 디자인해 주세요.
```

## HTML 인프라 — 색상 변수

`index.html`(Deck Contract 미니멀 골격)의 `:root`에는 두 변수만 쓴다:

```css
:root{
  --paper:#F4F5F6;          /* 차가운 chalk-white 배경 (레터박스) */
  --dk-accent:#1E5BD0;      /* 파란 마커 — deck.js 진행바 색 */
}
```

마커 3색(파랑 `#1E5BD0` · 빨강 `#D6263A` · 초록 `#1B9E4B`)은 슬라이드 PNG 안의
정체성이자 pages.json gradient 소스다. 헤더/푸터 크롬 텍스트(ribbon·corner-note·index
패널)는 더 이상 만들지 않는다 — 기존 덱 유지보수 시에만 해당 덱의 index.html을 참조.

## HTML 차별화 요소 (Etching과 다른 부분)

`references/html-template.md`의 골격에서 다음만 바꾼다:

| 위치 | Whiteboard 값 |
|------|--------------|
| `<title>` | `<주제> — 고등학생 파이썬 입문` |
| `data-deck-title` | `<주제>` |
| `--paper` | `#F4F5F6` |
| `--dk-accent` | `#1E5BD0` (마커 블루) |

## pages.json gradient (Whiteboard 시리즈)

각 수업마다 고유 그라데이션으로 시리즈 안에서도 구분:

```
조건문   blue → red    linear-gradient(90deg, #1E5BD0, #D6263A)
반복문   blue → green  linear-gradient(90deg, #1E5BD0, #1B9E4B)
함수     blue → purple linear-gradient(90deg, #1E5BD0, #7C3AED)  ← 권장
리스트   blue → orange linear-gradient(90deg, #1E5BD0, #F59E0B)  ← 권장
딕셔너리 red → green   linear-gradient(90deg, #D6263A, #1B9E4B)  ← 권장
```

핵심 시작 색은 `#1E5BD0` (Whiteboard 마커 블루) 고정, 끝 색만 단원의 인상에 따라 변경.

## tags 패턴

```json
"tags": [
  { "label": "<단원 영문/한글>", "color": "purple" },  /* 단원명 */
  { "label": "Whiteboard", "color": "blue" },          /* 시리즈 */
  { "label": "입문자용", "color": "orange" }            /* 난이도 */
]
```

`Whiteboard` 태그는 시리즈 식별용으로 항상 포함한다.

## 적합 단원

흐름·결정·분기·실수 회피가 핵심인 단원에 효과적:
- 조건문, 반복문, 함수 호출 흐름, 알고리즘 단계, 디버깅, 객체지향 클래스 다이어그램

추상 개념·이론(자료형, 변수 개념, AI 원리)은 Etching이 더 어울림.
