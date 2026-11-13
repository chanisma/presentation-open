import { createContext, useContext, type CSSProperties, type ReactNode } from 'react';
import { useSceneTime, interpolate, easeInOut, easeOut, spring } from '../scene';

/* ── Vox — hand-cut 종이 콜라주 + 카메라 여행의 역학 계층 ───────────────
   newVideoGen `/vg-vox`(에디토리얼 콜라주 모션그래픽)를 슬라이드덱으로 옮긴 킷.

   구조: 넓은 종이 세계(World) 위에 오려 붙인 조각(Cutout)들이 놓이고, 조각은
   각자 표류하며, 그 위를 카메라가 팬·줌으로 훑는다. 관계는 모션그래픽
   (화살표 흐름·점선 궤적·스캔원·펄스)이 그린다.

   좌표계: **월드 px** — 프레임(화면)은 1920×1080이고 월드는 그보다 넓다
   (가로 2800~3800 권장). 조각 좌표는 월드 px로 적고, 카메라가 그 위를 이동한다.

   diorama와의 차이: diorama의 무대는 정지하고 배우가 연기한다. vox는
   **세계가 넓고 카메라가 여행한다** — 한 화면에 다 안 들어가는 관계를 보여줄 때.

   오디오(SFX·BGM)는 이식하지 않았다 — 덱에는 오디오 트랙이 없다. 영상에서
   등장 팝 사운드가 하던 강조는 EntryBurst 파편과 스냅 등장이 대신한다. ─────── */

/* ══ 사양 팔레트 8색 (hand-cut editorial collage 헌장) ═════════════════ */
export const VOX = {
  navy: '#26456e',
  mustard: '#e8b02a',
  brickDeep: '#c85a26',
  brick: '#e0554a',
  olive: '#2f5d3f',
  ink: '#1a1a18',
  clay: '#e3d7c3',
  paper: '#f3ece0',
  paperLit: '#f8f3e9',
};
/** 모션그래픽 색 순환 — 인접 요소가 같은 색이 되지 않게 */
export const VOX_HUES = [VOX.brick, VOX.navy, VOX.mustard, VOX.olive, VOX.brickDeep];

type World = { w: number; h: number };
type Cam = { x: number; y: number; s: number };

const CamCtx = createContext<{ cam: Cam; world: World }>({
  cam: { x: 960, y: 540, s: 1 },
  world: { w: 1920, h: 1080 },
});

/* ══ 카메라 ═══════════════════════════════════════════════════════════ */

export type CamKey = {
  /** 이 키에 도달하는 시각(초) */
  t: number;
  /** 화면 중앙에 둘 월드 좌표 */
  x: number;
  y: number;
  /** 배율 (1 = 월드 1920px가 화면 폭) */
  s?: number;
};

/** 카메라 키프레임 보간 + 월드 경계 클램프 (mx = w/2 - 960/s 일반화 공식) */
export function useCam(keys: CamKey[], world: World): Cam {
  const t = useSceneTime();
  if (keys.length === 0) return { x: world.w / 2, y: world.h / 2, s: 1 };
  let k: Cam = { x: keys[0].x, y: keys[0].y, s: keys[0].s ?? 1 };
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (t >= a.t) {
      k = {
        x: interpolate(t, [a.t, b.t], [a.x, b.x], easeInOut),
        y: interpolate(t, [a.t, b.t], [a.y, b.y], easeInOut),
        s: interpolate(t, [a.t, b.t], [a.s ?? 1, b.s ?? 1], easeInOut),
      };
    }
  }
  const last = keys[keys.length - 1];
  if (t >= last.t) k = { x: last.x, y: last.y, s: last.s ?? 1 };

  // 월드 밖 빈 종이가 보이지 않게 클램프
  const mx = Math.max(0, world.w / 2 - 960 / k.s);
  const my = Math.max(0, world.h / 2 - 540 / k.s);
  return {
    x: Math.min(world.w / 2 + mx, Math.max(world.w / 2 - mx, k.x)),
    y: Math.min(world.h / 2 + my, Math.max(world.h / 2 - my, k.y)),
    s: k.s,
  };
}

