/**
 * Google Apps Script - 인공지능 시대 수업 설문 폼 생성기
 *
 * 사용 방법:
 * 1. https://script.google.com 에 접속
 * 2. "새 프로젝트" 클릭
 * 3. 이 코드를 전체 붙여넣기
 * 4. ▶ 실행 버튼 클릭 (createAIClassForm 함수 선택)
 * 5. Google 계정 권한 승인
 * 6. 실행 로그에서 폼 URL과 스프레드시트 URL 확인
 */

function createAIClassForm() {
  // ═══ 폼 생성 ═══
  const form = FormApp.create('🤖 인공지능 시대 - 생각 나누기');
  form.setDescription(
    '정보 1차시 수업 활동입니다.\n' +
    '영상을 보고 느낀 점과 생각을 자유롭게 적어주세요.\n' +
    '정답은 없습니다. 솔직한 나의 생각이 가장 중요합니다!'
  );
  form.setConfirmationMessage('제출이 완료되었습니다! 감사합니다 🎉');
  form.setAllowResponseEdits(false);
  form.setLimitOneResponsePerUser(false);
  form.setProgressBar(true);

  // ═══ 섹션 1: 기본 정보 ═══
  form.addSectionHeaderItem()
    .setTitle('📋 기본 정보');

  form.addTextItem()
    .setTitle('학번과 이름을 적어주세요')
    .setHelpText('예: 10101 홍길동')
    .setRequired(true);

  // ═══ 섹션 2: 영상 감상 ═══
  form.addSectionHeaderItem()
    .setTitle('🎬 영상 감상');

  form.addParagraphTextItem()
    .setTitle('영상에서 가장 인상 깊었던 장면이나 내용은 무엇인가요?')
    .setHelpText('구체적으로 어떤 부분이 왜 인상 깊었는지 적어주세요')
    .setRequired(true);

  // ═══ 섹션 3: 생각 나누기 ═══
  form.addSectionHeaderItem()
    .setTitle('💭 생각 나누기');

  form.addMultipleChoiceItem()
    .setTitle('AI가 앞으로 인간의 많은 직업을 대체할 수 있다고 생각하나요?')
    .setChoiceValues([
      '대부분의 직업이 대체될 것이다',
      '일부 직업만 대체될 것이다',
      '인간만의 영역은 대체되지 않을 것이다',
      '오히려 새로운 직업이 더 많이 생길 것이다',
      '잘 모르겠다'
    ])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('위 질문에 그렇게 답한 이유는 무엇인가요?')
    .setHelpText('자신의 경험이나 생각을 바탕으로 자유롭게 적어주세요')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('AI 시대에 우리에게 가장 필요한 능력은 무엇이라고 생각하나요?')
    .setHelpText('하나 이상의 능력을 적고, 그 이유도 간단히 설명해주세요')
    .setRequired(true);

  // ═══ 응답 스프레드시트 연결 ═══
  const ss = SpreadsheetApp.create('📊 인공지능 시대 - 응답 모음');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  // ═══ 결과 출력 ═══
  const formUrl = form.getPublishedUrl();
  const editUrl = form.getEditUrl();
  const sheetUrl = ss.getUrl();

  Logger.log('═══════════════════════════════════════');
  Logger.log('✅ 폼이 성공적으로 생성되었습니다!');
  Logger.log('');
  Logger.log('📝 학생 제출용 URL (이 링크를 공유하세요):');
  Logger.log(formUrl);
  Logger.log('');
  Logger.log('✏️ 폼 편집 URL:');
  Logger.log(editUrl);
  Logger.log('');
  Logger.log('📊 응답 스프레드시트 URL:');
  Logger.log(sheetUrl);
  Logger.log('═══════════════════════════════════════');

  // 편의를 위해 폼 URL 반환
  return {
    formUrl: formUrl,
    editUrl: editUrl,
    sheetUrl: sheetUrl
  };
}
