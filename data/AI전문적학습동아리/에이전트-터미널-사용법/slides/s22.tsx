import { Scene, useSceneTime, interpolate } from '../../../../src/scene';
import {
  C, MONO, Head, SceneSubs, Cursor, Screen, Mark, SHOT, camAt, window4, Chip,
  type Cam, type Frame, type Shot, type SlideMeta, type Sub,
} from '../kit';
import { NAT, boxOn, Ring, KeyCap } from './_d';

/* 22 — walkthrough: Codex로도 똑같이 (패널 A-03 → A-04, 터미널 B-06-*)
   메타포: 복선 철도 — 같은 요청 한 줄이 Claude Code / Codex 두 레일로 갈라졌다가 같은 종착역(학습지 파일)에 닿는다.
   터미널은 마우스가 아니라 키로 고르므로 포인터는 패널에서만 쓰고, 터미널 단계는 키 칩으로 보인다.
   좌표는 원본 px(패널 808×1008, 터미널 1920×1080), 2026-10-16 실화면에서 잼. */

const T = { CODEX: 1.3, OPEN: 2.4, TRUST: 3.0, SANDBOX: 6.3, REQ: 9.3, PERM: 11.8, DONE: 14.3 };
const DUR = 17.5;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '패널에서 Codex를 고르면 같은 폴더에서 Codex가 열립니다.' },
  { at: T.TRUST, text: '처음에는 폴더를 믿는지와, 작업을 가두는 샌드박스를 어떻게 둘지 한 번 고릅니다.' },
  { at: T.REQ, text: '요청과 권한 확인 방식은 Claude Code와 거의 같습니다. 학교에서 쓰는 계정에 맞는 쪽을 쓰면 됩니다.' },
];

const F: Frame = { x: 560, y: 142, w: 1320, h: 742 };
const PANEL = { x: 40, y: 150, w: 440, nat: NAT.panel };

const SHOTS: Shot[] = [
  { at: 0, src: SHOT('B-06-Codex-폴더신뢰확인') },
  { at: T.SANDBOX, src: SHOT('B-06-Codex-샌드박스설정') },
  { at: T.REQ, src: SHOT('B-06-Codex학습지-요청') },
  { at: T.PERM, src: SHOT('B-06-Codex학습지-권한확인-명령') },
  { at: T.DONE, src: SHOT('B-06-Codex학습지-완료') },
];
/* cx 0 = 화면 왼쪽 끝에 맞춤(camAt이 최소값으로 조인다) — 터미널 글은 왼쪽에서 시작한다 */
const hold = (t0: number, t1: number, cx: number, cy: number, z: number): Cam[] => [{ t: t0, cx, cy, z }, { t: t1, cx, cy, z }];
const CAMS: Cam[] = [
  ...hold(0, T.SANDBOX - 0.01, 0, 260, 1.8),
  ...hold(T.SANDBOX, T.REQ - 0.01, 0, 720, 1.7),
  ...hold(T.REQ, T.PERM - 0.01, 0, 700, 1.5),
  ...hold(T.PERM, T.DONE - 0.01, 0, 743, 1.6),
  ...hold(T.DONE, DUR, 0, 700, 1.5),
];

/* 원본 px 사각형 */
const R = {
  codexTab: [408, 186, 340, 54] as [number, number, number, number],
  open: [672, 486, 82, 48] as [number, number, number, number],
  trust: [32, 213, 230, 36] as [number, number, number, number],
  sandbox: [32, 755, 760, 34] as [number, number, number, number],
  req: [18, 745, 950, 52] as [number, number, number, number],
  perm: [32, 903, 262, 36] as [number, number, number, number],
  file: [32, 753, 482, 36] as [number, number, number, number],
};
/* 패널 위 원본 좌표 → 씬 % */
const onPanel = (r: [number, number, number, number]) => {
  const b = boxOn(PANEL, r);
  return { x: ((b.left + b.width / 2) / 1920) * 100, y: ((b.top + b.height / 2) / 1080) * 100 };
};

function Rails({ t }: { t: number }) {
  // 레일 도면(덱 px) — 왼쪽 출발역(같은 요청) → 갈림 → 두 레일 → 합류 → 종착역(학습지 파일)
  const claude = interpolate(t, [T.REQ - 0.6, T.REQ + 0.6], [0, 1]);
  const codex = interpolate(t, [T.REQ, T.DONE], [0, 1]);
  const arrive = interpolate(t, [T.DONE, T.DONE + 0.5], [0, 1]);
  return (
    <div style={{ position: 'absolute', left: 40, top: 716, width: 480, height: 222 }}>
      <svg viewBox="0 0 480 222" width={480} height={222} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <clipPath id="s22-c1"><rect x={0} y={0} width={480 * claude} height={222} /></clipPath>
          <clipPath id="s22-c2"><rect x={0} y={0} width={480 * codex} height={222} /></clipPath>
        </defs>
        {/* 바닥 침목(흐리게) */}
        <path d="M70,111 C120,111 130,46 190,46 L300,46 C360,46 370,111 410,111" fill="none" stroke="rgba(31,27,22,.12)" strokeWidth={10} />
        <path d="M70,111 C120,111 130,176 190,176 L300,176 C360,176 370,111 410,111" fill="none" stroke="rgba(31,27,22,.12)" strokeWidth={10} />
        <path d="M70,111 C120,111 130,46 190,46 L300,46 C360,46 370,111 410,111" fill="none" stroke={C.muted} strokeWidth={5} clipPath="url(#s22-c1)" />
        <path d="M70,111 C120,111 130,176 190,176 L300,176 C360,176 370,111 410,111" fill="none" stroke={C.gold} strokeWidth={5} clipPath="url(#s22-c2)" />
        <circle cx={58} cy={111} r={12} fill={C.ink} />
        <circle cx={422} cy={111} r={14} fill={arrive > 0 ? C.ok : 'rgba(31,27,22,.18)'} />
      </svg>
      <span style={{ position: 'absolute', left: 0, top: 128, fontSize: 16, fontWeight: 700, color: C.ink }}>같은 요청</span>
      <span style={{ position: 'absolute', left: 178, top: 8, fontSize: 17, fontWeight: 700, color: C.muted }}>Claude Code</span>
      <span style={{ position: 'absolute', left: 196, top: 190, fontSize: 17, fontWeight: 700, color: C.gold }}>Codex</span>
      <span style={{ position: 'absolute', right: 0, top: 136, fontSize: 16, fontWeight: 700, color: arrive > 0 ? C.ok : C.faint, textAlign: 'right', lineHeight: 1.3 }}>학습지<br />파일</span>
    </div>
  );
}

