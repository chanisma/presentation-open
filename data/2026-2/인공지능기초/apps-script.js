/**
 * 인공지능 기초 (2026-2) 활동지 — Google Apps Script (과목 공용)
 *
 * 이 스크립트 하나로 '인공지능 기초' 과목의 모든 활동지 데이터를 받아
 * 활동지 종류(source)에 따라 각기 다른 시트 탭에 자동 저장합니다.
 *
 * [등록된 활동지]
 *   - 'ai_world_explore' → AI세상탐험일지 시트 (인공지능이 바꾸는 세상)
 *   - 'design_recover'   → 글의설계도되찾기 시트 (LLM은 어떻게 다음 말을 고를까)
 *   - 'prompt_lab'       → 프롬프트실험일지 시트 (같은 수업의 이전 판 — 조회용으로만 남김)
 *   - 'first_ai_service' → 나의첫AI서비스 시트 (나의 첫 AI 서비스)
 *   - 'video_four_cuts'  → 트랜스포머영상4컷 시트 (트랜스포머는 어떻게 영상과 음악을 만들까)
 *   - 'chihuahua_muffin' → 치와와머핀분류기 시트 (인공지능은 어떻게 배울까)
 *   - 'image_classifier_project' → 이미지분류AI프로젝트 시트 (이미지 분류 AI 프로젝트)
 *                                  B6 캡처는 Drive 폴더에 저장 (최초 1회 authorizeDrive 실행 필요)
 *   - 'python_var_func'  → 파이썬변수와함수 시트 (이름으로 기억하고, 이름으로 부른다 — 웹 파이썬 활동지)
 *   - 'python_input_types' → 파이썬입력과자료형 시트 (물어보고, 받아서, 계산한다 — 웹 파이썬 활동지, 중간 저장·제출 모두 새 행)
 *   - 'game_clear'       → 점등봇현황·점등봇클리어기록, 심야라면현황·심야라면클리어기록 시트
 *                          (문제를 푸는 과정을 설계하다 — 게임 클리어 기록이 활동지를 대신한다)
 *
 * [기능]
 *   - doPost : 활동지 제출 저장 (암호는 SHA-256 해시로만 저장, 원문 저장 안 함)
 *              SOURCES의 deadline이 지나면 저장하지 않고 status: 'closed'를 돌려준다
 *   - doGet  : 제출 확인·불러오기 (학번 + 이름 + 암호로 마지막 제출 조회)
 *              ?action=lookup&source=ai_world_explore&studentId=..&studentName=..&password=..
 *              &callback=fn 을 붙이면 JSONP로 응답 (브라우저 CORS 우회용)
 *   - doGet  : 제출 현황판 ?action=board&studentId=..&studentName=..
 *              제출 인원 수와 '본인' 상태만 돌려준다 — 다른 학생이 누구인지,
 *              무엇을 썼는지는 응답에 담지 않는다 (내용은 lookup + 암호로만).
 *
 * [새 활동지 추가 방법]
 *   1. 활동지 HTML의 getFormData()에 source: '식별자' 추가
 *   2. 이 파일에 [시트 헤더, 폼 키] 배열을 만들고 SOURCES에 한 줄 등록
 *      (doPost·doGet lookup이 그 정의를 함께 쓴다)
 *   3. 현황판에 띄우려면 ASSIGNMENTS에도 한 줄 추가
 *   4. 재배포 (배포 관리 → 새 버전 — Claude Code 훅이 자동 실행)
 *
 * [최초 설정]
 * 1. Google 스프레드시트 열기 (2026-2 인공지능기초 활동지 모음용으로 새로 만들기 권장)
 * 2. 확장 프로그램 → Apps Script
 * 3. 이 파일 내용 전체 붙여넣기
 * 4. 배포 → 새 배포 → 웹 앱
 *    - 실행 계정: 나
 *    - 액세스 권한: 모든 사용자 (익명 포함) ← 반드시 이것
 * 5. 배포 URL을 각 활동지.html 의 ⚙(설정)에서 저장
 *    (과목 내 모든 활동지가 동일한 URL을 사용)
 *
 * [자동 동기화] 이 파일을 Claude Code가 수정하면 훅이 clasp push + 재배포를
 * 자동 실행한다 (.clasp.json / .clasp-deployment 참조, URL 불변).
 */

/* ── AI 세상 탐험 일지 — 시트 정의 (doPost·doGet 공용) ────────────────
   [시트 헤더, 폼 필드 키] 쌍. 이 배열 하나만 고치면 저장·조회가 함께 따라간다. */
var AI_WORLD_SHEET = 'AI세상탐험일지';
var AI_WORLD_FIELDS = [
  ['이름', 'studentName'],
  ['학번', 'studentId'],
  ['날짜', 'today'],
  ['A_인상깊은현장', 'aScene'],
  ['A_이유', 'aReason'],
  ['B_기술명', 'bTech'],
  ['B_분야', 'bField'],
  ['B_무엇을하나', 'bWhat'],
  ['B_출처URL', 'bUrl'],
  ['B_패턴칩판정', 'bChips'],
  ['B_판정이유', 'bWhy'],
  ['C_선택칩', 'cChip'],
  ['C_관심분야', 'cField'],
  ['C_아이디어제목', 'cTitle'],
  ['C_무엇이달라지나', 'cChange'],
  ['C_누가좋아지나', 'cWho'],
  ['D_한문장피치', 'dPitch'],
  ['D_토론입장', 'dStance'],
  ['D_토론근거', 'dReason']
];
var PW_COL = '암호해시';

