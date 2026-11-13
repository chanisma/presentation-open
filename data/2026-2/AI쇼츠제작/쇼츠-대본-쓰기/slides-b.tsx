import type { CSSProperties } from 'react';
import Build from '../../../../src/deck/Build';
import { useSceneTime, interpolate, easeInOut } from '../../../../src/scene';
import { abs, C, LANE, SVG, kick, small, mono, panel, Header, Term, Chip, Note, Arrow, Phone, useClicks } from './shared';
import { SCRIPT_A, PRACTICE_100, A_CHARS } from './cards';
import { FirstFrame } from './slides-a';

const fade = (t: number, at: number, d = 0.35) => interpolate(t, [at, at + d], [0, 1]);
const show = (on: boolean, delay = 0): CSSProperties => ({ opacity: on ? 1 : 0, transition: `opacity .5s ${delay}s` });

/* 곡선: 키포인트 (초, 높이 y) 사이를 코사인으로 부드럽게 잇는다 */
function curveY(pts: [number, number][], s: number) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [s0, y0] = pts[i];
    const [s1, y1] = pts[i + 1];
    if (s >= s0 && s <= s1) {
      const u = (s - s0) / (s1 - s0);
      return y0 + (y1 - y0) * (1 - Math.cos(u * Math.PI)) / 2;
    }
  }
  return pts[pts.length - 1][1];
}

