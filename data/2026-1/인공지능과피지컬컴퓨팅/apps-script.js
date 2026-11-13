/**
 * 인공지능과 피지컬컴퓨팅 과목 활동지 — Google Apps Script (과목 공용)
 *
 * 이 스크립트 하나로 본 과목의 여러 활동지 데이터를 받아
 * 활동지 종류(source)에 따라 각기 다른 시트 탭에 자동 저장합니다.
 *
 * [등록된 활동지]
 *   - 'ai_physical_design' → 팀프로젝트_설계 시트 (팀별 1행 upsert)
 *     · 역할(designer / coder / circuit) 별로 다른 컬럼 그룹을 갱신
 *     · 같은 팀의 다른 학생이 제출하면 그 행의 해당 역할 컬럼만 update
 *     · 이미지 첨부는 base64 → Drive 폴더에 저장 후 링크로 기록
 *   - 'ai_physical_report' → 프로젝트보고서 시트 (제출당 1행 append)
 *     · 결과물 이미지는 base64 → Drive '프로젝트보고서_이미지' 폴더 저장 후 링크 기록
 *
 * [최초 설정]
 *  1. Google 스프레드시트 생성
 *  2. 확장 프로그램 → Apps Script
 *  3. 이 파일 전체를 복사/붙여넣기
 *  4. (선택) DRIVE_FOLDER_ID 상수에 Drive 폴더 ID를 입력하면 첨부 이미지가
 *     그 폴더에 저장됩니다. 비워두면 시트가 있는 폴더에 자동 저장.
 *  5. 배포 → 새 배포 → 웹 앱
 *     · 실행 계정: 나
 *     · 액세스 권한: 모든 사용자 (익명 포함)  ← 반드시 이것
 *  6. 발급된 웹앱 URL을 활동지의 ⚙ 설정 패널에 입력 → 저장.
 *
 * [팀명 변경]
 *   form.html의 <select id="teamName"> 옵션을 수정.
 *   ※ 이미 제출된 행과 정확히 일치하지 않는 팀명을 입력하면 새 행으로 추가됩니다.
 *
 * [재배포 시]
 *   배포 → 배포 관리 → 기존 배포 옆 ⚙ → 새 버전 → 배포.
 *   URL이 유지되므로 학생 페이지는 그대로 사용할 수 있습니다.
 */

/* ── (선택) 이미지가 저장될 Drive 폴더 ID ───────────────────────── */
var DRIVE_FOLDER_ID = '';  // 예: '1AbCDefGhIJklmNopQrStUv'  (빈 문자열이면 자동)

/* ════════════════════════════════════════════════════════════════
   ★ 권한 승인 (최초 1회) — Drive 접근 권한 동의용
   doPost는 외부 호출이라 권한 동의 창을 띄울 수 없습니다.
   "DriveApp.getFileById을(를) 호출할 수 있는 권한이 없습니다" 오류가 나면:
   1. 편집기 상단 함수 드롭다운에서 authorizeOnce 선택 → ▶ 실행
   2. "권한 검토" → 계정 선택 → (미검증 앱 경고 시 "고급" → "이동") → 허용
   3. 재배포는 필요 없습니다. 바로 다시 제출 테스트하면 됩니다.
   ════════════════════════════════════════════════════════════════ */
function authorizeOnce() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var folder = getOrCreateImageFolder_(ss, '프로젝트보고서_이미지');
  Logger.log('권한 승인 완료 — 이미지 폴더: ' + folder.getName() + ' (' + folder.getUrl() + ')');
}

/* ════════════════════════════════════════════════════════════════
   doPost — 라우팅
   ════════════════════════════════════════════════════════════════ */
