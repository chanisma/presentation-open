import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

/* ── 공통 헬퍼 — 「웹의 구조와 설계도」 덱 ─────────────────────────────
   1920×1080 설계 박스를 Fit으로 통째로 배율 변환한다(덱 고정비율 규약).
   모든 슬라이드는 abs(x, y, w, h) px 좌표로 배치한다.
   색의 뜻 고정: 하늘(sky) = 구조·에이전트가 그린 것, 코랄(coral) = 학생이 정한 것. */

export const DW = 1920;
export const DH = 1080;
export const BASE = 'data/2026-2/바이브코딩/웹의-구조와-설계도';

export function Fit({ children, grid = true }: { children: ReactNode; grid?: boolean }) {
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
        {grid && <Grid />}
        {children}
      </div>
    </div>
  );
}

/* 청사진 격자 — 배경 전용, 불투명도 0.06 */
export function Grid() {
  return (
    <svg width={DW} height={DH} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden>
      <defs>
        <pattern id="bp-grid-s" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0 L0 0 0 24" fill="none" stroke="#9cc3ff" strokeWidth="1" opacity="0.035" />
        </pattern>
        <pattern id="bp-grid-l" width="120" height="120" patternUnits="userSpaceOnUse">
          <rect width="120" height="120" fill="url(#bp-grid-s)" />
          <path d="M120 0 L0 0 0 120" fill="none" stroke="#9cc3ff" strokeWidth="1.2" opacity="0.06" />
        </pattern>
      </defs>
      <rect width={DW} height={DH} fill="url(#bp-grid-l)" />
    </svg>
  );
}

export const abs = (x: number, y: number, w?: number, h?: number): CSSProperties => ({
  position: 'absolute',
  left: x,
  top: y,
  width: w,
  height: h,
});

/* 팔레트 — 테마 변수 위에 얹는 보조색 */
export const C = {
  sky: '#9cc3ff',
  skyDeep: '#5f8fd6',
  coral: '#ff7a6b',
  coralSoft: '#ffb3a8',
  gold: '#ffd36b',
  ink: '#eaf2ff',
  navy: '#0f2747',
  deep: '#0a1a33',
  paper: '#f6efe0',
  lcd: '#d9e6f5',
  ok: '#7ee0b0',
};

export const kick: CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  letterSpacing: '0.16em',
  color: 'var(--fg-faint)',
};
export const h1: CSSProperties = {
  fontFamily: 'var(--font-head)',
  fontWeight: 800,
  letterSpacing: '-0.03em',
  lineHeight: 1.1,
  fontSize: 62,
  wordBreak: 'keep-all',
  margin: 0,
};
export const h2: CSSProperties = { ...h1, fontSize: 52 };
export const h3: CSSProperties = { ...h1, fontSize: 32, letterSpacing: '-0.02em' };
export const body: CSSProperties = { fontSize: 24, lineHeight: 1.5, color: 'var(--fg-muted)', wordBreak: 'keep-all' };
export const small: CSSProperties = { fontSize: 19, lineHeight: 1.45, color: 'var(--fg-muted)', wordBreak: 'keep-all' };
export const mono: CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };
export const card: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--hair)',
  borderRadius: 20,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
};
export const solid: CSSProperties = {
  background: 'color-mix(in srgb, var(--fg) 7%, var(--bg))',
  border: '1px solid var(--hair)',
  borderRadius: 18,
  boxShadow: 'var(--shadow)',
};

/* 슬라이드 상단 헤더 (킥커 + 헤드라인) */
export function Header({ x = 120, y = 72, w = 1100, kicker, title, size = 52 }: { x?: number; y?: number; w?: number; kicker: string; title: ReactNode; size?: number }) {
  return (
    <div style={{ ...abs(x, y, w) }}>
      <div style={kick}>{kicker}</div>
      <h2 style={{ ...h2, fontSize: size, marginTop: 10 }}>{title}</h2>
    </div>
  );
}

/* 정식 용어 칩 — 용어 + 한 줄 풀이 */
export function Term({ term, gloss, color = C.sky, style }: { term: ReactNode; gloss: ReactNode; color?: string; style?: CSSProperties }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, padding: '12px 20px', borderRadius: 14, border: `1.5px solid color-mix(in srgb, ${color} 55%, transparent)`, background: `color-mix(in srgb, ${color} 8%, transparent)`, ...style }}>
      <b style={{ color, fontSize: 24, fontWeight: 800, whiteSpace: 'nowrap' }}>{term}</b>
      <span style={{ ...small, fontSize: 19, color: 'var(--fg-muted)' }}>{gloss}</span>
    </div>
  );
}

