import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import Build from '../../../../src/deck/Build';
import { useDeck } from '../../../../src/deck/DeckContext';
import { Scene, useSceneTime, interpolate, spring, riseIn, easeInOut } from '../../../../src/scene';
import { NOTES } from './notes';

/* ── 인공지능 기초 · 2026-2 — 문제를 푸는 과정을 설계하다 (21장) ─────
   plan: ./plan.md — 단일 진실 원천. 발표자 노트는 ./notes.ts (plan.md에서 뽑는다).

   1~3    표지(scene) → 이미 설계해 봤다(build) → 떠오르는 말(static + 문항)
   4~7    문제(scene) → 정의(build) → 명확성(build + 문항) → 다섯 질문(static)
   8~11   업다운 한 판(static, 조작) → 같은 문제 다른 설계(scene + 문항) → 네 단계 궤도(scene) → 세 구조(build)
   12~15  화면 읽기(static) → 7번 설계(build) → 실제 게임(static) → 활동 1(activity)
   16     돌아보기(build + 문항)
   17~19  도담이네(image) → 시간 막대(scene) → 활동 2(activity + 문항)
   20~21  돌아보기(build + 문항) → 파이썬으로(static + 출구)

   테마: 엔지니어링 패드 모눈(registry). 게임 수치는 두 게임의 실제 규칙에서 왔다. */

const DW = 1920;
const DH = 1080;

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
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: DW, height: DH, transform: `translate(-50%, -50%) scale(${k})`, transformOrigin: 'center', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

const GRID: CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundColor: '#e8efe4',
  backgroundImage:
    'linear-gradient(rgba(14,110,106,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(14,110,106,0.10) 1px, transparent 1px)',
  backgroundSize: '60px 60px',
};

function Page({ nav, n, children }: { nav: string; n: number; children: ReactNode }) {
  return (
    <Slide full nav={nav} notes={NOTES[n]}>
      <Fit>
        <div style={GRID} aria-hidden />
        {children}
      </Fit>
    </Slide>
  );
}

/* ── 경로 ── */
const BASE = 'data/2026-2/인공지능기초/문제를-푸는-과정을-설계하다';
const SPR = 'assets/sprites/도담이네';
const URL_ = {
  lamp: 'data/2026-1/정보/점등봇-프로그래밍-퍼즐/index.html',
  ramen: 'data/2026-1/정보/도담이네-심야-라면/index.html',
};
const IMG = {
  screen: `${BASE}/images/lamp-screen.jpg`,
  map6: `${BASE}/images/lamp-06-map.jpg`,
  n1: `${BASE}/images/lamp-17-n1.jpg`,
  n2: `${BASE}/images/lamp-17-n2.jpg`,
  qrLamp: `${BASE}/images/qr-lamp.png`,
  qrRamen: `${BASE}/images/qr-ramen.png`,
};

/* ── 색·타이포 ── */
const C = {
  teal: '#0e6e6a',
  tealSoft: 'rgba(14,110,106,0.12)',
  amber: '#f0a91e',
  amberDeep: '#a86a00',
  amberSoft: 'rgba(240,169,30,0.2)',
  ink: '#1c2b2a',
  red: '#c8452b',
  redSoft: 'rgba(200,69,43,0.12)',
  paper: '#fbfcf8',
  mute: '#51605d',
  blue: '#2f6fb0',
  violet: '#6a55b5',
};
const abs = (x: number, y: number, w?: number, h?: number): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h });
const kick: CSSProperties = { fontSize: 18, fontWeight: 700, letterSpacing: '0.14em', color: C.mute };
const h1: CSSProperties = { fontFamily: 'var(--font-head)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.14, fontSize: 56, wordBreak: 'keep-all', margin: 0, color: C.ink };
const body: CSSProperties = { fontSize: 26, lineHeight: 1.5, color: C.mute, wordBreak: 'keep-all' };
const small: CSSProperties = { fontSize: 19, lineHeight: 1.45, color: C.mute, wordBreak: 'keep-all' };
const mono: CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };
const card: CSSProperties = { background: C.paper, border: `1.5px solid rgba(28,43,42,0.18)`, borderRadius: 16, boxShadow: '0 16px 40px -30px rgba(28,43,42,0.5)' };
const trans = 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)';

function useClicks() {
  const { clicks, isStatic } = useDeck();
  return isStatic ? 99 : clicks;
}

function Head({ k, children, x = 100, y = 58, w = 1720, size }: { k: string; children: ReactNode; x?: number; y?: number; w?: number; size?: number }) {
  return (
    <div style={abs(x, y, w)}>
      <div style={kick}>{k}</div>
      <h2 style={{ ...h1, ...(size ? { fontSize: size } : {}), marginTop: 8 }}>{children}</h2>
    </div>
  );
}

function Term({ term, gloss, color = C.teal, style }: { term: string; gloss: string; color?: string; style?: CSSProperties }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 12, background: C.paper, border: `1.5px solid ${color}66`, borderRadius: 12, padding: '8px 16px', ...style }}>
      <b style={{ fontSize: 25, color, whiteSpace: 'nowrap' }}>{term}</b>
      <span style={{ ...small, fontSize: 20 }}>{gloss}</span>
    </div>
  );
}

function Blk({ children, color = C.blue, w = 96, style }: { children: ReactNode; color?: string; w?: number; style?: CSSProperties }) {
  return (
    <span style={{ display: 'inline-grid', placeItems: 'center', width: w, height: 50, flexShrink: 0, borderRadius: 11, background: color, color: 'white', fontWeight: 800, fontSize: 19, boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.18)', wordBreak: 'keep-all', textAlign: 'center', lineHeight: 1.05, ...style }}>
      {children}
    </span>
  );
}

function GameLink({ href, qr, label, style }: { href: string; qr: string; label: string; style?: CSSProperties }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 22, ...style }}>
      <a href={href} target="_blank" rel="noopener" style={{ display: 'inline-flex', padding: '22px 44px', borderRadius: 999, background: C.teal, color: 'white', fontWeight: 800, fontSize: 38, textDecoration: 'underline', textUnderlineOffset: 6, boxShadow: '0 22px 50px -24px rgba(14,110,106,0.8)' }}>
        {label} ↗
      </a>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <img src={qr} alt={`${label} QR`} style={{ width: 300, height: 300, borderRadius: 14, background: 'white', border: `1.5px solid rgba(28,43,42,0.18)` }} />
        <div style={{ ...small, width: 200 }}>휴대폰이나 태블릿이면 QR로, 컴퓨터면 위 링크로 들어옵니다.</div>
      </div>
    </div>
  );
}

/* ══ S1 · 표지: 모눈 위에 그려지는 경로 ═══════════════════════════════ */
const PATH: [number, number][] = [[28, 16], [27, 16], [26, 16], [25, 16], [25, 15], [25, 14], [25, 13], [24, 13], [23, 13], [22, 13], [22, 12], [22, 11], [22, 10], [23, 10], [24, 10], [25, 10], [26, 10], [26, 9], [26, 8], [26, 7], [26, 6], [27, 6], [28, 6]];
const LAMPS = [3, 6, 9, 12, 16, 20, 22];
function CoverScene() {
  const t = useSceneTime();
  const shown = interpolate(t, [0.2, 5], [0, PATH.length - 1], easeInOut);
  const G = 60;
  const pts = PATH.map(([x, y]) => [x * G + G / 2, y * G + G / 2]);
  return (
    <>
      <svg width={DW} height={DH} style={{ position: 'absolute', inset: 0 }} aria-hidden>
        {pts.map(([x, y], i) => i > 0 && i <= shown + 0.001 && (
          <line key={i} x1={pts[i - 1][0]} y1={pts[i - 1][1]} x2={x} y2={y} stroke={C.teal} strokeWidth={5} strokeDasharray="4 14" strokeLinecap="round" />
        ))}
        {LAMPS.map((i) => {
          const on = spring(t, 0.2 + (i / (PATH.length - 1)) * 4.8, 0.6);
          const [x, y] = pts[i];
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={46 * on} fill={C.amber} opacity={0.22 * on} />
              <rect x={x - 28} y={y - 28} width={56} height={56} rx={8} fill={on > 0.05 ? C.amber : C.paper} stroke={C.ink} strokeOpacity={0.35} strokeWidth={2} opacity={0.35 + 0.65 * Math.min(1, on)} />
            </g>
          );
        })}
      </svg>
      <div style={abs(120, 170, 1080)}>
        <div style={{ ...kick, ...riseIn(t, 0.1) }}>인공지능 기초 · 프로그래밍의 첫 단계</div>
        <h1 style={{ ...h1, fontSize: 112, marginTop: 22, ...riseIn(t, 0.25) }}>
          문제를 푸는 과정을 <span style={{ color: C.teal }}>설계</span>하다
        </h1>
        <div style={{ ...body, fontSize: 38, color: C.ink, fontWeight: 600, marginTop: 30, ...riseIn(t, 0.55) }}>알고리즘 · 그리고 게임 두 판</div>
      </div>
    </>
  );
}

