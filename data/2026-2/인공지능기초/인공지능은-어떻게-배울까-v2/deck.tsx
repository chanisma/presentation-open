import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import Build from '../../../../src/deck/Build';
import { useDeck } from '../../../../src/deck/DeckContext';
import { Scene, useSceneTime, interpolate, spring, riseIn, easeOut, easeInOut } from '../../../../src/scene';
import KenBurns from '../../../../src/components/KenBurns';
import {
  AppWindow, Pointer, Caret, typed, typedDoneAt, clickFlash, popIn, dimAfter, type CursorKey,
} from '../../../../src/walkthrough';
import { NOTES } from './notes';

/* ── 인공지능 기초 · 2026-2 — 인공지능은 어떻게 배울까 (버전 2 · ELI5판, 24장) ─────
   plan: ./plan.md — 단일 진실 원천. 발표자 노트는 ./notes.ts (plan.md에서 다시 뽑는다).

   한 파일에 공용 도구 → 1~6장 → 7~13장 → 14~19장 → 20~22장 → 23~24장 → 덱 순으로 놓았다.
   (2026-09-19에 shared.tsx·slides-a~d.tsx를 여기로 합쳤다. 다른 덱과 같은 모양으로 둔다.)

   1~6    제목(image) → 세 갈래(build+live) → 학자 넷(build) → 수준별 분류(scene)
          → 도구에서 에이전트로(build) → 배운다는 것(scene)
   7~13   규칙 기반(scene) → 기계학습 다리(build+live) → 퍼셉트론(build)
          → 층 쌓기·곡선 경계(scene+build+live) → 역전파(scene) → 딥러닝(build) → 세 시대(static+live)
   14~19  지도(build) → 비지도(scene) → 강화(scene) → 방향(build+live) → 커넥톰(static+live) → 영상(static)
   20~22  전이학습(scene) → walkthrough ①(릴레이) → walkthrough ②(단일 창 + 다이얼로그, live)
   23~24  실습(activity) → 정리(build+exit)

   테마: 크림 종이 + 딥 그린 + 앰버(registry). 버전 1은 ../인공지능은-어떻게-배울까/. */


/* ══════════════════════════════════════════════════════════════════════
   공용 토큰·도구 (옛 shared.tsx)
   ══════════════════════════════════════════════════════════════════════ */

/* ── 「인공지능은 어떻게 배울까」 공용 모듈 (버전 2 · ELI5판) ─────────────
   plan: ./plan.md (단일 진실 원천). 슬라이드 본문은 slides-*.tsx에 나뉘어 있고
   이 파일은 모든 묶음이 같은 좌표계·타이포·색·자산 경로를 쓰게 하는 계약이다.
   - 설계 박스 1920×1080 고정 배율(Fit) — 4K·울트라와이드에서도 같은 구도
   - 테마 토큰은 registry(ai-how-to-learn)의 CSS 변수. 여기 C는 그 값의 별칭
   - 씬 템플릿·구도 카탈로그는 두지 않는다(scene-grammar) — 아톰만 제공 */

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

/* ── Page — 모든 장의 바깥 껍질: full Slide + Fit. notes는 프레젠터 노트 ── */
function Page({ nav, notes, children }: { nav: string; notes: string; children: ReactNode }) {
  return (
    <Slide full nav={nav} notes={notes}>
      <Fit>{children}</Fit>
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

/* 덱 색 — registry 테마와 같은 값. 화면의 색은 이 별칭이나 var(--…)만 쓴다 */
const C = {
  green: '#1e7a55', // --primary · 학습·성장·컴퓨터 몫
  greenSoft: 'rgba(30,122,85,0.12)',
  amber: '#e0a52a', // 보상·강조·사람 몫
  amberSoft: 'rgba(224,165,42,0.16)',
  ink: '#1d2a26', // --fg
  red: '#c8442e', // 틀림·오차
  redSoft: 'rgba(200,68,46,0.13)',
  blue: '#2f6fb5', // 보조 대비 (정답·△ 등 둘째 범주)
  blueSoft: 'rgba(47,111,181,0.13)',
  paper: '#f4efe4', // --bg
};

const kick: CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--fg-faint)',
};
const h1: CSSProperties = {
  fontFamily: 'var(--font-head)',
  fontWeight: 800,
  letterSpacing: '-0.03em',
  lineHeight: 1.1,
  fontSize: 62,
  wordBreak: 'keep-all',
  margin: 0,
};
const h2: CSSProperties = { ...h1, fontSize: 48 };
const h3: CSSProperties = { ...h1, fontSize: 32 };
const body: CSSProperties = { fontSize: 23, lineHeight: 1.5, color: 'var(--fg-muted)', wordBreak: 'keep-all' };
const small: CSSProperties = { fontSize: 17, lineHeight: 1.45, color: 'var(--fg-faint)', wordBreak: 'keep-all' };
const mono: CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };
const card: CSSProperties = {
  background: 'var(--surface-2)',
  border: '1px solid var(--hair)',
  borderRadius: 18,
  boxShadow: '0 14px 40px -28px rgba(29,42,38,0.35)',
};
const accentText: CSSProperties = {
  background: 'var(--accent)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
};

/* ── Term — 정식 용어 + 한 문장 풀이 칩 (ELI5 원칙: 용어는 나오는 즉시 풀이) ── */
function Term({
  term,
  gloss,
  color = C.green,
  size = 20,
  style,
}: {
  term: string;
  gloss: string;
  color?: string;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 4, ...style }}>
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
      <span style={{ ...small, fontSize: size * 0.82, color: 'var(--fg-muted)' }}>{gloss}</span>
    </div>
  );
}

/* ── 클릭 가능한 링크 버튼 (수업 중 접속 URL은 반드시 이걸로) ── */
function LinkButton({
  href,
  children,
  size = 22,
  sub,
  tone = 'green',
  download,
}: {
  href: string;
  children: ReactNode;
  size?: number;
  sub?: string;
  tone?: 'green' | 'amber' | 'ghost';
  download?: boolean;
}) {
  const bg = tone === 'amber' ? C.amber : tone === 'ghost' ? 'transparent' : 'var(--accent)';
  const fg = tone === 'ghost' ? C.green : tone === 'amber' ? C.ink : 'var(--accent-ink)';
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 8 }}>
      <a
        href={href}
        target={download ? undefined : '_blank'}
        rel="noopener"
        download={download ? '' : undefined}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          padding: `${size * 0.6}px ${size * 1.3}px`,
          borderRadius: 999,
          background: bg,
          border: tone === 'ghost' ? `2px solid ${C.green}` : 'none',
          color: fg,
          fontWeight: 800,
          fontSize: size,
          textDecoration: 'underline',
          textDecorationThickness: 2,
          textUnderlineOffset: 4,
          boxShadow: tone === 'ghost' ? 'none' : 'var(--glow)',
          wordBreak: 'keep-all',
        }}
      >
        {children}
      </a>
      {sub && <div style={{ ...small, fontSize: 14 }}>{sub}</div>}
    </div>
  );
}

/* ── 결정론 유틸 ── */
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/* ── 경로·자산 (서빙 URL — 번들 import 금지) ── */
const BASE = 'data/2026-2/인공지능기초/인공지능은-어떻게-배울까-v2';
const SPR = 'assets/sprites/ai-how-to-learn';
const IMG = {
  turing: `${SPR}/turing.png`,
  mccarthy: `${SPR}/mccarthy.png`,
  minsky: `${SPR}/minsky.png`,
  aimaBook: `${SPR}/aima-book.png`,
  neuron: `${SPR}/neuron.png`,
  fruitFly: `${SPR}/fruit-fly.png`,
  notebook: `${BASE}/images/stage-notebook.png`,
  /** 폴라로이드풍 사진 카드 — kind: cat | car | cup, i: 1~4 */
  card: (kind: 'cat' | 'car' | 'cup', i: number) => `${SPR}/card-${kind}-${i}.png`,
};
/** 손그림 SVG 부분 에셋 (svg-asset-builder · assets/svg/). viewBox 비율은 아래 값으로 고정 */
const SVG = {
  /** 가로 트랙 위 둥근 다이얼 손잡이 — viewBox 0 0 400 160 */
  knob: 'assets/svg/ink-slider-knob.svg',
  /** 집게 달린 클립보드, 종이가 아래로 길게 — viewBox 0 0 520 760 */
  clipboard: 'assets/svg/ink-clipboard.svg',
  /** 십자키와 버튼 둘 달린 게임 컨트롤러 — viewBox 0 0 520 320 */
  gamepad: 'assets/svg/ink-gamepad.svg',
  /** 둥근 안경(렌즈 둘·다리) — viewBox 0 0 700 300 */
  glasses: 'assets/svg/ink-glasses.svg',
  /** 따로 떼어 낸 작은 덧렌즈 — viewBox 0 0 220 220 */
  lens: 'assets/svg/ink-add-lens.svg',
};
const DATASET_DIR = `${BASE}/dataset/치와와-머핀`;
const DATASET_ZIP = `/${BASE}/dataset/치와와-머핀.zip`;
/** 활동지는 버전 1의 것을 그대로 쓴다 (사용자 지시 2026-09-16).
    시트 source는 `chihuahua_muffin`, 이미 배포돼 있다. 버전 2 전용 활동지는 두지 않는다. */
const ACTIVITY_URL = '/data/2026-2/인공지능기초/인공지능은-어떻게-배울까/활동지.html';
const TM_URL = 'https://teachablemachine.withgoogle.com/train';
const YT_ID = 'BUkLWjcoBc0';
const YT_WATCH = `https://www.youtube.com/watch?v=${YT_ID}`;

/* ══════════════════════════════════════════════════════════════════════
   1~6장 (옛 slides-a.tsx)
   ══════════════════════════════════════════════════════════════════════ */

/* ── slides-a · 1~6장 ─────────────────────────────────────────────
   1 제목(image · 실험 노트 무대) → 2 세 갈래(build+live) → 3 학자 넷(build)
   → 4 성적표 계단(scene) → 5 도구에서 에이전트로(build) → 6 손잡이와 과녁(scene+svg)
   좌표는 전부 1920×1080 설계 박스 px. 색은 C.* 별칭과 var(--…) 토큰만. */

/* 로컬 헬퍼 */
const pill = (color: string, size = 20): CSSProperties => ({
  display: 'inline-block',
  padding: `${size * 0.22}px ${size * 0.7}px`,
  borderRadius: 999,
  background: `color-mix(in srgb, ${color} 14%, transparent)`,
  border: `1.5px solid ${color}`,
  color,
  fontWeight: 800,
  fontSize: size,
  whiteSpace: 'nowrap',
  lineHeight: 1.2,
});
const solidPill = (bg: string, fg: string, size = 20): CSSProperties => ({
  display: 'inline-block',
  padding: `${size * 0.28}px ${size * 0.8}px`,
  borderRadius: 999,
  background: bg,
  color: fg,
  fontWeight: 800,
  fontSize: size,
  whiteSpace: 'nowrap',
  lineHeight: 1.2,
});
const easeSpring = 'cubic-bezier(0.16, 1, 0.3, 1)';

/* ═══════════════════════ S01 · 제목 (image) ═══════════════════════ */
const HAND_FONT_ID = 'v2-hand-font';
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
const hand: CSSProperties = { fontFamily: "'Nanum Pen Script', var(--font-head)", wordBreak: 'keep-all' };

function S01Ink() {
  const t = useSceneTime();
  const memo = ['① 정의', '② 학습의 역사', '③ 내 손으로 모델 하나'];
  return (
    <>
      {/* 왼쪽 면 · 제목 밴드 (잉크 얼룩 x<260 피함) */}
      <div style={{ ...abs(330, 280), ...kick, color: C.green, opacity: interpolate(t, [0.1, 0.6], [0, 1]) }}>
        인공지능 기초 · 인공지능의 이해와 학습
      </div>
      <h1 style={{ ...abs(330, 328, 580), ...h1, fontSize: 88, lineHeight: 1.08, color: C.green, ...riseIn(t, 0.3, 0.9) }}>
        인공지능은
        <br />
        어떻게 배울까
      </h1>
      {/* 손으로 그은 앰버 밑줄: clip inset로 왼→오 */}
      <svg style={{ ...abs(330, 552, 520, 24) }} viewBox="0 0 520 24" aria-hidden>
        <path
          d="M4 14 C 90 6, 180 18, 270 11 S 440 8, 514 13"
          fill="none"
          stroke={C.amber}
          strokeWidth={7}
          strokeLinecap="round"
          style={{ clipPath: `inset(0 ${interpolate(t, [0.9, 1.7], [100, 0], easeOut)}% 0 0)` }}
        />
      </svg>
      <div style={{ ...abs(330, 600, 560), ...body, fontSize: 32, color: 'var(--fg)', fontWeight: 500, ...riseIn(t, 0.8, 0.8) }}>
        정의에서 실습까지
      </div>
      {/* 오른쪽 면 · 손글씨 메모 (연필 x≥1580·y≥600 피함) */}
      <div style={{ ...abs(1090, 330), ...hand, fontSize: 50, color: 'var(--fg)', lineHeight: 1.55 }}>
        {memo.map((m, i) => (
          <div key={m} style={riseIn(t, 1.3 + i * 0.35, 0.7, 18)}>
            {m}
          </div>
        ))}
      </div>
      <div style={{ ...abs(1090, 605, 470), ...riseIn(t, 2.6, 0.8, 18) }}>
        <div style={{ ...hand, fontSize: 30, color: C.green }}>오늘 만들 것</div>
        <div style={{ ...hand, fontSize: 40, color: 'var(--fg)', lineHeight: 1.2 }}>치와와와 머핀을 가르는 모델</div>
      </div>
    </>
  );
}
function S01() {
  useHandFont();
  return (
    <Scene freezeAt={20} duration={20}>
      <KenBurns src={IMG.notebook} flip zoom={[1, 1.05]} pan={1.5} duration={20} alt="펼친 실험 노트" />
      <S01Ink />
    </Scene>
  );
}

/* ═══════════════════════ S02 · 세 갈래 (build + live) ═══════════════════════ */
const S02_BANDS = [
  { tab: '첫째 갈래', label: '배우는 법', gloss: '경험이 쌓일수록 스스로 나아지는가', ex: '유튜브 추천이 볼수록 취향을 맞춘다' },
  { tab: '둘째 갈래', label: '하는 일', gloss: '사람이 지능을 써야 하던 일을 하는가', ex: '번역기 · 내비게이션' },
  { tab: '셋째 갈래', label: '겉모습', gloss: '사람처럼 말하고 움직이는가', ex: '챗봇 · 로봇' },
];
function S02() {
  const dom = S02_BANDS[0];
  return (
    <>
      <div style={{ ...abs(110, 72), ...kick }}>인공지능을 가르는 세 갈래</div>
      <h2 style={{ ...abs(110, 100, 1000), ...h2 }}>인공지능이라고 부르려면</h2>
      <div style={{ ...abs(110, 168, 1000), ...body, fontSize: 22 }}>셋 중 무엇을 보느냐에 따라 「인공지능」의 범위가 달라진다.</div>

      {/* 라이브 문항 자리 (at=3 뒤 이 화면을 띄운 채 연다) */}
      <Build at={3} style={{ ...abs(1180, 78, 630), textAlign: 'right' }}>
        <span style={pill(C.amber, 18)}>라이브 · 투표 · 정답 없음</span>
        <div style={{ ...small, marginTop: 8 }}>여러분은 무엇을 보고 「이건 인공지능이다」라고 판단하나요?</div>
      </Build>

      {/* 띠 1 · dominant */}
      <Build at={1} style={{ ...abs(110, 240, 720, 700), zIndex: 2 }}>
        <div
          style={{
            ...card,
            position: 'relative',
            width: 720,
            height: 700,
            boxSizing: 'border-box',
            padding: '40px 48px',
            border: `2.5px solid ${C.green}`,
            background: `color-mix(in srgb, ${C.green} 9%, var(--surface-2))`,
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', right: 26, bottom: -40, fontSize: 320, fontWeight: 900, lineHeight: 1, color: C.green, opacity: 0.08, ...mono }}>1</div>
          <div style={{ ...kick, color: C.green }}>{dom.tab}</div>
          <div style={{ ...h1, fontSize: 76, marginTop: 14, color: C.green }}>{dom.label}</div>
          <div style={{ ...body, fontSize: 30, color: 'var(--fg)', fontWeight: 600, marginTop: 22 }}>{dom.gloss}</div>
          <div style={{ position: 'absolute', left: 48, right: 48, bottom: 44 }}>
            <div style={{ ...kick, fontSize: 15 }}>생활 예시</div>
            <div style={{ ...body, fontSize: 27, marginTop: 6 }}>{dom.ex}</div>
          </div>
        </div>
      </Build>
      {/* at=4 · 앰버 밑줄 + 오늘 칩 */}
      <Build at={4} style={{ ...abs(156, 400, 560, 60), zIndex: 3 }}>
        <div style={{ position: 'relative', width: 560, height: 60 }}>
          <div style={{ position: 'absolute', left: 0, top: 6, width: 300, height: 12, borderRadius: 6, background: C.amber, transform: 'rotate(-1deg)' }} />
          <div style={{ position: 'absolute', left: 318, top: -46, ...solidPill(C.amber, C.ink, 22) }}>오늘은 이 갈래</div>
        </div>
      </Build>

      {/* 띠 2·3 · 작고 옅게, 위가 계단처럼 내려감 */}
      {S02_BANDS.slice(1).map((b, i) => (
        <Build key={b.label} at={2 + i} style={{ ...abs(870 + i * 480, 300 + i * 60, 440, 640 - i * 60) }}>
          <div
            style={{
              ...card,
              position: 'relative',
              width: 440,
              height: 640 - i * 60,
              boxSizing: 'border-box',
              padding: '30px 34px',
              opacity: 0.92,
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', right: 18, bottom: -30, fontSize: 220, fontWeight: 900, lineHeight: 1, color: 'var(--fg)', opacity: 0.06, ...mono }}>{i + 2}</div>
            <div style={kick}>{b.tab}</div>
            <div style={{ ...h2, fontSize: 46, marginTop: 10 }}>{b.label}</div>
            <div style={{ ...body, fontSize: 23, marginTop: 16 }}>{b.gloss}</div>
            <div style={{ position: 'absolute', left: 34, right: 34, bottom: 36 }}>
              <div style={{ ...kick, fontSize: 15 }}>생활 예시</div>
              <div style={{ ...body, fontSize: 22, marginTop: 6 }}>{b.ex}</div>
            </div>
          </div>
        </Build>
      ))}
    </>
  );
}

/* ═══════════════════════ S03 · 네 사람, 네 가지 정의 (build) ═══════════════════════ */
const S03_FIGS = [
  { src: IMG.turing, ratio: 1145 / 1366, name: '앨런 튜링' },
  { src: IMG.mccarthy, ratio: 1145 / 1352, name: '존 매카시' },
  { src: IMG.minsky, ratio: 1022 / 1364, name: '마빈 민스키' },
  { src: IMG.aimaBook, ratio: 831 / 1157, name: '러셀 · 노빅' },
];
type S03Quote = { who: string; when: string; en: string[]; ko: string; term?: { term: string; gloss: string } };
const S03_QUOTES: S03Quote[] = [
  {
    who: '앨런 튜링',
    when: '1950 · 『Mind』 「Computing Machinery and Intelligence」',
    en: ['"Can machines think?"  →  the imitation game'],
    ko: '「기계가 생각할 수 있는가」라는 물음을 「사람과 구별할 수 없이 대화하는가」로 바꿔 물었다.',
    term: { term: '모방 게임', gloss: '글로만 대화해서 사람인지 기계인지 맞히는 시험 (튜링 테스트)' },
  },
  {
    who: '존 매카시',
    when: '1956 · 「인공지능」이라는 이름을 지음 (정의 문장은 「What is Artificial Intelligence?」)',
    en: ['"the science and engineering of making intelligent machines, especially intelligent computer programs"'],
    ko: '지능적인 기계, 특히 지능적인 컴퓨터 프로그램을 만드는 과학과 공학',
  },
  {
    who: '마빈 민스키',
    when: '1968',
    en: ['"the science of making machines do things that would require intelligence if done by men"'],
    ko: '사람이 했다면 지능이 필요했을 일을 기계가 하게 만드는 과학',
  },
  {
    who: '스튜어트 러셀 · 피터 노빅',
    when: '교재 『Artificial Intelligence: A Modern Approach』 2장',
    en: [
      '"An agent is anything that can be viewed as perceiving its environment through sensors and acting upon that environment through effectors."',
      '"A rational agent is one that does the right thing."',
    ],
    ko: '에이전트는 주변을 감지하고 그 환경에 행동하는 것. 인공지능은 그중 「합리적 에이전트」를 연구하고 설계하는 일이다.',
    term: { term: '합리적 에이전트', gloss: '주어진 목표를 가장 잘 이루는 쪽으로 행동하는 것' },
  },
];
/* dominant 인덱스(d: -1 없음, 0~2 초상, 3 교재)에 따른 네 오브젝트의 rect. 바닥선 y=960에 정렬, 왼쪽부터 겹치며 패킹 */
function s03Rects(d: number) {
  const hs: number[] = [0, 1, 2].map((i) => (d < 0 ? 440 : i === d ? 680 : 340));
  hs.push(d < 0 ? 350 : d === 3 ? 560 : 280);
  const bottom = 960;
  let x = 60;
  return hs.map((h, i) => {
    const w = Math.round(h * S03_FIGS[i].ratio);
    const r = { x, y: bottom - h, w, h };
    x += w - (i === 2 ? 30 : 50);
    return r;
  });
}
function S03() {
  const { clicks } = useDeck();
  const d = Math.min(clicks, 4) - 1;
  const rects = s03Rects(d);
  const tr = `left .65s ${easeSpring}, top .65s ${easeSpring}, width .65s ${easeSpring}, height .65s ${easeSpring}, opacity .4s`;
  return (
    <>
      <div style={{ ...abs(110, 64), ...kick }}>정의 · 학자마다 「무엇을 지능으로 보는가」가 달랐다</div>
      <h2 style={{ ...abs(110, 92, 900), ...h2 }}>네 사람, 네 가지 정의</h2>

      {/* 초상 셋 + 교재 */}
      {S03_FIGS.map((f, i) => {
        const r = rects[i];
        const isDom = i === d;
        const isBook = i === 3;
        return (
          <div
            key={f.name}
            style={{
              ...abs(r.x, r.y, r.w, r.h),
              zIndex: isDom ? 5 : 1 + i,
              opacity: d < 0 || isDom ? 1 : 0.62,
              transition: tr,
            }}
          >
            <img src={f.src} alt={f.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', filter: isDom || d < 0 ? 'none' : 'saturate(0.7)', transition: 'filter .4s' }} />
            {isBook && (
              <div style={{ position: 'absolute', left: '10%', top: '16%', width: '68%', color: C.paper, textAlign: 'center', transform: 'rotate(-3deg)', opacity: isDom ? 1 : 0.85, transition: 'opacity .4s' }}>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: isDom ? 34 : 17, lineHeight: 1.15, letterSpacing: '-0.02em', transition: 'font-size .5s' }}>Artificial Intelligence</div>
                <div style={{ fontWeight: 600, fontSize: isDom ? 22 : 11, marginTop: isDom ? 10 : 4, transition: 'font-size .5s' }}>A Modern Approach</div>
                <div style={{ fontWeight: 700, fontSize: isDom ? 18 : 9, marginTop: isDom ? 26 : 10, opacity: 0.85, transition: 'font-size .5s' }}>Russell · Norvig</div>
              </div>
            )}
            <div style={{ position: 'absolute', left: '50%', bottom: 10, transform: 'translateX(-50%)', ...solidPill('var(--surface-2)', isDom ? C.green : 'var(--fg-muted)', isDom ? 22 : 17), border: `1.5px solid ${isDom ? C.green : 'var(--hair)'}`, transition: 'font-size .4s' }}>
              {f.name}
            </div>
          </div>
        );
      })}

      {/* 클릭 전 안내 */}
      <div style={{ ...abs(1300, 280, 540), ...body, fontSize: 24, opacity: d < 0 ? 1 : 0, transition: 'opacity .3s' }}>
        네 사람이 저마다 다른 곳을 보았다. 한 사람씩 무엇을 「지능」으로 보았는지 읽는다.
      </div>

      {/* 인용 카드 · at=1부터, 내용은 d에 따라 교차 */}
      <Build at={1} style={{ ...abs(1300, 270, 560), zIndex: 6 }}>
        <div style={{ ...card, padding: '30px 34px', boxSizing: 'border-box', width: 560, border: `2px solid ${C.green}`, display: 'grid' }}>
          {S03_QUOTES.map((q, i) => {
            const on = i === Math.max(0, d);
            return (
              <div key={q.who} style={{ gridArea: '1 / 1', opacity: on ? 1 : 0, transition: 'opacity .35s', pointerEvents: on ? 'auto' : 'none' }}>
                <div style={{ ...kick, color: C.green }}>{q.who}</div>
                <div style={{ ...small, fontSize: 17, marginTop: 4 }}>{q.when}</div>
                <div style={{ marginTop: 16 }}>
                  {q.en.map((line) => (
                    <div key={line} style={{ fontSize: 20, lineHeight: 1.4, fontStyle: 'italic', color: 'var(--fg-muted)', marginTop: 6 }}>
                      {line}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 27, lineHeight: 1.4, fontWeight: 700, color: 'var(--fg)', marginTop: 16, wordBreak: 'keep-all' }}>{q.ko}</div>
                {q.term && <Term term={q.term.term} gloss={q.term.gloss} size={20} style={{ marginTop: 18, maxWidth: 490 }} />}
              </div>
            );
          })}
        </div>
      </Build>
      {/* 클릭 4까지 등록 */}
      <Build at={4} style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
        <span />
      </Build>

      <div style={{ ...abs(60, 1036), ...small, fontSize: 17 }}>초상은 생성 이미지 재현 · 실제 사진이 아님</div>
    </>
  );
}

/* ═══════════════════════ S04 · 두 줄 성적표 계단 (scene) ═══════════════════════ */
const S04_LEVELS = [
  { n: 0, en: 'No AI', ko: '인공지능 없음' },
  { n: 1, en: 'Emerging', ko: '미숙련 성인 수준' },
  { n: 2, en: 'Competent', ko: '숙련 성인 상위 50%' },
  { n: 3, en: 'Expert', ko: '숙련 성인 상위 10%' },
  { n: 4, en: 'Exceptional', ko: '숙련 성인 상위 1%' },
  { n: 5, en: 'Superhuman', ko: '모든 사람보다 나음' },
];
type S04Row = { x0: number; w: number; floor: number; boxH: number; rise: number; color: string };
const S04_UP: S04Row = { x0: 120, w: 230, floor: 520, boxH: 200, rise: 40, color: C.green };
const S04_LO: S04Row = { x0: 120, w: 290, floor: 950, boxH: 200, rise: 28, color: C.blue };
const cellTop = (r: S04Row, i: number) => r.floor - r.boxH - i * r.rise;
const cellCx = (r: S04Row, i: number) => r.x0 + r.w * i + r.w / 2;

function S04Stairs({ row, t }: { row: S04Row; t: number }) {
  return (
    <>
      {S04_LEVELS.map((lv, i) => {
        const s = spring(t, 0.1 + i * 0.3, 0.7);
        const top = cellTop(row, i);
        return (
          <div
            key={lv.n}
            style={{
              ...abs(row.x0 + row.w * i, top, row.w, row.floor - top),
              boxSizing: 'border-box',
              padding: '14px 14px 0',
              borderRadius: '14px 14px 0 0',
              border: `1.5px solid color-mix(in srgb, ${row.color} 45%, transparent)`,
              borderBottom: 'none',
              background: `color-mix(in srgb, ${row.color} ${7 + i * 4}%, var(--surface-2))`,
              opacity: Math.min(1, s * 1.4),
              transform: `translateY(${(1 - s) * 40}px)`,
            }}
          >
            <div style={{ ...mono, fontSize: 56, fontWeight: 800, lineHeight: 1, color: row.color }}>{lv.n}</div>
            <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1, marginTop: 6, color: 'var(--fg)', letterSpacing: '-0.02em' }}>{lv.en}</div>
            <div style={{ fontSize: 19, lineHeight: 1.25, marginTop: 5, color: 'var(--fg-muted)', wordBreak: 'keep-all' }}>{lv.ko}</div>
          </div>
        );
      })}
    </>
  );
}
function S04Band({ x, y, w, label, at, t }: { x: number; y: number; w: number; label: string; at: number; t: number }) {
  const k = interpolate(t, [at, at + 0.6], [0, 1], easeOut);
  return (
    <div style={{ ...abs(x, y, w, 46), clipPath: `inset(0 ${(1 - k) * 100}% 0 0)`, zIndex: 3 }}>
      <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', borderRadius: 10, background: C.amber, opacity: 0.92, display: 'flex', alignItems: 'center', paddingLeft: 16, fontSize: 22, fontWeight: 800, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden' }}>
        {label}
      </div>
    </div>
  );
}
function S04Flag({
  cx, cellY, top, side, w, name, why, color, dashed, at, t,
}: { cx: number; cellY: number; top: number; side: 'left' | 'right'; w: number; name: string; why: string; color: string; dashed?: boolean; at: number; t: number }) {
  const s = spring(t, at, 0.7);
  const h = 66;
  const x = side === 'right' ? cx + 8 : cx - 8 - w;
  return (
    <div style={{ ...abs(0, 0, 0, 0), zIndex: 4, opacity: Math.min(1, s * 1.5), transform: `translateY(${(1 - s) * -60}px)` }}>
      <div style={{ ...abs(cx - 2, top, 4, cellY - top), background: color, borderRadius: 2 }} />
      <div style={{ ...abs(cx - 9, cellY - 9, 18, 18), borderRadius: 9, background: color }} />
      <div style={{ ...abs(x, top, w, h), boxSizing: 'border-box', padding: '8px 14px', borderRadius: 10, background: 'var(--surface-2)', border: `2px ${dashed ? 'dashed' : 'solid'} ${color}`, boxShadow: '0 10px 28px -18px rgba(29,42,38,0.4)' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1.15, whiteSpace: 'nowrap' }}>{name}</div>
        <div style={{ fontSize: 18, color: 'var(--fg-muted)', lineHeight: 1.2, marginTop: 3, whiteSpace: 'nowrap' }}>{why}</div>
      </div>
    </div>
  );
}
function S04Body() {
  const t = useSceneTime();
  const up = S04_UP, lo = S04_LO;
  return (
    <>
      <div style={{ ...abs(110, 56), ...kick }}>수준별 분류 · 성능 축 × 범위 축</div>
      <h2 style={{ ...abs(110, 84, 980), ...h2 }}>얼마나 잘하고, 얼마나 넓게 하는가</h2>

      {/* 줄 이름 */}
      {/* 줄 이름 — 칸이 가장 낮은 왼쪽 끝에만 둔다. 축 설명은 「읽는 법」 카드가 맡는다 */}
      <div style={{ ...abs(120, 266), ...riseIn(t, 0.15, 0.6) }}>
        <span style={pill(up.color, 22)}>좁은 인공지능</span>
      </div>
      <div style={{ ...abs(120, 696), ...riseIn(t, 0.15, 0.6) }}>
        <span style={pill(lo.color, 22)}>일반 인공지능</span>
      </div>

      <S04Stairs row={up} t={t} />
      <S04Stairs row={lo} t={t} />
      {/* 바닥선 */}
      <div style={{ ...abs(up.x0, up.floor, up.w * 6, 3), background: `color-mix(in srgb, ${up.color} 50%, transparent)`, opacity: interpolate(t, [0, 0.4], [0, 1]) }} />
      <div style={{ ...abs(lo.x0, lo.floor, lo.w * 6, 3), background: `color-mix(in srgb, ${lo.color} 50%, transparent)`, opacity: interpolate(t, [0, 0.4], [0, 1]) }} />

      {/* 앰버 띠 · 통용 구분 */}
      <S04Band x={up.x0 + 10} y={up.floor - 58} w={up.w * 6 - 20} label="약인공지능 (좁은 인공지능) · 한 가지 일" at={2.0} t={t} />
      <S04Band x={lo.x0 + lo.w * 2 + 10} y={lo.floor - 58} w={lo.w * 3 - 20} label="범용인공지능 (AGI) · 사람이 하는 대부분의 일" at={2.7} t={t} />
      <S04Band x={lo.x0 + lo.w * 5 + 10} y={lo.floor - 58} w={lo.w - 20} label="초인공지능 (ASI)" at={3.4} t={t} />

      {/* 깃발 넷 · 이름 + 근거 */}
      <S04Flag cx={cellCx(up, 4)} cellY={cellTop(up, 4)} top={18} side="left" w={340} name="AlphaGo · 좁음 4단계" why="바둑 한 가지 일에서 상위 1%를 넘음" color={up.color} at={4.2} t={t} />
      <S04Flag cx={cellCx(up, 5)} cellY={cellTop(up, 5)} top={50} side="right" w={370} name="AlphaFold · 좁음 5단계" why="단백질 구조 예측에서 모든 사람보다 나음" color={up.color} at={4.8} t={t} />
      <S04Flag cx={cellCx(lo, 1)} cellY={cellTop(lo, 1)} top={618} side="right" w={440} name="ChatGPT 계열 · 일반 1단계" why="여러 일을 두루, 하나하나는 미숙련 성인 수준" color={lo.color} at={5.4} t={t} />
      <S04Flag cx={cellCx(lo, 2)} cellY={cellTop(lo, 2)} top={540} side="right" w={470} name="아직 없음 · 일반 2단계 이상" why="여러 일에서 숙련 성인 절반을 넘는 것은 없음 (2023년 표)" color={lo.color} dashed at={6.0} t={t} />

      {/* 범례 */}
      <div style={{ ...abs(1530, 150, 330), ...card, padding: '18px 22px', boxSizing: 'border-box', ...riseIn(t, 0.4, 0.7) }}>
        <div style={{ ...kick, fontSize: 14 }}>읽는 법</div>
        {[
          ['칸', '성능 축 한 단계 (0~5)'],
          ['위 줄', '범위 축 「좁음」: 한 가지 일만'],
          ['아래 줄', '범위 축 「일반」: 여러 일을 두루'],
          ['앰버 띠', '흔히 쓰는 이름 (약 · 범용 · 초)'],
          ['깃발', '딥마인드 표의 예시 위치'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', gap: 10, marginTop: 8, fontSize: 19, lineHeight: 1.3, wordBreak: 'keep-all' }}>
            <span style={{ fontWeight: 800, color: 'var(--fg)', whiteSpace: 'nowrap' }}>{k}</span>
            <span style={{ color: 'var(--fg-muted)' }}>= {v}</span>
          </div>
        ))}
      </div>
      <div style={{ ...abs(110, 964, 1240), ...small, fontSize: 16, whiteSpace: 'nowrap' }}>출처: Morris 외, 「Levels of AGI」, arXiv 2311.02462 (2023 · 단계 이름은 2025 개정판) · 예시 위치는 2023년 표</div>
    </>
  );
}
function S04() {
  return (
    <Scene freezeAt={7} duration={7}>
      <S04Body />
    </Scene>
  );
}

