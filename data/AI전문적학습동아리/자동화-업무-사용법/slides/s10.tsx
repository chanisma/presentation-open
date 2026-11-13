import { Scene, useSceneTime, spring } from '../../../../src/scene';
import { C, Head, SceneSubs, seq, type SlideMeta } from '../kit';
import { fade } from './_ui';

/* 10 — SPACEKIJUN MCP가 읽는 데이터: 학교 «자료 보관함» 서랍 네 칸이 차례로 열린다.
   학생 서랍은 안이 둘로 나뉘어(전교 공개 · 담임·수업 반만) 자물쇠 표시가 붙고, 맨 아래에는 잠긴 서랍(성적·봉사·창체). */

const SUBS = [
  'SPACEKIJUN 연결로 에이전트가 읽을 수 있는 학교 데이터는 크게 네 갈래입니다.',
  '학교 공통 자료는 학교 기본 정보, 학사일정, 급식 식단, 교내 전화번호, 부서입니다.',
  '교직원 자료는 교직원 명단과 업무분장, 학교 업무 지도, 교사 시간표입니다. 이메일이나 연락처는 들어 있지 않습니다.',
  '내 정보와 내 시간표도 읽을 수 있습니다.',
  '학생 명단, 동아리, 수강 과목, 시간표는 전교를 볼 수 있지만, 자습실 출결은 담임 반과 내 수업 반만 볼 수 있습니다.',
  '성적과 봉사, 창체 기록은 열려 있지 않습니다. 에이전트는 이 데이터를 근거로, 추측하지 않고 일합니다.',
];
const { subs, at, end } = seq(10, SUBS);
export const meta: SlideMeta = { kind: 'scene', dur: end };

const DRAWERS: { title: string; tone: string; items: string[]; note?: string }[] = [
  { title: '학교 공통', tone: '#0f8a78', items: ['학교 기본 정보', '학사일정', '급식 식단', '교내 전화번호', '부서'] },
  { title: '교직원', tone: '#5b5bd6', items: ['교직원 명단', '업무분장', '학교 업무 지도', '교사 시간표'], note: '이메일·연락처 없음' },
  { title: '내 것', tone: '#2a9fd8', items: ['내 정보', '내 시간표'] },
];

function Drawer({ i, x, y, w, h, t0, children, title, tone }: { i: number; x: number; y: number; w: number; h: number; t0: number; children: React.ReactNode; title: string; tone: string }) {
  const t = useSceneTime();
  const k = spring(t, t0, 0.6);
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h }}>
      {/* 서랍 앞판 */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: 64, borderRadius: '14px 14px 0 0', background: tone, color: '#fff', display: 'flex', alignItems: 'center', gap: 14, padding: '0 22px', fontSize: 27, fontWeight: 800, opacity: fade(t, 0.3 + i * 0.25) }}>
        <span style={{ width: 40, height: 8, borderRadius: 4, background: 'rgba(255,255,255,.6)' }} />{title}
      </div>
      <div style={{ position: 'absolute', left: 0, top: 64, width: w, height: (h - 64) * k, overflow: 'hidden', borderRadius: '0 0 14px 14px', background: C.panel, border: `1.5px solid ${C.line}`, borderTop: 'none' }}>
        <div style={{ padding: '16px 20px' }}>{children}</div>
      </div>
    </div>
  );
}

const Item = ({ s, on }: { s: string; on: number }) => (
  <div style={{ fontSize: 23, lineHeight: 1.85, opacity: on }}>▪ {s}</div>
);

function Stage() {
  const t = useSceneTime();
  return (
    <>
      <Head chapter="⑨ SPACEKIJUN에서 읽을 수 있는 데이터" title="학교 자료 보관함, 네 칸" />
      {DRAWERS.map((d, i) => (
        <Drawer key={d.title} i={i} x={72 + i * 420} y={190} w={390} h={i === 2 ? 260 : 420} t0={at[i + 1]} title={d.title} tone={d.tone}>
          {d.items.map((s, n) => <Item key={s} s={s} on={fade(t, at[i + 1] + 0.5 + n * 0.35)} />)}
          {d.note && <div style={{ marginTop: 6, fontSize: 19, color: C.warn, fontWeight: 700, opacity: fade(t, at[i + 1] + 3) }}>{d.note}</div>}
        </Drawer>
      ))}
      <Drawer i={3} x={1332} y={190} w={516} h={520} t0={at[4]} title="학생" tone="#c0392b">
        <div style={{ fontSize: 20, fontWeight: 800, color: C.muted }}>전교 재학생</div>
        {['학생 명단 (학반 번호·이름)', '동아리 · 수강 과목', '학생 시간표'].map((s, n) => <Item key={s} s={s} on={fade(t, at[4] + 0.6 + n * 0.4)} />)}
        <div style={{ marginTop: 14, padding: '12px 16px', borderRadius: 10, background: '#fdf0ee', opacity: fade(t, at[4] + 3.2) }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.warn }}>🔒 담임 반 · 내 수업 반만</div>
          <div style={{ fontSize: 23, lineHeight: 1.8 }}>▪ 자습실 출결</div>
        </div>
      </Drawer>
      {/* 잠긴 서랍 */}
      <div style={{ position: 'absolute', left: 72 + 840, top: 480, width: 390, height: 230, borderRadius: 14, background: '#ece8e0', border: `2px dashed ${C.faint}`, padding: '22px 24px', opacity: fade(t, at[5]) }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.muted }}>🔒 열려 있지 않음</div>
        <div style={{ marginTop: 10, fontSize: 23, lineHeight: 1.7, color: C.muted }}>내신 · 모의고사<br />봉사 · 창체 기록</div>
      </div>
      {/* 아래 띠 */}
      <div style={{ position: 'absolute', left: 72, right: 72, top: 760, padding: '20px 30px', borderRadius: 16, background: C.ink, color: '#fff', fontSize: 25, display: 'flex', gap: 30, alignItems: 'center', opacity: fade(t, at[5] + 2.5) }}>
        <b style={{ color: C.goldSoft }}>list_data → read_data</b>
        <span>목록을 먼저 보고, 필요한 것만 골라 읽는다 · 추측 대신 근거</span>
      </div>
      <SceneSubs items={subs} />
    </>
  );
}

export default function S10() {
  return (
    <Scene duration={end}>
      <Stage />
    </Scene>
  );
}
