/**
 * AI · 디지털 활용 결과 보고서 — Google Apps Script
 * 정보화부 / AI디지털  |  2026학년도
 *
 * ── 설정 방법 ────────────────────────────────────────────
 * 1. Google 스프레드시트 → 확장 프로그램 → Apps Script
 * 2. 이 코드 전체를 붙여넣기 후 저장
 * 3. [이미지 사용 시] authorizeDrive() 함수 선택 후 ▶ 실행
 *    → "권한 검토" → 고급 → 허용
 * 4. 배포 → 새 배포 → 웹 앱
 *    · 실행 계정: 나 (스크립트 소유자)
 *    · 액세스 권한: 모든 사용자 (익명 포함) ← 반드시
 * 5. 배포 URL 복사 → 활동지 ⚙ 설정 패널에 입력
 *
 * ── 시트 구조 ────────────────────────────────────────────
 * · 교육활동 탭: source='edu-activity' 데이터
 * · 수업활용 탭: source='class-activity' 데이터
 * · 이미지는 Google Drive "AI디지털_활동_이미지" 폴더에 저장
 * ────────────────────────────────────────────────────────
 */

var FOLDER_NAME = 'AI디지털_활동_이미지';

// ────────────────────────────────────────────────────────
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss   = SpreadsheetApp.getActiveSpreadsheet();

    if (data.source === 'edu-activity') {
      saveEduActivity(ss, data);
    } else if (data.source === 'class-activity') {
      saveClassActivity(ss, data);
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

// ── 교육활동 저장 ─────────────────────────────────────────
function saveEduActivity(ss, data) {
  var sheet = ss.getSheetByName('교육활동') || ss.insertSheet('교육활동');

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      '제출시각', '작성자', '업무 영역', '업무명', '활용 시기', '관련 대상',
      '활용 도구', '구체 도구명', '예산 집행',
      '해결하려던 문제', '도구 선택 이유', '활용 방식',
      '산출물', '정량 효과', '검증·점검 절차',
      '잘 된 점', '아쉬운 점', '바꿀 1가지',
      '추천 활용 맥락', '주의할 점', '재활용 자산',
      '이미지1', '이미지2', '이미지3'
    ]);
    var hdr = sheet.getRange(1, 1, 1, 24);
    hdr.setBackground('#5B4FCF');
    hdr.setFontColor('#FFFFFF');
    hdr.setFontWeight('bold');
    sheet.setFrozenRows(1);
    [10, 11, 13, 15].forEach(function(col) { sheet.setColumnWidth(col, 200); });
  }

  var images = data.images || (data.imageBase64 ? [data.imageBase64] : []);
  var imgUrls = images.map(function(b64, i) {
    if (!b64) return '';
    try { return saveImg(b64, (data.author || 'unknown') + '_교육활동_' + (i + 1)); }
    catch (e) { return '[오류] ' + e.message; }
  });
  while (imgUrls.length < 3) imgUrls.push('');

  var row = [
    new Date().toLocaleString('ko-KR'),
    data.author    || '',
    data.workArea  || '',
    data.workName  || '',
    data.period    || '',
    data.target    || '',
    data.tools     || '',
    data.toolNames || '',
    data.budget    || '',
    data.problem   || '',
    data.toolReason|| '',
    data.method    || '',
    data.outputs   || '',
    data.effect    || '',
    data.verify    || '',
    data.good      || '',
    data.bad       || '',
    data.change    || '',
    data.ctx       || '',
    data.caution   || '',
    data.assets    || ''
  ];
  imgUrls.forEach(function(u) {
    row.push(u && u.indexOf('[오류]') === -1 ? '=IMAGE("' + u + '")' : u);
  });
  sheet.appendRow(row);

  if (imgUrls.some(function(u) { return u && u.indexOf('[오류]') === -1; })) {
    sheet.setRowHeight(sheet.getLastRow(), 150);
  }
}

