import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useSceneTime, interpolate, easeOut, spring } from '../scene';

/* ── Whiteboard — "한 획씩 그려지는" 화이트보드 두들의 역학 계층 ────────
   newVideoGen `/vg-whiteboard`(rough-kit)를 슬라이드덱으로 옮긴 킷.
   rough.js를 의존성으로 들이지 않고, 같은 원리(시드 지터 + 2패스 스트로크)의
   결정론 손그림 경로 생성기를 내장한다 — 번들도 가볍고 t-순수성도 지킨다.

   좌표계: <Board>가 만드는 1600×900 SVG 사용자 단위(px처럼 쓴다).
   슬라이드 비율이 달라도 meet 로 letterbox 되므로 좌표가 흔들리지 않는다.

   타임라인: 요소마다 at(시작 초)·dur(그리는 시간)을 준다. 선언 순서가 곧
   z-order, at 순서가 곧 "그려지는 순서"다. 쓰는 손은 활성 스트로크의 끝점을
   getPointAtLength로 추적해 자동 정렬된다.

   모든 모션은 useSceneTime() t의 순수 함수 (scene-grammar 결정론). ─────── */

/* ══ 하우스 팔레트 (레퍼런스 실측값) ══════════════════════════════════ */
export const INK = '#1a1a1a';
export const PAPER = '#f6f5f0';
export const BLUE = '#dceaf7';
export const BLUE_LINE = '#3f6f9f';
export const RED = '#cc2936';
export const TAN = '#f6e3c9';
export const MINT = '#d9f2df';
export const GRAY = '#9a958c';

/* ══ 결정론 손그림 경로 생성기 (rough.js 대체) ════════════════════════ */

/** 시드 기반 의사난수 — 같은 시드면 같은 선. Math.random 금지 규칙의 실행부 */
function rand(seed: number) {
  let s = (seed >>> 0) || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

type RoughOpt = {
  /** 흔들림 크기(px) — 기본 1.8. 크게 줄수록 거칠다 */
  rough?: number;
  /** 2패스(같은 선을 두 번 긋기) — 손그림 질감의 핵심 */
  passes?: number;
};

function wobbleLine(x1: number, y1: number, x2: number, y2: number, r: () => number, k: number) {
  // 중간 제어점을 어긋나게 둔 2차 베지어 — 사람 손의 미세한 호
  const mx = (x1 + x2) / 2 + (r() - 0.5) * k * 2.2;
  const my = (y1 + y2) / 2 + (r() - 0.5) * k * 2.2;
  const sx = x1 + (r() - 0.5) * k;
  const sy = y1 + (r() - 0.5) * k;
  const ex = x2 + (r() - 0.5) * k;
  const ey = y2 + (r() - 0.5) * k;
  return `M ${sx.toFixed(1)} ${sy.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
}

/** 손그림 직선 (기본 2패스) */
export function line(x1: number, y1: number, x2: number, y2: number, seed = 1, o: RoughOpt = {}): string {
  const r = rand(seed * 2654435761);
  const k = o.rough ?? 1.8;
  const n = o.passes ?? 2;
  let d = '';
  for (let i = 0; i < n; i++) d += (i ? ' ' : '') + wobbleLine(x1, y1, x2, y2, r, k);
  return d;
}

/** 손그림 폴리라인/폴리곤 */
export function poly(pts: [number, number][], seed = 1, o: RoughOpt & { close?: boolean } = {}): string {
  const r = rand(seed * 2246822519);
  const k = o.rough ?? 1.8;
  const n = o.passes ?? 2;
  const list = o.close ? [...pts, pts[0]] : pts;
  let d = '';
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < list.length - 1; j++) {
      d += (d ? ' ' : '') + wobbleLine(list[j][0], list[j][1], list[j + 1][0], list[j + 1][1], r, k);
    }
  }
  return d;
}

/** 손그림 사각형 */
export function rect(x: number, y: number, w: number, h: number, seed = 1, o: RoughOpt = {}): string {
  return poly(
    [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ],
    seed,
    { ...o, close: true }
  );
}

/** 손그림 둥근 사각형 */
export function rrect(x: number, y: number, w: number, h: number, rad = 18, seed = 1, o: RoughOpt = {}): string {
  const r = rand(seed * 3266489917);
  const k = o.rough ?? 1.6;
  const j = () => (r() - 0.5) * k;
  const d =
    `M ${x + rad + j()} ${y + j()} L ${x + w - rad + j()} ${y + j()} Q ${x + w + j()} ${y + j()} ${x + w + j()} ${y + rad + j()}` +
    ` L ${x + w + j()} ${y + h - rad + j()} Q ${x + w + j()} ${y + h + j()} ${x + w - rad + j()} ${y + h + j()}` +
    ` L ${x + rad + j()} ${y + h + j()} Q ${x + j()} ${y + h + j()} ${x + j()} ${y + h - rad + j()}` +
    ` L ${x + j()} ${y + rad + j()} Q ${x + j()} ${y + j()} ${x + rad + j()} ${y + j()}`;
  return d;
}

/** 손그림 타원 (2패스) */
export function ellipse(cx: number, cy: number, rx: number, ry: number, seed = 1, o: RoughOpt = {}): string {
  const r = rand(seed * 668265263);
  const k = o.rough ?? 2.2;
  const n = o.passes ?? 2;
  const steps = 22;
  let d = '';
  for (let p = 0; p < n; p++) {
    const off = p * 0.3;
    const pts: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2 + off;
      pts.push([cx + Math.cos(a) * (rx + (r() - 0.5) * k), cy + Math.sin(a) * (ry + (r() - 0.5) * k)]);
    }
    // 각 점을 제어점으로 삼아 중점끼리 잇는다 — 손으로 그린 부드러운 닫힌 곡선
    d += ` M ${((pts[0][0] + pts[1][0]) / 2).toFixed(1)} ${((pts[0][1] + pts[1][1]) / 2).toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const nx = pts[(i + 1) % pts.length];
      d += ` Q ${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${((pts[i][0] + nx[0]) / 2).toFixed(1)} ${((pts[i][1] + nx[1]) / 2).toFixed(1)}`;
    }
  }
  return d.trim();
}

