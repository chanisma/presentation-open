import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import Build from '../../../../src/deck/Build';
import { useDeck } from '../../../../src/deck/DeckContext';
import {
  Scene,
  useSceneTime,
  interpolate,
  riseIn,
  easeInOut,
} from '../../../../src/scene';
import { Pointer, AppWindow, typed, popIn, clickFlash } from '../../../../src/walkthrough';

/* ── 정보과제연구 · 바이브코딩: 말이 설계가 되다 (18장, 3차시 · 2교시 구성) ──
   plan: data/2026-2/정보과제연구/바이브코딩/plan.md
   1교시: 표지 → 스톱워치 씬 → 정의 → 프롬프트 씬 → 6요소 대비
          → 우선순위 선반 → 조각 루프 씬 → 버그 리포트 → 함정 넷 → 도구·초안
   2교시: 매핑 → 저장·실행 walkthrough → 실습 → 처방전 → 출구티켓 → 성장 비교 → 마무리 */

const C = {
  emerald: '#0ea371',
  emeraldSoft: '#34d399',
  cyan: '#0891b2',
  cyanSoft: '#22d3ee',
  amber: '#d97706',
  amberSoft: '#fbbf24',
  coral: '#e11d48',
  violet: '#7c3aed',
  slate: '#475569',
};

const BASE = 'data/2026-2/정보과제연구/바이브코딩';
const ACTIVITY_URL = `${BASE}/활동지.html`;
const GEMINI_URL = 'https://gemini.google.com';

const IMG = {
  cover: `${BASE}/images/stage-vibe-cover.png`,
  stopwatch: `${BASE}/images/stage-stopwatch.png`,
  kitchen: `${BASE}/images/stage-kitchen.png`,
  sculpt: `${BASE}/images/stage-sculpt.png`,
  deskTools: `${BASE}/images/stage-desk-tools.png`,
  workshop: `${BASE}/images/stage-workshop.png`,
  gallery: `${BASE}/images/stage-gallery.png`,
  openai: 'assets/external/openai.png',
};

/* ── Fit — 1920×1080 설계 박스를 화면에 맞춰 통째로 배율 변환 ────────── */
const DW = 1920, DH = 1080;
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
function Center({ center, children }: { center?: boolean; children: ReactNode }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: center ? 'center' : 'stretch', textAlign: center ? 'center' : undefined, gap: center ? 18 : undefined, padding: '64px 88px' }}>
      {children}
    </div>
  );
}

/* 풀블리드 무대 이미지 + 밝은 크림 스크림 — 라이트 테마용 */
function Stage({ src, scrim = 'linear-gradient(90deg, rgba(250,246,236,0.94) 0%, rgba(250,246,236,0.62) 45%, rgba(250,246,236,0.18) 100%)', alt = '', style }: { src: string; scrim?: string; alt?: string; style?: CSSProperties }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', ...style }} aria-hidden={alt === ''}>
      <img src={src} alt={alt} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: scrim }} />
    </div>
  );
}

const card: CSSProperties = {
  background: 'var(--surface-2, rgba(255,255,255,0.85))',
  border: '1px solid var(--line)',
  borderRadius: 18,
  padding: '24px 28px',
  boxShadow: '0 18px 50px -30px rgba(20, 70, 50, 0.25)',
};
const kw: CSSProperties = { wordBreak: 'keep-all' };
const mono: CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

/* 6요소 — 색 매핑은 plan.md 헤더가 단일 정의처 (S6·S12·활동지 동일) */
const ELEM = [
  { key: '대상', q: '누가 보나', color: C.cyan },
  { key: '목적', q: '왜 만드나', color: C.emerald },
  { key: '내용', q: '무엇이 들어가나', color: C.amber },
  { key: '형식', q: '어떤 결과물인가', color: C.slate },
  { key: '제약', q: '반드시 지킬 경계는', color: C.coral },
  { key: '성공 기준', q: '완성을 어떻게 시험하나', color: C.violet },
];

/* 여정 6칸 트랙 — 표지(S1)·마무리(S18) 공용 */
const JOURNEY = [
  { n: 1, t: '코드 없이 만든 사람들', half: 1 },
  { n: 2, t: '바이브코딩이란', half: 1 },
  { n: 3, t: '애매하면 생기는 일', half: 1 },
  { n: 4, t: '깎아 나가는 루프', half: 1 },
  { n: 5, t: '내 기획서를 프롬프트로', half: 2 },
  { n: 6, t: '실행과 수정', half: 2 },
];
function Journey({ lit = 0 }: { lit?: number }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 860 }}>
      {JOURNEY.map((j) => {
        const color = j.half === 1 ? C.emerald : C.cyan;
        const on = j.n <= lit;
        return (
          <div key={j.n} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 999,
            border: `1px solid color-mix(in srgb, ${color} ${on ? 75 : 40}%, transparent)`,
            background: on ? `color-mix(in srgb, ${color} 14%, white)` : 'rgba(255,255,255,0.6)',
            color: 'var(--fg)', fontSize: 18, fontWeight: 700, ...kw,
          }}>
            <span style={{ ...mono, color, fontSize: 18 }}>{j.half === 1 ? '1교시' : '2교시'} · {j.n}</span>
            {j.t}
          </div>
        );
      })}
    </div>
  );
}

/* ════════════════════ S2 — 세 개의 스톱워치 (씬) ════════════════════ */
function StopwatchScene() {
  const t = useSceneTime();
  const { clicks } = useDeck();
  const CASES = [
    {
      time: '45분', color: C.emerald, r: 152, cx: 322, cy: 330, at: 0.25,
      title: '파라데이의 챗봇 · 2024',
      lines: ['Cloudflare 임원의 8살 딸', '두 번째 코딩 수업 — AI(Cursor)와 대화하며', '45분 만에 해리 포터 말투 챗봇 완성'],
      num: '45분',
    },
    {
      time: '3시간', color: C.cyan, r: 126, cx: 706, cy: 218, at: 0.55,
      title: 'fly.pieter.com · 2025',
      lines: ['개발자 피터 레벨스 — 코드는 AI에게', '약 3시간 만에 비행 시뮬레이터 첫 버전', '17일 만에 연 매출 환산(ARR) 100만 달러*'],
      num: '3시간',
    },
    {
      time: '3주', color: C.amber, r: 134, cx: 618, cy: 578, at: 0.85,
      title: 'Base44 · 2025',
      lines: ['마오르 슐로모, 거의 혼자 창업', '출시 3주 만에 ARR 100만 달러*', '6개월 뒤 Wix에 초기 지급 8,000만 달러 인수'],
      num: '3주',
    },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <Stage src={IMG.stopwatch} scrim="linear-gradient(180deg, rgba(250,246,236,0.9) 0%, rgba(250,246,236,0.78) 100%)" />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 54, textAlign: 'center' }}>
        <div className="kicker" style={riseIn(t, 0.05)}>실화 셋 · 1교시</div>
        <h2 className="headline" style={{ margin: '10px auto 0', maxWidth: 1100, ...kw, ...riseIn(t, 0.2) }}>
          코드를 <span className="accent-text">직접 쓰지 않고</span> 만들었다
        </h2>
      </div>
      {/* 좌 60% — 스톱워치 존 */}
      <svg viewBox="0 0 1000 760" style={{ position: 'absolute', left: 30, top: 250, width: 1060, height: 800, overflow: 'visible' }}>
        {CASES.map((c, i) => {
          const open = clicks >= i + 1;
          const rise = riseIn(t, c.at);
          return (
            <g key={i} style={{ opacity: rise.opacity as number, transform: `translateY(${open ? 0 : 0}px)` }}>
              {/* 크라운 버튼 */}
              <rect x={c.cx - 16} y={c.cy - c.r - 34} width={32} height={26} rx={6} fill={c.color} opacity={0.9} />
              <rect x={c.cx - 5} y={c.cy - c.r - 46} width={10} height={14} rx={3} fill={c.color} opacity={0.9} />
              {/* 본체 */}
              <circle cx={c.cx} cy={c.cy} r={c.r} fill="rgba(255,255,255,0.92)" stroke={c.color} strokeWidth={7} />
              {/* 눈금 */}
              {Array.from({ length: 12 }, (_, k) => {
                const a = (k / 12) * Math.PI * 2;
                const r1 = c.r - 14, r2 = c.r - 26;
                return <line key={k} x1={c.cx + r1 * Math.sin(a)} y1={c.cy - r1 * Math.cos(a)} x2={c.cx + r2 * Math.sin(a)} y2={c.cy - r2 * Math.cos(a)} stroke={c.color} strokeWidth={3} opacity={0.5} />;
              })}
              {/* 시간 라벨 */}
              <text x={c.cx} y={c.cy + c.r * 0.16} textAnchor="middle" fill="var(--fg)" style={{ font: `800 ${c.r * 0.42}px var(--font-body, sans-serif)` }}>{c.num}</text>
              {/* 바늘 — 열리기 전엔 t로 돌고, 열리면 12시에 멈춤 ("탁") */}
              <line
                x1={c.cx} y1={c.cy}
                x2={c.cx + (c.r - 44) * Math.sin(open ? 0 : t * 1.6 + i)}
                y2={c.cy - (c.r - 44) * Math.cos(open ? 0 : t * 1.6 + i)}
                stroke={c.color} strokeWidth={5} strokeLinecap="round"
                style={{ transition: 'all 0.35s' }}
              />
              <circle cx={c.cx} cy={c.cy} r={9} fill={c.color} />
              {/* 뚜껑 — 클릭하면 왼쪽 경첩으로 열림 */}
              <path
                d={`M ${c.cx - c.r} ${c.cy} A ${c.r} ${c.r} 0 0 1 ${c.cx + c.r} ${c.cy} Z`}
                fill={`color-mix(in srgb, ${c.color} 22%, white)`}
                stroke={c.color} strokeWidth={4}
                style={{
                  transformOrigin: `${c.cx}px ${c.cy}px`,
                  transform: open ? 'translateY(-120px) rotate(-10deg)' : 'none',
                  opacity: open ? 0 : 0.3,
                  transition: 'transform 0.6s ease, opacity 0.55s ease',
                }}
              />
              {/* 열리면 결과물 아이콘이 떠오름 */}
              <g style={{ opacity: open ? 1 : 0, transform: open ? 'translateY(0)' : 'translateY(26px)', transition: 'all 0.5s 0.3s' }}>
                {i === 0 && (
                  <g>
                    <rect x={c.cx - 52} y={c.cy - c.r - 118} width={104} height={64} rx={16} fill={c.color} opacity={0.92} />
                    <path d={`M ${c.cx - 12} ${c.cy - c.r - 54} l 10 20 l 6 -20 Z`} fill={c.color} opacity={0.92} />
                    <circle cx={c.cx - 24} cy={c.cy - c.r - 86} r={6} fill="white" />
                    <circle cx={c.cx} cy={c.cy - c.r - 86} r={6} fill="white" />
                    <circle cx={c.cx + 24} cy={c.cy - c.r - 86} r={6} fill="white" />
                  </g>
                )}
                {i === 1 && (
                  <path d={`M ${c.cx - 50} ${c.cy - c.r - 66} L ${c.cx + 54} ${c.cy - c.r - 96} L ${c.cx + 6} ${c.cy - c.r - 44} L ${c.cx - 4} ${c.cy - c.r - 62} Z`} fill={c.color} opacity={0.92} />
                )}
                {i === 2 && (
                  <g>
                    <rect x={c.cx - 54} y={c.cy - c.r - 116} width={108} height={72} rx={10} fill="white" stroke={c.color} strokeWidth={4} />
                    <rect x={c.cx - 54} y={c.cy - c.r - 116} width={108} height={20} rx={10} fill={c.color} opacity={0.9} />
                    <rect x={c.cx - 40} y={c.cy - c.r - 84} width={56} height={7} rx={3.5} fill={c.color} opacity={0.55} />
                    <rect x={c.cx - 40} y={c.cy - c.r - 70} width={78} height={7} rx={3.5} fill={c.color} opacity={0.35} />
                  </g>
                )}
              </g>
            </g>
          );
        })}
      </svg>
      {/* 우 40% — 캡션 존 */}
      <div style={{ position: 'absolute', right: 76, top: 262, width: 620, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {CASES.map((c, i) => {
          const on = clicks >= i + 1;
          return (
            <div key={i} style={{
              ...card, borderLeft: `5px solid ${c.color}`,
              opacity: on ? 1 : 0.18, transform: on ? 'translateX(0)' : 'translateX(18px)',
              transition: 'all 0.5s',
            }}>
              <div style={{ fontWeight: 800, fontSize: 21, color: c.color, ...kw }}>{c.title}</div>
              {c.lines.map((l) => (
                <div key={l} style={{ fontSize: 20, color: 'var(--fg)', marginTop: 6, ...kw }}>{l}</div>
              ))}
            </div>
          );
        })}
        <div style={{ fontSize: 18, color: 'var(--fg-muted)', ...kw, opacity: clicks >= 2 ? 1 : 0, transition: 'opacity 0.5s' }}>
          * 수치는 당사자 발표 기준 · ARR = 연간 반복 매출 환산
        </div>
      </div>
    </div>
  );
}

