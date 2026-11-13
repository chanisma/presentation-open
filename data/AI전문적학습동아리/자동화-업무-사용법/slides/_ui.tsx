import type { CSSProperties, ReactNode } from 'react';
import { useSceneTime, interpolate, spring } from '../../../../src/scene';
import { typed } from '../../../../src/walkthrough';
import { C, MONO } from '../kit';

/* 6~9장 공용 부품 — 에이전트 대화 창(Claude Code 터미널을 단순화한 재구성 화면).
   실제 발송을 하지 않으려고 실행 화면 대신 재구성했다. 문구는 스킬 문서(SKILL.md)의 절차를 따른다. */

export type Line =
  | { at: number; kind: 'user'; text: string }
  | { at: number; kind: 'agent'; text: string }
  | { at: number; kind: 'tool'; text: string }
  | { at: number; kind: 'block'; node: ReactNode }
  | { at: number; kind: 'ok'; text: string };

export function AgentChat({ x, y, w, h, lines, title = 'Claude Code · 자동화 업무', style }: {
  x: number; y: number; w: number; h: number; lines: Line[]; title?: string; style?: CSSProperties;
}) {
  const t = useSceneTime();
  const shown = lines.filter((l) => t >= l.at);
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 16, background: C.term, overflow: 'hidden',
      boxShadow: '0 30px 70px -30px rgba(10,30,26,.65)', border: '1px solid rgba(255,255,255,.06)', ...style }}>
      <div style={{ height: 44, display: 'flex', alignItems: 'center', gap: 8, padding: '0 18px', background: '#16161b', color: '#9aa3ad', fontSize: 17 }}>
        {['#ff5f57', '#febc2e', '#28c840'].map((c) => <span key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />)}
        <span style={{ marginLeft: 12, fontFamily: MONO }}>{title}</span>
      </div>
      {/* 아래에서 위로 쌓인다 — 넘치면 오래된 줄이 위로 밀려 나간다 */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 44, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '16px 24px 22px', gap: 14 }}>
        {shown.map((l, i) => {
          const k = spring(t, l.at, 0.45);
          const st: CSSProperties = { opacity: Math.min(1, k * 1.5), transform: `translateY(${(1 - k) * 12}px)` };
          if (l.kind === 'user') {
            const txt = typed(t, l.text, l.at, 26);
            return (
              <div key={i} style={{ ...st, display: 'flex', gap: 12, alignItems: 'flex-start', background: '#24242c', borderRadius: 10, padding: '12px 16px' }}>
                <span style={{ color: C.goldSoft, fontFamily: MONO, fontSize: 22 }}>{'>'}</span>
                <span style={{ color: '#f4f4f6', fontSize: 23, lineHeight: 1.45, wordBreak: 'keep-all' }}>{txt}</span>
              </div>
            );
          }
          if (l.kind === 'tool') {
            return (
              <div key={i} style={{ ...st, display: 'flex', gap: 10, alignItems: 'center', color: '#8b95a1', fontSize: 19, fontFamily: MONO }}>
                <span style={{ color: C.goldSoft }}>●</span>{l.text}
              </div>
            );
          }
          if (l.kind === 'ok') {
            return (
              <div key={i} style={{ ...st, display: 'flex', gap: 10, alignItems: 'center', color: '#7ee2a8', fontSize: 22, fontWeight: 600 }}>
                <span>✓</span>{l.text}
              </div>
            );
          }
          if (l.kind === 'block') return <div key={i} style={st}>{l.node}</div>;
          return (
            <div key={i} style={{ ...st, display: 'flex', gap: 10, color: '#e6e6ea', fontSize: 22, lineHeight: 1.5, wordBreak: 'keep-all' }}>
              <span style={{ color: '#e6e6ea' }}>⏺</span><span>{l.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** 대화 창 안의 «초안·미리보기» 카드 */
export function DraftCard({ label, rows, ask }: { label: string; rows: [string, string][]; ask?: string }) {
  return (
    <div style={{ border: `1.5px solid ${C.goldSoft}`, borderRadius: 12, padding: '14px 18px', background: 'rgba(95,211,189,.07)' }}>
      <div style={{ color: C.goldSoft, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{label}</div>
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: 'flex', gap: 14, fontSize: 21, lineHeight: 1.5, color: '#e6e6ea' }}>
          <span style={{ color: '#8b95a1', width: 92, flexShrink: 0 }}>{k}</span><span style={{ wordBreak: 'keep-all' }}>{v}</span>
        </div>
      ))}
      {ask && <div style={{ marginTop: 10, color: '#ffd479', fontSize: 21, fontWeight: 700 }}>{ask}</div>}
    </div>
  );
}

/** 오른쪽 여백의 «재구성 화면» 표기 */
export function Recon({ style }: { style?: CSSProperties }) {
  return <span style={{ position: 'absolute', fontSize: 16, color: C.faint, ...style }}>예시 대화 · 실제 화면을 단순화해 다시 그림</span>;
}

/** 0→1 (at에서 dur 동안) */
export const fade = (t: number, at: number, dur = 0.4) => interpolate(t, [at, at + dur], [0, 1]);
