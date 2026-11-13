// live/runtime/drivers/apps-script-driver.js — Apps Script 드라이버 (Phase 2 자리표시자)
//
// driver.js의 LiveDriver 계약을 구현할 예정. 아직 미구현이며,
// localStorage lp.config에서 driver를 'apps-script'로 바꾼 경우에만 로드된다.
// (이 파일이 없으면 Vite dev 서버가 driver.js의 동적 import를 사전 해석하다
//  500을 내므로, 명시적 스텁으로 둔다 — 프로덕션 정적 서빙에는 영향 없음)

function notImplemented() {
  throw new Error(
    'Apps Script 드라이버는 아직 구현되지 않았습니다. lp.config의 driver를 "supabase"로 되돌려주세요.'
  );
}

const driver = {
  name: 'apps-script',
  createSession: notImplemented,
  resumeSession: notImplemented,
  setSlide: notImplemented,
  setInteract: notImplemented,
  openActivity: notImplemented,
  closeActivity: notImplemented,
  advanceRound: notImplemented,
  revealActivity: notImplemented,
  endSession: notImplemented,
  hostState: notImplemented,
  exportSession: notImplemented,
  codeSubmissions: notImplemented,
  join: notImplemented,
  submit: notImplemented,
  studentState: notImplemented,
  async connectChannel() {
    return { ok: false, send() {}, close() {} };
  },
};

export default driver;