function doPost(e) {
  var ss = null;
  try {
    var data = JSON.parse(e.postData.contents);
    ss = SpreadsheetApp.getActiveSpreadsheet();

    if (data.source === 'live_session_archive') {
      // ── 라이브 세션 아카이브 (live-archive.js로 위임) ──
      return handleLiveSessionArchive(data, ss);
    }

    if (data.source === 'ai_physical_design') {
      handleDesignSubmission(ss, data);
    } else if (data.source === 'ai_physical_report') {
      handleReportSubmission(ss, data);
    } else if (data.source === 'ai_physical_selfeval') {
      handleSelfEvalSubmission(ss, data);
    } else if (data.problemDef !== undefined || data.classSummary !== undefined) {
      /* 기존 팀프로젝트-기획 활동지 (source 필드 없음) — 하위 호환 */
      handlePlanningSubmission(ss, data);
    } else {
      handleFallback(ss, data);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    /* 오류는 '에러로그' 시트에도 기록해 학생이 보이지 않는 실패를 교사가 추적할 수 있게 한다 */
    try { logError_(ss, err); } catch (e2) {}
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message, stack: err.stack || '' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* 오류 로깅 — 활동지가 no-cors라 학생은 오류를 볼 수 없으므로 시트에 직접 기록 */
function logError_(ss, err) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('에러로그') || ss.insertSheet('에러로그');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['시각', '에러 메시지', '스택']);
    sh.getRange(1, 1, 1, 3).setBackground('#EC4D8E').setFontColor('#fff').setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  sh.appendRow([
    new Date().toLocaleString('ko-KR'),
    String(err && err.message || err),
    String(err && err.stack || '')
  ]);
}

/* ════════════════════════════════════════════════════════════════
   0) 팀프로젝트-기획 (기존 활동지) — 하위 호환 처리
   ════════════════════════════════════════════════════════════════ */
function handlePlanningSubmission(ss, data) {
  var sheet = ss.getSheetByName('기획서') || ss.insertSheet('기획서');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      '제출시각','팀명',
      '팀원1','역할1','팀원2','역할2','팀원3','역할3','팀원4','역할4',
      '문제정의','입력','분류','출력',
      '클래스설계','필요부품',
      '1차시','2차시','3차시',
      '기대효과(가치)','기대효과(확장)'
    ]);
    var h = sheet.getRange(1, 1, 1, 21);
    h.setBackground('#1A1A2E'); h.setFontColor('#FFFFFF'); h.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([
    new Date().toLocaleString('ko-KR'),
    data.teamName || '',
    data.m1name || '', data.m1role || '',
    data.m2name || '', data.m2role || '',
    data.m3name || '', data.m3role || '',
    data.m4name || '', data.m4role || '',
    data.problemDef || '',
    data.flowInput || '', data.flowClassify || '', data.flowOutput || '',
    data.classSummary || '', data.parts || '',
    data.sched1 || '', data.sched2 || '', data.sched3 || '',
    data.effectValue || '', data.effectExpand || ''
  ]);
}

/* ════════════════════════════════════════════════════════════════
   1) 설계 활동지 — 팀별 1행 upsert
   ════════════════════════════════════════════════════════════════ */

/**
 * 컬럼 레이아웃 (팀별 1행)
 *
 *  A  최초제출시각
 *  B  팀명 (UPSERT KEY)
 *  C  반/번호 (대표값)
 *  D  마지막 갱신시각
 *
 *  ── 제품 디자이너 (E ~ N) ──
 *  E  D_이름
 *  F  D_반/번호
 *  G  D_제출시각
 *  H  D_제품 컨셉
 *  I  D_타깃·장소
 *  J  D_사용 부품
 *  K  D_고려사항
 *  L  D_장점
 *  M  D_한계/개선
 *  N  D_MOCK 스케치 (Drive 링크)
 *  O  D_블루프린트 (Drive 링크)
 *
 *  ── 코드 설계 (P ~ Z) ──
 *  P  C_이름
 *  Q  C_반/번호
 *  R  C_제출시각
 *  S  C_프로젝트 정보
 *  T  C_사용 부품
 *  U  C_부품·역할·핀 정리
 *  V  C_분류 결과별 동작
 *  W  C_시나리오
 *  X  C_TM 모델 URL
 *  Y  C_Arduino 프롬프트
 *  Z  C_HTML 프롬프트
 *
 *  ── 회로 설계 (AA ~ AJ) ──
 *  AA R_이름
 *  AB R_반/번호
 *  AC R_제출시각
 *  AD R_사용 부품
 *  AE R_핀 매핑
 *  AF R_회로 질문 답변
 *  AG R_회로 요약
 *  AH R_회로도 프롬프트
 *  AI R_회로도 캡처 (Drive 링크)
 */
