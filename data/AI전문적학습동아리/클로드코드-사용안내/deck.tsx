import type { CSSProperties, ReactNode } from 'react';
import Deck from '../../../src/deck/Deck';
import Slide from '../../../src/deck/Slide';
import Build from '../../../src/deck/Build';
import Terminal from '../../../src/components/Terminal';
import Split from '../../../src/components/Split';
import CodeWindow from '../../../src/components/CodeWindow';
import {
  Scene,
  useSceneTime,
  interpolate,
  easeInOut,
  spring,
  riseIn,
} from '../../../src/scene';
import {
  AppWindow,
  Caret,
  Pointer,
  clickFlash,
  dimAfter,
  popIn,
  typed,
  typedDoneAt,
} from '../../../src/walkthrough';

/* ── 클로드 코드 사용 안내서 — 설치부터 스킬까지 (18장) ────────────────
   plan.md(같은 폴더)가 SSOT — 각 슬라이드의 form(scene/image/static/build)과
   형태 설계를 그대로 따른다. 이미지 자산은 바이브코딩 수업의 화이트보드
   일러스트 재사용(KenBurns), 씬 4개는 장마다 고유 메타포. */

const C = {
  amber: '#ffb45c',
  coral: '#ff7a5c',
  mint: '#4fe5b0',
  blue: '#5aa9ff',
  red: '#ff6b6b',
};
/* 부분 에셋 SVG — assets/manifest.json 등록. 마스코트는 1·14쪽 재사용 */
const MASCOT = 'assets/svg/claude-assistant.svg';

/* 접속용 URL은 클릭 가능해야 한다 — 발표 중 새 탭으로 이동 */
function LinkOut({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      style={{
        color: C.amber,
        fontWeight: 700,
        textDecoration: 'underline',
        textUnderlineOffset: 3,
      }}
    >
      {children} ↗
    </a>
  );
}

/* ── 1 — 씬: 깜빡이는 커서의 초대 ───────────────────────────────────── */
function CursorInvite() {
  const t = useSceneTime();
  const blink = Math.floor(t * 1.6) % 2 === 0;
  const pulse = 0.45 + 0.25 * Math.sin(t * 1.1);
  const stations = ['개념', '설치', '실행', '스킬', '실전'];
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        textAlign: 'center',
        padding: '0 8vw',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '38%',
          width: 520,
          height: 520,
          transform: 'translate(-50%,-50%)',
          borderRadius: '50%',
          background: `radial-gradient(circle, color-mix(in srgb, ${C.amber} 18%, transparent), transparent 70%)`,
          filter: 'blur(10px)',
          opacity: pulse,
        }}
      />
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(18px,2.6vw,36px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(44px,7vw,84px)',
            fontWeight: 800,
            color: C.amber,
          }}
        >
          <span>&gt;</span>
          <span
            style={{
              display: 'inline-block',
              width: '0.62em',
              height: '1.1em',
              background: C.amber,
              borderRadius: 4,
              opacity: blink ? 1 : 0.12,
            }}
          />
        </div>
        <img
          src={MASCOT}
          alt="클로드 코드 비서 로봇"
          style={{
            width: 'clamp(84px,9vw,124px)',
            transform: `scale(${spring(t, 0.5)}) rotate(-4deg)`,
          }}
        />
      </div>
      <div className="kicker" style={{ position: 'relative' }}>
        AI 전문적 학습동아리 · 사용 안내서
      </div>
      <h1 className="display" style={{ position: 'relative', margin: 0 }}>
        터미널에 <span className="accent-text">비서</span>를 들이다
      </h1>
      <p className="lead" style={{ position: 'relative', marginInline: 'auto' }}>
        클로드 코드 — 설치부터 실행, 스킬 설정과 사용까지. 준비물은 Windows
        PC와 호기심뿐.
      </p>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginTop: 14,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {stations.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              className="mat"
              style={{
                padding: '8px 18px',
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 'clamp(12px,1.4vw,15px)',
                border: `1px solid color-mix(in srgb, ${C.amber} 45%, transparent)`,
                transform: `scale(${spring(t, 0.9 + i * 0.22)})`,
              }}
            >
              {s}
            </div>
            {i < stations.length - 1 && (
              <span style={{ color: 'var(--fg-muted)', opacity: spring(t, 1 + i * 0.22) }}>
                →
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 5 — 씬: 생각→행동→관찰 궤도 루프 ──────────────────────────────── */
function AgentLoop() {
  const t = useSceneTime();
  const nodes = [
    { icon: '🧠', label: '생각', desc: '계획을 세운다', color: C.blue },
    { icon: '🔧', label: '행동', desc: '파일·명령을 다룬다', color: C.amber },
    { icon: '👀', label: '관찰', desc: '결과를 확인한다', color: C.mint },
  ];
  const active = Math.floor(t / 1.4) % 3;
  const R = 175;
  const done = t > 11;
  const p = Math.min(1, t / 11);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div
        className="kicker"
        style={{
          position: 'absolute',
          top: 'clamp(26px,6vh,56px)',
          left: 0,
          right: 0,
          textAlign: 'center',
          ...riseIn(t, 0.1),
        }}
      >
        개념 ② 에이전트 — 순환하는 일꾼
      </div>
      <h2
        className="headline"
        style={{
          position: 'absolute',
          top: 'clamp(52px,11vh,104px)',
          left: 0,
          right: 0,
          textAlign: 'center',
          marginInline: 'auto',
          wordBreak: 'keep-all',
          ...riseIn(t, 0.3),
        }}
      >
        답하고 끝나지 않는다 — <span className="accent-text">될 때까지 돈다</span>
      </h2>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '56%',
          transform: `translate(-50%,-50%) scale(${spring(t, 0.4)})`,
          padding: '18px 28px',
          borderRadius: 18,
          background: 'var(--surface)',
          border: '1px solid var(--hair-2)',
          textAlign: 'center',
          boxShadow: 'var(--glow)',
          zIndex: 2,
        }}
      >
        <div style={{ fontSize: 13, color: 'var(--fg-muted)', marginBottom: 6 }}>
          목표
        </div>
        <div style={{ fontWeight: 800, fontSize: 'clamp(15px,1.8vw,19px)' }}>
          {done ? '활동지 완성 ✓' : '활동지 만들기'}
        </div>
        <div
          style={{
            marginTop: 10,
            width: 150,
            height: 6,
            borderRadius: 999,
            background: 'color-mix(in srgb, var(--fg-muted) 18%, transparent)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${p * 100}%`,
              height: '100%',
              background: 'var(--accent)',
            }}
          />
        </div>
      </div>
      {nodes.map((nd, i) => {
        const a = t * 0.55 + (i * Math.PI * 2) / 3;
        const isActive = i === active && !done;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `calc(50% + ${Math.cos(a) * R}px)`,
              top: `calc(56% + ${Math.sin(a) * R * 0.58}px)`,
              transform: `translate(-50%,-50%) scale(${spring(t, 0.6 + i * 0.2) * (isActive ? 1.12 : 1)})`,
              padding: '10px 16px',
              borderRadius: 999,
              background: 'var(--surface)',
              border: `1px solid color-mix(in srgb, ${nd.color} ${isActive ? 85 : 40}%, transparent)`,
              color: nd.color,
              fontWeight: 700,
              fontSize: 'clamp(12px,1.4vw,15px)',
              whiteSpace: 'nowrap',
              boxShadow: isActive
                ? `0 0 26px color-mix(in srgb, ${nd.color} 40%, transparent)`
                : 'none',
              zIndex: 1,
            }}
          >
            {nd.icon} {nd.label}
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          bottom: 'clamp(26px,7vh,64px)',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 14,
          flexWrap: 'wrap',
          ...riseIn(t, 1.2),
        }}
      >
        {nodes.map((nd, i) => (
          <div
            key={i}
            className="mat"
            style={{
              padding: '10px 18px',
              borderRadius: 12,
              fontSize: 'clamp(12px,1.4vw,14px)',
              color: i === active && !done ? nd.color : 'var(--fg-muted)',
              border: `1px solid ${
                i === active && !done
                  ? `color-mix(in srgb, ${nd.color} 55%, transparent)`
                  : 'var(--hair-2)'
              }`,
            }}
          >
            {nd.label} — {nd.desc}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 13 — 씬: 레시피 카드 장착 슬롯 ─────────────────────────────────── */
function CardDock() {
  const t = useSceneTime();
  const cards = [
    { label: '활동지 레시피', trigger: '"활동지 만들어줘"', color: C.mint, delay: 1.0 },
    { label: '시험지 레시피', trigger: '"기말 시험지 만들어줘"', color: C.blue, delay: 2.2 },
    { label: '수업덱 레시피', trigger: '"수업 설계해줘"', color: C.coral, delay: 3.4 },
  ];
  const glow = interpolate(t, [0.5, 4.2], [0.25, 0.8]);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div
        className="kicker"
        style={{
          position: 'absolute',
          top: 'clamp(26px,6vh,56px)',
          left: 0,
          right: 0,
          textAlign: 'center',
          ...riseIn(t, 0.1),
        }}
      >
        개념 ③ 스킬 — 절차를 카드로
      </div>
      <h2
        className="headline"
        style={{
          position: 'absolute',
          top: 'clamp(52px,11vh,104px)',
          left: 0,
          right: 0,
          textAlign: 'center',
          marginInline: 'auto',
          wordBreak: 'keep-all',
          ...riseIn(t, 0.3),
        }}
      >
        노하우를 <span className="accent-text">레시피 카드</span>로 꽂는다
      </h2>
      <div
        style={{
          position: 'absolute',
          top: '54%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(28px,5vw,72px)',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: 'clamp(120px,15vw,170px)',
            height: 'clamp(120px,15vw,170px)',
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${C.amber} 55%, transparent), color-mix(in srgb, ${C.coral} 30%, transparent))`,
            border: `1px solid color-mix(in srgb, ${C.amber} 60%, transparent)`,
            boxShadow: `0 0 60px color-mix(in srgb, ${C.amber} ${Math.round(glow * 55)}%, transparent)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 4,
            transform: `scale(${spring(t, 0.3)})`,
          }}
        >
          <img
            src={MASCOT}
            alt="클로드 코드 비서 로봇"
            style={{ width: '54%', marginTop: '-4%' }}
          />
          <div style={{ fontWeight: 800, fontSize: 'clamp(12px,1.4vw,15px)' }}>
            클로드 코드
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {cards.map((cd, i) => {
            const s = spring(t, cd.delay);
            return (
              <div
                key={i}
                className="mat"
                style={{
                  padding: '13px 20px',
                  borderRadius: 12,
                  borderLeft: `3px solid ${cd.color}`,
                  transform: `translateX(${(1 - s) * 170}px)`,
                  opacity: Math.min(1, s * 1.3),
                  minWidth: 'clamp(220px,26vw,320px)',
                }}
              >
                <div style={{ fontWeight: 800, color: cd.color, marginBottom: 3 }}>
                  🗂 {cd.label}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'clamp(11px,1.3vw,13px)',
                    color: 'var(--fg-muted)',
                  }}
                >
                  트리거: {cd.trigger}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p
        className="lead"
        style={{
          position: 'absolute',
          bottom: 'clamp(28px,7vh,64px)',
          left: 0,
          right: 0,
          textAlign: 'center',
          marginInline: 'auto',
          wordBreak: 'keep-all',
          ...riseIn(t, 4.6),
        }}
      >
        매번 길게 설명하는 대신 — 절차를 저장하고, 한마디로 재생한다.
        <br />
        <span style={{ color: 'var(--fg-muted)', fontSize: '0.85em' }}>
          당신의 업무 노하우가 다음 카드입니다.
        </span>
      </p>
    </div>
  );
}

/* ── 18 — 씬: 여정 지도 펼치기 ──────────────────────────────────────── */
function JourneyMap() {
  const t = useSceneTime();
  const stations = [
    { label: '개념', sub: '에이전트 = 순환', color: C.blue },
    { label: '설치', sub: '명령 한 줄', color: C.amber },
    { label: '실행', sub: '첫 대화·권한', color: C.mint },
    { label: '스킬', sub: '레시피 카드', color: C.coral },
    { label: '실전', sub: '교사 업무 적용', color: C.amber },
  ];
  const progress = interpolate(t, [0.4, 5.4], [0, 100]);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div
        className="kicker"
        style={{
          position: 'absolute',
          top: 'clamp(26px,7vh,64px)',
          left: 0,
          right: 0,
          textAlign: 'center',
          ...riseIn(t, 0.1),
        }}
      >
        한눈 정리
      </div>
      <h2
        className="headline"
        style={{
          position: 'absolute',
          top: 'clamp(54px,12vh,112px)',
          left: 0,
          right: 0,
          textAlign: 'center',
          marginInline: 'auto',
          wordBreak: 'keep-all',
          ...riseIn(t, 0.25),
        }}
      >
        오늘, 이 길을 <span className="accent-text">완주했다</span>
      </h2>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '8%',
          right: '8%',
        }}
      >
        <div
          style={{
            position: 'relative',
            height: 4,
            borderRadius: 999,
            background: 'color-mix(in srgb, var(--fg-muted) 18%, transparent)',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              borderRadius: 999,
              background: 'var(--accent)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: -8,
              top: -34,
              fontSize: 26,
              transform: `scale(${spring(t, 5.7)})`,
            }}
          >
            🚩
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: -10,
          }}
        >
          {stations.map((st, i) => {
            const arrive = 0.4 + i * 1.25;
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  width: 120,
                  transform: `scale(${spring(t, arrive)})`,
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: st.color,
                    border: '3px solid var(--bg)',
                    boxShadow: `0 0 16px color-mix(in srgb, ${st.color} 45%, transparent)`,
                  }}
                />
                <div style={{ fontWeight: 800, fontSize: 'clamp(13px,1.5vw,16px)' }}>
                  {st.label}
                </div>
                <div
                  style={{
                    fontSize: 'clamp(11px,1.2vw,13px)',
                    color: 'var(--fg-muted)',
                    textAlign: 'center',
                    ...riseIn(t, arrive + 0.15),
                  }}
                >
                  {st.sub}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div
        className="mat"
        style={{
          position: 'absolute',
          bottom: 'clamp(30px,8vh,72px)',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '16px 26px',
          borderRadius: 14,
          textAlign: 'center',
          ...riseIn(t, 6.2),
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 4 }}>
          다음 걸음 — 첫 주문
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(12px,1.4vw,14px)',
            color: C.amber,
          }}
        >
          &gt; 내일 아침: "수업 안내문 만들어줘"
        </div>
      </div>
    </div>
  );
}

/* ── 2쪽: 셰프 컴퓨터 — idle 흔들 모션 (t 순수 함수) */
function ChefIdle() {
  const t = useSceneTime();
  return (
    <img
      src="assets/svg/chef-computer.svg"
      alt="요리사 모자를 쓴 컴퓨터가 파스타 접시를 내미는 손그림"
      style={{
        width: 'min(92%, 440px)',
        display: 'block',
        marginInline: 'auto',
        transform: `rotate(${Math.sin(t * 1.2) * 1.6}deg)`,
      }}
    />
  );
}

/* ── 17쪽: 아이디어 전구 — 글로우 맥동 (t 순수 함수) */
function BulbGlow() {
  const t = useSceneTime();
  const pulse = 0.35 + 0.3 * Math.sin(t * 1.4);
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div
        style={{
          position: 'absolute',
          inset: '-18%',
          borderRadius: '50%',
          background: `radial-gradient(circle, color-mix(in srgb, ${C.amber} 26%, transparent), transparent 68%)`,
          filter: 'blur(8px)',
          opacity: pulse,
        }}
      />
      <img
        src="assets/svg/idea-bulb.svg"
        alt="손그림 아이디어 전구"
        style={{ position: 'relative', width: 'clamp(120px,13vw,190px)' }}
      />
    </div>
  );
}

/* ── 6쪽: 엔진 위의 클로드 — idle 통통 모션 (t 순수 함수) */
function EngineIdle() {
  const t = useSceneTime();
  return (
    <img
      src="assets/svg/node-engine.svg"
      alt="바퀴 달린 Node 엔진 위에 앉아 깃발을 든 미니 클로드"
      style={{
        width: 'min(88%, 430px)',
        display: 'block',
        marginInline: 'auto',
        transform: `translateY(${Math.sin(t * 1.6) * 7}px)`,
      }}
    />
  );
}