/* ═══════════════════ S8 — 긴장이 오르내리는 길 (scene · 클릭 2) ═══════════════════ */
const AX0 = 220;
const ASPS = 50; /* 1초 = 50px */
const PTS_A: [number, number][] = [[0, 640], [3, 600], [9, 500], [17, 300], [21, 560], [24, 470], [30, 620]];
const PTS_B: [number, number][] = [[0, 680], [4, 650], [10, 560], [12.5, 380], [16, 500], [20, 600]];
const FLAGS_A = [[0, '훅'], [3, '빈틈'], [9, '핵심'], [20, '예시'], [26, '되돌리기']] as const;
const FLAGS_B = [[0, '훅'], [4, '고조'], [10, '반전'], [16, '착지']] as const;
export function CoasterScene() {
  const t = useSceneTime();
  const c = useClicks(2);
  const path = (pts: [number, number][], end: number) =>
    Array.from({ length: 121 }, (_, i) => {
      const s = (end * i) / 120;
      return `${i ? 'L' : 'M'}${AX0 + s * ASPS} ${curveY(pts, s)}`;
    }).join(' ');
  const s = 30 * easeInOut(interpolate(t, [0.4, 6.4], [0, 1]));
  const x = AX0 + s * ASPS;
  const y = curveY(PTS_A, s);
  const dy = curveY(PTS_A, Math.min(30, s + 0.2)) - curveY(PTS_A, Math.max(0, s - 0.2));
  const ang = (Math.atan2(dy, 0.4 * ASPS) * 180) / Math.PI;
  return (
    <>
      <Header kicker="비트 맵" title="긴장이 오르내리는 길" />
      <div style={{ ...abs(1380, 92, 420) }}>
        <Term term="비트 맵" gloss="비트를 시간 순서로 늘어놓은 표" color={LANE.sound.color} />
      </div>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }} aria-hidden>
        {/* 시간축 */}
        <line x1={AX0} y1={780} x2={AX0 + 30 * ASPS} y2={780} stroke={C.mute} strokeWidth="2" />
        {Array.from({ length: 7 }, (_, i) => <line key={i} x1={AX0 + i * 5 * ASPS} y1={772} x2={AX0 + i * 5 * ASPS} y2={788} stroke={C.mute} strokeWidth="2" />)}
        {/* 레일 A — 받침 기둥 + 두 줄 */}
        {Array.from({ length: 31 }, (_, i) => <line key={i} x1={AX0 + i * ASPS} y1={curveY(PTS_A, i) + 8} x2={AX0 + i * ASPS} y2={780} stroke={C.line} strokeWidth="2" />)}
        <path d={path(PTS_A, 30)} fill="none" stroke={LANE.say.color} strokeWidth="6" strokeLinecap="round" />
        <path d={path(PTS_A.map(([a, b]) => [a, b + 10] as [number, number]), 30)} fill="none" stroke={LANE.say.color} strokeWidth="2" opacity=".5" />
        {/* 레일 B */}
        <g style={{ opacity: c >= 1 ? 1 : 0, transition: 'opacity .6s' }}>
          <path d={path(PTS_B, 20)} fill="none" stroke={LANE.sound.color} strokeWidth="5" strokeDasharray="2 0" strokeLinecap="round" />
        </g>
        {/* 되돌리기 호 */}
        <g style={{ opacity: c >= 2 ? 1 : 0, transition: 'opacity .6s' }}>
          <path d={`M${AX0 + 26 * ASPS} ${curveY(PTS_A, 26) - 40} C${AX0 + 22 * ASPS} 120 ${AX0 + 4 * ASPS} 120 ${AX0 + 0.5 * ASPS} ${curveY(PTS_A, 0) - 50}`} fill="none" stroke={LANE.say.color} strokeWidth="3" strokeDasharray="10 10" />
        </g>
      </svg>
      {Array.from({ length: 7 }, (_, i) => <div key={i} style={{ ...abs(AX0 + i * 5 * ASPS - 30, 796, 60), textAlign: 'center', ...mono, fontSize: 17, color: C.mute }}>{i * 5}초</div>)}
      {FLAGS_A.map(([fs, name]) => (
        <div key={name} style={{ ...abs(AX0 + fs * ASPS - 4, curveY(PTS_A, fs) - 64), display: 'flex', alignItems: 'flex-start', gap: 0, opacity: fade(t, 0.3 + fs * 0.2, 0.3) }}>
          <div style={{ width: 4, height: 56, background: C.fg }} />
          <div style={{ padding: '4px 10px', background: LANE.say.color, color: C.ink, fontSize: 19, fontWeight: 900, borderRadius: '0 6px 6px 0', whiteSpace: 'nowrap' }}>{name}</div>
        </div>
      ))}
      {FLAGS_B.map(([fs, name]) => (
        <div key={name} style={{ ...abs(AX0 + fs * ASPS - 4, curveY(PTS_B, fs) + 14), padding: '3px 9px', background: LANE.sound.color, color: C.ink, fontSize: 17, fontWeight: 900, borderRadius: 6, whiteSpace: 'nowrap', ...show(c >= 1, 0.2) }}>{name}</div>
      ))}
      {/* 열차 */}
      <div style={{ ...abs(x - 34, y - 34, 68, 30), borderRadius: 10, background: C.coral, border: `3px solid ${C.ink}`, transform: `rotate(${ang}deg)`, transformOrigin: '50% 100%' }} />
      <div style={{ ...abs(1300, 860, 500), display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Chip size={19} color={LANE.say.color}>예시 A 설명형 — 정점은 핵심</Chip>
        <div style={show(c >= 1)}><Chip size={19} color={LANE.sound.color}>예시 B 이야기형 — 정점은 반전</Chip></div>
      </div>
      <div style={{ ...abs(220, 880, 1000), ...show(c >= 2) }}>
        <Note color={LANE.say.color}>가장 좋은 순간을 너무 일찍 꺼내지 않는다 · 마지막은 첫 장면을 다시 부른다</Note>
      </div>
    </>
  );
}

