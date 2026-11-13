import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import Build from '../../../../src/deck/Build';
import { useDeck } from '../../../../src/deck/DeckContext';
import { Scene, useSceneTime, interpolate, spring, riseIn, easeInOut } from '../../../../src/scene';
import { AppWindow, Pointer, typed, clickFlash, popIn, dimAfter, type CursorKey } from '../../../../src/walkthrough';
import { NOTES } from './notes';

/* ── 인공지능 기초 · 2026-2 — 무엇으로 가르칠까: 이미지 분류 AI 프로젝트 (19장) ─────
   plan: ./plan.md — 단일 진실 원천. 발표자 노트는 ./notes.ts (plan.md에서 다시 뽑는다).

   1~3    표지(image) → 지난 모델에 고양이(build) → 오늘의 프로젝트(static)
   4~10   무엇으로 학습시킬까 — 교과서 두 권(scene) → 눈밭 돋보기(scene) → 심사대(build)
          → 조건 다이얼(scene) → 저울(build) → 봉인한 시험 사진(build) → 구하는 길·윤리(static)
   11~17  모델을 쓰는 프로그램 — 바나나 언제 먹지? 체험(static) → 플러그와 콘센트(scene)
          → 키오스크 설계(build) → 수위 눈금자(scene) → 코드 생성 프롬프트(build)
          → ChatGPT 절차(walkthrough) → 데이터냐 프로그램이냐(build)
   18~19  활동 시작(activity) → 정리(image, 1장의 거울상)

   테마: 크림 종이 + 산딸기 + 잉크 남색(registry). 지난 수업(v2)의 종이 질감을 잇는다.
   사진: 지난 수업 데이터셋(CC0·PDM, Openverse) — 출처는 데이터셋 출처.csv. */

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

function Page({ nav, notes, children }: { nav: string; notes: string; children: ReactNode }) {
  return (
    <Slide full nav={nav} notes={notes}>
      <Fit>{children}</Fit>
    </Slide>
  );
}

/* ── 자산 경로 ── */
const BASE = 'data/2026-2/인공지능기초/이미지-분류-AI-프로젝트';
const DS = 'data/2026-2/인공지능기초/인공지능은-어떻게-배울까-v2/dataset/치와와-머핀';
const ORIGIN = 'https://2026kijunit.netlify.app';
const URL_ = {
  activity: `${BASE}/활동지.html`,
  tm: 'https://teachablemachine.withgoogle.com/train',
  openverse: 'https://openverse.org',
  chatgpt: 'https://chatgpt.com',
};
const IMG = {
  cover: `${BASE}/images/stage-darkroom.png`,
  workbench: `${BASE}/images/stage-workbench.png`,
  finish: `${BASE}/images/stage-finish.png`,
  huskySnow: `${BASE}/images/card-husky-snow.png`,
  demoShot: `${BASE}/images/demo-shot.png`,
  qrActivity: `${BASE}/images/qr-activity.svg`,
  cat: `${BASE}/images/photo-cat-awake.jpg`,
  catAsleep: `${BASE}/images/photo-cat-asleep.jpg`,
};
const SVG = {
  bookA: 'assets/svg/open-textbook-brown.svg',
  bookB: 'assets/svg/open-textbook-teal.svg',
  magnifier: 'assets/svg/magnifier-handle.svg',
  plug: 'assets/svg/power-plug.svg',
  outlet: 'assets/svg/power-outlet.svg',
  gauge: 'assets/svg/water-gauge-ruler.svg',
};
/* 눈금자 SVG(0 0 140 600)의 100% 눈금 y=50, 0% 눈금 y=550 */
const GAUGE = { top100: 50 / 600, bottom0: 550 / 600, aspect: 140 / 600 };

/* 데이터셋 사진 고르기 — 용도별 (photo-picks) */
const ph = (f: string) => `${DS}/${f}`;
const PICK = {
  s2chi: ph('시험/시험_07.jpg'),
  s4brown: ['치와와/치와와_44.jpg', '치와와/치와와_75.jpg', '치와와/치와와_21.jpg', '치와와/치와와_57.jpg'].map(ph),
  s4varied: ['치와와/치와와_17.jpg', '치와와/치와와_40.jpg', '치와와/치와와_48.jpg', '치와와/치와와_79.jpg'].map(ph),
  s4white: ph('시험/시험_05.jpg'),
  s6good: ph('치와와/치와와_17.jpg'),
  s6small: ph('치와와/치와와_24.jpg'),
  s6blur: ph('치와와/치와와_31.jpg'),
  s7: ['치와와/치와와_18.jpg', '치와와/치와와_57.jpg', '치와와/치와와_78.jpg', '치와와/치와와_34.jpg', '치와와/치와와_52.jpg'].map(ph),
  pile: ['치와와/치와와_02.jpg', '머핀/머핀_05.jpg', '치와와/치와와_06.jpg', '머핀/머핀_06.jpg', '치와와/치와와_22.jpg', '머핀/머핀_07.jpg'].map(ph),
};
/* 신뢰도 수치 — 실측값이면 MEASURED=true, 아니면 화면에 "예시 수치"를 붙인다 */
const VAL = {
  measured: true, // 데모 모델 실측 (plan F11)
  chi: [100, 0],
  cat: [99.8, 0.2],
};

/* ── 색·타이포 ── */
const C = {
  berry: '#9c3d6e',
  berrySoft: 'rgba(156,61,110,0.12)',
  ink: '#2b3a55',
  inkSoft: 'rgba(43,58,85,0.10)',
  amber: '#d98e04',
  amberSoft: 'rgba(217,142,4,0.15)',
  green: '#2f8f5b',
  greenSoft: 'rgba(47,143,91,0.13)',
  red: '#c0392b',
  redSoft: 'rgba(192,57,43,0.12)',
  paper: '#f3eee3',
  text: '#262a33',
};

const abs = (x: number, y: number, w?: number, h?: number): CSSProperties => ({
  position: 'absolute',
  left: x,
  top: y,
  width: w,
  height: h,
});
const kick: CSSProperties = {
  fontSize: 17,
  fontWeight: 700,
  letterSpacing: '0.16em',
  color: 'var(--fg-faint)',
};
const h1: CSSProperties = {
  fontFamily: 'var(--font-head)',
  fontWeight: 800,
  letterSpacing: '-0.03em',
  lineHeight: 1.12,
  fontSize: 60,
  wordBreak: 'keep-all',
  margin: 0,
  color: 'var(--fg)',
};
const h2: CSSProperties = { ...h1, fontSize: 50 };
const h3: CSSProperties = { ...h1, fontSize: 30 };
const body: CSSProperties = { fontSize: 24, lineHeight: 1.5, color: 'var(--fg-muted)', wordBreak: 'keep-all' };
const small: CSSProperties = { fontSize: 17, lineHeight: 1.45, color: 'var(--fg-faint)', wordBreak: 'keep-all' };
const mono: CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };
const card: CSSProperties = {
  background: 'var(--surface-2)',
  border: '1px solid var(--hair)',
  borderRadius: 18,
  boxShadow: '0 16px 44px -30px rgba(38,42,51,0.4)',
};
const trans = 'all 0.7s cubic-bezier(0.22, 1, 0.36, 1)';

function Head({ k, children, x = 110, y = 64, w = 1700, size }: { k: string; children: ReactNode; x?: number; y?: number; w?: number; size?: number }) {
  return (
    <div style={abs(x, y, w)}>
      <div style={kick}>{k}</div>
      <h2 style={{ ...h2, ...(size ? { fontSize: size } : {}), marginTop: 10 }}>{children}</h2>
    </div>
  );
}

function Chip({ color = C.berry, children, style }: { color?: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontWeight: 800,
        fontSize: 19,
        color,
        background: `color-mix(in srgb, ${color} 11%, white)`,
        border: `1.5px solid color-mix(in srgb, ${color} 45%, transparent)`,
        borderRadius: 999,
        padding: '6px 16px',
        wordBreak: 'keep-all',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/* 정식 용어 + 한 줄 풀이 칩 (ELI5 원칙 2) */
function Term({ term, gloss, color = C.berry, style }: { term: string; gloss: string; color?: string; style?: CSSProperties }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, ...style }}>
      <span style={{ fontWeight: 900, fontSize: 27, color, whiteSpace: 'nowrap' }}>{term}</span>
      <span style={{ ...body, fontSize: 21 }}>{gloss}</span>
    </div>
  );
}

function Photo({ src, style, blur, alt = '' }: { src: string; style?: CSSProperties; blur?: number; alt?: string }) {
  return (
    <div style={{ overflow: 'hidden', borderRadius: 12, background: '#e7e0d2', border: '3px solid white', boxShadow: '0 10px 26px -14px rgba(38,42,51,0.55)', ...style }}>
      <img
        src={src}
        alt={alt}
        draggable={false}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: blur ? `blur(${blur}px)` : undefined }}
      />
    </div>
  );
}

function LinkBtn({ href, children, big, style }: { href: string; children: ReactNode; big?: boolean; style?: CSSProperties }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        padding: big ? '20px 38px' : '13px 26px',
        borderRadius: 999,
        background: 'var(--accent)',
        color: 'var(--accent-ink)',
        fontWeight: 800,
        fontSize: big ? 30 : 22,
        textDecoration: 'none',
        boxShadow: 'var(--glow)',
        ...style,
      }}
    >
      {children}
    </a>
  );
}

function Credit({ style, cat }: { style?: CSSProperties; cat?: boolean }) {
  return (
    <div style={{ ...small, fontSize: 15, ...style }}>
      사진: CC0 · 퍼블릭 도메인 (Openverse) · 치와와·머핀은 지난 시간 데이터셋(출처.csv)
      {cat && ' · 고양이: doublefire1 (Flickr) · Jonas Nilsson Lee (StockSnap)'}
    </div>
  );
}

function Stage({ src, scrim }: { src: string; scrim: string }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: C.paper }} aria-hidden>
      <img src={src} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: scrim }} />
    </div>
  );
}

