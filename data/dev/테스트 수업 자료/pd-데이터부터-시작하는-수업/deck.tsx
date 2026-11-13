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

/* ── 데이터부터 시작하는 수업 설계 (교사 연수 15분 · 13장) ────────────────
   기획: pd-script → pd-chunk → pd-scene (newVideoGen vg- 루틴 이식)
   SSOT: script.json(61문장) → beats.json(24비트) → scene-plan.json(13씬) → plan.md
   저작 규칙: react-deck-builder/references/bolt-authoring.md + rules/scene-grammar.md

   이 덱의 규약
   - 발표자 노트 = script.json 문장 글자 그대로 (원자성, 손실 0)
   - 화면 텍스트 = scene-plan.json visual_plan의 focal/subline/support만 (dedup ≤ 0.60 통과분)
   - pattern_ref는 힌트. 구도는 씬마다 자유 설계 (R11 원칙 A)
   - 13장 전부 중앙 정렬 (bolt 하드 룰 3 — 옆에 나란한 비주얼이 없다) */

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
        <h2 className="headline" style={{ marginInline: 'auto', marginTop: kicker ? 10 : 0, ...kw }}>{children}</h2>
      </div>
    </Reveal>
  );
}

/* ══ S1 — 16주 학기 막대, 6주에서 톱니로 끊긴다 (P01 mega number 힌트) ══ */
const WEEKS = 16;
const BREAK_WEEK = 6;

function BrokenTermScene() {
  const t = useSceneTime();
  const X0 = 150; const X1 = 1080;
  const perWeek = (X1 - X0) / WEEKS;
  const breakX = X0 + perWeek * BREAK_WEEK;
  const grow = interpolate(t, [0.5, 2.2], [0, 1], easeOut);
  const barX = X0 + (breakX - X0) * grow;
  const snap = interpolate(t, [2.25, 2.45], [0, 1]);
  const shake = snap * Math.max(0, 1 - (t - 2.3) * 2.6) * Math.sin(t * 44) * 6;
  const label = interpolate(t, [2.5, 2.9], [0, 1]);
  const mega = spring(t, 3.2, 0.9);
  const sub = interpolate(t, [4.0, 4.5], [0, 1]);

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ paddingTop: 'clamp(28px, 5.5vh, 58px)', paddingInline: 'clamp(24px, 6vw, 92px)', textAlign: 'center' }}>
        <h2 className="headline" style={{ marginInline: 'auto', maxWidth: 'none', ...kw, ...riseIn(t, 0.1) }}>
          6주 차에 <span className="accent-text">사라진 석 달</span>
        </h2>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '2vh' }}>
        <svg viewBox="0 0 1200 470" style={{ width: 'min(1140px, 95vw)', height: 'auto' }} role="img"
          aria-label="16주 학기 막대가 6주 차에서 끊기고, 6팀 중 2팀이라는 숫자가 크게 남는다">
          {Array.from({ length: WEEKS + 1 }, (_, w) => (
            <line key={w} x1={X0 + perWeek * w} y1={64} x2={X0 + perWeek * w} y2={74} stroke="var(--fg-faint)" strokeWidth={1.5} opacity={0.5} />
          ))}
          <text x={X0} y={52} fill="var(--fg-faint)" style={{ font: '600 13px var(--font-mono, monospace)' }}>1주</text>
          <text x={X1} y={52} textAnchor="end" fill="var(--fg-faint)" style={{ font: '600 13px var(--font-mono, monospace)' }}>16주</text>
          <text x={X0} y={112} fill="var(--fg-muted)" opacity={interpolate(t, [0.2, 0.5], [0, 1])}
            style={{ font: '800 19px var(--font-body, sans-serif)' }}>작년</text>
          <g transform={`translate(${shake} 0)`}>
            <rect x={X0} y={132} width={Math.max(0, barX - X0)} height={30} rx={6} fill="color-mix(in srgb, var(--fg-muted) 55%, transparent)" />
          </g>
          <g opacity={snap}>
            <path d={`M${barX} 132 l10 8 l-10 7 l10 8 l-10 7`} fill="none" stroke="var(--fg-muted)" strokeWidth={2.5} strokeLinejoin="round" />
            <line x1={breakX} y1={64} x2={breakX} y2={186} stroke="var(--fg-faint)" strokeWidth={1} strokeDasharray="5 6" opacity={0.6} />
            <text x={breakX} y={208} textAnchor="middle" fill="var(--fg-muted)" opacity={label}
              style={{ font: '700 14px var(--font-mono, monospace)' }}>6주차</text>
          </g>
          {/* 메가 숫자 — 끊긴 자리 아래에서 솟는다 */}
          <g opacity={mega} transform={`translate(0 ${(1 - mega) * 24})`}>
            <text x={600} y={372} textAnchor="middle" fill="var(--primary)"
              style={{ font: '800 118px var(--font-mono, monospace)', letterSpacing: '-0.02em' }}>6팀 중 2팀</text>
          </g>
          <text x={600} y={430} textAnchor="middle" fill="var(--fg-muted)" opacity={sub}
            style={{ font: '500 19px var(--font-body, sans-serif)' }}>석 달이 그 자리에서 없어졌다</text>
        </svg>
      </div>
    </div>
  );
}

