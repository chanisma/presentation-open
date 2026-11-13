/**
 * 스팀(융합수업) 활동지 수집용 Apps Script
 *
 * 배포: 확장 프로그램 → Apps Script → 배포 → 새 배포 → 웹 앱
 *   - 실행 계정: 나(스크립트 소유자)
 *   - 액세스 권한: 모든 사용자 (익명 포함)   ← 반드시 이 값
 *
 * 활동지가 늘어나면 data.source 값으로 분기를 추가한다.
 *   matrix_network  — 디지털 네트워크와 행렬 (수학×정보 융합, 단일 활동지)
 *   net_python      — 정보편 활동1 · 파이썬으로 관계 표현하기
 *   net_centrality  — 정보편 활동2 · 중심성 비교
 *   net_aiprompt    — 정보편 활동3 · AI에게 좋은 질문하기
 *   net_project     — 정보편 활동4 · 프로젝트 설계
 *   net_projectlog  — 정보편 활동5 · 프로젝트 진행 워크북
 *   net_advanced    — 정보편 활동6 · 데이터로 만드는 심화 결과물
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (data.source === 'live_session_archive') {
      // ── 라이브 세션 아카이브 (live-archive.js로 위임) ──
      return handleLiveSessionArchive(data, ss);
    }
    if (data.source === 'matrix_network') {
      return handleMatrixNetwork(ss, data);
    }
    if (data.source === 'net_python') {
      return handleNetPython(ss, data);
    }
    if (data.source === 'net_centrality') {
      return handleNetCentrality(ss, data);
    }
    if (data.source === 'net_aiprompt') {
      return handleNetAiprompt(ss, data);
    }
    if (data.source === 'net_project') {
      return handleNetProject(ss, data);
    }
    if (data.source === 'net_projectlog') {
      return handleNetProjectLog(ss, data);
    }
    if (data.source === 'net_advanced') {
      return handleNetAdvanced(ss, data);
    }

    // 알 수 없는 source — 원본을 그대로 남겨 유실 방지
    var misc = ss.getSheetByName('기타제출') || ss.insertSheet('기타제출');
    if (misc.getLastRow() === 0) misc.appendRow(['제출시각', 'source', '원본JSON']);
    misc.appendRow([nowKST(), data.source || '(없음)', JSON.stringify(data)]);

    return ok({ status: 'ok', note: 'unknown source stored' });
  } catch (err) {
    return ok({ status: 'error', message: err.message });
  }
}

/** 디지털 네트워크와 행렬 활동지 */
function handleMatrixNetwork(ss, data) {
  var NAME = '행렬네트워크활동지';
  var HEADERS = [
    '제출시각', '이름', '반/번호', '모둠명', '날짜',
    '모둠인원', '모둠원',
    '인접행렬A', '차수(행합)', '허브', '연결최소',
    '학생이적은A제곱', '정답A제곱', 'A제곱정확도', '정답보기사용',
    '발견_허브와소외', '발견_대각선의미', '발견_0인데친구',
    '후보비교', '선택한연결', '선택근거'
  ];

  var sheet = ss.getSheetByName(NAME) || ss.insertSheet(NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    var h = sheet.getRange(1, 1, 1, HEADERS.length);
    h.setBackground('#3E9C93');
    h.setFontColor('#FFFFFF');
    h.setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(8, 220);   // 인접행렬A
    sheet.setColumnWidth(12, 220);  // 학생 A²
    sheet.setColumnWidth(13, 220);  // 정답 A²
    [16, 17, 18, 21].forEach(function (c) { sheet.setColumnWidth(c, 320); });
  }

  sheet.appendRow([
    nowKST(),
    data.studentName || '',
    data.classInfo || '',
    data.teamName || '',
    data.today || '',
    data.memberCount || '',
    data.members || '',
    data.matrixA || '',
    data.degrees || '',
    data.hub || '',
    data.lowest || '',
    data.matrixA2Mine || '',
    data.matrixA2True || '',
    data.a2Correct || '',
    data.answerShown || '',
    data.q1 || '',
    data.q2 || '',
    data.q3 || '',
    data.candidateTable || '',
    data.pickedCandidate || '',
    data.q4 || ''
  ]);

  // 서술형 칸은 줄바꿈이 보이도록
  var r = sheet.getLastRow();
  sheet.getRange(r, 16, 1, 3).setWrap(true);
  sheet.getRange(r, 21).setWrap(true);

  return ok({ status: 'ok' });
}

/* ─────────────────────────────────────────────
 *  정보편 4개 활동지 (스팀/정보네트워크/활동1~4.html)
 * ───────────────────────────────────────────── */

/** 공통: 시트를 얻고 헤더가 없으면 만든 뒤, 행을 추가하고 서술형 칸을 wrap한다 */
function appendToSheet(ss, name, headers, row, wrapCols) {
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    var h = sheet.getRange(1, 1, 1, headers.length);
    h.setBackground('#3E9C93');
    h.setFontColor('#FFFFFF');
    h.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  sheet.appendRow(row);
  var r = sheet.getLastRow();
  (wrapCols || []).forEach(function (c) { sheet.getRange(r, c).setWrap(true); });
  return ok({ status: 'ok' });
}

/** 활동1 · 파이썬으로 관계 표현하기 */
function handleNetPython(ss, data) {
  return appendToSheet(ss, '정보1_파이썬실습',
    ['제출시각', '이름', '반/번호', '친구목록', '인접행렬A', '차수(A.sum)',
     'A제곱대각선', '성찰_차수vs대각선', '성찰_가장많은노드', '성찰_숫자바꾸면'],
    [nowKST(), data.studentName || '', data.classInfo || '', data.members || '',
     data.matrixA || '', data.degrees || '', data.a2diag || '',
     data.q1 || '', data.q2 || '', data.q3 || ''],
    [8, 9, 10]);
}

