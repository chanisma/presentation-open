import { type CSSProperties } from 'react';
import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import Build from '../../../../src/deck/Build';
import Reveal from '../../../../src/deck/Reveal';
import Cover from '../../../../src/components/Cover';
import Split from '../../../../src/components/Split';
import CodeWindow from '../../../../src/components/CodeWindow';
import {
  Scene,
  useSceneTime,
  interpolate,
  spring,
  riseIn,
  easeInOut,
  easeOut,
} from '../../../../src/scene';

/* ── 정보과제연구 · 2026-2 오리엔테이션 (10장) ───────────────────────
   plan: data/2026-2/정보과제연구/오리엔테이션/plan.md
   아크: 발자국 씬 → 존 스노우(1854) → 파이프라인 5단계 → 앤스컴 씬
        → 한 학기 여정 → 도구 → 질문 렌즈 씬 → 평가(수행 100%) → 사전 설문 */

const C = {
  emerald: '#34d399',
  cyan: '#22d3ee',
  amber: '#fbbf24',
  coral: '#fb7185',
};

const BASE = 'data/2026-2/정보과제연구/오리엔테이션';
const FORM_URL = 'https://forms.gle/YOUR_FORM_ID';

const card: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: 18,
  padding: 'clamp(16px, 2vw, 26px)',
};

const kw: CSSProperties = { wordBreak: 'keep-all' };

/* ── S2 — 하루가 남기는 발자국 (낙하 → 산점도 정렬) ── */
const FOOTPRINTS = [
  { label: '기상 6:50', drop: [420, 356], plot: [180, 340] },
  { label: '버스 탑승', drop: [660, 372], plot: [270, 318] },
  { label: '검색 3회', drop: [540, 340], plot: [360, 300] },
  { label: '메시지 12건', drop: [760, 352], plot: [450, 265] },
  { label: '간식 결제', drop: [350, 380], plot: [540, 282] },
  { label: '영상 시청', drop: [590, 388], plot: [630, 236] },
  { label: '걸음 수 기록', drop: [470, 366], plot: [720, 208] },
  { label: '스트리밍 8곡', drop: [700, 336], plot: [810, 224] },
  { label: '사진 4장', drop: [830, 368], plot: [900, 172] },
  { label: '취침 23:40', drop: [520, 396], plot: [990, 150] },
] as const;

function FootprintScene() {
  const t = useSceneTime();
  const gather = 2.6;
  const axis = interpolate(t, [gather + 0.2, gather + 1.2], [0, 1], easeInOut);
  const trend = interpolate(t, [gather + 1.4, gather + 2.6], [0, 1], easeInOut);
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', paddingTop: 'clamp(36px, 8vh, 78px)' }}>
        <div className="kicker" style={riseIn(t, 0.05)}>정보과제연구 · 오리엔테이션</div>
        <h2 className="display" style={{ margin: '12px auto 0', ...kw, ...riseIn(t, 0.25) }}>
          하루가 남기는 <span className="accent-text">발자국</span>
        </h2>
        <p className="lead" style={{ marginInline: 'auto', marginTop: 10, ...kw, ...riseIn(t, 0.5) }}>
          여러분의 오늘은 이미 데이터를 남기고 있다 — 흩어진 점을 모으면 패턴이 보인다.
        </p>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '7vh' }}>
        <svg viewBox="0 0 1200 470" style={{ width: 'min(1120px, 94vw)', height: 'auto', overflow: 'visible' }}>
          {/* 축 — 점이 모이기 시작하면 그려짐 */}
          <line x1={120} y1={410} x2={120 + 960 * axis} y2={410}
            stroke="var(--fg-muted)" strokeWidth={2.5} opacity={0.55} strokeLinecap="round" />
          <line x1={120} y1={410} x2={120} y2={410 - 300 * axis}
            stroke="var(--fg-muted)" strokeWidth={2.5} opacity={0.55} strokeLinecap="round" />
          <text x={1085} y={442} textAnchor="end" fill="var(--fg-muted)" opacity={axis}
            style={{ font: '500 15px var(--font-body, sans-serif)' }}>하루의 시간 →</text>
          <text x={104} y={104} textAnchor="end" fill="var(--fg-muted)" opacity={axis}
            style={{ font: '500 15px var(--font-body, sans-serif)', writingMode: 'vertical-rl' }}>남긴 기록 ↑</text>
          {/* 추세 곡선 */}
          <path d="M170 348 C 400 322, 640 268, 1000 148" pathLength={1} fill="none"
            stroke={C.emerald} strokeWidth={3.5} strokeLinecap="round" opacity={0.85}
            style={{ strokeDasharray: 1, strokeDashoffset: 1 - trend }} />
          {/* 발자국 점 — 낙하 후 산점도 자리로 */}
          {FOOTPRINTS.map((f, i) => {
            const t0 = 0.4 + i * 0.18;
            const fall = interpolate(t, [t0, t0 + 0.7], [0, 1], easeOut);
            const move = spring(t, gather + i * 0.09, 0.9);
            const x = f.drop[0] + (f.plot[0] - f.drop[0]) * move;
            const y = -30 + (f.drop[1] + 30) * fall + (f.plot[1] - f.drop[1]) * move;
            const labelOp = Math.min(fall, 1 - move);
            return (
              <g key={f.label}>
                <circle cx={x} cy={y} r={8} fill={C.emerald}
                  opacity={0.35 + 0.65 * Math.max(move, 0.3) * fall}
                  stroke="var(--bg)" strokeWidth={1.5} />
                <text x={x + 14} y={y - 10} fill="var(--fg-muted)" opacity={labelOp}
                  style={{ font: '500 14px var(--font-body, sans-serif)' }}>
                  {f.label}
                </text>
              </g>
            );
          })}
          <text x={600} y={462} textAnchor="middle" fill="var(--fg-muted)"
            opacity={interpolate(t, [gather + 2.4, gather + 3], [0, 1])}
            style={{ font: '500 16px var(--font-body, sans-serif)' }}>
            읽는 법을 배우면, 남들이 못 보는 것이 보인다
          </text>
        </svg>
      </div>
    </div>
  );
}

