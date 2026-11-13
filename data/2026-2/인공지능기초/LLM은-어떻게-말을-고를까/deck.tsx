import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import Build from '../../../../src/deck/Build';
import Reveal from '../../../../src/deck/Reveal';
import { useDeck } from '../../../../src/deck/DeckContext';
import {
  Scene,
  useSceneTime,
  interpolate,
  spring,
  riseIn,
  easeInOut,
  easeOut,
} from '../../../../src/scene';

/* ── 인공지능 기초 · 2026-2 — LLM은 어떻게 다음 말을 고를까 (20장) ────────
   plan: data/2026-2/인공지능기초/LLM은-어떻게-말을-고를까/plan.md
   아크: 빈칸 놀이(live) → 확률 지형 → 국가대표 AI 뉴스·평가의 역설 → LLM 지도
        → 4단계(자르기·좌표·쳐다보기·고르기) + 반복 → "아는 게 아니라 고른다"
        → 글의 설계도 되찾기 활동(AI가 정한 것 · 두 가지 눈 · 도면 뜨기) → 활동지
   테마: 다크 잉크 + 형광펜 (어텐션 = 형광펜이라는 시각 언어)
   원칙: Q·K·V·행렬곱은 다루지 않는다 — "연산 결과로 다음 말이 정해진다"까지. */

const BASE = 'data/2026-2/인공지능기초/LLM은-어떻게-말을-고를까';
const SITE = 'https://2026kijunit.netlify.app';
const ACTIVITY_URL = `${SITE}/${BASE}/활동지.html`;
const BOARD_URL = `${SITE}/data/2026-2/인공지능기초/제출현황.html`;
const NEWS_URL = 'https://zdnet.co.kr/view/?no=20260818110107';
// S20 심화 영상 — 「AI 시대일수록 가장 귀한 인재의 결정적 특징 1가지 (feat. 하버드)」
// 채널 '독서연구소'(@readinglab365). 제목·채널은 2026-08-22 oEmbed로 확인했다.
const VIDEO_URL = 'https://www.youtube.com/watch?v=higfA4sMWcc';
const TE_URL = 'https://poloclub.github.io/transformer-explainer/';
const TOKENIZER_URL = 'https://tiktokenizer.vercel.app';

const C = {
  amber: '#fbbf24',
  lime: '#a3e635',
  sky: '#38bdf8',
  rose: '#fb7185',
  violet: '#c4b5fd',
  green: '#34d399',
  dim: '#6b7280',
};

const kw: CSSProperties = { wordBreak: 'keep-all' };

const card: CSSProperties = {
  background: 'var(--surface-2)',
  border: '1px solid var(--hair)',
  borderRadius: 16,
  padding: 'clamp(14px, 1.8vw, 22px)',
};

const mono = 'var(--font-mono)';

/* 하단 플로팅 독(프레젠터 컨트롤)이 화면 아래 중앙을 덮는다 —
   씬의 하단 밴드는 이 높이만큼 띄워야 가려지지 않는다. */
const DOCK_SAFE = 'clamp(86px, 11vh, 120px)';

/* 4단계 — 이 수업의 척추. S7에서 세우고 S8·S9·S11·S12·S14에서 되풀이한다 */
const STAGES = [
  { n: '①', label: '자르기' },
  { n: '②', label: '좌표로' },
  { n: '③', label: '서로 쳐다보기' },
  { n: '④', label: '고르기' },
];

/* ── 공용 소품 ───────────────────────────────────────────────── */

function Kicker({ children }: { children: ReactNode }) {
  return (
    <div className="kicker" style={{ color: 'var(--primary)' }}>
      {children}
    </div>
  );
}

function LinkPill({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        color: 'var(--primary)',
        fontWeight: 700,
        fontSize: 13.5,
        textDecoration: 'underline',
        textUnderlineOffset: 4,
        textDecorationColor: 'color-mix(in srgb, var(--primary) 45%, transparent)',
        ...kw,
      }}
    >
      {label} ↗
    </a>
  );
}

/** 진행 눈금 — 지금 몇 번째 단계인가 (active: 1~4, 0이면 전부 완주) */
function StageMeter({ active, note }: { active: number; note?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      {STAGES.map((s, i) => {
        const on = active === 0 || i + 1 === active;
        const past = active !== 0 && i + 1 < active;
        return (
          <span
            key={s.n}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 12px',
              borderRadius: 999,
              fontSize: 12.5,
              fontWeight: 800,
              letterSpacing: '0.01em',
              border: `1px solid ${on ? 'color-mix(in srgb, var(--primary) 60%, transparent)' : 'var(--hair-2)'}`,
              background: on ? 'color-mix(in srgb, var(--primary) 13%, transparent)' : 'transparent',
              color: on ? 'var(--primary)' : past ? 'var(--fg-faint)' : 'var(--fg-faint)',
              opacity: on || past ? 1 : 0.55,
              ...kw,
            }}
          >
            <span style={{ fontFamily: mono }}>{s.n}</span>
            {s.label}
          </span>
        );
      })}
      {note && (
        <span style={{ fontSize: 12, color: 'var(--fg-faint)', fontWeight: 700, ...kw }}>{note}</span>
      )}
    </div>
  );
}

/** 형광펜으로 칠한 듯한 텍스트 — 이 덱의 강조 문법 */
function Mark({ children, tone = C.amber, strength = 0.3 }: { children: ReactNode; tone?: string; strength?: number }) {
  return (
    <span
      style={{
        background: `linear-gradient(to top, color-mix(in srgb, ${tone} ${Math.round(strength * 100)}%, transparent) 0 58%, transparent 58%)`,
        borderRadius: 3,
        padding: '0 2px',
      }}
    >
      {children}
    </span>
  );
}

/** 빈칸 — 이 수업의 주인공 */
function Blank({ width = 96 }: { width?: number }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width,
        borderBottom: `3px solid ${C.amber}`,
        marginInline: 4,
        transform: 'translateY(-4px)',
      }}
    />
  );
}

/* ── S3 — 지형과 구슬 (확률분포 도입 씬) ───────────────────────── */

/** 지형 높이 — 좌: 좁고 깊은 골짜기 / 우: 넓고 평평한 들판 */
function ground(x: number): number {
  if (x < 560) return 296 + 138 * Math.exp(-Math.pow((x - 300) / 74, 2));
  return 408 + 7 * Math.sin((x - 560) / 46) + 5 * Math.sin((x - 560) / 121);
}

function TerrainScene() {
  const t = useSceneTime();
  /* 왼쪽 10구슬은 모두 골짜기 바닥으로, 오른쪽 10구슬은 다섯 웅덩이로 흩어진다 */
  const balls = [
    ...Array.from({ length: 10 }, (_, i) => ({ id: `L${i}`, x: 300, side: 0, delay: 0.25 + i * 0.09 })),
    ...[700, 700, 700, 792, 792, 878, 878, 962, 962, 1052].map((x, i) => ({
      id: `R${i}`,
      x,
      side: 1,
      delay: 0.3 + i * 0.09,
    })),
  ];
  const buckets = [
    { x: 300, n: 10, side: 0 },
    { x: 700, n: 3, side: 1 },
    { x: 792, n: 2, side: 1 },
    { x: 878, n: 2, side: 1 },
    { x: 962, n: 2, side: 1 },
    { x: 1052, n: 1, side: 1 },
  ];
  const barsT = 2.9;
  const path = Array.from({ length: 121 }, (_, i) => {
    const x = 70 + i * 9;
    return `${i === 0 ? 'M' : 'L'}${x} ${ground(x).toFixed(1)}`;
  }).join(' ');

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', paddingTop: 'clamp(18px, 3.6vh, 40px)' }}>
        <div className="kicker" style={{ color: 'var(--primary)', ...riseIn(t, 0.05) }}>
          방금 여러분이 만든 두 개의 분포
        </div>
        <h2 className="display" style={{ margin: '10px auto 0', ...kw, ...riseIn(t, 0.2) }}>
          뾰족한 답, <span className="accent-text">납작한 답</span>
        </h2>
        <p className="lead" style={{ marginInline: 'auto', marginTop: 8, ...kw, ...riseIn(t, 0.45) }}>
          기계는 답을 하나 아는 게 아니라, 가능한 말마다 점수를 매겨 두고 고른다.
        </p>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, padding: '1.5vh 0' }}>
        <svg viewBox="0 0 1200 470" style={{ width: 'min(1180px, 96vw)', maxHeight: '52vh', overflow: 'visible' }}>
          {/* 지형 */}
          <path
            d={`${path} L1150 462 L70 462 Z`}
            fill="color-mix(in srgb, var(--primary) 7%, transparent)"
            opacity={interpolate(t, [0.1, 0.8], [0, 1])}
          />
          <path
            d={path}
            fill="none"
            stroke="var(--hair)"
            strokeWidth={2.5}
            strokeLinecap="round"
            pathLength={1}
            style={{ strokeDasharray: 1, strokeDashoffset: 1 - interpolate(t, [0.1, 1], [0, 1], easeInOut) }}
          />
          {/* 구슬 낙하 — 중력 느낌으로 p² */}
          {balls.map((b) => {
            const p = Math.max(0, Math.min(1, (t - b.delay) / 0.95));
            const y = 14 + (ground(b.x) - 14 - 14) * p * p;
            const tone = b.side === 0 ? C.amber : C.lime;
            if (p <= 0) return null;
            const settle = t > b.delay + 0.95 ? Math.min(1, (t - b.delay - 0.95) / 0.5) : 0;
            const fade = interpolate(t, [barsT, barsT + 0.7], [1, 0.25]);
            return (
              <circle
                key={b.id}
                cx={b.x + (1 - settle) * 0}
                cy={y + settle * 5}
                r={9}
                fill={tone}
                opacity={Math.min(1, p * 2.2) * fade}
              />
            );
          })}
          {/* 착지 분포 → 막대 */}
          {buckets.map((bk) => {
            const h = interpolate(t, [barsT, barsT + 0.9], [0, bk.n * 26], easeOut);
            const tone = bk.side === 0 ? C.amber : C.lime;
            const gy = ground(bk.x);
            return (
              <g key={bk.x}>
                <rect
                  x={bk.x - 26}
                  y={gy - h}
                  width={52}
                  height={h}
                  rx={7}
                  fill={`color-mix(in srgb, ${tone} 78%, transparent)`}
                />
                <text
                  x={bk.x}
                  y={gy - h - 12}
                  textAnchor="middle"
                  fill={tone}
                  opacity={interpolate(t, [barsT + 0.5, barsT + 1.1], [0, 1])}
                  style={{ font: `800 17px ${mono}` }}
                >
                  {bk.n}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      {/* 구역 캡션 — 지형 bbox 밖 하단 밴드 (zone 분리) */}
      <div
        style={{
          flex: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(8px, 1.4vh, 14px)',
          padding: `0 var(--gutter) ${DOCK_SAFE}`,
        }}
      >
        <div style={{ display: 'flex', width: 'min(1180px, 96vw)', gap: 20, ...riseIn(t, 1.4) }}>
          <div style={{ flex: '0 0 42%', textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 'clamp(14px, 1.7vw, 18px)', color: C.amber, ...kw }}>「가는 말이 고와야 ___」</div>
            <div style={{ color: 'var(--fg-muted)', fontSize: 'clamp(12px, 1.35vw, 14px)', marginTop: 3, ...kw }}>
              좁고 깊은 골짜기 — 답이 한곳으로 굴러떨어진다
            </div>
          </div>
          <div style={{ flex: '1 1 0', textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 'clamp(14px, 1.7vw, 18px)', color: C.lime, ...kw }}>「창밖에 ___」</div>
            <div style={{ color: 'var(--fg-muted)', fontSize: 'clamp(12px, 1.35vw, 14px)', marginTop: 3, ...kw }}>
              넓고 평평한 들판 — 답이 여러 웅덩이로 나뉜다
            </div>
          </div>
        </div>
        <span style={{ ...card, display: 'inline-block', padding: '9px 20px', fontWeight: 700, fontSize: 'clamp(13px, 1.55vw, 15.5px)', textAlign: 'center', ...riseIn(t, 4.4), ...kw }}>
          이 “점수 뭉치”의 모양이 <Mark tone={C.amber}>확률분포</Mark>다. 사람도 같은 일을 한다 — 계산이라고 부르지 않을 뿐.
        </span>
      </div>
    </div>
  );
}

/* ── S7 — 껍데기를 벗기면 심장은 하나 (전환 씬) ─────────────────── */

function PeelScene() {
  const t = useSceneTime();
  const windows = [
    { x: 150, tone: C.sky },
    { x: 430, tone: C.violet },
    { x: 710, tone: C.rose },
    { x: 990, tone: C.lime },
  ];
  const beat = (i: number) => spring(t, 1.7 + i * 0.34, 0.5);
  const fall = interpolate(t, [3.15, 4.2], [0, 1], easeInOut);
  const R = 188;

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', paddingTop: 'clamp(28px, 5.5vh, 58px)' }}>
        <div className="kicker" style={{ color: 'var(--primary)', ...riseIn(t, 0.05) }}>
          이름은 달라도
        </div>
        <h2 className="display" style={{ margin: '10px auto 0', ...kw, ...riseIn(t, 0.2) }}>
          껍데기를 벗기면 <span className="accent-text">심장은 하나</span>
        </h2>
      </div>
      <div style={{ flex: 1, display: 'grid', placeItems: 'center', minHeight: 0, padding: '1vh 0 2vh' }}>
        <svg viewBox="0 0 1300 560" style={{ width: 'min(1180px, 94vw)', maxHeight: '68vh', overflow: 'visible' }}>
          {/* 챗봇 창 4개 — 껍질처럼 벗겨진다 */}
          {windows.map((w, i) => {
            const peel = interpolate(t, [0.6 + i * 0.12, 1.6 + i * 0.12], [0, 1], easeInOut);
            return (
              <g key={w.x} opacity={1 - peel} transform={`translate(0 ${-peel * 130}) scale(1)`}>
                <rect x={w.x} y={54} width={172} height={128} rx={14} fill="var(--surface-2)" stroke="var(--hair)" strokeWidth={1.6} />
                <line x1={w.x} y1={84} x2={w.x + 172} y2={84} stroke="var(--hair-2)" strokeWidth={1.4} />
                {[0, 1, 2].map((d) => (
                  <circle key={d} cx={w.x + 18 + d * 15} cy={69} r={4.5} fill={d === 0 ? w.tone : 'var(--hair)'} />
                ))}
                <rect x={w.x + 18} y={104} width={104} height={11} rx={5.5} fill="var(--hair)" />
                <rect x={w.x + 18} y={126} width={136} height={11} rx={5.5} fill="var(--hair-2)" />
                <rect x={w.x + 18} y={148} width={78} height={11} rx={5.5} fill="var(--hair-2)" />
              </g>
            );
          })}
          {/* 순환 궤도 — 네 단계가 한 바퀴 돌고 다시 ①로 */}
          <circle
            cx={650}
            cy={272}
            r={R}
            fill="none"
            stroke="var(--hair)"
            strokeWidth={2.5}
            strokeDasharray="7 9"
            opacity={fall * 0.6}
          />
          <path
            d={`M650 ${272 - R} A ${R} ${R} 0 1 1 ${650 - 1} ${272 - R}`}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={3.5}
            strokeLinecap="round"
            pathLength={1}
            opacity={fall}
            style={{ strokeDasharray: 1, strokeDashoffset: 1 - interpolate(t, [3.6, 5.2], [0, 1], easeInOut) }}
          />
          {/* 화살촉 — 궤도를 한 바퀴 돌아 ①로 되돌아온다 */}
          {(() => {
            const th = (-122 * Math.PI) / 180;
            const ax = 650 + Math.cos(th) * R;
            const ay = 272 + Math.sin(th) * R;
            const rot = (Math.atan2(Math.cos(th), -Math.sin(th)) * 180) / Math.PI;
            return (
              <polygon
                points="0,0 -17,-9 -17,9"
                fill="var(--primary)"
                transform={`translate(${ax} ${ay}) rotate(${rot})`}
                opacity={interpolate(t, [5, 5.4], [0, 1])}
              />
            );
          })()}
          {/* 네 박자 — 줄지어 뛰다가 궤도 위로 흩어져 앉는다 */}
          {STAGES.map((s, i) => {
            const b = beat(i);
            const rowX = 425 + i * 150;
            const a = (-90 + i * 90) * (Math.PI / 180);
            const orbX = 650 + Math.cos(a) * R;
            const orbY = 272 + Math.sin(a) * R;
            const px = rowX + (orbX - rowX) * fall;
            const py = 272 + (orbY - 272) * fall;
            const lx = 650 + Math.cos(a) * (R + 62);
            const ly = 272 + Math.sin(a) * (R + 62);
            return (
              <g key={s.n}>
                <circle cx={px} cy={py} r={30 + b * 9} fill={`color-mix(in srgb, var(--primary) ${9 + b * 20}%, transparent)`} />
                <circle cx={px} cy={py} r={21} fill="var(--bg)" stroke="var(--primary)" strokeWidth={2.6} opacity={0.4 + b * 0.6} />
                <text x={px} y={py + 8} textAnchor="middle" fill="var(--primary)" opacity={0.5 + b * 0.5} style={{ font: `800 21px ${mono}` }}>
                  {s.n}
                </text>
                <text
                  x={lx}
                  y={ly + 7}
                  textAnchor="middle"
                  fill="var(--fg)"
                  opacity={interpolate(t, [3.9 + i * 0.12, 4.5 + i * 0.12], [0, 1]) * fall}
                  style={{ font: '800 21px var(--font-body, sans-serif)' }}
                >
                  {s.label}
                </text>
              </g>
            );
          })}
          <text
            x={650}
            y={266}
            textAnchor="middle"
            fill="var(--fg)"
            opacity={interpolate(t, [5.2, 5.8], [0, 1])}
            style={{ font: '900 30px var(--font-body, sans-serif)' }}
          >
            반복
          </text>
          <text
            x={650}
            y={298}
            textAnchor="middle"
            fill="var(--fg-muted)"
            opacity={interpolate(t, [5.4, 6], [0, 1])}
            style={{ font: '600 15px var(--font-body, sans-serif)' }}
          >
            낱말 하나마다 한 바퀴
          </text>
        </svg>
      </div>
    </div>
  );
}

/* ── S8 — 토큰 자르기 비교기 (인터랙티브 W1) ───────────────────────
   조각 데이터는 o200k_base(GPT-4o 계열) 토크나이저로 2026-08 실측한 값.
   재검증: 2026-08-21 tiktoken o200k_base로 6문장 전부 대조 — 조각 개수는
   모두 일치하고, 경계도 아래 한 곳을 뺀 전부가 실측 그대로다.

   의도된 단순화 한 곳: 속담 한국어의 10·11번째 조각. 실제 토큰은
   b' ê³'(공백 + '곱'의 앞 2바이트)와 b'±'('곱'의 끝 1바이트)로,
   '곱' 한 글자가 글자 중간에서 찢어져 조각 하나만으로는 문자조차 되지
   않는다. 화면에는 읽히도록 ' '와 '곱'으로 풀어 적었다 — 개수(13)와
   비율(2.2배)은 실측 그대로이므로 수업의 결론에는 영향이 없다.
   깨진 바이트를 그대로 노출하지 않기로 한 것은 수업상의 판단이니,
   "표기가 틀렸다"고 보고 되돌리지 말 것. */

type TokenSide = { text: string; parts: string[] };
const TOKEN_PAIRS: { tag: string; note: string; ko: TokenSide; en: TokenSide }[] = [
  {
    tag: '일상 문장',
    note: '같은 뜻, 다른 언어',
    ko: {
      text: '나는 어제 학교에서 친구와 함께 점심을 먹었다.',
      parts: ['나는', ' 어', '제', ' 학교', '에서', ' 친구', '와', ' 함께', ' 점', '심', '을', ' 먹', '었다', '.'],
    },
    en: {
      text: 'I ate lunch with my friend at school yesterday.',
      parts: ['I', ' ate', ' lunch', ' with', ' my', ' friend', ' at', ' school', ' yesterday', '.'],
    },
  },
  {
    tag: '기술 문장',
    note: '오늘 배우는 내용 그대로',
    ko: {
      text: '인공지능 모델은 문장을 토큰이라는 조각으로 나눈다.',
      parts: ['인', '공지', '능', ' 모델', '은', ' 문', '장을', ' 토', '큰', '이라는', ' 조', '각', '으로', ' 나', '눈', '다', '.'],
    },
    en: {
      text: 'An AI model splits a sentence into pieces called tokens.',
      parts: ['An', ' AI', ' model', ' splits', ' a', ' sentence', ' into', ' pieces', ' called', ' tokens', '.'],
    },
  },
  {
    tag: '속담',
    note: '뜻이 통하는 영어 속담과 비교',
    ko: {
      text: '가는 말이 고와야 오는 말이 곱다.',
      parts: ['가는', ' 말', '이', ' 고', '와', '야', ' 오는', ' 말', '이', ' ', '곱', '다', '.'],
    },
    en: {
      text: 'What goes around comes around.',
      parts: ['What', ' goes', ' around', ' comes', ' around', '.'],
    },
  },
];

function TokenChips({ parts, tone }: { parts: string[]; tone: string }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {parts.map((p, i) => (
        <span
          key={`${p}-${i}`}
          style={{
            whiteSpace: 'pre',
            fontFamily: mono,
            fontSize: 'clamp(12px, 1.35vw, 15px)',
            fontWeight: 700,
            padding: '4px 7px',
            borderRadius: 7,
            border: `1px solid color-mix(in srgb, ${tone} ${28 + (i % 3) * 10}%, transparent)`,
            background: `color-mix(in srgb, ${tone} ${7 + (i % 3) * 3}%, transparent)`,
            color: 'var(--fg)',
          }}
        >
          {p}
        </span>
      ))}
    </div>
  );
}

