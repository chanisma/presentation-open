import { type CSSProperties, type ReactNode } from 'react';
import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import Build from '../../../../src/deck/Build';
import Reveal from '../../../../src/deck/Reveal';
import Cover from '../../../../src/components/Cover';
import KenBurns from '../../../../src/components/KenBurns';
import {
  Scene,
  useSceneTime,
  interpolate,
  spring,
  riseIn,
  easeInOut,
} from '../../../../src/scene';
import {
  Pointer,
  AppWindow,
  clickFlash,
  typed,
  typedDoneAt,
  Caret,
  popIn,
} from '../../../../src/walkthrough';
import {
  Paper,
  WashReveal,
  WashText,
  ColorWash,
  PAPER,
} from '../../../../src/watercolor';

/* ── AI로 만드는 60초의 세계 · 창의적 체험활동 · 오리엔테이션 (13장) ──────
   plan: data/2026-2/AI쇼츠제작/오리엔테이션/plan.md
   아크: 타이틀 → 후킹 → 사례 오마주/상상 → 스타일 모음 → 원리(안개 씬)
        → AI 입력 재료 → 프롬프트 5요소(삽화) → 프롬프트 비교 → 실전 시연
        (walkthrough) → 활동 3종(필름스트립) → 기대 학생상+일정 → 클로징(수채화)
   whiteboard는 미완성 기능이라 옵트인 게이트로 제외(2026-08-27 사용자 요청) —
   원래 계획된 프롬프트 5요소 판서 슬라이드는 image form(삽화)으로 대체. */

const BASE = 'data/2026-2/AI쇼츠제작/오리엔테이션';
const IMG = `${BASE}/images`;

const C = {
  blue: '#38bdf8',
  violet: '#8b7cf6',
  coral: '#fb7185',
  amber: '#fbbf24',
  green: '#4ade80',
  pink: '#f472b6',
};

const kw: CSSProperties = { wordBreak: 'keep-all' };

const card: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--hair)',
  borderRadius: 18,
  padding: 'clamp(16px, 2vw, 26px)',
};

/* 포스터 예시 프롬프트를 다섯 조각으로 — Slide 8(삽화) · Slide 9(비교)가 공유 */
const PROMPT_TEXT =
  '심해 위를 걷는 소년, 빛나는 도시, 잔잔한 물결, 시네마틱, 감성적인 분위기';
const FRAG = [
  { key: '주체', frag: '소년', color: C.blue },
  { key: '행동', frag: '심해 위를 걷는', color: C.green },
  { key: '배경', frag: '빛나는 도시, 잔잔한 물결', color: C.amber },
  { key: '카메라', frag: '시네마틱', color: C.violet },
  { key: '스타일', frag: '감성적인 분위기', color: C.pink },
];

/* ── 공용: 풀블리드 이미지 위 캡션(KenBurns + 스크림 + 하단 텍스트) ──
   Slide 3·4·8·11이 공유 — 하단 25%는 원본 생성 이미지에서 이미 비워
   두었으므로 여기서는 스크림 위에 텍스트만 얹는다. */
function ImageBeat({
  src,
  alt,
  flip,
  kicker,
  title,
  freezeAt = 9,
  children,
}: {
  src: string;
  alt: string;
  flip?: boolean;
  kicker: string;
  title: ReactNode;
  freezeAt?: number;
  children?: ReactNode;
}) {
  return (
    <Scene freezeAt={freezeAt}>
      <KenBurns src={src} alt={alt} flip={flip} />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to top, rgba(8,9,20,0.94) 0%, rgba(8,9,20,0.58) 32%, transparent 62%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 'clamp(24px, 6vw, 84px)',
          right: 'clamp(24px, 6vw, 84px)',
          bottom: 'clamp(30px, 7vh, 68px)',
          textShadow: '0 1px 16px rgba(4,5,12,0.9)',
        }}
      >
        <div className="kicker" style={{ color: '#c9c2ff' }}>
          {kicker}
        </div>
        <h2 className="headline" style={{ margin: '10px 0 12px', ...kw }}>
          {title}
        </h2>
        {children}
      </div>
    </Scene>
  );
}

/* ── Slide 2 — 후킹 질문 카드 ────────────────────────────────────────── */
function HookCard({ q, color }: { q: string; color: string }) {
  return (
    <div
      style={{
        ...card,
        flex: '1 1 min(280px, 100%)',
        borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
        textAlign: 'left',
      }}
    >
      <span style={{ color, fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 20 }}>?</span>
      <p style={{ marginTop: 8, fontSize: 'clamp(15px, 1.7vw, 18px)', fontWeight: 700, lineHeight: 1.5, ...kw }}>
        {q}
      </p>
    </div>
  );
}

