---
name: film-deck-builder
description: >-
  페이지 자체가 "영상"인 덱을 만드는 스킬. OpenMontage(remotion-composer)로
  이 저장소의 덱 문법(vox 콜라주·디오라마 등)을 그대로 렌더한 짧은 영상을
  슬라이드 전면에 깔고, 클릭이 영상 안의 장면(step)을 하나씩 재생시키며,
  필요하면 영상 위에 페이지 소유의 텍스트 레이어(제목·설명)를 얹는다.
  "영상 덱", "영상으로 만들어줘", "렌더된 영상 슬라이드", "필름 덱",
  "OpenMontage로 수업 자료", "장면별로 넘어가는 영상", "영상 위에 제목",
  "모션그래픽 수업 자료" 등을 언급하거나, 브라우저 실시간 렌더로는 무거운
  모션(다수 스프라이트·복잡한 합성)을 미리 구운 영상으로 돌리고 싶을 때 사용.
  React 덱 전용.
---

# Film Deck Builder — 페이지가 곧 영상인 덱

> **한 줄 정의**: 슬라이드 한 장 = 짧은 영상 한 편. 영상은 브라우저가 실시간으로
> 그리는 대신 **OpenMontage(Remotion)가 미리 구운 mp4**이고, 그 안의 장면들은
> 교사의 클릭으로 하나씩 재생된다. 영상이 못 가진 정보(제목·설명·강조)는
> 덱이 **영상 위 텍스트 레이어**로 얹는다.

- **매체**: 네이티브 React 덱 전용. 영상은 `data/<그룹>/<과목>/<수업>/media/`.
- **왜 영상인가**: 스프라이트 수십 장·복잡한 합성·긴 타임라인은 브라우저
  실시간 렌더가 버겁고 기기마다 다르게 보인다. 구운 영상은 **어디서나 같은
  그림**이고 용량도 작다(플랫 그래픽 13.5초 ≈ 0.7MB).
- **어떤 문법이든 실을 수 있다**: vox 콜라주·디오라마·화이트보드… 덱 문법의
  시각 언어를 Remotion 컴포지션으로 옮겨 렌더하면 된다.

## 언제 이 스킬인가

| 상황 | 스킬 |
|---|---|
| 모션이 무겁거나, 한 장면을 영상처럼 흐르게 보여주고 싶다 | **film-deck-builder** |
| 브라우저에서 t의 순수 함수로 충분하다 (가벼운 씬) | `dynamic-scene-builder` |
| 무대 위 배우가 연기하되 실시간 React로 | `diorama-deck-builder` |
| 넓은 종이 세계를 카메라가 여행하되 실시간 React로 | `vox-collage-deck-builder` |
| 영상을 페이지가 아니라 **부품**으로 쓰고 싶다 | `src/components/SceneVideo` 직접 사용 (`?deck=video-demo`) |

판별 한 줄: **화면 전체가 영상이면 이 스킬, 영상이 요소 하나면 SceneVideo다.**

## ⚠ 전제조건 — OpenMontage (이 저장소 밖)

영상 렌더는 **OpenMontage(remotion-composer)** 에 의존한다. 이 저장소의 일부가
아니라 **별도 프로젝트이고 모든 PC에 있지 않다.** 저작 시작 전에 확인한다:

```bash
ls "C:/Users/User/orca/projects/creative_works/OpenMontage/remotion-composer/src/Root.tsx"
```

없으면 **영상을 만들 수 없다.** 사용자에게 알리고 같은 계획을 React 렌더러로
저작한다 — film은 새 문법이 아니라 기존 문법의 렌더 수단이므로 장면 설계는
그대로 살아난다:

| 실으려던 문법 | 대체 스킬 |
|---|---|
| 콜라주 | `vox-collage-deck-builder` |
| 디오라마 | `diorama-deck-builder` |
| 화이트보드 | `whiteboard-deck-builder` |
| 그 외 모션 | `dynamic-scene-builder` |

