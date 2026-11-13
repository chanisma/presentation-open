import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import Build from '../../../../src/deck/Build';
import Terminal from '../../../../src/components/Terminal';
import KenBurns from '../../../../src/components/KenBurns';
import {
  Scene,
  useSceneTime,
  interpolate,
  spring,
  riseIn,
} from '../../../../src/scene';

/* ── 혼합 저작 데모 — 한 페이지 안에서 여러 저작 방식 섞기 ──────────────
   연구 질문: "슬라이드 덱 하나에 다양한 방식을 섞을 수 있는가?"에 대한
   실증 덱. 프레임워크(src/) 무수정 — 현재 구조가 허용하는 조합만으로:

   1쪽  씬 타임라인(t) 배경  ×  정적 타이포
   2쪽  클릭 빌드(담화 진행)  ×  씬 타임라인(분위기 모션) — 두 축은 직교
   3쪽  NotebookLM 일러스트  ×  씬(Ken Burns)  ×  클릭(장 전환)
   4쪽  컴포넌트 라이브러리(Terminal)  ×  씬  ×  빌드 — 3방식 동시

   3쪽: NotebookLM 덱의 생성 이미지는 수업 폴더의 images/slide-NN.png로
   이미 파일로 존재한다 — URL만으로 네이티브 덱의 일급 시각 자산이 된다.
   레거시 재사용의 단위는 페이지(임베드)가 아니라 자산(이미지). */

const C = { mint: '#4fe5b0', blue: '#5aa9ff', coral: '#ff7a5c', amber: '#ffb45c' };

/* 1 — 타이틀: 씬 배경(궤도 글로우) 위에 정적 타이포 */
function TitleAmbient() {
  const t = useSceneTime();
  const orbs = [
    { color: C.amber, r: 300, speed: 0.3, size: 360, phase: 0 },
    { color: C.blue, r: 230, speed: -0.2, size: 280, phase: 2.4 },
    { color: C.mint, r: 350, speed: 0.16, size: 240, phase: 4.6 },
  ];
  return (
    <>
      {orbs.map((o, i) => {
        const a = t * o.speed + o.phase;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `calc(50% + ${Math.cos(a) * o.r}px)`,
              top: `calc(50% + ${Math.sin(a) * o.r * 0.5}px)`,
              width: o.size,
              height: o.size,
              marginLeft: -o.size / 2,
              marginTop: -o.size / 2,
              borderRadius: '50%',
              background: `radial-gradient(circle, color-mix(in srgb, ${o.color} 20%, transparent), transparent 70%)`,
              filter: 'blur(8px)',
              opacity: interpolate(t, [0.2, 1.6], [0, 1]),
            }}
          />
        );
      })}
    </>
  );
}