// ── 수업활용 저장 ─────────────────────────────────────────
function saveClassActivity(ss, data) {
  var sheet = ss.getSheetByName('수업활용') || ss.insertSheet('수업활용');

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      '제출시각', '작성자', '교과명', '학년·반', '학생 수', '활용 일자', '단원·주제',
      '활용 도구', '구체 도구명', '예산 집행',
      '수업 목표', '도구 선택 이유', '활용 단계', '활용 방식',
      '학생 활동', '산출물·결과', '학생 반응',
      '잘 된 점', '아쉬운 점', '바꿀 1가지',
      '추천 활용 맥락', '주의할 점', '재활용 자산',
      '이미지1', '이미지2', '이미지3'
    ]);
    var hdr = sheet.getRange(1, 1, 1, 26);
    hdr.setBackground('#0F7B6C');
    hdr.setFontColor('#FFFFFF');
    hdr.setFontWeight('bold');
    sheet.setFrozenRows(1);
    [11, 12, 15].forEach(function(col) { sheet.setColumnWidth(col, 200); });
  }

  var images = data.images || (data.imageBase64 ? [data.imageBase64] : []);
  var imgUrls = images.map(function(b64, i) {
    if (!b64) return '';
    try { return saveImg(b64, (data.author || 'unknown') + '_수업활용_' + (i + 1)); }
    catch (e) { return '[오류] ' + e.message; }
  });
  while (imgUrls.length < 3) imgUrls.push('');

  var row = [
    new Date().toLocaleString('ko-KR'),
    data.author     || '',
    data.subject    || '',
    data.grade      || '',
    data.count      || '',
    data.date       || '',
    data.unit       || '',
    data.tools      || '',
    data.toolNames  || '',
    data.budget     || '',
    data.goal       || '',
    data.toolReason || '',
    data.stage      || '',
    data.stageDesc  || '',
    data.activities || '',
    data.outputs    || '',
    data.reaction   || '',
    data.good       || '',
    data.bad        || '',
    data.change     || '',
    data.ctx        || '',
    data.caution    || '',
    data.assets     || ''
  ];
  imgUrls.forEach(function(u) {
    row.push(u && u.indexOf('[오류]') === -1 ? '=IMAGE("' + u + '")' : u);
  });
  sheet.appendRow(row);

  if (imgUrls.some(function(u) { return u && u.indexOf('[오류]') === -1; })) {
    sheet.setRowHeight(sheet.getLastRow(), 150);
  }
}

// ── 이미지 → Drive 저장 ───────────────────────────────────
function saveImg(base64Str, prefix) {
  var match = base64Str.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return '';

  var mimeType = match[1];
  var ext = (mimeType.split('/')[1] === 'jpeg') ? 'jpg' : mimeType.split('/')[1];
  var blob = Utilities.newBlob(
    Utilities.base64Decode(match[2]),
    mimeType,
    prefix + '_' + new Date().getTime() + '.' + ext
  );

  var folders = DriveApp.getFoldersByName(FOLDER_NAME);
  var folder  = folders.hasNext() ? folders.next() : DriveApp.createFolder(FOLDER_NAME);
  var file    = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // =IMAGE() 수식 호환 URL
  return 'https://lh3.googleusercontent.com/d/' + file.getId();
}

// ── Drive 권한 승인 (최초 1회 실행) ─────────────────────────
/**
 * Apps Script 편집기에서 이 함수를 선택하고 ▶ 실행하세요.
 * "권한 검토" 팝업 → 고급 → 허용
 * 실행 로그에 "Drive 권한 승인 완료!" 가 나오면 정상입니다.
 */
function authorizeDrive() {
  var tmp = DriveApp.createFile('_auth_test.txt', 'tmp', 'text/plain');
  tmp.setTrashed(true);
  var folder = DriveApp.createFolder('_auth_test_삭제가능');
  folder.setTrashed(true);
  Logger.log('Drive 권한 승인 완료!');
}
