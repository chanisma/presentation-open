import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import Build from '../../../../src/deck/Build';
import { Scene, useSceneTime, interpolate, easeOut, riseIn } from '../../../../src/scene';
import {
  Collage,
  Cutout,
  useCam,
  ArrowFlow,
  DashTrail,
  CircleScan,
  PulseDot,
  RadialBurst,
  Strike,
  InkCircle,
  AnchorBox,
  Tag,
  VOX,
} from '../../../../src/vox';

/* ── 데이터 콜라주 샘플 — 「데이터는 누구의 것인가」 ─────────────────────
   vox-collage-deck-builder 스킬의 레퍼런스 덱. 프레임보다 넓은 종이 세계 위에
   오려 붙인 조각들이 놓이고, 조각은 각자 표류하며, 카메라가 그 위를 여행한다.
   관계는 모션그래픽(쐐기 흐름·점선 궤적·스캔원·펄스)이 그린다.

   자산: assets/sprites/데이터-콜라주 (image-asset-builder 시트 2장 크롭)
   좌표는 월드 px — 화면(프레임)은 1920×1080이고 월드는 그보다 넓다.

   문법 확인 포인트
     1쪽 롱 팬(월드 3200) + 조각 표류 + 쐐기 흐름 + AnchorBox
     2쪽 줌아웃 리빌 — 가까이서 시작해 전체를 드러낸다 + 스캔원·펄스
     3쪽 대각 여행 + 조각 사건(카트가 가로지른다) + 취소선
     4쪽 정지 프레임 + 잉크 원 강조 + Build 정리 ────────────────────── */

const SPR = 'assets/sprites/데이터-콜라주';
const P = {
  phone: `${SPR}/vox-person-phone.png`,
  fold: `${SPR}/vox-person-fold.png`,
  servers: `${SPR}/vox-servers.png`,
  cart: `${SPR}/vox-cart.png`,
  shield: `${SPR}/vox-shield.png`,
  pin: `${SPR}/vox-pin.png`,
  eye: `${SPR}/vox-eye.png`,
  coins: `${SPR}/vox-coins.png`,
};

/* 고정 헤드라인 — 카메라 밖(화면 고정)에 두고, 여행이 시작되면 물러난다 */
function Headline({ kicker, title, out = 3.2 }: { kicker: string; title: string; out?: number }) {
  const t = useSceneTime();
  const op = interpolate(t, [out, out + 0.6], [1, 0]);
  return (
    <div
      style={{
        position: 'absolute',
        left: '5%',
        top: '7%',
        maxWidth: '46%',
        zIndex: 40,
        opacity: op,
        pointerEvents: 'none',
      }}
    >
      <div className="kicker" style={{ color: VOX.brickDeep, ...riseIn(t, 0.1) }}>
        {kicker}
      </div>
      <h2
        className="headline"
        style={{ margin: '8px 0 0', color: VOX.ink, wordBreak: 'keep-all', ...riseIn(t, 0.35) }}
      >
        {title}
      </h2>
    </div>
  );
}

/* ── 1 — 훅: 롱 팬. 내 손에서 출발한 것이 어디로 가는가 ── */
const W1 = { w: 3200, h: 1080 };
function TrailScene() {
  const cam = useCam(
    [
      { t: 0, x: 760, y: 560, s: 1.18 },
      { t: 2.4, x: 760, y: 560, s: 1.18 },
      { t: 7.5, x: 2480, y: 560, s: 1.02 },
    ],
    W1
  );
  return (
    <>
      <Collage world={W1} cam={cam}>
        <Cutout src={P.phone} x={620} y={640} w={200} at={0.2} entry="pop" drift={{ x: 18, rot: -2, to: 8 }} depth={1} />
        <Tag x={620} y={300} at={0.9} size={40} color={VOX.ink}>
          내가 누른 것 하나하나
        </Tag>

<Cutout src={P.pin} x={1120} y={380} w={100} at={2.6} entry="tear" drift={{ y: 40, rot: 8, to: 9 }} depth={0.8} />
        <Cutout src={P.eye} x={1400} y={720} w={165} at={3.0} entry="tear" drift={{ x: 70, rot: -5, to: 9 }} depth={0.9} />
        <Cutout src={P.coins} x={1700} y={360} w={120} at={3.4} entry="tear" drift={{ y: -46, to: 9 }} depth={0.85} />
        <Cutout src={P.cart} x={1980} y={780} w={175} at={3.8} entry="tear" drift={{ x: 90, to: 9 }} depth={0.95} />
        <Cutout src={P.pin} x={2260} y={330} w={85} at={4.2} entry="tear" drift={{ y: 34, rot: -6, to: 9 }} depth={0.75} />

        <ArrowFlow from={[840, 560]} to={[2330, 600]} at={2.4} color={VOX.brick} count={7} />
        <DashTrail
          points={[
            [860, 700],
            [1400, 860],
            [1900, 760],
            [2380, 700],
          ]}
          at={3.2}
          color={VOX.navy}
        />

        <Cutout src={P.servers} x={2620} y={620} w={400} at={4.6} entry="drop" drift={{ rot: 2, to: 9 }} depth={1.05} />
        <AnchorBox x={2620} y={620} w={450} h={580} label="어딘가의 데이터센터" at={6.2} color={VOX.navy} labelSide="top" />
      </Collage>
      <Headline kicker="정보 · 정보 윤리" title="이 화면 밖에서, 내 데이터는 어디로 갈까" out={2.6} />
    </>
  );
}

