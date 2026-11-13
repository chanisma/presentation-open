import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import Build from '../../../../src/deck/Build';
import { Scene, useSceneTime, interpolate, easeOut } from '../../../../src/scene';
import { Paper, WashReveal, WashText, ColorWash, InkLine, PAPER, WASH_INK } from '../../../../src/watercolor';

/* ── 수채화 샘플 — 「AI와 함께한 하루」 ──────────────────────────────────
   watercolor-deck-builder 스킬의 레퍼런스 덱. 완성된 그림을 한 번에 보여주지
   않는다 — 빈 종이에서 붓이 지나가며 색면이 차오르고, 젖은 붓 커서가 그 끝을
   따라간다. 검은 윤곽선이 없는 것이 이 문법의 정체성이다.

   자산: images/scene-01~03.png (image-asset-builder · 수채화 style guide)
   텍스트는 명조로, 그림의 여백 위에만 얹는다.

   문법 확인 포인트
     1쪽 아래로 쓸리는 wash + 붓 커서 + 번지듯 등장하는 제목
     2쪽 좌→우 wash (방향을 바꿔 리듬을 만든다) + 색면 하이라이트
     3쪽 대각 wash + 잉크 선 한 획
     4쪽 그림 없이 종이와 여백만 — 질문 하나 (Build) ──────────────────── */

const IMG = 'data/dev/테스트 수업 자료/수채화-샘플/images';

const serif: React.CSSProperties = {
  fontFamily: '"Nanum Myeongjo", serif',
  color: '#2f3a42',
  wordBreak: 'keep-all',
};

/** 그림 위 글자가 묻히지 않게 — 종이색 스크림을 아주 옅게 깔고 그 위에 쓴다 */
function Band({
  children,
  side = 'left',
  at = 0,
}: {
  children: React.ReactNode;
  side?: 'left' | 'right';
  at?: number;
}) {
  const t = useSceneTime();
  return (
    <div
      style={{
        position: 'absolute',
        [side]: '6%',
        bottom: '13%',
        width: '40%',
        padding: '22px 26px',
        // 수채화 위 하드 사각형은 이질적이다 — 가장자리가 풀린 종이 워시로
        background: `radial-gradient(120% 130% at 30% 50%, rgba(243,238,226,${interpolate(
          t,
          [at, at + 0.8],
          [0, 0.94],
          easeOut
        )}) 55%, rgba(243,238,226,0) 100%)`,
        zIndex: 6,
      }}
    >
      {children}
    </div>
  );
}

/* ── 1 — 아침: 아래로 쓸리는 wash ── */
function MorningScene() {
  return (
    <Paper>
      <WashReveal src={`${IMG}/scene-01.png`} at={0.2} dur={5.2} bands={7} dir="down" brushWidth={205} />
      <Band at={4.6}>
        <WashText at={4.6}>
          <div style={{ ...serif, fontSize: '1.05rem', letterSpacing: '0.18em', opacity: 0.75 }}>07:10</div>
          <h1 style={{ ...serif, fontSize: '2.6rem', margin: '10px 0 8px', lineHeight: 1.25, fontWeight: 700 }}>
            눈을 뜨자마자 손이 먼저 움직인다
          </h1>
          <p style={{ ...serif, fontSize: '1.05rem', margin: 0, lineHeight: 1.7, opacity: 0.85 }}>
            알람을 끄고, 밤사이 골라진 소식을 본다. 하루의 첫 선택은 누가 했을까.
          </p>
        </WashText>
      </Band>
    </Paper>
  );
}

/* ── 2 — 오후 교실: 좌→우 wash + 색면 하이라이트 ── */
function ClassroomScene() {
  return (
    <Paper>
      <WashReveal src={`${IMG}/scene-02.png`} at={0.2} dur={4.8} bands={6} dir="right" brushWidth={230} />
      <ColorWash x={62} y={44} r={16} color="#c8a45a" at={4.4} opacity={0.42} />
      <Band side="right" at={4.4}>
        <WashText at={4.4}>
          <div style={{ ...serif, fontSize: '1.05rem', letterSpacing: '0.18em', opacity: 0.75 }}>14:20</div>
          <h1 style={{ ...serif, fontSize: '2.4rem', margin: '10px 0 8px', lineHeight: 1.3, fontWeight: 700 }}>
            모르는 것을 물어볼 상대가 늘었다
          </h1>
          <p style={{ ...serif, fontSize: '1.05rem', margin: 0, lineHeight: 1.7, opacity: 0.85 }}>
            번역도, 요약도, 코드도. 빨라진 만큼 <b>내가 한 생각</b>은 어디에 남았을까.
          </p>
        </WashText>
      </Band>
    </Paper>
  );
}