/* ══ 픽토그램 알파벳 — 조합은 자유, 구도 복제 금지 ═════════════════════ */

export const pict = {
  /** 브라우저 창 (신호등 3점) */
  browser(x: number, y: number, w: number, h: number, seed = 7): string[] {
    return [
      rect(x, y, w, h, seed),
      line(x, y + 34, x + w, y + 34, seed + 1),
      ellipse(x + 18, y + 17, 6, 6, seed + 2),
      ellipse(x + 40, y + 17, 6, 6, seed + 3),
      ellipse(x + 62, y + 17, 6, 6, seed + 4),
    ];
  },
  /** 접힌 귀 문서 */
  docFile(x: number, y: number, w: number, h: number, seed = 11): string[] {
    const c = Math.min(w, h) * 0.26;
    return [
      poly(
        [
          [x, y],
          [x + w - c, y],
          [x + w, y + c],
          [x + w, y + h],
          [x, y + h],
        ],
        seed,
        { close: true }
      ),
      poly(
        [
          [x + w - c, y],
          [x + w - c, y + c],
          [x + w, y + c],
        ],
        seed + 1
      ),
      line(x + 14, y + h * 0.5, x + w - 14, y + h * 0.5, seed + 2),
      line(x + 14, y + h * 0.68, x + w - 34, y + h * 0.68, seed + 3),
    ];
  },
  /** 데이터베이스 실린더 */
  cylinder(cx: number, y: number, rx: number, h: number, seed = 13): string[] {
    return [
      ellipse(cx, y, rx, rx * 0.32, seed),
      line(cx - rx, y, cx - rx, y + h, seed + 1),
      line(cx + rx, y, cx + rx, y + h, seed + 2),
      ellipse(cx, y + h, rx, rx * 0.32, seed + 3),
    ];
  },
  /** 생각 풍선 (구름 + 꼬리 방울) */
  thought(cx: number, cy: number, rx: number, ry: number, seed = 17): string[] {
    return [
      ellipse(cx, cy, rx, ry, seed),
      ellipse(cx - rx * 0.75, cy + ry * 0.95, rx * 0.18, ry * 0.24, seed + 1),
      ellipse(cx - rx * 0.95, cy + ry * 1.5, rx * 0.1, ry * 0.14, seed + 2),
    ];
  },
  /** 말풍선 (사각 + 꼬리) */
  speech(x: number, y: number, w: number, h: number, seed = 19): string[] {
    return [
      rrect(x, y, w, h, 16, seed),
      poly(
        [
          [x + w * 0.24, y + h],
          [x + w * 0.3, y + h + 26],
          [x + w * 0.42, y + h],
        ],
        seed + 1
      ),
    ];
  },
  /** 체크 */
  check(x: number, y: number, s = 40, seed = 23): string[] {
    return [poly([[x, y + s * 0.5], [x + s * 0.38, y + s], [x + s, y]], seed)];
  },
  /** 엑스 */
  cross(x: number, y: number, s = 40, seed = 29): string[] {
    return [line(x, y, x + s, y + s, seed), line(x + s, y, x, y + s, seed + 1)];
  },
  /** 강조 원 (빨간 주석) */
  circleAround(cx: number, cy: number, rx: number, ry: number, seed = 31): string[] {
    return [ellipse(cx, cy, rx, ry, seed, { rough: 3.4, passes: 1 })];
  },
  /** 밑줄 (빨간 주석) */
  underline(x: number, y: number, w: number, seed = 37): string[] {
    return [line(x, y, x + w, y + 4, seed, { rough: 2.6, passes: 1 })];
  },
  /** 지그재그 취소선 */
  zigzag(x: number, y: number, w: number, seed = 41): string[] {
    const pts: [number, number][] = [];
    const n = 7;
    for (let i = 0; i <= n; i++) pts.push([x + (w * i) / n, y + (i % 2 ? 12 : -12)]);
    return [poly(pts, seed, { passes: 1 })];
  },
  /** 방사 버스트 */
  burst(cx: number, cy: number, r0: number, r1: number, n = 10, seed = 43): string[] {
    const out: string[] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.sin(i * 3.7) * 0.08;
      out.push(
        line(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, seed + i, {
          passes: 1,
        })
      );
    }
    return out;
  },
  /** 직선 화살표 — 머리는 실제 방향 벡터로 회전 (atan2 규칙) */
  arrow(x1: number, y1: number, x2: number, y2: number, seed = 47, head = 22): string[] {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const h1: [number, number] = [x2 - Math.cos(a - 0.42) * head, y2 - Math.sin(a - 0.42) * head];
    const h2: [number, number] = [x2 - Math.cos(a + 0.42) * head, y2 - Math.sin(a + 0.42) * head];
    return [line(x1, y1, x2, y2, seed), poly([h1, [x2, y2], h2], seed + 1, { passes: 1 })];
  },
  /** 곡선 스우시 화살표 (빨간 주석 시그니처) */
  curveArrow(x1: number, y1: number, x2: number, y2: number, bow = 90, seed = 53, head = 24): string[] {
    const mx = (x1 + x2) / 2 + (y2 - y1) * 0.001 * bow;
    const my = (y1 + y2) / 2 - bow;
    const a = Math.atan2(y2 - my, x2 - mx);
    const h1: [number, number] = [x2 - Math.cos(a - 0.42) * head, y2 - Math.sin(a - 0.42) * head];
    const h2: [number, number] = [x2 - Math.cos(a + 0.42) * head, y2 - Math.sin(a + 0.42) * head];
    return [
      `M ${x1} ${y1} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${x2} ${y2}`,
      poly([h1, [x2, y2], h2], seed, { passes: 1 }),
    ];
  },
};

