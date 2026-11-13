import { useState, type CSSProperties } from 'react';
import Build from '../../../../src/deck/Build';
import { useSceneTime, interpolate, easeInOut, riseIn } from '../../../../src/scene';
import { abs, C, ASPECT, SVG, kick, small, mono, solid, Header, Term, Chip, Note, Arrow, SceneCard, Frame916, useClicks } from './shared';
import { RAIN_CARD, PROMPT_LINES, PROMPT_KO_LINES } from './cards';

const fade = (t: number, at: number, d = 0.35) => interpolate(t, [at, at + d], [0, 1]);
const show = (on: boolean, delay = 0): CSSProperties => ({ opacity: on ? 1 : 0, transition: `opacity .5s ${delay}s` });

/* ═══════════════════ S8 — 본 적 없는 사람도 그릴 수 있는가 (scene · 클릭 2) ═══════════════════ */
const SB = { x: 820, y: 240, w: 1000 };
const SK = SB.w / 440;
const px = (vx: number) => SB.x + vx * SK;
const py = (vy: number) => SB.y + vy * SK;
function Draw({ d, on, delay = 0, color = C.ink, width = 4, len = 900, dash }: { d: string; on: boolean; delay?: number; color?: string; width?: number; len?: number; dash?: string }) {
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dash ?? len}
      strokeDashoffset={dash ? 0 : on ? 0 : len}
      opacity={dash ? (on ? 1 : 0) : 1}
      style={{ transition: `stroke-dashoffset .9s ${delay}s ease-out, opacity .5s ${delay}s` }}
    />
  );
}
export function SketchScene() {
  const t = useSceneTime();
  const c = useClicks(2);
  const marks = [
    { q: '누가?', x: 150, y: 150 },
    { q: '무엇을?', x: 250, y: 205 },
    { q: '어디?', x: 300, y: 92 },
    { q: '어떻게 배치?', x: 70, y: 232 },
    { q: '카메라?', x: 330, y: 160 },
  ];
  /* 종이 위 그림(종이 좌표 → 화면 px) */
  const L = (x1: number, y1: number, x2: number, y2: number) => `M${px(x1)} ${py(y1)} L${px(x2)} ${py(y2)}`;
  return (
    <>
      <Header kicker="좋은 프롬프트의 시험" title="본 적 없는 사람도 그릴 수 있는가" />
      {/* 왼쪽 말풍선 */}
      <div style={{ ...abs(120, 270, 620) }}>
        <div style={{ ...small, fontWeight: 800, color: C.ink }}>전화로 듣는 장면 설명</div>
        <div style={{ ...solid, marginTop: 12, padding: '24px 28px', borderRadius: 24, position: 'relative', minHeight: 300, boxSizing: 'border-box' }}>
          {c < 1 ? (
            <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.35, wordBreak: 'keep-all', ...riseIn(t, 0.2) }}>“비 오는 날 감성적인 우산 장면”</div>
          ) : (
            <div style={{ fontSize: 23, fontWeight: 600, lineHeight: 1.55, wordBreak: 'keep-all' }}>
              <b style={{ color: C.ink }}>눈높이 미디엄 숏, 카메라는 고정.</b> 남색 후드티 여학생이 교문 처마 아래, <b>화면 왼쪽 1/3</b>에 서 있다. 손바닥을 내밀어 비를 확인하면, <b>노란 우산이 위에서 들어와</b> 머리를 덮는다. 여학생이 오른쪽을 본다. 흐린 오후, 젖은 바닥, 뒤로 흐릿한 운동장.
            </div>
          )}
          <svg width="60" height="40" style={{ position: 'absolute', right: -44, top: 120 }} aria-hidden>
            <path d="M0 4 L52 20 L0 34" fill={C.card} stroke="rgba(29,27,34,.2)" strokeWidth="1.5" />
          </svg>
        </div>
        <div style={{ marginTop: 18, ...show(c >= 1) }}>
          <Chip size={20}>다섯 칸을 채운 문장</Chip>
        </div>
      </div>
      {/* 오른쪽 스케치북 */}
      <img src={`${SVG}/sketchbook-pencil.svg`} alt="연필이 얹힌 스케치북" style={{ ...abs(SB.x, SB.y, SB.w) }} />
      {marks.map((m, i) => (
        <div key={m.q} style={{ ...abs(px(m.x) - 80, py(m.y) - 40, 160), textAlign: 'center', opacity: c >= 1 ? 0 : fade(t, 0.5 + i * 0.15), transition: `opacity .4s ${i * 0.08}s` }}>
          <div style={{ fontSize: 64, fontWeight: 900, color: '#e2553f', lineHeight: 1 }}>?</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.mute, whiteSpace: 'nowrap' }}>{m.q}</div>
        </div>
      ))}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden>
        {/* 3분할 보조선 */}
        <Draw d={`${L(153, 62, 153, 250)} ${L(267, 62, 267, 250)}`} on={c >= 1} dash="6 10" color="#4a5bd4" width={2} />
        {/* 처마와 기둥 */}
        <Draw d={`${L(50, 92, 230, 80)} ${L(70, 90, 70, 250)} ${L(212, 82, 212, 250)}`} on={c >= 1} delay={0.1} />
        {/* 운동장 지평선 */}
        <Draw d={L(230, 170, 372, 166)} on={c >= 1} delay={0.25} color={C.rain} width={3} />
        {/* 바닥 */}
        <Draw d={L(46, 250, 376, 250)} on={c >= 1} delay={0.3} />
        {/* 빗줄기 */}
        <Draw d={`${L(250, 70, 244, 92)} ${L(290, 84, 284, 106)} ${L(330, 72, 324, 94)} ${L(350, 130, 344, 152)} ${L(300, 190, 294, 212)}`} on={c >= 1} delay={0.4} color={C.rain} width={3} len={120} />
        {/* 노란 우산 */}
        <Draw d={`M${px(118)} ${py(112)} Q${px(172)} ${py(58)} ${px(226)} ${py(112)} Z`} on={c >= 1} delay={0.55} color="#c99a12" width={5} len={600} />
      </svg>
      {/* 인물 자리 표시 (졸라맨 대신) */}
      <div style={{ ...abs(px(118), py(128), 40 * SK, 120 * SK), border: '3px dashed rgba(29,27,34,.55)', borderRadius: 10, display: 'grid', placeItems: 'center', ...show(c >= 1, 0.5) }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: C.ink, textAlign: 'center', lineHeight: 1.2 }}>여학생<br />(왼쪽 1/3)</span>
      </div>
      <div style={{ ...abs(120, 930, 1680), ...show(c >= 2) }}>
        <div style={{ fontSize: 34, fontWeight: 900 }}>본 적 없는 사람이 떠올릴 수 있으면 통과 — AI도 그 장면을 본 적이 없다</div>
      </div>
    </>
  );
}

