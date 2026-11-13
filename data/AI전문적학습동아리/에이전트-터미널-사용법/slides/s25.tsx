import { Scene, useSceneTime, interpolate } from '../../../../src/scene';
import { typed } from '../../../../src/walkthrough';
import {
  C, MONO, Head, SceneSubs, Cursor, Screen, Mark, Chip, SHOT, camAt, toPx, window4,
  type Cam, type Frame, type Shot, type SlideMeta, type Sub,
} from '../kit';
import { Crop, NAT, KeyCap, Ring } from './_d';

/* 25 — walkthrough: 끝내고 이어 하기 (B-01-파일정리-완료 → B-01-파일정리-종료, 독 A-01a)
   메타포: 빈 사무실 — 터미널 창(사무실)은 불이 켜진 채 남고, 그 안의 «Claude Code»만 문을 닫고 나간다.
   «/exit» 입력은 완료 화면의 빈 입력칸 위에 겹쳐 타이핑한다(실화면 B-01-종료가 그 결과). 좌표는 원본 px, 2026-10-16 잼. */

const T = { TYPE: 1.0, ENTER: 2.3, END: 3.4, DOCK: 8.6, CLICK: 9.6 };
const DUR = 13.5;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '일이 끝나면 입력칸에 «/exit»를 쓰고 Enter를 누르세요.' },
  { at: T.END, text: '에이전트만 끝나고 창은 그 폴더에 남습니다. 창을 닫아도 됩니다.' },
  { at: T.DOCK, text: '다음 작업은 독을 다시 눌러 새 대화로 시작하면 됩니다.' },
];

const SHOTS: Shot[] = [
  { at: 0, src: SHOT('B-01-파일정리-완료') },
  { at: T.END, src: SHOT('B-01-파일정리-종료'), fade: 0.25 },
];
const CAMS: Cam[] = [
  { t: 0, cx: 0, cy: 743, z: 1.6 },
  { t: T.END - 0.01, cx: 0, cy: 743, z: 1.6 },
  { t: T.END, cx: 0, cy: 0, z: 2.1 }, // 끝난 화면은 위 세 줄뿐이라 더 당겨 빈 검은 면을 줄인다
  { t: DUR, cx: 0, cy: 0, z: 2.1 },
];
/* 화면 틀 — 오른쪽에 독 조각, 아래에 키 칩 자리를 남기려고 기본 틀보다 작게 */
const FRAME: Frame = { x: 250, y: 142, w: 1320, h: 742 };
const R = {
  input: [14, 925, 860, 56] as [number, number, number, number],
  path: [8, 182, 780, 40] as [number, number, number, number],
  resume: [8, 96, 700, 58] as [number, number, number, number],
};
/* 독 조각(교사판 독 A-01a, 3200×400)의 에이전트 아이콘 근처 */
const DOCK_REGION: [number, number, number, number] = [2280, 170, 560, 200];
const DOCK = { x: 1620, y: 380, w: 260 };
const DK = DOCK.w / DOCK_REGION[2];
const ICON = { left: DOCK.x + (2488 - DOCK_REGION[0]) * DK, top: DOCK.y + (200 - DOCK_REGION[1]) * DK, width: 152 * DK, height: 144 * DK };