/** 활동2 · 중심성 비교 */
function handleNetCentrality(ss, data) {
  return appendToSheet(ss, '정보2_중심성비교',
    ['제출시각', '이름', '반/번호', '노드수', '엣지수',
     '연결정도1위', '근접성1위', '매개성1위', '중심성표',
     '성찰_다른이유', '성찰_상황별중요인물', '성찰_현실적용'],
    [nowKST(), data.studentName || '', data.classInfo || '',
     data.nodes || '', data.edges || '',
     data.topDegree || '', data.topCloseness || '', data.topBetweenness || '',
     data.centrality || '', data.q1 || '', data.q2 || '', data.q3 || ''],
    [9, 10, 11, 12]);
}

/** 활동3 · AI에게 좋은 질문하기 */
function handleNetAiprompt(ss, data) {
  return appendToSheet(ss, '정보3_AI프롬프트',
    ['제출시각', '이름', '반/번호', '목표', '프롬프트',
     '담긴요소', '요소수', '검증방법', '이해안되는줄해결'],
    [nowKST(), data.studentName || '', data.classInfo || '',
     data.goal || '', data.prompt || '',
     data.elements || '', data.elementCount || '',
     data.verify || '', data.q1 || ''],
    [4, 5, 6, 8, 9]);
}

/** 활동4 · 프로젝트 설계 */
function handleNetProject(ss, data) {
  return appendToSheet(ss, '정보4_프로젝트설계',
    ['제출시각', '이름', '반/번호', '모둠명', '유형',
     '질문', '노드', '엣지', '방향', '가중치',
     '데이터수집', '지표', '제안', '자가점검', '역할분담', 'AI활용계획'],
    [nowKST(), data.studentName || '', data.classInfo || '', data.teamName || '',
     data.ptype || '', data.question || '', data.node || '', data.edge || '',
     data.dir || '', data.wgt || '', data.data || '', data.metric || '',
     data.propose || '', data.checkScore || '', data.roles || '', data.aiplan || ''],
    [6, 7, 8, 11, 12, 13, 15, 16]);
}

/** 활동6 · 데이터로 만드는 심화 결과물 (프롬프트 + AI 결과 코드) */
function handleNetAdvanced(ss, data) {
  var code = String(data.resultCode || '');
  // 시트 셀 한도(약 5만자) 보호: 너무 길면 잘라 저장하고, 원본은 학생 .html 파일로 제출됨
  var codeCell = code.length > 45000
    ? code.slice(0, 45000) + '\n...(이하 생략, 총 ' + code.length + '자 — 원본은 제출 .html 참고)'
    : code;
  return appendToSheet(ss, '정보6_심화결과물',
    ['제출시각', '이름', '반/번호', '모둠명', '주제', '심화유형',
     '노드수', '관계수', '인접행렬', '코드길이', '결과코드(HTML)',
     '관찰1_새로알게된것', '관찰2_소감',
     '확장_관심분야', '확장_노드엣지', '확장_질문', '확장_결과물아이디어'],
    [nowKST(), data.studentName || '', data.classInfo || '', data.teamName || '',
     data.topic || '', data.kindName || '',
     data.nodeCount || '', data.edgeCount || '', data.matrix || '', data.codeLength || '', codeCell,
     data.q1 || '', data.q2 || '',
     data.ext_field || '', data.ext_ne || '', data.ext_q || '', data.ext_idea || ''],
    [5, 9, 11, 12, 13, 15, 16, 17]);
}

/** 활동5 · 프로젝트 진행 워크북 (5단계 과정+결과) */
function handleNetProjectLog(ss, data) {
  var s2code = String(data.s2_code || '');
  // 시트 셀 한도 보호: AI 결과 코드가 아주 길면 잘라 저장(원본은 학생 제출 TXT 참고)
  if (s2code.length > 45000) {
    s2code = s2code.slice(0, 45000) + '\n...(이하 생략, 총 ' + s2code.length + '자)';
  }
  return appendToSheet(ss, '정보5_프로젝트진행',
    ['제출시각', '이름', '반/번호', '모둠명', '프로젝트', '진행률',
     '1_수집방법', '1_노드', '1_관계', '1_인접행렬',
     '2_프롬프트', '2_결과코드', '2_지표', '2_결과',
     '3_구조', '3_해석',
     '4_실험', '4_변화', '4_제안',
     '5_결론', '5_검증', '5_한계', '5_역할'],
    [nowKST(), data.studentName || '', data.classInfo || '', data.teamName || '',
     data.topic || '', data.progress || '',
     data.s1_method || '', data.s1_nodes || '', data.s1_edges || '', data.s1_matrix || '',
     data.s2_prompt || '', s2code, data.s2_metric || '', data.s2_result || '',
     data.s3_structure || '', data.s3_interpret || '',
     data.s4_experiment || '', data.s4_change || '', data.s4_propose || '',
     data.s5_conclusion || '', data.s5_verify || '', data.s5_limit || '', data.s5_roles || ''],
    [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]);
}

function nowKST() {
  return Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
}

function ok(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** 배포 확인용 — 브라우저로 URL을 열었을 때 응답 */
function doGet() {
  return ContentService
    .createTextOutput('스팀 활동지 수집기가 작동 중입니다.')
    .setMimeType(ContentService.MimeType.TEXT);
}
