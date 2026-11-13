import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { useSceneTime, interpolate, easeOut, easeInOut, spring } from '../scene';

/* ── Diorama — 무대·배우·오버레이 3층 스토리텔링의 "역학" 계층 ─────────
   newVideoGen `/vg-diorama`(그럴리있다 스타일 영상 문법)를 슬라이드덱 매체로
   옮긴 기계 장치 모음. 한 장의 무대(생성 배경 이미지)가 유지되는 동안 그 위에서
   크롭된 만화체 배우가 입장하고, 포즈를 갈아끼우며 연기하고, 퇴장한다.
   정보(라벨·항로·팻말)와 감정(말풍선·손글씨·임팩트)은 오버레이가 담당한다.

   3층 모델:
     Layer 3 오버레이 — Bubble · HandNote · LabelChip · Stamp · RouteDraw · 임팩트
     Layer 2 배우     — Actor (크롭 PNG 스프라이트 · 입장/포즈스왑/이동/퇴장)
     Layer 1 무대     — Stage (생성 배경 1장 · 프레이밍은 슬라이드당 고정)

   좌표 규약: 모든 x/y는 <Stage> 컨테이너의 **%**. Actor는 x=가로 중심,
   ground=발이 닿는 바닥선(y%), h=세로 높이(%)로 놓는다 — 인물이 공중에 뜨는
   사고(newVideoGen sub-agent 공통 실수)를 좌표 규약 자체로 막는다.

   모든 모션은 useSceneTime() t의 순수 함수다 (scene-grammar 결정론).
   Date.now()/Math.random() 금지 — 지터가 필요하면 Math.sin(i*7.3) 류 의사난수.

   ⚠ 무대는 정지한다. 카메라 워크(줌·팬·Ken Burns)는 이 문법이 아니다 —
   프레이밍을 바꾸려면 다음 슬라이드에서 다른 framing으로 "컷"한다. */

/** 다중 스톱 보간 — src/scene의 interpolate가 2점 전용이라 내부에서 쓰는 보조 함수 */
function stops(t: number, ts: number[], vs: number[]): number {
  if (t <= ts[0]) return vs[0];
  for (let i = 0; i < ts.length - 1; i++) {
    if (t <= ts[i + 1]) return interpolate(t, [ts[i], ts[i + 1]], [vs[i], vs[i + 1]]);
  }
  return vs[vs.length - 1];
}

/* ══ Layer 1 — 무대 ═══════════════════════════════════════════════════ */

export type Framing = {
  /** 배경 확대 배율 — 펀치인(1.3~1.6) */
  scale?: number;
  /** 확대 후 가로 이동(%) — 우측을 보려면 음수 */
  x?: number;
  /** 확대 후 세로 이동(%) */
  y?: number;
  /** 좌우 반전 — 같은 무대의 연속 숏을 다르게 보이게 */
  flip?: boolean;
  /** 배경 흐림(px) — 클로즈업 무대에서 전경 배우를 띄울 때 */
  blur?: number;
};

/** 무대 한 장. 배경 이미지(또는 추상 배경색) + 그 위 레이어들의 컨테이너. */
export function Stage({
  src,
  bg,
  framing,
  dim = 0,
  vignette = false,
  shake,
  children,
  style,
  alt = '',
}: {
  /** 생성 배경 이미지 URL (data/<수업>/images/stage-NN.png) */
  src?: string;
  /** 이미지 없이 추상 무대로 쓸 때의 배경 (그라데이션 문자열 가능) */
  bg?: string;
  /** 이 슬라이드의 고정 프레이밍 (t에 의존하지 않는다) */
  framing?: Framing;
  /** 0~1 어둡게 — 클로즈업·긴장 */
  dim?: number;
  vignette?: boolean;
  /** 무대 진동 (S13) — {at: 시각, amp?: px, dur?: 초} */
  shake?: { at: number; amp?: number; dur?: number };
  children?: ReactNode;
  style?: CSSProperties;
  alt?: string;
}) {
  const t = useSceneTime();
  const f = framing ?? {};
  const shakeCss = shake
    ? shakeStyle(t, shake.at, shake.amp ?? 6, shake.dur ?? 0.35)
    : undefined;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bg,
        ...shakeCss,
        ...style,
      }}
    >
      {src && (
        <img
          src={src}
          alt={alt}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${f.scale ?? 1}) translate(${f.x ?? 0}%, ${
              f.y ?? 0
            }%)${f.flip ? ' scaleX(-1)' : ''}`,
            filter: f.blur ? `blur(${f.blur}px)` : undefined,
          }}
        />
      )}
      {dim > 0 && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(8, 10, 16, ${dim})`,
          }}
        />
      )}
      {vignette && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at 50% 48%, transparent 40%, rgba(6,8,14,0.55) 100%)',
          }}
        />
      )}
      {children}
    </div>
  );
}

