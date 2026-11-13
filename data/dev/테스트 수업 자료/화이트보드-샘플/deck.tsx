import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import Build from '../../../../src/deck/Build';
import { Scene } from '../../../../src/scene';
import {
  Board,
  Draw,
  Write,
  Sticker,
  Caption,
  Pop,
  pict,
  line,
  rrect,
  ellipse,
  INK,
  RED,
  BLUE,
  BLUE_LINE,
  TAN,
  MINT,
  GRAY,
} from '../../../../src/whiteboard';

/* ── 화이트보드 샘플 — 「알고리즘, 문제를 푸는 순서」 ────────────────────
   whiteboard-deck-builder 스킬의 레퍼런스 덱. 종이 판 위에서 획이 하나씩
   그려지고, 쓰는 손이 그 끝을 따라가며, 생성 스티커가 스케치 리빌로 등장한다.

   좌표는 Board의 1600×900 단위. 선언 순서 = z-order, at 순서 = 그려지는 순서.
   자산: assets/sprites/화이트보드-키트 (image-asset-builder 시트 2장에서 크롭)

   문법 확인 포인트
     1쪽 손그림 생성기(rough) + 생각 풍선 + 스티커 리빌 + 쓰는 손 추적
     2쪽 절차의 시각화 — 카드·화살표·손글씨 라벨 + 빨간 주석
     3쪽 반례 — 취소선·엑스·곡선 스우시(빨강은 주석 전용)
     4쪽 픽토그램(browser)·관계선 + Build로 정리 공개 ────────────────── */

const SPR = 'assets/sprites/화이트보드-키트';
const HAND = `${SPR}/wb-write-hand.png`;

/* 크롭 원본 비율 — 스티커 h는 w/ar로 계산해 찌그러짐을 막는다 */
const AR = {
  think: 0.362,
  cook: 0.636,
  pot: 1.012,
  card: 1.195,
  robot: 0.754,
  laptop: 1.232,
  watch: 0.853,
};

/* ── 1 — 훅: 라면 끓이기도 알고리즘이다 ── */
function HookBoard() {
  return (
    <Board handSrc={HAND}>
      <Write x={120} y={150} at={0.15} cps={9} size={86} bold>
        알고리즘이 뭐길래?
      </Write>
      <Draw d={pict.underline(118, 176, 620, 61)} at={1.4} dur={0.5} color={RED} width={7} />

      <Sticker src={`${SPR}/wb-person-think.png`} x={150} y={310} w={175} h={175 / AR.think} at={1.9} dur={0.9} />

      <Draw d={pict.thought(880, 330, 300, 175, 71)} at={3.0} dur={1.1} fill={BLUE} />
      <Sticker src={`${SPR}/wb-pot.png`} x={760} y={230} w={230} h={230 / AR.pot} at={4.2} dur={0.8} />
      <Write x={1010} y={620} at={5.0} cps={11} size={44} anchor="middle" color={BLUE_LINE}>
        라면 끓이기도… 순서잖아?
      </Write>

      <Caption at={6.0}>문제를 푸는 순서 — 그게 알고리즘</Caption>
    </Board>
  );
}

/* ── 2 — 절차: 단계가 분명해야 한다 ── */
function StepsBoard() {
  const steps = ['1. 물 550mL를 끓인다', '2. 면과 스프를 넣는다', '3. 3분 뒤 불을 끈다'];
  return (
    <Board handSrc={HAND}>
      <Write x={120} y={125} at={0.1} cps={10} size={62} bold>
        ① 단계가 분명해야 한다
      </Write>

      <Sticker src={`${SPR}/wb-recipe-card.png`} x={130} y={250} w={430} h={430 / AR.card} at={0.9} dur={0.9} />
      <Draw d={pict.arrow(590, 420, 700, 350, 83)} at={2.0} dur={0.5} color={GRAY} width={4.5} />

      {steps.map((s, i) => (
        <Write key={s} x={720} y={330 + i * 105} at={2.4 + i * 0.75} cps={13} size={46}>
          {s}
        </Write>
      ))}

      <Sticker src={`${SPR}/wb-stopwatch.png`} x={1230} y={480} w={200} h={200 / AR.watch} at={4.9} dur={0.7} />
      <Draw d={pict.circleAround(1330, 600, 150, 165, 97)} at={5.6} dur={0.7} color={RED} width={6} />
      <Write x={1330} y={800} at={6.1} cps={12} size={42} color={RED} anchor="middle" font="pen">
        "3분"처럼 애매하지 않게!
      </Write>

      <Caption at={6.9}>사람마다 다르게 읽히면 알고리즘이 아니다</Caption>
    </Board>
  );
}

