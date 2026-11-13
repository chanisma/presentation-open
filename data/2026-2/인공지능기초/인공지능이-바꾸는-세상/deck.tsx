import { type CSSProperties, type ReactNode } from 'react';
import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import Build from '../../../../src/deck/Build';
import Reveal from '../../../../src/deck/Reveal';
import {
  Scene,
  useSceneTime,
  interpolate,
  spring,
  riseIn,
  easeInOut,
} from '../../../../src/scene';

/* ── 인공지능 기초 · 2026-2 — 인공지능이 바꾸는 세상 (16장) ─────────────
   plan: data/2026-2/인공지능기초/인공지능이-바꾸는-세상/plan.md
   아크: 훅(하루 타임라인) → 현장 9곳(패턴 칩 수집) → 칩 보드(종합)
        → 탐구 미션 → 활동지 → 링크 허브
   테마: 라이트 퓨처리스틱 (밝은 배경 + 일렉트릭 블루/시안) */

const BASE = 'data/2026-2/인공지능기초/인공지능이-바꾸는-세상';
const THINKING_GAME_URL = 'https://www.youtube.com/watch?v=d95J8yzvjbQ';
const ACTIVITY_URL = `https://2026kijunit.netlify.app/${BASE}/활동지.html`;
const BOARD_URL = 'https://2026kijunit.netlify.app/data/2026-2/인공지능기초/제출현황.html';

const C = {
  blue: '#2563eb',
  cyan: '#0891b2',
  violet: '#7c3aed',
  amber: '#d97706',
  green: '#059669',
  rose: '#e11d48',
  pink: '#db2777',
};

/* 패턴 칩 6종 — 이 수업의 수집 요소 */
const CHIPS = [
  { no: 1, label: '시간을 접다', tone: C.cyan, q: '오래 걸려서 못 하는 계산은?', cases: 'AlphaFold · GenCast' },
  { no: 2, label: '안 보이는 신호를 읽다', tone: C.violet, q: '데이터는 있는데 아무도 못 읽는 것은?', cases: '루닛 · 두루마리' },
  { no: 3, label: '미리 경고하다', tone: C.amber, q: '몇 시간만 미리 알면 결과가 바뀌는 일은?', cases: '딥카스 · 태풍' },
  { no: 4, label: '시연으로 배우다', tone: C.green, q: '말로 설명 못 하고 몸으로만 익히는 기술은?', cases: '휴머노이드' },
  { no: 5, label: '새 구조를 찾다', tone: C.rose, q: '"최선이라 믿어온 방법"이 있는 분야는?', cases: '에르되시 · AlphaEvolve' },
  { no: 6, label: '언어를 번역하다', tone: C.pink, q: '소통이 안 되어 생기는 문제는?', cases: 'CETI · BCI' },
];

const STATIONS = ['생명', '병원', '하늘', '도로', '공장', '수학', '고대 문서', '바다', '뇌'];

const kw: CSSProperties = { wordBreak: 'keep-all' };

const card: CSSProperties = {
  background: 'var(--surface-2)',
  border: '1px solid var(--hair)',
  borderRadius: 16,
  padding: 'clamp(14px, 1.8vw, 22px)',
};

/* ── 공용 소품 ── */

function ChipGlyph({ tone, size = 22 }: { tone: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ flex: 'none' }}>
      {[7.5, 12, 16.5].map((p) => (
        <g key={p} stroke={tone} strokeWidth={1.6} strokeLinecap="round" opacity={0.75}>
          <line x1={p} y1={2} x2={p} y2={4.5} />
          <line x1={p} y1={19.5} x2={p} y2={22} />
          <line x1={2} y1={p} x2={4.5} y2={p} />
          <line x1={19.5} y1={p} x2={22} y2={p} />
        </g>
      ))}
      <rect x={5} y={5} width={14} height={14} rx={3.5} fill={tone} />
      <rect x={9.2} y={9.2} width={5.6} height={5.6} rx={1.6} fill="rgba(255,255,255,0.88)" />
    </svg>
  );
}

/* 칩 획득/재등장 배너 — 사례 장의 마지막 빌드에 등장 */
function ChipGain({ no, note }: { no: number; note?: string }) {
  const chip = CHIPS[no - 1];
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10,
        padding: '10px 16px', borderRadius: 14,
        border: `1.5px dashed color-mix(in srgb, ${chip.tone} 55%, transparent)`,
        background: `color-mix(in srgb, ${chip.tone} 7%, transparent)`,
      }}
    >
      <ChipGlyph tone={chip.tone} />
      <span style={{ fontWeight: 800, color: chip.tone, fontSize: 13.5, fontFamily: 'var(--font-mono)' }}>
        패턴 칩 #{no} {note ? '재등장' : '획득'}
      </span>
      <span style={{ fontWeight: 800, fontSize: 15, ...kw }}>「{chip.label}」</span>
      {note && <span style={{ color: 'var(--fg-muted)', fontSize: 13, ...kw }}>{note}</span>}
    </div>
  );
}

function PhotoCard({
  src, alt, credit, imgStyle, style,
}: {
  src: string; alt: string; credit: string; imgStyle?: CSSProperties; style?: CSSProperties;
}) {
  return (
    <figure
      style={{
        margin: 0, borderRadius: 18, overflow: 'hidden',
        border: '1px solid var(--hair)', background: 'var(--surface-2)',
        boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', ...style,
      }}
    >
      <img src={src} alt={alt} style={{ display: 'block', width: '100%', minHeight: 0, flex: 1, objectFit: 'cover', ...imgStyle }} />
      <figcaption style={{ padding: '7px 14px', fontSize: 10.5, color: 'var(--fg-muted)', flex: 'none' }}>{credit}</figcaption>
    </figure>
  );
}

function LinkPill({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--primary)',
        fontWeight: 700, fontSize: 13.5, textDecoration: 'underline', textUnderlineOffset: 4,
        textDecorationColor: 'color-mix(in srgb, var(--primary) 45%, transparent)', ...kw,
      }}>
      {label} ↗
    </a>
  );
}

function Kicker({ children }: { children: ReactNode }) {
  return <div className="kicker" style={{ color: 'var(--primary)' }}>{children}</div>;
}