function TokenLab() {
  const [idx, setIdx] = useState(0);
  const pair = TOKEN_PAIRS[idx];
  const ratio = (pair.ko.parts.length / pair.en.parts.length).toFixed(1);
  return (
    <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {TOKEN_PAIRS.map((p, i) => (
          <button
            key={p.tag}
            type="button"
            onClick={() => setIdx(i)}
            style={{
              cursor: 'pointer',
              padding: '6px 14px',
              borderRadius: 999,
              fontSize: 12.5,
              fontWeight: 800,
              fontFamily: 'inherit',
              color: i === idx ? 'var(--accent-ink)' : 'var(--fg-muted)',
              background: i === idx ? 'var(--accent)' : 'transparent',
              border: `1px solid ${i === idx ? 'transparent' : 'var(--hair)'}`,
            }}
          >
            {p.tag}
          </button>
        ))}
        <span style={{ fontSize: 12, color: 'var(--fg-faint)', ...kw }}>{pair.note}</span>
      </div>

      {[
        { side: pair.ko, lang: '한국어', tone: C.rose },
        { side: pair.en, lang: 'English', tone: C.sky },
      ].map(({ side, lang, tone }) => (
        <div key={lang} style={{ ...card, padding: 'clamp(12px, 1.5vw, 18px)', display: 'flex', flexDirection: 'column', gap: 9 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: 'clamp(13.5px, 1.6vw, 16px)', ...kw }}>
              <span style={{ color: tone, fontFamily: mono, fontSize: 12, marginRight: 8 }}>{lang}</span>
              {side.text}
            </span>
            <span style={{ flex: 'none', fontFamily: mono, fontWeight: 800, fontSize: 'clamp(15px, 1.8vw, 19px)', color: tone }}>
              {side.parts.length} 조각
            </span>
          </div>
          <TokenChips parts={side.parts} tone={tone} />
        </div>
      ))}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <span
          style={{
            padding: '7px 15px',
            borderRadius: 999,
            border: `1.5px dashed color-mix(in srgb, ${C.amber} 55%, transparent)`,
            color: C.amber,
            fontWeight: 800,
            fontSize: 13.5,
            ...kw,
          }}
        >
          같은 뜻인데 한국어가 {ratio}배
        </span>
        <span style={{ fontSize: 11.5, color: 'var(--fg-faint)', fontFamily: mono, ...kw }}>
          기준: o200k_base (GPT-4o 계열) · 2026-08 실측
        </span>
      </div>
    </div>
  );
}

/* ── S9 — 도서관 서가 (임베딩 씬) ─────────────────────────────── */

function ShelfScene() {
  const t = useSceneTime();
  const shelves = [
    { y: 128, label: '타는 것', tone: C.sky, words: ['자동차', '기차', '비행기'] },
    { y: 258, label: '먹는 것', tone: C.lime, words: ['사과', '포도', '딸기'] },
    { y: 388, label: '몸의 부위', tone: C.violet, words: ['머리', '다리', '어깨'] },
  ];
  const pending = spring(t, 4.5, 0.9);
  const blink = 0.45 + 0.55 * Math.abs(Math.sin((t - 5.2) * 3.4));

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', overflow: 'hidden' }}>
      {/* 좌: 텍스트 밴드 (zone 분리) */}
      <div
        style={{
          flex: '0.95 1 0',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 'clamp(10px, 1.6vh, 18px)',
          padding: 'clamp(16px, 3vw, 48px) clamp(16px, 2.6vw, 40px) clamp(16px, 3vw, 48px) var(--gutter)',
        }}
      >
        <div style={riseIn(t, 0.05)}>
          <StageMeter active={2} />
        </div>
        <h2 className="headline" style={{ ...kw, ...riseIn(t, 0.2) }}>
          낱말이 <span className="accent-text">제자리를 찾아간다</span>
        </h2>
        <p style={{ color: 'var(--fg-muted)', lineHeight: 1.7, fontSize: 'clamp(13.5px, 1.55vw, 16px)', ...kw, ...riseIn(t, 0.4) }}>
          기계는 ‘사과’라는 뜻을 모른다. 대신 사과가 놓이는 <strong style={{ color: 'var(--fg)' }}>자리</strong>를 안다.
          자리는 숫자 묶음이고, 그 숫자는 어마어마하게 많은 문장을 읽으며 정해졌다.
        </p>
        <p style={{ color: 'var(--fg-muted)', lineHeight: 1.7, fontSize: 'clamp(13.5px, 1.55vw, 16px)', ...kw, ...riseIn(t, 0.75) }}>
          그래서 뜻이 가까운 말은 <Mark tone={C.lime}>서로 가까운 자리</Mark>에 앉는다.
        </p>
        <div style={{ ...card, padding: '11px 16px', borderColor: `color-mix(in srgb, ${C.amber} 45%, transparent)`, ...riseIn(t, 5.1) }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, ...kw }}>
            그런데 <strong style={{ color: C.amber }}>‘배’</strong>는 어느 칸에 앉아야 하나? — 타는 배, 먹는 배, 아픈 배.
            낱말 하나에 자리 하나로는 풀리지 않는다.
          </span>
        </div>
      </div>
      {/* 우: 서가 */}
      <div style={{ flex: '1.15 1 0', minWidth: 0, display: 'grid', placeItems: 'center', padding: '2vh 1vw' }}>
        <svg viewBox="0 0 880 560" style={{ width: 'min(840px, 51vw)', maxHeight: '84vh', overflow: 'visible' }}>
          <g transform="skewY(-3.5)">
            {/* 서가 뼈대 */}
            <rect x={60} y={86} width={520} height={392} rx={12} fill="color-mix(in srgb, var(--primary) 4%, transparent)" stroke="var(--hair)" strokeWidth={2} />
            {shelves.map((s, si) => (
              <g key={s.label}>
                {/* 칸 라벨 — 카드 위쪽 밴드에 두어 카드와 겹치지 않는다 */}
                <text x={80} y={s.y - 14} fill={s.tone} opacity={interpolate(t, [0.5 + si * 0.15, 1 + si * 0.15], [0, 1])} style={{ font: `700 14px ${mono}` }}>
                  {s.label}
                </text>
                <line
                  x1={60}
                  y1={s.y + 68}
                  x2={60 + 520 * interpolate(t, [0.2 + si * 0.15, 0.9 + si * 0.15], [0, 1], easeInOut)}
                  y2={s.y + 68}
                  stroke="var(--hair)"
                  strokeWidth={2.5}
                />
                {s.words.map((w, wi) => {
                  const at = 1.1 + si * 0.7 + wi * 0.2;
                  const a = spring(t, at, 0.75);
                  const fromX = -170;
                  const fromY = 560;
                  const x = fromX + (80 + wi * 175 - fromX) * a;
                  const y = fromY + (s.y - fromY) * a;
                  return (
                    <g key={w} opacity={Math.min(1, a * 1.6)} transform={`translate(${x} ${y}) rotate(${(1 - a) * -14})`}>
                      <rect width={140} height={52} rx={9} fill="var(--surface-2)" stroke={`color-mix(in srgb, ${s.tone} 55%, transparent)`} strokeWidth={1.8} />
                      <text x={70} y={33} textAnchor="middle" fill="var(--fg)" style={{ font: '700 20px var(--font-body, sans-serif)' }}>
                        {w}
                      </text>
                    </g>
                  );
                })}
                {/* 같은 칸끼리 이어지는 형광 실선 */}
                <line
                  x1={100}
                  y1={s.y + 26}
                  x2={100 + 450 * interpolate(t, [2.4 + si * 0.2, 3.1 + si * 0.2], [0, 1], easeOut)}
                  y2={s.y + 26}
                  stroke={s.tone}
                  strokeWidth={2}
                  strokeDasharray="3 6"
                  opacity={0.45}
                />
              </g>
            ))}
            {/* 자리를 못 찾은 '배' 카드 — 서가 옆 통로에서 멈춰 깜빡인다 */}
            <g opacity={Math.min(1, pending * 1.5)} transform={`translate(${880 + (660 - 880) * pending} 250)`}>
              <rect width={140} height={52} rx={9} fill="var(--surface-2)" stroke={C.amber} strokeWidth={2.4} opacity={blink} />
              <text x={70} y={34} textAnchor="middle" fill={C.amber} style={{ font: '800 22px var(--font-body, sans-serif)' }} opacity={blink}>
                배
              </text>
              <text x={70} y={80} textAnchor="middle" fill="var(--fg-muted)" style={{ font: `700 15px ${mono}` }} opacity={interpolate(t, [5.4, 6], [0, 1])}>
                어느 칸?
              </text>
            </g>
            {/* 두 칸 모두를 가리키는 물음의 화살 */}
            {[
              { y: 154, tone: C.sky },
              { y: 284, tone: C.lime },
              { y: 414, tone: C.violet },
            ].map((arrow) => {
              const a = interpolate(t, [5.3, 6.1], [0, 1], easeOut);
              return (
                <g key={arrow.y} opacity={a * 0.9}>
                  <line
                    x1={652}
                    y1={276}
                    x2={652 - 62 * a}
                    y2={276 + (arrow.y - 276) * a}
                    stroke={arrow.tone}
                    strokeWidth={2}
                    strokeDasharray="5 6"
                  />
                  <circle cx={652 - 62 * a} cy={276 + (arrow.y - 276) * a} r={4} fill={arrow.tone} />
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}

/* ── S11 — 어텐션 하이라이터 (인터랙티브 W2) ───────────────────── */

const SENT = ['밤에', '배를', '타고', '가다가', '배가', '고파서', '배를', '먹었다'];
const TARGETS: { idx: number; meaning: string; tone: string; w: Record<number, number> }[] = [
  { idx: 1, meaning: '선박 — 타고 가는 배', tone: C.sky, w: { 0: 0.18, 2: 0.52, 3: 0.14, 5: 0.03, 7: 0.05 } },
  { idx: 4, meaning: '신체 — 배가 고프다', tone: C.rose, w: { 0: 0.05, 3: 0.09, 5: 0.58, 7: 0.15 } },
  { idx: 6, meaning: '과일 — 먹는 배', tone: C.lime, w: { 4: 0.09, 5: 0.15, 7: 0.62 } },
];

function AttentionLab() {
  const [pick, setPick] = useState(0);
  const cur = TARGETS[pick];
  return (
    <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
        {SENT.map((w, i) => {
          const isTarget = TARGETS.some((tg) => tg.idx === i);
          const targetOrder = TARGETS.findIndex((tg) => tg.idx === i);
          const weight = cur.w[i] ?? 0;
          const selected = cur.idx === i;
          return (
            <button
              key={`${w}-${i}`}
              type="button"
              disabled={!isTarget}
              onClick={() => targetOrder >= 0 && setPick(targetOrder)}
              style={{
                position: 'relative',
                cursor: isTarget ? 'pointer' : 'default',
                fontFamily: 'inherit',
                fontSize: 'clamp(17px, 2.3vw, 27px)',
                fontWeight: selected ? 900 : 700,
                color: selected ? cur.tone : 'var(--fg)',
                padding: '6px 12px 9px',
                borderRadius: 10,
                border: selected ? `2px solid ${cur.tone}` : isTarget ? '2px dashed var(--hair)' : '2px solid transparent',
                background:
                  weight > 0
                    ? `linear-gradient(to top, color-mix(in srgb, ${cur.tone} ${Math.round(weight * 115)}%, transparent) 0 ${28 + weight * 46}%, transparent ${28 + weight * 46}%)`
                    : 'transparent',
                transition: 'background 260ms var(--ease), color 200ms',
              }}
            >
              {w}
              {isTarget && (
                <span
                  style={{
                    position: 'absolute',
                    top: -9,
                    right: -6,
                    width: 19,
                    height: 19,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 11,
                    fontFamily: mono,
                    fontWeight: 800,
                    color: selected ? 'var(--accent-ink)' : 'var(--fg-muted)',
                    background: selected ? cur.tone : 'var(--surface-2)',
                    border: '1px solid var(--hair)',
                  }}
                >
                  {targetOrder + 1}
                </span>
              )}
              {weight > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: -17,
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    fontSize: 11,
                    fontFamily: mono,
                    fontWeight: 800,
                    color: cur.tone,
                  }}
                >
                  {weight.toFixed(2)}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', marginTop: 10 }}>
        <span style={{ fontSize: 12.5, color: 'var(--fg-muted)', fontWeight: 700, ...kw }}>
          ①·②·③을 눌러 보세요 — 그 ‘배’가 어디를 보는지 형광펜이 칠해집니다
        </span>
        <span
          style={{
            padding: '7px 15px',
            borderRadius: 999,
            border: `1.5px solid color-mix(in srgb, ${cur.tone} 60%, transparent)`,
            background: `color-mix(in srgb, ${cur.tone} 10%, transparent)`,
            color: cur.tone,
            fontWeight: 800,
            fontSize: 13.5,
            ...kw,
          }}
        >
          {pick + 1}번 ‘배’ = {cur.meaning}
        </span>
      </div>
      <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--fg-faint)', ...kw }}>
        이 굵기는 실제 모델의 계산 결과가 아니라, 이해를 돕기 위한 예시입니다.
      </p>
    </div>
  );
}

/* ── S12 — 다음 말 점수판 + 온도 (인터랙티브 W3) ───────────────── */

const CANDS = [
  { w: '눈이', l: 2.4 },
  { w: '비가', l: 1.9 },
  { w: '햇빛이', l: 1.6 },
  { w: '사람들이', l: 1.2 },
  { w: '안개가', l: 0.9 },
  { w: '고양이가', l: 0.2 },
];

function softmax(logits: number[], temp: number): number[] {
  const T = Math.max(0.05, temp);
  const scaled = logits.map((l) => l / T);
  const max = Math.max(...scaled);
  const exps = scaled.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

function NextWordLab() {
  const [temp, setTemp] = useState(1);
  const [picked, setPicked] = useState<number | null>(null);
  const probs = softmax(CANDS.map((c) => c.l), temp);

  const draw = () => {
    /* 확률에 비례한 추첨 — 사용자가 버튼을 누른 순간에만 난수를 쓴다 */
    const r = Math.random();
    let acc = 0;
    for (let i = 0; i < probs.length; i += 1) {
      acc += probs[i];
      if (r <= acc) {
        setPicked(i);
        return;
      }
    }
    setPicked(probs.length - 1);
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(16px, 2.4vw, 34px)', alignItems: 'stretch' }}
    >
      {/* 좌: 문장 + 손잡이 */}
      <div style={{ flex: '1 1 min(300px, 100%)', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'center' }}>
        <div style={{ ...card, display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 6, fontSize: 'clamp(15px, 1.9vw, 21px)', fontWeight: 700, ...kw }}>
          오늘 아침에 눈을 뜨니 창밖에
          {picked === null ? (
            <Blank width={104} />
          ) : (
            <span style={{ color: C.amber, fontWeight: 900, borderBottom: `3px solid ${C.amber}` }}>{CANDS[picked].w}</span>
          )}
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 800, ...kw }}>온도 손잡이</span>
            <span style={{ fontFamily: mono, fontWeight: 800, color: 'var(--primary)', fontSize: 16 }}>{temp.toFixed(2)}</span>
          </div>
          <input
            className="lnw-range"
            type="range"
            min={0.2}
            max={1.8}
            step={0.05}
            value={temp}
            onChange={(e) => setTemp(Number(e.target.value))}
            aria-label="온도"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--fg-faint)', fontFamily: mono }}>
            <span>0.2 · 늘 같은 답</span>
            <span>1.8 · 엉뚱한 답까지</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[0.2, 1, 1.8].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setTemp(v)}
              style={{
                cursor: 'pointer',
                padding: '6px 14px',
                borderRadius: 999,
                fontFamily: mono,
                fontSize: 12.5,
                fontWeight: 800,
                color: Math.abs(temp - v) < 0.001 ? 'var(--accent-ink)' : 'var(--fg-muted)',
                background: Math.abs(temp - v) < 0.001 ? 'var(--accent)' : 'transparent',
                border: `1px solid ${Math.abs(temp - v) < 0.001 ? 'transparent' : 'var(--hair)'}`,
              }}
            >
              T {v}
            </button>
          ))}
          <button
            type="button"
            onClick={draw}
            style={{
              cursor: 'pointer',
              padding: '6px 18px',
              borderRadius: 999,
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 800,
              color: 'var(--fg)',
              background: 'transparent',
              border: `1.5px solid ${C.amber}`,
            }}
          >
            🎲 뽑기
          </button>
        </div>
      </div>
      {/* 우: 점수판 */}
      <div style={{ flex: '1.25 1 min(320px, 100%)', minWidth: 0, ...card, display: 'flex', flexDirection: 'column', gap: 9, justifyContent: 'center' }}>
        {CANDS.map((c, i) => {
          const p = probs[i];
          const hot = picked === i;
          return (
            <div key={c.w} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ flex: 'none', width: 'clamp(58px, 6.5vw, 78px)', fontWeight: 800, fontSize: 'clamp(12.5px, 1.4vw, 15px)', color: hot ? C.amber : 'var(--fg)', ...kw }}>
                {c.w}
              </span>
              <span style={{ flex: 1, height: 16, borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--hair-2)', overflow: 'hidden' }}>
                <span
                  style={{
                    display: 'block',
                    width: `${p * 100}%`,
                    height: '100%',
                    borderRadius: 999,
                    background: hot ? C.amber : `color-mix(in srgb, ${C.lime} ${45 + p * 55}%, transparent)`,
                    transition: 'width 220ms var(--ease)',
                  }}
                />
              </span>
              <span style={{ flex: 'none', width: 54, textAlign: 'right', fontFamily: mono, fontSize: 12.5, fontWeight: 800, color: hot ? C.amber : 'var(--fg-muted)' }}>
                {(p * 100).toFixed(1)}%
              </span>
            </div>
          );
        })}
        <p style={{ fontSize: 11.5, color: 'var(--fg-faint)', marginTop: 2, ...kw }}>
          막대는 <span style={{ fontFamily: mono }}>softmax(점수 ÷ 온도)</span>로 실시간 계산된다. 점수값은 수업용 예시.
        </p>
      </div>
    </div>
  );
}

