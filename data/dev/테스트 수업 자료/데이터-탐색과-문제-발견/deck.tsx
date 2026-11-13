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

/* ── 1차시 · 데이터 탐색과 문제 발견 (11장) ────────────────────────────
   규칙: .claude/rules/vendor/taste-skill-core.md (Leonxlnx/taste-skill, MIT) 원문만 적용.

   Design Read — 고등학교 1차시 실습 워크숍 덱 for 데이터 프로젝트 입문 학생,
   instructional-workshop 언어, bolt 엔진 + 단일 액센트 + 절제된 모션.
   Dials — DESIGN_VARIANCE 7 / MOTION_INTENSITY 4 / VISUAL_DENSITY 4

   규칙 적용 메모
   1     다이얼 근거: 실습 지시가 화면에 남아야 해 밀도 4, 모션은 의미를 나르는 S3에만
   4.2   액센트 1색(electric blue) + 중립. 세 갈래는 색이 아니라 위치와 크기로 구분
   4.3   중앙 정렬 히어로 금지 (VARIANCE > 4)
   4.4   corner radius 상수 하나
   4.7   키커 ≤ ceil(11/3) = 4개, S1·S4·S7·S10에만. 연속 배치 없음
   4.7   레이아웃 패밀리 11장 전부 다름 (커버·타이포·씬·좌표맵·그룹목록·관문·
         폼·대조·기록표·분기트리·마무리)
   4.9   헤드라인 8단어 이내, 본문 25단어 이내
   5     MOTION MUST BE MOTIVATED: 씬은 S3 한 장. 실패 경로를 보여주는 것이 메시지
   9.C   3열 등폭 카드 금지 (세 갈래를 카드 3장으로 늘어놓지 않는다)
   9.D   지어낸 수치 금지. 화면의 출처는 전부 실제 URL
   9.F   "단계 1 / Step 1" 형 번호 라벨 금지. 시간과 내용이 라벨이다
   9.F   장식용 색점 금지, 중점 한 줄 1개
   9.G   화면 텍스트에 엠대시 0개 */

const R = 14; // 4.4 SHAPE CONSISTENCY LOCK
const kw: CSSProperties = { wordBreak: 'keep-all' };

const card: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: R,
  padding: 'clamp(16px, 2vw, 26px)',
};

/* 다크 배경에서 var(--line)은 카드 밖에서 사라진다 (첫 픽셀 검수에서 확인) */
const hair = '1px solid color-mix(in srgb, var(--fg) 16%, transparent)';

const mono: CSSProperties = { fontFamily: 'var(--font-mono, monospace)' };

/* ── S3 오늘의 원칙: 두 경로 (t 타임라인) ──────────────────────────────
   위 경로는 문제에서 출발해 데이터를 못 찾고 벽에 막힌다.
   아래 경로는 데이터에서 출발해 문제로 열린다. 모션이 곧 메시지다. */