/* ── 12쪽 씬: 권한 검문소 — 쓰기 요청이 차단봉 앞에 서고, y가 봉을 올린다 */
function CheckpointScene() {
  const t = useSceneTime();
  const approved = t > 6;
  // 쓰기 카드: 진입(0.5~3) → 차단봉 앞 대기 → 승인 후 통과(6.5~9)
  const wx =
    t < 6.5 ? interpolate(t, [0.5, 3], [-24, 30]) : interpolate(t, [6.5, 9], [30, 114]);
  const barAngle = interpolate(t, [6, 6.9], [0, -64]);
  const promptOn = t > 3.4 && t < 6.7;
  const typedY = t > 5.2;
  // 읽기 카드: 무정차 통과 (9.8~12.6)
  const rx = interpolate(t, [9.8, 12.6], [-24, 114]);
  const blink = Math.floor(t * 2.2) % 2 === 0;
  const signal = approved ? C.mint : blink ? '#ffd166' : 'color-mix(in srgb, #ffd166 30%, transparent)';
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div
        className="kicker"
        style={{
          position: 'absolute',
          top: 'clamp(26px,6vh,56px)',
          left: 0,
          right: 0,
          textAlign: 'center',
          ...riseIn(t, 0.1),
        }}
      >
        안전장치 — 권한 검문소
      </div>
      <h2
        className="headline"
        style={{
          position: 'absolute',
          top: 'clamp(52px,11vh,104px)',
          left: 0,
          right: 0,
          textAlign: 'center',
          marginInline: 'auto',
          wordBreak: 'keep-all',
          ...riseIn(t, 0.3),
        }}
      >
        위험한 일은 <span className="accent-text">차단봉 앞</span>에 선다
      </h2>
      {/* 도로 */}
      <div
        style={{
          position: 'absolute',
          left: '6%',
          right: '6%',
          top: '60%',
          height: 3,
          background: 'color-mix(in srgb, var(--fg-muted) 30%, transparent)',
          borderRadius: 999,
        }}
      />
      {/* 검문소: 기둥 + 차단봉 + 신호등 */}
      <div style={{ position: 'absolute', left: '52%', top: '60%' }}>
        <div
          style={{
            position: 'absolute',
            left: -7,
            top: -58,
            width: 14,
            height: 58,
            borderRadius: 5,
            background: 'var(--surface)',
            border: '1px solid var(--hair-2)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: -18,
            top: -84,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: signal,
            boxShadow: `0 0 18px ${signal}`,
            border: '1px solid var(--hair-2)',
            transition: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: -52,
            width: 150,
            height: 9,
            borderRadius: 999,
            background: `repeating-linear-gradient(90deg, ${C.amber} 0 18px, var(--bg) 18px 30px)`,
            border: `1px solid color-mix(in srgb, ${C.amber} 70%, transparent)`,
            transformOrigin: '4px 50%',
            transform: `rotate(${barAngle}deg)`,
          }}
        />
      </div>
      {/* 쓰기 요청 카드 */}
      <div
        className="mat"
        style={{
          position: 'absolute',
          left: `${wx}%`,
          top: 'calc(60% - 46px)',
          padding: '9px 16px',
          borderRadius: 11,
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(11px,1.3vw,13px)',
          whiteSpace: 'nowrap',
          borderLeft: `3px solid ${approved ? C.mint : C.coral}`,
        }}
      >
        ✏️ 쓰기: 수업계획.md {approved && <span style={{ color: C.mint }}>✓ 허용됨</span>}
      </div>
      {/* 승인 프롬프트 */}
      {promptOn && (
        <div
          className="mat"
          style={{
            position: 'absolute',
            left: '30%',
            top: 'calc(60% - 118px)',
            padding: '10px 18px',
            borderRadius: 12,
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(12px,1.4vw,14px)',
            ...riseIn(t, 3.5),
          }}
        >
          이 파일을 만들까요? Allow?{' '}
          <span style={{ color: C.amber, fontWeight: 800 }}>{typedY ? 'y▌' : '▌'}</span>
        </div>
      )}
      {/* 읽기 카드 — 무정차 */}
      {t > 9.8 && (
        <div
          className="mat"
          style={{
            position: 'absolute',
            left: `${rx}%`,
            top: 'calc(60% + 18px)',
            padding: '7px 14px',
            borderRadius: 10,
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(10px,1.2vw,12px)',
            whiteSpace: 'nowrap',
            opacity: 0.85,
            borderLeft: `3px solid ${C.blue}`,
          }}
        >
          📖 읽기: 목차.md — 무정차 통과
        </div>
      )}
      {/* 하단 요점 */}
      <div
        style={{
          position: 'absolute',
          bottom: 'clamp(28px,7vh,64px)',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          flexWrap: 'wrap',
          ...riseIn(t, 1.2),
        }}
      >
        {[
          '쓰기·명령 실행 = 차단봉 앞 정지, y/n은 당신 손에',
          '읽기 = 대부분 무정차',
          '범위는 작업 폴더 안',
        ].map((s, i) => (
          <div
            key={i}
            className="mat"
            style={{
              padding: '9px 16px',
              borderRadius: 999,
              fontSize: 'clamp(11px,1.3vw,13px)',
              color: 'var(--fg-muted)',
            }}
          >
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 소품: CLI 선택 화면 재현 (10쪽 첫 실행 마법사) ─────────────────── */
function SelectMock({
  title,
  options,
  pick,
  note,
}: {
  title: string;
  options: string[];
  pick: number;
  note: string;
}) {
  return (
    <div
      className="mat"
      style={{
        padding: '13px 18px',
        borderRadius: 13,
        fontFamily: 'var(--font-mono)',
        fontSize: 'clamp(12px,1.35vw,14px)',
        lineHeight: 1.85,
        whiteSpace: 'pre-wrap',
      }}
    >
      <div style={{ color: 'var(--fg-muted)', marginBottom: 4 }}>{title}</div>
      {options.map((o, i) => (
        <div
          key={i}
          style={{
            color: i === pick ? C.amber : 'var(--fg-muted)',
            fontWeight: i === pick ? 800 : 400,
          }}
        >
          {(i === pick ? '❯ ' : '  ') + o}
        </div>
      ))}
      <div
        style={{
          marginTop: 5,
          color: C.mint,
          fontFamily: 'var(--font-body)',
          fontSize: 'clamp(11px,1.25vw,13px)',
        }}
      >
        ✓ {note}
      </div>
    </div>
  );
}

/* ── 소품: 부록 팁 카드 (20·21쪽) — 명령 뱃지 + 설명 + 입력 예시 */
function TipCard({
  cmd,
  title,
  desc,
  example,
  warn,
}: {
  cmd: string;
  title: string;
  desc: ReactNode;
  example: string;
  warn?: boolean;
}) {
  const tone = warn ? C.red : C.amber;
  return (
    <div
      className="mat"
      style={{ padding: '13px 18px', borderRadius: 13, borderLeft: `3px solid ${tone}` }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 12,
          marginBottom: 5,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 800,
            color: tone,
            fontSize: 'clamp(13px,1.5vw,15px)',
          }}
        >
          {warn ? '⚠ ' : ''}
          {cmd}
        </span>
        <span style={{ fontWeight: 800 }}>{title}</span>
      </div>
      <div
        style={{
          color: 'var(--fg-muted)',
          fontSize: 'clamp(12px,1.4vw,14px)',
          marginBottom: 7,
          wordBreak: 'keep-all',
        }}
      >
        {desc}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(11px,1.25vw,13px)',
          background: 'color-mix(in srgb, var(--bg) 62%, transparent)',
          border: '1px solid var(--hair-2)',
          padding: '8px 12px',
          borderRadius: 8,
          whiteSpace: 'pre-wrap',
        }}
      >
        {example}
      </div>
    </div>
  );
}

/* ── 소품: ✗/✓ 습관 카드 (18쪽) ────────────────────────────────────── */
function HabitCard({
  title,
  bad,
  good,
}: {
  title: string;
  bad: string;
  good: string;
}) {
  return (
    <div className="mat" style={{ padding: '13px 20px', borderRadius: 13 }}>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>{title}</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          fontSize: 'clamp(12px,1.4vw,14px)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <span style={{ color: C.red }}>✗ {bad}</span>
        <span style={{ color: C.mint }}>✓ {good}</span>
      </div>
    </div>
  );
}

/* ── 씬(walkthrough): Node.js 설치 릴레이 (7쪽) ─────────────────────────
   metaphor: 배턴 릴레이 — 브라우저→설치 마법사→터미널 세 창이 절차의
   배턴을 좌상→우하로 넘긴다 (연결선이 중앙을 통과).
   intent: '어디를 클릭하고 무엇을 치는지'를 말 대신 화면 그대로 시연.
   모든 모션은 t의 순수 함수 — 포인터·창·타이핑이 같은 시각표를 공유. */
const NODE_GREEN = '#6cc24a';
function NodeInstallWalk() {
  const t = useSceneTime();
  /* 국면 시각표 */
  const CLICK_MSI = 2.0; // ① Windows 설치 프로그램(.msi) 버튼 클릭
  const DL_DONE = 3.9; //   다운로드 완료
  const WIZ_IN = 4.3; // ② 설치 마법사 등장
  const NEXT1 = 5.5;
  const NEXT2 = 6.6;
  const INSTALL = 7.7;
  const WIZ_DONE = 9.0;
  const TERM_IN = 9.5; // ③ PowerShell 등장
  const CMD = 'node --version';
  const typeAt = 10.3;
  const outAt = typedDoneAt(CMD, typeAt, 13) + 0.5;

  const wizStep = t < NEXT1 ? 0 : t < NEXT2 ? 1 : t < INSTALL ? 2 : t < WIZ_DONE ? 3 : 4;
  const wizTexts = [
    '사용권 계약 — 동의에 체크',
    '설치 위치 — 기본값 그대로',
    '준비 완료 — 설치를 누르세요',
    '설치 중…',
    '설치가 끝났습니다',
  ];
  const wizBtn = wizStep < 2 ? '다음' : wizStep < 4 ? '설치' : '마침';
  const wizFlash = Math.max(
    clickFlash(t, NEXT1),
    clickFlash(t, NEXT2),
    clickFlash(t, INSTALL)
  );

  /* 실제 페이지의 문장형 드롭다운("Node.js® [v24.18.0▾]를 [Windows▾]…") 목업 */
  const pick = (label: string, hot?: boolean) => (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        margin: '0 3px',
        borderRadius: 7,
        fontFamily: 'var(--font-mono)',
        fontSize: '0.92em',
        whiteSpace: 'nowrap',
        border: hot
          ? `1px solid color-mix(in srgb, ${NODE_GREEN} 65%, transparent)`
          : '1px solid var(--hair)',
      }}
    >
      {label}
      <span aria-hidden style={{ color: 'var(--fg-faint)', fontSize: '0.75em' }}>
        ▾
      </span>
    </span>
  );

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* 헤더 밴드 — 텍스트 zone은 상단 22%만 차지, 창 무대와 분리 */}
      <div style={{ position: 'absolute', left: '6%', top: '5.5%', width: '72%', textAlign: 'left' }}>
        <div className="kicker">설치 ① Node.js</div>
        <h2 className="headline" style={{ margin: '4px 0 6px', wordBreak: 'keep-all' }}>
          클릭 몇 번, <span className="accent-text">명령 한 줄</span>
        </h2>
        <p style={{ margin: 0, color: 'var(--fg-muted)', fontSize: 'clamp(13px,1.5vw,15px)' }}>
          <LinkOut href="https://nodejs.org/ko/download">nodejs.org/ko/download</LinkOut>
          에서 지금 화면 그대로 따라갑니다
        </p>
      </div>

      {/* 절차 연결선 — ①→②→③ 배턴 경로가 중앙을 가로지른다.
          dash 드로우온은 preserveAspectRatio=none에서 왜곡되므로 clip 사각형이
          좌→우로 자라며 선을 드러내는 방식 */}
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          /* svg 루트 박스가 아래 요소(헤더의 클릭 링크)의 클릭을 삼키지 않도록 */
          pointerEvents: 'none',
        }}
      >
        <defs>
          <clipPath id="s7-lead">
            <rect
              x={0}
              y={0}
              width={interpolate(t, [0.6, TERM_IN + 0.4], [0, 100], easeInOut)}
              height={100}
            />
          </clipPath>
        </defs>
        <path
          d="M 6.5 26 C 20 20 32 24 39 33 S 55 42 62 48"
          fill="none"
          stroke="color-mix(in srgb, var(--primary) 38%, transparent)"
          strokeWidth={1.6}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          clipPath="url(#s7-lead)"
        />
      </svg>

      {/* ① nodejs.org/ko/download — 랜드마크: 로고·버전 선택 줄·.msi 버튼.
          실제 페이지 구조를 본뜸: 버전(v24.18.0 LTS 기본값)·OS·아키텍처 선택
          줄 아래에 패키지 매니저 안내(오늘은 무시)와 설치 파일 버튼들 */}
      <AppWindow
        kind="browser"
        url="nodejs.org/ko/download"
        badge="①"
        style={{
          left: '5%',
          top: '27%',
          width: '35%',
          height: '52%',
          ...popIn(t, 0.15),
          ...dimAfter(t, WIZ_IN + 0.2),
        }}
        bodyStyle={{ display: 'flex', flexDirection: 'column' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '9px 16px',
            borderBottom: '1px solid var(--hair-2)',
          }}
        >
          <span style={{ fontWeight: 800, color: NODE_GREEN, fontSize: 'clamp(13px,1.5vw,16px)' }}>
            Node.js
          </span>
          {[34, 24, 28].map((w, i) => (
            <span key={i} style={{ width: w, height: 7, borderRadius: 4, background: 'var(--hair)' }} />
          ))}
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 11,
            padding: '4px 16px 8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 'clamp(14px,1.7vw,20px)', fontWeight: 800 }}>
            Node.js® 다운로드
          </div>
          <div style={{ color: 'var(--fg-muted)', fontSize: 'clamp(10.5px,1.15vw,12.5px)', wordBreak: 'keep-all' }}>
            기본값이 <b style={{ color: 'var(--fg)' }}>v24.18.0 (LTS)</b> · Windows — 그대로 두면 됩니다
          </div>
          {/* 페이지 상단: 문장형 선택 줄 + 설치 명령 블록 — 오늘은 지나칠 영역 */}
          <div
            style={{
              opacity: 0.5,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <div
              style={{
                color: 'var(--fg-muted)',
                fontSize: 'clamp(9.5px,1.05vw,11.5px)',
                lineHeight: 2,
                wordBreak: 'keep-all',
              }}
            >
              Node.js® {pick('v24.18.0 (LTS)', true)} 를 {pick('Windows')} 환경에서{' '}
              {pick('npm')} 방식으로 설치하세요
            </div>
            <div
              style={{
                width: '86%',
                borderRadius: 8,
                background: 'color-mix(in srgb, #0d1526 75%, var(--bg))',
                border: '1px solid var(--hair-2)',
                padding: '8px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                alignItems: 'flex-start',
              }}
            >
              {[58, 40].map((w, i) => (
                <span
                  key={i}
                  style={{ width: `${w}%`, height: 6, borderRadius: 3, background: 'var(--hair)' }}
                />
              ))}
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'clamp(8.5px,0.95vw,10px)',
                  color: 'var(--fg-faint)',
                }}
              >
                PowerShell — 오늘은 필요 없음
              </span>
            </div>
          </div>
          {/* 페이지 하단: 미리 빌드된 설치 파일 문장 — 여기가 오늘의 길 */}
          <div
            style={{
              fontSize: 'clamp(10px,1.1vw,12.5px)',
              lineHeight: 2,
              wordBreak: 'keep-all',
            }}
          >
            또는 {pick('x64')} 아키텍처가 실행 중인 {pick('Windows')} 환경에서 미리
            빌드된 Node.js®를 다운로드하세요
          </div>
          <div style={{ display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span
              style={{
                padding: '9px 16px',
                borderRadius: 10,
                fontWeight: 800,
                fontSize: 'clamp(11.5px,1.3vw,13.5px)',
                color: '#06130a',
                background: NODE_GREEN,
                boxShadow: `0 0 0 ${clickFlash(t, CLICK_MSI) * 9}px color-mix(in srgb, ${NODE_GREEN} 35%, transparent)`,
              }}
            >
              ⬇ Windows 설치 프로그램 (.msi)
            </span>
            <span
              style={{
                padding: '9px 13px',
                borderRadius: 10,
                border: `1px solid color-mix(in srgb, ${NODE_GREEN} 45%, transparent)`,
                color: 'var(--fg-muted)',
                fontSize: 'clamp(10.5px,1.15vw,12.5px)',
              }}
            >
              Standalone Binary (.zip)
            </span>
          </div>
        </div>
        {t > CLICK_MSI + 0.25 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              margin: '0 12px 12px',
              padding: '8px 12px',
              borderRadius: 10,
              background: 'color-mix(in srgb, var(--fg) 7%, transparent)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(10px,1.1vw,12px)',
              ...riseIn(t, CLICK_MSI + 0.25, 0.5, 12),
            }}
          >
            <span
              style={{
                color: 'var(--fg-muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              node-v24.18.0-x64.msi
            </span>
            <span style={{ flex: 1, height: 5, borderRadius: 3, background: 'var(--hair-2)', minWidth: 40 }}>
              <span
                style={{
                  display: 'block',
                  height: '100%',
                  borderRadius: 3,
                  width: `${interpolate(t, [CLICK_MSI + 0.3, DL_DONE], [0, 100])}%`,
                  background: NODE_GREEN,
                }}
              />
            </span>
            {t > DL_DONE && <span style={{ color: NODE_GREEN, fontWeight: 800 }}>✓</span>}
          </div>
        )}
      </AppWindow>

      {/* ② 설치 마법사 — 어떤 화면이 나와도 답은 [다음] */}
      <AppWindow
        kind="installer"
        title="Node.js Setup"
        badge="②"
        style={{
          left: '37.5%',
          top: '35%',
          width: '27%',
          height: '40%',
          zIndex: 2,
          ...popIn(t, WIZ_IN),
          ...dimAfter(t, TERM_IN + 0.2),
        }}
        bodyStyle={{
          display: 'flex',
          flexDirection: 'column',
          padding: 'clamp(10px,1.4vw,18px)',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', gap: 7, justifyContent: 'center' }}>
          {wizTexts.map((_, i) => (
            <span
              key={i}
              style={{
                width: i === wizStep ? 22 : 8,
                height: 8,
                borderRadius: 4,
                background: i <= wizStep ? 'var(--primary)' : 'var(--hair)',
              }}
            />
          ))}
        </div>
        <div style={{ flex: 1, display: 'grid', placeItems: 'center', textAlign: 'center', padding: '0 8px' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 'clamp(13px,1.6vw,17px)', wordBreak: 'keep-all' }}>
              {wizTexts[wizStep]}
            </div>
            {wizStep === 3 && (
              <div
                style={{
                  marginTop: 10,
                  height: 7,
                  width: 'min(180px, 80%)',
                  borderRadius: 4,
                  background: 'var(--hair-2)',
                  marginInline: 'auto',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    borderRadius: 4,
                    background: 'var(--primary)',
                    width: `${interpolate(t, [INSTALL + 0.2, WIZ_DONE - 0.15], [0, 100])}%`,
                  }}
                />
              </div>
            )}
            {wizStep === 4 && (
              <div style={{ marginTop: 8, color: C.mint, fontWeight: 800 }}>✓ 기본값만 눌러도 완벽</div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 'clamp(10px,1.1vw,12px)', color: 'var(--fg-faint)', marginRight: 'auto' }}>
            전부 기본값 그대로
          </span>
          <span
            style={{
              padding: '7px 18px',
              borderRadius: 9,
              fontWeight: 800,
              fontSize: 'clamp(11px,1.3vw,13px)',
              background: 'var(--primary)',
              color: 'var(--accent-ink)',
              boxShadow: `0 0 0 ${wizFlash * 8}px color-mix(in srgb, var(--primary) 35%, transparent)`,
            }}
          >
            {wizBtn}
          </span>
        </div>
      </AppWindow>

      {/* ③ PowerShell — 새 창에서 확인 ($ 없음: 치는 그대로 보여준다) */}
      <AppWindow
        kind="terminal"
        title="PowerShell — 새 창"
        badge="③"
        style={{ left: '61%', top: '50%', width: '34%', zIndex: 3, ...popIn(t, TERM_IN) }}
      >
        <div style={{ fontWeight: 650 }}>
          {typed(t, CMD, typeAt, 13)}
          {t > TERM_IN + 0.3 && t < outAt && <Caret />}
        </div>
        {t > outAt && <div style={{ color: 'var(--fg-muted)' }}>v24.18.0</div>}
        {t > outAt + 0.5 && (
          <div style={{ color: C.mint, fontWeight: 700 }}>✓ 숫자가 나오면 준비 끝</div>
        )}
        {t > outAt + 1.0 && (
          <div style={{ color: 'var(--fg-faint)', fontStyle: 'italic' }}>
            반드시 '새' PowerShell 창에서 — 오류가 나면 13쪽
          </div>
        )}
      </AppWindow>

      <Pointer
        path={[
          { t: 0.9, x: 29, y: 43 },
          { t: CLICK_MSI, x: 18, y: 66.2, click: true },
          { t: 3.1, x: 14, y: 74.5 },
          { t: NEXT1, x: 61.5, y: 71, click: true },
          { t: NEXT2, x: 61.5, y: 71, click: true },
          { t: INSTALL, x: 61.5, y: 71, click: true },
          { t: TERM_IN + 0.6, x: 68, y: 56, hide: true },
        ]}
      />
    </div>
  );
}

/* ── 씬(walkthrough): 클로드 코드 설치 (8쪽) ────────────────────────────
   metaphor: 슬라이드가 곧 바탕화면 — 하단 작업표시줄의 시작 버튼에서
   출발해 검색으로 PowerShell을 띄우고, 그 창에서 설치·확인 두 줄을 친다.
   intent: '터미널을 여는 법'부터 시연 — 시작 버튼(또는 Win 키) → powershell
   검색 → 실행 → npm install 한 줄 → claude --version 확인. */
function ClaudeInstallWalk() {
  const t = useSceneTime();
  /* 국면 시각표 */
  const START_CLICK = 1.5; // ① 시작 버튼 클릭 (또는 Win 키)
  const MENU_IN = 1.7; //   시작 메뉴 + 검색창
  const SEARCH = 'powershell';
  const searchAt = 2.4;
  const RESULT_CLICK = 4.4; //   검색 결과 실행
  const TERM_IN = 5.0; // ② PowerShell 창
  const CMD1 = 'npm install -g @anthropic-ai/claude-code';
  const cmd1At = 5.9;
  const out1At = typedDoneAt(CMD1, cmd1At, 17) + 0.5;
  const CMD2 = 'claude --version';
  const cmd2At = out1At + 0.7;
  const okAt = typedDoneAt(CMD2, cmd2At, 13) + 0.5;
  const chipsAt = okAt + 0.7;

  const menuOn = t > MENU_IN && t < RESULT_CLICK + 0.25;

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* 헤더 밴드 */}
      <div style={{ position: 'absolute', left: '6%', top: '6%', width: '60%', textAlign: 'left' }}>
        <div className="kicker">설치 ② 클로드 코드</div>
        <h2 className="headline" style={{ margin: '4px 0 6px', wordBreak: 'keep-all' }}>
          설치도 확인도 <span className="accent-text">한 줄</span>
        </h2>
        <p style={{ margin: 0, color: 'var(--fg-muted)', fontSize: 'clamp(13px,1.5vw,15px)', wordBreak: 'keep-all' }}>
          먼저 터미널을 엽니다 — 시작 버튼 또는{' '}
          <b
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--fg)',
              border: '1px solid var(--hair)',
              borderRadius: 6,
              padding: '1px 8px',
            }}
          >
            Win
          </b>{' '}
          키 → <b style={{ color: 'var(--fg)' }}>powershell</b> 검색
        </p>
      </div>

      {/* npm·-g 용어 칩 — 설치 확인이 끝난 뒤 좌측에 정리 */}
      <div
        style={{
          position: 'absolute',
          left: '6%',
          top: '46%',
          width: '26%',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          textAlign: 'left',
        }}
      >
        {[
          { k: 'npm', v: 'Node의 앱스토어 — 명령으로 설치' },
          { k: '-g', v: '전역 설치 — 어느 폴더서든 claude' },
        ].map((w, i) => (
          <div
            key={w.k}
            className="mat"
            style={{
              padding: '10px 14px',
              borderRadius: 11,
              fontSize: 'clamp(11px,1.25vw,13px)',
              ...riseIn(t, chipsAt + i * 0.25, 0.7, 18),
            }}
          >
            <b style={{ fontFamily: 'var(--font-mono)', color: C.amber, marginRight: 8 }}>{w.k}</b>
            <span style={{ color: 'var(--fg-muted)', wordBreak: 'keep-all' }}>{w.v}</span>
          </div>
        ))}
      </div>

      {/* ② PowerShell — 검색으로 띄운 창에서 두 줄 */}
      <AppWindow
        kind="terminal"
        title="Windows PowerShell"
        badge="②"
        style={{ left: '46%', top: '22%', width: '48%', zIndex: 3, ...popIn(t, TERM_IN) }}
      >
        <div style={{ fontWeight: 650 }}>
          {typed(t, CMD1, cmd1At, 17)}
          {t > TERM_IN + 0.4 && t < out1At && <Caret />}
        </div>
        {t > out1At && <div style={{ color: 'var(--fg-muted)' }}>added 1 package in 12s</div>}
        {t > cmd2At - 0.2 && (
          <div style={{ fontWeight: 650 }}>
            {typed(t, CMD2, cmd2At, 13)}
            {t < okAt && <Caret />}
          </div>
        )}
        {t > okAt && (
          <div style={{ color: C.mint, fontWeight: 700 }}>
            ✓ 2.1.0 — 설치 확인 <Caret color="var(--fg-muted)" />
          </div>
        )}
      </AppWindow>

      {/* 시작 메뉴 — 검색창과 결과 (시작 버튼 위로 팝) */}
      {menuOn && (
        <div
          style={{
            position: 'absolute',
            left: '20%',
            top: '40%',
            width: '30%',
            zIndex: 2,
            borderRadius: 14,
            border: '1px solid var(--hair)',
            background: 'color-mix(in srgb, var(--fg) 9%, var(--bg))',
            boxShadow: 'var(--shadow)',
            padding: 'clamp(10px,1.2vw,16px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 9,
            ...popIn(t, MENU_IN, 0.4),
          }}
        >
          {/* 검색창 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 12px',
              borderRadius: 999,
              border: '1px solid var(--hair)',
              background: 'color-mix(in srgb, var(--fg) 6%, transparent)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(11px,1.2vw,13px)',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden>
              <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="var(--fg-faint)" strokeWidth="2.4" />
              <path d="M15.4 15.4L21 21" stroke="var(--fg-faint)" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
            {typed(t, SEARCH, searchAt, 11)}
            {t > MENU_IN + 0.3 && t < RESULT_CLICK && <Caret />}
          </div>
          {/* 검색 결과 — 첫 항목이 오늘의 문 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '8px 12px',
              borderRadius: 9,
              fontSize: 'clamp(11px,1.25vw,13px)',
              fontWeight: 800,
              background: `color-mix(in srgb, var(--primary) ${
                t > typedDoneAt(SEARCH, searchAt, 11) ? 18 + clickFlash(t, RESULT_CLICK) * 32 : 0
              }%, transparent)`,
            }}
          >
            <span
              aria-hidden
              style={{
                display: 'inline-grid',
                placeItems: 'center',
                width: 20,
                height: 20,
                borderRadius: 5,
                background: 'color-mix(in srgb, #4aa8ff 30%, transparent)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: '#9fd0ff',
              }}
            >
              &gt;_
            </span>
            Windows PowerShell
            <span style={{ marginLeft: 'auto', fontWeight: 400, fontSize: '0.85em', color: 'var(--fg-faint)' }}>
              앱
            </span>
          </div>
          {[52, 40].map((w, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 12px' }}>
              <span style={{ width: 20, height: 20, borderRadius: 5, background: 'var(--hair-2)' }} />
              <span style={{ width: `${w}%`, height: 7, borderRadius: 4, background: 'var(--hair-2)' }} />
            </div>
          ))}
        </div>
      )}

      {/* 작업표시줄 — 시작 버튼이 모든 것의 문 */}
      <div
        style={{
          /* popIn의 transform과 충돌하므로 translateX 센터링 대신 명시 좌표 */
          position: 'absolute',
          left: '22%',
          top: '86%',
          width: '56%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 14px',
          borderRadius: 14,
          border: '1px solid var(--hair)',
          background: 'color-mix(in srgb, var(--fg) 7%, var(--bg))',
          boxShadow: 'var(--shadow)',
          ...popIn(t, 0.3),
        }}
      >
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: -13,
            top: -13,
            width: 30,
            height: 30,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'var(--font-mono)',
            fontWeight: 800,
            fontSize: 15,
            background: 'var(--primary)',
            color: 'var(--accent-ink)',
            boxShadow: 'var(--glow)',
          }}
        >
          ①
        </span>
        {/* 시작 버튼 — 창 로고 4분면 */}
        <span
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 2.5,
            padding: 7,
            borderRadius: 8,
            background: `color-mix(in srgb, #4aa8ff ${16 + clickFlash(t, START_CLICK) * 40}%, transparent)`,
          }}
          aria-hidden
        >
          {[0, 1, 2, 3].map((d) => (
            <i key={d} style={{ width: 8, height: 8, background: '#7cbcff', borderRadius: 1.5, display: 'block' }} />
          ))}
        </span>
        <span
          style={{
            flex: 1,
            height: 9,
            borderRadius: 5,
            background: 'var(--hair-2)',
          }}
          aria-hidden
        />
        {[0, 1, 2].map((d) => (
          <span key={d} style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--hair-2)' }} aria-hidden />
        ))}
        <span
          style={{
            position: 'absolute',
            right: 12,
            top: -26,
            fontSize: 'clamp(10.5px,1.15vw,12.5px)',
            color: 'var(--fg-faint)',
          }}
        >
          시작 버튼 — 키보드 Win 키와 같은 문
        </span>
      </div>

      <Pointer
        path={[
          { t: 0.9, x: 34, y: 72 },
          { t: START_CLICK, x: 23.5, y: 89.3, click: true },
          { t: RESULT_CLICK, x: 26, y: 47.5, click: true, hide: true },
        ]}
      />
    </div>
  );
}