/* ── S13 — 자기회귀 루프 (씬) ───────────────────────────────────────
   문장 스트립(윗변) → 왼변으로 하강 → 네 정거장(①②③④, 아랫변) → 출구 →
   오른변 리턴 레인 → 문장 뒤에 붙는다. 화면에 그려지는 닫힌 사각형이
   곧 자기회귀 루프다.

   시간축이 둘이다. 클릭이 국면을 넘기고(한 바퀴 → 되돌아감 → 수백 바퀴),
   국면 안의 모션은 그 국면이 시작된 순간부터의 경과 시간 t의 순수 함수다.
   기록하는 상태는 "국면이 시작된 t" 하나뿐 — 같은 국면·같은 경과 시간이면
   같은 화면이다. 각 국면의 등장은 3.0초 안에 끝나고 이후는 정착 상태라,
   교사가 어디서 멈춰도 정돈된 한 장으로 선다.

   정거장 점등은 언제나 이동체의 x에서 파생된다(stationsFromX) — 빛과
   이동이 어긋날 수 없다.

   유래: 이 무대는 OpenMontage의 Remotion 컴포지션
   (`remotion-composer/src/LlmLoop.tsx`, id `LlmLoop`)으로 먼저 설계했다.
   전부 SVG + t의 순수 함수라 영상으로 구울 이유가 없어 그대로 덱 안
   실시간 씬으로 옮겼다(Remotion의 frame/fps → useSceneTime, remotion
   interpolate → src/scene interpolate, 하드코딩 팔레트 → 테마 토큰).
   영상판이 다시 필요하면 그 컴포지션을 렌더하면 된다. */

/* 무대 좌표계 — SVG viewBox 1920×1080 */
const STRIP_Y = 396; // 문장 카드 중심 y — 루프의 윗변
const CARD_H = 78;
const STRIP_X0 = 200;
const FEED_X = 150; // 루프의 왼변 — 문장 전체가 기계로 내려가는 길
const PIPE_Y = 655; // 루프의 아랫변 — 네 정거장
const BOX_W = 330;
const BOX_H = 236;
const BOX_X = [230, 608, 986, 1364];
const EXIT_X = 1790; // 루프의 오른변 — 새 조각이 올라오는 길
const BOX_TOP = PIPE_Y - BOX_H / 2;

const LOOP_TECH = ['토큰', '벡터', '어텐션', '확률'];
const LOOP_TOKENS = ['오늘', '아침에', '눈을', '뜨니', '창밖에', '눈이', '펑펑', '내리고', '있었다'];
const CARD_F = 40;
const CARD_GAP = 14;
const body = 'var(--font-body)';

const loopCardW = (s: string) => s.length * CARD_F + 36;

function stripLayout(count: number) {
  const out: { x: number; w: number; t: string }[] = [];
  let x = STRIP_X0;
  for (let i = 0; i < count; i++) {
    const w = loopCardW(LOOP_TOKENS[i]);
    out.push({ x, w, t: LOOP_TOKENS[i] });
    x += w + CARD_GAP;
  }
  return out;
}
function stripEnd(count: number) {
  const l = stripLayout(count);
  return l.length ? l[l.length - 1].x + l[l.length - 1].w : STRIP_X0;
}
/** count번째(0-based) 카드가 놓일 자리의 중심 x */
function slotCenter(count: number) {
  return stripEnd(count) + CARD_GAP + loopCardW(LOOP_TOKENS[count]) / 2;
}
const laneEnd = (count: number) => stripEnd(count) + 24;

/** 다중 키프레임 보간 — 정거장마다 머물렀다 다음 칸으로 건너뛰는 이동에 쓴다 */
function ipk(t: number, ts: number[], xs: number[]): number {
  if (t <= ts[0]) return xs[0];
  for (let i = 1; i < ts.length; i++) {
    if (t <= ts[i]) return interpolate(t, [ts[i - 1], ts[i]], [xs[i - 1], xs[i]]);
  }
  return xs[xs.length - 1];
}

/** 루프 둘레 위의 한 점 — 0 = 문장 왼쪽 갈림, 하강 → 바닥 → 상승 → 상단 복귀 */
function loopPos(u: number, appendX: number) {
  const L1 = PIPE_Y - STRIP_Y;
  const L2 = EXIT_X - FEED_X;
  const L4 = EXIT_X - appendX;
  const total = L1 + L2 + L1 + L4;
  let d = (((u % 1) + 1) % 1) * total;
  if (d < L1) return { x: FEED_X, y: STRIP_Y + d };
  d -= L1;
  if (d < L2) return { x: FEED_X + d, y: PIPE_Y };
  d -= L2;
  if (d < L1) return { x: EXIT_X, y: PIPE_Y - d };
  d -= L1;
  return { x: EXIT_X - d, y: STRIP_Y };
}

/** -1 = 아직 한 번도 안 지남 · 0..1 = 통과 중 · 1 = 완료 */
function stationsFromX(x: number | null, prevDone: boolean) {
  const idle = prevDone ? 1 : -1;
  return BOX_X.map((bx) => {
    if (x === null || x < bx) return idle;
    if (x > bx + BOX_W) return 1;
    return (x - bx) / BOX_W;
  });
}

function LoopArrow({
  x,
  y,
  dir,
  color = 'var(--hair)',
  op = 1,
  s = 11,
}: {
  x: number;
  y: number;
  dir: 'up' | 'down' | 'left' | 'right';
  color?: string;
  op?: number;
  s?: number;
}) {
  const rot = { right: 0, down: 90, left: 180, up: 270 }[dir];
  return (
    <polygon
      points={`${-s},${-s * 0.72} ${s * 0.85},0 ${-s},${s * 0.72}`}
      fill={color}
      opacity={op}
      transform={`translate(${x} ${y}) rotate(${rot})`}
    />
  );
}

function LoopCard({
  cx,
  cy,
  w,
  label,
  p,
  tone,
  dim = 0,
  dash = false,
  dy = 0,
}: {
  cx: number;
  cy: number;
  w: number;
  label: string;
  p: number;
  tone?: string;
  dim?: number;
  dash?: boolean;
  dy?: number;
}) {
  if (p <= 0) return null;
  return (
    <g transform={`translate(${cx} ${cy + dy}) scale(${0.84 + 0.16 * p})`} opacity={Math.min(1, p * 1.5) * (1 - dim * 0.62)}>
      <rect
        x={-w / 2}
        y={-CARD_H / 2}
        width={w}
        height={CARD_H}
        rx={15}
        fill={tone ? `${tone}1f` : 'var(--surface-2)'}
        stroke={dash ? C.rose : tone ?? 'var(--hair)'}
        strokeWidth={tone || dash ? 2.4 : 1.6}
        strokeDasharray={dash ? '7 6' : undefined}
      />
      <text x={0} y={2} textAnchor="middle" dominantBaseline="central" fill={tone ?? 'var(--fg)'} style={{ font: `800 ${CARD_F}px ${body}` }}>
        {label}
      </text>
    </g>
  );
}

type VizP = { vx: number; vy: number; vw: number; vh: number; p: number };

/** ① 자르기 — 낱말 하나가 조각으로 갈라진다 */
function CutViz({ vx, vy, vw, vh, p }: VizP) {
  const cx = vx + vw / 2;
  const cy = vy + vh / 2 - 4;
  const m = interpolate(p, [0.22, 0.44], [0, 1]);
  const gap = interpolate(p, [0.26, 0.66], [0, 19], easeOut);
  const cut = Math.max(0, Math.sin(interpolate(p, [0.2, 0.5], [0, 1]) * Math.PI));
  return (
    <g>
      <g opacity={1 - m}>
        <rect x={cx - 81} y={cy - 31} width={162} height={62} rx={11} fill="var(--surface)" stroke="var(--hair)" strokeWidth={1.5} />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill="var(--fg)" style={{ font: `800 34px ${body}` }}>
          창밖에
        </text>
      </g>
      <g opacity={m}>
        {['창', '밖', '에'].map((piece, k) => (
          <g key={piece} transform={`translate(${cx + (k - 1) * (54 + gap)} ${cy})`}>
            <rect x={-27} y={-31} width={54} height={62} rx={10} fill={`${C.amber}1c`} stroke={C.amber} strokeWidth={1.9} />
            <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fill="var(--fg)" style={{ font: `800 32px ${body}` }}>
              {piece}
            </text>
          </g>
        ))}
      </g>
      {[-1, 1].map((k) => (
        <line key={k} x1={cx + k * 32} y1={cy - 44} x2={cx + k * 32} y2={cy + 44} stroke={C.amber} strokeWidth={2.6} opacity={cut * 0.85} />
      ))}
    </g>
  );
}

/** ② 좌표로 — 조각이 자기 자리(벡터)를 찾아간다 */
function CoordViz({ vx, vy, vw, vh, p }: VizP) {
  const targets = [
    { x: vx + 44, y: vy + 34 },
    { x: vx + 152, y: vy + 96 },
    { x: vx + 240, y: vy + 52 },
  ];
  return (
    <g>
      {Array.from({ length: 28 }, (_, k) => (
        <circle
          key={k}
          cx={vx + 14 + ((k % 7) * (vw - 28)) / 6}
          cy={vy + 16 + (Math.floor(k / 7) * (vh - 32)) / 3}
          r={2.2}
          fill="var(--hair-2)"
        />
      ))}
      {targets.map((tg, k) => {
        const q = interpolate(p, [0.08 + k * 0.13, 0.56 + k * 0.13], [0, 1], easeOut);
        if (q <= 0) return null;
        return (
          <g key={k}>
            <line x1={tg.x} y1={vy + 8} x2={tg.x} y2={vy + vh - 8} stroke={C.sky} strokeWidth={1} opacity={q * 0.28} />
            <line x1={vx + 6} y1={tg.y} x2={vx + vw - 6} y2={tg.y} stroke={C.sky} strokeWidth={1} opacity={q * 0.28} />
            <circle
              cx={vx - 18 + (tg.x - (vx - 18)) * q}
              cy={vy + vh / 2 + (tg.y - (vy + vh / 2)) * q}
              r={5 + 4 * q}
              fill={C.sky}
              opacity={0.35 + 0.65 * q}
            />
          </g>
        );
      })}
    </g>
  );
}

/** ③ 서로 쳐다보기 — 형광펜이 굵을수록 더 본다 */
function AttnViz({ vx, vy, vw, vh, p }: VizP) {
  const ys = vy + vh - 16;
  const xs = [0, 1, 2, 3].map((k) => vx + 34 + (k * (vw - 68)) / 3);
  const fx = xs[3];
  return (
    <g>
      {[0.34, 0.88, 0.55].map((w, k) => {
        const q = interpolate(p, [0.12 + k * 0.16, 0.5 + k * 0.16], [0, 1], easeOut);
        if (q <= 0) return null;
        return (
          <path
            key={k}
            d={`M ${fx} ${ys} Q ${(fx + xs[k]) / 2} ${ys - 34 - w * 62} ${xs[k]} ${ys}`}
            fill="none"
            stroke={C.amber}
            strokeWidth={(4 + w * 17) * q}
            strokeLinecap="round"
            opacity={(0.2 + w * 0.5) * q}
          />
        );
      })}
      {xs.map((x, k) => (
        <circle key={k} cx={x} cy={ys} r={k === 3 ? 10 : 7.5} fill={k === 3 ? C.amber : 'var(--fg-muted)'} />
      ))}
    </g>
  );
}

