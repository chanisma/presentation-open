import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import { Scene, useSceneTime, interpolate, riseIn } from '../../../../src/scene';
import { ScrubVideo, StepVideo, AmbientVideo } from '../../../../src/components/SceneVideo';
import { useDeck } from '../../../../src/deck/DeckContext';

/* ── 움직이는 에셋 — 영상 통합 데모 ──────────────────────────────────
   OpenMontage(creative_works)가 렌더한 클립을 덱의 두 시간축에 거는
   문법 레퍼런스. 소재는 훈민정음 창제 배경(sejong-hangul 프로젝트):
   한자 방문(榜文)을 읽지 못하는 백성의 장면들.

   방식 ① ScrubVideo   — 씬 t의 순수 함수로 탐색(핑퐁 되감김 포함)
   방식 ② StepVideo    — 클릭 빌드가 구간을 하나씩 재생
   방식 ③ AmbientVideo — muted 루프 무대 텍스처                     */

const MEDIA = 'data/dev/테스트 수업 자료/영상-에셋-데모/media';
const AMBER = '#e2a955';
const COAL = 'rgba(10, 8, 5, 0.92)';

/* 1 — 타이틀: 앰비언트 루프(방식 ③)가 곧 무대 */
function TitleScene() {
  const t = useSceneTime();
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <AmbientVideo
        src={`${MEDIA}/loop-script.mp4`}
        poster={`${MEDIA}/loop-script.jpg`}
        style={{ position: 'absolute', inset: 0 }}
      />
      {/* 스크림 — 텍스트 밴드(좌하)를 영상 위에서 분리 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(75deg, ${COAL} 0%, rgba(10,8,5,0.55) 45%, rgba(10,8,5,0.12) 100%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 'clamp(28px,6vw,88px)',
          bottom: 'clamp(36px,9vh,96px)',
          maxWidth: 640,
        }}
      >
        <div className="kicker" style={{ color: AMBER, ...riseIn(t, 0.2) }}>
          Reference · Video as Asset — OpenMontage × bolt
        </div>
        <h1
          className="display"
          style={{ margin: '16px 0 12px', wordBreak: 'keep-all', ...riseIn(t, 0.45) }}
        >
          영상, <span className="accent-text">무대에 오르다</span>
        </h1>
        <p className="lead" style={{ wordBreak: 'keep-all', ...riseIn(t, 0.7) }}>
          영상은 페이지가 아니라 구성요소다 — 렌더된 클립을
          덱의 두 시간축(씬 t · 클릭)에 건다.
        </p>
      </div>
      <div
        className="mono"
        style={{
          position: 'absolute',
          right: 'clamp(20px,3vw,40px)',
          bottom: 'clamp(20px,4vh,36px)',
          fontSize: 12,
          color: 'var(--fg-faint)',
          padding: '6px 12px',
          borderRadius: 999,
          background: 'rgba(10,8,5,0.55)',
          border: '1px solid var(--hair-2)',
          ...riseIn(t, 1.1),
        }}
      >
        배경: 방식 ③ AmbientVideo · muted loop · 0.6MB
      </div>
    </div>
  );
}

/* 2 — 방식 ①: t 스크럽 (핑퐁) — 재생이 아니라 탐색임을 되감김으로 증명 */
const CLIP1 = 14.33; // scrub-notice.mp4 길이(초)
const SCRUB_START = 0.8;
const SCRUB_HALF = 7.5; // 편도 시간
/** 씬 t → 필름 시각: 앞으로 갔다가 그대로 되감기는 삼각파 (t의 순수 함수) */
function pingpong(t: number) {
  if (t <= SCRUB_START) return { ct: 0, fwd: true };
  const x = (t - SCRUB_START) / SCRUB_HALF;
  const f = x - Math.floor(x);
  const fwd = Math.floor(x) % 2 === 0;
  return { ct: (fwd ? f : 1 - f) * CLIP1, fwd };
}

function ScrubScene() {
  const t = useSceneTime();
  const { ct, fwd } = pingpong(t);
  const p = ct / CLIP1;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 'clamp(24px,3.5vw,56px)',
        padding: '0 clamp(28px,5vw,80px)',
      }}
    >
      <div style={{ flex: '0 1 58%', minWidth: 0, ...riseIn(t, 0.15) }}>
        <div
          style={{
            aspectRatio: '3 / 2',
            borderRadius: 18,
            overflow: 'hidden',
            border: '1px solid var(--hair)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <ScrubVideo
            src={`${MEDIA}/scrub-notice.mp4`}
            poster={`${MEDIA}/scrub-notice.jpg`}
            time={ct}
          />
        </div>
        {/* 필름 자(尺) — 영상과 같은 순수 함수를 게이지로 시각화 */}
        <div style={{ marginTop: 18 }}>
          <div
            style={{
              position: 'relative',
              height: 10,
              borderRadius: 999,
              background: 'var(--surface)',
              border: '1px solid var(--hair-2)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${p * 100}%`,
                borderRadius: 999,
                background: `linear-gradient(90deg, color-mix(in srgb, ${AMBER} 35%, transparent), ${AMBER})`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: `${p * 100}%`,
                top: '50%',
                transform: 'translate(-50%,-50%)',
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: AMBER,
                boxShadow: `0 0 16px color-mix(in srgb, ${AMBER} 60%, transparent)`,
              }}
            />
          </div>
          <div
            className="mono"
            style={{
              marginTop: 10,
              fontSize: 13,
              color: 'var(--fg-muted)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>
              씬 t {t.toFixed(1)}s → 필름 {ct.toFixed(1)}s
            </span>
            <span style={{ color: AMBER, fontWeight: 700 }}>
              {fwd ? '▶ 앞으로' : '◀ 되감김'}
            </span>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="kicker" style={{ color: AMBER, ...riseIn(t, 0.3) }}>
          방식 ① — ScrubVideo
        </div>
        <h2
          className="headline"
          style={{ margin: '12px 0 18px', wordBreak: 'keep-all', ...riseIn(t, 0.5) }}
        >
          재생하지 않는다, <span className="accent-text">탐색한다</span>
        </h2>
        {[
          ['t의 순수 함수', '매 프레임 currentTime = f(t) — 같은 t, 같은 화면'],
          ['되감김도 자유', '삼각파 사상이면 필름이 스스로 되감긴다 — 재생으로는 불가능'],
          ['all-intra 필수', 'ffmpeg -g 1 재인코딩 — 모든 프레임이 키프레임이라 seek이 매끄럽다'],
        ].map(([head, body], i) => (
          <div
            key={i}
            className="mat"
            style={{
              padding: '13px 18px',
              borderRadius: 14,
              marginBottom: 10,
              ...riseIn(t, 0.7 + i * 0.22),
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 'clamp(14px,1.6vw,17px)', color: 'var(--fg)' }}>
              {head}
            </div>
            <div style={{ fontSize: 'clamp(12px,1.4vw,14px)', color: 'var(--fg-muted)', marginTop: 3 }}>
              {body}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* 3 — 방식 ②: 클릭 구간 재생 — 구간 카드가 필름 슬롯처럼 꽂힌다 */
const SEGS = [3.1, 6.2, 9.4];
const SEG_LABELS = [
  ['문서가 펼쳐진다', '0 – 3.1s'],
  ['소리 내어 읽는다', '3.1 – 6.2s'],
  ['백성은 듣기만 한다', '6.2 – 9.4s'],
];

function StepScene() {
  const t = useSceneTime();
  const { clicks } = useDeck();
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 'clamp(24px,3.5vw,56px)',
        padding: '0 clamp(28px,5vw,80px)',
      }}
    >
      <div style={{ flex: '0 1 38%', minWidth: 0 }}>
        <div className="kicker" style={{ color: AMBER, ...riseIn(t, 0.2) }}>
          방식 ② — StepVideo
        </div>
        <h2
          className="headline"
          style={{ margin: '12px 0 20px', wordBreak: 'keep-all', ...riseIn(t, 0.4) }}
        >
          클릭이 <span className="accent-text">장면을 넘긴다</span>
        </h2>
        {SEG_LABELS.map(([label, range], i) => {
          const played = clicks >= i + 1;
          const next = clicks === i;
          return (
            <div
              key={i}
              className="mat"
              style={{
                padding: '13px 18px',
                borderRadius: 14,
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                border: `1px solid ${played ? `color-mix(in srgb, ${AMBER} 55%, transparent)` : 'var(--hair-2)'}`,
                opacity: played || next ? 1 : 0.55,
                ...riseIn(t, 0.55 + i * 0.18),
              }}
            >
              <span
                className="mono"
                style={{
                  fontWeight: 800,
                  fontSize: 18,
                  color: played ? AMBER : 'var(--fg-faint)',
                }}
              >
                {i + 1}
              </span>
              <span style={{ flex: 1 }}>
                <span
                  style={{
                    display: 'block',
                    fontWeight: 700,
                    fontSize: 'clamp(14px,1.6vw,17px)',
                    color: 'var(--fg)',
                    wordBreak: 'keep-all',
                  }}
                >
                  {label}
                </span>
                <span className="mono" style={{ fontSize: 12, color: 'var(--fg-faint)' }}>
                  {range}
                </span>
              </span>
              <span className="mono" style={{ fontSize: 12, color: played ? AMBER : 'var(--fg-faint)' }}>
                {played ? '재생됨' : next ? '→ 클릭' : '대기'}
              </span>
            </div>
          );
        })}
        <p
          style={{
            fontSize: 'clamp(12px,1.4vw,14px)',
            color: 'var(--fg-muted)',
            marginTop: 14,
            wordBreak: 'keep-all',
            ...riseIn(t, 1.2),
          }}
        >
          Space / → 가 구간을 재생하고 경계에서 멈춘다. 뒤로 가면 그 구간의 끝
          프레임에 선다 — 발표 리듬은 교사의 손에 남는다.
        </p>
      </div>
      <div style={{ flex: '0 1 58%', minWidth: 0, ...riseIn(t, 0.3) }}>
        <div
          style={{
            aspectRatio: '3 / 2',
            borderRadius: 18,
            overflow: 'hidden',
            border: '1px solid var(--hair)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <StepVideo
            src={`${MEDIA}/step-decree.mp4`}
            poster={`${MEDIA}/step-decree.jpg`}
            segments={SEGS}
          />
        </div>
      </div>
    </div>
  );
}

/* 4 — 규약: 파이프라인 영수증 */
function RecipeScene() {
  const t = useSceneTime();
  const methods = [
    ['① ScrubVideo', '씬 t 축', 'all-intra(-g 1) 재인코딩 필수', '이 덱 실측: 14.3s · 4.9MB'],
    ['② StepVideo', '클릭 축', '일반 인코딩 · 1초 키프레임(-g 24)', '이 덱 실측: 9.4s · 0.9MB'],
    ['③ AmbientVideo', '장식(무대)', '저용량 루프 · 씬 폼에선 배경 전용', '이 덱 실측: 12.3s · 0.6MB'],
  ];
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 clamp(28px,6vw,96px)',
      }}
    >
      <h2
        className="headline"
        style={{
          marginInline: 'auto',
          marginBottom: 26,
          textAlign: 'center',
          wordBreak: 'keep-all',
          ...riseIn(t, 0.15),
        }}
      >
        덱에 영상을 <span className="accent-text">들일 때</span>
      </h2>
      <div style={{ display: 'flex', gap: 14, width: 'min(920px, 100%)', marginBottom: 18 }}>
        {methods.map(([name, axis, req, fact], i) => (
          <div
            key={i}
            className="mat"
            style={{
              flex: 1,
              padding: '18px 20px',
              borderRadius: 16,
              ...riseIn(t, 0.35 + i * 0.18),
            }}
          >
            <div style={{ fontWeight: 800, color: AMBER, fontSize: 'clamp(15px,1.8vw,19px)' }}>
              {name}
            </div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--fg-faint)', margin: '4px 0 8px' }}>
              {axis}
            </div>
            <div style={{ fontSize: 'clamp(12px,1.5vw,15px)', color: 'var(--fg-muted)', wordBreak: 'keep-all' }}>
              {req}
            </div>
            <div
              className="mono"
              style={{
                fontSize: 12,
                color: AMBER,
                marginTop: 10,
                paddingTop: 8,
                borderTop: '1px solid var(--hair-2)',
              }}
            >
              {fact}
            </div>
          </div>
        ))}
      </div>
      <div
        className="mono"
        style={{
          width: 'min(920px, 100%)',
          padding: '18px 22px',
          borderRadius: 16,
          background: 'rgba(10,8,5,0.6)',
          border: '1px solid var(--hair)',
          fontSize: 'clamp(11px,1.3vw,13.5px)',
          lineHeight: 1.9,
          color: 'var(--fg-muted)',
          overflowX: 'auto',
          whiteSpace: 'pre',
          ...riseIn(t, 0.95),
        }}
      >
        {`# 스크럽용 — 모든 프레임을 키프레임으로 (OpenMontage 렌더 → 덱 투입 재인코딩)
ffmpeg -i clip.mp4 -an -c:v libx264 -crf 24 -g 1 -movflags +faststart scrub.mp4
# 포스터 — isStatic(썸네일)은 영상 대신 이 이미지를 렌더한다
ffmpeg -ss 13 -i clip.mp4 -frames:v 1 poster.jpg`}
      </div>
      <p
        className="mono"
        style={{
          marginTop: 16,
          fontSize: 12,
          color: 'var(--fg-faint)',
          textAlign: 'center',
          ...riseIn(t, 1.2),
        }}
      >
        위치 data/&lt;그룹&gt;/&lt;과목&gt;/&lt;수업&gt;/media/ · 클립 ≤15초 · ≤5MB · 항상 muted
      </p>
    </div>
  );
}

export default function VideoDemoDeck() {
  return (
    <Deck>
      <Slide
        full
        nav="타이틀"
        notes="영상은 페이지가 아니라 구성요소 — 배경 자체가 방식 ③(muted 루프). OpenMontage 렌더 클립, 소재는 훈민정음 창제 배경."
      >
        <Scene>
          <TitleScene />
        </Scene>
      </Slide>
      <Slide
        full
        nav="t 스크럽"
        notes="방식 ①: 재생이 아니라 탐색. currentTime이 씬 t의 순수 함수 — 삼각파 사상이라 필름이 스스로 되감긴다. all-intra 재인코딩이 전제."
      >
        <Scene>
          <ScrubScene />
        </Scene>
      </Slide>
      <Slide
        full
        nav="클릭 구간"
        notes="방식 ②: 클릭이 영상 구간을 하나씩 재생하고 경계에서 멈춘다. 뒤로 가면 그 구간의 끝 프레임. 발표 리듬은 교사가 쥔다."
      >
        <Scene>
          <StepScene />
        </Scene>
      </Slide>
      <Slide
        full
        nav="규약"
        notes="세 방식의 시간축·인코딩 요구 요약 + ffmpeg 레시피. 파일 위치와 용량 가이드."
      >
        <Scene>
          <RecipeScene />
        </Scene>
      </Slide>
    </Deck>
  );
}