/* ══ 타임라인 컨텍스트 — 쓰는 손이 활성 스트로크를 추적한다 ═════════════ */

type StrokeReg = { el: SVGPathElement; at: number; dur: number };
const BoardCtx = createContext<{
  register: (s: StrokeReg) => () => void;
} | null>(null);

const FONT_ID = 'wb-hand-font';

/** 화이트보드 판 — 종이 배경 + 1600×900 좌표계 + 쓰는 손 */
export function Board({
  children,
  vb = [1600, 900],
  bg = PAPER,
  hand = true,
  handSrc,
  handSize = 190,
  handTip = [0.08, 0.06],
  style,
}: {
  children: ReactNode;
  vb?: [number, number];
  bg?: string;
  /** 쓰는 손 추적 (활성 스트로크 끝점) */
  hand?: boolean;
  /** 손 이미지 URL — 없으면 손을 그리지 않는다(자산 생성 전 임시) */
  handSrc?: string;
  handSize?: number;
  /** 손 이미지 안에서 펜촉이 있는 위치 (0~1 비율) — 이 점이 획 끝에 정렬된다 */
  handTip?: [number, number];
  style?: CSSProperties;
}) {
  const t = useSceneTime();
  const strokes = useRef<StrokeReg[]>([]);

  useEffect(() => {
    if (document.getElementById(FONT_ID)) return;
    const l = document.createElement('link');
    l.id = FONT_ID;
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&family=Caveat:wght@600&display=swap';
    document.head.appendChild(l);
  }, []);

  // 컨텍스트 값은 ref에 고정 — Board는 t 때문에 매 프레임 리렌더되므로
  // 여기서 새 객체를 만들면 자식 effect가 매 프레임 재실행된다.
  const api = useRef({
    register: (s: StrokeReg) => {
      strokes.current.push(s);
      return () => {
        strokes.current = strokes.current.filter((x) => x !== s);
      };
    },
  }).current;

  // 활성 스트로크의 현재 펜촉 위치
  let tip: { x: number; y: number } | null = null;
  if (hand && handSrc) {
    for (const s of strokes.current) {
      if (t >= s.at && t <= s.at + s.dur) {
        try {
          const len = s.el.getTotalLength();
          const p = s.el.getPointAtLength(len * Math.min(1, (t - s.at) / s.dur));
          tip = { x: p.x, y: p.y };
        } catch {
          /* 마운트 직후 등 — 무시 */
        }
      }
    }
  }

  return (
    <div style={{ position: 'absolute', inset: 0, background: bg, overflow: 'hidden', ...style }}>
      <BoardCtx.Provider value={api}>
        <svg
          viewBox={`0 0 ${vb[0]} ${vb[1]}`}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        >
          {children}
          {tip && handSrc && (
            <image
              href={handSrc}
              x={tip.x - handSize * handTip[0]}
              y={tip.y - handSize * handTip[1]}
              width={handSize}
              height={handSize}
              style={{ pointerEvents: 'none' }}
            />
          )}
        </svg>
      </BoardCtx.Provider>
    </div>
  );
}