/* ══ S2 · 여러분은 이미 설계해 봤다 ══════════════════════════════════ */
function S02() {
  const c = useClicks();
  const steps = [
    { name: '사진 입력', sub: '사용자가 올린다', who: 'me' },
    { name: '모델', sub: '클래스와 신뢰도를 낸다', who: 'ai' },
    { name: '기준값 비교', sub: '70% 이상인가?', who: 'me' },
    { name: '응답 고르기', sub: '이상이면 답, 아니면 "모르겠어요"', who: 'me' },
  ];
  return (
    <>
      <Head k="지난 프로젝트를 다시 펼치면">여러분은 <span style={{ color: C.teal }}>이미 설계</span>해 봤습니다</Head>
      <div style={{ ...abs(100, 280, 1260), display: 'flex', flexDirection: 'column', gap: 26 }}>
        {steps.map((s, i) => {
          const lit = s.who === 'ai' ? c >= 1 : c >= 2;
          const col = s.who === 'ai' ? C.amberDeep : C.teal;
          return (
            <div key={s.name} style={{ ...card, marginLeft: i * 56, padding: '22px 34px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: trans, background: lit ? (s.who === 'ai' ? '#fbecc9' : '#d9ece6') : C.paper, borderColor: lit ? col : undefined }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 36, color: C.ink }}>{s.name}</div>
                <div style={{ ...small, fontSize: 22 }}>{s.sub}</div>
              </div>
              <b style={{ fontSize: 24, color: col, opacity: lit ? 1 : 0, transition: trans, whiteSpace: 'nowrap' }}>{s.who === 'ai' ? 'AI가 학습함' : '여러분이 설계함'}</b>
            </div>
          );
        })}
      </div>
      <Build at={3} style={abs(1450, 300, 380)}>
        <div style={{ ...small, fontWeight: 700, letterSpacing: '0.08em' }}>이 수업의 세 기둥</div>
        {[['인공지능', '지금까지'], ['파이썬 프로그래밍', '다음 단계'], ['피지컬 컴퓨팅', '그다음']].map(([a, b], i) => (
          <div key={a} style={{ marginTop: 16, padding: '20px 22px', borderRadius: 14, background: i === 1 ? C.teal : C.paper, color: i === 1 ? 'white' : C.mute, border: '1.5px solid rgba(28,43,42,0.18)', fontWeight: 800, fontSize: 28 }}>
            {a}
            <div style={{ fontSize: 19, fontWeight: 600, marginTop: 4 }}>{b}</div>
          </div>
        ))}
      </Build>
    </>
  );
}

/* ══ S3 · 떠오르는 말 ═════════════════════════════════════════════════ */
function S03() {
  return (
    <div style={{ ...abs(0, 0, DW, DH), display: 'grid', placeItems: 'center', textAlign: 'center' }}>
      <div>
        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 230, letterSpacing: '-0.04em', color: C.teal, lineHeight: 1.1 }}>알고리즘</div>
        <div style={{ ...body, fontSize: 38, marginTop: 20, color: C.ink }}>하면 떠오르는 말을 하나 적어 주세요.</div>
      </div>
    </div>
  );
}

/* ══ S4 · 문제: 끊긴 다리 ═════════════════════════════════════════════ */
function GapScene() {
  const t = useSceneTime();
  const c = useClicks();
  const cliff = (x: number, w: number, r: boolean): CSSProperties => ({
    ...abs(x, 640, w, 440),
    background: 'linear-gradient(180deg,#5d7d72,#3b5650)',
    clipPath: r ? 'polygon(9% 0,100% 0,100% 100%,0 100%)' : 'polygon(0 0,91% 0,100% 100%,0 100%)',
  });
  return (
    <>
      <Head k="먼저 문제를 정확히 봅니다">문제는 <span style={{ color: C.teal }}>지금과 목표 사이의 빈틈</span>입니다</Head>
      <div style={cliff(0, 560, false)} />
      <div style={cliff(1360, 560, true)} />
      <img src={`${SPR}/pot.png`} alt="빈 냄비" style={{ ...abs(190, 455, 300), ...riseIn(t, 0.3) }} />
      <img src={`${SPR}/bowl.png`} alt="라면 한 그릇" style={{ ...abs(1480, 410, 280), ...riseIn(t, 0.7) }} />
      <div style={{ ...abs(100, 300, 480), ...riseIn(t, 0.5) }}>
        <div style={{ fontWeight: 900, fontSize: 40, color: C.ink }}>시작 상태</div>
        <div style={{ ...body }}>빈 냄비, 라면 한 봉지</div>
      </div>
      <div style={{ ...abs(1400, 250, 440), ...riseIn(t, 0.9) }}>
        <div style={{ fontWeight: 900, fontSize: 40, color: C.ink }}>목표 상태</div>
        <div style={{ ...body }}>먹을 수 있는 라면 한 그릇</div>
      </div>
      <svg width={DW} height={DH} style={{ position: 'absolute', inset: 0 }} aria-hidden>
        <line x1={540} y1={644} x2={interpolate(t, [1, 2.2], [540, 1380], easeInOut)} y2={644} stroke={C.teal} strokeWidth={6} strokeDasharray="6 16" strokeLinecap="round" />
      </svg>
      <div style={{ ...abs(600, 540, 720), display: 'flex', justifyContent: 'space-between' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ width: 118, height: 86, borderRadius: 12, background: C.paper, border: `2px dashed ${C.teal}`, display: 'grid', placeItems: 'center', fontSize: 48, fontWeight: 900, color: C.teal, transition: `all 0.55s ${i * 0.07}s cubic-bezier(0.22,1,0.36,1)`, opacity: c >= 2 ? 1 : 0, transform: c >= 2 ? 'none' : 'translateY(-70px)' }}>?</div>
        ))}
      </div>
      <Build at={2} style={{ display: 'none' }}><span /></Build>
      <Build at={1} style={abs(620, 760, 680)}>
        <div style={{ textAlign: 'center', fontWeight: 900, fontSize: 40, color: C.red }}>제약 조건</div>
        <div style={{ ...body, textAlign: 'center' }}>타면 안 된다 · 손은 하나뿐이다</div>
      </Build>
    </>
  );
}

/* ══ S5 · 알고리즘은 설계한 과정이다 ═════════════════════════════════ */
const STEPS5 = ['물 붓기', '라면 넣기', '스프 넣기', '기다리기', '내놓기'];
function S05() {
  const c = useClicks();
  return (
    <>
      <div style={{ ...abs(110, 120, 420), display: 'flex', flexDirection: 'column', gap: 14 }}>
        {STEPS5.map((s, i) => (
          <div key={s} style={{ ...card, display: 'flex', alignItems: 'center', gap: 20, padding: '22px 26px', transition: `all 0.55s ${i * 0.08}s`, transform: c >= 1 ? 'none' : 'rotateX(80deg)', opacity: c >= 1 ? 1 : 0.35 }}>
            <b style={{ ...mono, fontSize: 34, color: C.teal }}>{i + 1}</b>
            <span style={{ fontWeight: 800, fontSize: 36, color: c >= 1 ? C.ink : 'transparent' }}>{c >= 1 ? s : '?'}</span>
          </div>
        ))}
      </div>
      <Build at={2} style={abs(590, 120, 1220)}>
        <svg width={50} height={640} style={{ position: 'absolute', left: -44, top: 0 }} aria-hidden>
          <path d="M6 6 Q36 6 36 40 V290 Q36 320 48 320 Q36 320 36 350 V600 Q36 634 6 634" fill="none" stroke={C.teal} strokeWidth={4} />
        </svg>
        <div style={{ ...kick, marginLeft: 50, marginTop: 110 }}>정의</div>
        <div style={{ ...h1, fontSize: 88, marginLeft: 50, marginTop: 18 }}>
          <span style={{ color: C.teal }}>알고리즘</span>은 문제를 해결하기 위해 <span style={{ background: C.amberSoft, padding: '0 10px' }}>설계한 절차</span>입니다
        </div>
        <div style={{ ...body, fontSize: 32, marginLeft: 50, marginTop: 34 }}>라면 한 그릇이 아니라, 끓이는 순서입니다.</div>
      </Build>
      <Build at={3} style={abs(640, 900, 1170)}>
        <div style={{ ...small, fontSize: 22 }}>말의 뿌리: 9세기 수학자 알콰리즈미의 이름이 라틴어로 옮겨지며 생긴 말입니다.</div>
      </Build>
    </>
  );
}