/* ── 3 — 반례: 순서가 바뀌면 결과가 바뀐다 ── */
function OrderBoard() {
  return (
    <Board handSrc={HAND}>
      <Write x={120} y={125} at={0.1} cps={10} size={62} bold>
        ② 순서가 바뀌면?
      </Write>

      <Sticker src={`${SPR}/wb-person-cook.png`} x={180} y={330} w={290} h={290 / AR.cook} at={0.8} dur={0.9} />
      <Sticker src={`${SPR}/wb-pot.png`} x={640} y={400} w={260} h={260 / AR.pot} at={1.6} dur={0.8} />

      {/* 2번과 1번을 바꿔 넣은 상황 — 빨간 주석이 사건을 판정한다 */}
      <Draw d={pict.curveArrow(520, 320, 700, 380, 120, 101)} at={2.4} dur={0.7} color={RED} width={6} />
      <Write x={430} y={270} at={2.9} cps={13} size={42} color={RED} font="pen">
        면부터 넣고 물을 끓이면?
      </Write>

      <Draw d={pict.zigzag(650, 700, 250, 103)} at={4.0} dur={0.5} color={RED} width={6} />
      <Pop cx={1120} cy={430} at={4.5}>
        <path d={pict.cross(1050, 360, 140, 107).join(' ')} fill="none" stroke={RED} strokeWidth={12} strokeLinecap="round" />
      </Pop>
      <Write x={1120} y={600} at={5.0} cps={12} size={46} anchor="middle" bold>
        같은 재료, 다른 결과
      </Write>

      <Caption at={5.9}>순서 자체가 알고리즘의 내용이다</Caption>
    </Board>
  );
}

/* ── 4 — 컴퓨터의 알고리즘 (Build로 정리 공개) ── */
function ComputerBoard() {
  return (
    <>
      <Board handSrc={HAND}>
        <Write x={120} y={125} at={0.1} cps={10} size={62} bold>
          ③ 컴퓨터에게 시킬 때는
        </Write>

        <Sticker src={`${SPR}/wb-robot.png`} x={190} y={330} w={250} h={250 / AR.robot} at={0.8} dur={0.8} />
        <Draw d={pict.arrow(470, 470, 640, 470, 113)} at={1.8} dur={0.5} color={GRAY} width={5} />
        <Sticker src={`${SPR}/wb-laptop.png`} x={660} y={370} w={380} h={380 / AR.laptop} at={2.2} dur={0.8} />

        <Draw d={pict.browser(1120, 250, 380, 240, 127)} at={3.2} dur={1.0} fill={BLUE} />
        <Write x={1150} y={360} at={4.2} cps={14} size={40} font="caveat" color={BLUE_LINE}>
          if / for
        </Write>
        <Draw d={line(1150, 420, 1450, 420, 131)} at={4.9} dur={0.4} color={GRAY} width={3.5} />
        <Write x={1150} y={470} at={5.1} cps={14} size={36} color={GRAY}>
          조건 · 반복
        </Write>
      </Board>

      {/* Build — 교사가 클릭할 때 나오는 정리. t 타임라인과 직교한다 */}
      <Build at={1}>
        <div
          style={{
            position: 'absolute',
            left: '6%',
            right: '52%',
            bottom: '9%',
            background: 'rgba(255,255,255,0.92)',
            border: `3px solid ${INK}`,
            borderRadius: 18,
            padding: '18px 22px',
            color: INK,
          }}
        >
          <p style={{ margin: 0, fontSize: '1.15rem', lineHeight: 1.5, wordBreak: 'keep-all' }}>
            알고리즘 = <b>분명한 단계</b> + <b>정해진 순서</b> + <b>끝나는 조건</b>.
            사람은 눈치로 채우지만, 컴퓨터는 <b>적힌 대로만</b> 한다.
          </p>
        </div>
      </Build>
    </>
  );
}

export default function WhiteboardDemoDeck() {
  return (
    <Deck>
      <Slide full nav="훅 · 알고리즘?" notes="획이 하나씩 그려지고 손이 따라간다. 생각 풍선 안의 냄비가 곧 비유의 씨앗.">
        <Scene freezeAt={7}>
          <HookBoard />
        </Scene>
      </Slide>
      <Slide full nav="① 단계" notes="레시피 카드 → 손글씨 3단계. '3분'처럼 애매한 표현을 빨간 주석으로 지적한다.">
        <Scene freezeAt={7.6}>
          <StepsBoard />
        </Scene>
      </Slide>
      <Slide full nav="② 순서" notes="반례. 빨강은 주석·강조 전용이라는 하우스 규칙을 지킨 장.">
        <Scene freezeAt={6.6}>
          <OrderBoard />
        </Scene>
      </Slide>
      <Slide full nav="③ 컴퓨터" notes="픽토그램 browser + 관계 화살표. 정리 문장은 클릭(Build)으로 공개.">
        <Scene freezeAt={6}>
          <ComputerBoard />
        </Scene>
      </Slide>
    </Deck>
  );
}
