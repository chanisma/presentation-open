import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useDeck } from '../../../src/deck/DeckContext';
import { useSceneTime, interpolate, easeInOut } from '../../../src/scene';

/* ── 스페이스기전 교실 사용 방법 — 덱 공용 틀 ──────────────────────────
   여기에는 "크롬"과 "제품 부품"만 둔다.
   - 크롬: 1920×1080 고정 배율 박스(Fit), 장 머리, 자막 띠 — 영상 내내 같은 자리
   - 제품 부품: 교실 PC 독의 타일·독, 휴대폰 프레임, 바탕 화면, QR 무늬 —
     실제 제품과 같은 모양이어야 교사가 화면을 알아보므로 한 곳에서 그린다
     (색·치수는 NEIS_helper app/web 의 classroom-dock.css · dock-tones.css 값)
   장면의 구도·메타포는 슬라이드마다 자유 JSX로 저작한다 — 여기에 장면 템플릿을 두지 않는다. */

export const DW = 1920;
export const DH = 1080;
/** 자막 띠 높이(화면 아래 12%) — 목업·창은 이 위(y < STAGE_BOTTOM)에만 둔다 */
export const SUB_H = 130;
export const STAGE_BOTTOM = DH - SUB_H; // 950

export const C = {
  bg: '#f4f6fb',
  card: '#ffffff',
  primary: '#4f46e5',
  primarySoft: '#eef0ff',
  ink: '#1e293b',
  muted: '#64748b',
  faint: '#94a3b8',
  line: '#e3e7f0',
  shelf: '#eef0f6',
  danger: '#b4232a',
  ok: '#15803d',
  warn: '#c2410c',
  desk: '#1f3b63',
};

/* ── 글꼴 ── */
const FONT_ID = 'skcg-fonts';
export function useDeckFonts() {
  useEffect(() => {
    if (document.getElementById(FONT_ID)) return;
    const l = document.createElement('link');
    l.id = FONT_ID;
    l.rel = 'stylesheet';
    l.href = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';
    document.head.appendChild(l);
  }, []);
}

/* ── 고정 배율 박스 — 어떤 해상도에서도 1920×1080 구도 그대로 ── */
export function Fit({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      if (r.width && r.height) setK(Math.min(r.width / DW, r.height / DH));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: C.bg }}>
      <div
        style={{
          position: 'absolute', left: '50%', top: '50%', width: DW, height: DH,
          transform: `translate(-50%, -50%) scale(${k})`, transformOrigin: 'center', overflow: 'hidden',
          fontFamily: "'Pretendard Variable', Pretendard, 'Noto Sans KR', 'Malgun Gothic', sans-serif",
          color: C.ink, textAlign: 'left',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** 설계 박스 안 절대배치 — px 그대로 */
export const abs = (left: number, top: number, width?: number, height?: number): CSSProperties => ({
  position: 'absolute', left, top, ...(width != null ? { width } : {}), ...(height != null ? { height } : {}),
});

/* ── 장 머리 — 왼쪽 위 장 표시 + 헤드라인 한 줄 ── */
export function Head({ chapter, title, kicker, style }: { chapter: string; title: ReactNode; kicker?: string; style?: CSSProperties }) {
  return (
    <div style={{ position: 'absolute', left: 72, top: 44, right: 72, zIndex: 20, ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 21, fontWeight: 700, color: C.primary, letterSpacing: '-0.2px' }}>
        <span style={{ width: 10, height: 10, borderRadius: 3, background: C.primary }} />
        {chapter}
        {kicker && <span style={{ color: C.muted, fontWeight: 600 }}>· {kicker}</span>}
      </div>
      <h2 style={{ margin: '8px 0 0', fontSize: 50, fontWeight: 850, letterSpacing: '-1.6px', lineHeight: 1.15, wordBreak: 'keep-all' }}>{title}</h2>
    </div>
  );
}

/* ── 자막 띠 ── */
export function SubBand({ text, credit }: { text: string; credit?: string }) {
  return (
    <div
      data-sub={text}
      style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: SUB_H, zIndex: 80,
        background: 'color-mix(in oklab, #1e293b 90%, transparent)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 140px',
      }}
    >
      <div key={text} style={{ color: '#fff', fontSize: 34, fontWeight: 600, lineHeight: 1.42, textAlign: 'center', wordBreak: 'keep-all', letterSpacing: '-0.4px' }}>
        {text}
      </div>
      {credit && <div style={{ color: 'rgba(255,255,255,.6)', fontSize: 18, marginTop: 4 }}>{credit}</div>}
    </div>
  );
}

export type Sub = { at: number; text: string };

/** 씬(t)에 묶인 자막 — at 이후 다음 at 전까지 한 줄 */
export function SceneSubs({ items, credit }: { items: Sub[]; credit?: string }) {
  const t = useSceneTime();
  let cur = items[0];
  for (const s of items) if (t >= s.at) cur = s;
  return <SubBand text={cur.text} credit={credit} />;
}

/** 빌드 단계에 묶인 자막 — lines[클릭 수] */
export function BuildSubs({ lines, credit }: { lines: string[]; credit?: string }) {
  const { clicks, isStatic } = useDeck();
  const i = isStatic ? lines.length - 1 : Math.min(lines.length - 1, Math.max(0, clicks));
  return <SubBand text={lines[i]} credit={credit} />;
}

