import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import Build from '../../../../src/deck/Build';
import Reveal from '../../../../src/deck/Reveal';
import { useDeck } from '../../../../src/deck/DeckContext';
import { Scene, useSceneTime, interpolate, riseIn, easeInOut, easeOut } from '../../../../src/scene';
import { AppWindow, Pointer, Caret, typed, typedDoneAt, clickFlash, popIn, type CursorKey } from '../../../../src/walkthrough';

/* ── 인공지능 기초 · 2026-2 — AI는 어떻게 그림을 그릴까 (18장) ────────────
   plan: data/2026-2/인공지능기초/AI는-어떻게-그림을-그릴까/plan.md
   아크: 노이즈에서 떠오르는 제목 → 낱말을 실시간으로 그림으로(live) → 두 계단 지도
        → 그림은 숫자 격자(돋보기) → 진짜 사진 판별(live) → GAN 탁구 랠리
        → GAN이라는 이름(용어) → 이룬 것·막힌 것 → 잉크 방울(정과정·역과정)
        → 확산이라는 이름(용어) → 4단계 → 3D 모형 → 조건·증류(live) → 오해 셋
        → Krea Realtime 절차 → 실습 3라운드 → 계단 완성형(live 출구) → 노이즈로 돌아가는 제목
   용어 장 두 개(S6-A·S8-A)는 씬으로 「경험」한 직후에 「이름」을 붙이는 자리다 —
   랠리를 본 뒤 Generative·Adversarial·Network를, 잉크를 본 뒤 diffusion·DDPM을 뜯는다.
   테마: 라이트 웜 그레이 + 시그널 레드 — "회색 노이즈 점 ↔ 빨간 신호"
   원칙: 트랜스포머 확장은 다루지 않는다(별도 수업) — S3 점선 계단과 S16 예고까지만. */

const BASE = 'data/2026-2/인공지능기초/AI는-어떻게-그림을-그릴까';
const SITE = 'https://2026kijunit.netlify.app';
const MODEL_PATH = `/${BASE}/모형-노이즈에서-그림으로.html`;   // 사이트 루트 기준 — 로컬·배포 공통
const MODEL_URL = `${SITE}${MODEL_PATH}`;
const FLUX_URL = 'https://huggingface.co/spaces/KingNish/Realtime-FLUX';
const STYLEGAN_URL = 'https://huggingface.co/spaces/hysts/StyleGAN3';
const KREA_URL = 'https://www.krea.ai';

const C = {
  red: '#e8442a',
  blue: '#2b7de9',
  noise: '#8a94a0',
  warm: '#f2a33a',
  ink: '#17202a',
  green: '#2b9a55',
  amber: '#fbbf24',   // 「LLM은 어떻게 말을 고를까」의 형광펜 색 — S11 어텐션 회수에만 쓴다
};

const kw: CSSProperties = { wordBreak: 'keep-all' };
const mono = 'var(--font-mono)';
const card: CSSProperties = {
  background: 'var(--surface-2)',
  border: '1px solid var(--hair)',
  borderRadius: 16,
  padding: 'clamp(14px, 1.8vw, 22px)',
  boxShadow: '0 10px 30px -22px rgba(23,32,42,.35)',
};
/* 하단 플로팅 독이 화면 아래 중앙을 덮는다 — 씬의 하단 밴드는 이만큼 띄운다 */
const DOCK_SAFE = 'clamp(86px, 11vh, 120px)';

/* ── 결정론적 난수 — 씬의 모든 노이즈는 고정 시드에서 나온다 (Math.random 금지) ── */
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function noiseArray(n: number, seed: number): Float32Array {
  const rng = mulberry32(seed);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = rng();
  return out;
}
const smooth = (x: number) => {
  const c = Math.max(0, Math.min(1, x));
  return c * c * (3 - 2 * c);
};

/* 캔버스 그리기 훅 — React diff 없이 t마다 다시 그린다 (수천 개 셀도 가볍다) */
function useCanvas(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, deps: unknown[]) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const W = Math.round(r.width * dpr);
    const H = Math.round(r.height * dpr);
    if (c.width !== W || c.height !== H) {
      c.width = W;
      c.height = H;
    }
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, r.width, r.height);
    draw(ctx, r.width, r.height);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

/* ── 공용 소품 ───────────────────────────────────────────────── */

function Kicker({ children, tone = 'var(--primary)' }: { children: ReactNode; tone?: string }) {
  return (
    <div className="kicker" style={{ color: tone, ...kw }}>
      {children}
    </div>
  );
}

function LinkPill({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        color: 'var(--primary)',
        fontWeight: 700,
        fontSize: 13.5,
        textDecoration: 'underline',
        textUnderlineOffset: 4,
        textDecorationColor: 'color-mix(in srgb, var(--primary) 45%, transparent)',
        ...kw,
      }}
    >
      {label} ↗
    </a>
  );
}

/** 큰 클릭 링크 버튼 — 수업 중 실제로 누르는 URL */
function LinkButton({ href, label, sub, big }: { href: string; label: string; sub?: string; big?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 3,
        padding: big ? 'clamp(14px, 2vh, 20px) clamp(20px, 2.6vw, 30px)' : '10px 16px',
        borderRadius: 14,
        background: big ? 'var(--primary)' : 'transparent',
        color: big ? 'var(--accent-ink)' : 'var(--primary)',
        border: `1.5px solid ${big ? 'var(--primary)' : 'color-mix(in srgb, var(--primary) 55%, transparent)'}`,
        textDecoration: 'none',
        fontWeight: 800,
        fontSize: big ? 'clamp(16px, 2vw, 22px)' : 'clamp(13px, 1.4vw, 15px)',
        boxShadow: big ? 'var(--glow)' : 'none',
        ...kw,
      }}
    >
      <span>{label} ↗</span>
      {sub && (
        <span style={{ fontFamily: mono, fontWeight: 600, fontSize: 'clamp(11px, 1.15vw, 12.5px)', opacity: 0.85 }}>{sub}</span>
      )}
    </a>
  );
}

/** 라이브 문항 배지 — 이 슬라이드를 띄운 채 라이브 퀴즈를 진행한다는 표시 */
function LiveTag({ kind, text }: { kind: string; text: string }) {
  return (
    <div
      style={{
        ...card,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 16px',
        borderColor: 'color-mix(in srgb, var(--primary) 45%, transparent)',
        background: 'color-mix(in srgb, var(--primary) 7%, var(--surface-2))',
        textAlign: 'left',
      }}
    >
      <span style={{ fontFamily: mono, fontSize: 11.5, fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.08em', whiteSpace: 'nowrap', flexShrink: 0 }}>
        LIVE · {kind}
      </span>
      <span style={{ fontWeight: 700, fontSize: 'clamp(13px, 1.45vw, 15.5px)', ...kw }}>{text}</span>
    </div>
  );
}

/** 회색 점묘 오버레이 — "노이즈에서 왔다"는 시각 언어 (AI 생성 사진 위에 얹는다) */
const DOT_NOISE = noiseArray(40 * 30, 7);
function DotVeil({ opacity = 0.35 }: { opacity?: number }) {
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity }}>
      {Array.from({ length: 40 * 30 }, (_, i) => {
        const v = DOT_NOISE[i];
        if (v < 0.55) return null;
        return <rect key={i} x={(i % 40) * 10 + 1} y={Math.floor(i / 40) * 10 + 1} width={8} height={8} fill={v > 0.94 ? C.red : C.noise} opacity={(v - 0.55) * 1.6} />;
      })}
    </svg>
  );
}

/* ── S1 · S16 — 노이즈에서 떠오르는 제목 / 노이즈로 돌아가는 제목 ──────────
   progress 0 = 화면 전체가 회색 점묘 노이즈, 1 = 가운데 밴드부터 걷혀 글자가 드러난 상태.
   S1은 progress가 t로 오르고, S16은 같은 함수를 거꾸로 돌린다(거울상). */
const GRID_C = 96;
const GRID_R = 54;
const TITLE_NOISE = noiseArray(GRID_C * GRID_R, 20260906);
const TITLE_T = 3.5;

function drawTitleNoise(ctx: CanvasRenderingContext2D, w: number, h: number, progress: number, calm = 0) {
  const cw = w / GRID_C;
  const ch = h / GRID_R;
  // 걷히는 밴드는 세로 중앙 ±34%까지 — 위아래 가장자리에는 점묘가 옅게 남는다("노이즈에서 왔다"는 흔적)
  const radius = interpolate(progress, [0, 1], [0, 0.4]);
  const edge = 1 - 0.55 * progress;   // 밴드 밖 진폭: 시작 1 → 끝 0.45
  for (let r = 0; r < GRID_R; r++) {
    const dist = Math.abs((r + 0.5) / GRID_R - 0.5);
    // 밴드 안은 잔여 0.12, 밖은 edge — 경계는 부드럽게
    const inBand = smooth((radius - dist) / 0.08 + 0.5);
    const amp = edge - (edge - 0.12) * inBand;
    for (let c = 0; c < GRID_C; c++) {
      const v = TITLE_NOISE[r * GRID_C + c];
      if (v * amp < 0.22) continue;
      const g = Math.round(236 - v * amp * 120);
      ctx.fillStyle = v > 0.955 && amp > 0.5 && calm < 0.999 ? `rgba(232,68,42,${((0.35 + 0.55 * amp) * (1 - calm)).toFixed(2)})` : `rgb(${g},${g + 2},${g + 5})`;
      ctx.fillRect(c * cw + cw * 0.12, r * ch + ch * 0.12, cw * 0.76, ch * 0.76);
    }
  }
}

function TitleScene({ reverse = false }: { reverse?: boolean }) {
  const t = useSceneTime();
  // S1: 0.3초 뒤부터 걷힌다 · S16: 0.6초 동안 또렷하다가 노이즈로 돌아간다
  // S1: 1.2초 동안 노이즈를 보여 준 뒤 3.5초에 걸쳐 걷힌다 · S16: 1.5초 동안 또렷하다가 3.5초에 걸쳐 노이즈로 돌아간다
  const progress = reverse
    ? 1 - smooth(interpolate(t, [1.5, 1.5 + TITLE_T], [0, 1]))
    : smooth(interpolate(t, [1.2, 1.2 + TITLE_T], [0, 1]));
  const textOn = reverse ? interpolate(t, [2.6, 4.4], [1, 0]) : interpolate(t, [2.4, 4.0], [0, 1], easeOut);
  const afterOn = reverse ? interpolate(t, [5.2, 6.2], [0, 1], easeOut) : 0;
  // 결론이 뜬 뒤에는 주변 붉은 점을 회색으로 가라앉힌다 — 빨간 신호가 문장에만 남게
  const calm = reverse ? afterOn : 0;
  const ref = useCanvas((ctx, w, h) => drawTitleNoise(ctx, w, h, progress, calm), [progress, calm]);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden />
      {/* 킥커 — 우상단 */}
      <div style={{ position: 'absolute', right: 'var(--gutter)', top: 'clamp(22px, 4vh, 44px)', textAlign: 'right', padding: '4px 10px', borderRadius: 8, background: 'rgba(236, 239, 243, 0.85)', opacity: reverse ? 1 : interpolate(t, [0.2, 0.9], [0, 1]) }}>
        <Kicker>인공지능 기초 · 생성 원리</Kicker>
      </div>
      {/* 제목 밴드 — 가운데 */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)', textAlign: 'center', padding: '0 var(--gutter)', opacity: textOn, filter: `blur(${(1 - textOn) * 9}px)` }}>
        <h1 className="display" style={{ marginInline: 'auto', ...kw }}>
          AI는 어떻게 <span className="accent-text">그림</span>을 그릴까
        </h1>
        {!reverse && (
          <p className="lead" style={{ marginInline: 'auto', marginTop: 14, ...kw, opacity: interpolate(t, [3.6, 4.6], [0, 1]) }}>
            오늘의 주제는 <strong>무엇을</strong> 그리느냐가 아니라 <strong>어떻게</strong> 그리느냐다.
          </p>
        )}
      </div>
      {!reverse ? (
        /* 오늘의 질문 둘 — 좌하단, 들여쓰기가 서로 다른 세로 목록 (균등 카드 금지) */
        <div style={{ position: 'absolute', left: 'calc(var(--gutter) - 14px)', bottom: DOCK_SAFE, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 'min(600px, 72vw)', padding: '12px 14px', borderRadius: 14, background: 'rgba(236, 239, 243, 0.86)' }}>
          {[
            { n: '01', q: '기계는 그림을 어디서 꺼내나', indent: 0, at: 4.4 },
            { n: '02', q: '속이며 배우는 것과 지우며 배우는 것은 어떻게 다른가', indent: 28, at: 4.7 },
          ].map((x) => (
            <div key={x.n} style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginLeft: x.indent, ...riseIn(t, x.at) }}>
              <span style={{ fontFamily: mono, fontWeight: 800, fontSize: 14, color: C.red }}>{x.n}</span>
              <span style={{ fontWeight: 800, fontSize: 'clamp(15px, 1.9vw, 22px)', ...kw }}>{x.q}</span>
            </div>
          ))}
          <div style={{ marginTop: 6, fontFamily: mono, fontSize: 12.5, color: 'var(--fg-muted)', ...riseIn(t, 5.0), ...kw }}>
            준비물 — 각자 기기(라이브 참여·실습) · krea.ai 로그인이 되는 브라우저
          </div>
        </div>
      ) : (
        /* 거울상 — 글자가 흩어진 자리에 오늘의 한 문장과 예고 */
        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)', textAlign: 'center', padding: '0 var(--gutter)', opacity: afterOn }}>
          {/* 노이즈 위에 얹히므로 종이 받침을 깐다 */}
          <div style={{ display: 'inline-block', maxWidth: 'min(1100px, 92vw)', padding: 'clamp(18px, 3vh, 30px) clamp(24px, 3vw, 44px)', borderRadius: 18, background: 'rgba(236, 239, 243, 0.97)', boxShadow: '0 24px 70px -30px rgba(23, 32, 42, 0.45)', border: '1px solid var(--hair)' }}>
            <p style={{ marginInline: 'auto', fontWeight: 800, fontSize: 'clamp(20px, 2.6vw, 32px)', color: C.red, ...kw }}>
              확산 모델은 노이즈 속에 숨은 그림을 찾아낸 것이 아니라, 걷어내는 법을 배운 것이다.
            </p>
            <p style={{ marginInline: 'auto', marginTop: 14, fontFamily: mono, fontWeight: 700, fontSize: 'clamp(12.5px, 1.4vw, 15px)', color: 'var(--fg-muted)', ...kw }}>
              다음 수업 — 트랜스포머: 말·그림·영상·소리를 다루는 모델들이 함께 쓰는 구조
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── S4 — 돋보기: 그림은 숫자 격자다 ────────────────────────────── */

/** 사과의 색 — 격자 좌표 (u,v ∈ 0~1) → [r,g,b] (0~255). 돋보기 안 픽셀과 큰 사과가 같은 함수를 쓴다 */
function appleRGB(u: number, v: number): [number, number, number] {
  // 좌표계: 큰 사과 SVG의 외접 정사각형 = (0,0)~(1,1), 사과 중심 (0.5,0.5), 반지름 0.5 — 돋보기가 보는 좌표와 같다
  const dx = (u - 0.5) / 0.5;
  const dy = (v - 0.5) / 0.5;
  const r2 = dx * dx + dy * dy;
  if (r2 > 1) {
    const bg = 238 - Math.round(Math.max(0, Math.min(1, v)) * 12);
    return [bg, bg + 2, bg + 5];
  }
  const nz = Math.sqrt(Math.max(0, 1 - r2));
  const light = Math.max(0, Math.min(1, (-dx * 0.45 - dy * 0.5 + nz * 0.75) / 1.0));
  const base: [number, number, number] = [232, 68, 42];
  const shade = 0.42 + 0.58 * light;
  // SVG 그라데이션의 하이라이트(cx .38, cy .32)와 같은 자리
  const gloss = Math.max(0, 1 - ((dx + 0.24) ** 2 + (dy + 0.36) ** 2) / 0.08) * 0.55;
  return [
    Math.round(Math.min(255, base[0] * shade + (255 - base[0] * shade) * gloss)),
    Math.round(Math.min(255, base[1] * shade + (255 - base[1] * shade) * gloss)),
    Math.round(Math.min(255, base[2] * shade + (255 - base[2] * shade) * gloss)),
  ];
}