var DESIGN_HEADERS = [
  '최초제출시각', '팀명', '반/번호', '마지막갱신시각',
  /* 디자이너 (11) */
  '디자이너_이름', '디자이너_반번호', '디자이너_제출시각',
  '디자이너_제품컨셉', '디자이너_타깃·장소', '디자이너_사용부품',
  '디자이너_고려사항', '디자이너_장점', '디자이너_한계/개선',
  '디자이너_MOCK스케치', '디자이너_블루프린트',
  /* 코드 (13) */
  '코드_이름', '코드_반번호', '코드_제출시각',
  '코드_프로젝트정보', '코드_사용부품', '코드_부품역할·핀',
  '코드_분류별동작', '코드_시나리오', '코드_TM모델URL',
  '코드_Arduino프롬프트', '코드_HTML프롬프트',
  '코드_생성된Arduino코드', '코드_생성된HTML코드',
  /* 회로 (8) */
  '회로_이름', '회로_반번호', '회로_제출시각',
  '회로_사용부품', '회로_부품사진', '회로_핀매핑',
  '회로_회로도프롬프트', '회로_회로도캡처',
  /* TM 모델 (10) */
  'TM_이름', 'TM_반번호', 'TM_제출시각',
  'TM_목적', 'TM_입력대상', 'TM_클래스설계',
  'TM_수집·다양성·고려사항', 'TM_정확도·혼동·개선',
  'TM_모델URL', 'TM_학습이미지', 'TM_테스트캡처'
];

/* 역할별로 갱신할 컬럼 인덱스 (0-based, DESIGN_HEADERS 기준) */
var DESIGNER_COLS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];                    // E~O   (11)
var CODER_COLS    = [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27];      // P~AB  (13)
var CIRCUIT_COLS  = [28, 29, 30, 31, 32, 33, 34, 35];                          // AC~AJ (8)
var TM_COLS       = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46];              // AK~AU (11)

