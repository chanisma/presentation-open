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
  easeOut,
} from '../../../../src/scene';

/* ── 데이터 탐색과 문제 발견 (1차시 · 13장) — 대사본 ────────────────────
   기획: lesson-script-planner (대사 우선)
   SSOT: script.md (교사 발화 184문장) → plan.md (13장)
   저작 규칙: react-deck-builder/references/bolt-authoring.md + rules/scene-grammar.md

   이 덱의 화면 규약 — 다른 덱과 다른 점
   화면은 교사 발화와 **겹치지 않는다.** 문장은 교사 입에 두고 화면에는 기호·수치·
   도식만 올린다. 발화 ↔ 화면 텍스트 유사도 한도 0.60, 실측 최댓값 0.38.
   그래서 이 덱에는 설명 문장이 거의 없다. 비어 보이는 것이 아니라, 그 자리를
   교사의 말이 채운다.
   유일한 예외는 S10 — 학생이 실습 15분 내내 보며 학습지를 채우는 참조판이라
   읽히는 것이 목적이다.

   정렬: 13장 전부 중앙 정렬 (bolt 하드 룰 3 — 옆에 나란한 비주얼이 없다)
   미완 자리: S10 학습지 HTML 미제작(링크·QR 자리만) */

const kw: CSSProperties = { wordBreak: 'keep-all' };
const mono: CSSProperties = { fontFamily: 'var(--font-mono, monospace)' };

const block = (max = 1100): CSSProperties => ({ width: `min(${max}px, 100%)`, marginInline: 'auto' });

const card: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  padding: 'clamp(16px, 2vw, 26px)',
};

/* 카드 밖 하이라인 — 다크 배경에서 var(--line)은 사라진다 */
const hair = '1px solid color-mix(in srgb, var(--fg) 16%, transparent)';

function CenterHead({ kicker, children }: { kicker?: string; children: ReactNode }) {
  return (
    <Reveal>
      <div style={{ textAlign: 'center' }}>
        {kicker && <div className="kicker">{kicker}</div>}
        <h2 className="headline" style={{ marginInline: 'auto', marginTop: kicker ? 10 : 0, ...kw }}>
          {children}
        </h2>
      </div>
    </Reveal>
  );
}

/* ══ Slide 3 — 두 개의 학기 막대 ═══════════════════════════════════════
   metaphor: 학기 막대 두 줄 — 문제부터 간 팀은 6주 차에서 끊기고,
             데이터부터 간 팀은 배포까지 간다 | emotion: 아찔함
   intent: 작년 실패를 시간 축에 얹어, 순서를 뒤집는 이유를 길이로 체감시킨다 */
const WEEKS = 16;
const BREAK_WEEK = 6;

function TwoTermsScene() {
  const t = useSceneTime();
  const W0 = 150;
  const W1 = 1080;
  const perWeek = (W1 - W0) / WEEKS;
  const breakX = W0 + perWeek * BREAK_WEEK;

  // 위 막대 — 6주 차까지 자라다 끊긴다
  const topGrow = interpolate(t, [0.5, 2.2], [0, 1], easeOut);
  const topX = W0 + (breakX - W0) * topGrow;
  const snap = interpolate(t, [2.25, 2.45], [0, 1]);
  const shake = snap * Math.max(0, 1 - (t - 2.3) * 2.6) * Math.sin(t * 44) * 6;
  const topLabel = interpolate(t, [2.5, 2.9], [0, 1]);

  // 아래 막대 — 같은 속도로 출발해 끝까지
  const lowStart = 3.3;
  const lowGrow = interpolate(t, [lowStart, lowStart + 2.4], [0, 1], easeInOut);
  const lowX = W0 + (W1 - W0) * lowGrow;
  const arrive = interpolate(t, [lowStart + 2.3, lowStart + 2.7], [0, 1]);
  const verdict = interpolate(t, [6.5, 7.0], [0, 1]);

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ paddingTop: 'clamp(28px, 5.5vh, 58px)', paddingInline: 'clamp(24px, 6vw, 92px)', textAlign: 'center' }}>
        <h2 className="headline" style={{ marginInline: 'auto', maxWidth: 'none', ...kw, ...riseIn(t, 0.1) }}>
          6주 차에 <span className="accent-text">사라진 석 달</span>
        </h2>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '2vh' }}>
        <svg viewBox="0 0 1200 470" style={{ width: 'min(1140px, 95vw)', height: 'auto' }} role="img"
          aria-label="학기 막대 두 줄 — 문제부터 정한 팀은 6주 차에서 끊기고, 데이터부터 찾은 팀은 배포까지 간다">

          {/* 주차 눈금 */}
          {Array.from({ length: WEEKS + 1 }, (_, w) => (
            <line key={w} x1={W0 + perWeek * w} y1={64} x2={W0 + perWeek * w} y2={74}
              stroke="var(--fg-faint)" strokeWidth={1.5} opacity={0.5} />
          ))}
          <text x={W0} y={52} fill="var(--fg-faint)" style={{ font: '600 13px var(--font-mono, monospace)' }}>1주</text>
          <text x={W1} y={52} textAnchor="end" fill="var(--fg-faint)" style={{ font: '600 13px var(--font-mono, monospace)' }}>16주</text>
          <line x1={breakX} y1={64} x2={breakX} y2={330} stroke="var(--fg-faint)" strokeWidth={1}
            strokeDasharray="5 6" opacity={interpolate(t, [2.2, 2.6], [0, 0.6])} />
          {/* 끊긴 지점 바로 아래에 둔다. 아래 막대 밑에 두면 어느 막대의
              6주차인지 모호해진다 (첫 픽셀 검수에서 확인) */}
          <text x={breakX} y={188} textAnchor="middle" fill="var(--fg-muted)" opacity={topLabel}
            style={{ font: '700 14px var(--font-mono, monospace)' }}>6주차</text>

          {/* 위 — 문제부터 */}
          <text x={W0} y={112} fill="var(--fg-muted)" opacity={interpolate(t, [0.2, 0.5], [0, 1])}
            style={{ font: '800 19px var(--font-body, sans-serif)' }}>문제부터</text>
          <g transform={`translate(${shake} 0)`}>
            <rect x={W0} y={132} width={Math.max(0, topX - W0)} height={30} rx={6}
              fill="color-mix(in srgb, var(--fg-muted) 55%, transparent)" />
          </g>
          {/* 끊긴 단면 — 톱니 */}
          <g opacity={snap}>
            <path d={`M${topX} 132 l10 8 l-10 7 l10 8 l-10 7`} fill="none"
              stroke="var(--fg-muted)" strokeWidth={2.5} strokeLinejoin="round" />
            <text x={topX + 26} y={144} fill="var(--fg-muted)" opacity={topLabel}
              style={{ font: '800 18px var(--font-body, sans-serif)' }}>데이터가 없다</text>
            <text x={topX + 26} y={168} fill="var(--fg-faint)" opacity={topLabel}
              style={{ font: '700 22px var(--font-mono, monospace)' }}>6팀 중 2팀</text>
          </g>

          <line x1={100} y1={230} x2={1110} y2={230}
            stroke="color-mix(in srgb, var(--fg) 14%, transparent)" strokeWidth={1} />

          {/* 아래 — 데이터부터 */}
          <text x={W0} y={282} fill="var(--primary)" opacity={interpolate(t, [3.0, 3.3], [0, 1])}
            style={{ font: '800 19px var(--font-body, sans-serif)' }}>데이터부터</text>
          <rect x={W0} y={302} width={Math.max(0, lowX - W0)} height={30} rx={6} fill="var(--primary)" />
          <g opacity={arrive}>
            <circle cx={W1} cy={317} r={13} fill="var(--primary)" />
            <text x={W1} y={366} textAnchor="middle" fill="var(--primary)"
              style={{ font: '800 17px var(--font-body, sans-serif)' }}>배포</text>
          </g>

          <text x={600} y={444} textAnchor="middle" fill="var(--fg)" opacity={verdict}
            style={{ font: '800 21px var(--font-body, sans-serif)' }}>
            순서를 뒤집는다
          </text>
        </svg>
      </div>
    </div>
  );
}