/* ════════════════════ S5 — 주문서 빈칸 공정 (씬) ════════════════════ */
function OrderScene() {
  const t = useSceneTime();
  const { clicks } = useDeck();
  const cardX = interpolate(t, [0.8, 3.0], [90, 800], easeInOut);
  const plateX = interpolate(t, [4.6, 6.0], [1080, 1465], easeInOut);
  const STAMPS = ['무난한 파랑', '아무 글꼴', '지어낸 내용', 'PC 전용'];
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <Stage src={IMG.kitchen} scrim="linear-gradient(180deg, rgba(250,246,236,0.92) 0%, rgba(250,246,236,0.8) 100%)" />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 52, textAlign: 'center' }}>
        <div className="kicker" style={riseIn(t, 0.05)}>명확성 ① · AI는 되묻지 않는다</div>
        <h2 className="headline" style={{ margin: '10px auto 0', maxWidth: 1100, ...kw, ...riseIn(t, 0.2) }}>
          애매한 프롬프트는 <span className="accent-text">AI가 채운다</span>
        </h2>
      </div>
      {/* 클릭 1 — 41.1% 카운터 */}
      <div style={{
        position: 'absolute', right: 84, top: 210, width: 470, ...card,
        borderLeft: `5px solid ${C.coral}`,
        opacity: clicks >= 1 ? 1 : 0, transform: clicks >= 1 ? 'translateY(0)' : 'translateY(-14px)', transition: 'all 0.5s',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{ ...mono, fontWeight: 800, fontSize: 52, color: C.coral }}>41.1%</span>
          <span style={{ fontSize: 19.5, color: 'var(--fg)', fontWeight: 700, ...kw }}>말 안 한 요구까지 믿고 맡길 수 있던 비율</span>
        </div>
        <div style={{ fontSize: 19, color: 'var(--fg-muted)', marginTop: 6, ...kw }}>무명시 요구를 98% 이상 충족한 조합 기준 — 2025 연구 "What Prompts Don't Say"</div>
        <div style={{ fontSize: 18, color: 'var(--fg-muted)', marginTop: 10, borderTop: '1px solid var(--hair-2)', paddingTop: 10, lineHeight: 1.65, ...kw }}>
          AI는 모호함을 인식해도 거의 되묻지 않고 바로 답한다 (2026 연구 "Knowing but Not Showing") — 운 좋게 맞아도 다음번 보장은 없다.
        </div>
      </div>
      {/* 공정 라인 */}
      <svg viewBox="0 0 1800 660" style={{ position: 'absolute', left: 60, right: 60, top: 380, width: 1800, height: 660, overflow: 'visible' }}>
        {/* 컨베이어 */}
        <line x1={40} y1={560} x2={1760} y2={560} stroke="var(--fg-muted)" strokeWidth={5} opacity={0.4} />
        {Array.from({ length: 15 }, (_, i) => (
          <circle key={i} cx={90 + i * 118} cy={584} r={15} fill="none" stroke="var(--fg-muted)" strokeWidth={4} opacity={0.3} />
        ))}
        {/* 주방 창구 (도형 목업 — 인물 없음) */}
        <g>
          <rect x={760} y={120} width={330} height={440} rx={18} fill="rgba(255,255,255,0.9)" stroke={C.emerald} strokeWidth={5} />
          {/* 셔터 */}
          {Array.from({ length: 5 }, (_, i) => (
            <line key={i} x1={775} y1={168 + i * 26} x2={1075} y2={168 + i * 26} stroke={C.emerald} strokeWidth={5} opacity={0.35} />
          ))}
          <rect x={790} y={64} width={270} height={46} rx={12} fill={C.emerald} />
          <text x={925} y={96} textAnchor="middle" fill="white" style={{ font: '800 26px var(--font-body, sans-serif)' }}>AI</text>
          <text x={925} y={150} textAnchor="middle" fill="var(--fg-muted)" style={{ font: '700 19.5px var(--font-body, sans-serif)' }}>되묻지 않음 · 즉시 작업</text>
          <text x={925} y={545} textAnchor="middle" fill="#b91c1c" style={{ font: '800 19px var(--font-body, sans-serif)' }}>채운 값은 추측 — 검증은 내 몫</text>
        </g>
        {/* 주문서 카드 — 컨베이어를 타고 창구로 */}
        <g transform={`translate(${cardX} 0)`}>
          <rect x={0} y={240} width={250} height={310} rx={14} fill="white" stroke="var(--fg-muted)" strokeWidth={3} />
          <text x={125} y={276} textAnchor="middle" fill="var(--fg)" style={{ font: '800 19px var(--font-body, sans-serif)' }}>프롬프트</text>
          {['웹페이지', '만들어 줘', '', '', '', ''].map((v, i) => {
            const y = 296 + i * 40;
            const stampOn = i >= 2 && t > 2.3 + (i - 2) * 0.4;
            return (
              <g key={i}>
                <rect x={16} y={y} width={218} height={32} rx={7} fill={v ? 'color-mix(in srgb, #0ea371 10%, white)' : '#f3efe4'} stroke={v ? C.emerald : 'var(--fg-faint)'} strokeWidth={1.8} strokeDasharray={v ? undefined : '5 4'} />
                {v && <text x={125} y={y + 22} textAnchor="middle" fill="var(--fg)" style={{ font: '700 19px var(--font-body, sans-serif)' }}>{v}</text>}
                {/* 도장 — 빈칸 위에 탁탁 */}
                {stampOn && (
                  <g style={{ transformOrigin: `${125}px ${y + 16}px`, animation: 'none' }}>
                    <rect x={30} y={y + 2} width={190} height={28} rx={6} fill="none" stroke="#2563eb" strokeWidth={2.5} transform={`rotate(${i % 2 ? 2.5 : -2.5} 125 ${y + 16})`} />
                    <text x={125} y={y + 22} textAnchor="middle" fill="#2563eb" transform={`rotate(${i % 2 ? 2.5 : -2.5} 125 ${y + 16})`} style={{ font: '800 18.5px var(--font-body, sans-serif)' }}>{STAMPS[i - 2]}</text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
        {/* 예상 밖 접시 — 우측으로 */}
        <g transform={`translate(${plateX} 0)`} opacity={interpolate(t, [4.2, 4.7], [0, 1])}>
          <ellipse cx={130} cy={545} rx={150} ry={26} fill="white" stroke="var(--fg-muted)" strokeWidth={3} />
          <g>
            <rect x={40} y={330} width={185} height={186} rx={10} fill="white" stroke="#2563eb" strokeWidth={3.5} />
            <rect x={40} y={330} width={185} height={36} rx={10} fill="#2563eb" opacity={0.85} />
            <text x={132} y={355} textAnchor="middle" fill="white" style={{ font: '800 19.5px var(--font-body, sans-serif)' }}>Welcome!</text>
            <rect x={56} y={382} width={100} height={9} rx={4} fill="var(--fg-faint)" opacity={0.7} />
            <rect x={56} y={400} width={150} height={9} rx={4} fill="var(--fg-faint)" opacity={0.45} />
            <rect x={56} y={418} width={126} height={9} rx={4} fill="var(--fg-faint)" opacity={0.45} />
            <text x={132} y={478} textAnchor="middle" fill={C.coral} style={{ font: '800 30px var(--font-body, sans-serif)' }}>?</text>
          </g>
          <text x={130} y={620} textAnchor="middle" fill="var(--fg-muted)" style={{ font: '700 19.5px var(--font-body, sans-serif)' }}>내가 시킨 것 맞나…?</text>
        </g>
      </svg>
    </div>
  );
}

/* ════════════════════ S8 — 조각 깎기 루프 (씬) ════════════════════ */
function SculptScene() {
  const t = useSceneTime();
  const { clicks } = useDeck();
  const round = Math.min(clicks, 3);
  /* 돌 실루엣 4단계 — 같은 중심의 폴리곤 (크로스페이드) */
  const SHAPES = [
    'M700,176 L752,214 L826,208 L818,298 L858,362 L788,404 L768,470 L688,442 L606,472 L586,392 L536,330 L588,268 L574,210 L648,220 Z',
    'M700,190 L784,222 L824,300 L810,384 L752,440 L668,452 L594,420 L566,342 L582,258 L634,204 Z',
    'M700,200 C768,200 816,252 816,320 C816,392 762,440 700,440 C638,440 584,392 584,320 C584,252 632,200 700,200 Z',
    'M700,182 L744,268 L838,282 L770,348 L788,442 L700,398 L612,442 L630,348 L562,282 L656,268 Z',
  ];
  const NODES = [
    { key: '계획', sub: '이번 바퀴의 목표 하나', angle: -90, color: C.cyan },
    { key: '명령', sub: '첫 생성엔 전체 · 수정엔 하나', angle: 0, color: C.emerald },
    { key: '확인', sub: '성공 기준을 직접 눌러 본다', angle: 90, color: C.amber },
    { key: '피드백', sub: '구체적으로 — 다시 계획으로', angle: 180, color: C.coral },
  ];
  const RX = 470, RY = 220, CX = 700, CY = 330;
  const curAngle = -90 + ((t * 60) % 360); // 6초에 한 바퀴
  const EXAMPLES = ['"제목을 초록 계열로 바꿔 줘"', '"제출하면 아래 목록에 추가되게 해 줘"', '"빈 입력이면 경고가 뜨게 해 줘"'];
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <Stage src={IMG.sculpt} scrim="linear-gradient(180deg, rgba(250,246,236,0.94) 0%, rgba(250,246,236,0.72) 55%, rgba(250,246,236,0.55) 100%)" />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 52, textAlign: 'center' }}>
        <div className="kicker" style={riseIn(t, 0.05)}>루프 · 한 번에 완벽한 결과는 없다</div>
        <h2 className="headline" style={{ margin: '10px auto 0', maxWidth: 1150, ...kw, ...riseIn(t, 0.2) }}>
          계획 → 명령 → 확인 → 피드백, <span className="accent-text">돌 때마다 깎인다</span>
        </h2>
      </div>
      <svg viewBox="0 0 1400 660" style={{ position: 'absolute', left: 130, top: 300, width: 1400, height: 660, overflow: 'visible' }}>
        {/* 궤도 */}
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="none" stroke="var(--fg-muted)" strokeWidth={2.5} strokeDasharray="8 8" opacity={0.5} />
        {/* 돌 — 바퀴마다 매끈해짐 (크로스페이드) */}
        {SHAPES.map((d, i) => (
          <path key={i} d={d} fill={i === 3 ? `color-mix(in srgb, ${C.emerald} 26%, white)` : i === 0 ? 'color-mix(in srgb, var(--fg) 10%, white)' : 'rgba(255,255,255,0.92)'} stroke={i === 3 ? C.emerald : 'var(--fg-muted)'} strokeWidth={4.5}
            style={{ opacity: round === i ? 1 : 0, transition: 'opacity 0.5s' }} />
        ))}
        <text x={CX} y={CY + 8} textAnchor="middle" fill="var(--fg-muted)" style={{ font: '700 19px var(--font-body, sans-serif)' }}>{round === 0 ? '내 결과물 · 초안' : '내 결과물'}</text>
        {/* 궤도 커서 — 끌·정 */}
        <g transform={`translate(${CX + RX * Math.cos((curAngle * Math.PI) / 180)} ${CY + RY * Math.sin((curAngle * Math.PI) / 180)})`} opacity={interpolate(t, [1.2, 1.7], [0, 1])}>
          <circle r={13} fill="var(--fg)" />
          <circle r={5.5} fill="white" />
        </g>
        {/* 노드 4 */}
        {NODES.map((n, i) => {
          const x = CX + RX * Math.cos((n.angle * Math.PI) / 180);
          const y = CY + RY * Math.sin((n.angle * Math.PI) / 180);
          const diff = Math.abs(((curAngle - n.angle + 540) % 360) - 180);
          const hot = diff > 155;
          const labelDy = n.angle === -90 ? -74 : n.angle === 90 ? 96 : 0;
          const labelDx = n.angle === 0 ? 150 : n.angle === 180 ? -150 : 0;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={hot ? 22 : 16} fill={n.color} opacity={hot ? 1 : 0.75} style={{ transition: 'all 0.25s' }} />
              <text x={x} y={y + 6} textAnchor="middle" fill="white" style={{ font: '800 18.5px var(--font-body, sans-serif)' }}>{i + 1}</text>
              <g transform={`translate(${x + labelDx} ${y + labelDy})`}>
                <text textAnchor="middle" fill={n.color} style={{ font: '800 24px var(--font-body, sans-serif)' }}>{n.key}</text>
                <text y={26} textAnchor="middle" fill="var(--fg-muted)" style={{ font: '600 19px var(--font-body, sans-serif)' }}>{n.sub}</text>
              </g>
            </g>
          );
        })}
      </svg>
      {/* 우상단 — 바퀴 카운터 + 수정 목표 예시 */}
      <div style={{ position: 'absolute', right: 84, top: 212, width: 430, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ ...card, padding: '16px 22px', display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ ...mono, fontWeight: 800, fontSize: 40, color: C.emerald }}>{round}</span>
          <span style={{ fontSize: 20.5, fontWeight: 700, color: 'var(--fg)' }}>바퀴 — 필수 2 · 도전 3</span>
          <span style={{ fontSize: 18, color: 'var(--fg-muted)', marginLeft: 'auto', ...kw }}>수정 요청→확인 = 1바퀴 · 기록 4칸</span>
        </div>
        {EXAMPLES.map((e, i) => (
          <div key={i} style={{
            ...card, padding: '12px 18px', fontSize: 19.5, fontWeight: 600, color: 'var(--fg)', ...kw,
            borderLeft: `4px solid ${C.emerald}`,
            opacity: round >= i + 1 ? 1 : 0.15, transform: round >= i + 1 ? 'translateX(0)' : 'translateX(14px)', transition: 'all 0.4s',
          }}>
            바퀴 {i + 1} — {e}
          </div>
        ))}
      </div>
      {/* 좌하단 캡션 — 빈 벤치 영역 */}
      <div style={{ position: 'absolute', left: 110, bottom: 130, width: 460, textAlign: 'left', fontSize: 18, lineHeight: 1.7, color: 'var(--fg-muted)', ...kw, opacity: interpolate(t, [1.2, 2], [0, 1]) }}>
        "AI를 짧은 목줄에 두라" — Karpathy, 2025 YC 강연 (취지 요약)<br />조각가는 한 번의 망치질로 작품을 만들지 않는다
      </div>
    </div>
  );
}

/* ════════════════════ S13 — 저장·실행 walkthrough (씬) ════════════════════ */
/* 라이트 테마용 '뒤로 물리기' — 창들이 겹치지 않으므로 opacity 감쇠가 안전 */
function fadeBack(t: number, at: number): CSSProperties {
  if (t <= at) return {};
  return { opacity: interpolate(t, [at, at + 0.6], [1, 0.34], easeInOut), filter: 'saturate(0.55)' };
}

/* 창 배치(px)와 클릭 좌표(%)는 함께 계산되어 있다 — 창을 옮기면 포인터도 같이 옮길 것.
   좌표 규약: % = px / 1920(가로)·1080(세로) × 100 */
function SaveRunScene() {
  const t = useSceneTime();
  const copyFlash = clickFlash(t, 2.5);
  const pasted = typed(t, '<!doctype html>\n<html lang="ko">\n<head><meta charset="UTF-8">…', 4.0, 90);
  const fname = typed(t, '나의서비스.html', 6.6, 12);
  const ddOpen = t >= 8.2 && t < 9.35;
  const allFiles = t >= 9.35;
  const saveFlash = clickFlash(t, 10.3);
  const dblFlash = clickFlash(t, 11.9, 0.3) + clickFlash(t, 12.25, 0.3);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 40, textAlign: 'center', zIndex: 2 }}>
        <div className="kicker" style={riseIn(t, 0.05)}>실행 절차 · 한 번 익히면 계속 쓴다</div>
        <h2 className="headline" style={{ margin: '8px auto 0', maxWidth: 1300, ...kw, ...riseIn(t, 0.15) }}>
          코드를 <span className="accent-text">내려받아</span>, 브라우저로 <span className="accent-text">확인</span>한다
        </h2>
      </div>
      {/* ① AI 채팅 — 코드 답변 (어느 도구든 화면 구성은 비슷하다) */}
      <AppWindow kind="browser" url="내가 고른 AI — 코드 답변 화면" badge="①"
        style={{ left: 70, top: 190, width: 620, height: 400, ...popIn(t, 0.3), ...fadeBack(t, 3.2) }}>
        <div style={{ position: 'absolute', inset: 12, borderRadius: 10, border: '1px solid var(--hair)', background: 'color-mix(in srgb, var(--fg) 4%, white)', overflow: 'hidden' }}>
          {/* 코드 블록 헤더: 좌 라벨 · 우 복사 버튼 — 복사 버튼 중심 = (629, 260)px */}
          <div style={{ display: 'flex', alignItems: 'center', height: 40, padding: '0 12px', borderBottom: '1px solid var(--hair-2)' }}>
            <span style={{ ...mono, fontSize: 18, color: 'var(--fg-muted)' }}>html</span>
            <span style={{
              marginLeft: 'auto', width: 74, height: 28, display: 'grid', placeItems: 'center', borderRadius: 8,
              fontSize: 18, fontWeight: 800, border: `2px solid ${C.emerald}`, color: copyFlash > 0 ? 'white' : C.emerald,
              background: copyFlash > 0 ? C.emerald : 'transparent',
              boxShadow: copyFlash > 0 ? `0 0 ${24 * copyFlash}px ${C.emerald}` : undefined, transition: 'all 0.2s',
            }}>복사</span>
          </div>
          <div style={{ padding: 14, ...mono, fontSize: 18, lineHeight: 1.8, color: 'var(--fg)', textAlign: 'left' }}>
            {'<!doctype html>'}<br />{'<html lang="ko">'}<br />{'<head><meta charset="UTF-8">'}<br />{'  <title>나의 서비스</title>'}<br />{'…'}
          </div>
          <div style={{ position: 'absolute', right: 14, bottom: 12, padding: '6px 14px', borderRadius: 999, background: 'var(--fg)', color: 'var(--bg)', fontSize: 18, fontWeight: 700, opacity: t >= 2.6 && t < 4.0 ? 1 : 0, transition: 'opacity 0.3s' }}>복사됨 ✓</div>
        </div>
      </AppWindow>
      <div style={{ position: 'absolute', left: 70, top: 600, width: 620, textAlign: 'center', fontSize: 18, fontWeight: 700, color: C.coral, ...kw, opacity: interpolate(t, [1.8, 2.4], [0, 1]) }}>
        드래그 복사 금지, 복사 버튼만 — 워드·한글을 거치면 따옴표가 바뀌어 깨질 수 있다
      </div>
      {/* ② 메모장 */}
      <AppWindow kind="app" title="메모장 — 새 문서" badge="②"
        style={{ left: 740, top: 160, width: 520, height: 300, ...popIn(t, 3.2), ...fadeBack(t, 5.8) }}>
        <div style={{ padding: 14, ...mono, fontSize: 18, lineHeight: 1.75, color: 'var(--fg)', textAlign: 'left', whiteSpace: 'pre-wrap' }}>
          {pasted}
        </div>
        <div style={{ position: 'absolute', right: 12, top: 10, padding: '4px 12px', borderRadius: 8, border: '1px solid var(--hair)', fontSize: 18, fontWeight: 700, color: 'var(--fg-muted)', opacity: t >= 4.0 && t < 5.6 ? 1 : 0, transition: 'opacity 0.3s', ...mono }}>Ctrl + V</div>
      </AppWindow>
      {/* ③ 저장 대화상자 — 형식 필드 중심 (1020, 642) · '모든 파일' (1020, 718) · 저장 (1212, 764) */}
      <AppWindow kind="installer" title="다른 이름으로 저장" badge="③"
        style={{ left: 660, top: 520, width: 620, height: 330, ...popIn(t, 5.8), ...fadeBack(t, 11.0) }}>
        <div style={{ padding: '16px 22px', textAlign: 'left', position: 'relative', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 40 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg-muted)', width: 88, flexShrink: 0 }}>파일 이름</span>
            <span style={{ flex: 1, border: '1.5px solid var(--hair)', borderRadius: 8, padding: '7px 12px', ...mono, fontSize: 18, color: 'var(--fg)', background: 'white' }}>{fname || '\u00A0'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 40, marginTop: 12, position: 'relative' }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg-muted)', width: 88, flexShrink: 0 }}>파일 형식</span>
            <span style={{
              flex: 1, border: `2px solid ${allFiles ? C.emerald : C.coral}`, borderRadius: 8, padding: '7px 12px',
              fontSize: 18, fontWeight: 700, color: allFiles ? C.emerald : 'var(--fg)', background: 'white', transition: 'all 0.3s',
            }}>
              {allFiles ? '모든 파일 (*.*)' : '텍스트 문서 (*.txt)'} <span style={{ float: 'right', color: 'var(--fg-faint)' }}>▾</span>
            </span>
            {ddOpen && (
              <div style={{ position: 'absolute', left: 100, right: 0, top: 42, border: '1px solid var(--hair)', borderRadius: 8, background: 'white', boxShadow: 'var(--shadow)', zIndex: 3 }}>
                <div style={{ height: 36, display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 18, fontWeight: 700, color: '#b91c1c' }}>✕ 텍스트 문서 (*.txt)</div>
                <div style={{ height: 36, display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 18, fontWeight: 800, color: C.emerald, background: `color-mix(in srgb, ${C.emerald} 10%, white)` }}>✓ 모든 파일 (*.*)</div>
              </div>
            )}
          </div>
          <div style={{ position: 'absolute', right: 22, top: 210, display: 'flex', gap: 10 }}>
            <span style={{ width: 84, height: 36, display: 'grid', placeItems: 'center', borderRadius: 9, border: '1px solid var(--hair)', fontSize: 18, color: 'var(--fg-muted)' }}>취소</span>
            <span style={{
              width: 92, height: 36, display: 'grid', placeItems: 'center', borderRadius: 9, fontSize: 18, fontWeight: 800, color: 'white',
              background: C.emerald, boxShadow: saveFlash > 0 ? `0 0 ${26 * saveFlash}px ${C.emerald}` : undefined,
            }}>저장</span>
          </div>
          <div style={{ position: 'absolute', left: 22, right: 220, bottom: 14, fontSize: 18, fontWeight: 700, color: C.coral, lineHeight: 1.5, ...kw, opacity: interpolate(t, [8.6, 9.2], [0, 1]) }}>
            '텍스트 문서(*.txt)'인 채 저장하면 더블클릭해도 메모장이 열린다 → "모든 파일"
          </div>
        </div>
      </AppWindow>
      {/* ④ 탐색기 — 파일 아이콘 중심 (128, 730) */}
      <AppWindow kind="app" title="탐색기 — 바탕화면\바이브코딩" badge="④"
        style={{ left: 80, top: 640, width: 420, height: 250, ...popIn(t, 11.0), ...fadeBack(t, 12.9) }}>
        <div style={{ padding: 16, display: 'flex', gap: 20, textAlign: 'left' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 64, height: 76, margin: '0 auto', borderRadius: 8, border: `2.5px solid ${C.emerald}`,
              background: 'white', display: 'grid', placeItems: 'center', fontSize: 18, fontWeight: 800, color: C.emerald,
              boxShadow: dblFlash > 0 ? `0 0 ${20 * dblFlash}px ${C.emerald}` : undefined,
            }}>HTML</div>
            <div style={{ fontSize: 18, marginTop: 6, color: 'var(--fg)', fontWeight: 700 }}>나의서비스.html</div>
          </div>
          <div style={{ fontSize: 18, color: 'var(--fg-muted)', alignSelf: 'center', ...kw }}>더블클릭<br />↓<br />브라우저 실행</div>
        </div>
      </AppWindow>
      {/* ⑤ 결과 브라우저 */}
      <AppWindow kind="browser" url="file:///…/바탕화면/바이브코딩/나의서비스.html" badge="⑤"
        style={{ left: 1310, top: 470, width: 570, height: 440, ...popIn(t, 12.9) }}>
        <div style={{ position: 'absolute', inset: 12, borderRadius: 10, border: '1px solid var(--hair)', background: 'white', overflow: 'hidden' }}>
          <div style={{ height: 54, background: `linear-gradient(100deg, ${C.emeraldSoft}, ${C.cyanSoft})`, display: 'flex', alignItems: 'center', paddingLeft: 16, fontWeight: 800, fontSize: 20, color: '#0b3327' }}>나의 첫 서비스</div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
            {[190, 260, 150].map((w, i) => <div key={i} style={{ height: 11, width: w, borderRadius: 5, background: 'var(--hair)' }} />)}
            <div style={{ width: 130, height: 36, borderRadius: 9, background: C.emerald, opacity: 0.85, display: 'grid', placeItems: 'center', color: 'white', fontSize: 18, fontWeight: 800 }}>제출</div>
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 10, textAlign: 'center', fontSize: 18, fontWeight: 800, color: C.emerald, opacity: interpolate(t, [13.6, 14.2], [0, 1]) }}>이게 진짜 실행 — 짝과 서로 열어 본다</div>
        </div>
      </AppWindow>
      {/* 수정 루프 배너 */}
      <div style={{
        position: 'absolute', left: 560, bottom: 44, padding: '13px 26px', borderRadius: 999,
        border: `2.5px solid ${C.emerald}`, background: 'rgba(255,255,255,0.92)',
        fontSize: 20, fontWeight: 800, color: 'var(--fg)', ...kw,
        opacity: interpolate(t, [14.4, 15.0], [0, 1]),
      }}>
        수정할 때마다 — 복사 → 덮어쓰기 저장(Ctrl+S) → 브라우저 새로고침(F5)
      </div>
      {/* 포인터 — 좌표는 위 창 배치에서 산출한 % */}
      <Pointer path={[
        { t: 1.6, x: 29, y: 26 },
        { t: 2.5, x: 32.8, y: 24.1, click: true },          // ① 복사 (629, 260)
        { t: 3.8, x: 52.1, y: 28.7 },                        // ② 메모장 본문
        { t: 5.6, x: 55, y: 45 },
        { t: 8.2, x: 53.1, y: 59.4, click: true },           // ③ 파일 형식 (1020, 642)
        { t: 9.35, x: 53.1, y: 66.5, click: true },          // ③ 모든 파일 (1020, 718)
        { t: 10.3, x: 63.1, y: 70.7, click: true },          // ③ 저장 (1212, 764)
        { t: 11.9, x: 6.7, y: 67.6, click: true },           // ④ 더블클릭 (128, 730)
        { t: 12.25, x: 6.7, y: 67.6, click: true },
        { t: 13.8, x: 74, y: 58 },
      ]} />
    </div>
  );
}

