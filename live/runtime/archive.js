// live/runtime/archive.js — 세션 결과를 Google Sheets로 아카이빙
//
// lp_export_session 덤프(원시 테이블 행)를 사람이 읽을 수 있는 형태로 변환해
// 활동지 공용 Apps Script(source: 'live_session_archive')로 전송한다.
//
// 전송은 Content-Type: text/plain 단순 요청 — preflight가 없어 GAS와 호환되고,
// 리다이렉트를 따라간 최종 응답(JSON)을 읽을 수 있다(기존 활동지 no-cors의 무응답 한계 극복).

import { getConfig } from './config.js?v=1';

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d) ? String(iso) : d.toLocaleString('ko-KR');
}

function answerTextOf(kind, config, payload) {
  if (!payload) return '';
  if (kind === 'choice') {
    const i = payload.choice;
    const opt = (config.options || [])[i];
    return (i === null || i === undefined) ? '' : `${i + 1}. ${opt ?? ''}`;
  }
  if (kind === 'ox') return payload.ox === true ? 'O' : payload.ox === false ? 'X' : '';
  if (kind === 'exit') {
    const t = (payload.text || '').trim();
    return `[${payload.rating ?? '-'}/5]${t ? ' ' + t : ''}`;
  }
  if (kind === 'code') {
    const head = Number.isInteger(payload.total) && payload.total > 0
      ? `[${payload.passed}/${payload.total} 통과] ` : '';
    return head + String(payload.code || '').slice(0, 1000);
  }
  return payload.text ?? '';
}

function correctAnswerTextOf(kind, config) {
  if (!config || config.answer === undefined || config.answer === null) return '';
  if (kind === 'choice') {
    const opt = (config.options || [])[config.answer];
    return `${config.answer + 1}. ${opt ?? ''}`;
  }
  if (kind === 'ox') return config.answer === true ? 'O' : 'X';
  return '';
}

function distributionOf(kind, config, responses) {
  if (kind === 'choice') {
    const counts = (config.options || []).map(() => 0);
    responses.forEach((r) => {
      const i = r.payload && r.payload.choice;
      if (Number.isInteger(i) && i >= 0 && i < counts.length) counts[i]++;
    });
    return counts.map((c, i) => `${i + 1}×${c}`).join(' · ');
  }
  if (kind === 'ox') {
    let o = 0, x = 0;
    responses.forEach((r) => {
      if (r.payload && r.payload.ox === true) o++;
      else if (r.payload && r.payload.ox === false) x++;
    });
    return `O×${o} · X×${x}`;
  }
  if (kind === 'exit') {
    const counts = [0, 0, 0, 0, 0];
    let sum = 0, n = 0;
    responses.forEach((r) => {
      const v = r.payload && r.payload.rating;
      if (Number.isInteger(v) && v >= 1 && v <= 5) { counts[v - 1]++; sum += v; n++; }
    });
    const avg = n ? (sum / n).toFixed(1) : '-';
    return `평균 ${avg} · ` + counts.map((c, i) => `${i + 1}×${c}`).join(' · ');
  }
  if (kind === 'wordcloud') {
    const freq = new Map();
    responses.forEach((r) => {
      const w = ((r.payload && r.payload.text) || '').trim().replace(/\s+/g, ' ');
      if (w) freq.set(w, (freq.get(w) || 0) + 1);
    });
    return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([w, c]) => `${w}×${c}`).join(' · ');
  }
  if (kind === 'code') {
    const graded = responses.filter((r) => r.payload && Number.isInteger(r.payload.total) && r.payload.total > 0);
    if (!graded.length) return `제출 ${responses.length}건`;
    const full = graded.filter((r) => r.payload.passed === r.payload.total).length;
    const avg = graded.reduce((s, r) => s + r.payload.passed / r.payload.total, 0) / graded.length;
    return `전부 통과 ${full}/${graded.length}명 · 평균 통과율 ${Math.round(avg * 100)}%`;
  }
  return '';
}

// lp_export_session 덤프 → GAS 전송 페이로드
export function buildArchivePayload(dump) {
  const sess = dump.session || {};
  const participants = dump.participants || [];
  const activities = dump.activities || [];
  const responses = dump.responses || [];

  const partById = new Map(participants.map((p) => [p.id, p]));
  const respByAct = new Map();
  responses.forEach((r) => {
    if (!respByAct.has(r.activity_id)) respByAct.set(r.activity_id, []);
    respByAct.get(r.activity_id).push(r);
  });

  const actRows = activities.map((a) => {
    const rs = respByAct.get(a.id) || [];
    const rounds = [...new Set(rs.map((r) => r.round || 1))].sort();
    const isMulti = rounds.length > 1 || (a.current_round || 1) > 1;
    // Peer Instruction: 라운드별 분포 분리, 정답률은 최종(2차) 라운드 기준
    const distribution = isMulti
      ? rounds.map((rd) => `${rd}차: ${distributionOf(a.kind, a.config || {}, rs.filter((r) => (r.round || 1) === rd))}`).join(' / ')
      : distributionOf(a.kind, a.config || {}, rs);
    const finalRound = rounds.length ? Math.max(...rounds) : 1;
    const gradedPool = isMulti ? rs.filter((r) => (r.round || 1) === finalRound) : rs;
    const graded = gradedPool.filter((r) => r.is_correct !== null && r.is_correct !== undefined);
    return {
      slideKey: a.slide_key,
      kind: a.kind,
      prompt: a.prompt,
      optionsText: ((a.config && a.config.options) || []).map((o, i) => `${i + 1}. ${o}`).join('\n'),
      answerText: correctAnswerTextOf(a.kind, a.config),
      responseCount: rs.length,
      correctRate: graded.length ? Math.round((graded.filter((r) => r.is_correct).length / graded.length) * 100) : null,
      distribution,
    };
  });

  const actById = new Map(activities.map((a) => [a.id, a]));
  const respRows = responses.map((r) => {
    const a = actById.get(r.activity_id) || {};
    const p = partById.get(r.participant_id) || {};
    return {
      prompt: a.prompt || '',
      kind: a.kind || '',
      nickname: p.nickname || '',
      studentNo: p.student_no || '',
      round: r.round || 1,
      answerText: answerTextOf(a.kind, a.config || {}, r.payload),
      isCorrect: r.is_correct,
      submittedAt: fmtDate(r.created_at),
    };
  });

  return {
    source: 'live_session_archive',
    session: {
      code: sess.code,
      title: sess.title || '',
      deckPath: sess.deck_path || '',
      createdAt: fmtDate(sess.created_at),
      endedAt: fmtDate(sess.ended_at),
      participantCount: participants.length,
    },
    activities: actRows,
    responses: respRows,
  };
}

// 시트 저장 실행 → {status:'ok', rows:{sessions,activities,responses}, sheetUrl}
// targetUrl 을 주면 그 시트(과목별 Apps Script)로, 없으면 config 기본값으로 보낸다.
export async function archiveToSheet(dump, targetUrl) {
  const url = targetUrl || getConfig().appsScriptUrl;
  if (!url) throw new Error('결과를 저장할 시트가 선택되지 않았습니다');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // 단순 요청 → preflight 없음
    body: JSON.stringify(buildArchivePayload(dump)),
  });
  let data = null;
  try { data = await res.json(); } catch (e) {
    throw new Error('시트 응답을 읽지 못했습니다 (배포 액세스 권한 확인 필요)');
  }
  if (!res.ok || data.status !== 'ok') {
    throw new Error(data && data.message ? data.message : `시트 저장 실패 (HTTP ${res.status})`);
  }
  return data;
}