function Stage() {
  const t = useSceneTime();
  const cam = camAt(CAMS, t);
  const a = toPx(42, 934, cam, FRAME);
  const text = typed(t, '/exit', T.TYPE, 6);
  const out = interpolate(t, [T.END, T.END + 1.2], [0, 1]);
  return (
    <>
      <Head chapter="⑥ 안전하게 · 3/4" title="끝내고 이어 하기" />
      <Screen shots={SHOTS} cams={CAMS} frame={FRAME} account="Claude Code · 수업 자료">
        {/* 빈 입력칸 위에 «/exit» 타이핑 */}
        {t >= T.TYPE - 0.2 && t < T.END && (
          <div style={{ position: 'absolute', left: a.x - FRAME.x, top: a.y - FRAME.y, width: 640 * a.s, height: 40 * a.s, background: '#0c0c0c', color: '#f2f2f2', fontFamily: MONO, fontSize: 28 * a.s, lineHeight: `${40 * a.s}px` }}>
            {text}<span style={{ display: 'inline-block', width: 14 * a.s, height: 30 * a.s, marginLeft: 2, verticalAlign: 'middle', background: '#f2f2f2', opacity: Math.floor(t * 2.4) % 2 ? 0.25 : 1 }} />
          </div>
        )}
      </Screen>
      {/* «Claude Code»가 창에서 나간다 */}
      {t >= T.END && out < 1 && (
        <div style={{ position: 'absolute', left: 1240 + out * 340, top: 300, opacity: 1 - out, zIndex: 45 }}>
          <Chip tone="gold" style={{ fontSize: 24, background: '#fff' }}>Claude Code 종료 →</Chip>
        </div>
      )}
      <Mark rect={R.input} cam={cam} frame={FRAME} k={window4(t, 0.4, 0.7, T.ENTER + 0.4, T.END - 0.2)} label="입력칸에 /exit" labelSide="top" labelSize={18} />
      <Mark rect={R.path} cam={cam} frame={FRAME} k={window4(t, T.END + 0.8, T.END + 1.1, T.DOCK - 0.2, T.DOCK + 0.2)} label="에이전트만 끝나고, 창은 이 폴더에 남습니다" labelSide="bottom" labelSize={19} />
      <Mark rect={R.resume} cam={cam} frame={FRAME} k={window4(t, T.CLICK + 1.0, T.CLICK + 1.3, DUR + 1, DUR + 2)} color={C.muted} label="지난 대화를 다시 열 때 쓰는 명령 — 처음엔 작업마다 새로" labelSide="bottom" labelSize={17} />

      {/* 틀 아래 키 칩 */}
      {t >= T.TYPE && t < T.END + 0.4 && (
        <div style={{ position: 'absolute', left: FRAME.x, top: FRAME.y + FRAME.h + 10, display: 'flex', alignItems: 'center', gap: 10, fontSize: 21, color: C.ink }}>
          <KeyCap style={{ opacity: t >= T.ENTER ? 1 : 0.35 }}>Enter</KeyCap><span>에이전트 끝내기</span>
        </div>
      )}
      {t >= T.END + 2 && (
        <Chip tone="muted" style={{ position: 'absolute', left: FRAME.x, top: FRAME.y + FRAME.h + 10, fontSize: 19 }}>창의 ✕로 닫아도 됩니다</Chip>
      )}

      {/* 오른쪽 여백: 독을 다시 누르면 새 대화 */}
      <div style={{ opacity: interpolate(t, [T.DOCK, T.DOCK + 0.5], [0, 1]) }}>
        <div style={{ position: 'absolute', left: DOCK.x, top: DOCK.y - 44, width: DOCK.w, fontSize: 19, fontWeight: 700, color: C.ink }}>다음 작업은</div>
        <Crop name="A-01a-교사판-독-전체" nat={NAT.dock} region={DOCK_REGION} w={DOCK.w} style={{ left: DOCK.x, top: DOCK.y }} />
        <Ring box={ICON} k={window4(t, T.CLICK - 0.4, T.CLICK - 0.1, DUR + 1, DUR + 2)} />
        <div style={{ position: 'absolute', left: DOCK.x, top: DOCK.y + 110, width: DOCK.w, fontSize: 21, fontWeight: 800, color: C.gold, lineHeight: 1.4, opacity: interpolate(t, [T.CLICK + 0.3, T.CLICK + 0.7], [0, 1]), wordBreak: 'keep-all' }}>
          독을 다시 눌러<br />새 대화로 시작
        </div>
      </div>
      <Cursor path={[
        { t: T.DOCK + 0.3, x: 92, y: 62 },
        { t: T.CLICK, x: ((ICON.left + ICON.width / 2) / 1920) * 100, y: ((ICON.top + ICON.height / 2) / 1080) * 100, click: true },
        { t: T.CLICK + 0.9, x: ((ICON.left + ICON.width / 2) / 1920) * 100, y: ((ICON.top + ICON.height / 2) / 1080) * 100, hide: true },
      ]} />
      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S25() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
