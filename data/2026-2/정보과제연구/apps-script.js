/**
 * 정보과제연구 (2026-2) 활동지 — Google Apps Script (과목 공용)
 *
 * 이 스크립트 하나로 '정보과제연구' 과목의 모든 활동지 데이터를 받아
 * 활동지 종류(source)에 따라 각기 다른 시트 탭에 자동 저장합니다.
 * (인공지능 기초 apps-script.js와 같은 구조 — source 분기·doGet lookup·board)
 *
 * [등록된 활동지]
 *   - 'data_service_idea' → 데이터서비스기획서 시트 (데이터의 가치와 활용 · 2차시)
 *   - 'vibe_coding_log'   → 바이브코딩프롬프트기록 시트 (바이브코딩 · 3차시)

 *
 * [기능]
 *   - doPost : 활동지 제출 저장 (암호는 SHA-256 해시로만 저장, 원문 저장 안 함)
 *   - doGet  : 제출 확인·불러오기 ?action=lookup&source=…&studentId=…&studentName=…&password=…
 *              (&callback=fn 을 붙이면 JSONP)
 *   - doGet  : 제출 현황판 ?action=board&studentId=…&studentName=…
 *
 * [새 활동지 추가 방법]
 *   1. 활동지 HTML의 getFormData()에 source: '식별자' 추가
 *   2. 이 파일에 [시트 헤더, 폼 키] 배열을 만들고 SOURCES에 한 줄 등록
 *   3. 현황판에 띄우려면 ASSIGNMENTS에도 한 줄 추가
 *   4. 재배포 (배포 관리 → 새 버전)
 *
 * [최초 설정 — workspace-setup 스킬]
 * 1. Google 스프레드시트 새로 만들기 (2026-2 정보과제연구 활동지 모음)
 * 2. 확장 프로그램 → Apps Script → 이 파일 내용 전체 붙여넣기
 * 3. 배포 → 새 배포 → 웹 앱 · 실행 계정: 나 · 액세스: 모든 사용자 (익명 포함)
 * 4. 배포 URL을 각 활동지.html 의 DEFAULT_URL(또는 ⚙ 설정 패널)에 저장
 * 5. 자동 동기화를 원하면 이 폴더에 .clasp.json(스크립트 ID) + .clasp-deployment(배포 ID)
 */

/* ── 데이터에서 서비스로 · 한 문장 기획서 — 시트 정의 (doPost·doGet 공용) ──
   [시트 헤더, 폼 필드 키] 쌍. 이 배열 하나만 고치면 저장·조회가 함께 따라간다. */
var DATA_SERVICE_SHEET = '데이터서비스기획서';
var DATA_SERVICE_FIELDS = [
  ['이름', 'studentName'],
  ['학번', 'studentId'],
  ['날짜', 'today'],
  ['1_데이터1', 'd1Name'], ['1_데이터1_출처', 'd1Src'], ['1_데이터1_컬럼', 'd1Cols'],
  ['1_데이터2', 'd2Name'], ['1_데이터2_출처', 'd2Src'], ['1_데이터2_컬럼', 'd2Cols'],
  ['1_데이터3', 'd3Name'], ['1_데이터3_출처', 'd3Src'], ['1_데이터3_컬럼', 'd3Cols'],
  ['2_주력데이터', 'flipTarget'],
  ['2_원래목적', 'flipPurpose'],
  ['2_질문1', 'flipQ1'], ['2_질문2', 'flipQ2'], ['2_질문3', 'flipQ3'], ['2_질문4', 'flipQ4'], ['2_질문5', 'flipQ5'],
  ['3_카드A', 'cardA'], ['3_카드B', 'cardB'],
  ['3_결합', 'lensJoin'], ['3_변환', 'lensTranslate'], ['3_예측', 'lensPredict'], ['3_개방', 'lensOpen'],
  ['4_누가', 'pWho'], ['4_상황', 'pWhen'], ['4_문제', 'pProblem'], ['4_데이터AB', 'pData'], ['4_렌즈', 'pLens'], ['4_무엇', 'pWhat'],
  ['4_한문장기획서', 'pitch'],
  ['5_a_대체행동', 'kA'], ['5_b_데이터접근', 'kB'], ['5_b_접근경로', 'kBAccess'], ['5_c_재방문', 'kC']
];
var PW_COL = '암호해시';

