import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import Build from '../../../../src/deck/Build';
import Reveal from '../../../../src/deck/Reveal';
import { useDeck } from '../../../../src/deck/DeckContext';
import { Scene, useSceneTime, interpolate, spring, riseIn, easeOut, easeInOut } from '../../../../src/scene';
import { AppWindow, Pointer, Caret, typed, typedDoneAt, clickFlash, popIn, dimAfter, type CursorKey } from '../../../../src/walkthrough';

/* ── 인공지능 기초 · 2026-2 — 인공지능은 어떻게 배울까 (20장, 100분, 차례대로) ─────
   plan: data/2026-2/인공지능기초/인공지능은-어떻게-배울까/plan.md
   흐름: 자라는 뉴런 가지(scene) → 한 단어로(live 워드클라우드) → 학자 갤러리(build)
        → 고도계 능선(scene) → 도구에서 에이전트로(build) → 실험 노트(image)
        → 규칙 두루마리(build) → 뉴런 위 퍼셉트론(scene) → 지층 연표(scene) → 세 시대(static)
        → 세 갈래(build) → 두 책상의 사진 더미(scene) → 게임 무대+학습 곡선(scene)
        → 초파리 커넥톰(build+영상) → 세 서랍(static+live) → Teachable Machine 원리(static)
        → 절차 ①(walkthrough 릴레이) → 절차 ②(walkthrough 왕복) → 실습(activity) → 열매 넷(static+exit)
   테마: 크림 종이 + 딥 그린 + 앰버 — 시각 언어는 "연결선"(뉴런 가지·퍼셉트론 입력선·커넥톰 배선).
   덱 화면에는 차시·부 구분 표기를 넣지 않는다(사용자 결정 2026-09-14). */

const BASE = 'data/2026-2/인공지능기초/인공지능은-어떻게-배울까';
const SITE = 'https://2026kijunit.netlify.app';
const SPR = '/assets/sprites/ai-how-to-learn';
const ACTIVITY_PATH = `/${BASE}/활동지.html`;
const DATASET_PATH = `/${BASE}/dataset/치와와-머핀.zip`;
const DATASET_DIR = `/${BASE}/dataset/치와와-머핀`;
const TM_URL = 'https://teachablemachine.withgoogle.com/train';
const GOOGLE_BLOG = 'https://research.google/blog/a-connectomics-milestone-mapping-the-complete-male-fruit-fly-brain/';
const CNS_URL = 'https://male-cns.janelia.org/';
const FLY_CODE = 'https://github.com/ornata/fly';
const FLY_MC = 'https://www.youtube.com/embed/BUkLWjcoBc0';               // 마인크래프트 시연 (Ro0oney, 2026-09-07)
const FLY_SHORT = 'https://www.youtube.com/embed/HD9cDLgSe-o';
const GO_RECORD = '/data/2026-2/인공지능기초/오리엔테이션/images/alphago-game4.jpg';   // CC BY-SA 4.0 · Wesalius · Wikimedia Commons

const C = { green: '#1e7a55', amber: '#e0a52a', ink: '#1d2a26', cream: '#f4efe4', paper: '#fbf8f1', moss: '#6f9b7f', ice: '#d3e4ec', sand: '#c9b995', red: '#c8442a', leaf: '#8fc4a4' };

/* ── Fit — 1920×1080 설계 박스 배율 변환 (4K·울트라와이드에서도 같은 구도) ── */
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
const kw: CSSProperties = { wordBreak: 'keep-all' };
const kick: CSSProperties = { fontSize: 15, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.green, ...kw };
const h1: CSSProperties = { fontFamily: 'var(--font-head)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, fontSize: 60, margin: 0, color: C.ink, ...kw };
const h2: CSSProperties = { ...h1, fontSize: 46 };
const body: CSSProperties = { fontSize: 22, lineHeight: 1.5, color: 'var(--fg-muted)', ...kw };
const mono: CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };
const card: CSSProperties = { background: 'rgba(255,255,255,0.72)', border: '1px solid var(--hair)', borderRadius: 18, boxShadow: '0 14px 34px -26px rgba(29,42,38,0.45)', boxSizing: 'border-box' };
const accentText: CSSProperties = { color: C.green };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
function mulberry32(a: number) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function LinkButton({ href, children, size = 22, sub, tone = C.green, outline }: { href: string; children: ReactNode; size?: number; sub?: string; tone?: string; outline?: boolean }) {
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 6 }}>
      <a href={href} target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: `${size * 0.55}px ${size * 1.2}px`, borderRadius: 999, background: outline ? 'transparent' : tone, color: outline ? tone : '#fff', border: `2px solid ${tone}`, fontWeight: 800, fontSize: size, whiteSpace: 'nowrap', textDecoration: 'underline', textDecorationThickness: 2, textUnderlineOffset: 4, boxShadow: outline ? 'none' : '0 16px 40px -22px rgba(30,122,85,0.6)', ...kw }}>{children} ↗</a>
      {sub && <div style={{ ...mono, fontSize: 13, color: 'var(--fg-faint)' }}>{sub}</div>}
    </div>
  );
}
function LinkPill({ href, label }: { href: string; label: string }) {
  return <a href={href} target="_blank" rel="noopener" style={{ color: C.green, fontWeight: 800, fontSize: 15, textDecoration: 'underline', textUnderlineOffset: 4, ...kw }}>{label} ↗</a>;
}
/** 라이브 문항 배지 — 이 슬라이드를 띄운 채 라이브 퀴즈를 진행한다 */
function LiveTag({ kind, text, style }: { kind: string; text: string; style?: CSSProperties }) {
  return (
    <div style={{ ...card, display: 'inline-flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderColor: `${C.amber}88`, background: `${C.amber}1a`, ...style }}>
      <span style={{ ...mono, fontSize: 12.5, fontWeight: 800, color: '#9a6d0f', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>LIVE · {kind}</span>
      <span style={{ fontWeight: 700, fontSize: 17, color: C.ink, ...kw }}>{text}</span>
    </div>
  );
}
/** 생성 스프라이트 — 파일이 없으면 라벨 칩으로 대신한다 (저작 중 자산이 늦게 도착해도 레이아웃이 깨지지 않게) */
function Sprite({ src, alt, style, fit = 'contain' }: { src: string; alt: string; style: CSSProperties; fit?: 'contain' | 'cover' }) {
  const [missing, setMissing] = useState(false);
  if (missing) return <div style={{ ...style, display: 'grid', placeItems: 'center', borderRadius: 12, border: `1.5px dashed ${C.moss}`, color: C.moss, fontSize: 14, textAlign: 'center', padding: 8, boxSizing: 'border-box', ...kw }}>{alt}</div>;
  return <img src={src} alt={alt} draggable={false} onError={() => setMissing(true)} style={{ objectFit: fit, ...style }} />;
}

/* ── 뉴런 가지 (S1·S20 공용) — 좌하에서 자라 제목 밑줄로 이어지는 손그림 선 ── */
type Branch = { d: string; len: number; from: number; to: number; w: number };
const BRANCHES: Branch[] = [
  { d: 'M 150 1000 C 320 860, 520 720, 720 640 S 1020 560, 1160 470 S 1250 400, 1270 356', len: 1, from: 0, to: 2.7, w: 5 },
  { d: 'M 520 720 C 470 660, 420 620, 380 540', len: 1, from: 1.0, to: 1.7, w: 3 },
  { d: 'M 720 640 C 780 700, 840 730, 930 740', len: 1, from: 1.4, to: 2.1, w: 3 },
  { d: 'M 1020 560 C 1060 610, 1120 640, 1200 650', len: 1, from: 1.9, to: 2.5, w: 3 },
];
const TIPS: [number, number][] = [[380, 540], [930, 740], [1200, 650]];
function BranchSvg({ t, tips }: { t: number; tips?: boolean }) {
  return (
    <svg style={{ ...abs(0, 0, DW, DH), pointerEvents: 'none' }} viewBox={`0 0 ${DW} ${DH}`} aria-hidden>
      {BRANCHES.map((b, i) => {
        const p = interpolate(t, [b.from, b.to], [0, 1], easeOut);
        return <path key={i} d={b.d} fill="none" stroke={C.green} strokeWidth={b.w} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} opacity={0.9} />;
      })}
      {tips && TIPS.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={7} fill={C.green} opacity={interpolate(t, [1.6 + i * 0.3, 2.0 + i * 0.3], [0, 1])} />
      ))}
    </svg>
  );
}

/* ───────────── S1 자라는 뉴런 가지 (씬) ───────────── */
function TitleScene() {
  const t = useSceneTime();
  const q = ['인공지능이란 무엇인가', '어떻게 배워 왔는가', '오늘 내가 하나 가르칠 수 있는가'];
  return (
    <>
      <BranchSvg t={t} tips />
      {/* 제목 밑줄 = 마지막 가지가 닿는 선 */}
      <svg style={{ ...abs(0, 0, DW, DH), pointerEvents: 'none' }} viewBox={`0 0 ${DW} ${DH}`} aria-hidden>
        <path d="M 1270 356 C 1200 350, 900 352, 560 348" fill="none" stroke={C.green} strokeWidth={4} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - interpolate(t, [2.7, 3.5], [0, 1], easeOut)} />
        <circle cx={1270} cy={356} r={11} fill={C.amber} opacity={interpolate(t, [3.3, 3.7], [0, 1])} />
      </svg>
      <div style={{ ...abs(560, 120), ...kick, opacity: interpolate(t, [0, 0.5], [0, 1]) }}>인공지능 기초 · 인공지능의 이해와 학습</div>
      <h1 style={{ ...abs(560, 170, 820), ...h1, fontSize: 72, ...riseIn(t, 0.3) }}>인공지능은<br /><span style={accentText}>어떻게 배울까</span></h1>
      <p style={{ ...abs(560, 400, 700), ...body, fontSize: 24, ...riseIn(t, 3.4) }}>지금까지는 인공지능이 만드는 것을 봤다.<br />오늘은 인공지능이 배우는 법을 본다.</p>
      <div style={{ ...abs(1300, 560, 520) }}>
        <div style={{ ...kick, fontSize: 13, color: 'var(--fg-faint)', ...riseIn(t, 3.6) }}>오늘의 질문 셋</div>
        {q.map((s, i) => (
          <div key={s} style={{ marginTop: i === 0 ? 14 : 18, marginLeft: [0, 36, 72][i], display: 'flex', alignItems: 'center', gap: 12, ...riseIn(t, 3.8 + i * 0.25) }}>
            <span style={{ width: 10, height: 10, borderRadius: 5, background: i === 2 ? C.amber : C.green, flexShrink: 0 }} />
            <span style={{ fontSize: 24, fontWeight: 700, color: C.ink, ...kw }}>{s}</span>
          </div>
        ))}
      </div>
      <div style={{ ...abs(120, 1010), ...mono, fontSize: 13, color: 'var(--fg-faint)', opacity: interpolate(t, [4.4, 5], [0, 1]) }}>준비물 — 각자 기기 · 크롬 · 라이브 세션 코드 (실습은 파일 업로드로 한다)</div>
    </>
  );
}

/* ───────────── S2 한 단어로 (live 워드클라우드) ───────────── */
/* 학생 답이 묶이는 세 갈래 — 표면에서 시작해 오늘의 축으로 깊어진다 */
const WORD_BINS: [string, string, string[]][] = [
  ['겉모습', '무엇처럼 생겼는가', ['로봇', '기계', '터미네이터', '화면 속 얼굴']],
  ['하는 일', '무엇을 해내는가', ['챗GPT', '대답', '추천', '자율주행', '그림']],
  ['배우는 법', '어떻게 그렇게 되었는가', ['학습', '데이터', '경험', '훈련']],
];
const WORD_BOX = [
  { x: 110, y: 618, w: 470, h: 252 },
  { x: 628, y: 548, w: 530, h: 322 },
  { x: 1206, y: 428, w: 614, h: 442 },
];
function WordSlide() {
  return (
    <>
      <div style={{ ...abs(110, 66), ...kick }}>다 같이 — 라이브 참여</div>
      <h2 style={{ ...abs(110, 100, 1000), ...h2 }}>인공지능이란, <span style={accentText}>한 단어로</span></h2>
      <div style={{ ...abs(110, 196) }}><LiveTag kind="워드클라우드" text="'인공지능'하면 떠오르는 단어를 하나만 적어 주세요." /></div>
      <div style={{ ...abs(110, 272, 1100), ...body, fontSize: 20 }}>제출된 낱말은 대개 아래 셋 중 하나로 묶인다. 어디에 넣을지 함께 정해 보자.</div>
      {WORD_BINS.map(([name, q, chips], i) => {
        const b = WORD_BOX[i];
        const last = i === 2;
        return (
          <div key={name} style={{ ...abs(b.x, b.y, b.w, b.h), ...card, padding: '24px 28px', display: 'flex', flexDirection: 'column', borderColor: last ? C.green : 'var(--hair)', background: last ? `${C.green}12` : 'rgba(255,255,255,0.74)', borderWidth: last ? 2 : 1 }}>
            <div style={{ ...mono, fontSize: 17, fontWeight: 800, color: last ? C.green : 'var(--fg-faint)' }}>{['①', '②', '③'][i]}</div>
            <div style={{ fontSize: [38, 46, 58][i], fontWeight: 800, color: last ? C.green : C.ink, marginTop: 4, ...kw }}>{name}</div>
            <div style={{ ...body, fontSize: [19, 21, 24][i], marginTop: 6, ...kw }}>{q}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 'auto' }}>
              {chips.map((c) => (
                <span key={c} style={{ padding: '7px 15px', borderRadius: 999, background: last ? '#fff' : C.paper, border: `1.5px solid ${last ? `${C.green}66` : 'var(--hair)'}`, fontSize: [16, 17, 19][i], fontWeight: 700, color: C.ink }}>{c}</span>
              ))}
            </div>
            {last && <div style={{ marginTop: 18, padding: '10px 16px', borderRadius: 10, background: C.green, color: '#fff', fontWeight: 800, fontSize: 19, textAlign: 'center' }}>오늘 볼 것은 이 갈래다</div>}
          </div>
        );
      })}
      {/* 세 칸을 잇는 상승선 — 표면에서 심층으로 */}
      <svg style={{ ...abs(0, 0, DW, DH), pointerEvents: 'none' }} viewBox={`0 0 ${DW} ${DH}`} aria-hidden>
        <path d="M 348 596 C 470 574, 510 548, 618 528" fill="none" stroke={C.moss} strokeWidth={3} strokeDasharray="7 8" />
        <path d="M 906 526 C 1040 502, 1090 460, 1198 410" fill="none" stroke={C.moss} strokeWidth={3} strokeDasharray="7 8" />
      </svg>
      <div style={{ ...abs(110, 920, 1000), ...body, fontSize: 18 }}>정의가 하나로 모이지 않는 것은 여러분 탓이 아니다. 학자들도 그랬다.</div>
    </>
  );
}

/* ───────────── S3 학자 갤러리 (build) ───────────── */
const SCHOLARS = [
  { key: 'turing', name: '앨런 튜링', year: '1950', src: 'Mind 「Computing Machinery and Intelligence」', quote: '"기계가 생각할 수 있는가"를 묻는 대신 — 사람과 구별할 수 없으면 지능으로 치자. 모방 게임(imitation game).', axis: '흉내', note: '정의가 아니라 판별 기준' },
  { key: 'mccarthy', name: '존 매카시', year: '1955 · 2007', src: '「What is Artificial Intelligence?」', quote: '지능적인 기계, 특히 지능적인 컴퓨터 프로그램을 만드는 과학이자 공학.', axis: '만들기', note: "'artificial intelligence'라는 말을 만든 사람" },
  { key: 'minsky', name: '마빈 민스키', year: '1968', src: '『Semantic Information Processing』', quote: '사람이 했다면 지능이 필요했을 일을 기계가 하게 만드는 과학.', axis: '하는 일', note: '기준을 사람에 둔다' },
  { key: 'aima', name: '러셀 · 노빅', year: '4판 2020', src: '『Artificial Intelligence: A Modern Approach』', quote: '사람처럼 / 합리적으로 × 생각 / 행동 — 네 칸 중 합리적으로 행동하는 에이전트를 택했다.', axis: '합리적 행동', note: '대학 교재의 정의' },
];
function ScholarsSlide() {
  const frames = [abs(110, 150, 400, 500), abs(590, 250, 320, 400), abs(980, 190, 340, 430), abs(1400, 330, 300, 340)];
  const quotes = [abs(110, 690, 400), abs(560, 690, 380), abs(980, 660, 380), abs(1400, 700, 400)];
  return (
    <>
      <div style={{ ...abs(110, 70), ...kick }}>학자들은 이렇게 말했다</div>
      <h2 style={{ ...abs(110, 100, 1100), ...h2, fontSize: 40 }}>넷은 서로 <span style={accentText}>다른 것을 지능으로</span> 본다</h2>
      {/* 선반 — 책이 서는 자리 */}
      <div style={{ ...abs(1370, 672, 360, 10), background: `${C.sand}`, borderRadius: 4, boxShadow: '0 8px 16px -10px rgba(0,0,0,0.4)' }} />
      {SCHOLARS.map((s, i) => (
        <Build key={s.key} at={i + 1} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {i < 3 ? (
            <div style={{ ...frames[i], border: `12px solid ${C.ink}`, boxShadow: '0 30px 60px -30px rgba(0,0,0,0.5), inset 0 0 0 10px ' + C.paper, background: C.paper, boxSizing: 'border-box', overflow: 'hidden' }}>
              <Sprite src={`${SPR}/${s.key}.png`} alt={`${s.name} 초상`} style={{ position: 'absolute', left: 10, top: 10, right: 10, bottom: 10, width: 'calc(100% - 20px)', height: 'calc(100% - 20px)', objectPosition: 'center top' }} />
              <div style={{ position: 'absolute', left: 10, right: 10, bottom: 10, padding: '6px 10px', background: C.ink, color: C.paper, fontSize: 15, fontWeight: 800, ...mono, textAlign: 'center' }}>{s.name} · {s.year}</div>
            </div>
          ) : (
            <div style={{ ...frames[3] }}>
              <Sprite src={`${SPR}/aima-book.png`} alt="교재 책" style={{ position: 'absolute', left: 0, top: 0, width: 300, height: 340 }} />
              <div style={{ position: 'absolute', left: 60, top: 70, width: 160, color: C.paper, fontWeight: 800, fontSize: 15, lineHeight: 1.25, textShadow: '0 1px 2px rgba(0,0,0,0.5)', pointerEvents: 'none' }}>Artificial Intelligence<br /><span style={{ fontWeight: 600, fontSize: 12 }}>A Modern Approach</span></div>
            </div>
          )}
          <div style={{ ...quotes[i], ...card, padding: '16px 20px', pointerEvents: 'auto' }}>
            <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.4, color: C.ink, ...kw }}>{s.quote}</div>
            <div style={{ ...mono, fontSize: 12, color: 'var(--fg-faint)', marginTop: 8, ...kw }}>{s.src} · {s.note}</div>
          </div>
        </Build>
      ))}
      <Build at={5} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <svg style={{ ...abs(0, 0, DW, DH) }} viewBox={`0 0 ${DW} ${DH}`} aria-hidden>
          <path d="M 110 960 C 500 950, 1300 950, 1810 960" fill="none" stroke={C.green} strokeWidth={4} strokeLinecap="round" />
          <path d="M 1790 950 L 1810 960 L 1790 970" fill="none" stroke={C.green} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ ...abs(110, 980), ...kick }}>무엇을 지능으로 보는가 →</div>
        {SCHOLARS.map((s, i) => (
          <div key={s.key} style={{ ...abs([300, 700, 1120, 1520][i], 928), padding: '6px 16px', borderRadius: 999, background: C.green, color: '#fff', fontWeight: 800, fontSize: 18 }}>{s.axis}</div>
        ))}
      </Build>
      <div style={{ ...abs(1400, 100, 420), ...mono, fontSize: 12.5, color: 'var(--fg-faint)', textAlign: 'right', ...kw }}>초상은 생성 이미지로 그린 초상화풍 재현 · 러셀·노빅은 생존 인물이라 교재로 대신한다</div>
    </>
  );
}

