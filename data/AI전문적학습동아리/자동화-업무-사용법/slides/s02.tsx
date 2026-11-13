import { Scene, useSceneTime, spring } from '../../../../src/scene';
import { C, MONO, Head, SceneSubs, seq, type SlideMeta } from '../kit';
import { fade } from './_ui';

/* 2 — 세 단어: 가운데 «조수»(에이전트 터미널)가 크게 서고, 왼쪽에서 매뉴얼 바인더(스킬)가,
   오른쪽에서 출입증(MCP)이 날아와 조수에게 걸린다. 마지막에 «매뉴얼 = 제대로, 출입증 = 들어갈 수 있게»가 양쪽에 붙는다. */

const SUBS = [
  '먼저 세 단어만 기억하면 됩니다. 에이전트, 스킬, 그리고 MCP입니다.',
  '에이전트는 말로 부탁하면 컴퓨터에서 직접 일을 하는 AI 조수입니다. Claude Code와 Codex가 여기에 해당합니다.',
  '스킬은 그 조수에게 건네는 업무 매뉴얼입니다. 어떤 순서로, 무엇을 조심하며 일할지가 적혀 있습니다.',
  'MCP는 조수가 다른 서비스에 들어갈 수 있게 해 주는 출입증입니다.',
  '매뉴얼이 있으면 일을 제대로 하고, 출입증이 있으면 학교 시스템의 정보를 다룰 수 있습니다.',
];
const { subs, at, end } = seq(2, SUBS);
export const meta: SlideMeta = { kind: 'scene', dur: end };

