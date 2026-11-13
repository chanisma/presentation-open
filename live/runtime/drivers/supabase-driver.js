// live/runtime/drivers/supabase-driver.js — Supabase 드라이버
// 데이터 접근: REST RPC(fetch) / 실시간 핑: broadcast 채널(vendor UMD lazy load)

import { getConfig } from '../config.js?v=1';

async function rpc(fn, args) {
  const { supabaseUrl, supabaseAnonKey } = getConfig();
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args || {}),
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  if (!res.ok) {
    const msg = (data && (data.message || data.hint || data.error)) || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

// ── supabase-js UMD lazy load (자체 origin 서빙 — CDN 차단 학교망 대응) ──
let libPromise = null;
function loadLib() {
  if (window.supabase && window.supabase.createClient) return Promise.resolve(window.supabase);
  if (!libPromise) {
    libPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = new URL('../../vendor/supabase.umd.js?v=1', import.meta.url).href;
      s.onload = () => resolve(window.supabase);
      s.onerror = () => reject(new Error('supabase.umd.js 로드 실패'));
      document.head.appendChild(s);
    });
  }
  return libPromise;
}

let client = null;
async function getClient() {
  const lib = await loadLib();
  if (!client) {
    const { supabaseUrl, supabaseAnonKey } = getConfig();
    client = lib.createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 40 } },  // 슬라이드 연타 시 송신 지연 방지 (기본 10/s)
    });
  }
  return client;
}

const driver = {
  name: 'supabase',

  // ── 교사 ──
  // v10부터 세션 생성에 비밀구절이 없다 — anon 키만으로 생성 (조작은 host_token 게이트)
  createSession({ title, deckPath, nameMode, gamify }) {
    return rpc('lp_create_session', {
      p_title: title || '',
      p_deck_path: deckPath || null, p_name_mode: nameMode || 'anonymous',
      // v7 이전 DB와의 호환: 체크했을 때만 파라미터 전송 (미지정 시 구 시그니처로도 동작)
      ...(gamify ? { p_gamify: true } : {}),
    });
  },
  resumeSession(code, hostToken) {
    return rpc('lp_resume_session', { p_code: code, p_host_token: hostToken });
  },
  setSlide(sessionId, hostToken, slideIndex) {
    return rpc('lp_set_slide', { p_session_id: sessionId, p_host_token: hostToken, p_slide_index: slideIndex });
  },
  // v11: 학생 미러 화면의 클릭 차단 해제/재잠금 (학생은 join·studentState로 수신)
  setInteract(sessionId, hostToken, on) {
    return rpc('lp_set_interact', { p_session_id: sessionId, p_host_token: hostToken, p_on: !!on });
  },
  openActivity(sessionId, hostToken, { slideKey, slideIndex, kind, prompt, config }) {
    return rpc('lp_open_activity', {
      p_session_id: sessionId, p_host_token: hostToken,
      p_slide_key: slideKey, p_slide_index: slideIndex ?? null,
      p_kind: kind, p_prompt: prompt, p_config: config || {},
    });
  },
  closeActivity(sessionId, hostToken, activityId) {
    return rpc('lp_close_activity', { p_session_id: sessionId, p_host_token: hostToken, p_activity_id: activityId });
  },
  advanceRound(sessionId, hostToken, activityId) {
    return rpc('lp_advance_round', { p_session_id: sessionId, p_host_token: hostToken, p_activity_id: activityId });
  },
  revealActivity(sessionId, hostToken, activityId) {
    return rpc('lp_reveal_activity', { p_session_id: sessionId, p_host_token: hostToken, p_activity_id: activityId });
  },
  endSession(sessionId, hostToken) {
    return rpc('lp_end_session', { p_session_id: sessionId, p_host_token: hostToken });
  },
  hostState(sessionId, hostToken) {
    return rpc('lp_host_state', { p_session_id: sessionId, p_host_token: hostToken });
  },
  exportSession(sessionId, hostToken) {
    return rpc('lp_export_session', { p_session_id: sessionId, p_host_token: hostToken });
  },
  codeSubmissions(sessionId, hostToken, activityId) {
    return rpc('lp_code_submissions', { p_session_id: sessionId, p_host_token: hostToken, p_activity_id: activityId });
  },

  // ── 학생 ──
  join(code, { clientId, nickname, studentNo }) {
    return rpc('lp_join', {
      p_code: code, p_client_id: clientId,
      p_nickname: nickname || '', p_student_no: studentNo || null,
    });
  },
  submit(activityId, participantId, clientId, payload, round = 1) {
    return rpc('lp_submit', {
      p_activity_id: activityId, p_participant_id: participantId,
      p_client_id: clientId, p_payload: payload, p_round: round,
    });
  },
  studentState(code, clientId) {
    return rpc('lp_student_state', { p_code: code, p_client_id: clientId });
  },

  // ── 실시간 핑 채널 ──
  // 반환된 send는 호스트가 상태 변경 후 호출; onPing 수신자는 상태 재조회를 트리거.
  // 연결 실패(ok:false) 시에도 no-op을 반환 → UI는 폴링만으로 동작 (학교망 wss 차단 대비)
  async connectChannel(code, onPing) {
    try {
      const sb = await getClient();
      const ch = sb.channel('live:' + String(code).toUpperCase());
      ch.on('broadcast', { event: 'update' }, (msg) => {
        try { onPing(msg.payload || {}); } catch (e) { /* UI 오류가 채널을 죽이지 않게 */ }
      });
      const ok = await new Promise((resolve) => {
        const timer = setTimeout(() => resolve(false), 7000);
        ch.subscribe((status) => {
          if (status === 'SUBSCRIBED') { clearTimeout(timer); resolve(true); }
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            clearTimeout(timer); resolve(false);
          }
        });
      });
      return {
        ok,
        send(payload) {
          if (!ok) return;
          try { ch.send({ type: 'broadcast', event: 'update', payload: payload || {} }); } catch (e) { /* 무시 */ }
        },
        close() { try { sb.removeChannel(ch); } catch (e) { /* 무시 */ } },
      };
    } catch (e) {
      return { ok: false, send() {}, close() {} };
    }
  },
};

export default driver;
