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

/* ── 데이터 탐색과 문제 발견 (1차시 · 14장) ─────────────────────────────
   plan: data/dev/테스트 수업 자료/데이터-탐색과-문제-발견-기획본/plan.md (SSOT)
   저작 규칙: .claude/skills/react-deck-builder/references/bolt-authoring.md
             + .claude/rules/scene-grammar.md (씬 2장)

   정렬 규약(하드 룰 3): 사이드 비주얼이 옆에 실제로 있는 S1·S13만 좌측 비대칭,
   나머지 12장은 헤드라인과 본문 블록을 모두 중앙 정렬한다. 블록 *안*의 비대칭
   (4:8 분할 등)은 계획대로 유지 — 블록 자체가 중앙에 앉으면 규칙을 만족한다.

   미완 자리 (사용자 선택 "덱만 먼저")
   - S3 열쇠·자물쇠: plan의 `- svg:` 두 종을 svg-asset-builder로 만들기 전이라
     원·사각·호 프리미티브 조합으로 임시 저작. figural이 아니므로 졸라맨 금지
     조항에는 걸리지 않지만, 정식 자산으로 교체하는 것이 계획된 경로다.
   - S9 live 문항: quiz.json 미작성. 화면은 자리와 진행 안내만.
   - S13 학습지: 활동지 HTML 미제작. QR과 링크 자리만. */

const kw: CSSProperties = { wordBreak: 'keep-all' };
const mono: CSSProperties = { fontFamily: 'var(--font-mono, monospace)' };

/* 슬라이드 본문 블록의 공통 뼈대 — 중앙 정렬 + 최대폭 (하드 룰 3) */
const block = (max = 1100): CSSProperties => ({
  width: `min(${max}px, 100%)`,
  marginInline: 'auto',
});

const card: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  padding: 'clamp(16px, 2vw, 26px)',
};

/* 카드 밖 하이라인 — 다크 배경에서 var(--line)은 사라진다 */
const hair = '1px solid color-mix(in srgb, var(--fg) 16%, transparent)';

/* ══ Slide 3 — 자물쇠 벽과 열쇠꾸러미 ══════════════════════════════════
   metaphor: 자물쇠 벽과 열쇠꾸러미 | emotion: 아차 하는 깨달음
   intent: 문제를 먼저 정하는 순서가 왜 학기 중반에 멈추는지를 순서를 뒤집어 보인다 */

function Lock({ x, y, s = 1, lit = false, dead = false }: {
  x: number; y: number; s?: number; lit?: boolean; dead?: boolean;
}) {
  const ink = dead ? 'var(--fg-faint)' : lit ? 'var(--primary)' : 'var(--fg-muted)';
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={dead ? 0.5 : 1}>
      {/* 잠긴 자물쇠 — 고리 양다리가 몸통에 닿아야 '잠김'으로 읽힌다 */}
      <path d="M-15 -2 v-11 a15 15 0 0 1 30 0 v11" fill="none" stroke={ink} strokeWidth={5} strokeLinecap="round" />
      <rect x={-26} y={-2} width={52} height={42} rx={7}
        fill={lit ? 'color-mix(in srgb, var(--primary) 22%, transparent)' : 'transparent'}
        stroke={ink} strokeWidth={4} />
      <circle cx={0} cy={15} r={5} fill={ink} />
      <rect x={-2} y={16} width={4} height={11} rx={2} fill={ink} />
    </g>
  );
}

function Key({ x, y, s = 1, rot = 0, lit = false }: {
  x: number; y: number; s?: number; rot?: number; lit?: boolean;
}) {
  const ink = lit ? 'var(--primary)' : 'var(--fg-muted)';
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <circle cx={-30} cy={0} r={13} fill="none" stroke={ink} strokeWidth={5} />
      <rect x={-17} y={-3} width={48} height={6} rx={3} fill={ink} />
      <rect x={20} y={2} width={5} height={12} rx={2} fill={ink} />
      <rect x={29} y={2} width={5} height={9} rx={2} fill={ink} />
    </g>
  );
}