function TwoRoutesScene() {
  const t = useSceneTime();
  const deadRun = interpolate(t, [0.6, 2.0], [0, 1], easeOut);
  const hitWall = interpolate(t, [1.9, 2.2], [0, 1]);
  const shake = hitWall * Math.max(0, 1 - (t - 2.0) * 2.2) * Math.sin(t * 46) * 7;
  const openRun = interpolate(t, [2.8, 4.6], [0, 1], easeInOut);
  const verdict = interpolate(t, [4.8, 5.4], [0, 1]);

  const X0 = 210;      // 출발
  const XW = 800;      // 벽 / 문 위치
  const XEND = 1090;   // 통과한 경로의 도착
  const deadX = X0 + (XW - 40 - X0) * deadRun;
  const openX = X0 + (XEND - X0) * openRun;

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ paddingTop: 'clamp(34px, 7vh, 72px)', paddingInline: 'clamp(24px, 6vw, 92px)' }}>
        {/* maxWidth를 풀어 한 줄로 앉힌다 (.headline 기본 max-width가 2줄로 접었다) */}
        <h2 className="headline" style={{ margin: 0, maxWidth: 'none', ...kw, ...riseIn(t, 0.1) }}>
          오늘은 <span className="accent-text">문제부터</span> 정하지 않는다
        </h2>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '2vh' }}>
        <svg viewBox="0 0 1200 512" style={{ width: 'min(1140px, 95vw)', height: 'auto', overflow: 'visible' }}
          role="img" aria-label="두 경로 비교 — 문제에서 출발하면 데이터가 없어 막히고, 데이터에서 출발하면 문제로 열린다">

          {/* ── 위: 막히는 경로 ── */}
          <text x={X0} y={54} fill="var(--fg-muted)" style={{ font: '800 20px var(--font-body, sans-serif)' }}>
            문제를 먼저 정하면
          </text>
          <circle cx={X0 - 34} cy={125} r={14} fill="none" stroke="var(--fg-muted)" strokeWidth={2.5} opacity={0.7} />
          <line x1={X0} y1={125} x2={deadX} y2={125}
            stroke="var(--fg-muted)" strokeWidth={4} strokeLinecap="round" opacity={0.7} />
          <g transform={`translate(${deadX + shake} 125)`} opacity={deadRun > 0.02 ? 1 : 0}>
            <circle r={14} fill="var(--fg-muted)" opacity={0.95} />
          </g>
          {/* 벽 — 빗금 친 두꺼운 막 */}
          <g opacity={interpolate(t, [0.3, 0.7], [0, 1])}>
            <rect x={XW - 14} y={52} width={28} height={146} rx={4}
              fill="color-mix(in srgb, var(--fg-muted) 30%, transparent)"
              stroke="var(--fg-muted)" strokeWidth={2.5} />
            {[0, 1, 2, 3, 4].map((i) => (
              <line key={i} x1={XW - 14} y1={62 + i * 32} x2={XW + 14} y2={82 + i * 32}
                stroke="var(--fg-muted)" strokeWidth={2} opacity={0.8} />
            ))}
          </g>
          {/* 충돌 파편 */}
          <g opacity={hitWall * Math.max(0, 1 - (t - 2.05) * 1.6)}>
            {[-30, -10, 12, 32].map((a, i) => (
              <line key={a} x1={XW - 42} y1={125} x2={XW - 42 - 26} y2={125 + a}
                stroke="var(--fg-muted)" strokeWidth={3} strokeLinecap="round" opacity={0.9 - i * 0.12} />
            ))}
          </g>
          <text x={XW + 34} y={110} fill="var(--fg-muted)" opacity={interpolate(t, [2.1, 2.5], [0, 1])}
            style={{ font: '800 19px var(--font-body, sans-serif)' }}>
            풀 데이터가 없다
          </text>
          <text x={XW + 34} y={140} fill="var(--fg-faint)" opacity={interpolate(t, [2.3, 2.7], [0, 1])}
            style={{ font: '500 16px var(--font-body, sans-serif)' }}>
            학기 중반에 멈춘다
          </text>

          <line x1={90} y1={240} x2={1160} y2={240} stroke="var(--line)" strokeWidth={1} opacity={0.7} />

          {/* ── 아래: 열리는 경로 ── */}
          <text x={X0} y={296} fill="var(--primary)" opacity={interpolate(t, [2.6, 3.0], [0, 1])}
            style={{ font: '800 20px var(--font-body, sans-serif)' }}>
            데이터에서 출발하면
          </text>
          {/* 문설주 — 사이가 비어 있어 경로가 통과한다 */}
          <g opacity={interpolate(t, [2.6, 3.0], [0, 1])}>
            <rect x={XW - 8} y={296} width={16} height={54} rx={4} fill="var(--primary)" opacity={0.85} />
            <rect x={XW - 8} y={402} width={16} height={54} rx={4} fill="var(--primary)" opacity={0.85} />
          </g>
          <circle cx={X0 - 34} cy={376} r={14} fill="var(--primary)" opacity={interpolate(t, [2.6, 3.0], [0, 0.9])} />
          <line x1={X0} y1={376} x2={openX} y2={376}
            stroke="var(--primary)" strokeWidth={4.5} strokeLinecap="round" />
          <g transform={`translate(${openX} 376)`} opacity={openRun > 0.02 ? 1 : 0}>
            <circle r={15} fill="var(--primary)" />
          </g>
          <text x={XEND + 4} y={344} fill="var(--primary)" opacity={interpolate(t, [4.4, 4.8], [0, 1])}
            textAnchor="end" style={{ font: '800 19px var(--font-body, sans-serif)' }}>
            문제로 열린다
          </text>
          <text x={X0} y={438} fill="var(--fg-muted)" opacity={interpolate(t, [3.2, 3.6], [0, 1])}
            style={{ font: '500 16px var(--font-body, sans-serif)' }}>
            손에 있는 것에서 시작한다
          </text>

          {/* 결론 — 두 경로 아래 중앙 */}
          <text x={(X0 + XEND) / 2} y={500} textAnchor="middle" fill="var(--fg)" opacity={verdict}
            style={{ font: '800 22px var(--font-body, sans-serif)' }}>
            그래서 오늘 우리는 데이터부터 찾는다
          </text>
        </svg>
      </div>
    </div>
  );
}