/* ───────────── S4 고도계 능선 (씬) ───────────── */
const LEVELS = ['0 AI 아님', '1 신흥', '2 유능', '3 전문가', '4 거장', '5 초인간'];
/* 성능 눈금 — 능선의 마루와 아래 진행 막대가 같은 x를 쓴다 */
const RX = [200, 370, 540, 710, 880, 1050];
const RY = [700, 658, 612, 562, 508, 450];
const RIDGE_PTS: [number, number][] = RX.map((x, i) => [x, RY[i]]);
function ridgeD(): string { return RIDGE_PTS.map((p, i) => (i ? `L ${p[0]} ${p[1]}` : `M ${p[0]} ${p[1]}`)).join(' '); }
/* 진행 막대 — 두 범용성이 성능 눈금의 어디까지 갔는지 */
const BAR = { A: 760, B: 856, h: 48, x0: RX[0], x1: RX[5] };
function RidgeScene() {
  const t = useSceneTime();
  const draw = interpolate(t, [0.2, 2.0], [0, 1], easeInOut);
  const barA = interpolate(t, [4.6, 6.0], [0, 1], easeInOut);          // 좁은 범위 — 5단계까지
  const barB = interpolate(t, [6.3, 6.9], [0, 1], easeInOut);          // 넓은 범위 — 1단계까지
  const { A, B, h, x0, x1 } = BAR;
  const aEnd = x0 + (x1 - x0) * barA;
  const bFull = RX[1];                                                  // 1단계 눈금
  const bEnd = x0 + (bFull - x0) * barB;
  return (
    <>
      <div style={{ ...abs(110, 58), ...kick, fontSize: 16 }}>얼마나 똑똑한가 — 수준별 분류</div>
      <h2 style={{ ...abs(110, 92, 1080), ...h2, fontSize: 44 }}>좁은 범위에서는 이미 사람을 넘고, <span style={accentText}>넓은 범위에서는</span> 아직이다</h2>

      {/* 오른쪽 — 두 분류 틀을 크게 나란히 */}
      <div style={{ ...abs(1240, 168, 580), ...card, padding: '22px 26px', ...riseIn(t, 0.2) }}>
        <div style={{ ...kick, fontSize: 14, color: 'var(--fg-faint)' }}>널리 쓰는 세 칸 · 통용 구분</div>
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[['약인공지능', 'ANI', '한 가지 일이나 제한된 과제군'], ['범용인공지능', 'AGI', '다양한 지적 과제를 폭넓게'], ['초인공지능', 'ASI', '거의 모든 인지 영역에서 사람을 크게 넘어']].map(([a, en, b]) => (
            <div key={a} style={{ padding: '12px 16px', borderRadius: 12, background: `${C.green}10`, ...kw }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontWeight: 800, fontSize: 24, color: C.ink }}>{a}</span>
                <span style={{ ...mono, fontSize: 15, color: C.green, fontWeight: 800 }}>{en}</span>
              </div>
              <div style={{ fontSize: 17, color: 'var(--fg-muted)', marginTop: 3 }}>{b}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...abs(1240, 566, 580), ...card, padding: '20px 26px', borderColor: C.amber, background: `${C.amber}0e`, ...riseIn(t, 2.2) }}>
        <div style={{ ...kick, fontSize: 14, color: '#9a6d0f' }}>딥마인드 「Levels of AGI」 · 2023</div>
        <div style={{ fontSize: 21, fontWeight: 800, color: C.ink, marginTop: 8, ...kw }}>성능 수준과 범용성을 <b style={{ color: '#9a6d0f' }}>나누어</b> 보자는 제안</div>
        <div style={{ ...body, fontSize: 17.5, marginTop: 8 }}>성능은 0~5단계, 범용성은 좁은 범위와 넓은 범위로 따로 잰다. 위의 세 칸을 더 잘게 쪼갠 것이 아니라 <b>다른 틀</b>이다.</div>
      </div>
      <div style={{ ...abs(1240, 812, 580), ...body, fontSize: 21, color: C.ink, ...riseIn(t, 7.2) }}>어느 눈금에 있든, 올라온 방법은 하나 — <b style={{ color: C.green }}>학습</b>.</div>

      {/* 왼쪽 — 성능 눈금(능선)과 두 범용성의 진행 막대 */}
      <svg style={{ ...abs(0, 0, DW, DH), pointerEvents: 'none' }} viewBox={`0 0 ${DW} ${DH}`} aria-hidden>
        <path d={`${ridgeD()} L ${x1} 720 L ${x0} 720 Z`} fill={C.ice} opacity={0.4 * draw} />
        <path d={ridgeD()} fill="none" stroke={C.green} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
        {/* 눈금 표지판 */}
        {RIDGE_PTS.map(([x, y], i) => {
          const on = t >= 2.1 + i * 0.36;
          const top = i === 5;
          return (
            <g key={i} opacity={on ? 1 : 0}>
              <line x1={x} y1={y} x2={x} y2={y - 58} stroke={C.ink} strokeWidth={3} />
              <rect x={x - 62} y={y - 104} width={124} height={44} rx={8} fill={top ? C.amber : C.paper} stroke={C.ink} strokeWidth={2.5} />
              <text x={x} y={y - 74} textAnchor="middle" fontSize={20} fontWeight={800} fill={C.ink} fontFamily="var(--font-body)">{LEVELS[i]}</text>
              <line x1={x} y1={y + 6} x2={x} y2={B + h + 8} stroke={C.ink} strokeWidth={1.5} strokeDasharray="4 7" opacity={0.28} />
            </g>
          );
        })}
        {/* 진행 막대 — 두 범용성이 어디까지 갔는가 */}
        <rect x={x0} y={A} width={x1 - x0} height={h} rx={10} fill={C.paper} stroke={C.sand} strokeWidth={2} opacity={barA > 0 ? 1 : 0} />
        <rect x={x0} y={A} width={Math.max(0, aEnd - x0)} height={h} rx={10} fill={C.green} />
        <text x={x0 + 18} y={A + 33} fontSize={25} fontWeight={800} fill="#fff" fontFamily="var(--font-body)" opacity={barA > 0.12 ? 1 : 0}>좁은 범위</text>
        <rect x={x0} y={B} width={x1 - x0} height={h} rx={10} fill={C.paper} stroke={C.sand} strokeWidth={2} opacity={barB > 0 ? 1 : 0} />
        <rect x={x0} y={B} width={Math.max(0, bEnd - x0)} height={h} rx={10} fill={C.amber} />
        <text x={x0 + 18} y={B + 33} fontSize={25} fontWeight={800} fill="#fff" fontFamily="var(--font-body)" opacity={barB > 0.5 ? 1 : 0}>넓은 범위</text>
        {/* 도달 지점 표시 */}
        {barA >= 1 && (
          <g>
            <line x1={x1} y1={A - 10} x2={x1} y2={A + h + 10} stroke={C.ink} strokeWidth={4} />
            <path d={`M ${x1} ${A - 10} L ${x1 + 58} ${A + 4} L ${x1} ${A + 18} Z`} fill={C.green} />
          </g>
        )}
        {barB >= 1 && (
          <g>
            <line x1={bFull} y1={B - 10} x2={bFull} y2={B + h + 10} stroke={C.ink} strokeWidth={4} />
            <path d={`M ${bFull} ${B + h + 10} l -9 -14 l 18 0 Z`} fill={C.amber} />
          </g>
        )}
      </svg>
      {/* 막대 설명 — 큰 글씨로 바로 아래 */}
      <div style={{ ...abs(x0 + 4, A + h + 10, 900), fontSize: 19, fontWeight: 700, color: C.ink, opacity: barA >= 1 ? 1 : 0, transition: 'opacity .4s', ...kw }}>
        5단계까지 도달 — 논문이 든 사례는 <b style={{ color: C.green }}>AlphaZero · AlphaFold</b> (알파고는 4단계)
      </div>
      <div style={{ ...abs(x0 + 4, B + h + 10, 980), fontSize: 19, fontWeight: 700, color: C.ink, opacity: barB >= 1 ? 1 : 0, transition: 'opacity .4s', ...kw }}>
        1단계에서 멈춤 — <b style={{ color: '#9a6d0f' }}>2023년 논문이 당시 모델을 평가한 결과</b>다. 지금 다시 재면 달라질 수 있다.
      </div>
      <div style={{ ...abs(bFull + 40, B + 12), fontSize: 19, fontWeight: 800, color: '#9a6d0f', opacity: barB >= 1 ? 0.75 : 0, transition: 'opacity .4s' }}>아직 가는 중 →</div>
      <div style={{ ...abs(x0, 300), ...mono, fontSize: 15, color: 'var(--fg-faint)' }}>성능 수준 →</div>
    </>
  );
}

/* ───────────── S5 도구에서 에이전트로 (build) ───────────── */
function ToolAgentSlide() {
  const tiers: [string, string, string[]][] = [
    ['도구', '묻고 답한다 — 한 번에 한 응답', ['2022 챗봇']],
    ['워크플로', '사람이 정한 순서대로 도구를 호출한다', ['검색 → 요약 → 저장']],
    ['에이전트', '목표와 도구, 제약을 받고 경로는 스스로 정한다', ['컴퓨터 사용 2024-10', 'MCP 2024-11', 'Operator 2025-01', '코딩 에이전트 2025']],
  ];
  return (
    <>
      <div style={{ ...abs(110, 70), ...kick }}>도구에서 에이전트로</div>
      <h2 style={{ ...abs(110, 104, 1000), ...h2, fontSize: 42 }}>쓰는 도구에서, <span style={accentText}>스스로 절차를 정하는</span> 에이전트로</h2>
      {/* 왼쪽 dominant — 단계마다 배우가 바뀐다 */}
      <div style={{ ...abs(110, 260, 620, 640), borderRadius: 28, background: `${C.green}0f`, border: `1px solid ${C.green}33` }} />
      <svg style={{ ...abs(110, 260, 620, 640), pointerEvents: 'none' }} viewBox="0 0 620 640" aria-hidden>
        {/* 도구 — 망치 */}
        <g opacity={0.95}>
          <rect x={290} y={170} width={34} height={330} rx={12} fill={C.sand} stroke={C.ink} strokeWidth={4} />
          <rect x={200} y={120} width={214} height={90} rx={18} fill={C.ink} />
          <text x={310} y={570} textAnchor="middle" fontSize={22} fontWeight={800} fill={C.ink} fontFamily="var(--font-body)">도구 — 쥐고 쓴다</text>
        </g>
      </svg>
      <Build at={2} style={{ ...abs(110, 260, 620, 640), pointerEvents: 'none' }}>
        <svg style={{ position: 'absolute', inset: 0 }} viewBox="0 0 620 640" aria-hidden>
          <rect x={0} y={0} width={620} height={640} rx={28} fill={C.cream} />
          {[0, 1, 2].map((i) => <g key={i}><rect x={90 + i * 170} y={260} width={130} height={70} rx={12} fill={C.paper} stroke={C.green} strokeWidth={3} /><text x={155 + i * 170} y={303} textAnchor="middle" fontSize={20} fontWeight={800} fill={C.ink} fontFamily="var(--font-body)">{['검색', '요약', '저장'][i]}</text>{i < 2 && <path d={`M ${222 + i * 170} 295 L ${258 + i * 170} 295 M ${248 + i * 170} 286 L ${258 + i * 170} 295 L ${248 + i * 170} 304`} fill="none" stroke={C.green} strokeWidth={3} strokeLinecap="round" />}</g>)}
          <text x={310} y={400} textAnchor="middle" fontSize={20} fontWeight={700} fill={C.ink} fontFamily="var(--font-body)">순서는 사람이 정한다</text>
          <text x={310} y={570} textAnchor="middle" fontSize={22} fontWeight={800} fill={C.ink} fontFamily="var(--font-body)">워크플로 — 정해진 길</text>
        </svg>
      </Build>
      <Build at={3} style={{ ...abs(110, 260, 620, 640), pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 28, background: C.cream }} />
        <Sprite src="/assets/sprites/화이트보드-키트/wb-robot.png" alt="로봇" style={{ position: 'absolute', left: 150, top: 90, width: 320, height: 380 }} />
        <svg style={{ position: 'absolute', inset: 0 }} viewBox="0 0 620 640" aria-hidden>
          <path d="M 120 520 C 200 500, 260 540, 330 520 S 470 500, 540 520" fill="none" stroke={C.green} strokeWidth={4} strokeDasharray="10 12" strokeLinecap="round" />
          <text x={310} y={580} textAnchor="middle" fontSize={22} fontWeight={800} fill={C.ink} fontFamily="var(--font-body)">에이전트 — 스스로 걷는다</text>
        </svg>
      </Build>
      {/* 오른쪽 — 세 층 계단 */}
      {tiers.map(([name, d, chips], i) => (
        <Build key={name} at={i + 1} style={abs(800 + i * 60, 760 - i * 190, 900 - i * 60, 160)}>
          <div style={{ ...card, height: '100%', padding: '18px 22px', borderColor: i === 2 ? C.green : 'var(--hair)', background: i === 2 ? `${C.green}14` : 'rgba(255,255,255,0.72)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}><span style={{ fontSize: 30, fontWeight: 800, color: i === 2 ? C.green : C.ink }}>{name}</span><span style={{ ...body, fontSize: 17 }}>{d}</span></div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>{chips.map((c) => <span key={c} style={{ ...mono, fontSize: 13, padding: '4px 10px', borderRadius: 999, background: C.paper, border: '1px solid var(--hair)', color: 'var(--fg-muted)' }}>{c}</span>)}</div>
          </div>
        </Build>
      ))}
      <Build at={4} style={abs(980, 210, 720, 150)}>
        <div style={{ ...card, height: '100%', padding: '16px 22px', border: `2px dashed ${C.amber}`, background: `${C.amber}12` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ ...mono, fontSize: 12, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: C.amber, color: '#fff' }}>예측</span><span style={{ fontSize: 24, fontWeight: 800, color: C.ink }}>앞으로</span></div>
          <div style={{ ...body, fontSize: 17, marginTop: 6 }}>에이전트가 에이전트에게 일을 나누고, 화면 밖 로봇 몸으로 나간다 — 「인공지능이 바꾸는 세상」의 로보택시·휴머노이드가 그 첫 장면.</div>
        </div>
      </Build>
      <Build at={5} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <svg style={{ ...abs(0, 0, DW, DH) }} viewBox={`0 0 ${DW} ${DH}`} aria-hidden>
          <line x1={1760} y1={230} x2={1760} y2={960} stroke={C.green} strokeWidth={5} strokeLinecap="round" />
          <circle cx={1760} cy={960} r={9} fill={C.green} />
        </svg>
        <div style={{ ...abs(940, 950), fontSize: 23, fontWeight: 800, color: C.green, ...kw }}>여기 셋은 모두 <b>학습된 모델</b>을 쓴다 — 쓰는 방식이 달라졌을 뿐이다</div>
      </Build>
    </>
  );
}

/* ───────────── S6 배운다는 것 — 안의 숫자가 스스로 움직인다 (씬) ─────────────
   이 덱의 심장. 퍼셉트론(가중치)·전이학습(분류층)·출구 티켓이 모두 이 그림으로 돌아온다 */
const W_START = [0.42, 0.88, 0.15, 0.63, 0.71, 0.29];
const W_TARGET = [0.74, 0.21, 0.58, 0.33, 0.47, 0.69];
/* 라운드 시작 시각 — 뒤로 갈수록 빨라진다(같은 일을 수없이 반복한다는 뜻) */
const LEARN_ROUNDS = [1.3, 3.3, 5.1, 6.6, 7.5, 8.2, 8.8, 9.3, 9.7];
const LEARN_EX: [string, string, boolean][] = [
  ['치와와/치와와_01.jpg', '치와와', false],
  ['머핀/머핀_01.jpg', '머핀', false],
  ['치와와/치와와_07.jpg', '치와와', true],
  ['머핀/머핀_04.jpg', '머핀', true],
  ['치와와/치와와_12.jpg', '치와와', false],
  ['머핀/머핀_09.jpg', '머핀', true],
  ['치와와/치와와_21.jpg', '치와와', true],
  ['머핀/머핀_15.jpg', '머핀', true],
  ['치와와/치와와_30.jpg', '치와와', true],
];
function LearnScene() {
  const t = useSceneTime();
  const done = LEARN_ROUNDS.filter((x) => t >= x).length;              // 끝난 라운드 수
  const cur = Math.min(done, LEARN_EX.length - 1);
  const rs = LEARN_ROUNDS[cur];
  const u = t - rs;                                                    // 이번 라운드 안 경과
  const ex = LEARN_EX[cur];
  const conv = 1 - Math.exp(-done * 0.52);                             // 수렴 정도
  const prevConv = 1 - Math.exp(-Math.max(0, done - 1) * 0.52);
  const moving = t >= rs + 1.0 && t < rs + 1.6;                        // 숫자가 움직이는 구간
  const mix = moving ? interpolate(t, [rs + 1.0, rs + 1.6], [prevConv, conv], easeInOut) : (t >= rs + 1.6 ? conv : prevConv);
  const w = W_START.map((a, i) => a + (W_TARGET[i] - a) * mix);
  const BX = 680, BY = 296, BW = 560, BH = 356;
  const cardIn = interpolate(u, [0, 0.45], [0, 1], easeInOut);         // 예시가 상자 앞까지 간다
  const cardFade = interpolate(u, [0.45, 0.64], [1, 0]);               // 상자로 흡수되듯 사라진다
  const answered = u >= 0.62;
  const showAns = answered && u < 1.9;
  return (
    <>
      <div style={{ ...abs(110, 58), ...kick, fontSize: 16 }}>배운다는 것</div>
      <h2 style={{ ...abs(110, 92, 1180), ...h2, fontSize: 44 }}>인공지능이 배운다는 것은 <span style={accentText}>안의 숫자를 고치는</span> 일이다</h2>

      {/* 왼쪽 — 들어가는 예시 */}
      <div style={{ ...abs(110, 300), ...kick, fontSize: 14, color: 'var(--fg-faint)' }}>예시 — 사진과 정답 레이블</div>
      <div style={{ ...abs(112, 344, 300, 420), borderRadius: 18, border: `2px dashed ${C.moss}55` }} />
      {/* 대기 중인 예시 더미 */}
      {[0, 1, 2].map((k) => (
        <div key={k} style={{ ...abs(132 + k * 10, 380 + k * 12, 240, 300), borderRadius: 12, background: C.paper, border: `1.5px solid ${C.sand}`, opacity: 0.5 - k * 0.12 }} />
      ))}
      {/* 지금 들어가는 예시 카드 */}
      <div style={{ ...abs(132 + (418 - 132) * cardIn, 380 - 30 * cardIn, 240, 300), borderRadius: 12, overflow: 'hidden', background: '#fff', border: `2px solid ${C.green}`, boxShadow: '0 16px 36px -20px rgba(29,42,38,0.5)', opacity: cardFade, transform: `scale(${0.96 + 0.04 * cardFade})`, zIndex: 3 }}>
        <img src={`${DATASET_DIR}/${ex[0]}`} alt="" draggable={false} style={{ width: '100%', height: 224, objectFit: 'cover' }} />
        <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ ...mono, fontSize: 13, color: 'var(--fg-faint)' }}>정답</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: C.ink }}>{ex[1]}</span>
        </div>
      </div>

      {/* 가운데 — 모델 상자 */}
      <div style={{ ...abs(BX, BY, BW, BH), ...card, padding: '20px 24px', background: 'rgba(255,255,255,0.85)', borderColor: moving ? C.amber : 'var(--hair)', borderWidth: 2 }}>
        <div style={{ ...kick, fontSize: 13, color: moving ? '#9a6d0f' : 'var(--fg-faint)' }}>{moving ? '숫자를 고치는 중' : '모델 안'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 14 }}>
          {w.map((v, i) => (
            <div key={i} style={{ padding: '18px 0', borderRadius: 12, background: moving ? `${C.amber}22` : C.paper, border: `1.5px solid ${moving ? C.amber : 'var(--hair)'}`, textAlign: 'center', transition: 'background .2s' }}>
              <div style={{ ...mono, fontSize: 36, fontWeight: 800, color: C.ink }}>{v.toFixed(2)}</div>
            </div>
          ))}
        </div>
        <div style={{ ...body, fontSize: 16, marginTop: 16, ...kw }}>이 숫자들이 사진을 보고 답을 정한다. 사람이 적어 넣은 것이 아니다.</div>
      </div>
      <div style={{ ...abs(BX + 160, BY - 42), fontSize: 20, fontWeight: 800, color: C.green }}>↓ 넣는다</div>

      {/* 오른쪽 — 답과 판정 */}
      <div style={{ ...abs(1320, 330, 470) }}>
        <div style={{ ...kick, fontSize: 14, color: 'var(--fg-faint)' }}>모델의 답</div>
        <div style={{ marginTop: 12, ...card, padding: '22px 26px', borderColor: showAns ? (ex[2] ? C.green : C.red) : 'var(--hair)', borderWidth: 2, background: showAns ? (ex[2] ? `${C.green}14` : `${C.red}12`) : 'rgba(255,255,255,0.7)' }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: C.ink, ...kw }}>{answered ? (ex[2] ? ex[1] : (ex[1] === '치와와' ? '머핀' : '치와와')) : '…'}</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 8, color: answered ? (ex[2] ? C.green : C.red) : 'var(--fg-faint)' }}>
            {answered ? (ex[2] ? '✓ 맞았다' : '✗ 틀렸다 — 고칠 차례') : '생각 중'}
          </div>
        </div>
        <div style={{ ...mono, fontSize: 16, color: 'var(--fg-muted)', marginTop: 16 }}>{done}번째 예시 · 맞힌 횟수 {LEARN_EX.slice(0, Math.max(0, done)).filter((e) => e[2]).length}</div>
      </div>

      {/* 진행 — 아홉 번의 예시가 어떻게 달라지는가 */}
      <div style={{ ...abs(680, 692, 560) }}>
        <div style={{ ...kick, fontSize: 13, color: 'var(--fg-faint)' }}>예시 {Math.min(done, LEARN_EX.length)} / {LEARN_EX.length}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          {LEARN_EX.map((e, i) => (
            <div key={i} style={{ flex: 1, height: 16, borderRadius: 8, background: i < done ? (e[2] ? C.green : C.red) : 'var(--hair)', outline: i === cur && done > 0 && i >= done - 1 ? `3px solid ${C.amber}` : 'none', outlineOffset: 2 }} />
          ))}
        </div>
        <div style={{ ...body, fontSize: 16, marginTop: 12, ...kw }}>처음엔 틀리다가(빨강) 점점 맞기 시작한다(초록). 숫자가 자리를 잡아 가는 것이다.</div>
      </div>
      {/* 하단 — 이 수업의 정의 */}
      <div style={{ ...abs(110, 850, 1700), ...card, padding: '20px 28px', background: `${C.green}12`, borderColor: C.green, opacity: interpolate(t, [10.2, 10.7], [0, 1]) }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: C.green, ...kw }}>배운다 = 틀린 만큼, 안의 숫자를 조금씩 고친다</div>
        <div style={{ ...body, fontSize: 19, marginTop: 8 }}>고칠수록 변화 폭이 줄고 답이 맞기 시작한다. 이 숫자를 <b>가중치</b>라고 부른다 — 오늘 남은 시간은 이 한 문장을 뜯어보는 일이다.</div>
      </div>
    </>
  );
}

/* ───────────── S7 규칙표 (build) ─────────────
   규칙 11·12는 같은 환자에게 동시에 발동하면서 정반대를 지시한다 — 진짜 충돌 예시 */
const RULES: [string, string, string][] = [
  ['열이 난다', '백혈구 수치가 높다', '세균 감염 의심'],
  ['기침이 오래간다', '가래가 누렇다', '기관지염 의심'],
  ['두통이 있다', '목이 뻣뻣하다', '수막염 검사'],
  ['발진이 있다', '가렵다', '알레르기 의심'],
  ['오른쪽 아랫배가 아프다', '누르면 더 아프다', '충수염 의심'],
  ['황달이 있다', '피로가 심하다', '간 기능 검사'],
  ['어지럽다', '귀에서 소리가 난다', '내이 검사'],
  ['체중이 줄었다', '식욕은 늘었다', '갑상선 검사'],
  ['관절이 아프다', '아침에 뻣뻣하다', '류마티스 검사'],
  ['숨이 차다', '다리가 붓는다', '심부전 의심'],
  ['세균 감염이 의심된다', '', '항생제를 쓴다'],
  ['페니실린 알레르기가 있다', '', '항생제를 쓰지 않는다'],
];
function RuleLine({ r, i, hot }: { r: [string, string, string]; i: number; hot?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '7px 12px', borderBottom: `1px dashed ${C.sand}`, ...mono, fontSize: 16, color: C.ink, background: hot ? `${C.red}16` : 'transparent', borderLeft: `5px solid ${hot ? C.red : 'transparent'}`, transition: 'background .3s' }}>
      <span style={{ color: hot ? C.red : 'var(--fg-faint)', width: 26, fontWeight: hot ? 800 : 400 }}>{String(i + 1).padStart(2, '0')}</span>
      <span style={{ color: C.green, fontWeight: 800 }}>IF</span><span>{r[0]}</span>
      {r[1] && <><span style={{ color: C.green, fontWeight: 800 }}>AND</span><span>{r[1]}</span></>}
      <span style={{ color: C.green, fontWeight: 800 }}>THEN</span><span style={{ fontWeight: 700 }}>{r[2]}</span>
    </div>
  );
}
function RulesSlide() {
  const { clicks, isStatic } = useDeck();
  const hot = isStatic || clicks >= 4;
  return (
    <>
      <div style={{ ...abs(110, 66), ...kick }}>사람이 규칙을 쓰던 시대</div>
      <h2 style={{ ...abs(110, 100, 1000), ...h2, fontSize: 42 }}>규칙은 <span style={accentText}>사람이 썼다</span> — 기계는 따르기만 했다</h2>
      {/* 규칙표 — 왼쪽 dominant, 화면 중앙을 지난다 */}
      <div style={{ ...abs(110, 210, 1000), padding: '22px 22px 18px', background: C.paper, border: `1px solid ${C.sand}`, borderRadius: 18, boxShadow: '0 30px 60px -30px rgba(29,42,38,0.5)', boxSizing: 'border-box' }}>
        <div style={{ ...kick, fontSize: 12, color: 'var(--fg-faint)', paddingLeft: 12, ...kw }}>전문가 시스템의 규칙 베이스 — 형식을 보이려고 만든 예시이며 실제 MYCIN 규칙은 아니다</div>
        <div style={{ marginTop: 10 }}>
          {RULES.slice(0, 3).map((r, i) => <RuleLine key={i} r={r} i={i} />)}
          <Build at={2}>
            {RULES.slice(3).map((r, i) => <RuleLine key={i + 3} r={r} i={i + 3} hot={hot && i + 3 >= 10} />)}
          </Build>
        </div>
        <Build at={4}>
          <div style={{ marginTop: 14, padding: '12px 16px', borderRadius: 12, background: `${C.red}12`, border: `2px solid ${C.red}66`, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 24, color: C.red, fontWeight: 900, lineHeight: 1 }}>⇅</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: C.ink, ...kw }}>세균 감염이 의심되면서 페니실린 알레르기도 있는 환자는? — <b style={{ color: C.red }}>11은 쓰라 하고 12는 쓰지 말라 한다.</b> 규칙을 더 쓸수록 이런 자리가 늘어난다.</span>
          </div>
        </Build>
      </div>
      <Build at={4} style={{ ...abs(110, 210, 1000, 640), pointerEvents: 'none' }}>
        {[[700, 120, -8], [640, 380, 6]].map(([x, y, r], i) => (
          <div key={i} style={{ position: 'absolute', left: x, top: y, transform: `rotate(${r}deg)`, padding: '6px 16px', border: `4px solid ${C.amber}`, color: C.amber, fontWeight: 900, fontSize: 28, letterSpacing: '0.1em', borderRadius: 8, background: 'rgba(251,248,241,0.75)' }}>예외</div>
        ))}
      </Build>
      <Build at={3} style={abs(1180, 220, 620)}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[['1956', 'Logic Theorist — 정리 증명'], ['1966', 'ELIZA — 규칙으로 대화 흉내'], ['1970s', 'MYCIN — 수백 개 규칙으로 감염 진단 지원'], ['1980s', '전문가 시스템 붐']].map(([y, d]) => (
            <div key={y} style={{ ...card, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'baseline' }}><span style={{ ...mono, fontWeight: 800, color: C.green, fontSize: 16 }}>{y}</span><span style={{ ...body, fontSize: 15 }}>{d}</span></div>
          ))}
        </div>
      </Build>
      <Build at={4} style={abs(1180, 470, 620)}>
        <div style={{ ...card, padding: '16px 20px', borderColor: `${C.red}66` }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.ink, ...kw }}>막힌 이유</div>
          <div style={{ ...body, fontSize: 16, marginTop: 6 }}>규칙을 사람이 다 써야 하고, 예외가 생길 때마다 규칙이 늘고, 규칙끼리 충돌한다. 기대가 꺾이고 연구 지원이 줄어든 두 차례의 <b>AI 겨울</b>(1974~80 · 1987~93)로 이어졌다.</div>
        </div>
      </Build>
      <Build at={5} style={abs(1180, 700, 620)}>
        <div style={{ ...card, padding: '18px 22px', background: `${C.green}14`, borderColor: C.green }}>
          <div style={{ ...kick, fontSize: 12 }}>차이의 씨앗</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.green, marginTop: 4, ...kw }}>판단 기준을 쓰는 쪽: 사람</div>
          <div style={{ ...body, fontSize: 15, marginTop: 6 }}>같은 시기에 학습하는 인공지능도 이미 있었다(1958 퍼셉트론). 다만 실무를 맡은 것은 이 규칙 방식이었다.</div>
        </div>
      </Build>
    </>
  );
}

