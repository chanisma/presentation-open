import { type CSSProperties } from 'react';
import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import Build from '../../../../src/deck/Build';
import Reveal from '../../../../src/deck/Reveal';
import Cover from '../../../../src/components/Cover';
import Split from '../../../../src/components/Split';
import {
  Scene,
  useSceneTime,
  interpolate,
  spring,
  riseIn,
  easeInOut,
} from '../../../../src/scene';

/* ── 인공지능 기초 · 2026-2 오리엔테이션 (9장) ───────────────────────
   plan: data/2026-2/인공지능기초/오리엔테이션/plan.md
   아크: 세 번의 파문(연대기 씬) → 알파고 10년 → 영상(왜 배우나)
        → 세 기둥 → 경험 3가지 → 핵심 가치(문제 정의) → 평가 → 사전 설문
   (사건 상세 3장은 2026-08-10 사용자 요청으로 삭제 — 연대기 씬이 개요 담당) */

const C = {
  cyan: '#38bdf8',
  violet: '#818cf8',
  coral: '#fb7185',
  amber: '#fbbf24',
};

const BASE = 'data/2026-2/인공지능기초/오리엔테이션';
const FORM_URL = 'https://forms.gle/YOUR_FORM_ID';
const VIDEO_URL = 'https://www.youtube.com/watch?v=xc-pJreuku4';

const card: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: 18,
  padding: 'clamp(16px, 2vw, 26px)',
};

const kw: CSSProperties = { wordBreak: 'keep-all' };

/* ── S2 — 10년, 세 번의 파문 (연대기 축 + 순차 파문) ── */
function RippleScene() {
  const t = useSceneTime();
  const events = [
    { x: 250, year: '2016', label: '알파고', sub: '영향력', start: 1.1, max: 62, color: C.cyan },
    { x: 600, year: '2020', label: '이루다', sub: '윤리', start: 1.9, max: 80, color: C.coral },
    { x: 950, year: '2022', label: '생성형 AI', sub: '대중화', start: 2.7, max: 100, color: C.violet },
  ];
  const axis = interpolate(t, [0.35, 1.5], [0, 1], easeInOut);
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', paddingTop: 'clamp(40px, 9vh, 90px)' }}>
        <div className="kicker" style={riseIn(t, 0.1)}>인공지능 기초 · 오리엔테이션</div>
        <h2 className="display" style={{ margin: '14px auto 0', ...kw, ...riseIn(t, 0.3) }}>
          10년, <span className="accent-text">세 번의 파문</span>
        </h2>
        <p className="lead" style={{ marginInline: 'auto', marginTop: 12, ...riseIn(t, 0.55) }}>
          세 사건이 인공지능을 뉴스에서 일상으로 데려왔다.
        </p>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '9vh' }}>
        <svg viewBox="0 0 1200 460" style={{ width: 'min(1150px, 94vw)', height: 'auto', overflow: 'visible' }}>
          {/* 연대기 축 — 좌→우로 그려짐 */}
          <line x1={60} y1={300} x2={60 + 1080 * axis} y2={300} stroke="var(--line)" strokeWidth={2.5} />
          <polygon
            points="1148,300 1132,292 1132,308"
            fill="var(--line)"
            opacity={axis >= 1 ? 1 : 0}
          />
          {events.map((e) => {
            const appear = spring(t, e.start, 0.8);
            return (
              <g key={e.year}>
                {/* 파문 — 주기적 동심원 (t의 순수 함수) */}
                {[0, 1, 2].map((i) => {
                  const local = Math.max(0, t - e.start);
                  const r = ((local * 34 + i * (e.max / 3)) % e.max);
                  const op = local > 0 ? (1 - r / e.max) * 0.6 : 0;
                  return (
                    <circle key={i} cx={e.x} cy={300} r={8 + r} fill="none"
                      stroke={e.color} strokeWidth={2.5} opacity={op} />
                  );
                })}
                <circle cx={e.x} cy={300} r={9 * appear} fill={e.color} />
                <g opacity={Math.min(1, appear * 1.2)} transform={`translate(0 ${(1 - appear) * 18})`}>
                  <text x={e.x} y={104} textAnchor="middle" fill={e.color}
                    style={{ font: '800 46px var(--font-mono, monospace)', letterSpacing: '-0.02em' }}>
                    {e.year}
                  </text>
                  <text x={e.x} y={148} textAnchor="middle" fill="var(--fg)"
                    style={{ font: '700 28px var(--font-body, sans-serif)' }}>
                    {e.label}
                  </text>
                  <text x={e.x} y={182} textAnchor="middle" fill="var(--fg-muted)"
                    style={{ font: '500 19px var(--font-body, sans-serif)' }}>
                    인공지능의 {e.sub}
                  </text>
                  {/* 라벨→축 연결 스템 */}
                  <line x1={e.x} y1={196} x2={e.x} y2={300 - 14} stroke={`color-mix(in srgb, ${e.color} 45%, transparent)`} strokeWidth={2} strokeDasharray="3 6" />
                </g>
              </g>
            );
          })}
          <text x={60} y={348} fill="var(--fg-muted)" style={{ font: '500 16px var(--font-body, sans-serif)' }}
            opacity={interpolate(t, [0.5, 1], [0, 1])}>
            2015
          </text>
          <text x={1140} y={348} textAnchor="end" fill="var(--fg-muted)"
            style={{ font: '500 16px var(--font-body, sans-serif)' }} opacity={axis >= 1 ? 1 : 0}>
            오늘
          </text>
        </svg>
      </div>
    </div>
  );
}

