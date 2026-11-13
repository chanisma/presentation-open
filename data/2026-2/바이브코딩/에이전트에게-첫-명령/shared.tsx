import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

/* ── 공통 헬퍼 — 「에이전트에게 첫 명령」 덱 ─────────────────────────────
   1920×1080 설계 박스를 Fit으로 통째로 배율 변환한다(덱 고정비율 규약).
   모든 슬라이드는 abs(x, y, w, h) px 좌표로 배치한다. */

export const DW = 1920;
export const DH = 1080;

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
        {children}
      </div>
    </div>
  );
}

export const abs = (x: number, y: number, w?: number, h?: number): CSSProperties => ({
  position: 'absolute',
  left: x,
  top: y,
  width: w,
  height: h,
});

/* 팔레트 — 테마 변수 위에 얹는 보조색 (민트 주조, 앰버 경고, 하늘 보조) */
export const C = {
  mint: '#57f2b0',
  mintSoft: '#9af5cf',
  amber: '#ffc857',
  sky: '#7cc4ff',
  rose: '#ff6b8a',
  ink: '#e6edf3',
  navy: '#0b1220',
};

export const kick: CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--fg-faint)',
};
export const h1: CSSProperties = {
  fontFamily: 'var(--font-head)',
  fontWeight: 800,
  letterSpacing: '-0.03em',
  lineHeight: 1.08,
  fontSize: 62,
  wordBreak: 'keep-all',
  margin: 0,
};
export const h2: CSSProperties = { ...h1, fontSize: 50 };
export const h3: CSSProperties = { ...h1, fontSize: 34 };
export const body: CSSProperties = { fontSize: 23, lineHeight: 1.5, color: 'var(--fg-muted)', wordBreak: 'keep-all' };
export const small: CSSProperties = { fontSize: 18, lineHeight: 1.45, color: 'var(--fg-muted)', wordBreak: 'keep-all' };
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
export const accentText: CSSProperties = {
  background: 'var(--accent)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
};

/* 코드 칩 — 명령 한 토막 */
export function Code({ children, size = 20, color = C.mint }: { children: ReactNode; size?: number; color?: string }) {
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

/* 복사용 코드 블록 — 학생이 드래그해 그대로 복사한다 */
export function CodeBlock({ lines, size = 20, keys }: { lines: string[]; size?: number; keys?: string[] }) {
  return (
    <pre
      style={{
        ...mono,
        margin: 0,
        fontSize: size,
        lineHeight: 1.55,
        padding: '18px 24px',
        borderRadius: 14,
        background: 'color-mix(in srgb, var(--fg) 5%, var(--bg))',
        border: '1px solid var(--hair)',
        color: 'var(--fg)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
        userSelect: 'text',
        textAlign: 'left',
      }}
    >
      {lines.map((l, i) => {
        const k = keys?.find((key) => l.startsWith(key + ':'));
        return (
          <div key={i}>
            {k ? (
              <>
                <span style={{ color: C.mint, fontWeight: 800 }}>{k}:</span>
                {l.slice(k.length + 1)}
              </>
            ) : (
              l
            )}
          </div>
        );
      })}
    </pre>
  );
}

export function LinkButton({ href, children, size = 22 }: { href: string; children: ReactNode; size?: number }) {
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
      }}
    >
      {children}
    </a>
  );
}

export function TextLink({ href, children, size = 20 }: { href: string; children: ReactNode; size?: number }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      style={{ color: C.mint, fontWeight: 700, fontSize: size, textDecoration: 'underline', textUnderlineOffset: 4, wordBreak: 'keep-all' }}
    >
      {children}
    </a>
  );
}

/* 슬라이드 상단 헤더 밴드 (킥커 + 헤드라인) */
export function Header({ x = 120, y = 100, w = 900, kicker, title, align = 'left' }: { x?: number; y?: number; w?: number; kicker: string; title: ReactNode; align?: 'left' | 'right' }) {
  return (
    <div style={{ ...abs(x, y, w), textAlign: align }}>
      <div style={kick}>{kicker}</div>
      <h2 style={{ ...h2, marginTop: 10 }}>{title}</h2>
    </div>
  );
}

/* 스탬프 — 살짝 기울여 찍힌 도장 */
export function Stamp({ children, color = C.mint, rotate = -7, size = 24 }: { children: ReactNode; color?: string; rotate?: number; size?: number }) {
  return (
    <div
      style={{
        display: 'inline-block',
        padding: '8px 18px',
        borderRadius: 12,
        border: `3px solid ${color}`,
        color,
        fontWeight: 900,
        fontSize: size,
        transform: `rotate(${rotate}deg)`,
        background: 'rgba(11,18,32,0.75)',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </div>
  );
}

/* 키 캡 — 키보드 키 표시 */
export function Key({ children, hot = false }: { children: ReactNode; hot?: boolean }) {
  return (
    <span
      style={{
        ...mono,
        display: 'inline-block',
        fontSize: '0.85em',
        fontWeight: 800,
        padding: '2px 10px',
        borderRadius: 7,
        border: `1.5px solid ${hot ? C.mint : 'var(--hair)'}`,
        color: hot ? C.mint : 'var(--fg)',
        boxShadow: hot ? `0 0 0 4px color-mix(in srgb, ${C.mint} 25%, transparent)` : 'none',
        lineHeight: 1.4,
      }}
    >
      {children}
    </span>
  );
}

/* 창 축소 — walkthrough에서 지나간 창을 뒤로 물릴 때 popIn과 충돌하지 않게 바깥 래퍼에 쓴다 */
export function shrinkAfter(t: number, at: number, to = 0.86, origin = 'top left'): CSSProperties {
  if (t <= at) return {};
  const k = Math.min(1, (t - at) / 0.6);
  const e = 1 - Math.pow(1 - k, 3);
  return { transform: `scale(${1 - (1 - to) * e})`, transformOrigin: origin };
}