/* ════════════════════ 덱 본체 ════════════════════ */

/* 6요소 색 밑줄 조각 */
function U({ c, children }: { c: string; children: ReactNode }) {
  return <span style={{ borderBottom: `4px solid ${c}`, paddingBottom: 1 }}>{children}</span>;
}

function ElemChips({ withQ = false, litKeys }: { withQ?: boolean; litKeys?: string[] }) {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
      {ELEM.map((e) => {
        const lit = !litKeys || litKeys.includes(e.key);
        return (
          <div key={e.key} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            padding: withQ ? '10px 16px' : '8px 16px', borderRadius: 12,
            border: `2px solid ${e.color}`, background: lit ? `color-mix(in srgb, ${e.color} 10%, white)` : 'rgba(255,255,255,0.5)',
            opacity: lit ? 1 : 0.35, transition: 'all 0.4s',
          }}>
            <span style={{ fontWeight: 800, fontSize: 20.5, color: e.color }}>{e.key}</span>
            {withQ && <span style={{ fontSize: 18, color: 'var(--fg-muted)', ...kw }}>{e.q}</span>}
          </div>
        );
      })}
    </div>
  );
}

/* S6 — 좌우 대비 */
function ContrastSlide() {
  const { clicks } = useDeck();
  const VAGUE_TAGS = ['내용은?', '배색은?', '구성은?', '문체는?', '휴대폰은?'];
  return (
    <div style={{ position: 'absolute', inset: 0, padding: '52px 88px 104px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="kicker">명확성 ② · 6요소</div>
        <h2 className="headline" style={{ margin: '8px auto 0', ...kw }}>같은 부탁, <span className="accent-text">다른 결과</span></h2>
      </div>
      <div style={{ flex: 1, display: 'flex', gap: 40, alignItems: 'center', marginTop: 8 }}>
        {/* 좌 — 모호 */}
        <div style={{ width: 560, opacity: clicks >= 1 ? 1 : 0.12, transition: 'all 0.5s' }}>
          <div style={{ ...card, borderColor: 'var(--fg-faint)', color: 'var(--fg-muted)' }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--fg-faint)' }}>모호한 부탁</div>
            <div style={{ fontSize: 25, fontWeight: 700, color: 'var(--fg)', ...kw }}>"우리 학교 소개 페이지 만들어 줘."</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 4 }}>
            {VAGUE_TAGS.map((q, i) => (
              <div key={q} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 2, height: 22 + (i % 3) * 12, background: 'var(--fg-faint)', opacity: 0.6 }} />
                <div style={{ padding: '6px 10px', borderRadius: 9, border: '1.5px dashed var(--fg-faint)', color: 'var(--fg-muted)', fontSize: 18, fontWeight: 700, transform: `rotate(${(i % 2 ? 1 : -1) * (2 + i)}deg)`, background: 'rgba(255,255,255,0.7)', ...kw }}>{q}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 10, fontSize: 18, color: 'var(--fg-muted)', ...kw }}>다섯 칸을 AI가 정한다 — 내용은 지어내서라도</div>
        </div>
        {/* 우 — 구체 (dominant) */}
        <div style={{ flex: 1, opacity: clicks >= 2 ? 1 : 0.12, transform: clicks >= 2 ? 'translateY(0)' : 'translateY(14px)', transition: 'all 0.5s' }}>
          <div style={{ ...card, borderColor: C.emerald, borderWidth: 2, padding: '30px 34px' }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 12, color: C.emerald }}>여섯 가지를 담은 부탁</div>
            <p style={{ fontSize: 22.5, lineHeight: 2.05, color: 'var(--fg)', margin: 0, ...kw }}>
              "<U c={C.cyan}>예비 신입생에게 보여줄</U> 우리 학교 소개 페이지를 <U c={C.slate}>HTML 한 파일로</U>.{' '}
              목적은 자랑이 아니라 <U c={C.emerald}>동아리·급식·기숙사 정보 전달</U>.{' '}
              <U c={C.amber}>내가 주는 내용만 사용</U>하고 <U c={C.coral}>지어내지 말 것</U>.{' '}
              <U c={C.slate}>초록 계열, 스마트폰에서도 깨지지 않게</U>.{' '}
              완성 후 <U c={C.violet}>섹션이 3개인지 스스로 확인</U>."
            </p>
          </div>
        </div>
      </div>
      {/* 하단 — 6요소 칩 */}
      <div style={{ opacity: clicks >= 3 ? 1 : 0, transform: clicks >= 3 ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.5s' }}>
        <ElemChips withQ />
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 19, fontWeight: 800, color: 'var(--fg-muted)', letterSpacing: 2 }}>
          추측할 것이 없게 하라 — 첫 생성(다음 교시)에는 6요소 전체, 수정에는 한 번에 한 가지
        </div>
      </div>
    </div>
  );
}