/* ═══════════════════ S9 — 피사체와 동작 (build 4) ═══════════════════ */
export function SubjectMotionSlide() {
  const steps = ['손바닥을 내밀어 비를 확인한다', '노란 우산이 위에서 들어와 머리를 덮는다', '고개를 들어 오른쪽을 본다'];
  return (
    <>
      <Header kicker="장면 카드 · 피사체와 동작" title="누가, 어떤 순서로" />
      <SceneCard w={560} size={17} rowGap={6} lit={['subject', 'motion']} values={{ subject: '여학생 · 노란 우산', motion: '① → ② → ③' }} style={{ ...abs(120, 220) }} />
      <Build at={1} style={{ ...abs(760, 200, 1040) }}>
        <div style={{ ...kick }}>피사체 — 구별되는 특징 2~3개</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginTop: 14 }}>
          <div style={{ padding: '14px 20px', borderRadius: 12, background: 'rgba(29,27,34,.06)', fontSize: 28, fontWeight: 700, color: C.mute, textDecoration: 'line-through' }}>학생</div>
          <span style={{ fontSize: 32 }}>→</span>
          <div style={{ padding: '14px 20px', borderRadius: 12, borderLeft: `6px solid ${ASPECT.subject.color}`, background: `color-mix(in srgb, ${ASPECT.subject.color} 12%, ${C.card})`, fontSize: 28, fontWeight: 800 }}>
            <u style={{ textDecorationColor: ASPECT.subject.color, textDecorationThickness: 4 }}>남색 후드티</u>에 <u style={{ textDecorationColor: ASPECT.subject.color, textDecorationThickness: 4 }}>검은 책가방</u>을 멘 여학생
          </div>
        </div>
      </Build>
      <Build at={2} style={{ ...abs(760, 400, 1040) }}>
        <div style={{ ...kick }}>동작 — 일어나는 순서대로</div>
        <div style={{ position: 'relative', height: 250, marginTop: 14 }}>
          <div style={{ ...abs(0, 40, 960, 10), borderRadius: 5, background: `color-mix(in srgb, ${ASPECT.motion.color} 35%, ${C.card})` }} />
          {steps.map((s, i) => (
            <div key={s} style={{ ...abs(i * 320, 0, 300) }}>
              <div style={{ width: 90, height: 90, borderRadius: '50%', background: C.card, border: `5px solid ${ASPECT.motion.color}`, display: 'grid', placeItems: 'center', fontSize: 40, fontWeight: 900 }}>{'①②③'[i]}</div>
              <div style={{ fontSize: 24, fontWeight: 700, marginTop: 12, lineHeight: 1.35, wordBreak: 'keep-all' }}>{s}</div>
            </div>
          ))}
        </div>
      </Build>
      <Build at={3} style={{ ...abs(1500, 690, 320) }}>
        <svg width="40" height="70" style={{ position: 'absolute', left: -6, top: -84 }} aria-hidden>
          <path d="M6 70 L6 4" stroke={C.ink} strokeWidth="4" strokeLinecap="round" />
          <path d="M6 4 L36 14 L6 26 Z" fill={ASPECT.motion.color} stroke={C.ink} strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
        <div style={{ ...solid, padding: '12px 16px', fontSize: 22, fontWeight: 800, lineHeight: 1.35, wordBreak: 'keep-all' }}>끝 상태: 오른쪽을 보고 있다</div>
      </Build>
      <Build at={4} style={{ ...abs(760, 860, 1040) }}>
        <Note color={C.red}>한 숏에 동작은 셋 이하 — 넷 이상이면 움직임이 무너지기 쉽다</Note>
      </Build>
    </>
  );
}