/* ══ Slide 7 — 눈이 촘촘해지는 체 세 개 ════════════════════════════════
   metaphor: 굵기가 다른 체 세 개 | emotion: 후련함
   intent: 조건이 '기준'이 아니라 '거르는 장치'임을 보여 미련 없이 버리게 한다 */
const SIEVE_MARK = ['행 ≥ 30', '열 ≥ 3', '내가 연다'];
const SIEVE_Y = [162, 312, 462];
const STOP_Y = [26, 154, 304, 454, 546];
const SEG_T: [number, number][] = [[0.3, 1.6], [1.8, 3.1], [3.3, 4.6], [4.8, 5.7]];
const PASS = [14, 9, 6, 3];
const SIEVE_X0 = 96;
const SIEVE_X1 = 740;
const DISH_X = 418;
const DISH_SLOT = [-42, 0, 42];

/* 통과하는 알과 걸리는 알을 섞어 깔아야 "걸러진다"가 읽힌다 */
const BALL_ORDER = [3, 9, 0, 11, 6, 1, 13, 4, 8, 2, 10, 5, 12, 7];
const BALLS = BALL_ORDER.map((i, slot) => ({
  i,
  x: SIEVE_X0 + 44 + slot * ((SIEVE_X1 - SIEVE_X0 - 88) / (PASS[0] - 1)),
}));