/* ── S2 — 지금 이 순간에도 (하루 타임라인 점등 씬) ── */
function DawnScene() {
  const t = useSceneTime();
  const events = [
    { x: 235, time: '03:00', place: '병원', text: '입원 환자의 심정지 위험을 감시 중', tone: C.violet, at: 1.1, cardY: 168 },
    { x: 520, time: '05:00', place: '기상센터', text: '태풍 경로 앙상블 예보 생성 완료', tone: C.cyan, at: 2.2, cardY: 226 },
    { x: 800, time: '07:00', place: '도로', text: '운전석 빈 택시가 첫 승객을 태움', tone: C.blue, at: 3.3, cardY: 168 },
    { x: 1055, time: '09:00', place: '공장', text: '휴머노이드가 부품 운반을 시작', tone: C.green, at: 4.4, cardY: 226 },
  ];
  const axis = interpolate(t, [0.3, 1.2], [0, 1], easeInOut);
  const cursorX = interpolate(t, [0.8, 5.4], [90, 1110], easeInOut);
  /* 스카이라인 — 단순 사각 실루엣 (비균등 높이) */
  const buildings = [
    [60, 486, 74], [140, 462, 56], [202, 496, 88], [296, 452, 70], [372, 478, 100],
    [478, 460, 64], [548, 492, 84], [638, 448, 58], [702, 470, 92], [800, 456, 66],
    [872, 486, 78], [956, 462, 60], [1022, 476, 96], [1124, 490, 46],
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', paddingTop: 'clamp(36px, 7vh, 74px)' }}>
        <div className="kicker" style={{ color: 'var(--primary)', ...riseIn(t, 0.05) }}>인공지능 기초 · 2단원</div>
        <h2 className="display" style={{ margin: '12px auto 0', ...kw, ...riseIn(t, 0.2) }}>
          지금 <span className="accent-text">이 순간에도</span>
        </h2>
        <p className="lead" style={{ marginInline: 'auto', marginTop: 10, ...kw, ...riseIn(t, 0.45) }}>
          여러분이 자는 동안에도, AI는 이미 일하고 있다.
        </p>
        <p style={{ marginInline: 'auto', marginTop: 8, color: 'var(--fg-muted)', fontSize: 'clamp(13px, 1.5vw, 15.5px)', fontWeight: 600, ...kw, ...riseIn(t, 5.6) }}>
          전부 오늘 새벽 실제로 일어난 일 — 하나씩 확인하러 가자
        </p>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '4vh' }}>
        <svg viewBox="0 0 1200 560" style={{ width: 'min(1150px, 95vw)', height: 'auto', overflow: 'visible' }}>
          {/* 시간축 (상단) */}
          <line x1={90} y1={110} x2={90 + 1020 * axis} y2={110} stroke="var(--hair)" strokeWidth={2.5} />
          {events.map((e) => (
            <text key={e.time} x={e.x} y={92} textAnchor="middle" fill="var(--fg-muted)"
              opacity={interpolate(t, [0.5 + (e.x - 235) / 1400, 0.9 + (e.x - 235) / 1400], [0, 1])}
              style={{ font: '700 17px var(--font-mono, monospace)', letterSpacing: '0.04em' }}>
              {e.time}
            </text>
          ))}
          {/* 시간 커서 */}
          <g opacity={interpolate(t, [0.7, 1.1], [0, 1]) * interpolate(t, [5.4, 6.2], [1, 0.35])}>
            <line x1={cursorX} y1={100} x2={cursorX} y2={120} stroke="var(--primary)" strokeWidth={3.5} strokeLinecap="round" />
            <circle cx={cursorX} cy={110} r={5.5} fill="var(--primary)" />
          </g>
          {/* 스카이라인 */}
          {buildings.map(([bx, by, bw], i) => (
            <rect key={i} x={bx} y={by} width={bw} height={540 - by} rx={3}
              fill={`color-mix(in srgb, var(--primary) ${9 + (i % 3) * 4}%, transparent)`}
              opacity={interpolate(t, [0.15 + i * 0.03, 0.5 + i * 0.03], [0, 1])} />
          ))}
          <line x1={40} y1={540} x2={1160} y2={540} stroke="var(--hair)" strokeWidth={2} />
          {/* 이벤트 신호 — 스카이라인에서 카드로 상승 */}
          {events.map((e) => {
            const appear = spring(t, e.at, 0.85);
            const lineTop = e.cardY + 96;
            return (
              <g key={e.place}>
                <line x1={e.x} y1={470} x2={e.x} y2={470 - (470 - lineTop) * Math.min(1, appear * 1.15)}
                  stroke={`color-mix(in srgb, ${e.tone} 60%, transparent)`} strokeWidth={2.5} strokeDasharray="2 7" strokeLinecap="round" />
                <circle cx={e.x} cy={470} r={6 * Math.min(1, appear * 1.4)} fill={e.tone} />
                {/* 점등 파동 1회 */}
                <circle cx={e.x} cy={470} r={8 + interpolate(t, [e.at, e.at + 0.9], [0, 30])} fill="none"
                  stroke={e.tone} strokeWidth={2}
                  opacity={interpolate(t, [e.at, e.at + 0.9], [0.55, 0])} />
                <g opacity={Math.min(1, appear * 1.2)} transform={`translate(0 ${(1 - appear) * 16})`}>
                  <rect x={e.x - 122} y={e.cardY} width={244} height={96} rx={14}
                    fill="var(--surface-2)" stroke={`color-mix(in srgb, ${e.tone} 45%, transparent)`} strokeWidth={1.6} />
                  <text x={e.x - 104} y={e.cardY + 34} fill={e.tone}
                    style={{ font: '800 18px var(--font-body, sans-serif)' }}>{e.place}</text>
                  <text x={e.x - 104} y={e.cardY + 64} fill="var(--fg)"
                    style={{ font: '500 14.5px var(--font-body, sans-serif)' }}>{e.text}</text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/* ── S6 — 태풍 부챗살 씬 (사진 위 앙상블 경로) ── */
function TyphoonScene() {
  const t = useSceneTime();
  const N = 20;
  const fan = Array.from({ length: N }, (_, i) => {
    const seed = Math.abs(Math.sin((i + 1) * 12.9898)) % 1;
    return { endY: 46 + seed * 470, delay: i * 0.045 };
  });
  const mainDraw = interpolate(t, [2.3, 3.6], [0, 1], easeInOut);
  const dialSweep = spring(t, 0.9, 1.3);
  const pct = interpolate(t, [3.4, 4.8], [0, 97.2]);
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', overflow: 'hidden' }}>
      {/* 좌: 태풍 사진 + 앙상블 부챗살 */}
      <div style={{ position: 'relative', flex: '1.45 1 0', minWidth: 0 }}>
        <img src={`${BASE}/images/typhoon-satellite.jpg`} alt="국제우주정거장에서 본 태풍 난마돌 — 뚜렷한 태풍의 눈"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '68% 62%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent 55%, var(--bg) 99%), linear-gradient(rgba(240,247,255,0.14), rgba(240,247,255,0.14))' }} />
        <svg viewBox="0 0 900 620" preserveAspectRatio="xMidYMid slice"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          {/* 앙상블 경로 다발 */}
          {fan.map((f, i) => {
            const draw = interpolate(t, [0.35 + f.delay, 1.9 + f.delay], [0, 1], easeInOut);
            const fade = interpolate(t, [2.3, 3.2], [0.5, 0.16]);
            return (
              <path key={i}
                d={`M120 505 C 330 470, 470 ${300 + (f.endY - 300) * 0.45}, 800 ${f.endY}`}
                pathLength={1} fill="none" stroke="#0b3ea8" strokeWidth={2}
                opacity={draw > 0 ? fade : 0}
                style={{ strokeDasharray: 1, strokeDashoffset: 1 - draw }} />
            );
          })}
          {/* 실제 경로로 수렴 */}
          <path d="M120 505 C 330 470, 470 330, 800 236" pathLength={1} fill="none"
            stroke="var(--primary)" strokeWidth={6.5} strokeLinecap="round"
            style={{ strokeDasharray: 1, strokeDashoffset: 1 - mainDraw }} />
          <circle cx={120} cy={505} r={8} fill="var(--primary)"
            opacity={interpolate(t, [0.3, 0.7], [0, 1])} />
          {mainDraw >= 1 && (
            <circle cx={800} cy={236} r={10 + ((t * 16) % 24)} fill="none" stroke="var(--primary)"
              strokeWidth={2.5} opacity={0.85 - (((t * 16) % 24) / 24) * 0.85} />
          )}
        </svg>
        <span style={{ position: 'absolute', left: 14, top: 12, fontSize: 11.5, color: 'rgba(255,255,255,0.85)', background: 'rgba(4, 20, 44, 0.4)', padding: '4px 10px', borderRadius: 8 }}>
          태풍 난마돌 · 국제우주정거장 — NASA (Public domain)
        </span>
      </div>
      {/* 우: 정보 패널 */}
      <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'clamp(10px, 1.6vh, 18px)', padding: 'clamp(18px, 3vw, 44px)' }}>
        <div className="kicker" style={{ color: 'var(--primary)', ...riseIn(t, 0.05) }}>현장 3/9 · 하늘 — GenCast</div>
        <h2 className="headline" style={{ ...kw, ...riseIn(t, 0.2) }}>
          슈퍼컴퓨터 대 <span className="accent-text">칩 한 장</span>
        </h2>
        <p style={{ color: 'var(--fg-muted)', lineHeight: 1.65, fontSize: 'clamp(13.5px, 1.5vw, 16px)', ...kw, ...riseIn(t, 0.4) }}>
          물리 법칙을 계산하는 대신 <strong style={{ color: 'var(--fg)' }}>데이터에서 배운다</strong> —
          수십 갈래 확률 경로가 하나의 예보로 수렴한다.
        </p>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', ...riseIn(t, 0.7) }}>
          {/* 스톱워치 다이얼 */}
          <svg viewBox="0 0 150 150" style={{ width: 'clamp(96px, 10vw, 134px)', flex: 'none' }}>
            <circle cx={75} cy={80} r={58} fill="var(--surface-2)" stroke="var(--hair)" strokeWidth={2} />
            <rect x={68} y={8} width={14} height={10} rx={3} fill="var(--fg-muted)" />
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * Math.PI * 2;
              return <line key={i} x1={75 + Math.sin(a) * 50} y1={80 - Math.cos(a) * 50}
                x2={75 + Math.sin(a) * 44} y2={80 - Math.cos(a) * 44} stroke="var(--fg-muted)" strokeWidth={2} opacity={0.5} />;
            })}
            <line x1={75} y1={80} x2={75 + Math.sin(dialSweep * 2.9) * 40} y2={80 - Math.cos(dialSweep * 2.9) * 40}
              stroke={C.cyan} strokeWidth={4} strokeLinecap="round" />
            <circle cx={75} cy={80} r={5} fill={C.cyan} />
            <text x={75} y={128} textAnchor="middle" fill="var(--fg)" style={{ font: '800 19px var(--font-mono, monospace)' }}
              opacity={interpolate(t, [2, 2.4], [0, 1])}>8분</text>
          </svg>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 'clamp(14px, 1.6vw, 17px)', ...kw }}>15일 예보 · TPU 한 장</div>
            <p style={{ color: 'var(--fg-muted)', fontSize: 13.5, lineHeight: 1.55, marginTop: 4, ...kw }}>
              슈퍼컴퓨터가 몇 시간 걸리던 앙상블 예보를 8분에.
            </p>
          </div>
        </div>
        {/* 97.2% 게이지 */}
        <div style={riseIn(t, 1)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--fg-muted)', marginBottom: 5 }}>
            <span style={kw}>유럽 기준 앙상블(ENS) 대비 우세 변수</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: C.cyan }}>{pct.toFixed(1)}%</span>
          </div>
          <div style={{ height: 10, borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--hair)', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', borderRadius: 999 }} />
          </div>
        </div>
        <p style={{ color: 'var(--fg-muted)', fontSize: 13, lineHeight: 1.6, ...kw, ...riseIn(t, 1.3) }}>
          2026 Nature — AI 태풍 모델, 경로·강도에서 <strong style={{ color: 'var(--fg)' }}>평균 하루 이상</strong> 빠른 경고
          (지난 10년 발전에 맞먹는 개선). 2026.8 태풍 돌핀 때 실제 가동.
        </p>
        <div style={riseIn(t, 1.5)}>
          <LinkPill href="https://deepmind.google/discover/blog/gencast-predicts-weather-and-the-risks-of-extreme-conditions-with-sota-accuracy/" label="GenCast 소개 (DeepMind)" />
        </div>
      </div>
    </div>
  );
}