/* ══ S6 · 그 지시, 실행할 수 있나요 ══════════════════════════════════ */
const LINES6: { pre: string; bad?: string; post: string; ok?: boolean }[] = [
  { pre: '면이 ', bad: '적당히', post: ' 익으면 불을 끈다' },
  { pre: '물이 끓기 시작하고 240초가 지나면 불을 끈다', post: '', ok: true },
  { pre: '', bad: '맛있어질 때까지', post: ' 끓인다' },
  { pre: '', bad: '대충', post: ' 4분쯤 끓인다' },
];
function S06() {
  const c = useClicks();
  return (
    <>
      <Head k="누가 실행하는가">그 지시, <span style={{ color: C.teal }}>컴퓨터가 실행</span>할 수 있나요?</Head>
      <div style={{ ...card, ...abs(100, 260, 1220, 690), padding: '46px 60px', transform: 'rotate(-0.8deg)' }}>
        <div style={{ ...kick }}>라면 조리 지시문</div>
        {LINES6.map((l, i) => (
          <div key={i} style={{ marginTop: 36, fontSize: 46, fontWeight: 700, color: C.ink, wordBreak: 'keep-all', paddingBottom: 18, borderBottom: '1.5px solid rgba(28,43,42,0.12)' }}>
            <span style={{ color: C.mute, marginRight: 20 }}>{i + 1}</span>
            {l.pre}
            {l.bad && (
              <span style={{ position: 'relative', whiteSpace: 'nowrap' }}>
                {l.bad}
                <span style={{ position: 'absolute', left: -6, right: -6, top: '54%', height: 6, background: C.red, borderRadius: 3, transformOrigin: 'left', transform: `scaleX(${c >= 1 ? 1 : 0}) rotate(-1.5deg)`, transition: `transform 0.45s ${i * 0.2}s` }} />
              </span>
            )}
            {l.post}
            {l.ok && c >= 1 && <span style={{ color: C.teal, marginLeft: 16 }}>✓</span>}
          </div>
        ))}
      </div>
      <Build at={1} style={abs(1390, 330, 440)}>
        <div style={{ fontWeight: 900, fontSize: 56, color: C.teal }}>명확성</div>
        <div style={{ ...body, fontSize: 30, marginTop: 16, color: C.ink }}>한 단계의 뜻이 하나로만 읽힙니다.</div>
        <div style={{ ...body, marginTop: 34 }}>"적당히"는 사람마다 다르고, 240초는 잴 수 있습니다.</div>
      </Build>
    </>
  );
}

/* ══ S7 · 다섯 질문 ═══════════════════════════════════════════════════ */
function S07() {
  const rows: [string, string, string, number][] = [
    ['입력', '무엇을 받는가?', '면 한 봉지, 물', 34],
    ['출력', '무엇을 내놓는가?', '라면 한 그릇', 34],
    ['명확성', '뜻이 하나로 읽히는가?', '"적당히" 대신 "240초"', 44],
    ['유한성', '언젠가 끝나는가?', '물이 없으면 "끓을 때까지"는 끝나지 않는다', 66],
    ['효과성', '실행하는 쪽이 정말 할 수 있는가?', '로봇에게 "정성껏"은 시킬 수 없다', 66],
  ];
  return (
    <>
      <Head k="설계가 이상할 때 꺼내 보는 표">설계를 점검하는 <span style={{ color: C.teal }}>다섯 질문</span></Head>
      <div style={{ ...abs(100, 220, 1720) }}>
        {rows.map(([a, q, e, s]) => (
          <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 34, padding: `${s > 50 ? 24 : 14}px 0`, borderBottom: '2px solid rgba(28,43,42,0.16)' }}>
            <span style={{ width: 46, height: 46, border: `3px solid ${C.teal}`, borderRadius: 8, background: C.paper, flexShrink: 0 }} />
            <b style={{ width: 300, fontSize: s, color: s > 50 ? C.teal : C.ink, flexShrink: 0 }}>{a}</b>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: s > 50 ? 34 : 28, fontWeight: 700, color: C.ink }}>{q}</div>
              <div style={{ ...small, fontSize: 23 }}>{e}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ ...abs(1120, 985, 700), ...small, textAlign: 'right' }}>정리: 도널드 크누스, 『컴퓨터 프로그래밍의 예술』</div>
    </>
  );
}

/* ── 창끼리 공유하는 위젯 상태 ─────────────────────────────────────────
   슬라이드 번호는 엔진이 맞춰 주지만 슬라이드 안의 게임 상태는 창마다 따로다. 그래서
   ① 발표자 창 ⇄ 청중 창은 BroadcastChannel('deck-widget')로,
   ② 라이브 학생 미러는 호스트의 LiveBridge가 같은 채널을 받아 라이브 채널로 보내고
      학생 JoinPage가 iframe에 postMessage('deck-widget')로 넣어 준다.
   상태는 통째로 보내고 seq가 큰 쪽이 이긴다. 모듈 수준에 두어 슬라이드를 오가도 남는다. */
type WidgetState = { seq: number };
const widgetStore = new Map<string, WidgetState>();
const widgetSubs = new Set<() => void>();
let widgetChan: BroadcastChannel | null | undefined;
function widgetAccept(id: string, s: WidgetState | undefined) {
  const cur = widgetStore.get(id);
  if (!s || typeof s.seq !== 'number' || (cur && cur.seq >= s.seq)) return;
  widgetStore.set(id, s);
  widgetSubs.forEach((f) => f());
}
function widgetInit() {
  if (widgetChan !== undefined || typeof window === 'undefined') return;
  widgetChan = null;
  try {
    widgetChan = new BroadcastChannel('deck-widget');
  } catch {
    widgetChan = null;
  }
  if (widgetChan) {
    const ch = widgetChan;
    ch.onmessage = (e) => {
      const d = e.data;
      if (d?.type === 'widget' && typeof d.id === 'string') widgetAccept(d.id, d.state);
      else if (d?.type === 'widget-hello') widgetStore.forEach((state, id) => ch.postMessage({ type: 'widget', id, state }));
    };
    ch.postMessage({ type: 'widget-hello' });
  }
  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin || e.source !== window.parent) return;
    const d = e.data;
    if (d?.type === 'deck-widget' && typeof d.id === 'string') widgetAccept(d.id, d.state);
  });
}
widgetInit();
function useSharedWidget<T extends object>(id: string, init: T): [T, (next: T) => void] {
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force((x) => x + 1);
    widgetSubs.add(f);
    return () => {
      widgetSubs.delete(f);
    };
  }, []);
  const cur = (widgetStore.get(id) as (T & WidgetState) | undefined) ?? init;
  const set = (next: T) => {
    const state = { ...next, seq: Math.max(Date.now(), (widgetStore.get(id)?.seq ?? 0) + 1) };
    widgetStore.set(id, state);
    widgetSubs.forEach((f) => f());
    widgetChan?.postMessage({ type: 'widget', id, state });
  };
  return [cur, set];
}

/* ══ S8 · 업다운 한 판 (교사가 칸을 눌러 진행) ═════════════════════ */
/* 정답은 판마다 새로 뽑는다. 첫 칸을 누를 때 뽑아 상태에 함께 실어 보내므로 모든 창이 같은
   정답을 쓴다. 어떤 숫자든 절반씩 줄이면 일곱 번 안에 나온다(다음 장의 "7번"). */
