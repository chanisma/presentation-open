# Etching 스타일 가이드

## 디자인 자산 위치

| 파일 | 위치 | 용도 |
|------|------|------|
| 디자인 프롬프트 | `data/2026-1/정보/slide_prompt_etching.txt` | NotebookLM 자료 2번 |
| 스타일 참조 이미지 | `data/2026-1/정보/slide_template_etching.png` | NotebookLM 자료 3번 |

## NotebookLM Instruction (반복 사용)

```
디자인_프롬프트.txt와 스타일_참조.png에 묘사된 에칭 잉크화 스타일
(크림색 종이 #F7F7F4 배경, 얇은 검정 잉크 펜선, 가벼운 회색 워시 한 톤,
검정 채움 없음, 색채 없음, 자신감 있고 약간 흔들리는 손그림 선)로
모든 슬라이드를 디자인해 주세요.
```

## HTML 인프라 — 색상 변수

`index.html`(Deck Contract 미니멀 골격)의 `:root`에는 두 변수만 쓴다:

```css
:root{
  --paper:#F7F7F4;          /* 따뜻한 크림 페이퍼 (레터박스) */
  --dk-accent:#1F1F1F;      /* 잉크 검정 — deck.js 진행바 색 (모노톤) */
}
```

헤더/푸터 크롬 텍스트(ribbon·corner-note·index 패널)는 더 이상 만들지 않는다 —
기존 덱 유지보수 시에만 해당 덱의 index.html을 참조.

## HTML 차별화 요소

| 위치 | Etching 값 | 비고 |
|------|-----------|------|
| `<title>` | `<주제> — 고등학생 입문` | "파이썬" 빠뜨리지 않기 |
| `data-deck-title` | `<주제>` | |
| `--paper` | `#F7F7F4` | 크림 페이퍼 |
| `--dk-accent` | `#1F1F1F` (잉크 검정) | 모노톤 정체성 |

## pages.json gradient (Etching 시리즈)

Etching 시리즈는 단일 그라데이션을 공유한다 (모노톤 정체성):

```
모든 Etching 수업: linear-gradient(90deg, #1F1F1F, #5C5853)
```

이미 등록된 `변수와 함수`, `입력함수`, `자료형과연산자`가 모두 같은 gradient를 쓴다.

## tags 패턴

```json
"tags": [
  { "label": "<단원 영문/한글>", "color": "purple" },
  { "label": "Etching", "color": "blue" },
  { "label": "입문자용", "color": "orange" }
]
```

## 적합 단원

추상 개념·이론·역사·우아한 시각화가 필요한 단원에 효과적:
- 변수, 자료형, 입력함수, AI 원리, 알고리즘 역사, 디자인 패턴

흐름·결정·디버깅 강조 단원(조건문, 반복문)은 Whiteboard가 더 어울림.

## 페이지 수 권장

에칭 스타일은 더 우아한 톤이라 14~21페이지로 여유롭게 가도 부담스럽지 않다 (변수와 함수 21장, 자료형과연산자 24장 등).