/* ── S3 — 존 스노우 지도 도식 (사망 지점 클러스터 + 펌프) ── */
function SnowMap() {
  const dots = Array.from({ length: 26 }, (_, i) => {
    const a = i * 2.39996; // 골든앵글 나선 — 결정론적 클러스터
    const r = 14 + Math.sqrt(i) * 26;
    return [230 + Math.cos(a) * r, 165 + Math.sin(a) * r * 0.72] as const;
  });
  return (
    <svg viewBox="0 0 460 330" style={{ width: '100%', height: 'auto' }} role="img"
      aria-label="1854년 브로드가 지도 도식 — 사망 지점이 펌프 주변에 몰려 있다">
      <rect x={4} y={4} width={452} height={300} rx={16} fill="var(--surface)" stroke="var(--line)" />
      {/* 골목 격자 */}
      <g stroke="var(--fg-muted)" strokeWidth={1.4} opacity={0.3}>
        {[64, 132, 200, 268].map((y) => <line key={y} x1={16} y1={y} x2={444} y2={y} />)}
        {[80, 160, 240, 320, 396].map((x) => <line key={x} x1={x} y1={14} x2={x} y2={294} />)}
      </g>
      {/* 사망 지점 */}
      {dots.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={5} fill={C.coral} opacity={0.85} />
      ))}
      {/* 펌프 */}
      <circle cx={230} cy={165} r={11} fill="none" stroke={C.amber} strokeWidth={3.5} />
      <circle cx={230} cy={165} r={3.5} fill={C.amber} />
      <text x={248} y={152} fill={C.amber} style={{ font: '800 16px var(--font-body, sans-serif)' }}>펌프</text>
      <g style={{ font: '500 13px var(--font-body, sans-serif)' }}>
        <circle cx={30} cy={322} r={5} fill={C.coral} />
        <text x={42} y={327} fill="var(--fg-muted)">사망자가 나온 집</text>
      </g>
    </svg>
  );
}

/* ── S4 — 파이프라인 5단계 + 루프백 ── */
const PIPELINE = [
  { n: 1, name: '질문', desc: '무엇이 궁금한가' },
  { n: 2, name: '수집', desc: '편향 없이 모은다' },
  { n: 3, name: '정리', desc: '오류를 다듬는다' },
  { n: 4, name: '분석·시각화', desc: '여러 방법으로 그린다' },
  { n: 5, name: '해석·공유', desc: '의미를 말한다' },
];