/** 한 획(또는 여러 획)을 순서대로 "그린다". d는 path 문자열 또는 배열 */
export function Draw({
  d,
  at = 0,
  dur = 0.8,
  color = INK,
  width = 5.5,
  fill,
  fillAt,
  opacity = 1,
}: {
  d: string | string[];
  at?: number;
  dur?: number;
  color?: string;
  width?: number;
  /** 채색 — 획이 끝난 뒤 은은히 차오른다 */
  fill?: string;
  /** 채색 시작 시각(기본: 획 완료 시점) */
  fillAt?: number;
  opacity?: number;
}) {
  const t = useSceneTime();
  const list = Array.isArray(d) ? d : [d];
  const each = dur / list.length;
  return (
    <g opacity={opacity}>
      {fill && (
        <path
          d={list.join(' ')}
          fill={fill}
          stroke="none"
          opacity={interpolate(t, [fillAt ?? at + dur * 0.7, (fillAt ?? at + dur * 0.7) + 0.5], [0, 1], easeOut)}
        />
      )}
      {list.map((one, i) => (
        <Stroke key={i} d={one} at={at + each * i} dur={each} color={color} width={width} />
      ))}
    </g>
  );
}

function Stroke({
  d,
  at,
  dur,
  color,
  width,
}: {
  d: string;
  at: number;
  dur: number;
  color: string;
  width: number;
}) {
  const t = useSceneTime();
  const ref = useRef<SVGPathElement>(null);
  const [len, setLen] = useState(0);
  const board = useContext(BoardCtx);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setLen(el.getTotalLength());
    return board?.register({ el, at, dur });
    // board는 ref 고정이라 의존성에서 뺀다 (매 프레임 재등록 방지)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, at, dur]);

  const p = interpolate(t, [at, at + dur], [0, 1], easeOut);
  return (
    <path
      ref={ref}
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={len || undefined}
      strokeDashoffset={len ? len * (1 - p) : undefined}
      opacity={t < at ? 0 : 1}
    />
  );
}

