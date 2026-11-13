// live/runtime/deck.js — Deck Contract v1 공통 컨트롤러
//
// 덱은 콘텐츠(.slide 섹션들)만 갖고, 이 파일 하나를 참조한다:
//   <body data-deck-title="제목" data-subject="과목">
//     <section class="slide">…</section> ×N
//     <script type="module" src="../../live/runtime/deck.js?v=1"></script>
//   </body>
//
// 제공: 크롬(진행바·하단 네비·제목/과목 칩), 키보드/휠 네비, URL 해시 딥링크(#3),
//       SceneMotion 런타임 + interpolate/springy 전역(dynamic-scene 규약),
//       ?live= 감지 시 라이브 레이어(live.js) 동적 로드, quiz.json 문항 지원.
// 원칙: 크롬은 dk- 접두사 + @layer(기본 스타일)로 덱 고유 스타일이 항상 이긴다.
//       한 파일 수정 = 모든 Contract 덱에 반영 (인라인 복제 금지).

const $ = (sel, root = document) => root.querySelector(sel);

// ── 1) 기본 스타일 (@layer: 덱의 무계층 스타일이 항상 우선) + 크롬 스타일 ──
const style = document.createElement('style');
style.textContent = `
@layer dk-base {
  html, body { margin: 0; width: 100%; height: 100%; overflow: hidden;
    font-family: 'Noto Sans KR', 'Pretendard', sans-serif; background: #10182b; color: #e8ecf6; }
  .slide { position: absolute; inset: 0; opacity: 0; pointer-events: none;
    transition: opacity .45s ease; overflow: hidden; }
  .slide.active { opacity: 1; pointer-events: auto; }
}
.dk-progress { position: fixed; top: 0; left: 0; height: 3px; width: 0; z-index: 9000;
  background: var(--dk-accent, linear-gradient(90deg, #5ea2f6, #34d399)); transition: width .3s; }
.dk-nav { position: fixed; bottom: 14px; left: 50%; transform: translateX(-50%); z-index: 9000;
  display: flex; align-items: center; gap: 11px;
  background: var(--dk-chrome-bg, rgba(10,15,28,.75)); color: var(--dk-chrome-fg, #94a3b8);
  border: 1px solid var(--dk-chrome-line, rgba(148,163,184,.22));
  padding: 6px 14px; border-radius: 999px; font-size: 13px;
  font-family: 'Noto Sans KR', sans-serif; backdrop-filter: blur(6px); }
.dk-nav__title { font-weight: 700; color: var(--dk-chrome-title, #cbd5e1);
  max-width: 34vw; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dk-nav__subject { font-size: 11px; font-weight: 700; padding: 2px 9px; border-radius: 999px;
  background: rgba(94,162,246,.16); color: #7eb3f8; white-space: nowrap; }
.dk-nav__sep { width: 1px; height: 14px; background: var(--dk-chrome-line, rgba(148,163,184,.25)); }
.dk-nav button { border: 0; background: none; color: var(--dk-chrome-title, #cbd5e1);
  cursor: pointer; font-size: 15px; font-family: inherit; padding: 2px 5px; line-height: 1; }
.dk-nav button:disabled { opacity: .3; cursor: default; }
.dk-nav__counter { font-variant-numeric: tabular-nums; white-space: nowrap; }
@media print { .dk-nav, .dk-progress { display: none; } }
`;
document.head.appendChild(style);

// ── 2) 슬라이드 컨트롤러 ──
const slides = [...document.querySelectorAll('.slide')];
const total = slides.length;
let current = Math.max(0, slides.findIndex((s) => s.classList.contains('active')));
const listeners = new Set();

function apply() {
  slides.forEach((s, i) => s.classList.toggle('active', i === current));
  const bar = $('.dk-progress');
  if (bar) {
    bar.style.width = ((current + 1) / total) * 100 + '%';
    bar.setAttribute('aria-valuenow', String(current + 1));
  }
  const counter = $('.dk-nav__counter');
  if (counter) counter.textContent = `${current + 1} / ${total}`;
  const prev = $('.dk-nav [data-dk="prev"]');
  const next = $('.dk-nav [data-dk="next"]');
  if (prev) prev.disabled = current === 0;
  if (next) next.disabled = current === total - 1;
  // 해시 딥링크 동기화 (히스토리 오염 없이)
  history.replaceState(null, '', current === 0 ? location.pathname + location.search : `#${current + 1}`);
  listeners.forEach((cb) => { try { cb(current); } catch (e) { /* 리스너 오류 격리 */ } });
}

function goTo(i) {
  const n = Math.max(0, Math.min(total - 1, i));
  if (n === current) return;
  current = n;
  apply();
}

window.DeckController = {
  get index() { return current; },
  get total() { return total; },
  goTo,
  next: () => goTo(current + 1),
  prev: () => goTo(current - 1),
  onChange(cb) { listeners.add(cb); return () => listeners.delete(cb); },
};

