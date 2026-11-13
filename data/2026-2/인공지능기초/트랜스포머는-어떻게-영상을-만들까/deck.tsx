import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import Build from '../../../../src/deck/Build';
import Reveal from '../../../../src/deck/Reveal';
import { useDeck } from '../../../../src/deck/DeckContext';
import { Scene, useSceneTime, interpolate, spring, riseIn, easeOut, easeInOut } from '../../../../src/scene';
import { AppWindow, Pointer, Caret, typed, typedDoneAt, clickFlash, popIn, dimAfter, type CursorKey } from '../../../../src/walkthrough';

/* ── 인공지능 기초 · 2026-2 — 트랜스포머는 어떻게 영상과 음악을 만들까 (17장, 100분) ─────
   plan: data/2026-2/인공지능기초/트랜스포머는-어떻게-영상을-만들까/plan.md
   1부: 조각의 변신(scene) → 같은 기계인가(build+live) → 셋째 계단(static) → 심장은 쳐다보기(build)
        → 각설탕 컨베이어(scene) → 필름 블록 시추(scene) → 3D 모형(model) → 어텐션 네 갈래(build+live)
        → 안개 걷히는 블록(scene) → 구슬 목걸이(scene) → 한 기계 네 조각(static)
   2부: 영상 프롬프트(build) → 4컷 설계(build) → 미리캔버스 절차(static) → 활동(activity)
        → 한눈 정리(build+exit) → 되감기(scene)
   테마: 다크 필름 블랙 + 빛의 삼원색(마젠타·시안·옐로). 어텐션 표시만 형광 앰버(앞 두 수업의 형광펜). */

const BASE = 'data/2026-2/인공지능기초/트랜스포머는-어떻게-영상을-만들까';
const SITE = 'https://2026kijunit.netlify.app';
const MODEL_PATH = `/${BASE}/모형-조각은-어디를-보는가.html`;
const ACTIVITY_PATH = `/${BASE}/활동지.html`;
const MIRI_URL = 'https://www.miricanvas.com';

const C = { mag: '#ff4fa3', cyan: '#3ddcff', yellow: '#ffd24a', amber: '#f5a524', mint: '#7ee0b8', red: '#ff5a4e', sky: '#4a8fe8', grass: '#4fa85a' };

/* ── Fit — 1920×1080 설계 박스 배율 변환 ── */
const DW = 1920, DH = 1080;
function Fit({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(1);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver((entries) => { const r = entries[0].contentRect; if (r.width && r.height) setK(Math.min(r.width / DW, r.height / DH)); });
    ro.observe(el); return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: DW, height: DH, transform: `translate(-50%, -50%) scale(${k})`, transformOrigin: 'center', overflow: 'hidden' }}>{children}</div>
    </div>
  );
}
const abs = (x: number, y: number, w?: number, h?: number): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h });
const kick: CSSProperties = { fontSize: 15, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--fg-faint)' };
const h1: CSSProperties = { fontFamily: 'var(--font-head)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.08, fontSize: 60, wordBreak: 'keep-all', margin: 0 };
const h2: CSSProperties = { ...h1, fontSize: 48 };
const body: CSSProperties = { fontSize: 22, lineHeight: 1.5, color: 'var(--fg-muted)', wordBreak: 'keep-all' };
const mono: CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };
const card: CSSProperties = { background: 'var(--surface)', border: '1px solid var(--hair)', borderRadius: 18, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' };
const accentText: CSSProperties = { background: 'var(--accent)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };
function mulberry32(a: number) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
function LinkButton({ href, children, size = 22, sub }: { href: string; children: ReactNode; size?: number; sub?: string }) {
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 8 }}>
      <a href={href} target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: `${size * 0.6}px ${size * 1.3}px`, borderRadius: 999, background: 'var(--accent)', color: 'var(--accent-ink)', fontWeight: 800, fontSize: size, textDecoration: 'underline', textDecorationThickness: 2, textUnderlineOffset: 4, boxShadow: 'var(--glow)', wordBreak: 'keep-all' }}>{children}</a>
      {sub && <div style={{ ...kick, fontSize: 13, textTransform: 'none', letterSpacing: 0 }}>{sub}</div>}
    </div>
  );
}
/* 4단계 눈금 (LLM 수업 회수) */
const STEPS4 = ['① 자르기', '② 좌표로', '③ 서로 쳐다보기', '④ 고르기'];
function Gauge4({ x, y, w, hot, dim }: { x: number; y: number; w: number; hot: number; dim?: number[] }) {
  return (
    <div style={{ ...abs(x, y, w), display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
      {STEPS4.map((s, i) => (
        <div key={s} style={{ padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${i === hot ? C.amber : 'var(--hair)'}`, background: i === hot ? 'rgba(245,165,36,0.16)' : 'var(--surface)', color: i === hot ? C.amber : dim?.includes(i) ? 'var(--fg-faint)' : 'var(--fg-muted)', fontWeight: 800, fontSize: 17, textAlign: 'center', whiteSpace: 'nowrap' }}>{s}</div>
      ))}
    </div>
  );
}
/* 계단 3개 (그림 수업 회수) */
function Stairs({ x, y, complete, film }: { x: number; y: number; complete: boolean; film?: boolean }) {
  const steps = [{ w: 300, h: 120, label: 'GAN', year: '2014', d: '판별자를 속이는 법' }, { w: 340, h: 200, label: '확산 모델', year: '2015 · DDPM 2020', d: '노이즈를 걷어내는 법' }, { w: 460, h: 300, label: '트랜스포머', year: '', d: '조각이 서로 쳐다보고 고르는 법' }];
  let cx = x;
  return (
    <>
      {steps.map((s, i) => {
        const el = (
          <div key={i} style={{ ...abs(cx, y - s.h, s.w, s.h), borderRadius: 14, border: i === 2 ? (complete ? `2px solid ${C.mag}` : `2px dashed ${C.mag}`) : '1px solid var(--hair)', background: i === 2 ? (complete ? 'rgba(255,79,163,0.14)' : 'rgba(255,79,163,0.05)') : 'var(--surface)', padding: '18px 22px', boxSizing: 'border-box', opacity: i === 2 || complete ? 1 : 0.75 }}>
            <div style={{ ...kick, color: i === 2 ? C.mag : 'var(--fg-faint)' }}>{i === 2 ? '계단 ③ · 오늘' : `계단 ${i + 1} · ${s.year}`}</div>
            <div style={{ fontSize: i === 2 ? 40 : 28, fontWeight: 800, marginTop: 6, wordBreak: 'keep-all' }}>{s.label}</div>
            <div style={{ ...body, fontSize: i === 2 ? 21 : 17, marginTop: 6 }}>{s.d}</div>
            {i === 2 && film && <div style={{ position: 'absolute', right: 18, top: 16, display: 'flex', gap: 3 }}>{[0, 1, 2, 3].map((k) => <div key={k} style={{ width: 22, height: 30, borderRadius: 3, background: [C.sky, C.grass, C.yellow, C.mag][k], opacity: 0.9 }} />)}</div>}
          </div>
        );
        cx += s.w + 14;
        return el;
      })}
    </>
  );
}
/* 풍경 격자(그림·영상 장면 공용) — 하늘·언덕·해. sun = 해의 열 위치 */
function landscape(cols: number, rows: number, sun: number) {
  const out: string[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const skyRows = Math.round(rows * 0.55);
    let col = r < skyRows ? `hsl(214 70% ${58 - r * 4}%)` : `hsl(125 42% ${38 + (r - skyRows) * 4}%)`;
    if (r === 1 && Math.abs(c - sun) < 0.6) col = C.yellow;
    out.push(col);
  }
  return out;
}

/* ───────────── S1 조각의 변신 ───────────── */
const S1_COLORS = (() => { const r = mulberry32(7); const pal = [C.mag, C.cyan, C.yellow, C.mint]; return Array.from({ length: 12 }, () => pal[Math.floor(r() * pal.length)]); })();
function TransformScene() {
  const t = useSceneTime();
  const size = 54;
  const phases = [
    (i: number) => [180 + i * 76, 300],                                              // 글 — 한 줄
    (i: number) => [430 + (i % 4) * 76, 200 + Math.floor(i / 4) * 76],               // 그림 — 4×3 격자
    (i: number) => { const layer = i % 3, k = Math.floor(i / 3); return [520 + (k % 2) * 76 + layer * 34, 200 + Math.floor(k / 2) * 76 - layer * 34]; }, // 영상 — 3층 블록
    (i: number) => [200 + i * 118, 860 + Math.sin(i * 1.1) * 26],                   // 소리 — 파형 위 구슬
  ];
  const scatter = (i: number) => { const r = mulberry32(100 + i); return [r() * 900, r() * 700 + 100]; };
  const seg = [[0.4, 1.6], [1.6, 2.8], [2.8, 4.0], [4.0, 5.4]];
  const phaseNames = ['글', '그림', '영상', '소리'];
  return (
    <>
      {/* 파형 (소리 국면) */}
      <svg style={{ ...abs(0, 0, DW, DH) }} aria-hidden>
        <path d={Array.from({ length: 90 }, (_, k) => `${k ? 'L' : 'M'}${140 + k * 16},${860 + Math.sin(k * 0.55) * 26 + Math.sin(k * 1.7) * 8}`).join(' ')} fill="none" stroke={C.cyan} strokeWidth={2} opacity={interpolate(t, [4.0, 4.8], [0, 0.55])} />
      </svg>
      {S1_COLORS.map((col, i) => {
        let pos = scatter(i);
        for (let p = 0; p < 4; p++) { const [a, b] = seg[p]; const k = interpolate(t, [a, b], [0, 1], easeInOut); const target = phases[p](i); pos = [lerp(pos[0], target[0], k), lerp(pos[1], target[1], k)]; }
        const round = interpolate(t, [4.0, 5.0], [8, 27]);
        const sc = 0.6 + 0.4 * spring(t, 0.1 + i * 0.04, 0.7);
        return <div key={i} style={{ ...abs(pos[0], pos[1], size, size), borderRadius: round, background: col, opacity: Math.min(1, spring(t, 0.05 + i * 0.04, 0.6) * 1.5), transform: `scale(${sc})`, boxShadow: `0 0 18px ${col}55` }} />;
      })}
      {/* 국면 칩 */}
      <div style={{ ...abs(180, 1000), display: 'flex', gap: 14 }}>
        {phaseNames.map((n, p) => { const on = t >= seg[p][0] + 0.3; return <div key={n} style={{ padding: '8px 18px', borderRadius: 999, border: `1.5px solid ${on ? C.mag : 'var(--hair)'}`, color: on ? C.mag : 'var(--fg-faint)', fontWeight: 800, fontSize: 18, background: on ? 'rgba(255,79,163,0.12)' : 'transparent' }}>{n}</div>; })}
      </div>
      {/* 제목 밴드 */}
      <div style={{ ...abs(1100, 110), ...kick, opacity: interpolate(t, [0, 0.4], [0, 1]) }}>인공지능 기초 · 2026-2 · 셋째 계단</div>
      <div style={{ ...abs(1100, 340, 720) }}>
        <h1 style={{ ...h1, fontSize: 66, ...riseIn(t, 5.6) }}>트랜스포머는 어떻게<br /><span style={accentText}>영상과 음악</span>을 만들까</h1>
        <p style={{ ...body, fontSize: 26, marginTop: 26, ...riseIn(t, 6.1) }}>같은 조각, 다른 배열.<br />조각이 무엇이든 트랜스포머는 같은 일을 한다.</p>
      </div>
    </>
  );
}

/* ───────────── S2 같은 기계인가 ───────────── */
function SameMachineSlide() {
  return (
    <>
      <div style={{ ...abs(110, 90), ...kick }}>오늘의 질문</div>
      <Reveal><h2 style={{ ...abs(110, 140, 1400), ...h2 }}>같은 기계인가, <span style={accentText}>다른 기계인가</span></h2></Reveal>
      {/* 글 카드 */}
      <div style={{ ...abs(130, 280, 250, 420), ...card, padding: 22, boxSizing: 'border-box' }}>
        <div style={kick}>글 · ChatGPT</div>
        {[180, 140, 200, 120, 190, 90, 170].map((w, i) => <div key={i} style={{ width: w * 0.9, height: 10, borderRadius: 5, background: 'var(--fg-faint)', opacity: 0.55, marginTop: 20 }} />)}
      </div>
      {/* 그림 카드 */}
      <div style={{ ...abs(420, 250, 380, 380), ...card, padding: 22, boxSizing: 'border-box' }}>
        <div style={kick}>그림 · FLUX</div>
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 3 }}>
          {landscape(8, 6, 6).map((c, i) => <div key={i} style={{ height: 34, borderRadius: 3, background: c }} />)}
        </div>
      </div>
      {/* 영상 카드 */}
      <div style={{ ...abs(840, 330, 560, 330), ...card, padding: 22, boxSizing: 'border-box' }}>
        <div style={kick}>영상 · Kling</div>
        <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
          {[0, 1, 2, 3].map((f) => (
            <div key={f} style={{ flex: 1, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--hair)' }}>
              <div style={{ height: 8, background: 'repeating-linear-gradient(90deg, #000 0 6px, #333 6px 12px)' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 2, padding: 4 }}>{landscape(6, 5, 1 + f * 1.3).map((c, i) => <div key={i} style={{ height: 28, background: c, borderRadius: 2 }} />)}</div>
              <div style={{ height: 8, background: 'repeating-linear-gradient(90deg, #000 0 6px, #333 6px 12px)' }} />
            </div>
          ))}
        </div>
        <div style={{ ...body, fontSize: 17, marginTop: 12 }}>프레임이 이어지며 해가 움직인다</div>
      </div>
      {/* 음악 띠 */}
      <div style={{ ...abs(130, 740, 1270, 150), ...card, padding: 22, boxSizing: 'border-box' }}>
        <div style={kick}>음악 · Suno</div>
        <svg width={1220} height={70} style={{ marginTop: 6 }}>
          <path d={Array.from({ length: 150 }, (_, k) => `${k ? 'L' : 'M'}${k * 8.2},${35 + Math.sin(k * 0.5) * 22 + Math.sin(k * 1.9) * 8}`).join(' ')} fill="none" stroke={C.cyan} strokeWidth={2.5} />
        </svg>
      </div>
      <Build at={1} style={{ ...abs(1460, 300, 380), zIndex: 5 }}>
        <div style={{ ...card, padding: '28px 30px', border: `2px solid ${C.mag}`, boxShadow: 'var(--glow)', textAlign: 'center' }}>
          <div style={{ fontSize: 120, fontWeight: 900, lineHeight: 1, ...accentText }}>?</div>
          <div style={{ fontSize: 34, fontWeight: 800, marginTop: 8 }}>안은?</div>
          <div style={{ ...body, fontSize: 20, marginTop: 10 }}>겉은 전혀 다르다. 안은 어떨까.</div>
        </div>
      </Build>
      <Build at={2} style={{ ...abs(110, 960, 1700) }}>
        <div style={{ ...kick, color: C.mag }}>라이브 · 객관식 "글을 쓰는 AI와 영상을 만드는 AI는 안이 어떻게 다를까?" — 분포만 보고, 정답은 1부 정리(S12)에서 공개</div>
      </Build>
    </>
  );
}

/* ───────────── S3 셋째 계단 ───────────── */
function StairsSlide() {
  return (
    <>
      <div style={{ ...abs(110, 90), ...kick }}>지도 · 그림 수업의 계단 = 우리가 배우는 순서 (기술의 세대 교체가 아니다)</div>
      <Reveal><h2 style={{ ...abs(110, 140, 1200), ...h2 }}>점선이던 <span style={accentText}>셋째 계단</span>을 오른다</h2></Reveal>
      <Stairs x={110} y={860} complete />
      <div style={{ ...abs(1256, 560, 250), display: 'grid', gap: 10 }}>
        {[['1부', '원리 · 50분'], ['2부', '실습 · 45분']].map(([a, b]) => <div key={a} style={{ ...card, padding: '10px 16px', borderLeft: `4px solid ${C.mag}` }}><b style={{ fontSize: 20 }}>{a}</b> <span style={{ ...body, fontSize: 18 }}>{b}</span></div>)}
      </div>
      <div style={{ ...abs(1400, 250, 400) }}>
        <div style={kick}>100분</div>
        {[['1부 원리', '조각의 확장 · 3D 모형 · 만드는 법', 50], ['휴식', '', 5], ['2부 실습', '안내·정리 19분 + 제작·제출 활동 26분', 45]].map(([a, b, m]) => (
          <div key={a as string} style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 22, fontWeight: 800 }}><span>{a}</span><span style={{ ...mono, color: 'var(--fg-muted)' }}>{m}분</span></div>
            <div style={{ height: 8, borderRadius: 4, background: 'var(--surface)', marginTop: 6 }}><div style={{ width: `${(m as number) / 100 * 100}%`, height: '100%', borderRadius: 4, background: a === '휴식' ? 'var(--fg-faint)' : 'var(--accent)' }} /></div>
            {b && <div style={{ ...body, fontSize: 17, marginTop: 4 }}>{b}</div>}
          </div>
        ))}
      </div>
      <div style={{ ...abs(110, 930, 1700), ...body }}>두 계단은 지난 시간에 올랐다. 오늘의 계단은 조각이 무엇이든 서로 쳐다보고 고르는 기계, 트랜스포머다.</div>
    </>
  );
}

/* ───────────── S4 트랜스포머라는 이름 ───────────── */
function NameSlide() {
  const { clicks } = useDeck();
  const chip = (s: string, on: boolean): CSSProperties => ({ padding: '6px 12px', borderRadius: 8, border: `1.5px solid ${on ? C.amber : 'var(--hair)'}`, background: on ? 'rgba(245,165,36,0.16)' : 'var(--surface)', fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap' });
  return (
    <>
      <div style={{ ...abs(110, 90), ...kick }}>이름부터 · 2분</div>
      <Reveal><h2 style={{ ...abs(110, 140, 1400), ...h2 }}>트랜스포머, <span style={accentText}>이름의 뜻</span></h2></Reveal>
      {/* 낱말 해부 — dominant */}
      <div style={{ ...abs(110, 250, 1060), display: 'flex', alignItems: 'baseline', gap: 16, whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: 118, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em', color: 'var(--fg-muted)' }}>TRANS</span>
        <span style={{ fontSize: 54, color: 'var(--fg-faint)' }}>+</span>
        <span style={{ fontSize: 118, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em', ...accentText }}>FORM</span>
        <span style={{ fontSize: 56, fontWeight: 900, color: 'var(--fg-faint)' }}>-er</span>
      </div>
      <div style={{ ...abs(110, 400, 900), display: 'flex', gap: 18 }}>
        <div style={{ width: 420 }}><div style={kick}>trans-</div><div style={{ fontSize: 24, fontWeight: 800 }}>건너서 · 넘어서</div></div>
        <div style={{ width: 300 }}><div style={{ ...kick, color: C.mag }}>form</div><div style={{ fontSize: 24, fontWeight: 800 }}>형태</div></div>
        <div><div style={kick}>-er</div><div style={{ fontSize: 24, fontWeight: 800 }}>~하는 것</div></div>
      </div>
      <div style={{ ...abs(110, 480, 900), fontSize: 30, fontWeight: 800 }}>= 형태를 <span style={{ color: C.amber }}>바꾸는</span> 것 · 변환기</div>
      {/* 오른쪽: 2017 논문 카드 */}
      <div style={{ ...abs(1200, 250, 610, 270), ...card, padding: '22px 26px', boxSizing: 'border-box' }}>
        <div style={{ ...kick, textTransform: 'none', letterSpacing: '0.08em' }}>2017 · 구글 · 논문 「Attention Is All You Need」</div>
        <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, wordBreak: 'keep-all' }}>"이름은 저자 한 명이 <span style={{ color: C.amber }}>소리가 마음에 들어서</span> 골랐다"</div>
        <div style={{ ...body, fontSize: 17, marginTop: 10 }}>초기 설계 문서 제목은 「Transformers: …」였고 변신 로봇 그림까지 들어 있었다고 한다. 논문 제목은 비틀스의 노래 제목을 흉내 낸 것. 이름은 장난이었지만, 하는 일은 이름 그대로다.</div>
      </div>
      {/* Build 1 — 세 가지 트랜스포머 */}
      <Build at={1} style={{ ...abs(110, 570, 380, 250) }}>
        <div style={{ ...card, padding: '18px 22px', height: '100%', boxSizing: 'border-box' }}>
          <div style={kick}>전기 · 변압기</div>
          <svg width={330} height={110} viewBox="0 0 330 110" style={{ marginTop: 8 }}>
            {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${40 + i * 14},30 a7,10 0 1 1 0,40`} fill="none" stroke={C.cyan} strokeWidth={3} />)}
            <rect x={140} y={18} width={22} height={70} fill="none" stroke="var(--fg-faint)" strokeWidth={3} />
            {[0, 1, 2].map((i) => <path key={i} d={`M${190 + i * 14},38 a7,7 0 1 1 0,28`} fill="none" stroke={C.cyan} strokeWidth={3} />)}
            <text x={78} y={100} textAnchor="middle" fill="var(--fg-muted)" fontSize={15} fontWeight={700}>220 V</text>
            <text x={210} y={100} textAnchor="middle" fill="var(--fg-muted)" fontSize={15} fontWeight={700}>5 V</text>
            <path d="M255,50 L300,50" stroke={C.amber} strokeWidth={3} markerEnd="url(#name-arr)" />
            <defs><marker id="name-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill={C.amber} /></marker></defs>
          </svg>
          <div style={{ fontSize: 22, fontWeight: 800 }}>전압을 바꾼다</div>
        </div>
      </Build>
      <Build at={1} style={{ ...abs(520, 570, 380, 250) }}>
        <div style={{ ...card, padding: '18px 22px', height: '100%', boxSizing: 'border-box' }}>
          <div style={kick}>영화 · 변신 로봇</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 22, height: 80 }}>
            <span style={chip('자동차', false)}>자동차</span><span style={{ fontSize: 30, color: C.amber }}>⇄</span><span style={chip('로봇', true)}>로봇</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 14 }}>형태를 바꾼다</div>
        </div>
      </Build>
      <Build at={1} style={{ ...abs(930, 550, 880, 290) }}>
        <div style={{ ...card, padding: '18px 24px', height: '100%', boxSizing: 'border-box', border: `2px solid ${C.mag}`, boxShadow: 'var(--glow)' }}>
          <div style={{ ...kick, color: C.mag }}>AI · 트랜스포머 (2017~)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 }}>
            <div style={{ display: 'grid', gap: 6 }}>{['오늘', '비가', '와서', '?'].map((w, i) => <span key={w} style={chip(w, i === 3)}>{w}</span>)}</div>
            <span style={{ fontSize: 30, color: C.amber }}>→</span>
            <div style={{ position: 'relative', width: 300, height: 150 }}>
              {[0, 1, 2, 3].map((k) => <div key={k} style={{ position: 'absolute', left: k * 10, top: 100 - k * 30, width: 260, height: 40, borderRadius: 10, border: `1.5px solid ${C.amber}`, background: 'rgba(11,13,18,0.9)', display: 'grid', placeItems: 'center', fontSize: 15, fontWeight: 700, color: k === 3 ? C.amber : 'var(--fg-muted)' }}>{k === 3 ? '서로 쳐다보기' : ''}</div>)}
            </div>
            <span style={{ fontSize: 30, color: C.amber }}>→</span>
            <div style={{ display: 'grid', gap: 6 }}>{['오늘', '비가', '와서', '우산'].map((w, i) => <span key={w} style={chip(w, i === 3)}>{w}</span>)}</div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 14 }}>조각이 서로 쳐다보며 자기 뜻을 고쳐 쓴다</div>
        </div>
      </Build>
      {/* Build 2 — 오늘의 질문으로 연결 */}
      <Build at={2} style={{ ...abs(110, 870, 1700) }}>
        <div style={{ ...card, padding: '18px 26px', display: 'flex', alignItems: 'center', gap: 26 }}>
          <div style={{ fontSize: 26, fontWeight: 800, whiteSpace: 'nowrap' }}>그러면 오늘의 질문은</div>
          <div style={{ ...body, fontSize: 22, flex: 1 }}><b style={{ color: C.amber }}>무엇을 무엇으로 바꾸는가.</b> 글 → 글, 그림 조각 → 그림, 사진 → 영상, 프롬프트 → 음악. 바꾸는 방법은 하나다 — 조각이 서로 쳐다보고 고른다. 다음 장에서 그 하나를 다시 꺼낸다.</div>
        </div>
      </Build>
    </>
  );
}