function Stage() {
  const t = useSceneTime();
  const a = spring(t, at[1], 0.6);
  const b = spring(t, at[2] + 0.3, 0.7);
  const c = spring(t, at[3] + 0.3, 0.7);
  const words = ['에이전트', '스킬', 'MCP'];
  return (
    <>
      <Head chapter="① 세 단어" title="에이전트 · 스킬 · MCP" />
      {/* 세 단어 칩 */}
      <div style={{ position: 'absolute', left: 72, top: 176, display: 'flex', gap: 14 }}>
        {words.map((w, i) => {
          const k = spring(t, at[0] + 0.8 + i * 0.5, 0.4);
          const now = (i === 0 && t >= at[1] && t < at[2]) || (i === 1 && t >= at[2] && t < at[3]) || (i === 2 && t >= at[3] && t < at[4]);
          return <span key={w} style={{ padding: '8px 22px', borderRadius: 999, fontSize: 26, fontWeight: 800, opacity: k, background: now ? C.gold : C.panel, color: now ? '#fff' : C.ink, border: `1.5px solid ${now ? C.gold : C.line}` }}>{w}</span>;
        })}
      </div>

      {/* 가운데: 조수 = 에이전트 터미널 */}
      <div style={{ position: 'absolute', left: 700, top: 300, width: 520, height: 400, borderRadius: 22, background: C.term, boxShadow: '0 40px 80px -40px rgba(10,30,26,.8)',
        opacity: Math.min(1, a * 1.3), transform: `scale(${0.9 + 0.1 * a})`, padding: 30, color: '#e6e6ea', zIndex: 3 }}>
        <div style={{ fontFamily: MONO, fontSize: 22, color: C.goldSoft }}>{'>_'} 에이전트</div>
        <div style={{ marginTop: 26, fontSize: 25, lineHeight: 1.6 }}>
          <div style={{ opacity: fade(t, at[1] + 1.2) }}><span style={{ color: '#8b95a1' }}>선생님 ›</span> 이 파일 정리해 줘</div>
          <div style={{ opacity: fade(t, at[1] + 2.4) }}><span style={{ color: C.goldSoft }}>⏺</span> 읽기 → 계획 → 허락 → 실행</div>
        </div>
        <div style={{ position: 'absolute', left: 30, bottom: 26, display: 'flex', gap: 10, opacity: fade(t, at[1] + 3.2) }}>
          {['Claude Code', 'Codex'].map((n) => <span key={n} style={{ padding: '6px 14px', borderRadius: 8, background: '#24242c', fontSize: 19 }}>{n}</span>)}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 700, top: 716, width: 520, textAlign: 'center', fontSize: 27, fontWeight: 800, opacity: a }}>AI 조수 — 직접 일한다</div>

      {/* 왼쪽: 매뉴얼 바인더 = 스킬 */}
      <div style={{ position: 'absolute', left: 150 + (1 - b) * -120, top: 330, width: 400, height: 330, opacity: b, transform: `rotate(${-4 * b}deg)` }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 14, background: '#fffdf6', border: `1.5px solid ${C.line}`, boxShadow: '0 24px 50px -28px rgba(31,27,22,.5)', padding: '26px 30px 26px 54px' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 26, borderRadius: '14px 0 0 14px', background: C.gold }} />
          <div style={{ fontSize: 17, color: C.muted, fontFamily: MONO }}>SKILL.md</div>
          <div style={{ fontSize: 28, fontWeight: 800, margin: '6px 0 14px' }}>쪽지 보내기 매뉴얼</div>
          {['1. 조직도에서 받는 사람 찾기', '2. 초안 쓰기', '3. 승인받고 보내기', '⚠ 승인 없이 보내지 않기'].map((s, i) => (
            <div key={s} style={{ fontSize: 21, lineHeight: 1.75, color: i === 3 ? C.warn : C.ink, opacity: fade(t, at[2] + 1 + i * 0.5) }}>{s}</div>
          ))}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 150, top: 716, width: 400, textAlign: 'center', fontSize: 27, fontWeight: 800, opacity: b }}>스킬 — 업무 매뉴얼</div>

      {/* 오른쪽: 출입증 = MCP */}
      <div style={{ position: 'absolute', left: 1380 + (1 - c) * 120, top: 360, width: 360, height: 280, opacity: c, transform: `rotate(${5 * c}deg)` }}>
        <div style={{ position: 'absolute', left: 160, top: -60, width: 40, height: 80, borderRadius: 8, border: `4px solid ${C.muted}`, borderBottom: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: 18, background: C.panel, border: `1.5px solid ${C.line}`, boxShadow: '0 24px 50px -28px rgba(31,27,22,.5)', overflow: 'hidden' }}>
          <div style={{ height: 70, background: '#5b5bd6', color: '#fff', display: 'flex', alignItems: 'center', padding: '0 24px', fontSize: 25, fontWeight: 800 }}>SPACEKIJUN 출입증</div>
          <div style={{ padding: '20px 24px', fontSize: 21, lineHeight: 1.7 }}>
            <div>권한: <b>선생님 본인</b></div>
            <div>들어갈 곳: 업무 · 일정 · 문서</div>
            <div style={{ color: C.muted }}>발급: 학교 관리자</div>
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 1380, top: 716, width: 360, textAlign: 'center', fontSize: 27, fontWeight: 800, opacity: c }}>MCP — 출입증</div>

      {/* 잇는 선 */}
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <path d="M560,500 L700,500" stroke={C.gold} strokeWidth={4} strokeDasharray="10 8" opacity={b} />
        <path d="M1220,500 L1380,500" stroke="#5b5bd6" strokeWidth={4} strokeDasharray="10 8" opacity={c} />
      </svg>
      {/* 요약 */}
      <div style={{ position: 'absolute', left: 150, right: 180, top: 790, display: 'flex', justifyContent: 'space-between', fontSize: 25, fontWeight: 700, color: C.gold, opacity: fade(t, at[4] + 0.6) }}>
        <span>매뉴얼이 있으면 → 제대로</span><span style={{ color: '#5b5bd6' }}>출입증이 있으면 → 들어갈 수 있게</span>
      </div>
      <SceneSubs items={subs} />
    </>
  );
}

export default function S02() {
  return (
    <Scene duration={end}>
      <Stage />
    </Scene>
  );
}