/** ④ 고르기 — 점수판에서 하나가 뽑힌다 */
function PickViz({ vx, vy, vw, p }: VizP) {
  const rows = [
    { t: '눈이', v: 0.62 },
    { t: '비가', v: 0.21 },
    { t: '바람이', v: 0.09 },
  ];
  const barX = vx + 66;
  const barMax = vw - 124;
  const win = interpolate(p, [0.66, 0.9], [0, 1]);
  return (
    <g>
      {rows.map((r, k) => {
        const y = vy + 14 + k * 42;
        const q = interpolate(p, [0.06 + k * 0.1, 0.5 + k * 0.1], [0, 1], easeOut);
        const tone = k === 0 && win > 0 ? C.lime : 'var(--fg-muted)';
        return (
          <g key={r.t}>
            <text x={vx + 58} y={y + 12} textAnchor="end" dominantBaseline="central" fill={k === 0 ? 'var(--fg)' : 'var(--fg-muted)'} style={{ font: `700 19px ${body}` }}>
              {r.t}
            </text>
            <rect x={barX} y={y} width={barMax} height={24} rx={7} fill="var(--hair-2)" />
            <rect x={barX} y={y} width={barMax * r.v * q} height={24} rx={7} fill={k === 0 ? tone : 'var(--fg-muted)'} opacity={k === 0 ? 0.55 + win * 0.45 : 0.5} />
            <text x={vx + vw - 4} y={y + 12} textAnchor="end" dominantBaseline="central" fill={k === 0 ? tone : 'var(--fg-faint)'} style={{ font: `700 17px ${mono}` }}>
              {Math.round(r.v * 100 * q)}
            </text>
          </g>
        );
      })}
      {win > 0 && <rect x={barX - 6} y={vy + 8} width={barMax + 12} height={36} rx={11} fill="none" stroke={C.lime} strokeWidth={2.4} opacity={win} />}
    </g>
  );
}

function LoopStation({ i, p }: { i: number; p: number }) {
  const bx = BOX_X[i];
  const act = p >= 0 && p < 1;
  const done = p >= 1;
  const pp = Math.max(0, Math.min(1, p));
  const vx = bx + 22;
  const vy = BOX_TOP + 68;
  const vw = BOX_W - 44;
  const vh = 128;
  return (
    <g>
      {act && <rect x={bx - 9} y={BOX_TOP - 9} width={BOX_W + 18} height={BOX_H + 18} rx={26} fill={`${C.amber}12`} />}
      <rect
        x={bx}
        y={BOX_TOP}
        width={BOX_W}
        height={BOX_H}
        rx={20}
        fill={act ? 'var(--surface-2)' : 'var(--surface)'}
        stroke={act ? C.amber : done ? `${C.lime}77` : 'var(--hair-2)'}
        strokeWidth={act ? 2.6 : 1.6}
      />
      <text x={bx + 22} y={BOX_TOP + 40} fill={act ? C.amber : done ? `${C.lime}cc` : 'var(--fg-faint)'} style={{ font: `700 30px ${mono}` }}>
        {STAGES[i].n}
      </text>
      <text x={bx + 60} y={BOX_TOP + 40} fill={act || done ? 'var(--fg)' : 'var(--fg-muted)'} style={{ font: `800 23px ${body}` }}>
        {STAGES[i].label}
      </text>
      <text x={bx + BOX_W - 22} y={BOX_TOP + BOX_H - 20} textAnchor="end" fill="var(--fg-faint)" style={{ font: `700 17px ${mono}`, letterSpacing: '0.08em' }}>
        {LOOP_TECH[i]}
      </text>
      {i === 0 && <CutViz vx={vx} vy={vy} vw={vw} vh={vh} p={pp} />}
      {i === 1 && <CoordViz vx={vx} vy={vy} vw={vw} vh={vh} p={pp} />}
      {i === 2 && <AttnViz vx={vx} vy={vy} vw={vw} vh={vh} p={pp} />}
      {i === 3 && <PickViz vx={vx} vy={vy} vw={vw} vh={vh} p={pp} />}
    </g>
  );
}

type StageProps = {
  cards: { t: string; p: number }[];
  st: number[];
  trav?: { x: number; y: number } | null;
  emit?: { p: number; label: string } | null;
  fly?: { x: number; y: number; label: string } | null;
  solid: number;
  lap: number;
  streak?: number;
  streakU?: number;
  underline?: number;
  flaw?: number;
};

/** 무대 전체 — 세 국면이 같은 기계를 공유한다 */
function LoopStage({ cards, st, trav = null, emit = null, fly = null, solid, lap, streak = 0, streakU = 0, underline = 0, flaw = 0 }: StageProps) {
  const settled = Math.max(1, cards.filter((c) => c.p >= 0.98).length);
  const lay = stripLayout(cards.length);
  const lEnd = laneEnd(settled);
  const inBox = trav ? BOX_X.some((bx) => trav.x > bx - 6 && trav.x < bx + BOX_W + 6) : false;
  const retD = `M ${BOX_X[3] + BOX_W} ${PIPE_Y} H ${EXIT_X - 20} Q ${EXIT_X} ${PIPE_Y} ${EXIT_X} ${PIPE_Y - 20} V ${STRIP_Y + 20} Q ${EXIT_X} ${STRIP_Y} ${EXIT_X - 20} ${STRIP_Y} H ${lEnd}`;
  const retLen = EXIT_X - 20 - (BOX_X[3] + BOX_W) + 32 + (PIPE_Y - 40 - STRIP_Y) + 32 + (EXIT_X - 20 - lEnd);

  return (
    <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      {/* 왼변 — 문장 전체가 기계로 내려가는 길 + 정거장 사이 연결 */}
      <path
        d={`M ${STRIP_X0 - 18} ${STRIP_Y} H ${FEED_X + 20} Q ${FEED_X} ${STRIP_Y} ${FEED_X} ${STRIP_Y + 20} V ${PIPE_Y - 20} Q ${FEED_X} ${PIPE_Y} ${FEED_X + 20} ${PIPE_Y} H ${BOX_X[0] - 16}`}
        fill="none"
        stroke="var(--hair)"
        strokeWidth={2.2}
      />
      <LoopArrow x={BOX_X[0] - 6} y={PIPE_Y} dir="right" />
      {[0, 1, 2].map((k) => (
        <g key={k}>
          <line x1={BOX_X[k] + BOX_W} y1={PIPE_Y} x2={BOX_X[k + 1] - 16} y2={PIPE_Y} stroke="var(--hair)" strokeWidth={2.2} />
          <LoopArrow x={BOX_X[k + 1] - 6} y={PIPE_Y} dir="right" />
        </g>
      ))}

      {/* 오른변 — 새 조각이 올라와 문장 뒤로 돌아가는 길 */}
      <path d={retD} fill="none" stroke="var(--hair-2)" strokeWidth={2.2} strokeDasharray="10 12" opacity={1 - solid * 0.85} />
      {solid > 0 && (
        <path d={retD} fill="none" stroke={C.lime} strokeWidth={2.8} strokeDasharray={retLen} strokeDashoffset={retLen * (1 - solid)} opacity={0.72} />
      )}
      <LoopArrow x={lEnd - 4} y={STRIP_Y} dir="left" color={solid > 0.9 ? C.lime : 'var(--hair)'} op={solid > 0.9 ? 0.8 : 0.55} />

      {/* 가속 잔상 — 빛이 루프를 돈다 */}
      {streak > 0 && (
        <path
          d={`M ${FEED_X} ${STRIP_Y} V ${PIPE_Y} H ${EXIT_X} V ${STRIP_Y} H ${lEnd}`}
          fill="none"
          stroke={C.amber}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray="150 250"
          strokeDashoffset={-streakU * 2400}
          opacity={0.55 * streak}
        />
      )}

      {/* 레인 라벨 */}
      <text x={FEED_X + 26} y={505} fill="var(--fg-faint)" style={{ font: `700 20px ${body}` }}>
        문장 전체
      </text>
      <text x={EXIT_X - 26} y={505} textAnchor="end" fill="var(--fg-faint)" style={{ font: `700 20px ${body}` }}>
        새 조각
      </text>
      {solid > 0.55 && (
        <text
          x={(EXIT_X + lEnd) / 2}
          y={STRIP_Y - 34}
          textAnchor="middle"
          fill={C.lime}
          opacity={interpolate(solid, [0.55, 0.95], [0, 1])}
          style={{ font: `800 21px ${body}` }}
        >
          출력이 다음 입력이 된다
        </text>
      )}

      {/* 네 정거장 */}
      {BOX_X.map((_, i) => (
        <LoopStation key={i} i={i} p={st[i]} />
      ))}

      {/* 문장 스트립 */}
      {lay.map((c, i) => {
        const flawed = flaw > 0 && i > 4;
        return (
          <LoopCard
            key={i}
            cx={c.x + c.w / 2}
            cy={STRIP_Y}
            w={c.w}
            label={c.t}
            p={cards[i].p}
            tone={i === 4 && flaw > 0 ? C.rose : undefined}
            dim={flawed ? flaw : 0}
            dash={flawed && flaw > 0.35}
            dy={flawed ? Math.sin(i * 2.3) * 7 * flaw : 0}
          />
        );
      })}
      {flaw > 0 && lay.length > 5 && (
        <g opacity={interpolate(flaw, [0.1, 0.5], [0, 1])}>
          <circle cx={lay[4].x + lay[4].w / 2} cy={STRIP_Y} r={CARD_H * 0.76} fill="none" stroke={C.rose} strokeWidth={2.6} opacity={0.72} />
          {/* 갈라지는 자리 — 이 조각이 어긋나면 오른쪽은 전부 다시 쓰인다 */}
          <path
            d={`M ${(lay[4].x + lay[4].w + lay[5].x) / 2} ${STRIP_Y - 84} l -11 32 l 11 28 l -11 32 l 11 28 l -11 32`}
            fill="none"
            stroke={C.rose}
            strokeWidth={3.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.9}
          />
        </g>
      )}
      {underline > 0 && (
        <line
          x1={STRIP_X0}
          y1={STRIP_Y + CARD_H / 2 + 30}
          x2={STRIP_X0 + (stripEnd(cards.length) - STRIP_X0) * underline}
          y2={STRIP_Y + CARD_H / 2 + 30}
          stroke={C.lime}
          strokeWidth={5}
          strokeLinecap="round"
          opacity={0.75 * (1 - flaw * 0.82)}
        />
      )}

      {/* 기계를 도는 문장 — 정거장 안에서는 그 방의 그림이 대신 말한다 */}
      {trav && !inBox && (
        <g transform={`translate(${trav.x} ${trav.y})`}>
          <rect x={-56} y={-23} width={112} height={46} rx={14} fill={`${C.amber}26`} stroke={C.amber} strokeWidth={2.2} />
          {[-30, -8, 14].map((dx, k) => (
            <rect key={k} x={dx} y={-7} width={k === 2 ? 28 : 18} height={14} rx={5} fill={C.amber} opacity={0.85} />
          ))}
        </g>
      )}

      {/* 출구에서 갓 나온 조각 */}
      {emit && emit.p > 0 && (
        <g transform={`translate(${EXIT_X} ${PIPE_Y}) scale(${0.7 + 0.3 * emit.p})`} opacity={emit.p}>
          <circle cx={0} cy={0} r={44 + 46 * emit.p} fill="none" stroke={C.lime} strokeWidth={3} opacity={0.55 * (1 - emit.p)} />
          <rect x={-58} y={-31} width={116} height={62} rx={14} fill={`${C.lime}22`} stroke={C.lime} strokeWidth={2.6} />
          <text x={0} y={1} textAnchor="middle" dominantBaseline="central" fill="var(--fg)" style={{ font: `800 34px ${body}` }}>
            {emit.label}
          </text>
        </g>
      )}

      {/* 리턴 레인을 타는 조각 */}
      {fly && (
        <g transform={`translate(${fly.x} ${fly.y})`}>
          <rect x={-58} y={-31} width={116} height={62} rx={14} fill={`${C.lime}26`} stroke={C.lime} strokeWidth={2.6} />
          <text x={0} y={1} textAnchor="middle" dominantBaseline="central" fill="var(--fg)" style={{ font: `800 34px ${body}` }}>
            {fly.label}
          </text>
        </g>
      )}

      {/* 바퀴 계기 */}
      <g transform="translate(1560 848)">
        <rect x={0} y={0} width={272} height={62} rx={16} fill="var(--surface)" stroke="var(--hair-2)" strokeWidth={1.5} />
        <text x={22} y={31} dominantBaseline="central" fill="var(--fg-faint)" style={{ font: `700 21px ${body}` }}>
          바퀴
        </text>
        <text x={250} y={33} textAnchor="end" dominantBaseline="central" fill={lap > 9 ? C.amber : 'var(--fg-muted)'} style={{ font: `800 34px ${mono}` }}>
          {String(Math.round(lap)).padStart(3, '0')}
        </text>
      </g>
    </svg>
  );
}

/* 정거장 통과 키프레임 — 칸 안에서 머물고 칸 사이는 빠르게 건넌다 */
const PIPE_XS = [FEED_X, BOX_X[0], BOX_X[0] + BOX_W, BOX_X[1], BOX_X[1] + BOX_W, BOX_X[2], BOX_X[2] + BOX_W, BOX_X[3], BOX_X[3] + BOX_W, EXIT_X];

/** 국면 1 — 한 바퀴 */
function LoopPhase1({ t }: { t: number }) {
  const cards = LOOP_TOKENS.slice(0, 5).map((tk, i) => ({
    t: tk,
    p: interpolate(t, [0.04 + i * 0.07, 0.32 + i * 0.07], [0, 1], easeOut),
  }));
  const ts = [0.62, 0.7, 1.25, 1.31, 1.8, 1.86, 2.35, 2.41, 2.9, 2.98];

  let trav: StageProps['trav'] = null;
  let x: number | null = null;
  if (t >= 0.4 && t < 0.62) trav = { x: FEED_X, y: interpolate(t, [0.4, 0.62], [STRIP_Y, PIPE_Y], easeInOut) };
  else if (t >= 0.62 && t < 2.98) {
    x = ipk(t, ts, PIPE_XS);
    trav = { x, y: PIPE_Y };
  } else if (t >= 2.98) x = EXIT_X;

  return (
    <LoopStage
      cards={cards}
      st={stationsFromX(x, false)}
      trav={trav}
      emit={{ p: interpolate(t, [2.9, 3.2], [0, 1], easeOut), label: '눈이' }}
      solid={0}
      lap={t > 2.94 ? 1 : 0}
    />
  );
}

/** 국면 2 — 되돌아간다 */
function LoopPhase2({ t }: { t: number }) {
  let fly: StageProps['fly'] = null;
  if (t < 0.36) fly = { x: EXIT_X, y: interpolate(t, [0.1, 0.36], [PIPE_Y, STRIP_Y], easeInOut), label: '눈이' };
  else if (t < 0.76) fly = { x: interpolate(t, [0.36, 0.76], [EXIT_X, slotCenter(5)], easeInOut), y: STRIP_Y, label: '눈이' };

  // 두 번째 바퀴 — 같은 길을 더 빠르게
  const ts = [1.1, 1.16, 1.4, 1.45, 1.66, 1.71, 1.92, 1.97, 2.16, 2.22];
  let trav: StageProps['trav'] = null;
  let x: number | null = null;
  if (t >= 0.9 && t < 1.1) trav = { x: FEED_X, y: interpolate(t, [0.9, 1.1], [STRIP_Y, PIPE_Y], easeInOut) };
  else if (t >= 1.1 && t < 2.22) {
    x = ipk(t, ts, PIPE_XS);
    trav = { x, y: PIPE_Y };
  } else if (t >= 2.22) x = EXIT_X;

  let fly2: StageProps['fly'] = null;
  if (t >= 2.36 && t < 2.56) fly2 = { x: EXIT_X, y: interpolate(t, [2.36, 2.56], [PIPE_Y, STRIP_Y], easeInOut), label: '펑펑' };
  else if (t >= 2.56 && t < 2.92) fly2 = { x: interpolate(t, [2.56, 2.92], [EXIT_X, slotCenter(6)], easeInOut), y: STRIP_Y, label: '펑펑' };

  const cards = [
    ...LOOP_TOKENS.slice(0, 5).map((tk) => ({ t: tk, p: 1 })),
    { t: LOOP_TOKENS[5], p: interpolate(t, [0.7, 0.9], [0, 1], easeOut) },
    { t: LOOP_TOKENS[6], p: interpolate(t, [2.86, 3.04], [0, 1], easeOut) },
  ].filter((c, i) => i < 6 || c.p > 0);

  return (
    <LoopStage
      cards={cards}
      st={stationsFromX(x, true)}
      trav={trav}
      emit={t >= 2.16 && t < 2.4 ? { p: interpolate(t, [2.16, 2.34], [0, 1], easeOut), label: '펑펑' } : null}
      fly={fly ?? fly2}
      solid={interpolate(t, [0.12, 0.8], [0, 1])}
      lap={t < 2.2 ? 1 : 2}
    />
  );
}

