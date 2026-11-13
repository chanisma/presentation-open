import type { CSSProperties, ReactNode } from 'react';
import Build from '../../../../src/deck/Build';
import { useSceneTime, interpolate, easeInOut, riseIn } from '../../../../src/scene';
import { abs, C, LANE, LANES, SVG, kick, h1, small, mono, panel, Header, Term, Chip, Note, Phone, useClicks } from './shared';
import { SCRIPT_A, HOOKS } from './cards';

const fade = (t: number, at: number, d = 0.35) => interpolate(t, [at, at + d], [0, 1]);
const show = (on: boolean, delay = 0): CSSProperties => ({ opacity: on ? 1 : 0, transition: `opacity .5s ${delay}s` });
const write = (p: number): CSSProperties => ({ clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` });

/* 예시 A의 첫 화면 — 김 서린 창 + 손가락 선 + 자막. draw 0~1 = 선이 그어진 정도 */
export function FirstFrame({ w, h, draw = 1, caption = true }: { w: number; h: number; draw?: number; caption?: boolean }) {
  const len = 520;
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(#5f7d94 0 55%, #4f6a55 55% 100%)' }}>
      {/* 창틀 */}
      <div style={{ position: 'absolute', left: w * 0.5 - 4, top: 0, width: 8, height: h, background: '#2c3346' }} />
      <div style={{ position: 'absolute', left: 0, top: h * 0.45, width: w, height: 8, background: '#2c3346' }} />
      {/* 김 */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(225,232,238,0.72)' }} />
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: 'absolute', inset: 0 }} aria-hidden>
        <defs>
          <linearGradient id="ff-clear" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.55" stopColor="#5f7d94" />
            <stop offset="0.55" stopColor="#4f6a55" />
          </linearGradient>
        </defs>
        <path d={`M${w * 0.18} ${h * 0.62} C${w * 0.35} ${h * 0.5} ${w * 0.55} ${h * 0.72} ${w * 0.82} ${h * 0.56}`} stroke="url(#ff-clear)" strokeWidth={w * 0.07} strokeLinecap="round" fill="none" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
        <g fill="#ffffff" opacity=".55">
          {[0.22, 0.4, 0.63, 0.78, 0.3, 0.7].map((x, i) => <circle key={i} cx={w * x} cy={h * (0.3 + (i % 3) * 0.16)} r={w * 0.012} />)}
        </g>
      </svg>
      {caption && (
        <div style={{ position: 'absolute', left: w * 0.08, right: w * 0.08, top: h * 0.12, textAlign: 'center', fontSize: w * 0.075, fontWeight: 900, color: C.ink, background: 'rgba(255,255,255,0.86)', borderRadius: 10, padding: `${w * 0.02}px ${w * 0.03}px`, lineHeight: 1.25, wordBreak: 'keep-all' }}>
          창문의 김,<br />범인은 밖이 아니다
        </div>
      )}
    </div>
  );
}

/* 피드에서 넘어가는 다른 쇼츠의 첫 화면(도식) */
function DullFrame({ kind, w, h }: { kind: 0 | 1 | 2; w: number; h: number }) {
  if (kind === 0)
    return (
      <div style={{ position: 'absolute', inset: 0, background: '#33394f', display: 'grid', placeItems: 'center' }}>
        <div style={{ fontSize: w * 0.08, fontWeight: 800, color: C.fg, textAlign: 'center' }}>안녕하세요 여러분~<br /><span style={{ fontSize: w * 0.05, color: C.mute }}>오늘은요…</span></div>
      </div>
    );
  if (kind === 1)
    return (
      <div style={{ position: 'absolute', inset: 0, background: '#2a2f42', display: 'grid', placeItems: 'center' }}>
        <div style={{ width: w * 0.36, height: w * 0.36, borderRadius: '30%', border: `4px solid ${C.mute}`, display: 'grid', placeItems: 'center', fontSize: w * 0.06, fontWeight: 900, color: C.mute }}>LOGO</div>
      </div>
    );
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#3b4157' }}>
      <div style={{ position: 'absolute', left: w * 0.3, top: h * 0.3, width: w * 0.4, height: h * 0.5, border: `3px dashed ${C.mute}`, borderRadius: 16, display: 'grid', placeItems: 'center', color: C.mute, fontSize: w * 0.05, fontWeight: 700 }}>말하는 사람</div>
    </div>
  );
}

/* ═══════════════════ S1 — 넘길까, 볼까 (scene) ═══════════════════ */
const PH = 780;
const PW = (PH * 9) / 16;
export function FeedScene() {
  const t = useSceneTime();
  /* 카드 세 장이 0.7초 간격으로 넘어가고, 넷째(예시 A)에서 감속하며 멈춘다 */
  const step = (k: number) => easeInOut(interpolate(t, [0.5 + k * 0.7, 0.8 + k * 0.7], [0, 1]));
  const last = easeInOut(interpolate(t, [2.6, 3.2], [0, 1]));
  const pos = step(0) + step(1) + last; /* 0 → 3 (넷째 화면이 예시 A) */
  const draw = interpolate(t, [3.3, 4.2], [0, 1]);
  const lift = interpolate(t, [3.2, 3.6], [0, 1]);
  const frames: ReactNode[] = [<DullFrame key="0" kind={0} w={PW} h={PH} />, <DullFrame key="1" kind={1} w={PW} h={PH} />, <DullFrame key="2" kind={2} w={PW} h={PH} />, <FirstFrame key="3" w={PW} h={PH} draw={draw} caption={t > 3.25} />];
  return (
    <>
      <div style={{ ...abs(120, 250, 900) }}>
        <div style={{ ...kick, ...riseIn(t, 0.1) }}>AI쇼츠제작 · 대본</div>
        <h1 style={{ ...h1, fontSize: 92, marginTop: 18, ...riseIn(t, 0.2) }}>첫 1초부터<br />마지막 장면까지</h1>
        <div style={{ fontSize: 40, fontWeight: 700, marginTop: 24, color: C.mute, ...riseIn(t, 0.35) }}>쇼츠 대본 쓰기</div>
      </div>
      <Phone h={PH} style={{ ...abs(1240, 140) }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: PW, height: PH * 4, transform: `translateY(${-pos * PH}px)` }}>
          {frames.map((f, i) => (
            <div key={i} style={{ position: 'absolute', left: 0, top: i * PH, width: PW, height: PH, overflow: 'hidden' }}>{f}</div>
          ))}
        </div>
        {/* 터치 표시 — 넘길 때마다 위로 미끄러진다 */}
        {[0, 1, 2].map((k) => {
          const a = k < 2 ? 0.5 + k * 0.7 : 2.6;
          const p = interpolate(t, [a - 0.1, a + 0.3], [0, 1]);
          const o = p > 0 && p < 1 ? 1 : 0;
          return <div key={k} style={{ position: 'absolute', left: PW / 2 - 34, top: PH * 0.75 - p * PH * 0.35, width: 68, height: 68, borderRadius: '50%', background: 'rgba(255,255,255,0.35)', border: '3px solid rgba(255,255,255,0.8)', opacity: o }} />;
        })}
        <div style={{ position: 'absolute', left: PW / 2 - 34, top: PH * 0.62 - lift * 40, width: 68, height: 68, borderRadius: '50%', background: 'rgba(255,255,255,0.35)', border: '3px solid rgba(255,255,255,0.8)', opacity: t > 3.15 ? 1 - lift : 0 }} />
      </Phone>
      <div style={{ ...abs(1240, 950, 474), textAlign: 'center', ...small, opacity: fade(t, 3.4) }}>엄지가 멈춘 곳 — 첫 장면이 움직이고, 첫 글자가 떠 있다</div>
      <div style={{ ...abs(120, 880, 1080), display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', ...riseIn(t, 1.2) }}>
        {['핵심 한 문장', '훅', '비트 맵', '줄별로 쓰기', '소리 내어 재기'].map((s, i) => (
          <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
            {i > 0 && <span style={{ color: C.faint, fontSize: 24 }}>→</span>}
            <Chip size={22}>{s}</Chip>
          </span>
        ))}
      </div>
    </>
  );
}

/* ═══════════════════ S2 — 끝까지 본 쇼츠에는 무엇이 있었나 (build 2) ═══════════════════ */
const ROUTE = ['조사', '제안', '대본', '장면 계획', '소재 생성', '편집', '합성', '게시'];
const RX = (i: number) => 200 + i * 220;
export function PositionSlide() {
  const c = useClicks(2);
  const at = c >= 1 ? 2 : 3;
  return (
    <>
      <Header kicker="오늘의 위치" title="끝까지 본 쇼츠에는 무엇이 있었나" />
      <div style={{ ...abs(0, 210, 1920, 160) }}>
        <svg width="1920" height="160" style={{ position: 'absolute', inset: 0 }} aria-hidden>
          <line x1={RX(0) - 50} y1={60} x2={RX(7) + 50} y2={60} stroke={C.mute} strokeWidth="10" strokeLinecap="round" opacity=".55" />
          {ROUTE.map((r, i) => <circle key={r} cx={RX(i)} cy={60} r={i === 2 || i === 3 ? 20 : 14} fill={C.bg} stroke={i === 2 ? LANE.say.color : C.mute} strokeWidth="6" />)}
        </svg>
        {ROUTE.map((r, i) => (
          <div key={r} style={{ ...abs(RX(i) - 90, 92, 180), textAlign: 'center', fontSize: i === 2 ? 28 : 21, fontWeight: i === 2 ? 900 : 700, color: i === 2 ? LANE.say.color : C.mute }}>{r}</div>
        ))}
        <div style={{ ...abs(RX(at) - 40, 42, 80, 36), borderRadius: 12, background: LANE.say.color, border: `3px solid ${C.ink}`, transition: 'left .9s cubic-bezier(.6,0,.2,1)' }} />
      </div>
      <div style={{ ...abs(RX(2) - 40, 400, 700), ...show(c >= 1) }}>
        <Chip size={21} color={LANE.say.color}>오늘은 한 역 앞 — 장면을 고르기 전에 무슨 이야기를 어떤 순서로 할지</Chip>
      </div>
      <div style={{ ...abs(120, 500, 1680, 400), borderRadius: 22, border: `3px dashed ${C.line}`, ...show(c >= 2) }}>
        <div style={{ ...abs(40, 34), ...kick }}>라이브 · 워드클라우드</div>
        <div style={{ ...abs(40, 80, 1600), fontSize: 46, fontWeight: 900, color: C.fg, wordBreak: 'keep-all' }}>최근에 넘기지 않고 끝까지 본 쇼츠 — 끝까지 본 이유는?</div>
        <div style={{ ...abs(40, 300), ...small }}>한 단어나 짧은 말로 · 결과는 선생님 화면에 모인다</div>
      </div>
    </>
  );
}

/* ═══════════════════ S3 — 대본은 네 줄로 흐른다 (static) ═══════════════════ */
const T0X = 280;
const SPS = 50; /* 1초 = 50px (0~30초 = 1500px) */
export function LanesSlide() {
  const laneY = (i: number) => 330 + i * 140;
  const val = (k: (typeof LANES)[number], r: (typeof SCRIPT_A)[number]) => (k === 'say' ? r.say : k === 'see' ? r.see : k === 'cap' ? r.cap : '');
  return (
    <>
      <Header kicker="대본이란" title="대본은 네 줄로 흐른다" />
      <div style={{ ...abs(1340, 90, 460) }}>
        <Term term="대본" gloss="시간 순서대로 말·화면·자막·소리를 적은 설계" />
      </div>
      {/* 눈금자 */}
      <div style={{ ...abs(T0X, 250, 1500, 40), borderBottom: `2px solid ${C.mute}` }}>
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} style={{ ...abs(i * 5 * SPS - 20, 0, 40), textAlign: 'center', ...mono, fontSize: 18, color: C.mute }}>{i * 5}초</div>
        ))}
      </div>
      {LANES.map((k, i) => (
        <div key={k}>
          <div style={{ ...abs(120, laneY(i) + 30, 140), fontSize: 30, fontWeight: 900, color: C.fg }}>
            <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: 4, background: LANE[k].color, marginRight: 10 }} />
            {LANE[k].ko}
          </div>
          <div style={{ ...abs(T0X, laneY(i), 1500, 110), borderRadius: 12, border: `2px dashed ${C.line}` }} />
          {SCRIPT_A.filter((r) => r.t1 <= 9).map((r) => {
            const v = val(k, r) || (k === 'sound' ? '교실 소음 낮게' : '');
            return (
              <div key={r.t0} style={{ ...abs(T0X + r.t0 * SPS + 3, laneY(i) + 3, (r.t1 - r.t0) * SPS - 6, 104), borderRadius: 10, background: `color-mix(in srgb, ${LANE[k].color} 20%, ${C.panel})`, borderLeft: `5px solid ${LANE[k].color}`, padding: '8px 10px', boxSizing: 'border-box', fontSize: 16, lineHeight: 1.35, color: C.fg, overflow: 'hidden', wordBreak: 'keep-all' }}>{v}</div>
            );
          })}
        </div>
      ))}
      <div style={{ ...abs(T0X + 9 * SPS + 20, 900, 1000), ...small }}>9초 뒤는 비어 있다 — 오늘 이 칸들을 채우는 방법을 배운다</div>
      <div style={{ ...abs(120, 960, 1700), ...small, fontSize: 16, color: C.faint }}>OpenMontage 대본 단계도 섹션마다 시각 · 말(text) · 목소리 지시 · 화면 단서(enhancement cues)를 함께 적는다 (AGPL-3.0 · 구조만 인용)</div>
    </>
  );
}

/* ═══════════════════ S4 — 말로 끌고 가는가, 장면으로 끌고 가는가 (build 3) ═══════════════════ */
function MiniLanes({ w, weights }: { w: number; weights: Record<(typeof LANES)[number], number> }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {LANES.map((k) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ width: 60, fontSize: 20, fontWeight: 800, color: C.mute }}>{LANE[k].ko}</span>
          <div style={{ width: w, height: 8 + weights[k] * 22, borderRadius: 8, background: weights[k] ? `color-mix(in srgb, ${LANE[k].color} ${30 + weights[k] * 40}%, ${C.panel})` : 'transparent', border: weights[k] ? 'none' : `2px dashed ${C.line}` }} />
        </div>
      ))}
    </div>
  );
}
export function TwoTypesSlide() {
  return (
    <>
      <Header kicker="두 가지 대본" title="말로 끌고 가는가, 장면으로 끌고 가는가" />
      <Build at={1} style={{ ...abs(120, 220, 980, 560) }}>
        <div style={{ ...panel, padding: '28px 32px', height: 560, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <span style={{ fontSize: 44, fontWeight: 900 }}>나레이션형</span>
            <span style={{ ...small }}>목소리가 설명을 끌고 간다</span>
          </div>
          <div style={{ marginTop: 26 }}>
            <MiniLanes w={680} weights={{ say: 1, see: 0.6, cap: 0.5, sound: 0.2 }} />
          </div>
          <div style={{ marginTop: 30, fontSize: 24, fontWeight: 700 }}>예시 A · 「창문의 김은 어디서 왔을까」 30초</div>
          <div style={{ ...small, marginTop: 6 }}>정보 · 설명 · 팁</div>
          <div style={{ marginTop: 16 }}>
            <Term term="나레이션" gloss="화면 밖에서 들리는 설명하는 목소리" color={LANE.say.color} />
          </div>
        </div>
      </Build>
      <Build at={2} style={{ ...abs(1140, 220, 660, 560) }}>
        <div style={{ ...panel, padding: '28px 30px', height: 560, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <span style={{ fontSize: 40, fontWeight: 900 }}>무대사형</span>
            <span style={{ ...small }}>장면과 소리가 끌고 간다</span>
          </div>
          <div style={{ marginTop: 26 }}>
            <MiniLanes w={400} weights={{ say: 0, see: 1, cap: 0.35, sound: 0.8 }} />
          </div>
          <div style={{ marginTop: 30, fontSize: 24, fontWeight: 700 }}>예시 B · 「비 오는 하굣길」 20초</div>
          <div style={{ ...small, marginTop: 6 }}>이야기 · 감정</div>
        </div>
      </Build>
      <Build at={3} style={{ ...abs(120, 820, 1680) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 22, fontWeight: 800, marginRight: 8 }}>둘 다 필요한 것</span>
          {['핵심 메시지', '훅', '비트 맵', '화면 단서'].map((s) => <Chip key={s} size={22} color={LANE.say.color}>{s}</Chip>)}
        </div>
      </Build>
    </>
  );
}

/* ═══════════════════ S5 — 끝나고 남을 한 문장 (scene · 클릭 1) ═══════════════════ */
const IDEAS = [
  { s: '김 서린 창', keep: true },
  { s: '안경', keep: true },
  { s: '날숨', keep: true },
  { s: '버스', keep: false },
  { s: '응결', keep: false },
  { s: '에어컨', keep: false },
  { s: '성에', keep: false },
  { s: '과학 시간', keep: false },
];
export function DripScene() {
  const t = useSceneTime();
  const c = useClicks(1);
  const DX = 700;
  const DY = 250;
  const DWD = 380;
  const k = DWD / 300;
  const hole = { x: DX + 150 * k, y: DY + 178 * k };
  const sort = interpolate(t, [1.6, 2.4], [0, 1]);
  const fill = interpolate(t, [2.6, 4.4], [0, 1]);
  const msg = '창문의 김은 바깥 비가 아니라 교실 안 공기가 만든다';
  return (
    <>
      <Header kicker="쓰기 전에" title="끝나고 남을 한 문장" />
      <img src={`${SVG}/pour-over-dripper.svg`} alt="드립 깔때기와 유리 서버" style={{ ...abs(DX, DY, DWD) }} />
      {/* 서버 속 채워지는 커피 */}
      <div style={{ ...abs(DX + 54 * k, DY + (346 - 4 - 110 * fill) * k, 192 * k, 110 * fill * k), background: 'rgba(242,178,74,0.55)', borderRadius: '0 0 14px 14px' }} />
      {/* 떨어지는 방울 */}
      {fill > 0 && fill < 1 && [0, 1, 2].map((i) => {
        const ph = ((t * 2.2 + i / 3) % 1);
        return <div key={i} style={{ ...abs(hole.x - 5, hole.y + ph * 120, 10, 14), borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', background: LANE.say.color, opacity: 1 - ph * 0.3 }} />;
      })}
      {/* 아이디어 조각 */}
      {IDEAS.map((d, i) => {
        const fall = easeInOut(interpolate(t, [0.2 + i * 0.12, 0.9 + i * 0.12], [0, 1]));
        const col = i % 4;
        const row = Math.floor(i / 4);
        const x0 = d.keep ? DX + 20 + i * 118 : DX + 30 + col * 82;
        const y0 = d.keep ? DY + 96 : DY + 150 + row * 44;
        const out = !d.keep ? sort : 0;
        const j = i - 3;
        const tx0 = 140 + (j % 3) * 170;
        const ty0 = 660 + Math.floor(j / 3) * 60;
        const yIn = y0 - 260 + 260 * fall;
        const tx = x0 + (tx0 - x0) * out;
        const ty = yIn + (ty0 - yIn) * out;
        return (
          <div key={d.s} style={{ ...abs(tx, ty), padding: '6px 12px', borderRadius: 10, fontSize: 19, fontWeight: 800, whiteSpace: 'nowrap', color: d.keep ? C.ink : C.fg, background: d.keep ? (sort > 0.5 ? LANE.say.color : C.paper) : `color-mix(in srgb, ${C.mute} ${30 - out * 15}%, ${C.panel})`, opacity: fade(t, 0.2 + i * 0.12, 0.2) * (d.keep ? 1 : 1 - out * 0.4), boxShadow: '0 6px 14px -8px rgba(0,0,0,.7)' }}>{d.s}</div>
        );
      })}
      <div style={{ ...abs(120, 590, 560), ...show(c >= 1) }}>
        <Chip size={19}>밀려난 조각 = 다음 영상 재료</Chip>
      </div>
      {/* 핵심 메시지 */}
      <div style={{ ...abs(1180, 300, 620) }}>
        <Term term="핵심 메시지" gloss="시청자가 끝나고 기억할 한 문장" color={LANE.say.color} />
        <div style={{ ...panel, marginTop: 24, padding: '26px 28px', borderLeft: `8px solid ${LANE.say.color}` }}>
          <div style={{ ...kick }}>예시 A</div>
          <div style={{ fontSize: 38, fontWeight: 900, lineHeight: 1.35, marginTop: 8, wordBreak: 'keep-all', ...write(fill) }}>{msg}</div>
        </div>
        <div style={{ ...small, marginTop: 18, opacity: fade(t, 4.4) }}>이 문장에 보탬이 안 되는 조각은 오늘 대본에서 뺀다</div>
      </div>
    </>
  );
}

/* ═══════════════════ S6 — 첫 문장을 여는 네 가지 방법 (build 5) ═══════════════════ */
export function HooksSlide() {
  const c = useClicks(5);
  return (
    <>
      <Header kicker="훅" title="첫 문장을 여는 네 가지 방법" />
      <div style={{ ...abs(1400, 92, 400) }}>
        <Term term="훅" gloss="넘기지 않게 붙잡는 첫 장면과 첫 문장" color={LANE.say.color} />
      </div>
      {HOOKS.map((h, i) => {
        const on = c >= i + 1;
        const off = i - 1.5;
        return (
          <div
            key={h.type}
            style={{
              ...abs(960 - 190 + off * 400, 240 + Math.abs(off) * 34, 380, 470),
              borderRadius: 22,
              padding: '26px 26px',
              boxSizing: 'border-box',
              background: on ? C.panel2 : '#2b3150',
              border: `2px solid ${on ? LANE.say.color : C.line}`,
              transform: `rotate(${off * 4}deg) translateY(${on ? -16 : 0}px)`,
              transition: 'transform .45s, background .45s, border-color .45s',
              boxShadow: '0 28px 50px -30px rgba(0,0,0,.9)',
            }}
          >
            {on ? (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontSize: 36, fontWeight: 900 }}>{h.type}</span>
                  <span style={{ ...mono, fontSize: 15, color: C.mute }}>{h.en}</span>
                </div>
                <div style={{ ...small, marginTop: 6 }}>{h.gloss}</div>
                <div style={{ marginTop: 28, fontSize: 27, fontWeight: 800, lineHeight: 1.45, wordBreak: 'keep-all', color: C.fg }}>“{h.line}”</div>
                {i === 3 && <div style={{ marginTop: 18 }}><Chip size={16} color={C.coral}>10분 = 예시 숫자 — 실제로 쓸 땐 확인</Chip></div>}
              </>
            ) : (
              <div style={{ height: '100%', display: 'grid', placeItems: 'center', fontSize: 70, fontWeight: 900, color: C.faint }}>{i + 1}</div>
            )}
          </div>
        );
      })}
      <div style={{ ...abs(120, 860, 1680), display: 'flex', gap: 30, alignItems: 'center', ...show(c >= 5) }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: C.mute }}>쓰지 않을 시작</span>
        {['안녕하세요 여러분~', '이번 영상에서는 …'].map((s) => (
          <span key={s} style={{ fontSize: 30, fontWeight: 800, color: C.mute, textDecoration: 'line-through', textDecorationColor: C.coral, textDecorationThickness: 4 }}>“{s}”</span>
        ))}
      </div>
    </>
  );
}

/* ═══════════════════ S7 — 어느 첫 문장에서 멈추겠나 (build 3) ═══════════════════ */
export function GapSlide() {
  const c = useClicks(3);
  const H = 620;
  const W = (H * 9) / 16;
  return (
    <>
      <Header kicker="정보의 빈틈" title="어느 첫 문장에서 멈추겠나" />
      <Phone h={H} style={{ ...abs(120, 220) }}>
        <FirstFrame w={W} h={H} />
        <div style={{ position: 'absolute', left: 20, right: 20, bottom: 70, padding: '10px 14px', borderRadius: 12, background: 'rgba(16,19,29,0.82)', color: C.fg, fontSize: 21, fontWeight: 800, textAlign: 'center', ...show(c >= 1) }}>
          그럼 어디서 왔지? <span style={{ display: 'inline-block', width: 60, borderBottom: `3px dashed ${LANE.say.color}` }} />
        </div>
      </Phone>
      <div style={{ ...abs(620, 220, 560, 360), borderRadius: 20, border: `3px dashed ${C.line}`, padding: 28, boxSizing: 'border-box' }}>
        <div style={kick}>라이브 · 정답 없음</div>
        <div style={{ fontSize: 30, fontWeight: 900, marginTop: 10, lineHeight: 1.35, wordBreak: 'keep-all' }}>앞 장의 네 첫 문장 중, 어디서 엄지가 멈출까?</div>
        <div style={{ ...small, marginTop: 16 }}>반전 · 결과 약속 · 수수께끼 · 손해</div>
      </div>
      <div style={{ ...abs(1220, 220, 580), ...show(c >= 1) }}>
        <Term term="정보의 빈틈" gloss="답을 알고 싶어지게 비워 둔 질문" color={LANE.say.color} />
      </div>
      <div style={{ ...abs(620, 620, 1180), display: 'flex', flexDirection: 'column', gap: 12, ...show(c >= 2) }}>
        <div style={{ ...kick }}>쇼츠 훅 권장 (OpenMontage short-form 가이드)</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {['첫 프레임부터 움직임', '처음 0.5초 안에 글자', '목소리는 바로 시작'].map((s) => <Chip key={s} size={22} color={LANE.see.color}>{s}</Chip>)}
        </div>
      </div>
      <div style={{ ...abs(620, 760, 1180), display: 'flex', alignItems: 'center', gap: 28, ...show(c >= 3) }}>
        <div style={{ fontSize: 40, fontWeight: 900 }}>훅 = 약속</div>
        <div style={{ ...small, fontSize: 21, color: C.fg, maxWidth: 560 }}>연 빈틈은 끝에서 반드시 채운다 — 26~30초 「우리 숨이 남긴 흔적」</div>
        <div style={{ width: 96, height: 170, borderRadius: 12, overflow: 'hidden', position: 'relative', border: `2px solid ${C.line}`, flexShrink: 0 }}>
          <FirstFrame w={96} h={170} caption={false} />
        </div>
      </div>
      <div style={{ ...abs(620, 940, 1180), ...show(c >= 3) }}>
        <Note color={C.coral}>지키지 못할 약속(낚시)은 하지 않는다</Note>
      </div>
    </>
  );
}

