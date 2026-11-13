/**
 * [해봄 X 디지털 활용 AI 동아리] 주제 희망 조사 — Google Apps Script
 *
 * 설정 방법:
 * 1. Google 스프레드시트 → 확장 프로그램 → Apps Script
 * 2. 아래 코드를 Code.gs에 붙여넣기
 * 3. 배포 → 새 배포 → 웹 앱
 *    - 실행 계정: 나
 *    - 액세스 권한: 모든 사용자 (익명 포함)
 * 4. 배포 후 URL을 복사하여 활동지 설정 패널에 입력
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('주제희망조사') || ss.insertSheet('주제희망조사');

    // 첫 실행 시 헤더 자동 생성
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        '제출시각',
        '이름',
        '부서(교과)',
        '1순위',
        '2순위',
        '3순위',
        '추가 희망 주제',
        '기타 의견'
      ]);
      // 헤더 스타일
      var h = sheet.getRange(1, 1, 1, 8);
      h.setBackground('#3b82f6');
      h.setFontColor('#FFFFFF');
      h.setFontWeight('bold');
      sheet.setFrozenRows(1);

      // 열 너비 조정
      sheet.setColumnWidth(1, 160);  // 제출시각
      sheet.setColumnWidth(2, 100);  // 이름
      sheet.setColumnWidth(3, 120);  // 부서
      sheet.setColumnWidth(4, 180);  // 1순위
      sheet.setColumnWidth(5, 180);  // 2순위
      sheet.setColumnWidth(6, 180);  // 3순위
      sheet.setColumnWidth(7, 300);  // 추가 희망 주제
      sheet.setColumnWidth(8, 300);  // 기타 의견
    }

    sheet.appendRow([
      new Date().toLocaleString('ko-KR'),
      data.teacherName || '',
      data.department || '',
      data.priority1Name || '',
      data.priority2Name || '',
      data.priority3Name || '',
      data.additionalTopic || '',
      data.comment || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
