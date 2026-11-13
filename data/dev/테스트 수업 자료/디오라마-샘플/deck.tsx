import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import Build from '../../../../src/deck/Build';
import { Scene, useSceneTime, interpolate, easeOut, riseIn } from '../../../../src/scene';
import {
  Stage,
  Actor,
  Bubble,
  HandNote,
  LabelChip,
  Stamp,
  WavyUnderline,
  RouteDraw,
  Traveler,
  SpeedLines,
  DustPuff,
  FocusVignette,
  pulse,
  ghostIn,
  typed,
  Caret,
} from '../../../../src/diorama';

/* ── 디오라마 샘플 — 「패킷의 여행」 ─────────────────────────────────────
   diorama-deck-builder 스킬의 레퍼런스 덱. 무대(생성 배경) 위에서 배우(크롭
   스프라이트)가 연기하고 오버레이가 정보를 얹는 3층 문법을 슬라이드로 시연한다.

   설계는 같은 폴더의 plan.md. 자산은 image-asset-builder로 생성:
     images/stage-01~04.png  (1920×1080 · 배우 설 자리를 비운 무대)
     assets/sprites/디오라마-샘플/*.png (배경 투명 크롭 · 여러 덱 재사용)

   문법 확인 포인트
     1쪽 S11 오프닝 훅 — 계획(점선) vs 실제 항로 · 척추 보드
     2쪽 S10 챕터 카드 — 타자기 타이핑 제목
     3쪽 S2 고스트 입장 + S7 말풍선·손글씨
     4쪽 S1 프레이밍 컷(같은 무대 펀치인) + S8 스탬프 + S13 shake·스피드라인
     5쪽 S3 포즈 플립북 걷기 + S4 이동 + 다중 배우
     6쪽 S4 항로 위 이동(Traveler)
     7쪽 S5 클로즈업(추상 무대) + 물결 밑줄
     8쪽 S9·S12 척추 회귀 — 진행 누적 + 스탬프 3연

   무대는 정지한다. 카메라 워크 대신 슬라이드가 컷이다. ────────────────── */

const IMG = 'data/dev/테스트 수업 자료/디오라마-샘플/images';
const SPR = 'assets/sprites/디오라마-샘플';

const PACKET = {
  idle: `${SPR}/packet-idle.png`,
  // 클로즈업·펀치인 전용 큰 크롭 (원본보다 확대하면 뭉개진다 — 시트를 1×2로 다시 뽑았다)
  'idle-l': `${SPR}/packet-idle-l.png`,
  'worry-l': `${SPR}/packet-worry-l.png`,
  'walk-a': `${SPR}/packet-walk-a.png`,
  'walk-b': `${SPR}/packet-walk-b.png`,
  worry: `${SPR}/packet-worry.png`,
};
const KEEPER = `${SPR}/keeper-idle.png`;
const LETTER_STACK = `${SPR}/letter-stack.png`;
const SERVER_HOUSE = `${SPR}/server-house.png`;

/* 지도 위 좌표 (무대 %): 서울 → 상파울루 */
const HOME: [number, number] = [77, 31];
const AWAY: [number, number] = [31, 57];
const REAL_ROUTE: [number, number][] = [HOME, [70, 39], [48, 45], [24, 27], [29, 44], AWAY];

