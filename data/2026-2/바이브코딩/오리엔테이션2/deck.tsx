import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import Build from '../../../../src/deck/Build';
import Reveal from '../../../../src/deck/Reveal';
import { useDeck } from '../../../../src/deck/DeckContext';
import { Scene, useSceneTime, interpolate, spring, riseIn, easeOut, easeInOut } from '../../../../src/scene';

/* ── 바이브코딩 · 오리엔테이션2 (13장, 1차시 50분) ──────────────────────
   plan: data/2026-2/바이브코딩/오리엔테이션2/plan.md
   1 타자기 씬 → 2 반은 맞다(build+wordcloud) → 3 궤도 씬 → 4 세 관문(build)
   → 5 분기 트리 씬 → 6 큰 요청 vs 쪼갠 요청(static+choice) → 7 두 갈래(build)
   → 8 브레인스토밍 규칙(build) → 9 활동 링크·QR(static) → 10 세 약속(build)
   → 11 숫돌·화살촉 씬 → 12 여정 지도(build) → 13 별자리 씬(exit) */

const BASE = 'data/2026-2/바이브코딩/오리엔테이션2';
const COLLAB_URL = 'https://spacekijun.lovable.app/collab/28fa5003-3201-4d6f-aea9-eda51c1f6489';

const C = {
  amber: '#ffc454',
  rose: '#ff4d6d',
  mint: '#7ee0b8',
  sky: '#7cc4ff',
  ink: '#ffd9a8',
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

/* 절대배치 헬퍼 */
const abs = (x: number, y: number, w?: number, h?: number): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h });

/* 타이포 — 설계 박스 안에서는 vw 대신 px */
const kick: CSSProperties = { fontSize: 15, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--fg-faint)' };
const h1: CSSProperties = { fontFamily: 'var(--font-head)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.08, fontSize: 62, wordBreak: 'keep-all', margin: 0 };
const h2: CSSProperties = { ...h1, fontSize: 50 };
const body: CSSProperties = { fontSize: 23, lineHeight: 1.5, color: 'var(--fg-muted)', wordBreak: 'keep-all' };
const mono: CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };
const card: CSSProperties = { background: 'var(--surface)', border: '1px solid var(--hair)', borderRadius: 20, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' };
const accentText: CSSProperties = { background: 'var(--accent)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };

function LinkButton({ href, children, size = 22 }: { href: string; children: ReactNode; size?: number }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 12,
        padding: `${size * 0.6}px ${size * 1.3}px`, borderRadius: 999,
        background: 'var(--accent)', color: 'var(--accent-ink)', fontWeight: 800, fontSize: size,
        textDecoration: 'underline', textDecorationThickness: 2, textUnderlineOffset: 4,
        boxShadow: 'var(--glow)', wordBreak: 'keep-all',
      }}
    >
      {children}
    </a>
  );
}

/* ───────────────────────── S1 타자기 ───────────────────────── */
const PHRASE_A = '무엇을 만들까?';
const PHRASE_B = '무엇이 불편한가?';
function TypewriterScene() {
  const t = useSceneTime();
  const lenA = PHRASE_A.length, lenB = PHRASE_B.length;
  let text = '';
  let phase: 'a' | 'del' | 'b' = 'a';
  if (t < 3.2) {
    const n = Math.floor(interpolate(t, [0.6, 2.4], [0, lenA]));
    text = PHRASE_A.slice(0, n);
  } else if (t < 4.4) {
    phase = 'del';
    const n = Math.floor(interpolate(t, [3.2, 4.0], [lenA, 0]));
    text = PHRASE_A.slice(0, n);
  } else {
    phase = 'b';
    const n = Math.floor(interpolate(t, [4.4, 6.4], [0, lenB]));
    text = PHRASE_B.slice(0, n);
  }
  const done = phase === 'b' && text.length === lenB;
  const cursorOn = done ? (t * 1.6) % 1 < 0.55 : true;
  const head = done ? PHRASE_B.slice(0, 4) : text;
  const tail = done ? PHRASE_B.slice(4) : '';
  /* 키 입력마다 남는 옅은 잉크 점 — 좌표는 결정론 배열 */
  const dots = [
    [310, 250], [1610, 330], [420, 820], [1500, 760], [980, 200], [760, 900], [1240, 940], [1720, 560],
  ];
  return (
    <>
      {dots.map(([x, y], i) => (
        <div key={i} style={{ ...abs(x, y, 6, 6), borderRadius: 3, background: C.ink, opacity: interpolate(t, [0.8 + i * 0.6, 1.4 + i * 0.6], [0, 0.28]) }} />
      ))}
      <div style={{ ...abs(120, 110), ...kick, opacity: interpolate(t, [0, 0.5], [0, 1]) }}>바이브코딩 · 2026-2 · 오리엔테이션</div>
      <div style={{ ...abs(120, 380, 1680), fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 132, letterSpacing: '-0.04em', lineHeight: 1.05, whiteSpace: 'nowrap' }}>
        <span style={{ opacity: phase === 'del' ? 0.55 : 1 }}>{head}</span>
        <span style={done ? accentText : undefined}>{tail}</span>
        <span style={{ display: 'inline-block', width: 10, height: 118, marginLeft: 10, verticalAlign: '-8px', background: cursorOn ? 'var(--primary)' : 'transparent', borderRadius: 2 }} />
      </div>
      <div style={{ ...abs(120, 600, 1100), ...body, fontSize: 30, ...riseIn(t, 6.6) }}>
        내가 해결하고 싶은 문제를 찾고, AI와 함께 푼다.
      </div>
      <div style={{ ...abs(1300, 830, 500), ...card, padding: '22px 28px', transform: 'rotate(-2deg)', ...riseIn(t, 7.0) }}>
        <div style={{ ...kick, marginBottom: 8 }}>오늘 · 50분</div>
        <div style={{ fontSize: 26, fontWeight: 700 }}>핵심 활동 · <span style={accentText}>브레인스토밍</span></div>
      </div>
    </>
  );
}

