import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { useDeck } from '../../../../src/deck/DeckContext';

/* ── 공통 헬퍼 — 「첫 1초부터 마지막 장면까지 — 쇼츠 대본 쓰기」 덱 ──────────
   1920×1080 설계 박스를 Fit으로 통째로 배율 변환한다(덱 고정비율 규약).
   색의 뜻 고정(밤의 편집실): 대본 네 줄 = 말 앰버 · 화면 청록 · 자막 흰 테두리 · 소리 보라, 삭제·경고 = 코랄.
   대비 규칙(plan.md 테마): 줄 색은 띠·틴트로만 쓰고 글씨는 항상 밝은 글자색. */

export const DW = 1920;
export const DH = 1080;
export const BASE = 'data/2026-2/AI쇼츠제작/쇼츠-대본-쓰기';
export const SVG = 'assets/svg';
export const COLLAB = 'https://spacekijun.lovable.app/collab';

export function Fit({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      if (r.width && r.height) setK(Math.min(r.width / DW, r.height / DH));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: DW,
          height: DH,
          transform: `translate(-50%, -50%) scale(${k})`,
          transformOrigin: 'center',
          overflow: 'hidden',
        }}
      >
        <Scanlines />
        {children}
      </div>
    </div>
  );
}

/* 편집실 모니터의 아주 옅은 가로 주사선 — 배경 전용 */
function Scanlines() {
  return (
    <svg width={DW} height={DH} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden>
      <defs>
        <pattern id="sc-line" width="1920" height="6" patternUnits="userSpaceOnUse">
          <path d="M0 5.5 L1920 5.5" stroke="#ffffff" strokeWidth="1" opacity="0.018" />
        </pattern>
      </defs>
      <rect width={DW} height={DH} fill="url(#sc-line)" />
    </svg>
  );
}

/* 폭·높이는 넘긴 경우에만 넣는다 — 다른 컴포넌트의 width를 undefined로 덮지 않도록 */
export const abs = (x: number, y: number, w?: number, h?: number): CSSProperties => ({
  position: 'absolute',
  left: x,
  top: y,
  ...(w !== undefined ? { width: w } : {}),
  ...(h !== undefined ? { height: h } : {}),
});

/* 클릭 단계가 있는 장면: 단계 수를 등록하고 현재 단계를 돌려준다(썸네일은 끝 상태) */
export function useClicks(max: number) {
  const { clicks, isStatic, registerMax } = useDeck();
  useEffect(() => {
    registerMax?.(max);
  }, [max, registerMax]);
  return isStatic ? max : clicks;
}

export const C = {
  bg: '#141826',
  panel: '#1d2234',
  panel2: '#252b40',
  fg: '#eef0f6',
  mute: '#a5abc0',
  faint: '#6d7390',
  line: 'rgba(238,240,246,0.14)',
  coral: '#ff7a66',
  paper: '#f3ede1',
  ink: '#10131d',
  white: '#ffffff',
};

/* 대본의 네 줄 — 순서·색·정식 용어 고정 */
export type LaneKey = 'say' | 'see' | 'cap' | 'sound';
export const LANE: Record<LaneKey, { ko: string; color: string }> = {
  say: { ko: '말', color: '#f2b24a' },
  see: { ko: '화면', color: '#4cc3b0' },
  cap: { ko: '자막', color: '#eef0f6' },
  sound: { ko: '소리', color: '#a98bf0' },
};
export const LANES: LaneKey[] = ['say', 'see', 'cap', 'sound'];

export const kick: CSSProperties = { fontSize: 17, fontWeight: 800, letterSpacing: '0.16em', color: C.mute };
export const h1: CSSProperties = {
  fontFamily: 'var(--font-head)',
  fontWeight: 800,
  letterSpacing: '-0.03em',
  lineHeight: 1.12,
  fontSize: 62,
  wordBreak: 'keep-all',
  margin: 0,
  color: C.fg,
};
export const body: CSSProperties = { fontSize: 25, lineHeight: 1.5, color: C.fg, wordBreak: 'keep-all' };
export const small: CSSProperties = { fontSize: 19, lineHeight: 1.45, color: C.mute, wordBreak: 'keep-all' };
export const mono: CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };
export const panel: CSSProperties = {
  background: C.panel,
  border: `1.5px solid ${C.line}`,
  borderRadius: 16,
  boxShadow: '0 24px 50px -30px rgba(0,0,0,0.8)',
};

export function Header({ x = 120, y = 64, w = 1300, kicker, title, size = 54 }: { x?: number; y?: number; w?: number; kicker: string; title: ReactNode; size?: number }) {
  return (
    <div style={{ ...abs(x, y, w) }}>
      <div style={kick}>{kicker}</div>
      <h2 style={{ ...h1, fontSize: size, marginTop: 10 }}>{title}</h2>
    </div>
  );
}

/* 정식 용어 칩 — 용어 + 한 줄 풀이 */
export function Term({ term, gloss, color = '#f2b24a', style }: { term: ReactNode; gloss: ReactNode; color?: string; style?: CSSProperties }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, padding: '11px 18px', borderRadius: 12, borderLeft: `6px solid ${color}`, background: `color-mix(in srgb, ${color} 12%, ${C.panel})`, ...style }}>
      <b style={{ color: C.fg, fontSize: 24, fontWeight: 800, whiteSpace: 'nowrap' }}>{term}</b>
      <span style={{ ...small, fontSize: 19 }}>{gloss}</span>
    </div>
  );
}