/* ───────────── S8 규칙을 데이터에서 찾게 하자 (build) ─────────────
   규칙 기반(S7)과 퍼셉트론(S9) 사이의 다리 — 기계학습이라는 발상 자체 */
const SPAM_MAIL: [string, boolean][] = [
  ['무료 당첨! 지금 클릭하세요', true],
  ['경품 무료 배송 안내', true],
  ['내일 회의 자료 첨부합니다', false],
  ['과제 제출 안내드립니다', false],
];
const SPAM_W: [string, number][] = [['당첨', 0.9], ['무료', 0.8], ['클릭', 0.6], ['과제', -0.6], ['회의', -0.7]];
function MachineLearningSlide() {
  return (
    <>
      <div style={{ ...abs(110, 58), ...kick, fontSize: 16 }}>기계학습이라는 발상</div>
      <h2 style={{ ...abs(110, 92, 1300), ...h2, fontSize: 44 }}>규칙을 사람이 못 쓴다면 — <span style={accentText}>예시에서 찾게 하자</span></h2>

      {/* 왼쪽 — 앞 장에서 막힌 길 */}
      <Build at={1} style={abs(110, 330, 480)}>
        <div style={{ ...card, padding: '22px 26px', borderColor: `${C.red}55`, opacity: 0.9 }}>
          <div style={{ ...kick, fontSize: 13, color: C.red }}>앞 장에서 막힌 길</div>
          <div style={{ ...mono, fontSize: 18, color: C.ink, marginTop: 12, lineHeight: 1.7, ...kw }}>
            <span style={{ color: C.green, fontWeight: 800 }}>IF</span> 제목에 「무료」가 있다<br />
            <span style={{ color: C.green, fontWeight: 800 }}>THEN</span> 스팸이다
          </div>
          <div style={{ ...body, fontSize: 17, marginTop: 14, ...kw }}>그런데 「무료 강연 안내」는? 예외가 생길 때마다 사람이 규칙을 덧써야 한다.</div>
        </div>
      </Build>

      {/* 오른쪽 — 예시를 주고 기계가 세게 한다 */}
      <Build at={2} style={abs(660, 240, 1160)}>
        <div style={{ ...kick, fontSize: 14 }}>대신 이렇게 한다 — ① 레이블이 붙은 예시를 잔뜩 준다</div>
        <div style={{ display: 'flex', gap: 14, marginTop: 12 }}>
          {SPAM_MAIL.map(([txt, spam]) => (
            <div key={txt} style={{ flex: 1, ...card, padding: '14px 16px', borderLeft: `7px solid ${spam ? C.red : C.moss}` }}>
              <div style={{ ...mono, fontSize: 12.5, fontWeight: 800, color: spam ? C.red : C.moss }}>{spam ? '스팸' : '정상'}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginTop: 6, ...kw }}>{txt}</div>
            </div>
          ))}
        </div>
        <div style={{ ...mono, fontSize: 15, color: 'var(--fg-muted)', marginTop: 10 }}>… 이런 메일 수천 통</div>
      </Build>

      <Build at={3} style={abs(660, 486, 1160)}>
        <div style={{ ...kick, fontSize: 14 }}>② 기계가 센다 — 어느 낱말이 스팸 쪽에 자주 나오는가</div>
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          {SPAM_W.map(([word, v]) => (
            <div key={word} style={{ flex: 1, ...card, padding: '16px 14px', textAlign: 'center', background: v > 0 ? `${C.red}0e` : `${C.moss}12` }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: C.ink }}>{word}</div>
              <div style={{ ...mono, fontSize: 26, fontWeight: 800, color: v > 0 ? C.red : C.moss, marginTop: 6 }}>{v > 0 ? '+' : ''}{v.toFixed(1)}</div>
            </div>
          ))}
        </div>
        <div style={{ ...body, fontSize: 17, marginTop: 12, ...kw }}>이 숫자는 사람이 적은 것이 아니다. 예시를 보며 기계가 조정한 <b>가중치</b>다 — 앞 장에서 본 그 숫자.</div>
      </Build>

      <Build at={4} style={abs(110, 812, 1710)}>
        <div style={{ ...card, padding: '20px 28px', background: `${C.green}12`, borderColor: C.green, display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 27, fontWeight: 800, color: C.green, ...kw }}>사람은 무엇을 볼지 정하고, 기계는 얼마나 중요한지 정한다</span>
          <span style={{ ...body, fontSize: 18, flex: 1, minWidth: 420, ...kw }}>여기서 사람이 한 일은 「낱말을 세어 보라」고 정한 것뿐이다. 이렇게 사람이 고른 관찰 대상을 <b>특징</b>이라고 한다.</span>
        </div>
      </Build>
    </>
  );
}

/* ───────────── S10 하나로는 못 가른다 → 층을 쌓는다 (build) ─────────────
   퍼셉트론(S9)과 딥러닝 연표(S11) 사이의 다리 */
const XOR_PTS: [number, number, boolean][] = [[22, 78, false], [78, 22, false], [22, 22, true], [78, 78, true]];
const TRY_LINES = ['M 6 62 L 94 38', 'M 34 6 L 62 94', 'M 8 20 L 92 84'];
/* 층을 쌓으면 경계가 곡선이 된다 — 빨간 점 둘을 지나는 S자 축에서 좌우로 벌린 리본.
   축이 두 점을 정확히 지나므로 빨강은 리본 안, 파랑은 34.3만큼 떨어져 밖에 남는다. */
const RIBBON = (() => {
  const A = [22, 22], B = [78, 78], AMP = 10, W = 12;   // 축이 두 빨간 점을 지나고, 최소 곡률반경 15.9 > W
  const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
  const ex = (B[0] - A[0]) / L, ey = (B[1] - A[1]) / L;
  const at = (u: number) => {
    const w = (2 * Math.PI * u) / L;
    const v = AMP * Math.sin(w), dv = AMP * (2 * Math.PI / L) * Math.cos(w);
    const dx = ex + -ey * dv, dy = ey + ex * dv, len = Math.hypot(dx, dy);
    return { x: A[0] + ex * u + -ey * v, y: A[1] + ey * u + ex * v, nx: -dy / len, ny: dx / len, tx: dx / len, ty: dy / len };
  };
  const pt = (x: number, y: number) => `${x.toFixed(2)} ${y.toFixed(2)}`;
  const out: string[] = [];
  const N = 64;
  for (let i = 0; i <= N; i++) { const q = at((L * i) / N); out.push(pt(q.x + q.nx * W, q.y + q.ny * W)); }
  const e = at(L);                                      // 양 끝을 반원으로 닫는다
  for (let k = 1; k < 14; k++) { const r = (Math.PI * k) / 14, c = Math.cos(r), n = Math.sin(r); out.push(pt(e.x + (e.nx * c + e.tx * n) * W, e.y + (e.ny * c + e.ty * n) * W)); }
  for (let i = N; i >= 0; i--) { const q = at((L * i) / N); out.push(pt(q.x - q.nx * W, q.y - q.ny * W)); }
  const o = at(0);
  for (let k = 1; k < 14; k++) { const r = (Math.PI * k) / 14, c = Math.cos(r), n = Math.sin(r); out.push(pt(o.x - (o.nx * c + o.tx * n) * W, o.y - (o.ny * c + o.ty * n) * W)); }
  return 'M ' + out.join(' L ') + ' Z';
})();
const chip: React.CSSProperties = { display: 'inline-block', padding: '5px 14px', borderRadius: 999, background: 'rgba(251,248,241,0.94)', fontSize: 19, fontWeight: 800 };
function LayersSlide() {
  const { clicks, isStatic } = useDeck();
  const c = isStatic ? 9 : clicks;
  return (
    <>
      <div style={{ ...abs(110, 58), ...kick, fontSize: 16 }}>퍼셉트론 하나로는 못 하는 일</div>
      <h2 style={{ ...abs(110, 92, 1300), ...h2, fontSize: 44 }}>층을 쌓으면 경계가 <span style={accentText}>곡선</span>이 된다</h2>

      {/* 왼쪽 — XOR 평면 */}
      <div style={{ ...abs(150, 250, 470, 470), ...card, padding: 0, background: 'rgba(255,255,255,0.8)' }}>
        <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden>
          <line x1={10} y1={50} x2={90} y2={50} stroke="var(--hair)" strokeWidth={0.6} />
          <line x1={50} y1={10} x2={50} y2={90} stroke="var(--hair)" strokeWidth={0.6} />
          {/* 직선 하나로 가르려는 시도 — 전부 실패 */}
          {c === 2 && TRY_LINES.map((d, i) => <path key={i} d={d} stroke={C.red} strokeWidth={1.4} strokeDasharray="3 2.4" opacity={0.75} fill="none" />)}
          {/* 층을 쌓으면 직선 둘이 띠를 만든다 — 은닉 뉴런 하나가 선 하나 */}
          {c >= 3 && <path d={RIBBON} fill={C.green} opacity={0.15} />}
          {c >= 3 && <path d={RIBBON} fill="none" stroke={C.green} strokeWidth={2.2} strokeLinejoin="round" />}
          {XOR_PTS.map(([x, y, red], i) => (
            <circle key={i} cx={x} cy={y} r={6} fill={red ? C.red : '#3a7bd5'} stroke={C.ink} strokeWidth={1.4} />
          ))}
        </svg>
        {c >= 2 && c < 3 && <div style={{ position: 'absolute', left: 0, right: 0, bottom: 12, textAlign: 'center' }}><span style={{ ...chip, color: C.red }}>직선 하나로는 못 가른다</span></div>}
        {c >= 3 && <div style={{ position: 'absolute', left: 0, right: 0, bottom: 12, textAlign: 'center' }}><span style={{ ...chip, color: C.green }}>곡선이라면 갈린다</span></div>}
      </div>
      <Build at={1} style={abs(150, 736, 470)}>
        <div style={{ ...body, fontSize: 18, ...kw }}>빨간 점과 파란 점을 <b>직선 하나로</b> 갈라 보자. 퍼셉트론 하나가 할 수 있는 일이 딱 이것이다.</div>
      </Build>
      <Build at={2} style={abs(150, 812, 470)}>
        <div style={{ ...body, fontSize: 17, color: C.ink, ...kw }}>어떻게 돌려도 안 된다. 민스키와 페퍼트가 1969년에 이걸 증명했고, 첫 겨울로 이어졌다.</div>
      </Build>

      {/* 오른쪽 — 층을 쌓은 신경망과 역전파 */}
      <Build at={3} style={abs(700, 250, 1120)}>
        <div style={{ ...kick, fontSize: 14 }}>퍼셉트론을 여러 개, 여러 층으로</div>
        <div style={{ ...card, marginTop: 12, padding: '24px 28px', height: 330, position: 'relative' }}>
          <svg viewBox="0 0 1060 280" style={{ position: 'absolute', left: 28, top: 24, width: 1060, height: 280 }} aria-hidden>
            {[[130, 80], [130, 200]].map(([x, y], i) => [[430, 70], [430, 210]].map(([x2, y2], j) => (
              <line key={`a${i}${j}`} x1={x + 34} y1={y} x2={x2 - 34} y2={y2} stroke={C.green} strokeWidth={3} opacity={0.5} />
            )))}
            {[[430, 70], [430, 210]].map(([x, y], i) => (
              <line key={`b${i}`} x1={x + 34} y1={y} x2={716} y2={140} stroke={C.green} strokeWidth={3} opacity={0.5} />
            ))}
            {[[130, 80, '입력'], [130, 200, '입력'], [430, 70, '은닉'], [430, 210, '은닉'], [750, 140, '출력']].map(([x, y, lb], i) => (
              <g key={i}>
                <circle cx={x as number} cy={y as number} r={34} fill={C.paper} stroke={C.green} strokeWidth={3} />
                <text x={x as number} y={(y as number) + 7} textAnchor="middle" fontSize={19} fontWeight={800} fill={C.ink} fontFamily="var(--font-body)">{lb as string}</text>
              </g>
            ))}
            <text x={130} y={258} textAnchor="middle" fontSize={17} fill="var(--fg-muted)" fontFamily="var(--font-body)">입력층</text>
            <text x={430} y={258} textAnchor="middle" fontSize={17} fill="var(--fg-muted)" fontFamily="var(--font-body)">은닉층 — 경계를 구부리는 자리</text>
            <text x={750} y={258} textAnchor="middle" fontSize={17} fill="var(--fg-muted)" fontFamily="var(--font-body)">출력층</text>
            <text x={930} y={146} fontSize={19} fontWeight={800} fill={C.ink} fontFamily="var(--font-body)">답</text>
          </svg>
        </div>
      </Build>
      <Build at={4} style={abs(700, 640, 1120)}>
        <div style={{ ...card, padding: '26px 30px', borderColor: C.amber, background: `${C.amber}0e` }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: C.ink, ...kw }}>층을 쌓으니 경계를 구부릴 수 있게 되었다. 그런데 —</div>
          <div style={{ ...body, fontSize: 21, marginTop: 12, ...kw }}>층이 여러 개면 <b>어느 가중치를 얼마나</b> 고쳐야 할까? 앞 층의 숫자 하나를 건드리면 뒤 층의 답이 통째로 달라진다. 이 문제가 풀리기까지 다시 여러 해가 걸렸다.</div>
        </div>
      </Build>
    </>
  );
}


/* ───────────── S11 역전파 (씬) ─────────────
   메타포: 가중치 손잡이가 달린 배선판 — 오차가 뒤로 흐르며 손잡이마다 "얼마나 돌릴지"가 정해진다.
   숫자는 방향이 맞게 지어낸 예시값이다(실제 계산 결과가 아니라는 점은 발표자 노트에 적는다). */
const BP_IN: [number, number][] = [[360, 372], [360, 632]];
const BP_HID: [number, number][] = [[880, 352], [880, 652]];
const BP_OUT: [number, number] = [1360, 502];
const BP_R = 52;
/* [시작, 끝, 초기 가중치, 고친 뒤, 책임 몫, 칩이 앉는 위치] */
const BP_EDGES: [number[], number[], number, number, number, number][] = [
  [BP_IN[0], BP_HID[0], 0.40, 0.52, 0.12, 0.52],
  [BP_IN[0], BP_HID[1], -0.30, -0.21, 0.09, 0.34],
  [BP_IN[1], BP_HID[0], 0.70, 0.63, -0.07, 0.70],
  [BP_IN[1], BP_HID[1], 0.20, 0.34, 0.14, 0.52],
  [BP_HID[0], BP_OUT, 0.50, 0.68, 0.18, 0.50],
  [BP_HID[1], BP_OUT, -0.60, -0.42, 0.21, 0.50],
];
const BP_STEPS = ['① 앞으로 계산한다', '② 답과 정답의 차이', '③ 차이를 뒤로 보낸다', '④ 가중치를 고친다'];
const BP_T = { FWD: 1.0, ANS: 2.5, TRUTH: 3.3, BACK: 4.2, FIX: 6.5, FWD2: 7.8, DONE: 9.6 };

function BackpropScene() {
  const t = useSceneTime();
  const born = interpolate(t, [0, 0.9], [0, 1], easeOut);
  const fixed = t >= BP_T.FIX + 0.5;                       // 가중치가 갱신된 뒤
  const solved = t >= BP_T.FWD2 + 1.2;                     // 두 번째 계산까지 끝난 뒤
  const step = t >= BP_T.FWD2 ? 0 : t >= BP_T.FIX ? 3 : t >= BP_T.BACK ? 2 : t >= BP_T.ANS ? 1 : 0;
  const allOn = t >= BP_T.DONE;                            // 마무리에서는 네 단계가 한 고리로 보이게

  const fwd1 = interpolate(t, [BP_T.FWD, BP_T.FWD + 1.3], [0, 1], easeInOut);
  const back = interpolate(t, [BP_T.BACK, BP_T.BACK + 1.6], [0, 1], easeInOut);
  const fwd2 = interpolate(t, [BP_T.FWD2, BP_T.FWD2 + 1.2], [0, 1], easeInOut);
  const shrink = (from: number[], to: number[]) => {        // 선을 노드 가장자리에서 끊는다
    const dx = to[0] - from[0], dy = to[1] - from[1], L = Math.hypot(dx, dy) || 1;
    return [from[0] + (dx / L) * BP_R, from[1] + (dy / L) * BP_R, to[0] - (dx / L) * BP_R, to[1] - (dy / L) * BP_R];
  };

  return (
    <>
      <div style={{ ...abs(110, 58), ...kick, fontSize: 16, opacity: born }}>1986년 · 역전파</div>
      <h2 style={{ ...abs(110, 92, 1240), ...h2, fontSize: 44, opacity: born }}>틀린 만큼을 <span style={accentText}>거꾸로</span> 돌려보내 가중치를 고친다</h2>
      <div style={{ ...abs(110, 176, 1180), ...body, fontSize: 24, opacity: born }}>앞 장이 남긴 질문 — <b>어느 가중치를 얼마나</b> 고칠 것인가. 답은 답과 정답의 차이 안에 들어 있다.</div>

      <svg style={{ ...abs(0, 0, DW, DH), pointerEvents: 'none' }} viewBox={'0 0 ' + DW + ' ' + DH} aria-hidden>
        {BP_EDGES.map(([a, b, w0, w1, g, at], i) => {
          const [x1, y1, x2, y2] = shrink(a, b);
          const mx = lerp(x1, x2, at), my = lerp(y1, y2, at);
          const w = fixed ? w1 : w0;
          const grow = interpolate(t, [0.2 + i * 0.08, 0.9 + i * 0.08], [0, 1], easeOut);
          const bump = fixed ? interpolate(t, [BP_T.FIX + 0.4 + i * 0.09, BP_T.FIX + 0.8 + i * 0.09], [1.16, 1], easeOut) : 1;
          const badge = t >= BP_T.BACK + 0.7 && t < BP_T.FIX + 1.4
            ? interpolate(t, [BP_T.BACK + 0.7, BP_T.BACK + 1.1], [0, 1]) * interpolate(t, [BP_T.FIX + 0.9, BP_T.FIX + 1.4], [1, 0])
            : 0;
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.green} strokeWidth={3 + Math.abs(w) * 10} opacity={0.32 * grow} strokeLinecap="round" />
              {/* 가중치 손잡이 */}
              <g opacity={grow} transform={'translate(' + mx + ' ' + my + ') scale(' + bump + ')'}>
                <rect x={-54} y={-20} width={108} height={40} rx={20} fill={C.paper} stroke={w >= 0 ? C.green : C.red} strokeWidth={2.6} />
                <text x={0} y={7} textAnchor="middle" fontSize={22} fontWeight={800} fill={C.ink} fontFamily="var(--font-mono)">{w.toFixed(2)}</text>
              </g>
              {/* 뒤에서 도착한 책임 몫 */}
              {badge > 0 && (
                <g opacity={badge}>
                  <rect x={mx - 42} y={my - 62} width={84} height={34} rx={9} fill={C.amber} />
                  <text x={mx} y={my - 38} textAnchor="middle" fontSize={20} fontWeight={800} fill="#fff" fontFamily="var(--font-mono)">{(g > 0 ? '+' : '') + g.toFixed(2)}</text>
                </g>
              )}
              {/* 선 위를 달리는 펄스 — 앞으로는 초록, 뒤로는 앰버 */}
              {([[fwd1, 0], [fwd2, 0], [back, 1]] as [number, number][]).map(([prog, rev], k) => {
                if (prog <= 0 || prog >= 1) return null;
                const u = rev ? 1 - prog : prog;
                return <circle key={k} cx={lerp(x1, x2, u)} cy={lerp(y1, y2, u)} r={11} fill={rev ? C.amber : C.green} />;
              })}
            </g>
          );
        })}
        {/* 노드 */}
        {([[BP_IN[0], '입력 1'], [BP_IN[1], '입력 2'], [BP_HID[0], '은닉 1'], [BP_HID[1], '은닉 2'], [BP_OUT, '출력']] as [number[], string][]).map(([n, lb], i) => (
          <g key={i} opacity={born}>
            <circle cx={n[0]} cy={n[1]} r={BP_R} fill={C.paper} stroke={C.green} strokeWidth={4} />
            <text x={n[0]} y={n[1] + 8} textAnchor="middle" fontSize={22} fontWeight={800} fill={C.ink} fontFamily="var(--font-body)">{lb}</text>
          </g>
        ))}
        {/* 오차가 되돌아가는 굵은 화살표 */}
        {t >= BP_T.BACK && t < BP_T.FIX + 0.6 && (
          <g opacity={interpolate(t, [BP_T.BACK, BP_T.BACK + 0.4], [0, 1]) * interpolate(t, [BP_T.FIX, BP_T.FIX + 0.6], [1, 0])}>
            <path d="M 1320 782 L 424 782" stroke={C.amber} strokeWidth={7} strokeLinecap="round" strokeDasharray="20 14" />
            <path d="M 400 782 L 436 764 L 436 800 Z" fill={C.amber} />
            <text x={880} y={756} textAnchor="middle" fontSize={23} fontWeight={800} fill="#9a6d0f" fontFamily="var(--font-body)">차이를 출력 쪽에서 입력 쪽으로</text>
          </g>
        )}
      </svg>

      {/* 오른쪽 — 답과 정답, 그리고 차이 */}
      {t >= BP_T.ANS && (
        <div style={{ ...abs(1560, 262, 300), ...card, padding: '18px 22px', opacity: interpolate(t, [BP_T.ANS, BP_T.ANS + 0.4], [0, 1]) }}>
          <div style={{ ...kick, fontSize: 13, color: 'var(--fg-muted)' }}>모델의 답</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: solved ? C.green : C.red, marginTop: 6, ...kw }}>{solved ? '치와와 0.61' : '머핀 0.72'}</div>
        </div>
      )}
      {t >= BP_T.TRUTH && (
        <div style={{ ...abs(1560, 400, 300), ...card, padding: '18px 22px', borderColor: C.green, opacity: interpolate(t, [BP_T.TRUTH, BP_T.TRUTH + 0.4], [0, 1]) }}>
          <div style={{ ...kick, fontSize: 13, color: 'var(--fg-muted)' }}>정답</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: C.ink, marginTop: 6, ...kw }}>치와와</div>
        </div>
      )}
      {t >= BP_T.TRUTH + 0.5 && (
        <div style={{ ...abs(1560, 542, 320), opacity: interpolate(t, [BP_T.TRUTH + 0.5, BP_T.TRUTH + 0.9], [0, 1]) }}>
          <div style={{ ...kick, fontSize: 13, color: 'var(--fg-muted)' }}>답과 정답의 차이</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4 }}>
            <span style={{ fontSize: 44, fontWeight: 900, color: solved ? C.green : C.red, fontFamily: 'var(--font-mono)' }}>{solved ? '0.39' : '0.72'}</span>
            {solved && <span style={{ fontSize: 21, fontWeight: 800, color: C.green }}>↓ 줄었다</span>}
          </div>
          <div style={{ width: 300, height: 14, borderRadius: 7, background: 'rgba(29,42,38,0.08)', marginTop: 8, overflow: 'hidden' }}>
            <div style={{ width: ((solved ? 39 : 72) * interpolate(t, [BP_T.TRUTH + 0.5, BP_T.TRUTH + 1.1], [0, 1])) + '%', height: '100%', background: solved ? C.green : C.red }} />
          </div>
        </div>
      )}

      {/* 아래 — 네 단계가 한 바퀴를 이룬다 */}
      <div style={{ ...abs(110, 872, 1700), display: 'flex', gap: 14, opacity: born }}>
        {BP_STEPS.map((lb, i) => (
          <div key={i} style={{ flex: 1, padding: '14px 18px', borderRadius: 14, border: '2px solid ' + (allOn || i === step ? C.green : 'var(--hair)'), background: allOn || i === step ? C.green + '14' : 'rgba(255,255,255,0.5)', fontSize: 21, fontWeight: 800, color: allOn || i === step ? C.green : 'var(--fg-muted)', textAlign: 'center', ...kw }}>{lb}</div>
        ))}
      </div>
      {t >= BP_T.DONE && (
        <div style={{ ...abs(110, 960, 1700), fontSize: 25, fontWeight: 800, color: C.ink, opacity: interpolate(t, [BP_T.DONE, BP_T.DONE + 0.5], [0, 1]), ...kw }}>
          이 한 바퀴를 수백만 번 돈다. <span style={accentText}>배운다는 것은 이 숫자들이 조금씩 제자리를 찾아가는 일</span>이다.
        </div>
      )}
    </>
  );
}