/* ══ S3 — 절벽 사이의 틈 (P19 two-col contrast 힌트) ══ */
function GapScene() {
  const t = useSceneTime();
  const left = spring(t, 0.3, 0.9);
  const right = spring(t, 0.6, 0.9);
  const bridge = interpolate(t, [1.6, 3.2], [0, 1], easeInOut);
  const snapAt = 0.58; // 다리가 닿지 못하는 지점 — 틈의 절반을 넘어선다
  const fall = interpolate(t, [3.3, 3.9], [0, 1], easeOut);
  const lab = interpolate(t, [4.1, 4.6], [0, 1]);
  const gapWord = spring(t, 4.8, 0.8);

  const LX = 90; const LW = 300;
  const RX = 810; const RW = 300;
  const TOP = 150; const H = 260;

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ paddingTop: 'clamp(28px, 5.5vh, 58px)', paddingInline: 'clamp(24px, 6vw, 92px)', textAlign: 'center' }}>
        <h2 className="headline" style={{ marginInline: 'auto', maxWidth: 'none', ...kw, ...riseIn(t, 0.1) }}>
          학생이 메울 수 없는 <span className="accent-text">폭</span>
        </h2>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '2vh' }}>
        <svg viewBox="0 0 1200 500" style={{ width: 'min(1140px, 95vw)', height: 'auto' }} role="img"
          aria-label="풀고 싶은 문제와 손에 넣을 데이터 사이에 틈이 있고, 다리가 닿지 못해 끊긴다">
          {/* 왼쪽 절벽 */}
          <g opacity={left} transform={`translate(0 ${(1 - left) * 20})`}>
            <path d={`M${LX} ${TOP} h${LW} l-18 ${H} H${LX} z`} fill="color-mix(in srgb, var(--fg-muted) 28%, transparent)" stroke="var(--fg-muted)" strokeWidth={2} />
            <text x={LX + LW / 2 - 9} y={TOP + 52} textAnchor="middle" fill="var(--fg)" style={{ font: '800 24px var(--font-body, sans-serif)' }}>풀고 싶은 것</text>
            <text x={LX + LW / 2 - 9} y={TOP + 84} textAnchor="middle" fill="var(--fg-muted)" style={{ font: '500 15px var(--font-body, sans-serif)' }}>동기</text>
          </g>
          {/* 오른쪽 절벽 */}
          <g opacity={right} transform={`translate(0 ${(1 - right) * 20})`}>
            <path d={`M${RX} ${TOP} h${RW} v${H} H${RX + 18} z`} fill="color-mix(in srgb, var(--primary) 14%, transparent)" stroke="var(--primary)" strokeWidth={2} />
            <text x={RX + RW / 2 + 9} y={TOP + 52} textAnchor="middle" fill="var(--fg)" style={{ font: '800 24px var(--font-body, sans-serif)' }}>손에 넣을 것</text>
            <text x={RX + RW / 2 + 9} y={TOP + 84} textAnchor="middle" fill="var(--fg-muted)" style={{ font: '500 14px var(--font-body, sans-serif)' }}>행정 자료 · 공공 통계</text>
          </g>
          {/* 다리 — 왼쪽에서 뻗다가 중간에서 끊기고 떨어진다 */}
          {(() => {
            /* 판자를 촘촘히(14px) 깔아 "뻗어 나간다"가 읽히게 하고, 끊긴 판자는
               절벽 안쪽(왼쪽)으로 떨어뜨려 중앙의 '간격' 글자를 가리지 않게 한다 */
            const reach = Math.min(bridge, snapAt);
            const x0 = LX + LW - 18; const x1 = RX + 18;
            const endX = x0 + (x1 - x0) * reach;
            const segLen = 14;
            const planks = Math.floor((endX - x0) / segLen);
            const dropN = 4;
            return (
              <g>
                {Array.from({ length: planks }, (_, i) => {
                  const px = x0 + i * segLen;
                  const k = i - (planks - dropN);
                  const isLast = k >= 0;
                  const dy = isLast ? fall * (70 + k * 36) : 0;
                  const dx = isLast ? -fall * (30 + k * 22) : 0;
                  const rot = isLast ? -fall * (18 + k * 12) : 0;
                  return (
                    <rect key={i} x={px} y={TOP + 4} width={segLen - 3} height={9} rx={2}
                      fill="var(--fg-muted)" opacity={isLast ? 0.85 - fall * 0.35 : 0.85}
                      transform={`translate(${dx} ${dy}) rotate(${rot} ${px} ${TOP + 8})`} />
                  );
                })}
              </g>
            );
          })()}
          {/* 틈 — 중앙을 통과하는 단어 */}
          <g opacity={gapWord} transform={`translate(0 ${(1 - gapWord) * 14})`}>
            <text x={600} y={TOP + H / 2 + 16} textAnchor="middle" fill="var(--primary)"
              style={{ font: '800 58px var(--font-body, sans-serif)' }}>간격</text>
          </g>
          <text x={600} y={TOP + H + 52} textAnchor="middle" fill="var(--fg-muted)" opacity={lab}
            style={{ font: '500 17px var(--font-body, sans-serif)' }}>학교 행정 자료는 교사도 쉽게 못 받고, 공공 통계는 주제와 맞지 않는다</text>
        </svg>
      </div>
    </div>
  );
}