/** 국면 3 — 수백 바퀴, 그리고 앞이 어긋나면 */
function LoopPhase3({ t }: { t: number }) {
  // 가속 → 감속. uu = 누적 바퀴 수(잔상 위상 겸 계기 눈금)
  const uu = ipk(t, [0.05, 0.5, 0.9, 1.3, 1.52, 1.66], [0, 1.1, 6.4, 13.6, 17.2, 18]);
  const speed = interpolate(t, [0.05, 0.45], [0, 1]) * (1 - interpolate(t, [1.42, 1.68], [0, 1]));
  const pos = loopPos(uu, laneEnd(9));

  const cards = [
    ...LOOP_TOKENS.slice(0, 7).map((tk) => ({ t: tk, p: 1 })),
    { t: LOOP_TOKENS[7], p: interpolate(t, [0.34, 0.52], [0, 1], easeOut) },
    { t: LOOP_TOKENS[8], p: interpolate(t, [0.68, 0.88], [0, 1], easeOut) },
  ];

  return (
    <LoopStage
      cards={cards}
      st={stationsFromX(speed > 0.05 ? pos.x : null, true)}
      solid={1}
      lap={2 + uu * 23.67}
      streak={speed}
      streakU={uu}
      underline={interpolate(t, [1.62, 2.1], [0, 1], easeOut)}
      flaw={interpolate(t, [2.2, 2.8], [0, 1], easeOut)}
    />
  );
}

const LOOP_CAPTIONS = [
  '문장 전체가 네 방을 지나면 조각 하나가 나온다 — 여기까지가 한 바퀴다.',
  '나온 조각은 문장 뒤에 붙고, 늘어난 문장이 다시 처음으로 들어간다.',
  '긴 답변 하나는 이 바퀴를 수백 번 돈 결과다. 그래서 앞이 어긋나면 뒤가 통째로 어긋난다.',
];

function LoopScene() {
  const t = useSceneTime();
  const { clicks, isStatic, registerMax } = useDeck();
  useEffect(() => {
    registerMax?.(2);
  }, [registerMax]);

  const phase = isStatic ? 2 : Math.min(2, clicks);
  /* 국면이 시작된 t만 기록한다 — 앞으로 가면 그 국면을 처음부터,
     뒤로 가면 이전 국면의 정착 상태(경과 시간이 이미 크다)로 선다. */
  const starts = useRef([0, 0, 0]);
  const shown = useRef(-1);
  if (!isStatic && phase !== shown.current) {
    if (phase > shown.current) starts.current[phase] = t;
    shown.current = phase;
  }
  const local = isStatic ? 4.5 : Math.min(4.5, t - starts.current[phase]);

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* 16:9 무대 박스 — 텍스트 밴드가 SVG 좌표계에 그대로 붙는다 */}
      <div style={{ position: 'relative', width: 'min(100%, calc(100vh * 16 / 9))', aspectRatio: '16 / 9' }}>
        {phase === 0 && <LoopPhase1 t={local} />}
        {phase === 1 && <LoopPhase2 t={local} />}
        {phase === 2 && <LoopPhase3 t={local} />}

        {/* 무대가 비워 둔 상단 좌측 밴드 */}
        <div style={{ position: 'absolute', left: '4.2%', top: '4%', maxWidth: '57%', zIndex: 20, pointerEvents: 'none' }}>
          <div className="kicker" style={{ color: 'var(--primary)', ...riseIn(t, 0.05) }}>
            ⑤ 그리고 처음으로
          </div>
          <h2
            className="headline"
            style={{
              margin: '8px 0 12px',
              maxWidth: '100%',
              fontSize: 'clamp(24px, 2.9vw, 42px)',
              ...kw,
              ...riseIn(t, 0.2),
            }}
          >
            한 조각 쓰고, <span className="accent-text">다시 읽는다</span>
          </h2>
          <AnimatePresence mode="wait">
            <motion.p
              key={phase}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{
                margin: 0,
                color: 'var(--fg-muted)',
                fontWeight: 600,
                fontSize: 'clamp(13px, 1.5vw, 19px)',
                lineHeight: 1.5,
                ...kw,
              }}
            >
              {LOOP_CAPTIONS[phase]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ── S18 — 도면 뜨기 (완성된 글에서 치수를 재고, 그 치수로 다시 짓는다) ──
   씬 메타포: 건축 도면. 완성된 글 위로 치수선이 하나씩 그어지며 항목표가
   채워지고, 글이 사라진 뒤 그 항목표만으로 오른쪽에 새 글이 지어진다.
   항목 이름만 드러내고 값은 물음표로 둔다 — 값을 화면에 적으면 학생이
   찾아낼 것이 남지 않는다. */

const BLUEPRINT_ROWS = [
  { label: '문단 구성', at: 1.0, y: 96, tone: C.amber },
  { label: '문장의 끝', at: 1.5, y: 142, tone: C.lime },
  { label: '길이와 분량', at: 2.0, y: 188, tone: C.sky },
  { label: '들어간 요소', at: 2.5, y: 234, tone: C.violet },
  { label: '마무리 모양', at: 3.0, y: 280, tone: C.rose },
];

/* 문단 블록 하나 — 글줄을 가는 막대로 표현한다 (본문을 읽히려는 그림이 아니다) */
function DocBlock({ x, y, w, lines, opacity, tone }: { x: number; y: number; w: number; lines: number[]; opacity: number; tone: string }) {
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={lines.length * 15 + 14} rx={7} fill="var(--surface-2)" stroke="var(--hair)" strokeWidth={1.2} />
      {lines.map((ratio, i) => (
        <rect key={i} x={x + 11} y={y + 11 + i * 15} width={(w - 22) * ratio} height={6} rx={3} fill={i === 0 ? tone : 'var(--hair-2)'} opacity={i === 0 ? 0.55 : 1} />
      ))}
    </g>
  );
}