/* ══ Layer 2 — 배우 ═══════════════════════════════════════════════════ */

export type XKey = { t: number; x: number };

export type Enter = {
  at: number;
  /** ghost=반투명 페이드(기본) · slide-left/right=가장자리에서 진입 · pop=스프링 · drop=낙하 */
  style?: 'ghost' | 'slide-left' | 'slide-right' | 'pop' | 'drop';
  dur?: number;
};

export type Exit = {
  at: number;
  style?: 'fade' | 'slide-left' | 'slide-right' | 'shrink';
  dur?: number;
};

/** 무대 위의 배우 한 명(또는 사물 한 개) — 크롭 스프라이트 PNG. */
export function Actor({
  src,
  poses,
  pose,
  acting,
  flipbook,
  x,
  ground = 88,
  h = 46,
  enter,
  exit,
  bob,
  flip = false,
  z = 2,
  shadow = true,
  shadowW,
  style,
  alt = '',
}: {
  /** 포즈가 하나뿐일 때 */
  src?: string;
  /** 포즈 사전 — { think: 'assets/sprites/…/think.png', … } */
  poses?: Record<string, string>;
  /** 기본 포즈 키 */
  pose?: string;
  /** 연기 스케줄 — [{at: 1.2, pose: 'cry'}] · 하드 스왑(크로스페이드 금지) */
  acting?: { at: number; pose: string }[];
  /** 반복 동작 — 포즈 2~3개를 fps로 교차 (걷기·떨림) */
  flipbook?: { poses: string[]; fps?: number; from?: number; to?: number };
  /** 가로 중심(%). 이동하면 [{t, x}] 키프레임 */
  x: number | XKey[];
  /** 발이 닿는 바닥선 y(%) — 공중부양 방지 */
  ground?: number;
  /** 세로 높이(무대 높이 %). dominant 34~52 · 조연 18~28 · 군중 8~14 */
  h?: number;
  enter?: Enter;
  exit?: Exit;
  /** 미세 상하 흔들림 — {amp: 자기 높이 %, period: 초} */
  bob?: { amp?: number; period?: number };
  flip?: boolean;
  z?: number;
  /** 발밑 접지 그림자 */
  shadow?: boolean;
  /** 그림자 가로 폭(무대 너비 %) — 기본은 h에서 추정 */
  shadowW?: number;
  style?: CSSProperties;
  alt?: string;
}) {
  const t = useSceneTime();

  /* 포즈 결정 — flipbook > acting > pose > 첫 포즈 > src */
  let url = src;
  if (poses) {
    let key = pose ?? Object.keys(poses)[0];
    if (acting) {
      for (const a of acting) if (t >= a.at) key = a.pose;
    }
    if (
      flipbook &&
      t >= (flipbook.from ?? 0) &&
      t <= (flipbook.to ?? Number.POSITIVE_INFINITY)
    ) {
      const fps = flipbook.fps ?? 5;
      const i = Math.floor((t - (flipbook.from ?? 0)) * fps);
      key = flipbook.poses[((i % flipbook.poses.length) + flipbook.poses.length) % flipbook.poses.length];
    }
    url = poses[key] ?? url;
  }
  if (!url) return null;

  /* 위치 */
  let cx = typeof x === 'number' ? x : x[0].x;
  if (Array.isArray(x)) {
    for (let i = 0; i < x.length - 1; i++) {
      if (t >= x[i].t) cx = interpolate(t, [x[i].t, x[i + 1].t], [x[i].x, x[i + 1].x], easeInOut);
    }
    if (t >= x[x.length - 1].t) cx = x[x.length - 1].x;
  }

  /* 등장 */
  let op = 1;
  let dx = 0;
  let dy = 0;
  let sc = 1;
  if (enter) {
    const dur = enter.dur ?? 0.5;
    const p = interpolate(t, [enter.at, enter.at + dur], [0, 1], easeOut);
    switch (enter.style ?? 'ghost') {
      case 'ghost':
        // 반투명 고스트를 거쳐 완전 등장 (레퍼런스 실측 ~0.5s)
        op = t < enter.at ? 0 : stops(t, [enter.at, enter.at + dur * 0.45, enter.at + dur], [0, 0.45, 1]);
        break;
      case 'slide-left':
        op = p > 0 ? Math.min(1, p * 2.2) : 0;
        dx = (1 - p) * -16;
        break;
      case 'slide-right':
        op = p > 0 ? Math.min(1, p * 2.2) : 0;
        dx = (1 - p) * 16;
        break;
      case 'pop': {
        const s = spring(t, enter.at, dur);
        op = t < enter.at ? 0 : Math.min(1, s * 1.6);
        sc = 0.84 + 0.16 * s;
        break;
      }
      case 'drop': {
        op = t < enter.at ? 0 : Math.min(1, p * 3);
        dy = (1 - interpolate(t, [enter.at, enter.at + dur], [0, 1], easeIn)) * -22;
        break;
      }
    }
    if (t < enter.at) op = 0;
  }

  /* 퇴장 */
  if (exit) {
    const dur = exit.dur ?? 0.5;
    const p = interpolate(t, [exit.at, exit.at + dur], [0, 1], easeInOut);
    if (t >= exit.at) {
      switch (exit.style ?? 'fade') {
        case 'fade':
          op *= 1 - p;
          break;
        case 'slide-left':
          dx += p * -22;
          op *= 1 - p * 0.9;
          break;
        case 'slide-right':
          dx += p * 22;
          op *= 1 - p * 0.9;
          break;
        case 'shrink':
          sc *= 1 - p * 0.35;
          op *= 1 - p;
          break;
      }
    }
  }

  /* 미세 bob — 살아있음의 최소 신호 */
  const bobY = bob
    ? Math.sin((t * Math.PI * 2) / (bob.period ?? 2.4)) * (bob.amp ?? 1.2)
    : 0;

  if (op <= 0.001) return null;

  const sw = shadowW ?? h * 0.30;

  return (
    <>
      {shadow && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: `${cx + dx}%`,
            bottom: `${100 - ground}%`,
            width: `${sw}%`,
            aspectRatio: '5 / 1',
            transform: 'translate(-50%, 42%)',
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(6,8,14,0.34), rgba(6,8,14,0) 70%)',
            opacity: op * 0.9,
            zIndex: z - 1,
            pointerEvents: 'none',
          }}
        />
      )}
      <img
        src={url}
        alt={alt}
        style={{
          position: 'absolute',
          left: `${cx + dx}%`,
          bottom: `${100 - ground}%`,
          height: `${h}%`,
          width: 'auto',
          transformOrigin: 'bottom center',
          transform: `translate(-50%, ${dy + bobY}%) scale(${sc})${flip ? ' scaleX(-1)' : ''}`,
          opacity: op,
          zIndex: z,
          pointerEvents: 'none',
          ...style,
        }}
      />
    </>
  );
}

