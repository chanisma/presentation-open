import { useMemo, type CSSProperties, type ReactNode } from 'react';
import {
  useSceneTime,
  useRegisterSceneTimeline,
  interpolate,
  easeInOut,
  spring,
} from '../scene';

/* ── Walkthrough — 소프트웨어 절차 시연의 "역학" 계층 ──────────────────
   웹사이트·설치 프로그램·CLI에서 벌어지는 절차(클릭·타이핑·창 전환)를
   씬으로 시연할 때 쓰는 기계 장치 모음. interpolate/spring과 같은 급의
   기능 유틸이다 — 목업 UI(사이트 구조·다이얼로그 내용)는 씬마다 자유
   JSX/SVG로 저작하고, 이 모듈은 포인터·타이핑·창 크롬만 담당한다.

   모든 모션은 useSceneTime() t의 순수 함수 (scene-grammar 결정론 규칙).
   좌표 규약: Pointer의 x/y는 <Scene> 컨테이너의 % — 창들을 절대배치한 뒤
   클릭 대상의 씬 기준 %를 웨이포인트로 적는다. Pointer는 z-order 최상단이
   되도록 Scene의 마지막 자식으로 둔다. */

/* ── 포인터 ── */

export type CursorKey = {
  /** 이 지점에 도착하는 시각(초) */
  t: number;
  /** 씬 컨테이너 기준 % 좌표 */
  x: number;
  y: number;
  /** 도착 직후 클릭 파동 + 커서 눌림 연출 */
  click?: boolean;
  /** 프레젠터 타임라인에 표시할 절차 이름 */
  label?: string;
  /** 이 지점 이후 포인터 퇴장 (타이핑 국면 등) — 이후 키는 무시된다 */
  hide?: boolean;
};

/** path를 따라 움직이는 마우스 포인터. 첫 키 직전에 페이드인. */
export function Pointer({
  path,
  size = 30,
  color = 'var(--primary)',
  timelineEnd,
}: {
  path: CursorKey[];
  size?: number;
  /** 클릭 파동 색 */
  color?: string;
  /** 포인터 퇴장 뒤에도 장면이 진행되는 walkthrough의 총 길이 */
  timelineEnd?: number;
}) {
  const t = useSceneTime();
  const timelineSignature = path
    .map((key) => `${key.t}:${key.click ? 1 : 0}:${key.label ?? ''}`)
    .join('|');
  const timeline = useMemo(() => {
    if (path.length === 0) return null;
    const labeled = path.filter((key) => key.label);
    const markerKeys = labeled.length > 0 ? labeled : path.filter((key) => key.click);
    return {
      duration:
        timelineEnd ?? Math.max(...path.map((key) => key.t)) + 0.8,
      markers: markerKeys.map((key, index) => ({
        time: key.t,
        label: key.label ?? `단계 ${index + 1}`,
      })),
    };
  }, [path.length, timelineEnd, timelineSignature]);
  useRegisterSceneTimeline(timeline);
  if (path.length === 0) return null;

  let x = path[0].x;
  let y = path[0].y;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    if (t >= a.t) {
      // 클릭한 지점에서는 0.35s 머문 뒤 출발 — 클릭이 눈에 읽히게
      const start = a.click ? Math.min(a.t + 0.35, (a.t + b.t) / 2) : a.t;
      x = interpolate(t, [start, b.t], [a.x, b.x], easeInOut);
      y = interpolate(t, [start, b.t], [a.y, b.y], easeInOut);
    }
  }

  let opacity = interpolate(t, [path[0].t - 0.35, path[0].t], [0, 1]);
  // hide는 "다음 웨이포인트까지만" 숨긴다 — 타이핑 국면마다 퇴장했다 돌아올 수 있다.
  // hide 뒤에 키가 없으면 그대로 퇴장한다(마지막 hide = 씬 종료 연출).
  for (let i = 0; i < path.length; i++) {
    const k = path[i];
    if (!k.hide || t <= k.t) continue;
    const next = path[i + 1];
    const fadeOut = interpolate(t, [k.t + 0.15, k.t + 0.55], [1, 0]);
    const fadeBack = next ? interpolate(t, [next.t - 0.45, next.t - 0.05], [0, 1]) : 0;
    opacity *= Math.max(fadeOut, fadeBack);
  }

  // 클릭 눌림: 클릭 시각 근처에서 살짝 움츠렸다 복귀
  let dip = 1;
  for (const k of path) {
    if (k.click && t >= k.t && t <= k.t + 0.3)
      dip = 1 - 0.16 * Math.sin((Math.PI * (t - k.t)) / 0.3);
  }

  return (
    <>
      {/* 클릭 파동 — 포인터가 아니라 "클릭한 지점"(씬 좌표)에 고정된 확장 링 */}
      {path.map((k, i) => {
        if (!k.click || t < k.t || t > k.t + 0.55) return null;
        const p = (t - k.t) / 0.55;
        const d = 10 + p * 44;
        return (
          <span
            key={i}
            aria-hidden
            style={{
              position: 'absolute',
              left: `${k.x}%`,
              top: `${k.y}%`,
              width: d,
              height: d,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              border: `2.5px solid ${color}`,
              opacity: 0.9 * (1 - p) * opacity,
              zIndex: 59,
              pointerEvents: 'none',
            }}
          />
        );
      })}
      <div
        aria-hidden
        /* 검산용 표식 — scripts/measure_pointer.mjs가 화살촉 끝 좌표를 계산한다 */
        data-walkthrough-pointer=""
        data-pointer-size={size}
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          // 화살촉(viewBox의 4,2)이 웨이포인트와 정확히 겹치게 한다.
          transform: `translate(${-size / 6}px, ${-size / 12}px)`,
          zIndex: 60,
          pointerEvents: 'none',
          opacity,
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          style={{ display: 'block', transform: `scale(${dip})`, transformOrigin: '16.667% 8.333%' }}
        >
          {/* 화살표 팁 = (4,2) = 웨이포인트 좌표점 */}
          <path
            d="M4 2 L4 18.6 L8.4 14.9 L11.1 20.8 L13.8 19.5 L11 13.8 L16.6 13.2 Z"
            fill="#fdfdfd"
            stroke="#12141c"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </>
  );
}