/* 작은 라벨 칩 */
export function Chip({ children, color = C.sky, solidFill = false, size = 19, style }: { children: ReactNode; color?: string; solidFill?: boolean; size?: number; style?: CSSProperties }) {
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
        color: solidFill ? C.deep : color,
        background: solidFill ? color : `color-mix(in srgb, ${color} 12%, transparent)`,
        border: `1.5px solid color-mix(in srgb, ${color} 60%, transparent)`,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function Code({ children, size = 20, color = C.sky }: { children: ReactNode; size?: number; color?: string }) {
  return (
    <code
      style={{
        ...mono,
        fontSize: size,
        fontWeight: 700,
        color,
        background: 'color-mix(in srgb, var(--fg) 8%, transparent)',
        border: '1px solid var(--hair)',
        borderRadius: 8,
        padding: '2px 10px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </code>
  );
}

export function LinkButton({ href, children, size = 22, style }: { href: string; children: ReactNode; size?: number; style?: CSSProperties }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        padding: `${size * 0.55}px ${size * 1.2}px`,
        borderRadius: 999,
        background: 'var(--accent)',
        color: 'var(--accent-ink)',
        fontWeight: 800,
        fontSize: size,
        textDecoration: 'underline',
        textDecorationThickness: 2,
        textUnderlineOffset: 4,
        boxShadow: 'var(--glow)',
        wordBreak: 'keep-all',
        ...style,
      }}
    >
      {children}
    </a>
  );
}

/* ── 다마고찌 펫 — spacekijun 도트 그림을 정수배 확대 ── */
const PET_SIZE: Record<string, [number, number]> = {
  'egg-whole': [23, 28],
  'egg-crack': [23, 28],
  'baby-idle': [23, 19],
  'baby-eat': [23, 19],
  'baby-no': [23, 19],
  'child-happy': [28, 30],
  'adult-idle': [36, 38],
};
export type PetName = keyof typeof PET_SIZE;
export function Pet({ name, px = 6, style, alt = '' }: { name: PetName | string; px?: number; style?: CSSProperties; alt?: string }) {
  const [w, h] = PET_SIZE[name] ?? [24, 24];
  return (
    <img
      src={`${BASE}/images/pet/${name}.png`}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      width={w * px}
      height={h * px}
      style={{ imageRendering: 'pixelated', display: 'block', ...style }}
    />
  );
}

/* 하트 칸 — 다마고찌의 4칸 게이지 */
export function Hearts({ n, of = 4, size = 26, color = C.coral }: { n: number; of?: number; size?: number; color?: string }) {
  return (
    <span style={{ display: 'inline-flex', gap: 4, fontSize: size, lineHeight: 1 }}>
      {Array.from({ length: of }, (_, i) => (
        <span key={i} style={{ color: i < n ? color : 'color-mix(in srgb, var(--fg) 22%, transparent)' }}>
          {i < n ? '♥' : '♡'}
        </span>
      ))}
    </span>
  );
}

