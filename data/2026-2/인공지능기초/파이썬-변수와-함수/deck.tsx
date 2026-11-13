import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import { useDeck } from '../../../../src/deck/DeckContext';
import { Scene, useSceneTime, interpolate, spring, riseIn, easeInOut, easeOut } from '../../../../src/scene';
import PyRunner, { preloadPython, type PyRunnerHandle, type PyRunResult, type PyStep } from '../../../../src/pyrun/PyRunner';
import { NOTES } from './notes';

/* ── 인공지능 기초 · 2026-2 — 이름으로 기억하고, 이름으로 부른다 (파이썬 변수와 함수, 21장) ──
   plan: ./plan.md — 단일 진실 원천. 발표자 노트는 ./notes.ts (plan.md에서 뽑는다).

   1~3    표지 상태창(scene) → 블록에서 파이썬으로(build) → 첫 실행(static·실행기)
   4~7    왜 이름이 필요한가(build) → 이름표 끈 묶기(scene) → = 는 같다가 아니다(build + 문항) → 한 줄씩(static·실행기)
   8~12   따옴표(실행기) → 이름 규칙(build + 문항) → print(name) 대 print("name")(실행기 + 문항) → 활동지 1~3번(activity) → 여러 값 출력(실행기)
   13~17  같은 일이 반복될 때(build) → def로 만들기(실행기) → 부르는 방법·인자(build) → 매개변수(실행기·한 줄씩) → 돌려주는 값 계수기(scene)
   18~21  오류 넷(build + 문항) → 활동지 4번부터(activity) → AI 코드 읽기(build) → 한 줄에 모인 오늘(static + 출구)
   (2026-11-09 함수 부분 재구성: 함수가 필요한 이유 → 만들기 → 부르기 → 값 건네기 → 값 돌려받기)

   코드 실행기는 assets/pyrun (활동지와 같은 부품). 테마: 마닐라 이름표 종이(registry). */

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
  paper: '#f2ead9',
  card: '#fbf6ea',
  ink: '#1f1a14',
  mute: '#6b6357',
  faint: '#9a907f',
  blue: '#2346a0',
  blueSoft: 'rgba(35,70,160,0.10)',
  tag: '#d6336c',
  tagSoft: 'rgba(214,51,108,0.12)',
  str: '#c2410c',
  green: '#1f7a4d',
  red: '#c0392b',
  redSoft: 'rgba(192,57,43,0.10)',
  editor: '#1d2433',
  editorInk: '#e6e9f2',
  gold: '#c99a2e',
};
const PAPER: CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundColor: C.paper,
  backgroundImage:
    'radial-gradient(1200px 700px at 78% 20%, rgba(255,255,255,0.45), transparent 70%), radial-gradient(900px 600px at 10% 95%, rgba(176,150,105,0.12), transparent 70%)',
};
const abs = (x: number, y: number, w?: number, h?: number): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h });
const kick: CSSProperties = { fontSize: 19, fontWeight: 750, letterSpacing: '0.14em', color: C.tag };
const h1: CSSProperties = { fontFamily: 'var(--font-head)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.14, fontSize: 56, wordBreak: 'keep-all', margin: 0, color: C.ink };
const body: CSSProperties = { fontSize: 27, lineHeight: 1.5, color: C.mute, wordBreak: 'keep-all' };
const small: CSSProperties = { fontSize: 20, lineHeight: 1.45, color: C.mute, wordBreak: 'keep-all' };
const mono: CSSProperties = { fontFamily: "'JetBrains Mono', 'D2Coding', Consolas, 'Malgun Gothic', monospace", fontVariantNumeric: 'tabular-nums' };
const card: CSSProperties = { background: C.card, border: '1.5px solid rgba(31,26,20,0.16)', borderRadius: 16, boxShadow: '0 18px 40px -30px rgba(31,26,20,0.55)' };
const trans = 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)';

const BASE = 'data/2026-2/인공지능기초/파이썬-변수와-함수';
const TAG_SVG = 'assets/svg/name-tag-string.svg';
const IMG = {
  program: `${BASE}/images/lamp7-program.jpg`,
  programF1: `${BASE}/images/lamp7-program-f1.jpg`,
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

function Term({ term, gloss, color = C.blue, style }: { term: string; gloss: string; color?: string; style?: CSSProperties }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 12, background: C.card, border: `1.5px solid ${color}66`, borderRadius: 12, padding: '8px 16px', ...style }}>
      <b style={{ fontSize: 25, color, whiteSpace: 'nowrap' }}>{term}</b>
      <span style={{ ...small, fontSize: 20 }}>{gloss}</span>
    </div>
  );
}

/** 끈 달린 이름표 SVG 위에 이름을 얹는다. 글자 칸 viewBox x 126~368, y 62~128 (400×190) */
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

/* ── 정적 코드 색칠 (실행기의 색과 맞춘다) ── */
const KW = new Set(['def', 'return', 'if', 'else', 'for', 'in', 'import', 'from', 'as', 'True', 'False', 'None', 'class', 'and', 'or', 'not']);
const BI = new Set(['print', 'len', 'input', 'open', 'str', 'int']);
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
    <div style={{ background: C.editor, color: C.editorInk, borderRadius: 18, padding: `${size * 0.7}px ${size * 0.9}px`, ...mono, fontSize: size, lineHeight: 1.6, boxShadow: '0 30px 60px -40px rgba(31,26,20,0.8)', ...style }}>
      {lines.map((l, i) => (
        <div key={i} style={{ display: 'flex', whiteSpace: 'pre', minHeight: size * 1.6, ...(lineStyle?.(i) ?? {}) }}>
          {numbers && <span style={{ color: '#6d7891', width: size * 1.4, flexShrink: 0, userSelect: 'none' }}>{i + 1}</span>}
          <span>{typeof l === 'string' ? hl(l) : l}</span>
        </div>
      ))}
    </div>
  );
}

/* 실행기 덱 기본 크기 */
const RUN_STYLE: CSSProperties = {
  '--pyrun-paper': C.card,
  '--pyrun-ink': C.ink,
  '--pyrun-primary': C.blue,
  '--pyrun-tag': C.tag,
  '--pyrun-editor': C.editor,
} as CSSProperties;

/* ═════════════ 1 · 표지 — 게임 상태창 (scene) ═════════════ */
function StatusWindow({ t, compact = false }: { t: number; compact?: boolean }) {
  // 0~2.4초 HP 100 → 2.4~3.0 맞아서 70 → 4.4~5.0 포션으로 80 → 6.2 레벨 13
  const hp = Math.round(interpolate(t, [2.4, 3.0], [100, 70], easeOut) + interpolate(t, [4.4, 5.0], [0, 10], easeOut));
  const level = t >= 6.2 ? 13 : 12;
  const flash = (at: number) => Math.max(0, 1 - Math.abs(t - at - 0.35) / 0.5);
  const hpFlash = Math.max(flash(2.4), flash(4.4));
  const lvFlash = flash(6.2);
  const W = compact ? 420 : 860;
  const k = W / 860;
  const rows: [string, ReactNode, number][] = [
    ['nickname', <span style={{ color: C.str }}>"민지"</span>, 0],
    ['level', <span style={{ color: '#ff9ecb' }}>{level}</span>, lvFlash],
    [
      'hp',
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 22 * k }}>
        <span style={{ color: '#ff9ecb', minWidth: 70 * k, display: 'inline-block' }}>{hp}</span>
        <span style={{ position: 'relative', width: 300 * k, height: 26 * k, borderRadius: 13 * k, background: 'rgba(255,255,255,0.12)', overflow: 'hidden', display: 'inline-block' }}>
          <span style={{ position: 'absolute', inset: 0, width: `${hp}%`, background: hp > 75 ? '#43c47a' : '#f0a91e', borderRadius: 13 * k }} />
        </span>
      </span>,
      hpFlash,
    ],
  ];
  return (
    <div style={{ width: W, background: C.editor, borderRadius: 26 * k, padding: `${30 * k}px ${36 * k}px ${36 * k}px`, boxShadow: '0 50px 90px -50px rgba(31,26,20,0.9)', border: `${3 * k}px solid #33405c` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#9aa6c2', fontSize: 20 * k, fontWeight: 700, letterSpacing: '0.16em', marginBottom: 22 * k }}>
        <span>상태창</span>
        <span style={{ display: 'flex', gap: 8 * k }}>
          {[0, 1, 2].map((i) => <i key={i} style={{ width: 12 * k, height: 12 * k, borderRadius: '50%', background: ['#ff6358', '#f0a91e', '#43c47a'][i], display: 'inline-block' }} />)}
        </span>
      </div>
      {rows.map(([name, val, f]) => (
        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 26 * k, marginTop: 14 * k }}>
          <NameTag name={name} w={300 * k} fontSize={26 * k} />
          <div style={{ flex: 1, ...mono, fontSize: 40 * k, fontWeight: 700, color: C.editorInk, padding: `${10 * k}px ${18 * k}px`, borderRadius: 12 * k, background: `rgba(255, 209, 102, ${0.05 + f * 0.3})`, boxShadow: f > 0 ? `0 0 0 ${3 * k}px rgba(255,209,102,${f})` : 'none' }}>
            {val}
          </div>
        </div>
      ))}
    </div>
  );
}

function CoverScene() {
  const t = useSceneTime();
  const loop = t;
  return (
    <>
      <div style={{ ...abs(100, 250, 720), ...riseIn(t, 0.1) }}>
        <div style={kick}>인공지능 기초 · 파이썬 첫 수업 · 변수와 함수</div>
        <h1 style={{ ...h1, fontSize: 82, marginTop: 22, lineHeight: 1.1 }}>
          이름으로
          <br />
          기억하고,
          <br />
          이름으로
          <br />
          <span style={{ color: C.tag }}>부른다</span>
        </h1>
      </div>
      <div style={{ ...abs(100, 830, 700), ...riseIn(t, 0.5), ...body }}>
        값에 붙이는 이름 <b style={{ color: C.tag }}>변수</b>, 일에 붙이는 이름 <b style={{ color: C.blue }}>함수</b>
      </div>
      <div style={{ ...abs(900, 230), ...riseIn(t, 0.3, 1.0, 40) }}>
        <StatusWindow t={loop} />
        <div style={{ ...small, marginTop: 26, textAlign: 'right', fontSize: 22 }}>
          이름은 그대로, <b style={{ color: C.ink }}>값만 바뀐다</b>
        </div>
      </div>
    </>
  );
}

