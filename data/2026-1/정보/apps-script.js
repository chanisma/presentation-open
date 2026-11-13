/**
 * 정보 과목 활동지 — Google Apps Script (과목 공용)
 *
 * 이 스크립트 하나로 정보 과목의 모든 활동지 데이터를 받아
 * 활동지 종류(source)에 따라 각기 다른 시트 탭에 자동 저장합니다.
 *
 * [등록된 활동지]
 *   - 'writing-prompt' (기본) → 자기평가문활동지 시트
 *   - 'notebooklm'            → 에이전틱AI활동지 시트
 *   - 'deeplearning'          → 딥러닝기초활동지 시트 (이미지 3장 → Drive 저장)
 *   - 'tm_project'            → 이미지분류프로젝트활동지 시트 (이미지 2장 → Drive 폴더 저장)
 *
 * [새 활동지 추가 방법]
 *   1. 활동지 HTML의 getFormData()에 source: '식별자' 추가
 *   2. 아래 doPost()에 else if (data.source === '식별자') 블록 추가
 *   3. 재배포 (배포 관리 → 새 버전)
 *
 * [최초 설정]
 * 1. Google 스프레드시트 열기
 * 2. 확장 프로그램 → Apps Script
 * 3. 이 파일 내용 전체 붙여넣기
 * 4. 배포 → 새 배포 → 웹 앱
 *    - 실행 계정: 나
 *    - 액세스 권한: 모든 사용자 (익명 포함) ← 반드시 이것
 * 5. 배포 URL을 각 활동지.html 의 ⚙ 버튼 → URL 저장
 *    (모든 활동지가 동일한 URL을 사용)
 */

/**
 * [최초 1회] Apps Script 편집기에서 이 함수를 실행(▶)하여
 * Google Drive 접근 권한을 승인하세요.
 * 승인 후에는 이 함수를 삭제해도 됩니다.
 */