같은 이유로 **`lesson-deck-planner`는 사용자가 명시적으로 요청했을 때만
`film` form을 계획한다** — 계획해 두고 렌더하지 못하면 plan.md가 막히기 때문.
plan.md의 film 블록에는 항상 `fallback form:`이 병기돼 있어야 한다.

## 🚨 두 가지 절대 원칙 (2026-08-20 사용자 확정)

1. **스텝 = 한 영상 안에서 순서대로 진행되는 단계.**
   진행 인디케이터(①②③ 칩·"다음 장면" 힌트)를 화면에 두지 마라. 스텝은
   영상이 자연스럽게 이어지는 흐름이지 UI로 셀 대상이 아니다.
2. **다른 영상이 필요하면 다른 페이지다.**
   한 페이지에 영상 두 편을 담지 마라. 영상 교체는 곧 슬라이드 교체.

## 러닝타임 — `src/components/SceneVideo.tsx`

| export | 역할 |
|---|---|
| `<StepVideo src poster segments auto style>` | **이 스킬의 주역.** 구간 끝 시각 배열대로 클릭이 한 구간씩 재생하고 경계에서 정지. `auto`면 첫 구간은 슬라이드 진입과 함께 자동 재생 |
| `<ScrubVideo src poster time …>` | 씬 t의 순수 함수로 currentTime을 탐색(재생 아님). all-intra 인코딩 필수 |
| `<AmbientVideo src poster>` | muted 무한 루프 — 배경 텍스처 |

셋 다 `isStatic`(썸네일·그리드)에서는 **poster 이미지**를 렌더한다 — 허브 격자가
영상을 내려받지 않게 하는 규약이라 poster는 필수다.

## 파이프라인

### Phase 0 — 편 나누기 (코드·렌더 이전)

`plan.md`에 페이지마다 한 블록. **한 페이지 = 한 편 = 3장면**이 기본값이다:

```
- page 2 | film: journey (13.5s = 4.5s × 3)
  문법: diorama (무대·배우·오버레이)
  scene 1  라우터 갈림길 — 패킷이 달려와 멈추고, 로봇이 길을 가리킨다
  scene 2  해저 케이블 — 지도 위 항로가 그려지고 그 위를 패킷이 건넌다
  scene 3  서버 도착 — 서버 랙 캐릭터가 맞이한다
  page text: 킥커 "패킷의 여행 · 2편" / 제목 "바다를 건너는 길"
             캡션 3개(장면마다 갈림)
```

설계 게이트 (BLOCKING):
1. **장면 길이 4~5초 고정**, 편당 3장면(총 13~15초). 그보다 길면 편을 쪼갠다.
2. **각 장면의 등장은 3.0초 안에 끝난다** — 어느 경계에서 멈춰도 "정돈된
   한 장"으로 서 있어야 한다(정지 화면이 곧 슬라이드다).
3. **상단 24%는 비운다** — 페이지 텍스트 레이어의 자리. 무대 생성 프롬프트에
   `TOP 25% of the image must be calm empty space`를 명시한다.
4. 페이지 텍스트가 정말 필요한지 따진다 — 영상 안 라벨로 충분하면 얹지 않는다.

### Phase 1 — 자산 (`image-asset-builder`)

무대 배경 + 스프라이트를 **먼저 앵커 1장으로 톤을 확정**하고 `--ref`로 나머지를
뽑는다. 크롭 규약은 덱 문법을 따른다(vox는 회색 배경 `--tol 55`, 디오라마는
밝은 웜그레이 `--tol 30`).

- 무대: `data/<그룹>/<과목>/<수업>/images/stage-*.png`
- 스프라이트: `assets/sprites/<세트명>/*.png` → manifest 등록·태깅
- **remotion이 읽을 수 있게 복사**: `OpenMontage/remotion-composer/public/<세트>/`

⚠ `crop_sheet.py --grid`는 **열x행**이다. 1행 2열 시트는 `--grid 2x1`.
⚠ 크롭 후 **인접 칸 파편**을 반드시 확인한다(PIL로 alpha 열 프로파일 스캔) —
비빔밥 조각에 옆 칸 처마가 붙어 렌더에 유령으로 나온 사고가 실제로 있었다.

