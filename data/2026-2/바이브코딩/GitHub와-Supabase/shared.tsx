import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';

/* ── 공통 헬퍼 — 「내 폴더에서 세상으로 — GitHub · Supabase · MCP」 덱 ──────────
   1920×1080 설계 박스를 Fit으로 통째로 배율 변환한다(덱 고정비율 규약).
   모든 슬라이드는 abs(x, y, w, h) px 좌표로 배치한다.
   색의 뜻 고정: 보라(violet) = 코드와 그 기록이 가는 곳(GitHub),
   청록(teal) = 데이터가 가는 곳(Supabase), 주황빨강(warn) = 절대 올리면 안 되는 것. */

export const DW = 1920;
export const DH = 1080;
export const BASE = 'data/2026-2/바이브코딩/GitHub와-Supabase';
export const SVG = 'assets/svg';

export const COLLAB = 'https://spacekijun.lovable.app/collab/28fa5003-3201-4d6f-aea9-eda51c1f6489';
export const DECK11 = 'https://2026kijunit.netlify.app/index.html?deck=vibe-github-supabase#11';

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
        <Rules />
        {children}
      </div>
    </div>
  );
}

/* 작업 일지 괘선 — 배경 전용, 아주 옅게 */
function Rules() {
  return (
    <svg width={DW} height={DH} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden>
      <defs>
        <pattern id="gs-rule" width="1920" height="48" patternUnits="userSpaceOnUse">
          <path d="M0 47.5 L1920 47.5" stroke="#1f2430" strokeWidth="1" opacity="0.035" />
        </pattern>
      </defs>
      <rect width={DW} height={DH} fill="url(#gs-rule)" />
      <path d="M86 0 L86 1080" stroke="#e0573b" strokeWidth="1.2" opacity="0.10" />
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
  ink: '#1f2430',
  violet: '#6c4cf0',
  violetSoft: '#b9a8fa',
  teal: '#1f9e7a',
  tealSoft: '#9fd8c5',
  warn: '#e0573b',
  gold: '#c9a24a',
  paper: '#fbf7ee',
  cream: '#f4efe6',
  sand: '#e6d6b8',
  sky: '#cfe3ef',
  mute: '#6b6f7a',
  faint: '#a7a39a',
  white: '#ffffff',
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
  color: 'var(--fg)',
};
export const h2: CSSProperties = { ...h1, fontSize: 52 };
export const h3: CSSProperties = { ...h1, fontSize: 32, letterSpacing: '-0.02em' };
export const body: CSSProperties = { fontSize: 24, lineHeight: 1.5, color: 'var(--fg-muted)', wordBreak: 'keep-all' };
export const small: CSSProperties = { fontSize: 19, lineHeight: 1.45, color: 'var(--fg-muted)', wordBreak: 'keep-all' };
export const mono: CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };
export const solid: CSSProperties = {
  background: '#fffdf8',
  border: '1.5px solid var(--hair)',
  borderRadius: 18,
  boxShadow: '0 18px 40px -26px rgba(31,36,48,0.45)',
};

/* 슬라이드 상단 헤더 (킥커 + 헤드라인) */
export function Header({ x = 140, y = 70, w = 1100, kicker, title, size = 52 }: { x?: number; y?: number; w?: number; kicker: string; title: ReactNode; size?: number }) {
  return (
    <div style={{ ...abs(x, y, w) }}>
      <div style={kick}>{kicker}</div>
      <h2 style={{ ...h2, fontSize: size, marginTop: 10 }}>{title}</h2>
    </div>
  );
}

/* 정식 용어 칩 — 용어 + 한 줄 풀이 */
export function Term({ term, gloss, color = C.violet, style }: { term: ReactNode; gloss: ReactNode; color?: string; style?: CSSProperties }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, padding: '12px 20px', borderRadius: 14, border: `1.5px solid color-mix(in srgb, ${color} 55%, transparent)`, background: `color-mix(in srgb, ${color} 9%, #fffdf8)`, ...style }}>
      <b style={{ color, fontSize: 24, fontWeight: 800, whiteSpace: 'nowrap' }}>{term}</b>
      <span style={{ ...small, fontSize: 19, color: 'var(--fg-muted)' }}>{gloss}</span>
    </div>
  );
}

