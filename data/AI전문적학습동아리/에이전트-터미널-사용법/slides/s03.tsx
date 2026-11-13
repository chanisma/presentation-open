import { Scene, useSceneTime, interpolate, easeInOut } from '../../../../src/scene';
import { popIn } from '../../../../src/walkthrough';
import { C, MONO, Head, SceneSubs, Cursor, SHOT, window4, type SlideMeta, type Sub } from '../kit';
import { Pic, picPt, pct, Box, type Region } from './_a';

/* 3 — walkthrough: 독에서 «에이전트 터미널» 찾기 (A-01a → A-01b, 학생판 A-13)
   메타포: 탐조등 — 독의 아이콘 줄을 왼쪽부터 훑다가 맨 끝 검은 타일에서 멈춘다.
   좌표는 독 캡처의 원본 픽셀(교사판 3200×400, 학생판 2400×400). 2026-10-16 캡처에서 잼. */

const T = { SCAN0: 0.6, SCAN1: 3.6, HOVER: 4.3, STU: 7.4, STU_HOVER: 8.6, HIDE: 9.8, NOTE: 10.8 };
const DUR = 14;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '독의 도구 무리 맨 끝에 검은 바탕의 주황 아이콘이 있습니다. 마우스를 올리면 «에이전트 터미널»이라고 뜹니다.' },
  { at: T.STU, text: '학생판 독에도 같은 자리에 있습니다.' },
  { at: T.NOTE, text: '안 보이면 독 아이콘 설정에서 숨겨져 있지 않은지 확인하세요.' },
];

const TR: Region = [256, 100, 2688, 300];
const TP = { x: 72, y: 246, w: 1776 };
const SR: Region = [150, 100, 2100, 300];
const SP = { x: 72, y: 616, w: 1300 };

const tileA = picPt(2544, 296, TP.x, TP.y, TP.w, TR); // 가리키기 전
const tileB = picPt(2562, 272, TP.x, TP.y, TP.w, TR); // 가리킨 뒤(커짐)
const tileS = picPt(1946, 274, SP.x, SP.y, SP.w, SR);

function Stage() {
  const t = useSceneTime();
  const sx = interpolate(t, [T.SCAN0, T.SCAN1], [TP.x + 120, tileA.x], easeInOut);
  const spotOn = window4(t, T.SCAN0 - 0.3, T.SCAN0, T.HOVER + 1.2, T.HOVER + 1.8);
  const hov = interpolate(t, [T.HOVER, T.HOVER + 0.3], [0, 1]);
  return (
    <>
      <Head chapter="② 준비 · 1/4" title="독에서 «에이전트 터미널» 찾기" />

      <div style={{ position: 'absolute', left: TP.x, top: TP.y - 40, fontSize: 21, fontWeight: 700, color: C.muted }}>교사판 · 스페이스기전 데스크</div>
      <Pic src={SHOT('A-01a-교사판-독-전체')} nat={[3200, 400]} region={TR} x={TP.x} y={TP.y} w={TP.w} />
      <Pic src={SHOT('A-01b-교사판-독-에이전트-가리킴')} nat={[3200, 400]} region={TR} x={TP.x} y={TP.y} w={TP.w} style={{ opacity: hov }} />
      {/* 탐조등 — 둘레를 어둡게, 빛이 지나는 곳만 밝게 */}
      <div style={{ position: 'absolute', left: TP.x, top: TP.y, width: TP.w, height: 198, borderRadius: 12, pointerEvents: 'none', opacity: spotOn,
        background: `radial-gradient(circle at ${sx - TP.x}px ${tileA.y - TP.y}px, rgba(255,214,170,.28) 0 46px, rgba(10,8,6,.62) 120px)` }} />
      <div style={{ position: 'absolute', left: tileB.x + 90, top: TP.y - 58, ...popIn(t, T.HOVER + 0.5), zIndex: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 22, fontWeight: 800, color: C.ink, background: C.panel, border: `2px solid ${C.gold}`, borderRadius: 12, padding: '8px 14px', whiteSpace: 'nowrap' }}>
          <span style={{ width: 30, height: 30, borderRadius: 8, background: C.term, color: C.goldSoft, fontFamily: MONO, fontSize: 15, display: 'grid', placeItems: 'center' }}>{'>_'}</span>
          도구 무리 맨 끝
        </div>
      </div>

      <div style={{ position: 'absolute', inset: 0, ...popIn(t, T.STU) }}>
        <div style={{ position: 'absolute', left: SP.x, top: SP.y - 40, fontSize: 21, fontWeight: 700, color: C.muted }}>학생판 · 스페이스기전 학생</div>
        <Pic src={SHOT('A-13-학생판-독-에이전트-가리킴')} nat={[2400, 400]} region={SR} x={SP.x} y={SP.y} w={SP.w} />
      </div>
      <Box r={[tileS.x - 46, tileS.y - 44, 92, 92]} k={window4(t, T.STU_HOVER, T.STU_HOVER + 0.3, DUR + 1, DUR + 2)} label="같은 자리" side="bottom" />

      {/* 숨겨져 있을 때 */}
      <div style={{ position: 'absolute', left: 1420, top: 600, width: 428, ...popIn(t, T.NOTE), background: C.panel, border: `1px solid ${C.line}`, borderLeft: `5px solid ${C.gold}`, borderRadius: 12, padding: '16px 20px', boxShadow: '0 16px 40px -26px rgba(31,27,22,.5)' }}>
        <div style={{ fontSize: 21, fontWeight: 800, color: C.ink }}>아이콘이 안 보이면</div>
        <div style={{ fontSize: 19, color: C.ink, marginTop: 8, lineHeight: 1.55, wordBreak: 'keep-all' }}>
          교사판: 데스크 «연결 및 설정» → «독 아이콘»<br />학생판: 독의 «설정» → 독 아이콘 칩
        </div>
      </div>

      <Cursor path={[
        { t: 3.2, ...pct(tileA.x - 90, tileA.y + 70) },
        { t: T.HOVER, ...pct(tileB.x + 6, tileB.y + 10) },
        { t: 7.0, ...pct(tileB.x + 6, tileB.y + 10) },
        { t: T.STU_HOVER, ...pct(tileS.x + 6, tileS.y + 10) },
        { t: T.HIDE, ...pct(tileS.x + 6, tileS.y + 10), hide: true },
      ]} />
      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S03() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