/* ── 바이브코딩 · 프롬프트 기록 — 시트 정의 ── */
var VIBE_SHEET = '바이브코딩프롬프트기록';
var VIBE_FIELDS = [
  ['이름', 'studentName'],
  ['학번', 'studentId'],
  ['날짜', 'today'],
  ['1_처음명령', 'firstCommand'], ['1_기획서', 'planPitch'],
  ['1_대상', 'pTarget'], ['1_목적', 'pPurpose'], ['1_내용', 'pContent'],
  ['1_형식', 'pFormat'], ['1_제약', 'pConstraint'], ['1_성공기준', 'pSuccess'],
  ['1_표본데이터', 'pSample'], ['1_첫프롬프트', 'firstPrompt'],
  ['2_1_카드', 'r1Kind'], ['2_1_목표', 'r1Goal'], ['2_1_명령', 'r1Cmd'], ['2_1_확인', 'r1Check'], ['2_1_다음', 'r1Next'],
  ['2_2_카드', 'r2Kind'], ['2_2_목표', 'r2Goal'], ['2_2_명령', 'r2Cmd'], ['2_2_확인', 'r2Check'], ['2_2_다음', 'r2Next'],
  ['2_3_카드', 'r3Kind'], ['2_3_목표', 'r3Goal'], ['2_3_명령', 'r3Cmd'], ['2_3_확인', 'r3Check'], ['2_3_다음', 'r3Next'],
  ['2_4_카드', 'r4Kind'], ['2_4_목표', 'r4Goal'], ['2_4_명령', 'r4Cmd'], ['2_4_확인', 'r4Check'], ['2_4_다음', 'r4Next'],
  ['2_5_카드', 'r5Kind'], ['2_5_목표', 'r5Goal'], ['2_5_명령', 'r5Cmd'], ['2_5_확인', 'r5Check'], ['2_5_다음', 'r5Next'],
  ['2_함정체크', 'trapsHit'],
  ['3_최종코드', 'finalCode'],
  ['3_수정요청횟수', 'revisionCount'],
  ['3_효과큰요청', 'bestRequest'],
  ['3_다음첫프롬프트에', 'nextMust'],
  ['3_성찰', 'reflection']
];

/* ── 활동지 레지스트리 ────────────────────────────────────────────
   source 문자열 하나로 저장(doPost)과 조회(doGet lookup)가 같은 시트를
   가리킨다. 새 활동지는 여기 한 줄만 추가하면 된다. */
var SOURCES = {
  data_service_idea: { sheet: DATA_SERVICE_SHEET, fields: DATA_SERVICE_FIELDS },
  vibe_coding_log: { sheet: VIBE_SHEET, fields: VIBE_FIELDS }
};
var DEFAULT_SOURCE = 'data_service_idea';

/* ── 과제 목록 — 제출 현황판(action=board)이 훑는 대상 ────────────── */
var ASSIGNMENTS = [
  {
    id: 'data_service_idea',
    title: '데이터에서 서비스로 — 한 문장 기획서',
    lesson: '데이터의 가치와 활용',
    sheet: DATA_SERVICE_SHEET,
    path: 'data/2026-2/정보과제연구/데이터의-가치와-활용/활동지.html'
  },
  {
    id: 'vibe_coding_log',
    title: '바이브코딩 — 프롬프트 기록',
    lesson: '바이브코딩',
    sheet: VIBE_SHEET,
    path: 'data/2026-2/정보과제연구/바이브코딩/활동지.html'
  }
];

/* 선택: 같은 스프레드시트에 '명단' 탭(학번 | 이름)을 두면
   입장 시 실제 수강생인지 확인하고, 미제출자까지 보여 준다. */
var ROSTER_SHEET = '명단';
var SID_PATTERN = /^\d{5}$/;

/* 해시 솔트 — 비밀값이 아니라 무지개표 방지용. 바꾸면 기존 암호가 모두 무효가 된다. */
var PW_SALT = 'kijun-info-research-2026-2';

/** [시트 헤더, 폼 키] 배열 → 시트 헤더 행 */
function headersFor(fields) {
  var h = ['제출시각'];
  for (var i = 0; i < fields.length; i++) h.push(fields[i][0]);
  h.push(PW_COL);
  return h;
}

/** 암호 → SHA-256 hex (원문은 어디에도 저장하지 않는다) */
function hashPassword(pw) {
  pw = String(pw == null ? '' : pw).trim();
  if (!pw) return '';
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, PW_SALT + '|' + pw, Utilities.Charset.UTF_8
  );
  var hex = '';
  for (var i = 0; i < bytes.length; i++) {
    hex += ('0' + (bytes[i] & 0xFF).toString(16)).slice(-2);
  }
  return hex;
}

/** 이름·반 비교용 정규화 — 공백/대소문자 차이로 못 찾는 일을 막는다 */
function normKey(s) {
  return String(s == null ? '' : s).replace(/\s+/g, '').toLowerCase();
}

/** 옛 헤더 이름을 새 이름으로 제자리 변경 (열 위치·데이터 유지) */
var HEADER_RENAMES = { '반/번호': '학번', '3_최종통합프롬프트': '3_최종코드' };

