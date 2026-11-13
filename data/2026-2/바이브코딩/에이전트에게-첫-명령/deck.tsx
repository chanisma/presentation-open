import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import { Scene } from '../../../../src/scene';
import { Fit } from './shared';
import { TitleScene, StationsSlide, ChecklistScene, GlassWallScene, UsesSlide, FlipScene, MapSlide } from './slides-a';
import { StuckSlide, TollgateScene, FirstCommandSlide, ModelsSlide, VideosSlide } from './slides-b';
import { HourglassScene, OrderFormSlide, SwatchScene, PracticeSlide, MistakesSlide, HistoryScene } from './slides-c';
import { CodexInstallWalk, FirstRunWalk, ModelSwitchWalk, OpenPageWalk } from './walks';

/* ── 바이브코딩 · 에이전트에게 첫 명령 — Codex 설치와 첫 웹 페이지 (22장) ──
   plan: data/2026-2/바이브코딩/에이전트에게-첫-명령/plan.md
   1 말풍선→터미널 씬 → 2 세 정거장(build) → 3 체크리스트 씬(choice) → 4 유리벽 씬
   → 5 할 수 있는 일(build+wordcloud) → 6 뒤집힌 카드 씬 → 7 설치 지도(build)
   → 8 Codex 설치 walkthrough → 9 막히는 곳(build+루프, 진단 choice) → 10 첫 실행 walkthrough
   → 11 요금소·하이패스 씬 → 12 첫 명령(build) → 13 모델 네 종(build) → 14 영상(static)
   → 15 /model·/status walkthrough → 16 두 모래시계 씬(ox) → 17 주문서(build) → 18 색 견본 씬
   → 19 실습(static) → 20 열기·고치기 walkthrough → 21 실수 다섯(build) → 22 히스토리 씬(exit) */

