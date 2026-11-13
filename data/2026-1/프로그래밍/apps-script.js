/**
 * 프로그래밍 과목 활동지 — Google Apps Script (과목 공용)
 *
 * 이 스크립트 하나로 프로그래밍 과목의 모든 활동지 데이터를 받아
 * 활동지 종류(source)에 따라 각기 다른 시트 탭에 자동 저장합니다.
 *
 * [등록된 활동지]
 *   - 'web_project_plan'   → 웹사이트프로젝트_기획설계 시트
 *   - 'web_project_submit' → 웹사이트프로젝트_제출 시트
 *   - 'vibe_coding_plan'   → 바이브코딩_프로젝트계획 시트
 *   - 'vibe_coding_submit' → 바이브코딩_프로젝트제출 시트
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
 * 5. 배포 URL을 활동지.html 의 ⚙ 버튼 → URL 저장
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss   = SpreadsheetApp.getActiveSpreadsheet();

    if (data.source === 'live_session_archive') {
      // ── 라이브 세션 아카이브 (live-archive.js로 위임) ──
      return handleLiveSessionArchive(data, ss);
    }

    if (data.source === 'web_project_plan') {
      // ── 웹사이트 개발 프로젝트 — 기획·설계 활동지 ──
      var sheet = ss.getSheetByName('웹사이트프로젝트_기획설계') || ss.insertSheet('웹사이트프로젝트_기획설계');
      if (sheet.getLastRow() === 0) {
        sheet.appendRow([
          '제출시각', '이름', '반/번호', '날짜',
          '주제', '목적(왜 만드는가)', '대상 사용자', '핵심 메시지',
          '한줄 기획서',
          '보여줄 정보·콘텐츠', '사용자 행동·상호작용', '방문자 흐름·인상',
          '페이지 구조(Header)', '페이지 구조(Main)', '페이지 구조(Footer)',
          '동작 시나리오(글)',
          '자기 점검 — 목적 일관성', '자기 점검 — 동작 명확성', '추가 메모'
        ]);
        var h = sheet.getRange(1, 1, 1, 19);
        h.setBackground('#1A1A2E');
        h.setFontColor('#FFFFFF');
        h.setFontWeight('bold');
        sheet.setFrozenRows(1);
      }

      sheet.appendRow([
        new Date().toLocaleString('ko-KR'),
        data.studentName       || '',
        data.classInfo         || '',
        data.today             || '',
        data.topic             || '',
        data.purpose           || '',
        data.audience          || '',
        data.coreMessage       || '',
        data.oneLinePlan       || '',
        data.designContent     || '',
        data.designAction      || '',
        data.designFlow        || '',
        data.structHeader      || '',
        data.structMain        || '',
        data.structFooter      || '',
        data.scenario          || '',
        data.selfCheckPurpose  || '',
        data.selfCheckAction   || '',
        data.memo              || ''
      ]);

    } else if (data.source === 'web_project_submit') {
      // ── 웹사이트 개발 프로젝트 — 제출·성찰 활동지 ──
      var sheet2 = ss.getSheetByName('웹사이트프로젝트_제출') || ss.insertSheet('웹사이트프로젝트_제출');
      if (sheet2.getLastRow() === 0) {
        sheet2.appendRow([
          '제출시각', '이름', '반/번호', '날짜',
          '웹사이트 이름', '웹사이트 소개', '웹사이트 주소(URL)',
          '가장 공들인 부분', '배운 기술·개념', '막혔던 점·해결',
          '전체 느낀 점', '자신감 점수(1~5)', '자신감 수준', '자신감 이유',
          '선생님께 한마디'
        ]);
        var h2 = sheet2.getRange(1, 1, 1, 15);
        h2.setBackground('#1A1A2E');
        h2.setFontColor('#FFFFFF');
        h2.setFontWeight('bold');
        sheet2.setFrozenRows(1);
      }

      sheet2.appendRow([
        new Date().toLocaleString('ko-KR'),
        data.studentName       || '',
        data.classInfo         || '',
        data.today             || '',
        data.siteName          || '',
        data.siteDesc          || '',
        data.siteUrl           || '',
        data.effortPart        || '',
        data.learnedTech       || '',
        data.learnedStruggle   || '',
        data.feltOverall       || '',
        data.confidenceLevel   || '',
        data.confidenceText    || '',
        data.confidenceReason  || '',
        data.memo              || ''
      ]);

    } else if (data.source === 'vibe_coding_plan') {
      // ── 바이브 코딩 — 프로젝트 계획 빌더 활동지 ──
      var sheet3 = ss.getSheetByName('바이브코딩_프로젝트계획') || ss.insertSheet('바이브코딩_프로젝트계획');
      if (sheet3.getLastRow() === 0) {
        sheet3.appendRow([
          '제출시각', '이름', '반/번호', '날짜',
          '만들고 싶은 것', '만들고 싶은 이유', '사용할 사람',
          '방문자가 할 수 있는 일', '기능(직접 입력)',
          '분위기', '좋아하는 색',
          '꼭 들어갈 내용', '참고하고 싶은 것',
          '코딩 수준', 'AI에게 부탁할 점',
          '생성된 프롬프트'
        ]);
        var h3 = sheet3.getRange(1, 1, 1, 16);
        h3.setBackground('#6B21A8');
        h3.setFontColor('#FFFFFF');
        h3.setFontWeight('bold');
        sheet3.setFrozenRows(1);
      }

      sheet3.appendRow([
        new Date().toLocaleString('ko-KR'),
        data.studentName   || '',
        data.classInfo     || '',
        data.today         || '',
        data.projectIdea   || '',
        data.projectWhy    || '',
        data.projectWho    || '',
        data.features      || '',
        data.featureCustom || '',
        data.mood          || '',
        data.moodColor     || '',
        data.mustContents  || '',
        data.reference     || '',
        data.skillLevel    || '',
        data.aiRequest     || '',
        data.prompt        || ''
      ]);

    } else if (data.source === 'vibe_coding_submit') {
      // ── 바이브 코딩 프로젝트 — 제출·성찰 활동지 ──
      var sheet4 = ss.getSheetByName('바이브코딩_프로젝트제출') || ss.insertSheet('바이브코딩_프로젝트제출');
      if (sheet4.getLastRow() === 0) {
        sheet4.appendRow([
          '제출시각', '이름', '반/번호', '날짜',
          '작품 이름', '작품 소개', '작품 주소(URL)',
          '핵심 기능', '가장 공들인 부분', 'AI 효과적 요청법(배운 점)', '막혔던 점·해결',
          '전체 느낀 점', '자신감 점수(1~5)', '자신감 수준', '자신감 이유'
        ]);
        var h4 = sheet4.getRange(1, 1, 1, 15);
        h4.setBackground('#6B21A8');
        h4.setFontColor('#FFFFFF');
        h4.setFontWeight('bold');
        sheet4.setFrozenRows(1);
      }

      sheet4.appendRow([
        new Date().toLocaleString('ko-KR'),
        data.studentName       || '',
        data.classInfo         || '',
        data.today             || '',
        data.workName          || '',
        data.workDesc          || '',
        data.workUrl           || '',
        data.coreFeature       || '',
        data.effortPart        || '',
        data.aiPrompting       || '',
        data.learnedStruggle   || '',
        data.feltOverall       || '',
        data.confidenceLevel   || '',
        data.confidenceText    || '',
        data.confidenceReason  || ''
      ]);

    } else if (data.source === 'programming_selfeval') {
      // ── 프로그래밍(웹 개발) — 한 학기 자기평가서 ──
      var sheet5 = ss.getSheetByName('프로그래밍_자기평가서') || ss.insertSheet('프로그래밍_자기평가서');
      if (sheet5.getLastRow() === 0) {
        sheet5.appendRow([
          '제출시각', '이름', '반/번호', '날짜',
          '자기평가문', '가장 기억에 남는 수업·활동', '가장 기억에 남는 이유'
        ]);
        var h5 = sheet5.getRange(1, 1, 1, 7);
        h5.setBackground('#6B5DD3');
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
      // ── 정의되지 않은 source ──
      var fallback = ss.getSheetByName('미분류') || ss.insertSheet('미분류');
      if (fallback.getLastRow() === 0) {
        fallback.appendRow(['제출시각', 'source', 'JSON 전체']);
        var hf = fallback.getRange(1, 1, 1, 3);
        hf.setBackground('#9CA3AF'); hf.setFontColor('#FFFFFF'); hf.setFontWeight('bold');
        fallback.setFrozenRows(1);
      }
      fallback.appendRow([
        new Date().toLocaleString('ko-KR'),
        data.source || '(없음)',
        JSON.stringify(data)
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
