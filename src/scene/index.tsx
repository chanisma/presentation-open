import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useDeck } from '../deck/DeckContext';

/* ── Scene — 결정론적 씬 타임라인 (dynamic-scene의 React/TS 구조) ─────
   newVideoGen(Remotion)의 프레임 드리븐 컴포지션 구조를 덱 엔진에 맞게
   초 단위로 옮긴 런타임. 씬의 모든 모션은 "슬라이드 활성 후 경과 시간 t"의
   순수 함수여야 한다 — 렌더마다 같은 t면 같은 화면 (Remotion 원칙).

   레거시 HTML 덱의 SceneMotion(deck.js) + window.interpolate/springy와
   같은 수학을 쓰므로 저작 감각이 그대로 이식된다.

   사용:
     <Slide full nav="도입">
       <Scene>
         <MyVisual />   // 내부에서 const t = useSceneTime();
       </Scene>
     </Slide>

   썸네일/그리드(isStatic)에서는 t가 freezeAt으로 고정되어
   애니메이션 완료 상태의 정지 화면이 렌더된다. */

const SceneTimeCtx = createContext(9999);

export type SceneTimelineMarker = {
  time: number;
  label: string;
};

export type SceneTimeline = {
  duration: number;
  markers?: SceneTimelineMarker[];
};

export type ScenePlaybackState = {
  time: number;
  /** null이면 종료 시각 없이 계속 재생되는 Scene */
  duration: number | null;
  playing: boolean;
  markers: SceneTimelineMarker[];
};

export type SceneControl = {
  action: 'play' | 'pause' | 'seek' | 'seekBy' | 'restart';
  time?: number;
};

export const SCENE_STATE_EVENT = 'deck-scene-state';
export const SCENE_CONTROL_EVENT = 'deck-scene-control';
const EMPTY_SCENE_MARKERS: SceneTimelineMarker[] = [];

type TimelineRegistration = (id: string, timeline: SceneTimeline | null) => void;
const SceneTimelineRegistrationCtx = createContext<TimelineRegistration | null>(null);

/** 슬라이드 활성 후 경과 초. <Scene> 안에서만 유효 */
export function useSceneTime(): number {
  return useContext(SceneTimeCtx);
}

/** Pointer 같은 walkthrough 구성요소가 가장 가까운 Scene에 타임라인을 등록한다. */
export function useRegisterSceneTimeline(timeline: SceneTimeline | null) {
  const register = useContext(SceneTimelineRegistrationCtx);
  const id = useId();
  const signature = timeline
    ? `${timeline.duration}|${(timeline.markers ?? [])
        .map((marker) => `${marker.time}:${marker.label}`)
        .join('|')}`
    : '';

  useEffect(() => {
    if (!register || !timeline) return;
    register(id, timeline);
    return () => register(id, null);
  }, [id, register, signature]);
}