/* 2 — 우측 씬: 허브 "한 페이지" 주위를 세 방식이 공전 */
function MixOrbit() {
  const t = useSceneTime();
  const nodes = [
    { label: '클릭 빌드', color: C.blue, phase: 0 },
    { label: '씬 타임라인', color: C.mint, phase: (Math.PI * 2) / 3 },
    { label: 'HTML 임베드', color: C.coral, phase: (Math.PI * 4) / 3 },
  ];
  const R = 170;
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(-50%,-50%) scale(${spring(t, 0.2)})`,
          padding: '18px 26px',
          borderRadius: 18,
          background: 'var(--surface)',
          border: '1px solid var(--hair-2)',
          fontWeight: 800,
          fontSize: 'clamp(15px,1.8vw,19px)',
          boxShadow: 'var(--glow)',
          zIndex: 2,
        }}
      >
        한 페이지
      </div>
      {nodes.map((nd, i) => {
        const a = t * 0.4 + nd.phase;
        const s = spring(t, 0.5 + i * 0.2);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `calc(50% + ${Math.cos(a) * R}px)`,
              top: `calc(50% + ${Math.sin(a) * R * 0.62}px)`,
              transform: `translate(-50%,-50%) scale(${s})`,
              padding: '10px 16px',
              borderRadius: 999,
              background: 'var(--surface)',
              border: `1px solid color-mix(in srgb, ${nd.color} 55%, transparent)`,
              color: nd.color,
              fontWeight: 700,
              fontSize: 'clamp(12px,1.4vw,15px)',
              whiteSpace: 'nowrap',
              boxShadow: `0 0 20px color-mix(in srgb, ${nd.color} 22%, transparent)`,
            }}
          >
            {nd.label}
          </div>
        );
      })}
    </div>
  );
}

/* 3 — NotebookLM 일러스트 폴더 — KenBurns는 src/components 정식 컴포넌트 */
const NLM_IMG = 'data/2026-1/정보/2027프로그래밍선택과목/images';

function CaptionCluster() {
  const t = useSceneTime();
  return (
    <div
      style={{
        position: 'absolute',
        left: 'clamp(24px,5vw,72px)',
        right: 'clamp(24px,5vw,72px)',
        bottom: 'clamp(24px,6vh,56px)',
        textShadow: '0 1px 14px rgba(5,7,10,0.85)',
      }}
    >
      <div className="kicker" style={{ color: '#ffd9a8', ...riseIn(t, 0.2) }}>
        NotebookLM 일러스트 × 씬 × 클릭
      </div>
      <h2 className="headline" style={{ margin: '10px 0 8px', ...riseIn(t, 0.45) }}>
        손그림 한 장이 <span className="accent-text">무대가 된다</span>
      </h2>
      <p
        className="lead"
        style={{ maxWidth: 720, fontSize: 'clamp(14px,1.7vw,17px)', ...riseIn(t, 0.7) }}
      >
        수업 폴더의 images/slide-NN.png — 추출도 임베드도 없이 URL 한 줄.
        느린 줌·팬은 t의 순수 함수, 장 전환은 클릭이다.
      </p>
    </div>
  );
}

/* 4 — 코너 씬: 진행 게이지 (컴포넌트·빌드와 같은 페이지에서 t로 구동) */
function PulseGauge() {
  const t = useSceneTime();
  const p = interpolate(t % 4, [0, 3.2], [0, 1]);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div
        style={{
          flex: 1,
          height: 8,
          borderRadius: 999,
          background: 'var(--surface)',
          border: '1px solid var(--hair-2)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${p * 100}%`,
            height: '100%',
            background: 'var(--accent)',
            borderRadius: 999,
          }}
        />
      </div>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          color: 'var(--fg-muted)',
          minWidth: 44,
          textAlign: 'right',
        }}
      >
        t={String(Math.round(p * 100)).padStart(3, ' ')}%
      </span>
    </div>
  );
}

const mixModes = [
  {
    color: C.blue,
    title: '클릭 빌드 — 담화의 축',
    body: '<Build at={n}>은 발표자의 클릭으로 전개된다. 설명 순서가 곧 상태.',
  },
  {
    color: C.mint,
    title: '씬 타임라인 — 시간의 축',
    body: 'useSceneTime()의 t는 슬라이드 활성 후 계속 흐른다. 분위기·순환 모션 담당.',
  },
  {
    color: C.coral,
    title: '두 축은 직교한다',
    body: '클릭 상태와 t는 서로를 모른다 — 한 페이지에서 충돌 없이 공존.',
  },
];

