import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import Deck from '../../../src/deck/Deck';
import Slide from '../../../src/deck/Slide';
import Build from '../../../src/deck/Build';
import { useDeck } from '../../../src/deck/DeckContext';
import { Scene, useSceneTime, interpolate, spring, riseIn, easeOut, easeInOut } from '../../../src/scene';
import { NOTES } from './notes';
import { Presenter, presenterFor } from '../../../src/components/Presenter';
import narration from './presenter/narration.json';

/* ── 정보화부 — AI 교육 활성화를 위한 '교사 중심' 지원 체계 전환 (정책 제안 · 24장) ─────
   plan: ./plan.md — 단일 진실 원천. 발표자 노트는 ./notes.ts (plan.md에서 다시 뽑는다).
   원자료: 아티팩트 「교사 중심 AI 지원 체계」(근거 209건 · 반론 20개).

   2026-09-29 재구성: 정책제안서 최종본에서 지운 내용(제안자 학교 내부 수치, 데이터 개방 제안,
   전북 GPT 병행·300건, 공용 기반 선례 등)을 덱에서도 뺐다. 상세는 plan.md 헤더.
   컴포넌트 이름(S04·S06…)은 처음 저작할 때의 번호다 — 화면 순서는 맨 아래 덱 목록을 따른다.

   1~4    표지(static) → 영수증(scene) → 제안 지도(build) → 약속과 간극(static)
   5~10   가 · 이미 쓰고 낸다(build+live) → 지금 AI의 한계(static) → ① 교원증(scene)
          → ② 과제 정비(build) → 시수 선반(scene) → ③ 요건·교원(static)
   11~12  나 · 공유가 막히는 곳(build) → ④ 레시피(scene)
   13~16  다 · 진열장(scene) → AIEP 지금(static) → ⑤ 궤도(scene) → 성과지표(build)
   17     공통 · ⑥ 요청서 도장(scene)
   18~21  반론 ①(build+live) → 반론 ②(build) → 남은 확인(static) → 정비판 퍼즐(scene+live)

   색의 뜻은 고정한다: 초록 = 근거·제안, 호박 = 불리한 자료·반론, 청색 = 교육청·맥락.
   설계 박스 1920×1080 고정 배율(Fit). 테마 토큰은 registry(teacher-centered-ai). */

/* ══════════════════════════════════════════════════════════════════════
   공용 토큰·도구
   ══════════════════════════════════════════════════════════════════════ */

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

/** pres = 슬라이드 번호 — 발표자 영상의 단계 수·위치는 presenter/narration.json(overlay)에서 온다 */
function Page({ nav, notes, children, pres }: { nav: string; notes: string; children: ReactNode; pres?: number }) {
  const p = pres ? presenterFor(narration, pres) : null;
  return (
    <Slide full nav={nav} notes={notes}>
      <Fit>
        {children}
        {p && <Presenter {...p} />}
      </Fit>
    </Slide>
  );
}

/** 씬 안에서 클릭 단계를 직접 읽을 때 — 최대 단계를 엔진에 등록한다 */
function useClicks(max: number): number {
  const { clicks, isStatic, registerMax } = useDeck();
  useEffect(() => {
    registerMax?.(max);
  }, [max, registerMax]);
  return isStatic ? max : clicks;
}

const abs = (x: number, y: number, w?: number, h?: number): CSSProperties => ({
  position: 'absolute',
  left: x,
  top: y,
  width: w,
  height: h,
});

/* 덱 색 — registry 테마와 같은 값 */
const C = {
  green: '#1d6a51', // 근거·제안
  greenSoft: '#dfeee6',
  amber: '#94570f', // 불리한 자료·반론
  amberSoft: '#f5e9d8',
  blue: '#3b5a84', // 교육청·맥락
  blueSoft: '#e2e9f3',
  ink: '#16201b',
  paper: '#f3f5f2',
  line: '#d8ded9',
  soft: '#e9eee9',
  white: '#ffffff',
};

const serif = "var(--font-head)";
const kick: CSSProperties = {
  fontSize: 17,
  fontWeight: 600,
  letterSpacing: '0.08em',
  color: 'var(--fg-faint)',
  wordBreak: 'keep-all',
};
const h1: CSSProperties = {
  fontFamily: serif,
  fontWeight: 700,
  letterSpacing: '-0.02em',
  lineHeight: 1.22,
  fontSize: 60,
  wordBreak: 'keep-all',
  margin: 0,
  color: C.ink,
};
const h2: CSSProperties = { ...h1, fontSize: 50 };
const h3: CSSProperties = { ...h1, fontSize: 30 };
const body: CSSProperties = { fontSize: 23, lineHeight: 1.55, color: 'var(--fg-muted)', wordBreak: 'keep-all' };
const small: CSSProperties = { fontSize: 17, lineHeight: 1.45, color: 'var(--fg-faint)', wordBreak: 'keep-all' };
/* 수치 — 한글이 섞인 줄이 많아 본문 글꼴 + 고정폭 숫자 (모노 글꼴은 공백 폭이 넓다) */
const mono: CSSProperties = { fontFamily: 'var(--font-body)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' };
const card: CSSProperties = {
  background: C.white,
  border: `1px solid ${C.line}`,
  borderRadius: 10,
};

/** 출처 태그 — 모든 수치 옆에 작게 */
function Src({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ ...mono, fontSize: 14, color: 'var(--fg-faint)', letterSpacing: '0.01em', ...style }}>{children}</div>;
}

