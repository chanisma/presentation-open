import type { CSSProperties, ReactNode } from 'react';
import { Glyph, LOOK, type Look } from '../kit';

/* 구글 수업 도구 창(classroom-gtools.html) 셸 — 23·24·25장이 함께 쓴다.
   실물 창 1280×800 좌표로 저작하고 transform scale(s)로 무대에 놓는다.
   (reference/pc-13~16 캡처: 위 막대 63px · 아래 줄 79px · 가운데가 본문) */

export const GW = 1280;
export const GH = 800;
export const TOP_H = 63;
export const BOT_Y = 721;

export const G = {
  ink: '#202124',
  muted: '#5f6368',
  line: '#dadce0',
  soft: '#f1f3f4',
  orange: '#c26401',
  purple: '#673ab7',
  blue: '#1a73e8',
};

type Tab = 'classroom' | 'slides' | 'forms';
const TABS: [Tab, string, Look][] = [
  ['classroom', '클래스룸', LOOK.classroom],
  ['slides', '슬라이드', LOOK.slides],
  ['forms', '설문지', LOOK.forms],
];

export function Pill({ children, refName, style }: { children: ReactNode; refName?: string; style?: CSSProperties }) {
  return (
    <span data-pt={refName} style={{ display: 'inline-flex', alignItems: 'center', height: 46, padding: '0 22px', borderRadius: 999, border: `1px solid ${G.line}`, background: '#fff', fontSize: 17, color: G.ink, whiteSpace: 'nowrap', ...style }}>
      {children}
    </span>
  );
}

/** 창 전체 — children 은 창 좌표(1280×800)에 절대배치 */
export function GtWindow({ x, y, s, active, right = [], tabRefs, children, style, shadow = true }: {
  x: number; y: number; s: number; active: Tab; right?: string[]; tabRefs?: Partial<Record<Tab, string>>; children: ReactNode; style?: CSSProperties; shadow?: boolean;
}) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: GW * s, height: GH * s, borderRadius: 14, overflow: 'hidden', boxShadow: shadow ? '0 30px 70px -30px rgba(15,23,42,.45), 0 0 0 1px rgba(15,23,42,.1)' : undefined, ...style }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: GW, height: GH, transform: `scale(${s})`, transformOrigin: '0 0', background: '#fff', color: G.ink, fontFamily: "'Pretendard Variable', Pretendard, 'Noto Sans KR', sans-serif" }}>
        {children}
        {/* 아래 줄 — ← 수업 화면 · 클래스룸 슬라이드 설문지 · 오른쪽 단추 */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: BOT_Y, bottom: 0, borderTop: `1px solid ${G.line}`, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 14 }}>
          <Pill>← 수업 화면</Pill>
          <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 14, background: G.soft }}>
            {TABS.map(([id, label, look]) => (
              <span key={id} data-pt={tabRefs?.[id]} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, height: 46, padding: '0 18px', borderRadius: 10, fontSize: 17,
                background: id === active ? '#fff' : 'transparent', boxShadow: id === active ? '0 1px 3px rgba(60,64,67,.25)' : undefined, color: id === active ? G.ink : G.muted }}>
                <Glyph look={look} size={26} />{label}
              </span>
            ))}
          </div>
          <span style={{ flex: 1 }} />
          {right.map((r) => <Pill key={r}>{r}</Pill>)}
        </div>
      </div>
    </div>
  );
}

/** 위 막대(제목) — 왼쪽 앱 글자 타일 + 제목, 가운데 탭, 오른쪽 요소 */
export function TopBar({ look, title, sub, tabs, activeTab, accent = G.orange, right, tabRefs }: {
  look: Look; title: ReactNode; sub?: string; tabs?: string[]; activeTab?: number; accent?: string; right?: ReactNode; tabRefs?: Record<number, string>;
}) {
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: TOP_H, borderBottom: `1px solid ${G.line}`, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 14 }}>
      <Glyph look={look} size={34} />
      <div style={{ lineHeight: 1.2 }}>
        <div style={{ fontSize: 21 }}>{title}</div>
        {sub && <div style={{ fontSize: 13, color: G.muted }}>{sub}</div>}
      </div>
      {tabs && (
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 0, height: TOP_H, display: 'flex', gap: 8 }}>
          {tabs.map((tb, i) => (
            <span key={tb} data-pt={tabRefs?.[i]} style={{ display: 'grid', placeItems: 'center', padding: '0 24px', fontSize: 17, color: i === activeTab ? accent : G.muted, borderBottom: `4px solid ${i === activeTab ? accent : 'transparent'}`, fontWeight: i === activeTab ? 600 : 400 }}>{tb}</span>
          ))}
        </div>
      )}
      <span style={{ flex: 1 }} />
      {right}
    </div>
  );
}

export function Avatar({ size = 36, bg = '#d93025' }: { size?: number; bg?: string }) {
  return <span style={{ display: 'inline-grid', placeItems: 'center', width: size, height: size, borderRadius: '50%', background: bg, color: '#fff', fontSize: size * 0.45, flexShrink: 0 }}>김</span>;
}