/* ── Slide 5 — 스타일 4칸 그리드 ──────────────────────────────────────── */
const STYLES = [
  { label: '다큐멘터리풍', d: '현장을 그대로 옮긴 듯한 담담한 시선', color: C.blue },
  { label: '애니메이션풍', d: '선과 색이 살아 움직이는 그림체', color: C.violet },
  { label: '초현실풍', d: '현실에 없는 장면을 그대로 구현', color: C.pink },
  { label: '브이로그풍', d: '손에 든 카메라 같은 생생한 시점', color: C.amber },
];

/* ── Slide 6 — 원리 씬: 안개(노이즈) 속에서 장면이 드러난다 ──────────────
   metaphor: 안개 속에서 서서히 드러나는 사진 현상
   scene-grammar 준수: 인물 실루엣 대신 스카이라인·물결(비-figural 도형)로
   "장면이 노이즈에서 또렷해진다"를 표현 — 인물 SVG 실루엣(졸라맨 위험)을
   피하기 위한 의도적 선택. 모든 모션은 t의 순수 함수, feTurbulence seed 고정. */
function NoiseRevealScene() {
  const t = useSceneTime();
  const NOISE_END = 2.4;
  const CHIP_IN = 2.0;
  const FILM_START = 3.6;
  const FILM_END = 4.6;
  const CAPTION_IN = 4.3;

  const noiseOp = interpolate(t, [0.2, NOISE_END], [0.95, 0], easeInOut);
  const filmSpread = interpolate(t, [FILM_START, FILM_END], [0, 1], easeInOut);

  const MiniScene = ({ x, y, w, h }: { x: number; y: number; w: number; h: number }) => (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={h} rx={6} fill="#0d1230" />
      {[0.62, 0.78, 0.7, 0.9].map((hf, i) => (
        <rect key={i} x={w * (0.1 + i * 0.22)} y={h * (1 - hf * 0.55)} width={w * 0.14} height={h * hf * 0.55}
          fill={i % 2 ? C.violet : C.blue} opacity={0.85} />
      ))}
      <rect x={0} y={h * 0.78} width={w} height={h * 0.22} fill="#1a2050" opacity={0.9} />
      <circle cx={w * 0.8} cy={h * 0.25} r={w * 0.05} fill={C.amber} opacity={0.9} />
    </g>
  );

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', paddingTop: 'clamp(34px, 7vh, 74px)' }}>
        <div className="kicker" style={riseIn(t, 0.1)}>영상은 어떻게 만들어질까</div>
        <h2 className="display" style={{ margin: '12px auto 0', ...kw, ...riseIn(t, 0.3) }}>
          안개 속에서 <span className="accent-text">장면이 드러난다</span>
        </h2>
        <p className="lead" style={{ marginInline: 'auto', marginTop: 10, ...kw, ...riseIn(t, 0.55) }}>
          생성형 영상 AI는 뿌연 노이즈에서 장면을 조금씩 또렷하게 만들어 간다.
        </p>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '4vh' }}>
        <svg viewBox="0 0 1200 620" style={{ width: 'min(1080px, 92vw)', height: 'auto', overflow: 'visible' }}>
          <defs>
            <filter id="s6-noise" x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={3} seed={7} result="n" />
              <feColorMatrix in="n" type="matrix"
                values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.9 0" />
            </filter>
            <clipPath id="s6-frame">
              <rect x={300} y={40} width={600} height={340} rx={20} />
            </clipPath>
          </defs>

          {/* 프레임 테두리 — "영상 프레임"의 메타포를 이어받는다(슬라이드 1의 포탈 모티프) */}
          <rect x={300} y={40} width={600} height={340} rx={20} fill="#0a0e22" stroke="var(--hair)" strokeWidth={2} />

          {/* 아래 = 이미 또렷한 장면(스카이라인·물결·빛) */}
          <g clipPath="url(#s6-frame)">
            <rect x={300} y={40} width={600} height={340} fill="#0a0e22" />
            {[0.55, 0.72, 0.5, 0.85, 0.62, 0.4].map((hf, i) => (
              <rect key={i} x={330 + i * 90} y={40 + 340 - hf * 190} width={62} height={hf * 190}
                fill={i % 2 ? C.violet : C.blue} opacity={0.8} />
            ))}
            <rect x={300} y={40 + 340 * 0.74} width={600} height={340 * 0.26} fill="#141a3d" />
            {[0, 1, 2].map((i) => (
              <path key={i} d={`M 300 ${40 + 340 * (0.8 + i * 0.06)} q 40 -10 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0`}
                fill="none" stroke={C.blue} strokeWidth={1.4} opacity={0.35} />
            ))}
            <circle cx={760} cy={130} r={14} fill={C.amber} opacity={0.85} />
          </g>

          {/* 위 = 노이즈(t가 흐르며 걷힌다) */}
          <rect x={300} y={40} width={600} height={340} rx={20} filter="url(#s6-noise)" opacity={noiseOp} clipPath="url(#s6-frame)" />

          {/* 프롬프트 칩 — "이걸 참고해요" */}
          <g style={riseIn(t, CHIP_IN, 0.7, 20) as CSSProperties} transform="translate(600 445)">
            <rect x={-330} y={-24} width={660} height={52} rx={26} fill="var(--surface)" stroke={C.violet} strokeWidth={1.5} />
            <text x={0} y={7} textAnchor="middle" fill="var(--fg)"
              style={{ font: '600 17px var(--font-body, sans-serif)' }}>
              “{PROMPT_TEXT}”
            </text>
          </g>
          <text x={600} y={410} textAnchor="middle" fill={C.violet}
            style={{ font: '700 14px var(--font-mono, monospace)' }}
            opacity={interpolate(t, [CHIP_IN, CHIP_IN + 0.4], [0, 1])}>
            이 문장을 참고해요
          </text>

          {/* 필름스트립 — 프레임이 여러 장으로 펼쳐진다 = 영상은 프레임의 연속 */}
          {[-2, -1, 0, 1, 2].map((slot) => {
            const spread = 150 * slot * filmSpread;
            const op = filmSpread > 0.05 ? Math.min(1, filmSpread * 1.4) : 0;
            return (
              <g key={slot} transform={`translate(${600 + spread - 55} ${540 - filmSpread * 10}) scale(${0.42 - Math.abs(slot) * 0.03})`}
                opacity={op}>
                <rect x={-6} y={-6} width={122} height={82} rx={6} fill="none" stroke="var(--hair)" strokeWidth={2} />
                {[0, 1, 2, 3].map((h) => (
                  <rect key={'t' + h} x={-6 + h * 30 + 8} y={-14} width={12} height={8} rx={2} fill="var(--hair)" />
                ))}
                {[0, 1, 2, 3].map((h) => (
                  <rect key={'b' + h} x={-6 + h * 30 + 8} y={62} width={12} height={8} rx={2} fill="var(--hair)" />
                ))}
                <MiniScene x={0} y={0} w={110} h={70} />
              </g>
            );
          })}

          <text x={600} y={598} textAnchor="middle" fill="var(--fg-muted)"
            style={{ font: '600 17px var(--font-body, sans-serif)' }}
            opacity={interpolate(t, [CAPTION_IN, CAPTION_IN + 0.5], [0, 1])}>
            영상 = 프레임의 연속
          </text>
        </svg>
      </div>
    </div>
  );
}