/* ═════════════ 2 · 블록에서 파이썬으로 (build) ═════════════ */
function BlocksToPython() {
  const c = useClicks(3);
  const IW = 882; // 크롭 441×160 의 2배
  const ix = 100;
  const iy = 250;
  const blocks = [156, 214, 272].map((x) => ({ x: ix + x * 2, y: iy + 63 * 2 }));
  const lines = ['print("앞으로")', 'print("불켜기")', 'print("오른쪽")'];
  const cx = 1150;
  const cy = 300;
  return (
    <>
      <Head k="지난 시간 → 오늘">블록 한 줄이 코드 한 줄이 된다</Head>
      <div style={{ ...abs(ix, iy, IW), borderRadius: 18, overflow: 'hidden', boxShadow: '0 30px 60px -40px rgba(31,26,20,0.8)' }}>
        <img src={IMG.program} alt="점등봇 7번 문제의 프로그램 칸 — 블록이 쌓여 있다" style={{ width: IW, display: 'block' }} />
      </div>
      <div style={{ ...abs(ix, iy + 336), ...small }}>점등봇 7번 「두 줄의 불」 · 여러분이 쌓은 블록</div>
      {/* 블록과 코드 줄을 같은 번호로 짝짓는다 */}
      {blocks.map((b, i) => (
        <div key={i} style={{ ...abs(b.x - 32, b.y - 32, 64, 64), border: `4px solid ${C.tag}`, borderRadius: 12, opacity: c >= 1 ? 1 : 0, transition: trans }}>
          <span style={{ position: 'absolute', right: -16, top: -16, width: 34, height: 34, borderRadius: '50%', background: C.tag, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 20 }}>{i + 1}</span>
        </div>
      ))}
      <svg style={{ ...abs(1010, 380, 120, 60), opacity: c >= 1 ? 1 : 0, transition: trans }}>
        <path d="M6 30 H104 M88 16 L106 30 L88 44" stroke={C.tag} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ ...abs(cx, cy, 660), ...show(c >= 1) }}>
        <CodeBox lines={lines} size={34} />
        <div style={{ ...small, marginTop: 14 }}>설명을 위해 단순하게 바꾼 줄입니다</div>
      </div>
      <div style={{ ...abs(100, 690, 1720), display: 'flex', gap: 18, ...show(c >= 2) }}>
        <Term term="파이썬" gloss="컴퓨터에게 일을 시키는 언어 가운데 하나" />
        <Term term="코드" gloss="그 언어로 쓴 지시문" />
        <Term term="실행" gloss="컴퓨터가 코드를 위에서 아래로 읽고 그대로 하는 것" />
      </div>
      <div style={{ ...abs(100, 880, 1720, 120), ...card, display: 'flex', alignItems: 'center', gap: 40, padding: '0 48px', ...show(c >= 3) }}>
        <b style={{ fontSize: 28, color: C.ink, whiteSpace: 'nowrap' }}>오늘의 두 단어</b>
        <span style={{ fontSize: 30 }}>
          <b style={{ color: C.tag }}>변수</b> <span style={{ color: C.mute }}>= 값에 이름 붙이기</span>
        </span>
        <span style={{ fontSize: 30 }}>
          <b style={{ color: C.blue }}>함수</b> <span style={{ color: C.mute }}>= 일에 이름 붙이기</span>
        </span>
      </div>
    </>
  );
}

/* ═════════════ 3 · 첫 코드 실행 (static · 실행기) ═════════════ */
function Pointer({ x, y, label, dir = 'down' }: { x: number; y: number; label: string; dir?: 'down' | 'up' }) {
  const arrow = (
    <svg width={30} height={36} style={{ display: 'block', margin: '4px auto', transform: dir === 'up' ? 'rotate(180deg)' : undefined }}>
      <path d="M15 2 V28 M5 20 L15 32 L25 20" stroke={C.tag} strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  const text = <div style={{ fontSize: 24, fontWeight: 800, color: C.tag, whiteSpace: 'nowrap' }}>{label}</div>;
  return dir === 'up' ? (
    <div style={{ ...abs(x - 160, y, 320), textAlign: 'center' }}>{arrow}{text}</div>
  ) : (
    <div style={{ ...abs(x - 160, y - 70, 320), textAlign: 'center' }}>{text}{arrow}</div>
  );
}

function FirstRun() {
  return (
    <>
      <Head k="코드 실행기">첫 코드를 실행해 보자</Head>
      <Pointer x={520} y={300} label="① 여기에 쓴다" />
      <Pointer x={1540} y={300} label="② 누른다 · Ctrl+Enter" />
      <Pointer x={1400} y={890} label="③ 여기에 나온다" dir="up" />
      <div style={abs(210, 310, 1500, 570)}>
        <PyRunner code={'print("안녕, 파이썬!")'} font={34} ui={22} style={{ ...RUN_STYLE, height: 570 }} />
      </div>
      <div style={{ ...abs(700, 100, 1120), ...small, fontSize: 22, textAlign: 'right' }}>
        <b style={{ color: C.ink }}>print("…")</b> 따옴표 안의 글자를 화면에 보여 준다 · 자세한 뜻은 15장에서 · <b style={{ color: C.blue }}>활동지에서도 똑같은 화면을 씁니다</b>
      </div>
    </>
  );
}

/* ═════════════ 4 · 이름이 왜 필요할까 (build) ═════════════ */
function WhyNames() {
  const c = useClicks(3);
  const who = c >= 1 ? '민지' : '민지';
  const ring = (s: string) => (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      {s}
      <span style={{ position: 'absolute', left: -10, right: -10, top: -4, bottom: -4, border: `3.5px solid ${C.red}`, borderRadius: 999, opacity: c >= 1 ? 1 : 0, transform: c >= 1 ? 'scale(1)' : 'scale(1.4)', transition: trans }} />
    </span>
  );
  const left = [
    <span>{hl('print(')}<span style={{ color: '#ffb38a' }}>"안녕, 나는 {ring(who)}야."</span>)</span>,
    <span>{hl('print(')}<span style={{ color: '#ffb38a' }}>"{ring(who)}는 고양이를 좋아해."</span>)</span>,
    <span>{hl('print(')}<span style={{ color: '#ffb38a' }}>"내일은 {ring(who)}가 발표해."</span>)</span>,
  ];
  const dim: CSSProperties = { opacity: 0.38 };
  const nm = <span style={{ color: '#fff', background: 'rgba(214,51,108,0.45)', borderRadius: 6, padding: '0 4px' }}>name</span>;
  const right = [
    <span style={{ outline: `3px solid ${C.tag}`, outlineOffset: 6, borderRadius: 4 }}>{hl('name = "민지"')}</span>,
    '',
    <span><span style={dim}>print(…</span>{nm}<span style={dim}>…야.)</span></span>,
    <span><span style={dim}>print(</span>{nm}<span style={dim}>…좋아해.)</span></span>,
    <span><span style={dim}>print(…</span>{nm}<span style={dim}>…발표해.)</span></span>,
  ];
  return (
    <>
      <Head k="변수가 필요한 이유">이름이 왜 필요할까</Head>
      <div style={abs(100, 260, 1000)}>
        <div style={{ ...small, marginBottom: 12, fontWeight: 700 }}>값을 직접 쓴 코드</div>
        <CodeBox lines={left} size={30} />
      </div>
      <div style={{ ...abs(100, 560, 1000), ...show(c >= 1), fontSize: 34, fontWeight: 800, color: C.red }}>
        서연이가 이 코드를 쓰려면?
      </div>
      <div style={{ ...abs(1180, 260, 640), ...show(c >= 2) }}>
        <div style={{ ...small, marginBottom: 12, fontWeight: 700 }}>값에 이름을 붙인 코드</div>
        <CodeBox lines={right} size={28} />
        <div style={{ ...small, marginTop: 12 }}>문장에 끼워 넣는 방법은 12장에서</div>
      </div>
      <div style={{ ...abs(100, 690, 1720), display: 'flex', gap: 40, ...show(c >= 3) }}>
        <div style={{ ...card, flex: 1.25, padding: '30px 40px', display: 'flex', alignItems: 'center', gap: 30 }}>
          <span style={{ fontSize: 120, fontWeight: 900, color: C.red, lineHeight: 1 }}>3</span>
          <span style={{ ...body, color: C.ink }}>「민지」를 「서연」으로 바꾸려면<br />고칠 곳 세 군데. 하나라도 놓치면 이상한 소개가 된다</span>
        </div>
        <div style={{ ...card, flex: 1, padding: '30px 40px', display: 'flex', alignItems: 'center', gap: 30, borderColor: C.tag }}>
          <span style={{ fontSize: 120, fontWeight: 900, color: C.tag, lineHeight: 1 }}>1</span>
          <span style={{ ...body, color: C.ink }}>맨 위 한 줄만 고치면 된다</span>
        </div>
      </div>
    </>
  );
}

