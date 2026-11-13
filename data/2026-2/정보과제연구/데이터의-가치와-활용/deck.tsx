import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import Build from '../../../../src/deck/Build';
import Reveal from '../../../../src/deck/Reveal';
import { useDeck } from '../../../../src/deck/DeckContext';
import BrowserFrame from '../../../../src/components/BrowserFrame';
import {
  Scene,
  useSceneTime,
  interpolate,
  spring,
  riseIn,
  easeInOut,
  easeOut,
} from '../../../../src/scene';
import { Collage, ArrowFlow, DashTrail, AnchorBox, PulseDot } from '../../../../src/vox';

/* ── 정보과제연구 · 데이터의 가치와 활용 (19장, 2차시 · 2교시 구성) ──────
   plan: data/2026-2/정보과제연구/데이터의-가치와-활용/plan.md
   1교시: 표지 → Reddit 콜라주 → 라이브 → 관통 문장 → 올빼미버스 씬 → 용도 전환
          → 변환(호갱노노·직방·화해) → 표준주소실록 → AlphaFold 씬 → 네 렌즈 → 라이브
   2교시: 역주행 레일 씬 → 데이터 사냥 → 뒤집기 → 카드 슬롯 씬 → 한 문장 기획서
          → 킬러 질문 → 마무리(활동지 제출) */

const C = {
  emerald: '#34d399',
  cyan: '#22d3ee',
  amber: '#fbbf24',
  coral: '#fb7185',
  orange: '#fb923c',
};

const BASE = 'data/2026-2/정보과제연구/데이터의-가치와-활용';
const GJDONG = 'https://gjdong.vercel.app/facility';
const ACTIVITY_URL = `${BASE}/활동지.html`;
const ALPHAFOLD_IMG = 'data/2026-2/인공지능기초/인공지능이-바꾸는-세상/images/alphafold-protein.png';

const IMG = {
  cover: `${BASE}/images/stage-cover.png`,
  reddit: `${BASE}/images/stage-reddit.png`,
  chair: `${BASE}/images/stage-chair.png`,
  nightbus: `${BASE}/images/stage-nightbus.png`,
  lab: `${BASE}/images/stage-lab.png`,
  school: `${BASE}/images/stage-school.png`,
  seoul: `${BASE}/images/seoul-night-skyline.jpg`,
};


/* ── Fit — 1920×1080 설계 박스를 화면에 맞춰 통째로 배율 변환 ──────────
   엔진은 반응형(reflow)이지만 이 덱은 씬·무대 이미지·절대배치가 많아
   어느 해상도에서든 같은 비율로 보여야 한다. 박스 안에서는 vw/vh를 쓰지
   않고(px로 환산), 박스 밖 여백은 슬라이드 배경이 채운다(letterbox). */
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
/* 엔진 .slide의 기본 여백·세로 중앙 정렬을 설계 박스 안에서 재현 */
function Center({ center, children }: { center?: boolean; children: ReactNode }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: center ? 'center' : 'stretch', textAlign: center ? 'center' : undefined, gap: center ? 18 : undefined, padding: '64px 88px' }}>
      {children}
    </div>
  );
}

/* 풀블리드 무대 이미지 + 어두운 스크림 — 텍스트 가독성 확보 */
function Stage({ src, scrim = 'linear-gradient(90deg, rgba(6,17,13,0.92) 0%, rgba(6,17,13,0.55) 45%, rgba(6,17,13,0.15) 100%)', alt = '', style }: { src: string; scrim?: string; alt?: string; style?: CSSProperties }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', ...style }} aria-hidden={alt === ''}>
      <img src={src} alt={alt} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: scrim }} />
    </div>
  );
}

const card: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: 18,
  padding: 'clamp(16px, 38.4px, 26px)',
};
const kw: CSSProperties = { wordBreak: 'keep-all' };
const mono: CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

const LENS = [
  { key: '결합', q: '상관없어 보이는 두 데이터를 붙이면?', ex: '통화 기록 × 택시', color: C.emerald },
  { key: '변환', q: '이 데이터를 아무나 읽을 수 있게 바꾸면?', ex: '실거래가 → 지도 · 성분표 → 등급', color: C.cyan },
  { key: '예측', q: '과거 데이터로 앞을 말하면?', ex: '구조 예측 · 시세 예측', color: C.amber },
  { key: '개방', q: '내가 만든 결과를 남이 쓰게 하면?', ex: 'AlphaFold DB · 공공 API', color: '#f1f5f9' },
];

/* 여정 6칸 트랙 — 표지(S1)와 마무리(S19) 공용 */
const JOURNEY = [
  { n: 1, t: '값이 붙은 데이터', half: 1 },
  { n: 2, t: '도시를 바꾼 데이터', half: 1 },
  { n: 3, t: '생활이 된 데이터', half: 1 },
  { n: 4, t: '데이터를 낳는 데이터', half: 1 },
  { n: 5, t: '네 개의 렌즈', half: 2 },
  { n: 6, t: '우리의 기획서', half: 2 },
];

function JourneyTrack({ lit }: { lit: number }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      {JOURNEY.map((j) => {
        const color = j.half === 1 ? C.emerald : C.cyan;
        const on = j.n <= lit;
        return (
          <div key={j.n} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 999,
            border: `1px solid color-mix(in srgb, ${color} ${on ? 70 : 30}%, transparent)`,
            background: on ? `color-mix(in srgb, ${color} 16%, transparent)` : 'transparent',
            color: on ? 'var(--fg)' : 'var(--fg-muted)', fontSize: 'clamp(12px, 23px, 14px)', fontWeight: 700, ...kw,
          }}>
            <span style={{ ...mono, color, fontSize: 12 }}>{j.half === 1 ? '1교시' : '2교시'} · {j.n}</span>
            {j.t}
          </div>
        );
      })}
    </div>
  );
}

function Timer({ m }: { m: string }) {
  return (
    <span style={{
      ...mono, fontWeight: 800, fontSize: 'clamp(15px, 30.7px, 20px)', padding: '6px 14px', borderRadius: 10,
      border: `1.5px solid color-mix(in srgb, ${C.amber} 60%, transparent)`, color: C.amber,
    }}>⏱ {m}</span>
  );
}

/* 사례 장에 '이 사례가 어느 렌즈인가'를 붙이는 배지 — S10 네 렌즈의 색·번호와 동일 */
const LENS_NO = ['①', '②', '③', '④'];
function LensTag({ idx, style }: { idx: number; style?: CSSProperties }) {
  const l = LENS[idx];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999,
      border: `1.5px solid ${l.color}`, background: `color-mix(in srgb, ${l.color} 14%, var(--bg))`,
      color: l.color, fontWeight: 800, fontSize: 15, ...mono, ...style,
    }}>렌즈 {LENS_NO[idx]} <span style={{ fontFamily: 'var(--font-body)', fontSize: 16 }}>{l.key}</span></span>
  );
}

function LinkBtn({ href, children, small }: { href: string; children: ReactNode; small?: boolean }) {
  return (
    <a href={href} target="_blank" rel="noopener" style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: small ? '9px 16px' : '13px 24px', borderRadius: 999,
      background: 'var(--accent)', color: 'var(--accent-ink)', fontWeight: 800,
      textDecoration: 'underline', textDecorationColor: 'color-mix(in srgb, var(--accent-ink) 40%, transparent)',
      fontSize: small ? 'clamp(13px, 25px, 15px)' : 'clamp(14px, 30.7px, 17px)', ...kw,
    }}>{children} ↗</a>
  );
}

/* ════════════════════ S2 — Reddit 글값 (무대 일러스트 위 카메라 여행 · 클릭으로 이동) ════════════════════ */
/* 스테이션: 이미지 안 초점(가로·세로 비율)과 배율. 초점 fx·fy는 [0.5/s, 1-0.5/s] 안에 있어야
   이미지 바깥(검은 여백)이 보이지 않는다. 카메라는 클릭 수의 함수 — CSS transition이 이동을 맡는다 */
/* ── S2 세계 — 배경 일러스트를 그대로 vox의 「종이 세계」로 쓴다 ──────────
   stage-reddit.png(1920×1080)를 1.5배(2880×1620) 월드로 깔고 카메라가 그 위를
   여행한다. 월드를 배경이 빈틈없이 채우므로 프레임 가장자리에 빈 배경이
   드러날 수 없다(vox useCam의 클램프와 같은 효과를 구조로 보장).
   글자·화살표·라벨은 전부 월드 좌표라 카메라와 함께 움직인다.
   팔레트는 vox 종이색이 아니라 이 덱의 다크 그린·형광 액센트를 쓴다. ─────── */
const W2 = { w: 2880, h: 1620 };
/* 이미지 좌표(1920×1080) → 월드 좌표 = ×1.5 */
const iw = (x: number) => x * 1.5;
/* 카메라 스테이션 — 클릭이 하나씩 넘긴다 */
const STATIONS = [
  { x: iw(430), y: iw(760), s: 1.5 },   // ① 폰을 보는 사람
  { x: iw(1130), y: iw(540), s: 1.4 },  // ② 서버 탑과 지켜보는 눈
  { x: iw(1560), y: iw(660), s: 1.45 }, // ③ 저울·금화·추락하는 선
];
/* vox useCam의 월드 경계 클램프 — 손으로 짤 때도 이건 반드시 옮긴다 */
function clampCam(c: { x: number; y: number; s: number }) {
  const mx = Math.max(0, W2.w / 2 - 960 / c.s);
  const my = Math.max(0, W2.h / 2 - 540 / c.s);
  return {
    s: c.s,
    x: Math.min(W2.w / 2 + mx, Math.max(W2.w / 2 - mx, c.x)),
    y: Math.min(W2.h / 2 + my, Math.max(W2.h / 2 - my, c.y)),
  };
}
/* 월드에 붙는 타이포 — vox Tag의 Fit 박스판.
   vox는 (size/1080)*100vh로 쓰지만 Fit 박스 안에서는 이중 스케일이 되므로
   size를 설계 px로 그대로 쓴다(월드 div 안이라 카메라 배율은 자동으로 곱해진다). */
