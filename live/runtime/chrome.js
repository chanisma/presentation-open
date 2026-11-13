// live/runtime/chrome.js — 범용 bolt 크롬 (모든 덱 유형 공용 독/그리드/진행바)
//
// bolt-slides의 노어(noir) 독 디자인을 레거시 HTML 덱·Contract 덱에 입힌다.
// 두 가지 구동 모드 (자동 감지):
//   · 컨트롤러 모드 — deck.js(Deck Contract v1)가 만든 window.DeckController 사용.
//     deck.js의 기본 dk- 크롬은 CSS로 감추고 이 독이 대체한다.
//   · 관찰 모드 — 덱이 자체 내비게이션 JS(키보드/휠)를 가진 경우.
//     .slide.active 를 MutationObserver로 관찰해 UI를 갱신하고,
//     이동은 합성 키보드 이벤트로 덱 자신의 핸들러에 위임한다
//     (직접 클래스 토글은 덱 내부 인덱스와 어긋나므로 최후 폴백でのみ).
//
// 스타일은 자기완결(bolt 팔레트 상수) — 레거시 페이지는 tokens.css가 없고
// 자체 --primary 등을 정의하므로 var() 상속을 쓰지 않는다. bolt 디자인 고정.
// 로드: 레거시 덱은 </body> 직전 <script type="module" src=".../chrome.js?v=2">,
//       Contract 덱은 deck.js가 import. React 덱(#root)에서는 무동작.

const NS = 'bc';
const BOLT = {
  glass: 'rgba(9, 12, 17, 0.76)',
  glassSoft: 'rgba(9, 12, 17, 0.6)',
  hair: 'rgba(255, 255, 255, 0.1)',
  hair2: 'rgba(255, 255, 255, 0.06)',
  fg: '#f4f7fa',
  muted: '#9aa4b2',
  faint: '#626d7d',
  primary: '#4fe5b0',
  accentInk: '#04140e',
  accent: 'linear-gradient(115deg, #c8f56e 0%, #5aeeb0 42%, #34dcd8 74%, #29c0f0 100%)',
  shadow: '0 18px 50px -20px rgba(0, 0, 0, 0.65)',
  font: "'Inter', 'Noto Sans KR', 'Pretendard', 'Malgun Gothic', sans-serif",
  mono: "'JetBrains Mono', ui-monospace, Consolas, monospace",
};

const ICONS = {
  left: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  right: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
  grid: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  expand: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>',
  shrink: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>',
};

const STYLE = `
.${NS}-progress { position: fixed; top: 0; left: 0; height: 2px; width: 0; z-index: 9400;
  background: ${BOLT.accent}; transition: width .35s cubic-bezier(.32,.72,0,1); }
.${NS}-dock { position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); z-index: 9500;
  display: flex; align-items: center; gap: 4px; padding: 7px 10px;
  background: ${BOLT.glass}; border: 1px solid ${BOLT.hair};
  border-radius: 999px; box-shadow: ${BOLT.shadow};
  backdrop-filter: blur(14px) saturate(1.4); -webkit-backdrop-filter: blur(14px) saturate(1.4);
  font-family: ${BOLT.font}; color: ${BOLT.muted}; font-size: 13px;
  transition: opacity .3s ease, transform .3s cubic-bezier(.32,.72,0,1); }
.${NS}-dock.hidden, .${NS}-progress.hidden { opacity: 0; pointer-events: none; }
.${NS}-dock button { display: inline-flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; border: 0; border-radius: 999px; background: none;
  color: ${BOLT.muted}; cursor: pointer; padding: 0; transition: background .25s, color .25s; }
.${NS}-dock button:hover { background: rgba(255,255,255,.08); color: ${BOLT.fg}; }
.${NS}-dock button:disabled { opacity: .3; cursor: default; background: none; }
.${NS}-dock button.on { color: ${BOLT.primary}; background: rgba(79,229,176,.12); }
.${NS}-counter { font-family: ${BOLT.mono}; font-variant-numeric: tabular-nums;
  color: ${BOLT.fg}; font-size: 12.5px; padding: 0 7px; white-space: nowrap; user-select: none; }
.${NS}-counter b { font-weight: 700; }
.${NS}-counter span { color: ${BOLT.faint}; }
.${NS}-title { max-width: 26vw; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  color: ${BOLT.muted}; font-weight: 600; font-size: 12.5px; padding: 0 8px 0 5px; user-select: none; }
.${NS}-sep { width: 1px; height: 16px; background: ${BOLT.hair2}; margin: 0 3px; }
/* ── 그리드 오버뷰 ── */
.${NS}-grid { position: fixed; inset: 0; z-index: 9600; overflow-y: auto;
  background: rgba(5, 7, 10, .9); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  padding: clamp(24px, 5vh, 56px) clamp(20px, 5vw, 64px); font-family: ${BOLT.font};
  animation: ${NS}-fade .25s ease; }
@keyframes ${NS}-fade { from { opacity: 0; } to { opacity: 1; } }
.${NS}-grid__head { display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 22px; color: ${BOLT.muted}; }
.${NS}-grid__title { font-size: 12px; font-weight: 700; letter-spacing: .14em;
  text-transform: uppercase; font-family: ${BOLT.mono}; }
.${NS}-grid__close { border: 1px solid ${BOLT.hair}; background: ${BOLT.glassSoft};
  color: ${BOLT.fg}; border-radius: 999px; width: 34px; height: 34px; font-size: 15px;
  cursor: pointer; }
.${NS}-grid__cells { display: grid; gap: 14px;
  grid-template-columns: repeat(auto-fill, minmax(min(240px, 100%), 1fr)); }
.${NS}-cell { position: relative; border: 1px solid ${BOLT.hair2}; border-radius: 12px;
  overflow: hidden; cursor: pointer; aspect-ratio: 16 / 9; background: #0a0d12;
  transition: border-color .25s, transform .25s cubic-bezier(.32,.72,0,1); }
.${NS}-cell:hover { border-color: rgba(79,229,176,.55); transform: translateY(-2px); }
.${NS}-cell.cur { border-color: ${BOLT.primary}; box-shadow: 0 0 0 1px ${BOLT.primary}; }
.${NS}-cell__n { position: absolute; left: 8px; bottom: 6px; z-index: 2;
  font-family: ${BOLT.mono}; font-size: 11px; color: ${BOLT.fg};
  background: rgba(5,7,10,.72); border-radius: 999px; padding: 2px 8px; }
.${NS}-cell__stage { position: absolute; top: 0; left: 0; transform-origin: top left;
  pointer-events: none; overflow: hidden; }
.${NS}-cell__stage .slide { position: absolute !important; inset: 0 !important;
  opacity: 1 !important; visibility: visible !important; display: block !important;
  transform: none !important; transition: none !important; animation: none !important;
  pointer-events: none !important; }
/* deck.js 기본 크롬은 이 독이 대체 */
.dk-nav, .dk-progress { display: none !important; }
@media (max-width: 760px) { .${NS}-title { display: none; } }
@media print { .${NS}-dock, .${NS}-progress, .${NS}-grid { display: none !important; } }
@media (prefers-reduced-motion: reduce) {
  .${NS}-dock, .${NS}-progress, .${NS}-cell { transition: none; }
  .${NS}-grid { animation: none; }
}`;