/* ══ S7 — 눈이 촘촘해지는 체 세 개 (P09 number chain 힌트) ══ */
const SIEVE_MARK = ['행 ≥ 30', '열 ≥ 3', '직접 연다'];
const SIEVE_Y = [162, 312, 462];
const STOP_Y = [26, 154, 304, 454, 546];
const SEG_T: [number, number][] = [[0.3, 1.6], [1.8, 3.1], [3.3, 4.6], [4.8, 5.7]];
const PASS = [14, 9, 6, 3];
const SX0 = 96; const SX1 = 740; const DISH_X = 418;
const DISH_SLOT = [-42, 0, 42];
const BALL_ORDER = [3, 9, 0, 11, 6, 1, 13, 4, 8, 2, 10, 5, 12, 7];
const BALLS = BALL_ORDER.map((i, slot) => ({ i, x: SX0 + 44 + slot * ((SX1 - SX0 - 88) / (PASS[0] - 1)) }));

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
          aria-label="데이터 후보 열네 알이 체 세 개를 지나 세 알만 남는다">
          {SIEVE_Y.map((sy, g) => {
            const on = interpolate(t, [SEG_T[g][1] - 0.5, SEG_T[g][1] - 0.1], [0, 1]);
            const step = 44 - g * 14; const depth = 11 + g * 5;
            const ticks = Math.floor((SX1 - SX0) / step) + 1;
            return (
              <g key={sy}>
                <line x1={SX0} y1={sy} x2={SX1} y2={sy} stroke="var(--primary)" strokeWidth={3.5} strokeLinecap="round" opacity={0.35 + 0.6 * on} />
                {Array.from({ length: ticks }, (_, k) => (
                  <line key={k} x1={SX0 + k * step} y1={sy - depth} x2={SX0 + k * step} y2={sy} stroke="var(--primary)" strokeWidth={2.2} opacity={0.22 + 0.48 * on} />
                ))}
                <text x={790} y={sy + 8} fill="var(--fg)" opacity={on} style={{ font: '800 30px var(--font-mono, monospace)' }}>{SIEVE_MARK[g]}</text>
                <text x={SX1} y={sy - depth - 10} textAnchor="end" fill="var(--fg-faint)" opacity={on}
                  style={{ font: '600 13.5px var(--font-mono, monospace)' }}>{`${PASS[g] - PASS[g + 1]}개 탈락`}</text>
              </g>
            );
          })}
          <path d={`M${DISH_X - 120} 560 q120 42 240 0`} fill="none" stroke="var(--primary)" strokeWidth={4} strokeLinecap="round" opacity={interpolate(t, [5.3, 5.7], [0, 1])} />
          <text x={DISH_X} y={606} textAnchor="middle" fill="var(--primary)" opacity={interpolate(t, [5.6, 6.0], [0, 1])}
            style={{ font: '800 17px var(--font-body, sans-serif)' }}>14 → 9 → 6 → 3</text>
          {BALLS.map((b) => {
            const legs = b.i >= PASS[1] ? 1 : b.i >= PASS[2] ? 2 : b.i >= PASS[3] ? 3 : 4;
            let y = STOP_Y[0]; let done = 0;
            for (let k = 0; k < legs; k += 1) {
              const p = interpolate(t, SEG_T[k], [0, 1], easeOut);
              y = STOP_Y[k] + (STOP_Y[k + 1] - STOP_Y[k]) * p;
              done = k + (p >= 1 ? 1 : 0);
              if (p < 1) break;
            }
            const survives = legs === 4; const settled = done >= legs;
            const gather = survives ? interpolate(t, SEG_T[3], [0, 1], easeInOut) : 0;
            const target = survives ? DISH_X + DISH_SLOT[b.i] : b.x;
            return <circle key={b.i} cx={b.x + (target - b.x) * gather} cy={y} r={9.5}
              fill={survives ? 'var(--primary)' : 'var(--fg-muted)'} opacity={settled && !survives ? 0.35 : 0.95} />;
          })}
        </svg>
      </div>
    </div>
  );
}

/* ── 재사용 조각 ── */
function Blank({ children }: { children: ReactNode }) {
  return <span style={{ display: 'inline-block', padding: '2px 12px', margin: '0 2px', borderBottom: '2px solid var(--primary)', color: 'var(--primary)', fontWeight: 800 }}>{children}</span>;
}

