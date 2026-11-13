import { Scene, useSceneTime, interpolate, easeInOut } from '../../../../src/scene';
import {
  C, MONO, Head, SceneSubs, Screen, Mark, SkipChip, Chip, SHOT, camAt, window4,
  type Cam, type Frame, type Shot, type SlideMeta, type Sub,
} from '../kit';
import { Crop, Paper, KeyCap } from './_c';

/* 16 — walkthrough: 설문 결과를 요약하기 (실화면 B-02 요청 → 진행 → 완료, 결과 R-설문그래프 · 설문 결과 요약.md)
   메타포: 거름종이 — 오른쪽 위 CSV 줄들이 깔때기로 흘러 들어가 아래 «요약 문서»와 «그래프» 두 장으로 떨어진다.
   터미널은 왼쪽 틀. 좌표는 원본 1920×1080 px(2026-10-16 실화면에서 잼). */

const T = { ENTER: 1.4, S1: 3.0, S2: 8.0, FLOW: 3.4, MD: 6.2, GRAPH: 8.6, LOCAL: 11.6 };
const DUR = 15.5;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '설문 응답 파일을 문항별로 요약하고, 그래프가 필요하면 웹페이지 한 장으로 만들어 달라고 했습니다.' },
  { at: 3.4, text: '에이전트는 문항별로 집계한 뒤 요약 문서와 그래프 파일을 만들고, 그래프가 제대로 나오는지까지 확인했습니다.' },
  { at: 11.6, text: '숫자는 반드시 원본과 맞춰 보세요. 요약은 초안이고, 판단은 선생님 몫입니다.' },
];

const F: Frame = { x: 64, y: 160, w: 1100, h: 619 };
const SHOTS: Shot[] = [
  { at: 0, src: SHOT('B-02-설문요약-요청') },
  { at: T.S1, src: SHOT('B-02-설문요약-진행') },
  { at: T.S2, src: SHOT('B-02-설문요약-완료') },
];
const CAMS: Cam[] = [
  { t: 0, cx: 900, cy: 860, z: 1.55 },
  { t: T.S1, cx: 900, cy: 860, z: 1.55 },
  { t: T.S1 + 0.6, cx: 760, cy: 470, z: 1.35 },
  { t: T.S2, cx: 760, cy: 470, z: 1.35 },
  { t: T.S2 + 0.6, cx: 740, cy: 560, z: 1.3 }, // 왼쪽 끝(글 시작)을 맞춘다 — z 1.3 에서 cx < 738 이면 조여짐
  { t: 11.2, cx: 740, cy: 560, z: 1.3 },
  { t: 11.9, cx: 740, cy: 700, z: 1.3 },
];

/* 원본 px 사각형 */
const R = {
  request: [14, 925, 1890, 52],
  summary: [14, 240, 1100, 40],     // «문항별로 집계는 끝났습니다…»
  files: [40, 365, 1400, 120],      // 저장한 두 파일 설명
  local: [36, 755, 1430, 60],       // «학생별 점수가 들어 있어서 … 내 컴퓨터에만 저장»
} as const;

const CSV = [
  '학생01, 2-1, 4, 파이썬 실습',
  '학생02, 2-1, 3, 파이썬 실습',
  '학생03, 2-1, 2, 파이썬 실습',
  '학생11, 2-2, 5, 숫자 맞히기 게임',
  '학생24, 2-3, 4, 퀴즈',
];

