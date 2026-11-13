import type { CSSProperties, ReactNode } from 'react';
import Build from '../../../../src/deck/Build';
import { useSceneTime, interpolate, spring, riseIn, easeInOut } from '../../../../src/scene';
import { abs, C, ASPECT, ORDER, STILL, kick, h1, small, mono, solid, Header, Term, Chip, Note, Arrow, SceneCard, Clapper, useClicks } from './shared';
import { BEATS } from './cards';

const fade = (t: number, at: number, d = 0.35) => interpolate(t, [at, at + d], [0, 1]);
const chalk: CSSProperties = { position: 'absolute', color: C.chalk, fontFamily: 'var(--font-head)', fontWeight: 800, lineHeight: 1, whiteSpace: 'nowrap' };
/* 분필 글씨가 왼쪽부터 써지는 효과 — t의 순수 함수 */
const write = (t: number, at: number, d = 0.5): CSSProperties => ({ clipPath: `inset(0 ${(1 - interpolate(t, [at, at + d], [0, 1])) * 100}% 0 0)` });

/* ═══════════════════ S1 — 딱! 한 장면의 시작 (scene) ═══════════════════ */
export function TitleScene() {
  const t = useSceneTime();
  /* 막대가 들린 채 0.5초 → 가속하며 닫힘(0.5~0.78) → 살짝 튕김 */
  const close = interpolate(t, [0.5, 0.78], [0, 1]);
  const angle = -28 * (1 - close * close) + (t > 0.78 ? -2.5 * Math.max(0, 1 - (t - 0.78) / 0.25) * Math.sin((t - 0.78) * 30) : 0);
  const k = 900 / 320;
  const X = 880;
  const Y = 200;
  const bx = (v: number) => v * k;
  const shake = t > 0.78 && t < 1.0 ? Math.sin((t - 0.78) * 60) * 3 * (1 - (t - 0.78) / 0.22) : 0;
  return (
    <>
      <div style={{ ...abs(120, 250, 700) }}>
        <div style={{ ...kick, ...riseIn(t, 0.1) }}>AI쇼츠제작 · 장면 설계</div>
        <h1 style={{ ...h1, fontSize: 104, marginTop: 18, ...riseIn(t, 0.2) }}>한 숏을<br />설계하다</h1>
        <div style={{ fontSize: 38, fontWeight: 700, marginTop: 26, color: C.mute, wordBreak: 'keep-all', ...riseIn(t, 0.35) }}>장면 카드에서 프롬프트까지</div>
      </div>
      <div style={{ ...abs(0, 0), transform: `translate(${shake}px, ${Math.abs(shake) * 0.4}px)` }}>
        <Clapper x={X} y={Y} w={900} angle={angle}>
          <span style={{ ...chalk, left: bx(36), top: bx(54), fontSize: 26, opacity: 0.7 }}>장면</span>
          <span style={{ ...chalk, left: bx(126), top: bx(54), fontSize: 26, opacity: 0.7 }}>숏</span>
          <span style={{ ...chalk, left: bx(216), top: bx(54), fontSize: 26, opacity: 0.7 }}>테이크</span>
          <span style={{ ...chalk, left: bx(36), top: bx(68), fontSize: 100, ...write(t, 0.95, 0.25) }}>3</span>
          <span style={{ ...chalk, left: bx(126), top: bx(68), fontSize: 100, ...write(t, 1.3, 0.25) }}>1</span>
          <span style={{ ...chalk, left: bx(216), top: bx(68), fontSize: 100, ...write(t, 1.6, 0.25) }}>1</span>
          <span style={{ ...chalk, left: bx(36), top: bx(124), fontSize: 66, ...write(t, 1.85, 0.55) }}>비 오는 하굣길</span>
          <span style={{ ...chalk, left: bx(36), top: bx(182), fontSize: 40, opacity: 0.85, ...write(t, 2.45, 0.5) }}>반전 — 노란 우산이 들어온다</span>
        </Clapper>
      </div>
      {/* 오늘의 세 걸음 */}
      <div style={{ ...abs(120, 880, 1600), display: 'flex', gap: 18, alignItems: 'center', ...riseIn(t, 2.9) }}>
        <Chip size={23}>① 장면이란?</Chip>
        <span style={{ fontSize: 26, color: C.mute }}>→</span>
        <Chip size={23}>② 장면 카드 다섯 칸</Chip>
        <span style={{ fontSize: 26, color: C.mute }}>→</span>
        <Chip size={23}>③ 조수와 다듬어 생성</Chip>
      </div>
    </>
  );
}