function WT({ x, y, size = 44, color, bg, align = 'left', width, z = 20, on, delay = 0, children }: {
  x: number; y: number; size?: number; color: string; bg?: string;
  align?: 'left' | 'center' | 'right'; width?: number; z?: number; on: boolean; delay?: number; children: ReactNode;
}) {
  return (
    <div style={{
      position: 'absolute',
      left: `${(x / W2.w) * 100}%`,
      top: `${(y / W2.h) * 100}%`,
      width: width ? `${(width / W2.w) * 100}%` : undefined,
      transform: `translate(${align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0'}, -50%)`,
      textAlign: align,
      fontSize: size,
      fontWeight: 800,
      lineHeight: 1.35,
      color,
      background: bg,
      padding: bg ? `${size * 0.42}px ${size * 0.62}px` : undefined,
      borderRadius: bg ? size * 0.5 : undefined,
      border: bg ? `2px solid color-mix(in srgb, ${color} 55%, transparent)` : undefined,
      backdropFilter: bg ? 'blur(6px)' : undefined,
      opacity: on ? 1 : 0,
      transition: `opacity 0.55s ${delay}s`,
      zIndex: z,
      pointerEvents: 'none',
      ...kw,
    }}>{children}</div>
  );
}
function RedditScene() {
  const { clicks } = useDeck();
  const st = Math.min(clicks, 3);
  const cam = clampCam(STATIONS[Math.min(st, 2)]);
  return (
    <>
    <Collage
      world={W2}
      cam={cam}
      bg="var(--bg)"
      grain={0}
      camTransition="transform 2.2s cubic-bezier(.55,.05,.3,1)"
    >
      {/* 종이 세계 = 배경 일러스트 (월드를 빈틈없이 채운다) */}
      <img src={IMG.reddit} alt="스마트폰을 보는 사람에게서 나온 빛 조각이 서버 탑으로 모이고, 금화와 추락하는 선으로 바뀌는 밤 풍경"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />
      {/* 상하 비네트 — 월드에 붙여 카메라와 함께 움직인다 */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
        background: 'linear-gradient(180deg, rgba(6,17,13,0.72) 0%, rgba(6,17,13,0.04) 28%, rgba(6,17,13,0.04) 72%, rgba(6,17,13,0.58) 100%)' }} />

      {/* 좌표는 **이미지 좌표(1920×1080)** 로 적고 iw()가 월드로 옮긴다.
          각 스테이션이 실제로 보는 사각형(이미지 좌표)은 다음과 같다 —
          이 밖에 두면 화면에 안 나온다.
            ① x[3,857]    y[520,1000]
            ② x[673,1587] y[283,797]
            ③ x[1037,1920] y[412,908]   ← 클램프로 당겨진 결과 */}

      {/* ── ① 공짜로 쓴 글 한 줄 ──────────────────────────────────────── */}
      {st === 0 && <PulseDot x={iw(437)} y={iw(777)} color={C.emerald} r={26} />}
      <WT on={st === 0} delay={0.7} x={iw(300)} y={iw(905)} size={38} color={C.emerald}
        bg="color-mix(in srgb, var(--bg) 78%, transparent)">"오늘 버스 진짜 늦네" — 공짜로 쓴 글</WT>

      {/* ── ② 글이 서버로 모여 학습 데이터가 된다 ─────────────────────── */}
      {st === 1 && <>
        <ArrowFlow from={[iw(890), iw(515)]} to={[iw(1095), iw(590)]} color={C.emerald} count={4} size={34} />
        <AnchorBox x={iw(1173)} y={iw(345)} w={iw(230)} h={iw(120)} label="지켜보고 있다" color={C.cyan} labelSide="bottom" />
      </>}
      <WT on={st === 1} x={iw(1130)} y={iw(640)} size={44} color={C.cyan} align="center"
        bg="color-mix(in srgb, var(--bg) 80%, transparent)">누군가의 학습 데이터</WT>
      <WT on={st === 1} delay={0.9} x={iw(1130)} y={iw(708)} size={28} color="var(--fg-muted)" align="center"
        bg="color-mix(in srgb, var(--bg) 72%, transparent)">글 한 줄은 0원 — 수억 줄은 모델의 재료</WT>

      {/* ── ③ 값이 매겨지고, 소문에 흔들린다 ──────────────────────────── */}
      {st >= 2 && <>
        <DashTrail points={[[iw(1140), iw(620)], [iw(1380), iw(700)], [iw(1570), iw(780)]]} color={C.amber} width={6} />
        <AnchorBox x={iw(1650)} y={iw(768)} w={iw(280)} h={iw(150)} label="값이 매겨진다" color={C.amber} labelSide="top" />
      </>}
      <WT on={st >= 2} x={iw(1060)} y={iw(478)} size={38} color="var(--fg)" width={iw(470)}
        bg="color-mix(in srgb, var(--bg) 80%, transparent)">
        연 <span style={{ color: C.amber }}>6천만 달러</span> · 2024 Reddit ↔ Google 학습 허용 계약
      </WT>
      <WT on={st === 2} delay={1.1} x={iw(1895)} y={iw(470)} size={36} color={C.coral} align="right" width={iw(350)}
        bg="color-mix(in srgb, var(--bg) 80%, transparent)">
        <span style={{ color: C.coral }}>−8% · 하루 · 30억 달러</span>
        <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--fg-muted)', marginTop: 6 }}>2026-07 · 접근 차단 검토 보도만으로</div>
      </WT>

      {/* ── 클릭 3 — 정리 (③ 화면 왼쪽 절반에 앉힌다) ──────────────────── */}
      <WT on={st === 3} delay={0.2} x={iw(1060)} y={iw(790)} size={28} color="var(--fg)" width={iw(560)}
        bg="color-mix(in srgb, var(--bg) 92%, transparent)">
        계약 하나가 2025년 매출 22억 달러의 <b style={{ color: C.amber }}>3%나</b> 되는 규모였다.
        광고 말고 버는 돈(1억 4천만 달러)으로 따지면 <b style={{ color: C.amber }}>40%가 넘는다</b> — 글 한 줄은 0원인데, 모아 놓으니 이만큼이다.
      </WT>

      <Build at={1}><span /></Build>
      <Build at={2}><span /></Build>
      <Build at={3}><span /></Build>
    </Collage>
    {/* 헤드라인은 월드가 아니라 **화면**에 고정한다 — 슬라이드 제목이지 세계의 물체가 아니다.
        (vox 레퍼런스 덱 `?deck=vox-demo`의 Headline과 같은 관례. 다만 이 덱은 t가 아니라
        클릭으로 퇴장시킨다 — 교사가 첫 스테이션에서 말하는 동안 제목이 사라지면 안 된다) */}
    <div style={{ position: 'absolute', left: '5%', top: '7%', maxWidth: '48%', zIndex: 40,
      opacity: st === 0 ? 1 : 0, transition: 'opacity 0.6s', pointerEvents: 'none' }}>
      <div className="kicker" style={{ fontSize: 24, color: 'var(--fg-faint)' }}>사례 ① · 데이터에 가격표가 붙은 순간</div>
      <h2 className="headline" style={{ margin: '10px 0 0', fontSize: 68, lineHeight: 1.18, ...kw }}>
        어제 쓴 글이 <span className="accent-text">얼마짜리</span>였을까
      </h2>
    </div>
    </>
  );
}

/* ════════════════════ S5 — 서울의 밤을 두 겹으로 (씬) ════════════════════ */
const frac = (v: number) => v - Math.floor(v);
const hash = (i: number, k: number) => frac(Math.sin(i * 12.9898 + k * 78.233) * 43758.5453);
/* 서울 외곽선(단순화) — 지도 타일 없이 기하만 */
const SEOUL = 'M120 250 C150 180 230 120 330 110 C420 100 470 140 540 120 C620 96 700 120 780 100 C880 80 960 140 1040 170 C1090 190 1110 260 1080 320 C1050 380 960 400 880 430 C800 460 700 440 620 470 C540 500 430 480 350 450 C260 420 120 360 120 250 Z';
/* 심야 유동 핫스팟(강남·홍대·종로·건대·신림 대응 — 도식) */
const HOT = [
  [700, 330, 1.0],
  [430, 250, 0.8],
  [600, 200, 0.7],
  [860, 300, 0.6],
  [330, 360, 0.55],
] as const;
const CALLS = Array.from({ length: 150 }, (_, i) => {
  const h = HOT[i % HOT.length];
  const r = 28 + hash(i, 1) * 110 * (1.2 - h[2]);
  const a = hash(i, 2) * Math.PI * 2;
  return [h[0] + Math.cos(a) * r, h[1] + Math.sin(a) * r * 0.7] as const;
});
const TAXIS = Array.from({ length: 80 }, (_, i) => {
  const h = HOT[(i * 3) % HOT.length];
  const r = 14 + hash(i, 3) * 70 * (1.2 - h[2]);
  const a = hash(i, 4) * Math.PI * 2;
  return [h[0] + Math.cos(a) * r, h[1] + Math.sin(a) * r * 0.7] as const;
});

function SeoulScene() {
  const t = useSceneTime();
  const { clicks } = useDeck();
  /* 클릭 1: 두 필름이 겹친다 (그 전까지는 떨어진 채 기다린다) · 클릭 2: N61 노선 변경 */
  const merged = clicks >= 1;
  const merge = merged ? 1 : 0;
  const heat = merged ? 1 : 0;
  const route = merged ? 1 : 0;
  const filmA = { x: -300 * (1 - merge), y: -105 * (1 - merge), s: 0.6 + 0.4 * merge };
  const filmB = { x: 300 * (1 - merge), y: -105 * (1 - merge), s: 0.6 + 0.4 * merge };
  /* 필름은 (600,300)을 원점으로 scale된 뒤 이동한다 — 라벨도 같은 변환을 거쳐야 필름 위에 붙는다 */
  const mapPt = (px: number, py: number, f: { x: number; y: number; s: number }) => ({
    x: 600 + (px - 600) * f.s + f.x,
    y: 300 + (py - 300) * f.s + f.y,
  });
  const labA = mapPt(130, 80, filmA);
  const labB = mapPt(1080, 80, filmB);
  const changed = clicks >= 2;
  const filmT = 'transform 1.6s cubic-bezier(.6,.05,.3,1)';
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', paddingTop: 'clamp(30px, 64.8px, 60px)' }}>
        <div className="kicker" style={riseIn(t, 0.05)}>사례 ② · 서울 올빼미버스 (2013)</div>
        <div style={{ position: 'absolute', right: 88, top: 64, ...riseIn(t, 0.4) }}><LensTag idx={0} /></div>
        <h2 className="headline" style={{ margin: '10px auto 0', ...kw, ...riseIn(t, 0.2) }}>
          서울의 밤을 <span className="accent-text">두 겹으로</span> 읽다
        </h2>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '64.8px' }}>
        <svg viewBox="0 0 1200 560" style={{ width: 'min(1500px, 100%)', height: 'auto', overflow: 'visible' }}>
          <defs>
            <radialGradient id="heatG">
              <stop offset="0%" stopColor={C.amber} stopOpacity={0.9} />
              <stop offset="60%" stopColor={C.coral} stopOpacity={0.35} />
              <stop offset="100%" stopColor={C.coral} stopOpacity={0} />
            </radialGradient>
          </defs>
          {/* 지도 */}
          <path d={SEOUL} fill="var(--surface)" stroke="var(--line)" strokeWidth={2} opacity={interpolate(t, [0, 0.8], [0, 1])} />
          <path d="M120 300 C300 330 500 300 700 330 C850 350 1000 320 1080 300" fill="none" stroke="var(--fg-muted)" strokeWidth={1.2} opacity={0.3} strokeDasharray="6 6" />
          <path d="M560 120 C580 250 600 380 620 470" fill="none" stroke="var(--fg-muted)" strokeWidth={1.2} opacity={0.3} strokeDasharray="6 6" />
          <text x={140} y={480} fill="var(--fg-muted)" opacity={0.7} style={{ font: '600 13px var(--font-body, sans-serif)' }}>서울 (도식)</text>
          {/* 히트맵 — 겹친 뒤 점등 */}
          <g opacity={heat} style={{ transition: 'opacity 1.2s 1.2s' }}>
            {HOT.map(([x, y, w], i) => (
              <circle key={i} cx={x} cy={y} r={60 + 60 * w} fill="url(#heatG)" />
            ))}
          </g>
          {/* 필름 A — 통화 */}
          <g style={{ transform: `translate(${filmA.x}px, ${filmA.y}px) scale(${filmA.s})`, transformOrigin: '600px 300px', transition: filmT }}>
            <rect x={110} y={80} width={990} height={410} rx={14} fill={`color-mix(in srgb, ${C.orange} 6%, transparent)`}
              stroke={C.orange} strokeWidth={1.5} strokeDasharray="8 6" opacity={interpolate(t, [0.4, 1], [0, 0.9]) * (1 - merge * 0.8)} style={{ transition: 'opacity 1.2s' }} />
            {CALLS.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={4.2} fill={C.orange} opacity={interpolate(t, [0.5 + i * 0.004, 0.9 + i * 0.004], [0, 0.8])} />
            ))}
          </g>
          {/* 필름 B — 택시 */}
          <g style={{ transform: `translate(${filmB.x}px, ${filmB.y}px) scale(${filmB.s})`, transformOrigin: '600px 300px', transition: filmT }}>
            <rect x={110} y={80} width={990} height={410} rx={14} fill={`color-mix(in srgb, ${C.cyan} 6%, transparent)`}
              stroke={C.cyan} strokeWidth={1.5} strokeDasharray="8 6" opacity={interpolate(t, [0.4, 1], [0, 0.9]) * (1 - merge * 0.8)} style={{ transition: 'opacity 1.2s' }} />
            {TAXIS.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={5} fill={C.cyan} opacity={interpolate(t, [0.8 + i * 0.006, 1.2 + i * 0.006], [0, 0.9])} />
            ))}
          </g>
          {/* 필름 라벨 — bbox 바깥(위) */}
          <g opacity={interpolate(t, [0.9, 1.4], [0, 1]) * (1 - merge)} style={{ transition: 'opacity 0.6s' }}>
            <text x={labA.x} y={labA.y - 14} fill={C.orange} style={{ font: '800 19px var(--font-body, sans-serif)' }}>KT 통화 기록 30억 건 · 요금 청구용</text>
            <text x={labB.x} y={labB.y - 14} textAnchor="end" fill={C.cyan} style={{ font: '800 19px var(--font-body, sans-serif)' }}>심야택시 승하차 500만 건 · 결제용</text>
          </g>
          <text x={600} y={62} textAnchor="middle" fill="var(--fg)" opacity={heat}
            style={{ font: '800 19px var(--font-body, sans-serif)', transition: 'opacity 0.8s 1.4s' }}>두 장을 겹치자 — 밤에 사람이 있는 곳이 보였다</text>
          {/* 노선 — 능선 따라 */}
          <path d="M330 360 C 420 300, 520 230, 600 200 C 680 250, 700 330, 860 300" pathLength={1} fill="none"
            stroke={C.emerald} strokeWidth={5} strokeLinecap="round" opacity={changed ? 0.3 : 0.95}
            style={{ strokeDasharray: 1, strokeDashoffset: 1 - route, transition: 'opacity 0.5s, stroke-dashoffset 1.8s ease-in-out 1.8s' }} />
          {/* 범례 — 필름이 겹친 뒤에도 색을 읽을 수 있게 */}
          <g opacity={heat} style={{ font: '600 13px var(--font-body, sans-serif)', transition: 'opacity 0.8s 1.4s' }}>
            <circle cx={1000} cy={478} r={5} fill={C.orange} /><text x={1010} y={483} fill="var(--fg-muted)">통화 (KT)</text>
            <circle cx={1090} cy={478} r={5} fill={C.cyan} /><text x={1100} y={483} fill="var(--fg-muted)">심야택시</text>
          </g>
          {/* N61 — 클릭: 예정(회색 점선) → 변경(초록 실선) */}
          <g opacity={changed ? 1 : 0} style={{ transition: 'opacity 0.5s' }}>
            <path d="M430 250 C 520 330, 640 400, 760 405" fill="none" stroke="var(--fg-muted)" strokeWidth={3} strokeDasharray="10 8" opacity={changed ? 0.55 : 0} style={{ transition: 'opacity 0.6s' }} />
            <path d="M430 250 C 560 300, 660 330, 760 405" pathLength={1} fill="none" stroke={C.emerald} strokeWidth={5} strokeLinecap="round"
              style={{ strokeDasharray: 1, strokeDashoffset: changed ? 0 : 1, transition: 'stroke-dashoffset 1.2s ease-out 0.5s' }} />
            <text x={600} y={440} textAnchor="middle" fill="var(--fg-muted)" style={{ font: '600 14px var(--font-body, sans-serif)' }}>남부순환로·동일로 (당초안)</text>
            <text x={800} y={222} textAnchor="middle" fill={C.emerald} style={{ font: '800 16px var(--font-body, sans-serif)' }}>N61 → 효령로·능동로 (변경)</text>
            <text x={600} y={540} textAnchor="middle" fill="var(--fg)" style={{ font: '800 20px var(--font-body, sans-serif)' }}>데이터가 노선을 옮겼다</text>
          </g>
          <text x={600} y={540} textAnchor="middle" fill="var(--fg-muted)" opacity={changed ? 0 : merged ? 1 : 0}
            style={{ font: '500 16px var(--font-body, sans-serif)', transition: changed ? 'opacity 0.3s' : 'opacity 0.6s 3.4s' }}>
            통화 기록 × 택시 → GIS 유동인구 지도 → 노선·배차·정류장 확정
          </text>
          <text x={600} y={540} textAnchor="middle" fill={C.amber} opacity={merged ? 0 : interpolate(t, [1.6, 2.2], [0, 1])}
            style={{ font: '700 16px var(--font-body, sans-serif)', transition: 'opacity 0.3s' }}>
            서로 다른 목적으로 모은 두 장 — 클릭하면 겹친다
          </text>
        </svg>
      </div>
    </div>
  );
}