/** 종이 세계 + 카메라. children은 월드 좌표로 배치된다. */
export function Collage({
  world = { w: 3200, h: 1080 },
  cam,
  bg = VOX.paper,
  grain = 0.1,
  camTransition,
  children,
  style,
}: {
  world?: World;
  cam: Cam;
  bg?: string;
  /** 종이 결 그레인 강도 (0.06~0.14) — 낡음이 아니라 종이의 물성 */
  grain?: number;
  /** 카메라를 t가 아니라 **클릭 상태**로 옮기는 덱을 위한 CSS 전이
      (예: 'transform 2.2s cubic-bezier(.55,.05,.3,1)').
      useCam으로 t 보간할 때는 지정하지 않는다 — 이중 보간이 된다. */
  camTransition?: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bg, ...style }}>
      <CamCtx.Provider value={{ cam, world }}>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: `${(world.w / 1920) * 100}%`,
            height: `${(world.h / 1080) * 100}%`,
            // ⚠ margin의 %는 세로도 **컨테이너 너비** 기준이라 화면이 위로 밀린다.
            // 자기 크기 기준인 translate(-50%,-50%)로 중앙 정렬한 뒤 카메라를 곱한다.
            transform: `translate(-50%, -50%) scale(${cam.s}) translate(${
              ((world.w / 2 - cam.x) / world.w) * 100
            }%, ${((world.h / 2 - cam.y) / world.h) * 100}%)`,
            transformOrigin: 'center',
            willChange: 'transform',
            transition: camTransition,
          }}
        >
          {children}
        </div>
      </CamCtx.Provider>
      {grain > 0 && <Grain amount={grain} />}
    </div>
  );
}

function Grain({ amount }: { amount: number }) {
  return (
    <svg
      aria-hidden
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: amount }}
    >
      <filter id="vox-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={3} seed={7} />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#vox-grain)" />
    </svg>
  );
}

/* ══ 조각 (Cutout) ════════════════════════════════════════════════════ */

export type Entry = 'pop' | 'slide' | 'tear' | 'drop' | 'none';
export type Drift = { x?: number; y?: number; rot?: number; scale?: number; from?: number; to?: number };

/** 월드 px 좌표 → 월드 div 기준 % */
function pct(v: number, total: number) {
  return `${(v / total) * 100}%`;
}