function PipelineDiagram() {
  return (
    <svg viewBox="0 0 1100 330" style={{ width: 'min(1040px, 92vw)', height: 'auto' }} role="img"
      aria-label="데이터 과학 파이프라인 — 질문, 수집, 정리, 분석과 시각화, 해석과 공유가 순환한다">
      {PIPELINE.map((s, i) => {
        const x = 110 + i * 220;
        return (
          <g key={s.n}>
            <circle cx={x} cy={120} r={46}
              fill="var(--surface)"
              stroke={i === 0 || i === 4 ? C.emerald : 'var(--line)'}
              strokeWidth={i === 0 || i === 4 ? 3 : 1.6} />
            <text x={x} y={112} textAnchor="middle" fill={i === 0 || i === 4 ? C.emerald : 'var(--fg-muted)'}
              style={{ font: '800 21px var(--font-mono, monospace)' }}>{s.n}</text>
            <text x={x} y={138} textAnchor="middle" fill="var(--fg)"
              style={{ font: '800 17px var(--font-body, sans-serif)' }}>{s.name}</text>
            <text x={x} y={196} textAnchor="middle" fill="var(--fg-muted)"
              style={{ font: '500 15px var(--font-body, sans-serif)' }}>{s.desc}</text>
            {i < 4 && (
              <g stroke="var(--fg-muted)" strokeWidth={2.5} strokeLinecap="round">
                <line x1={x + 58} y1={120} x2={x + 152} y2={120} />
                <path d={`M${x + 152} 120 l-11 -6 v12 z`} fill="var(--fg-muted)" stroke="none" />
              </g>
            )}
          </g>
        );
      })}
      {/* 루프백 — 해석·공유에서 질문으로 (설명 라벨 아래로 우회) */}
      <path d="M1040 210 C 1010 300, 220 300, 158 228" fill="none"
        stroke={C.emerald} strokeWidth={2.5} strokeDasharray="8 8" opacity={0.85} />
      <polygon points="158,228 172.3,234.4 161.7,243.6" fill={C.emerald} />
      <text x={550} y={310} textAnchor="middle" fill={C.emerald}
        style={{ font: '700 16px var(--font-body, sans-serif)' }}>더 좋은 질문으로, 다시</text>
    </svg>
  );
}

/* ── S5 — 같은 평균, 다른 진실 (앤스컴 Ⅰ·Ⅱ) ── */
const ANSCOMBE_X = [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5];
const ANSCOMBE_1 = [8.04, 6.95, 7.58, 8.81, 8.33, 9.96, 7.24, 4.26, 10.84, 4.82, 5.68];
const ANSCOMBE_2 = [9.14, 8.14, 8.74, 8.77, 9.26, 8.1, 6.13, 3.1, 9.13, 7.26, 4.74];

function AnscombePanel({ title, ys, curve, t, start }: {
  title: string; ys: number[]; curve: boolean; t: number; start: number;
}) {
  const mx = (x: number) => 42 + ((x - 3) / 12) * 336;
  const my = (y: number) => 268 - ((y - 2) / 9) * 236;
  const lineDraw = interpolate(t, [start + 1.1, start + 2.1], [0, 1], easeInOut);
  const sorted = ANSCOMBE_X.map((x, i) => [x, ys[i]] as const).sort((a, b) => a[0] - b[0]);
  const trendPath = curve
    ? 'M' + sorted.map(([x, y]) => `${mx(x)} ${my(y)}`).join(' L ')
    : `M${mx(3.5)} ${my(3.0 + 0.5 * 3.5)} L ${mx(14.5)} ${my(3.0 + 0.5 * 14.5)}`;
  return (
    <svg viewBox="0 0 420 300" style={{ width: '100%', height: 'auto' }}>
      <rect x={2} y={2} width={416} height={296} rx={14} fill="var(--surface)" stroke="var(--line)" />
      <line x1={42} y1={268} x2={396} y2={268} stroke="var(--line)" strokeWidth={1.5} />
      <line x1={42} y1={268} x2={42} y2={20} stroke="var(--line)" strokeWidth={1.5} />
      <text x={30} y={40} fill="var(--fg)" style={{ font: '800 18px var(--font-body, sans-serif)' }}>{title}</text>
      <text x={392} y={288} textAnchor="end" fill="var(--fg-muted)"
        style={{ font: '700 13.5px var(--font-mono, monospace)' }}>x̄ 9.0 · ȳ 7.5 · r 0.82</text>
      {ANSCOMBE_X.map((x, i) => {
        const ap = spring(t, start + 0.15 + i * 0.07, 0.7);
        return (
          <circle key={i} cx={mx(x)} cy={my(ys[i])} r={7 * ap} fill={curve ? C.cyan : C.emerald}
            opacity={Math.min(1, ap * 1.3)} />
        );
      })}
      <path d={trendPath} pathLength={1} fill="none" stroke={curve ? C.cyan : C.emerald}
        strokeWidth={2.5} opacity={0.6}
        style={{ strokeDasharray: 1, strokeDashoffset: 1 - lineDraw }} />
    </svg>
  );
}