/* ── 씬(walkthrough): 첫 실행과 로그인 (9쪽) ────────────────────────────
   metaphor: 문을 세 번 통과하는 왕복 여정 — 탐색기(우클릭)에서 터미널이
   열리고, 브라우저 인증을 찍고 터미널로 돌아온다. 좌측 단계 카드 점등.
   intent: cd 타이핑 없이 '작업 폴더 우클릭 → 터미널에서 열기 → claude →
   브라우저 로그인 → 복귀'를 시연 — 초보자용 동선. */
function ClaudeLoginWalk() {
  const t = useSceneTime();
  /* 국면 시각표 */
  const RCLICK = 1.4; // ① 탐색기 빈 곳 우클릭 → 컨텍스트 메뉴
  const OPEN_TERM = 2.8; //   '터미널에서 열기' 클릭
  const TERM_IN = 3.4; // ② 수업자료 폴더에서 PowerShell 열림
  const CL = 'claude';
  const clAt = 4.4;
  const outAt = typedDoneAt(CL, clAt, 12) + 0.5;
  const BROWSER_IN = outAt + 0.6; // ③ 브라우저 인증
  const CLICK_LOGIN = BROWSER_IN + 1.6;
  const AUTH_OK = CLICK_LOGIN + 0.6;
  const BACK = AUTH_OK + 1.1; // 터미널 복귀

  const step = t < TERM_IN ? 0 : t < BACK ? 1 : 2;
  const steps = [
    { t: "작업 폴더 우클릭 → '터미널에서 열기'", b: 'cd 없이 시작 — 연 폴더가 곧 작업 범위' },
    { t: 'claude 입력 — 브라우저 인증 최초 1회', b: 'Claude 계정으로 로그인' },
    { t: '터미널 복귀 — 대화 시작', b: '다음부터는 로그인 없이 바로' },
  ];

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* 좌측 서사 zone — 우측 창 무대와 좌표로 분리 */}
      <div
        style={{
          position: 'absolute',
          left: '5%',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '33%',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          textAlign: 'left',
        }}
      >
        <div className="kicker">설치 ③ 첫 실행</div>
        <h2 className="headline" style={{ margin: '2px 0 8px', wordBreak: 'keep-all' }}>
          <span className="accent-text">claude</span> 한 마디면 시작
        </h2>
        {steps.map((s, i) => (
          <div
            key={i}
            className="mat"
            style={{
              padding: '11px 18px',
              borderRadius: 12,
              display: 'flex',
              gap: 12,
              boxShadow:
                i === step
                  ? '0 0 0 1.5px color-mix(in srgb, var(--primary) 60%, transparent), var(--glow)'
                  : undefined,
              opacity: i <= step ? 1 : 0.55,
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: C.amber }}>
              {i + 1}
            </span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 'clamp(13px,1.5vw,15px)' }}>{s.t}</div>
              <div style={{ color: 'var(--fg-muted)', fontSize: 'clamp(12px,1.3vw,13px)' }}>
                {s.b}
              </div>
            </div>
          </div>
        ))}
        {/* 실습 준비물 — 15쪽과 같은 스킬 zip (풀면 오늘의 작업 폴더가 된다) */}
        <a
          href="data/AI전문적학습동아리/클로드코드-사용안내/saenggibu-writer.zip"
          download
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            alignSelf: 'flex-start',
            marginTop: 4,
            padding: '10px 18px',
            borderRadius: 12,
            background: 'var(--accent)',
            color: 'var(--accent-ink)',
            fontWeight: 800,
            fontSize: 'clamp(12px,1.35vw,14px)',
            textDecoration: 'none',
          }}
        >
          ⬇ 실습용 스킬 받기 — saenggibu-writer.zip
        </a>
        <div
          style={{
            color: 'var(--fg-faint)',
            fontSize: 'clamp(11px,1.2vw,12.5px)',
            wordBreak: 'keep-all',
          }}
        >
          압축을 풀면 그 폴더가 오늘 실습할 작업 폴더입니다
        </div>
      </div>

      {/* ① 파일 탐색기 — cd 대신 작업 폴더에서 우클릭으로 출발 */}
      <AppWindow
        kind="app"
        title="수업자료 — 파일 탐색기"
        badge="①"
        style={{
          left: '41%',
          top: '8%',
          width: '34%',
          height: '34%',
          ...popIn(t, 0.25),
          ...dimAfter(t, TERM_IN + 0.2),
        }}
        bodyStyle={{ display: 'flex', flexDirection: 'column' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 12px',
            borderBottom: '1px solid var(--hair-2)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(10px,1.1vw,12px)',
            color: 'var(--fg-muted)',
          }}
        >
          문서 <span style={{ color: 'var(--fg-faint)' }}>›</span>{' '}
          <b style={{ color: 'var(--fg)' }}>수업자료</b>
        </div>
        <div style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
          {['활동지', '발표자료'].map((name) => (
            <div
              key={name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 'clamp(10px,1.1vw,12px)',
                color: 'var(--fg-muted)',
              }}
            >
              <svg width="15" height="12" viewBox="0 0 15 12" aria-hidden>
                <path
                  d="M1 2.2 Q1 1.2 2 1.2 H5.6 L7 2.6 H13 Q14 2.6 14 3.6 V10 Q14 11 13 11 H2 Q1 11 1 10 Z"
                  fill="color-mix(in srgb, var(--primary) 45%, transparent)"
                />
              </svg>
              {name}
            </div>
          ))}
          {t < RCLICK + 0.1 && (
            <div
              style={{
                flex: 1,
                display: 'grid',
                placeItems: 'center',
                color: 'var(--fg-faint)',
                fontSize: 'clamp(10px,1.1vw,12px)',
                fontStyle: 'italic',
              }}
            >
              빈 곳에서 마우스 오른쪽 클릭
            </div>
          )}
        </div>
      </AppWindow>

      {/* 우클릭 컨텍스트 메뉴 — '터미널에서 열기'가 오늘의 문 */}
      {t > RCLICK + 0.1 && t < OPEN_TERM + 0.25 && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '26%',
            width: '15.5%',
            zIndex: 2,
            borderRadius: 10,
            border: '1px solid var(--hair)',
            background: 'color-mix(in srgb, var(--fg) 10%, var(--bg))',
            boxShadow: 'var(--shadow)',
            padding: 4,
            fontSize: 'clamp(10px,1.1vw,12.5px)',
            ...popIn(t, RCLICK + 0.1, 0.35),
          }}
        >
          {['새로 만들기', '정렬 기준', '새로 고침', '터미널에서 열기', '속성'].map((m) => {
            const hot = m === '터미널에서 열기';
            return (
              <div
                key={m}
                style={{
                  padding: '6px 12px',
                  borderRadius: 7,
                  textAlign: 'left',
                  color: hot ? 'var(--fg)' : 'var(--fg-muted)',
                  fontWeight: hot ? 800 : 400,
                  background: hot
                    ? `color-mix(in srgb, var(--primary) ${18 + clickFlash(t, OPEN_TERM) * 32}%, transparent)`
                    : undefined,
                }}
              >
                {m}
              </div>
            );
          })}
        </div>
      )}

      {/* ② 수업자료 폴더에서 바로 열린 PowerShell — cd가 필요 없다 */}
      <AppWindow
        kind="terminal"
        title="PowerShell — 수업자료"
        badge="②"
        style={{ left: '47%', top: '36.5%', width: '47%', zIndex: 3, ...popIn(t, TERM_IN) }}
      >
        <div style={{ color: 'var(--fg-faint)', fontStyle: 'italic' }}>
          문서\수업자료 폴더에서 터미널이 열렸습니다
        </div>
        {t > clAt - 0.4 && (
          <div style={{ fontWeight: 650 }}>
            {typed(t, CL, clAt, 12)}
            {t < outAt && <Caret />}
          </div>
        )}
        {t > outAt && (
          <div style={{ color: 'var(--fg-muted)' }}>브라우저가 열립니다 — 로그인을 완료해 주세요…</div>
        )}
        {t > BACK && (
          <div style={{ color: C.mint, fontWeight: 700 }}>
            ✓ 로그인 성공! 무엇을 도와드릴까요? <Caret />
          </div>
        )}
      </AppWindow>

      {/* ③ 브라우저 인증 — 최초 1회 들르는 경유지 */}
      <AppWindow
        kind="browser"
        url="claude.ai/login"
        badge="③"
        style={{
          left: '55%',
          top: '58%',
          width: '40%',
          height: '34%',
          zIndex: 4,
          ...popIn(t, BROWSER_IN),
          ...dimAfter(t, BACK),
        }}
        bodyStyle={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 9,
          textAlign: 'center',
          padding: '8px 16px',
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 'clamp(16px,2vw,24px)', color: C.coral }}>
          Claude
        </div>
        <div style={{ color: 'var(--fg-muted)', fontSize: 'clamp(11px,1.2vw,13px)' }}>
          내 계정으로 계속하기
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(11px,1.2vw,13px)',
            padding: '8px 16px',
            borderRadius: 9,
            border: '1px solid var(--hair)',
            color: 'var(--fg-muted)',
            minWidth: '58%',
          }}
        >
          you@school.kr
        </div>
        {t < AUTH_OK ? (
          <span
            style={{
              padding: '9px 24px',
              borderRadius: 10,
              background: C.coral,
              color: '#1c0d08',
              fontWeight: 800,
              fontSize: 'clamp(12px,1.4vw,14px)',
              boxShadow: `0 0 0 ${clickFlash(t, CLICK_LOGIN) * 9}px color-mix(in srgb, ${C.coral} 35%, transparent)`,
            }}
          >
            로그인
          </span>
        ) : (
          <div style={{ color: C.mint, fontWeight: 800 }}>✓ 인증 완료 — 터미널로 돌아갑니다</div>
        )}
      </AppWindow>

      {/* 포인터 1: 탐색기 우클릭 → 메뉴 클릭 후 퇴장 (타이핑 국면) */}
      <Pointer
        path={[
          { t: 0.8, x: 62, y: 18 },
          { t: RCLICK, x: 52, y: 27, click: true },
          { t: OPEN_TERM, x: 54, y: 35.8, click: true, hide: true },
        ]}
      />
      {/* 포인터 2: 브라우저 로그인 클릭 */}
      <Pointer
        path={[
          { t: BROWSER_IN + 0.6, x: 86, y: 66 },
          { t: CLICK_LOGIN, x: 75, y: 82.5, click: true },
          { t: CLICK_LOGIN + 1.0, x: 75, y: 82.5, hide: true },
        ]}
      />
    </div>
  );
}

