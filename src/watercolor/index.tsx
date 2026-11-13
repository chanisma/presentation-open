import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { useSceneTime, interpolate, easeInOut, easeOut } from '../scene';

/* ── Watercolor — "붓이 지나가며 색면이 차오르는" wash 리빌의 역학 계층 ──
   newVideoGen `/vg-watercolor-motion`(WatercolorWash 노드)을 슬라이드덱으로 옮긴 킷.

   원본은 potrace로 이미지를 벡터화해 붓 경로를 뽑았지만, 이 저장소에는 potrace가
   없다. 대신 **붓질 밴드를 절차적으로 생성**해 마스크를 만든다 — 사람이 종이를
   적실 때처럼 위→아래(또는 좌→우) 지그재그로 쓸고 지나가며, 거친 붓 자국
   (feTurbulence + feDisplacementMap)과 젖은 번짐(feGaussianBlur)을 통과한
   마스크가 수채화 이미지를 드러낸다. 끝 구간에서 못 닿은 여백을 은은히 보충한다.

   연필 스케치가 "선을 긋는다"면 수채화는 "색면을 적신다" — 검은 윤곽선 없음,
   색면이 곧 형태다. 그래서 이 킷에는 stroke 어휘가 없다.

   모든 모션은 useSceneTime() t의 순수 함수 (scene-grammar 결정론).
   feTurbulence seed 고정 · Math.random 금지. ───────────────────────────── */

export const PAPER = '#f3eee2';
export const PAPER_DEEP = '#e7dcc8';
export const WASH_INK = '#3d4a52';

const FONT_ID = 'wc-hand-font';

/** 수채화지 — 배경 종이색 + 미세한 종이 결 */
export function Paper({
  children,
  bg = PAPER,
  grain = 0.055,
  style,
}: {
  children?: ReactNode;
  bg?: string;
  grain?: number;
  style?: CSSProperties;
}) {
  useEffect(() => {
    if (document.getElementById(FONT_ID)) return;
    const l = document.createElement('link');
    l.id = FONT_ID;
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700&family=Nanum+Pen+Script&display=swap';
    document.head.appendChild(l);
  }, []);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bg, ...style }}>
      {children}
      {grain > 0 && (
        <svg
          aria-hidden
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: grain }}
        >
          <filter id="wc-paper-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={4} seed={11} />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#wc-paper-grain)" />
        </svg>
      )}
    </div>
  );
}

/* ══ 붓질 밴드 생성 ═══════════════════════════════════════════════════ */

type Dir = 'down' | 'up' | 'right' | 'diag';

/** 밴드 i의 지그재그 경로(1920×1080 좌표계) — 붓이 한 번 쓸고 지나가는 자국 */
function bandPath(i: number, n: number, dir: Dir): { d: string; at: (p: number) => [number, number] } {
  const W = 1920;
  const H = 1080;
  const pad = 90; // 종이 여백까지 칠하지 않는다 (수채화의 여백)
  if (dir === 'right' || dir === 'diag') {
    const x = pad + ((W - pad * 2) * (i + 0.5)) / n;
    const y0 = dir === 'diag' ? pad - 60 : pad;
    const y1 = dir === 'diag' ? H - pad + 60 : H - pad;
    const [a, b] = i % 2 ? [y1, y0] : [y0, y1];
    const bow = dir === 'diag' ? 140 : 60;
    return {
      d: `M ${x} ${a} Q ${x + (i % 2 ? -bow : bow)} ${(a + b) / 2} ${x} ${b}`,
      at: (p) => [x + Math.sin(p * Math.PI) * (i % 2 ? -bow : bow) * 0.5, a + (b - a) * p],
    };
  }
  const y = pad + ((H - pad * 2) * (i + 0.5)) / n;
  const [a, b] = i % 2 ? [W - pad, pad] : [pad, W - pad];
  const bow = 46;
  const yy = y + (i % 2 ? -bow : bow) * 0.35;
  return {
    d: `M ${a} ${y} Q ${(a + b) / 2} ${yy + (i % 2 ? -bow : bow)} ${b} ${y}`,
    at: (p) => [a + (b - a) * p, y + Math.sin(p * Math.PI) * (i % 2 ? -bow : bow) * 0.5],
  };
}

let washSeq = 0;

/**
 * 수채화 이미지가 붓질을 따라 차오르는 리빌.
 * 완성 이미지를 한 번에 보여주지 않는 것이 이 문법의 정체성이다.
 */