/* ═══════════════════ S9 — '그리고' 대신 '그런데'와 '그래서' (build 5) ═══════════════════ */
const LINKS = ['그런데', '그래서', '그런데', '그래서'];
const SENTS = ['김이 생겼다', '닦아도 또 생긴다', '원인은 바깥이 아니다', '물방울은 안쪽에 있다', '범인은 교실 안 공기다'];
export function ButThereforeSlide() {
  const c = useClicks(5);
  return (
    <>
      <Header kicker="줄과 줄 사이" title="'그리고' 대신 '그런데'와 '그래서'" />
      <div style={{ ...abs(120, 280, 1680, 480) }}>
        {SENTS.map((s, i) => {
          const changed = i > 0 && c >= i;
          const yOff = changed ? (LINKS[i - 1] === '그런데' ? 120 : 0) : 0;
          return (
            <div key={s} style={{ ...abs(i * 340, 60 + yOff, 290), padding: '18px 20px', borderRadius: 14, background: C.panel, border: `2px solid ${changed ? (LINKS[i - 1] === '그런데' ? C.coral : LANE.see.color) : C.line}`, fontSize: 26, fontWeight: 800, wordBreak: 'keep-all', transition: 'top .5s, border-color .5s', boxSizing: 'border-box' }}>
              {s}
            </div>
          );
        })}
        {[1, 2, 3, 4].map((i) => {
          const changed = c >= i;
          const word = changed ? LINKS[i - 1] : '그리고';
          const col = !changed ? C.faint : word === '그런데' ? C.coral : LANE.see.color;
          return (
            <div key={i} style={{ ...abs(i * 340 - 72, 0, 104), textAlign: 'center' }}>
              <span style={{ display: 'inline-block', padding: '6px 12px', borderRadius: 999, fontSize: 20, fontWeight: 900, color: changed ? C.ink : C.mute, background: changed ? col : 'transparent', border: `2px solid ${col}`, transition: 'all .4s' }}>{word}</span>
            </div>
          );
        })}
      </div>
      <div style={{ ...abs(120, 560, 1680), ...small, fontSize: 21, color: C.mute }}>
        {c === 0 ? '모두 「그리고」 — 정보는 맞는데 다음 줄이 궁금하지 않다' : '연결이 바뀔 때마다 다음 줄이 필요해진다'}
      </div>
      <Build at={5} style={{ ...abs(120, 680, 1680) }}>
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ ...panel, padding: '18px 24px', borderLeft: `8px solid ${C.coral}`, flex: 1 }}>
            <div style={{ fontSize: 30, fontWeight: 900 }}>그런데 <span style={{ ...mono, fontSize: 17, color: C.mute }}>but</span></div>
            <div style={{ ...small, fontSize: 21, color: C.fg, marginTop: 4 }}>기대를 한 번 꺾는다</div>
          </div>
          <div style={{ ...panel, padding: '18px 24px', borderLeft: `8px solid ${LANE.see.color}`, flex: 1 }}>
            <div style={{ fontSize: 30, fontWeight: 900 }}>그래서 <span style={{ ...mono, fontSize: 17, color: C.mute }}>therefore</span></div>
            <div style={{ ...small, fontSize: 21, color: C.fg, marginTop: 4 }}>다음 줄이 필요해진다</div>
          </div>
        </div>
        <div style={{ ...small, fontSize: 16, color: C.faint, marginTop: 14 }}>OpenMontage 대본 규칙: 섹션 사이를 'and then'이 아니라 'but / therefore'로 잇는다</div>
      </Build>
    </>
  );
}

/* ═══════════════════ S10 — 틀린 생각을 먼저 꺼내라 (build 4) ═══════════════════ */
export function MisconceptionSlide() {
  const c = useClicks(4);
  const G = { x: 900, y: 230, w: 60, h: 600 };
  const drops = (side: 'in' | 'out') =>
    Array.from({ length: 9 }, (_, i) => (
      <div key={side + i} style={{ ...abs(side === 'in' ? G.x - 26 : G.x + G.w + 6, G.y + 50 + i * 60 + (i % 2) * 14, 20, 26), borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', background: '#bfe3f2', border: `2px solid ${C.ink}` }} />
    ));
  return (
    <>
      <Header kicker="오해 먼저" title="틀린 생각을 먼저 꺼내라" />
      {/* 유리 단면 */}
      <div style={{ ...abs(380, G.y, G.x - 380, G.h), borderRadius: '20px 0 0 20px', background: 'linear-gradient(90deg, rgba(242,178,74,0.10), rgba(242,178,74,0.22))' }} />
      <div style={{ ...abs(G.x + G.w, G.y, 420, G.h), borderRadius: '0 20px 20px 0', background: 'rgba(76,120,170,0.18)' }} />
      <div style={{ ...abs(G.x, G.y, G.w, G.h), background: 'rgba(207,227,238,0.5)', border: `3px solid ${C.fg}`, boxSizing: 'border-box' }} />
      <div style={{ ...abs(400, G.y + 20), fontSize: 26, fontWeight: 900 }}>교실 안 · 따뜻하고 습하다</div>
      <div style={{ ...abs(G.x + G.w + 20, G.y + 20, 380), fontSize: 26, fontWeight: 900 }}>바깥 · 비, 차갑다</div>
      <div style={{ ...abs(G.x - 6, G.y + G.h + 12, 80), textAlign: 'center', ...small }}>유리</div>
      <div style={{ ...abs(380, 870, 1000), fontSize: 34, fontWeight: 900, wordBreak: 'keep-all' }}>창문 김은 안쪽에 생길까, 바깥쪽에 생길까?</div>
      <div style={{ opacity: c >= 2 && c < 3 ? 1 : 0, transition: 'opacity .5s' }}>
        {drops('out')}
        <div style={{ ...abs(G.x + G.w + 60, G.y + 280), ...{ padding: '6px 14px', borderRadius: 10, background: C.coral, color: C.ink, fontSize: 24, fontWeight: 900 } }}>오해: 바깥쪽</div>
      </div>
      <div style={{ opacity: c >= 3 ? 1 : 0, transition: 'opacity .5s' }}>
        {drops('in')}
        {[0, 1, 2].map((i) => <Arrow key={i} x1={450} y1={G.y + 160 + i * 150} x2={G.x - 44} y2={G.y + 160 + i * 150} color={LANE.say.color} width={4} />)}
        <div style={{ ...abs(460, G.y + 470), padding: '6px 14px', borderRadius: 10, background: LANE.see.color, color: C.ink, fontSize: 24, fontWeight: 900 }}>실제: 안쪽</div>
        <div style={{ ...abs(460, G.y + 520, 400), ...small, fontSize: 17 }}>실제로는 에어컨 켠 여름엔 바깥쪽에도 맺힌다</div>
      </div>
      <Build at={4} style={{ ...abs(1440, 300, 380) }}>
        <div style={{ ...panel, padding: '20px 22px', borderLeft: `8px solid ${LANE.say.color}` }}>
          <div style={kick}>근거</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 8, lineHeight: 1.45, wordBreak: 'keep-all' }}>오해를 먼저 보이고 반박한 물리 영상이 정답만 설명한 영상보다 학습 효과가 컸다</div>
          <div style={{ ...small, fontSize: 16, marginTop: 10 }}>Muller 외, 2008 · 대학 1학년 물리 · Journal of Computer Assisted Learning</div>
        </div>
        <div style={{ marginTop: 18 }}>
          <Chip size={20} color={LANE.say.color}>오늘 이 장이 그 방법이었다</Chip>
        </div>
      </Build>
      <div style={{ ...abs(1440, 230, 380), ...show(c >= 1 && c < 4) }}>
        <Chip size={21}>손 들어 보기</Chip>
      </div>
    </>
  );
}