/* ───────────── S8 뉴런 위 퍼셉트론 (씬) ───────────── */
/* 뉴런 이미지의 랜드마크(설계 박스 px) — 이미지가 도착한 뒤 픽셀 검수로 맞춘다 */
const NEU = { x: 80, y: 300, w: 1180, h: 520, dend: [[250, 420], [230, 560], [250, 700]], soma: [470, 545], axonEnd: [1230, 560] } as const;
function PerceptronScene() {
  const t = useSceneTime();
  const img = interpolate(t, [0, 1.5], [0, 1]);
  const w = [0.6, 0.3, 0.8]; const x = [1, 0, 1];
  const w2 = t >= 6.8 ? 0.5 : 0.3;
  const sum = interpolate(t, [4.6, 5.6], [0, 1]) * (0.6 * 1 + 0.3 * 0 + 0.8 * 1);
  const sum2 = 0.6 * 1 + w2 * 0 + 0.8 * 1;
  const shown = t >= 6.8 ? sum2 : sum;
  const fire = t >= 5.7;
  const lineP = (i: number) => interpolate(t, [1.6 + i * 0.5, 2.1 + i * 0.5], [0, 1], easeOut);
  return (
    <>
      <Sprite src={`${SPR}/neuron.png`} alt="뉴런 단면" style={{ ...abs(NEU.x, NEU.y, NEU.w, NEU.h), opacity: img }} />
      <svg style={{ ...abs(0, 0, DW, DH), pointerEvents: 'none' }} viewBox={`0 0 ${DW} ${DH}`} aria-hidden>
        {NEU.dend.map(([dx, dy], i) => (
          <g key={i}>
            <line x1={dx - 120} y1={dy} x2={NEU.soma[0] - 70} y2={NEU.soma[1]} stroke={C.green} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - lineP(i)} />
            <circle cx={dx - 150} cy={dy} r={26} fill={C.paper} stroke={C.green} strokeWidth={4} opacity={lineP(i)} />
            <text x={dx - 150} y={dy + 8} textAnchor="middle" fontSize={22} fontWeight={800} fill={C.ink} fontFamily="var(--font-mono)" opacity={lineP(i)}>x{i + 1}={x[i]}</text>
            <rect x={dx + 60} y={lerp(dy, NEU.soma[1], 0.45) - 22} width={92} height={36} rx={8} fill={C.amber} opacity={interpolate(t, [4.0 + i * 0.25, 4.3 + i * 0.25], [0, 1])} />
            <text x={dx + 106} y={lerp(dy, NEU.soma[1], 0.45) + 4} textAnchor="middle" fontSize={20} fontWeight={800} fill="#fff" fontFamily="var(--font-mono)" opacity={interpolate(t, [4.0 + i * 0.25, 4.3 + i * 0.25], [0, 1])}>w{i + 1}={(i === 1 ? w2 : w[i]).toFixed(1)}</text>
          </g>
        ))}
        {/* 세포체 = 가중합 */}
        <circle cx={NEU.soma[0]} cy={NEU.soma[1]} r={70} fill="rgba(251,248,241,0.92)" stroke={C.green} strokeWidth={5} opacity={interpolate(t, [3.2, 3.7], [0, 1])} />
        <text x={NEU.soma[0]} y={NEU.soma[1] - 10} textAnchor="middle" fontSize={34} fontWeight={800} fill={C.green} fontFamily="var(--font-mono)" opacity={interpolate(t, [3.2, 3.7], [0, 1])}>Σ</text>
        <text x={NEU.soma[0]} y={NEU.soma[1] + 30} textAnchor="middle" fontSize={22} fontWeight={800} fill={C.ink} fontFamily="var(--font-mono)" opacity={interpolate(t, [4.6, 4.9], [0, 1])}>{shown.toFixed(1)}</text>
        {/* 축삭 = 출력 */}
        <line x1={NEU.soma[0] + 72} y1={NEU.soma[1]} x2={NEU.axonEnd[0]} y2={NEU.axonEnd[1]} stroke={fire ? C.amber : C.green} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - interpolate(t, [3.6, 4.2], [0, 1], easeOut)} />
        <path d={`M ${NEU.axonEnd[0] - 22} ${NEU.axonEnd[1] - 16} L ${NEU.axonEnd[0]} ${NEU.axonEnd[1]} L ${NEU.axonEnd[0] - 22} ${NEU.axonEnd[1] + 16}`} fill="none" stroke={fire ? C.amber : C.green} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={interpolate(t, [4.0, 4.2], [0, 1])} />
        <rect x={NEU.axonEnd[0] + 16} y={NEU.axonEnd[1] - 30} width={150} height={60} rx={12} fill={fire ? C.amber : C.paper} stroke={C.ink} strokeWidth={3} opacity={interpolate(t, [4.2, 4.5], [0, 1])} />
        <text x={NEU.axonEnd[0] + 91} y={NEU.axonEnd[1] + 9} textAnchor="middle" fontSize={24} fontWeight={800} fill={fire ? '#fff' : C.ink} fontFamily="var(--font-mono)" opacity={interpolate(t, [4.2, 4.5], [0, 1])}>{fire ? '출력 1' : '출력 ?'}</text>
      </svg>
      {/* 우측 상단 텍스트 밴드 */}
      <div style={{ ...abs(1300, 90), ...kick }}>뉴런을 흉내낸 스위치</div>
      <h2 style={{ ...abs(1300, 124, 560), ...h2, fontSize: 36 }}>퍼셉트론 — <span style={accentText}>뉴런을 수학으로</span> 옮긴 것</h2>
      <div style={{ ...abs(1300, 300, 540), ...body, fontSize: 18, ...riseIn(t, 1.8) }}>가지돌기로 받은 신호가 세포체에서 합쳐지고, 충분히 크면 축삭으로 발화한다. 퍼셉트론은 그 대응을 한 줄로 적는다.</div>
      <div style={{ ...abs(1300, 400, 540), ...card, padding: '14px 18px', ...riseIn(t, 4.6) }}>
        <div style={{ ...mono, fontSize: 22, fontWeight: 800, color: C.ink }}>Σ wᵢxᵢ = {shown.toFixed(1)} {fire ? '>' : '?'} 임계값 1.0 → 출력 {fire ? '1' : '?'}</div>
        <div style={{ ...body, fontSize: 15, marginTop: 6 }}>0.6·1 + {w2.toFixed(1)}·0 + 0.8·1 — 입력 × 가중치의 합이 임계값을 넘으면 1</div>
      </div>
      <div style={{ ...abs(1300, 660, 540), ...card, padding: '14px 18px', background: `${C.amber}14`, borderColor: C.amber, ...riseIn(t, 6.6) }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.ink, ...kw }}>배운다 = 가중치를 바꾼다</div>
        <div style={{ ...body, fontSize: 15, marginTop: 4 }}>틀리면 w를 조금 고친다 — 규칙을 사람이 쓰지 않는다. (w₂ 0.3 → 0.5, 합은 그대로: x₂가 0이라 이번 예시엔 영향이 없다 — 그래서 다음 예시에서 고쳐진다)</div>
      </div>
      <div style={{ ...abs(1300, 830), display: 'flex', gap: 8, flexWrap: 'wrap', width: 540, ...riseIn(t, 2.4) }}>
        {['매컬록·피츠 1943', '로젠블랫 1958', 'Mark I 퍼셉트론 1960'].map((c) => <span key={c} style={{ ...mono, fontSize: 13, padding: '4px 10px', borderRadius: 999, background: C.paper, border: '1px solid var(--hair)', color: 'var(--fg-muted)' }}>{c}</span>)}
      </div>
      <div style={{ ...abs(110, 1010), ...mono, fontSize: 12.5, color: 'var(--fg-faint)' }}>뉴런 그림: 생성 일러스트(회화적 단면) · 숫자는 모두 실제 계산</div>
    </>
  );
}

/* ───────────── S9 지층 연표 (씬) ───────────── */
type Layer = { y: string; label: string; h: number; kind: 'green' | 'ice' | 'sand' | 'amber'; inner?: string };
const LAYERS: Layer[] = [
  { y: '1958', label: '퍼셉트론 — 뉴런 하나를 흉내낸 학습 모델', h: 48, kind: 'green', inner: '학습의 시작' },
  { y: '1969', label: '『Perceptrons』 — 한 층으로는 XOR을 못 푼다', h: 46, kind: 'sand', inner: '한계 증명' },
  { y: '1974~80', label: '첫 AI 겨울 — 기대가 꺾이고 연구 지원이 줄었다', h: 60, kind: 'ice', inner: 'AI 겨울' },
  { y: '1986', label: '역전파 — 각 가중치가 오차에 미치는 영향을 거슬러 계산한다', h: 58, kind: 'green', inner: '다층 신경망을 가르치는 법' },
  { y: '1987~93', label: '둘째 AI 겨울 — 전문가 시스템의 한계', h: 56, kind: 'ice', inner: 'AI 겨울' },
  { y: '1990s', label: '통계적 기계학습(SVM 등)', h: 58, kind: 'sand', inner: '특징은 사람이 설계' },
  { y: '2012', label: 'AlexNet — ImageNet 톱-5 오류 15.3%', h: 72, kind: 'green', inner: '층이 깊어진다' },
  { y: '2016', label: '알파고 — 이세돌 4국 백 78수', h: 70, kind: 'green', inner: '' },
  { y: '2017 · 2022', label: '트랜스포머 · ChatGPT', h: 76, kind: 'green', inner: '' },
  { y: '2024', label: '노벨 물리학상 — 홉필드 · 힌턴', h: 36, kind: 'amber', inner: '' },
];
function StrataScene() {
  const t = useSceneTime();
  const X = 300, W = 900, BOTTOM = 1000;
  let yTop = BOTTOM;
  const fills = { green: C.green, ice: C.ice, sand: C.sand, amber: C.amber };
  const total = LAYERS.length;
  const done = t >= 0.5 + total * 0.55 + 0.4;
  return (
    <>
      <div style={{ ...abs(110, 70), ...kick }}>겨울을 지나 깊어지다</div>
      <h2 style={{ ...abs(110, 104, 1060), ...h2, fontSize: 40 }}>층을 쌓고 뒤에서 가르치는 법이 <span style={accentText}>딥러닝</span>을 열었다</h2>
      {LAYERS.map((L, i) => {
        yTop -= L.h;
        const y = yTop;
        const p = interpolate(t, [0.5 + i * 0.55, 0.9 + i * 0.55], [0, 1], easeOut);
        const fill = fills[L.kind];
        const isGreen = L.kind === 'green';
        return (
          <div key={L.y}>
            <div style={{ ...abs(X, y + L.h * (1 - p), W, L.h * p), background: fill, opacity: isGreen ? 0.55 + i * 0.05 : L.kind === 'amber' ? 1 : 0.9, borderTop: `2px solid ${isGreen ? C.green : L.kind === 'ice' ? '#9fbccb' : L.kind === 'amber' ? '#b8841a' : '#a8956e'}`, boxSizing: 'border-box' }} />
            {/* 층 안에 이름 — 색을 못 읽어도 구별되게 */}
            {L.inner && <div style={{ ...abs(X + 22, y + L.h / 2 - 11, W - 44), opacity: p, fontSize: 15, fontWeight: 800, color: L.kind === 'ice' ? '#40647a' : L.kind === 'sand' ? '#6b5a33' : isGreen ? '#f2f7f3' : '#5a4208', ...kw }}>{L.inner}</div>}
            <div style={{ ...abs(X + W + 24, y + L.h / 2 - 16), display: 'flex', gap: 12, alignItems: 'center', opacity: p, whiteSpace: 'nowrap' }}>
              <span style={{ ...mono, fontWeight: 800, fontSize: 17, color: L.kind === 'ice' ? '#5b7f92' : isGreen ? C.green : L.kind === 'amber' ? '#9a6d0f' : '#7c6a45', width: 110 }}>{L.y}</span>
              <span style={{ fontSize: 17, fontWeight: 700, color: C.ink, ...kw }}>{L.label}</span>
            </div>
            {L.y === '2016' && (
              <>
                <div style={{ ...abs(114, y - 20, 172, 108), opacity: p, borderRadius: 8, overflow: 'hidden', border: `3px solid ${C.paper}`, boxShadow: '0 10px 22px -10px rgba(0,0,0,0.55)' }}>
                  <Sprite src={GO_RECORD} alt="알파고 대 이세돌 4국 기보" fit="cover" style={{ width: '100%', height: '100%' }} />
                </div>
                <div style={{ ...abs(114, y + 92, 172), opacity: p, ...mono, fontSize: 12.5, fontWeight: 800, color: C.green }}>2016 알파고 4국 →</div>
              </>
            )}
          </div>
        );
      })}
      <div style={{ ...abs(X, 1000, W, 3), background: C.ink }} />
      <div style={{ ...abs(110, 216, 170), ...mono, fontSize: 13, color: 'var(--fg-faint)', ...kw }}>시간은 아래에서 위로 쌓인다. 층의 두께는 기간이나 성능을 뜻하지 않는다.</div>
      <div style={{ ...abs(110, 790, 170), ...card, padding: '12px 14px', ...riseIn(t, 2.5) }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.ink, ...kw }}>겨울이 온 이유</div>
        <div style={{ ...body, fontSize: 13.5, marginTop: 4 }}>기술의 한계와 과도한 기대가 겹쳐 연구 지원이 줄었다. 한 가지 원인으로 설명되지 않는다.</div>
      </div>
      <div style={{ ...abs(1300, 216, 520), ...card, padding: '14px 18px', background: `${C.green}14`, borderColor: C.green, opacity: done ? 1 : 0, transform: done ? 'none' : 'translateY(10px)', transition: 'opacity .5s, transform .5s' }}>
        <div style={{ ...kick, fontSize: 12 }}>깊어진 이유 — 데이터 · GPU · 층의 깊이</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.green, marginTop: 4, ...kw }}>무엇을 볼지까지 기계가 배운다</div>
      </div>
      <div style={{ ...abs(110, 1030), ...mono, fontSize: 12, color: 'var(--fg-faint)' }}>기보 이미지: Wesalius · CC BY-SA 4.0 · Wikimedia Commons</div>
    </>
  );
}