function LockKeyScene() {
  const t = useSceneTime();

  /* 위 밴드 — 자물쇠를 먼저 골랐을 때.
     튕긴 열쇠를 사라지게 하지 않고 바닥에 쌓아 둔다. 끝 상태에서 화면이 비지
     않아야 하고("맞지 않는 열쇠가 쌓였다"가 남는 그림), 교사가 설명하는 동안
     그 상태로 머물기 때문이다 (첫 픽셀 검수에서 위 밴드가 near-empty였다) */
  const FALLEN = [
    { x: 318, y: 214, rot: 16 },
    { x: 412, y: 224, rot: -9 },
    { x: 506, y: 210, rot: 27 },
  ];
  const wrongKeys = [0, 1, 2].map((i) => {
    const t0 = 0.5 + i * 0.8;
    const go = interpolate(t, [t0, t0 + 0.42], [0, 1], easeOut);
    const drop = interpolate(t, [t0 + 0.42, t0 + 0.9], [0, 1], easeInOut);
    const f = FALLEN[i];
    const x = 200 + (612 - 200) * go + (f.x - 612) * drop;
    const y = 130 + (f.y - 130) * drop;
    const tilt = -6 + i * 7 + f.rot * drop;
    const op = interpolate(t, [t0, t0 + 0.15], [0, 1]);
    return { x, y, tilt, op, settled: drop };
  });
  const deadLock = interpolate(t, [3.1, 3.45], [0, 1]);

  // 아래 밴드 — 열쇠를 먼저 쥐었을 때
  const showLower = interpolate(t, [3.8, 4.1], [0, 1]);
  const heldKey = spring(t, 4.2, 0.8);
  const link = interpolate(t, [5.1, 5.7], [0, 1], easeInOut); // 열쇠 → 맞는 자물쇠
  const chosen = interpolate(t, [5.6, 6.0], [0, 1]);
  const verdict = interpolate(t, [6.4, 6.9], [0, 1]);

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* 텍스트 밴드 — 상단 고정, 그래픽과 좌표로 분리 (레이아웃 계약 a) */}
      <div style={{ paddingTop: 'clamp(26px, 5vh, 54px)', paddingInline: 'clamp(24px, 6vw, 92px)', textAlign: 'center' }}>
        <h2 className="headline" style={{ marginInline: 'auto', maxWidth: 'none', ...kw, ...riseIn(t, 0.1) }}>
          자물쇠부터 고르면 <span className="accent-text">열쇠가 없다</span>
        </h2>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '2vh' }}>
        <svg viewBox="0 0 1200 580" style={{ width: 'min(1140px, 95vw)', height: 'auto' }} role="img"
          aria-label="자물쇠를 먼저 고르면 맞는 열쇠가 없고, 열쇠를 먼저 쥐면 열리는 자물쇠를 고를 수 있다">

          {/* ── 위: 문제를 먼저 고르면 ── */}
          <text x={110} y={40} fill="var(--fg-muted)" opacity={interpolate(t, [0.2, 0.5], [0, 1])}
            style={{ font: '800 19px var(--font-body, sans-serif)' }}>문제를 먼저 고르면</text>

          <Lock x={700} y={126} s={2} dead={deadLock > 0.5} />
          {wrongKeys.map((k, i) => (
            <g key={i} opacity={k.op}>
              <Key x={k.x} y={k.y} s={1.25} rot={k.tilt} />
            </g>
          ))}
          <text x={412} y={262} textAnchor="middle" fill="var(--fg-faint)"
            opacity={interpolate(t, [2.9, 3.3], [0, 1])}
            style={{ font: '500 15px var(--font-body, sans-serif)' }}>맞지 않은 열쇠만 쌓인다</text>
          <text x={800} y={120} fill="var(--fg-muted)" opacity={interpolate(t, [3.25, 3.65], [0, 1])}
            style={{ font: '800 19px var(--font-body, sans-serif)' }}>맞는 열쇠가 없다</text>
          <text x={800} y={150} fill="var(--fg-faint)" opacity={interpolate(t, [3.4, 3.8], [0, 1])}
            style={{ font: '500 16px var(--font-body, sans-serif)' }}>학기 중반에 멈춘다</text>

          <line x1={90} y1={300} x2={1110} y2={300}
            stroke="color-mix(in srgb, var(--fg) 16%, transparent)" strokeWidth={1} />

          {/* ── 아래: 데이터에서 출발하면 ── */}
          <text x={110} y={352} fill="var(--primary)" opacity={showLower}
            style={{ font: '800 19px var(--font-body, sans-serif)' }}>데이터에서 출발하면</text>

          {/* 연결선을 먼저 깔아 도형이 위에 오게 한다. 가장자리에서 출발해
              가로 중앙을 통과시켜 edge-cling을 막는다 (레이아웃 계약 d) */}
          <path d={`M282 442 L ${282 + (742 - 282) * link} 442`}
            fill="none" stroke="var(--primary)" strokeWidth={2.5} strokeDasharray="8 8" opacity={0.7} />

          <g opacity={heldKey} transform={`translate(0 ${(1 - heldKey) * 18})`}>
            <Key x={230} y={442} s={1.5} rot={0} lit />
            <text x={230} y={510} textAnchor="middle" fill="var(--primary)"
              style={{ font: '700 16px var(--font-body, sans-serif)' }}>손에 쥔 데이터</text>
          </g>
          {[0, 1, 2].map((i) => {
            const pop = spring(t, 4.5 + i * 0.22, 0.8);
            const isChosen = i === 1;
            return (
              <g key={i} opacity={pop} transform={`translate(0 ${(1 - pop) * 14})`}>
                <Lock x={620 + i * 190} y={442} s={1.35} lit={isChosen && chosen > 0.5} />
              </g>
            );
          })}
          <text x={810} y={528} textAnchor="middle" fill="var(--primary)" opacity={chosen}
            style={{ font: '800 17px var(--font-body, sans-serif)' }}>열리는 자물쇠를 고르면 된다</text>

          <text x={600} y={572} textAnchor="middle" fill="var(--fg)" opacity={verdict}
            style={{ font: '800 21px var(--font-body, sans-serif)' }}>
            그래서 오늘 우리는 데이터부터 찾는다
          </text>
        </svg>
      </div>
    </div>
  );
}

/* ══ Slide 6 — 굵기가 다른 체 세 개 ════════════════════════════════════
   metaphor: 굵기가 다른 체 세 개 | emotion: 후련함
   intent: 조건이 '기준'이 아니라 '거르는 장치'임을 보여 미련 없이 버리게 한다 */

const SIEVE_COND = [
  { cond: '행이 30개 이상인가', why: '사례가 여러 개라야 비교가 된다' },
  { cond: '열이 3개 이상인가', why: '속성이 하나뿐이면 할 게 없다' },
  { cond: '내가 직접 열 수 있는가', why: 'CSV, 엑셀, 표만. PDF와 그림은 제외' },
];
const SIEVE_Y = [162, 312, 462];
const STOP_Y = [26, 154, 304, 454, 546];
const SEG_T: [number, number][] = [[0.2, 1.5], [1.7, 3.0], [3.2, 4.5], [4.7, 5.6]];
const PASS = [14, 9, 6, 3]; // 시작 → 체1 → 체2 → 체3 통과 수
const SIEVE_X0 = 96;
const SIEVE_X1 = 740;
const DISH_X = 418;

/* 알을 체 폭 안에 고르게 깔되, 통과하는 알(i가 작은 쪽)과 걸리는 알을
   섞어 배치한다 — 한쪽으로 몰리면 "걸러진다"가 안 읽힌다 */