/* ───────────── S5 심장은 쳐다보기 ───────────── */
function HeartSlide() {
  const { clicks } = useDeck();
  return (
    <>
      <div style={{ ...abs(110, 90), ...kick }}>LLM 수업의 4단계 복습</div>
      <Reveal><h2 style={{ ...abs(110, 140, 1400), ...h2 }}>심장은 <span style={accentText}>'서로 쳐다보기'</span>다</h2></Reveal>
      <Gauge4 x={110} y={260} w={1700} hot={clicks >= 1 ? 2 : -1} />
      <Build at={1} style={{ ...abs(560, 380, 800) }}>
        <div style={{ ...card, padding: '26px 30px', border: `2px solid ${C.amber}` }}>
          <div style={{ ...kick, color: C.amber }}>③ 서로 쳐다보기 · 어텐션</div>
          <div style={{ fontSize: 30, fontWeight: 800, marginTop: 8, wordBreak: 'keep-all' }}>조각마다 "나는 어느 조각을 봐야 하나"를 점수로 정한다</div>
          <svg width={740} height={120} style={{ marginTop: 14 }}>
            {['밤에', '배를', '타고', '가다가', '배가', '고파서'].map((w, i) => <g key={w}><rect x={10 + i * 120} y={60} width={100} height={40} rx={8} fill="var(--surface-2)" stroke={i === 5 ? C.amber : 'var(--hair)'} strokeWidth={i === 5 ? 2 : 1} /><text x={60 + i * 120} y={86} textAnchor="middle" fill="var(--fg)" fontSize={18} fontWeight={700}>{w}</text></g>)}
            {/* '고파서'(6번째, 중심 x=660)가 '배가'(5번째, 굵게)와 '배를'(2번째, 얇게)을 쳐다본다 — 선은 상자 윗변 중앙에서 시작·종료 */}
            {[[1, 2, 0.5], [4, 5, 1]].map(([j, w, o]) => { const x1 = 660, x2 = 60 + j * 120; const h = 14 + Math.abs(x1 - x2) * 0.09; return <g key={j}><path d={`M${x1},58 C${x1},${58 - h} ${x2},${58 - h} ${x2},58`} fill="none" stroke={C.amber} strokeWidth={w} opacity={o} /><circle cx={x2} cy={58} r={w === 5 ? 6 : 4} fill={C.amber} opacity={o} /></g>; })}
            <circle cx={660} cy={58} r={6} fill={C.amber} />
          </svg>
        </div>
      </Build>
      <Build at={2} style={{ ...abs(110, 380, 400) }}>
        <div style={{ ...card, padding: '22px 24px', borderLeft: `4px solid ${C.mag}` }}>
          <div style={kick}>① 자르기의 대상이 바뀌면?</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>{['그림', '영상', '소리'].map((w) => <div key={w} style={{ padding: '8px 14px', borderRadius: 999, border: `1.5px solid ${C.mag}`, color: C.mag, fontWeight: 800, fontSize: 20 }}>{w}?</div>)}</div>
          <div style={{ ...body, fontSize: 19, marginTop: 14 }}>①이 바뀌고 ③의 보는 범위가 달라진다. ②③④의 뼈대는 같다 — 다만 ④에서 무엇을 예측하는지(다음 토큰 / 노이즈)는 매체마다 다르다.</div>
        </div>
      </Build>
      <Build at={2} style={{ ...abs(536, 330, 1274, 30) }}>
        <div style={{ height: 22, borderTop: '2px solid var(--fg-faint)', borderLeft: '2px solid var(--fg-faint)', borderRight: '2px solid var(--fg-faint)', borderRadius: '8px 8px 0 0', position: 'relative' }}><div style={{ position: 'absolute', left: '50%', top: -16, transform: 'translateX(-50%)', ...kick, background: 'var(--bg)', padding: '0 10px', color: 'var(--fg-muted)' }}>②③④의 뼈대는 그대로</div></div>
      </Build>
      <Build at={3} style={{ ...abs(110, 800, 1700) }}>
        <div style={{ fontSize: 40, fontWeight: 800 }}>조각이 무엇이든, <span style={accentText}>쳐다보고 고른다.</span></div>
      </Build>
    </>
  );
}