/* ── 영상 녹화용 시간표 ──
   scene: 씬 길이 + 2초 한 단계 / build: 단계마다 (자막 글자 수 ÷ 7 + 1.5)초, 최소 4초 */
export type SlideMeta = { kind: 'scene'; dur: number } | { kind: 'build'; subs: string[] };
export function stepDurations(m: SlideMeta): number[] {
  if (m.kind === 'scene') return [m.dur + 2];
  return m.subs.map((s) => Math.max(4, s.replace(/\s/g, '').length / 7 + 1.5));
}

/* ── 포인터(마우스·손가락) ──
   src/walkthrough 의 Pointer 와 같은 경로 규약({t,x,y,click,hide} · 씬 %)에
   finger 키를 더했다: finger:true 인 키부터는 손가락 탭 원으로 그린다(휴대폰 조작).
   검산기(measure_pointer.mjs)가 읽는 data-walkthrough-pointer 표식과 팁 오프셋을 그대로 지킨다. */
export type Key = { t: number; x: number; y: number; click?: boolean; hide?: boolean; finger?: boolean };

export function Cursor({ path, size = 34, color = C.primary }: { path: Key[]; size?: number; color?: string }) {
  const t = useSceneTime();
  if (path.length === 0) return null;
  let x = path[0].x;
  let y = path[0].y;
  let finger = !!path[0].finger;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    if (t >= a.t) {
      const start = a.click ? Math.min(a.t + 0.35, (a.t + b.t) / 2) : a.t;
      x = interpolate(t, [start, b.t], [a.x, b.x], easeInOut);
      y = interpolate(t, [start, b.t], [a.y, b.y], easeInOut);
      finger = !!(t >= b.t ? b.finger : a.finger);
    }
  }
  let opacity = interpolate(t, [path[0].t - 0.35, path[0].t], [0, 1]);
  for (let i = 0; i < path.length; i++) {
    const k = path[i];
    if (!k.hide || t <= k.t) continue;
    const next = path[i + 1];
    const fadeOut = interpolate(t, [k.t + 0.15, k.t + 0.55], [1, 0]);
    const fadeBack = next ? interpolate(t, [next.t - 0.45, next.t - 0.05], [0, 1]) : 0;
    opacity *= Math.max(fadeOut, fadeBack);
  }
  let dip = 1;
  for (const k of path) if (k.click && t >= k.t && t <= k.t + 0.3) dip = 1 - 0.16 * Math.sin((Math.PI * (t - k.t)) / 0.3);
  return (
    <>
      {path.map((k, i) => {
        if (!k.click || t < k.t || t > k.t + 0.55) return null;
        const p = (t - k.t) / 0.55;
        const d = 12 + p * 50;
        return (
          <span key={i} aria-hidden style={{
            position: 'absolute', left: `${k.x}%`, top: `${k.y}%`, width: d, height: d, transform: 'translate(-50%, -50%)',
            borderRadius: '50%', border: `3px solid ${color}`, opacity: 0.9 * (1 - p) * opacity, zIndex: 59, pointerEvents: 'none',
          }} />
        );
      })}
      <div aria-hidden data-walkthrough-pointer="" data-pointer-size={size}
        style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: size, height: size,
          transform: `translate(${-size / 6}px, ${-size / 12}px)`, zIndex: 60, pointerEvents: 'none', opacity }}>
        {finger ? (
          <span style={{
            position: 'absolute', left: size / 6, top: size / 12, width: size * 1.25, height: size * 1.25,
            transform: `translate(-50%, -50%) scale(${dip})`, borderRadius: '50%',
            background: 'rgba(30,41,59,.28)', border: '3px solid rgba(255,255,255,.95)', boxShadow: '0 4px 14px rgba(15,23,42,.35)',
          }} />
        ) : (
          <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: 'block', transform: `scale(${dip})`, transformOrigin: '16.667% 8.333%' }}>
            <path d="M4 2 L4 18.6 L8.4 14.9 L11.1 20.8 L13.8 19.5 L11 13.8 L16.6 13.2 Z" fill="#fdfdfd" stroke="#12141c" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </>
  );
}

/** 클릭 순간 대상 발광 링 */
export function ring(t: number, at: number, color = C.primary): CSSProperties {
  const k = t < at ? 0 : Math.max(0, 1 - (t - at) / 0.6);
  return k > 0 ? { boxShadow: `0 0 0 ${3 + 5 * k}px color-mix(in srgb, ${color} ${Math.round(60 * k)}%, transparent)` } : {};
}

/* ── 독 타일 (제품 모양 그대로: 둥근 23% 사각, 160° 그라데이션 + 글자/선 아이콘) ── */
export const TONES: Record<string, [string, string, string?]> = {
  indigo: ['#818cf8', '#4338ca'], green: ['#4ade80', '#15803d'], blue: ['#60a5fa', '#1d4ed8'], teal: ['#2dd4bf', '#0f766e'],
  violet: ['#c084fc', '#7e22ce'], orange: ['#fdba74', '#ea580c'], rose: ['#fb7185', '#be123c'], sky: ['#7dd3fc', '#0284c7'],
  yellow: ['#fef08a', '#facc15', '#713f12'], slate: ['#94a3b8', '#475569'], silver: ['#e5e7eb', '#9ca3af', '#374151'],
  cyan: ['#67e8f9', '#0891b2'], amber: ['#fcd34d', '#d97706'], red: ['#fca5a5', '#dc2626'], graphite: ['#6b7280', '#1f2937'],
  paper: ['#ffffff', '#eef0f4', '#111827'], emerald: ['#6ee7b7', '#047857'], pink: ['#f9a8d4', '#db2777'],
};

