import { Scene, useSceneTime, interpolate, easeInOut } from '../../../../src/scene';
import { C, Head, SceneSubs, Screen, Mark, Chip, StepRail, SHOT, camAt, toPx, window4, type Cam, type Frame, type Shot, type SlideMeta, type Sub } from '../kit';
import { Keycap } from './_b';

/* 12 — walkthrough: 첫 요청 «계획부터 보여 줘» (실화면 B-01 요청 → 첫응답 → 살펴보는중 → 계획1 → 계획2 → 계획끝과질문)
   메타포: 돋보기가 파일 위를 지나가며 «살펴보고», 아무것도 바꾸지 않은 채 계획표를 내민다.
   타이핑은 캡처의 입력 줄을 왼쪽부터 드러내는 덮개로 보인다. 좌표는 원본 1920×1080 px, 2026-10-16 실화면에서 잼. */

const T = { TYPE: 0.9, ENTER: 3.7, ANSWER: 4.0, LOOK: 5.4, PLAN: 7.4, PLAN2: 9.8, ASK: 11.8 };
const DUR = 17;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '첫 작업으로 수업 자료 폴더를 단원별로 정리해 달라고 해 보겠습니다. 끝에 «계획부터 보여 줘»를 붙였습니다.' },
  { at: T.ANSWER, text: '에이전트는 먼저 폴더 안의 파일을 살펴보고, 아무것도 바꾸지 않은 채 정리 계획표를 보여 줍니다.' },
  { at: T.ASK, text: '애매한 점은 선생님에게 되묻습니다. 계획을 보고 고칠 점을 말하면 됩니다.' },
];

const F: Frame = { x: 300, y: 150, w: 1380, h: 776 };
const SHOTS: Shot[] = [
  { at: 0, src: SHOT('B-01-파일정리-요청') },
  { at: T.ANSWER, src: SHOT('B-01-파일정리-첫응답'), fade: 0.2 },
  { at: T.LOOK, src: SHOT('B-01-파일정리-살펴보는중'), fade: 0.2 },
  { at: T.PLAN, src: SHOT('B-01-파일정리-계획1') },
  { at: T.PLAN2, src: SHOT('B-01-파일정리-계획2') },
  { at: T.ASK, src: SHOT('B-01-파일정리-계획끝과질문') },
];
const CAMS: Cam[] = [
  { t: 0, cx: 960, cy: 540, z: 1 },
  { t: T.TYPE - 0.1, cx: 0, cy: 860, z: 1.45 },
  { t: T.ENTER + 0.2, cx: 0, cy: 860, z: 1.45 },
  { t: T.ANSWER + 0.5, cx: 0, cy: 330, z: 1.6 },
  { t: T.PLAN - 0.2, cx: 0, cy: 380, z: 1.6 },
  { t: T.PLAN + 0.4, cx: 0, cy: 520, z: 1.25 },
  { t: T.PLAN2 + 0.4, cx: 0, cy: 560, z: 1.25 },
  { t: T.ASK + 0.4, cx: 0, cy: 560, z: 1.3 },
];
const R = {
  input: [8, 925, 1300, 52],   // z 1.45에서 보이는 폭 안쪽
  plan: [16, 118, 1150, 404],
  ask: [26, 545, 1440, 220],
  brewed: [10, 845, 420, 34],
} as const;

/** 돋보기 — 살펴보는 동안 파일 줄 위를 지나간다 */
function Loupe({ t, cam }: { t: number; cam: Cam }) {
  const k = window4(t, T.LOOK - 0.2, T.LOOK + 0.2, T.PLAN - 0.4, T.PLAN);
  if (k <= 0) return null;
  const u = interpolate(t, [T.LOOK, T.PLAN - 0.4], [0, 1], easeInOut);
  // 두 구간: 왼쪽 → 오른쪽으로 훑고(0~0.5), 아래 줄로 돌아온다(0.5~1)
  const px = u < 0.5 ? interpolate(u, [0, 0.5], [60, 700]) : interpolate(u, [0.5, 1], [700, 260]);
  const py = u < 0.5 ? 440 : interpolate(u, [0.5, 1], [440, 500]);
  const p = toPx(px, py, cam, F);
  return (
    <div style={{ position: 'absolute', left: p.x - 70, top: p.y - 70, width: 140, height: 140, borderRadius: '50%', border: `6px solid ${C.gold}`,
      background: 'radial-gradient(circle, rgba(255,255,255,.14), rgba(255,255,255,.03) 70%)', boxShadow: '0 10px 30px rgba(0,0,0,.4)', opacity: k, zIndex: 45 }}>
      <span style={{ position: 'absolute', right: -46, bottom: -46, width: 64, height: 16, borderRadius: 8, background: C.gold, transform: 'rotate(45deg)', transformOrigin: 'left center' }} />
    </div>
  );
}

