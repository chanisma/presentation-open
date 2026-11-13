import type { CSSProperties } from 'react';
import Build from '../../../../src/deck/Build';
import { useSceneTime, interpolate, easeInOut, riseIn } from '../../../../src/scene';
import { abs, C, LANE, LANES, SVG, COLLAB, kick, small, mono, panel, Header, Chip, Note, CopyBox, LinkButton, Phone, Clapper, useClicks } from './shared';
import { SCRIPT_A, SCRIPT_B, CHECKS, CARD_D, CARD_E, A_CHARS } from './cards';

const fade = (t: number, at: number, d = 0.35) => interpolate(t, [at, at + d], [0, 1]);
const show = (on: boolean, delay = 0): CSSProperties => ({ opacity: on ? 1 : 0, transition: `opacity .5s ${delay}s` });

/* ═══════════════════ S16 — 말 없이 쓰는 대본 (build 5) ═══════════════════ */
export function SilentScriptSlide() {
  const c = useClicks(5);
  const X0 = 300;
  const PPS = 74;
  const rows: { key: 'see' | 'sound' | 'cap'; y: number }[] = [
    { key: 'see', y: 300 },
    { key: 'sound', y: 470 },
    { key: 'cap', y: 640 },
  ];
  return (
    <>
      <Header kicker="무대사형 대본 · 예시 B" title="말 없이 쓰는 대본" />
      <div style={{ ...abs(X0, 236, 20 * PPS, 40), borderBottom: `2px solid ${C.mute}` }}>
        {[0, 4, 10, 16, 20].map((s) => <div key={s} style={{ ...abs(s * PPS - 24, 0, 48), textAlign: 'center', ...mono, fontSize: 17, color: C.mute }}>{s}초</div>)}
      </div>
      {rows.map((r) => (
        <div key={r.key}>
          <div style={{ ...abs(120, r.y + 46, 160), fontSize: 30, fontWeight: 900 }}>
            <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: 4, background: LANE[r.key].color, marginRight: 10 }} />
            {LANE[r.key].ko}
          </div>
          {SCRIPT_B.map((b, i) => {
            const v = r.key === 'see' ? b.see : r.key === 'sound' ? b.sound : b.cap;
            const empty = r.key === 'cap' && !v;
            return (
              <div
                key={b.t0}
                style={{
                  ...abs(X0 + b.t0 * PPS + 3, r.y, (b.t1 - b.t0) * PPS - 6, 140),
                  borderRadius: 12,
                  boxSizing: 'border-box',
                  padding: '10px 12px',
                  fontSize: 18,
                  lineHeight: 1.4,
                  wordBreak: 'keep-all',
                  color: C.fg,
                  background: empty ? 'transparent' : `color-mix(in srgb, ${LANE[r.key].color} 18%, ${C.panel})`,
                  border: empty ? `2px dashed ${C.line}` : 'none',
                  borderLeft: empty ? undefined : `5px solid ${LANE[r.key].color}`,
                  ...show(c >= i + 1),
                }}
              >
                {empty ? (c >= 5 ? <Chip size={15} color={LANE.see.color}>화면이 말한다</Chip> : '') : v}
              </div>
            );
          })}
        </div>
      ))}
      <div style={{ ...abs(X0 + 10 * PPS, 448, 160), ...show(c >= 3, 0.3) }}><Chip size={16} strong color={LANE.sound.color}>정적 구간</Chip></div>
      <div style={{ ...abs(X0 + 16 * PPS, 448, 160), ...show(c >= 4, 0.3) }}><Chip size={16} strong color={LANE.sound.color}>음악 시작</Chip></div>
      {SCRIPT_B.map((b, i) => (
        <div key={b.beat} style={{ ...abs(X0 + b.t0 * PPS + 30, 240), fontSize: 18, fontWeight: 900, color: LANE.sound.color, ...show(c >= i + 1) }}>{b.beat}</div>
      ))}
      <div style={{ ...abs(120, 850, 1680), ...small, fontSize: 19 }}>정적 구간·음악이 바뀌는 지점도 대본에 적는다 — OpenMontage 시네마틱 대본(beat_map · silence_windows · music_turns)</div>
    </>
  );
}

