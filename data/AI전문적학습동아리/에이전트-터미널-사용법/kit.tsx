import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useDeck } from '../../../src/deck/DeckContext';
import { useSceneTime, interpolate, easeInOut } from '../../../src/scene';

/* ── 에이전트 터미널 사용법과 활용 — 덱 공용 틀 ─────────────────────────
   크롬(1920×1080 고정 배율 · 장 머리 · 자막 띠 · 포인터 · 영상 시간표)과
   «실화면 틀»(Screen: 실제 앱 캡처·클립을 넣고 단계마다 확대·컷 전환)만 둔다.
   구도·확대 동선·메타포는 슬라이드마다 자유 JSX로 저작한다 — 장면 템플릿을 두지 않는다.
   실화면 좌표는 모두 원본 앱 화면(1920×1080 px) 기준이고, toScene()이 덱 좌표(%)로 바꾼다. */

export const DW = 1920;
export const DH = 1080;
export const SUB_H = 130;
export const STAGE_BOTTOM = DH - SUB_H; // 950

/* 밝은 종이 바탕 + 터미널 주황. 이름은 아카데미 덱과 같게 두어(gold = 강조색) 실화면 틀 코드를 그대로 쓴다 */
export const C = {
  bg: '#f5f1e8',
  bg2: '#efe8da',
  panel: '#ffffff',
  gold: '#d9692e',      // 강조(터미널 주황을 밝은 바탕에서 읽히게 짙게)
  goldSoft: '#f5a065',  // 독 아이콘의 주황
  ink: '#1f1b16',
  muted: '#6b6257',
  faint: '#a39a8c',
  violet: '#4a5fc1',
  paper: '#ffffff',
  paperInk: '#1f1b16',
  line: 'rgba(31,27,22,.14)',
  ok: '#2e7d4f',
  warn: '#c0392b',
  term: '#0b0b0e',
};
export const SERIF = "'Pretendard Variable', Pretendard, 'Noto Sans KR', sans-serif"; // 제목도 고딕(굵게)
export const SANS = "'Pretendard Variable', Pretendard, 'Noto Sans KR', sans-serif";
export const MONO = "'D2Coding', 'Cascadia Mono', Consolas, monospace";

/* 실화면 자산 경로 — screens/<이름>.jpg (reference/ 의 같은 이름 PNG를 옮긴 것), media/<이름> */
export const SHOT = (name: string) => `data/AI전문적학습동아리/에이전트-터미널-사용법/screens/${name}.jpg`;
export const CLIP = (name: string) => `data/AI전문적학습동아리/에이전트-터미널-사용법/media/${name}`;

/* ── 글꼴 ── */
const FONT_ID = 'atg-fonts';
export function useDeckFonts() {
  useEffect(() => {
    if (document.getElementById(FONT_ID)) return;
    for (const [id, href] of [
      [FONT_ID, 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css'],
    ]) {
      const l = document.createElement('link');
      l.id = id;
      l.rel = 'stylesheet';
      l.href = href;
      document.head.appendChild(l);
    }
  }, []);
}

/* ── 고정 배율 박스 ── */
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
      <div style={{
        position: 'absolute', left: '50%', top: '50%', width: DW, height: DH,
        transform: `translate(-50%, -50%) scale(${k})`, transformOrigin: 'center', overflow: 'hidden',
        fontFamily: SANS, color: C.ink, textAlign: 'left',
        background: `radial-gradient(120% 90% at 85% 0%, ${C.bg2} 0%, ${C.bg} 55%)`,
      }}>
        {children}
      </div>
    </div>
  );
}

/** a→b 동안 0→1, c→d 동안 1→0 */
export function window4(t: number, a: number, b: number, c: number, d: number): number {
  if (t <= a || t >= d) return 0;
  if (t < b) return (t - a) / (b - a);
  if (t <= c) return 1;
  return 1 - (t - c) / (d - c);
}

/* ── 장 머리 ── */
export function Head({ chapter, title, style }: { chapter: string; title: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ position: 'absolute', left: 72, top: 36, right: 72, zIndex: 20, ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 20, fontWeight: 600, color: C.gold, letterSpacing: 0.5 }}>
        <span style={{ fontFamily: MONO, fontSize: 18 }}>{'>_'}</span>{chapter}
      </div>
      <h2 style={{ margin: '6px 0 0', fontFamily: SERIF, fontSize: 48, fontWeight: 800, letterSpacing: '-1.4px', lineHeight: 1.2, wordBreak: 'keep-all', color: C.ink }}>{title}</h2>
    </div>
  );
}