/* ── Slide 7 — AI 입력 재료 파이프라인 ──────────────────────────────────── */
function PipeNode({ label, sub, lit }: { label: string; sub?: string; lit?: boolean }) {
  return (
    <div
      style={{
        ...card,
        minWidth: 'min(190px, 40vw)',
        textAlign: 'center',
        borderColor: lit ? `color-mix(in srgb, ${C.violet} 55%, transparent)` : 'var(--hair)',
        boxShadow: lit ? `0 0 30px color-mix(in srgb, ${C.violet} 22%, transparent)` : 'none',
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 'clamp(14px,1.6vw,17px)', ...kw }}>{label}</div>
      {sub && <div style={{ color: 'var(--fg-muted)', fontSize: 13, marginTop: 4, ...kw }}>{sub}</div>}
    </div>
  );
}
const Arrow = () => (
  <span style={{ color: 'var(--fg-faint)', fontSize: 22, flex: 'none' }}>→</span>
);

/* ── Slide 9 — 프롬프트 비교 카드 ───────────────────────────────────────── */
function PromptCard({ title, tone, children }: { title: string; tone: string; children: ReactNode }) {
  return (
    <div style={{ ...card, flex: '1 1 min(340px, 100%)', borderColor: `color-mix(in srgb, ${tone} 45%, transparent)`, textAlign: 'left' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 12.5, color: tone, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

/* ── Slide 10 — 실전 시연(walkthrough): 가상 서비스 "메이크쇼츠" ─────────
   창 1개, 상태 전환(입력 → 생성 중 → 결과)으로 진행. 실제 서비스 상표를
   쓰지 않는다(가상 브랜드 · .example 도메인). 모든 모션은 t의 순수 함수,
   포인터·타이핑·창은 같은 시각표를 공유. */
function GenerateWalkthrough() {
  const t = useSceneTime();
  const CLICK_INPUT = 0.9;
  const TYPE_AT = 1.3;
  const CPS = 13;
  const TYPE_DONE = typedDoneAt(PROMPT_TEXT, TYPE_AT, CPS);
  const CLICK_GEN = TYPE_DONE + 0.6;
  const GEN_END = CLICK_GEN + 2.8;
  const RESULT_IN = GEN_END + 0.3;
  const CLICK_PLAY = RESULT_IN + 1.0;
  const DONE = CLICK_PLAY + 0.4;

  const phase: 'input' | 'generating' | 'result' = t < CLICK_GEN ? 'input' : t < RESULT_IN ? 'generating' : 'result';
  const typedText = typed(t, PROMPT_TEXT, TYPE_AT, CPS);
  const showCaret = phase === 'input' && t >= TYPE_AT - 0.1 && t < TYPE_DONE + 0.35;

  const genButton: CSSProperties = {
    marginLeft: 'auto',
    padding: '10px 22px',
    borderRadius: 10,
    fontWeight: 800,
    fontSize: 'clamp(12.5px,1.4vw,14.5px)',
    background: C.violet,
    color: '#0a0e1f',
    boxShadow: `0 0 0 ${clickFlash(t, CLICK_GEN) * 9}px color-mix(in srgb, ${C.violet} 35%, transparent)`,
  };

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', left: '6%', top: '5.5%', width: '58%', textAlign: 'left' }}>
        <div className="kicker">직접 만들어보면 이런 순서예요</div>
        <h2 className="headline" style={{ margin: '4px 0 6px', ...kw }}>
          프롬프트 한 줄, <span className="accent-text">버튼 하나</span>
        </h2>
        <p style={{ margin: 0, color: 'var(--fg-muted)', fontSize: 'clamp(13px,1.5vw,15px)', ...kw }}>
          다음 시간부터는 여러분이 직접 실제 서비스로 해 봅니다.
        </p>
      </div>

      <AppWindow
        kind="browser"
        url="makeshorts.example"
        style={{ left: '22%', top: '20%', width: '56%', height: '66%', ...popIn(t, 0.2) }}
        bodyStyle={{ display: 'flex', flexDirection: 'column', padding: 'clamp(16px,2.2vw,28px)', gap: 14 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 26, height: 26, borderRadius: 8, background: C.violet,
            display: 'grid', placeItems: 'center', flex: 'none',
          }}>
            <span style={{
              width: 0, height: 0, marginLeft: 2,
              borderTop: '5px solid transparent', borderBottom: '5px solid transparent',
              borderLeft: '8px solid #0a0e1f',
            }} />
          </span>
          <span style={{ fontWeight: 800, fontSize: 'clamp(14px,1.6vw,18px)' }}>메이크쇼츠</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fg-faint)', fontFamily: 'var(--font-mono)' }}>
            영상 생성 (가상 서비스)
          </span>
        </div>

        {phase === 'input' && (
          <>
            <div style={{ fontSize: 'clamp(11px,1.2vw,13px)', color: 'var(--fg-muted)', fontWeight: 700 }}>프롬프트</div>
            <div style={{
              minHeight: 'clamp(74px,10vh,120px)',
              border: `1.6px solid ${t >= CLICK_INPUT ? C.violet : 'var(--hair)'}`,
              borderRadius: 12, padding: '12px 14px',
              fontSize: 'clamp(13px,1.5vw,16px)', lineHeight: 1.6, ...kw,
              boxShadow: t >= CLICK_INPUT && t < CLICK_INPUT + 0.4
                ? `0 0 0 ${clickFlash(t, CLICK_INPUT) * 8}px color-mix(in srgb, ${C.violet} 30%, transparent)`
                : 'none',
            }}>
              {typedText}
              {showCaret && <Caret color={C.violet} />}
            </div>
            <div style={genButton}>생성 ▶</div>
          </>
        )}

        {phase === 'generating' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
            <div style={{ fontWeight: 800, fontSize: 'clamp(14px,1.6vw,17px)' }}>생성 중…</div>
            <div style={{ width: 'min(320px,80%)', height: 8, borderRadius: 4, background: 'var(--hair-2)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4, background: C.violet,
                width: `${interpolate(t, [CLICK_GEN + 0.2, GEN_END], [0, 100])}%`,
              }} />
            </div>
            <div style={{ color: 'var(--fg-faint)', fontSize: 12.5, fontStyle: 'italic' }}>보통 몇 분 정도 걸려요</div>
          </div>
        )}

        {phase === 'result' && (
          <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <div style={{
              width: 'min(280px,72%)', aspectRatio: '16/9', borderRadius: 14,
              background: `linear-gradient(135deg, ${C.violet} 0%, #0a0e1f 100%)`,
              display: 'grid', placeItems: 'center', position: 'relative',
              ...riseIn(t, RESULT_IN, 0.6, 16),
            }}>
              <span style={{
                width: 58, height: 58, borderRadius: '50%', background: 'rgba(255,255,255,0.92)',
                display: 'grid', placeItems: 'center',
                boxShadow: `0 0 0 ${clickFlash(t, CLICK_PLAY) * 10}px color-mix(in srgb, ${C.violet} 35%, transparent)`,
              }}>
                <span style={{
                  width: 0, height: 0, marginLeft: 4,
                  borderTop: '11px solid transparent', borderBottom: '11px solid transparent',
                  borderLeft: '18px solid #0a0e1f',
                }} />
              </span>
            </div>
            {t >= DONE && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, ...riseIn(t, DONE, 0.4, 10) }}>
                <span style={{ color: C.green, fontWeight: 800 }}>✓ 완료</span>
                <span style={{ color: 'var(--fg-muted)', fontSize: 13 }}>다운로드 · 공유</span>
              </div>
            )}
          </div>
        )}
      </AppWindow>

      <Pointer
        path={[
          { t: 0.4, x: 50, y: 39 },
          { t: CLICK_INPUT, x: 50, y: 39, click: true },
          { t: CLICK_GEN, x: 74, y: 47, click: true },
          { t: RESULT_IN + 0.3, x: 50, y: 57 },
          { t: CLICK_PLAY, x: 50, y: 57, click: true },
          { t: DONE + 0.5, x: 60, y: 40, hide: true },
        ]}
      />
    </div>
  );
}

