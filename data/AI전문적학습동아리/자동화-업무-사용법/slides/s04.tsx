import { Scene, useSceneTime, interpolate, spring } from '../../../../src/scene';
import { C, MONO, Head, SceneSubs, seq, type SlideMeta } from '../kit';
import { fade } from './_ui';

/* 4 — MCP: 왼쪽 에이전트에서 나온 전선이 가운데 «MCP 플러그»를 거쳐 오른쪽 SPACEKIJUN 콘센트에 꽂힌다.
   꽂히는 순간 서버 쪽 서랍(도구)들에 불이 들어오는데, 관리자 문(게이트)이 허용한 서랍만 켜진다.
   열쇠 «선생님 본인 권한»이 전선 위를 따라 흐른다. */

const SUBS = [
  'MCP는 에이전트와 외부 서비스를 잇는 표준 연결 방식입니다. 전기 플러그처럼 규격이 정해져 있습니다.',
  '데스크에서 SPACEKIJUN을 연결하면, 에이전트가 스페이스기전의 업무, 일정, 문서 도구를 쓸 수 있게 됩니다.',
  '이때 에이전트는 로그인한 선생님 본인의 권한으로만 움직입니다. 선생님이 웹에서 못 하는 일은 에이전트도 못 합니다.',
  '어떤 도구를 쓸 수 있는지는 학교 관리자가 정하고, 연결은 언제든 스페이스기전 웹에서 끊을 수 있습니다.',
];
const { subs, at, end } = seq(4, SUBS);
export const meta: SlideMeta = { kind: 'scene', dur: end };

const TOOLS: [string, boolean][] = [
  ['업무 · 할 일', true], ['일정', true], ['플래너', true], ['문서 생성', true],
  ['구매 신청', true], ['결재 · 서명', true], ['학교 데이터', true], ['급식지도', false],
];

function Stage() {
  const t = useSceneTime();
  const plug = interpolate(t, [at[1] + 0.3, at[1] + 1.8], [0, 1]);
  const live = t > at[1] + 1.8;
  const key = interpolate(t, [at[2] + 0.6, at[2] + 3.4], [0, 1]);
  const gate = spring(t, at[3] + 0.2, 0.6);
  const PX = 640 + plug * 300; // 플러그 머리 x
  return (
    <>
      <Head chapter="③ MCP" title="MCP = 에이전트를 학교 시스템에 꽂는 플러그" />
      {/* 에이전트 */}
      <div style={{ position: 'absolute', left: 90, top: 340, width: 360, height: 260, borderRadius: 20, background: C.term, color: '#e6e6ea', padding: 28, ...{ opacity: fade(t, 0.3) } }}>
        <div style={{ fontFamily: MONO, color: C.goldSoft, fontSize: 22 }}>{'>_'} 에이전트</div>
        <div style={{ marginTop: 20, fontSize: 22, lineHeight: 1.6 }}>Claude Code<br />Codex</div>
      </div>
      {/* 전선 + 플러그 */}
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <path d={`M450,470 C540,470 560,${470} ${PX - 60},470`} stroke="#3b3b44" strokeWidth={10} fill="none" strokeLinecap="round" opacity={fade(t, at[0] + 0.8)} />
        {live && <path d="M450,470 L1000,470" stroke={C.goldSoft} strokeWidth={4} strokeDasharray="14 12" strokeDashoffset={-t * 60} fill="none" />}
      </svg>
      <div style={{ position: 'absolute', left: PX - 70, top: 425, width: 110, height: 90, borderRadius: 16, background: '#5b5bd6', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 26, opacity: fade(t, at[0] + 1), boxShadow: '0 16px 30px -16px rgba(40,40,120,.7)' }}>MCP</div>
      <div style={{ position: 'absolute', left: PX + 40, top: 445, width: 34, height: 14, background: '#9aa0aa', borderRadius: 3, opacity: fade(t, at[0] + 1) }} />
      <div style={{ position: 'absolute', left: PX + 40, top: 481, width: 34, height: 14, background: '#9aa0aa', borderRadius: 3, opacity: fade(t, at[0] + 1) }} />
      <div style={{ position: 'absolute', left: 520, top: 560, width: 380, fontSize: 22, color: C.muted, textAlign: 'center', opacity: fade(t, at[0] + 2) }}>규격이 같으면 어느 에이전트든 꽂힌다</div>

      {/* 열쇠 — 선생님 본인 권한 */}
      {key > 0 && key < 1 && (
        <div style={{ position: 'absolute', left: 450 + key * 560, top: 380, fontSize: 22, fontWeight: 700, color: C.gold, background: C.panel, border: `2px solid ${C.gold}`, borderRadius: 999, padding: '6px 16px', whiteSpace: 'nowrap' }}>🔑 선생님 본인 권한</div>
      )}
      <div style={{ position: 'absolute', left: 90, top: 640, width: 820, padding: '18px 24px', borderRadius: 14, background: C.panel, border: `2px solid ${C.gold}`, fontSize: 24, lineHeight: 1.5, opacity: fade(t, at[2] + 2.2), wordBreak: 'keep-all' }}>
        🔑 로그인은 선생님이 <b>직접</b> · 웹에서 못 하는 일은 에이전트도 못 한다
      </div>

      {/* SPACEKIJUN 콘센트 + 서랍 */}
      <div style={{ position: 'absolute', left: 1010, top: 230, width: 820, height: 520, borderRadius: 22, background: C.panel, border: `1.5px solid ${C.line}`, boxShadow: '0 30px 60px -34px rgba(31,27,22,.55)', padding: '24px 30px', opacity: fade(t, 0.5) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ width: 22, height: 22, borderRadius: 6, background: '#5b5bd6' }} />
          <span style={{ fontSize: 30, fontWeight: 800 }}>SPACEKIJUN</span>
          <span style={{ fontSize: 20, color: live ? C.ok : C.faint, fontWeight: 700 }}>{live ? '● 연결됨' : '○ 연결 안 됨'}</span>
        </div>
        <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {TOOLS.map(([name, ok], i) => {
            const on = live && interpolate(t, [at[1] + 2 + i * 0.25, at[1] + 2.3 + i * 0.25], [0, 1]) > 0.5 && (ok || gate < 0.5);
            const blocked = !ok && gate > 0.5;
            return (
              <div key={name} style={{ height: 70, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 14, padding: '0 20px', fontSize: 24, fontWeight: 700,
                background: on ? `color-mix(in srgb, ${C.gold} 12%, #fff)` : '#f4f2ee', border: `2px solid ${on ? C.gold : 'transparent'}`, color: blocked ? C.faint : C.ink }}>
                <span style={{ width: 14, height: 14, borderRadius: '50%', background: on ? C.gold : blocked ? '#d7d2c8' : '#cfc9bd' }} />
                {name}{blocked && <span style={{ marginLeft: 'auto', fontSize: 19, color: C.warn }}>허용 안 됨</span>}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 20, display: 'flex', gap: 16, alignItems: 'center', fontSize: 22, color: C.muted, opacity: gate }}>
          <span style={{ padding: '6px 14px', borderRadius: 8, background: C.ink, color: '#fff', fontWeight: 700 }}>관리자</span>
          쓸 수 있는 도구를 정한다 · 웹에서 언제든 연결 해제
        </div>
      </div>
      <SceneSubs items={subs} />
    </>
  );
}

export default function S04() {
  return (
    <Scene duration={end}>
      <Stage />
    </Scene>
  );
}