export default function MixedDemoDeck() {
  return (
    <Deck>
      <Slide
        full
        nav="타이틀"
        notes="혼합 저작 데모 — 씬 배경 위 정적 타이포. 프레임워크 무수정으로 어디까지 섞이는지 보여주는 덱."
      >
        <Scene>
          <TitleAmbient />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '0 8vw',
            }}
          >
            <div className="kicker">혼합 저작 연구 · Framework 무수정</div>
            <h1 className="display" style={{ margin: '14px 0' }}>
              한 페이지, <span className="accent-text">여러 방식</span>
            </h1>
            <p className="lead" style={{ marginInline: 'auto' }}>
              씬 · 클릭 빌드 · 컴포넌트 · 레거시 HTML — 같은 슬라이드에서 만난다.
            </p>
          </div>
        </Scene>
      </Slide>

      <Slide
        full
        nav="클릭 × 시간"
        notes="왼쪽 카드는 클릭(빌드)으로 전개, 오른쪽 궤도는 t로 계속 돈다. 두 모션 시스템이 직교함을 보여주는 페이지."
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
          }}
        >
          <div
            style={{
              padding: '0 4vw',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 14,
            }}
          >
            <div className="kicker">두 개의 모션 축</div>
            <h2 className="headline" style={{ margin: '2px 0 10px' }}>
              클릭은 담화, <span className="accent-text">t는 분위기</span>
            </h2>
            {mixModes.map((m, i) => (
              <Build key={i} at={i + 1}>
                <div
                  className="mat"
                  style={{
                    padding: '14px 20px',
                    borderRadius: 14,
                    borderLeft: `3px solid ${m.color}`,
                  }}
                >
                  <div style={{ fontWeight: 800, marginBottom: 4, color: m.color }}>
                    {m.title}
                  </div>
                  <div style={{ color: 'var(--fg-muted)', fontSize: 'clamp(13px,1.5vw,15px)' }}>
                    {m.body}
                  </div>
                </div>
              </Build>
            ))}
          </div>
          <Scene>
            <MixOrbit />
          </Scene>
        </div>
      </Slide>

      <Slide
        full
        nav="NotebookLM 이미지"
        notes="NotebookLM이 생성한 수채화 일러스트(images/slide-NN.png)를 그대로 배경 자산으로. Ken Burns는 t의 순수 함수, 장 전환은 클릭(빌드 레이어 페이드). 3가지 방식이 이미지 한 장 위에서 만난다."
      >
        <Scene>
          <KenBurns src={`${NLM_IMG}/slide-01.png`} />
          <Build at={1} y={0} style={{ position: 'absolute', inset: 0 }}>
            <KenBurns src={`${NLM_IMG}/slide-02.png`} flip />
          </Build>
          <Build at={2} y={0} style={{ position: 'absolute', inset: 0 }}>
            <KenBurns src={`${NLM_IMG}/slide-03.png`} />
          </Build>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to top, rgba(5,7,10,0.92) 0%, rgba(5,7,10,0.6) 26%, transparent 58%)',
            }}
          />
          <CaptionCluster />
        </Scene>
      </Slide>

      <Slide
        full
        nav="3방식 동시"
        notes="Terminal 컴포넌트(라이브러리) + 클릭 빌드 + 씬 게이지가 한 페이지에. 마무리로 다음 단계(HtmlSlide 승격) 언급."
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            gridTemplateColumns: '1.1fr 1fr',
            alignItems: 'center',
            gap: '3vw',
            padding: '0 5vw',
          }}
        >
          <div>
            <Terminal
              title="zsh — 혼합 덱 저작"
              lines={[
                { type: 'you', text: '이 페이지, 방식이 몇 개야?' },
                { type: 'ai', text: '컴포넌트(Terminal) + 클릭 빌드 + 씬 게이지 — 3개.' },
                { type: 'cmd', text: 'npx tsc --noEmit && node test/merge-smoke.mjs' },
                { type: 'ok', text: '엔진 무수정 · 타입 통과 · 스모크 통과', cursor: true },
              ]}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="kicker">결론</div>
            <h2 className="headline" style={{ margin: '2px 0 8px' }}>
              페이지 안 혼합은 <span className="accent-text">이미 열려 있다</span>
            </h2>
            <Build at={1}>
              <p className="lead" style={{ fontSize: 'clamp(14px,1.7vw,17px)' }}>
                슬라이드는 임의의 React 엘리먼트 — 엔진은 내용을 모른다. 조합은
                저작자의 자유다.
              </p>
            </Build>
            <Build at={2}>
              <p style={{ color: 'var(--fg-muted)', fontSize: 'clamp(13px,1.5vw,15px)' }}>
                레거시 재사용의 단위는 페이지가 아니라 자산이다 — NotebookLM의
                images/slide-NN.png를 그대로 쓴다. 남은 연구는 덱 간
                시퀀싱(CompositeDeck).
              </p>
            </Build>
            <Scene style={{ height: 'auto' }}>
              <PulseGauge />
            </Scene>
          </div>
        </div>
      </Slide>
    </Deck>
  );
}
