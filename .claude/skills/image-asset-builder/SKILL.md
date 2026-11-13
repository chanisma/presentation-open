---
name: image-asset-builder
description: >-
  수업 덱에 쓸 래스터 이미지를 Codex CLI(내장 image_gen)로 생성하고, 스프라이트
  시트를 잘라 배경 투명 PNG로 만들고, assets/manifest.json에 등록하는 스킬
  (newVideoGen vg-story Phase 3 + scene-grammar §17 파이프라인 이식).
  "이미지 생성해줘", "그림 만들어줘", "배경 그려줘", "캐릭터 만들어줘",
  "스프라이트", "시트 잘라줘", "일러스트 생성", "무대 배경", "codex로 이미지"
  등을 언급하거나, 덱 저작 중 기존 에셋에 없는 회화적 이미지·인물·사물이
  필요할 때 사용. 생성 전 반드시 assets/manifest.json 재사용 조회부터 한다.
---

# Image Asset Builder — 생성 래스터 자산 파이프라인

이 저장소에서 그림이 필요할 때의 순서는 하나다:

```
① assets/manifest.json 재사용 조회 (asset-library)
   → ② 추상 도형·아이콘이면 SVG 직필 (svg-asset-builder)
   → ③ 비례·해부학이 있는 형태(인물·생물·복잡한 사물)거나
        화면 전체를 채우는 회화적 무대면 → 이 스킬로 생성
```

**판정 한 줄**: *"이 형태에 비례·해부학이 있는가?"* — 있으면 생성 이미지,
없으면 SVG. 인물을 원+캡슐+선으로 흉내낸 "졸라맨"은 newVideoGen에서 영상
점수를 20점 깎아먹은 실패다 (scene-grammar §17). 여기서도 금지한다.

## 두 갈래 산출물

| 갈래 | 무엇 | 어디에 | 쓰는 곳 |
|---|---|---|---|
| **무대(stage)** | 화면 전체를 채우는 배경 1장 (1920×1080) | `data/<그룹>/<과목>/<수업>/images/stage-NN.png` | diorama 무대 · image form 슬라이드 · KenBurns |
| **스프라이트(sprite)** | 배경 투명 크롭 조각 (캐릭터 포즈·소품) | `assets/sprites/<세트명>/<slug>.png` | 씬 위에 얹는 배우·소품 (여러 덱 재사용) |

덱 문법마다 **시트 배경색이 다르다** — 크롭 키잉이 무엇을 지워야 하는지가 다르기 때문:

| 문법 | 시트 배경 | tol | 이유 |
|---|---|---|---|
| diorama(만화체) | 밝은 웜그레이 | 30 | 캐릭터에 없는 색이면 충분 |
| whiteboard(두들) | 종이색 `#F6F5F0` | 22 | 덱 배경과 같은 종이색이라 경계가 자연스럽다 |
| vox(콜라주) | **중간 회색 `#8f9296`** | 55 | 조각의 **흰 종이 테두리**를 살리고 그림자는 지운다 |
| watercolor | — | — | 크롭하지 않는다 (풀블리드 이미지) |

무대는 그 수업의 것이고, 스프라이트는 **라이브러리**다 — 한 캐릭터 PNG를
크기·위치·모션만 바꿔 여러 씬·여러 덱에서 재사용하는 것이 기본 운용이다.

## 도구

```bash
# ① 이미지 1장 생성 (codex 내장 image_gen · 1장당 2~4분, 토큰 40~60k)
node .claude/skills/image-asset-builder/scripts/gen_image.mjs \
  --out "data/dev/테스트 수업 자료/<수업>/images/stage-01.png" \
  --prompt-file tmp/p.txt --style-file tmp/style.txt \
  [--ref <앵커.png>] [--ref <직전장면.png>] [--size 1920x1080] [--force]

# ② 시트 → 배경 투명 스프라이트 크롭 (PIL+numpy, ImageMagick/scipy 불필요)
python .claude/skills/image-asset-builder/scripts/crop_sheet.py \
  tmp/sheet-01.png "assets/sprites/<세트명>" slug1,slug2,slug3,slug4 \
  --grid 2x2 [--tol 30] [--pad 8] [--dry-run]

# ③ manifest 등록 (tags·alt는 비워 두고 직후에 눈으로 보고 채운다)
node .claude/skills/image-asset-builder/scripts/register_images.mjs \
  --kind sprite --set <세트명> --style <스타일> --used-in <덱id> \
  "assets/sprites/<세트명>/slug1.png" …

# 보조: 해상도 강제 (magick 대체)
python .claude/skills/image-asset-builder/scripts/fit_image.py <img> 1920 1080
```