function AnscombeScene() {
  const t = useSceneTime();
  const split = 1.6; // 요약 카드가 갈라지는 시점
  const cardOp = interpolate(t, [split, split + 0.5], [1, 0]);
  const panels = spring(t, split + 0.2, 0.9);
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', paddingTop: 'clamp(34px, 7vh, 70px)' }}>
        <div className="kicker" style={riseIn(t, 0.05)}>시각화의 힘 · 앤스컴 콰르텟</div>
        <h2 className="headline" style={{ margin: '12px auto 0', ...kw, ...riseIn(t, 0.2) }}>
          같은 평균, <span className="accent-text">다른 진실</span>
        </h2>
      </div>
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(16px, 2.4vw, 34px)', padding: '0 5vw' }}>
        {/* 요약 카드 — 갈라지기 전 */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: `translate(-50%,-50%) scale(${0.9 + 0.1 * spring(t, 0.2, 0.7)})`,
          opacity: Math.min(interpolate(t, [0.2, 0.7], [0, 1]), cardOp),
          ...card, borderColor: `color-mix(in srgb, ${C.emerald} 40%, transparent)`,
          textAlign: 'center', zIndex: 2, pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--fg-muted)', letterSpacing: '0.1em', marginBottom: 10 }}>
            데이터셋 Ⅰ · Ⅱ 요약 통계
          </div>
          <div style={{ display: 'flex', gap: 26, fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 'clamp(16px, 2vw, 22px)' }}>
            <span>x̄ = 9.0</span><span>ȳ = 7.5</span><span>r = 0.82</span>
          </div>
          <div style={{ marginTop: 10, fontSize: 14, color: C.emerald, fontWeight: 700 }}>둘 다, 완전히 동일</div>
        </div>
        {/* 두 산점도 패널 */}
        {[false, true].map((curve) => (
          <div key={String(curve)} style={{
            flex: '1 1 0', maxWidth: 470,
            transform: `translateX(${(curve ? 1 : -1) * (1 - panels) * 60}px) scale(${0.6 + 0.4 * panels})`,
            opacity: panels,
          }}>
            <AnscombePanel title={curve ? '데이터셋 Ⅱ' : '데이터셋 Ⅰ'}
              ys={curve ? ANSCOMBE_2 : ANSCOMBE_1} curve={curve} t={t} start={split + 0.3} />
          </div>
        ))}
      </div>
      <p className="lead" style={{ textAlign: 'center', marginInline: 'auto', paddingBottom: 'clamp(72px, 11vh, 110px)', paddingInline: '6vw', ...kw, ...riseIn(t, split + 2.4) }}>
        요약 숫자는 거짓말을 안 하지만, 전부 말해 주지도 않는다 —{' '}
        <strong style={{ color: 'var(--fg)' }}>그려 봐야 진실이 보인다.</strong>
      </p>
    </div>
  );
}

/* ── S8 — 질문이 렌즈다 (안개 점 구름 + 초점 렌즈) ── */
const frac = (v: number) => v - Math.floor(v);
const CLOUD = Array.from({ length: 72 }, (_, i) => {
  // 결정론적 의사난수 산포 (sin 해시 — Math.random 금지 규약)
  const x = 110 + frac(Math.sin(i * 12.9898) * 43758.5453) * 980;
  const y = 70 + frac(Math.sin(i * 78.233) * 12543.2971) * 340;
  const onTrend = Math.abs(y - (430 - 0.3 * x)) < 52;
  return { x, y, onTrend };
});

