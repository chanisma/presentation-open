import type { CSSProperties, ReactNode } from 'react';
import { C, MONO } from '../kit';

/* ①~③ 묶음(1~7장) 공용 부품.
   - Pic: 크기가 제각각인 실화면(독 3200×400·2400×400, 패널 808×1008, 터미널 1920×1080)의 한 부분을 잘라
     덱 위 상자에 맞춘다. region·rect 는 모두 그 이미지의 **원본 픽셀** 좌표.
   - picPt / picRect: 원본 좌표 → 덱 px (포인터·강조 상자용). Pic 과 같은 (x, y, w, region) 을 넘긴다.
   - ExplorerMock: 파일 탐색기 «수업 자료» 창(목업 — 연습 폴더의 실제 파일 이름)
   - PsWindow: 설치 PowerShell 창(목업 — agent.py install_text() 문구 그대로) */

export type Region = [number, number, number, number];

export function Pic({ src, nat, region, x, y, w, style, children, radius = 12, shadow = true }: {
  src: string; nat: [number, number]; region?: Region; x: number; y: number; w: number;
  style?: CSSProperties; children?: ReactNode; radius?: number; shadow?: boolean;
}) {
  const [rx, ry, rw, rh] = region ?? [0, 0, nat[0], nat[1]];
  const s = w / rw;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: rh * s, overflow: 'hidden', borderRadius: radius,
      boxShadow: shadow ? '0 24px 60px -28px rgba(31,27,22,.55)' : undefined, ...style }}>
      <img src={src} alt="" draggable={false} style={{ position: 'absolute', left: -rx * s, top: -ry * s, width: nat[0] * s, height: nat[1] * s, maxWidth: 'none' }} />
      {children}
    </div>
  );
}

/** 원본 좌표 (px, py) → 덱 px */
export function picPt(px: number, py: number, x: number, y: number, w: number, region: Region) {
  const s = w / region[2];
  return { x: x + (px - region[0]) * s, y: y + (py - region[1]) * s, s };
}
/** 원본 사각형 → 덱 px 사각형 [x, y, w, h] */
export function picRect(r: Region, x: number, y: number, w: number, region: Region): Region {
  const a = picPt(r[0], r[1], x, y, w, region);
  return [a.x, a.y, r[2] * a.s, r[3] * a.s];
}
/** 덱 px → 씬 % (Cursor 경로) */
export const pct = (x: number, y: number) => ({ x: (x / 1920) * 100, y: (y / 1080) * 100 });

/** 덱 px 사각형 강조 상자 */
export function Box({ r, k = 1, label, side = 'top', color = C.gold, size = 20 }: {
  r: Region; k?: number; label?: string; side?: 'top' | 'bottom' | 'left' | 'right'; color?: string; size?: number;
}) {
  if (k <= 0) return null;
  const pos: CSSProperties = side === 'top' ? { left: 0, bottom: '100%', marginBottom: 8 }
    : side === 'bottom' ? { left: 0, top: '100%', marginTop: 8 }
    : side === 'left' ? { right: '100%', top: 0, marginRight: 10 } : { left: '100%', top: 0, marginLeft: 10 };
  return (
    <div style={{ position: 'absolute', left: r[0], top: r[1], width: r[2], height: r[3], zIndex: 40, opacity: k, borderRadius: 10,
      border: `3px solid ${color}`, boxShadow: `0 0 0 6px color-mix(in srgb, ${color} 20%, transparent)` }}>
      {label && <span style={{ position: 'absolute', ...pos, whiteSpace: 'nowrap', fontSize: size, fontWeight: 700, color: '#fff', background: color, borderRadius: 8, padding: '4px 12px' }}>{label}</span>}
    </div>
  );
}

/** 우리말 뜻 칩(영어 화면 문구 번역) */
export function Gloss({ en, ko, style }: { en: string; ko: string; style?: CSSProperties }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderLeft: `4px solid ${C.gold}`, borderRadius: 10, padding: '10px 14px', boxShadow: '0 10px 24px -18px rgba(31,27,22,.5)', ...style }}>
      <div style={{ fontFamily: MONO, fontSize: 16, color: C.muted, lineHeight: 1.35 }}>{en}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginTop: 4, lineHeight: 1.4, wordBreak: 'keep-all' }}>{ko}</div>
    </div>
  );
}

