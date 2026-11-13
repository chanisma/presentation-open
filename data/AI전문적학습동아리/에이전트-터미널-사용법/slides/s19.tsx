import { Scene, useSceneTime, interpolate, easeInOut } from '../../../../src/scene';
import {
  C, Head, SceneSubs, Screen, Mark, Chip, SHOT, camAt, window4,
  type Cam, type Frame, type Shot, type SlideMeta, type Sub,
} from '../kit';
import { Paper, KeyCap } from './_c';

/* 19 — walkthrough: 회의록에서 할 일만 뽑기 (실화면 B-04 요청 → 진행 → 완료, 원본 회의록 results/seed)
   메타포: 자석 분류 — 왼쪽 회의록 문단에서 «누가·무엇을·언제» 줄만 차례로 빛나고, 그 줄의 꼬리표가
   아래 담당자 칸(교사A~D)으로 끌려가 쌓인다. 파일을 만들지 않고 화면에 답한 작업. 좌표는 원본 1920×1080 px. */

const T = { ENTER: 1.2, S1: 2.6, S2: 5.0, PULL: 5.6, NOTE: 10.6 };
const DUR = 15;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '회의록에서 할 일만 뽑아 담당자별로 정리해 달라고 했습니다.' },
  { at: 5.0, text: '파일을 읽기만 하는 일이라 권한 확인 없이 화면에 표로 답했습니다.' },
  { at: T.NOTE, text: '«다음 주 월요일» 같은 날짜를 어떻게 계산했는지도 밝혀 주니, 그 부분만 확인하면 됩니다.' },
];

const F: Frame = { x: 560, y: 150, w: 1100, h: 619 };
const SHOTS: Shot[] = [
  { at: 0, src: SHOT('B-04-할일정리-요청') },
  { at: T.S1, src: SHOT('B-04-할일정리-진행') },
  { at: T.S2, src: SHOT('B-04-할일정리-완료') },
];
const CAMS: Cam[] = [
  { t: 0, cx: 900, cy: 732, z: 1.55 },
  { t: T.S1, cx: 900, cy: 732, z: 1.55 },
  { t: T.S1 + 0.5, cx: 700, cy: 420, z: 1.5 },
  { t: T.S2, cx: 700, cy: 420, z: 1.5 },
  { t: T.S2 + 0.6, cx: 740, cy: 430, z: 1.3 },
  { t: 10.2, cx: 740, cy: 430, z: 1.3 },
  { t: 10.9, cx: 740, cy: 660, z: 1.3 },
];
const R = {
  request: [14, 925, 1890, 52],
  reading: [14, 305, 300, 64],     // «● Reading 회의록.txt»
  table: [40, 75, 1015, 252],      // 교사C 표
  note: [36, 728, 1470, 90],       // 참고 — «다음 주 월요일»을 10월 19일로 계산
} as const;

/* 회의록 줄과 그 줄이 가는 담당자 칸 */
const LINES: { text: string; to: number[] }[] = [
  { text: '평가 기준표(루브릭)는 교사B가 10월 20일까지 초안', to: [1] },
  { text: '학생 안내문은 교사C가 다듬어 클래스룸에(10월 17일까지)', to: [2] },
  { text: '교사D가 정보부에 PC 수리 요청', to: [3] },
  { text: '파이썬 설치 상태 확인 — 교사A, 다음 주 월요일까지', to: [0] },
  { text: '학습지를 공유 드라이브에 올리기(전원, 10월 24일까지)', to: [0, 1, 2, 3] },
  { text: '파일 이름 규칙안 — 교사C, 다음 협의회', to: [2] },
  { text: '공개수업 지도안 — 교사B, 11월 7일까지 제출', to: [1] },
];
const WHO = ['교사A', '교사B', '교사C', '교사D'];
const BUCKET_Y = 818;
const bucketX = (i: number) => F.x + i * 280;