export function WashReveal({
  src,
  at = 0,
  dur = 4.5,
  bands = 7,
  dir = 'down',
  brushWidth = 210,
  bleed = 7,
  roughness = 26,
  seed = 9,
  finish = true,
  brush = true,
  brushSrc,
  alt = '',
  z = 1,
}: {
  src: string;
  at?: number;
  /** 전체 wash가 끝나는 데 걸리는 시간(초) */
  dur?: number;
  /** 붓질 횟수 — 적을수록 큰 붓, 많을수록 촘촘 */
  bands?: number;
  dir?: Dir;
  /** 붓 폭(1920×1080 좌표계 px) */
  brushWidth?: number;
  /** 젖은 번짐 (feGaussianBlur) */
  bleed?: number;
  /** 붓 가장자리 거칠기 (feDisplacementMap scale) */
  roughness?: number;
  seed?: number;
  /** 끝 구간에서 붓이 못 닿은 여백을 은은히 보충 */
  finish?: boolean;
  /** 젖은 붓 커서 */
  brush?: boolean;
  /** 붓 이미지 URL (없으면 추상 둥근 붓) */
  brushSrc?: string;
  alt?: string;
  z?: number;
}) {
  const t = useSceneTime();
  const uid = useRef(`wc-${++washSeq}`).current;
  const paths = Array.from({ length: bands }, (_, i) => bandPath(i, bands, dir));
  const each = dur / bands;

  // 현재 붓끝 — 활성 밴드 위의 위치
  let tip: [number, number] | null = null;
  const active = Math.floor((t - at) / each);
  if (brush && t >= at && active >= 0 && active < bands) {
    const local = Math.min(1, Math.max(0, (t - at - active * each) / each));
    tip = paths[active].at(local);
  }

  const finishOp = finish ? interpolate(t, [at + dur * 0.88, at + dur * 1.06], [0, 1], easeInOut) : 0;

  return (
    <svg
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: z, pointerEvents: 'none' }}
    >
      <defs>
        <filter id={`${uid}-brush`} x="-15%" y="-15%" width="130%" height="130%">
          {/* 거친 붓 자국 — 결정론 seed */}
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.021" numOctaves={3} seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={roughness} xChannelSelector="R" yChannelSelector="G" />
          {/* 젖은 번짐 */}
          <feGaussianBlur stdDeviation={bleed} />
        </filter>
        <mask id={`${uid}-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080">
          <g filter={`url(#${uid}-brush)`}>
            {paths.map((p, i) => (
              <BandStroke key={i} d={p.d} at={at + each * i} dur={each} width={brushWidth} />
            ))}
          </g>
          {/* 마무리 wash — 붓이 못 닿은 여백을 낮은 농도로 채운다 */}
          {finish && <rect x="0" y="0" width="1920" height="1080" fill="#fff" opacity={finishOp * 0.92} />}
        </mask>
      </defs>

      <image
        href={src}
        x="0"
        y="0"
        width="1920"
        height="1080"
        preserveAspectRatio="xMidYMid slice"
        mask={`url(#${uid}-mask)`}
      >
        {alt && <title>{alt}</title>}
      </image>

      {tip && (
        <g transform={`translate(${tip[0]} ${tip[1]})`}>
          {brushSrc ? (
            <image href={brushSrc} x={-40} y={-190} width={220} height={220} />
          ) : (
            <>
              <ellipse rx={brushWidth * 0.17} ry={brushWidth * 0.3} fill={WASH_INK} opacity={0.35} />
              <rect x={-9} y={-190} width={18} height={150} rx={8} fill="#8a6b4f" opacity={0.85} />
            </>
          )}
        </g>
      )}
    </svg>
  );
}

function BandStroke({ d, at, dur, width }: { d: string; at: number; dur: number; width: number }) {
  const t = useSceneTime();
  const ref = useRef<SVGPathElement>(null);
  const len = useRef(0);
  useEffect(() => {
    if (ref.current) len.current = ref.current.getTotalLength();
  }, [d]);
  const p = interpolate(t, [at, at + dur], [0, 1], easeInOut);
  const L = len.current || 2600;
  return (
    <path
      ref={ref}
      d={d}
      fill="none"
      stroke="#fff"
      strokeWidth={width}
      strokeLinecap="round"
      strokeDasharray={L}
      strokeDashoffset={L * (1 - p)}
      opacity={t < at ? 0 : 1}
    />
  );
}

/** 색면 하이라이트 — 물감 한 방울이 번지듯 퍼지는 강조 */
export function ColorWash({
  x,
  y,
  r = 18,
  color = '#7ba3ae',
  at = 0,
  dur = 1.6,
  opacity = 0.5,
  z = 3,
}: {
  /** 화면 % 좌표 */
  x: number;
  y: number;
  /** 최대 반경(화면 폭 %) */
  r?: number;
  color?: string;
  at?: number;
  dur?: number;
  opacity?: number;
  z?: number;
}) {
  const t = useSceneTime();
  if (t < at) return null;
  const p = interpolate(t, [at, at + dur], [0, 1], easeOut);
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: `${r * 2 * p}%`,
        aspectRatio: '1.15',
        transform: 'translate(-50%, -50%)',
        borderRadius: '48% 52% 55% 45% / 50% 46% 54% 50%',
        background: `radial-gradient(closest-side, ${color} 0%, ${color} 55%, transparent 100%)`,
        filter: 'blur(14px)',
        opacity: opacity * Math.min(1, p * 1.6),
        mixBlendMode: 'multiply',
        zIndex: z,
        pointerEvents: 'none',
      }}
    />
  );
}

/** 번지듯 등장하는 글자 — 흐릿하게 배어 나와 또렷해진다 */
export function WashText({
  children,
  at = 0,
  dur = 1.1,
  style,
  className,
}: {
  children: ReactNode;
  at?: number;
  dur?: number;
  style?: CSSProperties;
  className?: string;
}) {
  const t = useSceneTime();
  const p = interpolate(t, [at, at + dur], [0, 1], easeOut);
  return (
    <div
      className={className}
      style={{
        opacity: p,
        filter: `blur(${(1 - p) * 7}px)`,
        transform: `translateY(${(1 - p) * 8}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** 명조 세로선 한 획 — 수채화 위에 얹는 가는 펜 선 (여백을 가르는 정도로만) */
export function InkLine({
  x1,
  y1,
  x2,
  y2,
  at = 0,
  dur = 0.9,
  color = WASH_INK,
  width = 2,
  z = 4,
}: {
  /** 화면 % 좌표 */
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  at?: number;
  dur?: number;
  color?: string;
  width?: number;
  z?: number;
}) {
  const t = useSceneTime();
  const p = interpolate(t, [at, at + dur], [0, 1], easeInOut);
  if (p <= 0) return null;
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: z, pointerEvents: 'none' }}
    >
      <line
        x1={x1}
        y1={y1}
        x2={x1 + (x2 - x1) * p}
        y2={y1 + (y2 - y1) * p}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        opacity={0.55}
      />
    </svg>
  );
}