export default function VibeCodingFirstCommandDeck() {
  return (
    <Deck>
      <Slide full nav="표지" notes="(화면 왼쪽에 채팅 말풍선이 뜨다가 마지막 하나가 검은 창으로 바뀌고, 그 아래로 파일 하나가 떨어집니다.) 지금까지 인공지능은 말로 대답해 주는 존재였죠. 오늘부터는 여러분 컴퓨터 안에서 직접 파일을 만드는 존재가 됩니다. 저 검은 창이 오늘의 주인공이에요.">
        <Fit><Scene duration={5.5}><TitleScene /></Scene></Fit>
      </Slide>
      <Slide full nav="세 정거장" notes="(노선도의 정거장 셋 중 왼쪽 둘이 켜집니다. 클릭 1) 지난 시간에 세 정거장을 예고했죠. 오늘은 앞의 둘입니다. (클릭 2: 세 번째가 점선으로 남습니다) 기획 문서는 다음 시간이에요. 오늘 만드는 폴더를 그때 그대로 씁니다. (클릭 3: 아래 칩 세 개) 오늘 끝나면 이 세 가지가 여러분 손에 남아야 합니다.">
        <Fit><StationsSlide /></Fit>
      </Slide>
      <Slide full nav="에이전트란" notes="(왼쪽 쪽지에 요청 한 줄, 오른쪽 클립보드에 할 일이 저절로 적힙니다.) 제가 한 말은 한 줄인데 오른쪽에 할 일이 다섯 줄 생기죠. 이걸 누가 썼을까요? 에이전트가 스스로 썼습니다. (체크가 찍히다가 ④에서 빨간 줄이 생기고 ③으로 되돌아갑니다) 오류가 나면 스스로 확인하고 다시 합니다. 이게 챗봇과 다른 점이에요 — 챗봇은 이 다섯 줄을 여러분이 하죠. (씬이 끝나면) 문항 열겠습니다 — 에이전트에 가장 가까운 것을 골라 보세요. → 분포 공개 → 정답 공개 → 아래 정의 문장을 한 번 같이 읽는다.">
        <Fit><Scene duration={8.8}><ChecklistScene /></Scene></Fit>
      </Slide>
      <Slide full nav="유리벽" notes="(가운데 유리벽이 서 있고 왼쪽 채팅 창에서 나온 코드가 벽에 막힙니다.) ChatGPT 웹에서 코드를 받아 본 사람? 그 다음에 뭘 했죠? 복사해서 어딘가에 붙여넣었을 거예요. 그 벽이 이겁니다. (벽이 내려가고 터미널이 폴더 안에 나타나 파일을 만듭니다) CLI로 쓰면 에이전트가 여러분 폴더 안에서 일합니다. 파일을 만들고, 이미 있는 파일을 읽고, 실행까지 해요. 옮기는 사람이 필요 없어집니다.">
        <Fit><Scene duration={5.6}><GlassWallScene /></Scene></Fit>
      </Slide>
      <Slide full nav="할 수 있는 일" notes="(왼쪽 위에 작은 카드 다섯 장이 흩어져 뜹니다. 클릭 1.) 다운로드 폴더 정리, 사진 100장 크기 줄이기, 대본을 카드뉴스로… 여러분이 손으로 하던 일이죠. 문항 열게요 — 내 컴퓨터에서 AI가 대신 해 줬으면 하는 일 하나. → 워드클라우드 공개 → 몇 개 읽어 준다. (클릭 2: 오른쪽 아래 큰 카드) 그중 우리가 이번 학기에 쓰는 용도는 이겁니다. 웹 프로그램, 브라우저에서 열리는 프로그램을 만듭니다.">
        <Fit><UsesSlide /></Fit>
      </Slide>
      <Slide full nav="무대 뒤" notes="(왼쪽 웹 페이지 카드가 뒤집혀 코드가 보입니다.) 웹 페이지는 그림이 아니에요. 뒤집으면 전부 글자, 코드입니다. 내용은 HTML, 모양은 CSS, 동작은 JavaScript. (코드가 세 갈래로 갈라져 오른쪽 폴더로 들어갑니다) 코드는 파일에 담기고, 파일은 폴더에 놓입니다. 에이전트는 이 파일들을 만들고 고치고, 어느 파일이 무엇을 맡는지 규칙대로 정리해요. 문법을 다 외울 필요는 없지만 '파일이 폴더에 있다'는 건 알아야 오늘 실습이 됩니다.">
        <Fit><Scene duration={5}><FlipScene /></Scene></Fit>
      </Slide>
      <Slide full nav="설치 지도" notes="(왼쪽 세로 노선에 정거장 하나와 지선 둘. 클릭 1: 큰 원 Codex.) 오늘 진짜로 설치하는 건 이거 하나입니다. 여러분 사용자 폴더에 들어가고, 관리자 권한이 필요 없어요. (클릭 2: 지선의 Node.js·Git이 점선으로 남습니다) 코딩 하면 Node니 Git이니 들어 봤을 텐데, 오늘은 필요 없습니다. Codex는 그것들 없이 설치되고, 오늘 만들 페이지는 브라우저만 있으면 열려요. (클릭 3: 오른쪽 원칙 카드) 관리자 암호를 묻는 창이 뜨면 멈추고 손 들기 — 그 길이 아닙니다. 폴더 이름은 영문. 설치 뒤엔 터미널을 새로 열기.">
        <Fit><MapSlide /></Fit>
      </Slide>
      <Slide full nav="Codex 설치" notes="(시작 메뉴에서 powershell을 검색해 여는 장면부터.) 터미널 여는 법부터 볼게요. 시작 버튼, powershell 입력, 클릭. (두 번째 창에 긴 명령이 붙여넣기됩니다) 이 한 줄은 외우는 게 아닙니다. 위 상자에서 복사해서 붙여넣으세요. 이게 오늘 가장 어려운 코딩이에요. 설치기가 '지금 실행할까요' 하고 물으면 N. (세 번째 창에 버전이 찍힙니다) 창을 닫고 새로 열어서 codex --version. 숫자가 나오면 성공입니다. 안 나오면 다음 장.">
        <Fit><Scene duration={14.5}><CodexInstallWalk /></Scene></Fit>
      </Slide>
      <Slide full nav="막히는 곳" notes="문항부터 열게요 — 지금 내 화면이 어떤지 눌러 주세요. → 분포 공개. (많이 나온 카드부터 클릭. 카드 옆 작은 그림이 처방을 반복 재생합니다.) '찾을 수 없다'가 나온 사람 — 옛 창을 닫고 새 창을 여세요. 설치기가 PATH를 바꿨는데 옛 창은 그걸 모릅니다. 관리자 암호 창이 뜬 사람은 그대로 두고 손을 드세요. 제가 가서 처리합니다. 이 장은 사진 찍어 두세요.">
        <Fit><Scene><StuckSlide /></Scene></Fit>
      </Slide>
      <Slide full nav="첫 실행·로그인" notes="(왼쪽 단계 카드 넷, 오른쪽에 탐색기부터.) cd 같은 명령은 오늘 안 칩니다. 문서에 vibe 폴더를 만들고, 그 안에서 우클릭, '터미널에서 열기'. (터미널에 codex, 로그인 메뉴가 뜹니다) codex를 치면 첫 번째 'Sign in with ChatGPT'에서 Enter — 브라우저가 열립니다. ChatGPT 계정으로 로그인, 무료 계정도 됩니다. 최초 한 번입니다. (터미널로 돌아와 폴더 신뢰 확인) 'Trust and continue'에 Enter. 입력창이 뜨면 준비 완료입니다.">
        <Fit><Scene duration={14.2}><FirstRunWalk /></Scene></Fit>
      </Slide>
      <Slide full nav="codex --yolo" notes="(위 차선의 카드가 요금소마다 멈춰 y를 받고 지나갑니다.) 기본으로 켜면 에이전트가 파일을 바꿀 때마다 '해도 돼?' 하고 묻습니다. 안전하지만 실습 중엔 그 질문이 계속 뜨죠. (아래 차선은 멈추지 않고, 점선 경계가 사라집니다) --yolo를 붙이면 안 묻습니다. 그리고 작업 폴더 밖으로 못 나가게 막던 울타리도 꺼져요. 그래서 조건 — 오늘 만든 vibe 폴더 안에서만. 바탕화면에서 켜면 바탕화면 파일도 건드릴 수 있어요. 정식 이름이 '위험하게 승인과 샌드박스를 우회한다'예요. 이름이 경고입니다.">
        <Fit><Scene duration={6.6}><TollgateScene /></Scene></Fit>
      </Slide>
      <Slide full nav="첫 명령" notes="(왼쪽 터미널, 오른쪽 빈 폴더. 클릭 1: codex --yolo.) vibe 폴더에서 연 터미널에 이렇게 칩니다. (클릭 2: 첫 명령) 화면의 문장을 그대로 치세요. 파일 하나 만들어 달라는 거예요. (클릭 3: 오른쪽에 파일이 나타남) 탐색기를 보세요. 진짜 파일이 생겼죠. 웹 채팅에서는 이게 안 됩니다. (클릭 4: 두 번째 명령) 방금 만든 파일을 읽어서 새 파일을 만들라고 합니다. (클릭 5) 만들기와 읽기 — 이게 오늘 배운 차이의 전부입니다.">
        <Fit><FirstCommandSlide /></Fit>
      </Slide>
      <Slide full nav="모델 네 종" notes="(가로 게이지 위에 칩 넷. 클릭 1: 왼쪽 둘.) Luna는 가장 빠르고 가벼워요. Terra는 균형, Codex의 기본값. (클릭 2: 오른쪽 둘) Sol은 복잡한 코딩에 강하고, Astra는 9월에 나온 GPT-6, 가장 강합니다. (클릭 3: 아래 축) 성능 축과 소모 축이 같은 방향이에요. 좋은 모델일수록 사용량이 빨리 줄어요. (클릭 4: Sol에 링) 권장은 Sol에서 시작. 기본값이 Terra라서 한 번 바꿔야 하는데, 그 방법은 영상 보고 나서요.">
        <Fit><ModelsSlide /></Fit>
      </Slide>
      <Slide full nav="Astra 영상" notes="(왼쪽에 영상, 오른쪽에 카드 두 장.) 가장 강한 모델이 실제로 뭘 하는지 남의 눈으로 볼게요. 보면서 세 가지 — 어디서 차이가 나는지, 얼마나 들었는지, 나라면 어디에 쓸지. ①은 8분이라 통째로, ②는 카드 클릭으로 새 탭에서 골라 둔 구간만. 제목의 '난리', '완전히 달라졌다'는 만든 사람의 주장입니다. 우리는 근거를 보러 온 거예요. (시청 후) 사용량이 많은 사람은 Astra를 필요한 순간에만 켭니다. 이제 바꾸는 법. ⚠ 교사가 사전에 시청하고 ②의 구간을 고른다.">
        <Fit><VideosSlide /></Fit>
      </Slide>
      <Slide full nav="/model · /status" notes="(터미널에 /model이 들어가고 목록이 뜹니다.) 슬래시로 시작하는 명령은 에이전트에게 하는 말이 아니라 Codex 자체를 조작하는 명령이에요. /model 치고 ↓로 Sol에 가서 Enter. (상태 줄이 Sol로 바뀝니다) 이제부터 이 세션은 Sol이 일합니다. (/status, 오른쪽 게이지 바늘이 움직입니다) /status를 치면 남은 사용량이 나와요. 두 숫자 — 5시간짜리와 일주일짜리. 게이지 숫자는 예시입니다. 그 둘이 뭔지 다음 장.">
        <Fit><Scene duration={8.5}><ModelSwitchWalk /></Scene></Fit>
      </Slide>
      <Slide full nav="두 모래시계" notes="(모래시계 둘. 작은 것이 먼저 비어 다시 채워집니다.) 작은 모래시계가 5시간 창이에요. 다 쓰면 잠시 못 쓰고, 5시간이 지나면 다시 채워집니다. (큰 것은 계속 줄어듭니다) 큰 모래시계는 다시 안 채워져요. 일주일 한도는 따로 계속 줄어듭니다. (위 칩에서 Astra가 켜지면 모래가 빨라집니다) Astra를 켜면 둘 다 빨리 떨어져요. 평소엔 Sol, 꼭 필요할 때 Astra. OX 하나 열게요. → 분포 → 정답 X → 리셋이 언제인지는 외우지 말고 /status를 보세요.">
        <Fit><Scene duration={7.5}><HourglassScene /></Scene></Fit>
      </Slide>
      <Slide full nav="주문서" notes="(오른쪽 빈 주문서, 왼쪽에 회색으로 '자기소개 페이지 만들어줘'.) 이렇게만 시키면 에이전트도 대충 만듭니다. 주문서를 채워 볼게요. (클릭 1: 목적 칸이 채워지고 테두리가 빛납니다) 제일 중요한 칸은 목적이에요. 왜 만드는지 알면 세부는 에이전트가 알아서 맞춥니다. (클릭 2~6: 대상·기능·화면·제약·완료 기준) 기능은 세 개 이내, 순서대로. 제약은 오늘 이걸 그대로 쓰세요. 완료 기준은 '열면 무엇이 보이고 누르면 무엇이 된다'. (왼쪽 예에 취소선) 설명은 한 줄에 하나, '멋지게' 대신 눈으로 확인할 수 있는 말로.">
        <Fit><OrderFormSlide /></Fit>
      </Slide>
      <Slide full nav="색 견본" notes="(세 줄. 첫 줄은 '파란 느낌으로'만 있고 결과가 제각각입니다.) '파란 느낌'이라고만 하면 하늘색이 올 수도, 남색이 올 수도 있어요. (둘째 줄에 견본 한 장이 붙고 결과가 모입니다) 견본 하나를 붙이면 확 가까워지죠. (셋째 줄) 세 장이면 거의 일치. 이걸 zero-shot, one-shot, few-shot이라고 합니다. 예시가 몇 개냐는 뜻이에요. (하단 칩) 프로그램에서는 색 대신 '이 사이트의 카드처럼', 원하는 문장 하나, 표의 예시 한 줄을 붙이면 됩니다. 목적을 적고 예시까지 붙이면 에이전트는 '왜'와 '어떻게'를 둘 다 아는 거예요.">
        <Fit><Scene duration={5.2}><SwatchScene /></Scene></Fit>
      </Slide>
      <Slide full nav="실습" notes="(왼쪽 프롬프트, 오른쪽 조건 셋.) 왼쪽 프롬프트를 그대로 써도 되고, 칸을 자기 걸로 바꿔도 됩니다. 주제는 자유, 조건은 오른쪽 셋. 모델은 Sol인지 /status로 한 번 확인하고 시작하세요. 오류가 나면 읽지 말고 그대로 복사해서 에이전트에게 주세요 — '이 오류가 나, 고쳐 줘'. 그게 정답입니다. (막힌 학생은 9·21장 카드로 안내. 이 장은 실습 내내 띄워 둔다.)">
        <Fit><PracticeSlide /></Fit>
      </Slide>
      <Slide full nav="열기·고치기" notes="(왼쪽 브라우저, 오른쪽 터미널, 위에 잠깐 탐색기.) 완성했으면 vibe 폴더에서 index.html을 더블클릭. 브라우저가 열리면 여러분의 첫 웹 페이지예요. (터미널에 start index.html) 터미널에서 start index.html을 쳐도 되고, 에이전트한테 열어 달라고 해도 됩니다. (수정 요청 → F5 → 바뀜) 고치고 싶으면 에이전트에게 말하고, 브라우저에서 F5. 요청, 수정, 새로고침, 확인 — 이 리듬이 앞으로 우리 수업의 리듬입니다. (선택: 완성 화면을 캡처해 지난 시간 collab 노트에 댓글로 남기게 해도 된다.)">
        <Fit><Scene duration={12.5}><OpenPageWalk /></Scene></Fit>
      </Slide>
      <Slide full nav="실수 다섯" notes="(왼쪽에 카드 다섯 장이 하나씩 내려옵니다.) 방금 실습하면서 겪은 일이 아마 이 중에 있을 거예요. (클릭 1~5) 바탕화면에서 yolo — 안 됩니다. 한글 폴더 — 영문으로. 열 가지 한 번에 — 세 개씩. '다시 해 줘' 반복 — 오류를 그대로 붙여넣기. 사용량 바닥 — /status 보고 모델 내리기. 네 번째가 제일 많아요. 오류 메시지는 여러분이 읽으라고 있는 게 아니라 에이전트에게 주라고 있는 겁니다.">
        <Fit><MistakesSlide /></Fit>
      </Slide>
      <Slide full nav="마무리" notes="(터미널 화면에 오늘 친 명령들이 아래에서 위로 올라옵니다.) 오늘 여러분이 친 명령이에요. 설치 한 줄, 버전 확인, yolo, 파일 만들기, 모델 바꾸기, 첫 페이지, 열기. 일곱 줄로 오늘이 끝났습니다. (맨 아래 커서가 깜빡입니다) 다음 줄은 다음 시간이에요. 같은 폴더에서, 지난 시간에 남긴 문제 후보로 기획 문서를 씁니다. vibe 폴더 지우지 마세요. 설치는 한 번, 명령은 매일. 나가기 전에 출구티켓 한 줄만.">
        <Fit><Scene duration={6}><HistoryScene /></Scene></Fit>
      </Slide>
    </Deck>
  );
}