/* 연습 폴더 «수업 자료»의 실제 파일 이름(reference/results/seed/처음 파일 목록.txt) */
export const SEED_FILES = [
  '1단원 컴퓨팅시스템 수업자료(최종).pptx', '20260907 운영체제 정리.pdf', '2단원_데이터 압축 활동지_최종최종.hwp',
  '3단원_탐색알고리즘_학습지.docx', '설문응답.csv', '수업 메모.txt', '알고리즘 수업 ppt (10월).pptx', '회의록.txt',
];

const extTone: Record<string, string> = { pptx: '#d35230', pdf: '#c0392b', hwp: '#2b7bd3', docx: '#2b579a', csv: '#1e8a4c', txt: '#6b6257', md: '#6b6257', html: '#d9692e' };

export function ExplorerMock({ x, y, w, h, files = SEED_FILES, extra = [], extraOn = [], style, title = '수업 자료' }: {
  x: number; y: number; w: number; h: number; files?: string[]; extra?: string[]; extraOn?: number[]; style?: CSSProperties; title?: string;
}) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, background: '#fff', borderRadius: 12, overflow: 'hidden',
      border: `1px solid ${C.line}`, boxShadow: '0 24px 60px -28px rgba(31,27,22,.5)', ...style }}>
      <div style={{ height: 40, background: '#f3f0ea', display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', fontSize: 16, color: C.ink, borderBottom: `1px solid ${C.line}` }}>
        <span style={{ width: 18, height: 14, borderRadius: 3, background: '#f2c14e' }} />
        <b style={{ fontWeight: 600 }}>{title}</b>
        <span style={{ marginLeft: 'auto', color: C.faint, fontSize: 14 }}>파일 탐색기</span>
      </div>
      <div style={{ padding: '8px 10px', fontSize: 17, lineHeight: 1.25 }}>
        {[...files, ...extra].map((f, i) => {
          const isExtra = i >= files.length;
          const on = !isExtra || (extraOn[i - files.length] ?? 0) > 0;
          const k = isExtra ? extraOn[i - files.length] ?? 0 : 1;
          const ext = f.split('.').pop() ?? '';
          return (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 6, opacity: on ? Math.min(1, k) : 0,
              transform: isExtra ? `translateX(${(1 - Math.min(1, k)) * 30}px)` : undefined,
              background: isExtra && k > 0 ? `color-mix(in srgb, ${C.gold} ${Math.round(14 * Math.min(1, k))}%, #fff)` : 'transparent' }}>
              <span style={{ width: 22, height: 26, borderRadius: 3, background: extTone[ext] ?? C.muted, color: '#fff', fontSize: 9, fontWeight: 800, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{ext.toUpperCase().slice(0, 4)}</span>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: C.ink, fontWeight: isExtra ? 700 : 400 }}>{f}</span>
              {isExtra && <span style={{ marginLeft: 'auto', fontSize: 13, color: C.gold, fontWeight: 700 }}>새 파일</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** PowerShell 설치 창(목업). lines 는 [글, 색] — 색은 agent.py 의 -ForegroundColor */
export function PsWindow({ x, y, w, h, lines, style, title = 'Claude Code 설치' }: {
  x: number; y: number; w: number; h: number; lines: [string, string][]; style?: CSSProperties; title?: string;
}) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, background: C.term, borderRadius: 12, overflow: 'hidden',
      boxShadow: '0 30px 70px -26px rgba(0,0,0,.7)', border: '1px solid #2a2a30', ...style }}>
      <div style={{ height: 42, background: '#1d1d22', display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', color: '#e8e6e3', fontSize: 16 }}>
        <span style={{ width: 22, height: 18, borderRadius: 4, background: '#2457a6', color: '#fff', fontSize: 11, display: 'grid', placeItems: 'center', fontFamily: MONO }}>{'>_'}</span>
        {title}
        <span style={{ marginLeft: 'auto', letterSpacing: 14, color: '#9b9894' }}>─ ▢ ✕</span>
      </div>
      <div style={{ padding: '18px 22px', fontFamily: MONO, fontSize: 21, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'keep-all' }}>
        {lines.map(([t, c], i) => <div key={i} style={{ color: c, minHeight: '1.6em' }}>{t}</div>)}
      </div>
    </div>
  );
}

export const PS = { white: '#f2f2f2', cyan: '#61d6d6', green: '#16c60c', yellow: '#f9f1a5', faint: '#7a7874' };