/* ── 1 — 훅: 척추 보드에서 "왜?"를 던진다 (S11) ── */
function HookScene() {
  const t = useSceneTime();
  return (
    <Stage src={`${IMG}/stage-01.png`} dim={0.12}>
      <RouteDraw points={[HOME, AWAY]} at={0.3} dur={0.7} ghost color="rgba(244,236,221,0.28)" width={2} />
      <RouteDraw points={REAL_ROUTE} at={1.1} dur={2.2} color="#f5b544" width={4} />
      <Traveler points={REAL_ROUTE} at={1.1} dur={2.2} size={4.4}>
        <img src={PACKET.idle} alt="" style={{ width: '100%', display: 'block' }} />
      </Traveler>
      <LabelChip x={HOME[0]} y={HOME[1] - 3} at={0.5} flag color="#3ec9b6">
        내 컴퓨터 · 서울
      </LabelChip>
      <LabelChip x={AWAY[0]} y={AWAY[1] - 3} at={3.1} flag color="#f5b544">
        친구 컴퓨터 · 상파울루
      </LabelChip>

      {/* 텍스트 밴드는 무대 하단(나무 테이블 면) — 지도와 zone 분리.
          하단 0~7%는 덱 크롬(진행바·미니바)이 지나가므로 비운다. */}
      <div
        style={{
          position: 'absolute',
          left: '8%',
          right: '8%',
          bottom: '9%',
          textAlign: 'center',
        }}
      >
        <div className="kicker" style={riseIn(t, 0.2)}>
          정보 · 네트워크 1차시
        </div>
        <h1
          className="headline"
          style={{
            margin: '8px auto 6px',
            maxWidth: '20ch',
            wordBreak: 'keep-all',
            ...riseIn(t, 0.45),
          }}
        >
          내 메시지는 <span className="accent-text">직선으로 가지 않는다</span>
        </h1>
        <p
          className="lead"
          style={{ marginInline: 'auto', maxWidth: '52ch', wordBreak: 'keep-all', ...riseIn(t, 0.8) }}
        >
          지도 위 두 점 사이에서 실제로 벌어지는 일 — 편지 한 통의 여행을 따라가 보자.
        </p>
      </div>
    </Stage>
  );
}

/* ── 2 — 챕터 카드: 타자기 제목 (S10) ── */
function ChapterCard({ no, title, sub }: { no: string; title: string; sub: string }) {
  const t = useSceneTime();
  const shown = typed(t, title, 0.35, 9);
  const done = shown.length === title.length;
  return (
    <Stage bg="radial-gradient(ellipse at 50% 40%, #1b2340 0%, #0a1024 72%)">
      {/* 모서리 장식 — 카드의 물성 */}
      {[
        { top: '9%', left: '7%', b: 'top left' },
        { top: '9%', right: '7%', b: 'top right' },
        { bottom: '9%', left: '7%', b: 'bottom left' },
        { bottom: '9%', right: '7%', b: 'bottom right' },
      ].map((c, i) => (
        <div
          key={i}
          aria-hidden
          style={{
            position: 'absolute',
            top: c.top,
            left: c.left,
            right: c.right,
            bottom: c.bottom,
            width: 54,
            height: 54,
            borderTop: c.b.includes('top') ? '3px solid #f5b544' : undefined,
            borderBottom: c.b.includes('bottom') ? '3px solid #f5b544' : undefined,
            borderLeft: c.b.includes('left') ? '3px solid #f5b544' : undefined,
            borderRight: c.b.includes('right') ? '3px solid #f5b544' : undefined,
            opacity: interpolate(t, [0.1, 0.5], [0, 0.85], easeOut),
          }}
        />
      ))}
      <Actor src={LETTER_STACK} x={50} ground={86} h={17} enter={{ at: 1.3, style: 'ghost' }} shadow={false} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          transform: 'translateY(-8%)',
        }}
      >
        <div className="kicker" style={{ letterSpacing: '0.3em', ...ghostIn(t, 0.1) }}>
          {no}
        </div>
        <h2 className="display" style={{ margin: 0, wordBreak: 'keep-all' }}>
          {shown}
          {!done && <Caret />}
        </h2>
        <p className="lead" style={{ marginInline: 'auto', wordBreak: 'keep-all', ...ghostIn(t, 1.6) }}>
          {sub}
        </p>
      </div>
    </Stage>
  );
}

/* ── 3 — 무대2 와이드: 배우 입장 + 말풍선 (S2·S7) ── */
function DeskScene() {
  const t = useSceneTime();
  return (
    <Stage src={`${IMG}/stage-02.png`}>
      <Actor
        poses={PACKET}
        pose="idle"
        x={62}
        ground={78}
        h={38}
        enter={{ at: 0.25, style: 'ghost' }}
        bob={{ amp: 1.1, period: 2.6 }}
      />
      <Bubble x={73} y={31} at={1.5} tail="bl" w={20}>
        나 지금 출발해!
      </Bubble>
      <LabelChip x={28} y={15} at={0.9} flag poleH={6} color="#3ec9b6">
        메시지 원본
      </LabelChip>
      <HandNote x={85} y={52} at={2.4} rotate={-6} size="2.1rem">
        한 통 → 여러 조각
      </HandNote>

      {/* 텍스트 밴드는 어두운 바닥 zone — 발광하는 모니터 위에 글자를 얹지 않는다 */}
      <div style={{ position: 'absolute', left: '5%', top: '55%', maxWidth: '36%' }}>
        <h2 className="headline" style={{ margin: 0, wordBreak: 'keep-all', ...riseIn(t, 0.15) }}>
          메시지는 <span className="accent-text">통째로</span> 가지 않는다
        </h2>
        <p className="lead" style={{ marginTop: 12, wordBreak: 'keep-all', ...riseIn(t, 0.5) }}>
          보내는 순간 여러 조각으로 잘린다. 이 조각 하나가 <b>패킷</b>이다.
        </p>
      </div>
    </Stage>
  );
}