function Stage() {
  const t = useSceneTime();
  const cam = camAt(CAMS, t);
  // 타이핑 덮개: 입력 줄을 왼쪽부터 드러낸다(캡처에는 이미 다 친 글이 있다)
  const a = toPx(40, 928, cam, F);
  const b = toPx(1570, 975, cam, F);
  const reveal = interpolate(t, [T.TYPE, T.ENTER - 0.2], [0, 1]);
  const ex = toPx(1570, 960, cam, F);
  return (
    <>
      <Head chapter="④ 첫 대화 · 2/5" title="첫 요청: «계획부터 보여 줘»" />
      <StepRail t={t} steps={['요청 쓰기', '폴더 살펴보기', '계획표 받기', '되묻는 질문']} at={[0, T.ANSWER, T.PLAN, T.ASK]} x={46} y={200} w={230} />
      <Screen shots={SHOTS} cams={CAMS} frame={F} account="Claude Code · 기본 모드">
        {t < T.ENTER && (
          <div style={{ position: 'absolute', left: a.x - F.x + (b.x - a.x) * reveal, top: a.y - F.y, width: (b.x - a.x) * (1 - reveal) + 8, height: b.y - a.y, background: '#0c0c0c' }} />
        )}
      </Screen>
      <Mark rect={[...R.input]} cam={cam} frame={F} k={window4(t, T.TYPE, T.TYPE + 0.3, T.ENTER + 0.1, T.ENTER + 0.4)} label="«…바꾸기 전에 계획부터 보여 줘.»" labelSide="top" />
      {t > T.ENTER - 0.4 && t < T.ENTER + 0.8 && (
        <Keycap style={{ position: 'absolute', left: Math.min(ex.x + 20, 1600), top: ex.y - 22, zIndex: 50, background: C.gold, color: '#fff', borderColor: C.gold }}>Enter ↵</Keycap>
      )}
      <Loupe t={t} cam={cam} />
      <Mark rect={[...R.plan]} cam={cam} frame={F} k={window4(t, T.PLAN + 0.5, T.PLAN + 0.8, T.PLAN2 - 0.3, T.PLAN2)} label="정리 계획 — 지금 이름 → 바꿀 이름" labelSide="right" labelSize={19} />
      <Mark rect={[...R.ask]} cam={cam} frame={F} k={window4(t, T.ASK + 0.6, T.ASK + 0.9, DUR + 1, DUR + 2)} label="정해 주셔야 할 것" labelSide="top" />
      {/* 오른쪽 아래 증거 칩 */}
      <div style={{ position: 'absolute', left: 1700, top: 420, width: 200, display: 'flex', flexDirection: 'column', gap: 12, opacity: interpolate(t, [T.PLAN + 0.6, T.PLAN + 1.0], [0, 1]) }}>
        <Chip tone="ok" style={{ whiteSpace: 'normal', fontSize: 19 }}>바꾼 파일 0개</Chip>
        <Chip tone="muted" style={{ whiteSpace: 'normal', fontSize: 19 }}>읽기만 할 땐 묻지 않음</Chip>
        <Chip tone="gold" style={{ whiteSpace: 'normal', fontSize: 19, opacity: t > T.ASK ? 1 : 0, transition: 'opacity .3s' }}>이 PC에서 약 51초</Chip>
      </div>
      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S12() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
