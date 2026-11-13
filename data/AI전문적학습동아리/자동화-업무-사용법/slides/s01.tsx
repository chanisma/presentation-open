import { Scene, useSceneTime, interpolate, spring } from '../../../../src/scene';
import { typed, popIn } from '../../../../src/walkthrough';
import { C, Head, SceneSubs, SHOT, Cursor, seq, type SlideMeta } from '../kit';
import { fade } from './_ui';

/* 1 — 도입: 독 한 줄 위에서 탐조등이 «자동화 업무»(마법봉)에 멈춘다.
   그 아래 말 한 줄이 타이핑되고, 세 갈래 선이 쿨메신저·리로스쿨·스페이스기전으로 흩어져 각자 «완료» 도장을 받는다. */

const SUBS = [
  '스페이스기전 데스크에 «자동화 업무»가 생겼습니다.',
  '독의 마법봉 아이콘을 누르면, 업무용 스킬이 준비된 에이전트가 바로 열립니다.',
  '말로 부탁하면 에이전트가 쿨메신저, 리로스쿨, 스페이스기전에서 일을 대신 처리합니다.',
  '이 영상에서는 처음 쓰시는 선생님을 위해 에이전트, 스킬, MCP부터 차근차근 살펴봅니다.',
];
const { subs, at, end } = seq(1, SUBS);
export const meta: SlideMeta = { kind: 'scene', dur: end };

const DOCK = { x: 150, y: 190, k: 0.566 }; // 독 캡처 2860×172
const WAND = { x: DOCK.x + 2482 * DOCK.k, y: DOCK.y + 86 * DOCK.k };
const REQ = '금요일 체험학습 일정 넣고, 담임 선생님께는 쪽지, 학부모님께는 문자로 안내해 줘';
const DEST = [
  { x: 330, name: '스페이스기전', what: '학사일정 등록', tone: '#5b5bd6' },
  { x: 860, name: '쿨메신저', what: '담임 선생님께 쪽지', tone: '#2a9fd8' },
  { x: 1390, name: '리로스쿨', what: '학부모님께 문자', tone: '#ee7a2a' },
];

function Stage() {
  const t = useSceneTime();
  const spot = interpolate(t, [0.2, at[1] + 0.6], [DOCK.x + 100, WAND.x]);
  const lit = fade(t, at[1] - 0.3, 0.6);
  const reqT = at[2] - 0.2;
  return (
    <>
      <Head chapter="스페이스기전 데스크 · 자동화 업무" title="말 한 줄로 맡기는 학교 업무" />
      {/* 독 */}
      <div style={{ position: 'absolute', left: DOCK.x, top: DOCK.y, ...popIn(t, 0.1) }}>
        <img src={SHOT('D-dock')} alt="데스크 독" style={{ width: 2860 * DOCK.k, display: 'block', mixBlendMode: 'multiply', filter: `saturate(${1 - 0.4 * lit})` }} />
      </div>
      {/* 탐조등 */}
      <div style={{ position: 'absolute', left: spot - 70, top: WAND.y - 70, width: 140, height: 140, borderRadius: '50%',
        boxShadow: `0 0 0 4px ${C.gold}, 0 0 40px 10px color-mix(in srgb, ${C.gold} 45%, transparent)`, opacity: fade(t, 0.4), zIndex: 5 }} />
      <div style={{ position: 'absolute', left: WAND.x - 110, top: WAND.y + 78, width: 220, textAlign: 'center', fontSize: 26, fontWeight: 800, color: C.gold, opacity: lit }}>자동화 업무</div>
      <Cursor path={[{ t: at[1] + 0.2, x: 70, y: 40 }, { t: at[1] + 1.4, x: (WAND.x / 1920) * 100, y: (WAND.y / 1080) * 100, click: true }, { t: at[1] + 2.4, x: (WAND.x / 1920) * 100 + 1, y: 36, hide: true }]} />

      {/* 말 한 줄 */}
      <div style={{ position: 'absolute', left: 260, top: 450, width: 1400, height: 84, borderRadius: 999, background: C.panel, border: `2px solid ${C.gold}`,
        display: 'flex', alignItems: 'center', gap: 18, padding: '0 34px', boxShadow: '0 20px 40px -24px rgba(15,138,120,.6)', ...popIn(t, reqT) }}>
        <span style={{ fontSize: 30 }}>🎙</span>
        <span style={{ fontSize: 31, fontWeight: 600, color: C.ink, wordBreak: 'keep-all' }}>{typed(t, REQ, reqT + 0.3, 16)}</span>
      </div>
      {/* 세 갈래 */}
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {DEST.map((d, i) => {
          const k = interpolate(t, [reqT + 2.6 + i * 0.4, reqT + 3.4 + i * 0.4], [0, 1]);
          const x2 = d.x + 200;
          return <path key={i} d={`M960,536 C960,600 ${x2},600 ${x2},${536 + 100 * k}`} fill="none" stroke={d.tone} strokeWidth={4} strokeDasharray="10 8" opacity={k > 0 ? 1 : 0} />;
        })}
      </svg>
      {DEST.map((d, i) => {
        const k = spring(t, reqT + 3.3 + i * 0.45, 0.55);
        const stamp = spring(t, reqT + 4.6 + i * 0.4, 0.4);
        return (
          <div key={d.name} style={{ position: 'absolute', left: d.x, top: 650, width: 400, height: 190, borderRadius: 20, background: C.panel, border: `1.5px solid ${C.line}`,
            boxShadow: '0 24px 50px -30px rgba(31,27,22,.5)', opacity: Math.min(1, k * 1.4), transform: `translateY(${(1 - k) * 24}px)`, padding: '26px 30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 16, height: 16, borderRadius: 4, background: d.tone }} />
              <span style={{ fontSize: 30, fontWeight: 800 }}>{d.name}</span>
            </div>
            <div style={{ marginTop: 14, fontSize: 25, color: C.muted }}>{d.what}</div>
            <div style={{ position: 'absolute', right: 26, bottom: 22, padding: '6px 16px', borderRadius: 10, border: `3px solid ${C.ok}`, color: C.ok, fontWeight: 800, fontSize: 24,
              transform: `rotate(-8deg) scale(${1.6 - 0.6 * stamp})`, opacity: stamp }}>완료</div>
          </div>
        );
      })}
      <SceneSubs items={subs} />
    </>
  );
}

export default function S01() {
  return (
    <Scene duration={end}>
      <Stage />
    </Scene>
  );
}
