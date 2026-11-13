import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { useDeck } from '../../../../src/deck/DeckContext';

/* ── 공통 헬퍼 — 「한 숏을 설계하다 — 장면 카드에서 프롬프트까지」 덱 ──────────
   1920×1080 설계 박스를 Fit으로 통째로 배율 변환한다(덱 고정비율 규약).
   모든 슬라이드는 abs(x, y, w, h) px 좌표로 배치한다.
   색의 뜻 고정: 장면 카드 다섯 칸 = 피사체 코랄 · 동작 앰버 · 배경 청록 · 공간 구도 인디고 · 카메라 보라,
   영상 밖(오버레이) = 회색 점선. 대비 규칙(plan.md 테마): 칸 색은 띠·연한 틴트로만 쓰고 글씨는 항상 잉크. */

export const DW = 1920;
export const DH = 1080;
export const BASE = 'data/2026-2/AI쇼츠제작/장면-설계와-프롬프트';
export const SVG = 'assets/svg';
export const STILL = 'data/2026-2/AI쇼츠제작/오리엔테이션/images/stage-04.png';
export const COLLAB = 'https://spacekijun.lovable.app/collab';
export const HIGGS = 'https://higgsfield.ai';

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
        <Paper />
        {children}
      </div>
    </div>
  );
}

/* 콘티 종이 — 아주 옅은 모눈. 배경 전용 */
function Paper() {
  return (
    <svg width={DW} height={DH} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden>
      <defs>
        <pattern id="sd-grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M60 0 L0 0 L0 60" fill="none" stroke="#1d1b22" strokeWidth="1" opacity="0.035" />
        </pattern>
      </defs>
      <rect width={DW} height={DH} fill="url(#sd-grid)" />
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

/* 팔레트 */
export const C = {
  ink: '#1d1b22',
  slate: '#24222b',
  chalk: '#f3ede1',
  paper: '#fbf8f1',
  card: '#fffdf8',
  mute: '#5f5b66',
  faint: '#9a958c',
  white: '#ffffff',
  rain: '#7f93a6',
  umbrella: '#f2c230',
  hoodie: '#2f3b63',
  red: '#d2412f',
};

/* 장면 카드의 칸 — 순서·색·정식 용어 고정 */
export type AspectKey = 'intent' | 'subject' | 'motion' | 'scene' | 'space' | 'camera' | 'outside';
export const ASPECT: Record<AspectKey, { ko: string; en: string; color: string }> = {
  intent: { ko: '숏 의도', en: 'shot intent', color: '#24222b' },
  subject: { ko: '피사체', en: 'Subject', color: '#e2553f' },
  motion: { ko: '동작', en: 'Subject Motion', color: '#d98a12' },
  scene: { ko: '배경', en: 'Scene', color: '#2f8f7f' },
  space: { ko: '공간 구도', en: 'Spatial Framing', color: '#4a5bd4' },
  camera: { ko: '카메라', en: 'Camera', color: '#8a4fd0' },
  outside: { ko: '영상 밖', en: 'overlay', color: '#8b8794' },
};
export const ORDER: AspectKey[] = ['intent', 'subject', 'motion', 'scene', 'space', 'camera', 'outside'];

export const kick: CSSProperties = {
  fontSize: 17,
  fontWeight: 800,
  letterSpacing: '0.16em',
  color: C.mute,
};
export const h1: CSSProperties = {
  fontFamily: 'var(--font-head)',
  fontWeight: 800,
  letterSpacing: '-0.03em',
  lineHeight: 1.12,
  fontSize: 62,
  wordBreak: 'keep-all',
  margin: 0,
  color: C.ink,
};
export const body: CSSProperties = { fontSize: 25, lineHeight: 1.5, color: C.ink, wordBreak: 'keep-all' };
export const small: CSSProperties = { fontSize: 19, lineHeight: 1.45, color: C.mute, wordBreak: 'keep-all' };
export const mono: CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };
export const solid: CSSProperties = {
  background: C.card,
  border: '1.5px solid rgba(29,27,34,0.16)',
  borderRadius: 16,
  boxShadow: '0 18px 40px -26px rgba(29,27,34,0.45)',
};

/* 슬라이드 상단 헤더 (킥커 + 헤드라인) */
export function Header({ x = 120, y = 64, w = 1240, kicker, title, size = 54 }: { x?: number; y?: number; w?: number; kicker: string; title: ReactNode; size?: number }) {
  return (
    <div style={{ ...abs(x, y, w) }}>
      <div style={kick}>{kicker}</div>
      <h2 style={{ ...h1, fontSize: size, marginTop: 10 }}>{title}</h2>
    </div>
  );
}

/* 정식 용어 칩 — 용어 + 한 줄 풀이 (색은 테두리·틴트로만) */
export function Term({ term, gloss, color = C.slate, style }: { term: ReactNode; gloss: ReactNode; color?: string; style?: CSSProperties }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, padding: '11px 18px', borderRadius: 12, borderLeft: `6px solid ${color}`, background: `color-mix(in srgb, ${color} 12%, ${C.card})`, ...style }}>
      <b style={{ color: C.ink, fontSize: 24, fontWeight: 800, whiteSpace: 'nowrap' }}>{term}</b>
      <span style={{ ...small, fontSize: 19 }}>{gloss}</span>
    </div>
  );
}

