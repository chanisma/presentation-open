import type { CSSProperties } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Reveal from '../deck/Reveal';

/* A realistic terminal window — the signature visual for a CLI deck. Renders a
   titled window (traffic lights + mono title) over dark-surface lines: shell
   commands ($ prefix, accent), plain output, ✓ ok lines, # comments, the user's
   natural-language request (› chevron), and the agent's reply (● dot). An
   optional blinking cursor sits at the end of the last `cursor` line. Token-
   driven and dependency-free (framer-motion only, already in the deck).

   <Terminal title="zsh — claude" lines={[
     { type: 'cmd', text: 'claude' },
     { type: 'you', text: '우리 반 세특 초안부터 잡아줘', cursor: true },
   ]} /> */
export type TermLine = {
  type?: 'cmd' | 'out' | 'ok' | 'comment' | 'you' | 'ai';
  text: string;
  /** show a blinking block cursor after this line (for a "still typing" beat) */
  cursor?: boolean;
};

const Cursor = () => {
  const reduce = useReducedMotion();
  return (
    <motion.span
      aria-hidden
      style={{
        display: 'inline-block',
        width: '0.6em',
        height: '1.05em',
        marginLeft: 3,
        transform: 'translateY(0.16em)',
        background: 'var(--primary)',
        borderRadius: 1,
      }}
      animate={reduce ? undefined : { opacity: [1, 1, 0, 0] }}
      transition={{ duration: 1.05, repeat: Infinity, times: [0, 0.5, 0.5, 1] }}
    />
  );
};

const gutter: Record<NonNullable<TermLine['type']>, string> = {
  cmd: 'var(--primary)',
  out: 'var(--fg-muted)',
  ok: 'var(--primary)',
  comment: 'var(--fg-faint)',
  you: 'var(--primary)',
  ai: 'var(--fg)',
};

function Prefix({
  type,
  prompt,
}: {
  type: NonNullable<TermLine['type']>;
  prompt?: string;
}) {
  const style: CSSProperties = {
    color: gutter[type],
    flexShrink: 0,
    userSelect: 'none',
    fontWeight: 600,
  };
  /* cmd는 기본 무프롬프트 — 초심자가 $·>까지 입력하는 것으로 오해한다.
     셸 분위기가 필요한 덱만 prompt="$" 등으로 명시 복원 */
  if (type === 'cmd')
    return prompt ? (
      <span style={style}>{prompt}&nbsp;</span>
    ) : (
      <span style={{ ...style, opacity: 0 }}>&nbsp;&nbsp;</span>
    );
  if (type === 'you') return <span style={style}>›&nbsp;</span>;
  if (type === 'ai') return <span style={style}>●&nbsp;</span>;
  if (type === 'ok') return <span style={style}>✓&nbsp;</span>;
  if (type === 'comment') return <span style={style}>#&nbsp;</span>;
  return <span style={{ ...style, opacity: 0 }}>&nbsp;&nbsp;</span>;
}

export default function Terminal({
  title = 'zsh',
  lines,
  maxWidth = 620,
  prompt,
}: {
  title?: string;
  lines: TermLine[];
  maxWidth?: number;
  /** cmd 라인 앞 프롬프트 기호 — 기본 없음(초심자 오입력 방지), 예: "$" */
  prompt?: string;
}) {
  return (
    <Reveal
      className="lift"
      style={{
        width: '100%',
        maxWidth,
        marginInline: 'auto',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        background: 'var(--bg)',
        border: '1px solid var(--hair)',
        boxShadow:
          'var(--shadow), inset 0 1px 0 color-mix(in srgb, var(--fg) 6%, transparent)',
      }}
    >
      {/* title bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '11px 16px',
          background: 'var(--surface-2)',
          borderBottom: '1px solid var(--hair-2)',
        }}
      >
        <span style={{ display: 'flex', gap: 7 }}>
          <i style={dot} />
          <i style={dot} />
          <i style={dot} />
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12.5,
            color: 'var(--fg-faint)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {title}
        </span>
      </div>
      {/* body */}
      <div
        style={{
          padding: 'clamp(14px, 1.8vw, 20px)',
          overflowX: 'auto',
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(12px, 1.35vw, 14.5px)',
          lineHeight: 1.85,
          textAlign: 'left',
        }}
      >
        {lines.map((ln, i) => {
          const type = ln.type ?? 'out';
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                whiteSpace: 'pre',
                color: type === 'out' || type === 'ok' ? 'var(--fg-muted)' : 'var(--fg)',
                fontStyle: type === 'comment' ? 'italic' : 'normal',
                opacity: type === 'comment' ? 0.85 : 1,
                fontWeight: type === 'cmd' ? 650 : 400,
              }}
            >
              <Prefix type={type} prompt={prompt} />
              <span
                style={{
                  color:
                    type === 'comment'
                      ? 'var(--fg-faint)'
                      : type === 'out'
                      ? 'var(--fg-muted)'
                      : 'var(--fg)',
                }}
              >
                {ln.text}
              </span>
              {ln.cursor && <Cursor />}
            </div>
          );
        })}
      </div>
    </Reveal>
  );
}

const dot: CSSProperties = {
  width: 11,
  height: 11,
  borderRadius: '50%',
  background: 'var(--hair)',
  display: 'inline-block',
};