/* ───────────────────────── S2 반은 맞다 ───────────────────────── */
function HalfRightSlide() {
  const { clicks } = useDeck();
  const dim = clicks >= 2 && clicks < 9999;
  const code = ['function addTodo(text) {', '  todos.push({ text, done: false });', '  render();', '}'];
  return (
    <>
      <div style={{ ...abs(110, 96), ...kick }}>첫인상 · 반은 맞다</div>
      {/* 왼쪽 6: 요리사 컴퓨터 + 프롬프트 → 코드 */}
      <img src="assets/svg/chef-computer.svg" alt="요리사 모자를 쓴 모니터가 파스타 접시를 내미는 손그림" style={{ ...abs(110, 170, 360), opacity: dim ? 0.45 : 1, transition: 'opacity .4s' }} />
      <div style={{ ...abs(500, 250, 520), ...card, padding: '18px 24px', borderTopLeftRadius: 4, fontSize: 24, fontWeight: 700, opacity: dim ? 0.45 : 1, transition: 'opacity .4s' }}>
        <span style={{ ...kick, display: 'block', marginBottom: 6 }}>주문</span>
        "할 일 앱 만들어줘"
      </div>
      <div style={{ ...abs(500, 400, 620), ...card, padding: '22px 26px', ...mono, fontSize: 21, lineHeight: 1.6, color: 'var(--fg-muted)', opacity: dim ? 0.45 : 1, transition: 'opacity .4s' }}>
        {code.map((l, i) => <div key={i}><span style={{ color: 'var(--fg-faint)', marginRight: 18 }}>{i + 1}</span>{l}</div>)}
      </div>
      <Build at={1} style={{ ...abs(980, 360), zIndex: 5 }}>
        <div style={{ padding: '10px 18px', borderRadius: 12, border: `3px solid ${C.mint}`, color: C.mint, fontWeight: 800, fontSize: 24, transform: 'rotate(-7deg)', background: 'rgba(18,16,14,0.7)' }}>
          ✓ 코드는 나온다
        </div>
      </Build>
      <div style={{ ...abs(500, 610, 600), ...body }}>
        말로 주문하면 코드가 나온다. 실제로 그렇다.
      </div>
      {/* 오른쪽 4 */}
      <div style={{ ...abs(1240, 250, 580) }}>
        <Reveal><h2 style={h1}>반은 맞다</h2></Reveal>
        <Reveal delay={0.1}><p style={{ ...body, marginTop: 18 }}>여기서 멈추면 남는 것은 "만들었는데 아무도 안 쓰는 것"이다.</p></Reveal>
      </div>
      <Build at={2} style={{ ...abs(1240, 520, 580) }}>
        <div style={{ ...card, padding: '30px 32px', border: '2px solid var(--primary)', boxShadow: 'var(--glow)' }}>
          <div style={{ fontSize: 84, fontWeight: 900, lineHeight: 1, ...accentText }}>?</div>
          <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.25, marginTop: 10, wordBreak: 'keep-all' }}>그래서, 그 코드는 <br />누구의 어떤 문제를 푸는가?</div>
        </div>
      </Build>
      <div style={{ ...abs(110, 960, 900), ...kick, color: 'var(--fg-faint)' }}>라이브 · 워드클라우드 "바이브코딩 하면 떠오르는 단어 하나" → 그다음 클릭</div>
    </>
  );
}

/* ───────────────────────── S3 궤도 ───────────────────────── */
const SATS = [
  { label: '코드 생성', r: 250, speed: 0.34, phase: 0.2, color: 'var(--primary)' },
  { label: '기획 문서', r: 330, speed: -0.22, phase: 1.5, color: C.amber },
  { label: '테스트', r: 300, speed: 0.27, phase: 2.9, color: C.sky },
  { label: '배포', r: 380, speed: 0.18, phase: 4.1, color: C.mint },
  { label: '질문하기', r: 350, speed: -0.25, phase: 5.2, color: C.rose },
  { label: '고쳐 쓰기', r: 280, speed: 0.3, phase: 3.6, color: C.ink },
];
function OrbitScene() {
  const t = useSceneTime();
  const cx = 660, cy = 560;
  const discS = spring(t, 1.1, 0.9);
  return (
    <>
      {/* 행성 + 궤도 — assets/svg/problem-planet-orbits.svg (viewBox가 덱 좌표 220,300 기준) */}
      <img src="assets/svg/problem-planet-orbits.svg" alt="" aria-hidden style={{ ...abs(220, 300, 880, 520), opacity: interpolate(t, [1.1, 2.4], [0, 1]), transform: `scale(${0.9 + 0.1 * discS})`, transformOrigin: `${cx - 220}px ${cy - 300}px` }} />
      {/* 중심 글자 — 행성 그림 위 */}
      <div style={{ ...abs(cx - 150, cy - 150, 300, 300), borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', transform: `scale(${discS})`, opacity: Math.min(1, discS), zIndex: 2, textShadow: '0 2px 18px rgba(18,16,14,0.9)' }}>
        <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.25, wordBreak: 'keep-all', padding: 30 }}>내가 해결하고<br />싶은 문제</div>
      </div>
      {/* 위성 — 코드 생성은 처음 크게 중앙에, 이후 궤도로 */}
      {SATS.map((s, i) => {
        const a = t * s.speed + s.phase;
        const ox = cx + Math.cos(a) * s.r;
        const oy = cy + Math.sin(a) * s.r * 0.56;
        const behind = Math.sin(a) < 0;
        if (i === 0) {
          const m = interpolate(t, [0.9, 2.0], [0, 1], easeInOut);
          const x = cx + (ox - cx) * m;
          const y = cy + (oy - cy) * m;
          const sc = 2.1 - 1.1 * m;
          return (
            <div key={i} style={{ ...abs(x, y), transform: `translate(-50%,-50%) scale(${sc * Math.min(1, spring(t, 0.1, 0.7))})`, zIndex: behind && m > 0.9 ? 1 : 3, padding: '12px 22px', borderRadius: 999, background: 'var(--surface-2)', border: `2px solid ${s.color}`, color: s.color, fontWeight: 800, fontSize: 22, whiteSpace: 'nowrap', boxShadow: `0 0 26px color-mix(in srgb, ${s.color} 30%, transparent)`, opacity: behind && m > 0.9 ? 0.55 : 1 }}>
              {s.label}
            </div>
          );
        }
        const sp = spring(t, 1.7 + i * 0.22, 0.8);
        return (
          <div key={i} style={{ ...abs(ox, oy), transform: `translate(-50%,-50%) scale(${sp})`, zIndex: behind ? 1 : 3, opacity: behind ? 0.55 : 1, padding: '12px 22px', borderRadius: 999, background: 'var(--surface-2)', border: `2px solid ${s.color}`, color: s.color, fontWeight: 800, fontSize: 22, whiteSpace: 'nowrap', boxShadow: `0 0 26px color-mix(in srgb, ${s.color} 24%, transparent)` }}>
            {s.label}
          </div>
        );
      })}
      {/* 오른쪽 텍스트 밴드 */}
      <div style={{ ...abs(1180, 110), ...kick }}>재정의</div>
      <div style={{ ...abs(1180, 300, 640) }}>
        <h2 style={{ ...h1, ...riseIn(t, 2.2) }}>코드는 위성,<br /><span style={accentText}>문제가 중심</span></h2>
        <div style={{ ...card, padding: '24px 28px', marginTop: 36, ...riseIn(t, 2.8) }}>
          <div style={{ ...kick, marginBottom: 8 }}>정의</div>
          <div style={{ fontSize: 27, fontWeight: 700, lineHeight: 1.4, wordBreak: 'keep-all' }}>바이브코딩 — AI와 대화하며 <span style={accentText}>문제를 해결하는</span> 도구</div>
        </div>
        <p style={{ ...body, marginTop: 26, ...riseIn(t, 3.3) }}>코드 생성만 떼어 내면 남는 것은 "동작하는 무언가"이지 "해결"이 아니다.</p>
      </div>
    </>
  );
}