type UpDown = { secret: number | null; guesses: number[] };
function UpDownGame() {
  const { isStatic } = useDeck();
  const [game, setGame] = useSharedWidget<UpDown>('updown', { secret: null, guesses: [] });
  const guesses = isStatic ? [] : game.guesses;
  const answer = game.secret ?? 0;
  const lo = Math.max(1, ...guesses.filter((g) => g < answer).map((g) => g + 1));
  const hi = Math.min(100, ...guesses.filter((g) => g > answer).map((g) => g - 1));
  const last = guesses[guesses.length - 1];
  const won = last !== undefined && last === answer;
  const pick = (n: number) => {
    if (isStatic || won || guesses.includes(n)) return;
    const secret = game.secret ?? 1 + Math.floor(Math.random() * 100);
    setGame({ secret, guesses: [...guesses, n] });
  };
  const setGuesses = (g: number[]) => setGame({ secret: null, guesses: g });
  const UPDOWN_ANSWER = answer;
  const verdict = last === undefined ? null : won ? '정답!' : last < UPDOWN_ANSWER ? '업 ↑' : '다운 ↓';
  const vColor = won ? C.teal : last !== undefined && last < UPDOWN_ANSWER ? C.red : C.blue;
  return (
    <>
      <Head k="직접 해 봅니다" size={50}>업다운 <span style={{ color: C.teal }}>한 판</span></Head>
      <div style={{ ...abs(100, 190, 794, 794), display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6 }}>
        {Array.from({ length: 100 }, (_, i) => i + 1).map((n) => {
          const out = won ? n !== answer : n < lo || n > hi;
          const hit = n === last;
          const called = guesses.includes(n);
          return (
            <button
              key={n}
              type="button"
              data-updown={n}
              onClick={() => pick(n)}
              style={{ border: hit ? `3px solid ${C.ink}` : '1.5px solid rgba(28,43,42,0.2)', borderRadius: 9, cursor: isStatic || won ? 'default' : 'pointer', fontWeight: 800, fontSize: 28, fontFamily: 'var(--font-mono)', background: hit && won ? C.amber : called ? '#c9d3cd' : out ? 'rgba(28,43,42,0.07)' : C.paper, color: out && !called ? 'rgba(28,43,42,0.28)' : C.ink, transition: 'background 0.3s, color 0.3s' }}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div style={abs(980, 190, 840)}>
        <div style={{ height: 230, display: 'flex', alignItems: 'center' }}>
          {verdict
            ? <div key={guesses.length} style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: won ? 190 : 170, color: vColor, lineHeight: 1 }}>{verdict}</div>
            : <div style={{ ...h1, fontSize: 64 }}>1부터 100 중 숫자 하나를 정했습니다. 무엇을 부를까요?</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 28 }}>
          <b data-updown-count style={{ ...mono, fontSize: 110, color: C.teal, lineHeight: 1 }}>{guesses.length}</b>
          <span style={{ fontSize: 38, fontWeight: 800, color: C.ink }}>번째</span>
          <span style={{ ...body, marginLeft: 26, fontSize: 30 }}>남은 후보 <b style={{ ...mono, color: C.ink }}>{won ? 1 : hi - lo + 1}</b>개</span>
        </div>
        <div style={{ ...kick, marginTop: 44 }}>부른 숫자</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12, minHeight: 130, alignContent: 'flex-start' }}>
          {guesses.map((g) => (
            <span key={g} style={{ ...mono, padding: '8px 16px', borderRadius: 10, fontSize: 28, fontWeight: 800, color: 'white', background: g === UPDOWN_ANSWER ? C.teal : g < UPDOWN_ANSWER ? C.red : C.blue }}>
              {g}{g === UPDOWN_ANSWER ? '' : g < UPDOWN_ANSWER ? ' ↑' : ' ↓'}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 36, fontWeight: 800, color: C.ink, marginTop: 20, wordBreak: 'keep-all', opacity: won ? 1 : 0, transition: trans }}>
          정답 {answer}을(를) {guesses.length}번 만에 맞혔습니다. 어떻게 다음 숫자를 골랐나요?
        </div>
        <button type="button" onClick={() => setGuesses([])} style={{ marginTop: 22, padding: '12px 28px', borderRadius: 999, border: `2px solid ${C.teal}`, background: 'transparent', color: C.teal, fontWeight: 800, fontSize: 22, cursor: 'pointer', visibility: guesses.length ? 'visible' : 'hidden' }}>{won ? '새 숫자로 한 판 더' : '다시 하기 (새 숫자)'}</button>
      </div>
    </>
  );
}

/* ══ S9 · 같은 문제, 다른 설계 ═══════════════════════════════════════ */
/* 비밀 숫자가 100일 때(두 방법 모두 최악) 실제로 탐색을 돌린 기록 */
const SECRET = 100;
const BIN: { guess: number; lo: number; hi: number }[] = (() => {
  const out: { guess: number; lo: number; hi: number }[] = [];
  let lo = 1;
  let hi = 100;
  for (;;) {
    const g = Math.floor((lo + hi) / 2);
    out.push({ guess: g, lo, hi });
    if (g === SECRET) break;
    if (g < SECRET) lo = g + 1;
    else hi = g - 1;
  }
  return out;
})();
function Strip({ on, mark, y }: { on: (n: number) => boolean; mark?: (n: number) => boolean; y: number }) {
  return (
    <div style={{ ...abs(100, y, 1500, 76), display: 'flex', gap: 2 }}>
      {Array.from({ length: 100 }, (_, i) => i + 1).map((n) => (
        <div key={n} style={{ flex: 1, background: mark?.(n) ? C.amber : on(n) ? C.teal : 'rgba(28,43,42,0.10)', borderRadius: 2 }} />
      ))}
    </div>
  );
}
function SearchAnim() {
  const t = useSceneTime();
  const k = Math.max(1, Math.min(BIN.length, Math.floor(Math.max(0, t) / 1.1) + 1)) || 1;
  const cur = BIN[k - 1];
  const seq = Math.min(100, k);
  return (
    <>
      <div style={{ ...abs(100, 280), fontWeight: 800, fontSize: 34, color: C.ink }}>순차 탐색 <span style={{ ...small, fontSize: 24, fontWeight: 500 }}>앞에서부터 하나씩 확인합니다</span></div>
      <Strip y={335} on={(n) => n > seq} mark={(n) => n === seq} />
      <div style={{ ...abs(100, 425), ...small, fontSize: 25 }}>지금까지 <b style={{ ...mono, color: C.ink }}>{seq}</b>번 · 남은 후보 {100 - seq}개</div>
      <div style={{ ...abs(100, 560), fontWeight: 800, fontSize: 34, color: C.ink }}>이진 탐색 <span style={{ ...small, fontSize: 24, fontWeight: 500 }}>가운데를 찍어 절반을 버립니다</span></div>
      <Strip y={615} on={(n) => n >= cur.lo && n <= cur.hi} mark={(n) => n === cur.guess} />
      <div style={{ ...abs(100, 705), ...small, fontSize: 25 }}>
        지금까지 <b style={{ ...mono, color: C.teal }}>{k}</b>번 · {cur.guess}을(를) 불렀습니다 · 후보 {cur.hi - cur.lo + 1}개 중에서
      </div>
      <div style={{ ...abs(1630, 300, 240), textAlign: 'center', ...riseIn(t, BIN.length * 1.1) }}>
        <div style={{ ...mono, fontWeight: 900, fontSize: 92, color: C.mute }}>100</div>
        <div style={{ fontSize: 50, color: C.mute }}>↓</div>
        <div style={{ ...mono, fontWeight: 900, fontSize: 170, color: C.teal, lineHeight: 1 }}>{BIN.length}</div>
        <div style={{ ...small, marginTop: 8 }}>가장 운이 나쁠 때</div>
      </div>
      <div style={{ ...abs(100, 830, 1500), fontSize: 42, fontWeight: 800, color: C.ink, wordBreak: 'keep-all', ...riseIn(t, BIN.length * 1.1 + 0.4) }}>
        정답은 같습니다. <span style={{ color: C.teal }}>설계가 일의 양을 바꿉니다.</span>
      </div>
    </>
  );
}
function S08() {
  const c = useClicks();
  return (
    <>
      <Head k="방금 그 게임을 설계로 보면" size={52}>같은 문제, <span style={{ color: C.teal }}>다른 설계</span></Head>
      {c >= 1 ? (
        <Scene freezeAt={20}>
          <SearchAnim />
        </Scene>
      ) : (
        <>
          <Strip y={400} on={() => true} />
          <div style={{ ...abs(100, 520, 1500), ...h1, fontSize: 60 }}>가장 운이 나빠도 몇 번이면 반드시 맞힐까요?</div>
          <div style={{ ...abs(100, 640), ...body, fontSize: 30 }}>먼저 답을 고른 뒤에 함께 돌려 봅니다.</div>
        </>
      )}
      <Build at={1} style={{ display: 'none' }}><span /></Build>
    </>
  );
}

