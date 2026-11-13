import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import Deck from '../../../src/deck/Deck';
import Slide from '../../../src/deck/Slide';
import Build from '../../../src/deck/Build';
import { Scene, useSceneTime, interpolate, riseIn, easeOut, easeInOut } from '../../../src/scene';
import { AppWindow, Pointer, Caret, typed, typedDoneAt, clickFlash, popIn, type CursorKey } from '../../../src/walkthrough';
import { NOTES } from './notes';

/* ── AI전문적학습동아리 — AI 시대, 교사의 자리 (교사 연수, 17장) ─────────────
   plan: ./plan.md — 단일 진실 원천. 원천 자료는 ./source.md (연수 손글씨 노트 판독본).
   발표자 노트는 ./notes.ts (plan.md에서 다시 뽑는다).

   1~8    현재·미래 대화: 교무수첩(scene) → 번지는 잉크(scene) → 피지컬 AI(build)
          → 대신할까(build+live) → 지침은 나왔지만(static) → 학생이 앞서 간다(build)
          → ○○여고 사례(자리표시) → 한 주 시간표와 서랍(scene+live)
   9~14   실습: 써 보자(static) → 1단계 시연(walkthrough) → 1단계 과제(build)
          → 2단계 총보(scene) → 지휘 대본(build) → 익숙해지는 곡선(build+live)
   15~17  성찰: 세 지류의 합류(scene) → 인간의 문제(build) → 나침반(scene+live)

   테마: 줄무늬 노트 종이(원천 노트에 대한 오마주) + 인디고 잉크 + 코랄 펜.
   좌표는 전부 1920×1080 설계 박스 px. 색은 C.* 별칭과 var(--…) 토큰만. */

const DW = 1920;
const DH = 1080;

/* ── Fit — 1920×1080 설계 박스를 화면에 맞춰 배율 변환 ── */
function Fit({ children }: { children: ReactNode }) {
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
    <div ref={ref} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: DW,
          height: DH,
          transform: `translate(-50%, -50%) scale(${k})`,
          transformOrigin: 'center',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── 덱 색 — registry 테마와 같은 값 ── */
const C = {
  ink: '#1b2133', // --fg
  indigo: '#3b4cc0', // --primary · 잉크 · 사람이 쥐는 것
  indigoSoft: 'rgba(59,76,192,0.12)',
  coral: '#d9673f', // 펜 메모 · 경고 · 검토
  coralSoft: 'rgba(217,103,63,0.14)',
  olive: '#6f8a1f', // 조건 · 아이디어
  oliveSoft: 'rgba(111,138,31,0.14)',
  teal: '#23847d', // 형식 · 문제 인식
  tealSoft: 'rgba(35,132,125,0.14)',
  paper: '#f6f3e6', // --bg
  stripe: '#ebefd3', // 노트 줄무늬
  card: '#fffdf5',
};

/* ── Page — 모든 장의 바깥 껍질: full Slide + Fit + 줄무늬 노트 종이 ── */
function Page({ nav, notes, children }: { nav: string; notes: string; children: ReactNode }) {
  return (
    <Slide full nav={nav} notes={notes}>
      <Fit>
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: `repeating-linear-gradient(180deg, ${C.paper} 0 54px, ${C.stripe} 54px 108px)`,
          }}
        />
        {children}
      </Fit>
    </Slide>
  );
}

/* ── 좌표·스타일 아톰 ── */
const abs = (x: number, y: number, w?: number, h?: number): CSSProperties => ({
  position: 'absolute',
  left: x,
  top: y,
  width: w,
  height: h,
});

const kick: CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  letterSpacing: '0.14em',
  color: C.indigo,
};
const h1: CSSProperties = {
  fontFamily: 'var(--font-head)',
  fontWeight: 800,
  letterSpacing: '-0.03em',
  lineHeight: 1.12,
  fontSize: 62,
  wordBreak: 'keep-all',
  color: C.ink,
  margin: 0,
};
const body: CSSProperties = { fontSize: 24, lineHeight: 1.5, color: 'var(--fg-muted)', wordBreak: 'keep-all' };
const small: CSSProperties = { fontSize: 17, lineHeight: 1.45, color: 'var(--fg-faint)', wordBreak: 'keep-all' };
const card: CSSProperties = {
  background: C.card,
  border: `1.5px solid rgba(27,33,51,0.16)`,
  borderRadius: 18,
  boxShadow: '0 18px 44px -30px rgba(27,33,51,0.45)',
};
const easeSpring = 'cubic-bezier(0.16, 1, 0.3, 1)';
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

const HAND_FONT_ID = 'ai-era-teacher-hand-font';
function useHandFont() {
  useEffect(() => {
    if (document.getElementById(HAND_FONT_ID)) return;
    const l = document.createElement('link');
    l.id = HAND_FONT_ID;
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap';
    document.head.appendChild(l);
  }, []);
}
const hand: CSSProperties = { fontFamily: "'Nanum Pen Script', var(--font-head)", wordBreak: 'keep-all', lineHeight: 1.15 };

/* 장 머리: 킥커 + 제목 (왼쪽 위 텍스트 밴드, y 64~170) */
function Head({ kicker, title, width = 1200, x = 140, y = 64 }: { kicker: string; title: ReactNode; width?: number; x?: number; y?: number }) {
  return (
    <div style={{ ...abs(x, y, width) }}>
      <div style={kick}>{kicker}</div>
      <h2 style={{ ...h1, marginTop: 10 }}>{title}</h2>
    </div>
  );
}

/* 정식 용어 + 한 문장 풀이 칩 (ELI5: 용어는 나오는 즉시 풀이) */
function Term({ term, gloss, color = C.indigo, size = 22, style }: { term: string; gloss: string; color?: string; size?: number; style?: CSSProperties }) {
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 6, ...style }}>
      <span
        style={{
          alignSelf: 'flex-start',
          padding: `${size * 0.22}px ${size * 0.7}px`,
          borderRadius: 999,
          background: `color-mix(in srgb, ${color} 14%, transparent)`,
          border: `1.5px solid ${color}`,
          color,
          fontWeight: 800,
          fontSize: size,
          whiteSpace: 'nowrap',
        }}
      >
        {term}
      </span>
      <span style={{ ...small, fontSize: size * 0.86, color: 'var(--fg-muted)' }}>{gloss}</span>
    </div>
  );
}

const pill = (color: string, size = 20): CSSProperties => ({
  display: 'inline-block',
  padding: `${size * 0.24}px ${size * 0.72}px`,
  borderRadius: 999,
  background: `color-mix(in srgb, ${color} 14%, transparent)`,
  border: `1.5px solid ${color}`,
  color,
  fontWeight: 800,
  fontSize: size,
  whiteSpace: 'nowrap',
  lineHeight: 1.2,
});

/* 라이브 문항이 붙은 장의 작은 표지 */
function LiveTag({ text, style }: { text: string; style?: CSSProperties }) {
  return (
    <div style={{ ...pill(C.coral, 17), display: 'inline-flex', alignItems: 'center', gap: 8, ...style }}>
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: C.coral }} />
      {text}
    </div>
  );
}

/* 사진 카드 (폴라로이드풍) — 출처 한 줄을 반드시 함께 */
function Photo({ src, alt, w, h, caption, credit, rotate = 0, style }: { src: string; alt: string; w: number; h: number; caption: string; credit: string; rotate?: number; style?: CSSProperties }) {
  return (
    <figure
      style={{
        margin: 0,
        width: w,
        padding: 14,
        paddingBottom: 12,
        background: '#ffffff',
        borderRadius: 6,
        boxShadow: '0 26px 60px -32px rgba(27,33,51,0.55)',
        transform: `rotate(${rotate}deg)`,
        ...style,
      }}
    >
      <img src={src} alt={alt} style={{ display: 'block', width: '100%', height: h, objectFit: 'cover', borderRadius: 2 }} />
      <figcaption style={{ marginTop: 10 }}>
        <div style={{ fontSize: 21, fontWeight: 700, color: C.ink, wordBreak: 'keep-all' }}>{caption}</div>
        <div style={{ ...small, fontSize: 14, marginTop: 2 }}>{credit}</div>
      </figcaption>
    </figure>
  );
}

/* 손으로 그은 밑줄 (clip inset로 왼→오) */
function HandLine({ w, color, k, style, thick = 7 }: { w: number; color: string; k: number; style?: CSSProperties; thick?: number }) {
  return (
    <svg style={{ ...style, width: w, height: 24, overflow: 'visible' }} viewBox={`0 0 ${w} 24`} aria-hidden>
      <path
        d={`M4 14 C ${w * 0.18} 6, ${w * 0.36} 18, ${w * 0.52} 11 S ${w * 0.84} 8, ${w - 6} 13`}
        fill="none"
        stroke={color}
        strokeWidth={thick}
        strokeLinecap="round"
        style={{ clipPath: `inset(0 ${(1 - Math.max(0, Math.min(1, k))) * 100}% 0 0)` }}
      />
    </svg>
  );
}

/* ── 경로·자산 (서빙 URL — 번들 import 금지) ── */
const BASE = 'data/AI전문적학습동아리/AI시대-교사의-자리';
const PHOTO = {
  waymo: 'data/2026-2/인공지능기초/인공지능이-바꾸는-세상/images/waymo-street.jpg',
  atlas: 'data/2026-2/인공지능기초/인공지능이-바꾸는-세상/images/atlas-robot.jpg',
};
/** 손그림 SVG 소품 (svg-asset-builder · clean-hand-illustration) */
const SVG = {
  /** 옆에서 본 지휘봉 — viewBox 0 0 520 120, 지휘 끝 (506,60) */
  baton: 'assets/svg/conductor-baton.svg',
  /** 위에서 본 황동 나침반 — viewBox 0 0 400 420, 중심 (200,230), 바늘 끝 (283,147) */
  compass: 'assets/svg/brass-compass.svg',
};
const LOGO = { anthropic: 'assets/external/anthropic.svg', openai: 'assets/external/openai.png' };
const URL_CLAUDE = 'https://claude.ai';
const URL_CHATGPT = 'https://chatgpt.com';
/** 연수에서 본 영상 — plan.md F3·F4. 사용자에게 받으면 채운다. 비어 있으면 영상 버튼을 그리지 않는다 */
const VIDEO_SELF_DRIVING = '';
const VIDEO_STARTUP = '';
void BASE;