/* ── 덱 본체 ── */
export default function PdDataFirstLessonDesignDeck() {
  return (
    <Deck>
      {/* S1 — scene · P01 mega number */}
      <Slide full nav="6주차"
        notes={`작년 프로젝트 수업에서 여섯 팀 가운데 두 팀이 6주 차에 멈췄습니다.
한 팀은 미세먼지와 결석률의 관계를 보겠다고 했습니다.
결석률 데이터는 개인정보라 학교가 내줄 수 없었습니다.
석 달을 준비한 주제가 그 자리에서 없어졌습니다.`}>
        <Scene><BrokenTermScene /></Scene>
      </Slide>

      {/* S2 — static · P38 hero wordmark. 제안 한 단어가 화면을 지배 */}
      <Slide center nav="제안"
        notes={`오늘 드리고 싶은 제안은 하나입니다.
프로젝트 수업의 첫 차시를 문제 정하기가 아니라 데이터 찾기로 두자는 것입니다.`}>
        <Reveal>
          <div style={{ textAlign: 'center' }}>
            <div className="kicker">첫 차시</div>
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(8px, 1.4vh, 16px)' }}>
              <span style={{ fontWeight: 700, fontSize: 'clamp(20px, 2.6vw, 34px)', color: 'var(--fg-faint)', textDecoration: 'line-through', textDecorationThickness: 3, ...kw }}>문제 정하기</span>
              <span style={{ fontWeight: 800, fontSize: 'clamp(52px, 8vw, 124px)', lineHeight: 1.05, color: 'var(--primary)', ...kw }}>데이터 찾기</span>
            </div>
          </div>
        </Reveal>
      </Slide>

      {/* S3 — scene · P19 two-col contrast */}
      <Slide full nav="간격"
        notes={`보통 프로젝트 수업은 문제를 먼저 정하게 합니다.
학생이 관심 있는 주제를 고르면 동기가 생긴다는 이유입니다.
그런데 동기는 생기는데 데이터가 없습니다.
풀고 싶은 문제와 손에 넣을 수 있는 데이터 사이에 간격이 있기 때문입니다.
이 간격은 학생이 메울 수 없습니다.
학교 행정 자료는 교사도 쉽게 못 받고, 공공 통계는 학생 주제와 맞지 않는 경우가 대부분입니다.`}>
        <Scene><GapScene /></Scene>
      </Slide>

      {/* S4 — build · P20 mini flow. 방향 반전이 핵심 */}
      <Slide center nav="뒤집기"
        notes={`그래서 순서를 뒤집자는 것입니다.
있는 데이터에서 출발하면 데이터가 없어서 멈추는 일은 구조적으로 사라집니다.`}>
        <Reveal>
          <div style={{ ...block(760), display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 2.4vh, 26px)' }}>
            {[
              { from: '문제', to: '데이터', lit: false },
              { from: '데이터', to: '문제', lit: true },
            ].map((r) => (
              <div key={r.from + r.to} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 'clamp(16px, 3vw, 40px)' }}>
                <span style={{ textAlign: 'right', fontWeight: 800, fontSize: r.lit ? 'clamp(30px, 4vw, 58px)' : 'clamp(22px, 3vw, 40px)', color: r.lit ? 'var(--primary)' : 'var(--fg-faint)', ...kw }}>{r.from}</span>
                <svg width="90" height="26" viewBox="0 0 90 26" aria-hidden>
                  <line x1={2} y1={13} x2={70} y2={13} stroke={r.lit ? 'var(--primary)' : 'var(--fg-faint)'} strokeWidth={r.lit ? 4 : 2.5} strokeLinecap="round" />
                  <path d="M80 13 l-12 -7 v14 z" fill={r.lit ? 'var(--primary)' : 'var(--fg-faint)'} />
                </svg>
                <span style={{ textAlign: 'left', fontWeight: 800, fontSize: r.lit ? 'clamp(30px, 4vw, 58px)' : 'clamp(22px, 3vw, 40px)', color: r.lit ? 'var(--fg)' : 'var(--fg-faint)', ...kw }}>{r.to}</span>
              </div>
            ))}
          </div>
        </Reveal>
        <Build at={1}>
          <p className="lead" style={{ marginInline: 'auto', marginTop: 'clamp(26px, 4vh, 48px)', textAlign: 'center', ...kw }}>
            멈추는 일이 <strong style={{ color: 'var(--primary)' }}>구조적으로</strong> 사라진다
          </p>
        </Build>
      </Slide>

      {/* S5 — build · P10 hub satellite. 2축 좌표 위 원 셋 */}
      <Slide nav="세 갈래"
        notes={`학생이 손에 넣을 수 있는 데이터는 세 갈래로 나뉩니다.
첫째는 공개 데이터입니다.
공공데이터포털, 국가통계포털, 학교알리미처럼 지금 당장 받을 수 있는 곳입니다.
양은 충분하지만 학생과 멀어서 문제가 잘 안 보입니다.
둘째는 학교 안 데이터입니다.
급식 메뉴, 시간표, 도서 대출 목록, 동아리 명단 같은 것들입니다.
문제는 바로 보이는데 파일로 정리돼 있지 않습니다.
셋째는 학생이 직접 만드는 데이터입니다.
설문이나 2주간의 자기 기록처럼 아직 세상에 없는 데이터입니다.
가치는 가장 높지만 모으는 데 시간이 듭니다.`}>
        <div style={{ ...block(1160), display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.6vh, 20px)' }}>
          <CenterHead>데이터는 <span className="accent-text">세 갈래</span>에 있다</CenterHead>
          <TrackMapBuild />
          {/* plan: at=2에서 하단에 '셋 다' — 원 셋이 at=1·2·3 이라 at=4로 */}
          <Build at={4}>
            <div style={{ marginInline: 'auto', paddingTop: 12, borderTop: hair, width: 'min(420px, 100%)', textAlign: 'center', ...mono, fontWeight: 800, fontSize: 'clamp(18px, 2.2vw, 26px)', color: 'var(--primary)', letterSpacing: '0.1em' }}>
              셋 다
            </div>
          </Build>
        </div>
      </Slide>

      {/* S6 — static · P16 warning symbol. 규칙 한 단어 */}
      <Slide center nav="셋 다"
        notes={`첫 차시의 규칙은 이 셋을 모두 채우게 하는 것입니다.
한 갈래에만 몰리면 다음 단계에서 문장이 나오지 않습니다.`}>
        <Reveal>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(14px, 2.4vw, 30px)', marginBottom: 'clamp(22px, 3.4vh, 40px)' }}>
            {['공개', '학교 안', '직접'].map((k) => (
              <div key={k} style={{ width: 'clamp(72px, 9vw, 120px)', aspectRatio: '1', borderRadius: '50%', border: '2px solid var(--primary)', background: 'color-mix(in srgb, var(--primary) 13%, var(--bg))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 'clamp(13px, 1.5vw, 17px)', ...kw }}>{k}</div>
            ))}
          </div>
        </Reveal>
        <Reveal>
          <div style={{ ...mono, fontWeight: 800, fontSize: 'clamp(56px, 9vw, 140px)', lineHeight: 1, color: 'var(--primary)', textAlign: 'center', letterSpacing: '0.06em' }}>셋 다</div>
        </Reveal>
        <Build at={1}>
          <p className="lead" style={{ marginInline: 'auto', marginTop: 18, textAlign: 'center', ...kw }}>한 갈래에만 몰리면 막힌다</p>
        </Build>
      </Slide>

      {/* S7 — scene · P09 number chain */}
      <Slide full nav="체"
        notes={`찾은 데이터가 다 쓸 만한 것은 아닙니다.
조건을 세 개로 고정해서 학습지에 체크박스로 넣습니다.
행이 30개 이상인가.
사례가 여러 개라야 비교나 추천이 가능합니다.
열이 3개 이상인가.
속성이 하나뿐이면 할 수 있는 것이 없습니다.
학생이 직접 열어볼 수 있는가.
CSV나 엑셀이나 표여야 하고, 그림이나 PDF 보고서나 로그인이 필요한 자료는 제외합니다.
셋 중 하나라도 통과하지 못하면 후보에서 뺍니다.`}>
        <Scene><SieveScene /></Scene>
      </Slide>

      {/* S8 — build · P12 doc split. 틀 + 예시 */}
      <Slide nav="빈칸"
        notes={`데이터를 찾았으면 문제로 넘어가야 합니다.
이 전환을 위해 문장 틀을 하나만 줍니다.
누가, 어떤 상황에서, 무엇을 몰라서 불편한데, 이 데이터가 있으면 무엇을 알 수 있다.
급식 메뉴와 잔반량 데이터로 예를 들겠습니다.
영양사 선생님은 식단을 짤 때 어떤 메뉴가 남을지 몰라서 곤란한데, 이 데이터가 있으면 메뉴 조합별 잔반 경향을 알 수 있다.`}>
        <div style={{ ...block(1080), display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 2.6vh, 32px)' }}>
          <CenterHead kicker="틀은 하나">빈칸 <span className="accent-text">넷</span></CenterHead>
          <Reveal>
            <div style={{ ...card, padding: 'clamp(20px, 3vw, 38px)' }}>
              <p style={{ fontSize: 'clamp(17px, 2.2vw, 27px)', fontWeight: 700, lineHeight: 1.9, textAlign: 'center', color: 'var(--fg-muted)', ...kw }}>
                <Blank>누가</Blank>는 <Blank>어떤 상황</Blank>에서 <Blank>무엇</Blank>을 몰라서 불편한데, 이 데이터가 있으면 <Blank>무엇</Blank>을 알 수 있다.
              </p>
            </div>
          </Reveal>
          <Build at={1}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: 'clamp(14px, 2.4vw, 32px)', alignItems: 'start', textAlign: 'left' }}>
              <div>
                <div style={{ ...mono, fontSize: 12.5, color: 'var(--fg-muted)', letterSpacing: '0.06em', marginBottom: 8 }}>가진 데이터</div>
                <p style={{ fontSize: 'clamp(14px, 1.6vw, 17px)', fontWeight: 700, lineHeight: 1.6, ...kw }}>급식 메뉴와 잔반량</p>
              </div>
              <div style={{ paddingLeft: 'clamp(14px, 2vw, 26px)', borderLeft: '3px solid var(--primary)' }}>
                <div style={{ ...mono, fontSize: 12.5, color: 'var(--primary)', letterSpacing: '0.06em', marginBottom: 8 }}>영양사</div>
                <p style={{ fontSize: 'clamp(14.5px, 1.7vw, 18px)', fontWeight: 700, lineHeight: 1.7, ...kw }}>
                  식단을 짤 때 어떤 메뉴가 남을지 몰라서 곤란한데, 이 데이터가 있으면 메뉴 조합별 잔반 경향을 알 수 있다.
                </p>
              </div>
            </div>
          </Build>
        </div>
      </Slide>

      {/* S9 — static · P32 big ratio contrast */}
      <Slide center nav="그래서?"
        notes={`반면 급식 만족도를 조사한다는 문장은 문제가 아닙니다.
조사에서 끝나고 아무도 덜 힘들어지지 않기 때문입니다.
누군가가 덜 힘들어져야 문제입니다.`}>
        <Reveal>
          <div style={{ textAlign: 'center' }}>
            <div style={{ ...mono, fontSize: 12.5, color: 'var(--fg-muted)', letterSpacing: '0.06em', marginBottom: 6 }}>만족도 조사</div>
            <div style={{ ...mono, fontWeight: 800, fontSize: 'clamp(70px, 11vw, 168px)', lineHeight: 1, color: 'var(--fg-muted)' }}>3.7점</div>
            <div style={{ fontWeight: 800, fontSize: 'clamp(28px, 4vw, 60px)', marginTop: 10, ...kw }}>그래서?</div>
          </div>
        </Reveal>
        <Build at={1}>
          <div style={{ ...block(700), marginTop: 'clamp(26px, 4vh, 46px)', ...card, textAlign: 'left', borderColor: 'color-mix(in srgb, var(--primary) 45%, transparent)', background: 'color-mix(in srgb, var(--primary) 9%, var(--surface))' }}>
            <div style={{ ...mono, fontSize: 12.5, color: 'var(--primary)', letterSpacing: '0.06em', marginBottom: 8 }}>곤란한 사람이 있는가</div>
            <p style={{ fontSize: 'clamp(15px, 1.8vw, 20px)', fontWeight: 800, lineHeight: 1.6, ...kw }}>덜 힘들어지는 사람</p>
          </div>
        </Build>
      </Slide>

      {/* S10 — build · P13 radial people. 분기 트리, 가지 끝은 Build로 */}
      <Slide nav="다른 사람"
        notes={`데이터 하나당 문장을 세 개씩, 모두 아홉 개를 쓰게 합니다.
이때 요구하는 것이 하나 있습니다.
문장 안의 누가가 매번 달라야 합니다.
같은 급식 데이터로 영양사는 잔반 경향을, 학생회는 건의 근거를, 행정실은 발주량 조정 근거를 얻습니다.
사람을 바꾸면 문제 후보의 질이 눈에 띄게 올라갑니다.`}>
        <div style={{ ...block(1140), display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 2.2vh, 26px)' }}>
          <CenterHead kicker="누가를 바꾼다"><span style={mono}>3 × 3</span> = <span className="accent-text">9</span></CenterHead>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.8fr) minmax(0, 1.9fr)', gap: 'clamp(16px, 3vw, 48px)', alignItems: 'center', textAlign: 'left' }}>
            <Reveal>
              <div style={{ ...card, textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: 'clamp(15px, 1.8vw, 19px)', ...kw }}>급식 데이터 하나</div>
              </div>
            </Reveal>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 1.4vh, 16px)' }}>
              {[
                { who: '영양사', what: '잔반 경향' },
                { who: '학생회', what: '건의 근거' },
                { who: '행정실', what: '발주량 조정 근거' },
              ].map((x, i) => (
                <Build key={x.who} at={i + 1}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px, 1.6vw, 20px)' }}>
                    <svg width="56" height="26" viewBox="0 0 56 26" style={{ flex: 'none' }} aria-hidden>
                      <path d={i === 0 ? 'M0 22 C 24 22, 26 5, 48 5' : i === 1 ? 'M0 13 L 48 13' : 'M0 4 C 24 4, 26 21, 48 21'} fill="none" stroke="var(--primary)" strokeWidth={2.5} opacity={0.65} />
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

      {/* S11 — static · P18 vertical dual bar. 증상 → 대처 계단 */}
      <Slide nav="장애"
        notes={`실습에서 매년 반복되는 장애가 세 가지 있습니다.
찾을 게 없다는 말이 10분 안에 나옵니다.
학교 안 데이터 목록을 예비 카드로 대여섯 장 준비해 두면 됩니다.
거대한 국가 통계표를 가져오는 학생이 반드시 있습니다.
우리 학교나 우리 지역만 남기면 몇 행인지 세게 해서 좁힙니다.
AI에게 바로 물어보는 학생도 나옵니다.
막지 않되 실제 주소를 열어 파일을 확인한 것만 적게 하면, 존재하지 않는 데이터셋이 걸러집니다.`}>
        <div style={{ ...block(960), display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 2.6vh, 30px)' }}>
          <CenterHead>매년 나오는 <span className="accent-text">셋</span></CenterHead>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 2vh, 22px)' }}>
            {[
              { sym: '찾을 게 없다', fix: '예비 카드', pad: 0 },
              { sym: '100,000행', fix: '지역 필터', pad: 28 },
              { sym: 'AI가 알려줬다', fix: 'URL 확인', pad: 56 },
            ].map((x) => (
              <Reveal key={x.sym}>
                <div style={{ paddingLeft: x.pad, display: 'flex', gap: 'clamp(14px, 2vw, 22px)', alignItems: 'center' }}>
                  <span style={{ flex: 'none', width: 3, alignSelf: 'stretch', borderRadius: 2, background: 'var(--primary)', opacity: 0.75 }} />
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 'clamp(12px, 2.4vw, 32px)' }}>
                    <span style={{ textAlign: 'right', fontWeight: 800, fontSize: 'clamp(18px, 2.4vw, 32px)', color: 'var(--fg-muted)', ...kw }}>{x.sym}</span>
                    <svg width="60" height="22" viewBox="0 0 60 22" aria-hidden>
                      <line x1={2} y1={11} x2={44} y2={11} stroke="var(--fg-muted)" strokeWidth={3} strokeLinecap="round" opacity={0.6} />
                      <path d="M50 11 l-9 -5 v10 z" fill="var(--fg-muted)" opacity={0.6} />
                    </svg>
                    <span style={{ textAlign: 'left', fontWeight: 800, fontSize: 'clamp(18px, 2.4vw, 32px)', color: 'var(--primary)', ...kw }}>{x.fix}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Slide>

      {/* S12 — build · P07 tile. 키스톤 아치 */}
      <Slide nav="장치 넷"
        notes={`정리하겠습니다.
첫 차시를 데이터 찾기로 두면 학기 중반에 멈추는 팀이 구조적으로 사라집니다.
세 갈래 강제, 조건 셋, 문장 틀 하나, 누가 바꾸기.
이 네 가지 장치면 50분 안에 데이터 후보 셋과 문제 후보 아홉이 나옵니다.`}>
        <div style={{ ...block(1060), display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 2.2vh, 26px)', alignItems: 'center' }}>
          <CenterHead>학기를 결정하는 <span className="accent-text">50분</span></CenterHead>
          <Reveal>
            {/* 아치 — 돌 다섯 개가 맞닿아 호를 이룬다. 키스톤이 꼭대기에서 누르고
                네 돌이 받친다. 돌이 떠 있으면 조직도로 읽힌다 (첫 픽셀 검수) */}
            <svg viewBox="0 0 900 400" style={{ width: 'min(880px, 92vw)', height: 'auto' }} role="img" aria-label="아치 꼭대기 키스톤이 첫 차시, 양쪽 네 돌이 네 가지 장치">
              {(() => {
                const cx = 450; const cy = 392; const R1 = 360; const R0 = 258;
                const deg = (a: number) => (a * Math.PI) / 180;
                const P = (r: number, a: number) => `${cx + r * Math.cos(deg(a))} ${cy - r * Math.sin(deg(a))}`;
                // 180°(좌)→0°(우). 돌 경계 각도 — 키스톤이 정가운데
                const edges = [178, 144, 108, 72, 36, 2];
                const stones = [
                  { t: '세 갈래 강제', key: false }, { t: '조건 셋', key: false },
                  { t: '첫 차시', key: true }, { t: '틀 하나', key: false }, { t: '누가 바꾸기', key: false },
                ];
                return stones.map((s, i) => {
                  const a0 = edges[i]; const a1 = edges[i + 1];
                  const d = `M${P(R0, a0)} A${R0} ${R0} 0 0 1 ${P(R0, a1)} L${P(R1, a1)} A${R1} ${R1} 0 0 0 ${P(R1, a0)} Z`;
                  const am = (a0 + a1) / 2; const rm = (R0 + R1) / 2;
                  const [tx, ty] = P(rm, am).split(' ').map(Number);
                  return (
                    <g key={s.t}>
                      <path d={d} fill={s.key ? 'var(--primary)' : 'color-mix(in srgb, var(--primary) 13%, var(--bg))'} stroke="var(--primary)" strokeWidth={2} strokeLinejoin="round" />
                      <text x={tx} y={ty + 6} textAnchor="middle" fill={s.key ? 'var(--accent-ink)' : 'var(--fg)'}
                        style={{ font: `800 ${s.key ? 22 : 16}px var(--font-body, sans-serif)` }}>{s.t}</text>
                    </g>
                  );
                });
              })()}
            </svg>
          </Reveal>
          <Build at={1}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 'clamp(14px, 2.4vw, 30px)' }}>
              <span style={{ ...mono, fontWeight: 800, fontSize: 'clamp(40px, 6vw, 84px)', lineHeight: 1, color: 'var(--primary)' }}>3</span>
              <span style={{ color: 'var(--fg-muted)', fontSize: 'clamp(13px, 1.5vw, 16px)' }}>데이터 후보</span>
              <span style={{ ...mono, fontWeight: 800, fontSize: 'clamp(40px, 6vw, 84px)', lineHeight: 1, color: 'var(--primary)' }}>9</span>
              <span style={{ color: 'var(--fg-muted)', fontSize: 'clamp(13px, 1.5vw, 16px)' }}>문제 후보</span>
            </div>
          </Build>
        </div>
      </Slide>

      {/* S13 — static · P17 icon card. 공유 폴더 */}
      <Slide center nav="공유"
        notes={`학습지와 덱은 공유 폴더에 올려 두었습니다.
다음 학기 첫 시간에 한 번 써 보시고 결과를 나눠 주시면 좋겠습니다.`}>
        <Reveal>
          <div style={{ ...card, ...block(560), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 'clamp(24px, 3.4vh, 40px)' }}>
            <svg width="72" height="58" viewBox="0 0 72 58" aria-hidden>
              <path d="M4 12 h22 l6 6 h36 v36 H4 z" fill="color-mix(in srgb, var(--primary) 18%, transparent)" stroke="var(--primary)" strokeWidth={2.5} strokeLinejoin="round" />
            </svg>
            <div style={{ fontWeight: 800, fontSize: 'clamp(20px, 2.6vw, 30px)', ...kw }}>공유 폴더</div>
            <div style={{ display: 'flex', gap: 12 }}>
              {['학습지', '덱'].map((b) => (
                <span key={b} style={{ padding: '6px 16px', borderRadius: 999, border: '1px solid var(--primary)', color: 'var(--primary)', fontWeight: 700, fontSize: 14 }}>{b}</span>
              ))}
            </div>
            <span style={{ color: 'var(--fg-muted)', fontSize: 14.5, ...kw }}>다음 학기 첫 시간에</span>
          </div>
        </Reveal>
      </Slide>
    </Deck>
  );
}

/* ── S5 좌표맵 — 원 셋이 Build로 하나씩 앉는다 ── */
const TRACKS = [
  { key: '공개', x: 250, y: 132, r: 88 },
  { key: '학교 안', x: 588, y: 250, r: 100 },
  { key: '직접', x: 920, y: 366, r: 84 },
] as const;

function TrackMapBuild() {
  const AX = 118; const AY = 470;
  return (
    /* 래퍼에 viewBox와 같은 aspectRatio를 줘야 % 절대배치가 SVG 좌표와 일치한다.
       없으면 래퍼 높이가 내용 높이와 어긋나 원이 아래로 밀린다 (첫 픽셀 검수) */
    <div style={{ position: 'relative', width: '100%', aspectRatio: '1140 / 516' }}>
      <svg viewBox="0 0 1140 516" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} role="img" aria-label="데이터 세 갈래 좌표 — 가로축은 나와의 거리, 세로축은 정리된 정도">
        <line x1={AX} y1={AY} x2={1092} y2={AY} stroke="var(--fg-muted)" strokeWidth={2} opacity={0.5} strokeLinecap="round" />
        <line x1={AX} y1={AY} x2={AX} y2={46} stroke="var(--fg-muted)" strokeWidth={2} opacity={0.5} strokeLinecap="round" />
        <text x={AX} y={502} fill="var(--fg-muted)" style={{ font: '500 15px var(--font-body, sans-serif)' }}>나와 멀다</text>
        <text x={1092} y={502} textAnchor="end" fill="var(--fg-muted)" style={{ font: '500 15px var(--font-body, sans-serif)' }}>나와 가깝다</text>
        <text x={AX - 18} y={52} fill="var(--fg-muted)" style={{ font: '500 15px var(--font-body, sans-serif)', writingMode: 'vertical-rl' }}>이미 정리됨</text>
        <text x={AX - 18} y={AY - 96} fill="var(--fg-muted)" style={{ font: '500 15px var(--font-body, sans-serif)', writingMode: 'vertical-rl' }}>아직 날것</text>
        <path d={`M${TRACKS[0].x + 66} ${TRACKS[0].y + 60} Q ${TRACKS[1].x - 96} ${TRACKS[1].y - 40} ${TRACKS[1].x - 78} ${TRACKS[1].y - 62}`} fill="none" stroke="var(--primary)" strokeWidth={2} strokeDasharray="7 7" opacity={0.45} />
        <path d={`M${TRACKS[1].x + 78} ${TRACKS[1].y + 62} Q ${TRACKS[2].x - 96} ${TRACKS[2].y - 40} ${TRACKS[2].x - 68} ${TRACKS[2].y - 56}`} fill="none" stroke="var(--primary)" strokeWidth={2} strokeDasharray="7 7" opacity={0.45} />
      </svg>
      {/* 원은 Build 레이어로 하나씩. HTML 절대배치 + %는 Build(motion.div)의
          will-change/transform 이 absolute 자식의 기준점이 되어 어긋난다 (메모리:
          bolt-build-절대배치-함정). 같은 viewBox 의 SVG 레이어를 겹쳐 쌓으면
          좌표를 SVG 가 소유하므로 오프셋이 생기지 않는다 */}
      {TRACKS.map((tr, i) => (
        <Build key={tr.key} at={i + 1} style={{ position: 'absolute', inset: 0 }}>
          <svg viewBox="0 0 1140 516" style={{ width: '100%', height: '100%' }} aria-hidden>
            <circle cx={tr.x} cy={tr.y} r={tr.r} fill="color-mix(in srgb, var(--primary) 13%, var(--bg))" stroke="var(--primary)" strokeWidth={2} />
            <text x={tr.x} y={tr.y + 9} textAnchor="middle" fill="var(--fg)" style={{ font: '800 26px var(--font-body, sans-serif)' }}>{tr.key}</text>
          </svg>
        </Build>
      ))}
    </div>
  );
}
