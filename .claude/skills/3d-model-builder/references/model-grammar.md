# Model Grammar — 3D 개념 모형의 설계 문법과 기법 카탈로그

> `3d-model-builder` SKILL.md의 부록. 저작 전에 읽고, 구현 중에 기법을 찾아 쓴다.

## 1. 골격 — 파일 하나의 구조

```
<head>  base 해킹 스크립트 · 폰트 · <style> (색 토큰 → 골격 → 카드 위치)
<body>
  <main id="stage">                 three.js 캔버스가 붙는다 (창 전체)
  <div id="ui"><div id="artboard">  1672×941 고정 좌표계, CSS scale(--scale)
     .title · .card … · .transport · .mode-switch · .hints
     <svg id="callouts">            3D 점을 가리키는 선·라벨
     <div id="labels">              3D 위에 얹는 HTML 라벨(한글)
  <button id="restore">             H로 숨긴 오버레이 복구
  <div class="loading">             첫 렌더까지 · 8초 뒤 file:// 안내
<script>          8초 폴백 타이머 (window.<app>이 없으면 안내문)
<script type="module">
  import * as THREE from '../../../../assets/vendor/three/three.module.min.js'
  공용: 상수·헬퍼 → 상태 → 렌더러·환경·조명 → 카메라 → SVG·라벨·콜아웃 헬퍼
  ▼▼ 모형 고유 ▼▼  DATA · compute() · buildStage() · updateStage() · updateUI() · calloutSpecs · pick()
  공용: 조작·프레임 루프·자가 점검 API·시작
```

`data/<그룹>/<과목>/<수업>/index.html`에서 루트까지는 `../../../../`이다(그룹 한 단계 포함).

## 2. 상태와 흐름

```js
const state = { t: 0, playing: true, speed: 4, camera: 'HERO', mode: 'interactive',
                overlays: { CALLOUTS: true, CHARTS: true, LABELS: true }, /* 소재 고유 손잡이 */ };
// URL 파라미터로 초기화: ?t= ?paused=1 ?mode=demo ?embed=1(덱 iframe 모드) + 소재 고유
```

- `renderFrame`: `dt`를 0.1초로 제한(탭 복귀 시 튐 방지) → `document.hidden`이면 건너뜀 →
  데모 틱 → `t` 진행 → `updateStage()` 매 프레임 → 카메라 보간 → **UI는 50ms마다**(DOM 비용) →
  렌더 → 프레임 시간 기록.
- 재생이 끝에 닿으면 `playing=false`. 슬라이더를 잡고 있는 동안(`scrubbing`)은 슬라이더 값을
  덮어쓰지 않는다.
- 자동 시연은 상태 기계(`demo.phase` + `hold` 타이머)로 쓰고, 어떤 조작이든 `manual()`이 시연을
  끊는다.

## 3. 카메라

- `THREE.Spherical` 현재값/목표값 쌍을 `k = 1 − exp(−dt·6)`로 보간한다(프레임레이트 독립).
  방위각은 `((Δ+π) mod 2π) − π`로 최단 경로.
- 프리셋은 `{radius, phi°, theta°, target}`. 무대 폭이 데이터에 따라 달라지면 반경에 배율
  (`Math.max(.8, n/8)` 같은)을 곱한다.
- 위에서 내려다보는 프리셋은 `phi`를 0이 아니라 3°로 둔다(0°는 `lookAt` up 벡터 퇴화).
  카메라를 +z 쪽에 두면 화면 위 = −z.
- 시야각은 아트보드 배율에서 역산: `fov = 2·atan(tan(16°)·h / (941·artScale))`. 941px 세로가
  항상 32°를 차지하므로 창 비율이 바뀌어도 구도가 같고 콜아웃이 어긋나지 않는다.
- 드래그 회전은 `setPointerCapture`, 휠 줌은 `radius *= exp(deltaY·0.001)`. 클릭과 드래그는
  이동량 6px로 구분해 `pick()`을 호출한다.

## 4. 조명·재질 (기본값 · 교체 가능)

- **스튜디오 PMREM**: 상자 방(BackSide) + 발광 판 4~5장을 별도 씬에 짓고
  `PMREMGenerator.fromScene(studio, .02, .1, 60)` → `scene.environment`. 굽고 나면 dispose.
  HDR 파일 없이 금속·유리에 소프트박스 반사가 생긴다. 다크 컨셉이면 판 광량을 낮추거나
  `scene.environment`를 생략하고 `HemisphereLight`만 써도 된다.
- 방향광 하나만 `castShadow`(맵 2048, 직교 범위 ±6~8, `bias −.0004`, `normalBias .02`).
- 바닥: `ShadowMaterial(opacity .1)` 평면 + 셰이더 접지 그림자(가우시안 `exp(−3.2·dot(p,p))`
  알파). 섀도맵을 끈 저사양 모드에서도 물체가 바닥에 붙어 보인다.
