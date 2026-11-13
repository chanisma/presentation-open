import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import { useDeck } from '../../../../src/deck/DeckContext';
import { Scene, useSceneTime, interpolate, spring, riseIn, easeInOut, easeOut } from '../../../../src/scene';
import PyRunner, { preloadPython, type PyRunnerHandle, type PyRunResult, type PyStep } from '../../../../src/pyrun/PyRunner';
import { NOTES } from './notes';

/* ── 인공지능 기초 · 2026-2 — 물어보고, 받아서, 계산한다 (파이썬 입력과 자료형, 18장) ──
   plan: ./plan.md — 단일 진실 원천. 발표자 노트는 ./notes.ts (plan.md에서 뽑는다).

   1~4    키오스크(scene) → 값이 코드 안에 있으면(build) → input() 첫 실행(실행기) → 기다리는 동안(scene)
   5~9    숫자를 입력했는데(실행기 + 문항) → 자료형(실행기) → 같은 +, 다른 결과(build) → int() 형 변환(실행기·한 줄씩) → 세 가지 형 변환(build)
   10     활동 ① (활동지 1~3번)
   11~15  사탕 나누기(scene) → 산술 연산자 일곱(실행기 + 문항) → 계산 순서(build) → 매점 계산기(실행기) → 오류와 논리 오류(build + 문항)
   16~18  활동 ② (4~7번) → AI 코드 속 형 변환(build, 확장) → 한 줄에 모인 오늘(static + 출구)

   코드 실행기는 assets/pyrun (활동지와 같은 부품, 2026-11-12 input() 다시 실행 방식 추가).
   테마: 계산대 영수증 감열지(registry). 자료형 색 — 문자열 주황 · 정수형 청록 · 실수형 보라. */

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

/* ── 색·타이포 ── */
const C = {
  paper: '#f4f4ef',
  card: '#fffdf8',
  ink: '#16201b',
  mute: '#5d6660',
  faint: '#98a09a',
  teal: '#0f6e66',
  tealSoft: 'rgba(15,110,102,0.10)',
  orange: '#e8590c',
  orangeSoft: 'rgba(232,89,12,0.10)',
  purple: '#6741d9',
  purpleSoft: 'rgba(103,65,217,0.10)',
  red: '#c0392b',
  redSoft: 'rgba(192,57,43,0.09)',
  green: '#1f7a4d',
  amber: '#b7791f',
  editor: '#1d2433',
  editorInk: '#e6e9f2',
  tag: '#d6336c',
};
/* 자료형 색 — 실행기 변수 상자와 같다 */
const T = { str: C.orange, int: C.teal, float: C.purple };
const PAPER: CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundColor: C.paper,
  backgroundImage:
    'radial-gradient(1100px 700px at 80% 18%, rgba(255,255,255,0.7), transparent 70%), repeating-linear-gradient(0deg, rgba(22,32,27,0.022) 0 1px, transparent 1px 34px)',
};
const abs = (x: number, y: number, w?: number, h?: number): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h });
const kick: CSSProperties = { fontSize: 19, fontWeight: 750, letterSpacing: '0.14em', color: C.orange };
const h1: CSSProperties = { fontFamily: 'var(--font-head)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.14, fontSize: 56, wordBreak: 'keep-all', margin: 0, color: C.ink };
const body: CSSProperties = { fontSize: 27, lineHeight: 1.5, color: C.mute, wordBreak: 'keep-all' };
const small: CSSProperties = { fontSize: 20, lineHeight: 1.45, color: C.mute, wordBreak: 'keep-all' };
const mono: CSSProperties = { fontFamily: "'JetBrains Mono', 'D2Coding', Consolas, 'Malgun Gothic', monospace", fontVariantNumeric: 'tabular-nums' };
const card: CSSProperties = { background: C.card, border: '1.5px solid rgba(22,32,27,0.15)', borderRadius: 16, boxShadow: '0 18px 40px -30px rgba(22,32,27,0.55)' };
const trans = 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)';

const BASE = 'data/2026-2/인공지능기초/파이썬-입력과-자료형';
const TAG_SVG = 'assets/svg/name-tag-string.svg';
const PRINTER_SVG = 'assets/svg/receipt-printer.svg';
const IMG = {
  sheet: `${BASE}/images/activity-sheet.jpg`,
  qr: `${BASE}/images/qr-activity.png`,
};
const SHEET_URL = `${BASE}/활동지.html`;

/** 클릭 빌드 — max를 엔진에 등록해야 그 수만큼 클릭한 뒤에 다음 장으로 넘어간다 */
function useClicks(max: number) {
  const { clicks, isStatic, registerMax } = useDeck();
  useEffect(() => {
    registerMax?.(max);
  }, [max, registerMax]);
  return isStatic ? 99 : clicks;
}

const show = (on: boolean, dy = 18): CSSProperties => ({ opacity: on ? 1 : 0, transform: on ? 'none' : `translateY(${dy}px)`, transition: trans });

function Page({ nav, n, children }: { nav: string; n: number; children: ReactNode }) {
  return (
    <Slide full nav={nav} notes={NOTES[n]}>
      <Fit>
        <div style={PAPER} aria-hidden />
        {children}
      </Fit>
    </Slide>
  );
}

function Head({ k, children, x = 100, y = 58, w = 1720, size }: { k: string; children: ReactNode; x?: number; y?: number; w?: number; size?: number }) {
  return (
    <div style={abs(x, y, w)}>
      <div style={kick}>{k}</div>
      <h2 style={{ ...h1, ...(size ? { fontSize: size } : {}), marginTop: 8 }}>{children}</h2>
    </div>
  );
}

function Term({ term, gloss, color = C.teal, style }: { term: ReactNode; gloss: string; color?: string; style?: CSSProperties }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 12, background: C.card, border: `1.5px solid ${color}66`, borderRadius: 12, padding: '8px 16px', ...style }}>
      <b style={{ fontSize: 25, color, whiteSpace: 'nowrap' }}>{term}</b>
      <span style={{ ...small, fontSize: 20 }}>{gloss}</span>
    </div>
  );
}

/** 끈 달린 이름표 SVG 위에 변수 이름을 얹는다. 글자 칸 viewBox x 126~368, y 62~128 (400×190) */
function NameTag({ name, w = 260, style, fontSize }: { name: string; w?: number; style?: CSSProperties; fontSize?: number }) {
  const k = w / 400;
  return (
    <div style={{ position: 'relative', width: w, height: 190 * k, flexShrink: 0, ...style }}>
      <img src={TAG_SVG} alt="" style={{ width: w, height: 190 * k, display: 'block' }} draggable={false} />
      <div style={{ position: 'absolute', left: 126 * k, top: 62 * k, width: 242 * k, height: 66 * k, display: 'grid', placeItems: 'center', ...mono, fontWeight: 800, fontSize: fontSize ?? 30 * k * 1.6, color: C.ink, whiteSpace: 'nowrap' }}>
        {name}
      </div>
    </div>
  );
}

/** 자료형 값 카드 — 실행기 변수 상자의 카드와 같은 색·모양 */
function ValCard({ v, kind, size = 40, style }: { v: string; kind: 'str' | 'int' | 'float'; size?: number; style?: CSSProperties }) {
  const col = T[kind];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        ...mono,
        fontWeight: 800,
        fontSize: size,
        color: col,
        background: '#fff',
        border: `3px solid ${col}88`,
        borderRadius: kind === 'float' ? size * 0.6 : kind === 'int' ? 6 : 12,
        padding: `${size * 0.12}px ${size * 0.42}px`,
        whiteSpace: 'pre',
        ...style,
      }}
    >
      {kind === 'str' && <span style={{ color: `${col}99` }}>"</span>}
      {v}
      {kind === 'str' && <span style={{ color: `${col}99` }}>"</span>}
    </span>
  );
}

const TYPE_LABEL = { str: '문자열 str', int: '정수형 int', float: '실수형 float' };