### Phase 2 — 컴포지션 저작 (OpenMontage)

`OpenMontage/remotion-composer/src/<주제>Vox.tsx`에 **덱 문법의 시각 언어를
Remotion 프레임 구동으로 이식**한다. 기존 레퍼런스 둘:

| 파일 | 문법 | 담은 것 |
|---|---|---|
| `JeonjuVox.tsx` | vox 콜라주 | 종이 조각·타이포 칩·화살표 흐름·잉크 주석·고스트 타이포·카메라 |
| `PacketVox.tsx` | 디오라마 | 무대(프레이밍·shake)·배우(포즈 하드컷·이동·접지 그림자)·말풍선·라벨칩·스탬프 슬램·항로 드로잉+Traveler·먼지·스피드라인 |

저작 규칙:
- `useCurrentFrame()/fps`로 초를 만들고 모든 모션은 그 t의 순수 함수
  (`Math.random`·`Date.now` 금지 — Remotion 렌더가 깨진다)
- 장면은 `<Sequence from={i*135} durationInFrames={135}>`로 나눈다(4.5s @30fps)
- **이미지 안 텍스트 금지** — 라벨·수치는 전부 코드 오버레이
- `Root.tsx`에 `<Composition id="…" durationInFrames={135*3} fps={30}
  width={1920} height={1080} />` 등록

Explainer 컴포지션(props JSON + `themeConfig`)을 쓰는 길도 있다 — 카드형
정보 클립이 필요할 때만. ⚠ `hero_title`은 색이 하드코딩이라 테마가 안 먹는다
(`stat_card`/`text_card` 사용).

### Phase 3 — 렌더 + 덱용 인코딩

```bash
# OpenMontage/remotion-composer 에서
npx remotion render src/index.tsx <CompositionId> out.mp4 --codec=h264 --log=error

# 덱용 재인코딩 (StepVideo는 1초 키프레임이면 충분)
ffmpeg -i out.mp4 -t 13.5 -an -vf scale=1280:720 -c:v libx264 -preset slow \
       -crf 23 -g 30 -pix_fmt yuv420p -movflags +faststart media/<name>.mp4
# poster — isStatic(썸네일)이 렌더할 정지 이미지 (마지막 정착 프레임)
ffmpeg -ss 13.3 -i media/<name>.mp4 -frames:v 1 -q:v 4 media/<name>.jpg
```

ScrubVideo용이면 `-g 1`(all-intra)로 따로 굽는다 — 용량 5배지만 seek이 매끄럽다.

### Phase 4 — 덱 저작

```tsx
const SEGS = [4.4, 8.9, 13.4];   // 장면 경계보다 한 프레임 앞!

<Slide full nav="여정" notes="…">
  <FilmPage src={`${MEDIA}/journey.mp4`} poster={`${MEDIA}/journey.jpg`} … />
</Slide>
```

- **구간 경계는 장면 경계 −0.1초**. 정확히 4.5s에서 멈추면 다음 장면의 첫
  프레임이 보인다.
- **화면 채움**: 영상 배경색과 페이지 배경을 같게 맞추고 `objectFit: 'contain'`
  (cover는 비-16:9 창에서 좌우를 자른다). 텍스트 레이어를 얹는다면 16:9
  콘텐츠 박스(`width: min(100%, calc(100vh * 16 / 9))`)를 만들어 그 안에
  영상과 텍스트를 함께 두어야 좌표가 어긋나지 않는다.
- **스텝 UI 금지**(위 절대 원칙 1).

#### 영상 위 페이지 텍스트 레이어

영상 속 라벨과 **역할이 다른** 텍스트(수업의 제목, 교사의 설명)를 얹을 때:

```tsx
const { clicks, isStatic } = useDeck();
const cur = isStatic ? 2 : Math.min(2, clicks);   // 장면 1은 auto라 clicks 0 = 장면 1
…
<div style={{ position:'absolute', left:'4.2%', top:'5%', maxWidth:'58%', zIndex:20,
              pointerEvents:'none', borderRadius:14,
              background:'linear-gradient(100deg, rgba(13,17,32,0.72), rgba(13,17,32,0.08))' }}>
  <div style={{ color: AMBER, fontWeight:800, letterSpacing:'0.14em' }}>{kicker}</div>
  <h2 style={{ color: CREAM, wordBreak:'keep-all' }}>{title}</h2>
  <AnimatePresence mode="wait">
    <motion.p key={cur} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}}>
      {captions[cur]}
    </motion.p>
  </AnimatePresence>
</div>
```

