import type { CSSProperties, ReactNode } from 'react';
import { C, MONO, SHOT } from '../kit';

/* 22~27장 공용 부품 — 실화면을 «화면 틀» 없이 덱 위에 직접 놓을 때 쓴다.
   nat = 원본 이미지 크기(px). 패널(A-03~A-11)은 808×1008, 교사판 독(A-01·A-02)은 3200×400,
   학생판 독(A-13)은 2400×400, 터미널(B-*)은 1920×1080. */

export const NAT = {
  panel: [808, 1008] as [number, number],
  dock: [3200, 400] as [number, number],
  studentDock: [2400, 400] as [number, number],
  term: [1920, 1080] as [number, number],
};

/** 실화면의 일부(region, 원본 px)를 폭 w로 잘라 보인다 */
export function Crop({ name, nat, region, w, style, radius = 10 }: {
  name: string; nat: [number, number]; region: [number, number, number, number]; w: number; style?: CSSProperties; radius?: number;
}) {
  const k = w / region[2];
  return (
    <div style={{
      position: 'absolute', width: w, height: region[3] * k, borderRadius: radius, overflow: 'hidden',
      backgroundImage: `url("${SHOT(name)}")`, backgroundSize: `${nat[0] * k}px ${nat[1] * k}px`,
      backgroundPosition: `${-region[0] * k}px ${-region[1] * k}px`, backgroundRepeat: 'no-repeat',
      boxShadow: '0 14px 36px -18px rgba(31,27,22,.45)', ...style,
    }} />
  );
}

/** 놓인 이미지(x·y·폭 w) 위 원본 사각형 → 덱 px 상자 */
export function boxOn(pic: { x: number; y: number; w: number; nat: [number, number] }, r: [number, number, number, number]) {
  const k = pic.w / pic.nat[0];
  return { left: pic.x + r[0] * k, top: pic.y + r[1] * k, width: r[2] * k, height: r[3] * k };
}

/** 덱 px 상자에 그리는 강조 테두리(+라벨) */
export function Ring({ box, k = 1, label, side = 'top', color = C.gold, size = 19 }: {
  box: { left: number; top: number; width: number; height: number }; k?: number; label?: ReactNode; side?: 'top' | 'bottom' | 'left' | 'right'; color?: string; size?: number;
}) {
  if (k <= 0) return null;
  const pos: CSSProperties = side === 'top' ? { left: 0, bottom: '100%', marginBottom: 8 }
    : side === 'bottom' ? { left: 0, top: '100%', marginTop: 8 }
    : side === 'left' ? { right: '100%', top: 0, marginRight: 10 } : { left: '100%', top: 0, marginLeft: 10 };
  return (
    <div style={{ position: 'absolute', ...box, zIndex: 40, opacity: k, borderRadius: 10, border: `3px solid ${color}`,
      boxShadow: `0 0 0 6px color-mix(in srgb, ${color} 20%, transparent)` }}>
      {label && <span style={{ position: 'absolute', ...pos, whiteSpace: 'nowrap', fontSize: size, fontWeight: 700, color: '#fff', background: color, borderRadius: 8, padding: '4px 12px' }}>{label}</span>}
    </div>
  );
}

/** 키보드 키 칩 — 터미널은 마우스 대신 키로 고른다 */
export function KeyCap({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <span style={{ display: 'inline-grid', placeItems: 'center', minWidth: 44, height: 44, padding: '0 12px', borderRadius: 9,
      background: '#fff', border: '1.5px solid rgba(31,27,22,.25)', boxShadow: '0 3px 0 rgba(31,27,22,.25)', fontFamily: MONO,
      fontSize: 20, fontWeight: 700, color: C.ink, ...style }}>{children}</span>
  );
}
