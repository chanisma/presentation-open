import type { CSSProperties, ReactNode } from 'react';
import { useDeck } from '../../../../src/deck/DeckContext';
import { C, MONO, SHOT, camAt, toPx, type Cam, type Frame } from '../kit';

/* 8~14장 공용 부품 — 이미지(패널 캡처처럼 1920×1080이 아닌 실화면)를 덱 위에 직접 놓을 때의 좌표 환산과,
   빌드 장에서 «클릭 수 → 카메라·컷»으로 움직이는 실화면 틀. 구도·메타포는 장마다 자유 JSX다. */

/** 클릭 수(빌드 단계). 썸네일에서는 마지막 단계 */
export function useStep(max: number): number {
  const { clicks, isStatic } = useDeck();
  return isStatic ? max : Math.min(max, Math.max(0, clicks));
}

/** 덱 위에 놓은 이미지 — 왼쪽 위 (x, y), 배율 k (이미지 px × k = 덱 px) */
export type Box = { x: number; y: number; k: number };
/** 이미지 사각형(px) → 덱 위 절대 위치 */
export const onBox = (b: Box, r: readonly number[]): CSSProperties => ({
  position: 'absolute', left: b.x + r[0] * b.k, top: b.y + r[1] * b.k, width: r[2] * b.k, height: r[3] * b.k,
});
/** 이미지 좌표(px) → 씬 % (Cursor 경로용) */
export const ptBox = (b: Box, x: number, y: number) => ({ x: ((b.x + x * b.k) / 1920) * 100, y: ((b.y + y * b.k) / 1080) * 100 });
/** 사각형 중심의 씬 % */
export const midBox = (b: Box, r: readonly number[]) => ptBox(b, r[0] + r[2] / 2, r[1] + r[3] / 2);

/** 덱 위 강조 상자 (on 0~1, CSS 전환) */
export function Hi({ style, on, label, side = 'right', color = C.gold, size = 20 }: {
  style: CSSProperties; on: number; label?: ReactNode; side?: 'top' | 'bottom' | 'left' | 'right'; color?: string; size?: number;
}) {
  const pos: CSSProperties = side === 'top' ? { left: 0, bottom: '100%', marginBottom: 8 }
    : side === 'bottom' ? { left: 0, top: '100%', marginTop: 8 }
    : side === 'left' ? { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 12 }
    : { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 12 };
  return (
    <div style={{ ...style, zIndex: 40, opacity: on, transition: 'opacity .35s', borderRadius: 10, border: `3px solid ${color}`, pointerEvents: 'none',
      boxShadow: `0 0 0 6px color-mix(in srgb, ${color} 20%, transparent), 0 0 22px color-mix(in srgb, ${color} 40%, transparent)` }}>
      {label && <span style={{ position: 'absolute', ...pos, whiteSpace: 'nowrap', fontSize: size, fontWeight: 700, color: '#fff', background: color, borderRadius: 8, padding: '4px 12px' }}>{label}</span>}
    </div>
  );
}

/** 키 모양 칩 (Enter · 1 · Esc) */
export function Keycap({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <span style={{ display: 'inline-grid', placeItems: 'center', minWidth: 44, height: 44, padding: '0 12px', borderRadius: 9, fontFamily: MONO, fontSize: 20, fontWeight: 700,
      color: C.ink, background: '#fff', border: '1.5px solid rgba(31,27,22,.25)', boxShadow: '0 4px 0 rgba(31,27,22,.18)', ...style }}>{children}</span>
  );
}

/** 빌드 장의 실화면 틀 — 단계마다 컷(이미지 이름)과 카메라(cx·cy·z)를 바꾸고 CSS로 부드럽게 옮긴다.
    좌표는 원본 1920×1080 px. children은 틀 안(틀 왼쪽 위 기준 px). */
export function BuildFrame({ frame, step, shots, cams, children }: {
  frame: Frame; step: number; shots: string[]; cams: { cx: number; cy: number; z: number }[]; children?: ReactNode;
}) {
  const cam = stepCam(cams, step);
  const s = (frame.w / 1920) * cam.z;
  const names = [...new Set(shots)];
  return (
    <div style={{ position: 'absolute', left: frame.x, top: frame.y, width: frame.w, height: frame.h }}>
      <div style={{ position: 'absolute', inset: -6, borderRadius: 16, border: '1.5px solid rgba(31,27,22,.18)', boxShadow: '0 30px 70px -30px rgba(31,27,22,.45)' }} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: 10, overflow: 'hidden', background: C.term }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: '0 0', transition: 'transform .7s cubic-bezier(.4,0,.2,1)',
          transform: `translate(${frame.w / 2 - cam.cx * s}px, ${frame.h / 2 - cam.cy * s}px) scale(${s})` }}>
          {names.map((n) => (
            <img key={n} src={SHOT(n)} alt="" draggable={false}
              style={{ position: 'absolute', inset: 0, width: 1920, height: 1080, opacity: shots[Math.min(step, shots.length - 1)] === n ? 1 : 0, transition: 'opacity .45s' }} />
          ))}
        </div>
        {children}
      </div>
    </div>
  );
}
/** 단계 카메라(화면 밖이 보이지 않게 조인 값) */
export function stepCam(cams: { cx: number; cy: number; z: number }[], step: number): Cam {
  const c = cams[Math.min(step, cams.length - 1)];
  return camAt([{ t: 0, ...c }], 0);
}
/** 빌드 틀 안 강조 상자 위치(틀 왼쪽 위 기준 px) */
export function inFrame(frame: Frame, cam: Cam, r: readonly number[]): CSSProperties {
  const a = toPx(r[0], r[1], cam, frame);
  const b = toPx(r[0] + r[2], r[1] + r[3], cam, frame);
  return { position: 'absolute', left: a.x - frame.x, top: a.y - frame.y, width: b.x - a.x, height: b.y - a.y, transition: 'all .7s cubic-bezier(.4,0,.2,1)' };
}