function MagnifierScene() {
  const t = useSceneTime();
  const W = 1200;
  const H = 620;
  // 사과는 왼쪽 (중심 430,330 · 반지름 200) — 돋보기는 오른쪽 밖에서 사과 가장자리(빛 경계)로 온다
  const ax = 430;
  const ay = 330;
  const ar = 200;
  // 도착점은 사과 우상단 경계(중심에서 반지름 0.96) — 돋보기 창(사과 좌표 폭 0.14)에 사과 안팎이 반씩 든다
  const mx = interpolate(t, [0.4, 2.2], [1130, 566], easeInOut);
  const my = interpolate(t, [0.4, 2.2], [120, 194], easeInOut);
  const R = 150;
  const N = 4;   // 돋보기 안 4×4 픽셀 — 숫자가 읽히는 크기
  const zoom = 5.2;
  // 격자는 렌즈에 내접하는 정사각형 안에 둔다 — 모서리 셀의 숫자가 원 테두리에 잘리지 않게
  const G = (R - 8) * Math.SQRT2;
  // 돋보기가 보는 사과 좌표 (u,v) 창: 격자 폭 G를 zoom으로 나눈 만큼
  const cu = (mx - (ax - ar)) / (2 * ar);
  const cv = (my - (ay - ar)) / (2 * ar);
  const span = G / zoom / (2 * ar);
  const cells: { i: number; j: number; rgb: [number, number, number] }[] = [];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) cells.push({ i, j, rgb: appleRGB(cu - span / 2 + (i + 0.5) * (span / N), cv - span / 2 + (j + 0.5) * (span / N)) });
  const sample = cells[5];   // (1,1) 칸 — 카드에 「이 칸의 색」으로 크게 보여 준다
  const numbersAt = 2.5;
  const gridOn = interpolate(t, [2.0, 2.5], [0, 1]);
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', paddingTop: 'clamp(16px, 3.4vh, 36px)' }}>
        <div className="kicker" style={{ color: 'var(--primary)', ...riseIn(t, 0.05) }}>계단을 오르기 전에</div>
        <h2 className="display" style={{ margin: '10px auto 0', ...kw, ...riseIn(t, 0.2) }}>
          그림은 <span className="accent-text">숫자 격자</span>다
        </h2>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: `0 var(--gutter) ${DOCK_SAFE}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: 'min(1180px, 96vw)', maxHeight: '64vh', overflow: 'visible' }}>
          <defs>
            <clipPath id="ahd-lens">
              <circle cx={mx} cy={my} r={R - 6} />
            </clipPath>
            <radialGradient id="ahd-apple" cx="0.38" cy="0.32" r="0.8">
              <stop offset="0" stopColor="#ff9a86" />
              <stop offset="0.35" stopColor={C.red} />
              <stop offset="1" stopColor="#8f1c10" />
            </radialGradient>
          </defs>
          {/* 사과 (기하 도형) */}
          <g style={{ opacity: interpolate(t, [0.1, 0.7], [0, 1]) }}>
            <ellipse cx={ax} cy={ay + ar + 18} rx={ar * 0.85} ry={22} fill="rgba(23,32,42,.10)" />
            <circle cx={ax} cy={ay} r={ar} fill="url(#ahd-apple)" />
            <path d={`M${ax + 8} ${ay - ar + 6} q -4 -50 -10 -70`} stroke="#5a3a1a" strokeWidth={9} strokeLinecap="round" fill="none" />
            <ellipse cx={ax + 62} cy={ay - ar - 10} rx={52} ry={22} fill="#4a9a46" transform={`rotate(-28 ${ax + 62} ${ay - ar - 10})`} />
          </g>
          {/* 돋보기 안 — 픽셀 격자 (같은 appleRGB 함수) */}
          <g clipPath="url(#ahd-lens)" style={{ opacity: gridOn }}>
            <rect x={mx - R} y={my - R} width={2 * R} height={2 * R} fill="#eceff3" />
            {cells.map((c) => {
              const s = G / N;
              const x = mx - G / 2 + c.i * s;
              const y = my - G / 2 + c.j * s;
              const k = c.j * N + c.i;
              const on = interpolate(t, [numbersAt + k * 0.11, numbersAt + k * 0.11 + 0.35], [0, 1]);
              const [r, g, b] = c.rgb;
              const dark = (r + g + b) / 3 < 140;
              return (
                <g key={k}>
                  <rect x={x} y={y} width={s} height={s} fill={`rgb(${r},${g},${b})`} stroke={k === 5 ? C.red : 'rgba(23,32,42,.28)'} strokeWidth={k === 5 ? 3 : 1} />
                  <text x={x + s / 2} y={y + s / 2 - 12} textAnchor="middle" fill={dark ? '#fff' : C.ink} style={{ font: `800 12px ${mono}`, opacity: on }}>R {r}</text>
                  <text x={x + s / 2} y={y + s / 2 + 5} textAnchor="middle" fill={dark ? '#fff' : C.ink} style={{ font: `800 12px ${mono}`, opacity: on }}>G {g}</text>
                  <text x={x + s / 2} y={y + s / 2 + 22} textAnchor="middle" fill={dark ? '#fff' : C.ink} style={{ font: `800 12px ${mono}`, opacity: on }}>B {b}</text>
                </g>
              );
            })}
          </g>
          {/* 돋보기 테와 손잡이 */}
          <g style={{ opacity: interpolate(t, [0.3, 0.8], [0, 1]) }}>
            <line x1={mx + R * 0.72} y1={my + R * 0.72} x2={mx + R * 0.72 + 150} y2={my + R * 0.72 + 150} stroke={C.ink} strokeWidth={22} strokeLinecap="round" />
            <circle cx={mx} cy={my} r={R} fill="none" stroke={C.ink} strokeWidth={12} />
            <circle cx={mx} cy={my} r={R - 6} fill="none" stroke="rgba(255,255,255,.55)" strokeWidth={3} />
          </g>
          {/* 돋보기가 사과에 닿는 지점 표시 */}
          <circle cx={mx} cy={my} r={R / zoom} fill="none" stroke={C.red} strokeWidth={2} strokeDasharray="4 4" style={{ opacity: interpolate(t, [2.2, 2.6], [0, 0.9]) }} />
        </svg>
      </div>
      {/* 오른쪽 세로 밴드 — 카운터와 물음 (클릭 빌드는 t를 참조하지 않는다) */}
      <div style={{ position: 'absolute', right: 'var(--gutter)', top: '50%', transform: 'translateY(-50%)', width: 'min(320px, 28vw)', display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
        <Build at={1}>
          <div style={{ ...card, borderColor: 'color-mix(in srgb, var(--primary) 40%, transparent)' }}>
            <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 800, color: 'var(--fg-muted)' }}>8비트 RGB 그림에서 픽셀 하나 = R · G · B 값 셋 (0~255)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <span style={{ width: 34, height: 34, borderRadius: 6, border: `3px solid ${C.red}`, background: `rgb(${sample.rgb[0]},${sample.rgb[1]},${sample.rgb[2]})`, flexShrink: 0 }} />
              <span style={{ fontFamily: mono, fontWeight: 900, fontSize: 'clamp(14px, 1.6vw, 19px)', ...kw }}>이 칸의 색 = R {sample.rgb[0]} · G {sample.rgb[1]} · B {sample.rgb[2]}</span>
            </div>
            <div style={{ fontSize: 'clamp(12px, 1.3vw, 14px)', color: 'var(--fg-muted)', marginTop: 8, ...kw }}>돋보기 안은 그중 <b>4 × 4 = 16픽셀</b>을 확대한 것 · 전체 그림은 <b>48 × 48 = 2,304픽셀</b></div>
            <div style={{ fontFamily: mono, fontSize: 'clamp(18px, 2.3vw, 27px)', fontWeight: 900, marginTop: 6, ...kw }}>
              2,304 × 3 = <span style={{ color: C.red }}>6,912</span>개의 숫자
            </div>
            <div style={{ fontSize: 'clamp(12px, 1.3vw, 14px)', color: 'var(--fg-muted)', marginTop: 4, ...kw }}>그림 한 장을 만든다 = 숫자 6,912개를 정한다 (3D 모형과 같은 크기)</div>
          </div>
        </Build>
        <Build at={2}>
          <div style={{ ...card }}>
            <div style={{ fontWeight: 900, fontSize: 'clamp(16px, 2vw, 22px)', color: C.red, ...kw }}>
              어떤 숫자가 <u>그럴듯한</u> 숫자인가? → <span style={{ background: `color-mix(in srgb, ${C.red} 14%, transparent)`, padding: '0 6px', borderRadius: 4 }}>분포</span>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--fg-faint)', marginTop: 8, fontFamily: mono, ...kw }}>지난 시간: 말은 다음 토큰의 확률분포 · 오늘: 그림은 픽셀들 사이 관계까지 포함한 분포</div>
          </div>
        </Build>
      </div>
    </div>
  );
}

/* ── S6 — GAN 탁구 랠리 ─────────────────────────────────────────── */

const CARD_N = 8;
const CARD_NOISE = noiseArray(CARD_N * CARD_N * 3, 31);
/** 카드 안 6×6 격자 — 사과(빨간 원)와 노이즈를 amp로 섞는다 */
function cardCells(amp: number) {
  const out: string[] = [];
  for (let j = 0; j < CARD_N; j++)
    for (let i = 0; i < CARD_N; i++) {
      const dx = (i + 0.5) / CARD_N - 0.5;
      const dy = (j + 0.5) / CARD_N - 0.52;
      const inside = dx * dx + dy * dy < 0.125;
      const base = inside ? [232, 68, 42] : [236, 238, 241];
      const k = (j * CARD_N + i) * 3;
      const n = [CARD_NOISE[k], CARD_NOISE[k + 1], CARD_NOISE[k + 2]].map((v) => Math.round(60 + v * 180));
      out.push(`rgb(${Math.round(base[0] + (n[0] - base[0]) * amp)},${Math.round(base[1] + (n[1] - base[1]) * amp)},${Math.round(base[2] + (n[2] - base[2]) * amp)})`);
    }
  return out;
}

function RallyScene() {
  const t = useSceneTime();
  const P = 1.7;          // 랠리 한 번
  const RALLIES = 11;
  const k = Math.min(RALLIES, Math.floor(t / P));
  const phase = Math.min(1, (t - k * P) / P);
  const done = t >= RALLIES * P;
  const amp = Math.max(0, 1 - k / 9);
  const cells = cardCells(amp);
  // 카드 위치 — 왼쪽 상자(230) ↔ 오른쪽 상자(970), 포물선
  // 카드는 두 상자 사이 구간만 오간다 — 상자 이름을 덮지 않게
  const x0 = 350;
  const x1 = 850;
  let cx: number;
  let cy: number;
  if (done) {
    cx = 600;
    cy = 236;
  } else if (phase < 0.5) {
    const p = easeInOut(phase / 0.5);
    cx = x0 + (x1 - x0) * p;
    cy = 236 - 90 * Math.sin(Math.PI * p);
  } else {
    const p = easeInOut((phase - 0.5) / 0.5);
    cx = x1 + (x0 - x1) * p;
    cy = 236 - 90 * Math.sin(Math.PI * p);
  }
  // 판별자에 닿으면 그림은 그쪽에 남고 「FAKE 판정」 배지만 생성자에게 돌아온다 — 그림을 고쳐 돌려준다는 오해를 막는다
  const returning = !done && phase >= 0.5;
  const cardOn = done ? 1 : phase < 0.5 ? interpolate(phase, [0.44, 0.5], [1, 0]) : 0;
  const acc = interpolate(k, [0, 9], [100, 50]);
  const CW = 118;
  const box = (x: number, y: number, label: string, sub: string, tone: string, delay: number) => (
    <g style={{ opacity: interpolate(t, [delay, delay + 0.5], [0, 1]) }}>
      <rect x={x - 88} y={y - 62} width={176} height={124} rx={18} fill="var(--surface-2)" stroke={tone} strokeWidth={2.5} />
      {[0, 1, 2].map((r) => (
        <g key={r}>
          {[0, 1, 2, 3].map((c) => (
            <circle key={c} cx={x - 54 + c * 36} cy={y - 26 + r * 26} r={5} fill={`color-mix(in srgb, ${tone} ${35 + ((r * 4 + c) % 5) * 12}%, transparent)`} />
          ))}
        </g>
      ))}
      <text x={x} y={y + 46} textAnchor="middle" fill={C.ink} style={{ font: `800 15px var(--font-head)` }}>{label}</text>
      <text x={x} y={y + 84} textAnchor="middle" fill="var(--fg-faint)" style={{ font: `700 12px ${mono}` }}>{sub}</text>
    </g>
  );
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', paddingTop: 'clamp(16px, 3.2vh, 34px)' }}>
        <div className="kicker" style={{ color: 'var(--primary)', ...riseIn(t, 0.05) }}>첫 계단 · GAN (2014)</div>
        <h2 className="display" style={{ margin: '10px auto 0', ...kw, ...riseIn(t, 0.2) }}>
          속이는 쪽과 <span className="accent-text">가려내는 쪽</span>
        </h2>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: `0 var(--gutter) 0` }}>
        <svg viewBox="0 0 1200 460" style={{ width: 'min(1180px, 96vw)', maxHeight: '54vh', overflow: 'visible' }}>
          {/* 탁구대 — 평면 도형 */}
          <g style={{ opacity: interpolate(t, [0.1, 0.6], [0, 1]) }}>
            <rect x={150} y={322} width={900} height={14} rx={5} fill="#2c343d" />
            <rect x={150} y={336} width={900} height={6} fill="#1b2128" />
            <line x1={600} y1={262} x2={600} y2={318} stroke={C.ink} strokeWidth={4} />
            <line x1={580} y1={262} x2={620} y2={262} stroke={C.ink} strokeWidth={4} />
            {Array.from({ length: 7 }, (_, i) => (
              <line key={i} x1={600} y1={270 + i * 7} x2={600} y2={270 + i * 7} stroke="#fff" strokeWidth={2} />
            ))}
          </g>
          {box(230, 200, '생성자 (Generator)', '노이즈 벡터 → 그림', C.red, 0.4)}
          {box(970, 200, '판별자 (Discriminator)', '진짜 · 생성 → REAL / FAKE', C.blue, 0.6)}
          {/* 날아가는 캔버스 카드 */}
          <g transform={`translate(${cx - CW / 2} ${cy - CW / 2})`} style={{ opacity: interpolate(t, [0.9, 1.3], [0, 1]) * cardOn }}>
            <rect x={-6} y={-6} width={CW + 12} height={CW + 12} rx={10} fill="#fff" stroke={C.ink} strokeWidth={2} />
            {cells.map((fill, i) => (
              <rect key={i} x={(i % CARD_N) * (CW / CARD_N)} y={Math.floor(i / CARD_N) * (CW / CARD_N)} width={CW / CARD_N} height={CW / CARD_N} fill={fill} />
            ))}
            {done && (
              <g style={{ opacity: interpolate(t, [RALLIES * P, RALLIES * P + 0.6], [0, 1]) }}>
                <rect x={10} y={CW / 2 - 18} width={CW - 20} height={36} rx={5} fill="none" stroke={C.noise} strokeWidth={4} transform={`rotate(-14 ${CW / 2} ${CW / 2})`} />
                <text x={CW / 2} y={CW / 2 + 8} textAnchor="middle" fill={C.noise} style={{ font: `900 22px ${mono}`, letterSpacing: 2 }} transform={`rotate(-14 ${CW / 2} ${CW / 2})`}>?</text>
              </g>
            )}
          </g>
          {/* 돌아오는 것은 그림이 아니라 판정 배지 */}
          {returning && (
            <g transform={`translate(${cx} ${cy})`}>
              <rect x={-66} y={-20} width={132} height={40} rx={8} fill="#fff" stroke={C.blue} strokeWidth={3} />
              <text x={0} y={7} textAnchor="middle" fill={C.blue} style={{ font: `900 17px ${mono}`, letterSpacing: 1 }}>◀ FAKE 판정</text>
            </g>
          )}
          {/* 랠리 카운터 */}
          <text x={600} y={420} textAnchor="middle" fill="var(--fg-muted)" style={{ font: `700 15px ${mono}`, opacity: interpolate(t, [1, 1.5], [0, 1]) }}>
            랠리(학습 반복) {Math.min(RALLIES, k)}회 — 실제 학습은 이 갱신을 수없이 반복한다 · 판정을 받은 생성자는 다음 그림을 고친다
          </text>
          {/* 판별자가 맞힌 비율 게이지 — 좌상단 (생성자 위) */}
          <g style={{ opacity: interpolate(t, [1.2, 1.7], [0, 1]) }}>
            <text x={150} y={40} fill="var(--fg-muted)" style={{ font: `700 12.5px ${mono}` }}>판별자가 진짜·가짜를 맞힌 비율</text>
            <rect x={150} y={50} width={260} height={16} rx={8} fill="rgba(23,32,42,.10)" />
            <rect x={150} y={50} width={(260 * acc) / 100} height={16} rx={8} fill={acc > 60 ? C.blue : C.noise} />
            <line x1={280} y1={44} x2={280} y2={72} stroke={C.red} strokeWidth={2} strokeDasharray="3 3" />
            <text x={150} y={94} fill={acc > 60 ? C.blue : C.noise} style={{ font: `900 24px ${mono}` }}>{Math.round(acc)}%</text>
            <text x={232} y={92} fill={C.red} style={{ font: `700 11.5px ${mono}` }}>진짜·가짜를 반씩 낼 때 50% = 찍기 수준</text>
            <text x={150} y={112} fill="var(--fg-faint)" style={{ font: `600 10.5px ${mono}` }}>비율 숫자는 설명용 예시 — 실제 값은 모델·데이터마다 다르다</text>
          </g>
          {/* 진짜 사진도 판별자에게 들어간다 — 처음부터 보인다 (판별자 위) */}
          <line x1={970} y1={92} x2={970} y2={134} stroke={C.blue} strokeWidth={2.5} strokeDasharray="4 3" style={{ opacity: interpolate(t, [0.8, 1.3], [0, 1]) }} />
          <foreignObject x={740} y={14} width={330} height={78} style={{ opacity: interpolate(t, [0.8, 1.3], [0, 1]) }}>
            <div style={{ ...card, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, fontWeight: 700, borderColor: `color-mix(in srgb, ${C.blue} 45%, transparent)`, whiteSpace: 'nowrap' }}>
              <span style={{ width: 34, height: 34, borderRadius: 6, background: `radial-gradient(circle at 40% 35%, #ff9a86, ${C.red} 45%, #8f1c10)`, flexShrink: 0 }} />
              <span><b>진짜 사진</b>도 함께 들어간다 — 섞어 두고 가려낸다</span>
            </div>
          </foreignObject>
        </svg>
      </div>
      <div style={{ flex: 'none', textAlign: 'center', padding: `0 var(--gutter) ${DOCK_SAFE}` }}>
        <Build at={1}>
          <span style={{ ...card, display: 'inline-block', padding: '10px 22px', fontWeight: 800, fontSize: 'clamp(13px, 1.55vw, 16px)', ...kw }}>
            이론적으로 두 분포가 같아지면 최적 판별자도 구별하지 못한다 — 맞힌 비율 <span style={{ color: C.red }}>50%</span>는 그 지점의 표시이지, 50%만으로 학습이 끝났다고 판단하지는 않는다. 비율이 내려가는 것은 생성자가 그만큼 좋아졌다는 뜻이다
          </span>
        </Build>
      </div>
    </div>
  );
}