/* ── S10 — 기술보다 중요한 것 (지도의 새 길) ── */
function MapScene() {
  const t = useSceneTime();
  const QUESTION = '우리 학교 급식 줄, 왜 길까?';
  const typeStart = 2.3;
  const cps = 10;
  const shown = Math.min(QUESTION.length, Math.max(0, Math.floor((t - typeStart) * cps)));
  const typed = shown >= QUESTION.length;
  const roadDraw = interpolate(t, [0.5, 1.7], [0, 1], easeInOut);
  const newPath = interpolate(t, [4.4, 6.2], [0, 1], easeInOut);
  const qOp = interpolate(t, [1.1, 1.5], [0, 1]) * interpolate(t, [2.1, 2.5], [1, 0]);
  const flagUp = spring(t, 1.6, 0.8);

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', paddingTop: 'clamp(34px, 7vh, 72px)' }}>
        <div className="kicker" style={riseIn(t, 0.05)}>이 수업의 진짜 목표</div>
        <h2 className="display" style={{ margin: '12px auto 0', ...kw, ...riseIn(t, 0.2) }}>
          기술보다 <span className="accent-text">중요한 것</span>
        </h2>
        <p className="lead" style={{ marginInline: 'auto', marginTop: 10, ...kw, ...riseIn(t, 0.45) }}>
          AI는 답을 빨리 찾는다. 그러나 <strong style={{ color: 'var(--fg)' }}>어떤 문제를 풀지</strong>는 사람이 정한다.
        </p>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '3vh' }}>
        <svg viewBox="0 0 1200 520" style={{ width: 'min(1100px, 95%)', height: 'auto', overflow: 'visible' }}>
          {/* 지도 판 */}
          <rect x={90} y={30} width={1020} height={430} rx={26}
            fill="var(--surface)" stroke="var(--line)" strokeWidth={1.5}
            opacity={interpolate(t, [0.15, 0.7], [0, 1])} />
          {/* 등고선 힌트 */}
          <g opacity={interpolate(t, [0.4, 1], [0, 0.35])} fill="none" stroke="var(--line)" strokeWidth={1.2}>
            <ellipse cx={780} cy={130} rx={110} ry={44} />
            <ellipse cx={780} cy={130} rx={64} ry={24} />
            <ellipse cx={330} cy={380} rx={90} ry={34} />
          </g>
          {/* 기존 도로 (AI가 이미 잘 아는 길) — 회색 점선 */}
          <g fill="none" stroke="var(--fg-muted)" strokeWidth={2.5} strokeDasharray="7 9" opacity={0.5}>
            <path d="M150 120 H 620 V 260 H 1010" pathLength={1}
              style={{ strokeDasharray: 1, strokeDashoffset: 1 - roadDraw, transition: 'none' }} />
            <path d="M150 300 H 430 V 420 H 900" pathLength={1}
              style={{ strokeDasharray: 1, strokeDashoffset: 1 - Math.max(0, roadDraw - 0.15) / 0.85 }} />
          </g>
          {/* 목적지 깃발 */}
          <g transform={`translate(1010 ${170 + (1 - flagUp) * 20})`} opacity={Math.min(1, flagUp * 1.3)}>
            <line x1={0} y1={0} x2={0} y2={-64} stroke="var(--fg)" strokeWidth={4} strokeLinecap="round" />
            <path d="M2 -64 L46 -50 L2 -36 Z" fill={C.amber} />
            <text x={-4} y={26} textAnchor="middle" fill="var(--fg-muted)"
              style={{ font: '600 15px var(--font-body, sans-serif)' }}>해결</text>
          </g>
          {/* 출발점 — 물음표 → 문제 문장 */}
          <text x={225} y={392} textAnchor="middle" fill={C.coral} opacity={qOp}
            style={{ font: '800 84px var(--font-head, sans-serif)' }}>?</text>
          <g opacity={interpolate(t, [typeStart - 0.15, typeStart + 0.15], [0, 1])}>
            <rect x={128} y={330} width={430} height={78} rx={16}
              fill="var(--bg)" stroke={typed ? C.cyan : 'var(--line)'} strokeWidth={1.8}
              style={{ filter: typed ? `drop-shadow(0 0 14px color-mix(in srgb, ${C.cyan} 35%, transparent))` : 'none' }} />
            <text x={152} y={378} fill="var(--fg)" style={{ font: '700 27px var(--font-body, sans-serif)' }}>
              {QUESTION.slice(0, shown)}
              {!typed && <tspan fill={C.cyan}>▍</tspan>}
            </text>
            <text x={152} y={322} fill={C.cyan} style={{ font: '700 15px var(--font-body, sans-serif)' }}
              opacity={interpolate(t, [typeStart, typeStart + 0.4], [0, 1])}>
              문제 정의
            </text>
          </g>
          {/* 새 길 — 문제 문장에서 깃발로 (지도에 없던 경로, 중앙 통과) */}
          <path d="M560 356 C 700 340, 720 260, 800 220 S 960 190, 1006 178"
            pathLength={1} fill="none" stroke="url(#pathGrad)" strokeWidth={7} strokeLinecap="round"
            style={{ strokeDasharray: 1, strokeDashoffset: 1 - newPath }} />
          <defs>
            <linearGradient id="pathGrad" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor={C.cyan} />
              <stop offset="100%" stopColor={C.amber} />
            </linearGradient>
          </defs>
          {/* 도착 펄스 */}
          {newPath >= 1 && (
            <circle cx={1006} cy={178} r={10 + ((t * 18) % 22)} fill="none" stroke={C.amber}
              strokeWidth={2.5} opacity={0.8 - (((t * 18) % 22) / 22) * 0.8} />
          )}
          <text x={600} y={498} textAnchor="middle" fill="var(--fg-muted)"
            style={{ font: '500 17px var(--font-body, sans-serif)' }}
            opacity={interpolate(t, [5.6, 6.4], [0, 1])}>
            좋은 문제를 찾는 사람이, 지도에 없던 길을 만든다
          </text>
        </svg>
      </div>
    </div>
  );
}