/* ── S9 — 미해결 게시판 씬 (카드 반전) ── */
function BoardScene() {
  const t = useSceneTime();
  const flip1 = spring(t, 1.5, 0.7);
  const flip2 = spring(t, 3.1, 0.7);
  const decor = [
    { x: 165, y: 96, r: -5, name: '리만 가설', year: '1859' },
    { x: 892, y: 84, r: 4, name: '골드바흐 추측', year: '1742' },
    { x: 585, y: 66, r: -2, name: 'P vs NP', year: '1971' },
    { x: 935, y: 268, r: -6, name: '콜라츠 추측', year: '1937' },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', paddingTop: 'clamp(30px, 6vh, 60px)' }}>
        <div className="kicker" style={{ color: 'var(--primary)', ...riseIn(t, 0.05) }}>현장 6/9 · 수학</div>
        <h2 className="display" style={{ margin: '10px auto 0', ...kw, ...riseIn(t, 0.2) }}>
          <span className="accent-text">80년</span> 만에 풀린 문제
        </h2>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
        <svg viewBox="0 0 1150 420" style={{ width: 'min(1080px, 94vw)', height: 'auto', overflow: 'visible' }}>
          {/* 게시판 */}
          <rect x={40} y={20} width={1070} height={380} rx={22}
            fill="color-mix(in srgb, #d97706 7%, var(--surface-2))" stroke="var(--hair)" strokeWidth={2}
            opacity={interpolate(t, [0.1, 0.6], [0, 1])} />
          <text x={72} y={58} fill="var(--fg-faint)" style={{ font: '700 14px var(--font-mono, monospace)', letterSpacing: '0.14em' }}
            opacity={interpolate(t, [0.3, 0.8], [0, 1])}>UNSOLVED — 미해결 문제 게시판</text>
          {/* 장식 카드 (여전히 미해결) */}
          {decor.map((d, i) => (
            <g key={d.name} transform={`rotate(${d.r} ${d.x} ${d.y})`}
              opacity={interpolate(t, [0.45 + i * 0.12, 0.9 + i * 0.12], [0, 0.62])}>
              <rect x={d.x - 78} y={d.y - 34} width={156} height={72} rx={9}
                fill="#f6edd9" stroke="#d9c9a3" strokeWidth={1.4} />
              <circle cx={d.x} cy={d.y - 26} r={4} fill="#b45309" />
              <text x={d.x} y={d.y + 2} textAnchor="middle" fill="#7c5a1e" style={{ font: '700 15px var(--font-body, sans-serif)' }}>{d.name}</text>
              <text x={d.x} y={d.y + 24} textAnchor="middle" fill="#a1854b" style={{ font: '500 12px var(--font-mono, monospace)' }}>{d.year} · 미해결</text>
            </g>
          ))}
          {/* 카드 1 — 에르되시 (1946 → 2026 반증) */}
          <g transform="rotate(-2.5 320 218)">
            <ellipse cx={320} cy={218} rx={185} ry={120} fill={`color-mix(in srgb, ${C.rose} 9%, transparent)`}
              opacity={interpolate(t, [1.1, 1.5], [0, 1]) * interpolate(t, [2.6, 3.1], [1, 0.35])} />
            <g opacity={flip1 < 0.5 ? interpolate(t, [0.35, 0.8], [0, 1]) : 0}>
              <rect x={190} y={148} width={260} height={140} rx={12} fill="#f6edd9" stroke="#d9c9a3" strokeWidth={1.6} />
              <circle cx={320} cy={158} r={5} fill="#b45309" />
              <text x={320} y={198} textAnchor="middle" fill="#6d4f1a" style={{ font: '800 20px var(--font-body, sans-serif)' }}>에르되시 단위거리 추측</text>
              <text x={320} y={228} textAnchor="middle" fill="#a1854b" style={{ font: '600 15px var(--font-mono, monospace)' }}>1946 — 미해결</text>
              <text x={320} y={258} textAnchor="middle" fill="#a1854b" style={{ font: '500 13px var(--font-body, sans-serif)' }}>증명도, 반증도 없음</text>
            </g>
            <g opacity={flip1 >= 0.5 ? 1 : 0} transform={`scale(${flip1 >= 0.5 ? 0.9 + Math.min(1, flip1) * 0.1 : 1})`} style={{ transformOrigin: '320px 218px' }}>
              <rect x={190} y={148} width={260} height={140} rx={12} fill="var(--surface-2)"
                stroke={C.rose} strokeWidth={2} style={{ filter: `drop-shadow(0 10px 26px color-mix(in srgb, ${C.rose} 25%, transparent))` }} />
              <text x={320} y={190} textAnchor="middle" fill={C.rose} style={{ font: '800 21px var(--font-body, sans-serif)' }}>반증 완료</text>
              <text x={320} y={220} textAnchor="middle" fill="var(--fg)" style={{ font: '600 14.5px var(--font-body, sans-serif)' }}>2026.5.20 · OpenAI 모델</text>
              <text x={320} y={248} textAnchor="middle" fill="var(--fg-muted)" style={{ font: '500 12.5px var(--font-body, sans-serif)' }}>연구진이 자리를 비운 사이에</text>
              <g transform="rotate(12 448 152)">
                <circle cx={448} cy={152} r={30} fill={C.rose} />
                <text x={448} y={147} textAnchor="middle" fill="#fff" style={{ font: '800 15px var(--font-mono, monospace)' }}>80년</text>
                <text x={448} y={164} textAnchor="middle" fill="rgba(255,255,255,0.85)" style={{ font: '600 9.5px var(--font-body, sans-serif)' }}>걸린 문제</text>
              </g>
            </g>
          </g>
          {/* 카드 2 — 슈트라센 (1969 → 2026 경신) */}
          <g transform="rotate(2 742 252)">
            <ellipse cx={742} cy={252} rx={185} ry={120} fill={`color-mix(in srgb, ${C.cyan} 10%, transparent)`}
              opacity={interpolate(t, [2.7, 3.1], [0, 1]) * interpolate(t, [4.2, 4.7], [1, 0.35])} />
            <g opacity={flip2 < 0.5 ? interpolate(t, [0.5, 0.95], [0, 1]) : 0}>
              <rect x={612} y={182} width={260} height={140} rx={12} fill="#f6edd9" stroke="#d9c9a3" strokeWidth={1.6} />
              <circle cx={742} cy={192} r={5} fill="#b45309" />
              <text x={742} y={232} textAnchor="middle" fill="#6d4f1a" style={{ font: '800 20px var(--font-body, sans-serif)' }}>4×4 행렬 곱셈 최소 횟수</text>
              <text x={742} y={262} textAnchor="middle" fill="#a1854b" style={{ font: '600 15px var(--font-mono, monospace)' }}>1969 슈트라센 — 49회</text>
              <text x={742} y={292} textAnchor="middle" fill="#a1854b" style={{ font: '500 13px var(--font-body, sans-serif)' }}>56년간 최고 기록</text>
            </g>
            <g opacity={flip2 >= 0.5 ? 1 : 0}>
              <rect x={612} y={182} width={260} height={140} rx={12} fill="var(--surface-2)"
                stroke={C.cyan} strokeWidth={2} style={{ filter: `drop-shadow(0 10px 26px color-mix(in srgb, ${C.cyan} 25%, transparent))` }} />
              <text x={742} y={226} textAnchor="middle" fill={C.cyan} style={{ font: '800 25px var(--font-mono, monospace)' }}>49 → 48회</text>
              <text x={742} y={256} textAnchor="middle" fill="var(--fg)" style={{ font: '600 14.5px var(--font-body, sans-serif)' }}>AlphaEvolve · 2026</text>
              <text x={742} y={284} textAnchor="middle" fill="var(--fg-muted)" style={{ font: '500 12.5px var(--font-body, sans-serif)' }}>미해결 50여 개 중 20%에서 기록 경신</text>
              <g transform="rotate(-10 872 186)">
                <circle cx={872} cy={186} r={30} fill={C.cyan} />
                <text x={872} y={181} textAnchor="middle" fill="#fff" style={{ font: '800 15px var(--font-mono, monospace)' }}>56년</text>
                <text x={872} y={198} textAnchor="middle" fill="rgba(255,255,255,0.85)" style={{ font: '600 9.5px var(--font-body, sans-serif)' }}>만의 경신</text>
              </g>
            </g>
          </g>
        </svg>
      </div>
      {/* 하단 텍스트 밴드 (게시판 bbox 밖 — zone 분리, 독 회피) */}
      <div style={{ textAlign: 'center', paddingBottom: 'clamp(84px, 12vh, 122px)', paddingInline: 24 }}>
        <p style={{ marginInline: 'auto', maxWidth: 900, color: 'var(--fg-muted)', fontSize: 'clamp(13px, 1.5vw, 15.5px)', lineHeight: 1.6, ...kw, ...riseIn(t, 4.6) }}>
          하버드 수학자 멜라니 매쳇 우드 — <strong style={{ color: 'var(--fg)' }}>“아름다운 수학”</strong>.
          AI는 배운 것을 흉내내는 데서 멈추지 않고, 인류가 몰랐던 답을 만들기 시작했다.
        </p>
      </div>
    </div>
  );
}