/* ═══════════════════ S10 — 공간 구도: 앞에, 가운데, 뒤에 (scene · 클릭 2) ═══════════════════ */
const FH = 640;
const FW = (FH * 9) / 16;
export function LayersScene() {
  const t = useSceneTime();
  const c = useClicks(2);
  const p = easeInOut(interpolate(t, [0.8, 2.6], [0, 1]));
  const layers = [
    { id: 'back', ko: '후경', note: '흐릿한 빈 운동장', dx: -470, z: -260 },
    { id: 'mid', ko: '중경', note: '여학생 · 처마', dx: 0, z: 0 },
    { id: 'front', ko: '전경', note: '빗줄기 (끝에 우산)', dx: 470, z: 260 },
  ];
  const FX = 960 - FW / 2;
  const FY = 260;
  return (
    <>
      <Header kicker="장면 카드 · 공간 구도" title="앞에, 가운데, 뒤에" />
      <div style={{ ...abs(120, 220, 350), display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Term term="공간 구도" gloss="숏 크기 · 화면 속 위치 · 앞뒤 깊이" color={ASPECT.space.color} />
        <Term term="전경·중경·후경" gloss="카메라에서 가까운 / 가운데 / 먼 층" color={ASPECT.space.color} />
      </div>
      <div style={{ ...abs(0, 0, 1920, 1080), perspective: 1800, perspectiveOrigin: '50% 45%' }}>
        {layers.map((l, i) => (
          <div
            key={l.id}
            style={{
              ...abs(FX, FY, FW, FH),
              transform: `translateX(${l.dx * (1 - p)}px) translateZ(${l.z * (1 - p)}px) rotateY(${-34 * (1 - p)}deg)`,
              zIndex: i,
            }}
          >
            <div style={{ position: 'absolute', inset: 0, borderRadius: 14, overflow: 'hidden', border: p < 0.98 ? `3px solid ${C.ink}` : 'none', background: l.id === 'back' ? 'linear-gradient(#aebccb 0 46%, #8e9c88 46% 100%)' : 'transparent', boxShadow: p < 0.98 ? '0 20px 40px -26px rgba(0,0,0,.6)' : 'none' }}>
              {l.id === 'back' && <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(2px)', background: 'repeating-linear-gradient(90deg, rgba(255,255,255,.12) 0 2px, transparent 2px 60px)' }} />}
              {l.id === 'mid' && (
                <>
                  <div style={{ ...abs(-10, 60, FW + 20, 26), background: '#6b6f78', borderRadius: 4 }} />
                  <div style={{ ...abs(14, 86, 14, FH), background: '#6b6f78' }} />
                  <div style={{ ...abs(0, FH - 110, FW, 110), background: 'rgba(70,78,88,.55)' }} />
                  <div style={{ ...abs(FW / 3 - 66, 250, 110, 300), border: '3px dashed rgba(29,27,34,.7)', borderRadius: 12, background: 'rgba(47,59,99,.35)', display: 'grid', placeItems: 'center', fontSize: 20, fontWeight: 800, color: C.ink, textAlign: 'center' }}>여학생</div>
                </>
              )}
              {l.id === 'front' && (
                <svg width={FW} height={FH} style={{ position: 'absolute', inset: 0 }} aria-hidden>
                  <g stroke="#5f7486" strokeWidth="3" strokeLinecap="round" opacity=".75">
                    {Array.from({ length: 22 }, (_, k) => {
                      const x = (k * 53) % FW;
                      const y = ((k * 97 + t * 420) % (FH + 60)) - 40;
                      return <path key={k} d={`M${x} ${y} l-5 22`} />;
                    })}
                  </g>
                </svg>
              )}
            </div>
            {/* 층 이름 (펼쳐져 있을 때) */}
            <div style={{ ...abs(0, -64, FW), textAlign: 'center', opacity: 1 - p }}>
              <Chip strong color={ASPECT.space.color} size={22}>{l.ko}</Chip>
              <div style={{ ...small, marginTop: 4, color: C.ink, fontWeight: 700 }}>{l.note}</div>
            </div>
          </div>
        ))}
        {/* 클릭 2: 노란 우산이 위에서 내려와 전경을 덮는다 */}
        <svg width={FW} height={FH} style={{ ...abs(FX, FY, FW, FH), zIndex: 5, overflow: 'hidden', borderRadius: 14 }} aria-hidden>
          <g style={{ transform: `translateY(${c >= 2 ? 0 : -260}px)`, transition: 'transform 1.1s cubic-bezier(.3,.7,.2,1)' }}>
            <path d={`M-40 150 Q${FW / 2} -110 ${FW + 40} 150 Z`} fill={C.umbrella} stroke={C.ink} strokeWidth="4" strokeLinejoin="round" />
            <path d={`M${FW / 2} 20 L${FW / 2} 150`} stroke={C.ink} strokeWidth="3" />
          </g>
        </svg>
        {/* 클릭 1: 3분할 보조선 */}
        <svg width={FW} height={FH} style={{ ...abs(FX, FY, FW, FH), zIndex: 6, ...show(c >= 1) }} aria-hidden>
          <g stroke={ASPECT.space.color} strokeWidth="2.5" strokeDasharray="8 8"><path d={`M${FW / 3} 0 V${FH} M${(2 * FW) / 3} 0 V${FH}`} /></g>
        </svg>
        <div style={{ ...abs(FX, FY, FW, FH), zIndex: 7, border: `4px solid ${C.ink}`, borderRadius: 14, opacity: p, pointerEvents: 'none' }} />
      </div>
      {/* 겹친 뒤 오른쪽 범례 */}
      <div style={{ ...abs(1240, 340, 560), display: 'flex', flexDirection: 'column', gap: 16, opacity: interpolate(t, [2.6, 3.0], [0, 1]) }}>
        <Chip size={22} color={ASPECT.space.color}>숏 크기: 미디엄 숏 (허리 위)</Chip>
        <div style={show(c >= 1)}><Chip size={22} color={ASPECT.space.color}>화면 속 위치: 여학생은 왼쪽 1/3</Chip></div>
        <Chip size={22} color={ASPECT.space.color}>전경 빗줄기 · 중경 여학생 · 후경 운동장</Chip>
        <div style={show(c >= 2)}>
          <div style={{ ...solid, padding: '14px 18px', borderLeft: `6px solid ${ASPECT.space.color}`, fontSize: 23, fontWeight: 800, wordBreak: 'keep-all' }}>숏 안에서 바뀌는 구도: 끝에서 우산이 전경을 덮는다</div>
        </div>
      </div>
      <div style={{ ...abs(120, 620, 460), ...show(c >= 1), opacity: c >= 1 ? interpolate(t, [2.6, 3.0], [0, 1]) : 0 }}>
        <Note color={ASPECT.space.color}>오른쪽을 비워 두면 우산이 들어올 자리가 생긴다</Note>
      </div>
    </>
  );
}

/* ═══════════════════ S11 — 카메라: 다가가는가, 당기는가, 가만히 있는가 (scene · 클릭 3) ═══════════════════ */
export function FloorPlanScene() {
  const t = useSceneTime();
  const c = useClicks(3);
  const CAM = { x: 330, y: 600 };
  const SUB = { x: 1040, y: 600 };
  const camX = c === 1 ? 300 : 0;
  const narrow = c === 2 ? 0.45 : 1;
  const tabs = [
    { term: '돌리 인', en: 'dolly in', gloss: '카메라 자체가 앞으로 이동 (지난 시간의 푸시 인)' },
    { term: '줌 인', en: 'zoom in', gloss: '카메라는 그대로, 렌즈만 당긴다' },
    { term: '고정 숏', en: 'static', gloss: '이동·줌·초점 변화 모두 없음' },
  ];
  return (
    <>
      <Header kicker="장면 카드 · 카메라 — 위에서 내려다본 촬영장" title="다가가는가, 당기는가, 가만히 있는가" size={50} />
      <div style={{ ...abs(120, 220, 1080, 760), borderRadius: 20, background: '#ebe4d6', border: '2px solid rgba(29,27,34,.15)', overflow: 'hidden', opacity: fade(t, 0.1) }}>
        <svg width="1080" height="760" style={{ position: 'absolute', inset: 0 }} aria-hidden>
          <defs>
            <pattern id="fp-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0 L0 0 L0 40" fill="none" stroke={C.ink} strokeWidth="1" opacity=".08" /></pattern>
          </defs>
          <rect width="1080" height="760" fill="url(#fp-grid)" />
          {/* 레일 */}
          <g stroke={C.mute} strokeWidth="4" opacity=".55"><path d={`M${CAM.x - 120 - 120} ${CAM.y - 220 + 36} L${CAM.x + 420 - 120} ${CAM.y - 220 + 36}`} /><path d={`M${CAM.x - 120 - 120} ${CAM.y - 220 - 36} L${CAM.x + 420 - 120} ${CAM.y - 220 - 36}`} /></g>
          <g stroke={C.mute} strokeWidth="3" opacity=".4">
            {Array.from({ length: 14 }, (_, i) => <path key={i} d={`M${CAM.x - 230 + i * 48} ${CAM.y - 220 - 44} l0 88`} />)}
          </g>
          {/* 피사체 */}
          <circle cx={SUB.x - 120} cy={SUB.y - 220} r="56" fill={`color-mix(in srgb, ${ASPECT.subject.color} 22%, #fffdf8)`} stroke={C.ink} strokeWidth="4" />
          {/* 카메라 + 시야 부채꼴 */}
          <g style={{ transform: `translateX(${camX}px)`, transition: 'transform 1.1s cubic-bezier(.6,0,.2,1)' }}>
            <g style={{ transformOrigin: `${CAM.x - 120}px ${CAM.y - 220}px`, transform: `scaleY(${narrow})`, transition: 'transform 1.1s cubic-bezier(.6,0,.2,1)' }}>
              <path d={`M${CAM.x - 120} ${CAM.y - 220} L${CAM.x + 860 - 120} ${CAM.y - 220 - 300} L${CAM.x + 860 - 120} ${CAM.y - 220 + 300} Z`} fill={ASPECT.camera.color} opacity=".14" />
              <path d={`M${CAM.x - 120} ${CAM.y - 220} L${CAM.x + 860 - 120} ${CAM.y - 220 - 300} M${CAM.x - 120} ${CAM.y - 220} L${CAM.x + 860 - 120} ${CAM.y - 220 + 300}`} stroke={ASPECT.camera.color} strokeWidth="3" strokeDasharray="10 8" />
            </g>
            <path d={`M${CAM.x - 120 + 30} ${CAM.y - 220} L${CAM.x - 120 - 34} ${CAM.y - 220 - 38} L${CAM.x - 120 - 34} ${CAM.y - 220 + 38} Z`} fill={C.slate} stroke={C.ink} strokeWidth="3" strokeLinejoin="round" />
          </g>
        </svg>
        <div style={{ ...abs(SUB.x - 120 - 60, SUB.y - 220 + 66, 120), textAlign: 'center', fontSize: 22, fontWeight: 800 }}>피사체</div>
        <div style={{ ...abs(CAM.x - 120 - 70 + camX, CAM.y - 220 + 52, 140), textAlign: 'center', fontSize: 22, fontWeight: 800, transition: 'left 1.1s cubic-bezier(.6,0,.2,1)' }}>카메라</div>
        <div style={{ ...abs(CAM.x - 120 + 330, CAM.y - 220 - 92, 300), ...small, fontSize: 17 }}>레일 (돌리가 움직이는 길)</div>
        {/* 고정 숏 자물쇠 */}
        <div style={{ ...abs(CAM.x - 120 - 30, CAM.y - 220 - 120, 60, 60), borderRadius: 12, background: C.card, border: `3px solid ${C.ink}`, display: 'grid', placeItems: 'center', fontSize: 30, ...show(c >= 3) }}>🔒</div>
        <div style={{ ...abs(30, 690, 900), ...small, color: C.ink, fontWeight: 700 }}>
          {c === 0 && '삼각형 = 카메라 · 보라 부채꼴 = 카메라가 보는 범위'}
          {c === 1 && '카메라가 레일을 타고 다가갔다 — 보는 각도는 그대로'}
          {c === 2 && '카메라는 제자리 — 보는 범위만 좁아졌다'}
          {c === 3 && '아무것도 움직이지 않는다'}
        </div>
      </div>
      {/* 오른쪽 탭 */}
      <div style={{ ...abs(1250, 230, 560), display: 'flex', flexDirection: 'column', gap: 18 }}>
        {tabs.map((tb, i) => {
          const on = c === i + 1;
          return (
            <div key={tb.term} style={{ ...solid, padding: '18px 22px', borderLeft: `8px solid ${on ? ASPECT.camera.color : 'rgba(29,27,34,.15)'}`, opacity: c >= i + 1 ? 1 : 0.35, transform: on ? 'translateX(-10px)' : 'none', transition: 'all .45s' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <span style={{ fontSize: 32, fontWeight: 900 }}>{tb.term}</span>
                <span style={{ ...mono, fontSize: 18, color: C.mute }}>{tb.en}</span>
              </div>
              <div style={{ ...small, fontSize: 21, marginTop: 6, color: C.ink }}>{tb.gloss}</div>
            </div>
          );
        })}
        <div style={{ ...show(c >= 3) }}>
          <Note color={ASPECT.camera.color}>'고정 숏'이라고 썼다면 dolly·zoom·pan을 함께 쓰지 않는다</Note>
        </div>
      </div>
      <img src={`${SVG}/cinema-camera-tripod.svg`} alt="삼각대 위 영화 카메라" style={{ ...abs(1640, 820, 150) }} />
    </>
  );
}

/* ═══════════════════ S12 — '감성적인'은 화면에 보이지 않는다 (build 4) ═══════════════════ */
const ADJ: { word: string; out: { k: keyof typeof ASPECT; s: string }[] }[] = [
  { word: '감성적인', out: [{ k: 'scene', s: '흐린 회색 하늘' }, { k: 'scene', s: '젖은 아스팔트에 비친 빛' }, { k: 'scene', s: '부드러운 자연광' }] },
  { word: '슬픈', out: [{ k: 'motion', s: '고개를 숙이고 어깨가 처진다' }, { k: 'motion', s: '빈 의자를 바라본다' }] },
  { word: '시네마틱', out: [{ k: 'camera', s: '얕은 심도' }, { k: 'space', s: '눈높이 미디엄 숏' }, { k: 'scene', s: '옅은 필름 질감' }] },
];
export function AdjectiveSlide() {
  const c = useClicks(4);
  return (
    <>
      <Header kicker="자주 하는 실수 ①" title="'감성적인'은 화면에 보이지 않는다" />
      <div style={{ ...abs(120, 220, 1680) }}>
        {ADJ.map((a, i) => {
          const gone = c >= i + 1;
          return (
            <div key={a.word} style={{ ...abs(0, i * 190, 1680, 160) }}>
              <div style={{ ...abs(0, 10, 380, 130), borderRadius: 16, background: '#fff3b8', border: `3px solid ${C.ink}`, display: 'grid', placeItems: 'center', fontSize: 50, fontWeight: 900, transform: gone ? 'rotate(-7deg) scale(.88)' : `rotate(${[-3, 2, -2][i]}deg)`, opacity: gone ? 0.18 : 1, transition: 'transform .6s cubic-bezier(.5,0,.6,1), opacity .6s' }}>
                “{a.word}”
              </div>
              <div style={{ ...abs(440, 34, 1240), display: 'flex', gap: 14, flexWrap: 'wrap', ...show(gone, 0.25) }}>
                {a.out.map((o) => (
                  <span key={o.s} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderRadius: 12, borderLeft: `6px solid ${ASPECT[o.k].color}`, background: `color-mix(in srgb, ${ASPECT[o.k].color} 12%, ${C.card})`, fontSize: 27, fontWeight: 700 }}>
                    {o.s}
                    <span style={{ fontSize: 16, fontWeight: 800, color: C.mute }}>{ASPECT[o.k].ko}</span>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
        <div style={{ ...abs(0, 590, 1680, 160), ...show(c >= 4) }}>
          <div style={{ ...abs(0, 10, 380, 130), borderRadius: 16, background: '#fff3b8', border: `3px dashed ${C.ink}`, display: 'grid', placeItems: 'center', fontSize: 40, fontWeight: 900, transform: 'rotate(2deg)' }}>“쓸쓸한 분위기”</div>
          <div style={{ ...abs(440, 34, 900), height: 76, borderRadius: 12, border: '3px dashed rgba(29,27,34,.35)', display: 'flex', alignItems: 'center', padding: '0 24px', fontSize: 30, fontWeight: 800, color: C.mute }}>→ 화면에 보이는 것으로 바꾸면?</div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════ S13 — 영상 안에 넣지 않는 것들 (static) ═══════════════════ */
export function OutsideSlide() {
  const tips = [
    { bad: '동작 다섯 개를 한 숏에', good: '셋 이하로 줄이고 나머지는 다음 숏으로' },
    { bad: '"밝은 한낮" + "네온 밤"', good: '빛은 하나만 고른다' },
    { bad: '"감성적인", "슬픈"만 있는 문장', good: '감정을 만드는 눈에 보이는 원인으로' },
  ];
  return (
    <>
      <Header kicker="자주 하는 실수 ②" title="영상 안에 넣지 않는 것들" />
      <div style={{ ...abs(120, 210) }}>
        <Frame916 h={600}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(#aebccb 0 50%, #7e8a7a 50% 100%)' }} />
          <div style={{ ...abs(26, 470, 286, 56), borderRadius: 8, background: 'rgba(29,27,34,.7)', display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center', padding: '0 10px' }}>
            {[30, 18, 40, 22, 34, 16, 28].map((w, i) => (
              <span key={i} style={{ width: w, height: 22, borderRadius: 4, background: '#f3ede1', opacity: 0.85, transform: `skewX(${i % 2 ? 18 : -14}deg) translateY(${i % 3 === 0 ? 4 : -3}px)`, filter: 'blur(1.2px)' }} />
            ))}
          </div>
          <svg width="338" height="600" style={{ position: 'absolute', inset: 0 }} aria-hidden>
            <path d="M40 40 L298 300 M298 40 L40 300" stroke={C.red} strokeWidth="10" strokeLinecap="round" opacity=".85" />
          </svg>
        </Frame916>
        <div style={{ ...small, marginTop: 10, width: 338 }}>(도식) 자막을 프롬프트에 넣으면 글자가 뭉개지기 쉽다</div>
      </div>
      <div style={{ ...abs(500, 300, 520) }}>
        <div style={{ padding: '18px 22px', borderRadius: 14, border: `3px dashed ${ASPECT.outside.color}`, background: `color-mix(in srgb, ${ASPECT.outside.color} 10%, ${C.card})` }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>영상 밖 — 편집에서</div>
          <div style={{ fontSize: 30, fontWeight: 900, marginTop: 8, wordBreak: 'keep-all' }}>「그날, 우산이 하나 더 있었다」</div>
          <div style={{ ...small, marginTop: 8 }}>프롬프트에는 대신 <span style={mono}>No text on screen.</span></div>
        </div>
        <div style={{ marginTop: 22 }}>
          <Term term="오버레이" gloss="영상 위에 얹는 자막·제목·로고 — 편집에서 넣는다" color={ASPECT.outside.color} />
        </div>
      </div>
      <Arrow x1={470} y1={420} x2={498} y2={390} color={ASPECT.outside.color} dashed />
      <div style={{ ...abs(1120, 210, 680), display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ ...small, fontWeight: 800, color: C.ink }}>프롬프트 안에서 자주 하는 실수</div>
        {tips.map((tp) => (
          <div key={tp.bad} style={{ ...solid, padding: '16px 20px' }}>
            <div style={{ fontSize: 23, fontWeight: 700, color: C.mute }}>✕ {tp.bad}</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6 }}>→ {tp.good}</div>
          </div>
        ))}
      </div>
      <div style={{ ...abs(120, 950, 1680), ...small, fontSize: 16 }}>경험 규칙 — "자주 그렇다"이지 "항상"은 아니다. 출처: OpenMontage video-gen-prompting · seedance-prompting 가이드의 회피 목록</div>
    </>
  );
}

/* ═══════════════════ S14 — 장면 카드를 프롬프트로 조립하기 (build 6) ═══════════════════ */
export function AssembleSlide() {
  const c = useClicks(6);
  const [ko, setKo] = useState(false);
  const curKeys = c > 0 ? PROMPT_LINES[Math.min(c, 6) - 1].keys : [];
  const total = PROMPT_LINES.map((l) => l.text).join(' ').split(/\s+/).length;
  return (
    <>
      <Header kicker="조립 순서: 숏 크기·카메라 → 피사체 → 동작 → 배경·빛 → 스타일 → 글자 없음" title="장면 카드를 프롬프트로 조립하기" size={50} />
      <SceneCard
        w={720}
        size={16}
        rowGap={6}
        values={RAIN_CARD}
        lit={c === 0 ? undefined : curKeys}
        style={{ ...abs(120, 210) }}
      />
      <div style={{ ...abs(880, 210, 920, 790), ...solid, padding: '20px 26px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={(e) => { e.stopPropagation(); setKo(false); }} style={tabBtn(!ko)}>영어 조립본</button>
            <button type="button" onClick={(e) => { e.stopPropagation(); setKo(true); }} style={tabBtn(ko)}>한국어 조립본</button>
          </div>
          <span style={{ ...mono, fontSize: 17, color: C.mute }}>{c >= 6 ? `약 ${total}단어` : `${c}/6줄`}</span>
        </div>
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {PROMPT_LINES.map((l, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', opacity: c >= i + 1 ? 1 : 0, transform: `translateX(${c >= i + 1 ? 0 : -16}px)`, transition: 'opacity .45s, transform .45s' }}>
              <div style={{ display: 'flex', gap: 4, paddingTop: 8, width: 30, flexShrink: 0 }}>
                {l.keys.map((k) => <span key={k} style={{ width: 12, height: 12, borderRadius: '50%', background: ASPECT[k].color }} />)}
              </div>
              <div style={{ ...(ko ? {} : mono), fontSize: ko ? 21 : 18, lineHeight: 1.5, color: C.ink, wordBreak: 'keep-all', padding: l.keys[0] === 'outside' ? '4px 10px' : 0, border: l.keys[0] === 'outside' ? `2px dashed ${ASPECT.outside.color}` : 'none', borderRadius: 8 }}>
                {ko ? PROMPT_KO_LINES[i] : l.text}
              </div>
            </div>
          ))}
        </div>
        <div style={{ ...abs(26, 720, 860), ...small, fontSize: 17, opacity: c >= 6 ? 1 : 0, transition: 'opacity .4s' }}>
          색 점 = 그 문장이 온 칸. 권장 언어는 수업 전 두 언어로 생성해 비교한 결과로 정한다.
        </div>
      </div>
    </>
  );
}
const tabBtn = (on: boolean): CSSProperties => ({
  cursor: 'pointer',
  border: `2px solid ${C.slate}`,
  borderRadius: 999,
  padding: '6px 16px',
  fontSize: 17,
  fontWeight: 800,
  fontFamily: 'inherit',
  background: on ? C.slate : C.card,
  color: on ? C.white : C.ink,
});