/* ═══════════════════════ S01 · 교무수첩 메모 (scene) ═══════════════════════ */
function S01Body() {
  const t = useSceneTime();
  const reveal = (a: number, b: number): CSSProperties => ({ clipPath: `inset(-10% ${interpolate(t, [a, b], [100, 0], easeOut)}% -10% 0)` });
  const parts = [
    { n: '①', k: '대화', d: 'AI는 어디까지 왔나' },
    { n: '②', k: '실습', d: '직접 시켜 보기' },
    { n: '③', k: '성찰', d: '교사의 자리' },
  ];
  return (
    <>
      {/* 노트 여백선 */}
      <div style={{ ...abs(108, 0, 3, 1080), background: C.coral, opacity: 0.32 }} />
      <div style={{ ...abs(150, 176), ...kick, opacity: interpolate(t, [0.1, 0.5], [0, 1]) }}>AI 전문적 학습동아리 · 연수</div>
      <div style={{ ...abs(150, 226, 1100), ...h1, fontSize: 136, lineHeight: 1.08 }}>
        <div style={reveal(0.3, 1.1)}>AI 시대,</div>
        <div style={{ ...reveal(1.0, 1.9), color: C.indigo }}>교사의 자리</div>
      </div>
      <HandLine w={690} color={C.coral} k={interpolate(t, [1.9, 2.5], [0, 1])} style={{ ...abs(150, 522) }} thick={8} />
      <div style={{ ...abs(150, 580, 1000), ...body, fontSize: 38, color: C.ink, fontWeight: 500, ...riseIn(t, 2.1, 0.8) }}>
        현재·미래 대화 그리고 직접 써 보기
      </div>
      <div style={{ ...abs(150, 700), display: 'flex', gap: 26 }}>
        {parts.map((p, i) => (
          <div
            key={p.k}
            style={{
              ...card,
              width: 330,
              padding: '18px 26px 20px',
              transform: `rotate(${[-1.2, 0.8, -0.6][i]}deg)`,
              ...riseIn(t, 2.6 + i * 0.35, 0.8, 22),
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ ...hand, fontSize: 48, color: C.coral }}>{p.n}</span>
              <span style={{ fontSize: 34, fontWeight: 800, color: C.ink }}>{p.k}</span>
            </div>
            <div style={{ ...body, fontSize: 22, marginTop: 2 }}>{p.d}</div>
          </div>
        ))}
      </div>
      {/* 오른쪽 위 · 원천 노트의 첫 두 줄 */}
      <div style={{ ...abs(1300, 176, 560) }}>
        <div style={{ ...hand, fontSize: 56, color: C.coral, ...riseIn(t, 3.3, 0.7, 14) }}>* 계정: Claude 또는 ChatGPT</div>
        <div style={{ ...hand, fontSize: 56, color: C.coral, marginTop: 6, ...riseIn(t, 3.8, 0.7, 14) }}>* 노트북 지참</div>
      </div>
      <div style={{ ...abs(1300, 340, 520), ...small, fontSize: 20, ...riseIn(t, 4.3, 0.7, 10) }}>
        실습이 있습니다. 로그인까지 미리 해 두세요.
      </div>
      <div style={{ ...abs(1640, 960), ...hand, fontSize: 40, color: 'var(--fg-faint)', opacity: interpolate(t, [4.4, 5], [0, 1]) }}>2026. 10.</div>
    </>
  );
}
function S01() {
  return (
    <Scene freezeAt={5.2} duration={5.2}>
      <S01Body />
    </Scene>
  );
}

/* ═══════════════════════ S02 · 번지는 잉크 (scene) ═══════════════════════ */
const S02_BOX = { x: 300, y: 250, w: 1180, h: 640 };
const S02_JOBS = [
  { k: '문서 작성', ex: '가정통신문 · 공문', x: 500, y: 400 },
  { k: '요약', ex: '연수 자료 · 회의록', x: 880, y: 350 },
  { k: '번역', ex: '다문화 가정 안내문', x: 1260, y: 440 },
  { k: '자료 정리', ex: '출결 · 성적 표', x: 560, y: 720 },
  { k: '코딩', ex: '반복 업무 자동화', x: 940, y: 630 },
  { k: '이미지 만들기', ex: '수업 자료 삽화', x: 1290, y: 770 },
];
const S02_LIGHT = (i: number) => 0.6 + i * 0.25;
const S02_DARK = (i: number) => 4.2 + i * 0.3;
function S02Body() {
  const t = useSceneTime();
  const B = S02_BOX;
  return (
    <>
      <Head kicker="현재 · 미래 대화" title="할 수 있다에서, 잘한다로" />
      {/* 범례 */}
      <div style={{ ...abs(1040, 168), display: 'flex', gap: 14 }}>
        <span style={{ ...pill(C.indigo, 20), background: 'rgba(59,76,192,0.16)', opacity: interpolate(t, [0.5, 1], [0, 1]) }}>할 수 있다 · 흉내 수준</span>
        <span style={{ ...pill(C.indigo, 20), background: C.indigo, color: '#fff', opacity: interpolate(t, [4.1, 4.6], [0, 1]) }}>잘한다 · 믿고 맡길 수준</span>
      </div>
      <svg style={{ ...abs(0, 0, DW, DH) }} viewBox={`0 0 ${DW} ${DH}`} aria-hidden>
        <defs>
          <filter id="s02-ink" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="7" />
            <feDisplacementMap in="SourceGraphic" scale="38" />
          </filter>
          <clipPath id="s02-clip">
            <rect x={B.x} y={B.y} width={B.w} height={B.h} rx={36} />
          </clipPath>
        </defs>
        <rect x={B.x} y={B.y} width={B.w} height={B.h} rx={36} fill={C.card} />
        <g clipPath="url(#s02-clip)">
          <g filter="url(#s02-ink)">
            {S02_JOBS.map((j, i) => (
              <circle key={`l${i}`} cx={j.x} cy={j.y} r={interpolate(t, [S02_LIGHT(i), S02_LIGHT(i) + 2], [0, 190], easeOut)} fill={C.indigo} opacity={0.14} />
            ))}
            {S02_JOBS.map((j, i) => (
              <circle key={`d${i}`} cx={j.x} cy={j.y} r={interpolate(t, [S02_DARK(i), S02_DARK(i) + 1.4], [0, 122], easeOut)} fill={C.indigo} opacity={0.92} />
            ))}
          </g>
        </g>
        <rect x={B.x} y={B.y} width={B.w} height={B.h} rx={36} fill="none" stroke={C.ink} strokeWidth={3} />
        {/* 상자 밖으로 향하는 점선 (다음 장 예고) */}
        <g opacity={interpolate(t, [7.8, 8.4], [0, 1])}>
          <path d={`M ${B.x + B.w + 16} 560 L 1760 560`} stroke={C.coral} strokeWidth={4} strokeDasharray="12 12" fill="none" />
          <path d="M 1760 560 L 1736 546 M 1760 560 L 1736 574" stroke={C.coral} strokeWidth={4} strokeLinecap="round" fill="none" />
        </g>
      </svg>
      <div style={{ ...abs(B.x + 6, B.y - 34), ...kick, color: 'var(--fg-muted)' }}>컴퓨터 안의 일</div>
      <div style={{ ...abs(1530, 600, 280), ...body, fontSize: 24, color: 'var(--fg-faint)', fontWeight: 700, opacity: interpolate(t, [7.8, 8.4], [0, 1]) }}>
        컴퓨터 밖의 일
        <div style={{ fontSize: 18, fontWeight: 500 }}>아직 비어 있는 곳</div>
      </div>
      {S02_JOBS.map((j, i) => {
        const p = interpolate(t, [S02_DARK(i) + 0.55, S02_DARK(i) + 1.0], [0, 1]);
        const lbl = (color: string, exColor: string, op: number) => (
          <div style={{ position: 'absolute', inset: 0, textAlign: 'center', opacity: op }}>
            <div style={{ fontSize: 36, fontWeight: 800, color, wordBreak: 'keep-all' }}>{j.k}</div>
            <div style={{ fontSize: 19, color: exColor, marginTop: 2, wordBreak: 'keep-all' }}>{j.ex}</div>
          </div>
        );
        return (
          <div key={j.k} style={{ ...abs(j.x - 150, j.y - 38, 300, 90), opacity: interpolate(t, [0.2 + i * 0.12, 0.6 + i * 0.12], [0, 1]) }}>
            {lbl(C.ink, 'var(--fg-muted)', 1 - p)}
            {lbl('#ffffff', 'rgba(255,255,255,0.85)', p)}
          </div>
        );
      })}
      <div style={{ ...abs(B.x, B.y + B.h + 18, 900), ...hand, fontSize: 52, color: C.coral, ...riseIn(t, 7.4, 0.7, 14) }}>
        특히 컴퓨터로 하는 일이면 더!
      </div>
    </>
  );
}
function S02() {
  return (
    <Scene freezeAt={8.8} duration={8.8} markers={[{ time: 0.6, label: '할 수 있다' }, { time: 4.2, label: '잘한다' }, { time: 7.4, label: '특히 컴퓨터로' }]}>
      <S02Body />
    </Scene>
  );
}

/* ═══════════════════════ S03 · 컴퓨터 바깥으로 (build) ═══════════════════════ */
function S03() {
  return (
    <>
      <Head kicker="현재 · 미래 대화" title="컴퓨터 바깥으로" />
      {/* 왼쪽: 2쪽 상자의 오른쪽 테두리만 남는다 + 그것을 뚫고 나가는 화살표 */}
      <svg style={{ ...abs(0, 0, DW, DH) }} viewBox={`0 0 ${DW} ${DH}`} aria-hidden>
        <rect x={-400} y={250} width={700} height={620} rx={36} fill={C.card} stroke={C.ink} strokeWidth={3} opacity={0.75} />
        <path d="M 300 520 L 316 536 M 300 600 L 318 588" stroke={C.coral} strokeWidth={4} strokeLinecap="round" />
        <path d="M 260 560 L 800 560" stroke={C.coral} strokeWidth={7} strokeLinecap="round" />
        <path d="M 806 560 L 774 540 L 778 560 L 774 580 Z" fill={C.coral} stroke={C.coral} strokeWidth={4} strokeLinejoin="round" />
      </svg>
      <div style={{ ...abs(130, 290), ...kick, color: 'var(--fg-faint)' }}>컴퓨터 안</div>
      <div style={{ ...abs(330, 470, 460), ...hand, fontSize: 48, color: C.coral }}>컴퓨터 바깥의 일도 곧</div>
      <div style={{ ...abs(330, 588, 470), ...body, fontSize: 26, color: C.ink, fontWeight: 700 }}>로봇 → 피지컬 AI</div>
      <Build at={1} style={{ ...abs(830, 196), zIndex: 2 }}>
        <Photo
          src={PHOTO.waymo}
          alt="샌프란시스코 도심을 달리는 운전석이 빈 자율주행 택시"
          w={760}
          h={440}
          rotate={-2}
          caption="운전석이 빈 자율주행 택시 · 샌프란시스코 (2026.1)"
          credit="사진: 4300streetcar · CC BY 4.0 · Wikimedia Commons"
        />
      </Build>
      <Build at={2} style={{ ...abs(1418, 560), zIndex: 3 }}>
        <Photo
          src={PHOTO.atlas}
          alt="전시장의 휴머노이드 로봇 Atlas"
          w={400}
          h={300}
          rotate={3}
          caption="휴머노이드 로봇 Atlas"
          credit="사진: Damian B Oh · CC BY-SA 4.0 · Wikimedia Commons"
        />
      </Build>
      <Build at={3} style={{ ...abs(330, 670, 490), zIndex: 4 }}>
        <div style={{ ...card, padding: '24px 26px' }}>
          <Term term="피지컬 AI" gloss="현실을 보고 판단해 몸으로 움직이는 AI" size={26} />
          <div style={{ ...small, fontSize: 18, marginTop: 14 }}>CES 2025에서 NVIDIA가 「다음 물결」로 소개 · 대표 사례는 로봇과 자율주행</div>
        </div>
      </Build>
      {VIDEO_SELF_DRIVING && (
        <Build at={4} style={{ ...abs(830, 940), zIndex: 5 }}>
          <a href={VIDEO_SELF_DRIVING} target="_blank" rel="noopener" style={{ ...pill(C.coral, 24), background: C.coral, color: '#fff', textDecoration: 'underline' }}>
            ▶ 자율주행 영상 보기 (새 탭)
          </a>
        </Build>
      )}
    </>
  );
}