/* ── 정적 보조 컴포넌트 ── */

function QuoteCard({
  tone, era, text, cite, lit, img, imgAlt, imgCredit,
}: {
  tone: string; era: string; text: string; cite: string; lit?: boolean;
  img?: string; imgAlt?: string; imgCredit?: string;
}) {
  return (
    <div
      style={{
        ...card,
        flex: 1,
        minWidth: 'min(300px, 100%)',
        borderColor: lit ? `color-mix(in srgb, ${tone} 55%, transparent)` : 'var(--line)',
        boxShadow: lit ? `0 0 34px color-mix(in srgb, ${tone} 16%, transparent)` : 'none',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 14,
          color: lit ? tone : 'var(--fg-muted)', border: `1px solid ${lit ? `color-mix(in srgb, ${tone} 55%, transparent)` : 'var(--line)'}`,
          borderRadius: 999, padding: '4px 12px',
        }}>{era}</span>
        {img && (
          <img src={img} alt={imgAlt}
            style={{ width: 46, height: 58, objectFit: 'cover', borderRadius: 9, border: '1px solid var(--line)' }} />
        )}
      </div>
      <p style={{ fontSize: 'clamp(16px, 1.9vw, 21px)', lineHeight: 1.6, color: lit ? 'var(--fg)' : 'var(--fg-muted)', fontWeight: 600, flex: 1, ...kw }}>
        “{text}”
      </p>
      <span style={{ fontSize: 13, color: 'var(--fg-muted)' }}>
        {cite}
        {imgCredit && <span style={{ fontSize: 10.5, opacity: 0.7 }}> · {imgCredit}</span>}
      </span>
    </div>
  );
}