/** 오려 붙인 조각 하나. x/y는 조각 중심의 월드 좌표, w는 월드 px 폭. */
export function Cutout({
  src,
  x,
  y,
  w,
  at = 0,
  entry = 'pop',
  drift,
  depth = 1,
  dim = 1,
  rot = 0,
  flip = false,
  z = 5,
  shadow = true,
  fx = true,
  alt = '',
}: {
  src: string;
  x: number;
  y: number;
  w: number;
  at?: number;
  entry?: Entry;
  /** 씬 내내 이어지는 표류 — dominant는 |x|+|y| ≥ 60px 또는 rot ≥ 5° */
  drift?: Drift;
  /** 패럴랙스 깊이 (0.3 배경 · 1 주인공 · 1.2 전경) */
  depth?: number;
  /** 밝기(배경 조각을 물리기) */
  dim?: number;
  rot?: number;
  flip?: boolean;
  z?: number;
  shadow?: boolean;
  /** 등장 순간 종이 파편 버스트 */
  fx?: boolean;
  alt?: string;
}) {
  const t = useSceneTime();
  const { cam, world } = useContext(CamCtx);

  // 등장 — 0.3초 스냅 ("스르륵"이 아니라 "탁")
  const e = interpolate(t, [at, at + 0.3], [0, 1], easeOut);
  const s = spring(t, at, 0.42);
  let op = t < at ? 0 : Math.min(1, e * 1.6);
  let dx = 0;
  let dy = 0;
  let sc = 1;
  let dr = 0;
  if (entry === 'pop') sc = 0.82 + 0.18 * s;
  else if (entry === 'slide') dx = (1 - e) * -120;
  else if (entry === 'tear') {
    dy = (1 - e) * -70;
    dr = (1 - e) * -9;
  } else if (entry === 'drop') {
    dy = (1 - e) * -180;
    sc = t > at + 0.3 ? 1 + 0.05 * Math.sin(Math.min(1, (t - at - 0.3) / 0.25) * Math.PI) : 1;
  } else if (entry === 'none') op = 1;

  // 표류 — 등장 후에도 계속 움직인다 (정지 조각 금지)
  if (drift) {
    const p = interpolate(t, [drift.from ?? at, drift.to ?? (drift.from ?? at) + 8], [0, 1], easeInOut);
    dx += (drift.x ?? 0) * p;
    dy += (drift.y ?? 0) * p;
    dr += (drift.rot ?? 0) * p;
    sc *= 1 + (drift.scale ?? 0) * p;
  }

  // 패럴랙스 — 카메라 이동량에 depth를 곱해 어긋나게
  const px = (cam.x - world.w / 2) * (depth - 1);
  const py = (cam.y - world.h / 2) * (depth - 1);

  if (op <= 0.001) return null;

  return (
    <>
      <img
        src={src}
        alt={alt}
        style={{
          position: 'absolute',
          left: pct(x + dx + px, world.w),
          top: pct(y + dy + py, world.h),
          width: pct(w * sc, world.w),
          transform: `translate(-50%, -50%) rotate(${rot + dr}deg)${flip ? ' scaleX(-1)' : ''}`,
          opacity: op * dim,
          filter: shadow ? 'drop-shadow(0 10px 14px rgba(26,26,24,0.20))' : undefined,
          zIndex: z,
          pointerEvents: 'none',
        }}
      />
      {fx && <EntryBurst x={x} y={y} w={w} at={at} z={z + 1} />}
    </>
  );
}

/** 등장 순간 흩어지는 색종이 파편 (결정론 해시) */
export function EntryBurst({ x, y, w, at, z = 9 }: { x: number; y: number; w: number; at: number; z?: number }) {
  const t = useSceneTime();
  const { world } = useContext(CamCtx);
  if (t < at || t > at + 0.7) return null;
  const p = (t - at) / 0.7;
  return (
    <>
      {Array.from({ length: 11 }, (_, i) => {
        const a = (i / 11) * Math.PI * 2 + Math.sin(i * 5.3) * 0.5;
        const r = w * (0.45 + Math.abs(Math.sin(i * 2.1)) * 0.5) * p;
        const size = w * (0.03 + Math.abs(Math.sin(i * 3.7)) * 0.035);
        return (
          <div
            key={i}
            aria-hidden
            style={{
              position: 'absolute',
              left: pct(x + Math.cos(a) * r, world.w),
              top: pct(y + Math.sin(a) * r + p * p * w * 0.2, world.h),
              width: pct(size, world.w),
              height: pct(size * 0.7, world.h),
              background: VOX_HUES[i % VOX_HUES.length],
              transform: `translate(-50%, -50%) rotate(${i * 47 + p * 220}deg)`,
              opacity: (1 - p) * 0.9,
              zIndex: z,
              pointerEvents: 'none',
            }}
          />
        );
      })}
    </>
  );
}

/* ══ 모션그래픽 — 관계·주석 어휘 (씬당 3~5개, 서로 다른 색) ═════════════ */

function useWorldSvg() {
  const { world } = useContext(CamCtx);
  return {
    world,
    props: {
      viewBox: `0 0 ${world.w} ${world.h}`,
      style: {
        position: 'absolute' as const,
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'visible' as const,
        pointerEvents: 'none' as const,
      },
    },
  };
}