/* ── 프롬프트 실험 일지 — 시트 정의 (LLM은 어떻게 다음 말을 고를까) ──── */
var PROMPT_LAB_SHEET = '프롬프트실험일지';
var PROMPT_LAB_FIELDS = [
  ['이름', 'studentName'],
  ['학번', 'studentId'],
  ['날짜', 'today'],
  ['A_과제', 'aTask'],
  ['A_무AI초안', 'aDraft'],
  ['B_1차프롬프트', 'b1Prompt'],
  ['B_1차점수', 'b1Score'],
  ['B_1차진단', 'b1Diag'],
  ['C_2차프롬프트', 'c2Prompt'],
  ['C_2차점수', 'c2Score'],
  ['C_2차고친점', 'c2Fix'],
  ['C_3차프롬프트', 'c3Prompt'],
  ['C_3차점수', 'c3Score'],
  ['C_3차고친점', 'c3Fix'],
  ['D_짝이름', 'dPartner'],
  ['D_결과차이', 'dDiff'],
  ['D_안적힌조건', 'dMissing'],
  ['E_한문장정리', 'eSummary']
];

/* ── 글의 설계도 되찾기 — 시트 정의 (LLM은 어떻게 다음 말을 고를까) ────
   위 PROMPT_LAB_*은 같은 수업의 이전 판(프롬프트 역설계)이다. 활동을
   문해력 축으로 다시 설계하면서 항목이 통째로 바뀌었으므로, 기존 시트를
   덮어쓰지 않고 새 source와 새 시트를 쓴다. */
var DESIGN_RECOVER_SHEET = '글의설계도되찾기';
var DESIGN_RECOVER_FIELDS = [
  ['이름', 'studentName'],
  ['학번', 'studentId'],
  ['날짜', 'today'],
  ['A_주제', 'aTopic'],
  ['A_받은글', 'aSource'],
  ['B1_무엇을말하는가', 'bMeaning'],
  ['B2_문단구성', 'bParas'],
  ['B3_문장과마지막', 'bShape'],
  ['B4_내가만든질문', 'bMyQ'],
  ['B4_그질문의답', 'bMyA'],
  ['C_1차프롬프트', 'c1Prompt'],
  ['C_1차결과물', 'c1Text'],
  ['C_1차점수', 'c1Score'],
  ['C_1차채점근거', 'c1Note'],
  ['D_고칠부분', 'd2Fix'],
  ['D_2차프롬프트', 'd2Prompt'],
  ['D_2차결과물', 'd2Text'],
  ['D_2차점수', 'd2Score'],
  ['D_2차채점근거', 'd2Note'],
  ['E_한문장정리', 'eSummary']
];

/* ── 나의 첫 AI 서비스 — 시트 정의 (LLM API 서비스 제작 프로젝트) ────
   설계(A~C)·기능 테스트(E)·최종 코드(F)를 모두 받는다. F_최종코드는
   50,000자(셀 한도) 직전에서 활동지가 제출을 막고, 수업용 API 키는
   활동지가 [수업용키]로 치환한 뒤 보낸다. */
var FIRST_AI_SHEET = '나의첫AI서비스';
var FIRST_AI_FIELDS = [
  ['이름', 'studentName'],
  ['학번', 'studentId'],
  ['날짜', 'today'],
  ['A1_문제', 'a1Problem'],
  ['A2_한문장소개', 'a2Pitch'],
  ['A3_능력', 'a3Ability'],
  ['A3_이유', 'a3Why'],
  ['A_씨앗카드', 'aSeed'],
  ['B1_서비스이름', 'b1Name'],
  ['B2_칸1이름', 'b2Name1'],
  ['B2_칸1예시', 'b2Ex1'],
  ['B2_칸1이유', 'b2Why1'],
  ['B2_칸2이름', 'b2Name2'],
  ['B2_칸2예시', 'b2Ex2'],
  ['B2_칸2이유', 'b2Why2'],
  ['B2_칸3이름', 'b2Name3'],
  ['B2_칸3예시', 'b2Ex3'],
  ['B2_칸3이유', 'b2Why3'],
  ['B3_내용', 'b3Content'],
  ['B3_형식', 'b3Format'],
  ['B3_길이', 'b3Length'],
  ['B3_말투', 'b3Tone'],
  ['B3_금지', 'b3Ban'],
  ['B4_온도', 'b4Temp'],
  ['B4_이유', 'b4Why'],
  ['C1_시스템프롬프트', 'c1System'],
  ['C2_사용자메시지틀', 'c2Template'],
  ['E1_정상입력', 'e1In'],
  ['E1_기대', 'e1Hope'],
  ['E1_실제', 'e1Real'],
  ['E2_무관입력', 'e2In'],
  ['E2_기대', 'e2Hope'],
  ['E2_실제', 'e2Real'],
  ['E3_경계입력', 'e3In'],
  ['E3_기대', 'e3Hope'],
  ['E3_실제', 'e3Real'],
  ['E_발견한문제', 'eProblem'],
  ['E_고친위치', 'eWhere'],
  ['E_고친내용', 'eFix'],
  ['E_개선_넣은입력', 'eSameInput'],
  ['E_개선_실제답', 'eAfterOut'],
  ['E_판단근거', 'eJudge'],
  ['F_서비스소개', 'fIntro'],
  ['F_최종코드', 'fCode'],
  ['F_개발후기', 'fReview'],
  ['F_소감', 'fNote']
];

/* ── 활동지 레지스트리 ────────────────────────────────────────────
   source 문자열 하나로 저장(doPost)과 조회(doGet lookup)가 같은 시트를
   가리킨다. 새 활동지는 여기 한 줄만 추가하면 된다. */