/* ── 자막 ── */
export function SubBand({ text, credit }: { text: string; credit?: string }) {
  return (
    <div data-sub={text} style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, height: SUB_H, zIndex: 80,
      background: 'color-mix(in oklab, #1a1714 92%, transparent)', borderTop: '1px solid rgba(255,255,255,.08)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 140px',
    }}>
      <div style={{ color: '#fff', fontSize: 33, fontWeight: 600, lineHeight: 1.42, textAlign: 'center', wordBreak: 'keep-all', letterSpacing: '-0.4px' }}>{text}</div>
      {credit && <div style={{ color: C.goldSoft, fontSize: 18, marginTop: 4 }}>{credit}</div>}
    </div>
  );
}

export type Sub = { at: number; text: string };
export function SceneSubs({ items, credit }: { items: Sub[]; credit?: string }) {
  const t = useSceneTime();
  let cur = items[0];
  for (const s of items) if (t >= s.at) cur = s;
  return <SubBand text={cur.text} credit={credit} />;
}
export function BuildSubs({ lines, credit }: { lines: string[]; credit?: string }) {
  const { clicks, isStatic } = useDeck();
  const i = isStatic ? lines.length - 1 : Math.min(lines.length - 1, Math.max(0, clicks));
  return <SubBand text={lines[i]} credit={credit} />;
}

/* ── 영상 시간표 ── */
export type SlideMeta = { kind: 'scene'; dur: number } | { kind: 'build'; subs: string[] };
export function stepDurations(m: SlideMeta): number[] {
  if (m.kind === 'scene') return [m.dur + 2];
  return m.subs.map((s) => Math.max(4, s.replace(/\s/g, '').length / 7 + 1.5));
}

/* ── 포인터 ── (교실 영상 덱과 같은 규약: {t,x,y,click,hide} · 씬 % · 검산 표식) */
export type Key = { t: number; x: number; y: number; click?: boolean; hide?: boolean };
export function Cursor({ path, size = 34, color = C.gold }: { path: Key[]; size?: number; color?: string }) {
  const t = useSceneTime();
  if (path.length === 0) return null;
  let x = path[0].x;
  let y = path[0].y;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    if (t >= a.t) {
      const start = a.click ? Math.min(a.t + 0.35, (a.t + b.t) / 2) : a.t;
      x = interpolate(t, [start, b.t], [a.x, b.x], easeInOut);
      y = interpolate(t, [start, b.t], [a.y, b.y], easeInOut);
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
        const d = 12 + p * 52;
        return <span key={i} aria-hidden style={{ position: 'absolute', left: `${k.x}%`, top: `${k.y}%`, width: d, height: d, transform: 'translate(-50%, -50%)', borderRadius: '50%', border: `3px solid ${color}`, opacity: 0.95 * (1 - p) * opacity, zIndex: 59, pointerEvents: 'none' }} />;
      })}
      <div aria-hidden data-walkthrough-pointer="" data-pointer-size={size}
        style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: `translate(${-size / 6}px, ${-size / 12}px)`, zIndex: 60, pointerEvents: 'none', opacity }}>
        <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: 'block', transform: `scale(${dip})`, transformOrigin: '16.667% 8.333%', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.5))' }}>
          <path d="M4 2 L4 18.6 L8.4 14.9 L11.1 20.8 L13.8 19.5 L11 13.8 L16.6 13.2 Z" fill="#fdfdfd" stroke="#12141c" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </div>
    </>
  );
}

/* ══ 실화면 틀 ══════════════════════════════════════════════════════
   frame: 덱 위 틀의 자리(px). 기본 FRAME = x 250 · y 142 · 1404×790 (배율 0.731)
   shots: 시간 순 컷. at에 0.35초 교차 페이드로 바뀐다. src = SHOT(n) 또는 clip(mp4)
   cam:   카메라 키프레임 {t, cx, cy, z} — cx·cy는 원본 화면 px(보고 싶은 중심), z는 확대(1 = 전체)
   카메라는 화면 밖을 보여 주지 않도록 중심을 자동으로 조인다. */
export type Frame = { x: number; y: number; w: number; h: number };
export const FRAME: Frame = { x: 250, y: 142, w: 1404, h: 790 }; // 아래 끝 932 < 자막 띠 950
export type Shot = { at: number; src?: string; clip?: string; poster?: string; fade?: number };
export type Cam = { t: number; cx: number; cy: number; z: number };