/* ── 2 — 줌아웃 리빌: 무엇이 모이는가 ── */
const W2 = { w: 2600, h: 1080 };
function CollectScene() {
  const cam = useCam(
    [
      { t: 0, x: 1300, y: 560, s: 1.9 },
      { t: 1.6, x: 1300, y: 560, s: 1.9 },
      { t: 6.0, x: 1300, y: 540, s: 1.0 },
    ],
    W2
  );
  const items: { src: string; x: number; y: number; w: number; label: string; at: number }[] = [
    { src: P.pin, x: 700, y: 330, w: 130, label: '어디에 있었는지', at: 2.6 },
    { src: P.eye, x: 760, y: 760, w: 190, label: '무엇을 봤는지', at: 3.0 },
    { src: P.cart, x: 1880, y: 745, w: 210, label: '무엇을 샀는지', at: 3.4 },
    { src: P.coins, x: 1920, y: 330, w: 155, label: '얼마짜리 손님인지', at: 3.8 },
  ];
  return (
    <>
      <Collage world={W2} cam={cam}>
        <Cutout src={P.servers} x={1300} y={560} w={420} at={0.15} entry="pop" drift={{ rot: -2, scale: 0.03, to: 8 }} />
        <CircleScan x={1300} y={560} r={330} at={1.0} color={VOX.brickDeep} />

        {items.map((it) => (
          <Cutout
            key={it.label}
            src={it.src}
            x={it.x}
            y={it.y}
            w={it.w}
            at={it.at}
            entry="pop"
            drift={{ x: it.x < 1300 ? -40 : 40, y: it.y < 540 ? -30 : 30, to: 9 }}
            depth={0.9}
          />
        ))}
        {items.map((it) => (
          <PulseDot key={`p-${it.label}`} x={it.x} y={it.y + it.w * 0.62} at={it.at + 0.4} color={VOX.mustard} r={16} />
        ))}
        {items.map((it) => (
          <Tag
            key={`t-${it.label}`}
            x={it.x}
            y={it.y + it.w * 0.88}
            at={it.at + 0.5}
            size={38}
            color={VOX.paperLit}
            bg={VOX.navy}
          >
            {it.label}
          </Tag>
        ))}
      </Collage>
      <Headline kicker="모이는 것들" title="흩어진 조각이 한곳에서 다시 만난다" out={2.4} />
    </>
  );
}