- 톤매핑 `ACESFilmic`(노출 1.05), `outputColorSpace = SRGBColorSpace`, 픽셀 비율 ≤ 1.5.
- 캔버스는 `alpha: true` + `setClearColor(색, 0)`으로 비워 두고 배경은 CSS가 그린다. UI 색과
  무대 배경을 CSS 토큰 하나로 함께 바꿀 수 있다.

## 5. 기법 카탈로그

| 필요 | 기법 | 참고 |
|---|---|---|
| 동일한 요소 수백~수천 개 (픽셀·격자·점구름) | `InstancedMesh` + `setMatrixAt`/`setColorAt`, `instanceMatrix.setUsage(DynamicDrawUsage)`, 첫 `setColorAt` 뒤 `instanceColor.setUsage(...)` | 확산 모형 `updateCubes()` |
| 인스턴스 색을 sRGB로 지정 | `color.setRGB(r,g,b, THREE.SRGBColorSpace)` (기본은 작업 색공간=linear) | 같은 곳 |
| 인스턴스 클릭 | `raycaster.intersectObject(instanced)` → `hit.instanceId`; 높이가 바뀌면 `computeBoundingSphere()` 먼저 | 확산 모형 `pick()` |
| 선이 자라나는 애니메이션 | `THREE.Line` + `geometry.setDrawRange(0, count)` / `TubeGeometry`는 `index` 순서가 경로 순이라 `drawRange(0, seg·6·radial)` | 어텐션 모형 빔·튜브 |
| 두께가 값에 비례하는 연결선 | `TubeGeometry(curve, 32, .014 + .11·w, 8)` — 값이 바뀔 때만 재생성 | 어텐션 튜브 |
| 무엇이 경로를 따라 이동 | `curve.getPoint(p)` (Cubic/QuadraticBezierCurve3, CatmullRomCurve3, LineCurve3) | 어텐션 꾸러미 |
| 두 점 사이 막대 | 실린더를 중점에 놓고 `quaternion.setFromUnitVectors(up, dir)` | V8 `between()` |
| 둥근 모서리 판·기둥 | `Shape`(quadraticCurveTo) → `ExtrudeGeometry({bevelEnabled, bevelSize .02})` | 어텐션 기둥 |
| 한글 라벨 | HTML `<div>`를 `#labels`에 두고 매 프레임 `project(point)`로 `left/top` 갱신. 클릭도 HTML이 받는다 | 어텐션 `.tok` |
| 3D 점을 가리키는 라벨 | `calloutSpecs[{text, detail, label:[x,y], point:()=>Vector3}]` + `getBBox()`로 종이 받침 크기 | 두 모형 공통 |
| 가려진 영역 (마스크·미래) | 반투명 `MeshPhysicalMaterial(opacity .55, depthWrite:false)` 박스를 스케일로 덮음 | 어텐션 가림막 |
| 값→색 (뜻 성분·확률) | 성분 벡터를 정규화해 톤 색 가중합 → `THREE.Color` | 어텐션 `toneColor()` |
| 값→높이 | `clamp(a + b·v, min, max)`; 평평하게 보기 토글은 `flatAmount`를 지수 보간 | 확산 큐브 |
| 랜덤이 필요할 때 | `mulberry32(seed)` + Box–Muller. 시드는 상태에 두고 화면에 표시 | 확산 `gaussianFill` |
| 히스토그램·곡선 차트 | SVG를 직접 그린다. 곡선은 무대와 같은 함수를 `pathAt(fn, a, b, steps)`로 샘플링 | 확산 스케줄 차트 |
| 행렬 히트맵 | n×n `<rect>` + 클릭으로 상태 변경, 빗금 `<pattern>`으로 마스크 | 어텐션 행렬 |
| 살아 있는 수식 카드 | HTML 문자열로 항마다 실제 값 대입(`fmt(v)`), `−` 기호는 U+2212 | 두 모형 |

## 6. 레이아웃 계약 (겹침 4대 원인 사전 차단)

- 카드 열(좌 48~348, 우 1294~1624)과 무대 자유 영역(대개 350~1290 × 110~790)을 좌표로 나누고,
  `snapshot().bounds`로 무대의 투영 범위를 확인한다. 카드 뒤로 들어가면 카메라 반경·타깃을 옮긴다.
- 큰 글자(`font-size ≥ 32px`)는 `white-space: nowrap` + 옆 요소 `flex:1; min-width:0`.
- 카드 높이를 미리 계산한다(제목 16 + SVG 높이×(카드 폭−26)/viewBox 폭 + 노트 줄 수×17 + 여백 24).
  넘치면 노트를 줄이거나 다른 카드로 옮긴다. 정직성 안내문은 설정 카드로 보내도 된다.
- 콜아웃 라벨은 상단 밴드(y 60~140)의 카드 없는 구간에 두고 3개 이내. 의미가 없는 상태(예:
  평평하게 보기 중의 "높이" 라벨)에서는 숨긴다.
