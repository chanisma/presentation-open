# Critter 스타일 가이드

화이트톤 미니멀 SVG 벡터 일러스트 + 아기자기한 플랫 동물 캐릭터.
`스팀/수학정보` (디지털 네트워크와 행렬, 17장)에서 처음 검증.

## 디자인 자산 위치

| 파일 | 위치 | 용도 |
|------|------|------|
| 디자인 프롬프트 | `스팀/slide_prompt_critter.txt` | NotebookLM 자료 2번 |
| 스타일 참조 이미지 | `스팀/slide_template_critter.png` | NotebookLM 자료 3번 |
| 참조 이미지 소스 | `스팀/_style_template_critter.html` | 재생성용 (Playwright 렌더) |

참조 이미지는 손으로 그린 SVG를 Playwright로 1600×900 @2x 스크린샷한 것이다.
스타일을 손보고 싶으면 HTML을 고친 뒤 아래로 다시 렌더한다:

```python
# playwright 필요 (설치돼 있음)
import asyncio, pathlib
from playwright.async_api import async_playwright
SRC = pathlib.Path(r"E:\presentation\스팀\_style_template_critter.html")
OUT = pathlib.Path(r"E:\presentation\스팀\slide_template_critter.png")
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width":1600,"height":900}, device_scale_factor=2)
        await pg.goto(SRC.as_uri()); await pg.wait_for_timeout(2500)
        await pg.screenshot(path=str(OUT), clip={"x":0,"y":0,"width":1600,"height":900})
        await b.close()
asyncio.run(main())
```

## 4색 팔레트 (이 네 개 외에는 쓰지 않는다)

| 역할 | 색상 | 용도 |
|------|------|------|
| 배경 | `#FDFDFB` | 오프화이트 종이. 텍스처·그라데이션 금지 |
| 틸 | `#3E9C93` | 주개념, 제목, 강조 도식 |
| 코랄 | `#E8705A` | 경고, 함정, 소외/고립 노드 |
| 머스터드 | `#E4B04A` | 하이라이트, 허브, 정답 강조 |
| 슬레이트 네이비 | `#33415C` | 본문 텍스트, 행렬 숫자 |

**한 슬라이드에 액센트 3색 이상 쓰지 않는다.** 흰 여백을 크게 남긴다.

## 동물 캐릭터 규칙 (핵심 — 이걸 안 지키면 유치해진다)

instruction과 프롬프트에 반드시 수치로 못 박는다:

- 슬라이드당 **최대 2마리**
- 각 캐릭터 높이는 슬라이드 높이의 **15% 이하**
- **여백에만 배치**. 본문·행렬 칸·도식 위에 절대 겹치지 않음
- 중앙 주인공으로 세우지 않음. 곁에서 지켜보는 조연
- 말풍선은 짧게, 도식을 가리지 않게
- 네트워크 그래프의 노드로는 동물을 써도 좋다 (작고 균등하게)

캐릭터가 인물을 대표할 때는 **이름–동물–색을 표로 고정**하고 instruction에 넣는다.
17장 내내 같은 인물이 같은 동물로 나와야 학생이 추적할 수 있다.

## NotebookLM Instruction (반복 사용)

```
디자인_프롬프트.txt와 스타일_참조.png에 묘사된 화이트톤 미니멀 SVG 벡터
일러스트 스타일(오프화이트 배경, 얇은 균일 선, 틸·코랄·머스터드·슬레이트네이비
4색만 절제 사용, 넓은 여백, 아기자기한 플랫 벡터 동물 캐릭터가 슬라이드당
최대 2마리만 여백에 작게 등장하며 절대 본문·행렬·도식을 가리지 않음)로
모든 슬라이드를 디자인해 주세요.
```

숫자·수식이 나오는 수업이면 다음 한 문장을 **반드시** 덧붙인다.
생성 모델은 표 안의 숫자를 그럴듯하게 지어내는 경향이 강하다:

```
행렬의 숫자는 수업계획서에 적힌 값을 한 글자도 바꾸지 말고 그대로 표기하세요.
```

## HTML 인프라 — 색상 변수

`index.html`(Deck Contract 미니멀 골격)의 `:root`에는 두 변수만 쓴다:

```css
:root{
  --paper:#FDFDFB;              /* 오프화이트 종이 (레터박스) */
  --dk-accent:#3E9C93;          /* Critter 틸 — deck.js 진행바 색 */
}
```

틸·코랄·머스터드·슬레이트네이비 4색 팔레트는 슬라이드 PNG 안의 정체성이자
pages.json gradient 소스다. 헤더/푸터 크롬 텍스트(ribbon·corner-note·index 패널)는
더 이상 만들지 않는다 — 기존 덱 유지보수 시에만 해당 덱의 index.html을 참조.

## HTML 차별화 요소

`references/html-template.md`의 골격에서 다음만 바꾼다:

| 위치 | Critter 값 |
|------|-----------|
| `<title>` | `<주제> — <시리즈 부제>` |
| `data-deck-title` | `<주제>` |
| `--paper` | `#FDFDFB` |
| `--dk-accent` | `#3E9C93` (Critter 틸) |

## pages.json gradient (Critter 시리즈)

시작 색은 `#3E9C93` (Critter 틸) 고정, 끝 색으로 수업을 구분:

```
수학 편 (행렬·네트워크)  teal → mustard  linear-gradient(90deg, #3E9C93, #E4B04A)
정보 편 (파이썬·시각화)  teal → coral    linear-gradient(90deg, #3E9C93, #E8705A)  ← 권장
데이터 분석             teal → navy     linear-gradient(90deg, #3E9C93, #33415C)  ← 권장
```

## tags 패턴

```json
"tags": [
  { "label": "<단원명>", "color": "purple" },
  { "label": "Critter", "color": "blue" },
  { "label": "수학×정보 융합", "color": "orange" }
]
```

## 적합 단원

- **융합 수업** — 두 교과의 개념을 부드럽게 잇는 톤
- 관계·네트워크·데이터를 다루는 단원 (노드를 동물로 의인화하면 직관적)
- 소외·포용처럼 **정서적 결이 있는 주제** — 화이트보드 마커의 딱딱함이 어울리지 않는 경우
- 중학생·고1 등 저학년

흐름·분기·디버깅 중심이면 Whiteboard, 추상 이론·역사면 Etching이 여전히 낫다.