/* ════════════════════ S6 — 용도 전환 화살표 (빌드) ════════════════════ */
function PhoneIcon() {
  return (
    <svg viewBox="0 0 80 80" width={64} height={64} fill="none" stroke={C.orange} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x={24} y={8} width={32} height={64} rx={7} />
      <path d="M34 14 h12 M36 64 h8" />
      <path d="M12 30 C6 40 6 50 12 58 M68 30 C74 40 74 50 68 58" opacity={0.7} />
    </svg>
  );
}
function BusIcon() {
  return (
    <svg viewBox="0 0 80 80" width={64} height={64} fill="none" stroke={C.emerald} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x={10} y={16} width={60} height={44} rx={9} />
      <path d="M10 40 H70 M20 60 v8 M60 60 v8 M22 28 h14 M44 28 h14" />
      <circle cx={22} cy={50} r={3} fill={C.emerald} /><circle cx={58} cy={50} r={3} fill={C.emerald} />
    </svg>
  );
}
function RepurposeSlide() {
  const { clicks } = useDeck();
  const drawn = clicks >= 1;
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 21.6px, 24px)' }}>
      <Reveal>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}><div className="kicker">사례 ② 이어서 · 데이터의 값은 어디서 나오나</div><LensTag idx={0} /></div>
        <h2 className="headline" style={kw}>아무도 그 용도로 <span className="accent-text">모으지 않았다</span></h2>
      </Reveal>
      <Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(120px, 0.9fr) minmax(0, 1fr)', alignItems: 'center', gap: 'clamp(8px, 28.8px, 18px)' }}>
          <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, borderTop: `3px solid ${C.orange}` }}>
            <PhoneIcon />
            <div style={{ fontWeight: 800, fontSize: 'clamp(17px, 38.4px, 22px)' }}>통화 기록</div>
            <div style={{ color: 'var(--fg-muted)', fontSize: 14 }}>원래 목적: <b>요금 청구</b></div>
          </div>
          <div style={{ position: 'relative' }}>
            <svg viewBox="0 0 240 120" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
              <path d="M8 60 C 70 20, 170 20, 232 60" pathLength={1} fill="none" stroke={C.coral} strokeWidth={7} strokeLinecap="round"
                style={{ strokeDasharray: 1, strokeDashoffset: drawn ? 0 : 1, transition: 'stroke-dashoffset 1.1s ease-out' }} />
              <path d="M232 60 l-22 -16 l4 20 z" fill={C.coral} opacity={drawn ? 1 : 0} style={{ transition: 'opacity 0.3s 0.9s' }} />
              <text x={120} y={104} textAnchor="middle" fill={C.coral} opacity={drawn ? 1 : 0}
                style={{ font: '800 19px var(--font-body, sans-serif)', transition: 'opacity 0.4s 1.0s' }}>원래 목적 밖에서 쓰다</text>
            </svg>
          </div>
          <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, borderTop: `3px solid ${C.emerald}`, opacity: drawn ? 1 : 0.45, transition: 'opacity 0.6s 0.8s' }}>
            <BusIcon />
            <div style={{ fontWeight: 800, fontSize: 'clamp(17px, 38.4px, 22px)' }}>심야버스 노선</div>
            <div style={{ color: 'var(--fg-muted)', fontSize: 14 }}>아무도 이걸 위해 모으지 않았다</div>
          </div>
        </div>
      </Reveal>
      <Build at={2}>
        <div style={{ ...card, display: 'flex', gap: 16, alignItems: 'center', textAlign: 'left', background: 'color-mix(in srgb, var(--surface) 60%, transparent)' }}>
          <span style={{ ...mono, flex: 'none', color: C.cyan, fontWeight: 800, fontSize: 13 }}>같은 발상</span>
          <p style={{ fontSize: 'clamp(14px, 30.7px, 17px)', lineHeight: 1.6, ...kw }}>
            <b>아비장(코트디부아르)</b> — IBM 연구팀이 <b>익명 통신 기록</b>에 기존 버스망·도로망을 겹쳐 노선 신설·연장안을 제안했다.
            <span style={{ color: 'var(--fg-muted)' }}> 오늘 활동 2단계 '뒤집기'의 완성 예시.</span>
          </p>
        </div>
      </Build>
      <Build at={2}>
        <p className="lead" style={kw}>
          데이터의 가치는 '무엇을 위해 모았나'가 아니라 <strong style={{ color: 'var(--fg)' }}>'무엇에 쓸 수 있나'</strong>에서 나온다.
        </p>
      </Build>
    </div>
  );
}

