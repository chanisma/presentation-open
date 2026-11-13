import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import {
  Scene,
  useSceneTime,
  interpolate,
  spring,
  riseIn,
  easeInOut,
} from '../../../../src/scene';

/* ── 씬 데모 — 결정론적 타임라인 씬의 React/TS 저작 예시 ──────────────
   dynamic-scene-builder(HTML SceneMotion)의 후속 구조. 모든 모션은
   useSceneTime()이 주는 t(초)의 순수 함수다. 새 씬 덱을 만들 때 이
   파일을 패턴 참고용으로 사용한다. */

const C = { mint: '#4fe5b0', blue: '#5aa9ff', coral: '#ff7a5c', violet: '#a78bfa' };

/* 1 — 시네마틱 타이틀: 스프링 캐스케이드 + 궤도 글로우 */
function TitleScene() {
  const t = useSceneTime();
  const orbs = [
    { color: C.mint, r: 260, speed: 0.35, size: 340, phase: 0 },
    { color: C.blue, r: 320, speed: -0.22, size: 280, phase: 2.2 },
    { color: C.violet, r: 210, speed: 0.28, size: 240, phase: 4.1 },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {orbs.map((o, i) => {
        const a = t * o.speed + o.phase;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `calc(50% + ${Math.cos(a) * o.r}px)`,
              top: `calc(50% + ${Math.sin(a) * o.r * 0.55}px)`,
              width: o.size,
              height: o.size,
              marginLeft: -o.size / 2,
              marginTop: -o.size / 2,
              borderRadius: '50%',
              background: `radial-gradient(circle, color-mix(in srgb, ${o.color} 22%, transparent), transparent 70%)`,
              filter: 'blur(6px)',
              opacity: interpolate(t, [0.2, 1.6], [0, 1]),
            }}
          />
        );
      })}
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <div className="kicker" style={riseIn(t, 0.15)}>
          Scene Runtime · 결정론적 타임라인
        </div>
        <h1 className="display" style={{ margin: '14px 0', ...riseIn(t, 0.4) }}>
          시간이 곧 <span className="accent-text">장면</span>이 된다
        </h1>
        <p className="lead" style={{ marginInline: 'auto', ...riseIn(t, 0.7) }}>
          모든 모션은 t의 순수 함수 — 같은 t, 같은 화면.
        </p>
      </div>
    </div>
  );
}