export function camAt(cams: Cam[] | undefined, t: number): Cam {
  if (!cams || cams.length === 0) return { t, cx: 960, cy: 540, z: 1 };
  let c = cams[0];
  for (let i = 0; i < cams.length - 1; i++) {
    const a = cams[i];
    const b = cams[i + 1];
    if (t >= a.t) {
      const u = interpolate(t, [a.t, b.t], [0, 1], easeInOut);
      c = { t, cx: a.cx + (b.cx - a.cx) * u, cy: a.cy + (b.cy - a.cy) * u, z: a.z + (b.z - a.z) * u };
    }
  }
  if (t < cams[0].t) c = cams[0];
  // 화면 밖이 보이지 않게 중심 조이기
  const hw = 960 / c.z;
  const hh = 540 / c.z;
  return { t, z: c.z, cx: Math.min(1920 - hw, Math.max(hw, c.cx)), cy: Math.min(1080 - hh, Math.max(hh, c.cy)) };
}

/** 원본 화면 좌표(px) → 덱 씬 좌표(%) — 그 시각의 카메라 기준. Cursor 경로·강조 상자에 쓴다 */
export function toScene(px: number, py: number, cam: Cam, frame: Frame = FRAME): { x: number; y: number } {
  const s = (frame.w / 1920) * cam.z;
  const sx = frame.x + frame.w / 2 + (px - cam.cx) * s;
  const sy = frame.y + frame.h / 2 + (py - cam.cy) * s;
  return { x: (sx / DW) * 100, y: (sy / DH) * 100 };
}
/** 원본 화면 좌표(px) → 덱 px (강조 상자 그리기용) */
export function toPx(px: number, py: number, cam: Cam, frame: Frame = FRAME): { x: number; y: number; s: number } {
  const s = (frame.w / 1920) * cam.z;
  return { x: frame.x + frame.w / 2 + (px - cam.cx) * s, y: frame.y + frame.h / 2 + (py - cam.cy) * s, s };
}