/* ════════════════════ S7 — 변환 전 / 변환 후 (빌드) ════════════════════ */
const RAW = [
  { k: 'api', txt: '{"거래금액":"  85,000","법정동":"역삼동","건축년도":2004,"전용면적":84.97}', who: '국토교통부 실거래가 API', at: 1 },
  { k: 'bld', txt: '건축물대장 · 법정동코드 1168010100 · 주용도 공동주택 · 승강기 2', who: '건축물대장 · 법정동 코드', at: 2 },
  { k: 'ing', txt: '정제수, 글리세린, 부틸렌글라이콜, 나이아신아마이드, 1,2-헥산다이올, 카보머, 향료…', who: '식약처 화장품 전성분', at: 3 },
];
const AFTER = [
  { at: 1, name: '호갱노노', badge: '변환', color: C.emerald, body: '📍 역삼동 ○○아파트 84㎡ — 8.5억 · 3개월 전보다 ▲', foot: '공공데이터 20여 종을 지도 한 장에' },
  { at: 2, name: '직방', badge: '예측', color: C.amber, body: '시세 예측 · 실거래가 + 건축물대장 + 법정동 코드', foot: '흩어진 공공데이터를 묶어 시세 정보로' },
  { at: 3, name: '화해', badge: '변환', color: C.cyan, body: '주의 성분 2 · 지성 피부 적합 · 안전도 ★★★★', foot: '식약처 공개 전성분을 등급으로' },
];
function TranslateSlide() {
  const { clicks } = useDeck();
  return (
    <div style={{ width: 'min(1180px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 21.6px, 22px)' }}>
      <Reveal>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}><div className="kicker">사례 ③ · 새 데이터 없이 서비스가 된다</div><LensTag idx={1} /><LensTag idx={2} /></div>
        <h2 className="headline" style={kw}>흩어진 데이터를 <span className="accent-text">누구나 읽는 형태로</span> 바꿨을 뿐</h2>
      </Reveal>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)', gap: 'clamp(12px, 30.7px, 22px)', alignItems: 'stretch' }}>
        <Reveal>
          <div style={{ ...card, background: '#050a08', padding: 0, overflow: 'hidden', height: '100%' }}>
            <div style={{ display: 'flex', gap: 6, padding: '10px 14px', borderBottom: '1px solid var(--line)' }}>
              {['#fb7185', '#fbbf24', '#34d399'].map((c) => <span key={c} style={{ width: 10, height: 10, borderRadius: 5, background: c }} />)}
              <span style={{ ...mono, fontSize: 12, color: 'var(--fg-muted)', marginLeft: 8 }}>변환 전 — 공개돼 있지만 아무도 못 읽는 원자료 (실제 XML 응답을 교육용 JSON으로 단순화)</span>
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {RAW.map((r) => {
                const hot = clicks >= r.at;
                return (
                  <div key={r.k} style={{ borderLeft: `3px solid ${hot ? C.emerald : 'var(--line)'}`, paddingLeft: 12, transition: 'border-color 0.4s', opacity: hot ? 1 : 0.7 }}>
                    <div style={{ ...mono, fontSize: 11.5, color: hot ? C.emerald : 'var(--fg-muted)' }}>{r.who}</div>
                    <div style={{ ...mono, fontSize: 'clamp(11px, 22.1px, 13.5px)', color: 'var(--fg)', lineHeight: 1.55, wordBreak: 'break-all' }}>{r.txt}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
          {AFTER.map((a) => (
            <Build key={a.name} at={a.at}>
              <div style={{ ...card, padding: '12px 16px', borderColor: `color-mix(in srgb, ${a.color} 45%, transparent)`, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: a.color, fontSize: 18 }}>➜</span>
                  <span style={{ fontWeight: 800, fontSize: 'clamp(15px, 30.7px, 18px)' }}>{a.name}</span>
                  <span style={{ ...mono, fontSize: 11, color: a.color, border: `1px solid ${a.color}`, borderRadius: 999, padding: '1px 8px' }}>{a.badge}</span>
                </div>
                <div style={{ fontSize: 'clamp(13px, 25px, 15px)', ...kw }}>{a.body}</div>
                <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', ...kw }}>{a.foot}</div>
              </div>
            </Build>
          ))}
        </div>
      </div>
      <Build at={3}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span className="kicker" style={{ color: C.coral }}>세 회사 모두, 출발점은 이미 공개된 데이터</span>
        </div>
      </Build>
    </div>
  );
}

/* ════════════════════ S9 — 데이터가 데이터를 낳다 (씬 · 2026-08-23 재설계) ══════════
   메타포: 작은 웅덩이(실험으로 푼 구조) → 수문(AlphaFold) → 넓게 퍼지는 삼각주(예측 구조).
   적대 검증 반영 세 가지:
   ① 균등 격자 24칸 폐기 — 흐름이 부채꼴로 퍼지는 하나의 수로로 대체
   ② 실험 데이터는 ● 채워진 점, 예측 데이터는 ○ 빈 점 — 신뢰도가 다르다는 것을 그림이 말한다
   ③ 클릭 1은 스탬프가 아니라 삼각주가 화면 밖으로 번지는 공간 변화 */
const GX = 530, GY = 445;                       // 수문 출구
const EXP_DOTS = Array.from({ length: 44 }, (_, i) => {
  const a = hash(i, 11) * Math.PI * 2;
  const r = Math.sqrt(hash(i, 12));
  return { x: 210 + Math.cos(a) * r * 112, y: GY + Math.sin(a) * r * 78 };
});
const PRED_DOTS = Array.from({ length: 165 }, (_, i) => ({ u: hash(i, 13), v: hash(i, 14), r: 4.5 + hash(i, 15) * 2.5 }));
function fmt(n: number) {
  return Math.round(n).toLocaleString('ko-KR');
}
function AlphaFoldScene() {
  const t = useSceneTime();
  const { clicks } = useDeck();
  const fill = interpolate(t, [0.2, 1.7], [0, 1], easeOut);
  const gate = interpolate(t, [1.7, 2.7], [0, 1], easeInOut);
  const flow = interpolate(t, [2.5, 6.2], [0, 1], easeInOut);
  const countE = interpolate(t, [2.5, 6.6], [0, 1], easeInOut);
  const count = 360000 + (214000000 - 360000) * countE * countE;
  const open = clicks >= 1;
  const L = open ? 960 : 830;                   // 삼각주 길이
  const SP = open ? 268 : 210;                  // 끝단 반폭
  const half = (u: number) => 24 + u * SP;      // 진행 거리 u에서의 반폭
  const edge = GX + L * flow;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Stage src={IMG.lab} scrim="linear-gradient(180deg, rgba(6,17,13,0.95) 0%, rgba(6,17,13,0.88) 45%, rgba(6,17,13,0.93) 100%)" />
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: 'clamp(30px, 64.8px, 60px) 96px 0', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', ...riseIn(t, 0.05) }}><div className="kicker">사례 ④ · AlphaFold 단백질 구조 DB</div><LensTag idx={3} /></div>
          <h2 className="headline" style={{ margin: '10px 0 0', ...kw, ...riseIn(t, 0.2) }}>데이터가 <span className="accent-text">데이터를 낳다</span></h2>
        </div>
        <div style={{ textAlign: 'right', ...riseIn(t, 2.4) }}>
          <div style={{ ...mono, fontWeight: 800, fontSize: 'clamp(28px, 76.8px, 52px)', color: C.emerald, lineHeight: 1, minWidth: '11ch', textAlign: 'right' }}>{fmt(count)}</div>
          <div style={{ fontSize: 15, color: 'var(--fg)', fontWeight: 700 }}>AI가 예측한 단백질 구조 (건)</div>
          <div style={{ fontSize: 12.5, color: 'var(--fg-muted)' }}>2021년 약 36만 → 2억 1,400만+</div>
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '46px' }}>
        <svg viewBox="0 0 1500 720" style={{ width: 'min(1560px, 100%)', height: 'auto', overflow: 'visible' }}>
          <defs>
            <linearGradient id="deltaFade" x1="0" x2="1">
              <stop offset="0%" stopColor={C.emerald} stopOpacity={0.22} />
              <stop offset="62%" stopColor={C.emerald} stopOpacity={0.13} />
              <stop offset="100%" stopColor={C.emerald} stopOpacity={0} />
            </linearGradient>
          </defs>
          {/* ── 왼쪽: 실험으로 규명한 구조 (작은 웅덩이 · 채워진 점) ── */}
          <text x={210} y={288} textAnchor="middle" fill="var(--fg)" style={{ font: '800 19px var(--font-body, sans-serif)' }}>실험으로 규명한 구조</text>
          <text x={210} y={334} textAnchor="middle" fill={C.cyan} opacity={fill} style={{ font: '800 36px var(--font-mono, monospace)' }}>약 20만</text>
          <ellipse cx={210} cy={GY} rx={120} ry={86} fill={`color-mix(in srgb, ${C.cyan} 12%, transparent)`} stroke={C.cyan} strokeWidth={2} opacity={0.55} />
          {EXP_DOTS.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={6} fill={C.cyan} opacity={i / EXP_DOTS.length < fill ? 0.95 : 0} style={{ transition: 'opacity 0.2s' }} />
          ))}
          <text x={210} y={575} textAnchor="middle" fill="var(--fg-muted)" opacity={fill} style={{ font: '500 15px var(--font-body, sans-serif)' }}>PDB · 50년치 · 하나에 몇 달~몇 년</text>

          {/* ── 가운데: 수문 (AlphaFold) ── */}
          <rect x={326} y={GY - 26} width={150} height={52} fill={`color-mix(in srgb, ${C.cyan} 26%, transparent)`} opacity={gate} />
          <rect x={466} y={232} width={68} height={20} rx={3} fill="var(--surface)" stroke={C.emerald} strokeWidth={2} strokeOpacity={0.6} />
          <rect x={466} y={252} width={10} height={390} fill="var(--surface)" stroke={C.emerald} strokeWidth={2} strokeOpacity={0.6} />
          <rect x={524} y={252} width={10} height={390} fill="var(--surface)" stroke={C.emerald} strokeWidth={2} strokeOpacity={0.6} />
          <rect x={476} y={252} width={48} height={Math.max(16, 386 * (1 - gate))} rx={3} fill={C.emerald} opacity={0.9} />
          <image href={ALPHAFOLD_IMG} x={445} y={150} width={110} height={82} preserveAspectRatio="xMidYMid slice" opacity={interpolate(t, [1.3, 1.9], [0, 1])} />
          <text x={500} y={676} textAnchor="middle" fill={C.emerald} style={{ font: '800 18px var(--font-body, sans-serif)' }}>AlphaFold</text>

          {/* ── 오른쪽: AI가 예측한 구조 (부채꼴 삼각주 · 빈 점) ── */}
          <path d={`M${GX} ${GY - 24} L${edge} ${GY - half(flow)} L${edge} ${GY + half(flow)} L${GX} ${GY + 24} Z`} fill="url(#deltaFade)" />
          <path d={`M${GX} ${GY - 24} L${edge} ${GY - half(flow)}`} fill="none" stroke={C.emerald} strokeWidth={1.6} strokeOpacity={0.4} />
          <path d={`M${GX} ${GY + 24} L${edge} ${GY + half(flow)}`} fill="none" stroke={C.emerald} strokeWidth={1.6} strokeOpacity={0.4} />
          {PRED_DOTS.map((d, i) => {
            const on = flow > d.u;
            return (
              <circle key={i} cx={GX + d.u * L} cy={GY + (d.v - 0.5) * 2 * half(d.u)} r={d.r}
                fill="none" stroke={C.emerald} strokeWidth={1.8} opacity={on ? 0.85 : 0} style={{ transition: 'opacity 0.25s' }} />
            );
          })}
          <text x={1040} y={196} textAnchor="middle" fill="var(--fg)" opacity={interpolate(t, [3.4, 4], [0, 1])} style={{ font: '800 19px var(--font-body, sans-serif)' }}>AI가 예측한 구조</text>
          <text x={1040} y={224} textAnchor="middle" fill="var(--fg-muted)" opacity={interpolate(t, [3.6, 4.2], [0, 1])} style={{ font: '500 14.5px var(--font-body, sans-serif)' }}>실험으로 확인한 것이 아니라 계산으로 얻은 후보다</text>

          {/* ── 범례: 두 데이터의 성격이 다르다 (적대 검증 반영) ── */}
          <g opacity={interpolate(t, [4.4, 5], [0, 1])}>
            <circle cx={866} cy={258} r={6} fill={C.cyan} />
            <text x={882} y={264} fill="var(--fg-muted)" style={{ font: '600 14.5px var(--font-body, sans-serif)' }}>실험으로 확인</text>
            <circle cx={1022} cy={258} r={6} fill="none" stroke={C.emerald} strokeWidth={1.8} />
            <text x={1038} y={264} fill="var(--fg-muted)" style={{ font: '600 14.5px var(--font-body, sans-serif)' }}>AI 예측 — 검증은 사람이</text>
          </g>

          {/* ── 클릭 1: 삼각주가 화면 밖으로 번진다 = 공개 ── */}
          <g opacity={open ? 1 : 0} style={{ transition: 'opacity 0.6s 0.5s' }}>
            <text x={1268} y={GY - 6} textAnchor="middle" fill={C.coral} style={{ font: '800 22px var(--font-body, sans-serif)' }}>무료 · 누구나</text>
            <text x={1268} y={GY + 24} textAnchor="middle" fill="var(--fg-muted)" style={{ font: '600 14.5px var(--font-body, sans-serif)' }}>연구실 어디서든 내려받는다</text>
          </g>
          <text x={1040} y={648} textAnchor="middle" fill="var(--fg)" opacity={interpolate(t, [5.6, 6.3], [0, 1])}
            style={{ font: '800 19px var(--font-body, sans-serif)' }}>1,000배를 만들어, 팔지 않고 풀었다</text>
        </svg>
      </div>
      <div style={{ position: 'absolute', right: '3%', bottom: '6.5%', fontSize: 11, color: 'var(--fg-muted)', ...kw }}>
        2024 노벨 화학상 (단백질 구조 예측) · 단백질 이미지: AlphaFold ZNF555 · Wikimedia Commons · CC BY 4.0 · 수치: AlphaFold DB · NIH
      </div>
    </div>
  );
}

/* ════════════════════ S10 — 네 개의 렌즈 (빌드) ════════════════════ */
const LENS_POS = [
  { left: '0%', top: '-2%', size: 'min(270px, 480px)' },
  { left: '64%', top: '4%', size: 'min(230px, 403.2px)' },
  { left: '60%', top: '60%', size: 'min(220px, 384px)' },
  { left: '4%', top: '64%', size: 'min(190px, 326.4px)' },
];
const LENS_VIEW = ['잔반량 × 시간표?', '메뉴별 잔반 순위표', '내일 잔반량 예측', '급식실이 쓰게 공개'];
function LensSlide() {
  return (
    <div style={{ width: 'min(1100px, 100%)', marginInline: 'auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)', gap: 'clamp(16px, 48px, 36px)', alignItems: 'center' }}>
      <div style={{ position: 'relative', aspectRatio: '1.15', minHeight: 0 }}>
        <div style={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 'min(320px, 576px)',
          ...card, textAlign: 'center', borderColor: `color-mix(in srgb, ${C.emerald} 50%, transparent)`, zIndex: 3, boxShadow: '0 18px 50px -20px rgba(0,0,0,0.7)',
        }}>
          <div style={{ ...mono, fontSize: 12, color: 'var(--fg-muted)' }}>데이터 카드</div>
          <div style={{ fontWeight: 800, fontSize: 'clamp(17px, 38.4px, 22px)', marginTop: 4 }}>지난달 급식 잔반량</div>
          <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', marginTop: 4 }}>날짜 · 메뉴 · kg · 학년</div>
        </div>
        {LENS.map((l, i) => (
          <Build key={l.key} at={i + 1} style={{ position: 'absolute', left: LENS_POS[i].left, top: LENS_POS[i].top, width: LENS_POS[i].size, zIndex: 2 }}>
            <div style={{
              aspectRatio: '1', borderRadius: '50%', border: `4px solid ${l.color}`,
              background: `color-mix(in srgb, ${l.color} 12%, var(--bg))`, boxShadow: `0 0 28px color-mix(in srgb, ${l.color} 35%, transparent)`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '10%', gap: 4,
            }}>
              <span style={{ ...mono, fontWeight: 800, fontSize: 'clamp(12px, 23px, 14px)', color: l.color }}>{l.key}</span>
              <span style={{ fontWeight: 800, fontSize: 'clamp(13px, 25.9px, 17px)', color: 'var(--fg)', ...kw }}>{LENS_VIEW[i]}</span>
            </div>
          </Build>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Reveal>
          <div className="kicker">네 사례를 네 질문으로</div>
          <h2 className="headline" style={kw}>네 개의 <span className="accent-text">렌즈</span></h2>
        </Reveal>
        {LENS.map((l, i) => (
          <Build key={l.key} at={i + 1}>
            <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 10, alignItems: 'baseline', borderLeft: `3px solid ${l.color}`, paddingLeft: 12 }}>
              <span style={{ fontWeight: 800, color: l.color }}>{l.key}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 'clamp(13px, 26.9px, 16px)', ...kw }}>{l.q}</div>
                <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', ...kw }}>{l.ex}</div>
              </div>
            </div>
          </Build>
        ))}
        <Build at={4}>
          <p style={{ color: 'var(--fg-muted)', fontSize: 14, ...kw }}>같은 데이터 하나에 렌즈 넷 — 질문이 넷 나온다. 다음 시간의 도구.</p>
        </Build>
      </div>
    </div>
  );
}