export function Chip({ children, color = C.mute, size = 19, strong = false, style }: { children: ReactNode; color?: string; size?: number; strong?: boolean; style?: CSSProperties }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '5px 14px',
        borderRadius: 999,
        fontSize: size,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        color: strong ? C.ink : C.fg,
        background: strong ? color : `color-mix(in srgb, ${color} 16%, ${C.panel})`,
        border: `1.5px solid color-mix(in srgb, ${color} 65%, transparent)`,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/* 덱이 덧붙인 설명 — 점선 테두리 */
export function Note({ children, color = C.mute, style }: { children: ReactNode; color?: string; style?: CSSProperties }) {
  return (
    <div style={{ padding: '10px 16px', borderRadius: 12, border: `2px dashed ${color}`, background: `color-mix(in srgb, ${color} 9%, ${C.bg})`, color: C.fg, fontSize: 19, fontWeight: 700, lineHeight: 1.4, wordBreak: 'keep-all', ...style }}>
      {children}
    </div>
  );
}

export function LinkButton({ href, children, size = 21, color = '#f2b24a', style }: { href: string; children: ReactNode; size?: number; color?: string; style?: CSSProperties }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: `${size * 0.5}px ${size * 1.1}px`,
        borderRadius: 999,
        background: color,
        color: C.ink,
        fontWeight: 800,
        fontSize: size,
        textDecoration: 'underline',
        textDecorationThickness: 2,
        textUnderlineOffset: 4,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </a>
  );
}

/* 직선 화살표 — 가장자리 좌표를 받아 방향 벡터로 머리를 회전 */
export function Arrow({ x1, y1, x2, y2, color = C.mute, width = 3, dashed = false, head = 14, opacity = 1 }: { x1: number; y1: number; x2: number; y2: number; color?: string; width?: number; dashed?: boolean; head?: number; opacity?: number }) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const hx1 = x2 - head * Math.cos(ang - 0.45);
  const hy1 = y2 - head * Math.sin(ang - 0.45);
  const hx2 = x2 - head * Math.cos(ang + 0.45);
  const hy2 = y2 - head * Math.sin(ang + 0.45);
  return (
    <svg width={DW} height={DH} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', overflow: 'visible', opacity }} aria-hidden>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={dashed ? '10 10' : undefined} />
      <path d={`M${hx1} ${hy1} L${x2} ${y2} L${hx2} ${hy2}`} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* 코드 창 + 복사 버튼 (카드) */
export function CopyBox({ title, text, w, size = 19, color = '#f2b24a', style }: { title: ReactNode; text: string; w: number; size?: number; color?: string; style?: CSSProperties }) {
  return (
    <div style={{ width: w, ...panel, overflow: 'hidden', display: 'flex', flexDirection: 'column', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: color, color: C.ink }}>
        <b style={{ fontSize: 20 }}>{title}</b>
        <CopyButton text={text} />
      </div>
      <pre style={{ ...mono, margin: 0, padding: '16px 20px', fontSize: size, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'keep-all', color: C.fg }}>{text}</pre>
    </div>
  );
}

export function CopyButton({ text, label = '복사', size = 17 }: { text: string; label?: string; size?: number }) {
  const [state, setState] = useState<'idle' | 'ok' | 'fail'>('idle');
  const onCopy = async (e: MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setState('ok');
    } catch {
      setState('fail');
    }
    window.setTimeout(() => setState('idle'), 1400);
  };
  return (
    <button
      type="button"
      onClick={onCopy}
      onKeyDown={(e) => e.stopPropagation()}
      style={{
        cursor: 'pointer',
        border: `2px solid ${C.ink}`,
        borderRadius: 999,
        padding: `${size * 0.4}px ${size * 1.1}px`,
        fontSize: size,
        fontWeight: 800,
        fontFamily: 'inherit',
        background: state === 'ok' ? '#4cc3b0' : state === 'fail' ? C.coral : C.ink,
        color: state === 'idle' ? C.fg : C.ink,
        whiteSpace: 'nowrap',
      }}
    >
      {state === 'ok' ? '복사됨 ✓' : state === 'fail' ? '직접 선택해 복사' : label}
    </button>
  );
}

/* 세로 폰 프레임 (9:16 화면 + 테두리) */
export function Phone({ h, children, style }: { h: number; children?: ReactNode; style?: CSSProperties }) {
  const w = (h * 9) / 16;
  return (
    <div style={{ width: w + 24, height: h + 24, borderRadius: 34, padding: 12, boxSizing: 'border-box', background: '#0b0d15', border: `2px solid ${C.line}`, boxShadow: '0 30px 60px -30px rgba(0,0,0,.9)', ...style }}>
      <div style={{ width: w, height: h, borderRadius: 24, overflow: 'hidden', position: 'relative', background: '#202638' }}>{children}</div>
    </div>
  );
}

/* 클래퍼보드 — 몸판 + 위 막대(경첩 회전). 어두운 배경에서는 밝은 판(plate) 위에 올린다 */
export function Clapper({ x, y, w, angle, children }: { x: number; y: number; w: number; angle: number; children?: ReactNode }) {
  const k = w / 320;
  return (
    <div style={{ ...abs(x, y, w, (240 + 24) * k) }}>
      <img src={`${SVG}/clapper-slate.svg`} alt="클래퍼보드" style={{ ...abs(0, 24 * k, w) }} />
      <img src={`${SVG}/clapper-stick.svg`} alt="" aria-hidden style={{ ...abs(0, 24 * k + (8 - 28) * k, w), transformOrigin: '6.25% 87.5%', transform: `rotate(${angle}deg)` }} />
      <div style={{ ...abs(0, 24 * k, w, 240 * k) }}>{children}</div>
    </div>
  );
}