/* ═══════════════════════ S05 · 도구에서 에이전트로 (build) ═══════════════════════ */
/* 화살 띠 중심선: (80,640) → (1700,480), 반높이 60 */
const s05Y = (x: number) => 640 - ((x - 80) * 160) / 1620;
const S05_ST = [400, 960, 1520];
function S05Box({ children, w = 96, tone = 'ink' }: { children: ReactNode; w?: number; tone?: 'ink' | 'green' | 'amber' }) {
  const col = tone === 'green' ? C.green : tone === 'amber' ? C.amber : 'var(--fg)';
  return (
    <div style={{ width: w, height: 44, boxSizing: 'border-box', borderRadius: 9, border: `2px solid ${col}`, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: col, whiteSpace: 'nowrap' }}>
      {children}
    </div>
  );
}
function S05Arrow({ w = 40, color = 'var(--fg-muted)', dashed }: { w?: number; color?: string; dashed?: boolean }) {
  return (
    <svg width={w} height={20} viewBox={`0 0 ${w} 20`} aria-hidden style={{ flex: 'none' }}>
      <line x1={2} y1={10} x2={w - 10} y2={10} stroke={color} strokeWidth={2.5} strokeDasharray={dashed ? '5 4' : undefined} />
      <path d={`M${w - 12} 4 L${w - 2} 10 L${w - 12} 16 Z`} fill={color} />
    </svg>
  );
}
function S05Station({ i, x, y, w, h = 300, label, gloss, ex, diagram, above }: { i: number; x: number; y: number; w: number; h?: number; label: string; gloss: string; ex: string; diagram: ReactNode; above: boolean }) {
  const cx = S05_ST[i];
  const cy = s05Y(cx);
  return (
    <Build at={i + 1} style={{ ...abs(0, 0, 0, 0), zIndex: 4 }}>
      {/* 정거장 점 + 연결선 */}
      <div style={{ ...abs(cx - 28, cy - 28, 56, 56), borderRadius: 28, background: C.green, color: 'var(--accent-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, ...mono, boxShadow: 'var(--glow)' }}>{i + 1}</div>
      <div style={{ ...abs(cx - 2, above ? y + h : cy + 28, 4, above ? cy - 28 - (y + h) : y - cy - 28), background: C.green, opacity: 0.6 }} />
      <div style={{ ...abs(x, y, w), minHeight: h, ...card, boxSizing: 'border-box', padding: '22px 26px', border: `1.5px solid color-mix(in srgb, ${C.green} 40%, var(--hair))` }}>
        <span style={pill(C.green, 26)}>{label}</span>
        <div style={{ ...body, fontSize: 21, color: 'var(--fg)', marginTop: 10, lineHeight: 1.35 }}>{gloss}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>{diagram}</div>
        <div style={{ ...small, fontSize: 18, marginTop: 12, color: 'var(--fg-muted)' }}>
          <span style={{ ...kick, fontSize: 13, marginRight: 8 }}>생활 예시</span>
          {ex}
        </div>
      </div>
    </Build>
  );
}
function S05() {
  return (
    <>
      <div style={{ ...abs(110, 56), ...kick }}>지금의 변화</div>
      <h2 style={{ ...abs(110, 84, 900), ...h2 }}>도구에서 에이전트로</h2>
      <div style={{ ...abs(110, 150, 1000), ...body, fontSize: 22 }}>시키는 대로 하는 도구에서, 목표를 주면 스스로 단계를 정하는 에이전트로 옮겨 간다.</div>

      {/* 화살 띠 · 화면 중앙을 통과하는 dominant */}
      <svg style={{ ...abs(0, 0, 1920, 1080), zIndex: 1 }} viewBox="0 0 1920 1080" aria-hidden>
        <path d="M80 580 L1700 420 L1700 360 L1850 480 L1700 600 L1700 540 L80 700 Z" fill={C.greenSoft} stroke={C.green} strokeWidth={2.5} strokeLinejoin="round" />
        <path d="M120 640 L1660 480" stroke={C.green} strokeWidth={2} strokeDasharray="10 12" opacity={0.45} />
        {S05_ST.map((x) => (
          <circle key={x} cx={x} cy={s05Y(x)} r={22} fill="var(--surface-2)" stroke={C.green} strokeWidth={2.5} />
        ))}
      </svg>

      <S05Station
        i={0}
        x={160}
        y={200}
        w={460}
        above
        label="도구"
        gloss="한 번 부르면 한 번 답한다. 부를 때만 일한다."
        ex="번역 한 번 · 챗봇에 질문 하나"
        diagram={
          <>
            <S05Box>부름</S05Box>
            <S05Arrow />
            <S05Box tone="green">인공지능</S05Box>
            <S05Arrow />
            <S05Box>답 하나</S05Box>
          </>
        }
      />
      <S05Station
        i={1}
        x={740}
        y={660}
        w={550}
        h={310}
        above={false}
        label="워크플로"
        gloss="사람이 미리 정한 순서대로 인공지능을 여러 번 부른다."
        ex="사진 고르기 → 자막 달기 → 올리기, 순서는 내가 정함"
        diagram={
          <>
            <span style={{ ...solidPill(C.amber, C.ink, 15), marginRight: 4 }}>순서: 사람이 정함</span>
            <S05Box w={92} tone="green">고르기</S05Box>
            <S05Arrow color={C.amber} w={34} />
            <S05Box w={92} tone="green">자막</S05Box>
            <S05Arrow color={C.amber} w={34} />
            <S05Box w={92} tone="green">올리기</S05Box>
          </>
        }
      />
      <S05Station
        i={2}
        x={1290}
        y={90}
        w={520}
        h={350}
        above
        label="에이전트"
        gloss="목표를 주면 인공지능이 스스로 다음 단계와 쓸 도구를 정한다."
        ex="「여행 계획 짜 줘」 한마디에 검색 · 비교 · 예약을 스스로"
        diagram={
          <>
            <S05Box w={110} tone="green">에이전트</S05Box>
            <S05Arrow color={C.green} dashed w={34} />
            <S05Box w={72}>검색</S05Box>
            <S05Arrow color={C.green} dashed w={34} />
            <S05Box w={72}>비교</S05Box>
            <S05Arrow color={C.green} dashed w={34} />
            <S05Box w={72}>예약</S05Box>
            <span style={{ ...small, fontSize: 15, width: '100%', color: C.green }}>점선 화살: 인공지능이 스스로 그린 길</span>
          </>
        }
      />

      {/* at=4 · 앞으로 */}
      <Build at={4} style={{ ...abs(1300, 650, 520), zIndex: 4 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <span style={solidPill(C.amber, C.ink, 24)}>앞으로</span>
          <div style={{ ...body, fontSize: 24, color: 'var(--fg)', fontWeight: 600, lineHeight: 1.35 }}>
            맡기는 일이 점점 길어진다.
            <br />
            그래서 「무엇을 어디까지 맡길지」 정하는 사람이 중요해진다.
          </div>
        </div>
      </Build>

      <div style={{ ...abs(110, 1010), ...small, fontSize: 17 }}>구분의 출처: Anthropic, 「Building effective agents」, 2024</div>
    </>
  );
}

/* ═══════════════════════ S06 · 손잡이와 과녁 (scene + svg) ═══════════════════════ */
/* 목표 0.5, 오차의 60%씩 이동. 화면 숫자는 이 계산값 그대로 */
const S06_W0 = 0.2, S06_TARGET = 0.5, S06_RATE = 0.6;
const S06_W = (() => {
  const w = [S06_W0];
  for (let i = 0; i < 3; i++) w.push(w[i] + S06_RATE * (S06_TARGET - w[i]));
  return w; // 0.20 · 0.38 · 0.452 · 0.4808
})();
const S06_FIRE = [0.7, 3.0, 6.0];
const S06_ADJ: [number, number][] = [
  [1.5, 2.5],
  [4.0, 5.5],
  [7.0, 7.9],
];
const S06_CX = 1340, S06_CY = 500, S06_R = 310, S06_K = 900; // 가중치 1 = 900px
function s06W(t: number) {
  let w = S06_W[0];
  S06_ADJ.forEach(([a, b], k) => {
    w = t < a ? w : lerp(S06_W[k], S06_W[k + 1], clamp01(interpolate(t, [a, b], [0, 1], easeInOut)));
  });
  return w;
}
function s06Phase(t: number) {
  // 0 쏜다 · 1 오차 확인 · 2 가중치 조정 · 3 반복
  for (let k = 0; k < 3; k++) {
    if (t < S06_FIRE[k] - 0.3) return k === 0 ? 0 : 3;
    if (t < S06_FIRE[k] + 0.3) return 0;
    if (t < S06_ADJ[k][0]) return 1;
    if (t < S06_ADJ[k][1]) return 2;
  }
  return 3;
}
function S06Body() {
  const t = useSceneTime();
  const w = s06W(t);
  const off = (w - S06_TARGET) * S06_K;
  const phase = s06Phase(t);
  const rings = [S06_R, 248, 186, 124, 62];
  const done = spring(t, 7.9, 0.7);
  return (
    <>
      <div style={{ ...abs(110, 56), ...kick }}>학습의 정의</div>
      <h2 style={{ ...abs(110, 84, 900), ...h2 }}>배운다는 것은 손잡이를 돌리는 것</h2>

      {/* 국면 띠 · 학습 순환 */}
      <div style={{ ...abs(1010, 92, 860), display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        {['쏜다 (데이터)', '오차 확인', '가중치 조정', '반복'].map((p, i) => (
          <span key={p} style={{ ...pill(i === phase ? C.amber : 'var(--fg-faint)', 19), opacity: i === phase ? 1 : 0.6 }}>
            {p}
          </span>
        ))}
      </div>

      {/* ── 왼쪽 밴드: 모델 상자 + 슬라이더 ── */}
      <Term term="모델" gloss="입력을 받아 출력을 내는 계산 장치. 안에 숫자(가중치)가 들어 있다." size={26} style={{ ...abs(110, 200, 560) }} />
      <div style={{ ...abs(110, 316, 540, 236), ...card, boxSizing: 'border-box', padding: '20px 30px', border: `2.5px solid ${C.green}` }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <span style={pill(C.green, 20)}>가중치</span>
          <span style={{ ...small, fontSize: 18 }}>모델 안에서 조절 가능한 숫자</span>
        </div>
        <div style={{ ...mono, fontSize: 96, fontWeight: 800, lineHeight: 1.05, color: C.green, marginTop: 10, letterSpacing: '-0.02em' }}>
          w = {w.toFixed(2)}
        </div>
        <div style={{ ...small, fontSize: 18, marginTop: 4 }}>학습이 바꾸는 것은 바로 이 숫자</div>
      </div>
      {/* 손그림 슬라이더 (svg-asset-builder · viewBox 0 0 400 160) */}
      <img src={SVG.knob} alt="슬라이더 손잡이" style={{ ...abs(120, 580, 520, 208), objectFit: 'contain' }} />
      {/* 코드로 그린 눈금 다이얼: 손잡이 위치 = w */}
      <svg style={{ ...abs(120, 792, 520, 70) }} viewBox="0 0 520 70" aria-hidden>
        <line x1={20} y1={20} x2={500} y2={20} stroke="var(--fg-faint)" strokeWidth={2} />
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <line key={v} x1={20 + v * 480} y1={12} x2={20 + v * 480} y2={28} stroke="var(--fg-faint)" strokeWidth={2} />
        ))}
        <text x={20} y={52} fontSize={17} fill="var(--fg-muted)" textAnchor="middle" fontFamily="var(--font-mono)">0</text>
        <text x={500} y={52} fontSize={17} fill="var(--fg-muted)" textAnchor="middle" fontFamily="var(--font-mono)">1</text>
        <text x={260} y={52} fontSize={17} fill={C.green} fontWeight={800} textAnchor="middle">0.5 (명중)</text>
        <g transform={`translate(${20 + w * 480} 0)`}>
          <path d="M-11 -2 L11 -2 L0 16 Z" fill={C.amber} />
          <line x1={0} y1={-30} x2={0} y2={-2} stroke={C.amber} strokeWidth={4} strokeLinecap="round" />
        </g>
      </svg>

      {/* ── 오른쪽 밴드: 과녁 ── */}
      <svg style={{ ...abs(0, 0, 1920, 1080) }} viewBox="0 0 1920 1080" aria-hidden>
        {rings.map((r, i) => (
          <circle key={r} cx={S06_CX} cy={S06_CY} r={r} fill={i % 2 === 0 ? 'var(--surface-2)' : C.redSoft} stroke="var(--hair)" strokeWidth={2} />
        ))}
        <line x1={S06_CX - S06_R} y1={S06_CY} x2={S06_CX + S06_R} y2={S06_CY} stroke="var(--hair)" strokeWidth={1.5} />
        <line x1={S06_CX} y1={S06_CY - S06_R} x2={S06_CX} y2={S06_CY + S06_R} stroke="var(--hair)" strokeWidth={1.5} />

        {/* 명중 자국 + 오차 선 */}
        {S06_FIRE.map((f, k) => {
          const s = spring(t, f, 0.5);
          if (s <= 0) return null;
          const hx = S06_CX + (S06_W[k] - S06_TARGET) * S06_K;
          const err = S06_TARGET - S06_W[k];
          const lineK = interpolate(t, [f + 0.25, f + 0.75], [0, 1], easeOut);
          const old = k < 2 && t > S06_FIRE[k + 1] ? 0.35 : 1;
          const pulse = clamp01((t - f) / 0.6);
          return (
            <g key={f} opacity={old}>
              <circle cx={hx} cy={S06_CY} r={14 + pulse * 46} fill="none" stroke={C.red} strokeWidth={3} opacity={(1 - pulse) * 0.8} />
              <line x1={hx} y1={S06_CY} x2={hx + (S06_CX - hx) * lineK} y2={S06_CY} stroke={C.amber} strokeWidth={6} strokeLinecap="round" />
              {lineK > 0.2 && (
                <>
                  <text x={hx} y={S06_CY - 60 - k * 38} fontSize={24} fontWeight={800} fill={C.amber} textAnchor="middle">
                    오차 {err.toFixed(2)}
                  </text>
                  <line x1={hx} y1={S06_CY - 52 - k * 38} x2={hx} y2={S06_CY - 16} stroke={C.amber} strokeWidth={2} opacity={0.55} />
                </>
              )}
              <circle cx={hx} cy={S06_CY} r={13 * s} fill={C.red} stroke={C.paper} strokeWidth={3} />
              <text x={hx} y={S06_CY + 46} fontSize={22} fontWeight={800} fill={C.red} textAnchor="middle" fontFamily="var(--font-mono)">
                {k + 1}
              </text>
            </g>
          );
        })}

        {/* 조준점: 현재 가중치가 가리키는 자리 */}
        {(() => {
          const near = S06_FIRE.reduce((m, f) => Math.min(m, Math.abs(t - f)), 9);
          const sc = 1 + Math.max(0, 0.3 - near) * 1.2;
          return (
            <g transform={`translate(${S06_CX + off} ${S06_CY}) scale(${sc})`} opacity={1 - done * 0.8}>
              <circle r={36} fill="none" stroke="var(--fg)" strokeWidth={3} />
              <line x1={-52} y1={0} x2={-20} y2={0} stroke="var(--fg)" strokeWidth={3} />
              <line x1={20} y1={0} x2={52} y2={0} stroke="var(--fg)" strokeWidth={3} />
              <line x1={0} y1={-52} x2={0} y2={-20} stroke="var(--fg)" strokeWidth={3} />
              <line x1={0} y1={20} x2={0} y2={52} stroke="var(--fg)" strokeWidth={3} />
            </g>
          );
        })()}
        {/* 정착: 가운데 초록 점 */}
        <circle cx={S06_CX} cy={S06_CY} r={20 * done} fill={C.green} stroke={C.paper} strokeWidth={4} />
      </svg>
      <div style={{ ...abs(S06_CX - 90, S06_CY - S06_R - 46, 180), textAlign: 'center', ...kick, opacity: interpolate(t, [0, 0.4], [0, 1]) }}>과녁 · 목표</div>
      <Term term="오차" gloss="빗나간 정도. 목표와 실제 출력의 차이" size={20} style={{ ...abs(1050, 826, 520), opacity: interpolate(t, [S06_FIRE[0] + 0.3, S06_FIRE[0] + 0.8], [0, 1]) }} />

      {/* ── 아래 밴드: 정의 문장 ── */}
      <div style={{ ...abs(110, 910, 1700), ...riseIn(t, 8.0, 0.9, 22) }}>
        <div style={{ ...h3, fontSize: 36, color: 'var(--fg)' }}>
          <span style={{ color: C.green }}>학습</span>: 데이터를 보고 오차만큼 가중치를 고쳐, 다음에 덜 틀리게 되는 것
        </div>
      </div>
    </>
  );
}
function S06() {
  return (
    <Scene freezeAt={9} duration={9}>
      <S06Body />
    </Scene>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   7~13장 · 학습의 역사 (옛 slides-b.tsx)
   ══════════════════════════════════════════════════════════════════════ */

/* ── slides-b · 7~13장 학습의 역사 구간 ────────────────────────────────
   plan.md Slide 7~13 블록이 단일 진실 원천. 모든 좌표는 1920×1080 설계 박스 px.
   7  규칙 기반(scene + svg 클립보드)      8  기계학습 다리(build + live)
   9  퍼셉트론(build, 뉴런 위 트레이싱)     10 XOR·층 쌓기(scene + build + live)
   11 역전파(scene, 숫자는 실제 계산)      12 딥러닝(build)      13 세 시대(static + live) */

/* ── 로컬 헬퍼 (shared는 수정하지 않는다) ── */
const PHOTO = (kind: '치와와' | '머핀' | '시험', n: number) =>
  `${DATASET_DIR}/${kind}/${kind}_${String(n).padStart(2, '0')}.jpg`;

function Head({ kicker, title, width = 1020 }: { kicker: string; title: ReactNode; width?: number }) {
  return (
    <>
      <div style={{ ...abs(110, 64), ...kick }}>{kicker}</div>
      <h2 style={{ ...abs(110, 98, width), ...h2, fontSize: 46 }}>{title}</h2>
    </>
  );
}

function Photo({
  src, x, y, w, h, rot = 0, children, style, alt = '',
}: { src: string; x: number; y: number; w: number; h: number; rot?: number; children?: ReactNode; style?: CSSProperties; alt?: string }) {
  return (
    <div
      style={{
        ...abs(x, y, w, h),
        background: 'var(--surface-2)',
        border: '1px solid var(--hair)',
        borderRadius: 12,
        padding: 8,
        boxSizing: 'border-box',
        boxShadow: '0 14px 34px -20px rgba(29,42,38,0.5)',
        transform: `rotate(${rot}deg)`,
        ...style,
      }}
    >
      <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6, display: 'block' }} />
      {children}
    </div>
  );
}

const Credit = ({ x, y }: { x: number; y: number }) => (
  <div style={{ ...abs(x, y), ...small, fontSize: 15 }}>사진: CC0 · Openverse</div>
);

/** 도형 가장자리에서 시작·종료하는 화살표 (r1·r2 = 양 끝 도형 반지름). 화살촉은 실제 방향 벡터로 회전 */
function arrowPath(x1: number, y1: number, x2: number, y2: number, r1 = 0, r2 = 0, head = 14) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
  const sx = x1 + ux * r1, sy = y1 + uy * r1, ex = x2 - ux * r2, ey = y2 - uy * r2;
  const a = Math.atan2(ey - sy, ex - sx);
  return {
    line: `M${sx},${sy} L${ex},${ey}`,
    head: `M${ex},${ey} L${ex - head * Math.cos(a - 0.48)},${ey - head * Math.sin(a - 0.48)} L${ex - head * Math.cos(a + 0.48)},${ey - head * Math.sin(a + 0.48)} Z`,
    sx, sy, ex, ey,
  };
}

const liveKick: CSSProperties = { ...kick, color: C.amber, fontSize: 15, letterSpacing: '0.1em', textTransform: 'none' };

/* ═══════════════════════════════════════════════════════════════════════
   S07 · 옛날 방식: 사람이 규칙을 전부 쓴다 (scene + svg 클립보드)
   메타포: 급식실 검표대의 체크리스트. 규칙표가 종이를 타고 끝없이 늘어난다
   ═══════════════════════════════════════════════════════════════════════ */
const RULES = [
  '만약 귀가 뾰족하면 → 치와와',
  '만약 종이컵에 담겨 있으면 → 머핀',
  '만약 갈색 점이 둘이면 → 머핀',
  '만약 털이 보이면 → 치와와',
  '만약 접시 위에 있으면 → 머핀',
  '만약 귀가 접혀 있으면 → 치와와',
  '만약 표면이 울퉁불퉁하면 → 머핀',
  '만약 코가 까맣게 반짝이면 → 치와와',
  '만약 점 둘이 눈처럼 보이면 → 치와와',
  '만약 위가 둥글게 부풀었으면 → 머핀',
  '만약 다리가 보이면 → 치와와',
  '만약 컵이 없어도 갈색이면 → 머핀',
];
const RULE_T = RULES.map((_, i) => (i === 0 ? 0 : i === 1 ? 1.0 : 3.5 + (i - 2) * 0.22));
const RULE_D = (i: number) => (i < 2 ? 0.85 : 0.18);
/* 클립보드 svg(viewBox 520×760)를 (170,140)에 640×935로 두었을 때 종이 위 글줄 자리.
   svg가 이미 체크 칸 12개(화면 x 320~379)와 안내선 12줄(x 401~670)을 그려 두었으므로
   번호는 칸 왼쪽, 글줄은 칸 오른쪽에 앉힌다. 겹치면 「만약」이 칸에 가려진다. */
const PAPER = { x: 282, y0: 350, rowH: 52, w: 470 };
const RULE_TEXT_X = 110; // PAPER.x 기준 글줄 시작 (= 화면 392)

function ClipboardScene() {
  const t = useSceneTime();
  const rng = mulberry32(7);
  const tilt = RULES.map(() => (rng() - 0.5) * 1.2);
  const cx = interpolate(t, [2, 2.6], [1960, 1490], easeOut); // 끼어드는 사진
  const y3 = PAPER.y0 + 2 * PAPER.rowH + PAPER.rowH / 2;
  const y9 = PAPER.y0 + 8 * PAPER.rowH + PAPER.rowH / 2;
  const bx = PAPER.x + PAPER.w + 8;
  const clashK = spring(t, 6, 0.7);
  const Check = ({ at }: { at: number }) => {
    const s = spring(t, at, 0.5);
    return (
      <div style={{ position: 'absolute', right: -16, top: -16, width: 46, height: 46, borderRadius: 999, background: C.green, color: 'var(--accent-ink)', display: 'grid', placeItems: 'center', fontSize: 26, fontWeight: 900, transform: `scale(${s})`, boxShadow: 'var(--glow)' }}>✓</div>
    );
  };
  return (
    <>
      {/* 클립보드(다른 담당자 svg) · 종이가 화면 아래로 잘려 나간다 */}
      <img src={SVG.clipboard} alt="" style={{ ...abs(170, 140, 640, 863), objectFit: 'fill' }} />
      {RULES.map((r, i) => {
        const k = clamp01((t - RULE_T[i]) / RULE_D(i));
        if (k <= 0) return null;
        const n = Math.ceil(k * r.length);
        const blink = i === 0 && t > 2.6 && t < 3.4 && Math.sin(t * 26) > 0;
        const clash = t >= 6 && (i === 2 || i === 8);
        const color = clash ? C.red : blink ? C.amber : C.ink;
        return (
          <div key={i} style={{ ...abs(PAPER.x, PAPER.y0 + i * PAPER.rowH, PAPER.w, PAPER.rowH), transform: `rotate(${tilt[i]}deg)` }}>
            {/* 번호 — 체크 칸 왼쪽 여백 */}
            <span style={{ position: 'absolute', left: 0, top: 0, width: 34, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', ...mono, fontSize: 17, color: clash ? C.red : 'var(--fg-faint)' }}>{i + 1}.</span>
            {/* 규칙 — 체크 칸 오른쪽, 종이 안에서 끝난다 */}
            <span style={{ position: 'absolute', left: RULE_TEXT_X, top: 0, height: '100%', display: 'flex', alignItems: 'center', gap: 8, fontSize: 19, fontWeight: 700, color, fontFamily: 'var(--font-head)', whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}>
              {r.slice(0, n)}
              {i === 0 && t > 2.6 && t < 3.6 && <span style={{ ...pill(C.amber, 16) }}>귀?</span>}
            </span>
          </div>
        );
      })}
      {/* 규칙 3 ↔ 규칙 9 충돌 */}
      <svg style={{ ...abs(0, 0, 1920, 1080), pointerEvents: 'none', opacity: clashK }} viewBox="0 0 1920 1080">
        <path d={`M${bx},${y3} C${bx + 90},${y3} ${bx + 90},${y9} ${bx},${y9}`} fill="none" stroke={C.red} strokeWidth={3.5} strokeDasharray="9 7" />
        <circle cx={bx} cy={y3} r={6} fill={C.red} />
        <circle cx={bx} cy={y9} r={6} fill={C.red} />
      </svg>
      <div style={{ ...abs(bx + 84, (y3 + y9) / 2 - 44, 300), opacity: clashK, transform: `translateX(${(1 - clashK) * -16}px)` }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.red, wordBreak: 'keep-all' }}>규칙 3과 규칙 9가 부딪힘</div>
        <div style={{ ...small, fontSize: 17, marginTop: 4 }}>3번은 머핀이라 하고 9번은 치와와라 한다</div>
      </div>

      {/* 오른쪽 사진 밴드 */}
      <Photo src={PHOTO('시험', 4)} x={1160} y={235} w={300} h={250} rot={-1.5} alt="치와와">
        <Check at={0.85} />
      </Photo>
      <Photo src={PHOTO('머핀', 11)} x={1160} y={560} w={300} h={250} rot={1.2} alt="종이컵에 담긴 머핀">
        <Check at={1.85} />
      </Photo>
      <Photo src={PHOTO('머핀', 39)} x={cx} y={395} w={300} h={250} rot={4} alt="점 둘이 눈처럼 보이는 머핀">
        {/* 규칙 1이 오판: 「치와와」 도장 → 빨간 X */}
        <div style={{ position: 'absolute', left: -14, top: -14, transform: `scale(${spring(t, 2.7, 0.5)})`, ...pill(C.amber, 20), background: C.paper }}>귀?</div>
        <div style={{ position: 'absolute', left: 60, top: 92, padding: '6px 18px', border: `4px solid ${C.amber}`, borderRadius: 10, color: C.amber, fontSize: 34, fontWeight: 900, background: 'rgba(244,239,228,0.85)', transform: `rotate(-12deg) scale(${spring(t, 3.1, 0.45)})`, letterSpacing: '0.04em' }}>치와와</div>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 190, fontWeight: 900, color: C.red, lineHeight: 1, opacity: 0.85 * spring(t, 3.45, 0.4), transform: `scale(${0.6 + 0.4 * spring(t, 3.45, 0.4)})` }}>✕</div>
      </Photo>
      <Credit x={1160} y={838} />
      <div style={{ ...abs(1160, 882, 660), fontSize: 27, fontWeight: 800, color: C.ink, wordBreak: 'keep-all', lineHeight: 1.35, ...riseIn(t, 6.4, 0.8, 18) }}>
        예외마다 규칙이 하나 더. <span style={{ color: C.red }}>사람이 감당하지 못한다.</span>
      </div>
    </>
  );
}

function S07() {
  return (
    <Scene freezeAt={7.2} duration={7.5} markers={[{ time: 0, label: '규칙 1·2' }, { time: 2, label: '예외' }, { time: 3.5, label: '규칙이 불어남' }, { time: 6, label: '충돌' }]}>
      <Head kicker="학습의 역사 ① · 1950~1980년대의 주류" title="옛날 방식: 사람이 규칙을 전부 쓴다" />
      <Term style={{ ...abs(1160, 92, 640) }} term="규칙 기반 (전문가 시스템)" gloss="사람 전문가의 지식을 '만약 A이면 B' 규칙으로 적어 넣은 프로그램" />
      <ClipboardScene />
    </Scene>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   S08 · 규칙을 쓰지 말고, 예시를 보여 주자 (build + live)
   대각선 구도: 왼쪽 위 작은 「옛날」이 물러나고 오른쪽 아래 사진 더미와 「모델」이 커진다
   ═══════════════════════════════════════════════════════════════════════ */
const PILE: Array<['치와와' | '머핀', number]> = [
  ['치와와', 17], ['머핀', 27], ['치와와', 22], ['머핀', 60], ['치와와', 25], ['머핀', 42], ['치와와', 32], ['머핀', 20],
];
const FEATS = [
  { name: '귀 뾰족함', w: 0.8 },
  { name: '갈색 정도', w: 0.5 },
  { name: '둥근 정도', w: -0.7 },
];

function Knob({ value, on }: { value: number; on: boolean }) {
  const ang = -120 + ((value + 1) / 2) * 240; // -1 → -120°, +1 → +120°
  return (
    <div style={{ width: 62, height: 62, borderRadius: 999, border: `2.5px ${on ? 'solid' : 'dashed'} ${on ? C.green : 'var(--fg-faint)'}`, position: 'relative', background: on ? C.greenSoft : 'transparent', transition: 'all .5s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', left: 28, top: 6, width: 4, height: 26, borderRadius: 2, background: C.green, transformOrigin: '2px 25px', transform: `rotate(${on ? ang : 0}deg)`, opacity: on ? 1 : 0, transition: 'all .6s' }} />
      <div style={{ position: 'absolute', left: 26, top: 26, width: 10, height: 10, borderRadius: 999, background: on ? C.green : 'var(--fg-faint)' }} />
    </div>
  );
}

function S08() {
  const { clicks } = useDeck();
  const rng = mulberry32(8);
  /* 더미 오른쪽 끝(i=7: x 1074+230=1304)이 「모델」 카드(x 1330)를 침범하지 않게 잡은 값 */
  const pile = PILE.map((p, i) => ({ src: PHOTO(p[0], p[1]), x: 556 + i * 74 + (rng() - 0.5) * 26, y: 386 + i * 44 + (rng() - 0.5) * 26, s: 132 + i * 14, rot: (rng() - 0.5) * 16 }));
  const on = clicks >= 1;
  const arrow = arrowPath(1228, 676, 1330, 676, 0, 0, 16);
  return (
    <>
      <Head kicker="학습의 역사 ② · 방향을 바꾼다" title="규칙을 쓰지 말고, 예시를 보여 주자" />
      <Build at={1} style={{ ...abs(1160, 92, 640) }}>
        <Term term="기계학습" gloss="데이터에서 규칙(패턴)을 컴퓨터가 스스로 찾아내는 방식" />
      </Build>

      {/* 왼쪽 위 · 옛날: 사람이 규칙을 쓴다 (클릭 1에 물러남) */}
      <div style={{ ...abs(130, 230, 440, 250), opacity: on ? 0.32 : 1, filter: on ? 'grayscale(1)' : 'none', transition: 'all .7s' }}>
        <svg width={440} height={190} viewBox="0 0 440 190">
          {/* 추상 픽토그램 사람 */}
          <circle cx={60} cy={40} r={22} fill={C.amber} />
          <path d="M22,140 C22,90 98,90 98,140 L98,168 L22,168 Z" fill={C.amber} />
          <path d="M98,110 L150,96" stroke={C.amber} strokeWidth={12} strokeLinecap="round" />
          {/* 규칙 종이 */}
          <rect x={160} y={20} width={250} height={160} rx={10} fill="var(--surface-2)" stroke="var(--hair)" />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={182} y={44 + i * 26} width={i === 4 ? 120 : 206 - i * 18} height={10} rx={5} fill={i === 4 ? C.amber : 'var(--hair)'} />
          ))}
          <text x={182} y={36} fontSize={13} fontWeight={800} fill="var(--fg-muted)">만약 …이면 …이다</text>
        </svg>
        <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>옛날: 사람이 규칙을 쓴다</div>
        <div style={{ ...small, fontSize: 17 }}>예외마다 규칙이 하나 더</div>
      </div>

      {/* 왼쪽 아래 · 사람이 하는 일이 바뀐다 (클릭 2) */}
      <Build at={2} style={{ ...abs(130, 560, 440) }}>
        <div style={{ ...h3, fontSize: 28 }}>사람이 하는 일이 바뀐다</div>
        <div style={{ ...body, fontSize: 21, marginTop: 10 }}>
          <span style={{ textDecoration: 'line-through', color: 'var(--fg-faint)' }}>규칙 쓰기</span> → 예시 모으기 + 무엇을 볼지(특징) 정하기
        </div>
      </Build>
      <Build at={1} style={{ ...abs(130, 900, 500) }}>
        <div style={liveKick}>라이브 · 주관식 · 정답 없음 · 치와와와 머핀을 가르는 규칙을 한 줄로</div>
      </Build>

      {/* 오른쪽 아래 · 사진 더미 (클릭 1에 커진다) */}
      {pile.map((p, i) => (
        <Photo key={i} src={p.src} x={p.x} y={p.y} w={p.s} h={p.s} rot={p.rot} style={{ transform: `rotate(${p.rot}deg) scale(${on ? 1.12 : 0.96})`, transformOrigin: '100% 100%', opacity: on ? 1 : 0.8, transition: 'all .7s', zIndex: i }} />
      ))}
      <div style={{ ...abs(640, 942, 520), fontSize: 18, fontWeight: 700, color: 'var(--fg-muted)' }}>예시 155장 · 치와와 83 · 머핀 72</div>
      <Credit x={640} y={968} />

      {/* 더미 → 모델 화살표 (클릭 2) */}
      <Build at={2} style={{ ...abs(0, 0, 1920, 1080), pointerEvents: 'none', zIndex: 11 }}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080">
          <path d={arrow.line} stroke={C.green} strokeWidth={5} fill="none" />
          <path d={arrow.head} fill={C.green} />
        </svg>
      </Build>

      {/* 「모델」 상자 — 사진 더미(zIndex 0~7)보다 위 */}
      <div style={{ ...abs(1330, 440, 480, 440), zIndex: 12, ...card, padding: '22px 26px', boxSizing: 'border-box', border: `2px solid ${on ? C.green : 'var(--hair)'}`, transition: 'border .6s' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <div style={{ ...h3, fontSize: 34, color: C.green }}>모델</div>
          <div style={{ ...small, fontSize: 16 }}>예시에서 찾아낸 규칙을 담는 곳</div>
        </div>
        {clicks < 2 && <div style={{ ...abs(0, 110, 480, 260), display: 'grid', placeItems: 'center', fontSize: 120, fontWeight: 900, color: 'var(--hair)' }}>?</div>}
      </div>
      <Build at={2} style={{ ...abs(1356, 520, 430), zIndex: 13 }}>
        <Term term="특징" gloss="사진에서 재는 값" size={18} />
        <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
          {FEATS.map((f, i) => (
            <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ ...mono, fontSize: 17, color: 'var(--fg-faint)', width: 26 }}>w{i + 1}</div>
              <div style={{ fontSize: 23, fontWeight: 800, width: 150 }}>{f.name}</div>
              <Knob value={f.w} on={clicks >= 3} />
              <div style={{ ...mono, fontSize: 30, fontWeight: 800, color: f.w < 0 ? C.red : C.green, opacity: clicks >= 3 ? 1 : 0, transition: 'opacity .6s' }}>{f.w > 0 ? f.w.toFixed(1) : f.w.toFixed(1)}</div>
            </div>
          ))}
        </div>
      </Build>
      <Build at={3} style={{ ...abs(1356, 800, 430), zIndex: 13 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.green, wordBreak: 'keep-all' }}>찾아낸 규칙은 말이 아니라 숫자다</div>
        <div style={{ ...small, fontSize: 16, marginTop: 2 }}>특징마다 '얼마나 믿을지' · 6장의 손잡이가 이것</div>
      </Build>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   S09 · 뉴런을 흉내 낸 계산기, 퍼셉트론 (build)
   neuron.png(1878×960) 위에 트레이싱 종이처럼 퍼셉트론 도식을 겹친다
   ═══════════════════════════════════════════════════════════════════════ */
const NEU = { x: 40, y: 240, w: 1400, h: 716 }; // 가지돌기 왼쪽 → 세포체 (25%,48%) → 축삭 → 말단 오른쪽
const SOMA = { x: 392, y: 584, r: 100 };
const INPUTS = [
  { x: 176, y: 318, r: 40 },
  { x: 118, y: 548, r: 40 },
  { x: 236, y: 846, r: 40 },
];
const OUT = { x: 1220, y: 548, w: 200, h: 80 };
const W9 = [0.8, 0.5, -0.7];
const B9 = -0.4;

function S09() {
  const { clicks } = useDeck();
  const vals = clicks >= 4 ? [0, 1, 1] : [1, 1, 1];
  const sum = vals.reduce((a, v, i) => a + v * W9[i], 0);
  const z = sum + B9;
  const out = z > 0 ? 1 : 0;
  const lines = INPUTS.map((p) => arrowPath(p.x, p.y, SOMA.x, SOMA.y, p.r + 2, SOMA.r + 2, 12));
  const axon = arrowPath(SOMA.x, SOMA.y, OUT.x, OUT.y + OUT.h / 2, SOMA.r + 2, 0, 14);
  const calc = (v: number[]) => {
    const s = v.reduce((a, x, i) => a + x * W9[i], 0);
    const zz = s + B9;
    return { s, zz, o: zz > 0 ? 1 : 0 };
  };
  const A = calc([1, 1, 1]), Bc = calc([0, 1, 1]);
  const fmt = (n: number) => (n < 0 ? `(${n.toFixed(1)})` : n.toFixed(1));
  return (
    <>
      <Head kicker="학습의 역사 ③ · 로젠블랫 1957~1958" title="뉴런을 흉내 낸 계산기, 퍼셉트론" />
      <Term style={{ ...abs(1160, 92, 700) }} term="퍼셉트론" gloss="입력×가중치를 모두 더하고(가중합) 편향을 더해, 0보다 크면 1, 아니면 0을 내는 계산 장치" />

      <img src={IMG.neuron} alt="뉴런: 가지돌기 · 세포체 · 축삭" style={{ ...abs(NEU.x, NEU.y, NEU.w, NEU.h), objectFit: 'contain' }} />
      {clicks < 1 && (
        <>
          <div style={{ ...abs(70, 930, 200), ...kick, fontSize: 15 }}>가지돌기 · 신호를 받는다</div>
          <div style={{ ...abs(330, 700, 200), ...kick, fontSize: 15 }}>세포체 · 합친다</div>
          <div style={{ ...abs(900, 470, 300), ...kick, fontSize: 15 }}>축삭 · 문턱을 넘으면 보낸다</div>
        </>
      )}

      {/* 트레이싱 종이: 퍼셉트론 도식 */}
      <Build at={1} style={{ ...abs(0, 0, 1920, 1080), pointerEvents: 'none' }}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080">
          {lines.map((l, i) => (
            <g key={i}>
              <path d={l.line} stroke={C.green} strokeWidth={4} fill="none" />
              <path d={l.head} fill={C.green} />
            </g>
          ))}
          <path d={axon.line} stroke={C.green} strokeWidth={5} fill="none" strokeDasharray="14 10" />
          <path d={axon.head} fill={C.green} />
          <circle cx={SOMA.x} cy={SOMA.y} r={SOMA.r} fill="rgba(255,255,255,0.62)" stroke={C.green} strokeWidth={4} strokeDasharray="10 8" />
          {INPUTS.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="rgba(255,255,255,0.8)" stroke={C.green} strokeWidth={3.5} />
          ))}
        </svg>
        {INPUTS.map((p, i) => (
          <div key={i} style={{ ...abs(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2), display: 'grid', placeItems: 'center', ...mono, fontSize: 26, fontWeight: 800, color: C.ink }}>
            {clicks >= 3 ? vals[i] : `x${i + 1}`}
          </div>
        ))}
        <div style={{ ...abs(SOMA.x - 90, SOMA.y - 34, 180, 68), display: 'grid', placeItems: 'center', textAlign: 'center', fontSize: 24, fontWeight: 800, color: C.green, lineHeight: 1.15 }}>가중합<br />+ 편향</div>
        <div style={{ ...abs(80, 236, 260), ...kick, fontSize: 15, color: C.green }}>입력 · 재어 온 특징 값</div>
        <div style={{ ...abs(OUT.x, OUT.y, OUT.w, OUT.h), ...card, border: `3px solid ${C.green}`, display: 'grid', placeItems: 'center', fontSize: 26, fontWeight: 800, color: clicks >= 3 ? (out === 1 ? C.green : C.red) : C.ink, boxSizing: 'border-box' }}>
          {clicks >= 3 ? `${out} · ${out === 1 ? '치와와' : '머핀'}` : '출력'}
        </div>
        <div style={{ ...abs(OUT.x, OUT.y + OUT.h + 10), ...kick, fontSize: 15, color: C.green, background: 'color-mix(in srgb, var(--bg) 88%, transparent)', padding: '5px 10px', borderRadius: 8, whiteSpace: 'nowrap' }}>출력 · 문턱을 넘으면 1</div>
      </Build>

      {/* 가중치 칩 + 편향 */}
      <Build at={2} style={{ ...abs(0, 0, 1920, 1080), pointerEvents: 'none' }}>
        {lines.map((l, i) => {
          const mx = lerp(l.sx, l.ex, 0.55), my = lerp(l.sy, l.ey, 0.55);
          const dx = l.ex - l.sx, dy = l.ey - l.sy, L = Math.hypot(dx, dy);
          const nx = -dy / L, ny = dx / L;
          const side = i === 2 ? -1 : 1;
          return (
            <div key={i} style={{ ...abs(mx + nx * 36 * side - 60, my + ny * 36 * side - 22, 120, 44), ...card, borderRadius: 999, border: `2px solid ${W9[i] < 0 ? C.red : C.green}`, display: 'grid', placeItems: 'center', ...mono, fontSize: 24, fontWeight: 800, color: W9[i] < 0 ? C.red : C.green }}>
              w{i + 1} {W9[i].toFixed(1)}
            </div>
          );
        })}
        {/* w3 칩(x 212~332)을 피해 세포체 오른쪽 아래로 */}
        <div style={{ ...abs(SOMA.x + 34, SOMA.y + SOMA.r + 22, 152, 44), ...card, borderRadius: 999, border: `2px solid ${C.amber}`, display: 'grid', placeItems: 'center', ...mono, fontSize: 24, fontWeight: 800, color: C.amber }}>편향 {B9.toFixed(1)}</div>
      </Build>

      {/* 오른쪽 열: 용어 → 계산 카드 */}
      <Build at={2} style={{ ...abs(1480, 250, 390), display: 'grid', gap: 12 }}>
        <Term term="가중치" gloss="그 입력을 얼마나 믿을지 · 음수면 반대 증거" size={19} />
        <Term term="편향" gloss="기본 문턱 · 합이 이만큼은 넘어야 1이 된다" size={19} color={C.amber} />
      </Build>
      <Build at={3} style={{ ...abs(1480, 520, 400) }}>
        <div style={{ ...card, padding: '16px 20px', borderLeft: `6px solid ${C.green}` }}>
          <div style={{ ...kick, fontSize: 14, color: C.green }}>입력 (1, 1, 1) · 귀 뾰족, 갈색, 둥긂</div>
          <div style={{ ...mono, fontSize: 20, lineHeight: 1.6, marginTop: 6 }}>
            1×0.8 + 1×0.5 + 1×{fmt(W9[2])} = {A.s.toFixed(1)}<br />
            {A.s.toFixed(1)} + {fmt(B9)} = {A.zz.toFixed(1)}<br />
            <b style={{ color: C.green }}>{A.zz.toFixed(1)} &gt; 0 → 출력 {A.o} = 치와와</b>
          </div>
        </div>
      </Build>
      <Build at={4} style={{ ...abs(1480, 730, 400) }}>
        <div style={{ ...card, padding: '16px 20px', borderLeft: `6px solid ${C.red}` }}>
          <div style={{ ...kick, fontSize: 14, color: C.red }}>입력 (0, 1, 1) · 귀 없음</div>
          <div style={{ ...mono, fontSize: 20, lineHeight: 1.6, marginTop: 6 }}>
            0×0.8 + 1×0.5 + 1×{fmt(W9[2])} = {Bc.s.toFixed(1)}<br />
            {fmt(Bc.s)} + {fmt(B9)} = {fmt(Bc.zz)}<br />
            <b style={{ color: C.red }}>{fmt(Bc.zz)} ≤ 0 → 출력 {Bc.o} = 머핀</b>
          </div>
        </div>
      </Build>
      <Build at={4} style={{ ...abs(1480, 950, 400) }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--fg-muted)', wordBreak: 'keep-all' }}>규칙은 한 줄도 없다. 가중치 세 개 안에 들어 있다.</div>
      </Build>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   S10 · 직선 하나로는 못 가른다, 그래서 층을 쌓는다 (scene + build + live)
   메타포: 운동장에 박힌 말뚝 넷과 줄자. Build(클릭)와 t는 직교
   ═══════════════════════════════════════════════════════════════════════ */
const PL = { x: 300, y: 230, w: 720, h: 640 }; // 좌표 평면
const PX = (v: number) => 420 + v * 480;
const PY = (v: number) => 790 - v * 480;
const PTS = [
  { v: [0, 1], cls: 'o' }, { v: [1, 0], cls: 'o' },
  { v: [0, 0], cls: 't' }, { v: [1, 1], cls: 't' },
].map((p) => ({ ...p, x: PX(p.v[0]), y: PY(p.v[1]) }));

function Ruler() {
  const t = useSceneTime();
  const ang = interpolate(t, [0, 2.5], [10, 335], easeOut);
  const cx = PL.x + PL.w / 2 + Math.sin(t * 2.3) * 60 * clamp01(1 - t / 2.5);
  const cy = PL.y + PL.h / 2 + Math.cos(t * 1.7) * 50 * clamp01(1 - t / 2.5);
  const a = (ang * Math.PI) / 180;
  const nx = -Math.sin(a), ny = Math.cos(a);
  const sides = PTS.map((p) => Math.sign(nx * (p.x - cx) + ny * (p.y - cy)) || 1);
  const errA = PTS.filter((p, i) => (p.cls === 'o') !== (sides[i] > 0)).map((_, i) => i);
  const errB = PTS.filter((p, i) => (p.cls === 'o') !== (sides[i] < 0)).map((_, i) => i);
  const wrongIdx = PTS.map((p, i) => ((p.cls === 'o') !== (sides[i] > 0) ? i : -1)).filter((i) => i >= 0);
  const wrongIdxB = PTS.map((p, i) => ((p.cls === 'o') !== (sides[i] < 0) ? i : -1)).filter((i) => i >= 0);
  const wrong = errA.length <= errB.length ? wrongIdx : wrongIdxB;
  const blink = Math.sin(t * 16) > 0;
  const stopped = t >= 2.5;
  return (
    <>
      <svg style={{ ...abs(PL.x, PL.y, PL.w, PL.h), pointerEvents: 'none' }} viewBox={`${PL.x} ${PL.y} ${PL.w} ${PL.h}`}>
        <g transform={`translate(${cx},${cy}) rotate(${ang})`} opacity={0.92}>
          <rect x={-560} y={-11} width={1120} height={22} rx={5} fill={C.amber} />
          <line x1={-560} y1={-3} x2={560} y2={-3} stroke={C.ink} strokeWidth={2} strokeDasharray="2 18" opacity={0.6} />
          <line x1={-560} y1={6} x2={560} y2={6} stroke={C.ink} strokeWidth={1.2} strokeDasharray="1 9" opacity={0.4} />
        </g>
      </svg>
      {PTS.map((p, i) => {
        const bad = wrong.includes(i) && (stopped || blink);
        return (
          <div key={i} style={{ ...abs(p.x - 30, p.y - 30, 60, 60), pointerEvents: 'none', display: 'grid', placeItems: 'center' }}>
            {bad && <div style={{ position: 'absolute', inset: -10, borderRadius: 999, border: `4px solid ${C.red}`, opacity: 0.9 }} />}
          </div>
        );
      })}
      <div style={{ ...abs(PL.x, 892, PL.w), fontSize: 26, fontWeight: 800, color: C.red, wordBreak: 'keep-all', ...riseIn(t, 2.5, 0.6, 14) }}>
        직선 하나로는 안 된다 <span style={{ ...small, fontSize: 18, color: 'var(--fg-muted)' }}>(1969, 민스키·페퍼트)</span>
      </div>
    </>
  );
}

function S10() {
  const { clicks } = useDeck();
  const c1 = clicks >= 1, c2 = clicks >= 2;
  const N = { i1: [1340, 380], i2: [1340, 540], h1: [1540, 340], h2: [1540, 580], o: [1740, 460] } as const;
  const R = 36;
  const edge = (a: readonly number[], b: readonly number[]) => arrowPath(a[0], a[1], b[0], b[1], R + 2, R + 2, 0);
  const grid: number[] = [];
  for (let g = 60; g < PL.w; g += 60) grid.push(g);
  return (
    <>
      <Head kicker="학습의 역사 ④ · 1969" title="직선 하나로는 못 가른다, 그래서 층을 쌓는다" width={1040} />
      <Term style={{ ...abs(1180, 92, 640) }} term="결정 경계" gloss="모델이 '여기까지는 치와와, 여기부터는 머핀'이라고 긋는 선 · 퍼셉트론 하나 = 직선 하나" />

      {/* 좌표 평면 (운동장) */}
      <svg style={{ ...abs(PL.x, PL.y, PL.w, PL.h) }} viewBox={`${PL.x} ${PL.y} ${PL.w} ${PL.h}`}>
        <rect x={PL.x} y={PL.y} width={PL.w} height={PL.h} rx={16} fill={c2 ? `color-mix(in srgb, ${C.amber} 16%, ${C.paper})` : 'var(--surface)'} stroke="var(--hair)" style={{ transition: 'fill .8s' }} />
        {grid.map((g) => (
          <g key={g}>
            <line x1={PL.x + g} y1={PL.y} x2={PL.x + g} y2={PL.y + PL.h} stroke="var(--hair-2)" />
            <line x1={PL.x} y1={PL.y + g} x2={PL.x + PL.w} y2={PL.y + g} stroke="var(--hair-2)" />
          </g>
        ))}
        {/* 클릭 2: 두 직선 사이가 닫힌 곡선으로 휘어 ○ 둘을 감싼다 */}
        <g opacity={c2 ? 1 : 0} style={{ transition: 'opacity .8s' }}>
          <rect x={-420} y={-150} width={840} height={300} rx={150} transform={`translate(${PL.x + PL.w / 2},${PL.y + PL.h / 2}) rotate(45)`} fill={`color-mix(in srgb, ${C.green} 20%, ${C.paper})`} stroke={C.green} strokeWidth={5} />
        </g>
        {/* 클릭 1: 은닉 뉴런 하나 = 직선 하나 */}
        <g opacity={c1 ? (c2 ? 0.35 : 1) : 0} style={{ transition: 'opacity .6s' }}>
          <line x1={300} y1={430} x2={740} y2={870} stroke={C.green} strokeWidth={6} strokeLinecap="round" />
          <line x1={580} y1={230} x2={1020} y2={670} stroke={C.blue} strokeWidth={6} strokeLinecap="round" />
        </g>
        {/* 축 */}
        <line x1={PL.x + 60} y1={PL.y + PL.h - 60} x2={PL.x + PL.w - 40} y2={PL.y + PL.h - 60} stroke="var(--fg-faint)" strokeWidth={2} />
        <line x1={PL.x + 60} y1={PL.y + PL.h - 60} x2={PL.x + 60} y2={PL.y + 40} stroke="var(--fg-faint)" strokeWidth={2} />
      </svg>
      <div style={{ ...abs(PL.x + PL.w - 150, PL.y + PL.h - 52, 140), ...kick, fontSize: 15, textAlign: 'right' }}>입력 1 →</div>
      <div style={{ ...abs(PL.x + 74, PL.y + 16, 220), ...kick, fontSize: 15 }}>↑ 입력 2</div>
      {[0, 1].map((v) => (
        <div key={v} style={{ ...abs(PX(v) - 10, PL.y + PL.h - 22, 20), ...mono, fontSize: 18, color: 'var(--fg-faint)', textAlign: 'center' }}>{v}</div>
      ))}
      {[0, 1].map((v) => (
        <div key={v} style={{ ...abs(PL.x + 30, PY(v) - 12, 24), ...mono, fontSize: 18, color: 'var(--fg-faint)', textAlign: 'center' }}>{v}</div>
      ))}
      {/* 말뚝 넷 */}
      {PTS.map((p, i) => (
        <div key={i} style={{ ...abs(p.x - 30, p.y - 30, 60, 60), display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
          {p.cls === 'o' ? (
            <div style={{ width: 44, height: 44, borderRadius: 999, border: `7px solid ${C.green}`, background: C.paper, boxSizing: 'border-box' }} />
          ) : (
            <svg width={52} height={48} viewBox="0 0 52 48"><path d="M26,3 L49,45 L3,45 Z" fill={C.paper} stroke={C.blue} strokeWidth={7} strokeLinejoin="round" /></svg>
          )}
          <div style={{ position: 'absolute', top: p.v[1] === 1 ? 74 : -36, ...mono, fontSize: 16, color: 'var(--fg-faint)', whiteSpace: 'nowrap' }}>({p.v[0]}, {p.v[1]})</div>
        </div>
      ))}
      <Scene freezeAt={2.6} duration={3} markers={[{ time: 0, label: '줄자가 돈다' }, { time: 2.5, label: '멈춤' }]}>
        <Ruler />
      </Scene>

      {/* 오른쪽 · 2-2-1 신경망 도식 */}
      <div style={{ ...abs(1290, 236, 520), ...kick, fontSize: 15 }}>퍼셉트론을 한 층 더 끼운다</div>
      <svg style={{ ...abs(0, 0, 1920, 1080), pointerEvents: 'none' }} viewBox="0 0 1920 1080">
        {([['i1', 'h1'], ['i1', 'h2'], ['i2', 'h1'], ['i2', 'h2']] as const).map(([a, b]) => {
          const e = edge(N[a], N[b]);
          return <path key={a + b} d={e.line} stroke={c1 ? (b === 'h1' ? C.green : C.blue) : 'var(--hair)'} strokeWidth={c1 ? 4 : 2} strokeDasharray={c1 ? undefined : '6 6'} fill="none" style={{ transition: 'all .6s' }} />;
        })}
        {(['h1', 'h2'] as const).map((h) => {
          const e = edge(N[h], N.o);
          return <path key={h} d={e.line} stroke={c1 ? C.ink : 'var(--hair)'} strokeWidth={c1 ? 4 : 2} strokeDasharray={c1 ? undefined : '6 6'} fill="none" style={{ transition: 'all .6s' }} />;
        })}
        {(['i1', 'i2'] as const).map((k) => <circle key={k} cx={N[k][0]} cy={N[k][1]} r={R} fill={C.paper} stroke={C.ink} strokeWidth={3.5} />)}
        {(['h1', 'h2'] as const).map((k, i) => (
          <circle key={k} cx={N[k][0]} cy={N[k][1]} r={R} fill={c1 ? (i === 0 ? C.green : C.blue) : C.paper} stroke={c1 ? (i === 0 ? C.green : C.blue) : 'var(--fg-faint)'} strokeWidth={3.5} strokeDasharray={c1 ? undefined : '7 6'} style={{ transition: 'all .6s' }} />
        ))}
        <circle cx={N.o[0]} cy={N.o[1]} r={R} fill={c2 ? C.green : C.paper} stroke={C.ink} strokeWidth={3.5} style={{ transition: 'all .6s' }} />
      </svg>
      {(['i1', 'i2'] as const).map((k, i) => (
        <div key={k} style={{ ...abs(N[k][0] - R, N[k][1] - R, R * 2, R * 2), display: 'grid', placeItems: 'center', ...mono, fontSize: 20, fontWeight: 800 }}>x{i + 1}</div>
      ))}
      <div style={{ ...abs(1290, N.i2[1] + 60, 100), ...kick, fontSize: 14, textAlign: 'center' }}>입력</div>
      <div style={{ ...abs(1490, N.h2[1] + 60, 100), ...kick, fontSize: 14, textAlign: 'center', color: c1 ? C.green : undefined }}>은닉층</div>
      <div style={{ ...abs(1690, N.o[1] + 60, 100), ...kick, fontSize: 14, textAlign: 'center' }}>출력</div>
      <Term style={{ ...abs(1290, 700, 520) }} term="은닉층" gloss="입력과 출력 사이에 끼운 퍼셉트론 층 · 뉴런 하나가 직선 하나를 긋는다" color={c1 ? C.green : 'var(--fg-faint)'} />
      <Build at={2} style={{ ...abs(1290, 810, 520) }}>
        <div style={{ ...h3, fontSize: 30, color: C.green }}>층을 쌓으면 경계가 휜다</div>
        <div style={{ ...small, fontSize: 17, marginTop: 6 }}>다음 층이 직선 둘을 합치면 ○ 둘만 감싸는 닫힌 경계가 된다 (개념도)</div>
      </Build>
      <div style={{ ...abs(1290, 945, 520), ...liveKick }}>라이브 · OX · 이 네 점을 직선 한 줄로 ○와 △로 가를 수 있을까</div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   S11 · 틀린 만큼 거꾸로 돌려보낸다: 역전파 (scene)
   메타포: 거꾸로 흐르는 강물과 물레방아 손잡이. 숫자는 전부 실제 계산
   2-2-1, 입력 (1,1), 은닉·출력 시그모이드, 정답 0, 손실 ½(y−ŷ)², 경사 하강 한 걸음
   ═══════════════════════════════════════════════════════════════════════ */
type Wt = { w11: number; w12: number; w21: number; w22: number; v1: number; v2: number };
const W0: Wt = { w11: 0.5, w12: -0.3, w21: 0.8, w22: 0.2, v1: 0.6, v2: -0.1 };
const X11 = [1, 1];
const Y11 = 0;
const LR = 2; // 학습률 0.1은 한 걸음의 변화가 소수 둘째 자리에 보이지 않아 2로 올렸다 (보고에 기록)
const sig = (z: number) => 1 / (1 + Math.exp(-z));
function fwd(w: Wt) {
  const h1 = sig(X11[0] * w.w11 + X11[1] * w.w21);
  const h2 = sig(X11[0] * w.w12 + X11[1] * w.w22);
  const y = sig(h1 * w.v1 + h2 * w.v2);
  return { h1, h2, y };
}
function step(w: Wt) {
  const { h1, h2, y } = fwd(w);
  const d = (y - Y11) * y * (1 - y); // ∂L/∂z_out
  const g: Wt = {
    v1: d * h1,
    v2: d * h2,
    w11: d * w.v1 * h1 * (1 - h1) * X11[0],
    w21: d * w.v1 * h1 * (1 - h1) * X11[1],
    w12: d * w.v2 * h2 * (1 - h2) * X11[0],
    w22: d * w.v2 * h2 * (1 - h2) * X11[1],
  };
  const nw: Wt = { w11: w.w11 - LR * g.w11, w12: w.w12 - LR * g.w12, w21: w.w21 - LR * g.w21, w22: w.w22 - LR * g.w22, v1: w.v1 - LR * g.v1, v2: w.v2 - LR * g.v2 };
  return { g, nw, y };
}
const STEP1 = step(W0);
const W1 = STEP1.nw;
const Y0 = STEP1.y;
const Y1 = fwd(W1).y;
const ERR_CURVE = (() => {
  const arr: number[] = [];
  let w = W0;
  for (let i = 0; i < 12; i++) { const s = step(w); arr.push(Math.abs(s.y - Y11)); w = s.nw; }
  return arr;
})();
const S11_NUMBERS = { W0, W1, Y0, Y1, grad: STEP1.g, LR, ERR_CURVE };

const NN = { i1: [300, 410], i2: [300, 650], h1: [880, 350], h2: [880, 710], o: [1400, 530] } as const;
const NR = 46;
type EdgeKey = keyof Wt;
const EDGES: Array<{ k: EdgeKey; a: keyof typeof NN; b: keyof typeof NN; f: number; side: number }> = [
  { k: 'w11', a: 'i1', b: 'h1', f: 0.5, side: -1 },
  { k: 'w12', a: 'i1', b: 'h2', f: 0.24, side: 1 },
  { k: 'w21', a: 'i2', b: 'h1', f: 0.76, side: -1 },
  { k: 'w22', a: 'i2', b: 'h2', f: 0.5, side: 1 },
  { k: 'v1', a: 'h1', b: 'o', f: 0.5, side: -1 },
  { k: 'v2', a: 'h2', b: 'o', f: 0.5, side: 1 },
];

function BackpropScene() {
  const t = useSceneTime();
  const maxg = Math.max(...EDGES.map((e) => Math.abs(STEP1.g[e.k])));
  const geo = EDGES.map((e) => arrowPath(NN[e.a][0], NN[e.a][1], NN[e.b][0], NN[e.b][1], NR + 2, NR + 2, 0));
  const pos = (i: number, p: number) => [lerp(geo[i].sx, geo[i].ex, p), lerp(geo[i].sy, geo[i].ey, p)] as const;
  /* 물결: [시작, 끝, 대상 선들, 방향(+앞/-뒤), 색] */
  const waves: Array<[number, number, number[], number, string]> = [
    [0, 1, [0, 1, 2, 3], 1, C.green], [1, 2, [4, 5], 1, C.green],
    [2, 3.5, [4, 5], -1, C.red], [3.5, 5, [0, 1, 2, 3], -1, C.red],
    [5, 6, [0, 1, 2, 3], 1, C.green], [6, 7, [4, 5], 1, C.green],
  ];
  const chipVal = (e: (typeof EDGES)[number]) => {
    const [a, b] = e.k.startsWith('v') ? [2.7, 3.3] : [4.25, 4.85];
    return lerp(W0[e.k], W1[e.k], easeInOut(clamp01((t - a) / (b - a))));
  };
  const chipOn = (e: (typeof EDGES)[number]) => spring(t, e.k.startsWith('v') ? 2.7 : 4.25, 0.6);
  const yShow = t < 1.85 ? null : t < 6.85 ? lerp(0, Y0, easeOut(clamp01((t - 1.85) / 0.4))) : lerp(Y0, Y1, easeInOut(clamp01((t - 6.85) / 0.4)));
  const err = yShow === null ? null : Math.abs(yShow - Y11);
  const phase = t < 2 ? 0 : t < 5 ? 1 : t < 7 ? 2 : 3;
  const hidOn = (t >= 1 && t < 2) || t >= 6;
  const outOn = (t >= 2 && t < 5) || t >= 7;
  const nodeFill = (on: boolean) => (on ? C.green : C.paper);
  const captions = [
    ['순전파', '입력에서 출력으로 계산이 앞으로 흐른다. 출력이 나오면 정답과 비교해 오차를 잰다.'],
    ['역전파', '오차가 출력에서 입력 쪽으로 거꾸로 흐르며, 지나는 가중치마다 책임을 재고 책임만큼 돌린다.'],
    ['다시 순전파', '고친 가중치로 다시 계산한다. 출력이 정답 쪽으로 움직여 오차가 줄었다.'],
    ['반복', '이 두 걸음을 수천, 수만 번 되풀이한다. 오차가 계단처럼 내려간다.'],
  ];
  const gx = 1330, gy = 730, gw = 480, gh = 230;
  const curveW = gw - 70, curveH = gh - 96;
  const maxE = Math.max(...ERR_CURVE);
  const cp = ERR_CURVE.map((e, i) => [gx + 46 + (i / (ERR_CURVE.length - 1)) * curveW, gy + 66 + (1 - e / maxE) * curveH] as const);
  const reveal = interpolate(t, [7.3, 8.5], [100, 0], easeInOut);
  return (
    <>
      <svg style={{ ...abs(0, 0, 1920, 1080), pointerEvents: 'none' }} viewBox="0 0 1920 1080">
        {geo.map((g, i) => <path key={i} d={g.line} stroke="var(--fg-faint)" strokeWidth={3} fill="none" />)}
        {/* 물결 (혜성 꼬리) · 선 가장자리에서 시작·종료 */}
        {waves.map(([a, b, ids, dir, col], wi) => {
          if (t < a || t >= b + 0.05) return null;
          const p0 = easeInOut(clamp01((t - a) / (b - a)));
          const p = dir > 0 ? p0 : 1 - p0;
          return ids.map((i) => {
            const [x, y] = pos(i, p);
            const [tx, ty] = pos(i, clamp01(p - dir * 0.22));
            return (
              <g key={`${wi}-${i}`}>
                <line x1={tx} y1={ty} x2={x} y2={y} stroke={col} strokeWidth={10} strokeLinecap="round" opacity={0.45} />
                <circle cx={x} cy={y} r={11} fill={col} />
              </g>
            );
          });
        })}
        {(['i1', 'i2'] as const).map((k) => <circle key={k} cx={NN[k][0]} cy={NN[k][1]} r={NR} fill={C.paper} stroke={C.ink} strokeWidth={4} />)}
        {(['h1', 'h2'] as const).map((k) => <circle key={k} cx={NN[k][0]} cy={NN[k][1]} r={NR} fill={nodeFill(hidOn)} stroke={C.ink} strokeWidth={4} style={{ transition: 'fill .4s' }} />)}
        <circle cx={NN.o[0]} cy={NN.o[1]} r={NR} fill={nodeFill(outOn)} stroke={C.ink} strokeWidth={4} style={{ transition: 'fill .4s' }} />
        {/* 출력 → 출력 카드 */}
        {(() => { const e = arrowPath(NN.o[0], NN.o[1], 1560, 425, NR + 2, 0, 14); return <><path d={e.line} stroke="var(--fg-faint)" strokeWidth={3} fill="none" /><path d={e.head} fill="var(--fg-faint)" /></>; })()}
      </svg>
      {/* 노드 라벨 */}
      {(['i1', 'i2'] as const).map((k, i) => (
        <div key={k} style={{ ...abs(NN[k][0] - NR, NN[k][1] - NR, NR * 2, NR * 2), display: 'grid', placeItems: 'center', ...mono, fontSize: 26, fontWeight: 800 }}>{X11[i]}</div>
      ))}
      {(['h1', 'h2'] as const).map((k, i) => (
        <div key={k} style={{ ...abs(NN[k][0] - NR, NN[k][1] - NR, NR * 2, NR * 2), display: 'grid', placeItems: 'center', ...mono, fontSize: 22, fontWeight: 800, color: hidOn ? 'var(--accent-ink)' : C.ink }}>h{i + 1}</div>
      ))}
      <div style={{ ...abs(NN.o[0] - NR, NN.o[1] - NR, NR * 2, NR * 2), display: 'grid', placeItems: 'center', ...mono, fontSize: 22, fontWeight: 800, color: outOn ? 'var(--accent-ink)' : C.ink }}>ŷ</div>
      <div style={{ ...abs(120, NN.i1[1] - 14, 150), ...kick, fontSize: 15 }}>입력 1 = {X11[0]}</div>
      <div style={{ ...abs(120, NN.i2[1] - 14, 150), ...kick, fontSize: 15 }}>입력 2 = {X11[1]}</div>
      <div style={{ ...abs(NN.h1[0] - 60, NN.h1[1] - NR - 40, 120), ...kick, fontSize: 14, textAlign: 'center' }}>은닉층</div>

      {/* 가중치 칩 + 다이얼 + 책임 막대 */}
      {EDGES.map((e, i) => {
        const g = geo[i];
        const mx = lerp(g.sx, g.ex, e.f), my = lerp(g.sy, g.ey, e.f);
        const dx = g.ex - g.sx, dy = g.ey - g.sy, L = Math.hypot(dx, dy);
        const nx = -dy / L, ny = dx / L;
        const cxp = mx + nx * 40 * e.side, cyp = my + ny * 40 * e.side;
        const v = chipVal(e);
        const on = chipOn(e);
        const resp = Math.abs(STEP1.g[e.k]) / maxg;
        const changing = on > 0 && on < 1;
        return (
          <div key={e.k} style={{ ...abs(cxp - 92, cyp - 26, 184, 52) }}>
            <div style={{ position: 'absolute', inset: 0, ...card, borderRadius: 999, border: `2px solid ${changing ? C.red : v < 0 ? C.red : C.green}`, display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px 0 16px', boxSizing: 'border-box', boxShadow: changing ? `0 0 0 6px ${C.redSoft}` : undefined }}>
              <span style={{ ...mono, fontSize: 15, color: 'var(--fg-faint)' }}>{e.k.replace(/^(\w)(\d)(\d)?$/, (_m, a, b, c) => `${a}${b}${c ?? ''}`)}</span>
              <span style={{ ...mono, fontSize: 27, fontWeight: 800, color: v < 0 ? C.red : C.green, width: 78 }}>{v.toFixed(2)}</span>
              {/* 작은 다이얼 (6장의 손잡이) */}
              <div style={{ width: 30, height: 30, borderRadius: 999, border: `2px solid var(--hair)`, position: 'relative', flexShrink: 0 }}>
                <div style={{ position: 'absolute', left: 12, top: 3, width: 3, height: 12, borderRadius: 2, background: C.green, transformOrigin: '1.5px 11px', transform: `rotate(${v * 150}deg)` }} />
              </div>
            </div>
            {/* 책임 막대: 길수록 많이 돌아간다 */}
            <div style={{ position: 'absolute', left: 16, top: -14, width: 120, height: 8, borderRadius: 4, background: 'var(--hair-2)', opacity: on }}>
              <div style={{ width: `${resp * 100 * on}%`, height: '100%', borderRadius: 4, background: C.red }} />
            </div>
            <div style={{ position: 'absolute', left: 142, top: -20, ...kick, fontSize: 11, color: C.red, opacity: on, whiteSpace: 'nowrap' }}>책임</div>
          </div>
        );
      })}

      {/* 출력 · 정답 · 오차 카드 */}
      {[
        { y: 380, label: '출력', val: yShow === null ? '?' : yShow.toFixed(2), col: C.ink },
        { y: 490, label: '정답', val: `${Y11} · 머핀`, col: C.blue },
        { y: 600, label: '오차', val: err === null ? '?' : err.toFixed(2), col: C.red },
      ].map((c) => (
        <div key={c.label} style={{ ...abs(1560, c.y, 250, 90), ...card, borderLeft: `6px solid ${c.col}`, padding: '10px 18px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ ...kick, fontSize: 14 }}>{c.label}</div>
            {c.label === '오차' && <div style={{ ...small, fontSize: 13 }}>= |출력 − 정답|</div>}
          </div>
          <div style={{ ...mono, fontSize: 34, fontWeight: 800, color: c.col }}>{c.val}</div>
        </div>
      ))}

      {/* 오차 곡선 (실제 12걸음) */}
      <div style={{ ...abs(gx, gy, gw, gh), ...card, padding: '14px 18px', boxSizing: 'border-box', ...riseIn(t, 7, 0.7, 20) }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ ...kick, fontSize: 14, color: C.red }}>오차 · 걸음마다</div>
          <div style={{ fontSize: 19, fontWeight: 800, color: C.ink }}>반복할수록 오차가 줄어든다</div>
        </div>
        <svg style={{ position: 'absolute', left: 0, top: 0 }} width={gw} height={gh} viewBox={`${gx} ${gy} ${gw} ${gh}`}>
          <line x1={gx + 46} y1={gy + 66 + curveH} x2={gx + 46 + curveW} y2={gy + 66 + curveH} stroke="var(--hair)" />
          <g style={{ clipPath: `inset(0 ${reveal}% 0 0)` }}>
            <path d={cp.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ')} fill="none" stroke={C.red} strokeWidth={4} strokeLinejoin="round" />
            {cp.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i < 2 ? 7 : 4} fill={i < 2 ? C.red : C.paper} stroke={C.red} strokeWidth={2} />)}
          </g>
          <text x={cp[0][0] - 4} y={cp[0][1] - 14} fontSize={15} fontWeight={800} fill={C.red} fontFamily="var(--font-mono)">{ERR_CURVE[0].toFixed(2)}</text>
          <text x={cp[1][0] - 6} y={cp[1][1] + 26} fontSize={15} fontWeight={800} fill={C.red} fontFamily="var(--font-mono)" opacity={reveal < 90 ? 1 : 0}>{ERR_CURVE[1].toFixed(2)}</text>
          <text x={gx + 46} y={gy + gh - 14} fontSize={13} fill="var(--fg-faint)">걸음 1</text>
          <text x={gx + 46 + curveW - 40} y={gy + gh - 14} fontSize={13} fill="var(--fg-faint)">걸음 12</text>
        </svg>
      </div>

      {/* 아래 밴드 · 용어 + 국면 캡션 */}
      <div style={{ ...abs(110, 800, 1100), display: 'flex', gap: 40 }}>
        <Term term="순전파" gloss="입력에서 출력으로 계산이 앞으로 흐르는 것" size={18} style={{ width: 360 }} />
        <Term term="오차(손실)" gloss="출력과 정답의 차이 · 이것을 줄이는 것이 학습" size={18} color={C.red} style={{ width: 400 }} />
      </div>
      <div style={{ ...abs(110, 900, 1180), display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <span style={{ ...pill(phase === 1 ? C.red : C.green, 18), flexShrink: 0 }}>{captions[phase][0]}</span>
        <div style={{ ...body, fontSize: 21, color: C.ink }}>{captions[phase][1]}{phase === 1 && <span style={{ ...small, fontSize: 16, marginLeft: 8 }}>(경사 하강법 · 학습률 {LR})</span>}</div>
      </div>
    </>
  );
}

function S11() {
  return (
    <Scene freezeAt={8.5} duration={9} markers={[{ time: 0, label: '순전파' }, { time: 2, label: '역전파' }, { time: 5, label: '다시 순전파' }, { time: 7, label: '오차 곡선' }]}>
      <Head kicker="학습의 역사 ⑤ · 1986 · 루멜하트·힌턴·윌리엄스" title="틀린 만큼 거꾸로 돌려보낸다: 역전파" />
      <Term style={{ ...abs(1160, 92, 420) }} term="역전파" gloss="오차를 거꾸로 흘려보내 가중치를 고치는 방법" />
      <div style={{ ...abs(1600, 96), ...pill(C.ink, 20), ...mono }}>1986</div>
      <BackpropScene />
    </Scene>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   S12 · 층을 깊게: 딥러닝 (build)
   왼쪽 70% 층 8개 단면(코드 도형), 오른쪽 세로 카드 셋, 아래 띠 막대 비교
   ═══════════════════════════════════════════════════════════════════════ */
const LAYER_X = (i: number) => 262 + i * 140;
const LAYER_H = (i: number) => 470 - i * 26;
const LAYER_CY = 530;
const LAYER_LABELS: Record<number, string> = { 0: '선 · 점', 2: '모서리 · 질감', 4: '귀 · 눈 모양', 7: '치와와 / 머핀' };

function S12() {
  const { clicks } = useDeck();
  const rng = mulberry32(12);
  const layers = Array.from({ length: 8 }, (_, i) => ({
    i, x: LAYER_X(i), h: LAYER_H(i), rows: 10 - i,
    cells: Array.from({ length: (10 - i) * 2 }, () => 0.55 + rng() * 0.45),
  }));
  const stacked = clicks >= 1;
  const conn = arrowPath(212, 515, 262, 515, 0, 0, 12);
  return (
    <>
      <Head kicker="학습의 역사 ⑥ · 2012년 이후" title="층을 깊게: 딥러닝" width={800} />
      <Build at={1} style={{ ...abs(1160, 92, 640) }}>
        <Term term="딥러닝" gloss="은닉층을 여러 겹(깊게) 쌓은 인공신경망으로 하는 기계학습" />
      </Build>

      {/* 입력 사진 → 1층 */}
      <Photo src={PHOTO('치와와', 21)} x={60} y={440} w={150} h={150} rot={-3} alt="입력 사진" />
      <svg style={{ ...abs(0, 0, 1920, 1080), pointerEvents: 'none' }} viewBox="0 0 1920 1080">
        <path d={conn.line} stroke={C.green} strokeWidth={4} fill="none" />
        <path d={conn.head} fill={C.green} />
        {/* 층 사이 연결선 */}
        {layers.slice(0, -1).map((l) => {
          const n = layers[l.i + 1];
          const on = stacked || l.i === 0;
          const shown = stacked || n.i === 0;
          return [-1, 0, 1].map((k) => (
            <line key={`${l.i}-${k}`} x1={l.x + 84} y1={LAYER_CY + k * (l.h / 2 - 30)} x2={n.x} y2={LAYER_CY - k * (n.h / 2 - 30)} stroke="var(--hair)" strokeWidth={2} opacity={on && shown ? 1 : 0} style={{ transition: `opacity .5s ${l.i * 0.09 + 0.2}s` }} />
          ));
        })}
      </svg>
      {layers.map((l) => {
        const on = stacked || l.i === 0;
        return (
          <div key={l.i} style={{ ...abs(l.x, LAYER_CY - l.h / 2, 84, l.h), ...card, borderRadius: 14, padding: 8, boxSizing: 'border-box', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, border: `2px solid ${l.i === 7 ? C.green : 'var(--hair)'}`, opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(34px)', transition: `opacity .5s ${l.i * 0.09}s, transform .5s ${l.i * 0.09}s` }}>
            {l.cells.map((a, ci) => (
              <div key={ci} style={{ borderRadius: l.i > 4 ? 8 : 3, background: `color-mix(in srgb, ${C.green} ${Math.round(a * (18 + l.i * 10))}%, ${C.paper})`, border: `1px solid color-mix(in srgb, ${C.green} ${20 + l.i * 8}%, transparent)` }} />
            ))}
            {l.i === 7 && (
              <>
                <div style={{ position: 'absolute', left: 6, right: 6, top: 20, textAlign: 'center', fontSize: 14, fontWeight: 800, color: C.green, background: C.paper, borderRadius: 6, padding: '2px 0', border: `1px solid ${C.green}` }}>치와와</div>
                <div style={{ position: 'absolute', left: 6, right: 6, bottom: 20, textAlign: 'center', fontSize: 14, fontWeight: 800, color: C.green, background: C.paper, borderRadius: 6, padding: '2px 0', border: `1px solid ${C.green}` }}>머핀</div>
              </>
            )}
          </div>
        );
      })}
      {/* 층 번호 */}
      {layers.map((l) => (
        <div key={l.i} style={{ ...abs(l.x, LAYER_CY - LAYER_H(0) / 2 - 34, 84), ...kick, fontSize: 14, textAlign: 'center', opacity: stacked || l.i === 0 ? 1 : 0, transition: `opacity .5s ${l.i * 0.09}s` }}>{l.i + 1}층</div>
      ))}
      <div style={{ ...abs(262, 236, 800), ...kick, fontSize: 15 }}>{stacked ? '은닉층 8겹 · 앞쪽 층은 잘게, 뒤로 갈수록 크게 본다' : '한 층 → 여러 겹으로'}</div>

      {/* 클릭 2: 층이 보는 것 */}
      <Build at={2} style={{ ...abs(0, 0, 1920, 1080), pointerEvents: 'none' }}>
        {Object.entries(LAYER_LABELS).map(([i, label]) => {
          const li = Number(i);
          return (
            <div key={i} style={{ ...abs(LAYER_X(li) - 30, LAYER_CY + LAYER_H(0) / 2 + 14, 144), textAlign: 'center' }}>
              <div style={{ width: 2, height: 16, background: C.green, margin: '0 auto 4px' }} />
              <div style={{ ...pill(C.green, 16) }}>{label}</div>
            </div>
          );
        })}
        <div style={{ ...abs(110, 828, 1240), ...h3, fontSize: 28 }}>
          특징을 사람이 정하지 않는다. <span style={{ color: C.green }}>층이 스스로 뽑는다.</span>
        </div>
      </Build>

      {/* 클릭 3: 가능하게 한 셋 (비균등 카드) */}
      <Build at={3} style={{ ...abs(1400, 240, 410), display: 'grid', gap: 16 }}>
        <div style={{ ...kick, fontSize: 14 }}>1986년의 방법이 2012년에야 터진 이유 · 셋</div>
        {[
          { name: '데이터', gloss: '인터넷에 쌓인 사진', h: 190, big: true },
          { name: 'GPU', gloss: '그래픽카드의 계산력', h: 130 },
          { name: '방법', gloss: '역전파 + 깊은 층을 안정시키는 기법', h: 130 },
        ].map((c) => (
          <div key={c.name} style={{ ...card, height: c.h, padding: '18px 22px', boxSizing: 'border-box', borderLeft: `8px solid ${c.big ? C.green : C.amber}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ ...h3, fontSize: c.big ? 44 : 30, color: c.big ? C.green : C.ink }}>{c.name}</div>
            <div style={{ ...body, fontSize: 19, marginTop: 6 }}>{c.gloss}</div>
          </div>
        ))}
      </Build>

      {/* 클릭 4: 2012 이미지넷 막대 비교 (실제 수치) */}
      <Build at={4} style={{ ...abs(110, 884, 1240, 90) }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>2012 이미지넷 대회 · top-5 오류율</div>
          <div style={{ ...small, fontSize: 15 }}>낮을수록 좋다 · 층 8개 AlexNet</div>
        </div>
        {[
          { name: 'AlexNet', v: 15.3, col: C.green },
          { name: '2위', v: 26.2, col: C.amber },
        ].map((b) => (
          <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
            <div style={{ width: 90, fontSize: 17, fontWeight: 800, textAlign: 'right' }}>{b.name}</div>
            <div style={{ width: (b.v / 30) * 900, height: 18, borderRadius: 9, background: b.col }} />
            <div style={{ ...mono, fontSize: 19, fontWeight: 800, color: b.col }}>{b.v.toFixed(1)}%</div>
          </div>
        ))}
      </Build>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   S13 · 세 시대, 무엇이 달라졌나 (static + live)
   왼쪽 68% 비교표(직접 div 격자), 오른쪽 동심원 세 겹 + 연도 칩
   ═══════════════════════════════════════════════════════════════════════ */
type Who = 'p' | 'c' | 'n';
const T13: Array<{ row: string; cells: Array<[string, Who, string?]> }> = [
  { row: '규칙은 누가', cells: [['사람', 'p'], ['컴퓨터', 'c', '가중치로'], ['컴퓨터', 'c']] },
  { row: '특징은 누가', cells: [['사람', 'p'], ['사람', 'p'], ['컴퓨터', 'c', '층이 뽑는다']] },
  { row: '필요한 것', cells: [['전문가 지식', 'n'], ['데이터 + 특징 설계', 'n'], ['큰 데이터 + GPU', 'n']] },
  { row: '잘 되는 일', cells: [['규칙이 또렷한 일', 'n', '세금 계산'], ['표 형태 데이터', 'n'], ['사진 · 소리 · 글', 'n']] },
];
const COLS13 = [['규칙 기반', '전문가 시스템'], ['기계학습', '예시에서 규칙을 찾는다'], ['딥러닝', '층을 깊게 쌓은 기계학습']];

function S13() {
  const cellStyle = (w: Who): CSSProperties => ({
    borderRadius: 14,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    textAlign: 'center', padding: '6px 10px', boxSizing: 'border-box',
    background: w === 'p' ? C.amberSoft : w === 'c' ? C.greenSoft : 'var(--surface)',
    border: `2px solid ${w === 'p' ? C.amber : w === 'c' ? C.green : 'var(--hair)'}`,
    color: w === 'p' ? '#8a5f0a' : w === 'c' ? C.green : C.ink,
  });
  const rings = [
    { r: 220, label: '인공지능', fill: 'var(--surface)', stroke: 'var(--fg-faint)', ty: 44, col: C.ink },
    { r: 150, label: '기계학습', fill: C.greenSoft, stroke: C.green, ty: 122, col: C.green },
    { r: 80, label: '딥러닝', fill: C.green, stroke: C.green, ty: 236, col: 'var(--accent-ink)' },
  ];
  return (
    <>
      <Head kicker="학습의 역사 · 정리" title="세 시대, 무엇이 달라졌나" width={800} />
      <div style={{ ...abs(1000, 104, 300), display: 'flex', gap: 10 }}>
        <span style={pill('#8a5f0a', 17)}>앰버 = 사람</span>
        <span style={pill(C.green, 17)}>초록 = 컴퓨터</span>
      </div>

      {/* 비교표 */}
      <div style={{ ...abs(110, 226, 1190, 600), display: 'grid', gridTemplateColumns: '190px repeat(3, 1fr)', gridTemplateRows: '78px repeat(4, 118px)', gap: 8 }}>
        <div />
        {COLS13.map(([a, b]) => (
          <div key={a} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', ...card, borderRadius: 14 }}>
            <div style={{ fontSize: 26, fontWeight: 900 }}>{a}</div>
            <div style={{ ...small, fontSize: 15 }}>{b}</div>
          </div>
        ))}
        {T13.map((r) => (
          <>
            <div key={r.row} style={{ display: 'flex', alignItems: 'center', fontSize: 21, fontWeight: 800, color: 'var(--fg-muted)', paddingLeft: 6 }}>{r.row}</div>
            {r.cells.map(([txt, who, sub], ci) => (
              <div key={`${r.row}-${ci}`} style={cellStyle(who)}>
                <div style={{ fontSize: who === 'n' ? 22 : 28, fontWeight: 900, wordBreak: 'keep-all' }}>{txt}</div>
                {sub && <div style={{ fontSize: 15, fontWeight: 700, opacity: 0.85, marginTop: 2 }}>{sub}</div>}
              </div>
            ))}
          </>
        ))}
      </div>
      <div style={{ ...abs(110, 850, 1190), ...body, fontSize: 21 }}>
        왼쪽 위에서 오른쪽 아래로 갈수록 <b style={{ color: '#8a5f0a' }}>사람</b> 몫이 <b style={{ color: C.green }}>컴퓨터</b> 몫으로 넘어간다. 규칙을 찾는 법이 바뀌어 온 역사다.
      </div>

      {/* 동심원 */}
      <svg style={{ ...abs(1340, 216, 470, 470) }} viewBox="0 0 470 470">
        {rings.map((rg) => (
          <g key={rg.label}>
            <circle cx={235} cy={235} r={rg.r} fill={rg.fill} stroke={rg.stroke} strokeWidth={3} />
            <text x={235} y={rg.ty} textAnchor="middle" fontSize={rg.r > 100 ? 22 : 26} fontWeight={900} fill={rg.col} fontFamily="var(--font-head)">{rg.label}</text>
          </g>
        ))}
        <text x={235} y={262} textAnchor="middle" fontSize={15} fontWeight={700} fill="var(--accent-ink)" fontFamily="var(--font-head)">가장 안쪽</text>
      </svg>
      <div style={{ ...abs(1340, 690, 470), ...small, fontSize: 16, textAlign: 'center' }}>딥러닝 ⊂ 기계학습 ⊂ 인공지능 · 셋은 안에 들어가는 관계</div>
      <div style={{ ...abs(1340, 740, 470), display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[['규칙 기반', '1950~80년대'], ['퍼셉트론', '1957'], ['역전파', '1986'], ['AlexNet', '2012']].map(([a, b]) => (
          <div key={a} style={{ ...card, borderRadius: 12, padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 17, fontWeight: 800 }}>{a}</span>
            <span style={{ ...mono, fontSize: 17, color: 'var(--fg-muted)' }}>{b}</span>
          </div>
        ))}
      </div>
      <div style={{ ...abs(1340, 900, 470), ...liveKick }}>라이브 · OX · 딥러닝은 기계학습의 한 종류다</div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   14~19장 · 23~24장 (옛 slides-c.tsx)
   ══════════════════════════════════════════════════════════════════════ */

/* ── slides-c: 14~19 · 23~24 ──────────────────────────────────────────
   14 지도학습(build) · 15 비지도학습(scene) · 16 강화학습(scene) · 17 방향(build+live)
   18 커넥톰(static+live) · 19 영상(static) · 23 실습(activity) · 24 정리(build+exit)
   좌표는 전부 1920×1080 설계 박스 px. 독 자리(x 660~1260 · y 990~1075)는 비워 둔다. */

/* ── 로컬 아톰 ── */
const CARD_W = 160;
const CARD_H = 192; // card-*.png 266×320 비율
type Kind = 'cat' | 'car' | 'cup';
const KIND_NAME: Record<Kind, string> = { cat: '고양이', car: '자동차', cup: '컵' };

/** 책상 면 — 14·15장이 같은 무대를 공유한다 */
function Desk({ y }: { y: number }) {
  return (
    <div
      style={{
        ...abs(0, y, DW, DH - y),
        background: `color-mix(in srgb, ${C.amber} 7%, var(--surface))`,
        borderTop: '2px solid var(--hair)',
      }}
    />
  );
}

/** 폴라로이드 사진 카드 (배경 투명 PNG) */
function PhotoCard({ x, y, w = CARD_W, kind, i, rot = 0, style }: { x: number; y: number; w?: number; kind: Kind; i: number; rot?: number; style?: CSSProperties }) {
  const h = w * 1.2;
  return (
    <img
      src={IMG.card(kind, i)}
      alt=""
      style={{ ...abs(x, y, w, h), transform: `rotate(${rot}deg)`, filter: 'drop-shadow(0 8px 14px rgba(29,42,38,0.22))', ...style }}
    />
  );
}

/** 카드 아래 흰 띠에 걸린 앰버 라벨 태그 */
function LabelTag({ x, y, rot = 0, children, w = 118 }: { x: number; y: number; rot?: number; children: ReactNode; w?: number }) {
  return (
    <div
      style={{
        ...abs(x, y, w, 34),
        transform: `rotate(${rot}deg)`,
        background: C.amber,
        color: C.ink,
        borderRadius: 8,
        fontWeight: 800,
        fontSize: 20,
        lineHeight: '34px',
        textAlign: 'center',
        boxShadow: '0 4px 10px -4px rgba(29,42,38,0.4)',
      }}
    >
      {children}
    </div>
  );
}

/** 폴더 아이콘 + 이름 + 장수 (플로우 배치용) */
function Folder({ name, count, thumb, scale = 1 }: { name: string; count: string; thumb?: string; scale?: number }) {
  const w = 130 * scale;
  const h = 92 * scale;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14 * scale }}>
      <div style={{ position: 'relative', width: w, height: h, flex: 'none' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: w * 0.44, height: h * 0.24, background: C.amber, borderRadius: `${8 * scale}px ${8 * scale}px 0 0` }} />
        <div
          style={{
            position: 'absolute', left: 0, top: h * 0.16, width: w, height: h * 0.84,
            background: `color-mix(in srgb, ${C.amber} 72%, var(--surface-2))`, borderRadius: 10 * scale,
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}
        >
          {thumb && <img src={thumb} alt="" style={{ width: w * 0.52, height: h * 0.58, objectFit: 'cover', borderRadius: 6, border: '2px solid var(--surface-2)' }} />}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 26 * scale, fontWeight: 800, wordBreak: 'keep-all' }}>{name}</div>
        <div style={{ ...small, fontSize: 18 * scale }}>{count}</div>
      </div>
    </div>
  );
}

/** 코드로 그린 다이얼 손잡이 (6장의 손잡이 회수) */
function Dial({ x, y, size = 84, angle = 0, color = C.green }: { x: number; y: number; size?: number; angle?: number; color?: string }) {
  return (
    <div style={abs(x, y, size, size)}>
      <div
        style={{
          width: size, height: size, borderRadius: '50%', boxSizing: 'border-box',
          border: `4px solid ${color}`, background: 'var(--surface-2)', position: 'relative',
          transform: `rotate(${angle}deg)`, boxShadow: '0 6px 14px -6px rgba(29,42,38,0.35)',
        }}
      >
        <div style={{ position: 'absolute', left: '50%', top: 7, width: 6, height: size * 0.34, marginLeft: -3, borderRadius: 3, background: color }} />
      </div>
    </div>
  );
}

/** 말풍선 (아래 꼬리) */
function Bubble({ x, y, w, color, children }: { x: number; y: number; w: number; color: string; children: ReactNode }) {
  return (
    <div style={{ ...abs(x, y, w), position: 'absolute' }}>
      <div style={{ position: 'relative', border: `3px solid ${color}`, background: 'var(--surface-2)', borderRadius: 16, padding: '10px 18px', fontSize: 30, fontWeight: 800, color, textAlign: 'center' }}>
        {children}
        <div style={{ position: 'absolute', left: '50%', bottom: -12, width: 20, height: 20, marginLeft: -10, background: 'var(--surface-2)', borderRight: `3px solid ${color}`, borderBottom: `3px solid ${color}`, transform: 'rotate(45deg)' }} />
      </div>
    </div>
  );
}

/** 라이브 문항 자리 표시 칩 */
function LiveChip({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return (
    <div style={{ ...abs(x, y), display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderRadius: 999, border: `1.5px dashed ${C.green}`, color: C.green, fontWeight: 800, fontSize: 17, background: C.greenSoft, whiteSpace: 'nowrap' }}>
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: C.green }} />
      {children}
    </div>
  );
}

/* ═══════════════ S14 · 지도학습: 정답이 붙은 사진으로 (build) ═══════════════ */
const S14_CARDS: { kind: Kind; i: number; x: number; y: number; rot: number }[] = [
  { kind: 'cat', i: 1, x: 130, y: 300, rot: -6 },
  { kind: 'car', i: 1, x: 318, y: 318, rot: 4 },
  { kind: 'cup', i: 1, x: 500, y: 296, rot: -3 },
  { kind: 'cat', i: 2, x: 690, y: 322, rot: 7 },
  { kind: 'cup', i: 2, x: 170, y: 548, rot: 5 },
  { kind: 'cat', i: 3, x: 352, y: 534, rot: -5 },
  { kind: 'car', i: 2, x: 540, y: 556, rot: 3 },
  { kind: 'cup', i: 3, x: 722, y: 540, rot: -4 },
];

function S14() {
  const row = (label: string, ans: string, ok: boolean) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 56px', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: 12, background: ok ? C.greenSoft : C.redSoft, fontSize: 22, fontWeight: 700 }}>
      <span>{label}</span>
      <span style={{ color: ok ? C.green : C.red }}>{ans}</span>
      <span style={{ fontSize: 30, fontWeight: 900, color: ok ? C.green : C.red, textAlign: 'center' }}>{ok ? '○' : '✕'}</span>
    </div>
  );
  return (
    <>
      <Desk y={262} />
      <div style={{ ...abs(110, 64), ...kick }}>학습 방법 ① · 무엇을 보고 배우나: 정답</div>
      <Build at={1} style={{ ...abs(110, 96, 940), zIndex: 3 }}>
        <h2 style={{ ...h1, fontSize: 56 }}>지도학습: <span style={{ color: C.green }}>정답이 붙은</span> 사진으로</h2>
        <div style={{ ...body, marginTop: 10 }}>입력과 정답(라벨)이 짝지어진 데이터로 배운다. 답지가 딸린 문제집과 같다.</div>
      </Build>

      {/* 카드 더미 + 라벨 태그 */}
      {S14_CARDS.map((c, k) => (
        <PhotoCard key={k} x={c.x} y={c.y} kind={c.kind} i={c.i} rot={c.rot} />
      ))}
      {S14_CARDS.map((c, k) => (
        <LabelTag key={k} x={c.x + 21} y={c.y + 152} rot={c.rot}>{KIND_NAME[c.kind]}</LabelTag>
      ))}
      <Term term="라벨" gloss="데이터에 붙은 정답 표시. 카드 아래 앰버 태그" size={22} color={C.amber} style={abs(110, 776, 440)} />

      {/* 입력 슬롯 → 모델 상자 → 채점표 */}
      <div style={{ ...abs(950, 372, 150, 178), border: `2.5px dashed ${C.green}`, borderRadius: 14, opacity: 0.8 }} />
      <div style={{ ...abs(950, 556, 150), ...small, fontSize: 18, textAlign: 'center', color: C.green, fontWeight: 700 }}>입력</div>
      <div style={{ ...abs(1104, 436), fontSize: 40, color: C.green, fontWeight: 900, lineHeight: 1 }}>→</div>
      <div style={{ ...abs(1150, 330, 340, 280), ...card, border: `3px solid ${C.green}`, background: 'var(--surface-2)', padding: '22px 26px', boxSizing: 'border-box' }}>
        <div style={{ ...h3, fontSize: 36, color: C.green }}>모델</div>
        <div style={{ ...small, fontSize: 18, marginTop: 4 }}>가중치 덩어리 (9~12장)</div>
        <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[230, 170, 110].map((w) => (
            <div key={w} style={{ width: w, height: 22, borderRadius: 6, background: C.greenSoft, border: `1.5px solid ${C.green}` }} />
          ))}
        </div>
      </div>
      <Dial x={1290} y={640} size={80} />
      <div style={{ ...abs(1382, 654, 200), ...small, fontSize: 19 }}>가중치 손잡이<br />(6장)</div>
      <div style={{ ...abs(1520, 330, 290, 300), ...card, padding: '18px 20px', boxSizing: 'border-box' }}>
        <div style={kick}>채점표</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 56px', gap: 6, marginTop: 10, padding: '0 14px', ...small, fontSize: 17, fontWeight: 700 }}>
          <span>라벨</span><span>모델의 답</span><span style={{ textAlign: 'center' }}>결과</span>
        </div>
      </div>

      {/* at=2: 카드 한 장이 들어가고 「자동차」 답 → 빨간 X + 오차 */}
      <Build at={2} style={{ ...abs(955, 377, 140, 168), zIndex: 4 }}>
        <img src={IMG.card('cat', 1)} alt="" style={{ width: 140, height: 168, transform: 'rotate(-3deg)', filter: 'drop-shadow(0 8px 14px rgba(29,42,38,0.22))' }} />
      </Build>
      <Build at={2} style={{ ...abs(1190, 232, 260), zIndex: 4 }}>
        <Bubble x={0} y={0} w={260} color={C.red}>자동차!</Bubble>
      </Build>
      <Build at={2} style={{ ...abs(1540, 412, 250), zIndex: 4 }}>
        {row('고양이', '자동차', false)}
      </Build>
      <Build at={2} style={{ ...abs(1540, 560, 250), zIndex: 4 }}>
        <div style={{ display: 'inline-flex', padding: '6px 14px', borderRadius: 999, background: C.red, color: 'var(--surface-2)', fontWeight: 800, fontSize: 18 }}>오차: 라벨과 답이 다르다</div>
      </Build>

      {/* at=3: 손잡이가 돌고 다음 카드 → 초록 O */}
      <Build at={3} style={{ ...abs(1290, 640, 80, 80), zIndex: 5 }}>
        <Dial x={0} y={0} size={80} angle={42} color={C.amber} />
      </Build>
      <Build at={3} style={{ ...abs(1382, 704, 220), zIndex: 5 }}>
        <div style={{ ...small, fontSize: 18, color: C.amber, fontWeight: 800 }}>오차만큼 돌린다</div>
      </Build>
      <Build at={3} style={{ ...abs(955, 377, 140, 168), zIndex: 5 }}>
        <img src={IMG.card('cat', 3)} alt="" style={{ width: 140, height: 168, transform: 'rotate(2deg)', filter: 'drop-shadow(0 8px 14px rgba(29,42,38,0.22))' }} />
      </Build>
      <Build at={3} style={{ ...abs(1190, 232, 260), zIndex: 5 }}>
        <Bubble x={0} y={0} w={260} color={C.green}>고양이!</Bubble>
      </Build>
      <Build at={3} style={{ ...abs(1540, 486, 250), zIndex: 5 }}>
        {row('고양이', '고양이', true)}
      </Build>

      {/* at=4: 오늘 실습 연결 띠 */}
      <Build at={4} style={{ ...abs(110, 858, 1700, 108), zIndex: 6 }}>
        <div style={{ height: 108, boxSizing: 'border-box', borderRadius: 18, background: 'var(--surface-2)', border: `2px solid ${C.amber}`, display: 'flex', alignItems: 'center', gap: 40, padding: '0 28px' }}>
          <div style={{ ...kick, color: C.amber, whiteSpace: 'nowrap' }}>오늘 실습</div>
          <Folder name="치와와" count="83장" thumb={`${DATASET_DIR}/치와와/치와와_01.jpg`} scale={0.86} />
          <Folder name="머핀" count="72장" thumb={`${DATASET_DIR}/머핀/머핀_01.jpg`} scale={0.86} />
          <div style={{ ...h3, fontSize: 32, color: C.green, marginLeft: 20, whiteSpace: 'nowrap' }}>폴더 이름이 곧 라벨</div>
          <div style={{ ...body, fontSize: 20, flex: 1, wordBreak: 'keep-all' }}>사진을 폴더에 넣는 순간, 여러분이 라벨을 붙인 것이다.</div>
          <div style={{ ...small, fontSize: 17, whiteSpace: 'nowrap' }}>사진: CC0 · Openverse</div>
        </div>
      </Build>
    </>
  );
}

/* ═══════════════ S15 · 비지도학습: 정답 없이 스스로 모은다 (scene) ═══════════════ */
const S15_W = 130;
const S15_H = 156;
const S15_CENTER: Record<Kind, [number, number]> = { cat: [430, 540], car: [1480, 470], cup: [990, 760] };
const S15_R: Record<Kind, number> = { cat: 216, car: 216, cup: 206 };
const S15_OFF: [number, number, number][] = [[-82, -92, -5], [82, -92, 4], [-82, 92, 3], [82, 92, -4]];
const S15_CARDS: { kind: Kind; i: number; sx: number; sy: number; srot: number }[] = [
  { kind: 'cat', i: 1, sx: 150, sy: 700, srot: -12 },
  { kind: 'cat', i: 2, sx: 860, sy: 300, srot: 9 },
  { kind: 'cat', i: 3, sx: 1300, sy: 780, srot: -7 },
  { kind: 'cat', i: 4, sx: 560, sy: 420, srot: 14 },
  { kind: 'car', i: 1, sx: 240, sy: 320, srot: 6 },
  { kind: 'car', i: 2, sx: 1120, sy: 560, srot: -10 },
  { kind: 'car', i: 3, sx: 700, sy: 780, srot: 11 },
  { kind: 'car', i: 4, sx: 1650, sy: 300, srot: -5 },
  { kind: 'cup', i: 1, sx: 420, sy: 640, srot: 8 },
  { kind: 'cup', i: 2, sx: 1500, sy: 640, srot: -13 },
  { kind: 'cup', i: 3, sx: 1020, sy: 260, srot: 5 },
  { kind: 'cup', i: 4, sx: 1250, sy: 320, srot: -8 },
];
const S15_TAG_POS: Record<Kind, [number, number]> = { cat: [590, 330], car: [1240, 240], cup: [1140, 570] };

function ClusterScene() {
  const t = useSceneTime();
  const slot: Record<Kind, number> = { cat: 0, car: 0, cup: 0 };
  const circleK = interpolate(t, [3.4, 4.2], [0, 1], easeOut);
  const named = t >= 5.5;
  return (
    <>
      {S15_CARDS.map((c, i) => {
        const k = slot[c.kind]++;
        const [ox, oy, orot] = S15_OFF[k];
        const [cx, cy] = S15_CENTER[c.kind];
        const tx = cx + ox - S15_W / 2;
        const ty = cy + oy - S15_H / 2;
        const s = spring(t, 1 + i * 0.12, 1.6);
        const x = lerp(c.sx, tx, s);
        const y = lerp(c.sy, ty, s);
        const rot = lerp(c.srot, orot, s);
        return <PhotoCard key={i} x={x} y={y} w={S15_W} kind={c.kind} i={c.i} rot={rot} />;
      })}
      {/* 점선 원 */}
      <svg style={{ ...abs(0, 0, DW, DH), pointerEvents: 'none' }} aria-hidden>
        {(Object.keys(S15_CENTER) as Kind[]).map((k) => {
          const [cx, cy] = S15_CENTER[k];
          return (
            <circle
              key={k}
              cx={cx}
              cy={cy}
              r={S15_R[k] * lerp(0.9, 1, circleK)}
              fill="none"
              stroke={C.green}
              strokeWidth={3}
              strokeDasharray="12 10"
              opacity={0.75 * circleK}
            />
          );
        })}
      </svg>
      {/* 물음표 → 손글씨 이름표 */}
      {(Object.keys(S15_CENTER) as Kind[]).map((k, idx) => {
        const [x, y] = S15_TAG_POS[k];
        const enter = riseIn(t, 4.2 + idx * 0.15, 0.6, 20);
        const swapFade = t < 5.3 ? 1 : t < 5.5 ? interpolate(t, [5.3, 5.5], [1, 0]) : 1;
        const nameIn = named ? riseIn(t, 5.5 + idx * 0.12, 0.6, 14) : { opacity: 0 };
        return named ? (
          <div key={k} style={{ ...abs(x, y), ...nameIn, transform: `${(nameIn as CSSProperties).transform ?? ''} rotate(-5deg)`, padding: '6px 22px', background: C.amber, color: C.ink, borderRadius: 8, fontSize: 30, fontWeight: 800, fontStyle: 'italic', letterSpacing: '0.02em', boxShadow: '0 6px 14px -6px rgba(29,42,38,0.4)', whiteSpace: 'nowrap' }}>
            {KIND_NAME[k]}
          </div>
        ) : (
          <div key={k} style={{ ...abs(x, y, 60, 60), ...enter, opacity: Math.min(enter.opacity as number, swapFade), borderRadius: '50%', border: `3px solid ${C.amber}`, background: 'var(--surface-2)', color: C.amber, fontSize: 36, fontWeight: 900, lineHeight: '54px', textAlign: 'center' }}>?</div>
        );
      })}
      {/* 캡션 */}
      <div style={{ ...abs(1290, 820, 520), ...riseIn(t, 5.9, 0.7) }}>
        <div style={{ ...h3, fontSize: 34, color: C.amber }}>이름은 사람이 나중에 붙인다</div>
        <div style={{ ...body, fontSize: 21, marginTop: 8 }}>모델은 "이것들끼리 닮았다"까지만 안다. 무리 이름은 결과를 본 사람이 붙인다.</div>
      </div>
      <div style={{ ...abs(1350, 96, 440), ...riseIn(t, 3.6, 0.7) }}>
        <Term term="군집" gloss="닮은 것끼리 묶은 무리. 이름은 아직 없다" size={22} />
      </div>
    </>
  );
}

function S15() {
  return (
    <>
      <Desk y={262} />
      <div style={{ ...abs(110, 64), ...kick }}>학습 방법 ② · 무엇을 보고 배우나: 데이터만</div>
      <div style={{ ...abs(110, 96, 1100) }}>
        <h2 style={{ ...h1, fontSize: 56 }}>비지도학습: <span style={{ color: C.green }}>정답 없이</span> 스스로 모은다</h2>
        <div style={{ ...body, marginTop: 10 }}>라벨 없는 데이터에서 닮은 것끼리 묶거나 숨은 구조를 찾는다. 태그가 하나도 없다.</div>
      </div>
      <Scene freezeAt={7} duration={7.5} markers={[{ time: 1, label: '모이기' }, { time: 4.2, label: '물음표' }, { time: 5.5, label: '이름 붙이기' }]}>
        <ClusterScene />
      </Scene>
    </>
  );
}

/* ═══════════════ S16 · 강화학습: 해 보고, 점수를 받고, 고친다 (scene) ═══════════════ */
const G = { x0: 170, speed: 500, ground: 800, flagX: 1640, pitDepth: 150 };
const PLATS: [number, number][] = [[140, 520], [640, 1060], [1180, 1720]];
const PITS: [number, number][] = [[520, 640], [1060, 1180]];
const ATT = [
  { start: 0, end: 2.0, jumps: [] as number[], fall: 0 as number | null },
  { start: 2.0, end: 4.5, jumps: [470], fall: 1 as number | null },
  { start: 4.5, end: 8.6, jumps: [470, 1010], fall: null as number | null },
];
const OUT_T = [1.06, 4.14, 7.44]; // 결과가 확정되는 시각
const OUT_V = [0.15, 0.5, 1.0]; // 보상
const OUT_LABEL = ['첫 구덩이에 빠졌다 · 보상 낮음', '둘째 구덩이에 빠졌다 · 보상 중간', '깃발 도달 · 보상 가득'];
const JUMP_DUR = 0.55;
const JUMP_H = 130;

function cubeAt(t: number) {
  let a = ATT.length - 1;
  for (let i = 0; i < ATT.length; i++) if (t < ATT[i].end) { a = i; break; }
  const A = ATT[a];
  const u = Math.max(0, t - A.start);
  let x = G.x0 + G.speed * u;
  let dy = 0;
  let jumping = false;
  let fallen = 0;
  for (const xj of A.jumps) {
    const uj = (xj - G.x0) / G.speed;
    if (u >= uj && u <= uj + JUMP_DUR) { dy = -JUMP_H * Math.sin((Math.PI * (u - uj)) / JUMP_DUR); jumping = true; }
  }
  if (A.fall !== null) {
    const uf = (PITS[A.fall][0] + 30 - G.x0) / G.speed;
    if (u > uf) {
      const k = u - uf;
      x = G.x0 + G.speed * uf + 50 * clamp01(k / 0.35);
      dy = Math.min(G.pitDepth, 900 * k * k);
      fallen = clamp01(k / 0.4);
      jumping = false;
    }
  }
  let reached = false;
  if (x >= G.flagX) { x = G.flagX; reached = true; }
  return { a, u, x, y: G.ground + dy, jumping, fallen, reached, moving: fallen === 0 && !reached };
}
const rewardColor = (v: number) => (v < 0.3 ? C.red : v < 0.75 ? C.amber : C.green);
function gaugeAt(t: number) {
  for (let a = 0; a < ATT.length; a++) if (t < ATT[a].end) return interpolate(t, [OUT_T[a], OUT_T[a] + 0.4], [0, OUT_V[a]], easeOut);
  return OUT_V[2];
}
/* 컨트롤러 SVG(viewBox 0 0 520 320) 위 눌린 버튼 표시 위치 — 실물 SVG를 보고 맞춘다 */
const PAD_RIGHT: [number, number] = [190, 160];
const PAD_A: [number, number] = [405, 150];
/* 컨트롤러 이미지 좌상단 — 링 위치가 여기서 유도된다 */
const PAD_ORIGIN: [number, number] = [120, 290];

function StageScene() {
  const t = useSceneTime();
  const cb = cubeAt(t);
  const gauge = gaugeAt(t);
  const gcol = rewardColor(gauge || 0.01);
  const lineK = interpolate(t, [7.7, 8.4], [0, 1], easeInOut);
  const padK = 300 / 520;
  const ring = (p: [number, number], on: boolean, label: string) => (
    <div style={{ ...abs(PAD_ORIGIN[0] + p[0] * padK - 19, PAD_ORIGIN[1] + p[1] * padK - 19, 38, 38), borderRadius: '50%', border: `4px solid ${C.amber}`, boxShadow: `0 0 0 6px ${C.amberSoft}`, opacity: on ? 1 : 0, transition: 'opacity 0.12s' }} title={label} />
  );
  const flagWave = cb.reached ? Math.sin(t * 9) * 6 : 0;
  return (
    <>
      {/* 무대 (코드 도형) */}
      <svg style={{ ...abs(0, 0, DW, DH), pointerEvents: 'none' }} aria-hidden>
        {PITS.map(([a, b], i) => (
          <rect key={`p${i}`} x={a} y={G.ground} width={b - a} height={G.pitDepth + 12} fill={`color-mix(in srgb, ${C.ink} 62%, ${C.paper})`} />
        ))}
        {PLATS.map(([a, b], i) => (
          <g key={`pl${i}`}>
            <rect x={a} y={G.ground} width={b - a} height={162} rx={8} fill={`color-mix(in srgb, ${C.green} 16%, var(--surface-2))`} stroke="var(--hair)" strokeWidth={1.5} />
            <rect x={a} y={G.ground - 4} width={b - a} height={9} rx={4} fill={C.green} />
          </g>
        ))}
        {/* 깃발 */}
        <rect x={G.flagX + 18} y={G.ground - 150} width={6} height={150} fill={C.ink} />
        <polygon points={`${G.flagX + 24},${G.ground - 150} ${G.flagX + 96 + flagWave},${G.ground - 122} ${G.flagX + 24},${G.ground - 94}`} fill={cb.reached ? C.green : C.amber} />
        {/* 낙하 표시 */}
        {[0, 1].map((p) => {
          const on = ATT.some((A, i) => A.fall === p && t >= ATT[i].start && t < ATT[i].end) && cb.fallen > 0.3;
          return on ? (
            <text key={`x${p}`} x={PITS[p][0] + 60} y={G.ground - 30} textAnchor="middle" fontSize={64} fontWeight={900} fill={C.red}>✕</text>
          ) : null;
        })}
      </svg>
      {/* 큐브 캐릭터 */}
      <div style={{ ...abs(cb.x - 20, cb.y - 40, 40, 40), borderRadius: 7, background: C.amber, border: `3px solid ${C.ink}`, boxSizing: 'border-box', opacity: 1 - cb.fallen * 0.55, transform: `rotate(${cb.fallen * 35}deg) scaleY(${cb.jumping ? 1.08 : 1})` }}>
        <div style={{ position: 'absolute', left: 8, top: 11, width: 6, height: 6, borderRadius: '50%', background: C.ink }} />
        <div style={{ position: 'absolute', left: 22, top: 11, width: 6, height: 6, borderRadius: '50%', background: C.ink }} />
      </div>
      {/* 시도 라벨 + 결과 */}
      <div style={{ ...abs(700, 320, 620), display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ padding: '8px 20px', borderRadius: 999, background: C.ink, color: C.paper, fontWeight: 800, fontSize: 24, whiteSpace: 'nowrap', ...riseIn(t, ATT[cb.a].start, 0.5, 10) }}>시도 {cb.a + 1}</div>
        <div style={{ ...body, fontSize: 24, fontWeight: 700, color: rewardColor(OUT_V[cb.a]), opacity: t >= OUT_T[cb.a] ? 1 : 0, transition: 'opacity 0.3s' }}>{OUT_LABEL[cb.a]}</div>
      </div>
      {/* 컨트롤러 + 눌린 버튼 */}
      <img src={SVG.gamepad} alt="" style={{ ...abs(PAD_ORIGIN[0], PAD_ORIGIN[1], 300, 185) }} />
      {ring(PAD_RIGHT, cb.moving, '이동')}
      {ring(PAD_A, cb.jumping, '점프')}
      <div style={{ ...abs(120, 490), display: 'flex', gap: 10 }}>
        {[['→ 이동', cb.moving], ['A 점프', cb.jumping]].map(([lab, on]) => (
          <div key={lab as string} style={{ padding: '6px 14px', borderRadius: 999, border: `1.5px solid ${on ? C.amber : 'var(--hair)'}`, background: on ? C.amberSoft : 'transparent', color: on ? C.ink : 'var(--fg-faint)', fontWeight: 800, fontSize: 18, transition: 'all 0.15s' }}>{lab as string}</div>
        ))}
      </div>
      <Term term="에이전트" gloss="행동하는 주체. 5장의 그 말과 같은 뿌리" size={22} style={abs(440, 320, 320)} />

      {/* 보상 게이지 */}
      <div style={{ ...abs(1738, 84, 64, 260), borderRadius: 14, border: `3px solid ${C.ink}`, background: 'var(--surface-2)', boxSizing: 'border-box', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${gauge * 100}%`, background: gcol, transition: 'background 0.3s' }} />
      </div>
      <div style={{ ...abs(1722, 350, 100), ...small, fontSize: 18, fontWeight: 800, textAlign: 'center', color: C.ink }}>보상</div>
      {/* 시도-보상 그래프 */}
      <div style={{ ...abs(1400, 84, 310, 260), ...card, padding: '14px 18px', boxSizing: 'border-box' }}>
        <div style={kick}>시도 → 보상</div>
        <svg width={274} height={200} style={{ display: 'block', marginTop: 4 }}>
          <line x1={30} y1={170} x2={264} y2={170} stroke="var(--hair)" strokeWidth={2} />
          <line x1={30} y1={10} x2={30} y2={170} stroke="var(--hair)" strokeWidth={2} />
          <g style={{ clipPath: `inset(0 ${(1 - lineK) * 100}% 0 0)` }}>
            <polyline points={OUT_V.map((v, i) => `${70 + i * 90},${170 - v * 150}`).join(' ')} fill="none" stroke={C.green} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
          </g>
          {OUT_V.map((v, i) => {
            const s = spring(t, OUT_T[i], 0.5);
            return (
              <g key={i} transform={`translate(${70 + i * 90} ${170 - v * 150}) scale(${s})`}>
                <circle r={11} fill={rewardColor(v)} stroke="var(--surface-2)" strokeWidth={3} />
              </g>
            );
          })}
          {[1, 2, 3].map((n, i) => (
            <text key={n} x={70 + i * 90} y={194} textAnchor="middle" fontSize={16} fontWeight={700} fill="var(--fg-faint)">시도 {n}</text>
          ))}
        </svg>
      </div>
      <Term term="보상" gloss="행동이 좋았는지 알려 주는 점수. 정답이 아니다" size={22} style={abs(1400, 356, 330)} />
      {/* 마무리 캡션 */}
      <div style={{ ...abs(560, 580, 800), textAlign: 'center', ...riseIn(t, 7.7, 0.7) }}>
        <div style={{ ...h3, fontSize: 36, color: C.green }}>보상이 커지는 쪽으로 행동을 고친다</div>
        <div style={{ ...body, fontSize: 21, marginTop: 6 }}>시도 → 보상 → 행동 규칙 수정 → 다시 시도</div>
      </div>
    </>
  );
}

function S16() {
  return (
    <>
      <div style={{ ...abs(110, 56), ...kick }}>학습 방법 ③ · 무엇을 보고 배우나: 보상</div>
      <div style={{ ...abs(110, 88, 1000) }}>
        <h2 style={{ ...h1, fontSize: 54 }}>강화학습: 해 보고, <span style={{ color: C.green }}>점수를 받고</span>, 고친다</h2>
        <div style={{ ...body, marginTop: 8 }}>정답 대신 보상을 받고, 보상이 커지는 쪽으로 행동을 바꾼다. 새 스테이지를 깰 때 하는 그것이다.</div>
      </div>
      <Scene freezeAt={8.4} duration={8.6} markers={[{ time: 0, label: '시도 1' }, { time: 2, label: '시도 2' }, { time: 4.5, label: '시도 3' }, { time: 7.7, label: '정리' }]}>
        <StageScene />
      </Scene>
    </>
  );
}

/* ═══════════════ S17 · 더 나아가는 방향 (build + live) ═══════════════ */
const AX_Y = 500;
const ST = [
  { x: 380, name: '정답', method: '지도학습' },
  { x: 620, name: '데이터만', method: '비지도학습' },
  { x: 860, name: '보상', method: '강화학습' },
];
function StationIcon({ kind }: { kind: 0 | 1 | 2 }) {
  if (kind === 0)
    return (
      <div style={{ width: 66, height: 38, borderRadius: 8, background: C.amber, position: 'relative', boxShadow: '0 4px 10px -4px rgba(29,42,38,0.4)' }}>
        <div style={{ position: 'absolute', left: 8, top: 14, width: 10, height: 10, borderRadius: '50%', background: 'var(--surface-2)' }} />
        <div style={{ position: 'absolute', left: 26, top: 15, width: 30, height: 8, borderRadius: 4, background: C.ink, opacity: 0.6 }} />
      </div>
    );
  if (kind === 1)
    return (
      <svg width={66} height={66} viewBox="0 0 66 66">
        <circle cx={33} cy={33} r={29} fill="none" stroke={C.green} strokeWidth={3} strokeDasharray="8 6" />
        <circle cx={24} cy={28} r={7} fill={C.green} />
        <circle cx={42} cy={26} r={7} fill={C.green} />
        <circle cx={33} cy={43} r={7} fill={C.green} />
      </svg>
    );
  return (
    <div style={{ width: 26, height: 66, borderRadius: 7, border: `3px solid ${C.ink}`, boxSizing: 'border-box', position: 'relative', overflow: 'hidden', background: 'var(--surface-2)' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '70%', background: C.green }} />
    </div>
  );
}
function Station({ x, y, name, method, dir }: { x: number; y: number; name: string; method: string; dir: 'below' | 'above' }) {
  return (
    <div style={{ ...abs(x - 110, dir === 'below' ? y + 30 : y - 122, 220), textAlign: 'center' }}>
      <div style={{ fontSize: 30, fontWeight: 800, wordBreak: 'keep-all' }}>{name}</div>
      <div style={{ ...small, fontSize: 19, color: C.green, fontWeight: 700, marginTop: 4 }}>{method}</div>
    </div>
  );
}

function S17() {
  return (
    <>
      <div style={{ ...abs(110, 56), ...kick }}>더 나아가는 방향</div>
      <div style={{ ...abs(110, 88, 1000) }}>
        <h2 style={{ ...h1, fontSize: 54 }}>무엇을 보고 배우느냐가 <span style={{ color: C.green }}>달라진다</span></h2>
        <div style={{ ...body, marginTop: 8 }}>세 방법의 차이는 딱 하나, 무엇을 보고 배우느냐. 요즘 인공지능은 그 "무엇"을 새로 만든다.</div>
      </div>
      {/* 굵은 가로축 */}
      <div style={{ ...abs(110, AX_Y - 4, 1660, 8), borderRadius: 4, background: C.green }} />
      <div style={{ ...abs(110, AX_Y - 44), fontSize: 22, fontWeight: 800, color: 'var(--fg-faint)', whiteSpace: 'nowrap' }}>무엇을 보고 배우는가</div>
      {ST.map((s) => (
        <div key={s.name} style={{ ...abs(s.x - 16, AX_Y - 16, 32, 32), borderRadius: '50%', background: C.green, border: '4px solid var(--surface-2)', boxSizing: 'border-box', boxShadow: `0 0 0 3px ${C.green}` }} />
      ))}
      {ST.map((s) => (
        <Station key={s.name} x={s.x} y={AX_Y} name={s.name} method={s.method} dir="below" />
      ))}
      <div style={{ ...abs(300, AX_Y + 128, 680), borderTop: '2px solid var(--hair)', paddingTop: 8, ...small, fontSize: 18, textAlign: 'center' }}>지금까지 (14~16장): 사람이 정답을 주거나 · 아예 없거나 · 점수로</div>
      <LiveChip x={110} y={880}>라이브 · 선택 · 셋을 가르는 기준은?</LiveChip>

      {/* at=1: 아이콘 회수 */}
      {ST.map((s, i) => (
        <Build key={s.name} at={1} style={{ ...abs(s.x - 33, AX_Y - 112, 66, 66), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <StationIcon kind={i as 0 | 1 | 2} />
        </Build>
      ))}
      {/* at=2: 자기지도학습 */}
      <Build at={2} style={{ ...abs(940, AX_Y - 4, 300, 8) }}>
        <div style={{ height: 8, background: C.green, opacity: 0.35 }} />
      </Build>
      <Build at={2} style={{ ...abs(1220 - 16, AX_Y - 16, 32, 32) }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.amber, border: '4px solid var(--surface-2)', boxSizing: 'border-box', boxShadow: `0 0 0 3px ${C.amber}` }} />
      </Build>
      <Build at={2} style={{ ...abs(1040, AX_Y - 150, 360) }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: C.amber, wordBreak: 'keep-all' }}>자기지도학습</div>
        <div style={{ ...body, fontSize: 20, marginTop: 4 }}>정답을 데이터 안에서 스스로 만든다</div>
      </Build>
      <Build at={2} style={{ ...abs(996, AX_Y + 50, 374, 176), zIndex: 4 }}>
        <div style={{ ...card, padding: '14px 20px', boxSizing: 'border-box', height: 176 }}>
          <div style={{ ...kick, color: C.amber }}>예시 · 챗봇의 기본 학습</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 8, wordBreak: 'keep-all' }}>
            나는 급식으로 <span style={{ display: 'inline-block', minWidth: 90, borderBottom: `4px solid ${C.amber}`, color: C.amber, textAlign: 'center' }}>___</span> 먹었다
          </div>
          <div style={{ ...small, fontSize: 18, marginTop: 10 }}>→ 가린 다음 단어 맞히기. 정답은 원래 문장 안에 이미 있다.</div>
        </div>
      </Build>
      {/* at=3: 인간 피드백 강화학습 */}
      <Build at={3} style={{ ...abs(1240, AX_Y - 4, 320, 8) }}>
        <div style={{ height: 8, background: C.green, opacity: 0.35 }} />
      </Build>
      <Build at={3} style={{ ...abs(1560 - 16, AX_Y - 16, 32, 32) }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.amber, border: '4px solid var(--surface-2)', boxSizing: 'border-box', boxShadow: `0 0 0 3px ${C.amber}` }} />
      </Build>
      <Build at={3} style={{ ...abs(1400, AX_Y + 30, 410) }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: C.amber, wordBreak: 'keep-all' }}>인간 피드백 강화학습</div>
        <div style={{ ...body, fontSize: 20, marginTop: 4 }}>사람이 고른 "더 나은 답"이 보상</div>
      </Build>
      <Build at={3} style={{ ...abs(1400, 236, 410, 214), zIndex: 4 }}>
        <div style={{ ...card, padding: '14px 20px', boxSizing: 'border-box', height: 214 }}>
          <div style={{ ...kick, color: C.amber }}>예시 · 챗봇을 다듬는 단계</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>어느 답이 더 좋나요?</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
            {['답 A', '답 B'].map((a, i) => (
              <div key={a} style={{ flex: 1, padding: '10px 12px', borderRadius: 12, border: `2px solid ${i ? C.amber : 'var(--hair)'}`, background: i ? C.amberSoft : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 22, fontWeight: 800 }}>
                {a}
                {i === 1 && (
                  <svg width={28} height={28} viewBox="0 0 28 28"><polyline points="4,15 11,22 24,6" fill="none" stroke={C.amber} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" /></svg>
                )}
              </div>
            ))}
          </div>
          <div style={{ ...small, fontSize: 18, marginTop: 10 }}>사람이 고른 쪽이 보상이 된다. 여러분의 엄지 클릭도 이 데이터다.</div>
        </div>
      </Build>
      {/* at=4: 화살촉 + 한 줄 */}
      <Build at={4} style={{ ...abs(1560, AX_Y - 4, 220, 8) }}>
        <div style={{ height: 8, background: C.green }} />
      </Build>
      <Build at={4} style={{ ...abs(1770, AX_Y - 22, 44, 44) }}>
        <svg width={44} height={44} viewBox="0 0 44 44"><polygon points="2,2 42,22 2,42 12,22" fill={C.green} /></svg>
      </Build>
      <Build at={4} style={{ ...abs(1040, 800, 770), zIndex: 3 }}>
        <div style={{ ...h3, fontSize: 32, color: C.green }}>라벨 붙이는 손은 줄고, 배울 거리를 스스로 만든다</div>
        <div style={{ ...body, fontSize: 20, marginTop: 6 }}>여러분의 클릭 하나가 인공지능이 배우는 재료가 된다.</div>
      </Build>
    </>
  );
}

/* ═══════════════ S18 · 초파리의 뇌 지도, 커넥톰 (static + live) ═══════════════ */
const FLY = { x: 30, y: 176, w: 900, h: 722 }; // fruit-fly.png 1307×1048, 좌우 반전해 머리가 오른쪽
const HEAD: [number, number] = [FLY.x + FLY.w * 0.9, FLY.y + FLY.h * 0.4];
const S18_LINES = Array.from({ length: 18 }, (_, i) => {
  const ey = 246 + (i / 17) * 330;
  const bend = ((i * 37) % 11) / 11; // 결정론적 흔들림
  return { ey, cx: lerp(HEAD[0] + 40, 1040, 0.35 + bend * 0.3), cy: lerp(HEAD[1], ey, 0.55 + bend * 0.2), op: 0.22 + bend * 0.32, w: 1.4 + bend * 1.6 };
});

function S18() {
  return (
    <>
      <div style={{ ...abs(110, 56), ...kick }}>진짜 뉴런 · 2026년 9월</div>
      <div style={{ ...abs(110, 88, 900) }}>
        <h2 style={{ ...h1, fontSize: 54 }}>초파리의 뇌 지도, <span style={{ color: C.green }}>커넥톰</span></h2>
      </div>
      <img src={IMG.fruitFly} alt="" style={{ ...abs(FLY.x, FLY.y, FLY.w, FLY.h), transform: 'scaleX(-1)' }} />
      <svg style={{ ...abs(0, 0, DW, DH), pointerEvents: 'none' }} aria-hidden>
        {S18_LINES.map((l, i) => (
          <path key={i} d={`M${HEAD[0]},${HEAD[1]} Q${l.cx},${l.cy} 1072,${l.ey}`} fill="none" stroke={C.green} strokeWidth={l.w} opacity={l.op} strokeLinecap="round" />
        ))}
        {S18_LINES.map((l, i) => (
          <circle key={`d${i}`} cx={1072} cy={l.ey} r={4} fill={C.green} opacity={l.op + 0.2} />
        ))}
        <circle cx={HEAD[0]} cy={HEAD[1]} r={10} fill={C.green} opacity={0.85} />
      </svg>
      <LiveChip x={1090} y={72}>라이브 · 선택 · 커넥톰은 무엇의 지도?</LiveChip>
      <div style={{ ...abs(1090, 190, 720) }}>
        <div style={{ ...mono, fontSize: 128, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: C.green }}>166,700</div>
        <div style={{ ...body, fontSize: 26, marginTop: 6 }}><b style={{ color: C.ink }}>뉴런</b> · 수컷 초파리 중추신경계 전체(뇌 + 배쪽 신경삭)</div>
      </div>
      <div style={{ ...abs(1090, 392, 720) }}>
        <div style={{ ...mono, fontSize: 84, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: C.amber }}>11,710</div>
        <div style={{ ...body, fontSize: 26, marginTop: 6 }}><b style={{ color: C.ink }}>뉴런 유형</b> · 서로 어떻게 이어졌는지 전부 그렸다</div>
      </div>
      <Term term="커넥톰" gloss="뉴런 사이 연결을 전부 그린 지도. 역이 뉴런, 선로가 연결인 노선도" size={22} style={abs(1090, 596, 700)} />
      <div style={{ ...abs(1090, 712, 720, 150), ...card, padding: '16px 22px', boxSizing: 'border-box' }}>
        <div style={kick}>사실 카드</div>
        <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, wordBreak: 'keep-all' }}>『Cell』 2026-09-03 게재 · <span style={{ color: C.green }}>데이터 공개</span></div>
        <div style={{ ...small, fontSize: 18, marginTop: 6 }}>야넬리아(HHMI) · MRC LMB · 케임브리지 · Google Research. 누구나 내려받을 수 있다.</div>
      </div>
      <div style={{ ...abs(110, 918, 1700, 62), borderRadius: 14, background: C.amberSoft, border: `1.5px solid ${C.amber}`, display: 'flex', alignItems: 'center', gap: 22, padding: '0 24px', boxSizing: 'border-box' }}>
        <div style={{ ...kick, color: C.amber }}>다음 장</div>
        <div style={{ fontSize: 26, fontWeight: 800 }}>이 지도를 게임에 넣으면?</div>
        <img src={SVG.gamepad} alt="" style={{ width: 84, height: 52 }} />
        <div style={{ ...small, fontSize: 18 }}>논문이 나온 그 주에 사람들이 해 본 일</div>
      </div>
    </>
  );
}

/* ═══════════════ S19 · 초파리 뇌가 마인크래프트를 움직인다 (static) ═══════════════ */
function S19() {
  return (
    <>
      <div style={{ ...abs(110, 50), ...kick }}>커넥톰 시연 · Ro0oney · 2026-09-07 업로드</div>
      <div style={{ ...abs(110, 82, 1230) }}>
        <h2 style={{ ...h1, fontSize: 50 }}>초파리 뇌가 마인크래프트를 움직인다</h2>
      </div>
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${YT_ID}`}
        title="I Put A Fly's Conscious Brain into Minecraft"
        allow="encrypted-media; picture-in-picture"
        allowFullScreen
        style={{ ...abs(110, 166, 1216, 684), border: 0, borderRadius: 18, background: C.ink, boxShadow: 'var(--shadow)' }}
      />
      <div style={{ ...abs(110, 868, 1220), display: 'flex', alignItems: 'center', gap: 22 }}>
        <a href={YT_WATCH} target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderRadius: 999, border: `2px solid ${C.green}`, color: C.green, fontWeight: 800, fontSize: 21, textDecoration: 'underline', textUnderlineOffset: 4, whiteSpace: 'nowrap' }}>
          youtube.com/watch?v={YT_ID} ↗ 새 탭
        </a>
        <div style={{ ...small, fontSize: 18 }}>임베드가 막히면 이 링크로 연다</div>
      </div>
      <div style={{ ...abs(110, 932, 1220), ...body, fontSize: 21 }}>다른 사람들은 같은 지도를 Super Mario 64 · 둠 · 비트세이버에도 연결했다.</div>

      <div style={{ ...abs(1380, 166, 430, 372), ...card, padding: '22px 24px', boxSizing: 'border-box' }}>
        <Term term="시뮬레이션" gloss="지도의 연결을 컴퓨터 안에서 그대로 흉내 내 신호를 흘려보내는 것" size={24} />
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[['눈', '게임 화면을 신호로 넣는다'], ['뇌', '166,700개 뉴런의 연결대로 신호가 흐른다'], ['다리', '나온 신호를 이동 키로 뽑는다']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
              <span style={{ flex: 'none', width: 46, padding: '3px 0', textAlign: 'center', borderRadius: 8, background: C.greenSoft, color: C.green, fontWeight: 800, fontSize: 18 }}>{k}</span>
              <span style={{ ...body, fontSize: 19 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...abs(1380, 566, 430, 214), ...card, padding: '18px 24px', boxSizing: 'border-box', borderLeft: `6px solid ${C.amber}` }}>
        <div style={{ fontSize: 24, fontWeight: 800, wordBreak: 'keep-all' }}>오늘 배운 학습과 다른 점</div>
        <div style={{ ...body, fontSize: 20, marginTop: 8 }}>학습은 데이터를 보고 연결(가중치)을 만들어 가는 것. 이 시연은 이미 있는 연결을 옮겨 온 것이다.</div>
      </div>
      <div style={{ ...abs(1380, 806), display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderRadius: 999, background: C.redSoft, border: `1.5px solid ${C.red}`, color: C.red, fontWeight: 800, fontSize: 18, whiteSpace: 'nowrap' }}>
        주의 · 제목의 '의식이 있는'은 과장
      </div>
      <div style={{ ...abs(1380, 856, 430), ...small, fontSize: 17 }}>연결 지도가 있다고 의식이 생기지는 않는다. 노선도를 들고 있다고 지하철이 달리지 않듯이.</div>
    </>
  );
}

/* ═══════════════ S23 · 실습: 치와와와 머핀을 가르는 모델 만들기 (activity) ═══════════════ */
function StepNo({ n }: { n: string }) {
  return <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.green, color: 'var(--accent-ink)', fontSize: 28, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{n}</div>;
}
function Qr({ src, size, label }: { src: string; size: number; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <img src={src} alt="" style={{ width: size, height: size, borderRadius: 10, border: '1px solid var(--hair)', background: 'var(--surface-2)' }} />
      <div style={{ ...small, fontSize: 17, whiteSpace: 'nowrap' }}>{label}</div>
    </div>
  );
}

function S23() {
  return (
    <>
      <div style={{ ...abs(110, 50), ...kick }}>실습 · 이 화면은 활동 내내 띄워 둔다</div>
      <div style={{ ...abs(110, 82, 1100) }}>
        <h2 style={{ ...h1, fontSize: 50 }}>치와와와 머핀을 가르는 <span style={{ color: C.green }}>모델 만들기</span></h2>
      </div>
      {/* ① 데이터셋 */}
      <div style={{ ...abs(110, 190, 1060), display: 'flex', alignItems: 'center', gap: 24 }}>
        <StepNo n="1" />
        <div style={{ flex: 1 }}>
          <LinkButton href={DATASET_ZIP} size={32} tone="amber" download sub="압축을 풀면 치와와 · 머핀 · 시험 폴더와 읽어주세요.txt가 있다">데이터셋 내려받기 (zip, 약 9MB)</LinkButton>
        </div>
        <Qr src={`${BASE}/images/qr-dataset.png`} size={170} label="폰으로 내려받기" />
      </div>
      {/* ② Teachable Machine */}
      <div style={{ ...abs(110, 392, 1060), display: 'flex', alignItems: 'center', gap: 24 }}>
        <StepNo n="2" />
        <div style={{ flex: 1 }}>
          <LinkButton href={TM_URL} size={26} sub="21장 순서로 클래스 둘 만들기 → 22장 순서로 학습 · 미리보기(파일) · 시험 16장 · 내보내기 · 링크 복사">Teachable Machine 열기</LinkButton>
        </div>
        <Qr src={`${BASE}/images/qr-tm.png`} size={150} label="teachablemachine.withgoogle.com" />
      </div>
      {/* ③ 활동지 */}
      <div style={{ ...abs(110, 580, 1060), display: 'flex', alignItems: 'center', gap: 24 }}>
        <StepNo n="3" />
        <div style={{ flex: 1 }}>
          <LinkButton href={ACTIVITY_URL} size={30} sub="A 공유 링크와 클래스별 샘플 수 · B 관찰할 시험 사진 한 장(판정 · 출력값 · 이유) · C 학습 방법 → 제출">활동지 열기</LinkButton>
        </div>
        <Qr src={`${BASE}/images/qr-activity.png`} size={230} label="폰으로 활동지 열기" />
      </div>
      {/* 체크리스트 */}
      <div style={{ ...abs(1230, 190, 580, 566), ...card, padding: '22px 26px', boxSizing: 'border-box' }}>
        <div style={kick}>체크리스트</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
          {[
            ['클래스 2개', '치와와 · 머핀'],
            ['학습 데이터', '치와와 83장 · 머핀 72장'],
            ['시험 데이터 16장으로 확인', '정답은 시험-정답.csv'],
            ['관찰할 사진 한 장 고르기', '출력값이 비슷하거나, 틀렸거나, 잘 분류한 것'],
            ['공유 링크 제출', '새 탭에서 열어 확인한 뒤 활동지에'],
          ].map(([a, b]) => (
            <div key={a} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, border: `2.5px solid ${C.green}`, flex: 'none', marginTop: 4 }} />
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, wordBreak: 'keep-all' }}>{a}</div>
                <div style={{ ...small, fontSize: 18 }}>{b}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...abs(1230, 782, 580, 130), borderRadius: 16, background: C.amberSoft, border: `2px solid ${C.amber}`, padding: '14px 22px', boxSizing: 'border-box' }}>
        <div style={{ ...kick, color: C.amber }}>규칙</div>
        <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6, wordBreak: 'keep-all' }}>시험 폴더 사진은 학습에 넣지 않는다</div>
        <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4, wordBreak: 'keep-all' }}>학습 중에는 탭을 옮기지 않는다</div>
      </div>
      <div style={{ ...abs(110, 946, 540), ...small, fontSize: 17 }}>사진: CC0 · 퍼블릭 도메인, Openverse 수집. 사진별 출처는 zip 안 출처.csv</div>
    </>
  );
}

/* ═══════════════ S24 · 오늘 배운 것, 한 장으로 (build + exit) ═══════════════ */
const TL = [
  { name: '규칙 기반', chip: '사람이 규칙을 쓴다', icon: 'clipboard' },
  { name: '기계학습', chip: '예시를 보여 준다', icon: 'pile' },
  { name: '퍼셉트론', chip: '1957 · 1958', icon: 'neuron' },
  { name: '층 쌓기', chip: '1969 · XOR', icon: 'curve' },
  { name: '역전파', chip: '1986', icon: 'wave' },
  { name: '딥러닝', chip: '2012 · AlexNet', icon: 'layers' },
] as const;

function TlIcon({ kind }: { kind: (typeof TL)[number]['icon'] }) {
  const s = 44;
  switch (kind) {
    case 'clipboard':
      return (
        <svg width={s} height={s} viewBox="0 0 44 44"><rect x={8} y={6} width={28} height={34} rx={4} fill="none" stroke={C.ink} strokeWidth={3} /><rect x={16} y={2} width={12} height={8} rx={2} fill={C.ink} /><line x1={14} y1={18} x2={30} y2={18} stroke={C.green} strokeWidth={3} /><line x1={14} y1={26} x2={30} y2={26} stroke={C.green} strokeWidth={3} /><line x1={14} y1={34} x2={24} y2={34} stroke={C.green} strokeWidth={3} /></svg>
      );
    case 'pile':
      return (
        <svg width={s} height={s} viewBox="0 0 44 44"><rect x={4} y={12} width={26} height={28} rx={3} fill="var(--surface-2)" stroke={C.ink} strokeWidth={3} transform="rotate(-8 17 26)" /><rect x={14} y={6} width={26} height={28} rx={3} fill={C.amberSoft} stroke={C.ink} strokeWidth={3} transform="rotate(6 27 20)" /></svg>
      );
    case 'neuron':
      return (
        <svg width={s} height={s} viewBox="0 0 44 44"><line x1={4} y1={10} x2={20} y2={22} stroke={C.ink} strokeWidth={3} /><line x1={4} y1={22} x2={20} y2={22} stroke={C.ink} strokeWidth={3} /><line x1={4} y1={34} x2={20} y2={22} stroke={C.ink} strokeWidth={3} /><circle cx={24} cy={22} r={9} fill={C.green} /><line x1={33} y1={22} x2={42} y2={22} stroke={C.ink} strokeWidth={3} /></svg>
      );
    case 'curve':
      return (
        <svg width={s} height={s} viewBox="0 0 44 44"><path d="M4,34 C14,34 12,10 22,10 S30,34 40,30" fill="none" stroke={C.green} strokeWidth={3} /><circle cx={10} cy={14} r={4} fill={C.amber} /><circle cx={34} cy={14} r={4} fill={C.amber} /><circle cx={22} cy={30} r={4} fill={C.ink} /></svg>
      );
    case 'wave':
      return (
        <svg width={s} height={s} viewBox="0 0 44 44"><path d="M40,20 C32,12 28,28 20,20 S8,12 4,20" fill="none" stroke={C.green} strokeWidth={3} /><path d="M40,32 C32,24 28,40 20,32 S8,24 4,32" fill="none" stroke={C.green} strokeWidth={3} opacity={0.5} /><polygon points="4,8 14,3 14,13" fill={C.red} /><line x1={14} y1={8} x2={30} y2={8} stroke={C.red} strokeWidth={3} /></svg>
      );
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 44 44">{[6, 16, 26, 36].map((y, i) => <rect key={y} x={6 + i * 2} y={y - 3} width={32 - i * 4} height={7} rx={2} fill={C.green} opacity={0.35 + i * 0.2} />)}</svg>
      );
  }
}

function Timeline() {
  const { clicks, isStatic } = useDeck();
  const on = isStatic || clicks >= 1;
  const ys = [22, 168, 314, 460, 606, 752];
  return (
    <div style={{ position: 'relative', width: 740, height: 820, clipPath: on ? 'inset(0 0 0% 0)' : 'inset(0 0 100% 0)', transition: 'clip-path 1.6s cubic-bezier(0.4,0,0.2,1)' }}>
      <div style={{ position: 'absolute', left: 32, top: 22, width: 5, height: 736, background: C.green, borderRadius: 3 }} />
      {TL.map((n, i) => (
        <div key={n.name} style={{ position: 'absolute', left: 0, top: ys[i] - 34, display: 'flex', alignItems: 'center', gap: 22 }}>
          <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'var(--surface-2)', border: `3px solid ${C.green}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <TlIcon kind={n.icon} />
          </div>
          <div style={{ fontSize: 34, fontWeight: 800, whiteSpace: 'nowrap' }}>{n.name}</div>
          <div style={{ padding: '5px 14px', borderRadius: 999, background: i >= 2 ? C.greenSoft : C.amberSoft, border: `1.5px solid ${i >= 2 ? C.green : C.amber}`, color: i >= 2 ? C.green : C.ink, fontWeight: 800, fontSize: 18, whiteSpace: 'nowrap', ...mono }}>{n.chip}</div>
        </div>
      ))}
      <div style={{ position: 'absolute', left: 24, top: 752, width: 0, height: 0, borderLeft: '11px solid transparent', borderRight: '11px solid transparent', borderTop: `20px solid ${C.green}` }} />
    </div>
  );
}

function Memo({ rot, tint, children, h }: { rot: number; tint: string; children: ReactNode; h?: number }) {
  return (
    <div style={{ height: h, boxSizing: 'border-box', transform: `rotate(${rot}deg)`, background: tint, borderRadius: 6, padding: '18px 24px', boxShadow: '0 12px 28px -18px rgba(29,42,38,0.5)', border: '1px solid var(--hair-2)' }}>
      {children}
    </div>
  );
}

function S24() {
  return (
    <>
      <img src={IMG.notebook} alt="" style={{ ...abs(0, 0, DW, DH), objectFit: 'cover' }} />
      <div style={{ ...abs(170, 70), ...kick }}>오늘 걸어온 길</div>
      <div style={{ ...abs(170, 98, 700), ...small, fontSize: 19 }}>정의는 넷, 수준은 성능 × 범위 (2~5장). 그다음 학습의 역사:</div>
      <Build at={1} style={{ ...abs(170, 150, 740, 820) }}>
        <Timeline />
      </Build>

      <Build at={2} style={{ ...abs(1070, 110, 700), zIndex: 3 }}>
        <Memo rot={-1.5} tint={`color-mix(in srgb, ${C.amber} 26%, var(--surface-2))`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <div style={{ flex: 1 }}>
              <div style={{ ...kick, color: C.ink, opacity: 0.7 }}>학습이란</div>
              <div style={{ fontSize: 36, fontWeight: 800, wordBreak: 'keep-all', marginTop: 4 }}>오차만큼 가중치를 고친다</div>
              <div style={{ ...body, fontSize: 19, marginTop: 6 }}>6장의 손잡이. 데이터를 보고, 틀린 만큼 돌린다.</div>
            </div>
            <div style={{ position: 'relative', width: 84, height: 84, flex: 'none' }}>
              <Dial x={0} y={0} size={84} angle={38} />
            </div>
          </div>
        </Memo>
      </Build>
      <Build at={3} style={{ ...abs(1070, 372, 560), zIndex: 3 }}>
        <Memo rot={1} tint={`color-mix(in srgb, ${C.green} 16%, var(--surface-2))`}>
          <div style={{ ...kick, color: C.ink, opacity: 0.7 }}>무엇을 보고 배우나</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            {['정답', '데이터만', '보상'].map((c) => (
              <div key={c} style={{ padding: '6px 16px', borderRadius: 999, background: 'var(--surface-2)', border: `1.5px solid ${C.green}`, color: C.green, fontWeight: 800, fontSize: 21 }}>{c}</div>
            ))}
          </div>
          <div style={{ ...body, fontSize: 20, marginTop: 12 }}>→ 스스로 만든 정답 · 사람의 선호</div>
        </Memo>
      </Build>
      <Build at={4} style={{ ...abs(1070, 630, 480), zIndex: 3 }}>
        <Memo rot={-1} tint="var(--surface-2)">
          <div style={{ ...kick, color: C.ink, opacity: 0.7 }}>오늘 내 손으로</div>
          <div style={{ fontSize: 30, fontWeight: 800, marginTop: 4, wordBreak: 'keep-all' }}>지도학습 + 전이학습</div>
          <div style={{ display: 'flex', gap: 26, marginTop: 12 }}>
            <Folder name="치와와" count="83장" scale={0.62} />
            <Folder name="머핀" count="72장" scale={0.62} />
          </div>
        </Memo>
      </Build>
      <Build at={4} style={{ ...abs(1070, 872, 560), zIndex: 3 }}>
        <div style={{ ...body, fontSize: 26, color: C.green, fontWeight: 800 }}>다음 시간: 이 모델을 어디에 쓸 수 있을까</div>
      </Build>
      <LiveChip x={1070} y={936}>라이브 · 출구 티켓 · 이해도와 한마디</LiveChip>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   20~22장 · Teachable Machine (옛 slides-d.tsx)
   ══════════════════════════════════════════════════════════════════════ */

/* ── slides-d · 20~22장 ──────────────────────────────────────────────
   20 전이학습(scene · 안경 + 덧렌즈)
   21 따라 하기 ①(walkthrough · 창 셋 릴레이)
   22 따라 하기 ②(walkthrough · 큰 창 하나 + 위로 덮는 다이얼로그, live)
   좌표는 전부 1920×1080 설계 박스 px. 독 자리(x 660~1260 · y 990~1075)는 비워 둔다.
   목업 문구는 reference/tm-{newproject,editor,export}.png 실측(2026-09-14, release-2-4-16). */

const kw: CSSProperties = { wordBreak: 'keep-all' };
/** 지난 창을 축소해 현재 창에 자리를 내준다 (dimAfter와 함께 쓴다) */
function shrinkAfter(t: number, at: number, k = 0.8): CSSProperties {
  if (t <= at) return {};
  return { transform: `scale(${interpolate(t, [at, at + 0.6], [1, k], easeInOut)})`, transformOrigin: 'left top' };
}

/* ═══════════════════════════════════════════════════════════════════════
   S20 · Teachable Machine은 어떻게 몇 초 만에 배울까 (scene)
   메타포: 이미 도수가 맞는 안경 위에 작은 렌즈 하나만 덧낀다.
   왼쪽 렌즈 안에 "이미 배운 층 일곱 겹"이 비치고, 오른쪽 렌즈는 비어 있다가
   앰버 덧렌즈가 날아와 끼워지며 「치와와 / 머핀」 판정이 생긴다.
   ═══════════════════════════════════════════════════════════════════════ */

/* 안경 배치 — ink-glasses.svg viewBox 700×300, 렌즈 중심 (210,160)·(490,160) r 96 */
const GW = 900, GK = GW / 700, GX = 96, GY = 296;
const L = { x: GX + 210 * GK, y: GY + 160 * GK, r: 96 * GK }; // 왼 렌즈 (374, 502) r 123
const R = { x: GX + 490 * GK, y: GY + 160 * GK, r: 96 * GK }; // 오른 렌즈 (726, 502) r 123
/* 덧렌즈 — ink-add-lens.svg viewBox 220×220, 렌즈 중심 (104,118) r 78 */
const AW = 268, AK = AW / 220;
const A_DX = 104 * AK, A_DY = 118 * AK; // svg 좌상단에서 렌즈 중심까지
const T20 = { GLASS: 0.15, BARS: 0.5, LEARNED: 1.3, FLY: 1.6, LAND: 2.9, NAME: 3.2, TIMER: 3.6, TICK: 4.5, TERMS: 4.9, STRIP: 6.2, END: 8.4 };

/** 왼쪽 렌즈 안에 비치는 층 단면 — 렌즈 원 안에 꼭 맞게 세로 막대 일곱 */
function LensLayers({ t }: { t: number }) {
  return (
    <>
      {Array.from({ length: 7 }, (_, i) => {
        const dx = (i - 3) * 30;
        const h = 2 * Math.sqrt(Math.max(0, L.r * L.r - dx * dx)) * 0.8;
        const on = clamp01((t - (T20.BARS + i * 0.085)) / 0.4);
        const rows = 6 - Math.floor(i / 2);
        return (
          <div
            key={i}
            style={{
              ...abs(L.x + dx - 10, L.y - h / 2, 20, h),
              borderRadius: 6,
              border: `1.5px solid color-mix(in srgb, ${C.green} ${34 + i * 7}%, transparent)`,
              background: 'var(--surface-2)',
              padding: 2,
              boxSizing: 'border-box',
              display: 'grid',
              gridTemplateRows: `repeat(${rows}, 1fr)`,
              gap: 2,
              opacity: on,
              transform: `translateY(${(1 - on) * 12}px)`,
            }}
          >
            {Array.from({ length: rows }, (_, k) => (
              <div key={k} style={{ borderRadius: i > 3 ? 3 : 1.5, background: `color-mix(in srgb, ${C.green} ${16 + i * 9 + (k % 3) * 6}%, ${C.paper})` }} />
            ))}
          </div>
        );
      })}
    </>
  );
}

function TransferScene() {
  const t = useSceneTime();
  /* 덧렌즈 비행 — 오른쪽 화면 밖에서 오른 렌즈 위로 */
  const fly = spring(t, T20.FLY, 1.3);
  const lensCx = lerp(1980, R.x, fly);
  const lensCy = lerp(R.y - 210, R.y, fly);
  const landed = t >= T20.LAND;
  const pulse = landed ? 0.5 + 0.5 * Math.sin((t - T20.LAND) * 3.4) : 0;
  /* 타이머 다이얼 — 한 바퀴 돌고 멈춘다 */
  const dial = interpolate(t, [T20.TIMER, T20.TICK], [0, 1], easeOut);
  const ticked = t >= T20.TICK;

  return (
    <>
      {/* ── 머리말 ── */}
      <div style={{ ...abs(110, 56), ...kick }}>실습 준비 · 왜 몇 초 만에 끝나나</div>
      <div style={{ ...abs(110, 88, 1030) }}>
        <h2 style={{ ...h1, fontSize: 52, marginInline: 'auto' }}>
          도수가 맞는 안경 위에 <span style={{ color: C.amber }}>렌즈 하나만</span> 덧낀다
        </h2>
        <div style={{ ...body, marginTop: 10, ...kw }}>
          Teachable Machine은 딥러닝을 처음부터 가르치지 않는다. 이미 배워 둔 모델을 가져와 마지막 판정만 새로 배운다.
        </div>
      </div>

      {/* ── 안경 (사전 학습 모델) ── */}
      <img
        src={SVG.glasses}
        alt="둥근 안경"
        style={{ ...abs(GX, GY, GW, 300 * GK), objectFit: 'fill', opacity: clamp01((t - T20.GLASS) / 0.6), ...riseIn(t, T20.GLASS, 0.7, 20) }}
      />
      <LensLayers t={t} />

      {/* 왼 렌즈 라벨 — 이미 배움 */}
      <div style={{ ...abs(L.x - 150, L.y + L.r + 26, 300), textAlign: 'center', opacity: clamp01((t - T20.LEARNED) / 0.5) }}>
        <div style={{ width: 2, height: 18, background: C.green, margin: '0 auto 6px' }} />
        <div style={{ display: 'inline-block', padding: '7px 18px', borderRadius: 999, background: C.greenSoft, border: `1.5px solid ${C.green}`, color: C.green, fontWeight: 800, fontSize: 20, whiteSpace: 'nowrap' }}>이미 배운 층 일곱 겹</div>
        <div style={{ ...small, fontSize: 17, marginTop: 8, ...kw }}>선 · 모서리 · 털 · 귀 모양을 보는 눈</div>
      </div>

      {/* 오른 렌즈 — 덧렌즈가 오기 전에는 비어 있다 */}
      {!landed && (
        <div style={{ ...abs(R.x - 40, R.y - 40, 80, 80), display: 'grid', placeItems: 'center', ...h1, fontSize: 64, color: 'var(--fg-faint)', opacity: clamp01((t - T20.BARS) / 0.6) * (1 - fly) }}>?</div>
      )}

      {/* ── 덧렌즈 (새로 배우는 마지막 층) ── */}
      {t >= T20.FLY - 0.1 && (
        <>
          <img
            src={SVG.lens}
            alt="덧끼우는 작은 렌즈"
            style={{ ...abs(lensCx - A_DX, lensCy - A_DY, AW, 220 * AK), objectFit: 'fill', zIndex: 3, filter: landed ? `drop-shadow(0 0 ${6 + pulse * 10}px ${C.amber}88)` : 'none' }}
          />
          {t >= T20.NAME && (
            <div style={{ ...abs(R.x - 90, R.y - 46, 180), zIndex: 4, textAlign: 'center', opacity: clamp01((t - T20.NAME) / 0.5) }}>
              {['치와와', '머핀'].map((n, i) => (
                <div key={n} style={{ marginTop: i ? 8 : 0, padding: '5px 0', borderRadius: 10, background: 'var(--surface-2)', border: `2px solid ${C.amber}`, color: '#8a5f0a', fontWeight: 800, fontSize: 22 }}>{n}</div>
              ))}
            </div>
          )}
        </>
      )}
      {landed && (
        <div style={{ ...abs(R.x - 160, R.y + R.r + 26, 320), textAlign: 'center', opacity: clamp01((t - T20.LAND) / 0.5), zIndex: 4 }}>
          <div style={{ width: 2, height: 18, background: C.amber, margin: '0 auto 6px' }} />
          <div style={{ display: 'inline-block', padding: '7px 18px', borderRadius: 999, background: C.amberSoft, border: `1.5px solid ${C.amber}`, color: '#8a5f0a', fontWeight: 800, fontSize: 20, whiteSpace: 'nowrap' }}>여기만 새로 배운다</div>
          <div style={{ ...small, fontSize: 17, marginTop: 8, ...kw }}>마지막 한 층 · 치와와냐 머핀이냐</div>
        </div>
      )}

      {/* ── 타이머 다이얼 — 한 바퀴 돌고 체크 ── */}
      {t >= T20.TIMER - 0.2 && (
        <div style={{ ...abs(1000, 396, 150, 190), opacity: clamp01((t - (T20.TIMER - 0.2)) / 0.4) }}>
          <svg width={150} height={150} viewBox="0 0 150 150">
            <circle cx={75} cy={75} r={58} fill="var(--surface-2)" stroke="var(--hair)" strokeWidth={3} />
            <circle
              cx={75} cy={75} r={58} fill="none"
              stroke={ticked ? C.green : C.amber} strokeWidth={7} strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 58}
              strokeDashoffset={2 * Math.PI * 58 * (1 - dial)}
              transform="rotate(-90 75 75)"
            />
            {ticked
              ? <polyline points="52,76 68,92 100,58" fill="none" stroke={C.green} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
              : <text x={75} y={86} textAnchor="middle" style={{ ...mono, fontSize: 30, fontWeight: 800, fill: C.amber }}>{Math.round(dial * 9)}</text>}
          </svg>
          <div style={{ ...small, fontSize: 18, textAlign: 'center', marginTop: 4, fontWeight: 800, color: ticked ? C.green : 'var(--fg-faint)', ...kw }}>{ticked ? '몇 초면 끝' : '학습 중'}</div>
        </div>
      )}

      {/* ── 정식 용어 셋 ── */}
      <div style={{ ...abs(1210, 236, 610), display: 'flex', flexDirection: 'column', gap: 26 }}>
        {[
          { term: '전이학습', gloss: '이미 배운 모델을 가져와 새 문제에 맞게 마지막 부분만 다시 배우는 방법', color: C.amber },
          { term: '사전 학습 모델', gloss: '미리 큰 데이터로 배워 둔 모델. 여기서는 사진 인식 모델 MobileNet', color: C.green },
          { term: '브라우저 안에서 학습', gloss: '사진은 내 컴퓨터를 떠나지 않는다. 구글 서버로 올라가지 않는다', color: C.green },
        ].map((x, i) => (
          <div key={x.term} style={{ ...card, padding: '18px 24px', borderLeft: `8px solid ${x.color}`, opacity: clamp01((t - (T20.TERMS + i * 0.35)) / 0.5), transform: `translateX(${(1 - clamp01((t - (T20.TERMS + i * 0.35)) / 0.5)) * 24}px)` }}>
            <Term term={x.term} gloss={x.gloss} color={x.color} size={23} />
          </div>
        ))}
      </div>

      {/* ── 마무리 한 줄 ── */}
      <div style={{ ...abs(110, 782, 1010), opacity: clamp01((t - (T20.TERMS + 0.9)) / 0.6), ...riseIn(t, T20.TERMS + 0.9, 0.6, 14) }}>
        <div style={{ ...h3, fontSize: 34, ...kw }}>
          우리가 새로 가르치는 것은 <span style={{ color: C.amber }}>마지막 한 층</span>뿐이다.
        </div>
        <div style={{ ...body, fontSize: 20, marginTop: 6, ...kw }}>그래서 사진 몇십 장, 노트북 한 대, 몇 초로 끝난다.</div>
      </div>

      {/* ── 실습 순서 띠 ── */}
      <div style={{ ...abs(110, 900, 1010), opacity: clamp01((t - T20.STRIP) / 0.6) }}>
        <div style={{ ...kick, fontSize: 14 }}>다음 두 장에서 화면 그대로 · 순서 다섯</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
          {['클래스 이름', '사진 업로드', '학습', '미리보기', '내보내기'].map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {i > 0 && <span style={{ color: C.green, fontWeight: 800, fontSize: 20 }}>→</span>}
              <span style={{ padding: '9px 16px', borderRadius: 999, background: 'var(--surface-2)', border: `1.5px solid ${C.green}`, color: C.green, fontWeight: 800, fontSize: 19, whiteSpace: 'nowrap' }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...abs(1300, 900), opacity: clamp01((t - T20.STRIP) / 0.6) }}>
        <LinkButton href={TM_URL} size={20} tone="ghost" sub="teachablemachine.withgoogle.com/train · 로그인 없이">Teachable Machine 열기</LinkButton>
      </div>
    </>
  );
}

function S20() {
  return (
    <Scene
      duration={T20.END}
      freezeAt={T20.END - 0.4}
      markers={[
        { time: T20.BARS, label: '이미 배운 층' },
        { time: T20.FLY, label: '덧렌즈가 날아온다' },
        { time: T20.TIMER, label: '몇 초면 끝' },
        { time: T20.TERMS, label: '정식 용어 셋' },
      ]}
    >
      <TransferScene />
    </Scene>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   S21 · 따라 하기 ①: 프로젝트 만들고 사진 올리기 (walkthrough)
   구도: 좌상 → 우하 창 셋 릴레이. 지나간 창은 어두워지고 작아진다.
   ═══════════════════════════════════════════════════════════════════════ */

const T21 = { W1: 0.2, CARD: 1.6, W2: 2.1, STD: 3.3, W3: 3.8, PEN1: 4.9, TYPE1: 5.2, PEN2: 6.8, TYPE2: 7.1, UP: 8.8, DROP: 9.6, TRAIN_ON: 12.0, END: 13.6 };
const WIN1 = { x: 60, y: 208, w: 640, h: 420 };
const WIN2 = { x: 300, y: 330, w: 620, h: 352 };
const WIN3 = { x: 760, y: 214, w: 1090, h: 648 };

/* 클릭 대상의 화면 좌표(Scene 기준 %) — data-pt 요소를 브라우저에서 실측한 값.
   창 배치를 바꾸면 measure_pointer.mjs로 다시 재고 이 값을 갱신한다. */
const TG21 = {
  card: { x: 9.27, y: 37.34 },
  std: { x: 24.01, y: 48.52 },
  pen1: { x: 46.47, y: 30.79 },
  pen2: { x: 46.64, y: 48.38 },
  up: { x: 47.66, y: 36.53 },
  train: { x: 72.97, y: 49.07 },
};

function TmWalk1() {
  const t = useSceneTime();
  const n1 = typed(t, '치와와', T21.TYPE1, 6);
  const n1done = t >= typedDoneAt('치와와', T21.TYPE1, 6);
  const n2 = typed(t, '머핀', T21.TYPE2, 6);
  const n2done = t >= typedDoneAt('머핀', T21.TYPE2, 6);
  const dropped = t >= T21.DROP;
  const thumbs = dropped ? Math.min(83, Math.floor((t - T21.DROP) * 62)) : 0;
  const DROP2 = T21.DROP + 1.3;
  const dropped2 = t >= DROP2;
  const thumbs2 = dropped2 ? Math.min(72, Math.floor((t - DROP2) * 62)) : 0;
  const trainOn = t >= T21.TRAIN_ON;

  const path: CursorKey[] = [
    { t: 0.9, x: TG21.card.x - 6, y: TG21.card.y + 8 },
    { t: T21.CARD, ...TG21.card, click: true, label: '① 이미지 프로젝트' },
    { t: T21.STD, ...TG21.std, click: true, label: '② 표준 이미지 모델' },
    { t: T21.PEN1, ...TG21.pen1, click: true, label: '③ 클래스 이름 바꾸기' },
    { t: T21.PEN1 + 0.2, ...TG21.pen1, hide: true },
    { t: T21.PEN2 - 0.3, ...TG21.pen2 },
    { t: T21.PEN2, ...TG21.pen2, click: true },
    { t: T21.UP, ...TG21.up, click: true, label: '④ 업로드' },
    { t: T21.DROP + 0.5, x: TG21.up.x + 10, y: TG21.up.y + 5 },
    { t: T21.TRAIN_ON, x: TG21.train.x - 1.2, y: TG21.train.y + 1.8, label: '⑤ 버튼이 켜진다' },
  ];
  const ring = (at: number) => ({ boxShadow: `0 0 0 ${clickFlash(t, at) * 6}px ${C.green}77` });
  const chip = (s: string, on?: boolean) => (
    <span style={{ padding: '6px 10px', borderRadius: 6, background: '#e8f0fe', color: '#1a73e8', fontSize: 12.5, fontWeight: 700, ...(on ? { outline: `2px solid ${C.green}` } : {}) }}>{s}</span>
  );

  return (
    <>
      <div style={{ ...abs(110, 56), ...kick }}>따라 하기 ① · 2026-09-14 화면 기준</div>
      <h2 style={{ ...abs(110, 86, 980), ...h1, fontSize: 44, marginInline: 'auto' }}>
        프로젝트를 만들고, <span style={accentText}>사진을 올린다</span>
      </h2>
      <div style={{ ...abs(1390, 64) }}>
        <LinkButton href={TM_URL} size={18} tone="ghost" sub="여기로 들어간다 · 로그인 없이">teachablemachine.withgoogle.com/train</LinkButton>
      </div>

      {/* ① 새 프로젝트 */}
      <AppWindow
        kind="browser" url="teachablemachine.withgoogle.com/train" badge="①"
        style={{ left: WIN1.x, top: WIN1.y, width: WIN1.w, height: WIN1.h, zIndex: 1, ...popIn(t, T21.W1), ...dimAfter(t, T21.W2, 0.62), ...shrinkAfter(t, T21.W2, 0.74) }}
        bodyStyle={{ background: '#fff', padding: 0 }}
      >
        <div style={{ position: 'absolute', inset: 0, padding: '18px 22px', boxSizing: 'border-box', color: '#202124' }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>새 프로젝트</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            {[
              ['이미지 프로젝트', '파일 또는 웹캠에서 가져온 이미지를 기반으로 학습시키세요.'],
              ['오디오 프로젝트', '파일 또는 마이크에서 가져온 1초 분량의 사운드를 기반으로 학습시키세요.'],
              ['포즈 프로젝트', '파일 또는 웹캠에서 가져온 이미지를 기반으로 학습시키세요.'],
            ].map(([n, d], i) => (
              <div
                key={n}
                data-pt={i === 0 ? 'w1-card' : undefined}
                style={{ flex: 1, border: `1.5px solid ${i === 0 ? '#1a73e8' : '#dadce0'}`, borderRadius: 10, padding: 12, background: i === 0 ? `rgba(26,115,232,${0.06 + clickFlash(t, T21.CARD) * 0.25})` : '#fff', ...(i === 0 ? ring(T21.CARD) : {}) }}
              >
                <div style={{ height: 70, borderRadius: 8, background: '#f1f3f4' }} />
                <div style={{ fontWeight: 800, fontSize: 14, marginTop: 10 }}>{n}</div>
                <div style={{ fontSize: 10.5, color: '#5f6368', marginTop: 4, lineHeight: 1.35, ...kw }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </AppWindow>

      {/* ② 새 이미지 프로젝트 다이얼로그 */}
      <AppWindow
        kind="app" title="새 이미지 프로젝트" badge="②"
        style={{ left: WIN2.x, top: WIN2.y, width: WIN2.w, height: WIN2.h, zIndex: 2, ...popIn(t, T21.W2), ...dimAfter(t, T21.W3, 0.62), ...shrinkAfter(t, T21.W3, 0.74) }}
        bodyStyle={{ background: '#fff' }}
      >
        <div style={{ position: 'absolute', inset: 0, padding: 18, boxSizing: 'border-box', display: 'flex', gap: 14, color: '#202124' }}>
          {[
            ['표준 이미지 모델', '대부분의 용도에 적합\n224 x 224px 컬러 이미지\nTensorFlow, TFLite, TF.js로 내보내기\n모델 크기: 약 5mb', true],
            ['삽입된 이미지 모델', '마이크로 컨트롤러에 적합\n96 x 96px 그레이스케일 이미지\n마이크로컨트롤러용 TFLite, TFLite, TF.js로 내보내기\n모델 크기: 약 500kb', false],
          ].map(([n, d, hot]) => (
            <div
              key={String(n)}
              data-pt={hot ? 'w1-std' : undefined}
              style={{ flex: 1, border: `1.5px solid ${hot ? '#1a73e8' : '#dadce0'}`, borderRadius: 10, padding: 14, background: hot ? `rgba(26,115,232,${0.05 + clickFlash(t, T21.STD) * 0.25})` : '#fff', ...(hot ? ring(T21.STD) : {}) }}
            >
              <div style={{ fontWeight: 800, fontSize: 16 }}>{n as string}</div>
              <div style={{ fontSize: 12, color: '#5f6368', marginTop: 8, whiteSpace: 'pre-line', lineHeight: 1.5 }}>{d as string}</div>
            </div>
          ))}
        </div>
      </AppWindow>

      {/* ③ 편집기 */}
      <AppWindow
        kind="browser" url="teachablemachine.withgoogle.com/train/image" badge="③"
        style={{ left: WIN3.x, top: WIN3.y, width: WIN3.w, height: WIN3.h, zIndex: 3, ...popIn(t, T21.W3) }}
        bodyStyle={{ background: '#f0f2f5', padding: 0 }}
      >
        <div style={{ position: 'absolute', inset: 0, color: '#202124' }}>
          {[0, 1].map((i) => {
            const name = i === 0 ? n1 || (t < T21.TYPE1 ? 'Class 1' : '') : n2 || (t < T21.TYPE2 ? 'Class 2' : '');
            const typing = i === 0 ? t >= T21.TYPE1 && !n1done : t >= T21.TYPE2 && !n2done;
            const shown = i === 0 ? dropped : dropped2;
            const cnt = i === 0 ? thumbs : thumbs2;
            return (
              <div key={i} style={{ position: 'absolute', left: 40, top: 50 + i * 190, width: 420, height: 160, background: '#fff', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '14px 16px', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 17 }}>
                  <span style={{ borderBottom: typing ? `2px solid ${C.green}` : 'none' }}>{name}{typing && <Caret color={C.green} />}</span>
                  <span data-pt={i === 0 ? 'w1-pen1' : 'w1-pen2'} style={{ color: '#9aa0a6', fontSize: 14, padding: '2px 4px', borderRadius: 4, ...ring(i === 0 ? T21.PEN1 : T21.PEN2) }}>✎</span>
                  <span style={{ marginLeft: 'auto', color: '#9aa0a6' }}>⋮</span>
                </div>
                <div style={{ fontSize: 12, color: '#5f6368', marginTop: 8 }}>이미지 샘플 추가:</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                  {chip('▣ 웹캠')}
                  <span data-pt={i === 0 ? 'w1-up' : undefined} style={{ ...(i === 0 ? ring(T21.UP) : {}), borderRadius: 6 }}>{chip('⇪ 업로드', i === 0 && t >= T21.UP)}</span>
                </div>
                {shown && <div style={{ position: 'absolute', left: 16, bottom: 10, fontSize: 12.5, fontWeight: 700, color: '#5f6368' }}>이미지 샘플 {cnt}개</div>}
                {shown && (
                  <div style={{ position: 'absolute', right: 14, top: 42, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3, width: 150 }}>
                    {Array.from({ length: Math.min(Math.ceil(cnt / 6), 15) }, (_, k) =>
                      k < 5
                        ? <img key={k} src={PHOTO(i === 0 ? '치와와' : '머핀', k + 1)} alt="" draggable={false} style={{ width: 26, height: 26, borderRadius: 3, objectFit: 'cover' }} />
                        : <div key={k} style={{ width: 26, height: 26, borderRadius: 3, background: i === 0 ? ['#c9a57b', '#b98a5e', '#d9c3a3', '#a97a55'][k % 4] : ['#d4a56a', '#b07a3c', '#e8c890', '#c98f4e'][k % 4] }} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ position: 'absolute', left: 40, top: 430, width: 420, height: 56, border: '2px dashed #dadce0', borderRadius: 10, display: 'grid', placeItems: 'center', color: '#5f6368', fontSize: 14 }}>⊞ 클래스 추가</div>
          <div style={{ position: 'absolute', left: 520, top: 200, width: 240, height: 170, background: '#fff', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: 16, boxSizing: 'border-box' }}>
            <div style={{ fontWeight: 700, fontSize: 17 }}>학습</div>
            <div data-pt="w1-train" style={{ marginTop: 12, padding: '10px 0', borderRadius: 6, background: trainOn ? '#1a73e8' : '#f1f3f4', color: trainOn ? '#fff' : '#9aa0a6', textAlign: 'center', fontSize: 14, fontWeight: 700, transition: 'background .3s', ...(trainOn ? { boxShadow: `0 0 0 6px ${C.green}55` } : {}) }}>모델 학습시키기</div>
            <div style={{ marginTop: 12, fontSize: 13, color: '#5f6368', display: 'flex', justifyContent: 'space-between' }}><span>고급</span><span>⌄</span></div>
          </div>
          <div style={{ position: 'absolute', left: 810, top: 200, width: 240, height: 170, background: '#fff', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: 16, boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 17 }}>미리보기</span>
              <span style={{ padding: '6px 10px', borderRadius: 6, background: '#f1f3f4', color: '#9aa0a6', fontSize: 12, fontWeight: 700 }}>⇪ 모델 내보내기</span>
            </div>
            <div style={{ fontSize: 12, color: '#5f6368', marginTop: 12, lineHeight: 1.45 }}>여기에서 모델을 미리 확인하려면 먼저 왼쪽에서 모델을 학습시켜야 합니다.</div>
          </div>
          {/* 폴더에서 끌어다 놓는 사진들 */}
          {([[T21.UP + 0.3, T21.DROP, 110, '치와와 폴더 · 83장'], [T21.DROP + 0.6, DROP2, 300, '머핀 폴더 · 72장']] as [number, number, number, string][]).map(([a, b, top, label]) =>
            t >= a && t < b + 0.4 ? (
              <div key={label} style={{ position: 'absolute', left: 120 + interpolate(t, [a, b], [280, 0], easeInOut), top: top + interpolate(t, [a, b], [240, 0], easeInOut), display: 'flex', gap: 4, alignItems: 'center' }}>
                {[0, 1, 2].map((k) => (
                  <div key={k} style={{ width: 34, height: 40, borderRadius: 4, background: '#fff', border: '1.5px solid #9aa0a6', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', fontSize: 9, textAlign: 'center', paddingTop: 22, boxSizing: 'border-box', color: '#5f6368' }}>jpg</div>
                ))}
                <span style={{ fontSize: 12.5, color: C.green, fontWeight: 800, whiteSpace: 'nowrap' }}>{label}</span>
              </div>
            ) : null
          )}
          {trainOn && (
            <div style={{ position: 'absolute', left: 520, top: 392, width: 520, ...mono, fontSize: 13.5, color: C.green, fontWeight: 800, ...riseIn(t, T21.TRAIN_ON, 0.5, 8) }}>✓ 두 클래스에 사진이 들어갔다. 버튼이 켜졌다</div>
          )}
        </div>
      </AppWindow>

      {/* 절차 목록 — 국면마다 점등 */}
      <div style={{ ...abs(110, 690, 580), display: 'flex', flexDirection: 'column', gap: 9 }}>
        {([['①', '주소로 들어가 「이미지 프로젝트」 카드를 누른다', T21.CARD], ['②', '「표준 이미지 모델」을 고른다', T21.STD], ['③', '연필을 눌러 이름을 「치와와」 · 「머핀」으로 바꾼다', T21.PEN1], ['④', '「업로드」 → 폴더 안 사진을 전부 선택해 끌어다 놓는다', T21.UP], ['⑤', '두 클래스가 채워지면 「모델 학습시키기」가 켜진다', T21.TRAIN_ON]] as [string, string, number][]).map(([n, s, at]) => {
          const on = t >= at - 0.1;
          return (
            <div key={n} style={{ display: 'flex', gap: 12, alignItems: 'baseline', padding: '8px 14px', borderRadius: 12, background: on ? `${C.green}14` : 'transparent', border: `1px solid ${on ? `${C.green}55` : 'transparent'}` }}>
              <span style={{ ...mono, fontWeight: 900, fontSize: 18, color: on ? C.green : 'var(--fg-faint)' }}>{n}</span>
              <span style={{ fontSize: 17, fontWeight: on ? 800 : 600, color: C.ink, ...kw }}>{s}</span>
            </div>
          );
        })}
        <div style={{ ...small, fontSize: 16, marginTop: 4, color: C.amber, fontWeight: 700, ...kw }}>시험 폴더의 사진 16장은 여기에 넣지 않는다.</div>
      </div>

      <Pointer path={path} color={C.green} timelineEnd={T21.END} />
    </>
  );
}

function S21() {
  return (
    <Scene duration={T21.END} freezeAt={T21.END - 0.6}>
      <TmWalk1 />
    </Scene>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   S22 · 따라 하기 ②: 학습시키고, 시험하고, 링크 만들기 (walkthrough + live)
   구도: 큰 창 하나 위에서 포인터가 왼쪽 → 오른쪽으로 일하고,
   마지막에 내보내기 다이얼로그가 위로 덮인다 (21장의 릴레이와 다른 구도).
   ═══════════════════════════════════════════════════════════════════════ */

const T22 = { W: 0.2, TRAIN: 1.5, DONE: 4.0, FILE: 5.2, PICK: 6.5, BARS: 7.2, EXPORT: 9.2, DLG: 9.6, UPLOAD: 10.8, LINK: 12.2, COPY: 13.4, END: 15.0 };
const WE = { x: 300, y: 188, w: 1470, h: 700 };
const DLG = { x: 490, y: 300, w: 1080, h: 404 };
const FAKE_LINK = 'https://teachablemachine.withgoogle.com/models/xXxXxXxX/';

const TG22 = {
  train: { x: 50.05, y: 45.83 },
  file: { x: 85.05, y: 33.19 },
  filepick: { x: 83.59, y: 39.68 },
  exp: { x: 83.87, y: 29.03 },
  upload: { x: 42.84, y: 42.31 },
  copy: { x: 77.35, y: 50.28 },
};

function TmWalk2() {
  const t = useSceneTime();
  const training = t >= T22.TRAIN && t < T22.DONE;
  const done = t >= T22.DONE;
  const prog = interpolate(t, [T22.TRAIN, T22.DONE], [0, 100]);
  const dropOpen = t >= T22.FILE && t < T22.PICK + 0.25; // 입력 드롭다운이 열려 있다
  const fileMode = t >= T22.PICK; // 웹캠 → 파일로 바꾼 뒤
  const chi = fileMode ? interpolate(t, [T22.BARS, T22.BARS + 1.0], [50, 96], easeOut) : 0;
  const dlgOn = t >= T22.DLG;
  const uploaded = t >= T22.LINK;
  const linkTxt = uploaded ? typed(t, FAKE_LINK, T22.LINK, 42) : '';
  const copied = t >= T22.COPY;

  const path: CursorKey[] = [
    { t: 0.9, x: TG22.train.x - 5, y: TG22.train.y + 8 },
    { t: T22.TRAIN, ...TG22.train, click: true, label: '① 모델 학습시키기' },
    { t: T22.DONE + 0.3, ...TG22.train },
    { t: T22.FILE, ...TG22.file, click: true, label: '② 입력 드롭다운' },
    { t: T22.PICK, ...TG22.filepick, click: true, label: '③ 「파일」로 바꾼다' },
    { t: T22.EXPORT, ...TG22.exp, click: true, label: '④ 모델 내보내기' },
    { t: T22.UPLOAD, ...TG22.upload, click: true, label: '⑤ 모델 업로드' },
    { t: T22.COPY, ...TG22.copy, click: true, label: '⑥ 링크 복사' },
    { t: T22.COPY + 0.5, ...TG22.copy, hide: true },
  ];
  const ring = (at: number) => ({ boxShadow: `0 0 0 ${clickFlash(t, at) * 6}px ${C.green}77` });
  const steps: [string, string, number][] = [
    ['①', '모델 학습시키기', T22.TRAIN],
    ['②', '입력을 웹캠에서 파일로', T22.FILE],
    ['③', '시험 사진 넣어 보기', T22.BARS],
    ['④', '모델 내보내기', T22.EXPORT],
    ['⑤', '모델 업로드', T22.UPLOAD],
    ['⑥', '링크 복사', T22.COPY],
  ];

  return (
    <>
      <div style={{ ...abs(110, 56), ...kick }}>따라 하기 ② · 2026-09-14 화면 기준</div>
      <h2 style={{ ...abs(110, 86, 1000), ...h1, fontSize: 44, marginInline: 'auto' }}>
        학습시키고, 시험하고, <span style={accentText}>링크를 만든다</span>
      </h2>
      <div style={{ ...abs(1390, 60) }}>
        <LinkButton href={TM_URL} size={18} tone="ghost" sub="21장에 이어서 같은 화면">teachablemachine.withgoogle.com/train</LinkButton>
      </div>
      <LiveChip x={1390} y={142}>라이브 · OX · 시험 사진을 학습에도 넣으면?</LiveChip>

      {/* 큰 편집기 창 하나 */}
      <AppWindow
        kind="browser" url="teachablemachine.withgoogle.com/train/image"
        style={{ left: WE.x, top: WE.y, width: WE.w, height: WE.h, zIndex: 1, ...popIn(t, T22.W), ...dimAfter(t, T22.DLG, 0.68) }}
        bodyStyle={{ background: '#f0f2f5', padding: 0 }}
      >
        <div style={{ position: 'absolute', inset: 0, color: '#202124' }}>
          {/* 21장의 결과 — 두 클래스가 채워져 있다 */}
          {['치와와', '머핀'].map((n, i) => (
            <div key={n} style={{ position: 'absolute', left: 40, top: 48 + i * 196, width: 420, height: 176, background: '#fff', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: 14, boxSizing: 'border-box' }}>
              <div style={{ fontWeight: 700, fontSize: 17 }}>{n} <span style={{ color: '#9aa0a6', fontSize: 14 }}>✎</span></div>
              <div style={{ fontSize: 12.5, color: '#5f6368', marginTop: 4 }}>이미지 샘플 {[83, 72][i]}개</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4, marginTop: 10 }}>
                {Array.from({ length: 20 }, (_, k) =>
                  k < 4
                    ? <img key={k} src={PHOTO(n as '치와와' | '머핀', k + 1)} alt="" draggable={false} style={{ width: '100%', height: 30, borderRadius: 3, objectFit: 'cover' }} />
                    : <div key={k} style={{ height: 30, borderRadius: 3, background: i === 0 ? ['#c9a57b', '#b98a5e', '#d9c3a3'][k % 3] : ['#d4a56a', '#b07a3c', '#e8c890'][k % 3] }} />
                )}
              </div>
            </div>
          ))}

          {/* 학습 카드 */}
          <div style={{ position: 'absolute', left: 520, top: 190, width: 280, height: 210, background: '#fff', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: 16, boxSizing: 'border-box' }}>
            <div style={{ fontWeight: 700, fontSize: 17 }}>학습</div>
            <div data-pt="w2-train" style={{ marginTop: 12, padding: '11px 0', borderRadius: 6, background: training ? '#e8f0fe' : done ? '#f1f3f4' : '#1a73e8', color: training ? '#1a73e8' : done ? '#5f6368' : '#fff', textAlign: 'center', fontSize: 14, fontWeight: 700, ...ring(T22.TRAIN) }}>
              {training ? `학습 중… ${Math.round(prog)}%` : done ? '모델 학습됨' : '모델 학습시키기'}
            </div>
            {training && <div style={{ marginTop: 10, fontSize: 12, color: '#d93025', lineHeight: 1.4, ...kw }}>탭을 전환하지 마세요. 브라우저 안에서 학습 중입니다.</div>}
            <div style={{ marginTop: 12, fontSize: 13, color: '#5f6368', display: 'flex', justifyContent: 'space-between' }}><span>고급</span><span>⌄</span></div>
          </div>

          {/* 미리보기 카드 */}
          <div style={{ position: 'absolute', left: 860, top: 48, width: 520, height: 560, background: '#fff', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: 18, boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 18 }}>미리보기</span>
              <span data-pt="w2-exp" style={{ padding: '7px 12px', borderRadius: 6, background: done ? '#e8f0fe' : '#f1f3f4', color: done ? '#1a73e8' : '#9aa0a6', fontSize: 12.5, fontWeight: 700, ...ring(T22.EXPORT) }}>⇪ 모델 내보내기</span>
            </div>
            {!done ? (
              <div style={{ fontSize: 12.5, color: '#5f6368', marginTop: 14, lineHeight: 1.45 }}>여기에서 모델을 미리 확인하려면 먼저 왼쪽에서 모델을 학습시켜야 합니다.</div>
            ) : (
              <>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 13 }}>
                  입력 <span style={{ padding: '2px 9px', borderRadius: 999, background: '#1a73e8', color: '#fff', fontSize: 11.5 }}>사용</span>
                  <span data-pt="w2-file" style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: 6, background: dropOpen ? '#e8f0fe' : '#f1f3f4', color: dropOpen ? '#1a73e8' : '#202124', fontSize: 12.5, fontWeight: 700, ...ring(T22.FILE) }}>{fileMode ? '파일' : '웹캠'} ▾</span>
                  {dropOpen && (
                    <div style={{ position: 'absolute', right: 0, top: 28, width: 116, background: '#fff', borderRadius: 6, boxShadow: '0 6px 18px rgba(0,0,0,0.22)', border: '1px solid #dadce0', zIndex: 6, overflow: 'hidden' }}>
                      <div style={{ padding: '9px 13px', fontSize: 13, color: '#5f6368' }}>웹캠</div>
                      <div data-pt="w2-filepick" style={{ padding: '9px 13px', fontSize: 13, fontWeight: 700, background: `rgba(26,115,232,${0.08 + clickFlash(t, T22.PICK) * 0.3})`, color: '#1a73e8' }}>파일</div>
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 12, height: 250, borderRadius: 8, background: '#f1f3f4', overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
                  {fileMode ? (
                    t >= T22.PICK + 0.35
                      ? <img src={PHOTO('시험', 2)} alt="시험 사진" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 12.5, color: '#5f6368' }}>시험 폴더에서 사진 고르기</span>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#9aa0a6' }}>
                      <div style={{ fontSize: 30 }}>▣</div>
                      <div style={{ fontSize: 12.5, marginTop: 6 }}>웹캠 · 처음 입력은 이것이다</div>
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, opacity: t >= T22.PICK + 0.35 ? 1 : 0.35 }}>출력</div>
                {t >= T22.PICK + 0.35 && ([['치와와', chi], ['머핀', 100 - chi]] as [string, number][]).map(([n, v]) => (
                  <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 9, fontSize: 13 }}>
                    <span style={{ width: 52 }}>{n}</span>
                    <div style={{ flex: 1, height: 20, borderRadius: 4, background: '#f1f3f4', overflow: 'hidden' }}>
                      <div style={{ width: `${v}%`, height: '100%', background: n === '치와와' ? '#e8710a' : '#1a73e8' }} />
                    </div>
                    <span style={{ width: 44, textAlign: 'right', ...mono }}>{Math.round(v)}%</span>
                  </div>
                ))}
                {t >= T22.PICK + 0.35
                  ? <div style={{ marginTop: 10, fontSize: 11.5, color: '#5f6368', ...kw }}>화면의 숫자는 예시다. 여러분의 모델은 다르게 나온다.</div>
                  : <div style={{ marginTop: 10, fontSize: 12, color: '#9aa0a6', ...kw }}>사진을 넣으면 클래스별 값이 막대로 나온다.</div>}
              </>
            )}
          </div>
        </div>
      </AppWindow>

      {/* 웹캠 → 파일 주석 (앰버) — 이 단계에서만 */}
      {t >= T22.FILE - 0.3 && t < T22.EXPORT && (
        <div style={{ ...abs(1170, 900, 640), zIndex: 5, opacity: clamp01((t - (T22.FILE - 0.3)) / 0.4) }}>
          <div style={{ ...card, padding: '14px 20px', borderLeft: `8px solid ${C.amber}`, background: C.amberSoft }}>
            <div style={{ ...kick, fontSize: 14, color: '#8a5f0a' }}>여기서 한 번 막힌다</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.ink, marginTop: 6, ...kw }}>기본값은 웹캠. 파일로 바꿔야 사진을 넣을 수 있다.</div>
          </div>
        </div>
      )}

      {/* 내보내기 다이얼로그 — 위로 덮는다 */}
      {dlgOn && (
        <AppWindow
          kind="app" title="프로젝트에서 모델을 사용하려면 모델을 내보내세요."
          style={{ left: DLG.x, top: DLG.y, width: DLG.w, height: DLG.h, zIndex: 6, ...popIn(t, T22.DLG) }}
          bodyStyle={{ background: '#fff', padding: 0 }}
        >
          <div style={{ position: 'absolute', inset: 0, padding: 22, boxSizing: 'border-box', color: '#202124' }}>
            <div style={{ display: 'flex', gap: 24, fontSize: 15.5, fontWeight: 700, borderBottom: '1px solid #dadce0', paddingBottom: 8 }}>
              {['Tensorflow.js', 'Tensorflow', 'Tensorflow Lite'].map((s, i) => (
                <span key={s} style={{ color: i === 0 ? '#1a73e8' : '#5f6368', borderBottom: i === 0 ? '3px solid #1a73e8' : 'none', paddingBottom: 6 }}>{s} ⓘ</span>
              ))}
            </div>
            <div style={{ marginTop: 16, fontSize: 14.5, fontWeight: 700 }}>모델 내보내기:</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 10, fontSize: 14.5 }}>
              <span>◉ 업로드(공유 가능한 링크)</span>
              <span style={{ color: '#5f6368' }}>○ 다운로드</span>
              <span data-pt="w2-upload" style={{ padding: '9px 18px', borderRadius: 6, background: uploaded ? '#f1f3f4' : '#e8f0fe', color: uploaded ? '#5f6368' : '#1a73e8', fontWeight: 700, fontSize: 13.5, ...ring(T22.UPLOAD) }}>
                {t >= T22.UPLOAD && !uploaded ? '업로드 중…' : '☁ 모델 업로드'}
              </span>
            </div>
            <div style={{ marginTop: 18, fontSize: 14.5, fontWeight: 700 }}>공유 가능한 링크:</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
              <div style={{ flex: 1, padding: '11px 15px', borderRadius: 6, background: '#f1f3f4', ...mono, fontSize: 14, color: uploaded ? '#202124' : '#9aa0a6', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {linkTxt || 'https://teachablemachine.withgoogle.com/models/[...]'}
                {uploaded && t < T22.LINK + FAKE_LINK.length / 42 && <Caret color="#1a73e8" />}
              </div>
              <span data-pt="w2-copy" style={{ padding: '9px 16px', borderRadius: 6, border: '1.5px solid #dadce0', fontSize: 13.5, fontWeight: 700, background: copied ? '#e6f4ea' : '#fff', color: uploaded ? '#202124' : '#b9bec4', opacity: uploaded ? 1 : 0.6, ...ring(T22.COPY) }}>
                {copied ? '✓ 복사됨' : '복사 ⧉'}
              </span>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: '#5f6368', ...kw }}>모델을 업로드하면 Teachable Machine에서 이 링크에 모델을 호스팅합니다. 화면의 주소는 예시다.</div>
            {copied && (
              <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 14, ...riseIn(t, T22.COPY, 0.5, 10) }}>
                <svg width={38} height={38} viewBox="0 0 38 38"><circle cx={19} cy={19} r={17} fill={C.green} /><polyline points="11,20 17,26 27,12" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span style={{ fontSize: 21, fontWeight: 800, color: C.green, ...kw }}>이 링크를 활동지에 붙여 제출한다.</span>
              </div>
            )}
          </div>
        </AppWindow>
      )}

      {/* 절차 띠 — 아래 가로 한 줄 (21장의 세로 목록과 다른 구도) */}
      <div style={{ ...abs(110, 942, 1180), display: 'flex', alignItems: 'center', gap: 8 }}>
        {steps.map(([n, s, at], i) => {
          const on = t >= at - 0.1;
          const cur = on && t < (steps[i + 1]?.[2] ?? 99) - 0.1;
          return (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {i > 0 && <span style={{ color: on ? C.green : 'var(--fg-faint)', fontWeight: 800 }}>›</span>}
              <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 7, padding: '8px 13px', borderRadius: 999, background: cur ? `${C.green}1f` : on ? `${C.green}0e` : 'transparent', border: `1.5px solid ${cur ? C.green : on ? `${C.green}55` : 'var(--hair)'}`, whiteSpace: 'nowrap' }}>
                <span style={{ ...mono, fontWeight: 900, fontSize: 15, color: on ? C.green : 'var(--fg-faint)' }}>{n}</span>
                <span style={{ fontSize: 16, fontWeight: cur ? 800 : 600, color: on ? C.ink : 'var(--fg-faint)' }}>{s}</span>
              </span>
            </div>
          );
        })}
      </div>

      <Pointer path={path} color={C.green} timelineEnd={T22.END} />
    </>
  );
}

function S22() {
  return (
    <Scene duration={T22.END} freezeAt={T22.END - 0.8}>
      <TmWalk2 />
    </Scene>
  );
}


/* ── 덱 ─────────────────────────────────────────────────────────────── */

export default function AiHowToLearnV2Deck() {
  return (
    <Deck>
      <Page nav="인공지능은 어떻게 배울까" notes={NOTES[1]}><S01 /></Page>
      <Page nav="인공지능이라고 부르려면" notes={NOTES[2]}><S02 /></Page>
      <Page nav="네 사람, 네 가지 정의" notes={NOTES[3]}><S03 /></Page>
      <Page nav="얼마나 잘하고, 얼마나 넓게" notes={NOTES[4]}><S04 /></Page>
      <Page nav="도구에서 에이전트로" notes={NOTES[5]}><S05 /></Page>
      <Page nav="배운다는 것은 손잡이를 돌리는 것" notes={NOTES[6]}><S06 /></Page>
      <Page nav="옛날 방식: 사람이 규칙을 전부 쓴다" notes={NOTES[7]}><S07 /></Page>
      <Page nav="규칙을 쓰지 말고, 예시를 보여 주자" notes={NOTES[8]}><S08 /></Page>
      <Page nav="뉴런을 흉내 낸 계산기, 퍼셉트론" notes={NOTES[9]}><S09 /></Page>
      <Page nav="직선 하나로는 못 가른다" notes={NOTES[10]}><S10 /></Page>
      <Page nav="역전파" notes={NOTES[11]}><S11 /></Page>
      <Page nav="층을 깊게: 딥러닝" notes={NOTES[12]}><S12 /></Page>
      <Page nav="세 시대, 무엇이 달라졌나" notes={NOTES[13]}><S13 /></Page>
      <Page nav="지도학습" notes={NOTES[14]}><S14 /></Page>
      <Page nav="비지도학습" notes={NOTES[15]}><S15 /></Page>
      <Page nav="강화학습" notes={NOTES[16]}><S16 /></Page>
      <Page nav="더 나아가는 방향" notes={NOTES[17]}><S17 /></Page>
      <Page nav="초파리의 뇌 지도, 커넥톰" notes={NOTES[18]}><S18 /></Page>
      <Page nav="초파리 뇌가 마인크래프트를 움직인다" notes={NOTES[19]}><S19 /></Page>
      <Page nav="Teachable Machine은 어떻게 배울까" notes={NOTES[20]}><S20 /></Page>
      <Page nav="따라 하기 ①" notes={NOTES[21]}><S21 /></Page>
      <Page nav="따라 하기 ②" notes={NOTES[22]}><S22 /></Page>
      <Page nav="실습: 치와와와 머핀" notes={NOTES[23]}><S23 /></Page>
      <Page nav="오늘 배운 것, 한 장으로" notes={NOTES[24]}><S24 /></Page>
    </Deck>
  );
}