const BALL_ORDER = [3, 9, 0, 11, 6, 1, 13, 4, 8, 2, 10, 5, 12, 7];
const BALLS = BALL_ORDER.map((i, slot) => ({
  i,
  x: SIEVE_X0 + 44 + slot * ((SIEVE_X1 - SIEVE_X0 - 88) / (PASS[0] - 1)),
}));
/* 살아남는 세 알이 접시에서 겹치지 않게 착지점을 벌린다 */
const DISH_SLOT = [-42, 0, 42];

function SieveScene() {
  const t = useSceneTime();
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ paddingTop: 'clamp(26px, 5vh, 52px)', paddingInline: 'clamp(24px, 6vw, 92px)', textAlign: 'center' }}>
        <h2 className="headline" style={{ marginInline: 'auto', ...kw, ...riseIn(t, 0.1) }}>
          체를 <span className="accent-text">세 번</span> 친다
        </h2>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '2vh' }}>
        <svg viewBox="0 0 1240 620" style={{ width: 'min(1160px, 95vw)', height: 'auto' }} role="img"
          aria-label="데이터 후보 열네 알이 체 세 개를 지나며 걸러져 세 알만 남는다">

          {/* 체 세 개 — 아래로 갈수록 눈이 촘촘하고 깊어진다 */}
          {SIEVE_Y.map((sy, g) => {
            const on = interpolate(t, [SEG_T[g][1] - 0.5, SEG_T[g][1] - 0.1], [0, 1]);
            const step = 44 - g * 14;      // 42 → 30 → 16
            const depth = 11 + g * 5;      // 11 → 16 → 21
            const ticks = Math.floor((SIEVE_X1 - SIEVE_X0) / step) + 1;
            return (
              <g key={sy}>
                <line x1={SIEVE_X0} y1={sy} x2={SIEVE_X1} y2={sy}
                  stroke="var(--primary)" strokeWidth={3.5} strokeLinecap="round" opacity={0.35 + 0.6 * on} />
                {Array.from({ length: ticks }, (_, k) => (
                  <line key={k} x1={SIEVE_X0 + k * step} y1={sy - depth} x2={SIEVE_X0 + k * step} y2={sy}
                    stroke="var(--primary)" strokeWidth={2.2} opacity={0.22 + 0.48 * on} />
                ))}
                {/* 조건 — 체 도형 bbox 밖 오른쪽 (z-order·zone 분리) */}
                <text x={790} y={sy - 4} fill="var(--fg)" opacity={on}
                  style={{ font: '800 19px var(--font-body, sans-serif)' }}>{SIEVE_COND[g].cond}</text>
                <text x={790} y={sy + 22} fill="var(--fg-muted)" opacity={on}
                  style={{ font: '500 15px var(--font-body, sans-serif)' }}>{SIEVE_COND[g].why}</text>
                <text x={SIEVE_X1} y={sy - depth - 10} textAnchor="end" fill="var(--fg-faint)" opacity={on}
                  style={{ font: '600 13.5px var(--font-mono, monospace)' }}>
                  {`${PASS[g] - PASS[g + 1]}개 탈락`}
                </text>
              </g>
            );
          })}

          {/* 접시 */}
          <path d={`M${DISH_X - 120} 560 q120 42 240 0`} fill="none"
            stroke="var(--primary)" strokeWidth={4} strokeLinecap="round"
            opacity={interpolate(t, [5.2, 5.6], [0, 1])} />
          <text x={DISH_X} y={606} textAnchor="middle" fill="var(--primary)"
            opacity={interpolate(t, [5.5, 5.9], [0, 1])}
            style={{ font: '800 17px var(--font-body, sans-serif)' }}>학습지에 적을 셋</text>

          {/* 후보 알 — 자기가 걸리는 체에서 멈춘다 */}
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
            // 마지막 구간에서만 접시로 모이되, 셋이 겹치지 않게 자리를 나눈다
            const gather = survives ? interpolate(t, SEG_T[3], [0, 1], easeInOut) : 0;
            // 통과하지 못한 알은 DISH_SLOT에 자리가 없다 (NaN 방지)
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

/* ── 재사용 조각 ─────────────────────────────────────────────────────── */

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

function SourceLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener"
      style={{
        color: 'var(--primary)', fontWeight: 700, fontSize: 14.5,
        textDecoration: 'underline', textUnderlineOffset: 3, ...kw,
      }}>
      {label} ↗
    </a>
  );
}

/* ── 덱 본체 ─────────────────────────────────────────────────────────── */