/* ══ S10 · 네 단계 궤도 ═══════════════════════════════════════════════ */
const ST9: { name: string; sub: string; a: number; big?: boolean }[] = [
  { name: '문제 이해', sub: '시작·목표·제약 조건을 적는다', a: 200 },
  { name: '분해', sub: '큰 문제를 작은 문제로 나눈다', a: 290 },
  { name: '절차 설계', sub: '순서를 정한다', a: 15 },
  { name: '실행하고 고치기', sub: '돌려 보고 오류를 찾아 고친다 (디버깅)', a: 110, big: true },
];
const orbitP = (deg: number): [number, number] => [960 + 620 * Math.cos((deg * Math.PI) / 180), 610 + 320 * Math.sin((deg * Math.PI) / 180)];
function OrbitScene() {
  const t = useSceneTime();
  /* 한 바퀴 12초: 이해 → 분해 → 설계 → 실행, 실패하면 뒤로 돌아가 분해부터 다시 */
  const route = [200, 290, 375, 470, 650];
  const u = (t % 12) / 12 * (route.length - 1);
  const i = Math.floor(u);
  const a = route[i] + (route[i + 1] - route[i]) * easeInOut(u - i);
  const [dx, dy] = orbitP(a);
  const failing = u > 3 && u < 3.25;
  return (
    <>
      <Head k="한 번에 맞히는 일이 아닙니다">설계는 <span style={{ color: C.teal }}>네 단계를 되풀이</span>합니다</Head>
      <svg width={DW} height={DH} style={{ position: 'absolute', inset: 0 }} aria-hidden>
        <ellipse cx={960} cy={610} rx={620} ry={320} fill="none" stroke={C.teal} strokeWidth={5} strokeDasharray="8 16" strokeLinecap="round" />
        <circle cx={dx} cy={dy} r={failing ? 30 : 22} fill={failing ? C.red : C.amber} stroke={C.ink} strokeWidth={3} />
      </svg>
      {ST9.map((s) => {
        const [x, y] = orbitP(s.a);
        const w = s.big ? 520 : 360;
        return (
          <div key={s.name} style={{ ...card, ...abs(Math.min(1880 - w, Math.max(40, x - w / 2)), y - (s.big ? 80 : 60), w), padding: s.big ? '24px 28px' : '16px 22px', background: s.big ? '#d9ece6' : C.paper }}>
            <div style={{ fontWeight: 900, fontSize: s.big ? 44 : 32, color: s.big ? C.teal : C.ink }}>{s.name}</div>
            <div style={{ ...small, fontSize: 21 }}>{s.sub}</div>
          </div>
        );
      })}
      <div style={{ ...abs(660, 560, 600), textAlign: 'center', fontSize: 36, fontWeight: 800, color: C.ink, wordBreak: 'keep-all' }}>
        실패는 다음 설계에 쓸 정보입니다
      </div>
    </>
  );
}

/* ══ S10 · 세 구조 ═══════════════════════════════════════════════════ */
function S10() {
  const c = useClicks();
  const stroke = { fill: 'none', stroke: C.teal, strokeWidth: 8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <>
      <Head k="등굣길 한 줄이 자랍니다">절차를 만드는 <span style={{ color: C.teal }}>세 가지 구조</span></Head>
      <svg width={1240} height={720} style={{ ...abs(90, 270) }} aria-hidden>
        <path d="M30 100 H1200" {...stroke} />
        {c >= 2 && <path d="M520 100 C600 100 600 330 700 330 H1000 C1100 330 1100 100 1180 100" {...stroke} strokeDasharray="4 14" />}
        {c >= 3 && <path d="M880 100 C880 -10 1060 -10 1060 100" {...stroke} stroke={C.amberDeep} />}
      </svg>
      {[['일어난다', 90], ['씻는다', 360], ['나간다', 1160]].map(([l, x]) => (
        <div key={l as string} style={{ ...card, ...abs(x as number, 330), padding: '14px 26px', fontWeight: 800, fontSize: 32 }}>{l}</div>
      ))}
      <Build at={2} style={abs(600, 325)}>
        <div style={{ ...card, padding: '14px 24px', fontWeight: 800, fontSize: 30, color: C.red }}>비가 오는가?</div>
      </Build>
      <Build at={2} style={abs(770, 580)}>
        <div style={{ ...card, padding: '12px 24px', fontWeight: 700, fontSize: 28 }}>그렇다 → 우산을 든다</div>
      </Build>
      <Build at={3} style={abs(910, 240)}>
        <div style={{ ...card, padding: '12px 22px', fontWeight: 800, fontSize: 28, color: C.amberDeep }}>버스가 올 때까지 기다린다</div>
      </Build>
      <div style={{ ...abs(1420, 280, 420), display: 'flex', flexDirection: 'column', gap: 38 }}>
        <Build at={1}>
          <div style={{ fontWeight: 900, fontSize: 36, color: C.teal }}>순차 구조</div>
          <div style={{ ...small, fontSize: 22, marginBottom: 10 }}>적힌 순서대로 한다</div>
          <Blk color={C.blue}>앞으로</Blk> <Blk color={C.red}>라면</Blk>
        </Build>
        <Build at={2}>
          <div style={{ fontWeight: 900, fontSize: 36, color: C.red }}>선택 구조(분기)</div>
          <div style={{ ...small, fontSize: 22, marginBottom: 10 }}>조건을 보고 다른 일을 고른다</div>
          <Blk color={C.teal} w={116}>꺼진 불?</Blk> <Blk color={C.teal} w={116}>막혔나?</Blk>
        </Build>
        <Build at={3}>
          <div style={{ fontWeight: 900, fontSize: 36, color: C.amberDeep }}>반복 구조</div>
          <div style={{ ...small, fontSize: 22, marginBottom: 10 }}>조건이 될 때까지, 또는 정한 횟수만큼</div>
          <Blk color={C.amberDeep} w={136}>끓을 때까지</Blk> <Blk color={C.amberDeep} w={110}>2번 반복</Blk>
        </Build>
      </div>
    </>
  );
}