/* ════════════════════ S12 — 역주행 레일 (씬) ════════════════════ */
function RailScene() {
  const t = useSceneTime();
  const { clicks } = useDeck();
  const topX = interpolate(t, [0.4, 3], [120, 690], easeInOut);
  const shake = t > 3 ? Math.sin((t - 3) * 28) * 6 * Math.max(0, 1 - (t - 3) * 1.6) : 0;
  const botX = interpolate(t, [3.2, 6.4], [120, 812], easeInOut);
  const on = clicks >= 1;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', paddingTop: 'clamp(30px, 64.8px, 60px)' }}>
        <div className="kicker" style={riseIn(t, 0.05)}>2교시 · 오늘의 규칙</div>
        <h2 className="headline" style={{ margin: '10px auto 0', ...kw, ...riseIn(t, 0.2) }}>문제에서 <span className="accent-text">시작하지 않는다</span></h2>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '64.8px' }}>
        <svg viewBox="0 0 1200 520" style={{ width: 'min(1500px, 100%)', height: 'auto', overflow: 'visible' }}>
          {/* 상단 레일 — 흔한 순서 */}
          <g opacity={on ? 0.35 : 1} style={{ transition: 'opacity 0.6s' }}>
            <line x1={60} y1={170} x2={1140} y2={170} stroke="var(--fg-muted)" strokeWidth={4} strokeLinecap="round" opacity={0.5} />
            {Array.from({ length: 22 }, (_, i) => <line key={i} x1={80 + i * 50} y1={158} x2={80 + i * 50} y2={182} stroke="var(--fg-muted)" strokeWidth={2} opacity={0.3} />)}
            <text x={60} y={110} fill="var(--fg-muted)" style={{ font: '700 15px var(--font-body, sans-serif)' }}>흔한 순서 · "뭐 만들까?"</text>
            {/* 차단봉 */}
            <g opacity={interpolate(t, [0.2, 0.8], [0, 1])}>
              <rect x={820} y={120} width={14} height={70} fill={C.coral} />
              <rect x={834} y={128} width={120} height={18} fill={C.coral} />
              <rect x={834} y={128} width={120} height={18} fill="url(#stripe)" />
              <text x={900} y={110} textAnchor="middle" fill={C.coral} style={{ font: '800 15px var(--font-body, sans-serif)' }}>데이터 없음</text>
            </g>
            <g transform={`translate(${topX + shake} 170)`}>
              <rect x={-108} y={-44} width={216} height={52} rx={11} fill="var(--surface)" stroke="var(--fg-muted)" strokeWidth={2} />
              <text x={0} y={-11} textAnchor="middle" fill="var(--fg)" style={{ font: '800 18px var(--font-body, sans-serif)' }}>문제 중심 해결 방법</text>
              <circle cx={-66} cy={12} r={9} fill="var(--fg-muted)" /><circle cx={66} cy={12} r={9} fill="var(--fg-muted)" />
            </g>
            <text x={960} y={215} textAnchor="start" fill="var(--fg-muted)" opacity={interpolate(t, [3, 3.6], [0, 1])} style={{ font: '600 14px var(--font-body, sans-serif)' }}>→ 포기, 또는 전부 '앱 만들기'</text>
          </g>
          <defs>
            <pattern id="stripe" width={14} height={18} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width={7} height={18} fill="var(--bg)" opacity={0.6} />
            </pattern>
          </defs>
          {/* 하단 레일 — 오늘 순서 */}
          <g>
            <line x1={60} y1={400} x2={1140} y2={400} stroke={on ? C.emerald : 'var(--fg-muted)'} strokeWidth={on ? 6 : 4} strokeLinecap="round" opacity={on ? 1 : 0.6} style={{ transition: 'all 0.6s' }} />
            {Array.from({ length: 22 }, (_, i) => <line key={i} x1={80 + i * 50} y1={388} x2={80 + i * 50} y2={412} stroke={on ? C.emerald : 'var(--fg-muted)'} strokeWidth={2} opacity={0.35} />)}
            <text x={60} y={340} fill={on ? C.emerald : 'var(--fg)'} style={{ font: '700 15px var(--font-body, sans-serif)', transition: 'fill 0.6s' }}>오늘 순서 · 가진 데이터에서 거꾸로</text>
            {/* 역 */}
            <g opacity={interpolate(t, [3.2, 3.8], [0, 1])}>
              {/* 레일 위의 역 — 노드와 줄기로 선에 붙인다 (도형 가장자리 앵커) */}
              <circle cx={520} cy={400} r={8} fill="var(--bg)" stroke={C.cyan} strokeWidth={3} />
              <path d="M520 408 L520 418" stroke={C.cyan} strokeWidth={2.5} />
              <rect x={470} y={418} width={100} height={36} rx={8} fill="var(--surface)" stroke={C.cyan} strokeWidth={2} />
              <text x={520} y={442} textAnchor="middle" fill={C.cyan} style={{ font: '800 16px var(--font-body, sans-serif)' }}>질문</text>
            </g>
            <g opacity={interpolate(t, [3.2, 3.8], [0, 1])}>
              <a href={GJDONG} target="_blank" rel="noopener">
                <rect x={960} y={418} width={180} height={96} rx={10} fill="var(--surface)" stroke={C.emerald} strokeWidth={2} />
                <image href={`${BASE}/images/gjdong-facility.png`} x={966} y={424} width={168} height={58} preserveAspectRatio="xMidYMin slice" />
                <text x={1050} y={502} textAnchor="middle" fill={C.emerald} style={{ font: '800 14px var(--font-body, sans-serif)', textDecoration: 'underline' }}>서비스 · 표준주소실록 ↗</text>
              </a>
            </g>
            <g transform={`translate(${botX} 400)`}>
              <rect x={-108} y={-44} width={216} height={52} rx={11} fill="var(--surface)" stroke={C.emerald} strokeWidth={2.5} />
              <text x={0} y={-11} textAnchor="middle" fill="var(--fg)" style={{ font: '800 18px var(--font-body, sans-serif)' }}>데이터 중심 해결 방법</text>
              <circle cx={-66} cy={12} r={9} fill={C.emerald} /><circle cx={66} cy={12} r={9} fill={C.emerald} />
            </g>
          </g>
          <text x={600} y={290} textAnchor="middle" fill={on ? C.emerald : 'var(--fg-muted)'} opacity={on ? 1 : interpolate(t, [6.2, 6.8], [0, 1])}
            style={{ font: '800 20px var(--font-body, sans-serif)', transition: 'fill 0.5s' }}>
            {on ? '오늘은 아래 레일만' : '데이터 → 이 데이터가 답할 수 있는 질문 → 서비스'}
          </text>
        </svg>
      </div>
    </div>
  );
}

/* ════════════════════ S13 — 데이터 사냥 (static) ════════════════════ */
const PORTALS = [
  { name: '공공데이터포털', url: 'https://www.data.go.kr', d: '전국 공공기관 데이터 · API' },
  { name: '서울 열린데이터광장', url: 'https://data.seoul.go.kr', d: '교통·환경·인구 — 도시 데이터' },
  { name: '학교알리미', url: 'https://www.schoolinfo.go.kr', d: '우리 학교·전국 학교 공시 정보' },
];
const SCHOOL_DATA = [
  { t: '급식 식단 · 잔반량', left: '4%', top: '6%', big: true },
  { t: '도서관 대출 이력', left: '52%', top: '14%', big: true },
  { t: '시간표 · 교실 이동', left: '8%', top: '40%' },
  { t: '매점 판매', left: '66%', top: '44%' },
  { t: '분실물', left: '40%', top: '36%' },
  { t: '결석 · 조퇴', left: '24%', top: '64%' },
  { t: '교실 온습도', left: '58%', top: '70%' },
  { t: '학교 주변 사고 지점', left: '3%', top: '84%' },
];
function HuntSlide() {
  return (
    <div style={{ width: 'min(1160px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 21.6px, 22px)' }}>
      <Reveal>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div className="kicker">1단계 · 데이터 사냥</div>
            <h2 className="headline" style={kw}>데이터셋 <span className="accent-text">3개</span>를 골라 온다</h2>
          </div>
          <Timer m="10:00" />
        </div>
      </Reveal>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.1fr)', gap: 'clamp(14px, 38.4px, 28px)', alignItems: 'stretch' }}>
        <Reveal>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PORTALS.map((p) => (
              <a key={p.url} href={p.url} target="_blank" rel="noopener" style={{
                ...card, display: 'flex', flexDirection: 'column', gap: 2, textDecoration: 'none', color: 'var(--fg)',
                borderColor: `color-mix(in srgb, ${C.emerald} 45%, transparent)`, padding: '12px 16px',
              }}>
                <span style={{ fontWeight: 800, fontSize: 'clamp(15px, 30.7px, 18px)', color: C.emerald, textDecoration: 'underline' }}>{p.name} ↗</span>
                <span style={{ fontSize: 13, color: 'var(--fg-muted)' }}>{p.d} · {p.url.replace('https://', '')}</span>
              </a>
            ))}
            <p style={{ fontSize: 13.5, color: 'var(--fg-muted)', lineHeight: 1.6, ...kw }}>
              활동지 1단계 칸에 <b style={{ color: 'var(--fg)' }}>데이터 이름 + 컬럼 3개</b>씩 적는다. 컬럼 이름 = 이 데이터가 '아는 것'.
            </p>
          </div>
        </Reveal>
        <Reveal>
          <div style={{ ...card, position: 'relative', minHeight: 'min(420px, 496.8px)', height: '100%', borderStyle: 'dashed', overflow: 'hidden', padding: 0 }}>
            <img src={IMG.school} alt="급식실·도서관·복도·매점·교실이 이어진 학교 단면도" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 78%', opacity: 0.9 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(6,17,13,0.55) 0%, rgba(6,17,13,0.05) 45%, rgba(6,17,13,0.35) 100%)' }} />
            <span style={{ ...mono, position: 'absolute', right: 14, top: 10, fontSize: 12, color: 'var(--fg)' }}>우리 학교가 이미 가진 데이터</span>
            {SCHOOL_DATA.map((s) => (
              <span key={s.t} style={{
                position: 'absolute', left: s.left, top: s.top, padding: s.big ? '10px 18px' : '6px 12px', borderRadius: 999,
                background: s.big ? `color-mix(in srgb, ${C.emerald} 28%, rgba(6,17,13,0.7))` : 'rgba(6,17,13,0.62)',
                border: `1px solid ${s.big ? C.emerald : 'var(--line)'}`, fontWeight: 800, backdropFilter: 'blur(4px)',
                fontSize: s.big ? 'clamp(16px, 36.5px, 22px)' : 'clamp(13px, 25px, 15px)', color: 'var(--fg)', whiteSpace: 'nowrap', textShadow: '0 1px 6px rgba(0,0,0,0.7)',
              }}>◎ {s.t}</span>
            ))}
          </div>
        </Reveal>
      </div>
      <Reveal>
        <p className="kicker" style={{ textAlign: 'center', color: C.coral }}>내용 말고, 컬럼 이름만 본다</p>
      </Reveal>
    </div>
  );
}