export const GLYPH: Record<string, string> = {
  drive: 'M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2.5h6.5A2.5 2.5 0 0 1 21 10v7.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5Z',
  file: 'M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z M14 3v5h5M9 13h6M9 17h4',
  globe: 'M20.5 12a8.5 8.5 0 1 1-17 0a8.5 8.5 0 1 1 17 0 M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.4-3.6-8.5s1.1-5.9 3.6-8.5Z',
  planet: 'M17.5 12a5.5 5.5 0 1 1-11 0a5.5 5.5 0 1 1 11 0 M3.5 15.5c-1.8 2.4 4.2 1.6 9.6-1.5s9-6.8 7-7.6c-.9-.3-2.4.1-4.1.9',
  board: 'M5 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z M8 20h8M12 16v4M7 9l3 3 5-5',
  note: 'M6 3h9l4 4v14H6z M9 11h7M9 15h7M9 7h4',
  paint: 'M12 3a9 9 0 1 0 0 18c1.2 0 1.6-1 1.1-1.9-.6-1.1.1-2.6 1.4-2.6H17a4 4 0 0 0 4-4c0-5-4-9.5-9-9.5Z',
  calc: 'M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01',
  snip: 'M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2 M15.2 12a3.2 3.2 0 1 1-6.4 0a3.2 3.2 0 1 1 6.4 0',
  keyboard: 'M4.5 6h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z M6 10h.01M9 10h.01M12 10h.01M15 10h.01M18 10h.01M7 14h10',
  app: 'M4.5 3h4a1.5 1.5 0 0 1 1.5 1.5v4A1.5 1.5 0 0 1 8.5 10h-4A1.5 1.5 0 0 1 3 8.5v-4A1.5 1.5 0 0 1 4.5 3Z M15.5 3h4A1.5 1.5 0 0 1 21 4.5v4a1.5 1.5 0 0 1-1.5 1.5h-4A1.5 1.5 0 0 1 14 8.5v-4A1.5 1.5 0 0 1 15.5 3Z M4.5 14h4a1.5 1.5 0 0 1 1.5 1.5v4A1.5 1.5 0 0 1 8.5 21h-4A1.5 1.5 0 0 1 3 19.5v-4A1.5 1.5 0 0 1 4.5 14Z M15.5 14h4a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a1.5 1.5 0 0 1-1.5-1.5v-4a1.5 1.5 0 0 1 1.5-1.5Z',
};

/** 타일의 생김새: 글자(text) 또는 선 아이콘(glyph) + 색조(tone) */
export type Look = { text?: string; glyph?: string; tone: string };

/** 제품이 쓰는 대표 모양 — classroom-dock.js 의 PROGRAM_LOOK · GOOGLE_LOOK · lookFor() */
export const LOOK: Record<string, Look> = {
  google: { text: 'G', tone: 'paper' },
  mydrive: { glyph: 'drive', tone: 'blue' },
  folder: { glyph: 'drive', tone: 'amber' },
  file: { glyph: 'file', tone: 'blue' },
  site: { glyph: 'globe', tone: 'cyan' },
  space: { glyph: 'planet', tone: 'indigo' },
  powerpoint: { text: 'P', tone: 'orange' }, word: { text: 'W', tone: 'blue' }, excel: { text: 'X', tone: 'green' },
  hwp: { text: '한', tone: 'sky' }, whiteboard: { glyph: 'board', tone: 'teal' }, notepad: { glyph: 'note', tone: 'slate' },
  paint: { glyph: 'paint', tone: 'pink' }, calculator: { glyph: 'calc', tone: 'graphite' }, snipping: { glyph: 'snip', tone: 'violet' },
  osk: { glyph: 'keyboard', tone: 'silver' }, program: { glyph: 'app', tone: 'slate' },
  classroom: { text: 'C', tone: 'green' }, docs: { text: '문', tone: 'blue' }, sheets: { text: '시', tone: 'emerald' },
  slides: { text: '슬', tone: 'amber' }, forms: { text: '설', tone: 'violet' }, calendar: { text: '31', tone: 'sky' },
  meet: { text: 'M', tone: 'teal' }, gmail: { text: 'M', tone: 'red' }, keep: { text: 'K', tone: 'yellow' },
  sites: { text: 'S', tone: 'indigo' }, youtube: { text: '▶', tone: 'red' },
};