/* ───────────── S6 각설탕 컨베이어 ───────────── */
function PatchConveyorScene() {
  const t = useSceneTime();
  const cols = 8, rows = 6, cell = 54, gap = 4, ox = 150, oy = 190;
  const colors = landscape(cols, rows, 6);
  const cut = interpolate(t, [0.5, 1.6], [0, 1], easeOut);
  const beltY = 800;
  return (
    <>
      {/* 컨베이어 */}
      <div style={{ ...abs(560, beltY - 10, 1240, 64), borderRadius: 32, background: 'linear-gradient(180deg, #2a2f3a, #171b24)', border: '1px solid var(--hair)', opacity: interpolate(t, [1.4, 2.0], [0, 1]) }} />
      {[600, 1760].map((x) => <div key={x} style={{ ...abs(x - 26, beltY - 4, 52, 52), borderRadius: 26, border: '3px solid var(--fg-faint)', background: 'var(--bg)', opacity: interpolate(t, [1.4, 2.0], [0, 1]), transform: `rotate(${t * 120}deg)` }}><div style={{ position: 'absolute', left: '50%', top: 4, width: 3, height: 20, background: 'var(--fg-faint)', marginLeft: -1.5 }} /></div>)}
      {/* 칼날 격자 */}
      <svg style={{ ...abs(0, 0, DW, DH) }} aria-hidden>
        {Array.from({ length: cols + 1 }, (_, c) => <line key={'v' + c} x1={ox + c * (cell + gap) - gap / 2} y1={oy - 20} x2={ox + c * (cell + gap) - gap / 2} y2={oy + rows * (cell + gap)} stroke="#fff" strokeWidth={2} opacity={cut * 0.7 * (1 - interpolate(t, [2.6, 3.4], [0, 1]))} />)}
        {Array.from({ length: rows + 1 }, (_, r) => <line key={'h' + r} x1={ox - 20} y1={oy + r * (cell + gap) - gap / 2} x2={ox + cols * (cell + gap)} y2={oy + r * (cell + gap) - gap / 2} stroke="#fff" strokeWidth={2} opacity={cut * 0.7 * (1 - interpolate(t, [2.6, 3.4], [0, 1]))} />)}
      </svg>
      {colors.map((col, i) => {
        const r = Math.floor(i / cols), c = i % cols;
        const home = [ox + c * (cell + gap), oy + r * (cell + gap)];
        const goes = i < 14;
        const k = goes ? interpolate(t, [1.6 + i * 0.09, 2.4 + i * 0.09], [0, 1], easeInOut) : 0;
        const target = [600 + i * 82, beltY - 60];
        const pos = [lerp(home[0], target[0], k), lerp(home[1], target[1], k)];
        const tag = goes ? interpolate(t, [3.4 + i * 0.05, 3.8 + i * 0.05], [0, 1]) : 0;
        return (
          <div key={i} style={{ ...abs(pos[0], pos[1], cell, cell) }}>
            <div style={{ width: cell, height: cell, borderRadius: 4 + cut * 4, background: col, transform: `scale(${1 - cut * 0.08})`, boxShadow: cut > 0.5 ? '0 6px 14px rgba(0,0,0,0.5)' : 'none' }} />
            {goes && <div style={{ position: 'absolute', top: cell + 10, left: -10, width: cell + 20, textAlign: 'center', ...mono, fontSize: 15, fontWeight: 700, color: C.amber, background: 'rgba(11,13,18,0.85)', borderRadius: 6, padding: '2px 0', opacity: tag }}>({r + 1},{c + 1})</div>}
          </div>
        );
      })}
      <div style={{ ...abs(1700, beltY - 60), fontSize: 30, color: 'var(--fg-faint)', opacity: interpolate(t, [2.8, 3.4], [0, 1]) }}>…</div>
      {/* 텍스트 밴드 */}
      <div style={{ ...abs(720, 110), ...kick }}>조각의 확장 ① · 그림</div>
      <h2 style={{ ...abs(720, 150, 1100), ...h2 }}>그림도 <span style={accentText}>조각</span>이다</h2>
      <div style={{ ...abs(720, 300, 900), ...body }}>ViT(2020)는 사진을 작은 정사각형 패치(예: 16×16 픽셀)로 잘라 한 줄로 세운다. 각 조각에 위치 정보(위치 임베딩)를 붙이면 글자 토큰과 같은 자리에 선다.</div>
      <div style={{ ...abs(720, 440, 700), ...card, padding: '16px 22px', borderLeft: `4px solid ${C.cyan}`, opacity: interpolate(t, [3.6, 4.2], [0, 1]) }}>
        <div style={{ fontSize: 26, fontWeight: 800 }}>패치 = 그림의 토큰 <span style={{ ...body, fontSize: 17 }}>(패치를 벡터로 바꾼 것 = 패치 임베딩)</span></div>
        <div style={{ ...body, fontSize: 19, marginTop: 4 }}>자르기(①) → 위치 정보 붙이기(②) → 이제 서로 쳐다볼 수 있다(③)</div>
      </div>
    </>
  );
}

/* ───────────── S7 필름 블록과 시추기 ───────────── */
function FilmBlockScene() {
  const t = useSceneTime();
  const frames = 6, W = 400, H = 280, dx = -56, dy = 40, bx = 780, by = 250;
  const cols = 8, rows = 5;
  const drillY = interpolate(t, [1.8, 3.0], [-260, 0], easeInOut);
  const pull = interpolate(t, [3.0, 4.0], [0, 1], easeInOut);
  const cellW = (W - 20) / cols, cellH = (H - 20) / rows;
  const hole = { c: 2, r: 1 };   // 해가 지나가는 칸 — 네 단면이 시간에 따라 달라진다
  return (
    <>
      {Array.from({ length: frames }, (_, k) => {
        const s = spring(t, 0.3 + k * 0.22, 0.7);
        const x = bx + k * dx, y = by + k * dy;
        return (
          <div key={k} style={{ ...abs(x, y, W, H), borderRadius: 10, border: '1px solid var(--hair)', background: 'rgba(11,13,18,0.85)', padding: 10, boxSizing: 'border-box', opacity: Math.min(1, s * 1.3), transform: `translateY(${(1 - s) * -40}px)`, zIndex: 10 - k, display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 2 }}>
            {landscape(cols, rows, 1 + k * 1.1).map((col, i) => { const r = Math.floor(i / cols), c = i % cols; const isHole = c === hole.c && r === hole.r && pull > 0.05; return <div key={i} style={{ background: isHole ? 'rgba(0,0,0,0.6)' : col, borderRadius: 2, outline: isHole ? `1px dashed ${C.amber}` : 'none' }} />; })}
          </div>
        );
      })}
      {/* 시추기 */}
      <div style={{ ...abs(bx + 10 + hole.c * cellW + cellW / 2 - 9, by - 300 + drillY, 18, 300), background: 'linear-gradient(90deg, #6b7280, #cbd5e1, #6b7280)', borderRadius: 9, opacity: interpolate(t, [1.6, 1.9], [0, 1]) * (1 - pull), zIndex: 20 }} />
      {/* 뽑힌 시공간 패치 — 프레임 4장을 관통한 기둥 */}
      {Array.from({ length: 4 }, (_, k) => {
        const sx = bx + 10 + hole.c * cellW + k * dx, sy = by + 10 + hole.r * cellH + k * dy;
        const tx = 1440 + k * 18, ty = 660 - k * 52;
        const x = lerp(sx, tx, pull), y = lerp(sy, ty, pull);
        return <div key={k} style={{ ...abs(x, y, cellW * 1.6, cellH * 1.6), background: landscape(cols, rows, 1 + k * 1.1)[hole.r * cols + hole.c], border: `2px solid ${C.amber}`, borderRadius: 4, opacity: pull > 0.02 ? 1 : 0, zIndex: 30 - k, boxShadow: '0 8px 20px rgba(0,0,0,0.6)' }}><div style={{ position: 'absolute', left: cellW * 1.6 + 10, top: 6, ...mono, fontSize: 15, color: C.amber, opacity: pull }}>t{k + 1}</div></div>;
      })}
      <div style={{ ...abs(1380, 740, 440), ...card, padding: '14px 18px', borderLeft: `4px solid ${C.amber}`, opacity: interpolate(t, [3.9, 4.3], [0, 1]) }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>시공간 패치 · 가로 1 × 세로 1 × <span style={{ color: C.amber }}>시간 4</span></div>
        <div style={{ ...body, fontSize: 17, marginTop: 4 }}>같은 자리의 프레임 4장을 한 덩어리로 자른 조각 — t2에서 해가 지나간다 (설명용 크기, 실제 크기는 모델마다 다르다)</div>
      </div>
      {/* 텍스트 밴드 */}
      <div style={{ ...abs(110, 110), ...kick }}>조각의 확장 ② · 영상</div>
      <h2 style={{ ...abs(110, 150, 560), ...h2 }}>영상은 <span style={accentText}>시공간 조각</span>이다</h2>
      <div style={{ ...abs(110, 330, 480), ...body }}>프레임을 쌓으면 가로·세로·시간의 블록(앞이 t1, 뒤로 갈수록 시간 →). 조각을 뽑을 때 시간 방향으로도 두껍게 뽑는다. Sora(2024)는 영상을 압축한 뒤 이렇게 자른 조각을 시공간 패치라고 불렀다.</div>
      <div style={{ ...abs(110, 900, 1700), fontSize: 30, fontWeight: 800, ...riseIn(t, 4.4) }}>조각 하나가 "이 자리가 시간에 따라 어떻게 변했는지"를 <span style={accentText}>함께 담고 있다.</span></div>
    </>
  );
}

/* ───────────── S8 3D 모형 ───────────── */
function ModelSlide() {
  const { isStatic } = useDeck();
  return (
    <>
      <div style={{ ...abs(110, 70), ...kick }}>3D 모형 · 12분 · 슬라이드 안에서 바로 조작 — 자세한 계산은 링크로</div>
      <Reveal><h2 style={{ ...abs(110, 108, 1100), ...h2, fontSize: 44 }}>조각은 <span style={accentText}>어디를 보는가</span></h2></Reveal>
      {/* 모형 삽입 — 무대 + 어텐션 종류·기준 조각·재생 바만 (embed=1). 썸네일에서는 WebGL을 띄우지 않는다 */}
      <div style={{ ...abs(110, 190, 1180, 700), borderRadius: 18, overflow: 'hidden', border: `1px solid ${C.amber}55`, boxShadow: 'var(--glow)', background: '#0b0d12' }}>
        {isStatic
          ? <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', ...kick }}>3D 모형 (슬라이드에서 실행)</div>
          : <iframe title="조각은 어디를 보는가 — 시공간 어텐션 3D 모형" src={`${MODEL_PATH}?embed=1&paused=1`} style={{ width: '100%', height: '100%', border: 0, display: 'block' }} />}
      </div>
      <div style={{ ...abs(1330, 190, 480) }}>
        <div style={{ ...body, fontSize: 19 }}>영상의 조각이 참조하는 대상은 셋 — <b style={{ color: C.amber }}>같은 프레임(공간) · 다른 프레임(시간) · 프롬프트(낱말)</b>. 계산 순서는 LLM 수업의 「배는 어디를 보는가」와 같다.</div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 18 }}>
          <LinkButton href={MODEL_PATH} size={19} sub="각자 기기에서 · 계산 카드·지도 포함">전체 모형 열기 ↗</LinkButton>
          <div style={{ width: 120, height: 120, borderRadius: 12, background: '#fff', padding: 6, boxSizing: 'border-box', flexShrink: 0 }}><img src={`${BASE}/images/model-qr.png`} alt="3D 모형 QR" style={{ width: '100%', height: '100%', display: 'block' }} onError={(e) => ((e.currentTarget.parentElement as HTMLElement).style.display = 'none')} /></div>
        </div>
      </div>
      <div style={{ ...abs(1330, 430, 480), display: 'grid', gap: 10 }}>
        {[['①', '「프레임 2의 공」이 읽는 조각으로 잡힌 상태에서 1 공간 · 2 시간 · 4 교차를 차례로 눌러 형광펜이 어디로 가는지 본다. 자기 자신에게도 가중치가 간다', 4], ['②', '왼쪽 지도에서 프레임 2의 4행 4열(잔디)을 클릭해 읽는 조각으로 바꾸고, 4 교차에서 어느 낱말을 보는지 확인한다', 3], ['③', '3 전체에서 「프레임 N의 공」을 1→4로 바꾸며 밝은 공 조각의 위치를 순서대로 읽어 공의 방향을 말한다 (접속·시범 2분 포함 12분)', 3]].map(([n, s, m]) => (
          <div key={n as string} style={{ ...card, padding: '10px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ ...mono, fontSize: 20, color: C.amber, fontWeight: 700 }}>{n}</div>
            <div><div style={{ fontSize: 16, fontWeight: 700, wordBreak: 'keep-all', lineHeight: 1.4 }}>{s}</div><div style={{ ...kick, marginTop: 2, fontSize: 12 }}>{m}분</div></div>
          </div>
        ))}
      </div>
      <div style={{ ...abs(110, 920, 1700), ...card, padding: '12px 24px', ...body, fontSize: 16 }}>모형의 영상은 수식으로 그린 4프레임 장난감이고 임베딩은 손으로 설계했다. 범위 비교를 쉽게 하려고 여기서는 시간 두께 1인 조각을 쓴다(S6의 시간 4 조각과 다르다). 특정 서비스의 내부를 재현한 것이 아니다. 실제와 같은 것은 어텐션 한 헤드의 계산 순서(내적 → ÷√d → 소프트맥스 → 가중합)이고, 공간·시간·전체·교차라는 범위 구분은 실제 영상 모델들이 쓰는 구분이다(조합은 모델마다 다르다).</div>
    </>
  );
}

/* ───────────── S9 어텐션 네 갈래 ───────────── */
const KINDS = [
  { name: '자기 어텐션', who: '조각 ↔ 같은 입력의 조각', how: '글을 만드는 LLM은 인과 마스크(가림막)로 앞의 말만 본다. 아래 공간·시간·전체는 영상 조각끼리의 자기 어텐션에 범위를 정한 것', w: 640, color: 'var(--fg-muted)' },
  { name: '공간 어텐션', who: '조각 ↔ 같은 프레임의 조각', how: '한 장 안의 관계 — 자기 어텐션의 범위 제한', w: 600, color: C.cyan },
  { name: '시간 어텐션', who: '조각 ↔ 앞뒤 프레임의 같은 자리', how: '시간에 따른 변화 — 한 가지 설계. 전체(3D) 어텐션은 모든 프레임의 모든 자리를 한 번에 본다', w: 720, color: C.mag },
  { name: '교차 어텐션', who: '조각 → 프롬프트 낱말', how: '키가 다른 입력(텍스트)에서 온다 — 조건을 붙이는 방법의 하나(그림 수업의 조건)', w: 680, color: C.yellow },
];
function AttentionKindsSlide() {
  const { clicks } = useDeck();
  const k = Math.min(clicks, 4);
  const fx = 150, fy = 330, cell = 40, dxF = -44, dyF = 34;
  const dot = (f: number, r: number, c: number) => [fx + f * dxF + c * cell + cell / 2 + 20, fy + f * dyF + r * cell + cell / 2 + 20];
  const q = dot(0, 1, 1);
  return (
    <>
      <div style={{ ...abs(110, 90), ...kick }}>어텐션의 확장</div>
      <Reveal><h2 style={{ ...abs(110, 140, 1500), ...h2 }}>계산은 하나, <span style={accentText}>누구를 보는가</span>가 갈린다</h2></Reveal>
      {/* 미니 블록 */}
      {[2, 1, 0].map((f) => (
        <div key={f} style={{ ...abs(fx + f * dxF, fy + f * dyF, cell * 3 + 40, cell * 3 + 40), borderRadius: 10, border: '1px solid var(--hair)', background: 'rgba(11,13,18,0.9)', padding: 20, boxSizing: 'border-box', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
          {Array.from({ length: 9 }, (_, i) => <div key={i} style={{ display: 'grid', placeItems: 'center' }}><div style={{ width: 14, height: 14, borderRadius: 7, background: f === 0 && i === 4 ? C.amber : landscape(3, 3, 1)[i] }} /></div>)}
        </div>
      ))}
      {['빨간 공', '오른쪽으로'].map((w, i) => <div key={w} style={{ ...abs(520, 300 + i * 60), padding: '6px 14px', borderRadius: 999, border: `1.5px solid ${k >= 4 ? C.yellow : 'var(--hair)'}`, color: k >= 4 ? C.yellow : 'var(--fg-faint)', fontWeight: 800, fontSize: 17 }}>{w}</div>)}
      <svg style={{ ...abs(0, 0, DW, DH) }} aria-hidden>
        {/* 1 자기: 앞쪽(왼쪽)으로만 */}
        {k === 1 && [0].map(() => <path key="s" d={`M${q[0]},${q[1]} L${dot(0, 1, 0)[0]},${dot(0, 1, 0)[1]}`} stroke={C.amber} strokeWidth={4} fill="none" />)}
        {/* 2 공간: 같은 프레임 이웃 */}
        {k === 2 && [[0, 0], [0, 2], [2, 0], [2, 2], [0, 1], [2, 1], [1, 0], [1, 2]].map(([r, c]) => <path key={r + '' + c} d={`M${q[0]},${q[1]} L${dot(0, r, c)[0]},${dot(0, r, c)[1]}`} stroke={C.amber} strokeWidth={3} fill="none" />)}
        {/* 3 시간: 뒤 프레임 같은 자리 */}
        {k === 3 && [1, 2].map((f) => <path key={f} d={`M${q[0]},${q[1]} L${dot(f, 1, 1)[0]},${dot(f, 1, 1)[1]}`} stroke={C.amber} strokeWidth={5 - f} fill="none" />)}
        {/* 4 교차: 낱말 칩으로 */}
        {k === 4 && [0, 1].map((i) => <path key={i} d={`M${q[0]},${q[1]} C${q[0] + 120},${q[1]} ${520},${318 + i * 60} ${520},${318 + i * 60}`} stroke={C.amber} strokeWidth={4 - i * 2} fill="none" />)}
      </svg>
      {KINDS.map((kd, i) => (
        <Build key={kd.name} at={i + 1} style={{ ...abs(760, 250 + i * 150, kd.w) }}>
          <div style={{ ...card, padding: '16px 22px', borderLeft: `5px solid ${kd.color}` }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}><div style={{ fontSize: 28, fontWeight: 800 }}>{kd.name}</div><div style={{ ...kick, color: kd.color, textTransform: 'none', letterSpacing: 0, fontSize: 17 }}>{kd.who}</div></div>
            <div style={{ ...body, fontSize: 19, marginTop: 4 }}>{kd.how}</div>
          </div>
        </Build>
      ))}
      {/* 층과 생성 단계의 구분 — 어텐션을 배운 뒤에 꺼낸다 (2026-09-09 사용자 질문 반영) */}
      <Build at={5} style={{ ...abs(110, 620, 620) }}>
        <div style={{ ...card, padding: '18px 22px', borderLeft: `5px solid ${C.amber}` }}>
          <div style={{ ...kick, color: C.amber }}>정리 · 몇 번 되풀이하나</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6, wordBreak: 'keep-all' }}>쳐다보기는 한 번이 아니다</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
            <span style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid var(--hair)', fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap' }}>조각</span>
            <span style={{ fontSize: 20, color: C.amber }}>→</span>
            {[1, 2, 3].map((n) => <span key={n} style={{ width: 34, height: 34, borderRadius: 8, border: `1.5px solid ${C.amber}`, background: 'rgba(245,165,36,0.12)', display: 'grid', placeItems: 'center', ...mono, fontSize: 14, fontWeight: 700, color: C.amber, flexShrink: 0 }}>{n}</span>)}
            <span style={{ ...mono, fontSize: 15, color: 'var(--fg-faint)' }}>…</span>
            <span style={{ width: 34, height: 34, borderRadius: 8, border: `1.5px solid ${C.amber}`, background: 'rgba(245,165,36,0.12)', display: 'grid', placeItems: 'center', ...mono, fontSize: 14, fontWeight: 700, color: C.amber, flexShrink: 0 }}>N</span>
            <span style={{ fontSize: 20, color: C.amber }}>→</span>
            <span style={{ padding: '5px 10px', borderRadius: 8, border: `1.5px solid ${C.mag}`, color: C.mag, fontSize: 15, fontWeight: 800, whiteSpace: 'nowrap' }}>다음 조각</span>
          </div>
          <div style={{ ...body, fontSize: 18, marginTop: 12 }}>같은 계산을 <b style={{ color: C.amber }}>여러 겹</b> 쌓는다. 조각은 겹을 지날 때마다 자기 뜻을 다시 쓴다. 여기까지가 <b>한 번의 예측</b>이다.</div>
          <div style={{ ...body, fontSize: 18, marginTop: 8 }}>이 통과를 되풀이하는 것이 <b style={{ color: C.mag }}>생성 단계</b>다. 글과 음악은 조각 하나마다, 영상은 안개를 걷어내는 단계마다 한 번씩.</div>
        </div>
      </Build>
      <Build at={4} style={{ ...abs(110, 900, 1700) }}>
        <div style={{ ...card, padding: '14px 24px', display: 'flex', gap: 30, alignItems: 'center' }}>
          <span style={{ ...mono, fontSize: 24, fontWeight: 700 }}>점수 → 소프트맥스 → 가중합</span>
          <span style={{ ...body, fontSize: 20 }}>공통. 다른 것은 <b style={{ color: C.amber }}>누구를 볼 수 있는가</b>와 <b style={{ color: C.amber }}>키가 어디서 오는가</b>다.</span>
          <span style={{ ...kick, color: C.mag, marginLeft: 'auto' }}>층·단계 정리 뒤 라이브 · 객관식</span>
        </div>
      </Build>
    </>
  );
}

