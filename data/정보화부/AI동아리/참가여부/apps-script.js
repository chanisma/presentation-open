/**
 * [2026년 해봄 X 디지털활용 AI 동아리] 참가 신청 — Google Apps Script
 *
 * 배포 URL:
 *   https://script.google.com/macros/s/YOUR_WEBAPP_ID/exec
 *
 * 설정 방법:
 * 1. Google 스프레드시트 → 확장 프로그램 → Apps Script
 * 2. 아래 코드를 Code.gs에 붙여넣기
 * 3. 배포 → 새 배포 → 웹 앱
 *    - 실행 계정: 나
 *    - 액세스 권한: 모든 사용자 (익명 포함)
 * 4. 첫 제출 시 해당 시트가 자동 생성됩니다.
 *
 * source 분기 (시트 탭 분리):
 *   - 'club-apply'            → '참가여부' 시트      (AI 동아리 참가 신청)
 *   - 'opensession-apply'     → '오픈세션' 시트      (클로드코드 활용 생활기록부 작업 오픈세션)
 *   - 'opensession-interest' → '오픈세션추가희망' 시트 (오픈세션 추가 진행 희망 여부 조사, 일정 미정)
 *   - 그 외/미지정            → '참가여부' 시트      (하위 호환)
 */

// source → 시트 설정 매핑
var SHEET_CONFIG = {
  'club-apply': {
    name: '참가여부',
    headerColor: '#FF4D8D',
    defaultClub: '2026년 해봄 X 디지털활용 AI 동아리',
    defaultDate: '5월 11일'
  },
  'opensession-apply': {
    name: '오픈세션',
    headerColor: '#7C3AED',
    defaultClub: '클로드코드 활용 생활기록부 작업 오픈세션',
    defaultDate: '6월 29일 4교시'
  },
  'opensession-interest': {
    name: '오픈세션추가희망',
    headerColor: '#C8FF3A',
    defaultClub: '오픈세션 추가 진행 희망 여부 조사',
    defaultDate: '미정'
  }
};

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // source로 시트 분기 (미지정 시 기존 참가여부로 폴백)
    var cfg = SHEET_CONFIG[data.source] || SHEET_CONFIG['club-apply'];

    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(cfg.name) || ss.insertSheet(cfg.name);

    // 첫 실행 시 헤더 자동 생성
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['제출시각', '이름', '활동명', '활동일']);
      var h = sheet.getRange(1, 1, 1, 4);
      h.setBackground(cfg.headerColor);
      h.setFontColor('#FFFFFF');
      h.setFontWeight('bold');
      sheet.setFrozenRows(1);

      sheet.setColumnWidth(1, 160);  // 제출시각
      sheet.setColumnWidth(2, 120);  // 이름
      sheet.setColumnWidth(3, 340);  // 활동명
      sheet.setColumnWidth(4, 140);  // 활동일
    }

    sheet.appendRow([
      new Date().toLocaleString('ko-KR'),
      data.name      || '',
      data.club      || cfg.defaultClub,
      data.eventDate || cfg.defaultDate
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', sheet: cfg.name }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