/** 흐르는 쐐기 화살표 — 방향·전이. 화살촉은 실제 방향 벡터로 회전 */
export function ArrowFlow({
  from,
  to,
  at = 0,
  color = VOX.brick,
  count = 5,
  size = 26,
  z = 12,
}: {
  from: [number, number];
  to: [number, number];
  at?: number;
  color?: string;
  count?: number;
  size?: number;
  z?: number;
}) {
  const t = useSceneTime();
  const { props } = useWorldSvg();
  if (t < at) return null;
  const ang = (Math.atan2(to[1] - from[1], to[0] - from[0]) * 180) / Math.PI;
  const appear = interpolate(t, [at, at + 0.4], [0, 1], easeOut);
  return (
    <svg {...props} style={{ ...props.style, zIndex: z }}>
      {Array.from({ length: count }, (_, i) => {
        const q = (((t - at) * 0.35 + i / count) % 1 + 1) % 1;
        const cx = from[0] + (to[0] - from[0]) * q;
        const cy = from[1] + (to[1] - from[1]) * q;
        const fade = Math.sin(q * Math.PI);
        return (
          <path
            key={i}
            d={`M ${-size} ${-size * 0.62} L 0 0 L ${-size} ${size * 0.62}`}
            fill="none"
            stroke={color}
            strokeWidth={7}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={fade * appear}
            transform={`translate(${cx} ${cy}) rotate(${ang})`}
          />
        );
      })}
    </svg>
  );
}

/** 점선 궤적 + 선두 점 — 여정·추적 */
export function DashTrail({
  points,
  at = 0,
  color = VOX.navy,
  width = 5,
  z = 12,
}: {
  points: [number, number][];
  at?: number;
  color?: string;
  width?: number;
  z?: number;
}) {
  const t = useSceneTime();
  const { props } = useWorldSvg();
  if (t < at) return null;
  const d = points.map((p, i) => `${i ? 'L' : 'M'} ${p[0]} ${p[1]}`).join(' ');
  const p = interpolate(t, [at, at + 1.2], [0, 1], easeInOut);
  // 선두 점 — 경로를 왕복
  const q = (Math.sin((t - at) * 1.4) * 0.5 + 0.5) * p;
  const seg = Math.min(points.length - 2, Math.floor(q * (points.length - 1)));
  const local = q * (points.length - 1) - seg;
  const hx = points[seg][0] + (points[seg + 1][0] - points[seg][0]) * local;
  const hy = points[seg][1] + (points[seg + 1][1] - points[seg][1]) * local;
  return (
    <svg {...props} style={{ ...props.style, zIndex: z }}>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeDasharray="16 14"
        strokeLinecap="round"
        opacity={p}
      />
      <circle cx={hx} cy={hy} r={width * 2.2} fill={color} opacity={p} />
    </svg>
  );
}

/** 조준원 + 십자 — 대상 지목 */
export function CircleScan({
  x,
  y,
  r = 150,
  at = 0,
  color = VOX.brickDeep,
  z = 13,
}: {
  x: number;
  y: number;
  r?: number;
  at?: number;
  color?: string;
  z?: number;
}) {
  const t = useSceneTime();
  const { props } = useWorldSvg();
  if (t < at) return null;
  const p = interpolate(t, [at, at + 0.5], [0, 1], easeOut);
  const rot = (t - at) * 22;
  return (
    <svg {...props} style={{ ...props.style, zIndex: z }}>
      <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={p}>
        <circle r={r * p} fill="none" stroke={color} strokeWidth={5} strokeDasharray="40 26" />
        <line x1={-r * 1.2} y1={0} x2={-r * 0.7} y2={0} stroke={color} strokeWidth={5} />
        <line x1={r * 0.7} y1={0} x2={r * 1.2} y2={0} stroke={color} strokeWidth={5} />
        <line x1={0} y1={-r * 1.2} x2={0} y2={-r * 0.7} stroke={color} strokeWidth={5} />
        <line x1={0} y1={r * 0.7} x2={0} y2={r * 1.2} stroke={color} strokeWidth={5} />
      </g>
    </svg>
  );
}

