---
name: diorama-deck-builder
description: >-
  생성 배경(무대) 위에서 만화체 캐릭터 스프라이트가 입장·연기·퇴장하고 말풍선·
  손글씨·라벨·스탬프가 얹히는 "디오라마" 스토리텔링 덱을 저작하는 스킬
  (newVideoGen /vg-diorama 문법의 슬라이드덱 이식). "디오라마", "그럴리있다
  스타일", "무대 위 캐릭터", "이야기로 풀어줘", "스토리텔링 덱", "만화처럼",
  "캐릭터가 나오는 수업 자료", "역사·줄거리 요약" 등을 언급하거나, 사건·여정·
  역사·서사가 개념의 뼈대인 수업을 만들 때 사용. React 덱 전용.
---

# Diorama Deck Builder — 무대·배우·오버레이 3층 스토리텔링 덱

> **한 줄 정의**: 슬라이드는 판넬이 아니라 **무대(stage)** 다. 생성 배경 1장이
> 여러 장에 걸쳐 유지되는 동안, 그 위에서 크롭된 만화체 배우가 페이드로 입장하고
> 포즈를 갈아끼우며 연기하고 슬라이드로 퇴장한다. 정보(라벨·항로·팻말)와
> 감정(말풍선·손글씨·임팩트)은 코드 오버레이가 담당한다.
> 애니메이션이 아니지만 애니메이션처럼 보이는 — "사람이 만든 것 같은" 문법.

- **매체**: 네이티브 React 덱 전용 (`react-deck-builder` 파이프라인 안의
  `form: diorama` 슬라이드). 레거시 HTML 덱 미지원.
- **역학과 표현의 분리**: 무대·배우·오버레이의 *기계 장치*는 `src/diorama`
  모듈이 담당하고, **어떤 무대에 누가 서서 무엇을 하는지는 슬라이드마다 자유
  저작**한다. 무대 구성용 공용 템플릿을 만들지 마라 (scene-grammar 표현 층 해방).
- **결정론**: 모든 모션은 `useSceneTime()` t의 순수 함수. 교사의 진행 통제가
  필요한 정보는 `<Build at={n}>`로 — **t와 Build는 직교**한다(서로 참조 금지).

## 언제 이 스킬인가

| 상황 | 스킬 |
|---|---|
| 사건·여정·역사·줄거리 — **누가 무엇을 했는가**가 뼈대 | **diorama** |
| 시간·흐름·순환·변화가 개념의 본질 (정렬·전파·루프) | `dynamic-scene-builder` / 씬 덱 |
| 소프트웨어 절차를 순서대로 | `software-walkthrough-builder` |
| 일러스트 전면 + 짧은 메시지 | `notebooklm-lesson-deck` / image form |

판별 한 줄: **캐릭터가 배경에 박혀 있으면 image form이고, 배경 위 별도
레이어로 움직이면 diorama다.**

## 러닝타임 — `src/diorama` (import: `../../../../src/diorama`)

좌표는 전부 `<Stage>` 컨테이너의 **%**. 배우는 `x`(가로 중심)·`ground`(발이
닿는 바닥선)·`h`(세로 높이)로 놓는다 — 인물이 공중에 뜨는 사고를 좌표 규약으로 막는다.

| export | 역할 |
|---|---|
| `<Stage src bg framing dim vignette shake>` | Layer 1 무대. framing은 **슬라이드당 고정**(scale/x/y/flip/blur) |
| `<Actor src\|poses pose acting flipbook x ground h enter exit bob flip z shadow>` | Layer 2 배우. 포즈 하드 스왑·입퇴장·이동·접지 그림자 |
| `<Bubble x y at tail w tone>` | 말풍선 (스프링 팝인) — 반말 한마디 |
| `<HandNote x y at color rotate>` | 손글씨 주석 (왼→오른 와이프, 폰트 지연 로드) |
| `<LabelChip x y at flag poleH>` | 정보 라벨 칩 (지명·용어·캡션) |
| `<Stamp x y at rotate scale>` | 스탬프 팻말 슬램인 — 고유명사·설정 각인 (강조는 `scale={pulse(t,at)}`으로, transform 래퍼 금지) |
| `<WavyUnderline x y w at>` | 물결 밑줄 (직선 금지 — 사람이 그은 선) |
| `<RouteDraw points at dur ghost>` | 항로·연결선 드로잉 (ghost=계획 점선) |
| `<Traveler points at dur size>` | 항로 위를 이동하는 말(배·아이콘) |
| `<SpeedLines x y at>` · `<DustPuff x y at>` · `<FocusVignette at>` | 임팩트 (S13) |
| `shakeStyle(t,at)` · `squash(t,at)` · `pulse(t,at)` · `ghostIn(t,at)` | 모션 헬퍼 |
| `typed` · `typedDoneAt` · `Caret` | 타이핑 표현 (walkthrough와 공유) |