/* 신뢰도 막대 한 줄 */
function ConfBar({ label, pct, color, w = 560, active }: { label: string; pct: number; color: string; w?: number; active?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <div style={{ width: 120, fontWeight: 800, fontSize: 28, color: active ? color : 'var(--fg-muted)' }}>{label}</div>
      <div style={{ width: w, height: 40, borderRadius: 10, background: 'rgba(38,42,51,0.08)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 10, transition: trans }} />
      </div>
      <div style={{ ...mono, width: 100, fontWeight: 800, fontSize: 30, color: active ? color : 'var(--fg-muted)' }}>{pct}%</div>
    </div>
  );
}

/* ══ S1 · 무엇으로 가르칠까 (image) ══════════════════════════════════════ */
function S01() {
  return (
    <>
      <Stage src={IMG.cover} scrim="linear-gradient(180deg, rgba(243,238,227,0.96) 0%, rgba(243,238,227,0.78) 30%, rgba(243,238,227,0) 52%)" />
      <div style={abs(130, 92, 1300)}>
        <div style={kick}>인공지능 기초 · 지난 시간 다음 이야기</div>
        <h1 style={{ ...h1, fontSize: 104, marginTop: 16 }}>
          무엇으로 <span style={{ color: C.berry }}>가르칠까</span>
        </h1>
        <div style={{ ...body, fontSize: 34, marginTop: 14, color: C.ink, fontWeight: 600 }}>이미지 분류 AI 프로젝트</div>
      </div>
      <div style={{ ...abs(1290, 820, 520), display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-end' }}>
        <Chip color={C.berry} style={{ fontSize: 26, background: 'rgba(255,255,255,0.92)' }}>① 데이터 고르기</Chip>
        <Chip color={C.ink} style={{ fontSize: 26, background: 'rgba(255,255,255,0.92)' }}>② 모델을 쓰는 프로그램</Chip>
      </div>
    </>
  );
}

/* ══ S2 · 지난 시간 모델에 고양이를 넣으면 (build) ═══════════════════════ */
function S02() {
  const { clicks } = useDeck();
  const input = clicks >= 2 ? 'cat' : clicks >= 1 ? 'chi' : null;
  const v = input === 'cat' ? VAL.cat : input === 'chi' ? VAL.chi : [0, 0];
  const queue = [
    { key: 'chi', src: PICK.s2chi, label: '치와와 (시험 사진)' },
    { key: 'cat', src: IMG.cat, label: '고양이' },
  ];
  return (
    <>
      <Head k="지난 시간 모델을 다시 꺼내 보면">지난 시간 모델에 <span style={{ color: C.berry }}>고양이</span>를 넣으면?</Head>

      {/* 판정기 — Teachable Machine 미리보기를 닮은 패널 (dominant) */}
      <div style={{ ...card, ...abs(110, 240, 1080, 640), padding: 40 }}>
        <div style={{ ...small, fontWeight: 700, letterSpacing: '0.1em' }}>미리보기 · 치와와 / 머핀 모델</div>
        <div style={{ display: 'flex', gap: 44, marginTop: 24, alignItems: 'center' }}>
          <div style={{ width: 340, height: 340, borderRadius: 16, border: '3px dashed var(--hair)', display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
            {input ? (
              <img src={input === 'cat' ? IMG.cat : PICK.s2chi} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', background: 'white' }} />
            ) : (
              <span style={{ ...small, fontSize: 22 }}>사진을 넣어 보자</span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
            <ConfBar label="치와와" pct={v[0]} color={C.berry} w={400} active={v[0] > v[1]} />
            <ConfBar label="머핀" pct={v[1]} color={C.amber} w={400} active={v[1] > v[0]} />
            <div style={{ ...small, marginTop: 4 }}>
              막대 = <b style={{ color: C.ink }}>신뢰도</b>{VAL.measured ? ' · 데모 모델 실측' : ' · 예시 수치'}
            </div>
          </div>
        </div>
        <Build at={2} style={abs(600, 470)}>
          <div style={{ background: C.red, color: 'white', fontWeight: 800, fontSize: 30, padding: '14px 26px', borderRadius: 22, boxShadow: '0 12px 30px -14px rgba(192,57,43,0.7)' }}>
            고양이인데요? 🤔
          </div>
        </Build>
      </div>

      {/* 오른쪽 대기열 */}
      <div style={{ ...abs(1300, 250, 500), display: 'flex', flexDirection: 'column', gap: 26 }}>
        {queue.map((q, i) => {
          const used = (q.key === 'chi' && clicks >= 1) || (q.key === 'cat' && clicks >= 2);
          return (
            <div key={q.key} style={{ display: 'flex', alignItems: 'center', gap: 20, opacity: used ? 0.4 : 1, transition: trans }}>
              <Photo src={q.src} style={{ width: 180, height: 180, background: 'white' }} />
              <div style={{ ...body, fontWeight: 700, color: C.ink }}>
                {i + 1}. {q.label}
              </div>
            </div>
          );
        })}
        <Build at={1} style={{ fontWeight: 800, fontSize: 22, color: C.green }}>
          ✓ 치와와는 치와와로 판정
        </Build>
      </div>

      <Build at={3} style={abs(110, 920, 1700)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, background: C.inkSoft, borderRadius: 18, padding: '20px 30px' }}>
          <div style={{ ...h3, fontSize: 32, color: C.ink }}>이 모델의 세상에는 치와와와 머핀뿐</div>
          <Term term="신뢰도" gloss="모델이 각 클래스에 매긴 확률 · 모두 더하면 100%" color={C.berry} />
        </div>
      </Build>
      <Credit style={abs(110, 1040)} cat />
    </>
  );
}

/* ══ S3 · 오늘의 프로젝트 (static) ══════════════════════════════════════ */
function S03() {
  const stations = [
    { n: '주제 정하기', x: 170, y: 640 },
    { n: '데이터 모으기', x: 470, y: 560 },
    { n: '학습·시험·분석', x: 780, y: 610 },
    { n: '프로그램 설계·생성', x: 1090, y: 700 },
    { n: '테스트·개선', x: 1390, y: 620 },
    { n: '제출', x: 1660, y: 540 },
  ];
  const path = 'M 120 660 C 300 520, 420 520, 520 575 S 700 660, 820 620 S 1000 720, 1130 712 S 1300 600, 1430 630 S 1600 560, 1760 520';
  return (
    <>
      <div style={abs(110, 70, 1300)}>
        <div style={kick}>오늘의 프로젝트</div>
        <h1 style={{ ...h1, fontSize: 66, marginTop: 12 }}>
          사람들에게 <span style={{ color: C.berry }}>도움이 되는</span> 이미지 분류 AI
        </h1>
        <div style={{ display: 'flex', gap: 14, marginTop: 26, flexWrap: 'wrap' }}>
          <Chip>✓ 클래스 2개 이상</Chip>
          <Chip>✓ 학습 데이터는 직접 모은다</Chip>
          <Chip color={C.ink}>✓ 모델을 쓰는 웹 프로그램 1개</Chip>
        </div>
      </div>

      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0 }} aria-hidden>
        <path d={path} fill="none" stroke="rgba(38,42,51,0.22)" strokeWidth={10} strokeLinecap="round" strokeDasharray="2 22" />
      </svg>
      {stations.map((s, i) => {
        const col = i < 3 ? C.berry : C.ink;
        return (
          <div key={s.n} style={{ ...abs(s.x - 90, s.y - 34, 180), textAlign: 'center' }}>
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: col, color: 'white', fontWeight: 900, fontSize: 30, display: 'grid', placeItems: 'center', margin: '0 auto', boxShadow: '0 10px 24px -10px rgba(38,42,51,0.6)' }}>
              {i + 1}
            </div>
            <div style={{ fontWeight: 800, fontSize: 23, marginTop: 10, color: col, wordBreak: 'keep-all' }}>{s.n}</div>
          </div>
        );
      })}
      <div style={{ ...abs(150, 800, 760), borderTop: `5px solid ${C.berry}`, paddingTop: 10, fontWeight: 900, fontSize: 26, color: C.berry }}>① 모델 만들기</div>
      <div style={{ ...abs(1010, 820, 760), borderTop: `5px solid ${C.ink}`, paddingTop: 10, fontWeight: 900, fontSize: 26, color: C.ink }}>② 프로그램 만들기</div>

      <div style={{ ...card, ...abs(1380, 70, 440, 400), padding: '24px 28px', transform: 'rotate(1.2deg)' }}>
        <div style={{ ...small, fontWeight: 800, color: C.ink }}>주제 예시 · 감만 잡기</div>
        {[
          ['분리배출 도우미', '플라스틱 / 캔 / 종이'],
          ['교실 분실물 주인 찾기', '필통 종류'],
          ['식물 잎 상태', '싱싱함 / 시듦'],
        ].map(([a, b]) => (
          <div key={a} style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 23 }}>{a}</div>
            <div style={{ ...small, fontSize: 19 }}>{b}</div>
          </div>
        ))}
        <div style={{ marginTop: 18, fontWeight: 800, fontSize: 19, color: C.amber, wordBreak: 'keep-all' }}>⚠ 사람 얼굴을 분류하는 주제는 하지 않는다</div>
      </div>
      <div style={{ ...abs(110, 950, 1700), ...body, fontSize: 25, color: C.ink, fontWeight: 600 }}>
        주제 고르는 요령: <b style={{ color: C.berry }}>내가 직접 사진을 찍거나 구할 수 있는 대상</b> (교실·학교·집에 있는 것)
      </div>
    </>
  );
}

/* ══ S4 · 같은 학생, 다른 교과서 (scene) ═══════════════════════════════ */
function TextbookScene() {
  const t = useSceneTime();
  const boxA = { x: 540, y: 300, w: 280, h: 190 };
  const boxB = { x: 1100, y: 300, w: 280, h: 190 };
  const bookA = { x: 150, y: 580 };
  const bookB = { x: 1350, y: 580 };
  const fill = interpolate(t, [0.3, 1.8], [0, 1], easeInOut);
  const drop = interpolate(t, [1.9, 3.0], [0, 1], easeInOut);
  const say = spring(t, 3.2, 0.7);
  const labels = spring(t, 4.6, 0.7);

  const flying = (srcs: string[], book: { x: number; y: number }, box: typeof boxA, side: number) =>
    srcs.map((src, i) => {
      const p = interpolate(t, [0.3 + i * 0.22, 1.1 + i * 0.22], [0, 1], easeInOut);
      const sx = book.x + 62 + (i % 2) * 172;
      const sy = book.y + 76 + Math.floor(i / 2) * 72;
      const ex = box.x + box.w / 2 - 50;
      const ey = box.y + box.h / 2 - 40;
      const x = sx + (ex - sx) * p;
      const y = sy + (ey - sy) * p - Math.sin(Math.PI * p) * 120;
      const s = 1 - 0.55 * p;
      return (
        <Photo
          key={`${side}-${i}`}
          src={src}
          style={{ ...abs(x, y, 124, 66), transform: `scale(${s}) rotate(${(i - 1.5) * 4 * (1 - p)}deg)`, opacity: p >= 1 ? 0 : 1, zIndex: 3 }}
        />
      );
    });

  const ModelBox = ({ b, name, tint }: { b: typeof boxA; name: string; tint: string }) => (
    <div style={{ ...card, ...abs(b.x, b.y, b.w, b.h), padding: 20, borderColor: tint, borderWidth: 2, zIndex: 2 }}>
      <div style={{ fontWeight: 900, fontSize: 28, color: tint }}>{name}</div>
      <div style={{ ...small, marginTop: 4 }}>같은 Teachable Machine</div>
      <div style={{ marginTop: 18, height: 18, borderRadius: 9, background: 'rgba(38,42,51,0.08)' }}>
        <div style={{ width: `${fill * 100}%`, height: '100%', borderRadius: 9, background: tint }} />
      </div>
      <div style={{ ...small, fontSize: 15, marginTop: 6 }}>학습 {fill >= 1 ? '완료' : '중…'}</div>
    </div>
  );

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ ...abs(110, 56, 1700), textAlign: 'center', ...riseIn(t, 0) }}>
        <div style={kick}>무엇으로 학습시킬까</div>
        <h2 style={{ ...h2, marginTop: 10, marginInline: 'auto' }}>
          모델은 <span style={{ color: C.berry }}>데이터가 가르친 것</span>만 안다
        </h2>
      </div>

      <ModelBox b={boxA} name="모델 A" tint={C.amber} />
      <ModelBox b={boxB} name="모델 B" tint={C.green} />

      {/* 교과서 두 권 (svg) + 표지 위 사진 */}
      {[
        { b: bookA, svg: SVG.bookA, srcs: PICK.s4brown, cap: 'A의 교과서 · 갈색 털 치와와만', col: C.amber },
        { b: bookB, svg: SVG.bookB, srcs: PICK.s4varied, cap: 'B의 교과서 · 여러 털색의 치와와', col: C.green },
      ].map((bk) => (
        <div key={bk.cap}>
          <img src={bk.svg} alt="" style={{ ...abs(bk.b.x, bk.b.y, 420, 300), objectFit: 'contain', opacity: 0.95 }} />
          {bk.srcs.map((src, i) => (
            <Photo key={i} src={src} style={{ ...abs(bk.b.x + 62 + (i % 2) * 172, bk.b.y + 76 + Math.floor(i / 2) * 72, 124, 66), opacity: 0.35 + 0.65 * (1 - fill) }} />
          ))}
          <div style={{ ...abs(bk.b.x, bk.b.y + 300, 420), textAlign: 'center', fontWeight: 800, fontSize: 22, color: bk.col, wordBreak: 'keep-all' }}>{bk.cap}</div>
        </div>
      ))}
      {flying(PICK.s4brown, bookA, boxA, 0)}
      {flying(PICK.s4varied, bookB, boxB, 1)}

      {/* 시험 사진 한 장 — 두 모델 사이로 내려온다 (dominant) */}
      <div style={{ ...abs(870, -260 + drop * 560, 180), textAlign: 'center', zIndex: 4 }}>
        <Photo src={PICK.s4white} style={{ width: 180, height: 180, borderColor: C.ink }} />
        <div style={{ fontWeight: 800, fontSize: 19, color: C.ink, marginTop: 8 }}>처음 보는 흰 털 치와와</div>
      </div>

      {/* 판정 말풍선 */}
      <div style={{ ...abs(boxA.x + 10, boxA.y - 92), opacity: say, transform: `translateY(${(1 - say) * 14}px)` }}>
        <div style={{ background: 'white', border: `2.5px solid ${C.amber}`, borderRadius: 18, padding: '10px 22px', fontWeight: 900, fontSize: 30, color: C.amber }}>머핀 58%? 🤔</div>
      </div>
      <div style={{ ...abs(boxB.x + 10, boxB.y - 92), opacity: say, transform: `translateY(${(1 - say) * 14}px)` }}>
        <div style={{ background: 'white', border: `2.5px solid ${C.green}`, borderRadius: 18, padding: '10px 22px', fontWeight: 900, fontSize: 30, color: C.green }}>치와와 91% ✓</div>
      </div>
      <div style={{ ...abs(1100, 500, 280), textAlign: 'center', ...small, fontSize: 15, opacity: say }}>화면 수치는 예시</div>

      <div style={{ ...abs(610, 650, 700), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, opacity: labels, transform: `translateY(${(1 - labels) * 12}px)` }}>
        <Term term="학습 데이터" gloss="모델에게 보여 주며 가르치는 사진" />
        <Term term="시험 데이터" gloss="학습에 쓰지 않고 남겨 둔 확인용 사진" color={C.ink} />
      </div>
    </div>
  );
}