/* ══ S11 · 점등봇 화면 읽기 ══════════════════════════════════════════ */
function Pin({ n, x, y }: { n: number; x: number; y: number }) {
  return <div style={{ ...abs(x - 28, y - 28, 56, 56), borderRadius: '50%', background: C.red, color: 'white', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 32, boxShadow: '0 8px 20px -6px rgba(0,0,0,0.6)', border: '3px solid white' }}>{n}</div>;
}
function S11() {
  const W = 1290;
  const k = W / 1672;
  const X = 80;
  const Y = 200;
  const p = (x: number, y: number) => ({ x: X + x * k, y: Y + y * k });
  return (
    <>
      <Head k="활동 전에 화면부터" y={50}><span style={{ color: C.teal }}>점등봇</span> 화면 읽기</Head>
      <img src={IMG.screen} alt="점등봇 게임 화면" style={{ ...abs(X, Y, W), borderRadius: 14, boxShadow: '0 24px 60px -30px rgba(0,0,0,0.7)' }} />
      <Pin n={1} {...p(740, 450)} />
      <Pin n={2} {...p(1190, 90)} />
      <Pin n={3} {...p(1190, 215)} />
      <Pin n={4} {...p(395, 775)} />
      <div style={{ ...abs(1420, 210, 430), display: 'flex', flexDirection: 'column', gap: 30 }}>
        {[
          ['1', '무대', '불을 켜야 할 칸이 표시되어 있습니다. 모두 켜면 통과입니다.'],
          ['2', '블록', '앞으로·오른쪽·왼쪽·점프·불켜기와 F1·F2를 씁니다.'],
          ['3', '칸', '프로그램 12칸, F1 8칸, F2 8칸입니다. 모든 문제가 같습니다.'],
          ['4', '실행', '실행하고, 한 칸씩 되감으며 어디서 달라졌는지 봅니다.'],
        ].map(([n, a, b]) => (
          <div key={n}>
            <div style={{ fontWeight: 900, fontSize: 36, color: C.ink }}><span style={{ color: C.red, marginRight: 12 }}>{n}</span>{a}</div>
            <div style={{ ...small, fontSize: 23 }}>{b}</div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ══ S12 · 시연 문제를 먼저 설계한다 ════════════════════════════════ */
const SEQ30 = [...Array(7).fill(['W', 'L']).flat(), 'D', 'W', 'D', 'L', ...Array(6).fill(['W', 'L']).flat()] as string[];
function S12() {
  const c = useClicks();
  const CW = 44;
  const pal: Record<string, string> = { W: C.blue, L: C.amberDeep, D: C.violet };
  return (
    <>
      <Head k="점등봇 7번 「두 줄의 불」 · 블록을 놓기 전에">먼저 <span style={{ color: C.teal }}>세고, 나누고, 묶습니다</span></Head>
      <img src={IMG.map6} alt="점등봇 7번 지도" style={{ ...abs(100, 210, 760, 521), borderRadius: 14, objectFit: 'cover', border: '1.5px solid rgba(28,43,42,0.2)' }} />
      <div style={{ ...card, ...abs(910, 210, 910, 521), padding: '30px 40px' }}>
        <Build at={1}>
          <div style={{ ...kick }}>문제 이해</div>
          <div style={{ display: 'flex', gap: 60, marginTop: 8 }}>
            <div><b style={{ ...mono, fontSize: 92, color: C.amberDeep }}>14</b><span style={{ ...body, marginLeft: 10 }}>개의 불</span></div>
            <div><b style={{ ...mono, fontSize: 92, color: C.teal }}>28</b><span style={{ ...body, marginLeft: 10 }}>칸 (12+8+8)</span></div>
          </div>
        </Build>
        <Build at={2}>
          <div style={{ fontSize: 34, fontWeight: 800, color: C.red, marginTop: 14 }}>하나씩 쓰면 행동 30개: 칸에 다 들어가지 않습니다</div>
        </Build>
        <Build at={3}>
          <div style={{ fontSize: 34, fontWeight: 800, color: C.ink, marginTop: 18 }}>
            같은 부분이 되풀이됩니다. 이것이 <span style={{ color: C.teal }}>패턴</span>입니다
          </div>
        </Build>
        <Build at={4}>
          <Term term="함수" gloss="여러 동작을 묶어 이름을 붙이고 불러 쓰는 것" style={{ marginTop: 22 }} />
        </Build>
      </div>
      <div style={{ ...abs(100, 780, 1720, 240), opacity: c >= 2 ? 1 : 0, transition: trans }}>
        <div style={{ position: 'relative', height: 140 }}>
          <div style={{ ...abs(-8, 40, 28 * (CW + 13) + 6, 76), border: `3px dashed ${C.teal}`, borderRadius: 10 }} />
          <div style={{ ...abs(0, 4), ...small, fontWeight: 800, color: C.teal }}>칸 28개</div>
          {SEQ30.map((s, i) => {
            const over = i >= 28;
            return (
              <div key={i} style={{ ...abs(i * (CW + 13), 48, CW, 60), borderRadius: 8, background: over ? C.red : pal[s], color: 'white', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 18 }}>
                {s === 'W' ? '앞' : s === 'L' ? '불' : '돌'}
              </div>
            );
          })}
          {c >= 3 && [0, 6, 18, 24].map((i) => (
            <div key={i} style={{ ...abs(i * (CW + 13) - 3, 114, 6 * (CW + 13) - 7, 16), borderBottom: `5px solid ${C.amber}`, borderLeft: `5px solid ${C.amber}`, borderRight: `5px solid ${C.amber}`, borderRadius: '0 0 8px 8px' }} />
          ))}
        </div>
      </div>
    </>
  );
}

/* ══ S13 · 실행하고 고치기 (실제 게임) ═══════════════════════════════ */
function S13() {
  const { isStatic } = useDeck();
  return (
    <>
      <div style={{ ...abs(70, 28, 1400) }}>
        <div style={kick}>점등봇 7번 · 실제 게임</div>
        <h2 style={{ ...h1, fontSize: 48, marginTop: 4 }}>실행하고, <span style={{ color: C.teal }}>고칩니다</span></h2>
      </div>
      <div style={{ ...abs(70, 140, 1500, 844), borderRadius: 14, overflow: 'hidden', background: '#10163a', boxShadow: '0 24px 60px -30px rgba(0,0,0,0.7)' }}>
        {isStatic
          ? <img src={IMG.screen} alt="점등봇 7번 화면" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <iframe title="점등봇 7번" src={`${URL_.lamp}?level=7`} style={{ width: '100%', height: '100%', border: 0, display: 'block' }} />}
      </div>
      <div style={{ ...abs(1600, 150, 280) }}>
        <Term term="디버깅" gloss="잘못된 곳을 찾아 고치는 일" style={{ flexDirection: 'column', gap: 4 }} />
        <div style={{ ...body, marginTop: 34, color: C.ink, fontWeight: 700 }}>로봇이 어느 칸에서 처음 달라졌나요?</div>
        <a href={`${URL_.lamp}?level=7`} target="_blank" rel="noopener" style={{ display: 'block', marginTop: 34, fontWeight: 800, fontSize: 24, color: C.teal, textDecoration: 'underline' }}>새 탭에서 열기 ↗</a>
        <div style={{ ...small, marginTop: 34 }}>게임을 누른 뒤에는 키보드가 게임으로 갑니다. 다음 장으로 넘길 때는 게임 바깥을 한 번 눌러 주세요.</div>
      </div>
    </>
  );
}

/* ══ S14 · 활동 1 ════════════════════════════════════════════════════ */
function S14() {
  const stairs: [string, string][] = [['1~5번', '순차'], ['6~8번', '함수: 묶어서 이름 붙이기'], ['9~15번', '함수: 겹쳐 쓰고 다시 쓰기'], ['16번', '반복'], ['17~21번', '분기']];
  return (
    <>
      <Head k="활동 1" size={72}><span style={{ color: C.teal }}>점등봇</span>을 내 방법으로</Head>
      <GameLink href={`${URL_.lamp}?record=ai-basics`} qr={IMG.qrLamp} label="점등봇 시작" style={abs(100, 230)} />
      <div style={{ ...abs(100, 760, 700) }}>
        <div style={{ fontWeight: 900, fontSize: 30, color: C.ink }}>놓기 전에 먼저 말로 정합니다</div>
        <div style={{ ...body, fontSize: 25 }}>시작은 어디인가? 목표는 무엇인가? 무엇이 되풀이되는가?</div>
        <div style={{ ...body, fontSize: 25, marginTop: 8 }}>막히면 정답을 묻지 말고 옆 사람과 설계를 비교합니다.</div>
        <div style={{ ...small, marginTop: 8 }}>처음에 이름과 학번을 넣으면 통과한 문제가 시트에 기록됩니다.</div>
      </div>
      {stairs.map(([a, b], i) => (
        <div key={a} style={{ ...card, ...abs(880 + i * 44, 790 - i * 138, 800), padding: '22px 32px', display: 'flex', alignItems: 'center', gap: 26, background: i === 4 ? '#d9ece6' : C.paper }}>
          <b style={{ ...mono, fontSize: 36, color: C.teal, width: 170, flexShrink: 0 }}>{a}</b>
          <span style={{ fontSize: 30, fontWeight: 700, color: C.ink, wordBreak: 'keep-all' }}>{b}</span>
        </div>
      ))}
    </>
  );
}

/* ══ S15 · 돌아보기 ══════════════════════════════════════════════════ */
function ProgBox({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div style={{ ...card, padding: '22px 28px', flex: 1 }}>
      <div style={{ ...kick, fontSize: 20 }}>{title}</div>
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: 'flex', gap: 16, marginTop: 12, alignItems: 'baseline' }}>
          <b style={{ ...mono, width: 110, fontSize: 21, color: C.teal, flexShrink: 0 }}>{k}</b>
          <span style={{ fontSize: 24, fontWeight: 600, color: C.ink, wordBreak: 'keep-all' }}>{v}</span>
        </div>
      ))}
    </div>
  );
}
function S15() {
  return (
    <>
      <Head k="활동 1 돌아보기">같은 목표, <span style={{ color: C.teal }}>여러 풀이</span>. 그런데 지도가 달라지면?</Head>
      <Build at={1} style={{ ...abs(100, 220, 1720), display: 'flex', gap: 28 }}>
        <ProgBox title="7번의 한 풀이 (블록 16개)" rows={[['프로그램', 'F1 F1 앞으로 불켜기 오른쪽 앞으로 오른쪽 불켜기 F1 F1'], ['F1', '앞으로 불켜기 앞으로 불켜기 앞으로 불켜기']]} />
        <ProgBox title="7번의 다른 풀이 (블록 16개)" rows={[['프로그램', 'F1 앞으로 불켜기 오른쪽 앞으로 오른쪽 불켜기 F1'], ['F1', 'F2 F2'], ['F2', '앞으로 불켜기 앞으로 불켜기 앞으로 불켜기']]} />
      </Build>
      <Build at={2} style={{ ...abs(100, 530), display: 'flex', gap: 18, alignItems: 'flex-end' }}>
        {[[IMG.n1, '17번 밤 1'], [IMG.n2, '17번 밤 2']].map(([src, l]) => (
          <div key={l}>
            <img src={src} alt={l} style={{ width: 590, height: 400, objectFit: 'cover', borderRadius: 12, display: 'block' }} />
            <div style={{ ...small, fontWeight: 700, marginTop: 6 }}>{l}</div>
          </div>
        ))}
      </Build>
      <Build at={3} style={abs(1340, 560, 480)}>
        <div style={{ fontWeight: 900, fontSize: 46, color: C.red, wordBreak: 'keep-all' }}>선택 구조(분기)</div>
        <div style={{ ...body, marginTop: 12, fontSize: 28 }}>불의 위치가 밤마다 다릅니다. 실행 중에 보고 골라야 합니다.</div>
        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}><Blk color={C.teal} w={120}>빨강 칸?</Blk><Blk color={C.teal} w={120}>꺼진 불?</Blk><Blk color={C.mute} w={100}>아니면</Blk></div>
      </Build>
    </>
  );
}