export function Glyph({ look, size = 50, badge, badgeTone = 'warn', off, spin, style }: {
  look: Look; size?: number; badge?: string; badgeTone?: 'warn' | 'err' | 'ok'; off?: boolean; spin?: number; style?: CSSProperties;
}) {
  const [a, b, ink = '#fff'] = TONES[look.tone] ?? TONES.slate;
  const bg = { warn: C.warn, err: C.danger, ok: C.ok }[badgeTone];
  return (
    <span style={{
      position: 'relative', display: 'grid', placeItems: 'center', flexShrink: 0, width: size, height: size, borderRadius: '23%',
      background: `linear-gradient(160deg, ${a}, ${b})`, color: ink, fontWeight: 800, fontSize: size * 0.4, letterSpacing: -0.5,
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.22), inset 0 1px 0 rgba(255,255,255,.35), 0 2px 6px rgba(15,23,42,.18)',
      filter: off ? 'grayscale(1)' : undefined, opacity: off ? 0.55 : 1, ...style,
    }}>
      {look.glyph ? (
        <svg viewBox="0 0 24 24" width={size * 0.52} height={size * 0.52} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d={GLYPH[look.glyph]} />
        </svg>
      ) : look.text}
      {spin != null && (
        <span style={{ position: 'absolute', inset: -size * 0.08, borderRadius: '28%', border: `${Math.max(2, size * 0.04)}px solid transparent`, borderTopColor: C.primary, transform: `rotate(${spin}deg)` }} />
      )}
      {badge && (
        <span style={{
          position: 'absolute', right: -size * 0.12, top: -size * 0.12, minWidth: size * 0.36, height: size * 0.36, padding: `0 ${size * 0.1}px`,
          borderRadius: size * 0.18, background: bg, color: '#fff', fontSize: size * 0.2, fontWeight: 700, display: 'grid', placeItems: 'center',
          border: `${Math.max(2, size * 0.04)}px solid ${C.shelf}`,
        }}>{badge}</span>
      )}
    </span>
  );
}

/** 독의 한 칸 = 타일 + 이름 */
export type DockTile = { id: string; look: Look; label: string; badge?: string; badgeTone?: 'warn' | 'err' | 'ok'; off?: boolean; spin?: number; style?: CSSProperties };

/** 교실 PC 수업 중 독 — 실물 112px 높이 기준, k배로 그린다.
    who(선생님·세팅) | 타일들 | 남은 시간·+10분 | 수업 끝  (classroom-dock.html 구조) */
export function Dock({ tiles, teacher = '김기전 선생님', title = '1-3 정보 수업', line, time = '38:12', timeWarn, k = 1, width, ending, endingSpin = 0, style, tileRefs, endRef, clockRef, clockStyle, endStyle }: {
  tiles: DockTile[]; teacher?: string; title?: string; line?: string; time?: string; timeWarn?: boolean; k?: number; width?: number;
  ending?: string; endingSpin?: number; style?: CSSProperties; tileRefs?: Record<string, string>; endRef?: string; clockRef?: string; clockStyle?: CSSProperties; endStyle?: CSSProperties;
}) {
  const ic = 50 * k;
  return (
    <div style={{
      position: 'absolute', height: 112 * k, width, background: C.shelf, borderRadius: 16 * k, color: C.ink,
      boxShadow: '0 18px 40px -18px rgba(15,23,42,.45), 0 0 0 1px rgba(15,23,42,.08)', display: 'flex', alignItems: 'center',
      gap: 12 * k, padding: `${10 * k}px ${14 * k}px`, overflow: 'hidden', ...style,
    }}>
      <div style={{ width: 170 * k, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2 * k, minWidth: 0 }}>
        <strong style={{ fontSize: 14 * k, whiteSpace: 'nowrap' }}>{teacher}</strong>
        <span style={{ fontSize: 12 * k, color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
        {line && <span style={{ fontSize: 11 * k, color: C.primary, lineHeight: 1.35 }}>{line}</span>}
      </div>
      <i style={{ width: 1, alignSelf: 'stretch', margin: `${8 * k}px 0`, background: 'rgba(15,23,42,.12)', flexShrink: 0 }} />
      <div style={{ display: 'flex', gap: 4 * k, flex: 1, minWidth: 0 }}>
        {tiles.map((tl) => (
          <div key={tl.id} data-pt={tileRefs?.[tl.id]} style={{ width: 74 * k, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 * k, padding: `${4 * k}px ${2 * k}px`, borderRadius: 12 * k, ...tl.style }}>
            <Glyph look={tl.look} size={ic} badge={tl.badge} badgeTone={tl.badgeTone} off={tl.off} spin={tl.spin} />
            <span style={{ fontSize: 11 * k, maxWidth: 72 * k, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tl.label}</span>
          </div>
        ))}
      </div>
      <i style={{ width: 1, alignSelf: 'stretch', margin: `${8 * k}px 0`, background: 'rgba(15,23,42,.12)', flexShrink: 0 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 * k, flexShrink: 0 }}>
        <div data-pt={clockRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', border: `1px solid ${timeWarn ? C.warn : 'rgba(15,23,42,.12)'}`, borderRadius: 12 * k, padding: `${6 * k}px ${12 * k}px`, ...clockStyle }}>
          <strong style={{ fontSize: 22 * k, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1, color: timeWarn ? C.warn : C.ink }}>{time}</strong>
          <span style={{ fontSize: 11 * k, color: C.muted }}>+10분</span>
        </div>
        <div data-pt={endRef} style={{ background: C.danger, color: '#fff', borderRadius: 12 * k, padding: `${14 * k}px ${18 * k}px`, fontWeight: 700, fontSize: 15 * k, whiteSpace: 'nowrap', ...endStyle }}>수업 끝</div>
      </div>
      {ending && (
        <div style={{ position: 'absolute', inset: 0, background: C.shelf, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 * k, fontSize: 14 * k }}>
          <span style={{ width: 20 * k, height: 20 * k, borderRadius: '50%', border: `${3 * k}px solid rgba(15,23,42,.12)`, borderTopColor: C.primary, transform: `rotate(${endingSpin}deg)` }} />
          {ending}
        </div>
      )}
    </div>
  );
}

/** 자주 쓰는 독 구성 — 1-3 정보 수업 세팅(구글 · 내 드라이브 · 클래스룸 · 패들렛 · PowerPoint · 자리 배치) */
export const BASE_TILES: DockTile[] = [
  { id: 'google', look: LOOK.google, label: '구글' },
  { id: 'drive', look: LOOK.mydrive, label: '내 드라이브' },
  { id: 'classroom', look: LOOK.classroom, label: '클래스룸' },
  { id: 'padlet', look: LOOK.site, label: '패들렛' },
  { id: 'ppt', look: LOOK.powerpoint, label: 'PowerPoint' },
  { id: 'seat', look: LOOK.space, label: '자리 배치' },
];

/* ── QR 무늬 (결정론 의사 QR — 찍히지 않는 장식. 실제로 찍히는 QR은 media/ PNG) ── */
export function QR({ size, seed = 7, fg = C.ink, bg = '#fff', style }: { size: number; seed?: number; fg?: string; bg?: string; style?: CSSProperties }) {
  const N = 25;
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280), s / 233280);
  const cells: [number, number][] = [];
  const finder = (x: number, y: number) => x < 8 && y < 8;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      if (finder(x, y) || finder(N - 1 - x, y) || finder(x, N - 1 - y)) continue;
      if (rnd() > 0.52) cells.push([x, y]);
    }
  const F = ({ x, y }: { x: number; y: number }) => (
    <g>
      <rect x={x} y={y} width={7} height={7} fill={fg} />
      <rect x={x + 1} y={y + 1} width={5} height={5} fill={bg} />
      <rect x={x + 2} y={y + 2} width={3} height={3} fill={fg} />
    </g>
  );
  return (
    <svg viewBox={`-2 -2 ${N + 4} ${N + 4}`} width={size} height={size} style={{ display: 'block', background: bg, borderRadius: size * 0.05, ...style }}>
      {cells.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={fg} />)}
      <F x={0} y={0} />
      <F x={N - 7} y={0} />
      <F x={0} y={N - 7} />
    </svg>
  );
}