/* ── S13 — 메인보드 칩 장착 씬 (패턴 종합) ── */
function MotherboardScene() {
  const t = useSceneTime();
  const mountAt = (i: number) => 0.7 + i * 0.75;
  const allMounted = mountAt(5) + 0.8;
  const power = interpolate(t, [allMounted, allMounted + 0.5], [0, 1]) * interpolate(t, [allMounted + 0.8, allMounted + 1.6], [1, 0.45]);
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', paddingTop: 'clamp(28px, 5vh, 52px)' }}>
        <div className="kicker" style={{ color: 'var(--primary)', ...riseIn(t, 0.05) }}>여행의 정리</div>
        <h2 className="display" style={{ margin: '10px auto 0', ...kw, ...riseIn(t, 0.2) }}>
          칩 6개, <span className="accent-text">세상을 읽는 부품</span>
        </h2>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(16px, 3vw, 44px)', padding: '0 clamp(20px, 4vw, 60px) clamp(16px, 3vh, 32px)' }}>
        {/* 좌: 메인보드 */}
        <svg viewBox="0 0 560 460" style={{ width: 'min(545px, 46vw)', height: 'auto', flex: 'none', overflow: 'visible' }}>
          <rect x={20} y={16} width={520} height={428} rx={20}
            fill="color-mix(in srgb, var(--primary) 7%, var(--surface-2))" stroke="var(--hair)" strokeWidth={2}
            opacity={interpolate(t, [0.1, 0.5], [0, 1])}
            style={{ filter: power > 0.05 ? `drop-shadow(0 0 ${26 * power}px color-mix(in srgb, var(--primary) 45%, transparent))` : 'none' }} />
          {/* 기판 트레이스 배경 */}
          <g stroke="color-mix(in srgb, var(--primary) 18%, transparent)" strokeWidth={1.6} fill="none"
            opacity={interpolate(t, [0.3, 0.8], [0, 1])}>
            <path d="M20 90 H 90 L 120 120 V 200" />
            <path d="M540 140 H 470 L 440 170" />
            <path d="M100 444 V 390 L 140 350" />
            <path d="M470 444 V 380 L 430 340 H 380" />
            <path d="M280 16 V 52" />
          </g>
          {CHIPS.map((chip, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const cx = 158 + col * 250;
            const cy = 106 + row * 122;
            const m = spring(t, mountAt(i), 0.75);
            const drop = (1 - Math.min(1, m)) * -46;
            const glowAmt = power > 0.05 ? power : 0;
            return (
              <g key={chip.no}>
                {/* 슬롯 */}
                <rect x={cx - 96} y={cy - 40} width={192} height={80} rx={12} fill="none"
                  stroke="var(--hair)" strokeWidth={1.5} strokeDasharray="5 6"
                  opacity={interpolate(t, [0.3 + i * 0.08, 0.7 + i * 0.08], [0, 0.9])} />
                {/* 트레이스 점등 — 칩 장착 시 */}
                <line x1={cx + (col === 0 ? -96 : 96)} y1={cy} x2={cx + (col === 0 ? -138 : 138)} y2={cy}
                  stroke={chip.tone} strokeWidth={2.5} strokeLinecap="round"
                  opacity={Math.min(1, Math.max(0, m - 0.6) * 2.4) * 0.85} />
                <circle cx={cx + (col === 0 ? -138 : 138)} cy={cy} r={4} fill={chip.tone}
                  opacity={Math.min(1, Math.max(0, m - 0.7) * 3)} />
                {/* 칩 본체 */}
                <g opacity={Math.min(1, m * 1.5)} transform={`translate(0 ${drop})`}>
                  <rect x={cx - 88} y={cy - 32} width={176} height={64} rx={10}
                    fill="var(--surface-2)" stroke={chip.tone} strokeWidth={2}
                    style={{ filter: `drop-shadow(0 ${5 + glowAmt * 5}px ${13 + glowAmt * 13}px color-mix(in srgb, ${chip.tone} ${22 + glowAmt * 26}%, transparent))` }} />
                  <rect x={cx - 74} y={cy - 13} width={26} height={26} rx={6} fill={chip.tone} />
                  <rect x={cx - 67.2} y={cy - 6.2} width={12.4} height={12.4} rx={3} fill="rgba(255,255,255,0.88)" />
                  <text x={cx - 36} y={cy - 3} fill={chip.tone} style={{ font: '800 11px var(--font-mono, monospace)' }}>#{chip.no}</text>
                  <text x={cx - 36} y={cy + 16} fill="var(--fg)" style={{ font: '800 14.5px var(--font-body, sans-serif)' }}>{chip.label}</text>
                </g>
              </g>
            );
          })}
          <text x={280} y={432} textAnchor="middle" fill="var(--fg-muted)"
            style={{ font: '600 13px var(--font-mono, monospace)', letterSpacing: '0.1em' }}
            opacity={power > 0.05 ? 0.4 + power * 0.6 : interpolate(t, [allMounted - 0.4, allMounted], [0, 0.4])}>
            POWER ON — 패턴은 분야를 가리지 않는다
          </text>
        </svg>
        {/* 우: 질문 밴드 (기판 bbox 밖 — zone 분리) */}
        <div style={{ flex: '1 1 0', minWidth: 0, maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 1.4vh, 14px)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--fg-muted)', letterSpacing: '0.08em', ...riseIn(t, 0.4) }}>
            칩마다 하나씩 — 활동지로 가져갈 질문
          </div>
          {CHIPS.map((chip, i) => (
            <div key={chip.no} style={{ display: 'flex', gap: 10, alignItems: 'baseline', ...riseIn(t, mountAt(i) + 0.25) }}>
              <span style={{ flex: 'none', width: 10, height: 10, borderRadius: 3, background: chip.tone, transform: 'translateY(1px)' }} />
              <div style={{ minWidth: 0 }}>
                <span style={{ fontWeight: 800, fontSize: 'clamp(13.5px, 1.5vw, 15.5px)', ...kw }}>{chip.q}</span>
                <span style={{ color: 'var(--fg-faint)', fontSize: 11.5, marginLeft: 8, fontFamily: 'var(--font-mono)' }}>{chip.cases}</span>
              </div>
            </div>
          ))}
          <p style={{ color: 'var(--fg-muted)', fontSize: 13, lineHeight: 1.6, marginTop: 4, ...kw, ...riseIn(t, allMounted + 0.4) }}>
            두 번 등장한 칩이 있었다 — 패턴은 <strong style={{ color: 'var(--fg)' }}>분야를 넘어 이식된다</strong>는 증거.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── 정적 보조 다이어그램 ── */

/* S4 — 신약 파이프라인 트랙 */
function DrugPipeline() {
  const stages = [
    { name: '후보 발굴', w: 200, ai: true },
    { name: '전임상', w: 120 },
    { name: '임상 1상', w: 105 },
    { name: '2상', w: 85 },
    { name: '3상', w: 105 },
    { name: '승인', w: 85 },
  ];
  let x = 40;
  const boxes = stages.map((s) => {
    const b = { ...s, x };
    x += s.w + 14;
    return b;
  });
  const total = x - 14 + 40;
  return (
    <svg viewBox={`0 0 ${total} 240`} style={{ width: '100%', height: 'auto', overflow: 'visible' }} role="img"
      aria-label="신약 개발 파이프라인 — 후보 발굴 구간을 AI가 접는다">
      <defs>
        <linearGradient id="drugAiGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="60%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      {/* 이정표 (트랙 위) */}
      <g>
        <line x1={boxes[0].x + boxes[0].w / 2} y1={64} x2={boxes[0].x + boxes[0].w / 2} y2={104} stroke={C.cyan} strokeWidth={2} strokeDasharray="3 5" />
        <rect x={boxes[0].x + boxes[0].w / 2 - 128} y={18} width={256} height={46} rx={10} fill="var(--surface-2)" stroke={`color-mix(in srgb, ${C.cyan} 45%, transparent)`} strokeWidth={1.5} />
        <text x={boxes[0].x + boxes[0].w / 2} y={37} textAnchor="middle" fill={C.cyan} style={{ font: '800 13px var(--font-mono, monospace)' }}>2026.1 · FDA</text>
        <text x={boxes[0].x + boxes[0].w / 2} y={55} textAnchor="middle" fill="var(--fg)" style={{ font: '600 12.5px var(--font-body, sans-serif)' }}>AI 설계 약물 ISM8969 임상 승인</text>
      </g>
      <g>
        <line x1={boxes[4].x + boxes[4].w / 2} y1={64} x2={boxes[4].x + boxes[4].w / 2} y2={104} stroke={C.violet} strokeWidth={2} strokeDasharray="3 5" />
        <rect x={boxes[4].x + boxes[4].w / 2 - 128} y={18} width={256} height={46} rx={10} fill="var(--surface-2)" stroke={`color-mix(in srgb, ${C.violet} 45%, transparent)`} strokeWidth={1.5} />
        <text x={boxes[4].x + boxes[4].w / 2} y={37} textAnchor="middle" fill={C.violet} style={{ font: '800 13px var(--font-mono, monospace)' }}>2026.7 · 3상 진입</text>
        <text x={boxes[4].x + boxes[4].w / 2} y={55} textAnchor="middle" fill="var(--fg)" style={{ font: '600 12.5px var(--font-body, sans-serif)' }}>렌토서팁 — 표적·분자 모두 생성형 AI</text>
      </g>
      {/* 트랙 */}
      {boxes.map((b, i) => (
        <g key={b.name}>
          <rect x={b.x} y={104} width={b.w} height={58} rx={11}
            fill={b.ai ? 'url(#drugAiGrad)' : 'var(--surface-2)'}
            stroke={b.ai ? 'none' : 'var(--hair)'} strokeWidth={1.5} />
          <text x={b.x + b.w / 2} y={139} textAnchor="middle"
            fill={b.ai ? '#ffffff' : 'var(--fg)'}
            style={{ font: `${b.ai ? 800 : 600} 15px var(--font-body, sans-serif)` }}>{b.name}</text>
          {i < boxes.length - 1 && (
            <path d={`M${b.x + b.w + 2} 133 l 10 0 m 0 0 l -4 -4 m 4 4 l -4 4`} stroke="var(--fg-faint)" strokeWidth={2} fill="none" strokeLinecap="round" />
          )}
        </g>
      ))}
      <text x={boxes[0].x + boxes[0].w / 2} y={186} textAnchor="middle" fill={C.cyan}
        style={{ font: '800 13px var(--font-body, sans-serif)' }}>← AI가 접는 구간</text>
      {/* 기간 바 */}
      <line x1={40} y1={214} x2={total - 40} y2={214} stroke="var(--hair)" strokeWidth={2} />
      <line x1={40} y1={207} x2={40} y2={221} stroke="var(--fg-faint)" strokeWidth={2} />
      <line x1={total - 40} y1={207} x2={total - 40} y2={221} stroke="var(--fg-faint)" strokeWidth={2} />
      <text x={total / 2} y={236} textAnchor="middle" fill="var(--fg-muted)" style={{ font: '600 13.5px var(--font-body, sans-serif)' }}>
        신약 1개 = 평균 12~15년 · 약 2조 원
      </text>
    </svg>
  );
}

/* S8 — 모방 학습 3단 다이어그램 (비figural — 박스와 파형) */
function ImitationDiagram() {
  const steps = [
    { x: 20, label: '사람의 시연', sub: '작업 모션캡처', tone: C.blue },
    { x: 220, label: '동작 데이터', sub: '수 시간 분량', tone: C.cyan },
    { x: 420, label: '신경망 정책', sub: '로봇이 재현', tone: C.green },
  ];
  return (
    <svg viewBox="0 0 600 118" style={{ width: '100%', height: 'auto', overflow: 'visible' }} role="img"
      aria-label="모방 학습 — 사람의 시연이 데이터가 되고 신경망 정책이 된다">
      {steps.map((s, i) => (
        <g key={s.label}>
          <rect x={s.x} y={18} width={160} height={78} rx={12} fill="var(--surface-2)"
            stroke={`color-mix(in srgb, ${s.tone} 45%, transparent)`} strokeWidth={1.6} />
          <text x={s.x + 80} y={48} textAnchor="middle" fill="var(--fg)" style={{ font: '800 15.5px var(--font-body, sans-serif)' }}>{s.label}</text>
          <text x={s.x + 80} y={70} textAnchor="middle" fill="var(--fg-muted)" style={{ font: '500 12.5px var(--font-body, sans-serif)' }}>{s.sub}</text>
          {/* 파형 장식 — 데이터 흐름 */}
          <polyline
            points={Array.from({ length: 9 }, (_, k) => `${s.x + 30 + k * 12.5},${86 - Math.abs(Math.sin((k + i * 3) * 1.3)) * 7}`).join(' ')}
            fill="none" stroke={`color-mix(in srgb, ${s.tone} 55%, transparent)`} strokeWidth={1.6} />
          {i < steps.length - 1 && (
            <g stroke="var(--fg-faint)" strokeWidth={2.5} strokeLinecap="round" fill="none">
              <line x1={s.x + 164} y1={57} x2={s.x + 216} y2={57} />
              <path d={`M${s.x + 216} 57 l -7 -5 m 7 5 l -7 5`} />
            </g>
          )}
        </g>
      ))}
    </svg>
  );
}

/* S12 — 신호 여정 다이어그램 */
function BciJourney() {
  const nodes = [
    { x: 16, w: 128, label: '말운동피질', sub: '말하려는 시도' },
    { x: 176, w: 122, label: '전극 64×4', sub: '신호 포착' },
    { x: 330, w: 108, label: 'AI 디코더', sub: '실시간 해석' },
  ];
  return (
    <svg viewBox="0 0 620 110" style={{ width: '100%', height: 'auto', overflow: 'visible' }} role="img"
      aria-label="뇌 신호가 전극과 디코더를 거쳐 문장이 되는 여정">
      {nodes.map((n, i) => (
        <g key={n.label}>
          <rect x={n.x} y={16} width={n.w} height={66} rx={12} fill="var(--surface-2)" stroke="var(--hair)" strokeWidth={1.5} />
          <text x={n.x + n.w / 2} y={44} textAnchor="middle" fill="var(--fg)" style={{ font: '800 14.5px var(--font-body, sans-serif)' }}>{n.label}</text>
          <text x={n.x + n.w / 2} y={66} textAnchor="middle" fill="var(--fg-muted)" style={{ font: '500 12px var(--font-body, sans-serif)' }}>{n.sub}</text>
          <g stroke="var(--fg-faint)" strokeWidth={2.5} strokeLinecap="round" fill="none">
            <line x1={n.x + n.w + 4} y1={49} x2={n.x + n.w + 28} y2={49} />
            <path d={`M${n.x + n.w + 28} 49 l -6 -4.5 m 6 4.5 l -6 4.5`} />
          </g>
        </g>
      ))}
      <rect x={472} y={16} width={136} height={66} rx={12} fill="color-mix(in srgb, var(--primary) 8%, var(--surface-2))"
        stroke="color-mix(in srgb, var(--primary) 50%, transparent)" strokeWidth={1.8} />
      <text x={540} y={44} textAnchor="middle" fill="var(--primary)" style={{ font: '800 14.5px var(--font-body, sans-serif)' }}>화면의 문장</text>
      <text x={540} y={66} textAnchor="middle" fill="var(--fg)" style={{ font: '600 13px var(--font-mono, monospace)' }}>“고마워요▍”</text>
    </svg>
  );
}

/* S11 — 코다 리듬 표기 (사진 위 오버레이) */
function CodaNotation() {
  const base = [0, 26, 52, 100, 126, 152, 178];
  return (
    <svg viewBox="0 0 560 84" style={{ width: '100%', height: 'auto', overflow: 'visible' }} role="img"
      aria-label="향유고래 코다 클릭 패턴 — 장식음과 루바토">
      <text x={0} y={14} fill="rgba(255,255,255,0.9)" style={{ font: '700 12px var(--font-mono, monospace)', letterSpacing: '0.1em' }}>CODA 1+1+3 …</text>
      {base.map((x, i) => (
        <circle key={i} cx={30 + x * 1.7} cy={44} r={7} fill="#fff" opacity={0.92} />
      ))}
      {/* 장식음 — 추가 클릭 */}
      <circle cx={30 + 205 * 1.7} cy={44} r={7} fill="#67e8f9" />
      <g stroke="#67e8f9" strokeWidth={1.6} fill="none">
        <path d="M378 22 C 384 28, 386 32, 379 38" />
        <path d="M379 38 l -1 -6 m 1 6 l 6 -2" />
      </g>
      <text x={392} y={20} fill="#67e8f9" style={{ font: '700 12.5px var(--font-body, sans-serif)' }}>장식음 — 클릭 추가</text>
      {/* 루바토 — 간격 미세 조정 */}
      <g stroke="#fbbf24" strokeWidth={1.6} fill="none">
        <path d="M118 62 h 40" strokeDasharray="4 4" />
        <path d="M118 58 v 8 M158 58 v 8" />
      </g>
      <text x={122} y={80} fill="#fbbf24" style={{ font: '700 12.5px var(--font-body, sans-serif)' }}>루바토 — 간격 조정</text>
    </svg>
  );
}

/* ── 덱 본체 ── */
export default function AiChangingWorldDeck() {
  return (
    <Deck>
      {/* S1 표지 */}
      <Slide full nav="표지"
        notes="지난 시간에 '왜 배우는가'를 봤죠. 오늘은 '지금 무슨 일이 벌어지고 있는가'입니다. 아홉 군데를 여행하는데, 조건이 하나 있어요 — 각 현장에서 칩을 하나씩 수집할 겁니다.">
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          {/* 엔지니어링 그리드 */}
          <div aria-hidden style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(var(--hair-2) 1px, transparent 1px), linear-gradient(90deg, var(--hair-2) 1px, transparent 1px)',
            backgroundSize: '54px 54px',
            maskImage: 'radial-gradient(ellipse at 32% 68%, black 25%, transparent 78%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 32% 68%, black 25%, transparent 78%)',
          }} />
          {/* 회로 트레이스 — 중앙 통과 */}
          <svg aria-hidden viewBox="0 0 1600 900" preserveAspectRatio="none"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <path d="M1600 150 H 1130 L 1010 270 H 760 L 660 370 V 520 L 540 640 H 210"
              fill="none" stroke="color-mix(in srgb, var(--primary) 26%, transparent)" strokeWidth={2.5} />
            <circle cx={210} cy={640} r={6} fill="var(--primary)" />
            <circle cx={760} cy={270} r={4.5} fill="color-mix(in srgb, var(--primary) 55%, transparent)" />
            <path d="M1600 560 H 1350 L 1270 640 V 760" fill="none"
              stroke="color-mix(in srgb, var(--primary) 16%, transparent)" strokeWidth={2} />
          </svg>
          <div style={{
            position: 'relative', height: '100%', display: 'flex', alignItems: 'flex-end',
            gap: 'clamp(24px, 4vw, 64px)', padding: 'clamp(28px, 5vw, 88px)',
          }}>
            {/* 좌하단 dominant 타이틀 */}
            <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 2.4vh, 26px)' }}>
              <Reveal>
                <div className="kicker" style={{ color: 'var(--primary)' }}>인공지능 기초 · 2026-2 · 2단원 도입</div>
              </Reveal>
              <Reveal>
                <h1 className="display" style={kw}>
                  인공지능이<br /><span className="accent-text">바꾸는 세상</span>
                </h1>
              </Reveal>
              <Reveal>
                <p className="lead" style={{ maxWidth: 620, ...kw }}>
                  2026년 지금, AI가 실제로 일하고 있는 현장 아홉 곳 —
                  생명에서 뇌까지, 오늘 한 바퀴 여행한다.
                </p>
              </Reveal>
              <Reveal>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 12, alignSelf: 'flex-start',
                  padding: '11px 20px', borderRadius: 999, border: '1.5px solid var(--hair)',
                  background: 'var(--surface-2)', boxShadow: 'var(--glow)',
                }}>
                  <span style={{ display: 'flex', gap: 4 }}>
                    {CHIPS.map((c) => <ChipGlyph key={c.no} tone={c.tone} size={17} />)}
                  </span>
                  <span style={{ fontWeight: 800, fontSize: 'clamp(13px, 1.5vw, 15.5px)', ...kw }}>
                    오늘의 미션 — 패턴 칩 <span style={{ color: 'var(--primary)' }}>6개</span>를 모으세요
                  </span>
                </div>
              </Reveal>
            </div>
            {/* 우측 여정 레일 */}
            <Reveal>
              <div className="hide-narrow" style={{ flex: 'none', display: 'flex', flexDirection: 'column', gap: 7, borderLeft: '2px solid var(--hair)', paddingLeft: 18 }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--fg-faint)', fontFamily: 'var(--font-mono)' }}>ITINERARY</span>
                {STATIONS.map((s, i) => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 800, color: 'var(--primary)', width: 16 }}>{i + 1}</span>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-muted)' }}>{s}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </Slide>

      {/* S2 훅 씬 — 지금 이 순간에도 */}
      <Slide full nav="지금 이 순간"
        notes="이 장면, 전부 오늘 새벽 실제로 일어난 일입니다. 하나씩 확인하러 가 봅시다.">
        <Scene><DawnScene /></Scene>
      </Slide>

      {/* S3 알파폴드 */}
      <Slide nav="알파폴드"
        notes="생물학자들이 50년 동안 '단백질 접힘'이라는 숙제를 못 풀었어요. 이 팀이 푸는 순간이 카메라에 그대로 찍혀 있습니다 — 직접 봅시다. (클립 시청 후) 이 사람들 표정 기억해 두세요.">
        <div style={{ width: 'min(1180px, 100%)', marginInline: 'auto', display: 'flex', flexWrap: 'wrap', gap: 'clamp(18px, 2.6vw, 36px)', alignItems: 'center' }}>
          <div style={{ flex: '1.05 1 min(340px, 100%)', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <PhotoCard src={`${BASE}/images/alphafold-protein.png`}
              alt="AlphaFold가 예측한 ZNF555 단백질의 리본 구조"
              credit="AlphaFold 예측 단백질 구조(ZNF555) · Wikimedia Commons · CC BY 4.0" />
            <LinkPill href="https://deepmind.google/science/alphafold/" label="AlphaFold 더 알아보기 (DeepMind)" />
          </div>
          <div style={{ flex: '1 1 min(340px, 100%)', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 1.8vh, 18px)' }}>
            <Reveal>
              <Kicker>현장 1/9 · 생명과학</Kicker>
              <h2 className="headline" style={{ marginTop: 8, ...kw }}>
                <span className="accent-text">50년 난제</span>가 풀린 날
              </h2>
            </Reveal>
            <Build at={1}>
              <div style={{ ...card, borderColor: 'color-mix(in srgb, var(--fg) 18%, transparent)' }}>
                <div style={{ fontWeight: 800, fontSize: 'clamp(14.5px, 1.6vw, 17px)', ...kw }}>단백질 구조 1개 = 몇 달~몇 년</div>
                <p style={{ color: 'var(--fg-muted)', fontSize: 13.5, lineHeight: 1.6, marginTop: 4, ...kw }}>
                  X선 결정학·극저온 전자현미경 — 값비싼 장비와 긴 실험의 영역이었다.
                </p>
              </div>
            </Build>
            <Build at={2}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                <span className="figure" style={{ fontSize: 'clamp(38px, 4.6vw, 62px)', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--primary)', lineHeight: 1 }}>2억 개</span>
                <span style={{ fontWeight: 700, fontSize: 'clamp(13.5px, 1.6vw, 16px)', color: 'var(--fg-muted)', ...kw }}>
                  2022년 공개 — 실험으로 하면 <strong style={{ color: 'var(--fg)' }}>수억 년</strong> 분량
                </span>
              </div>
            </Build>
            <Build at={3}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a href={THINKING_GAME_URL} target="_blank" rel="noopener"
                  style={{ display: 'flex', gap: 14, alignItems: 'center', textDecoration: 'none', ...card, padding: 12, borderColor: 'color-mix(in srgb, var(--primary) 40%, transparent)' }}>
                  <span style={{ position: 'relative', flex: 'none', width: 128, borderRadius: 10, overflow: 'hidden', display: 'block' }}>
                    <img src={`${BASE}/images/thinking-game-thumb.jpg`} alt="The Thinking Game 다큐멘터리 장면" style={{ display: 'block', width: '100%' }} />
                    <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                      <span style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent)', display: 'grid', placeItems: 'center' }}>
                        <span style={{ width: 0, height: 0, marginLeft: 3, borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderLeft: '11px solid var(--accent-ink)' }} />
                      </span>
                    </span>
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 800, color: 'var(--fg)', fontSize: 'clamp(13.5px, 1.5vw, 15.5px)', textDecoration: 'underline', textUnderlineOffset: 4, textDecorationColor: 'color-mix(in srgb, var(--primary) 45%, transparent)', ...kw }}>
                      「The Thinking Game」 — 문제가 풀리는 순간, 클립 시청
                    </span>
                    <span style={{ display: 'block', color: 'var(--fg-muted)', fontSize: 12, marginTop: 4 }}>Google DeepMind 공식 · 무료 공개 · 전체 83분</span>
                  </span>
                </a>
                <ChipGain no={1} />
              </div>
            </Build>
          </div>
        </div>
      </Slide>

      {/* S4 AI 신약 */}
      <Slide nav="신약"
        notes="2조 원짜리 15년 레이스에서 AI가 맡은 구간은 '출발 구간'입니다. 그 구간이 몇 년에서 몇 달로 줄면, 뒤에 뭐가 달라질까요? — 이 질문, 활동지에 다시 나옵니다.">
        <div style={{ width: 'min(1180px, 100%)', marginInline: 'auto', display: 'flex', flexWrap: 'wrap', gap: 'clamp(18px, 2.6vw, 36px)', alignItems: 'center' }}>
          <div style={{ flex: '1.5 1 min(420px, 100%)', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 2vh, 20px)' }}>
            <Reveal>
              <Kicker>현장 1/9 · 생명과학 — 그다음</Kicker>
              <h2 className="headline" style={{ marginTop: 8, ...kw }}>
                AI가 설계한 약, <span className="accent-text">사람에게 가다</span>
              </h2>
            </Reveal>
            <Reveal><DrugPipeline /></Reveal>
            <Reveal>
              <div style={{ ...card, borderColor: 'color-mix(in srgb, var(--primary) 35%, transparent)', background: 'color-mix(in srgb, var(--primary) 5%, var(--surface-2))' }}>
                <span style={{ fontWeight: 800, fontSize: 'clamp(13.5px, 1.5vw, 16px)', ...kw }}>
                  생각해 보기 — “어떤 분자를 만들지 고르는” 단계만 AI가 대신해도, 무엇이 달라질까?
                </span>
                <span style={{ display: 'block', color: 'var(--fg-muted)', fontSize: 12.5, marginTop: 4 }}>→ 활동지 C에서 이 질문으로 아이디어를 만든다</span>
              </div>
            </Reveal>
          </div>
          <div style={{ flex: '1 1 min(280px, 100%)', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Reveal>
              <PhotoCard src={`${BASE}/images/ai-drug-lab.jpg`}
                alt="피펫으로 시료를 옮기는 신약 연구원"
                credit="신약 연구 실험실 — Rhoda Baer / NIH (Public domain)" />
            </Reveal>
            <Reveal>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <LinkPill href="https://www.isomorphiclabs.com" label="Isomorphic Labs" />
                <LinkPill href="https://insilico.com" label="Insilico Medicine" />
              </div>
            </Reveal>
          </div>
        </div>
      </Slide>

      {/* S5 한국 의료 AI */}
      <Slide nav="한국 의료"
        notes="여러분이 건강검진에서 찍는 흉부 X-ray, 이미 AI가 한 번 같이 봅니다. 그리고 이 회사들 — 판교에 있어요. 이 교실에서 갈 수 있는 진로라는 뜻입니다.">
        <div style={{ width: 'min(1180px, 100%)', marginInline: 'auto', display: 'flex', flexWrap: 'wrap', gap: 'clamp(18px, 2.6vw, 36px)', alignItems: 'center' }}>
          <div style={{ flex: '0.9 1 min(280px, 100%)', minWidth: 0 }}>
            <PhotoCard src={`${BASE}/images/chest-xray.jpg`}
              alt="흉부 X-ray 정상 소견 — AI 판독이 다루는 의료영상의 예"
              credit="흉부 X-ray 자료 사진 — Mikael Häggström (CC0) · AI 판독 대상 영상의 예"
              imgStyle={{ maxHeight: '52vh' }} />
          </div>
          <div style={{ flex: '1.35 1 min(360px, 100%)', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'clamp(11px, 1.7vh, 17px)' }}>
            <Reveal>
              <Kicker>현장 2/9 · 병원 — 한국</Kicker>
              <h2 className="headline" style={{ marginTop: 8, ...kw }}>
                우리나라 병원에서는 <span className="accent-text">이미</span>
              </h2>
            </Reveal>
            <Build at={1}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                  { v: '3,600+', d: '루닛 사용 기관 (전 세계)' },
                  { v: '1,970만 건', d: '연간 의료영상 분석' },
                  { v: '92%', d: '매출의 해외 비중 (768억/831억)' },
                ].map((s) => (
                  <div key={s.d} style={{ ...card, flex: '1 1 140px', padding: '12px 16px' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 'clamp(19px, 2.2vw, 26px)', color: 'var(--primary)' }}>{s.v}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', marginTop: 3, ...kw }}>{s.d}</div>
                  </div>
                ))}
              </div>
            </Build>
            <Build at={2}>
              <div style={{ ...card, display: 'flex', gap: 14, alignItems: 'center', borderColor: `color-mix(in srgb, ${C.amber} 45%, transparent)` }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 'clamp(14px, 1.6vw, 16.5px)', ...kw }}>
                    뷰노 딥카스 — 심정지를 <span style={{ color: C.amber }}>몇 시간 먼저</span> 경고
                  </div>
                  <p style={{ color: 'var(--fg-muted)', fontSize: 13, lineHeight: 1.55, marginTop: 4, ...kw }}>
                    입원 환자의 활력 징후에서 위험 신호를 미리 읽는다 (뷰노 2025 매출 348억).
                  </p>
                </div>
              </div>
            </Build>
            <Build at={3}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-muted)', marginRight: 4, ...kw }}>식약처 AI 의료기기 허가</span>
                  {[['2023', 62, 26], ['2024', 108, 40], ['2025', 157, 56]].map(([y, v, h]) => (
                    <span key={y} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 13.5, color: 'var(--primary)' }}>{v}건</span>
                      <span style={{ width: 44, height: h as number, borderRadius: 6, background: 'var(--accent)', opacity: 0.5 + (h as number) / 120 }} />
                      <span style={{ fontSize: 11, color: 'var(--fg-faint)', fontFamily: 'var(--font-mono)' }}>{y}</span>
                    </span>
                  ))}
                  <span style={{ fontSize: 12.5, color: 'var(--fg-muted)', marginLeft: 6 }}>3년 새 2.5배</span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <ChipGain no={2} />
                  <ChipGain no={3} />
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <LinkPill href="https://www.lunit.io" label="루닛" />
                  <LinkPill href="https://www.vuno.co" label="뷰노" />
                </div>
              </div>
            </Build>
          </div>
        </div>
      </Slide>

      {/* S6 GenCast 씬 */}
      <Slide full nav="기상"
        notes="작년까지 이 계산은 슈퍼컴퓨터가 몇 시간 돌리던 일입니다. 그런데 보세요 — 아까 단백질에서 본 칩이 하늘에서 또 나왔죠? 이게 오늘 수업의 진짜 주제입니다. 참고로 어떤 기상청도 기존 시스템을 버리지 않았어요 — 나란히 돌립니다.">
        <Scene><TyphoonScene /></Scene>
        <Build at={1} style={{ position: 'absolute', right: 'clamp(16px, 3vw, 44px)', bottom: 'clamp(88px, 13vh, 130px)', zIndex: 5 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, maxWidth: 'min(480px, 38vw)' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 15px', borderRadius: 12,
              background: 'var(--surface-2)', border: '1.5px solid var(--hair)', fontSize: 12.5, fontWeight: 700, color: 'var(--fg)', ...kw,
            }}>
              균형 — 주요 기상청 모두 기존 수치예보와 <span style={{ color: C.amber }}>병행 운영</span> 중
            </div>
            <ChipGain no={1} note="단백질에서 본 칩이 하늘에서 또!" />
          </div>
        </Build>
      </Slide>

      {/* S7 웨이모 */}
      <Slide nav="자율주행"
        notes="찬반이 갈리는 게 정상입니다. 이 질문은 정답이 없고, 활동지 마지막에 여러분 생각을 적는 칸이 있어요.">
        <div style={{ width: 'min(1180px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 2vh, 20px)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(16px, 2.4vw, 30px)', alignItems: 'stretch' }}>
            <div style={{ flex: '1.4 1 min(380px, 100%)', minWidth: 0, position: 'relative' }}>
              <PhotoCard src={`${BASE}/images/waymo-street.jpg`}
                alt="샌프란시스코 시내를 주행 중인 웨이모 재규어 I-Pace 로보택시"
                credit="샌프란시스코, 2026.1 — 4300streetcar · CC BY 4.0 · Wikimedia Commons"
                imgStyle={{ maxHeight: '46vh' }} />
              <Reveal>
                <div style={{
                  position: 'absolute', top: 14, left: 14, padding: '10px 16px', borderRadius: 14,
                  background: 'rgba(255,255,255,0.92)', border: '1px solid var(--hair)', boxShadow: 'var(--glow)',
                }}>
                  <div className="kicker" style={{ color: 'var(--primary)', fontSize: 11 }}>현장 4/9 · 도로 — Waymo</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 'clamp(22px, 2.8vw, 34px)', color: 'var(--fg)', lineHeight: 1.15 }}>
                    2,000만 회
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>누적 무인 운행 (2026.5)</div>
                </div>
              </Reveal>
            </div>
            <div style={{ flex: '1 1 min(300px, 100%)', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Reveal>
                <h2 className="headline" style={kw}>운전석이 <span className="accent-text">빈 택시</span>의 도시</h2>
              </Reveal>
              <Reveal>
                <div style={{ ...card, borderColor: `color-mix(in srgb, ${C.cyan} 40%, transparent)`, flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: C.cyan, letterSpacing: '0.08em', marginBottom: 8 }}>일상이 됐다</div>
                  {['로보택시 약 3,000대 · 미국 10개 도시 (2026.2)', '2026년 말 목표 — 주당 100만 회 운행', '런던·도쿄 등 첫 해외 진출 준비'].map((f) => (
                    <p key={f} style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--fg)', fontWeight: 600, ...kw }}>· {f}</p>
                  ))}
                </div>
              </Reveal>
              <Reveal>
                <div style={{ ...card, padding: '12px 16px', borderColor: `color-mix(in srgb, ${C.amber} 45%, transparent)`, background: `color-mix(in srgb, ${C.amber} 5%, var(--surface-2))` }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: C.amber, letterSpacing: '0.08em', marginBottom: 6 }}>완벽하진 않다</div>
                  <p style={{ fontSize: 12.5, lineHeight: 1.65, color: 'var(--fg-muted)', ...kw }}>
                    · 공사구역 오진입 단기간 6건 (2026.5)<br />· 미 도로교통안전국, 긴급차량 방해 경고 (2026.7)
                  </p>
                </div>
              </Reveal>
              <Reveal><LinkPill href="https://waymo.com" label="Waymo" /></Reveal>
            </div>
          </div>
          <Build at={1}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '13px 20px', borderRadius: 16,
              border: '1.5px solid color-mix(in srgb, var(--primary) 40%, transparent)', background: 'color-mix(in srgb, var(--primary) 6%, var(--surface-2))',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 12, color: 'var(--primary)', letterSpacing: '0.1em' }}>토론</span>
              <span style={{ fontWeight: 800, fontSize: 'clamp(14px, 1.7vw, 17px)', ...kw }}>
                완벽하지 않은데 왜 허용할까? — “사람보다 나으면” 충분한가?
              </span>
              <span style={{ color: 'var(--fg-muted)', fontSize: 12.5 }}>→ 활동지 D에서 입장 선택</span>
            </div>
          </Build>
        </div>
      </Slide>

      {/* S8 휴머노이드 */}
      <Slide nav="휴머노이드"
        notes="로봇이 무서운 게 아니라 흥미로운 지점이 여기예요 — 이제 로봇을 가르치는 언어가 코드가 아니라 '시범'입니다. 말로 설명 못 하고 몸으로만 아는 기술, 여러분도 하나쯤 있죠? 그게 데이터가 되는 시대입니다.">
        <div style={{ width: 'min(1180px, 100%)', marginInline: 'auto', display: 'flex', flexWrap: 'wrap-reverse', gap: 'clamp(18px, 2.6vw, 36px)', alignItems: 'center' }}>
          <div style={{ flex: '1.3 1 min(380px, 100%)', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'clamp(11px, 1.7vh, 17px)' }}>
            <Reveal>
              <Kicker>현장 5/9 · 공장</Kicker>
              <h2 className="headline" style={{ marginTop: 8, ...kw }}>
                공장에 <span className="accent-text">출근한</span> 휴머노이드
              </h2>
            </Reveal>
            <Build at={1}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { co: 'Figure 02', f: 'BMW 스파르탄버그 공장 — 11개월 파일럿 완료' },
                  { co: '전기식 Atlas', f: '현대차 공장에서 가동 중' },
                  { co: 'Optimus', f: '테슬라 자사 공장에 투입' },
                ].map((r) => (
                  <div key={r.co} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                    <span style={{ flex: 'none', fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 800, color: 'var(--primary)', width: 108 }}>{r.co}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', ...kw }}>{r.f}</span>
                  </div>
                ))}
              </div>
            </Build>
            <Build at={2}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--fg-muted)', letterSpacing: '0.06em', marginBottom: 8 }}>비결 — 모방 학습 (imitation learning)</div>
                <ImitationDiagram />
              </div>
            </Build>
            <Build at={3}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <span style={{ ...card, padding: '9px 16px', fontWeight: 800, fontSize: 'clamp(13.5px, 1.6vw, 16px)', ...kw }}>
                    새 작업 가르치기 — <s style={{ color: 'var(--fg-faint)' }}>전문가 몇 주 프로그래밍</s> → <span style={{ color: C.green }}>몇 시간의 시연 데이터</span>
                  </span>
                </div>
                <ChipGain no={4} />
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <LinkPill href="https://bostondynamics.com/atlas" label="Boston Dynamics Atlas" />
                  <LinkPill href="https://www.figure.ai" label="Figure" />
                </div>
              </div>
            </Build>
          </div>
          <div style={{ flex: '0.85 1 min(260px, 100%)', minWidth: 0 }}>
            <PhotoCard src={`${BASE}/images/atlas-robot.jpg`}
              alt="현대차그룹 전시장의 전기식 Atlas 휴머노이드 로봇"
              credit="전기식 Atlas, 현대차그룹 전시 — Damian B Oh · CC BY-SA 4.0 · Commons"
              imgStyle={{ maxHeight: '58vh', objectPosition: '50% 30%' }} />
          </div>
        </div>
      </Slide>

      {/* S9 수학 씬 */}
      <Slide full nav="수학"
        notes="제일 소름 돋는 대목은 이겁니다 — 이 발견들 상당수를 여러분 또래보다 몇 살 위인 학부생들이, 누구나 쓸 수 있는 공개 모델로 해냈어요. 도구는 이미 여러분 손에도 있다는 뜻입니다.">
        <Scene><BoardScene /></Scene>
        <Build at={1} style={{ position: 'absolute', right: 'clamp(28px, 5vw, 90px)', bottom: 'clamp(132px, 18vh, 178px)', zIndex: 5 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
            <div style={{
              transform: 'rotate(3deg)', padding: '10px 18px', borderRadius: 10,
              border: `2.5px solid ${C.rose}`, color: C.rose, fontWeight: 800, fontSize: 'clamp(13px, 1.5vw, 16px)',
              background: 'rgba(255,255,255,0.9)', letterSpacing: '0.02em', ...kw,
            }}>
              발견자 다수 = 공개 LLM을 쓴 학부생·아마추어
            </div>
            <ChipGain no={5} />
          </div>
        </Build>
      </Slide>

      {/* S10 헤르쿨라네움 */}
      <Slide nav="두루마리"
        notes="이 프로젝트 이름이 '베수비오 챌린지' — 상금을 걸고 전 세계 누구나 참가하게 한 공개 대회였습니다. 우승팀에 대학생이 있었어요. 두 번째로 같은 칩이 나왔죠? 병원 X-ray와 고대 문서 — 완전히 다른 분야, 같은 패턴.">
        <div style={{ width: 'min(1180px, 100%)', marginInline: 'auto', display: 'flex', flexWrap: 'wrap', gap: 'clamp(18px, 2.6vw, 36px)', alignItems: 'center' }}>
          <div style={{ flex: '1 1 min(320px, 100%)', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <PhotoCard src={`${BASE}/images/herculaneum-scroll.jpg`}
              alt="탄화된 헤르쿨라네움 파피루스 두루마리와 CT 촬영 장비"
              credit="탄화 파피루스와 스캔 준비 — Stabile et al. · CC BY 4.0 · Commons"
              imgStyle={{ maxHeight: '46vh' }} />
            <LinkPill href="https://scrollprize.org" label="Vesuvius Challenge — 지금도 진행 중" />
          </div>
          <div style={{ flex: '1.15 1 min(360px, 100%)', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'clamp(11px, 1.7vh, 17px)' }}>
            <Reveal>
              <Kicker>현장 7/9 · 고대 문서</Kicker>
              <h2 className="headline" style={{ marginTop: 8, ...kw }}>
                펼치면 부서지는 책을 <span className="accent-text">읽는 법</span>
              </h2>
            </Reveal>
            <Build at={1}>
              <p className="lead" style={{ fontSize: 'clamp(15px, 1.8vw, 19px)', ...kw }}>
                79년 베수비오 화산재에 탄화 — <strong style={{ color: 'var(--fg)' }}>읽으려면 파괴해야 하는 책</strong>이 2,000년을 기다렸다.
              </p>
            </Build>
            <Build at={2}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['① CT로 말린 층 추적', '② 가상으로 펼침', '③ AI가 잉크 흔적 검출'].map((s, i) => (
                    <span key={s} style={{ ...card, padding: '9px 14px', fontSize: 13, fontWeight: 700, borderColor: `color-mix(in srgb, ${[C.blue, C.cyan, C.violet][i]} 40%, transparent)`, ...kw }}>{s}</span>
                  ))}
                </div>
                <p style={{ color: 'var(--fg-muted)', fontSize: 13.5, lineHeight: 1.65, ...kw }}>
                  2026.6.25 — <strong style={{ color: 'var(--fg)' }}>PHerc. 1667</strong>, 한 번도 열지 않은 채 처음부터 끝까지 판독.
                  약 1.5m · 20여 개 단의 그리스어 · 기원전 2세기 스토아 윤리학.
                </p>
              </div>
            </Build>
            <Build at={3}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ ...card, padding: '11px 16px', borderColor: `color-mix(in srgb, ${C.green} 45%, transparent)` }}>
                  <span style={{ fontWeight: 800, fontSize: 'clamp(13.5px, 1.6vw, 16px)', ...kw }}>
                    AI는 잉크 신호를 복원했을 뿐 — 그리스어로 읽어낸 건 <span style={{ color: C.green }}>파피루스 학자들</span>
                  </span>
                  <span style={{ display: 'block', color: 'var(--fg-muted)', fontSize: 12.5, marginTop: 3, ...kw }}>대체가 아니라 증폭 — 오늘 수업에서 가장 중요한 구조</span>
                </div>
                <ChipGain no={2} note="병원 X-ray에서 본 칩 — 고고학에서 재등장" />
              </div>
            </Build>
          </div>
        </div>
      </Slide>

      {/* S11 고래 */}
      <Slide full nav="고래"
        notes="고래 한 마리가 평생 내는 소리를 사람이 다 들으려면 몇 년이 걸립니다. 9,000개를 패턴으로 정리한 건 기계학습이었어요. 만약 10년 안에 고래와 최소한의 '대화'가 된다면 — 포경 금지 논쟁은 어떻게 될까요?">
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ position: 'relative', flex: '1.85 1 0', minHeight: 0 }}>
            <img src={`${BASE}/images/sperm-whale.jpg`} alt="어미와 새끼 향유고래가 함께 헤엄치는 수중 사진"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(6,30,60,0.12), transparent 35%, rgba(240,247,255,0.0) 75%, var(--bg) 100%)' }} />
            <Reveal>
              <div style={{ position: 'absolute', left: 'clamp(18px, 4vw, 60px)', top: 'clamp(18px, 4vh, 44px)' }}>
                <div className="kicker" style={{ color: '#e0f2fe' }}>현장 8/9 · 바다 — Project CETI</div>
                <h2 className="display" style={{ color: '#fff', marginTop: 8, textShadow: '0 2px 24px rgba(2, 22, 48, 0.55)', ...kw }}>
                  고래의 말을 받아 적다
                </h2>
              </div>
            </Reveal>
            <Reveal>
              <div style={{ position: 'absolute', left: 'clamp(18px, 4vw, 60px)', bottom: 22, width: 'min(600px, 46vw)', padding: '14px 18px', borderRadius: 14, background: 'rgba(4, 26, 52, 0.58)', backdropFilter: 'blur(4px)' }}>
                <CodaNotation />
              </div>
            </Reveal>
            <span style={{ position: 'absolute', right: 16, top: 14, fontSize: 10.5, color: 'rgba(255,255,255,0.78)' }}>
              Gabriel Barathieu · CC BY-SA 2.0 · Wikimedia Commons
            </span>
          </div>
          <div style={{ flex: '1 0 auto', display: 'flex', alignItems: 'center', gap: 'clamp(14px, 2.4vw, 30px)', flexWrap: 'wrap', padding: 'clamp(14px, 2.4vh, 24px) clamp(18px, 4vw, 60px) clamp(18px, 3vh, 30px)' }}>
            <Reveal>
              <div style={{ maxWidth: 560 }}>
                <p style={{ fontWeight: 700, fontSize: 'clamp(14px, 1.7vw, 17px)', lineHeight: 1.6, ...kw }}>
                  카리브해 향유고래 클랜의 코다 <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>9,000개</span>를 분석 —
                  일종의 <strong>음성 알파벳</strong>의 증거를 발견했다.
                </p>
                <p style={{ color: 'var(--fg-muted)', fontSize: 13, lineHeight: 1.6, marginTop: 6, ...kw }}>
                  2025.11 UC버클리와 “모음 같은 소리” 연구 발표 · 구글 DolphinGemma는 돌고래 발성 전용 오디오 모델.
                </p>
              </div>
            </Reveal>
            <Reveal>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
                <ChipGain no={6} />
                <LinkPill href="https://www.projectceti.org" label="Project CETI" />
              </div>
            </Reveal>
          </div>
        </div>
      </Slide>

      {/* S12 BCI */}
      <Slide nav="뇌"
        notes="숫자 하나만 기억하세요 — 3,801시간. 시연이 아니라 생활이 됐다는 숫자입니다. 그리고 정직하게 말할게요 — 아직 승인된 제품은 하나도 없습니다. 여러분이 대학을 졸업할 때쯤이 이 기술의 승부처예요.">
        <div style={{ width: 'min(1180px, 100%)', marginInline: 'auto', display: 'flex', flexWrap: 'wrap', gap: 'clamp(18px, 2.6vw, 36px)', alignItems: 'center' }}>
          <div style={{ flex: '1.35 1 min(380px, 100%)', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 1.8vh, 18px)' }}>
            <Reveal>
              <Kicker>현장 9/9 · 뇌</Kicker>
              <h2 className="headline" style={{ marginTop: 8, ...kw }}>
                생각을 <span className="accent-text">문장으로</span>
              </h2>
            </Reveal>
            <Reveal>
              <p style={{ color: 'var(--fg-muted)', lineHeight: 1.65, fontSize: 'clamp(13.5px, 1.6vw, 16px)', ...kw }}>
                ALS로 말을 잃어가던 참가자가 <strong style={{ color: 'var(--fg)' }}>말하려는 시도</strong>만으로
                다시 문장을 만들었다 (Nature Medicine, 2026.6).
              </p>
            </Reveal>
            <Reveal><BciJourney /></Reveal>
            <Reveal>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <span className="figure" style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 'clamp(34px, 4.2vw, 54px)', color: 'var(--primary)', lineHeight: 1 }}>3,801시간</span>
                <span style={{ ...card, padding: '8px 14px', fontWeight: 800, fontSize: 13.5, borderColor: `color-mix(in srgb, ${C.green} 45%, transparent)`, color: C.green }}>연구실이 아니라 집에서</span>
              </div>
            </Reveal>
            <Reveal>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ ...card, padding: '10px 16px', borderColor: `color-mix(in srgb, ${C.amber} 45%, transparent)`, background: `color-mix(in srgb, ${C.amber} 5%, var(--surface-2))` }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-muted)', ...kw }}>
                    균형 — 2026년 현재 FDA 시판 전 승인을 받은 이식형 BCI는 <strong style={{ color: 'var(--fg)' }}>없다</strong>. 전부 연구 단계다.
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <ChipGain no={6} note="고래 다음은, 사람의 뇌 신호" />
                  <LinkPill href="https://www.braingate.org" label="BrainGate 연구팀" />
                </div>
              </div>
            </Reveal>
          </div>
          <div style={{ flex: '0.8 1 min(250px, 100%)', minWidth: 0 }}>
            <PhotoCard src={`${BASE}/images/bci-braingate.jpg`}
              alt="BrainGate 뇌-컴퓨터 인터페이스의 구조를 보여주는 전시 모형"
              credit="BrainGate 인터페이스 전시 모형 — PaulWicks (Public domain)"
              imgStyle={{ maxHeight: '56vh', objectPosition: '50% 42%' }} />
          </div>
        </div>
      </Slide>

      {/* S13 패턴 보드 씬 */}
      <Slide full nav="패턴 보드"
        notes="아홉 현장을 지나며 칩이 여섯 개 모였습니다. 두 번 나온 칩이 있었죠? — 패턴은 분야를 가리지 않는다는 증거입니다. 이제 이 칩을 여러분 분야에 꽂아 볼 차례예요.">
        <Scene><MotherboardScene /></Scene>
      </Slide>

      {/* S14 탐구 미션 */}
      <Slide nav="미션"
        notes="조건은 하나 — 칩이 꽂혀야 아이디어입니다. '그냥 AI 쓰면 좋겠다'는 칩이 없어요. 어떤 패턴인지 말할 수 있어야 합니다.">
        <div style={{ width: 'min(1100px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 2.4vh, 28px)', textAlign: 'center' }}>
          <Reveal>
            <Kicker>이제 여러분 차례</Kicker>
            <h2 className="headline" style={{ marginTop: 8, marginInline: 'auto', ...kw }}>
              탐구 미션 — <span className="accent-text">열 번째 현장</span>을 찾아라
            </h2>
          </Reveal>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(12px, 1.8vw, 22px)', alignItems: 'flex-end', justifyContent: 'center', textAlign: 'left' }}>
            {[
              { n: '①', at: 1, lift: 0, tone: C.blue, title: '나만의 AI 기술 조사', d: '오늘 안 나온 기술·사례 1개 — 이름, 분야, 무엇을 하나, 출처 링크까지.', tag: '활동지 B' },
              { n: '②', at: 2, lift: 26, tone: C.violet, title: '패턴 칩 판정', d: '그 기술은 6개 칩 중 무엇인가? (복수 가능) — 판정 이유 한 줄.', tag: '활동지 B' },
              { n: '③', at: 3, lift: 52, tone: C.rose, title: '칩 × 내 분야 아이디어', d: '칩 1개 × 관심 분야(농업·스포츠·음악·우리 학교·지역…)를 교차해 새 아이디어.', tag: '활동지 C' },
            ].map((m) => (
              <Build key={m.n} at={m.at}>
                <div style={{
                  ...card, width: 'min(300px, 86vw)',
                  marginBottom: `clamp(0px, ${m.lift / 10}vh, ${m.lift}px)`,
                  borderColor: `color-mix(in srgb, ${m.tone} 45%, transparent)`,
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 21, color: m.tone }}>{m.n}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--fg-faint)', border: '1px solid var(--hair)', borderRadius: 999, padding: '3px 10px', fontFamily: 'var(--font-mono)' }}>{m.tag}</span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 'clamp(15.5px, 1.8vw, 18px)', ...kw }}>{m.title}</div>
                  <p style={{ color: 'var(--fg-muted)', fontSize: 13.5, lineHeight: 1.6, ...kw }}>{m.d}</p>
                </div>
              </Build>
            ))}
          </div>
          <Build at={3}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-muted)' }}>탐색 힌트</span>
              {['뉴스: “AI + 농업”처럼 검색', 'DeepMind · Boston Dynamics · NASA 유튜브', '오늘 슬라이드의 링크들'].map((h) => (
                <span key={h} style={{ ...card, padding: '7px 13px', fontSize: 12.5, fontWeight: 600, borderRadius: 999, ...kw }}>{h}</span>
              ))}
              <span style={{
                transform: 'rotate(-2deg)', padding: '7px 14px', borderRadius: 8, border: `2px solid ${C.rose}`,
                color: C.rose, fontWeight: 800, fontSize: 12.5, ...kw,
              }}>“그냥 챗GPT로 숙제” — 칩 판정 불가</span>
            </div>
          </Build>
        </div>
      </Slide>

      {/* S15 활동지 */}
      <Slide nav="활동지"
        notes="잘 쓴 일지의 기준은 화려한 게 아니라 칩이 정확히 꽂힌 겁니다. 다음 시간 첫 5분, 여러분이 찾은 현장 중 하나로 수업을 시작할 거예요.">
        <div style={{
          width: 'min(1080px, 100%)', marginInline: 'auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(330px, 100%), 1fr))',
          gap: 'clamp(20px, 3vw, 46px)', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Reveal>
              <Kicker>기록 — AI 세상 탐험 일지</Kicker>
              <h2 className="headline" style={{ marginTop: 8, ...kw }}>
                일지를 열고, <span className="accent-text">칩을 꽂자</span>
              </h2>
            </Reveal>
            <Reveal>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  ['A', '오늘의 발견', '가장 인상 깊은 현장 1곳 + 이유', C.blue],
                  ['B', '나의 탐구', '스스로 찾은 AI 기술 + 칩 판정', C.violet],
                  ['C', '칩 × 분야', '내 관심 분야와 교차한 새 아이디어', C.rose],
                  ['D', '피치 + 토론', '한 문장 요약 + 자율주행 토론 입장', C.green],
                ].map(([s, t2, d, tone]) => (
                  <div key={s as string} style={{ display: 'flex', gap: 12, alignItems: 'center', ...card, padding: '10px 16px' }}>
                    <span style={{
                      flex: 'none', width: 30, height: 30, borderRadius: 9, display: 'grid', placeItems: 'center',
                      background: `color-mix(in srgb, ${tone} 14%, transparent)`, color: tone as string, fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: 14,
                    }}>{s}</span>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontWeight: 800, fontSize: 14.5 }}>{t2}</span>
                      <span style={{ color: 'var(--fg-muted)', fontSize: 12.5, marginLeft: 10, ...kw }}>{d}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal>
              <p style={{ color: 'var(--fg-muted)', fontSize: 13.5, lineHeight: 1.6, ...kw }}>
                제출하면 자동 기록 → <strong style={{ color: 'var(--fg)' }}>다음 수업의 재료</strong>가 된다.
                제출된 아이디어 중 투표로 “오늘의 10번째 현장”을 뽑는다.
              </p>
            </Reveal>
            <Reveal>
              <div style={{ ...card, padding: '10px 16px', borderColor: `color-mix(in srgb, ${C.amber} 45%, transparent)`, background: `color-mix(in srgb, ${C.amber} 5%, var(--surface-2))` }}>
                <span style={{ fontSize: 13, fontWeight: 700, ...kw }}>
                  🔑 제출할 때 <strong>암호</strong>를 정한다 — 나중에 <strong>[제출 확인]</strong>에서
                  반/번호·이름·암호로 내 제출을 다시 볼 수 있다. <span style={{ color: C.rose }}>평소 쓰는 비밀번호는 금지.</span>
                </span>
              </div>
            </Reveal>
          </div>
          <Reveal>
            <div style={{ ...card, textAlign: 'center', padding: 'clamp(22px, 3vh, 36px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, boxShadow: 'var(--glow)' }}>
              <img src={`${BASE}/images/activity-qr.png`} alt="활동지 접속 QR 코드"
                style={{ width: 'min(230px, 56vw)', borderRadius: 14, border: '8px solid #fff', background: '#fff', boxShadow: '0 8px 30px rgba(15,55,105,0.12)' }} />
              <a href={ACTIVITY_URL} target="_blank" rel="noopener"
                style={{
                  display: 'inline-block', padding: '13px 28px', borderRadius: 999,
                  background: 'var(--accent)', color: 'var(--accent-ink)', fontWeight: 800,
                  textDecoration: 'none', fontSize: 'clamp(14px, 1.6vw, 17px)',
                }}>
                탐험 일지 열기 ↗
              </a>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--fg-muted)', ...kw }}>
                2026kijunit.netlify.app → 인공지능 기초 → 활동지
              </span>
              <a href={BOARD_URL} target="_blank" rel="noopener"
                style={{
                  fontSize: 12.5, fontWeight: 700, color: 'var(--primary)', textDecoration: 'underline',
                  textUnderlineOffset: 4, textDecorationColor: 'color-mix(in srgb, var(--primary) 45%, transparent)', ...kw,
                }}>
                📋 제출 현황 페이지 — 냈는지 확인하고 내 자료 다시 열기 ↗
              </a>
            </div>
          </Reveal>
        </div>
      </Slide>

      {/* S16 링크 허브 */}
      <Slide nav="더 멀리"
        notes="숙제가 아닙니다 — 문입니다. 오늘 아홉 현장 중 하나라도 심장이 뛰었다면, 그 링크가 여러분의 진로 검색 첫 페이지가 될 수 있어요.">
        <div style={{ width: 'min(1160px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 2.2vh, 24px)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(18px, 2.6vw, 36px)', alignItems: 'stretch' }}>
            <div style={{ flex: '1.25 1 min(380px, 100%)', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Reveal>
                <Kicker>더 멀리 가고 싶다면</Kicker>
                <h2 className="headline" style={{ marginTop: 8, ...kw }}>
                  모든 현장에 <span className="accent-text">문이 열려 있다</span>
                </h2>
              </Reveal>
              <Reveal>
                <a href={THINKING_GAME_URL} target="_blank" rel="noopener"
                  style={{ position: 'relative', display: 'block', borderRadius: 18, overflow: 'hidden', border: '1px solid var(--hair)', boxShadow: 'var(--shadow)', textDecoration: 'none' }}>
                  <img src={`${BASE}/images/thinking-game-thumb.jpg`} alt="The Thinking Game 다큐멘터리 — 데미스 허사비스와 딥마인드 팀"
                    style={{ display: 'block', width: '100%', maxHeight: '38vh', objectFit: 'cover' }} />
                  <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(3, 22, 46, 0.78), transparent 55%)' }} />
                  <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ flex: 'none', width: 46, height: 46, borderRadius: '50%', background: 'var(--accent)', display: 'grid', placeItems: 'center', boxShadow: 'var(--glow)' }}>
                      <span style={{ width: 0, height: 0, marginLeft: 4, borderTop: '9px solid transparent', borderBottom: '9px solid transparent', borderLeft: '15px solid var(--accent-ink)' }} />
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', color: '#fff', fontWeight: 800, fontSize: 'clamp(15px, 1.8vw, 19px)', ...kw }}>「The Thinking Game」 전체 시청</span>
                      <span style={{ display: 'block', color: 'rgba(255,255,255,0.82)', fontSize: 12.5 }}>83분 · 무료 · 「AlphaGo」 감독 작품 — 추천 1순위</span>
                    </span>
                  </span>
                </a>
              </Reveal>
            </div>
            <div style={{ flex: '1 1 min(300px, 100%)', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 9 }}>
              {[
                { name: 'Vesuvius Challenge', d: '두루마리 해독 공개 대회 — 지금도 진행 중', href: 'https://scrollprize.org', tone: C.violet },
                { name: 'Project CETI', d: '향유고래 언어 해독 프로젝트', href: 'https://www.projectceti.org', tone: C.pink },
                { name: 'AlphaFold (DeepMind)', d: '단백질 구조 예측 — 5년의 영향', href: 'https://deepmind.google/science/alphafold/', tone: C.cyan },
                { name: 'GenCast 블로그', d: 'AI 기상 예보 — 태풍 앙상블 애니메이션', href: 'https://deepmind.google/discover/blog/gencast-predicts-weather-and-the-risks-of-extreme-conditions-with-sota-accuracy/', tone: C.blue },
                { name: 'Boston Dynamics 유튜브', d: '휴머노이드 로봇 최신 영상', href: 'https://www.youtube.com/@BostonDynamics', tone: C.green },
              ].map((l) => (
                <Reveal key={l.name}>
                  <a href={l.href} target="_blank" rel="noopener"
                    style={{ display: 'flex', gap: 12, alignItems: 'center', textDecoration: 'none', ...card, padding: '10px 16px' }}>
                    <span style={{ flex: 'none', width: 9, height: 9, borderRadius: '50%', background: l.tone }} />
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontWeight: 800, color: 'var(--fg)', fontSize: 14, textDecoration: 'underline', textUnderlineOffset: 3.5, textDecorationColor: `color-mix(in srgb, ${l.tone} 50%, transparent)` }}>{l.name} ↗</span>
                      <span style={{ display: 'block', color: 'var(--fg-muted)', fontSize: 12, marginTop: 2, ...kw }}>{l.d}</span>
                    </span>
                  </a>
                </Reveal>
              ))}
            </div>
          </div>
          <Reveal>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap', borderTop: '1px solid var(--hair-2)', paddingTop: 14 }}>
              <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                {STATIONS.map((s, i) => (
                  <span key={s} style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--fg-faint)', fontFamily: 'var(--font-mono)' }}>
                    {i + 1} {s}{i < STATIONS.length - 1 ? ' ·' : ''}
                  </span>
                ))}
              </span>
              <span style={{ fontWeight: 800, fontSize: 'clamp(13.5px, 1.6vw, 16px)', color: 'var(--fg)', ...kw }}>
                — 다음 현장은 <span className="accent-text">여러분이 만든다</span>
              </span>
            </div>
          </Reveal>
        </div>
      </Slide>
    </Deck>
  );
}