/** 클릭 순간 목업 버튼을 빛나게 — at 이후 dur 동안 1→0 강도 */
export function clickFlash(t: number, at: number, dur = 0.5): number {
  if (t < at) return 0;
  return Math.max(0, 1 - (t - at) / dur);
}

/* ── 타이핑 ── */

/** delay 이후 cps(초당 글자)로 드러나는 부분 문자열 — CLI/폼 입력 시연용 */
export function typed(t: number, text: string, delay = 0, cps = 14): string {
  const n = Math.floor((t - delay) * cps);
  return n <= 0 ? '' : text.slice(0, Math.min(text.length, n));
}

/** 타이핑 완료 시각(초) — 출력 라인 등장 타이밍 계산용 */
export function typedDoneAt(text: string, delay = 0, cps = 14): number {
  return delay + text.length / cps;
}

/** 깜빡이는 블록 캐럿 (t 기반 — 결정론) */
export function Caret({ color = 'var(--primary)' }: { color?: string }) {
  const t = useSceneTime();
  const on = Math.floor(t * 2.2) % 2 === 0;
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: '0.55em',
        height: '1.05em',
        marginLeft: 2,
        verticalAlign: 'text-bottom',
        background: color,
        borderRadius: 2,
        opacity: on ? 1 : 0.15,
      }}
    />
  );
}

/* ── 창 등장·퇴장 ── */

/** 창 팝 등장 — at 이후 스프링으로 떠오름. style에 spread */
export function popIn(t: number, at: number, dur = 0.6): CSSProperties {
  const s = spring(t, at, dur);
  return {
    opacity: Math.min(1, s * 1.5),
    transform: `translateY(${(1 - s) * 22}px) scale(${0.88 + 0.12 * s})`,
  };
}

/** 다음 단계로 넘어간 창을 뒤로 물리기 — popIn 뒤에 spread (t≤at면 무효).
    opacity가 아니라 밝기/채도 필터로 어둡게 — 창이 반투명해지면 뒤의
    연결선·창이 비쳐 보이므로 불투명을 유지한다 */