/* ── 13쪽 문제 해결 카드의 미니 시연 4종 ────────────────────────────────
   intent: "PowerShell을 새로 연다" 같은 말이 초보자에겐 그림이 안 그려짐 —
   카드마다 해법을 2~3초 루프로 반복 시연한다. 클릭(Build)으로 카드가 언제
   등장하든 살아 움직이도록 t를 루프 위상으로 쓴다 (t 순수 함수 유지). */

const vignetteBox: CSSProperties = {
  position: 'relative',
  width: 'clamp(110px, 11vw, 158px)',
  height: 92,
  flexShrink: 0,
};

/* ① "인식할 수 없습니다" → 옛 창을 닫고(✕) 새 창을 연다 */
function FixNewShell() {
  const p = (useSceneTime() + 0.2) % 4.2;
  const closing = interpolate(p, [1.3, 1.8], [1, 0]);
  const fresh = spring(p, 2.0, 0.6);
  return (
    <div style={vignetteBox} aria-hidden>
      {/* 옛 창 — PATH가 없는 창. ✕가 눌리며 사라진다 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 6,
          width: '62%',
          height: 56,
          borderRadius: 8,
          border: `1px solid color-mix(in srgb, ${C.red} 50%, transparent)`,
          background: 'color-mix(in srgb, var(--fg) 5%, var(--bg))',
          opacity: closing,
          transform: `scale(${0.7 + 0.3 * closing})`,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '3px 6px',
            borderBottom: '1px solid var(--hair-2)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 800,
              color: C.red,
              padding: '0 3px',
              borderRadius: 3,
              background: `color-mix(in srgb, ${C.red} ${15 + clickFlash(p, 1.1) * 40}%, transparent)`,
            }}
          >
            ✕
          </span>
        </div>
        <div style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)', fontSize: 9, color: C.red }}>
          인식할 수 없습니다
        </div>
      </div>
      {/* 새 창 — 새로 열면 PATH가 실려 있다 */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: '62%',
          height: 56,
          borderRadius: 8,
          border: `1px solid color-mix(in srgb, ${C.mint} 60%, transparent)`,
          background: 'color-mix(in srgb, var(--fg) 6%, var(--bg))',
          opacity: Math.min(1, fresh * 1.4),
          transform: `scale(${0.8 + 0.2 * fresh})`,
        }}
      >
        <div style={{ display: 'flex', gap: 3, padding: '4px 6px', borderBottom: '1px solid var(--hair-2)' }}>
          {[0, 1, 2].map((d) => (
            <i key={d} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--hair)' }} />
          ))}
        </div>
        <div style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)', fontSize: 9.5, color: C.mint }}>
          새 창 ✓ claude
        </div>
      </div>
    </div>
  );
}

/* ② 로그인 무한 반복 → 브라우저에서 claude.ai 로그인부터 */
function FixLoginLoop() {
  const p = (useSceneTime() + 0.9) % 4.2;
  const spin = p < 1.7 ? p * 200 : 340;
  const done = spring(p, 2.0, 0.55);
  return (
    <div style={{ ...vignetteBox, display: 'grid', placeItems: 'center' }} aria-hidden>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '6px 12px',
          borderRadius: 999,
          border: '1px solid var(--hair)',
          background: 'color-mix(in srgb, var(--fg) 6%, var(--bg))',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--fg-muted)',
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.coral, flexShrink: 0 }} />
        claude.ai
      </div>
      {/* 무한 반복 → 로그인 완료로 전환 */}
      <div style={{ position: 'absolute', right: 8, bottom: 8 }}>
        {done < 0.05 ? (
          <svg width="26" height="26" viewBox="0 0 26 26" style={{ transform: `rotate(${spin}deg)` }}>
            <path
              d="M13 3 A10 10 0 1 1 4.3 8"
              fill="none"
              stroke={C.red}
              strokeWidth="2.6"
              strokeLinecap="round"
            />
            <path d="M2.5 3.5 L4.8 8.6 L9.9 6.4 Z" fill={C.red} />
          </svg>
        ) : (
          <span
            style={{
              display: 'inline-grid',
              placeItems: 'center',
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: `color-mix(in srgb, ${C.mint} 25%, transparent)`,
              color: C.mint,
              fontWeight: 800,
              fontSize: 15,
              transform: `scale(${done})`,
            }}
          >
            ✓
          </span>
        )}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 8,
          bottom: 8,
          fontSize: 9.5,
          color: done > 0.5 ? C.mint : 'var(--fg-faint)',
          fontWeight: done > 0.5 ? 700 : 400,
        }}
      >
        {done > 0.5 ? '로그인 유지됨' : '로그인 반복…'}
      </div>
    </div>
  );
}

/* ③ 한글·공백 경로 → 영문 폴더로 */
function FixPath() {
  const p = (useSceneTime() + 1.6) % 4.6;
  const fixed = typed(p, 'C:\\lessons', 1.6, 10);
  return (
    <div
      style={{
        ...vignetteBox,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 7,
        fontFamily: 'var(--font-mono)',
        fontSize: 11.5,
      }}
      aria-hidden
    >
      <div
        style={{
          color: C.red,
          textDecoration: 'line-through',
          textDecorationThickness: 2,
          opacity: interpolate(p, [0.2, 0.6], [0, 1]),
        }}
      >
        C:\수업 자료
      </div>
      <div style={{ color: 'var(--fg-faint)', fontSize: 10, opacity: interpolate(p, [0.9, 1.3], [0, 1]) }}>
        ↓ 영문으로
      </div>
      <div style={{ color: C.mint, fontWeight: 700 }}>
        {fixed}
        {p > 1.5 && p < 3.0 && <Caret color={C.mint} />}
        {p >= 3.0 && ' ✓'}
      </div>
    </div>
  );
}

/* ④ 권한 요청이 안 보임 → 창 맨 아래 y 대기 줄 */
function FixPromptY() {
  const p = (useSceneTime() + 2.4) % 4.2;
  const glow = 0.14 + 0.12 * Math.sin(p * 4);
  const yTyped = p > 1.9;
  return (
    <div
      style={{
        ...vignetteBox,
        borderRadius: 8,
        border: '1px solid var(--hair)',
        background: 'color-mix(in srgb, var(--fg) 4%, var(--bg))',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: 8,
        gap: 5,
      }}
      aria-hidden
    >
      {[46, 62].map((w, i) => (
        <span key={i} style={{ width: `${w}%`, height: 5, borderRadius: 3, background: 'var(--hair-2)' }} />
      ))}
      {/* 맨 아래 줄 — 여기가 y를 기다리는 곳 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '4px 7px',
          borderRadius: 6,
          background: `color-mix(in srgb, ${C.amber} ${glow * 100}%, transparent)`,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--fg-muted)',
        }}
      >
        계속할까요? (y/n)
        <b style={{ color: C.mint, fontSize: 11.5 }}>{yTyped ? 'y' : ''}</b>
        {!yTyped && <Caret color={C.amber} />}
        {p > 2.7 && <span style={{ color: C.mint, fontWeight: 800 }}>✓</span>}
      </div>
      <div style={{ position: 'absolute', top: 6, right: 8, fontSize: 9, color: 'var(--fg-faint)' }}>
        ↓ 맨 아래 줄
      </div>
    </div>
  );
}

/* ── 씬(walkthrough): 스킬 사용 (16쪽) ──────────────────────────────────
   metaphor: 레시피 카드 장착 — 우측 SKILL.md 카드가 터미널로 밀착(장착)되고
   대화가 매뉴얼의 5단계를 그대로 밟는다 (14쪽 레시피 은유의 실전판).
   intent: 자연어 한 마디로 실제 스킬(saenggibu-writer)이 발동해 산출물까지
   나오는 전 과정을 시연. 내용은 E:\saenggibu-writer 실사(SKILL.md·CLAUDE.md). */
function SkillUseWalk() {
  const t = useSceneTime();
  /* 국면 시각표 */
  const ASK = '2026 정보 세특 초안 작성해줘';
  const askAt = 0.9;
  const AI_ON = typedDoneAt(ASK, askAt, 10) + 0.5; // 스킬 발동 선언
  const DOCK = AI_ON + 0.2; // SKILL.md 카드 장착 모션
  const S1 = AI_ON + 1.3; // 파이프라인 체크 라인들
  const S2 = S1 + 1.1;
  const S3 = S2 + 1.1;
  const DONE = S3 + 1.2; // 산출물 안내
  const OUT_IN = DONE + 0.6; // 산출물 칩
  const BADGE = OUT_IN + 1.3; // 직접 호출 배지

  const dockX = interpolate(t, [DOCK, DOCK + 0.7], [0, -22], easeInOut);
  const cardPop = popIn(t, 0.6);

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* 헤더 밴드 */}
      <div style={{ position: 'absolute', left: '6%', top: '6%', width: '70%', textAlign: 'left' }}>
        <div className="kicker">스킬 사용</div>
        <h2 className="headline" style={{ margin: '4px 0 6px', wordBreak: 'keep-all' }}>
          부르면, <span className="accent-text">매뉴얼대로</span> 움직인다
        </h2>
        <p style={{ margin: 0, color: 'var(--fg-muted)', fontSize: 'clamp(13px,1.5vw,15px)' }}>
          실제 운영 중인 생기부 스킬(saenggibu-writer)이 한 마디에 발동하는 과정
        </p>
      </div>

      {/* 대화 터미널 — 스킬의 5단계가 대화로 흐른다 */}
      <AppWindow
        kind="terminal"
        title="PowerShell — claude · saenggibu-writer 폴더"
        style={{ left: '5%', top: '25%', width: '56%', zIndex: 2, ...popIn(t, 0.25) }}
      >
        <div style={{ fontWeight: 650 }}>
          <span style={{ color: C.amber, fontWeight: 700 }}>›&nbsp;</span>
          {typed(t, ASK, askAt, 10)}
          {t > 0.5 && t < AI_ON && <Caret />}
        </div>
        {t > AI_ON && (
          <div>
            <span style={{ color: 'var(--fg)', fontWeight: 700 }}>●&nbsp;</span>
            saenggibu-writer 스킬 발동 — 매뉴얼(SKILL.md)을 읽습니다
          </div>
        )}
        {t > S1 && (
          <div style={{ color: 'var(--fg-muted)' }}>
            <span style={{ color: C.mint, fontWeight: 700 }}>✓&nbsp;</span>학생 자료 28명 →
            통합 Excel 정리
          </div>
        )}
        {t > S2 && (
          <div style={{ color: 'var(--fg-muted)' }}>
            <span style={{ color: C.mint, fontWeight: 700 }}>✓&nbsp;</span>평가문 작성(NLP) —
            자료에 있는 사실만
          </div>
        )}
        {t > S3 && (
          <div style={{ color: 'var(--fg-muted)' }}>
            <span style={{ color: C.mint, fontWeight: 700 }}>✓&nbsp;</span>쉼표·바이트 검증 —
            1,485 / 1,500 바이트
          </div>
        )}
        {t > DONE && (
          <div>
            <span style={{ color: 'var(--fg)', fontWeight: 700 }}>●&nbsp;</span>검수 HTML과
            NEIS 업로드 파일을 만들었어요 — 확인해 주세요 <Caret />
          </div>
        )}
      </AppWindow>

      {/* SKILL.md 레시피 카드 — 발동 순간 터미널 쪽으로 밀착(장착) */}
      <AppWindow
        kind="app"
        title="SKILL.md — 레시피"
        style={{
          left: '65%',
          top: '25%',
          width: '30%',
          zIndex: 1,
          ...cardPop,
          /* 장착 이동은 popIn transform 뒤에 합성 (덮어쓰기 금지) */
          transform: `${cardPop.transform} translateX(${dockX}px)`,
          boxShadow:
            t > DOCK && t < DOCK + 1.2
              ? `0 0 0 2px color-mix(in srgb, var(--primary) ${60 * clickFlash(t, DOCK, 1.2)}%, transparent), var(--shadow)`
              : 'var(--shadow)',
          ...dimAfter(t, S2),
        }}
        bodyStyle={{
          padding: 'clamp(10px,1.3vw,16px)',
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(10px,1.15vw,12.5px)',
          lineHeight: 1.9,
          textAlign: 'left',
        }}
      >
        <div style={{ color: C.amber }}>name: saenggibu-writer</div>
        <div style={{ color: 'var(--fg-muted)', wordBreak: 'keep-all' }}>
          description: "세특 써줘", "생기부 작성"… 요청 시 사용
        </div>
        <div style={{ height: 6 }} />
        {[
          '1 기초 정보 — 과목·자료·연도',
          '2 프롬프트 준비',
          '3 자료 정리 → 통합 Excel',
          '4 평가문 작성(NLP)+바이트 검증',
          '5 검수 HTML + 업로드 xlsx',
        ].map((s) => (
          <div key={s} style={{ color: 'var(--fg-faint)' }}>
            {s}
          </div>
        ))}
      </AppWindow>

      {/* 산출물 — 스킬이 끝나면 손에 쥐는 것 */}
      <div
        style={{
          position: 'absolute',
          left: '65%',
          top: '63%',
          width: '30%',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          textAlign: 'left',
        }}
      >
        {[
          { n: '결과.html', d: '표형 검수 — 정렬·검색' },
          { n: '결과_NEIS업로드.xlsx', d: '세특 칸만 채운 업로드 양식' },
        ].map((f, i) => (
          <div
            key={f.n}
            className="mat"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 11,
              ...popIn(t, OUT_IN + i * 0.3),
            }}
          >
            <svg width="16" height="19" viewBox="0 0 16 19" aria-hidden>
              <path
                d="M1.5 2 Q1.5 0.8 2.7 0.8 H10 L14.5 5.3 V17 Q14.5 18.2 13.3 18.2 H2.7 Q1.5 18.2 1.5 17 Z"
                fill="none"
                stroke={C.mint}
                strokeWidth="1.4"
              />
              <path d="M10 0.8 V5.3 H14.5" fill="none" stroke={C.mint} strokeWidth="1.4" />
            </svg>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(10.5px,1.15vw,12.5px)', fontWeight: 700 }}>
                {f.n}
              </div>
              <div style={{ color: 'var(--fg-muted)', fontSize: 'clamp(10px,1.1vw,12px)' }}>{f.d}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 다른 호출법 — 마무리 배지 */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '88%',
          transform: 'translateX(-50%)',
          padding: '9px 20px',
          borderRadius: 999,
          border: '1px solid var(--hair)',
          background: 'color-mix(in srgb, var(--fg) 6%, var(--bg))',
          fontSize: 'clamp(11.5px,1.3vw,13.5px)',
          color: 'var(--fg-muted)',
          whiteSpace: 'nowrap',
          opacity: interpolate(t, [BADGE, BADGE + 0.5], [0, 1]),
        }}
      >
        직접 호출은{' '}
        <b style={{ fontFamily: 'var(--font-mono)', color: C.amber }}>/saenggibu-writer</b> ·
        목록은 <b style={{ color: 'var(--fg)' }}>"쓸 수 있는 스킬 뭐 있어?"</b>
      </div>
    </div>
  );
}

