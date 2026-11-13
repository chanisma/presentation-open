// live/runtime/host-overlay.js — 덱 안의 교사 미니바 + 결과 오버레이
// 이 화면은 보통 프로젝터에 그대로 비춰지므로:
//   - 결과(정답 포함)는 교사가 [공개]를 누르기 전에는 절대 화면에 그리지 않는다
//   - 미니바에는 응답 "수"만 표시한다
// 컨트롤 3동사 (녹색 버튼 = 항상 다음 단계):
//   · 문항 열기  — 문항 화면을 교사·학생 화면에 띄움 (제출 가능)
//   · 결과 공개  — 결과 화면을 교사·학생 화면에 띄움 (제출 잠김)
//   · 문항 닫기  — 문항/결과 화면을 양쪽에서 없앰 (open·revealed 어디서든)
//   닫은 뒤엔 revealedAt 유무로 [결과 공개]와 [결과 보기·다시 공개]를 구분한다.
//   교사 콘솔에서 조작해도 브로드캐스트로 이 미니바의 모달이 동기화된다(onLiveEvent).
// [🔒/🔓 학생 조작] — 학생 미러 화면의 클릭 차단막을 풀거나 다시 잠근다(세션 플래그 v11).
//   풀면 학생이 자기 기기에서 슬라이드를 직접 넘겨볼 수 있고, 교사가 슬라이드를
//   옮기면 다시 교사 화면으로 끌려온다.
// 버튼 클릭 후 blur() 필수 — 포커스가 남으면 Space/화살표가 덱 네비게이션 대신 버튼을 누른다.

import { joinUrl } from './config.js?v=2';
import { renderAggregates } from './charts.js?v=1';