/* ── 4 — 같은 무대 펀치인 + 스탬프 슬램 (S1·S8·S13) ──
   프레이밍 scale s로 확대하면 화면 좌표도 중심 기준으로 s배 밀린다:
   ground' = 50 + (ground-50)*s, h' = h*s. 배우를 같은 자리에 "확대해 세운다". */
const PUNCH = 1.45;
function AddressScene() {
  const t = useSceneTime();
  const SLAM = 1.5;
  return (
    <Stage src={`${IMG}/stage-02.png`} framing={{ scale: PUNCH, x: -4, y: 2 }} shake={{ at: SLAM, amp: 7 }}>
      <Actor
        poses={PACKET}
        pose="idle-l"
        x={58}
        ground={50 + (78 - 50) * PUNCH}
        h={38 * PUNCH}
        enter={{ at: 0.15, style: 'ghost' }}
        bob={{ amp: 0.8, period: 3 }}
      />
      <Stamp x={56} y={47} at={SLAM} rotate={-7} color="#c2410c">
        받는 곳 · IP 주소
      </Stamp>
      <SpeedLines x={56} y={47} at={SLAM} size={22} count={12} color="rgba(245,181,68,0.95)" />

      {/* 펀치인하면 모니터가 좌상단을 차지한다 — 텍스트는 어두운 마루 zone으로 */}
      <div style={{ position: 'absolute', left: '5%', top: '58%', maxWidth: '38%' }}>
        <h2 className="headline" style={{ margin: 0, wordBreak: 'keep-all', ...riseIn(t, 0.1) }}>
          조각마다 <span className="accent-text">주소</span>를 붙인다
        </h2>
        <Build at={1}>
          <p className="lead" style={{ marginTop: 14, wordBreak: 'keep-all' }}>
            <b>IP 주소</b> = 인터넷에서 컴퓨터를 찾아가는 번지수.
            조각은 각자 이 주소만 들고 길을 떠난다.
          </p>
        </Build>
      </div>
    </Stage>
  );
}

/* ── 5 — 관문(라우터): 걷기 플립북 + 다중 배우 (S3·S4) ── */
function RouterScene() {
  const t = useSceneTime();
  const ARRIVE = 2.6;
  return (
    <Stage src={`${IMG}/stage-03.png`}>
      <Actor
        poses={PACKET}
        acting={[{ at: ARRIVE, pose: 'idle' }]}
        flipbook={{ poses: ['walk-a', 'walk-b'], fps: 5, from: 0, to: ARRIVE }}
        x={[
          { t: 0, x: 6 },
          { t: ARRIVE, x: 30 },
        ]}
        ground={86}
        h={26}
        enter={{ at: 0.1, style: 'slide-left' }}
      />
      <DustPuff x={30} y={86} at={ARRIVE} size={7} />
      <Actor src={KEEPER} x={52} ground={88} h={30} enter={{ at: 0.9, style: 'ghost' }} flip />

      {/* 무대의 빈 팻말 위에 다음 홉 후보를 얹는다 — 정보는 이미지가 아니라 코드 */}
      <LabelChip x={74} y={20} at={3.2} color="#3ec9b6">도쿄</LabelChip>
      <LabelChip x={69} y={32} at={3.45} color="#3ec9b6">싱가포르</LabelChip>
      <LabelChip x={74} y={43} at={3.7} color="#f5b544">샌프란시스코</LabelChip>
      <LabelChip x={49} y={13} at={1.6} flag poleH={8} color="#f5b544">라우터</LabelChip>
      <Bubble x={42} y={56} at={ARRIVE + 0.5} tail="br" w={22}>
        다음 길만 알려줄게
      </Bubble>

      <div style={{ position: 'absolute', left: '5%', top: '6%', maxWidth: '38%' }}>
        <h2 className="headline" style={{ margin: 0, wordBreak: 'keep-all', ...riseIn(t, 0.15) }}>
          라우터는 <span className="accent-text">목적지를 모른다</span>
        </h2>
        <p className="lead" style={{ marginTop: 12, wordBreak: 'keep-all', ...riseIn(t, 0.55) }}>
          아는 건 “다음 한 걸음”뿐. 이 관문을 수십 번 갈아타며 조각이 나아간다.
        </p>
      </div>
    </Stage>
  );
}