/* ════════════════════ S14 — 뒤집기 (빌드) ════════════════════ */
const FLIP_Q = ['심야에 사람이 어디 있나?', '행사 날 유동인구는?', '통신 장애가 잦은 지역은?', '관광객은 어디로 움직이나?', '상권이 붐비는 시간대는?'];
function FlipSlide() {
  const { clicks } = useDeck();
  const th: CSSProperties = { ...mono, fontSize: 12, color: 'var(--fg-muted)', padding: '8px 12px', borderBottom: '1px solid var(--line)', textAlign: 'left' };
  const td: CSSProperties = { padding: '10px 12px', borderBottom: '1px solid var(--line)', verticalAlign: 'top', fontSize: 'clamp(13px, 26.9px, 16px)', ...kw };
  return (
    <div style={{ width: 'min(1100px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 21.6px, 22px)', textAlign: 'center' }}>
      <Reveal>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', textAlign: 'left' }}>
          <div>
            <div className="kicker">2단계 · 뒤집기 <span style={{ color: C.coral }}>— 원래 목적 밖에서</span></div>
            <h2 className="headline" style={kw}>주력 데이터 하나를 골라 <span className="accent-text">두 칸</span>을 채운다</h2>
          </div>
          <Timer m="10:00" />
        </div>
      </Reveal>
      <Reveal>
        <table style={{ width: '100%', borderCollapse: 'collapse', ...card, padding: 0, overflow: 'hidden', display: 'table' }}>
          <thead>
            <tr>
              <th style={{ ...th, width: '18%' }}>데이터</th>
              <th style={{ ...th, width: '24%' }}>① 원래 누가 왜 모았나?</th>
              <th style={th}>② 그 목적 말고 답할 수 있는 질문 5개</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ background: `color-mix(in srgb, ${C.emerald} 7%, transparent)` }}>
              <td style={{ ...td, fontWeight: 800 }}>통화 기록 <span style={{ fontSize: 11, color: C.emerald }}>예시</span></td>
              <td style={{ ...td, opacity: clicks >= 1 ? 1 : 0.15, transition: 'opacity 0.5s' }}>KT · <b>요금 청구</b>하려고</td>
              <td style={{ ...td, opacity: clicks >= 2 ? 1 : 0.15, transition: 'opacity 0.5s' }}>
                <ol style={{ margin: 0, paddingLeft: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '2px 16px', textAlign: 'left' }}>
                  {FLIP_Q.map((q) => <li key={q}>{q}</li>)}
                </ol>
              </td>
            </tr>
            {[1].map((r) => (
              <tr key={r} style={{ opacity: clicks >= 3 ? 1 : 0, transition: `opacity 0.4s ${r * 0.12}s` }}>
                <td style={{ ...td, color: 'var(--fg-muted)' }}>내 주력 데이터</td>
                <td style={td}>&nbsp;</td>
                <td style={td}>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Reveal>
      <Build at={3}>
        <p className="lead" style={{ marginInline: 'auto', ...kw }}>
          <strong style={{ color: 'var(--fg)' }}>여러분 차례.</strong> 질문 세 개째에서 막히는 게 정상 — 네 번째 질문부터 진짜 아이디어가 나온다.
        </p>
      </Build>
    </div>
  );
}

/* ════════════════════ S15 — 두 데이터 잇기 (씬 · 2026-08-23 재설계) ══════════════
   메타포: 두 데이터 카드가 한 점에서 합류해 네 갈래로 갈라지고, 갈래마다 **다른 연산**이
   일어난다. 적대 검증 반영: 균등 카드 나열 폐기, 카드→렌즈 연결선 신설, 네 렌즈를
   서로 다른 픽토그램(합류·변형·시간축 연장·확산)으로 구분. */
const LENS_FILL = [
  '5교시 체육 뒤에 잔반이 느는가?',
  '메뉴별 잔반 순위표로 바꾼다',
  '내일 잔반량을 미리 계산한다',
  '급식실에 주간 리포트를 연다',
];
/* 합류점에서 갈라지는 네 갈래의 도착점 — 부채꼴이라 균등 나열이 아니다 */
const BRANCH = [
  { x: 700, y: 138 },
  { x: 872, y: 302 },
  { x: 872, y: 466 },
  { x: 700, y: 630 },
];
const JX = 430, JY = 384;
/* 렌즈마다 다른 연산을 그리는 픽토그램 */
function LensGlyph({ kind, color }: { kind: number; color: string }) {
  const p = { stroke: color, fill: 'none', strokeWidth: 3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (kind === 0) return (  /* 결합 — 두 줄기가 하나로 합류 */
    <g {...p}>
      <path d="M-30 -14 L-8 0 M-30 14 L-8 0 M-8 0 L20 0" />
      <path d="M26 0 l-11 -7 v14 z" fill={color} stroke="none" />
    </g>
  );
  if (kind === 1) return (  /* 변환 — 덩어리가 읽히는 표로 바뀐다 */
    <g {...p}>
      <rect x={-30} y={-13} width={24} height={26} rx={3} />
      <path d="M0 0 L12 0" />
      <path d="M18 0 l-8 -5 v10 z" fill={color} stroke="none" />
      <path d="M22 13 v-9 M30 13 v-17 M38 13 v-25" strokeWidth={4} />
    </g>
  );
  if (kind === 2) return (  /* 예측 — 아는 구간(실선)에서 모르는 앞(점선)으로 */
    <g {...p}>
      <path d="M-30 14 L-6 -1" />
      <path d="M-6 -1 L20 -17" strokeDasharray="6 6" />
      <path d="M26 -20 l-12 1 l6 9 z" fill={color} stroke="none" />
    </g>
  );
  return (                  /* 개방 — 가운데에서 밖으로 퍼진다 */
    <g {...p}>
      <circle cx={0} cy={0} r={8} />
      {[0, 72, 144, 216, 288].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return <path key={deg} d={`M${Math.cos(a) * 15} ${Math.sin(a) * 15} L${Math.cos(a) * 29} ${Math.sin(a) * 29}`} />;
      })}
    </g>
  );
}
function SlotScene() {
  const t = useSceneTime();
  const { clicks } = useDeck();
  const cardA = spring(t, 0.3, 0.9);
  const cardB = spring(t, 0.9, 0.9);
  const join = interpolate(t, [1.5, 2.4], [0, 1], easeInOut);   // 두 선이 합류점으로
  const fan = interpolate(t, [2.4, 3.6], [0, 1], easeInOut);    // 네 갈래로 갈라짐
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: 'clamp(30px, 64.8px, 60px) 96px 0', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div className="kicker" style={riseIn(t, 0.05)}>3단계 · 데이터 × 데이터</div>
          <h2 className="headline" style={{ margin: '10px 0 0', ...kw, ...riseIn(t, 0.2) }}>이 두 데이터를 <span className="accent-text">어떻게 이을까</span></h2>
        </div>
        <div style={riseIn(t, 0.4)}><Timer m="10:00" /></div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '46px' }}>
        <svg viewBox="0 0 1500 700" style={{ width: 'min(1560px, 100%)', height: 'auto', overflow: 'visible' }}>
          {/* ── 왼쪽: 두 데이터 카드 ── */}
          {[{ n: '급식 잔반량', sub: '카드 A · 주력 데이터', y: 284, p: cardA, c: C.emerald, dash: false },
            { n: '시간표', sub: '카드 B · 내가 고른다', y: 484, p: cardB, c: C.amber, dash: true }].map((cd) => (
            <g key={cd.n} opacity={Math.min(1, cd.p * 1.4)} transform={`translate(${-90 * (1 - cd.p)} 0)`}>
              <rect x={70} y={cd.y - 52} width={230} height={104} rx={14}
                fill={`color-mix(in srgb, ${cd.c} 16%, var(--surface))`} stroke={cd.c} strokeWidth={2.5}
                strokeDasharray={cd.dash ? '9 7' : undefined} />
              <text x={185} y={cd.y + 7} textAnchor="middle" fill="var(--fg)" style={{ font: '800 21px var(--font-body, sans-serif)' }}>{cd.n}</text>
              <text x={185} y={cd.y + 76} textAnchor="middle" fill={cd.c} style={{ font: '800 14px var(--font-body, sans-serif)' }}>{cd.sub}</text>
            </g>
          ))}
          {/* ── 두 줄기가 합류점으로 (카드 색을 그대로 들고 온다) ── */}
          <path d={`M300 284 C 360 284, 380 ${JY}, ${JX} ${JY}`} pathLength={1} fill="none" stroke={C.emerald} strokeWidth={4} strokeLinecap="round"
            style={{ strokeDasharray: 1, strokeDashoffset: 1 - join }} />
          <path d={`M300 484 C 360 484, 380 ${JY}, ${JX} ${JY}`} pathLength={1} fill="none" stroke={C.amber} strokeWidth={4} strokeLinecap="round"
            style={{ strokeDasharray: 1, strokeDashoffset: 1 - join }} />
          <circle cx={JX} cy={JY} r={13} fill="var(--bg)" stroke="var(--fg)" strokeWidth={3} opacity={join} />
          <text x={JX} y={JY + 46} textAnchor="middle" fill="var(--fg-muted)" opacity={join} style={{ font: '700 14px var(--font-body, sans-serif)' }}>두 데이터를 함께</text>

          {/* ── 네 갈래 — 갈래마다 다른 연산 ── */}
          {LENS.map((l, i) => {
            const b = BRANCH[i];
            const on = clicks >= i + 1;
            const seg = interpolate(fan, [i * 0.12, 0.6 + i * 0.12], [0, 1]);
            const tx = b.x + 56;
            return (
              <g key={l.key}>
                <path d={`M${JX + 13} ${JY} C ${JX + 130} ${JY}, ${b.x - 130} ${b.y}, ${b.x - 44} ${b.y}`} pathLength={1} fill="none"
                  stroke={l.color} strokeWidth={on ? 4 : 2.5} strokeLinecap="round" opacity={on ? 1 : 0.5}
                  style={{ strokeDasharray: 1, strokeDashoffset: 1 - seg, transition: 'stroke-width 0.4s, opacity 0.4s' }} />
                <g opacity={seg} transform={`translate(${b.x} ${b.y})`}>
                  <LensGlyph kind={i} color={l.color} />
                </g>
                <g opacity={seg}>
                  <text x={tx} y={b.y - 14} fill={l.color} style={{ font: '800 20px var(--font-body, sans-serif)' }}>{l.key}</text>
                  <text x={tx + 62} y={b.y - 14} fill="var(--fg-muted)" style={{ font: '500 14px var(--font-body, sans-serif)' }}>{l.q}</text>
                  <text x={tx} y={b.y + 18} fill="var(--fg)" opacity={on ? 1 : 0.18}
                    style={{ font: '800 20px var(--font-body, sans-serif)', transition: 'opacity 0.4s' }}>{LENS_FILL[i]}</text>
                </g>
              </g>
            );
          })}
          <text x={200} y={604} textAnchor="middle" fill="var(--fg-muted)" opacity={interpolate(t, [2, 2.6], [0, 1])} style={{ font: '500 14px var(--font-body, sans-serif)' }}>
            멀어 보이는 둘일수록 남이 못 본 연결이 나온다
          </text>
          <text x={200} y={628} textAnchor="middle" fill="var(--fg-muted)" opacity={interpolate(t, [2.1, 2.7], [0, 1])} style={{ font: '500 14px var(--font-body, sans-serif)' }}>
            올빼미버스도 전화기 × 택시였다
          </text>
          <text x={760} y={692} textAnchor="middle" fill="var(--fg-muted)" opacity={interpolate(t, [3.4, 4], [0, 1])} style={{ font: '600 17px var(--font-body, sans-serif)' }}>
            렌즈가 바뀌면 같은 두 데이터가 다른 서비스가 된다 — 네 가지를 그려 본 뒤 하나를 고른다
          </text>
        </svg>
      </div>
    </div>
  );
}

/* ════════════════════ S16 — 한 문장 기획서 (빌드) · S17 공용 슬롯 ════════════════════ */
const SLOTS = [
  { k: '누가', v: '야간자율학습 학생', c: C.emerald, tail: '이' },
  { k: '어떤 상황', v: '밤 9시 하교', c: C.emerald, tail: '에서 겪는' },
  { k: '문제', v: '버스 기다림', c: C.coral, tail: '을,' },
  { k: '데이터 A + B', v: '시간표 + 시내버스 도착 정보', c: C.cyan, tail: '를' },
  { k: '렌즈', v: '결합', c: C.amber, tail: '으로 써서' },
  { k: '무엇', v: '하교 시각 맞춤 버스 알림판', c: C.emerald, tail: '으로 해결한다.' },
];
function Slot({ s, filled, dim }: { s: (typeof SLOTS)[number]; filled: boolean; dim?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, margin: '0 4px 8px 0' }}>
      <span style={{
        display: 'inline-block', minWidth: filled ? 0 : '6.5em', padding: '2px 12px 4px', borderBottom: `3px solid ${s.c}`,
        color: filled ? 'var(--fg)' : s.c, fontWeight: 800, opacity: dim ? 0.3 : 1, transition: 'opacity 0.6s', ...kw,
      }}>
        {filled ? s.v : <span style={{ fontSize: '0.7em', fontWeight: 700 }}>[{s.k}]</span>}
      </span>
      <span style={{ color: 'var(--fg-muted)', fontWeight: 600, fontSize: '0.8em' }}>{s.tail}</span>
    </span>
  );
}
function PitchSlide() {
  const { clicks } = useDeck();
  const filled = clicks === 1;
  return (
    <div style={{ width: 'min(1120px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 28.1px, 30px)' }}>
      <Reveal>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div className="kicker">4단계 · 한 문장 기획서</div>
            <h2 className="headline" style={kw}>빈칸 <span className="accent-text">여섯 개</span>가 기획서 전부다</h2>
          </div>
          <div style={{ opacity: clicks >= 2 ? 1 : 0, transition: 'opacity 0.4s' }}><Timer m="10:00" /></div>
        </div>
      </Reveal>
      <Reveal>
        <div style={{ ...card, padding: 'clamp(22px, 57.6px, 40px)', fontSize: 'clamp(19px, 48px, 30px)', lineHeight: 1.9 }}>
          {SLOTS.map((s) => <Slot key={s.k} s={s} filled={filled} />)}
        </div>
      </Reveal>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <p style={{ color: 'var(--fg-muted)', fontSize: 14.5, ...kw, opacity: filled ? 1 : 0.0, transition: 'opacity 0.4s' }}>
          예시 — 더 쓰지 않는다. 여섯 칸이 채워지면 끝.
        </p>
        <Build at={3}>
          <span className="kicker" style={{ color: C.cyan, fontSize: 'clamp(13px, 28.8px, 17px)' }}>이 한 문장이 3차시 바이브코딩의 첫 프롬프트다</span>
        </Build>
      </div>
    </div>
  );
}