/** 클립 재생 — 씬 t에 맞춰 currentTime을 따라가게 한다(어긋남 0.25초 넘으면 맞춤) */
function ClipLayer({ src, poster, local, playing }: { src: string; poster?: string; local: number; playing: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const { isStatic } = useDeck();
  useEffect(() => {
    const v = ref.current;
    if (!v || isStatic) return;
    if (Math.abs(v.currentTime - local) > 0.25) v.currentTime = Math.max(0, local);
    if (playing && v.paused) void v.play().catch(() => {});
    if (!playing && !v.paused) v.pause();
    // 씬이 멈추면(seek 정지·끝) t가 더 오지 않는다 — 0.2초 동안 새 t가 없으면 영상도 멈춘다
    const stop = window.setTimeout(() => {
      if (!v.paused) v.pause();
      if (Math.abs(v.currentTime - local) > 0.05) v.currentTime = Math.max(0, local);
    }, 200);
    return () => window.clearTimeout(stop);
  }, [local, playing, isStatic]);
  if (isStatic && poster) return <img src={poster} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />;
  return <video ref={ref} src={src} poster={poster} muted playsInline preload="auto" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />;
}

export function Screen({ shots, cams, frame = FRAME, account, children, style, dim = 0 }: {
  shots: Shot[]; cams?: Cam[]; frame?: Frame; account?: string; children?: ReactNode; style?: CSSProperties; dim?: number;
}) {
  const t = useSceneTime();
  const cam = camAt(cams, t);
  const s = (frame.w / 1920) * cam.z;
  const tx = frame.w / 2 - cam.cx * s;
  const ty = frame.h / 2 - cam.cy * s;
  // 지금 보이는 컷과 직전 컷(페이드용)
  let cur = 0;
  for (let i = 0; i < shots.length; i++) if (t >= shots[i].at) cur = i;
  return (
    <div style={{ position: 'absolute', left: frame.x, top: frame.y, width: frame.w, height: frame.h, ...style }}>
      <div style={{ position: 'absolute', inset: -6, borderRadius: 16, border: '1.5px solid rgba(31,27,22,.18)', boxShadow: '0 30px 70px -30px rgba(31,27,22,.45)' }} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: 10, overflow: 'hidden', background: '#000' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${s})` }}>
          {shots.map((sh, i) => {
            if (i < cur - 1 || i > cur) return null;
            const fade = sh.fade ?? 0.35;
            const op = i === cur ? interpolate(t, [sh.at, sh.at + fade], [i === 0 ? 1 : 0, 1]) : 1;
            return (
              <div key={i} style={{ position: 'absolute', inset: 0, opacity: op }}>
                {sh.clip
                  ? <ClipLayer src={sh.clip} poster={sh.poster} local={t - sh.at} playing={i === cur} />
                  : <img src={sh.src} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: 1920, height: 1080 }} />}
              </div>
            );
          })}
        </div>
        {dim > 0 && <div style={{ position: 'absolute', inset: 0, background: `rgba(10,8,18,${dim})` }} />}
        {children}
      </div>
      {account && (
        <span style={{ position: 'absolute', right: 10, top: -40, fontSize: 17, color: C.muted, border: `1px solid ${C.line}`, borderRadius: 999, padding: '4px 14px', background: C.panel }}>{account}</span>
      )}
    </div>
  );
}

/** 실화면 위 강조 상자 — 원본 좌표 사각형(x,y,w,h px)을 그 시각 카메라로 덱 위에 그린다 */
export function Mark({ rect, cam, frame = FRAME, k = 1, color = C.gold, label, labelSide = 'top', labelSize = 20 }: {
  rect: [number, number, number, number]; cam: Cam; frame?: Frame; k?: number; color?: string; label?: string; labelSide?: 'top' | 'bottom' | 'left' | 'right'; labelSize?: number;
}) {
  if (k <= 0) return null;
  const a = toPx(rect[0], rect[1], cam, frame);
  const b = toPx(rect[0] + rect[2], rect[1] + rect[3], cam, frame);
  const pos: CSSProperties = labelSide === 'top' ? { left: 0, bottom: '100%', marginBottom: 8 }
    : labelSide === 'bottom' ? { left: 0, top: '100%', marginTop: 8 }
    : labelSide === 'left' ? { right: '100%', top: 0, marginRight: 10 } : { left: '100%', top: 0, marginLeft: 10 };
  return (
    <div style={{ position: 'absolute', left: a.x, top: a.y, width: b.x - a.x, height: b.y - a.y, zIndex: 40, opacity: k, borderRadius: 10, border: `3px solid ${color}`, boxShadow: `0 0 0 6px color-mix(in srgb, ${color} 22%, transparent), 0 0 24px color-mix(in srgb, ${color} 45%, transparent)` }}>
      {label && <span style={{ position: 'absolute', ...pos, whiteSpace: 'nowrap', fontSize: labelSize, fontWeight: 700, color: '#fff', background: color, borderRadius: 8, padding: '4px 12px' }}>{label}</span>}
    </div>
  );
}

/** 칩 */
export function Chip({ children, tone = 'gold', style }: { children: ReactNode; tone?: 'gold' | 'violet' | 'ok' | 'warn' | 'muted'; style?: CSSProperties }) {
  const col = { gold: C.gold, violet: C.violet, ok: C.ok, warn: C.warn, muted: C.muted }[tone];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, fontSize: 21, fontWeight: 600, color: col,
      background: `color-mix(in srgb, ${col} 10%, #fff)`, border: `1.5px solid color-mix(in srgb, ${col} 40%, transparent)`, whiteSpace: 'nowrap', ...style }}>{children}</span>
  );
}

/** «실제 약 N초 → 줄임» 칩 */
export function SkipChip({ sec, style }: { sec: string; style?: CSSProperties }) {
  return <Chip tone="violet" style={style}>⏩ 실제 약 {sec} — 영상에서는 줄임</Chip>;
}

/** 틀 왼쪽 여백의 단계 칩 열 — steps 중 지금 단계까지 켜짐 */
export function StepRail({ steps, at, t, x = 36, y = 190, w = 196 }: { steps: string[]; at: number[]; t: number; x?: number; y?: number; w?: number }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, display: 'flex', flexDirection: 'column', gap: 14, zIndex: 30 }}>
      {steps.map((s, i) => {
        const on = t >= at[i];
        const now = on && (i === steps.length - 1 || t < at[i + 1]);
        return (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', opacity: on ? 1 : 0.35 }}>
            <span style={{ flexShrink: 0, width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 17, fontWeight: 700,
              background: now ? C.gold : 'transparent', color: now ? '#fff' : C.gold, border: `1.5px solid ${C.gold}` }}>{i + 1}</span>
            <span style={{ fontSize: 19, lineHeight: 1.35, color: now ? C.ink : C.muted, wordBreak: 'keep-all', paddingTop: 4 }}>{s}</span>
          </div>
        );
      })}
    </div>
  );
}