function Stage() {
  const t = useSceneTime();
  const cam = camAt(CAMS, t);
  const counts = [0, 0, 0, 0];
  LINES.forEach((l, i) => { if (t >= T.PULL + i * 0.7 + 0.6) l.to.forEach((b) => counts[b]++); });
  return (
    <>
      <Head chapter="⑤ 활용 · 4/6" title="회의록에서 할 일만 뽑기" />
      <Screen shots={SHOTS} cams={CAMS} frame={F} account="Claude Code · 수업 자료" />
      <Mark rect={[...R.request]} cam={cam} frame={F} k={window4(t, 0.3, 0.6, T.S1 - 0.3, T.S1)} label="요청 한 줄" labelSide="top" />
      <Mark rect={[...R.reading]} cam={cam} frame={F} k={window4(t, 3.2, 3.5, 4.6, 5.0)} label="읽기만 — 권한 확인 없음" labelSide="right" labelSize={18} />
      <Mark rect={[...R.table]} cam={cam} frame={F} k={window4(t, 5.8, 6.1, 9.9, 10.3)} label="담당자별 표" labelSide="right" labelSize={18} />
      <Mark rect={[...R.note]} cam={cam} frame={F} k={window4(t, 11.0, 11.3, DUR + 1, DUR + 2)} color={C.ok} label="날짜 계산 근거" labelSide="top" labelSize={18} />
      <KeyCap on={window4(t, T.ENTER - 0.1, T.ENTER, T.ENTER + 0.1, T.ENTER + 0.25)} style={{ left: F.x + F.w - 150, top: 30, opacity: window4(t, 0.5, 0.8, 2.3, 2.6) }}>Enter ⏎</KeyCap>
      <Chip tone="ok" style={{ position: 'absolute', left: 56, top: 700, fontSize: 19, opacity: window4(t, T.S2, T.S2 + 0.4, DUR + 1, DUR + 2) }}>이 PC에서 약 23초 · 권한 확인 0번</Chip>

      {/* 왼쪽: 회의록 원문 줄 */}
      <Paper name="회의록.txt" style={{ left: 56, top: 160, width: 470 }}>
        <div style={{ fontSize: 15, color: C.muted, marginBottom: 6 }}>2학기 정보과 교과협의회 · 10월 14일(수)</div>
        {LINES.map((l, i) => {
          const at = T.PULL + i * 0.7;
          const k = window4(t, at - 0.1, at + 0.15, at + 0.6, at + 0.9);
          const done = t >= at + 0.6;
          return (
            <div key={i} style={{ fontSize: 17, lineHeight: 1.5, padding: '5px 8px', margin: '0 -8px', borderRadius: 6,
              background: k > 0 ? `color-mix(in srgb, ${C.gold} ${Math.round(22 * k)}%, transparent)` : 'transparent',
              color: done ? C.muted : C.ink, wordBreak: 'keep-all' }}>
              {l.text}
            </div>
          );
        })}
      </Paper>

      {/* 꼬리표가 담당자 칸으로 끌려감 */}
      {LINES.map((l, i) => {
        const at = T.PULL + i * 0.7;
        if (t < at || t > at + 0.75) return null;
        const u = interpolate(t, [at, at + 0.6], [0, 1], easeInOut);
        return l.to.map((b) => {
          const x0 = 520, y0 = 262 + i * 60;
          const x1 = bucketX(b) + 120, y1 = BUCKET_Y + 10;
          return (
            <span key={`${i}-${b}`} style={{ position: 'absolute', left: x0 + (x1 - x0) * u, top: y0 + (y1 - y0) * u - Math.sin(u * Math.PI) * 60,
              width: 22, height: 22, borderRadius: '50%', background: C.gold, boxShadow: `0 0 14px ${C.gold}`, zIndex: 50, opacity: 1 - 0.3 * u }} />
          );
        });
      })}

      {/* 아래: 담당자 칸 */}
      {WHO.map((w, i) => (
        <div key={w} style={{ position: 'absolute', left: bucketX(i), top: BUCKET_Y, width: 260, height: 112, borderRadius: 16, background: C.panel,
          border: `2px solid ${counts[i] > 0 ? C.gold : C.line}`, display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px', boxShadow: '0 12px 26px -20px rgba(31,27,22,.5)' }}>
          <svg viewBox="0 0 54 54" width={54} height={54} style={{ flexShrink: 0 }}>
            <rect width={54} height={54} rx={14} fill="#f1ece2" />
            <path d="M15 14 v14 a12 12 0 0 0 24 0 v-14" fill="none" stroke={counts[i] ? C.gold : C.faint} strokeWidth={7} />
            <path d="M15 14 v6 M39 14 v6" stroke={C.ink} strokeWidth={7} />
          </svg>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.ink }}>{w}</div>
            <div style={{ fontSize: 19, color: counts[i] ? C.gold : C.faint, fontWeight: 700 }}>할 일 {counts[i]}건</div>
          </div>
        </div>
      ))}
      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S19() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