function Stage() {
  const t = useSceneTime();
  const cam = camAt(CAMS, t);
  const codexOn = t >= T.CODEX + 0.15;
  const key = t < T.TRUST ? null
    : t < T.SANDBOX ? <><KeyCap>Enter</KeyCap><span>1. Yes, continue = 이 폴더를 믿고 계속</span></>
    : t < T.REQ ? <><KeyCap>↓</KeyCap><KeyCap>Enter</KeyCap><span>2. 관리자 권한 없는 샌드박스</span></>
    : t < T.PERM ? <><KeyCap>Enter</KeyCap><span>요청 보내기</span></>
    : t < T.DONE ? <><KeyCap>Enter</KeyCap><span>1. Yes, proceed = 이번만 허락</span></>
    : <><span style={{ color: C.ok, fontWeight: 700 }}>✓</span><span>학습지 파일을 만들었습니다 (이 PC에서 약 48초)</span></>;
  return (
    <>
      <Head chapter="⑤ 활용 · 부록" title="Codex로도 똑같이" />
      {/* 패널: Claude Code → Codex 선택 */}
      <div style={{ position: 'absolute', left: PANEL.x, top: PANEL.y, width: PANEL.w, height: PANEL.w * (1008 / 808) }}>
        <img src={SHOT('A-03-패널-기본')} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', borderRadius: 20 }} />
        <img src={SHOT('A-04-패널-Codex-선택')} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', borderRadius: 20, opacity: codexOn ? 1 : 0, transition: 'none' }} />
      </div>
      <Ring box={boxOn(PANEL, R.codexTab)} k={window4(t, 0.5, 0.8, T.CODEX + 0.3, T.CODEX + 0.6)} label="Codex 고르기" side="top" size={17} />
      <Ring box={boxOn(PANEL, R.open)} k={window4(t, 1.7, 1.9, T.OPEN + 0.3, T.OPEN + 0.6)} label="열기" side="bottom" size={17} />
      <Rails t={t} />

      <Screen shots={SHOTS} cams={CAMS} frame={F} account="Codex · 이 PC 기준 화면" style={{ opacity: interpolate(t, [T.TRUST - 0.4, T.TRUST], [0.25, 1]) }} />
      <Mark rect={R.trust} cam={cam} frame={F} k={window4(t, T.TRUST + 0.4, T.TRUST + 0.7, T.SANDBOX - 0.3, T.SANDBOX)} label="폴더를 믿는지" labelSide="right" labelSize={18} />
      <Mark rect={R.sandbox} cam={cam} frame={F} k={window4(t, T.SANDBOX + 0.5, T.SANDBOX + 0.8, T.REQ - 0.3, T.REQ)} label="이 PC에서 고른 것" labelSide="right" labelSize={18} />
      <Mark rect={R.req} cam={cam} frame={F} k={window4(t, T.REQ + 0.4, T.REQ + 0.7, T.PERM - 0.3, T.PERM)} label="B-03과 같은 요청" labelSide="top" labelSize={18} />
      <Mark rect={R.perm} cam={cam} frame={F} k={window4(t, T.PERM + 0.4, T.PERM + 0.7, T.DONE - 0.3, T.DONE)} label="권한 확인 — 방식은 같다" labelSide="right" labelSize={18} />
      <Mark rect={R.file} cam={cam} frame={F} k={window4(t, T.DONE + 0.5, T.DONE + 0.8, DUR + 1, DUR + 2)} label="만든 파일" labelSide="right" labelSize={18} />

      {/* 틀 아래 키 칩 줄 */}
      {key && (
        <div style={{ position: 'absolute', left: F.x, top: F.y + F.h + 14, display: 'flex', alignItems: 'center', gap: 10, fontSize: 21, color: C.ink, zIndex: 30 }}>
          {key}
        </div>
      )}
      <Chip tone="muted" style={{ position: 'absolute', right: 40, top: F.y + F.h + 12, fontSize: 17, fontFamily: MONO }}>모델·계정 표시는 이 PC 기준</Chip>

      <Cursor path={[
        { t: 0.6, x: 20, y: 40 },
        { t: T.CODEX, ...onPanel(R.codexTab), click: true },
        { t: T.OPEN, ...onPanel(R.open), click: true },
        { t: 2.9, ...onPanel(R.open), hide: true },
      ]} />
      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S22() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