/* ═════════════ 5 · 변수는 값에 붙이는 이름표 (scene) ═════════════ */
function TagScene() {
  const t = useSceneTime();
  // 줄 1: 0.4 값 카드 → 1.3~2.4 이름표가 날아가 묶임 / 줄 2: 3.4 카드 → 4.3~5.4 이름표
  const lines = [
    { name: 'name', val: '"민지"', isStr: true, t0: 0.4, y: 470 },
    { name: 'age', val: '17', isStr: false, t0: 3.4, y: 720 },
  ];
  const cardX = 1180;
  return (
    <>
      <div style={{ ...abs(100, 58, 1720) }}>
        <div style={kick}>변수 · 대입</div>
        <h2 style={{ ...h1, marginTop: 8 }}>변수는 값에 붙이는 이름표</h2>
      </div>
      {/* 코드 띠: 오른쪽이 먼저, 왼쪽이 나중에 빛난다 */}
      <div style={{ ...abs(100, 210, 1720), display: 'flex', gap: 60 }}>
        {lines.map((l) => {
          const rOn = interpolate(t, [l.t0 - 0.1, l.t0 + 0.3], [0, 1]);
          const lOn = interpolate(t, [l.t0 + 1.0, l.t0 + 1.4], [0, 1]);
          return (
            <div key={l.name} style={{ ...mono, fontSize: 52, fontWeight: 700, background: C.editor, borderRadius: 16, padding: '14px 34px', color: '#59627a', opacity: interpolate(t, [l.t0 - 0.4, l.t0 - 0.1], [0.25, 1]) }}>
              <span style={{ color: lOn > 0.5 ? '#fff' : '#59627a', textShadow: lOn > 0.5 ? '0 0 18px rgba(214,51,108,0.9)' : 'none', transition: 'color .2s' }}>{l.name}</span>
              <span> = </span>
              <span style={{ color: rOn > 0.5 ? (l.isStr ? '#ffb38a' : '#ff9ecb') : '#59627a', textShadow: rOn > 0.5 ? '0 0 18px rgba(255,209,102,0.7)' : 'none' }}>{l.val}</span>
            </div>
          );
        })}
      </div>
      <div style={{ ...abs(100, 330, 900), ...small, fontSize: 22 }}>① 오른쪽 값이 먼저 만들어지고 ② 왼쪽 이름표가 그 값에 묶인다</div>
      {lines.map((l) => {
        const drop = spring(t, l.t0, 0.7);
        const fly = interpolate(t, [l.t0 + 0.9, l.t0 + 2.0], [0, 1], easeInOut);
        const tagW = 340;
        const tagX = interpolate(fly, [0, 1], [140, cardX - tagW - 70]);
        const tagY = l.y + 20 - Math.sin(fly * Math.PI) * 120;
        const knotX = cardX + 6;
        const knotY = l.y + 85;
        const sx = tagX + 8 / 400 * tagW;
        const sy = tagY + 30 / 400 * tagW;
        return (
          <div key={l.name}>
            {/* 값 카드 */}
            <div style={{ ...abs(cardX, l.y - (1 - drop) * 160, 360, 170), opacity: Math.min(1, drop * 2), ...card, background: '#fff', borderWidth: 3, borderColor: l.isStr ? '#e9a27a' : '#93a6d9', display: 'grid', placeItems: 'center', ...mono, fontSize: 64, fontWeight: 800, color: l.isStr ? C.str : C.blue }}>
              {l.val}
              <span style={{ position: 'absolute', left: -14, top: 71, width: 28, height: 28, borderRadius: '50%', border: `5px solid ${C.gold}`, background: C.paper }} />
              <span style={{ position: 'absolute', right: 18, bottom: 10, fontSize: 18, fontFamily: 'var(--font-body)', fontWeight: 700, color: C.faint }}>{l.isStr ? '문자열' : '숫자'}</span>
            </div>
            {/* 끈 */}
            <svg style={{ ...abs(0, 0, DW, DH), pointerEvents: 'none', opacity: fly > 0.02 ? 1 : 0 }}>
              <path d={`M ${sx} ${sy} Q ${(sx + knotX) / 2} ${Math.max(sy, knotY) + 60 * (1 - fly) + 30} ${knotX} ${knotY}`} stroke={C.ink} strokeWidth={7} fill="none" strokeLinecap="round" style={{ opacity: fly }} />
              <path d={`M ${sx} ${sy} Q ${(sx + knotX) / 2} ${Math.max(sy, knotY) + 60 * (1 - fly) + 30} ${knotX} ${knotY}`} stroke="#efe2c4" strokeWidth={4} fill="none" strokeLinecap="round" style={{ opacity: fly }} />
            </svg>
            <div style={{ ...abs(tagX, tagY), opacity: interpolate(t, [l.t0 + 0.6, l.t0 + 0.9], [0, 1]), transform: `rotate(${-8 + fly * 8}deg)` }}>
              <NameTag name={l.name} w={tagW} />
            </div>
          </div>
        );
      })}
      <div style={{ ...abs(100, 950, 1720), display: 'flex', gap: 18, ...riseIn(t, 5.8) }}>
        <Term term="변수" gloss="값에 붙인 이름. 이름을 부르면 그 값이 나온다" color={C.tag} />
        <Term term="대입" gloss="= 오른쪽 값에 왼쪽 이름을 붙이는 일" color={C.tag} />
      </div>
    </>
  );
}

/* ═════════════ 6 · = 는 같다가 아니다 (build + 문항) ═════════════ */
function NotEqual() {
  const c = useClicks(2);
  return (
    <>
      <Head k="대입 · 예측해 보기">= 는 「같다」가 아니다</Head>
      {/* 수학 공책 */}
      <div style={{ ...abs(100, 270, 470, 470), background: '#fffdf6', borderRadius: 10, boxShadow: '0 24px 50px -36px rgba(31,26,20,0.7)', backgroundImage: 'repeating-linear-gradient(transparent 0 58px, rgba(35,70,160,0.18) 58px 60px)', borderLeft: '6px solid rgba(214,51,108,0.35)', transform: 'rotate(-2deg)' }}>
        <div style={{ ...abs(40, 30), ...small, fontWeight: 700 }}>수학 공책</div>
        <div style={{ ...abs(50, 160), fontFamily: "'Nanum Pen Script', var(--font-head)", fontSize: 76, fontWeight: 700, color: C.ink, fontStyle: 'italic' }}>x = x + 5</div>
        <div style={{ ...abs(330, 250), fontSize: 140, fontWeight: 900, color: C.red, lineHeight: 1, transform: 'rotate(10deg)' }}>?</div>
        <div style={{ ...abs(40, 400, 400), ...small }}>수학에서는 성립하지 않는 식</div>
      </div>
      <div style={abs(680, 270, 1140)}>
        <div style={{ ...small, marginBottom: 12, fontWeight: 700 }}>코드에서는?</div>
        <CodeBox lines={['score = 10', 'score = score + 5', 'print(score)']} size={44} lineStyle={(i) => (i === 1 && c >= 1 ? { background: 'rgba(255,209,102,0.14)', borderRadius: 8 } : undefined)} />
      </div>
      {/* 계산 순서 */}
      <div style={{ ...abs(680, 655, 1140), display: 'flex', gap: 30, alignItems: 'stretch', ...show(c >= 1) }}>
        <div style={{ ...card, flex: 1, padding: '22px 30px' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.blue }}>① 오른쪽부터 계산</div>
          <div style={{ ...mono, fontSize: 34, fontWeight: 700, marginTop: 8, whiteSpace: 'nowrap' }}>
            score + 5 → <span style={{ color: C.blue }}>10 + 5 = 15</span>
          </div>
        </div>
        <svg width={60} height={120} style={{ alignSelf: 'center' }}>
          <path d="M6 60 H46 M34 46 L50 60 L34 74" stroke={C.ink} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ ...card, flex: 0.85, padding: '22px 30px', borderColor: C.tag }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.tag }}>② 그 값에 이름표를 옮긴다</div>
          <div style={{ ...mono, fontSize: 40, fontWeight: 700, marginTop: 8 }}>
            <span style={{ color: C.tag }}>score</span> → 15
          </div>
        </div>
      </div>
      <div style={{ ...abs(100, 885, 1720, 100), ...card, background: C.ink, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 26, fontSize: 38, fontWeight: 800, ...show(c >= 2) }}>
        <span style={{ ...mono, color: '#ffd166', fontSize: 52 }}>=</span>
        <span>오른쪽을 계산해서 왼쪽 이름에 붙인다</span>
      </div>
    </>
  );
}