/* ── S6-A — GAN이라는 이름 세 낱말 ────────────────────────────────
   구도: 위에 영어 한 줄을 두고 클릭마다 왼쪽부터 한 낱말씩 짚는다(밑줄).
   아래로는 머리글자가 왼쪽 세로열에 하나씩 쌓여 G·A·N이 조립된다 —
   균등 카드 그리드가 아니라 사전 표제어의 뜻풀이 행. */
const GAN_TERMS = [
  {
    ini: 'G',
    en: 'Generative',
    ko: '생성적',
    lead: '가려내는 일이 아니라 만들어 내는 일',
    body: '고양이인지 아닌지 맞히는 모델은 주어진 것을 분류한다. 생성 모델은 없던 그림을 새로 내놓는다 — 이름이 가리키는 목적은 그림을 만드는 쪽이다.',
  },
  {
    ini: 'A',
    en: 'Adversarial',
    ko: '적대적',
    lead: '두 신경망의 목표가 정반대다',
    body: '생성자는 판별자를 속이려 하고, 판별자는 속지 않으려 한다. 한쪽이 잘할수록 다른 쪽의 성적이 나빠진다 — 방금 본 랠리가 이 한 낱말이다.',
  },
  {
    ini: 'N',
    en: 'Network',
    ko: '신경망',
    lead: '기준을 적어 준 것이 아니라 배운 것이다',
    body: '생성자도 판별자도 신경망이다. "손가락은 다섯 개" 같은 기준을 사람이 넣어 준 것이 아니라, 판정의 오차를 줄이며 스스로 기준을 만든다.',
  },
];

function GanNameFigure() {
  const { clicks } = useDeckClicks();
  return (
    <div style={{ width: 'min(1120px, 100%)', marginInline: 'auto' }}>
      {/* 표제어 한 줄 — 짚은 낱말만 또렷해지고 밑줄이 그어진다 */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          columnGap: 'clamp(12px, 1.8vw, 26px)',
          rowGap: 4,
          marginTop: 'clamp(8px, 1.3vh, 16px)',
        }}
      >
        {GAN_TERMS.map((w, i) => {
          const on = clicks >= i + 1;
          return (
            <span
              key={w.en}
              style={{
                fontFamily: mono,
                fontWeight: 900,
                fontSize: 'clamp(19px, 3vw, 40px)',
                letterSpacing: '-0.01em',
                color: on ? C.red : 'var(--fg-muted)',
                borderBottom: `4px solid ${on ? C.red : 'var(--hair-2)'}`,
                paddingBottom: 3,
                transition: 'color .4s var(--ease), border-color .4s var(--ease)',
              }}
            >
              {w.en}
            </span>
          );
        })}
      </div>

      {/* 뜻풀이 행 — 왼쪽 세로열에 머리글자가 쌓인다 */}
      <div style={{ marginTop: 'clamp(8px, 1.5vh, 18px)', borderTop: '1px solid var(--hair)' }}>
        {GAN_TERMS.map((w, i) => (
          <Build key={w.ini} at={i + 1}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'clamp(10px, 1.8vw, 26px)',
                padding: 'clamp(6px, 1.0vh, 13px) 0',
                borderBottom: '1px solid var(--hair)',
              }}
            >
              <span
                style={{
                  flex: 'none',
                  width: 'clamp(34px, 4.8vw, 62px)',
                  textAlign: 'center',
                  fontFamily: mono,
                  fontWeight: 900,
                  fontSize: 'clamp(32px, 4.6vw, 58px)',
                  lineHeight: 0.92,
                  color: C.red,
                }}
              >
                {w.ini}
              </span>
              <div style={{ flex: 'none', width: 'clamp(96px, 13vw, 168px)' }}>
                <div style={{ fontFamily: mono, fontSize: 'clamp(11px, 1.2vw, 13px)', fontWeight: 800, color: 'var(--fg-faint)' }}>{w.en}</div>
                <div style={{ fontWeight: 900, fontSize: 'clamp(15px, 1.9vw, 21px)', ...kw }}>{w.ko}</div>
              </div>
              <div style={{ flex: '1 1 0', minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 'clamp(13px, 1.55vw, 16.5px)', ...kw }}>{w.lead}</div>
                <div style={{ marginTop: 3, fontSize: 'clamp(11.5px, 1.3vw, 14px)', color: 'var(--fg-muted)', lineHeight: 1.55, ...kw }}>{w.body}</div>
              </div>
            </div>
          </Build>
        ))}
      </div>

      <Build at={4}>
        <div
          style={{
            ...card,
            marginTop: 'clamp(7px, 1.2vh, 15px)',
            padding: 'clamp(10px, 1.3vw, 15px) clamp(12px, 1.6vw, 20px)',
            borderColor: `color-mix(in srgb, ${C.red} 50%, transparent)`,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'baseline',
            gap: '4px 14px',
          }}
        >
          <span style={{ fontFamily: mono, fontWeight: 900, fontSize: 'clamp(19px, 2.5vw, 29px)', color: C.red, letterSpacing: 2 }}>GAN</span>
          <span style={{ fontWeight: 900, fontSize: 'clamp(14.5px, 1.85vw, 20px)', ...kw }}>= 생성적 적대 신경망</span>
          <span style={{ fontSize: 'clamp(11.5px, 1.25vw, 13.5px)', color: 'var(--fg-muted)', ...kw }}>
            Goodfellow 외, 2014 — 원 논문 제목은 「Generative Adversarial Nets」이고 지금은 Network(s)로 널리 쓴다
          </span>
          <div style={{ flexBasis: '100%', marginTop: 5, fontWeight: 700, fontSize: 'clamp(12.5px, 1.45vw, 15.5px)', lineHeight: 1.55, ...kw }}>
            이름에 <b style={{ color: C.blue }}>판별자</b>는 없다 — 판별자는 생성자를 가르치기 위해 둔 장치이고, 학습이 끝나면 그림을 만드는 것은 <b style={{ color: C.red }}>생성자</b>뿐이다
          </div>
        </div>
      </Build>
    </div>
  );
}

/* ── S8 — 잉크 한 방울: 정과정(퍼짐) → 역과정(되돌림) ──────────────
   입자 위치는 t의 순수 함수 — 확산은 √t에 비례해 퍼지고(브라운 운동의 rms),
   7초 뒤 같은 함수를 거꾸로 돌려 되돌아온다. 클릭 빌드는 캡션만 맡는다. */
const INK_N = 420;
const INK = (() => {
  const rng = mulberry32(88);
  return Array.from({ length: INK_N }, () => {
    const a = rng() * Math.PI * 2;
    const r = Math.sqrt(rng());
    return { a, r, w: 0.6 + rng() * 1.2, p: rng() * Math.PI * 2 };
  });
})();
const GRID8 = noiseArray(64 * 3, 12);
const SPREAD_T = 6;
const HOLD_T = 2;   // 최대 확산 상태에서 멈춰 「실제 잉크는 저절로 모이지 않는다」를 읽을 시간

function inkPhase(t: number) {
  // 0 → 1 (퍼짐) · 정지 · 1 → 0 (되돌림)
  if (t < SPREAD_T) return { s: t / SPREAD_T, reverse: false };
  if (t < SPREAD_T + HOLD_T) return { s: 1, reverse: false };
  return { s: Math.max(0, 1 - (t - SPREAD_T - HOLD_T) / SPREAD_T), reverse: true };
}