/* ── S4 세 갈래 좌표맵: 색이 아니라 위치와 크기로 구분한다 (4.2) ── */
const TRACKS = [
  {
    key: '공개 데이터',
    x: 250, y: 132, r: 96,
    note: '바로 받을 수 있다',
    weak: '나와 멀어서 문제가 잘 안 보인다',
  },
  {
    key: '학교 안 데이터',
    x: 588, y: 250, r: 104,
    note: '문제가 잘 보인다',
    weak: '정리되지 않은 형태로 흩어져 있다',
  },
  {
    key: '직접 만드는 데이터',
    x: 920, y: 366, r: 92,
    note: '세상에 없던 것이다',
    weak: '모으는 데 시간이 든다',
  },
] as const;

function TrackMap() {
  const AX = 118;   // y축
  const AY = 470;   // x축
  return (
    /* 상단 여백 40을 비워 헤드라인 밴드와 축 라벨이 겹치지 않게 한다
       (scene-grammar 레이아웃 계약 (a) zone 분리) */
    <svg viewBox="0 0 1140 516" style={{ width: '100%', height: 'auto' }} role="img"
      aria-label="데이터 세 갈래 좌표 — 가로축은 나와의 거리, 세로축은 이미 정리된 정도">
      <line x1={AX} y1={AY} x2={1092} y2={AY} stroke="var(--fg-muted)" strokeWidth={2} opacity={0.5} strokeLinecap="round" />
      <line x1={AX} y1={AY} x2={AX} y2={46} stroke="var(--fg-muted)" strokeWidth={2} opacity={0.5} strokeLinecap="round" />
      <text x={AX} y={502} fill="var(--fg-muted)" style={{ font: '500 15px var(--font-body, sans-serif)' }}>나와 멀다</text>
      <text x={1092} y={502} textAnchor="end" fill="var(--fg-muted)" style={{ font: '500 15px var(--font-body, sans-serif)' }}>나와 가깝다</text>
      <text x={AX - 18} y={52} textAnchor="start" fill="var(--fg-muted)"
        style={{ font: '500 15px var(--font-body, sans-serif)', writingMode: 'vertical-rl' }}>이미 정리됨</text>
      <text x={AX - 18} y={AY - 104} textAnchor="start" fill="var(--fg-muted)"
        style={{ font: '500 15px var(--font-body, sans-serif)', writingMode: 'vertical-rl' }}>아직 날것</text>

      {/* 흐름선을 먼저 깔아 원이 위에 오게 한다 (z-order) */}
      <path d={`M${TRACKS[0].x + 72} ${TRACKS[0].y + 66} Q ${TRACKS[1].x - 96} ${TRACKS[1].y - 40} ${TRACKS[1].x - 80} ${TRACKS[1].y - 62}`}
        fill="none" stroke="var(--primary)" strokeWidth={2} strokeDasharray="7 7" opacity={0.45} />
      <path d={`M${TRACKS[1].x + 80} ${TRACKS[1].y + 62} Q ${TRACKS[2].x - 96} ${TRACKS[2].y - 40} ${TRACKS[2].x - 74} ${TRACKS[2].y - 60}`}
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

/* ── S6 관문: 데이터 후보가 세 관문을 지나며 걸러진다 ── */
const GATE_X = [318, 604, 890];
const SURVIVORS = [14, 9, 6, 3]; // 시작 → 관문1 → 관문2 → 관문3 통과

const MID = 168; // 통로 중심선

function GateFunnel() {
  const col = (n: number, cx: number, lit: boolean) =>
    Array.from({ length: n }, (_, i) => {
      const rows = Math.ceil(n / 2);
      const c = i % 2;
      const r = Math.floor(i / 2);
      return (
        <circle key={i}
          cx={cx + (c - 0.5) * 28}
          cy={MID - (rows - 1) * 14 + r * 28}
          r={7.5}
          fill={lit ? 'var(--primary)' : 'var(--fg-muted)'}
          opacity={lit ? 0.95 : 0.45} />
      );
    });
  return (
    <svg viewBox="0 0 1120 396" style={{ width: '100%', height: 'auto' }} role="img"
      aria-label="데이터 후보 열네 개가 세 관문을 지나 세 개만 남는다">
      {col(SURVIVORS[0], 74, false)}
      <text x={74} y={330} textAnchor="middle" fill="var(--fg-muted)"
        style={{ font: '700 14px var(--font-body, sans-serif)' }}>찾아온 후보</text>

      {GATE_X.map((gx, i) => {
        const gap = 50 - i * 7;
        return (
          <g key={gx}>
            {/* 관문 — 위아래 기둥 사이가 통로다 */}
            <rect x={gx - 7} y={38} width={14} height={MID - gap - 38} rx={4} fill="var(--primary)" opacity={0.9} />
            <rect x={gx - 7} y={MID + gap} width={14} height={MID - gap - 38} rx={4} fill="var(--primary)" opacity={0.9} />
            {/* 통과한 후보 */}
            {col(SURVIVORS[i + 1], gx + 100, true)}
            {/* 조건 — 관문 바로 아래, 도형 bbox 밖 */}
            <text x={gx} y={330} textAnchor="middle" fill="var(--fg)"
              style={{ font: '800 16px var(--font-body, sans-serif)' }}>{GATES[i].cond}</text>
            <text x={gx} y={356} textAnchor="middle" fill="var(--fg-muted)"
              style={{ font: '500 13.5px var(--font-body, sans-serif)' }}>{GATES[i].why}</text>
            <text x={gx} y={26} textAnchor="middle" fill="var(--fg-faint)"
              style={{ font: '500 13px var(--font-body, sans-serif)' }}>
              {`${SURVIVORS[i] - SURVIVORS[i + 1]}개 탈락`}
            </text>
          </g>
        );
      })}
      {/* 마지막 관문을 통과한 무리 오른쪽에 붙인다 — 3번 조건 텍스트와 겹치던 것을 옮김 */}
      <text x={1024} y={MID + 6} fill="var(--primary)"
        style={{ font: '800 16px var(--font-body, sans-serif)' }}>남은 셋</text>
    </svg>
  );
}

/* ── S6 통과 조건: 관문 세 개 ── */
const GATES = [
  { cond: '행이 30개 이상인가', why: '사례가 여러 개라야 비교가 된다' },
  { cond: '열이 3개 이상인가', why: '속성이 하나뿐이면 할 게 없다' },
  { cond: '내가 직접 열 수 있는가', why: 'CSV, 엑셀, 표만. PDF와 그림은 제외' },
];

function SourceGroup({ title, items, note }: { title: string; items: ReactNode; note: string }) {
  return (
    <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      <div style={{ fontWeight: 800, fontSize: 'clamp(15px, 1.7vw, 18px)', ...kw }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>{items}</div>
      <div style={{ paddingTop: 10, borderTop: hair, color: 'var(--fg-muted)', fontSize: 13.5, lineHeight: 1.55, ...kw }}>
        {note}
      </div>
    </div>
  );
}

function SourceLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener"
      style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 14.5, textDecoration: 'none', ...kw }}>
      {label} ↗
    </a>
  );
}