/* ── 씬(walkthrough): 세특 실전 ① 재료 준비 (16a쪽) ─────────────────────
   metaphor: 조리대에 재료 올리기 — 2쪽 '주문' 비유의 실전판. 기초자료
   파일이 자료 폴더에 착륙하고, 첫 주문 한 줄을 타이핑한다.
   구도: 탐색기 dominant + 우하 터미널 대각 2창 (7릴레이·8바탕화면·9왕복과
   구분). 내용은 saenggibu-writer 모의 실행 실사. */
function SaenggibuPrepWalk() {
  const t = useSceneTime();
  /* 국면 시각표 */
  const PASTE = 1.4; // 탐색기 붙여넣기 클릭 → 파일 착륙
  const F1 = 1.6; // 보고서 폴더(+pdf 3)
  const F2 = 2.5; // 자기평가.xlsx
  const F3 = 3.1; // 성적.xlsx
  const TERM_IN = 4.1; // ② 터미널 등장
  const CLICK_TERM = 4.8;
  const CMD = '2026 정보 세특 초안 작성해줘. 기초자료는 자료 폴더에 있어';
  const typeAt = 5.2;
  const AI_ON = typedDoneAt(CMD, typeAt, 10.5) + 0.6; // 스킬 발동
  const TEASE = AI_ON + 1.0; // 다음 장 예고
  const TIP = TEASE + 1.1;

  const pdfs = ['10101_김하늘_보고서.pdf', '10102_이준서_보고서.pdf', '10103_박서연_보고서.pdf'];

  const fileRow = (at: number): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    borderRadius: 8,
    padding: '3px 8px',
    ...popIn(t, at, 0.5),
    boxShadow:
      clickFlash(t, at, 0.8) > 0
        ? `0 0 0 1.5px color-mix(in srgb, ${C.amber} ${55 * clickFlash(t, at, 0.8)}%, transparent)`
        : undefined,
  });

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* 헤더 밴드 */}
      <div style={{ position: 'absolute', left: '6%', top: '6%', width: '88%', textAlign: 'left' }}>
        <div className="kicker">실전 ① 재료 준비</div>
        <h2 className="headline" style={{ margin: '4px 0 6px', wordBreak: 'keep-all' }}>
          파일을 넣고, <span className="accent-text">한 줄</span> 주문한다
        </h2>
        <p style={{ margin: 0, color: 'var(--fg-muted)', fontSize: 'clamp(13px,1.5vw,15px)' }}>
          앞 장의 발동 장면을 처음부터 — 재료(기초자료)를 올리는 것이 시작
        </p>
      </div>

      {/* ① 파일 탐색기 — 기초자료가 착륙하는 조리대 */}
      <AppWindow
        kind="app"
        title="파일 탐색기 — 자료"
        badge="①"
        style={{
          left: '5%',
          top: '24%',
          width: '44%',
          height: '30%',
          ...popIn(t, 0.2),
          ...dimAfter(t, typeAt + 0.3),
        }}
        bodyStyle={{ display: 'flex', flexDirection: 'column' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            borderBottom: '1px solid var(--hair-2)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(10px,1.1vw,12px)',
            color: 'var(--fg-muted)',
          }}
        >
          D: <span style={{ color: 'var(--fg-faint)' }}>›</span> saenggibu-writer{' '}
          <span style={{ color: 'var(--fg-faint)' }}>›</span> <b style={{ color: 'var(--fg)' }}>자료</b>
        </div>
        <div
          style={{
            flex: 1,
            padding: '7px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            fontSize: 'clamp(11px,1.2vw,13px)',
            color: 'var(--fg-muted)',
            textAlign: 'left',
          }}
        >
          {t < PASTE + 0.1 && (
            <div
              style={{
                flex: 1,
                display: 'grid',
                placeItems: 'center',
                color: 'var(--fg-faint)',
                fontStyle: 'italic',
              }}
            >
              복사해 둔 기초자료를 이 폴더에 붙여넣기
            </div>
          )}
          {t > F1 && (
            <div style={fileRow(F1)}>
              <svg width="16" height="13" viewBox="0 0 15 12" aria-hidden>
                <path
                  d="M1 2.2 Q1 1.2 2 1.2 H5.6 L7 2.6 H13 Q14 2.6 14 3.6 V10 Q14 11 13 11 H2 Q1 11 1 10 Z"
                  fill={`color-mix(in srgb, ${C.amber} 55%, transparent)`}
                />
              </svg>
              <b style={{ color: 'var(--fg)' }}>보고서</b>
              <span style={{ color: 'var(--fg-faint)', fontSize: '0.85em' }}>수행평가 pdf 3개</span>
            </div>
          )}
          {pdfs.map(
            (name, i) =>
              t > F1 + 0.2 + i * 0.16 && (
                <div key={name} style={{ ...fileRow(F1 + 0.2 + i * 0.16), paddingLeft: 30 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.72em',
                      fontWeight: 800,
                      color: C.coral,
                      border: `1px solid color-mix(in srgb, ${C.coral} 55%, transparent)`,
                      borderRadius: 4,
                      padding: '0 4px',
                    }}
                  >
                    PDF
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9em' }}>{name}</span>
                </div>
              ),
          )}
          {t > F2 && (
            <div style={fileRow(F2)}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72em',
                  fontWeight: 800,
                  color: C.mint,
                  border: `1px solid color-mix(in srgb, ${C.mint} 55%, transparent)`,
                  borderRadius: 4,
                  padding: '0 4px',
                }}
              >
                XLSX
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9em' }}>자기평가.xlsx</span>
              <span style={{ color: 'var(--fg-faint)', fontSize: '0.85em' }}>한 학기 돌아보기</span>
            </div>
          )}
          {t > F3 && (
            <div style={fileRow(F3)}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72em',
                  fontWeight: 800,
                  color: C.mint,
                  border: `1px solid color-mix(in srgb, ${C.mint} 55%, transparent)`,
                  borderRadius: 4,
                  padding: '0 4px',
                }}
              >
                XLSX
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9em' }}>성적.xlsx</span>
              <span style={{ color: 'var(--fg-faint)', fontSize: '0.85em' }}>분량 조절 기준</span>
            </div>
          )}
        </div>
        {t > F3 + 0.4 && (
          <div
            style={{
              padding: '5px 12px',
              borderTop: '1px solid var(--hair-2)',
              fontSize: 'clamp(10px,1.05vw,11.5px)',
              color: C.mint,
              textAlign: 'left',
              fontWeight: 700,
            }}
          >
            ✓ 5개 항목 — 붙여넣기 완료
          </div>
        )}
      </AppWindow>

      {/* 절차 연결선 ① → ② */}
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <clipPath id="s16a-lead">
          <rect
            x={0}
            y={0}
            width={interpolate(t, [TERM_IN - 0.5, TERM_IN + 0.6], [0, 100], easeInOut)}
            height={100}
          />
        </clipPath>
        <path
          d="M 26 55 C 33 62, 38 60, 44.5 53.5"
          fill="none"
          stroke={`color-mix(in srgb, ${C.amber} 55%, transparent)`}
          strokeWidth="2"
          strokeDasharray="0.9 1.6"
          vectorEffect="non-scaling-stroke"
          clipPath="url(#s16a-lead)"
        />
      </svg>

      {/* ② 터미널 — 첫 주문 한 줄 */}
      <AppWindow
        kind="terminal"
        title="PowerShell — claude · saenggibu-writer 폴더"
        badge="②"
        style={{ left: '45%', top: '52%', width: '50%', zIndex: 3, ...popIn(t, TERM_IN) }}
      >
        <div style={{ color: 'var(--fg-faint)', fontStyle: 'italic' }}>
          작업 폴더에서 claude가 켜져 있습니다 — 이제 주문 한 줄
        </div>
        {t > typeAt - 0.4 && (
          <div style={{ fontWeight: 650 }}>
            <span style={{ color: C.amber, fontWeight: 700 }}>›&nbsp;</span>
            {typed(t, CMD, typeAt, 10.5)}
            {t < AI_ON - 0.1 && <Caret />}
          </div>
        )}
        {t > AI_ON && (
          <div>
            <span style={{ color: 'var(--fg)', fontWeight: 700 }}>●&nbsp;</span>
            saenggibu-writer 스킬 발동 — 매뉴얼(SKILL.md)을 폅니다
          </div>
        )}
        {t > TEASE && (
          <div style={{ color: 'var(--fg-muted)' }}>
            <span style={{ color: 'var(--fg)', fontWeight: 700 }}>●&nbsp;</span>
            시작 전에 몇 가지만 여쭤볼게요 <Caret />
          </div>
        )}
      </AppWindow>

      {/* 실무 팁 배지 */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '90%',
          transform: 'translateX(-50%)',
          padding: '9px 20px',
          borderRadius: 999,
          border: '1px solid var(--hair)',
          background: 'color-mix(in srgb, var(--fg) 6%, var(--bg))',
          fontSize: 'clamp(11.5px,1.3vw,13.5px)',
          color: 'var(--fg-muted)',
          whiteSpace: 'nowrap',
          opacity: interpolate(t, [TIP, TIP + 0.5], [0, 1]),
        }}
      >
        팁: 파일 이름에 <b style={{ color: C.amber }}>학번_이름</b>을 넣어 두면 학생 매칭이
        정확해집니다
      </div>

      {/* 포인터: 붙여넣기 → 터미널 입력줄 */}
      <Pointer
        path={[
          { t: 0.8, x: 30, y: 38 },
          { t: PASTE, x: 26, y: 44, click: true },
          { t: CLICK_TERM, x: 62, y: 61.5, click: true, hide: true },
        ]}
      />
    </div>
  );
}

/* ── 씬(walkthrough): 세특 실전 ② 문답 (16b쪽) ──────────────────────────
   metaphor: 문진 — 의사가 차례로 묻듯 스킬이 필요한 것만 묻고, 단계마다
   확인받고 넘어간다. 구도: 대형 문답 터미널 1창 + 우측 5단계 레일 점등
   (창 하나 크게 — 이 덱 walkthrough 최초의 단일 창 구도).
   대화 내용은 SKILL.md 1~4단계 체크포인트 실사. */