/* ── 휴대폰 프레임 (세로 9:19.5, 상단 주소 표시) ── */
export function Phone({ x, y, w = 380, url, children, style, screenStyle }: {
  x: number; y: number; w?: number; url?: string; children: ReactNode; style?: CSSProperties; screenStyle?: CSSProperties;
}) {
  const h = w * 19.5 / 9;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: w * 0.14, background: '#0f172a', padding: w * 0.032, boxShadow: '0 30px 60px -24px rgba(15,23,42,.55)', ...style }}>
      <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: w * 0.115, overflow: 'hidden', background: C.bg, display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: w * 0.1, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${w * 0.08}px`, fontSize: w * 0.036, fontWeight: 700, color: C.ink, background: C.card }}>
          <span>10:31</span>
          <span style={{ width: w * 0.26, height: w * 0.06, borderRadius: 99, background: '#0f172a' }} />
          <span style={{ letterSpacing: 1 }}>▮▮▮</span>
        </div>
        {url && (
          <div style={{ flexShrink: 0, background: C.card, padding: `0 ${w * 0.045}px ${w * 0.03}px` }}>
            <div style={{ background: '#eef1f7', borderRadius: 99, padding: `${w * 0.016}px ${w * 0.04}px`, fontSize: w * 0.032, color: C.muted, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{url}</div>
          </div>
        )}
        <div style={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden', ...screenStyle }}>{children}</div>
      </div>
    </div>
  );
}

/* ── 교실 PC 바탕 화면 + 작업 표시줄 ── */
export function Desktop({ style, children, taskbar = true, clock = '10:31' }: { style?: CSSProperties; children?: ReactNode; taskbar?: boolean; clock?: string }) {
  return (
    <div style={{ position: 'absolute', overflow: 'hidden', background: 'radial-gradient(120% 90% at 30% 20%, #2f5f96 0%, #1f3b63 55%, #172c4b 100%)', ...style }}>
      {children}
      {taskbar && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 44, background: 'rgba(232,236,244,.92)', borderTop: '1px solid rgba(255,255,255,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          {['#2563eb', '#94a3b8', '#f59e0b', '#4f46e5'].map((c, i) => (
            <span key={i} style={{ width: 26, height: 26, borderRadius: 7, background: i === 0 ? 'linear-gradient(135deg,#60a5fa,#1d4ed8)' : c, opacity: i === 0 ? 1 : 0.8 }} />
          ))}
          <span style={{ position: 'absolute', right: 16, fontSize: 13, color: C.ink, fontVariantNumeric: 'tabular-nums' }}>{clock}</span>
        </div>
      )}
    </div>
  );
}

/** 스페이스기전 글자 타일 로고(제품 머리글의 S 마크) */
export function Mark({ size = 22 }: { size?: number }) {
  return <span style={{ display: 'inline-grid', placeItems: 'center', width: size, height: size, borderRadius: size * 0.28, background: C.primary, color: '#fff', fontSize: size * 0.55, fontWeight: 800, flexShrink: 0 }}>S</span>;
}

/** 칩(라벨) */
export function Chip({ children, tone = 'primary', style }: { children: ReactNode; tone?: 'primary' | 'ok' | 'warn' | 'danger' | 'muted'; style?: CSSProperties }) {
  const col = { primary: C.primary, ok: C.ok, warn: C.warn, danger: C.danger, muted: C.muted }[tone];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 999, fontSize: 22, fontWeight: 700, color: col,
      background: `color-mix(in srgb, ${col} 10%, #fff)`, border: `1.5px solid color-mix(in srgb, ${col} 35%, #fff)`, whiteSpace: 'nowrap', ...style }}>{children}</span>
  );
}