`gen_image.mjs`는 codex에게 ASCII 스테이징 경로에 저장시킨 뒤 스크립트가
최종 경로(한글 폴더 포함)로 옮긴다 — codex가 한글 경로 복사에서 자주 실패해
넣은 안전장치다. 저장 자체가 실패해도 `$CODEX_HOME/generated_images`의 최신
파일을 회수한다.

## 절차

### 0. 재사용 조회 (HARD — 생략 금지)

```bash
grep -n "키워드\|keyword" assets/manifest.json
```

같은 `set`이면 자유롭게, 같은 `style`이면 눈으로 대조 후 재사용한다.
**덱의 테마·톤과 충돌하면 세트가 통일돼 있어도 쓰지 않는다** (asset-library
보수 원칙). 재사용으로 해결되면 생성하지 않는다.

### 1. 인벤토리 역산

전 슬라이드를 훑어 필요한 그림 목록을 뽑는다. **포즈를 장면마다 새로
만들지 마라** — 캐릭터 4~8포즈 + 소품 5~15개면 덱 하나를 덮는다. 포즈를
늘리는 유일한 기준은 "크기·각도·모션으로 못 만드는 **다른 동작**인가?"다.

### 2. 스타일 앵커 1장 → 눈으로 확인 (BLOCKING)

무대 후보 1장을 먼저 생성해 Read(멀티모달)로 본다. 톤이 덱 테마와 맞을
때까지 style guide를 고쳐 재생성하고, **확정된 그 1장을 이후 모든 호출의
`--ref`로 넘긴다**. 앵커 없이 여러 장을 뽑으면 톤이 표류하고 시간·토큰만
버린다.

style guide는 항목을 나눠 쓴다 (medium / 팔레트 / 원근 / 여백 / 금지):

```
만화체 디오라마 무대 배경 — 그림책 톤, 시네마틱 실사 아님
- 굵은 잉크 아웃라인 + 플랫 채색, 은은한 종이 질감
- 팔레트: #1b2340 어두운 면 · #3ec9b6 강조 · #f5b544 빛 · #f4ecdd 종이
- 살짝 내려다보는 아이소메트릭 원근, 단순화된 형태
- 하단 1/3은 배우가 설 빈 무대 — 사람·글자 금지
```

### 3. 시트 생성 (스프라이트는 반드시 시트로 몰아서)

캐릭터/소품은 낱장으로 뽑지 않는다. 한 장에 2×2~3×3으로 그리게 하고
프롬프트에 다음을 **그대로** 넣는다:

- `uniform flat solid background color (light warm gray), no gradient` — 크롭 키잉용
- `large even margins between objects, objects must not overlap or touch`
- `same character identity in every pose (same hair/clothes/colors)`
- `no grid lines, no frames, no text, no numbers`
- `full body, standing on nothing (no ground shadow baked in)` — 접지 그림자는 코드가 그린다
- 칸 수는 **쓸 크기가 정한다** (아래 실측): 시트 1장이 대략 1672×941로 나오므로
  2×2면 개당 350~500px, 1×2면 550~750px, 1×1이면 900px+ 가 나온다

**화면에 표시할 크기보다 크롭이 작으면 안 된다.** 와이드 배치(세로 ≤40%)는 2×2로
충분하고, 클로즈업·펀치인(세로 55%+)에 쓸 포즈는 **1×2 시트로 따로** 뽑아
`<slug>-l` 로 등록한다. 작게 뽑아 확대하는 것은 비가역 실패다.