/* ══ S16 · 도담이네 심야 라면 ════════════════════════════════════════ */
function S16() {
  return (
    <>
      <img src={`${SPR}/stage-night-stall.jpg`} alt="밤의 포장마차 무대" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ ...abs(590, 100, 620), textAlign: 'center', fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 58, color: '#f7ecd6', whiteSpace: 'nowrap' }}>도담이네 심야 라면</div>
      {[['noodle', 200, 250, 148], ['soup', 200, 137, 140], ['scallion', 412, 135, 170], ['egg', 412, 252, 75]].map(([n, x, y, w]) => (
        <img key={n as string} src={`${SPR}/${n}.png`} alt="" style={{ position: 'absolute', left: (x as number) - (w as number) / 2, top: (y as number) - 45, width: w as number }} />
      ))}
      <img src={`${SPR}/dodam-idle.png`} alt="주인공 도담" style={{ ...abs(1165, 112), height: 390 }} />
      <div style={{ ...abs(1440, 130, 400), textAlign: 'center', color: '#f7ecd6' }}>
        {[['끓음', '약 5.4초'], ['익음', '약 6.7초'], ['탐', '약 10.8초']].map(([a, b]) => (
          <div key={a} style={{ display: 'flex', justifyContent: 'center', gap: 22, fontSize: 40, fontWeight: 800, lineHeight: 1.45 }}><span style={{ color: '#ffb648' }}>{a}</span><span style={mono}>{b}</span></div>
        ))}
      </div>
      <div style={{ ...abs(0, 900, DW, 180), background: 'linear-gradient(180deg, rgba(20,16,12,0) 0%, rgba(20,16,12,0.86) 45%)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 30 }}>
        <div style={{ fontSize: 44, fontWeight: 800, color: '#fff9ec', wordBreak: 'keep-all' }}>어디로 갈지 설계했다면, 이번에는 <span style={{ color: '#ffb648' }}>언제 무엇을 할지</span> 설계합니다</div>
      </div>
    </>
  );
}

/* ══ S17 · 시간 막대 ═════════════════════════════════════════════════ */
const FPS = 12;
const BOIL = 65 / FPS;
const DONE = 80 / FPS;
const BURN = 130 / FPS;
function TimeBar({ y, fill, label }: { y: number; fill: number; label: string }) {
  const X0 = 300;
  const PX = 115;
  return (
    <>
      <div style={{ ...abs(100, y + 8, 190), fontWeight: 900, fontSize: 32, color: C.ink }}>{label}</div>
      <div style={{ ...abs(X0, y, BURN * PX + 120, 64), borderRadius: 10, background: 'rgba(28,43,42,0.08)', overflow: 'hidden' }}>
        <div style={{ ...abs(0, 0, Math.min(fill, BOIL) * PX, 64), background: '#7fc4e6' }} />
        <div style={{ ...abs(BOIL * PX, 0, Math.max(0, Math.min(fill, DONE) - BOIL) * PX, 64), background: '#ffb648' }} />
        <div style={{ ...abs(DONE * PX, 0, Math.max(0, Math.min(fill, BURN) - DONE) * PX, 64), background: '#62d08d' }} />
        <div style={{ ...abs(BURN * PX, 0, Math.max(0, fill - BURN) * PX, 64), background: C.red }} />
      </div>
    </>
  );
}
function TimelineScene() {
  const t = useSceneTime();
  const c = useClicks();
  const X0 = 300;
  const PX = 115;
  const fill = interpolate(t, [0.4, 7], [0, BURN + 1]);
  const ms: [number, string, string][] = [[BOIL, '끓음', '#2f7fa8'], [DONE, '익음', '#2a8f55'], [BURN, '탐', C.red]];
  return (
    <>
      <Head k="물을 부은 뒤의 시간을 그려 보면">기다리는 동안, <span style={{ color: C.teal }}>손은 비어 있습니다</span></Head>
      {ms.map(([s, l, col]) => (
        <div key={l} style={{ ...abs(X0 + s * PX - (l === '끓음' ? 70 : 0), 245, 150), opacity: fill >= s ? 1 : 0.35, transition: 'opacity .3s' }}>
          <div style={{ fontWeight: 900, fontSize: 30, color: col }}>{l}</div>
          <div style={{ ...mono, ...small }}>{s.toFixed(1)}초</div>
        </div>
      ))}
      <TimeBar y={330} fill={fill} label="냄비 1" />
      <div style={{ ...abs(100, 412, 190), fontWeight: 800, fontSize: 23, color: C.amberDeep }}>도담이의 손</div>
      {[[0, 2, '라면·스프'], [DONE, 1, '내놓기']].map(([s, w, l]) => (
        <div key={l as string} style={{ ...abs(X0 + (s as number) * PX, 408, (w as number) * PX - 4, 42), borderRadius: 8, background: C.amber, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 20, color: C.ink, whiteSpace: 'nowrap', opacity: fill >= (s as number) ? 1 : 0.25 }}>{l as string}</div>
      ))}
      <div style={{ ...abs(X0 + 2 * PX + 8, 408, (DONE - 2) * PX - 16, 42), border: `3px dashed ${C.teal}`, borderRadius: 8, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 24, color: C.teal, opacity: interpolate(fill, [2.2, 3.2], [0, 1]) }}>비어 있음</div>
      <Build at={1} style={abs(0, 520, DW, 300)}>
        <div style={{ ...abs(100, 8, 190), fontWeight: 900, fontSize: 32, color: C.ink }}>냄비 2</div>
        <div style={{ ...abs(300, 0, BURN * PX + 120, 64), borderRadius: 10, border: `3px dashed ${C.mute}`, display: 'grid', placeItems: 'center', fontSize: 38, fontWeight: 900, color: C.mute }}>언제 시작할까?</div>
      </Build>
      <div style={{ ...abs(100, 780, 1400), fontSize: 26, color: C.mute, wordBreak: 'keep-all' }}>
        동작 하나는 1초가 걸립니다. 게임에 맞게 줄인 시간이며 실제 라면과는 다릅니다.
      </div>
    </>
  );
}