/* ── 마무리(watercolor) — 젖은 종이 위 텍스트 스크림 ─────────────────── */
function Band({ children, at = 0 }: { children: ReactNode; at?: number }) {
  const t = useSceneTime();
  return (
    <div style={{
      position: 'absolute', left: '6%', right: '6%', bottom: '8%',
      textAlign: 'center', padding: '64px 40px',
      background: `radial-gradient(75% 100% at 50% 50%, rgba(243,238,226,${interpolate(t, [at, at + 0.8], [0, 0.92], easeInOut)}) 30%, rgba(243,238,226,0) 100%)`,
      zIndex: 6,
    }}>
      {children}
    </div>
  );
}

const serif: CSSProperties = { fontFamily: '"Nanum Myeongjo", serif', color: '#2f3040', wordBreak: 'keep-all' };

export default function AiShortsOrientationDeck() {
  return (
    <Deck>
      {/* Slide 1 — 표지 */}
      <Cover
        nav="표지"
        notes="오늘부터 우리는 문장 한 줄로 60초짜리 영상을 만드는 법을 배웁니다. 여러분이 상상한 장면이, 며칠 안에 실제 영상이 될 거예요."
        kicker="창의적 체험활동 · 2026-2학기"
        title={<span style={{ ...kw, textShadow: '0 2px 20px rgba(3,4,10,0.6)' }}>AI로 만드는 <span className="accent-text">60초의 세계</span></span>}
        subtitle={<span style={{ ...kw, textShadow: '0 2px 14px rgba(3,4,10,0.9)' }}>영상 생성 인공지능 창의적 체험 활동 · 오리엔테이션</span>}
        image={`${IMG}/stage-01.png`}
        foot="오마주하거나, 새롭게 상상하거나 — 오늘 그 문을 엽니다"
      />

      {/* Slide 2 — 후킹 질문 */}
      <Slide center nav="후킹" notes="요즘 쇼츠나 릴스 보면서 이런 생각 해본 적 있나요? 오늘은 그 뒤에 있는 기술을 배웁니다.">
        <div style={{ width: 'min(1040px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 2.6vh, 30px)' }}>
          <Reveal>
            <div className="kicker" style={{ textAlign: 'center' }}>지금 이 순간에도</div>
            <h2 className="headline" style={{ textAlign: 'center', marginInline: 'auto', ...kw }}>
              방금 본 그 영상, <span className="accent-text">사람이 찍었을까?</span>
            </h2>
          </Reveal>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(12px, 1.8vw, 22px)' }}>
            <Build at={1} style={{ flex: '1 1 min(280px,100%)', display: 'flex' }}>
              <HookCard q="방금 본 영상, 사람이 찍었을까?" color={C.blue} />
            </Build>
            <Build at={2} style={{ flex: '1 1 min(280px,100%)', display: 'flex' }}>
              <HookCard q="그 배경, 실제로 존재하는 곳일까?" color={C.violet} />
            </Build>
            <Build at={3} style={{ flex: '1 1 min(280px,100%)', display: 'flex' }}>
              <HookCard q="그 목소리, 누구의 것일까?" color={C.coral} />
            </Build>
          </div>
          <Build at={4}>
            <p className="lead" style={{ textAlign: 'center', marginInline: 'auto', ...kw }}>
              구분이 점점 <strong style={{ color: 'var(--fg)' }}>어려워지고 있다.</strong>
            </p>
          </Build>
        </div>
      </Slide>

      {/* Slide 3 — 사례 1: 오마주 */}
      <Slide full nav="사례 · 오마주" notes="마음에 남은 영상 한 장면을, 나만의 방식으로 다시 상상해 보는 것 — 그것도 오늘 우리가 할 활동 중 하나예요.">
        <ImageBeat
          src={`${IMG}/stage-02.png`}
          alt="오래된 명장면을 오마주한 초현실적 도시 야경 위를 걷는 인물 실루엣"
          kicker="사례 1 · 오마주"
          title={<>좋아하는 장면을, <span className="accent-text">나만의 스타일로</span></>}
        >
          <p className="lead" style={{ maxWidth: 640, ...kw }}>
            익숙한 장면을 AI로 재해석하면 — 어디서 본 것 같은데, 새롭다.
          </p>
        </ImageBeat>
      </Slide>

      {/* Slide 4 — 사례 2: 새로운 상상 */}
      <Slide full nav="사례 · 상상" notes="이번엔 아예 없던 장면이에요. 이런 것도 문장 하나로 만들어집니다.">
        <ImageBeat
          src={`${IMG}/stage-03.png`}
          alt="구름 위에 떠 있는 도서관에서 책장이 새가 되어 날아오르는 장면"
          flip
          kicker="사례 2 · 새로운 상상"
          title={<>세상에 없던 장면도, <span className="accent-text">문장 하나면</span></>}
        >
          <p className="lead" style={{ maxWidth: 640, ...kw }}>
            완전히 상상적인 장면도, 현실에 없는 장소도 — 프롬프트만으로.
          </p>
        </ImageBeat>
      </Slide>

      {/* Slide 5 — 스타일 모음 */}
      <Slide center nav="스타일 모음" notes="오마주든 상상이든, 스타일은 완전히 자유예요.">
        <div style={{ width: 'min(900px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 2.6vh, 30px)' }}>
          <Reveal>
            <div className="kicker" style={{ textAlign: 'center' }}>같은 AI, 다른 얼굴</div>
            <h2 className="headline" style={{ textAlign: 'center', marginInline: 'auto', ...kw }}>
              스타일도, 장르도 <span className="accent-text">무궁무진</span>
            </h2>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(190px,100%), 1fr))', gap: 16 }}>
            {STYLES.map((s, i) => (
              <Build key={s.label} at={i + 1}>
                <div style={{ ...card, textAlign: 'left', borderColor: `color-mix(in srgb, ${s.color} 45%, transparent)` }}>
                  <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: s.color, marginBottom: 10 }} />
                  <div style={{ fontWeight: 800, fontSize: 'clamp(14px,1.6vw,17px)', ...kw }}>{s.label}</div>
                  <p style={{ color: 'var(--fg-muted)', fontSize: 13, marginTop: 6, lineHeight: 1.6, ...kw }}>{s.d}</p>
                </div>
              </Build>
            ))}
          </div>
        </div>
      </Slide>

      {/* Slide 6 — 원리 씬 */}
      <Slide full nav="원리 · 안개 씬" notes="짧게 원리만 짚을게요. 처음엔 지지직거리는 화면에서 시작해서, 우리가 준 문장을 참고해 점점 또렷해집니다. 이 과정을 여러 번 반복해서 프레임을 하나씩 만들고, 이어 붙이면 영상이 됩니다.">
        <Scene freezeAt={5}>
          <NoiseRevealScene />
        </Scene>
      </Slide>

      {/* Slide 7 — AI 입력 재료 */}
      <Slide center nav="입력 재료" notes="글만 쓸 수도 있고, 참고 이미지를 같이 넣을 수도 있어요. 오늘은 문장부터 잘 쓰는 법을 배웁니다.">
        <div style={{ width: 'min(1080px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(20px, 3vh, 34px)' }}>
          <Reveal>
            <div className="kicker" style={{ textAlign: 'center' }}>AI가 참고하는 것</div>
            <h2 className="headline" style={{ textAlign: 'center', marginInline: 'auto', ...kw }}>
              생성형 영상 AI가 <span className="accent-text">참고하는 재료들</span>
            </h2>
          </Reveal>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 'clamp(10px,1.6vw,18px)' }}>
            <PipeNode label="프롬프트 · 레퍼런스 이미지" sub="입력" />
            <Build at={1} style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px,1.6vw,18px)' }}>
              <Arrow />
              <PipeNode label="생성형 영상 AI" lit />
            </Build>
            <Build at={2} style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px,1.6vw,18px)' }}>
              <Arrow />
              <PipeNode label="프레임 시퀀스" />
            </Build>
            <Build at={3} style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px,1.6vw,18px)' }}>
              <Arrow />
              <PipeNode label="완성된 영상" />
            </Build>
          </div>
        </div>
      </Slide>

      {/* Slide 8 — 프롬프트 5요소(삽화) — whiteboard 대체 */}
      <Slide full nav="프롬프트 5요소" notes="포스터에 있던 문장을 같이 뜯어볼게요. '심해 위를 걷는 소년' — 주체와 행동, '빛나는 도시, 잔잔한 물결' — 배경, '시네마틱' — 카메라 워크, '감성적인 분위기' — 스타일. 이 한 장면 안에 다섯 조각이 다 들어있어요.">
        <ImageBeat
          src={`${IMG}/stage-04.png`}
          alt="심해 위를 걷는 소년 실루엣, 빛나는 도시와 잔잔한 물결, 시네마틱한 로우앵글"
          kicker="좋은 프롬프트는 다섯 조각"
          title={<>이 한 장면 안에 <span className="accent-text">다섯 조각</span>이 있다</>}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px', maxWidth: 680 }}>
            {FRAG.map((f) => (
              <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'clamp(13px,1.4vw,15px)' }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: f.color, flex: 'none' }} />
                <span style={{ color: 'var(--fg-faint)', fontWeight: 700 }}>{f.key}</span>
                <span style={{ ...kw }}>{f.frag}</span>
              </div>
            ))}
          </div>
        </ImageBeat>
      </Slide>

      {/* Slide 9 — 프롬프트 비교 */}
      <Slide center nav="프롬프트 비교" notes="조각 하나만 있어도 영상은 나와요. 근데 다섯 조각을 다 채우면, 완전히 다른 결과가 나옵니다.">
        <div style={{ width: 'min(1040px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 2.6vh, 30px)' }}>
          <Reveal>
            <div className="kicker" style={{ textAlign: 'center' }}>다섯 조각을 채우면</div>
            <h2 className="headline" style={{ textAlign: 'center', marginInline: 'auto', ...kw }}>
              결과가 <span className="accent-text">확 달라진다</span>
            </h2>
          </Reveal>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(14px, 2vw, 24px)', alignItems: 'stretch' }}>
            <Build at={1} style={{ flex: '1 1 min(320px,100%)', display: 'flex' }}>
              <PromptCard title="미흡한 프롬프트" tone="var(--fg-faint)">
                <p style={{ fontSize: 'clamp(15px,1.7vw,18px)', color: 'var(--fg-muted)', ...kw }}>
                  “소년이 걷는다”
                </p>
              </PromptCard>
            </Build>
            <Build at={2} style={{ flex: '1 1 min(320px,100%)', display: 'flex' }}>
              <PromptCard title="다섯 조각을 채운 프롬프트" tone={C.violet}>
                <p style={{ fontSize: 'clamp(15px,1.7vw,18px)', lineHeight: 1.9, ...kw }}>
                  {FRAG.map((f, i) => (
                    <span key={f.key}>
                      <span style={{ color: f.color, fontWeight: 800 }}>{f.frag}</span>
                      {i < FRAG.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </p>
              </PromptCard>
            </Build>
          </div>
        </div>
      </Slide>

      {/* Slide 10 — 실전 시연(walkthrough) */}
      <Slide full nav="실전 시연" notes="오늘 배운 다섯 조각으로 프롬프트를 쓰고, 이렇게 생성 버튼만 누르면 됩니다.">
        <Scene freezeAt={10}>
          <GenerateWalkthrough />
        </Scene>
      </Slide>

      {/* Slide 11 — 활동 3종(필름스트립) */}
      <Slide full nav="활동 3종" notes="포스터에 있던 세 가지 활동, 기억나시나요? 오마주하거나, 새롭게 상상하거나, 그리고 방법 자체를 스스로 탐구하거나 — 이 세 가지가 앞으로 우리가 할 활동입니다.">
        <ImageBeat
          src={`${IMG}/stage-05.png`}
          alt="세 장면 필름스트립 — 태블릿 펜을 쥔 손, 노트에 스케치하는 손, 완성된 영상을 보며 미소짓는 옆얼굴"
          kicker="이제 여러분 차례"
          title={<>오마주하거나, <span className="accent-text">새롭게 상상하거나</span></>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 640 }}>
            {[
              '마음에 남은 영상을 나만의 방식으로 오마주',
              '새로운 아이디어를 영상으로 구현',
              '영상 생성 방법을 스스로 탐구',
            ].map((line, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'baseline', fontSize: 'clamp(14px,1.6vw,17px)', fontWeight: 600, ...kw }}>
                <span style={{ color: C.violet, fontFamily: 'var(--font-mono)', fontWeight: 800 }}>{i + 1}</span>
                <span>{line}</span>
              </div>
            ))}
          </div>
        </ImageBeat>
      </Slide>

      {/* Slide 12 — 기대 학생상 + 일정 */}
      <Slide center nav="기대 학생상" notes="정답을 맞히는 수업이 아니에요. 이것저것 눌러보고 실험하는 걸 좋아하면 잘 맞을 거예요.">
        <div style={{ width: 'min(920px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 2.6vh, 30px)' }}>
          <Reveal>
            <div className="kicker" style={{ textAlign: 'center' }}>이런 사람을 기다립니다</div>
            <h2 className="headline" style={{ textAlign: 'center', marginInline: 'auto', ...kw }}>
              정답보다 <span className="accent-text">실험을 좋아하는 사람</span>
            </h2>
          </Reveal>
          <Build at={1}>
            <div style={{ ...card, textAlign: 'center', borderColor: `color-mix(in srgb, ${C.violet} 45%, transparent)` }}>
              <p style={{ fontSize: 'clamp(16px,1.9vw,20px)', fontWeight: 700, lineHeight: 1.7, ...kw }}>
                정답보다 실험을 좋아하고, 자신의 힘으로 생성 방법을 탐구하고 싶은 사람.
              </p>
            </div>
          </Build>
          <Build at={2}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
              {[
                { k: '기간', v: '9.10 ~ 9.27' },
                { k: '요일', v: '월 · 목' },
                { k: '시간', v: '18:40 ~ 19:40' },
              ].map((x) => (
                <div key={x.k} style={{ ...card, minWidth: 150, textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-faint)', fontWeight: 700 }}>{x.k}</div>
                  <div style={{ fontWeight: 800, fontSize: 'clamp(15px,1.7vw,18px)', marginTop: 6 }}>{x.v}</div>
                </div>
              ))}
            </div>
            <p style={{ textAlign: 'center', color: 'var(--fg-faint)', fontSize: 13, marginTop: 12 }}>
              ※ 요청에 따라 활동 기간이 연장될 수 있습니다
            </p>
          </Build>
        </div>
      </Slide>

      {/* Slide 13 — 클로징(watercolor) */}
      <Slide full nav="클로징" notes="오늘은 맛보기였고, 다음 시간부터 진짜로 만들어볼 거예요. 기대해도 좋습니다.">
        <Scene freezeAt={6.8}>
          <Paper bg={PAPER}>
            <WashReveal src={`${IMG}/scene-01.png`} at={0.2} dur={5.2} bands={6} dir="diag" brushWidth={215} />
            <ColorWash x={26} y={30} r={14} color={C.amber} at={4.6} opacity={0.35} />
            <ColorWash x={72} y={58} r={12} color={C.violet} at={5.0} opacity={0.35} />
            <Band at={4.6}>
              <WashText at={4.7}>
                <div style={{ ...serif, fontSize: '1rem', letterSpacing: '0.16em', opacity: 0.7 }}>
                  AI로 만드는 60초의 세계
                </div>
                <h1 style={{ ...serif, fontSize: 'clamp(1.8rem,3.4vw,2.6rem)', margin: '10px 0 0', lineHeight: 1.35, fontWeight: 700 }}>
                  여러분의 60초가
                  <br />
                  오늘부터 시작됩니다
                </h1>
              </WashText>
            </Band>
          </Paper>
        </Scene>
      </Slide>
    </Deck>
  );
}