const STYLE = `
/* bolt noir 디자인 언어 — src/styles/tokens.css의 기본 팔레트를 상수로 고정.
   (레거시 덱 페이지는 자체 --primary 등을 정의하므로 var() 상속 금지) */
.lp-hud { position: fixed; right: 16px; bottom: 16px; z-index: 99990;
  font-family: 'Inter', 'Noto Sans KR', 'Pretendard', 'Malgun Gothic', sans-serif;
  font-size: 13.5px; color: #f4f7fa;
  display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
.lp-hud * { box-sizing: border-box; }
.lp-hud__bar { display: flex; align-items: center; gap: 8px; padding: 7px 10px;
  background: rgba(9, 12, 17, .78); border: 1px solid rgba(255, 255, 255, .1);
  border-radius: 999px; box-shadow: 0 18px 50px -20px rgba(0, 0, 0, .65);
  backdrop-filter: blur(14px) saturate(1.4); -webkit-backdrop-filter: blur(14px) saturate(1.4); }
.lp-hud__code { font-weight: 700; letter-spacing: .14em; color: #4fe5b0;
  font-family: 'JetBrains Mono', ui-monospace, Consolas, monospace; font-size: 12.5px; padding-left: 3px; }
.lp-hud__meta { color: #9aa4b2; font-size: 12px; white-space: nowrap; }
.lp-hud__dot { width: 7px; height: 7px; border-radius: 50%; background: #626d7d; flex: none; }
.lp-hud__dot--live { background: #4fe5b0; box-shadow: 0 0 10px rgba(79, 229, 176, .9); }
.lp-hud__btn { border: 0; border-radius: 999px; padding: 6px 13px; font-size: 12.5px; font-weight: 700;
  cursor: pointer; color: #04140e; font-family: inherit;
  background: linear-gradient(115deg, #c8f56e 0%, #5aeeb0 42%, #34dcd8 74%, #29c0f0 100%);
  transition: filter .2s, background .2s; }
.lp-hud__btn:hover { filter: brightness(1.08); }
.lp-hud__btn--ghost { background: rgba(255, 255, 255, .08); color: #f4f7fa; }
.lp-hud__btn--ghost:hover { background: rgba(255, 255, 255, .15); filter: none; }
.lp-hud__btn--ok { background: #4fe5b0; color: #04140e; }
.lp-hud__btn--warn { background: #ff5c7a; color: #fff; }
/* 종료된 세션 표시 — 누를 수 없는 상태 칩으로 보이게 (opacity로 흐려지지 않는다) */
.lp-hud__btn--done { background: rgba(255, 92, 122, .16); color: #ff8ba0;
  box-shadow: inset 0 0 0 1px rgba(255, 92, 122, .4); }
.lp-hud__btn--done:disabled { opacity: 1; }
.lp-hud__btn:disabled { opacity: .45; cursor: default; }
.lp-hud__btn--sm { padding: 4px 10px; font-size: 11.5px; }
/* 토글 켜짐 상태 (학생 조작 허용) — 녹색 '다음 단계' 버튼과 구분되는 테두리형 */
.lp-hud__btn--on { background: rgba(79, 229, 176, .14); color: #4fe5b0;
  box-shadow: inset 0 0 0 1px rgba(79, 229, 176, .45); }
.lp-hud__btn--on:hover { background: rgba(79, 229, 176, .22); filter: none; }
.lp-hud__btn--pulse { animation: lpHudPulse 1.7s ease-out infinite; }
@keyframes lpHudPulse {
  0% { box-shadow: 0 0 0 0 rgba(79, 229, 176, .55); }
  70% { box-shadow: 0 0 0 11px rgba(79, 229, 176, 0); }
  100% { box-shadow: 0 0 0 0 rgba(79, 229, 176, 0); }
}
.lp-hud__panel { background: rgba(9, 12, 17, .94); border: 1px solid rgba(255, 255, 255, .1);
  border-radius: 20px; padding: 16px 18px; box-shadow: 0 18px 50px -20px rgba(0, 0, 0, .65);
  backdrop-filter: blur(14px) saturate(1.4); -webkit-backdrop-filter: blur(14px) saturate(1.4);
  max-width: 320px; }
.lp-hud__panel h4 { margin: 0 0 10px; font-size: 11px; color: #9aa4b2; font-weight: 700;
  letter-spacing: .12em; text-transform: uppercase;
  font-family: 'JetBrains Mono', ui-monospace, monospace; }
.lp-hud__panel--list { max-width: 460px; min-width: 380px; max-height: 54vh; overflow-y: auto; }
.lp-act-row { display: flex; justify-content: space-between; align-items: center; gap: 10px;
  padding: 9px 2px; border-bottom: 1px solid rgba(255, 255, 255, .06); }
.lp-act-row:last-child { border-bottom: 0; }
.lp-act-row__info { min-width: 0; font-size: 13px; color: #f4f7fa; }
.lp-act-row__prompt { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 250px; }
.lp-act-row__meta { color: #626d7d; font-size: 11.5px; margin-top: 2px; }
.lp-act-row__meta .st--open { color: #4fe5b0; font-weight: 700; }
.lp-act-row__meta .st--revealed { color: #5aa9ff; font-weight: 700; }
.lp-act-row__meta .st--closed { color: #ffb45c; font-weight: 700; }
.lp-act-row__btns { display: flex; gap: 6px; flex: none; }
.lp-hud__qr { background: #fff; border-radius: 12px; padding: 8px; display: flex; justify-content: center; }
.lp-hud__qr svg { display: block; width: 220px; height: 220px; }
.lp-hud__url { margin-top: 10px; font-size: 11.5px; color: #9aa4b2; overflow-wrap: anywhere;
  background: rgba(255, 255, 255, .06); border: 1px solid rgba(255, 255, 255, .06);
  border-radius: 10px; padding: 6px 8px;
  font-family: 'JetBrains Mono', ui-monospace, monospace; }
.lp-hud__bigcode { text-align: center; font-size: 30px; font-weight: 800; letter-spacing: .2em;
  color: #4fe5b0; margin-top: 10px;
  font-family: 'JetBrains Mono', ui-monospace, monospace; }
.lp-result { position: fixed; inset: 0; z-index: 99980; display: flex; align-items: center;
  justify-content: center; background: rgba(5, 7, 10, .85);
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
.lp-result__card { width: min(880px, 88vw); max-height: 84vh; overflow-y: auto;
  background: #0b0e13; border: 1px solid rgba(255, 255, 255, .1); border-radius: 26px;
  padding: 34px 38px; box-shadow: 0 50px 120px -50px rgba(0, 0, 0, .9);
  font-family: 'Inter', 'Noto Sans KR', 'Pretendard', sans-serif; }
.lp-result__prompt { color: #f4f7fa; font-size: 24px; font-weight: 800; margin: 0 0 20px;
  line-height: 1.4; letter-spacing: -.015em; }
.lp-result__subtitle { margin: 20px 0 10px; font-size: 11px; color: #9aa4b2; font-weight: 700;
  letter-spacing: .12em; text-transform: uppercase;
  font-family: 'JetBrains Mono', ui-monospace, monospace; }
.lp-result__close { position: absolute; top: 22px; right: 26px;
  border: 1px solid rgba(255, 255, 255, .1); background: rgba(255, 255, 255, .06);
  color: #f4f7fa; border-radius: 999px; width: 38px; height: 38px; font-size: 17px; cursor: pointer; }
.lp-result__close:hover { background: rgba(255, 255, 255, .12); }
.lp-code-list { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
.lp-code-item { border: 1px solid rgba(255, 255, 255, .1); background: rgba(255, 255, 255, .045);
  color: #f4f7fa; border-radius: 12px; padding: 9px 14px; cursor: pointer;
  font-family: inherit; font-size: 13.5px; display: flex; gap: 10px; align-items: center;
  transition: border-color .2s, background .2s; }
.lp-code-item:hover, .lp-code-item.sel { border-color: rgba(79, 229, 176, .6); background: rgba(79, 229, 176, .1); }
.lp-code-badge { background: #4fe5b0; color: #04140e; border-radius: 999px; padding: 1px 9px;
  font-size: 11.5px; font-weight: 700; font-family: 'JetBrains Mono', ui-monospace, monospace; }
.lp-code-badge--partial { background: rgba(255, 255, 255, .14); color: #9aa4b2; }
.lp-code-view { background: #05070a; border: 1px solid rgba(255, 255, 255, .1); border-radius: 14px;
  padding: 18px 20px; color: #d7e2f4;
  font-family: 'JetBrains Mono', Consolas, 'D2Coding', monospace;
  font-size: 15.5px; line-height: 1.65; white-space: pre-wrap; overflow-wrap: anywhere;
  max-height: 48vh; overflow-y: auto; margin: 0; }
/* 문항 모달: 슬라이드가 비쳐 보이는 얕은 배경 (힌트 참조 가능) */
.lp-question { position: fixed; inset: 0; z-index: 99970; display: flex; align-items: center;
  justify-content: center; background: rgba(5, 7, 10, .42); }
.lp-question__card { width: min(820px, 84vw); max-height: 78vh; overflow-y: auto;
  background: rgba(10, 13, 18, .97); border: 1px solid rgba(255, 255, 255, .12); border-radius: 26px;
  padding: 32px 38px; box-shadow: 0 50px 120px -50px rgba(0, 0, 0, .9);
  font-family: 'Inter', 'Noto Sans KR', 'Pretendard', sans-serif; position: relative;
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
.lp-question__kind { display: inline-block; padding: 4px 12px; border-radius: 999px;
  background: rgba(79, 229, 176, .12); border: 1px solid rgba(79, 229, 176, .35); color: #4fe5b0;
  font-size: 11px; font-weight: 700; margin-bottom: 14px; letter-spacing: .08em;
  font-family: 'JetBrains Mono', ui-monospace, monospace; }
.lp-question__prompt { color: #f4f7fa; font-size: 26px; font-weight: 800; line-height: 1.4;
  margin: 0 0 20px; letter-spacing: -.015em; }
.lp-question__opt { display: flex; gap: 13px; align-items: baseline; color: #f4f7fa;
  font-size: 19px; padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, .06); }
.lp-question__opt .n { flex: none; width: 30px; height: 30px; border-radius: 9px;
  background: rgba(79, 229, 176, .12); color: #4fe5b0; font-weight: 800; font-size: 14px;
  display: flex; align-items: center; justify-content: center; align-self: center;
  font-family: 'JetBrains Mono', ui-monospace, monospace; }
.lp-question__ox { display: flex; gap: 20px; }
.lp-question__ox span { flex: 1; text-align: center; padding: 22px 0; border-radius: 18px;
  background: rgba(255, 255, 255, .045); border: 1px solid rgba(255, 255, 255, .06);
  font-size: 44px; font-weight: 900; }
.lp-question__hint { color: #626d7d; font-size: 13.5px; margin-top: 18px; }
/* ── bolt 독 통합 모드 ──
   라이브 바는 덱 크롬(.bc-dock) 또는 엔진 도구 pill(.noir-bar) "안"의
   세그먼트로 장착되어 내비게이션과 한 개의 바를 이룬다.
   패널(QR·문항 목록)은 독 위 중앙으로 앵커. */
.lp-hud--docked { left: 50%; right: auto; transform: translateX(-50%);
  bottom: 88px; align-items: center; }
/* 라이브 세그먼트가 장착된 독은 문항/결과 모달(z 99970~) 위에 있어야
   교사가 모달을 닫지 않고도 공개/닫기 등 다음 단계를 누를 수 있다 */
.noir-dock:has(.lp-seg), .bc-dock:has(.lp-seg) { z-index: 99990; }
.lp-seg { display: flex; align-items: center; gap: 7px; flex: none;
  font-family: 'Inter', 'Noto Sans KR', 'Pretendard', 'Malgun Gothic', sans-serif;
  font-size: 13.5px; color: #f4f7fa; }
.lp-seg * { box-sizing: border-box; }
/* 독 flex 수축으로 버튼 텍스트가 감기지 않게 고정 폭 유지 */
.lp-seg .lp-hud__btn, .lp-seg .lp-hud__meta, .lp-seg .lp-hud__code {
  white-space: nowrap; flex: none; line-height: 1.25; }
.lp-seg__sep { width: 1px; height: 16px; background: rgba(255, 255, 255, .14);
  margin: 0 5px; flex: none; }
@media (max-width: 980px) { .lp-seg .lp-hud__meta { display: none; } }
`;

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