function InkScene() {
  const t = useSceneTime();
  const { s, reverse } = inkPhase(t);
  const holding = t >= SPREAD_T && t < SPREAD_T + HOLD_T;
  const ref = useCanvas((ctx, w, h) => {
    const cx = w * 0.5;
    const cy = h * 0.52;
    // 컵 단면 전체(가로로 긴 타원)로 퍼진다 — 완료 상태에 초기 원형 윤곽이 남지 않게
    const Rx = w * 0.46;
    const Ry = h * 0.42;
    const spread = Math.sqrt(s);
    for (const p of INK) {
      const rr = p.r * spread;
      const x = cx + Math.cos(p.a + p.p * 0.02 * spread) * rr * Rx;
      const y = cy + Math.sin(p.a + p.p * 0.02 * spread) * rr * Ry;
      const size = 3.2 + (1 - spread) * 2.2 * p.w;
      ctx.fillStyle = `rgba(232,68,42,${(0.85 - 0.45 * spread).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [s]);
  const label = reverse ? '← 역과정 (reverse process · 노이즈 제거 denoising) · 시연 — 기록해 둔 노이즈를 거꾸로 되짚는다' : '정과정 (forward process) → 잉크 대신 무작위 노이즈가 더해진다';
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', paddingTop: 'clamp(16px, 3.2vh, 34px)' }}>
        <div className="kicker" style={{ color: 'var(--primary)', ...riseIn(t, 0.05) }}>둘째 계단 · 확산 모델 (2020)</div>
        <h2 className="headline" style={{ margin: '10px auto 0', ...kw, ...riseIn(t, 0.2) }}>
          <span style={{ display: 'inline-block' }}>퍼지는 건 쉽고,</span>{' '}
          <span style={{ display: 'inline-block' }}><span className="accent-text">되돌리는</span> 건 어렵다</span>
        </h2>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'stretch', justifyContent: 'center', gap: 'clamp(16px, 2.4vw, 36px)', padding: `1vh var(--gutter) 0`, width: 'min(1180px, 96vw)', marginInline: 'auto' }}>
        {/* 물컵 단면 — 왼쪽 2/3 */}
        <div style={{ flex: '2 1 0', minWidth: 0, position: 'relative', borderRadius: '18px 18px 42px 42px', borderLeft: `4px ${reverse ? 'dashed' : 'solid'} ${reverse ? C.red : C.ink}`, borderRight: `4px ${reverse ? 'dashed' : 'solid'} ${reverse ? C.red : C.ink}`, borderBottom: `4px ${reverse ? 'dashed' : 'solid'} ${reverse ? C.red : C.ink}`, background: 'linear-gradient(180deg, rgba(43,125,233,.05), rgba(43,125,233,.16))', ...riseIn(t, 0.3) }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 10, height: 3, background: `color-mix(in srgb, ${C.blue} 45%, transparent)` }} />
          <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden />
          <div style={{ position: 'absolute', left: 14, top: 18, fontFamily: mono, fontSize: 12.5, fontWeight: 800, color: 'var(--fg-muted)' }}>잉크의 확산 (diffusion)</div>
          <div style={{ position: 'absolute', left: 14, right: 14, bottom: 12, fontFamily: mono, fontSize: 'clamp(12px, 1.3vw, 14.5px)', fontWeight: 800, color: reverse ? C.red : 'var(--fg-muted)', ...kw }}>{label}</div>
          {/* 최대 확산 상태에서 멈춘 2초 — 물리 현상과 계산 시연의 경계를 긋는다 */}
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 'min(520px, 88%)', ...card, padding: '14px 20px', textAlign: 'center', borderColor: `color-mix(in srgb, ${C.red} 50%, transparent)`, opacity: holding ? interpolate(t, [SPREAD_T, SPREAD_T + 0.4], [0, 1]) : reverse ? interpolate(t, [SPREAD_T + HOLD_T, SPREAD_T + HOLD_T + 0.5], [1, 0]) : 0, pointerEvents: 'none' }}>
            <div style={{ fontWeight: 900, fontSize: 'clamp(15px, 1.8vw, 20px)', color: C.red, ...kw }}>실제 잉크는 저절로 모이지 않는다</div>
            <div style={{ fontSize: 'clamp(12px, 1.35vw, 14.5px)', color: 'var(--fg-muted)', marginTop: 4, ...kw }}>지금부터는 기록해 둔 노이즈를 거꾸로 되짚는 <b>계산의 시연</b>이다 — 빨간 점선 테두리가 그 표시</div>
          </div>
        </div>
        {/* 같은 t로 진행되는 8×8 픽셀 격자 — 오른쪽 1/3 */}
        <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, ...riseIn(t, 0.5) }}>
          <svg viewBox="0 0 160 160" style={{ width: 'min(100%, 34vh)', aspectRatio: '1', border: `2px solid ${C.ink}`, borderRadius: 8, background: '#fff' }}>
            {Array.from({ length: 64 }, (_, i) => {
              const u = (i % 8 + 0.5) / 8;
              const v = (Math.floor(i / 8) + 0.5) / 8;
              const dx = u - 0.5;
              const dy = v - 0.55;
              const inside = dx * dx + dy * dy < 0.1;
              const base = inside ? [232, 68, 42] : [238, 240, 243];
              const n = [GRID8[i * 3], GRID8[i * 3 + 1], GRID8[i * 3 + 2]].map((x) => Math.round(50 + x * 190));
              const a = s;
              const fill = `rgb(${Math.round(base[0] + (n[0] - base[0]) * a)},${Math.round(base[1] + (n[1] - base[1]) * a)},${Math.round(base[2] + (n[2] - base[2]) * a)})`;
              return <rect key={i} x={(i % 8) * 20} y={Math.floor(i / 8) * 20} width={20} height={20} fill={fill} />;
            })}
          </svg>
          <div style={{ fontFamily: mono, fontSize: 12.5, fontWeight: 800, color: reverse ? C.red : 'var(--fg-muted)', textAlign: 'center', ...kw }}>
            {reverse ? '예측한 노이즈를 한 겹씩 뺀다' : '가우시안 노이즈를 한 겹씩 더한다'} — 단계 {Math.round(s * 50)} / 50
          </div>
          <div style={{ fontSize: 'clamp(11px, 1.2vw, 13px)', color: 'var(--fg-faint)', textAlign: 'center', ...kw }}>
            학습은 이렇게 원래 그림을 되짚어 배우고, 생성은 <b>새 노이즈</b>에서 출발한다 (다음 장 ④)
          </div>
        </div>
      </div>
      <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: `1.2vh var(--gutter) ${DOCK_SAFE}` }}>
        <Build at={1}>
          <span style={{ ...card, display: 'inline-block', padding: '9px 20px', fontWeight: 800, fontSize: 'clamp(13px, 1.5vw, 16px)', color: C.red, ...kw }}>
            되돌릴 수 있을까? — 퍼진 잉크는 저절로 모이지 않는다
          </span>
        </Build>
        <Build at={2}>
          <span style={{ ...card, display: 'inline-block', padding: '9px 20px', fontWeight: 700, fontSize: 'clamp(13px, 1.5vw, 15.5px)', ...kw }}>
            그러나 <b style={{ color: C.red }}>어떤 노이즈가 섞였는지</b>를 예측할 수 있다면, 그 예측으로 한 단계씩 되짚을 수 있다 — 확산 모델은 노이즈를 예측하는 신경망(노이즈 예측 신경망)으로 그림을 만드는 생성 모델이다
          </span>
        </Build>
      </div>
    </div>
  );
}

/* ── S8-A — 확산이라는 이름 ────────────────────────────────────────
   구도: 위에서부터 표제어 띠(큰 낱말이 왼쪽을 지배) → 뜻 두 갈래 →
   반전 밴드 → DDPM 네 글자 가로 띠. S6-A(세로 머리글자 쌓기)와 축을
   달리해 두 「이름」 장이 같은 구도로 읽히지 않게 한다. */
const DIFFUSION_SENSES = [
  {
    n: '①',
    where: '과학에서',
    t: '입자가 저절로 퍼지는 현상',
    b: '농도가 높은 쪽에서 낮은 쪽으로 입자가 퍼진다 — 물에 떨어진 잉크, 방에 번지는 향수. 저절로 되돌아오지는 않는다.',
  },
  {
    n: '②',
    where: '이 수업에서',
    t: '그림이 노이즈로 흐트러지는 정과정',
    b: '그림에 가우시안 노이즈를 조금씩 더해 완전한 노이즈(t=50)로 만든다. 잉크가 퍼지는 것과 같은 방향이고, 정해 둔 노이즈 스케줄대로 계산하면 된다.',
  },
];

const DDPM_LETTERS = [
  { c: 'D', en: 'Denoising', ko: '노이즈 지우기', hot: true },
  { c: 'D', en: 'Diffusion', ko: '확산', hot: false },
  { c: 'P', en: 'Probabilistic', ko: '확률적', hot: false },
  { c: 'M', en: 'Models', ko: '모형', hot: false },
];

function DiffusionNameFigure() {
  return (
    <div style={{ width: 'min(1160px, 100%)', marginInline: 'auto' }}>
      {/* 표제어 띠 — 큰 낱말이 왼쪽을 지배하고 뜻풀이가 오른쪽으로 흐른다 */}
      <div
        style={{
          ...card,
          padding: 'clamp(10px, 1.3vw, 16px) clamp(13px, 1.7vw, 22px)',
          marginTop: 'clamp(8px, 1.5vh, 18px)',
          borderColor: `color-mix(in srgb, ${C.red} 45%, transparent)`,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          gap: '4px clamp(14px, 2vw, 28px)',
        }}
      >
        <span style={{ fontWeight: 900, fontSize: 'clamp(28px, 4.2vw, 48px)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>확산</span>
        <span style={{ fontFamily: mono, fontWeight: 800, fontSize: 'clamp(14px, 1.8vw, 21px)', color: C.red }}>diffusion</span>
        <span style={{ flex: '1 1 min(300px, 100%)', minWidth: 0, fontSize: 'clamp(11.5px, 1.3vw, 14px)', color: 'var(--fg-muted)', lineHeight: 1.55, ...kw }}>
          라틴어 <b>dis-</b>(사방으로) + <b>fundere</b>(붓다) — 「사방으로 부어 퍼뜨리다」. AI가 지어낸 말이 아니라 과학 시간에 쓰던 낱말을 그대로 빌려 왔다.
        </span>
      </div>

      {/* 뜻 두 갈래 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(9px, 1.4vw, 16px)', marginTop: 'clamp(8px, 1.4vh, 16px)' }}>
        {DIFFUSION_SENSES.map((x, i) => (
          <Build key={x.n} at={i + 1} style={{ flex: '1 1 min(300px, 100%)', minWidth: 0 }}>
            <div style={{ ...card, height: '100%', padding: 'clamp(10px, 1.2vw, 14px) clamp(11px, 1.4vw, 17px)', display: 'flex', gap: 11, alignItems: 'flex-start' }}>
              <span style={{ fontFamily: mono, fontWeight: 900, fontSize: 'clamp(16px, 1.9vw, 22px)', color: C.red, lineHeight: 1.15 }}>{x.n}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: mono, fontSize: 'clamp(10.5px, 1.15vw, 12.5px)', fontWeight: 800, color: 'var(--fg-faint)' }}>{x.where}</div>
                <div style={{ fontWeight: 900, fontSize: 'clamp(14px, 1.65vw, 17.5px)', marginTop: 1, ...kw }}>{x.t}</div>
                <div style={{ marginTop: 3, fontSize: 'clamp(11px, 1.22vw, 13.5px)', color: 'var(--fg-muted)', lineHeight: 1.5, ...kw }}>{x.b}</div>
              </div>
            </div>
          </Build>
        ))}
      </div>

      {/* 반전 — 이름의 방향과 학습의 방향이 반대다 */}
      <Build at={3}>
        <div
          style={{
            ...card,
            marginTop: 'clamp(8px, 1.4vh, 16px)',
            padding: 'clamp(10px, 1.3vw, 15px) clamp(12px, 1.6vw, 20px)',
            borderColor: `color-mix(in srgb, ${C.red} 55%, transparent)`,
            background: `color-mix(in srgb, ${C.red} 6%, var(--surface-2))`,
          }}
        >
          <div style={{ fontFamily: mono, fontSize: 'clamp(10.5px, 1.15vw, 12.5px)', fontWeight: 800, color: C.red }}>그래서 이름이 뒤집혀 있다</div>
          <div style={{ marginTop: 3, fontWeight: 800, fontSize: 'clamp(14px, 1.75vw, 19px)', ...kw }}>
            이름은 <b style={{ color: C.red }}>퍼지는 쪽</b>에서 왔지만, 모델이 배우는 것은 <b style={{ color: C.red }}>퍼진 것을 되짚는 쪽</b>이다
          </div>
          <div style={{ marginTop: 4, fontSize: 'clamp(11px, 1.25vw, 14px)', color: 'var(--fg-muted)', lineHeight: 1.5, ...kw }}>
            정과정에는 학습이 없다 — 노이즈 스케줄은 미리 정해 둔 표다. 학습은 전부 역과정 쪽 「쓰인 노이즈 맞히기」에 있고, 확산은 <b>배울 문제를 만들어 주는 과정</b>이다.
          </div>
        </div>
      </Build>

      {/* DDPM 네 글자 — 머리글 한 줄 + 가로 띠, 맨 앞 한 칸만 넓고 붉다 */}
      <Build at={4}>
        <div style={{ marginTop: 'clamp(7px, 1.2vh, 14px)' }}>
          <div style={{ fontSize: 'clamp(10.5px, 1.2vw, 13px)', color: 'var(--fg-muted)', marginBottom: 4, ...kw }}>
            <b style={{ fontFamily: mono, color: C.red, letterSpacing: 1 }}>DDPM</b> — 2015년 첫 제안(제목에 「비평형 열역학」)을 이어 지금 형태를 세운 2020년 「Denoising Diffusion Probabilistic Models」(Ho 외)의 네 글자. 실제로 하는 일은 맨 앞 <b style={{ color: C.red }}>Denoising</b>이다
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'stretch' }}>
            {DDPM_LETTERS.map((x, i) => (
              <div
                key={i}
                style={{
                  ...card,
                  flex: x.hot ? '1.7 1 160px' : '1 1 116px',
                  minWidth: 0,
                  padding: '7px 12px',
                  borderColor: x.hot ? `color-mix(in srgb, ${C.red} 55%, transparent)` : 'var(--hair)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                  <span style={{ fontFamily: mono, fontWeight: 900, fontSize: 'clamp(16px, 1.95vw, 23px)', color: x.hot ? C.red : 'var(--fg-faint)' }}>{x.c}</span>
                  <span style={{ fontFamily: mono, fontSize: 'clamp(10.5px, 1.15vw, 12.5px)', fontWeight: 800, color: 'var(--fg-muted)' }}>{x.en}</span>
                </div>
                <div style={{ marginTop: 1, fontWeight: 800, fontSize: 'clamp(11.5px, 1.3vw, 14px)', ...kw }}>{x.ko}</div>
              </div>
            ))}
          </div>
        </div>
      </Build>
    </div>
  );
}

/* ── S3 · S15 — 두 계단 지도 (S3는 빌드로 쌓고, S15는 완성형) ────────── */

/* 계단 도형(SVG)은 클릭 수로 opacity를 켜고, 라벨(HTML)은 Build로 등장한다 — SVG 안에 div를 넣지 않는다 */
function useDeckClicks() {
  const { clicks, isStatic } = useDeck();
  return { clicks: isStatic ? 99 : clicks };
}

function Staircase({ complete = false }: { complete?: boolean }) {
  const { clicks } = useDeckClicks();
  const fade = (n: number): CSSProperties => ({ opacity: complete || clicks >= n ? 1 : 0, transition: 'opacity .45s var(--ease)' });
  /* Build(motion.div)는 will-change 때문에 containing block이 되어 안쪽 absolute의 top%가 어긋난다 — 위치는 Build 자체에 준다 */
  const place = (at: number, pos: CSSProperties, node: ReactNode) =>
    complete ? <div style={{ position: 'absolute', ...pos }}>{node}</div> : <Build at={at} style={{ position: 'absolute', ...pos }}>{node}</Build>;
  const fs = (px: number) => `clamp(${Math.round(px * 0.62)}px, ${(px / 11).toFixed(2)}vw, ${px}px)`;
  return (
    <div style={{ position: 'relative', width: 'min(1100px, 92vw, 152vh)', aspectRatio: '1100 / 420' }}>
      <svg viewBox="0 0 1100 420" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
        <line x1={40} y1={392} x2={1060} y2={392} stroke="var(--hair)" strokeWidth={2} />
        <path d="M60 392 V300 H420" fill="none" stroke={C.ink} strokeWidth={5} strokeLinejoin="round" style={fade(1)} />
        <path d="M420 300 V180 H780" fill="none" stroke={C.ink} strokeWidth={5} strokeLinejoin="round" style={fade(2)} />
        <path d="M780 180 V80 H1060" fill="none" stroke="var(--fg-faint)" strokeWidth={3} strokeDasharray="10 9" strokeLinejoin="round" style={fade(4)} />
        <g style={fade(3)}>
          <line x1={530} y1={180} x2={530} y2={146} stroke={C.red} strokeWidth={3} />
          <circle cx={530} cy={140} r={9} fill={C.red} />
          <text x={546} y={145} fill={C.red} style={{ font: `800 15px var(--font-head)` }}>{complete ? 'Krea Realtime · 3D 모형' : '오늘 실습 · Krea Realtime'}</text>
        </g>
      </svg>
      {place(1, { left: '6.5%', top: '73%', width: '31%' }, (
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontFamily: mono, fontSize: fs(12.5), fontWeight: 800, color: C.red }}>① GAN(생성적 적대 신경망) · 2014</div>
          <div style={{ fontWeight: 800, fontSize: fs(19), ...kw }}>판별자를 속이는 법을 배운다</div>
          {complete && <div style={{ fontSize: fs(13), color: 'var(--fg-muted)', marginTop: 2, ...kw }}>학습: 판별자의 평가로 생성자를 개선 · 생성: 생성자만 한 번 통과</div>}
        </div>
      ))}
      {place(2, { left: '39.3%', top: '44%', width: '32%' }, (
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontFamily: mono, fontSize: fs(12.5), fontWeight: 800, color: C.red }}>② 확산 모델 · 2015 제안 → 2020 DDPM</div>
          <div style={{ fontWeight: 800, fontSize: fs(19), ...kw }}>노이즈를 걷어내는 법을 배운다</div>
          {complete && <div style={{ fontSize: fs(13), color: 'var(--fg-muted)', marginTop: 2, ...kw }}>학습: 쓰인 노이즈를 예측하도록 훈련 · 생성: 예측으로 단계적 갱신 — 조건 부여 · 시드 · 증류</div>}
        </div>
      ))}
      {place(4, { left: '72%', top: '21%', width: '25%', opacity: 0.85 }, (
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontFamily: mono, fontSize: fs(12.5), fontWeight: 800, color: 'var(--fg-faint)' }}>③ 다음 수업</div>
          <div style={{ fontWeight: 800, fontSize: fs(17), color: 'var(--fg-muted)', ...kw }}>트랜스포머 — 두 방식 안에서도 쓰이는 구조, 영상·소리로</div>
        </div>
      ))}
      {complete && (
        <div style={{ position: 'absolute', left: '6.5%', top: '12%', width: '30%', textAlign: 'left' }}>
          <div style={{ fontFamily: mono, fontSize: fs(12), fontWeight: 800, color: C.red }}>오늘 만진 입력·설정(손잡이)</div>
          <div style={{ fontSize: fs(14), marginTop: 2, ...kw }}><b>3D 모형</b> — 단계 t · 시드 · 프롬프트</div>
          <div style={{ fontSize: fs(14), ...kw }}><b>Krea Realtime</b> — 프롬프트 · 스케치 · 강도 · 시드</div>
        </div>
      )}
    </div>
  );
}

/* ── S9 — 확산 모델 네 단계 (사각 링) ───────────────────────────── */

function RingFigure() {
  const items = [
    { n: '①', title: '정과정', body: '단계마다 기존 신호를 조금 줄이고 노이즈 스케줄에 따른 가우시안 노이즈를 더한다 (t=0 그림 → t=50 노이즈 · 50은 교육용 축소, 원 DDPM은 1,000단계)', x: 0, y: 0 },
    { n: '②', title: '학습', body: '임의의 단계 t를 골라 노이즈 낀 그림을 만들고, 그때 쓴 노이즈 ε을 맞히도록 노이즈 예측 신경망을 훈련한다', x: 1, y: 0 },
    { n: '③', title: '생성 (역과정)', body: '표준정규 노이즈에서 출발해, 예측한 노이즈로 다음 단계의 덜 시끄러운 상태를 계산하며 t=50 → 0으로 내려온다', x: 1, y: 1 },
    { n: '④', title: '시드', body: '시드(seed)가 출발 노이즈 등 생성에 쓰는 난수를 정한다 — 시드를 바꾸면 보통 다른 그림이 나온다', x: 0, y: 1 },
  ];
  return (
    <div style={{ position: 'relative', width: 'min(1080px, 94vw)', marginInline: 'auto', display: 'grid', gridTemplateColumns: '1fr auto 1fr', gridTemplateRows: 'auto auto', gap: 'clamp(12px, 1.8vh, 20px) clamp(14px, 2vw, 26px)', alignItems: 'stretch' }}>
      {items.map((it, i) => (
        <div key={it.n} style={{ gridColumn: it.x === 0 ? 1 : 3, gridRow: it.y + 1 }}>
          <Build at={i + 1}>
            <div style={{ ...card, height: '100%', borderColor: i === 3 ? `color-mix(in srgb, ${C.red} 45%, transparent)` : 'var(--hair)', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontFamily: mono, fontWeight: 900, fontSize: 20, color: C.red }}>{it.n}</span>
                <span style={{ fontWeight: 900, fontSize: 'clamp(15px, 1.8vw, 19px)', ...kw }}>{it.title}</span>
              </div>
              <div style={{ marginTop: 6, fontSize: 'clamp(12.5px, 1.4vw, 15px)', color: 'var(--fg-muted)', lineHeight: 1.55, ...kw }}>{it.body}</div>
              {i === 3 && (
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  {[42, 7].map((seed) => {
                    const nz = noiseArray(36, seed);
                    return (
                      <div key={seed} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg viewBox="0 0 60 60" width={44} height={44} style={{ borderRadius: 6, border: '1px solid var(--hair)' }}>
                          {Array.from({ length: 36 }, (_, k) => {
                            const g = Math.round(80 + nz[k] * 160);
                            return <rect key={k} x={(k % 6) * 10} y={Math.floor(k / 6) * 10} width={10} height={10} fill={`rgb(${g},${g},${g})`} />;
                          })}
                        </svg>
                        <span style={{ fontFamily: mono, fontSize: 11, color: 'var(--fg-faint)' }}>→</span>
                        <svg viewBox="0 0 60 60" width={44} height={44} style={{ borderRadius: 6, border: '1px solid var(--hair)', background: '#f6f7f9' }}>
                          <circle cx={seed === 42 ? 28 : 33} cy={seed === 42 ? 32 : 29} r={seed === 42 ? 17 : 14} fill={C.red} />
                          <ellipse cx={seed === 42 ? 34 : 39} cy={seed === 42 ? 13 : 13} rx={7} ry={3.5} fill="#4a9a46" transform={`rotate(-30 ${seed === 42 ? 34 : 39} 13)`} />
                        </svg>
                        <span style={{ fontFamily: mono, fontSize: 11, color: 'var(--fg-muted)' }}>시드 {seed}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Build>
        </div>
      ))}
      {/* 중앙 t 게이지 — 50 → 0 */}
      <div style={{ gridColumn: 2, gridRow: '1 / span 2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, minWidth: 74 }}>
        <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 800, color: 'var(--fg-faint)' }}>t = 50</span>
        <div style={{ width: 14, flex: '1 1 120px', minHeight: 120, borderRadius: 8, background: `linear-gradient(180deg, ${C.noise}, #eceff3 55%, ${C.red})`, border: '1px solid var(--hair)' }} />
        <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 800, color: C.red }}>t = 0</span>
      </div>
    </div>
  );
}

/* ── S11 — 조건 부여 · 잠재 공간 · 증류 도해 ─────────────────────── */

const LATENT_NOISE = noiseArray(100, 5);
function ConditionFigure() {
  const promptWords = ['a', 'red', 'apple', 'on', 'a', 'wooden', 'table'];
  return (
    <div style={{ width: 'min(1160px, 96vw)', marginInline: 'auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1fr)', gap: 'clamp(14px, 2.4vw, 34px)', alignItems: 'start', textAlign: 'left' }}>
      {/* 왼쪽 — 프롬프트 타이포 · 인코더 · 스케치 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontFamily: mono, fontWeight: 900, fontSize: 'clamp(20px, 2.8vw, 34px)', lineHeight: 1.2, ...kw }}>
          {promptWords.map((w, i) => (
            <span key={i} style={{ color: w === 'apple' ? C.red : 'var(--fg)', marginRight: '0.3em' }}>{w}</span>
          ))}
        </div>
        <Build at={1}>
          <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 800, padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${C.blue}`, color: C.blue, whiteSpace: 'nowrap' }}>텍스트 인코더</div>
            <span style={{ color: 'var(--fg-faint)' }}>→</span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 44 }}>
              {[0.6, 0.2, 0.9, 0.4, 0.75, 0.3, 0.55, 0.85].map((h, i) => (
                <div key={i} style={{ width: 14, height: `${h * 100}%`, background: C.blue, borderRadius: 3, opacity: 0.75 }} />
              ))}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', ...kw }}>① 텍스트 조건 — 문장이 숫자 벡터가 된다</div>
          </div>
        </Build>
        <Build at={2}>
          <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 16 }}>
            <svg viewBox="0 0 90 90" width={80} height={80} style={{ background: '#fff', borderRadius: 8, border: '1px solid var(--hair)', flexShrink: 0 }}>
              <circle cx={45} cy={48} r={24} fill="none" stroke={C.red} strokeWidth={5} strokeLinecap="round" strokeDasharray="120 40" />
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', ...kw }}>② 이미지 조건 — 스케치에 노이즈를 <b>얼마나</b> 더한 뒤 되돌리느냐 = <b style={{ color: C.red }}>강도(strength)</b></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <span style={{ fontFamily: mono, fontSize: 11, color: 'var(--fg-faint)' }}>t=0</span>
                <div style={{ flex: 1, height: 10, borderRadius: 5, background: `linear-gradient(90deg, ${C.red}, ${C.noise})`, position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '35%', top: -5, width: 20, height: 20, borderRadius: '50%', background: '#fff', border: `3px solid ${C.ink}` }} />
                  <span style={{ position: 'absolute', left: '82%', top: -5, width: 20, height: 20, borderRadius: '50%', background: '#fff', border: `3px solid ${C.ink}`, opacity: 0.45 }} />
                </div>
                <span style={{ fontFamily: mono, fontSize: 11, color: 'var(--fg-faint)' }}>t=50</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--fg-faint)', marginTop: 4, ...kw }}>낮을수록 입력을 더 유지하고, 높을수록 더 크게 바꾸는 경향 — 실습의 AI Strength가 이런 효과를 낸다 (내부 값이 같다는 뜻은 아니다)</div>
            </div>
          </div>
        </Build>
      </div>
      {/* 오른쪽 — 노이즈 격자 → 어텐션 선 → 잠재 축소 → 증류 눈금 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ position: 'relative' }}>
          <svg viewBox="0 0 300 218" style={{ width: '100%', maxHeight: '32vh' }}>
            {Array.from({ length: 100 }, (_, i) => {
              const g = Math.round(90 + LATENT_NOISE[i] * 150);
              const apple = [33, 34, 42, 43, 44, 45, 52, 53, 54, 55, 62, 63, 64, 65, 73, 74].includes(i);
              return <rect key={i} x={(i % 10) * 20 + 2} y={Math.floor(i / 10) * 20 + 2} width={16} height={16} rx={2} fill={apple ? `rgba(232,68,42,.55)` : `rgb(${g},${g},${g})`} />;
            })}
            <text x={296} y={213} textAnchor="end" fill="var(--fg-faint)" style={{ font: `700 10px ${mono}` }}>노이즈 낀 그림 조각들</text>
          </svg>
          <Build at={1}>
            <svg viewBox="0 0 300 218" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
              {[[70, 70], [90, 90], [110, 110], [90, 130]].map(([x, y], i) => (
                <line key={i} x1={x} y1={y} x2={250} y2={-18} stroke={C.amber} strokeWidth={2.5} opacity={0.85} />
              ))}
              <text x={250} y={-26} textAnchor="middle" fill={C.amber} style={{ font: `900 13px ${mono}` }}>apple</text>
              <text x={150} y={-30} textAnchor="middle" fill="var(--fg-muted)" style={{ font: `700 11px ${mono}` }}>그림 조각(특징)이 낱말을 쳐다본다 — 교차 어텐션(cross-attention)</text>
            </svg>
          </Build>
        </div>
        <Build at={3}>
          <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 14 }}>
            <svg viewBox="0 0 60 60" width={54} height={54}>
              <rect x={2} y={2} width={56} height={56} fill="none" stroke="var(--fg-faint)" strokeWidth={1.5} strokeDasharray="3 3" />
              <rect x={18} y={18} width={24} height={24} fill={`color-mix(in srgb, ${C.blue} 30%, transparent)`} stroke={C.blue} strokeWidth={2} />
            </svg>
            <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', ...kw }}>③ <b>잠재 공간</b>(latent space) — RGB 값 6,912개를 직접 다루는 대신, 신경망이 쓰는 압축된 특징 표현에서 확산을 돌린다(잠재 확산, 2022). 그래서 계산이 준다</div>
          </div>
        </Build>
        <Build at={4}>
          <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, borderColor: `color-mix(in srgb, ${C.red} 45%, transparent)` }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 2 }}>{Array.from({ length: 25 }, (_, i) => <span key={i} style={{ width: 3, height: 14, background: C.noise, opacity: 0.6 }} />)}</div>
              <div style={{ display: 'flex', gap: 14 }}>{Array.from({ length: 4 }, (_, i) => <span key={i} style={{ width: 8, height: 14, background: C.red, borderRadius: 2 }} />)}</div>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', ...kw }}>④ <b style={{ color: C.red }}>증류</b>(distillation) — 많은 단계를 쓰던 모델의 생성 능력을 1~4단계로 근사하도록 다시 가르친다. 소수 단계 생성과 실행 최적화 덕분에 타이핑하는 동안 그림이 바뀐다</div>
          </div>
        </Build>
      </div>
    </div>
  );
}

/* ── S13 — Krea Realtime 절차 시연 (walkthrough) ────────────────── */

type PointerPoint = { x: number; y: number };

type KreaPointerTargets = {
  card: PointerPoint;
  prompt: PointerPoint;
  brush: PointerPoint;
  drawTop: PointerPoint;
  drawRight: PointerPoint;
  drawBottom: PointerPoint;
  drawLeft: PointerPoint;
  sliderFrom: PointerPoint;
  sliderTo: PointerPoint;
  seed: PointerPoint;
};

const INITIAL_KREA_TARGETS: KreaPointerTargets = {
  card: { x: 15.8, y: 31.5 },
  prompt: { x: 19.8, y: 85.2 },
  brush: { x: 5.2, y: 14.6 },
  drawTop: { x: 17.5, y: 35.9 },
  drawRight: { x: 22.8, y: 46.8 },
  drawBottom: { x: 17.5, y: 57.7 },
  drawLeft: { x: 12.2, y: 46.8 },
  sliderFrom: { x: 51.2, y: 85.2 },
  sliderTo: { x: 43.1, y: 85.2 },
  seed: { x: 58.3, y: 85.2 },
};

function KreaWalkthrough() {
  const t = useSceneTime();
  const sceneRef = useRef<HTMLDivElement>(null);
  const realtimeCardRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);
  const brushRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const sliderTrackRef = useRef<HTMLDivElement>(null);
  const seedRef = useRef<HTMLDivElement>(null);
  const [pointerTargets, setPointerTargets] = useState<KreaPointerTargets>(INITIAL_KREA_TARGETS);
  // 타임라인 (초)
  // 단계마다 결과를 관찰할 정지 시간을 둔다 — 원인(조작)과 결과(그림 변화)가 겹치지 않게
  const WIN_IN = 0.2;
  const CARD_CLICK = 2.6;
  const RT_IN = 3.0;          // Realtime 화면으로 전환
  const PROMPT_CLICK = 3.8;
  const PROMPT = 'a red apple on a wooden table';
  const typeAt = 4.0;
  const typeDone = typedDoneAt(PROMPT, typeAt, 12);
  const promptText = typed(t, PROMPT, typeAt, 12);
  const hasPrompt = promptText.length > 0;
  const BRUSH_CLICK = typeDone + 1.3;
  const DRAW_START = BRUSH_CLICK + 0.5;
  const DRAW_END = DRAW_START + 1.1;
  const SLIDER_CLICK = DRAW_END + 1.6;
  const SLIDER_END = SLIDER_CLICK + 1.1;
  const SEED_CLICK = SLIDER_END + 1.6;
  const END = SEED_CLICK + 1.8;
  const rt = t >= RT_IN;
  const windowSettled = t >= WIN_IN + 0.7;
  // 결과 패널의 사과 — 프롬프트 진행도로 선명해지고, 스케치 위치로 옮겨가고, 강도가 낮아지면 더 밀착
  const typeProg = interpolate(t, [typeAt, typeDone], [0, 1]);
  const drawProg = interpolate(t, [DRAW_START, DRAW_END], [0, 1], easeInOut);
  const follow = interpolate(t, [DRAW_END, DRAW_END + 0.6], [0, 1], easeInOut);
  const strength = interpolate(t, [SLIDER_CLICK, SLIDER_END], [0.9, 0.4], easeInOut);
  const seeded = t >= SEED_CLICK ? 1 : 0;
  const stepNow = t < RT_IN ? 1 : t < PROMPT_CLICK ? 2 : t < BRUSH_CLICK ? 3 : t < SLIDER_CLICK ? 4 : t < SEED_CLICK ? 5 : 6;
  // 왼쪽 브라우저 창 배치
  const WX = 2;
  const WY = 5;
  const WW = 72;
  const WH = 86;

  // 창 크롬을 포함한 추정치가 아니라 실제 클릭 요소의 DOM 중심을
  // Scene 좌표(%)로 변환한다. 화면 비율이나 창 높이가 바뀌어도 화살촉이 정확히 맞는다.
  useLayoutEffect(() => {
    if (!windowSettled) return;
    const scene = sceneRef.current;
    if (!scene) return;

    const measure = () => {
      const root = scene.getBoundingClientRect();
      if (root.width === 0 || root.height === 0) return;

      const pointAt = (el: Element, xRatio = 0.5, yRatio = 0.5): PointerPoint => {
        const box = el.getBoundingClientRect();
        return {
          x: ((box.left + box.width * xRatio - root.left) / root.width) * 100,
          y: ((box.top + box.height * yRatio - root.top) / root.height) * 100,
        };
      };

      setPointerTargets((previous) => {
        const next = { ...previous };
        if (realtimeCardRef.current) next.card = pointAt(realtimeCardRef.current);
        if (promptRef.current) next.prompt = pointAt(promptRef.current);
        if (brushRef.current) next.brush = pointAt(brushRef.current);
        if (canvasRef.current) {
          next.drawTop = pointAt(canvasRef.current, 0.4, 0.34);
          next.drawRight = pointAt(canvasRef.current, 0.56, 0.5);
          next.drawBottom = pointAt(canvasRef.current, 0.4, 0.66);
          next.drawLeft = pointAt(canvasRef.current, 0.24, 0.5);
        }
        if (sliderTrackRef.current) {
          next.sliderFrom = pointAt(sliderTrackRef.current, 0.9, 0.5);
          next.sliderTo = pointAt(sliderTrackRef.current, 0.4, 0.5);
        }
        if (seedRef.current) next.seed = pointAt(seedRef.current);

        const keys = Object.keys(next) as (keyof KreaPointerTargets)[];
        const moved = keys.some((key) =>
          Math.abs(next[key].x - previous[key].x) > 0.01 ||
          Math.abs(next[key].y - previous[key].y) > 0.01
        );
        return moved ? next : previous;
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scene);
    [realtimeCardRef, promptRef, brushRef, canvasRef, sliderTrackRef, seedRef]
      .forEach((ref) => ref.current && observer.observe(ref.current));
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [rt, windowSettled]);

  const path: CursorKey[] = [
    { t: 0.9, x: pointerTargets.card.x + 8, y: pointerTargets.card.y + 10, label: '1 접속' },
    { t: CARD_CLICK, ...pointerTargets.card, click: true, label: '2 Realtime' },
    // Realtime 화면이 마운트될 때까지 카드 위에 머물러 다음 목표 측정 전의 점프를 막는다.
    { t: RT_IN, ...pointerTargets.card },
    { t: PROMPT_CLICK, ...pointerTargets.prompt, click: true, label: '3 프롬프트' },
    { t: BRUSH_CLICK, ...pointerTargets.brush, click: true, label: '4 스케치' },
    { t: DRAW_START, ...pointerTargets.drawTop },
    { t: DRAW_START + 0.28, ...pointerTargets.drawRight },
    { t: DRAW_START + 0.55, ...pointerTargets.drawBottom },
    { t: DRAW_START + 0.83, ...pointerTargets.drawLeft },
    { t: DRAW_END, ...pointerTargets.drawTop },
    { t: SLIDER_CLICK, ...pointerTargets.sliderFrom, click: true, label: '5 강도' },
    { t: SLIDER_END, ...pointerTargets.sliderTo },
    { t: SEED_CLICK, ...pointerTargets.seed, click: true, label: '6 시드' },
    { t: SEED_CLICK + 0.6, ...pointerTargets.seed, hide: true },
  ];
  const noiseAmt = 1 - typeProg * 0.9 - seeded * 0.05;
  const appleCx = 50 + (30 - 50) * follow * (1 - (strength - 0.4) * 0.6);
  const appleCy = 46 + (44 - 46) * follow;
  const appleR = 17 - 3 * follow * (1 - (strength - 0.4)) + seeded * 3;   // Seed 뒤에는 크기·색·잎이 눈에 띄게 달라진다
  const steps = ['krea.ai 접속 · 로그인', 'Realtime 카드 클릭', '프롬프트 타이핑 — 오른쪽이 즉시 바뀐다', '브러시로 빨간 원 하나 — 사과가 그 자리로 오도록 유도', 'AI Strength 0.9 → 0.4 — 스케치를 더 따른다', 'Seed 버튼 — 같은 입력의 다른 변형'];
  const RESULT_NOISE = noiseArray(100, 3);
  return (
    <div ref={sceneRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <AppWindow kind="browser" url={rt ? 'krea.ai/realtime' : 'krea.ai'} badge={String(stepNow)} style={{ left: `${WX}%`, top: `${WY}%`, width: `${WW}%`, height: `${WH}%`, zIndex: 2, ...popIn(t, WIN_IN) }} bodyStyle={{ background: '#fafafa' }}>
        {!rt ? (
          /* 대시보드 — 카드 그리드, Realtime 카드가 클릭된다 */
          <div style={{ position: 'absolute', inset: 0, padding: '4% 5%', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: '1fr', gap: '3%', opacity: interpolate(t, [RT_IN - 0.3, RT_IN], [1, 0]) }}>
            {['Realtime', 'Image', 'Video', 'Enhance', 'Edit', 'Train'].map((name) => {
              const on = name === 'Realtime';
              return (
                <div ref={on ? realtimeCardRef : undefined} data-pointer-target={on ? "realtime-card" : undefined} key={name} style={{ borderRadius: 12, border: `1.5px solid ${on ? C.red : 'var(--hair)'}`, background: on ? `color-mix(in srgb, ${C.red} ${8 + clickFlash(t, CARD_CLICK) * 30}%, #fff)` : '#fff', display: 'flex', alignItems: 'flex-end', padding: '4%', fontWeight: 800, fontSize: 'clamp(11px, 1.3vw, 15px)', color: on ? C.red : 'var(--fg-muted)' }}>
                  {name}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', opacity: interpolate(t, [RT_IN, RT_IN + 0.4], [0, 1]) }}>
            {/* 두 칸 — 왼쪽 캔버스 · 오른쪽 결과 */}
            <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: '2%', padding: '3% 3% 0' }}>
              {/* 캔버스 */}
              <div ref={canvasRef} data-pointer-target="canvas" style={{ flex: 1, position: 'relative', background: '#fff', border: '1px solid var(--hair)', borderRadius: 10, overflow: 'hidden' }}>
                {/* 도구 열 */}
                <div style={{ position: 'absolute', left: 6, top: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {['✎', '◯', '▭'].map((s, i) => (
                    <span ref={i === 0 ? brushRef : undefined} data-pointer-target={i === 0 ? "brush" : undefined} key={s} style={{ width: 22, height: 22, borderRadius: 6, display: 'grid', placeItems: 'center', fontSize: 12, border: `1.5px solid ${i === 0 && t > BRUSH_CLICK ? C.red : 'var(--hair)'}`, background: i === 0 ? `color-mix(in srgb, ${C.red} ${clickFlash(t, BRUSH_CLICK) * 40}%, #fff)` : '#fff', color: i === 0 && t > BRUSH_CLICK ? C.red : 'var(--fg-faint)' }}>{s}</span>
                  ))}
                </div>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                  <circle cx={40} cy={50} r={16} fill="none" stroke={C.red} strokeWidth={4} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - drawProg} transform="rotate(-90 40 50)" opacity={drawProg > 0 ? 1 : 0} />
                </svg>
              </div>
              {/* 결과 */}
              <div style={{ flex: 1, position: 'relative', background: hasPrompt ? '#efe6da' : '#fff', border: '1px solid var(--hair)', borderRadius: 10, overflow: 'hidden' }}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', visibility: hasPrompt ? 'visible' : 'hidden' }}>
                  <rect x={0} y={62} width={100} height={38} fill="#b4885a" opacity={0.3 + 0.6 * typeProg} />
                  <ellipse cx={appleCx} cy={appleCy + appleR * 0.95} rx={appleR * 0.9} ry={appleR * 0.2} fill="rgba(23,32,42,.18)" opacity={typeProg} />
                  <circle cx={appleCx} cy={appleCy} r={appleR} fill={seeded ? '#c9301a' : C.red} opacity={0.15 + 0.85 * typeProg} />
                  {seeded === 1 && <circle cx={appleCx + appleR * 0.3} cy={appleCy + appleR * 0.2} r={appleR * 0.55} fill="#f2a33a" opacity={0.45} />}
                  <ellipse cx={appleCx + appleR * (seeded ? -0.3 : 0.35)} cy={appleCy - appleR - 1} rx={appleR * 0.32} ry={appleR * 0.14} fill="#4a9a46" transform={`rotate(${seeded ? 28 : -30} ${appleCx + appleR * (seeded ? -0.3 : 0.35)} ${appleCy - appleR})`} opacity={typeProg} />
                  <circle cx={appleCx + appleR * (seeded ? 0.3 : -0.35)} cy={appleCy - appleR * 0.4} r={appleR * 0.2} fill="#fff" opacity={0.5 * typeProg} />
                  {Array.from({ length: 100 }, (_, i) => {
                    const v = RESULT_NOISE[i];
                    if (v < 0.5) return null;
                    const g = Math.round(120 + v * 120);
                    return <rect key={i} x={(i % 10) * 10} y={Math.floor(i / 10) * 10} width={10} height={10} fill={`rgb(${g},${g},${g})`} opacity={Math.max(0, noiseAmt) * (v - 0.5) * 1.6} />;
                  })}
                </svg>
              </div>
            </div>
            {/* 하단 조작 줄 */}
            <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: '2%', padding: '2% 3% 3%' }}>
              <div ref={promptRef} data-pointer-target="prompt" style={{ flex: '1 1 40%', minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 999, border: `1.5px solid ${t > PROMPT_CLICK ? C.red : 'var(--hair)'}`, background: '#fff', fontFamily: mono, fontSize: 'clamp(10.5px, 1.15vw, 13px)', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {promptText || <span style={{ color: 'var(--fg-faint)' }}>Describe your image…</span>}
                {t > PROMPT_CLICK && t < typeDone && <Caret color={C.red} />}
              </div>
              <div style={{ flex: '0 0 24%', display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 800, color: 'var(--fg-muted)' }}>AI Strength {strength.toFixed(2)}</span>
                <div ref={sliderTrackRef} data-pointer-target="strength-track" style={{ position: 'relative', height: 8, borderRadius: 4, background: 'var(--hair)' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${strength * 100}%`, background: C.red, borderRadius: 4 }} />
                  <span style={{ position: 'absolute', left: `${strength * 100}%`, top: -5, width: 18, height: 18, borderRadius: '50%', background: '#fff', border: `3px solid ${C.ink}`, transform: 'translateX(-50%)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: 9.5, color: 'var(--fg-muted)', ...kw }}>
                  <span>◀ 스케치를 따름</span>
                  <span>프롬프트가 자유롭게 ▶</span>
                </div>
              </div>
              <div ref={seedRef} data-pointer-target="seed" style={{ flex: '0 0 12%', padding: '7px 0', borderRadius: 999, textAlign: 'center', fontWeight: 800, fontSize: 'clamp(10.5px, 1.15vw, 13px)', border: `1.5px solid ${C.ink}`, background: `color-mix(in srgb, ${C.ink} ${clickFlash(t, SEED_CLICK) * 22}%, #fff)`, fontFamily: mono }}>
                Seed ↻
              </div>
              <div style={{ flex: '0 0 12%', display: 'flex', borderRadius: 999, border: '1.5px solid var(--hair)', overflow: 'hidden', fontFamily: mono, fontSize: 10.5, fontWeight: 800 }}>
                <span style={{ flex: 1, textAlign: 'center', padding: '6px 0', background: C.ink, color: '#fff' }}>Image</span>
                <span style={{ flex: 1, textAlign: 'center', padding: '6px 0', color: 'var(--fg-faint)', textDecoration: t > SEED_CLICK + 0.8 ? 'line-through' : 'none' }}>Video</span>
              </div>
            </div>
          </div>
        )}
      </AppWindow>
      {/* 오른쪽 세로 밴드 — 단계 번호와 확인 문구 */}
      <div style={{ position: 'absolute', left: `${WX + WW + 2}%`, top: `${WY}%`, width: `${100 - WX - WW - 2 - 2}%`, display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
        <div className="kicker" style={{ color: 'var(--primary)', ...kw }}>Krea Realtime · 화면 그대로</div>
        {steps.map((s, i) => {
          const n = i + 1;
          const on = n === stepNow;
          const past = n < stepNow;
          return (
            <div key={s} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '7px 10px', borderRadius: 10, background: on ? `color-mix(in srgb, ${C.red} 10%, transparent)` : 'transparent', border: `1px solid ${on ? `color-mix(in srgb, ${C.red} 45%, transparent)` : 'transparent'}`, opacity: past ? 0.7 : 1, transition: 'background .2s' }}>
              <span style={{ fontFamily: mono, fontWeight: 900, fontSize: 13, color: on ? C.red : 'var(--fg-muted)', flexShrink: 0 }}>{n}</span>
              <span style={{ fontSize: 'clamp(11.5px, 1.25vw, 13.5px)', fontWeight: on ? 800 : 600, ...kw }}>{s}</span>
            </div>
          );
        })}
        <div style={{ marginTop: 6, fontSize: 11.5, color: 'var(--fg-faint)', fontFamily: mono, ...kw, opacity: interpolate(t, [END - 0.6, END], [0, 1]) }}>손잡이는 넷 — 프롬프트 · 스케치 · 강도 · 시드. Video는 누르지 않는다.</div>
        <LinkPill href={KREA_URL} label="krea.ai 열기" />
      </div>
      <Pointer path={path} color={C.red} timelineEnd={END} />
    </div>
  );
}

/* ── S5 — 판별 문항의 사진 격자 ─────────────────────────────────── */

const QUIZ_PHOTOS: { label: string; file: string; real: boolean; credit: string }[] = [
  { label: 'A', file: 'quiz-ai-glass.png', real: false, credit: 'AI 생성 (Codex image_gen)' },
  { label: 'B', file: 'quiz-ai-apple.png', real: false, credit: 'AI 생성 (Codex image_gen)' },
  { label: 'C', file: 'quiz-real-apple.jpg', real: true, credit: 'CC0 · Pixel2013 · Wikimedia Commons' },
  { label: 'D', file: 'quiz-ai-store.png', real: false, credit: 'AI 생성 (Codex image_gen)' },
];

function QuizPhoto({ p, revealed }: { p: (typeof QUIZ_PHOTOS)[number]; revealed: boolean }) {
  const [missing, setMissing] = useState(false);
  return (
    <div style={{ position: 'relative', aspectRatio: '4 / 3', borderRadius: 12, overflow: 'hidden', background: '#dfe3e8', border: `3px solid ${revealed && p.real ? C.red : 'transparent'}`, boxShadow: revealed && p.real ? `0 0 0 4px color-mix(in srgb, ${C.red} 30%, transparent)` : 'none' }}>
      {!missing ? (
        <img src={`${BASE}/images/${p.file}`} alt="" onError={() => setMissing(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: mono, fontSize: 12, color: 'var(--fg-faint)' }}>
          이미지 준비 중
        </div>
      )}
      {revealed && !p.real && <DotVeil opacity={0.55} />}
      <span style={{ position: 'absolute', left: 10, top: 10, width: 30, height: 30, display: 'grid', placeItems: 'center', background: C.red, color: '#fff', fontFamily: mono, fontWeight: 900, fontSize: 15, borderRadius: 6 }}>{p.label}</span>
      {revealed && (
        <span style={{ position: 'absolute', right: 8, bottom: 8, padding: '3px 8px', borderRadius: 6, background: 'rgba(23,32,42,.72)', color: '#fff', fontFamily: mono, fontSize: 10.5, fontWeight: 700 }}>
          {p.real ? '실제 사진 · ' : ''}{p.credit}
        </span>
      )}
    </div>
  );
}

/* ── 덱 ─────────────────────────────────────────────────────────── */

export default function AiHowToDrawDeck() {
  return (
    <Deck>
      {/* S1 제목 — 노이즈에서 떠오른다 (씬) */}
      <Slide
        full
        nav="제목"
        notes="지난 시간까지는 말을 만드는 기계를 뜯어봤습니다. 오늘은 그림을 만드는 기계입니다. 방금 제목이 어떻게 나타났는지 보셨나요? 회색 점 속에서 글자가 떠올랐죠. 오늘 수업이 끝나면 저 장면이 정확히 무엇인지 설명할 수 있게 됩니다."
      >
        <Scene>
          <TitleScene />
        </Scene>
      </Slide>

      {/* S2 낱말 하나를 그림으로 (live 워드클라우드 + 교사 실시간 시연) */}
      <Slide
        nav="낱말 → 그림"
        notes="낱말 하나씩만요. 큰 글자 세 개를 묶어서 지금 바로 그려 보겠습니다. Krea Realtime의 Image 모드에서 캔버스를 비워 둔 채 프롬프트를 한 글자씩 입력합니다. (타이핑) 보세요, 'cat'까지 쳤을 때와 'night'를 붙였을 때 그림이 달라지죠. 이 그림은 인터넷 어딘가에 있던 걸까요, 방금 태어난 걸까요? 오늘 수업 내내 이 질문을 들고 갑니다. — 시연 전 Krea에 로그인하고 Realtime·Image 모드를 열어 둡니다. 시연 중에는 Seed 버튼을 누르지 않아 프롬프트 변화에만 주목하고, 접속이 지연되면 미리 만든 예시 이미지로 넘어갑니다."
      >
        <div style={{ width: 'min(1180px, 100%)', marginInline: 'auto', display: 'flex', flexWrap: 'wrap', gap: 'clamp(18px, 2.8vw, 40px)', alignItems: 'stretch' }}>
          <div style={{ flex: '1.6 1 min(360px, 100%)', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Reveal>
              <Kicker>다 같이 — 라이브 참여</Kicker>
              <h2 className="headline" style={{ marginTop: 8, ...kw }}>
                낱말 하나를 <span className="accent-text">그림으로</span>
              </h2>
            </Reveal>
            <Reveal>
              <LiveTag kind="워드클라우드" text="오늘 AI에게 그려 달라고 할 것 — 낱말 하나만 (사물·장소·동물·시간·분위기, 사람 이름은 빼고)" />
            </Reveal>
            <Reveal>
              <p style={{ color: 'var(--fg-muted)', fontSize: 'clamp(14px, 1.6vw, 17px)', ...kw }}>
                워드클라우드에서 함께 장면을 이룰 수 있는 낱말 셋을 골라 문장 하나로 묶고, 교사가 <b>한 글자씩 타이핑</b>합니다. 낱말이 늘 때마다 그림이 흔들리며 바뀝니다.
              </p>
            </Reveal>
          </div>
          <div style={{ flex: '1 1 min(300px, 100%)', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Build at={1}>
              <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 800, color: 'var(--fg-faint)' }}>→ 프롬프트</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['낱말 ①', '낱말 ②', '낱말 ③'].map((w) => (
                    <span key={w} style={{ flex: '1 1 80px', padding: '12px 10px', borderRadius: 10, border: `2px dashed color-mix(in srgb, ${C.red} 50%, transparent)`, textAlign: 'center', fontFamily: mono, fontSize: 12.5, fontWeight: 800, color: C.red }}>{w}</span>
                  ))}
                </div>
                <div style={{ fontFamily: mono, fontSize: 12.5, color: 'var(--fg-muted)', ...kw }}>예: 고양이 · 밤 · 편의점 → “a cat in front of a convenience store at night”</div>
                <LinkButton href={KREA_URL} label="Krea Realtime 열기" sub="krea.ai · Image 모드" big />
                <div style={{ fontFamily: mono, fontSize: 11, color: 'var(--fg-faint)', ...kw }}>교사용 — 캔버스 비우기 · Seed 버튼은 누르지 않기 · Video 금지 · 접속 지연 시 예시 이미지로</div>
              </div>
            </Build>
          </div>
        </div>
      </Slide>

      {/* S3 오늘의 지도 — 두 계단 */}
      <Slide
        center
        nav="두 계단"
        notes="두 계단을 오르겠습니다. 첫 계단은 경쟁으로 배우는 방식, 둘째는 지우개질을 배우는 방식입니다. 둘은 세대 교체가 아니라 서로 다른 길이고, 오늘 실습 도구는 둘째 방식에 속합니다. 점선으로 보이는 셋째 계단의 트랜스포머는 두 방식 안에서도 쓰이는 신경망 구조인데, 다음 시간에 봅니다."
      >
        <Reveal>
          <Kicker>오늘의 지도 · 생성 모델 = 데이터의 분포를 배워 새 데이터를 만드는 모델</Kicker>
          <h2 className="headline" style={{ marginInline: 'auto', marginTop: 8, ...kw }}>
            오늘 비교할 <span className="accent-text">두 가지</span> 생성 방식
          </h2>
        </Reveal>
        <div style={{ marginTop: 'clamp(12px, 2vh, 24px)', display: 'flex', justifyContent: 'center' }}>
          <Staircase />
        </div>
      </Slide>

      {/* S4 돋보기 — 그림은 숫자 격자다 (씬) */}
      <Slide
        full
        nav="숫자 격자"
        notes="그림을 만든다는 걸 컴퓨터 입장에서 말하면 이렇습니다. 6,912개의 빈칸에 숫자를 채워라. 아무 숫자나 넣으면 회색 잡음이 되고, 잘 넣으면 사과가 됩니다. 문제는 '잘'이 뭐냐는 거죠. 지난 시간에 말은 확률분포에서 고른다고 했죠. 그림도 마찬가지입니다. 이 분포를 어떻게 배우느냐가 두 기계의 차이입니다."
      >
        <Scene>
          <MagnifierScene />
        </Scene>
      </Slide>

      {/* S5 진짜 사진은 어느 것? (live choice) */}
      <Slide
        nav="진짜 사진?"
        notes="네 장 중 진짜 사진은 어느 것일까요? 제출해 주세요. (분포 공개 → 클릭으로 정답 공개) 고를 때 무엇을 보셨나요? 손가락 개수, 글자, 그림자 방향, 너무 매끈한 표면. 그 기준을 배우는 신경망이 있습니다. 판별자라고 부릅니다. 진짜 사진이 스톡 사진처럼 매끈하죠 — 매끈함만으로는 못 가릅니다. 그리고 그 판별자를 속이려고 그림을 그리는 신경망이 있어요. 첫 계단으로 갑니다."
      >
        <div style={{ width: 'min(1180px, 100%)', marginInline: 'auto', display: 'flex', flexWrap: 'wrap', gap: 'clamp(16px, 2.4vw, 32px)', alignItems: 'center' }}>
          <div style={{ flex: '1.7 1 min(380px, 100%)', minWidth: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {QUIZ_PHOTOS.map((p) => (
              <QuizPhotoSlot key={p.label} p={p} />
            ))}
          </div>
          <div style={{ flex: '1 1 min(280px, 100%)', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Reveal>
              <Kicker>첫 계단 앞에서</Kicker>
              <h2 className="headline" style={{ marginTop: 8, ...kw }}>
                진짜 사진은 <span className="accent-text" style={{ whiteSpace: 'nowrap' }}>어느 것?</span>
              </h2>
            </Reveal>
            <Reveal>
              <LiveTag kind="선택" text="A~D 중 실제로 촬영된 사진은?" />
            </Reveal>
            <Build at={1}>
              <div style={{ ...card, borderColor: `color-mix(in srgb, ${C.red} 45%, transparent)` }}>
                <div style={{ fontWeight: 900, fontSize: 'clamp(15px, 1.8vw, 19px)', ...kw }}>여러분은 방금 <span style={{ color: C.red }}>판별자(Discriminator)</span>가 되었다</div>
                <div style={{ marginTop: 6, fontSize: 'clamp(12.5px, 1.4vw, 14.5px)', color: 'var(--fg-muted)', ...kw }}>고를 때 본 것 — 손가락 개수·글자·그림자 방향·너무 매끈한 표면. 판별자도 이렇게 구별에 쓸 특징을 배운다 — 다만 사람의 기준과 같지는 않고, 외형만으로 출처를 확정할 수는 없다. 정답은 출처 기록으로 확인한다. GAN의 판별자는 출처가 알려진 표본으로 훈련된다는 점이 다르다.</div>
              </div>
            </Build>
          </div>
        </div>
      </Slide>

      {/* S6 GAN 탁구 랠리 (씬) */}
      <Slide
        full
        nav="탁구 랠리"
        notes="왼쪽은 그림을 만드는 생성자, 오른쪽은 진짜인지 가려내는 판별자입니다. 처음엔 생성자가 그린 게 형편없어서 판별자가 다 잡아냅니다. 그런데 잡힐 때마다 생성자는 '뭐가 들켰는지'를 배우고, 판별자도 '뭘 놓쳤는지'를 배워요. 돌아오는 것은 그림이 아니라 판정입니다. 이 랠리를 수없이 반복하면 판별자가 동전 던지기 수준으로 헷갈리는 지점에 가까워집니다. 이론적으로는 두 분포가 같아질 때이고, 실제로는 이 비율만으로 학습이 끝났다고 판단하지는 않습니다. 화면의 비율 숫자는 설명용 예시입니다. 흔히 위조지폐범과 경찰에 비유하는데, 용어는 생성자와 판별자입니다."
      >
        <Scene>
          <RallyScene />
        </Scene>
      </Slide>

      {/* S6-A GAN이라는 이름 */}
      <Slide
        nav="GAN이라는 이름"
        notes="이 기계의 이름은 GAN입니다. 세 낱말의 머리글자예요. 하나씩 짚어 보겠습니다. Generative, 생성적 — 고양이인지 아닌지 맞히는 것이 아니라 없던 그림을 만든다는 뜻입니다. Adversarial, 적대적 — 방금 본 랠리가 이 낱말이에요. 두 신경망의 목표가 정반대라서 한쪽이 잘할수록 다른 쪽 성적이 나빠집니다. Network, 신경망 — '손가락은 다섯 개다' 같은 기준을 사람이 넣어 준 것이 아니라, 오차를 줄이면서 스스로 기준을 만듭니다. 셋을 붙이면 생성적 적대 신경망, 2014년 굿펠로우 팀이 붙인 이름입니다. 마지막 한 줄만 남겨 주세요 — 이름에 판별자가 없죠? 판별자는 생성자를 가르치려고 둔 장치라서, 학습이 끝나면 그림을 만드는 것은 생성자뿐입니다. 짝에게 세 낱말을 각각 한 문장으로 말해 보게 하면 좋습니다."
      >
        <Reveal>
          <Kicker>첫 계단 · 이름 뜯어보기</Kicker>
          <h2 className="headline" style={{ marginInline: 'auto', marginTop: 8, ...kw }}>
            방금 본 장면이 <span className="accent-text">이름 세 낱말</span>에 그대로 들어 있다
          </h2>
        </Reveal>
        <GanNameFigure />
      </Slide>

      {/* S7 GAN이 이룬 것, 막힌 것 */}
      <Slide
        nav="이룬 것 · 막힌 것"
        notes="GAN은 2014년에 나와서 5년 만에 존재하지 않는 사람 얼굴을 만들어 냈습니다. (링크 시연 — StyleGAN3는 그 후속 모델) 시드 숫자만 바꾸면 다른 얼굴이 나오죠. 그런데 세 가지가 막혔습니다. 두 네트워크가 함께 변해 학습이 자주 흔들렸고, 비슷한 종류의 그림만 우려먹는 모드 붕괴가 생겼고, 문장으로 원하는 그림을 충실히 지시하기가 어려웠습니다. 그리고 전혀 다른 출발점에서 온 방식이 있습니다. GAN의 후속이 아니라 2015년에 따로 제안된 길이에요."
      >
        <div style={{ width: 'min(1180px, 100%)', marginInline: 'auto' }}>
          <Reveal>
            <Kicker>첫 계단 · GAN</Kicker>
            <h2 className="headline" style={{ marginTop: 8, ...kw }}>
              한 번에 뽑는 빠른 기계 — 그러나 <span className="accent-text">세 곳</span>에서 막혔다
            </h2>
          </Reveal>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(14px, 2vw, 26px)', marginTop: 'clamp(14px, 2.4vh, 26px)', alignItems: 'stretch' }}>
            <Build at={1} style={{ flex: '1.4 1 min(340px, 100%)', minWidth: 0 }}>
              <div style={{ ...card, height: '100%', borderColor: `color-mix(in srgb, ${C.blue} 45%, transparent)` }}>
                <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 800, color: C.blue }}>이룬 것</div>
                <div style={{ fontWeight: 900, fontSize: 'clamp(17px, 2.2vw, 24px)', marginTop: 6, ...kw }}>존재하지 않는 사람의 얼굴</div>
                <div style={{ marginTop: 8, fontSize: 'clamp(13px, 1.45vw, 15.5px)', color: 'var(--fg-muted)', lineHeight: 1.6, ...kw }}>
                  StyleGAN(2018)의 얼굴 — 「This Person Does Not Exist」(2019년 2월)는 새로고침마다 다른 합성 얼굴을 보여 주었다. 잠재 벡터(와 세부 노이즈)를 받아 <b>한 번의 순방향 계산</b>(single pass)으로 얼굴이 된다.
                </div>
                <div style={{ marginTop: 12 }}>
                  <LinkButton href={STYLEGAN_URL} label="StyleGAN3 Space — 시드만 바꿔 보기" sub="huggingface.co/spaces/hysts/StyleGAN3 · 교사 시연 30초" />
                </div>
              </div>
            </Build>
            <div style={{ flex: '1 1 min(280px, 100%)', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { n: '①', t: '학습 불안정', b: '두 네트워크가 함께 변하므로 학습이 진동하거나 잘 수렴하지 않을 수 있다' },
                { n: '②', t: '모드 붕괴 (mode collapse)', b: '다양한 입력에도 비슷한 종류의 그림만 만들어 학습 데이터의 다양성을 놓친다' },
                { n: '③', t: '조건 부여의 어려움', b: '텍스트 조건 GAN(2016)도 있었지만, "밤의 편의점 앞 고양이"처럼 복잡한 문장을 충실히 반영하기 어려웠다' },
              ].map((x) => (
                <Build key={x.n} at={2}>
                  <div style={{ ...card, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontFamily: mono, fontWeight: 900, color: C.red, fontSize: 16 }}>{x.n}</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 'clamp(13.5px, 1.5vw, 16px)', ...kw }}>{x.t}</div>
                      <div style={{ fontSize: 'clamp(12px, 1.3vw, 14px)', color: 'var(--fg-muted)', marginTop: 2, ...kw }}>{x.b}</div>
                    </div>
                  </div>
                </Build>
              ))}
            </div>
          </div>
          <Build at={3}>
            <p style={{ marginTop: 'clamp(12px, 2vh, 20px)', fontWeight: 800, fontSize: 'clamp(14px, 1.7vw, 18px)', color: C.red, ...kw }}>
              다른 출발점에서 온 길도 있다 — 데이터를 흐트러뜨리는 과정의 반대 방향을 배우는 <b>확산 모델</b>(2015년 제안 · 2020년 DDPM으로 도약)
            </p>
          </Build>
        </div>
      </Slide>

      {/* S8 잉크 한 방울 (씬) */}
      <Slide
        full
        nav="잉크 방울"
        notes="물에 잉크를 떨어뜨리면 저절로 퍼집니다. 이걸 확산이라고 하죠. 그림에 노이즈를 조금씩 더하는 것도 똑같습니다. 결국 회색 잡음이 돼요. 여기까지는 쉽습니다. 어려운 건 반대 방향이죠. (7초 뒤 씬이 스스로 되돌아간다) 퍼진 잉크가 저절로 모이진 않습니다. 그런데 만약 매 단계 '무엇이 더해졌는지'를 정확히 안다면? 한 단계씩 빼면서 되돌아갈 수 있습니다. 확산 모델은 바로 그 '빼야 할 노이즈'를 맞히는 법을 배운 신경망입니다."
      >
        <Scene>
          <InkScene />
        </Scene>
      </Slide>

      {/* S8-A 확산이라는 이름 */}
      <Slide
        nav="확산이라는 이름"
        notes="확산이라는 말, 과학 시간에 들어 보셨죠. 잉크가 물에 퍼지고 향수가 방에 번지는 것. 라틴어로 '사방으로 붓다'입니다. AI가 지어낸 말이 아니라 그대로 빌려 온 낱말이에요. 이 수업에서는 방금 본 것처럼 그림에 노이즈를 조금씩 더해 흐트러뜨리는 정과정이 바로 확산입니다. 그런데 여기 반전이 있습니다. 이름은 퍼지는 쪽에서 왔는데, 모델이 배우는 것은 되짚는 쪽이에요. 퍼뜨리는 일에는 배울 것이 없습니다 — 정해 둔 표대로 계산하면 되니까요. 확산은 배울 문제를 만들어 주는 과정이고, 학습은 전부 반대 방향에 있습니다. 그리고 이 모델의 정식 이름이 DDPM인데, 네 글자 가운데 실제로 하는 일은 맨 앞 Denoising, 노이즈 지우기입니다. 이름을 외우라는 것이 아니라, 이름이 왜 헷갈리게 붙었는지를 알고 넘어가자는 겁니다. 바로 다음 장에서 그 네 단계를 봅니다."
      >
        <Reveal>
          <Kicker>둘째 계단 · 이름 뜯어보기</Kicker>
          <h2 className="headline" style={{ marginInline: 'auto', marginTop: 8, ...kw }}>
            왜 하필 <span className="accent-text">확산</span>이라는 이름일까
          </h2>
        </Reveal>
        <DiffusionNameFigure />
      </Slide>

      {/* S9 확산 모델 네 단계 */}
      <Slide
        center
        nav="네 단계"
        notes="네 단계입니다. 그림에 노이즈를 섞는다(정과정 — 학습에 쓸 자료 만들기), 어떤 노이즈가 쓰였는지 예측하도록 훈련한다, 새 노이즈에서 출발해 학습한 예측으로 그림을 만든다(역과정), 그리고 시드가 그 출발 노이즈를 정한다. 낱말 풀이: 정과정은 '그림에 노이즈 섞기', 역과정은 '학습한 예측으로 그림 만들기', 노이즈 스케줄은 '단계마다 노이즈를 얼마나 섞을지 정한 표', t는 현재 단계, T는 전체 단계 수, 시드는 '무작위 수열의 시작 번호'입니다. 훈련이란 예측값과 실제 노이즈의 차이(오차)를 줄이도록 매개변수를 갱신하는 일입니다. 지난 시간 LLM이 다음 토큰의 확률을 계산했죠? 둘 다 확률적 패턴을 배우지만, 오늘 모델은 다음 낱말 대신 노이즈의 수치 배열을 예측합니다. 이제 이걸 직접 만져 보겠습니다."
      >
        <Reveal>
          <Kicker>둘째 계단 · 확산 모델</Kicker>
          <h2 className="headline" style={{ marginInline: 'auto', marginTop: 8, ...kw }}>
            "쓰인 노이즈가 무엇인가"를 맞히는 시험을 <span className="accent-text">수없이 반복</span>
          </h2>
        </Reveal>
        <div style={{ marginTop: 'clamp(12px, 2vh, 22px)' }}>
          <RingFigure />
        </div>
        <Build at={4}>
          <p style={{ marginInline: 'auto', marginTop: 'clamp(10px, 1.6vh, 16px)', fontFamily: mono, fontSize: 'clamp(12px, 1.3vw, 14px)', color: 'var(--fg-muted)', ...kw }}>
            지난 시간: LLM은 「다음 토큰」의 확률을 계산한다 · 오늘: 확산 모델은 「쓰인 노이즈」의 수치 배열을 예측한다
          </p>
        </Build>
      </Slide>

      {/* S10 만져 보는 확산 모델 (model · link) */}
      <Slide
        nav="3D 모형"
        notes="링크를 열어 주세요(접속이 1분 안에 안 되면 짝의 화면을 함께 봅니다). 처음 화면은 거의 순수한 노이즈입니다. 「◀ 생성 · 역과정」을 눌러 보세요. 한 단계씩 노이즈가 빠지면서 사과가 나옵니다. 세 가지 과제를 10분 안에 해 봅니다 — 접속 2분, 과제 ① 3분, 과제 ② 3분, 과제 ③은 빠른 학생의 확장 과제, 정리 2분. 특히 둘째 과제, 시드를 바꾸면 무엇이 달라지는지 잘 봐 두세요. 이 모형에서는 목표 도형의 세부도 시드에 따라 조금 달라지도록 수식에 정해 두었습니다 — 신경망이 만든 변형이 아닙니다. 실습에서 똑같은 손잡이를 만나게 됩니다. 이 모형에는 신경망이 없고, 미리 만든 경로를 거꾸로 재생하는 시연이라는 것이 화면에 적혀 있습니다. 실제 모델은 새 노이즈에서 학습한 분포로 그림을 만듭니다."
      >
        <div style={{ width: 'min(1180px, 100%)', marginInline: 'auto', display: 'flex', flexWrap: 'wrap', gap: 'clamp(18px, 2.8vw, 40px)', alignItems: 'center' }}>
          <div style={{ flex: '1 1 min(320px, 100%)', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Reveal>
              <Kicker>둘째 계단 · 조작 교구 10분</Kicker>
              <h2 className="headline" style={{ marginTop: 8, ...kw }}>
                만져 보는 <span className="accent-text">확산 모델</span>
              </h2>
              <p style={{ color: 'var(--fg-muted)', fontSize: 'clamp(13px, 1.5vw, 16px)', marginTop: 6, ...kw }}>
                프롬프트와 시드를 고정하면 단계 t 하나가 이 모형의 상태를 정한다 — 그 사이의 숫자 6,912개가 전부 실제 계산이다.
              </p>
            </Reveal>
            <Reveal>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <LinkButton href={MODEL_PATH} label="노이즈에서 그림으로 — 3D 모형 열기" sub="각자 기기에서 새 탭으로 · 교사는 프로젝터에서 같은 모형" big />
                <img src={`${BASE}/images/model-qr.png`} alt="3D 모형 QR" onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} style={{ width: 'clamp(84px, 9vw, 120px)', height: 'auto', borderRadius: 10, border: '1px solid var(--hair)', background: '#fff' }} />
              </div>
            </Reveal>
            <Reveal>
              <div style={{ fontFamily: mono, fontSize: 11.5, color: 'var(--fg-faint)', ...kw }}>{MODEL_URL}</div>
            </Reveal>
          </div>
          <div style={{ flex: '1 1 min(300px, 100%)', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { n: '①', t: '「◀ 생성 · 역과정」을 끝까지 재생한 뒤, 단계 t 슬라이더를 25로 옮겨 멈춘다. t = 50 · 25 · 0에서 무대의 모습과 픽셀 값의 분포를 함께 비교한다.' },
              { n: '②', t: '「시드 바꾸기」를 누르고 같은 프롬프트로 다시 생성한다. 출발 노이즈 · 중간 무늬 · 최종 도형이 각각 같은지 다른지 말한다.' },
              { n: '③', t: '무대의 큐브 하나를 클릭해 R·G·B 값이 t = 50 · 25 · 0에서 어떻게 다른지 본다. 매번 한 방향으로만 변하는 것은 아니다.' },
            ].map((x) => (
              <Reveal key={x.n}>
                <div style={{ ...card, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', textAlign: 'left' }}>
                  <span style={{ fontFamily: mono, fontWeight: 900, color: C.red, fontSize: 16 }}>{x.n}</span>
                  <span style={{ fontSize: 'clamp(13px, 1.45vw, 15.5px)', fontWeight: 600, lineHeight: 1.55, ...kw }}>{x.t}</span>
                </div>
              </Reveal>
            ))}
            <Reveal>
              <div style={{ fontFamily: mono, fontSize: 11.5, color: 'var(--fg-faint)', ...kw }}>완료 표시는 모형 화면에만 남고 제출되지 않습니다 · 옆 사람과 화면을 비교하며</div>
            </Reveal>
          </div>
        </div>
      </Slide>

      {/* S11 조건 · 잠재 공간 · 증류 (live choice) */}
      <Slide
        nav="조건과 증류"
        notes="GAN이 막혔던 세 번째, 말로 조종하기. 확산 모델은 이렇게 풉니다. 문장을 벡터로 바꾸고, 노이즈를 지우는 신경망이 그 벡터를 쳐다보면서 지워요. 지난 시간의 어텐션이 여기서 다시 나옵니다. 스케치도 조건이 됩니다. 스케치에 노이즈를 조금만 더하면 스케치가 남고, 많이 더하면 프롬프트가 새로 그려요. 실습에서 만질 강도 슬라이더가 바로 이겁니다. 그리고 50단계를 1~4단계로 줄인 증류 덕분에 타이핑하는 동안 그림이 바뀝니다. 제출해 주세요. (분포 공개) 여기까지가 두 계단입니다. 잠깐 쉬고 실습으로 가겠습니다."
      >
        <div style={{ width: 'min(1180px, 100%)', marginInline: 'auto' }}>
          <Reveal>
            <Kicker>둘째 계단 · 말과 스케치가 그림을 조종하는 법</Kicker>
            <h2 className="headline" style={{ marginTop: 8, ...kw }}>
              조건은 <span className="accent-text">방향</span>을 정하고, 증류는 <span className="accent-text">속도</span>를 만든다
            </h2>
          </Reveal>
          <div style={{ marginTop: 'clamp(12px, 2vh, 22px)' }}>
            <ConditionFigure />
          </div>
          <Build at={4}>
            <div style={{ marginTop: 'clamp(10px, 1.6vh, 16px)' }}>
              <LiveTag kind="선택" text="오늘 배운 기본 확산 모델(DDPM)이 GAN과 가장 다른 점은? — ① 판별자의 평가를 학습 신호로 쓴다 ② 노이즈 낀 그림과 단계 t를 받아, 쓰인 노이즈를 예측하도록 훈련한다 ③ 잠재 벡터 하나로 한 번에 그림을 만든다 ④ 텍스트 조건을 줄 수 없다" />
            </div>
          </Build>
        </div>
      </Slide>

      {/* S12 실습 전에 바로잡을 세 가지 */}
      <Slide
        nav="오해 셋"
        notes="실습에서 세 가지를 보게 될 텐데 미리 바로잡습니다. AI는 보통 그림을 저장해 뒀다 붙이지 않습니다. 분포를 배웠어요. 다만 특정 조건에서 학습 그림을 거의 그대로 내놓는 경우가 연구로 확인됐고, 그것이 저작권 이야기의 한 쟁점입니다. 둘째, 시드가 다르면 보통 그림이 다릅니다. 같은 시드라도 실행 환경이 다르면 완전히 같지는 않을 수 있어요. 셋째, 프롬프트는 길이가 아니라 구체성입니다. 다만 모델이 읽을 수 있는 길이에는 한도가 있습니다."
      >
        <div style={{ width: 'min(1100px, 100%)', marginInline: 'auto' }}>
          <Reveal>
            <Kicker>실습 전에</Kicker>
            <h2 className="headline" style={{ marginTop: 8, ...kw }}>
              바로잡을 <span className="accent-text">세 가지</span>
            </h2>
          </Reveal>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.8vh, 18px)', marginTop: 'clamp(14px, 2.4vh, 26px)' }}>
            {[
              { wrong: '"AI가 학습 그림을 저장해 뒀다가 짜깁기한다"', right: '보통 그림 파일을 꺼내 붙이지 않고, 이미지들의 통계적 패턴(픽셀 사이 관계까지)을 담은 매개변수로 새로 만든다.', foot: '다만 특정 조건에서 학습 이미지를 거의 그대로 재현하는 사례가 보고되었다(Carlini 외, 2023 「Extracting Training Data from Diffusion Models」) — 저작권·프라이버시 논의의 한 쟁점이다' },
              { wrong: '"같은 프롬프트면 같은 그림이 나온다"', right: '시드가 다르면 출발 노이즈가 다르므로 보통 다른 그림이 나온다.', foot: '같은 시드로 재현하려면 모델·설정에 더해 실행 환경까지 같아야 한다 — 시드만으로 완전히 같은 그림이 보장되지는 않는다' },
              { wrong: '"프롬프트는 길수록 좋다"', right: '길이만 늘린다고 좋아지지 않는다 — 필요한 묘사(빛·재질·구도)를 명확히, 모델의 입력 길이 한도 안에서.', foot: '실습 라운드 1에서 직접 확인한다' },
            ].map((x, i) => (
              <Build key={i} at={i + 1}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(10px, 1.6vw, 20px)', alignItems: 'center' }}>
                  <div style={{ flex: '1.1 1 min(300px, 100%)', minWidth: 0, fontWeight: 800, fontSize: 'clamp(16px, 2.1vw, 24px)', color: 'var(--fg-faint)', textDecoration: 'line-through', textDecorationColor: C.red, textDecorationThickness: 3, ...kw }}>{x.wrong}</div>
                  <div style={{ flex: '1 1 min(300px, 100%)', minWidth: 0, ...card, padding: '10px 14px', borderColor: `color-mix(in srgb, ${C.red} 40%, transparent)` }}>
                    <div style={{ fontWeight: 800, fontSize: 'clamp(13px, 1.5vw, 16px)', color: C.red, ...kw }}>{x.right}</div>
                    <div style={{ fontSize: 'clamp(11.5px, 1.25vw, 13px)', color: 'var(--fg-muted)', marginTop: 4, ...kw }}>{x.foot}</div>
                  </div>
                </div>
              </Build>
            ))}
          </div>
        </div>
      </Slide>

      {/* S13 Krea Realtime 절차 (walkthrough) */}
      <Slide
        full
        nav="Krea 사용법"
        notes="직접 하기 전에 화면으로 한 번 보겠습니다. 프롬프트, 스케치, 강도, 시드. 이 넷만 만집니다. 시드는 아까 모형에서 만진 그 시드이고, 강도는 스케치에 노이즈를 얼마나 더하고 출발하느냐입니다. 비디오 버튼은 오늘 누르지 않습니다. — 실제 UI 라벨은 수업 전 무료 계정으로 열어 확인합니다."
      >
        <Scene>
          <KreaWalkthrough />
        </Scene>
      </Slide>

      {/* S14 실습 3라운드 */}
      <Slide
        nav="실습 30분"
        notes="먼저 접속 성공 여부부터 확인합니다. 2분 안에 안 되는 학생은 짝의 기기에서 번갈아 조작합니다. 라운드 1부터 시작합니다. Text Only로 프롬프트만, 시드는 고정하고 조건을 하나씩 덧붙이면서 무엇이 반영되는지 보세요. 사람 얼굴이나 작가 이름은 쓰지 않습니다. 비디오는 누르지 않아요. 결과를 제출하지는 않으니 마음껏 실험하되, 라운드가 끝날 때마다 짝에게 '고정한 것, 바꾼 것, 관찰한 것'을 한 문장으로 말합니다. 8분 뒤에 라운드 2로 넘어갑니다. 라운드 3의 강도 슬라이더는 모형의 단계 슬라이더에 빗대어 이해할 수 있지만 같은 값은 아닙니다. 전부 실패하면 미리 만든 비교 자료로 넘어가고, 각자 실시간 생성은 다음 기회에 보완합니다."
      >
        <div style={{ width: 'min(1180px, 100%)', marginInline: 'auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <Reveal>
              <Kicker>실습 · 30분 · 제출 없음 — 입력 둘(프롬프트·스케치) · 설정 둘(강도·시드)</Kicker>
              <h2 className="headline" style={{ marginTop: 8, ...kw }}>
                손잡이 <span className="accent-text">넷</span>을 돌려 본다
              </h2>
            </Reveal>
            <Reveal>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <LinkButton href={KREA_URL} label="krea.ai — Realtime" sub="구글 계정으로 로그인 · 무료 플랜" big />
                <LinkButton href={FLUX_URL} label="예비 — Realtime-FLUX" sub="프롬프트·시드 비교용 · 짝 교대가 우선" />
              </div>
            </Reveal>
          </div>
          <Build at={1}>
            <div style={{ ...card, marginTop: 'clamp(12px, 2vh, 20px)', padding: '10px 16px', display: 'flex', flexWrap: 'wrap', gap: '6px 22px', fontSize: 'clamp(12px, 1.3vw, 14px)', fontWeight: 700, color: 'var(--fg-muted)', ...kw }}>
              <span>출력은 <b style={{ color: C.red }}>Image</b>만 — Video 금지</span>
              <span>실존 인물의 얼굴 · 특정 작가 이름 · 타인의 작품은 프롬프트에 쓰지 않는다</span>
              <span>무료 한도(compute unit)가 있다 — 정해진 비교 상태만 생성하고, 연속 타이핑은 피한다</span>
              <span>접속이 2분 안에 안 되면 짝의 기기에서 번갈아 조작한다</span>
              <span>라운드마다 짝에게 한 문장 — 「고정한 것 / 바꾼 것 / 관찰한 것」</span>
            </div>
          </Build>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(10px, 1.6vw, 18px)', marginTop: 'clamp(12px, 2vh, 20px)', alignItems: 'flex-start' }}>
            {[
              { n: '라운드 1 · 8분', t: '프롬프트', b: 'Text Only 모드로(없으면 캔버스를 비운 채), 시드는 고정. "apple" → "a red apple on a wooden table" → "…, soft morning light, water drops"로 조건을 덧붙이며 빨강 · 탁자 · 빛 · 물방울이 각각 반영되는지 본다 (길이가 아니라 조건이 무엇을 바꾸는가)', link: '원리 → S11 ① 텍스트 조건 · S12 오해 ③', off: 0 },
              { n: '라운드 2 · 8분', t: '스케치', b: 'Draw 모드에서 원 도형 도구로 빨간 원 하나를 그리고, 선택 도구로 옮겨 본다. 사과가 그 자리로 오도록 유도되는가? (원 두 개면 프롬프트도 "two apples"로)', link: '원리 → S11 ② 이미지 조건', off: 26 },
              { n: '라운드 3 · 8분', t: '강도와 시드', b: '같은 스케치·프롬프트·시드로 AI Strength를 0.3 → 0.6 → 0.9로 올리며, 입력 원의 위치·색을 출력이 얼마나 유지하는지 비교한다(원이 남아도 정상). 마지막에 강도를 고정하고 Seed 버튼만 눌러 같은 설정의 다른 변형', link: '원리 → S11 ② 강도(효과의 비유) · S9 ④ 시드', off: 52 },
            ].map((r, i) => (
              <Build key={r.n} at={i + 2} style={{ flex: '1 1 min(280px, 100%)', minWidth: 0, marginTop: `clamp(0px, ${r.off / 10}vh, ${r.off}px)` }}>
                <div style={{ ...card, textAlign: 'left', height: '100%' }}>
                  <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 800, color: C.red }}>{r.n}</div>
                  <div style={{ fontWeight: 900, fontSize: 'clamp(16px, 2vw, 21px)', marginTop: 4, ...kw }}>{r.t}</div>
                  <div style={{ fontSize: 'clamp(12.5px, 1.4vw, 14.5px)', color: 'var(--fg-muted)', marginTop: 6, lineHeight: 1.55, ...kw }}>{r.b}</div>
                  <div style={{ fontFamily: mono, fontSize: 11, color: 'var(--fg-faint)', marginTop: 10, ...kw }}>{r.link}</div>
                </div>
              </Build>
            ))}
          </div>
        </div>
      </Slide>

      {/* S15 한눈 정리 — 두 계단 완성형 (live exit) */}
      <Slide
        center
        nav="정리"
        notes="첫 화면의 계단입니다. 이제 각 계단에 무엇이 있는지 다 아시죠. 학습과 생성을 같은 축으로 비교하면 — GAN은 학습 때 판별자의 평가를 신호로 쓰고 생성 때는 생성자만 한 번 통과합니다. 확산 모델은 학습 때 쓰인 노이즈를 예측하도록 훈련되고 생성 때 그 예측으로 단계를 내려옵니다. 여러분이 돌린 손잡이가 전부 이 계단 위에 있습니다. 한 문장만 남기고 갑니다 — 학습 때 무엇을 예측하고, 생성 때 그것을 어떻게 쓰나요? '노이즈 예측'과 '새 노이즈에서 그림을 만드는 데 쓴다'가 들어가면 됩니다. 짝에게 20초씩 GAN과의 차이도 말해 보세요."
      >
        <Reveal>
          <Kicker>한눈 정리</Kicker>
          <h2 className="headline" style={{ marginInline: 'auto', marginTop: 8, ...kw }}>
            GAN은 <span className="accent-text">판별자의 평가</span>로, 확산 모델은 <span className="accent-text">노이즈 예측</span>으로 배웠다
          </h2>
        </Reveal>
        <div style={{ marginTop: 'clamp(10px, 1.8vh, 20px)', display: 'flex', justifyContent: 'center' }}>
          <Staircase complete />
        </div>
        <Reveal>
          <div style={{ marginTop: 'clamp(8px, 1.4vh, 14px)' }}>
            <LiveTag kind="출구 티켓" text="오늘 배운 확산 모델은 학습 때 무엇을 예측하도록 훈련되고, 생성 때 그 예측을 어떻게 쓰나요? 한 문장으로 (힌트: 그림 파일을 저장한 것이 아닙니다)" />
          </div>
        </Reveal>
      </Slide>

      {/* S16 노이즈로 돌아가는 제목 (씬 · S1의 거울상) */}
      <Slide
        full
        nav="마무리"
        notes="제목이 다시 노이즈로 돌아갑니다. 정과정이죠. 오늘 배운 건, 확산 모델이 노이즈 속에 숨은 그림을 찾아낸 게 아니라 걷어내는 법을 배웠다는 겁니다. 다음 시간에는 두 방식 안에서도 쓰이는 트랜스포머가 말·그림·영상·소리를 어떻게 다루는지 봅니다. 수고하셨습니다."
      >
        <Scene>
          <TitleScene reverse />
        </Scene>
      </Slide>
    </Deck>
  );
}

/* S5의 사진 칸 — 정답 공개(클릭 1)는 클릭 수를 읽어 표시한다. 최대 클릭 수는 같은 슬라이드의 <Build at={1}>이 등록한다 */
function QuizPhotoSlot({ p }: { p: (typeof QUIZ_PHOTOS)[number] }) {
  const { clicks } = useDeckClicks();
  return <QuizPhoto p={p} revealed={clicks >= 1} />;
}