/* ═════════════ 7 · 한 줄씩 따라가 보기 (static · 실행기 step) ═════════════ */
const HP_CODE = 'hp = 100\nhp = hp - 30\nhp = hp + 10\nprint(hp)';
const SCORE_CODE = 'score = 10\nscore = score + 5\nprint(score)';
function StepHp() {
  const [hp, setHp] = useState<number | null>(null);
  const ref = useRef<PyRunnerHandle>(null);
  const onStep = (s: PyStep) => {
    const v = s.vars.find(([k]) => k === 'hp');
    setHp(v && v[1].t === 'num' ? Number(v[1].r) : null);
  };
  const shown = hp ?? 0;
  return (
    <>
      <Head k="한 줄씩 보기" x={640} w={1180}>한 줄씩 따라가 보기</Head>
      {/* 1장 상태창의 HP — 실행기 변수 상자의 hp 값과 같은 값에서 그린다 */}
      <div style={{ ...abs(100, 60, 470), ...card, padding: '22px 26px', background: C.editor, borderColor: '#33405c' }}>
        <div style={{ color: '#9aa6c2', fontSize: 18, fontWeight: 700, letterSpacing: '0.16em' }}>1장의 상태창</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 12 }}>
          <NameTag name="hp" w={170} fontSize={22} />
          <span style={{ ...mono, color: '#ff9ecb', fontSize: 36, fontWeight: 800, minWidth: 70 }}>{hp ?? '–'}</span>
        </div>
        <div style={{ marginTop: 12, height: 22, borderRadius: 11, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${shown}%`, background: shown > 75 ? '#43c47a' : '#f0a91e', transition: 'width .5s cubic-bezier(.2,1,.3,1)' }} />
        </div>
      </div>
      <div style={abs(100, 300, 1720, 640)}>
        <PyRunner ref={ref} code={HP_CODE} vars step mode="step" font={34} ui={22} style={{ ...RUN_STYLE, height: 640 }} onStep={onStep} onChange={() => setHp(null)} />
      </div>
      <div style={{ ...abs(100, 966, 1720), display: 'flex', gap: 20, alignItems: 'center' }}>
        <button
          onClick={() => ref.current?.setCode(SCORE_CODE)}
          style={{ font: 'inherit', fontSize: 20, fontWeight: 700, padding: '10px 20px', borderRadius: 12, border: `1.5px solid ${C.blue}`, background: 'transparent', color: C.blue, cursor: 'pointer' }}
        >
          6장 코드 불러오기
        </button>
        <button
          onClick={() => ref.current?.setCode(HP_CODE)}
          style={{ font: 'inherit', fontSize: 20, fontWeight: 700, padding: '10px 20px', borderRadius: 12, border: '1.5px solid rgba(31,26,20,0.25)', background: 'transparent', color: C.mute, cursor: 'pointer' }}
        >
          hp 코드로
        </button>
        <span style={{ ...small }}>[다음 줄 ▶]을 누를 때마다 방금 실행한 줄이 노랗게 표시되고, 변수 상자가 그 순간의 상태로 바뀝니다</span>
      </div>
    </>
  );
}

/* ═════════════ 8 · 따옴표가 정하는 데이터의 종류 (static · 실행기) ═════════════ */
function Quotes() {
  return (
    <>
      <Head k="문자열 · 숫자">따옴표가 정하는 데이터의 종류</Head>
      <div style={abs(100, 230, 1300, 760)}>
        <PyRunner code={'name = "민지"\nage = 17\nprint(name)\nprint(age)'} vars font={30} ui={22} style={{ ...RUN_STYLE, height: 760 }} />
      </div>
      <div style={{ ...abs(1450, 250, 370), display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ ...card, padding: '24px 26px', borderColor: '#e9a27a' }}>
          <b style={{ fontSize: 30, color: C.str }}>문자열</b>
          <div style={{ ...small, marginTop: 6 }}>따옴표로 감싼 글자 값</div>
          <div style={{ ...mono, fontSize: 34, fontWeight: 800, color: C.str, marginTop: 10 }}>"민지"</div>
        </div>
        <div style={{ ...card, padding: '24px 26px', borderColor: '#93a6d9' }}>
          <b style={{ fontSize: 30, color: C.blue }}>숫자</b>
          <div style={{ ...small, marginTop: 6 }}>따옴표 없이 쓴 값</div>
          <div style={{ ...mono, fontSize: 34, fontWeight: 800, color: C.blue, marginTop: 10 }}>17</div>
        </div>
        <div style={{ fontSize: 30, fontWeight: 800, color: C.ink, lineHeight: 1.35, wordBreak: 'keep-all', marginTop: 10 }}>
          글자는 따옴표,
          <br />
          숫자는 그대로
        </div>
        <div style={{ ...small }}>따옴표를 지우고 실행하면 파이썬은 민지를 <b style={{ color: C.ink }}>변수 이름</b>으로 읽습니다</div>
      </div>
    </>
  );
}

/* ═════════════ 9 · 이름 짓는 규칙 (build + 문항) ═════════════ */
function NameRules() {
  const c = useClicks(3);
  const tags: { n: string; ok: boolean; why: string }[] = [
    { n: '2nd_place', ok: false, why: '숫자로 시작한다' },
    { n: 'my-score', ok: false, why: '- 는 빼기로 읽힌다' },
    { n: 'favorite_food', ok: true, why: '영문자와 밑줄' },
    { n: 'class', ok: false, why: '파이썬이 쓰는 키워드' },
  ];
  return (
    <>
      <Head k="변수 이름">이름 짓는 규칙</Head>
      {/* 걸이 막대 */}
      <div style={{ ...abs(90, 220, 900, 14), background: '#8a6a3c', borderRadius: 7, boxShadow: '0 6px 0 rgba(0,0,0,0.12)' }} />
      {tags.map((g, i) => (
        <div key={g.n} style={{ ...abs(130 + (i % 2) * 40, 260 + i * 182), display: 'flex', alignItems: 'center', gap: 30 }}>
          <NameTag name={g.n} w={440} fontSize={33} style={{ transform: `rotate(${[-3, 2, -1, 3][i]}deg)` }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, ...show(c >= 1, 0) }}>
            <span style={{ width: 84, height: 84, borderRadius: '50%', border: `5px solid ${g.ok ? C.green : C.red}`, color: g.ok ? C.green : C.red, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 24, transform: `rotate(${g.ok ? -12 : 10}deg) scale(${c >= 1 ? 1 : 1.6})`, transition: trans, background: 'rgba(255,255,255,0.5)' }}>
              {g.ok ? '통과' : '불가'}
            </span>
            <span style={{ fontSize: 25, fontWeight: 700, color: g.ok ? C.green : C.red, whiteSpace: 'nowrap' }}>{g.why}</span>
          </div>
        </div>
      ))}
      <div style={{ ...abs(1240, 220, 580), ...card, padding: '28px 34px', ...show(c >= 2) }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.mute, letterSpacing: '0.1em' }}>지켜야 하는 규칙</div>
        {['글자 · 숫자 · 밑줄( _ )만 쓴다', '특수문자( - ! @ # . 등)와 빈칸은 쓸 수 없다', '숫자로 시작하지 않는다', '대문자와 소문자는 다른 이름이다', '키워드(파이썬이 쓰는 단어)는 안 된다'].map((r) => (
          <div key={r} style={{ display: 'flex', gap: 14, alignItems: 'baseline', marginTop: 14, fontSize: 26, color: C.ink, wordBreak: 'keep-all' }}>
            <span style={{ color: C.green, fontWeight: 900 }}>✓</span>
            {r}
          </div>
        ))}
        <div style={{ marginTop: 18 }}>
          <Term term="키워드" gloss="class · for · if · True 처럼 파이썬이 이미 쓰는 단어" style={{ flexWrap: 'wrap' }} />
        </div>
      </div>
      <div style={{ ...abs(1240, 700, 580), ...show(c >= 3) }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.mute, letterSpacing: '0.1em', marginBottom: 12 }}>지키면 좋은 관례 · 뜻이 보이는 이름</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <CodeBox lines={['a = 87']} size={30} numbers={false} style={{ flex: 1, opacity: 0.6 }} />
          <CodeBox lines={['math_score = 87']} size={30} numbers={false} style={{ flex: 1.6, outline: `3px solid ${C.green}` }} />
        </div>
        <div style={{ ...small, marginTop: 14 }}>한글 이름도 동작하지만 영어 소문자와 밑줄이 관례입니다</div>
      </div>
    </>
  );
}

/* ═════════════ 14 · 함수를 부르는 방법 (build) ═════════════ */
function CallShape() {
  const c = useClicks(3);
  const cy = 600;
  const parts = [
    { text: 'print', x: 520, w: 300, color: C.blue, label: '함수 이름' },
    { text: '(', x: 820, w: 70, color: C.green, label: '부른다(호출)' },
    { text: '"안녕"', x: 890, w: 330, color: C.tag, label: '인자' },
    { text: ')', x: 1220, w: 70, color: C.green, label: '' },
  ];
  return (
    <>
      <Head k="함수 호출 · 인자 · 내장 함수">함수를 부르는 방법</Head>
      {/* 수학 공책: 이미 아는 함수 f(x) */}
      <div style={{ ...abs(560, 200, 720, 150), background: '#fff', borderRadius: 10, boxShadow: '0 20px 40px -28px rgba(31,26,20,0.7)', backgroundImage: `repeating-linear-gradient(transparent 0 46px, rgba(35,70,160,0.12) 46px 48px)`, ...show(c >= 1) }}>
        <div style={{ ...abs(40, 18), fontSize: 18, fontWeight: 800, color: C.faint, letterSpacing: '0.14em' }}>수학에서 배운 함수</div>
        <div style={{ ...abs(40, 62), ...mono, fontSize: 36, fontWeight: 700, color: C.mute, whiteSpace: 'nowrap' }}>f(x) = 2x + 1</div>
        <div style={{ ...abs(400, 44), ...mono, fontSize: 64, fontWeight: 800, color: C.ink, whiteSpace: 'nowrap', lineHeight: 1.1 }}>
          <span style={{ borderBottom: `6px solid ${C.blue}` }}>f</span>(<span style={{ borderBottom: `6px solid ${C.tag}` }}>3</span>)
          <span style={{ fontSize: 40, color: C.mute }}> = 7</span>
        </div>
      </div>
      {/* 점선 연결: f → 함수 이름, 3 → 인자 */}
      <svg style={{ ...abs(0, 0, DW, DH), pointerEvents: 'none', opacity: c >= 2 ? 1 : 0, transition: trans }}>
        <path d={`M 979 352 L 670 ${cy - 70}`} stroke={C.blue} strokeWidth={3} strokeDasharray="4 8" />
        <path d={`M 1055 352 V ${cy - 70}`} stroke={C.tag} strokeWidth={3} strokeDasharray="4 8" />
      </svg>
      <div style={{ ...abs(420, cy - 60, 1080, 150), background: C.editor, borderRadius: 24, boxShadow: '0 40px 80px -46px rgba(31,26,20,0.9)' }} />
      {parts.map((p) => (
        <div key={p.text + p.x} style={{ ...abs(p.x, cy - 50, p.w, 130), display: 'grid', placeItems: 'center', ...mono, fontSize: 96, fontWeight: 800, color: p.text === 'print' ? '#6ad1ff' : p.text.startsWith('"') ? '#ffb38a' : C.editorInk }}>
          {p.text}
        </div>
      ))}
      {parts.filter((p) => p.label).map((p) => (
        <div key={p.label} style={{ ...abs(p.x, cy + 120, p.w), textAlign: 'center', ...show(c >= 2) }}>
          <div style={{ height: 6, borderRadius: 3, background: p.color, margin: '0 10px 14px' }} />
          <div style={{ fontSize: 32, fontWeight: 800, color: p.color, whiteSpace: 'nowrap' }}>{p.label}</div>
        </div>
      ))}
      <div style={{ ...abs(100, 880, 1100), display: 'flex', gap: 14, flexWrap: 'wrap', ...show(c >= 2) }}>
        <Term term="내장 함수" gloss="print처럼 파이썬에 처음부터 들어 있는 함수" />
        <Term term="함수 호출" gloss="이름(인자) 모양으로 그 일을 시키는 것" color={C.green} />
        <Term term="인자" gloss="괄호 안에 넣어 건네는 값" color={C.tag} />
      </div>
      <div style={{ ...abs(1350, 840, 470), ...card, padding: '20px 26px', ...show(c >= 3) }}>
        <div style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
          <span style={{ ...mono, fontSize: 34, fontWeight: 800, color: C.faint, textDecoration: 'line-through' }}>print</span>
          <span style={{ fontSize: 26 }}>→</span>
          <span style={{ ...mono, fontSize: 34, fontWeight: 800, color: C.blue }}>print()</span>
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.ink, marginTop: 8 }}>괄호가 있어야 부른다</div>
      </div>
    </>
  );
}

/* ═════════════ 10 · print(name) 과 print("name") (static · 실행기 + 문항) ═════════════ */
function NameVsString() {
  const [out, setOut] = useState<string[] | null>(null);
  const onRun = (r: PyRunResult) => setOut(r.error ? null : r.output.replace(/\n$/, '').split('\n'));
  const pairs = [
    { code: 'print(name)', why: '이름표 name 이 묶인 값', color: C.tag },
    { code: 'print("name")', why: '따옴표 안의 글자 그대로', color: C.str },
  ];
  return (
    <>
      <Head k="따옴표 · 다시 만나기">print(name) 과 print("name")</Head>
      <div style={abs(100, 230, 1180, 760)}>
        <PyRunner code={'name = "민지"\nprint(name)\nprint("name")'} vars mask="2-3" font={36} ui={22} style={{ ...RUN_STYLE, height: 760 }} onRun={onRun} onChange={() => setOut(null)} />
      </div>
      <div style={{ ...abs(1340, 250, 480), display: 'flex', flexDirection: 'column', gap: 26 }}>
        <div style={{ ...small, fontWeight: 700 }}>실행하면 짝이 맞춰집니다</div>
        {pairs.map((p, i) => (
          <div key={p.code} style={{ ...card, padding: '22px 26px', borderColor: `${p.color}88`, opacity: out ? 1 : 0.35, transition: trans }}>
            <div style={{ ...mono, fontSize: 30, fontWeight: 800, color: C.ink }}>{p.code}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10 }}>
              <span style={{ fontSize: 30, color: p.color }}>→</span>
              <span style={{ ...mono, fontSize: 40, fontWeight: 800, color: p.color }}>{out ? out[i] ?? '' : '?'}</span>
            </div>
            <div style={{ ...small, marginTop: 6 }}>{p.why}</div>
          </div>
        ))}
        <div style={{ ...small }}>실행 전에 문항을 열고, 2·3번 줄은 [가린 줄 보기]로 공개합니다</div>
      </div>
    </>
  );
}

/* ═════════════ 11 · 한 줄에 여러 값 출력하기 (static · 실행기) ═════════════ */
function ManyValues() {
  const [food, setFood] = useState<string | null>(null);
  const [lines, setLines] = useState<string[] | null>(null);
  const onRun = (r: PyRunResult) => {
    const v = r.vars.find(([k]) => k === 'food');
    setFood(v ? v[1].r : null);
    setLines(r.error ? null : r.output.replace(/\n$/, '').split('\n'));
  };
  const L1 = '내가 좋아하는 음식은';
  const sp = <span style={{ color: C.tag, fontWeight: 900, margin: '0 2px' }}>␣</span>;
  const annotated1 = food != null && lines && lines[0] === `${L1} ${food} 입니다` ? <>{L1}{sp}{food}{sp}입니다</> : lines ? lines[0] : null;
  const annotated2 = food != null && lines && lines[1] === `${L1} ${food}입니다` ? <>{L1} <mark style={{ background: C.tagSoft, color: C.tag, padding: '0 4px', borderRadius: 4 }}>{food}</mark>입니다</> : lines ? lines[1] : null;
  return (
    <>
      <Head k="쉼표 · f-문자열">한 줄에 여러 값 출력하기</Head>
      <div style={{ ...abs(100, 200, 1720), display: 'flex', gap: 20 }}>
        <Term term="쉼표" gloss="print(A, B, C) → 사이에 빈칸이 하나씩" />
        <Term term="f-문자열" gloss='따옴표 앞에 f, 끼울 자리에 {이름}' color={C.tag} />
      </div>
      <div style={abs(100, 290, 1720, 450)}>
        <PyRunner code={'food = "떡볶이"\nprint("내가 좋아하는 음식은", food, "입니다")\nprint(f"내가 좋아하는 음식은 {food}입니다")'} font={30} ui={21} style={{ ...RUN_STYLE, height: 450 }} onRun={onRun} onChange={() => setLines(null)} />
      </div>
      <div style={{ ...abs(100, 770, 1240, 220), ...card, padding: '22px 30px', opacity: lines ? 1 : 0.4, transition: trans }}>
        <div style={{ ...small, fontWeight: 700 }}>출력을 크게 보면</div>
        <div style={{ ...mono, fontSize: 36, marginTop: 10 }}>
          <span style={{ color: C.faint, fontSize: 22, marginRight: 14 }}>쉼표</span>
          {annotated1 ?? '…'}
        </div>
        <div style={{ ...mono, fontSize: 36, marginTop: 8 }}>
          <span style={{ color: C.faint, fontSize: 22, marginRight: 14 }}>f</span>
          {annotated2 ?? '…'}
        </div>
      </div>
      <div style={{ ...abs(1380, 790, 440), ...small, fontSize: 22, borderLeft: `4px solid ${C.tag}`, paddingLeft: 18 }}>
        4장에서 미뤄 둔 「이름을 문장에 끼워 넣는 방법」이 이것입니다. food 값을 바꿔 다시 실행해 보세요
      </div>
    </>
  );
}

/* ═════════════ 16 · 값을 돌려주는 함수 (scene) ═════════════ */
function CounterScene() {
  const t = useSceneTime();
  const chars = ['인', '공', '지', '능'];
  const mx = 560; // 기계 왼쪽
  const my = 420;
  const count = chars.filter((_, i) => t > 1.2 + i * 0.7 + 0.55).length;
  const outT = interpolate(t, [4.2, 5.0], [0, 1], easeOut);
  const fly = interpolate(t, [5.6, 6.7], [0, 1], easeInOut);
  const cardX = 1540;
  const tagW = 300;
  const tagX = interpolate(fly, [0, 1], [120, cardX - tagW - 50]);
  const tagY = 640 - Math.sin(fly * Math.PI) * 140;
  const callOn = t > 0.8;
  const nOn = t > 5.9;
  return (
    <>
      <div style={abs(100, 58, 1720)}>
        <div style={kick}>돌려주는 값(반환값)</div>
        <h2 style={{ ...h1, marginTop: 8 }}>값을 돌려주는 함수</h2>
      </div>
      <div style={{ ...abs(100, 205), ...mono, fontSize: 56, fontWeight: 700, background: C.editor, borderRadius: 16, padding: '12px 34px', color: '#59627a' }}>
        <span style={{ color: nOn ? '#fff' : '#59627a', textShadow: nOn ? '0 0 18px rgba(214,51,108,0.9)' : 'none' }}>n</span> ={' '}
        <span style={{ color: callOn ? '#6ad1ff' : '#59627a', textShadow: callOn ? '0 0 18px rgba(106,209,255,0.6)' : 'none' }}>len</span>
        <span style={{ color: callOn ? C.editorInk : '#59627a' }}>(</span>
        <span style={{ color: callOn ? '#ffb38a' : '#59627a' }}>"인공지능"</span>
        <span style={{ color: callOn ? C.editorInk : '#59627a' }}>)</span>
      </div>
      {/* 글자 조각이 입구로 */}
      {chars.map((ch, i) => {
        const a = interpolate(t, [1.2 + i * 0.7, 1.2 + i * 0.7 + 0.55], [0, 1], easeInOut);
        const x = interpolate(a, [0, 1], [110 + i * 100, mx + 130]);
        const y = interpolate(a, [0, 1], [560, my + 40]) - Math.sin(a * Math.PI) * 120;
        return (
          <div key={ch} style={{ ...abs(x, y, 90, 90), display: 'grid', placeItems: 'center', background: '#fff', border: '3px solid #e9a27a', borderRadius: 14, fontSize: 48, fontWeight: 800, color: C.str, opacity: a >= 1 ? 0 : interpolate(t, [0.3, 0.6], [0, 1]), transform: `scale(${1 - a * 0.5})`, boxShadow: '0 10px 20px -14px rgba(0,0,0,0.6)' }}>
            {ch}
          </div>
        );
      })}
      {/* 계수기 기계 (추상 도형) */}
      <svg style={{ ...abs(mx, my - 40, 560, 420) }} viewBox="0 0 560 420">
        <path d="M70 40 L280 40 L240 120 L110 120 Z" fill="#cfd6e8" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
        <rect x="40" y="110" width="460" height="250" rx="28" fill={C.blue} stroke={C.ink} strokeWidth={4} />
        <rect x="64" y="134" width="412" height="16" rx="8" fill="rgba(255,255,255,0.18)" />
        <rect x="150" y="180" width="240" height="130" rx="16" fill={C.editor} stroke={C.ink} strokeWidth={4} />
        <path d="M500 250 L550 250 L550 330 L500 330" fill="#cfd6e8" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
        <circle cx="90" cy="320" r="10" fill={t > 1.2 && t < 4.2 ? '#ffd166' : '#5a6fb3'} />
      </svg>
      <div style={{ ...abs(mx + 150, my + 140, 240, 130), display: 'grid', placeItems: 'center', ...mono, fontSize: 96, fontWeight: 800, color: '#ffd166' }}>{count}</div>
      <div style={{ ...abs(mx + 40, my + 330, 460), textAlign: 'center', ...mono, fontSize: 30, fontWeight: 800, color: C.blue }}>len</div>
      {/* 결과 카드 */}
      <div style={{ ...abs(cardX, 600, 220, 170), opacity: outT, transform: `translateX(${(1 - outT) * (mx + 550 - cardX)}px)`, ...card, background: '#fff', borderWidth: 3, borderColor: '#93a6d9', display: 'grid', placeItems: 'center', ...mono, fontSize: 90, fontWeight: 800, color: C.blue }}>
        4
        <span style={{ position: 'absolute', left: -14, top: 71, width: 28, height: 28, borderRadius: '50%', border: `5px solid ${C.gold}`, background: C.paper }} />
      </div>
      <div style={{ ...abs(cardX - 40, 790, 300), textAlign: 'center', ...small, fontWeight: 700, opacity: outT }}>돌려주는 값</div>
      <svg style={{ ...abs(0, 0, DW, DH), pointerEvents: 'none', opacity: fly > 0.02 ? 1 : 0 }}>
        <path d={`M ${tagX + 6} ${tagY + 22} Q ${(tagX + cardX) / 2} ${tagY + 120 * (1 - fly) + 60} ${cardX + 6} ${685}`} stroke={C.ink} strokeWidth={7} fill="none" strokeLinecap="round" />
        <path d={`M ${tagX + 6} ${tagY + 22} Q ${(tagX + cardX) / 2} ${tagY + 120 * (1 - fly) + 60} ${cardX + 6} ${685}`} stroke="#efe2c4" strokeWidth={4} fill="none" strokeLinecap="round" />
      </svg>
      <div style={{ ...abs(tagX, tagY), opacity: interpolate(t, [5.3, 5.6], [0, 1]), transform: `rotate(${-8 + fly * 8}deg)` }}>
        <NameTag name="n" w={tagW} fontSize={40} />
      </div>
      {/* 비교 칸: print 는 보여 줄 뿐, 반환값은 None */}
      <div style={{ ...abs(100, 850, 820), ...card, padding: '20px 28px', display: 'flex', alignItems: 'center', gap: 22, ...riseIn(t, 7.2) }}>
        <span style={{ ...mono, fontSize: 30, fontWeight: 800, whiteSpace: 'nowrap' }}>print("인공지능")</span>
        <span style={{ fontSize: 26, color: C.faint }}>→</span>
        <span style={{ ...small, fontSize: 22, whiteSpace: 'nowrap' }}>화면에 보여 줄 뿐<br /><b style={{ color: C.faint }}>돌려주는 값은 None(없음)</b></span>
      </div>
      <div style={{ ...abs(1000, 870), ...riseIn(t, 7.4) }}>
        <Term term="반환값" gloss="함수가 일을 마치고 내놓는 결과" color={C.blue} />
      </div>
      {/* 맛보기: 내가 만드는 함수는 return 으로 돌려준다 (15장의 f(x) = 2x + 1) */}
      <div style={{ ...abs(1120, 200, 700), ...riseIn(t, 7.8) }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.blue, marginBottom: 10 }}>
          내가 만드는 함수는 <span style={{ ...mono }}>return</span>으로 값을 돌려준다
        </div>
        <CodeBox lines={['def f(x):', '    return 2 * x + 1', '', 'y = f(3)    # y는 7']} size={26} numbers={false} lineStyle={(i) => (i === 1 ? { background: 'rgba(106,209,255,0.14)', borderRadius: 6, margin: '0 -10px', padding: '0 10px' } : undefined)} />
      </div>
    </>
  );
}

/* ═════════════ 12 · 같은 일이 반복될 때 (build) ═════════════
   반복된 세 줄 묶음이 접혀 show_status() 한 줄이 되고, 호출 줄 셋에서 def 상자로 화살표가 모인다(수렴 구도 — 4장 좌우 비교와 다르게). */
function RepeatJob() {
  const c = useClicks(3);
  const FS = 27;
  const LH = FS * 1.6;
  const PAD_Y = FS * 0.7;
  const CODE_X = 100;
  const CODE_Y = 262;
  const CODE_W = 700;
  const folded = c >= 2;
  const block = ['print("==========")', 'print(f"HP: {hp}")', 'print("==========")'];
  const steps = ['hp = 100', 'hp = hp - 30', 'hp = hp + 10'];
  const line = (text: string, open: boolean, mark = false, key?: string) => (
    <div key={key} style={{ height: open ? LH : 0, opacity: open ? 1 : 0, overflow: 'hidden', whiteSpace: 'pre', transition: trans, display: 'flex', alignItems: 'center' }}>
      <span style={{ borderRadius: 6, padding: '0 4px', margin: '0 -4px', background: mark ? 'rgba(192,57,43,0.42)' : 'transparent', boxShadow: mark ? `0 0 0 2px ${C.red}` : 'none', transition: trans }}>{hl(text)}</span>
    </div>
  );
  // 접힌 뒤 호출 줄의 세로 중심 (줄 순서: 대입, 호출, 대입, 호출, 대입, 호출)
  const callY = [1, 3, 5].map((i) => CODE_Y + PAD_Y + i * LH + LH / 2);
  const DEF_X = 1180;
  const DEF_Y = 500;
  const arrowEnd = [DEF_Y + 70, DEF_Y + 120, DEF_Y + 170];
  return (
    <>
      <Head k="함수가 필요한 이유">같은 일이 반복될 때</Head>
      <div style={{ ...abs(CODE_X, CODE_Y - 40, CODE_W), ...small, fontWeight: 700 }}>{folded ? '반복되던 세 줄을 함수 이름 하나로 바꾼 코드' : 'HP가 바뀔 때마다 상태창 세 줄을 다시 붙여 넣은 코드'}</div>
      {/* 왼쪽 코드 판: 묶음 셋이 접혀 호출 한 줄이 된다 */}
      <div style={{ ...abs(CODE_X, CODE_Y, CODE_W), background: C.editor, color: C.editorInk, borderRadius: 18, padding: `${PAD_Y}px ${FS * 0.9}px`, ...mono, fontSize: FS, boxShadow: '0 30px 60px -40px rgba(31,26,20,0.8)', transition: trans }}>
        {steps.map((st, k) => (
          <div key={st}>
            {line(st, true)}
            <div style={{ position: 'relative', borderLeft: `6px solid ${folded ? 'transparent' : 'rgba(214,51,108,0.75)'}`, paddingLeft: 16, marginLeft: -22, transition: trans }}>
              {block.map((b, j) => line(b, !folded, c === 1 && j !== 1, `${k}-${j}`))}
              <div style={{ height: folded ? LH : 0, opacity: folded ? 1 : 0, overflow: 'hidden', transition: trans, display: 'flex', alignItems: 'center' }}>
                <span style={{ background: 'rgba(214,51,108,0.35)', borderRadius: 6, padding: '0 6px', margin: '0 -6px' }}>{hl('show_status()')}</span>
              </div>
              {!folded && (
                <span style={{ position: 'absolute', right: -6, top: LH * 1.5 - 16, ...mono, fontSize: 18, fontWeight: 800, color: '#f3a6c1' }}>상태창 {k + 1}</span>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* 질문 카드: 고칠 줄 6 → 2 */}
      <div style={{ ...abs(DEF_X, 222, 640), ...card, padding: '22px 30px', display: 'flex', alignItems: 'center', gap: 26, ...show(c >= 1) }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.ink, wordBreak: 'keep-all' }}>구분선 모양을 바꾸려면?</div>
          <div style={{ ...small, marginTop: 6 }}>고쳐야 하는 줄 수</div>
        </div>
        <span style={{ fontSize: 104, fontWeight: 900, lineHeight: 1, color: c >= 3 ? C.faint : C.red, textDecoration: c >= 3 ? 'line-through' : 'none', transition: trans }}>6</span>
        <span style={{ fontSize: 44, fontWeight: 800, color: C.faint, width: c >= 3 ? 40 : 0, opacity: c >= 3 ? 1 : 0, overflow: 'hidden', transition: trans }}>→</span>
        <span style={{ fontSize: 104, fontWeight: 900, lineHeight: 1, color: C.green, width: c >= 3 ? 64 : 0, opacity: c >= 3 ? 1 : 0, overflow: 'hidden', transition: trans }}>2</span>
      </div>
      {/* 호출 줄 → def 상자로 모이는 화살표 */}
      <svg style={{ ...abs(0, 0, DW, DH), pointerEvents: 'none', opacity: folded ? 1 : 0, transition: trans }}>
        <defs>
          <marker id="rjHead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill={C.tag} />
          </marker>
        </defs>
        {callY.map((y, i) => (
          <path key={i} d={`M ${CODE_X + CODE_W + 14} ${y} C ${CODE_X + CODE_W + 200} ${y}, ${DEF_X - 200} ${arrowEnd[i]}, ${DEF_X - 14} ${arrowEnd[i]}`} stroke={C.tag} strokeWidth={4} fill="none" strokeDasharray="10 9" markerEnd="url(#rjHead)" />
        ))}
        {folded && <text x={(CODE_X + CODE_W + DEF_X) / 2} y={callY[0] - 6} textAnchor="middle" style={{ fontSize: 24, fontWeight: 800, fill: C.tag }}>부르면 이 묶음이 실행된다</text>}
      </svg>
      {/* 실행 결과: 같은 상태창이 세 번 그려진다 (접히면 def 상자에 자리를 내준다) */}
      <div style={{ ...abs(DEF_X, 410, 640), opacity: folded ? 0 : 1, transform: folded ? 'translateY(-14px)' : 'none', transition: trans, pointerEvents: 'none' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.mute, marginBottom: 10 }}>실행 결과 · 상태창이 세 번 그려진다</div>
        <div style={{ ...card, padding: '16px 26px', ...mono, fontSize: 22, lineHeight: 1.42, color: C.ink, whiteSpace: 'pre' }}>
          {[100, 70, 80].map((hp) => (
            <div key={hp} style={{ marginBottom: 6 }}>{`==========\nHP: ${hp}\n==========`}</div>
          ))}
        </div>
      </div>
      {/* def 상자: 한 번만 적어 둔 일 */}
      <div style={{ ...abs(DEF_X, DEF_Y, 640), ...show(folded) }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.tag, marginBottom: 10 }}>한 번만 적어 두고 이름을 붙인 일 · 함수</div>
        <CodeBox lines={['def show_status():', '    print("==========")', '    print(f"HP: {hp}")', '    print("==========")']} size={26} numbers={false} style={{ outline: `4px solid ${C.tag}`, outlineOffset: 3 }} />
      </div>
      {/* 아래 띠: 4장과 짝 */}
      <div style={{ ...abs(100, 880, 1720), display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap', ...show(c >= 3) }}>
        <Term term="변수" gloss="반복되는 값에 붙이는 이름 (4장)" color={C.tag} />
        <Term term="함수" gloss="반복되는 일을 묶어 붙이는 이름" />
        <span style={{ fontSize: 26, fontWeight: 800, color: C.ink, marginLeft: 10 }}>한 번 만들고, 필요할 때마다 부른다</span>
      </div>
    </>
  );
}

/* ═════════════ 13 · 내가 만드는 함수: def (static · 실행기) ═════════════ */
function DefSlide() {
  return (
    <>
      <Head k="함수 정의 · 들여쓰기">내가 만드는 함수: def</Head>
      <div style={{ ...abs(100, 240, 520) }}>
        <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 24px 50px -36px rgba(31,26,20,0.8)', position: 'relative' }}>
          <img src={IMG.programF1} alt="점등봇 7번 — 프로그램 칸에서 F1을 부르고, F1 칸에 블록을 묶어 두었다" style={{ width: 520, display: 'block' }} />
          {/* F1 칸 강조 (크롭 441×328 → 520 폭: k=1.179) */}
          <div style={{ position: 'absolute', left: 6, top: 172 * 1.179, width: 508, height: 150 * 1.179, border: `4px solid ${C.tag}`, borderRadius: 12 }} />
          <div style={{ position: 'absolute', left: 14 * 1.179, top: 37 * 1.179, width: 112 * 1.179, height: 52 * 1.179, border: `4px solid ${C.blue}`, borderRadius: 10 }} />
        </div>
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 22, color: C.ink, display: 'flex', gap: 12, alignItems: 'center' }}>
            <i style={{ width: 22, height: 22, border: `4px solid ${C.tag}`, borderRadius: 5, flexShrink: 0 }} />F1 칸에 묶은 블록 = <b style={{ ...mono }}>def</b> 안의 줄
          </div>
          <div style={{ fontSize: 22, color: C.ink, display: 'flex', gap: 12, alignItems: 'center' }}>
            <i style={{ width: 22, height: 22, border: `4px solid ${C.blue}`, borderRadius: 5, flexShrink: 0 }} />프로그램 칸의 F1 = <b style={{ ...mono }}>cheer()</b> 호출
          </div>
        </div>
        <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Term term="함수 정의" gloss="def 이름(): 으로 일을 묶어 이름 붙이기" color={C.tag} />
          <Term term="들여쓰기" gloss="줄 앞을 띄어 「함수 안의 줄」로 표시 (보통 4칸)" />
        </div>
      </div>
      <div style={abs(700, 240, 1120, 750)}>
        <PyRunner code={'def cheer():\n    print("할 수 있다!")\n    print("오늘도 화이팅!")\n\ncheer()\ncheer()'} dots font={34} ui={22} style={{ ...RUN_STYLE, height: 750 }} />
      </div>
    </>
  );
}

/* ═════════════ 15 · 매개변수로 값을 받아 쓰는 함수 (static · 실행기 step) ═════════════ */
function ParamSlide() {
  return (
    <>
      <Head k="인자 · 매개변수" w={900}>매개변수로 값을 받아 쓰는 함수</Head>
      {/* 인자 → 매개변수 */}
      <div style={{ ...abs(980, 60, 840), ...card, padding: '18px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...mono, fontSize: 34, fontWeight: 800 }}>
          <span>
            greet(<span style={{ color: C.str, background: 'rgba(194,65,12,0.1)', borderRadius: 6, padding: '0 6px' }}>"민지"</span>)
          </span>
          <svg width={120} height={40}>
            <path d="M6 20 H108 M94 8 L110 20 L94 32" stroke={C.ink} strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>
            def greet(<span style={{ color: C.tag, background: C.tagSoft, borderRadius: 6, padding: '0 6px' }}>name</span>):
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', ...small, marginTop: 6 }}>
          <span>
            <b style={{ color: C.str }}>인자</b> · 부를 때 건네는 값
          </span>
          <span>
            <b style={{ color: C.tag }}>매개변수</b> · 만들 때 그 값을 받는 이름
          </span>
        </div>
      </div>
      <div style={abs(100, 250, 1720, 740)}>
        <PyRunner code={'def greet(name):\n    print(f"안녕, {name}! 반가워.")\n\ngreet("민지")\ngreet("서연")'} vars step mode="step" dots font={34} ui={22} style={{ ...RUN_STYLE, height: 740 }} />
      </div>
    </>
  );
}

/* ═════════════ 17 · 자주 하는 오류 넷 (build + 문항) ═════════════ */
const ERRORS = [
  { code: 'name = "민지', orig: 'SyntaxError: unterminated string literal (detected at line 1)', why: '따옴표를 열고 닫지 않았다' },
  { code: 'print("안녕"', orig: "SyntaxError: '(' was never closed", why: '여는 괄호를 닫지 않았다' },
  { code: 'name = 민지', orig: "NameError: name '민지' is not defined", why: '없는 이름을 불렀다 (따옴표 누락 · 오타 · 대소문자)' },
];
const ERR4 = { code: ['def greet(name):', 'print(f"안녕, {name}!")', 'greet("민지")'], orig: 'IndentationError: expected an indented block after function definition on line 1', why: 'def 다음 줄을 들여쓰지 않았다' };
function ErrorCard({ code, orig, why, on, y, h = 128, n }: { code: ReactNode; orig: string; why: string; on: boolean; y: number; h?: number; n: number }) {
  return (
    <div style={{ ...abs(100, y, 1720, h), display: 'grid', gridTemplateColumns: '560px 1fr 470px', gap: 24, alignItems: 'center' }}>
      <div style={{ position: 'relative', height: '100%' }}>
        <span style={{ position: 'absolute', left: -2, top: -12, width: 40, height: 40, borderRadius: '50%', background: C.ink, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 20, zIndex: 1 }}>{n}</span>
        <div style={{ height: '100%', background: C.editor, borderRadius: 14, padding: '0 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center', ...mono, fontSize: 26, color: C.editorInk, whiteSpace: 'pre' }}>{code}</div>
      </div>
      <div style={{ ...mono, fontSize: 22, color: C.red, background: C.redSoft, borderRadius: 12, padding: '14px 20px', wordBreak: 'break-word', lineHeight: 1.4, ...show(on, 0) }}>{orig}</div>
      <div style={{ fontSize: 25, fontWeight: 700, color: C.ink, wordBreak: 'keep-all', lineHeight: 1.35, ...show(on, 0) }}>
        <span style={{ fontSize: 16, background: C.red, color: '#fff', borderRadius: 6, padding: '2px 8px', marginRight: 10, verticalAlign: 3 }}>풀이</span>
        {why}
      </div>
    </div>
  );
}
function ErrorsFour() {
  const c = useClicks(4);
  return (
    <>
      <Head k="디버깅 · 오류를 찾아 고치는 일" size={52}>자주 하는 오류 넷</Head>
      <div style={{ ...abs(100, 185, 1720), display: 'grid', gridTemplateColumns: '560px 1fr 470px', gap: 24, ...small, fontWeight: 800, letterSpacing: '0.08em' }}>
        <span>잘못된 코드</span>
        <span>파이썬이 띄운 오류 (원문)</span>
        <span>무슨 뜻인가</span>
      </div>
      {ERRORS.map((e, i) => (
        <ErrorCard key={i} n={i + 1} code={<div>{hl(e.code)}</div>} orig={e.orig} why={e.why} on={c >= i + 1} y={230 + i * 150} />
      ))}
      <div style={{ ...abs(100, 690, 1720, 2), background: 'rgba(31,26,20,0.15)' }} />
      <ErrorCard
        n={4}
        code={<>{ERR4.code.map((l, i) => <div key={i}>{hl(l)}</div>)}</>}
        orig={ERR4.orig}
        why={ERR4.why}
        on={c >= 4}
        y={720}
        h={170}
      />
      <div style={{ ...abs(1450, 690 + 30), fontSize: 22, fontWeight: 800, color: C.tag, ...show(c >= 3 && c < 4, 0) }}>이 코드는 왜 안 될까요?</div>
      <div style={{ ...abs(100, 950, 1720), ...small, fontSize: 22, display: 'flex', justifyContent: 'space-between' }}>
        <span>
          맨 앞 단어만 봐도 종류가 보인다 · <b style={{ color: C.ink }}>SyntaxError</b> 문법이 틀렸다 · <b style={{ color: C.ink }}>NameError</b> 그런 이름이 없다 · <b style={{ color: C.ink }}>IndentationError</b> 들여쓰기가 틀렸다
        </span>
        <span style={{ color: C.tag, fontWeight: 700 }}>활동지 3번에서 고쳐 본 오류들입니다</span>
      </div>
    </>
  );
}

/* ═════════════ 11 · 19 · 활동: 웹에서 파이썬 쓰기 (activity) ═════════════ */
const TASKS: [string, boolean][] = [
  ['첫 실행', false],
  ['나를 소개하는 변수 5개', true],
  ['고쳐 보기', true],
  ['예측하고 실행하기', false],
  ['버킷리스트 출력', true],
  ['도전: 함수로 소개 카드', true],
  ['돌아보기', false],
];
/* 활동지를 두 번에 나눠 쓴다 — 11장은 1~3번(변수 부분), 19장은 4번부터 (2026-11-09) */
function Activity({ from, to }: { from: number; to: number }) {
  const first = from === 1;
  return (
    <>
      <Head k={first ? '활동 ①' : '활동 ②'} w={1000}>{first ? `활동지 ${from}~${to}번만` : `활동지 ${from}번부터 끝까지`}</Head>
      <div style={{ ...abs(100, 230, 980, 680), borderRadius: 18, overflow: 'hidden', background: '#fff', boxShadow: '0 30px 60px -40px rgba(31,26,20,0.8)', border: '1.5px solid rgba(31,26,20,0.16)' }}>
        <div style={{ height: 44, background: '#e9e2d3', display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px' }}>
          {[0, 1, 2].map((i) => <i key={i} style={{ width: 13, height: 13, borderRadius: '50%', background: ['#ff6358', '#f0a91e', '#43c47a'][i] }} />)}
          <span style={{ marginLeft: 16, ...mono, fontSize: 16, color: C.mute }}>활동지.html</span>
        </div>
        <img src={IMG.sheet} alt="활동지 첫 화면 — 과제마다 코드 실행기가 있다" style={{ width: 980, display: 'block' }} />
      </div>
      <div style={{ ...abs(1160, 230, 660), display: 'flex', gap: 26, alignItems: 'center' }}>
        <img src={IMG.qr} alt="활동지 QR" style={{ width: 200, height: 200, borderRadius: 12, background: '#fff', padding: 10 }} />
        <div>
          <a href={SHEET_URL} target="_blank" rel="noopener" style={{ fontSize: 34, fontWeight: 800, color: C.tag, textDecoration: 'underline', textUnderlineOffset: 6 }}>
            활동지 열기 ↗
          </a>
          <div style={{ ...small, marginTop: 10 }}>이름 · 학번 · 제출 암호를 넣고 마지막에 [제출하기]</div>
        </div>
      </div>
      <div style={{ ...abs(1160, 480, 660) }}>
        {TASKS.map(([t, auto], i) => {
          const no = i + 1;
          const now = no >= from && no <= to;
          const done = no < from;
          return (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 16, height: 56, borderLeft: `4px solid ${now ? (i === 5 ? C.tag : C.blue) : 'rgba(31,26,20,0.14)'}`, paddingLeft: 18, marginLeft: 16, opacity: now ? 1 : 0.38 }}>
            <span style={{ ...mono, fontWeight: 800, fontSize: 22, color: C.faint, width: 24 }}>{done ? '✓' : no}</span>
            <span style={{ fontSize: 26, fontWeight: 700, color: C.ink }}>{t}</span>
            {auto && <span style={{ fontSize: 16, fontWeight: 700, color: C.green, border: `1.5px solid ${C.green}88`, borderRadius: 999, padding: '2px 10px' }}>자동 점검</span>}
            {i === 3 && <span style={{ fontSize: 16, fontWeight: 700, color: '#a15c00', border: '1.5px solid #e0a10088', borderRadius: 999, padding: '2px 10px' }}>예측 먼저</span>}
          </div>
          );
        })}
      </div>
      <div style={{ ...abs(100, 950, 1720), ...small, fontSize: 22 }}>
        {first ? (
          <>지금은 <b style={{ color: C.tag }}>{to}번까지만</b> 하고 화면으로 돌아옵니다. 4번부터는 함수를 배운 뒤에 이어서 해요 · 창은 닫지 마세요</>
        ) : (
          <>{from}번부터 이어서 → 마지막에 [제출하기]. 제출한 뒤에도 제출 암호로 다시 불러와 고칠 수 있어요</>
        )}
      </div>
    </>
  );
}

/* ═════════════ 19 · AI 코드 속 변수와 함수 (build) ═════════════ */
/* Teachable Machine 「Tensorflow → Keras」 내보내기 코드 — 주석 줄만 뺐다 (F8, 2026-11-08 확인)
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
function AiCode() {
  const c = useClicks(3);
  const render = (line: string, i: number) => {
    const m = line.match(/^([A-Za-z_][\w]*(?:\[\d\])?) = (.*)$/);
    const dim = i < 4;
    const callRe = /([A-Za-z_][\w.]*)\(/g;
    const underline = (s: string) => {
      if (c < 2) return hl(s);
      const parts: ReactNode[] = [];
      let last = 0;
      let mm: RegExpExecArray | null;
      let k = 0;
      while ((mm = callRe.exec(s))) {
        parts.push(<span key={k++}>{hl(s.slice(last, mm.index))}</span>);
        parts.push(<span key={k++} style={{ color: '#9fb6ff', borderBottom: '3px solid #6f8cff' }}>{mm[1]}</span>);
        last = mm.index + mm[1].length;
      }
      parts.push(<span key={k++}>{hl(s.slice(last))}</span>);
      return parts;
    };
    if (m && !m[1].includes('[')) {
      const hot = m[1] === 'confidence_score' && c >= 3;
      return (
        <span style={{ opacity: dim ? 0.4 : 1 }}>
          <span style={{ background: c >= 1 ? 'rgba(214,51,108,0.55)' : 'transparent', color: c >= 1 ? '#fff' : undefined, borderRadius: 5, padding: c >= 1 ? '0 4px' : 0, outline: hot ? '3px solid #ffd166' : 'none', transition: 'background .4s' }}>{m[1]}</span>
          {' = '}
          {underline(m[2])}
        </span>
      );
    }
    return <span style={{ opacity: dim ? 0.4 : 1 }}>{underline(line)}</span>;
  };
  return (
    <>
      <Head k="오늘 배운 것으로 읽기" w={1200} size={50}>AI 코드 속 변수와 함수</Head>
      <div style={abs(100, 180, 1260)}>
        <CodeBox lines={TM_CODE.map(render)} size={20} style={{ padding: '18px 22px', lineHeight: 1.55 }} />
        <div style={{ ...small, fontSize: 16, marginTop: 8 }}>
          Teachable Machine이 이미지 모델을 파이썬(Keras)으로 내보낼 때 주는 코드 · 주석 줄만 뺐다 · 출처 googlecreativelab/teachablemachine-community (Apache-2.0)
        </div>
      </div>
      <div style={{ ...abs(1410, 200, 410), display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ ...card, padding: '20px 24px', ...show(c >= 1) }}>
          <span style={{ background: C.tag, color: '#fff', borderRadius: 6, padding: '2px 10px', fontWeight: 800, ...mono }}>이름</span>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 10 }}>줄 맨 앞 이름 = … 은 변수</div>
          <div style={{ ...small, marginTop: 4 }}>계산한 결과에 이름을 붙여 다음 줄에서 쓴다</div>
        </div>
        <div style={{ ...card, padding: '20px 24px', ...show(c >= 2) }}>
          <span style={{ ...mono, fontWeight: 800, color: C.blue, borderBottom: '3px solid #6f8cff' }}>이름(</span>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 10 }}>괄호가 붙으면 함수 호출</div>
          <div style={{ ...small, marginTop: 4 }}>모델을 불러오고 → 예측하고 → 출력한다</div>
        </div>
        <div style={{ ...card, padding: '20px 24px', borderColor: '#e0a100', ...show(c >= 3) }}>
          <span style={{ ...mono, fontWeight: 800, outline: '3px solid #ffd166', borderRadius: 4, padding: '0 4px' }}>confidence_score</span>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 10 }}>지난 프로젝트의 신뢰도</div>
          <div style={{ ...small, marginTop: 4 }}>여러분이 기준값과 비교했던 바로 그 값</div>
        </div>
        <div style={{ ...small, fontSize: 18 }}>점( . ) · 대괄호( [ ] ) · 괄호 안의 = 는 앞으로 배웁니다 · 읽기용 코드라 실행에는 Keras와 모델 파일이 따로 필요합니다</div>
      </div>
    </>
  );
}

/* ═════════════ 20 · 한 줄에 모인 오늘 (static + 출구) ═════════════ */
function Closing() {
  return (
    <>
      <div style={{ ...abs(100, 70), display: 'flex', alignItems: 'center', gap: 22 }}>
        <div style={{ transform: 'scale(0.9)', transformOrigin: 'left top' }}>
          <StatusWindow t={99} compact />
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.green, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 44, height: 44, borderRadius: '50%', background: C.green, color: '#fff', display: 'grid', placeItems: 'center' }}>✓</span>
          이제 만들 수 있다
        </div>
      </div>
      <div style={{ ...abs(1300, 90, 520), textAlign: 'right' }}>
        <div style={kick}>정리</div>
        <div style={{ ...h1, fontSize: 48, marginTop: 6 }}>한 줄에 모인 오늘</div>
      </div>
      <div style={{ ...abs(260, 400, 1400, 190), background: C.editor, borderRadius: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', ...mono, fontSize: 120, fontWeight: 800, color: C.editorInk, boxShadow: '0 50px 90px -50px rgba(31,26,20,0.9)' }}>
        <span style={{ color: '#fff', textShadow: '0 0 30px rgba(214,51,108,0.8)' }}>n</span>
        <span style={{ margin: '0 40px' }}>=</span>
        <span style={{ color: '#6ad1ff' }}>len</span>(<span>name</span>)
      </div>
      <div style={{ ...abs(260, 620, 640), display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <NameTag name="n" w={220} fontSize={30} />
        <div>
          <div style={{ fontSize: 40, fontWeight: 800, color: C.tag }}>변수</div>
          <div style={{ ...body, color: C.ink }}>값에 붙인 이름표. <span style={{ ...mono }}>이름 = 값</span>, 오른쪽을 먼저 계산한다</div>
        </div>
      </div>
      <div style={{ ...abs(980, 720, 680) }}>
        <div style={{ fontSize: 40, fontWeight: 800, color: C.blue }}>함수</div>
        <div style={{ ...body, color: C.ink }}>
          이름을 불러 시키는 일. <span style={{ ...mono }}>이름(인자)</span>로 부르고, 값을 돌려주기도 한다
        </div>
      </div>
      <div style={{ ...abs(1300, 960, 520), textAlign: 'right', ...small }}>
        다음 시간 · 사용자에게 값을 입력받는 <b style={{ ...mono, color: C.ink }}>input()</b>
      </div>
    </>
  );
}

export const SLIDE_COUNT = 21;

export default function PythonVarFuncDeck() {
  useEffect(() => {
    preloadPython();
  }, []);
  return (
    <Deck>
      <Page nav="표지" n={1}><Scene freezeAt={8}><CoverScene /></Scene></Page>
      <Page nav="블록에서 파이썬으로" n={2}><BlocksToPython /></Page>
      <Page nav="첫 실행" n={3}><FirstRun /></Page>
      <Page nav="이름이 왜 필요할까" n={4}><WhyNames /></Page>
      <Page nav="변수는 이름표" n={5}><Scene freezeAt={8}><TagScene /></Scene></Page>
      <Page nav="= 는 같다가 아니다" n={6}><NotEqual /></Page>
      <Page nav="한 줄씩 따라가기" n={7}><StepHp /></Page>
      <Page nav="따옴표" n={8}><Quotes /></Page>
      <Page nav="이름 짓는 규칙" n={9}><NameRules /></Page>
      <Page nav="print(name)" n={10}><NameVsString /></Page>
      <Page nav="활동 ①" n={11}><Activity from={1} to={3} /></Page>
      <Page nav="여러 값 출력" n={12}><ManyValues /></Page>
      <Page nav="같은 일이 반복될 때" n={13}><RepeatJob /></Page>
      <Page nav="def" n={14}><DefSlide /></Page>
      <Page nav="함수를 부르는 방법" n={15}><CallShape /></Page>
      <Page nav="매개변수" n={16}><ParamSlide /></Page>
      <Page nav="값을 돌려주는 함수" n={17}><Scene freezeAt={9}><CounterScene /></Scene></Page>
      <Page nav="오류 넷" n={18}><ErrorsFour /></Page>
      <Page nav="활동 ②" n={19}><Activity from={4} to={7} /></Page>
      <Page nav="AI 코드 읽기" n={20}><AiCode /></Page>
      <Page nav="정리" n={21}><Closing /></Page>
    </Deck>
  );
}