/* ── 정적 코드 색칠 (실행기의 색과 맞춘다) ── */
const KW = new Set(['def', 'return', 'if', 'else', 'for', 'in', 'import', 'from', 'as', 'True', 'False', 'None', 'class', 'and', 'or', 'not', 'while', 'try', 'except']);
const BI = new Set(['print', 'len', 'input', 'open', 'str', 'int', 'float', 'type']);
function hl(line: string): ReactNode[] {
  const re = /(#.*$)|([fF]?(?:"(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?))|(\b\d+(?:\.\d+)?\b)|([A-Za-z_가-힣][\w가-힣]*)|(\s+)|([^\s])/g;
  const out: ReactNode[] = [];
  let m: RegExpExecArray | null;
  let prev = '';
  let i = 0;
  while ((m = re.exec(line))) {
    const [tok, com, str, num, word] = m;
    const key = i++;
    if (com) out.push(<span key={key} style={{ color: '#7f8aa3', fontStyle: 'italic' }}>{com}</span>);
    else if (str) out.push(<span key={key} style={{ color: '#ffb38a' }}>{str}</span>);
    else if (num) out.push(<span key={key} style={{ color: '#ff9ecb' }}>{num}</span>);
    else if (word) {
      const rest = line.slice(re.lastIndex);
      const color = KW.has(word) ? '#c79bff' : prev === 'def' ? '#ffd166' : BI.has(word) ? '#6ad1ff' : /^\s*\(/.test(rest) ? '#8fe3b0' : undefined;
      out.push(<span key={key} style={color ? { color } : undefined}>{word}</span>);
      prev = word;
    } else out.push(tok);
  }
  return out;
}

function CodeBox({ lines, size = 30, style, numbers = true, lineStyle }: { lines: (string | ReactNode)[]; size?: number; style?: CSSProperties; numbers?: boolean; lineStyle?: (i: number) => CSSProperties | undefined }) {
  return (
    <div style={{ background: C.editor, color: C.editorInk, borderRadius: 18, padding: `${size * 0.7}px ${size * 0.9}px`, ...mono, fontSize: size, lineHeight: 1.6, boxShadow: '0 30px 60px -40px rgba(22,32,27,0.8)', ...style }}>
      {lines.map((l, i) => (
        <div key={i} style={{ display: 'flex', whiteSpace: 'pre', minHeight: size * 1.6, ...(lineStyle?.(i) ?? {}) }}>
          {numbers && <span style={{ color: '#6d7891', width: size * 1.4, flexShrink: 0, userSelect: 'none' }}>{i + 1}</span>}
          <span>{typeof l === 'string' ? hl(l) : l}</span>
        </div>
      ))}
    </div>
  );
}

/* 실행기 덱 색 */
const RUN_STYLE: CSSProperties = {
  '--pyrun-paper': C.card,
  '--pyrun-ink': C.ink,
  '--pyrun-mute': C.mute,
  '--pyrun-primary': C.teal,
  '--pyrun-tag': C.tag,
  '--pyrun-str': C.orange,
  '--pyrun-num': C.teal,
  '--pyrun-float': C.purple,
  '--pyrun-editor': C.editor,
} as CSSProperties;

function DeckButton({ onClick, children, tone = 'teal' }: { onClick: () => void; children: ReactNode; tone?: 'teal' | 'mute' }) {
  const col = tone === 'teal' ? C.teal : C.mute;
  return (
    <button
      onClick={onClick}
      style={{ font: 'inherit', fontSize: 20, fontWeight: 700, padding: '10px 20px', borderRadius: 12, border: `1.5px solid ${tone === 'teal' ? C.teal : 'rgba(22,32,27,0.25)'}`, background: 'transparent', color: col, cursor: 'pointer', whiteSpace: 'nowrap' }}
    >
      {children}
    </button>
  );
}

/** 영수증 종이 한 장 (감열지) */
function Receipt({ count, w = 300, title = '분식집', dashed = false, style }: { count: number | null; w?: number; title?: string; dashed?: boolean; style?: CSSProperties }) {
  const total = count == null ? null : count * 3000;
  return (
    <div
      style={{
        width: w,
        background: '#fffefa',
        border: dashed ? `2.5px dashed ${C.faint}` : '1px solid rgba(22,32,27,0.12)',
        boxShadow: dashed ? 'none' : '0 14px 30px -18px rgba(22,32,27,0.55)',
        padding: '18px 22px 22px',
        ...mono,
        color: C.ink,
        clipPath: dashed ? undefined : 'polygon(0 0, 100% 0, 100% 96%, 95% 100%, 90% 96%, 85% 100%, 80% 96%, 75% 100%, 70% 96%, 65% 100%, 60% 96%, 55% 100%, 50% 96%, 45% 100%, 40% 96%, 35% 100%, 30% 96%, 25% 100%, 20% 96%, 15% 100%, 10% 96%, 5% 100%, 0 96%)',
        ...style,
      }}
    >
      <div style={{ textAlign: 'center', fontWeight: 800, fontSize: 20, letterSpacing: '0.2em', color: C.mute }}>{title}</div>
      <div style={{ borderTop: `2px dashed ${C.faint}`, margin: '10px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20 }}>
        <span>떡볶이 × {count ?? '?'}</span>
        <span>3,000</span>
      </div>
      <div style={{ borderTop: `2px dashed ${C.faint}`, margin: '10px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 26, fontWeight: 800 }}>
        <span>합계</span>
        <span style={{ color: C.orange }}>{total == null ? '?' : total.toLocaleString('ko-KR')}원</span>
      </div>
    </div>
  );
}

/* ═════════════ 1 · 표지 — 분식집 키오스크 (scene) ═════════════ */
const CUSTOMERS = [1, 2, 4];
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '←', '0', '확인'];
const PR = { x: 1440, y: 140, w: 400 }; // 영수증 프린터 — 배출구 viewBox y≈172, x 50~490 (540×190)
const PK = PR.w / 540;
const SLOT_Y = PR.y + 172 * PK;
const SLOT_X = PR.x + 70 * PK;
const SLOT_W = 400 * PK;

function CoverScene() {
  const t = useSceneTime();
  const start = (i: number) => 1.2 + i * 2.7;
  // 지금 손님(키오스크 화면에 보이는 숫자)
  let cur = -1;
  CUSTOMERS.forEach((_, i) => { if (t >= start(i)) cur = i; });
  return (
    <>
      <div style={{ ...abs(100, 230, 700), ...riseIn(t, 0.1) }}>
        <div style={kick}>인공지능 기초 · 파이썬 두 번째 수업 · 입력과 자료형</div>
        <h1 style={{ ...h1, fontSize: 92, marginTop: 24, lineHeight: 1.08 }}>
          물어보고,
          <br />
          받아서,
          <br />
          <span style={{ color: C.orange }}>계산한다</span>
        </h1>
      </div>
      <div style={{ ...abs(100, 800, 660), ...riseIn(t, 0.5), ...body }}>
        같은 프로그램, 다른 입력, <b style={{ color: C.ink }}>다른 결과</b>
      </div>
      {/* 키오스크 화면 */}
      <div style={{ ...abs(860, 170, 500, 590), ...card, background: '#fff', borderRadius: 30, border: '10px solid #2b3530', overflow: 'hidden', ...riseIn(t, 0.2, 1.0, 40) }}>
        <div style={{ background: C.teal, color: '#fff', padding: '16px 26px', fontSize: 24, fontWeight: 800, letterSpacing: '0.08em' }}>분식집 · 주문하기</div>
        <div style={{ padding: '22px 26px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 30, fontWeight: 800, color: C.ink }}>떡볶이</span>
            <span style={{ ...mono, fontSize: 26, color: C.mute }}>3,000원</span>
          </div>
          <div style={{ marginTop: 18, fontSize: 24, fontWeight: 700, color: C.mute }}>몇 접시?</div>
          <div style={{ marginTop: 10, height: 74, borderRadius: 14, border: `3px solid ${C.teal}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 22px', ...mono, fontSize: 46, fontWeight: 800, color: C.orange }}>
            {cur >= 0 ? CUSTOMERS[cur] : <span style={{ color: C.faint, fontSize: 30 }}>_</span>}
          </div>
          <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {KEYS.map((k) => {
              const hit = CUSTOMERS.some((n, i) => String(n) === k && t >= start(i) && t < start(i) + 0.45) || (k === '확인' && CUSTOMERS.some((_, i) => t >= start(i) + 0.5 && t < start(i) + 0.9));
              return (
                <div key={k} style={{ height: 52, borderRadius: 12, display: 'grid', placeItems: 'center', ...mono, fontSize: k === '확인' ? 20 : 26, fontWeight: 800, background: hit ? C.orange : k === '확인' ? C.tealSoft : '#f1f2ee', color: hit ? '#fff' : k === '확인' ? C.teal : C.ink, transform: hit ? 'scale(0.94)' : 'none' }}>
                  {k}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* 영수증 프린터와 영수증 세 장 */}
      <img src={PRINTER_SVG} alt="영수증 프린터" style={{ ...abs(PR.x, PR.y, PR.w), ...riseIn(t, 0.3, 1.0, 40) }} draggable={false} />
      {CUSTOMERS.map((n, i) => {
        const s = start(i);
        if (t < s + 0.6) return null;
        const grow = interpolate(t, [s + 0.6, s + 1.5], [0, 1], easeOut);
        const fly = interpolate(t, [s + 1.9, s + 2.5], [0, 1], easeInOut);
        const stackX = 1400 + i * 46;
        const stackY = 640 + i * 70;
        const x = SLOT_X + (stackX - SLOT_X) * fly;
        const y = SLOT_Y - 4 + (stackY - SLOT_Y) * fly;
        const rot = fly * (-6 + i * 5);
        return (
          <div key={n} style={{ ...abs(x, y, SLOT_W), height: 220 * (fly > 0 ? 1 : grow), overflow: 'hidden', transform: `rotate(${rot}deg)`, transformOrigin: 'top center', zIndex: 2 + i }}>
            <Receipt count={n} w={SLOT_W} />
          </div>
        );
      })}
    </>
  );
}

/* ═════════════ 2 · 값이 코드 안에 있으면 (build) ═════════════ */
function ValuesInCode() {
  const c = useClicks(3);
  return (
    <>
      <Head k="지난 시간 → 오늘" w={1100}>값이 코드 안에 있으면</Head>
      <div style={{ ...abs(100, 230, 860) }}>
        <div style={{ display: 'inline-block', background: '#f2ead9', border: '1.5px solid #d6c7a6', color: '#8a6a2e', fontWeight: 800, fontSize: 18, borderRadius: 8, padding: '4px 12px', marginBottom: 12 }}>지난 시간 4장</div>
        <div style={{ position: 'relative' }}>
          <CodeBox lines={['name = "민지"', 'print(f"안녕, 나는 {name}이야.")']} size={34} />
          {/* "민지" 자리 표시 */}
          <div style={{ ...abs(232, 16, 150, 70), border: `4px solid ${C.red}`, borderRadius: '50%', opacity: c >= 1 ? 1 : 0, transition: trans }} />
        </div>
      </div>
      <div style={{ ...abs(100, 480, 860), ...card, padding: '22px 28px', ...show(c >= 1) }}>
        <div style={{ fontSize: 30, fontWeight: 800 }}>서연이가 쓰려면?</div>
        <div style={{ ...body, marginTop: 6 }}>
          지난 시간의 답: <span style={{ textDecoration: c >= 2 ? 'line-through' : 'none', textDecorationColor: C.red, textDecorationThickness: 3 }}>코드에서 한 곳만 고친다</span>
        </div>
        <div style={{ ...body, marginTop: 4, color: C.red, fontWeight: 700, ...show(c >= 2, 6) }}>그런데 서연이는 코드를 열지 않는다</div>
      </div>
      {/* 칸막이와 사용자 화면 */}
      <div style={{ ...abs(1010, 210, 6, 600), background: 'repeating-linear-gradient(180deg, rgba(22,32,27,0.35) 0 14px, transparent 14px 24px)', ...show(c >= 2, 0) }} />
      <div style={{ ...abs(1010, 180), transform: 'translateX(-50%)', display: 'flex', gap: 30, fontSize: 20, fontWeight: 800, color: C.mute, whiteSpace: 'nowrap', ...show(c >= 2, 0) }}>
        <span style={{ marginRight: 30 }}>개발자 쪽</span>
        <span>사용자 쪽</span>
      </div>
      <div style={{ ...abs(1070, 240, 750, 400), ...card, background: '#fff', borderRadius: 24, overflow: 'hidden', ...show(c >= 2) }}>
        <div style={{ height: 52, background: '#e9ece6', display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px' }}>
          {[0, 1, 2].map((i) => <i key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: ['#ff6358', '#f0a91e', '#43c47a'][i] }} />)}
          <span style={{ marginLeft: 14, fontSize: 18, color: C.mute, fontWeight: 700 }}>자기소개 프로그램</span>
        </div>
        <div style={{ padding: '46px 46px', ...mono, fontSize: 38, lineHeight: 1.8, color: C.ink }}>
          <div>
            이름: <span style={{ display: 'inline-block', width: 220, borderBottom: `4px solid ${C.teal}`, color: C.teal, fontWeight: 800 }}>서연<span style={{ animation: 'none', color: C.orange }}>▮</span></span>
          </div>
          <div style={{ color: C.faint }}>안녕, 나는 서연이야.</div>
          <div style={{ ...small, fontFamily: 'var(--font-body)', marginTop: 26 }}>코드는 보이지 않는다 · 바뀌는 값은 프로그램이 물어본다</div>
        </div>
      </div>
      <div style={{ ...abs(100, 880, 1720), display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap', ...show(c >= 3) }}>
        <Term term="사용자" gloss="프로그램을 실행해 쓰는 사람" />
        <Term term="입력" gloss="프로그램이 필요한 값을 받아들이는 것 · 받은 값은 입력값" color={C.orange} />
        <b style={{ fontSize: 28, color: C.ink, marginLeft: 12 }}>바뀌는 값은 코드에 적지 말고 사용자에게 묻는다</b>
      </div>
    </>
  );
}

/* ═════════════ 3 · input()으로 물어보기 (static · 실행기) ═════════════ */
const ASK = 'name = input("이름: ")\nprint(f"반가워, {name}!")';
const ASK_BLANK = 'name = input()\nprint(f"반가워, {name}!")';
function AskFirst() {
  const ref = useRef<PyRunnerHandle>(null);
  return (
    <>
      <Head k="입력 함수" w={1200}>
        <span style={mono}>input()</span>으로 물어보기
      </Head>
      <div style={abs(100, 230, 1340, 700)}>
        <PyRunner ref={ref} code={ASK} vars types font={34} ui={22} style={{ ...RUN_STYLE, height: 700 }} />
      </div>
      <div style={{ ...abs(1480, 230, 340), display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Term term={<span style={mono}>input()</span>} gloss="사용자에게 값을 입력받는 내장 함수" color={C.orange} style={{ flexDirection: 'column', gap: 6 }} />
        <Term term="안내 문구" gloss="무엇을 입력할지 알려 주는 문자열 · 괄호 안에 넣는다 (프롬프트)" style={{ flexDirection: 'column', gap: 6 }} />
        <div style={{ ...card, padding: '18px 20px' }}>
          <div style={{ ...mono, fontSize: 24, color: C.ink }}>
            input(<span style={{ color: C.orange }}>"이름: "</span>)
          </div>
          <div style={{ fontSize: 22, color: C.mute, margin: '6px 0' }}>↓ 출력 칸에 그대로</div>
          <div style={{ ...mono, fontSize: 24, color: C.ink }}>
            이름: <span style={{ color: C.teal, textDecoration: 'underline', textUnderlineOffset: 5 }}>서연</span>
          </div>
          <div style={{ ...small, fontSize: 17, marginTop: 6 }}>밑줄 = 사용자가 친 값</div>
        </div>
      </div>
      <div style={{ ...abs(100, 958, 1720), display: 'flex', gap: 16, alignItems: 'center' }}>
        <DeckButton onClick={() => ref.current?.setCode(ASK_BLANK)}>안내 문구 지우기</DeckButton>
        <DeckButton tone="mute" onClick={() => ref.current?.setCode(ASK)}>안내 문구 되돌리기</DeckButton>
        <span style={small}>실행하면 출력 칸에 입력 줄이 생깁니다 · 값을 쓰고 Enter (한글은 조합이 끝난 뒤 Enter)</span>
      </div>
    </>
  );
}

/* ═════════════ 4 · 프로그램이 기다리는 동안 (scene) ═════════════ */
const CODE_X = 380;
const CODE_Y = 200;
const LINE_H = 66;
const TYPED = ['서', '연'];
function WaitScene() {
  const t = useSceneTime();
  const arrowY = CODE_Y + 22 + (t < 7.0 ? 0 : interpolate(t, [7.0, 7.5], [0, LINE_H], easeInOut));
  const arrowIn = interpolate(t, [0.3, 1.0], [0, 1], easeOut);
  const waiting = t >= 1.2 && t < 5.0;
  const typedN = TYPED.filter((_, i) => t >= 3.0 + i * 0.6 + 0.45).length;
  const quotes = interpolate(t, [4.3, 4.7], [0, 1], easeOut);
  const enter = t >= 5.0 && t < 5.4;
  // 값 카드: 가운데(900, 700)에서 코드 줄의 input(...) 자리로
  const up = interpolate(t, [5.1, 5.9], [0, 1], easeInOut);
  const cardX = 860 + (CODE_X + 196 - 860) * up;
  const cardY = 690 + (CODE_Y + 10 - 690) * up;
  const cardScale = 1 - up * 0.2;
  const tie = interpolate(t, [6.1, 6.8], [0, 1], easeOut);
  const out2 = t >= 7.6;
  const keyHit = (i: number) => t >= 3.0 + i * 0.6 && t < 3.0 + i * 0.6 + 0.35;
  return (
    <>
      <Head k="입력을 기다리는 동안" w={1100}>프로그램이 기다리는 동안</Head>
      {/* 코드 두 줄 */}
      <div style={{ ...abs(CODE_X, CODE_Y, 1100), background: C.editor, borderRadius: 18, padding: '12px 26px', ...mono, fontSize: 40, lineHeight: `${LINE_H}px`, color: C.editorInk, boxShadow: '0 30px 60px -40px rgba(22,32,27,0.8)' }}>
        <div style={{ background: t >= 1.0 && t < 7.0 ? 'rgba(255,209,102,0.14)' : 'transparent', borderRadius: 8, padding: '0 10px', margin: '0 -10px' }}>
          {hl('name = ')}
          <span style={{ opacity: 1 - interpolate(t, [5.5, 5.9], [0, 1]) }}>{hl('input("이름: ")')}</span>
        </div>
        <div style={{ background: t >= 7.5 ? 'rgba(255,209,102,0.14)' : 'transparent', borderRadius: 8, padding: '0 10px', margin: '0 -10px' }}>{hl('print(f"반가워, {name}!")')}</div>
      </div>
      {/* 실행 표시 ▶ */}
      <div style={{ ...abs(CODE_X - 60, arrowY - 4), fontSize: 40, color: '#e0a100', opacity: arrowIn }}>▶</div>
      <div style={{ ...abs(80, CODE_Y + 22 - 4, 220), fontSize: 22, fontWeight: 800, color: C.amber, textAlign: 'right', opacity: waiting ? 1 : 0 }}>
        기다리는 중{'·'.repeat(1 + (Math.floor(t * 2.5) % 3))}
      </div>
      {/* 이름표 — 값 카드에 끈이 이어진다 */}
      <div style={{ ...abs(CODE_X - 330, CODE_Y + 160), opacity: tie, transform: `translateX(${(1 - tie) * -30}px)` }}>
        <NameTag name="name" w={260} fontSize={30} />
      </div>
      <svg width={DW} height={DH} style={{ ...abs(0, 0), pointerEvents: 'none', opacity: tie }}>
        <path d={`M ${CODE_X - 90} ${CODE_Y + 210} C ${CODE_X + 60} ${CODE_Y + 260}, ${cardX - 40} ${CODE_Y + 160}, ${cardX + 10} ${cardY + 40}`} stroke={C.tag} strokeWidth={4} strokeDasharray="10 9" fill="none" strokeDashoffset={(1 - tie) * 120} />
      </svg>
      {/* 키보드 */}
      <div style={{ ...abs(130, 640), display: 'flex', gap: 16 }}>
        {TYPED.map((k, i) => (
          <div key={k} style={{ width: 110, height: 100, borderRadius: 16, background: keyHit(i) ? C.orange : '#fff', color: keyHit(i) ? '#fff' : C.ink, border: '2px solid rgba(22,32,27,0.2)', boxShadow: keyHit(i) ? 'none' : '0 8px 0 rgba(22,32,27,0.15)', transform: keyHit(i) ? 'translateY(6px)' : 'none', display: 'grid', placeItems: 'center', fontSize: 44, fontWeight: 800 }}>
            {k}
          </div>
        ))}
        <div style={{ width: 210, height: 100, borderRadius: 16, background: enter ? C.teal : '#fff', color: enter ? '#fff' : C.ink, border: '2px solid rgba(22,32,27,0.2)', boxShadow: enter ? 'none' : '0 8px 0 rgba(22,32,27,0.15)', transform: enter ? 'translateY(6px)' : 'none', display: 'grid', placeItems: 'center', fontSize: 32, fontWeight: 800 }}>
          Enter ⏎
        </div>
      </div>
      <div style={{ ...abs(130, 770), ...small }}>키보드로 친 글자</div>
      {/* 날아가는 글자 */}
      {TYPED.map((k, i) => {
        const s = 3.0 + i * 0.6;
        if (t < s || t > s + 0.5) return null;
        const f = interpolate(t, [s, s + 0.45], [0, 1], easeInOut);
        const x0 = 160 + i * 126;
        const x1 = 900 + i * 50;
        return <div key={k} style={{ ...abs(x0 + (x1 - x0) * f, 650 - Math.sin(f * Math.PI) * 120 + f * 40), fontSize: 44, fontWeight: 800, color: C.orange }}>{k}</div>;
      })}
      {/* 값 카드 */}
      {typedN > 0 && (
        <div style={{ ...abs(cardX, cardY), transform: `scale(${cardScale})`, transformOrigin: 'left top', zIndex: 3 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', ...mono, fontWeight: 800, fontSize: 48, color: C.orange, background: '#fff', border: `3px solid ${C.orange}88`, borderRadius: 12, padding: '4px 20px' }}>
            <span style={{ opacity: quotes }}>"</span>
            {TYPED.slice(0, typedN).join('')}
            <span style={{ opacity: quotes }}>"</span>
          </span>
        </div>
      )}
      {/* 출력 칸 */}
      <div style={{ ...abs(760, 600, 700, 210), ...card, padding: '18px 24px' }}>
        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.12em', color: C.mute }}>출력</div>
        <div style={{ ...mono, fontSize: 32, marginTop: 10, lineHeight: 1.5 }}>
          <div style={{ opacity: t >= 1.0 ? 1 : 0 }}>
            이름: <span style={{ color: C.teal, textDecoration: 'underline', textUnderlineOffset: 5 }}>{TYPED.slice(0, typedN).join('')}</span>
            {t >= 1.2 && t < 5.0 && <span style={{ color: C.orange, opacity: Math.floor(t * 3) % 2 ? 1 : 0.15 }}>▮</span>}
          </div>
          <div style={{ opacity: out2 ? 1 : 0, transition: 'opacity .3s' }}>반가워, 서연!</div>
        </div>
      </div>
      <div style={{ ...abs(760, 840, 700), ...small, fontSize: 22, opacity: interpolate(t, [8.0, 8.6], [0, 1]) }}>
        돌려준 값은 <b style={{ ...mono, color: C.orange }}>문자열 "서연"</b> · 따옴표를 기억해 두세요
      </div>
    </>
  );
}

/* ═════════════ 5 · 숫자를 입력했는데 (static · 실행기 + 문항) ═════════════ */
const SALE = 'count = input("몇 접시? ")\nprint(count * 3000)';
const SALE_MORE = SALE + '\nprint(type(count))\nprint("2" * 3)';
function NumberSurprise() {
  const ref = useRef<PyRunnerHandle>(null);
  const [len, setLen] = useState<number | null>(null);
  const [more, setMore] = useState(false);
  const onRun = (r: PyRunResult) => {
    const first = (r.prog ?? r.output ?? '').split('\n')[0] || '';
    setLen(r.error ? null : first.length);
    if (/<class/.test(r.prog ?? '')) setMore(true);
  };
  const wrong = len != null && len > 10;
  return (
    <>
      <Head k="예측해 보기" w={1240}>숫자를 입력했는데</Head>
      <div style={abs(100, 230, 1220, 700)}>
        <PyRunner ref={ref} code={SALE} vars types font={32} ui={22} style={{ ...RUN_STYLE, height: 700 }} onRun={onRun} onChange={() => { setLen(null); }} />
      </div>
      <div style={{ ...abs(1380, 230, 440), display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center' }}>
        <div style={{ ...small, fontSize: 22, alignSelf: 'flex-start' }}>
          1장 키오스크 · <b style={{ color: C.ink }}>2접시</b>를 입력하면 기대하는 영수증
        </div>
        <div style={{ position: 'relative' }}>
          <Receipt count={2} w={330} dashed />
          <svg width={330} height={200} style={{ ...abs(0, 0), opacity: wrong ? 1 : 0, transition: trans }}>
            <path d="M 10 190 L 320 10" stroke={C.red} strokeWidth={6} strokeLinecap="round" />
          </svg>
        </div>
        <div style={{ ...card, padding: '14px 20px', borderColor: `${C.red}66`, ...show(wrong) }}>
          <b style={{ color: C.red, fontSize: 24 }}>문자열 하나 · 글자 수 {len ?? 0}</b>
        </div>
      </div>
      <div style={{ ...abs(1380, 760, 440), display: 'flex', flexDirection: 'column', gap: 12, ...show(more) }}>
        <Term term="문자열 반복" gloss={'문자열 × 정수 → 이어 붙이기  "2" * 3 → 222'} color={C.orange} style={{ flexDirection: 'column', gap: 4 }} />
        <Term term={<span style={mono}>type()</span>} gloss="값의 자료형을 알려 주는 내장 함수" style={{ flexDirection: 'column', gap: 4 }} />
      </div>
      <div style={{ ...abs(100, 958, 1240), display: 'flex', gap: 16, alignItems: 'center' }}>
        <DeckButton onClick={() => ref.current?.setCode(SALE_MORE)}>type()과 "2" * 3 덧붙이기</DeckButton>
        <DeckButton tone="mute" onClick={() => { ref.current?.setCode(SALE); setMore(false); }}>처음 두 줄로</DeckButton>
        <span style={small}>문항을 먼저 열고, 공개한 뒤 실행해 2를 입력합니다</span>
      </div>
    </>
  );
}

/* ═════════════ 6 · 값에는 종류가 있다: 자료형 (static · 실행기) ═════════════ */
function TypesSlide() {
  const [ran, setRan] = useState(false);
  const cards: { kind: 'str' | 'int' | 'float'; ko: string; ex: string[]; gloss: string; w: number }[] = [
    { kind: 'str', ko: '문자열', ex: ['2', '서연'], gloss: '따옴표로 감싼 글자 (지난 시간)', w: 520 },
    { kind: 'int', ko: '정수형', ex: ['2', '17'], gloss: '0과 양의 정수 · 음의 정수', w: 520 },
    { kind: 'float', ko: '실수형', ex: ['2.5', '2.0'], gloss: '소수 부분이 있는 수 · 소수점을 붙여 쓴다', w: 600 },
  ];
  return (
    <>
      <Head k="자료형" w={1000}>값에는 종류가 있다</Head>
      <div style={{ ...abs(1060, 70, 760), display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <Term term="자료형" gloss="값의 종류" />
      </div>
      <div style={{ ...abs(100, 200, 1720), display: 'flex', gap: 30, alignItems: 'stretch' }}>
        {cards.map((c) => (
          <div key={c.kind} style={{ width: c.w, ...card, padding: '20px 26px', borderColor: `${T[c.kind]}66`, boxShadow: ran ? `0 0 0 4px ${T[c.kind]}33, 0 18px 40px -30px rgba(22,32,27,0.55)` : card.boxShadow, transition: trans }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <b style={{ fontSize: 34, color: T[c.kind] }}>{c.ko}</b>
              <span style={{ ...mono, fontSize: 28, fontWeight: 800, color: T[c.kind] }}>{c.kind}</span>
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 14 }}>
              {c.ex.map((v) => <ValCard key={v} v={v} kind={c.kind} size={32} />)}
            </div>
            <div style={{ ...small, marginTop: 12 }}>{c.gloss}</div>
          </div>
        ))}
      </div>
      <div style={{ ...abs(1300, 172, 200), ...small, fontSize: 18, textAlign: 'center', color: C.purple, fontWeight: 800 }}>2와 2.0은 크기가 같다</div>
      <div style={abs(100, 470, 1220, 520)}>
        <PyRunner code={'print(type("2"))\nprint(type(2))\nprint(type(2.5))\nprint(type(2.0))'} font={30} ui={22} style={{ ...RUN_STYLE, height: 520 }} onRun={() => setRan(true)} onChange={() => setRan(false)} />
      </div>
      <div style={{ ...abs(1370, 490, 450), ...card, padding: '22px 26px' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.ink }}>출력 읽는 법</div>
        <div style={{ ...mono, fontSize: 26, marginTop: 12 }}>
          {"<class '"}<b style={{ color: C.orange }}>str</b>{"'>"}
        </div>
        <div style={{ ...body, fontSize: 24, marginTop: 6 }}>= 이 값의 자료형은 <b style={{ color: C.orange }}>str</b></div>
        <div style={{ ...small, marginTop: 12 }}>class라는 말은 지금은 신경 쓰지 않아도 됩니다</div>
        <div style={{ borderTop: '1.5px dashed rgba(22,32,27,0.2)', margin: '16px 0' }} />
        <div style={{ ...small, color: C.ink }}>
          학번 <span style={mono}>10315</span>는 숫자 모양이어도 계산하지 않는다 → 글자로 다루려면 <span style={{ ...mono, color: C.orange }}>"10315"</span>
        </div>
      </div>
    </>
  );
}

/* ═════════════ 7 · 같은 +, 다른 결과 (build) ═════════════ */
function PlusTwoFaces() {
  const c = useClicks(3);
  const Lane = ({ y, h, on, color, label, children }: { y: number; h: number; on: boolean; color: string; label: string; children: ReactNode }) => (
    <div style={{ ...abs(100, y, 1720, h), borderRadius: 22, background: `${color}10`, border: `2px solid ${color}44`, display: 'flex', alignItems: 'center', padding: '0 40px', gap: 40, ...show(on) }}>
      <b style={{ width: 230, fontSize: 26, color, flexShrink: 0 }}>{label}</b>
      {children}
    </div>
  );
  const plus = <span style={{ ...mono, fontSize: 56, fontWeight: 800, color: C.ink }}>+</span>;
  const arrow = <span style={{ fontSize: 46, color: C.mute }}>→</span>;
  return (
    <>
      <Head k="연산자는 자료형을 본다" w={1100}>
        같은 <span style={mono}>+</span>, 다른 결과
      </Head>
      <div style={{ ...abs(1080, 70, 740), display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <Term term="연산자" gloss="값으로 계산·처리를 하는 기호" />
        <Term term="TypeError" gloss="쓸 수 없는 자료형 조합" color={C.red} style={{ ...show(c >= 3, 0) }} />
      </div>
      <Lane y={220} h={190} on={c >= 1} color={T.int} label="숫자 + 숫자">
        <ValCard v="3" kind="int" size={52} />
        {plus}
        <ValCard v="4" kind="int" size={52} />
        {arrow}
        <ValCard v="7" kind="int" size={64} />
        <span style={{ ...body, marginLeft: 'auto' }}>더한다</span>
      </Lane>
      <Lane y={440} h={190} on={c >= 2} color={T.str} label="문자열 + 문자열">
        <ValCard v="3" kind="str" size={52} />
        {plus}
        <ValCard v="4" kind="str" size={52} />
        {arrow}
        <ValCard v="34" kind="str" size={64} />
        <span style={{ ...body, marginLeft: 'auto' }}>이어 붙인다 · 문자열 연결</span>
      </Lane>
      <Lane y={660} h={170} on={c >= 3} color={C.red} label="문자열 + 숫자">
        <ValCard v="3" kind="str" size={46} />
        {plus}
        <ValCard v="4" kind="int" size={46} />
        <span style={{ fontSize: 46, color: C.red, fontWeight: 900 }}>✕</span>
        <div style={{ marginLeft: 10 }}>
          <div style={{ ...mono, fontSize: 21, color: C.red, fontWeight: 700 }}>TypeError: can only concatenate str (not "int") to str</div>
          <div style={{ ...body, fontSize: 24, color: C.ink, marginTop: 4 }}>문자열의 + 는 문자열끼리만 이을 수 있어요</div>
        </div>
      </Lane>
      <div style={{ ...abs(1220, 870, 600), ...card, padding: '16px 22px', ...show(c >= 3) }}>
        <b style={{ fontSize: 22 }}>* 는 문자열 × 정수가 된다</b>
        <span style={{ ...mono, fontSize: 22, marginLeft: 12 }}>
          <span style={{ color: T.str }}>"2"</span> * 3 → <span style={{ color: T.str }}>"222"</span>
        </span>
        <div style={{ ...small, fontSize: 18 }}>5장의 문자열 반복 · 허용되는 조합이라 오류가 아니다</div>
      </div>
    </>
  );
}

/* ═════════════ 8 · 형 변환: 문자열을 숫자로 (static · 실행기 한 줄씩) ═════════════ */
const CONV = 'count = input("몇 접시? ")\ncount = int(count)\nprint(count * 3000)';
const CONV_ONE = 'count = int(input("몇 접시? "))\nprint(count * 3000)';
function ConvertStep() {
  const ref = useRef<PyRunnerHandle>(null);
  const [done, setDone] = useState(false);
  const [one, setOne] = useState(false);
  const onStep = (s: PyStep) => setDone(/6000/.test(s.output));
  return (
    <>
      <Head k="형 변환" w={1200}>
        형 변환: 문자열을 숫자로
      </Head>
      <div style={{ ...abs(1240, 70, 580), display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <Term term="형 변환" gloss="자료형을 바꾼 새 값을 만드는 일" />
        <Term term={<span style={mono}>int()</span>} gloss="정수형으로 바꾼 새 값을 돌려준다" color={T.int} />
      </div>
      <div style={abs(100, 230, 1300, 690)}>
        <PyRunner ref={ref} code={CONV} vars types step mode="step" inputs={['2']} font={32} ui={22} style={{ ...RUN_STYLE, height: 690 }} onStep={onStep} onRun={(r) => setDone(/6000/.test(r.prog ?? ''))} onChange={() => setDone(false)} />
      </div>
      <div style={{ ...abs(1450, 250, 370), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{ ...small, fontSize: 19, alignSelf: 'flex-start' }}>미리 넣은 입력: <b style={{ ...mono, color: C.teal }}>2</b></div>
        <div style={{ ...show(done), transformOrigin: 'top' }}>
          <Receipt count={2} w={320} />
        </div>
      </div>
      <div style={{ ...abs(1450, 620, 370), ...card, padding: '18px 22px' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.ink }}>한 줄로 쓰면 — 실행 순서</div>
        <div style={{ ...mono, fontSize: 21, marginTop: 10, lineHeight: 1.7 }}>
          count = <span style={{ borderBottom: `3px solid ${T.int}` }}>int(<span style={{ borderBottom: `3px solid ${T.str}` }}>input("…")</span>)</span>
        </div>
        <div style={{ fontSize: 19, marginTop: 8, lineHeight: 1.6 }}>
          <b style={{ color: T.str }}>1</b> input이 문자열을 돌려주면
          <br />
          <b style={{ color: T.int }}>2</b> int가 받아 정수로 바꾸고
          <br />
          <b style={{ color: C.tag }}>3</b> count에 대입한다
        </div>
      </div>
      <div style={{ ...abs(100, 950, 1720), display: 'flex', gap: 16, alignItems: 'center' }}>
        <DeckButton onClick={() => { ref.current?.setCode(one ? CONV : CONV_ONE); setOne(!one); setDone(false); }}>{one ? '세 줄로 보기' : '한 줄로 쓰기'}</DeckButton>
        <span style={small}>[다음 줄 ▶]을 누를 때마다 count의 값 카드가 바뀝니다 · <b style={{ color: C.ink }}>int(count)만 쓰고 대입하지 않으면 count는 그대로 문자열</b></span>
      </div>
    </>
  );
}

/* ═════════════ 9 · 세 가지 형 변환과 바꿀 수 없는 값 (build) ═════════════ */
function ThreeConverts() {
  const c = useClicks(3);
  const Channel = ({ y, fn, from, fromKind, to, toKind, big, children }: { y: number; fn: string; from: string; fromKind: 'str' | 'int' | 'float'; to: string; toKind: 'str' | 'int' | 'float'; big?: boolean; children?: ReactNode }) => (
    <div style={{ ...abs(100, y, 1040, big ? 230 : 140) }}>
      <div style={{ ...abs(0, 0, 1040, big ? 140 : 120), borderRadius: 70, background: '#fff', border: '2px solid rgba(22,32,27,0.15)', display: 'flex', alignItems: 'center', padding: '0 36px', gap: 30 }}>
        <span style={{ transform: c >= 1 ? 'none' : 'translateX(40px)', opacity: c >= 1 ? 1 : 0.35, transition: trans }}>
          <ValCard v={from} kind={fromKind} size={big ? 44 : 36} />
        </span>
        <span style={{ fontSize: 34, color: C.faint }}>→</span>
        <span style={{ ...mono, fontSize: big ? 46 : 38, fontWeight: 800, color: T[toKind], background: `${T[toKind]}14`, borderRadius: 14, padding: '6px 20px' }}>{fn}</span>
        <span style={{ fontSize: 34, color: C.faint }}>→</span>
        <span style={{ ...show(c >= 1, 0) }}>
          <ValCard v={to} kind={toKind} size={big ? 44 : 36} />
        </span>
        <span style={{ ...small, marginLeft: 'auto', fontSize: 19, color: T[toKind], fontWeight: 800 }}>{TYPE_LABEL[toKind]}</span>
      </div>
      {children}
    </div>
  );
  return (
    <>
      <Head k="오늘 쓰는 형 변환 함수 셋" w={1100} size={52}>세 가지 형 변환과 바꿀 수 없는 값</Head>
      <div style={{ ...abs(1220, 70, 600), display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <Term term={<span style={mono}>float()</span>} gloss="실수형으로" color={T.float} />
        <Term term={<span style={mono}>str()</span>} gloss="문자열로" color={T.str} />
        <Term term="ValueError" gloss="받을 수 없는 모양의 값" color={C.red} style={show(c >= 3, 0)} />
      </div>
      <Channel y={220} fn="int()" from="17" fromKind="str" to="17" toKind="int" big>
        <div style={{ ...abs(40, 152, 1000), display: 'flex', alignItems: 'center', gap: 18, ...show(c >= 3) }}>
          <ValCard v="3.5" kind="str" size={30} style={{ transform: 'rotate(-8deg)', opacity: 0.85 }} />
          <ValCard v="열" kind="str" size={30} style={{ transform: 'rotate(6deg)', opacity: 0.85 }} />
          <div>
            <div style={{ ...mono, fontSize: 18, color: C.red, fontWeight: 700 }}>ValueError: invalid literal for int() with base 10: '3.5'</div>
            <div style={{ fontSize: 21, color: C.ink, marginTop: 2 }}>문자열 "3.5"는 int()로 바로 바꿀 수 없어요. 소수 부분이 있는 값은 float()로 받으세요</div>
          </div>
        </div>
      </Channel>
      <Channel y={500} fn="float()" from="3.5" fromKind="str" to="3.5" toKind="float" />
      <Channel y={660} fn="str()" from="17" fromKind="int" to="17" toKind="str" />
      <div style={{ ...abs(100, 830, 1040), display: 'flex', gap: 30, alignItems: 'center', ...show(c >= 3) }}>
        <span style={{ ...mono, fontSize: 24 }}>
          int(<span style={{ color: T.str }}>"3.5"</span>) → <b style={{ color: C.red }}>오류</b>
        </span>
        <span style={{ ...mono, fontSize: 24 }}>
          int(<span style={{ color: T.float }}>3.5</span>) → <b style={{ color: T.int }}>3</b>
        </span>
        <span style={small}>따옴표 하나 차이 · 실수를 넣으면 소수 부분을 버린다</span>
      </div>
      <div style={{ ...abs(1220, 240, 600), ...card, padding: '24px 28px', ...show(c >= 2) }}>
        <div style={{ fontSize: 26, fontWeight: 800 }}>무엇으로 바꿀까</div>
        {[
          ['개수', '딱 떨어지는 값', 'int()', T.int],
          ['키 · 몸무게', '소수가 나올 수 있는 값', 'float()', T.float],
          ['이름 · 학번', '계산하지 않는 값', '문자열 그대로', T.str],
        ].map(([a, b, f, col]) => (
          <div key={a} style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 16 }}>
            <b style={{ fontSize: 26, width: 150, color: C.ink }}>{a}</b>
            <span style={{ ...small, flex: 1 }}>{b}</span>
            <b style={{ ...mono, fontSize: 24, color: col }}>{f}</b>
          </div>
        ))}
        <div style={{ borderTop: '1.5px dashed rgba(22,32,27,0.2)', margin: '20px 0 14px' }} />
        <div style={{ ...mono, fontSize: 26 }}>
          str(<span style={{ color: T.int }}>17</span>) + <span style={{ color: T.str }}>"살"</span> → <span style={{ color: T.str }}>"17살"</span>
        </div>
        <div style={{ ...small, fontSize: 18, marginTop: 6 }}>문자열과 + 로 이으려면 str · f-문자열이면 바꾸지 않아도 된다</div>
      </div>
    </>
  );
}

/* ═════════════ 10 · 16 · 활동 ═════════════ */
const TASKS: [string, '' | 'auto' | 'compare'][] = [
  ['이름 묻고 인사하기', 'auto'],
  ['숫자를 받아 10 곱하기', 'auto'],
  ['고쳐 보기 (나이와 키)', 'auto'],
  ['예측하고 실행하기', 'compare'],
  ['사탕 나누기 프로그램', 'auto'],
  ['나만의 계산 프로그램', 'auto'],
  ['돌아보기', ''],
];
function TaskList({ from, to }: { from: number; to: number }) {
  return (
    <div>
      {TASKS.map(([t, kind], i) => {
        const no = i + 1;
        const now = no >= from && no <= to;
        const done = no < from;
        return (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 14, height: 54, borderLeft: `4px solid ${now ? (no === 6 ? C.orange : C.teal) : 'rgba(22,32,27,0.14)'}`, paddingLeft: 18, opacity: now ? 1 : 0.4 }}>
            <span style={{ ...mono, fontWeight: 800, fontSize: 22, color: C.faint, width: 24 }}>{no}</span>
            <span style={{ fontSize: 25, fontWeight: 700, color: C.ink }}>{t}</span>
            {done && <span style={{ fontSize: 15, fontWeight: 700, color: C.mute, border: '1.5px solid rgba(22,32,27,0.25)', borderRadius: 999, padding: '2px 10px' }}>저장됨</span>}
            {!done && kind === 'auto' && <span style={{ fontSize: 15, fontWeight: 700, color: C.green, border: `1.5px solid ${C.green}88`, borderRadius: 999, padding: '2px 10px' }}>코드 자동 점검</span>}
            {!done && kind === 'compare' && <span style={{ fontSize: 15, fontWeight: 700, color: C.amber, border: `1.5px solid ${C.amber}88`, borderRadius: 999, padding: '2px 10px' }}>예측·결과 비교</span>}
          </div>
        );
      })}
    </div>
  );
}

function SheetLink({ note }: { note: string }) {
  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      <img src={IMG.qr} alt="활동지 QR" style={{ width: 190, height: 190, borderRadius: 12, background: '#fff', padding: 10 }} />
      <div>
        <a href={SHEET_URL} target="_blank" rel="noopener" style={{ fontSize: 34, fontWeight: 800, color: C.orange, textDecoration: 'underline', textUnderlineOffset: 6 }}>
          활동지 열기 ↗
        </a>
        <div style={{ ...small, marginTop: 10 }}>{note}</div>
      </div>
    </div>
  );
}

function ActivityOne() {
  return (
    <>
      <Head k="활동 ①" w={1000}>활동지 1~3번: 묻고 받기</Head>
      <div style={{ ...abs(100, 230, 980, 680), borderRadius: 18, overflow: 'hidden', background: '#fff', boxShadow: '0 30px 60px -40px rgba(22,32,27,0.8)', border: '1.5px solid rgba(22,32,27,0.16)' }}>
        <div style={{ height: 44, background: '#e9ece6', display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px' }}>
          {[0, 1, 2].map((i) => <i key={i} style={{ width: 13, height: 13, borderRadius: '50%', background: ['#ff6358', '#f0a91e', '#43c47a'][i] }} />)}
          <span style={{ marginLeft: 16, ...mono, fontSize: 16, color: C.mute }}>활동지.html</span>
        </div>
        <img src={IMG.sheet} alt="활동지 첫 화면 — 과제마다 코드 실행기가 있다" style={{ width: 980, display: 'block' }} />
      </div>
      <div style={abs(1160, 230, 660)}>
        <SheetLink note="이름 · 학번 · 제출 암호를 넣고, 1~3번을 마치면 [중간 저장]" />
      </div>
      <div style={abs(1176, 470, 660)}>
        <TaskList from={1} to={3} />
      </div>
      <div style={{ ...abs(1160, 870, 660), ...card, padding: '14px 20px', fontSize: 21, lineHeight: 1.5, wordBreak: 'keep-all' }}>
        실행하면 출력 칸에 입력 줄이 생겨요. 값을 쓰고 <b>Enter</b> (한글은 조합이 끝난 뒤 Enter)
      </div>
      <div style={{ ...abs(100, 950, 1000), ...small, fontSize: 22 }}>
        지금은 <b style={{ color: C.orange }}>3번까지만</b> 하고 화면으로 돌아옵니다 · [중간 저장]을 눌러도 <b style={{ color: C.ink }}>탭은 닫지 마세요</b>
      </div>
    </>
  );
}

function ActivityTwo() {
  const examples: { title: string; lines: string[]; rot: number }[] = [
    { title: '용돈 계산기', lines: ['이번 주 용돈: 20000', '쓴 돈: 13500', '남은 돈은 6500원입니다'], rot: -3 },
    { title: '세 과목 평균', lines: ['국어: 92', '수학: 85', '영어: 88', '평균은 88.33333333333333점'], rot: 2 },
    { title: '영상 두 편 길이', lines: ['첫 영상(분): 95', '둘째 영상(분): 48', '합계 2시간 23분'], rot: -1.5 },
  ];
  return (
    <>
      <Head k="활동 ②" w={1000}>활동지 4~7번: 계산하는 프로그램</Head>
      <div style={{ ...abs(100, 210, 1720), display: 'flex', gap: 34, justifyContent: 'center' }}>
        {examples.map((e) => (
          <div key={e.title} style={{ width: 480, transform: `rotate(${e.rot}deg)`, ...card, padding: 0, overflow: 'hidden' }}>
            <div style={{ background: C.orangeSoft, padding: '10px 20px', fontSize: 22, fontWeight: 800, color: C.orange }}>6번 예시 · {e.title}</div>
            <div style={{ ...mono, fontSize: 23, lineHeight: 1.65, padding: '14px 20px', color: C.ink, whiteSpace: 'pre' }}>
              {e.lines.map((l, i) => {
                const [a, b] = l.split(': ');
                return (
                  <div key={i}>
                    {b != null && i < e.lines.length - 1 ? (
                      <>
                        {a}: <span style={{ color: C.teal, textDecoration: 'underline', textUnderlineOffset: 4 }}>{b}</span>
                      </>
                    ) : (
                      l
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div style={abs(100, 480, 760)}>
        <SheetLink note="열어 둔 활동지 탭으로 돌아갑니다 · 다 하면 [제출하기]" />
      </div>
      <div style={{ ...abs(100, 720, 760), ...card, padding: '16px 22px' }}>
        <b style={{ fontSize: 22 }}>6번 조건</b>
        <div style={{ ...small, fontSize: 20, marginTop: 6, color: C.ink }}>☐ 입력 2개 이상 ☐ 형 변환 ☐ 산술 연산 ☐ f-문자열 출력 ☐ 시험 입력과 예상값 적기</div>
      </div>
      <div style={abs(1000, 470, 820)}>
        <TaskList from={4} to={7} />
      </div>
    </>
  );
}

/* ═════════════ 11 · 사탕 나누기 (scene) ═════════════ */
const CANDY_N = 17;
const PEOPLE = 5;
const CANDY_COL = ['#e8590c', '#0f6e66', '#6741d9', '#d6336c', '#c99a2e'];
const BAG = { x: 130, y: 250, w: 330, h: 270 };
const PLATES = Array.from({ length: PEOPLE }, (_, i) => {
  const a = Math.PI * (0.92 - (i / (PEOPLE - 1)) * 0.84);
  return { x: 900 + Math.cos(a) * 470, y: 900 - Math.sin(a) * 300 };
});
const DEAL0 = 1.0;
const DEAL_GAP = 0.3;
function candyHome(i: number) {
  return { x: BAG.x + 40 + (i % 6) * 46, y: BAG.y + 70 + Math.floor(i / 6) * 50 };
}
function CandyScene() {
  const t = useSceneTime();
  const dealt = CANDY_N - (CANDY_N % PEOPLE); // 15
  const lastDeal = DEAL0 + (dealt - 1) * DEAL_GAP + 0.45;
  const rounds = Math.min(3, Math.floor(Array.from({ length: dealt }, (_, i) => (t >= DEAL0 + i * DEAL_GAP + 0.45 ? 1 : 0)).reduce((a: number, b) => a + b, 0) / PEOPLE));
  const leftGlow = interpolate(t, [lastDeal + 0.3, lastDeal + 0.8], [0, 1]);
  const res1 = interpolate(t, [lastDeal + 0.9, lastDeal + 1.4], [0, 1], easeOut);
  const res2 = interpolate(t, [lastDeal + 1.5, lastDeal + 2.0], [0, 1], easeOut);
  const res3 = interpolate(t, [lastDeal + 2.2, lastDeal + 2.7], [0, 1], easeOut);
  return (
    <>
      <Head k="나눗셈 셋" w={1180}>
        사탕 나누기: <span style={mono}>/</span> · <span style={mono}>//</span> · <span style={mono}>%</span>
      </Head>
      {/* 봉지 */}
      <div style={{ ...abs(BAG.x, BAG.y, BAG.w, BAG.h), borderRadius: '40px 40px 60px 60px', background: '#efe6d2', border: '3px solid #c8b48a', boxShadow: 'inset 0 -20px 40px rgba(200,180,138,0.35)' }} />
      <div style={{ ...abs(BAG.x, BAG.y - 40, BAG.w), textAlign: 'center', fontSize: 24, fontWeight: 800, color: C.mute }}>사탕 17개</div>
      {/* 바퀴 수 */}
      <div style={{ ...abs(560, 200), display: 'flex', gap: 14 }}>
        {[1, 2, 3].map((r) => (
          <span key={r} style={{ fontSize: 24, fontWeight: 800, padding: '6px 16px', borderRadius: 999, background: rounds >= r ? C.tealSoft : 'transparent', color: rounds >= r ? C.teal : C.faint, border: `2px solid ${rounds >= r ? C.teal : 'rgba(22,32,27,0.15)'}`, transition: 'all .3s' }}>
            {r}바퀴
          </span>
        ))}
      </div>
      {/* 접시 */}
      {PLATES.map((p, i) => (
        <div key={i}>
          <div style={{ ...abs(p.x - 95, p.y - 40, 190, 80), borderRadius: '50%', background: '#fff', border: '3px solid rgba(22,32,27,0.18)', boxShadow: '0 12px 20px -14px rgba(22,32,27,0.5)' }} />
          <div style={{ ...abs(p.x - 60, p.y + 48, 120), textAlign: 'center', fontSize: 20, fontWeight: 700, color: C.mute }}>{i + 1}번</div>
        </div>
      ))}
      {/* 사탕 */}
      {Array.from({ length: CANDY_N }, (_, i) => {
        const home = candyHome(i);
        const col = CANDY_COL[i % CANDY_COL.length];
        if (i >= dealt) {
          const glow = leftGlow;
          return <div key={i} style={{ ...abs(home.x - 18, home.y - 18, 36, 36), borderRadius: '50%', background: col, boxShadow: glow ? `0 0 0 ${5 * glow}px ${C.orange}66` : 'none', outline: glow ? `3px solid ${C.orange}` : 'none', outlineOffset: 3 }} />;
        }
        const s = DEAL0 + i * DEAL_GAP;
        const f = interpolate(t, [s, s + 0.45], [0, 1], easeInOut);
        const plate = PLATES[i % PEOPLE];
        const r = Math.floor(i / PEOPLE);
        const to = { x: plate.x - 46 + r * 46, y: plate.y - 12 };
        const x = home.x + (to.x - home.x) * f;
        const y = home.y + (to.y - home.y) * f - Math.sin(f * Math.PI) * 140;
        return <div key={i} style={{ ...abs(x - 18, y - 18, 36, 36), borderRadius: '50%', background: col, boxShadow: '0 4px 8px rgba(22,32,27,0.25)' }} />;
      })}
      <div style={{ ...abs(BAG.x, BAG.y + BAG.h + 16, BAG.w), textAlign: 'center', fontSize: 24, fontWeight: 800, color: C.orange, opacity: leftGlow }}>남은 사탕 2개</div>
      {/* 결과 */}
      <div style={{ ...abs(1420, 300, 420) }}>
        <div style={{ opacity: res3 * 0.75, transform: `translateY(${(1 - res3) * 14}px)`, marginBottom: 30 }}>
          <div style={{ ...mono, fontSize: 44, fontWeight: 800, color: C.purple }}>17 / 5 → 3.4</div>
          <div style={{ ...small }}>사탕을 쪼갤 수 있다면 · 나눗셈 연산자</div>
        </div>
        <div style={{ opacity: res1, transform: `translateY(${(1 - res1) * 14}px)`, marginBottom: 30 }}>
          <div style={{ ...mono, fontSize: 56, fontWeight: 800, color: C.teal }}>17 // 5 → 3</div>
          <div style={{ ...body, fontSize: 24 }}>한 사람 몫 · <b style={{ color: C.teal }}>몫 연산자</b></div>
        </div>
        <div style={{ opacity: res2, transform: `translateY(${(1 - res2) * 14}px)` }}>
          <div style={{ ...mono, fontSize: 56, fontWeight: 800, color: C.orange }}>17 % 5 → 2</div>
          <div style={{ ...body, fontSize: 24 }}>나눠 주고 남은 수 · <b style={{ color: C.orange }}>나머지 연산자</b></div>
        </div>
      </div>
    </>
  );
}

/* ═════════════ 12 · 산술 연산자 일곱 개 (static · 실행기 + 문항) ═════════════ */
const ARITH = 'a = 17\nb = 5\nprint(a + b)\nprint(a - b)\nprint(a * b)\nprint(a / b)\nprint(a // b)\nprint(a % b)\nprint(a ** 2)';
const OPS: [string, string, string, string][] = [
  ['+', '더하기', '22', C.ink],
  ['-', '빼기', '12', C.ink],
  ['*', '곱하기', '85', C.ink],
  ['/', '나눗셈', '3.4', C.purple],
  ['//', '몫', '3', C.teal],
  ['%', '나머지', '2', C.orange],
  ['**', '거듭제곱', '289', C.ink],
];
function ArithSeven() {
  const [ran, setRan] = useState(false);
  const [six, setSix] = useState(false);
  const onRun = (r: PyRunResult) => {
    setRan(!r.error);
    setSix(/(^|\n)3\.0(\n|$)/.test(r.prog ?? ''));
  };
  return (
    <>
      <Head k="산술 연산자" w={1100}>산술 연산자 일곱 개</Head>
      <div style={{ ...abs(1180, 70, 640), display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <Term term="산술 연산자" gloss="수를 계산하는 연산자" />
        <Term term={<span style={mono}>**</span>} gloss="거듭제곱 · 같은 수를 거듭 곱하기" color={C.ink} />
      </div>
      <div style={abs(100, 220, 1100, 760)}>
        <PyRunner code={ARITH} font={28} ui={22} rows={11} style={{ ...RUN_STYLE, height: 760 }} onRun={onRun} onChange={() => { setRan(false); setSix(false); }} />
      </div>
      <div style={{ ...abs(1250, 230, 570) }}>
        {OPS.map(([op, name, res, col], i) => (
          <div key={op} style={{ display: 'flex', alignItems: 'center', gap: 20, height: 74, borderBottom: '1.5px solid rgba(22,32,27,0.1)', background: i >= 3 && i <= 5 ? `${col}0d` : 'transparent', padding: '0 14px', borderRadius: 8 }}>
            <span style={{ ...mono, fontSize: 40, fontWeight: 800, width: 70, color: col }}>{op}</span>
            <span style={{ fontSize: 28, fontWeight: 700, width: 150, color: C.ink }}>{name}</span>
            <span style={{ ...mono, fontSize: 34, fontWeight: 800, color: col, opacity: ran ? 1 : 0, transition: trans }}>{res}</span>
            {op === '/' && <span style={{ marginLeft: 'auto', fontSize: 17, fontWeight: 800, color: C.purple, opacity: ran ? 1 : 0 }}>실수형 float</span>}
          </div>
        ))}
        <div style={{ ...card, marginTop: 22, padding: '16px 22px', borderColor: `${C.purple}66`, ...show(six) }}>
          <span style={{ ...mono, fontSize: 30, fontWeight: 800 }}>
            6 / 2 → 3<span style={{ color: C.purple, background: C.purpleSoft, borderRadius: 6, padding: '0 4px' }}>.0</span>
          </span>
          <div style={{ ...small, marginTop: 4 }}>크기는 3과 같고 자료형이 실수형 · 정수 몫이 필요하면 //</div>
        </div>
      </div>
    </>
  );
}

/* ═════════════ 13 · 계산 순서 (build) ═════════════ */
function OrderBuild() {
  const c = useClicks(3);
  const Step = ({ x, y, w, text, col, on, delay = 0 }: { x: number; y: number; w: number; text: ReactNode; col: string; on: boolean; delay?: number }) => (
    <div style={{ ...abs(x, y, w), ...mono, fontSize: 38, fontWeight: 800, color: col, background: '#fff', border: `2px solid ${col}55`, borderRadius: 14, padding: '10px 22px', ...show(on), transitionDelay: on ? `${delay}s` : '0s' }}>{text}</div>
  );
  return (
    <>
      <Head k="연산자 우선순위" w={1100}>계산 순서</Head>
      <div style={{ ...abs(1240, 70, 580), display: 'flex', justifyContent: 'flex-end' }}>
        <Term term="연산자 우선순위" gloss="섞였을 때 무엇부터 계산할지" />
      </div>
      <div style={{ ...abs(100, 190), ...small, fontSize: 24 }}>세 과목 점수 90 · 80 · 70의 평균을 구하려고 썼다</div>
      {/* 왼쪽 계단 */}
      <div style={{ ...abs(100, 250, 760), ...mono, fontSize: 52, fontWeight: 800, color: C.ink }}>
        90 + 80 + <span style={{ background: c >= 1 ? 'rgba(232,89,12,0.18)' : 'transparent', borderRadius: 10, transition: trans }}>70 / 3</span>
      </div>
      <Step x={300} y={370} w={420} on={c >= 1} col={C.orange} text={<>70 / 3 → 23.33…</>} />
      <Step x={420} y={470} w={460} on={c >= 1} col={C.ink} delay={0.3} text={<>90 + 80 + 23.33…</>} />
      <Step x={540} y={570} w={500} on={c >= 1} col={C.red} delay={0.6} text={<>193.33333333333334</>} />
      <div style={{ ...abs(1080, 586), fontSize: 30, fontWeight: 800, color: C.red, ...show(c >= 1), transitionDelay: c >= 1 ? '0.9s' : '0s' }}>평균이 193점?</div>
      {/* 오른쪽 계단 */}
      <div style={{ ...abs(1060, 250, 760), ...mono, fontSize: 52, fontWeight: 800, color: C.ink, ...show(c >= 2) }}>
        <span style={{ color: C.green }}>(</span>90 + 80 + 70<span style={{ color: C.green }}>)</span> / 3
      </div>
      <Step x={1240} y={370} w={300} on={c >= 2} col={C.green} delay={0.2} text={<>240 / 3</>} />
      <Step x={1340} y={470} w={220} on={c >= 2} col={C.green} delay={0.5} text={<>80.0</>} />
      {/* 우선순위 사다리 */}
      <div style={{ ...abs(100, 690, 1720, 210), display: 'flex', gap: 0, alignItems: 'flex-end', ...show(c >= 3) }}>
        {[
          ['괄호 ( )', '먼저', 190],
          ['**', '거듭제곱', 160],
          ['* / // %', '곱셈·나눗셈 무리', 130],
          ['+ -', '덧셈·뺄셈', 100],
        ].map(([a, b, h], i) => (
          <div key={String(a)} style={{ flex: 1, height: Number(h), background: `rgba(15,110,102,${0.22 - i * 0.045})`, borderRadius: '14px 14px 0 0', marginRight: 10, padding: '14px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <span style={{ ...mono, fontSize: 32, fontWeight: 800, color: C.ink }}>{a}</span>
            <span style={{ ...small, fontSize: 19 }}>{b}</span>
          </div>
        ))}
        <div style={{ width: 360, ...small, fontSize: 20, paddingLeft: 16 }}>같은 단계끼리는 왼쪽부터 · 먼저 계산할 부분은 괄호로 묶는다</div>
      </div>
    </>
  );
}

/* ═════════════ 14 · 매점 계산기 (static · 실행기) ═════════════ */
const SHOP = 'price = 1500\ncount = int(input("몇 개? "))\nmoney = int(input("낸 돈: "))\ntotal = price * count\nchange = money - total\nprint(f"합계 {total}원, 거스름돈 {change}원")\nprint(f"1000원짜리 {change // 1000}장, 남은 돈 {change % 1000}원")';
function ShopCalc() {
  const [res, setRes] = useState<string[] | null>(null);
  const onRun = (r: PyRunResult) => setRes(r.error ? null : (r.prog ?? '').trim().split('\n'));
  const zones: [string, string, string][] = [
    ['1', '가격 정하기', C.faint],
    ['2–3', '입력 · 형 변환', C.orange],
    ['4–5', '처리 (계산)', C.teal],
    ['6–7', '출력', C.purple],
  ];
  return (
    <>
      <Head k="입력 → 처리 → 출력" w={1200}>매점 계산기</Head>
      <div style={abs(100, 210, 1180, 790)}>
        <PyRunner code={SHOP} vars types layout="stack" font={26} ui={21} style={{ ...RUN_STYLE, height: 790 }} onRun={onRun} onChange={() => setRes(null)} />
      </div>
      <div style={{ ...abs(1330, 70, 490), ...card, padding: '18px 22px' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.mute, letterSpacing: '0.1em' }}>줄마다 하는 일</div>
        {zones.map(([n, l, col]) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10 }}>
            <span style={{ width: 10, height: 34, borderRadius: 5, background: col }} />
            <span style={{ ...mono, fontSize: 22, fontWeight: 800, width: 60 }}>{n}</span>
            <span style={{ fontSize: 23, fontWeight: 700 }}>{l}</span>
          </div>
        ))}
      </div>
      {/* 용돈 기록 앱 같은 결과 카드 */}
      <div style={{ ...abs(1400, 380, 360, 420), borderRadius: 40, border: '10px solid #2b3530', background: '#fff', overflow: 'hidden', boxShadow: '0 30px 60px -40px rgba(22,32,27,0.8)' }}>
        <div style={{ background: C.teal, color: '#fff', padding: '14px 22px', fontSize: 20, fontWeight: 800 }}>매점 · 결과</div>
        {res ? (
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {res.map((l) => (
              <div key={l} style={{ ...card, padding: '12px 14px', fontSize: 22, fontWeight: 700, lineHeight: 1.4, wordBreak: 'keep-all' }}>{l}</div>
            ))}
          </div>
        ) : (
          <div style={{ padding: 24, ...small }}>실행하고 3과 10000을 입력해 보세요</div>
        )}
      </div>
      <div style={{ ...abs(1330, 840, 490), display: 'flex', alignItems: 'center', gap: 8, fontSize: 22, fontWeight: 800 }}>
        <span style={{ color: C.orange }}>입력</span>
        <span style={{ color: C.faint }}>→</span>
        <span style={{ color: C.teal }}>처리</span>
        <span style={{ color: C.faint }}>→</span>
        <span style={{ color: C.purple }}>출력</span>
        <span style={{ ...small, fontWeight: 500, fontSize: 18, marginLeft: 8 }}>알고리즘 수업에서 배운 흐름</span>
      </div>
    </>
  );
}

/* ═════════════ 15 · 자주 만나는 오류와 논리 오류 (build + 문항) ═════════════ */
function ErrorsAndLogic() {
  const c = useClicks(4);
  const Row = ({ y, h, on, border, children }: { y: number; h: number; on: boolean; border: string; children: ReactNode }) => (
    <div style={{ ...abs(100, y, 1720, h), ...card, borderColor: border, display: 'flex', alignItems: 'center', gap: 34, padding: '0 34px', ...show(on) }}>{children}</div>
  );
  return (
    <>
      <Head k="디버깅" w={1100}>자주 만나는 오류와 논리 오류</Head>
      <div style={{ ...abs(1240, 70, 580), display: 'flex', justifyContent: 'flex-end' }}>
        <Term term="논리 오류" gloss="오류 메시지 없이 엉뚱한 결과" color={C.amber} style={show(c >= 4, 0)} />
      </div>
      {/* 문항 카드 — 처음부터 있다 */}
      <Row y={200} h={170} on border={`${C.red}55`}>
        <CodeBox lines={['age = input("나이: ")', 'print(age + 1)']} size={26} numbers={false} style={{ width: 520, padding: '14px 20px' }} />
        <span style={{ fontSize: 24, fontWeight: 700, color: C.mute }}>17 입력 →</span>
        {c >= 1 ? (
          <div>
            <div style={{ ...mono, fontSize: 20, color: C.red, fontWeight: 700 }}>TypeError: can only concatenate str (not "int") to str</div>
            <div style={{ fontSize: 22, marginTop: 4 }}>
              고치면 <span style={{ ...mono, color: C.teal }}>age = int(input("나이: "))</span> → <b style={{ ...mono, color: C.teal }}>18</b>
            </div>
          </div>
        ) : (
          <span style={{ ...mono, fontSize: 40, color: C.faint }}>?</span>
        )}
      </Row>
      <Row y={400} h={130} on={c >= 2} border={`${C.red}55`}>
        <span style={{ ...mono, fontSize: 26, width: 520 }}>
          int(input("수: ")) <span style={{ color: C.mute, fontFamily: 'var(--font-body)', fontSize: 22 }}>← 「열」 입력</span>
        </span>
        <div>
          <div style={{ ...mono, fontSize: 20, color: C.red, fontWeight: 700 }}>ValueError: invalid literal for int() with base 10: '열'</div>
          <div style={{ fontSize: 22, marginTop: 4 }}>변환 함수가 받아들일 수 없는 모양의 값</div>
        </div>
      </Row>
      <Row y={560} h={130} on={c >= 3} border={`${C.red}55`}>
        <span style={{ fontSize: 26, fontWeight: 700, width: 520 }}>
          14장 계산기에서 <span style={{ ...mono, color: C.red }}>int</span>를 빼면
        </span>
        <div style={{ fontSize: 22, lineHeight: 1.5 }}>
          4줄 <span style={mono}>price * count</span>는 문자열 반복이라 지나가고, 5줄 <span style={mono}>money - total</span>에서 TypeError
          <div style={{ ...small, fontSize: 19 }}>오류가 난 줄과 원인이 생긴 줄이 다를 수 있다</div>
        </div>
      </Row>
      <div style={{ ...abs(100, 720, 1720, 250), ...card, borderColor: `${C.amber}`, borderWidth: 3, background: '#fffaf0', padding: '22px 34px', ...show(c >= 4) }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
          <b style={{ fontSize: 34, color: C.amber }}>논리 오류</b>
          <span style={{ ...body, color: C.ink }}>오류 메시지 없이 실행되지만 의도와 다른 결과가 나오는 잘못</span>
        </div>
        <div style={{ display: 'flex', gap: 40, marginTop: 20 }}>
          <div style={{ ...card, padding: '14px 20px', flex: 1 }}>
            <div style={{ ...small, fontSize: 18 }}>5장 · 형 변환을 빠뜨림</div>
            <div style={{ ...mono, fontSize: 28, fontWeight: 800, color: C.orange, overflow: 'hidden', whiteSpace: 'nowrap' }}>2222222222222222222222222…</div>
          </div>
          <div style={{ ...card, padding: '14px 20px', flex: 1 }}>
            <div style={{ ...small, fontSize: 18 }}>13장 · 괄호를 빠뜨림</div>
            <div style={{ ...mono, fontSize: 28, fontWeight: 800, color: C.orange }}>평균 193.33333333333334</div>
          </div>
          <div style={{ width: 360, ...small, fontSize: 20, color: C.ink, alignSelf: 'center' }}>→ 손으로 한 번 계산해 비교한다 <span style={{ color: C.mute }}>(활동지 6번 「예상값」)</span></div>
        </div>
      </div>
    </>
  );
}

/* ═════════════ 17 · AI 코드 속 형 변환과 나눗셈 (build · 확장) ═════════════ */
/* Teachable Machine 「Tensorflow → Keras」 내보내기 코드 — 지난 수업 20장과 같은 조각 (F10)
   출처: github.com/googlecreativelab/teachablemachine-community snippets/markdown/image/tensorflow/keras.md · Apache-2.0 */
const TM_CODE = [
  'from keras.models import load_model',
  'from PIL import Image, ImageOps',
  'import numpy as np',
  'np.set_printoptions(suppress=True)',
  'model = load_model("keras_Model.h5", compile=False)',
  'class_names = open("labels.txt", "r").readlines()',
  'data = np.ndarray(shape=(1, 224, 224, 3), dtype=np.float32)',
  'image = Image.open("<IMAGE_PATH>").convert("RGB")',
  'size = (224, 224)',
  'image = ImageOps.fit(image, size, Image.Resampling.LANCZOS)',
  'image_array = np.asarray(image)',
  'normalized_image_array = (image_array.astype(np.float32) / 127.5) - 1',
  'data[0] = normalized_image_array',
  'prediction = model.predict(data)',
  'index = np.argmax(prediction)',
  'class_name = class_names[index]',
  'confidence_score = prediction[0][index]',
  'print("Class:", class_name[2:], end="")',
  'print("Confidence Score:", confidence_score)',
];
const NORM_LINE = 11;
function AiNormalize() {
  const c = useClicks(3);
  const normLine = (
    <span>
      {hl('normalized_image_array = (image_array.')}
      <span style={{ outline: c >= 1 ? `3px solid ${C.purple}` : 'none', background: c >= 1 ? 'rgba(103,65,217,0.35)' : 'transparent', borderRadius: 4, transition: 'all .4s' }}>{hl('astype(np.float32)')}</span>
      <span style={{ borderBottom: c >= 2 ? '4px solid #4fd1c5' : 'none' }}>{' / 127.5'}</span>
      {') '}
      <span style={{ borderBottom: c >= 2 ? '4px solid #4fd1c5' : 'none' }}>{'- 1'}</span>
    </span>
  );
  const pts: [number, number][] = [
    [0, -1],
    [127.5, 0],
    [255, 1],
  ];
  const NX = (v: number) => 30 + (v / 255) * 420;
  const MX = (v: number) => 30 + ((v + 1) / 2) * 420;
  return (
    <>
      <Head k="확장 · 오늘 배운 것으로 읽기" w={1200} size={48}>AI 코드 속 형 변환과 나눗셈</Head>
      <div style={abs(100, 180, 1140)}>
        <CodeBox
          lines={TM_CODE.map((l, i) => (i === NORM_LINE ? normLine : <span style={{ opacity: 0.32 }}>{hl(l)}</span>))}
          size={19}
          style={{ padding: '16px 20px', lineHeight: 1.5 }}
          lineStyle={(i) => (i === NORM_LINE ? { background: 'rgba(255,209,102,0.12)', borderRadius: 6, margin: '0 -8px', padding: '0 8px' } : undefined)}
        />
        <div style={{ ...small, fontSize: 16, marginTop: 8 }}>
          지난 수업 20장과 같은 코드 · Teachable Machine이 이미지 모델을 파이썬(Keras)으로 내보낼 때 주는 코드 · 출처 googlecreativelab/teachablemachine-community (Apache-2.0)
        </div>
      </div>
      <div style={{ ...abs(1290, 190, 530), display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ ...card, padding: '16px 22px', borderColor: `${C.purple}66`, ...show(c >= 1) }}>
          <span style={{ ...mono, fontWeight: 800, color: C.purple }}>astype(np.float32)</span>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6 }}>형 변환 → 실수형</div>
          <div style={{ ...small, fontSize: 18 }}>오늘의 float()와 같은 일 · 넘파이라는 도구의 말</div>
        </div>
        <div style={{ ...card, padding: '16px 22px', borderColor: `${C.teal}66`, ...show(c >= 2) }}>
          <span style={{ ...mono, fontWeight: 800, color: C.teal }}>/ 127.5 - 1</span>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6 }}>산술 연산 · 정규화</div>
          <div style={{ ...small, fontSize: 18 }}>이 코드에서는 값의 범위를 -1~1로 맞춘다</div>
          <svg width={480} height={150} style={{ display: 'block', marginTop: 8 }}>
            <line x1={30} y1={30} x2={450} y2={30} stroke={C.ink} strokeWidth={3} />
            <line x1={30} y1={120} x2={450} y2={120} stroke={C.teal} strokeWidth={3} />
            {pts.map(([a, b]) => (
              <g key={a}>
                <line x1={NX(a)} y1={36} x2={MX(b)} y2={114} stroke={C.teal} strokeWidth={2} strokeDasharray="6 6" />
                <circle cx={NX(a)} cy={30} r={6} fill={C.ink} />
                <circle cx={MX(b)} cy={120} r={6} fill={C.teal} />
                <text x={NX(a)} y={18} textAnchor="middle" fontSize={18} fontFamily="JetBrains Mono, monospace" fill={C.ink}>{a}</text>
                <text x={MX(b)} y={145} textAnchor="middle" fontSize={18} fontFamily="JetBrains Mono, monospace" fill={C.teal}>{b}</text>
              </g>
            ))}
          </svg>
          <div style={{ ...mono, fontSize: 20, marginTop: 6 }}>
            print(255 / 127.5 - 1) → <b style={{ color: C.teal }}>1.0</b>
          </div>
        </div>
        <div style={{ ...card, padding: '14px 22px', ...show(c >= 3) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 20, fontWeight: 800, flexWrap: 'wrap' }}>
            <span style={{ color: C.faint }}>사진</span>→<span style={{ color: C.faint }}>숫자</span>→
            <span style={{ color: C.purple, background: C.purpleSoft, borderRadius: 8, padding: '2px 8px' }}>형 변환</span>→
            <span style={{ color: C.teal, background: C.tealSoft, borderRadius: 8, padding: '2px 8px' }}>계산</span>→<span style={{ color: C.faint }}>신뢰도</span>
          </div>
          <div style={{ ...small, fontSize: 18, marginTop: 4 }}>지난 프로젝트의 사진 분류 사이에 오늘 배운 두 가지가 있었다</div>
        </div>
      </div>
    </>
  );
}

/* ═════════════ 18 · 한 줄에 모인 오늘 (static + 출구) ═════════════ */
function Closing() {
  const steps: { n: number; label: string; text: string; col: string; x: number; y: number; card: ReactNode }[] = [
    { n: 1, label: '입력', text: 'input()으로 받은 값은 언제나 문자열', col: T.str, x: 940, y: 560, card: <ValCard v="3" kind="str" size={34} /> },
    { n: 2, label: '형 변환', text: 'int() · float()로 목적에 맞는 숫자로', col: T.int, x: 620, y: 700, card: <ValCard v="3" kind="int" size={34} /> },
    { n: 3, label: '대입', text: '바꾼 값을 변수에 대입해야 다음 줄에서 쓴다', col: C.tag, x: 260, y: 840, card: <NameTag name="count" w={200} fontSize={24} /> },
  ];
  return (
    <>
      <div style={{ ...abs(100, 70), display: 'flex', alignItems: 'center', gap: 22 }}>
        <Receipt count={3} w={250} style={{ transform: 'rotate(-4deg)' }} />
        <div style={{ fontSize: 26, fontWeight: 800, color: C.green, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 44, height: 44, borderRadius: '50%', background: C.green, color: '#fff', display: 'grid', placeItems: 'center' }}>✓</span>
          이제 만들 수 있다
        </div>
      </div>
      <div style={{ ...abs(1300, 90, 520), textAlign: 'right' }}>
        <div style={kick}>정리</div>
        <div style={{ ...h1, fontSize: 48, marginTop: 6 }}>한 줄에 모인 오늘</div>
      </div>
      <div style={{ ...abs(180, 360, 1560, 170), background: C.editor, borderRadius: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', ...mono, fontSize: 76, fontWeight: 800, color: C.editorInk, boxShadow: '0 50px 90px -50px rgba(22,32,27,0.9)', whiteSpace: 'pre' }}>
        <span style={{ color: '#fff', borderBottom: `6px solid ${C.tag}` }}>count</span>
        {' = '}
        <span style={{ color: '#6ad1ff', borderBottom: `6px solid ${C.teal}` }}>int(</span>
        <span style={{ borderBottom: `6px solid ${C.orange}` }}>
          <span style={{ color: '#6ad1ff' }}>input</span>(<span style={{ color: '#ffb38a' }}>"몇 개? "</span>)
        </span>
        <span style={{ color: '#6ad1ff', borderBottom: `6px solid ${C.teal}` }}>)</span>
      </div>
      {steps.map((s) => (
        <div key={s.n} style={{ ...abs(s.x, s.y, 900), display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ width: 52, height: 52, borderRadius: '50%', background: s.col, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 28, fontWeight: 900, flexShrink: 0 }}>{s.n}</span>
          {s.card}
          <div>
            <div style={{ fontSize: 34, fontWeight: 800, color: s.col }}>{s.label}</div>
            <div style={{ ...body, fontSize: 25, color: C.ink }}>{s.text}</div>
          </div>
        </div>
      ))}
      <div style={{ ...abs(1300, 960, 520), textAlign: 'right', ...small }}>
        다음 시간 · 조건에 따라 다르게 동작하는 프로그램, <b style={{ color: C.ink }}>조건문</b> <span style={{ ...mono, color: C.orange, fontWeight: 800 }}>%</span>
      </div>
    </>
  );
}

export const SLIDE_COUNT = 18;

export default function PythonInputTypesDeck() {
  useEffect(() => {
    preloadPython();
  }, []);
  return (
    <Deck>
      <Page nav="표지" n={1}><Scene freezeAt={9.5}><CoverScene /></Scene></Page>
      <Page nav="값이 코드 안에 있으면" n={2}><ValuesInCode /></Page>
      <Page nav="input() 첫 실행" n={3}><AskFirst /></Page>
      <Page nav="기다리는 동안" n={4}><Scene freezeAt={9}><WaitScene /></Scene></Page>
      <Page nav="숫자를 입력했는데" n={5}><NumberSurprise /></Page>
      <Page nav="자료형" n={6}><TypesSlide /></Page>
      <Page nav="같은 +, 다른 결과" n={7}><PlusTwoFaces /></Page>
      <Page nav="형 변환 int()" n={8}><ConvertStep /></Page>
      <Page nav="세 가지 형 변환" n={9}><ThreeConverts /></Page>
      <Page nav="활동 ①" n={10}><ActivityOne /></Page>
      <Page nav="사탕 나누기" n={11}><Scene freezeAt={9.5}><CandyScene /></Scene></Page>
      <Page nav="산술 연산자" n={12}><ArithSeven /></Page>
      <Page nav="계산 순서" n={13}><OrderBuild /></Page>
      <Page nav="매점 계산기" n={14}><ShopCalc /></Page>
      <Page nav="오류와 논리 오류" n={15}><ErrorsAndLogic /></Page>
      <Page nav="활동 ②" n={16}><ActivityTwo /></Page>
      <Page nav="AI 코드 읽기" n={17}><AiNormalize /></Page>
      <Page nav="정리" n={18}><Closing /></Page>
    </Deck>
  );
}