function SaenggibuAskWalk() {
  const t = useSceneTime();
  /* 국면 시각표 — 파생 시각은 typedDoneAt으로 */
  const E1 = 0.3; // 직전 장 대화 요약(디밍) 2줄
  const Q0 = 1.0;
  const Q1 = 1.8;
  const A1T = '정보, 2026학년도';
  const A1 = Q1 + 0.9;
  const Q2 = typedDoneAt(A1T, A1, 12) + 0.6;
  const A2T = '보고서 pdf와 자기평가, 성적 엑셀이야';
  const A2 = Q2 + 0.9;
  const Q3 = typedDoneAt(A2T, A2, 12) + 0.6;
  const A3T = '아직 없어';
  const A3 = Q3 + 0.9;
  const R3 = typedDoneAt(A3T, A3, 12) + 0.5;
  const R3b = R3 + 0.8;
  const CHK = R3b + 0.9;
  const Q4 = CHK + 1.0;
  const A4T = '5명씩 보여줘';
  const A4 = Q4 + 0.9;
  const R4 = typedDoneAt(A4T, A4, 12) + 0.6;
  const TIP = R4 + 1.0;

  const rail = [
    { n: '1', title: '기초 정보', sub: '과목 · 자료 · 연도', at: Q0 + 0.3 },
    { n: '2', title: '프롬프트 준비', sub: "'정보' 맞춤으로 저장", at: R3b },
    { n: '3', title: '자료 정리', sub: '통합 Excel로 확인', at: CHK },
    { n: '4', title: '평가문 작성', sub: '몇 명씩 확인할지', at: Q4 + 0.3 },
    { n: '5', title: '검수 · 업로드', sub: '다음 장에서', at: Infinity },
  ];

  const qLine = (text: string, at: number) =>
    t > at && (
      <div style={{ marginTop: 6 }}>
        <span style={{ color: C.amber, fontWeight: 800 }}>?&nbsp;</span>
        {text}
      </div>
    );
  const aLine = (text: string, at: number, next: number) =>
    t > at - 0.3 && (
      <div style={{ fontWeight: 650 }}>
        <span style={{ color: C.amber, fontWeight: 700 }}>›&nbsp;</span>
        {typed(t, text, at, 12)}
        {t < next - 0.2 && <Caret />}
      </div>
    );

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* 헤더 밴드 */}
      <div style={{ position: 'absolute', left: '6%', top: '6%', width: '88%', textAlign: 'left' }}>
        <div className="kicker">실전 ② 문답</div>
        <h2 className="headline" style={{ margin: '4px 0 6px', wordBreak: 'keep-all' }}>
          묻고, <span className="accent-text">확인받으며</span> 간다
        </h2>
        <p style={{ margin: 0, color: 'var(--fg-muted)', fontSize: 'clamp(13px,1.5vw,15px)' }}>
          답만 하면 됩니다 — 스킬이 필요한 것만 차례로 묻습니다
        </p>
      </div>

      {/* 문답 터미널 — 창 하나 크게, 대화가 자란다 */}
      <AppWindow
        kind="terminal"
        title="PowerShell — claude · saenggibu-writer 폴더"
        style={{ left: '5%', top: '22%', width: '62%', ...popIn(t, 0.15) }}
        bodyStyle={{ lineHeight: 2.0 }}
      >
        {t > E1 && (
          <div style={{ opacity: 0.45 }}>
            <span style={{ color: C.amber, fontWeight: 700 }}>›&nbsp;</span>2026 정보 세특 초안
            작성해줘. 기초자료는 자료 폴더에 있어
          </div>
        )}
        {t > E1 + 0.15 && (
          <div style={{ opacity: 0.45 }}>
            <span style={{ fontWeight: 700 }}>●&nbsp;</span>saenggibu-writer 스킬 발동
          </div>
        )}
        {t > Q0 && (
          <div style={{ marginTop: 6 }}>
            <span style={{ color: 'var(--fg)', fontWeight: 700 }}>●&nbsp;</span>몇 가지만
            여쭤볼게요 — 답만 하면 됩니다
          </div>
        )}
        {qLine('과목명과 학년도는요?', Q1)}
        {aLine(A1T, A1, Q2)}
        {qLine('자료는 어떤 형태인가요?', Q2)}
        {aLine(A2T, A2, Q3)}
        {qLine('NEIS에서 내려받은 세특 양식 파일이 있나요?', Q3)}
        {aLine(A3T, A3, R3)}
        {t > R3 && (
          <div style={{ color: 'var(--fg-muted)' }}>
            <span style={{ color: 'var(--fg)', fontWeight: 700 }}>●&nbsp;</span>알겠어요 —
            업로드용 새 양식을 만들어 드릴게요
          </div>
        )}
        {t > R3b && (
          <div style={{ color: 'var(--fg-muted)' }}>
            <span style={{ color: 'var(--fg)', fontWeight: 700 }}>●&nbsp;</span>프롬프트는 기본
            양식을 '정보' 과목에 맞게 고쳐 저장할게요
          </div>
        )}
        {t > CHK && (
          <div style={{ marginTop: 6 }}>
            <span style={{ color: C.mint, fontWeight: 700 }}>✓&nbsp;</span>자료 정리 완료 —{' '}
            <b>결과.xlsx</b>를 열어 확인해 주세요{' '}
            <span style={{ color: 'var(--fg-faint)' }}>(평가문 칸은 아직 비어 있어요)</span>
          </div>
        )}
        {qLine('평가문은 몇 명씩 쓰고 확인할까요?', Q4)}
        {aLine(A4T, A4, R4)}
        {t > R4 && (
          <div>
            <span style={{ color: 'var(--fg)', fontWeight: 700 }}>●&nbsp;</span>5명 쓸 때마다
            보여드리고, 확인 후 다음으로 갈게요 <Caret />
          </div>
        )}
      </AppWindow>

      {/* 우측 5단계 레일 — 대화가 지금 어느 단계인지 */}
      <div style={{ position: 'absolute', left: '71%', top: '28%', width: '24%', textAlign: 'left' }}>
        <div
          style={{
            fontSize: 'clamp(10.5px,1.15vw,12px)',
            color: 'var(--fg-faint)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            marginBottom: 10,
          }}
        >
          SKILL.md 5단계 — 지금 여기
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {rail.map((s) => {
            const lit = t > s.at;
            const flash = clickFlash(t, s.at, 1.0);
            return (
              <div
                key={s.n}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 11,
                  padding: '7px 12px',
                  borderRadius: 11,
                  border: '1px solid var(--hair)',
                  background: lit ? 'color-mix(in srgb, var(--fg) 7%, var(--bg))' : 'transparent',
                  opacity: lit ? 1 : 0.45,
                  boxShadow:
                    flash > 0
                      ? `0 0 0 2px color-mix(in srgb, ${C.amber} ${55 * flash}%, transparent)`
                      : undefined,
                }}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    flexShrink: 0,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    fontSize: 12.5,
                    background: lit ? 'var(--primary)' : 'transparent',
                    border: lit ? 'none' : '1.5px solid var(--hair)',
                    color: lit ? 'var(--accent-ink)' : 'var(--fg-faint)',
                  }}
                >
                  {s.n}
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 'clamp(12px,1.35vw,14px)' }}>{s.title}</div>
                  <div style={{ color: 'var(--fg-muted)', fontSize: 'clamp(10.5px,1.15vw,12px)' }}>
                    {s.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 안심 배지 */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '88%',
          transform: 'translateX(-50%)',
          padding: '9px 20px',
          borderRadius: 999,
          border: '1px solid var(--hair)',
          background: 'color-mix(in srgb, var(--fg) 6%, var(--bg))',
          fontSize: 'clamp(11.5px,1.3vw,13.5px)',
          color: 'var(--fg-muted)',
          whiteSpace: 'nowrap',
          opacity: interpolate(t, [TIP, TIP + 0.5], [0, 1]),
        }}
      >
        단계마다 멈춰 확인받습니다 — 중간에{' '}
        <b style={{ color: C.amber }}>"여기 고쳐줘"</b>라고 말해도 됩니다
      </div>
    </div>
  );
}

/* ── 씬(walkthrough): 세특 실전 ③ 산출물 (16c쪽) ────────────────────────
   metaphor: 생산 라인 낙하 — 상단 도구 체인(무대 뒤 스킬들)이 차례로 켜지고
   그 산출물이 아래 폴더 트리로 떨어진다. 구도: 상단 칩 밴드 → 하단
   트리·검수창 낙하 (상→하 생산 구도 — 기존 walkthrough와 구분).
   판정 표는 모의 실행의 실제 출력값. */
function SaenggibuHarvestWalk() {
  const t = useSceneTime();
  /* 국면 시각표 */
  const G1 = 0.7; // ① 자료 읽기 스킬
  const G2 = 2.0; // ② 문장 다듬기 스킬
  const G3 = 3.3; // ③ 측정 스크립트
  const P0 = 1.3; // prompts/정보.prompt.txt
  const F1 = 1.8; // students.json + 결과.xlsx
  const F2 = 4.3; // 결과.html
  const F3 = 4.9; // 교과기초자료.xlsx
  const HTML_IN = 5.8; // 검수창 팝
  const BADGE = 8.6;

  const groups = [
    {
      label: '① 자료 읽기',
      note: '형식마다 알맞은 스킬로',
      chips: ['pdf — 기본 내장', 'hwpx 스킬', 'xlsx 스킬'],
      at: G1,
      left: '5%',
    },
    {
      label: '② 문장 다듬기',
      note: 'AI 흔적 제거 3종',
      chips: ['grammar-checker', 'humanizer', 'style-guide'],
      at: G2,
      left: '36.5%',
    },
    {
      label: '③ 분량 · 흔적 측정',
      note: '눈대중 대신 스크립트',
      chips: ['byte_count.py', 'comma_check.py'],
      at: G3,
      left: '68%',
    },
  ];

  const treeRow = (
    at: number,
    indent: number,
    label: ReactNode,
    note?: ReactNode,
    star?: boolean,
  ) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 10,
        paddingLeft: indent * 22,
        ...popIn(t, at, 0.5),
      }}
    >
      {star && <span style={{ color: C.amber, fontWeight: 800 }}>★</span>}
      <span style={{ color: star ? 'var(--fg)' : 'var(--fg-muted)', fontWeight: star ? 800 : 500 }}>
        {label}
      </span>
      {note && (
        <span style={{ color: 'var(--fg-faint)', fontSize: '0.82em', fontFamily: 'var(--font-sans)' }}>
          {note}
        </span>
      )}
    </div>
  );

  /* 모의 실행 실측값 — byte_count.py --json 판정 그대로 */
  const rows = [
    { name: '김하늘', b: '1,404', goal: '1400~1500' },
    { name: '이준서', b: '1,286', goal: '1200~1400' },
    { name: '박서연', b: '1,003', goal: '1000~1200' },
  ];

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* 헤더 밴드 */}
      <div style={{ position: 'absolute', left: '6%', top: '6%', width: '88%', textAlign: 'left' }}>
        <div className="kicker">실전 ③ 산출물</div>
        <h2 className="headline" style={{ margin: '4px 0 6px', wordBreak: 'keep-all' }}>
          주문 한 줄, <span className="accent-text">손은 여럿</span>
        </h2>
        <p style={{ margin: 0, color: 'var(--fg-muted)', fontSize: 'clamp(13px,1.5vw,15px)' }}>
          무대 뒤에서 다른 스킬들이 자동으로 협업하고 — 폴더에 결과가 남습니다
        </p>
      </div>

      {/* 상단 도구 체인 — 무대 뒤 스킬들 */}
      {groups.map((g, gi) => {
        const lit = t > g.at;
        return (
          <div
            key={g.label}
            style={{
              position: 'absolute',
              left: g.left,
              top: '25%',
              width: '27%',
              textAlign: 'left',
              opacity: lit ? 1 : 0.35,
              transition: 'none',
            }}
          >
            <div
              style={{
                fontSize: 'clamp(11px,1.25vw,13px)',
                fontWeight: 800,
                color: lit ? C.amber : 'var(--fg-faint)',
                marginBottom: 6,
              }}
            >
              {g.label}{' '}
              <span style={{ fontWeight: 500, color: 'var(--fg-faint)' }}>— {g.note}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {g.chips.map((c, i) => (
                <span
                  key={c}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'clamp(10px,1.1vw,12px)',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: '1px solid var(--hair)',
                    background: 'color-mix(in srgb, var(--fg) 6%, var(--bg))',
                    color: 'var(--fg-muted)',
                    ...popIn(t, g.at + i * 0.15, 0.45),
                    boxShadow:
                      clickFlash(t, g.at + i * 0.15, 0.9) > 0
                        ? `0 0 0 1.5px color-mix(in srgb, ${C.amber} ${50 * clickFlash(t, g.at + i * 0.15, 0.9)}%, transparent)`
                        : undefined,
                  }}
                >
                  {c}
                </span>
              ))}
            </div>
            {gi < 2 && (
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  right: '-8%',
                  top: 8,
                  color: 'var(--fg-faint)',
                  fontSize: 16,
                }}
              >
                →
              </span>
            )}
          </div>
        );
      })}

      {/* 낙하 연결선 — 도구 체인이 산출물을 떨어뜨린다 */}
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <clipPath id="s16c-drop1">
          <rect
            x={0}
            y={0}
            width={100}
            height={interpolate(t, [F1 - 0.4, F1 + 0.4], [0, 100], easeInOut)}
          />
        </clipPath>
        <clipPath id="s16c-drop2">
          <rect
            x={0}
            y={0}
            width={100}
            height={interpolate(t, [F2 - 0.4, F2 + 0.5], [0, 100], easeInOut)}
          />
        </clipPath>
        <path
          d="M 18 37 C 18 42, 20 44, 22 49.5"
          fill="none"
          stroke={`color-mix(in srgb, ${C.amber} 45%, transparent)`}
          strokeWidth="2"
          strokeDasharray="0.9 1.6"
          vectorEffect="non-scaling-stroke"
          clipPath="url(#s16c-drop1)"
        />
        <path
          d="M 78 37 C 74 46, 50 42, 34 51"
          fill="none"
          stroke={`color-mix(in srgb, ${C.amber} 45%, transparent)`}
          strokeWidth="2"
          strokeDasharray="0.9 1.6"
          vectorEffect="non-scaling-stroke"
          clipPath="url(#s16c-drop2)"
        />
      </svg>

      {/* 작업 폴더 트리 — 무엇이 남았나 */}
      <AppWindow
        kind="app"
        title="saenggibu-writer — 작업 폴더"
        style={{ left: '5%', top: '48%', width: '44%', height: '30%', ...popIn(t, 0.3) }}
        bodyStyle={{
          padding: 'clamp(10px,1.3vw,16px)',
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(11.5px,1.3vw,14px)',
          lineHeight: 2.05,
          textAlign: 'left',
        }}
      >
        {treeRow(0.4, 0, <b style={{ color: 'var(--fg)' }}>saenggibu-writer\</b>)}
        {treeRow(0.55, 1, '자료\\', '내가 넣은 기초자료')}
        {treeRow(P0, 1, 'prompts\\정보.prompt.txt', '과목 맞춤 프롬프트 — 다음에 재사용')}
        {treeRow(0.7, 1, 'results\\2026_정보\\', '산출물은 전부 여기')}
        {treeRow(F1, 2, 'students.json', '중간 데이터 (자동)')}
        {treeRow(F1 + 0.25, 2, '결과.xlsx', '자료 정리 검수 Excel')}
        {treeRow(F2, 2, '결과.html', '최종 검수는 여기', true)}
        {treeRow(F3, 2, '교과기초자료.xlsx', 'NEIS 업로드용', true)}
      </AppWindow>

      {/* 검수용 HTML 미리보기 — 실측 판정 표 */}
      <AppWindow
        kind="browser"
        url="results/2026_정보/결과.html"
        style={{ left: '53%', top: '52%', width: '42%', height: '26%', zIndex: 3, ...popIn(t, HTML_IN) }}
        bodyStyle={{ padding: 'clamp(10px,1.3vw,16px)', textAlign: 'left' }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1.4fr 0.9fr',
            gap: '6px 10px',
            fontSize: 'clamp(11px,1.25vw,13.5px)',
            alignItems: 'center',
          }}
        >
          {['이름', '바이트', '목표', '판정'].map((h) => (
            <div
              key={h}
              style={{
                color: 'var(--fg-faint)',
                fontWeight: 700,
                fontSize: '0.85em',
                borderBottom: '1px solid var(--hair-2)',
                paddingBottom: 4,
              }}
            >
              {h}
            </div>
          ))}
          {rows.map((r, i) => {
            const at = HTML_IN + 0.4 + i * 0.25;
            return (
              <div key={r.name} style={{ display: 'contents' }}>
                <div style={{ fontWeight: 700, ...popIn(t, at, 0.4) }}>{r.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', ...popIn(t, at, 0.4) }}>{r.b}</div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--fg-muted)',
                    ...popIn(t, at, 0.4),
                  }}
                >
                  {r.goal}
                </div>
                <div style={{ ...popIn(t, at, 0.4) }}>
                  <span
                    style={{
                      padding: '2px 10px',
                      borderRadius: 999,
                      fontWeight: 800,
                      fontSize: '0.85em',
                      color: C.mint,
                      border: `1px solid color-mix(in srgb, ${C.mint} 55%, transparent)`,
                      background: `color-mix(in srgb, ${C.mint} 12%, transparent)`,
                    }}
                  >
                    적정
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        {t > HTML_IN + 1.3 && (
          <div
            style={{
              marginTop: 12,
              color: 'var(--fg-faint)',
              fontSize: 'clamp(10.5px,1.15vw,12px)',
            }}
          >
            정렬·검색되는 검수 표 — 활동 자료까지 한 화면에서 대조
          </div>
        )}
      </AppWindow>

      {/* 마무리 배지 */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '86%',
          transform: 'translateX(-50%)',
          padding: '9px 20px',
          borderRadius: 999,
          border: '1px solid var(--hair)',
          background: 'color-mix(in srgb, var(--fg) 6%, var(--bg))',
          fontSize: 'clamp(11.5px,1.3vw,13.5px)',
          color: 'var(--fg-muted)',
          whiteSpace: 'nowrap',
          opacity: interpolate(t, [BADGE, BADGE + 0.5], [0, 1]),
        }}
      >
        열어 볼 파일은 둘 — 검수는 <b style={{ color: C.amber }}>결과.html</b>, 제출은{' '}
        <b style={{ color: C.amber }}>교과기초자료.xlsx</b>
      </div>
    </div>
  );
}