`Scene`/`interpolate`/`easeOut`/`spring`/`riseIn`은 `src/scene`에서 그대로.

## 파이프라인

### Phase 0 — 무대 설계 (코드 작성 금지 단계)

`data/<그룹>/<과목>/<수업>/plan.md`에 슬라이드마다 한 블록:

```
- slide 4 | form: diorama
  stage: 라우터 관문 (stage-03) | framing: wide
  intent: 라우터는 목적지가 아니라 "다음 한 걸음"만 안다
  actors: packet(walk-a/walk-b 걷기, 좌→중앙) · gate-keeper(idle, 우측)
  overlays: LabelChip "라우터" · Bubble "다음 길만 알려줄게" · Stamp "홉(hop)"
  impact: 도착 순간 DustPuff 1
```

설계 게이트 (BLOCKING):
1. **무대 ≠ 슬라이드** — 무대 1개는 슬라이드 1~3장으로 나뉜다. 같은 무대의
   연속 슬라이드는 **프레이밍을 반드시 바꾼다**(wide → 펀치인 scale 1.3~1.6 →
   flip → 클로즈업 무대 교체). 한 무대에 4장 이상 머물지 마라.
2. **척추(spine) 1종** — 지도·연표·관계도 중 하나를 정해 영상 초반·중반·
   마무리에 재등장시키고, 돌아올 때마다 **진행이 누적**되게 한다(항로 한 구간
   추가·연표 한 칸). 학생의 위치 감각이 여기서 나온다.
3. **오프닝 훅** — 첫 장은 척추 보드에서 "왜?"를 그림의 대비로 던진다
   (계획 점선 vs 실제 경로 등).
4. **캐릭터 인벤토리** — 주인공 4~6포즈 + 조연 1~3포즈 + 소품 몇 개. 포즈를
   장면마다 새로 만들지 않는다(크기·위치·모션으로 변주).
5. 무대 역할 순환: `spine → episode → episode → closeup → spine …`
   같은 역할·같은 구도가 3연속이면 멈추고 재설계.

### Phase 1 — 자산 생성 (`image-asset-builder`)

무대 배경(1920×1080, 배우 설 자리를 비운 구도) + 캐릭터 스프라이트 시트.
**스타일 앵커 1장을 먼저 확정**하고 나머지는 `--ref 앵커`로 뽑는다.
저장 위치: 무대는 `data/…/<수업>/images/stage-NN.png`,
스프라이트는 `assets/sprites/<세트명>/<slug>.png` (manifest 등록·태깅까지).

추상 무대(클로즈업 배경 — 보케·파스텔·로우폴리)는 생성하지 말고
`<Stage bg="radial-gradient(...)">`로 코드가 만든다.

### Phase 2 — 슬라이드 저작

```tsx
<Slide full nav="라우터 관문">
  <Scene freezeAt={6}>
    <Stage src={`${IMG}/stage-03.png`} framing={{ scale: 1.06 }}>
      <Actor poses={PACKET} flipbook={{ poses: ['walk-a', 'walk-b'], fps: 5, to: 2.4 }}
             acting={[{ at: 2.4, pose: 'idle' }]}
             x={[{ t: 0, x: 12 }, { t: 2.4, x: 38 }]} ground={86} h={40}
             enter={{ at: 0.2, style: 'slide-left' }} bob={{ amp: 1 }} />
      <Actor src={KEEPER} x={66} ground={86} h={44} enter={{ at: 0.6, style: 'ghost' }} />
      <LabelChip x={66} y={40} at={1.4} flag>라우터</LabelChip>
      <Bubble x={44} y={30} at={2.8} tail="br">다음 길만 알려줄게</Bubble>
    </Stage>
  </Scene>
</Slide>
```

- **z-order**: 텍스트·오버레이는 항상 배우 위 (`Actor z` 기본 2, 오버레이 6~9).
- **zone 분리**: 헤드라인 밴드(상단 0~22%)와 배우 무대(하단)를 좌표로 분리.
  헤드라인은 `marginInline: 'auto'` + `wordBreak: 'keep-all'`.
- **히어로 프레임 ≤ 1.5초**: 첫 배우는 t ≤ 0.6s에 등장하고, 그 장의 핵심 배치가
  1.5초 안에 완성돼야 한다(썸네일·픽셀 검수가 이 시각을 본다).
- **총 길이 6~14초.** 그보다 길면 슬라이드를 쪼갠다. `freezeAt`은 그 장의
  히어로 시각으로 준다(퇴장이 있는 장은 특히).
- 학생이 클릭으로 넘겨보는 정보(정의·정리)는 `<Build>`, 자동으로 흐르는
  연기는 t — 섞되 서로를 참조하지 않는다.

### Phase 3 — 검증 (BLOCKING · 통과 전 완료 선언 금지)