/* 접속용 URL — 클릭 가능한 링크 */
export function LinkOut({ href, children, style }: { href: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <a href={href} target="_blank" rel="noopener" style={{ color: C.primary, fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 4, ...style }}>
      {children} ↗
    </a>
  );
}

/* ══ 제품 화면 부품 ══════════════════════════════════════════════════
   여러 장에 같은 화면이 다시 나오므로 한 곳에서 그린다. 문구는 제품 원문. */

/** 교실 PC 의 큰 QR 창(classroom.html view-qr) — 실물 1280×800 을 k배로.
    refs: 클릭 대상 data-pt 이름(settings) */
export function QrWindow({ k = 1, device = '2-3 교실', timer = '03:12 뒤 새 QR', clock = '10월 15일 (목) 오전 10:31', notice, qrSeed = 3, style, refs }: {
  k?: number; device?: string; timer?: string; clock?: string; notice?: string; qrSeed?: number; style?: CSSProperties; refs?: { settings?: string; device?: string };
}) {
  return (
    <div style={{ position: 'absolute', width: 1280 * k, height: 800 * k, background: C.bg, color: C.ink, display: 'flex', flexDirection: 'column', overflow: 'hidden', ...style }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${22 * k}px ${32 * k}px` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 * k, fontWeight: 800, fontSize: 17 * k, letterSpacing: -0.4 }}>
          <Mark size={32 * k} />스페이스기전 교실
        </div>
        <span data-pt={refs?.settings} style={{ border: `1px solid ${C.line}`, color: C.muted, borderRadius: 10 * k, padding: `${8 * k}px ${14 * k}px`, fontSize: 14 * k, fontWeight: 600 }}>기기 설정</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 80 * k, padding: `0 ${32 * k}px` }}>
        <div style={{ background: '#fff', borderRadius: 24 * k, padding: 22 * k, boxShadow: '0 18px 50px #3240781a', border: `1px solid ${C.line}`, textAlign: 'center' }}>
          <QR size={330 * k} seed={qrSeed} />
          <div style={{ marginTop: 10 * k, fontSize: 13 * k, color: C.muted, fontVariantNumeric: 'tabular-nums' }}>{timer}</div>
        </div>
        <div style={{ width: 460 * k }}>
          <div style={{ color: C.muted, fontSize: 14 * k, fontWeight: 600 }}>이 기기</div>
          <div data-pt={refs?.device} style={{ fontSize: 48 * k, fontWeight: 800, letterSpacing: -1.5, margin: `${4 * k}px 0 ${18 * k}px` }}>{device}</div>
          <ol style={{ margin: 0, paddingLeft: 22 * k, fontSize: 16 * k, lineHeight: 1.8 }}>
            <li>휴대폰 카메라로 왼쪽 QR 을 찍으세요.</li>
            <li>스페이스기전에서 이 반 세팅을 고르고 <b>이 기기에 펼치기</b>를 누르세요.</li>
            <li>화면 아래 독에서 <b>구글 앱 · 내 드라이브 · 사이트 · 프로그램</b>을 눌러 여세요.</li>
            <li>수업이 끝나면 고친 파일은 드라이브에 올리고, 열린 창과 받은 파일, 로그인은 지웁니다.</li>
          </ol>
          {notice && <div style={{ marginTop: 16 * k, padding: `${10 * k}px ${14 * k}px`, borderRadius: 10 * k, background: 'color-mix(in srgb, #4f46e5 10%, transparent)', fontSize: 14 * k, lineHeight: 1.6 }}>{notice}</div>}
          <div style={{ display: 'flex', gap: 16 * k, alignItems: 'center', marginTop: 22 * k, padding: `${14 * k}px ${16 * k}px`, border: `1px dashed ${C.line}`, borderRadius: 14 * k, background: C.card }}>
            <QR size={88 * k} seed={qrSeed + 11} />
            <div style={{ color: C.muted, fontSize: 13 * k, lineHeight: 1.65 }}>
              <b style={{ color: C.ink }}>아직 세팅이 없나요?</b><br />이 QR 을 찍거나 스페이스기전 메뉴 <b style={{ color: C.ink }}>[도구] → 교실 기기</b>에서 반마다 만들어 두세요.
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: `${14 * k}px ${32 * k}px ${22 * k}px`, textAlign: 'right', color: C.muted, fontSize: 15 * k, fontVariantNumeric: 'tabular-nums' }}>{clock}</div>
    </div>
  );
}

const BLUE = '#2563eb';

/** 스페이스기전 웹 상단 막대(휴대폰) */
export function WebBar({ w, title = '교실 기기 연결' }: { w: number; title?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: w * 0.025, padding: `${w * 0.03}px ${w * 0.045}px`, background: C.card, borderBottom: `1px solid ${C.line}`, fontSize: w * 0.042, fontWeight: 700 }}>
      <Mark size={w * 0.065} />{title}
    </div>
  );
}

/** 승인 화면의 기기 카드(파란 그라데이션) — w = 휴대폰 화면 폭 */
export function DeviceCard({ w, label = '연결할 교실 기기', name = '2-3 교실', board, left = '2:41', style, refName }: {
  w: number; label?: string; name?: string; board?: boolean; left?: string | null; style?: CSSProperties; refName?: string;
}) {
  const u = w / 100;
  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 5 * u, background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: '#fff', padding: 4.4 * u, display: 'flex', alignItems: 'center', gap: 3.2 * u, ...style }}>
      <span style={{ position: 'absolute', right: -8 * u, top: -10 * u, width: 34 * u, height: 34 * u, borderRadius: '50%', background: 'rgba(255,255,255,.1)' }} />
      <span style={{ width: 12 * u, height: 12 * u, borderRadius: 3.6 * u, background: 'rgba(255,255,255,.15)', display: 'grid', placeItems: 'center' }}>
        <svg viewBox="0 0 24 24" width={6.4 * u} height={6.4 * u} fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round"><path d={board ? 'M3 4h18v12H3z M12 16v4 M8 20h8' : 'M4 4h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z M9 20h6 M12 16v4'} /></svg>
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 3.3 * u, color: '#dbeafe' }}>{label}</div>
        <div data-pt={refName} style={{ fontSize: 5.6 * u, fontWeight: 700 }}>{name}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1.2 * u }}>
        <span style={{ fontSize: 3 * u, borderRadius: 99, padding: `${0.4 * u}px ${2 * u}px`, background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)' }}>{board ? '전자칠판' : 'Windows PC'}</span>
        {left && <span style={{ fontSize: 3 * u, borderRadius: 99, padding: `${0.4 * u}px ${2 * u}px`, background: '#fff', color: '#1d4ed8', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>◷ {left}</span>}
      </div>
    </div>
  );
}

/** 승인 화면의 세팅 카드 하나 */
export function PresetCard({ w, title, section, now, checked, minutes = 50, tiles, style, refName }: {
  w: number; title: string; section?: string; now?: boolean; checked?: boolean; minutes?: number; tiles: Look[]; style?: CSSProperties; refName?: string;
}) {
  const u = w / 100;
  return (
    <div data-pt={refName} style={{ borderRadius: 5 * u, background: C.card, border: `1.5px solid ${checked ? '#3b82f6' : C.line}`, boxShadow: checked ? '0 0 0 3px rgba(59,130,246,.18)' : '0 1px 2px rgba(15,23,42,.06)', padding: 3.8 * u, ...style }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 3 * u }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 4.1 * u, fontWeight: 700 }}>{title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 1.5 * u, marginTop: 1.2 * u, fontSize: 3 * u }}>
            <span style={{ background: '#f1f5f9', borderRadius: 2 * u, padding: `${0.3 * u}px ${1.8 * u}px` }}>{section ?? '공통'}</span>
            {now && <span style={{ background: BLUE, color: '#fff', borderRadius: 2 * u, padding: `${0.3 * u}px ${1.8 * u}px`, fontWeight: 600 }}>지금 수업</span>}
            <span style={{ color: C.faint }}>{minutes}분 뒤 정리</span>
          </div>
        </div>
        <span style={{ width: 6.4 * u, height: 6.4 * u, borderRadius: '50%', border: `2px solid ${checked ? BLUE : '#cbd5e1'}`, background: checked ? BLUE : 'transparent', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 3.6 * u, fontWeight: 800 }}>{checked ? '✓' : ''}</span>
      </div>
      <div style={{ marginTop: 3 * u, display: 'flex', alignItems: 'center', gap: 1.5 * u, borderRadius: 3 * u, padding: `${2 * u}px ${2.6 * u}px`, background: checked ? 'rgba(239,246,255,.8)' : '#f8fafc' }}>
        <Glyph look={LOOK.google} size={7 * u} />
        <Glyph look={LOOK.mydrive} size={7 * u} />
        <i style={{ width: 1, height: 5 * u, background: C.line, margin: `0 ${0.5 * u}px` }} />
        {tiles.map((lk, i) => <Glyph key={i} look={lk} size={7 * u} />)}
      </div>
    </div>
  );
}

/** 스위치 줄(이번 수업) */
export function OptionRow({ w, title, text, on = true, look, refName, style }: { w: number; title: string; text: string; on?: boolean; look: Look | 'key'; refName?: string; style?: CSSProperties }) {
  const u = w / 100;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 3 * u, padding: 3.6 * u, ...style }}>
      {look === 'key'
        ? <span style={{ width: 10 * u, height: 10 * u, borderRadius: 3 * u, background: '#fffbeb', color: '#d97706', display: 'grid', placeItems: 'center', fontSize: 4.6 * u, flexShrink: 0, border: '1px solid #fef3c7' }}>⚿</span>
        : <span style={{ width: 10 * u, height: 10 * u, borderRadius: 3 * u, background: '#fff', border: `1px solid ${C.line}`, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Glyph look={look} size={6.4 * u} /></span>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 3.6 * u, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 2.9 * u, color: C.muted, lineHeight: 1.5, marginTop: 0.4 * u }}>{text}</div>
      </div>
      <span data-pt={refName} style={{ marginTop: 2 * u, width: 9.6 * u, height: 5.4 * u, borderRadius: 99, background: on ? BLUE : '#cbd5e1', position: 'relative', flexShrink: 0 }}>
        <span style={{ position: 'absolute', top: 0.5 * u, left: on ? 4.7 * u : 0.5 * u, width: 4.4 * u, height: 4.4 * u, borderRadius: '50%', background: '#fff' }} />
      </span>
    </div>
  );
}

/** 섹션 라벨(펼칠 세팅 · 이번 수업) */
export function SectionLabel({ w, children }: { w: number; children: ReactNode }) {
  return <div style={{ fontSize: 3.3 * (w / 100), fontWeight: 600, color: C.muted, margin: `${4 * (w / 100)}px 0 ${2 * (w / 100)}px` }}>{children}</div>;
}

/** 승인 화면 하단 고정 막대 — [거절] [이 기기에 펼치기] */
export function ApproveBar({ w, refName, glow }: { w: number; refName?: string; glow?: CSSProperties }) {
  const u = w / 100;
  return (
    <div style={{ position: 'absolute', left: 2 * u, right: 2 * u, bottom: 2 * u, borderRadius: 5 * u, border: `1px solid ${C.line}`, background: 'rgba(255,255,255,.97)', padding: 2.6 * u, boxShadow: '0 -6px 20px -10px rgba(15,23,42,.25)' }}>
      <div style={{ display: 'flex', gap: 2 * u }}>
        <span style={{ height: 12 * u, padding: `0 ${5 * u}px`, borderRadius: 3 * u, border: `1px solid ${C.line}`, display: 'grid', placeItems: 'center', fontSize: 3.8 * u, color: '#475569' }}>거절</span>
        <span data-pt={refName} style={{ flex: 1, height: 12 * u, borderRadius: 3 * u, background: BLUE, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 4.2 * u, fontWeight: 600, ...glow }}>이 기기에 펼치기</span>
      </div>
      <div style={{ marginTop: 2 * u, textAlign: 'center', fontSize: 2.8 * u, color: C.faint }}>교실 화면의 기기 이름이 위와 같은지 확인하고 누르세요</div>
    </div>
  );
}

/** 승인 뒤 화면 — 교실 화면에 펼쳤습니다 / 드라이브를 다시 연결했습니다 */
export function ConnectedPanel({ w, title = '1-3 정보 수업', endsAt = '11:20', drive, refStop, style, stopStyle }: { w: number; title?: string; endsAt?: string; drive?: boolean; refStop?: string; style?: CSSProperties; stopStyle?: CSSProperties }) {
  const u = w / 100;
  return (
    <div style={{ borderRadius: 5 * u, background: C.card, border: `1px solid ${C.line}`, padding: 5.5 * u, textAlign: 'center', ...style }}>
      <span style={{ display: 'grid', placeItems: 'center', width: 16 * u, height: 16 * u, margin: '0 auto', borderRadius: '50%', background: '#ecfdf5', boxShadow: '0 0 0 8px rgba(236,253,245,.5)', color: '#10b981', fontSize: 9 * u, fontWeight: 800 }}>✓</span>
      <div style={{ marginTop: 4 * u, fontSize: 4.6 * u, fontWeight: 700 }}>{drive ? '드라이브를 다시 연결했습니다' : '교실 화면에 펼쳤습니다'}</div>
      <div style={{ marginTop: 1.2 * u, fontSize: 3.4 * u, color: C.muted, lineHeight: 1.5 }}>{drive ? '앞으로 1시간 더 «내 드라이브»를 쓸 수 있습니다.' : `«${title}» — 교실 화면 아래 독에서 여세요.`}</div>
      {!drive && (
        <>
          <div style={{ marginTop: 5 * u, display: 'flex', alignItems: 'center', gap: 3 * u, borderRadius: 3 * u, background: '#f8fafc', padding: 3 * u, textAlign: 'left' }}>
            <span style={{ fontSize: 5 * u, color: C.faint }}>◷</span>
            <div>
              <div style={{ fontSize: 3.5 * u, fontWeight: 600, color: '#334155' }}>{endsAt}에 자동으로 정리</div>
              <div style={{ fontSize: 3 * u, color: C.muted }}>더 쓰려면 교실 화면에서 연장하세요.</div>
            </div>
          </div>
          <div data-pt={refStop} style={{ marginTop: 4 * u, height: 12 * u, borderRadius: 3 * u, border: '1px solid #fecdd3', color: '#e11d48', display: 'grid', placeItems: 'center', fontSize: 3.8 * u, fontWeight: 600, ...stopStyle }}>여기서 수업 끝내기</div>
          <div style={{ marginTop: 2 * u, fontSize: 2.7 * u, color: C.faint }}>고친 파일은 드라이브에 올리고, 열린 창과 받은 파일을 지웁니다.</div>
        </>
      )}
    </div>
  );
}

/** 모니터 외곽(베젤 + 받침) — 안쪽 화면은 children (w×h = 화면 크기) */
export function Monitor({ x, y, w, h, children, style }: { x: number; y: number; w: number; h: number; children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w + 28, ...style }}>
      <div style={{ background: '#111827', borderRadius: 18, padding: 14, boxShadow: '0 30px 60px -30px rgba(15,23,42,.6)' }}>
        <div style={{ position: 'relative', width: w, height: h, borderRadius: 6, overflow: 'hidden', background: C.bg }}>{children}</div>
      </div>
      <div style={{ width: 120, height: 30, margin: '0 auto', background: 'linear-gradient(#374151, #1f2937)' }} />
      <div style={{ width: 260, height: 10, margin: '0 auto', borderRadius: 6, background: '#1f2937' }} />
    </div>
  );
}

/** a→b 동안 0→1, c→d 동안 1→0 (그 사이 1) */
export function window4(t: number, a: number, b: number, c: number, d: number): number {
  if (t <= a || t >= d) return 0;
  if (t < b) return (t - a) / (b - a);
  if (t <= c) return 1;
  return 1 - (t - c) / (d - c);
}