/* ── 4컷 영상 만들기 — 시트 정의 (트랜스포머는 어떻게 영상과 음악을 만들까) ────
   미리캔버스 AI 영상(이미지→비디오)으로 4컷을 만들어 한 편으로 잇고,
   컷별 장면 설명·프롬프트와 최종 공유 링크를 받는다. */
var VIDEO_CUTS_SHEET = '트랜스포머영상4컷';
var VIDEO_CUTS_FIELDS = [
  ['이름', 'studentName'],
  ['학번', 'studentId'],
  ['날짜', 'today'],
  ['A_제목', 'aTitle'],
  ['A_한줄줄거리', 'aStory'],
  ['A_주인공과스타일', 'aHero'],
  ['B_컷1_장면', 'cut1Desc'],
  ['B_컷1_프롬프트', 'cut1Prompt'],
  ['B_컷2_장면', 'cut2Desc'],
  ['B_컷2_프롬프트', 'cut2Prompt'],
  ['B_컷3_장면', 'cut3Desc'],
  ['B_컷3_프롬프트', 'cut3Prompt'],
  ['B_컷4_장면', 'cut4Desc'],
  ['B_컷4_프롬프트', 'cut4Prompt'],
  ['C_최종영상링크', 'cLink'],
  ['C_공유설정확인', 'cShare'],
  ['C_이어붙인방법', 'cJoin'],
  ['D_한줄성찰', 'dReflect']
];

/* ── 치와와·머핀 분류기 만들기 — 시트 정의 (인공지능은 어떻게 배울까) ────
   Teachable Machine으로 만든 이미지 분류 모델의 공유 링크·클래스·샘플 수와,
   모델이 가장 헷갈린 시험 사진의 판정·신뢰도·이유, 학습 방법 판단을 받는다. */
var CHI_MUFFIN_SHEET = '치와와머핀분류기';
var CHI_MUFFIN_FIELDS = [
  ['이름', 'studentName'],
  ['학번', 'studentId'],
  ['날짜', 'today'],
  ['A_모델공유링크', 'aLink'],
  ['A_클래스1이름', 'aClass1'],
  ['A_클래스1샘플수', 'aCount1'],
  ['A_클래스2이름', 'aClass2'],
  ['A_클래스2샘플수', 'aCount2'],
  ['B_관찰한시험사진', 'bFile'],
  ['B_모델판정', 'bPred'],
  ['B_출력값', 'bConf'],
  ['B_선택이유', 'bReason'],
  ['B_헷갈린이유', 'bWhy'],
  ['C_학습방법', 'cMethod']
];

/* ── 이미지 분류 AI 프로젝트 — 시트 정의 (이미지 분류 AI 프로젝트) ────
   주제(A)·데이터 설계(B)·시험 결과와 분석(C)·프로그램 설계(D)·테스트(E)·
   최종 코드와 결론(F)을 받는다. B5·C2·D4 표는 활동지가 사람이 읽는 글로
   바꿔 보내고, 이어쓰기용 구조는 '복원용JSON' 한 칸에 담는다.
   B6 데이터 폴더 캡처는 Drive 폴더에 저장하고 링크만 시트에 남긴다(IMG_CLASSIFIER_IMAGES).
   새 캡처 없이 다시 제출하면 활동지가 지난 링크(b6Url1·b6Url2)를 그대로 보낸다. */
var IMG_CLASSIFIER_SHEET = '이미지분류AI프로젝트';
var IMG_CLASSIFIER_FIELDS = [
  ['이름', 'studentName'],
  ['학번', 'studentId'],
  ['날짜', 'today'],
  ['A1_문제', 'a1Problem'],
  ['A2_주제', 'a2Topic'],
  ['A3_클래스', 'a3Classes'],
  ['A4_사진을구할수있나', 'a4Can'],
  ['A4_모으는방법', 'a4How'],
  ['A_씨앗카드', 'aSeed'],
  ['B1_사진구하는방법', 'b1Source'],
  ['B2_각도', 'b2Angle'],
  ['B2_조명', 'b2Light'],
  ['B2_배경', 'b2Back'],
  ['B2_종류', 'b2Kind'],
  ['B3_배경섞음', 'b3Mixed'],
  ['B3_점검', 'b3Note'],
  ['B4_그외클래스', 'b4Other'],
  ['B4_이유', 'b4Why'],
  ['B5_클래스별사진수', 'b5Counts'],
  ['B6_학습데이터캡처', 'b6Url1'],
  ['B6_시험데이터캡처', 'b6Url2'],
  ['C1_공유링크', 'c1Link'],
  ['C2_시험결과', 'c2Table'],
  ['C2_정확도', 'c2Accuracy'],
  ['C3_틀린사진', 'c3Photo'],
  ['C3_관련기준', 'c3Criteria'],
  ['C3_이유', 'c3Why'],
  ['C4_데이터개선', 'c4Plan'],
  ['D1_프로그램이름', 'd1Name'],
  ['D2_한줄소개', 'd2Intro'],
  ['D3_입력방식', 'd3Input'],
  ['D4_클래스별응답', 'd4Table'],
  ['D5_기준값', 'd5Threshold'],
  ['D5_모르겠어요문장', 'd5Unknown'],
  ['E1_시험사진', 'e1In'],
  ['E1_기대', 'e1Hope'],
  ['E1_실제', 'e1Real'],
  ['E2_상관없는사진', 'e2In'],
  ['E2_기대', 'e2Hope'],
  ['E2_실제', 'e2Real'],
  ['E_발견한문제', 'eProblem'],
  ['E_어느쪽문제', 'eWhich'],
  ['E_고친내용', 'eFix'],
  ['E_개선_넣은사진', 'eSameInput'],
  ['E_개선_실제', 'eAfterOut'],
  ['E_판단근거', 'eJudge'],
  ['F_최종코드', 'fCode'],
  ['F_배운점', 'fLearned'],
  ['F_성능개선방안', 'fImprove'],
  ['F_활용확장', 'fExtend'],
  ['F_소감', 'fNote'],
  ['복원용JSON', 'restoreJson']
];
/* 파이썬 변수와 함수 — 과제마다 코드와 마지막 실행 출력을 남긴다 (웹 실행기 assets/pyrun) */
var PY_VAR_FUNC_SHEET = '파이썬변수와함수';
var PY_VAR_FUNC_FIELDS = [
  ['이름', 'studentName'],
  ['학번', 'studentId'],
  ['날짜', 'today'],
  ['1_코드', 't1Code'],
  ['1_출력', 't1Out'],
  ['2_코드', 't2Code'],
  ['2_출력', 't2Out'],
  ['2_체크', 't2Check'],
  ['3_코드', 't3Code'],
  ['3_출력', 't3Out'],
  ['3_고친곳', 't3Fixes'],
  ['4_예측', 't4Pred'],
  ['4_출력', 't4Out'],
  ['4_설명', 't4Explain'],
  ['5_코드', 't5Code'],
  ['5_출력', 't5Out'],
  ['6_코드', 't6Code'],
  ['6_출력', 't6Out'],
  ['7_오류와고친방법', 't7Error'],
  ['7_헷갈린것', 't7Confusing'],
  ['자동점검', 'autoChecks']
];