/* ═══════════════════ S2 — 이 그림이 5초짜리 영상이라면? (build 2) ═══════════════════ */
export function StillSlide() {
  return (
    <>
      <Header kicker="오리엔테이션에서 본 장면" title="이 그림이 5초짜리 영상이라면?" />
      <div style={{ ...abs(120, 210, 1080, 608), borderRadius: 20, overflow: 'hidden', border: `4px solid ${C.ink}`, boxShadow: '0 30px 60px -36px rgba(29,27,34,.7)' }}>
        <img src={STILL} alt="심해 위를 걷는 소년 뒷모습 실루엣, 멀리 빛나는 도시" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <Build at={1} style={{ position: 'absolute', inset: 0 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(29,27,34,.28)', display: 'grid', placeItems: 'center' }}>
            <div style={{ display: 'flex', gap: 22 }}>
              <span style={{ width: 34, height: 120, borderRadius: 8, background: 'rgba(255,253,248,.92)' }} />
              <span style={{ width: 34, height: 120, borderRadius: 8, background: 'rgba(255,253,248,.92)' }} />
            </div>
          </div>
          <div style={{ position: 'absolute', left: 24, bottom: 22 }}>
            <Chip size={24} style={{ background: C.card }}>이건 한 장의 그림 — 멈춘 순간</Chip>
          </div>
        </Build>
      </div>
      <div style={{ ...abs(1250, 210, 560) }}>
        <div style={{ ...small, fontWeight: 800, color: C.ink }}>그때의 프롬프트 (다섯 조각)</div>
        <div style={{ ...solid, padding: '18px 22px', marginTop: 10, fontSize: 25, lineHeight: 1.5, color: C.mute, wordBreak: 'keep-all' }}>
          “심해 위를 걷는 소년, 빛나는 도시, 잔잔한 물결, 시네마틱, 감성적인 분위기”
        </div>
      </div>
      <Build at={2} style={{ ...abs(1250, 480, 560) }}>
        <div style={{ fontSize: 26, fontWeight: 800 }}>5초 동안…</div>
        {['무엇이 움직이나?', '어디서 어디로?', '카메라는?'].map((q) => (
          <div key={q} style={{ marginTop: 14, padding: '16px 20px', borderRadius: 12, border: '2.5px dashed rgba(29,27,34,.35)', fontSize: 26, fontWeight: 700, color: C.ink }}>{q}</div>
        ))}
      </Build>
      <div style={{ ...abs(120, 850, 1080) }}>
        <div style={{ ...small }}>그림: 오리엔테이션 덱 생성 이미지(ai-video-showcase)</div>
      </div>
    </>
  );
}

/* ═══════════════════ S3 — 프레임, 숏, 장면 (scene · 클릭 2) ═══════════════════ */
const SCENE_COLORS = ['#cfd8de', '#e9d7b7', '#f2c230', '#c9dccf'];
export function NestScene() {
  const t = useSceneTime();
  const c = useClicks(2);
  const tr = 'transform .9s cubic-bezier(.6,0,.2,1), opacity .6s';
  const units = [
    { term: '장면', gloss: '한 장소·한 시간에 이어지는 사건 하나', color: '#d98a12' },
    { term: '숏', gloss: '카메라가 끊기지 않고 한 번에 찍은 구간', color: '#4a5bd4' },
    { term: '프레임', gloss: '영상을 이루는 정지 그림 한 장', color: '#e2553f' },
  ];
  return (
    <>
      <Header kicker="영상을 쪼개 보면" title="프레임, 숏, 장면" />
      {/* 현재 단위 라벨 */}
      <div style={{ ...abs(1240, 74, 560), display: 'flex', flexDirection: 'column', gap: 10 }}>
        {units.map((u, i) => (
          <div key={u.term} style={{ opacity: c >= i ? 1 : 0.25, transition: 'opacity .5s' }}>
            <Term term={u.term} gloss={u.gloss} color={u.color} style={{ padding: '8px 16px' }} />
          </div>
        ))}
      </div>
      <div style={{ ...abs(120, 300, 1680, 600), overflow: 'hidden', borderRadius: 22, background: C.slate }}>
        {/* 층 0: 쇼츠 한 편 = 장면 4개 */}
        <div style={{ position: 'absolute', inset: 0, transformOrigin: '62% 50%', transform: `scale(${c >= 1 ? 3.2 : 1})`, opacity: c >= 1 ? 0 : 1, transition: tr }}>
          <div style={{ ...abs(60, 40), ...kick, color: C.chalk }}>쇼츠 한 편 · 20초</div>
          <div style={{ ...abs(60, 110, 1560, 380), display: 'flex', gap: 10 }}>
            {SCENE_COLORS.map((col, i) => (
              <div key={i} style={{ flex: i === 2 ? 1.1 : 1, borderRadius: 12, background: col, position: 'relative', opacity: fade(t, 0.15 + i * 0.18), outline: i === 2 ? `5px solid ${C.chalk}` : 'none' }}>
                <div style={{ ...abs(18, 16), fontSize: 26, fontWeight: 800, color: C.ink }}>장면 {i + 1}</div>
                <Sprockets />
              </div>
            ))}
          </div>
          <div style={{ ...abs(60, 520), ...small, color: C.chalk }}>장소나 시간이 바뀌면 다음 장면</div>
        </div>
        {/* 층 1: 장면 3 = 숏 2개 */}
        <div style={{ position: 'absolute', inset: 0, transformOrigin: '30% 50%', transform: `scale(${c === 1 ? 1 : c >= 2 ? 3 : 0.35})`, opacity: c === 1 ? 1 : 0, transition: tr }}>
          <div style={{ ...abs(60, 40), ...kick, color: C.chalk }}>장면 3 · 숏 2개</div>
          <div style={{ ...abs(60, 110, 1560, 380), display: 'flex', gap: 24 }}>
            {['숏 1 · 미디엄 숏', '숏 2 · 클로즈업'].map((s, i) => (
              <div key={s} style={{ flex: 1, borderRadius: 12, background: i === 0 ? '#f2c230' : '#f6d97a', position: 'relative', outline: i === 0 ? `5px solid ${C.chalk}` : 'none' }}>
                <div style={{ ...abs(20, 18), fontSize: 30, fontWeight: 800, color: C.ink }}>{s}</div>
                <div style={{ ...abs(20, 300), ...small, color: C.ink }}>카메라가 끊기지 않는 구간</div>
                <Sprockets />
              </div>
            ))}
          </div>
          <div style={{ ...abs(60, 520), ...small, color: C.chalk }}>카메라가 끊기고 화면이 바뀌면 다음 숏</div>
        </div>
        {/* 층 2: 숏 1 = 프레임들 */}
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${c >= 2 ? 1 : 0.4})`, opacity: c >= 2 ? 1 : 0, transition: tr }}>
          <div style={{ ...abs(60, 40), ...kick, color: C.chalk }}>숏 1 안쪽 · 프레임</div>
          <div style={{ ...abs(60, 130, 1560, 300), display: 'flex', gap: 8 }}>
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} style={{ flex: 1, borderRadius: 6, background: '#f2c230', position: 'relative', border: `3px solid ${C.chalk}` }}>
                <div style={{ position: 'absolute', left: '50%', bottom: 20 + i * 3, width: 26, height: 26, marginLeft: -13, borderRadius: '50%', background: C.ink, opacity: 0.75 }} />
                <div style={{ ...abs(8, 8), ...mono, fontSize: 15, fontWeight: 800, color: C.ink }}>{i + 1}</div>
              </div>
            ))}
          </div>
          <div style={{ ...abs(60, 460), display: 'flex', gap: 20, alignItems: 'center' }}>
            <Chip size={26} style={{ background: C.chalk }}>1초 ≈ 24~30장</Chip>
            <span style={{ ...small, color: C.chalk }}>조금씩 다른 정지 그림이 빠르게 지나가면 움직임으로 보인다</span>
          </div>
        </div>
      </div>
      <div style={{ ...abs(120, 930, 1680), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ ...small }}>영상 ⊃ 장면 ⊃ 숏 ⊃ 프레임</span>
        <Chip color="#e2553f" size={22} style={{ opacity: c >= 2 ? 1 : 0, transition: 'opacity .5s' }}>이 수업에서는 한 장면 = 한 숏</Chip>
      </div>
    </>
  );
}
function Sprockets() {
  return (
    <>
      {[0, 1].map((r) => (
        <div key={r} style={{ position: 'absolute', left: 12, right: 12, [r ? 'bottom' : 'top']: -26, display: 'flex', justifyContent: 'space-between' }}>
          {Array.from({ length: 6 }, (_, i) => <span key={i} style={{ width: 22, height: 14, borderRadius: 3, background: 'rgba(243,237,225,.55)' }} />)}
        </div>
      ))}
    </>
  );
}

/* ═══════════════════ S4 — 숏은 몇 개일까? (build 4) ═══════════════════ */
function Panel({ label, size, children }: { label: string; size: string; children: ReactNode }) {
  return (
    <div style={{ width: 300 }}>
      <div style={{ width: 300, height: 533, borderRadius: 16, border: `4px solid ${C.ink}`, background: C.paper, position: 'relative', overflow: 'hidden' }}>
        {/* 3분할 보조선 */}
        <svg width="300" height="533" style={{ position: 'absolute', inset: 0 }} aria-hidden>
          <g stroke={C.ink} strokeWidth="1" opacity=".12"><path d="M100 0 V533 M200 0 V533 M0 178 H300 M0 355 H300" /></g>
        </svg>
        {children}
      </div>
      <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
        <Chip size={19} color="#4a5bd4">{size}</Chip>
      </div>
      <div style={{ fontSize: 23, fontWeight: 800, marginTop: 8, wordBreak: 'keep-all' }}>{label}</div>
    </div>
  );
}
const place = (x: number, y: number, w: number, h: number, text: string): ReactNode => (
  <div style={{ ...abs(x, y, w, h), borderRadius: 10, border: '2.5px dashed rgba(29,27,34,.45)', background: '#efeae0', display: 'grid', placeItems: 'center', fontSize: 17, fontWeight: 700, color: C.mute, textAlign: 'center', padding: 4, boxSizing: 'border-box' }}>{text}</div>
);
export function ShotsSlide() {
  return (
    <>
      <Header kicker="같은 장면, 다른 숏" title="숏은 몇 개일까?" />
      <div style={{ ...abs(120, 196, 1100, 60), display: 'flex', alignItems: 'center', gap: 18 }}>
        <Chip size={24} strong color={C.slate}>장면</Chip>
        <span style={{ fontSize: 30, fontWeight: 800 }}>교실에서 친구에게 쪽지를 건넨다</span>
      </div>
      <div style={{ ...abs(120, 290, 1160), display: 'flex', gap: 60 }}>
        <Build at={1}>
          <Panel label="교실 전체" size="와이드 숏">
            {/* 칠판 + 책상 줄 */}
            <div style={{ ...abs(30, 40, 240, 70), background: '#3b4a43', borderRadius: 6 }} />
            {[0, 1, 2, 3].map((r) => (
              <div key={r} style={{ ...abs(30 + r * 6, 210 + r * 70, 240 - r * 12, 22), background: '#c9a26b', borderRadius: 4, opacity: 0.85 }} />
            ))}
            {place(70, 300, 70, 110, '친구 A')}
            {place(170, 300, 70, 110, '친구 B')}
          </Panel>
        </Build>
        <Build at={2}>
          <Panel label="쪽지를 쥔 손" size="클로즈업">
            <svg width="300" height="533" style={{ position: 'absolute', inset: 0 }} aria-hidden>
              <path d="M70 230 L230 200 L246 300 L86 330 Z" fill="#fffdf8" stroke={C.ink} strokeWidth="3" strokeLinejoin="round" />
              <path d="M86 330 L160 270 L246 300" fill="none" stroke={C.ink} strokeWidth="2" opacity=".5" />
              <g stroke={C.ink} strokeWidth="2" opacity=".3"><path d="M100 250 L200 232" /><path d="M104 270 L190 255" /></g>
            </svg>
            {place(40, 340, 220, 130, '손 (화면 아래쪽)')}
          </Panel>
        </Build>
        <Build at={3}>
          <Panel label="받는 친구의 얼굴" size="클로즈업">
            {place(50, 120, 200, 260, '친구 B의 얼굴')}
            <div style={{ ...abs(50, 400, 200), ...small, textAlign: 'center' }}>(놀란 표정)</div>
          </Panel>
        </Build>
      </div>
      <Build at={4} style={{ ...abs(1300, 290, 520) }}>
        <svg width="60" height="560" style={{ position: 'absolute', left: -40, top: 0 }} aria-hidden>
          <path d="M8 8 C30 8 30 30 30 60 L30 250 C30 270 40 280 52 280 C40 280 30 290 30 310 L30 500 C30 530 30 552 8 552" fill="none" stroke={C.ink} strokeWidth="4" strokeLinecap="round" />
        </svg>
        <div style={{ ...abs(40, 215, 480) }}>
          <div style={{ fontSize: 40, fontWeight: 900 }}>장면 1개 = 숏 3개</div>
          <div style={{ ...small, marginTop: 10, fontSize: 21 }}>장소·시간은 그대로, 카메라만 끊겼다</div>
          <div style={{ marginTop: 26 }}>
            <Chip size={26} strong color="#e2553f">AI 생성 1번 = 숏 1개</Chip>
          </div>
        </div>
      </Build>
    </>
  );
}

/* ═══════════════════ S5 — AI가 영상을 만드는 공정 (scene · 클릭 2) ═══════════════════ */
const STATIONS = [
  { ko: '조사', en: 'research', ok: false },
  { ko: '제안', en: 'proposal', ok: true },
  { ko: '대본', en: 'script', ok: true },
  { ko: '장면 계획', en: 'scene_plan', ok: true },
  { ko: '소재 생성', en: 'assets', ok: true },
  { ko: '편집', en: 'edit', ok: false },
  { ko: '합성', en: 'compose', ok: false },
  { ko: '게시', en: 'publish', ok: true },
];
const SX = (i: number) => 190 + i * 220;
const LINE_Y = 520;
export function SubwayScene() {
  const t = useSceneTime();
  const c = useClicks(2);
  const p = easeInOut(interpolate(t, [0.5, 2.8], [0, 1]));
  const trainX = SX(0) + (SX(3) - SX(0)) * p;
  return (
    <>
      <Header kicker="OpenMontage — AI 에이전트가 영상을 만드는 오픈소스 프로젝트" title="AI가 영상을 만드는 공정" />
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }} aria-hidden>
        <line x1={SX(0) - 70} y1={LINE_Y} x2={SX(7) + 70} y2={LINE_Y} stroke={C.slate} strokeWidth="16" strokeLinecap="round" />
        <line x1={SX(0) - 70} y1={LINE_Y} x2={SX(0) + (SX(7) - SX(0) + 140) * interpolate(t, [0, 0.5], [0, 1]) - 70} y2={LINE_Y} stroke="#e2553f" strokeWidth="6" strokeLinecap="round" opacity=".0" />
        {STATIONS.map((s, i) => (
          <circle key={s.en} cx={SX(i)} cy={LINE_Y} r={i === 3 ? 30 : 22} fill={C.card} stroke={C.slate} strokeWidth="7" />
        ))}
      </svg>
      {STATIONS.map((s, i) => (
        <div key={s.en} style={{ ...abs(SX(i) - 100, i % 2 ? 580 : 380, 200), textAlign: 'center', opacity: fade(t, 0.1 + i * 0.07) }}>
          {i % 2 === 0 && <StationLabel s={s} hot={i === 3} />}
          {i % 2 === 1 && <StationLabel s={s} hot={i === 3} />}
        </div>
      ))}
      {/* 열차 */}
      <div style={{ ...abs(trainX - 46, LINE_Y - 22, 92, 44), borderRadius: 14, background: '#e2553f', border: `3px solid ${C.ink}`, display: 'grid', placeItems: 'center', boxShadow: '0 10px 20px -10px rgba(0,0,0,.5)' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ width: 18, height: 12, borderRadius: 3, background: C.chalk }} />
          <span style={{ width: 18, height: 12, borderRadius: 3, background: C.chalk }} />
        </div>
      </div>
      {/* 클릭 1: 사람 승인 도장 */}
      {STATIONS.map((s, i) =>
        s.ok ? (
          <div key={s.en + 'ok'} style={{ ...abs(SX(i) + 14, LINE_Y - 76, 56, 56), borderRadius: '50%', border: `4px solid ${C.red}`, color: C.red, display: 'grid', placeItems: 'center', fontSize: 15, fontWeight: 900, background: 'rgba(255,253,248,.92)', transform: `rotate(-12deg) scale(${c >= 1 ? 1 : 1.6})`, opacity: c >= 1 ? 1 : 0, transition: `transform .35s ${i * 0.08}s, opacity .25s ${i * 0.08}s` }}>승인</div>
        ) : null,
      )}
      <div style={{ ...abs(120, 220, 760), opacity: c >= 1 ? 1 : 0, transition: 'opacity .4s' }}>
        <Chip color={C.red} size={21}>승인 = 이 역에서는 AI가 사람의 확인을 기다린다</Chip>
      </div>
      {/* 클릭 2: 여기서 프롬프트가 태어난다 */}
      <div style={{ opacity: c >= 2 ? 1 : 0, transform: `translateY(${c >= 2 ? 0 : 16}px)`, transition: 'opacity .45s, transform .45s' }}>
        <Arrow x1={SX(3)} y1={690} x2={SX(3)} y2={760} color={C.ink} />
        <div style={{ ...abs(SX(3) - 250, 770, 640), ...solid, padding: '18px 24px', borderLeft: `8px solid #e2553f` }}>
          <div style={{ fontSize: 30, fontWeight: 900 }}>여기서 프롬프트가 태어난다</div>
          <div style={{ ...small, marginTop: 6, fontSize: 21 }}>대본까지 = 무슨 이야기를 할까 · 장면 계획 = 화면에 무엇이 어떻게 보일까</div>
          <div style={{ marginTop: 10 }}><Chip strong color={C.slate} size={19}>오늘 우리가 맡는 역</Chip></div>
        </div>
      </div>
      <div style={{ ...abs(120, 280, 900), ...small, fontSize: 16 }}>출처: OpenMontage pipeline_defs/cinematic.yaml의 단계(stages)와 human_approval_default (AGPL-3.0 · 단계 이름만 인용)</div>
    </>
  );
}
function StationLabel({ s, hot }: { s: { ko: string; en: string }; hot: boolean }) {
  return (
    <div>
      <div style={{ fontSize: hot ? 36 : 28, fontWeight: 900, color: C.ink, whiteSpace: 'nowrap' }}>{s.ko}</div>
      <div style={{ ...mono, fontSize: 16, color: C.mute }}>{s.en}</div>
      {hot && <div style={{ marginTop: 6 }}><Chip strong color="#e2553f" size={16}>오늘의 역</Chip></div>}
    </div>
  );
}

/* ═══════════════════ S6 — 대본을 비트로 나누면 장면이 보인다 (build 5) ═══════════════════ */
export function BeatsSlide() {
  const c = useClicks(5);
  return (
    <>
      <Header kicker="대본 단계 · 비트 맵" title="대본을 비트로 나누면 장면이 보인다" />
      <div style={{ ...abs(120, 200, 1200), display: 'flex', alignItems: 'center', gap: 16 }}>
        <Chip size={22} strong color={C.slate}>쇼츠 · 20초</Chip>
        <span style={{ fontSize: 28, fontWeight: 800 }}>「비 오는 하굣길」 — 우산 없던 날, 누군가 우산을 씌워 준다</span>
      </div>
      <div style={{ ...abs(1340, 196, 460) }}>
        <Term term="비트" gloss="이야기가 한 걸음 나아가는 순간" color="#d98a12" />
      </div>
      <div style={{ ...abs(120, 330, 1680, 560) }}>
        {BEATS.map((b, i) => {
          const big = i === 2;
          const pop = big && c >= 5;
          const x = [0, 360, 720, 1320][i];
          const w = big ? 560 : 330;
          return (
            <div
              key={b.role}
              style={{
                ...abs(x, big ? 0 : 60, w, big ? 460 : 340),
                ...solid,
                padding: big ? '28px 30px' : '22px 24px',
                boxSizing: 'border-box',
                borderTop: `10px solid ${big ? C.umbrella : 'rgba(29,27,34,.25)'}`,
                opacity: c >= i + 1 ? 1 : 0,
                transform: `translateY(${c >= i + 1 ? 0 : 20}px) scale(${pop ? 1.04 : 1})`,
                transition: 'opacity .45s, transform .45s',
                zIndex: big ? 2 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ ...mono, fontSize: 20, color: C.mute }}>{i + 1}</span>
                <span style={{ fontSize: big ? 44 : 34, fontWeight: 900 }}>{b.role}</span>
                <span style={{ ...mono, fontSize: 16, color: C.mute }}>{b.en}</span>
              </div>
              <div style={{ fontSize: big ? 34 : 25, fontWeight: 700, marginTop: 18, lineHeight: 1.35, wordBreak: 'keep-all' }}>{b.line}</div>
              {big && (
                <div style={{ ...abs(30, 300, 500), opacity: pop ? 1 : 0, transition: 'opacity .4s .2s' }}>
                  <Clapper x={0} y={0} w={190} angle={0}>
                    <span style={{ position: 'absolute', left: 14, top: 34, color: C.chalk, fontSize: 28, fontWeight: 900, whiteSpace: 'nowrap' }}>오늘의 장면</span>
                  </Clapper>
                  <div style={{ ...abs(214, 40, 290), fontSize: 22, fontWeight: 800, lineHeight: 1.4, wordBreak: 'keep-all' }}>숏 하나 · 5~8초</div>
                </div>
              )}
            </div>
          );
        })}
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ opacity: c >= i + 2 ? 1 : 0, transition: 'opacity .4s' }}>
            <Arrow x1={[338, 698, 1288][i]} y1={230} x2={[354, 714, 1312][i]} y2={230} color={C.mute} head={12} />
          </div>
        ))}
      </div>
    </>
  );
}

