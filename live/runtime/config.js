// live/runtime/config.js — 라이브 레이어 공용 설정
// 우선순위: localStorage 'lp.config' 오버라이드 > 기본값
// (활동지의 ⚙ URL override 패턴과 동일한 관례)

const DEFAULTS = {
  driver: 'supabase',            // 'supabase' | 'apps-script' (Phase 2)
  supabaseUrl: 'https://your-project-ref.supabase.co',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
  // 세션 아카이브 대상 — 정보 과목 활동지 공용 Apps Script (source: live_session_archive 분기)
  appsScriptUrl: 'https://script.google.com/macros/s/YOUR_WEBAPP_ID/exec',
};

export function getConfig() {
  let override = {};
  try { override = JSON.parse(localStorage.getItem('lp.config') || '{}'); } catch (e) { /* 무시 */ }
  return { ...DEFAULTS, ...override };
}

export function setConfig(patch) {
  const cur = getConfig();
  const next = { ...cur, ...patch };
  const diff = {};
  for (const k of Object.keys(next)) {
    if (next[k] !== DEFAULTS[k]) diff[k] = next[k];
  }
  localStorage.setItem('lp.config', JSON.stringify(diff));
}

// live/ 디렉터리 절대 URL (로컬 serve·Netlify 루트·서브패스 서빙 모두 대응 — 페이지가 아닌 모듈 URL 기준)
export function liveBase() {
  return new URL('../', import.meta.url);
}

// 학생 참여 페이지 URL — React SPA 라우트(?app=join). 모듈 URL 기준이라
// 서브패스 서빙에도 안전. 구 live/join/ 링크는 리다이렉트로 보존된다.
export function joinUrl(code) {
  const u = new URL('../', liveBase()); // 사이트 루트
  u.searchParams.set('app', 'join');
  if (code) u.searchParams.set('code', code);
  return u.href;
}

// 학생 브라우저 고유 ID (최초 1회 생성, 재접속 시 동일 참가자로 복구)
export function getClientId() {
  let id = localStorage.getItem('lp.clientId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('lp.clientId', id);
  }
  return id;
}

// 교사 세션 보관 (콘솔 → 덱 호스트 모드 핸드오프; 같은 origin의 localStorage 공유 활용)
export function saveHostSession(info) {
  localStorage.setItem('lp.host.' + info.code, JSON.stringify({ ...info, savedAt: Date.now() }));
}

export function loadHostSession(code) {
  try { return JSON.parse(localStorage.getItem('lp.host.' + code) || 'null'); } catch (e) { return null; }
}

export function listHostSessions() {
  const out = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('lp.host.')) {
      try { out.push(JSON.parse(localStorage.getItem(k))); } catch (e) { /* 무시 */ }
    }
  }
  return out.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
}

export function removeHostSession(code) {
  localStorage.removeItem('lp.host.' + code);
}