/* S7 — 2단 선반 */
function ShelfSlide() {
  const MUST = ['목적', '대상', '핵심 내용', '형식 · 한 파일', '금지사항', '성공 기준'];
  const FREE = ['세부 배색', '문구 표현', '아이콘 모양', '여백'];
  return (
    <div style={{ position: 'absolute', inset: 0, padding: '52px 88px 104px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="kicker">명확성 ③ · 우선순위</div>
        <h2 className="headline" style={{ margin: '8px auto 0', ...kw }}>전부 다 적으라는 말이 <span className="accent-text">아니다</span></h2>
      </div>
      <div style={{ flex: 1, display: 'flex', gap: 44, alignItems: 'center' }}>
        <svg viewBox="0 0 1240 620" style={{ width: 1240, height: 620, overflow: 'visible' }}>
          {/* 스포트라이트 */}
          <ellipse cx={620} cy={210} rx={430} ry={80} fill={C.amberSoft} opacity={0.18} />
          {/* 위 선반 — 반드시 명시 */}
          <rect x={120} y={250} width={1000} height={16} rx={7} fill="var(--fg)" opacity={0.75} />
          <text x={120} y={130} fill="var(--fg)" style={{ font: '800 24px var(--font-body, sans-serif)' }}>틀리면 안 되는 것 — 못 박는다</text>
          {MUST.map((m, i) => {
            const x = 136 + i * 164;
            return (
              <g key={m}>
                <circle cx={x + 74} cy={158} r={6} fill="var(--fg)" />
                <line x1={x + 74} y1={158} x2={x + 74} y2={202} stroke="var(--fg)" strokeWidth={3} />
                <rect x={x} y={188} width={148} height={54} rx={10} fill="white" stroke={C.emerald} strokeWidth={2.5} />
                <text x={x + 74} y={220} textAnchor="middle" fill="var(--fg)" style={{ font: '700 18.5px var(--font-body, sans-serif)' }}>{m}</text>
              </g>
            );
          })}
          {/* 아래 선반 — 맡겨도 되는 것 */}
          <rect x={280} y={506} width={680} height={12} rx={6} fill="var(--fg-muted)" opacity={0.4} />
          <text x={280} y={400} fill="var(--fg-muted)" style={{ font: '800 20px var(--font-body, sans-serif)' }}>어떻게 되어도 괜찮은 것 — AI에게 맡긴다</text>
          {FREE.map((f, i) => {
            const x = 316 + i * 160;
            return (
              <g key={f} transform={`rotate(${(i % 2 ? 1 : -1) * 3} ${x + 60} ${470})`} opacity={0.72}>
                <rect x={x} y={444} width={118} height={48} rx={10} fill="rgba(255,255,255,0.8)" stroke="var(--fg-faint)" strokeWidth={2} strokeDasharray="6 4" />
                <text x={x + 59} y={473} textAnchor="middle" fill="var(--fg-muted)" style={{ font: '700 18.5px var(--font-body, sans-serif)' }}>{f}</text>
              </g>
            );
          })}
        </svg>
        {/* 우측 세로 판단 배너 */}
        <div style={{ width: 330, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ ...card, borderLeft: `5px solid ${C.amber}` }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.amber, marginBottom: 6 }}>판단 질문 하나</div>
            <div style={{ fontSize: 23, fontWeight: 800, color: 'var(--fg)', lineHeight: 1.5, ...kw }}>"이게 달라지면<br />내 기획이 무너지는가?"</div>
          </div>
          <div style={{ fontSize: 19, color: 'var(--fg-muted)', lineHeight: 1.7, ...kw }}>
            같은 연구의 실험 조건에서, 요구 19개를 한꺼번에 명시하자 하나하나의 충족률이 오히려 떨어졌다 — 선별해서 못 박는 쪽이 나았다.
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'center', fontSize: 19, fontWeight: 800, color: 'var(--fg-muted)', letterSpacing: 2 }}>몰아넣을수록 하나하나가 흐려진다</div>
    </div>
  );
}