/* ═══════════════════ S7 — 장면 카드의 다섯 칸 (static) ═══════════════════ */
const ORI = [
  { ko: '주체', to: 'subject' as const },
  { ko: '행동', to: 'motion' as const },
  { ko: '배경', to: 'scene' as const },
  { ko: '스타일', to: 'scene' as const },
  { ko: '카메라 워크', to: 'camera' as const },
];
export function CardAnatomySlide() {
  const rowY = (k: (typeof ORDER)[number]) => 220 + ORDER.indexOf(k) * 90 + 37;
  return (
    <>
      <Header kicker="장면 계획의 점검표" title="장면 카드의 다섯 칸" />
      {/* 왼쪽: 오리엔테이션 다섯 조각 */}
      <div style={{ ...abs(120, 240, 330) }}>
        <div style={{ ...small, fontWeight: 800, color: C.ink }}>오리엔테이션의 다섯 조각</div>
      </div>
      {ORI.map((o, i) => (
        <div key={o.ko} style={{ ...abs(120, 300 + i * 120, 250), padding: '12px 18px', borderRadius: 12, background: 'rgba(29,27,34,.06)', fontSize: 26, fontWeight: 700, color: C.mute }}>{o.ko}</div>
      ))}
      {ORI.map((o, i) => (
        <Arrow key={o.ko + 'a'} x1={372} y1={330 + i * 120} x2={600} y2={rowY(o.to)} color="rgba(29,27,34,.35)" width={2.5} head={11} />
      ))}
      {/* 오른쪽: 장면 카드 양식 */}
      <SceneCard w={1180} size={26} rowGap={14} style={{ ...abs(610, 200) }} values={{}} />
      <div style={{ ...abs(1640, 220 + 4 * 90 + 18) }}>
        <Chip strong color={ASPECT.space.color} size={20}>NEW</Chip>
      </div>
      <div style={{ ...abs(120, 920, 460) }}>
        <Note>해당 없으면 비우지 말고 '없음'이라고 적는다</Note>
      </div>
      <div style={{ ...abs(610, 950, 1180), ...small, fontSize: 16 }}>출처: OpenMontage 장면 계획 점검표(Subject · Subject Motion · Scene · Spatial Framing · Camera) · Cen 외, CVPR 2026 영상 언어 연구</div>
    </>
  );
}