```bash
npx tsc --noEmit
npm run dev -- --port 5199          # 별도 터미널
node .claude/skills/diorama-deck-builder/scripts/capture_diorama.mjs <deckId> <슬라이드> 0.8,2.5,c,6 tmp/diorama-shots
```

`c`는 클릭(빌드 진행)이다. **무대 연출은 1프레임으로 못 본다** — 슬라이드마다
최소 3시각(입장 직후 / 연기 중 / 마지막 상태)을 찍어 Read(멀티모달)로 본다:

- 배우가 바닥에 서 있나(공중부양 없나) · 겹침·가림 없나 · 텍스트가 배우에 먹히지 않나
- 무대 하단이 자막처럼 비어 보이지 않나 · 메타포가 읽히나
- 같은 무대의 이웃 슬라이드와 **다른 그림처럼 보이나**(프레이밍 변주 확인)

코드 통과 ≠ 픽셀 통과. tsc만 보고 끝내지 않는다.

### Phase 4 — 등록

`src/decks/registry.tsx` + `pages.json` (react-deck-builder 2~3단계 그대로).
라이브 문항이 있으면 수업 폴더에 `quiz.json`(deck.tsx 옆) + registry `quizJson`에 그 경로.

## 연출 문법 (요약 — 상세는 `references/diorama-grammar.md`)

| # | 문법 | 한 줄 |
|---|---|---|
| S1 | 무대 지속 + 프레이밍 컷 | 배경은 유지, 슬라이드마다 프레이밍이 바뀐다 |
| S2 | 입장 | 고스트 페이드 0.5s · 그룹은 0.15s stagger |
| S3 | 포즈 스왑 | **하드 컷**(크로스페이드 금지), 포즈당 0.5~2s |
| S4 | 이동 | PNG는 정지 1장, 움직임은 전부 코드 |
| S5 | 클로즈업 | 배우 확대 + 추상 배경으로 무대 교체 (원본 해상도 안에서만) |
| S6 | 정보 지목 | 씬 내 줌·팬 금지 — 다음 슬라이드에서 프레이밍으로 컷 |
| S7 | 감정 오버레이 | 말풍선(30~60초당 1회) · 손글씨 · 타이핑(순차 등장) |
| S8 | 정보 오버레이 | 라벨칩 · 스탬프 · 항로 드로잉 · **물결** 밑줄 |
| S9 | 척추 보드 | 재등장할 때마다 진행 누적 |
| S10 | 챕터 카드 | 다크 무대 + 타자기 타이핑 제목 |
| S11 | 오프닝 훅 | 첫 장에서 그림 한 장의 대비로 "왜?"를 건다 |
| S12 | 클로징 | 척추 보드 회귀 + 주제 한 문장 |
| S13 | 임팩트 | 스피드라인·먼지·shake·squash·펄스 — 슬라이드당 1~3개 |

**S14(코믹 SFX)는 이식하지 않았다** — 덱에는 오디오 트랙이 없고 교실의 소리는
교사의 목소리다. 영상에서 SFX가 하던 역할(사건의 강조)은 S13 임팩트가 맡는다.

## 절대 금지

1. **캐릭터를 배경 이미지에 굽기** — 배우는 반드시 별도 크롭 레이어
2. **슬라이드마다 배경 교체** — 무대 지속이 정체성. 단 **한 무대에 4장 이상
   머무는 것도 금지**(프레이밍을 바꾸거나 무대를 넘긴다)
3. **포즈 크로스페이드** — 하드 컷만 (섞으면 유령처럼 보인다)
4. **씬 내 카메라 모션**(줌·팬·Ken Burns) — 무대는 정지, 변화는 배우·오버레이
5. **이미지 안 텍스트 / 인물 SVG 실루엣**(졸라맨) — scene-grammar §17 그대로
6. **말풍선 남발** — 슬라이드마다 넣으면 리듬이 죽는다
7. **임팩트 도배** — 모든 등장에 스피드라인을 붙이면 소음. 사건의 크기에 비례
8. **공중부양** — `ground`를 지정하지 않거나 그림자를 끄고 인물을 띄우기

## 관련 파일

- 문법 상세·좌표·수치: `references/diorama-grammar.md` (저작 전 필독)
- 씬 저작 공통 규칙: `.claude/rules/scene-grammar.md` (Lazy Defaults·레이아웃 계약)
- 역학 모듈: `src/diorama/index.tsx`
- 자산 파이프라인: `image-asset-builder` 스킬
- 검증 캡처: `scripts/capture_diorama.mjs`
- 레퍼런스 덱: `data/dev/테스트 수업 자료/디오라마-샘플/deck.tsx` (`?deck=diorama-demo`)
- 원본: newVideoGen `.claude/skills/vg-diorama/SKILL.md` (영상판 S1~S14)
