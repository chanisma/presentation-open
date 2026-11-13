---
name: whiteboard-deck-builder
description: >-
  화이트보드에 마커로 "한 획씩 그려지는" 두들 덱을 저작하는 스킬 (newVideoGen
  /vg-whiteboard rough-kit의 슬라이드덱 이식). 손그림 도형·픽토그램·손글씨가
  순서대로 그려지고 쓰는 손이 획 끝을 따라가며, 생성 스티커는 스케치 리빌로
  등장한다. "화이트보드", "손으로 그려지는", "칠판처럼", "두들", "그려가며
  설명", "판서", "스케치 노트", "rough 스타일" 등을 언급하거나, 개념을 차근차근
  쌓아 설명하는 수업(정의·분해·비교·절차 개념)을 만들 때 사용. React 덱 전용.
---

# Whiteboard Deck Builder — 한 획씩 그려지는 두들 덱

> **한 줄 정의**: 완성된 그림을 띄우는 것이 아니라, 교사가 판서하듯 **선이 하나씩
> 그어지는** 화면이다. 그리는 순서가 곧 설명의 순서다. 손이 마커를 쥐고 획 끝을
> 따라가고, 손글씨는 글자 단위로 등장하며, 빨강은 오직 주석에만 쓴다.

- **매체**: 네이티브 React 덱 전용 (`react-deck-builder` 안의 `form: whiteboard` 슬라이드).
- **의존성 0**: rough.js를 들이지 않고 같은 원리(시드 지터 + 2패스)의 결정론 손그림
  경로 생성기를 `src/whiteboard`에 내장했다. `Math.random` 없음 — 같은 시드, 같은 선.
- **표현 층 해방**: 킷은 인프라(타임라인·손·폰트·픽토그램)만 준다. 구도와 메타포는
  슬라이드마다 새로 발명한다. 공용 "씬 템플릿"을 만들지 마라.

## 언제 이 스킬인가

| 상황 | 스킬 |
|---|---|
| 개념을 **차근차근 쌓아** 설명 (정의·분해·비교·조건) | **whiteboard** |
| 사건·여정·인물이 있는 서사 | `diorama-deck-builder` |
| 관계망을 넓게 펼쳐 훑기 | `vox-collage-deck-builder` |
| 정서·성찰·여백 | `watercolor-deck-builder` |
| 소프트웨어 절차 | `software-walkthrough-builder` |

판별 한 줄: **"칠판에 그려가며 설명할 수 있는 내용인가?"** — 그렇다면 whiteboard다.

## 러닝타임 — `src/whiteboard` (import: `../../../../src/whiteboard`)

좌표는 `<Board>`의 **1600×900 SVG 단위**(px처럼 쓴다). 선언 순서 = z-order,
`at` 순서 = 그려지는 순서.

| export | 역할 |
|---|---|
| `<Board vb bg hand handSrc handTip>` | 종이 판 + 좌표계 + **쓰는 손 자동 추적**(활성 획 끝) |
| `<Draw d at dur color width fill fillAt>` | 획을 긋는다. `d`는 path 문자열 또는 배열(순서대로) |
| `<Write x y at cps size font bold anchor>` | 손글씨 — 글자 단위 등장 + 글자별 결정론 지터 |
| `<Sticker src x y w h at dur>` | 생성 스티커 — **스케치 리빌**(톱니 경계가 아래로 쓸린다) |
| `<Pop cx cy at>` · `<Free at dur>{p=>…}</Free>` | 임의 SVG를 백오버슈트/진행률로 |
| `<Caption at cps y>` | 하단 알약 한 줄 — 그 장의 결론 문장 |
| `line rect rrect ellipse poly` | 손그림 경로 생성기 (seed 인자 필수) |
| `pict.*` | 픽토그램 알파벳 — browser·docFile·cylinder·thought·speech·check·cross·circleAround·underline·zigzag·burst·arrow·curveArrow |
| `INK PAPER BLUE BLUE_LINE RED TAN MINT GRAY` | 하우스 팔레트 |

폰트(Gaegu·Caveat)는 `<Board>`가 첫 사용 시 지연 로드한다 — index.html 수정 불필요.

## 하우스 팔레트 (이 밖의 색 자제)

`INK #1a1a1a` 선 · `PAPER #f6f5f0` 판 · `BLUE #dceaf7` 패널 채색 · `TAN #f6e3c9` ·
`MINT #d9f2df` · `GRAY #9a958c` 비활성 · **`RED #cc2936`은 주석·강조 전용**
(빨간 원·밑줄·취소선·스우시·짧은 빨간 손글씨).

## 파이프라인

### Phase 0 — 판서 대본 (코드 작성 금지 단계)

plan.md에 슬라이드마다 "무엇을 어떤 순서로 그릴지"를 적는다:

```
- slide 2 | form: whiteboard
  intent: 알고리즘의 단계는 사람마다 다르게 읽히면 안 된다
  draw order: 제목 → 레시피 카드(스티커) → 화살표 → 손글씨 3단계 → 스톱워치(스티커)
              → 빨간 원 + 빨간 손글씨 주석 → 캡션
  sticker: recipe-card, stopwatch
  red: circleAround + "3분처럼 애매하지 않게"
```