/* ════════════════════ S17 — 킬러 질문 (static) ════════════════════ */
const KILLER = [
  { n: 'ⓐ', slot: 2, q: '이 서비스가 없으면, 지금 사람들은 뭘 하고 있나?', d: '대체 행동이 충분히 편하면 아무도 안 쓴다', left: '2%', w: '28%', top: '54%' },
  { n: 'ⓑ', slot: 3, q: '그 데이터, 진짜로 존재하고 내가 접근할 수 있나?', d: 'API · 다운로드 · 학교 협조 — 셋 중 무엇으로? 여기서 가장 많이 죽는다', left: '33%', w: '36%', top: '50%' },
  { n: 'ⓒ', slot: 5, q: '한 번 쓰고 안 들어올 서비스는 아닌가?', d: '다시 올 이유가 있어야 한다', left: '72%', w: '26%', top: '58%' },
];
function KillerSlide() {
  return (
    <div style={{ width: 'min(1160px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 17.3px, 18px)' }}>
      <Reveal>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div className="kicker">5단계 · 자가 검증</div>
            <h2 className="headline" style={kw}>내 기획서를 죽이는 <span className="accent-text">질문 셋</span></h2>
          </div>
          <Timer m="05:00" />
        </div>
      </Reveal>
      <Reveal>
        <div style={{ position: 'relative', minHeight: 'min(420px, 561.6px)' }}>
          {/* 흐린 기획서 */}
          <div style={{ ...card, opacity: 0.55, fontSize: 'clamp(15px, 36.5px, 23px)', lineHeight: 1.9, padding: 'clamp(16px, 38.4px, 26px)' }}>
            {SLOTS.map((s, i) => (
              <span key={s.k} style={{ position: 'relative', display: 'inline-block' }}>
                <Slot s={s} filled />
                {KILLER.some((k) => k.slot === i) && (
                  <span style={{ position: 'absolute', left: '40%', top: -14, width: 18, height: 18, borderRadius: '50% 50% 50% 0', background: C.coral, transform: 'rotate(-45deg)', boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }} />
                )}
              </span>
            ))}
          </div>
          {/* 질문 카드 */}
          {KILLER.map((k) => (
            <div key={k.n} style={{
              position: 'absolute', left: k.left, width: k.w, top: k.top, ...card,
              borderColor: `color-mix(in srgb, ${C.coral} 55%, transparent)`, padding: '12px 16px',
              boxShadow: '0 18px 40px -24px rgba(0,0,0,0.6)',
            }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                <span style={{ color: C.coral, fontWeight: 900, fontSize: 20 }}>{k.n}</span>
                <span style={{ fontWeight: 800, fontSize: 'clamp(13px, 27.8px, 17px)', ...kw }}>{k.q}</span>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', marginTop: 4, ...kw }}>{k.d}</div>
            </div>
          ))}
        </div>
      </Reveal>
      <Reveal>
        <p style={{ textAlign: 'center', color: 'var(--fg-muted)', fontSize: 14.5, ...kw }}>
          하나라도 답이 안 나오면 기획서를 고친다. 특히 <b style={{ color: C.coral }}>ⓑ</b> — 데이터가 실제로 없으면 전부 무효다.
        </p>
      </Reveal>
    </div>
  );
}

/* ════════════════════ 덱 본체 ════════════════════ */
export default function InfoResearchDataValueDeck() {
  return (
    <Deck>
      {/* S1 표지 */}
      <Slide full nav="표지" notes="지난 시간에 '질문이 렌즈다'라고 했죠. 오늘은 그 렌즈를 네 개로 쪼개서 실제로 손에 쥐어 드릴 겁니다. 먼저 여러분이 어제 만든 데이터가 얼마짜리인지부터 볼까요.">
        <Fit>
          <Stage src={IMG.cover} scrim="linear-gradient(180deg, rgba(6,17,13,0.35) 0%, rgba(6,17,13,0.15) 40%, rgba(6,17,13,0.82) 100%)" />
          <div style={{ position: 'absolute', left: '6%', right: '6%', bottom: '12%', display: 'flex', flexDirection: 'column', gap: 'clamp(20px, 43.2px, 40px)' }}>
            <Reveal>
              <div className="kicker">정보과제연구 · 2026-2 · 2차시</div>
              <h1 className="display" style={{ marginTop: 12, ...kw }}>데이터의 <span className="accent-text">가치</span>와 활용</h1>
              <p className="lead" style={{ marginTop: 14, maxWidth: 640, ...kw }}>
                가진 데이터로 무엇을 할 것인가 — 값이 붙은 글 한 줄에서 나의 한 문장 기획서까지.
              </p>
            </Reveal>
            <Reveal><JourneyTrack lit={0} /></Reveal>
          </div>
        </Fit>
      </Slide>

      {/* S2 Reddit 무대 여행 */}
      <Slide full nav="글값" notes="여러분이 어제 커뮤니티에 쓴 한 줄, 누구 것일까요? (클릭 1) Reddit 사용자들은 공짜로 글을 썼는데, 그 글이 서버로 모여 누군가의 학습 데이터가 됩니다. (클릭 2) 그 글을 학습하는 권리가 연 6천만 달러에 팔렸습니다. 더 재미있는 건, 그 계약이 흔들린다는 소문만으로 회사 가치가 30억 달러 빠졌다는 겁니다. 회사 전체 매출의 3%나 되고, 광고 말고 버는 돈으로 따지면 40%가 넘습니다. 글 한 줄은 0원인데 모아 놓으니 이만큼이에요. (주가 하락은 시가총액 변화이지 현금이 빠져나간 게 아닙니다.) (2026-07 보도는 수업 전 재확인)">
        <Fit>
          <Scene freezeAt={9}><RedditScene /></Scene>
        </Fit>
      </Slide>

      {/* S3 라이브 1 */}
      <Slide full nav="라이브 · 얼마짜리" notes="전원 제출 대기 → 분포 공개 → '3번 고른 사람, 왜 그렇게 생각했어요?' 한 명 지목 → 다음 장 관통 문장으로.">
        <Fit>
          <Stage src={IMG.seoul} scrim="linear-gradient(180deg, rgba(6,17,13,0.72) 0%, rgba(6,17,13,0.84) 100%)" />
          <span style={{ position: 'absolute', right: '2%', bottom: '7.5%', fontSize: 11, color: 'var(--fg-muted)' }}>사진: Seoul Skyline Night 2018 · mauveine.kim · Wikimedia Commons · CC0</span>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 'clamp(14px, 25.9px, 26px)', padding: '64.8px 115.2px 108px' }}>
          <div className="kicker" style={{ color: C.cyan }}>체크포인트 · 실시간 투표</div>
          <h2 className="headline" style={{ marginInline: 'auto', maxWidth: 900, ...kw }}>어제 하루 내가 남긴 데이터는 누구 것이고, <span className="accent-text">얼마짜리</span>일까?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(400px, 100%), 1fr))', gap: 12, width: 'min(980px, 100%)', marginInline: 'auto', marginTop: 8 }}>
            {['0원 — 그냥 사라진다', '몇십 원 — 광고 한 번 값', '값을 매길 수 없다 — 모이면 다른 것이 된다', '내 것이니까 내가 값을 정한다'].map((o, i) => (
              <div key={o} style={{ ...card, textAlign: 'left', display: 'flex', gap: 10, alignItems: 'baseline', fontWeight: 700, ...kw }}>
                <span style={{ ...mono, color: C.emerald }}>{i + 1}</span>{o}
              </div>
            ))}
          </div>
          <p style={{ color: 'var(--fg-muted)', fontSize: 14, marginInline: 'auto', ...kw }}>정답은 없다 — 검색·영상·메시지·위치, 어제 남긴 것 전부를 떠올리고 고른다.</p>
          </div>
        </Fit>
      </Slide>

      {/* S4 관통 문장 */}
      <Slide full nav="관통 문장" notes="모델은 이제 한 줄로 빌려 씁니다. 데이터는 가진 사람이 정해져 있고요. 그런데 데이터를 갖고 있어도 그걸로 뭘 할지 모르면 서버비만 나갑니다. 이 빈 의자가 여러분 자리입니다.">
        <Fit>
          <ThesisSlide />
        </Fit>
      </Slide>

      {/* S5 올빼미버스 씬 */}
      <Slide full nav="올빼미버스" notes="심야에 버스를 어디로 보낼까? 서울시는 버스 회사에 묻지 않았습니다. 밤에 통화한 사람이 어디 있었는지 30억 건, 택시가 어디서 태우고 내렸는지 500만 건 — 서로 다른 목적으로 모은 두 장입니다. (클릭 1) 지도 위에 겹쳤어요. 두 장을 겹치니까 밤에 사람이 있는 곳이 보였고, (클릭 2) 남부순환로·동일로로 가려던 N61번이 효령로·능동로로 옮겨졌습니다. 출처: 서울솔루션.">
        <Fit>
          <Scene freezeAt={7}><SeoulScene /></Scene>
          <Build at={1}><span /></Build>
          <Build at={2}><span /></Build>
        </Fit>
      </Slide>

      {/* S6 용도 전환 */}
      <Slide full nav="용도 밖" notes="여기서 핵심 하나. 통화 기록은 버스 노선 만들라고 모은 게 아니에요. 요금 청구하려고 모은 겁니다. 데이터는 '모은 이유' 밖에서 훨씬 큰 값을 냅니다. 이게 오늘 활동에서 여러분이 할 '뒤집기'입니다.">
        <Fit>
          <Stage src={IMG.nightbus} scrim="linear-gradient(90deg, rgba(6,17,13,0.96) 0%, rgba(6,17,13,0.9) 48%, rgba(6,17,13,0.2) 100%)" />
          <div style={{ position: 'absolute', left: '5%', top: '50%', transform: 'translateY(-50%)', width: 'min(720px, 56%)' }}>
            <RepurposeSlide />
          </div>
          <Build at={1}><span /></Build>
        </Fit>
      </Slide>

      {/* S7 변환 */}
      <Slide full nav="변환" notes="이 세 회사가 한 일은 데이터 수집이 아닙니다. 이미 공개돼 있지만 아무도 못 읽던 걸 한곳에 모아서 사람 말로 바꿨어요. 실거래가 API 응답 보이죠? 이걸 '8.5억, 3개월 전보다 올랐음'으로 바꾸는 게 서비스입니다. (화면의 JSON은 실제 XML 응답을 읽기 쉽게 줄인 것)">
        <Fit><Center>
          <TranslateSlide />
        </Center></Fit>
      </Slide>

      {/* S8 표준주소실록 */}
      <Slide full nav="표준주소실록" notes="이건 직방이 아니라 어느 동네 한 곳의 시설 데이터로 만든 사이트입니다. 하는 일은 똑같아요 — 흩어진 데이터를 한 화면으로. 이 정도 크기는 여러분이 이번 학기에 만들 수 있습니다. 3차시에 실제로 시작합니다.">
        <Fit>
          <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', alignItems: 'center', gap: 48, padding: '64px 0 64px 88px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Reveal>
                <div className="kicker">여러분 손에 닿는 스케일</div>
                <h2 className="headline" style={kw}>시설관리 대시보드 · <span className="accent-text">표준주소실록</span></h2>
              </Reveal>
              <Reveal>
                <LensTag idx={1} style={{ alignSelf: 'flex-start' }} />
              </Reveal>
              <Reveal>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    '한 지역구의 공공 시설 데이터를 지도·표 대시보드로 한눈에',
                    '호갱노노와 같은 계열 — 규모만 다르다',
                    '2교시에 쓸 한 문장 기획서의 실물 예시 · 3차시 바이브코딩의 목표 크기',
                  ].map((t) => (
                    <div key={t} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <span style={{ flex: 'none', width: 8, height: 8, borderRadius: 4, background: C.emerald, marginTop: 9 }} />
                      <p style={{ color: 'var(--fg-muted)', fontSize: 16, lineHeight: 1.6, ...kw }}>{t}</p>
                    </div>
                  ))}
                </div>
              </Reveal>
              <Reveal><div><LinkBtn href={GJDONG}>gjdong.vercel.app/facility 열기</LinkBtn></div></Reveal>
            </div>
            <Reveal>
              <a href={GJDONG} target="_blank" rel="noopener" style={{ display: 'block', height: '100%', padding: '24px 40px 24px 0' }}>
                <BrowserFrame url="gjdong.vercel.app/facility">
                  <img src={`${BASE}/images/gjdong-facility.png`} alt="표준주소실록 시설관리 대시보드 화면" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
                </BrowserFrame>
              </a>
            </Reveal>
          </div>
        </Fit>
      </Slide>

      {/* S9 AlphaFold 씬 */}
      <Slide full nav="AlphaFold" notes="단백질 구조 하나 푸는 데 실험으로는 몇 달에서 몇 년이 걸립니다. 50년 동안 인류가 푼 게 20만 개쯤이에요. 딥마인드는 그걸 학습시켜 2억 개를 예측했고, (클릭) 팔지 않고 풀었습니다. 데이터로 데이터를 만들어 세상에 푼 거예요. 노벨상은 덤이고요.">
        <Fit>
          <Scene freezeAt={7}><AlphaFoldScene /></Scene>
          <Build at={1}><span /></Build>
        </Fit>
      </Slide>

      {/* S10 네 렌즈 */}
      <Slide full nav="네 렌즈" notes="네 사례를 네 개 질문으로 줄이면 이렇습니다. 급식 잔반량 데이터 하나에 네 렌즈를 다 대 보세요. 질문이 네 개 나옵니다. 다음 시간에 여러분 데이터로 이걸 합니다.">
        <Fit><Center>
          <LensSlide />
        </Center></Fit>
      </Slide>

      {/* S11 라이브 2 */}
      <Slide full nav="라이브 · 어떤 렌즈" notes="분포 공개 → 정답(예측) → '결합 고른 사람, 어떤 데이터랑 붙인 거예요?' → 정답 외 선택은 틀린 게 아니라 '다른 서비스'임을 짚고 1교시 마무리. 다음 시간엔 여러분이 데이터를 들고 옵니다.">
        <Fit><Center center>
          <div className="kicker" style={{ color: C.cyan }}>체크포인트 · 실시간 퀴즈</div>
          <h2 className="headline" style={{ marginInline: 'auto', maxWidth: 940, ...kw }}>
            도서관 대출 기록으로 <span className="accent-text">"이 책 빌린 사람이 다음에 빌릴 책"</span>을 추천했다. 어떤 렌즈일까?
          </h2>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
            {LENS.map((l) => (
              <div key={l.key} style={{ ...card, minWidth: 150, borderColor: `color-mix(in srgb, ${l.color} 50%, transparent)`, fontWeight: 800, fontSize: 'clamp(16px, 34.6px, 20px)', color: l.color }}>{l.key}</div>
            ))}
          </div>
          <p style={{ color: 'var(--fg-muted)', fontSize: 14, marginInline: 'auto', maxWidth: 760, ...kw }}>같은 데이터라도 렌즈가 바뀌면 서비스가 바뀐다 — 시간표와 붙이면 결합, 결과를 학교 API로 열면 개방.</p>
        </Center></Fit>
      </Slide>

      {/* S12 역주행 레일 씬 */}
      <Slide full nav="거꾸로" notes="아이디어 회의 하면 보통 뭐부터 해요? '뭐 만들까?' — 그러면 다 앱 만들기로 끝납니다. 오늘은 반대로 갑니다. 데이터부터 고르고, 그 데이터가 뭘 답할 수 있는지 묻고, 그 다음에 서비스입니다. (클릭) 오늘은 아래 레일만.">
        <Fit>
          <Scene freezeAt={7}><RailScene /></Scene>
          <Build at={1}><span /></Build>
        </Fit>
      </Slide>

      {/* S13 데이터 사냥 */}
      <Slide full nav="1단계 사냥" notes="10분. 한 사람당 3개. 데이터를 열어서 읽지 마세요 — 컬럼 이름만 보면 됩니다. 컬럼 이름이 곧 '이 데이터가 아는 것'이에요. 학교 데이터를 고르는 사람은 제가 컬럼 이름을 말해 줄게요.">
        <Fit><Center>
          <HuntSlide />
        </Center></Fit>
      </Slide>

      {/* S14 뒤집기 */}
      <Slide full nav="2단계 뒤집기" notes="1단계에서 고른 셋 중 주력 데이터 하나를 골라 두 칸. 누가 왜 모았는지, 그리고 그 목적 말고 뭘 답할 수 있는지 다섯 개. 세 개에서 막히는 게 정상이에요. 네 번째부터 진짜 아이디어가 나옵니다.">
        <Fit><Center>
          <FlipSlide />
          <Build at={1}><span /></Build>
          <Build at={2}><span /></Build>
        </Center></Fit>
      </Slide>

      {/* S15 카드 슬롯 씬 */}
      <Slide full nav="3단계 렌즈" notes="이제 여러분 손에 데이터가 두 개 있습니다. 카드 A는 2단계에서 고른 주력 데이터고, 카드 B는 1단계에서 사냥한 것 중 여러분이 고른 겁니다. 이 둘을 어떻게 이을지가 오늘의 고민이에요. 렌즈 넷이 각각 다른 연결을 만들어 줍니다. (클릭 1~4) 네 가지를 다 그려 보고, 다음 단계에서 그중 하나를 고릅니다.">
        <Fit>
          <Scene freezeAt={5}><SlotScene /></Scene>
          {[1, 2, 3, 4].map((n) => <Build key={n} at={n}><span /></Build>)}
        </Fit>
      </Slide>

      {/* S16 한 문장 기획서 */}
      <Slide full nav="4단계 기획서" notes="(클릭 1) 예시. (클릭 2) 기획서는 이 한 문장입니다. 여섯 칸. 더 쓰지 마세요. (클릭 3) 다음 시간에 이 문장을 그대로 AI한테 넣어서 만들기 시작합니다.">
        <Fit><Center>
          <PitchSlide />
          <Build at={1}><span /></Build>
          <Build at={2}><span /></Build>
        </Center></Fit>
      </Slide>

      {/* S17 킬러 질문 */}
      <Slide full nav="5단계 검증" notes="세 질문 중 하나라도 답이 안 나오면 기획서를 고치세요. 특히 ⓑ — 데이터가 실제로 없으면 전부 무효입니다. 그래서 1단계에서 진짜 데이터부터 고른 거예요.">
        <Fit><Center>
          <KillerSlide />
        </Center></Fit>
      </Slide>

      {/* S18 마무리 */}
      <Slide full nav="마무리" notes="처음 문장으로 돌아옵니다. 모델은 빌리면 되고, 데이터는 여러분이 오늘 골랐고, 그걸로 뭘 할지는 여러분이 한 문장으로 정했습니다. 다음 시간에 그 문장으로 만들기 시작합니다. 숙제는 하나 — 그 데이터에 진짜로 접근할 수 있는지 경로를 찾아오세요.">
        <Fit><Center>
          <div style={{ width: 'min(1160px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(22px, 43.2px, 44px)' }}>
            <Reveal>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 24, alignItems: 'end' }}>
                <div>
                  <div className="kicker">다음 시간, 이 문장으로 시작한다</div>
                  <h2 className="display" style={{ marginTop: 12, fontSize: 'clamp(26px, 73px, 50px)', ...kw }}>
                    희소한 건 모델이 아니라 <span className="accent-text">데이터</span>,<br />그리고 그 데이터로 뭘 할지 <span style={{ color: C.cyan }}>정하는 사람</span>이다.
                  </h2>
                </div>
                <div style={{ position: 'relative', width: 'min(130px, 268.8px)' }}>
                  <img src="assets/svg/empty-chair.svg" alt="" style={{ width: '100%', display: 'block' }} />
                  <span style={{ position: 'absolute', right: -6, top: -6, width: 34, height: 34, borderRadius: '50%', background: C.emerald, color: 'var(--accent-ink)', display: 'grid', placeItems: 'center', fontWeight: 900 }}>✓</span>
                </div>
              </div>
            </Reveal>
            <Reveal><JourneyTrack lit={6} /></Reveal>
            <Reveal>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <img src={`${BASE}/images/activity-qr.png`} alt="활동지 QR" style={{ width: 96, borderRadius: 10, background: '#fff' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <LinkBtn href={ACTIVITY_URL}>활동지 제출 · 1~5단계</LinkBtn>
                    <p style={{ color: 'var(--fg-muted)', fontSize: 14.5, ...kw }}>
                      마감: 수업 종료 5분 전 · 각자 제출 · <b style={{ color: 'var(--fg)' }}>과제</b> — 킬러 질문 ⓑ의 데이터 접근 경로를 채워 온다.
                    </p>
                  </div>
                </div>
                <span style={{ ...mono, fontWeight: 800, color: C.cyan, border: `1.5px solid ${C.cyan}`, borderRadius: 999, padding: '8px 16px' }}>3차시 · 바이브코딩 — 이 문장이 첫 프롬프트</span>
              </div>
            </Reveal>
          </div>
        </Center></Fit>
      </Slide>
    </Deck>
  );
}