/* ══ S5 · 늑대를 알아본 줄 알았는데, 눈을 보고 있었다 (scene) ═════════════ */
function SnowScene() {
  const t = useSceneTime();
  const cardBox = { x: 110, y: 200, w: 1080, h: 660 };
  // 돋보기 경로 (카드 기준 %)
  const mx =
    t < 1.5 ? interpolate(t, [0.2, 1.5], [18, 62], easeInOut) : interpolate(t, [3.0, 4.2], [62, 48], easeInOut);
  const my =
    t < 1.5 ? interpolate(t, [0.2, 1.5], [26, 38], easeInOut) : interpolate(t, [3.0, 4.2], [38, 80], easeInOut);
  const verdict = spring(t, 1.6, 0.6);
  const mask = interpolate(t, [3.4, 4.4], [0, 1], easeInOut);
  const label = spring(t, 4.7, 0.7);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ ...abs(110, 56, 1700), ...riseIn(t, 0) }}>
        <div style={kick}>지름길 학습 · 실제 연구 사례</div>
        <h2 style={{ ...h2, fontSize: 48, marginTop: 10 }}>
          늑대를 알아본 줄 알았는데, <span style={{ color: C.berry }}>눈</span>을 보고 있었다
        </h2>
      </div>

      <div style={{ ...abs(cardBox.x, cardBox.y, cardBox.w, cardBox.h), borderRadius: 18, overflow: 'hidden', border: '4px solid white', boxShadow: 'var(--shadow)', background: '#dfe6ec' }}>
        <img src={IMG.huskySnow} alt="눈밭 위의 허스키 (잉크·수채 그림)" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden>
          <defs>
            <mask id="snowHole">
              <rect width="100" height="100" fill="white" />
              <ellipse cx="50" cy="86" rx="56" ry="17" fill="black" />
            </mask>
          </defs>
          <rect width="100" height="100" fill="rgba(25,28,40,0.62)" mask="url(#snowHole)" opacity={mask} />
          <ellipse cx="50" cy="86" rx="56" ry="17" fill="none" stroke={C.amber} strokeWidth={0.5} strokeDasharray="1.4 1" opacity={mask} />
        </svg>
        <div style={{ ...abs(40, 380), opacity: mask }}>
          <Chip color={C.amber} style={{ fontSize: 24, background: 'rgba(255,255,255,0.95)' }}>모델이 근거로 삼은 곳</Chip>
        </div>
        <img src={SVG.magnifier} alt="" style={{ ...abs((mx / 100) * cardBox.w - 88, (my / 100) * cardBox.h - 88, 240, 240), objectFit: 'contain', filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.35))' }} />
      </div>

      <div style={{ ...abs(1260, 210, 560) }}>
        <div style={{ ...card, padding: '26px 30px' }}>
          <div style={{ ...small, fontWeight: 800 }}>허스키 · 늑대 분류기의 판정</div>
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 18, opacity: verdict, transform: `scale(${0.8 + 0.2 * verdict})`, transformOrigin: 'left center' }}>
            <span style={{ fontSize: 64, fontWeight: 900, color: C.amber, border: `5px solid ${C.amber}`, borderRadius: 14, padding: '2px 22px', transform: 'rotate(-4deg)' }}>늑대</span>
            <span style={{ ...body, fontSize: 22 }}>(실제로는 허스키)</span>
          </div>
        </div>
        <div style={{ marginTop: 26, opacity: label, transform: `translateY(${(1 - label) * 12}px)` }}>
          <div style={{ fontWeight: 900, fontSize: 34, color: C.berry }}>지름길 학습</div>
          <div style={{ ...body, fontSize: 22, marginTop: 6 }}>의도한 특징 대신, 우연히 함께 찍힌<br />특징으로 구별하는 일</div>
          <div style={{ ...small, marginTop: 14 }}>
            학습한 늑대 사진이 모두 눈 배경이었다. 연구자들이 설명 기법을 시험하려고 일부러 만든 실험.
            <br />Ribeiro · Singh · Guestrin, KDD 2016
          </div>
        </div>
      </div>

      <Build at={1} style={abs(110, 900, 1700)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, background: C.berrySoft, borderRadius: 18, padding: '20px 30px' }}>
          <span style={{ fontSize: 34 }}>📸</span>
          <span style={{ ...h3, fontSize: 30, color: C.ink }}>
            우리 버전: 치와와는 전부 거실 바닥에서, 머핀은 전부 흰 접시 위에서 찍었다면?
          </span>
        </div>
      </Build>
    </div>
  );
}