/** 검증 상태 표시 — 확인필요 · 2차 · 자기보고 */
function Flag({ children }: { children: ReactNode }) {
  return (
    <span style={{ fontSize: 13, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: C.soft, color: 'var(--fg-muted)', marginLeft: 8, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

/** 정식 용어 + 한 문장 풀이 칩 */
function Term({ term, gloss, style }: { term: string; gloss: string; style?: CSSProperties }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 10, padding: '7px 14px', borderRadius: 99, border: `1px solid ${C.line}`, background: C.white, ...style }}>
      <span style={{ fontWeight: 700, fontSize: 17, color: C.ink, whiteSpace: 'nowrap' }}>{term}</span>
      <span style={{ fontSize: 16, color: 'var(--fg-muted)', whiteSpace: 'nowrap' }}>{gloss}</span>
    </div>
  );
}

/** 상단 킥커 + 헤드라인 (왼쪽 정렬, 설계 박스 기준) */
function Head({ k, children, x = 120, y = 64, w = 1680, size = 54, t }: { k: string; children: ReactNode; x?: number; y?: number; w?: number; size?: number; t?: number }) {
  const s = t === undefined ? {} : riseIn(t, 0.05);
  return (
    <div style={{ ...abs(x, y, w), ...s }}>
      <div style={kick}>{k}</div>
      <h2 style={{ ...h1, fontSize: size, marginTop: 12 }}>{children}</h2>
    </div>
  );
}

/** 색 박스 — 지지(pre)·반론(con)·맥락(ctx) */
function Box({ tone, title, children, style }: { tone: 'pre' | 'con' | 'ctx'; title?: string; children: ReactNode; style?: CSSProperties }) {
  const bg = tone === 'pre' ? C.greenSoft : tone === 'con' ? C.amberSoft : C.blueSoft;
  const fg = tone === 'pre' ? C.green : tone === 'con' ? C.amber : C.blue;
  return (
    <div style={{ background: bg, borderRadius: 8, padding: '16px 22px', ...style }}>
      {title && <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.06em', color: fg, marginBottom: 6 }}>{title}</div>}
      <div style={{ fontSize: 20, lineHeight: 1.5, color: C.ink, wordBreak: 'keep-all' }}>{children}</div>
    </div>
  );
}

const FONT_ID = 'tcai-fonts';
function useDeckFonts() {
  useEffect(() => {
    if (document.getElementById(FONT_ID)) return;
    const l = document.createElement('link');
    l.id = FONT_ID;
    l.rel = 'stylesheet';
    l.href =
      'https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=IBM+Plex+Sans+KR:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Nanum+Pen+Script&display=swap';
    document.head.appendChild(l);
  }, []);
}
const hand: CSSProperties = { fontFamily: "'Nanum Pen Script', var(--font-head)", wordBreak: 'keep-all' };


/* ══════════════════════════════════════════════════════════════════════
   1 — 표지 (static)
   ══════════════════════════════════════════════════════════════════════ */

function S01() {
  const legend: [string, string][] = [
    [C.green, '근거 · 제안'],
    [C.amber, '불리한 자료 · 반론'],
    [C.blue, '교육청 쪽 맥락'],
  ];
  return (
    <>
      <div style={{ ...abs(1480, 96, 320), display: 'grid', gap: 12 }}>
        {legend.map(([c, l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ width: 46, height: 8, borderRadius: 4, background: c }} />
            <span style={{ fontSize: 17, color: 'var(--fg-muted)' }}>{l}</span>
          </div>
        ))}
      </div>

      <div style={{ ...abs(120, 290, 1240) }}>
        <div style={{ ...kick, fontSize: 20, color: C.green }}>전북교육 정책 제안 · 2026. 9. · 정보화부</div>
        <h1 style={{ ...h1, fontSize: 88, marginTop: 26, lineHeight: 1.18 }}>
          AI 교육 활성화를 위한
          <br />
          <span style={{ color: C.green }}>'교사 중심'</span> 지원 체계 전환
        </h1>
        <div style={{ width: 120, height: 4, background: C.green, marginTop: 40, borderRadius: 2 }} />
        <p style={{ ...body, fontSize: 28, marginTop: 30, maxWidth: 1080, color: 'var(--fg-muted)' }}>
          지원은 공모 사업이 아니라 교사의 기본 환경으로. 도구는 교사가 만들고, 교육청이 받치는 구조로.
        </p>
      </div>

      <div style={{ ...abs(1180, 680, 330), display: 'grid', gap: 22 }}>
        {[
          ['209', '근거'],
          ['20', '예상 반론'],
        ].map(([n, l]) => (
          <div key={l} style={{ borderLeft: `3px solid ${C.green}`, paddingLeft: 18 }}>
            <div style={{ ...mono, fontSize: 48, fontWeight: 500, color: C.ink, lineHeight: 1 }}>{n}</div>
            <div style={{ fontSize: 18, color: 'var(--fg-muted)', marginTop: 6 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ ...abs(120, 990, 1680), ...small, fontSize: 15 }}>
        원자료: 2026 전북교육계획 · 제20대 전북교육감직 인수위원회 활동 백서(2026.8.5.) · 2026년 SW·AI교육 활성화 추진계획 · 국내외 보도·보고서
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   4 — 제안 한 문장, 네 갈래 (build)
   ══════════════════════════════════════════════════════════════════════ */

const AXES = [
  { tag: '가 · 기본 환경', title: "AI 지원을 '사업'에서 '기본 환경'으로", items: ['① 교원 AI 기본 이용권', '② AI 지원 사업 과제 정비', '③ 고교 AI 중점학교 요건 현실화와 교원 지원'], units: 3 },
  { tag: '나 · 공공 기반', title: '교사가 만드는 도구를 받치는 공공 기반', items: ['④ (가칭) 전북 에듀테크 깃허브'], units: 1.5 },
  { tag: '다 · 열린 AIEP', title: 'AIEP는 공용 기반, 확장은 학교가', items: ['⑤ 공용 기반과 학교 확장'], units: 1.5 },
];

function S04() {
  const X0 = 120;
  const TOTAL = 1680;
  const GAP = 22;
  const unitW = (TOTAL - GAP * (AXES.length - 1)) / AXES.reduce((a, b) => a + b.units, 0);
  let x = X0;
  return (
    <>
      <div style={{ ...abs(120, 140, 1680) }}>
        <div style={kick}>제안 한 문장</div>
        <h2 style={{ ...h1, fontSize: 56, marginTop: 16, lineHeight: 1.3 }}>
          지원을 공모 사업에서 <span style={{ color: C.green }}>교사의 기본 환경</span>으로 바꾸고,
          <br />
          교사가 만들고 고쳐 쓰는 도구가 쌓이는 구조를 <span style={{ color: C.blue }}>교육청이 받치자</span>.
        </h2>
      </div>
      {AXES.map((a, i) => {
        const w = unitW * a.units;
        const left = x;
        x += w + GAP;
        return (
          <Build key={a.tag} at={i + 1} style={{ ...abs(left, 460, w, 260) }}>
            <div style={{ height: 260, background: C.white, border: `1px solid ${C.line}`, borderTop: `4px solid ${C.green}`, borderRadius: 8, padding: '22px 24px', boxSizing: 'border-box' }}>
              <div style={{ ...mono, fontSize: 15, color: C.green }}>{a.tag}</div>
              <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 27, lineHeight: 1.3, marginTop: 10, color: C.ink, wordBreak: 'keep-all' }}>{a.title}</div>
              <div style={{ display: 'grid', gap: 10, marginTop: 20 }}>
                {a.items.map((it) => (
                  <div key={it} style={{ fontSize: 24, color: C.ink, wordBreak: 'keep-all' }}>{it}</div>
                ))}
              </div>
            </div>
          </Build>
        );
      })}
      <Build at={4} style={{ ...abs(120, 748, 1400, 92) }}>
        <div style={{ height: 92, background: C.white, border: `1px solid ${C.line}`, borderLeft: `4px solid ${C.ink}`, borderRadius: 8, padding: '0 26px', display: 'flex', alignItems: 'center', gap: 24 }}>
          <span style={{ ...mono, fontSize: 15, color: 'var(--fg-muted)' }}>공통 · 자료 관리</span>
          <span style={{ fontFamily: serif, fontWeight: 700, fontSize: 27, color: C.ink }}>⑥ 같은 자료는 한 번만</span>
          <span style={{ fontSize: 19, color: 'var(--fg-muted)' }}>나이스·교육통계 자료는 교육청이 직접 추출, 부서 간 공유</span>
        </div>
      </Build>
      <div style={{ ...abs(1020, 866, 500), ...small, textAlign: 'right' }}>학생 AI 지원은 이번 제안에서 제외</div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   5 — 이미 약속된 방향 (static · 인용 벽 + 간극)
   ══════════════════════════════════════════════════════════════════════ */

function S05() {
  const quotes: { p: string; q: string; size: number }[] = [
    { p: '백서 p.353', q: '목적사업비 명목으로 … 불필요한 사업을 어쩔 수 없이 해야만 하는 관행에 대한 개선이 필요 … 총액사업비 편성 비중을 대폭 늘려', size: 38 },
    { p: '교육계획 p.12~14', q: '교원 행정업무 경감, 2024~2026년 3년 연속 핵심과제', size: 28 },
    { p: '백서 p.345', q: '모든 공약에 학교 업무 영향 검토와 업무 경감 기준 포함', size: 28 },
    { p: '백서 p.344', q: '담당교사 중심 운영을 넘어 전체 교사가 수업에서 활용할 수 있는 자료, 연수, 실습 기회', size: 28 },
  ];
  const AX0 = 1210;
  const AX1 = 1790;
  const ax = (v: number) => AX0 + ((v - 1) / 4) * (AX1 - AX0);
  const AY = 420;
  return (
    <>
      <Head k="교육계획 · 인수위 백서">방향은 이미 약속되어 있다</Head>
      <div style={{ ...abs(120, 250, 960), display: 'grid', gap: 46 }}>
        {quotes.map((q) => (
          <div key={q.p} style={{ borderLeft: `3px solid ${C.green}`, paddingLeft: 22 }}>
            <div style={{ ...mono, fontSize: 15, color: C.green }}>{q.p}</div>
            <div style={{ fontFamily: serif, fontSize: q.size, lineHeight: 1.45, color: C.ink, marginTop: 4, wordBreak: 'keep-all' }}>{q.q}</div>
          </div>
        ))}
      </div>
      <div style={{ ...abs(1140, 250, 1, 760), background: C.line }} />

      <div style={{ ...abs(AX0, 250, 580) }}>
        <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '0.06em', color: C.amber }}>간극</div>
        <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 700, color: C.ink, marginTop: 6 }}>'학교 업무 최적화' 과제</div>
      </div>
      <svg viewBox={`0 0 ${DW} ${DH}`} style={{ ...abs(0, 0, DW, DH), pointerEvents: 'none' }}>
        <line x1={AX0} x2={AX1} y1={AY} y2={AY} stroke={C.ink} strokeWidth={1.5} opacity={0.4} />
        {[1, 2, 3, 4, 5].map((v) => (
          <g key={v}>
            <line x1={ax(v)} x2={ax(v)} y1={AY - 6} y2={AY + 6} stroke={C.ink} opacity={0.4} />
            <text x={ax(v)} y={AY + 30} textAnchor="middle" fill="var(--fg-faint)" style={{ font: '400 15px var(--font-mono)' }}>{v}</text>
          </g>
        ))}
        <rect x={ax(3.36)} y={AY - 7} width={ax(4.45) - ax(3.36)} height={14} fill={C.amber} opacity={0.85} rx={3} />
        <circle cx={ax(4.45)} cy={AY} r={11} fill={C.ink} />
        <circle cx={ax(3.36)} cy={AY} r={11} fill={C.white} stroke={C.ink} strokeWidth={3} />
        <text x={ax(4.45)} y={AY - 26} textAnchor="middle" fill={C.ink} style={{ font: '600 19px var(--font-body)' }}>시급성 4.45</text>
        <text x={ax(3.36)} y={AY - 26} textAnchor="middle" fill={C.ink} style={{ font: '600 19px var(--font-body)' }}>실현가능성 3.36</text>
      </svg>
      <div style={{ ...abs(AX0, AY + 52, 580) }}>
        <div style={{ ...mono, fontSize: 40, color: C.amber }}>격차 1.09</div>
        <div style={{ ...body, fontSize: 20, marginTop: 4 }}>30개 과제 가운데 가장 큰 차이</div>
        <Src style={{ marginTop: 6 }}>교직원 764명 설문(2026.6.) · 백서 p.20·p.327</Src>
      </div>
      <Box tone="con" title="실제 이행과제" style={{ ...abs(AX0, 640, 320) }}>
        조직개편 <b>1개</b> · 예산 <b>6,400만 원</b>
        <br />
        확인지표 <b>'횟수 2회'</b>
        <Src style={{ marginTop: 8 }}>백서 p.112~114</Src>
      </Box>
      <div style={{ ...abs(AX0, 860, 320), ...body, fontSize: 21, color: C.ink }}>방향은 같고, 이행할 수단이 비어 있다.</div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   2 — 선도학교 과제의 영수증 (scene)
   ══════════════════════════════════════════════════════════════════════ */

const RECEIPT: [string, string][] = [
  ['전 교원 에듀테크 연수', '30시간+'],
  ['전문적 학습공동체', '운영'],
  ['학기당 수업공개', '교외 1회 필수'],
  ['성과 사례', '2가지+'],
  ['AIEP 활용 보고서', '제출'],
  ['현장지원단 컨설팅', '실시'],
  ['교원·학부모 설명회', '실시'],
  ['운영수당', '10% 이내'],
  ['업무추진비(회의록)', '5% 이내'],
  ['결과·정산보고서', '제출'],
];
const R_X = 250;
const R_W = 440;
const R_TOP = 318;
const R_HEAD = 120;
const R_LINE = 46;
const R_FULL = R_HEAD + RECEIPT.length * R_LINE + 110;

function S06Scene() {
  const t = useSceneTime();
  const h = interpolate(t, [0.5, 6.2], [0, R_FULL], (x) => x);
  const printing = t > 0.5 && t < 6.2;
  const jitter = printing ? Math.sin(t * 60) * 0.8 : 0;
  return (
    <>
      {/* 프린터 — assets/svg/receipt-printer.svg (배출구 viewBox y≈172 = R_TOP) */}
      <div style={{ ...abs(R_X - 50, R_TOP - 172, 540, 190), transform: `translateY(${jitter}px)`, zIndex: 2 }}>
        <img src="assets/svg/receipt-printer.svg" alt="영수증 프린터" style={{ width: 540, height: 190, display: 'block' }} />
        <div style={{ ...abs(53, 105, 14, 14), borderRadius: 7, background: printing ? '#6fc3a2' : 'transparent', boxShadow: printing ? '0 0 10px #6fc3a2' : 'none' }} />
      </div>
      {/* 영수증 종이 */}
      <div style={{ ...abs(R_X, R_TOP - 14, R_W, h + 14), overflow: 'hidden', background: C.white, zIndex: 3, boxShadow: '0 12px 30px -18px rgba(22,32,27,.35)' }}>
        <div style={{ padding: '22px 28px 0', ...mono, color: C.ink }}>
          <div style={{ textAlign: 'center', fontSize: 19, fontWeight: 600, fontFamily: 'var(--font-body)' }}>AI·디지털 활용 선도학교</div>
          <div style={{ textAlign: 'center', fontSize: 26, marginTop: 6 }}>사업 1건</div>
          <div style={{ borderTop: `2px dashed ${C.line}`, marginTop: 16 }} />
          {RECEIPT.map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'baseline', height: R_LINE, fontSize: 18 }}>
              <span style={{ fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>{k}</span>
              <span style={{ flex: 1, borderBottom: `2px dotted ${C.line}`, margin: '0 8px', transform: 'translateY(-5px)' }} />
              <span style={{ whiteSpace: 'nowrap' }}>{v}</span>
            </div>
          ))}
          <div style={{ borderTop: `2px dashed ${C.line}`, marginTop: 6 }} />
          <div style={{ display: 'flex', alignItems: 'baseline', height: R_LINE + 10, fontSize: 18, color: 'var(--fg-faint)', paddingTop: 10 }}>
            <span style={{ fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>AI 실제 활용</span>
            <span style={{ flex: 1, borderBottom: `2px dotted ${C.line}`, margin: '0 8px', transform: 'translateY(-5px)' }} />
            <span style={{ whiteSpace: 'nowrap' }}>(항목 없음)</span>
          </div>
        </div>
      </div>
      <Src style={{ ...abs(R_X, 1040, R_W), textAlign: 'center', opacity: interpolate(t, [6.2, 6.6], [0, 1]) }}>2026 선도학교 과제 안내 · 운영비 지침</Src>

      {/* 오른쪽 텍스트 밴드 */}
      <div style={{ ...abs(900, 110, 900), ...riseIn(t, 0.1) }}>
        <div style={kick}>가 · ①②의 이유 · AI·디지털 활용 선도학교</div>
        <h2 style={{ ...h1, fontSize: 52, marginTop: 12 }}>사업 하나에 딸려 나오는 것들</h2>
        <div style={{ ...body, fontSize: 22, marginTop: 12 }}>과제의 의도는 훌륭하지만, 부담은 크고 의도는 겹친다</div>
      </div>
      <Build at={1} style={{ ...abs(900, 330, 900) }}>
        <div style={{ ...card, padding: '20px 26px' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--fg-muted)' }}>AI 중점학교도 마찬가지</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            {['공통 과제 4개', '착수워크숍', '컨설팅', '공모전'].map((s) => (
              <span key={s} style={{ fontSize: 20, padding: '6px 14px', border: `1px solid ${C.line}`, borderRadius: 6 }}>{s}</span>
            ))}
          </div>
        </div>
      </Build>
      <Build at={2} style={{ ...abs(900, 520, 900), display: 'grid', gap: 18 }}>
        {[
          ['교육적 이슈가 될 때마다 실효성보다 교원의무연수가 늘고 세워놔야 할 계획서와 체크리스트만 늘어난다.', '백서 p.332 · 교직원 설문'],
          ['예산이 사업비 중심으로 내려오면 학교는 집행과 정산 업무에 매달리게 됩니다.', '백서 p.339 · 교직원 설문'],
        ].map(([q, s]) => (
          <div key={s} style={{ borderLeft: `3px solid ${C.line}`, paddingLeft: 20 }}>
            <div style={{ fontFamily: serif, fontSize: 25, lineHeight: 1.45, color: C.ink, wordBreak: 'keep-all' }}>"{q}"</div>
            <Src style={{ marginTop: 4 }}>{s}</Src>
          </div>
        ))}
      </Build>
      <Build at={3} style={{ ...abs(900, 830, 620) }}>
        <Box tone="con" title="불리한 자료">
          의무를 이행한 전북미래학교가 일반학교보다 수업전문성 4.29 대 3.83
          <Flag>확인필요</Flag>
          <div style={{ ...small, color: 'var(--fg-muted)', marginTop: 4 }}>교육계획 p.22 · 자기보고·비무작위 비교 · 원본 표 재확인</div>
        </Box>
      </Build>
    </>
  );
}
function S06() {
  return (
    <Scene freezeAt={7}>
      <S06Scene />
    </Scene>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   7 — 교사는 이미 쓰고, 이미 낸다 (build + live)
   ══════════════════════════════════════════════════════════════════════ */

function S07() {
  const c = useClicks(3);
  const asked = c === 0;
  const bars: [string, number][] = [
    ['초', 25.08],
    ['중', 27.16],
    ['고', 35.16],
  ];
  const BH = 440;
  const BASE = 800;
  return (
    <>
      {/* 질문 → 클릭 후 헤드라인 */}
      <div
        style={{
          position: 'absolute',
          left: asked ? 160 : 120,
          top: asked ? 380 : 64,
          width: asked ? 1600 : 1680,
          textAlign: asked ? 'center' : 'left',
          transition: 'all .6s cubic-bezier(.16,1,.3,1)',
        }}
      >
        <div style={{ ...kick, color: asked ? C.green : 'var(--fg-faint)' }}>{asked ? '먼저 여쭙겠습니다 · 라이브 문항' : '가 · ①의 이유'}</div>
        <h2 style={{ ...h1, fontSize: asked ? 62 : 52, marginTop: 14, transition: 'font-size .6s' }}>
          {asked ? '지금 쓰시는 유료 AI 구독료는 누가 내고 있습니까?' : '교사는 이미 쓰고, 이미 낸다'}
        </h2>
      </div>

      <div style={{ opacity: c >= 1 ? 1 : 0, transition: 'opacity .5s' }}>
        <div style={{ ...abs(120, 230, 880) }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.ink }}>유료 AI 구독료를 자기 돈으로 내는 교사 비율</div>
          <Src style={{ marginTop: 4 }}>경기 AI·디지털 선도학교 346교 교사 · 경기도교육연구원(경인일보 2026.5.20)</Src>
        </div>
        <svg viewBox={`0 0 ${DW} ${DH}`} style={{ ...abs(0, 0, DW, DH), pointerEvents: 'none' }}>
          <line x1={150} x2={930} y1={BASE} y2={BASE} stroke={C.ink} strokeWidth={1.5} opacity={0.5} />
          {bars.map(([k, v], i) => {
            const x = 200 + i * 250;
            const hh = c >= 1 ? (BH * v) / 40 : 0;
            const dom = k === '고';
            return (
              <g key={k}>
                <rect x={x} y={BASE - hh} width={170} height={hh} fill={C.green} opacity={dom ? 1 : 0.45} rx={4} style={{ transition: `all .8s cubic-bezier(.16,1,.3,1) ${i * 0.08}s` }} />
                <text x={x + 85} y={BASE - hh - 18} textAnchor="middle" fill={C.ink} style={{ font: `500 ${dom ? 52 : 36}px var(--font-mono)`, transition: 'all .8s' }}>
                  {v.toFixed(2)}%
                </text>
                <text x={x + 85} y={BASE + 36} textAnchor="middle" fill="var(--fg-muted)" style={{ font: '600 24px var(--font-body)' }}>
                  {k === '초' ? '초등' : k === '중' ? '중학교' : '고등학교'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <Build at={2} style={{ ...abs(1120, 250, 680) }}>
        <div style={{ ...mono, fontSize: 150, lineHeight: 1, color: C.green }}>62.9%</div>
        <div style={{ fontSize: 26, fontWeight: 600, color: C.ink, marginTop: 14, wordBreak: 'keep-all' }}>전국 교사가 수업·평가에 생성형 AI를 쓴다 (고교 70.5%)</div>
        <Src style={{ marginTop: 8 }}>교사 1,659명 · 한국교육과정평가원(파이낸셜뉴스 2026.9.6)</Src>
        <div style={{ ...small, marginTop: 22, padding: '8px 14px', background: C.soft, borderRadius: 6, display: 'inline-block' }}>왼쪽 막대와는 출처가 다른 조사</div>
      </Build>

      <Build at={3} style={{ ...abs(120, 890, 1400) }}>
        <div style={{ ...card, padding: '22px 30px', display: 'flex', alignItems: 'center', gap: 26, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: serif, fontSize: 30, fontWeight: 700, color: C.ink }}>그런데 지원은 공모 사업으로만 온다</span>
          <span style={{ fontSize: 21, color: 'var(--fg-muted)' }}>부산·인천은 공모 없이 교원 전원을 지원한다</span>
          <span style={{ fontSize: 20, fontWeight: 700, padding: '6px 16px', borderRadius: 99, background: C.greenSoft, color: C.green }}>→ ① 교원 AI 기본 이용권</span>
        </div>
      </Build>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   6 — 지금 주어진 AI로는 여러 단계의 일이 어렵다 (static · 세 열 비교표)
   ══════════════════════════════════════════════════════════════════════ */

function S08() {
  const cols = [
    { name: '전북 GPT', sub: '전 교원·학생 계정', color: C.blue },
    { name: 'AIEP Gemini', sub: 'AIEP 사업 제공 계정', color: C.blue },
    { name: '범용 LLM 구독', sub: '예: Claude Code, Codex', color: C.green },
  ];
  const rows: [string, string, [string, boolean][]][] = [
    ['목적이 분명한 단일 작업', '문서 초안 · 질의', [['적합', true], ['적합', true], ['적합', true]]],
    ['반복 · 다양한 업무', '수십 건을 한 번에', [['월 사용량 제한', false], ['사용 방법이 한정된 계정', false], ['가능', true]]],
    ['에이전트 · 코딩', '여러 단계 작업 · 도구 제작', [['채팅형 구조라 어려움', false], ['에이전트로 쓰기 어려움', false], ['가능', true]]],
  ];
  const grid = '420px 1fr 1fr 1.1fr';
  return (
    <>
      <Head k="가 · ①의 이유" size={50}>
        지금 주어진 AI로는 여러 단계의 일이 어렵다
      </Head>
      <div style={{ ...abs(120, 214, 1680), ...body, fontSize: 22 }}>
        전북 GPT와 AIEP의 Gemini는 좋은 시도다. 목적이 분명한 일에는 잘 맞는다.
      </div>
      {/* 범용 구독 열 강조 띠 */}
      <div style={{ ...abs(1270, 280, 530, 480), background: C.greenSoft, borderRadius: 10, opacity: 0.7 }} />
      <div style={{ ...abs(120, 290, 1680) }}>
        <div style={{ display: 'grid', gridTemplateColumns: grid, paddingBottom: 14, borderBottom: `2px solid ${C.ink}` }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg-muted)', alignSelf: 'end' }}>하려는 일</span>
          {cols.map((c) => (
            <div key={c.name} style={{ paddingLeft: 18 }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: c.color }}>{c.name}</div>
              <div style={{ fontSize: 16, color: 'var(--fg-faint)', marginTop: 2 }}>{c.sub}</div>
            </div>
          ))}
        </div>
        {rows.map(([a, b, cells]) => (
          <div key={a} style={{ display: 'grid', gridTemplateColumns: grid, padding: '26px 0', borderBottom: `1px solid ${C.line}`, alignItems: 'baseline' }}>
            <div>
              <div style={{ fontSize: 25, fontWeight: 700, color: C.ink }}>{a}</div>
              <div style={{ fontSize: 17, color: 'var(--fg-faint)', marginTop: 2 }}>{b}</div>
            </div>
            {cells.map(([txt, ok], k) => (
              <div key={k} style={{ paddingLeft: 18, fontSize: 22, fontWeight: ok ? 500 : 600, color: ok ? (k === 2 ? C.green : C.ink) : C.amber, wordBreak: 'keep-all' }}>
                {txt}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ ...abs(120, 790, 1680), display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: serif, fontSize: 30, fontWeight: 700, color: C.green }}>다양한 업무·에이전트 활용이 가능한 범용 LLM 구독을 지원한다 → ①</span>
        <Term term="에이전트" gloss="여러 단계 작업을 이어서 처리" />
      </div>
      <Box tone="con" title="불리한 자료" style={{ ...abs(120, 870, 1400) }}>
        영국 정부 Copilot 평가: 시간 절약이 생산성 향상으로 이어진다는 확실한 증거는 없음<Flag>2차</Flag> · 교사 86.6%가 부정확성·의존·윤리에 불안
        <Src style={{ marginTop: 4 }}>The Register 2025.9.4 · 한국교육신문 2026.9.21</Src>
      </Box>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   9 — ① 교원 AI 기본 이용권 (scene · 교원증 발급기)
   ══════════════════════════════════════════════════════════════════════ */

const CARD_W = 470;
const CARD_H = 290;
const SLOT_Y = 610;

function S09Scene() {
  const t = useSceneTime();
  const up = interpolate(t, [0.5, 2.0], [0, 1], easeOut);
  const chip = spring(t, 2.3, 0.8);
  const cx = DW / 2;
  const cardTop = SLOT_Y - 26 - CARD_H;
  const pinsL: [string, string][] = [
    ['부산 PENZ', '4억 원 · 교직원 계정 입직~퇴직'],
    ['인천', '교원직무연수비로 구독료 지원'],
  ];
  const pinsR: [string, string][] = [
    ['호주 NSW', 'EduChat 전 교사 제공'],
    ['에스토니아', 'AI Leap · 교사·학생 무료 제공'],
    ['아이슬란드', '국가 단위 교사 AI 시범'],
  ];
  const c = useClicks(3);
  return (
    <>
      <div style={{ ...abs(0, 56, DW), textAlign: 'center', ...riseIn(t, 0.05) }}>
        <div style={kick}>가 · ① 교원 AI 기본 이용권</div>
        <h2 style={{ ...h1, fontSize: 54, marginTop: 12 }}>AI 도구는 교원증처럼, 기본으로</h2>
      </div>

      {/* 카드 — 슬롯 위로 밀려 나온다 (슬롯 아래는 가림) */}
      <div style={{ ...abs(cx - CARD_W / 2 - 40, 190, CARD_W + 80, SLOT_Y - 190), overflow: 'hidden' }}>
        <div
          style={{
            ...abs(40, cardTop - 190, CARD_W, CARD_H),
            transform: `translateY(${(1 - up) * (CARD_H + 30)}px)`,
            background: C.white,
            border: `1px solid ${C.line}`,
            borderRadius: 16,
            boxShadow: '0 20px 50px -30px rgba(22,32,27,.45)',
            overflow: 'hidden',
          }}
        >
          <div style={{ height: 54, background: C.green, display: 'flex', alignItems: 'center', padding: '0 22px', color: C.white, fontSize: 20, fontWeight: 700, letterSpacing: '0.1em' }}>교원증</div>
          <div style={{ display: 'flex', gap: 22, padding: 22 }}>
            <div style={{ width: 118, height: 150, borderRadius: 8, background: C.soft, border: `1px solid ${C.line}` }} />
            <div style={{ flex: 1, display: 'grid', gap: 14, alignContent: 'start', paddingTop: 6 }}>
              <div style={{ height: 16, width: '70%', background: C.soft, borderRadius: 4 }} />
              <div style={{ height: 12, width: '90%', background: C.soft, borderRadius: 4 }} />
              <div style={{ height: 12, width: '55%', background: C.soft, borderRadius: 4 }} />
            </div>
          </div>
        </div>
      </div>
      {/* 이용권 칩 */}
      <div
        style={{
          ...abs(cx + CARD_W / 2 - 150, cardTop + 150, 250),
          opacity: Math.min(1, chip * 1.4),
          transform: `scale(${0.6 + 0.4 * chip}) rotate(-4deg)`,
          transformOrigin: 'left center',
        }}
      >
        <div style={{ padding: '12px 20px', borderRadius: 10, background: C.greenSoft, border: `2px solid ${C.green}`, color: C.green, fontSize: 24, fontWeight: 700, textAlign: 'center', boxShadow: '0 10px 24px -14px rgba(29,106,81,.6)' }}>AI 기본 이용권</div>
      </div>
      {/* 발급기 슬롯 */}
      <div style={{ ...abs(cx - 320, SLOT_Y - 26, 640, 40), background: C.ink, borderRadius: 10 }}>
        <div style={{ ...abs(90, 12, 460, 8), background: '#0a0f0c', borderRadius: 4 }} />
      </div>

      {/* 클릭 1 — 두 등급 */}
      <div style={{ ...abs(cx - 440, SLOT_Y + 40, 880), display: 'flex', gap: 16, opacity: c >= 1 ? 1 : 0, transform: `translateY(${c >= 1 ? 0 : 14}px)`, transition: 'all .5s cubic-bezier(.16,1,.3,1)' }}>
        <div style={{ flex: 1, ...card, borderTop: `4px solid ${C.green}`, padding: '16px 20px' }}>
          <div style={{ fontSize: 16, color: 'var(--fg-muted)' }}>전 교원</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.ink, marginTop: 4 }}>기본 · 범용 LLM 구독</div>
        </div>
        <div style={{ flex: 1, ...card, borderTop: `4px solid ${C.ink}`, padding: '16px 20px' }}>
          <div style={{ fontSize: 16, color: 'var(--fg-muted)' }}>개발 등 사용량이 많은 교사</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.ink, marginTop: 4 }}>상위 요금제 · 간단 신청</div>
        </div>
      </div>
      <div style={{ ...abs(cx - 440, SLOT_Y + 160, 880), textAlign: 'center', ...small, color: 'var(--fg-muted)', opacity: c >= 1 ? 1 : 0, transition: 'opacity .5s' }}>
        공공 보안 기준을 통과한 도구 중 교사가 선택 · 계획서·보고서 요구 없음
      </div>

      {/* 클릭 2 — 선례 핀 */}
      <svg viewBox={`0 0 ${DW} ${DH}`} style={{ ...abs(0, 0, DW, DH), pointerEvents: 'none', opacity: c >= 2 ? 1 : 0, transition: 'opacity .5s' }}>
        {pinsL.map((_, i) => {
          const y = 300 + i * 150;
          return <line key={i} x1={560} y1={y} x2={cx - CARD_W / 2 - 6} y2={cardTop + 80 + i * 80} stroke={C.green} strokeWidth={1.5} strokeDasharray="5 6" />;
        })}
        {pinsR.map((_, i) => {
          const y = 260 + i * 120;
          return <line key={i} x1={1380} y1={y} x2={cx + CARD_W / 2 + 6} y2={cardTop + 26 + i * 44} stroke={C.green} strokeWidth={1.5} strokeDasharray="5 6" />;
        })}
      </svg>
      <div style={{ opacity: c >= 2 ? 1 : 0, transition: 'opacity .5s' }}>
        {pinsL.map(([a, b], i) => (
          <div key={a} style={{ ...abs(150, 270 + i * 150, 400), textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.ink }}>{a}</div>
            <div style={{ fontSize: 18, color: 'var(--fg-muted)', marginTop: 2 }}>{b}</div>
          </div>
        ))}
        {pinsR.map(([a, b], i) => (
          <div key={a} style={{ ...abs(1390, 230 + i * 120, 400) }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.ink }}>{a}</div>
            <div style={{ fontSize: 18, color: 'var(--fg-muted)', marginTop: 2 }}>{b}</div>
          </div>
        ))}
      </div>

      {/* 클릭 3 — 전북 자체 선례 */}
      <div style={{ ...abs(120, 900, 1400), opacity: c >= 3 ? 1 : 0, transform: `translateY(${c >= 3 ? 0 : 14}px)`, transition: 'all .5s cubic-bezier(.16,1,.3,1)' }}>
        <Box tone="pre" title="전북은 이미 이 방식을 쓴다">
          SW·AI 교구비 → 공모 조건 없이 <b>학교기본운영비</b>로 지원 · 초3 <b>1인당 연 50만 원</b> 선택형 이용권
          <Src style={{ marginTop: 4 }}>2026 SW·AI교육 추진계획 영역2-2 · 2026 교육계획 p.112</Src>
        </Box>
      </div>
    </>
  );
}
function S09() {
  return (
    <Scene freezeAt={4}>
      <S09Scene />
    </Scene>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   10 — ② AI 지원 사업 과제 정비 (build · 전후 과제표)
   ══════════════════════════════════════════════════════════════════════ */

function S10() {
  const old = ['연수 30시간+', '전문적 학습공동체', '학기당 수업공개 (교외 1회)', '성과 사례 2가지+', 'AIEP 활용 보고서', '현장지원단 컨설팅', '교원·학부모 설명회', '운영수당 10% · 업무추진비 5%', '결과·정산보고서'];
  const row = (label: string, content: ReactNode, tone: string) => (
    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', alignItems: 'baseline', padding: '30px 0', borderBottom: `1px solid ${C.line}` }}>
      <div style={{ ...mono, fontSize: 17, color: tone }}>{label}</div>
      <div>{content}</div>
    </div>
  );
  return (
    <>
      <Head k="가 · ② AI 지원 사업 과제 정비">필수는 하나, 나머지는 학교가 고른다</Head>
      {/* 지금 — 축소 영수증 */}
      <div style={{ ...abs(120, 250, 520) }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg-faint)', letterSpacing: '0.06em' }}>지금 · 2장의 영수증</div>
        <div style={{ ...card, marginTop: 12, padding: '18px 24px', opacity: 0.6 }}>
          {old.map((o) => (
            <div key={o} style={{ fontSize: 21, lineHeight: 2.15, color: 'var(--fg-muted)', borderBottom: `1px dotted ${C.line}` }}>{o}</div>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${DW} ${DH}`} style={{ ...abs(0, 0, DW, DH), pointerEvents: 'none' }}>
        <line x1={672} x2={770} y1={600} y2={600} stroke={C.ink} strokeWidth={2} />
        <path d="M770 600 l-14 -8 v16 z" fill={C.ink} />
      </svg>
      {/* 제안 */}
      <div style={{ ...abs(800, 250, 1000) }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.green, letterSpacing: '0.06em' }}>제안</div>
        <div style={{ borderTop: `2px solid ${C.ink}`, marginTop: 12 }}>
          <Build at={1}>
            {row('필수', <span style={{ fontFamily: serif, fontSize: 48, fontWeight: 700, color: C.green }}>AI 실제 활용</span>, C.green)}
          </Build>
          <Build at={2}>
            {row('선택', <span style={{ fontSize: 27, color: C.ink }}>연수 시간 · 교외 공개수업 · 학습공동체 <span style={{ color: 'var(--fg-faint)', fontSize: 19 }}>없애지 않고 학교가 고른다</span></span>, 'var(--fg-muted)')}
          </Build>
          <Build at={3}>
            {row('보고', <span style={{ fontSize: 27, color: C.ink }}>계획서·보고서 1쪽</span>, 'var(--fg-muted)')}
            {row('성과지표', <span style={{ fontSize: 27, color: C.ink }}>교사 시간 절감 · 실사용</span>, 'var(--fg-muted)')}
          </Build>
        </div>
        <Build at={4} style={{ marginTop: 26, width: 720 }}>
          <Box tone="ctx" title="교육청의 역할 — 과제 대신 안내">
            업무별(생기부·평가·공문·수업자료) AI 활용 안내와 필요한 연수를 교육청이 골라 제공 · 교육부·KERIS 지침 조건은 교육부에 완화 건의
            <Src style={{ marginTop: 4 }}>공식 안내를 받은 교사 69%가 "활용이 장려된다"(비공식 51%) · Gallup 2025</Src>
          </Box>
        </Build>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   9 — 고교 AI 중점학교, 매 학기 개설 (scene · 꽉 찬 시수 선반)
   ══════════════════════════════════════════════════════════════════════ */

const SEMS = ['2026-1', '2026-2', '2027-1', '2027-2', '2028-1', '2028-2'];
const STACK = ['예체능', '과학', '사회', '영어', '수학', '국어'];
const BOX_X = 120;
const COL_W = 140;
const COL_GAP = 22;
const BOX_TOP = 330;
const BLK_H = 60;
const BOX_H = BLK_H * STACK.length;
const pressAt = (i: number) => 0.8 + i * 0.85;

function S11Scene() {
  const t = useSceneTime();
  const c = useClicks(2);
  const floorY = BOX_TOP + BOX_H;
  return (
    <>
      <Head k="가 · ③의 이유 · AI 중점학교(특별교부금 국가시책 사업)" size={48} t={t}>
        매 학기 개설, 그 시수는 어디서 오나
      </Head>
      {SEMS.map((sem, i) => {
        const x = BOX_X + i * (COL_W + COL_GAP);
        const s = pressAt(i);
        const p = interpolate(t, [s, s + 0.55], [0, 1], easeInOut);
        /* 맨 아래 과목은 칸마다 다르다 — 수능 과목 다섯 개를 돌려 쓴다 */
        const order = [...STACK.slice(0, 1), ...STACK.slice(1).map((_, k) => STACK[1 + ((k + i) % 5)])];
        const out = order[order.length - 1];
        const fall = interpolate(t, [s + 0.35, s + 0.9], [0, 1], easeOut);
        return (
          <div key={sem}>
            <div style={{ ...abs(x, BOX_TOP - 42, COL_W), textAlign: 'center', ...mono, fontSize: 17, color: 'var(--fg-faint)' }}>{sem}</div>
            {/* 정원 상자 — 높이 고정, 넘치는 블록은 바닥 아래로 밀려난다 */}
            <div style={{ ...abs(x, BOX_TOP, COL_W, BOX_H), overflow: 'hidden', borderLeft: `2px solid ${C.ink}`, borderRight: `2px solid ${C.ink}` }}>
              <div style={{ position: 'absolute', left: 0, top: (p - 1) * BLK_H, width: COL_W, display: 'flex', flexDirection: 'column', gap: 4, padding: '2px 6px', boxSizing: 'border-box' }}>
                <div style={{ height: BLK_H - 4, borderRadius: 6, background: C.green, color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 700 }}>AI·정보</div>
                {order.map((sub, k) => (
                  <div key={k} style={{ height: BLK_H - 4, borderRadius: 6, background: k === order.length - 1 && p > 0.5 ? C.amberSoft : k === 0 ? '#eef1ee' : C.white, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, color: 'var(--fg-muted)' }}>
                    {sub}
                  </div>
                ))}
              </div>
            </div>
            {/* 밀려난 수능 과목 */}
            <div
              style={{
                ...abs(x + 6, floorY + 18 + fall * 26, COL_W - 12, BLK_H - 4),
                opacity: fall,
                transform: `rotate(${(i % 2 ? 1 : -1) * 6 * fall}deg)`,
                borderRadius: 6,
                background: C.amberSoft,
                border: `2px solid ${C.amber}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 19,
                fontWeight: 700,
                color: C.amber,
              }}
            >
              {out} −
            </div>
          </div>
        );
      })}
      {/* 상자 바닥 */}
      <div style={{ ...abs(BOX_X - 10, floorY, SEMS.length * (COL_W + COL_GAP) - COL_GAP + 20, 5), background: C.ink, borderRadius: 3 }} />
      <div style={{ ...abs(BOX_X, floorY + 150, 980), ...body, fontSize: 21, color: C.ink, opacity: interpolate(t, [5.8, 6.3], [0, 1]) }}>
        정원은 학교 안에서 — AI·정보 과목이 들어오면 <b style={{ color: C.amber }}>수능 과목 시수</b>를 줄여야 한다
      </div>

      {/* 요건 원문 */}
      <div style={{ ...abs(1180, 250, 620), borderLeft: `3px solid ${C.blue}`, paddingLeft: 22 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.blue, letterSpacing: '0.06em' }}>요건 원문</div>
        <div style={{ fontFamily: serif, fontSize: 25, lineHeight: 1.5, color: C.ink, marginTop: 6, wordBreak: 'keep-all' }}>
          "3년간 매 학기 AI·정보 과목을 최소 한 과목 이상 편성"
        </div>
        <div style={{ ...small, marginTop: 8 }}>학생 전원 수강이 아니라 학교의 매 학기 개설 · 2026 신입생 기준 → 2027~2028년 본격화</div>
        <Src style={{ marginTop: 4 }}>2026 SW·AI교육 활성화 추진계획</Src>
      </div>

      {/* 클릭 1 — 학생 쪽 */}
      <div style={{ ...abs(1180, 530, 620), opacity: c >= 1 ? 1 : 0, transform: `translateY(${c >= 1 ? 0 : 12}px)`, transition: 'all .5s cubic-bezier(.16,1,.3,1)' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--fg-muted)', letterSpacing: '0.04em' }}>학생 쪽에서는</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          {['상대평가 부담', '선택이 적다', '소수만 수강'].map((s, i) => (
            <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              {i > 0 && <span style={{ color: C.amber, fontWeight: 700 }}>→</span>}
              <span style={{ fontSize: 23, fontWeight: 700, padding: '8px 16px', borderRadius: 99, background: C.amberSoft, color: C.amber }}>{s}</span>
            </span>
          ))}
        </div>
        <div style={{ ...small, marginTop: 12 }}>2028 대입에서 진로선택 과목도 상대평가 (교육부 세부 지침 원문 재확인)</div>
      </div>

      {/* 클릭 2 — 도내 수급 */}
      <div style={{ ...abs(1180, 730, 360), opacity: c >= 2 ? 1 : 0, transition: 'opacity .5s' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--fg-muted)', letterSpacing: '0.04em' }}>교사를 늘리기도 어렵다</div>
        <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
          {[
            ['약 28%', '도내 중학교 정보교사 배치율(전국 최저)'],
            ['44교', '정보교사 없는 공립고'],
            ['3 → 3 → 4 → 14', '정보 임용 ’23~’26(예정)'],
          ].map(([n, l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ ...mono, fontSize: 30, color: C.ink, minWidth: 190, flexShrink: 0 }}>{n}</span>
              <span style={{ fontSize: 18, color: 'var(--fg-muted)' }}>{l}</span>
            </div>
          ))}
        </div>
        <Src style={{ marginTop: 6 }}>추진계획 Ⅱ-5 · 백서 p.234</Src>
      </div>
    </>
  );
}
function S11() {
  return (
    <Scene freezeAt={6.5}>
      <S11Scene />
    </Scene>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   12 — ③ 요건 현실화와 교원 지원 (static)
   ══════════════════════════════════════════════════════════════════════ */

function S12() {
  return (
    <>
      <Head k="가 · ③ 고교 AI 중점학교 요건 현실화와 교원 지원">요건은 학교가 조정하고, 사람은 교육청이 맡는다</Head>
      <div style={{ ...abs(120, 290, 960) }}>
        <div style={{ ...mono, fontSize: 18, color: C.green }}>요건</div>
        <div style={{ fontFamily: serif, fontSize: 56, fontWeight: 700, lineHeight: 1.25, color: C.ink, marginTop: 10, wordBreak: 'keep-all' }}>
          '매 학기 개설'을
          <br />
          3년간 개설 학기 수를
          <br />
          <span style={{ color: C.green }}>학교가 조정</span>하는 방식으로
        </div>
        <div style={{ ...body, fontSize: 25, marginTop: 30, color: C.ink }}>+ 전북온라인학교 · 공동교육과정 개설분도 요건으로 인정</div>
        <Src style={{ marginTop: 8 }}>근거: 전북온라인학교 AI 트랙 강좌 누적 40개 계획 · 공립고 정보교사 미배치 44교(백서 p.234)</Src>
      </div>
      <div style={{ ...abs(1180, 250, 620) }}>
        <div style={{ ...mono, fontSize: 18, color: C.blue }}>사람</div>
        <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
          {[
            ['한시 교원 정원', '학교 규모에 따라 기간제 정원 배정'],
            ['채용 대행', '학교가 직접 구인하지 않도록 교육청이 대행'],
            ['순회교사 · 강사 풀', '채용이 안 되면 풀에서 배정'],
          ].map(([a, b]) => (
            <div key={a} style={{ ...card, padding: '18px 22px', borderLeft: `4px solid ${C.blue}` }}>
              <div style={{ fontSize: 25, fontWeight: 700, color: C.ink }}>{a}</div>
              <div style={{ fontSize: 19, color: 'var(--fg-muted)', marginTop: 4 }}>{b}</div>
            </div>
          ))}
        </div>
        <Src style={{ marginTop: 12 }}>선례: 경기도교육청 계약제 교원 채용업무 대행</Src>
      </div>
      <Box tone="con" title="제안자도 인정하는 한계" style={{ ...abs(120, 900, 1400) }}>
        정원을 줘도 교사를 구하기 어렵다. 그래서 요건 완화와 함께 요청한다.
      </Box>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   11 — 교사는 이미 만들고, 공유는 활발하지 않다 (build · 흐름선 위 막힘)
   ══════════════════════════════════════════════════════════════════════ */

function S13() {
  const c = useClicks(3);
  const FX = 700;
  const BW = 290;
  const GAP = 110;
  const steps = ['만들기', '공유', '다른 교사가 쓰기'];
  const bx = (i: number) => FX + i * (BW + GAP);
  const blockX = bx(1);
  const arrowMid = bx(1) + BW + GAP / 2;
  const blocks: [string, string][] = [
    ['공유된 프로그램은 만든 교사의 수업 방식에 맞춰져 있다', '그대로 가져다 쓰기 어렵다'],
    ['파이프라인이 완전히 구축된 프로그램은 공유가 어렵다', '과제 제출까지 시스템화한 도구 같은 경우'],
  ];
  return (
    <>
      <Head k="나 · ④의 이유">만드는 교사는 늘고, 공유는 활발하지 않다</Head>
      {/* 만드는 교사 */}
      <div style={{ ...abs(120, 270, 480) }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.green, letterSpacing: '0.06em' }}>만드는 교사</div>
        {[
          ['33', '서울 교사 개발자 1기', '아시아경제 2026.6.14'],
          ['50', '광주 교원 바이브코딩 해커톤', '디스커버리뉴스 2026.5'],
        ].map(([n, l, s]) => (
          <div key={l} style={{ marginTop: 22 }}>
            <span style={{ ...mono, fontSize: 64, color: C.ink, lineHeight: 1 }}>{n}</span>
            <span style={{ fontSize: 21, color: 'var(--fg-muted)', marginLeft: 12 }}>{l}</span>
            <Src style={{ marginTop: 2 }}>{s}</Src>
          </div>
        ))}
        <div style={{ display: 'grid', gap: 10, marginTop: 28 }}>
          {['도내 교사 · 학생용 퀴즈 게임', '도내 교사 · 학교 업무 플랫폼'].map((s) => (
            <span key={s} style={{ fontSize: 19, padding: '7px 14px', border: `1px solid ${C.line}`, borderRadius: 8, background: C.white, justifySelf: 'start' }}>
              {s}
              <Flag>세부 확인 중</Flag>
            </span>
          ))}
        </div>
      </div>
      <div style={{ ...abs(640, 270, 1, 600), background: C.line }} />

      {/* 흐름선 */}
      <svg viewBox={`0 0 ${DW} ${DH}`} style={{ ...abs(0, 0, DW, DH), pointerEvents: 'none' }}>
        {[0, 1].map((i) => {
          const x1 = bx(i) + BW;
          const blocked = i === 1 && c >= 1;
          return (
            <g key={i}>
              <line x1={x1 + 8} x2={x1 + GAP - 12} y1={330} y2={330} stroke={blocked ? C.amber : C.ink} strokeWidth={2.5} opacity={0.7} strokeDasharray={blocked ? '8 7' : undefined} />
              <path d={`M${x1 + GAP - 8} 330 l-13 -8 v16 z`} fill={blocked ? C.amber : C.ink} opacity={0.7} />
            </g>
          );
        })}
        <line x1={arrowMid} x2={arrowMid} y1={342} y2={452} stroke={C.amber} strokeWidth={2.5} opacity={c >= 1 ? 1 : 0} />
      </svg>
      {steps.map((s, i) => (
        <div key={s} style={{ ...abs(bx(i), 290, BW, 80), borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, background: i === 0 ? C.green : C.white, color: i === 0 ? C.white : C.ink, border: `2px solid ${i === 0 ? C.green : i === 2 && c >= 1 ? C.amber : C.line}` }}>
          {s}
        </div>
      ))}
      <div style={{ ...abs(bx(1), 384, BW), textAlign: 'center', fontSize: 17, color: C.blue, fontWeight: 600 }}>교육청 누리집 · AIEP에 공유 중</div>

      {blocks.map(([a, b], i) => (
        <div key={a} style={{ ...abs(blockX, 460 + i * 150, 1520 - blockX), opacity: c >= i + 1 ? 1 : 0, transform: `translateY(${c >= i + 1 ? 0 : 12}px)`, transition: 'all .45s cubic-bezier(.16,1,.3,1)' }}>
          <div style={{ background: C.amberSoft, borderRadius: 8, padding: '18px 24px', borderLeft: `4px solid ${C.amber}` }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.amber, wordBreak: 'keep-all', lineHeight: 1.35 }}>{a}</div>
            <div style={{ fontSize: 18, color: C.ink, marginTop: 6, lineHeight: 1.45, wordBreak: 'keep-all' }}>{b}</div>
          </div>
        </div>
      ))}
      <div style={{ ...abs(700, 790, 820), opacity: c >= 3 ? 1 : 0, transition: 'opacity .5s' }}>
        <div style={{ ...small, color: 'var(--fg-muted)', marginBottom: 10 }}>+ 개인정보를 다루면 교사가 만든 자료도 학운위 심의 대상 (초중등교육법 제29조의2, 2026.3.~)</div>
        <Box tone="con" title="불리한 자료">
          교사 제작 앱은 위험하다는 반론 · 국내 대형 유출은 에듀테크 기업 쪽(개인정보 20만 건). 교사 제작 앱 사고는 국내 보도로 찾지 못함
        </Box>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   14 — ④ 전북 에듀테크 깃허브 (scene · 완성 요리 대 레시피 원본)
   ══════════════════════════════════════════════════════════════════════ */

const RC_W = 290;
const RC_H = 360;
const COPIES = [
  { school: '고등학교', x: 1010, y: 250, rot: -6, edits: ['우리 반은 10문항', '제한 시간 없음'] },
  { school: '중학교', x: 1250, y: 300, rot: 3, edits: ['그림 문항 추가'] },
  { school: '초등학교', x: 1490, y: 250, rot: 7, edits: ['글자 크게', '소리 켜기'] },
];

function RecipeCard({ title, sub, children }: { title: string; sub: string; children?: ReactNode }) {
  return (
    <div
      style={{
        width: RC_W,
        height: RC_H,
        background: `repeating-linear-gradient(180deg, #fffdf8 0 37px, #e7ece8 37px 38px)`,
        border: `1px solid ${C.line}`,
        borderRadius: 8,
        boxShadow: '0 16px 36px -24px rgba(22,32,27,.5)',
        padding: '16px 20px',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      <div style={{ fontSize: 15, color: 'var(--fg-faint)', ...mono }}>{sub}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: C.ink, marginTop: 2 }}>{title}</div>
      {[0.8, 0.6, 0.72, 0.5, 0.66, 0.44].map((w, i) => (
        <div key={i} style={{ height: 9, width: `${w * 100}%`, background: 'color-mix(in srgb, var(--fg) 16%, transparent)', borderRadius: 4, marginTop: i === 0 ? 22 : 29 }} />
      ))}
      {children}
    </div>
  );
}

function S14Scene() {
  const t = useSceneTime();
  const c = useClicks(2);
  const OX = 640;
  const OY = 290;
  return (
    <>
      <Head k="나 · ④ (가칭) 전북 에듀테크 깃허브" size={52} t={t}>
        완성품이 아니라 원본을 나눈다
      </Head>

      {/* 완성품 */}
      <div style={{ ...abs(110, 330, 380), textAlign: 'center', opacity: interpolate(t, [0.2, 0.7], [0, 1]) }}>
        <img src="assets/svg/plated-dish.svg" alt="위에서 본 완성 요리 한 접시" style={{ width: 290, filter: 'grayscale(0.35)', opacity: 0.85 }} />
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--fg-muted)', marginTop: 16 }}>완성품 공유</div>
        <div style={{ ...small, marginTop: 4 }}>쓸 수는 있지만, 고칠 수 없다</div>
      </div>

      {/* 원본 */}
      <div style={{ ...abs(OX, OY), transform: `translateY(${(1 - spring(t, 0.5, 0.9)) * 30}px)`, opacity: Math.min(1, spring(t, 0.5, 0.9) * 1.5) }}>
        <RecipeCard title="퀴즈 도구" sub="원본(코드)" />
      </div>
      <div style={{ ...abs(OX, OY - 44, RC_W), textAlign: 'center', fontSize: 18, fontWeight: 700, color: C.green, opacity: interpolate(t, [0.8, 1.2], [0, 1]) }}>원본(코드) 공유</div>

      {/* 복제본 — 부채꼴로 퍼지며 학교마다 고친다 */}
      {COPIES.map((cp, i) => {
        const p = spring(t, 1.5 + i * 0.35, 1.0);
        const x = OX + (cp.x - OX) * p;
        const y = OY + (cp.y - OY) * p;
        const pen = interpolate(t, [3.0 + i * 0.4, 3.8 + i * 0.4], [0, 1], easeOut);
        return (
          <div key={cp.school} style={{ ...abs(x, y), transform: `rotate(${cp.rot * p}deg)`, opacity: p > 0.01 ? 1 : 0, zIndex: 2 + i }}>
            <RecipeCard title="퀴즈 도구" sub={`복제 · ${cp.school}`}>
              <svg viewBox={`0 0 ${RC_W} ${RC_H}`} style={{ ...abs(0, 0, RC_W, RC_H), pointerEvents: 'none' }}>
                <line x1={20} x2={20 + 180 * pen} y1={101} y2={99} stroke={C.green} strokeWidth={3} strokeLinecap="round" />
              </svg>
              {cp.edits.map((e, k) => (
                <div key={e} style={{ ...abs(26 + k * 18, 118 + k * 76), ...hand, fontSize: 30, color: C.green, opacity: interpolate(pen, [0.4 + k * 0.2, 0.8 + k * 0.2], [0, 1]), transform: 'rotate(-3deg)', whiteSpace: 'nowrap' }}>
                  {e}
                </div>
              ))}
            </RecipeCard>
          </div>
        );
      })}
      <div style={{ ...abs(1010, 200, 780), textAlign: 'center', fontSize: 18, fontWeight: 700, color: C.green, opacity: interpolate(t, [2.4, 2.8], [0, 1]) }}>
        복제 → 우리 학교에 맞게 수정 <span style={{ fontWeight: 400, color: 'var(--fg-faint)' }}>학교 설정·학생 데이터는 분리</span>
      </div>

      {/* 클릭 1 — 선반과 이름표 */}
      <div style={{ ...abs(600, 720, 920), opacity: c >= 1 ? 1 : 0, transform: `translateY(${c >= 1 ? 0 : 12}px)`, transition: 'all .5s cubic-bezier(.16,1,.3,1)' }}>
        <div style={{ height: 14, background: C.ink, borderRadius: 3, opacity: 0.85 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 20, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: serif, fontSize: 32, fontWeight: 700, color: C.ink }}>(가칭) 전북 에듀테크 깃허브</span>
          <span style={{ fontSize: 19, color: 'var(--fg-muted)' }}>AIEP 안의 교사용 개발·배포 공간</span>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          {['교육청 클라우드 로그인', '한 저장소로 공유', '교육청 검수 → 학교별 심의 부담 경감'].map((s) => (
            <span key={s} style={{ fontSize: 19, padding: '7px 14px', borderRadius: 99, background: C.blueSoft, color: C.blue, fontWeight: 600 }}>{s}</span>
          ))}
        </div>
        <Src style={{ marginTop: 10 }}>교육청 학습지원 SW 207개 자체 검증(뉴스핌 2026.2.3) 체계를 넓힌다</Src>
      </div>

      {/* 클릭 2 — 공유 포상 */}
      <div style={{ ...abs(110, 790, 440), opacity: c >= 2 ? 1 : 0, transform: `scale(${c >= 2 ? 1 : 0.9})`, transformOrigin: 'left top', transition: 'all .5s cubic-bezier(.16,1,.3,1)' }}>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          <div style={{ width: 96, height: 96, borderRadius: 48, border: `4px solid ${C.green}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.greenSoft, flexShrink: 0 }}>
            <span style={{ fontFamily: serif, fontSize: 26, fontWeight: 700, color: C.green }}>공유</span>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.ink }}>공유 포상, 수업 공개처럼</div>
            <div style={{ fontSize: 17, color: 'var(--fg-muted)', marginTop: 4, wordBreak: 'keep-all' }}>연구실적 인정 · 연구비 · 표창</div>
          </div>
        </div>
        <Src style={{ marginTop: 10 }}>선례: 수업혁신 성장인증제(백서 p.101)</Src>
      </div>
      <Term term="복제(fork)" gloss="원본을 가져와 내 버전을 만든다" style={{ ...abs(110, 960) }} />
    </>
  );
}
function S14() {
  return (
    <Scene freezeAt={6}>
      <S14Scene />
    </Scene>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   16 — 외부 업체가 만든 큰 시스템들 (scene · 유리 진열장)
   ══════════════════════════════════════════════════════════════════════ */

type Case = {
  name: string;
  tag: string;
  w: number;
  big: (t: number) => string;
  bigLabel: string;
  extra?: string;
  src: string;
  scrap?: boolean;
};
const CASES: Case[] = [
  {
    name: 'AI 디지털교과서',
    tag: '국가 사업',
    w: 330,
    big: (p) => `${(34.2 - (34.2 - 5.2) * p).toFixed(1)}%`,
    bigLabel: '활용 학교 34.2% → 5.2%',
    extra: '사용 교사 79.7% "업무 증가" · 감사원 평균 활용률 8.1%',
    src: '경향신문 2026.9.21',
  },
  { name: '경기 하이러닝', tag: '358억 원', w: 330, big: () => '88.4%', bigLabel: '교사 "거의 사용 안 함"', extra: '교사노조 조사', src: '이데일리 2026.6.18 외' },
  { name: "서울 '뉴쌤'", tag: '58억 원', w: 260, big: () => '폐기', bigLabel: '투입 후 폐기', src: '에듀플러스 2025.12.17', scrap: true },
  { name: '4세대 나이스', tag: '2,800억 원', w: 420, big: () => '80.9%', bigLabel: '개통 3주 차 "불편해졌다"', extra: '교원 2만 3,063명 조사', src: '경향신문 2023.7.13' },
];
const CASE_Y = 226;
const CASE_H = 520;

function S16Scene() {
  const t = useSceneTime();
  const c = useClicks(2);
  let x = 110;
  return (
    <>
      <Head k="다 · ⑤의 이유" size={52} t={t}>
        큰돈을 들인 시스템이 진열장에 남았다
      </Head>
      {CASES.map((cs, i) => {
        const left = x;
        x += cs.w + 22;
        const s = 0.6 + i * 1.3;
        const tag = spring(t, s, 0.8);
        const sticker = interpolate(t, [s + 0.5, s + 0.9], [0, 1], easeOut);
        const dim = interpolate(t, [s + 0.9, s + 1.5], [0, 1]);
        const light = `color-mix(in srgb, #fff8e6 ${Math.round(100 - dim * 100)}%, #dfe3df)`;
        return (
          <div key={cs.name} style={{ ...abs(left, CASE_Y, cs.w, CASE_H + 120) }}>
            {/* 가격표 */}
            <div style={{ ...abs(cs.w / 2 - 70, -6, 140), textAlign: 'center', transform: `translateY(${(1 - tag) * -40}px)`, opacity: Math.min(1, tag * 1.5) }}>
              <div style={{ width: 2, height: 30, background: C.ink, margin: '0 auto', opacity: 0.5 }} />
              <div style={{ display: 'inline-block', padding: '6px 14px', background: C.white, border: `1.5px solid ${C.ink}`, borderRadius: 6, ...mono, fontSize: cs.tag.length > 6 ? 18 : 22, color: C.ink, transform: `rotate(${i % 2 ? 3 : -3}deg)` }}>{cs.tag}</div>
            </div>
            {/* 진열장 */}
            <div style={{ ...abs(0, 70, cs.w, CASE_H - 70), border: `3px solid ${C.ink}`, borderRadius: 6, background: light, overflow: 'hidden', transition: 'background .2s' }}>
              <svg viewBox={`0 0 ${cs.w} ${CASE_H - 70}`} style={{ ...abs(0, 0, cs.w, CASE_H - 70), pointerEvents: 'none' }}>
                <line x1={cs.w * 0.12} y1={40} x2={cs.w * 0.42} y2={0} stroke="#fff" strokeWidth={10} opacity={0.55 - dim * 0.3} />
                <line x1={cs.w * 0.2} y1={70} x2={cs.w * 0.55} y2={10} stroke="#fff" strokeWidth={4} opacity={0.5 - dim * 0.3} />
              </svg>
              <div style={{ ...abs(0, 120, cs.w), textAlign: 'center', padding: '0 14px', boxSizing: 'border-box' }}>
                <div style={{ ...mono, fontSize: cs.scrap ? 60 : 56, color: C.ink, lineHeight: 1, opacity: 0.35 + 0.65 * sticker }}>{cs.big(sticker)}</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: C.ink, marginTop: 14, wordBreak: 'keep-all' }}>{cs.bigLabel}</div>
                {cs.extra && <div style={{ fontSize: 16, color: 'var(--fg-muted)', marginTop: 10, wordBreak: 'keep-all', lineHeight: 1.45 }}>{cs.extra}</div>}
              </div>
              {cs.scrap && (
                <div style={{ ...abs(-40, 250, cs.w + 80, 44), background: C.amber, opacity: interpolate(t, [s + 1.5, s + 1.8], [0, 0.92]), transform: 'rotate(-18deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, fontSize: 22, fontWeight: 700, letterSpacing: '0.3em' }}>
                  폐기
                </div>
              )}
            </div>
            {/* 받침 이름표 */}
            <div style={{ ...abs(-6, CASE_H, cs.w + 12, 50), background: C.ink, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, fontSize: 21, fontWeight: 700 }}>{cs.name}</div>
            <Src style={{ ...abs(0, CASE_H + 60, cs.w), textAlign: 'center' }}>{cs.src}</Src>
          </div>
        );
      })}

      {/* 클릭 1 — 불리한 자료 */}
      <div style={{ ...abs(110, 872, 1420), opacity: c >= 1 ? 1 : 0, transform: `translateY(${c >= 1 ? 0 : 12}px)`, transition: 'all .5s cubic-bezier(.16,1,.3,1)' }}>
        <Box tone="con" title="불리한 자료 — 조사 주체에 따라 결과가 갈린다">
          대구 AI 디지털교과서 활용률 68.8% 유지 · 경기교육청 자체조사 교사 83% "수업에 도움" · ASSISTments 효과크기 0.18
        </Box>
      </div>
      {/* 클릭 2 — 불 켜진 빈 칸 */}
      <div style={{ ...abs(1560, CASE_Y + 70, 250, CASE_H - 70), opacity: c >= 2 ? 1 : 0, transition: 'opacity .6s' }}>
        <div style={{ height: '100%', border: `3px dashed ${C.green}`, borderRadius: 6, background: '#fffaf0', boxShadow: `0 0 60px -10px rgba(255, 214, 140, .9)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: serif, fontSize: 48, fontWeight: 700, color: C.green }}>AIEP?</span>
        </div>
      </div>
    </>
  );
}
function S16() {
  return (
    <Scene freezeAt={7}>
      <S16Scene />
    </Scene>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   17 — AIEP는 지금 어디에 있나 (static · 타임라인)
   ══════════════════════════════════════════════════════════════════════ */

function S17() {
  const TY = 540;
  const pts: [number, string, string, boolean][] = [
    [300, '2026', '시범 운영', true],
    [1020, '’27. 9.', 'AI 에이전트 업체 선정', false],
    [1560, '’28. 3.', 'AI 에이전트 운영', false],
  ];
  return (
    <>
      <Head k="다 · ⑤의 이유 · 반대가 아니라 보완">AIEP는 아직 시범 단계, 설계를 바꿀 수 있다</Head>
      {/* 규모 */}
      <div style={{ ...abs(120, 250, 1680), display: 'flex', alignItems: 'flex-end', gap: 70 }}>
        <div>
          <div style={{ ...mono, fontSize: 84, color: C.blue, lineHeight: 1 }}>약 124억 원</div>
          <div style={{ fontSize: 19, color: 'var(--fg-muted)', marginTop: 6 }}>교육감 10대 핵심과제 ⑦ · 4개년</div>
        </div>
        <div>
          <div style={{ ...mono, fontSize: 46, color: C.ink, lineHeight: 1 }}>약 30억 원</div>
          <div style={{ fontSize: 17, color: 'var(--fg-muted)', marginTop: 6 }}>전북 낙찰 · 11개 교육청 공동 · 업체 계약 방식</div>
        </div>
        <div>
          <div style={{ ...mono, fontSize: 46, color: C.ink, lineHeight: 1 }}>50%</div>
          <div style={{ fontSize: 17, color: 'var(--fg-muted)', marginTop: 6 }}>이용률 목표</div>
        </div>
      </div>
      <Src style={{ ...abs(120, 400) }}>백서 p.29·p.42~43 · 전북일보 사설 2025.11.13</Src>

      {/* 타임라인 */}
      <svg viewBox={`0 0 ${DW} ${DH}`} style={{ ...abs(0, 0, DW, DH), pointerEvents: 'none' }}>
        <line x1={160} x2={1780} y1={TY} y2={TY} stroke={C.ink} strokeWidth={3} opacity={0.7} />
        <path d={`M1790 ${TY} l-16 -9 v18 z`} fill={C.ink} opacity={0.7} />
        {pts.map(([x, , , now]) => (
          <circle key={x} cx={x} cy={TY} r={now ? 14 : 10} fill={now ? C.green : C.white} stroke={now ? C.green : C.ink} strokeWidth={3} />
        ))}
      </svg>
      {pts.map(([x, d, l, now]) => (
        <div key={x} style={{ ...abs(x - 160, TY + 26, 320), textAlign: 'center' }}>
          <div style={{ ...mono, fontSize: 22, color: now ? C.green : C.ink }}>{d}</div>
          <div style={{ fontSize: 19, color: 'var(--fg-muted)', marginTop: 2 }}>{l}</div>
        </div>
      ))}
      <div style={{ ...abs(300 - 40, TY - 68, 80), textAlign: 'center' }}>
        <span style={{ fontSize: 17, fontWeight: 700, padding: '4px 12px', borderRadius: 99, background: C.green, color: C.white }}>지금</span>
      </div>

      {/* 현장 목소리 */}
      <div style={{ ...abs(120, 690, 1000), display: 'grid', gap: 14 }}>
        {[
          ['전북형 AI 기반 공공학습플랫폼이 AIEP와 다른 것인지 모르겠다.', -1],
          ['교육 플랫폼이 너무 자주 바뀝니다.', 1],
          ["꼭 '전북형'이어야 하나요?", -0.5],
        ].map(([q, r], i) => (
          <div key={i} style={{ justifySelf: i === 1 ? 'center' : 'start', maxWidth: 820, padding: '14px 22px', background: C.white, border: `1px solid ${C.line}`, borderRadius: '18px 18px 18px 4px', fontFamily: serif, fontSize: i === 0 ? 25 : 23, color: C.ink, transform: `rotate(${r}deg)` }}>
            "{q}"
          </div>
        ))}
        <Src>백서 p.334~335 · 교직원 설문 자유의견</Src>
      </div>
      <Box tone="ctx" title="인수위가 요구한 것" style={{ ...abs(1180, 690, 340) }}>
        "AIEP와의 관계, 차별성을 명확히" <span style={{ color: 'var(--fg-faint)', fontSize: 16 }}>p.344</span>
        <br />
        "특화서비스보다 교사 업무경감이 실제로 작동되도록" <span style={{ color: 'var(--fg-faint)', fontSize: 16 }}>p.301</span>
      </Box>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   18 — ⑥ AIEP를 공용 기반으로 (scene · 궤도)
   ══════════════════════════════════════════════════════════════════════ */

const OC = { x: 860, y: 555 };
const ORX = 480;
const ORY = 268;
const ST_ANG = [-150, -30, 30, 150]; // ① 왼쪽 위 → ② 오른쪽 위 → ③ 오른쪽 아래 → ④ 왼쪽 아래 (시계 방향)
const STATIONS = [
  { n: '①', who: '학교 · 교사', title: '복제해서 확장', desc: '학교 설정·학생 데이터는 분리', school: true },
  { n: '②', who: '교육청', title: '검수', desc: '학교가 만든 확장을 교육청이 검수', school: false },
  { n: '③', who: '학교', title: '배포 · 사용', desc: '학교별 맞춤형 AIEP로 운영', school: true },
  { n: '④', who: '교육청', title: '공용 기반에 합류', desc: '우수 확장은 모든 학교가 쓴다', school: false },
];
const orbitPt = (deg: number) => {
  const r = (deg * Math.PI) / 180;
  return { x: OC.x + ORX * Math.cos(r), y: OC.y + ORY * Math.sin(r) };
};
const PERIOD = 6;

function S18Scene() {
  const t = useSceneTime();
  const c = useClicks(4);
  const tt = Math.max(0, t - 1.2);
  const cycle = Math.floor(tt / PERIOD);
  const ph = (tt % PERIOD) / PERIOD; // 0~1
  /* 0~0.8: -150° → 150°(시계 방향 300°), 0.8~1: 핵으로 흡수 */
  let dot = orbitPt(-150);
  let dotOp = t > 1.2 ? 1 : 0;
  if (ph < 0.8) {
    dot = orbitPt(-150 + 300 * easeInOut(ph / 0.8));
  } else {
    const k = (ph - 0.8) / 0.2;
    const a = orbitPt(150);
    dot = { x: a.x + (OC.x - a.x) * easeInOut(k), y: a.y + (OC.y - a.y) * easeInOut(k) };
    dotOp = 1 - k * 0.8;
  }
  const absorbed = cycle + (ph >= 0.98 ? 1 : 0);
  const ring = 4 + Math.min(absorbed, 5) * 3;
  const core = spring(t, 0.2, 0.9);
  return (
    <>
      <Head k="다 · ⑤ AIEP를 공용 기반으로, 확장은 각 학교가" size={50} t={t}>
        공용 기반은 교육청이, 확장은 학교가
      </Head>
      <svg viewBox={`0 0 ${DW} ${DH}`} style={{ ...abs(0, 0, DW, DH), pointerEvents: 'none' }}>
        <ellipse cx={OC.x} cy={OC.y} rx={ORX} ry={ORY} fill="none" stroke={C.ink} strokeWidth={1.5} strokeDasharray="6 8" opacity={0.35} />
        <circle cx={OC.x} cy={OC.y} r={175 * core} fill={C.blueSoft} stroke={C.blue} strokeWidth={ring} />
        {ST_ANG.map((a, i) => {
          const p = orbitPt(a);
          const col = STATIONS[i].school ? C.green : C.blue;
          return <circle key={i} cx={p.x} cy={p.y} r={30} fill={C.white} stroke={col} strokeWidth={4} opacity={interpolate(t, [0.5 + i * 0.15, 0.9 + i * 0.15], [0, 1])} />;
        })}
        <circle cx={dot.x} cy={dot.y} r={12} fill={C.green} opacity={dotOp} />
      </svg>
      {/* 핵 라벨 */}
      <div style={{ ...abs(OC.x - 160, OC.y - 110, 320), textAlign: 'center', opacity: core }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.blue, letterSpacing: '0.06em' }}>공용 기반 · 교육청</div>
        <div style={{ fontFamily: serif, fontSize: 26, fontWeight: 700, color: C.ink, marginTop: 8, lineHeight: 1.4 }}>
          계정 · 학생 데이터
          <br />
          보안 · 공통 기능
        </div>
        <div style={{ fontSize: 16, color: 'var(--fg-muted)', marginTop: 8 }}>코드·문서·API를 학교에 공개</div>
      </div>
      {/* 정거장 */}
      {STATIONS.map((s, i) => {
        const p = orbitPt(ST_ANG[i]);
        const right = ST_ANG[i] > -90 && ST_ANG[i] < 90;
        const top = ST_ANG[i] < 0;
        const col = s.school ? C.green : C.blue;
        return (
          <div key={s.n}>
            <div style={{ ...abs(p.x - 30, p.y - 16, 60), textAlign: 'center', ...mono, fontSize: 22, color: col }}>{s.n}</div>
            <div
              style={{
                ...abs(right ? p.x + 44 : p.x - 44 - 300, p.y + (top ? -78 : 10), 300),
                textAlign: right ? 'left' : 'right',
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, color: col, letterSpacing: '0.04em' }}>{s.who}</div>
              <div style={{ fontSize: 25, fontWeight: 700, color: C.ink }}>{s.title}</div>
              <div style={{ fontSize: 17, color: 'var(--fg-muted)', marginTop: 4, opacity: c >= i + 1 ? 1 : 0, transition: 'opacity .45s', wordBreak: 'keep-all' }}>{s.desc}</div>
            </div>
          </div>
        );
      })}
      <div style={{ ...abs(120, 880, 880) }}>
        <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 700, color: C.green }}>학교별 맞춤형 AIEP 운영</div>
        <div style={{ ...small, marginTop: 4 }}>AIEP를 공개된 기반 시스템처럼 — 교육청은 계정·데이터·보안, 학교는 맞춤 확장</div>
      </div>
      <div style={{ ...abs(900, 890, 620), textAlign: 'right', fontSize: 19, color: C.ink }}>
        11개 교육청 공동 기반은 그대로, 특화서비스 예산 일부를 확장 환경에
      </div>
    </>
  );
}
function S18() {
  return (
    <Scene freezeAt={1.2 + PERIOD * 2 + 0.2}>
      <S18Scene />
    </Scene>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   19 — 성과지표를 바꾸자 (build · 두 계기판)
   ══════════════════════════════════════════════════════════════════════ */

function S19() {
  const c = useClicks(4);
  const GX = 390;
  const GY = 560;
  const GR = 210;
  const arc = (p: number) => {
    const a = Math.PI * (1 - p);
    return `M${GX - GR} ${GY} A${GR} ${GR} 0 0 1 ${GX + GR * Math.cos(a)} ${GY - GR * Math.sin(a)}`;
  };
  const BX = 900;
  const BMAX = 820;
  const mins = (m: number) => (BMAX * m) / 90;
  return (
    <>
      <Head k="다 · ⑤ · 성과지표">이용률이 아니라 교사 시간을 재자</Head>
      {/* 왼쪽 — 이용률 게이지 */}
      <div style={{ opacity: c >= 1 ? 0.75 : 0, transition: 'opacity .5s' }}>
        <svg viewBox={`0 0 ${DW} ${DH}`} style={{ ...abs(0, 0, DW, DH), pointerEvents: 'none' }}>
          <path d={arc(1)} fill="none" stroke={C.soft} strokeWidth={34} strokeLinecap="round" />
          <path d={arc(0.5)} fill="none" stroke="#9aa39d" strokeWidth={34} strokeLinecap="round" />
        </svg>
        <div style={{ ...abs(GX - 200, GY - 110, 400), textAlign: 'center' }}>
          <div style={{ ...mono, fontSize: 72, color: 'var(--fg-muted)' }}>50%</div>
          <div style={{ fontSize: 19, color: 'var(--fg-muted)' }}>지금의 목표 · 이용률</div>
        </div>
        <div style={{ ...abs(GX - 230, GY + 40, 460), textAlign: 'center', ...body, fontSize: 21 }}>가입은 늘어도, 쓰는지는 모른다</div>
      </div>

      {/* 오른쪽 — 교사 시간 */}
      <div style={{ ...abs(BX, 250, 900), opacity: c >= 2 ? 1 : 0, transition: 'opacity .5s' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.green, letterSpacing: '0.06em' }}>교사 시간 · 주당 수업 준비</div>
        {[
          ['AI 없이', 81.5, '#9aa39d'],
          ['안내서와 함께 ChatGPT', 56.2, C.green],
        ].map(([l, m, col]) => (
          <div key={l as string} style={{ marginTop: 26 }}>
            <div style={{ fontSize: 19, color: 'var(--fg-muted)' }}>{l}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
              <div style={{ height: 44, width: c >= 2 ? mins(m as number) : 0, background: col as string, borderRadius: '0 6px 6px 0', transition: 'width .9s cubic-bezier(.16,1,.3,1)' }} />
              <span style={{ ...mono, fontSize: 30, color: C.ink }}>{m}분</span>
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 30 }}>
          <span style={{ ...mono, fontSize: 64, color: C.green }}>−31%</span>
          <span style={{ fontSize: 19, color: 'var(--fg-muted)' }}>품질 차이 없음 · 영국 EEF 무작위 실험</span>
          <Flag>2차 보도</Flag>
        </div>
        <div style={{ ...small, marginTop: 8 }}>참고: 매주 쓰는 미국 교사 주당 5.9시간 절약(Gallup 2025) <Flag>자기보고</Flag></div>
      </div>

      <div style={{ ...abs(120, 700, 1680), display: 'flex', gap: 14, alignItems: 'center', opacity: c >= 3 ? 1 : 0, transition: 'opacity .5s' }}>
        <span style={{ fontSize: 19, color: 'var(--fg-muted)', marginRight: 6 }}>새 성과지표</span>
        {['교사 시간 절감', '실사용'].map((s) => (
          <span key={s} style={{ fontSize: 24, fontWeight: 700, padding: '10px 22px', borderRadius: 99, background: C.greenSoft, color: C.green }}>{s}</span>
        ))}
      </div>
      <div style={{ ...abs(120, 800, 1400), opacity: c >= 4 ? 1 : 0, transition: 'opacity .5s' }}>
        <Box tone="con" title='반론 "대구처럼 밀면 쓰인다"'>
          활용률을 올리는 데 든 지원·강제의 비용과, 교사노조 조사(88.4% 미사용)와의 괴리를 함께 본다
        </Box>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   17 — ⑥ 같은 자료는 한 번만 (scene · 요청서 세 장에 같은 도장)
   ══════════════════════════════════════════════════════════════════════ */

const SLIP_W = 250;
const SLIP_H = 320;
const SLIP_Y = 300;
const SLIPS = [820, 1160, 1500];
const PRESS = [2.1, 2.9, 3.7];
const MARK_Y = SLIP_Y + 190;

/** 고무 도장(assets/svg/rubber-stamp.svg)의 위치 — 세 번 찍는 순간에 누른다 (t-순수).
    반환값 top은 이미지 윗변. 인면은 이미지 위에서 141px 아래 */
function stampPose(t: number, xs: number[]) {
  const DOWN = MARK_Y - 141 + 4;
  const LIFT = DOWN - 70;
  let x = xs[0];
  for (let i = 1; i < xs.length; i++) {
    if (t >= PRESS[i - 1] + 0.3) x = interpolate(t, [PRESS[i - 1] + 0.3, PRESS[i] - 0.15], [xs[i - 1], xs[i]], easeInOut);
  }
  let top = LIFT;
  for (const pt of PRESS) {
    if (t >= pt - 0.15 && t < pt) top = interpolate(t, [pt - 0.15, pt], [LIFT, DOWN], easeInOut);
    else if (t >= pt && t < pt + 0.3) top = interpolate(t, [pt + 0.05, pt + 0.3], [DOWN, LIFT], easeOut);
  }
  const last = PRESS[PRESS.length - 1];
  const op = Math.min(interpolate(t, [1.6, 1.9], [0, 1]), interpolate(t, [last + 0.35, last + 0.7], [1, 0]));
  return { x, top, op };
}

function S20Scene() {
  const t = useSceneTime();
  const c = useClicks(1);
  const ORIG = { x: 120, y: 360, w: 330, h: 200 };
  const pose = stampPose(t, SLIPS);
  const back = interpolate(t, [4.3, 5.0], [0, 1], easeOut);
  return (
    <>
      <Head k="공통 · ⑥ 같은 자료는 한 번만" size={52} t={t}>
        같은 자료를, 또 한 번
      </Head>
      {/* 원본 — 이미 있는 자료 */}
      <div style={{ ...abs(ORIG.x, ORIG.y, ORIG.w, ORIG.h), border: `3px solid ${C.blue}`, borderRadius: 12, background: C.blueSoft, padding: '26px 28px', boxSizing: 'border-box', opacity: interpolate(t, [0.1, 0.5], [0, 1]) }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.blue, letterSpacing: '0.04em' }}>이미 있는 자료</div>
        <div style={{ fontFamily: serif, fontSize: 36, fontWeight: 700, color: C.ink, marginTop: 10, lineHeight: 1.25 }}>
          나이스
          <br />
          교육통계
        </div>
      </div>
      {/* 되돌아가는 점선 */}
      <svg viewBox={`0 0 ${DW} ${DH}`} style={{ ...abs(0, 0, DW, DH), pointerEvents: 'none' }}>
        {SLIPS.map((sx, i) => {
          const x0 = sx;
          const y0 = SLIP_Y + SLIP_H + 6;
          const x1 = ORIG.x + ORIG.w + 6;
          const y1 = ORIG.y + 120 + i * 28;
          const mx = (x0 + x1) / 2 + 60;
          const my = SLIP_Y + SLIP_H + 60 + i * 34;
          return (
            <g key={i} opacity={interpolate(back, [i * 0.2, i * 0.2 + 0.4], [0, 1])}>
              <path d={`M${x0} ${y0} Q${mx} ${my} ${x1} ${y1}`} fill="none" stroke={C.blue} strokeWidth={2} strokeDasharray="7 7" />
              <circle cx={x1} cy={y1} r={5} fill={C.blue} />
            </g>
          );
        })}
      </svg>
      {/* 요청서 세 장 */}
      {SLIPS.map((sx, i) => {
        const d = spring(t, 0.3 + i * 0.5, 0.8);
        const marked = t >= PRESS[i];
        const mk = spring(t, PRESS[i], 0.4);
        return (
          <div key={sx} style={{ ...abs(sx - SLIP_W / 2, SLIP_Y, SLIP_W, SLIP_H), transform: `translateY(${(1 - d) * -60}px) rotate(${(i - 1) * 2}deg)`, opacity: Math.min(1, d * 1.5), background: C.white, border: `1px solid ${C.line}`, borderRadius: 8, boxShadow: '0 16px 36px -24px rgba(22,32,27,.5)', padding: '20px 22px', boxSizing: 'border-box' }}>
            <div style={{ ...mono, fontSize: 16, color: 'var(--fg-faint)' }}>요청 {['①', '②', '③'][i]}</div>
            <div style={{ fontSize: 23, fontWeight: 700, color: C.ink, marginTop: 4 }}>○○ 현황 제출</div>
            {[0.85, 0.6, 0.75, 0.5].map((w, k) => (
              <div key={k} style={{ height: 9, width: `${w * 100}%`, background: C.soft, borderRadius: 4, marginTop: k === 0 ? 20 : 16 }} />
            ))}
            {marked && (
              <div
                style={{
                  position: 'absolute',
                  left: SLIP_W / 2 - 62,
                  top: MARK_Y - SLIP_Y - 8,
                  width: 124,
                  padding: '6px 0',
                  textAlign: 'center',
                  border: `3px solid ${C.amber}`,
                  borderRadius: 8,
                  color: C.amber,
                  fontSize: 26,
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  opacity: Math.min(1, mk * 2),
                  transform: `rotate(-8deg) scale(${1.3 - 0.3 * Math.min(1, mk)})`,
                }}
              >
                제출
              </div>
            )}
          </div>
        );
      })}
      <img src="assets/svg/rubber-stamp.svg" alt="" style={{ ...abs(pose.x - 55, pose.top, 110, 151), opacity: pose.op, zIndex: 5, pointerEvents: 'none' }} />
      <div style={{ ...abs(620, 226, 1180), textAlign: 'right', ...body, fontSize: 21, color: C.ink, opacity: interpolate(t, [4.6, 5.1], [0, 1]) }}>
        학교는 같은 자료를 여러 번 만들어 내고, 그 자료는 대부분 <b style={{ color: C.blue }}>이미 나이스·교육통계에</b> 있다
      </div>

      {/* 클릭 1 — 제안 */}
      <div style={{ ...abs(120, 820, 1400), opacity: c >= 1 ? 1 : 0, transform: `translateY(${c >= 1 ? 0 : 12}px)`, transition: 'all .5s cubic-bezier(.16,1,.3,1)' }}>
        <Box tone="pre" title="제안">
          나이스·교육통계에 있는 자료는 <b>교육청이 직접 추출</b> · 한 번 받은 자료는 <b>부서 간 공유</b> · <b>다시 묻지 않는다</b>
          <Src style={{ marginTop: 4 }}>선례: 경기도교육청 '학교자체계획수립 제로화'(공문을 만드는 부서가 먼저 점검) · 교육부 특교 사업 통폐합 166개 → 30개 내외(2023.9.)</Src>
        </Box>
      </div>
    </>
  );
}
function S20() {
  return (
    <Scene freezeAt={5.4}>
      <S20Scene />
    </Scene>
  );
}
/* ══════════════════════════════════════════════════════════════════════
   21·22 — 예상 반론과 대응 (build)
   ══════════════════════════════════════════════════════════════════════ */

const REB1: [string, string, boolean][] = [
  ['이미 전북 GPT와 AIEP Gemini를 준다', '좋은 시도다. 다만 월 사용량 제한과 한정된 계정 때문에 에이전트·개발에 한계가 있어, 범용 LLM 구독이 필요하다.', false],
  ['조건 없이 주면 안 쓰거나 효과가 없다', '그래서 과제 대신 업무별 안내를 준다. 공식 안내를 받은 교사 69% 대 51%(Gallup), EEF 실험도 안내서와 함께였다.', false],
  ['빅테크 유료 AI에 종속된다', '공공 보안 기준을 통과한 도구 중 교사가 고르는 이용권 + 공공 계정. 부산처럼 자체 서버로 정보를 보호한다.', false],
  ['의무를 진 학교가 성과가 더 좋다', '자기보고·비무작위 비교다. 의무를 없애는 것이 아니라 선택 과제로 돌리고, 성과는 교사 시간 절감으로 잰다.', false],
  ['교육부·KERIS 지침이라 교육청이 못 바꾼다', '교육청 자체 부과분부터 덜고, 국가 사업 조건은 교육부에 완화를 건의한다. 어느 조건이 누구 지침인지 원문 대조가 남아 있다.', false],
  ['기간제 정원을 줘도 교사를 못 뽑는다', '인정하는 한계다. 그래서 요건 완화와 함께, 채용 대행·순회교사 풀을 요청한다.', true],
];

function S21() {
  const c = useClicks(3);
  const asked = c === 0;
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: asked ? 160 : 120,
          top: asked ? 380 : 60,
          width: asked ? 1600 : 1680,
          textAlign: asked ? 'center' : 'left',
          transition: 'all .6s cubic-bezier(.16,1,.3,1)',
        }}
      >
        <div style={{ ...kick, color: asked ? C.green : 'var(--fg-faint)' }}>{asked ? '먼저 들려주십시오 · 라이브 문항' : '예상 반론과 대응 ① · 가 갈래'}</div>
        <h2 style={{ ...h1, fontSize: asked ? 60 : 46, marginTop: 14, transition: 'font-size .6s' }}>
          {asked ? '가장 먼저 떠오른 걱정이나 반론을 한 단어로' : '예상되는 반론에는 근거로, 한계는 먼저 인정한다'}
        </h2>
      </div>
      <div style={{ ...abs(120, 214, 1400), display: 'flex', flexDirection: 'column', gap: 14 }}>
        {REB1.map(([r, a, limit], i) => {
          const on = c >= Math.floor(i / 2) + 1;
          return (
            <div
              key={r}
              style={{
                display: 'grid',
                gridTemplateColumns: '480px 1fr',
                gap: 30,
                padding: '24px 28px',
                background: C.white,
                border: `1px solid ${limit ? C.amber : C.line}`,
                borderLeft: `4px solid ${C.amber}`,
                borderRadius: 8,
                opacity: on ? 1 : 0,
                transform: `translateY(${on ? 0 : 12}px)`,
                transition: 'all .45s cubic-bezier(.16,1,.3,1)',
              }}
            >
              <div style={{ fontSize: 27, fontWeight: 700, color: C.amber, wordBreak: 'keep-all' }}>"{r}"</div>
              <div style={{ fontSize: 23, lineHeight: 1.5, color: C.ink, wordBreak: 'keep-all' }}>
                {limit && <span style={{ fontSize: 15, fontWeight: 700, color: C.amber, marginRight: 8 }}>인정하는 한계</span>}
                {a}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

const REB2: [string, string, string, number][] = [
  ['나', '교사 제작 앱은 개인정보·보안 위험이 있다', '그래서 공공 기반이 필요하다. 개인 서버·무료 호스팅에 두는 지금이 더 위험하다. 교육청 검수(학습지원 SW 207개 검증 체계 확장).', 1],
  ['나', '교사가 만든 도구는 품질을 보장할 수 없다', '동료 검토와 교육청 검수를 둔다. 학급 단위 사용은 간소하게, 학교 밖 공유는 검수 후에.', 1],
  ['다', 'AIEP는 교육감 핵심과제다. 반대하는가', '반대가 아니라 보완이다. 인수위가 요구한 "AIEP와의 관계·차별성"(p.344)에 대한 답이다.', 2],
  ['다', '11개 교육청 공동 개발이라 전북 혼자 못 바꾼다', '공동 기반은 그대로 두고, 특화서비스 예산 일부만 학교 확장 환경에 쓴다. 소스 코드 권리 확인이 먼저다.', 2],
  ['다', '이미 현장 의견을 수렴해 개발한다', '의견 수렴은 업체가 고쳐 줄 때까지 기다리는 구조다. 학교가 직접 확장할 수 있어야 현장 속도가 난다.', 2],
  ['공통', '자료 요구는 각 부서의 정당한 업무다', '줄이자는 것은 요구가 아니라 중복이다.', 3],
];

function S22() {
  const c = useClicks(3);
  return (
    <>
      <Head k="예상 반론과 대응 ② · 나 · 다 · 공통" size={46}>
        위험과 품질의 걱정은, 교육청이 기반을 맡아야 하는 이유다
      </Head>
      <div style={{ ...abs(120, 250, 1400) }}>
        <div style={{ display: 'grid', gridTemplateColumns: '90px 520px 1fr', gap: 24, paddingBottom: 10, borderBottom: `2px solid ${C.ink}`, fontSize: 18, fontWeight: 700 }}>
          <span style={{ color: 'var(--fg-faint)' }}>갈래</span>
          <span style={{ color: C.blue }}>교육청이 할 수 있는 답</span>
          <span style={{ color: C.green }}>대응</span>
        </div>
        {REB2.map(([g, r, a, at]) => {
          const on = c >= at;
          return (
            <div key={r} style={{ display: 'grid', gridTemplateColumns: '90px 520px 1fr', gap: 24, padding: '26px 0', borderBottom: `1px solid ${C.line}`, alignItems: 'baseline', opacity: on ? 1 : 0.12, transition: 'opacity .45s' }}>
              <span style={{ ...mono, fontSize: 16, color: 'var(--fg-faint)' }}>{g}</span>
              <span style={{ fontSize: 25, fontWeight: 700, color: C.blue, wordBreak: 'keep-all' }}>{r}</span>
              <span style={{ fontSize: 22, lineHeight: 1.5, color: C.ink, wordBreak: 'keep-all' }}>{a}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   23 — 아직 확인할 것 (static)
   ══════════════════════════════════════════════════════════════════════ */

const GAPS: [string, boolean][] = [
  ['선도학교 각 의무가 교육부·KERIS 지침인지 전북 자체 부과인지', true],
  ['전북 GPT 이용률 · 만족도', true],
  ['전북 교원 수에 따른 이용권 총액 추산', true],
  ['매 학기 편성 요건에 온라인학교·공동교육과정 수강 인정 여부', true],
  ['진로선택 과목 상대평가 병기 방식 (교육부 세부 지침 원문)', false],
  ['AIEP 소스 코드·데이터 권리 (계약서·과업지시서)', true],
  ['AIEP 외부 연동(로그인·API) 기술 사양', true],
  ['AIEP 2026 시범 운영 실제 이용률', true],
];

function S23() {
  return (
    <>
      <Head k="남은 확인 · 인용 주의">아직 채울 빈칸, 대부분은 교육청 자료로 채워진다</Head>
      <div style={{ ...abs(120, 250, 1060) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 17, color: C.blue, fontWeight: 600 }}>
          <span style={{ width: 12, height: 12, borderRadius: 6, background: C.blue }} />
          교육청이 가진 자료로 채울 수 있음 (8개 중 7개)
        </div>
        <div style={{ marginTop: 18, display: 'grid', gap: 4 }}>
          {GAPS.map(([g, edu]) => (
            <div key={g} style={{ display: 'grid', gridTemplateColumns: '30px 22px 1fr', alignItems: 'center', gap: 12, padding: '13px 0', borderBottom: `1px solid ${C.line}` }}>
              <span style={{ width: 24, height: 24, border: `2px solid ${C.ink}`, borderRadius: 4, opacity: 0.6 }} />
              <span style={{ width: 12, height: 12, borderRadius: 6, background: edu ? C.blue : 'transparent', border: edu ? 'none' : `1.5px solid ${C.line}` }} />
              <span style={{ fontSize: 22, color: C.ink, wordBreak: 'keep-all' }}>{g}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...abs(1280, 250, 520) }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--fg-muted)', letterSpacing: '0.06em' }}>인용할 때 주의</div>
        <ol style={{ margin: '14px 0 0', paddingLeft: 22, display: 'grid', gap: 12, fontSize: 18, lineHeight: 1.5, color: 'var(--fg-muted)', wordBreak: 'keep-all' }}>
          <li>시간 절약 수치는 대부분 자기보고. 실험으로 잰 것은 EEF 31%뿐</li>
          <li>백서 예산표 불일치 3건: AI 연수 58,216 대 8,216 · 진로진학 플랫폼 51,600 대 1,600 · 미래인재트랙 22,654 대 11,761(백만 원)</li>
          <li>62.9%(전국 평가원)와 25~35%(경기 선도학교)는 출처가 다르다</li>
        </ol>
        <Term term="외부 연동" gloss="다른 서비스를 AIEP 계정으로 잇기" style={{ marginTop: 28 }} />
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   24 — 제안이 들어갈 자리 (scene · 166칸 정비판 + 퍼즐 조각)
   ══════════════════════════════════════════════════════════════════════ */

const G_COLS = 14;
const G_W = 58;
const G_H = 34;
const G_GAP = 8;
const G_X = (DW - (G_COLS * (G_W + G_GAP) - G_GAP)) / 2;
const G_Y = 190;
const HOLES = [
  { i: 5 * 14 + 5, label: '가', color: C.green, from: { x: -300, y: 300 } },
  { i: 5 * 14 + 6, label: '나', color: C.green, from: { x: -200, y: 900 } },
  { i: 5 * 14 + 7, label: '다', color: C.blue, from: { x: 2200, y: 250 } },
  { i: 5 * 14 + 8, label: '공통', color: C.ink, from: { x: 2100, y: 900 } },
];

/** 퍼즐 조각 — 추상 도형이므로 인라인 경로 (오른쪽 돌기 · 위 홈) */
function piecePath(w: number, h: number) {
  const k = h * 0.22;
  return `M0 0 H${w * 0.38} a${k} ${k} 0 0 0 ${w * 0.24} 0 H${w} V${h * 0.34} a${k} ${k} 0 0 1 0 ${h * 0.32} V${h} H0 Z`;
}

function S24Scene() {
  const t = useSceneTime();
  const c = useClicks(1);
  const holeSet = new Set(HOLES.map((h) => h.i));
  return (
    <>
      <div style={{ ...abs(0, 50, DW), textAlign: 'center', ...riseIn(t, 0.05) }}>
        <div style={kick}>정비 속 제안</div>
        <h2 style={{ ...h1, fontSize: 50, marginTop: 10 }}>새 사업이 아니라, 이미 시작된 정비 속 네 조각</h2>
      </div>
      {Array.from({ length: 166 }, (_, i) => {
        const col = i % G_COLS;
        const row = Math.floor(i / G_COLS);
        const x = G_X + col * (G_W + G_GAP);
        const y = G_Y + row * (G_H + G_GAP);
        if (holeSet.has(i))
          return <div key={i} style={{ ...abs(x, y, G_W, G_H), border: `1.5px dashed ${C.line}`, borderRadius: 4 }} />;
        const on = interpolate(t, [0.3 + i * 0.011, 0.5 + i * 0.011], [0, 1]);
        return <div key={i} style={{ ...abs(x, y, G_W, G_H), borderRadius: 4, background: `color-mix(in srgb, ${C.ink} ${Math.round(6 + on * 8)}%, ${C.paper})`, border: `1px solid ${C.line}` }} />;
      })}
      {HOLES.map((h, k) => {
        const col = h.i % G_COLS;
        const row = Math.floor(h.i / G_COLS);
        const tx = G_X + col * (G_W + G_GAP);
        const ty = G_Y + row * (G_H + G_GAP);
        const p = spring(t, 2.6 + k * 0.35, 1.0);
        const x = h.from.x + (tx - h.from.x) * p;
        const y = h.from.y + (ty - h.from.y) * p;
        return (
          <div key={h.label} style={{ ...abs(x, y, G_W + 14, G_H), transform: `rotate(${(1 - p) * (k % 2 ? 40 : -40)}deg)`, zIndex: 3 }}>
            <svg viewBox={`0 0 ${G_W + 14} ${G_H + 2}`} style={{ ...abs(0, -1, G_W + 14, G_H + 2), overflow: 'visible' }}>
              <path d={piecePath(G_W, G_H)} fill={h.color} />
            </svg>
            <div style={{ ...abs(0, 0, G_W, G_H), display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, fontSize: h.label.length > 1 ? 15 : 19, fontWeight: 700 }}>{h.label}</div>
          </div>
        );
      })}
      <div style={{ ...abs(0, G_Y + 12 * (G_H + G_GAP) + 4, DW), textAlign: 'center' }}>
        <Src>현장정책기획단 100명 · 166개 사업 의견 수렴과 정비 착수 · 뉴스핌 2026.9.14</Src>
      </div>
      <div style={{ ...abs(420, 740, 1080), opacity: interpolate(t, [4.4, 5.0], [0, 1]) }}>
        {[
          ['지원은', '사업이 아니라 교사의 기본 환경으로'],
          ['도구는', '교사가 만들고, 교육청이 받친다'],
          ['자료는', '한 번만'],
        ].map(([a, b]) => (
          <div key={a} style={{ fontFamily: serif, fontSize: 38, lineHeight: 1.55, color: C.ink }}>
            <span style={{ color: 'var(--fg-faint)' }}>{a}</span> {b}
          </div>
        ))}
        <div style={{ fontSize: 22, fontWeight: 700, color: C.green, marginTop: 14 }}>정비 과정에서 제안 ①~⑥을 검토해 주십시오.</div>
      </div>
      <div style={{ ...abs(1500, 380, 320), opacity: c >= 1 ? 1 : 0, transition: 'opacity .5s' }}>
        <div style={{ ...card, padding: '14px 18px', borderLeft: `4px solid ${C.green}` }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.green }}>라이브 문항</div>
          <div style={{ fontSize: 19, color: C.ink, marginTop: 4, wordBreak: 'keep-all' }}>여섯 제안 가운데 가장 먼저 실행해야 할 것은?</div>
        </div>
      </div>
    </>
  );
}
function S24() {
  return (
    <Scene freezeAt={6}>
      <S24Scene />
    </Scene>
  );
}

/* ── 덱 ─────────────────────────────────────────────────────────────── */

export default function TeacherCenteredAiDeck() {
  useDeckFonts();
  return (
    <Deck>
      <Page nav="표지" notes={NOTES[1]} pres={1}><S01 /></Page>
      <Page nav="선도학교 과제의 영수증" notes={NOTES[2]} pres={2}><S06 /></Page>
      <Page nav="제안 한 문장, 네 갈래" notes={NOTES[3]} pres={3}><S04 /></Page>
      <Page nav="이미 약속된 방향" notes={NOTES[4]} pres={4}><S05 /></Page>
      <Page nav="교사는 이미 쓰고, 이미 낸다" notes={NOTES[5]} pres={5}><S07 /></Page>
      <Page nav="지금 주어진 AI의 한계" notes={NOTES[6]} pres={6}><S08 /></Page>
      <Page nav="① 교원 AI 기본 이용권" notes={NOTES[7]} pres={7}><S09 /></Page>
      <Page nav="② 사업 과제 정비" notes={NOTES[8]} pres={8}><S10 /></Page>
      <Page nav="중점학교 매 학기 개설" notes={NOTES[9]} pres={9}><S11 /></Page>
      <Page nav="③ 요건 현실화와 교원 지원" notes={NOTES[10]} pres={10}><S12 /></Page>
      <Page nav="교사는 만들고, 공유는 활발하지 않다" notes={NOTES[11]} pres={11}><S13 /></Page>
      <Page nav="④ (가칭) 전북 에듀테크 깃허브" notes={NOTES[12]} pres={12}><S14 /></Page>
      <Page nav="큰 시스템들의 진열장" notes={NOTES[13]} pres={13}><S16 /></Page>
      <Page nav="AIEP는 지금" notes={NOTES[14]} pres={14}><S17 /></Page>
      <Page nav="⑤ AIEP 공용 기반" notes={NOTES[15]} pres={15}><S18 /></Page>
      <Page nav="성과지표를 바꾸자" notes={NOTES[16]} pres={16}><S19 /></Page>
      <Page nav="⑥ 같은 자료는 한 번만" notes={NOTES[17]} pres={17}><S20 /></Page>
      <Page nav="반론과 대응 ①" notes={NOTES[18]} pres={18}><S21 /></Page>
      <Page nav="반론과 대응 ②" notes={NOTES[19]} pres={19}><S22 /></Page>
      <Page nav="아직 확인할 것" notes={NOTES[20]} pres={20}><S23 /></Page>
      <Page nav="제안이 들어갈 자리" notes={NOTES[21]} pres={21}><S24 /></Page>
    </Deck>
  );
}
