import { Scene, useSceneTime, interpolate, easeInOut } from '../../../../src/scene';
import { popIn } from '../../../../src/walkthrough';
import { C, Head, SceneSubs, Cursor, Screen, Mark, Chip, SHOT, camAt, window4, type Cam, type Frame, type Shot, type SlideMeta, type Sub } from '../kit';
import { Pic, picPt, pct, ExplorerMock, type Region } from './_a';

/* 7 — walkthrough: 왼쪽 클릭 — 보던 폴더에서 바로 열기 (탐색기 «수업 자료» → 독 A-01a/A-02 → 터미널 B-00-첫실행-시작화면)
   메타포: 실 잇기 — 보던 탐색기 창에서 독 아이콘으로, 다시 새 터미널 창으로 금실 한 가닥이 이어진다.
   탐색기 창은 연습 폴더의 실제 파일 이름으로 그린 목업, 독·말풍선·터미널은 실화면. */

const T = { EXP: 0.3, LOOK: 1.2, CLICK: 3.6, BALLOON: 3.9, THREAD: 4.3, TERM: 5.0, ZOOM: 7.2, NOTE: 10.0 };
const DUR = 14.5;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '자료 폴더를 탐색기로 열어 둔 채 독의 아이콘을 누르세요.' },
  { at: T.TERM, text: '그 폴더에서 에이전트가 새 터미널 창으로 바로 열립니다. 창 제목에 폴더 이름이 보입니다.' },
  { at: T.NOTE, text: '에이전트는 이 폴더 안의 파일을 읽고 만듭니다. 그래서 «어느 폴더에서 여느냐»가 가장 중요합니다.' },
];

/* 바탕 화면 무대 */
const DESK = { x: 72, y: 150, w: 1776, h: 784 };
const DR: Region = [256, 100, 2688, 300];
const DP = { x: 160, y: 762, w: 1500 };
const icon = picPt(2544, 296, DP.x, DP.y, DP.w, DR);
const EXP = { x: 130, y: 196, w: 600, h: 430 };
const FR: Frame = { x: 860, y: 196, w: 940, h: 529 };
const SHOTS: Shot[] = [{ at: 0, src: SHOT('B-00-첫실행-시작화면') }];
const CAMS: Cam[] = [
  { t: 0, cx: 960, cy: 540, z: 1 },
  { t: T.ZOOM, cx: 960, cy: 540, z: 1 },
  { t: T.ZOOM + 1.0, cx: 420, cy: 130, z: 2.1 },
];

function Stage() {
  const t = useSceneTime();
  const cam = camAt(CAMS, t);
  const thread = interpolate(t, [T.THREAD, T.TERM + 0.8], [0, 1], easeInOut);
  const from = { x: EXP.x + EXP.w, y: EXP.y + EXP.h - 40 };
  const top = { x: icon.x - 30, y: icon.y - 52 };
  const to = { x: FR.x + FR.w - 140, y: FR.y + FR.h };
  const d = `M${from.x},${from.y} C${from.x + 40},${from.y + 140} 1000,746 1244,750 L${top.x},${top.y} M${icon.x + 40},${icon.y - 40} C${icon.x + 160},${icon.y - 90} ${to.x},${to.y + 80} ${to.x},${to.y}`;
  return (
    <>
      <Head chapter="③ 열기 · 1/4" title="왼쪽 클릭: 보던 폴더에서 바로 열기" />
      <div style={{ position: 'absolute', left: DESK.x, top: DESK.y, width: DESK.w, height: DESK.h, borderRadius: 16, overflow: 'hidden',
        background: '#1d2232', boxShadow: '0 30px 70px -36px rgba(31,27,22,.6)' }} />

      <ExplorerMock x={EXP.x} y={EXP.y} w={EXP.w} h={EXP.h} style={{ ...popIn(t, EXP_IN), boxShadow: t >= T.LOOK && t < T.CLICK ? `0 0 0 4px ${C.gold}, 0 24px 60px -28px rgba(0,0,0,.6)` : undefined }} />
      <div style={{ position: 'absolute', left: EXP.x, top: EXP.y + EXP.h + 14, ...popIn(t, T.LOOK) }}>
        <Chip>보던 창 · 수업 자료</Chip>
      </div>

      {/* 실은 독·말풍선·터미널 뒤로 지나간다 */}
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: 1920, height: 1080, pointerEvents: 'none', zIndex: 0 }}>
        <defs><clipPath id="s07-thread"><rect x={0} y={0} width={1920 * thread} height={1080} /></clipPath></defs>
        <path d={d} fill="none" stroke={C.goldSoft} strokeWidth={4} strokeLinecap="round" clipPath="url(#s07-thread)" opacity={0.95} />
      </svg>
      <Pic src={SHOT('A-01a-교사판-독-전체')} nat={[3200, 400]} region={DR} x={DP.x} y={DP.y} w={DP.w} shadow={false} radius={0} style={{ background: 'transparent' }} />
      <Pic src={SHOT('A-02-독-눌러-곧바로-열림')} nat={[3200, 400]} region={DR} x={DP.x} y={DP.y} w={DP.w} shadow={false} radius={0} style={{ opacity: interpolate(t, [T.BALLOON, T.BALLOON + 0.25], [0, 1]) }} />

      {t >= T.TERM && (
        <div style={{ position: 'absolute', inset: 0, ...(t < T.TERM + 0.6 ? popIn(t, T.TERM) : {}) }}>
          <Screen shots={SHOTS} cams={CAMS} frame={FR} />
        </div>
      )}
      <Mark rect={[10, 14, 356, 44]} cam={cam} frame={FR} k={window4(t, T.ZOOM + 1.0, T.ZOOM + 1.3, DUR + 1, DUR + 2)} label="창 제목 = Claude Code · 폴더 이름" labelSide="bottom" />


      <div style={{ position: 'absolute', left: EXP.x, top: EXP.y + EXP.h + 70, width: 640, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12, zIndex: 36 }}>
        <div style={popIn(t, T.NOTE)}><Chip tone="gold" style={{ background: '#fff' }}>이 폴더 안에서만 읽고 만듭니다</Chip></div>
        <div style={popIn(t, T.NOTE + 0.4)}><Chip tone="muted" style={{ background: '#fff' }}>폴더가 여럿이면 패널이 뜹니다 (10장)</Chip></div>
      </div>

      <Cursor path={[
        { t: 1.6, ...pct(EXP.x + 360, EXP.y + 220) },
        { t: T.CLICK, ...pct(icon.x, icon.y), click: true },
        { t: 4.6, ...pct(icon.x, icon.y), hide: true },
      ]} />
      <SceneSubs items={SUBS} />
    </>
  );
}
const EXP_IN = T.EXP;

export default function S07() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