/* ═══════════════════════ S04 · 대신할까? (build + live) ═══════════════════════ */
function S04() {
  return (
    <>
      <div style={{ ...abs(140, 90), ...kick }}>현재 · 미래 대화</div>
      <h2 style={{ ...abs(140, 140, 1500), ...h1, fontSize: 104 }}>
        인공지능이 <span style={{ color: C.indigo }}>사람을 대신할까?</span>
      </h2>
      <div style={{ ...abs(140, 330, 4, 560), background: 'rgba(27,33,51,0.18)' }} />
      <Build at={1} style={{ ...abs(200, 380, 1400) }}>
        <div style={{ fontSize: 50, fontWeight: 700, color: C.ink, wordBreak: 'keep-all' }}>걱정과 우려는 가져야 한다</div>
        <div style={{ ...body, fontSize: 24, marginTop: 6 }}>일자리 · 표절 · 의존, 모두 진짜 문제다</div>
      </Build>
      <Build at={2} style={{ ...abs(200, 560, 1500) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 50, fontWeight: 700, color: C.ink, wordBreak: 'keep-all' }}>하지만 개발은 멈추지 않을 것으로 보인다</span>
          <span style={pill(C.coral, 22)}>예측</span>
        </div>
        <HandLine w={900} color={C.coral} k={1} style={{ marginTop: 2 }} />
        <div style={{ marginTop: 18 }}>
          <LiveTag text="실시간 투표 · 교사의 일을 얼마나 대신하게 될까?" />
        </div>
      </Build>
      <Build at={3} style={{ ...abs(200, 820, 1600) }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 34 }}>
          <span style={{ fontSize: 46, fontWeight: 700, color: 'var(--fg-faint)', textDecoration: 'line-through', textDecorationColor: C.coral, textDecorationThickness: 5 }}>
            멈출까?
          </span>
          <span style={{ fontSize: 46, color: C.coral, fontWeight: 800 }}>→</span>
          <span style={{ ...h1, fontSize: 72, color: C.indigo }}>어떻게 함께 갈까?</span>
        </div>
      </Build>
    </>
  );
}