var PY_INPUT_SHEET = '파이썬입력과자료형';
var PY_INPUT_FIELDS = [
  ['이름', 'studentName'],
  ['학번', 'studentId'],
  ['날짜', 'today'],
  ['저장종류', 'saveKind'],
  ['1_코드', 't1Code'],
  ['1_출력', 't1Out'],
  ['2_코드', 't2Code'],
  ['2_출력', 't2Out'],
  ['3_코드', 't3Code'],
  ['3_출력', 't3Out'],
  ['3_고친곳', 't3Fixes'],
  ['4_예측', 't4Pred'],
  ['4_출력', 't4Out'],
  ['4_설명', 't4Explain'],
  ['5_코드', 't5Code'],
  ['5_출력', 't5Out'],
  ['6_주제', 't6Topic'],
  ['6_코드', 't6Code'],
  ['6_출력', 't6Out'],
  ['6_시험입력', 't6TestInputs'],
  ['6_예상값', 't6Expect'],
  ['7_오류와고친방법', 't7Error'],
  ['7_논리오류', 't7Logic'],
  ['자동점검', 'autoChecks']
];

/* [base64 키, 링크를 넣을 폼 키, 파일 이름 꼬리표] */
var IMG_CLASSIFIER_IMAGES = [
  ['b6Image1', 'b6Url1', '학습데이터'],
  ['b6Image2', 'b6Url2', '시험데이터']
];
var IMG_CLASSIFIER_FOLDER = '2026-2 인공지능기초 이미지 분류 AI 프로젝트';


var SOURCES = {
  ai_world_explore: { sheet: AI_WORLD_SHEET, fields: AI_WORLD_FIELDS, deadline: '2026-10-01' },
  prompt_lab: { sheet: PROMPT_LAB_SHEET, fields: PROMPT_LAB_FIELDS, deadline: '2026-10-05' },
  design_recover: { sheet: DESIGN_RECOVER_SHEET, fields: DESIGN_RECOVER_FIELDS, deadline: '2026-10-05' },
  first_ai_service: { sheet: FIRST_AI_SHEET, fields: FIRST_AI_FIELDS, deadline: '2026-10-10' },
  video_four_cuts: { sheet: VIDEO_CUTS_SHEET, fields: VIDEO_CUTS_FIELDS },  // 영상 활동은 마감 없음
  chihuahua_muffin: { sheet: CHI_MUFFIN_SHEET, fields: CHI_MUFFIN_FIELDS, deadline: '2026-10-30' },
  image_classifier_project: {
    sheet: IMG_CLASSIFIER_SHEET, fields: IMG_CLASSIFIER_FIELDS, deadline: '2026-12-04',
    images: IMG_CLASSIFIER_IMAGES, folder: IMG_CLASSIFIER_FOLDER
  },
  python_var_func: { sheet: PY_VAR_FUNC_SHEET, fields: PY_VAR_FUNC_FIELDS, deadline: '2026-12-23' },
  python_input_types: { sheet: PY_INPUT_SHEET, fields: PY_INPUT_FIELDS, deadline: '2026-12-27' }
};
var DEFAULT_SOURCE = 'ai_world_explore'; // source 없이 오는 구버전 페이지 대비

/* ── 제출 마감 ──────────────────────────────────────────────────────
   SOURCES의 deadline(YYYY-MM-DD)은 그날 23:59:59(한국 시간)까지 받는다.
   기준: 활동지 생성일(git 최초 커밋) + 45일. deadline이 없으면 마감 없음.
   활동지 HTML의 DEADLINE 값과 반드시 같게 둔다 (no-cors라 화면은 서버 응답을 못 본다). */
function deadlineEnd(def) {
  if (!def || !def.deadline) return null;
  return new Date(def.deadline + 'T23:59:59+09:00');
}
function isClosed(def) {
  var end = deadlineEnd(def);
  return !!end && new Date().getTime() > end.getTime();
}

/* ── 과제 목록 — 제출 현황판(action=board)이 훑는 대상 ──────────────
   새 활동지를 만들면 여기에 한 줄 추가하면 현황판에 자동으로 나타난다. */
