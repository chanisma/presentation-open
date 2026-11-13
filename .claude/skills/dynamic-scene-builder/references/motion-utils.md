# Scene Motion Runtime — 결정론적 모션 규약

씬 모션은 **활성화 후 경과 초 t의 순수 함수**다.

> **Deck Contract v1 (권장)**: `live/runtime/deck.js`가 SceneMotion·interpolate·easeOut·
> easeInOut·springy를 **전역으로 제공**하므로 아래 스니펫을 복사할 필요가 없다.
> 씬 타임라인 등록은 deck.js 태그 **뒤에** `<script type="module">`로 작성한다
> (module은 문서 순서 실행이라 전역이 준비된 뒤 등록됨). 레퍼런스: `data/dev/테스트 수업 자료/동적씬-버블정렬/index.html`
>
> 아래 캐노니컬 스니펫은 **legacy 자기완결 덱**(deck.js 미사용)에만 인라인 1회 복사한다.

## 씬 규약

1. 씬 = `<div class="slide" data-scene="sc-NN">` — `data-scene` 값이 씬 ID.
2. 씬 바로 앞(또는 첫 줄)에 **의도 주석** (validator 필수):
   `<!-- scene: sc-NN | metaphor: 한 단어 | intent: 이 씬의 존재 이유 한 문장 -->`
3. 씬 전용 `<style>`의 모든 셀렉터는 `[data-scene="sc-NN"]` 스코프 하위로 한정.
   `@keyframes` 이름은 `sc-NN-` 접두사 (전역 네임스페이스 충돌 방지).
4. 모션 등록: `SceneMotion.register('sc-NN', (t, el) => { ... })`
   - `t`: 씬이 active가 된 순간부터의 경과 초 (씬을 떠났다 다시 오면 0부터 재시작)
   - `el`: 씬 루트 요소. 반드시 `el.querySelector(...)`로 접근 (전역 탐색 금지)
5. 히어로 프레임 도달: **t ≤ 1.5s** (pixel_review가 t≈1.6s에 캡처)
6. 금지: `Math.random()`, `Date.now()`, `setInterval`(rAF 밖 타이머로 상태 변형)

## 캐노니컬 스니펫 (덱 `</body>` 근처에 1회)

```html
<script>
/* ── Scene Motion Runtime (결정론적 타임라인) — dynamic-scene-builder 규약 v1 ── */
(function () {
  const timelines = new Map();
  let active = null, t0 = 0;
  function frame(now) {
    if (active) {
      const fn = timelines.get(active.dataset.scene);
      if (fn) fn(Math.max(0, (now - t0) / 1000), active);
    }
    requestAnimationFrame(frame);
  }
  function sync() {
    const cur = document.querySelector('.slide.active[data-scene]');
    if (cur !== active) { active = cur; t0 = performance.now(); }
  }
  function watch() {
    const mo = new MutationObserver(sync);
    document.querySelectorAll('.slide').forEach((s) =>
      mo.observe(s, { attributes: true, attributeFilter: ['class'] }));
    sync();
    requestAnimationFrame(frame);
  }
  window.SceneMotion = { register(id, fn) { timelines.set(id, fn); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch);
  else watch();
})();

/* t를 [in0,in1] 구간에서 [out0,out1]로 사상 (구간 밖은 clamp) */
function interpolate(t, tin, tout, ease) {
  let x = (t - tin[0]) / (tin[1] - tin[0]);
  x = Math.max(0, Math.min(1, x));
  if (ease) x = ease(x);
  return tout[0] + (tout[1] - tout[0]) * x;
}
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
/* 감쇠 진동 스프링 근사: delay초 후 duration 동안 0→1 (살짝 오버슛) */
function springy(t, delay = 0, duration = 0.8) {
  const x = Math.max(0, Math.min(1, (t - delay) / duration));
  if (x === 0 || x === 1) return x;
  return 1 - Math.exp(-6 * x) * Math.cos(12 * x) * (1 - x);
}
</script>
```

## 사용 예

```js
SceneMotion.register('sc-02', (t, el) => {
  // 저울: 0.3s부터 0.9s 동안 -8도로 기울며 등장
  el.querySelector('.beam').style.transform =
    `rotate(${interpolate(t, [0.3, 1.2], [0, -8], easeOut)}deg)`;
  // 오른쪽 접시 카드: 스프링 팝인
  const s = springy(t, 0.6, 0.7);
  el.querySelector('.card-r').style.transform = `scale(${0.6 + 0.4 * s})`;
  el.querySelector('.card-r').style.opacity = Math.min(1, s * 1.4);
});
```

CSS `@keyframes`/`transition`도 결정론적이므로 자유롭게 병용 가능
(`.slide.active[data-scene="sc-NN"] .x { animation: sc-NN-rise ... }` 처럼
active 진입 시 시작되도록). rAF 타임라인은 스크럽·단계 연출이 필요할 때 쓴다.
