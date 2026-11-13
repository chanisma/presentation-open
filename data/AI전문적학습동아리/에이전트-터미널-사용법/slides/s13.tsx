import { Scene, useSceneTime, interpolate, spring } from '../../../../src/scene';
import { C, MONO, Head, SceneSubs, Screen, Mark, Chip, CLIP, camAt, window4, type Cam, type Frame, type Shot, type SlideMeta, type Sub } from '../kit';
import { Keycap } from './_b';

/* 13 — walkthrough(클립): 허락하고 맡기기 (media/c13-approve.mp4 — reference/B-01-파일정리.mp4에서
   승인 입력 106.5~113초 · 권한 확인 120.5~127초 · 완료 133~137.5초를 이어 붙인 17.5초)
   메타포: 결재 후 집행 — 권한 확인에 «결재» 도장이 찍히면 파일 카드들이 오른쪽 폴더 상자 다섯 개로 옮겨 담긴다.
   시각은 클립 기준(입력 0.6~5.2 · 권한 확인 9.2~12.5 · 완료 13.0~), 좌표는 원본 1920×1080 px. */

const T = { TYPE: 0.6, SENT: 5.3, WORK: 6.5, ASK: 9.2, YES: 12.5, DONE: 13.0 };
const DUR = 19;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '계획에 답하고 «진행해 줘»라고 하면, 에이전트는 실행하기 전에 «진행할까요?»를 묻습니다.' },
  { at: T.ASK, text: '무엇을 실행하려는지 확인하고 1번 «Yes»를 고르면 작업을 시작합니다.' },
  { at: T.DONE + 0.2, text: '끝나면 무엇을 바꿨는지 보고합니다. 탐색기에서 결과를 직접 확인하는 것까지가 선생님의 일입니다.' },
];

const F: Frame = { x: 70, y: 150, w: 1320, h: 742 };
const SHOTS: Shot[] = [{ at: 0, clip: CLIP('c13-approve.mp4'), poster: CLIP('c13-approve.jpg') }];
const CAMS: Cam[] = [
  { t: 0, cx: 0, cy: 860, z: 1.45 },
  { t: T.WORK - 0.3, cx: 0, cy: 860, z: 1.45 },
  { t: T.WORK + 0.4, cx: 960, cy: 540, z: 1 },
  { t: T.ASK, cx: 960, cy: 540, z: 1 },
  { t: T.ASK + 0.5, cx: 0, cy: 880, z: 1.4 },
  { t: T.YES + 0.3, cx: 0, cy: 880, z: 1.4 },
  { t: T.DONE + 0.5, cx: 0, cy: 440, z: 1.25 },
];
const R = {
  input: [8, 925, 1280, 52],
  ask: [16, 846, 800, 160],
  report: [30, 782, 1440, 40],
} as const;

const BOXES = [
  { name: '1단원_컴퓨팅시스템', n: 3 },
  { name: '2단원_자료와정보', n: 3 },
  { name: '3단원_알고리즘', n: 6 },
  { name: '4단원_프로그래밍', n: 2 },
  { name: '기타', n: 1 },
];

function Stage() {
  const t = useSceneTime();
  const cam = camAt(CAMS, t);
  const stamp = spring(t, T.YES - 0.1, 0.5);
  let fileIdx = 0;
  return (
    <>
      <Head chapter="④ 첫 대화 · 3/5" title="허락하고 맡기기" />
      <Screen shots={SHOTS} cams={CAMS} frame={F} account="Claude Code · 기본 모드" />
      <Mark rect={[...R.input]} cam={cam} frame={F} k={window4(t, 1.0, 1.3, T.SENT, T.SENT + 0.3)} label="«…그 계획대로 진행해 줘.»" labelSide="top" />
      <Mark rect={[...R.ask]} cam={cam} frame={F} k={window4(t, T.ASK + 0.6, T.ASK + 0.9, T.YES + 0.2, T.YES + 0.5)} label="Do you want to proceed? = 진행할까요?" labelSide="top" />
      {t > T.YES - 0.5 && t < T.YES + 0.7 && (
        <Keycap style={{ position: 'absolute', left: 560, top: 760, zIndex: 50, background: C.gold, color: '#fff', borderColor: C.gold }}>1 · Enter</Keycap>
      )}
      <Mark rect={[...R.report]} cam={cam} frame={F} k={window4(t, T.DONE + 1.4, T.DONE + 1.7, DUR + 1, DUR + 2)} label="«…내용은 건드리지 않았습니다.»" labelSide="top" labelSize={18} />

      {/* 오른쪽: 결재 도장과 폴더 상자 다섯 */}
      <div style={{ position: 'absolute', left: 1430, top: 166, width: 450 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.muted }}>권한 확인 = 결재</div>
        <div style={{ position: 'relative', marginTop: 8, height: 120, borderRadius: 14, border: `1.5px dashed ${C.line}`, background: C.panel, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 14 }}>
          <span style={{ fontFamily: MONO, fontSize: 19, color: C.ink, lineHeight: 1.5 }}>Do you want to proceed?<br /><span style={{ color: C.gold }}>❯ 1. Yes</span>  2. No</span>
          {t > T.YES - 0.1 && (
            <span style={{ position: 'absolute', right: 18, top: 16, width: 92, height: 92, borderRadius: '50%', border: `5px solid ${C.warn}`, color: C.warn, display: 'grid', placeItems: 'center',
              fontSize: 26, fontWeight: 900, transform: `rotate(-14deg) scale(${1.6 - 0.6 * stamp})`, opacity: Math.min(1, stamp * 1.4) }}>결재</span>
          )}
        </div>
        <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {BOXES.map((b) => {
            const files = Array.from({ length: b.n }, () => fileIdx++);
            return (
              <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 10, background: C.panel, border: `1.5px solid ${C.line}` }}>
                <span style={{ width: 30, height: 23, borderRadius: 4, background: '#f2c14e', flexShrink: 0 }} />
                <span style={{ fontSize: 19, fontWeight: 700, color: C.ink, width: 190, whiteSpace: 'nowrap' }}>{b.name}</span>
                <span style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {files.map((k) => {
                    const at = T.DONE + 0.3 + k * 0.17;
                    const s = spring(t, at, 0.45);
                    return <span key={k} style={{ width: 20, height: 26, borderRadius: 3, background: C.violet, opacity: Math.min(1, s * 1.5), transform: `translateY(${(1 - s) * -30}px)` }} />;
                  })}
                </span>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap', opacity: interpolate(t, [T.DONE + 3.0, T.DONE + 3.4], [0, 1]) }}>
          <Chip tone="ok" style={{ fontSize: 19 }}>15개 → 폴더 5개</Chip>
          <Chip tone="gold" style={{ fontSize: 19 }}>이 PC에서 약 33초</Chip>
        </div>
      </div>
      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S13() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