/* ───────────────────────── S4 세 관문 ───────────────────────── */
const GATES = [
  { n: '01', title: '문제 제시', desc: '내가 해결하고 싶은 문제를 말로 꺼낸다. 크게 시작해도 된다.', x: 120, y: 420, w: 400, h: 330 },
  { n: '02', title: '핵심 문제 발견', desc: '작은 단위로 쪼개 "정확히 무엇이 막혀 있는가"를 찾는다.', x: 640, y: 350, w: 600, h: 470 },
  { n: '03', title: '바이브코딩으로 해결', desc: 'AI와 함께 도구를 만들어 실제로 푼다.', x: 1360, y: 420, w: 430, h: 330 },
];
function GatesSlide() {
  const { clicks } = useDeck();
  return (
    <>
      <div style={{ ...abs(120, 96), ...kick }}>이 수업이 하려는 것</div>
      <Reveal><h2 style={{ ...abs(120, 150, 1400), ...h1 }}>세 단계, <span style={accentText}>가치는 가운데에</span></h2></Reveal>
      <svg style={{ ...abs(0, 0, DW, DH) }} aria-hidden>
        <line x1={520} y1={585} x2={640} y2={585} stroke="var(--primary)" strokeWidth={4} strokeDasharray={120} strokeDashoffset={clicks >= 2 ? 0 : 120} style={{ transition: 'stroke-dashoffset .6s ease' }} />
        <line x1={1240} y1={585} x2={1360} y2={585} stroke="var(--primary)" strokeWidth={4} strokeDasharray={120} strokeDashoffset={clicks >= 3 ? 0 : 120} style={{ transition: 'stroke-dashoffset .6s ease' }} />
      </svg>
      {GATES.map((g, i) => (
        <Build key={i} at={i + 1} style={{ ...abs(g.x, g.y, g.w, g.h) }}>
          <div style={{ ...card, height: g.h, padding: i === 1 ? '36px 40px' : '28px 30px', border: i === 1 ? '2px solid var(--primary)' : card.border, boxShadow: i === 1 ? 'var(--glow)' : card.boxShadow, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', boxSizing: 'border-box', position: 'relative' }}>
            <div style={{ ...mono, position: 'absolute', top: 24, left: i === 1 ? 40 : 30, fontSize: i === 1 ? 48 : 34, fontWeight: 600, color: i === 1 ? 'var(--primary)' : 'var(--fg-faint)' }}>{g.n}</div>
            <div style={{ fontSize: i === 1 ? 44 : 32, fontWeight: 800, lineHeight: 1.15, wordBreak: 'keep-all' }}>{g.title}</div>
            <div style={{ ...body, fontSize: i === 1 ? 24 : 21, marginTop: 14 }}>{g.desc}</div>
          </div>
        </Build>
      ))}
      <Build at={2} style={{ ...abs(1040, 290), zIndex: 5 }}>
        <div style={{ padding: '10px 22px', borderRadius: 12, border: '3px solid var(--primary)', color: 'var(--primary)', fontWeight: 900, fontSize: 28, transform: 'rotate(-9deg)', background: 'rgba(18,16,14,0.8)', letterSpacing: '0.02em' }}>여기가 가치</div>
      </Build>
      <div style={{ ...abs(120, 930, 1600), ...body }}>세 단계 중 코딩은 마지막 하나다. 이 수업이 진짜 연습시키는 것은 두 번째, 쪼개서 발견하기다.</div>
    </>
  );
}

/* ───────────────────────── S5 분기 트리 ───────────────────────── */
type TNode = { id: string; x: number; y: number; w: number; h: number; label: string; at: number; core?: boolean };
const TN: TNode[] = [
  { id: 'root', x: 250, y: 300, w: 320, h: 70, label: '학교 생활이 불편하다', at: 0.3 },
  { id: 'a', x: 700, y: 160, w: 330, h: 64, label: '수행평가 일정을 놓친다', at: 1.2 },
  { id: 'b', x: 700, y: 420, w: 330, h: 64, label: '급식 확인이 귀찮다', at: 1.35 },
  { id: 'c', x: 700, y: 680, w: 330, h: 64, label: '동아리 공지가 흩어져 있다', at: 1.5 },
  { id: 'b1', x: 1150, y: 330, w: 380, h: 64, label: '알레르기 표시가 작아 안 보인다', at: 2.2 },
  { id: 'b2', x: 1150, y: 560, w: 380, h: 64, label: '메뉴 보려면 홈페이지에서 네 번 클릭', at: 2.4 },
  { id: 'core', x: 1180, y: 840, w: 470, h: 96, label: '오늘 급식을 한 번에, 알레르기 표시와 함께', at: 3.4, core: true },
];
function TreeScene() {
  const t = useSceneTime();
  const dimmed = interpolate(t, [3.6, 4.2], [1, 0.32]);
  const onPath = new Set(['root', 'b', 'b1', 'b2', 'core']);
  /* 가지 그림 — assets/svg/problem-tree.svg (viewBox가 덱 좌표 80,100 기준). 왼쪽에서 오른쪽으로 그려지듯 클립을 연다 */
  const grow = interpolate(t, [0.7, 3.3], [0, 1], easeInOut);
  return (
    <>
      <img src="assets/svg/problem-tree.svg" alt="" aria-hidden style={{ ...abs(80, 100, 1400, 760), clipPath: `inset(0 ${(1 - grow) * 100}% 0 0)`, opacity: 0.9 }} />
      {TN.map((n) => {
        const s = spring(t, n.at, 0.7);
        const hot = onPath.has(n.id);
        const lit = n.core && t >= n.at;
        return (
          <div key={n.id} style={{ ...abs(n.x - n.w / 2, n.y - n.h / 2, n.w, n.h), boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 16px', borderRadius: n.core ? 18 : 999, ...card, border: lit ? '2px solid var(--primary)' : card.border, background: lit ? 'rgba(255,122,69,0.16)' : card.background, boxShadow: lit ? '0 0 60px rgba(255,122,69,0.45)' : card.boxShadow, fontSize: n.core ? 26 : 21, fontWeight: n.core ? 800 : 600, wordBreak: 'keep-all', lineHeight: 1.2, transform: `scale(${s})`, opacity: Math.min(1, s * 1.3) * (hot ? 1 : dimmed), color: lit ? 'var(--fg)' : hot ? 'var(--fg)' : 'var(--fg-muted)' }}>
            {n.label}
          </div>
        );
      })}
      <div style={{ ...abs(940, 900), ...kick, color: 'var(--primary)', opacity: interpolate(t, [3.4, 3.9], [0, 1]) }}>핵심 문제</div>
      {/* 텍스트 밴드 — 트리 밴드(x≤1420)와 분리 */}
      <div style={{ ...abs(1470, 110), ...kick }}>문제 분해</div>
      <h2 style={{ ...abs(1470, 150, 420), ...h2 }}>쪼개면<br />보인다</h2>
      <div style={{ ...abs(1470, 330, 380), ...body, fontSize: 21 }}>큰 문제는 답이 없다. 쪼개 내려가면 손댈 수 있는 문제가 나타난다.</div>
      <Build at={1} style={{ ...abs(1470, 640, 400) }}>
        <div style={{ ...card, padding: '22px 26px', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>이 발견이 가치다</div>
          <div style={{ ...body, fontSize: 20 }}>여기서부터 AI에게 말할 수 있다.</div>
        </div>
      </Build>
    </>
  );
}

/* ───────────────────────── S6 큰 요청 vs 쪼갠 요청 ───────────────────────── */
function ContrastSlide() {
  const wire = ['로그인', '게시판', '알림', '설정', '프로필', '검색', '통계', '도움말'];
  return (
    <>
      <div style={{ ...abs(110, 90), ...kick }}>자주 하는 실수 · 요청의 크기</div>
      <Reveal><h2 style={{ ...abs(110, 140, 1500), ...h2 }}>같은 AI, 다른 결과</h2></Reveal>
      {/* 왼쪽 4: 큰 요청 (흐림) */}
      <div style={{ ...abs(110, 280, 620, 520), ...card, padding: 28, boxSizing: 'border-box', opacity: 0.62 }}>
        <div style={{ ...kick, marginBottom: 10 }}>큰 요청</div>
        <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 20 }}>"학교 앱 만들어줘"</div>
        <div style={{ border: '1px dashed var(--hair)', borderRadius: 12, padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {wire.map((w) => <div key={w} style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: 'var(--fg-faint)', fontSize: 18 }}>{w}</div>)}
        </div>
        <div style={{ ...body, fontSize: 21, marginTop: 22 }}>메뉴만 잔뜩 있는 빈 껍데기.<br /><b style={{ color: 'var(--fg)' }}>아무도 안 쓴다.</b></div>
      </div>
      {/* 오른쪽 6: 쪼갠 요청 (강조) */}
      <div style={{ ...abs(790, 250, 1020, 550), ...card, padding: 32, boxSizing: 'border-box', border: '2px solid var(--primary)', boxShadow: 'var(--glow)', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 28 }}>
        <div>
          <div style={{ ...kick, marginBottom: 10, color: 'var(--primary)' }}>쪼갠 요청</div>
          <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.3, wordBreak: 'keep-all' }}>"오늘 급식을 한 화면에, 알레르기 표시는 크게"</div>
          <div style={{ ...body, marginTop: 24 }}>한 화면짜리 도구.<br /><b style={{ color: 'var(--fg)' }}>매일 아침 쓴다.</b></div>
          <div style={{ marginTop: 34, ...body, fontSize: 20 }}>차이는 AI 실력이 아니라 <span style={{ ...accentText, fontWeight: 800 }}>문제의 크기</span>다.</div>
        </div>
        <div style={{ borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--hair)', padding: 22, alignSelf: 'start' }}>
          <div style={{ ...kick, fontSize: 13 }}>9월 8일 (월) 점심</div>
          <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
            {[['잡곡밥', ''], ['된장찌개', '대두'], ['닭갈비', '난류·밀'], ['배추김치', ''], ['요구르트', '우유']].map(([m, al]) => (
              <div key={m} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 21, fontWeight: 600 }}>
                <span>{m}</span>
                {al && <span style={{ fontSize: 15, fontWeight: 800, padding: '4px 10px', borderRadius: 999, background: C.rose, color: '#2a0a12' }}>{al}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ ...abs(110, 950, 1700), ...kick }}>라이브 · 객관식 "다음 중 핵심 문제에 가장 가까운 것은?"</div>
    </>
  );
}

/* ───────────────────────── S7 두 갈래 ───────────────────────── */
const DOOR_A = [['간호', '약 복용 시간표'], ['디자인', '색 조합 추천'], ['교사', '자리 배치 뽑기'], ['체육', '운동 기록표']];
const DOOR_B = ['단어 암기장', '시간표 + 준비물 알림', '급식 한 화면', '용돈 가계부'];
function DoorsSlide() {
  const doorStyle = (w: number, h: number, accent: boolean): CSSProperties => ({
    ...card, width: w, height: h, boxSizing: 'border-box', padding: '30px 32px', borderRadius: '140px 140px 20px 20px', border: accent ? '2px solid var(--primary)' : card.border, display: 'flex', flexDirection: 'column',
  });
  return (
    <>
      <div style={{ ...abs(120, 90), ...kick }}>문제는 어디서 오는가</div>
      <Reveal><h2 style={{ ...abs(120, 140, 1600), ...h2 }}>두 갈래, <span style={accentText}>둘 다 좋다</span></h2></Reveal>
      <Build at={1} style={{ ...abs(180, 280) }}>
        <div style={doorStyle(640, 620, true)}>
          <div style={{ ...kick, marginTop: 60, color: 'var(--primary)' }}>갈래 A</div>
          <div style={{ fontSize: 40, fontWeight: 800, margin: '8px 0 22px' }}>진로와 연결</div>
          <div style={{ display: 'grid', gap: 12 }}>
            {DOOR_A.map(([job, tool]) => (
              <div key={job} style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 23 }}>
                <span style={{ ...mono, fontSize: 17, padding: '4px 12px', borderRadius: 999, background: 'rgba(255,122,69,0.16)', color: 'var(--primary)', fontWeight: 700, minWidth: 70, textAlign: 'center' }}>{job}</span>
                <span>→ {tool}</span>
              </div>
            ))}
          </div>
        </div>
      </Build>
      <Build at={2} style={{ ...abs(940, 340) }}>
        <div style={doorStyle(560, 560, false)}>
          <div style={{ ...kick, marginTop: 50 }}>갈래 B</div>
          <div style={{ fontSize: 40, fontWeight: 800, margin: '8px 0 22px' }}>내게 필요한 도구</div>
          <div style={{ display: 'grid', gap: 12 }}>
            {DOOR_B.map((tool) => (
              <div key={tool} style={{ fontSize: 23, display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ width: 10, height: 10, borderRadius: 5, background: C.amber, display: 'inline-block' }} />{tool}
              </div>
            ))}
          </div>
        </div>
      </Build>
      <div style={{ ...abs(1560, 420, 280), ...body, fontSize: 21 }}>진로 고민이 아직 없어도 괜찮다. 매일 귀찮은 것 하나면 충분하다.</div>
      <Build at={3} style={{ ...abs(180, 940, 1400) }}>
        <div style={{ fontSize: 30, fontWeight: 800 }}>조건은 하나 — <span style={{ ...accentText }}>쓸 사람이 있는가?</span> <span style={{ ...body, fontSize: 24 }}>(나여도 된다)</span></div>
      </Build>
    </>
  );
}

/* ───────────────────────── S8 브레인스토밍 규칙 ───────────────────────── */
const RULES = [
  { n: '규칙 1', t: '양이 먼저', d: '좋은 아이디어 하나보다 후보 열 개.', w: 560 },
  { n: '규칙 2', t: '판단 보류', d: <>"<s>그건 안 돼</s>"는 오늘 금지. 대신 댓글로 얹는다.</>, w: 600 },
  { n: '규칙 3', t: '문장 틀', d: '이 틀에 들어가지 않으면 아직 문제가 아니다.', w: 640 },
];
function RulesSlide() {
  const { clicks } = useDeck();
  const filled = clicks >= 3;
  return (
    <>
      <div style={{ ...abs(110, 90), ...kick }}>브레인스토밍</div>
      <Reveal><h2 style={{ ...abs(110, 140, 900), ...h2 }}>판단은 나중에, 지금은 양</h2></Reveal>
      {RULES.map((r, i) => (
        <Build key={i} at={i + 1} style={{ ...abs(110, 300 + i * 190, r.w) }}>
          <div style={{ ...card, padding: '20px 26px', display: 'flex', gap: 20, alignItems: 'baseline' }}>
            <div style={{ ...kick, color: 'var(--primary)', whiteSpace: 'nowrap' }}>{r.n}</div>
            <div>
              <div style={{ fontSize: 30, fontWeight: 800 }}>{r.t}</div>
              <div style={{ ...body, fontSize: 20, marginTop: 4 }}>{r.d}</div>
            </div>
          </div>
        </Build>
      ))}
      {/* 오른쪽 문장 틀 */}
      <div style={{ ...abs(860, 300, 960) }}>
        <div style={{ ...kick, marginBottom: 20 }}>문장 틀</div>
        <div style={{ fontSize: 54, fontWeight: 800, lineHeight: 1.35, wordBreak: 'keep-all' }}>
          나는{' '}
          <span style={{ display: 'inline-block', minWidth: 300, borderBottom: '4px solid var(--primary)', color: filled ? 'var(--fg)' : 'transparent', textAlign: 'center', transition: 'color .5s' }}>{filled ? '아침에 급식을 확인' : '____'}</span>
          할 때{' '}
          <span style={{ display: 'inline-block', minWidth: 300, borderBottom: '4px solid var(--primary)', color: filled ? 'var(--fg)' : 'transparent', textAlign: 'center', transition: 'color .5s' }}>{filled ? '네 번 클릭하는 것' : '____'}</span>
          이 불편하다.
        </div>
        <Build at={3} style={{ marginTop: 40, display: 'grid', gap: 12 }}>
          {['나는 수행평가가 몰릴 때 마감을 놓치는 것이 불편하다.', '나는 영어 단어를 외울 때 틀린 것만 다시 볼 수 없는 것이 불편하다.'].map((s) => (
            <div key={s} style={{ ...card, padding: '14px 20px', fontSize: 22, color: 'var(--fg-muted)', borderLeft: `3px solid ${C.amber}` }}>{s}</div>
          ))}
        </Build>
      </div>
    </>
  );
}

/* ───────────────────────── S9 활동 ───────────────────────── */
const STEPS = [
  ['구글 계정으로 로그인', '학교 계정으로 들어간다.'],
  ['오늘 브레인스토밍 노트 만들기', '제목은 "날짜 · 반". 이미 있으면 그 노트로.'],
  ['댓글로 문제 후보 적기', '문장 틀 그대로: 나는 ___할 때 ___가 불편하다.'],
  ['다른 사람 댓글에 얹기', '"나도" 또는 덧붙일 아이디어를 답글로.'],
];
function ActivitySlide() {
  return (
    <>
      <div style={{ ...abs(110, 90), ...kick }}>활동 · 20분</div>
      <Reveal><h2 style={{ ...abs(110, 140, 1100), ...h2 }}>collab 노트에 <span style={accentText}>댓글로 남기기</span></h2></Reveal>
      <div style={{ ...abs(110, 300, 1020) }}>
        {STEPS.map(([t1, t2], i) => (
          <div key={i} style={{ display: 'flex', gap: 24, alignItems: 'flex-start', position: 'relative', paddingBottom: 30 }}>
            {i < STEPS.length - 1 && <div style={{ position: 'absolute', left: 27, top: 56, bottom: 0, width: 2, background: 'var(--hair)' }} />}
            <div style={{ ...mono, width: 56, height: 56, borderRadius: 28, border: '2px solid var(--primary)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, flexShrink: 0, background: 'var(--bg)' }}>{i + 1}</div>
            <div>
              <div style={{ fontSize: 30, fontWeight: 800 }}>{t1}</div>
              <div style={{ ...body, fontSize: 21, marginTop: 4 }}>{t2}</div>
            </div>
          </div>
        ))}
      </div>
      {/* 오른쪽 QR + 링크 */}
      <img src="assets/svg/idea-bulb.svg" alt="" aria-hidden style={{ ...abs(1290, 200, 120), opacity: 0.9 }} />
      <div style={{ ...abs(1380, 270, 360, 360), borderRadius: 24, background: '#fff', padding: 18, boxSizing: 'border-box', boxShadow: 'var(--glow)' }}>
        <img src={`${BASE}/images/collab-qr.png`} alt="collab 노트 QR" style={{ width: '100%', height: '100%', display: 'block' }} onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none'; }} />
      </div>
      <div style={{ ...abs(1300, 670, 520), textAlign: 'center' }}>
        <LinkButton href={COLLAB_URL} size={24}>collab 노트 열기 ↗</LinkButton>
        <div style={{ ...kick, marginTop: 14, fontSize: 13, textTransform: 'none', letterSpacing: 0 }}>spacekijun.lovable.app/collab/…</div>
      </div>
      <div style={{ ...abs(110, 950, 1700), ...card, padding: '16px 26px', display: 'flex', gap: 40, fontSize: 22, fontWeight: 700 }}>
        <span>⏱ 20분</span><span>목표 · 1인 <span style={accentText}>3개 이상</span></span><span style={{ color: 'var(--fg-muted)', fontWeight: 500 }}>문장 틀: 나는 ___할 때 ___가 불편하다</span>
      </div>
    </>
  );
}

/* ───────────────────────── S10 세 약속 ───────────────────────── */
function PromisesSlide() {
  return (
    <>
      <div style={{ ...abs(110, 90), ...kick }}>수업 진행 방식</div>
      <Reveal><h2 style={{ ...abs(110, 140, 1600), ...h2 }}>강의가 아니라 <span style={accentText}>행동</span></h2></Reveal>
      <Build at={2} style={{ ...abs(110, 300, 900) }}>
        <div style={{ ...card, height: 580, boxSizing: 'border-box', padding: '40px 44px', border: '2px solid var(--primary)', boxShadow: 'var(--glow)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ ...kick, color: 'var(--primary)' }}>약속 2</div>
            <div style={{ fontSize: 50, fontWeight: 800, lineHeight: 1.15, marginTop: 12, wordBreak: 'keep-all' }}>수업 시간은<br />주로 <span style={accentText}>질문하는 시간</span>이다</div>
            <div style={{ ...body, marginTop: 22 }}>막힌 곳을 들고 온다. 설명을 듣는 시간이 아니라 내 문제를 묻는 시간이다.</div>
          </div>
          <Build at={3}>
            <div style={{ ...body, fontSize: 19, color: 'var(--fg-faint)' }}>예: 쉬는 시간 · 점심시간 · 방과 후 정보실 — 언제든 찾아와도 된다</div>
          </Build>
        </div>
      </Build>
      <Build at={1} style={{ ...abs(1060, 300, 750) }}>
        <div style={{ ...card, padding: '28px 32px', height: 260, boxSizing: 'border-box' }}>
          <div style={kick}>약속 1</div>
          <div style={{ fontSize: 34, fontWeight: 800, marginTop: 10, lineHeight: 1.2, wordBreak: 'keep-all' }}>팁은 나눠 주지만,<br />만드는 것은 직접 한다</div>
          <div style={{ ...body, fontSize: 20, marginTop: 12 }}>바이브코딩 팁은 수업에서 드린다. 실제 제작은 여러분의 손이다.</div>
        </div>
      </Build>
      <Build at={3} style={{ ...abs(1060, 600, 750) }}>
        <div style={{ ...card, padding: '28px 32px', height: 280, boxSizing: 'border-box' }}>
          <div style={kick}>약속 3</div>
          <div style={{ fontSize: 34, fontWeight: 800, marginTop: 10, lineHeight: 1.2, wordBreak: 'keep-all' }}>질문은 수업 시간에만<br />하는 것이 아니다</div>
          <div style={{ ...body, fontSize: 20, marginTop: 12 }}>언제든 찾아와서 물어도 된다.</div>
        </div>
      </Build>
    </>
  );
}

/* ───────────────────────── S11 숫돌과 화살촉 ───────────────────────── */
const BUBBLES = [
  { atTry: 0, text: '"안 돼요"' },
  { atTry: 3, text: '"버튼을 누르면 화면이 하얘져요"' },
  { atTry: 7, text: '"저장 버튼을 누르면 콘솔에 undefined 오류가 나고, 이름 칸을 비우면 안 나요"' },
];
function WhetstoneScene() {
  const t = useSceneTime();
  const tries = Math.min(7, Math.max(0, Math.floor((t - 0.6) / 0.5) + 1));
  const sharp = interpolate(t, [0.6, 3.6], [0, 1]);
  const grinding = t > 0.6 && t < 3.7;
  const done = t >= 4.2;
  /* 화살촉 폴리곤: 뭉툭(사다리꼴) → 뾰족(삼각) — 점 좌표 보간 */
  const ax = 1400, ay = 612;
  const blunt = [[0, -40], [110, -40], [140, -18], [140, 18], [110, 40], [0, 40]];
  const sharpPts = [[0, -40], [60, -34], [210, -3], [210, 3], [60, 34], [0, 40]];
  const pts = blunt.map(([bx, by], i) => [bx + (sharpPts[i][0] - bx) * sharp, by + (sharpPts[i][1] - by) * sharp]);
  const bubble = BUBBLES.filter((b) => tries >= b.atTry).slice(-1)[0];
  const bubbleKey = bubble.atTry;
  /* 시도 n회가 켜지는 시각: 0회 → 0s, 3회 → 1.6s, 7회 → 3.6s */
  const BUBBLE_AT: Record<number, number> = { 0: 0, 3: 1.6, 7: 3.6 };
  const bubbleIn = spring(t, BUBBLE_AT[bubbleKey], 0.6);
  /* 불꽃 — t의 결정론 함수(각도·반지름을 정수 인덱스와 t로 계산) */
  const sparks = Array.from({ length: 9 }).map((_, i) => {
    const ph = (t * 6 + i * 0.7) % 1;
    const ang = -0.2 - i * 0.35;
    const r = 18 + ph * 70;
    return { x: ax + 150 + Math.cos(ang) * r, y: ay + 8 + Math.sin(ang) * r * 0.6 + ph * 20, o: (1 - ph) * (grinding ? 0.9 : 0), s: 3 + (i % 3) };
  });
  return (
    <>
      <div style={{ ...abs(120, 90), ...kick }}>질문의 질</div>
      <h2 style={{ ...abs(120, 140, 1400), ...h2 }}>좋은 질문은 <span style={accentText}>시도에서</span> 나온다</h2>
      {/* 왼쪽: 시도 횟수 카운터 */}
      <div style={{ ...abs(140, 330) }}>
        <div style={{ ...kick, color: 'var(--fg-muted)' }}>시도 횟수</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <div style={{ ...mono, fontSize: 200, fontWeight: 600, lineHeight: 1, letterSpacing: '-0.06em', color: done ? 'var(--primary)' : 'var(--fg)', transition: 'color .4s' }}>{tries}</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: 'var(--fg-muted)' }}>번</div>
        </div>
      </div>
      {/* 숫돌 + 화살대 — assets/svg/arrow-on-whetstone.svg (viewBox가 덱 좌표 110,560 기준 · 화살촉은 아래 폴리곤) */}
      <img src="assets/svg/arrow-on-whetstone.svg" alt="" aria-hidden style={{ ...abs(110, 560, 1700, 220) }} />
      {/* 갈린 자국 — 시도마다 하나씩, 숫돌 표면 위 */}
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} style={{ ...abs(1200 + i * 44, 674, 3, 62), borderRadius: 2, background: i < tries ? 'var(--primary)' : 'transparent', boxShadow: i < tries ? '0 0 10px var(--primary)' : 'none', transform: 'skewX(-18deg)' }} />
      ))}
      <div style={{ ...abs(150, 775), ...kick }}>숫돌</div>
      {/* 화살촉 + 불꽃 */}
      <svg style={{ ...abs(0, 0, DW, DH), overflow: 'visible' }} aria-hidden>
        <polygon points={pts.map(([x, y]) => `${ax + x},${ay + y}`).join(' ')} fill={done ? 'var(--primary)' : C.ink} stroke={done ? C.amber : 'none'} strokeWidth={3} style={{ filter: done ? 'drop-shadow(0 0 22px rgba(255,122,69,0.9))' : 'none', transition: 'fill .4s' }} />
        {sparks.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.s} fill={C.amber} opacity={s.o} />)}
      </svg>
      {/* 말풍선 — 화살 위 */}
      <div key={bubbleKey} style={{ ...abs(760, 330, 760), ...card, padding: '18px 26px', borderBottomLeftRadius: 4, fontSize: bubbleKey === 7 ? 24 : 30, fontWeight: 700, lineHeight: 1.35, wordBreak: 'keep-all', color: bubbleKey === 7 ? 'var(--fg)' : 'var(--fg-muted)', transform: `translateY(${(1 - bubbleIn) * 14}px)`, opacity: Math.min(1, bubbleIn * 1.4) }}>
        <span style={{ ...kick, display: 'block', marginBottom: 6, color: 'var(--primary)' }}>시도 {bubbleKey}회 뒤의 질문</span>
        {bubble.text}
      </div>
      <div style={{ ...abs(1400, 800, 420), ...card, padding: '18px 22px', borderLeft: '4px solid var(--primary)', opacity: interpolate(t, [4.4, 5.0], [0, 1]) }}>
        <div style={{ fontSize: 24, fontWeight: 800 }}>답이 반쯤 들어 있는 질문</div>
        <div style={{ ...body, fontSize: 19, marginTop: 6 }}>먼저 해 보고, 막힌 지점을 들고 온다.</div>
      </div>
    </>
  );
}

