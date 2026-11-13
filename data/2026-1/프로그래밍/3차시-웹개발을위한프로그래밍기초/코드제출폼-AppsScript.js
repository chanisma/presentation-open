/**
 * ============================================
 *  HTML 코드 제출 폼 - Google Apps Script
 * ============================================
 *
 * 사용 방법:
 * 1. Google Drive에서 "Google Apps Script" 새 프로젝트 생성
 *    (drive.google.com → 새로 만들기 → 더보기 → Google Apps Script)
 * 2. 이 코드를 전체 복사하여 붙여넣기
 * 3. createForm() 함수를 실행 (▶ 버튼)
 *    → 권한 승인 필요 (처음 1회)
 * 4. 실행 로그에서 폼 URL과 스프레드시트 URL 확인
 * 5. 폼 URL을 학생들에게 공유
 *
 * 기능:
 * - 학생이 이름, 학번, HTML 코드를 제출
 * - 제출된 코드가 스프레드시트에 자동 저장
 * - HTML 미리보기 링크 자동 생성
 * ============================================
 */

// ====== 설정 ======
const CONFIG = {
  formTitle: '프로그래밍 3차시 - HTML 코드 제출',
  formDescription: '실습에서 작성한 HTML 코드를 제출해 주세요.\n코드 전체를 복사하여 붙여넣기 하면 됩니다.',
  spreadsheetName: '프로그래밍 3차시 - 코드 제출 결과',
};

/**
 * 메인 함수: 폼과 스프레드시트를 생성합니다.
 * 이 함수를 실행하세요!
 */