var ASSIGNMENTS = [
  {
    id: 'ai_world_explore',
    title: 'AI 세상 탐험 일지',
    lesson: '인공지능이 바꾸는 세상',
    sheet: AI_WORLD_SHEET,
    path: 'data/2026-2/인공지능기초/인공지능이-바꾸는-세상/활동지.html'
  },
  {
    id: 'design_recover',
    title: '글의 설계도 되찾기',
    lesson: 'LLM은 어떻게 다음 말을 고를까',
    sheet: DESIGN_RECOVER_SHEET,
    path: 'data/2026-2/인공지능기초/LLM은-어떻게-말을-고를까/활동지.html'
  },
  {
    id: 'first_ai_service',
    title: '나의 첫 AI 서비스',
    lesson: '나의 첫 AI 서비스',
    sheet: FIRST_AI_SHEET,
    path: 'data/2026-2/인공지능기초/나의-첫-AI-서비스/활동지.html'
  },
  {
    id: 'video_four_cuts',
    title: '4컷 영상 만들기',
    lesson: '트랜스포머는 어떻게 영상과 음악을 만들까',
    sheet: VIDEO_CUTS_SHEET,
    path: 'data/2026-2/인공지능기초/트랜스포머는-어떻게-영상을-만들까/활동지.html'
  },
  {
    id: 'chihuahua_muffin',
    title: '치와와·머핀 분류기 만들기',
    lesson: '인공지능은 어떻게 배울까',
    sheet: CHI_MUFFIN_SHEET,
    path: 'data/2026-2/인공지능기초/인공지능은-어떻게-배울까/활동지.html'
  },
  {
    id: 'image_classifier_project',
    title: '이미지 분류 AI 프로젝트',
    lesson: '무엇으로 가르칠까: 이미지 분류 AI 프로젝트',
    sheet: IMG_CLASSIFIER_SHEET,
    path: 'data/2026-2/인공지능기초/이미지-분류-AI-프로젝트/활동지.html'
  },
  {
    id: 'python_var_func',
    title: '파이썬 변수와 함수 연습',
    lesson: '이름으로 기억하고, 이름으로 부른다',
    sheet: PY_VAR_FUNC_SHEET,
    path: 'data/2026-2/인공지능기초/파이썬-변수와-함수/활동지.html'
  },
  {
    id: 'python_input_types',
    title: '파이썬 입력과 자료형 연습',
    lesson: '물어보고, 받아서, 계산한다',
    sheet: PY_INPUT_SHEET,
    path: 'data/2026-2/인공지능기초/파이썬-입력과-자료형/활동지.html'
  }
];

/* 선택: 같은 스프레드시트에 '명단' 탭(학번 | 이름)을 두면
   입장 시 실제 수강생인지 확인하고, 미제출자까지 보여 준다. */
var ROSTER_SHEET = '명단';
var SID_PATTERN = /^\d{5}$/;

/* 해시 솔트 — 비밀값이 아니라 무지개표 방지용. 바꾸면 기존 암호가 모두 무효가 된다. */
var PW_SALT = 'kijun-ai-basics-2026-2';

/** [시트 헤더, 폼 키] 배열 → 시트 헤더 행 */
function headersFor(fields) {
  var h = ['제출시각'];
  for (var i = 0; i < fields.length; i++) h.push(fields[i][0]);
  h.push(PW_COL);
  return h;
}

function aiWorldHeaders() {
  return headersFor(AI_WORLD_FIELDS);
}

/** 암호 → SHA-256 hex (원문은 어디에도 저장하지 않는다) */
function hashPassword(pw) {
  pw = String(pw == null ? '' : pw).trim();
  if (!pw) return '';
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, PW_SALT + '|' + pw, Utilities.Charset.UTF_8
  );
  var hex = '';
  for (var i = 0; i < bytes.length; i++) {
    hex += ('0' + (bytes[i] & 0xFF).toString(16)).slice(-2);
  }
  return hex;
}

/** 이름·반 비교용 정규화 — 공백/대소문자 차이로 못 찾는 일을 막는다 */
function normKey(s) {
  return String(s == null ? '' : s).replace(/\s+/g, '').toLowerCase();
}

/** 옛 헤더 이름을 새 이름으로 제자리 변경 (열 위치·데이터 유지) */
var HEADER_RENAMES = {
  '반/번호': '학번',
  'B_신뢰도': 'B_출력값',                 // 치와와머핀: 신뢰도 -> 모델 출력값
  'B_헷갈린시험사진': 'B_관찰한시험사진'  // 치와와머핀: 선정 기준을 둘로 나눔
};

function migrateHeaders(sheet) {
  if (sheet.getLastRow() === 0) return;
  var width = sheet.getLastColumn();
  if (!width) return;
  var row = sheet.getRange(1, 1, 1, width).getValues()[0];
  for (var i = 0; i < row.length; i++) {
    var to = HEADER_RENAMES[String(row[i])];
    if (to) sheet.getRange(1, i + 1).setValue(to);
  }
}

/** 헤더가 없거나 빠진 항목이 있으면 채운다.
    이름으로 비교하므로 활동지에 칸이 새로 생겨도 그 열이 만들어진다.
    (활동지에서 칸을 없앤 경우, 이미 만들어진 열은 지우지 않고 빈칸으로 남긴다) */