let qrLibPromise = null;
function loadQrLib() {
  if (window.qrcode) return Promise.resolve(window.qrcode);
  if (!qrLibPromise) {
    qrLibPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = new URL('../vendor/qrcode.js?v=1', import.meta.url).href;
      s.onload = () => resolve(window.qrcode);
      s.onerror = () => reject(new Error('qrcode.js 로드 실패'));
      document.head.appendChild(s);
    });
  }
  return qrLibPromise;
}

export function mountHostOverlay(ctx) {
  const { driver, code, sessionId, hostToken, liveSlides, channel } = ctx;
  const allActivities = ctx.activities || [...liveSlides.values()];

  const style = document.createElement('style');
  style.textContent = STYLE;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.className = 'lp-hud';
  document.body.appendChild(root);

  // ── bolt 독 통합: 덱 크롬(.bc-dock) 또는 엔진 도구 pill(.noir-bar) 안에
  //    라이브 세그먼트를 장착해 하나의 바로 합친다. 독은 라이브보다 먼저
  //    뜨는 게 보통이지만, 로드 경합 대비 짧게 재시도 후 독 없으면
  //    독립 바(fallback)로 남는다.
  let seg = null;
  const findDockHost = () =>
    document.querySelector('.bc-dock')
    || document.querySelector('.noir-dock .noir-bar:last-of-type');
  function tryDock(triesLeft) {
    const host = findDockHost();
    if (host) {
      seg = document.createElement('span');
      seg.className = 'lp-seg';
      host.appendChild(seg);
      root.classList.add('lp-hud--docked');
      render();
      return;
    }
    if (triesLeft > 0) setTimeout(() => tryDock(triesLeft - 1), 250);
  }
  // 아래 let 선언들(TDZ) 이후에 첫 시도가 돌도록 태스크 큐로 미룬다
  setTimeout(() => tryDock(12), 0);

  let state = null;          // hostState 결과
  let currentIdx = -1;
  let qrOpen = false;
  let listOpen = false;
  let confirmingEnd = false;
  let ended = false;         // 세션 종료됨 — 미니바를 종료 표시로 잠근다
  // 학생 미러 화면의 클릭 차단 해제 여부 (세션 플래그 v11 — hostState로 수렴)
  let allowInteract = false;
  let pollTimer = null;

  const activityFor = (def) => {
    if (!state || !def) return null;
    return (state.activities || []).find((a) => a.slideKey === def.slideKey) || null;
  };

  // 상태 페이로드 동봉 브로드캐스트 — 학생이 재조회 없이 즉시 반영 (지연 최소화)
  const send = (payload) => { try { channel.send(payload || { type: 'update' }); } catch (e) { /* 무시 */ } };

  async function refresh() {
    try {
      state = await driver.hostState(sessionId, hostToken);
      // 콘솔에서 종료했거나 종료된 세션 코드로 다시 연 경우도 여기서 잡힌다
      if (state && state.session && state.session.status === 'ended') ended = true;
      if (state && state.session) allowInteract = !!state.session.allowInteract;
      render();
    } catch (e) {
      console.warn('[live] hostState 실패:', e.message);
    }
  }

  let refreshSoonTimer = null;
  function refreshSoon() {   // 학생 제출 핑 수신 시 카운트 즉시 갱신 (버스트 병합 400ms)
    clearTimeout(refreshSoonTimer);
    refreshSoonTimer = setTimeout(refresh, 400);
  }

  function schedulePoll() {
    clearInterval(pollTimer);
    if (ended) return;   // 종료된 세션은 더 조회하지 않는다
    const def = liveSlides.get(currentIdx);
    const act = activityFor(def);
    const fast = act && act.status === 'open';
    pollTimer = setInterval(refresh, fast ? 2500 : 5000);
  }

  async function act(fn, btn) {
    if (btn) { btn.disabled = true; btn.blur(); }
    try {
      await fn();   // 각 액션이 타입드 브로드캐스트를 직접 송신
      await refresh();
    } catch (e) {
      console.error('[live] 액션 실패:', e);
      alertBar(e.message);
    } finally {
      if (btn) btn.disabled = false;
      schedulePoll();
    }
  }

  function alertBar(msg) {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:100000;'
      + 'background:#b91c1c;color:#fff;padding:9px 16px;border-radius:10px;font-size:13.5px;'
      + "font-family:'Noto Sans KR',sans-serif";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 6000);
  }

  // ── 문항 모달 (문항 열기 시 슬라이드 위에 표시 — 얕은 배경으로 슬라이드 힌트 참조 가능) ──
  // 표시 데이터는 공개용(activity_public: 정답 제거) 우선 → 프로젝터에 정답 노출 없음
  function showQuestion(def, pub) {
    const kind = (pub && pub.kind) || def.kind;
    const cfg = (pub && pub.config) || def.config || {};
    const prompt = (pub && pub.prompt) || def.prompt;
    const gamify = !!(pub && pub.gamify);
    const kindLabel = { choice: '객관식', ox: 'OX 퀴즈', short: '주관식', wordcloud: '워드클라우드',
                        exit: '출구티켓', code: '코드 실습' }[kind] || kind;
    document.querySelectorAll('.lp-question').forEach((el) => el.remove());
    const wrap = document.createElement('div');
    wrap.className = 'lp-question';
    let body = '';
    if (kind === 'choice') {
      body = (cfg.options || []).map((opt, i) =>
        `<div class="lp-question__opt"><span class="n">${i + 1}</span><span>${esc(opt)}</span></div>`).join('');
    } else if (kind === 'ox') {
      body = `<div class="lp-question__ox"><span style="color:#4fe5b0">O</span><span style="color:#ff5c7a">X</span></div>`;
    } else {
      body = `<div class="lp-question__hint">학생들이 참여 페이지에서 ${kind === 'code' ? '코드를 작성' : '응답을 입력'}하고 있습니다.</div>`;
    }
    wrap.innerHTML = `
      <div class="lp-question__card">
        <button class="lp-result__close" aria-label="닫기">×</button>
        <span class="lp-question__kind">${esc(kindLabel)}${gamify ? ' · ⚡ 스피드' : ''} · 응답 진행 중</span>
        <h3 class="lp-question__prompt">${esc(prompt)}</h3>
        ${body}
        <div class="lp-question__hint">모달을 닫아도 문항은 계속 열려 있습니다 — 미니바 [보기]로 다시 띄울 수 있어요.</div>
      </div>`;
    document.body.appendChild(wrap);
    const close = () => wrap.remove();
    wrap.querySelector('.lp-result__close').addEventListener('click', close);
    wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); });
  }

  // ── 결과 오버레이 (공개된 문항만 — 정답 포함 차트) ──
  function showResult(def, activity, aggWithAnswer) {
    document.querySelectorAll('.lp-question').forEach((el) => el.remove());
    document.querySelectorAll('.lp-result').forEach((el) => el.remove());
    const wrap = document.createElement('div');
    wrap.className = 'lp-result';
    wrap.innerHTML = `
      <div class="lp-result__card" style="position:relative">
        <button class="lp-result__close" aria-label="닫기">×</button>
        <h3 class="lp-result__prompt">${esc(activity.prompt || def.prompt)}</h3>
        <div class="lp-result__chart"></div>
      </div>`;
    document.body.appendChild(wrap);
    renderAggregates(
      wrap.querySelector('.lp-result__chart'),
      { kind: activity.kind, config: activity.config || def.config || {} },
      aggWithAnswer,
      { theme: 'dark' }
    );
    if (activity.kind === 'code') appendCodeReveal(wrap, def, activity);
    const close = () => wrap.remove();
    wrap.querySelector('.lp-result__close').addEventListener('click', close);
    wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); });
  }

  // 코드 문항 결과 확장 — 호스트 화면 전용 (학생 공개 화면은 히스토그램·케이스 통과율 그대로):
  // 모범 답안(config.solution) + 모든 테스트를 통과한 학생 코드 열람
  async function appendCodeReveal(wrap, def, activity) {
    const card = wrap.querySelector('.lp-result__card');
    if (!card) return;
    const solution = (activity.config && activity.config.solution)
                  || (def && def.config && def.config.solution) || '';
    let subs = [];
    try {
      subs = await driver.codeSubmissions(sessionId, hostToken, activity.id);
    } catch (e) { /* 제출 조회 실패 시 집계만 표시 */ }
    const perfect = subs.filter((s) => Number.isInteger(s.total) && s.total > 0 && s.passed === s.total);
    if (!solution && !perfect.length) return;
    if (!card.isConnected) return;   // 오버레이가 이미 닫힘
    const sec = document.createElement('div');
    sec.innerHTML = `
      ${solution ? `<h4 class="lp-result__subtitle">모범 답안</h4>
        <pre class="lp-code-view">${esc(solution)}</pre>` : ''}
      ${perfect.length ? `
        <h4 class="lp-result__subtitle">모든 테스트 통과 · ${perfect.length}명</h4>
        <div class="lp-code-list">${perfect.map((s, i) => `
          <button class="lp-code-item" data-i="${i}">
            <span>${esc((s.studentNo ? s.studentNo + ' ' : '') + (s.nickname || '익명'))}</span>
            <span class="lp-code-badge">${s.passed}/${s.total}</span>
          </button>`).join('')}
        </div>
        <pre class="lp-code-view" data-perfect-view hidden></pre>` : ''}`;
    card.appendChild(sec);
    const view = sec.querySelector('[data-perfect-view]');
    sec.querySelectorAll('.lp-code-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        sec.querySelectorAll('.lp-code-item').forEach((b) => b.classList.remove('sel'));
        btn.classList.add('sel');
        view.hidden = false;
        view.textContent = perfect[Number(btn.dataset.i)].code || '(빈 코드)';
        btn.blur();
      });
    });
  }

  // ── 제출 코드 브라우저 (프로젝터 송출용 — 우수작 공유) ──
  async function showCodeBrowser(activity) {
    let subs;
    try {
      subs = await driver.codeSubmissions(sessionId, hostToken, activity.id);
    } catch (e) { alertBar('코드 조회 실패: ' + e.message); return; }
    document.querySelectorAll('.lp-result').forEach((el) => el.remove());
    const wrap = document.createElement('div');
    wrap.className = 'lp-result';
    wrap.innerHTML = `
      <div class="lp-result__card" style="position:relative">
        <button class="lp-result__close" aria-label="닫기">×</button>
        <h3 class="lp-result__prompt">제출 코드 · ${subs.length}명</h3>
        <div class="lp-code-list">${subs.map((s, i) => `
          <button class="lp-code-item" data-i="${i}">
            <span>${esc((s.studentNo ? s.studentNo + ' ' : '') + (s.nickname || '익명'))}</span>
            ${Number.isInteger(s.total) && s.total > 0
              ? `<span class="lp-code-badge${s.passed === s.total ? '' : ' lp-code-badge--partial'}">${s.passed}/${s.total}</span>` : ''}
          </button>`).join('') || '<span style="color:#94a3b8">아직 제출이 없습니다</span>'}
        </div>
        <pre class="lp-code-view" hidden></pre>
      </div>`;
    document.body.appendChild(wrap);
    const view = wrap.querySelector('.lp-code-view');
    wrap.querySelectorAll('.lp-code-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        wrap.querySelectorAll('.lp-code-item').forEach((b) => b.classList.remove('sel'));
        btn.classList.add('sel');
        view.hidden = false;
        view.textContent = subs[Number(btn.dataset.i)].code || '(빈 코드)';
        btn.blur();
      });
    });
    const close = () => wrap.remove();
    wrap.querySelector('.lp-result__close').addEventListener('click', close);
    wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); });
  }

  function revealedAgg(activity) {
    // hostState의 aggregates에는 answer가 없으므로 config에서 병합 (공개 이후에만 호출할 것)
    let agg;
    if ((activity.currentRound || 1) > 1) {
      agg = { kind: activity.kind, pi: true,
              rounds: [activity.aggregates || {}, activity.aggregates2 || {}],
              total: (activity.aggregates2 || {}).total || 0 };
    } else {
      agg = { ...(activity.aggregates || {}) };
    }
    if (['choice', 'ox'].includes(activity.kind) && activity.config && 'answer' in activity.config) {
      agg.answer = activity.config.answer;
    }
    // gamify 세션: 누적 탑5는 hostState 최상위에 있음 (reveal payload와 동일 형태로 병합)
    if (state && state.session && state.session.gamify
        && Array.isArray(state.leaderboard) && state.leaderboard.length) {
      agg.leaderboard = state.leaderboard;
    }
    return agg;
  }

  // ── 미니바 렌더 ──
  function render() {
    if (ended) { listOpen = false; qrOpen = false; }   // 종료 후엔 패널도 닫는다
    const def = liveSlides.get(currentIdx);
    const activity = activityFor(def);
    const count = state ? state.participantCount : '—';
    const rtDot = channel.ok ? 'lp-hud__dot--live' : '';
    // 학생 미러는 세션에 덱이 연결된 경우에만 뜬다 → 조작 토글도 그때만 노출
    const mirroring = !!(state && state.session && state.session.deckPath);

    let ctxHtml = '';
    if (def) {
      const st = activity ? activity.status : 'none';
      const isPi = !!(activity ? (activity.config && activity.config.peerInstruction)
                               : (def.config && def.config.peerInstruction));
      const round = activity ? (activity.currentRound || 1) : 1;
      const rc = (activity && activity.roundCounts) || [0, 0];
      const n = round > 1 ? rc[1] : rc[0];
      const roundTag = round > 1 ? '2차 ' : (isPi ? '1차 ' : '');
      const wasRevealed = !!(activity && activity.revealedAt);
      if (st === 'none' || st === 'draft') {
        // 현재 슬라이드에 안 연 문항 존재 → 원버튼 강조 (교사가 놓치지 않게)
        ctxHtml = `<button class="lp-hud__btn lp-hud__btn--pulse" data-act="open">문항 열기${isPi ? ' (1차)' : ''}</button>`;
      } else if (st === 'open') {
        // 다음 단계 = 결과 공개 (PI 1차는 2차 투표). 닫기는 문항 화면을 양쪽에서 없앤다.
        ctxHtml = `<span class="lp-hud__meta">${roundTag}응답 ${n}/${count}</span>
          <button class="lp-hud__btn lp-hud__btn--ghost" data-act="qshow">보기</button>
          ${isPi && round === 1
            ? `<button class="lp-hud__btn" data-act="round2">토론 후 2차 투표 →</button>`
            : `<button class="lp-hud__btn lp-hud__btn--ok" data-act="reveal">결과 공개</button>`}
          <button class="lp-hud__btn lp-hud__btn--ghost" data-act="close" title="문항 화면을 교사·학생 화면에서 없앱니다">문항 닫기</button>`;
      } else if (st === 'revealed') {
        // 다음 단계 = 문항 닫기 — 결과 화면을 양쪽에서 없앤다
        ctxHtml = `<span class="lp-hud__meta">공개됨 · ${n}명</span>
          <button class="lp-hud__btn lp-hud__btn--ghost" data-act="show">결과 보기</button>
          <button class="lp-hud__btn lp-hud__btn--ok" data-act="close" title="결과 화면을 교사·학생 화면에서 없앱니다">문항 닫기</button>`;
      } else if (st === 'closed') {
        ctxHtml = `<span class="lp-hud__meta">${roundTag}닫힘 · ${n}명</span>
          ${isPi && round === 1
            ? `<button class="lp-hud__btn" data-act="round2">2차 투표 →</button>`
            : `<button class="lp-hud__btn lp-hud__btn--ghost" data-act="open">다시 열기</button>`}
          ${wasRevealed
            ? `<button class="lp-hud__btn lp-hud__btn--ghost" data-act="show">결과 보기</button>
               <button class="lp-hud__btn lp-hud__btn--ghost" data-act="reveal" title="결과 화면을 다시 띄웁니다">다시 공개</button>`
            : `<button class="lp-hud__btn lp-hud__btn--ok" data-act="reveal">결과 공개</button>`}`;
      }
      if (def.kind === 'code' && activity && st !== 'none' && st !== 'draft') {
        ctxHtml += `<button class="lp-hud__btn lp-hud__btn--ghost" data-act="codes">제출 코드</button>`;
      }
    }

    // [문항 ▾] 목록: 슬라이드 비귀속 문항 포함 전체 (덱에 퀴즈 슬라이드가 없어도 진행 가능)
    const kindLabel = { choice: '객관식', ox: 'OX', short: '주관식', wordcloud: '워드', exit: '출구', code: '코드' };
    const stLabel = { open: '진행 중', closed: '닫힘', revealed: '공개됨' };
    const listHtml = listOpen ? `
      <div class="lp-hud__panel lp-hud__panel--list">
        <h4>문항 목록 · ${allActivities.length}개</h4>
        ${allActivities.map((d) => {
          const a = activityFor(d);
          const st = a ? a.status : 'none';
          const rc = (a && a.roundCounts) || [0, 0];
          const n = a && (a.currentRound || 1) > 1 ? rc[1] : rc[0];
          const isPiD = !!(d.config && d.config.peerInstruction);
          const round = a ? (a.currentRound || 1) : 1;
          const wasRevealedD = !!(a && a.revealedAt);
          let btns = '';
          if (st === 'none' || st === 'draft') {
            btns = `<button class="lp-hud__btn lp-hud__btn--sm" data-act="open" data-key="${esc(d.slideKey)}">열기</button>`;
          } else if (st === 'open') {
            btns = (isPiD && round === 1
                ? `<button class="lp-hud__btn lp-hud__btn--sm" data-act="round2" data-key="${esc(d.slideKey)}">2차</button>`
                : `<button class="lp-hud__btn lp-hud__btn--sm lp-hud__btn--ok" data-act="reveal" data-key="${esc(d.slideKey)}">공개</button>`)
              + `<button class="lp-hud__btn lp-hud__btn--sm lp-hud__btn--ghost" data-act="close" data-key="${esc(d.slideKey)}">닫기</button>`;
          } else if (st === 'revealed') {
            btns = `<button class="lp-hud__btn lp-hud__btn--sm lp-hud__btn--ghost" data-act="show" data-key="${esc(d.slideKey)}">보기</button>`
              + `<button class="lp-hud__btn lp-hud__btn--sm lp-hud__btn--ok" data-act="close" data-key="${esc(d.slideKey)}" title="결과 화면을 교사·학생 화면에서 없앱니다">닫기</button>`;
          } else if (st === 'closed') {
            btns = (isPiD && round === 1
                ? `<button class="lp-hud__btn lp-hud__btn--sm" data-act="round2" data-key="${esc(d.slideKey)}">2차</button>`
                : `<button class="lp-hud__btn lp-hud__btn--sm lp-hud__btn--ghost" data-act="open" data-key="${esc(d.slideKey)}">재개</button>`)
              + (wasRevealedD
                ? `<button class="lp-hud__btn lp-hud__btn--sm lp-hud__btn--ghost" data-act="show" data-key="${esc(d.slideKey)}">보기</button>`
                  + `<button class="lp-hud__btn lp-hud__btn--sm lp-hud__btn--ghost" data-act="reveal" data-key="${esc(d.slideKey)}">재공개</button>`
                : `<button class="lp-hud__btn lp-hud__btn--sm lp-hud__btn--ok" data-act="reveal" data-key="${esc(d.slideKey)}">공개</button>`);
          }
          if (d.kind === 'code' && a && st !== 'none' && st !== 'draft') {
            btns += `<button class="lp-hud__btn lp-hud__btn--sm lp-hud__btn--ghost" data-act="codes" data-key="${esc(d.slideKey)}">제출</button>`;
          }
          return `
          <div class="lp-act-row">
            <div class="lp-act-row__info">
              <div class="lp-act-row__prompt">${esc(d.prompt)}</div>
              <div class="lp-act-row__meta">${kindLabel[d.kind] || d.kind}${isPiD ? ' · PI' : ''}
                ${Number.isInteger(d.slideIndex) ? ` · ${d.slideIndex + 1}쪽` : ''}
                · <span class="st--${st}">${stLabel[st] || '대기'}</span>${a ? ` · 응답 ${n}` : ''}</div>
            </div>
            <div class="lp-act-row__btns">${btns}</div>
          </div>`;
        }).join('') || '<div style="color:#64748b;font-size:13px">문항이 없습니다 (quiz.json 또는 덱 마크업)</div>'}
      </div>` : '';

    // 종료된 세션에서는 문항·QR 조작이 모두 무효(RPC 거부)이므로 상태 표시만 남긴다
    const barHtml = ended ? `
        <span class="lp-hud__dot" title="종료된 세션"></span>
        <span class="lp-hud__code">${esc(code)}</span>
        <span class="lp-hud__meta">참여 ${count}</span>
        <button class="lp-hud__btn lp-hud__btn--done" disabled
          title="이 세션은 종료되었습니다 — 교사 콘솔에서 새 세션을 만들어주세요">수업 종료됨</button>` : `
        <span class="lp-hud__dot ${rtDot}" title="${channel.ok ? '실시간 연결됨' : '폴링 모드'}"></span>
        <span class="lp-hud__code">${esc(code)}</span>
        <span class="lp-hud__meta">참여 ${count}</span>
        ${ctxHtml}
        ${allActivities.length ? `<button class="lp-hud__btn lp-hud__btn--ghost" data-act="list">문항 ${listOpen ? '▴' : '▾'}</button>` : ''}
        ${mirroring ? `
        <button class="lp-hud__btn ${allowInteract ? 'lp-hud__btn--on' : 'lp-hud__btn--ghost'}" data-act="interact"
          title="${allowInteract
            ? '학생이 자기 화면에서 슬라이드를 직접 넘기고 있습니다 — 누르면 다시 잠급니다'
            : '학생 화면의 클릭 차단을 풉니다 — 학생이 미러된 슬라이드를 직접 눌러볼 수 있습니다'}">
          ${allowInteract ? '🔓 학생 조작' : '🔒 학생 조작'}</button>` : ''}
        <button class="lp-hud__btn lp-hud__btn--ghost" data-act="qr">${qrOpen ? 'QR 닫기' : 'QR'}</button>
        <button class="lp-hud__btn ${confirmingEnd ? 'lp-hud__btn--warn' : 'lp-hud__btn--ghost'}" data-act="end">
          ${confirmingEnd ? '정말 종료?' : '종료'}</button>`;
    root.innerHTML = `
      ${listHtml}
      ${qrOpen ? `
      <div class="lp-hud__panel">
        <h4>학생 참여</h4>
        <div class="lp-hud__qr" data-qr></div>
        <div class="lp-hud__bigcode">${esc(code)}</div>
        <div class="lp-hud__url">${esc(joinUrl(code))}</div>
      </div>` : ''}
      ${seg ? '' : `<div class="lp-hud__bar">${barHtml}</div>`}`;
    if (seg) seg.innerHTML = '<span class="lp-seg__sep"></span>' + barHtml;

    if (qrOpen) {
      loadQrLib().then((qrcode) => {
        const holder = root.querySelector('[data-qr]');
        if (!holder) return;
        const qr = qrcode(0, 'M');
        qr.addData(joinUrl(code));
        qr.make();
        holder.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
      }).catch(() => { /* QR 없이도 코드/URL로 참여 가능 */ });
    }

    [root, seg].filter(Boolean).flatMap((host) => [...host.querySelectorAll('[data-act]')]).forEach((btn) => {
      btn.addEventListener('click', () => {
        // 목록 버튼(data-key)은 해당 문항 def로, 컨텍스트 버튼은 현재 슬라이드 def로
        let d = def, a = activity;
        if (btn.dataset.key) {
          d = allActivities.find((x) => x.slideKey === btn.dataset.key) || def;
          a = activityFor(d);
        }
        onAction(btn.dataset.act, btn, d, a);
      });
    });
  }

  function onAction(kind, btn, def, activity) {
    btn.blur(); // 덱 키보드 네비게이션 보호
    if (kind === 'qr') { qrOpen = !qrOpen; render(); return; }
    if (kind === 'list') { listOpen = !listOpen; render(); return; }
    if (kind === 'interact') {
      const on = !allowInteract;
      act(async () => {
        try {
          await driver.setInteract(sessionId, hostToken, on);
        } catch (e) {
          throw new Error('학생 조작 설정 실패: ' + e.message
            + ' (Supabase 마이그레이션 v11 적용 여부를 확인하세요)');
        }
        allowInteract = on;      // hostState 재조회 전에도 즉시 반영
        send({ type: 'interact', on });   // 학생 화면 즉시 반영 (재조회 없음)
      }, btn);
      return;
    }
    if (kind === 'end') {
      if (!confirmingEnd) {
        confirmingEnd = true; render();
        setTimeout(() => { confirmingEnd = false; render(); }, 3500);
        return;
      }
      confirmingEnd = false;
      document.querySelectorAll('.lp-question, .lp-result').forEach((el) => el.remove());
      act(async () => {
        await driver.endSession(sessionId, hostToken);
        send({ type: 'end' });
        ended = true;   // 재조회 전에도 즉시 종료 표시 (schedulePoll도 여기서 멈춘다)
      }, btn);
      return;
    }
    if (!def) return;
    if (kind === 'open') {
      act(async () => {
        const pub = await driver.openActivity(sessionId, hostToken, {
          slideKey: def.slideKey, slideIndex: def.slideIndex,
          kind: def.kind, prompt: def.prompt, config: configOf(def),
        });
        send({ type: 'activity', activity: pub });   // 학생 즉시 표시 (재조회 없음)
        showQuestion(def, pub);   // 문항을 슬라이드 위 모달로 표시
      }, btn);
    } else if (kind === 'qshow' && activity) {
      showQuestion(def, { kind: activity.kind, prompt: activity.prompt,
        gamify: !!(state && state.session && state.session.gamify
          && ['choice', 'ox'].includes(activity.kind)
          && activity.config && 'answer' in activity.config),
        config: { ...(activity.config || {}) , answer: undefined } });
    } else if (kind === 'round2' && activity) {
      act(async () => {
        const pub = await driver.advanceRound(sessionId, hostToken, activity.id);
        send({ type: 'activity', activity: pub });
      }, btn);
    } else if (kind === 'close' && activity) {
      // 문항 닫기: 문항/결과 화면을 교사(여기)·학생 양쪽에서 없앤다
      document.querySelectorAll('.lp-question, .lp-result').forEach((el) => el.remove());
      act(async () => {
        await driver.closeActivity(sessionId, hostToken, activity.id);
        send({ type: 'close', activityId: activity.id });
      }, btn);
    } else if (kind === 'reveal' && activity) {
      act(async () => {
        const agg = await driver.revealActivity(sessionId, hostToken, activity.id);
        send({ type: 'reveal', activityId: activity.id, agg });
        showResult(def, { ...activity, status: 'revealed' }, agg);
      }, btn);
    } else if (kind === 'show' && activity) {
      showResult(def, activity, revealedAgg(activity));
    } else if (kind === 'codes' && activity) {
      showCodeBrowser(activity);
    }
  }

  // 정규형 def의 DB config (live.js가 {slideKey, slideIndex, kind, prompt, config}로 정규화)
  function configOf(def) {
    return def.config || {};
  }

  // 다른 컨트롤러(교사 콘솔)가 보낸 이벤트 → 이 화면의 문항/결과 모달을 동기화
  // (자기 자신이 보낸 브로드캐스트는 수신되지 않음 — supabase broadcast self:false 기본값)
  function onLiveEvent(p) {
    if (!p || !p.type) return;
    if (p.type === 'activity' && p.activity) {
      const def = allActivities.find((x) => x.slideKey === p.activity.slideKey)
        || { kind: p.activity.kind, prompt: p.activity.prompt, config: p.activity.config };
      showQuestion(def, p.activity);
      refreshSoon();
    } else if (p.type === 'reveal') {
      const act = state && (state.activities || []).find((x) => x.id === p.activityId);
      if (act && p.agg) {
        showResult({ config: act.config }, { ...act, status: 'revealed' }, p.agg);
      }
      refreshSoon();
    } else if (p.type === 'close') {
      document.querySelectorAll('.lp-question, .lp-result').forEach((el) => el.remove());
      refreshSoon();
    } else if (p.type === 'end') {
      document.querySelectorAll('.lp-question, .lp-result').forEach((el) => el.remove());
      refresh();
    } else if (p.type === 'interact') {
      allowInteract = !!p.on;
      render();
      refreshSoon();
    } else if (p.type === 'submitted') {
      refreshSoon();
    }
  }

  refresh().then(schedulePoll);

  return {
    onSlideChange(idx) {
      currentIdx = idx;
      render();
      schedulePoll();
    },
    refreshSoon,
    onLiveEvent,
  };
}