- **스크림 필수** — 밝은 하늘/종이 배경에서 흰 글자가 사라진다. 그라데이션
  배너가 왼쪽만 덮고 오른쪽으로 투명해지면 영상을 가리지 않는다.
- 캡션은 `cur`를 key로 갈아 끼워 장면과 함께 전환한다.
- 텍스트 밴드는 상단 24% 안에 — Phase 0에서 비워 둔 그 자리다.

### Phase 5 — 검증 (BLOCKING)

```bash
npx tsc --noEmit
npm run dev -- --port 5199
node test/merge-smoke.mjs
```

브라우저에서 실측한다(Playwright `browser_run_code_unsafe`가 편하다):

1. **진입 자동 재생 → 첫 경계 정지**: `video.currentTime === SEGS[0]`, `paused`
2. **클릭마다 다음 구간 재생 후 정지**: SEGS[1], SEGS[2]
3. **뒤로 갔다 돌아왔을 때** 재생 없이 그 단계 끝 프레임에 서 있는가
4. **그리드(g)**: `document.querySelectorAll('video').length === 0`, poster만
5. **각 장면 정착 프레임 캡처 → Read로 픽셀 검수** (편당 3시각)
6. 텍스트 레이어를 얹었다면 **비-16:9 창**에서도 좌표가 맞는지

코드 통과 ≠ 픽셀 통과. 렌더 프레임을 눈으로 보지 않고 끝내지 않는다.

### Phase 6 — 등록

`src/decks/registry.tsx` + `pages.json`, 영상·poster는 수업 폴더 `media/`.
스프라이트는 `assets/manifest.json`에 `type:"video"`(클립) / sprite로 등록해
재사용 가능하게 남긴다.

## 절대 금지

1. **스텝 진행 UI** — 절대 원칙 1
2. **한 페이지에 영상 2편** — 절대 원칙 2
3. **poster 없는 StepVideo** — 허브 격자가 영상을 내려받는다
4. **구간 경계를 장면 경계와 같게** — 다음 장면 첫 프레임이 보인다
5. **`objectFit: cover` + 다른 배경색** — 비-16:9 창에서 좌우 잘림
6. **이미지·영상 안에 텍스트 굽기** — 수정 불가·겹침 통제 상실
7. **Remotion 컴포지션에 `Math.random`/`Date.now`** — 렌더 비결정
8. **vox `<Collage>` 안에서 `<Build>`로 클릭 게이팅** — motion.div의
   filter/transform이 containing block을 만들어 절대배치 좌표가 깨진다
   (클릭 시점 t를 기록해 `at`으로 넘기는 게이트를 쓸 것)

## 레퍼런스

| 덱 | 문법 | 특징 |
|---|---|---|
| `?deck=jeonju-vox` | vox 콜라주 | 영상만 (텍스트 레이어 없음) — 전주 소개 3편 |
| `?deck=packet-film` | 디오라마 | **영상 + 페이지 텍스트 레이어** — 패킷의 여행 3편 |
| `?deck=video-demo` | — | 영상을 부품으로 쓰는 세 방식(스크럽·구간·루프) 문법 데모 |

- 덱 소스: `data/dev/테스트 수업 자료/{전주-영상-콜라주,패킷-디오라마-필름}/deck.tsx`
- 컴포지션: `OpenMontage/remotion-composer/src/{JeonjuVox,PacketVox}.tsx`
- 런타임: `src/components/SceneVideo.tsx`
- 자산 생성: `image-asset-builder` · 재사용 조회: `asset-library`
- 문법 원본: `vox-collage-deck-builder` · `diorama-deck-builder`
- 씬 공통 규칙: `.claude/rules/scene-grammar.md`
