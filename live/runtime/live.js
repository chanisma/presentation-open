// live/runtime/live.js — 라이브 레이어 진입점 (덱 호스트 모드)
//
// 로드 경로 두 가지 (동작 동일):
//   · Contract v1 덱: deck.js가 ?live= 감지 시 동적 import
//   · legacy 덱: </body> 직전 <script type="module" src="../../live/runtime/live.js?v=3">
//     (?live= 파라미터가 없으면 아무것도 하지 않음 → 기존 덱 100% 무해)
//
// 문항 소스 두 가지 (병합, id 충돌 시 quiz.json 우선):
//   · <수업폴더>/quiz.json — 권장. 덱 HTML 무수정으로 문항 관리
//     { "version": 1, "activities": [ { "id", "slide": 숫자|"last"|생략, "kind", "prompt", … } ] }
//   · 덱 내 data-live 슬라이드 마크업 (legacy, script.live-config JSON)
//
// slide 바인딩이 없는 문항도 미니바 [문항 ▾] 목록에서 아무 슬라이드에서나 열 수 있다.
// 슬라이드 동기화는 .slide.active 클래스 관찰(MutationObserver) — 인라인 네비 덱·deck.js 덱 공용.

import { loadHostSession } from './config.js?v=2';
import { createDriver } from './driver.js?v=1';

const params = new URLSearchParams(location.search);
const code = (params.get('live') || '').trim().toUpperCase();

if (code) {
  init().catch((e) => {
    console.error('[live] 초기화 실패:', e);
    banner('라이브 세션 연결 실패: ' + e.message);
  });
}

function banner(msg) {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:100000;'
    + 'background:#b91c1c;color:#fff;padding:10px 18px;border-radius:10px;'
    + "font-family:'Noto Sans KR',sans-serif;font-size:14px;box-shadow:0 4px 14px rgba(0,0,0,.35)";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 8000);
}

// ── 문항 정규형: { slideKey, slideIndex|null, kind, prompt, config } ──

// legacy: 덱의 data-live 슬라이드 마크업에서 수집
function collectMarkupActivities() {
  const out = [];
  document.querySelectorAll('.slide').forEach((slide, index) => {
    if (!slide.hasAttribute('data-live')) return;
    const cfgEl = slide.querySelector('script.live-config');
    if (!cfgEl) return;
    let raw;
    try { raw = JSON.parse(cfgEl.textContent); } catch (e) {
      console.warn('[live] live-config JSON 파싱 실패 (slide ' + index + ')', e);
      return;
    }
    const { kind, prompt, ...config } = raw;
    out.push({
      slideKey: slide.getAttribute('data-live-id') || ('s' + index + '-' + (kind || 'quiz')),
      slideIndex: index, kind, prompt, config,
    });
  });
  return out;
}

// 신규: 수업 폴더의 quiz.json (없으면 조용히 빈 배열)
async function loadQuizJson(slideCount) {
  try {
    const res = await fetch(new URL('quiz.json', document.baseURI));
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data.activities) ? data.activities : [])
      .map((a) => {
        const { id, slide, kind, prompt, ...config } = a;
        let slideIndex = null;
        if (slide === 'last') slideIndex = slideCount - 1;
        else if (Number.isInteger(slide)) slideIndex = slide;
        return { slideKey: id, slideIndex, kind, prompt, config };
      })
      .filter((d) => d.slideKey && d.kind && typeof d.prompt === 'string');
  } catch (e) {
    console.warn('[live] quiz.json 로드 실패:', e.message);
    return [];
  }
}

function activeSlideIndex() {
  const slides = [...document.querySelectorAll('.slide')];
  return slides.findIndex((s) => s.classList.contains('active'));
}

async function init() {
  const isHost = params.get('host') === '1';
  if (!isHost) return; // 학생은 join 페이지 사용 — 덱에서는 호스트 모드만 동작

  const saved = loadHostSession(code);
  if (!saved || !saved.hostToken) {
    banner(`세션 ${code}의 호스트 정보가 이 브라우저에 없습니다. 교사 콘솔(live/host/)에서 세션을 열어주세요.`);
    return;
  }

  const driver = await createDriver();
  const session = await driver.resumeSession(code, saved.hostToken); // 유효성 검증 겸 상태 복구
  if (session.status === 'ended') {
    banner('이미 종료된 세션입니다. 교사 콘솔에서 새 세션을 만들어주세요.');
    return;
  }

  // 문항 병합: markup(legacy) ← quiz.json(우선)
  const slideCount = document.querySelectorAll('.slide').length;
  const byKey = new Map();
  collectMarkupActivities().forEach((d) => byKey.set(d.slideKey, d));
  (await loadQuizJson(slideCount)).forEach((d) => byKey.set(d.slideKey, d));
  const activities = [...byKey.values()];
  const liveSlides = new Map(
    activities.filter((d) => Number.isInteger(d.slideIndex)).map((d) => [d.slideIndex, d]));

  const ctx = {
    driver,
    code,
    sessionId: session.sessionId,
    hostToken: saved.hostToken,
    liveSlides,          // slideIndex → def (현재 슬라이드 컨텍스트 버튼)
    activities,          // 전체 def (미니바 [문항 ▾] 목록)
    channel: await driver.connectChannel(code, (p) => {
      // 학생 제출 핑 → 카운트 갱신 / 콘솔발 열기·공개·닫기 → 모달 동기화
      if (overlayApi) overlayApi.onLiveEvent(p);
    }),
  };

  // 현재 슬라이드 동기화: .slide.active 클래스 토글 관찰 (덱 JS 무수정 통합)
  let overlayApi = null;
  let lastIndex = -1;
  let slideTimer = null;
  // 연타 시 브로드캐스트 순서 역전 대비 — 수신 측이 옛 핑을 버릴 수 있게
  // 단조 증가 seq 동봉 (Date.now 기반: 호스트 새로고침 후에도 계속 증가)
  let slideSeq = 0;
  const syncSlide = () => {
    const idx = activeSlideIndex();
    if (idx < 0 || idx === lastIndex) return;
    lastIndex = idx;
    slideSeq = Math.max(slideSeq + 1, Date.now());
    // 학생 미러는 즉시 (디바운스 없이 인덱스 동봉 — 재조회 불필요)
    ctx.channel.send({ type: 'slide', index: idx, seq: slideSeq });
    // DB 반영(재접속 복구용)만 디바운스
    clearTimeout(slideTimer);
    slideTimer = setTimeout(() => {
      ctx.driver.setSlide(ctx.sessionId, ctx.hostToken, idx).catch(() => { /* 비필수 */ });
    }, 400);
    if (overlayApi) overlayApi.onSlideChange(idx);
  };
  const observer = new MutationObserver(syncSlide);
  document.querySelectorAll('.slide').forEach((s) => {
    observer.observe(s, { attributes: true, attributeFilter: ['class'] });
  });

  // 교사 미니바 장착
  const { mountHostOverlay } = await import('./host-overlay.js?v=4');
  overlayApi = mountHostOverlay(ctx);
  syncSlide();
}
