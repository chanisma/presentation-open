import type { CSSProperties, ReactNode } from 'react';
import { C, MONO } from '../kit';

/* 15~21장 공용 부품 — 실화면 일부 잘라 넣기, 종이 카드, 키캡.
   장면 구도는 장마다 따로 짠다(여기엔 부품만). */

/** 실화면 src 의 region(원본 px [x,y,w,h])을 폭 w 상자에 맞춰 보인다. nat = 원본 크기 */
export function Crop({ src, region, w, nat = [1920, 1080], style, radius = 10 }: {
  src: string; region: readonly [number, number, number, number] | number[]; w: number; nat?: [number, number]; style?: CSSProperties; radius?: number;
}) {
  const [x, y, rw, rh] = region;
  const k = w / rw;
  return (
    <div style={{ position: 'absolute', width: w, height: rh * k, overflow: 'hidden', borderRadius: radius, ...style }}>
      <img src={src} alt="" draggable={false}
        style={{ position: 'absolute', left: -x * k, top: -y * k, width: nat[0] * k, height: nat[1] * k, maxWidth: 'none' }} />
    </div>
  );
}

/** 종이 카드(결과 파일 미리 보기) — 머리에 파일 이름 */
export function Paper({ name, children, style, mono }: { name: string; children: ReactNode; style?: CSSProperties; mono?: boolean }) {
  return (
    <div style={{ position: 'absolute', background: C.panel, borderRadius: 14, boxShadow: '0 18px 40px -22px rgba(31,27,22,.45)', border: `1px solid ${C.line}`, overflow: 'hidden', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', background: '#f1ece2', borderBottom: `1px solid ${C.line}`, fontSize: 17, fontWeight: 700, color: C.muted }}>
        <span style={{ width: 14, height: 17, borderRadius: 2, border: `2px solid ${C.muted}`, display: 'inline-block' }} />
        {name}
      </div>
      <div style={{ padding: '12px 18px', fontSize: 18, lineHeight: 1.6, color: C.ink, fontFamily: mono ? MONO : undefined, whiteSpace: mono ? 'pre' : undefined }}>{children}</div>
    </div>
  );
}

/** 키캡 — 키를 누르는 순간 강조 */
export function KeyCap({ children, on = 0, style }: { children: ReactNode; on?: number; style?: CSSProperties }) {
  return (
    <span style={{
      position: 'absolute', display: 'inline-grid', placeItems: 'center', minWidth: 58, height: 52, padding: '0 14px', borderRadius: 10,
      background: '#fff', border: `2px solid ${C.ink}`, boxShadow: `0 ${5 - 3 * on}px 0 ${C.ink}`, transform: `translateY(${3 * on}px)`,
      fontFamily: MONO, fontSize: 22, fontWeight: 700, color: C.ink, ...style,
    }}>{children}</span>
  );
}