/* ═══════════════════════ S05 · 지침은 나왔지만 (static) ═══════════════════════ */
const S05_RULES = [
  { n: '1', t: '활용 범위를 교과별로 정하고 학생에게 미리 안내한다' },
  { n: '2', t: 'AI 활용 과정을 기록해 함께 제출하게 한다', sub: '사용한 프로그램 · 입력한 질문 · 받은 결과 · 반영한 방법' },
  { n: '3', t: 'AI가 만든 결과물을 그대로 제출하면 부정행위로 본다' },
];
function S05() {
  return (
    <>
      <div style={{ ...abs(140, 64), ...kick }}>마냥 기뻐할 것인가? 교육은 어떻게?</div>
      <h2 style={{ ...abs(140, 100, 1100), ...h1 }}>지침은 나왔지만</h2>
      {/* 공문 양식 카드 (dominant) */}
      <div style={{ ...abs(140, 250, 1000, 590), ...card, background: '#ffffff', borderRadius: 8, transform: 'rotate(-1.2deg)', padding: '44px 52px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: `3px double ${C.ink}`, paddingBottom: 14 }}>
          <div style={{ fontSize: 34, fontWeight: 800, color: C.ink, wordBreak: 'keep-all' }}>수행평가 AI 활용 유의사항</div>
          <div style={{ ...small, fontSize: 18 }}>2026학년도 학업성적관리 시행지침</div>
        </div>
        <div style={{ marginTop: 44, display: 'grid', gap: 46 }}>
          {S05_RULES.map((r) => (
            <div key={r.n} style={{ display: 'flex', gap: 22 }}>
              <span style={{ flexShrink: 0, width: 46, height: 46, borderRadius: '50%', border: `2.5px solid ${C.ink}`, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 24 }}>{r.n}</span>
              <div>
                <div style={{ fontSize: 34, fontWeight: 600, color: C.ink, lineHeight: 1.4, wordBreak: 'keep-all' }}>{r.t}</div>
                {r.sub && <div style={{ ...body, fontSize: 24, marginTop: 6 }}>{r.sub}</div>}
              </div>
            </div>
          ))}
        </div>
        <div style={{ ...small, fontSize: 15, position: 'absolute', left: 52, bottom: 26, right: 52 }}>
          2026학년도 시·도교육청 학업성적관리 시행지침 개정 보도(2026.2)의 요지 · 우리 교육청 지침은 원문으로 확인
        </div>
      </div>
      {/* 펜 메모 (secondary) */}
      <div style={{ ...abs(1230, 300, 620) }}>
        <div style={{ ...hand, fontSize: 64, color: C.coral }}>막는 규칙 ✓</div>
        <div style={{ ...hand, fontSize: 64, color: C.coral, marginTop: 4 }}>키우는 방향 ?</div>
      </div>
      <svg style={{ ...abs(1160, 560, 640, 260) }} viewBox="0 0 640 260" aria-hidden>
        <ellipse cx={360} cy={120} rx={250} ry={78} fill="none" stroke={C.coral} strokeWidth={5} transform="rotate(-4 360 120)" />
        <path d="M 120 150 C 80 180 50 190 10 196" stroke={C.coral} strokeWidth={5} fill="none" strokeLinecap="round" />
        <path d="M 10 196 L 34 178 M 10 196 L 36 206" stroke={C.coral} strokeWidth={5} strokeLinecap="round" />
      </svg>
      <div style={{ ...abs(1250, 638, 480), ...hand, fontSize: 70, color: C.coral, textAlign: 'center' }}>단편적인 대응</div>
      <div style={{ ...abs(1230, 830, 600), ...body, fontSize: 24, color: C.ink }}>
        무엇을 <b>하면 안 되는지</b>는 알려 주지만,
        <br />
        무엇을 <b style={{ color: C.indigo }}>할 수 있게 키울지</b>는 비어 있다
      </div>
    </>
  );
}

/* ═══════════════════════ S06 · 학생이 앞서 간다 (build) ═══════════════════════ */
function S06() {
  const Y = 650;
  return (
    <>
      <Head kicker="현재 · 미래 대화" title="아이들은 이미 앞서 가고 있다" width={1100} />
      <svg style={{ ...abs(0, 0, DW, DH) }} viewBox={`0 0 ${DW} ${DH}`} aria-hidden>
        <path d={`M 140 ${Y} L 1780 ${Y}`} stroke={C.coral} strokeWidth={4} strokeDasharray="14 12" />
        <circle cx={330} cy={Y} r={18} fill={C.card} stroke={C.ink} strokeWidth={4} />
      </svg>
      <div style={{ ...abs(250, Y + 34, 160), textAlign: 'center', fontSize: 30, fontWeight: 800, color: C.ink }}>지침</div>
      <Build at={1} style={{ ...abs(0, 0, DW, DH), pointerEvents: 'none' }}>
        <svg style={{ ...abs(0, 0, DW, DH) }} viewBox={`0 0 ${DW} ${DH}`} aria-hidden>
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M ${1060 + i * 90} ${Y - 18 + i * 18} L ${1380 + i * 20} ${Y - 18 + i * 18}`} stroke={C.indigo} strokeWidth={4} strokeLinecap="round" opacity={0.25 + i * 0.12} />
          ))}
          <circle cx={1460} cy={Y} r={30} fill={C.indigo} />
          <path d={`M 360 ${Y + 120} L 1430 ${Y + 120}`} stroke={C.ink} strokeWidth={2} opacity={0.35} />
          <path d={`M 360 ${Y + 108} L 360 ${Y + 132} M 1430 ${Y + 108} L 1430 ${Y + 132}`} stroke={C.ink} strokeWidth={2} opacity={0.35} />
        </svg>
        <div style={{ ...abs(1360, Y + 44, 200), textAlign: 'center', fontSize: 30, fontWeight: 800, color: C.indigo }}>학생</div>
        <div style={{ ...abs(760, Y + 132, 300), textAlign: 'center', ...small, fontSize: 20 }}>속도의 차이</div>
        <div style={{ ...abs(140, 250, 1000), fontSize: 46, fontWeight: 700, color: C.ink, lineHeight: 1.35, wordBreak: 'keep-all' }}>
          AI를 잘 활용하는 학생들은
          <br />
          <span style={{ color: C.indigo }}>개인 사업</span>에 도전하고 있다
        </div>
      </Build>
      <Build at={2} style={{ ...abs(1240, 196, 540), zIndex: 3 }}>
        {VIDEO_STARTUP ? (
          <a href={VIDEO_STARTUP} target="_blank" rel="noopener" style={{ display: 'block', ...card, padding: 22, textDecoration: 'none' }}>
            <div style={{ ...pill(C.coral, 22), background: C.coral, color: '#fff' }}>▶ 영상 보기 (새 탭)</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.ink, marginTop: 14, textDecoration: 'underline' }}>학교를 그만두고 창업한 학생 이야기</div>
          </a>
        ) : (
          <div style={{ height: 304, borderRadius: 18, border: `3px dashed ${C.coral}`, background: 'rgba(255,255,255,0.6)', display: 'grid', placeItems: 'center', textAlign: 'center', padding: 30 }}>
            <div>
              <div style={{ ...hand, fontSize: 48, color: C.coral }}>영상 자리</div>
              <div style={{ ...body, fontSize: 21, marginTop: 6 }}>연수에서 본 「자퇴 후 창업」 영상 링크를 넣는다</div>
            </div>
          </div>
        )}
      </Build>
      <Build at={3} style={{ ...abs(140, 880, 1400) }}>
        <div style={{ ...h1, fontSize: 64 }}>
          규칙보다 <span style={{ color: C.indigo }}>학생이 빠르다</span>
        </div>
        <HandLine w={620} color={C.coral} k={1} />
      </Build>
    </>
  );
}

/* ═══════════════════════ S07 · ○○여고의 사례 (자리표시) ═══════════════════════ */
function S07() {
  return (
    <>
      <div style={{ ...abs(108, 0, 3, 1080), background: C.coral, opacity: 0.32 }} />
      <div style={{ ...abs(150, 90), ...kick }}>현재 · 미래 대화</div>
      <h2 style={{ ...abs(150, 130, 1200), ...h1, fontSize: 80 }}>○○여고의 사례</h2>
      <div style={{ ...abs(150, 300, 760, 520), borderRadius: 16, border: '3px dashed rgba(27,33,51,0.3)', display: 'grid', placeItems: 'center' }}>
        <div style={{ ...hand, fontSize: 46, color: 'var(--fg-faint)' }}>사진 자리</div>
      </div>
      <div style={{ ...abs(1000, 330, 780) }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ height: 108, borderBottom: '2px solid rgba(27,33,51,0.22)' }} />
        ))}
        <div style={{ ...hand, fontSize: 40, color: C.coral, marginTop: 30 }}>사례 내용을 받으면 채웁니다</div>
      </div>
    </>
  );
}

/* ═══════════════════════ S08 · 한 주 시간표와 서랍 (scene + live) ═══════════════════════ */
type S08Cell = { l: string; k: 'ai' | 'h' | 'c' };
const S08_GRID: S08Cell[][] = [
  [{ l: '수업', k: 'c' }, { l: '공문 초안', k: 'ai' }, { l: '수업', k: 'c' }, { l: '자료 요약', k: 'ai' }, { l: '수업', k: 'c' }],
  [{ l: '가정통신문', k: 'ai' }, { l: '수업', k: 'c' }, { l: '학생 상담', k: 'h' }, { l: '수업', k: 'c' }, { l: '문항 초안', k: 'ai' }],
  [{ l: '수업', k: 'c' }, { l: '채점 보조', k: 'ai' }, { l: '수업', k: 'c' }, { l: '학부모 상담', k: 'h' }, { l: '수업', k: 'c' }],
  [{ l: '생활 지도', k: 'h' }, { l: '수업', k: 'c' }, { l: '회의록 정리', k: 'ai' }, { l: '수업', k: 'c' }, { l: '출결 정리', k: 'ai' }],
  [{ l: '수업', k: 'c' }, { l: '학생 관찰', k: 'h' }, { l: '수업', k: 'c' }, { l: '평가 확정', k: 'h' }, { l: '수업', k: 'c' }],
  [{ l: '자료 찾기', k: 'ai' }, { l: '동료 협의', k: 'h' }, { l: '행사 계획', k: 'ai' }, { l: '수업', k: 'c' }, { l: '기록 검토', k: 'h' }],
];
const S08_G = { x0: 150, y0: 300, cw: 222, ch: 92, gx: 12, gy: 12 };
const s08Pos = (r: number, c: number) => ({ x: S08_G.x0 + c * (S08_G.cw + S08_G.gx), y: S08_G.y0 + r * (S08_G.ch + S08_G.gy) });
const S08_AI = S08_GRID.flatMap((row, r) => row.map((cell, c) => ({ ...cell, r, c }))).filter((x) => x.k === 'ai');
const S08_FLY = (i: number) => 0.8 + i * 0.45;
const S08_DRAWER = { x: 1450, y: 330, w: 360, h: 430 };
const s08Slot = (i: number) => ({ x: S08_DRAWER.x + 24 + (i % 2) * 160, y: S08_DRAWER.y + 30 + Math.floor(i / 2) * 52 });
const S08_HUMAN_AT = 5.8;
const S08_CHALLENGE = [0, 3, 7]; // S08_AI 인덱스 — 비어 버린 칸에 「도전」이 적힌다
const S08_CH_AT = (j: number) => 7.3 + j * 0.4;
function S08Body() {
  const t = useSceneTime();
  const G = S08_G;
  const D = S08_DRAWER;
  const human = interpolate(t, [S08_HUMAN_AT, S08_HUMAN_AT + 0.9], [0, 1], easeOut);
  return (
    <>
      <Head kicker="AI가 못하는 것" title="그렇다면 교사는?" />
      {/* 요일 머리 */}
      {['월', '화', '수', '목', '금'].map((d, c) => (
        <div key={d} style={{ ...abs(G.x0 + c * (G.cw + G.gx), 250, G.cw), textAlign: 'center', fontSize: 24, fontWeight: 800, color: 'var(--fg-muted)' }}>
          {d}
        </div>
      ))}
      {/* 칸 */}
      {S08_GRID.map((row, r) =>
        row.map((cell, c) => {
          const p = s08Pos(r, c);
          if (cell.k === 'ai')
            return <div key={`${r}-${c}`} style={{ ...abs(p.x, p.y, G.cw, G.ch), borderRadius: 12, border: '2.5px dashed rgba(27,33,51,0.25)' }} />;
          const isH = cell.k === 'h';
          return (
            <div
              key={`${r}-${c}`}
              style={{
                ...abs(p.x, p.y, G.cw, G.ch),
                borderRadius: 12,
                display: 'grid',
                placeItems: 'center',
                fontSize: isH ? 26 : 22,
                fontWeight: isH ? 800 : 600,
                background: isH ? `color-mix(in srgb, ${C.indigo} ${Math.round(8 + human * 92)}%, ${C.card})` : 'rgba(255,253,245,0.7)',
                color: isH ? (human > 0.5 ? '#ffffff' : C.ink) : 'var(--fg-faint)',
                border: `1.5px solid ${isH ? C.indigo : 'rgba(27,33,51,0.14)'}`,
                boxShadow: isH && human > 0.5 ? '0 14px 30px -18px rgba(59,76,192,0.8)' : 'none',
              }}
            >
              {cell.l}
            </div>
          );
        })
      )}
      {/* 서랍 — 뒷판 */}
      <div style={{ ...abs(D.x, D.y, D.w, D.h - 160), borderRadius: '18px 18px 0 0', background: 'rgba(27,33,51,0.07)', border: '2px solid rgba(27,33,51,0.25)', borderBottom: 'none' }} />
      {/* 날아가는 칸 */}
      {S08_AI.map((a, i) => {
        const from = s08Pos(a.r, a.c);
        const to = s08Slot(i);
        const p = interpolate(t, [S08_FLY(i), S08_FLY(i) + 0.9], [0, 1], easeInOut);
        const lift = Math.sin(p * Math.PI) * -60;
        const sc = lerp(1, 0.62, p);
        return (
          <div
            key={a.l}
            style={{
              ...abs(from.x, from.y, G.cw, G.ch),
              transform: `translate(${(to.x - from.x) * p}px, ${(to.y - from.y) * p + lift}px) scale(${sc})`,
              transformOrigin: 'top left',
              borderRadius: 12,
              display: 'grid',
              placeItems: 'center',
              fontSize: 24,
              fontWeight: 700,
              background: '#ffffff',
              color: C.ink,
              border: `1.5px solid rgba(27,33,51,0.3)`,
              boxShadow: p > 0 && p < 1 ? '0 20px 40px -20px rgba(27,33,51,0.6)' : 'none',
              zIndex: p > 0 ? 5 : 1,
            }}
          >
            {a.l}
          </div>
        );
      })}
      {/* 서랍 — 앞판 (날아온 칸의 아랫부분을 덮는다) */}
      <div style={{ ...abs(D.x - 14, D.y + D.h - 170, D.w + 28, 150), borderRadius: 16, background: '#c9b48a', border: `2.5px solid ${C.ink}`, zIndex: 8, display: 'grid', placeItems: 'center' }}>
        <div style={{ fontSize: 34, fontWeight: 800, color: C.ink }}>AI에게</div>
        <div style={{ ...abs(D.w / 2 - 56, 100, 140, 16), borderRadius: 8, background: C.ink, opacity: 0.75 }} />
      </div>
      {/* 비어 버린 칸에 「도전」 */}
      {S08_CHALLENGE.map((ai, j) => {
        const a = S08_AI[ai];
        const p = s08Pos(a.r, a.c);
        return (
          <div key={a.l} style={{ ...abs(p.x, p.y + 14, G.cw, G.ch), textAlign: 'center', ...hand, fontSize: 52, color: C.coral, zIndex: 6, ...riseIn(t, S08_CH_AT(j), 0.6, 12) }}>
            도전 ✎
          </div>
        );
      })}
      {/* 범례 */}
      <div style={{ ...abs(D.x - 14, 800, 400), display: 'grid', gap: 14, fontSize: 21, color: C.ink }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: interpolate(t, [0.8, 1.2], [0, 1]) }}>
          <span style={{ width: 40, height: 26, borderRadius: 6, border: '2.5px dashed rgba(27,33,51,0.35)' }} />
          AI에게 넘어가는 칸
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: human }}>
          <span style={{ width: 40, height: 26, borderRadius: 6, background: C.indigo }} />
          남는 칸 · 인간적인 부분
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: interpolate(t, [S08_CH_AT(0), S08_CH_AT(0) + 0.4], [0, 1]) }}>
          <span style={{ ...hand, fontSize: 30, color: C.coral, width: 40, textAlign: 'center' }}>✎</span>
          새로 생기는 칸 · 도전
        </div>
      </div>
      <div style={{ ...abs(150, 958, 1300), fontSize: 34, fontWeight: 800, color: C.ink, wordBreak: 'keep-all', ...riseIn(t, 8.6, 0.7, 14) }}>
        인공지능이 못하는 것 <span style={{ color: C.indigo }}>(인간적인 부분)</span>
        <span style={{ color: C.coral }}> + 새로운 시대에 도전하는 자세</span>
      </div>
    </>
  );
}
function S08() {
  return (
    <Scene freezeAt={9.6} duration={9.6} markers={[{ time: 0.8, label: 'AI에게 넘기기' }, { time: S08_HUMAN_AT, label: '남는 칸' }, { time: 7.3, label: '도전' }]}>
      <S08Body />
    </Scene>
  );
}

/* ═══════════════════════ S09 · 써 보자 (static) ═══════════════════════ */
function S09() {
  const link = (href: string, name: string, logo: string, url: string) => (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      style={{
        ...card,
        display: 'flex',
        alignItems: 'center',
        gap: 26,
        padding: '26px 34px',
        textDecoration: 'none',
        borderColor: C.indigo,
        borderWidth: 2.5,
      }}
    >
      <img src={logo} alt="" style={{ width: 54, height: 54, objectFit: 'contain' }} />
      <div>
        <div style={{ fontSize: 40, fontWeight: 800, color: C.ink }}>{name}</div>
        <div style={{ fontSize: 24, color: C.indigo, textDecoration: 'underline', textUnderlineOffset: 5, fontWeight: 700 }}>{url}</div>
      </div>
      <span style={{ marginLeft: 'auto', fontSize: 30, color: C.indigo }}>↗</span>
    </a>
  );
  return (
    <>
      <div style={{ ...abs(140, 120), ...kick }}>실습</div>
      <h2 style={{ ...abs(140, 160, 960), ...h1, fontSize: 112, lineHeight: 1.08 }}>
        상상할 수 있는 것,
        <br />
        <span style={{ color: C.indigo }}>써 보자</span>
      </h2>
      <div style={{ ...abs(1160, 170, 620), display: 'grid', gap: 22 }}>
        <div style={{ ...small, fontSize: 20, color: 'var(--fg-muted)' }}>둘 중 하나만 열면 됩니다 · 새 탭</div>
        {link(URL_CLAUDE, 'Claude', LOGO.anthropic, 'claude.ai')}
        {link(URL_CHATGPT, 'ChatGPT', LOGO.openai, 'chatgpt.com')}
        <div style={{ ...hand, fontSize: 40, color: C.coral }}>로그인까지 됐는지 옆 분과 확인!</div>
      </div>
      {/* 두 칸짜리 계단 */}
      <div style={{ ...abs(140, 760, 460, 140), ...card, background: '#e3e5f4', borderColor: C.indigo, padding: '22px 28px' }}>
        <div style={{ ...kick, fontSize: 17 }}>1단계</div>
        <div style={{ fontSize: 34, fontWeight: 800, color: C.ink, marginTop: 6 }}>간단한 일 시키기</div>
      </div>
      <div style={{ ...abs(620, 660, 500, 240), ...card, background: C.indigo, borderColor: C.indigo, padding: '26px 30px' }}>
        <div style={{ ...kick, fontSize: 17, color: 'rgba(255,255,255,0.8)' }}>2단계</div>
        <div style={{ fontSize: 34, fontWeight: 800, color: '#fff', marginTop: 6, wordBreak: 'keep-all' }}>복잡한 업무 지휘하기</div>
        <div style={{ fontSize: 21, color: 'rgba(255,255,255,0.85)', marginTop: 8, wordBreak: 'keep-all' }}>여러 업무를 나누어 맡기고 검토하기</div>
      </div>
      <svg style={{ ...abs(380, 650, 260, 120) }} viewBox="0 0 260 120" aria-hidden>
        <path d="M 10 110 C 70 30, 160 20, 230 40" stroke={C.coral} strokeWidth={5} fill="none" strokeLinecap="round" />
        <path d="M 230 40 L 206 28 M 230 40 L 212 60" stroke={C.coral} strokeWidth={5} strokeLinecap="round" />
      </svg>
      <div style={{ ...abs(1160, 780, 640), ...pill(C.coral, 24), whiteSpace: 'normal', borderRadius: 18, padding: '18px 26px', lineHeight: 1.4 }}>
        ⚠ 학생 이름·성적 같은 개인정보는 넣지 않습니다
      </div>
    </>
  );
}

/* ═══════════════════════ S10 · 1단계 시연 (walkthrough) ═══════════════════════ */
const P10 = {
  goal: '학부모 상담 주간 가정통신문 초안을 써 줘.',
  cond: ' 일시는 10월 19~23일 방과 후, 신청은 온라인 설문으로 받아.',
  form: ' 고등학교 학부모 대상, 정중하게, A4 반 쪽 분량.',
};
const PROMPT10 = P10.goal + P10.cond + P10.form;
const FOLLOW10 = '19일은 월요일이야. 요일 고치고, 신청 마감 10월 15일(목)도 넣어서 더 짧게.';
const DRAFT10 = [
  '제목: 2학기 학부모 상담 주간 안내',
  '학부모님, 안녕하십니까.',
  '자녀의 학교생활을 함께 나누는 상담 주간을 운영합니다.',
  '· 기간: 10월 19일(화) ~ 23일(토) 방과 후',
  '· 신청: 온라인 설문 (하단 링크)',
  '· 방법: 대면 또는 전화 상담 중 선택',
  '많은 참여 부탁드립니다.',
];
const REVISED10 = [
  '제목: 학부모 상담 주간 안내',
  '· 기간: 10월 19일(월) ~ 23일(금) 방과 후',
  '· 신청 마감: 10월 15일(목), 온라인 설문',
  '· 대면 또는 전화 상담 중 선택',
  '많은 참여 부탁드립니다.',
];
const T10 = (() => {
  const TYPE = 1.4;
  const TYPE_DONE = typedDoneAt(PROMPT10, TYPE, 24);
  const U1 = TYPE_DONE + 0.3;
  const SEND = U1 + 2.1;
  const RESP = SEND + 0.7;
  const RESP_DONE = typedDoneAt(DRAFT10.join('\n'), RESP, 70);
  const DRAG_A = RESP_DONE + 0.8;
  const DRAG_B = DRAG_A + 0.9;
  const WARN = DRAG_B + 0.3;
  const CLICK2 = WARN + 1.1;
  const TYPE2 = CLICK2 + 0.4;
  const TYPE2_DONE = typedDoneAt(FOLLOW10, TYPE2, 22);
  const SEND2 = TYPE2_DONE + 0.5;
  const RESP2 = SEND2 + 0.9;
  const RESP2_DONE = typedDoneAt(REVISED10.join('\n'), RESP2, 70);
  return { WIN: 0.1, CLICK: 1.0, TYPE, TYPE_DONE, U1, U2: U1 + 0.6, U3: U1 + 1.2, SEND, RESP, RESP_DONE, DRAG_A, DRAG_B, WARN, CLICK2, TYPE2, TYPE2_DONE, SEND2, RESP2, RESP2_DONE, END: RESP2_DONE + 1.2 };
})();
/* 포인터 좌표 — 씬 기준 %. measure_pointer.mjs로 실측한 값 (2026-10-08) */
const TG10 = {
  input: { x: 36.5, y: 87.2 },
  send: { x: 64.9, y: 87.2 },
  dateA: { x: 16.4, y: 51.9 },
  dateB: { x: 28.3, y: 51.9 },
};
const SEG_COLORS = [C.indigo, C.olive, C.teal];
/* 타이핑 중인 프롬프트를 목적·조건·형식 구간별 밑줄로 그린다 */
function PromptSegs({ shown, t, under = true }: { shown: string; t: number; under?: boolean }) {
  const segs = [P10.goal, P10.cond, P10.form];
  const ats = [T10.U1, T10.U2, T10.U3];
  let i0 = 0;
  return (
    <>
      {segs.map((s, i) => {
        const part = shown.slice(i0, Math.min(shown.length, i0 + s.length));
        i0 += s.length;
        const on = under && t >= ats[i];
        return (
          <span
            key={i}
            style={{
              textDecorationLine: on ? 'underline' : 'none',
              textDecorationColor: SEG_COLORS[i],
              textDecorationThickness: 4,
              textUnderlineOffset: 7,
              background: on ? `color-mix(in srgb, ${SEG_COLORS[i]} 10%, transparent)` : 'transparent',
            }}
          >
            {part}
          </span>
        );
      })}
    </>
  );
}
function ChatWalk() {
  const t = useSceneTime();
  const T = T10;
  const W = { x: 140, y: 230, w: 1180, h: 790 };
  const draftShown = typed(t, DRAFT10.join('\n'), T.RESP, 70).split('\n');
  const revShown = typed(t, REVISED10.join('\n'), T.RESP2, 70).split('\n');
  const scroll = interpolate(t, [T.SEND2 + 0.1, T.SEND2 + 0.7], [0, -300], easeInOut);
  const dragK = interpolate(t, [T.DRAG_A, T.DRAG_B], [0, 1]);
  const ring = (at: number): CSSProperties => ({ boxShadow: `0 0 0 ${clickFlash(t, at) * 10}px color-mix(in srgb, ${C.indigo} 35%, transparent)` });
  const sendFlash = Math.max(clickFlash(t, T.SEND), clickFlash(t, T.SEND2));
  const inInput1 = t >= T.TYPE && t < T.SEND;
  const inInput2 = t >= T.TYPE2 && t < T.SEND2;
  const showCaret = (t >= T.CLICK && t < T.SEND) || (t >= T.CLICK2 && t < T.SEND2);
  const line4 = draftShown[3] ?? '';
  const pre = '· 기간: ';
  const dA = '10월 19일(화)';
  const dB = ' ~ 23일(';
  const dC = '토)';
  const cut = (s: string, from: number, len: number) => line4.slice(from, Math.min(line4.length, from + len));
  const steps = [
    { at: T.U1, c: C.indigo, k: '목적', d: '무엇을 하려는가', ex: '가정통신문 초안' },
    { at: T.U2, c: C.olive, k: '조건', d: '꼭 들어갈 사실', ex: '10월 19~23일 · 온라인 설문' },
    { at: T.U3, c: C.teal, k: '형식', d: '누구에게, 어떤 모양으로', ex: '학부모 · 정중하게 · A4 반 쪽' },
    { at: T.WARN, c: C.coral, k: '확인', d: '그럴듯하게 틀리는 곳', ex: '19일은 월요일 → 날짜·요일은 직접 확인' },
    { at: T.SEND2, c: C.ink, k: '수정', d: '다시 쓰지 말고 이어서 고치기', ex: '「요일 고치고, 더 짧게」' },
  ];
  return (
    <>
      <Head kicker="1단계 · 간단한 일 시키기" title="목적·조건·형식을 한 번에" width={1100} />
      <Term term="프롬프트" gloss="AI에게 보내는 요청 문장" size={24} style={{ ...abs(1380, 92) }} />
      <AppWindow kind="app" title="AI 채팅 · Claude와 ChatGPT의 공통 화면 구성" style={{ ...abs(W.x, W.y, W.w, W.h), ...popIn(t, T.WIN) }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#fffefa' }}>
          {/* 대화 영역 */}
          <div style={{ position: 'absolute', left: 36, right: 36, top: 26, transform: `translateY(${scroll}px)` }}>
            {t >= T.SEND + 0.15 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', ...popIn(t, T.SEND + 0.15, 0.5) }}>
                <div style={{ maxWidth: 800, padding: '16px 22px', borderRadius: '20px 20px 6px 20px', background: 'rgba(59,76,192,0.09)', fontSize: 23, lineHeight: 1.6, color: C.ink, wordBreak: 'keep-all' }}>
                  <PromptSegs shown={PROMPT10} t={t} />
                </div>
              </div>
            )}
            {t >= T.RESP && (
              <div style={{ display: 'flex', gap: 16, marginTop: 26 }}>
                <span style={{ flexShrink: 0, width: 38, height: 38, borderRadius: '50%', background: C.ink, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 16, fontWeight: 800 }}>AI</span>
                <div style={{ fontSize: 24, lineHeight: 1.62, color: C.ink, wordBreak: 'keep-all', minHeight: 300 }}>
                  {draftShown.map((ln, i) =>
                    i === 3 ? (
                      <div key={i}>
                        {cut(ln, 0, pre.length)}
                        <span
                          style={{
                            backgroundImage: `linear-gradient(${C.coralSoft}, ${C.coralSoft})`,
                            backgroundSize: `${dragK * 100}% 100%`,
                            backgroundRepeat: 'no-repeat',
                            borderBottom: t >= T.WARN ? `3px solid ${C.coral}` : '3px solid transparent',
                          }}
                        >
                          <span data-pt="dateA">{cut(ln, pre.length, 3)}</span>
                          {cut(ln, pre.length + 3, dA.length - 3)}
                          {cut(ln, pre.length + dA.length, dB.length)}
                          <span data-pt="dateB">{cut(ln, pre.length + dA.length + dB.length, dC.length)}</span>
                        </span>
                        {cut(ln, pre.length + dA.length + dB.length + dC.length, 99)}
                        {t >= T.WARN && <span style={{ ...hand, fontSize: 34, color: C.coral, marginLeft: 14 }}>요일?</span>}
                      </div>
                    ) : (
                      <div key={i} style={{ fontWeight: i === 0 ? 800 : 400 }}>
                        {ln}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
            {t >= T.SEND2 + 0.15 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 26, ...popIn(t, T.SEND2 + 0.15, 0.5) }}>
                <div style={{ maxWidth: 800, padding: '16px 22px', borderRadius: '20px 20px 6px 20px', background: 'rgba(59,76,192,0.09)', fontSize: 23, lineHeight: 1.6, color: C.ink, wordBreak: 'keep-all' }}>{FOLLOW10}</div>
              </div>
            )}
            {t >= T.RESP2 && (
              <div style={{ display: 'flex', gap: 16, marginTop: 26 }}>
                <span style={{ flexShrink: 0, width: 38, height: 38, borderRadius: '50%', background: C.ink, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 16, fontWeight: 800 }}>AI</span>
                <div style={{ fontSize: 24, lineHeight: 1.62, color: C.ink, wordBreak: 'keep-all' }}>
                  {revShown.map((ln, i) => (
                    <div key={i} style={{ fontWeight: i === 0 ? 800 : 400, color: i === 1 && t >= T.RESP2_DONE ? C.olive : undefined }}>
                      {ln}
                      {i === 1 && t >= T.RESP2_DONE && <span style={{ ...hand, fontSize: 34, color: C.olive, marginLeft: 12 }}>✓</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 70, background: 'linear-gradient(#fffefa 20%, rgba(255,254,250,0))' }} />
          {/* 입력창 */}
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 150, background: 'linear-gradient(rgba(255,254,250,0), #fffefa 30%)' }} />
          <div
            data-pt="input"
            style={{
              position: 'absolute',
              left: 28,
              right: 28,
              bottom: 22,
              height: 112,
              borderRadius: 22,
              border: `2px solid ${showCaret ? C.indigo : 'rgba(27,33,51,0.2)'}`,
              background: '#ffffff',
              padding: '14px 100px 14px 24px',
              fontSize: 22,
              lineHeight: 1.45,
              color: C.ink,
              wordBreak: 'keep-all',
              overflow: 'hidden',
              ...ring(t >= T.CLICK2 - 0.1 ? T.CLICK2 : T.CLICK),
            }}
          >
            {inInput1 && <PromptSegs shown={typed(t, PROMPT10, T.TYPE, 24)} t={t} />}
            {inInput2 && typed(t, FOLLOW10, T.TYPE2, 22)}
            {showCaret && <Caret color={C.indigo} />}
            {!inInput1 && !inInput2 && !showCaret && <span style={{ color: 'var(--fg-faint)' }}>메시지를 입력하세요</span>}
            <span
              data-pt="send"
              style={{
                position: 'absolute',
                right: 18,
                top: 28,
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: C.indigo,
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                fontSize: 28,
                fontWeight: 800,
                boxShadow: `0 0 0 ${sendFlash * 12}px color-mix(in srgb, ${C.indigo} 35%, transparent)`,
              }}
            >
              ↑
            </span>
          </div>
        </div>
      </AppWindow>
      {/* 오른쪽 단계 카드 */}
      <div style={{ ...abs(1370, 230, 440), display: 'grid', gap: 14 }}>
        {steps.map((s) => {
          const on = t >= s.at;
          return (
            <div
              key={s.k}
              style={{
                ...card,
                padding: '14px 20px',
                borderColor: on ? s.c : 'rgba(27,33,51,0.12)',
                borderWidth: 2,
                opacity: on ? 1 : 0.32,
                transform: on ? 'none' : 'translateX(10px)',
                transition: `all .5s ${easeSpring}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={pill(s.c, 19)}>{s.k}</span>
                <span style={{ fontSize: 21, fontWeight: 700, color: C.ink, wordBreak: 'keep-all' }}>{s.d}</span>
              </div>
              <div style={{ ...body, fontSize: 19, marginTop: 6 }}>{s.ex}</div>
            </div>
          );
        })}
      </div>
      <Pointer
        color={C.indigo}
        timelineEnd={T.END}
        path={[
          { t: 0.5, x: 46, y: 60 },
          { t: T.CLICK, ...TG10.input, click: true, label: '입력창 클릭' },
          { t: T.CLICK + 0.3, ...TG10.input, hide: true },
          { t: T.SEND, ...TG10.send, click: true, label: '보내기' },
          { t: T.DRAG_A, ...TG10.dateA, label: '요일 확인' },
          { t: T.DRAG_B, ...TG10.dateB },
          { t: T.CLICK2, ...TG10.input, click: true, label: '이어서 요청' },
          { t: T.CLICK2 + 0.3, ...TG10.input, hide: true },
          { t: T.SEND2, ...TG10.send, click: true, label: '보내기' },
          { t: T.SEND2 + 0.4, ...TG10.send, hide: true },
        ]}
      />
    </>
  );
}
function S10() {
  return (
    <Scene duration={T10.END} freezeAt={T10.END - 0.2}>
      <ChatWalk />
    </Scene>
  );
}