/* ───────────── S10 안개 걷히는 블록 ───────────── */
const NOISE = (() => { const r = mulberry32(42); return Array.from({ length: 4 * 48 }, () => r()); })();
function FogScene() {
  const t = useSceneTime();
  const clear = interpolate(t, [0.5, 4.5], [0, 1], easeInOut);
  const step = Math.round(50 * (1 - clear));
  const W = 380, H = 260, dx = -50, dy = 38, bx = 900, by = 300, cols = 8, rows = 6;
  const flip = interpolate(t, [1.0, 1.5], [0, 1], easeInOut);
  return (
    <>
      {/* 노이즈 예측기 상자 */}
      <div style={{ ...abs(330, 420, 300, 200), ...card, padding: 20, boxSizing: 'border-box', border: `2px solid ${C.mag}` }}>
        <div style={kick}>노이즈 예측기</div>
        <div style={{ marginTop: 14, height: 70, perspective: 400 }}>
          <div style={{ position: 'relative', height: 70, transformStyle: 'preserve-3d', transform: `rotateX(${flip * 180}deg)`, transition: 'none' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 30, fontWeight: 800, color: 'var(--fg-muted)', backfaceVisibility: 'hidden', border: '1px solid var(--hair)', borderRadius: 10 }}>U-Net</div>
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 30, fontWeight: 800, color: C.mag, backfaceVisibility: 'hidden', transform: 'rotateX(180deg)', border: `1px solid ${C.mag}`, borderRadius: 10, background: 'rgba(255,79,163,0.1)' }}>트랜스포머</div>
          </div>
        </div>
        <div style={{ ...body, fontSize: 16, marginTop: 10 }}>{flip > 0.5 ? '지난 시간과 달라진 것 ②' : '지난 시간의 신경망'}</div>
      </div>
      {/* 형광펜 선 3개 */}
      <svg style={{ ...abs(0, 0, DW, DH) }} aria-hidden>
        {[['공간', bx + 60, by + 120], ['시간', bx - 30, by + 150], ['낱말', 700, 560]].map(([l, ex, ey], i) => { const on = flip > 0.9 && (t * 2 + i) % 3 < 1.6; return <g key={l as string}><path d={`M630,${470 + i * 40} C720,${470 + i * 40} ${Number(ex) - 120},${Number(ey)} ${ex},${ey}`} fill="none" stroke={C.amber} strokeWidth={3} opacity={on ? 0.95 : 0.25} /><text x={640} y={462 + i * 40} fill={C.amber} fontSize={15} fontWeight={700} opacity={flip}>{l}</text></g>; })}
        <rect x={690} y={545} width={60} height={26} rx={6} fill="none" stroke={C.yellow} strokeWidth={1.5} opacity={flip} /><text x={720} y={563} textAnchor="middle" fill={C.yellow} fontSize={13} fontWeight={700} opacity={flip}>프롬프트</text>
      </svg>
      {/* 블록 */}
      {[3, 2, 1, 0].map((k) => (
        <div key={k} style={{ ...abs(bx + k * dx, by + k * dy, W, H), borderRadius: 10, border: '1px solid var(--hair)', background: 'rgba(11,13,18,0.92)', padding: 8, boxSizing: 'border-box', display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 2, zIndex: 10 - k }}>
          {landscape(cols, rows, 1 + k * 1.6).map((col, i) => { const n = NOISE[k * 48 + i]; const noisy = n > clear; const g = Math.round(90 + n * 120); return <div key={i} style={{ background: noisy ? `rgb(${g},${g},${g + 8})` : col, borderRadius: 2, opacity: noisy ? 0.9 : 1 }} />; })}
        </div>
      ))}
      {/* 시작 상태 잔상 — T=50 */}
      <div style={{ ...abs(330, 680, 190, 130), borderRadius: 8, border: '1px solid var(--hair)', background: 'rgba(11,13,18,0.9)', padding: 6, boxSizing: 'border-box', display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 2, opacity: interpolate(t, [0.8, 1.4], [0, 1]) }}>
        {NOISE.slice(0, 48).map((n, i) => { const g = Math.round(90 + n * 120); return <div key={i} style={{ background: `rgb(${g},${g},${g + 8})`, borderRadius: 2 }} />; })}
      </div>
      <div style={{ ...abs(330, 816), ...kick, opacity: interpolate(t, [0.8, 1.4], [0, 1]) }}>시작 · T = 50 (노이즈)</div>
      {/* 단계 게이지 */}
      <div style={{ ...abs(1620, 260, 60, 460), borderRadius: 30, border: '1px solid var(--hair)', background: 'var(--surface)', overflow: 'hidden' }}><div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${(1 - clear) * 100}%`, background: 'linear-gradient(180deg, #9aa3b2, #3a4353)' }} /></div>
      <div style={{ ...abs(1560, 730, 200), textAlign: 'center' }}><div style={{ ...mono, fontSize: 44, fontWeight: 700 }}>{step}</div><div style={{ ...kick, textTransform: 'none' }}>노이즈 제거 단계 50 → 0 · 설명용</div></div>
      {/* 텍스트 */}
      <div style={{ ...abs(110, 110), ...kick }}>만드는 법 · 확산 + 트랜스포머 · 디노이징(노이즈 제거)을 여러 단계에 걸쳐</div>
      <h2 style={{ ...abs(110, 150, 1300), ...h2 }}>안개가 <span style={accentText}>한꺼번에</span> 걷힌다</h2>
      <div style={{ ...abs(110, 860, 1700), ...card, padding: '16px 24px', display: 'flex', gap: 34, alignItems: 'center', ...riseIn(t, 3.6) }}>
        <div style={{ fontSize: 26, fontWeight: 800, whiteSpace: 'nowrap', lineHeight: 1.2 }}>DiT = 확산<span style={{ ...body, fontSize: 15, display: 'block' }}>만드는 방식</span> + 트랜스포머<span style={{ ...body, fontSize: 15, display: 'block' }}>예측하는 신경망</span></div>
        <div style={{ ...body, fontSize: 19 }}>걷어내는 대상이 그림 한 장이 아니라 (압축한 잠재 표현의) 시공간 패치 블록(①), 노이즈를 걷어내는 신경망이 트랜스포머(②). 여러 단계에 걸쳐 블록을 한 덩어리로 걷어내니 프레임 사이가 이어지기 쉽다. Sora·Kling이 공개한 구조다.</div>
      </div>
    </>
  );
}

/* ───────────── S11 구슬 목걸이 ───────────── */
const BEAD_PAL = [C.mag, C.cyan, C.yellow, C.mint, '#b48cff', '#ff8a5c', '#5cc8ff', '#f4f4f4'];
const BEADS = (() => { const r = mulberry32(99); return Array.from({ length: 4 * 14 }, () => Math.floor(r() * BEAD_PAL.length)); })();
function BeadsScene() {
  const t = useSceneTime();
  const wave = (x0: number, y0: number, amp: number, phase: number, n = 70) => Array.from({ length: n }, (_, k) => `${k ? 'L' : 'M'}${x0 + k * 6},${y0 + Math.sin(k * 0.45 + phase) * amp + Math.sin(k * 1.6 + phase * 1.3) * amp * 0.35}`).join(' ');
  const cand = [{ w: 0.46, c: 1 }, { w: 0.22, c: 4 }, { w: 0.15, c: 2 }, { w: 0.1, c: 6 }, { w: 0.07, c: 0 }];
  const pickK = interpolate(t, [3.0, 4.6], [0, 1]);
  const decode = interpolate(t, [4.8, 5.8], [0, 1], easeInOut);
  return (
    <>
      <div style={{ ...abs(110, 110), ...kick }}>조각의 확장 ③ · 소리</div>
      <h2 style={{ ...abs(110, 150, 900), ...h2 }}>음악도 <span style={accentText}>조각</span>이다</h2>
      {/* 파형 → 코덱 */}
      <svg style={{ ...abs(0, 0, DW, DH) }} aria-hidden>
        <path d={wave(120, 470, 46, t * 2.2)} fill="none" stroke={C.cyan} strokeWidth={3} />
        <text x={120} y={560} fill="var(--fg-faint)" fontSize={15} fontWeight={700} letterSpacing={2}>파형 · 초당 32,000개 숫자</text>
        <path d={wave(1180, 900, 34, t * 2.2 + 1)} fill="none" stroke={C.cyan} strokeWidth={3} opacity={decode} />
        <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill={C.cyan} /></marker></defs>
        {[[540, 470, 578, 470, 0.3], [752, 470, 776, 470, 0.5], [1450, 470, 1576, 420, 3.0], [1130, 598, 1030, 640, 4.8], [1030, 750, 1180, 870, 4.9]].map(([x1, y1, x2, y2, at], i) => <path key={i} d={`M${x1},${y1} L${x2},${y2}`} stroke={C.cyan} strokeWidth={2.5} markerEnd="url(#arr)" opacity={interpolate(t, [at, at + 0.5], [0, 0.8])} />)}
        <text x={1180} y={960} fill="var(--fg-faint)" fontSize={15} fontWeight={700} letterSpacing={2} opacity={decode}>다시 파형 · 소리</text>
      </svg>
      <div style={{ ...abs(580, 400, 170, 140), ...card, display: 'grid', placeItems: 'center', border: `2px solid ${C.cyan}` }}><div style={{ textAlign: 'center' }}><div style={kick}>코덱 인코더</div><div style={{ fontSize: 26, fontWeight: 800 }}>EnCodec</div><div style={{ ...body, fontSize: 15 }}>초당 50번 × 코드북 4줄</div></div></div>
      {/* 목걸이 4줄 */}
      {[0, 1, 2, 3].map((row) => (
        <div key={row} style={{ ...abs(780, 380 + row * 52), display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ ...kick, width: 128, textTransform: 'none', letterSpacing: 0, fontSize: 13 }}>코드북 {row + 1}의 토큰 열</div>
          {Array.from({ length: 13 }, (_, i) => { const s = spring(t, 0.6 + (i * 4 + row) * 0.04, 0.5); return <div key={i} style={{ width: 34, height: 34, borderRadius: 17, background: BEAD_PAL[BEADS[row * 14 + i]], transform: `scale(${s})`, opacity: Math.min(1, s * 1.4), boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }} />; })}
          {/* 다음 구슬 자리 */}
          <div style={{ width: 34, height: 34, borderRadius: 17, border: `2px dashed ${C.amber}`, opacity: interpolate(t, [3.0, 3.4], [0, 1]) }}>{pickK >= 1 && <div style={{ width: '100%', height: '100%', borderRadius: 17, background: BEAD_PAL[[1, 4, 2, 6][row]], transform: `scale(${spring(t, 4.6 + row * 0.12, 0.5)})` }} />}</div>
        </div>
      ))}
      <div style={{ ...abs(880, 300, 600), ...body, fontSize: 18, opacity: interpolate(t, [0.8, 1.4], [0, 1]) }}>MusicGen(Meta, 2023)의 실제 구성 — 코드북 4줄, 줄마다 초당 50개</div>
      {/* 다음 구슬 후보 */}
      <div style={{ ...abs(1580, 300, 300), ...card, padding: '16px 20px', opacity: interpolate(t, [3.0, 3.5], [0, 1]) }}>
        <div style={{ ...kick, color: C.amber }}>다음 오디오 토큰(구슬)은? · 자기회귀 예측 <span style={{ color: 'var(--fg-faint)' }}>(설명용 확률)</span></div>
        {cand.map((c, i) => { const chosen = pickK >= 1 && i === 0; return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}><div style={{ width: 24, height: 24, borderRadius: 12, background: BEAD_PAL[c.c], outline: chosen ? `3px solid ${C.amber}` : 'none' }} /><div style={{ flex: 1, height: 14, borderRadius: 7, background: 'var(--surface-2)' }}><div style={{ width: `${c.w * 100 * Math.min(1, pickK * 1.5)}%`, height: '100%', borderRadius: 7, background: chosen ? C.amber : 'var(--fg-faint)' }} /></div><div style={{ ...mono, fontSize: 15, width: 44, textAlign: 'right' }}>{Math.round(c.w * 100)}%</div></div>; })}
      </div>
      <div style={{ ...abs(940, 640, 170, 110), ...card, display: 'grid', placeItems: 'center', border: `2px solid ${C.cyan}`, opacity: decode }}><div style={{ textAlign: 'center' }}><div style={kick}>코덱 디코더</div><div style={{ fontSize: 20, fontWeight: 800 }}>오디오 토큰 → 파형</div></div></div>
      <div style={{ ...abs(110, 640, 700) }}>
        <div style={{ ...card, padding: '18px 22px', borderLeft: `4px solid ${C.cyan}` }}>
          <div style={{ fontSize: 26, fontWeight: 800 }}>오디오 토큰 = 소리의 조각</div>
          <div style={{ ...body, fontSize: 19, marginTop: 6 }}>파형은 너무 길어 코덱이 초당 50번, 코드북 4줄의 토큰으로 줄인다. 그러면 음악 생성은 LLM처럼 "다음 토큰 고르기"가 된다. 다 고른 열을 코덱이 다시 파형으로 풀면 소리다.</div>
          <div style={{ ...body, fontSize: 16, marginTop: 8 }}>코덱 = 소리를 압축 표현으로 바꾸고(인코더) 되돌리는(디코더) 장치 · 코드북 = 소리 특징의 번호 사전 · 구슬 하나 = 음표가 아니라 압축된 소리의 코드 번호 · 1초 = 50칸, 칸마다 코드북 4줄의 번호 · 자기회귀 = 앞의 토큰들을 보고 다음 토큰을 예측</div><div style={{ ...body, fontSize: 16, marginTop: 6, color: 'var(--fg-faint)' }}>Suno 같은 상용 서비스는 내부 구조를 공개하지 않는다. 원리 설명은 공개된 MusicGen 기준.</div>
        </div>
      </div>
    </>
  );
}

/* ───────────── S12 한 기계, 네 가지 조각 ───────────── */
function OneMachineSlide() {
  const rows = [
    { glyph: <div style={{ display: 'flex', gap: 4 }}>{['배', '가', '고파'].map((w) => <div key={w} style={{ padding: '4px 10px', borderRadius: 6, background: 'var(--surface-2)', border: '1px solid var(--hair)', fontWeight: 800, fontSize: 18 }}>{w}</div>)}</div>, name: '텍스트 토큰', cut: '토크나이저가 문장을 토큰으로 나눈다', see: '앞의 토큰까지 (인과 마스크)', pick: '다음 토큰을 예측한다', color: 'var(--fg-muted)' },
    { glyph: <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3 }}>{landscape(4, 3, 3).map((c, i) => <div key={i} style={{ width: 20, height: 20, background: c, borderRadius: 3 }} />)}</div>, name: '이미지 패치', cut: '작은 정사각형(예: 16×16 픽셀)으로 자른다', see: '같은 그림의 다른 조각 (+ 조건 낱말)', pick: '분류하거나(ViT) 노이즈를 걷어낸다(확산)', color: C.cyan },
    { glyph: <div style={{ display: 'flex' }}>{[0, 1, 2, 3].map((k) => <div key={k} style={{ width: 22, height: 30, background: landscape(1, 1, 0)[0], border: `1.5px solid ${C.amber}`, marginLeft: k ? -6 : 0, transform: `translateY(${k * -4}px)`, borderRadius: 3 }} />)}</div>, name: '시공간 패치', cut: '같은 자리의 프레임 몇 장을 한 덩어리로', see: '공간 · 시간 · 낱말', pick: '노이즈를 걷어낸다(DiT)', color: C.mag },
    { glyph: <div style={{ display: 'flex', gap: 5 }}>{[0, 1, 2, 3, 4].map((k) => <div key={k} style={{ width: 20, height: 20, borderRadius: 10, background: BEAD_PAL[k] }} />)}</div>, name: '오디오 토큰', cut: '코덱이 초당 50번 × 4줄로 압축', see: '앞의 토큰들 + 낱말', pick: '다음 토큰을 예측한다(자기회귀)', color: C.yellow },
  ];
  return (
    <>
      <div style={{ ...abs(110, 90), ...kick }}>정리 · S2의 답</div>
      <Reveal><h2 style={{ ...abs(110, 140, 1400), ...h2 }}>한 기계, <span style={accentText}>네 가지 조각</span></h2></Reveal>
      <div style={{ ...abs(110, 270, 1700), display: 'grid', gridTemplateColumns: '220px 200px 1fr 1fr 1fr', gap: '12px 18px', alignItems: 'center' }}>
        {['조각', '', '① 자르기 (입력 표현)', '③ 어텐션의 참조 대상', '④ 고르기 (예측)'].map((h, i) => <div key={i} style={{ ...kick, paddingBottom: 6, borderBottom: '1px solid var(--hair)' }}>{h}</div>)}
        {rows.map((r) => [
          <div key={r.name + 'g'} style={{ padding: '8px 0' }}>{r.glyph}</div>,
          <div key={r.name + 'n'} style={{ fontSize: 24, fontWeight: 800, color: r.color }}>{r.name}</div>,
          <div key={r.name + 'c'} style={{ ...body, fontSize: 19 }}>{r.cut}</div>,
          <div key={r.name + 's'} style={{ ...body, fontSize: 19, color: 'var(--fg)' }}>{r.see}</div>,
          <div key={r.name + 'p'} style={{ ...body, fontSize: 19 }}>{r.pick}</div>,
        ])}
      </div>
      <div style={{ ...abs(110, 760, 1700), display: 'flex', gap: 24, alignItems: 'center' }}>
        <div style={{ ...card, padding: '20px 28px', border: `2px solid ${C.mag}`, boxShadow: 'var(--glow)' }}>
          <div style={{ ...kick, color: C.mag }}>S2 정답 공개</div>
          <div style={{ fontSize: 36, fontWeight: 800, marginTop: 4 }}>같은 기계에 <span style={accentText}>다른 조각</span></div><div style={{ ...body, fontSize: 15, marginTop: 6 }}>'한 기계' = 트랜스포머 구조(아키텍처)를 공유한다는 뜻. 모델·가중치·생성 방식은 서로 다르다.</div>
        </div>
        <div style={{ ...body, fontSize: 21, maxWidth: 900 }}>②위치 붙이기 ③서로 쳐다보기 ④고르기의 뼈대는 조각이 무엇이든 같다. 달라지는 것은 ①무엇을 자르는가, ③누구를 볼 수 있는가, ④무엇을 예측하는가다.</div>
      </div>
      <div style={{ ...abs(110, 960), ...kick }}>여기서 5분 휴식 → 2부 실습</div>
    </>
  );
}

/* ───────────── S13 영상 프롬프트 ───────────── */
const PIECES = [
  { n: '①', label: '주체와 동작', text: '파란 우산을 든 소녀가', color: C.mag },
  { n: '②', label: '움직임의 방향·속도·순서', text: '천천히 오른쪽으로 걸어간다.', color: C.cyan },
  { n: '③', label: '카메라', text: '카메라는 고정,', color: C.yellow },
  { n: '④', label: '분위기·조명', text: '저녁 노을의 부드러운 빛.', color: '#b48cff' },
  { n: '⑤', label: '유지할 것', text: '얼굴과 옷은 그대로 유지.', color: C.mint },
];
function PromptSlide() {
  const { clicks } = useDeck();
  return (
    <>
      <div style={{ ...abs(110, 90), ...kick }}>2부 · 영상 프롬프트</div>
      <Reveal><h2 style={{ ...abs(110, 140, 1600), ...h2 }}>영상 프롬프트의 핵심 셋, <span style={accentText}>움직임 · 카메라 · 시간(동작의 순서)</span></h2></Reveal>
      <div style={{ ...abs(110, 300, 460, 380), ...card, padding: 26, boxSizing: 'border-box', opacity: 0.55 }}>
        <div style={kick}>나쁜 프롬프트</div>
        <div style={{ fontSize: 30, fontWeight: 800, marginTop: 14 }}>"멋진 영상 만들어줘"</div>
        <div style={{ ...body, fontSize: 19, marginTop: 16 }}>무엇이 어떻게 움직이는지 없다. AI가 마음대로 정한다. 4컷이 서로 다른 영상이 되기 쉽다.</div>
      </div>
      <div style={{ ...abs(640, 300, 1170) }}>
        <div style={{ ...kick, color: C.mag }}>좋은 프롬프트 · 다섯 요소</div>
        <div style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.6, marginTop: 14, wordBreak: 'keep-all' }}>
          {PIECES.map((p, i) => <span key={p.n} style={{ position: 'relative', display: 'inline-block', marginRight: 12, borderBottom: `4px solid ${clicks >= i + 1 ? p.color : 'transparent'}`, color: clicks >= i + 1 ? 'var(--fg)' : 'var(--fg-faint)', transition: 'color .4s, border-color .4s' }}>{p.text}{' '}</span>)}
        </div>
      </div>
      {PIECES.map((p, i) => <Build key={p.n} at={i + 1} style={{ ...abs(640 + i * 232, 700, 220) }}><div style={{ ...card, padding: '12px 14px', borderTop: `4px solid ${p.color}` }}><div style={{ fontSize: 18, fontWeight: 800 }}>{p.n} {p.label}</div></div></Build>)}
      <Build at={5} style={{ ...abs(110, 880, 1700) }}>
        <div style={{ ...card, padding: '16px 24px', fontSize: 23, fontWeight: 800, wordBreak: 'keep-all' }}>이미지→비디오에서는 <span style={{ color: C.cyan }}>사진이 주체와 스타일을 이미 정한다.</span> 외형은 짧게 두고, <span style={accentText}>바꿀 동작·방향·속도·카메라와 유지 조건</span>을 쓴다.</div>
      </Build>
    </>
  );
}

/* ───────────── S14 4컷 설계 ───────────── */
const CUTS = [{ role: '설정', q: '누가 어디에', ex: '골목 입구, 소녀가 우산을 편다', w: 340 }, { role: '변화', q: '무슨 일이', ex: '고양이가 발치로 다가온다', w: 380 }, { role: '절정', q: '가장 큰 순간', ex: '우산 아래로 고양이가 들어온다', w: 460 }, { role: '마무리', q: '어떻게 끝나나', ex: '둘이 함께 골목을 나간다', w: 380 }];
function StoryboardSlide() {
  const { clicks } = useDeck();
  let x = 110;
  return (
    <>
      <div style={{ ...abs(110, 90), ...kick }}>2부 · 4컷 설계</div>
      <Reveal><h2 style={{ ...abs(110, 140, 1500), ...h2 }}>이어지는 4컷 — <span style={accentText}>설계를 먼저, 생성은 나중에</span></h2></Reveal>
      {CUTS.map((c, i) => { const cx = x; x += c.w + 30; return (
        <Build key={c.role} at={i + 1} style={{ ...abs(cx, 300, c.w) }}>
          <div style={{ borderRadius: 12, border: '1px solid var(--hair)', background: 'rgba(11,13,18,0.9)', overflow: 'hidden' }}>
            <div style={{ height: 14, background: 'repeating-linear-gradient(90deg, #000 0 10px, #3a4353 10px 20px)' }} />
            <div style={{ padding: '18px 20px', minHeight: 250 }}>
              <div style={{ ...kick, color: C.mag }}>컷 {i + 1} · {c.role}</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>{c.q}</div>
              <div style={{ ...body, fontSize: 18, marginTop: 12 }}>예: {c.ex}</div>
            </div>
            <div style={{ height: 14, background: 'repeating-linear-gradient(90deg, #000 0 10px, #3a4353 10px 20px)' }} />
          </div>
          {i < 3 && <div style={{ position: 'absolute', right: -75, top: -34, width: 120, textAlign: 'center', color: C.amber, fontWeight: 800, fontSize: 14, opacity: clicks >= i + 2 ? 1 : 0, whiteSpace: 'nowrap', padding: '3px 8px', borderRadius: 999, border: `1px solid ${C.amber}`, background: 'var(--bg)' }}>→ 같은 주인공</div>}
        </Build>
      ); })}
      <Build at={4} style={{ ...abs(110, 700, 1700) }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {[['① 같은 스타일의 이미지 4장 — 수업 전에 준비', '같은 도구 · 같은 화풍 · 같은 주인공 묘사를 매번 그대로. 준비 못 하면 교사 배포 세트'], ['② 프롬프트마다 유지 조건', '"같은 인물 · 같은 옷 · 같은 배경" 한 줄'], ['③ 심화(선택) · 끝 장면 → 다음 첫 이미지', '앞 클립의 마지막 프레임을 캡처해 다음 컷의 이미지로 — 시간이 남을 때만']].map(([a, b]) => <div key={a} style={{ ...card, padding: '16px 20px', borderTop: `4px solid ${C.amber}` }}><div style={{ fontSize: 21, fontWeight: 800 }}>{a}</div><div style={{ ...body, fontSize: 17, marginTop: 6 }}>{b}</div></div>)}
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, marginTop: 24 }}>시간 방향 어텐션이 잇는 것은 한 클립 안이다. <span style={accentText}>클립 사이는 여러분이 잇는다.</span> <span style={{ ...body, fontSize: 17 }}>(컷 = 설계한 장면 단위 · 클립 = 생성된 영상 파일)</span></div>
      </Build>
    </>
  );
}

/* ───────────── S15 미리캔버스 walkthrough — 편집기 한 창 안의 국면 전환 (2026-09-09 실제 편집기 채집 기준) ─────────────
   채집: tmp/miri/m02~m09 (로그인 · 1600×900). 왼쪽 도구 모음 「AI 도구」 → 패널 「AI로 영상 생성하기 · 동영상」 →
   「동영상 만들기」 패널(스타일 이미지→비디오 · 결과물 묘사(필수) · 이미지 첨부(필수) · 생성) → 클립은 하단 페이지 띠에 페이지로
   놓임 → 상단 「공유」 팝오버(공유|게시 · 접근 권한 「링크가 있는 누구나 ▾ · 보기 가능 ▾」 · 「링크 복사」). */
const MIRI_TEAL = '#2ec4c1';
const MIRI_INK = '#1b1f2a';
const MIRI_MUTED = '#7d8494';
const MIRI_LINE = '#e6e8ef';
const MW = { left: 4, top: 19, width: 72, height: 69 };            // 편집기 창 (씬 % 좌표)
const MB = { x: 76.8, y: 245, w: 1382, h: 705 };                    // 창 본문의 설계 px 원점·크기 (제목줄 ≈ 40px)
const MT = {
  W_IN: 0.3, TOOLS: 1.6, VIDEO: 2.9, ATTACH: 3.9, PICK: 4.8, FOCUS: 5.5, TYPE_AT: 5.7,
  GEN: 9.9, GEN_DONE: 11.3, CLIPS: 11.6, SHARE: 13.2, PERM: 14.0, COPY: 14.9, END: 15.8,
};
const MIRI_PROMPT = '파란 우산을 든 소녀가 천천히 오른쪽으로 걸어간다. 카메라 고정, 얼굴과 옷은 그대로';
const RAIL = ['템플릿', '요소', '텍스트', '사진', '업로드', '프로젝트', 'AI 도구', '배경', '테마', '차트', '동영상'];
function MiriWalkScene() {
  const t = useSceneTime();
  const panel: 'templates' | 'tools' | 'video' = t >= MT.VIDEO + 0.2 ? 'video' : t >= MT.TOOLS + 0.2 ? 'tools' : 'templates';
  const expanded = t >= MT.ATTACH + 0.2;
  const picked = t >= MT.PICK + 0.2;
  const prompt = typed(t, MIRI_PROMPT, MT.TYPE_AT, 13);
  const typing = t >= MT.TYPE_AT && t < typedDoneAt(MIRI_PROMPT, MT.TYPE_AT, 13) + 0.4;
  const generating = t >= MT.GEN + 0.2 && t < MT.GEN_DONE;
  const clips = t >= MT.GEN_DONE ? 1 + [0, 1, 2].filter((k) => t >= MT.CLIPS + k * 0.3).length : 0;
  const share = t >= MT.SHARE + 0.2;
  const perm = t >= MT.PERM + 0.2;
  const copied = t >= MT.COPY + 0.25;
  const P = (bx: number, by: number) => ({ x: (MB.x + bx) / 19.2, y: (MB.y + by) / 10.8 });   // 본문 px → 씬 %
  const TG = {
    tools: P(32, 52 + 6 * 56 + 28), video: P(118, 332), attach: P(150, 342), pick: P(95, 455), box: P(200, 262),
    gen: P(199, 672), share: P(1111, 28), perm: P(1075, 245), copy: P(1161, 295),
  };
  const path: CursorKey[] = [
    { t: 0.9, x: TG.tools.x + 4, y: TG.tools.y + 6 },
    { t: MT.TOOLS, x: TG.tools.x, y: TG.tools.y, click: true, label: '① AI 도구' },
    { t: MT.VIDEO, x: TG.video.x, y: TG.video.y, click: true, label: '② 동영상' },
    { t: MT.ATTACH, x: TG.attach.x, y: TG.attach.y, click: true, label: '③ 이미지 첨부' },
    { t: MT.PICK, x: TG.pick.x, y: TG.pick.y, click: true, label: '④ 내 이미지 선택' },
    { t: MT.FOCUS, x: TG.box.x, y: TG.box.y, click: true, label: '⑤ 결과물 묘사' },
    { t: MT.TYPE_AT + 0.2, x: TG.box.x + 6.5, y: TG.box.y + 3.2 },
    { t: MT.GEN - 0.5, x: TG.gen.x - 3, y: TG.gen.y + 4 },
    { t: MT.GEN, x: TG.gen.x, y: TG.gen.y, click: true, label: '⑥ 생성 · 컷마다 반복' },
    { t: MT.SHARE - 0.5, x: TG.share.x - 4, y: TG.share.y + 6 },
    { t: MT.SHARE, x: TG.share.x, y: TG.share.y, click: true, label: '⑦ 공유' },
    { t: MT.PERM, x: TG.perm.x, y: TG.perm.y, click: true, label: '⑧ 링크가 있는 누구나' },
    { t: MT.COPY, x: TG.copy.x, y: TG.copy.y, click: true, label: '⑨ 링크 복사' },
  ];
  const ring = (at: number) => ({ boxShadow: `0 0 0 ${clickFlash(t, at) * 6}px ${C.amber}88` });
  const px = (x: number, y: number, w?: number, h?: number): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h });
  const steps: [string, string, number][] = [
    ['①', '왼쪽 「AI 도구」 → 「AI로 영상 생성하기 · 동영상」', MT.TOOLS],
    ['②', '「이미지 첨부」에 내 이미지 · 「결과물 묘사」에 프롬프트 → 「생성」', MT.ATTACH],
    ['③', '컷 2·3·4도 같은 방법 — 클립은 하단 띠에 페이지로 놓인다', MT.CLIPS],
    ['④', '「공유」 → 접근 권한 「링크가 있는 누구나 · 보기 가능」 → 「링크 복사」', MT.SHARE],
    ['⑤', '활동지에 컷별 설명·프롬프트·링크 제출', MT.END - 0.3],
  ];
  const tile = (label: string, hot = false, at?: number): ReactNode => (
    <div key={label} style={{ width: 74, textAlign: 'center' }}>
      <div style={{ width: 74, height: 60, borderRadius: 10, background: hot ? 'linear-gradient(135deg, #d9f7f6, #e8e3ff)' : '#eef0f5', border: hot ? `1.5px solid ${MIRI_TEAL}` : '1px solid transparent', ...(at !== undefined ? ring(at) : {}) }} />
      <div style={{ fontSize: 11.5, marginTop: 4, color: MIRI_INK, whiteSpace: 'nowrap' }}>{label}</div>
    </div>
  );
  return (
    <>
      {/* 헤더 밴드 */}
      <div style={{ ...abs(110, 70), ...kick }}>2부 · 절차 시연 · 실제 편집기 화면 기준 (2026-09-09 채집) · 메뉴 이름은 화면 그대로</div>
      <h2 style={{ ...abs(110, 108, 1100), ...h2, fontSize: 44 }}>미리캔버스에서 <span style={accentText}>만드는 순서</span></h2>
      <div style={{ ...abs(1320, 96) }}><LinkButton href={MIRI_URL} size={20} sub="miricanvas.com · 로그인 → 새 디자인 만들기 → 편집기">미리캔버스 열기 ↗</LinkButton></div>

      {/* 편집기 창 — 국면마다 사이드 패널이 바뀐다 */}
      <AppWindow kind="browser" url="miricanvas.com/v2/ko/design2/…" badge="①" style={{ left: `${MW.left}%`, top: `${MW.top}%`, width: `${MW.width}%`, height: `${MW.height}%`, ...popIn(t, MT.W_IN) }} bodyStyle={{ padding: 0 }}>
        <div style={{ position: 'absolute', inset: 0, background: '#f5f6f8', color: MIRI_INK, fontFamily: 'var(--font-body)', overflow: 'hidden' }}>
          {/* 상단 바 */}
          <div style={{ ...px(0, 0, MB.w, 52), background: '#fff', borderBottom: `1px solid ${MIRI_LINE}`, display: 'flex', alignItems: 'center', gap: 14, padding: '0 18px', boxSizing: 'border-box' }}>
            <span style={{ fontSize: 15 }}>☰</span><span style={{ color: MIRI_TEAL, fontSize: 19, fontWeight: 900, letterSpacing: '-0.02em' }}>miri canvas</span>
            <span style={{ marginLeft: 150, fontSize: 13, color: MIRI_MUTED }}>제목을 입력해주세요. <span style={{ marginLeft: 8, padding: '3px 8px', borderRadius: 6, background: '#eef0f5', fontSize: 11.5 }}>1080×1080 px ▾</span></span>
            <span style={{ marginLeft: 'auto', padding: '7px 12px', borderRadius: 8, background: '#fff7d6', fontSize: 12, fontWeight: 700 }}>👑 Pro 1개월 무료 체험</span>
            <span style={{ width: 30, height: 30, borderRadius: 15, background: '#ff6b3d', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800 }}>te</span>
            <span style={{ padding: '7px 14px', borderRadius: 8, background: share ? '#dfe3ea' : '#eef0f5', fontSize: 13, fontWeight: 800, ...ring(MT.SHARE) }}>⋔ 공유</span>
            <span style={{ padding: '7px 12px', borderRadius: 8, background: '#e9f8f7', color: '#1f8f8c', fontSize: 12.5, fontWeight: 700 }}>인쇄물/상품 제작</span>
            <span style={{ padding: '7px 14px', borderRadius: 8, background: MIRI_TEAL, color: '#fff', fontSize: 13, fontWeight: 800 }}>⤓ 다운로드</span>
          </div>
          {/* 왼쪽 도구 모음 */}
          <div style={{ ...px(0, 52, 64, MB.h - 52), background: '#fff', borderRight: `1px solid ${MIRI_LINE}` }}>
            {RAIL.map((r, i) => { const hot = r === 'AI 도구' && panel !== 'templates'; const cur = r === '템플릿' && panel === 'templates'; return <div key={r} style={{ ...px(4, 52 + i * 56 - 52 + 6, 56, 48), borderRadius: 8, background: hot || cur ? '#e6f7f6' : 'transparent', color: hot || cur ? '#1f8f8c' : MIRI_MUTED, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, fontSize: 10.5, fontWeight: 700, whiteSpace: 'nowrap', ...(r === 'AI 도구' ? ring(MT.TOOLS) : {}) }}><div style={{ fontSize: 14, lineHeight: 1 }}>{r === 'AI 도구' ? '✦' : '▢'}</div><div style={{ lineHeight: 1 }}>{r}</div></div>; })}
          </div>
          {/* 사이드 패널 */}
          <div style={{ ...px(64, 52, 270, MB.h - 52), background: '#fff', borderRight: `1px solid ${MIRI_LINE}`, padding: 16, boxSizing: 'border-box' }}>
            {panel === 'templates' && (
              <>
                <div style={{ padding: '9px 12px', borderRadius: 8, border: `1px solid ${MIRI_LINE}`, fontSize: 12.5, color: MIRI_MUTED }}>🔍 템플릿 검색 (예: 여름 메뉴 세로 포스터)</div>
                <div style={{ marginTop: 14, fontSize: 13, fontWeight: 800 }}>인기 Top20 🔥</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>{[0, 1, 2, 3, 4, 5].map((k) => <div key={k} style={{ height: 78, borderRadius: 8, background: k % 2 ? '#eef0f5' : '#e3e7ef' }} />)}</div>
              </>
            )}
            {panel === 'tools' && (
              <>
                <div style={{ height: 66, borderRadius: 10, background: 'linear-gradient(120deg, #e9e3ff, #d9f4ff)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, color: '#5b4bb7' }}>AI 도구 · 생성 예시</div>
                <div style={{ fontSize: 13, fontWeight: 800, marginTop: 14 }}>AI로 시각자료 생성하기</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>{tile('시각 페이지')}{tile('내 화면 참조')}{tile('인포그래픽')}</div>
                <div style={{ fontSize: 13, fontWeight: 800, marginTop: 16 }}>AI로 영상 생성하기</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>{tile('동영상', true, MT.VIDEO)}{tile('애니메이션 장면')}{tile('릴스용 장면')}</div>
              </>
            )}
            {panel === 'video' && (
              <>
                <div style={{ fontSize: 14, fontWeight: 800 }}>‹ &nbsp;동영상 만들기</div>
                <div style={{ fontSize: 12.5, fontWeight: 800, marginTop: 14 }}>스타일</div>
                <div style={{ marginTop: 6, padding: '10px 12px', borderRadius: 10, border: `1px solid ${MIRI_LINE}`, display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5 }}><span style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg, #cfe9ff, #e6d9ff)' }} />이미지 → 비디오<span style={{ marginLeft: 'auto', color: MIRI_MUTED }}>›</span></div>
                <div style={{ fontSize: 12.5, fontWeight: 800, marginTop: 14 }}>결과물 묘사 <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 999, background: '#ffe3e3', color: '#d43b3b' }}>필수</span></div>
                <div style={{ position: 'relative', marginTop: 6, height: 96, borderRadius: 10, border: `1px solid ${typing ? MIRI_TEAL : MIRI_LINE}`, padding: '10px 12px', boxSizing: 'border-box', fontSize: 12, lineHeight: 1.45, color: prompt ? MIRI_INK : MIRI_MUTED, wordBreak: 'keep-all', ...ring(MT.FOCUS) }}>
                  <span style={{ position: 'absolute', right: 10, top: 8, padding: '2px 7px', borderRadius: 6, background: '#eef0f5', fontSize: 10.5, color: MIRI_MUTED }}>예시 사용</span>
                  <div style={{ paddingRight: 60 }}>{prompt || '만들고 싶은 결과물을 자세히 설명해 보세요.'}{typing && <Caret color={MIRI_TEAL} />}</div>
                  <span style={{ position: 'absolute', right: 10, bottom: 6, fontSize: 10.5, color: MIRI_MUTED }}>{prompt.length}/1000</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, fontSize: 12.5, fontWeight: 800, padding: '4px 0', ...ring(MT.ATTACH) }}><span style={{ color: MIRI_MUTED }}>{expanded ? '⌄' : '›'}</span>이미지 첨부 <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 999, background: '#ffe3e3', color: '#d43b3b' }}>필수</span><span style={{ marginLeft: 'auto', width: 30, height: 16, borderRadius: 8, background: '#dfe3ea' }} /></div>
                {expanded && (
                  <div style={{ ...riseIn(t, MT.ATTACH + 0.2, 0.4, 6) }}>
                    <div style={{ display: 'flex', gap: 18, fontSize: 12, fontWeight: 700, marginTop: 6, borderBottom: `1px solid ${MIRI_LINE}` }}>{['업로드', '사진 검색', '최근 사용'].map((s, i) => <span key={s} style={{ padding: '4px 2px', color: i === 0 ? '#1f8f8c' : MIRI_MUTED, borderBottom: i === 0 ? `2px solid ${MIRI_TEAL}` : '2px solid transparent' }}>{s}</span>)}</div>
                    <div style={{ marginTop: 8, padding: '9px 0', borderRadius: 8, background: '#e9f8f7', color: '#1f8f8c', fontSize: 12.5, fontWeight: 800, textAlign: 'center' }}>업로드</div>
                    <div style={{ position: 'relative', marginTop: 8, width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: picked ? `2px solid ${MIRI_TEAL}` : '1px solid transparent', ...ring(MT.PICK) }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, height: '100%' }}>{landscape(5, 4, 0.5).map((c, i) => <div key={i} style={{ background: c }} />)}</div>
                      <span style={{ position: 'absolute', left: 5, top: 5, width: 14, height: 14, borderRadius: 3, background: picked ? MIRI_TEAL : '#fff', border: `1.5px solid ${picked ? MIRI_TEAL : '#aab'}`, color: '#fff', fontSize: 10, display: 'grid', placeItems: 'center' }}>{picked ? '✓' : ''}</span>
                      <span style={{ position: 'absolute', right: 4, bottom: 3, fontSize: 9.5, ...mono, color: '#fff', textShadow: '0 1px 2px #000' }}>01.png</span>
                    </div>
                  </div>
                )}
                <div style={{ position: 'absolute', left: 16, right: 16, bottom: 14, padding: '11px 0', borderRadius: 8, background: MIRI_TEAL, color: '#fff', textAlign: 'center', fontSize: 14, fontWeight: 800, opacity: prompt && picked ? 1 : 0.55, ...ring(MT.GEN) }}>생성</div>
              </>
            )}
          </div>
          {/* 캔버스 */}
          <div style={{ ...px(334, 52, MB.w - 334, 508) }}>
            <div style={{ ...px(324, 40, 400, 400), background: '#fff', border: `1.5px solid ${MIRI_TEAL}`, boxSizing: 'border-box' }}>
              {clips > 0
                ? <div style={{ position: 'absolute', left: 0, right: 0, top: 60, height: 280, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2, ...riseIn(t, MT.GEN_DONE, 0.5, 0) }}>{landscape(5, 4, 1.7).map((c, i) => <div key={i} style={{ background: c }} />)}</div>
                : <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 13, color: MIRI_MUTED }}>1 페이지 · 비어 있음 — 생성된 클립이 여기에 놓인다</div>}
              {clips > 0 && <span style={{ position: 'absolute', left: 12, top: 12, padding: '3px 8px', borderRadius: 6, background: '#000c', color: '#fff', fontSize: 11.5, fontWeight: 800 }}>▶ 4초 · 클립 01</span>}
            </div>
            {generating && <div style={{ position: 'absolute', right: 24, bottom: 20, padding: '10px 14px', borderRadius: 10, background: '#1b1f2a', color: '#fff', fontSize: 12.5, fontWeight: 700, ...riseIn(t, MT.GEN + 0.2, 0.4, 6) }}>⏳ 영상 생성 중 · 완성되면 페이지에 놓입니다 <span style={{ display: 'inline-block', width: 90, height: 6, borderRadius: 3, background: '#3a4353', marginLeft: 8, verticalAlign: 'middle', overflow: 'hidden' }}><span style={{ display: 'block', width: `${interpolate(t, [MT.GEN + 0.2, MT.GEN_DONE], [0, 100])}%`, height: '100%', background: MIRI_TEAL }} /></span></div>}
            <div style={{ position: 'absolute', left: 30, bottom: 16, width: 40, height: 40, borderRadius: 20, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 900, fontStyle: 'italic', color: '#8a5cff' }}>ai</div>
          </div>
          {/* 하단 페이지 띠 — 동영상 에디터 모드 */}
          <div style={{ ...px(334, 560, MB.w - 334, MB.h - 560), background: '#fff', borderTop: `1px solid ${MIRI_LINE}` }}>
            <div style={{ position: 'absolute', left: 30, top: 18, width: 58, height: 58, borderRadius: 29, background: '#fff', border: `1px solid ${MIRI_LINE}`, display: 'grid', placeItems: 'center', fontSize: 16, color: '#555' }}>▶</div>
            {[0, 1, 2, 3].map((k) => { const has = clips > k; return <div key={k} style={{ ...px(110 + k * 112, 14, 100, 66), borderRadius: 6, border: `1.5px solid ${has ? MIRI_INK : MIRI_LINE}`, background: '#fff', overflow: 'hidden', boxSizing: 'border-box' }}>{has && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, height: '100%', ...riseIn(t, k === 0 ? MT.GEN_DONE : MT.CLIPS + (k - 1) * 0.3, 0.4, 6) }}>{landscape(5, 4, 0.5 + k * 1.2).map((c, i) => <div key={i} style={{ background: c }} />)}</div>}{has && <span style={{ position: 'absolute', left: 5, bottom: 4, padding: '1px 6px', borderRadius: 999, background: '#000c', color: '#fff', fontSize: 9.5, fontWeight: 800 }}>{k === 0 ? '4초' : '5초'}</span>}{!has && <span style={{ position: 'absolute', left: 0, right: 0, top: 26, textAlign: 'center', fontSize: 11, color: MIRI_MUTED }}>{k + 1}</span>}</div>; })}
            <div style={{ ...px(110 + 4 * 112, 14, 100, 66), borderRadius: 6, background: '#f0f2f6', display: 'grid', placeItems: 'center', fontSize: 22, color: '#666' }}>+</div>
            {clips >= 2 && <div style={{ position: 'absolute', left: 110, top: 86, fontSize: 11.5, fontWeight: 800, color: '#1f8f8c', ...riseIn(t, MT.CLIPS, 0.4, 4) }}>같은 방법으로 컷 2·3·4 — 페이지 하나 = 클립 하나 · 순서대로 이어져 한 편이 된다</div>}
            <div style={{ position: 'absolute', left: 30, right: 20, bottom: 10, display: 'flex', alignItems: 'center', gap: 22, fontSize: 12, color: MIRI_MUTED }}>
              <span style={mono}>00:00 / 00:{clips ? String(4 + (clips - 1) * 5).padStart(2, '0') : '00'}</span><span>✂</span><span>◌ 애니메이션</span><span>◷ 4초</span>
              <span style={{ marginLeft: 'auto', padding: '5px 10px', borderRadius: 6, background: '#eef0f5', color: MIRI_INK, fontWeight: 700 }}>▶ 동영상 에디터</span><span>－ 53 % ＋</span>
            </div>
          </div>
          {/* 공유 팝오버 */}
          {share && (
            <div style={{ ...px(950, 58, 420, 290), background: '#fff', borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,0.22)', border: `1px solid ${MIRI_LINE}`, padding: '0 18px 16px', boxSizing: 'border-box', ...popIn(t, MT.SHARE + 0.2) }}>
              <div style={{ display: 'flex', gap: 22, fontSize: 13.5, fontWeight: 800, borderBottom: `1px solid ${MIRI_LINE}` }}><span style={{ padding: '12px 4px 8px', color: '#1f8f8c', borderBottom: `2px solid ${MIRI_TEAL}` }}>공유</span><span style={{ padding: '12px 4px 8px', color: MIRI_MUTED }}>게시</span><span style={{ marginLeft: 'auto', padding: '12px 0', color: MIRI_MUTED }}>✕</span></div>
              <div style={{ marginTop: 12, padding: '9px 12px', borderRadius: 8, border: `1px solid ${MIRI_LINE}`, fontSize: 12, color: MIRI_MUTED }}>이름 또는 이메일 입력</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, fontSize: 12 }}><span style={{ width: 26, height: 26, borderRadius: 13, background: '#ff6b3d', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 800 }}>te</span><span><b>나</b> · 학생 계정</span><span style={{ marginLeft: 'auto', color: MIRI_MUTED }}>소유자</span></div>
              <div style={{ marginTop: 12, fontSize: 12.5, fontWeight: 800 }}>접근 권한</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, fontSize: 12.5 }}>
                <span style={{ width: 30, height: 30, borderRadius: 15, background: '#eef0f5', display: 'grid', placeItems: 'center' }}>🌐</span>
                <span style={{ padding: '5px 10px', borderRadius: 8, border: `1.5px solid ${perm ? C.mag : MIRI_LINE}`, background: perm ? 'rgba(255,79,163,0.10)' : '#fff', fontWeight: 800, ...ring(MT.PERM) }}>{perm ? '링크가 있는 누구나' : '초대된 사용자만'} ▾</span>
                <span style={{ marginLeft: 'auto', color: MIRI_MUTED }}>보기 가능 ▾</span>
              </div>
              <div style={{ marginTop: 14, padding: '11px 0', borderRadius: 8, background: copied ? C.mint : '#e9f8f7', color: copied ? '#0b2a28' : '#1f8f8c', textAlign: 'center', fontSize: 13, fontWeight: 800, ...ring(MT.COPY) }}>{copied ? '복사됨 ✓ → 활동지 「최종 영상 공유 링크」에 붙여 넣기' : '🔗 링크 복사'}</div>
            </div>
          )}
        </div>
      </AppWindow>
      <Pointer path={path} color={C.amber} timelineEnd={MT.END} />

      {/* 오른쪽 단계 레일 */}
      <div style={{ ...abs(1500, 215, 340), display: 'grid', gap: 12 }}>
        {steps.map(([n, s, at]) => { const on = t >= at; return <div key={n} style={{ ...card, padding: '12px 16px', borderLeft: `4px solid ${on ? C.amber : 'var(--hair)'}`, opacity: on ? 1 : 0.5, display: 'flex', gap: 10, alignItems: 'flex-start' }}><span style={{ ...mono, fontSize: 20, color: on ? C.amber : 'var(--fg-faint)', lineHeight: 1.2 }}>{n}</span><span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.4, wordBreak: 'keep-all' }}>{s}</span></div>; })}
        <div style={{ ...kick, fontSize: 12, marginTop: 2 }}>도구 모음·패널·버튼 문구는 2026-09-09 편집기 화면 그대로. 생성 결과 위치와 소요 시간은 교사가 실제 생성으로 확인</div>
      </div>
      <div style={{ ...abs(110, 985, 1700), ...kick, color: C.red, textTransform: 'none', letterSpacing: 0, fontSize: 15 }}>⚠ 실제 인물 얼굴 · 유명인 · 저작권 캐릭터 금지 · 크레딧은 매일 무료 지급분 안에서 · 18분 시점까지 안 나온 컷은 교사 예비 클립으로</div>
    </>
  );
}

/* ───────────── S16 활동 ───────────── */
function ActivitySlide() {
  return (
    <>
      <div style={{ ...abs(110, 90), ...kick }}>활동 · 26분</div>
      <Reveal><h2 style={{ ...abs(110, 140, 1200), ...h2 }}>4컷 영상 만들고 <span style={accentText}>제출하기</span></h2></Reveal>
      <div style={{ ...abs(110, 290, 900) }}>
        <div style={{ display: 'flex', gap: 30, alignItems: 'center' }}>
          <LinkButton href={ACTIVITY_PATH} size={26} sub="활동지 · 학번과 제출 암호 · TXT + 시트 저장">활동지 열기 ↗</LinkButton>
          <div style={{ width: 200, height: 200, borderRadius: 16, background: '#fff', padding: 10, boxSizing: 'border-box' }}><img src={`${BASE}/images/activity-qr.png`} alt="활동지 QR" style={{ width: '100%', height: '100%', display: 'block' }} onError={(e) => ((e.currentTarget.parentElement as HTMLElement).style.display = 'none')} /></div>
        </div>
        <div style={{ marginTop: 34, display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          {[['설계', 4], ['생성 (대기 중 다음 프롬프트)', 14], ['이어 붙이기', 4], ['공유·제출', 4]].map(([a, m]) => <div key={a as string} style={{ flex: m as number }}><div style={{ height: 14, borderRadius: 7, background: 'var(--accent)', opacity: 0.85 }} /><div style={{ fontSize: 16, fontWeight: 700, marginTop: 6 }}>{a} <span style={{ ...mono, color: 'var(--fg-muted)' }}>{m}분</span></div></div>)}
        </div>
      </div>
      <div style={{ ...abs(1080, 290, 730), display: 'grid', gap: 12 }}>
        {[['A', '기획', '제목 · 한 줄 줄거리 · 주인공과 스타일', C.mag, 560], ['B', '컷 1~4', '장면 설명 · 입력한 프롬프트', C.cyan, 640], ['C', '최종 영상', '공유 링크 · 공유 설정 확인', C.yellow, 600], ['D', '한 줄 성찰', '선택', '#b48cff', 420]].map(([b, n, d, col, w]) => (
          <div key={b as string} style={{ ...card, padding: '12px 18px', width: w as number, display: 'flex', gap: 14, alignItems: 'center', borderLeft: `4px solid ${col}` }}><div style={{ fontSize: 26, fontWeight: 900, color: col as string }}>{b}</div><div><div style={{ fontSize: 21, fontWeight: 800 }}>{n}</div><div style={{ ...body, fontSize: 16 }}>{d}</div></div></div>
        ))}
      </div>
      <div style={{ ...abs(110, 900, 1700), ...card, padding: '14px 24px', display: 'flex', gap: 28, fontSize: 18, fontWeight: 700, flexWrap: 'wrap' }}>
        <span>필수: 4컷 · 같은 주인공 · 최종 링크</span><span>공개 설정 확인 — 짝의 시크릿 창에서 로그인 없이 4컷 전체 재생</span><span>18분 시점에 생성 대기 종료 → 예비 클립</span><span>자막·음악·전환은 제출 뒤 선택</span>
      </div>
    </>
  );
}

/* ───────────── S17 한눈 정리 ───────────── */
function SummarySlide() {
  return (
    <>
      <div style={{ ...abs(110, 90), ...kick }}>한눈 정리</div>
      <Reveal><h2 style={{ ...abs(110, 140, 1400), ...h2 }}>조각이 무엇이든, <span style={accentText}>쳐다보고 고른다</span></h2></Reveal>
      <div style={{ transform: 'scale(0.78)', transformOrigin: 'top left', position: 'absolute', left: 110, top: 300 }}><Stairs x={0} y={560} complete film /></div>
      <div style={{ ...abs(1060, 300, 760), display: 'grid', gap: 16 }}>
        {[['①', '글자 · 패치 · 시공간 패치 · 오디오 토큰 — 모두 조각이다.'], ['②', '영상 조각은 같은 프레임(공간) · 다른 프레임(시간) · 프롬프트(낱말), 세 가지를 참조한다 — 어텐션의 확장.'], ['③', '영상 생성의 한 방식(Sora·Kling) = 확산 + 트랜스포머(DiT), 음악 생성의 한 방식(MusicGen) = 코덱 토큰 + 다음 토큰 고르기.']].map(([n, s], i) => (
          <Build key={n} at={i + 1}><div style={{ ...card, padding: '18px 22px', display: 'flex', gap: 16, alignItems: 'flex-start' }}><div style={{ ...mono, fontSize: 28, color: C.amber, fontWeight: 700 }}>{n}</div><div style={{ fontSize: 24, fontWeight: 700, wordBreak: 'keep-all' }}>{s}</div></div></Build>
        ))}
      </div>
      <Build at={3} style={{ ...abs(110, 900, 1700) }}>
        <div style={{ ...card, padding: '14px 24px', display: 'flex', gap: 20, alignItems: 'center', border: `2px solid ${C.mag}` }}><span style={{ ...kick, color: C.mag }}>라이브 · 출구 티켓</span><span style={{ fontSize: 22, fontWeight: 700 }}>이해도(1~5)와 한마디 — 조각이 무엇이든 공통인 것 하나, 영상에서 달라지는 것 하나</span></div>
      </Build>
    </>
  );
}

/* ───────────── S18 되감기 ───────────── */
function ReelScene() {
  const t = useSceneTime();
  const wind = interpolate(t, [0.3, 2.6], [0, 1], easeInOut);
  const angle = interpolate(t, [0.3, 2.6], [0, 900], easeInOut);
  const spill = interpolate(t, [2.8, 4.0], [0, 1], easeInOut);
  const reel = [420, 480];
  return (
    <>
      {/* 릴 */}
      <div style={{ ...abs(reel[0] - 150, reel[1] - 150, 300, 300), borderRadius: '50%', border: '10px solid #4a5468', background: 'radial-gradient(circle, #232a38 0 30%, #12161f 31% 100%)', boxShadow: '0 0 40px rgba(255,79,163,0.15)', transform: `rotate(${angle}deg)` }}>
        {[0, 60, 120].map((a) => <div key={a} style={{ position: 'absolute', left: '50%', top: '50%', width: 260, height: 14, marginLeft: -130, marginTop: -7, background: '#4a5468', borderRadius: 7, transform: `rotate(${a}deg)` }} />)}
      </div>
      {/* 필름 스트립 4칸 — 오른쪽에서 릴로 감긴다 */}
      {[0, 1, 2, 3].map((k) => {
        const sx = 900 + k * 230, ex = reel[0] - 60 + k * 10;
        const x = lerp(sx, ex, Math.min(1, Math.max(0, wind * 1.6 - k * 0.2)));
        const sc = lerp(1, 0.3, Math.min(1, Math.max(0, wind * 1.6 - k * 0.2)));
        return (
          <div key={k} style={{ ...abs(x, 380, 210, 200), borderRadius: 10, border: '1px solid var(--hair)', background: 'rgba(11,13,18,0.9)', overflow: 'hidden', transform: `scale(${sc})`, opacity: 1 - spill }}>
            <div style={{ height: 12, background: 'repeating-linear-gradient(90deg, #000 0 8px, #3a4353 8px 16px)' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 2, padding: 6 }}>{landscape(6, 5, 1 + k * 1.3).map((c, i) => <div key={i} style={{ height: 28, background: c, borderRadius: 2 }} />)}</div>
            <div style={{ height: 12, background: 'repeating-linear-gradient(90deg, #000 0 8px, #3a4353 8px 16px)' }} />
          </div>
        );
      })}
      {/* 조각 12개가 릴에서 풀려 한 줄로 (S1의 거울상) */}
      {S1_COLORS.map((col, i) => { const x = lerp(reel[0], 180 + i * 76, spill), y = lerp(reel[1], 860, spill); return <div key={i} style={{ ...abs(x, y, 54, 54), borderRadius: 8, background: col, opacity: spill, boxShadow: `0 0 18px ${col}55` }} />; })}
      <div style={{ ...abs(110, 110), ...kick }}>마무리</div>
      <div style={{ ...abs(1000, 300, 800) }}>
        <div style={{ ...h1, fontSize: 56, ...riseIn(t, 4.2) }}>조각이 무엇이든,<br /><span style={accentText}>쳐다보고 고른다.</span></div>
        <div style={{ marginTop: 40, ...riseIn(t, 4.8) }}><LinkButton href={ACTIVITY_PATH} size={20} sub="제출 못 한 사람은 링크로 이어서 · 질문은 언제든 정보실">활동지 · 이어서 제출 ↗</LinkButton></div>
      </div>
    </>
  );
}

/* ───────────── 덱 ───────────── */
export default function TransformerVideoMusicDeck() {
  return (
    <Deck>
      <Slide full nav="표지" notes="지난 시간 점선으로 남겨 둔 셋째 계단입니다. 화면의 조각들이 줄이 되고, 격자가 되고, 블록이 되고, 구슬이 됐죠. 오늘 결론을 먼저 말씀드리면, 저 조각이 무엇이든 트랜스포머는 같은 일을 합니다.">
        <Fit><Scene duration={7}><TransformScene /></Scene></Fit>
      </Slide>
      <Slide full nav="같은 기계인가" notes="정답을 맞히는 게 아니라 지금 생각을 적어 두는 겁니다. 클릭 2 상태에서 라이브 객관식 제출 → 분포만 공개하고 정답 공개는 1부 정리(S12)에서 합니다.">
        <Fit><SameMachineSlide /></Fit>
      </Slide>
      <Slide full nav="셋째 계단" notes="지난 시간 계단, 기억나죠? 점선이었던 셋째 계단을 오늘 오릅니다. 1부는 원리, 2부는 여러분이 직접 영상을 만듭니다.">
        <Fit><StairsSlide /></Fit>
      </Slide>
      <Slide full nav="이름의 뜻" notes="이름부터 봅시다. trans는 건너서, form은 형태. 형태를 바꾸는 것, 변환기예요. 변압기도 transformer, 변신 로봇도 Transformers죠(클릭 1). 셋 다 무언가를 바꿉니다. AI 트랜스포머가 바꾸는 것은 조각의 뜻이에요. 조각들이 서로 쳐다보며 자기 뜻을 고쳐 쓰고, 그 결과로 다음 조각을 고릅니다. 이걸 몇 번 되풀이하는지는 어텐션을 배운 뒤 S9에서 다시 봅니다. 이름은 2017년 논문 저자가 소리가 마음에 들어 골랐다는 일화가 있어요. 그래서 오늘 질문은 무엇을 무엇으로 바꾸는가입니다(클릭 2).">
        <Fit><NameSlide /></Fit>
      </Slide>
      <Slide full nav="심장은 쳐다보기" notes="지난 LLM 시간 눈금입니다. 셋째 칸, 서로 쳐다보기가 심장이에요(클릭 1). 그런데 첫째 칸에서 자르는 게 꼭 글이어야 할까요? 그림을 잘라도, 영상을 잘라도 나머지 세 칸의 뼈대는 그대로입니다. 다만 마지막 칸에서 무엇을 예측하는지는 다릅니다(클릭 2). 조각이 무엇이든, 쳐다보고 고른다(클릭 3).">
        <Fit><HeartSlide /></Fit>
      </Slide>
      <Slide full nav="그림도 조각" notes="사진을 각설탕처럼 자릅니다. 실제 모델은 예를 들어 16×16 픽셀 크기로 자르고, 각 조각에 위치 정보를 숫자로 붙여요. 이제 이 조각들은 글자와 똑같은 자리에 선 겁니다.">
        <Fit><Scene duration={5}><PatchConveyorScene /></Scene></Fit>
      </Slide>
      <Slide full nav="영상은 시공간 조각" notes="영상은 사진을 여러 장 쌓은 블록입니다. 여기서 조각을 뽑을 때 시간 방향으로도 두껍게 뽑아요. 그래서 조각 하나가 '이 자리가 시간에 따라 어떻게 변했는지'를 함께 담고 있습니다. 소라라는 모델이 영상을 압축한 뒤 이렇게 자른 조각을 시공간 패치라고 불렀어요.">
        <Fit><Scene duration={5}><FilmBlockScene /></Scene></Fit>
      </Slide>
      <Slide full nav="3D 모형" notes="각자 링크를 여세요. 처음 화면은 4프레임짜리 장난감 영상이고 「프레임 2의 공」이 읽는 조각으로 잡혀 있습니다. 1 공간·2 시간·4 교차 버튼을 차례로 눌러 보세요. 형광펜이 가는 곳이 달라집니다. 자기 자신에게도 가중치가 가는 것이 정상입니다. 접속 2분, 과제 ① 4분, ② 3분, ③ 3분. 12분 뒤 정리합니다. 모형의 영상과 숫자는 손으로 설계한 장난감이라는 것이 화면에 적혀 있어요. 실제와 같은 것은 어텐션 한 헤드의 계산 순서이고, 공간·시간·전체·교차로 범위를 나누는 방식은 실제 모델들이 쓰는 구분입니다.">
        <Fit><ModelSlide /></Fit>
      </Slide>
      <Slide full nav="어텐션 네 갈래" notes="모형에서 본 걸 이름으로 정리합니다. 계산은 하나예요. 달라지는 건 누가 누구를 볼 수 있느냐, 그리고 키가 어디서 오느냐입니다(클릭 1~4). 클릭 5에서 한 가지를 덧붙일게요. 쳐다보기는 한 번으로 끝나지 않고 같은 계산을 여러 겹 쌓습니다. 조각은 겹을 지날 때마다 자기 뜻을 다시 쓰고, 마지막 겹까지 가야 다음 조각 하나가 정해져요. 이 통과를 되풀이하는 것이 생성 단계입니다. 글과 음악은 조각마다, 영상은 안개를 걷어내는 단계마다 한 번씩이에요. 이어서 라이브 객관식(공이 오른쪽으로 굴러간다 → 시간 방향을 보는 어텐션, 시간 어텐션이든 전체 3D 어텐션이든).">
        <Fit><AttentionKindsSlide /></Fit>
      </Slide>
      <Slide full nav="안개가 걷힌다" notes="만드는 법은 지난 시간 그대로예요. 노이즈에서 걷어냅니다. 다른 건 둘. 걷어내는 대상이 블록이고, 걷어내는 신경망이 트랜스포머입니다. 프레임을 한 장씩 따로 만들면 사이가 튀기 쉬운데, 블록을 한 덩어리로 걷어내니 공이 매끄럽게 이어지기 쉬워요. 그래도 보장은 아니라서 긴 영상은 아직 어긋나기도 합니다.">
        <Fit><Scene duration={5.5}><FogScene /></Scene></Fit>
      </Slide>
      <Slide full nav="음악도 조각" notes="소리도 조각입니다. 파형은 너무 기니까 코덱이 초당 50번씩, 네 줄의 구슬로 줄여요. 그럼 음악 생성은 LLM과 똑같아집니다. 다음 구슬 고르기. 다 꿴 목걸이를 코덱이 다시 소리로 풀어 주고요. 수노 같은 서비스는 구조를 공개하지 않아서, 공개된 뮤직젠으로 설명했습니다.">
        <Fit><Scene duration={6.5}><BeadsScene /></Scene></Fit>
      </Slide>
      <Slide full nav="한 기계 네 조각" notes="S2 문항 정답 공개합니다(콘솔에서 reveal). 같은 기계에 다른 조각. 이제 5분 쉬고, 2부에서는 여러분이 그 기계로 영상을 만듭니다.">
        <Fit><OneMachineSlide /></Fit>
      </Slide>
      <Slide full nav="영상 프롬프트" notes="그림 프롬프트에서 특히 더 챙길 것은 세 가지, 움직임·카메라·시간입니다. 이미지→비디오라서 주체와 스타일은 이미 사진이 정했어요. 프롬프트에는 '어떻게 움직이는가'를 씁니다. 클릭 1~5로 조각이 하나씩 밑줄로 완성됩니다.">
        <Fit><PromptSlide /></Fit>
      </Slide>
      <Slide full nav="4컷 설계" notes="AI가 잇는 건 한 클립 안 프레임 사이입니다. 클립과 클립 사이는 여러분이 이어야 해요. 그래서 설계를 먼저 합니다. 활동지의 A 구역이 이 설계입니다.">
        <Fit><StoryboardSlide /></Fit>
      </Slide>
      <Slide full nav="미리캔버스 순서" notes="화면 시연을 먼저 보고 순서를 익힙니다(재생 버튼으로 반복). 순서는 다섯 단계입니다. 특히 넷째, 공개 설정을 하지 않으면 링크를 받아도 열리지 않습니다. 미리캔버스 화면은 자주 바뀌니 실제 메뉴 이름은 제가 수업 전에 확인해서 알려드릴게요. (교사 확인 사항: 이미지→비디오 메뉴 위치, 클립 길이, 크레딧 소모량, 공유 메뉴 명칭 — 공식 도움말은 「공유 → 게시 → 디자인 문서 공개」로 안내한다)">
        <Fit><Scene duration={MT.END}><MiriWalkScene /></Scene></Fit>
      </Slide>
      <Slide full nav="활동 · 4컷 영상" notes="이미지 4장이 준비됐는지 먼저 확인합니다(없으면 배포 세트). 활동지를 열고 A 기획부터 씁니다. 생성 버튼을 누르고 기다리는 동안 다음 컷 프롬프트를 쓰세요. 26분이고, 18분 시점에 아직 안 나온 컷은 예비 클립으로 바꿉니다. 제출 전에 짝의 시크릿 창에서 링크가 열리는지 확인합니다.">
        <Fit><ActivitySlide /></Fit>
      </Slide>
      <Slide full nav="한눈 정리" notes="세 문장으로 정리합니다(클릭 1~3). 클릭 3 뒤 출구 티켓 — 이해도와 한마디. 조각이 무엇이든 공통인 것 하나, 영상에서 달라지는 것 하나를 적어 주세요.">
        <Fit><SummarySlide /></Fit>
      </Slide>
      <Slide full nav="되감기" notes="오늘 만든 4컷이 한 편이 됐고, 그 안의 조각들이 이 한 줄입니다. 조각이 무엇이든, 쳐다보고 고른다. 제출 못 한 사람은 링크로 이어서 제출하세요. 수고하셨습니다.">
        <Fit><Scene duration={6}><ReelScene /></Scene></Fit>
      </Slide>
    </Deck>
  );
}