function BlueprintScene() {
  const t = useSceneTime();

  const srcIn = spring(t, 0.15, 0.7);
  const fade = interpolate(t, [3.6, 4.3], [1, 0.16]);   // 원문이 흐려진다
  const build = interpolate(t, [4.5, 6.2], [0, 1]);     // 도면으로 다시 짓는다

  const paras = [
    { y: 78, lines: [0.95, 0.88, 0.6] },
    { y: 150, lines: [0.92, 0.97, 0.84, 0.52] },
    { y: 238, lines: [0.9, 0.86, 0.7] },
  ];

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', paddingTop: 'clamp(12px, 2.4vh, 26px)' }}>
        <div className="kicker" style={{ color: 'var(--primary)', ...riseIn(t, 0.05) }}>
          활동의 뼈대 — 재고, 적고, 다시 짓는다
        </div>
        <h2 className="display" style={{ margin: '8px auto 0', ...kw, ...riseIn(t, 0.2) }}>
          완성된 글에서 <span className="accent-text">도면</span>을 뜬다
        </h2>
      </div>

      <div style={{ flex: 1, display: 'grid', placeItems: 'center', minHeight: 0 }}>
        <svg viewBox="0 30 1180 322" style={{ width: 'min(1280px, 97vw)', maxHeight: '58vh', overflow: 'visible' }}>
          {/* 좌측 — 인공지능이 써 준 글 (dominant) */}
          <g>
            <text x={62} y={52} fill="var(--fg-faint)" style={{ font: `700 13px ${mono}` }}>
              A. 받은 글
            </text>
            {paras.map((p, i) => (
              <DocBlock
                key={i}
                x={62}
                y={p.y}
                w={300}
                lines={p.lines}
                tone={C.sky}
                opacity={Math.min(1, spring(t, 0.15 + i * 0.22, 0.7) * 1.2) * fade}
              />
            ))}
            <rect x={54} y={64} width={316} height={272} rx={12} fill="none" stroke={C.sky} strokeWidth={1.6} opacity={srcIn * 0.5 * fade} />
          </g>

          {/* 중앙 — 치수선이 뻗어와 항목표를 채운다 (가로축 중앙을 지난다) */}
          {BLUEPRINT_ROWS.map((r) => {
            const draw = interpolate(t, [r.at, r.at + 0.5], [0, 1]);
            const x0 = 378;
            const x1 = 470;
            return (
              <g key={r.label} opacity={Math.min(1, draw * 1.3)}>
                <line x1={x0} y1={r.y} x2={x0 + (x1 - x0) * draw} y2={r.y} stroke={r.tone} strokeWidth={1.8} strokeDasharray="5 5" />
                <circle cx={x0} cy={r.y} r={3.4} fill={r.tone} />
                <rect x={478} y={r.y - 17} width={268} height={34} rx={9} fill="var(--surface-2)" stroke={`color-mix(in srgb, ${r.tone} 55%, transparent)`} strokeWidth={1.5} />
                <text x={492} y={r.y + 5} fill={r.tone} style={{ font: '800 14px var(--font-body, sans-serif)' }}>
                  {r.label}
                </text>
                <text x={732} y={r.y + 5} textAnchor="end" fill="var(--fg-faint)" style={{ font: `800 17px ${mono}` }}>
                  ?
                </text>
              </g>
            );
          })}
          <text x={478} y={54} fill="var(--fg-faint)" style={{ font: `700 13px ${mono}`, opacity: interpolate(t, [0.9, 1.4], [0, 1]) }}>
            B. 내가 재어 적는 표
          </text>
          <text x={478} y={330} fill="var(--fg-muted)" style={{ font: '700 13.5px var(--font-body, sans-serif)', opacity: interpolate(t, [3.2, 3.8], [0, 1]) }}>
            물음표를 채우는 것이 오늘의 과제다
          </text>

          {/* 우측 — 표만 들고 다시 지은 글 */}
          <g opacity={build}>
            <text x={818} y={52} fill="var(--fg-faint)" style={{ font: `700 13px ${mono}` }}>
              C. 표만 보고 다시 지은 글
            </text>
            {paras.map((p, i) => (
              <DocBlock
                key={i}
                x={818}
                y={p.y}
                w={300}
                lines={p.lines}
                tone={C.lime}
                opacity={Math.min(1, interpolate(t, [4.6 + i * 0.4, 5.3 + i * 0.4], [0, 1]))}
              />
            ))}
            <rect x={810} y={64} width={316} height={272} rx={12} fill="none" stroke={C.lime} strokeWidth={1.6} opacity={0.5} />
          </g>
          <g opacity={interpolate(t, [4.3, 4.9], [0, 1])}>
            <line x1={752} y1={200} x2={800} y2={200} stroke={C.lime} strokeWidth={2.4} />
            <polygon points="812,200 798,193 798,207" fill={C.lime} />
          </g>
        </svg>
      </div>

      <div style={{ flex: 'none', textAlign: 'center', padding: `0 var(--gutter) ${DOCK_SAFE}`, ...riseIn(t, 6.4) }}>
        <span style={{ ...card, display: 'inline-block', padding: '10px 20px', fontWeight: 700, fontSize: 'clamp(13px, 1.5vw, 15.5px)', ...kw }}>
          두 글이 어긋난 자리는 <Mark tone={C.rose}>내가 재지 않고 넘어간 치수</Mark>다.
        </span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */

export default function LlmNextWordDeck() {
  return (
    <Deck>
      {/* S1 타이틀 */}
      <Slide
        center
        nav="제목"
        notes="지난 시간에는 AI가 세상 어디에서 일하는지 봤죠. 오늘은 그중 여러분이 매일 쓰는 것 하나를 뜯어봅니다. 제목 끝에 커서가 깜빡이죠? 저 자리에 무슨 말이 올지 정하는 게 오늘 주제입니다."
      >
        <style>{`
          @keyframes lnwCaret { 0%,45%{opacity:1} 50%,95%{opacity:0.08} 100%{opacity:1} }
          .lnw-caret { animation: lnwCaret 1.15s steps(1,end) infinite; }
          .lnw-range { width:100%; accent-color: var(--primary); height: 26px; cursor: pointer; }
          @media (prefers-reduced-motion: reduce){ .lnw-caret{ animation:none; opacity:1 } }
        `}</style>
        <Reveal>
          <Kicker>인공지능 기초 · 2026-2 · 3단원</Kicker>
        </Reveal>
        <Reveal>
          <h1 className="display" style={{ marginInline: 'auto', marginTop: 14, ...kw }}>
            LLM은 어떻게 <span className="accent-text">다음 말</span>을 고를까
            <span
              className="lnw-caret"
              style={{ display: 'inline-block', width: '0.13em', height: '0.82em', background: C.amber, marginLeft: 12, transform: 'translateY(0.04em)', borderRadius: 2 }}
            />
          </h1>
        </Reveal>
        <Reveal>
          <p className="lead" style={{ marginInline: 'auto', marginTop: 16, ...kw }}>
            챗봇이 무엇을 <strong>아는지</strong>가 아니라, 무엇을 <strong>하는지</strong>를 본다.
          </p>
        </Reveal>
        <Reveal>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 26 }}>
            {[
              { n: '01', q: '국가대표 AI는 왜 점수 1등을 떨어뜨렸나', tone: C.sky },
              { n: '02', q: '기계는 어떻게 다음 말을 고르나', tone: C.amber },
              { n: '03', q: '원하는 결과를 어떻게 얻어내나', tone: C.lime },
            ].map((x) => (
              <span key={x.n} style={{ ...card, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
                <span style={{ fontFamily: mono, fontWeight: 800, fontSize: 13, color: x.tone }}>{x.n}</span>
                <span style={{ fontWeight: 700, fontSize: 'clamp(13px, 1.5vw, 15.5px)', ...kw }}>{x.q}</span>
              </span>
            ))}
          </div>
        </Reveal>
        <Reveal>
          <p style={{ marginInline: 'auto', marginTop: 22, color: 'var(--fg-faint)', fontSize: 13, fontFamily: mono, ...kw }}>
            준비물 — 각자 기기로 라이브 참여 · 종이와 펜
          </p>
        </Reveal>
      </Slide>

      {/* S2 빈칸 채우기 (live ×2) */}
      <Slide
        center
        nav="빈칸 놀이"
        notes="정답을 맞히는 게 아닙니다. 여러분 머릿속에서 뭐가 일어나는지 보려는 거예요. 자, 첫 번째. (① 공개 후) 전부 '오는 말'이죠. 두 번째 갑니다. (② 공개 후) 이번엔 완전히 갈렸네요. 이 차이가 오늘 수업의 첫 번째 열쇠입니다."
      >
        <Reveal>
          <Kicker>다 같이 — 라이브 참여</Kicker>
          <h2 className="headline" style={{ marginInline: 'auto', marginTop: 10, ...kw }}>
            빈칸에 올 말을 <span className="accent-text">한 단어로</span>
          </h2>
        </Reveal>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 2.2vh, 26px)', marginTop: 'clamp(22px, 4vh, 44px)', width: 'min(880px, 100%)', marginInline: 'auto' }}>
          <Build at={1}>
            <div style={{ ...card, padding: 'clamp(20px, 3vh, 34px)', borderColor: `color-mix(in srgb, ${C.amber} 45%, transparent)` }}>
              <div style={{ fontFamily: mono, fontSize: 12.5, fontWeight: 800, color: C.amber, marginBottom: 10 }}>문항 ①</div>
              <div style={{ fontSize: 'clamp(20px, 3.2vw, 38px)', fontWeight: 800, ...kw }}>
                가는 말이 고와야 <Blank width={132} />
              </div>
            </div>
          </Build>
          <Build at={2}>
            <div style={{ ...card, padding: 'clamp(20px, 3vh, 34px)', borderColor: `color-mix(in srgb, ${C.lime} 45%, transparent)` }}>
              <div style={{ fontFamily: mono, fontSize: 12.5, fontWeight: 800, color: C.lime, marginBottom: 10 }}>문항 ②</div>
              <div style={{ fontSize: 'clamp(20px, 3.2vw, 38px)', fontWeight: 800, ...kw }}>
                오늘 아침에 눈을 뜨니 창밖에 <Blank width={132} />
              </div>
            </div>
          </Build>
          <Build at={3}>
            <p style={{ color: 'var(--fg-muted)', fontSize: 'clamp(14px, 1.7vw, 17px)', fontWeight: 700, marginInline: 'auto', ...kw }}>
              왜 첫 번째는 다 같은 답이 나왔고, 두 번째는 갈렸을까?
            </p>
          </Build>
        </div>
      </Slide>

      {/* S3 지형과 구슬 (씬) */}
      <Slide
        full
        nav="확률분포"
        notes="왼쪽이 아까 첫 문장, 오른쪽이 두 번째 문장입니다. 구슬이 여러분 답이에요. 기계 안에서도 똑같은 모양이 만들어집니다. 다만 구슬 대신 숫자로요."
      >
        <Scene>
          <TerrainScene />
        </Scene>
      </Slide>

      {/* S4 국가대표 AI 뉴스 */}
      <Slide
        nav="8월 18일"
        notes="이건 남의 나라 얘기가 아니라 여러분이 낼 세금 얘기입니다. 그리고 지난 8월 18일 발표에서 한 팀이 떨어졌어요. 그런데 떨어진 팀이 좀 이상합니다."
      >
        <div style={{ width: 'min(1180px, 100%)', marginInline: 'auto', display: 'flex', flexWrap: 'wrap', gap: 'clamp(18px, 2.8vw, 40px)', alignItems: 'center' }}>
          <div style={{ flex: '0.85 1 min(280px, 100%)', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Reveal>
              <Kicker>2026. 8. 18. 과기정통부 발표</Kicker>
              <h2 className="headline" style={{ marginTop: 8, ...kw }}>
                국가대표 AI, <span className="accent-text">3파전</span>이 되다
              </h2>
            </Reveal>
            <Build at={1}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[
                  ['5,300억 원', '2027년까지 GPU·데이터·인력 지원'],
                  ['95% 이상', 'GPT·Gemini 등 글로벌 모델 대비 목표 성능'],
                  ['6개월마다', '단계평가로 팀을 줄여 간다'],
                  ['B200 1,000장', '진출 3팀에 하반기 GPU 지원 확대 (상반기 768장)'],
                ].map(([big, small]) => (
                  <div key={big} style={{ ...card, padding: '11px 16px' }}>
                    <div style={{ fontFamily: mono, fontWeight: 800, fontSize: 'clamp(16px, 2vw, 21px)', color: 'var(--primary)' }}>{big}</div>
                    <div style={{ color: 'var(--fg-muted)', fontSize: 12.5, marginTop: 3, ...kw }}>{small}</div>
                  </div>
                ))}
              </div>
            </Build>
          </div>

          <div style={{ flex: '1.2 1 min(340px, 100%)', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Build at={2}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { team: '업스테이지', model: 'Solar Open2', len: 100, pass: true },
                  { team: 'SK텔레콤', model: 'A.X K2', len: 92, pass: true },
                  { team: 'LG AI연구원', model: 'K-EXAONE 2.0', len: 84, pass: true },
                  { team: '모티프테크놀로지스', model: 'Motif 3', len: 76, pass: false },
                ].map((r) => (
                  <div key={r.team} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ flex: 'none', width: 'clamp(96px, 11vw, 138px)', fontWeight: 800, fontSize: 'clamp(12.5px, 1.4vw, 15px)', ...kw }}>{r.team}</span>
                    <span
                      style={{
                        flex: `0 1 calc(${r.len}% - 92px)`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '9px 14px',
                        borderRadius: 999,
                        border: '1px solid var(--hair)',
                        background: 'var(--surface)',
                        minWidth: 0,
                      }}
                    >
                      <span style={{ fontFamily: mono, fontSize: 12.5, fontWeight: 800, color: 'var(--fg-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.model}</span>
                    </span>
                    <Build at={3}>
                      <span
                        style={{
                          flex: 'none',
                          padding: '6px 13px',
                          borderRadius: 999,
                          fontSize: 12.5,
                          fontWeight: 800,
                          color: r.pass ? 'var(--accent-ink)' : 'var(--fg-faint)',
                          background: r.pass ? C.amber : 'transparent',
                          border: `1px solid ${r.pass ? 'transparent' : 'var(--hair)'}`,
                          textDecoration: r.pass ? 'none' : 'line-through',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {r.pass ? '진출' : '탈락'}
                      </span>
                    </Build>
                  </div>
                ))}
              </div>
            </Build>
            <Build at={3}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ ...card, padding: '9px 15px', fontSize: 13, fontWeight: 700, borderColor: `color-mix(in srgb, ${C.lime} 45%, transparent)`, ...kw }}>
                  네 팀 모두 상반기 모델의 <Mark tone={C.lime}>가중치를 공개</Mark>했다 — 누구나 내려받을 수 있다 (라이선스 조건은 모델마다 다르다)
                </span>
                <LinkPill href={NEWS_URL} label="독파모 2차 평가 결과 (ZDNet)" />
              </div>
            </Build>
          </div>
        </div>
      </Slide>

      {/* S5 성적표의 역설 */}
      <Slide
        nav="점수의 역설"
        notes="시험을 제일 잘 본 팀이 떨어졌습니다. 여기서 잠깐 — 여러분이 심사위원이라면 뭘 보고 뽑겠어요? 이 질문, 오늘 마지막에 한 번 더 나옵니다. AI 답을 믿을지 말지 정할 때 똑같은 고민을 하게 되거든요."
      >
        <div style={{ width: 'min(1150px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 2.6vh, 30px)' }}>
          <Reveal>
            <Kicker>탈락한 팀의 성적표</Kicker>
            <h2 className="headline" style={{ marginTop: 8, ...kw }}>
              점수 1등이 <span className="accent-text">왜 떨어졌을까</span>
            </h2>
          </Reveal>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(18px, 3vw, 44px)', alignItems: 'center' }}>
            <Build at={1}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 12.5, color: 'var(--fg-muted)', fontWeight: 700, ...kw }}>
                  Motif 3 · 아티피셜 애널리시스 종합지표
                </span>
                <span style={{ position: 'relative', display: 'inline-block' }}>
                  <span className="figure" style={{ fontFamily: mono, fontWeight: 800, fontSize: 'clamp(52px, 8.5vw, 104px)', lineHeight: 0.95, color: 'var(--primary)' }}>
                    47
                  </span>
                  <span style={{ fontSize: 'clamp(16px, 2vw, 22px)', fontWeight: 800, color: 'var(--fg-muted)', marginLeft: 6 }}>점</span>
                  <Build at={3}>
                    <span
                      style={{
                        position: 'absolute',
                        left: -8,
                        right: -22,
                        top: '52%',
                        height: 6,
                        background: C.rose,
                        borderRadius: 3,
                        transform: 'rotate(-7deg)',
                      }}
                    />
                  </Build>
                </span>
                <span style={{ padding: '5px 13px', borderRadius: 999, background: 'var(--accent)', color: 'var(--accent-ink)', fontWeight: 800, fontSize: 12.5 }}>
                  네 팀 중 1위
                </span>
              </div>
            </Build>

            <Build at={2}>
              <div style={{ flex: '1 1 min(340px, 100%)', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 800, ...kw }}>그런데 단계평가 배점은 —</span>
                <div style={{ display: 'flex', height: 46, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--hair)' }}>
                  {[
                    { label: '벤치마크', n: 40, tone: C.sky },
                    { label: '전문가', n: 35, tone: C.violet },
                    { label: '사용자', n: 25, tone: C.amber },
                  ].map((seg) => (
                    <span
                      key={seg.label}
                      style={{
                        flex: seg.n,
                        display: 'grid',
                        placeItems: 'center',
                        background: `color-mix(in srgb, ${seg.tone} 22%, transparent)`,
                        borderRight: '1px solid var(--hair)',
                        fontWeight: 800,
                        fontSize: 'clamp(11.5px, 1.3vw, 14px)',
                        color: seg.tone,
                        ...kw,
                      }}
                    >
                      {seg.label} {seg.n}
                    </span>
                  ))}
                </div>
                <div style={{ ...card, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, width: 132, flex: 'none' }}>
                    {Array.from({ length: 40 }, (_, i) => (
                      <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: C.amber, opacity: 0.75 }} />
                    ))}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, minWidth: 0, ...kw }}>
                    사용자 평가에는 <Mark tone={C.amber}>일반 국민 185명</Mark>과 AI 전문 사용자 49명이 직접 써 보고 매긴 점수가 들어간다 (국민평가단 200명 중 185명 응답)
                  </span>
                </div>
              </div>
            </Build>
          </div>

          <Build at={3}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ color: 'var(--fg-muted)', fontSize: 'clamp(13px, 1.5vw, 15.5px)', lineHeight: 1.7, ...kw }}>
                과기정통부: “3개 평가 영역별 <strong style={{ color: 'var(--fg)' }}>1위 팀이 모두 달랐고</strong>, 일관되게 1위인 팀은 없었다.”
              </p>
              <div
                style={{
                  padding: 'clamp(14px, 2vh, 20px) clamp(16px, 2.4vw, 26px)',
                  borderRadius: 14,
                  border: `2px solid color-mix(in srgb, ${C.amber} 60%, transparent)`,
                  background: `color-mix(in srgb, ${C.amber} 8%, transparent)`,
                  textAlign: 'center',
                }}
              >
                <span style={{ fontWeight: 900, fontSize: 'clamp(17px, 2.4vw, 26px)', ...kw }}>
                  그럼 <span style={{ color: C.amber }}>좋은 AI</span>는 무엇으로 재야 할까?
                </span>
              </div>
            </div>
          </Build>
        </div>
      </Slide>

      {/* S6 LLM 지도 */}
      <Slide
        nav="LLM 지도"
        notes="여기서 중요한 건 이름 외우기가 아닙니다. '이 모델은 어느 칸에 있나'를 묻는 습관이에요. 무료로 쓰는 AI가 어느 칸에 있는지 알면, 내 데이터가 어디로 가는지도 짐작할 수 있습니다."
      >
        <div style={{ width: 'min(1150px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 2vh, 22px)' }}>
          <Reveal>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <Kicker>세상의 LLM을 두 축으로</Kicker>
                <h2 className="headline" style={{ marginTop: 8, ...kw }}>
                  열려 있나, <span className="accent-text">누가 돈을 대나</span>
                </h2>
              </div>
              <span style={{ fontSize: 12.5, color: 'var(--fg-muted)', fontWeight: 700, ...kw }}>
                가로 → 공개 여부 · 세로 ↓ 누가 돈을 대는가
              </span>
            </div>
          </Reveal>

          <Reveal>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '0.82fr 1.18fr',
                gridTemplateRows: '0.85fr 1.15fr',
                gap: 10,
                minHeight: 'min(46vh, 420px)',
              }}
            >
              {[
                {
                  key: 'a',
                  head: '닫힘 · 민간',
                  desc: '가중치 비공개 — 서비스로만 쓴다',
                  tone: C.sky,
                  logos: ['assets/external/openai.png', 'assets/external/gemini.png', 'assets/external/anthropic.svg'],
                  chips: ['HyperCLOVA X'],
                },
                {
                  key: 'b',
                  head: '열림 · 민간',
                  desc: '내려받아 직접 돌릴 수 있다',
                  tone: C.violet,
                  logos: [],
                  chips: ['Llama', 'Qwen', 'DeepSeek', 'Mistral', 'EXAONE'],
                },
                {
                  key: 'c',
                  head: '닫힘 · 국가 지원',
                  desc: '유독 비어 있는 칸 — 왜일까?',
                  tone: C.dim,
                  logos: [],
                  chips: [],
                  empty: true,
                },
                {
                  key: 'd',
                  head: '열림 · 국가 지원',
                  desc: '독자 AI 파운데이션 모델 — 세금으로 만들어 모두에게 공개',
                  tone: C.amber,
                  logos: [],
                  chips: ['Solar Open2', 'A.X K2', 'K-EXAONE 2.0', 'Motif 3'],
                  hero: true,
                  foot: '이 칸이 오늘의 주인공이다 — 우리가 낸 세금으로 만들어 누구나 내려받을 수 있는 모델. 이틀 전 여기서 세 팀이 살아남았다.',
                },
              ].map((q) => (
                <div
                  key={q.key}
                  style={{
                    ...card,
                    padding: 'clamp(12px, 1.7vw, 20px)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 9,
                    borderColor: q.hero ? `color-mix(in srgb, ${q.tone} 60%, transparent)` : 'var(--hair)',
                    background: q.hero ? `color-mix(in srgb, ${q.tone} 7%, var(--surface-2))` : q.empty ? 'transparent' : 'var(--surface-2)',
                    borderStyle: q.empty ? 'dashed' : 'solid',
                    opacity: q.empty ? 0.75 : 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: 'clamp(13.5px, 1.6vw, 17px)', color: q.tone, ...kw }}>{q.head}</span>
                    <span style={{ fontSize: 11.5, color: 'var(--fg-faint)', ...kw }}>{q.desc}</span>
                  </div>
                  {q.logos.length > 0 && (
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      {q.logos.map((src) => (
                        <img
                          key={src}
                          src={src}
                          alt=""
                          style={{ height: 'clamp(22px, 2.6vw, 30px)', width: 'auto', opacity: 0.92 }}
                        />
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                    {q.chips.map((c) => (
                      <span
                        key={c}
                        style={{
                          padding: q.hero ? '7px 14px' : '5px 11px',
                          borderRadius: 999,
                          border: `1.5px solid color-mix(in srgb, ${q.tone} ${q.hero ? 65 : 40}%, transparent)`,
                          fontSize: q.hero ? 'clamp(12.5px, 1.5vw, 15px)' : 12,
                          fontWeight: 800,
                          fontFamily: mono,
                          color: q.hero ? q.tone : 'var(--fg-muted)',
                        }}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                  {q.empty && (
                    <span style={{ margin: 'auto', fontSize: 'clamp(24px, 3.4vw, 40px)', color: 'var(--fg-faint)', fontFamily: mono }}>?</span>
                  )}
                  {q.foot && (
                    <span style={{ marginTop: 'auto', paddingTop: 8, color: 'var(--fg-muted)', fontSize: 'clamp(11.5px, 1.3vw, 13.5px)', lineHeight: 1.6, ...kw }}>
                      {q.foot}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal>
            <p style={{ color: 'var(--fg-muted)', fontSize: 'clamp(12.5px, 1.45vw, 15px)', lineHeight: 1.65, ...kw }}>
              <strong style={{ color: 'var(--fg)' }}>소버린 AI</strong> — 남의 모델을 빌려 쓰면 값도, 규칙도, 중단 여부도 남이 정한다.
              그래서 세금을 들여 우리 모델을 만든다. (EXAONE은 상용판과 국가 프로젝트판이 함께 있다 — 같은 뿌리, 다른 자리)
            </p>
          </Reveal>
        </div>
      </Slide>

      {/* S7 껍데기 벗기기 (씬) */}
      <Slide
        full
        nav="네 단계"
        notes="GPT든 우리나라 모델이든, 껍데기만 다릅니다. 지금부터 네 단계를 하나씩 만져 볼 거예요. 화면 아래 눈금 보이시죠? 우리가 어디쯤 왔는지 계속 알려줄 겁니다."
      >
        <Scene>
          <PeelScene />
        </Scene>
      </Slide>

      {/* S8 ① 자르기 (위젯 W1) */}
      <Slide
        nav="① 자르기"
        notes="여러분이 한글로 질문하면 영어로 물을 때보다 돈이 더 듭니다. 진짜예요. 그리고 이게 아까 5,300억 원짜리 사업의 이유 중 하나입니다."
      >
        <div style={{ width: 'min(1150px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 2vh, 20px)' }}>
          <Reveal>
            <StageMeter active={1} />
          </Reveal>
          <Reveal>
            <h2 className="headline" style={{ ...kw }}>
              기계는 글자가 아니라 <span className="accent-text">조각</span>으로 읽는다
            </h2>
          </Reveal>
          <Build at={1}>
            <p style={{ color: 'var(--fg-muted)', fontSize: 'clamp(13px, 1.5vw, 15.5px)', lineHeight: 1.7, ...kw }}>
              토큰 = 기계가 읽는 최소 조각. 단어일 수도, 글자 일부일 수도 있다.
              같은 뜻을 한국어와 영어로 넣으면 <strong style={{ color: 'var(--fg)' }}>조각 수가 다르다.</strong>
            </p>
          </Build>
          <Build at={2}>
            <TokenLab />
          </Build>
          <Build at={3}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'stretch' }}>
              {[
                ['비용', '같은 말을 하는 데 돈이 더 든다'],
                ['기억', '한 번에 다룰 수 있는 분량이 줄어든다'],
                ['품질', '조각이 잘게 부서질수록 뜻을 잡기 어렵다'],
              ].map(([h, d]) => (
                <span key={h} style={{ ...card, flex: '1 1 min(210px, 100%)', padding: '11px 16px' }}>
                  <span style={{ display: 'block', fontWeight: 800, fontSize: 13.5, color: C.rose }}>{h}</span>
                  <span style={{ display: 'block', color: 'var(--fg-muted)', fontSize: 12.5, marginTop: 3, ...kw }}>{d}</span>
                </span>
              ))}
              <span
                style={{
                  flex: '1.4 1 min(260px, 100%)',
                  padding: '11px 16px',
                  borderRadius: 16,
                  border: `1.5px dashed color-mix(in srgb, ${C.amber} 60%, transparent)`,
                  background: `color-mix(in srgb, ${C.amber} 7%, transparent)`,
                  fontWeight: 800,
                  fontSize: 13.5,
                  display: 'grid',
                  alignItems: 'center',
                  ...kw,
                }}
              >
                조각 사전이 영어에 맞춰져 있어 한국어가 더 잘게 부서진다. 그래서 <span style={{ color: C.amber }}>한국어를 잘 다루는 우리 모델이 필요하다</span>
              </span>
            </div>
          </Build>
          <Build at={3}>
            <LinkPill href={TOKENIZER_URL} label="내 문장은 몇 조각일까 — tiktokenizer" />
          </Build>
        </div>
      </Slide>

      {/* S9 서가 (씬) */}
      <Slide
        full
        nav="② 좌표로"
        notes="여기까지는 사전 만들기예요. 그런데 마지막 카드 보세요 — '배'가 자리를 못 찾고 멈췄죠? 배가 세 가지 뜻이잖아요. 이 문제를 다음 단계가 해결합니다."
      >
        <Scene>
          <ShelfScene />
        </Scene>
      </Slide>

      {/* S10 이 '배'는 무슨 배일까 (live) */}
      <Slide
        center
        nav="배 문제"
        notes="정답을 맞히는 문제가 아니라 여러분 머릿속을 스캔하는 문제예요. '타고'를 고른 사람이 많죠? 기계도 똑같이 합니다 — 어느 말을 볼지 정하는 것, 그게 다음 단계입니다."
      >
        <Reveal>
          <Kicker>라이브 문항 — 정답보다 분포가 중요하다</Kicker>
        </Reveal>
        <Reveal>
          <div style={{ ...card, padding: 'clamp(24px, 4vh, 46px)', marginTop: 20, width: 'min(940px, 100%)', marginInline: 'auto' }}>
            <div style={{ fontSize: 'clamp(19px, 3vw, 36px)', fontWeight: 800, lineHeight: 1.55, ...kw }}>
              밤에{' '}
              <span style={{ color: C.amber, position: 'relative' }}>
                배<sup style={{ fontSize: '0.5em', fontFamily: mono }}>①</sup>
              </span>
              를 타고 가다가{' '}
              <span style={{ color: 'var(--fg-muted)' }}>
                배<sup style={{ fontSize: '0.5em', fontFamily: mono }}>②</sup>
              </span>
              가 고파서{' '}
              <span style={{ color: 'var(--fg-muted)' }}>
                배<sup style={{ fontSize: '0.5em', fontFamily: mono }}>③</sup>
              </span>
              를 먹었다.
            </div>
          </div>
        </Reveal>
        <Reveal>
          <p className="lead" style={{ marginInline: 'auto', marginTop: 24, ...kw }}>
            <strong style={{ color: C.amber }}>①번 ‘배’</strong>가 무슨 뜻인지, 여러분은 어느 말을 보고 알았나요?
          </p>
        </Reveal>
        <Reveal>
          <p style={{ marginInline: 'auto', marginTop: 12, color: 'var(--fg-faint)', fontSize: 13, ...kw }}>
            글자는 셋 다 똑같다. 그런데 뜻은 갈린다 — 무엇이 뜻을 정했을까.
          </p>
        </Reveal>
      </Slide>

      {/* S11 어텐션 하이라이터 (위젯 W2) */}
      <Slide
        nav="③ 쳐다보기"
        notes="여러분이 형광펜으로 칠한 것과 기계가 칠하는 것이 거의 같습니다. 여기서 하나만 기억하세요 — 기계는 '배'의 뜻을 사전에서 찾는 게 아니라 옆 단어를 보고 그 자리에서 정합니다."
      >
        <div style={{ width: 'min(1120px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 2.2vh, 24px)', textAlign: 'center' }}>
          <Reveal>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <StageMeter active={3} />
            </div>
            <h2 className="headline" style={{ marginTop: 12, marginInline: 'auto', ...kw }}>
              기계의 <span className="accent-text">형광펜</span>
            </h2>
          </Reveal>
          <Build at={1}>
            <p style={{ color: 'var(--fg-muted)', fontSize: 'clamp(13px, 1.5vw, 15.5px)', lineHeight: 1.7, marginInline: 'auto', ...kw }}>
              낱말마다 “나는 어느 말을 봐야 하는가”를 정하고, <strong style={{ color: 'var(--fg)' }}>본 만큼 뜻이 섞여 들어간다.</strong>
              {' '}방금 여러분이 고른 답과 비교해 보자.
            </p>
          </Build>
          <Build at={2}>
            <AttentionLab />
          </Build>
          <Build at={3}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'stretch' }}>
              <div style={{ ...card, flex: '1.5 1 min(300px, 100%)', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 7 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: C.violet, fontFamily: mono }}>한국어의 특징</span>
                <span style={{ fontWeight: 700, fontSize: 'clamp(13.5px, 1.6vw, 16px)', ...kw }}>
                  철수<Mark tone={C.violet}>가</Mark> 영희<Mark tone={C.violet}>를</Mark> 좋아한다
                </span>
                <span style={{ fontWeight: 700, fontSize: 'clamp(13.5px, 1.6vw, 16px)', ...kw }}>
                  영희<Mark tone={C.violet}>를</Mark> 철수<Mark tone={C.violet}>가</Mark> 좋아한다
                </span>
                <span style={{ color: 'var(--fg-muted)', fontSize: 12.5, ...kw }}>
                  순서를 바꿔도 뜻이 같다 — 자리보다 <strong style={{ color: 'var(--fg)' }}>조사</strong>가 역할을 말해 준다.
                  영어(Chulsoo likes Younghee)는 순서가 뒤집히면 뜻이 뒤집힌다.
                </span>
              </div>
              <div
                style={{
                  ...card,
                  flex: '0.9 1 min(240px, 100%)',
                  textAlign: 'left',
                  borderStyle: 'dashed',
                  display: 'grid',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: 'var(--fg-muted)', fontSize: 13, lineHeight: 1.65, ...kw }}>
                  계산 방법(Q·K·V, 행렬곱)은 오늘 다루지 않는다. 오늘 알 것은
                  <strong style={{ color: 'var(--fg)' }}> “어디를 보는지 정하고, 본 만큼 뜻이 정해진다”</strong>까지다.
                </span>
              </div>
            </div>
          </Build>
        </div>
      </Slide>

      {/* S12 점수판 + 온도 (위젯 W3) */}
      <Slide
        nav="④ 고르기"
        notes="여러분이 챗GPT에 같은 걸 두 번 물었는데 다르게 답한 적 있죠? 이 손잡이 때문입니다. 자, 온도를 확 올려 볼게요. 이제 '고양이가'가 뽑힐 수도 있어요. 창밖에 고양이. 말은 되네요."
      >
        <div style={{ width: 'min(1150px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 2vh, 20px)' }}>
          <Reveal>
            <StageMeter active={4} />
          </Reveal>
          <Reveal>
            <h2 className="headline" style={{ ...kw }}>
              점수판과 <span className="accent-text">손잡이</span>
            </h2>
          </Reveal>
          <Build at={1}>
            <NextWordLab />
          </Build>
          <Build at={2}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { h: '온도를 낮추면', d: '골짜기가 깊어진다 — 늘 같은 답', tone: C.sky },
                { h: '온도를 높이면', d: '들판이 평평해진다 — 엉뚱한 답까지', tone: C.rose },
                { h: '왜 1등만 안 뽑나', d: '늘 같은 문장만 나오면 글이 딱딱해진다', tone: C.violet },
              ].map((x) => (
                <span key={x.h} style={{ ...card, flex: '1 1 min(230px, 100%)', padding: '11px 16px' }}>
                  <span style={{ display: 'block', fontWeight: 800, fontSize: 13.5, color: x.tone, ...kw }}>{x.h}</span>
                  <span style={{ display: 'block', color: 'var(--fg-muted)', fontSize: 12.5, marginTop: 3, ...kw }}>{x.d}</span>
                </span>
              ))}
            </div>
          </Build>
          <Build at={3}>
            <div
              style={{
                padding: 'clamp(12px, 1.8vh, 18px) clamp(16px, 2.4vw, 26px)',
                borderRadius: 14,
                border: `2px solid color-mix(in srgb, ${C.amber} 55%, transparent)`,
                textAlign: 'center',
                fontWeight: 800,
                fontSize: 'clamp(14.5px, 1.9vw, 19px)',
                ...kw,
              }}
            >
              같은 질문에 다른 답이 나오는 것은 <span style={{ color: C.amber }}>고장이 아니라 설계</span>다.
            </div>
          </Build>
        </div>
      </Slide>

      {/* S13 자기회귀 루프 (씬 — 클릭이 국면을 넘긴다) */}
      <Slide
        full
        nav="⑤ 반복"
        notes="국면 셋: 한 바퀴 → 되돌아감 → 수백 바퀴. 클릭으로 넘깁니다. 앞이 틀어지면 뒤가 다 틀어집니다. 그래서 첫 단추, 즉 여러분이 넣는 문장이 결정적이에요. 이따 그걸 직접 훈련합니다."
      >
        <Scene>
          <LoopScene />
        </Scene>
      </Slide>

      {/* S14 아는 게 아니라 고른다 */}
      <Slide
        nav="아는 게 아니라"
        notes="오늘 배운 걸 한 문장으로 줄이면 이겁니다 — AI는 아는 게 아니라 고릅니다. 그러니까 답이 자신 있어 보여도 그건 자신감이 아니라 확률이에요. 이제 이 기계에서 원하는 걸 뽑아내는 훈련으로 넘어갑니다."
      >
        <div style={{ width: 'min(1150px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 2.4vh, 26px)' }}>
          <Reveal>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div>
                <Kicker>1부 정리</Kicker>
                <h2 className="headline" style={{ marginTop: 8, ...kw }}>
                  AI는 아는 게 아니라 <span className="accent-text">고른다</span>
                </h2>
              </div>
              <Build at={1}>
                <StageMeter active={0} note="완주" />
              </Build>
            </div>
          </Reveal>

          <Build at={2}>
            <div style={{ display: 'flex', gap: 'clamp(14px, 2.4vw, 30px)', alignItems: 'center', flexWrap: 'wrap' }}>
              <div
                style={{
                  flex: '1.7 1 min(320px, 100%)',
                  padding: 'clamp(20px, 3vh, 34px)',
                  borderRadius: 18,
                  border: `2px solid color-mix(in srgb, ${C.amber} 55%, transparent)`,
                  background: `color-mix(in srgb, ${C.amber} 7%, transparent)`,
                }}
              >
                <div style={{ fontWeight: 900, fontSize: 'clamp(20px, 2.8vw, 32px)', color: C.amber, ...kw }}>그럴듯한 말</div>
                <p style={{ color: 'var(--fg-muted)', fontSize: 13.5, marginTop: 8, lineHeight: 1.6, ...kw }}>
                  네 단계가 하는 일은 “다음에 올 말로 그럴듯한 것”을 고르는 것이다.
                </p>
              </div>
              <span style={{ fontSize: 'clamp(28px, 4vw, 46px)', color: 'var(--fg-faint)', fontFamily: mono }}>≠</span>
              <div style={{ flex: '1 1 min(220px, 100%)', ...card, padding: 'clamp(16px, 2.4vh, 26px)' }}>
                <div style={{ fontWeight: 900, fontSize: 'clamp(17px, 2.2vw, 24px)', ...kw }}>사실</div>
                <p style={{ color: 'var(--fg-muted)', fontSize: 13.5, marginTop: 8, lineHeight: 1.6, ...kw }}>
                  네 단계 어디에도 <strong style={{ color: C.rose }}>사실을 확인하는 칸은 없었다.</strong>{' '}
                  자신 있게 틀린 답이 나오는 이유다.
                </p>
              </div>
            </div>
          </Build>

          <Build at={3}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ ...card, flex: '1.2 1 min(300px, 100%)', padding: '12px 18px', fontSize: 13.5, fontWeight: 700, ...kw }}>
                그래서 <Mark tone={C.amber}>‘좋은 AI’를 점수 하나로 정할 수 없다</Mark> — 써 보고 판단하는 몫이 사람에게 남는다. (S5의 그 질문)
              </span>
              <a
                href={TE_URL}
                target="_blank"
                rel="noopener"
                style={{ ...card, flex: '1 1 min(280px, 100%)', padding: '12px 18px', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 4, borderColor: `color-mix(in srgb, ${C.sky} 45%, transparent)` }}
              >
                <span style={{ fontWeight: 800, fontSize: 13.5, color: C.sky, textDecoration: 'underline', textUnderlineOffset: 3.5 }}>
                  더 깊이 — Transformer Explainer ↗
                </span>
                <span style={{ color: 'var(--fg-muted)', fontSize: 12, ...kw }}>
                  진짜 모델(GPT-2)이 도는 걸 그대로 볼 수 있다. <strong style={{ color: C.rose }}>영어 문장으로 넣을 것</strong> — 한글은 조각이 잘게 부서져 화면이 읽히지 않는다.
                </span>
              </a>
            </div>
          </Build>
        </div>
      </Slide>

      {/* S15 오늘의 규칙 */}
      <Slide
        nav="활동 규칙"
        notes="5분 동안 아무것도 못 떠올려도 괜찮습니다. 그 5분이 뇌를 켜 두는 시간이에요. 종이는 걷습니다."
      >
        <div style={{ width: 'min(1240px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 2.6vh, 28px)', textAlign: 'center' }}>
          <Reveal>
            <Kicker>2부 — 글의 설계도 되찾기</Kicker>
            <h2 className="headline" style={{ marginTop: 8, marginInline: 'auto', ...kw }}>
              켜고, <span className="accent-text">끄고</span>, 켜고, 끈다
            </h2>
          </Reveal>
          <div style={{ display: 'flex', gap: 'clamp(10px, 1.5vw, 18px)', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-end', textAlign: 'left' }}>
            {[
              { at: 1, min: '3분', h: 'AI 켜기 — A', d: '주제를 고르고 글을 한 편 받는다. 여기까지만 쓰고 곧바로 닫는다.', tone: C.sky, lift: 0, off: false },
              { at: 2, min: '12분', h: 'AI 끄기 — B', d: '받은 글을 혼자 읽는다. 물어서 얻은 답은 내 문해력이 아니다.', tone: C.rose, lift: 30, off: true },
              { at: 3, min: '17분', h: 'AI 켜기 — C·D', d: '찾아낸 규칙만으로 프롬프트를 쓰고, 두 번 복원해 본다.', tone: C.amber, lift: 60, off: false },
              { at: 3, min: '5분', h: 'AI 끄기 — E', d: '다시 닫고, 내가 못 보고 지나친 것을 자기 말로 적는다.', tone: C.lime, lift: 90, off: true },
            ].map((r) => (
              <Build key={r.h} at={r.at}>
                <div
                  style={{
                    ...card,
                    width: 'min(266px, 86vw)',
                    marginBottom: `clamp(0px, ${r.lift / 10}vh, ${r.lift}px)`,
                    borderColor: `color-mix(in srgb, ${r.tone} ${r.off ? 45 : 70}%, transparent)`,
                    background: r.off ? 'var(--surface-2)' : `color-mix(in srgb, ${r.tone} 8%, var(--surface-2))`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: mono, fontWeight: 800, fontSize: 19, color: r.tone }}>{r.min}</span>
                    <span style={{ fontSize: 16 }}>{r.off ? '🔌' : '⚡'}</span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 'clamp(15.5px, 1.8vw, 18px)', ...kw }}>{r.h}</div>
                  <p style={{ color: 'var(--fg-muted)', fontSize: 13, lineHeight: 1.6, ...kw }}>{r.d}</p>
                </div>
              </Build>
            ))}
          </div>
          <Build at={3}>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ ...card, padding: '10px 16px', fontSize: 13, fontWeight: 700, borderColor: `color-mix(in srgb, ${C.rose} 45%, transparent)`, ...kw }}>
                가운데 12분이 <Mark tone={C.rose}>오늘의 본체</Mark>다. 그 칸이 비면 뒤의 복원은 찍기가 된다.
              </span>
              <span style={{ fontSize: 12, color: 'var(--fg-faint)', ...kw }}>
                근거: AI로 에세이를 쓴 집단은 도구 없이 쓸 때 자기가 쓴 글을 정확히 인용하기 어려워했다 (MIT 미디어랩, 54명 사전연구 · 동료심사 전)
              </span>
            </div>
          </Build>
        </div>
      </Slide>

      {/* S16 내가 정한 것과 AI가 정한 것 */}
      <Slide
        nav="문제 소개"
        notes="여러분이 정한 건 주제 한 줄뿐입니다. 그런데 글은 완성돼서 나와요. 문단을 몇 개로 할지, 말을 어떻게 맺을지, 누가 정했을까요? 아무도 안 시켰는데 기계가 확률로 골라 버린 겁니다. 오늘은 그걸 되찾아 옵니다."
      >
        <div style={{ width: 'min(1160px, 100%)', marginInline: 'auto', display: 'flex', flexWrap: 'wrap', gap: 'clamp(16px, 2.6vw, 32px)', alignItems: 'center' }}>
          <div style={{ flex: '1 1 100%' }}>
            <Reveal>
              <Kicker>2부 · 오늘의 과제</Kicker>
              <h2 className="headline" style={{ marginTop: 8, ...kw }}>
                내가 정한 것은 <span className="accent-text">한 줄뿐이었다</span>
              </h2>
            </Reveal>
          </div>

          {/* 좌측 — 내가 준 것 (작게) */}
          <div style={{ flex: '0 1 min(300px, 100%)', minWidth: 0 }}>
            <Reveal>
              <div style={{ ...card, padding: 'clamp(14px, 2vw, 20px)', display: 'flex', flexDirection: 'column', gap: 9, borderColor: `color-mix(in srgb, ${C.sky} 50%, transparent)` }}>
                <span style={{ fontSize: 11.5, fontFamily: mono, color: 'var(--fg-faint)' }}>내가 준 것</span>
                <span style={{ fontSize: 'clamp(14px, 1.7vw, 16px)', fontWeight: 700, color: C.sky, ...kw }}>
                  “청소년의 소셜미디어 사용을 주제로 글을 써 줘”
                </span>
                <span style={{ fontSize: 12, color: 'var(--fg-faint)', ...kw }}>한 문장, 그것이 전부다</span>
              </div>
            </Reveal>
          </div>

          <div style={{ flex: 'none', display: 'grid', placeItems: 'center' }}>
            <Reveal>
              <span style={{ fontSize: 'clamp(26px, 3.4vw, 38px)', color: C.amber, lineHeight: 1 }}>→</span>
            </Reveal>
          </div>

          {/* 우측 — 기계가 알아서 정해 버린 것 (dominant) */}
          <div style={{ flex: '1 1 min(320px, 100%)', minWidth: 0 }}>
            <Reveal>
              <div style={{ ...card, padding: 'clamp(14px, 2vw, 22px)', display: 'flex', flexDirection: 'column', gap: 11, borderColor: `color-mix(in srgb, ${C.amber} 55%, transparent)`, background: `color-mix(in srgb, ${C.amber} 5%, var(--surface-2))` }}>
                <span style={{ fontSize: 11.5, fontFamily: mono, color: 'var(--fg-faint)' }}>기계가 알아서 정해 버린 것</span>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {['문단을 몇 개로 할지', '문장을 어떻게 맺을지', '얼마나 길게 쓸지', '무엇을 반드시 넣을지', '어떻게 끝맺을지'].map((h) => (
                    <span
                      key={h}
                      style={{
                        padding: '7px 13px',
                        borderRadius: 999,
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: C.amber,
                        border: `1.5px dashed color-mix(in srgb, ${C.amber} 50%, transparent)`,
                        ...kw,
                      }}
                    >
                      {h}
                    </span>
                  ))}
                </div>
                <span style={{ fontSize: 12.5, color: 'var(--fg-muted)', ...kw }}>
                  아무도 시키지 않았다. <Mark tone={C.amber}>확률이 높은 쪽으로 골랐을 뿐</Mark>이다.
                </span>
              </div>
            </Reveal>
          </div>

          <div style={{ flex: '1 1 100%' }}>
            <Reveal>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
                {[
                  ['오늘 할 일', '기계가 대신 정한 그 항목들을 찾아내 말로 되찾아 온다'],
                  ['혼자 읽는 구간', '찾는 동안에는 묻지 않는다. 물어서 얻은 답은 내 문해력이 아니다'],
                  ['확인하는 방법', '찾아낸 규칙만으로 같은 글이 다시 나오면, 제대로 찾은 것이다'],
                ].map(([h, d]) => (
                  <span key={h} style={{ ...card, flex: '1 1 min(240px, 100%)', padding: '11px 16px' }}>
                    <span style={{ display: 'block', fontWeight: 800, fontSize: 13.5, color: C.lime }}>{h}</span>
                    <span style={{ display: 'block', color: 'var(--fg-muted)', fontSize: 12.5, marginTop: 3, ...kw }}>{d}</span>
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </Slide>

      {/* S17 질문 넷 */}
      <Slide
        nav="질문 넷"
        notes="적는 칸은 넷뿐입니다. 대신 세어 보고 확인한 것만 적으세요. 넷째 칸은 제가 만든 질문이 아니라 여러분이 만드는 질문이에요. 오늘 가장 어려운 칸입니다. 무엇을 살펴야 할지 막히면 오른쪽 점검표를 보세요."
      >
        <div style={{ width: 'min(1160px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 2.4vh, 22px)' }}>
          <Reveal>
            <div style={{ textAlign: 'center' }}>
              <Kicker>B 구역 — 읽고, 재기</Kicker>
              <h2 className="headline" style={{ marginTop: 8, marginInline: 'auto', maxWidth: 'min(940px, 94vw)', ...kw }}>
                질문은 넷, 그중 하나는 <span className="accent-text">내가 만든다</span>
              </h2>
            </div>
          </Reveal>

          <div style={{ display: 'flex', gap: 'clamp(12px, 2vw, 26px)', flexWrap: 'wrap', alignItems: 'stretch' }}>
            {/* 좌측 — 실제로 적는 네 칸 (dominant) */}
            <Build at={1} style={{ flex: '1 1 min(400px, 100%)', minWidth: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
                {[
                  ['1', '무엇을 말하는 글이고, 무엇이 반드시 들어 있는가', C.rose],
                  ['2', '문단은 몇 개이고, 각 문단은 무슨 일을 하는가', C.amber],
                  ['3', '문장과 글의 마지막은 어떤 모양인가', C.sky],
                ].map(([n, q, tone]) => (
                  <div key={n as string} style={{ ...card, display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px' }}>
                    <span
                      style={{
                        flex: 'none', width: 28, height: 28, borderRadius: 9, display: 'grid', placeItems: 'center',
                        background: `color-mix(in srgb, ${tone} 17%, transparent)`, color: tone as string,
                        fontWeight: 800, fontFamily: mono, fontSize: 14,
                      }}
                    >
                      {n}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 'clamp(13.5px, 1.6vw, 15px)', ...kw }}>{q}</span>
                  </div>
                ))}
                <div
                  style={{
                    ...card,
                    display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 16px',
                    borderColor: `color-mix(in srgb, ${C.violet} 60%, transparent)`,
                    background: `color-mix(in srgb, ${C.violet} 8%, var(--surface-2))`,
                  }}
                >
                  <span
                    style={{
                      flex: 'none', width: 28, height: 28, borderRadius: 9, display: 'grid', placeItems: 'center',
                      background: `color-mix(in srgb, ${C.violet} 22%, transparent)`, color: C.violet,
                      fontWeight: 800, fontFamily: mono, fontSize: 14,
                    }}
                  >
                    4
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 800, fontSize: 'clamp(13.5px, 1.6vw, 15px)', color: C.violet, ...kw }}>
                      내가 만든 질문 하나와 그 답
                    </span>
                    <span style={{ display: 'block', fontSize: 12.5, color: 'var(--fg-muted)', marginTop: 3, ...kw }}>
                      앞의 셋은 내가 정한 질문이 아니다. 더 알아내려면 <Mark tone={C.violet}>무엇을 더 물어야 할까.</Mark>
                    </span>
                  </span>
                </div>
              </div>
            </Build>

            {/* 우측 — 막힐 때 보는 점검표 (활동지의 접이식 점검표와 같은 내용) */}
            <Build at={2} style={{ flex: '0 1 min(360px, 100%)', minWidth: 0 }}>
              <div style={{ ...card, height: '100%', display: 'flex', flexDirection: 'column', gap: 12, borderStyle: 'dashed' }}>
                <span style={{ fontSize: 11.5, fontFamily: mono, color: 'var(--fg-faint)' }}>
                  📋 읽기 점검표 — 막힐 때만 본다
                </span>
                {[
                  { h: '내용을 읽는 눈', to: '1번 칸으로', tone: C.rose, items: ['말하려는 것', '그것을 받치는 근거', '대상 독자와 그 근거', '빠짐없이 든 재료', '숫자를 믿어도 되는가'] },
                  { h: '생김새를 보는 눈', to: '2·3번 칸으로', tone: C.amber, items: ['문단 수와 각 문단의 역할', '문장의 끝', '문장과 글의 길이', '마지막 문장의 모양', '제목·목록 기호 유무'] },
                ].map((g) => (
                  <div key={g.h}>
                    <span style={{ display: 'block', fontSize: 12.5, fontWeight: 800, color: g.tone, marginBottom: 5, ...kw }}>
                      {g.h} <span style={{ color: 'var(--fg-faint)', fontWeight: 700 }}>→ {g.to}</span>
                    </span>
                    <ul style={{ listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: '4px 6px' }}>
                      {g.items.map((it) => (
                        <li key={it} style={{ fontSize: 11.5, color: 'var(--fg-muted)', border: '1px solid var(--hair-2)', borderRadius: 999, padding: '3px 9px', ...kw }}>
                          {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <span style={{ marginTop: 'auto', fontSize: 11.5, color: 'var(--fg-faint)', borderTop: '1px solid var(--hair-2)', paddingTop: 9, ...kw }}>
                  아홉 칸에 나누어 적을 필요는 없다. 살펴본 결과를 왼쪽 네 칸에 모아 적는다.
                </span>
              </div>
            </Build>
          </div>
        </div>
      </Slide>

      {/* S18 도면 뜨기 (씬) */}
      <Slide
        full
        nav="도면 뜨기"
        notes="왼쪽이 받은 글, 가운데가 여러분이 재서 적는 표입니다. 물음표를 채우고 나면, 오른쪽처럼 표만 보고도 같은 글이 다시 지어져야 해요. 안 지어지면 표에 빠진 칸이 있는 겁니다. 점수가 낮아도 괜찮아요. 어느 칸이 빠졌는지 말할 수 있으면 그게 실력입니다."
      >
        <Scene>
          <BlueprintScene />
        </Scene>
      </Slide>

      {/* S19 활동지 */}
      <Slide
        nav="활동지"
        notes="점수는 채점 대상이 아닙니다. 100점은 애초에 나오지 않아요. 조금 있다가 제가 똑같은 프롬프트를 두 번 넣어서 몇 점이 나오는지 보여 드릴게요. 그게 오늘의 만점선입니다. 여러분이 낼 것은 점수가 아니라, 왜 깎였는지 읽고 무엇을 고쳤는지 쓴 기록이에요."
      >
        <div
          style={{
            width: 'min(1120px, 100%)',
            marginInline: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(330px, 100%), 1fr))',
            gap: 'clamp(18px, 3vw, 44px)',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <Reveal>
              <Kicker>기록 — 글의 설계도 되찾기</Kicker>
              <h2 className="headline" style={{ marginTop: 8, ...kw }}>
                제출물은 점수가 아니라 <span className="accent-text">읽어 낸 기록</span>
              </h2>
            </Reveal>
            <Reveal>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[
                  ['A', '주제와 받은 글', '주제만 고르면 글이 한 편 나온다', C.sky],
                  ['B', '읽고, 재기', '질문 네 개 — 그중 하나는 내가 만든다', C.rose],
                  ['C', '1차 복원', '규칙만으로 쓴 프롬프트 · 항목별 채점', C.lime],
                  ['D', '2차 복원', '무엇이 깎였고 무엇을 고쳤는가', C.green],
                  ['E', '한 문장 정리', '내가 놓치고 있던 것은 무엇이었나', C.violet],
                ].map(([s, title, d, tone]) => (
                  <div key={s as string} style={{ display: 'flex', gap: 11, alignItems: 'center', ...card, padding: '9px 14px' }}>
                    <span
                      style={{
                        flex: 'none',
                        width: 28,
                        height: 28,
                        borderRadius: 9,
                        display: 'grid',
                        placeItems: 'center',
                        background: `color-mix(in srgb, ${tone} 16%, transparent)`,
                        color: tone as string,
                        fontWeight: 800,
                        fontFamily: mono,
                        fontSize: 13.5,
                      }}
                    >
                      {s}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontWeight: 800, fontSize: 14 }}>{title}</span>
                      <span style={{ color: 'var(--fg-muted)', fontSize: 12.5, marginLeft: 9, ...kw }}>{d}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal>
              <div style={{ ...card, padding: '11px 16px', borderColor: `color-mix(in srgb, ${C.amber} 45%, transparent)`, background: `color-mix(in srgb, ${C.amber} 6%, var(--surface-2))` }}>
                <span style={{ fontSize: 13, fontWeight: 700, ...kw }}>
                  🔑 제출할 때 <strong>암호</strong>를 정한다 — 나중에 <strong>[제출 확인]</strong>에서 반/번호·이름·암호로 내 제출을 다시 볼 수 있다.{' '}
                  <span style={{ color: C.rose }}>평소 쓰는 비밀번호는 금지.</span>
                </span>
              </div>
            </Reveal>
          </div>

          <Reveal>
            <div style={{ ...card, textAlign: 'center', padding: 'clamp(20px, 3vh, 34px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, boxShadow: 'var(--glow)' }}>
              <img
                src={`${BASE}/images/activity-qr.png`}
                alt="글의 설계도 되찾기 활동지 접속 QR 코드"
                style={{ width: 'min(212px, 54vw)', borderRadius: 14, border: '8px solid #fff', background: '#fff' }}
              />
              <a
                href={ACTIVITY_URL}
                target="_blank"
                rel="noopener"
                style={{
                  display: 'inline-block',
                  padding: '13px 28px',
                  borderRadius: 999,
                  background: 'var(--accent)',
                  color: 'var(--accent-ink)',
                  fontWeight: 800,
                  textDecoration: 'none',
                  fontSize: 'clamp(14px, 1.6vw, 17px)',
                }}
              >
                활동지 열기 ↗
              </a>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, alignItems: 'center' }}>
                <LinkPill href={BOARD_URL} label="📋 제출 현황 — 냈는지 확인하고 이어 쓰기" />
                <span style={{ fontSize: 11.5, color: 'var(--fg-faint)', ...kw }}>
                  글 만들기와 채점은 활동지 안에서 <strong>Solar Pro 3</strong>가 맡는다. 오늘 뉴스에 나온 업스테이지가 만든 모델이다 (뉴스의 Solar Open 2와는 다른 모델).
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', borderTop: '1px solid var(--hair-2)', paddingTop: 12 }}>
                {['B의 분석', '내가 만든 질문', '1차 프롬프트', '고친 근거와 2차'].map((r, i) => (
                  <span key={r} style={{ fontSize: 11.5, fontWeight: 800, fontFamily: mono, color: i % 2 === 0 ? 'var(--fg-muted)' : C.amber, ...kw }}>
                    {r}
                    {i < 3 ? ' →' : ' ✓'}
                  </span>
                ))}
              </div>
              <span style={{ fontSize: 11.5, color: 'var(--fg-faint)', ...kw }}>이 네 칸이 채워지면 완성이다. 점수는 채점 대상이 아니다.</span>
            </div>
          </Reveal>
        </div>
      </Slide>

      {/* S20 마무리 */}
      <Slide
        center
        nav="한 문장"
        notes="첫 슬라이드에서 커서가 깜빡였죠. 그 자리에 들어간 말이 이겁니다. 오늘 하나만 가져가세요 — 아는 게 아니라 고른다."
      >
        <Reveal>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <StageMeter active={0} />
          </div>
        </Reveal>
        <Reveal>
          <h2 className="display" style={{ marginInline: 'auto', marginTop: 22, ...kw }}>
            AI는 아는 게 아니라 <span className="accent-text">고른다</span>
            <span className="lnw-caret" style={{ display: 'inline-block', width: '0.12em', height: '0.82em', background: C.amber, marginLeft: 8, borderRadius: 2 }} />
          </h2>
        </Reveal>
        <Reveal>
          <p className="lead" style={{ marginInline: 'auto', marginTop: 16, ...kw }}>
            그래서 <strong>무엇을 넣느냐</strong>가 <strong>무엇이 나오느냐</strong>를 정한다.
          </p>
        </Reveal>
        <Reveal>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 'min(620px, 100%)', marginInline: 'auto', marginTop: 26, textAlign: 'left' }}>
            {[
              { name: 'Transformer Explainer', d: '진짜 모델이 도는 화면 — 영어 문장으로 넣을 것', href: TE_URL, tone: C.sky },
              { name: 'tiktokenizer', d: '내 문장이 몇 조각으로 잘리는지 직접 세어 보기', href: TOKENIZER_URL, tone: C.lime },
              { name: '국가대표 AI 4종', d: '모두 공개되어 있다 — 이름으로 검색하면 직접 받아 볼 수 있다', href: NEWS_URL, tone: C.amber },
              { name: '📺 AI 시대에 귀한 인재의 특징', d: '영상 · 독서연구소 — 기계가 고르는 시대에 사람이 남길 몫은 무엇인가', href: VIDEO_URL, tone: C.violet },
            ].map((l) => (
              <a
                key={l.name}
                href={l.href}
                target="_blank"
                rel="noopener"
                style={{ display: 'flex', gap: 11, alignItems: 'center', textDecoration: 'none', ...card, padding: '10px 16px' }}
              >
                <span style={{ flex: 'none', width: 9, height: 9, borderRadius: '50%', background: l.tone }} />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 800, color: 'var(--fg)', fontSize: 14, textDecoration: 'underline', textUnderlineOffset: 3.5, textDecorationColor: `color-mix(in srgb, ${l.tone} 50%, transparent)` }}>
                    {l.name} ↗
                  </span>
                  <span style={{ display: 'block', color: 'var(--fg-muted)', fontSize: 12, marginTop: 2, ...kw }}>{l.d}</span>
                </span>
              </a>
            ))}
          </div>
        </Reveal>
      </Slide>
    </Deck>
  );
}