- HTML 라벨은 카드 위에 겹칠 수 있다 — 무대를 카드 밖에 두는 것이 우선.
- **선택에 따라 옮겨 다니는 3D 마커(출력 구슬·현재 위치 표시)는 선택 요소 기준 상대 오프셋이 아니라
  무대 최상단 기준 절대 높이에 둔다.** 상대 오프셋이면 아래쪽 요소를 골랐을 때 마커가 위쪽 요소와
  겹친다(2026-09-09 조각 모형 사례: `orbPos = 선택 조각 + STEP×2.4` → `y = 블록 꼭대기 + 여유`로 수정).
  x·z는 선택 요소를 따르고 y만 고정하면 "어느 조각의 출력인지"는 빔이 말해 준다.
- **embed 모드(`?embed=1`) 레이아웃**: 제목·차트·계산·과제 카드를 모두 숨기고 `#embed-bar`(좌상단,
  소재 고유 손잡이만) + 재생 바만 남긴다. iframe 크기(대개 1180×700)에서 무대가 잘리지 않는지,
  바가 무대를 가리지 않는지 그 크기로 캡처해 확인한다.

## 7. 정직성 표기 (adversarial-review 대비)

- 장난감 데이터: "손으로 설계한 임베딩", "수식으로 그린 목표 이미지" 같은 문장을 안내문에.
- 근사: "모델이 노이즈를 완벽하게 예측한다고 가정", "두 헤드가 V를 공유" 처럼 무엇을 생략했는지.
- 실제와 같은 부분도 명시: "계산 순서(내적 → ÷√d → 소프트맥스 → 가중합)는 실제와 같다".
- 카운터 직관 결과(가림막을 켠 '배가'가 앞 문맥으로 기울어짐)는 버그가 아니라 교육 장면이 되도록
  안내문으로 프레이밍한다.

## 8. 함정 목록

- **모듈 import는 `file://`에서 죽는다.** 허브(웹 서버)에서 열어야 하며, 8초 폴백 안내문을 둔다.
- **HTML 안에 제어 문자(U+0000~U+001F)를 넣으면 Vite가 500을 낸다.** dev 서버는 루트 아래 `.html`을
  parse5로 파싱하는데(`control-character-in-input-stream`), 구분자로 `''`을 쓰려면 반드시
  이스케이프 문자열로 적는다. 증상은 "window.<app>가 나타나지 않음 + 리소스 500"이다.
- **국면 경계의 부동소수점.** `(1 − .67) / .33`은 `0.9999999999999998`이라 `c >= 1`로 "마지막에만 켜지는 것"을
  판정하면 영영 켜지지 않는다. 국면 함수는 끝값을 `t >= 1 ? 1 : …`처럼 명시적으로 고정한다.
- **BPE 같은 학습 알고리즘을 넣을 때는 설계 데이터가 그 결과에 실제로 존재하는지 검사한다.** 낱말+조사
  쌍("자가")이 낱말 내부 쌍보다 잦으면 형태소 경계를 넘어 먼저 합쳐져 설계한 낱말이 어휘에 없게 된다.
  `snapshot()`에 누락 목록을 실어 검수에서 잡는다.
- **`Color.setRGB` 기본 색공간은 linear.** 화면 색을 지정할 때는 `SRGBColorSpace`를 넘긴다.
- **`getBBox()`는 `display:none` 안에서 0이나 예외.** try/catch + 폭 검사 뒤에 받침 크기를 확정.
- **InstancedMesh의 boundingSphere는 캐시된다.** 인스턴스 높이가 변하면 클릭 전에 `computeBoundingSphere()`.
- **Playwright 헤드리스 WebGL**: `chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader',
  '--enable-unsafe-swiftshader']})`. 프레임 시간은 소프트웨어 렌더라 실제 GPU 성능과 무관.
- **스크래치패드 스크립트에서 playwright**: `createRequire('D:/presentation/package.json')('playwright')`.
- **셸 heredoc 안의 백틱**: node -e 문자열에 백틱 경로가 있으면 bash가 명령으로 해석한다.
  마크다운 파일은 Write 도구로 쓴다.
- **pages.json은 LF**: 스크립트가 `JSON.stringify(data,null,2)+'\n'`으로 쓴다. 같은 방식으로 덧붙인다.
- **한글 폴더 경로의 URL**: Playwright에서 `encodeURIComponent`로 세그먼트별 인코딩.

## 9. 조작 점검 스크립트 예시 (짧게, 소재마다 새로)

```js
import { createRequire } from 'node:module';
const { chromium } = createRequire('D:/presentation/package.json')('playwright');
const page = await (await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] })).newPage({ viewport: { width: 1672, height: 941 } });
await page.goto('http://localhost:5199/data/dev/' + encodeURIComponent('테스트 수업 자료') + '/<폴더>/index.html?paused=1');
await page.waitForFunction(() => window.modelApp);
const snap = () => page.evaluate(() => window.modelApp.snapshot());
// 라벨 클릭 → 상태 변화 확인 / 캔버스 드래그 → 카메라 이동 / 슬라이더·차트 스크럽 / 버튼 / 키보드 / 자동 시연 3초
```