### 4. 크롭 → 육안 검수 → 등록·태깅

```bash
python …/crop_sheet.py tmp/sheet-01.png "assets/sprites/패킷여행" \
  packet-idle,packet-walk-a,packet-walk-b,packet-worry --grid 2x2 --dry-run
```

`--dry-run`으로 크기·경고를 먼저 보고, 잘림/배경 잔여가 있으면 `--tol`을
조정한다(배경이 남으면 올리고, 형태가 깎이면 내린다). 그 다음 실제 크롭 →
**전 장 Read로 육안 검수**(포즈 오매칭·잘림·톤 이탈 → 해당 시트만 재생성) →
`register_images.mjs`로 등록 → 미태깅 목록의 `tags`·`alt`를 manifest에 기입.
캐릭터는 alt에 **외모 식별 특징**(색·복장·형태)을 반드시 적는다.

### 5. 조립 — 크기 변주 + 모션은 코드가 준다

PNG는 정지 한 장이면 충분하다. 등장·이동·강조는 전부 코드
(`translate/scale/opacity/포즈 스왑`)가 만든다. 배치 크기 기준은
diorama-deck-builder의 Actor 규약(dominant 34~52% · 조연 18~28% · 군중
8~14%)을 따른다. **크롭 원본보다 크게 늘리지 마라** — 더 크게 필요하면
시트를 다시 뽑는다.

## HARD 금지

1. **인물 SVG 추상 실루엣** — 원+캡슐+선 조합으로 사람을 흉내내기 (졸라맨 금지)
2. **이미지 안 텍스트** — 라벨·수치·제목은 전부 코드 오버레이로 (겹침 통제를 코드가 가진다)
3. **낱장 생성 남발** — 스프라이트는 시트로 몰아서 (시간·쿼터)
4. **앵커 없이 다장 생성** — 톤 표류
5. **톤 불일치 재사용** — 다른 스타일 계열 자산을 앵커 대조 없이 끌어오기
6. **photorealistic / 스톡 일러스트 톤** — 회화적·만화체만
7. **생성 래스터를 씬의 작은 부분 장식으로 남발** — 부분 아이콘·추상 도형은 SVG

## 실측 (2026-08-18 · 디오라마-샘플 제작 중 측정)

| 항목 | 값 |
|---|---|
| 1장 생성 시간 | 2~4분 (codex 세션 기동 포함) · 토큰 40~60k |
| 병렬 | 3장 동시 실행 정상 (`&` + `wait`) |
| 출력 해상도 | 16:9 요청 시 **1672×941** 전후 — `--size`로 1920×1080 보정 |
| 2×2 시트 크롭 | 개당 **350~500px** (와이드 배치용으로만 충분) |
| 1×2 시트 크롭 | 개당 **550~750px** — 클로즈업·펀치인(화면 세로 55% 이상)에 쓸 포즈는 이쪽으로 따로 뽑는다 |
| 배경 키잉 | "uniform flat solid light warm gray" 요청 + `--tol 30` 자동 추정으로 8/8 성공 |

크롭기는 **가장자리 flood-fill로 바깥 배경만** 지운다 — 거리 임계만으로 알파를
만들면 배경색과 비슷한 **내부**(크림색 몸통 등)까지 반투명해져 무대가 비쳐 보인다
(첫 회차에서 실제로 터진 사고). 그래서 시트 배경은 **캐릭터에 없는 색**일수록 안전하다.

## 관련

- 재사용 판단·태깅 규약: `asset-library` (manifest 단일 레지스트리)
- 손그림 SVG 직필: `svg-asset-builder` (추상·아이콘·부분 에셋)
- 이 자산을 소비하는 덱 문법: `diorama-deck-builder`(무대+배우+오버레이),
  `composite-deck-builder`·`react-deck-builder`(image form 무대화)
- 원본 파이프라인: newVideoGen `.claude/rules/scene-grammar.md` §17,
  `.claude/skills/vg-story`(배경 생성), `vg-diorama`(무대·배우 자산 규약)