function authorizeDrive() {
  // 임시 파일 생성 → 삭제 (drive 쓰기 권한 트리거)
  var tempFile = DriveApp.createFile('auth_test.txt', 'temp', 'text/plain');
  tempFile.setTrashed(true);
  // 폴더 생성 → 삭제 (createFolder 권한 트리거)
  var tempFolder = DriveApp.createFolder('_auth_test_삭제해도됨');
  tempFolder.setTrashed(true);
  Logger.log('Drive 전체 권한 승인 완료! (파일 생성/폴더 생성/공유 설정 모두 가능)');
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss   = SpreadsheetApp.getActiveSpreadsheet();

    if (data.source === 'live_session_archive') {
      // ── 라이브 세션 아카이브 (live-archive.js로 위임) ──
      return handleLiveSessionArchive(data, ss);
    }

    if (data.source === 'deeplearning') {
      // ── 딥러닝 기초 활동지 (이미지 3장 포함) ──
      var sheet3 = ss.getSheetByName('딥러닝기초활동지') || ss.insertSheet('딥러닝기초활동지');
      if (sheet3.getLastRow() === 0) {
        sheet3.appendRow([
          '제출시각', '이름', '반/번호', '날짜',
          '테스트결과1', '테스트결과2', '테스트결과3',
          'Q1_틀린이유', 'Q2_데이터양', 'Q3_고양이', 'Q4_전이학습'
        ]);
        var h3 = sheet3.getRange(1, 1, 1, 11);
        h3.setBackground('#1E2033');
        h3.setFontColor('#FFFFFF');
        h3.setFontWeight('bold');
        sheet3.setFrozenRows(1);
      }

      // 이미지 처리 (각각 try-catch로 감싸서 실패해도 텍스트는 저장)
      var imgUrl1 = '', imgUrl2 = '', imgUrl3 = '';
      try { if (data.image1) imgUrl1 = saveImageToDrive(data.image1, (data.studentName || 'unknown') + '_1'); } catch(imgErr1) { imgUrl1 = '이미지저장실패'; }
      try { if (data.image2) imgUrl2 = saveImageToDrive(data.image2, (data.studentName || 'unknown') + '_2'); } catch(imgErr2) { imgUrl2 = '이미지저장실패'; }
      try { if (data.image3) imgUrl3 = saveImageToDrive(data.image3, (data.studentName || 'unknown') + '_3'); } catch(imgErr3) { imgUrl3 = '이미지저장실패'; }

      sheet3.appendRow([
        new Date().toLocaleString('ko-KR'),
        data.studentName || '',
        data.classInfo   || '',
        data.today       || '',
        imgUrl1 && imgUrl1 !== '이미지저장실패' ? '=IMAGE("' + imgUrl1 + '")' : imgUrl1,
        imgUrl2 && imgUrl2 !== '이미지저장실패' ? '=IMAGE("' + imgUrl2 + '")' : imgUrl2,
        imgUrl3 && imgUrl3 !== '이미지저장실패' ? '=IMAGE("' + imgUrl3 + '")' : imgUrl3,
        data.q1 || '',
        data.q2 || '',
        data.q3 || '',
        data.q4 || ''
      ]);

      // 이미지가 있으면 행 높이 키우기
      if (imgUrl1 || imgUrl2 || imgUrl3) {
        sheet3.setRowHeight(sheet3.getLastRow(), 150);
      }

    } else if (data.source === 'tm_project') {
      // ── 이미지 분류 인공지능 프로젝트 활동지 (이미지 2장 → Drive 폴더 저장) ──
      var sheet4 = ss.getSheetByName('이미지분류프로젝트활동지') || ss.insertSheet('이미지분류프로젝트활동지');
      if (sheet4.getLastRow() === 0) {
        sheet4.appendRow([
          '제출시각', '이름', '반/번호',
          '프로젝트 주제', '주제 선정 배경',
          '분류 대상', '고려 요소',
          '데이터 이미지1', '데이터 이미지2',
          '테스트 결과(JSON)', '정확도', '테스트 분석',
          '배운 점', '성능 개선 방안', '활용 아이디어'
        ]);
        var h4 = sheet4.getRange(1, 1, 1, 15);
        h4.setBackground('#4F46E5');
        h4.setFontColor('#FFFFFF');
        h4.setFontWeight('bold');
        sheet4.setFrozenRows(1);
      }

      // 이미지 → Drive "2026-1 이미지 분류 프로젝트" 폴더에 저장
      var imgUrl1 = '', imgUrl2 = '';
      var images = data.images || [];
      var namePrefix = (data.studentName || 'unknown') + '_' + (data.classInfo || '').replace(/\s/g, '');
      try { if (images[0]) imgUrl1 = saveImageToFolder(images[0], namePrefix + '_학습데이터', '2026-1 이미지 분류 프로젝트'); } catch(e1) { imgUrl1 = '오류: ' + e1.message; }
      try { if (images[1]) imgUrl2 = saveImageToFolder(images[1], namePrefix + '_테스트데이터', '2026-1 이미지 분류 프로젝트'); } catch(e2) { imgUrl2 = '오류: ' + e2.message; }

      var factors = [data.factor1, data.factor2, data.factor3, data.factor4].filter(Boolean).join(', ');

      sheet4.appendRow([
        new Date().toLocaleString('ko-KR'),
        data.studentName  || '',
        data.classInfo    || '',
        data.topic        || '',
        data.topicReason  || '',
        data.categories   || '',
        factors,
        imgUrl1 && imgUrl1 !== '이미지저장실패' ? '=IMAGE("' + imgUrl1 + '")' : imgUrl1,
        imgUrl2 && imgUrl2 !== '이미지저장실패' ? '=IMAGE("' + imgUrl2 + '")' : imgUrl2,
        JSON.stringify(data.testResults || []),
        data.accuracy     || '',
        data.analysis     || '',
        data.reflection   || '',
        data.improvement  || '',
        data.extension    || ''
      ]);

      // 이미지가 있으면 행 높이 키우기
      if (imgUrl1 || imgUrl2) {
        sheet4.setRowHeight(sheet4.getLastRow(), 150);
      }

    } else if (data.source === 'notebooklm') {
      // ── 에이전틱AI·NotebookLM 활동지 ──
      var sheet2 = ss.getSheetByName('에이전틱AI활동지') || ss.insertSheet('에이전틱AI활동지');
      if (sheet2.getLastRow() === 0) {
        sheet2.appendRow([
          '제출시각', '이름', '반/번호', '날짜',
          '소스1', '소스2', '소스3', '소스관찰',
          '미션1산출물', '미션1별점', '미션1메모',
          '미션2유형', '미션2산출물', '미션2별점', '미션2메모',
          '미션3유형', '미션3산출물', '미션3별점', '미션3메모',
          'Q1최고미션', 'Q1이유',
          'Q2오류여부', 'Q2틀린내용', 'Q2누락내용',
          'Q3판정', 'Q3이유',
          '단계1요약', '단계2요약', '단계3요약', '인간의역할'
        ]);
        var h2 = sheet2.getRange(1, 1, 1, 30);
        h2.setBackground('#1B7ED4');
        h2.setFontColor('#FFFFFF');
        h2.setFontWeight('bold');
        sheet2.setFrozenRows(1);
      }
      sheet2.appendRow([
        new Date().toLocaleString('ko-KR'),
        data.studentName   || '',
        data.classInfo     || '',
        data.today         || '',
        data.src1          || '',
        data.src2          || '',
        data.src3          || '',
        data.srcObserve    || '',
        data.m1output      || '',
        data.m1stars       || '',
        data.m1memo        || '',
        data.m2type        || '',
        data.m2output      || '',
        data.m2stars       || '',
        data.m2memo        || '',
        data.m3type        || '',
        data.m3output      || '',
        data.m3stars       || '',
        data.m3memo        || '',
        data.q1best        || '',
        data.q1reason      || '',
        data.q2error       || '',
        data.q2wrong       || '',
        data.q2missing     || '',
        data.q3verdict     || '',
        data.q3reason      || '',
        data.step1summary  || '',
        data.step2summary  || '',
        data.step3summary  || '',
        data.humanRole     || ''
      ]);

    } else if (data.source === 'info_selfeval') {
      // ── 정보(인공지능) — 한 학기 자기평가서 ──
      var sheet5 = ss.getSheetByName('정보_자기평가서') || ss.insertSheet('정보_자기평가서');
      if (sheet5.getLastRow() === 0) {
        sheet5.appendRow([
          '제출시각', '이름', '반/번호', '날짜',
          '자기평가문', '가장 기억에 남는 수업·활동', '가장 기억에 남는 이유'
        ]);
        var h5 = sheet5.getRange(1, 1, 1, 7);
        h5.setBackground('#2F6BE0');
        h5.setFontColor('#FFFFFF');
        h5.setFontWeight('bold');
        sheet5.setFrozenRows(1);
      }

      sheet5.appendRow([
        new Date().toLocaleString('ko-KR'),
        data.studentName    || '',
        data.classInfo      || '',
        data.today          || '',
        data.selfEval       || '',
        data.memorableTopic || '',
        data.mostMemorable  || ''
      ]);

    } else {
      // ── 글쓰기 프롬프트 설계 활동지 (기본) ──
      var sheet = ss.getSheetByName('자기평가문활동지') || ss.insertSheet('자기평가문활동지');
      if (sheet.getLastRow() === 0) {
        sheet.appendRow([
          '제출시각', '이름', '반/번호', '날짜',
          '과목', '활동명', '활동시기',
          '①무엇을했나', '②어떻게했나', '③배운점', '④느낀점',
          '역할Role', '맥락Context', '과제Task', '형식Format',
          '고급기법', '기법적용내용',
          'AI초안', '수정오류', '추가내용', '최종자기평가문',
          '효과적기법', '개선점', 'AI와나의역할'
        ]);
        var h = sheet.getRange(1, 1, 1, 24);
        h.setBackground('#F27321');
        h.setFontColor('#FFFFFF');
        h.setFontWeight('bold');
        sheet.setFrozenRows(1);
      }
      var advContent = data.advEx1 || data.advEx2 || data.advEx3 || '';
      sheet.appendRow([
        new Date().toLocaleString('ko-KR'),
        data.studentName    || '',
        data.classInfo      || '',
        data.today          || '',
        data.subject        || '',
        data.activityName   || '',
        data.activityDate   || '',
        data.memo1          || '',
        data.memo2          || '',
        data.memo3          || '',
        data.memo4          || '',
        data.elemRole       || '',
        data.elemContext    || '',
        data.elemTask       || '',
        data.elemFormat     || '',
        data.advTech        || '',
        advContent,
        data.aiDraft        || '',
        data.fixError       || '',
        data.fixAdd         || '',
        data.finalText      || '',
        data.reflect1       || '',
        data.reflect2       || '',
        data.reflect3       || ''
      ]);
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
 * base64 이미지를 Google Drive에 저장하고 공유 URL 반환
 * @param {string} base64String - "data:image/jpeg;base64,..." 형태
 * @param {string} prefix - 파일명 앞에 붙일 구분자 (학번 등)
 */
function saveImageToDrive(base64String, prefix) {
  var match = base64String.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return '';

  var mimeType = match[1];
  var ext = mimeType.split('/')[1] === 'jpeg' ? 'jpg' : mimeType.split('/')[1];
  var blob = Utilities.newBlob(
    Utilities.base64Decode(match[2]),
    mimeType,
    prefix + '_' + new Date().getTime() + '.' + ext
  );

  var file = DriveApp.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return 'https://lh3.googleusercontent.com/d/' + file.getId();
}

/**
 * base64 이미지를 Google Drive 특정 폴더에 저장하고 공유 URL 반환
 * @param {string} base64String - "data:image/jpeg;base64,..." 형태
 * @param {string} prefix - 파일명 앞에 붙일 구분자
 * @param {string} folderName - Drive 폴더명 (없으면 자동 생성)
 */
function saveImageToFolder(base64String, prefix, folderName) {
  var match = base64String.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return '';

  var mimeType = match[1];
  var ext = mimeType.split('/')[1] === 'jpeg' ? 'jpg' : mimeType.split('/')[1];
  var blob = Utilities.newBlob(
    Utilities.base64Decode(match[2]),
    mimeType,
    prefix + '_' + new Date().getTime() + '.' + ext
  );

  var folder;
  var folders = DriveApp.getFoldersByName(folderName);
  folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return 'https://lh3.googleusercontent.com/d/' + file.getId();
}