/* ───────────── S10 세 시대의 차이 (static) ───────────── */
function Who({ who }: { who: '사람' | '기계' }) {
  const m = who === '기계';
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 999, background: m ? C.green : 'transparent', color: m ? '#fff' : C.ink, border: `2px solid ${m ? C.green : C.ink}`, fontWeight: 800, fontSize: 20 }}><span style={{ width: 12, height: 12, borderRadius: m ? 3 : 6, background: m ? '#fff' : C.ink }} />{who}</span>;
}
function ErasSlide() {
  const cols: [string, string, string][] = [
    ['규칙 기반', '판단할 때 입력 데이터는 쓰지만, 규칙을 데이터로 배우지는 않는다 · 예: MYCIN', '1950s~80s'],
    ['기계학습', '사람이 정한 특징을 보고 기계가 기준을 찾는다 · 예: 스팸 필터', '1990s~'],
    ['딥러닝', '무엇을 볼지까지 기계가 배운다 · 예: 이미지 인식 · LLM', '2012~'],
  ];
  const rows: [string, ('사람' | '기계')[]][] = [['판단 기준을 누가 만드나?', ['사람', '기계', '기계']], ['무엇을 볼지(특징)를 누가 정하나?', ['사람', '사람', '기계']]];
  const widths = [340, 430, 560];
  const xs = [430, 790, 1240];
  return (
    <>
      <div style={{ ...abs(110, 70), ...kick }}>세 시대의 차이</div>
      <h2 style={{ ...abs(110, 104, 1300), ...h2, fontSize: 42 }}>기준은 누가 만들고, <span style={accentText}>무엇을 볼지는 누가</span> 정하는가</h2>
      {cols.map(([n, ex, yr], i) => (
        <div key={n} style={{ ...abs(xs[i], 250, widths[i]) }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: i === 2 ? C.green : C.ink, ...kw }}>{n}</div>
          <div style={{ ...mono, fontSize: 13, color: 'var(--fg-faint)', marginTop: 2 }}>{yr}</div>
        </div>
      ))}
      {rows.map(([q, cells], r) => (
        <div key={q}>
          <div style={{ ...abs(110, 360 + r * 180, 300, 140), display: 'flex', alignItems: 'center', fontSize: 26, fontWeight: 800, color: C.ink, ...kw }}>{q}</div>
          {cells.map((c, i) => (
            <div key={i} style={{ ...abs(xs[i], 360 + r * 180, widths[i] - 30, 140), ...card, display: 'grid', placeItems: 'center', background: c === '기계' ? `${C.green}12` : 'rgba(255,255,255,0.72)' }}><Who who={c} /></div>
          ))}
        </div>
      ))}
      <div style={{ ...abs(110, 720, 1700, 2), background: 'var(--hair)' }} />
      {cols.map(([, ex], i) => <div key={i} style={{ ...abs(xs[i], 740, widths[i] - 30), ...body, fontSize: 16 }}>{ex}</div>)}
      <div style={{ ...abs(790, 830, 1010, 110), borderRadius: 18, border: `2px dashed ${C.amber}`, display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px', boxSizing: 'border-box' }}>
        <span style={{ ...mono, fontSize: 12, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: C.amber, color: '#fff' }}>이어서</span>
        <span style={{ ...body, fontSize: 18, color: C.ink }}>기계가 규칙을 찾는 방법은 세 가지 — 지도학습 · 비지도학습 · 강화학습. 이 두 칸 안의 이야기다.</span>
      </div>
      <div style={{ ...abs(110, 980), ...body, fontSize: 17 }}>왼쪽으로 갈수록 사람이, 오른쪽으로 갈수록 기계가 맡는다.</div>
    </>
  );
}

/* ───────────── S11 더 나아가는 방향 (build) ───────────── */
function Sprout({ x, y, h, lean, amber }: { x: number; y: number; h: number; lean: number; amber?: boolean }) {
  const col = amber ? C.amber : C.green;
  return (
    <svg style={{ ...abs(x - 80, y - h, 160, h), overflow: 'visible' }} viewBox={`0 0 160 ${h}`} aria-hidden>
      <path d={`M 80 ${h} C ${80 + lean * 0.3} ${h * 0.6}, ${80 + lean} ${h * 0.35}, ${80 + lean} 30`} fill="none" stroke={col} strokeWidth={6} strokeLinecap="round" />
      <path d={`M ${80 + lean} 40 C ${40 + lean} 30, ${30 + lean} 0, ${70 + lean} 4 C ${90 + lean} 10, ${85 + lean} 30, ${80 + lean} 40 Z`} fill={C.leaf} stroke={col} strokeWidth={3} />
      <path d={`M ${80 + lean} 40 C ${120 + lean} 30, ${130 + lean} 0, ${90 + lean} 4 C ${70 + lean} 10, ${75 + lean} 30, ${80 + lean} 40 Z`} fill={C.leaf} stroke={col} strokeWidth={3} />
      {amber && <circle cx={80 + lean} cy={18} r={14} fill={C.amber} stroke={C.ink} strokeWidth={2} />}
    </svg>
  );
}
function DirectionsSlide() {
  const items: [string, string, string, boolean][] = [
    ['생각하는 시간을 배운다', '답하기 전에 풀이를 길게 쓰도록 강화학습으로 훈련한 추론 모델 — o1(2024-09)', '', false],
    ['세계를 시뮬레이션한다', '영상·물리 세계의 다음 상태를 예측하는 월드 모델', '예측', false],
    ['뇌의 배선을 그대로 읽는다', '커넥톰 — 초파리 중추신경계 전체, 뉴런 166,000개의 지도(2026-09)', '', true],
  ];
  const xs = [360, 900, 1450];
  const hs = [200, 320, 260];
  return (
    <>
      <div style={{ ...abs(110, 70), ...kick }}>세 가지 너머 — 더 나아가는 방향</div>
      <h2 style={{ ...abs(110, 104, 1340), ...h2, fontSize: 40 }}>지금 연구는 <span style={accentText}>무엇을 학습 신호로 삼을지</span>를 바꾸고 있다</h2>
      <div style={{ ...abs(0, 880, DW, 14), background: C.amber, opacity: 0.9 }} />
      <div style={{ ...abs(110, 906, 900), ...mono, fontSize: 13, color: '#9a6d0f', ...kw }}>여기까지가 지금 쓰이는 세 가지 학습 방법이다. 연구는 그 너머로 가고 있다.</div>
      {items.map(([n, d, tag, amber], i) => (
        <Build key={n} at={i + 1} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <Sprout x={xs[i]} y={880} h={hs[i]} lean={[-30, 10, 34][i]} amber={amber} />
          <div style={{ ...abs(xs[i] - 200, 880 - hs[i] - 190, 400), ...card, padding: '14px 18px', pointerEvents: 'auto', borderColor: amber ? C.amber : 'var(--hair)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{tag && <span style={{ ...mono, fontSize: 11, fontWeight: 800, padding: '2px 7px', borderRadius: 6, background: C.amber, color: '#fff' }}>{tag}</span>}<span style={{ fontSize: 22, fontWeight: 800, color: C.ink, ...kw }}>{n}</span></div>
            <div style={{ ...body, fontSize: 15, marginTop: 6 }}>{d}</div>
          </div>
        </Build>
      ))}
      <Build at={4} style={abs(110, 960, 1400)}>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.green, ...kw }}>세 갈래 모두 — 무엇을 보고 배우느냐를 바꾼다</div>
      </Build>
    </>
  );
}

/* ───────────── S12 두 책상의 사진 더미 (씬) ───────────── */
const CARD_KINDS = ['cat', 'car', 'cup'] as const;
const CARD_KO = { cat: '고양이', car: '자동차', cup: '컵' };
const CARDS = Array.from({ length: 12 }, (_, i) => ({ kind: CARD_KINDS[i % 3], n: Math.floor(i / 3) + 1, i }));
const PILE = (() => { const r = mulberry32(12); return CARDS.map(() => ({ dx: (r() - 0.5) * 60, dy: (r() - 0.5) * 40, rot: (r() - 0.5) * 30 })); })();
function SortScene() {
  const t = useSceneTime();
  const cw = 96, ch = 120;
  const center = [960, 330];
  const leftSlot = (k: number, j: number) => [300 + k * 170 + j * 8, 640 + j * 5];
  /* 오른쪽은 클래스와 무관한 다른 기준으로 묶인다 — 비지도는 이름을 알아내지 못한다 */
  const rightSlot = (i: number) => { const r = mulberry32(50 + i); return [1372 + (i % 2) * 214 + (r() - 0.5) * 46, 648 + (r() - 0.5) * 84]; };
  const HESITANT = 9;   // 회색 고양이 — 두 무더기 사이에서 멈춘다
  return (
    <>
      <div style={{ ...abs(110, 70), ...kick }}>레이블이 있을 때, 없을 때</div>
      <h2 style={{ ...abs(110, 104, 1560), ...h2, fontSize: 40 }}>지도학습은 <span style={accentText}>목표 레이블</span>에 맞추고, 비지도학습은 레이블 없이 <span style={accentText}>구조</span>를 찾는다</h2>
      {/* 책상 둘 */}
      <div style={{ ...abs(150, 520, 640, 340), borderRadius: 20, background: `${C.sand}55`, border: `2px solid ${C.sand}` }} />
      <div style={{ ...abs(1300, 520, 480, 340), borderRadius: 20, background: `${C.sand}55`, border: `2px solid ${C.sand}` }} />
      <div style={{ ...abs(150, 474), fontSize: 24, fontWeight: 800, color: C.green, zIndex: 5 }}>지도학습 — 레이블 있음</div>
      <div style={{ ...abs(1300, 474), fontSize: 24, fontWeight: 800, color: C.ink, zIndex: 5 }}>비지도학습 — 레이블 없음</div>
      {/* 더미 자리 — 카드가 떠난 뒤에도 자리는 남는다 */}
      {CARDS.map((c, i) => <div key={`g${i}`} style={{ ...abs(center[0] + PILE[i].dx - cw / 2, center[1] + PILE[i].dy - ch / 2, cw, ch), transform: `rotate(${PILE[i].rot}deg)`, borderRadius: 6, border: `1.5px dashed ${C.moss}66` }} />)}
      {/* 클래스 이름표 (왼쪽) — 레이블이 정한 세 갈래 */}
      {CARD_KINDS.map((k, i) => (
        <div key={k} style={{ ...abs(240 + i * 170, 790, 140, 36), borderRadius: 8, background: C.amber, color: '#fff', fontWeight: 800, fontSize: 15, display: 'grid', placeItems: 'center', opacity: interpolate(t, [0.8 + i * 0.2, 1.1 + i * 0.2], [0, 1]) }}>클래스: {CARD_KO[k]}</div>
      ))}
      {/* 무더기 이름 (오른쪽) — 이름이 붙지 않는다 */}
      {[0, 1].map((g) => (
        <div key={g} style={{ ...abs(1322 + g * 214, 790, 140, 36), borderRadius: 8, border: `2px dashed ${C.moss}`, color: C.moss, fontWeight: 800, fontSize: 15, display: 'grid', placeItems: 'center', opacity: interpolate(t, [5.6, 6.0], [0, 1]) }}>무더기 {['①', '②'][g]} · ?</div>
      ))}
      {/* 카드 — 더미 → 왼쪽 클래스별 (레이블 붙음) → 오른쪽 무더기 (레이블 없음) */}
      {CARDS.map((c, i) => {
        const k = CARD_KINDS.indexOf(c.kind); const j = c.n - 1;
        const p0 = [center[0] + PILE[i].dx, center[1] + PILE[i].dy];
        const p1 = leftSlot(k, j); const p2 = rightSlot(i);
        const a = interpolate(t, [1.2 + i * 0.22, 1.9 + i * 0.22], [0, 1], easeInOut);
        const b = interpolate(t, [4.4 + i * 0.22, 5.1 + i * 0.22], [0, 1], easeInOut);
        const rx = i === HESITANT ? 1482 : p2[0];     // 망설이는 카드는 두 무더기 사이에 남는다
        const ry = i === HESITANT ? 560 : p2[1];
        const lx = lerp(p0[0], p1[0], a), ly = lerp(p0[1], p1[1], a);
        const rX = lerp(p0[0], rx, b), rY = lerp(p0[1], ry, b);
        const rot = PILE[i].rot * (1 - a);
        const bigTag = i < 3;                          // 클래스마다 한 장은 이름표를 크게
        return (
          <div key={i}>
            <div style={{ ...abs(lx - cw / 2, ly - ch / 2, cw, ch), transform: `rotate(${rot}deg)`, zIndex: bigTag ? 3 : 2 }}>
              <Sprite src={`${SPR}/card-${c.kind}-${c.n}.png`} alt={`${CARD_KO[c.kind]} 사진`} style={{ width: cw, height: ch }} />
              <div style={{ position: 'absolute', left: bigTag ? -10 : -6, top: bigTag ? -14 : -10, padding: bigTag ? '4px 12px' : '2px 8px', borderRadius: 6, background: C.amber, color: '#fff', fontWeight: 800, fontSize: bigTag ? 16 : 12, opacity: interpolate(t, [1.5 + i * 0.22, 1.8 + i * 0.22], [0, 1]), transform: 'rotate(-8deg)' }}>{CARD_KO[c.kind]}</div>
            </div>
            <div style={{ ...abs(rX - cw / 2, rY - ch / 2, cw, ch), transform: `rotate(${PILE[i].rot * 0.4}deg)`, opacity: b > 0 ? 1 : 0, zIndex: i === HESITANT ? 4 : 1 }}>
              <Sprite src={`${SPR}/card-${c.kind}-${c.n}.png`} alt={`${CARD_KO[c.kind]} 사진`} style={{ width: cw, height: ch }} />
              {i === HESITANT && <div style={{ position: 'absolute', left: -8, top: -12, width: 26, height: 26, borderRadius: 13, background: C.moss, color: '#fff', fontWeight: 900, fontSize: 16, display: 'grid', placeItems: 'center', opacity: interpolate(t, [7.2, 7.6], [0, 1]) }}>?</div>}
            </div>
          </div>
        );
      })}
      {/* 망설이는 카드에서 두 무더기로 가는 점선 */}
      <svg style={{ ...abs(0, 0, DW, DH), pointerEvents: 'none', zIndex: 3 }} viewBox={`0 0 ${DW} ${DH}`} aria-hidden>
        {[0, 1].map((g) => <path key={g} d={`M 1482 590 L ${1372 + g * 214} 640`} stroke={C.moss} strokeWidth={3} strokeDasharray="7 8" opacity={interpolate(t, [7.4, 7.9], [0, 0.85])} />)}
      </svg>
      <div style={{ ...abs(900, 440), ...mono, fontSize: 13, color: 'var(--fg-faint)', opacity: interpolate(t, [0.2, 0.6], [0, 1]) }}>같은 사진 12장</div>
      <div style={{ ...abs(1300, 876, 520), ...mono, fontSize: 14, fontWeight: 800, color: '#9a6d0f', opacity: interpolate(t, [7.6, 8.1], [0, 1]), ...kw }}>무더기에 이름은 붙지 않는다 — 무엇을 닮았다고 보느냐에 따라 다르게 묶인다</div>
      <div style={{ ...abs(150, 900, 1100), ...body, fontSize: 16 }}>왼쪽: 레이블에 맞도록 가중치를 고친다(분류·예측 — 오늘 실습) · 오른쪽: 닮은 것끼리 묶을 뿐, 그 묶음이 고양이인지 컵인지는 알지 못한다</div>
    </>
  );
}

/* ───────────── S13 게임 무대 + 학습 곡선 (씬) ───────────── */
/* 시행별 보상 — 무대의 코인 위치(0.5 · 0.9 · 0.97)와 각 시행의 도달 거리에서 나온 값. 시행 1=0, 5=1, 20=3은 무대 재생과 같다 */
const REWARDS = [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3];
const EPIS = [0, 4, 19];   // 시행 1·5·20
const SEG_DUR = 3.7;
/* 무대 좌표 (무대 내부 px) */
const ST = { SX: 110, SY: 246, SW: 1060, SH: 540, R: 34, START: 66, WALL: 330, WALL_H: 152, PIT_A: 556, PIT_B: 706, GOAL: 940 };
const COIN_X = [468, 790, 880];
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
/** 시행별 경로 — u(시행 안 경과 초)의 순수 함수 */
function runEpisode(seg: number, u: number) {
  const { R, START, WALL, PIT_A } = ST;
  const stop = WALL - R - 5;
  let x = START, lift = 0, fell = false, hitWall = false;
  if (seg === 0) {
    // 점프를 모른다 — 벽에 부딪혀 튕긴다
    x = interpolate(u, [0.45, 1.7], [START, stop], easeInOut);
    if (u >= 1.7) { hitWall = true; x = stop - interpolate(u, [1.7, 2.0], [0, 30], easeOut); }
  } else if (seg === 1) {
    // 벽은 넘지만 구멍에 빠진다
    x = interpolate(u, [0.3, 1.05], [START, 282], easeInOut);
    if (u >= 1.05) { const k = clamp01((u - 1.05) / 0.72); x = 282 + (404 - 282) * k; lift = 4 * 172 * k * (1 - k); }
    if (u >= 1.77) { x = interpolate(u, [1.77, 2.4], [404, 524], easeInOut); lift = 0; }
    if (u >= 2.4) {
      x = interpolate(u, [2.4, 2.85], [524, PIT_A + 46], easeInOut);
      const k = clamp01((u - 2.55) / 0.6);
      lift = -k * k * 260; fell = true;
    }
  } else {
    // 벽도 구멍도 넘고 코인 셋을 모두 먹는다
    x = interpolate(u, [0.25, 0.9], [START, 282], easeInOut);
    if (u >= 0.9) { const k = clamp01((u - 0.9) / 0.68); x = 282 + (404 - 282) * k; lift = 4 * 172 * k * (1 - k); }
    if (u >= 1.58) { x = interpolate(u, [1.58, 2.02], [404, 512], easeInOut); lift = 0; }
    if (u >= 2.02) { const k = clamp01((u - 2.02) / 0.82); x = 512 + (748 - 512) * k; lift = 4 * 150 * k * (1 - k); }
    if (u >= 2.84) { x = interpolate(u, [2.84, 3.45], [748, ST.GOAL], easeInOut); lift = 0; }
  }
  return { x, lift, fell, hitWall };
}
function RewardScene() {
  const t = useSceneTime();
  const seg = Math.min(2, Math.floor(t / SEG_DUR));
  const u = t - seg * SEG_DUR;
  const ep = EPIS[seg];
  const { SX, SY, SW, SH, R, WALL, WALL_H, PIT_A, PIT_B, GOAL } = ST;
  const GY = SH - 104;                       // 지면 윗면
  const { x, lift, fell, hitWall } = runEpisode(seg, u);
  const cy = GY - R - lift;
  const collected = COIN_X.filter((c) => x >= c).length;
  const ended = u >= [2.3, 3.0, 3.5][seg];
  const ok = seg === 2;
  // 고리에서 지금 강조할 단계
  const loopStep = u < 0.45 ? 0 : u < 2.7 ? 1 : u < 3.05 ? 2 : 3;
  const ghosts = seg === 2 ? [[WALL - 54, GY - 52, '시행 1 — 여기서 막혔다'], [PIT_A + 76, GY + 40, '시행 5 — 여기서 빠졌다']] as const : [];
  return (
    <>
      <div style={{ ...abs(110, 62), ...kick }}>정답 대신 점수 — 강화학습</div>
      <h2 style={{ ...abs(110, 96, 1320), ...h2, fontSize: 40 }}>강화학습은 정답을 받지 않는다 — <span style={accentText}>행동의 결과로 받는 보상</span>으로 배운다</h2>
      {/* 무대 */}
      <div style={{ ...abs(SX, SY, SW, SH), borderRadius: 20, background: `${C.ice}55`, border: `2px solid ${C.ice}`, overflow: 'hidden' }}>
        <svg style={{ position: 'absolute', inset: 0 }} viewBox={`0 0 ${SW} ${SH}`} aria-hidden>
          {/* 지면 — 구멍만큼 끊긴다 */}
          <rect x={0} y={GY} width={PIT_A} height={SH - GY} fill={C.moss} />
          <rect x={PIT_B} y={GY} width={SW - PIT_B} height={SH - GY} fill={C.moss} />
          <text x={(PIT_A + PIT_B) / 2} y={GY + 46} textAnchor="middle" fontSize={21} fontWeight={800} fill={C.ink} fontFamily="var(--font-body)">구멍</text>
          {/* 벽 */}
          <rect x={WALL} y={GY - WALL_H} width={38} height={WALL_H} fill={C.sand} stroke={C.ink} strokeWidth={3} />
          <text x={WALL + 19} y={GY + 46} textAnchor="middle" fontSize={21} fontWeight={800} fill={C.ink} fontFamily="var(--font-body)">벽</text>
          {/* 도착 깃발 */}
          <line x1={GOAL + 34} y1={GY} x2={GOAL + 34} y2={GY - 140} stroke={C.ink} strokeWidth={6} />
          <path d={`M ${GOAL + 38} ${GY - 138} L ${GOAL + 106} ${GY - 116} L ${GOAL + 38} ${GY - 94} Z`} fill={C.green} />
          {/* 지난 시행의 실패 지점 */}
          {ghosts.map(([gx, gy, label], i) => (
            <g key={i} opacity={0.5}>
              <path d={`M ${gx - 18} ${gy - 18} L ${gx + 18} ${gy + 18} M ${gx + 18} ${gy - 18} L ${gx - 18} ${gy + 18}`} stroke={C.red} strokeWidth={6} strokeLinecap="round" />
              <text x={gx} y={gy + 40} textAnchor="middle" fontSize={15} fontWeight={700} fill={C.red} fontFamily="var(--font-body)">{label}</text>
            </g>
          ))}
          {/* 코인 */}
          {COIN_X.map((c, i) => <circle key={i} cx={c} cy={GY - 146} r={24} fill={x >= c ? 'none' : C.amber} stroke={x >= c ? `${C.amber}66` : C.ink} strokeWidth={3} strokeDasharray={x >= c ? '5 5' : undefined} />)}
          {/* 캐릭터 */}
          <g transform={`translate(${x}, ${cy}) rotate(${hitWall ? -14 : fell ? 22 : 0})`}>
            <circle r={R} fill={C.green} stroke={C.ink} strokeWidth={3} />
            <circle cx={12} cy={-9} r={6} fill="#fff" />
            {hitWall && <path d="M 28 -22 L 50 -36 M 32 -8 L 56 -10 M 28 10 L 50 22" stroke={C.red} strokeWidth={5} strokeLinecap="round" />}
          </g>
        </svg>
        {/* 무대 상단 — 시행 배지와 결과 */}
        <div style={{ position: 'absolute', left: 20, top: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ padding: '7px 20px', borderRadius: 999, background: C.ink, color: C.paper, fontWeight: 900, fontSize: 25, ...mono }}>시행 {ep + 1}</span>
          <span style={{ ...mono, fontSize: 19, fontWeight: 800, color: C.ink }}>보상 {collected}</span>
          <span style={{ ...body, fontSize: 15 }}>(먹은 코인 수)</span>
        </div>
        {ended && (
          <div style={{ position: 'absolute', right: 20, top: 14, padding: '9px 22px', borderRadius: 12, background: ok ? C.green : C.red, color: '#fff', fontWeight: 900, fontSize: 21, ...riseIn(u, 3.0, 0.4, 10) }}>
            {['✕ 벽에 막혔다', '✕ 구멍에 빠졌다', '✓ 끝까지 갔다'][seg]}
          </div>
        )}
        {seg === 2 && u >= 3.5 && <div style={{ position: 'absolute', left: 20, bottom: 16, ...body, fontSize: 17, color: C.ink, ...riseIn(u, 3.45, 0.4, 8) }}>달라진 것은 <b style={{ color: C.green }}>점프하는 자리</b>다 — 정책이 바뀌었다.</div>}
      </div>
      {/* 학습 곡선 */}
      <div style={{ ...abs(1220, 246, 600, 344), ...card, padding: 18 }}>
        <div style={{ ...kick, fontSize: 12 }}>시행 × 보상 — 무대에서 실제로 먹은 코인 수</div>
        <svg style={{ width: '100%', height: 270, marginTop: 6 }} viewBox="0 0 560 270" aria-hidden>
          <line x1={40} y1={232} x2={540} y2={232} stroke={C.ink} strokeWidth={2} />
          <line x1={40} y1={12} x2={40} y2={232} stroke={C.ink} strokeWidth={2} />
          {[0, 1, 2, 3].map((v) => <text key={v} x={28} y={237 - v * 64} textAnchor="end" fontSize={13} fill="var(--fg-muted)" fontFamily="var(--font-mono)">{v}</text>)}
          {REWARDS.map((r, e) => {
            if (e > ep) return null;
            const val = e === ep ? collected : r;
            return <rect key={e} x={48 + e * 24.5} y={232 - val * 64} width={18} height={val * 64} fill={e === ep ? C.amber : C.green} opacity={0.9} />;
          })}
          <text x={290} y={262} textAnchor="middle" fontSize={13} fill="var(--fg-muted)" fontFamily="var(--font-mono)">시행 1 → 20</text>
        </svg>
      </div>
      {/* 고리 — 지금 어느 단계인지 */}
      <div style={{ ...abs(1220, 610, 600, 200), ...card, padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {['상태를 본다', '행동한다', '보상을 받는다', '정책을 고친다'].map((s, i) => (
            <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ padding: '7px 13px', borderRadius: 999, background: i === loopStep ? (i === 3 ? C.green : C.amber) : `${C.green}12`, color: i === loopStep ? '#fff' : C.ink, fontWeight: 800, fontSize: 15, transition: 'background .25s' }}>{s}</span>
              {i < 3 && <span style={{ color: C.green, fontWeight: 800 }}>→</span>}
            </span>
          ))}
          <span style={{ ...mono, fontSize: 13, color: loopStep === 3 ? C.green : 'var(--fg-faint)', fontWeight: loopStep === 3 ? 800 : 400 }}>↺ 다음 시행</span>
        </div>
        <div style={{ ...body, fontSize: 15, marginTop: 12 }}>보상을 받은 뒤 <b style={{ color: C.green }}>행동 선택 방법(정책)</b>을 고치는 것이 학습이다. 알파고의 자기 대국(2016) · ChatGPT의 사람 피드백 강화학습(2022) · 추론 모델(2024)이 모두 이 고리를 돈다.</div>
      </div>
      <div style={{ ...abs(110, 916, 1100), ...body, fontSize: 17 }}>지도는 목표 레이블에, 비지도는 데이터의 구조에, 강화는 <b>행동의 결과로 받는 보상</b>에 기댄다. 무대는 도형만으로 그린 예시 게임이다.</div>
    </>
  );
}

/* ───────────── S14 초파리 커넥톰 (build + 영상 둘) ───────────── */
function FlySlide() {
  return (
    <>
      <div style={{ ...abs(110, 56), ...kick }}>초파리의 뇌로 게임을 움직이다 — 2026년 9월</div>
      <h2 style={{ ...abs(110, 90, 1720), ...h2, fontSize: 37 }}>배선도 전체가 공개되자, 며칠 만에 사람들이 그 배선으로 <span style={accentText}>게임을 조작</span>했다</h2>
      {/* ① 커넥톰 소개 — 세로 쇼츠 */}
      <div style={{ ...abs(110, 180, 330, 586), borderRadius: 18, background: C.ink, overflow: 'hidden' }}>
        <iframe title="구글 리서치 — 수컷 초파리 중추신경계 커넥톰 소개 영상" src={FLY_SHORT} allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen tabIndex={-1} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
      </div>
      <div style={{ ...abs(110, 776, 330), ...mono, fontSize: 13, color: 'var(--fg-muted)', ...kw }}>① 커넥톰은 어떻게 만들었나 — 구글 리서치 소개 영상</div>
      {/* ② 시연 — 가로 영상 */}
      <div style={{ ...abs(474, 180, 800, 450), borderRadius: 18, background: C.ink, overflow: 'hidden' }}>
        <iframe title="초파리 커넥톰 시뮬레이션으로 마인크래프트를 조작한 시연 영상" src={FLY_MC} allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen tabIndex={-1} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
      </div>
      <div style={{ ...abs(474, 642, 800) }}>
        <div style={{ ...mono, fontSize: 13, color: 'var(--fg-muted)', ...kw }}>② 시뮬레이션한 초파리 신경계로 마인크래프트를 조작한 시연 (2026-09-07 · 유튜브)</div>
        <div style={{ marginTop: 8, padding: '10px 14px', borderRadius: 10, background: `${C.amber}12`, border: `1px solid ${C.amber}66`, ...body, fontSize: 15, color: C.ink, ...kw }}>
          영상 제목은 「의식이 있는 뇌를 넣었다」고 말하지만, 실제로 돌아가는 것은 <b>측정된 연결 지도 + 단순화한 뉴런 모델 + 사람이 정한 입출력 규칙</b>이다. 제목과 내용을 나누어 볼 것.
        </div>
      </div>
      <Sprite src={`${SPR}/fruit-fly.png`} alt="초파리" style={{ ...abs(1180, 176, 100, 74) }} />
      <Build at={1} style={abs(1300, 180, 520)}>
        <div style={{ ...card, padding: '14px 18px' }}>
          <div style={{ ...kick, fontSize: 12 }}>2026-09-03 · 구글 리서치 + HHMI 자넬리아</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.ink, marginTop: 4, ...kw }}>수컷 초파리 중추신경계 전체 커넥톰 MaleCNS v1.0</div>
          <div style={{ ...body, fontSize: 15, marginTop: 6 }}>뉴런 166,000개 이상 · 시냅스 1억 2,500만 개 · 논문 Cell. 뇌를 얇게 잘라 찍고 AI로 이어 붙인 지도.</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 14 }}><LinkPill href={GOOGLE_BLOG} label="구글 리서치 발표" /><LinkPill href={CNS_URL} label="커넥톰 뷰어" /></div>
        </div>
      </Build>
      <Build at={2} style={abs(1300, 400, 520)}>
        <div style={{ ...card, padding: '14px 18px' }}>
          <div style={{ ...kick, fontSize: 12 }}>공개 나흘 뒤 · 여러 개발자</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.ink, marginTop: 4, ...kw }}>같은 배선으로 마인크래프트 · 슈퍼 마리오 64 · 둠을 조작</div>
          <div style={{ ...body, fontSize: 14.5, marginTop: 6 }}>코드가 공개된 마리오 시연 기준으로 — 누설 적분-발화 뉴런 모델, 초당 50스텝, 게임 화면을 시각 뉴런에 입력, 전진·조향·점프를 맡는 하강 뉴런의 발화를 조작으로 매핑한다.</div>
          <div style={{ marginTop: 8 }}><LinkPill href={FLY_CODE} label="시연 코드 github.com/ornata/fly" /></div>
        </div>
      </Build>
      <Build at={3} style={abs(1300, 654, 520)}>
        <div style={{ ...card, padding: '14px 18px', border: `3px solid ${C.amber}`, background: `${C.amber}14` }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: C.ink, ...kw }}>학습이 아니다</div>
          <div style={{ ...body, fontSize: 15, marginTop: 4, color: C.ink }}>경험으로 연결이나 행동 선택을 고치는 절차가 없다. 그래서 반복해도 실력이 늘지 않는다. 둠 시연은 피해를 입을 때 도파민 뉴런 PPL1을 자극해 보상과 비슷한 자극을 넣어 보았다.</div>
        </div>
      </Build>
      {/* 세 가지를 나란히 — 진보의 화살표가 아니다 */}
      <Build at={4} style={abs(110, 876, 1710)}>
        <div style={{ display: 'flex', gap: 16 }}>
          {[['퍼셉트론 · 1958', '신호 합산을 단순화한 계산 모델'], ['커넥톰 · 2026', '실제 신경 연결을 측정한 지도'], ['이번 시연', '지도에 뉴런 모델과 입출력 규칙을 붙인 실험']].map(([a, b], i) => (
            <div key={a} style={{ flex: 1, ...card, padding: '13px 18px', borderLeft: `7px solid ${[C.moss, C.green, C.amber][i]}` }}>
              <div style={{ fontSize: 19, fontWeight: 800, color: C.ink, ...kw }}>{a}</div>
              <div style={{ ...body, fontSize: 15, marginTop: 3 }}>{b}</div>
            </div>
          ))}
        </div>
        <div style={{ ...mono, fontSize: 13.5, color: 'var(--fg-faint)', marginTop: 8, ...kw }}>셋은 종류가 다르다 — 뉴런 수가 늘었다고 더 잘 배우는 것도, 생물의 뇌를 그대로 재현한 것도 아니다.</div>
      </Build>
    </>
  );
}