function createForm() {
  // 1. 스프레드시트 생성
  const ss = SpreadsheetApp.create(CONFIG.spreadsheetName);
  const sheet = ss.getActiveSheet();
  sheet.setName('제출 목록');

  // 헤더 설정
  const headers = ['제출 시간', '학년/반', '이름', '학번', '실습 구분', 'HTML 코드', '미리보기 링크'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // 헤더 스타일
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#1565c0');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');

  // 열 너비 설정
  sheet.setColumnWidth(1, 150); // 제출 시간
  sheet.setColumnWidth(2, 100); // 학년/반
  sheet.setColumnWidth(3, 80);  // 이름
  sheet.setColumnWidth(4, 80);  // 학번
  sheet.setColumnWidth(5, 120); // 실습 구분
  sheet.setColumnWidth(6, 400); // HTML 코드
  sheet.setColumnWidth(7, 200); // 미리보기 링크

  // 첫 행 고정
  sheet.setFrozenRows(1);

  // 2. 폼 생성
  const form = FormApp.create(CONFIG.formTitle);
  form.setDescription(CONFIG.formDescription);
  form.setConfirmationMessage('코드가 제출되었습니다! 수고하셨습니다 🎉');
  form.setAllowResponseEdits(true);
  form.setLimitOneResponsePerUser(false);

  // 학년/반 선택
  form.addListItem()
    .setTitle('학년/반')
    .setChoiceValues(['1-1', '1-2', '1-3', '1-4', '1-5', '1-6', '1-7', '1-8',
                      '2-1', '2-2', '2-3', '2-4', '2-5', '2-6', '2-7', '2-8'])
    .setRequired(true);

  // 이름
  form.addTextItem()
    .setTitle('이름')
    .setRequired(true);

  // 학번
  form.addTextItem()
    .setTitle('학번')
    .setHelpText('예: 12번')
    .setRequired(true);

  // 실습 구분
  form.addListItem()
    .setTitle('실습 구분')
    .setChoiceValues(['실습 1 - 개인 프로필 페이지', '실습 2 - 프로필 페이지 확장', '프로젝트 - 기획 페이지 뼈대'])
    .setRequired(true);

  // HTML 코드 입력
  form.addParagraphTextItem()
    .setTitle('HTML 코드')
    .setHelpText('작성한 HTML 코드를 전체 복사(Ctrl+A → Ctrl+C)하여 여기에 붙여넣기(Ctrl+V) 해주세요.')
    .setRequired(true);

  // 스프레드시트와 폼 연결
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  // 3. 웹앱용 시트 추가 (미리보기 기능)
  const previewSheet = ss.insertSheet('설정');
  previewSheet.getRange('A1').setValue('폼 URL');
  previewSheet.getRange('B1').setValue(form.getPublishedUrl());
  previewSheet.getRange('A2').setValue('폼 수정 URL');
  previewSheet.getRange('B2').setValue(form.getEditUrl());
  previewSheet.getRange('A1:A2').setFontWeight('bold');

  // 4. 결과 출력
  Logger.log('========================================');
  Logger.log('✅ 폼과 스프레드시트가 생성되었습니다!');
  Logger.log('========================================');
  Logger.log('📋 폼 URL (학생 공유용):');
  Logger.log(form.getPublishedUrl());
  Logger.log('');
  Logger.log('✏️ 폼 수정 URL (교사용):');
  Logger.log(form.getEditUrl());
  Logger.log('');
  Logger.log('📊 스프레드시트 URL:');
  Logger.log(ss.getUrl());
  Logger.log('========================================');
  Logger.log('');
  Logger.log('다음 단계:');
  Logger.log('1. 위 폼 URL을 학생들에게 공유하세요');
  Logger.log('2. setupPreviewTrigger() 함수를 실행하면');
  Logger.log('   제출 시 자동으로 미리보기 링크가 생성됩니다');
  Logger.log('========================================');
}

/**
 * 제출 시 자동으로 미리보기 링크를 생성하는 트리거를 설정합니다.
 * createForm() 실행 후 이 함수를 실행하세요.
 */
function setupPreviewTrigger() {
  // 기존 트리거 제거
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'onFormSubmit') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // 스프레드시트 찾기
  const files = DriveApp.getFilesByName(CONFIG.spreadsheetName);
  if (!files.hasNext()) {
    Logger.log('❌ 스프레드시트를 찾을 수 없습니다. createForm()을 먼저 실행하세요.');
    return;
  }

  const ss = SpreadsheetApp.open(files.next());

  // 폼 제출 트리거 설정
  ScriptApp.newTrigger('onFormSubmit')
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();

  Logger.log('✅ 자동 미리보기 트리거가 설정되었습니다!');
  Logger.log('이제 학생이 코드를 제출하면 미리보기 링크가 자동 생성됩니다.');
}

/**
 * 폼 제출 시 자동 실행되는 함수
 * - HTML 코드를 별도 HTML 파일로 저장
 * - 미리보기 링크를 스프레드시트에 추가
 */
function onFormSubmit(e) {
  try {
    const ss = e.source;
    const sheet = ss.getSheetByName('양식 응답 1') || ss.getSheets()[0];
    const lastRow = sheet.getLastRow();
    const rowData = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0];

    // 응답 데이터 파싱 (폼 응답 시트 구조: 타임스탬프, 학년반, 이름, 학번, 실습구분, HTML코드)
    const timestamp = rowData[0];
    const classInfo = rowData[1];
    const name = rowData[2];
    const studentId = rowData[3];
    const practiceType = rowData[4];
    const htmlCode = rowData[5];

    // HTML 파일 생성 (Drive에 저장)
    const folderName = '프로그래밍 3차시 - 학생 코드';
    let folder;
    const folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }

    // 파일명: 학년반_학번_이름_실습구분.html
    const practiceShort = practiceType.includes('1') ? '실습1' :
                          practiceType.includes('2') ? '실습2' : '프로젝트';
    const fileName = `${classInfo}_${studentId}_${name}_${practiceShort}.html`;

    // 기존 파일이 있으면 업데이트, 없으면 새로 생성
    const existingFiles = folder.getFilesByName(fileName);
    let file;
    if (existingFiles.hasNext()) {
      file = existingFiles.next();
      file.setContent(htmlCode);
    } else {
      file = folder.createFile(fileName, htmlCode, MimeType.HTML);
    }

    // 공유 설정 (링크가 있는 모든 사용자가 볼 수 있도록)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // 미리보기 URL 생성
    const previewUrl = `https://drive.google.com/file/d/${file.getId()}/preview`;

    // 스프레드시트에 미리보기 링크 추가
    // 양식 응답 시트의 마지막 열 다음에 추가
    const linkCol = sheet.getLastColumn() + 1;

    // 헤더가 없으면 추가
    if (sheet.getRange(1, linkCol).getValue() === '') {
      sheet.getRange(1, linkCol).setValue('미리보기');
      sheet.getRange(1, linkCol).setFontWeight('bold');
    }

    sheet.getRange(lastRow, linkCol).setValue(previewUrl);

    Logger.log(`✅ ${name}(${classInfo})의 코드가 저장되었습니다: ${fileName}`);

  } catch (error) {
    Logger.log('❌ 오류 발생: ' + error.message);
  }
}