function SieveScene() {
  const t = useSceneTime();
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ paddingTop: 'clamp(24px, 5vh, 50px)', paddingInline: 'clamp(24px, 6vw, 92px)', textAlign: 'center' }}>
        <h2 className="headline" style={{ marginInline: 'auto', maxWidth: 'none', ...kw, ...riseIn(t, 0.1) }}>
          체를 <span className="accent-text">세 번</span> 친다
        </h2>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '2vh' }}>
        <svg viewBox="0 0 1240 620" style={{ width: 'min(1160px, 95vw)', height: 'auto' }} role="img"
          aria-label="데이터 후보 열네 알이 눈이 촘촘해지는 체 세 개를 지나 세 알만 남는다">

          {SIEVE_Y.map((sy, g) => {
            const on = interpolate(t, [SEG_T[g][1] - 0.5, SEG_T[g][1] - 0.1], [0, 1]);
            const step = 44 - g * 14;   // 44 → 30 → 16
            const depth = 11 + g * 5;   // 11 → 16 → 21
            const ticks = Math.floor((SIEVE_X1 - SIEVE_X0) / step) + 1;
            return (
              <g key={sy}>
                <line x1={SIEVE_X0} y1={sy} x2={SIEVE_X1} y2={sy}
                  stroke="var(--primary)" strokeWidth={3.5} strokeLinecap="round" opacity={0.35 + 0.6 * on} />
                {Array.from({ length: ticks }, (_, k) => (
                  <line key={k} x1={SIEVE_X0 + k * step} y1={sy - depth} x2={SIEVE_X0 + k * step} y2={sy}
                    stroke="var(--primary)" strokeWidth={2.2} opacity={0.22 + 0.48 * on} />
                ))}
                {/* 조건은 기호로만. 설명 문장은 교사가 40초씩 말한다 */}
                <text x={790} y={sy + 8} fill="var(--fg)" opacity={on}
                  style={{ font: '800 30px var(--font-mono, monospace)' }}>{SIEVE_MARK[g]}</text>
                <text x={SIEVE_X1} y={sy - depth - 10} textAnchor="end" fill="var(--fg-faint)" opacity={on}
                  style={{ font: '600 13.5px var(--font-mono, monospace)' }}>
                  {`${PASS[g] - PASS[g + 1]}개 탈락`}
                </text>
              </g>
            );
          })}

          <path d={`M${DISH_X - 120} 560 q120 42 240 0`} fill="none"
            stroke="var(--primary)" strokeWidth={4} strokeLinecap="round"
            opacity={interpolate(t, [5.3, 5.7], [0, 1])} />
          <text x={DISH_X} y={606} textAnchor="middle" fill="var(--primary)"
            opacity={interpolate(t, [5.6, 6.0], [0, 1])}
            style={{ font: '800 17px var(--font-body, sans-serif)' }}>남은 셋</text>

          {BALLS.map((b) => {
            const legs = b.i >= PASS[1] ? 1 : b.i >= PASS[2] ? 2 : b.i >= PASS[3] ? 3 : 4;
            let y = STOP_Y[0];
            let done = 0;
            for (let k = 0; k < legs; k += 1) {
              const p = interpolate(t, SEG_T[k], [0, 1], easeOut);
              y = STOP_Y[k] + (STOP_Y[k + 1] - STOP_Y[k]) * p;
              done = k + (p >= 1 ? 1 : 0);
              if (p < 1) break;
            }
            const survives = legs === 4;
            const settled = done >= legs;
            const gather = survives ? interpolate(t, SEG_T[3], [0, 1], easeInOut) : 0;
            const target = survives ? DISH_X + DISH_SLOT[b.i] : b.x;
            const x = b.x + (target - b.x) * gather;
            return (
              <circle key={b.i} cx={x} cy={y} r={9.5}
                fill={survives ? 'var(--primary)' : 'var(--fg-muted)'}
                opacity={settled && !survives ? 0.35 : 0.95} />
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/* ── 덱 본체 ─────────────────────────────────────────────────────────── */

export default function DataProblemFindingScriptedDeck() {
  return (
    <Deck>
      {/* S1 — 요소 최소. 교사가 실제 사이트를 띄우고 40초간 말하는 자리다 */}
      <Slide center nav="표지"
        notes={`자, 오늘 첫 시간이니까 좀 다르게 시작해 볼게요.
화면 한번 보세요.
[완성 예시 사이트를 띄우고 클릭해 보인다 · 40초]
지금 보신 거, 작년에 딱 여러분 자리에 앉아 있던 학생이 만든 거예요.
저기 검색창에 학교 이름을 넣으면 급식 만족도가 학년별로 갈려서 나와요.
데이터는 이 학생이 직접 설문 돌려서 모은 거고요.`}>
        <Reveal>
          <div className="kicker" style={{ textAlign: 'center' }}>1차시 · 50분</div>
        </Reveal>
        <Reveal delay={0.08}>
          <h1 className="display" style={{ marginInline: 'auto', marginTop: 16, textAlign: 'center', ...kw }}>
            데이터 탐색과<br /><span className="accent-text">문제 발견</span>
          </h1>
        </Reveal>
      </Slide>

      {/* S2 — 화살표 두 줄. 발화 문장을 화면에 적지 않는다 */}
      <Slide center nav="AI와 나"
        notes={`자, 여기서 하나 물어볼게요.
이 학생이 코드를 몇 줄이나 썼을까요?
[학생 반응을 기다린다 · 20초]
한 줄도 안 썼어요.
전부 AI한테 시켰습니다.
그런데 그게 이 수업의 핵심이에요.
코드는 AI가 씁니다.
무엇을 만들지는 여러분이 정해요.
이게 말은 쉬운데 훨씬 어렵습니다.
AI한테 "뭔가 멋진 거 만들어 줘"라고 하면 아무것도 안 나오거든요.
무엇을, 누구를 위해, 어떤 데이터로 만들 건지를 여러분이 정해 줘야 해요.
그래서 이 수업은 코딩 수업이 아니라 그걸 정하는 수업입니다.
한 학기 뒤에 여러분도 각자 하나씩 만들어서 인터넷에 올릴 거예요.
친구한테 주소 보내면 그 친구 폰에서 열리는, 진짜 사이트요.`}>
        <Reveal>
          <div style={{ ...block(720), display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 2.4vh, 26px)' }}>
            {[
              { from: 'AI', to: '코드', lit: false },
              { from: '여러분', to: '무엇', lit: true },
            ].map((r) => (
              <div key={r.from} style={{
                display: 'grid', gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center', gap: 'clamp(16px, 3vw, 40px)',
              }}>
                <span style={{
                  textAlign: 'right', fontWeight: 800, ...kw,
                  fontSize: r.lit ? 'clamp(28px, 3.8vw, 54px)' : 'clamp(24px, 3.2vw, 44px)',
                  color: r.lit ? 'var(--primary)' : 'var(--fg-muted)',
                }}>{r.from}</span>
                <svg width="72" height="24" viewBox="0 0 72 24" aria-hidden style={{ flex: 'none' }}>
                  <line x1={2} y1={12} x2={56} y2={12} strokeWidth={3} strokeLinecap="round"
                    stroke={r.lit ? 'var(--primary)' : 'var(--fg-muted)'} opacity={r.lit ? 0.9 : 0.55} />
                  <path d="M62 12 l-10 -6 v12 z" fill={r.lit ? 'var(--primary)' : 'var(--fg-muted)'} opacity={r.lit ? 0.9 : 0.55} />
                </svg>
                <span style={{
                  textAlign: 'left', fontWeight: 800, ...kw,
                  fontSize: r.lit ? 'clamp(28px, 3.8vw, 54px)' : 'clamp(24px, 3.2vw, 44px)',
                  color: r.lit ? 'var(--fg)' : 'var(--fg-muted)',
                }}>{r.to}</span>
              </div>
            ))}
          </div>
        </Reveal>
        <Build at={1}>
          <div style={{ ...block(900), marginTop: 'clamp(26px, 4vh, 48px)', paddingTop: 18, borderTop: hair, display: 'flex', alignItems: 'stretch' }}>
            {[
              { t: '데이터 찾기', now: true },
              { t: '구조 설계', now: false },
              { t: '명세 쓰기', now: false },
              { t: '만들기', now: false },
              { t: '배포', now: false },
            ].map((s, i) => (
              <div key={s.t} style={{
                flex: s.now ? '1.6 1 0' : '1 1 0', minWidth: 0, textAlign: 'left',
                paddingInline: 'clamp(8px, 1.2vw, 18px)', borderLeft: i === 0 ? 'none' : hair,
              }}>
                <div style={{ ...mono, fontSize: 12, letterSpacing: '0.06em', color: 'var(--primary)', marginBottom: 6, minHeight: 16 }}>
                  {s.now ? '오늘' : ''}
                </div>
                <div style={{
                  fontWeight: s.now ? 800 : 600,
                  fontSize: s.now ? 'clamp(15px, 1.8vw, 19px)' : 'clamp(13px, 1.4vw, 15px)',
                  color: s.now ? 'var(--fg)' : 'var(--fg-muted)', ...kw,
                }}>{s.t}</div>
              </div>
            ))}
          </div>
        </Build>
      </Slide>

      {/* S3 — 씬 */}
      <Slide full nav="6주차"
        notes={`자 그러면 오늘 뭘 하냐.
보통 이런 수업은 "무슨 문제를 풀고 싶어?"부터 물어봐요.
오늘은 그렇게 안 합니다.
왜냐면 문제부터 정하면 학기 중반에 멈추거든요.
작년에 여섯 팀 중에 두 팀이 그렇게 멈췄어요.
한 팀은 "우리 지역 미세먼지랑 학생 결석률 관계를 보겠다"였는데요.
결석률 데이터를 학교가 안 줘요. 개인정보라서요.
석 달 준비한 게 6주 차에 그냥 없어진 거예요.`}>
        <Scene><TwoTermsScene /></Scene>
      </Slide>

      {/* S4 — 숫자 둘. 무엇의 3이고 9인지는 교사가 말한다 */}
      <Slide center nav="계약"
        notes={`그래서 오늘은 순서를 뒤집습니다.
있는 데이터를 먼저 찾고, 그다음에 그 데이터로 풀 수 있는 문제를 꺼냅니다.
오늘 나갈 때 여러분 손에 데이터 세 개랑 문제 문장 아홉 개가 있어야 해요.
그게 오늘의 계약입니다.`}>
        <Reveal>
          <div style={{ ...block(560), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1vh, 14px)' }}>
            {[
              { n: '3', label: '데이터 후보', size: 'clamp(64px, 9vw, 130px)' },
              { n: '9', label: '문제 문장', size: 'clamp(92px, 13vw, 190px)' },
            ].map((x) => (
              <div key={x.n} style={{ textAlign: 'center' }}>
                <div style={{ ...mono, fontWeight: 800, fontSize: x.size, lineHeight: 1, color: 'var(--primary)' }}>
                  {x.n}
                </div>
                <Build at={1}>
                  <div style={{ color: 'var(--fg-muted)', fontSize: 'clamp(13px, 1.5vw, 16px)', marginTop: 6, ...kw }}>
                    {x.label}
                  </div>
                </Build>
              </div>
            ))}
          </div>
        </Reveal>
      </Slide>

      {/* S5 — 세 갈래 좌표. 원 안에는 이름만 */}
      <Slide nav="세 갈래"
        notes={`그럼 데이터가 도대체 어디 있느냐.
크게 세 갈래로 나눠서 볼게요.
[세 갈래를 화면에 띄운다 · 15초]
자, 여기서 오늘 실습 규칙 하나.
이 셋을 다 채워야 합니다.
한 갈래에서만 세 개 찾아 오는 건 안 돼요.
매년 그냥 공공데이터포털에서 세 개 뽑아 오는 학생이 나오는데요.
그러면 다음 단계에서 문장이 하나도 안 나옵니다.`}>
        <div style={{ ...block(1160), display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.6vh, 20px)' }}>
          <CenterHead>데이터는 <span className="accent-text">세 갈래</span>에 있다</CenterHead>
          <Reveal><TrackMap /></Reveal>
          <Build at={1}>
            <div style={{
              marginInline: 'auto', paddingTop: 14, borderTop: hair, width: 'min(420px, 100%)',
              textAlign: 'center', ...mono, fontWeight: 800,
              fontSize: 'clamp(18px, 2.2vw, 26px)', color: 'var(--primary)', letterSpacing: '0.1em',
            }}>
              셋 다
            </div>
          </Build>
        </div>
      </Slide>

      {/* S6 — 실제로 여는 동안 띄워 두는 인덱스 */}
      <Slide nav="출처"
        notes={`첫째는 이미 누가 공개해 둔 데이터예요.
공공데이터포털이라는 데가 있어요.
정부랑 지자체가 가진 자료를 그냥 풀어 놓은 곳인데요.
여기 가면 수만 건이 그냥 다운로드 버튼 하나로 받아져요.
국가통계포털, 학교알리미, 기상자료개방포털도 마찬가지고요.
[공공데이터포털을 실제로 열어 검색해 보인다 · 40초]
장점은 명확하죠. 지금 당장 손에 넣을 수 있어요.
그런데 단점이 하나 있어요.
나랑 너무 멀다는 거예요.
전국 시군구별 통계표를 열어 놓고 앉아 있으면요.
"그래서 뭘 어쩌라고" 소리가 나와요. 문제가 안 떠올라요.
숫자는 많은데 내 얘기가 아니거든요.
둘째는 학교 안에 있는 데이터예요.
급식 메뉴 기록, 시간표, 도서관 대출 목록, 동아리 명단, 홈페이지 공지.
이건 첫 번째랑 정반대예요.
문제가 바로 보여요.
"아 저거 불편한데" 하는 게 여러분 머릿속에 이미 있잖아요.
대신 파일로 예쁘게 정리돼 있질 않아요.
[학교 홈페이지를 열어 급식 게시판을 보인다 · 30초]
보세요. 이거 표는 있는데 다운로드 버튼이 없죠.
이런 건 여러분이 직접 옮겨 적어야 해요.
스무 줄 옮겨 적는 데 십 분 걸립니다. 그것도 작업이에요.
셋째는 아직 세상에 없어서 여러분이 만들어야 하는 데이터예요.
설문을 돌리거나요.
이 주 동안 자기 수면 시간이랑 공부 시간을 매일 기록하거나요.
쉬는 시간에 매점 줄이 몇 명인지 세거나요.
이건 가치가 제일 높아요.
왜냐면 아무도 안 가지고 있으니까요.
세상에 하나뿐인 데이터로 만든 사이트는 아무도 못 따라 해요.
대신 시간이 들죠. 오늘 정하면 다음 주에나 손에 들어와요.`}>
        <div style={{ ...block(1200), display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 2.2vh, 26px)' }}>
          <CenterHead>지금 여는 곳</CenterHead>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 'clamp(12px, 1.6vw, 22px)', textAlign: 'left' }}>
            {[
              {
                span: 5, title: '공개',
                items: (
                  <>
                    {[
                      ['공공데이터포털', 'https://www.data.go.kr'],
                      ['국가통계포털 KOSIS', 'https://kosis.kr'],
                      ['학교알리미', 'https://www.schoolinfo.go.kr'],
                      ['기상자료개방포털', 'https://data.kma.go.kr'],
                    ].map(([label, href]) => (
                      <a key={href} href={href} target="_blank" rel="noopener"
                        style={{
                          color: 'var(--primary)', fontWeight: 700, fontSize: 14.5,
                          textDecoration: 'underline', textUnderlineOffset: 3, ...kw,
                        }}>{label} ↗</a>
                    ))}
                  </>
                ),
              },
              {
                span: 4, title: '학교 안',
                items: ['급식 메뉴 기록', '시간표', '도서 대출 목록', '동아리와 행사 안내', '학교 홈페이지 공지']
                  .map((x) => <span key={x} style={{ fontSize: 14.5, fontWeight: 600, ...kw }}>{x}</span>),
              },
              {
                span: 3, title: '직접',
                items: ['설문', '관찰 기록', '사진 기록', '2주간 자기 기록']
                  .map((x) => <span key={x} style={{ fontSize: 14.5, fontWeight: 600, ...kw }}>{x}</span>),
              },
            ].map((g) => (
              <Reveal key={g.title}>
                <div style={{ ...card, gridColumn: `span ${g.span}`, display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
                  <div style={{ ...mono, fontWeight: 800, fontSize: 'clamp(15px, 1.7vw, 18px)', color: 'var(--primary)', letterSpacing: '0.06em' }}>
                    {g.title}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>{g.items}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Slide>

      {/* S7 — 씬 */}
      <Slide full nav="체"
        notes={`자, 그러면 아무 데이터나 다 되느냐.
그건 또 아니에요.
체를 세 번 친다고 생각하시면 돼요.
[체 그림을 띄운다 · 10초]
첫 번째 체. 행이 서른 개는 넘어야 해요.
여기서 행이 뭐냐면, 가로 한 줄이 하나의 사례예요.
급식 데이터면 하루가 한 행이고요.
도서 대출이면 한 번 빌린 게 한 행이죠.
이게 서른 개는 넘어야 비교를 하든 추천을 하든 할 수 있어요.
다섯 줄짜리로는 아무것도 못 만듭니다.
두 번째 체. 열이 세 개는 넘어야 하고요.
열은 세로, 그러니까 속성이에요.
날짜만 있으면 아무것도 못 해요.
날짜랑, 메뉴랑, 잔반량이 같이 있어야 뭔가 엮이죠.
속성이 하나뿐인 데이터는 데이터가 아니라 그냥 목록이에요.
세 번째 체. 내가 직접 열어볼 수 있어야 해요.
CSV나 엑셀이나 웹페이지의 표.
그림 파일은 안 돼요. PDF 보고서도 안 됩니다.
"우리 학교 통계 보고서 PDF 있는데요" 하는 학생이 꼭 있는데요.
그거 안에 있는 숫자를 컴퓨터가 못 읽어요.
로그인해야 보이는 것도 빼세요. AI가 못 들어가요.
자, 셋 중에 하나라도 걸리면 후보에서 뺍니다.
아까워도 빼세요.
조건 안 맞는 데이터 붙들고 있다가 삼 주 뒤에 버리는 게 훨씬 아까워요.`}>
        <Scene><SieveScene /></Scene>
      </Slide>

      {/* S8 — 빈칸 넷. 채우는 애니메이션은 넣지 않는다 (교사가 함께 채우는 자리) */}
      <Slide nav="빈칸"
        notes={`자 그러면 데이터를 세 개 찾았다고 칩시다.
여기서 문제로 어떻게 넘어가느냐.
이게 오늘 제일 중요한 부분이에요.
틀을 딱 하나만 드릴게요. 이것만 있으면 됩니다.
[문장 틀을 화면에 띄운다 · 10초]
누가, 어떤 상황에서, 무엇을 몰라서 불편한데.
이 데이터가 있으면 무엇을 알 수 있다.
이게 전부예요. 빈칸이 네 개죠.
같이 한번 채워 볼게요.
우리 학교 일 년 치 급식 메뉴하고 잔반량이 있다고 해 봐요.
누가 불편할까요?
[학생 반응을 기다린다 · 15초]
영양사 선생님이요.
선생님은 다음 달 식단을 짜야 하는데요.
어떤 메뉴가 남을지를 미리 모르시잖아요.
지난달에 많이 남은 걸 또 넣으면 또 남을 거고요.
근데 이 데이터가 있으면 뭘 알 수 있죠?
메뉴 조합별로 잔반이 어떻게 달라지는지를 알 수 있어요.
카레 다음 날 뭐가 나오면 남더라, 이런 게 보이는 거죠.
자, 문장 하나 나왔습니다.`}>
        <div style={{ ...block(1080), display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 2.6vh, 32px)' }}>
          <CenterHead kicker="데이터에서 문제로">빈칸 <span className="accent-text">넷</span></CenterHead>
          <Reveal>
            <div style={{ ...card, padding: 'clamp(20px, 3vw, 38px)' }}>
              <p style={{
                fontSize: 'clamp(17px, 2.2vw, 27px)', fontWeight: 700, lineHeight: 1.9,
                textAlign: 'center', color: 'var(--fg-muted)', ...kw,
              }}>
                <Blank>누가</Blank>는 <Blank>어떤 상황</Blank>에서 <Blank>무엇</Blank>을 몰라서 불편한데,
                이 데이터가 있으면 <Blank>무엇</Blank>을 알 수 있다.
              </p>
            </div>
          </Reveal>
          <Build at={1}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: 'clamp(14px, 2.4vw, 32px)', alignItems: 'start', textAlign: 'left' }}>
              <div>
                <div style={{ ...mono, fontSize: 12.5, color: 'var(--fg-muted)', letterSpacing: '0.06em', marginBottom: 8 }}>가진 데이터</div>
                <p style={{ fontSize: 'clamp(14px, 1.6vw, 17px)', fontWeight: 700, lineHeight: 1.6, ...kw }}>
                  급식 메뉴 기록과 잔반량, 1년치
                </p>
              </div>
              <div style={{ paddingLeft: 'clamp(14px, 2vw, 26px)', borderLeft: '3px solid var(--primary)' }}>
                <div style={{ ...mono, fontSize: 12.5, color: 'var(--primary)', letterSpacing: '0.06em', marginBottom: 8 }}>채운 문장</div>
                <p style={{ fontSize: 'clamp(14.5px, 1.7vw, 18px)', fontWeight: 700, lineHeight: 1.7, ...kw }}>
                  영양사 선생님은 식단을 짤 때 어떤 메뉴가 남을지를 몰라서 곤란한데,
                  이 데이터가 있으면 메뉴 조합별 잔반 경향을 알 수 있다.
                </p>
              </div>
            </div>
          </Build>
        </div>
      </Slide>

      {/* S9 — 수치 하나와 되묻는 두 글자. 판정 문장은 교사 입에 */}
      <Slide center nav="그래서?"
        notes={`여기서 진짜 중요한 게 하나 있어요.
"급식 만족도를 조사한다"는 문제가 아니에요.
왜 아닐까요?
조사해서 뭐 할 건데요?
만족도가 3.7점이라고 나왔어요. 그래서요?
결과가 나와도 아무도 덜 힘들어지지 않잖아요.
누군가가 덜 힘들어져야 문제입니다.
문장 안에 곤란한 사람이 없으면 그건 문제가 아니라 숙제예요.
여러분 문장을 다 쓰고 나서 이거 하나만 확인하세요.
이 문장에 덜 힘들어지는 사람이 있는가.`}>
        <Reveal>
          <div style={{ textAlign: 'center' }}>
            <div style={{ ...mono, fontWeight: 800, fontSize: 'clamp(70px, 11vw, 168px)', lineHeight: 1, color: 'var(--fg-muted)' }}>
              3.7점
            </div>
            <div style={{ fontWeight: 800, fontSize: 'clamp(28px, 4vw, 60px)', marginTop: 10, color: 'var(--fg)', ...kw }}>
              그래서?
            </div>
          </div>
        </Reveal>
        <Build at={1}>
          <div style={{
            ...block(700), marginTop: 'clamp(26px, 4vh, 46px)', ...card, textAlign: 'left',
            borderColor: 'color-mix(in srgb, var(--primary) 45%, transparent)',
            background: 'color-mix(in srgb, var(--primary) 9%, var(--surface))',
          }}>
            <div style={{ ...mono, fontSize: 12.5, color: 'var(--primary)', letterSpacing: '0.06em', marginBottom: 8 }}>
              곤란한 사람이 있다
            </div>
            <p style={{ fontSize: 'clamp(15px, 1.8vw, 20px)', fontWeight: 800, lineHeight: 1.6, ...kw }}>
              영양사 선생님은 어떤 메뉴가 남을지를 몰라서 곤란하다
            </p>
          </div>
        </Build>
      </Slide>

      {/* S10 — 실습 참조판. 이 장만 dedup 예외 (읽히는 것이 목적) */}
      <Slide nav="찾기 15분"
        notes={`자, 이제 여러분 차례입니다.
앞으로 십오 분 동안 데이터를 찾을 거예요.
세 갈래에서 하나씩, 모두 세 개.
학습지에 적을 게 여섯 가지예요.
데이터 이름, 어디서 찾았는지 주소, 어떤 형태인지.
그리고 행이 몇 개고 열이 몇 개인지.
마지막으로 열 이름 세 개 이상.
이 열 이름 칸을 꼭 채우세요.
왜 이걸 시키냐면요.
파일을 진짜로 열어 보지 않으면 못 적게 되어 있거든요.
제목만 보고 "아 이거 되겠는데" 하고 적어 오면 다음 주에 무너져요.
그리고 이 열 이름은 다음 시간에 구조 설계할 때 그대로 씁니다.
버리는 작업이 아니에요.
세 번째 갈래는 아직 데이터가 없죠.
그건 뭘, 누구한테, 며칠 동안 모을 건지를 대신 적으세요.
"우리 반 스물여덟 명한테 일주일 동안 수면 시간" 이런 식으로요.
자, 십오 분 시작합니다.
막히면 손 드세요. 제가 학교 안 데이터 목록 들고 다닐게요.
[15분 타이머 · 15분]`}>
        <div style={{ ...block(1180), display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 2.2vh, 26px)' }}>
          <Reveal>
            <div style={{ textAlign: 'center' }}>
              <h2 className="headline" style={{ marginInline: 'auto', ...kw }}>
                데이터 찾기 <span className="accent-text">15분</span>
              </h2>
            </div>
          </Reveal>
          <Reveal>
            <div className="cols" style={{ gap: 'clamp(10px, 1.4vw, 18px)', textAlign: 'left' }}>
              {[
                { k: '데이터 이름', d: '' },
                { k: '출처', d: 'URL 또는 위치' },
                { k: '형태', d: 'CSV · 엑셀 · 웹페이지 · 직접수집' },
                { k: '행 수 / 열 수', d: '' },
                { k: '열 이름 3개 이상', d: '파일을 열어야 적을 수 있다', on: true },
                { k: '조건 체크 3', d: '' },
              ].map((x) => (
                <div key={x.k} style={{
                  ...card,
                  ...(x.on ? {
                    borderColor: 'color-mix(in srgb, var(--primary) 45%, transparent)',
                    background: 'color-mix(in srgb, var(--primary) 9%, var(--surface))',
                  } : null),
                }}>
                  <div style={{ fontWeight: 800, fontSize: 'clamp(14px, 1.6vw, 17px)', ...kw }}>{x.k}</div>
                  {x.d && <p style={{ color: 'var(--fg-muted)', fontSize: 13.5, lineHeight: 1.55, marginTop: 4, ...kw }}>{x.d}</p>}
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal>
            {/* 학습지 HTML은 activity-sheet-builder로 별도 제작 예정 — 자리만 */}
            <div style={{
              marginInline: 'auto', width: 'min(560px, 100%)', textAlign: 'center',
              padding: 'clamp(14px, 2vh, 22px)', borderRadius: 'var(--radius)',
              border: '2px dashed color-mix(in srgb, var(--primary) 45%, transparent)',
              color: 'var(--fg-muted)', fontSize: 13.5, lineHeight: 1.6, ...kw,
            }}>
              학습지 링크 · QR 자리
            </div>
          </Reveal>
        </div>
      </Slide>

      {/* S11 — 실습 중 옆에 띄워 두는 경고판. 클릭으로 감추지 않는다 */}
      <Slide nav="실수"
        notes={`아, 두 가지만 미리 말하고 시작할게요.
매년 나오는 실수예요.
하나. 전국 통계표를 통째로 가져오는 경우.
행이 십만 개예요. 조건은 통과하죠.
근데 나랑 상관이 없어서 문장이 안 나와요.
그럴 땐 필터를 거세요.
우리 지역만, 우리 학교급만 남기면 몇 행 되는지 세어 보세요.
서른 행 넘으면 그걸로 충분합니다.
둘. AI한테 물어보는 거요.
그건 막지 않을게요. 얼마든지 쓰세요.
저도 그렇게 찾습니다.
대신 조건이 하나 있어요.
AI가 알려준 데이터는 실제 주소를 열어서 파일을 확인한 것만 적을 수 있어요.
없는 데이터셋 이름을 그럴듯하게 지어내는 경우가 꽤 있거든요.
"전국 학교급식 잔반량 통계"라고 알려주는데 그런 거 없어요.
열어 봤는데 진짜 있으면, 그건 적으셔도 됩니다.`}>
        <div style={{ ...block(940), display: 'flex', flexDirection: 'column', gap: 'clamp(20px, 3vh, 36px)' }}>
          <CenterHead>매년 나오는 <span className="accent-text">둘</span></CenterHead>
          <Reveal>
            <div style={{ display: 'flex', gap: 'clamp(14px, 2vw, 22px)', alignItems: 'center' }}>
              <span style={{ flex: 'none', width: 3, alignSelf: 'stretch', borderRadius: 2, background: 'var(--primary)', opacity: 0.75 }} />
              <div style={{
                flex: 1, display: 'grid', gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center', gap: 'clamp(12px, 2.4vw, 32px)', textAlign: 'center',
              }}>
                <span style={{ ...mono, fontWeight: 800, fontSize: 'clamp(24px, 3.4vw, 48px)', color: 'var(--fg-muted)' }}>100,000행</span>
                <svg width="60" height="22" viewBox="0 0 60 22" aria-hidden>
                  <line x1={2} y1={11} x2={44} y2={11} stroke="var(--fg-muted)" strokeWidth={3} strokeLinecap="round" opacity={0.6} />
                  <path d="M50 11 l-9 -5 v10 z" fill="var(--fg-muted)" opacity={0.6} />
                </svg>
                <span style={{ ...mono, fontWeight: 800, fontSize: 'clamp(24px, 3.4vw, 48px)', color: 'var(--primary)' }}>0문장</span>
              </div>
            </div>
          </Reveal>
          <Reveal>
            <div style={{ display: 'flex', gap: 'clamp(14px, 2vw, 22px)', alignItems: 'center', paddingLeft: 'clamp(20px, 4vw, 56px)' }}>
              <span style={{ flex: 'none', width: 3, alignSelf: 'stretch', borderRadius: 2, background: 'var(--primary)', opacity: 0.75 }} />
              <div style={{ flex: 1, textAlign: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: 'clamp(22px, 3vw, 42px)', ...kw }}>
                  URL을 <span className="accent-text">열었는가</span>
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </Slide>

      {/* S12 — 수혜자는 Build로 하나씩. 미리 적으면 되묻기가 죽는다 */}
      <Slide nav="쓰기 10분"
        notes={`자, 데이터 세 개 다 적었으면 이제 문장을 씁니다.
십 분 드릴게요.
데이터 하나당 세 문장, 그러니까 전부 아홉 문장이에요.
아홉 개나 어떻게 쓰냐 싶죠.
비결이 딱 하나 있어요.
'누가'를 매번 바꾸는 겁니다.
아까 급식 데이터로 영양사 선생님 문장 하나 썼죠.
같은 데이터로 학생회는 뭘 알게 될까요?
어떤 메뉴를 건의할지 근거가 생기겠죠. "이거 실제로 안 남아요" 하고요.
행정실은요?
식자재를 얼마나 발주할지, 줄일 근거가 생겨요.
데이터는 하나인데 사람을 바꾸니까 문장이 셋이 됐어요.
학생, 선생님, 학부모, 행정실, 동아리.
이 중에 누구한테 쓸모가 있을지를 하나씩 대 보세요.
[10분 타이머 · 10분]`}>
        <div style={{ ...block(1140), display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 2.2vh, 26px)' }}>
          <CenterHead kicker="문장 쓰기 · 10분">
            <span style={mono}>1</span> 데이터 <span className="accent-text">× 3 사람</span>
          </CenterHead>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.8fr) minmax(0, 1.9fr)', gap: 'clamp(16px, 3vw, 48px)', alignItems: 'center', textAlign: 'left' }}>
            <Reveal>
              <div style={{ ...card, textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: 'clamp(15px, 1.8vw, 19px)', ...kw }}>급식 메뉴와 잔반량</div>
              </div>
            </Reveal>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 1.4vh, 16px)' }}>
              {[
                { who: '영양사 선생님', what: '어떤 메뉴가 남을지 미리 안다' },
                { who: '학생회', what: '무엇을 건의할지 근거를 얻는다' },
                { who: '행정실', what: '발주량을 줄일 근거를 얻는다' },
              ].map((x, i) => (
                <Build key={x.who} at={i + 1}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px, 1.6vw, 20px)' }}>
                    <svg width="56" height="26" viewBox="0 0 56 26" style={{ flex: 'none' }} aria-hidden>
                      <path d={i === 0 ? 'M0 22 C 24 22, 26 5, 48 5' : i === 1 ? 'M0 13 L 48 13' : 'M0 4 C 24 4, 26 21, 48 21'}
                        fill="none" stroke="var(--primary)" strokeWidth={2.5} opacity={0.65} />
                      <circle cx={50} cy={i === 0 ? 5 : i === 1 ? 13 : 21} r={5} fill="var(--primary)" />
                    </svg>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap', minWidth: 0 }}>
                      <span style={{ fontWeight: 800, fontSize: 'clamp(16px, 2vw, 22px)', color: 'var(--primary)', ...kw }}>{x.who}</span>
                      <span style={{ color: 'var(--fg-muted)', fontSize: 'clamp(13.5px, 1.5vw, 16px)', ...kw }}>{x.what}</span>
                    </div>
                  </div>
                </Build>
              ))}
            </div>
          </div>
        </div>
      </Slide>

      {/* S13 — 발표 중에는 at=0으로 조용하게 */}
      <Slide center nav="정리"
        notes={`자, 시간 다 됐습니다. 펜 놓으세요.
세 명 정도만 자기 문장 중에 제일 마음에 드는 거 하나씩 읽어 주세요.
잘 썼는지 못 썼는지는 오늘 안 봅니다.
그냥 읽어 주시면 돼요.
[학생 3~4명 발표 · 130초]
좋아요. 제가 물어볼 건 딱 하나예요.
그 데이터 어디서 찾았어요?
이게 오늘 마지막 순서인 이유가 있어요.
여러분이 서로 어디를 뒤졌는지 아는 게 오늘의 진짜 목적이거든요.
저 친구가 학교 홈페이지 공지에서 찾았다는 걸 알면요.
다음 주에 여러분도 거기를 열어 보게 돼요.
마지막으로 과제 말씀드릴게요.
아홉 문장 중에 세 개만 골라서 표시해 오세요.
고르는 기준이 있어요. 재미가 아니에요.
이 데이터를 다음 주까지 진짜로 손에 넣을 수 있느냐.
그거 하나만 보세요.
설문 돌려야 하는 건 오늘 밤에 링크를 만들어야 다음 주에 답이 쌓입니다.
학교에 요청해야 하는 건 내일 찾아가야 하고요.
다음 시간 시작할 때 그 셋 중에 하나를 확정할 거예요.
그러니까 세 개는 진짜로 셋 중에 아무거나 되어도 괜찮은 걸로 고르세요.
오늘 여기까지 하겠습니다. 수고하셨어요.`}>
        <Reveal>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(18px, 3.5vw, 48px)' }}>
            <span style={{ ...mono, fontWeight: 800, fontSize: 'clamp(56px, 9vw, 140px)', lineHeight: 1, color: 'var(--fg-muted)' }}>9</span>
            <svg width="90" height="34" viewBox="0 0 90 34" aria-hidden style={{ flex: 'none' }}>
              <line x1={4} y1={17} x2={68} y2={17} stroke="var(--primary)" strokeWidth={4} strokeLinecap="round" />
              <path d="M78 17 l-13 -8 v16 z" fill="var(--primary)" />
            </svg>
            <span style={{ ...mono, fontWeight: 800, fontSize: 'clamp(56px, 9vw, 140px)', lineHeight: 1, color: 'var(--primary)' }}>3</span>
          </div>
        </Reveal>
        <Build at={1}>
          <p style={{
            marginInline: 'auto', marginTop: 'clamp(22px, 3.4vh, 40px)', maxWidth: '26ch',
            textAlign: 'center', fontSize: 'clamp(17px, 2.2vw, 26px)', fontWeight: 800, lineHeight: 1.55, ...kw,
          }}>
            다음 주까지 <span className="accent-text">손에 넣을 수 있는가</span>
          </p>
        </Build>
        <Build at={2}>
          <div style={{ ...block(560), marginTop: 'clamp(20px, 3vh, 34px)', paddingTop: 18, borderTop: hair, textAlign: 'center' }}>
            <span style={{ color: 'var(--fg-muted)', fontSize: 'clamp(14px, 1.7vw, 18px)', ...kw }}>
              “그 데이터 어디서 찾았어?”
            </span>
          </div>
        </Build>
      </Slide>
    </Deck>
  );
}

/* ── Slide 5 좌표맵 — 원 안에는 갈래 이름만. 장단점은 교사가 말한다 ── */
const TRACKS = [
  { key: '공개', x: 250, y: 132, r: 88 },
  { key: '학교 안', x: 588, y: 250, r: 100 },
  { key: '직접', x: 920, y: 366, r: 84 },
] as const;

function TrackMap() {
  const AX = 118;
  const AY = 470;
  return (
    <svg viewBox="0 0 1140 516" style={{ width: '100%', height: 'auto' }} role="img"
      aria-label="데이터 세 갈래 좌표 — 가로축은 나와의 거리, 세로축은 이미 정리된 정도">
      <line x1={AX} y1={AY} x2={1092} y2={AY} stroke="var(--fg-muted)" strokeWidth={2} opacity={0.5} strokeLinecap="round" />
      <line x1={AX} y1={AY} x2={AX} y2={46} stroke="var(--fg-muted)" strokeWidth={2} opacity={0.5} strokeLinecap="round" />
      <text x={AX} y={502} fill="var(--fg-muted)" style={{ font: '500 15px var(--font-body, sans-serif)' }}>나와 멀다</text>
      <text x={1092} y={502} textAnchor="end" fill="var(--fg-muted)" style={{ font: '500 15px var(--font-body, sans-serif)' }}>나와 가깝다</text>
      <text x={AX - 18} y={52} fill="var(--fg-muted)"
        style={{ font: '500 15px var(--font-body, sans-serif)', writingMode: 'vertical-rl' }}>이미 정리됨</text>
      <text x={AX - 18} y={AY - 96} fill="var(--fg-muted)"
        style={{ font: '500 15px var(--font-body, sans-serif)', writingMode: 'vertical-rl' }}>아직 날것</text>

      <path d={`M${TRACKS[0].x + 66} ${TRACKS[0].y + 60} Q ${TRACKS[1].x - 96} ${TRACKS[1].y - 40} ${TRACKS[1].x - 78} ${TRACKS[1].y - 62}`}
        fill="none" stroke="var(--primary)" strokeWidth={2} strokeDasharray="7 7" opacity={0.45} />
      <path d={`M${TRACKS[1].x + 78} ${TRACKS[1].y + 62} Q ${TRACKS[2].x - 96} ${TRACKS[2].y - 40} ${TRACKS[2].x - 68} ${TRACKS[2].y - 56}`}
        fill="none" stroke="var(--primary)" strokeWidth={2} strokeDasharray="7 7" opacity={0.45} />

      {TRACKS.map((tr) => (
        <g key={tr.key}>
          <circle cx={tr.x} cy={tr.y} r={tr.r}
            fill="color-mix(in srgb, var(--primary) 13%, var(--bg))"
            stroke="var(--primary)" strokeWidth={2} />
          <text x={tr.x} y={tr.y + 9} textAnchor="middle" fill="var(--fg)"
            style={{ font: '800 26px var(--font-body, sans-serif)' }}>{tr.key}</text>
        </g>
      ))}
    </svg>
  );
}

/* 문장 틀의 빈칸 */
function Blank({ children }: { children: ReactNode }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 12px', margin: '0 2px',
      borderBottom: '2px solid var(--primary)',
      color: 'var(--primary)', fontWeight: 800,
    }}>
      {children}
    </span>
  );
}