function handleDesignSubmission(ss, data) {
  var sheet = ss.getSheetByName('팀프로젝트_설계') || ss.insertSheet('팀프로젝트_설계');

  /* 헤더가 없으면 생성 + 서식 */
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(DESIGN_HEADERS);
    var h = sheet.getRange(1, 1, 1, DESIGN_HEADERS.length);
    h.setBackground('#6B5DD3');
    h.setFontColor('#FFFFFF');
    h.setFontWeight('bold');
    h.setHorizontalAlignment('center');
    h.setVerticalAlignment('middle');
    sheet.setFrozenRows(1);
    sheet.setFrozenColumns(2);
    /* 그룹별 색상 띠 (3행: 행 높이) */
    sheet.setRowHeight(1, 36);
    /* 그룹 헤더 색상 */
    sheet.getRange(1, 5,  1, DESIGNER_COLS.length).setBackground('#EC4D8E'); // 핑크
    sheet.getRange(1, 16, 1, CODER_COLS.length   ).setBackground('#2EC5E0'); // 시안
    sheet.getRange(1, 29, 1, CIRCUIT_COLS.length ).setBackground('#1FB890'); // 민트
    sheet.getRange(1, 37, 1, TM_COLS.length      ).setBackground('#E8A422'); // 앰버
    sheet.getRange(1, 1,  1, 4).setBackground('#1F2540'); // 메타
  }

  var teamName = String(data.teamName || '').trim();
  if (!teamName) throw new Error('teamName이 비어 있습니다.');

  var role = String(data.role || '').trim();
  if (['designer', 'coder', 'circuit', 'tm'].indexOf(role) === -1) {
    throw new Error('알 수 없는 역할: ' + role);
  }

  var now = new Date().toLocaleString('ko-KR');

  /* B열(팀명)에서 일치하는 행 검색 */
  var lastRow = sheet.getLastRow();
  var rowIndex = -1;
  if (lastRow >= 2) {
    var teamCol = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    for (var i = 0; i < teamCol.length; i++) {
      if (String(teamCol[i][0]).trim() === teamName) {
        rowIndex = i + 2;
        break;
      }
    }
  }

  /* 첨부 이미지가 있을 때만 Drive 폴더 생성/접근 — Drive 권한 미승인 시 행 저장은 영향 없음 */
  var folderCache = null;
  function getFolder() {
    if (folderCache === null) folderCache = getOrCreateImageFolder_(ss);
    return folderCache;
  }
  function trySave(kind, list) {
    if (!list || !list.length) return '';
    try { return saveImages_(getFolder(), teamName, role, kind, list); }
    catch (imgErr) { logError_(ss, imgErr); return '(이미지 저장 실패 — 에러로그 시트 참고)'; }
  }
  var sketchLinks    = trySave('sketch',     data.d_sketchImages);
  var blueprintLinks = trySave('blueprint',  data.d_blueprintImages);
  var partsLinks     = trySave('parts',      data.r_partsImages);
  var diagramLinks   = trySave('diagram',    data.r_diagramImages);
  var trainLinks     = trySave('tm-train',   data.t_trainImages);
  var testLinks      = trySave('tm-test',    data.t_testImages);

  /* 신규 행이면 빈 행을 먼저 만들기 */
  if (rowIndex === -1) {
    var newRow = new Array(DESIGN_HEADERS.length).fill('');
    newRow[0] = now;       // 최초제출시각
    newRow[1] = teamName;  // 팀명
    newRow[2] = data.classInfo || '';
    newRow[3] = now;       // 마지막갱신시각
    sheet.appendRow(newRow);
    rowIndex = sheet.getLastRow();
  } else {
    sheet.getRange(rowIndex, 4).setValue(now); // 마지막갱신시각 갱신
    var classCell = sheet.getRange(rowIndex, 3).getValue();
    if (!classCell && data.classInfo) sheet.getRange(rowIndex, 3).setValue(data.classInfo);
  }

  /* 역할별 컬럼 갱신 */
  if (role === 'designer') {
    var dParts = (data.d_parts || []).join(', ');
    setRowCells_(sheet, rowIndex, DESIGNER_COLS, [
      data.studentName || '',
      data.classInfo   || '',
      now,
      data.d_concept   || '',
      data.d_target    || '',
      dParts + (data.d_partsMemo ? ' / ' + data.d_partsMemo : ''),
      data.d_consider  || '',
      data.d_strength  || '',
      data.d_limit     || '',
      sketchLinks,
      blueprintLinks
    ]);
  } else if (role === 'coder') {
    var cParts = (data.c_parts || []).join(', ');
    if (data.c_partsExtra) cParts += (cParts ? ', ' : '') + data.c_partsExtra;
    var cPartsTable = (data.c_partsTable || []).map(function(r) {
      return '- ' + r.part + ' | 핀: ' + r.pin + ' | 역할: ' + r.role;
    }).join('\n');
    var cClasses = (data.c_classes || []).map(function(c) {
      return '- "' + c.name + '" → 신호 "' + c.signal + '" → ' + c.action;
    }).join('\n');
    setRowCells_(sheet, rowIndex, CODER_COLS, [
      data.studentName || '',
      data.classInfo   || '',
      now,
      data.c_projectInfo || '',
      cParts,
      cPartsTable,
      cClasses,
      data.c_scenario   || '',
      data.c_modelUrl   || '',
      data.c_arduinoPromptText || '',
      data.c_htmlPromptText    || '',
      data.c_arduinoCode       || '',
      data.c_htmlCode          || ''
    ]);
  } else if (role === 'circuit') {
    var rParts = (data.r_parts || []).join(', ');
    if (data.r_partsExtra) rParts += (rParts ? ', ' : '') + data.r_partsExtra;
    var rPinMap = (data.r_pinMappings || []).map(function(m) {
      return '- ' + m.pin + ' → ' + m.part + (m.memo ? ' (' + m.memo + ')' : '');
    }).join('\n');
    setRowCells_(sheet, rowIndex, CIRCUIT_COLS, [
      data.studentName || '',
      data.classInfo   || '',
      now,
      rParts,
      partsLinks,
      rPinMap,
      data.r_circuitPromptText || '',
      diagramLinks
    ]);
  } else if (role === 'tm') {
    var tClasses = (data.t_classes || []).map(function(c, i) {
      return (i + 1) + '. [' + c.name + '] ' + c.desc + ' / 이미지 ' + (c.count || '?') + '장 / 수집: ' + (c.method || '-');
    }).join('\n');
    var tCollect = [
      '수집 방법: '   + (data.t_collectHow || ''),
      '다양성 확보: ' + (data.t_diversity  || ''),
      '추가 고려사항: ' + (data.t_consider || '')
    ].join('\n');
    var tResult = [
      '정확도: ' + (data.t_accuracy || ''),
      '혼동: '   + (data.t_confuse  || ''),
      '개선: '   + (data.t_improve  || '')
    ].join('\n');
    setRowCells_(sheet, rowIndex, TM_COLS, [
      data.studentName || '',
      data.classInfo   || '',
      now,
      data.t_purpose   || '',
      data.t_input     || '',
      tClasses,
      tCollect,
      tResult,
      data.t_modelUrl  || '',
      trainLinks,
      testLinks
    ]);
  }
}

