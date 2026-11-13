/**
 * Google Apps Script - 프로그래밍 2차시 웹사이트 구조 분석 활동지
 *
 * 사용법:
 * 1. https://script.google.com 접속
 * 2. 새 프로젝트 생성
 * 3. 이 코드를 붙여넣기
 * 4. createActivityForm 함수 실행
 * 5. 생성된 폼 URL이 로그에 출력됩니다
 */

function createActivityForm() {
  // 폼 생성
  var form = FormApp.create('[프로그래밍 2차시] 웹사이트 구조 분석 활동지');
  form.setDescription(
    '좋아하는 웹사이트를 선택하고, 헤더/내비게이션/메인/푸터 영역을 분석해 봅시다.\n' +
    'F12(개발자 도구)를 활용하여 실제 코드에서 각 영역이 어떤 태그로 구현되어 있는지도 확인해 보세요!'
  );
  form.setCollectEmail(false);
  form.setAllowResponseEdits(true);
  form.setLimitOneResponsePerUser(false);

  // ── 섹션 1: 기본 정보 ──
  form.addSectionHeaderItem()
    .setTitle('기본 정보')
    .setHelpText('이름, 반, 번호를 입력해 주세요.');

  form.addTextItem()
    .setTitle('이름')
    .setRequired(true);

  form.addTextItem()
    .setTitle('학년 / 반 / 번호')
    .setHelpText('예: 1학년 3반 15번')
    .setRequired(true);

  // ── 섹션 2: 웹사이트 선택 ──
  form.addSectionHeaderItem()
    .setTitle('분석할 웹사이트 선택')
    .setHelpText('좋아하는 웹사이트를 하나 선택하세요. 네이버, 유튜브, 인스타그램, 학교 홈페이지 등 어떤 사이트든 좋습니다!');

  form.addTextItem()
    .setTitle('분석할 웹사이트 이름')
    .setHelpText('예: 네이버, 유튜브, 멜론 등')
    .setRequired(true);

  form.addTextItem()
    .setTitle('웹사이트 주소(URL)')
    .setHelpText('예: https://www.naver.com')
    .setRequired(true);

  // ── 섹션 3: 눈으로 영역 찾기 ──
  form.addSectionHeaderItem()
    .setTitle('STEP 1: 눈으로 영역 찾기')
    .setHelpText('웹사이트를 보면서 4가지 영역을 찾아보세요.\n\n' +
      '- Header(헤더): 사이트 상단 - 로고, 검색창 등\n' +
      '- Nav(내비게이션): 메뉴, 링크 모음\n' +
      '- Main(메인): 본문 내용, 핵심 정보\n' +
      '- Footer(푸터): 사이트 하단 - 연락처, 저작권 등');

  form.addParagraphTextItem()
    .setTitle('Header(헤더) 영역에는 어떤 내용이 있나요?')
    .setHelpText('예: 네이버 로고, 검색창, 로그인 버튼이 있습니다.')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('Nav(내비게이션) 영역에는 어떤 내용이 있나요?')
    .setHelpText('예: 메일, 카페, 블로그, 쇼핑 등의 메뉴가 있습니다.')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('Main(메인) 영역에는 어떤 내용이 있나요?')
    .setHelpText('예: 뉴스 기사, 날씨, 실시간 검색어 등이 있습니다.')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('Footer(푸터) 영역에는 어떤 내용이 있나요?')
    .setHelpText('예: 이용약관, 개인정보처리방침, 회사 주소 등이 있습니다.')
    .setRequired(true);

  // ── 섹션 4: 개발자 도구로 코드 확인 ──
  form.addSectionHeaderItem()
    .setTitle('STEP 2: F12 개발자 도구로 코드 확인하기')
    .setHelpText('F12 키를 누르거나 Ctrl+Shift+I를 눌러 개발자 도구를 열어보세요.\n' +
      'Elements 탭에서 코드를 살펴보며, 각 영역에 사용된 태그를 찾아보세요.\n\n' +
      '힌트: <header>, <nav>, <main>, <footer>, <div> 등의 태그를 찾아보세요!');

  form.addParagraphTextItem()
    .setTitle('헤더 영역에 사용된 태그 이름은 무엇인가요?')
    .setHelpText('예: <header> 태그가 사용되었습니다. / <div class="header">로 되어 있습니다.')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('내비게이션 영역에 사용된 태그 이름은 무엇인가요?')
    .setHelpText('예: <nav> 태그가 사용되었습니다.')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('메인 콘텐츠 영역에 사용된 태그 이름은 무엇인가요?')
    .setHelpText('예: <main> 태그가 사용되었습니다. / <div id="content">로 되어 있습니다.')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('푸터 영역에 사용된 태그 이름은 무엇인가요?')
    .setHelpText('예: <footer> 태그가 사용되었습니다.')
    .setRequired(true);

  // ── 섹션 5: 느낀 점 ──
  form.addSectionHeaderItem()
    .setTitle('활동을 마치며');

  form.addMultipleChoiceItem()
    .setTitle('개발자 도구(F12)를 사용해 본 경험이 어땠나요?')
    .setChoiceValues([
      '신기했다! 웹사이트가 코드로 만들어진다는 게 놀라웠다.',
      '재미있었다! 코드와 화면이 연결되는 게 흥미로웠다.',
      '어려웠다. 코드가 너무 복잡해 보였다.',
      '보통이었다.'
    ])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('오늘 수업에서 새롭게 알게 된 것이나 느낀 점을 자유롭게 적어주세요.')
    .setRequired(false);

  // 로그 출력
  Logger.log('활동지 폼이 생성되었습니다!');
  Logger.log('편집 URL: ' + form.getEditUrl());
  Logger.log('응답 URL: ' + form.getPublishedUrl());

  return form;
}