/** 손글씨 — 글자가 하나씩 등장하고, 글자마다 결정론 지터가 붙는다 */
export function Write({
  x,
  y,
  children,
  at = 0,
  cps = 12,
  size = 46,
  color = INK,
  font = 'gaegu',
  bold,
  anchor = 'start',
  seed = 5,
}: {
  x: number;
  y: number;
  children: string;
  at?: number;
  /** 초당 글자 수 */
  cps?: number;
  size?: number;
  color?: string;
  /** gaegu=한글 손글씨 · pen=얇은 펜 · caveat=라틴 전용 */
  font?: 'gaegu' | 'pen' | 'caveat';
  bold?: boolean;
  anchor?: 'start' | 'middle' | 'end';
  seed?: number;
}) {
  const t = useSceneTime();
  const chars = [...children];
  const shown = Math.max(0, Math.floor((t - at) * cps));
  const family =
    font === 'caveat' ? '"Caveat", cursive' : font === 'pen' ? '"Nanum Pen Script", cursive' : '"Gaegu", cursive';
  const r = rand(seed * 40503);
  return (
    <text
      x={x}
      y={y}
      fill={color}
      fontFamily={family}
      fontSize={size}
      fontWeight={bold ? 700 : 400}
      textAnchor={anchor}
      style={{ whiteSpace: 'pre' }}
    >
      {chars.map((c, i) => {
        const dy = (r() - 0.5) * size * 0.06;
        const rot = (r() - 0.5) * 3.2;
        return (
          <tspan
            key={i}
            dy={i === 0 ? dy : 0}
            opacity={i < shown ? 1 : 0}
            style={{ transformBox: 'fill-box', transform: `rotate(${rot}deg)` }}
          >
            {c}
          </tspan>
        );
      })}
    </text>
  );
}

/** 완성 시각 — 다음 국면 계산용 */
export function writeDoneAt(text: string, at: number, cps = 12): number {
  return at + [...text].length / cps;
}

/** 임의 SVG를 백오버슈트로 등장 (기하 도형·칩·아이콘) */
export function Pop({
  cx,
  cy,
  at = 0,
  dur = 0.5,
  children,
}: {
  cx: number;
  cy: number;
  at?: number;
  dur?: number;
  children: ReactNode;
}) {
  const t = useSceneTime();
  if (t < at) return null;
  const s = spring(t, at, dur);
  return (
    <g transform={`translate(${cx} ${cy}) scale(${0.7 + 0.3 * s}) translate(${-cx} ${-cy})`} opacity={Math.min(1, s * 1.6)}>
      {children}
    </g>
  );
}

/** 진행률(0~1)을 주입받는 자유 렌더 — 표현 무제한 */
export function Free({
  at = 0,
  dur = 1,
  children,
}: {
  at?: number;
  dur?: number;
  children: (p: number) => ReactNode;
}) {
  const t = useSceneTime();
  return <>{children(interpolate(t, [at, at + dur], [0, 1], easeOut))}</>;
}

/** 생성 스티커 — 팝이 아니라 "스케치 리빌"(위에서 아래로 쓸리며 등장)로 나온다 */
export function Sticker({
  src,
  x,
  y,
  w,
  h,
  at = 0,
  dur = 0.8,
  seed = 3,
  opacity = 1,
}: {
  src: string;
  /** 좌상단 좌표 (1600×900 단위) */
  x: number;
  y: number;
  w: number;
  h: number;
  at?: number;
  dur?: number;
  seed?: number;
  opacity?: number;
}) {
  const t = useSceneTime();
  const id = useRef(`wbmask-${Math.abs(Math.round(x * 31 + y * 17 + w))}-${seed}`).current;
  if (t < at) return null;
  const p = interpolate(t, [at, at + dur], [0, 1], easeOut);
  // 리빌 경계를 톱니로 — 붓이 쓸고 지나간 자국
  const r = rand(seed * 2654435761);
  const edge = Array.from({ length: 9 }, (_, i) => `${x + (w * i) / 8} ${y + h * p + (r() - 0.5) * 26}`).join(' L ');
  return (
    <g opacity={opacity}>
      <defs>
        <clipPath id={id}>
          <path d={`M ${x - 8} ${y - 8} L ${edge} L ${x + w + 8} ${y - 8} Z`} />
        </clipPath>
      </defs>
      <image href={src} x={x} y={y} width={w} height={h} clipPath={`url(#${id})`} preserveAspectRatio="xMidYMid meet" />
    </g>
  );
}

/** 캡션 알약 — 화이트보드 하단의 손글씨 한 줄 (교사 나레이션의 앵커) */
export function Caption({
  children,
  at = 0,
  cps = 14,
  y = 780,
  vb = 1600,
}: {
  children: string;
  at?: number;
  cps?: number;
  y?: number;
  vb?: number;
}) {
  const t = useSceneTime();
  if (t < at - 0.2) return null;
  const w = Math.min(vb - 160, 34 * [...children].length + 90);
  return (
    <g>
      <Draw d={rrect((vb - w) / 2, y - 46, w, 74, 34, 91)} at={at - 0.2} dur={0.45} width={4} fill="#fff" fillAt={at - 0.1} />
      <Write x={vb / 2} y={y + 2} at={at} cps={cps} size={44} anchor="middle" bold>
        {children}
      </Write>
    </g>
  );
}