/* 작은 라벨 칩 */
export function Chip({ children, color = C.violet, solidFill = false, size = 19, style }: { children: ReactNode; color?: string; solidFill?: boolean; size?: number; style?: CSSProperties }) {
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
        color: solidFill ? C.white : color,
        background: solidFill ? color : `color-mix(in srgb, ${color} 11%, #fffdf8)`,
        border: `1.5px solid color-mix(in srgb, ${color} 60%, transparent)`,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function Code({ children, size = 20, color = C.violet }: { children: ReactNode; size?: number; color?: string }) {
  return (
    <code
      style={{
        ...mono,
        fontSize: size,
        fontWeight: 700,
        color,
        background: 'color-mix(in srgb, var(--fg) 6%, transparent)',
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

export function LinkButton({ href, children, size = 22, color = C.violet, style }: { href: string; children: ReactNode; size?: number; color?: string; style?: CSSProperties }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        padding: `${size * 0.5}px ${size * 1.1}px`,
        borderRadius: 999,
        background: color,
        color: C.white,
        fontWeight: 800,
        fontSize: size,
        textDecoration: 'underline',
        textDecorationThickness: 2,
        textUnderlineOffset: 4,
        wordBreak: 'keep-all',
        ...style,
      }}
    >
      {children}
    </a>
  );
}

/* 덱이 덧붙인 설명 풍선 — 실제 화면이 아니라는 표시로 점선 테두리 */
export function Note({ children, color = C.violet, style }: { children: ReactNode; color?: string; style?: CSSProperties }) {
  return (
    <div style={{ padding: '10px 16px', borderRadius: 12, border: `2px dashed ${color}`, background: `color-mix(in srgb, ${color} 8%, #fffdf8)`, color, fontSize: 19, fontWeight: 700, lineHeight: 1.4, wordBreak: 'keep-all', ...style }}>
      {children}
    </div>
  );
}

/* 직선 화살표 — 가장자리 좌표를 받아 방향 벡터로 머리를 회전 */
export function Arrow({ x1, y1, x2, y2, color = C.violet, width = 3, dashed = false, head = 14, progress = 1, opacity = 1 }: { x1: number; y1: number; x2: number; y2: number; color?: string; width?: number; dashed?: boolean; head?: number; progress?: number; opacity?: number }) {
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

/* 구름 — GitHub(원격) 자리. 순수 도형 */
export function Cloud({ w = 420, color = C.violet, fill = '#fffdf8', children, style }: { w?: number; color?: string; fill?: string; children?: ReactNode; style?: CSSProperties }) {
  const h = w * 0.56;
  return (
    <div style={{ position: 'relative', width: w, height: h, ...style }}>
      <svg width={w} height={h} viewBox="0 0 420 236" style={{ position: 'absolute', inset: 0 }} aria-hidden>
        <path
          d="M96 222 C44 222 14 190 14 152 C14 116 42 90 78 88 C84 46 120 16 166 16 C204 16 236 36 250 66 C262 58 278 54 294 54 C340 54 376 88 380 132 C398 140 408 158 408 178 C408 204 386 222 358 222 Z"
          fill={fill}
          stroke={color}
          strokeWidth="3.4"
          strokeLinejoin="round"
        />
      </svg>
      <div style={{ position: 'absolute', left: '12%', right: '8%', top: '30%', bottom: '8%', display: 'grid', placeItems: 'center' }}>{children}</div>
    </div>
  );
}

/* 노트북 윤곽 — 로컬(내 컴퓨터) 자리 */
export function Laptop({ w = 360, color = C.ink, children, style }: { w?: number; color?: string; children?: ReactNode; style?: CSSProperties }) {
  const h = w * 0.62;
  return (
    <div style={{ position: 'relative', width: w, height: h + 22, ...style }}>
      <div style={{ position: 'absolute', left: w * 0.08, right: w * 0.08, top: 0, height: h, borderRadius: 14, border: `3px solid ${color}`, background: '#fffdf8', padding: 12, boxSizing: 'border-box' }}>
        <div style={{ width: '100%', height: '100%', borderRadius: 8, background: 'color-mix(in srgb, #1f2430 5%, #fffdf8)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>{children}</div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: h - 2, height: 20, borderRadius: '4px 4px 14px 14px', border: `3px solid ${color}`, background: C.sand }} />
    </div>
  );
}

/* 휴대폰 윤곽 */
export function Phone({ w = 240, h = 440, color = C.ink, children, style, url }: { w?: number; h?: number; color?: string; children?: ReactNode; style?: CSSProperties; url?: string }) {
  return (
    <div style={{ width: w, height: h, borderRadius: 34, border: `3px solid ${color}`, padding: '30px 12px 22px', boxSizing: 'border-box', background: '#fffdf8', position: 'relative', boxShadow: '0 24px 50px -30px rgba(31,36,48,.6)', ...style }}>
      <i style={{ position: 'absolute', top: 12, left: '50%', width: 54, height: 7, marginLeft: -27, borderRadius: 4, background: 'color-mix(in srgb, #1f2430 30%, transparent)' }} />
      <div style={{ width: '100%', height: '100%', borderRadius: 16, border: '1.5px solid var(--hair)', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {url && <div style={{ ...mono, fontSize: 12, padding: '6px 8px', background: 'color-mix(in srgb, #1f2430 6%, #fffdf8)', color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', borderBottom: '1px solid var(--hair-2)' }}>{url}</div>}
        <div style={{ flex: 1, position: 'relative' }}>{children}</div>
      </div>
    </div>
  );
}

/* 지난 수업의 첫 웹 페이지를 흉내 낸 작은 페이지 (진열창·폰·브라우저 안에 들어간다) */
export function MiniPage({ scale = 1, guest }: { scale?: number; guest?: ReactNode }) {
  const s = (n: number) => n * scale;
  return (
    <div style={{ width: '100%', height: '100%', background: '#fff8ec', padding: s(14), boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: s(10) }}>
      <div style={{ height: s(14), width: '60%', borderRadius: s(4), background: C.violet }} />
      <div style={{ height: s(8), width: '85%', borderRadius: s(4), background: '#d9cfbd' }} />
      <div style={{ height: s(8), width: '70%', borderRadius: s(4), background: '#d9cfbd' }} />
      <div style={{ display: 'flex', gap: s(8), marginTop: s(4) }}>
        <div style={{ width: s(54), height: s(22), borderRadius: s(8), background: '#ff9a6b' }} />
        <div style={{ width: s(54), height: s(22), borderRadius: s(8), background: C.tealSoft }} />
      </div>
      {guest}
    </div>
  );
}

/* 커밋 점 — 보라 원 + 메시지 */
export function CommitDot({ r = 16, color = C.violet, filled = true }: { r?: number; color?: string; filled?: boolean }) {
  return <span style={{ display: 'inline-block', width: r * 2, height: r * 2, borderRadius: '50%', border: `4px solid ${color}`, background: filled ? color : '#fffdf8', boxSizing: 'border-box' }} />;
}

/* 워드마크 — 브랜드 로고 대신 타이포 */
export function Mark({ children, color = C.ink, size = 30, style }: { children: ReactNode; color?: string; size?: number; style?: CSSProperties }) {
  return <span style={{ fontFamily: 'var(--font-head)', fontWeight: 900, letterSpacing: '-0.02em', fontSize: size, color, ...style }}>{children}</span>;
}

/* 다마고찌 펫 도트 그림 (웹의 구조와 설계도 덱과 같은 세트) */
export function Pet({ px = 5, style }: { px?: number; style?: CSSProperties }) {
  return <img src={`${BASE}/images/pet/baby-idle.png`} alt="" aria-hidden width={23 * px} height={19 * px} style={{ imageRendering: 'pixelated', display: 'block', ...style }} />;
}

/* 복사 버튼 — 실제 클립보드에 문장을 넣는다 */
export function CopyButton({ text, label = '복사', size = 17, color = C.violet }: { text: string; label?: string; size?: number; color?: string }) {
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
        border: 'none',
        borderRadius: 999,
        padding: `${size * 0.45}px ${size * 1.1}px`,
        fontSize: size,
        fontWeight: 800,
        fontFamily: 'inherit',
        background: state === 'ok' ? C.teal : state === 'fail' ? C.warn : color,
        color: C.white,
        whiteSpace: 'nowrap',
      }}
    >
      {state === 'ok' ? '복사됨 ✓' : state === 'fail' ? '직접 선택해 복사' : label}
    </button>
  );
}

/* QR + 클릭 링크 묶음 */
export function QrLink({ img, title, href, btn, size = 230, color = C.violet }: { img: string; title: string; href: string; btn: string; size?: number; color?: string }) {
  return (
    <div style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
      <div style={{ width: size, height: size, padding: 10, borderRadius: 16, background: C.white, border: `2px solid ${color}`, flexShrink: 0 }}>
        <img src={img} alt={`${title} QR`} style={{ width: '100%', height: '100%', display: 'block', imageRendering: 'pixelated' }} />
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, wordBreak: 'keep-all' }}>{title}</div>
        <div style={{ marginTop: 16 }}>
          <LinkButton href={href} size={19} color={color}>{btn}</LinkButton>
        </div>
      </div>
    </div>
  );
}
