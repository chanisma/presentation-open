---
name: watercolor-deck-builder
description: >-
  완성된 그림을 한 번에 띄우지 않고 붓이 지나가며 색면이 차오르는 수채화 wash
  덱을 저작하는 스킬 (newVideoGen /vg-watercolor-motion의 슬라이드덱 이식).
  "수채화", "물감 번지는", "붓으로 그려지는", "watercolor", "감성적인 도입",
  "정서적인 마무리", "성찰 슬라이드", "잔잔한 분위기" 등을 언급하거나, 정서·
  성찰·서정이 주인공인 도입/마무리 슬라이드를 만들 때 사용. React 덱 전용.
---

# Watercolor Deck Builder — 붓이 지나가며 차오르는 wash 덱

> **한 줄 정의**: 연필이 *선을 긋는다*면 수채화는 *색면을 적신다*. 빈 종이에서 붓이
> 쓸고 지나간 자리마다 색이 번지며 그림이 차오르고, 젖은 붓 커서가 그 끝을 따라간다.
> **검은 윤곽선이 없는 것**이 이 문법의 정체성이다 — 색면이 곧 형태다.

- **매체**: 네이티브 React 덱 전용 (`form: watercolor` 슬라이드).
- **용도**: 정보 밀도가 아니라 **정서**가 주인공인 장 — 수업의 도입 훅, 마무리 성찰,
  단원 사이의 숨 고르기. 정보를 나열해야 하는 장에는 쓰지 마라.
- **potrace 없이**: 원본은 이미지를 벡터화해 붓 경로를 뽑았지만, 이 저장소에는 potrace가
  없다. 대신 **붓질 밴드를 절차적으로 생성**해 마스크를 만든다(위→아래·좌→우·대각).
  결과적으로 사람이 종이를 적시는 순서와 같아진다.

## 언제 이 스킬인가

| 상황 | 스킬 |
|---|---|
| 정서·성찰·여백이 주인공 (도입 훅·마무리) | **watercolor** |
| 사건·인물이 있는 서사 | `diorama-deck-builder` |
| 개념을 쌓아 설명 | `whiteboard-deck-builder` |
| 관계를 넓게 펼쳐 훑기 | `vox-collage-deck-builder` |
| 일러스트를 그냥 크게 보여주기 | image form (`composite-deck-builder`) |

판별 한 줄: **"이 장은 학생을 잠깐 멈춰 세우려는 장인가?"** — 그렇다면 watercolor.

## 러닝타임 — `src/watercolor` (import: `../../../../src/watercolor`)

| export | 역할 |
|---|---|
| `<Paper bg grain>` | 수채화지 배경 + 미세한 종이 결 (명조·펜 폰트 지연 로드) |
| `<WashReveal src at dur bands dir brushWidth bleed roughness seed finish brush brushSrc>` | **핵심** — 붓질 밴드 마스크로 이미지가 차오른다 |
| `<ColorWash x y r color at dur opacity>` | 물감 한 방울이 번지듯 퍼지는 색면 강조 (multiply) |
| `<WashText at dur>` | 흐릿하게 배어 나와 또렷해지는 글자 |
| `<InkLine x1 y1 x2 y2 at>` | 여백을 가르는 가는 펜 선 한 획 |
| `PAPER` · `PAPER_DEEP` · `WASH_INK` | 종이·잉크 토큰 |

`WashReveal` 파라미터 감각:

| prop | 기본 | 감각 |
|---|---|---|
| `bands` | 7 | 적을수록 큰 붓(6~8 권장). 12를 넘으면 프린터처럼 보인다 |
| `dir` | down | down / right / diag — **슬라이드마다 바꿔** 리듬을 만든다 |
| `brushWidth` | 210 | 1080 좌표계 기준. 200~240이 "큰 붓". 120 이하면 선처럼 보인다 |
| `bleed` | 7 | 젖은 번짐. 10을 넘으면 뭉갠다 |
| `roughness` | 26 | 붓 가장자리 거칠기. 40+는 지저분 |
| `dur` | 4.5 | 4.5~5.5초. 3초 미만이면 "차오르는" 맛이 사라진다 |

## 파이프라인

### Phase 0 — 장면 설계

정서 한 줄과 시각 한 장면. 슬라이드당 이미지는 **1장**, 텍스트는 **3줄 이내**.