/* ═══════════════════════ S11 · 1단계 과제 (build) ═══════════════════════ */
type S11Task = { tag: string; title: string; segs: [string, string, string] };
const S11_TASKS: Record<'A' | 'B' | 'C', S11Task> = {
  A: { tag: '안내문', title: '현장체험학습 안내문', segs: ['현장체험학습 안내문 초안을 써 줘.', ' 11월 6일(금), ○○과학관, 준비물과 집합 시간 포함.', ' 학부모 대상, A4 반 쪽.'] },
  B: { tag: '수업', title: '다음 수업 도입 발문 5개', segs: ['다음 수업 도입 발문 5개를 만들어 줘.', ' 고2 정보, 「알고리즘의 효율」 단원, 학생들이 일상에서 겪은 기다림에서 출발.', ' 번호 목록, 한 문장씩.'] },
  C: { tag: '평가', title: '수행평가 채점 기준표', segs: ['수행평가 채점 기준표 초안을 만들어 줘.', ' 모둠 발표, 내용·자료·전달 세 영역.', ' 3수준 표, 수준마다 관찰할 수 있는 행동으로.'] },
};
function S11Card({ task, big }: { task: S11Task; big?: boolean }) {
  const fs = big ? 30 : 22;
  return (
    <div style={{ ...card, background: '#ffffff', padding: big ? '34px 38px' : '26px 28px', height: '100%' }}>
      <span style={pill(C.coral, big ? 21 : 18)}>{task.tag}</span>
      <div style={{ fontSize: big ? 42 : 32, fontWeight: 800, color: C.ink, marginTop: 14, wordBreak: 'keep-all' }}>{task.title}</div>
      <div style={{ ...small, fontSize: big ? 19 : 16, marginTop: 18 }}>요청 문장 예시</div>
      <div style={{ fontSize: fs, lineHeight: 1.65, color: C.ink, marginTop: 6, wordBreak: 'keep-all' }}>
        {task.segs.map((s, i) => (
          <span key={i} style={{ textDecorationLine: 'underline', textDecorationColor: SEG_COLORS[i], textDecorationThickness: 4, textUnderlineOffset: 7 }}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
function S11() {
  return (
    <>
      <Head kicker="1단계 실습" title="내 업무 하나, 시켜 보기" />
      <div style={{ ...abs(1440, 92), ...hand, fontSize: 46, color: C.coral, transform: 'rotate(-3deg)' }}>하나만 골라도 됩니다</div>
      <div style={{ ...abs(1440, 160), display: 'flex', gap: 10 }}>
        {['목적', '조건', '형식'].map((k, i) => (
          <span key={k} style={pill(SEG_COLORS[i], 18)}>
            {k}
          </span>
        ))}
      </div>
      <Build at={2} style={{ ...abs(130, 330, 480, 470), zIndex: 1 }}>
        <div style={{ height: '100%', transform: 'rotate(-2.5deg)' }}>
          <S11Card task={S11_TASKS.A} />
        </div>
      </Build>
      <Build at={3} style={{ ...abs(1310, 330, 480, 470), zIndex: 1 }}>
        <div style={{ height: '100%', transform: 'rotate(2.5deg)' }}>
          <S11Card task={S11_TASKS.C} />
        </div>
      </Build>
      <Build at={1} style={{ ...abs(600, 250, 720, 560), zIndex: 3 }}>
        <S11Card task={S11_TASKS.B} big />
      </Build>
      <Build at={4} style={{ ...abs(150, 900, 1620), zIndex: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 26, fontSize: 34, fontWeight: 800, color: C.ink, background: C.card, border: `2px solid ${C.indigo}`, borderRadius: 999, padding: '18px 30px' }}>
          <span>결과를 읽고</span>
          <span style={{ color: C.coral }}>→</span>
          <span>고칠 곳 하나</span>
          <span style={{ color: C.coral }}>→</span>
          <span style={{ color: C.indigo }}>이어서 요청</span>
        </div>
      </Build>
    </>
  );
}

/* ═══════════════════════ S12 · 총보 (scene) ═══════════════════════ */
const S12_ROWS = [
  { name: '목표', y: 330, color: C.ink, bar: '진로 주간 운영안 만들기' },
  { name: '① 계획', y: 470, color: C.indigo, bar: '주차별 계획 세우기' },
  { name: '② 초안', y: 590, color: C.indigo, bar: '안내문 · 활동지 초안' },
  { name: '③ 표 정리', y: 710, color: C.indigo, bar: '일정 · 담당을 표로' },
  { name: '④ 검토', y: 830, color: C.coral, bar: '빠진 것 · 위험 확인' },
];
const S12_X0 = 380;
const S12_MW = 290; // 마디 폭
const S12_X1 = S12_X0 + S12_MW * 4;
const S12_PART_AT = (i: number) => 2.2 + i * 1.3;
const S12_TIE = 7.6;
const S12_CONV = 8.3;
const S12_DONE = 9.2;
const S12_CARD = { x: 1600, y: 440, w: 260, h: 280 };
function S12Body() {
  const t = useSceneTime();
  const sway = t < S12_DONE ? 2.6 * Math.sin(t * 2.4) : 0;
  return (
    <>
      <Head kicker="2단계 · 복잡한 업무 지휘하기" title="나누어 맡기고, 검토는 내가" width={1150} />
      <img src={SVG.baton} alt="지휘봉" style={{ ...abs(1400, 92, 450), transform: `rotate(${-12 + sway}deg)`, transformOrigin: '13% 50%' }} />
      <svg style={{ ...abs(0, 0, DW, DH) }} viewBox={`0 0 ${DW} ${DH}`} aria-hidden>
        {/* 오선 */}
        {S12_ROWS.map((r) =>
          [-24, -12, 0, 12, 24].map((d) => <line key={`${r.name}${d}`} x1={S12_X0} x2={S12_X1} y1={r.y + d} y2={r.y + d} stroke={C.ink} strokeWidth={1.2} opacity={0.22} />)
        )}
        {/* 마디선 */}
        {[0, 1, 2, 3, 4].map((m) => (
          <line key={m} x1={S12_X0 + m * S12_MW} x2={S12_X0 + m * S12_MW} y1={300} y2={860} stroke={C.ink} strokeWidth={m === 0 || m === 4 ? 3 : 1.6} opacity={m === 0 || m === 4 ? 0.6 : 0.3} />
        ))}
        {/* 이음줄: 각 파트의 띠 끝에서 마지막 마디선까지 */}
        {S12_ROWS.slice(1, 4).map((r, i) => {
          const x0 = S12_X0 + (i + 1) * S12_MW - 8;
          const k = interpolate(t, [S12_TIE, S12_TIE + 0.6], [0, 1]);
          return <line key={r.name} x1={x0} x2={lerp(x0, S12_X1, k)} y1={r.y} y2={r.y} stroke={r.color} strokeWidth={3} strokeDasharray="6 8" opacity={0.7} />;
        })}
        {/* 모이는 선 */}
        {S12_ROWS.map((r) => {
          const cy = S12_CARD.y + S12_CARD.h / 2;
          return (
            <path
              key={r.name}
              d={`M ${S12_X1} ${r.y} C ${S12_X1 + 40} ${r.y}, ${S12_CARD.x - 50} ${cy}, ${S12_CARD.x} ${cy}`}
              pathLength={1}
              stroke={r.color}
              strokeWidth={r.name === '목표' ? 4 : 3}
              fill="none"
              strokeDasharray="1 1"
              strokeDashoffset={interpolate(t, [S12_CONV, S12_CONV + 0.8], [1, 0], easeOut)}
            />
          );
        })}
      </svg>
      {/* 파트 이름 */}
      {S12_ROWS.map((r, i) => (
        <div key={r.name} style={{ ...abs(140, r.y - 22, 220), fontSize: i === 0 ? 30 : 26, fontWeight: 800, color: r.color, opacity: i === 0 ? 1 : interpolate(t, [S12_PART_AT(i - 1) - 0.3, S12_PART_AT(i - 1)], [0.3, 1]) }}>
          {r.name}
          {i === 4 && <span style={{ ...pill(C.coral, 15), marginLeft: 8, verticalAlign: 'middle' }}>사람</span>}
        </div>
      ))}
      {/* 음표 띠 */}
      {S12_ROWS.map((r, i) => {
        const goal = i === 0;
        const x = goal ? S12_X0 + 10 : S12_X0 + (i - 1) * S12_MW + 10;
        const fullW = goal ? S12_X1 - S12_X0 - 20 : S12_MW - 20;
        const k = goal ? interpolate(t, [0.3, 1.9], [0, 1], easeOut) : interpolate(t, [S12_PART_AT(i - 1), S12_PART_AT(i - 1) + 0.9], [0, 1], easeOut);
        return (
          <div
            key={r.name}
            style={{
              ...abs(x, r.y - 30, fullW * k, 60),
              borderRadius: 14,
              background: r.color,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 18,
              boxShadow: '0 12px 26px -16px rgba(27,33,51,0.7)',
            }}
          >
            <span style={{ fontSize: goal ? 26 : 21, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>{r.bar}</span>
          </div>
        );
      })}
      {/* 결과물 카드 */}
      <div style={{ ...abs(S12_CARD.x, S12_CARD.y, S12_CARD.w, S12_CARD.h), ...card, background: '#ffffff', borderColor: C.indigo, borderWidth: 2.5, padding: '26px 24px', ...riseIn(t, S12_DONE, 0.7, 16) }}>
        <div style={{ ...small, fontSize: 17 }}>모두 모이면</div>
        <div style={{ fontSize: 38, fontWeight: 800, color: C.ink, lineHeight: 1.2, marginTop: 8 }}>
          운영안
          <br />
          완성본
        </div>
        <div style={{ ...pill(C.coral, 17), marginTop: 18 }}>검토를 거친 뒤</div>
      </div>
      <div style={{ ...abs(140, 920, 1700), display: 'flex', gap: 70, ...riseIn(t, 1.2, 0.7, 12) }}>
        <Term term="과업 분해" gloss="큰 일을 AI가 처리할 수 있는 작은 일로 나누어 맡기기" size={23} />
        <Term term="검토" gloss="최종 판단과 책임은 사람이 진다" color={C.coral} size={23} />
      </div>
    </>
  );
}
function S12() {
  return (
    <Scene freezeAt={10} duration={10} markers={[{ time: 0.3, label: '목표' }, { time: 2.2, label: '나누기' }, { time: S12_CONV, label: '모으기' }]}>
      <S12Body />
    </Scene>
  );
}

/* ═══════════════════════ S13 · 지휘 대본 (build) ═══════════════════════ */
const S13_TURNS = [
  { n: '①', part: '계획', u: '진로 주간 운영안을 만들려고 해. 먼저 계획부터 세워 줘. 아직 쓰지 마.', a: '5일 일정 · 학년별 프로그램 · 필요한 자료 목록으로 계획 제안' },
  { n: '②', part: '초안', u: '좋아. 2일 차 「직업인 특강」 안내문 초안을 써 줘.', a: '학생·학부모용 안내문 초안' },
  { n: '③', part: '표 정리', u: '5일 전체 일정과 담당 교사를 표로 정리해 줘.', a: '요일 × 시간 × 담당 표' },
  { n: '④', part: '검토', u: '빠진 것, 위험한 것, 확인이 필요한 사실을 찾아 줘.', a: '강사 섭외 일정 미정 · 우천 대비 없음 · 장소 확인 필요' },
];
function S13() {
  return (
    <>
      <Head kicker="2단계 실습" title="지휘 대본" width={560} />
      <div style={{ ...abs(140, 230, 500), ...card, background: '#ffffff', padding: '26px 30px' }}>
        <div style={{ ...small, fontSize: 18 }}>과제 예</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: C.ink, marginTop: 6, wordBreak: 'keep-all' }}>2학기 진로 주간 운영안</div>
        <div style={{ ...body, fontSize: 21, marginTop: 4 }}>5일 · 전 학년</div>
        <div style={{ ...body, fontSize: 21, marginTop: 16, color: C.ink }}>또는 내 업무 중 여러 단계가 필요한 일 하나</div>
      </div>
      <div style={{ ...abs(140, 540, 500), padding: '6px 4px' }}>
        <div style={{ ...hand, fontSize: 46, color: C.coral }}>왜 계획부터?</div>
        <div style={{ ...body, fontSize: 22, color: C.ink, marginTop: 6 }}>바로 쓰게 하면 방향이 틀려도 고치기 어렵다. 계획 단계에서 고치는 것이 가장 쉽다.</div>
        <div style={{ ...hand, fontSize: 46, color: C.coral, marginTop: 26 }}>같은 대화창에서</div>
        <div style={{ ...body, fontSize: 22, color: C.ink, marginTop: 6 }}>앞의 결과를 AI가 기억한 채로 다음 지시를 받는다.</div>
      </div>
      {S13_TURNS.map((tn, i) => (
        <Build key={tn.n} at={i + 1} style={{ ...abs(i % 2 === 0 ? 740 : 840, 210 + i * 168, 960), zIndex: 2 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <span style={{ flexShrink: 0, width: 64, textAlign: 'center' }}>
              <span style={{ display: 'block', ...hand, fontSize: 46, color: i === 3 ? C.coral : C.indigo, lineHeight: 1 }}>{tn.n}</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: i === 3 ? C.coral : C.indigo }}>{tn.part}</span>
            </span>
            <div>
              <div style={{ padding: '14px 22px', borderRadius: '20px 20px 20px 6px', background: i === 3 ? C.coral : C.indigo, color: '#fff', fontSize: 25, fontWeight: 600, lineHeight: 1.5, wordBreak: 'keep-all' }}>
                {tn.u}
              </div>
              <div style={{ ...body, fontSize: 19, marginTop: 8, paddingLeft: 8 }}>
                <span style={{ fontWeight: 800, color: C.ink, marginRight: 8 }}>AI</span>
                {tn.a}
              </div>
            </div>
          </div>
        </Build>
      ))}
      <Build at={5} style={{ ...abs(740, 900, 1060), zIndex: 3 }}>
        <div style={{ borderRadius: 999, background: '#f8e3d9', border: `2.5px solid ${C.coral}`, padding: '16px 34px', textAlign: 'center', fontSize: 36, fontWeight: 800, color: C.coral }}>
          마지막 결정은 내가 한다
        </div>
      </Build>
    </>
  );
}

/* ═══════════════════════ S14 · 익숙해지는 곡선 (build + live) ═══════════════════════ */
const S14_O = { x: 260, y: 900 };
const S14_CURVE = 'M 260 880 C 720 860, 1000 520, 1560 340';
function S14() {
  return (
    <>
      <Head kicker="써 보니" title="결국, 익숙해지는 것" />
      <svg style={{ ...abs(0, 0, DW, DH) }} viewBox={`0 0 ${DW} ${DH}`} aria-hidden>
        <path d={`M ${S14_O.x} ${S14_O.y} L 1760 ${S14_O.y}`} stroke={C.ink} strokeWidth={3} opacity={0.6} />
        <path d={`M ${S14_O.x} ${S14_O.y} L ${S14_O.x} 260`} stroke={C.ink} strokeWidth={3} opacity={0.6} />
        <path d="M 1760 900 L 1740 888 M 1760 900 L 1740 912 M 260 260 L 248 280 M 260 260 L 272 280" stroke={C.ink} strokeWidth={3} opacity={0.6} strokeLinecap="round" />
      </svg>
      <div style={{ ...abs(1560, 920, 220), textAlign: 'right', ...body, fontSize: 22, fontWeight: 700 }}>써 본 횟수</div>
      <div style={{ ...abs(150, 220, 200), ...body, fontSize: 22, fontWeight: 700 }}>활용의 폭</div>
      <Build at={1} style={{ ...abs(0, 0, DW, DH), pointerEvents: 'none' }}>
        <svg style={{ ...abs(0, 0, DW, DH) }} viewBox={`0 0 ${DW} ${DH}`} aria-hidden>
          <path d={S14_CURVE} stroke={C.indigo} strokeWidth={7} fill="none" strokeLinecap="round" />
          <circle cx={600} cy={826} r={16} fill={C.card} stroke={C.indigo} strokeWidth={6} />
        </svg>
        <div style={{ ...abs(330, 650, 330) }}>
          <div style={{ ...kick, fontSize: 16 }}>1단계</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.ink }}>시키기</div>
          <div style={{ ...body, fontSize: 20 }}>목적·조건·형식을 한 번에</div>
        </div>
      </Build>
      <Build at={2} style={{ ...abs(0, 0, DW, DH), pointerEvents: 'none' }}>
        <svg style={{ ...abs(0, 0, DW, DH) }} viewBox={`0 0 ${DW} ${DH}`} aria-hidden>
          <circle cx={1180} cy={480} r={18} fill={C.indigo} />
        </svg>
        <div style={{ ...abs(800, 290, 420) }}>
          <div style={{ ...kick, fontSize: 16 }}>2단계</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.ink }}>나누어 맡기기</div>
          <div style={{ ...body, fontSize: 20 }}>계획 → 초안 → 표 → 검토</div>
        </div>
        <LiveTag text="실시간 질문 · 바로 쓸 만했던 것은?" style={{ ...abs(800, 420) }} />
      </Build>
      <Build at={3} style={{ ...abs(0, 0, DW, DH), pointerEvents: 'none' }}>
        <svg style={{ ...abs(0, 0, DW, DH) }} viewBox={`0 0 ${DW} ${DH}`} aria-hidden>
          <path d="M 1560 340 C 1640 314, 1700 296, 1780 280" stroke={C.indigo} strokeWidth={6} strokeDasharray="10 12" fill="none" strokeLinecap="round" />
        </svg>
        <div style={{ ...abs(1250, 190, 560), ...hand, fontSize: 56, color: C.coral, textAlign: 'right' }}>학생도 같은 길을 간다</div>
      </Build>
    </>
  );
}

/* ═══════════════════════ S15 · 세 지류의 합류 (scene) ═══════════════════════ */
const S15_M = { x: 1180, y: 640 };
const S15_STREAMS = [
  { k: '아이디어', g: '무엇을 만들고 시도할지 떠올리기', c: C.olive, d: `M 200 330 C 520 320, 820 420, ${S15_M.x} ${S15_M.y}`, lx: 160, ly: 250, at: 0.4 },
  { k: '문제 인식', g: '무엇이 문제인지 먼저 알아차리기', c: C.teal, d: `M 200 860 C 560 880, 860 760, ${S15_M.x} ${S15_M.y}`, lx: 160, ly: 960, at: 1.6 },
  { k: '가치 판단', g: '무엇이 옳고 중요한지 정하기', c: C.coral, d: `M 880 340 C 940 460, 1020 570, ${S15_M.x} ${S15_M.y}`, lx: 840, ly: 290, at: 2.8 },
];
const S15_RIVER_AT = 4.6;
function S15Body() {
  const t = useSceneTime();
  return (
    <>
      <h2 style={{ ...abs(0, 70, DW), ...h1, fontSize: 70, textAlign: 'center', marginInline: 'auto' }}>
        22세기에 사람은 <span style={{ color: C.indigo }}>무엇을 하는가?</span>
      </h2>
      <svg style={{ ...abs(0, 0, DW, DH) }} viewBox={`0 0 ${DW} ${DH}`} aria-hidden>
        {/* 등고선 */}
        {[0, 1, 2, 3].map((i) => (
          <path
            key={i}
            d={`M ${-40} ${420 + i * 120} C 400 ${360 + i * 140}, 900 ${520 + i * 90}, 1960 ${400 + i * 130}`}
            stroke={C.ink}
            strokeWidth={1.4}
            fill="none"
            opacity={0.1}
          />
        ))}
        {S15_STREAMS.map((s) => (
          <path
            key={s.k}
            d={s.d}
            pathLength={1}
            stroke={s.c}
            strokeWidth={26}
            strokeLinecap="round"
            fill="none"
            opacity={0.85}
            strokeDasharray="1 1"
            strokeDashoffset={interpolate(t, [s.at, s.at + 2], [1, 0], easeInOut)}
          />
        ))}
        <path
          d={`M ${S15_M.x} ${S15_M.y} C 1400 640, 1600 690, 1900 680`}
          pathLength={1}
          stroke={C.indigo}
          strokeWidth={66}
          strokeLinecap="round"
          fill="none"
          strokeDasharray="1 1"
          strokeDashoffset={interpolate(t, [S15_RIVER_AT, S15_RIVER_AT + 1.8], [1, 0], easeInOut)}
        />
        <circle cx={S15_M.x} cy={S15_M.y} r={interpolate(t, [S15_RIVER_AT - 0.2, S15_RIVER_AT + 0.3], [0, 30])} fill={C.indigo} />
      </svg>
      {S15_STREAMS.map((s) => (
        <div key={s.k} style={{ ...abs(s.lx, s.ly - 60, 420), ...riseIn(t, s.at, 0.7, 14) }}>
          <Term term={s.k} gloss={s.g} color={s.c} size={28} />
        </div>
      ))}
      <div style={{ ...abs(1320, 530, 560), ...riseIn(t, S15_RIVER_AT + 1.2, 0.8, 14) }}>
        <div style={{ ...h1, fontSize: 64, color: C.indigo }}>철학적 사고</div>
      </div>
      <div style={{ ...abs(1240, 760, 640), ...hand, fontSize: 52, color: C.coral, ...riseIn(t, S15_RIVER_AT + 2, 0.8, 12) }}>
        왜 철학이 중요하다고 하는지
      </div>
    </>
  );
}
function S15() {
  return (
    <Scene freezeAt={8} duration={8} markers={[{ time: 0.4, label: '아이디어' }, { time: 1.6, label: '문제 인식' }, { time: 2.8, label: '가치 판단' }, { time: S15_RIVER_AT, label: '합류' }]}>
      <S15Body />
    </Scene>
  );
}

/* ═══════════════════════ S16 · 인간의 문제 (build) ═══════════════════════ */
const S16_ROWS = [
  { k: '몸', j: '을', ex: '5교시의 졸음' },
  { k: '생각', j: '을', ex: '진로 상담 앞의 망설임' },
  { k: '한계', j: '를', ex: '세 번 떨어진 실기 시험' },
];
function S16() {
  return (
    <>
      <div style={{ ...abs(760, 110, 1040), ...kick, textAlign: 'right' }}>성찰</div>
      <h2 style={{ ...abs(760, 150, 1040), ...h1, fontSize: 92, textAlign: 'right' }}>
        인간의 문제는
        <br />
        <span style={{ color: C.indigo }}>인간이 가장 잘 안다</span>
      </h2>
      {S16_ROWS.map((r, i) => (
        <Build key={r.k} at={i + 1} style={{ ...abs(140, 470 + i * 160, 1200) }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
            <span style={{ fontSize: 34, fontWeight: 600, color: 'var(--fg-muted)' }}>AI는</span>
            <span style={{ fontSize: 34, fontWeight: 600, color: 'var(--fg-muted)' }}>
              <span style={{ ...h1, fontSize: 96, color: C.indigo, marginRight: 4 }}>{r.k}</span>
              {r.j} 경험하지 못한다
            </span>
          </div>
          <div style={{ ...hand, fontSize: 40, color: C.coral, marginLeft: 92, marginTop: -6 }}>예: {r.ex}</div>
        </Build>
      ))}
      <Build at={4} style={{ ...abs(0, 0, DW, DH), pointerEvents: 'none' }}>
        <svg style={{ ...abs(0, 0, DW, DH) }} viewBox={`0 0 ${DW} ${DH}`} aria-hidden>
          <path d="M 1080 700 C 1300 680, 1420 560, 1460 400" stroke={C.coral} strokeWidth={5} fill="none" strokeLinecap="round" />
          <path d="M 1460 400 L 1442 426 M 1460 400 L 1474 430" stroke={C.coral} strokeWidth={5} strokeLinecap="round" />
        </svg>
        <div style={{ ...abs(1080, 760, 740), ...body, fontSize: 36, fontWeight: 600, color: C.ink, textAlign: 'right' }}>
          그래서 교사가 <b style={{ color: C.indigo }}>학생 곁</b>에 있어야 한다
        </div>
      </Build>
    </>
  );
}

/* ═══════════════════════ S17 · 나침반 (scene + live) ═══════════════════════ */
const S17_W = 560; // 나침반 표시 폭 (viewBox 400 → 배율 1.4)
const S17_POS = { x: 380, y: 260 };
const S17_C = { x: S17_POS.x + 200 * 1.4, y: S17_POS.y + 230 * 1.4 }; // 문자판 중심
const S17_TIP = { x: S17_POS.x + 283 * 1.4, y: S17_POS.y + 147 * 1.4 };
const S17_TOOLS = ['분필', '프로젝터', '태블릿', 'AI'];
const S17_R = 350;
function S17Body() {
  const t = useSceneTime();
  const spin = 18 * Math.min(t, 6) + 8 * easeOut(Math.min(1, Math.max(0, (t - 6) / 2))); // 6초 뒤 천천히 멈춘다
  return (
    <>
      <Head kicker="마무리" title="도구는 바뀌어도, 방향은 교사가" width={1500} />
      <svg style={{ ...abs(0, 0, DW, DH) }} viewBox={`0 0 ${DW} ${DH}`} aria-hidden>
        <circle cx={S17_C.x} cy={S17_C.y} r={S17_R} fill="none" stroke={C.ink} strokeWidth={2} strokeDasharray="4 12" opacity={0.3} />
        <path
          d={`M ${S17_TIP.x + 18} ${S17_TIP.y - 18} L 1010 ${S17_TIP.y - 18 - (1010 - S17_TIP.x - 18)}`}
          pathLength={1}
          stroke={C.coral}
          strokeWidth={4}
          strokeDasharray="1 1"
          strokeDashoffset={interpolate(t, [1.8, 2.6], [1, 0])}
          fill="none"
        />
      </svg>
      <img src={SVG.compass} alt="바늘이 한 방향을 가리키는 나침반" style={{ ...abs(S17_POS.x, S17_POS.y, S17_W), ...riseIn(t, 0.1, 0.9, 20) }} />
      {S17_TOOLS.map((tool, i) => {
        const a = ((210 + i * 90 + spin) * Math.PI) / 180;
        const x = S17_C.x + S17_R * Math.cos(a);
        const y = S17_C.y + S17_R * Math.sin(a);
        const isAI = tool === 'AI';
        return (
          <div
            key={tool}
            style={{
              ...abs(x - 90, y - 26, 180),
              textAlign: 'center',
              opacity: interpolate(t, [0.3 + i * 0.2, 0.8 + i * 0.2], [0, 1]),
            }}
          >
            <span style={{ ...pill(isAI ? C.coral : C.ink, 26), background: isAI ? C.coral : C.card, color: isAI ? '#fff' : C.ink }}>{tool}</span>
          </div>
        );
      })}
      <div style={{ ...abs(1160, 250, 700) }}>
        <div style={{ ...riseIn(t, 2.6, 0.8, 16) }}>
          <div style={{ ...kick, fontSize: 17 }}>교사의 자리 ①</div>
          <div style={{ ...h1, fontSize: 80, color: C.indigo }}>인간적인 부분</div>
        </div>
        <div style={{ ...riseIn(t, 3.3, 0.8, 16), marginTop: 36 }}>
          <div style={{ ...kick, fontSize: 17 }}>교사의 자리 ②</div>
          <div style={{ ...h1, fontSize: 80 }}>도전하는 자세</div>
        </div>
      </div>
      <div style={{ ...abs(1160, 770, 700), ...riseIn(t, 4.2, 0.8, 14) }}>
        <div style={{ ...hand, fontSize: 64, color: C.coral }}>내일, 업무 하나부터</div>
        <LiveTag text="출구 티켓 · 내일 AI에게 맡겨 볼 업무 하나" style={{ marginTop: 12 }} />
      </div>
    </>
  );
}
function S17() {
  return (
    <Scene freezeAt={8.2} duration={8.2}>
      <S17Body />
    </Scene>
  );
}

/* ── 덱 ─────────────────────────────────────────────────────────────── */

export default function AiEraTeacherDeck() {
  useHandFont();
  return (
    <Deck>
      <Page nav="AI 시대, 교사의 자리" notes={NOTES[1]}><S01 /></Page>
      <Page nav="할 수 있다에서, 잘한다로" notes={NOTES[2]}><S02 /></Page>
      <Page nav="컴퓨터 바깥으로: 피지컬 AI" notes={NOTES[3]}><S03 /></Page>
      <Page nav="인공지능이 사람을 대신할까?" notes={NOTES[4]}><S04 /></Page>
      <Page nav="교육은 어떻게? 지침은 나왔지만" notes={NOTES[5]}><S05 /></Page>
      <Page nav="아이들은 이미 앞서 가고 있다" notes={NOTES[6]}><S06 /></Page>
      {/* TODO(계획) case-school */}
      <Page nav="○○여고의 사례" notes={NOTES[7]}><S07 /></Page>
      <Page nav="그렇다면 교사는?" notes={NOTES[8]}><S08 /></Page>
      <Page nav="상상할 수 있는 것, 써 보자" notes={NOTES[9]}><S09 /></Page>
      <Page nav="1단계 · 간단한 일 시키기" notes={NOTES[10]}><S10 /></Page>
      <Page nav="1단계 실습: 내 업무 하나" notes={NOTES[11]}><S11 /></Page>
      <Page nav="2단계 · 복잡한 업무 지휘하기" notes={NOTES[12]}><S12 /></Page>
      <Page nav="2단계 실습: 지휘 대본" notes={NOTES[13]}><S13 /></Page>
      <Page nav="써 보니: 결국 익숙해지는 것" notes={NOTES[14]}><S14 /></Page>
      <Page nav="22세기에 사람은 무엇을 하는가?" notes={NOTES[15]}><S15 /></Page>
      <Page nav="인간의 문제는 인간이 가장 잘 안다" notes={NOTES[16]}><S16 /></Page>
      <Page nav="도구는 바뀌어도, 방향은 교사가" notes={NOTES[17]}><S17 /></Page>
    </Deck>
  );
}