function PillarDiagram() {
  return (
    <svg viewBox="0 0 900 430" style={{ width: 'min(820px, 88vw)', height: 'auto' }} role="img"
      aria-label="파이썬 프로그래밍 기초 위에 인공지능과 피지컬 컴퓨팅 기둥이 인공지능 기초를 떠받치는 구조">
      <defs>
        <linearGradient id="beamGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="48%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>
      {/* 상판 */}
      <rect x={120} y={40} width={660} height={64} rx={14} fill="url(#beamGrad)" />
      <text x={450} y={80} textAnchor="middle" fill="#041325"
        style={{ font: '800 26px var(--font-head, sans-serif)' }}>인공지능 기초</text>
      {/* 두 기둥 */}
      {[
        { x: 205, label: '인공지능', desc: '원리를 이해하고\n직접 만든다', color: C.cyan },
        { x: 545, label: '피지컬 컴퓨팅', desc: '코드가 현실을\n움직인다', color: C.violet },
      ].map((p) => (
        <g key={p.label}>
          <rect x={p.x} y={104} width={150} height={196} fill="var(--surface)"
            stroke={`color-mix(in srgb, ${p.color} 50%, transparent)`} strokeWidth={2} />
          <text x={p.x + 75} y={168} textAnchor="middle" fill={p.color}
            style={{ font: '800 23px var(--font-body, sans-serif)' }}>{p.label}</text>
          {p.desc.split('\n').map((line, i) => (
            <text key={i} x={p.x + 75} y={206 + i * 26} textAnchor="middle" fill="var(--fg-muted)"
              style={{ font: '500 16px var(--font-body, sans-serif)' }}>{line}</text>
          ))}
        </g>
      ))}
      {/* 기둥 사이 연결선 */}
      <line x1={355} y1={200} x2={545} y2={200} stroke="var(--line)" strokeWidth={2} strokeDasharray="6 8" />
      <text x={450} y={190} textAnchor="middle" fill="var(--fg-muted)"
        style={{ font: '500 14px var(--font-body, sans-serif)' }}>서로 연결</text>
      {/* 기초 슬래브 — 파이썬 */}
      <rect x={120} y={300} width={660} height={86} rx={14} fill="var(--surface-2, var(--surface))"
        stroke={`color-mix(in srgb, ${C.amber} 55%, transparent)`} strokeWidth={2.5} />
      <text x={450} y={338} textAnchor="middle" fill={C.amber}
        style={{ font: '800 25px var(--font-body, sans-serif)' }}>파이썬 프로그래밍</text>
      <text x={450} y={368} textAnchor="middle" fill="var(--fg-muted)"
        style={{ font: '500 16px var(--font-body, sans-serif)' }}>생각을 코드로 옮기는 공용어 — 두 기둥이 이 위에 선다</text>
      <text x={450} y={418} textAnchor="middle" fill="var(--fg-muted)"
        style={{ font: '500 14px var(--font-body, sans-serif)' }}>세 기둥은 따로가 아니라 한 구조물이다</text>
    </svg>
  );
}