function ensureHeaders(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    var h = sheet.getRange(1, 1, 1, headers.length);
    h.setBackground('#2563EB');
    h.setFontColor('#FFFFFF');
    h.setFontWeight('bold');
    sheet.setFrozenRows(1);
    return;
  }
  var width = sheet.getLastColumn();
  var row = width ? sheet.getRange(1, 1, 1, width).getValues()[0] : [];
  var have = {};
  for (var i = 0; i < row.length; i++) {
    var name = String(row[i] || '');
    if (name) have[name] = true;
  }
  var missing = [];
  for (var j = 0; j < headers.length; j++) {
    if (!have[headers[j]]) missing.push(headers[j]);
  }
  if (!missing.length) return;
  var rng = sheet.getRange(1, width + 1, 1, missing.length);
  rng.setValues([missing]);
  rng.setBackground('#2563EB');
  rng.setFontColor('#FFFFFF');
  rng.setFontWeight('bold');
}

/** 헤더 이름을 보고 열 위치를 맞춰 한 줄 추가한다.
    자리 순서로 넣으면 활동지에서 칸이 하나만 줄어도 뒤쪽 열(암호해시)이
    통째로 밀려 조회가 깨지므로, 이름을 기준으로 넣는다. */
function appendRowByHeader(sheet, fields, data) {
  var width = sheet.getLastColumn();
  var header = width ? sheet.getRange(1, 1, 1, width).getValues()[0] : [];
  var idx = {};
  for (var c = 0; c < header.length; c++) {
    var name = String(header[c] || '');
    if (name && idx[name] === undefined) idx[name] = c;
  }

  var pairs = [['제출시각', new Date().toLocaleString('ko-KR')]];
  for (var i = 0; i < fields.length; i++) {
    pairs.push([fields[i][0], data[fields[i][1]] || '']);
  }
  pairs.push([PW_COL, hashPassword(data.password)]);

  var row = [];
  for (var k = 0; k < Math.max(width, pairs.length); k++) row.push('');
  for (var j = 0; j < pairs.length; j++) {
    var col = idx[pairs[j][0]];
    if (col === undefined) { col = row.length; row.push(''); }  // 헤더에 없으면 맨 뒤
    row[col] = pairs[j][1];
  }
  sheet.appendRow(row);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss   = SpreadsheetApp.getActiveSpreadsheet();

    if (data.source === 'live_session_archive') {
      // ── 라이브 세션 아카이브 (live-archive.js로 위임) ──
      return handleLiveSessionArchive(data, ss);
    }

    if (data.source === 'game_clear') {
      // ── 게임 클리어 기록 (점등봇·심야 라면) — 활동지 대신 쓴다 ──
      return ContentService
        .createTextOutput(JSON.stringify(handleGameClear(data, ss)))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var def = SOURCES[data.source];
    if (def && isClosed(def)) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'closed', deadline: def.deadline }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    if (def) {
      // ── 등록된 활동지 — source에 해당하는 시트 탭에 한 줄 추가 ──
      // 구버전 페이지(캐시)가 보내는 classInfo도 학번으로 받아 준다
      if (!data.studentId && data.classInfo) data.studentId = data.classInfo;

      var sheet = ss.getSheetByName(def.sheet) || ss.insertSheet(def.sheet);
      migrateHeaders(sheet);
      ensureHeaders(sheet, headersFor(def.fields));

      if (def.images) saveSubmissionImages(def, data);
      appendRowByHeader(sheet, def.fields, data);
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

/* ── 게임 클리어 기록 ───────────────────────────────────────────────
   게임마다 탭 두 개를 쓴다.
   - 현황: 학생 한 명이 한 줄, 문제마다 한 칸. 문제별 최고 기록만 남고 학번순으로 정렬된다.
   - 클리어기록: 처음 통과했거나 블록을 줄였을 때만 한 줄 추가하고, 그때의 프로그램을 남긴다.
   웹 앱이 익명으로 열려 있으므로 입력을 검사하고, 수식으로 해석될 글자는 막는다. */
var GAME_CLEAR = {
  lamp: { title: '점등봇', total: 21, board: '점등봇현황', log: '점등봇클리어기록' },
  ramen: { title: '심야라면', total: 6, board: '심야라면현황', log: '심야라면클리어기록' }
};
var GAME_LOG_HEADERS = ['기록시각', '이름', '학번', '문제', '문제이름', '별', '블록수', '실행결과', '프로그램'];

function sheetText(value, maxLength) {
  var s = String(value == null ? '' : value).slice(0, maxLength);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function gameBoardHeaders(game) {
  var h = ['최근기록시각', '이름', '학번', '통과한문제수'];
  for (var i = 1; i <= game.total; i++) h.push(i + '번');
  return h;
}

function handleGameClear(data, ss) {
  var game = Object.prototype.hasOwnProperty.call(GAME_CLEAR, data.game) ? GAME_CLEAR[data.game] : null;
  var sid = String(data.studentId || '').trim();
  var name = sheetText(String(data.studentName || '').trim(), 20);
  var stage = Number(data.stage);
  var stars = Number(data.stars);
  var blocks = Number(data.blocks);
  if (!game || !SID_PATTERN.test(sid) || !name ||
      !(stage >= 1 && stage <= game.total && stage % 1 === 0) ||
      !(stars >= 1 && stars <= 3 && stars % 1 === 0) ||
      !(blocks >= 0 && blocks <= 500 && blocks % 1 === 0)) {
    return { status: 'invalid' };
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(25000); // 한 반이 동시에 통과해도 같은 줄을 두 번 만들지 않는다
  try {
    var board = ss.getSheetByName(game.board) || ss.insertSheet(game.board);
    ensureHeaders(board, gameBoardHeaders(game));
    var values = board.getDataRange().getValues();
    var head = values[0];
    var col = {};
    for (var c = 0; c < head.length; c++) col[String(head[c])] = c;

    var rowIndex = -1;
    for (var r = 1; r < values.length; r++) {
      if (normKey(values[r][col['학번']]) === normKey(sid) && normKey(values[r][col['이름']]) === normKey(name)) {
        rowIndex = r;
        break;
      }
    }
    var isNew = rowIndex < 0;
    var row = isNew ? head.map(function () { return ''; }) : values[rowIndex];

    var stageCol = col[stage + '번'];
    var before = String(row[stageCol] || '').match(/(\d+)블록/);
    var improved = !before || blocks < Number(before[1]);
    if (improved) {
      var now = new Date().toLocaleString('ko-KR');
      row[stageCol] = new Array(stars + 1).join('★') + ' ' + blocks + '블록';
      row[col['최근기록시각']] = now;
      row[col['이름']] = name;
      row[col['학번']] = sid;
    }
    var clears = 0;
    for (var i = 1; i <= game.total; i++) if (row[col[i + '번']]) clears++;
    row[col['통과한문제수']] = clears;

    if (improved) {
      if (isNew) {
        board.appendRow(row);
        var last = board.getLastRow();
        if (last > 2) board.getRange(2, 1, last - 1, head.length).sort(col['학번'] + 1);
      } else {
        board.getRange(rowIndex + 1, 1, 1, head.length).setValues([row]);
      }
      var log = ss.getSheetByName(game.log) || ss.insertSheet(game.log);
      ensureHeaders(log, GAME_LOG_HEADERS);
      log.appendRow([
        now, name, sid, stage, sheetText(data.stageName, 60), stars, blocks,
        sheetText(data.result, 100), sheetText(data.program, 2000)
      ]);
    }
    return { status: 'ok', improved: improved, clears: clears, total: game.total };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 첨부 이미지(base64) → Drive 폴더에 저장하고 링크를 폼 키에 넣는다.
 * 새 이미지가 없으면 활동지가 보낸 지난 링크를 그대로 둔다.
 * 저장에 실패해도 제출 자체는 막지 않는다 (시트에 실패 사실을 남긴다).
 */
function saveSubmissionImages(def, data) {
  var prefix = String(data.studentId || '') + '_' + String(data.studentName || '학생').replace(/\s/g, '');
  for (var i = 0; i < def.images.length; i++) {
    var b64Key = def.images[i][0], urlKey = def.images[i][1], tag = def.images[i][2];
    var b64 = data[b64Key];
    if (!b64 || String(b64).indexOf('data:image/') !== 0) continue;
    try {
      data[urlKey] = saveImageToFolder(String(b64), prefix + '_' + tag, def.folder);
    } catch (err) {
      data[urlKey] = (data[urlKey] ? data[urlKey] + ' ' : '') + '(새 캡처 저장 실패: ' + err.message + ')';
    }
    delete data[b64Key];
  }
}

/** base64 data URL → 지정 폴더에 파일 생성, 링크가 있는 사람은 볼 수 있게 공유 */
function saveImageToFolder(base64String, prefix, folderName) {
  var match = base64String.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return '';
  var mimeType = match[1];
  var ext = mimeType.split('/')[1] === 'jpeg' ? 'jpg' : mimeType.split('/')[1];
  var blob = Utilities.newBlob(
    Utilities.base64Decode(match[2]), mimeType,
    prefix + '_' + new Date().getTime() + '.' + ext
  );
  var folders = DriveApp.getFoldersByName(folderName);
  var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

/**
 * Drive 권한 승인용 — 이 프로젝트에 DriveApp이 처음 들어갔으므로, 재배포 전에
 * 스크립트 편집기에서 이 함수를 한 번 실행해 Drive 권한을 승인해야 한다.
 * 승인하지 않고 배포하면 웹 앱 전체(모든 활동지 제출)가 권한 오류로 멈춘다.
 */
function authorizeDrive() {
  DriveApp.getRootFolder();
  return 'Drive 권한 승인 완료';
}

/**
 * 제출 확인 · 불러오기 엔드포인트
 * callback 파라미터가 있으면 JSONP(text/javascript)로 감싸 응답한다.
 */
function doGet(e) {
  var p = (e && e.parameter) || {};
  var out;
  try {
    if (p.action === 'lookup') {
      out = lookupSubmission(p);
    } else if (p.action === 'board') {
      out = submissionBoard(p);
    } else {
      out = { status: 'ok', message: '인공지능 기초(2026-2) 활동지 엔드포인트' };
    }
  } catch (err) {
    out = { status: 'error', message: err.message };
  }

  var json = JSON.stringify(out);
  if (p.callback && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(p.callback)) {
    return ContentService
      .createTextOutput(p.callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 제출 현황판 — 학번 + 이름으로 입장한 사람에게만 명단을 돌려준다.
 * 자료 내용은 여기서 주지 않는다 (본인 암호로 lookup 해야 함).
 * status: ok | denied(명단에 없음) | error
 */
function submissionBoard(p) {
  var sid = String(p.studentId || '').trim();
  var name = String(p.studentName || '').trim();
  if (!SID_PATTERN.test(sid)) return { status: 'error', message: '학번은 숫자 5자리입니다.' };
  if (!name) return { status: 'error', message: '이름이 필요합니다.' };

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var roster = readRoster(ss);

  if (roster.known) {
    var hit = false;
    for (var i = 0; i < roster.list.length; i++) {
      if (roster.list[i].sidKey === normKey(sid) && roster.list[i].nameKey === normKey(name)) { hit = true; break; }
    }
    if (!hit) {
      Utilities.sleep(400);
      return { status: 'denied' };
    }
  }

  var out = [];
  for (var a = 0; a < ASSIGNMENTS.length; a++) {
    out.push(buildAssignmentBoard(ss, ASSIGNMENTS[a], roster, sid, name));
  }
  return {
    status: 'ok',
    rosterKnown: roster.known,
    viewer: { studentId: sid, studentName: name },
    assignments: out
  };
}

/** '명단' 탭(학번 | 이름) 읽기 — 없으면 known:false */
function readRoster(ss) {
  var sh = ss.getSheetByName(ROSTER_SHEET);
  if (!sh || sh.getLastRow() < 2) return { known: false, list: [] };

  var values = sh.getDataRange().getValues();
  var head = values[0].map(function (h) { return String(h); });
  var sidCol = 0, nameCol = 1;
  for (var c = 0; c < head.length; c++) {
    if (head[c].indexOf('학번') >= 0) sidCol = c;
    else if (head[c].indexOf('이름') >= 0 || head[c].indexOf('성명') >= 0) nameCol = c;
  }

  var list = [];
  for (var r = 1; r < values.length; r++) {
    var sid = String(values[r][sidCol] == null ? '' : values[r][sidCol]).trim();
    var name = String(values[r][nameCol] == null ? '' : values[r][nameCol]).trim();
    if (!sid || !name) continue;
    list.push({ sid: sid, name: name, sidKey: normKey(sid), nameKey: normKey(name) });
  }
  list.sort(function (x, y) { return x.sid < y.sid ? -1 : x.sid > y.sid ? 1 : 0; });
  return { known: list.length > 0, list: list };
}

/**
 * 과제 1개의 제출 현황 — 인원 수와 '보는 사람 본인'의 상태만 돌려준다.
 * 다른 학생이 누구인지(이름·학번·제출 여부)는 응답에 담지 않는다.
 */
function buildAssignmentBoard(ss, meta, roster, viewerSid, viewerName) {
  var res = {
    id: meta.id, title: meta.title, lesson: meta.lesson, path: meta.path,
    submittedCount: 0, expected: roster.known ? roster.list.length : null, mine: null,
    deadline: (SOURCES[meta.id] && SOURCES[meta.id].deadline) || '',
    closed: isClosed(SOURCES[meta.id])
  };

  var sh = ss.getSheetByName(meta.sheet);
  if (!sh || sh.getLastRow() < 2) return res;

  var values = sh.getDataRange().getValues();
  var head = values[0];
  var idx = {};
  for (var c = 0; c < head.length; c++) idx[String(head[c])] = c;
  if (idx['학번'] === undefined || idx['이름'] === undefined) return res;

  /* 같은 사람이 여러 번 냈어도 1명으로 센다 */
  var seen = {};
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var sid = String(row[idx['학번']] == null ? '' : row[idx['학번']]).trim();
    var name = String(row[idx['이름']] == null ? '' : row[idx['이름']]).trim();
    if (!sid && !name) continue;

    var key = normKey(sid) + '|' + normKey(name);
    if (!seen[key]) { seen[key] = true; res.submittedCount++; }

    if (normKey(sid) === normKey(viewerSid) && normKey(name) === normKey(viewerName)) {
      res.mine = { at: String(row[idx['제출시각']] || '') }; // 마지막 제출로 덮인다
    }
  }
  return res;
}

/**
 * 학번 + 이름 + 암호가 모두 맞는 가장 최근 제출 1건을 돌려준다.
 * status: ok | notfound(학번·이름 불일치) | denied(암호 불일치) | error
 */
function lookupSubmission(p) {
  var studentId = p.studentId || p.classInfo; // 구버전 파라미터 호환
  if (!studentId || !p.studentName) return { status: 'error', message: '학번과 이름이 필요합니다.' };
  if (!p.password) return { status: 'error', message: '암호가 필요합니다.' };

  var def = SOURCES[p.source] || SOURCES[DEFAULT_SOURCE];
  if (!def) return { status: 'error', message: '알 수 없는 활동지입니다.' };

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(def.sheet);
  if (!sheet || sheet.getLastRow() < 2) return { status: 'notfound' };
  migrateHeaders(sheet);

  var values = sheet.getDataRange().getValues();
  var header = values[0];
  var idx = {};
  for (var c = 0; c < header.length; c++) idx[String(header[c])] = c;

  var wantName = normKey(p.studentName);
  var wantId = normKey(studentId);
  var wantHash = hashPassword(p.password);

  for (var r = values.length - 1; r >= 1; r--) {
    var row = values[r];
    if (normKey(row[idx['이름']]) !== wantName) continue;
    if (normKey(row[idx['학번']]) !== wantId) continue;

    var stored = String(row[idx[PW_COL]] || '');
    if (!stored || stored !== wantHash) {
      Utilities.sleep(400); // 단순 무차별 대입 속도 저하
      return { status: 'denied' };
    }

    var out = {};
    for (var i = 0; i < def.fields.length; i++) {
      var key = def.fields[i][1];
      var col = idx[def.fields[i][0]];
      var val = col === undefined ? '' : row[col];
      // 시트가 날짜 문자열을 Date로 바꿔 저장하므로 되돌릴 때 yyyy-MM-dd로 정규화
      if (val instanceof Date) val = Utilities.formatDate(val, 'Asia/Seoul', 'yyyy-MM-dd');
      out[key] = String(val == null ? '' : val);
    }
    return {
      status: 'ok',
      submittedAt: String(row[idx['제출시각']] || ''),
      rowNumber: r + 1,
      data: out
    };
  }

  Utilities.sleep(400);
  return { status: 'notfound' };
}
