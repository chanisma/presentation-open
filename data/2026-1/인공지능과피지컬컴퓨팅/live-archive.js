/**
 * 라이브 세션 아카이브 — 실시간 퀴즈(live/) 세션 결과를 시트에 저장
 *
 * live/runtime/archive.js 가 source: 'live_session_archive' 로 전송한다.
 * apps-script.js 의 doPost()가 이 파일의 handleLiveSessionArchive()로 위임.
 *
 * 저장 구조 (탭 3개, 없으면 자동 생성):
 *   라이브_세션 — 세션당 1행 (요약)
 *   라이브_문항 — 문항당 1행 (정답률·응답분포 포함)
 *   라이브_응답 — 응답당 1행 (닉네임·응답 내용·정답여부)
 *
 * 같은 세션코드를 다시 저장하면 해당 코드의 기존 행을 지우고 새로 쓴다(덮어쓰기).
 */

var LIVE_ARCHIVE_HEADERS = {
  sessions:   ['저장시각', '세션코드', '제목', '덱경로', '시작시각', '종료시각', '참여자수', '문항수', '응답수'],
  activities: ['세션코드', '문항키', '유형', '문항', '보기', '정답', '응답수', '정답률(%)', '응답분포'],
  responses:  ['세션코드', '문항', '유형', '닉네임', '학번', '라운드', '응답', '정답여부', '제출시각']
};

function handleLiveSessionArchive(data, ss) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sess = data.session || {};
    var code = String(sess.code || '').trim();
    if (!code) throw new Error('세션 코드가 없습니다');

    var sessionRow = [
      new Date().toLocaleString('ko-KR'),
      code,
      sess.title || '',
      sess.deckPath || '',
      sess.createdAt || '',
      sess.endedAt || '',
      sess.participantCount || 0,
      (data.activities || []).length,
      (data.responses || []).length
    ];

    var activityRows = (data.activities || []).map(function (a) {
      return [code, a.slideKey || '', a.kind || '', a.prompt || '',
              a.optionsText || '', a.answerText || '',
              a.responseCount || 0,
              (a.correctRate === null || a.correctRate === undefined) ? '' : a.correctRate,
              a.distribution || ''];
    });

    var responseRows = (data.responses || []).map(function (r) {
      return [code, r.prompt || '', r.kind || '', r.nickname || '', r.studentNo || '',
              r.round || 1, r.answerText || '',
              (r.isCorrect === true) ? '정답' : (r.isCorrect === false) ? '오답' : '',
              r.submittedAt || ''];
    });

    var rows = {
      sessions:   upsertLiveRows_(ss, '라이브_세션', LIVE_ARCHIVE_HEADERS.sessions, 2, code, [sessionRow]),
      activities: upsertLiveRows_(ss, '라이브_문항', LIVE_ARCHIVE_HEADERS.activities, 1, code, activityRows),
      responses:  upsertLiveRows_(ss, '라이브_응답', LIVE_ARCHIVE_HEADERS.responses, 1, code, responseRows)
    };

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', code: code, rows: rows, sheetUrl: ss.getUrl() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * 시트 탭에 코드 기준 덮어쓰기 저장.
 * @param {number} codeCol - 세션코드가 있는 열 (1-base)
 * @return {number} 기록한 행 수
 */
function upsertLiveRows_(ss, name, headers, codeCol, code, rows) {
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    var h = sheet.getRange(1, 1, 1, headers.length);
    h.setBackground('#1E2033');
    h.setFontColor('#FFFFFF');
    h.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  // 같은 세션코드의 기존 행 삭제 (아래쪽부터 — 행 번호 밀림 방지)
  var last = sheet.getLastRow();
  if (last > 1) {
    var codes = sheet.getRange(2, codeCol, last - 1, 1).getValues();
    for (var i = codes.length - 1; i >= 0; i--) {
      if (String(codes[i][0]).trim() === code) sheet.deleteRow(i + 2);
    }
  }

  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
  }
  return rows.length;
}