```
- slide 1 | form: watercolor
  image: 아침 방 (scene-01) | wash: down · 7밴드 · 5.2s
  intent: 하루의 첫 선택을 누가 했는지 묻는다
  text: 07:10 / 눈을 뜨자마자 손이 먼저 움직인다 / 한 줄 리드
```

게이트: wash 방향이 3연속 같지 않을 것 · 텍스트는 그림의 **여백 위**에만 ·
한 덱은 한 세트(같은 스타일 앵커)로 통일.

### Phase 1 — 자산 (`image-asset-builder`)

수채화 이미지는 **크롭하지 않는다** — 화면 전체를 채우는 무대다. 수업 폴더
`images/scene-NN.png`에 1920×1080으로. 첫 장을 앵커로 확정하고 나머지는 `--ref`로.

```
수채화 wet-on-wet wash — 검은 윤곽선 없음, 번지는 가장자리, 물감 고인 자국,
차분한 제한 팔레트, 종이 여백을 넉넉히, 과채도·플랫 디지털·사진 실사 금지
```

**여백이 있는 구도**를 반드시 요청한다 — 텍스트가 앉을 자리이자 수채화의 문법이다.

### Phase 2 — 슬라이드 저작

```tsx
<Paper>
  <WashReveal src={`${IMG}/scene-01.png`} at={0.2} dur={5.2} bands={7} dir="down" />
  <Band at={4.6}>
    <WashText at={4.6}>
      <h1 style={serif}>눈을 뜨자마자 손이 먼저 움직인다</h1>
    </WashText>
  </Band>
</Paper>
```

- **텍스트는 wash가 끝날 무렵**(`dur * 0.9`)에 등장시킨다. 그림이 차오르는 동안 글자가
  먼저 나오면 시선이 갈린다.
- 글자 뒤 스크림은 **하드 사각형 금지** — `radial-gradient`로 가장자리를 푼 종이 워시로.
  수채화 위의 직각 상자는 이질적이다(검수에서 걸린 항목).
- 서체는 **명조**(Nanum Myeongjo) — 산세리프는 이 톤과 충돌한다.
- `freezeAt`은 wash 완료 직후로. 썸네일이 완성된 그림이 된다.
- 그림 없는 **여백 슬라이드**를 하나 두면 리듬이 산다(`ColorWash` + 문장 + `Build` 질문).

### Phase 3 — 검증 (BLOCKING)

```bash
npx tsc --noEmit
node .claude/skills/diorama-deck-builder/scripts/capture_diorama.mjs <deckId> <슬라이드> 2.2,6 tmp/wc-shots
```

**차오르는 중 시각을 반드시 캡처**한다(예: dur의 40%) — 밴드가 실제로 자라는지, 붓
커서가 붓끝에 있는지는 완성 프레임으로 볼 수 없다. 완성 시각에서는 글자 가독성과
여백을 본다.

## 절대 금지

1. **완성 이미지를 한 번에 띄우기** — 그건 image form이다. 이 스킬의 정체성은 차오름
2. **검은 윤곽선 / 플랫 디지털 / 사진 실사** — 생성 프롬프트에서 막는다
3. **풀스크린 채움** — 종이 여백이 이 문법의 절반이다
4. **텍스트 3줄 초과 / 산세리프 본문** — 정보 슬라이드로 변질된다
5. **하드 사각형 스크림** — 가장자리를 푼 워시로
6. **밴드 12개 이상 / brushWidth 120 이하** — 붓이 아니라 프린터가 된다
7. **한 덱에 다른 스타일 세트 혼용** — 수채화와 두들·콜라주를 섞지 마라 (덱당 택1)

## 관련 파일

- 씬 저작 공통 규칙: `.claude/rules/scene-grammar.md`
- 역학 모듈: `src/watercolor/index.tsx`
- 자산 파이프라인: `image-asset-builder` 스킬
- 레퍼런스 덱: `data/dev/테스트 수업 자료/수채화-샘플/deck.tsx` (`?deck=watercolor-demo`)
- 원본: newVideoGen `.claude/skills/vg-watercolor-motion/SKILL.md`
  (형제 스킬 vg-sketch-motion의 연필 버전은 이식하지 않았다 — 필요해지면 같은 구조에
  `WashReveal`의 붓을 가는 펜으로 바꾸는 형태로 확장할 것)