// ── 3) 크롬 주입 ──
function mountChrome() {
  const title = document.body.dataset.deckTitle || document.title || '';
  const subject = document.body.dataset.subject || '';
  const bar = document.createElement('div');
  bar.className = 'dk-progress';
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-valuemin', '1');
  bar.setAttribute('aria-valuemax', String(total));
  const nav = document.createElement('div');
  nav.className = 'dk-nav';
  nav.innerHTML = `
    ${subject ? `<span class="dk-nav__subject"></span>` : ''}
    <span class="dk-nav__title"></span>
    <span class="dk-nav__sep"></span>
    <button data-dk="prev" aria-label="이전 슬라이드">←</button>
    <span class="dk-nav__counter">1 / ${total}</span>
    <button data-dk="next" aria-label="다음 슬라이드">→</button>`;
  document.body.append(bar, nav);
  if (subject) $('.dk-nav__subject').textContent = subject;   // 사용자 데이터는 textContent로
  $('.dk-nav__title').textContent = title;
  $('[data-dk="prev"]').addEventListener('click', (e) => { goTo(current - 1); e.target.blur(); });
  $('[data-dk="next"]').addEventListener('click', (e) => { goTo(current + 1); e.target.blur(); });
}

// ── 4) 입력: 키보드·휠·해시 (루트 script.js 패턴 계승) ──
function bindInputs() {
  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
    if (['ArrowRight', 'ArrowDown', ' ', 'PageDown'].includes(e.key)) { e.preventDefault(); goTo(current + 1); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); goTo(current - 1); }
    else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
    else if (e.key === 'End') { e.preventDefault(); goTo(total - 1); }
  });
  let wheelLocked = false;
  document.addEventListener('wheel', (e) => {
    // 코드에디터·미리보기·스크롤 영역 내부에서는 슬라이드 넘김 방지
    if (e.target.closest('.code-editor, .preview-pane, [data-dk-scroll]')) return;
    e.preventDefault();
    if (wheelLocked) return;
    wheelLocked = true;
    if (e.deltaY > 0) goTo(current + 1); else if (e.deltaY < 0) goTo(current - 1);
    setTimeout(() => { wheelLocked = false; }, 600);
  }, { passive: false });
  window.addEventListener('hashchange', () => {
    const n = parseInt(location.hash.slice(1), 10);
    if (!isNaN(n)) goTo(n - 1);
  });
}

// ── 5) Scene Motion Runtime (dynamic-scene-builder 규약 — 결정론적 타임라인) ──
const motionSync = (function motionRuntime() {
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
  window.SceneMotion = { register(id, fn) { timelines.set(id, fn); } };
  sync();
  requestAnimationFrame(frame);
  return sync;
})();

// 외부 스크립트(검수 도구·live.js 등)가 .slide 클래스를 직접 토글해도
// 컨트롤러 상태·크롬·모션이 함께 따라가도록 관찰자로 조정한다.
// (apply()의 자체 토글은 같은 인덱스로 수렴하므로 루프 없음)
const reconcile = new MutationObserver(() => {
  const idx = slides.findIndex((s) => s.classList.contains('active'));
  if (idx >= 0 && idx !== current) { current = idx; apply(); }
  motionSync();
});
slides.forEach((s) => reconcile.observe(s, { attributes: true, attributeFilter: ['class'] }));

window.interpolate = function interpolate(t, tin, tout, ease) {
  let x = (t - tin[0]) / (tin[1] - tin[0]);
  x = Math.max(0, Math.min(1, x));
  if (ease) x = ease(x);
  return tout[0] + (tout[1] - tout[0]) * x;
};
window.easeOut = (x) => 1 - Math.pow(1 - x, 3);
window.easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
window.springy = function springy(t, delay = 0, duration = 0.8) {
  const x = Math.max(0, Math.min(1, (t - delay) / duration));
  if (x === 0 || x === 1) return x;
  return 1 - Math.exp(-6 * x) * Math.cos(12 * x) * (1 - x);
};

// ── 6) 부팅 ──
// ?chrome=0 — 레거시 뷰어 iframe 내부: 크롬은 뷰어(진짜 bolt 엔진)가 담당
const chromeSuppressed =
  new URLSearchParams(location.search).get('chrome') === '0';
if (total > 0) {
  if (!chromeSuppressed) mountChrome();
  bindInputs();
  const n = parseInt(location.hash.slice(1), 10);
  if (!isNaN(n)) current = Math.max(0, Math.min(total - 1, n - 1));
  if (current === 0 && !slides[0].classList.contains('active')) slides[0].classList.add('active');
  apply();
}

// ── 7) bolt 크롬 (독/그리드/진행바 — DeckController를 사용하도록 컨트롤러 이후 로드.
//        실패 시 위의 dk- 기본 크롬이 그대로 폴백으로 남는다) ──
if (!chromeSuppressed) {
  import('./chrome.js?v=2').catch(() => { /* 기본 dk- 크롬 유지 */ });
}

// ── 8) 라이브 레이어 (?live= 시에만 로드 — quiz.json/data-live 문항, 미니바) ──
if (new URLSearchParams(location.search).get('live')) {
  import('./live.js?v=3');
}