/* ── 6 — 해저 케이블: 항로 위 이동 (S4) ── */
const CABLE: [number, number][] = [
  [2, 44],
  [20, 50],
  [38, 51],
  [55, 46],
  [72, 48],
  [97, 44],
];
function CableScene() {
  const t = useSceneTime();
  return (
    <Stage src={`${IMG}/stage-04.png`}>
      {/* 케이블은 무대 그림에 이미 있다 — 선을 다시 그리지 않고 그 위를 지나가게만 한다 */}
      {[0.5, 1.0, 1.5].map((start, i) => (
        <Traveler key={i} points={CABLE} at={start} dur={3.2} size={6} z={7 - i}>
          <img src={PACKET.idle} alt="" style={{ width: '100%', display: 'block' }} />
        </Traveler>
      ))}
      <SpeedLines x={95} y={44} at={4.4} size={14} count={11} color="rgba(126,242,215,0.9)" />
      <LabelChip x={26} y={40} at={1.6} flag poleH={7} color="#3ec9b6">
        해저 광케이블
      </LabelChip>
      <Actor src={SERVER_HOUSE} x={91} ground={62} h={15} enter={{ at: 0.3, style: 'ghost' }} shadow={false} />
      <HandNote x={34} y={60} at={2.6} rotate={-4} size="2.6rem" color="#7ef2d7">
        빛으로 0.07초
      </HandNote>

      <div style={{ position: 'absolute', left: '5%', top: '7%', maxWidth: '42%' }}>
        <h2 className="headline" style={{ margin: 0, wordBreak: 'keep-all', ...riseIn(t, 0.15) }}>
          인터넷의 몸은 <span className="accent-text">바다 밑</span>에 있다
        </h2>
        <p className="lead" style={{ marginTop: 12, wordBreak: 'keep-all', ...riseIn(t, 0.5) }}>
          대륙 사이 데이터의 99%는 위성이 아니라 해저 케이블로 간다.
        </p>
      </div>
    </Stage>
  );
}

/* ── 7 — 클로즈업: 추상 무대 + 물결 밑줄 (S5·S8) ── */
function ReassembleScene() {
  const t = useSceneTime();
  return (
    <Stage bg="radial-gradient(ellipse at 34% 52%, #24406b 0%, #0d1428 72%)">
      <FocusVignette at={0.2} dur={0.8} strength={0.5} />
      <Actor
        poses={PACKET}
        pose="worry-l"
        x={27}
        ground={95}
        h={62}
        enter={{ at: 0.15, style: 'pop', dur: 0.7 }}
        bob={{ amp: 0.9, period: 2.2 }}
        shadow={false}
      />
      <div style={{ position: 'absolute', left: '46%', right: '6%', top: '13%' }}>
        <h2 className="headline" style={{ margin: 0, wordBreak: 'keep-all', ...riseIn(t, 0.2) }}>
          섞여 도착한 조각을 <span className="accent-text">누가 맞추나</span>
        </h2>
      </div>

      <Bubble x={66} y={45} at={1.2} tail="bl" w={27} tone="dark">
        어? 3번 조각이 1번보다 먼저 도착했는데…
      </Bubble>

      {/* 정답은 교사의 클릭으로 — 밑줄은 그 답과 한 덩어리라 Build 안에 둔다 */}
      <div style={{ position: 'absolute', left: '46%', right: '6%', top: '62%' }}>
        <Build at={1}>
          <p className="lead" style={{ margin: 0, wordBreak: 'keep-all' }}>
            조각마다 <b>순번</b>이 적혀 있다. 받는 쪽 <b>TCP</b>가 번호대로 다시 맞추고,
            빠진 조각은 <b>다시 보내 달라</b>고 요청한다.
          </p>
          <div style={{ position: 'relative', height: 24 }}>
            <WavyUnderline x={0} y={4} w={58} at={0} dur={0.8} color="#f5b544" />
          </div>
        </Build>
      </div>
    </Stage>
  );
}