function LensScene() {
  const t = useSceneTime();
  const lensX = interpolate(t, [1.2, 3.2], [80, 600], easeInOut);
  const lensY = interpolate(t, [1.2, 3.2], [340, 245], easeInOut);
  const R = 168;
  const labelOn = interpolate(t, [3.4, 4], [0, 1]);
  const trend = interpolate(t, [3.8, 5], [0, 1], easeInOut);
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', paddingTop: 'clamp(34px, 7vh, 70px)' }}>
        <div className="kicker" style={riseIn(t, 0.05)}>이 수업의 핵심 가치</div>
        <h2 className="display" style={{ margin: '12px auto 0', ...kw, ...riseIn(t, 0.2) }}>
          질문이 <span className="accent-text">렌즈다</span>
        </h2>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '4vh' }}>
        <svg viewBox="0 0 1200 500" style={{ width: 'min(1120px, 94vw)', height: 'auto', overflow: 'visible' }}>
          <defs>
            <clipPath id="lensClip">
              <circle cx={lensX} cy={lensY} r={R} />
            </clipPath>
          </defs>
          {/* 안개 층 — 흐릿한 점 구름 */}
          <g opacity={interpolate(t, [0.2, 1], [0, 0.85])} style={{ filter: 'blur(2.5px)' }}>
            {CLOUD.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={6.5} fill="var(--fg-muted)" opacity={0.7} />
            ))}
          </g>
          {/* 초점 층 — 렌즈 안에서만 선명 */}
          <g clipPath="url(#lensClip)">
            <rect x={0} y={0} width={1200} height={500} fill="var(--bg)" opacity={0.6} />
            {CLOUD.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={p.onTrend ? 7.5 : 5}
                fill={p.onTrend ? C.emerald : 'var(--fg-muted)'}
                opacity={p.onTrend ? 1 : 0.35} />
            ))}
            <path d="M120 394 L 1080 106" pathLength={1} fill="none"
              stroke={C.emerald} strokeWidth={3.5} strokeLinecap="round" opacity={0.9}
              style={{ strokeDasharray: 1, strokeDashoffset: 1 - trend }} />
          </g>
          {/* 렌즈 링 + 손잡이 */}
          <circle cx={lensX} cy={lensY} r={R} fill="none" stroke={C.emerald} strokeWidth={4}
            opacity={interpolate(t, [1, 1.5], [0, 1])}
            style={{ filter: `drop-shadow(0 0 18px color-mix(in srgb, ${C.emerald} 40%, transparent))` }} />
          <line x1={lensX + R * 0.72} y1={lensY + R * 0.72} x2={lensX + R * 1.15} y2={lensY + R * 1.15}
            stroke={C.emerald} strokeWidth={9} strokeLinecap="round"
            opacity={interpolate(t, [1, 1.5], [0, 1])} />
          {/* 렌즈에 새겨지는 질문 */}
          <g opacity={labelOn} transform={`translate(${lensX} ${lensY - R - 20})`}>
            <text x={0} y={0} textAnchor="middle" fill={C.emerald}
              style={{ font: '800 24px var(--font-body, sans-serif)' }}>“무엇이 궁금한가?”</text>
          </g>
          <text x={600} y={492} textAnchor="middle" fill="var(--fg-muted)"
            opacity={interpolate(t, [4.6, 5.4], [0, 1])}
            style={{ font: '500 17px var(--font-body, sans-serif)' }}>
            데이터는 렌즈 없이는 안개다 — 좋은 질문이 좋은 연구를 만든다
          </text>
        </svg>
      </div>
    </div>
  );
}