export default function DataProblemFindingPlannedDeck() {
  return (
    <Deck>
      {/* S1 — 우측 숫자 블록이 사이드 비주얼. 하드 룰 3 예외로 좌측 비대칭 허용 */}
      <Slide nav="표지"
        notes="오늘 나갈 때 여러분 학습지에 뭐가 적혀 있어야 하냐면, 딱 이 두 숫자입니다.">
        <div style={{
          ...block(1200),
          display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)',
          gap: 'clamp(24px, 5vw, 72px)', alignItems: 'center',
        }}>
          <div>
            <Reveal><div className="kicker">1차시 · 50분</div></Reveal>
            <Reveal delay={0.08}>
              <h1 className="display" style={{
                marginInline: 0, marginTop: 14, maxWidth: 'none',
                fontSize: 'clamp(34px, 4.6vw, 66px)', lineHeight: 1.12, ...kw,
              }}>
                데이터 탐색과<br /><span className="accent-text">문제 발견</span>
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="lead" style={{ marginInline: 0, marginTop: 16, maxWidth: '42ch', ...kw }}>
                오늘 50분이 끝나면 손에 데이터 후보 셋과 문제 문장 아홉이 남습니다.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.24}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { n: '3', unit: '데이터 후보', sub: '세 갈래에서 하나씩', big: false },
                { n: '9', unit: '문제 문장', sub: '데이터마다 세 문장', big: true },
              ].map((x) => (
                <div key={x.n} style={{ ...card, display: 'flex', alignItems: 'baseline', gap: 16 }}>
                  <span style={{
                    ...mono, fontWeight: 800, color: 'var(--primary)', lineHeight: 1,
                    fontSize: x.big ? 'clamp(46px, 6vw, 78px)' : 'clamp(34px, 4.4vw, 56px)',
                  }}>{x.n}</span>
                  <span>
                    <span style={{ display: 'block', fontWeight: 800, fontSize: 'clamp(15px, 1.7vw, 18px)', ...kw }}>{x.unit}</span>
                    <span style={{ display: 'block', color: 'var(--fg-muted)', fontSize: 13.5, marginTop: 2, ...kw }}>{x.sub}</span>
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </Slide>

      {/* S2 — 사이드 비주얼 없음 → 중앙 정렬 (하드 룰 3) */}
      <Slide center nav="학기"
        notes="완성 예시 1~2개를 여기서 30초씩 실제로 띄워 시연할 것. 시연 직후 이 문장을 소리 내어 한 번 박아 둔다. 3차시 명세 활동의 복선이 된다.">
        <Reveal>
          <p style={{
            fontSize: 'clamp(26px, 3.6vw, 50px)', fontWeight: 800, lineHeight: 1.3,
            marginInline: 'auto', maxWidth: '18ch', textAlign: 'center', ...kw,
          }}>
            코드는 AI가 쓴다.<br />
            <span className="accent-text">무엇을 만들지는 여러분이 정한다.</span>
          </p>
        </Reveal>
        <Reveal>
          <p className="lead" style={{ marginInline: 'auto', marginTop: 18, maxWidth: '46ch', textAlign: 'center', ...kw }}>
            한 학기 끝에 각자 자기가 찾은 데이터로 작동하는 웹사이트를 만들어 배포합니다.
          </p>
        </Reveal>
        <Build at={1}>
          <div style={{ ...block(960), marginTop: 'clamp(22px, 3.4vh, 40px)', paddingTop: 18, borderTop: hair, display: 'flex', alignItems: 'stretch' }}>
            {[
              { t: '데이터 찾기', now: true },
              { t: '구조 설계', now: false },
              { t: '명세 쓰기', now: false },
              { t: '만들기', now: false },
              { t: '배포', now: false },
            ].map((s, i) => (
              <div key={s.t} style={{
                flex: s.now ? '1.6 1 0' : '1 1 0', minWidth: 0,
                paddingInline: 'clamp(8px, 1.2vw, 18px)',
                borderLeft: i === 0 ? 'none' : hair,
                textAlign: 'left',
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
      <Slide full nav="원칙"
        notes="작년에도 '나는 환경 문제를 풀겠다' 하고 시작한 팀이 있었어요. 6주 뒤에 데이터가 없어서 처음부터 다시 했습니다. 오늘은 반대로 갑니다.">
        <Scene><LockKeyScene /></Scene>
      </Slide>

      {/* S4 — 헤드라인 아래에 그래픽 → 중앙 정렬 */}
      <Slide nav="세 갈래"
        notes="말로만 하면 대부분 첫 번째 갈래로 몰린다. 다음 장에서 세 갈래를 각각 30초씩 실제로 열어 보여줄 것.">
        <div style={{ ...block(1180), display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.6vh, 20px)' }}>
          <CenterHead kicker="데이터는 어디에 있는가">
            세 갈래를 <span className="accent-text">모두</span> 채운다
          </CenterHead>
          <Reveal><TrackMap /></Reveal>
          <Build at={1}>
            <div className="cols" style={{ gap: 'clamp(10px, 1.6vw, 22px)' }}>
              {TRACKS.map((tr) => (
                <div key={tr.key} style={{ paddingTop: 12, borderTop: hair, textAlign: 'left' }}>
                  <div style={{ fontWeight: 800, fontSize: 14.5, marginBottom: 3, ...kw }}>{tr.key}</div>
                  <div style={{ color: 'var(--fg-muted)', fontSize: 13.5, lineHeight: 1.55, ...kw }}>{tr.weak}</div>
                </div>
              ))}
            </div>
          </Build>
        </div>
      </Slide>

      {/* S5 — 구조 블록 하나 → 중앙 정렬 */}
      <Slide nav="출처"
        notes="여기서 네 사이트를 실제로 30초씩 연다. 학교 안 데이터는 학교 홈페이지를 띄워 '이건 파일이 아니라 표를 옮겨 적어야 한다'를 눈으로 보여준다.">
        <div style={{ ...block(1200), display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 2.2vh, 26px)' }}>
          <CenterHead>지금 바로 열 수 있는 곳</CenterHead>
          <div className="cols" style={{ gap: 'clamp(12px, 1.6vw, 22px)', textAlign: 'left' }}>
            {[
              {
                title: '공개 데이터',
                note: '양은 충분하다. 우리 학교나 우리 지역만 남기면 몇 행이 되는지 확인할 것.',
                items: (
                  <>
                    <SourceLink href="https://www.data.go.kr" label="공공데이터포털" />
                    <SourceLink href="https://kosis.kr" label="국가통계포털 KOSIS" />
                    <SourceLink href="https://www.schoolinfo.go.kr" label="학교알리미" />
                    <SourceLink href="https://data.kma.go.kr" label="기상자료개방포털" />
                  </>
                ),
              },
              {
                title: '학교 안 데이터',
                note: '정리된 파일로 있지는 않다. 표를 직접 옮겨 적어야 하는 경우가 많다.',
                items: ['급식 메뉴 기록', '시간표', '도서 대출 목록', '동아리와 행사 안내', '학교 홈페이지 공지']
                  .map((x) => <span key={x} style={{ fontSize: 14.5, fontWeight: 600, ...kw }}>{x}</span>),
              },
              {
                title: '직접 만드는 데이터',
                note: '아직 없는 데이터다. 오늘은 무엇을 누구에게서 며칠간 모을지만 정한다.',
                items: ['설문', '관찰 기록', '사진 기록', '2주간 자기 기록']
                  .map((x) => <span key={x} style={{ fontSize: 14.5, fontWeight: 600, ...kw }}>{x}</span>),
              },
            ].map((g) => (
              <Reveal key={g.title}>
                <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
                  <div style={{ fontWeight: 800, fontSize: 'clamp(15px, 1.7vw, 18px)', ...kw }}>{g.title}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>{g.items}</div>
                  <div style={{ paddingTop: 10, borderTop: hair, color: 'var(--fg-muted)', fontSize: 13.5, lineHeight: 1.55, ...kw }}>
                    {g.note}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Slide>

      {/* S6 — 씬 */}
      <Slide full nav="조건"
        notes="아까워도 뺍니다. 조건 안 맞는 데이터 붙들고 있다가 3주 뒤에 버리는 게 훨씬 아까워요. 학습지에도 이 세 개가 체크박스로 들어가 있다고 안내.">
        <Scene><SieveScene /></Scene>
      </Slide>

      {/* S7 — 단일 블록 → 중앙 정렬. 블록 안 4:8 비대칭은 유지 */}
      <Slide nav="문장 틀"
        notes="빈칸을 학생들과 함께 소리 내어 채운다. 급식 예시를 먼저 다 채운 뒤 '자, 이제 여러분 데이터로' 하고 넘어간다.">
        <div style={{ ...block(1100), display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 2.6vh, 32px)' }}>
          <CenterHead kicker="데이터에서 문제로">
            틀은 하나, <span className="accent-text">문장은 아홉</span>
          </CenterHead>
          <Reveal>
            <div style={{ ...card, padding: 'clamp(20px, 3vw, 38px)' }}>
              <p style={{ fontSize: 'clamp(17px, 2.2vw, 27px)', fontWeight: 700, lineHeight: 1.85, textAlign: 'center', ...kw }}>
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
                  우리 학교 1년치 급식 메뉴 기록과 잔반량
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

      {/* S8 — 대조 블록 하나 → 블록을 중앙에. 크기 차이가 판정이다 */}
      <Slide nav="대조"
        notes="'조사해서 뭐 할 건데요?'를 스스로에게 물어보세요. 답이 안 나오면 그건 문제가 아니라 숙제입니다.">
        <div style={{ ...block(1140), display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 2.4vh, 28px)' }}>
          <CenterHead>누군가가 덜 힘들어져야 문제다</CenterHead>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: 'clamp(14px, 2vw, 30px)', alignItems: 'stretch', textAlign: 'left' }}>
            <Build at={1} style={{ display: 'flex' }}>
              <div style={{ ...card, flex: 1, display: 'flex', flexDirection: 'column', gap: 10, opacity: 0.72 }}>
                <span style={{ ...mono, fontSize: 12.5, color: 'var(--fg-muted)', letterSpacing: '0.06em' }}>문제가 아니다</span>
                <p style={{ fontSize: 'clamp(15px, 1.8vw, 19px)', fontWeight: 700, lineHeight: 1.6, ...kw }}>
                  “급식 만족도를 조사한다”
                </p>
                <p style={{ color: 'var(--fg-muted)', fontSize: 13.5, lineHeight: 1.6, marginTop: 'auto', ...kw }}>
                  조사에서 끝난다. 결과가 나와도 아무도 덜 힘들어지지 않는다.
                </p>
              </div>
            </Build>
            <Build at={2} style={{ display: 'flex' }}>
              <div style={{
                ...card, flex: 1, display: 'flex', flexDirection: 'column', gap: 10,
                borderColor: 'color-mix(in srgb, var(--primary) 45%, transparent)',
                background: 'color-mix(in srgb, var(--primary) 9%, var(--surface))',
              }}>
                <span style={{ ...mono, fontSize: 12.5, color: 'var(--primary)', letterSpacing: '0.06em' }}>문제다</span>
                <p style={{ fontSize: 'clamp(16px, 2vw, 22px)', fontWeight: 800, lineHeight: 1.6, ...kw }}>
                  “영양사 선생님은 어떤 메뉴가 남을지를 몰라서 곤란하다”
                </p>
                <p style={{ color: 'var(--fg-muted)', fontSize: 14, lineHeight: 1.6, marginTop: 'auto', ...kw }}>
                  곤란한 사람이 있고, 데이터가 그 곤란을 줄인다. 그래서 만들 것이 생긴다.
                </p>
              </div>
            </Build>
          </div>
        </div>
      </Slide>

      {/* S9 — live 자리. quiz.json 미작성이므로 진행 안내만 (사용자 선택 "덱만 먼저") */}
      <Slide center nav="체크포인트"
        notes="시간이 밀리면 통째로 생략한다. 명세의 50분 배분에 없는 보충 장이다. 문항은 quiz.json 미작성 — live-quiz-builder로 붙일 자리다.">
        <Reveal>
          <div className="kicker" style={{ textAlign: 'center' }}>선택 · 2분</div>
          <h2 className="headline" style={{ marginInline: 'auto', marginTop: 10, textAlign: 'center', ...kw }}>
            다음 넷 중 <span className="accent-text">문제 문장</span>인 것은?
          </h2>
        </Reveal>
        <Build at={1}>
          <div style={{ ...block(760), marginTop: 'clamp(20px, 3vh, 34px)', display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            {[
              '우리 학교 도서 대출 현황을 조사한다',
              '사서 선생님은 어떤 책을 더 들여야 할지 몰라서 고민인데, 대출 기록이 있으면 학년별로 안 나가는 분야를 알 수 있다',
              '도서관 이용률을 그래프로 그린다',
              '학생들의 독서 습관을 분석한다',
            ].map((c, i) => (
              <div key={c} style={{
                display: 'flex', gap: 14, alignItems: 'baseline',
                paddingBlock: 'clamp(10px, 1.5vh, 15px)',
                borderTop: i === 0 ? 'none' : hair,
              }}>
                <span style={{ ...mono, flex: 'none', fontWeight: 800, color: 'var(--primary)', fontSize: 14 }}>{i + 1}</span>
                <span style={{ fontSize: 'clamp(14px, 1.6vw, 17px)', lineHeight: 1.6, ...kw }}>{c}</span>
              </div>
            ))}
          </div>
        </Build>
      </Slide>

      {/* S10 — 세로 스택 → 중앙 정렬. 좌측 여백 계단으로 균등 스택을 깬다 */}
      <Slide nav="실수"
        notes="명세의 '예상 문제와 대응' 학생용 전환. AI 사용을 막지 말고 조건을 붙인다는 점을 분명히 말할 것. 학교 안 데이터 예비 카드(도서 대출 목록·시간표·동아리 명단 등 5~6개)를 손에 들고 있다가 막힌 학생에게 준다.">
        <div style={{ ...block(1020), display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 2.4vh, 28px)' }}>
          <CenterHead>이렇게 하면 <span className="accent-text">15분</span>을 날린다</CenterHead>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 1.8vh, 20px)', textAlign: 'left' }}>
            {[
              { sym: '거대한 국가 통계표를 그대로 가져오기', res: '행은 많은데 나와 무관해 문장이 안 나온다', fix: '우리 학교와 우리 지역만 남기면 몇 행인지 세어 볼 것', pad: 0 },
              { sym: 'AI가 알려준 데이터를 그대로 적기', res: '없는 데이터셋을 적어 오게 된다', fix: '실제 URL을 열어 파일을 확인한 것만 학습지에 적는다', pad: 26 },
              { sym: '파일을 안 열고 제목만 보고 적기', res: '2차시 구조 설계에서 그대로 막힌다', fix: '그래서 학습지에 열 이름 세 개를 적게 되어 있다', pad: 52 },
            ].map((x, i) => (
              <Build key={x.sym} at={i + 1}>
                <div style={{ paddingLeft: x.pad, display: 'flex', gap: 'clamp(12px, 1.6vw, 18px)' }}>
                  <span style={{ flex: 'none', width: 3, borderRadius: 2, background: 'var(--primary)', opacity: 0.75 }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 'clamp(15px, 1.8vw, 19px)', ...kw }}>{x.sym}</div>
                    <div style={{ color: 'var(--fg-muted)', fontSize: 'clamp(13.5px, 1.5vw, 15.5px)', lineHeight: 1.6, marginTop: 3, ...kw }}>
                      {x.res}
                    </div>
                    <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 'clamp(13.5px, 1.5vw, 15.5px)', lineHeight: 1.6, marginTop: 4, ...kw }}>
                      {x.fix}
                    </div>
                  </div>
                </div>
              </Build>
            ))}
          </div>
        </div>
      </Slide>

      {/* S11 — 실습 중 계속 띄워 둘 장. 중앙 정렬 */}
      <Slide nav="찾기 15분"
        notes="15분 타이머를 띄워 둔다. 10분 안에 '찾을 게 없어요'가 나오면 예비 카드를 준다. 순회하며 한 갈래에만 몰린 학생을 먼저 잡는다.">
        <div style={{ ...block(1180), display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 2.2vh, 26px)' }}>
          <Reveal>
            <div style={{ textAlign: 'center' }}>
              <h2 className="headline" style={{ marginInline: 'auto', ...kw }}>
                데이터 찾기 <span className="accent-text">15분</span>
              </h2>
              <p className="lead" style={{ marginInline: 'auto', marginTop: 8, maxWidth: '48ch', ...kw }}>
                세 갈래에서 각각 최소 하나씩, 모두 세 개를 학습지에 적습니다.
              </p>
            </div>
          </Reveal>
          <Reveal>
            <div className="cols" style={{ gap: 'clamp(10px, 1.4vw, 18px)', textAlign: 'left' }}>
              {[
                { k: '데이터 이름', d: '무엇을 담고 있는지 알 수 있게' },
                { k: '출처', d: 'URL 또는 어디에 있는지' },
                { k: '형태', d: 'CSV, 엑셀, 웹페이지, 직접수집' },
                { k: '행 수와 열 수', d: '실제로 열어서 센 숫자' },
                { k: '열 이름 세 개 이상', d: '파일을 열지 않으면 못 적는다', on: true },
                { k: '조건 체크 셋', d: '체 세 개를 통과했는가' },
              ].map((x) => (
                <div key={x.k} style={{
                  ...card,
                  ...(x.on ? {
                    borderColor: 'color-mix(in srgb, var(--primary) 45%, transparent)',
                    background: 'color-mix(in srgb, var(--primary) 9%, var(--surface))',
                  } : null),
                }}>
                  <div style={{ fontWeight: 800, fontSize: 'clamp(14px, 1.6vw, 17px)', ...kw }}>{x.k}</div>
                  <p style={{ color: 'var(--fg-muted)', fontSize: 13.5, lineHeight: 1.55, marginTop: 4, ...kw }}>{x.d}</p>
                </div>
              ))}
            </div>
          </Reveal>
          <Build at={1}>
            <p style={{ color: 'var(--fg-muted)', fontSize: 'clamp(13.5px, 1.5vw, 16px)', lineHeight: 1.65, marginInline: 'auto', maxWidth: '64ch', textAlign: 'center', ...kw }}>
              직접 만드는 데이터는 아직 없으니, 대신 어떤 항목을 누구에게서 며칠간 모을 것인지를 적습니다.
            </p>
          </Build>
        </div>
      </Slide>

      {/* S12 — 헤드라인 아래 트리 → 중앙 정렬 */}
      <Slide nav="쓰기 10분"
        notes="같은 데이터인데 사람을 바꾸면 문장이 통째로 바뀝니다. 이게 문제 후보를 아홉 개나 만드는 이유예요.">
        <div style={{ ...block(1160), display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 2.2vh, 26px)' }}>
          <CenterHead kicker="문장 쓰기 · 10분">
            같은 데이터, <span className="accent-text">다른 사람</span>
          </CenterHead>
          <Reveal>
            <p className="lead" style={{ marginInline: 'auto', maxWidth: '52ch', textAlign: 'center', ...kw }}>
              데이터 하나에 세 문장씩 씁니다. 문장 안의 ‘누가’는 매번 달라야 합니다.
            </p>
          </Reveal>
          <Build at={1}>
            <svg viewBox="0 0 1140 330" style={{ width: '100%', height: 'auto' }} role="img"
              aria-label="데이터 하나에서 수혜자 셋으로 갈라지는 분기 — 영양사, 학생회, 행정실">
              <rect x={8} y={124} width={286} height={82} rx={14}
                fill="color-mix(in srgb, var(--primary) 11%, var(--surface))"
                stroke="color-mix(in srgb, var(--primary) 45%, transparent)" strokeWidth={1.5} />
              <text x={151} y={155} textAnchor="middle" fill="var(--fg-muted)"
                style={{ font: '500 14px var(--font-mono, monospace)' }}>데이터 하나</text>
              <text x={151} y={184} textAnchor="middle" fill="var(--fg)"
                style={{ font: '800 20px var(--font-body, sans-serif)' }}>급식 메뉴와 잔반량</text>
              {[
                { who: '영양사 선생님', what: '어떤 메뉴가 남을지 미리 안다', y: 52 },
                { who: '학생회', what: '어떤 메뉴를 건의할지 근거를 얻는다', y: 165 },
                { who: '행정실', what: '식자재 발주량을 줄일 근거를 얻는다', y: 278 },
              ].map((x) => (
                <g key={x.who}>
                  {/* 선은 도형 가장자리에서 출발해 가장자리로 (레이아웃 계약 d) */}
                  <path d={`M294 165 C 400 165, 420 ${x.y} 520 ${x.y}`}
                    fill="none" stroke="var(--primary)" strokeWidth={2.5} opacity={0.6} />
                  <circle cx={520} cy={x.y} r={7} fill="var(--primary)" />
                  <text x={548} y={x.y - 4} fill="var(--primary)"
                    style={{ font: '800 21px var(--font-body, sans-serif)' }}>{x.who}</text>
                  <text x={548} y={x.y + 24} fill="var(--fg-muted)"
                    style={{ font: '500 16px var(--font-body, sans-serif)' }}>{x.what}</text>
                </g>
              ))}
            </svg>
          </Build>
          <Build at={2}>
            <p style={{ color: 'var(--fg-muted)', fontSize: 'clamp(13.5px, 1.5vw, 16px)', marginInline: 'auto', maxWidth: '58ch', textAlign: 'center', ...kw }}>
              데이터 셋에 각각 세 문장이면 아홉 문장입니다. 다 채우고 나서 고릅니다.
            </p>
          </Build>
        </div>
      </Slide>

      {/* S13 — 우측 제출 블록이 사이드 비주얼. 좌측 비대칭 허용.
              활동지 HTML은 미제작(사용자 선택 "덱만 먼저") — 자리만 둔다 */}
      <Slide nav="학습지"
        notes="종이 학습지를 병행한다면 화면은 제출 창구로만 쓴다. 활동지 HTML은 activity-sheet-builder로 별도 제작 예정 — 시트에 쌓인 응답을 2차시 도입에서 그대로 띄운다고 미리 말해 두면 성의가 올라간다.">
        <div style={{
          ...block(1120),
          display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)',
          gap: 'clamp(24px, 4vw, 60px)', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Reveal>
              {/* "다음 주"가 줄바꿈에 갈리던 것을 명시 개행으로 고정 */}
              <h2 className="headline" style={{ marginInline: 0, ...kw }}>
                여기에 적힌 것이<br /><span className="accent-text">다음 주 출발점</span>
              </h2>
            </Reveal>
            <Reveal>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[
                  ['데이터 후보 3칸', '갈래별로 고정 — 공개 / 학교 안 / 직접 만드는'],
                  ['칸마다', '이름, 출처, 형태, 행 수, 열 수, 열 이름 셋, 조건 체크 셋'],
                  ['문제 문장 9칸', '데이터당 셋. 수혜자 칸이 따로 있다'],
                ].map(([k, v], i) => (
                  <div key={k} style={{
                    display: 'flex', gap: 14, alignItems: 'baseline',
                    paddingBlock: 10, borderTop: i === 0 ? 'none' : hair,
                  }}>
                    <span style={{ ...mono, flex: 'none', fontSize: 12, fontWeight: 800, color: 'var(--primary)', width: 104 }}>{k}</span>
                    <span style={{ color: 'var(--fg-muted)', fontSize: 14.5, ...kw }}>{v}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
          <Reveal>
            <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: 'clamp(22px, 3vh, 34px)', textAlign: 'center' }}>
              <div style={{
                width: 'min(200px, 52vw)', aspectRatio: '1', borderRadius: 'var(--radius)',
                border: `2px dashed color-mix(in srgb, var(--primary) 50%, transparent)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--fg-muted)', fontSize: 13.5, lineHeight: 1.6, padding: 16, ...kw,
              }}>
                활동지 QR 자리
              </div>
              <span style={{ color: 'var(--fg-muted)', fontSize: 13.5, lineHeight: 1.6, ...kw }}>
                제출한 내용은 시트에 쌓여 2차시 도입에서 그대로 열립니다.
              </span>
            </div>
          </Reveal>
        </div>
      </Slide>

      {/* S14 — 오른쪽 칸이 텍스트라 사이드 비주얼이 아니다 → 중앙 정렬 */}
      <Slide center nav="정리"
        notes="발표를 평가하지 않는다. '그 데이터 어디서 찾았어?'만 묻는다. 다른 학생의 탐색 경로가 공유되는 것이 이 5분의 목적이다. 평가 체크포인트 셋: ① 세 갈래를 모두 채웠는가 ② 열 이름을 구체적으로 적었는가 ③ 문제 문장에 수혜자가 명시되어 있는가.">
        <Reveal>
          <h2 className="headline" style={{ marginInline: 'auto', textAlign: 'center', ...kw }}>
            아홉에서 <span className="accent-text">셋으로</span>
          </h2>
        </Reveal>
        <Reveal>
          <p style={{
            marginInline: 'auto', marginTop: 16, maxWidth: '30ch', textAlign: 'center',
            fontSize: 'clamp(17px, 2.2vw, 26px)', fontWeight: 800, lineHeight: 1.55, ...kw,
          }}>
            재미가 아니라, 이 데이터를 다음 주까지<br />
            <span className="accent-text">실제로 손에 넣을 수 있는가.</span>
          </p>
        </Reveal>
        <Build at={1}>
          <div style={{ ...block(820), marginTop: 'clamp(24px, 3.6vh, 42px)', paddingTop: 20, borderTop: hair, display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            {[
              { t: '짝에게 한 문장', d: '아홉 개 중 가장 마음에 드는 것 하나만' },
              { t: '서로에게 묻기', d: '“그 데이터 어디서 찾았어?”' },
              { t: '다음 주까지', d: '표시한 문제 문장 세 개' },
            ].map((x, i) => (
              <div key={x.t} style={{
                display: 'grid', gridTemplateColumns: '150px minmax(0, 1fr)', gap: 16,
                alignItems: 'baseline', paddingBlock: 12, borderTop: i === 0 ? 'none' : hair,
              }}>
                <span style={{ fontWeight: 800, fontSize: 'clamp(14.5px, 1.7vw, 17px)', ...kw }}>{x.t}</span>
                <span style={{ color: 'var(--fg-muted)', fontSize: 'clamp(13.5px, 1.5vw, 16px)', lineHeight: 1.6, ...kw }}>{x.d}</span>
              </div>
            ))}
          </div>
        </Build>
      </Slide>
    </Deck>
  );
}

/* ── Slide 4 좌표맵 — 세 갈래를 카드가 아니라 좌표로 (9.C 등폭 카드 회피) ── */
const TRACKS = [
  { key: '공개 데이터', x: 250, y: 132, r: 96, note: '바로 받을 수 있다', weak: '나와 멀어서 문제가 잘 안 보인다' },
  { key: '학교 안 데이터', x: 588, y: 250, r: 108, note: '문제가 잘 보인다', weak: '정리되지 않은 형태로 흩어져 있다' },
  { key: '직접 만드는 데이터', x: 920, y: 366, r: 92, note: '세상에 없던 것이다', weak: '모으는 데 시간이 든다' },
] as const;

function TrackMap() {
  const AX = 118;
  const AY = 470;
  return (
    /* 상단 여백을 비워 축 라벨이 헤드라인 밴드를 침범하지 않게 한다 (계약 a) */
    <svg viewBox="0 0 1140 516" style={{ width: '100%', height: 'auto' }} role="img"
      aria-label="데이터 세 갈래 좌표 — 가로축은 나와의 거리, 세로축은 이미 정리된 정도">
      <line x1={AX} y1={AY} x2={1092} y2={AY} stroke="var(--fg-muted)" strokeWidth={2} opacity={0.5} strokeLinecap="round" />
      <line x1={AX} y1={AY} x2={AX} y2={46} stroke="var(--fg-muted)" strokeWidth={2} opacity={0.5} strokeLinecap="round" />
      <text x={AX} y={502} fill="var(--fg-muted)" style={{ font: '500 15px var(--font-body, sans-serif)' }}>나와 멀다</text>
      <text x={1092} y={502} textAnchor="end" fill="var(--fg-muted)" style={{ font: '500 15px var(--font-body, sans-serif)' }}>나와 가깝다</text>
      <text x={AX - 18} y={52} fill="var(--fg-muted)"
        style={{ font: '500 15px var(--font-body, sans-serif)', writingMode: 'vertical-rl' }}>이미 정리됨</text>
      <text x={AX - 18} y={AY - 104} fill="var(--fg-muted)"
        style={{ font: '500 15px var(--font-body, sans-serif)', writingMode: 'vertical-rl' }}>아직 날것</text>

      {/* 흐름선을 먼저 깔아 원이 위에 오게 한다 (z-order) */}
      <path d={`M${TRACKS[0].x + 72} ${TRACKS[0].y + 66} Q ${TRACKS[1].x - 96} ${TRACKS[1].y - 40} ${TRACKS[1].x - 84} ${TRACKS[1].y - 66}`}
        fill="none" stroke="var(--primary)" strokeWidth={2} strokeDasharray="7 7" opacity={0.45} />
      <path d={`M${TRACKS[1].x + 84} ${TRACKS[1].y + 66} Q ${TRACKS[2].x - 96} ${TRACKS[2].y - 40} ${TRACKS[2].x - 74} ${TRACKS[2].y - 60}`}
        fill="none" stroke="var(--primary)" strokeWidth={2} strokeDasharray="7 7" opacity={0.45} />

      {TRACKS.map((tr) => (
        <g key={tr.key}>
          <circle cx={tr.x} cy={tr.y} r={tr.r}
            fill="color-mix(in srgb, var(--primary) 13%, var(--bg))"
            stroke="var(--primary)" strokeWidth={2} />
          <text x={tr.x} y={tr.y - 4} textAnchor="middle" fill="var(--fg)"
            style={{ font: '800 18px var(--font-body, sans-serif)' }}>{tr.key}</text>
          <text x={tr.x} y={tr.y + 22} textAnchor="middle" fill="var(--fg-muted)"
            style={{ font: '500 14px var(--font-body, sans-serif)' }}>{tr.note}</text>
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