/* ── 3 — 저녁: 대각 wash + 잉크 선 한 획 ── */
function EveningScene() {
  return (
    <Paper>
      <WashReveal src={`${IMG}/scene-03.png`} at={0.2} dur={5.0} bands={8} dir="diag" brushWidth={200} bleed={9} />
      <InkLine x1={8} y1={72} x2={44} y2={72} at={4.8} color={WASH_INK} width={2} />
      <Band at={4.6}>
        <WashText at={4.8}>
          <div style={{ ...serif, fontSize: '1.05rem', letterSpacing: '0.18em', opacity: 0.75 }}>22:40</div>
          <h1 style={{ ...serif, fontSize: '2.4rem', margin: '10px 0 8px', lineHeight: 1.3, fontWeight: 700 }}>
            오늘 내가 남긴 자국
          </h1>
          <p style={{ ...serif, fontSize: '1.05rem', margin: 0, lineHeight: 1.7, opacity: 0.85 }}>
            검색어, 좋아요, 스크롤한 시간. 지워지지 않는 붓 자국처럼 어딘가에 남는다.
          </p>
        </WashText>
      </Band>
    </Paper>
  );
}

/* ── 4 — 여백: 그림 없이 종이와 질문 하나 ── */
function ReflectionScene() {
  const t = useSceneTime();
  return (
    <Paper bg={PAPER}>
      <ColorWash x={30} y={38} r={22} color="#8fb0b8" at={0.3} opacity={0.5} dur={2.4} />
      <ColorWash x={70} y={62} r={18} color="#d8b27a" at={1.1} opacity={0.42} dur={2.4} />
      <InkLine x1={16} y1={30} x2={16} y2={70} at={1.8} width={2} />
      <div
        style={{
          position: 'absolute',
          left: '22%',
          right: '12%',
          top: '30%',
          zIndex: 6,
        }}
      >
        <WashText at={1.2}>
          <h1 style={{ ...serif, fontSize: '3rem', margin: 0, lineHeight: 1.35, fontWeight: 700 }}>
            편해진 것과 <span style={{ color: '#8a6b4f' }}>잃은 것</span>을
            <br />
            같은 저울에 올려 보자
          </h1>
        </WashText>
        <Build at={1}>
          <p style={{ ...serif, fontSize: '1.2rem', marginTop: 26, lineHeight: 1.8, opacity: 0.9 }}>
            오늘 AI에게 맡긴 일 하나를 적고, 그 일을 직접 했다면 무엇을 배웠을지 한 줄로 적어 보자.
          </p>
        </Build>
      </div>
      {/* 종이 아래쪽에 옅게 번지는 물자국 — 여백도 비어 있지 않다 */}
      <ColorWash x={52} y={86} r={26} color="#b9c6c2" at={2.6} opacity={0.3} dur={3} />
      <div style={{ position: 'absolute', inset: 0, opacity: interpolate(t, [0, 0.6], [0, 1]) }} />
    </Paper>
  );
}

export default function WatercolorDemoDeck() {
  return (
    <Deck>
      <Slide full nav="07:10 아침" notes="붓이 위에서 아래로 쓸며 그림이 차오른다. 제목은 wash가 끝날 무렵 번지듯 등장.">
        <Scene freezeAt={6}>
          <MorningScene />
        </Scene>
      </Slide>
      <Slide full nav="14:20 교실" notes="wash 방향을 좌→우로 바꿔 리듬을 준다. 색면 하이라이트는 창가 빛에 얹었다.">
        <Scene freezeAt={5.6}>
          <ClassroomScene />
        </Scene>
      </Slide>
      <Slide full nav="22:40 저녁" notes="대각 wash. 잉크 선 한 획만 얹어 여백을 가른다.">
        <Scene freezeAt={6}>
          <EveningScene />
        </Scene>
      </Slide>
      <Slide full nav="여백 · 성찰" notes="그림 없이 종이만. 질문은 클릭(Build)으로 — 학생이 답을 적을 시간을 준다.">
        <Scene freezeAt={4}>
          <ReflectionScene />
        </Scene>
      </Slide>
    </Deck>
  );
}