/* ── 3 — 대각 여행 + 조각 사건: 무료의 대가 ── */
const W3 = { w: 2600, h: 1200 };
function PriceScene() {
  const cam = useCam(
    [
      { t: 0, x: 1120, y: 720, s: 1.3 },
      { t: 2.0, x: 1120, y: 720, s: 1.3 },
      { t: 6.5, x: 1820, y: 520, s: 1.06 },
    ],
    W3
  );
  return (
    <>
      <Collage world={W3} cam={cam} bg={VOX.paperLit}>
        <Cutout src={P.fold} x={1080} y={760} w={215} at={0.2} entry="pop" drift={{ rot: 3, to: 8 }} />
<Tag x={1080} y={400} at={1.0} size={40} bg={VOX.paper} color={VOX.ink}>
          "무료 앱이잖아요"
        </Tag>
        <Strike from={[930, 390]} to={[1235, 412]} at={2.6} color={VOX.brick} z={18} />

        <Cutout src={P.eye} x={1600} y={470} w={175} at={3.6} entry="pop" drift={{ y: -34, rot: 4, to: 9 }} depth={0.85} />
        <Tag x={1600} y={640} at={4.0} size={34} color={VOX.ink}>
          보고 있다
        </Tag>

        {/* 씬 중반의 사건 — 카트가 화면을 가로질러 동전 쪽으로 미끄러진다 */}
        <Cutout
          src={P.cart}
          x={1420}
          y={880}
          w={240}
          at={2.2}
          entry="slide"
          drift={{ x: 520, y: -150, rot: -4, from: 3.0, to: 6.2 }}
          depth={1.05}
        />
        <Cutout src={P.coins} x={2060} y={470} w={210} at={4.4} entry="drop" drift={{ y: -24, to: 9 }} />
        <InkCircle x={2060} y={470} rx={190} ry={165} at={5.2} color={VOX.brick} />
        <RadialBurst x={2060} y={470} at={5.4} color={VOX.mustard} r0={210} r1={280} n={14} />
        <Tag x={2100} y={900} at={5.8} size={42} color={VOX.ink}>
          값을 치르는 건 <b style={{ color: VOX.brick }}>내 데이터</b>
        </Tag>
      </Collage>
      <Headline kicker="무료의 대가" title="공짜처럼 보이는 것에도 값은 매겨져 있다" out={2.2} />
    </>
  );
}

/* ── 4 — 정지 프레임: 내 권리 (Build 정리) ── */
const W4 = { w: 1920, h: 1080 };
function RightsScene() {
  const cam = useCam(
    [
      { t: 0, x: 960, y: 540, s: 1.0 },
      { t: 6, x: 960, y: 520, s: 1.08 },
    ],
    W4
  );
  return (
    <>
      <Collage world={W4} cam={cam}>
        <Cutout src={P.shield} x={520} y={620} w={430} at={0.2} entry="pop" drift={{ rot: -2, scale: 0.02, to: 8 }} />
        <RadialBurst x={520} y={620} at={0.6} color={VOX.olive} r0={250} r1={310} n={16} />
        <AnchorBox x={520} y={620} w={470} h={560} label="개인정보 자기결정권" at={1.4} color={VOX.olive} />
        <Cutout src={P.fold} x={1560} y={700} w={190} at={2.2} entry="slide" drift={{ x: -30, to: 9 }} depth={0.95} />
        <ArrowFlow from={[1420, 620]} to={[820, 600]} at={2.8} color={VOX.olive} count={4} size={22} />
      </Collage>
      <Headline kicker="내 권리" title="내 데이터의 주인은 나다" out={9} />
      <Build at={1}>
        <div
          style={{
            position: 'absolute',
            right: '5%',
            bottom: '12%',
            width: '38%',
            background: VOX.paperLit,
            border: `3px solid ${VOX.ink}`,
            padding: '18px 22px',
            color: VOX.ink,
            zIndex: 45,
          }}
        >
          <p style={{ margin: 0, fontSize: '1.05rem', lineHeight: 1.55, wordBreak: 'keep-all' }}>
            ① 무엇을 수집하는지 <b>알 권리</b><br />
            ② 수집을 <b>거부할 권리</b><br />
            ③ 이미 준 것을 <b>지워 달라고 할 권리</b>
          </p>
        </div>
      </Build>
    </>
  );
}

export default function VoxDemoDeck() {
  return (
    <Deck>
      <Slide full nav="훅 · 롱 팬" notes="카메라가 왼쪽 사람에서 오른쪽 데이터센터까지 여행한다. 조각들은 경로 위 스테이션.">
        <Scene freezeAt={7.5}>
          <TrailScene />
        </Scene>
      </Slide>
      <Slide full nav="모이는 것들" notes="가까이서 시작해 줌아웃으로 전체를 드러낸다. 네 조각에 라벨을 붙여 '무엇이 모이는가'를 말한다.">
        <Scene freezeAt={6.5}>
          <CollectScene />
        </Scene>
      </Slide>
      <Slide full nav="무료의 대가" notes="카트가 화면을 가로지르는 것이 이 장의 사건. 취소선은 '무료'라는 말에 긋는다.">
        <Scene freezeAt={6.6}>
          <PriceScene />
        </Scene>
      </Slide>
      <Slide full nav="내 권리" notes="여행을 멈추고 정면으로. 세 가지 권리는 클릭(Build)으로 하나씩 이야기한다.">
        <Scene freezeAt={4}>
          <RightsScene />
        </Scene>
      </Slide>
    </Deck>
  );
}
