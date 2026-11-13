import type { CSSProperties, ReactNode } from 'react';
import { C, Mark, QR } from '../kit';

/* 교실 PC 쪽 작은 부품 — 1·10·11·13·14·26 장이 함께 쓴다 (원문: NEIS_helper app/web) */

/** 작은 위젯(classroom-mini.html, 실물 340×124) — k배 */
export function Widget({ k = 1, device = '2-3 교실', line = '휴대폰으로 찍어 연결 · 2:47', style, refOpen, openStyle }: {
  k?: number; device?: string; line?: string; style?: CSSProperties; refOpen?: string; openStyle?: CSSProperties;
}) {
  return (
    <div style={{ position: 'absolute', width: 340 * k, height: 124 * k, background: '#fff', borderRadius: 12 * k, boxShadow: '0 16px 36px -14px rgba(15,23,42,.5), 0 0 0 1px rgba(15,23,42,.08)', display: 'flex', alignItems: 'center', gap: 14 * k, padding: `${12 * k}px ${14 * k}px`, color: C.ink, ...style }}>
      <div style={{ width: 96 * k, height: 96 * k, flexShrink: 0, borderRadius: 10 * k, padding: 4 * k, border: `1px solid ${C.line}`, background: '#fff' }}>
        <QR size={86 * k} seed={5} />
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 * k }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 * k, fontSize: 11 * k, fontWeight: 600, color: C.muted }}><Mark size={18 * k} />스페이스기전 교실</div>
        <strong style={{ fontSize: 16 * k, letterSpacing: -0.3, whiteSpace: 'nowrap' }}>{device}</strong>
        <span style={{ fontSize: 12 * k, color: C.muted, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{line}</span>
        <span data-pt={refOpen} style={{ alignSelf: 'flex-start', marginTop: 5 * k, border: `1px solid ${C.line}`, borderRadius: 8 * k, padding: `${5 * k}px ${10 * k}px`, fontSize: 12 * k, fontWeight: 600, color: C.primary, ...openStyle }}>QR 크게 보기</span>
      </div>
    </div>
  );
}

/** 독 위 알림 창(classroom-toast.html, 실물 520×116) — k배 */
export function Toast({ k = 1, children, error, style }: { k?: number; children: ReactNode; error?: boolean; style?: CSSProperties }) {
  return (
    <div style={{ position: 'absolute', width: 520 * k, background: '#fff', borderRadius: 14 * k, boxShadow: '0 16px 36px -14px rgba(15,23,42,.45), 0 0 0 1px rgba(15,23,42,.08)', display: 'flex', alignItems: 'center', gap: 12 * k, padding: `${16 * k}px ${18 * k}px`, borderLeft: `${5 * k}px solid ${error ? C.danger : C.primary}`, color: C.ink, ...style }}>
      <span style={{ flex: 1, fontSize: 15 * k, lineHeight: 1.5 }}>{children}</span>
      <span style={{ color: C.faint, fontSize: 14 * k }}>✕</span>
    </div>
  );
}

/** 창 제목줄(Windows 풍) — 교실 PC 창 위에 얹는다 */
export function WinTitle({ title, k = 1, refX, xStyle, style }: { title: string; k?: number; refX?: string; xStyle?: CSSProperties; style?: CSSProperties }) {
  return (
    <div style={{ height: 34 * k, display: 'flex', alignItems: 'center', background: '#fff', borderBottom: `1px solid ${C.line}`, fontSize: 13 * k, color: C.ink, paddingLeft: 12 * k, ...style }}>
      <Mark size={16 * k} /><span style={{ marginLeft: 8 * k, flex: 1 }}>{title}</span>
      <span style={{ width: 46 * k, textAlign: 'center', color: C.muted }}>─</span>
      <span style={{ width: 46 * k, textAlign: 'center', color: C.muted }}>▢</span>
      <span data-pt={refX} style={{ width: 46 * k, height: '100%', display: 'grid', placeItems: 'center', color: C.muted, ...xStyle }}>✕</span>
    </div>
  );
}
