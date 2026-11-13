# Film Grammar — 구운 영상 덱 문법 상세

`film-deck-builder` 저작 전 필독. 2026-08-20 전주(vox)·패킷(디오라마) 두 덱을
만들며 실측·수정한 내용이다.

## 0. 실측 (2026-08-20)

| 항목 | 값 |
|---|---|
| 편 길이 | 13.5초 = 4.5초 × 3장면 (405 프레임 @30fps) |
| 렌더 시간 | 편당 1~2분 (1920×1080, Remotion) |
| 덱용 인코딩 후 용량 | **플랫 콜라주 0.56~0.68MB · 디오라마(회화 배경) 0.74~0.93MB** |
| all-intra(`-g 1`) 용량 | 같은 길이의 3~5배 (스크럽 전용) |
| 실사 클립 참고 | 14.3초 all-intra 4.9MB (cinematic, 1차 실험) |
| poster jpg | 13~40KB |
| 자산 생성 | 무대 1장 2~4분 · 시트 1장 2~4분 (병렬 3장 정상) |

용량이 작은 이유는 플랫 그래픽 + 정지 배경이라 프레임 간 차이가 적기 때문이다.
**영상이라고 겁먹지 않아도 된다** — 덱 하나(3편)가 2MB 안쪽이다.

## 1. 시간 설계 — 왜 4.5초 × 3인가

- **4.5초**: 등장(0.3~0.5s) → 전개(2.5s) → 정착(1.5s). 이보다 짧으면 학생이
  읽을 시간이 없고, 길면 정착 구간이 지루한 정지 화면이 된다.
- **3장면**: 자동 재생 1 + 클릭 2. 클릭 3회 이상이면 교사가 리듬을 잃는다.
- **등장은 3.0초 안에 완료**: 어느 경계에서 멈춰도 완성된 한 장이어야 한다.
  이것이 "영상인데 슬라이드처럼 쓸 수 있는" 이유다.

```
장면 경계     4.5      9.0      13.5
정지 지점    4.4      8.9      13.4     ← 한 프레임 앞
```

**정확히 경계에서 멈추면 다음 장면의 첫 프레임(빈 화면)이 보인다.** 카드형
전환일수록 치명적이다 — 전주 스탯 편에서 실제로 "다음 카드가 미리 보이는"
사고가 났고 −0.1초로 해결했다.

## 2. StepVideo 동작 계약

```tsx
<StepVideo src poster segments={[4.4, 8.9, 13.4]} auto />
```

- `auto` → 첫 구간은 슬라이드 진입과 함께 재생, 클릭 1이 두 번째 구간.
  `registerMax`는 `segments.length - 1`로 등록된다(자동 구간은 클릭을 안 먹음).
- 구간 경계 감시는 **rAF**로 한다. `timeupdate`는 ~4Hz라 경계를 지나친다.
- **뒤로 갔다 돌아온 경우**: 엔진이 클릭 상태를 복원한 채 컴포넌트를 다시
  마운트한다. 이때 재생하면 안 되고 **그 단계의 끝 프레임으로 seek**해야 한다
  (`firstRun` 분기). 이 처리가 없으면 돌아올 때마다 마지막 장면이 재생된다.
- `isStatic`(썸네일·그리드)에서는 `<img src={poster}>`. 그리드에서
  `document.querySelectorAll('video').length === 0`이 검증 조건이다.

## 3. 화면 채움 — contain + 배경색 통일

```tsx
<div style={{ position:'absolute', inset:0, background: PAPER }}>
  <StepVideo … style={{ position:'absolute', inset:0, width:'100%', height:'100%',
                        objectFit:'contain' }} />
</div>
```

- `cover`는 창이 16:9가 아닐 때(교실 프로젝터·창 크기 조절) **좌우를 잘라낸다**.
  영상 가장자리의 조각·라벨이 사라진다.
- `contain`의 레터박스는 **페이지 배경색 = 영상 배경색**이면 보이지 않는다.
  vox는 `#f3ece0`, 디오라마는 `#0d1120`.

## 4. 영상 위 텍스트 레이어

### 좌표 계약

텍스트를 얹는 순간 **영상과 텍스트가 같은 좌표계**에 있어야 한다.
`contain`으로 렌더된 영상의 실제 사각형과 페이지 전체는 다르므로, 16:9 박스를
만들어 그 안에 둘을 함께 넣는다:

```tsx
<div style={{ position:'absolute', inset:0, background: INK,
              display:'flex', alignItems:'center', justifyContent:'center' }}>
  <div style={{ position:'relative', width:'min(100%, calc(100vh * 16 / 9))',
                aspectRatio:'16 / 9' }}>
    <StepVideo … style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} />
    {/* 텍스트 레이어 — 이 박스 기준 % 좌표 */}
  </div>
</div>
```

### 영상 쪽 계약 — 상단 24%를 비운다

무대 생성 프롬프트에 그대로 넣는다:

```
- TOP 25% of the image must be calm empty space (sky / plain wall)
  — a text band will be overlaid there
```

이게 없으면 제목이 지붕·간판·캐릭터 머리 위에 얹혀 읽히지 않는다.

### 스크림

밝은 배경(종이·하늘)에서 흰 글자는 사라진다. 왼쪽만 덮고 오른쪽으로 투명해지는
그라데이션 배너가 영상을 가리지 않으면서 가독을 지킨다:

```
background: linear-gradient(100deg, rgba(13,17,32,0.72) 0%,
                            rgba(13,17,32,0.42) 70%, rgba(13,17,32,0.08) 100%)
```