/** 맥동하는 링 — 주목 신호 */
export function PulseDot({
  x,
  y,
  at = 0,
  color = VOX.mustard,
  r = 26,
  z = 13,
}: {
  x: number;
  y: number;
  at?: number;
  color?: string;
  r?: number;
  z?: number;
}) {
  const t = useSceneTime();
  const { props } = useWorldSvg();
  if (t < at) return null;
  const q = ((t - at) % 1.6) / 1.6;
  return (
    <svg {...props} style={{ ...props.style, zIndex: z }}>
      <circle cx={x} cy={y} r={r} fill={color} />
      <circle cx={x} cy={y} r={r + q * r * 3.4} fill="none" stroke={color} strokeWidth={5} opacity={1 - q} />
    </svg>
  );
}

/** 방사선 버스트 — 확산·강조 */
export function RadialBurst({
  x,
  y,
  at = 0,
  color = VOX.mustard,
  n = 12,
  r0 = 60,
  r1 = 140,
  z = 12,
}: {
  x: number;
  y: number;
  at?: number;
  color?: string;
  n?: number;
  r0?: number;
  r1?: number;
  z?: number;
}) {
  const t = useSceneTime();
  const { props } = useWorldSvg();
  if (t < at) return null;
  const p = interpolate(t, [at, at + 0.4], [0, 1], easeOut);
  return (
    <svg {...props} style={{ ...props.style, zIndex: z }}>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        const beat = 0.5 + 0.5 * Math.sin((t - at) * 3 + i * 0.6);
        const rr1 = r0 + (r1 - r0) * beat;
        return (
          <line
            key={i}
            x1={x + Math.cos(a) * r0}
            y1={y + Math.sin(a) * r0}
            x2={x + Math.cos(a) * rr1}
            y2={y + Math.sin(a) * rr1}
            stroke={color}
            strokeWidth={6}
            strokeLinecap="round"
            opacity={p * 0.9}
          />
        );
      })}
    </svg>
  );
}