function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function mount() {
  // React 덱(bolt 엔진)은 자체 크롬 보유 — 무동작
  if (document.getElementById('root')) return;
  // 레거시 뷰어(?legacy=)의 iframe 안에서는 뷰어의 진짜 bolt 크롬이 컨트롤 — 억제
  if (new URLSearchParams(location.search).get('chrome') === '0') return;
  const slides = [...document.querySelectorAll('.slide')];
  if (slides.length < 2) return;
  if (document.querySelector(`.${NS}-dock`)) return; // 중복 장착 방지

  const style = document.createElement('style');
  style.textContent = STYLE;
  document.head.appendChild(style);

  const ctl = window.DeckController || null;
  const total = ctl ? ctl.total : slides.length;
  const activeIndex = () => {
    if (ctl) return ctl.index;
    const i = slides.findIndex((s) => s.classList.contains('active'));
    return i < 0 ? 0 : i;
  };

  // ── 이동: 컨트롤러 > 합성 키 이벤트 > 직접 토글(최후 폴백) ──
  const sendKey = (key) => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
    );
  };
  const step = (dir) => {
    if (ctl) return dir > 0 ? ctl.next() : ctl.prev();
    const before = activeIndex();
    sendKey(dir > 0 ? 'ArrowRight' : 'ArrowLeft');
    // 덱이 합성 이벤트를 무시하면(드묾) 미러 방식 직접 토글로 폴백
    setTimeout(() => {
      if (activeIndex() === before) {
        const n = Math.max(0, Math.min(total - 1, before + dir));
        if (n !== before) slides.forEach((s, i) => s.classList.toggle('active', i === n));
      }
    }, 120);
  };
  let stepTimer = null;
  const goTo = (target) => {
    if (ctl) return ctl.goTo(target);
    clearInterval(stepTimer);
    stepTimer = setInterval(() => {
      const cur = activeIndex();
      if (cur === target) return clearInterval(stepTimer);
      sendKey(cur < target ? 'ArrowRight' : 'ArrowLeft');
      // 진전 없으면 직접 점프 폴백 후 종료
      setTimeout(() => {
        if (activeIndex() === cur && cur !== target) {
          slides.forEach((s, i) => s.classList.toggle('active', i === target));
          clearInterval(stepTimer);
        }
      }, 100);
    }, 60);
  };

  // ── 독 ──
  const title =
    document.body.dataset.deckTitle ||
    (document.title || '').replace(/\s*[|·—-]\s*수업 자료.*$/, '').trim();
  const progress = h(`<div class="${NS}-progress" role="progressbar" aria-valuemin="1" aria-valuemax="${total}"></div>`);
  const dock = h(`
    <div class="${NS}-dock" role="toolbar" aria-label="슬라이드 컨트롤">
      ${title ? `<span class="${NS}-title"></span><span class="${NS}-sep"></span>` : ''}
      <button data-act="prev" aria-label="이전 슬라이드" data-tip="이전">${ICONS.left}</button>
      <span class="${NS}-counter"><b>1</b> <span>/ ${total}</span></span>
      <button data-act="next" aria-label="다음 슬라이드">${ICONS.right}</button>
      <span class="${NS}-sep"></span>
      <button data-act="grid" aria-label="그리드 보기 (G)">${ICONS.grid}</button>
      <button data-act="fs" aria-label="전체 화면 (F)">${ICONS.expand}</button>
    </div>`);
  if (title) dock.querySelector(`.${NS}-title`).textContent = title; // 사용자 데이터는 textContent
  document.body.append(progress, dock);

  const $ = (sel) => dock.querySelector(sel);
  function render() {
    const cur = activeIndex();
    progress.style.width = ((cur + 1) / total) * 100 + '%';
    progress.setAttribute('aria-valuenow', String(cur + 1));
    $(`.${NS}-counter b`).textContent = String(cur + 1);
    $('[data-act="prev"]').disabled = cur === 0;
    $('[data-act="next"]').disabled = cur === total - 1;
    const gridEl = document.querySelector(`.${NS}-grid`);
    if (gridEl)
      gridEl.querySelectorAll(`.${NS}-cell`).forEach((c, i) => c.classList.toggle('cur', i === cur));
  }

  // ── 그리드 오버뷰 (슬라이드 클론 축소 렌더) ──
  let gridEl = null;
  function closeGrid() {
    gridEl?.remove();
    gridEl = null;
    $('[data-act="grid"]').classList.remove('on');
  }
  function openGrid() {
    if (gridEl) return closeGrid();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    gridEl = h(`
      <div class="${NS}-grid" role="dialog" aria-label="슬라이드 그리드">
        <div class="${NS}-grid__head">
          <span class="${NS}-grid__title">Slides · ${total}</span>
          <button class="${NS}-grid__close" aria-label="닫기">×</button>
        </div>
        <div class="${NS}-grid__cells"></div>
      </div>`);
    const cells = gridEl.querySelector(`.${NS}-grid__cells`);
    slides.forEach((s, i) => {
      const cell = h(`<div class="${NS}-cell" role="button" tabindex="0" aria-label="${i + 1}쪽으로 이동"><span class="${NS}-cell__n">${i + 1}</span></div>`);
      const stage = h(`<div class="${NS}-cell__stage"></div>`);
      // 부모 컨테이너의 클래스를 계승해 하위 선택자(.deck .slide …) 스타일을 살린다
      if (s.parentElement && s.parentElement !== document.body)
        stage.className += ' ' + s.parentElement.className;
      stage.style.width = vw + 'px';
      stage.style.height = vh + 'px';
      const clone = s.cloneNode(true);
      clone.classList.add('active');
      clone.querySelectorAll('video, audio, iframe').forEach((m) => m.remove()); // 미디어 이중 재생 방지
      stage.appendChild(clone);
      cell.appendChild(stage);
      const fit = () => {
        const scale = cell.clientWidth / vw;
        stage.style.transform = `scale(${scale})`;
        stage.style.height = cell.clientWidth * (vh / vw) + 'px';
      };
      requestAnimationFrame(fit);
      const jump = () => {
        closeGrid();
        goTo(i);
      };
      cell.addEventListener('click', jump);
      cell.addEventListener('keydown', (e) => e.key === 'Enter' && jump());
      cells.appendChild(cell);
    });
    gridEl.querySelector(`.${NS}-grid__close`).addEventListener('click', closeGrid);
    gridEl.addEventListener('click', (e) => e.target === gridEl && closeGrid());
    document.body.appendChild(gridEl);
    $('[data-act="grid"]').classList.add('on');
    render();
  }

  // ── 버튼/키 입력 ──
  dock.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    btn.blur(); // 포커스 잔류 시 Space가 버튼을 다시 누르는 것 방지
    const act = btn.dataset.act;
    if (act === 'prev') step(-1);
    else if (act === 'next') step(1);
    else if (act === 'grid') openGrid();
    else if (act === 'fs') {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen?.();
    }
  });
  document.addEventListener('fullscreenchange', () => {
    $('[data-act="fs"]').innerHTML = document.fullscreenElement ? ICONS.shrink : ICONS.expand;
  });
  let uiHidden = false;
  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'g') { e.preventDefault(); openGrid(); }
    else if (k === 'f') {
      e.preventDefault();
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen?.();
    } else if (k === 'h') {
      e.preventDefault();
      uiHidden = !uiHidden;
      dock.classList.toggle('hidden', uiHidden);
      progress.classList.toggle('hidden', uiHidden);
    } else if (e.key === 'Escape' && gridEl) { e.preventDefault(); closeGrid(); }
  });

  // ── 상태 추적 ──
  if (ctl) ctl.onChange(render);
  else {
    const mo = new MutationObserver(render);
    slides.forEach((s) => mo.observe(s, { attributes: true, attributeFilter: ['class'] }));
  }
  render();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
else mount();