/* ── 8 — 척추 회귀: 진행 누적 + 스탬프 3연 (S9·S12) ── */
const STEPS = [
  { label: '① 쪼개기', x: 21, y: 22, at: 1.4 },
  { label: '② 길 찾기', x: 51, y: 16, at: 1.9 },
  { label: '③ 다시 맞추기', x: 80, y: 24, at: 2.4 },
];
function SpineReturn() {
  const t = useSceneTime();
  return (
    <Stage src={`${IMG}/stage-01.png`} dim={0.18}>
      <RouteDraw points={REAL_ROUTE} at={0.2} dur={1.0} color="#f5b544" width={4} />
      <Actor poses={PACKET} pose="idle" x={AWAY[0]} ground={AWAY[1] + 2} h={13} enter={{ at: 1.1, style: 'pop' }} />
      {STEPS.map((s) => (
        <Stamp
          key={s.label}
          x={s.x}
          y={s.y}
          at={s.at}
          rotate={s.x > 50 ? 5 : -5}
          scale={pulse(t, s.at + 0.25)}
          color="#c2410c"
        >
          {s.label}
        </Stamp>
      ))}
      <div
        style={{
          position: 'absolute',
          left: '8%',
          right: '8%',
          bottom: '9%',
          textAlign: 'center',
        }}
      >
        <h2 className="headline" style={{ margin: 0, marginInline: 'auto', wordBreak: 'keep-all', ...riseIn(t, 2.9) }}>
          인터넷은 <span className="accent-text">한 줄기 관</span>이 아니라 조각들의 여행이다
        </h2>
      </div>
    </Stage>
  );
}

export default function DioramaDemoDeck() {
  return (
    <Deck>
      <Slide full nav="훅 · 지도" notes="계획된 직선(점선)과 실제 경로의 대비로 '왜?'를 던진다. 척추 보드는 8쪽에서 다시 돌아온다.">
        <Scene freezeAt={4}>
          <HookScene />
        </Scene>
      </Slide>

      <Slide full nav="① 쪼개기" notes="챕터 카드 — 타자기 타이핑 제목. 정보를 넣지 않는 숨 고르기 장.">
        <Scene freezeAt={3}>
          <ChapterCard no="CHAPTER 1" title="쪼개기" sub="메시지는 조각이 되어 출발한다" />
        </Scene>
      </Slide>

      <Slide full nav="출발 · 책상" notes="배우 고스트 입장 + 말풍선. 패킷이라는 말을 여기서 처음 준다.">
        <Scene freezeAt={3.2}>
          <DeskScene />
        </Scene>
      </Slide>

      <Slide full nav="주소 · IP" notes="같은 무대 펀치인 컷. 스탬프 슬램에 무대 진동과 스피드라인을 짝지었다. 클릭 1회로 정의 공개.">
        <Scene freezeAt={2.6}>
          <AddressScene />
        </Scene>
      </Slide>

      <Slide full nav="관문 · 라우터" notes="포즈 2장 플립북으로 걷게 하고, 도착에 먼지 puff. 팻말 라벨은 이미지가 아니라 오버레이다.">
        <Scene freezeAt={4.2}>
          <RouterScene />
        </Scene>
      </Slide>

      <Slide full nav="해저 케이블" notes="항로 드로잉 + Traveler. 위성이 아니라 케이블이라는 사실이 이 장의 한 문장.">
        <Scene freezeAt={4.4}>
          <CableScene />
        </Scene>
      </Slide>

      <Slide full nav="재조립 · TCP" notes="클로즈업 무대는 생성 이미지가 아니라 코드 그라데이션. 답은 클릭으로 공개.">
        <Scene freezeAt={3}>
          <ReassembleScene />
        </Scene>
      </Slide>

      <Slide full nav="정리 · 지도 회귀" notes="척추 보드로 돌아와 여정 전체를 한 화면에. 스탬프 3연이 곧 정리다.">
        <Scene freezeAt={3.6}>
          <SpineReturn />
        </Scene>
      </Slide>
    </Deck>
  );
}