/* ───────────────────────── S12 여정 지도 ───────────────────────── */
const STATIONS = [
  { x: 300, y: 860, n: '01', t: '바이브코딩 프로그램 설치', d: '내 컴퓨터에 도구를 갖춘다.' },
  { x: 980, y: 620, n: '02', t: 'AI 에이전트 사용 방법', d: '말로 시키고, 결과를 확인하고, 고친다.' },
  { x: 1620, y: 300, n: '03', t: 'AI로 프로젝트 기획 문서 쓰기', d: '오늘의 문제 후보가 여기서 쓰인다.' },
];
function JourneySlide() {
  const { clicks } = useDeck();
  /* 길이 드러나는 오른쪽 경계(덱 x 좌표): 클릭마다 다음 정거장까지 */
  const revealX = clicks >= 3 ? 1700 : clicks >= 2 ? 1010 : clicks >= 1 ? 340 : 200;
  const clip = `inset(0 ${((1700 - revealX) / 1500) * 100}% 0 0)`;
  return (
    <>
      <div style={{ ...abs(120, 90), ...kick }}>다음 시간</div>
      <Reveal><h2 style={{ ...abs(120, 140, 900), ...h2 }}>다음 시간, <span style={accentText}>세 정거장</span></h2></Reveal>
      {/* 길 — assets/svg/journey-road.svg (viewBox가 덱 좌표 200,240 기준). 흐린 전체 길 위에 클릭마다 밝은 길이 드러난다 */}
      <img src="assets/svg/journey-road.svg" alt="" aria-hidden style={{ ...abs(200, 240, 1500, 700), opacity: 0.22 }} />
      <img src="assets/svg/journey-road.svg" alt="" aria-hidden style={{ ...abs(200, 240, 1500, 700), clipPath: clip, transition: 'clip-path .7s ease', filter: 'drop-shadow(0 0 10px rgba(255,122,69,0.55))' }} />
      {STATIONS.map((s, i) => (
        <Build key={i} at={i + 1} style={{ ...abs(s.x - 36, s.y - 36) }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 72, height: 72, borderRadius: 36, background: 'var(--bg)', border: '3px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', ...mono, fontSize: 24, fontWeight: 700, color: 'var(--primary)', boxShadow: '0 0 30px rgba(255,122,69,0.4)' }}>{s.n}</div>
            <div style={{ position: 'absolute', left: i === 2 ? -560 : 96, top: i === 2 ? -30 : i === 0 ? 10 : 90, width: i === 2 ? 500 : 440, textAlign: i === 2 ? 'right' : 'left' }}>
              <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.2, wordBreak: 'keep-all' }}>{s.t}</div>
              <div style={{ ...body, fontSize: 20, marginTop: 6 }}>{s.d}</div>
            </div>
          </div>
        </Build>
      ))}
      <Build at={3} style={{ ...abs(1400, 760, 400) }}>
        <div style={{ ...card, padding: '16px 22px', borderLeft: '4px solid var(--primary)', fontSize: 22, fontWeight: 700, wordBreak: 'keep-all' }}>오늘의 댓글이 정거장 03에서 쓰인다</div>
      </Build>
      <div style={{ ...abs(1200, 920), display: 'flex', gap: 14, alignItems: 'center' }}>
        <span style={kick}>준비물</span>
        {['오늘 남긴 문제 후보', '구글 계정'].map((p) => <span key={p} style={{ padding: '8px 18px', borderRadius: 999, border: '1px solid var(--hair)', background: 'var(--surface)', fontSize: 20, fontWeight: 600 }}>{p}</span>)}
      </div>
    </>
  );
}