/* 작은 라벨 칩 */
export function Chip({ children, color = C.slate, size = 19, strong = false, style }: { children: ReactNode; color?: string; size?: number; strong?: boolean; style?: CSSProperties }) {
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
        color: strong ? C.white : C.ink,
        background: strong ? color : `color-mix(in srgb, ${color} 14%, ${C.card})`,
        border: `1.5px solid color-mix(in srgb, ${color} 65%, transparent)`,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/* 덱이 덧붙인 설명 — 실제 화면이 아니라는 표시로 점선 테두리 */
export function Note({ children, color = C.slate, style }: { children: ReactNode; color?: string; style?: CSSProperties }) {
  return (
    <div style={{ padding: '10px 16px', borderRadius: 12, border: `2px dashed ${color}`, background: `color-mix(in srgb, ${color} 7%, ${C.card})`, color: C.ink, fontSize: 19, fontWeight: 700, lineHeight: 1.4, wordBreak: 'keep-all', ...style }}>
      {children}
    </div>
  );
}

export function LinkButton({ href, children, size = 21, color = C.slate, style }: { href: string; children: ReactNode; size?: number; color?: string; style?: CSSProperties }) {
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
        color: C.white,
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
export function Arrow({ x1, y1, x2, y2, color = C.slate, width = 3, dashed = false, head = 14, progress = 1, opacity = 1 }: { x1: number; y1: number; x2: number; y2: number; color?: string; width?: number; dashed?: boolean; head?: number; progress?: number; opacity?: number }) {
  const ex = x1 + (x2 - x1) * progress;
  const ey = y1 + (y2 - y1) * progress;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const hx1 = ex - head * Math.cos(ang - 0.45);
  const hy1 = ey - head * Math.sin(ang - 0.45);
  const hx2 = ex - head * Math.cos(ang + 0.45);
  const hy2 = ey - head * Math.sin(ang + 0.45);
  return (
    <svg width={DW} height={DH} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', overflow: 'visible', opacity }} aria-hidden>
      <line x1={x1} y1={y1} x2={ex} y2={ey} stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={dashed ? '10 10' : undefined} />
      {progress > 0.02 && <path d={`M${hx1} ${hy1} L${ex} ${ey} L${hx2} ${hy2}`} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

/* 장면 카드 — 덱 전체가 같은 양식을 쓴다(plan.md 「장면 카드」).
   values: 칸별 내용(없으면 빈 줄). lit: 불 켜진 칸(나머지는 흐리게). */
export function SceneCard({
  values = {},
  lit,
  w = 760,
  size = 21,
  keys = ORDER,
  showEn = true,
  rowGap = 8,
  marks,
  style,
}: {
  values?: Partial<Record<AspectKey, ReactNode>>;
  lit?: AspectKey[];
  w?: number;
  size?: number;
  keys?: AspectKey[];
  showEn?: boolean;
  rowGap?: number;
  marks?: Partial<Record<AspectKey, ReactNode>>;
  style?: CSSProperties;
}) {
  return (
    <div style={{ width: w, ...solid, padding: '18px 20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: rowGap, ...style }}>
      {keys.map((k) => {
        const a = ASPECT[k];
        const on = !lit || lit.includes(k);
        const outside = k === 'outside';
        const v = values[k];
        return (
          <div
            key={k}
            style={{
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start',
              padding: '9px 14px',
              borderRadius: 10,
              borderLeft: outside ? `5px dashed ${a.color}` : `6px solid ${a.color}`,
              border: outside ? `2px dashed color-mix(in srgb, ${a.color} 70%, transparent)` : undefined,
              background: on ? `color-mix(in srgb, ${a.color} ${k === 'intent' ? 8 : 13}%, ${C.card})` : C.card,
              opacity: on ? 1 : 0.38,
              transition: 'opacity .4s, background .4s',
            }}
          >
            <div style={{ width: size * 5.6, flexShrink: 0 }}>
              <div style={{ fontSize: size, fontWeight: 800, color: C.ink, whiteSpace: 'nowrap' }}>{a.ko}</div>
              {showEn && <div style={{ ...mono, fontSize: size * 0.62, color: C.mute, whiteSpace: 'nowrap' }}>{a.en}</div>}
            </div>
            <div style={{ flex: 1, fontSize: size, lineHeight: 1.4, color: C.ink, wordBreak: 'keep-all', minHeight: size * 1.4 }}>
              {v ?? <span style={{ display: 'block', height: size * 1.1, borderBottom: '2px dotted rgba(29,27,34,0.25)' }} />}
            </div>
            {marks?.[k] !== undefined && <div style={{ flexShrink: 0, fontSize: size * 1.25, fontWeight: 900, width: size * 1.6, textAlign: 'center' }}>{marks[k]}</div>}
          </div>
        );
      })}
    </div>
  );
}

/* 코드 창 + 복사 버튼 (프롬프트 카드) */
export function CopyBox({ title, text, w, h, size = 19, color = C.slate, style }: { title: ReactNode; text: string; w: number; h?: number; size?: number; color?: string; style?: CSSProperties }) {
  return (
    <div style={{ width: w, height: h, ...solid, overflow: 'hidden', display: 'flex', flexDirection: 'column', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: color, color: C.white }}>
        <b style={{ fontSize: 20 }}>{title}</b>
        <CopyButton text={text} />
      </div>
      <pre style={{ ...mono, margin: 0, padding: '16px 20px', fontSize: size, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'keep-all', color: C.ink, flex: 1, overflow: 'hidden' }}>{text}</pre>
    </div>
  );
}

/* 복사 버튼 — 실제 클립보드에 문장을 넣는다 */
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
        border: '2px solid #ffffff',
        borderRadius: 999,
        padding: `${size * 0.4}px ${size * 1.1}px`,
        fontSize: size,
        fontWeight: 800,
        fontFamily: 'inherit',
        background: state === 'ok' ? '#2f8f7f' : state === 'fail' ? C.red : C.white,
        color: state === 'idle' ? C.ink : C.white,
        whiteSpace: 'nowrap',
      }}
    >
      {state === 'ok' ? '복사됨 ✓' : state === 'fail' ? '직접 선택해 복사' : label}
    </button>
  );
}

/* 클래퍼보드 — 몸판 + 위 막대(경첩 회전). angle 0 = 닫힘. 칠판 위 글씨는 children(몸판 viewBox 좌표 × k) */
export function Clapper({ x, y, w, angle, children }: { x: number; y: number; w: number; angle: number; children?: ReactNode }) {
  const k = w / 320;
  return (
    <div style={{ ...abs(x, y, w, (240 + 24) * k) }}>
      <img src={`${SVG}/clapper-slate.svg`} alt="클래퍼보드" style={{ ...abs(0, 24 * k, w) }} />
      <img
        src={`${SVG}/clapper-stick.svg`}
        alt=""
        aria-hidden
        style={{ ...abs(0, 24 * k + (8 - 28) * k, w), transformOrigin: '6.25% 87.5%', transform: `rotate(${angle}deg)` }}
      />
      <div style={{ ...abs(0, 24 * k, w, 240 * k) }}>{children}</div>
    </div>
  );
}

/* 9:16 세로 프레임 — 쇼츠 화면 자리 */
export function Frame916({ h, children, label, style }: { h: number; children?: ReactNode; label?: ReactNode; style?: CSSProperties }) {
  const w = (h * 9) / 16;
  return (
    <div style={{ width: w, height: h, borderRadius: 18, border: `4px solid ${C.ink}`, background: '#dfe3e6', position: 'relative', overflow: 'hidden', boxShadow: '0 26px 50px -30px rgba(29,27,34,.6)', ...style }}>
      {children}
      {label && <div style={{ position: 'absolute', left: 12, top: 10, ...mono, fontSize: 15, fontWeight: 800, color: C.ink, background: 'rgba(255,253,248,.85)', padding: '2px 8px', borderRadius: 6 }}>{label}</div>}
    </div>
  );
}
