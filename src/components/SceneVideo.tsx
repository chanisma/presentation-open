import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { useDeck } from '../deck/DeckContext';
import { useSceneTime, interpolate } from '../scene';

/* ── SceneVideo — 영상(mp4/webm)을 덱의 두 시간축에 거는 세 가지 방식 ──
   영상은 "움직이는 에셋"이다 — 페이지가 아니라 구성요소.

   ScrubVideo   씬 t(useSceneTime)의 순수 함수로 currentTime을 탐색(seek).
                재생(play)이 아니라 탐색이므로 자동재생 정책과 무관하고,
                같은 t → 같은 프레임 (t-purity). 되감김·핑퐁도 자유.
                ⚠ 소스는 all-intra 재인코딩 필수: ffmpeg … -g 1
                  (키프레임이 성기면 seek이 뚝뚝 끊긴다)
   StepVideo    클릭 빌드가 영상 구간(segments)을 하나씩 재생 — 클릭 축.
                구간 경계에서 자동 정지, 뒤로 가면 그 구간의 끝 프레임.
   AmbientVideo muted 무한 루프 — 무대 텍스처(장식 전용).

   셋 모두 isStatic(썸네일/그리드)에서는 poster 이미지를 렌더한다 —
   허브 격자가 슬라이드마다 영상을 내려받지 않기 위한 규약.
   데모: ?deck=video-demo (영상-에셋-데모) */

const FILL: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
};

export function ScrubVideo({
  src,
  poster,
  time,
  from = 0,
  duration = 6,
  clipStart = 0,
  clipEnd,
  ease,
  className,
  style,
}: {
  src: string;
  /** isStatic(썸네일)에서 대신 렌더할 정지 이미지 */
  poster: string;
  /** 영상 쪽 목표 시각(초) 직접 제어 — 지정하면 아래 선형 사상은 무시.
      호출부에서 t의 순수 함수로 계산해 넘길 것 (핑퐁·이징 등 자유) */
  time?: number;
  /** 선형 사상: 씬 t가 [from, from+duration]일 때 clip [clipStart, clipEnd] */
  from?: number;
  duration?: number;
  clipStart?: number;
  /** 기본값: 영상 전체 길이 */
  clipEnd?: number;
  ease?: (x: number) => number;
  className?: string;
  style?: CSSProperties;
}) {
  const t = useSceneTime();
  const { isStatic } = useDeck();
  const ref = useRef<HTMLVideoElement>(null);
  const pendingRef = useRef(0);

  const targetOf = (v: HTMLVideoElement) =>
    time !== undefined
      ? Math.max(0, Math.min(v.duration || 0, time))
      : interpolate(t, [from, from + duration], [clipStart, clipEnd ?? v.duration ?? 0], ease);

  // 매 렌더(t 변화)마다 목표 프레임으로 수렴 — seek은 비동기라
  // seeking 중엔 pending에 담아두고 onSeeked에서 이어받는다.
  useEffect(() => {
    if (isStatic) return;
    const v = ref.current;
    if (!v || v.readyState < 1) return;
    const target = targetOf(v);
    pendingRef.current = target;
    if (!v.seeking && Math.abs(v.currentTime - target) > 1 / 60) v.currentTime = target;
  });

  if (isStatic)
    return <img src={poster} alt="" className={className} style={{ ...FILL, ...style }} />;

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      playsInline
      preload="auto"
      className={className}
      style={{ ...FILL, ...style }}
      onLoadedMetadata={(e) => {
        const v = e.currentTarget;
        v.currentTime = targetOf(v);
      }}
      onSeeked={(e) => {
        const v = e.currentTarget;
        if (Math.abs(v.currentTime - pendingRef.current) > 1 / 60)
          v.currentTime = pendingRef.current;
      }}
    />
  );
}

export function StepVideo({
  src,
  poster,
  segments,
  at = 1,
  auto = false,
  className,
  style,
}: {
  src: string;
  poster: string;
  /** 구간 끝 시각(초), 오름차순 — 클릭 at이 [0, segments[0]]을 재생,
      클릭 at+1이 [segments[0], segments[1]]을… 마지막 값은 영상 끝. */
  segments: number[];
  /** 첫 구간을 재생할 클릭 번호 (1-based) */
  at?: number;
  /** true면 첫 구간은 슬라이드 진입과 함께 자동 재생 —
      클릭 1이 두 번째 구간을 맡는다 (전면 영상 페이지용) */
  auto?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const { clicks, isStatic, registerMax } = useDeck();
  const ref = useRef<HTMLVideoElement>(null);
  const prevStepRef = useRef(0);
  const stopAtRef = useRef<number | null>(null);
  const firstRunRef = useRef(true);
  const autoOffset = auto ? 1 : 0;

  useEffect(() => {
    registerMax?.(at + segments.length - 1 - autoOffset);
  }, [at, segments.length, registerMax, autoOffset]);

  // 완료되어야 할 구간 수 (0 = 아직 첫 프레임)
  const step = Math.max(0, Math.min(segments.length, clicks - at + 1 + autoOffset));

  useEffect(() => {
    if (isStatic) return;
    const v = ref.current;
    if (!v) return;
    const prev = prevStepRef.current;
    const firstRun = firstRunRef.current;
    firstRunRef.current = false;
    if (step === prev) return;
    prevStepRef.current = step;
    const bounds = [0, ...segments];
    // 뒤로 넘어와 클릭 상태가 복원된 채 마운트 — 재생 없이 그 단계의 끝 프레임에 선다
    if (firstRun && step > autoOffset) {
      stopAtRef.current = null;
      v.pause();
      const seekTo = bounds[step];
      if (v.readyState >= 1) v.currentTime = seekTo;
      else v.addEventListener('loadedmetadata', () => (v.currentTime = seekTo), { once: true });
      return;
    }
    if (step > prev) {
      // 앞으로: 목표 구간의 시작점에서 끝점까지 재생 (여러 단계 점프면 마지막 구간만)
      v.currentTime = bounds[step - 1];
      stopAtRef.current = bounds[step];
      v.play().catch(() => {});
    } else {
      // 뒤로: 그 단계의 끝 프레임에서 정지
      stopAtRef.current = null;
      v.pause();
      v.currentTime = bounds[step];
    }
  }, [step, isStatic, segments, at]);

  // 정지점 감시 — timeupdate(~4Hz)는 구간 끝을 지나치므로 rAF로 조인다
  useEffect(() => {
    if (isStatic) return;
    let raf = 0;
    const tick = () => {
      const v = ref.current;
      const stop = stopAtRef.current;
      if (v && stop != null && !v.paused && v.currentTime >= stop - 1 / 30) {
        v.pause();
        v.currentTime = stop;
        stopAtRef.current = null;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isStatic]);

  if (isStatic)
    return <img src={poster} alt="" className={className} style={{ ...FILL, ...style }} />;

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      playsInline
      preload="auto"
      className={className}
      style={{ ...FILL, ...style }}
    />
  );
}

export function AmbientVideo({
  src,
  poster,
  className,
  style,
}: {
  src: string;
  poster: string;
  className?: string;
  style?: CSSProperties;
}) {
  const { isStatic } = useDeck();
  if (isStatic)
    return <img src={poster} alt="" className={className} style={{ ...FILL, ...style }} />;
  return (
    <video
      src={src}
      poster={poster}
      muted
      loop
      autoPlay
      playsInline
      preload="auto"
      className={className}
      style={{ ...FILL, ...style }}
    />
  );
}