/* ───────────────────────── S13 별자리 ───────────────────────── */
const STARS = [
  [260, 300], [480, 180], [700, 360], [880, 150], [1080, 300], [1300, 200], [1520, 330], [1700, 180],
  [400, 520], [960, 560], [1400, 540], [1650, 500],
];
const STAR_LABELS: Record<number, string> = { 2: '급식 한 화면', 5: '마감 알림', 10: '틀린 단어만' };
function ConstellationScene() {
  const t = useSceneTime();
  /* 별 사이 선 — assets/svg/idea-constellation.svg (viewBox가 덱 좌표 180,100 기준). 별이 다 뜬 뒤 왼쪽에서 오른쪽으로 이어진다 */
  const link = interpolate(t, [2.8, 5.2], [0, 1], easeOut);
  return (
    <>
      <img src="assets/svg/idea-constellation.svg" alt="" aria-hidden style={{ ...abs(180, 100, 1580, 500), clipPath: `inset(0 ${(1 - link) * 100}% 0 0)`, opacity: 0.9 }} />
      <svg style={{ ...abs(0, 0, DW, DH) }} aria-hidden>
        {STARS.map(([x, y], i) => {
          const s = spring(t, 0.3 + i * 0.19, 0.6);
          const twinkle = 0.8 + 0.2 * Math.sin(t * 2.2 + i);
          return (
            <g key={i} transform={`translate(${x},${y}) scale(${s})`} opacity={Math.min(1, s * 1.4) * twinkle}>
              <circle r={8} fill={C.amber} style={{ filter: 'drop-shadow(0 0 10px rgba(255,196,84,0.9))' }} />
              <circle r={3} fill="#fff" />
            </g>
          );
        })}
      </svg>
      {Object.entries(STAR_LABELS).map(([i, label]) => {
        const [x, y] = STARS[Number(i)];
        return <div key={i} style={{ ...abs(x + 18, y - 40), ...kick, fontSize: 14, color: C.amber, textTransform: 'none', letterSpacing: 0, opacity: interpolate(t, [3.6, 4.2], [0, 1]) }}>{label}</div>;
      })}
      <div style={{ ...abs(120, 90), ...kick }}>마무리</div>
      <div style={{ ...abs(0, 700, DW), textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 60, letterSpacing: '-0.03em', lineHeight: 1.2, ...riseIn(t, 4.6) }}>코드는 AI가 쓴다.</div>
        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 60, letterSpacing: '-0.03em', lineHeight: 1.2, ...riseIn(t, 5.0) }}>문제는 <span style={accentText}>여러분</span>이 찾는다.</div>
        <div style={{ marginTop: 40, ...riseIn(t, 5.4) }}>
          <LinkButton href={COLLAB_URL} size={20}>collab 노트 · 수업 후에도 댓글 추가 ↗</LinkButton>
          <div style={{ ...kick, marginTop: 16 }}>질문은 언제든 · 정보실</div>
        </div>
      </div>
    </>
  );
}