/* ═══════════════════ S11 — 30초에 들어가는 글자 수 (scene · 클릭 2) ═══════════════════ */
const HG = { x: 640, y: 250, w: 300 };
const HK = HG.w / 240;
export function HourglassScene() {
  const t = useSceneTime();
  const c = useClicks(2);
  const N = A_CHARS;
  const pile = Math.round(N * interpolate(t, [0.2, 2.0], [0, 1]));
  const drained = Math.round(N * interpolate(t, [2.2, 5.6], [0, 1]));
  const top = pile - drained;
  const cell = 7;
  const cols = 16;
  const cellsTop = Array.from({ length: Math.max(0, top) }, (_, i) => i);
  const cellsBot = Array.from({ length: drained }, (_, i) => i);
  const over = c >= 1 ? 54 : 0;
  return (
    <>
      <Header kicker="글자 예산" title="30초에 들어가는 글자 수" />
      <div style={{ ...abs(1180, 92, 620) }}>
        <Term term="글자 예산" gloss="정해진 시간 안에 읽을 수 있는 글자 수" color={LANE.say.color} />
      </div>
      <img src={`${SVG}/wooden-hourglass.svg`} alt="나무 테 모래시계" style={{ ...abs(HG.x, HG.y, HG.w) }} />
      <svg width={HG.w} height={360 * HK} viewBox="0 0 240 360" style={{ ...abs(HG.x, HG.y) }} aria-hidden>
        <defs>
          <clipPath id="hg-top"><path d="M60 38 L180 38 C180 98 150 150 126 176 L114 176 C90 150 60 98 60 38 Z" /></clipPath>
          <clipPath id="hg-bot"><path d="M114 184 L126 184 C150 210 180 262 180 322 L60 322 C60 262 90 210 114 184 Z" /></clipPath>
        </defs>
        <g clipPath="url(#hg-top)">
          {cellsTop.map((i) => <rect key={i} x={64 + (i % cols) * cell} y={170 - Math.floor(i / cols) * cell - cell} width={cell - 1} height={cell - 1} fill={LANE.say.color} />)}
        </g>
        <g clipPath="url(#hg-bot)">
          {cellsBot.map((i) => <rect key={i} x={64 + (i % cols) * cell} y={320 - Math.floor(i / cols) * cell - cell} width={cell - 1} height={cell - 1} fill={LANE.say.color} />)}
        </g>
        {top > 0 && drained > 0 && <rect x="118" y="176" width="4" height="140" fill={LANE.say.color} opacity=".8" />}
      </svg>
      {/* 넘침 */}
      {over > 0 && Array.from({ length: 24 }, (_, i) => (
        <div key={i} style={{ ...abs(HG.x + 170 + (i % 6) * 14, HG.y - 20 + Math.floor(i / 6) * 14 + (i % 6) * 18, 11, 11), background: C.coral, borderRadius: 2, opacity: 0.9 }} />
      ))}
      <div style={{ ...abs(1000, 300, 760) }}>
        <div style={{ ...panel, padding: '22px 26px' }}>
          <div style={kick}>글자 예산 =</div>
          <div style={{ fontSize: 34, fontWeight: 900, marginTop: 8 }}>1초에 읽는 글자 수 × 목표 시간</div>
          <div style={{ ...small, fontSize: 20, marginTop: 12, color: C.fg }}>예시 A: <b style={mono}>{N}</b>자 · 목표 30초</div>
          {over > 0 && <div style={{ fontSize: 22, fontWeight: 800, color: C.coral, marginTop: 10 }}>200자로 늘리면 → 위 칸이 넘친다 (숨이 차거나, 30초를 넘는다)</div>}
        </div>
        <div style={{ ...small, fontSize: 18, marginTop: 14 }}>한국어 기준값은 확인한 자료가 없다 → 직접 재서 우리 반 기준을 정한다</div>
      </div>
      <div style={{ ...abs(1000, 620, 800), ...show(c >= 2) }}>
        <div style={{ ...panel, padding: '20px 24px', borderLeft: `8px solid ${LANE.see.color}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={kick}>100자 연습 문장 (공백 제외)</span>
            <span style={{ ...mono, fontSize: 18, color: LANE.see.color }}>⏱ 짝이 읽고, 짝이 잰다</span>
          </div>
          <div style={{ fontSize: 22, lineHeight: 1.6, marginTop: 10, wordBreak: 'keep-all' }}>{PRACTICE_100}</div>
        </div>
      </div>
      <div style={{ ...abs(120, 880, 480), ...small, opacity: fade(t, 5.6) }}>쇼츠는 평소보다 조금 빠르게 읽는 편이다(권장)</div>
    </>
  );
}

/* ═══════════════════ S12 — 덜어내기: 화면이 말하면 입은 쉰다 (build 4) ═══════════════════ */
const DRAFT = [
  { s: '창문에 낀 김, 비가 묻힌 게 아닙니다.', kind: '' },
  { s: '닦아도 또 생기죠. 그런데 이 물방울, 창문 안쪽에 있어요.', kind: '' },
  { s: '정말 엄청 신기하게도,', kind: 'deco' },
  { s: '범인은 교실 안 공기입니다.', kind: 'lock' },
  { s: '바로 우리 교실 안의 공기예요.', kind: 'dup' },
  { s: '우리가 내쉬는 숨에도 수증기가 있어요. 따뜻한 공기가 차가운 유리에 닿으면, 수증기가 작은 물방울로 바뀝니다.', kind: '' },
  { s: '여기 안경이 보이죠, 안경에도 김이 서렸습니다.', kind: 'screen' },
  { s: '그래서 추운 날엔 버스 창문도, 안경도 뿌옇게 되죠.', kind: '' },
  { s: '다음에 창문이 뿌옇다면, 우리 숨이 남긴 흔적입니다.', kind: 'lock' },
];
const ORDER_CUT = ['screen', 'dup', 'deco'];
export function TrimSlide() {
  const c = useClicks(4);
  const cut = (k: string) => ORDER_CUT.indexOf(k) >= 0 && c > ORDER_CUT.indexOf(k);
  const len = DRAFT.filter((d) => !cut(d.kind)).map((d) => d.s).join('').replace(/\s/g, '').length;
  const budget = A_CHARS;
  const PXC = 900 / budget;
  return (
    <>
      <Header kicker="예산이 넘쳤을 때" title="덜어내기: 화면이 말하면 입은 쉰다" />
      {/* 예산 막대 */}
      <div style={{ ...abs(120, 210, 1680, 70) }}>
        <div style={{ ...abs(0, 10, 900, 44), borderRadius: 10, border: `3px solid ${LANE.say.color}` }} />
        <div style={{ ...abs(0, 14, Math.min(len, budget) * PXC, 36), borderRadius: 8, background: `color-mix(in srgb, ${LANE.say.color} 55%, ${C.panel})`, transition: 'width .5s' }} />
        {len > budget && <div style={{ ...abs(900, 14, (len - budget) * PXC, 36), borderRadius: 8, background: C.coral, transition: 'width .5s' }} />}
        <div style={{ ...abs(1300, 14), ...mono, fontSize: 26, fontWeight: 800, color: len > budget ? C.coral : LANE.see.color }}>{len}자 / 예산 {budget}자</div>
      </div>
      <div style={{ ...abs(120, 320, 1100), display: 'flex', flexDirection: 'column', gap: 8 }}>
        {DRAFT.map((d) => {
          const gone = cut(d.kind);
          const locked = d.kind === 'lock' && c >= 4;
          return (
            <div key={d.s} style={{ fontSize: 23, lineHeight: 1.45, color: gone ? C.faint : C.fg, textDecoration: gone ? 'line-through' : 'none', textDecorationColor: C.coral, textDecorationThickness: 3, wordBreak: 'keep-all', display: 'flex', gap: 10, alignItems: 'baseline' }}>
              <span>{d.s}</span>
              {locked && <Chip size={15} color={LANE.see.color}>지우지 않는다</Chip>}
            </div>
          );
        })}
      </div>
      <div style={{ ...abs(1280, 320, 520), display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={kick}>지울 순서</div>
        {['① 화면이 이미 보여 주는 것을 말로 반복', '② 같은 뜻의 문장 두 번', '③ 꾸미는 말 (정말, 엄청, 너무)'].map((s, i) => (
          <div key={s} style={{ ...panel, padding: '14px 18px', fontSize: 22, fontWeight: 800, borderLeft: `6px solid ${c > i ? C.coral : C.line}`, opacity: c > i ? 1 : 0.35, transition: 'opacity .4s' }}>{s}</div>
        ))}
        <div style={{ ...show(c >= 4) }}>
          <Note color={LANE.see.color}>핵심 메시지 문장과, 훅의 빈틈을 닫는 문장은 남긴다</Note>
        </div>
      </div>
      <div style={{ ...abs(120, 900, 1680), display: 'flex', gap: 16, alignItems: 'center', ...show(c >= 4) }}>
        <Chip size={18} color={LANE.sound.color}>무대사형도 같다</Chip>
        <span style={{ ...small, fontSize: 19 }}>예시 B 반전(10~16초): 우산이 들어오는 순간 자막은 비운다 — 화면이 말한다 · OpenMontage: 대사와 자막이 같은 것을 두 번 설명하지 않는다</span>
      </div>
    </>
  );
}

/* ═══════════════════ S13 — 줄마다 '이때 무엇을 보여줄지' (static) ═══════════════════ */
export function CuesSlide() {
  const kinds = ['생성 장면(숏)', '클로즈업', '글자 카드', '도식', '실제 촬영'];
  return (
    <>
      <Header kicker="화면 단서" title="줄마다 '이때 무엇을 보여줄지'" />
      <div style={{ ...abs(120, 200, 1180), ...panel, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 1.1fr', background: C.panel2, padding: '12px 18px', fontSize: 18, fontWeight: 800, color: C.mute }}>
          <span>시각</span><span>말</span><span style={{ color: LANE.see.color }}>화면 단서</span>
        </div>
        {SCRIPT_A.map((r) => (
          <div key={r.t0} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 1.1fr', padding: '12px 18px', borderTop: `1px solid ${C.line}`, fontSize: 18, lineHeight: 1.45, alignItems: 'start', background: r.beat === '핵심' ? 'rgba(76,195,176,0.08)' : 'transparent' }}>
            <span style={{ ...mono, color: C.mute }}>{r.t0}–{r.t1}</span>
            <span style={{ color: C.faint, wordBreak: 'keep-all', paddingRight: 16 }}>{r.say}</span>
            <span style={{ color: C.fg, fontWeight: 700, wordBreak: 'keep-all', borderLeft: `4px solid ${LANE.see.color}`, paddingLeft: 12 }}>{r.see}</span>
          </div>
        ))}
      </div>
      <div style={{ ...abs(1360, 200, 440), display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Term term="화면 단서" gloss="대본 한 줄 옆에 적는 '이때 무엇을 보여줄지'" color={LANE.see.color} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 6 }}>
          {kinds.map((k) => <Chip key={k} size={19} color={LANE.see.color}>{k}</Chip>)}
        </div>
        <div style={{ ...small, fontSize: 19, color: C.fg, marginTop: 8 }}>쇼츠 권장: 화면이 1~3초마다 바뀐다 · 말과 그림은 같은 순간에</div>
      </div>
      {/* 화면 단서 한 줄 → 장면 카드 */}
      <Arrow x1={1300} y1={480} x2={1380} y2={600} color={LANE.see.color} width={3} />
      <div style={{ ...abs(1390, 560, 410), ...panel, padding: '16px 18px', background: C.paper, color: C.ink }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: C.ink, letterSpacing: '0.1em' }}>장면 카드 (지난 시간)</div>
        {[['피사체', '입김을 부는 학생 · 차가운 유리'], ['동작', '숨 → 유리에 물방울이 맺힌다'], ['배경', ''], ['공간 구도', ''], ['카메라', '']].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 16, color: C.ink }}>
            <b style={{ width: 70, flexShrink: 0 }}>{k}</b>
            <span style={{ flex: 1, borderBottom: v ? 'none' : '2px dotted rgba(16,19,29,.3)' }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ ...abs(1390, 840, 410), ...small, fontSize: 18 }}>화면 단서 한 줄 → 다음 단계의 장면 카드 하나</div>
      <div style={{ ...abs(120, 960, 1680), ...small, fontSize: 16, color: C.faint }}>1~3초는 업계 가이드(OpenMontage short-form)의 권장값 · 감정 형용사 대신 눈에 보이는 원인으로 (지난 시간 S12)</div>
    </>
  );
}

/* ═══════════════════ S14 — 읽는 방법도 대본에 적는다 (build 4) ═══════════════════ */
export function VoiceSlide() {
  const c = useClicks(4);
  return (
    <>
      <Header kicker="목소리 지시" title="읽는 방법도 대본에 적는다" />
      <div style={{ ...abs(1380, 92, 420) }}>
        <Term term="목소리 지시" gloss="속도·강조할 단어·쉼을 적은 메모" color={LANE.say.color} />
      </div>
      <div style={{ ...abs(160, 300, 1600) }}>
        <div style={{ ...abs(0, -70), padding: '6px 16px', borderRadius: 10, fontSize: 24, fontWeight: 800, color: c >= 1 ? C.faint : C.fg, background: C.panel2, textDecoration: c >= 1 ? 'line-through' : 'none', textDecorationColor: C.coral, transition: 'all .4s' }}>메모: 자연스럽게, 감정을 담아</div>
        <div style={{ fontSize: 50, fontWeight: 900, lineHeight: 1.5, wordBreak: 'keep-all' }}>
          <span style={{ borderBottom: c >= 2 ? `8px solid ${LANE.say.color}` : '8px solid transparent', transition: 'border-color .4s' }}>범인은</span> 교실 안 공기입니다. 우리가 내쉬는 숨에도 수증기가 있어요. 따뜻한 공기가 차가운 유리에 닿으면, 수증기가 작은 물방울로 바뀝니다.
          <span style={{ display: 'inline-block', width: 120, height: 34, marginLeft: 14, verticalAlign: 'middle', borderRadius: 8, background: c >= 3 ? `repeating-linear-gradient(90deg, ${LANE.say.color} 0 6px, transparent 6px 12px)` : 'transparent', transition: 'background .4s' }} />
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 20 }}>
          <div style={show(c >= 2)}><Chip size={20} color={LANE.say.color}>◀◀ '범인은'에서 느리게 · 힘을 준다</Chip></div>
          <div style={show(c >= 3)}><Chip size={20} color={LANE.say.color}>⏸ 끝에 1초 쉼 — 받아들일 시간</Chip></div>
        </div>
      </div>
      <div style={{ ...abs(160, 760, 1600), ...show(c >= 4) }}>
        <div style={{ ...kick }}>무대사형의 소리 지시 — 예시 B 10~20초</div>
        <svg width="1600" height="110" style={{ marginTop: 10 }} aria-hidden>
          {Array.from({ length: 80 }, (_, i) => {
            const x = i * 20;
            const quiet = i >= 30 && i < 40;
            const piano = i >= 48;
            const h = quiet ? 2 : piano ? 18 + (i % 4) * 6 : 40 + ((i * 37) % 30);
            return <rect key={i} x={x} y={55 - h / 2} width="10" height={h} rx="3" fill={piano ? LANE.sound.color : quiet ? C.faint : '#7d8fb0'} />;
          })}
        </svg>
        <div style={{ display: 'flex', gap: 0, ...small, fontSize: 18, marginTop: 4 }}>
          <span style={{ width: 600 }}>빗소리 크게</span><span style={{ width: 360, color: C.fg }}>1초 정적 (반전)</span><span style={{ color: LANE.sound.color }}>피아노가 들어온다 (착지)</span>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════ S15 — 소리 없이 봐도 알 수 있게 (static) ═══════════════════ */
export function SafeZoneSlide() {
  const H = 720;
  const W = (H * 9) / 16;
  return (
    <>
      <Header kicker="자막과 안전 영역" title="소리 없이 봐도 알 수 있게" />
      <div style={{ ...abs(120, 220, 520), display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Term term="자막" gloss="말을 글자로 띄운 것" color={LANE.cap.color} />
        <Term term="안전 영역" gloss="앱 버튼에 가리지 않는 화면 가운데 구역" color={LANE.cap.color} />
        <div style={{ ...panel, padding: '18px 20px', marginTop: 8 }}>
          {['한 줄은 짧게 — 15자 안팎(수업 기준)', '두 줄 이하', '글자 카드는 몇 단어만, 화면 위쪽에'].map((s) => <div key={s} style={{ fontSize: 21, fontWeight: 700, marginTop: 6 }}>· {s}</div>)}
        </div>
        <div style={{ ...small, fontSize: 18 }}>나레이션형: 자막 = 말 · 무대사형: 자막이 이야기를 맡는다</div>
      </div>
      <Phone h={H} style={{ ...abs(760, 200) }}>
        <FirstFrame w={W} h={H} caption={false} />
        {/* 앱 UI 가림 */}
        <div style={{ position: 'absolute', right: 0, top: H * 0.38, width: 74, height: H * 0.48, background: 'rgba(16,19,29,0.62)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, paddingTop: 20 }}>
          {['♥', '💬', '↗'].map((s) => <span key={s} style={{ fontSize: 28, color: C.fg }}>{s}</span>)}
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: H * 0.17, background: 'rgba(16,19,29,0.62)', padding: '14px 18px', boxSizing: 'border-box', color: C.mute, fontSize: 16 }}>@채널 · 설명 글 … 음악</div>
        {/* 안전 영역 */}
        <div style={{ position: 'absolute', left: W * 0.08, right: 84, top: H * 0.08, bottom: H * 0.2, border: `3px dashed ${LANE.cap.color}`, borderRadius: 12 }} />
        <div style={{ position: 'absolute', left: W * 0.1, top: H * 0.09, fontSize: 15, fontWeight: 800, color: C.ink, background: LANE.cap.color, padding: '2px 8px', borderRadius: 6 }}>안전 영역</div>
        <div style={{ position: 'absolute', left: W * 0.12, right: 96, bottom: H * 0.24, textAlign: 'center', fontSize: 30, fontWeight: 900, color: C.fg, textShadow: '0 0 6px #000, 0 0 2px #000' }}>범인은 교실 안 공기</div>
      </Phone>
      <div style={{ ...abs(1300, 220, 500) }}>
        <div style={kick}>나쁜 예</div>
        <Phone h={480} style={{ marginTop: 10 }}>
          <FirstFrame w={270} h={480} caption={false} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 82, background: 'rgba(16,19,29,0.62)' }} />
          <div style={{ position: 'absolute', left: 8, right: 8, bottom: 24, textAlign: 'center', fontSize: 15, fontWeight: 900, color: C.fg, textShadow: '0 0 4px #000' }}>따뜻한 공기가 차가운 유리에 닿으면 수증기가 작은 물방울로 바뀝니다</div>
        </Phone>
        <div style={{ ...small, fontSize: 18, marginTop: 12 }}>한 줄이 길고 아래쪽이라 설명 글에 가려진다</div>
      </div>
      <div style={{ ...abs(120, 960, 1680), ...small, fontSize: 16, color: C.faint }}>안전 영역 크기는 플랫폼마다 다르다 · '15자 안팎'은 이 수업의 운영 기준 · 자막 권장은 OpenMontage short-form 가이드</div>
    </>
  );
}