게이트: **슬라이드당 스티커 ≥ 1**(rough 기하만으로 채운 장 금지) · 빨강은 1~2개 ·
같은 구도 3연속 금지 · 그리는 순서가 설명 순서와 일치.

### Phase 1 — 자산 (`image-asset-builder`)

스티커 시트는 **배경을 종이색 `#F6F5F0`으로**, 굵은 검은 윤곽선 + 절제된 채색으로
생성한다(스타일 가이드는 아래). 크롭 후 `assets/sprites/<세트>/`에 등록.

```
화이트보드 마커 두들 — 배경은 균일한 #F6F5F0, 굵고 균일한 검은 잉크 윤곽선,
채색은 연한 파랑·탄·민트만 평평하게, 빨강은 강조에만, 입체 음영·3D·사진 느낌 금지
```

인물은 **반드시 생성 스티커**로 (원+막대 졸라맨 금지 — scene-grammar §17).
쓰는 손은 이미 `assets/sprites/화이트보드-키트/wb-write-hand.png`에 있다(재사용).

### Phase 2 — 슬라이드 저작

```tsx
<Slide full nav="① 단계">
  <Scene freezeAt={7.6}>
    <Board handSrc={HAND}>
      <Write x={120} y={125} at={0.1} size={62} bold>① 단계가 분명해야 한다</Write>
      <Sticker src={`${SPR}/wb-recipe-card.png`} x={130} y={250} w={430} h={430 / 1.195} at={0.9} />
      <Draw d={pict.arrow(590, 420, 700, 350, 83)} at={2.0} dur={0.5} color={GRAY} />
      <Write x={720} y={330} at={2.4} size={46}>1. 물 550mL를 끓인다</Write>
      <Draw d={pict.circleAround(1330, 600, 150, 165, 97)} at={5.6} color={RED} />
      <Caption at={6.9}>사람마다 다르게 읽히면 알고리즘이 아니다</Caption>
    </Board>
  </Scene>
</Slide>
```

- **at 간격 0.4~0.9초**. 획이 겹쳐 시작하면 "그려지는 중"이 안 읽힌다.
- 스티커 h는 반드시 **크롭 원본 비율**로 계산(`w / ar`) — 찌그러지면 손그림 톤이 깨진다.
- 총 길이 6~9초. `freezeAt`은 마지막 획이 끝나는 시각(썸네일 = 완성된 판서).
- 정리·정의는 `<Build>` HTML 오버레이로 — Board(SVG) 바깥에 형제로 둔다.

### Phase 3 — 검증 (BLOCKING)

```bash
npx tsc --noEmit
npm run dev -- --port 5199
node .claude/skills/diorama-deck-builder/scripts/capture_diorama.mjs <deckId> <슬라이드> 1.5,3.2,c,7 tmp/wb-shots
```

**그리는 중 시각을 반드시 하나 이상 캡처**한다(예: 3.2초) — 손이 획 끝에 붙어 있는지,
획이 실제로 자라는지는 완성 프레임으로 볼 수 없다. 그리고 완성 시각에서 겹침·잘림 확인.

### Phase 4 — 등록

`src/decks/registry.tsx` + `pages.json`. 테마는 종이 배경(`--bg: #f6f5f0`)과 잉크
글자(`--fg: #1a1a1a`)로 — 다크 테마 위에 종이 판을 얹으면 크롬과 충돌한다.

## 절대 금지

1. **졸라맨** — 원 머리 + 막대 팔다리. 인물은 생성 스티커로만
2. **스티커 0개 슬라이드** — rough 기하만으로 채우지 마라 (rough는 관계·주석 담당)
3. **완성본 팝인** — 스티커도 도형도 "그려지듯" 등장한다 (`Sticker`는 스케치 리빌 기본)
4. **빨강 남발** — 주석·강조 전용. 본문 선·채색에 쓰지 마라
5. **seed 누락** — 모든 rough 호출에 시드를 준다 (결정론)
6. **이미지 안 텍스트** — 라벨은 `<Write>`로. 시트 프롬프트에 "no text" 강제
7. **하단 0~7% 침범** — 덱 크롬이 지나간다. `Caption` 기본 y=800이 안전선
8. **같은 구도 반복** — 3연속 같은 배치면 멈추고 재설계

## 관련 파일

- 문법 상세·좌표·수치: `references/whiteboard-grammar.md` (저작 전 필독)
- 씬 저작 공통 규칙: `.claude/rules/scene-grammar.md`
- 역학 모듈: `src/whiteboard/index.tsx`
- 자산 파이프라인: `image-asset-builder` 스킬
- 레퍼런스 덱: `data/dev/테스트 수업 자료/화이트보드-샘플/deck.tsx` (`?deck=whiteboard-demo`)
- 원본: newVideoGen `.claude/skills/vg-whiteboard/SKILL.md`