function Stage() {
  const t = useSceneTime();
  const cam = camAt(CAMS, t);
  const fx = 1220; // 오른쪽 열 왼쪽
  return (
    <>
      <Head chapter="⑤ 활용 · 1/6" title="설문 결과를 요약하기" />
      <Screen shots={SHOTS} cams={CAMS} frame={F} account="Claude Code · 수업 자료" />
      <Mark rect={[...R.request]} cam={cam} frame={F} k={window4(t, 0.3, 0.6, T.S1 - 0.3, T.S1)} label="요청 한 줄" labelSide="top" />
      <Mark rect={[...R.summary]} cam={cam} frame={F} k={window4(t, 4.0, 4.3, 7.4, 7.8)} label="집계 → 두 파일 작성" labelSide="bottom" labelSize={18} />
      <Mark rect={[...R.files]} cam={cam} frame={F} k={window4(t, 8.8, 9.1, 10.9, 11.3)} label="저장한 파일 두 개" labelSide="bottom" labelSize={18} />
      <Mark rect={[...R.local]} cam={cam} frame={F} k={window4(t, 12.0, 12.3, DUR + 1, DUR + 2)} color={C.ok} label="개인정보 → 내 컴퓨터에만" labelSide="top" labelSize={18} />
      <KeyCap on={window4(t, T.ENTER - 0.1, T.ENTER, T.ENTER + 0.1, T.ENTER + 0.25)} style={{ left: F.x + F.w - 150, top: F.y + F.h + 18, opacity: window4(t, 0.6, 0.9, 2.6, 3.0) }}>Enter ⏎</KeyCap>
      <SkipChip sec="4분" style={{ position: 'absolute', left: F.x, top: F.y + F.h + 24, opacity: window4(t, T.S1, T.S1 + 0.3, T.S2 + 2, T.S2 + 2.4) }} />

      {/* 오른쪽 위: CSV 줄 → 깔때기 */}
      <div style={{ position: 'absolute', left: fx, top: 160, width: 640, height: 300 }}>
        <div style={{ fontFamily: MONO, fontSize: 15, color: C.muted, marginBottom: 6 }}>설문응답.csv · 30줄</div>
        {CSV.map((line, i) => {
          const s = T.FLOW + i * 0.45;
          const u = interpolate(t, [s, s + 1.1], [0, 1], easeInOut);
          return (
            <div key={i} style={{
              position: 'absolute', left: 0, top: 30 + i * 30, fontFamily: MONO, fontSize: 17, color: C.ink, whiteSpace: 'nowrap',
              background: '#fff', border: `1px solid ${C.line}`, borderRadius: 6, padding: '2px 10px',
              transform: `translate(${u * 240}px, ${u * (200 - i * 30)}px) scale(${1 - 0.7 * u})`, transformOrigin: 'left center', opacity: 1 - u * 0.9,
            }}>{line}</div>
          );
        })}
        <svg viewBox="0 0 640 300" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <path d="M210 150 L430 150 L350 250 L350 290 L290 290 L290 250 Z" fill={`color-mix(in srgb, ${C.gold} 14%, #fff)`} stroke={C.gold} strokeWidth={3} strokeLinejoin="round" />
          <text x={320} y={210} textAnchor="middle" fontSize={18} fontWeight={800} fill={C.gold}>집계</text>
        </svg>
      </div>

      {/* 오른쪽 아래: 결과 두 장 */}
      <Paper name="설문 결과 요약.md" style={{ left: fx, top: 470, width: 640, opacity: window4(t, T.MD, T.MD + 0.5, DUR + 1, DUR + 2), transform: `translateY(${(1 - interpolate(t, [T.MD, T.MD + 0.6], [0, 1], easeInOut)) * -30}px)` }}>
        <div style={{ fontSize: 18 }}><b>한 줄 요약:</b> 평균 이해도는 <b>3.6점(5점 만점)</b>이고, 가장 많이 어려워한 내용은 <b>버블 정렬에서 한 바퀴가 끝나는 시점(10명)</b>입니다.</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8, fontFamily: MONO, fontSize: 15, color: C.muted }}>
          {['점수 1 · 1명', '2 · 6명', '3 · 4명', '4 · 12명', '5 · 7명'].map((x) => <span key={x} style={{ border: `1px solid ${C.line}`, borderRadius: 6, padding: '1px 7px' }}>{x}</span>)}
        </div>
      </Paper>
      <div style={{ position: 'absolute', left: fx, top: 668, width: 640, height: 258, opacity: window4(t, T.GRAPH, T.GRAPH + 0.5, DUR + 1, DUR + 2), transform: `translateY(${(1 - interpolate(t, [T.GRAPH, T.GRAPH + 0.6], [0, 1], easeInOut)) * -30}px)` }}>
        <div style={{ position: 'absolute', left: 0, top: 0, fontSize: 17, fontWeight: 700, color: C.muted }}>설문 결과 그래프.html — 브라우저로 연 모습</div>
        <Crop src={SHOT('R-설문그래프')} region={[480, 20, 960, 600]} w={384} style={{ left: 0, top: 28, border: `1px solid ${C.line}`, boxShadow: '0 14px 30px -20px rgba(0,0,0,.45)' }} />
        <Chip tone="ok" style={{ position: 'absolute', left: 400, top: 60, whiteSpace: 'normal', width: 230, fontSize: 18, lineHeight: 1.4, opacity: window4(t, T.LOCAL, T.LOCAL + 0.4, DUR + 1, DUR + 2) }}>«학생별 점수가 있어 웹에 올리지 않고 내 컴퓨터에만 저장했습니다»</Chip>
      </div>
      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S16() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