/* ═══════════════════ S17 — 완성된 대본 한 장 (scene · 클릭 1) ═══════════════════ */
export function ScoreScene() {
  const t = useSceneTime();
  const c = useClicks(1);
  const X0 = 280;
  const PPS = 50;
  const laneY = (i: number) => 260 + i * 150;
  const play = 30 * interpolate(t, [0.4, 8.4], [0, 1]);
  const val = (k: (typeof LANES)[number], r: (typeof SCRIPT_A)[number]) => (k === 'say' ? r.say : k === 'see' ? r.see : k === 'cap' ? r.cap : r.beat === '핵심' ? '교실 소음 낮게 · 1초 정적' : r.beat === '되돌리기' ? '끝에 정적' : '교실 소음 낮게');
  return (
    <>
      <Header kicker="네 줄이 같은 박자에" title="완성된 대본 한 장" />
      {/* 비트 깃발 + 눈금 */}
      {SCRIPT_A.map((r) => (
        <div key={r.beat} style={{ ...abs(X0 + r.t0 * PPS + 4, 196), fontSize: 18, fontWeight: 900, color: LANE.say.color }}>{r.beat}</div>
      ))}
      {[0, 5, 10, 15, 20, 25, 30].map((s) => <div key={s} style={{ ...abs(X0 + s * PPS - 22, 226, 44), textAlign: 'center', ...mono, fontSize: 14, color: C.faint }}>{s}</div>)}
      {LANES.map((k, i) => (
        <div key={k}>
          <div style={{ ...abs(120, laneY(i) + 50, 140), fontSize: 28, fontWeight: 900 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: LANE[k].color, marginRight: 10 }} />
            {LANE[k].ko}
          </div>
          <div style={{ ...abs(X0, laneY(i) + 140, 1500, 2), background: C.line }} />
          {SCRIPT_A.map((r) => {
            const on = play >= r.t0 && play < r.t1;
            return (
              <div key={r.t0} style={{ ...abs(X0 + r.t0 * PPS + 2, laneY(i), (r.t1 - r.t0) * PPS - 4, 134), borderRadius: 10, boxSizing: 'border-box', padding: '6px 8px', fontSize: 13.5, lineHeight: 1.35, color: C.fg, wordBreak: 'keep-all', overflow: 'hidden', background: `color-mix(in srgb, ${LANE[k].color} ${on ? 42 : 14}%, ${C.panel})`, borderLeft: `4px solid ${LANE[k].color}` }}>
                {k === 'say' && <div style={{ ...mono, fontSize: 11.5, color: LANE.say.color, marginBottom: 2 }}>{r.voice}</div>}
                {val(k, r)}
              </div>
            );
          })}
        </div>
      ))}
      {/* 재생선 */}
      <div style={{ ...abs(X0 + play * PPS - 2, 250, 4, 610), background: C.coral, boxShadow: `0 0 12px ${C.coral}`, opacity: t > 0.4 ? 1 : 0 }} />
      <div style={{ ...abs(X0 + 1500 - 520, 880, 520), ...panel, padding: '14px 20px', ...show(c >= 1) }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>약 {A_CHARS}자 · 목표 30초 · 우리 반 기준으로 <span style={{ display: 'inline-block', width: 60, borderBottom: `3px solid ${LANE.say.color}` }} />초</div>
      </div>
    </>
  );
}

/* ═══════════════════ S18 — 다 쓴 대본, 스스로 채점하기 (static) ═══════════════════ */
export function ChecklistSlide() {
  return (
    <>
      <Header kicker="셀프 점검" title="다 쓴 대본, 스스로 채점하기" />
      <div style={{ ...abs(120, 200, 1140), ...panel, padding: '18px 26px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px 120px', fontSize: 17, fontWeight: 800, color: C.mute, padding: '4px 0 10px' }}>
          <span>항목 · 예시 A 채점</span><span>1 · 2 · 3 · 4 · 5</span><span>배운 장</span>
        </div>
        {CHECKS.map((k) => {
          const low = k.ex < 3;
          return (
            <div key={k.name} style={{ display: 'grid', gridTemplateColumns: '1fr 300px 120px', alignItems: 'center', padding: '12px 0', borderTop: `1px solid ${C.line}` }}>
              <div>
                <div style={{ fontSize: 25, fontWeight: 800, color: low ? C.coral : C.fg }}>{k.name}</div>
                {k.why && <div style={{ ...small, fontSize: 17, color: C.coral }}>{k.why}</div>}
              </div>
              <div style={{ display: 'flex', gap: 14 }}>
                {[1, 2, 3, 4, 5].map((n) => <span key={n} style={{ width: 34, height: 34, borderRadius: '50%', border: `2px solid ${low ? C.coral : LANE.see.color}`, background: n <= k.ex ? (low ? C.coral : LANE.see.color) : 'transparent' }} />)}
              </div>
              <Chip size={16}>{k.from}</Chip>
            </div>
          );
        })}
      </div>
      <div style={{ ...abs(1320, 220, 480), display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ ...panel, padding: '22px 24px', borderLeft: `8px solid ${C.coral}` }}>
          <div style={{ fontSize: 34, fontWeight: 900 }}>3점 미만 →</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>그 줄만 고친다</div>
          <div style={{ ...small, marginTop: 10 }}>전부 다시 쓰지 않는다</div>
        </div>
        <Note>예시 A는 '수증기'를 풀이하지 않아 2점 → 「물이 눈에 안 보이는 기체가 된 것」 한 마디를 더한다</Note>
        <div style={{ ...small, fontSize: 16, color: C.faint }}>출처: OpenMontage 대본 단계의 셀프 점검(1~5점, 3점 미만이면 고친 뒤 넘긴다)</div>
      </div>
    </>
  );
}

/* ═══════════════════ S19 — 조수에게 맡길 것, 맡기지 않을 것 (build 4) ═══════════════════ */
export function DelegateSlide() {
  return (
    <>
      <Header kicker="AI 조수와 대본" title="조수에게 맡길 것, 맡기지 않을 것" />
      <Build at={1} style={{ ...abs(120, 210, 980) }}>
        <div style={{ ...panel, padding: '22px 28px', borderTop: `8px solid ${LANE.see.color}` }}>
          <div style={{ fontSize: 30, fontWeight: 900 }}>맡길 것</div>
          {['점검표 채점', '훅 후보 여러 개', '글자 수 세기', '어색한 줄 찾기'].map((s) => <div key={s} style={{ fontSize: 26, fontWeight: 700, marginTop: 12 }}>✓ {s}</div>)}
        </div>
      </Build>
      <Build at={2} style={{ ...abs(1140, 210, 660) }}>
        <div style={{ ...panel, padding: '22px 28px', borderTop: `8px solid ${C.coral}` }}>
          <div style={{ fontSize: 30, fontWeight: 900 }}>맡기지 않을 것</div>
          {['통계·날짜·출처 만들기', '대본 통째로 다시 쓰기', '핵심 메시지 바꾸기'].map((s) => <div key={s} style={{ fontSize: 26, fontWeight: 700, marginTop: 12 }}>✕ {s}</div>)}
        </div>
      </Build>
      <Build at={3} style={{ ...abs(120, 600, 1100) }}>
        <div style={{ ...panel, padding: '20px 26px', position: 'relative' }}>
          <div style={kick}>조수가 쓴 문장</div>
          <div style={{ fontSize: 30, fontWeight: 800, marginTop: 8, wordBreak: 'keep-all' }}>“창문 김 때문에 매년 수천 건의 사고가 납니다.”</div>
          <div style={{ position: 'absolute', right: 24, top: -30, transform: 'rotate(-8deg)', padding: '8px 16px', border: `4px solid ${C.coral}`, borderRadius: 10, color: C.coral, fontSize: 26, fontWeight: 900, background: C.bg }}>확인 필요</div>
          <div style={{ ...small, marginTop: 10 }}>그럴듯하지만 근거가 없다 → 출처를 찾거나 지운다 (OpenMontage: 통계·날짜·출처를 지어내지 않는다)</div>
        </div>
      </Build>
      <Build at={4} style={{ ...abs(1280, 600, 520) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <img src={`${SVG}/rubber-stamp.svg`} alt="" aria-hidden style={{ width: 90 }} />
          <div>
            <div style={{ fontSize: 40, fontWeight: 900 }}>결정은 나</div>
            <div style={{ ...small }}>지난 시간: AI 초안 → 사람 승인</div>
          </div>
        </div>
      </Build>
    </>
  );
}

/* ═══════════════════ S20 — 조수에게 보내는 부탁 문장 (static) ═══════════════════ */
export function CardDSlide() {
  const X = 120;
  const Y = 190;
  const LH = 29.5;
  const lineY = (i: number) => Y + 68 + 16 + (i + 0.5) * LH;
  const notes = [
    { n: '①', s: '점검표로 채점', d: '3점 미만인 줄만 이유를 듣는다', line: 1 },
    { n: '②', s: '훅 후보 셋', d: '고르는 건 나', line: 3 },
    { n: '③', s: "사실엔 '확인 필요'만", d: '숫자·날짜·출처를 지어내지 못하게', line: 4 },
    { n: '④', s: '고칠 줄만', d: '통째로 다시 쓰지 않게', line: 5 },
  ];
  return (
    <>
      <Header kicker="카드 D · 복사해서 그대로 쓴다" title="조수에게 보내는 부탁 문장" />
      <CopyBox title="카드 D — 대본 조수에게" text={CARD_D} w={1500} size={19} style={{ ...abs(X, Y) }} />
      {notes.map((n) => (
        <div key={n.n + 'b'} style={{ ...abs(X + 1512, lineY(n.line) - 18, 40, 36), borderRadius: 999, background: C.coral, color: C.ink, display: 'grid', placeItems: 'center', fontSize: 20, fontWeight: 900 }}>{n.n}</div>
      ))}
      <div style={{ ...abs(X, 610, 1680), display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
        {notes.map((n) => (
          <div key={n.n} style={{ ...panel, padding: '14px 18px', borderLeft: `6px solid ${C.coral}` }}>
            <div style={{ fontSize: 24, fontWeight: 900 }}><span style={{ color: C.coral }}>{n.n}</span> {n.s}</div>
            <div style={{ ...small, fontSize: 18, marginTop: 4, color: C.fg }}>{n.d}</div>
          </div>
        ))}
      </div>
      <div style={{ ...abs(X, 780, 800) }}>
        <Chip size={20}>챗봇: 선생님이 정한 서비스</Chip>
      </div>
    </>
  );
}

/* ═══════════════════ S21 — 실습: 내 쇼츠 대본 쓰고 재기 (activity · 클릭 6) ═══════════════════ */
const STEPS = [
  { t: '형식과 길이 고르기', d: '나레이션형 / 무대사형 · 20초 또는 30초' },
  { t: '핵심 메시지 한 문장', d: '이게 안 나오면 아직 쓸 때가 아니다' },
  { t: '훅 두 개 → 짝이 고르기', d: '유형이 다르게 (반전·결과 약속·수수께끼·손해)' },
  { t: '비트 맵 → 줄별 네 칸', d: '말(또는 소리) · 화면 단서 · 자막 · 목소리 지시' },
  { t: '짝이 소리 내어 읽고 재기', d: '목표 ±10% 넘으면 덜어내기 (S12 순서)' },
  { t: '셀프 채점 → 조수 검토', d: '카드 D · 고친 줄에 표시' },
];
export function PracticeSlide() {
  const c = useClicks(6);
  return (
    <>
      <Header kicker="직접 해 보기 · 노트 공간에 기록" title="실습: 내 쇼츠 대본 쓰고 재기" />
      <div style={{ ...abs(120, 200, 800), display: 'flex', flexDirection: 'column', gap: 10 }}>
        {STEPS.map((s, i) => {
          const on = c === i + 1;
          const done = c > i + 1;
          return (
            <div key={s.t} style={{ display: 'flex', gap: 18, alignItems: 'center', padding: '13px 18px', borderRadius: 14, background: on ? C.panel2 : 'transparent', border: `3px solid ${on ? LANE.say.color : 'transparent'}`, opacity: c === 0 || on || done ? 1 : 0.5, transition: 'all .35s' }}>
              <div style={{ width: 54, height: 54, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', fontSize: 26, fontWeight: 900, background: done ? LANE.see.color : on ? LANE.say.color : C.panel, color: done || on ? C.ink : C.fg }}>{done ? '✓' : i + 1}</div>
              <div>
                <div style={{ fontSize: 27, fontWeight: 900 }}>{s.t}</div>
                <div style={{ ...small, fontSize: 18 }}>{s.d}</div>
              </div>
            </div>
          );
        })}
      </div>
      <CopyBox title="카드 E — 대본 양식" text={CARD_E} w={860} size={18} style={{ ...abs(960, 200) }} />
      <div style={{ ...abs(960, 640, 860), display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        <LinkButton href={COLLAB}>노트 공간 열기 ↗</LinkButton>
        <Chip size={20}>챗봇: 선생님이 정한 서비스</Chip>
      </div>
      <div style={{ ...abs(960, 730, 860), display: 'flex', gap: 18, alignItems: 'center' }}>
        <div style={{ width: 86, height: 86, borderRadius: '50%', border: `5px solid ${LANE.see.color}`, display: 'grid', placeItems: 'center', ...mono, fontSize: 22, fontWeight: 800 }}>⏱</div>
        <div style={{ fontSize: 26, fontWeight: 800 }}>우리 반 기준: 1초에 <span style={{ display: 'inline-block', width: 60, borderBottom: `3px solid ${LANE.say.color}` }} />자</div>
      </div>
      <div style={{ ...abs(960, 860, 860) }}>
        <Note>오늘 다 못 끝내도 핵심 메시지 · 훅 · 비트 맵까지는 남긴다 — 다음 시간 장면 카드의 재료</Note>
      </div>
    </>
  );
}

/* ═══════════════════ S22 — 대본의 한 줄이 장면 하나가 된다 (scene) ═══════════════════ */
const PH = 700;
const PW = (PH * 9) / 16;
export function MirrorScene() {
  const t = useSceneTime();
  const step = (k: number) => easeInOut(interpolate(t, [0.4 + k * 0.6, 0.7 + k * 0.6], [0, 1]));
  const pos = step(0) + step(1);
  const fly = easeInOut(interpolate(t, [2.4, 3.4], [0, 1]));
  const chalk = interpolate(t, [3.4, 4.2], [0, 1]);
  const line = SCRIPT_A[0].say;
  const from = { x: 1300, y: 420 };
  const to = { x: 240, y: 660 };
  const frames = [
    <div key="0" style={{ position: 'absolute', inset: 0, background: '#33394f', display: 'grid', placeItems: 'center', color: C.mute, fontSize: 24, fontWeight: 800 }}>다른 쇼츠</div>,
    <div key="1" style={{ position: 'absolute', inset: 0, background: '#2a2f42', display: 'grid', placeItems: 'center', color: C.mute, fontSize: 24, fontWeight: 800 }}>다른 쇼츠</div>,
    <div key="2" style={{ position: 'absolute', inset: 18, border: `4px dashed ${LANE.say.color}`, borderRadius: 18, display: 'grid', placeItems: 'center', textAlign: 'center', color: C.fg, fontSize: 30, fontWeight: 900 }}>내 쇼츠<br />— 첫 프레임</div>,
  ];
  const flow = ['핵심 메시지', '훅', '비트 맵', '줄별 네 칸', '재기', '점검'];
  return (
    <>
      <Header kicker="오늘 정리" title="대본의 한 줄이 장면 하나가 된다" />
      <div style={{ ...abs(120, 220, 1000), display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', ...riseIn(t, 0.2) }}>
        {flow.map((s, i) => (
          <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            {i > 0 && <span style={{ color: C.faint, fontSize: 22 }}>→</span>}
            <Chip size={21} color={LANE.say.color}>{s}</Chip>
          </span>
        ))}
      </div>
      <Phone h={PH} style={{ ...abs(1300, 170) }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: PW, height: PH * 3, transform: `translateY(${-pos * PH}px)` }}>
          {frames.map((f, i) => <div key={i} style={{ position: 'absolute', left: 0, top: i * PH, width: PW, height: PH }}>{f}</div>)}
        </div>
      </Phone>
      {/* 날아가는 대본 한 줄 */}
      <div style={{ ...abs(from.x + (to.x - from.x) * fly, from.y + (to.y - from.y) * fly, 380), padding: '10px 14px', borderRadius: 10, background: LANE.say.color, color: C.ink, fontSize: 20, fontWeight: 800, opacity: t > 2.3 && t < 3.5 ? 1 : 0, wordBreak: 'keep-all' }}>{line}</div>
      {/* 밝은 판 위 클래퍼보드 */}
      <div style={{ ...abs(120, 380, 760, 520), borderRadius: 22, background: C.paper, opacity: fade(t, 1.2) }} />
      <div style={{ opacity: fade(t, 1.2) }}>
        <Clapper x={190} y={410} w={620} angle={interpolate(t, [3.0, 3.3], [-22, 0])}>
          <span style={{ position: 'absolute', left: 64, top: 118, color: C.paper, fontSize: 40, fontWeight: 900, whiteSpace: 'nowrap', clipPath: `inset(0 ${(1 - chalk) * 100}% 0 0)` }}>장면 1</span>
          <span style={{ position: 'absolute', left: 238, top: 118, color: C.paper, fontSize: 40, fontWeight: 900, whiteSpace: 'nowrap', clipPath: `inset(0 ${(1 - chalk) * 100}% 0 0)` }}>숏 1</span>
          <span style={{ position: 'absolute', left: 50, top: 250, width: 520, color: C.paper, fontSize: 28, fontWeight: 800, lineHeight: 1.35, wordBreak: 'keep-all', clipPath: `inset(0 ${(1 - chalk) * 100}% 0 0)` }}>{line}</span>
        </Clapper>
      </div>
      <div style={{ ...abs(940, 600, 320), display: 'flex', flexDirection: 'column', gap: 12, opacity: fade(t, 4.2) }}>
        <Chip size={21} color={LANE.say.color}>대본 역</Chip>
        <div style={{ fontSize: 30, color: C.mute, paddingLeft: 30 }}>↓</div>
        <Chip size={21} color={LANE.see.color}>장면 계획 역</Chip>
        <div style={{ ...small, fontSize: 17, marginTop: 6 }}>다음 시간: 비트를 장면 카드로 · 숏 여러 개 잇기</div>
      </div>
    </>
  );
}

