// live/runtime/driver.js — LiveDriver 추상화
//
// 모든 드라이버는 아래 계약을 구현한다. Supabase(기본)와 Apps Script(Phase 2)가
// 동일 인터페이스를 제공하므로 UI 레이어는 백엔드를 모른다.
//
// ── 교사(호스트) ──
//  createSession({passphrase, title, deckPath, nameMode})
//      → {sessionId, code, hostToken, title, nameMode}
//  resumeSession(code, hostToken) → {sessionId, code, hostToken, status, currentSlide, ...}
//  setSlide(sessionId, hostToken, slideIndex) → void
//  setInteract(sessionId, hostToken, on) → {allowInteract}
//      학생 미러 화면의 클릭 차단막을 풀거나 다시 잠근다 (세션 플래그, v11)
//  openActivity(sessionId, hostToken, {slideKey, slideIndex, kind, prompt, config})
//      → 학생용 activity JSON (정답 제거됨)   ※ slideKey 기준 idempotent
//  closeActivity(sessionId, hostToken, activityId) → void
//  advanceRound(sessionId, hostToken, activityId) → 학생용 activity JSON (Peer Instruction 2차 투표 시작)
//  revealActivity(sessionId, hostToken, activityId) → 공개용 집계(정답 포함)
//  endSession(sessionId, hostToken) → void
//  hostState(sessionId, hostToken) → {session, participantCount, participants[], activities[](집계 포함)}
//  exportSession(sessionId, hostToken) → 세션 전체 데이터 dump
//
// ── 학생 ──
//  join(code, {clientId, nickname, studentNo})
//      → {sessionId, participantId, title, nameMode, currentActivity, myResponses}
//  submit(activityId, participantId, clientId, payload, round=1) → {ok} | {ok:false, reason}
//  studentState(code, clientId) → {status, currentActivity, revealedAggregates}
//
// ── 실시간(선택) ──
//  connectChannel(code, onPing) → {ok, send(payload), close()}
//      broadcast는 "상태가 바뀌었다"는 핑(ping)만 나른다. 실제 상태는 항상
//      studentState/hostState 재조회로 가져온다(단일 코드 경로 + 유실 내성).
//      폴링 전용 드라이버는 {ok:false, ...no-op}을 반환해도 UI가 정상 동작해야 한다.

import { getConfig } from './config.js?v=2';

export async function createDriver() {
  const cfg = getConfig();
  if (cfg.driver === 'apps-script') {
    const mod = await import('./drivers/apps-script-driver.js?v=1');
    return mod.default;
  }
  const mod = await import('./drivers/supabase-driver.js?v=2');
  return mod.default;
}