/* ══ S6 · 명확성과 품질: 심사대 (build) ═══════════════════════════════ */
function S06() {
  const { clicks } = useDeck();
  const step = Math.min(clicks, 3);
  const items = [
    { src: PICK.s6good, kind: 'good' as const },
    { src: PICK.s6small, kind: 'small' as const },
    { src: PICK.s6blur || PICK.s6good, kind: 'blur' as const },
  ];
  const cur = step >= 1 ? items[step - 1] : null;
  const passed = step >= 1 ? [items[0]] : [];
  const retake = items.slice(1, step);
  const thumb = (it: (typeof items)[number], i: number) => (
    <Photo
      key={i}
      src={it.src}
      blur={it.kind === 'blur' && !PICK.s6blur ? 3 : undefined}
      style={{ width: 120, height: 92, transform: `rotate(${(i % 2 ? 4 : -3)}deg)`, marginLeft: i ? -30 : 0 }}
    />
  );
  return (
    <>
      <Head k="데이터 기준 ①② 명확성 · 품질">
        사진 속 <span style={{ color: C.berry }}>주인공</span>이 내 클래스인가
      </Head>

      {/* 심사대 (dominant) */}
      <div style={{ ...abs(620, 230, 680, 600) }}>
        <div style={{ ...abs(0, 0, 680, 500), borderRadius: 20, background: 'rgba(38,42,51,0.05)', border: '2px dashed var(--hair)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
          {!cur && <span style={{ ...small, fontSize: 24 }}>심사대</span>}
          {cur && cur.kind === 'good' && <Photo src={cur.src} style={{ width: 560, height: 420 }} />}
          {cur && cur.kind === 'small' && (
            PICK.s6small !== PICK.s6good ? (
              <Photo src={cur.src} style={{ width: 560, height: 420 }} />
            ) : (
              <div style={{ width: 560, height: 420, background: '#cbbfa8', position: 'relative', borderRadius: 12, border: '3px solid white' }}>
                <Photo src={cur.src} style={abs(420, 300, 110, 90)} />
              </div>
            )
          )}
          {cur && cur.kind === 'blur' && <Photo src={cur.src} blur={PICK.s6blur ? undefined : 7} style={{ width: 560, height: 420, filter: PICK.s6blur ? undefined : 'brightness(0.62)' }} />}
        </div>
        {/* 도장 */}
        {cur && (
          <div
            key={step}
            style={{
              ...abs(cur.kind === 'good' ? 430 : 380, 330),
              fontSize: 52,
              fontWeight: 900,
              color: cur.kind === 'good' ? C.green : C.amber,
              border: `6px solid ${cur.kind === 'good' ? C.green : C.amber}`,
              borderRadius: 16,
              padding: '4px 22px',
              background: 'rgba(255,255,255,0.88)',
              transform: 'rotate(-8deg)',
            }}
          >
            {cur.kind === 'good' ? '통과' : '다시 찍기'}
          </div>
        )}
        <div style={{ ...abs(0, 524, 680), display: 'flex', justifyContent: 'center', gap: 14 }}>
          {step >= 1 && <Chip color={C.green}>명확성 · 대상이 사진의 주인공</Chip>}
          {step >= 3 && <Chip color={C.amber}>품질 · 초점·밝기·대표성</Chip>}
        </div>
        <Build at={2}><span /></Build>
        {step === 2 && (
          <div style={{ ...abs(440, -36), whiteSpace: 'nowrap', background: 'white', border: `2.5px solid ${C.amber}`, borderRadius: 20, padding: '10px 22px', fontWeight: 900, fontSize: 28, color: C.amber }}>주인공이 누구?</div>
        )}
      </div>

      {/* 왼쪽 아래 더미 두 개 */}
      <div style={abs(110, 560, 440)}>
        <div style={{ fontWeight: 900, fontSize: 26, color: C.green }}>통과</div>
        <div style={{ display: 'flex', marginTop: 10, minHeight: 100 }}>{passed.map(thumb)}</div>
        <div style={{ fontWeight: 900, fontSize: 26, color: C.amber, marginTop: 24 }}>다시 찍기</div>
        <div style={{ display: 'flex', marginTop: 10, minHeight: 100 }}>{retake.map(thumb)}</div>
      </div>

      {/* 오른쪽 위 대기열 + 나쁜 예 목록 */}
      <div style={{ ...abs(1390, 240, 430) }}>
        <div style={{ ...small, fontWeight: 800, color: C.ink }}>이런 사진은 다시 찍는다</div>
        {['대상이 구석에 작게', '다른 대상과 함께 찍힘', '흐리거나 너무 어두움', '다른 클래스와 겹쳐 보임'].map((s) => (
          <div key={s} style={{ ...body, fontSize: 22, marginTop: 12 }}>✕ {s}</div>
        ))}
      </div>

      <Build at={4} style={abs(110, 900, 1700)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 30, background: C.greenSoft, borderRadius: 18, padding: '20px 30px' }}>
          <span style={{ ...h3, fontSize: 30, color: C.green }}>이렇게 고친다</span>
          <span style={{ ...body, fontSize: 26, color: C.text }}>대상 위주로 다시 찍기 · 필요하면 대상 부분만 잘라 쓰기</span>
        </div>
      </Build>
      <Credit style={abs(110, 1040)} />
    </>
  );
}

/* ══ S7 · 다양성: 조건 다이얼 (scene) ══════════════════════════════════ */
function DialScene() {
  const t = useSceneTime();
  const dials = [
    { n: '각도', x: 150, y: 250, at: 1 },
    { n: '조명', x: 300, y: 430, at: 2 },
    { n: '배경', x: 300, y: 630, at: 3 },
    { n: '종류', x: 150, y: 810, at: 4 },
  ];
  const caps = ['정면 · 밝은 실내', '옆모습', '어두운 방', '바깥', '다른 털색'];
  const idx = t < 1 ? 0 : Math.min(4, Math.floor(t));
  const strip = spring(t, 5.2, 0.8);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ ...abs(110, 56, 1700), ...riseIn(t, 0) }}>
        <div style={kick}>데이터 기준 ③ 다양성</div>
        <h2 style={{ ...h2, marginTop: 10 }}>
          한 모습만 보여 주면 <span style={{ color: C.berry }}>그 모습만</span> 안다
        </h2>
      </div>

      {dials.map((d) => {
        const ang = interpolate(t, [d.at, d.at + 0.8], [-70, 70], easeInOut);
        const active = t >= d.at && t < d.at + 1;
        const done = t >= d.at + 0.8;
        const col = active ? C.berry : done ? C.ink : 'rgba(38,42,51,0.35)';
        return (
          <div key={d.n} style={{ ...abs(d.x, d.y, 360), display: 'flex', alignItems: 'center', gap: 24 }}>
            <svg width={130} height={130} viewBox="-65 -65 130 130" aria-hidden>
              <circle r={58} fill="white" stroke={col} strokeWidth={5} />
              {Array.from({ length: 9 }, (_, i) => {
                const a = ((-80 + i * 20) * Math.PI) / 180;
                return <line key={i} x1={Math.sin(a) * 44} y1={-Math.cos(a) * 44} x2={Math.sin(a) * 52} y2={-Math.cos(a) * 52} stroke="rgba(38,42,51,0.35)" strokeWidth={3} />;
              })}
              <g transform={`rotate(${ang})`}>
                <line x1={0} y1={8} x2={0} y2={-40} stroke={col} strokeWidth={8} strokeLinecap="round" />
              </g>
              <circle r={10} fill={col} />
            </svg>
            <span style={{ fontWeight: 900, fontSize: 34, color: col }}>{d.n}</span>
          </div>
        );
      })}

      {/* 사진 자리 (dominant) */}
      <div style={{ ...abs(780, 190, 1030, 640) }}>
        {PICK.s7.map((src, i) => (
          <Photo key={i} src={src} style={{ ...abs(0, 0, 1030, 640), opacity: i === idx ? 1 : 0, transition: 'opacity 0.35s' }} />
        ))}
        <div style={{ ...abs(24, 24) }}>
          <Chip color={C.ink} style={{ fontSize: 24, background: 'rgba(255,255,255,0.94)' }}>
            치와와 · {caps[idx]}
          </Chip>
        </div>
      </div>

      <div style={{ ...abs(780, 860, 1030), opacity: strip, transform: `translateY(${(1 - strip) * 16}px)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontWeight: 900, fontSize: 26, color: C.berry, marginRight: 8, wordBreak: 'keep-all' }}>같은 클래스,<br />다른 모습</span>
          {PICK.s7.map((src, i) => (
            <Photo key={i} src={src} style={{ width: 150, height: 110 }} />
          ))}
        </div>
      </div>

      <Build at={1} style={abs(110, 960, 640)}>
        <Chip color={C.ink} style={{ fontSize: 22 }}>다양성은 지름길 학습도 막는다 · 배경이 섞이면 배경으로 못 가른다</Chip>
      </Build>
    </div>
  );
}

/* ══ S8 · 양과 균형: 저울 (build) ════════════════════════════════════ */
function S08() {
  const { clicks } = useDeck();
  const step = Math.min(clicks, 3);
  const left = step === 2 ? 60 : 30;
  const right = step === 2 ? 10 : 30;
  // 무거운 쪽(왼쪽 치와와)이 내려간다 — tilt는 왼쪽이 내려가는 각도
  const tilt = step === 2 ? 12 : 0;
  const cx = 960;
  const cy = 430;
  const arm = 380;
  const rad = (tilt * Math.PI) / 180;
  const lx = cx - arm * Math.cos(rad);
  const ly = cy + arm * Math.sin(rad);
  const rx = cx + arm * Math.cos(rad);
  const ry = cy - arm * Math.sin(rad);
  const Pan = ({ x, y, n, label, col }: { x: number; y: number; n: number; label: string; col: string }) => (
    <div style={{ ...abs(x - 170, y, 340), transition: trans }}>
      <div style={{ height: 150, width: 3, background: 'rgba(38,42,51,0.45)', margin: '0 auto' }} />
      <div style={{ display: 'flex', flexWrap: 'wrap-reverse', gap: 4, justifyContent: 'center', alignContent: 'flex-start', height: 90, width: 300, margin: '0 auto', padding: '0 6px' }}>
        {Array.from({ length: Math.round(n / 2) }, (_, i) => (
          <div key={i} style={{ width: 24, height: 18, borderRadius: 3, background: col, opacity: 0.55 + (i % 3) * 0.15 }} />
        ))}
      </div>
      <div style={{ height: 14, borderRadius: '0 0 170px 170px', background: 'rgba(38,42,51,0.55)', width: 320, margin: '0 auto' }} />
      <div style={{ textAlign: 'center', marginTop: 10, fontWeight: 900, fontSize: 30, color: col }}>
        {label} <span style={mono}>{n}</span>장
      </div>
    </div>
  );
  return (
    <>
      <Head k="데이터 기준 ④ 양과 균형">
        한쪽이 많으면 <span style={{ color: C.berry }}>그쪽으로 기운다</span>
      </Head>

      {/* 저울 — 가운데를 관통하는 dominant (순수 도형) */}
      <div style={{ ...abs(cx - 8, cy, 16, 450), background: 'rgba(38,42,51,0.55)', borderRadius: 8 }} />
      <div style={{ ...abs(cx - 150, cy + 440, 300, 26), background: 'rgba(38,42,51,0.55)', borderRadius: 13 }} />
      <div style={{ ...abs(cx - arm - 20, cy - 8, (arm + 20) * 2, 16), background: C.ink, borderRadius: 8, transform: `rotate(${-tilt}deg)`, transformOrigin: 'center', transition: trans }} />
      <div style={{ ...abs(cx - 20, cy - 20, 40, 40), borderRadius: '50%', background: C.amber }} />
      <Pan x={lx} y={ly} n={left} label="치와와" col={C.berry} />
      <Pan x={rx} y={ry} n={right} label="머핀" col={C.amber} />
      {step === 2 && (
        <div style={{ ...abs(lx - 450, ly + 60) }}>
          <Chip color={C.red} style={{ fontSize: 24, background: 'white' }}>애매한 사진 → 치와와?</Chip>
        </div>
      )}

      <div style={{ ...abs(110, 220, 500) }}>
        <Build at={1}>
          <Chip color={C.green} style={{ fontSize: 22 }}>양 · 클래스당 학습 사진 20장 이상 (권장 30장↑)</Chip>
        </Build>
      </div>
      <Build at={2} style={abs(1290, 220, 520)}>
        <div style={{ ...card, padding: '20px 24px' }}>
          <div style={{ fontWeight: 900, fontSize: 30, color: C.red }}>데이터 편향</div>
          <div style={{ ...body, fontSize: 21, marginTop: 6 }}>데이터가 한쪽 모습·한쪽 클래스로 쏠려 있는 상태</div>
        </div>
      </Build>
      <Build at={3} style={abs(110, 960, 1700)}>
        <div style={{ textAlign: 'center', fontWeight: 800, fontSize: 28, color: C.ink }}>
          모자란 쪽은 버리지 않고 <span style={{ color: C.berry }}>다이얼을 돌려 더 찍어</span> 채운다 · 학습 전에 클래스별 개수 세기
        </div>
      </Build>
    </>
  );
}

/* ══ S9 · 시험 사진은 따로 떼어 둔다 (build) ════════════════════════ */
function S09() {
  const { clicks } = useDeck();
  const split = clicks >= 1;
  const rows = [
    { d: '흰 털 치와와', a: '치와와', m: '치와와', p: 88, ok: true },
    { d: '머핀 위에서 찍음', a: '머핀', m: '머핀', p: 95, ok: true },
    { d: '어두운 방 치와와', a: '치와와', m: '머핀', p: 61, ok: false },
  ];
  return (
    <>
      <Head k="학습 데이터와 시험 데이터">
        시험 사진은 <span style={{ color: C.berry }}>따로 떼어</span> 둔다
      </Head>

      {/* 왼쪽: 사진 더미가 갈라진다 */}
      <div style={abs(110, 250, 760, 640)}>
        {PICK.pile.map((src, i) => {
          const isTest = i >= 4;
          const j = isTest ? i - 4 : i;
          const x = isTest ? (split ? 60 + j * 200 : 340 + j * 60) : (j % 2) * 200;
          const y = isTest ? (split ? 360 : 140) : Math.floor(j / 2) * 135;
          return (
            <Photo
              key={i}
              src={src}
              style={{ ...abs(x, y, 170, 120), transform: `rotate(${((i * 37) % 9) - 4}deg)`, transition: trans, zIndex: isTest ? 2 : 1 }}
            />
          );
        })}
        <div style={{ ...abs(0, 296, 620), borderTop: '4px dashed rgba(38,42,51,0.35)', opacity: split ? 1 : 0, transition: trans }} />
        <div style={{ ...abs(0, -40), fontWeight: 900, fontSize: 26, color: C.berry }}>학습 데이터</div>
        <div style={{ ...abs(20, 330, 520, 230), border: `3px solid ${C.ink}`, borderRadius: 16, background: 'rgba(43,58,85,0.06)', opacity: split ? 1 : 0, transition: trans }}>
          <div style={{ ...abs(18, 180), fontWeight: 900, fontSize: 24, color: C.ink }}>🔒 시험 데이터 · 클래스당 5장 이상</div>
        </div>
      </div>

      <Build at={2} style={abs(110, 900, 800)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 40, color: C.red, fontWeight: 900 }}>✕</span>
          <span style={{ ...body, fontSize: 25, color: C.text }}>학습 사진으로 시험 → 거의 다 맞음 → <b>외운 문제로 시험 보기</b></span>
        </div>
      </Build>

      {/* 오른쪽: 시험 기록표 */}
      <div style={{ ...card, ...abs(960, 240, 860), padding: '24px 28px' }}>
        <div style={{ ...small, fontWeight: 800, color: C.ink }}>시험 기록표 (활동지 C와 같은 칸)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 0.8fr 0.6fr', gap: '10px 12px', marginTop: 16, fontSize: 22, alignItems: 'center' }}>
          {['사진', '정답', '모델 답', '신뢰도', ''].map((h) => (
            <div key={h} style={{ fontWeight: 800, color: 'var(--fg-faint)', fontSize: 18 }}>{h}</div>
          ))}
          {rows.map((r, i) => (
            <Build key={i} at={3} style={{ display: 'contents' }}>
              <div style={{ fontWeight: 700, background: r.ok ? 'transparent' : C.amberSoft, borderRadius: 8, padding: '6px 8px' }}>{r.d}</div>
              <div>{r.a}</div>
              <div style={{ color: r.ok ? C.text : C.red, fontWeight: r.ok ? 500 : 800 }}>{r.m}</div>
              <div style={mono}>{r.p}%</div>
              <div style={{ fontSize: 26, color: r.ok ? C.green : C.red, fontWeight: 900 }}>{r.ok ? '○' : '✕'}</div>
            </Build>
          ))}
        </div>
        <div style={{ ...small, fontSize: 15, marginTop: 16 }}>예시 기록</div>
      </div>
      <Build at={4} style={abs(960, 600, 860)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 900, fontSize: 25, color: C.amber }}>틀린 사진 →</span>
          <Chip color={C.ink}>명확성·품질?</Chip>
          <Chip color={C.ink}>다양성?</Chip>
          <Chip color={C.ink}>양과 균형?</Chip>
        </div>
        <div style={{ fontWeight: 800, fontSize: 27, marginTop: 18, color: C.berry }}>틀린 사진이 다음 데이터의 힌트</div>
      </Build>
    </>
  );
}

/* ══ S10 · 사진을 구하는 길과 지켜야 할 것 (static) ═══════════════════ */
function S10() {
  const ways = [
    { t: '① 직접 찍기', d: '스마트폰 · Teachable Machine 웹캠', w: 22, col: C.berry },
    { t: '② 이용 허락이 열린 사진', d: 'Openverse에서 CC0 · 퍼블릭 도메인 (지난 시간 데이터셋도 여기서)', w: 14, col: C.berry, link: URL_.openverse },
    { t: '③ 검색해서 나온 아무 사진', d: '저작권을 확인할 수 없으면 쓰지 않는다', w: 6, col: 'rgba(38,42,51,0.35)', no: true },
  ];
  const keep = [
    { t: '개인정보', d: '얼굴 · 이름표 · 차량 번호' },
    { t: '저작권', d: '남이 찍은 사진은 이용 허락을 확인' },
    { t: '편향', d: '특정 집단을 차별하는 분류는 만들지 않는다' },
  ];
  return (
    <>
      <Head k="데이터 기준 ⑤ 윤리">
        사진을 <span style={{ color: C.berry }}>구하는 길</span>과 지켜야 할 것
      </Head>
      <div style={abs(110, 250, 960)}>
        <div style={{ ...small, fontWeight: 800, color: C.ink }}>구하는 길 · 위에서부터 권하는 순서</div>
        {ways.map((w) => (
          <div key={w.t} style={{ display: 'flex', gap: 26, alignItems: 'center', marginTop: 34 }}>
            <svg width={150} height={60} aria-hidden>
              <line x1={4} y1={30} x2={118} y2={30} stroke={w.col} strokeWidth={w.w} strokeLinecap="round" strokeDasharray={w.no ? '6 10' : undefined} />
              <path d={`M 112 ${30 - w.w - 6} L 146 30 L 112 ${30 + w.w + 6} Z`} fill={w.col} />
            </svg>
            <div style={{ opacity: w.no ? 0.6 : 1 }}>
              <div style={{ fontWeight: 900, fontSize: 32, color: w.no ? 'var(--fg-muted)' : C.text }}>
                {w.t} {w.no && <span style={{ color: C.red }}>✕</span>}
              </div>
              <div style={{ ...body, fontSize: 22 }}>{w.d}</div>
              {w.link && (
                <a href={w.link} target="_blank" rel="noopener" style={{ fontWeight: 800, fontSize: 22, color: C.berry, textDecoration: 'underline' }}>
                  openverse.org ↗
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
      <div style={abs(1190, 250, 620)}>
        <div style={{ ...small, fontWeight: 800, color: C.ink }}>지켜야 할 것</div>
        {keep.map((k, i) => (
          <div
            key={k.t}
            style={{
              ...card,
              padding: '22px 26px',
              marginTop: i ? -10 : 18,
              transform: `rotate(${[-1.5, 1, -0.5][i]}deg) translateX(${i * 22}px)`,
              border: i === 0 ? `3px solid ${C.amber}` : '1px solid var(--hair)',
              position: 'relative',
              zIndex: 3 - i,
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 30, color: i === 0 ? C.amber : C.ink }}>{k.t}</div>
            <div style={{ ...body, fontSize: 22 }}>{k.d}</div>
          </div>
        ))}
      </div>
      <div style={{ ...abs(110, 880, 1700), background: C.inkSoft, borderRadius: 18, padding: '22px 32px' }}>
        <div style={{ fontWeight: 900, fontSize: 24, color: C.ink }}>우리 규칙</div>
        <div style={{ fontWeight: 800, fontSize: 29, marginTop: 6, color: C.text, wordBreak: 'keep-all' }}>
          사람 얼굴을 분류하는 주제는 하지 않는다 · 사진에 다른 사람 얼굴이 나오면 쓰지 않는다
        </div>
      </div>
    </>
  );
}

/* ══ S11 · 먼저 써 보자: 바나나 언제 먹지? (static) ═══════════════════
   수업용 예시 프로그램의 화면 캡처 — 진짜 모델이 아니라서 링크·QR은 두지 않는다.
   캡처 원본: ./demo/바나나-언제-먹지.html (생성 그림 + 미리 정한 신뢰도) */
function S11() {
  return (
    <>
      <Head k="모델을 쓰는 프로그램 · 예시">
        예를 들면: <span style={{ color: C.berry }}>바나나 언제 먹지?</span>
      </Head>
      {/* 노트북 프레임 (dominant) */}
      <div style={{ ...abs(110, 220, 1100, 690) }}>
        <div style={{ ...abs(0, 0, 1100, 640), background: '#2b2f38', borderRadius: '22px 22px 6px 6px', padding: 18 }}>
          <div style={{ width: '100%', height: '100%', borderRadius: 8, overflow: 'hidden', background: C.paper }}>
            <img src={IMG.demoShot} alt="바나나 언제 먹지? 실행 화면" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
          </div>
        </div>
        <div style={{ ...abs(-40, 640, 1180, 30), background: '#3a3f4b', borderRadius: '0 0 18px 18px' }} />
      </div>
      <div style={{ ...abs(1290, 250, 530) }}>
        <div style={{ ...small, fontWeight: 800 }}>모델의 답</div>
        <div style={{ fontSize: 34, fontWeight: 700, color: 'var(--fg-muted)', marginTop: 4 }}>딱 좋음 <span style={mono}>95%</span></div>
        <div style={{ ...small, fontWeight: 800, marginTop: 34, color: C.berry }}>프로그램의 답</div>
        <div style={{ fontSize: 44, fontWeight: 900, color: C.text, marginTop: 4, wordBreak: 'keep-all', lineHeight: 1.2 }}>🍌 지금이 딱 먹기 좋아요!</div>
        <div style={{ ...body, fontSize: 21, marginTop: 14 }}>결과를 보고 할 일을 알려 준다</div>
      </div>
      <div style={{ ...abs(1290, 640, 530), background: C.amberSoft, borderRadius: 18, padding: '20px 24px' }}>
        <div style={{ fontWeight: 900, fontSize: 26, color: C.amber }}>참외를 넣으면?</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.text, wordBreak: 'keep-all', lineHeight: 1.3 }}>
            딱 좋음 <span style={mono}>90%</span> → “지금이 딱 먹기 좋아요!”
          </div>
          <span style={{ fontSize: 40, fontWeight: 900, color: C.red }}>✕</span>
        </div>
        <div style={{ ...small, fontSize: 17, marginTop: 6 }}>모델이 아는 답은 바나나 세 칸뿐</div>
      </div>
      <div style={{ ...abs(1290, 940, 530), ...small, fontSize: 15 }}>수업용 예시 화면 · 그림은 생성 이미지, 결과는 미리 정해 둔 값</div>
    </>
  );
}

/* ══ S12 · 공유 링크는 모델을 꽂는 플러그 (scene) ═════════════════════ */
function PlugScene() {
  const t = useSceneTime();
  const move = interpolate(t, [0.4, 1.6], [0, 1], easeInOut);
  const plugged = interpolate(t, [1.6, 2.2], [0, 1], easeInOut);
  const lit = t >= 2.2 ? 1 : 0;
  const cells = [
    { n: '사진 입력', at: 2.6 },
    { n: '모델', at: 3.1 },
    { n: '클래스마다 신뢰도', at: 3.6 },
    { n: '클래스별 응답', at: 4.1 },
  ];
  const label = spring(t, 4.8, 0.7);
  const win = { x: 1010, y: 220, w: 810, h: 560 };
  // SVG 같은 배율 0.5 — 플러그(360×160): 핀 끝 x=338, 핀 중심 y=80, 코드 시작 (6,118)
  //                    콘센트(160×200): 구멍 중심 (80,100)
  const outlet = { x: win.x - 96, y: win.y + 240 };
  const endX = outlet.x + 46 - 169;
  const endY = outlet.y + 50 - 40;
  const plugX = interpolate(move, [0, 1], [470, endX - 50]) + plugged * 50;
  const plugY = interpolate(move, [0, 1], [400, endY]) - Math.sin(Math.PI * move) * 80;
  // 플러그는 콘센트 위에 꽂힌다 — 핀 끝이 구멍 중심(outlet.x+40)에 닿고, 그 너머는 구멍 속으로 가린다
  const entryX = outlet.x + 40;
  const pinHide = Math.min(36, Math.max(0, plugX + 180 - entryX));
  const cordX = plugX + 3;
  const cordY = plugY + 59;
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ ...abs(110, 56, 1700), ...riseIn(t, 0) }}>
        <div style={kick}>학습은 Teachable Machine에서, 사용은 내 프로그램에서</div>
        <h2 style={{ ...h2, marginTop: 10 }}>
          공유 링크는 모델을 꽂는 <span style={{ color: C.berry }}>플러그</span>
        </h2>
      </div>

      {/* Teachable Machine 축소 창 */}
      <div style={{ ...card, ...abs(110, 230, 420, 180), padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '10px 16px', background: 'rgba(38,42,51,0.06)', ...small, fontSize: 15, fontWeight: 700 }}>Teachable Machine</div>
        <div style={{ padding: 18 }}>
          <div style={{ fontWeight: 800, fontSize: 21 }}>덜 익음 · 딱 좋음 · 너무 익음</div>
          <div style={{ ...small, fontSize: 16, marginTop: 4 }}>학습 완료 → 모델 업로드</div>
          <div style={{ ...mono, fontSize: 14, marginTop: 14, color: C.berry, wordBreak: 'break-all' }}>teachablemachine.withgoogle.com/models/…/</div>
        </div>
      </div>

      {/* 꾸러미 → 코드 → 플러그 */}
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden>
        <path d={`M ${cordX - 150} ${cordY} C ${cordX - 90} ${cordY + 40}, ${cordX - 50} ${cordY + 30}, ${cordX} ${cordY}`} fill="none" stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
      </svg>
      <div style={{ ...card, ...abs(cordX - 320, cordY - 60, 170, 120), background: '#efe2c7', border: `2px solid ${C.amber}`, display: 'grid', placeItems: 'center', textAlign: 'center', zIndex: 3 }}>
        <div>
          <div style={{ fontSize: 34 }}>📦</div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>내 모델</div>
        </div>
      </div>
      <img src={SVG.plug} alt="" style={{ ...abs(plugX, plugY, 180, 80), zIndex: 5, clipPath: `inset(0 ${pinHide}px 0 0)` }} />
      <div style={{ ...abs(cordX - 320, cordY + 76, 360), opacity: move, ...mono, fontSize: 17, fontWeight: 700, color: C.berry }}>공유 링크 · models/…/</div>

      {/* 내 웹 프로그램 창 (dominant) */}
      <img src={SVG.outlet} alt="" style={{ ...abs(outlet.x, outlet.y, 80, 100), zIndex: 4 }} />
      <div style={{ ...card, ...abs(win.x, win.y, win.w, win.h), padding: 0, overflow: 'hidden', border: lit ? `4px solid ${C.berry}` : '2px dashed var(--hair)', boxShadow: lit ? '0 0 60px -10px rgba(156,61,110,0.55)' : card.boxShadow, transition: 'box-shadow 0.4s' }}>
        <div style={{ padding: '12px 20px', background: 'rgba(38,42,51,0.06)', fontWeight: 800, fontSize: 19 }}>내 웹 프로그램 · 바나나 언제 먹지?</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '60px 28px 30px' }}>
          {cells.map((c, i) => {
            const on = spring(t, c.at, 0.5);
            return (
              <div key={c.n} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 150, height: 150, borderRadius: 16, background: on > 0.5 ? (i === 3 ? C.berrySoft : 'white') : 'rgba(38,42,51,0.04)', border: `2px solid ${on > 0.5 ? (i === 3 ? C.berry : C.ink) : 'var(--hair)'}`, display: 'grid', placeItems: 'center', textAlign: 'center', padding: 10, opacity: 0.35 + 0.65 * on }}>
                  <div>
                    <div style={{ fontSize: 40 }}>{['🖼️', '🧠', '📊', '💬'][i]}</div>
                    <div style={{ fontWeight: 800, fontSize: 18, wordBreak: 'keep-all', color: i === 3 ? C.berry : C.text }}>{c.n}</div>
                  </div>
                </div>
                {i < 3 && <div style={{ fontSize: 30, color: 'rgba(38,42,51,0.4)', opacity: on }}>→</div>}
              </div>
            );
          })}
        </div>
        <div style={{ margin: '0 28px', background: 'white', borderRadius: 14, padding: '18px 22px', fontWeight: 900, fontSize: 30, opacity: spring(t, 4.3, 0.5), border: `2px solid ${C.berry}` }}>
          🍌 지금이 딱 먹기 좋아요!
        </div>
        <div style={{ margin: '24px 28px 0', opacity: label, transform: `translateY(${(1 - label) * 10}px)` }}>
          <Term term="클래스별 응답" gloss="결과 클래스마다 프로그램이 보여 줄 문장" />
        </div>
      </div>

      <Build at={1} style={abs(110, 900, 1700)}>
        <div style={{ textAlign: 'center', ...body, fontSize: 25, color: C.ink, fontWeight: 600 }}>
          지난 프로젝트의 API처럼, 기능을 빌려 쓰는 창구 · 이번에 빌려 쓰는 모델은 <b style={{ color: C.berry }}>내가 직접 가르친 모델</b>
        </div>
      </Build>
    </div>
  );
}

/* ══ S13 · 프로그램 설계의 세 질문: 키오스크 (build) ══════════════════ */
function S13() {
  const { clicks } = useDeck();
  const q = [
    { n: '①', t: '누구의, 어떤 순간의 문제인가?', at: 1 },
    { n: '②', t: '무엇을 받는가?', at: 2 },
    { n: '③', t: '결과마다 무엇을 주는가?', at: 3 },
  ];
  const resp = [
    ['플라스틱', '♻️ 헹궈서 라벨을 떼고 플라스틱 수거함에'],
    ['캔', '🥫 내용물을 비우고 찌그러뜨려 캔 수거함에'],
    ['종이', '📄 테이프를 떼고 펴서 종이 수거함에'],
  ];
  const k = { x: 700, y: 150, w: 560, h: 790 };
  return (
    <>
      <Head k="모델을 쓰는 프로그램 · 설계" w={560}>
        만들기 전에 <span style={{ color: C.berry }}>세 질문</span>
      </Head>
      {/* 질문 쪽지 */}
      <div style={abs(110, 340, 540)}>
        {q.map((x, i) => (
          <div key={x.n} style={{ ...card, padding: '18px 22px', marginTop: i ? 24 : 0, opacity: clicks >= x.at ? 1 : 0.35, transform: `rotate(${[-1.5, 1, -0.8][i]}deg)`, transition: trans, borderLeft: `8px solid ${clicks >= x.at ? C.berry : 'var(--hair)'}` }}>
            <div style={{ fontWeight: 900, fontSize: 28, color: C.berry }}>{x.n}</div>
            <div style={{ fontWeight: 800, fontSize: 26, wordBreak: 'keep-all' }}>{x.t}</div>
          </div>
        ))}
      </div>

      {/* 키오스크 (dominant) */}
      <div style={{ ...abs(k.x, k.y, k.w, k.h), background: '#2b2f38', borderRadius: 34, padding: 22, boxShadow: 'var(--shadow)' }}>
        <div style={{ width: '100%', height: '100%', background: C.paper, borderRadius: 18, padding: 26, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ minHeight: 120, border: clicks >= 1 ? 'none' : '2px dashed var(--hair)', borderRadius: 12 }}>
            <Build at={1}>
              <div style={{ fontWeight: 900, fontSize: 36 }}>♻️ 분리배출 도우미</div>
              <div style={{ ...body, fontSize: 21, marginTop: 6 }}>쓰레기를 찍으면 버리는 법을 알려 줘요</div>
            </Build>
          </div>
          <div style={{ minHeight: 150, border: clicks >= 2 ? 'none' : '2px dashed var(--hair)', borderRadius: 12 }}>
            <Build at={2}>
              <div style={{ background: 'var(--accent)', color: 'white', fontWeight: 900, fontSize: 28, borderRadius: 14, padding: '20px 0', textAlign: 'center' }}>📷 사진 올리기</div>
              <div style={{ border: '2px dashed rgba(38,42,51,0.3)', color: 'var(--fg-faint)', fontWeight: 800, fontSize: 21, borderRadius: 14, padding: '10px 0', textAlign: 'center', marginTop: 12 }}>웹캠 (선택)</div>
            </Build>
          </div>
          <div style={{ flex: 1, border: clicks >= 3 ? 'none' : '2px dashed var(--hair)', borderRadius: 12 }}>
            <Build at={3}>
              <div style={{ ...small, fontWeight: 800 }}>클래스별 응답</div>
              {resp.map(([c, r]) => (
                <div key={c} style={{ background: 'white', borderRadius: 12, padding: '12px 14px', marginTop: 10, border: '1px solid var(--hair)' }}>
                  <div style={{ fontWeight: 900, fontSize: 20, color: C.berry }}>{c}</div>
                  <div style={{ fontSize: 19, fontWeight: 600, wordBreak: 'keep-all' }}>{r}</div>
                </div>
              ))}
            </Build>
          </div>
        </div>
      </div>

      <Build at={4} style={abs(1340, 560, 480)}>
        <div style={{ ...body, fontSize: 24, color: 'var(--fg-faint)', textDecoration: 'line-through' }}>✕ 「캔입니다」</div>
        <div style={{ fontWeight: 900, fontSize: 32, marginTop: 14, color: C.text, wordBreak: 'keep-all', lineHeight: 1.3 }}>
          ○ 「캔: 내용물을 비우고 찌그러뜨려 캔 수거함에」
        </div>
        <div style={{ ...body, fontSize: 22, marginTop: 18, color: C.berry, fontWeight: 700 }}>좋은 응답은 이름이 아니라 할 일을 알려 준다</div>
      </Build>
    </>
  );
}

/* ══ S14 · 확신이 낮을 때는 "잘 모르겠어요" (scene) ══════════════════ */
function GaugeScene() {
  const t = useSceneTime();
  const top = 200;
  const bot = 900;
  const H = bot - top;
  const yOf = (pct: number) => bot - (pct / 100) * H;
  // 국면 — 데모 모델 실측값 (plan F11): ① 치와와 100 ② 잠든 고양이 76 (기준 70→85) ③ 또렷한 고양이 99.8
  const cases = [
    { src: PICK.s2chi, name: '치와와', chi: 100, muf: 0, truth: 'chi' as const, in: 0.3, out: 1.6 },
    { src: IMG.catAsleep, name: '흐리게 잠든 고양이', chi: 75.8, muf: 24.2, truth: 'other' as const, in: 1.8, out: 4.2 },
    { src: IMG.cat, name: '또렷한 고양이', chi: 99.8, muf: 0.2, truth: 'other' as const, in: 4.4, out: 99 },
  ];
  const k = t < cases[1].in ? 0 : t < cases[2].in ? 1 : 2;
  const c = cases[k];
  const fillP = interpolate(t, [c.in, c.in + 0.9], [0, 1], easeInOut) * (1 - interpolate(t, [c.out - 0.2, c.out], [0, 1]));
  const th = interpolate(t, [3.2, 3.9], [70, 85], easeInOut);
  const chi = c.chi * fillP;
  const muf = c.muf * fillP;
  const settled = t >= c.in + 0.9;
  const pass = c.chi >= th;
  const correct = pass ? c.truth === 'chi' : c.truth !== 'chi';
  const limit = spring(t, 5.6, 0.6);
  const label = spring(t, 6.2, 0.7);
  const gaugeH = H / (GAUGE.bottom0 - GAUGE.top100);
  const gaugeTop = top - GAUGE.top100 * gaugeH;
  const fmt = (v: number) => (Number.isInteger(Math.round(v * 10) / 10) ? Math.round(v) : (Math.round(v * 10) / 10).toFixed(1));
  const bar = (x: number, pct: number, col: string, name: string) => (
    <div key={name}>
      <div style={{ ...abs(x, yOf(pct), 120, (pct / 100) * H), background: col, opacity: 0.85, borderRadius: '10px 10px 0 0' }} />
      <div style={{ ...abs(x - 10, bot + 14, 160), textAlign: 'center', fontWeight: 900, fontSize: 24, color: col }}>
        {name} <span style={mono}>{fmt(pct)}%</span>
      </div>
    </div>
  );
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ ...abs(110, 56, 1700), ...riseIn(t, 0) }}>
        <div style={kick}>모르는 것을 위한 자리</div>
        <h2 style={{ ...h2, marginTop: 10 }}>
          확신이 낮을 때는 <span style={{ color: C.berry }}>“잘 모르겠어요”</span>
        </h2>
      </div>

      {/* 지금 넣은 사진 */}
      <div style={{ ...abs(420, 230, 260), textAlign: 'center' }}>
        <Photo src={c.src} style={{ width: 260, height: 220, background: 'white' }} />
        <div style={{ fontWeight: 800, fontSize: 22, marginTop: 10, wordBreak: 'keep-all' }}>{c.name}</div>
      </div>

      {/* 눈금자 + 막대 (dominant) */}
      <img src={SVG.gauge} alt="" style={{ ...abs(780, gaugeTop, gaugeH * GAUGE.aspect, gaugeH), objectFit: 'fill' }} />
      {bar(960, chi, C.berry, '치와와')}
      {bar(1110, muf, C.amber, '머핀')}
      <div style={{ ...abs(760, yOf(th) - 3, 520, 6), background: C.amber, borderRadius: 3 }} />
      <div style={{ ...abs(1100, yOf(th) - 46), fontWeight: 900, fontSize: 26, color: C.amber, ...mono }}>기준값 {Math.round(th)}%</div>

      {/* 프로그램의 답 */}
      <div style={{ ...abs(1290, 330, 540) }}>
        {settled && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1, background: 'white', border: `3px solid ${pass ? C.berry : C.amber}`, borderRadius: 18, padding: '16px 22px', fontWeight: 900, fontSize: 26, wordBreak: 'keep-all' }}>
              {pass ? '🐶 치와와예요!' : '🤔 잘 모르겠어요. 다른 사진을 올려 주세요.'}
            </div>
            <div style={{ fontSize: 50, fontWeight: 900, color: correct ? C.green : C.red }}>{correct ? '✓' : '✕'}</div>
          </div>
        )}
      </div>
      <div style={{ ...abs(1290, 500, 540), opacity: limit, transform: `translateY(${(1 - limit) * 10}px)` }}>
        <div style={{ background: C.redSoft, borderRadius: 14, padding: '12px 18px', fontWeight: 900, fontSize: 25, color: C.red }}>기준값만으로는 못 막는다</div>
        <div style={{ ...small, fontSize: 18, marginTop: 8 }}>자신 있게 틀리는 답은 어떤 선도 넘는다</div>
      </div>
      <div style={{ ...abs(1290, 700, 540), opacity: label, transform: `translateY(${(1 - label) * 10}px)` }}>
        <div style={{ fontWeight: 900, fontSize: 32, color: C.berry }}>기준값</div>
        <div style={{ ...body, fontSize: 22 }}>이 신뢰도보다 낮으면 답을 내지 않기로 정한 값</div>
        <div style={{ ...small, marginTop: 8 }}>높이면 틀린 답은 줄고 「모르겠어요」는 는다 · 수치는 치와와·머핀 모델 실측</div>
      </div>

      <Build at={1} style={abs(110, 600, 600)}>
        <div style={{ ...card, padding: '20px 24px' }}>
          <div style={{ fontWeight: 900, fontSize: 24, color: C.ink }}>데이터로 막기 · 「그 외」 클래스</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 110, marginTop: 12 }}>
            {[
              ['치와와', 6, C.berry],
              ['머핀', 4, C.amber],
              ['그 외', 90, C.ink],
            ].map(([n, pct, col]) => (
              <div key={n as string} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ height: (pct as number) * 0.9, background: col as string, borderRadius: 6, opacity: 0.85 }} />
                <div style={{ fontWeight: 800, fontSize: 18, color: col as string, marginTop: 4 }}>{n as string}</div>
              </div>
            ))}
          </div>
          <div style={{ ...small, fontSize: 17, marginTop: 8 }}>그 외 사진: 빈 책상 · 손 · 다른 물건 · 다른 동물 (도식)</div>
        </div>
      </Build>
      <Credit style={abs(110, 1040)} cat />
    </div>
  );
}

/* ══ S15 · 코드 생성 프롬프트: 내가 쓴 것 + 받은 것 (build) ═══════════ */
function S15() {
  const { clicks } = useDeck();
  const merged = clicks >= 2;
  const mine = ['프로그램 이름 · 한 줄 소개', '입력 방식 (사진 올리기 / 웹캠)', '클래스별 응답', '기준값 · “모르겠어요” 문장', '공유 링크'];
  const given = [
    '완전한 단일 HTML 파일 하나',
    'Teachable Machine 라이브러리 두 줄 (버전 고정)',
    '공유 링크로 모델 불러오기 · 실패하면 안내',
    '모든 클래스의 신뢰도 막대',
    '기준값 미만이면 “모르겠어요”',
    '고칠 값은 코드 맨 위에 모아 두기',
  ];
  return (
    <>
      <Head k="모델을 쓰는 프로그램 · 만들기" w={1100}>
        코드 생성 프롬프트: <span style={{ color: C.berry }}>내가 쓴 것</span> + 받은 것
      </Head>
      <div style={{ ...abs(110, 240, 1180, 290), border: `4px solid ${C.berry}`, borderRadius: 20, background: 'rgba(156,61,110,0.06)', padding: '22px 30px', transform: merged ? 'translateY(30px)' : 'none', transition: trans }}>
        <div style={{ fontWeight: 900, fontSize: 26, color: C.berry }}>✍️ 내가 쓴 것 (활동지 A·C·D)</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
          {mine.map((m) => (
            <Chip key={m} style={{ fontSize: 22 }}>{m}</Chip>
          ))}
        </div>
      </div>
      <div style={{ ...abs(110, 560, 1180, 420), border: `2px solid ${C.ink}`, borderRadius: 20, background: 'white', padding: '22px 30px', transform: merged ? 'translateY(-10px)' : 'none', transition: trans }}>
        <div style={{ fontWeight: 900, fontSize: 26, color: C.ink }}>📄 받는 것 · 고정 기술 명세 (활동지가 붙인다)</div>
        {given.map((g) => (
          <div key={g} style={{ ...mono, fontSize: 22, marginTop: 12, color: C.text }}>· {g}</div>
        ))}
      </div>
      <Build at={2} style={abs(1340, 400, 480)}>
        <div style={{ ...card, padding: '24px 26px' }}>
          <div style={{ fontWeight: 900, fontSize: 24 }}>D6 · 코드 생성 프롬프트</div>
          <div style={{ ...small, marginTop: 8 }}>두 블록이 한 장으로 합쳐진다</div>
          <div style={{ marginTop: 18, display: 'inline-block', background: 'var(--accent)', color: 'white', fontWeight: 900, fontSize: 24, borderRadius: 999, padding: '12px 26px' }}>📋 전체 복사</div>
          <div style={{ ...small, marginTop: 14 }}>→ ChatGPT에 붙여넣기</div>
        </div>
      </Build>
      <Build at={3} style={abs(1340, 120, 480)}>
        <div style={{ background: C.greenSoft, borderRadius: 18, padding: '18px 24px' }}>
          <div style={{ fontWeight: 900, fontSize: 28, color: C.green }}>🔓 이번에는 키가 없다</div>
          <div style={{ ...body, fontSize: 21 }}>모델 계산은 내 브라우저 안에서</div>
        </div>
      </Build>
      <Build at={1} style={abs(1340, 820, 480)}>
        <div style={{ ...body, fontSize: 22, color: C.ink, fontWeight: 700 }}>공들일 곳은 위 블록,<br />특히 <span style={{ color: C.berry }}>클래스별 응답</span></div>
      </Build>
    </>
  );
}

/* ══ S16 · ChatGPT에게 맡기는 절차 (walkthrough) ═══════════════════════ */
const PROMPT_LINE = '분리배출 도우미를 만들어 줘. 클래스: 플라스틱, 캔, 종이 …';
const CODE_LINES = [
  '<script src="…/tfjs@1.3.1/dist/tf.min.js"></script>',
  '<script>  // ★ 이 파일의 주인이 나중에 이 값들만 고칩니다 ★',
  'const MODEL_URL = "https://teachablemachine.withgoogle.com/models/aB3xY9/";',
  'const CLASS_RESPONSES = { "캔": "🥫 내용물을 비우고 …", … };',
  'const THRESHOLD = 0.7;',
  'const model = await tmImage.load(MODEL_URL + "model.json", …);',
];
function ChatWalkScene() {
  const t = useSceneTime();
  const path: CursorKey[] = [
    { t: 0.4, x: 30, y: 70 },
    { t: 1.4, x: 33, y: 62, click: true, label: '① 활동지 D 전체 복사' },
    { t: 3.4, x: 26, y: 84, click: true, label: '② ChatGPT에 붙여넣기' },
    { t: 4.4, x: 52, y: 84, click: true, label: '전송' },
    { t: 8.4, x: 44, y: 37, label: '③ MODEL_URL 확인' },
    { t: 10.4, x: 51, y: 27, click: true, label: '④ ▶ 실행' },
    { t: 12.4, x: 79, y: 45, click: true, label: '⑤ 사진 올리기' },
    { t: 15.5, x: 88, y: 88 },
  ];
  const copied = clickFlash(t, 1.4, 1.2);
  const pasted = t >= 3.4 ? typed(t, PROMPT_LINE, 3.4, 40) : '';
  const sent = t >= 4.4;
  const lines = CODE_LINES.map((l, i) => (t >= 5 + i * 0.45 ? l : ''));
  const hl = interpolate(t, [8.2, 8.8], [0, 1], easeInOut);
  const preview = t >= 10.9;
  const photo = t >= 13.0;
  const res = spring(t, 13.6, 0.6);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ ...abs(110, 40, 1700) }}>
        <div style={kick}>지난 프로젝트와 같은 네 걸음 + 링크 확인</div>
        <h2 style={{ ...h2, fontSize: 44, marginTop: 8 }}>
          ChatGPT에게 맡기는 절차 · <span style={{ color: C.berry }}>MODEL_URL</span>부터 본다
        </h2>
      </div>

      {/* 활동지 창 */}
      <AppWindow kind="browser" url="…/이미지-분류-AI-프로젝트/활동지.html" badge="①" style={{ ...abs(110, 190, 900, 520), ...popIn(t, 0), ...dimAfter(t, 2.6) }}>
        <div style={{ padding: 26 }}>
          <div style={{ fontWeight: 900, fontSize: 26 }}>D6. 코드 생성 프롬프트</div>
          <div style={{ marginTop: 14, background: 'white', borderRadius: 12, padding: 18, fontSize: 18, lineHeight: 1.6, border: '1px solid var(--hair)' }}>
            <span style={{ color: C.berry, fontWeight: 700 }}>[내가 쓴 것] 분리배출 도우미 · 플라스틱 / 캔 / 종이 …</span>
            <br />
            <span style={{ color: C.ink }}>[기술 명세] 완전한 단일 HTML 파일 하나로 …</span>
          </div>
          <div style={{ marginTop: 20, display: 'inline-block', background: 'var(--accent)', color: 'white', fontWeight: 900, fontSize: 22, borderRadius: 999, padding: '10px 24px', boxShadow: copied ? `0 0 0 ${10 * copied}px rgba(156,61,110,0.25)` : undefined }}>
            📋 전체 복사
          </div>
          {t >= 1.6 && <span style={{ marginLeft: 16, fontWeight: 800, color: C.green, fontSize: 20 }}>복사됨 ✓</span>}
        </div>
      </AppWindow>

      {/* ChatGPT 창 */}
      <AppWindow kind="browser" url="chatgpt.com" badge="②" style={{ ...abs(110, 170, 960, 850), ...popIn(t, 2.6) }}>
        <div style={{ position: 'relative', height: 790, padding: 24 }}>
          {sent && (
            <div style={{ marginLeft: 'auto', width: 560, background: 'rgba(38,42,51,0.07)', borderRadius: 18, padding: '12px 18px', fontSize: 18 }}>{PROMPT_LINE}</div>
          )}
          {t >= 5 && (
            <div style={{ marginTop: 20, background: '#1f2430', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', background: '#2a303d', color: '#aab', fontSize: 15 }}>
                <span>html</span>
                <span style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <span style={{ color: preview ? '#fff' : '#cfd3dc', background: clickFlash(t, 10.4, 1) > 0 ? C.berry : 'rgba(255,255,255,0.12)', borderRadius: 6, padding: '2px 10px', fontWeight: 800 }}>▶</span>
                  <span>복사</span>
                  <span>다운로드</span>
                </span>
              </div>
              <div style={{ padding: '14px 16px', ...mono, fontSize: 17, lineHeight: 1.75, color: '#dfe3ea' }}>
                {lines.map((l, i) => (
                  <div key={i} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', background: i === 2 ? `rgba(156,61,110,${0.55 * hl})` : undefined, borderRadius: 4, padding: '0 4px' }}>
                    {l || ' '}
                  </div>
                ))}
              </div>
            </div>
          )}
          {hl > 0 && (
            <div style={{ position: 'absolute', left: 40, top: 360, opacity: hl }}>
              <Chip color={C.berry} style={{ background: 'white', fontSize: 24 }}>↑ MODEL_URL이 내 공유 링크와 같은가?</Chip>
            </div>
          )}
          <div style={{ position: 'absolute', left: 24, right: 24, bottom: 20, display: 'flex', alignItems: 'center', gap: 12, background: 'white', border: '1px solid var(--hair)', borderRadius: 26, padding: '12px 18px' }}>
            <div style={{ flex: 1, fontSize: 18, color: pasted && !sent ? C.text : 'var(--fg-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {sent ? '메시지 보내기' : pasted || '메시지 보내기'}
            </div>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: C.ink, color: 'white', display: 'grid', placeItems: 'center', fontWeight: 900 }}>↑</div>
          </div>
        </div>
      </AppWindow>

      {/* 미리보기 창 */}
      {preview && (
        <AppWindow kind="app" title="미리보기 · 분리배출 도우미" badge="③" style={{ ...abs(1110, 230, 720, 640), ...popIn(t, 10.9) }}>
          <div style={{ padding: 26, background: C.paper, height: 580 }}>
            <div style={{ fontWeight: 900, fontSize: 30 }}>♻️ 분리배출 도우미</div>
            <div style={{ ...small, fontSize: 18 }}>쓰레기를 찍으면 버리는 법을 알려 줘요</div>
            <div style={{ marginTop: 18, background: 'var(--accent)', color: 'white', fontWeight: 900, fontSize: 24, borderRadius: 14, padding: '14px 0', textAlign: 'center', boxShadow: clickFlash(t, 12.4, 0.8) > 0 ? '0 0 0 8px rgba(156,61,110,0.25)' : undefined }}>📷 사진 올리기</div>
            {photo && (
              <div style={{ display: 'flex', gap: 18, marginTop: 20, alignItems: 'center' }}>
                <div style={{ width: 150, height: 150, borderRadius: 12, background: 'linear-gradient(160deg,#c9ced6,#8e98a8)', display: 'grid', placeItems: 'center', fontSize: 64 }}>🥫</div>
                <div style={{ flex: 1, opacity: res }}>
                  {[
                    ['캔', 93, C.berry],
                    ['플라스틱', 5, C.ink],
                    ['종이', 2, C.amber],
                  ].map(([n, p, c]) => (
                    <div key={n as string} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                      <span style={{ width: 80, fontWeight: 800, fontSize: 18 }}>{n as string}</span>
                      <div style={{ flex: 1, height: 18, background: 'rgba(38,42,51,0.08)', borderRadius: 9 }}>
                        <div style={{ width: `${(p as number) * res}%`, height: '100%', background: c as string, borderRadius: 9 }} />
                      </div>
                      <span style={{ ...mono, width: 46, fontWeight: 800 }}>{p as number}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {photo && (
              <div style={{ marginTop: 20, background: 'white', border: `2px solid ${C.berry}`, borderRadius: 14, padding: '14px 18px', fontWeight: 900, fontSize: 23, opacity: res, wordBreak: 'keep-all' }}>
                🥫 내용물을 비우고 찌그러뜨려 캔 수거함에
              </div>
            )}
          </div>
        </AppWindow>
      )}
      {t >= 14.6 && (
        <div style={{ ...abs(1110, 900, 720), ...popIn(t, 14.6) }}>
          <div style={{ ...small, fontSize: 19, background: C.amberSoft, borderRadius: 12, padding: '10px 16px', color: C.text }}>
            ▶가 없거나 모델이 안 불러와지면 → [다운로드] → 내려받은 .html 더블클릭
          </div>
        </div>
      )}
      <Pointer path={path} timelineEnd={16} />
    </div>
  );
}

/* ══ S17 · 데이터인가, 프로그램인가 (build) ═══════════════════════════ */
function S17() {
  return (
    <>
      <Head k="테스트 · 개선">
        이상하면 어디를 고칠까: <span style={{ color: C.berry }}>데이터</span>인가, <span style={{ color: C.ink }}>프로그램</span>인가
      </Head>
      <div style={abs(1480, 70)}>
        <Chip color={C.ink} style={{ fontSize: 17 }}>지난번: 프롬프트냐 코드냐 → 이번: 데이터냐 프로그램이냐</Chip>
      </div>
      {/* 증상 접수 카드 (dominant) */}
      <div style={{ ...card, ...abs(710, 230, 500, 150), padding: '22px 28px', textAlign: 'center', border: `3px solid ${C.text}` }}>
        <div style={{ fontWeight: 900, fontSize: 34 }}>🩺 증상</div>
        <div style={{ ...body, fontSize: 22 }}>판정이 틀렸나, 보여 주는 게 이상한가?</div>
      </div>
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden>
        <path d="M 860 380 C 860 450, 560 430, 520 500" fill="none" stroke={C.berry} strokeWidth={7} strokeLinecap="round" />
        <path d="M 1060 380 C 1060 450, 1360 430, 1400 500" fill="none" stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
      </svg>
      <Build at={1} style={abs(110, 510, 820)}>
        <div style={{ fontWeight: 900, fontSize: 34, color: C.berry }}>데이터 문제 · 판정이 틀림</div>
        <div style={{ ...body, fontSize: 22 }}>→ Teachable Machine으로 돌아가 사진 보강 → 다시 학습 → 다시 「모델 업로드」</div>
      </Build>
      <Build at={1} style={abs(1000, 510, 820)}>
        <div style={{ fontWeight: 900, fontSize: 34, color: C.ink }}>프로그램 문제 · 판정은 맞는데 보여 주는 게 이상함</div>
        <div style={{ ...body, fontSize: 22 }}>→ 같은 ChatGPT 대화에 “증상 · 고칠 곳 · 원하는 결과”</div>
      </Build>
      <Build at={2} style={abs(110, 660, 820)}>
        <div style={{ background: C.berrySoft, borderRadius: 18, padding: '20px 26px' }}>
          <div style={{ fontWeight: 800, fontSize: 23 }}>예: 흰 컵을 자꾸 「종이」라고 한다</div>
          <div style={{ ...body, fontSize: 22, marginTop: 6 }}>→ 흰 플라스틱 컵 사진을 10장 더 넣고 다시 학습·업로드</div>
        </div>
      </Build>
      <Build at={3} style={abs(1000, 660, 820)}>
        <div style={{ background: 'white', border: `2px solid ${C.ink}`, borderRadius: '22px 22px 22px 6px', padding: '18px 24px', fontSize: 21, lineHeight: 1.55, wordBreak: 'keep-all' }}>
          “응답 글씨가 너무 작고 신뢰도가 소수점 열 자리로 나옵니다. 응답은 크게, 신뢰도는 정수 %로 바꿔서 전체 HTML을 다시 주세요.”
        </div>
      </Build>
      <Build at={4} style={abs(110, 940, 1700)}>
        <div style={{ textAlign: 'center', fontWeight: 800, fontSize: 27, color: C.text }}>
          고친 뒤에는 <span style={{ color: C.berry }}>같은 시험 사진으로 다시 확인</span> → 활동지 E에 전후 기록
        </div>
      </Build>
    </>
  );
}

/* ══ S18 · 활동 시작 (activity) ═══════════════════════════════════════ */
function S18() {
  const links = [
    { t: 'Teachable Machine', h: URL_.tm },
    { t: 'Openverse', h: URL_.openverse },
    { t: 'ChatGPT', h: URL_.chatgpt },
  ];
  return (
    <>
      <Stage src={IMG.workbench} scrim="linear-gradient(90deg, rgba(243,238,227,0.97) 0%, rgba(243,238,227,0.9) 44%, rgba(243,238,227,0.15) 70%, rgba(243,238,227,0) 100%)" />
      <div style={abs(110, 80, 860)}>
        <div style={kick}>설명은 끝났다</div>
        <h1 style={{ ...h1, fontSize: 70, marginTop: 10 }}>
          활동 <span style={{ color: C.berry }}>시작</span>
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 26, marginTop: 34 }}>
          <LinkBtn href={URL_.activity} big>📝 활동지 열기</LinkBtn>
          <img src={IMG.qrActivity} alt="활동지 QR" style={{ width: 150, height: 150, background: 'white', padding: 8, borderRadius: 10 }} />
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 30, flexWrap: 'wrap' }}>
          {links.map((l) => (
            <a key={l.t} href={l.h} target="_blank" rel="noopener" style={{ fontWeight: 800, fontSize: 22, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 999, padding: '10px 22px', textDecoration: 'none', background: 'rgba(255,255,255,0.8)' }}>
              {l.t} ↗
            </a>
          ))}
        </div>
        <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {['시험 사진은 학습에 넣지 않는다', '사람 얼굴 금지', '고친 뒤에는 같은 사진으로 다시 확인'].map((r) => (
            <div key={r} style={{ fontWeight: 800, fontSize: 24, color: C.amber }}>⚠ {r}</div>
          ))}
        </div>
      </div>
      <div style={{ ...card, ...abs(1120, 820, 700, 170), padding: '20px 26px', background: 'rgba(255,255,255,0.94)' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['A 주제', 'B 데이터 설계', 'C 학습·시험·분석', 'D 프로그램 설계', 'E 테스트·개선', 'F 제출'].map((s, i) => (
            <div key={s} style={{ flex: 1, textAlign: 'center', background: i < 3 ? C.berry : C.ink, color: 'white', fontWeight: 800, fontSize: 16, borderRadius: 8, padding: '10px 4px', wordBreak: 'keep-all' }}>{s}</div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontWeight: 800, fontSize: 18 }}>
          <span style={{ color: C.berry }}>① 모델 만들기</span>
          <span style={{ color: C.ink }}>② 프로그램 만들기</span>
        </div>
      </div>
    </>
  );
}

/* ══ S19 · 모델은 데이터가 만들고, 쓸모는 프로그램이 만든다 (image) ══════ */
function S19() {
  return (
    <>
      <Stage src={IMG.finish} scrim="linear-gradient(180deg, rgba(243,238,227,0.96) 0%, rgba(243,238,227,0.75) 26%, rgba(243,238,227,0) 46%, rgba(243,238,227,0) 62%, rgba(243,238,227,0.9) 80%)" />
      <div style={{ ...abs(110, 80, 1700), textAlign: 'center' }}>
        <div style={kick}>오늘 한 장으로</div>
        <h1 style={{ ...h1, fontSize: 64, marginTop: 12, marginInline: 'auto' }}>
          모델은 <span style={{ color: C.berry }}>데이터</span>가 만들고, 쓸모는 <span style={{ color: C.ink, textDecoration: `underline 6px ${C.ink}` }}>프로그램</span>이 만든다
        </h1>
      </div>
      <Build at={1} style={abs(110, 770, 760)}>
        <div style={{ ...card, padding: '20px 26px', background: 'rgba(255,255,255,0.95)' }}>
          <div style={{ fontWeight: 900, fontSize: 26, color: C.berry }}>데이터</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            {['명확성·품질', '다양성', '양과 균형', '윤리', '시험 데이터는 따로'].map((x) => (
              <Chip key={x} style={{ fontSize: 18 }}>{x}</Chip>
            ))}
          </div>
        </div>
      </Build>
      <Build at={2} style={abs(1050, 770, 760)}>
        <div style={{ ...card, padding: '20px 26px', background: 'rgba(255,255,255,0.95)' }}>
          <div style={{ fontWeight: 900, fontSize: 26, color: C.ink }}>프로그램</div>
          <div style={{ fontWeight: 800, fontSize: 22, marginTop: 12 }}>공유 링크 → 신뢰도 → 기준값 → 클래스별 응답</div>
        </div>
      </Build>
      <Build at={3} style={abs(560, 920, 800)}>
        <div style={{ textAlign: 'center', fontWeight: 900, fontSize: 26, color: C.text, background: 'rgba(255,255,255,0.9)', borderRadius: 999, padding: '8px 20px' }}>
          이상하면 → 데이터인가, 프로그램인가
        </div>
      </Build>
    </>
  );
}

export default function ImageClassifierProjectDeck() {
  return (
    <Deck>
      <Page nav="무엇으로 가르칠까" notes={NOTES[1]}><S01 /></Page>
      <Page nav="고양이를 넣으면" notes={NOTES[2]}><S02 /></Page>
      <Page nav="오늘의 프로젝트" notes={NOTES[3]}><S03 /></Page>
      <Page nav="데이터가 가르친 것만" notes={NOTES[4]}><Scene><TextbookScene /></Scene></Page>
      <Page nav="지름길 학습" notes={NOTES[5]}><Scene><SnowScene /></Scene></Page>
      <Page nav="명확성과 품질" notes={NOTES[6]}><S06 /></Page>
      <Page nav="다양성" notes={NOTES[7]}><Scene><DialScene /></Scene></Page>
      <Page nav="양과 균형" notes={NOTES[8]}><S08 /></Page>
      <Page nav="시험 데이터" notes={NOTES[9]}><S09 /></Page>
      <Page nav="구하는 길과 윤리" notes={NOTES[10]}><S10 /></Page>
      <Page nav="바나나 언제 먹지?" notes={NOTES[11]}><S11 /></Page>
      <Page nav="공유 링크는 플러그" notes={NOTES[12]}><Scene><PlugScene /></Scene></Page>
      <Page nav="설계의 세 질문" notes={NOTES[13]}><S13 /></Page>
      <Page nav="기준값" notes={NOTES[14]}><Scene><GaugeScene /></Scene></Page>
      <Page nav="코드 생성 프롬프트" notes={NOTES[15]}><S15 /></Page>
      <Page nav="ChatGPT 절차" notes={NOTES[16]}><Scene freezeAt={15.5}><ChatWalkScene /></Scene></Page>
      <Page nav="데이터냐 프로그램이냐" notes={NOTES[17]}><S17 /></Page>
      <Page nav="활동 시작" notes={NOTES[18]}><S18 /></Page>
      <Page nav="정리" notes={NOTES[19]}><S19 /></Page>
    </Deck>
  );
}