/* ───────────────────────── 덱 ───────────────────────── */
export default function VibeCodingOrientation2Deck() {
  return (
    <Deck>
      <Slide full nav="표지" notes="코딩 수업이라고 들어왔죠? 첫 질문을 바꾸는 것부터 시작하겠습니다. '무엇을 만들까'가 아니라 '무엇이 불편한가'입니다.">
        <Fit><Scene duration={8}><TypewriterScene /></Scene></Fit>
      </Slide>
      <Slide full nav="반은 맞다" notes="워드클라우드 먼저(첫인상) → '맞습니다, 코드는 나옵니다'(클릭 1) → '그런데 이 앱을 누가 쓰나요?'(클릭 2). 오해를 부정하지 말고 절반의 진실로 인정한 뒤 확장한다.">
        <Fit><HalfRightSlide /></Fit>
      </Slide>
      <Slide full nav="문제가 중심" notes="코드 생성은 이 궤도의 위성 하나입니다. 중심에 문제가 없으면 위성은 그냥 떠돌아요. 바이브코딩의 정의: AI와 대화하며 문제를 해결하는 도구.">
        <Fit><Scene><OrbitScene /></Scene></Fit>
      </Slide>
      <Slide full nav="세 단계" notes="코딩 수업인데 세 단계 중 코딩은 마지막 하나입니다. 이 수업이 진짜 연습시키는 것은 두 번째, 쪼개서 발견하기입니다.">
        <Fit><GatesSlide /></Fit>
      </Slide>
      <Slide full nav="쪼개면 보인다" notes="'학교 생활이 불편하다'로는 AI도 아무것도 못 만듭니다. 세 번 쪼개니 '오늘 급식을 한 번에 보여 주기'가 나왔죠. 이게 프로젝트가 됩니다. 클릭 1: 이 발견이 가치다.">
        <Fit><Scene duration={5}><TreeScene /></Scene></Fit>
      </Slide>
      <Slide full nav="요청의 크기" notes="화면 설명 → 라이브 객관식 제출 → 분포 공개 → '1번을 고른 사람, 2번과 뭐가 다른지 말해 볼까요?' → 정답 공개(2번: 네 번 클릭).">
        <Fit><ContrastSlide /></Fit>
      </Slide>
      <Slide full nav="두 갈래" notes="진로 고민이 아직 없어도 괜찮습니다. 내가 매일 귀찮은 것 하나면 충분해요. 조건은 하나, 쓸 사람이 있는가. 나여도 됩니다.">
        <Fit><DoorsSlide /></Fit>
      </Slide>
      <Slide full nav="브레인스토밍 규칙" notes="문장 틀에 안 들어가면 아직 문제가 아닙니다. '앱 만들고 싶다'는 문제가 아니에요. 클릭 3에서 빈칸이 예시로 채워진다.">
        <Fit><RulesSlide /></Fit>
      </Slide>
      <Slide full nav="활동 · collab" notes="지금부터 20분. 로그인이 안 되면 손 드세요. 댓글은 3개 이상, 남의 댓글에 얹는 것도 하나로 칩니다. 이 화면을 띄운 채 진행.">
        <Fit><ActivitySlide /></Fit>
      </Slide>
      <Slide full nav="세 약속" notes="제가 팁을 드리긴 할 겁니다. 그런데 만드는 건 여러분입니다. 수업 시간은 제가 설명하는 시간이 아니라 여러분이 질문하는 시간이에요. 질문은 수업 밖에서도 언제든.">
        <Fit><PromisesSlide /></Fit>
      </Slide>
      <Slide full nav="좋은 질문" notes="'안 돼요'는 질문이 아닙니다. 일곱 번 해 본 사람의 질문에는 답이 반쯤 들어 있어요. 그래서 수업 시간에 시도할 시간을 줍니다.">
        <Fit><Scene duration={5.5}><WhetstoneScene /></Scene></Fit>
      </Slide>
      <Slide full nav="다음 시간" notes="다음 시간엔 손을 움직입니다. 설치, 에이전트, 그리고 기획 문서. 오늘 남긴 댓글을 가져오세요.">
        <Fit><JourneySlide /></Fit>
      </Slide>
      <Slide full nav="마무리" notes="오늘 남긴 댓글이 별입니다. 다음 시간에 그 별을 이어서 별자리로 만듭니다. 나가기 전에 출구티켓 한 줄만 적어 주세요.">
        <Fit><Scene duration={6.5}><ConstellationScene /></Scene></Fit>
      </Slide>
    </Deck>
  );
}