/**
 * [선택] 모든 제출된 코드를 한번에 미리보기 페이지로 만드는 함수
 * 스프레드시트 데이터를 읽어 학생별 HTML 갤러리 페이지를 생성합니다.
 */
function createGalleryPage() {
  const files = DriveApp.getFilesByName(CONFIG.spreadsheetName);
  if (!files.hasNext()) {
    Logger.log('❌ 스프레드시트를 찾을 수 없습니다.');
    return;
  }

  const ss = SpreadsheetApp.open(files.next());
  const sheet = ss.getSheetByName('양식 응답 1') || ss.getSheets()[0];
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    Logger.log('❌ 제출된 데이터가 없습니다.');
    return;
  }

  // 갤러리 HTML 생성
  let galleryHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>프로그래밍 3차시 - 학생 코드 갤러리</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Noto Sans KR', sans-serif; background: #f5f5f5; padding: 2rem; }
  h1 { text-align: center; color: #1565c0; margin-bottom: 2rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem; }
  .card {
    background: white; border-radius: 1rem; overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  .card-header {
    background: #1565c0; color: white; padding: 0.8rem 1rem;
    display: flex; justify-content: space-between; align-items: center;
  }
  .card-header .name { font-weight: 700; }
  .card-header .info { font-size: 0.85rem; opacity: 0.8; }
  .card-preview {
    height: 300px; border: none; width: 100%;
    background: white;
  }
</style>
</head>
<body>
<h1>🎨 프로그래밍 3차시 - 학생 코드 갤러리</h1>
<div class="grid">`;

  // 데이터 순회 (1행은 헤더이므로 스킵)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const classInfo = row[1] || '';
    const name = row[2] || '';
    const studentId = row[3] || '';
    const practiceType = row[4] || '';
    const htmlCode = row[5] || '';

    // HTML 코드를 base64로 인코딩하여 iframe에 표시
    const encoded = Utilities.base64Encode(htmlCode, Utilities.Charset.UTF_8);

    galleryHtml += `
  <div class="card">
    <div class="card-header">
      <span class="name">${name} (${classInfo} ${studentId})</span>
      <span class="info">${practiceType}</span>
    </div>
    <iframe class="card-preview" srcdoc="${htmlCode.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}" sandbox="allow-same-origin"></iframe>
  </div>`;
  }

  galleryHtml += `
</div>
</body>
</html>`;

  // 갤러리 파일 저장
  const folderName = '프로그래밍 3차시 - 학생 코드';
  let folder;
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder(folderName);
  }

  const galleryFile = folder.createFile('갤러리.html', galleryHtml, MimeType.HTML);
  galleryFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  Logger.log('✅ 갤러리 페이지가 생성되었습니다!');
  Logger.log('URL: ' + galleryFile.getUrl());
}