/* 2 — 카운트업 스탯: interpolate로 수치·게이지 동기 구동 */
function StatScene() {
  const t = useSceneTime();
  const stats = [
    { label: '수업 덱', to: 68, color: C.mint, delay: 0.2 },
    { label: '라이브 문항 유형', to: 6, color: C.blue, delay: 0.5 },
    { label: '한 번의 저작, 모든 화면', to: 100, suffix: '%', color: C.violet, delay: 0.8 },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(18px,3vw,44px)', padding: '0 6vw' }}>
      {stats.map((s, i) => {
        const v = Math.round(interpolate(t, [s.delay, s.delay + 1.4], [0, s.to], easeInOut));
        const g = interpolate(t, [s.delay, s.delay + 1.4], [0, 1], easeInOut);
        return (
          <div key={i} className="mat" style={{ flex: 1, maxWidth: 320, padding: 'clamp(20px,2.6vw,34px)', borderRadius: 22, textAlign: 'center', ...riseIn(t, s.delay - 0.1) }}>
            <div style={{ fontSize: 'clamp(44px,5.5vw,72px)', fontWeight: 800, fontFamily: 'var(--font-mono)', color: s.color, letterSpacing: '-0.03em' }}>
              {v}
              {s.suffix ?? ''}
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'var(--surface-2)', margin: '14px 0', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${g * 100}%`, background: s.color, borderRadius: 2 }} />
            </div>
            <div style={{ color: 'var(--fg-muted)', fontSize: 14 }}>{s.label}</div>
          </div>
        );
      })}
    </div>
  );
}

/* 3 — 궤도 다이어그램: 허브를 도는 세 위성 (각도 = t의 함수) */
function OrbitScene() {
  const t = useSceneTime();
  const sats = [
    { label: 'React 덱', color: C.mint, phase: 0 },
    { label: '레거시 뷰어', color: C.blue, phase: (Math.PI * 2) / 3 },
    { label: '라이브 세션', color: C.coral, phase: (Math.PI * 4) / 3 },
  ];
  const R = 190;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: R * 2 + 160, height: R * 1.3 + 160 }}>
        <div
          style={{
            position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%,-50%) scale(${spring(t, 0.2, 0.9)})`,
            padding: '18px 30px', borderRadius: 999, background: 'var(--accent)', color: 'var(--accent-ink)',
            fontWeight: 800, fontSize: 'clamp(17px,2vw,22px)', boxShadow: 'var(--glow)', whiteSpace: 'nowrap',
          }}
        >
          bolt 덱 엔진
        </div>
        {sats.map((s, i) => {
          const a = t * 0.5 + s.phase;
          const appear = spring(t, 0.6 + i * 0.25, 0.9);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `calc(50% + ${Math.cos(a) * R}px)`,
                top: `calc(50% + ${Math.sin(a) * R * 0.62}px)`,
                transform: `translate(-50%,-50%) scale(${appear})`,
                opacity: Math.min(1, appear * 1.3),
                padding: '10px 20px', borderRadius: 999,
                background: 'var(--surface)', border: `1px solid color-mix(in srgb, ${s.color} 55%, transparent)`,
                color: s.color, fontWeight: 700, fontSize: 'clamp(13px,1.5vw,16px)', whiteSpace: 'nowrap',
                boxShadow: `0 0 22px color-mix(in srgb, ${s.color} 25%, transparent)`,
              }}
            >
              {s.label}
            </div>
          );
        })}
      </div>
      <div className="kicker" style={{ position: 'absolute', top: 'clamp(28px,7vh,64px)', left: 0, right: 0, textAlign: 'center', ...riseIn(t, 0.1) }}>
        하나의 엔진 · 모든 수업
      </div>
    </div>
  );
}

/* 4 — 마무리: 스프링 캐스케이드 요약 */
function OutroScene() {
  const t = useSceneTime();
  const lines = [
    '씬은 data/<과목>/<수업>/deck.tsx 에 저작한다',
    '모션은 useSceneTime() → interpolate / spring',
    '썸네일·그리드에서는 완료 상태로 정지(freeze)된다',
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, textAlign: 'center', padding: '0 8vw' }}>
      <h2 className="headline" style={riseIn(t, 0.1)}>
        새 씬을 만드는 <span className="accent-text">세 가지 규칙</span>
      </h2>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10, width: 'min(640px, 90%)' }}>
        {lines.map((line, i) => (
          <div key={i} className="mat" style={{ padding: '14px 22px', borderRadius: 14, display: 'flex', gap: 14, alignItems: 'center', textAlign: 'left', ...riseIn(t, 0.4 + i * 0.25) }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--primary)' }}>{i + 1}</span>
            <span style={{ color: 'var(--fg)', fontSize: 'clamp(14px,1.7vw,17px)' }}>{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SceneDemoDeck() {
  return (
    <Deck>
      <Slide full nav="타이틀" notes="씬 런타임 데모 — 모든 모션이 시간 t의 순수 함수임을 소개.">
        <Scene><TitleScene /></Scene>
      </Slide>
      <Slide full nav="카운트업" notes="interpolate로 수치와 게이지를 같은 타임라인에서 구동.">
        <Scene><StatScene /></Scene>
      </Slide>
      <Slide full nav="궤도" notes="각도를 t의 함수로 — 순환 모션. 허브와 세 위성.">
        <Scene><OrbitScene /></Scene>
      </Slide>
      <Slide full nav="규칙" notes="새 씬 덱을 만들 때의 세 가지 규칙 요약.">
        <Scene><OutroScene /></Scene>
      </Slide>
    </Deck>
  );
}