/** 취소선 — 부정·폐기 */
export function Strike({
  from,
  to,
  at = 0,
  color = VOX.brick,
  z = 14,
}: {
  from: [number, number];
  to: [number, number];
  at?: number;
  color?: string;
  z?: number;
}) {
  const t = useSceneTime();
  const { props } = useWorldSvg();
  if (t < at) return null;
  const p = interpolate(t, [at, at + 0.28], [0, 1], easeOut);
  const j = t > at + 0.28 ? Math.sin((t - at) * 26) * 1.6 : 0;
  return (
    <svg {...props} style={{ ...props.style, zIndex: z }}>
      <line
        x1={from[0] + j}
        y1={from[1]}
        x2={from[0] + (to[0] - from[0]) * p + j}
        y2={from[1] + (to[1] - from[1]) * p}
        stroke={color}
        strokeWidth={10}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** 손으로 두른 타원 — 단발 주석 */
export function InkCircle({
  x,
  y,
  rx,
  ry,
  at = 0,
  color = VOX.brick,
  z = 14,
}: {
  x: number;
  y: number;
  rx: number;
  ry: number;
  at?: number;
  color?: string;
  z?: number;
}) {
  const t = useSceneTime();
  const { props } = useWorldSvg();
  if (t < at) return null;
  const p = interpolate(t, [at, at + 0.6], [0, 1], easeOut);
  const steps = 26;
  let d = '';
  for (let i = 0; i <= steps * p; i++) {
    const a = (i / steps) * Math.PI * 2.15 - 0.4;
    const wob = 1 + Math.sin(i * 1.7) * 0.03;
    d += `${i === 0 ? 'M' : 'L'} ${(x + Math.cos(a) * rx * wob).toFixed(1)} ${(y + Math.sin(a) * ry * wob).toFixed(1)} `;
  }
  return (
    <svg {...props} style={{ ...props.style, zIndex: z }}>
      <path d={d} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" />
    </svg>
  );
}

/** 모서리 브래킷 + 라벨칩 — 대상을 지목하고 이름을 붙인다 */
export function AnchorBox({
  x,
  y,
  w,
  h,
  label,
  at = 0,
  color = VOX.ink,
  labelSide = 'bottom',
  z = 15,
}: {
  /** 대상 bbox 중심 */
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  at?: number;
  color?: string;
  labelSide?: 'top' | 'bottom';
  z?: number;
}) {
  const t = useSceneTime();
  const { world } = useContext(CamCtx);
  if (t < at) return null;
  const p = interpolate(t, [at, at + 0.35], [0, 1], easeOut);
  const c = 34;
  const L = x - w / 2;
  const T = y - h / 2;
  const corner = (px: number, py: number, sx: number, sy: number, key: string) => (
    <path
      key={key}
      d={`M ${px + sx * c} ${py} L ${px} ${py} L ${px} ${py + sy * c}`}
      fill="none"
      stroke={color}
      strokeWidth={6}
      strokeLinecap="round"
      opacity={p}
    />
  );
  return (
    <>
      <svg
        viewBox={`0 0 ${world.w} ${world.h}`}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: z, pointerEvents: 'none' }}
      >
        {corner(L, T, 1, 1, 'tl')}
        {corner(L + w, T, -1, 1, 'tr')}
        {corner(L, T + h, 1, -1, 'bl')}
        {corner(L + w, T + h, -1, -1, 'br')}
      </svg>
      <div
        style={{
          position: 'absolute',
          left: pct(x, world.w),
          top: pct(labelSide === 'bottom' ? T + h + 30 : T - 30, world.h),
          transform: `translate(-50%, ${labelSide === 'bottom' ? '0' : '-100%'})`,
          background: color,
          color: VOX.paperLit,
          padding: `${(8 / world.h) * 100}% ${(16 / world.w) * 100}%`,
          fontWeight: 800,
          fontSize: `${(30 / 1080) * 100}vh`,
          whiteSpace: 'nowrap',
          opacity: p,
          zIndex: z,
          pointerEvents: 'none',
        }}
      >
        {label}
      </div>
    </>
  );
}

/** 월드에 붙는 타이포 — 나레이션의 핵심 단어를 화면에 박는다 */
export function Tag({
  x,
  y,
  at = 0,
  size = 44,
  color = VOX.ink,
  bg,
  rot = 0,
  align = 'center',
  children,
  z = 16,
}: {
  x: number;
  y: number;
  at?: number;
  /** 월드 px 기준 글자 크기 */
  size?: number;
  color?: string;
  bg?: string;
  rot?: number;
  align?: 'center' | 'left';
  children: ReactNode;
  z?: number;
}) {
  const t = useSceneTime();
  const { world } = useContext(CamCtx);
  if (t < at) return null;
  const s = spring(t, at, 0.4);
  return (
    <div
      style={{
        position: 'absolute',
        left: pct(x, world.w),
        top: pct(y, world.h),
        transform: `translate(${align === 'center' ? '-50%' : '0'}, -50%) rotate(${rot}deg) scale(${0.8 + 0.2 * s})`,
        opacity: Math.min(1, s * 1.8),
        color,
        background: bg,
        padding: bg ? `${(6 / world.h) * 100}% ${(14 / world.w) * 100}%` : undefined,
        fontWeight: 800,
        fontSize: `${(size / 1080) * 100}vh`,
        lineHeight: 1.25,
        letterSpacing: '-0.01em',
        wordBreak: 'keep-all',
        zIndex: z,
        pointerEvents: 'none',
      }}
    >
      {children}
    </div>
  );
}