/* ════════════════════ S4 — 관통 문장 (빌드 · 취소선 → 데이터 → 빈 의자) ════════════════════ */
function ThesisSlide() {
  const { clicks } = useDeck();
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Stage src={IMG.chair} scrim={`linear-gradient(90deg, rgba(6,17,13,0.94) 0%, rgba(6,17,13,0.82) 42%, rgba(6,17,13,${clicks >= 3 ? 0.1 : 0.75}) 100%)`} />
      <div style={{ position: 'absolute', left: '6%', top: '50%', transform: 'translateY(-50%)', width: 'min(760px, 58%)' }}>
        <Reveal><div className="kicker">이 수업을 관통하는 한 문장</div></Reveal>
        <h2 className="display" style={{ marginTop: 14, fontSize: 'clamp(28px, 84.5px, 58px)', lineHeight: 1.25, ...kw }}>
          <span style={{ display: 'block', opacity: clicks >= 1 ? 1 : 0.12, transition: 'opacity 0.5s' }}>
            AI 시대에 희소한 건{' '}
            <span style={{ position: 'relative', display: 'inline-block', color: clicks >= 2 ? 'var(--fg-muted)' : 'var(--fg)', transition: 'color 0.5s' }}>
              모델
              <span style={{ position: 'absolute', left: 0, right: 0, top: '52%', height: 5, background: C.coral, transform: `scaleX(${clicks >= 2 ? 1 : 0})`, transformOrigin: 'left', transition: 'transform 0.5s' }} />
            </span>
            이 아니라
          </span>
          <span style={{ display: 'block', opacity: clicks >= 2 ? 1 : 0.12, transition: 'opacity 0.5s' }}>
            <span className="accent-text" style={{ fontSize: '1.25em' }}>데이터</span>,
          </span>
          <span style={{ display: 'block', opacity: clicks >= 3 ? 1 : 0.12, transition: 'opacity 0.5s' }}>
            그리고 그 데이터로 뭘 할지 <span style={{ color: C.cyan }}>정하는 사람</span>이다.
          </span>
        </h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 22 }}>
          {[
            { at: 1, t: '모델은 누구나 빌려 쓴다 — API 한 줄' },
            { at: 2, t: '데이터는 가진 쪽이 정해져 있다' },
            { at: 3, t: '무엇을 할지 정하는 사람이 가장 드물다 — 이 수업이 기르는 역량' },
          ].map((x) => (
            <span key={x.at} style={{ fontSize: 'clamp(12px, 25px, 14.5px)', color: 'var(--fg-muted)', border: '1px solid var(--line)', borderRadius: 999, padding: '6px 12px', opacity: clicks >= x.at ? 1 : 0, transition: 'opacity 0.5s', ...kw }}>{x.t}</span>
          ))}
        </div>
      </div>
      <div style={{ position: 'absolute', right: '6%', bottom: '12%', ...mono, fontSize: 'clamp(13px, 26.9px, 16px)', color: C.emerald, opacity: clicks >= 3 ? 1 : 0, transition: 'opacity 0.7s 0.3s', textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}>그 자리는 비어 있다</div>
      <Build at={1}><span /></Build>
      <Build at={2}><span /></Build>
      <Build at={3}><span /></Build>
    </div>
  );
}