function migrateHeaders(sheet) {
  if (sheet.getLastRow() === 0) return;
  var width = sheet.getLastColumn();
  if (!width) return;
  var row = sheet.getRange(1, 1, 1, width).getValues()[0];
  for (var i = 0; i < row.length; i++) {
    var to = HEADER_RENAMES[String(row[i])];
    if (to) sheet.getRange(1, i + 1).setValue(to);
  }
}

/** 헤더가 없거나 열이 모자라면 채운다 (기존 시트에 암호해시 열 추가 대응) */
function ensureHeaders(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    var h = sheet.getRange(1, 1, 1, headers.length);
    h.setBackground('#2563EB');
    h.setFontColor('#FFFFFF');
    h.setFontWeight('bold');
    sheet.setFrozenRows(1);
    return;
  }
  var width = sheet.getLastColumn();
  if (width < headers.length) {
    var extra = headers.slice(width);
    var rng = sheet.getRange(1, width + 1, 1, extra.length);
    rng.setValues([extra]);
    rng.setBackground('#2563EB');
    rng.setFontColor('#FFFFFF');
    rng.setFontWeight('bold');
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss   = SpreadsheetApp.getActiveSpreadsheet();

    if (data.source === 'live_session_archive') {
      // ── 라이브 세션 아카이브 (live-archive.js가 있으면 위임) ──
      if (typeof handleLiveSessionArchive === 'function') return handleLiveSessionArchive(data, ss);
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'error', message: 'live-archive.js 미설치' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var def = SOURCES[data.source];
    if (def) {
      // ── 등록된 활동지 — source에 해당하는 시트 탭에 한 줄 추가 ──
      // 구버전 페이지(캐시)가 보내는 classInfo도 학번으로 받아 준다
      if (!data.studentId && data.classInfo) data.studentId = data.classInfo;

      var sheet = ss.getSheetByName(def.sheet) || ss.insertSheet(def.sheet);
      migrateHeaders(sheet);
      ensureHeaders(sheet, headersFor(def.fields));

      var row = [new Date().toLocaleString('ko-KR')];
      for (var i = 0; i < def.fields.length; i++) {
        row.push(data[def.fields[i][1]] || '');
      }
      row.push(hashPassword(data.password));
      sheet.appendRow(row);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 제출 확인 · 불러오기 엔드포인트
 * callback 파라미터가 있으면 JSONP(text/javascript)로 감싸 응답한다.
 */
function doGet(e) {
  var p = (e && e.parameter) || {};
  var out;
  try {
    if (p.action === 'lookup') {
      out = lookupSubmission(p);
    } else if (p.action === 'board') {
      out = submissionBoard(p);
    } else {
      out = { status: 'ok', message: '정보과제연구(2026-2) 활동지 엔드포인트' };
    }
  } catch (err) {
    out = { status: 'error', message: err.message };
  }

  var json = JSON.stringify(out);
  if (p.callback && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(p.callback)) {
    return ContentService
      .createTextOutput(p.callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 제출 현황판 — 학번 + 이름으로 입장한 사람에게만 명단을 돌려준다.
 * 자료 내용은 여기서 주지 않는다 (본인 암호로 lookup 해야 함).
 * status: ok | denied(명단에 없음) | error
 */
function submissionBoard(p) {
  var sid = String(p.studentId || '').trim();
  var name = String(p.studentName || '').trim();
  if (!SID_PATTERN.test(sid)) return { status: 'error', message: '학번은 숫자 5자리입니다.' };
  if (!name) return { status: 'error', message: '이름이 필요합니다.' };

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var roster = readRoster(ss);

  if (roster.known) {
    var hit = false;
    for (var i = 0; i < roster.list.length; i++) {
      if (roster.list[i].sidKey === normKey(sid) && roster.list[i].nameKey === normKey(name)) { hit = true; break; }
    }
    if (!hit) {
      Utilities.sleep(400);
      return { status: 'denied' };
    }
  }

  var out = [];
  for (var a = 0; a < ASSIGNMENTS.length; a++) {
    out.push(buildAssignmentBoard(ss, ASSIGNMENTS[a], roster, sid, name));
  }
  return {
    status: 'ok',
    rosterKnown: roster.known,
    viewer: { studentId: sid, studentName: name },
    assignments: out
  };
}

/** '명단' 탭(학번 | 이름) 읽기 — 없으면 known:false */
function readRoster(ss) {
  var sh = ss.getSheetByName(ROSTER_SHEET);
  if (!sh || sh.getLastRow() < 2) return { known: false, list: [] };

  var values = sh.getDataRange().getValues();
  var head = values[0].map(function (h) { return String(h); });
  var sidCol = 0, nameCol = 1;
  for (var c = 0; c < head.length; c++) {
    if (head[c].indexOf('학번') >= 0) sidCol = c;
    else if (head[c].indexOf('이름') >= 0 || head[c].indexOf('성명') >= 0) nameCol = c;
  }

  var list = [];
  for (var r = 1; r < values.length; r++) {
    var sid = String(values[r][sidCol] == null ? '' : values[r][sidCol]).trim();
    var name = String(values[r][nameCol] == null ? '' : values[r][nameCol]).trim();
    if (!sid || !name) continue;
    list.push({ sid: sid, name: name, sidKey: normKey(sid), nameKey: normKey(name) });
  }
  list.sort(function (x, y) { return x.sid < y.sid ? -1 : x.sid > y.sid ? 1 : 0; });
  return { known: list.length > 0, list: list };
}

/**
 * 과제 1개의 제출 현황 — 인원 수와 '보는 사람 본인'의 상태만 돌려준다.
 * 다른 학생이 누구인지(이름·학번·제출 여부)는 응답에 담지 않는다.
 */
function buildAssignmentBoard(ss, meta, roster, viewerSid, viewerName) {
  var res = {
    id: meta.id, title: meta.title, lesson: meta.lesson, path: meta.path,
    submittedCount: 0, expected: roster.known ? roster.list.length : null, mine: null
  };

  var sh = ss.getSheetByName(meta.sheet);
  if (!sh || sh.getLastRow() < 2) return res;

  var values = sh.getDataRange().getValues();
  var head = values[0];
  var idx = {};
  for (var c = 0; c < head.length; c++) idx[String(head[c])] = c;
  if (idx['학번'] === undefined || idx['이름'] === undefined) return res;

  /* 같은 사람이 여러 번 냈어도 1명으로 센다 */
  var seen = {};
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var sid = String(row[idx['학번']] == null ? '' : row[idx['학번']]).trim();
    var name = String(row[idx['이름']] == null ? '' : row[idx['이름']]).trim();
    if (!sid && !name) continue;

    var key = normKey(sid) + '|' + normKey(name);
    if (!seen[key]) { seen[key] = true; res.submittedCount++; }

    if (normKey(sid) === normKey(viewerSid) && normKey(name) === normKey(viewerName)) {
      res.mine = { at: String(row[idx['제출시각']] || '') }; // 마지막 제출로 덮인다
    }
  }
  return res;
}

/**
 * 학번 + 이름 + 암호가 모두 맞는 가장 최근 제출 1건을 돌려준다.
 * status: ok | notfound(학번·이름 불일치) | denied(암호 불일치) | error
 */
function lookupSubmission(p) {
  var studentId = p.studentId || p.classInfo; // 구버전 파라미터 호환
  if (!studentId || !p.studentName) return { status: 'error', message: '학번과 이름이 필요합니다.' };
  if (!p.password) return { status: 'error', message: '암호가 필요합니다.' };

  var def = SOURCES[p.source] || SOURCES[DEFAULT_SOURCE];
  if (!def) return { status: 'error', message: '알 수 없는 활동지입니다.' };

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(def.sheet);
  if (!sheet || sheet.getLastRow() < 2) return { status: 'notfound' };
  migrateHeaders(sheet);

  var values = sheet.getDataRange().getValues();
  var header = values[0];
  var idx = {};
  for (var c = 0; c < header.length; c++) idx[String(header[c])] = c;

  var wantName = normKey(p.studentName);
  var wantId = normKey(studentId);
  var wantHash = hashPassword(p.password);

  for (var r = values.length - 1; r >= 1; r--) {
    var row = values[r];
    if (normKey(row[idx['이름']]) !== wantName) continue;
    if (normKey(row[idx['학번']]) !== wantId) continue;

    var stored = String(row[idx[PW_COL]] || '');
    if (!stored || stored !== wantHash) {
      Utilities.sleep(400); // 단순 무차별 대입 속도 저하
      return { status: 'denied' };
    }

    var out = {};
    for (var i = 0; i < def.fields.length; i++) {
      var key = def.fields[i][1];
      var col = idx[def.fields[i][0]];
      var val = col === undefined ? '' : row[col];
      // 시트가 날짜 문자열을 Date로 바꿔 저장하므로 되돌릴 때 yyyy-MM-dd로 정규화
      if (val instanceof Date) val = Utilities.formatDate(val, 'Asia/Seoul', 'yyyy-MM-dd');
      out[key] = String(val == null ? '' : val);
    }
    return {
      status: 'ok',
      submittedAt: String(row[idx['제출시각']] || ''),
      rowNumber: r + 1,
      data: out
    };
  }

  Utilities.sleep(400);
  return { status: 'notfound' };
}