### 캡션 전환

```tsx
const cur = isStatic ? 2 : Math.min(2, clicks);   // auto라 clicks 0 = 장면 1
<AnimatePresence mode="wait">
  <motion.p key={cur} …>{captions[cur]}</motion.p>
</AnimatePresence>
```

`key={cur}`로 갈아 끼우면 장면과 캡션이 함께 넘어간다.

## 5. 스텝 UI를 두지 않는 이유 (2026-08-20 사용자 확정)

처음엔 우상단에 ①②③ 칩과 "→ 다음 장면" 힌트를 뒀다. 제거한 이유:

- 스텝은 **영상 안에서 자연스럽게 이어지는 단계**다. 밖에서 세어 보여주면
  영상의 흐름이 UI 위젯으로 분해된다.
- 덱 크롬(하단 독)이 이미 페이지 진행을 표시한다. 중복이다.
- 화면이 조용해지면서 영상 자체가 살아났다(제거 후 실측 확인).

**다른 영상이 필요하면 다른 페이지**라는 원칙도 여기서 나온다 — 한 페이지가
곧 한 편이므로 페이지 번호가 곧 편 번호다.

## 6. Remotion 컴포지션 저작 노트

### 결정론

`Math.random()`·`Date.now()`·`new Date()` 금지. 흔들림·파편은 인덱스 기반
결정론 함수로:

```tsx
const a = (i / n) * Math.PI * 2 + Math.sin(i * 5.3) * 0.5;
const jitter = Math.sin(t * 90) * amp;
```

### 장면 나누기

```tsx
const SCENE_F = 135;   // 4.5s @30fps
{scenes.map((S, i) => (
  <Sequence key={i} from={i * SCENE_F} durationInFrames={SCENE_F}><S /></Sequence>
))}
```

`Sequence` 안에서는 `useCurrentFrame()`이 **0부터 다시** 센다 — 장면 로컬 t를
그대로 쓰면 된다.

### 문법 이식 체크리스트

덱 문법을 Remotion으로 옮길 때 빠뜨리기 쉬운 것:

| 문법 | 옮겨야 할 것 |
|---|---|
| 공통 | 팔레트 토큰 · 한글 폰트(`Malgun Gothic` 지정) · 종이 결/그레인 |
| vox 콜라주 | 조각 등장 스냅(0.3s) · 표류(drift) · 고스트 타이포 · 화살표 흐름 · 잉크 원 |
| 디오라마 | **접지 그림자**(radial-gradient 타원) · 고스트 페이드 입장 · 포즈 하드컷 · 프레이밍 컷(장면당 고정) · 스탬프 슬램(scale 1.8→1) · 항로 드로잉 + Traveler |

디오라마는 **씬 내 카메라 모션 금지**가 문법이다. 프레이밍은 장면당 고정하고
변화는 장면 전환(컷)으로 준다.

## 7. 함정 (실제로 터진 것들)

1. **crop_sheet.py `--grid`는 열x행** — 1행 2열 시트는 `2x1`. `1x2`로 주면
   상하로 잘려 나온다.
2. **크롭 파편** — 인접 칸 물체 일부가 붙어 오는 경우가 있다. 렌더에 유령
   조각으로 등장한다. PIL로 alpha 열 프로파일을 스캔해 끊긴 구간을 찾고 지운다:
   ```python
   cols = (np.array(im)[:, :, 3] > 30).sum(axis=0)   # 0인 구간이 분리점
   ```
3. **시트 잔여물** — 시트 상단의 작은 얼룩이 스프라이트에 남아 무대에 떠 있는
   점으로 보인다(vox-servers에서 발생). 첫 불투명 행을 확인한다.
4. **화살표가 칩 텍스트를 침범** — 칩 사이 여백에 정확히 넣으려면 칩의 실제
   폭을 캡처로 확인하고 시작·끝 좌표를 잡는다.
5. **번호 칩이 대상과 떨어져 배경에 뜸** — 라벨은 대상 bbox 근처에, 겹치지는
   않게. 캡처 없이 좌표를 믿지 마라.
6. **항로 선이 캐릭터를 관통** — 선의 끝점을 캐릭터 앞에서 끊는다.
7. **`hero_title`(Explainer)은 색 하드코딩** — themeConfig가 안 먹는다.
8. **vox `<Collage>` 안 `<Build>`** — motion.div의 filter/transform이
   containing block을 만들어 `%` 절대배치가 깨진다. 클릭 시점 t를 기록해
   `at`으로 넘기는 게이트를 직접 쓴다.

## 8. 검증 스니펫

```js
// Playwright browser_run_code_unsafe
const vstate = () => page.evaluate(() => {
  const v = document.querySelector('video');
  return v ? { t: Math.round(v.currentTime * 100) / 100, paused: v.paused } : null;
});
await page.goto('http://localhost:5199/index.html?deck=<id>#1');
await page.waitForTimeout(5600);        // 자동 구간 재생 + 여유
console.log(await vstate());            // 기대: { t: 4.4, paused: true }
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(4700);
console.log(await vstate());            // 기대: { t: 8.9, paused: true }
await page.keyboard.press('g');         // 그리드
await page.evaluate(() => document.querySelectorAll('video').length);  // 기대: 0
```

장면 정착 프레임은 ffmpeg으로 뽑아 Read(멀티모달)로 본다:

```bash
for t in 4.2 8.7 13.2; do ffmpeg -v error -ss $t -i film.mp4 -frames:v 1 -q:v 5 chk_$t.jpg -y; done
```