/* S9 — 수선집 카운터 */
function FeedbackSlide() {
  const { clicks } = useDeck();
  return (
    <div style={{ position: 'absolute', inset: 0, padding: '52px 88px 104px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="kicker">루프의 연료 · 피드백 작법</div>
        <h2 className="headline" style={{ margin: '8px auto 0', ...kw }}>피드백은 <span className="accent-text">버그 리포트</span>처럼</h2>
      </div>
      <div style={{ flex: 1, display: 'flex', gap: 44, alignItems: 'center', marginTop: 6 }}>
        {/* 좌 — 나쁜 피드백 */}
        <div style={{ width: 420, display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center', opacity: clicks >= 1 ? 1 : 0.12, transition: 'all 0.5s' }}>
          <div style={{ position: 'relative', padding: '16px 26px', borderRadius: 18, background: 'rgba(255,255,255,0.75)', border: '1.5px solid var(--fg-faint)', color: 'var(--fg-muted)', fontSize: 21, fontWeight: 700 }}>
            "이상해요, 고쳐 주세요"
            <span style={{ position: 'absolute', left: 34, bottom: -12, width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '14px solid var(--fg-faint)' }} />
          </div>
          <div style={{ fontSize: 34, color: 'var(--fg-faint)' }}>⇣</div>
          <div style={{ padding: '14px 24px', borderRadius: 18, border: '1.5px dashed var(--fg-faint)', color: 'var(--fg-faint)', fontSize: 30, fontWeight: 800 }}>?</div>
          <div style={{ fontSize: 18.5, color: 'var(--fg-muted)', textAlign: 'center', ...kw }}>무엇을 고칠지 AI도 모른다 —<br />또 그럴듯한 추측이 온다</div>
        </div>
        {/* 우 — 카드 2종 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18, opacity: clicks >= 2 ? 1 : 0.12, transform: clicks >= 2 ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.5s' }}>
          <div style={{ ...card, borderColor: C.emerald, borderWidth: 2, padding: '26px 30px' }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <span style={{ padding: '4px 12px', borderRadius: 999, background: C.emerald, color: 'white', fontSize: 18, fontWeight: 800 }}>오류 수정 카드</span>
              {['어디서', '실제 결과', '기대 결과'].map((b, i) => (
                <span key={b} style={{ padding: '4px 12px', borderRadius: 999, border: `2px solid ${[C.cyan, C.coral, C.emerald][i]}`, color: [C.cyan, C.coral, C.emerald][i], fontSize: 18, fontWeight: 800 }}>{b}</span>
              ))}
            </div>
            <p style={{ fontSize: 21, lineHeight: 1.9, margin: 0, color: 'var(--fg)', ...kw }}>
              "<U c={C.cyan}>'제출' 버튼을 누르면</U> <U c={C.coral}>아무 일도 일어나지 않아요</U>.
              누르면 <U c={C.emerald}>입력한 내용이 아래 목록에 추가되어야 해요</U>."
            </p>
          </div>
          <div style={{ ...card, padding: '22px 28px' }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <span style={{ padding: '4px 12px', borderRadius: 999, background: C.cyan, color: 'white', fontSize: 18, fontWeight: 800 }}>개선 요청 카드</span>
              {['바꿀 곳', '현재 모습', '원하는 모습', '유지할 것'].map((b, i) => (
                <span key={b} style={{ padding: '4px 12px', borderRadius: 999, border: `2px solid ${[C.cyan, C.amber, C.emerald, C.violet][i]}`, color: [C.cyan, C.amber, C.emerald, C.violet][i], fontSize: 18, fontWeight: 800 }}>{b}</span>
              ))}
            </div>
            <p style={{ fontSize: 18.5, lineHeight: 1.85, margin: 0, color: 'var(--fg)', ...kw }}>
              "<U c={C.cyan}>상단 메뉴</U>가 지금은 <U c={C.amber}>세로로 길어요</U>. <U c={C.emerald}>가로 한 줄로</U> 바꿔 주세요. <U c={C.violet}>나머지 배치는 그대로</U> 두고요."
            </p>
          </div>
        </div>
      </div>
      {/* 하단 띠 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, opacity: clicks >= 3 ? 1 : 0, transition: 'all 0.5s' }}>
        <div style={{ flex: 1, textAlign: 'center', padding: '12px 18px', borderRadius: 12, background: 'color-mix(in srgb, var(--fg) 6%, white)', fontSize: 20, fontWeight: 800, color: 'var(--fg)', ...kw }}>
          AI에게 주는 피드백 = 개발자의 버그 리포트 (Mozilla 지침의 핵심 3요소를 수업용으로 단순화)
        </div>
        <div style={{ padding: '12px 18px', borderRadius: 12, border: `2px solid ${C.amber}`, fontSize: 18.5, fontWeight: 700, color: C.amber, ...kw }}>
          같은 문제 두 번 고쳐도 안 되면 → 새 대화
        </div>
      </div>
    </div>
  );
}

/* S10 — 함정 지뢰밭 */
function TrapSlide() {
  const { clicks } = useDeck();
  const TRAPS = [
    { n: 1, title: '첫 결과를 그대로 받아들임', fix: '첫 출력은 초안 — 두세 바퀴 깎는다', x: 130, y: 220, w: 400, rot: -2.5 },
    { n: 2, title: '수정 요청에 여러 목표를 몰아넣음', fix: '일부가 조용히 무시된다 — 한 번에 한 가지', x: 620, y: 170, w: 430, rot: 1.8 },
    { n: 3, title: '"더 예쁘게" 같은 모호한 피드백', fix: '오류는 어디서·실제·기대 — 개선은 바꿀 곳·현재·원하는·유지', x: 220, y: 560, w: 420, rot: 1.4 },
    { n: 4, title: '고치다가 다른 곳이 망가짐', fix: '수정 후, 아까 되던 기능도 다시 눌러 본다', x: 700, y: 520, w: 500, rot: -1.6 },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, padding: '52px 88px 104px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="kicker">미리 알고 가는 실수</div>
        <h2 className="headline" style={{ margin: '8px auto 0', ...kw }}>처음 하는 사람들이 빠지는 <span className="accent-text">함정 넷</span></h2>
      </div>
      <div style={{ flex: 1, position: 'relative', marginTop: 4 }}>
        <svg viewBox="0 0 1744 720" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden>
          <path d="M330,190 L835,140 L430,540 L950,500" fill="none" stroke="var(--fg-faint)" strokeWidth={2.5} strokeDasharray="8 8" opacity={0.55} />
          <path d="M1060,510 L1245,545" fill="none" stroke="#e11d48" strokeWidth={3} strokeDasharray="6 5" opacity={0.8} />
        </svg>
        {TRAPS.map((tr, i) => {
          const on = clicks >= i + 1;
          const big = i === 3;
          return (
            <div key={tr.n} style={{
              position: 'absolute', left: tr.x, top: tr.y - 130, width: tr.w,
              transform: `rotate(${tr.rot}deg) ${on ? 'scale(1)' : 'scale(0.94)'}`,
              opacity: on ? 1 : 0.1, transition: 'all 0.45s',
            }}>
              <div style={{ ...card, borderColor: big ? C.coral : 'var(--line)', borderWidth: big ? 2.5 : 1, padding: big ? '26px 30px' : '20px 24px' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ width: 38, height: 38, borderRadius: '50%', background: big ? C.coral : 'var(--fg)', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>{tr.n}</span>
                  <span style={{ fontWeight: 800, fontSize: big ? 22 : 19.5, color: 'var(--fg)', ...kw }}>{tr.title}</span>
                </div>
                <div style={{ marginTop: 8, fontSize: big ? 17 : 15.5, color: 'var(--fg-muted)', ...kw }}>{tr.fix}</div>
              </div>
            </div>
          );
        })}
        {/* Replit 신문 조각 */}
        <div style={{
          position: 'absolute', left: 1250, top: 420, width: 420, transform: 'rotate(2.4deg)',
          opacity: clicks >= 4 ? 1 : 0, transition: 'all 0.5s 0.2s',
          background: '#fffdf6', border: '1px solid var(--hair)', borderRadius: 6, padding: '20px 24px',
          boxShadow: '0 22px 50px -28px rgba(20,70,50,0.35)',
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg-faint)', letterSpacing: 3, borderBottom: '2px solid var(--fg)', paddingBottom: 6 }}>2025 · 실화</div>
          <div style={{ fontSize: 20.5, fontWeight: 800, color: 'var(--fg)', marginTop: 10, lineHeight: 1.5, ...kw }}>
            AI 에이전트, "수정 금지" 지시 어기고 제작 중이던 프로젝트의 운영 DB 삭제
          </div>
          <div style={{ fontSize: 18, color: 'var(--fg-muted)', marginTop: 8, ...kw }}>맡긴다 ≠ 믿는다 — 확인은 사람 몫이다 (Replit 사고)</div>
        </div>
      </div>
      <div style={{ textAlign: 'center', fontSize: 19, fontWeight: 800, color: 'var(--fg-muted)', letterSpacing: 2 }}>
        이 넷은 다음 교시 활동지에 체크 칸으로 다시 나온다
      </div>
    </div>
  );
}

/* S11 — 도구 준비 + 초안 (activity) */
function ToolPrepSlide() {
  const TOOLS = [
    { name: 'Gemini', url: 'gemini.google.com', href: 'https://gemini.google.com', color: C.emerald, logo: '' },
    { name: 'ChatGPT', url: 'chatgpt.com', href: 'https://chatgpt.com', color: C.cyan, logo: IMG.openai },
    { name: 'Claude', url: 'claude.ai', href: 'https://claude.ai', color: C.violet, logo: '' },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, padding: '52px 88px 104px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="kicker">1교시 마무리 · 다음 교시 준비</div>
        <h2 className="headline" style={{ margin: '8px auto 0', ...kw }}>오늘 끝낼 두 가지 — <span className="accent-text">로그인, 그리고 초안</span></h2>
      </div>
      <div style={{ flex: 1, display: 'flex', gap: 36, marginTop: 20 }}>
        {/* 좌 — 도구는 자유 선택 (순위 없음) */}
        <div style={{ width: 860, display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--fg)', ...kw }}>도구는 셋 중 아무거나 — 쓰던 것, 편한 것</div>
          {TOOLS.map((tl) => (
            <a key={tl.name} href={tl.href} target="_blank" rel="noopener" style={{ textDecoration: 'none' }}>
              <div style={{ ...card, borderColor: tl.color, borderWidth: 2, padding: '17px 28px', display: 'flex', alignItems: 'center', gap: 16 }}>
                {tl.logo ? <img src={tl.logo} alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} /> : <span style={{ width: 32, height: 32, borderRadius: 9, background: `color-mix(in srgb, ${tl.color} 16%, white)`, border: `2px solid ${tl.color}` }} />}
                <span style={{ fontWeight: 800, fontSize: 26, color: tl.color }}>{tl.name}</span>
                <span style={{ marginLeft: 'auto', fontSize: 18, fontWeight: 700, color: tl.color, textDecoration: 'underline' }}>{tl.url} ↗</span>
              </div>
            </a>
          ))}
          <div style={{ ...card, borderLeft: `5px solid ${C.amber}`, padding: '15px 24px', fontSize: 18.5, color: 'var(--fg)', lineHeight: 1.7, ...kw }}>
            학교 계정에서는 화면 안 미리보기가 막혀 있을 수 있다 — 그래서 <b>코드를 복사(또는 다운로드)해 파일로 저장하고, 브라우저에서 직접 연다</b>. 방법은 다음 교시 첫 화면에서 연습한다.
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ flex: 1, padding: '12px 20px', borderRadius: 12, border: `2px solid ${C.coral}`, fontSize: 18, fontWeight: 700, color: C.coral, ...kw }}>
              개인정보 규칙 — 이름·학번·연락처는 프롬프트에 넣지 않는다
            </div>
            <div style={{ padding: '12px 20px', borderRadius: 12, background: 'color-mix(in srgb, var(--fg) 6%, white)', fontSize: 18, fontWeight: 800, color: 'var(--fg)', ...kw }}>
              수정 요청은 최대 5회 (수업 규칙)
            </div>
          </div>
        </div>
        {/* 우 — 활동지 카드 */}
        <div style={{ flex: 1, position: 'relative', ...card, padding: 0, overflow: 'hidden' }}>
          <img src={IMG.deskTools} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(250,246,236,0.62), rgba(250,246,236,0.9))' }} />
          <div style={{ position: 'relative', padding: '26px 30px', display: 'flex', flexDirection: 'column', height: '100%', gap: 13 }}>
            <div style={{ fontWeight: 800, fontSize: 23, color: 'var(--fg)', ...kw }}>활동지 1단계 — 프롬프트 초안</div>
            <div style={{ fontSize: 18.5, color: 'var(--fg)', lineHeight: 1.75, ...kw }}>
              떠오르는 대로 '처음 명령'을 쓰고, 기획서 여섯 칸을 6요소로 옮긴다 — 우선 대상·목적·내용·형식 4칸.
            </div>
            <div style={{ background: 'rgba(255,255,255,0.85)', border: '1.5px dashed var(--hair)', borderRadius: 12, padding: '14px 18px', fontSize: 18, lineHeight: 1.9, color: 'var(--fg)', ...kw }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--fg-muted)', display: 'block', marginBottom: 4 }}>초안 예시</span>
              "<U c={C.cyan}>야자 하는 우리 반</U>이 <U c={C.emerald}>밤 9시 하교 때</U> 쓸 <U c={C.amber}>다음 버스 알림판</U>을 <U c={C.slate}>HTML 한 파일</U>로…"
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
              {['실습 도구 로그인 + 새 채팅 열기 완료', '6요소 중 대상·목적·내용·형식 4칸 작성'].map((c) => (
                <div key={c} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 19, fontWeight: 700, color: 'var(--fg)', ...kw }}>
                  <span style={{ width: 26, height: 26, borderRadius: 7, border: `2.5px solid ${C.emerald}`, display: 'grid', placeItems: 'center', color: C.emerald, fontSize: 18, fontWeight: 800 }}>✓</span>
                  {c}
                </div>
              ))}
              <a href={ACTIVITY_URL} target="_blank" rel="noopener" style={{
                display: 'block', textAlign: 'center', padding: '15px 20px', borderRadius: 13,
                background: C.emerald, color: 'white', fontWeight: 800, fontSize: 20, textDecoration: 'none', marginTop: 6,
              }}>
                활동지 열기 ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* S12 — 기획서 → 프롬프트 매핑 */
function MappingSlide() {
  const { clicks } = useDeck();
  const SLOTS = [
    { s: '누가', to: '대상', dotted: false, color: C.cyan },
    { s: '어떤 상황', to: '목적의 맥락', dotted: true, color: C.emerald },
    { s: '문제', to: '목적', dotted: false, color: C.emerald },
    { s: '데이터 A+B', to: '내용 · 표본', dotted: false, color: C.amber },
    { s: '렌즈', to: '보여 주는 방식', dotted: true, color: C.amber },
    { s: '무엇', to: '결과물·핵심 기능', dotted: false, color: C.slate },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, padding: '48px 88px 104px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="kicker">2교시 · 브리핑</div>
        <h2 className="headline" style={{ margin: '6px auto 0', ...kw }}>여섯 칸이 <span className="accent-text">프롬프트의 재료</span>가 된다</h2>
      </div>
      {/* 기획서 슬롯 → 6요소 — 짝을 세로 연결선으로 붙인다 */}
      <div style={{ display: 'flex', gap: 18, justifyContent: 'center', alignItems: 'flex-start', marginTop: 22 }}>
        {SLOTS.map((sl, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ padding: '10px 16px', borderRadius: 11, border: '2px solid var(--fg)', fontSize: 20, fontWeight: 800, color: 'var(--fg)', background: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap' }}>[{sl.s}]</span>
            <div style={{ width: 0, height: 34, borderLeft: sl.dotted ? `3px dashed ${sl.color}` : `3px solid ${sl.color}`, opacity: clicks >= 1 ? 1 : 0.25, transition: 'all 0.5s' }} />
            <span style={{ padding: '8px 14px', borderRadius: 10, border: `2.5px solid ${sl.color}`, background: `color-mix(in srgb, ${sl.color} 9%, white)`, fontSize: 18.5, fontWeight: 800, color: sl.color, whiteSpace: 'nowrap', opacity: clicks >= 1 ? 1 : 0.3, transition: 'all 0.5s' }}>{sl.to}</span>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', fontSize: 18, color: 'var(--fg-muted)', marginTop: 12, opacity: clicks >= 1 ? 1 : 0, transition: 'all 0.5s', ...kw }}>
        위가 지난 시간의 한 문장 기획서, 아래가 프롬프트 6요소 — 점선(상황·렌즈)은 <b>번역해서</b> 넣는다. 활동지에는 상황·문제를 '목적'에, 데이터·렌즈를 '내용'에 합쳐 쓴다
      </div>
      {/* 하단 — 제약 카드 + 목표 */}
      <div style={{ flex: 1, display: 'flex', gap: 30, alignItems: 'center', marginTop: 8 }}>
        <div style={{ flex: 1, ...card, borderColor: C.coral, borderWidth: 2, padding: '22px 28px', opacity: clicks >= 2 ? 1 : 0.12, transform: clicks >= 2 ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.5s' }}>
          <div style={{ fontSize: 18.5, fontWeight: 800, color: C.coral, marginBottom: 10 }}>오늘의 제약 — 반드시 프롬프트에 포함</div>
          <div style={{ fontSize: 20.5, fontWeight: 800, color: 'var(--fg)', ...kw }}>"아래에 내가 붙여 넣은 표본 데이터만 사용하고, 없는 값은 만들지 마."</div>
          <div style={{ display: 'flex', gap: 18, marginTop: 14, alignItems: 'center' }}>
            <div style={{ ...mono, fontSize: 18, lineHeight: 1.8, padding: '12px 16px', borderRadius: 10, background: 'color-mix(in srgb, var(--fg) 5%, white)', border: '1px solid var(--hair)', color: 'var(--fg)', textAlign: 'left' }}>
              날짜, 메뉴, 잔반량(kg)<br />3-02, 제육볶음, 12.4<br />3-03, 생선까스, 21.1
            </div>
            <div style={{ fontSize: 19, color: 'var(--fg-muted)', lineHeight: 1.7, flex: 1, ...kw }}>
              실시간 연결은 브라우저 보안 정책에 막힐 수 있다 — AI 잘못이 아니니 같은 요청을 반복하지 말 것. 표본은 숙제한 경로(URL)에서 5~10줄, 안 되면 교사 공통 표본 3종.
            </div>
          </div>
        </div>
        <div style={{ width: 480, display: 'flex', flexDirection: 'column', gap: 14, opacity: clicks >= 3 ? 1 : 0.12, transition: 'all 0.5s' }}>
          <div style={{ ...card, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ ...mono, fontWeight: 800, fontSize: 25, color: C.emerald, whiteSpace: 'nowrap' }}>필수 2 · 도전 3</span>
            <span style={{ fontSize: 21.5, fontWeight: 800, color: 'var(--fg)', ...kw }}>오늘의 목표 — 완성이 아니라 바퀴 수</span>
          </div>
          <div style={{ padding: '14px 20px', borderRadius: 12, border: `2px solid ${C.cyan}`, fontSize: 19.5, fontWeight: 700, color: C.cyan, ...kw }}>
            공통 꼬리 문장 — "완전한 HTML 코드 한 파일로 출력해 줘 — 채팅 설명은 쓰지 마"
          </div>
        </div>
      </div>
    </div>
  );
}

/* S14 — 실습 (activity) */
function PracticeSlide() {
  const RULES = [
    { n: 1, t: '수정 요청은 한 번에 한 가지', c: C.emerald },
    { n: 2, t: '수정 후, 아까 되던 기능 재확인', c: C.cyan },
    { n: 3, t: '수정 요청 최대 5회 (오류·중단은 제외)', c: C.amber },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <img src={IMG.workshop} alt="" style={{ position: 'absolute', left: 0, right: 0, top: 0, width: '100%', height: 380, objectFit: 'cover', opacity: 0.45 }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 400, background: 'linear-gradient(180deg, rgba(250,246,236,0.55), var(--bg))' }} />
      <div style={{ position: 'absolute', inset: 0, padding: '52px 88px 104px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="kicker">실습 · 계획 → 명령 → 확인 → 피드백</div>
          <h2 className="headline" style={{ margin: '8px auto 0', ...kw }}>다섯 번의 기회로 <span className="accent-text">깎는다</span></h2>
        </div>
        <div style={{ flex: 1, display: 'flex', gap: 44, alignItems: 'center', marginTop: 10 }}>
          {/* 좌 — 수정 요청 게이지 (dominant) */}
          <div style={{ width: 760, display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
            <div style={{ ...card, padding: '34px 44px', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 14 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} style={{ width: 104, height: 74, borderRadius: 14, border: `3px solid ${C.emerald}`, background: `color-mix(in srgb, ${C.emerald} ${10 + i * 4}%, white)`, display: 'grid', placeItems: 'center', ...mono, fontWeight: 800, fontSize: 34, color: C.emerald }}>{i}</span>
                ))}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--fg)', ...kw }}>수정 요청 최대 5회 — 쓸 때마다 활동지에 4칸 기록</div>
              <div style={{ fontSize: 18, color: 'var(--fg-muted)', ...kw }}>목표 — 평가 필수 2바퀴 · 도전 3바퀴 (수정 요청→확인 = 1바퀴)</div>
            </div>
          </div>
          {/* 우 — 규칙 3 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 15 }}>
            {RULES.map((r) => (
              <div key={r.n} style={{ ...card, borderLeft: `6px solid ${r.c}`, padding: '18px 26px', display: 'flex', gap: 16, alignItems: 'center' }}>
                <span style={{ width: 42, height: 42, borderRadius: '50%', background: r.c, color: 'white', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 20, flexShrink: 0 }}>{r.n}</span>
                <span style={{ fontWeight: 800, fontSize: 22, color: 'var(--fg)', ...kw }}>{r.t}</span>
              </div>
            ))}
            <div style={{ fontSize: 18, color: 'var(--fg-muted)', lineHeight: 1.75, ...kw }}>
              기록의 완결성이 수행평가의 근거다. 로그인이 안 되면 손 들기 → 교사 배포 HTML로 수정 요청 작성 활동.
              목표 스케일은 표준주소실록 같은 "한 화면짜리 진짜 서비스"의 씨앗.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          <a href={ACTIVITY_URL} target="_blank" rel="noopener" style={{
            padding: '14px 34px', borderRadius: 13, background: C.emerald, color: 'white', fontWeight: 800, fontSize: 20, textDecoration: 'none',
          }}>활동지 2단계 — 실행 기록 ↗</a>
          <span style={{ marginLeft: 'auto', fontSize: 19, fontWeight: 700, color: 'var(--fg-muted)' }}>막히면 → 다음 장 처방전</span>
        </div>
      </div>
    </div>
  );
}

/* S15 — 처방전 */
function RemedySlide() {
  const ROWS = [
    { s: '한글이 □□□로 깨짐', r: '"코드 첫머리에 <meta charset=\u0022UTF-8\u0022> 있는지 확인해 줘" (그래도 네모면 글꼴 문제 — 손 들기)', big: true },
    { s: '더블클릭했는데 메모장이 열림', r: '파일 이름이 .html.txt가 아닌지 — "모든 파일"로 다시 저장', big: true },
    { s: 'AI가 서버·API·설치를 하라고 함', r: '"전부 HTML 한 파일 안에서, 내가 붙여 넣은 표본만으로" 다시 명시', big: false },
    { s: '고쳤더니 다른 곳이 망가짐', r: '직전에 되던 기능을 말해 주고 "그건 유지한 채로"를 덧붙여 재요청', big: false },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, padding: '52px 100px 104px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ textAlign: 'center', position: 'relative' }}>
        <div className="kicker">실습 상비 화면</div>
        <h2 className="headline" style={{ margin: '8px auto 0', maxWidth: 1280, ...kw }}>막혔을 때 — <span className="accent-text">우선 확인할 네 가지</span></h2>
        
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center', marginTop: 8 }}>
        {ROWS.map((row, i) => (
          <div key={i} style={{ display: 'flex', gap: 20, alignItems: 'stretch' }}>
            <div style={{ ...card, width: 560, borderLeft: `6px solid ${C.coral}`, padding: row.big ? '22px 28px' : '16px 24px', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: row.big ? 23 : 20, color: 'var(--fg)', ...kw }}>{row.s}</span>
            </div>
            <div style={{ display: 'grid', placeItems: 'center', color: C.emerald, fontSize: 26, fontWeight: 800 }}>→</div>
            <div style={{ ...card, flex: 1, borderLeft: `6px solid ${C.emerald}`, padding: row.big ? '22px 28px' : '16px 24px', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: row.big ? 18.5 : 16.5, fontWeight: 600, color: 'var(--fg)', ...kw }}>{row.r}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', fontSize: 19.5, fontWeight: 800, color: 'var(--fg-muted)', ...kw }}>
        로그인·접속·복사 버튼 문제는 처방전 밖 — 바로 손 들기
      </div>
    </div>
  );
}

/* S17 — 프롬프트 성장 비교 */
function GrowthSlide() {
  const { clicks } = useDeck();
  return (
    <div style={{ position: 'absolute', inset: 0, padding: '52px 110px 104px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="kicker">공유 · 화면과 함께</div>
        <h2 className="headline" style={{ margin: '8px auto 0', ...kw }}>프롬프트의 성장이 <span className="accent-text">결과의 성장</span>이다</h2>
      </div>
      <div style={{ flex: 1, display: 'flex', gap: 26, alignItems: 'center', justifyContent: 'center' }}>
        {/* 처음 명령 */}
        <div style={{ width: 430, opacity: clicks >= 1 ? 1 : 0.12, transition: 'all 0.5s' }}>
          <div style={{ ...card, borderColor: 'var(--fg-faint)', minHeight: 240, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--fg-faint)', marginBottom: 10 }}>처음 명령 — 활동지에 처음 써 둔 그대로</div>
            <div style={{ fontSize: 20, color: 'var(--fg-muted)', fontStyle: 'italic', ...kw }}>"급식 앱 만들어 줘"</div>
            <div style={{ marginTop: 'auto', fontSize: 18, color: 'var(--fg-faint)', ...kw }}>발표 학생의 활동지 '처음 명령' 칸을 띄운다</div>
          </div>
        </div>
        {/* 성장 화살표 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, opacity: clicks >= 3 ? 1 : 0.15, transition: 'all 0.5s' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {ELEM.map((e) => (
              <span key={e.key} style={{ width: 14, height: 14, borderRadius: '50%', background: e.color }} />
            ))}
          </div>
          <span style={{ fontSize: 44, color: C.emerald, fontWeight: 800 }}>⟶</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg-muted)', ...kw }}>길이가 아니라<br />"못 박은 것"의 수</span>
        </div>
        {/* 최종 통합 프롬프트 */}
        <div style={{ flex: 1, maxWidth: 760, opacity: clicks >= 2 ? 1 : 0.12, transform: clicks >= 2 ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.5s' }}>
          <div style={{ ...card, borderColor: C.emerald, borderWidth: 2.5, minHeight: 320 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.emerald, marginBottom: 10 }}>최종 통합 프롬프트 — 활동지 3단계</div>
            <p style={{ fontSize: 19.5, lineHeight: 1.95, margin: 0, color: 'var(--fg)', ...kw }}>
              "<U c={C.cyan}>야간자율학습을 마친 우리 반 학생</U>이 <U c={C.emerald}>밤 9시 하교 때 버스를 놓치는 문제</U>를 해결하는 페이지.{' '}
              <U c={C.amber}>아래 시간표·버스 표본 데이터만 사용</U>하고 <U c={C.coral}>없는 값은 만들지 마</U>.{' '}
              <U c={C.slate}>HTML 한 파일, 휴대폰에서도 보이게</U>.{' '}
              완성 후 <U c={C.violet}>내 하교 요일을 고르면 다음 버스가 보이는지 확인</U>."
            </p>
            <div style={{ marginTop: 12, fontSize: 18, color: 'var(--fg-muted)', ...kw }}>처음부터 다시 시켜도 같은 결과가 나오도록, 첫 요청과 수정을 하나로 합친 문장</div>
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'center', fontSize: 19, color: 'var(--fg-muted)', fontWeight: 700, ...kw }}>
        발표하는 친구의 결과물보다 프롬프트를 보세요 — 처음과 마지막 사이에서 무엇이 늘었는지
      </div>
    </div>
  );
}

/* ── 덱 ── */
export default function VibeCodingDeck() {
  return (
    <Deck>
      {/* S1 표지 */}
      <Slide full nav="표지" notes="지난 시간에 여러분은 한 문장 기획서를 썼습니다. '이 문장이 다음 시간 첫 프롬프트가 된다'고 했죠. 오늘이 그 시간입니다. 그런데 그 문장을 AI에게 던지기 전에, AI에게 일을 시키는 법부터 배워야 합니다.">
        <Fit>
          <Stage src={IMG.cover} scrim="linear-gradient(90deg, rgba(250,246,236,0.96) 0%, rgba(250,246,236,0.78) 42%, rgba(250,246,236,0.1) 100%)" />
          <div style={{ position: 'absolute', left: 96, bottom: 210, maxWidth: 1000 }}>
            <div className="kicker">정보과제연구 · 2026-2 · 3차시</div>
            <h1 className="display" style={{ marginTop: 14, ...kw }}>바이브코딩,<br /><span className="accent-text">말이 설계가 되다</span></h1>
            <p className="lead" style={{ marginTop: 16, maxWidth: 620, ...kw }}>코드는 몰라도 된다. 설계는 해야 한다 — AI에게 일을 시키는 법.</p>
          </div>
          <div style={{ position: 'absolute', right: 88, bottom: 64 }}>
            <Journey />
          </div>
        </Fit>
      </Slide>

      {/* S2 스톱워치 씬 */}
      <Slide full nav="실화 셋" notes="셋의 공통점은 코딩 실력이 아니라, 코드를 직접 쓰지 않았다는 겁니다. 8살 아이도, 프로 개발자도 코드 대신 말로 시켰어요. (클릭 1~3으로 하나씩) 물론 이 숫자들은 본인들 발표 기준이고, 성공이 프롬프트 한 줄 덕분만도 아닙니다. 그래도 '말로 시작할 수 있다'는 문턱은 진짜로 낮아졌습니다. 오늘 배울 건 그 말을 잘하는 법입니다.">
        <Fit>
          <Scene freezeAt={2}><StopwatchScene /></Scene>
          {[1, 2, 3].map((n) => <Build key={n} at={n}><span /></Build>)}
        </Fit>
      </Slide>

      {/* S3 정의 */}
      <Slide full nav="바이브코딩이란" notes="이 말을 만든 사람이 '코드를 잊어라'라고 했는데, 같은 문장에서 '버리는 프로젝트라면'이라는 단서도 달았어요. 이 두 마디 사이에 오늘 수업이 다 들어 있습니다. 잘 통하는 곳과 조심할 곳을 구분하는 것까지가 바이브코딩 실력입니다.">
        <Fit>
          <DefSlide />
          {[1, 2, 3].map((n) => <Build key={n} at={n}><span /></Build>)}
        </Fit>
      </Slide>

      {/* S5 주문서 씬 */}
      <Slide full nav="AI가 채운다" notes="식당에서 '맛있는 거 아무거나요' 하면 인기 메뉴가 나옵니다. 불만은 못 말해요 — 내가 비워 둔 칸이니까. AI도 똑같습니다. (클릭) 연구에서도, 말 안 한 요구가 늘 지켜지는 경우는 절반이 안 됐고, AI는 애매한 걸 알면서도 거의 안 물어보고 그냥 만들었습니다.">
        <Fit>
          <Scene freezeAt={6}><OrderScene /></Scene>
          <Build at={1}><span /></Build>
        </Fit>
      </Slide>

      {/* S6 대비 */}
      <Slide full nav="6요소" notes="왼쪽과 오른쪽, AI가 받는 정보량 차이가 보이죠? (클릭 1 왼쪽, 클릭 2 오른쪽, 클릭 3 칩) 오른쪽이라고 무작정 길게 쓴 게 아니에요 — '추측하게 만들 것'을 없앤 겁니다. 특히 다섯 번째, '하지 말 것'을 쓰는 사람이 드문데, 지어내기 금지는 꼭 넣으세요. AI는 빈칸을 지어내서라도 채우니까요.">
        <Fit>
          <ContrastSlide />
          {[1, 2, 3].map((n) => <Build key={n} at={n}><span /></Build>)}
        </Fit>
      </Slide>

      {/* S7 선반 */}
      <Slide full nav="우선순위" notes="그럼 100가지를 다 적어야 하나? 반대입니다. 너무 많이 몰아넣으면 AI가 하나하나를 오히려 못 지키는 경향이 실험에서 확인됐어요. 기준은 하나입니다 — 이게 달라지면 내 기획이 무너지는가. 무너지면 못 박고, 아니면 맡기세요. 지난 시간 킬러 질문처럼, 기획을 무너뜨릴 핵심 조건을 먼저 가려내는 원리입니다.">
        <Fit><ShelfSlide /></Fit>
      </Slide>

      {/* S8 조각 루프 씬 */}
      <Slide full nav="깎는 루프" notes="첫 결과가 마음에 안 들면 실패일까요? 아니요, 그게 정상 공정입니다. 조각가는 한 번의 망치질로 작품을 못 만들어요. 계획하고, 시키고, 눈으로 확인하고, 고칠 점을 말하고 — (클릭 1~3) 이 바퀴를 돌 때마다 결과물이 깎입니다. 다음 교시 실습의 목표도 '한 번에 완성'이 아니라 '두세 바퀴 돌기'입니다.">
        <Fit>
          <Scene freezeAt={3}><SculptScene /></Scene>
          {[1, 2, 3].map((n) => <Build key={n} at={n}><span /></Build>)}
        </Fit>
      </Slide>

      {/* S9 버그 리포트 */}
      <Slide full nav="피드백 작법" notes="옷 수선집에서 '이상해요'라고 하면 뭘 고쳐 줄까요? '왼쪽 소매가 오른쪽보다 2cm 길어요, 똑같이 맞춰 주세요'라고 해야 고칠 수 있죠. (클릭 2) 고장이 아니라 취향을 바꾸고 싶을 때는 두 번째 카드처럼 — 어디를, 지금 어떤데, 어떻게, 그리고 '나머지는 그대로'까지. 이 마지막 한 마디가 멀쩡한 곳을 지켜 줍니다.">
        <Fit>
          <FeedbackSlide />
          {[1, 2, 3].map((n) => <Build key={n} at={n}><span /></Build>)}
        </Fit>
      </Slide>

      {/* S10 함정 넷 */}
      <Slide full nav="함정 넷" notes="미리 알려 드릴게요, 여러분은 이 넷 중 최소 하나에 빠질 겁니다. (클릭 1~4) 특히 4번 — 배경색 바꿔 달라고 했는데 버튼이 사라지는 일이 진짜로 일어납니다. 그래서 수정할 때마다 '아까 되던 것'도 다시 눌러 봐야 해요. 그리고 이 사건 보이시죠. AI가 하지 말라는 것까지 해 버린 실화입니다. 시키는 것과 믿는 것은 다릅니다.">
        <Fit>
          <TrapSlide />
          {[1, 2, 3, 4].map((n) => <Build key={n} at={n}><span /></Build>)}
        </Fit>
      </Slide>

      {/* S11 도구·초안 */}
      <Slide full nav="도구 · 초안" notes="도구는 어느 것이든 좋습니다 — 쓰던 것, 편한 것으로 하세요. 하나만 미리 알아 두세요. 학교 계정에서는 결과를 화면 안에서 바로 보여 주는 기능이 막혀 있을 수 있어서, 우리는 코드를 파일로 저장해 브라우저로 여는 방법을 씁니다. 다음 교시 첫 화면에서 연습해요. 이번 교시가 끝나기 전까지 두 가지만 — 로그인해서 새 채팅 열어 보기, 그리고 초안의 네 칸 채우기.">
        <Fit><ToolPrepSlide /></Fit>
      </Slide>

      {/* S12 매핑 */}
      <Slide full nav="기획서 → 프롬프트" notes="기획서를 다시 꺼내세요. 여섯 칸이 프롬프트 재료입니다 — (클릭 1) 다만 그대로 옮겨 적는 게 아니라, 상황은 '언제 쓰는 장면인지'로, 렌즈는 '데이터를 어떻게 보여줄지'로 번역해서 넣는 거예요. (클릭 2) 하나만 조심하세요 — 진짜 데이터를 실시간으로 불러오는 건 오늘 안 됩니다. 브라우저가 보안 때문에 막을 수 있어요. AI 잘못이 아니니 그 요청을 붙잡고 시간을 쓰지 말고, 표본을 직접 붙여 넣으세요. 실제 연결은 프로젝트 시간에 선생님과 함께 합니다.">
        <Fit>
          <MappingSlide />
          {[1, 2, 3].map((n) => <Build key={n} at={n}><span /></Build>)}
        </Fit>
      </Slide>

      {/* S13 walkthrough */}
      <Slide full nav="저장·실행 절차" notes="학교 계정에서는 화면 안 미리보기가 안 되니, 우리는 코드를 파일로 저장해 브라우저로 확인합니다. 처음 한 번은 이 다섯 단계 — 복사, 메모장, 모든 파일로 저장, 더블클릭, 확인. 그다음부터는 훨씬 짧아요. 수정할 때마다 복사해서 덮어쓰기(Ctrl+S)하고 브라우저에서 F5만 누르면 됩니다. 저장할 때 파일 형식 '모든 파일' — 이거 하나 때문에 매년 누군가 30분을 잃습니다. 오늘은 잃지 마세요.">
        <Fit>
          <Scene freezeAt={16}><SaveRunScene /></Scene>
        </Fit>
      </Slide>

      {/* S14 실습 */}
      <Slide full nav="실습" notes="시작 전 딱 하나만 — 첫 결과가 이상해도 놀라지 마세요. 그게 아직 0바퀴째의 정상 모습입니다. 평가받는 건 첫 결과가 아니라, 여러분이 쓴 수정 요청을 얼마나 구체적으로 기록하고 확인했는가예요. 자, 첫 프롬프트 넣으세요.">
        <Fit><PracticeSlide /></Fit>
      </Slide>

      {/* S15 처방전 */}
      <Slide full nav="처방전" notes="(실습 중 상비 — 개별 순회하며 이 슬라이드를 가리켜 자가 해결 유도) 증상 1·2번은 AI 잘못이 아니라 우리 컴퓨터 문제예요. 3번이 나오면 여러분이 이긴 겁니다 — AI가 더 큰 걸 만들려는 걸 여러분이 목줄로 당기는 거니까요.">
        <Fit><RemedySlide /></Fit>
      </Slide>

      {/* S17 성장 비교 */}
      <Slide full nav="프롬프트의 성장" notes="발표하는 친구의 결과물보다 프롬프트를 보세요. 처음 문장과 마지막 문장 사이에서 무엇이 늘었는지 — 그게 오늘 여러분 전원이 얻어 간 실력입니다. (시간이 부족하면 이 장은 다음 차시 도입 5분으로 이월)">
        <Fit>
          <GrowthSlide />
          {[1, 2, 3].map((n) => <Build key={n} at={n}><span /></Build>)}
        </Fit>
      </Slide>

      {/* S18 마무리 */}
      <Slide full nav="마무리" notes="오늘 여러분은 코드를 한 줄도 안 썼지만 개발의 반을 했습니다 — 무엇을 만들지 정확히 말하는 일이요. 나머지 반이 남았어요. 만들어진 것을 확인하고, 왜 그렇게 동작하는지 설명할 수 있게 되는 것. 다음 시간부터 그 반을 채우러 갑니다. 오늘 쓴 수정 요청들, 잘 기록했습니다 — 그 기록이 여러분의 설계 이력서입니다.">
        <Fit>
          <Stage src={IMG.gallery} scrim="linear-gradient(180deg, rgba(250,246,236,0.9) 0%, rgba(250,246,236,0.72) 55%, rgba(250,246,236,0.9) 100%)" />
          <div style={{ position: 'absolute', inset: 0, padding: '70px 110px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 26, textAlign: 'center' }}>
            <div className="kicker">3차시 마무리</div>
            <h2 className="headline" style={{ maxWidth: 1050, ...kw }}>
              검토하고 설명할 수 있으면, <span className="accent-text">개발이다</span>
            </h2>
            <div style={{ ...card, maxWidth: 900, padding: '30px 40px' }}>
              <p style={{ fontSize: 22.5, lineHeight: 1.8, fontWeight: 700, color: 'var(--fg)', margin: 0, ...kw }}>
                "LLM이 코드를 써 줬더라도 검토하고, 충분히 테스트하고, 남에게 설명할 수 있게 만들었다면 — 그것은 바이브코딩이 아니라 소프트웨어 개발이다."
              </p>
              <div style={{ marginTop: 12, fontSize: 18, color: 'var(--fg-muted)' }}>Simon Willison · 2025 — 오늘의 수준: 무엇을 입력하면 어떻게 반응하는지 말할 수 있다</div>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <span style={{ padding: '10px 22px', borderRadius: 999, border: `2px solid ${C.cyan}`, fontSize: 19.5, fontWeight: 800, color: C.cyan, ...kw }}>다음 · 프로젝트 제작 — 이 프로토타입을 진짜로 키운다</span>
              <span style={{ fontSize: 19, color: 'var(--fg-muted)', fontWeight: 700, ...kw }}>과제 — 활동지 3단계 제출 (최종 통합 프롬프트 + 성찰 · '한 줄 성찰'은 선택)</span>
            </div>
            <Journey lit={6} />
          </div>
        </Fit>
      </Slide>
    </Deck>
  );
}

/* S3 — 정의 (build) */
function DefSlide() {
  const { clicks } = useDeck();
  return (
    <div style={{ position: 'absolute', inset: 0, padding: '52px 96px 104px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="kicker">vibe coding · 2025-02 ~</div>
        <h2 className="headline" style={{ margin: '8px auto 0', ...kw }}>이름이 붙은 지 <span className="accent-text">1년 반</span> 된 기술</h2>
      </div>
      <div style={{ flex: 1, display: 'flex', gap: 40, alignItems: 'center' }}>
        {/* 좌 65% — 인용 */}
        <div style={{ flex: 1.7, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ ...card, padding: '34px 40px', opacity: clicks >= 1 ? 1 : 0.12, transform: clicks >= 1 ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.5s' }}>
            <div style={{ fontSize: 64, lineHeight: 0.6, color: C.emerald, fontWeight: 800, marginBottom: 10 }}>“</div>
            <p style={{ fontSize: 25, lineHeight: 1.75, fontWeight: 700, color: 'var(--fg)', margin: 0, ...kw }}>
              그냥 보고, 말하고, 실행하고, 복사해 붙일 뿐인데 — <span className="accent-text">대체로 돌아간다.</span>
            </p>
            <p style={{ fontSize: 19, lineHeight: 1.7, color: 'var(--fg-muted)', margin: '12px 0 0', ...mono }}>
              I just see stuff, say stuff, run stuff, and copy paste stuff, and it mostly works.
            </p>
            <div style={{ marginTop: 14, fontSize: 18.5, color: 'var(--fg-muted)', fontWeight: 700 }}>Andrej Karpathy (OpenAI 공동창업자) · 2025-02-02 · "코드가 존재한다는 사실조차 잊는 코딩"</div>
          </div>
          <div style={{
            alignSelf: 'flex-start', padding: '10px 20px', borderRadius: 12, border: `2px solid ${C.amber}`,
            fontSize: 20, fontWeight: 800, color: C.amber, ...kw,
            opacity: clicks >= 2 ? 1 : 0, transform: clicks >= 2 ? 'translateY(0)' : 'translateY(8px)', transition: 'all 0.5s',
          }}>
            단, 같은 글에서 — "버리는 주말 프로젝트에는 나쁘지 않다" (본인 주석)
          </div>
        </div>
        {/* 우 35% — 확산 지표 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, opacity: clicks >= 3 ? 1 : 0.12, transform: clicks >= 3 ? 'translateX(0)' : 'translateX(14px)', transition: 'all 0.5s' }}>
          <div style={{ ...card, borderLeft: `5px solid ${C.emerald}` }}>
            <div style={{ fontSize: 18.5, fontWeight: 800, color: C.emerald }}>2025-11 · 콜린스 사전</div>
            <div style={{ fontSize: 21, fontWeight: 800, color: 'var(--fg)', marginTop: 6, ...kw }}>올해의 단어 — vibe coding</div>
          </div>
          <div style={{ ...card, borderLeft: `5px solid ${C.cyan}` }}>
            <div style={{ fontSize: 18.5, fontWeight: 800, color: C.cyan }}>Y Combinator · 2025 겨울 배치</div>
            <div style={{ fontSize: 21, fontWeight: 800, color: 'var(--fg)', marginTop: 6, ...kw }}>스타트업 1/4 — 코드의 95%가 AI 생성</div>
            <div style={{ fontSize: 18, color: 'var(--fg-muted)', marginTop: 4 }}>파트너 발표 기준</div>
          </div>
        </div>
      </div>
    </div>
  );
}