/* ══ S18 · 활동 2 ════════════════════════════════════════════════════ */
function S18() {
  const rows: [string, string, number][] = [['1~4번', '냄비 1개', 1], ['5번', '냄비 2개', 2], ['6번', '냄비 4개', 4]];
  return (
    <>
      <Head k="활동 2" size={72}><span style={{ color: C.teal }}>심야 라면</span> 가게 돌리기</Head>
      <GameLink href={`${URL_.ramen}?record=ai-basics`} qr={IMG.qrRamen} label="심야 라면 시작" style={abs(100, 230)} />
      <div style={{ ...abs(100, 760, 700) }}>
        <div style={{ fontWeight: 900, fontSize: 30, color: C.ink }}>실패하면 어디서 달라졌는지 먼저 봅니다</div>
        <div style={{ ...body, fontSize: 25 }}>언제 손이 비는가? 냄비가 끓는 동안 무엇을 할 수 있는가?</div>
        <div style={{ ...small, marginTop: 8 }}>처음에 이름과 학번을 넣으면 통과한 문제가 시트에 기록됩니다.</div>
      </div>
      <div style={{ ...abs(900, 250, 920), display: 'flex', flexDirection: 'column', gap: 26 }}>
        {rows.map(([a, b, n]) => (
          <div key={a} style={{ ...card, padding: '22px 30px', display: 'flex', alignItems: 'center', gap: 22 }}>
            <b style={{ ...mono, fontSize: 34, color: C.teal, width: 130 }}>{a}</b>
            <span style={{ fontSize: 30, fontWeight: 700, width: 170 }}>{b}</span>
            {Array.from({ length: n }, (_, i) => <img key={i} src={`${SPR}/pot.png`} alt="" style={{ width: 96 }} />)}
          </div>
        ))}
      </div>
      <div style={{ ...abs(900, 800, 920), display: 'flex', alignItems: 'center', gap: 24 }}>
        <img src={`${SPR}/bowl.png`} alt="" style={{ width: 130 }} />
        <div style={{ fontSize: 42, fontWeight: 900, color: C.ink, wordBreak: 'keep-all' }}>6번: 70초 안에 <span style={{ color: C.red, ...mono }}>10,000원</span></div>
      </div>
    </>
  );
}

/* ══ S19 · 돌아보기 ══════════════════════════════════════════════════ */
function S19() {
  const rows: [string, string][] = [['문제 이해', '칸과 불을 세고, 주문과 제한 시간을 읽었습니다'], ['분해', '되풀이되는 패턴을 찾았습니다'], ['절차 설계', '언제 무엇을 할지 순서를 정했습니다'], ['실행하고 고치기', '어디서 달라졌는지 찾아 고쳤습니다']];
  const r3: [string, string, string][] = [['순차 구조', '라면 1번', C.teal], ['반복 구조', '라면 3번: 세지 않고 "끓을 때까지"', C.amberDeep], ['선택 구조', '점등봇 17번: 칸 색을 보고 방향을 골랐습니다', C.red]];
  return (
    <>
      <Head k="두 게임을 돌아보면">여러분이 한 일은 <span style={{ color: C.teal }}>블록 놓기가 아니었습니다</span></Head>
      <Build at={1} style={abs(100, 230, 980)}>
        {rows.map(([a, b], i) => (
          <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '20px 0', borderBottom: '2px solid rgba(28,43,42,0.16)' }}>
            <b style={{ ...mono, fontSize: 40, color: C.teal, width: 44 }}>{i + 1}</b>
            <div>
              <div style={{ fontWeight: 900, fontSize: 36, color: C.ink }}>{a}</div>
              <div style={{ ...small, fontSize: 25 }}>{b}</div>
            </div>
          </div>
        ))}
      </Build>
      <Build at={2} style={abs(1160, 230, 660)}>
        {r3.map(([a, b, col]) => (
          <div key={a} style={{ ...card, padding: '18px 26px', marginBottom: 18, borderLeft: `10px solid ${col}` }}>
            <div style={{ fontWeight: 900, fontSize: 32, color: col }}>{a}</div>
            <div style={{ ...small, fontSize: 24 }}>{b}</div>
          </div>
        ))}
      </Build>
      <Build at={3} style={abs(1160, 690, 660)}>
        <div style={{ background: C.teal, color: 'white', borderRadius: 16, padding: '26px 30px', fontWeight: 800, fontSize: 34, wordBreak: 'keep-all' }}>6번의 내 방법을 들려 주세요. 더 빠른 순서를 찾는 것이 알고리즘을 개선하는 일입니다.</div>
      </Build>
      <div style={{ ...abs(100, 830, 980), fontSize: 38, fontWeight: 800, color: C.ink, wordBreak: 'keep-all' }}>여러분은 오늘 프로그램을 설계했습니다.</div>
    </>
  );
}

/* ══ S20 · 블록에서 파이썬으로 ═══════════════════════════════════════ */
function S20() {
  const code = ['물_붓기()', '라면_넣기()', '스프_넣기()', 'while not 끓었나():', '    기다리기()', '파_넣기()', '계란_넣기()', '내놓기()'];
  const blocks: [string, string][] = [['물 붓기', C.blue], ['라면', C.red], ['스프', C.red], ['끓을 때까지', C.amberDeep], ['기다리기', C.blue], ['파', C.red], ['계란', C.red], ['내놓기', C.red]];
  return (
    <>
      <Head k="오늘의 끝, 다음의 시작">언어만 바뀌면 <span style={{ color: C.teal }}>코드</span>가 됩니다</Head>
      <div style={{ ...abs(100, 220, 620), display: 'flex', flexWrap: 'wrap', gap: 14, alignContent: 'flex-start' }}>
        <div style={{ ...kick, width: '100%' }}>라면 3번의 블록</div>
        {blocks.map(([b, c], i) => <Blk key={i} color={c} w={i === 3 ? 140 : 124} style={{ height: 66, fontSize: 21 }}>{b}</Blk>)}
      </div>
      <svg width={260} height={100} style={abs(740, 390)} aria-hidden>
        <path d="M6 50 H232" stroke={C.teal} strokeWidth={8} strokeLinecap="round" />
        <path d="M204 18 L240 50 L204 82" fill="none" stroke={C.teal} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ ...abs(1020, 210, 800), background: '#16211f', borderRadius: 16, padding: '26px 36px', boxShadow: '0 24px 60px -30px rgba(0,0,0,0.7)' }}>
        <div style={{ ...kick, color: '#9db8b2', marginBottom: 12 }}>코드로 읽으면 · Python 모양</div>
        {code.map((l, i) => <div key={i} style={{ ...mono, fontSize: 32, lineHeight: 1.42, color: /^(while|if)/.test(l) ? '#ffc65c' : '#e8f4ef', whiteSpace: 'pre' }}>{l}</div>)}
      </div>
      <div style={{ ...abs(100, 760, 860) }}>
        <div style={{ ...h1, fontSize: 44 }}><span style={{ color: C.teal }}>알고리즘</span>: 문제를 해결하기 위해 설계한 절차</div>
        <div style={{ ...body, fontSize: 28, marginTop: 14, color: C.ink, fontWeight: 600 }}>문제 이해 → 분해 → 절차 설계 → 실행하고 고치기</div>
        <div style={{ ...body, marginTop: 14 }}>다음 시간부터 이 언어, 파이썬을 배웁니다.</div>
      </div>
    </>
  );
}

export const SLIDE_COUNT = 21;

export default function AlgorithmDesignDeck() {
  return (
    <Deck>
      <Page nav="표지" n={1}><Scene><CoverScene /></Scene></Page>
      <Page nav="이미 설계해 봤다" n={2}><S02 /></Page>
      <Page nav="떠오르는 말" n={3}><S03 /></Page>
      <Page nav="문제란 무엇인가" n={4}><Scene><GapScene /></Scene></Page>
      <Page nav="알고리즘의 정의" n={5}><S05 /></Page>
      <Page nav="명확성" n={6}><S06 /></Page>
      <Page nav="다섯 질문" n={7}><S07 /></Page>
      <Page nav="업다운 한 판" n={8}><UpDownGame /></Page>
      <Page nav="같은 문제, 다른 설계" n={9}><S08 /></Page>
      <Page nav="설계의 네 단계" n={10}><Scene freezeAt={3}><OrbitScene /></Scene></Page>
      <Page nav="세 가지 구조" n={11}><S10 /></Page>
      <Page nav="점등봇 화면" n={12}><S11 /></Page>
      <Page nav="7번 설계" n={13}><S12 /></Page>
      <Page nav="실행하고 고치기" n={14}><S13 /></Page>
      <Page nav="활동 1 점등봇" n={15}><S14 /></Page>
      <Page nav="돌아보기: 분기" n={16}><S15 /></Page>
      <Page nav="도담이네 심야 라면" n={17}><S16 /></Page>
      <Page nav="시간 막대" n={18}><Scene><TimelineScene /></Scene></Page>
      <Page nav="활동 2 라면" n={19}><S18 /></Page>
      <Page nav="돌아보기: 설계" n={20}><S19 /></Page>
      <Page nav="파이썬으로" n={21}><S20 /></Page>
    </Deck>
  );
}
