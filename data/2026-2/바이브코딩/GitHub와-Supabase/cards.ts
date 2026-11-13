/* 부탁 카드 — plan.md 「프롬프트 카드」 절이 원본(SSOT). S11 복사 버튼과 S15 실습이 쓴다.
   S27 시연 부탁도 plan.md S27 「핵심 내용」의 문장 그대로. */

export type Card = { n: number; title: string; when: 'once' | 'always'; text: string };

export const CARDS: Card[] = [
  {
    n: 1,
    title: 'Git 설치',
    when: 'once',
    text: 'Git for Windows를 관리자 권한 없이 내 사용자 폴더에 설치해 줘. 관리자 암호를 묻는 창이 필요하면 설치하지 말고 멈춰서 알려 줘. 설치가 끝나면 git --version으로 확인하고, 이 창에서 git이 안 잡히면 터미널을 새로 열고 Codex를 다시 켜라고 알려 줘.',
  },
  {
    n: 2,
    title: '이름표 설정',
    when: 'once',
    text: 'git 사용자 이름은 <내 GitHub 사용자 이름>으로, 이메일은 내 GitHub noreply 주소 <noreply 주소>로 이 컴퓨터에 설정해 줘.',
  },
  {
    n: 3,
    title: '첫 커밋과 푸시',
    when: 'once',
    text: '이 폴더를 Git 저장소로 만들고 지금 파일들로 첫 커밋을 해 줘. 커밋 메시지는 한국어로 무엇을 담았는지 적어 줘. 그다음 <GitHub 저장소 주소>를 원격 저장소로 연결하고 main 브랜치로 푸시해 줘. 비밀번호나 키가 들어 있는 파일이 있으면 올리기 전에 알려 줘.',
  },
  {
    n: 4,
    title: '기능마다 커밋',
    when: 'always',
    text: '방금 만든 기능이 잘 되면 커밋하고 푸시해 줘. 커밋 메시지는 무엇을 바꿨는지 한 줄로.',
  },
  {
    n: 5,
    title: '되돌리기',
    when: 'always',
    text: '마지막 커밋 이후에 바뀐 것을 모두 버리고 마지막 커밋 상태로 되돌려 줘. 되돌리기 전에 무엇이 사라지는지 먼저 보여 줘.',
  },
];

export const GUESTBOOK_PROMPT =
  'Supabase의 guestbook-demo 프로젝트에 guestbook 표를 만들어 줘. 열은 번호, 이름, 글, 쓴 시각. RLS를 켜고, 읽기와 쓰기는 누구나, 고치기와 지우기는 아무도 못 하게 정책을 걸어 줘. index.html에 방명록을 붙이되 공개 키(publishable key, 예전 이름 anon key)만 쓰고 비밀 키(secret key, 예전 이름 service_role key)는 절대 쓰지 마. npm 설치 없이 이 HTML 파일 하나로 GitHub Pages에서 바로 돌아가도록 supabase-js는 CDN 스크립트로 불러와 줘. 다 되면 보안 점검을 하고, 커밋하고 푸시해 줘.';