const easeIn = (v: number) => v * v;

/* ══ Layer 3 — 오버레이 ═══════════════════════════════════════════════ */

/** 말풍선 — 나레이션과 분리된 짧은 반말/개그 한 마디. 30~60초당 1회. */
export function Bubble({
  x,
  y,
  at = 0,
  tail = 'bl',
  w = 24,
  tone = 'light',
  children,
  style,
}: {
  x: number;
  y: number;
  at?: number;
  /** 꼬리 방향 = 말하는 배우 쪽 */
  tail?: 'bl' | 'br' | 'tl' | 'tr' | 'none';
  /** 폭(무대 너비 %) */
  w?: number;
  tone?: 'light' | 'dark';
  children: ReactNode;
  style?: CSSProperties;
}) {
  const t = useSceneTime();
  const s = spring(t, at, 0.42);
  if (t < at) return null;
  const light = tone === 'light';
  const origin =
    tail === 'bl' ? 'bottom left' : tail === 'br' ? 'bottom right' : tail === 'tl' ? 'top left' : 'top right';
  const tailStyle: CSSProperties =
    tail === 'none'
      ? {}
      : {
          position: 'absolute',
          width: 0,
          height: 0,
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          [tail.startsWith('b') ? 'borderTop' : 'borderBottom']: `16px solid ${
            light ? '#fff' : 'rgba(16,18,28,0.94)'
          }`,
          [tail.startsWith('b') ? 'bottom' : 'top']: -14,
          [tail.endsWith('l') ? 'left' : 'right']: 22,
        };
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: `${w}%`,
        transform: `translate(-50%, -50%) scale(${0.6 + 0.4 * s})`,
        transformOrigin: origin,
        opacity: Math.min(1, s * 1.8),
        background: light ? '#fff' : 'rgba(16,18,28,0.94)',
        color: light ? '#15171f' : '#f2f4fa',
        border: light ? '2px solid #15171f' : '2px solid rgba(255,255,255,0.22)',
        borderRadius: 22,
        padding: '10px 16px',
        fontWeight: 700,
        fontSize: '1.05rem',
        lineHeight: 1.35,
        wordBreak: 'keep-all',
        textAlign: 'center',
        zIndex: 8,
        ...style,
      }}
    >
      {children}
      {tail !== 'none' && <span aria-hidden style={tailStyle} />}
    </div>
  );
}