/* ── 덱 본체 ── */
export default function DataProblemFindingDeck() {
  return (
    <Deck>
      {/* S1 표지 — 좌측 비대칭 (4.3). 히어로 텍스트 3요소 (4.7) */}
      <Slide
        nav="표지"
        notes="이 과목은 한 학기 동안 각자 자기가 찾은 데이터로 작동하는 웹사이트를 만들어 배포하는 수업입니다. 오늘은 그 첫 걸음으로 데이터를 찾습니다.">
        <div style={{
          width: 'min(1240px, 100%)', marginInline: 'auto',
          display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)',
          gap: 'clamp(24px, 5vw, 72px)', alignItems: 'center',
        }}>
          <div>
            <Reveal>
              {/* 키커 1/4 */}
              <div className="kicker">1차시 · 50분</div>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="display" style={{
                marginInline: 0, marginTop: 14, maxWidth: 'none',
                fontSize: 'clamp(34px, 4.6vw, 66px)', lineHeight: 1.12, ...kw,
              }}>
                데이터 탐색과<br /><span className="accent-text">문제 발견</span>
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="lead" style={{ marginInline: 0, marginTop: 16, maxWidth: '44ch', ...kw }}>
                오늘 끝나면 손에 데이터 후보 세 개와 문제 문장 아홉 개가 남습니다.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.24}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { n: '3', unit: '데이터 후보', sub: '세 갈래에서 하나씩' },
                { n: '9', unit: '문제 문장', sub: '데이터마다 세 문장' },
              ].map((x) => (
                <div key={x.n} style={{ ...card, display: 'flex', alignItems: 'baseline', gap: 16 }}>
                  <span style={{ ...mono, fontWeight: 800, fontSize: 'clamp(38px, 5vw, 64px)', color: 'var(--primary)', lineHeight: 1 }}>
                    {x.n}
                  </span>
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

      {/* S2 학기 궤도 + 문장 하나 — 타이포 dominant */}
      <Slide
        nav="학기"
        notes="완성 예시를 1~2개 30초씩 실제로 시연하세요. 화면에 띄운 뒤 이 문장을 소리 내어 한 번 박아 두면 3차시 명세 활동의 복선이 됩니다.">
        <div style={{ width: 'min(1160px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(24px, 4vh, 48px)' }}>
          <Reveal>
            <p style={{
              fontSize: 'clamp(26px, 3.6vw, 50px)', fontWeight: 800, lineHeight: 1.28,
              marginInline: 0, maxWidth: '20ch', ...kw,
            }}>
              코드는 AI가 쓴다.<br />
              <span className="accent-text">무엇을 만들지는 여러분이 정한다.</span>
            </p>
          </Reveal>
          <Reveal>
            <p style={{ color: 'var(--fg-muted)', fontSize: 'clamp(14px, 1.6vw, 17px)', lineHeight: 1.7, maxWidth: '52ch', ...kw }}>
              한 학기 끝에 각자 자기가 찾은 데이터로 작동하는 웹사이트를 만들어 배포합니다.
              그 출발점이 오늘입니다.
            </p>
          </Reveal>
          <Build at={1}>
            {/* 학기 궤도 — 오늘 위치만 강조 */}
            <div style={{ display: 'flex', alignItems: 'stretch', borderTop: hair, paddingTop: 18 }}>
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
                }}>
                  <div style={{
                    ...mono, fontSize: 12, letterSpacing: '0.06em',
                    color: s.now ? 'var(--primary)' : 'var(--fg-faint)', marginBottom: 6,
                  }}>
                    {s.now ? '오늘' : ''}
                  </div>
                  <div style={{
                    fontWeight: s.now ? 800 : 600,
                    fontSize: s.now ? 'clamp(15px, 1.8vw, 19px)' : 'clamp(13px, 1.4vw, 15px)',
                    color: s.now ? 'var(--fg)' : 'var(--fg-muted)', ...kw,
                  }}>
                    {s.t}
                  </div>
                </div>
              ))}
            </div>
          </Build>
        </div>
      </Slide>

      {/* S3 오늘의 원칙 — 씬 (모션이 메시지를 나르는 유일한 장) */}
      <Slide full nav="원칙"
        notes="문제를 먼저 정하면 그것을 풀 데이터가 없어서 학기 중반에 멈춥니다. 작년에도 그런 팀이 있었다는 식으로 짧게 겁을 주고 넘어가세요.">
        <Scene><TwoRoutesScene /></Scene>
      </Slide>

      {/* S4 세 갈래 — 좌표맵. 키커 2/4 */}
      <Slide nav="세 갈래"
        notes="말로만 하면 학생 대부분이 첫 번째 갈래로만 몰립니다. 다음 장에서 세 갈래를 각각 30초씩 실제로 열어 보여주세요.">
        <div style={{ width: 'min(1180px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.6vh, 20px)' }}>
          <Reveal>
            <div className="kicker">데이터는 어디에 있는가</div>
            <h2 className="headline" style={{ marginInline: 0, marginTop: 8, ...kw }}>
              세 갈래를 <span className="accent-text">모두</span> 채운다
            </h2>
          </Reveal>
          <Reveal><TrackMap /></Reveal>
          <Build at={1}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(10px, 1.6vw, 22px)' }}>
              {TRACKS.map((tr) => (
                <div key={tr.key} style={{ flex: '1 1 min(240px, 100%)', paddingTop: 12, borderTop: hair }}>
                  <div style={{ fontWeight: 800, fontSize: 14.5, marginBottom: 3, ...kw }}>{tr.key}</div>
                  <div style={{ color: 'var(--fg-muted)', fontSize: 13.5, lineHeight: 1.55, ...kw }}>{tr.weak}</div>
                </div>
              ))}
            </div>
          </Build>
        </div>
      </Slide>

      {/* S5 어디서 여는가 — 그룹 목록 (4.9 긴 목록은 덩어리로) */}
      <Slide nav="출처"
        notes="세 갈래를 각각 30초씩 실제로 화면에 열어 보여주세요. 지자체 포털은 전주시와 전북 홈페이지에서 직접 찾아 보여주면 됩니다.">
        <div style={{ width: 'min(1200px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 2.2vh, 26px)' }}>
          <Reveal>
            <h2 className="headline" style={{ marginInline: 0, ...kw }}>
              지금 바로 열 수 있는 곳
            </h2>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 'clamp(12px, 1.6vw, 22px)' }}>
            <Build at={1} style={{ gridColumn: 'span 5', display: 'flex' }}>
              <SourceGroup
                title="공개 데이터"
                note="양은 충분하다. 우리 학교나 우리 지역만 남기면 몇 행이 되는지 확인할 것."
                items={
                  <>
                    <SourceLink href="https://www.data.go.kr" label="공공데이터포털" />
                    <SourceLink href="https://kosis.kr" label="국가통계포털 KOSIS" />
                    <SourceLink href="https://www.schoolinfo.go.kr" label="학교알리미" />
                    <SourceLink href="https://data.kma.go.kr" label="기상자료개방포털" />
                  </>
                }
              />
            </Build>
            <Build at={2} style={{ gridColumn: 'span 4', display: 'flex' }}>
              <SourceGroup
                title="학교 안 데이터"
                note="정리된 파일로 있지는 않다. 직접 옮겨 적어야 하는 경우가 많다."
                items={
                  <>
                    {['급식 메뉴 기록', '시간표', '도서 대출 목록', '동아리와 행사 안내', '학교 홈페이지 공지'].map((x) => (
                      <span key={x} style={{ fontSize: 14.5, fontWeight: 600, ...kw }}>{x}</span>
                    ))}
                  </>
                }
              />
            </Build>
            <Build at={3} style={{ gridColumn: 'span 3', display: 'flex' }}>
              <SourceGroup
                title="직접 만드는 데이터"
                note="아직 없는 데이터다. 오늘은 무엇을 누구에게서 며칠간 모을지만 정한다."
                items={
                  <>
                    {['설문', '관찰 기록', '사진 기록', '2주간 자기 기록'].map((x) => (
                      <span key={x} style={{ fontSize: 14.5, fontWeight: 600, ...kw }}>{x}</span>
                    ))}
                  </>
                }
              />
            </Build>
          </div>
        </div>
      </Slide>

      {/* S6 통과 조건 — 관문 시퀀스 */}
      <Slide nav="조건"
        notes="학습지에도 체크박스로 들어가 있습니다. 세 개를 다 통과하지 못한 데이터는 후보에서 뺀다고 분명히 말해 주세요.">
        <div style={{ width: 'min(1120px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 2.4vh, 28px)' }}>
          <Reveal>
            <h2 className="headline" style={{ marginInline: 0, ...kw }}>
              관문 <span className="accent-text">셋</span>을 지나야 쓸 수 있다
            </h2>
          </Reveal>
          <Reveal><GateFunnel /></Reveal>
          <Build at={1}>
            <p style={{ color: 'var(--fg-muted)', fontSize: 'clamp(14px, 1.6vw, 17px)', lineHeight: 1.65, maxWidth: '66ch', ...kw }}>
              셋 중 하나라도 통과하지 못하면 후보에서 뺍니다. 아까워도 뺍니다.
            </p>
          </Build>
        </div>
      </Slide>

      {/* S7 문장 틀 — 빈칸 폼. 키커 3/4 */}
      <Slide nav="문장 틀"
        notes="틀은 이것 하나만 줍니다. 빈칸을 함께 채워 보고, 채운 문장을 소리 내어 읽게 하세요.">
        <div style={{ width: 'min(1120px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 2.6vh, 32px)' }}>
          <Reveal>
            <div className="kicker">데이터에서 문제로</div>
            {/* "이 틀"이 "이틀"로 읽히던 것을 고침 (COPY SELF-AUDIT, 4.9) */}
            <h2 className="headline" style={{ marginInline: 0, marginTop: 8, ...kw }}>
              틀은 하나, <span className="accent-text">문장은 아홉</span>
            </h2>
          </Reveal>
          <Reveal>
            <div style={{ ...card, padding: 'clamp(20px, 3vw, 38px)' }}>
              <p style={{ fontSize: 'clamp(17px, 2.2vw, 27px)', fontWeight: 700, lineHeight: 1.75, ...kw }}>
                <Blank>누가</Blank>는 <Blank>어떤 상황</Blank>에서 <Blank>무엇</Blank>을 몰라서 불편한데,
                이 데이터가 있으면 <Blank>무엇</Blank>을 알 수 있다.
              </p>
            </div>
          </Reveal>
          <Build at={1}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 'clamp(12px, 1.8vw, 24px)', alignItems: 'start' }}>
              <div style={{ gridColumn: 'span 4' }}>
                <div style={{ ...mono, fontSize: 12.5, color: 'var(--fg-muted)', letterSpacing: '0.06em', marginBottom: 8 }}>
                  가진 데이터
                </div>
                <p style={{ fontSize: 'clamp(14px, 1.6vw, 17px)', fontWeight: 700, lineHeight: 1.6, ...kw }}>
                  우리 학교 1년치 급식 메뉴 기록과 잔반량
                </p>
              </div>
              <div style={{ gridColumn: 'span 8', paddingLeft: 'clamp(14px, 2vw, 26px)', borderLeft: '3px solid var(--primary)' }}>
                <div style={{ ...mono, fontSize: 12.5, color: 'var(--primary)', letterSpacing: '0.06em', marginBottom: 8 }}>
                  채운 문장
                </div>
                <p style={{ fontSize: 'clamp(14.5px, 1.7vw, 18px)', fontWeight: 700, lineHeight: 1.7, ...kw }}>
                  영양사 선생님은 식단을 짤 때 어떤 메뉴가 남을지를 몰라서 곤란한데,
                  이 데이터가 있으면 메뉴 조합별 잔반 경향을 알 수 있다.
                </p>
              </div>
            </div>
          </Build>
        </div>
      </Slide>

      {/* S8 좋은 문장과 나쁜 문장 — 좌우 대조 (비대칭) */}
      <Slide nav="대조"
        notes="누군가가 덜 힘들어져야 문제입니다. 조사에서 끝나는 문장은 결과물이 나와도 아무것도 바뀌지 않는다는 점을 짚어 주세요.">
        <div style={{ width: 'min(1160px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 2.4vh, 28px)' }}>
          <Reveal>
            <h2 className="headline" style={{ marginInline: 0, ...kw }}>
              누군가가 덜 힘들어져야 문제다
            </h2>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 'clamp(14px, 2vw, 30px)', alignItems: 'stretch' }}>
            <Build at={1} style={{ gridColumn: 'span 4', display: 'flex' }}>
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
            <Build at={2} style={{ gridColumn: 'span 8', display: 'flex' }}>
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

      {/* S9 실습 앞단 — 기록표 (9.F 단계 번호 대신 할 일과 시간이 라벨) */}
      <Slide nav="데이터 찾기"
        notes="'찾을 게 없어요'가 10분 안에 나옵니다. 도서 대출 목록, 시간표, 동아리 명단 같은 예비 카드를 5~6개 뽑아 두세요. AI에게 묻는 것은 막지 말되, 실제 URL을 열어 파일을 확인한 것만 적게 하세요.">
        <div style={{ width: 'min(1180px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 2.2vh, 26px)' }}>
          <Reveal>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
              <h2 className="headline" style={{ marginInline: 0, ...kw }}>
                데이터 찾기
              </h2>
              <span style={{ ...mono, fontWeight: 800, fontSize: 'clamp(16px, 2vw, 22px)', color: 'var(--primary)' }}>15분</span>
            </div>
            <p style={{ color: 'var(--fg-muted)', fontSize: 'clamp(14px, 1.6vw, 17px)', marginTop: 6, maxWidth: '56ch', ...kw }}>
              세 갈래에서 각각 최소 하나씩, 모두 세 개를 학습지에 적습니다.
            </p>
          </Reveal>
          <Reveal>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 'clamp(10px, 1.4vw, 18px)' }}>
              {[
                { k: '데이터 이름', d: '무엇을 담고 있는지 알 수 있게', span: 4 },
                { k: '출처', d: 'URL 또는 어디에 있는지', span: 4 },
                { k: '형태', d: 'CSV, 엑셀, 웹페이지, 직접수집', span: 4 },
                { k: '행 수와 열 수', d: '실제로 열어서 센 숫자', span: 3 },
                { k: '열 이름 세 개 이상', d: '파일을 열지 않으면 못 적는다', span: 6, on: true },
                { k: '조건 체크 셋', d: '관문 세 개를 통과했는가', span: 3 },
              ].map((x) => (
                <div key={x.k} style={{
                  ...card, gridColumn: `span ${x.span}`,
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
            <p style={{ color: 'var(--fg-muted)', fontSize: 'clamp(13.5px, 1.5vw, 16px)', lineHeight: 1.65, maxWidth: '68ch', ...kw }}>
              직접 만드는 데이터는 아직 없으니, 대신 어떤 항목을 누구에게서 며칠간 모을 것인지를 적습니다.
            </p>
          </Build>
        </div>
      </Slide>

      {/* S10 실습 뒷단 — 분기 트리. 키커 4/4 */}
      <Slide nav="문장 쓰기"
        notes="같은 데이터로 학생, 교사, 학부모, 행정실 각각에게 무엇이 가능한지 보게 하면 문제 후보의 질이 눈에 띄게 올라갑니다.">
        <div style={{ width: 'min(1160px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 2.2vh, 26px)' }}>
          <Reveal>
            <div className="kicker">문장 쓰기 · 10분</div>
            <h2 className="headline" style={{ marginInline: 0, marginTop: 8, ...kw }}>
              같은 데이터, <span className="accent-text">다른 사람</span>
            </h2>
          </Reveal>
          <Reveal>
            <p style={{ color: 'var(--fg-muted)', fontSize: 'clamp(14px, 1.6vw, 17px)', maxWidth: '58ch', ...kw }}>
              데이터 하나에 세 문장씩 씁니다. 문장 안의 ‘누가’는 매번 달라야 합니다.
            </p>
          </Reveal>
          <Build at={1}>
            <svg viewBox="0 0 1140 330" style={{ width: '100%', height: 'auto' }} role="img"
              aria-label="데이터 하나에서 수혜자 셋으로 갈라지는 분기 — 영양사, 학생회, 행정실">
              {/* 뿌리 */}
              <rect x={8} y={124} width={286} height={82} rx={R}
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
                  {/* 가장자리에서 출발해 가장자리로 도착한다 (선 앵커) */}
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
            <p style={{ color: 'var(--fg-muted)', fontSize: 'clamp(14px, 1.6vw, 17px)', lineHeight: 1.65, maxWidth: '64ch', ...kw }}>
              데이터 셋에 각각 세 문장이면 아홉 문장입니다. 다 채우고 나서 고릅니다.
            </p>
          </Build>
        </div>
      </Slide>

      {/* S11 정리와 과제 — 마무리 */}
      <Slide nav="정리"
        notes="발표를 평가하지 말고 '그 데이터 어디서 찾았어?'만 물으세요. 다른 학생의 탐색 경로가 공유되는 것이 이 시간의 목적입니다.">
        <div style={{ width: 'min(1120px, 100%)', marginInline: 'auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.15fr)', gap: 'clamp(22px, 4vw, 56px)', alignItems: 'center' }}>
          <div>
            <Reveal>
              <h2 className="headline" style={{ marginInline: 0, ...kw }}>
                셋으로 <span className="accent-text">줄이기</span>
              </h2>
            </Reveal>
            <Reveal>
              <p style={{ color: 'var(--fg-muted)', fontSize: 'clamp(14px, 1.6vw, 17px)', lineHeight: 1.7, marginTop: 12, ...kw }}>
                아홉 문장 중 셋에 표시해 옵니다. 다음 시간 도입에서 그중 하나를 확정합니다.
              </p>
            </Reveal>
            <Reveal>
              <div style={{ marginTop: 22, paddingTop: 18, borderTop: hair }}>
                <div style={{ ...mono, fontSize: 12.5, color: 'var(--primary)', letterSpacing: '0.06em', marginBottom: 8 }}>
                  고르는 기준
                </div>
                <p style={{ fontSize: 'clamp(15px, 1.8vw, 20px)', fontWeight: 800, lineHeight: 1.6, ...kw }}>
                  재미가 아니라, 이 데이터를 다음 주까지 실제로 손에 넣을 수 있는가.
                </p>
              </div>
            </Reveal>
          </div>
          <Build at={1}>
            <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ ...mono, fontSize: 12.5, color: 'var(--fg-muted)', letterSpacing: '0.06em' }}>
                남은 5분
              </div>
              {[
                { t: '짝에게 한 문장', d: '아홉 개 중 가장 마음에 드는 것 하나만' },
                { t: '서로에게 묻기', d: '“그 데이터 어디서 찾았어?”' },
                { t: '가져올 것', d: '표시한 문제 문장 세 개' },
              ].map((x, i) => (
                <div key={x.t} style={{ paddingTop: i === 0 ? 0 : 12, borderTop: i === 0 ? 'none' : hair }}>
                  <div style={{ fontWeight: 800, fontSize: 'clamp(14.5px, 1.7vw, 18px)', ...kw }}>{x.t}</div>
                  <p style={{ color: 'var(--fg-muted)', fontSize: 14, lineHeight: 1.6, marginTop: 3, ...kw }}>{x.d}</p>
                </div>
              ))}
            </div>
          </Build>
        </div>
      </Slide>
    </Deck>
  );
}

/* 문장 틀의 빈칸 — 밑줄 위에 라벨이 얹힌 형태 */
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