/* ── 덱 본체 ── */
export default function AiBasicsOrientationDeck() {
  return (
    <Deck>
      {/* S1 표지 */}
      <Cover
        nav="표지"
        notes="여러분, 이 수업 이름이 왜 '인공지능'이 아니라 '인공지능 기초'일까요? 오늘 그 답부터 찾아봅시다."
        kicker="2026-2학기 · 샘플고등학교"
        title={<span style={kw}>인공지능 <span className="accent-text">기초</span>, 첫 시간</span>}
        subtitle={<span style={kw}>왜 배우는가 → 무엇을 배우는가 → 어떻게 평가하는가 — 오늘 45분의 여정</span>}
        foot="오리엔테이션 · 인공지능 시대를 여는 세 가지 사건과 함께"
      />

      {/* S2 연대기 씬 */}
      <Slide full nav="세 번의 파문" notes="10년 동안 무슨 일이 있었길래 여러분 시간표에 이 과목이 생겼을까요? 딱 세 장면만 봅시다.">
        <Scene><RippleScene /></Scene>
      </Slide>

      {/* S6 알파고 10년 — 어록 대비 빌드 */}
      <Slide nav="알파고 10년" notes="패배를 겪은 당사자가 10년 뒤에 내린 결론이 '협업'입니다. 그 시대에 우리는 무엇을 공부해야 할까요? 영상으로 확인해 봅시다.">
        <div style={{ width: 'min(1100px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 2.2vh, 26px)', textAlign: 'center' }}>
          <Reveal>
            <div className="kicker">알파고 10년 · KBS 뉴스광장 2026.3.10</div>
            <h2 className="headline" style={{ marginInline: 'auto', ...kw }}>
              같은 사람, <span className="accent-text">달라진 대답</span>
            </h2>
          </Reveal>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(14px, 2vw, 24px)', alignItems: 'stretch', textAlign: 'left' }}>
            <Build at={1} style={{ flex: '1 1 min(320px, 100%)', display: 'flex' }}>
              <QuoteCard tone={C.coral} era="2016"
                text="바둑에서 AI를 사람이 이긴다는 건, 사실 불가능한 것 같아요."
                cite="이세돌 · 알파고 대국을 돌아보며"
                img={`${BASE}/images/lee-sedol-2016.jpg`} imgAlt="이세돌 9단 (2016)"
                imgCredit="사진: LG전자 · CC BY 2.0 · Commons" />
            </Build>
            <Build at={2} style={{ flex: '1 1 min(320px, 100%)', display: 'flex' }}>
              <QuoteCard tone={C.cyan} era="2026" lit
                text="인간만이 할 수 있는 것들은 아직도 너무 많다. 무궁무진하다. 내가 AI와 같이 협업했을 때 훨씬 더 시너지가 날 것이다."
                cite="이세돌 · 다시 AI 앞에 서서" />
            </Build>
          </div>
          <Build at={3}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 'clamp(16px, 2.4vw, 30px)' }}>
              <div style={{ textAlign: 'center' }}>
                <img src={`${BASE}/images/alphago-game4.jpg`} alt="이세돌 대 알파고 제4국 기보 — 백 78수"
                  style={{ width: 'clamp(120px, 14vw, 168px)', borderRadius: 12, border: '1px solid var(--line)', display: 'block' }} />
                <span style={{ fontSize: 10.5, color: 'var(--fg-muted)', opacity: 0.7 }}>기보: Wesalius · CC BY-SA 4.0 · Commons</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, textAlign: 'left', maxWidth: 460 }}>
                <div style={{ fontWeight: 800, fontSize: 'clamp(15px, 1.7vw, 18px)', ...kw }}>
                  제4국 — 인간이 거둔 <span className="accent-text">단 한 번의 승리</span>
                </div>
                <p style={{ color: 'var(--fg-muted)', fontSize: 'clamp(13px, 1.5vw, 15px)', lineHeight: 1.65, ...kw }}>
                  백 78수, 훗날 "신의 한 수"로 불린 그 수로 이세돌은 5번기 중 유일한 1승을 지켜냈다.
                  그리고 10년 — AI는 30여 분 만에 바둑 앱을 만드는 <strong style={{ color: 'var(--fg)' }}>에이전트</strong>가 됐고,
                  그의 대답은 <strong style={{ color: 'var(--fg)' }}>협업</strong>으로 바뀌었다.
                </p>
              </div>
            </div>
          </Build>
        </div>
      </Slide>

      {/* S7 영상 */}
      <Split
        nav="영상"
        notes="보면서 두 가지만 체크하세요 — 뭘 그만두라는지, 뭘 기르라는지. 보고 나서 이 수업이 어느 쪽인지 이야기해 줄게요."
        kicker="같이 볼 영상 · EBS 다큐"
        title={<span style={kw}>AI 시대의 <span className="accent-text">공부법</span></span>}
        body={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ color: 'var(--fg-muted)', lineHeight: 1.7, ...kw }}>
              박태웅 의장이 말하는, 인공지능 시대에 <strong style={{ color: 'var(--fg)' }}>지금 당장 그만두어야 하는 공부법</strong>.
              보면서 두 가지를 체크하세요.
            </p>
            {[
              '어떤 공부가 이제 "쓸모없어진다"고 말하는가?',
              '대신 어떤 능력을 기르라고 말하는가?',
            ].map((q, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{
                  flex: 'none', width: 26, height: 26, borderRadius: 8, background: 'var(--accent)',
                  color: 'var(--accent-ink)', fontWeight: 800, fontSize: 14,
                  display: 'grid', placeItems: 'center',
                }}>{i + 1}</span>
                <p style={{ fontWeight: 600, lineHeight: 1.5, ...kw }}>{q}</p>
              </div>
            ))}
          </div>
        }
        media={
          <a href={VIDEO_URL} target="_blank" rel="noopener"
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 22, width: '100%', height: '100%', minHeight: 300, textDecoration: 'none',
              background: `radial-gradient(circle at 50% 40%, color-mix(in srgb, ${C.cyan} 20%, transparent), transparent 62%), var(--surface)`,
              padding: '28px 26px', textAlign: 'center',
            }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: C.cyan, fontWeight: 700, letterSpacing: '0.08em' }}>
              EBS 다큐 · YouTube ↗
            </span>
            <span style={{
              width: 92, height: 92, borderRadius: '50%', background: 'var(--accent)',
              display: 'grid', placeItems: 'center', boxShadow: 'var(--glow)',
            }}>
              <span style={{
                width: 0, height: 0, marginLeft: 7,
                borderTop: '17px solid transparent', borderBottom: '17px solid transparent',
                borderLeft: '28px solid var(--accent-ink)',
              }} />
            </span>
            <span style={{ maxWidth: 420, color: 'var(--fg)', fontWeight: 800, lineHeight: 1.55, fontSize: 'clamp(15px, 1.7vw, 19px)', textDecoration: 'underline', textDecorationColor: `color-mix(in srgb, ${C.cyan} 60%, transparent)`, textUnderlineOffset: 5, ...kw }}>
              “지금 당장 그만두어야 하는 공부법” — 박태웅 의장 (클릭해서 시청)
            </span>
          </a>
        }
      />

      {/* S8 세 기둥 */}
      <Slide nav="세 기둥" notes="세 개는 따로 노는 단원이 아닙니다. 파이썬이라는 공용어 위에 인공지능과 피지컬 컴퓨팅이 올라갑니다.">
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px, 1.6vh, 20px)', textAlign: 'center' }}>
          <Reveal>
            <div className="kicker">무엇을 배우는가</div>
            <h2 className="headline" style={{ marginInline: 'auto', ...kw }}>
              이 수업의 <span className="accent-text">세 기둥</span>
            </h2>
          </Reveal>
          <Reveal><PillarDiagram /></Reveal>
        </div>
      </Slide>

      {/* S9 경험 계단 */}
      <Slide nav="경험" notes="1학기가 끝나면 여러분 손으로 만든 프로그램과 AI가 남습니다. 구경꾼은 없습니다.">
        <div style={{ width: 'min(1060px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 2.4vh, 30px)', textAlign: 'center' }}>
          <Reveal>
            <div className="kicker">무엇을 경험하는가</div>
            <h2 className="headline" style={{ marginInline: 'auto', ...kw }}>
              여러분이 <span className="accent-text">직접</span> 해 볼 것들
            </h2>
          </Reveal>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(12px, 1.8vw, 22px)', alignItems: 'flex-end', justifyContent: 'center' }}>
            {[
              { n: 1, at: 1, lift: 0, color: C.cyan, title: '문제를 코드로 풀기', d: '프로그래밍으로 일상의 간단한 문제를 직접 해결한다.' },
              { n: 2, at: 2, lift: 26, color: C.violet, title: '인공지능 만들어 보기', d: '데이터를 모으고 학습시켜, 나만의 AI를 만든다.' },
              { n: 3, at: 3, lift: 52, color: C.amber, title: '인공지능 잘 사용하기', d: '좋은 질문을 던지고, 결과를 검증하며 협업한다.' },
            ].map((s) => (
              <Build key={s.n} at={s.at}>
                <div style={{
                  ...card, width: 'min(300px, 86vw)', textAlign: 'left',
                  marginBottom: `clamp(0px, ${s.lift / 10}vh, ${s.lift}px)`,
                  borderColor: `color-mix(in srgb, ${s.color} 45%, transparent)`,
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 22, color: s.color }}>{s.n}</span>
                  <div style={{ fontWeight: 800, fontSize: 'clamp(16px, 1.8vw, 19px)', ...kw }}>{s.title}</div>
                  <p style={{ color: 'var(--fg-muted)', fontSize: 14, lineHeight: 1.6, ...kw }}>{s.d}</p>
                </div>
              </Build>
            ))}
          </div>
          <Build at={3}>
            <p style={{ color: 'var(--fg-muted)', fontSize: 'clamp(13px, 1.5vw, 16px)', marginInline: 'auto', ...kw }}>
              해결하기 → 만들기 → 잘 쓰기, 한 계단씩.
            </p>
          </Build>
        </div>
      </Slide>

      {/* S10 핵심 가치 씬 */}
      <Slide full nav="핵심" notes="10년 전엔 답을 잘 찾는 사람이 뛰어났습니다. 이제 답은 AI가 빨리 찾아요. 좋은 질문, 진짜 문제를 찾는 사람 — 그게 이 수업이 기르려는 사람입니다.">
        <Scene><MapScene /></Scene>
      </Slide>

      {/* S11 평가 */}
      <Slide nav="평가" notes="벼락치기가 통하는 구조가 아닙니다. 매 시간 활동이 쌓여서 70%가 됩니다 — 오늘부터요.">
        <div style={{ width: 'min(920px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 2.6vh, 30px)', textAlign: 'center' }}>
          <Reveal>
            <div className="kicker">어떻게 평가하는가</div>
            <h2 className="headline" style={{ marginInline: 'auto', ...kw }}>
              평가의 <span className="accent-text">70%</span>는<br />시험지 밖에 있다
            </h2>
          </Reveal>
          <Reveal>
            <div style={{ display: 'flex', width: '100%', borderRadius: 18, overflow: 'hidden', border: '1px solid var(--line)' }}>
              <div style={{ flex: 3, padding: 'clamp(18px, 2.4vh, 30px) 10px', background: 'var(--surface)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 'clamp(26px, 3.4vw, 44px)', color: 'var(--fg-muted)' }}>30%</div>
                <div style={{ fontWeight: 700, color: 'var(--fg-muted)', fontSize: 14 }}>기말고사</div>
              </div>
              <div style={{ flex: 7, padding: 'clamp(18px, 2.4vh, 30px) 10px', background: 'var(--accent)', color: 'var(--accent-ink)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 'clamp(26px, 3.4vw, 44px)' }}>70%</div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>수행평가</div>
              </div>
            </div>
          </Reveal>
          <Build at={1}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'flex-end' }}>
              {[
                { t: '프로젝트', d: '문제를 정의하고 해결까지 — 한 학기의 대표 결과물' },
                { t: '수업 활동', d: '매 시간의 참여와 기록이 그대로 쌓인다' },
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
              벼락치기 대신 — <strong style={{ color: 'var(--fg)' }}>오늘부터의 참여</strong>가 평가입니다.
            </p>
          </Build>
        </div>
      </Slide>

      {/* S12 사전 설문 CTA */}
      <Slide nav="사전 설문" notes="오늘 들은 것 중 기대되는 것, 걱정되는 것을 그대로 적어 주세요. 다음 시간 수업이 여러분 답에 맞춰 조정됩니다.">
        <div style={{
          width: 'min(1060px, 100%)', marginInline: 'auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))',
          gap: 'clamp(20px, 3vw, 44px)', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Reveal>
              <div className="kicker">시작하기 전에</div>
              <h2 className="headline" style={kw}>
                여러분 이야기를 <span className="accent-text">들려주세요</span>
              </h2>
            </Reveal>
            <Reveal>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['오늘 만난 것', '세 가지 사건 — 영향력 · 윤리 · 대중화'],
                  ['앞으로 배울 것', '인공지능 · 파이썬 · 피지컬 컴퓨팅'],
                  ['가장 중요한 것', '문제를 직접 정의하고, 해법을 직접 찾는 힘'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                    <span style={{ flex: 'none', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 800, color: C.cyan, width: 92 }}>{k}</span>
                    <span style={{ color: 'var(--fg-muted)', fontSize: 15, ...kw }}>{v}</span>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal>
              <p style={{ color: 'var(--fg-muted)', lineHeight: 1.7, ...kw }}>
                5분이면 됩니다. 기대되는 것, 걱정되는 것을 그대로 적어 주세요 —
                <strong style={{ color: 'var(--fg)' }}> 다음 수업이 여러분의 답에 맞춰 조정됩니다.</strong>
              </p>
            </Reveal>
          </div>
          <Reveal>
            <div style={{ ...card, textAlign: 'center', padding: 'clamp(22px, 3vh, 36px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <img src={`${BASE}/images/form-qr.png`} alt="사전 설문 구글 폼 QR 코드"
                style={{ width: 'min(240px, 60vw)', borderRadius: 14, border: '6px solid #f5f8ff', background: '#f5f8ff' }} />
              <a href={FORM_URL} target="_blank" rel="noopener"
                style={{
                  display: 'inline-block', padding: '13px 26px', borderRadius: 999,
                  background: 'var(--accent)', color: 'var(--accent-ink)', fontWeight: 800,
                  textDecoration: 'none', fontSize: 'clamp(14px, 1.6vw, 17px)',
                }}>
                사전 설문 열기 ↗
              </a>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--fg-muted)' }}>
                forms.gle/YOUR_FORM_ID
              </span>
            </div>
          </Reveal>
        </div>
      </Slide>
    </Deck>
  );
}