/* 셀 그룹 갱신 헬퍼 */
function setRowCells_(sheet, rowIndex, colIndexes0, values) {
  for (var i = 0; i < colIndexes0.length; i++) {
    sheet.getRange(rowIndex, colIndexes0[i] + 1).setValue(values[i] || '');
  }
}

/* ════════════════════════════════════════════════════════════════
   1-1) 프로젝트 결과 보고서 — 제출당 1행 append
   ════════════════════════════════════════════════════════════════ */
var REPORT_HEADERS = [
  '제출시각', '팀명', '반/번호', '작성자',
  '팀구성',
  '프로젝트명', '한줄소개', '프로젝트설명',
  '결과물이미지',
  '핵심포인트', '기타부각내용',
  '최종Arduino코드', '최종HTML코드',
  '결과미리보기(합성)'
];

function handleReportSubmission(ss, data) {
  var sheet = ss.getSheetByName('프로젝트보고서') || ss.insertSheet('프로젝트보고서');

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(REPORT_HEADERS);
    var h = sheet.getRange(1, 1, 1, REPORT_HEADERS.length);
    h.setBackground('#6B5DD3');
    h.setFontColor('#FFFFFF');
    h.setFontWeight('bold');
    h.setHorizontalAlignment('center');
    h.setVerticalAlignment('middle');
    sheet.setFrozenRows(1);
    sheet.setFrozenColumns(2);
    sheet.setRowHeight(1, 36);
    sheet.getRange(1, 1, 1, 4).setBackground('#1F2540');   // 메타
    sheet.getRange(1, 10, 1, 2).setBackground('#EC4D8E');  // 핵심포인트·기타
    sheet.getRange(1, 12, 1, 2).setBackground('#2EC5E0');  // 코드
    sheet.getRange(1, 14, 1, 1).setBackground('#1FB890');  // 미리보기
  }

  /* 구버전 헤더(13열)로 만들어진 시트에 미리보기 열 헤더를 보강 */
  var previewCol = REPORT_HEADERS.length; // 14
  if (String(sheet.getRange(1, previewCol).getValue()) === '') {
    var ph = sheet.getRange(1, previewCol);
    ph.setValue(REPORT_HEADERS[previewCol - 1]);
    ph.setBackground('#1FB890'); ph.setFontColor('#FFFFFF'); ph.setFontWeight('bold');
    ph.setHorizontalAlignment('center'); ph.setVerticalAlignment('middle');
  }

  var teamName = String(data.teamName || '').trim();
  if (!teamName) throw new Error('teamName이 비어 있습니다.');

  var members = (data.members || []).map(function(m) {
    return '- ' + (m.name || '') + (m.role ? ' (' + m.role + ')' : '') + (m.work ? ': ' + m.work : '');
  }).join('\n');

  /* 결과물 이미지 → Drive 저장 (실패해도 행 저장은 진행) */
  var imageLinks = '';
  if (data.resultImages && data.resultImages.length) {
    try {
      var folder = getOrCreateImageFolder_(ss, '프로젝트보고서_이미지');
      imageLinks = saveImages_(folder, teamName, 'report', 'result', data.resultImages);
    } catch (imgErr) {
      logError_(ss, imgErr);
      imageLinks = '(이미지 저장 실패 — 에러로그 시트 참고)';
    }
  }

  sheet.appendRow([
    new Date().toLocaleString('ko-KR'),
    teamName,
    data.classInfo    || '',
    data.studentName  || '',
    members,
    data.projectName  || '',
    data.projectIntro || '',
    data.projectDesc  || '',
    imageLinks,
    data.keyPoint     || '',
    data.highlight    || '',
    String(data.arduinoCode || '').slice(0, 49000),
    String(data.htmlCode    || '').slice(0, 49000)
  ]);

  /* 합성 미리보기 이미지를 셀 안에 직접 삽입.
     1차: base64 데이터 URL → CellImage (Drive 불필요)
     2차 폴백: Drive 저장 후 =IMAGE(썸네일) 수식 */
  var mergedImage = String(data.mergedImage || '');
  if (mergedImage.indexOf('data:image/') === 0) {
    var rowIdx = sheet.getLastRow();
    try {
      var cellImg = SpreadsheetApp.newCellImage().setSourceUrl(mergedImage).build();
      sheet.getRange(rowIdx, previewCol).setValue(cellImg);
    } catch (cellErr) {
      logError_(ss, cellErr);
      try {
        var pf = getOrCreateImageFolder_(ss, '프로젝트보고서_이미지');
        var pm = mergedImage.match(/^data:(.+?);base64,(.+)$/);
        var pBlob = Utilities.newBlob(Utilities.base64Decode(pm[2]), pm[1],
          String(teamName).replace(/[\\/:*?"<>|]/g, '_') + '_merged_' +
          Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Seoul', 'yyyyMMdd-HHmmss') + '.jpg');
        var pFile = pf.createFile(pBlob);
        pFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        sheet.getRange(rowIdx, previewCol).setFormula(
          '=IMAGE("https://drive.google.com/thumbnail?id=' + pFile.getId() + '&sz=w600")');
      } catch (fbErr) {
        logError_(ss, fbErr);
        sheet.getRange(rowIdx, previewCol).setValue('(미리보기 삽입 실패 — 에러로그 시트 참고)');
      }
    }
    sheet.setRowHeight(rowIdx, 140);
    if (sheet.getColumnWidth(previewCol) < 220) sheet.setColumnWidth(previewCol, 260);
  }
}

/* ════════════════════════════════════════════════════════════════
   1-2) 자기평가서 — 제출당 1행 append
   ════════════════════════════════════════════════════════════════ */
var SELFEVAL_HEADERS = [
  '제출시각', '반/번호', '이름',
  '자기평가문(성찰)',
  '가장기억에남는수업·활동', '가장기억에남는이유'
];

function handleSelfEvalSubmission(ss, data) {
  var sheet = ss.getSheetByName('자기평가서') || ss.insertSheet('자기평가서');

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(SELFEVAL_HEADERS);
    var h = sheet.getRange(1, 1, 1, SELFEVAL_HEADERS.length);
    h.setBackground('#6B5DD3');
    h.setFontColor('#FFFFFF');
    h.setFontWeight('bold');
    h.setHorizontalAlignment('center');
    h.setVerticalAlignment('middle');
    sheet.setFrozenRows(1);
    sheet.setFrozenColumns(3);
    sheet.setRowHeight(1, 36);
    sheet.getRange(1, 1, 1, 3).setBackground('#1F2540');  // 메타
    sheet.getRange(1, 4, 1, 1).setBackground('#EC4D8E');  // 자기평가
    sheet.getRange(1, 5, 1, 2).setBackground('#1FB890');  // 기억에 남는 것
    sheet.setColumnWidth(4, 420);
    sheet.setColumnWidth(6, 320);
  }

  var studentName = String(data.studentName || '').trim();
  if (!studentName) throw new Error('studentName이 비어 있습니다.');

  sheet.appendRow([
    new Date().toLocaleString('ko-KR'),
    data.classInfo      || '',
    studentName,
    data.selfEval       || '',
    data.memorableTopic || '',
    data.mostMemorable  || ''
  ]);
}

/* ════════════════════════════════════════════════════════════════
   2) 이미지 첨부 → Drive 저장
   ════════════════════════════════════════════════════════════════ */
function getOrCreateImageFolder_(ss, folderName) {
  if (DRIVE_FOLDER_ID) {
    try { return DriveApp.getFolderById(DRIVE_FOLDER_ID); }
    catch (e) { /* fallthrough */ }
  }
  /* 스프레드시트가 있는 폴더 안에 이미지 폴더를 만들거나 재사용 */
  var ssFile = DriveApp.getFileById(ss.getId());
  var parents = ssFile.getParents();
  var parent = parents.hasNext() ? parents.next() : DriveApp.getRootFolder();
  var name = folderName || '팀프로젝트_설계_이미지';
  var existing = parent.getFoldersByName(name);
  if (existing.hasNext()) return existing.next();
  return parent.createFolder(name);
}

function saveImages_(folder, teamName, role, kind, imageList) {
  if (!imageList || !imageList.length) return '';
  var links = [];
  for (var i = 0; i < imageList.length; i++) {
    var item = imageList[i];
    if (!item || !item.dataUrl) continue;
    var match = String(item.dataUrl).match(/^data:(.+?);base64,(.+)$/);
    if (!match) continue;
    var mime = match[1];
    var base64 = match[2];
    var bytes = Utilities.base64Decode(base64);
    var ext = guessExt_(mime);
    var safeTeam = String(teamName).replace(/[\\/:*?"<>|]/g, '_');
    var ts = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Seoul', 'yyyyMMdd-HHmmss');
    var fname = safeTeam + '_' + role + '_' + kind + '_' + ts + '_' + (i + 1) + '.' + ext;
    var blob = Utilities.newBlob(bytes, mime, fname);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    links.push(file.getUrl());
  }
  return links.join('\n');
}

function guessExt_(mime) {
  switch (String(mime).toLowerCase()) {
    case 'image/png':  return 'png';
    case 'image/jpeg': return 'jpg';
    case 'image/jpg':  return 'jpg';
    case 'image/gif':  return 'gif';
    case 'image/webp': return 'webp';
    case 'image/svg+xml': return 'svg';
    default: return 'bin';
  }
}

/* ════════════════════════════════════════════════════════════════
   3) Fallback — 정의되지 않은 source는 '미분류' 시트에 원본 JSON 저장
   ════════════════════════════════════════════════════════════════ */
function handleFallback(ss, data) {
  var sheet = ss.getSheetByName('미분류') || ss.insertSheet('미분류');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['제출시각', 'source', 'JSON 전체']);
    var h = sheet.getRange(1, 1, 1, 3);
    h.setBackground('#9CA3AF'); h.setFontColor('#FFFFFF'); h.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([
    new Date().toLocaleString('ko-KR'),
    data.source || '(없음)',
    JSON.stringify(data).slice(0, 40000)
  ]);
}

/* ════════════════════════════════════════════════════════════════
   4) doGet — 헬스체크
   ════════════════════════════════════════════════════════════════ */
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      service: '인공지능과피지컬컴퓨팅 활동지 backend',
      sources: ['ai_physical_design', 'ai_physical_report', 'ai_physical_selfeval']
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