export function Scene({
  children,
  freezeAt = 9999,
  duration,
  markers = EMPTY_SCENE_MARKERS,
  className,
  style,
}: {
  children: ReactNode;
  /** 썸네일(isStatic)에서 고정할 t — 기본은 모든 모션 완료 상태 */
  freezeAt?: number;
  /** 내비게이션 타임 슬라이더의 끝 시각. 생략 시 등록된 walkthrough 길이를 사용한다. */
  duration?: number;
  /** 절차의 주요 시점을 나타내는 선택적 메타데이터. */
  markers?: SceneTimelineMarker[];
  className?: string;
  style?: CSSProperties;
}) {
  const { isStatic } = useDeck();
  const [registrations, setRegistrations] = useState<Record<string, SceneTimeline>>({});
  const [t, setT] = useState(isStatic ? freezeAt : 0);
  const [playing, setPlaying] = useState(!isStatic);
  const timeRef = useRef(t);
  const playBaseRef = useRef(t);
  const playStartedRef = useRef(0);
  const lastReportRef = useRef(0);

  const registerTimeline = useCallback<TimelineRegistration>((id, timeline) => {
    setRegistrations((current) => {
      if (!timeline) {
        if (!(id in current)) return current;
        const next = { ...current };
        delete next[id];
        return next;
      }
      const previous = current[id];
      if (
        previous?.duration === timeline.duration &&
        JSON.stringify(previous.markers ?? []) === JSON.stringify(timeline.markers ?? [])
      )
        return current;
      return { ...current, [id]: timeline };
    });
  }, []);

  const timeline = useMemo<SceneTimeline | null>(() => {
    const registered = Object.values(registrations);
    const registeredDuration = registered.reduce(
      (longest, item) => Math.max(longest, item.duration),
      0
    );
    const resolvedDuration =
      duration ?? (registeredDuration || (freezeAt < 9999 ? freezeAt : null));
    if (resolvedDuration === null) return null;
    const allMarkers = [
      ...markers,
      ...registered.flatMap((item) => item.markers ?? []),
    ]
      .filter((marker) => Number.isFinite(marker.time) && marker.time >= 0)
      .sort((a, b) => a.time - b.time)
      .filter(
        (marker, index, list) =>
          index === 0 ||
          marker.time !== list[index - 1].time ||
          marker.label !== list[index - 1].label
      );
    return {
      duration: Math.max(0.1, resolvedDuration),
      markers: allMarkers,
    };
  }, [duration, freezeAt, markers, registrations]);
  const timelineRef = useRef(timeline);
  timelineRef.current = timeline;

  useEffect(() => {
    if (isStatic) return;
    if (!playing) return;
    let raf = 0;
    playBaseRef.current = timeRef.current;
    playStartedRef.current = performance.now();
    const loop = (now: number) => {
      const end = timelineRef.current?.duration;
      const elapsed = playBaseRef.current + (now - playStartedRef.current) / 1000;
      const next = end === undefined ? elapsed : Math.min(end, elapsed);
      timeRef.current = next;
      setT(next);
      if (end !== undefined && next >= end) {
        setPlaying(false);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isStatic, playing, timeline?.duration]);

  useEffect(() => {
    if (isStatic) return;
    const onControl = (event: Event) => {
      const control = (event as CustomEvent<SceneControl>).detail;
      if (!control) return;
      const end = timelineRef.current?.duration;
      const setPosition = (value: number) => {
        const next = Math.max(0, end === undefined ? value : Math.min(end, value));
        timeRef.current = next;
        playBaseRef.current = next;
        playStartedRef.current = performance.now();
        setT(next);
        return next;
      };

      if (control.action === 'seek') {
        setPosition(control.time ?? timeRef.current);
        setPlaying(false);
      } else if (control.action === 'seekBy') {
        setPosition(timeRef.current + (control.time ?? 0));
        setPlaying(false);
      } else if (control.action === 'pause') {
        if (control.time !== undefined) setPosition(control.time);
        setPlaying(false);
      } else if (control.action === 'play') {
        const requested = control.time ?? timeRef.current;
        setPosition(end !== undefined && requested >= end ? 0 : requested);
        setPlaying(true);
      } else if (control.action === 'restart') {
        setPosition(0);
        setPlaying(true);
      }
    };
    window.addEventListener(SCENE_CONTROL_EVENT, onControl);
    return () => window.removeEventListener(SCENE_CONTROL_EVENT, onControl);
  }, [isStatic]);

  useEffect(() => {
    if (isStatic) return;
    const now = performance.now();
    if (playing && t > 0 && now - lastReportRef.current < 80) return;
    lastReportRef.current = now;
    const detail: ScenePlaybackState = {
      time: t,
      duration: timeline?.duration ?? null,
      playing,
      markers: timeline?.markers ?? [],
    };
    window.dispatchEvent(new CustomEvent(SCENE_STATE_EVENT, { detail }));
  }, [isStatic, playing, t, timeline]);

  useEffect(() => {
    if (isStatic) return;
    return () => {
      window.dispatchEvent(new CustomEvent(SCENE_STATE_EVENT, { detail: null }));
    };
  }, [isStatic]);

  return (
    <SceneTimelineRegistrationCtx.Provider value={registerTimeline}>
      <SceneTimeCtx.Provider value={t}>
        {/* data-scene-root: 덱 크롬이 '씬 있는 슬라이드'를 감지해 재생 버튼을 띄운다 */}
        <div
          className={className}
          data-scene-root=""
          data-scene-time={isStatic ? undefined : t.toFixed(3)}
          data-scene-duration={isStatic ? undefined : timeline?.duration}
          data-scene-playing={isStatic ? undefined : playing ? 'true' : 'false'}
          style={{ position: 'relative', width: '100%', height: '100%', ...style }}
        >
          {children}
        </div>
      </SceneTimeCtx.Provider>
    </SceneTimelineRegistrationCtx.Provider>
  );
}

/* ── 타임라인 수학 (deck.js 전역판과 동일 — 저작 호환) ── */

/** t를 [tin0,tin1] → [tout0,tout1]로 사상 (기본 clamp) */
export function interpolate(
  t: number,
  tin: [number, number],
  tout: [number, number],
  ease?: (x: number) => number
): number {
  let x = (t - tin[0]) / (tin[1] - tin[0]);
  x = Math.max(0, Math.min(1, x));
  if (ease) x = ease(x);
  return tout[0] + (tout[1] - tout[0]) * x;
}

export const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeInOut = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

/** 오버슈트 스프링: delay 후 duration 동안 0→1 (살짝 튕김) */
export function spring(t: number, delay = 0, duration = 0.8): number {
  const x = Math.max(0, Math.min(1, (t - delay) / duration));
  if (x === 0 || x === 1) return x;
  return 1 - Math.exp(-6 * x) * Math.cos(12 * x) * (1 - x);
}

/** spring 진입 헬퍼 — opacity + translateY를 한 번에 */
export function riseIn(
  t: number,
  delay = 0,
  duration = 0.8,
  distance = 26
): CSSProperties {
  const s = spring(t, delay, duration);
  return {
    opacity: Math.min(1, s * 1.4),
    transform: `translateY(${(1 - s) * distance}px)`,
  };
}