/* ───────────── S15 세 서랍 (static + live) ───────────── */
function DrawersSlide() {
  const drawers: [string, string, string, number][] = [['지도학습', '목표 레이블', '입력에 붙은 정답에 맞춘다 — 분류 · 예측 (오늘 실습)', 120], ['비지도학습', '레이블 없음', '데이터 안의 구조를 찾는다 — 군집 · 이상 탐지', 70], ['강화학습', '행동의 결과', '받은 보상이 커지도록 행동 선택을 바꾼다 — 게임 · 제어', 100]];
  return (
    <>
      <div style={{ ...abs(110, 70), ...kick }}>세 방법 한눈에</div>
      <h2 style={{ ...abs(110, 104, 1160), ...h2, fontSize: 42 }}>무엇을 <span style={accentText}>학습 신호</span>로 삼는가가 다르다</h2>
      {/* 서랍장 */}
      <div style={{ ...abs(110, 250, 760, 700), borderRadius: 20, background: `${C.sand}66`, border: `3px solid ${C.sand}` }} />
      {drawers.map(([n, tag, ex, open], i) => (
        <div key={n} style={{ ...abs(140 + open, 290 + i * 210, 700, 170), ...card, padding: '18px 24px', background: C.paper, borderLeft: `10px solid ${i === 0 ? C.green : i === 2 ? C.amber : C.moss}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 30, fontWeight: 800, color: C.ink }}>{n}</span>
            <span style={{ padding: '6px 14px', borderRadius: 999, background: i === 2 ? C.amber : i === 0 ? C.green : C.moss, color: '#fff', fontWeight: 800, fontSize: 17 }}>{tag}</span>
          </div>
          <div style={{ ...body, fontSize: 17, marginTop: 8 }}>{ex}</div>
        </div>
      ))}
      <div style={{ ...abs(140, 956, 780), ...body, fontSize: 15.5 }}>초파리 시뮬레이션은 셋 중 어디에도 없다 — 경험으로 고치는 절차가 없기 때문이다. 이 밖에도 데이터에서 스스로 목표를 만드는 자기지도학습(LLM 사전학습)처럼 다른 방식이 더 있다.</div>
      {/* 문항용 사례 카드 */}
      <div style={{ ...abs(960, 250, 850, 300), ...card, padding: '18px 22px' }}>
        <div style={{ ...kick, fontSize: 12 }}>사례 — 이름표가 붙은 사진 6,000장</div>
        <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
          {[['치와와_01.jpg', '치와와', '치와와'], ['머핀_01.jpg', '머핀', '머핀']].map(([f, dir, lab]) => (
            <div key={f} style={{ position: 'relative', width: 220, height: 200, borderRadius: 12, overflow: 'hidden', border: `2px solid ${C.sand}` }}>
              <Sprite src={`${DATASET_DIR}/${dir}/${f}`} alt={lab} fit="cover" style={{ width: '100%', height: '100%' }} />
              <div style={{ position: 'absolute', left: 8, top: 8, padding: '3px 10px', borderRadius: 6, background: C.amber, color: '#fff', fontWeight: 800, fontSize: 14, transform: 'rotate(-6deg)' }}>{lab}</div>
            </div>
          ))}
          <div style={{ flex: 1, ...body, fontSize: 16, alignSelf: 'center' }}>치와와·머핀 레이블이 붙은 사진 6,000장으로, 사진과 레이블의 대응을 학습하도록 했다.</div>
        </div>
      </div>
      <div style={{ ...abs(960, 580) }}><LiveTag kind="선택" text="레이블이 붙은 사진으로 대응을 학습했다면, 어떤 학습 방법일까?" /></div>
      <div style={{ ...abs(960, 680, 850), ...body, fontSize: 16 }}>제출 뒤 분포를 공개하고 정답을 연다. 입력과 목표 레이블의 쌍으로 배우면 지도학습 — 오늘 Teachable Machine이 하는 일이 정확히 이것이다.</div>
    </>
  );
}

/* ───────────── S16 Teachable Machine은 무엇을 배우나 (static) ───────────── */
function TmDiagram({ x, y, scale = 1, hot }: { x: number; y: number; scale?: number; hot?: 'collect' | 'train' | 'preview' }) {
  const on = (k: string) => (hot === k ? C.green : 'var(--hair)');
  return (
    <div style={{ ...abs(x, y, 980 * scale, 520 * scale) }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 980, height: 520, transform: `scale(${scale})`, transformOrigin: 'top left', background: '#f0f2f5', borderRadius: 16, border: '1px solid var(--hair)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 230, height: 46, background: '#fff', borderBottomRightRadius: 12, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', boxSizing: 'border-box' }}><span style={{ fontSize: 16 }}>☰</span><span style={{ color: '#1a73e8', fontWeight: 800, fontSize: 17, whiteSpace: 'nowrap' }}>Teachable Machine</span></div>
        {/* 1열 클래스 카드 */}
        {[0, 1].map((i) => (
          <div key={i} style={{ position: 'absolute', left: 60, top: 120 + i * 150, width: 330, height: 120, background: '#fff', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: `2px solid ${on('collect')}`, padding: '12px 14px', boxSizing: 'border-box' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#202124' }}>{['치와와', '머핀'][i]} <span style={{ color: '#9aa0a6' }}>✎</span></div>
            <div style={{ fontSize: 11.5, color: '#5f6368', marginTop: 6 }}>이미지 샘플 추가:</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>{['웹캠', '업로드'].map((b) => <span key={b} style={{ padding: '6px 10px', borderRadius: 6, background: '#e8f0fe', color: '#1a73e8', fontSize: 11.5, fontWeight: 700 }}>{b}</span>)}</div>
          </div>
        ))}
        <div style={{ position: 'absolute', left: 60, top: 420, width: 330, height: 50, border: '2px dashed #dadce0', borderRadius: 10, display: 'grid', placeItems: 'center', color: '#5f6368', fontSize: 13 }}>⊞ 클래스 추가</div>
        {/* 2열 학습 */}
        <div style={{ position: 'absolute', left: 440, top: 190, width: 210, height: 150, background: '#fff', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: `2px solid ${on('train')}`, padding: '14px', boxSizing: 'border-box' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#202124' }}>학습</div>
          <div style={{ marginTop: 10, padding: '8px 0', borderRadius: 6, background: '#f1f3f4', textAlign: 'center', fontSize: 12.5, color: '#202124', fontWeight: 700 }}>모델 학습시키기</div>
          <div style={{ marginTop: 10, fontSize: 12, color: '#5f6368', display: 'flex', justifyContent: 'space-between' }}><span>고급</span><span>⌄</span></div>
        </div>
        {/* 3열 미리보기 */}
        <div style={{ position: 'absolute', left: 700, top: 190, width: 250, height: 150, background: '#fff', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: `2px solid ${on('preview')}`, padding: '14px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span style={{ fontWeight: 700, fontSize: 15, color: '#202124' }}>미리보기</span><span style={{ padding: '6px 10px', borderRadius: 6, background: '#f1f3f4', fontSize: 11.5, fontWeight: 700 }}>⇪ 모델 내보내기</span></div>
          <div style={{ fontSize: 11, color: '#5f6368', marginTop: 10, lineHeight: 1.4 }}>여기에서 모델을 미리 확인하려면 먼저 왼쪽에서 모델을 학습시켜야 합니다.</div>
        </div>
        <svg style={{ position: 'absolute', inset: 0 }} viewBox="0 0 980 520" aria-hidden><path d="M 390 180 C 415 180, 415 265, 440 265 M 390 330 C 415 330, 415 265, 440 265 M 650 265 L 700 265" fill="none" stroke="#dadce0" strokeWidth={2} /></svg>
      </div>
    </div>
  );
}
function TmIntroSlide() {
  const cols: [string, ReactNode][] = [
    ['무엇', <>이미지 · 오디오 · 포즈 프로젝트 중 <b>이미지 프로젝트 · 표준 이미지 모델</b>(224×224 컬러, 약 5MB). 코드 없이 브라우저 안에서.</>],
    ['어떻게', <>클래스마다 샘플(웹캠·업로드) → <b>모델 학습시키기</b>(기본 에포크 50) → 미리보기로 확인 → <b>모델 내보내기</b>(공유 가능한 링크).</>],
    ['원리', <>이미 이미지를 많이 본 신경망(MobileNet)의 특징 위에 새 분류층만 배우는 <b>전이학습</b> — 그래서 수십 장으로도 되고 1분 안에 끝난다. 미리보기 막대 = 클래스별 <b>출력값</b>(신뢰도라고도 부르지만 정답률 보장은 아니다).</>],
  ];
  return (
    <>
      <div style={{ ...abs(110, 70), ...kick }}>Teachable Machine은 무엇을 배우나</div>
      <h2 style={{ ...abs(110, 104, 800), ...h2, fontSize: 40 }}>브라우저 안에서 <span style={accentText}>지도학습</span>으로 분류 모델을 만든다</h2>
      {cols.map(([n, d], i) => (
        <div key={n} style={{ ...abs(110 + i * 24, 300 + i * 190, 620), ...card, padding: '14px 20px' }}>
          <div style={{ ...kick, fontSize: 12 }}>{n}</div>
          <div style={{ ...body, fontSize: 16, marginTop: 4, color: C.ink }}>{d}</div>
        </div>
      ))}
      <TmDiagram x={830} y={250} scale={1} />
      <div style={{ ...abs(830, 790), ...mono, fontSize: 12.5, color: 'var(--fg-faint)' }}>2026-09-14 화면 기준 · 한국어 UI · 세 열: 1. 샘플 수집 → 학습 → 미리보기 (앞 장 표의 오른쪽 칸 — 특징은 기계가 이미 뽑아 두었다)</div>
      <div style={{ ...abs(110, 900) }}><LinkButton href={TM_URL} size={24} sub="teachablemachine.withgoogle.com/train · 로그인 없이 시작 · 크롬 권장">Teachable Machine 열기</LinkButton></div>
    </>
  );
}

/** 지난 창을 축소해 현재 창에 자리를 내준다 (dimAfter와 함께 쓴다) */
function shrinkAfter(t: number, at: number, k = 0.8): CSSProperties {
  if (t <= at) return {};
  return { transform: `scale(${interpolate(t, [at, at + 0.6], [1, k], easeInOut)})`, transformOrigin: 'left top' };
}

/* ───────────── S17 절차 ① — 3창 릴레이 (walkthrough) ───────────── */
const T1 = { W1: 0.2, CARD: 1.6, W2: 2.0, STD: 3.2, W3: 3.7, PEN1: 4.7, TYPE1: 5.0, PEN2: 6.6, TYPE2: 6.9, UP: 8.6, DROP: 9.3, TRAIN_ON: 11.4, END: 13.0 };
function TmWalk1() {
  const t = useSceneTime();
  const n1 = typed(t, '치와와', T1.TYPE1, 6); const n1done = t >= typedDoneAt('치와와', T1.TYPE1, 6);
  const n2 = typed(t, '머핀', T1.TYPE2, 6); const n2done = t >= typedDoneAt('머핀', T1.TYPE2, 6);
  const dropped = t >= T1.DROP;
  const thumbs = dropped ? Math.min(40, Math.floor((t - T1.DROP) * 30)) : 0;
  const DROP2 = T1.DROP + 1.1;
  const dropped2 = t >= DROP2;
  const thumbs2 = dropped2 ? Math.min(40, Math.floor((t - DROP2) * 40)) : 0;
  const trainOn = t >= T1.TRAIN_ON;
  const W1 = { x: 60, y: 210, w: 640, h: 420 }, W2 = { x: 300, y: 330, w: 620, h: 360 }, W3 = { x: 760, y: 250, w: 1080, h: 760 };
  /* 클릭 대상의 화면 좌표(Scene 기준 %) — data-pt 요소를 브라우저에서 실측한 값(2026-09-15).
     창 배치를 바꾸면 scratchpad의 measure.mjs로 다시 재고 이 값을 갱신한다. */
  const TG = { card: { x: 9.27, y: 37.52 }, std: { x: 24.01, y: 48.89 }, pen1: { x: 46.47, y: 35.05 }, pen2: { x: 46.64, y: 52.64 }, up: { x: 47.51, y: 40.51 }, train: { x: 72.97, y: 55.19 } };
  const path: CursorKey[] = [
    { t: 0.9, x: TG.card.x - 6, y: TG.card.y + 8 },
    { t: T1.CARD, ...TG.card, click: true, label: '① 이미지 프로젝트' },
    { t: T1.STD, ...TG.std, click: true, label: '② 표준 이미지 모델' },
    { t: T1.PEN1, ...TG.pen1, click: true, label: '③ 클래스 이름' },
    { t: T1.PEN1 + 0.2, ...TG.pen1, hide: true },
    { t: T1.PEN2 - 0.3, ...TG.pen2 },
    { t: T1.PEN2, ...TG.pen2, click: true },
    { t: T1.UP, ...TG.up, click: true, label: '④ 업로드' },
    { t: T1.DROP + 0.4, x: TG.up.x + 10, y: TG.up.y + 4 },
    { t: T1.TRAIN_ON, x: TG.train.x - 3, y: TG.train.y + 3, label: '⑤ 버튼이 켜진다' },
  ];
  const ring = (at: number) => ({ boxShadow: `0 0 0 ${clickFlash(t, at) * 6}px ${C.green}77` });
  const chip = (s: string, on?: boolean) => <span style={{ padding: '6px 10px', borderRadius: 6, background: '#e8f0fe', color: '#1a73e8', fontSize: 12, fontWeight: 700, ...(on ? { outline: `2px solid ${C.green}` } : {}) }}>{s}</span>;
  return (
    <>
      <div style={{ ...abs(110, 60), ...kick }}>따라 하기 ① — 프로젝트 만들고 샘플 모으기 · 2026-09-14 화면 기준</div>
      <h2 style={{ ...abs(110, 94, 1300), ...h2, fontSize: 36 }}>프로젝트를 만들고, 클래스 이름을 바꾸고, <span style={accentText}>클래스마다 샘플</span>을 넣는다</h2>
      <div style={{ ...abs(1500, 70) }}><LinkButton href={TM_URL} size={18} outline>teachablemachine.withgoogle.com/train</LinkButton></div>
      {/* ① 새 프로젝트 */}
      <AppWindow kind="browser" url="teachablemachine.withgoogle.com/train" badge="①" style={{ left: W1.x, top: W1.y, width: W1.w, height: W1.h, zIndex: 1, ...popIn(t, T1.W1), ...dimAfter(t, T1.W2, 0.62), ...shrinkAfter(t, T1.W2, 0.74) }} bodyStyle={{ background: '#fff', padding: 0 }}>
        <div style={{ position: 'absolute', inset: 0, padding: '18px 22px', boxSizing: 'border-box', color: '#202124' }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>새 프로젝트</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            {[['이미지 프로젝트', '파일 또는 웹캠에서 가져온 이미지를 기반으로 학습시키세요.'], ['오디오 프로젝트', '파일 또는 마이크에서 가져온 1초 분량의 사운드를 기반으로 학습시키세요.'], ['포즈 프로젝트', '파일 또는 웹캠에서 가져온 이미지를 기반으로 학습시키세요.']].map(([n, d], i) => (
              <div key={n} data-pt={i === 0 ? 'w1-card' : undefined} style={{ flex: 1, border: `1.5px solid ${i === 0 ? '#1a73e8' : '#dadce0'}`, borderRadius: 10, padding: 12, background: i === 0 ? `rgba(26,115,232,${0.06 + clickFlash(t, T1.CARD) * 0.25})` : '#fff', ...(i === 0 ? ring(T1.CARD) : {}) }}>
                <div style={{ height: 70, borderRadius: 8, background: '#f1f3f4' }} />
                <div style={{ fontWeight: 800, fontSize: 14, marginTop: 10 }}>{n}</div>
                <div style={{ fontSize: 10.5, color: '#5f6368', marginTop: 4, lineHeight: 1.35, ...kw }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </AppWindow>
      {/* ② 새 이미지 프로젝트 대화상자 */}
      <AppWindow kind="app" title="새 이미지 프로젝트" badge="②" style={{ left: W2.x, top: W2.y, width: W2.w, height: W2.h, zIndex: 2, ...popIn(t, T1.W2), ...dimAfter(t, T1.W3, 0.62), ...shrinkAfter(t, T1.W3, 0.74) }} bodyStyle={{ background: '#fff' }}>
        <div style={{ position: 'absolute', inset: 0, padding: 18, boxSizing: 'border-box', display: 'flex', gap: 14, color: '#202124' }}>
          {[['표준 이미지 모델', '224 x 224px 컬러 이미지\nTensorFlow, TFLite, TF.js로 내보내기\n모델 크기: 약 5mb', true], ['삽입된 이미지 모델', '96 x 96px 그레이스케일 이미지\n마이크로컨트롤러용 TFLite\n모델 크기: 약 500kb', false]].map(([n, d, hot]) => (
            <div key={String(n)} data-pt={hot ? 'w1-std' : undefined} style={{ flex: 1, border: `1.5px solid ${hot ? '#1a73e8' : '#dadce0'}`, borderRadius: 10, padding: 14, background: hot ? `rgba(26,115,232,${0.05 + clickFlash(t, T1.STD) * 0.25})` : '#fff', ...(hot ? ring(T1.STD) : {}) }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{n as string}</div>
              <div style={{ fontSize: 12, color: '#5f6368', marginTop: 8, whiteSpace: 'pre-line', lineHeight: 1.5 }}>{d as string}</div>
            </div>
          ))}
        </div>
      </AppWindow>
      {/* ③ 편집 화면 */}
      <AppWindow kind="browser" url="teachablemachine.withgoogle.com/train/image" badge="③" style={{ left: W3.x, top: W3.y, width: W3.w, height: W3.h, zIndex: 3, ...popIn(t, T1.W3) }} bodyStyle={{ background: '#f0f2f5', padding: 0 }}>
        <div style={{ position: 'absolute', inset: 0, color: '#202124' }}>
          {[0, 1].map((i) => {
            const name = i === 0 ? (n1 || (t < T1.TYPE1 ? 'Class 1' : '')) : (n2 || (t < T1.TYPE2 ? 'Class 2' : ''));
            const typing = i === 0 ? t >= T1.TYPE1 && !n1done : t >= T1.TYPE2 && !n2done;
            return (
              <div key={i} style={{ position: 'absolute', left: 40, top: 60 + i * 190, width: 420, height: 160, background: '#fff', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '14px 16px', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 17 }}>
                  <span style={{ borderBottom: typing ? `2px solid ${C.green}` : 'none' }}>{name}{typing && <Caret color={C.green} />}</span>
                  <span data-pt={i === 0 ? 'w1-pen1' : 'w1-pen2'} style={{ color: '#9aa0a6', fontSize: 14, padding: '2px 4px', borderRadius: 4, ...ring(i === 0 ? T1.PEN1 : T1.PEN2) }}>✎</span>
                  <span style={{ marginLeft: 'auto', color: '#9aa0a6' }}>⋮</span>
                </div>
                <div style={{ fontSize: 12, color: '#5f6368', marginTop: 8 }}>이미지 샘플 추가:</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                  {chip('▣ 웹캠')}
                  <span data-pt={i === 0 ? 'w1-up' : undefined} style={{ ...(i === 0 ? ring(T1.UP) : {}), borderRadius: 6 }}>{chip('⇪ 업로드', i === 0 && t >= T1.UP)}</span>
                </div>
                {((i === 0 && dropped) || (i === 1 && dropped2)) && <div style={{ position: 'absolute', left: 16, bottom: 10, fontSize: 12, color: '#5f6368' }}>이미지 샘플 {i === 0 ? thumbs : thumbs2}개</div>}
                {((i === 0 && dropped) || (i === 1 && dropped2)) && (
                  <div style={{ position: 'absolute', right: 14, top: 42, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3, width: 150 }}>
                    {Array.from({ length: Math.min(i === 0 ? thumbs : thumbs2, 15) }, (_, k) =>
                      k < 5
                        ? <img key={k} src={`${DATASET_DIR}/${i === 0 ? '치와와' : '머핀'}/${i === 0 ? '치와와' : '머핀'}_0${k + 1}.jpg`} alt="" draggable={false} style={{ width: 26, height: 26, borderRadius: 3, objectFit: 'cover' }} />
                        : <div key={k} style={{ width: 26, height: 26, borderRadius: 3, background: i === 0 ? ['#c9a57b', '#b98a5e', '#d9c3a3', '#a97a55'][k % 4] : ['#d4a56a', '#b07a3c', '#e8c890', '#c98f4e'][k % 4] }} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ position: 'absolute', left: 40, top: 440, width: 420, height: 60, border: '2px dashed #dadce0', borderRadius: 10, display: 'grid', placeItems: 'center', color: '#5f6368', fontSize: 14 }}>⊞ 클래스 추가</div>
          <div style={{ position: 'absolute', left: 520, top: 230, width: 240, height: 170, background: '#fff', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: 16, boxSizing: 'border-box' }}>
            <div style={{ fontWeight: 700, fontSize: 17 }}>학습</div>
            <div data-pt="w1-train" style={{ marginTop: 12, padding: '10px 0', borderRadius: 6, background: trainOn ? '#1a73e8' : '#f1f3f4', color: trainOn ? '#fff' : '#9aa0a6', textAlign: 'center', fontSize: 14, fontWeight: 700, transition: 'background .3s', ...(trainOn ? { boxShadow: `0 0 0 6px ${C.green}55` } : {}) }}>모델 학습시키기</div>
            <div style={{ marginTop: 12, fontSize: 13, color: '#5f6368', display: 'flex', justifyContent: 'space-between' }}><span>고급</span><span>⌄</span></div>
          </div>
          <div style={{ position: 'absolute', left: 810, top: 230, width: 240, height: 170, background: '#fff', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: 16, boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontWeight: 700, fontSize: 17 }}>미리보기</span><span style={{ padding: '6px 10px', borderRadius: 6, background: '#f1f3f4', fontSize: 12, fontWeight: 700 }}>⇪ 모델 내보내기</span></div>
            <div style={{ fontSize: 12, color: '#5f6368', marginTop: 12, lineHeight: 1.45 }}>여기에서 모델을 미리 확인하려면 먼저 왼쪽에서 모델을 학습시켜야 합니다.</div>
          </div>
          {/* 끌어다 놓는 사진 파일들 */}
          {[[T1.UP + 0.3, T1.DROP, 120, '치와와/ 폴더의 사진'], [T1.DROP + 0.5, DROP2, 310, '머핀/ 폴더의 사진']].map(([a, b, top, label]) => t >= (a as number) && t < (b as number) + 0.4 && (
            <div key={label as string} style={{ position: 'absolute', left: 120 + interpolate(t, [a as number, b as number], [260, 0], easeInOut), top: (top as number) + interpolate(t, [a as number, b as number], [220, 0], easeInOut), display: 'flex', gap: 4 }}>
              {[0, 1, 2].map((k) => <div key={k} style={{ width: 34, height: 40, borderRadius: 4, background: '#fff', border: '1.5px solid #9aa0a6', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', fontSize: 9, textAlign: 'center', paddingTop: 22, boxSizing: 'border-box', color: '#5f6368' }}>jpg</div>)}
              <span style={{ fontSize: 12, color: C.green, fontWeight: 800, alignSelf: 'center' }}>{label as string}</span>
            </div>
          ))}
          {trainOn && <div style={{ position: 'absolute', left: 520, top: 420, ...mono, fontSize: 13, color: C.green, fontWeight: 800, ...riseIn(t, T1.TRAIN_ON, 0.5, 8) }}>✓ 두 클래스 모두 40장 이상 — 버튼이 켜졌다</div>}
        </div>
      </AppWindow>
      <div style={{ ...abs(110, 700, 560), display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[['①', '주소로 들어가 「이미지 프로젝트」 카드 클릭', T1.CARD], ['②', '「표준 이미지 모델」 클릭', T1.STD], ['③', '연필로 클래스 이름을 치와와 · 머핀으로', T1.PEN1], ['④', '「업로드」 → 폴더 안 사진을 전체 선택해 넣기', T1.UP], ['⑤', '두 클래스 40장 이상 → 「모델 학습시키기」가 켜진다', T1.TRAIN_ON]].map(([n, s, at]) => {
          const on = t >= (at as number) - 0.1;
          return <div key={String(n)} style={{ display: 'flex', gap: 10, alignItems: 'baseline', padding: '6px 12px', borderRadius: 10, background: on ? `${C.green}14` : 'transparent', border: `1px solid ${on ? `${C.green}55` : 'transparent'}` }}><span style={{ ...mono, fontWeight: 900, color: on ? C.green : 'var(--fg-faint)' }}>{n as string}</span><span style={{ fontSize: 15.5, fontWeight: on ? 800 : 600, color: C.ink, ...kw }}>{s as string}</span></div>;
        })}
      </div>
      <Pointer path={path} color={C.green} timelineEnd={T1.END} />
    </>
  );
}

/* ───────────── S18 절차 ② — 한 창 안의 왕복 (walkthrough) ───────────── */
const T2 = { W: 0.2, TRAIN: 1.4, DONE: 4.2, FILE: 5.0, PICK: 5.9, BARS: 6.5, EXPORT: 8.2, DLG: 8.6, UPLOAD: 9.8, LINK: 11.4, COPY: 12.2, ACT: 13.4, PASTE: 14.0, END: 15.6 };
function TmWalk2() {
  const t = useSceneTime();
  const training = t >= T2.TRAIN && t < T2.DONE;
  const done = t >= T2.DONE;
  const prog = interpolate(t, [T2.TRAIN, T2.DONE], [0, 100]);
  const dropOpen = t >= T2.FILE && t < T2.PICK + 0.25;              // 입력 드롭다운이 열려 있다
  const fileMode = t >= T2.PICK;                                    // 웹캠 → 파일로 바꾼 뒤
  const chi = fileMode ? interpolate(t, [T2.BARS, T2.BARS + 1.0], [50, 88], easeOut) : 0;
  const dlg = t >= T2.DLG;
  const uploaded = t >= T2.LINK;
  const LINK = 'https://teachablemachine.withgoogle.com/models/aB3kZ9x1Q/';
  const linkTxt = uploaded ? typed(t, LINK, T2.LINK, 40) : '';
  const pasted = t >= T2.PASTE;
  const W = { x: 560, y: 176, w: 1280, h: 600 }, D = { x: 690, y: 268, w: 980, h: 430 }, A = { x: 900, y: 700, w: 940, h: 340 };
  /* 클릭 대상의 화면 좌표(Scene 기준 %) — data-pt 요소 실측값(2026-09-15) */
  const TG = { train: { x: 62.81, y: 46.48 }, file: { x: 91.04, y: 32.41 }, filepick: { x: 89.64, y: 38.56 }, exp: { x: 89.91, y: 28.70 }, upload: { x: 53.38, y: 39.21 }, copy: { x: 84.08, y: 46.48 }, act: { x: 71.35, y: 79.35 } };
  const path: CursorKey[] = [
    { t: 0.9, x: TG.train.x - 5, y: TG.train.y + 8 },
    { t: T2.TRAIN, ...TG.train, click: true, label: '① 모델 학습시키기' },
    { t: T2.DONE + 0.3, ...TG.train },
    { t: T2.FILE, ...TG.file, click: true, label: '② 입력 드롭다운' },
    { t: T2.PICK, ...TG.filepick, click: true, label: '③ 「파일」 선택' },
    { t: T2.EXPORT, ...TG.exp, click: true, label: '④ 모델 내보내기' },
    { t: T2.UPLOAD, ...TG.upload, click: true, label: '⑤ 모델 업로드' },
    { t: T2.COPY, ...TG.copy, click: true, label: '링크 복사' },
    { t: T2.ACT, ...TG.act, click: true, label: '⑥ 활동지에 붙여넣기' },
    { t: T2.ACT + 0.3, ...TG.act, hide: true },
  ];
  const ring = (at: number) => ({ boxShadow: `0 0 0 ${clickFlash(t, at) * 6}px ${C.green}77` });
  const steps: [string, string, number][] = [['①', '「모델 학습시키기」 — 학습 중에는 탭을 옮기지 않는다', T2.TRAIN], ['②', '「미리보기」 입력은 처음에 웹캠이다 — 드롭다운을 열어 「파일」로 바꾼다', T2.FILE], ['③', '시험 사진을 넣으면 클래스별 출력값이 막대로 나온다', T2.BARS], ['④', '「모델 내보내기」 → Tensorflow.js 탭', T2.EXPORT], ['⑤', '「업로드(공유 가능한 링크)」 → 「모델 업로드」 → 링크 복사', T2.UPLOAD], ['⑥', '활동지 링크 칸에 붙여넣기 → 제출', T2.ACT]];
  return (
    <>
      <div style={{ ...abs(110, 60), ...kick }}>따라 하기 ② — 학습시키고, 확인하고, 내보내기</div>
      <h2 style={{ ...abs(110, 94, 1000), ...h2, fontSize: 36 }}>신뢰도 막대를 확인하고, <span style={accentText}>공유 링크</span>를 활동지에 붙인다</h2>
      {/* 왼쪽 단계 카드 — 국면마다 점등 */}
      <div style={{ ...abs(110, 230, 420), display: 'flex', flexDirection: 'column', gap: 10 }}>
        {steps.map(([n, s, at]) => { const on = t >= at - 0.1; const cur = on && t < (steps.find(([, , a]) => a > at)?.[2] ?? 99) - 0.1; return <div key={n} style={{ ...card, padding: '12px 16px', borderColor: cur ? C.green : on ? `${C.green}55` : 'var(--hair)', background: cur ? `${C.green}14` : 'rgba(255,255,255,0.72)', opacity: on ? 1 : 0.6 }}><span style={{ ...mono, fontWeight: 900, color: on ? C.green : 'var(--fg-faint)', marginRight: 8 }}>{n}</span><span style={{ fontSize: 15.5, fontWeight: cur ? 800 : 600, color: C.ink, ...kw }}>{s}</span></div>; })}
        <div style={{ marginTop: 6 }}><LinkPill href={`${SITE}${ACTIVITY_PATH}`} label="활동지 열기" /></div>
      </div>
      {/* 편집 창 */}
      <AppWindow kind="browser" url="teachablemachine.withgoogle.com/train/image" style={{ left: W.x, top: W.y, width: W.w, height: W.h, zIndex: 1, ...popIn(t, T2.W), ...dimAfter(t, T2.DLG, 0.7) }} bodyStyle={{ background: '#f0f2f5', padding: 0 }}>
        <div style={{ position: 'absolute', inset: 0, color: '#202124' }}>
          {['치와와', '머핀'].map((n, i) => <div key={n} style={{ position: 'absolute', left: 40, top: 60 + i * 180, width: 400, height: 150, background: '#fff', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: 14, boxSizing: 'border-box' }}><div style={{ fontWeight: 700, fontSize: 16 }}>{n} ✎</div><div style={{ fontSize: 12, color: '#5f6368', marginTop: 4 }}>이미지 샘플 {[83, 72][i]}개</div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 3, marginTop: 8 }}>{Array.from({ length: 30 }, (_, k) => <div key={k} style={{ height: 22, borderRadius: 3, background: i === 0 ? ['#c9a57b', '#b98a5e', '#d9c3a3'][k % 3] : ['#d4a56a', '#b07a3c', '#e8c890'][k % 3] }} />)}</div></div>)}
          <div style={{ position: 'absolute', left: 520, top: 210, width: 250, height: 200, background: '#fff', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: 16, boxSizing: 'border-box' }}>
            <div style={{ fontWeight: 700, fontSize: 17 }}>학습</div>
            <div data-pt="w2-train" style={{ marginTop: 12, padding: '10px 0', borderRadius: 6, background: training ? '#e8f0fe' : done ? '#f1f3f4' : '#1a73e8', color: training ? '#1a73e8' : done ? '#5f6368' : '#fff', textAlign: 'center', fontSize: 14, fontWeight: 700, ...ring(T2.TRAIN) }}>{training ? `학습 중… ${Math.round(prog)}%` : done ? '모델 학습됨' : '모델 학습시키기'}</div>
            {training && <div style={{ marginTop: 8, fontSize: 11.5, color: '#d93025', lineHeight: 1.4, ...kw }}>탭을 전환하지 마세요 — 브라우저 안에서 학습 중입니다.</div>}
            <div style={{ marginTop: 10, fontSize: 13, color: '#5f6368', display: 'flex', justifyContent: 'space-between' }}><span>고급</span><span>⌄</span></div>
          </div>
          <div style={{ position: 'absolute', left: 830, top: 60, width: 400, height: 500, background: '#fff', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: 16, boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontWeight: 700, fontSize: 17 }}>미리보기</span><span style={{ padding: '6px 10px', borderRadius: 6, background: done ? '#e8f0fe' : '#f1f3f4', color: done ? '#1a73e8' : '#9aa0a6', fontSize: 12, fontWeight: 700, ...ring(T2.EXPORT) }} data-pt="w2-exp">⇪ 모델 내보내기</span></div>
            {!done ? <div style={{ fontSize: 12, color: '#5f6368', marginTop: 12, lineHeight: 1.45 }}>여기에서 모델을 미리 확인하려면 먼저 왼쪽에서 모델을 학습시켜야 합니다.</div> : (
              <>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 12.5 }}>
                  입력 <span style={{ padding: '2px 8px', borderRadius: 999, background: '#1a73e8', color: '#fff', fontSize: 11 }}>사용</span>
                  <span style={{ marginLeft: 'auto', padding: '4px 10px', borderRadius: 6, background: dropOpen ? '#e8f0fe' : '#f1f3f4', color: dropOpen ? '#1a73e8' : '#202124', fontSize: 12, fontWeight: 700, ...ring(T2.FILE) }} data-pt="w2-file">{fileMode ? '파일' : '웹캠'} ▾</span>
                  {dropOpen && (
                    <div style={{ position: 'absolute', right: 0, top: 26, width: 108, background: '#fff', borderRadius: 6, boxShadow: '0 6px 18px rgba(0,0,0,0.22)', border: '1px solid #dadce0', zIndex: 6, overflow: 'hidden' }}>
                      <div style={{ padding: '8px 12px', fontSize: 12.5, color: '#5f6368' }}>웹캠</div>
                      <div style={{ padding: '8px 12px', fontSize: 12.5, fontWeight: 700, background: `rgba(26,115,232,${0.08 + clickFlash(t, T2.PICK) * 0.3})`, color: '#1a73e8' }} data-pt="w2-filepick">파일</div>
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 10, height: 150, borderRadius: 8, background: '#f1f3f4', overflow: 'hidden', display: 'grid', placeItems: 'center', position: 'relative' }}>
                  {fileMode
                    ? (t >= T2.PICK + 0.3
                        ? <Sprite src={`${DATASET_DIR}/시험/시험_02.jpg`} alt="시험 사진" fit="cover" style={{ width: '100%', height: '100%' }} />
                        : <span style={{ fontSize: 12, color: '#5f6368' }}>시험/ 폴더에서 사진 고르기</span>)
                    : (
                      <div style={{ textAlign: 'center', color: '#9aa0a6' }}>
                        <div style={{ fontSize: 26 }}>▣</div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>웹캠 — 처음 입력은 이것이다</div>
                      </div>
                    )}
                </div>
                <div style={{ marginTop: 12, fontSize: 12, fontWeight: 700 }}>출력</div>
                {[['치와와', chi], ['머핀', 100 - chi]].map(([n, v]) => <div key={String(n)} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 12.5 }}><span style={{ width: 50 }}>{n as string}</span><div style={{ flex: 1, height: 18, borderRadius: 4, background: '#f1f3f4', overflow: 'hidden' }}><div style={{ width: `${v as number}%`, height: '100%', background: n === '치와와' ? '#e8710a' : '#1a73e8', transition: 'width .2s' }} /></div><span style={{ width: 40, textAlign: 'right', ...mono }}>{Math.round(v as number)}%</span></div>)}
                <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: '#b1370a', ...kw }}>이 사진에 대한 모델의 출력값이다 — 정답률이 아니다.</div>
              </>
            )}
          </div>
        </div>
      </AppWindow>
      {/* 내보내기 대화상자 */}
      {dlg && (
        <AppWindow kind="app" title="프로젝트에서 모델을 사용하려면 모델을 내보내세요." style={{ left: D.x, top: D.y, width: D.w, height: D.h, zIndex: 3, ...popIn(t, T2.DLG), ...dimAfter(t, T2.ACT - 0.4, 0.55), ...shrinkAfter(t, T2.ACT - 0.4, 0.8) }} bodyStyle={{ background: '#fff', padding: 0 }}>
          <div style={{ position: 'absolute', inset: 0, padding: 20, boxSizing: 'border-box', color: '#202124' }}>
            <div style={{ display: 'flex', gap: 22, fontSize: 15, fontWeight: 700, borderBottom: '1px solid #dadce0', paddingBottom: 8 }}>{['Tensorflow.js', 'Tensorflow', 'Tensorflow Lite'].map((s, i) => <span key={s} style={{ color: i === 0 ? '#1a73e8' : '#5f6368', borderBottom: i === 0 ? '3px solid #1a73e8' : 'none', paddingBottom: 6 }}>{s} ⓘ</span>)}</div>
            <div style={{ marginTop: 14, fontSize: 14, fontWeight: 700 }}>모델 내보내기:</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 8, fontSize: 14 }}>
              <span>◉ 업로드(공유 가능한 링크)</span><span style={{ color: '#5f6368' }}>○ 다운로드</span>
              <span style={{ padding: '8px 16px', borderRadius: 6, background: uploaded ? '#f1f3f4' : '#e8f0fe', color: uploaded ? '#5f6368' : '#1a73e8', fontWeight: 700, fontSize: 13, ...ring(T2.UPLOAD) }} data-pt="w2-upload">{t >= T2.UPLOAD && !uploaded ? '업로드 중…' : '☁ 모델 업로드'}</span>
            </div>
            <div style={{ marginTop: 16, fontSize: 14, fontWeight: 700 }}>공유 가능한 링크:</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <div style={{ flex: 1, padding: '10px 14px', borderRadius: 6, background: '#f1f3f4', ...mono, fontSize: 13.5, color: uploaded ? '#202124' : '#9aa0a6', whiteSpace: 'nowrap', overflow: 'hidden' }}>{linkTxt || 'https://teachablemachine.withgoogle.com/models/[...]'}{uploaded && t < T2.LINK + LINK.length / 40 && <Caret color="#1a73e8" />}</div>
              <span style={{ padding: '8px 14px', borderRadius: 6, border: '1.5px solid #dadce0', fontSize: 13, fontWeight: 700, background: t >= T2.COPY ? '#e6f4ea' : '#fff', color: uploaded ? '#202124' : '#b9bec4', opacity: uploaded ? 1 : 0.6, ...ring(T2.COPY) }} data-pt="w2-copy">{t >= T2.COPY ? '✓ 복사됨' : '복사 ⧉'}</span>
            </div>
            <div style={{ marginTop: 10, fontSize: 11.5, color: '#5f6368', ...kw }}>모델을 업로드하면 Teachable Machine에서 이 링크에 모델을 호스팅합니다.</div>
            <div style={{ marginTop: 14, fontSize: 13, fontWeight: 700, color: '#5f6368' }}>모델에서 사용할 코드 스니펫: <span style={{ fontWeight: 600 }}>Javascript · p5.js</span></div>
          </div>
        </AppWindow>
      )}
      {/* 활동지 창 */}
      {t >= T2.ACT - 0.6 && (
        <AppWindow kind="browser" url="2026kijunit.netlify.app/…/활동지.html" style={{ left: A.x, top: A.y, width: A.w, height: A.h, zIndex: 4, ...popIn(t, T2.ACT - 0.6) }} bodyStyle={{ background: C.paper, padding: 0 }}>
          <div style={{ position: 'absolute', inset: 0, padding: 22, boxSizing: 'border-box', color: C.ink }}>
            <div style={{ fontWeight: 800, fontSize: 20 }}>치와와·머핀 분류기 만들기 — 활동지</div>
            <div style={{ fontSize: 14, color: 'var(--fg-muted)', marginTop: 12 }}>Teachable Machine 모델 공유 링크</div>
            <div style={{ marginTop: 6, padding: '12px 16px', borderRadius: 8, border: `2px solid ${pasted ? C.green : 'var(--hair)'}`, background: '#fff', ...mono, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', ...ring(T2.ACT) }} data-pt="w2-act">{pasted ? LINK : <span style={{ color: 'var(--fg-faint)' }}>https://teachablemachine.withgoogle.com/models/…</span>}</div>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ display: 'inline-block', padding: '11px 24px', borderRadius: 999, background: t >= T2.END - 0.6 ? C.green : 'var(--hair)', color: '#fff', fontWeight: 800, fontSize: 17 }}>{t >= T2.END - 0.6 ? '✓ 제출됨' : '제출'}</span>
              {t >= T2.END - 0.6 && <span style={{ fontSize: 16, fontWeight: 700, color: C.green, ...riseIn(t, T2.END - 0.6, 0.5, 8) }}>여기까지 하면 오늘 실습이 끝난다.</span>}
            </div>
          </div>
        </AppWindow>
      )}
      <Pointer path={path} color={C.green} timelineEnd={T2.END} />
    </>
  );
}

/* ───────────── S19 실습 (activity) ───────────── */
const ACT_STEPS: [string, string, string][] = [
  ['3분', '내려받고 압축 풀기', '새로 생긴 폴더 안에 치와와 · 머핀 · 시험 세 폴더가 보이면 준비 끝'],
  ['7분', '프로젝트 만들고 올리기', '표준 이미지 모델 → 클래스 이름 치와와 · 머핀 → 폴더 안 사진을 모두(83장 · 72장). 시험 폴더는 넣지 않는다'],
  ['2분', '학습시키기', '누르고 기다린다 — 학습 중에는 탭을 옮기지 않는다'],
  ['12분', '시험 사진 16장 확인', '미리보기 입력을 웹캠에서 파일로 바꾸고 하나씩. 두 클래스 출력값이 비슷하거나 틀린 사진을 찾아 기록한다'],
  ['6분', '내보내고 제출', '모델 업로드 → 링크를 새 탭에서 열어 확인 → 활동지에 붙여넣기'],
];
function ActivitySlide() {
  const rules = ['표준 이미지 모델 · 클래스 이름은 한글로', '학습 중에는 탭을 옮기지 않는다', '시험 폴더 사진은 학습에 넣지 않는다', '공유 링크는 활동지에만 붙인다'];
  return (
    <>
      <div style={{ ...abs(110, 56), ...kick }}>실습 · 30분 — 치와와 · 머핀 분류기 만들기</div>
      <h2 style={{ ...abs(110, 90, 1100), ...h2, fontSize: 38 }}>레이블을 붙여 가르치고, <span style={accentText}>어디서 헷갈리는지</span>를 기록한다</h2>
      <div style={{ ...abs(110, 198), display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <LinkButton href={`${SITE}${ACTIVITY_PATH}`} size={25} sub="활동지 — 제출은 여기에">활동지 열기</LinkButton>
        <LinkButton href={`${SITE}${DATASET_PATH}`} size={25} tone={C.amber} sub="치와와-머핀.zip · 9.1MB">데이터셋 내려받기</LinkButton>
        <LinkButton href={TM_URL} size={19} outline sub="teachablemachine.withgoogle.com/train">Teachable Machine</LinkButton>
      </div>
      {/* 순서와 시간 — 학생이 진도를 가늠할 수 있게 */}
      <div style={{ ...abs(110, 356, 1180) }}>
        <div style={{ ...kick, fontSize: 12 }}>순서와 시간</div>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ACT_STEPS.map(([time, title, d], i) => (
            <div key={title} style={{ ...card, padding: '13px 18px', display: 'flex', gap: 16, alignItems: 'baseline', marginLeft: i * 26, borderLeft: `7px solid ${i === 3 ? C.amber : C.green}` }}>
              <span style={{ ...mono, fontSize: 17, fontWeight: 800, color: i === 3 ? '#9a6d0f' : C.green, width: 52, flexShrink: 0 }}>{time}</span>
              <span style={{ fontSize: 21, fontWeight: 800, color: C.ink, width: 230, flexShrink: 0, ...kw }}>{title}</span>
              <span style={{ ...body, fontSize: 15.5 }}>{d}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...abs(1360, 356, 460) }}>
        <div style={{ ...kick, fontSize: 12 }}>규칙</div>
        {rules.map((r, i) => <div key={r} style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'baseline' }}><span style={{ ...mono, fontWeight: 800, color: C.green }}>{i + 1}</span><span style={{ fontSize: 16.5, color: C.ink, ...kw }}>{r}</span></div>)}
        <div style={{ ...card, marginTop: 24, padding: '16px 20px', background: `${C.green}12`, borderColor: C.green }}>
          <div style={{ ...kick, fontSize: 12 }}>오늘 배운 것과 이어 보면</div>
          <div style={{ ...body, fontSize: 16, marginTop: 6, color: C.ink }}>레이블이 붙은 사진으로 배우니 <b>지도학습</b>이고, 이미 이미지를 많이 본 신경망의 특징 위에 분류층만 얹으니 <b>전이학습</b>이다.</div>
        </div>
        <div style={{ ...body, fontSize: 15, marginTop: 18, ...kw }}>먼저 끝낸 사람은 치킨·식빵처럼 헷갈릴 만한 사진을 직접 찾아 넣어 보고, 어떤 값이 나오는지 활동지 여백에 적어 둔다.</div>
      </div>
      {/* zip 안에 어떤 사진이 들어 있는지 — 실습 중 참고 */}
      <div style={{ ...abs(110, 806, 1180) }}>
        <div style={{ ...kick, fontSize: 12 }}>zip 안에 든 사진</div>
        <div style={{ display: 'flex', gap: 26, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {([['치와와', C.green], ['머핀', C.green], ['시험', C.amber]] as [string, string][]).map(([dir, tone]) => (
            <div key={dir} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ ...mono, fontSize: 14, fontWeight: 800, color: tone === C.amber ? '#9a6d0f' : C.green, width: 46 }}>{dir}</span>
              {[1, 2, 3].map((k) => <img key={k} src={`${DATASET_DIR}/${dir}/${dir}_0${k}.jpg`} alt="" draggable={false} style={{ width: 88, height: 88, borderRadius: 8, objectFit: 'cover', border: `2px solid ${tone === C.amber ? C.amber : C.sand}` }} />)}
            </div>
          ))}
          <span style={{ ...body, fontSize: 14.5, ...kw }}>시험 사진의 정답은 zip 안 시험-정답.csv에 있다 — 먼저 보지 말고 모델 출력을 적은 뒤 맞춰 보자.</span>
        </div>
      </div>
      <div style={{ ...abs(110, 1012), ...mono, fontSize: 12.5, color: 'var(--fg-faint)' }}>사진: CC0 · 퍼블릭 도메인 (출처 목록은 zip 안 출처.csv · Openverse에서 수집) · 이 장은 실습 내내 띄워 둔다</div>
    </>
  );
}

/* ───────────── S20 열매 넷 (static + exit) ───────────── */
function SummarySlide() {
  const fruits: [number, number, string, string][] = [
    [60, 560, '정의', '"무엇을 지능으로 보는가"로 갈린다 · 수준은 좁음/일반 두 줄 · 도구 → 에이전트'],
    [960, 770, '역사', '규칙(사람) → 특징(사람)+규칙(기계) → 특징까지 기계 · 뉴런 → 퍼셉트론 → 깊은 층'],
    [1230, 560, '방법', '레이블 · 없음 · 보상 — 커넥톰 시뮬레이션은 학습이 아니다'],
    [1310, 300, '실습', '여러분의 모델 = 지도학습 + 전이학습 · 틀린 사진에는 원인이 있다'],
  ];
  return (
    <>
      <BranchSvg t={99} tips />
      <div style={{ ...abs(110, 70), ...kick }}>한눈 정리 — 오늘 인공지능이 배운 것</div>
      <h2 style={{ ...abs(110, 104, 1340), ...h2, fontSize: 38 }}>규칙을 받아 적던 기계에서, <span style={accentText}>데이터에서 배우는</span> 기계로</h2>
      {fruits.map(([x, y, n, d], i) => (
        <div key={n} style={{ ...abs(x, y, 330), ...card, padding: '12px 16px', borderLeft: `8px solid ${i === 3 ? C.amber : C.green}` }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: i === 3 ? '#9a6d0f' : C.green }}>{n}</div>
          <div style={{ ...body, fontSize: 14.5, marginTop: 4, color: C.ink }}>{d}</div>
        </div>
      ))}
      <div style={{ ...abs(1340, 700, 480), ...card, padding: '18px 22px', borderColor: `${C.amber}88`, background: `${C.amber}12` }}>
        <LiveTag kind="출구 티켓" text="이번 학습에서 새로 조정된 부분은 무엇이고, 무엇을 구분하도록 바뀌었나요?" style={{ background: 'transparent', border: 'none', padding: 0 }} />
        <div style={{ ...body, fontSize: 15, marginTop: 10 }}>힌트: 사진이 저장된 것이 아니다. 이미 이미지를 많이 본 신경망은 그대로 두고, 그 위에 얹은 <b>분류층의 가중치</b>만 조정되어 치와와와 머핀을 가르는 경계가 생겼다.</div>
      </div>
      <div style={{ ...abs(1340, 900, 480), ...body, fontSize: 15 }}>제출하고 나가면 된다. 제출 못 한 활동지는 링크로 이어서 낼 수 있다.</div>
      <div style={{ ...abs(110, 1010), ...mono, fontSize: 12.5, color: 'var(--fg-faint)' }}>첫 장의 가지가 다 자랐다 — 가지 끝마다 열매 하나</div>
    </>
  );
}

/* ───────────── 덱 ───────────── */
export default function AiHowToLearnDeck() {
  return (
    <Deck>
      <Slide full nav="제목" notes="다섯 번의 수업에서 우리는 인공지능이 말을 만들고 그림을 만들고 영상을 만드는 걸 봤어요. 오늘은 거꾸로 묻습니다. 그 인공지능은 대체 무엇이고, 어떻게 그런 걸 할 수 있게 됐을까요? 수업 끝에는 여러분이 인공지능 하나를 직접 가르쳐 보겠습니다.">
        <Fit><Scene duration={6}><TitleScene /></Scene></Fit>
      </Slide>
      <Slide full nav="한 단어로" notes="한 단어만 적어 주세요. 제출은 각자 기기에서 하고, 모인 결과는 제 화면에서 함께 봅니다. (라이브 독에서 워드클라우드 열기) 자, 읽어 볼게요. 로봇이라고 쓴 사람, 챗GPT라고 쓴 사람, 학습이라고 쓴 사람. 어느 칸에 넣어야 할까요? 하나씩 물어보면서 채워 봅시다. 겉모습은 무엇처럼 생겼나, 하는 일은 무엇을 해내나, 배우는 법은 어떻게 그렇게 되었나입니다. 세 번째 칸이 오늘 볼 갈래예요. 이 셋이 왜 갈라지는지, 70년 전 학자들부터 보겠습니다.">
        <Fit><WordSlide /></Fit>
      </Slide>
      <Slide full nav="학자들의 정의" notes="첫 번째 액자, 튜링(클릭 1). 그는 정의를 내리지 않았어요. 대신 '구별할 수 없으면 인정하자'는 게임을 냈죠. 두 번째, 매카시(클릭 2). 이 단어 자체를 만든 사람인데 정의는 의외로 담백합니다. 만드는 일. 세 번째, 민스키(클릭 3). 기준을 사람에 둡니다. 네 번째는 교과서예요(클릭 4). 네 칸을 그리고 그중 하나를 골랐어요. 합리적으로 행동하는 것. 넷이 다른 이유가 보이나요(클릭 5)? 무엇을 지능으로 볼지가 다른 겁니다. 초상은 생성 이미지로 그린 초상화풍 재현이고, 러셀·노빅은 생존 인물이라 교재로 대신했습니다.">
        <Fit><ScholarsSlide /></Fit>
      </Slide>
      <Slide full nav="수준별 분류" notes="어느 정도면 인공지능이라 할까요? 보통 셋으로 나눕니다. 한 가지만 잘하는 것, 사람이 하는 대부분을 하는 것, 사람을 넘는 것. 딥마인드 연구진은 2023년 논문에서 성능 수준과 범용성을 나누어 보자고 제안했어요. 재미있는 건 두 줄이 다르다는 겁니다. 좁은 범위에서는 이미 초인간 사례가 있어요 — 논문은 알파제로와 알파폴드를 듭니다. 알파고는 한 단계 아래인 4단계로 놓았고요. 넓은 범위는 그 논문이 평가한 시점 기준으로 1단계였습니다. 2026년 지금 다시 평가하면 달라질 수 있어요. 그럼 이 능선을 무엇으로 올라왔을까요? 그게 오늘의 두 번째 질문입니다.">
        <Fit><Scene duration={8.4}><RidgeScene /></Scene></Fit>
      </Slide>
      <Slide full nav="도구→에이전트" notes="챗GPT는 물으면 답하는 도구였어요(클릭 1). 사람이 순서를 정해 도구를 잇는 워크플로(클릭 2). 지금은 목표만 주면 알아서 검색하고 클릭하고 코드를 짜는 에이전트로 바뀌고 있죠(클릭 3). 다음은요? 예측이지만, 에이전트가 에이전트를 부리고 로봇 몸으로 나갑니다(클릭 4). 그런데 도구든 에이전트든 안에서 돌아가는 건 하나예요. 배운 모델(클릭 5). 그래서 오늘의 진짜 주제로 갑니다. 연도: 컴퓨터 사용 2024-10 · MCP 2024-11 · Operator 2025-01.">
        <Fit><ToolAgentSlide /></Fit>
      </Slide>
      <Slide full nav="배운다는 것" notes="여기까지가 인공지능이 무엇인가였습니다. 이제 배우는 쪽을 봅니다. 배운다는 게 뭘까요? 화면을 보세요. 가운데 상자가 모델이고, 안에 숫자가 여섯 개 있습니다. 왼쪽에서 사진과 정답이 들어가요. 첫 예시, 치와와인데 모델은 머핀이라고 답합니다. 틀렸죠. 그러면 안의 숫자가 움직입니다. 두 번째도 틀려요. 또 움직입니다. 세 번째부터 맞기 시작하고, 뒤로 갈수록 숫자가 덜 움직여요. 자리를 잡은 겁니다. 이게 학습이에요. 사람이 규칙을 적어 넣은 게 아니라, 틀린 만큼 안의 숫자를 고친 겁니다. 이 숫자를 가중치라고 부르는데, 오늘 남은 시간은 이 한 문장을 뜯어보는 일입니다.">
        <Fit><Scene duration={11}><LearnScene /></Scene></Fit>
      </Slide>
      <Slide full nav="규칙의 시대" notes="초기 인공지능의 주된 방식은 사람이 규칙을 써 주는 것이었습니다. 의사에게 물어서 받아 적는 식이죠. 화면의 규칙들은 형식을 보여 주려고 제가 만든 예시이고, 실제 MYCIN 규칙은 아닙니다. MYCIN은 수백 개, 흔히 600개쯤으로 소개돼요(클릭 2: 규칙이 늘어난다). 처음엔 잘 됐습니다(클릭 3: 연표). 그런데 예외가 생기죠. 예외마다 규칙을 더하다 보면 결국 이렇게 됩니다(클릭 4). 규칙 11은 세균 감염이면 항생제를 쓰라고 하고, 12는 페니실린 알레르기면 쓰지 말라고 해요. 둘 다 해당하는 환자는 어떻게 하죠? 사람이라면 판단하지만 규칙만 따르는 기계는 멈춥니다. 이런 일이 쌓이고 기대가 꺾이면서 지원이 줄어든 시기를 AI 겨울이라고 불러요. 두 번 있었습니다. 차이의 씨앗(클릭 5): 판단 기준을 쓰는 쪽이 사람이었다는 것. 참고로 같은 시기에 배우는 인공지능도 이미 있었어요 — 다음 장에서 봅니다.">
        <Fit><RulesSlide /></Fit>
      </Slide>
      <Slide full nav="기계학습의 발상" notes="앞 장에서 규칙 쓰기가 막혔죠. 그럼 어떻게 할까요? 발상을 뒤집습니다. 규칙을 사람이 쓰지 말고, 예시를 잔뜩 주고 기계가 찾게 하자(클릭 2). 스팸 메일 거르기로 볼게요. 스팸인 메일과 정상인 메일 수천 통을 레이블과 함께 줍니다. 그러면 기계가 셉니다(클릭 3). 당첨이라는 낱말은 스팸 쪽에 자주 나오고, 회의나 과제는 정상 쪽에 자주 나와요. 이 숫자가 바로 앞 장에서 본 가중치입니다. 여기서 중요한 건(클릭 4) 사람이 한 일이에요. 사람은 낱말을 세어 보라고 정했을 뿐입니다. 무엇을 볼지를 정한 거죠. 이걸 특징이라고 합니다. 특징은 사람이, 중요도는 기계가. 이게 기계학습입니다.">
        <Fit><MachineLearningSlide /></Fit>
      </Slide>
      <Slide full nav="퍼셉트론" notes="겨울을 녹인 생각은 의외로 오래됐어요. 뇌세포를 흉내내자. 뉴런은 여러 가지로 신호를 받아서 몸통에서 합치고, 충분히 크면 쏩니다. 이걸 수학으로 옮기면? 입력에 가중치를 곱해서 더하고, 문턱을 넘으면 1. 이게 퍼셉트론이에요. 화면의 숫자는 실제 계산입니다 — 0.6 더하기 0 더하기 0.8은 1.4, 임계값 1.0을 넘으니 출력 1. 그리고 여기서 '배운다'는 건 가중치를 고치는 일입니다. 규칙을 사람이 안 써요. 틀리면 숫자를 조금 바꿉니다.">
        <Fit><Scene duration={8}><PerceptronScene /></Scene></Fit>
      </Slide>
      <Slide full nav="층을 쌓는다" notes="퍼셉트론 하나가 할 수 있는 건 직선 하나를 긋는 일입니다. 화면 왼쪽 네모 안에 빨간 점 둘과 파란 점 둘이 엇갈려 놓여 있어요. 이걸 직선 하나로 갈라 보세요(클릭 1). 해 보면(클릭 2) 빨간 점선 세 개가 그어지는데 어떻게 돌려도 안 됩니다. 민스키가 1969년에 이걸 증명했고 첫 겨울이 왔죠. 그런데 퍼셉트론을 여러 개, 여러 층으로 쌓으면(클릭 3) 경계가 직선일 필요가 없어집니다. 구불구불한 초록 곡선이 생기고, 그 안에 빨간 점 둘이 들어가죠. 파란 점 둘은 밖입니다. 오른쪽 그림이 그 층을 쌓은 모양이에요 — 가운데 은닉층이 경계를 구부리는 자리입니다. 그런데 문제가 하나 남습니다(클릭 4). 층이 여러 개면 어느 가중치를 얼마나 고쳐야 할까요? 이 질문의 답이 다음 장입니다.">
        <Fit><LayersSlide /></Fit>
      </Slide>
      <Slide full nav="역전파" notes="앞 장의 질문에 답할 차례입니다. 화면 가운데가 그 신경망이고, 연결선마다 알약 모양 칩이 붙어 있어요. 저 숫자가 가중치입니다. 먼저 초록 점이 왼쪽에서 오른쪽으로 흐릅니다 — 앞으로 계산하는 거예요. 답이 나옵니다. 머핀 0.72. 그런데 정답은 치와와죠. 차이가 0.72입니다. 자, 여기서부터가 역전파예요. 앰버 점이 거꾸로 흐르고 칩마다 주황 뱃지가 붙습니다. 저게 이 가중치가 틀린 답에 얼마나 책임이 있는가예요. 부호도 보세요 — 어떤 건 올리라 하고 어떤 건 내리라 합니다. 그 몫만큼 숫자가 바뀌고 선의 굵기도 달라집니다. 다시 앞으로 계산하면 치와와 0.61, 차이는 0.39로 줄었어요. 화면의 숫자는 방향을 보여 주려고 제가 정한 예시값이지 실제 계산 결과는 아닙니다. 이 한 바퀴를 수백만 번 도는 것이 학습이에요. 아까 여섯 번째 장에서 본 틀리면 안의 숫자가 움직인다가 실제로는 이 절차입니다.">
        <Fit><Scene duration={11.5}><BackpropScene /></Scene></Fit>
      </Slide>
      <Slide full nav="지층 연표" notes="퍼셉트론이 나오고 11년 뒤, 민스키가 책 한 권으로 증명합니다. 한 층으로는 XOR 같은 간단한 문제도 못 푼다. 첫 겨울. 1986년, 방금 본 역전파가 퍼집니다 — 오차를 거꾸로 돌려보내 가중치를 고치는 그 방법이에요. 그래도 한동안은 사람이 특징을 뽑아 주는 기계학습이 실무를 했어요. 그러다 2012년, 데이터와 GPU가 만나면서 층이 깊어집니다. 알파고, 트랜스포머, 챗GPT. 2024년엔 노벨상까지요. 기보 이미지는 오리엔테이션 때 본 그 4국입니다(CC BY-SA, Wesalius).">
        <Fit><Scene duration={6.5}><StrataScene /></Scene></Fit>
      </Slide>
      <Slide full nav="세 시대" notes="여기까지를 한 표로 정리합니다. 두 질문만 기억하세요. 판단 기준은 누가 만드나, 무엇을 볼지는 누가 정하나. 왼쪽 규칙 기반은 둘 다 사람. 가운데 기계학습은 기준만 기계가 찾고 무엇을 볼지는 사람이 정했죠 — 아까 스팸 필터에서 낱말을 세라고 정한 게 그겁니다. 오른쪽 딥러닝은 둘 다 기계예요. 딥러닝은 기계학습의 한 갈래라는 것도 짚어 주세요. 그럼 기계는 어떻게 기준을 찾을까요? 방법이 세 가지 있습니다.">
        <Fit><ErasSlide /></Fit>
      </Slide>
      <Slide full nav="두 책상" notes="사진 12장이 있어요. 왼쪽 책상은 사진마다 정답표가 붙어 있죠. 고양이, 자동차, 컵. 모델은 새 사진을 보고 정답을 맞히도록 가중치를 고칩니다. 지도학습. 오늘 여러분이 할 거예요. 오른쪽 책상은 정답표가 없어요. 그래도 닮은 것끼리 모을 수 있죠. 비지도학습. 저 회색 고양이가 어디로 갈지 망설이는 것 보이시죠? 그게 비지도의 어려움입니다. (LLM 사전학습은 다음 단어를 정답으로 삼는 자기지도학습 — 물어보면 덧붙인다.)">
        <Fit><Scene duration={8.5}><SortScene /></Scene></Fit>
      </Slide>
      <Slide full nav="강화학습" notes="마지막 세 번째는 레이블도 없고 무더기도 없어요. 행동하고, 그 결과로 점수를 받습니다. 보세요. 첫 시행은 점프를 모르니 벽에 부딪혀요. 보상 0입니다. 다섯 번째 시행은 벽은 넘었는데 구멍에 빠집니다. 코인 하나를 먹었으니 보상 1이에요. 스무 번째는 둘 다 넘고 코인 셋을 다 먹습니다. 달라진 게 뭘까요? 점프하는 자리예요. 그걸 정책이라고 부릅니다. 상황마다 어떤 행동을 고를지를 정하는 방식이죠. 보상을 받은 뒤 이 정책을 고치는 것이 학습입니다. 오른쪽 그래프의 숫자는 무대에서 실제로 먹은 코인 수예요. 알파고가 자기랑 두던 것, 챗GPT가 사람 평가로 다듬어진 것, 오래 생각하는 모델. 다 이 고리를 돕니다. 여기까지가 오늘 볼 세 가지예요. 다음 장에서는 연구가 그 너머로 어디를 향하는지 봅니다.">
        <Fit><Scene duration={11.1}><RewardScene /></Scene></Fit>
      </Slide>
      <Slide full nav="세 갈래" notes="지도, 비지도, 강화. 지금 쓰이는 세 가지를 봤습니다. 연구는 그 너머로 가고 있어요. 세 갈래입니다. 하나, 답하기 전에 오래 생각하는 걸 배우기(클릭 1). 둘, 세상을 머릿속에서 미리 돌려 보기 — 이건 예측입니다(클릭 2). 셋, 아예 진짜 뇌의 배선을 읽어 오기(클릭 3). 셋의 공통점은 무엇을 보고 배우느냐를 바꾼다는 거예요(클릭 4). 그중 세 번째를 바로 다음 장에서 영상으로 봅니다.">
        <Fit><DirectionsSlide /></Fit>
      </Slide>
      <Slide full nav="초파리 커넥톰" notes="이달 초 구글과 자넬리아 연구소가 초파리 중추신경계 배선도 전체를 공개했어요. 뉴런 16만 6천 개, 연결 1억 2천5백만 개(클릭 1). 왼쪽 영상으로 어떻게 만들었는지 먼저 봅시다(1분 안쪽). 그리고 나흘 뒤, 사람들이 이 배선을 컴퓨터에서 돌리고 게임 화면을 초파리 눈에 넣기 시작했어요. 가운데 영상이 마인크래프트입니다(앞부분만 재생). 마리오 64와 둠도 있어요(클릭 2). 여기서 두 가지를 꼭 짚어 주세요. 첫째, 영상 제목이 '의식이 있는 뇌'라고 되어 있는데 그건 과장입니다. 실제로 돌아가는 건 측정된 연결 지도에 단순화한 뉴런 모델과 사람이 정한 입출력 규칙을 붙인 거예요. 둘째, 이건 학습이 아닙니다(클릭 3). 경험으로 연결이나 행동 선택을 고치는 절차가 없어요. 그래서 반복해도 늘지 않습니다. 아까 강화학습 캐릭터는 스무 번 만에 코인까지 갔죠. 마지막으로 셋을 나란히 봅시다(클릭 4). 퍼셉트론은 계산 모델, 커넥톰은 연결 지도, 이번 시연은 그 둘에 규칙을 붙인 실험이에요. 종류가 다릅니다. 뉴런이 많아졌다고 더 잘 배우는 게 아니에요. 예비: 둠 라이브 스트림 https://fly-brain-doom.awormuth.chatgpt.site/ — 유튜브가 막히면 수업 전 내려받은 영상으로.">
        <Fit><FlySlide /></Fit>
      </Slide>
      <Slide full nav="세 서랍" notes="정리합니다. 무엇을 보고 배우느냐만 보세요. 목표 레이블에 맞추면 지도, 레이블 없이 구조를 찾으면 비지도, 행동의 결과로 받는 보상을 키우면 강화. 초파리는? 셋 다 아니죠. 고칠 절차가 없으니까요. 참고로 세 가지가 전부는 아닙니다 — 지난 시간에 배운 LLM 사전학습은 데이터에서 스스로 목표를 만드는 자기지도학습이에요. 자, 문항 하나. 레이블이 붙은 사진 6천 장으로 대응을 학습하게 했다면? 제출해 주세요. … 지도학습이죠. 이제 여러분이 이걸 직접 합니다.">
        <Fit><DrawersSlide /></Fit>
      </Slide>
      <Slide full nav="Teachable Machine" notes="쓸 도구는 구글의 Teachable Machine이에요. 코드 없이 브라우저에서 됩니다. 왼쪽에서 사진을 모으고, 가운데서 학습시키고, 오른쪽에서 확인하고 내보내요. 왜 사진 몇십 장으로 되냐면, 이미 이미지를 수백만 장 본 신경망 위에 여러분 클래스만 얹기 때문이에요. 아까 표의 오른쪽 칸, 특징은 기계가 이미 뽑아 뒀죠. 이제 화면으로 순서를 정확히 보겠습니다.">
        <Fit><TmIntroSlide /></Fit>
      </Slide>
      <Slide full nav="따라 하기 ①" notes="순서대로 보세요(재생 버튼으로 반복). 주소로 들어가면 프로젝트 셋 중 이미지. 표준 모델. 그러면 이 3열 화면이 나와요. 클래스 이름을 먼저 바꿉니다. 치와와, 머핀. 그다음 업로드로 내려받은 폴더의 사진을 끌어다 놓아요. 클래스마다 40장 이상. 다 넣으면 가운데 버튼이 켜집니다. 여기까지가 데이터 준비예요. 아까 정답표 붙은 사진 더미, 그걸 지금 여러분 손으로 만드는 겁니다.">
        <Fit><Scene duration={T1.END}><TmWalk1 /></Scene></Fit>
      </Slide>
      <Slide full nav="따라 하기 ②" notes="학습 버튼을 누르면 탭을 옮기지 마세요. 브라우저 안에서 배우는 중이라 탭을 바꾸면 멈춥니다. 끝나면 오른쪽 미리보기에 사진을 넣어 보세요. 막대가 신뢰도예요. 일부러 헷갈리는 사진을 넣어 보세요. 웅크려 자는 갈색 치와와. 막대가 흔들리죠? 그게 오늘 기록할 거예요. 그다음 내보내기, 업로드, 링크 복사. 활동지에 붙이면 제출 끝입니다.">
        <Fit><Scene duration={T2.END}><TmWalk2 /></Scene></Fit>
      </Slide>
      <Slide full nav="실습" notes="활동지 열고, Teachable Machine 열고, 데이터셋 zip을 받으세요. 압축은 반드시 풀어야 합니다 — 압축 파일을 클릭해서 안을 들여다본 상태로는 업로드가 안 돼요. 새로 생긴 폴더에 치와와, 머핀, 시험 세 폴더가 보이면 준비 끝입니다. 치와와 폴더 안으로 들어가서 사진을 전체 선택해 치와와 카드에 넣으세요. 시험 폴더는 넣지 않습니다 — 그건 나중에 확인용으로 쓸 거예요. 학습시키고 시험 사진 열여섯 장을 하나씩 넣어서, 두 클래스 값이 비슷하거나 틀린 사진을 찾아 기록합니다. 왜 그런지 생각해 보세요. 갈색, 둥근 덩어리, 점 세 개. 화면에 시간 배분이 있으니 지금 어디쯤인지 보면서 하세요. 먼저 끝낸 사람은 헷갈릴 만한 사진을 직접 찾아 넣어 보라고 하면 됩니다.">
        <Fit><ActivitySlide /></Fit>
      </Slide>
      <Slide full nav="한눈 정리" notes="처음 가지 하나에서 시작했죠. 이제 열매가 넷 달렸어요. 정의, 역사, 방법, 그리고 여러분 모델. 출구 티켓 하나만 쓰고 갑니다. 이번 학습에서 새로 조정된 부분은 무엇이고, 무엇을 구분하도록 바뀌었나요? 힌트는 이겁니다 — 이미 이미지를 수백만 장 본 신경망은 그대로 두고, 그 위에 얹은 분류층만 조정된 거예요. '치와와와 머핀을 나누는 기준을 배웠다' 같은 일상 표현도 괜찮습니다. 제출하고 나가면 됩니다.">
        <Fit><SummarySlide /></Fit>
      </Slide>
    </Deck>
  );
}