/** 정보 라벨 칩 — 지명·유물 캡션·설정. flag=true면 지목 지점까지 깃대가 내려간다. */
export function LabelChip({
  x,
  y,
  at = 0,
  flag = false,
  poleH = 6,
  color = 'var(--primary)',
  children,
  style,
}: {
  x: number;
  y: number;
  at?: number;
  flag?: boolean;
  /** 깃대 길이(무대 높이 %) */
  poleH?: number;
  color?: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const t = useSceneTime();
  const p = interpolate(t, [at, at + 0.35], [0, 1], easeOut);
  if (t < at) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-50%, -100%) translateY(${(1 - p) * 8}px)`,
        opacity: p,
        zIndex: 8,
        ...style,
      }}
    >
      <div
        style={{
          background: 'rgba(255,255,255,0.96)',
          color: '#15171f',
          border: `2px solid ${color}`,
          borderRadius: 8,
          padding: '5px 12px',
          fontWeight: 800,
          fontSize: '0.95rem',
          whiteSpace: 'nowrap',
          boxShadow: '0 6px 18px rgba(0,0,0,0.28)',
        }}
      >
        {children}
      </div>
      {flag && (
        <div
          aria-hidden
          style={{
            width: 2,
            height: `${poleH * p}vh`,
            background: color,
            margin: '0 auto',
          }}
        />
      )}
    </div>
  );
}

/** 스탬프 팻말 — 고유명사·설정을 각인. 기울어진 채 slam-in (Stage shake와 같은 at으로 짝지어라). */
export function Stamp({
  x,
  y,
  at = 0,
  rotate = -6,
  color = '#c2410c',
  scale = 1,
  children,
  style,
}: {
  x: number;
  y: number;
  at?: number;
  rotate?: number;
  color?: string;
  /** 추가 배율 — pulse(t, at) 같은 강조를 곱해 넣는다.
      ⚠ transform이 걸린 래퍼 div로 감싸면 그 div가 absolute의 기준이 되어
      팻말이 무대 밖으로 튄다 (2026-08-18 검수 사고). 반드시 이 prop으로. */
  scale?: number;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const t = useSceneTime();
  if (t < at) return null;
  const p = interpolate(t, [at, at + 0.18], [0, 1], easeOut);
  const sc = (1.9 - 0.9 * p) * scale;
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${sc})`,
        opacity: Math.min(1, p * 2),
        border: `3px solid ${color}`,
        color,
        background: 'rgba(255,252,245,0.93)',
        borderRadius: 6,
        padding: '6px 16px',
        fontWeight: 900,
        fontSize: '1.15rem',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        boxShadow: '0 8px 22px rgba(0,0,0,0.3)',
        zIndex: 9,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

const HAND_FONT_ID = 'diorama-hand-font';

/** 손글씨 주석 — 여백에 사람이 갈겨쓴 한마디. 왼→오른 와이프로 등장. */
export function HandNote({
  x,
  y,
  at = 0,
  dur = 0.7,
  color = '#f5b544',
  size = '1.6rem',
  rotate = -3,
  children,
  style,
}: {
  x: number;
  y: number;
  at?: number;
  dur?: number;
  color?: string;
  size?: string;
  rotate?: number;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const t = useSceneTime();
  // 손글씨 폰트는 이 컴포넌트가 처음 쓰일 때만 지연 로드 (공용 index.html 무수정)
  useEffect(() => {
    if (document.getElementById(HAND_FONT_ID)) return;
    const link = document.createElement('link');
    link.id = HAND_FONT_ID;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&family=Caveat:wght@600&display=swap';
    document.head.appendChild(link);
  }, []);
  if (t < at) return null;
  const p = interpolate(t, [at, at + dur], [0, 1], easeInOut);
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
        color,
        fontFamily: '"Nanum Pen Script", "Caveat", cursive',
        fontSize: size,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
        clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`,
        textShadow: '0 2px 10px rgba(0,0,0,0.35)',
        zIndex: 8,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** 물결 밑줄 — 책·문장·구절 강조. 직선 금지(사람이 그은 선). 왼→오른 드로잉. */
export function WavyUnderline({
  x,
  y,
  w,
  at = 0,
  dur = 0.6,
  color = '#f5b544',
  thickness = 3,
}: {
  /** 밑줄 왼쪽 끝 x(%) */
  x: number;
  y: number;
  /** 길이(무대 너비 %) */
  w: number;
  at?: number;
  dur?: number;
  color?: string;
  thickness?: number;
}) {
  const t = useSceneTime();
  if (t < at) return null;
  const p = interpolate(t, [at, at + dur], [0, 1], easeOut);
  // 진폭·파장을 sin 지터로 불균일하게 — 자로 잰 물결은 다시 기계가 된다
  let d = 'M 0 6';
  const segs = 8;
  for (let i = 0; i < segs; i++) {
    const dx = 100 / segs;
    const amp = 3.2 + Math.sin(i * 3.1) * 1.1;
    d += ` q ${dx / 2} ${i % 2 ? amp : -amp} ${dx} 0`;
  }
  // 드로잉은 clip-path 와이프로 — non-scaling-stroke 아래서는 dash 길이가
  // 방향마다 다르게 늘어나 선이 토막난다 (RouteDraw와 같은 이유).
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: `${w}%`,
        height: 18,
        clipPath: `inset(-40% ${(1 - p) * 100}% -40% 0)`,
        zIndex: 7,
        pointerEvents: 'none',
      }}
    >
      <svg
        viewBox="0 0 100 12"
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
      >
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

/** 항로·연결선 드로잉 — points는 무대 %좌표. ghost=계획선(점선)을 미리 깔아둔다. */
export function RouteDraw({
  points,
  at = 0,
  dur = 1.2,
  color = 'var(--accent)',
  width = 3,
  ghost = false,
  ghostColor = 'rgba(255,255,255,0.35)',
  z = 6,
}: {
  points: [number, number][];
  at?: number;
  dur?: number;
  color?: string;
  width?: number;
  ghost?: boolean;
  ghostColor?: string;
  z?: number;
}) {
  const t = useSceneTime();
  const p = interpolate(t, [at, at + dur], [0, 1], easeInOut);
  const full = toPath(points);
  // 드로잉은 dashoffset이 아니라 **기하로 자른다** — preserveAspectRatio="none"
  // 아래에서 dash 길이가 방향마다 다르게 늘어나 선이 토막나기 때문 (2026-08-18 검수).
  const drawn = toPath(walkPath(points, p).pts);
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: z, pointerEvents: 'none' }}
    >
      {ghost && (
        <path
          d={full}
          fill="none"
          stroke={ghostColor}
          strokeWidth={width}
          strokeDasharray="5 5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
      {p > 0 && (
        <path
          d={drawn}
          fill="none"
          stroke={color}
          strokeWidth={width}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}

const toPath = (pts: [number, number][]) =>
  pts.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt[0]} ${pt[1]}`).join(' ');

/** 폴리라인을 진행률 p(0~1)까지 자른다 — 잘린 점 목록과 현재 위치를 함께 준다. */
function walkPath(
  points: [number, number][],
  p: number
): { pts: [number, number][]; x: number; y: number } {
  if (points.length < 2 || p <= 0) return { pts: [points[0]], x: points[0][0], y: points[0][1] };
  const segs = points.slice(0, -1).map((a, i) => Math.hypot(points[i + 1][0] - a[0], points[i + 1][1] - a[1]));
  const total = segs.reduce((s, v) => s + v, 0);
  let travel = Math.min(1, p) * total;
  const pts: [number, number][] = [points[0]];
  for (let i = 0; i < segs.length; i++) {
    if (travel >= segs[i]) {
      travel -= segs[i];
      pts.push(points[i + 1]);
      continue;
    }
    const r = segs[i] === 0 ? 0 : travel / segs[i];
    const x = points[i][0] + (points[i + 1][0] - points[i][0]) * r;
    const y = points[i][1] + (points[i + 1][1] - points[i][1]) * r;
    pts.push([x, y]);
    return { pts, x, y };
  }
  const last = points[points.length - 1];
  return { pts, x: last[0], y: last[1] };
}

/** 항로 위를 이동하는 말(배·아이콘·배우 축소판). RouteDraw와 같은 points·시각을 준다. */
export function Traveler({
  points,
  at = 0,
  dur = 1.2,
  size = 4,
  children,
  z = 7,
}: {
  points: [number, number][];
  at?: number;
  dur?: number;
  /** 가로 크기(무대 너비 %) */
  size?: number;
  children: ReactNode;
  z?: number;
}) {
  const t = useSceneTime();
  if (t < at) return null;
  const p = interpolate(t, [at, at + dur], [0, 1], easeInOut);
  // 구간 길이 비례로 진행 (RouteDraw와 같은 계산 — 선과 말이 정확히 붙어 간다)
  const { x, y } = walkPath(points, p);
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: `${size}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: z,
        pointerEvents: 'none',
      }}
    >
      {children}
    </div>
  );
}

/* ══ 임팩트 (S13) — 사건의 크기에 비례해서, 숏당 1~3개만 ═══════════════ */

/** 방사 스피드라인 — 팝인·스탬프·놀람의 0.25초 장식. */
export function SpeedLines({
  x,
  y,
  at,
  count = 10,
  size = 16,
  color = 'rgba(255,255,255,0.9)',
  dur = 0.28,
  z = 7,
}: {
  x: number;
  y: number;
  at: number;
  count?: number;
  /** 지름(무대 너비 %) — 정사각 박스라 원형이 유지된다 */
  size?: number;
  color?: string;
  dur?: number;
  z?: number;
}) {
  const t = useSceneTime();
  if (t < at || t > at + dur) return null;
  const p = (t - at) / dur;
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: `${size}%`,
        aspectRatio: '1',
        transform: 'translate(-50%, -50%)',
        zIndex: z,
        pointerEvents: 'none',
      }}
    >
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        {Array.from({ length: count }, (_, i) => {
          const a = (i / count) * Math.PI * 2 + Math.sin(i * 7.3) * 0.12;
          const r0 = 20 + p * 22;
          const r1 = r0 + 12 + Math.sin(i * 4.1) * 4;
          return (
            <line
              key={i}
              x1={50 + Math.cos(a) * r0}
              y1={50 + Math.sin(a) * r0}
              x2={50 + Math.cos(a) * r1}
              y2={50 + Math.sin(a) * r1}
              stroke={color}
              strokeWidth={2.4}
              strokeLinecap="round"
              opacity={1 - p}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
    </div>
  );
}

/** 먼지 puff — 착지·낙하·급정지. 발밑(ground)에 놓는다. */
export function DustPuff({
  x,
  y,
  at,
  size = 9,
  color = 'rgba(240,236,226,0.55)',
  dur = 0.42,
  z = 3,
}: {
  x: number;
  y: number;
  at: number;
  size?: number;
  color?: string;
  dur?: number;
  z?: number;
}) {
  const t = useSceneTime();
  if (t < at || t > at + dur) return null;
  const p = (t - at) / dur;
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: `${size}%`,
        aspectRatio: '1',
        transform: 'translate(-50%, -50%)',
        zIndex: z,
        pointerEvents: 'none',
      }}
    >
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
        {[0, 1, 2].map((i) => {
          const dir = i === 0 ? 0 : i === 1 ? -1 : 1;
          const s = 0.6 + p * (0.9 + i * 0.2);
          return (
            <ellipse
              key={i}
              cx={50 + dir * (14 + p * 16)}
              cy={62 - p * 6 * (i ? 1 : 0.4)}
              rx={16 * s}
              ry={9 * s}
              fill={color}
              opacity={(1 - p) * 0.75}
            />
          );
        })}
      </svg>
    </div>
  );
}

/** 집중선 vignette — 긴장·대치 0.3~0.6초. */
export function FocusVignette({
  at,
  dur = 0.5,
  strength = 0.55,
  z = 6,
}: {
  at: number;
  dur?: number;
  strength?: number;
  z?: number;
}) {
  const t = useSceneTime();
  if (t < at) return null;
  const p = stops(t, [at, at + 0.15, at + dur], [0, 1, 0.65]);
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: z,
        pointerEvents: 'none',
        opacity: p,
        background: `radial-gradient(ellipse at 50% 50%, transparent 32%, rgba(6,8,14,${strength}) 88%)`,
      }}
    />
  );
}

/* ══ 모션 헬퍼 ════════════════════════════════════════════════════════ */

/** 무대 진동 — Stamp 슬램·쿵과 같은 at으로 짝짓는다. frame 결정론(랜덤 금지). */
export function shakeStyle(t: number, at: number, amp = 6, dur = 0.35): CSSProperties {
  if (t < at || t > at + dur) return {};
  const decay = 1 - (t - at) / dur;
  return {
    transform: `translate(${Math.sin(t * 71) * amp * decay}px, ${
      Math.cos(t * 53) * amp * 0.6 * decay
    }px)`,
  };
}

/** 착지 squash — 바닥 기준으로 눌렸다 복귀. */
export function squash(t: number, at: number, dur = 0.28): CSSProperties {
  if (t < at || t > at + dur) return {};
  const p = (t - at) / dur;
  const sy = p < 0.4 ? 1 - 0.2 * (p / 0.4) : 0.8 + 0.25 * ((p - 0.4) / 0.6);
  return { transform: `scaleY(${Math.min(1.05, sy)})`, transformOrigin: 'bottom center' };
}

/** 펄스 강조 — 게이지 도달·칩 갱신에 1회만 (반복 금지). */
export function pulse(t: number, at: number, dur = 0.5): number {
  if (t < at || t > at + dur) return 1;
  const p = (t - at) / dur;
  return 1 + 0.12 * Math.sin(p * Math.PI);
}

/** 고스트 페이드 — 배우 밖의 요소를 같은 문법으로 등장시킬 때. */
export function ghostIn(t: number, at: number, dur = 0.5): CSSProperties {
  if (t < at) return { opacity: 0 };
  return { opacity: stops(t, [at, at + dur * 0.45, at + dur], [0, 0.45, 1]) };
}

/* 타이핑 표현(챕터 카드 제목·질문 칩 생성)은 walkthrough의 역학을 공유한다 —
   S7 "글자는 순차 등장 + 커서 깜빡임", fade-in 일괄 등장 금지. */
export { typed, typedDoneAt, Caret } from '../walkthrough';