export default function ClaudeCodeGuideDeck() {
  return (
    <Deck>
      {/* 1 — scene: 커서의 초대 */}
      <Slide
        full
        nav="타이틀"
        notes="터미널 공포 해소가 목표. 검은 화면 = 대화의 입구. 여정 5단계 소개."
      >
        <Scene>
          <CursorInvite />
        </Scene>
      </Slide>

      {/* 2 — build: 요리 주문 비유 (v2 — 화이트보드 사진 재활용 대신 덱 고유 잉크 일러스트) */}
      <Slide
        full
        nav="주문 비유"
        notes="다크 덱과 어울리는 잉크 셰프 일러스트. 문법 암기가 아니라 주문하는 법을 배운다. 클릭: 옛날 코딩 ✗ → 주문 ✓ → 결론."
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            gridTemplateColumns: '0.95fr 1.05fr',
            alignItems: 'center',
            gap: '3vw',
            padding: '0 5vw',
          }}
        >
          <Scene style={{ height: 'auto' }}>
            <ChefIdle />
          </Scene>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div className="kicker">왜 클로드 코드인가</div>
            <h2 className="headline" style={{ margin: '2px 0 8px', wordBreak: 'keep-all' }}>
              코딩이 아니라 <span className="accent-text">주문</span>입니다
            </h2>
            <Build at={1}>
              <div
                className="mat"
                style={{ padding: '13px 20px', borderRadius: 13, borderLeft: `3px solid ${C.red}` }}
              >
                <div style={{ fontWeight: 800, color: C.red, marginBottom: 4 }}>
                  ✗ 직접 다 만들기 — 옛날 코딩
                </div>
                <div style={{ color: 'var(--fg-muted)', fontSize: 'clamp(13px,1.5vw,15px)' }}>
                  문법·레시피를 전부 외워 진땀 흘리며 직접 조리한다.
                </div>
              </div>
            </Build>
            <Build at={2}>
              <div
                className="mat"
                style={{ padding: '13px 20px', borderRadius: 13, borderLeft: `3px solid ${C.mint}` }}
              >
                <div style={{ fontWeight: 800, color: C.mint, marginBottom: 4 }}>
                  ✓ 주문하기 — 클로드 코드
                </div>
                <div style={{ color: 'var(--fg-muted)', fontSize: 'clamp(13px,1.5vw,15px)' }}>
                  "파스타 주세요!" — 한국어 부탁이 곧 결과물이 된다.
                </div>
              </div>
            </Build>
            <Build at={3}>
              <p
                className="lead"
                style={{ fontSize: 'clamp(14px,1.7vw,17px)', wordBreak: 'keep-all' }}
              >
                우리가 배울 것은 프로그래밍 문법이 아니라{' '}
                <b style={{ color: C.amber }}>'잘 주문하는 법'</b>입니다.
              </p>
            </Build>
          </div>
        </div>
      </Slide>

      {/* 3 — build: 클로드 코드란? */}
      <Slide
        full
        nav="클로드 코드란"
        notes="핵심: 챗봇은 말만 하고, 클로드 코드는 손이 있다 — 파일을 만들고 고친다."
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            gridTemplateColumns: '1fr 1.35fr',
            alignItems: 'center',
            gap: '3vw',
            padding: '0 5vw',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div className="kicker">개념 ① 클로드 코드</div>
            <h2 className="headline" style={{ margin: '2px 0 8px' }}>
              터미널에서 일하는 <span className="accent-text">AI 에이전트</span>
            </h2>
            {[
              {
                t: '무엇인가',
                b: 'Anthropic의 Claude AI를 터미널에서 쓰는 공식 도구 — 한국어로 대화한다.',
                c: C.amber,
              },
              {
                t: '챗봇과 다른 점',
                b: '말만 하지 않는다. 파일을 읽고·쓰고·명령을 실행하는 손이 달려 있다.',
                c: C.mint,
              },
              {
                t: '어디서 일하나',
                b: '내 컴퓨터의 작업 폴더 안 — 수업 자료·문서를 직접 다룬다.',
                c: C.blue,
              },
            ].map((card, i) => (
              <Build key={i} at={i + 1}>
                <div
                  className="mat"
                  style={{
                    padding: '13px 20px',
                    borderRadius: 13,
                    borderLeft: `3px solid ${card.c}`,
                  }}
                >
                  <div style={{ fontWeight: 800, color: card.c, marginBottom: 4 }}>
                    {card.t}
                  </div>
                  <div
                    style={{ color: 'var(--fg-muted)', fontSize: 'clamp(13px,1.5vw,15px)' }}
                  >
                    {card.b}
                  </div>
                </div>
              </Build>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <img
                src="assets/external/claudecode.png"
                alt="Claude Code 로고"
                style={{ height: 'clamp(42px,5vw,58px)' }}
              />
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    fontSize: 'clamp(16px,2vw,20px)',
                  }}
                >
                  Claude Code
                </div>
                <div style={{ color: 'var(--fg-muted)', fontSize: 'clamp(11px,1.3vw,13px)' }}>
                  Anthropic 공식 터미널 에이전트
                </div>
              </div>
            </div>
            <Terminal
              title="PowerShell — claude"
              lines={[
                { type: 'cmd', text: 'claude' },
                { type: 'ok', text: '클로드 코드 시작 — 무엇을 도와드릴까요?' },
                { type: 'you', text: '수업 안내문 초안 만들어줘' },
                { type: 'ai', text: '안내문.md를 생성했습니다 ✓', cursor: true },
              ]}
            />
          </div>
        </div>
      </Slide>

      {/* 4 — static: CLI 개념 */}
      <Split
        nav="CLI란"
        notes="GUI 100번 클릭 vs 명령 한 줄. 말로 시키는 클로드 코드에 CLI가 꼭 맞는 이유."
        kicker="개념 ② CLI"
        title={
          <>
            마우스 대신, <span className="accent-text">문장 한 줄</span>
          </>
        }
        body="GUI는 아이콘을 눈으로 찾아 클릭하는 방식 — 익숙하지만 반복에 약합니다. CLI(Command Line Interface)는 원하는 것을 문장으로 명령하는 방식이라, '말로 일을 시키는' 클로드 코드에 꼭 맞는 형태입니다."
        media={
          <div style={{ width: '86%' }}>
            <Terminal
              title="PowerShell"
              lines={[
                { type: 'cmd', text: 'dir' },
                { type: 'out', text: '수업자료/  시험지/  활동지/' },
                { type: 'comment', text: '# 마우스 100번 = 명령 한 줄' },
                { type: 'you', text: '활동지 폴더 파일명 정리해줘' },
                { type: 'ok', text: '12개 파일 이름 정리 완료 ✓' },
              ]}
            />
          </div>
        }
      />

      {/* 5 — scene: 에이전트 루프 */}
      <Slide
        full
        nav="에이전트란"
        notes="챗봇에게 부탁하면 설명이 오고, 에이전트에게 부탁하면 파일이 온다. 순환이 핵심."
      >
        <Scene>
          <AgentLoop />
        </Scene>
      </Slide>

      {/* 6 — build: 설치 준비물 (v2 — 엔진 SVG 비대칭) */}
      <Slide
        full
        nav="준비물"
        notes="Node.js가 뭔지 몰라도 됨 — '클로드가 올라탈 엔진', 우측 그림 그대로. 이미 있으면 8쪽으로."
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            gridTemplateColumns: '1.15fr 0.85fr',
            alignItems: 'center',
            gap: '2.5vw',
            padding: '0 5vw',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <div className="kicker">설치 준비</div>
            <h2 className="headline" style={{ margin: '2px 0 10px', wordBreak: 'keep-all' }}>
              준비물은 <span className="accent-text">셋</span>뿐입니다
            </h2>
          {[
            {
              icon: '🟢',
              t: 'Node.js LTS',
              b: (
                <>
                  클로드 코드가 올라탈 엔진 —{' '}
                  <LinkOut href="https://nodejs.org">nodejs.org</LinkOut>에서 무료
                </>
              ),
              chk: 'node --version',
            },
            {
              icon: '🔑',
              t: 'Claude 계정',
              b: (
                <>
                  로그인에 사용 (Pro 이상 권장) —{' '}
                  <LinkOut href="https://claude.ai">claude.ai</LinkOut>에서 가입
                </>
              ),
              chk: '브라우저에서 로그인 확인',
            },
            {
              icon: '💻',
              t: 'PowerShell',
              b: 'Windows 기본 내장 — 따로 설치할 것 없음',
              chk: '시작 메뉴에서 PowerShell 검색',
            },
          ].map((it, i) => (
            <Build key={i} at={i + 1}>
              <div
                className="mat"
                style={{
                  padding: '13px 20px',
                  borderRadius: 13,
                  display: 'flex',
                  gap: 14,
                  alignItems: 'center',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 24 }}>{it.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800 }}>{it.t}</div>
                  <div style={{ color: 'var(--fg-muted)', fontSize: 'clamp(12px,1.4vw,14px)' }}>
                    {it.b}
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'clamp(11px,1.2vw,12px)',
                    color: C.amber,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {it.chk}
                </span>
              </div>
            </Build>
          ))}
            <p style={{ color: 'var(--fg-muted)', marginTop: 5, fontSize: 'clamp(12px,1.4vw,14px)' }}>
              셋 다 이미 있다면 — 바로 8쪽 설치 명령으로.
            </p>
          </div>
          <Scene style={{ height: 'auto' }}>
            <EngineIdle />
          </Scene>
        </div>
      </Slide>

      {/* 7 — walkthrough(scene): Node.js 설치 — 창 3개 배턴 릴레이 시연 */}
      <Slide
        full
        nav="설치① Node"
        notes="화면 그대로 시연: nodejs.org LTS 클릭 → 마법사 전부 기본값 → 새 PowerShell에서 node --version. 설치 후 반드시 PowerShell을 새로 열 것 — PATH 미반영이 최다 질문."
      >
        <Scene>
          <NodeInstallWalk />
        </Scene>
      </Slide>

      {/* 8 — walkthrough(scene): 클로드 코드 설치 — 터미널 여는 법부터 */}
      <Slide
        full
        nav="설치② 클로드"
        notes="터미널 여는 것부터 시연: 시작 버튼(또는 Win 키) → powershell 검색 → 실행. 설치·확인은 각 한 줄 — 복사 붙여넣기 안내. npm·-g 용어 칩은 끝에 정리."
      >
        <Scene>
          <ClaudeInstallWalk />
        </Scene>
      </Slide>

      {/* 9 — walkthrough(scene): 첫 실행과 로그인 — 탐색기 우클릭→터미널→브라우저 인증 */}
      <Slide
        full
        nav="설치③ 로그인"
        notes="cd 대신 탐색기: 작업 폴더 빈 곳 우클릭 → '터미널에서 열기' → claude. 로그인은 최초 1회 — 좌측 단계 카드가 국면 따라 점등."
      >
        <Scene>
          <ClaudeLoginWalk />
        </Scene>
      </Slide>

      {/* 10 — build: 첫 실행 마법사 — CLI 선택 화면 그대로 */}
      <Slide
        full
        nav="첫 실행 선택"
        notes="처음 사용자는 CLI 선택 UI 자체가 낯설다 — 실제 화면을 그대로 보여주고 무엇을 고를지 못박는다. 키 조작 배지 강조: 화살표·숫자·Enter."
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 11,
            padding: '0 6vw',
          }}
        >
          <div className="kicker">설치 ③-1 · 첫 실행 마법사</div>
          <h2 className="headline" style={{ margin: '0 0 2px', textAlign: 'center', wordBreak: 'keep-all' }}>
            화면 그대로 — <span className="accent-text">고를 것은 정해져</span> 있습니다
          </h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['↑ ↓  이동', '숫자  바로 선택', 'Enter  확정'].map((k) => (
              <span
                key={k}
                className="mat"
                style={{
                  padding: '7px 16px',
                  borderRadius: 999,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'clamp(11px,1.3vw,13px)',
                  color: C.amber,
                }}
              >
                {k}
              </span>
            ))}
          </div>
          <Build at={1} style={{ width: 'min(720px, 94%)' }}>
            <SelectMock
              title="① Choose the text style that looks best with your terminal:"
              options={['1. Dark mode', '2. Light mode', '3. Dark mode (colorblind-friendly)']}
              pick={0}
              note="테마는 취향 — 아무거나 Enter (나중에 /theme 로 변경 가능)"
            />
          </Build>
          <Build at={2} style={{ width: 'min(720px, 94%)' }}>
            <SelectMock
              title="② Select login method:"
              options={[
                '1. Claude account with subscription (Pro · Max)',
                '2. Anthropic Console account (API 종량제)',
              ]}
              pick={0}
              note="구독 계정이면 1번 — 브라우저가 열리면 로그인 후 터미널로 돌아오기"
            />
          </Build>
          <Build at={3} style={{ width: 'min(720px, 94%)' }}>
            <SelectMock
              title="③ Do you trust the files in this folder?"
              options={['1. Yes, proceed', '2. No, exit']}
              pick={0}
              note="내가 만든 수업 폴더가 맞으면 Yes — 폴더 밖은 건드리지 않는다"
            />
          </Build>
        </div>
      </Slide>

      {/* 11 — build: 첫 대화 */}
      <Slide
        full
        nav="첫 대화"
        notes="첫 마디는 인사가 아니라 부탁. 정중할 필요 없이 구체적으로."
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 14,
            padding: '0 6vw',
          }}
        >
          <div className="kicker">실행 — 첫 대화</div>
          <h2 className="headline" style={{ margin: '0 0 6px', textAlign: 'center' }}>
            인사 말고 <span className="accent-text">부탁</span>을 하세요
          </h2>
          <div style={{ width: 'min(760px, 94%)' }}>
            <Terminal
              title="claude — 첫 질문"
              lines={[
                { type: 'you', text: '이 폴더에 어떤 파일이 있어?' },
                { type: 'ai', text: '한글 파일 2개·PDF 1개가 있네요 — 표로 정리해 드릴까요?' },
              ]}
            />
          </div>
          <Build at={1} style={{ width: 'min(760px, 94%)' }}>
            <Terminal
              title="claude — 첫 부탁"
              lines={[
                { type: 'you', text: '다음 주 수업계획.md 초안 만들어줘' },
                { type: 'ai', text: '수업계획.md 생성 완료 ✓ — 열어서 확인해 보세요.', cursor: true },
              ]}
            />
          </Build>
          <Build at={2}>
            <div
              className="mat"
              style={{ padding: '12px 22px', borderRadius: 999, fontSize: 'clamp(13px,1.5vw,15px)' }}
            >
              💡 좋은 첫 마디 = <b>동사로 끝나는 부탁</b> — "정리해줘", "만들어줘", "고쳐줘"
            </div>
          </Build>
        </div>
      </Slide>

      {/* 12 — scene: 권한 검문소 (v2 — Steps 컴포넌트에서 고유 메타포로 승격) */}
      <Slide
        full
        nav="안전장치"
        notes="성적 파일이 있는 컴퓨터에서도 안심 — 쓰기 요청이 차단봉 앞에 물리적으로 멈추는 것을 시간으로 보여준다. y 입력 → 봉 상승 → 통과, 읽기는 무정차."
      >
        <Scene>
          <CheckpointScene />
        </Scene>
      </Slide>

      {/* 13 — build×scene: 자주 막히는 곳 — 카드마다 해법 미니 시연 루프 */}
      <Slide
        full
        nav="문제 해결"
        notes="연수 후 질문의 90%가 이 장. 각 카드 오른쪽 미니 시연이 반복 재생 — 사진 찍어 두라고 안내."
      >
        <Scene>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              padding: '0 5vw',
            }}
          >
            <div className="kicker">문제 해결</div>
            <h2
              className="headline"
              style={{ textAlign: 'center', margin: '0 0 6px', wordBreak: 'keep-all' }}
            >
              막히면 십중팔구 <span className="accent-text">이 넷</span> 중 하나
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 13,
                width: 'min(1080px, 96%)',
              }}
            >
              {[
                {
                  s: '"인식할 수 없습니다"',
                  f: 'PowerShell을 새로 연다 — 설치 직후엔 PATH가 옛 창에 없음',
                  V: FixNewShell,
                },
                {
                  s: '로그인이 무한 반복',
                  f: '기본 브라우저에서 claude.ai 로그인 상태부터 확인',
                  V: FixLoginLoop,
                },
                {
                  s: '한글·공백 경로 오류',
                  f: '작업 폴더명은 영문 권장 — 예: C:\\lessons',
                  V: FixPath,
                },
                {
                  s: '권한 요청이 안 보임',
                  f: '터미널 창 맨 아래 프롬프트 확인 — y 입력 대기 중',
                  V: FixPromptY,
                },
              ].map((q, i) => (
                <Build key={i} at={i + 1}>
                  <div
                    className="mat"
                    style={{
                      padding: '13px 16px',
                      borderRadius: 13,
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          color: C.red,
                          marginBottom: 6,
                          fontSize: 'clamp(12px,1.4vw,14px)',
                        }}
                      >
                        <span
                          aria-hidden
                          style={{
                            display: 'inline-grid',
                            placeItems: 'center',
                            width: 17,
                            height: 17,
                            borderRadius: '50%',
                            background: `color-mix(in srgb, ${C.red} 22%, transparent)`,
                            fontSize: 11.5,
                            flexShrink: 0,
                          }}
                        >
                          !
                        </span>
                        <span style={{ wordBreak: 'keep-all' }}>{q.s}</span>
                      </div>
                      <div
                        style={{
                          color: C.mint,
                          fontSize: 'clamp(12px,1.4vw,14px)',
                          wordBreak: 'keep-all',
                        }}
                      >
                        → {q.f}
                      </div>
                    </div>
                    <q.V />
                  </div>
                </Build>
              ))}
            </div>
          </div>
        </Scene>
      </Slide>

      {/* 13 — scene: 스킬 = 레시피 카드 */}
      <Slide
        full
        nav="스킬이란"
        notes="스킬 = 절차 지식의 카드화. 트리거 문구로 재생. 교사 노하우가 곧 카드."
      >
        <Scene>
          <CardDock />
        </Scene>
      </Slide>

      {/* 14 — static: 스킬 설정 (예시는 실제 운영 스킬 saenggibu-writer 실사) */}
      <Slide
        full
        nav="스킬 설정"
        notes="코딩이 아니라 문서 쓰기 — 업무 매뉴얼처럼. frontmatter가 트리거. 화면은 실제 운영 중인 생기부 스킬(E:\\saenggibu-writer) 그대로 — 다음 장에서 이 스킬을 부른다."
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            gridTemplateColumns: '1fr 1.35fr',
            alignItems: 'center',
            gap: '3vw',
            padding: '0 5vw',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="kicker">스킬 설정</div>
            <h2 className="headline" style={{ margin: '2px 0 8px', wordBreak: 'keep-all' }}>
              파일 <span className="accent-text">하나</span>로 시작한다
            </h2>
            <div
              className="mat"
              style={{
                padding: '14px 18px',
                borderRadius: 13,
                fontFamily: 'var(--font-mono)',
                fontSize: 'clamp(12px,1.4vw,14px)',
                lineHeight: 1.9,
                whiteSpace: 'pre',
              }}
            >
              {`saenggibu-writer/   ← 작업 폴더
└─ .claude/skills/
   └─ saenggibu-writer/
      ├─ SKILL.md     ← 시작은 이 파일 하나
      ├─ scripts/     (바이트 계산 등)
      ├─ assets/      (양식·기본 프롬프트)
      └─ references/  (과목별 누적 지시)`}
            </div>
            <p style={{ color: 'var(--fg-muted)', fontSize: 'clamp(12px,1.4vw,14px)', wordBreak: 'keep-all' }}>
              머리말(name·description)이 트리거, 본문이 절차 — 코딩이 아니라
              업무 매뉴얼 쓰기입니다. 화면은 실제 운영 중인{' '}
              <b style={{ color: 'var(--fg)' }}>생기부 세특 스킬</b> 그대로.
            </p>
            {/* 실물 스킬 배포 — 받아서 .claude/skills/에 풀면 바로 사용 */}
            <a
              href="data/AI전문적학습동아리/클로드코드-사용안내/saenggibu-writer.zip"
              download
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                alignSelf: 'flex-start',
                padding: '11px 20px',
                borderRadius: 12,
                background: 'var(--accent)',
                color: 'var(--accent-ink)',
                fontWeight: 800,
                fontSize: 'clamp(12.5px,1.4vw,14.5px)',
                textDecoration: 'none',
              }}
            >
              ⬇ 이 스킬 통째로 받기 — saenggibu-writer.zip
              <span style={{ fontWeight: 600, fontSize: '0.82em', opacity: 0.75 }}>2.5MB</span>
            </a>
            <p
              style={{
                margin: 0,
                color: 'var(--fg-faint)',
                fontSize: 'clamp(11px,1.2vw,12.5px)',
                wordBreak: 'keep-all',
              }}
            >
              압축을 풀어 작업 폴더의{' '}
              <b style={{ fontFamily: 'var(--font-mono)' }}>.claude/skills/</b>에 넣으면 내
              클로드도 같은 스킬을 씁니다
            </p>
          </div>
          <CodeWindow
            title="SKILL.md — saenggibu-writer (실제 파일 요약)"
            highlight={[2, 3]}
            code={`---
name: saenggibu-writer
description: 생활기록부 세특·평가문 작성 파이프라인.
  "세특 써줘", "생기부 작성", "바이트 수 맞춰서"
  등을 언급하면 반드시 이 스킬을 사용한다.
---

# 생활기록부 평가문(세특) 작성 스킬

1. 기초 정보 수집 — 과목·자료·연도
2. 프롬프트 준비 — prompts/<과목>.prompt.txt
3. 학생 자료 정리 → 통합 Excel
4. 평가문 작성(NLP) + 품질 보정 + 바이트 검증
5. 검수 HTML + NEIS 업로드 xlsx`}
          />
        </div>
      </Slide>

      {/* 15 — walkthrough(scene): 스킬 사용 — saenggibu-writer 실전 발동 시연 */}
      <Slide
        full
        nav="스킬 사용"
        notes="자연어 한 마디('세특 초안 작성해줘')로 실제 스킬이 발동 — SKILL.md 레시피가 장착되고 5단계가 대화로 흐른 뒤 산출물(검수 HTML·NEIS xlsx)이 나온다. 직접 호출(/saenggibu-writer)과 목록 질문도 배지로 안내."
      >
        <Scene>
          <SkillUseWalk />
        </Scene>
      </Slide>

      {/* 16a — walkthrough: 세특 실전 ① 재료 준비 — 파일 넣고 첫 명령 */}
      <Slide
        full
        nav="세특① 재료"
        notes="E2E 실전 1/3. 기초자료(보고서 pdf 3 + 자기평가·성적 xlsx)를 자료 폴더에 붙여넣고, 터미널에서 첫 주문 한 줄. 파일명에 학번_이름을 넣으면 매칭이 정확해진다는 팁까지. 발동 직후 '몇 가지만 여쭤볼게요'가 다음 장 예고."
      >
        <Scene>
          <SaenggibuPrepWalk />
        </Scene>
      </Slide>

      {/* 16b — walkthrough: 세특 실전 ② 문답 — 스킬이 묻고 내가 답한다 */}
      <Slide
        full
        nav="세특② 문답"
        notes="E2E 실전 2/3. 스킬의 1단계 질문(과목·자료·NEIS 양식) → 답 → 프롬프트 저장 → 자료 정리 확인(평가문 칸은 비어 있음) → 배치 크기 질문까지 실제 대화 흐름. 우측 레일이 지금 몇 단계인지 점등. 핵심: 에이전트는 혼자 달리지 않고 단계마다 확인받는다."
      >
        <Scene>
          <SaenggibuAskWalk />
        </Scene>
      </Slide>

      {/* 16c — walkthrough: 세특 실전 ③ 산출물 — 파일 구조와 무대 뒤 스킬들 */}
      <Slide
        full
        nav="세특③ 산출물"
        notes="E2E 실전 3/3. 한 번의 주문 뒤에서 pdf 읽기·hwpx·xlsx(자료), grammar-checker·humanizer·style-guide(문장), byte_count·comma_check(측정)가 자동 협업 — 폴더에는 prompts/정보.prompt.txt와 results/2026_정보/ 4개 파일이 남는다. 판정 표는 모의 실행 실측값. 열어 볼 것은 결과.html(검수)과 교과기초자료.xlsx(제출) 둘."
      >
        <Scene>
          <SaenggibuHarvestWalk />
        </Scene>
      </Slide>

      {/* 20 — build: 잘 시키는 습관 (순서 교체 — 실전 사례보다 앞) */}
      <Slide
        nav="잘 시키기"
        notes="신규 교사에게 일 맡기듯 — 맥락·재료·범위·확인. 마지막 배지가 오늘의 요약."
      >
        <div className="kicker" style={{ textAlign: 'center', marginBottom: 8 }}>
          잘 시키는 법
        </div>
        <h2
          className="headline"
          style={{ textAlign: 'center', margin: '0 auto 20px', wordBreak: 'keep-all' }}
        >
          결과의 품질은 <span className="accent-text">주문의 품질</span>
        </h2>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 11,
            maxWidth: 860,
            marginInline: 'auto',
          }}
        >
          <Build at={1}>
            <HabitCard
              title="구체적으로"
              bad='"활동지 잘 만들어줘"'
              good='"고1 정보, A4 1장, 문항 5개"'
            />
          </Build>
          <Build at={2}>
            <HabitCard
              title="재료를 줘라"
              bad='"알아서 해줘"'
              good='"작년 활동지.hwp 참고해서"'
            />
          </Build>
          <Build at={3}>
            <HabitCard
              title="한 번에 하나"
              bad='"시험지랑 해설지랑 통계까지"'
              good='"먼저 시험지부터 — 확인 후 다음"'
            />
          </Build>
          <Build at={4}>
            <HabitCard
              title="결과를 검증"
              bad="받자마자 배포"
              good="열어 보고 → 수정 요청 → 배포"
            />
          </Build>
          <Build at={5}>
            <div
              style={{
                textAlign: 'center',
                marginTop: 6,
                fontWeight: 800,
                color: C.amber,
                fontSize: 'clamp(14px,1.7vw,17px)',
              }}
            >
              = 프롬프트가 아니라 <u>업무 지시</u>입니다
            </div>
          </Build>
        </div>
      </Slide>

      {/* 21 — build: 아이디어 → 도구 (v2 — 화이트보드 사진 대신 전구 SVG + 사례 카드) */}
      <Slide
        full
        nav="실전 사례"
        notes="네 가지 전부 이 동아리에서 실제 운영 중 — 활동지 시스템·시험지·수업덱 파이프라인. 클릭으로 사례 4개 전개 후 공통 패턴 배지."
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            gridTemplateColumns: '0.8fr 1.25fr',
            alignItems: 'center',
            gap: '3vw',
            padding: '0 5vw',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <Scene style={{ height: 'auto' }}>
              <BulbGlow />
            </Scene>
            <div className="kicker" style={{ marginTop: 14 }}>
              실전 — 교사의 하루
            </div>
            <h2
              className="headline"
              style={{ margin: '8px auto 0', wordBreak: 'keep-all' }}
            >
              아이디어가 <span className="accent-text">도구</span>가 되기까지
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {[
              { t: '수업 게임', b: '개념을 놀이로 — 클릭 그리드·실시간 퀴즈', c: C.mint },
              { t: '학습지·퀴즈', b: '활동지 시스템 — 제출이 구글 시트에 자동 기록', c: C.blue },
              { t: '학급 운영 도구', b: '자리 배치·모둠 편성·타이머, 필요할 때 즉석 제작', c: C.coral },
              { t: '안내 홈페이지', b: '가정통신·행사 안내를 링크 한 장으로', c: C.amber },
            ].map((it, i) => (
              <Build key={i} at={i + 1}>
                <div
                  className="mat"
                  style={{
                    padding: '12px 18px',
                    borderRadius: 13,
                    borderLeft: `3px solid ${it.c}`,
                  }}
                >
                  <span style={{ fontWeight: 800, color: it.c }}>{it.t}</span>
                  <span
                    style={{
                      color: 'var(--fg-muted)',
                      fontSize: 'clamp(12px,1.4vw,14px)',
                      marginLeft: 10,
                    }}
                  >
                    {it.b}
                  </span>
                </div>
              </Build>
            ))}
            <Build at={5}>
              <div
                className="mat"
                style={{
                  padding: '11px 20px',
                  borderRadius: 999,
                  textAlign: 'center',
                  fontSize: 'clamp(13px,1.5vw,15px)',
                }}
              >
                공통 패턴 — <b style={{ color: C.amber }}>아이디어 → 주문 → 스킬로 굳히기</b>
              </div>
            </Build>
          </div>
        </div>
      </Slide>

      {/* 18 — scene: 여정 지도 */}
      <Slide
        full
        nav="한눈 정리"
        notes="완주 회고. 최고의 복습 = 내일 아침 첫 주문 한 줄."
      >
        <Scene>
          <JourneyMap />
        </Scene>
      </Slide>

      {/* 20 — build: 부록 ① 대화 팁 (팁 5종은 공식 문서 검증 — Alt+Enter 아님, Shift+Enter) */}
      <Slide
        full
        nav="부록① 대화 팁"
        notes="자습용 부록. @는 입력 중 파일 목록이 떠서 특정 파일을 정확히 지정, /btw는 기록에 안 남는 곁다리 질문, 줄바꿈은 Shift+Enter(Windows Terminal 기본 — Alt+Enter는 비공식이라 정정), /model은 s키로 세션 한정 전환."
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
            padding: '0 6vw',
          }}
        >
          <div className="kicker">부록 ① · 활용 팁</div>
          <h2
            className="headline"
            style={{ margin: '0 0 6px', textAlign: 'center', wordBreak: 'keep-all' }}
          >
            대화가 편해지는 <span className="accent-text">네 가지</span>
          </h2>
          <Build at={1} style={{ width: 'min(780px, 94%)' }}>
            <TipCard
              cmd="@파일"
              title="특정 파일을 콕 집어 지정"
              desc="메시지 입력 중 @를 치면 폴더의 파일 목록이 떠서 고를 수 있다 — '아까 그 파일'이라고 말하는 대신 대상 파일을 정확히 지정."
              example="@results/2026_정보/결과.html 이 표에서 3반만 추려줘"
            />
          </Build>
          <Build at={2} style={{ width: 'min(780px, 94%)' }}>
            <TipCard
              cmd="/btw"
              title="흐름을 안 끊는 곁다리 질문"
              desc="본 대화 기록에 남지 않는 사이드 질문 — 클로드가 작업하는 중에도 물어볼 수 있다 (답만 하고 파일은 건드리지 않음)."
              example="/btw 아까 만든 활동지 파일 이름이 뭐였지?"
            />
          </Build>
          <Build at={3} style={{ width: 'min(780px, 94%)' }}>
            <TipCard
              cmd="Shift+Enter"
              title="여러 줄로 정확하게 주문"
              desc={
                <>
                  입력 중 줄바꿈 — 조건을 줄로 정리하면 주문이 정확해진다.
                  (<code>\</code>+Enter, Ctrl+J도 가능 · Alt+Enter는 공식 단축키가
                  아님)
                </>
              }
              example={
                '수업계획 초안 만들어줘\n대상: 고1 정보 · 분량: A4 1장\n말투: 학생에게 친근하게'
              }
            />
          </Build>
          <Build at={4} style={{ width: 'min(780px, 94%)' }}>
            <TipCard
              cmd="/model"
              title="모델 바꾸기"
              desc="쓰는 모델을 전환한다 — 인자 없이 치면 선택 화면, s 키를 누르면 이번 세션만 바꾼다(기본값 유지)."
              example="/model        # 선택 화면 열기"
            />
          </Build>
        </div>
      </Slide>

      {/* 21 — build: 부록 ② 실행 팁 */}
      <Slide
        full
        nav="부록② 실행 팁"
        notes="resume은 '어제 하던 일 이어서' — 교사에게 가장 실용적. effort는 일의 난이도에 맞춰 조절. 위험 플래그는 12쪽 차단봉을 스스로 여는 것 — 익숙해진 뒤 신뢰하는 폴더에서만."
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
            padding: '0 6vw',
          }}
        >
          <div className="kicker">부록 ② · 활용 팁</div>
          <h2
            className="headline"
            style={{ margin: '0 0 6px', textAlign: 'center', wordBreak: 'keep-all' }}
          >
            실행을 다루는 <span className="accent-text">세 가지</span>
          </h2>
          <Build at={1} style={{ width: 'min(780px, 94%)' }}>
            <TipCard
              cmd="/resume"
              title="지난 대화 이어서 하기"
              desc="이전 세션 목록이 떠서 골라 이어간다 — 어제 만들던 자료를 오늘 계속. 터미널에서 claude --resume 로 시작해도 같다."
              example={'/resume        # 지난 세션 목록에서 선택\nclaude --resume   # 터미널에서 바로'}
            />
          </Build>
          <Build at={2} style={{ width: 'min(780px, 94%)' }}>
            <TipCard
              cmd="/effort"
              title="생각의 깊이 조절"
              desc="추론 노력(reasoning effort)을 조절한다 — 머리 쓰는 일은 올리고, 단순한 일은 내려서 빠르게."
              example={
                '/effort high   # 시험 문항 출제처럼 어려운 일\n/effort low    # 파일 이름 정리처럼 단순한 일'
              }
            />
          </Build>
          <Build at={3} style={{ width: 'min(780px, 94%)' }}>
            <TipCard
              warn
              cmd="claude --dangerously-skip-permissions"
              title="권한 확인 생략 — 신중하게"
              desc="매번 y를 묻지 않고 바로 실행한다. 12쪽의 차단봉을 스스로 여는 것과 같으므로 — 충분히 익숙해진 뒤, 신뢰하는 작업 폴더에서만."
              example="claude --dangerously-skip-permissions"
            />
          </Build>
          <Build at={4}>
            <div
              className="mat"
              style={{
                padding: '10px 20px',
                borderRadius: 999,
                fontSize: 'clamp(12px,1.4vw,14px)',
                color: 'var(--fg-muted)',
              }}
            >
              더 많은 명령은 터미널에서{' '}
              <span style={{ fontFamily: 'var(--font-mono)', color: C.amber }}>/help</span>
            </div>
          </Build>
        </div>
      </Slide>
    </Deck>
  );
}