/* 직선 화살표 — 가장자리 좌표를 받아 방향 벡터로 머리를 회전 */
export function Arrow({ x1, y1, x2, y2, color = C.sky, width = 3, dashed = false, head = 14, progress = 1, opacity = 1 }: { x1: number; y1: number; x2: number; y2: number; color?: string; width?: number; dashed?: boolean; head?: number; progress?: number; opacity?: number }) {
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

/* 스탬프 — 살짝 기울여 찍힌 도장 */
export function Stamp({ children, color = C.coral, rotate = -6, size = 20, style }: { children: ReactNode; color?: string; rotate?: number; size?: number; style?: CSSProperties }) {
  return (
    <div
      style={{
        display: 'inline-block',
        padding: '6px 14px',
        borderRadius: 10,
        border: `3px solid ${color}`,
        color,
        fontWeight: 900,
        fontSize: size,
        transform: `rotate(${rotate}deg)`,
        background: 'rgba(10,26,51,0.82)',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* 미니 지도 — S9 지도의 축소판, 쓰는 부분만 하늘색으로 칠한다 (계단·④ 칸 귀퉁이) */
export function MiniMap({ level, w = 200 }: { level: 1 | 2 | 3; w?: number }) {
  const on = (b: boolean) => (b ? C.sky : 'color-mix(in srgb, var(--fg) 22%, transparent)');
  const h = w * 0.55;
  return (
    <svg width={w} height={h} viewBox="0 0 200 110" aria-hidden>
      <rect x="4" y="8" width="192" height="98" rx="10" fill="none" stroke={on(level === 3)} strokeWidth="2" strokeDasharray="6 5" />
      <rect x="18" y="26" width="34" height="62" rx="7" fill="none" stroke={on(true)} strokeWidth="2.6" />
      {level >= 2 && <rect x="26" y="66" width="18" height="12" rx="2" fill={C.sky} opacity="0.7" />}
      <path d="M58 46 L92 46 M92 68 L58 68" stroke={on(level === 3)} strokeWidth="2.2" />
      <rect x="98" y="34" width="40" height="46" rx="6" fill="none" stroke={on(level === 3)} strokeWidth="2.6" />
      <path d="M144 57 L156 57" stroke={on(level === 3)} strokeWidth="2.2" />
      <ellipse cx="174" cy="40" rx="15" ry="6" fill="none" stroke={on(level === 3)} strokeWidth="2.4" />
      <path d="M159 40 L159 72 A15 6 0 0 0 189 72 L189 40" fill="none" stroke={on(level === 3)} strokeWidth="2.4" />
    </svg>
  );
}

/* 순수 도형 서버 랙 */
export function Rack({ w = 220, units = 3, lit = -1, labels }: { w?: number; units?: number; lit?: number; labels?: string[] }) {
  return (
    <div style={{ width: w, display: 'flex', flexDirection: 'column', gap: 10, padding: 14, borderRadius: 16, border: `2px solid ${C.sky}`, background: 'color-mix(in srgb, #9cc3ff 6%, var(--bg))' }}>
      {Array.from({ length: units }, (_, i) => (
        <div key={i} style={{ height: 56, borderRadius: 10, border: `1.5px solid color-mix(in srgb, ${C.sky} 50%, transparent)`, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', background: i === lit ? `color-mix(in srgb, ${C.coral} 22%, transparent)` : 'transparent', boxShadow: i === lit ? `0 0 0 3px ${C.coral}` : 'none', transition: 'none' }}>
          <i style={{ width: 9, height: 9, borderRadius: 5, background: i === lit ? C.coral : C.ok }} />
          <span style={{ ...mono, fontSize: 18, color: i === lit ? C.ink : 'var(--fg-muted)' }}>{labels?.[i] ?? ''}</span>
        </div>
      ))}
    </div>
  );
}

/* 순수 도형 DB 원통 */
export function Cylinder({ w = 200, h = 230, color = C.sky, fill = 'transparent', children }: { w?: number; h?: number; color?: string; fill?: string; children?: ReactNode }) {
  const ry = w * 0.14;
  return (
    <div style={{ position: 'relative', width: w, height: h }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: 'absolute', inset: 0 }} aria-hidden>
        <path d={`M3 ${ry + 3} L3 ${h - ry - 3} A${w / 2 - 3} ${ry} 0 0 0 ${w - 3} ${h - ry - 3} L${w - 3} ${ry + 3}`} fill={fill} stroke={color} strokeWidth="3" />
        <ellipse cx={w / 2} cy={ry + 3} rx={w / 2 - 3} ry={ry} fill={fill === 'transparent' ? 'var(--bg)' : fill} stroke={color} strokeWidth="3" />
        <path d={`M3 ${h * 0.42} A${w / 2 - 3} ${ry} 0 0 0 ${w - 3} ${h * 0.42}`} fill="none" stroke={color} strokeWidth="2" opacity=".5" />
        <path d={`M3 ${h * 0.64} A${w / 2 - 3} ${ry} 0 0 0 ${w - 3} ${h * 0.64}`} fill="none" stroke={color} strokeWidth="2" opacity=".5" />
      </svg>
      <div style={{ position: 'absolute', left: 0, right: 0, top: ry * 2 + 10, textAlign: 'center' }}>{children}</div>
    </div>
  );
}

/* 휴대폰 윤곽 */
export function Phone({ w = 240, h = 420, color = C.sky, children, style }: { w?: number; h?: number; color?: string; children?: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ width: w, height: h, borderRadius: 34, border: `3px solid ${color}`, padding: '34px 14px 26px', boxSizing: 'border-box', background: 'color-mix(in srgb, #9cc3ff 5%, var(--bg))', position: 'relative', ...style }}>
      <i style={{ position: 'absolute', top: 14, left: '50%', width: 54, height: 7, marginLeft: -27, borderRadius: 4, background: `color-mix(in srgb, ${color} 55%, transparent)` }} />
      <div style={{ width: '100%', height: '100%', borderRadius: 16, border: `1.5px solid color-mix(in srgb, ${color} 35%, transparent)`, overflow: 'hidden', position: 'relative' }}>{children}</div>
    </div>
  );
}