export function dimAfter(t: number, at: number, to = 0.45): CSSProperties {
  if (t <= at) return {};
  const k = interpolate(t, [at, at + 0.6], [1, to], easeInOut);
  return { filter: `brightness(${k}) saturate(${0.5 + 0.5 * k})` };
}

/* ── 창 크롬 ── */

export type WindowKind = 'browser' | 'installer' | 'terminal' | 'app';

const winDot: CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: '50%',
  background: 'var(--hair)',
  display: 'inline-block',
  flexShrink: 0,
};

/** 절차 시연용 창 셸 — 크롬(제목줄)만 제공, 본문은 자유 저작.
    style로 절대배치·popIn·dimAfter를 조합한다. badge는 절차 순번(①…). */
export function AppWindow({
  kind = 'app',
  title,
  url,
  badge,
  style,
  bodyStyle,
  children,
}: {
  kind?: WindowKind;
  /** installer/terminal/app 제목줄 텍스트 */
  title?: string;
  /** browser 주소창 텍스트 */
  url?: string;
  /** 절차 순번 뱃지 — 창 좌상단 밖에 걸치는 원형 칩 */
  badge?: string;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
  children: ReactNode;
}) {
  const isTerm = kind === 'terminal';
  return (
    <div
      style={{
        position: 'absolute',
        borderRadius: 14,
        border: '1px solid var(--hair)',
        /* 겹치는 창들이 서로 비치지 않도록 불투명 배경 (surface 토큰은 반투명) */
        background: isTerm
          ? 'color-mix(in srgb, var(--fg) 3%, var(--bg))'
          : 'color-mix(in srgb, var(--fg) 8%, var(--bg))',
        boxShadow: 'var(--shadow)',
        ...style,
      }}
    >
      {badge && (
        <span
          style={{
            position: 'absolute',
            left: -13,
            top: -13,
            zIndex: 2,
            width: 30,
            height: 30,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'var(--font-mono)',
            fontWeight: 800,
            fontSize: 15,
            background: 'var(--primary)',
            color: 'var(--accent-ink)',
            boxShadow: 'var(--glow)',
          }}
        >
          {badge}
        </span>
      )}
      <div
        style={{
          borderRadius: 'inherit',
          overflow: 'hidden',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 제목줄 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 14px',
            background: isTerm
              ? 'color-mix(in srgb, var(--fg) 7%, var(--bg))'
              : 'color-mix(in srgb, var(--fg) 5%, transparent)',
            borderBottom: '1px solid var(--hair-2)',
          }}
        >
          {kind === 'installer' ? (
            <>
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: 'var(--fg-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {title}
              </span>
              <span
                aria-hidden
                style={{
                  marginLeft: 'auto',
                  display: 'flex',
                  gap: 14,
                  color: 'var(--fg-faint)',
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <span>─</span>
                <span>▢</span>
                <span>✕</span>
              </span>
            </>
          ) : (
            <>
              <span style={{ display: 'flex', gap: 6 }} aria-hidden>
                <i style={winDot} />
                <i style={winDot} />
                <i style={winDot} />
              </span>
              {kind === 'browser' ? (
                <span
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11.5,
                    color: 'var(--fg-muted)',
                    background: 'color-mix(in srgb, var(--fg) 8%, transparent)',
                    borderRadius: 999,
                    padding: '4px 13px',
                    minWidth: 0,
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {url}
                  </span>
                </span>
              ) : (
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: 'var(--fg-faint)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {title}
                </span>
              )}
            </>
          )}
        </div>
        {/* 본문 — 자유 저작 영역 */}
        <div
          style={{
            position: 'relative',
            flex: 1,
            minHeight: 0,
            ...(isTerm
              ? {
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'clamp(12px, 1.3vw, 14.5px)',
                  lineHeight: 1.85,
                  textAlign: 'left' as const,
                  padding: 'clamp(12px, 1.6vw, 18px)',
                }
              : {}),
            ...bodyStyle,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