/* ── 덱 본체 ── */
export default function InfoResearchOrientationDeck() {
  return (
    <Deck>
      {/* S1 표지 */}
      <Cover
        nav="표지"
        notes="이 과목 이름엔 '연구'가 들어갑니다. 오늘은 여러분이 한 학기 동안 무엇을 연구하게 될지 보여드릴게요."
        kicker="2026-2학기 · 샘플고등학교"
        title={<span style={kw}>정보<span className="accent-text">과제연구</span>, 첫 시간</span>}
        subtitle={<span style={kw}>배우는 사람에서 연구하는 사람으로 — 왜 데이터인가, 무엇을 하는가, 어떻게 평가하는가</span>}
        foot="오리엔테이션 · 데이터로 문제를 해결하는 한 학기"
      />

      {/* S2 발자국 씬 */}
      <Slide full nav="발자국" notes="오늘 아침부터 지금까지 여러분이 남긴 데이터가 몇 개일까요? 이 점들을 읽는 법을 배우면, 남들이 못 보는 것을 보게 됩니다.">
        <Scene><FootprintScene /></Scene>
      </Slide>

      {/* S3 존 스노우 빌드 */}
      <Slide nav="1854 런던" notes="모두가 공기 탓이라 할 때, 이 사람은 데이터를 지도에 찍었습니다. 이게 이 수업에서 여러분이 하게 될 일의 원형입니다 — 170년 전 버전으로요.">
        <div style={{ width: 'min(1120px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 2vh, 24px)' }}>
          <Reveal>
            <div className="kicker">데이터가 통념을 이긴 날 · 1854 런던</div>
            <h2 className="headline" style={kw}>지도를 그린 의사, <span className="accent-text">존 스노우</span></h2>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))', gap: 'clamp(14px, 1.8vw, 24px)', alignItems: 'stretch' }}>
            <Build at={1}>
              <div style={{ ...card, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 }}>
                <span style={{ fontFamily: 'var(--font-mono)', color: C.coral, fontWeight: 800, fontSize: 14 }}>당시의 통념</span>
                <p style={{ fontSize: 'clamp(18px, 2.1vw, 24px)', fontWeight: 800, lineHeight: 1.55, color: 'var(--fg-muted)', ...kw }}>
                  “콜레라는 나쁜 공기<br />(미아즈마) 때문이다”
                </p>
                <p style={{ color: 'var(--fg-muted)', fontSize: 15, lineHeight: 1.65, ...kw }}>
                  런던에 콜레라가 창궐하자 모두가 공기를 탓했다 — 증거 없이.
                </p>
              </div>
            </Build>
            <Build at={2}>
              <div style={{ ...card, borderColor: `color-mix(in srgb, ${C.emerald} 45%, transparent)` }}>
                <span style={{ fontFamily: 'var(--font-mono)', color: C.emerald, fontWeight: 800, fontSize: 14 }}>스노우의 데이터</span>
                <div style={{ marginTop: 10 }}><SnowMap /></div>
              </div>
            </Build>
          </div>
          <Build at={3}>
            <div style={{ ...card, textAlign: 'center', background: 'color-mix(in srgb, var(--surface) 60%, transparent)' }}>
              <p style={{ fontSize: 'clamp(15px, 1.8vw, 19px)', fontWeight: 700, ...kw }}>
                사망자가 나온 집을 점으로 찍자 — 점들이 <span className="accent-text">브로드가 펌프</span> 주변에 몰려 있었다.
                펌프 손잡이를 뽑자 확산이 멈췄다.
              </p>
              <span style={{ fontSize: 13, color: 'var(--fg-muted)' }}>데이터 기반 의사 결정의 원형 — 여러분이 한 학기 동안 할 일</span>
            </div>
          </Build>
        </div>
      </Slide>

      {/* S4 파이프라인 */}
      <Slide nav="다섯 걸음" notes="다섯 걸음 중 어디가 제일 어려울 것 같나요? 놀랍게도 대부분의 연구는 1번, 질문에서 승부가 납니다.">
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(8px, 1.4vh, 18px)', textAlign: 'center' }}>
          <Reveal>
            <div className="kicker">데이터 과학이란</div>
            <h2 className="headline" style={{ marginInline: 'auto', ...kw }}>
              질문에서 시작해, 다시 <span className="accent-text">질문으로</span>
            </h2>
          </Reveal>
          <Reveal><PipelineDiagram /></Reveal>
        </div>
      </Slide>

      {/* S5 앤스컴 씬 */}
      <Slide full nav="같은 평균" notes="표만 보면 쌍둥이 같죠? 그런데 그려 보면 전혀 다릅니다. 그래서 우리는 항상 그려 볼 겁니다.">
        <Scene><AnscombeScene /></Scene>
      </Slide>

      {/* S6 한 학기 여정 */}
      <Slide nav="연구 여정" notes="학기말에 여러분 손에는 여러분이 직접 만든 연구 질문과 그 답이 담긴 보고서가 남습니다.">
        <div style={{ width: 'min(1120px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(20px, 3vh, 36px)', textAlign: 'center' }}>
          <Reveal>
            <div className="kicker">한 학기의 연구 여정</div>
            <h2 className="headline" style={{ marginInline: 'auto', ...kw }}>
              네 정거장을 지나면, <span className="accent-text">여러분의 연구</span>가 남는다
            </h2>
          </Reveal>
          <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: 'clamp(12px, 1.6vw, 20px)', justifyContent: 'center', alignItems: 'stretch' }}>
            {[
              { n: 1, title: '연구 질문 만들기', d: '궁금한 것을 데이터로 답할 수 있는 질문으로', tag: '질문 카드', color: C.emerald },
              { n: 2, title: '데이터 수집·정리', d: '공공데이터·설문·측정 — 편향 없이, 깔끔하게', tag: '데이터셋', color: C.cyan },
              { n: 3, title: '분석·시각화', d: '두 가지 이상의 방법으로 분석하고 비교', tag: '차트', color: C.amber },
              { n: 4, title: '보고서·발표', d: '결과를 해석하고 세상과 공유', tag: '보고서', color: C.coral },
            ].map((s) => (
              <Build key={s.n} at={s.n} style={{ flex: '1 1 min(230px, 100%)', maxWidth: 300, display: 'flex' }}>
                <div style={{ ...card, flex: 1, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8, borderTop: `3px solid ${s.color}` }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 15, color: s.color }}>정거장 {s.n}</span>
                  <div style={{ fontWeight: 800, fontSize: 'clamp(15px, 1.7vw, 18px)', ...kw }}>{s.title}</div>
                  <p style={{ color: 'var(--fg-muted)', fontSize: 14, lineHeight: 1.6, flex: 1, ...kw }}>{s.d}</p>
                  <span style={{ alignSelf: 'flex-start', fontSize: 12.5, fontWeight: 700, color: s.color, border: `1px solid color-mix(in srgb, ${s.color} 50%, transparent)`, borderRadius: 999, padding: '3px 10px' }}>
                    산출물 · {s.tag}
                  </span>
                </div>
              </Build>
            ))}
          </div>
          <Build at={4}>
            <p style={{ color: 'var(--fg-muted)', fontSize: 'clamp(13px, 1.5vw, 16px)', marginInline: 'auto', ...kw }}>
              진도는 없다 — 여정이 있다. 매주 한 걸음씩.
            </p>
          </Build>
        </div>
      </Slide>

      {/* S7 도구 */}
      <Split
        nav="도구"
        notes="코드 네 줄이면 표 수천 줄이 그림 한 장이 됩니다. 겁먹을 필요 없어요 — 이 네 줄부터 같이 갑니다."
        kicker="우리의 도구"
        title={<span style={kw}>도구는 <span className="accent-text">세 가지</span>면 충분하다</span>}
        body={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { name: '스프레드시트', d: '데이터를 눈으로 만지는 첫 도구', color: C.emerald },
              { name: '파이썬 (pandas · matplotlib)', d: '수천 행도 몇 줄로 요약하는 분석 언어', color: C.cyan },
              { name: '공공데이터포털 · KOSIS', d: '진짜 세상의 데이터가 열려 있는 곳', color: C.amber },
            ].map((tool) => (
              <div key={tool.name} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ flex: 'none', width: 10, height: 10, borderRadius: '50%', background: tool.color, marginTop: 7 }} />
                <div>
                  <div style={{ fontWeight: 800, ...kw }}>{tool.name}</div>
                  <p style={{ color: 'var(--fg-muted)', fontSize: 14.5, lineHeight: 1.6, ...kw }}>{tool.d}</p>
                </div>
              </div>
            ))}
          </div>
        }
        media={
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(16px, 2.4vw, 34px)', background: 'var(--surface)' }}>
            <CodeWindow
              title="첫_분석.py"
              highlight={[4]}
              code={`import pandas as pd

df = pd.read_csv("급식_만족도.csv")  # 데이터 불러오기
print(df.describe())               # 표 수천 줄 → 요약 한 장
df.plot(x="요일", y="만족도")       # 그리고, 그림 한 장`}
            />
          </div>
        }
      />

      {/* S8 질문 렌즈 씬 */}
      <Slide full nav="핵심" notes="AI기초 시간에 '문제를 정의하는 힘'을 말했다면, 이 수업에서는 그걸 실제로 합니다 — 여러분의 질문으로, 여러분의 데이터로요.">
        <Scene><LensScene /></Scene>
      </Slide>

      {/* S9 평가 */}
      <Slide nav="평가" notes="시험 전날 밤은 이 과목에 없습니다. 대신 매주 조금씩 쌓은 기록이 그대로 성적이 됩니다.">
        <div style={{ width: 'min(920px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 2.6vh, 30px)', textAlign: 'center' }}>
          <Reveal>
            <div className="kicker">어떻게 평가하는가</div>
            <h2 className="headline" style={{ marginInline: 'auto', ...kw }}>
              이 수업엔 <span className="accent-text">시험지가 없다</span>
            </h2>
          </Reveal>
          <Reveal>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ flex: 'none', width: 92, textAlign: 'right', fontSize: 14, fontWeight: 700, color: 'var(--fg-muted)' }}>지필시험</span>
                <div style={{ flex: 1, height: 52, borderRadius: 14, border: '1.5px dashed var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 'clamp(17px, 2vw, 22px)' }}>
                  0%
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ flex: 'none', width: 92, textAlign: 'right', fontSize: 14, fontWeight: 800 }}>수행평가</span>
                <div style={{ flex: 1, height: 52, borderRadius: 14, background: 'var(--accent)', color: 'var(--accent-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 'clamp(18px, 2.2vw, 26px)', boxShadow: 'var(--glow)' }}>
                  100%
                </div>
              </div>
            </div>
          </Reveal>
          <Build at={1}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
              {[
                { t: '프로젝트', d: '연구 질문부터 보고서·발표까지 — 연구의 전 과정과 결과물' },
                { t: '수업 활동', d: '매 시간의 탐구·분석 기록이 그대로 쌓인다' },
              ].map((x) => (
                <div key={x.t} style={{ ...card, flex: '1 1 260px', maxWidth: 380, textAlign: 'left' }}>
                  <div style={{ fontWeight: 800, marginBottom: 4 }}>{x.t}</div>
                  <p style={{ color: 'var(--fg-muted)', fontSize: 14, lineHeight: 1.6, ...kw }}>{x.d}</p>
                </div>
              ))}
            </div>
          </Build>
          <Build at={2}>
            <p className="lead" style={{ marginInline: 'auto', ...kw }}>
              벼락치기가 불가능한 구조 — <strong style={{ color: 'var(--fg)' }}>과정 그 자체가 평가</strong>입니다.
            </p>
          </Build>
        </div>
      </Slide>

      {/* S10 사전 설문 */}
      <Slide nav="사전 설문" notes="설문에 적어 주는 궁금증 중 몇 개는 실제로 우리 수업의 예제 데이터가 됩니다. 진심으로 적어 주세요.">
        <div style={{
          width: 'min(1080px, 100%)', marginInline: 'auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))',
          gap: 'clamp(20px, 3vw, 44px)', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Reveal>
              <div className="kicker">시작하기 전에</div>
              <h2 className="headline" style={kw}>
                여러분의 <span className="accent-text">궁금증</span>을 주세요
              </h2>
            </Reveal>
            <Reveal>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['오늘 본 것', '발자국 → 1854 지도 → 다섯 걸음 → 질문 렌즈'],
                  ['앞으로 할 것', '나의 질문 · 나의 데이터 · 나의 연구'],
                  ['기억할 것', '좋은 질문이 좋은 연구를 만든다'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                    <span style={{ flex: 'none', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 800, color: C.emerald, width: 92 }}>{k}</span>
                    <span style={{ color: 'var(--fg-muted)', fontSize: 15, ...kw }}>{v}</span>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal>
              <p style={{ color: 'var(--fg-muted)', lineHeight: 1.7, ...kw }}>
                5분이면 됩니다. 여러분이 적어 준 궁금증이{' '}
                <strong style={{ color: 'var(--fg)' }}>이 수업의 예제 데이터와 커리큘럼</strong>이 됩니다 —
                지금 바로 제출하고 마칩니다.
              </p>
            </Reveal>
          </div>
          <Reveal>
            <div style={{ ...card, textAlign: 'center', padding: 'clamp(22px, 3vh, 36px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <img src={`${BASE}/images/form-qr.png`} alt="정보과제연구 사전 설문 구글 폼 QR 코드"
                style={{ width: 'min(240px, 60vw)', borderRadius: 14, border: '6px solid #f4fbf8', background: '#f4fbf8' }} />
              <a href={FORM_URL} target="_blank" rel="noopener"
                style={{
                  display: 'inline-block', padding: '13px 26px', borderRadius: 999,
                  background: 'var(--accent)', color: 'var(--accent-ink)', fontWeight: 800,
                  textDecoration: 'none', fontSize: 'clamp(14px, 1.6vw, 17px)',
                }}>
                사전 설문 열기 ↗
              </a>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--fg-muted)' }}>
                forms.gle/YOUR_FORM_ID · 전체 10문항 약 5분
              </span>
            </div>
          </Reveal>
        </div>
      </Slide>
    </Deck>
  );
}
