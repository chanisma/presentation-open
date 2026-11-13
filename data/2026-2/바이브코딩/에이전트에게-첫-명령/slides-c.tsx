import type { CSSProperties } from 'react';
import Build from '../../../../src/deck/Build';
import { useDeck } from '../../../../src/deck/DeckContext';
import { useSceneTime, interpolate, spring, riseIn, easeInOut } from '../../../../src/scene';
import { abs, C, kick, h2, body, small, mono, card, solid, Code, CodeBlock, Header, Key } from './shared';

/* ═══════════════════ S16 — 두 개의 모래시계 (scene) ═══════════════════ */
/* 유리구 기하 — hourglass-pair.svg와 같은 덱 좌표. 모래는 덱이 채운다 */
const SMALL = { top: 'M246 358 Q 252 470 339 597 L361 597 Q 448 470 454 358 Z', bot: 'M339 603 Q 252 730 246 842 L454 842 Q 448 730 361 603 Z', y0: 358, neck: 600, y1: 842, cx: 350 };
const BIG = { top: 'M627 190 Q 642 380 775 547 L805 547 Q 938 380 953 190 Z', bot: 'M775 553 Q 642 720 627 900 L953 900 Q 938 720 805 553 Z', y0: 190, neck: 550, y1: 900, cx: 790 };
const CHIPS = ['Luna', 'Terra', 'Sol', 'Astra'];
export function HourglassScene() {
  const t = useSceneTime();
  const FLIP = 2.4;
  const ASTRA = 3.6;
  const boost = 2.2;
  // 작은 모래시계: 0~2.4 비움 → 2.4~2.8 다시 채움 → 다시 비움(Astra 이후 가속)
  let fs: number;
  let refilling = false;
  if (t < FLIP) fs = 1 - t / FLIP;
  else if (t < FLIP + 0.4) { fs = (t - FLIP) / 0.4; refilling = true; }
  else {
    const drained = (Math.min(t, ASTRA) - (FLIP + 0.4)) / 2.6 + Math.max(0, t - ASTRA) * (boost / 2.6);
    fs = Math.max(0, 1 - drained);
  }
  const fb = Math.max(0, 1 - (Math.min(t, ASTRA) / 14 + Math.max(0, t - ASTRA) * (boost / 14)));
  const Sand = ({ g, f, color, id }: { g: typeof SMALL; f: number; color: string; id: string }) => {
    const topY = g.y0 + (1 - f) * (g.neck - g.y0);
    const botY = g.y1 - (1 - f) * (g.y1 - g.neck);
    const falling = f > 0.02 && f < 0.98;
    return (
      <g>
        <clipPath id={`${id}-t`}><rect x={g.cx - 200} y={topY} width={400} height={g.neck - topY} /></clipPath>
        <clipPath id={`${id}-b`}><rect x={g.cx - 200} y={botY} width={400} height={g.y1 - botY + 2} /></clipPath>
        <path d={g.top} fill={color} clipPath={`url(#${id}-t)`} opacity={0.85} />
        <path d={g.bot} fill={color} clipPath={`url(#${id}-b)`} opacity={0.85} />
        {falling && <rect x={g.cx - 3} y={g.neck - 2} width={6} height={botY - g.neck + 4} fill={color} opacity={0.7} />}
      </g>
    );
  };
  return (
    <>
      <svg style={{ ...abs(160, 140, 920, 800) }} viewBox="160 140 920 800" aria-hidden>
        <Sand g={BIG} f={fb} color={C.sky} id="s16-big" />
        <Sand g={SMALL} f={refilling ? fs : fs} color={C.mint} id="s16-small" />
      </svg>
      <img src="assets/svg/hourglass-pair.svg" alt="" aria-hidden style={{ ...abs(160, 140, 920, 800), opacity: interpolate(t, [0, 0.4], [0, 1]) }} />
      <div style={{ ...abs(200, 880, 320), ...mono, fontSize: 19, fontWeight: 700, color: C.mint, textAlign: 'center' }}>5시간 창</div>
      <div style={{ ...abs(640, 940, 320), ...mono, fontSize: 19, fontWeight: 700, color: C.sky, textAlign: 'center' }}>주간 한도</div>
      {t >= FLIP && <div style={{ ...abs(30, 470, 196), ...riseIn(t, FLIP, 0.4, 10), padding: '8px 12px', borderRadius: 10, background: C.navy, border: `2px solid ${C.mint}`, color: C.mint, fontWeight: 800, fontSize: 17, textAlign: 'center', zIndex: 3 }}>5시간 창 리셋<br /><span style={{ fontWeight: 500, fontSize: 14 }}>다시 채워진다</span></div>}
      {t >= FLIP + 0.2 && <div style={{ ...abs(980, 560, 200), ...riseIn(t, FLIP + 0.2, 0.4, 10), padding: '8px 14px', borderRadius: 10, background: C.navy, border: `2px solid ${C.sky}`, color: C.sky, fontWeight: 800, fontSize: 18, textAlign: 'center' }}>주간은<br />계속 줄어든다</div>}
      {/* 모델 칩 — Astra가 켜지면 두 모래가 빨라진다 */}
      <div style={{ ...abs(1180, 130, 620), display: 'flex', gap: 12, alignItems: 'center', opacity: interpolate(t, [ASTRA - 0.3, ASTRA], [0, 1]) }}>
        {CHIPS.map((m) => {
          const hot = m === 'Astra';
          return <span key={m} style={{ ...mono, fontSize: 18, fontWeight: 800, padding: '6px 16px', borderRadius: 999, border: `2px solid ${hot ? C.amber : 'var(--hair)'}`, color: hot ? C.amber : 'var(--fg-muted)', boxShadow: hot ? `0 0 18px ${C.amber}` : 'none' }}>{m}</span>;
        })}
        <span style={{ ...small, fontSize: 17, color: C.amber }}>→ 둘 다 빨리 떨어진다</span>
      </div>
      <div style={{ ...abs(1180, 230, 620) }}>
        <div style={kick}>사용량 한도</div>
        <h2 style={{ ...h2, marginTop: 8 }}>모래시계는 <span style={{ color: C.mint }}>둘</span>이다</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 24 }}>
          {[
            ['5시간 창', '첫 메시지부터 5시간 동안 쓸 수 있는 양. 다 쓰면 잠시 멈추고, 창이 지나면 다시 채워진다', C.mint, 0.4],
            ['주간 한도', '일주일 동안 쓸 수 있는 총량. 5시간 창이 다시 채워져도 이건 계속 줄어든다', C.sky, 1.2],
            ['리셋 시각', '/status가 알려 준다 — 요일을 외우지 말고 화면을 본다', 'var(--fg)', 2.8],
            ['토큰 기준', '2026년 4월부터 메시지 수가 아니라 처리한 글자 양 기준 — 긴 요청·긴 파일이 더 많이 쓴다', 'var(--fg)', 4.4],
          ].map(([k, v, col, at]) => (
            <div key={k as string} style={{ ...card, padding: '12px 18px', ...riseIn(t, at as number, 0.6, 12) }}>
              <b style={{ color: col as string, fontSize: 20 }}>{k as string}</b>
              <div style={{ ...small, fontSize: 17, marginTop: 4 }}>{v as string}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...abs(1180, 960, 620), ...small, fontSize: 17, color: C.amber, ...riseIn(t, ASTRA + 0.6, 0.6, 10) }}>필요할 때만 Astra로 올리고, 평소엔 Sol·Terra.</div>
    </>
  );
}

/* ═══════════════════ S17 — 주문서: 프롬프트의 재료 (build 6) ═══════════════════ */
export const ORDER = [
  ['목적', '나를 처음 보는 친구가 30초 안에 내가 어떤 사람인지 알게 하는 한 장짜리 소개 페이지'],
  ['대상', '우리 반 친구들'],
  ['기능', '1) 이름과 한 줄 소개 2) 좋아하는 것 세 가지 목록 3) "더 보기" 버튼을 누르면 숨겨진 한 문장이 나타난다'],
  ['화면', '한 화면, 어두운 남색 배경에 밝은 글자, 제목은 위 가운데'],
  ['제약', 'index.html 파일 하나만, 외부 라이브러리 없이, 한국어, 휴대폰에서도 보이게'],
  ['완료 기준', '브라우저에서 열면 이름과 목록이 보이고, 버튼을 누르면 문장이 나타난다'],
];
const ORDER_HINT = ['왜 만드는가 — 가장 중요. 목적을 알면 세부는 에이전트가 맞춘다', '누가 쓰는가', '3개 이내 · 우선순위 순서', '한 화면인지 · 색·느낌 한 줄', '파일 하나 · 외부 라이브러리 없이 · 한국어', '열면 ○○가 보이고, 누르면 □□가 된다'];
export function OrderFormSlide() {
  const { clicks } = useDeck();
  const c = Math.min(clicks, 9);
  return (
    <>
      <Header x={120} y={80} w={600} kicker="프롬프트의 재료" title="주문서를 채운다" />
      <div style={{ ...abs(120, 280, 560) }}>
        <div style={{ ...card, padding: '18px 22px', fontSize: 24, fontWeight: 700, color: 'var(--fg-faint)', textDecoration: c >= 6 ? `line-through ${C.rose}` : 'none', textDecorationThickness: 3 }}>"자기소개 페이지 만들어줘"</div>
        <div style={{ ...small, marginTop: 10 }}>이렇게만 시키면 에이전트도 대충 만든다</div>
        <div style={{ ...kick, marginTop: 44 }}>설명하는 방식</div>
        {['짧은 문장으로 한 줄에 하나씩', '"멋지게" 대신 눈으로 확인할 수 있는 말 — "제목은 위 가운데, 배경은 어두운 남색"', '순서가 있으면 번호'].map((s, i) => (
          <div key={i} style={{ ...body, fontSize: 20, marginTop: 12, paddingLeft: 18, borderLeft: `3px solid ${C.mint}`, wordBreak: 'keep-all' }}>{s}</div>
        ))}
      </div>
      {/* 주문서 */}
      <div style={{ ...abs(760, 150, 1040, 860), ...solid, background: 'color-mix(in srgb, var(--fg) 5%, var(--bg))', padding: '30px 36px', borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '2px solid var(--hair)', paddingBottom: 12 }}>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '0.08em' }}>주 문 서</div>
          <div style={{ ...mono, fontSize: 15, color: 'var(--fg-faint)' }}>프롬프트 · 실습(19장)에서 그대로 쓴다</div>
        </div>
        {ORDER.map(([k, v], i) => {
          const on = c >= i + 1;
          return (
            <div key={k} style={{ display: 'flex', gap: 18, padding: '14px 0', borderBottom: '1px dashed var(--hair)', minHeight: 100 }}>
              <div style={{ width: 130, flexShrink: 0 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: on ? C.mint : 'var(--fg-muted)' }}>{k}</div>
                <div style={{ ...small, fontSize: 13, color: 'var(--fg-faint)', marginTop: 2 }}>{ORDER_HINT[i]}</div>
              </div>
              <div style={{ flex: 1, fontSize: 21, lineHeight: 1.45, color: 'var(--fg)', wordBreak: 'keep-all', borderRadius: 8, padding: '4px 10px', boxShadow: on && i === 0 ? `0 0 0 3px ${C.mint}` : 'none', transition: 'box-shadow .5s' }}>
                {on ? v : <span style={{ color: 'var(--hair)' }}>· · · · · · · · · · · · · · · · · · · · · · · · · ·</span>}
              </div>
            </div>
          );
        })}
      </div>
      {ORDER.map((_, i) => <Build key={i} at={i + 1} style={{ ...abs(0, 0, 1, 1), opacity: 0 }}><span /></Build>)}
    </>
  );
}

/* ═══════════════════ S18 — 색 견본: 예시를 주면 정확해진다 (scene) ═══════════════════ */
const SAMPLE = 'hsl(215 75% 52%)';
const SAMPLES3 = ['hsl(222 60% 16%)', 'hsl(205 90% 78%)', 'hsl(160 70% 60%)'];
const SCATTER = ['hsl(200 80% 70%)', 'hsl(232 55% 28%)', 'hsl(176 60% 45%)'];
const NEAR = ['hsl(215 70% 56%)', 'hsl(213 78% 48%)', 'hsl(218 72% 54%)'];
function mixHsl(a: string, b: string, p: number) {
  const pa = a.match(/[\d.]+/g)!.map(Number), pb = b.match(/[\d.]+/g)!.map(Number);
  return `hsl(${pa[0] + (pb[0] - pa[0]) * p} ${pa[1] + (pb[1] - pa[1]) * p}% ${pa[2] + (pb[2] - pa[2]) * p}%)`;
}
export function SwatchScene() {
  const t = useSceneTime();
  const rows = [
    { y: 250, label: 'zero-shot', samples: [] as string[], at: 0.5, results: SCATTER, desc: '예시 0개 — 결과가 제각각' },
    { y: 480, label: 'one-shot', samples: [SAMPLE], at: 1.7, results: NEAR, desc: '예시 1개 — 견본 쪽으로 모인다' },
    { y: 710, label: 'few-shot', samples: SAMPLES3, at: 3.0, results: SAMPLES3, desc: '예시 3개 — 배경·제목·버튼이 그대로' },
  ];
  const Sw = ({ x, y, size, color, style }: { x: number; y: number; size: number; color: string; style?: CSSProperties }) => (
    <div style={{ ...abs(x, y, size, size), borderRadius: 14, background: color, border: '2px solid rgba(255,255,255,0.18)', boxShadow: 'var(--shadow)', ...style }} />
  );
  return (
    <>
      <Header x={120} y={70} w={900} kicker="예시가 있으면 정확해진다" title="견본을 건네라" />
      {rows.map((r, ri) => {
        const s = spring(t, r.at, 0.6);
        const conv = ri === 1 ? interpolate(t, [r.at + 0.3, r.at + 1.1], [0, 1], easeInOut) : 1;
        const labelOn = t >= 3.8 + ri * 0.25;
        return (
          <div key={r.label}>
            {/* 요청 카드 */}
            <div style={{ ...abs(120, r.y, 560, 170), ...card, padding: '18px 22px', opacity: Math.min(1, s * 1.5), transform: `translateY(${(1 - s) * 14}px)` }}>
              <div style={kick}>요청 {ri + 1}</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>"파란 느낌으로 만들어 줘"</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center', minHeight: 40 }}>
                {r.samples.length === 0 ? <span style={{ ...small, fontSize: 16, color: 'var(--fg-faint)' }}>견본 없음</span> : <span style={{ ...small, fontSize: 16 }}>견본</span>}
                {r.samples.map((c, i) => <span key={i} style={{ width: 38, height: 38, borderRadius: 8, background: c, border: '2px solid rgba(255,255,255,0.3)', display: 'inline-block' }} />)}
              </div>
            </div>
            <svg style={{ ...abs(690, r.y + 70, 190, 40) }} viewBox="0 0 190 40" aria-hidden>
              <path d="M6 20 H160" stroke="var(--hair)" strokeWidth={4} strokeLinecap="round" strokeDasharray={160} strokeDashoffset={160 * (1 - Math.min(1, s))} />
              {s > 0.9 && <path d="M150 8 L172 20 L150 32" fill="none" stroke="var(--hair)" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />}
            </svg>
            {/* 결과 스와치 3장 */}
            {r.results.map((col, i) => {
              const color = ri === 1 ? mixHsl(SCATTER[i], col, conv) : col;
              const jitter = ri === 0 ? [(i - 1) * 16, i === 1 ? -18 : 12][0] : 0;
              const jy = ri === 0 ? (i === 1 ? -18 : 12) : 0;
              return (
                <div key={i}>
                  <Sw x={900 + i * 180} y={r.y + 10 + jy} size={150} color={color} style={{ opacity: Math.min(1, s * 1.5), transform: `translateX(${jitter}px) scale(${0.85 + 0.15 * s})` }} />
                  {ri === 2 && t >= 3.6 + i * 0.15 && <div style={{ ...abs(1010 + i * 180, r.y + 8), fontSize: 30, fontWeight: 900, color: C.mint }}>✓</div>}
                </div>
              );
            })}
            <div style={{ ...abs(900, r.y + 176, 540), ...small, fontSize: 17, opacity: Math.min(1, s * 1.5) }}>{r.desc}</div>
            {/* 정식 용어 라벨 */}
            <div style={{ ...abs(1500, r.y + 40, 300), ...mono, fontSize: 30, fontWeight: 800, color: C.mint, opacity: labelOn ? 1 : 0, transform: labelOn ? 'none' : 'translateX(12px)', transition: 'all .4s' }}>{r.label}</div>
            <div style={{ ...abs(1500, r.y + 84, 300), ...small, fontSize: 16, opacity: labelOn ? 1 : 0, transition: 'opacity .4s' }}>{ri === 0 ? '예시 없이' : ri === 1 ? '예시 하나' : '예시 여럿'}</div>
          </div>
        );
      })}
      <div style={{ ...abs(120, 940, 1680), display: 'flex', gap: 14, alignItems: 'center', opacity: interpolate(t, [4.4, 5.0], [0, 1]) }}>
        <span style={{ ...kick, marginRight: 6 }}>프로그램에서의 견본</span>
        {['"이 사이트의 카드 모양처럼" — 설명 한 줄', '원하는 문장 예시 하나', '표라면 예시 행 하나'].map((s) => <span key={s} style={{ ...solid, padding: '10px 18px', fontSize: 19, fontWeight: 700, borderRadius: 999 }}>{s}</span>)}
        <span style={{ ...small, fontSize: 18, marginLeft: 8 }}>목적 + 예시 = "왜"와 "어떻게"를 둘 다 안다</span>
      </div>
    </>
  );
}

/* ═══════════════════ S19 — 실습: 나의 첫 웹 페이지 (static) ═══════════════════ */
export function PracticeSlide() {
  const lines = ORDER.map(([k, v]) => `${k}: ${v}`);
  return (
    <>
      <div style={{ ...abs(120, 70, 1200) }}>
        <div style={kick}>실습</div>
        <h2 style={{ ...h2, marginTop: 8 }}>나의 첫 웹 페이지</h2>
      </div>
      <div style={{ ...abs(1180, 90, 620), display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <Code size={19} color={C.amber}>codex --yolo</Code><Code size={19}>vibe 폴더</Code><Code size={19}>모델 Sol</Code>
      </div>
      <div style={{ ...abs(120, 220, 1000) }}>
        <div style={{ ...kick, marginBottom: 10 }}>예시 프롬프트 — 그대로 써도, 칸을 내 것으로 바꿔도 된다 (드래그해 복사)</div>
        <CodeBlock lines={lines} size={24} keys={ORDER.map(([k]) => k)} />
        <div style={{ ...small, fontSize: 18, marginTop: 14 }}>실습 시간은 교사가 현장에서 정한다. 시작 전 <Code size={17}>/status</Code>로 모델이 Sol인지 확인.</div>
        <div style={{ ...card, padding: '18px 22px', marginTop: 24, borderColor: C.amber }}>
          <div style={{ ...kick, color: C.amber }}>막히면</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, wordBreak: 'keep-all' }}>오류 메시지를 <span style={{ color: C.amber }}>그대로 복사해</span> 에이전트에게 붙여넣는다 — <span style={{ ...mono, fontSize: 18, color: 'var(--fg-muted)', fontWeight: 500 }}>"이 오류가 나. 고쳐 줘: (붙여넣기)"</span></div>
        </div>
      </div>
      <div style={{ ...abs(1180, 220, 620) }}>
        <div style={{ ...kick, marginBottom: 12 }}>조건 셋 — 주제는 자유</div>
        {['파일 하나 — index.html', '열면 제목·소개 문장·버튼 하나가 보인다', '버튼을 누르면 화면의 무언가가 바뀐다'].map((cnd, i) => (
          <div key={i} style={{ ...solid, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'center', marginBottom: 12, borderColor: C.mint }}>
            <span style={{ width: 34, height: 34, borderRadius: 8, border: `3px solid ${C.mint}`, display: 'grid', placeItems: 'center', color: C.mint, fontWeight: 900, fontSize: 22, flexShrink: 0 }}>{i + 1}</span>
            <span style={{ fontSize: 22, fontWeight: 700, wordBreak: 'keep-all' }}>{cnd}</span>
          </div>
        ))}
        <div style={{ ...kick, margin: '26px 0 12px' }}>주제 예시</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {['자기소개 한 장', '내 문제 후보를 소개하는 한 장', '내가 좋아하는 것 소개'].map((s) => <span key={s} style={{ ...card, padding: '10px 18px', fontSize: 19, fontWeight: 700, borderRadius: 999 }}>{s}</span>)}
        </div>
        <div style={{ ...kick, margin: '26px 0 12px' }}>끝나면</div>
        <div style={{ ...body, fontSize: 20 }}>탐색기에서 index.html을 더블클릭해 브라우저로 연다 — 다음 장에서 여는 법과 고치는 법.</div>
      </div>
    </>
  );
}

/* ═══════════════════ S21 — 자주 하는 실수 다섯 (build 5) ═══════════════════ */
const MISTAKES = [
  { w: 700, t: '바탕화면이나 문서 루트에서 codex --yolo를 켰다', fix: 'vibe 폴더 안에서만 (11장)' },
  { w: 760, t: '폴더나 파일 이름에 한글·공백을 썼다', fix: '영문 소문자, 하이픈 — my-page' },
  { w: 720, t: '한 번에 열 가지를 시켰다', fix: '기능 3개 이내, 되면 다음 요청' },
  { w: 840, t: '오류 메시지를 안 읽고 "다시 해 줘"만 반복했다', fix: '오류를 그대로 붙여넣기', big: true },
  { w: 740, t: '사용량이 바닥났다', fix: '/status 확인 → 모델을 Terra·Luna로 내리고 요청을 짧게' },
];
export function MistakesSlide() {
  return (
    <>
      <Header x={1020} y={80} w={800} align="right" kicker="자주 하는 실수" title="다섯 가지, 한 줄씩" />
      <div style={{ ...abs(120, 100, 800), ...small }}>방금 실습에서 겪은 일이 아마 이 중에 있다</div>
      {MISTAKES.map((m, i) => {
        const y = 220 + i * 150;
        return (
          <Build key={i} at={i + 1} style={{ ...abs(120, y, 1680, 130) }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              <div style={{ width: m.w, ...solid, padding: m.big ? '20px 26px' : '16px 24px', borderColor: m.big ? C.amber : 'var(--hair)', display: 'flex', gap: 16, alignItems: 'center' }}>
                <span style={{ ...mono, fontSize: 26, fontWeight: 800, color: m.big ? C.amber : C.mint }}>{i + 1}</span>
                <span style={{ fontSize: m.big ? 26 : 23, fontWeight: 800, wordBreak: 'keep-all' }}>{m.t}</span>
              </div>
              <div style={{ flex: 1, height: 3, background: `linear-gradient(90deg, ${m.big ? C.amber : C.mint}, transparent)`, marginLeft: -2 }} />
              <div style={{ width: 520, fontSize: 22, fontWeight: 700, color: m.big ? C.amber : C.mint, wordBreak: 'keep-all', paddingLeft: 12 }}>→ {m.fix}</div>
            </div>
          </Build>
        );
      })}
      <div style={{ ...abs(120, 980, 1680), ...small, fontSize: 18, textAlign: 'center' }}>네 번째가 제일 많다 — 오류 메시지는 내가 읽으라고 있는 게 아니라 에이전트에게 주라고 있는 것</div>
    </>
  );
}

/* ═══════════════════ S22 — 명령 히스토리 되감기 (scene) ═══════════════════ */
const HISTORY = [
  ['powershell -ExecutionPolicy ByPass -c "irm https://chatgpt.com/codex/install.ps1 | iex"', 'S8'],
  ['codex --version', 'S8'],
  ['codex --yolo', 'S12'],
  ['이 폴더에 hello.txt 파일을 만들고 "안녕, 에이전트"라고 적어 줘', 'S12'],
  ['/model → gpt-5.6-sol', 'S15'],
  ['목적: 나를 처음 보는 친구가 30초 안에 …  (주문서 여섯 줄)', 'S19'],
  ['start index.html', 'S20'],
];
export function HistoryScene() {
  const t = useSceneTime();
  const scroll = interpolate(t, [0, 3.6], [380, 0], easeInOut);
  const cursorOn = (t * 2) % 1 < 0.55;
  return (
    <>
      <div style={{ ...abs(120, 110, 1680, 690), ...solid, overflow: 'hidden', borderColor: C.mint }}>
        <div style={{ height: 42, display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px', background: 'color-mix(in srgb, var(--fg) 7%, var(--bg))', borderBottom: '1px solid var(--hair-2)', ...mono, fontSize: 15, color: 'var(--fg-faint)' }}>
          <i style={{ width: 10, height: 10, borderRadius: 5, background: 'var(--hair)' }} /> PowerShell — vibe · 오늘의 히스토리
        </div>
        <div style={{ position: 'absolute', left: 30, right: 30, top: 60 + scroll, ...mono, fontSize: 22, lineHeight: 2.0 }}>
          {HISTORY.map(([cmd, tag], i) => {
            const on = interpolate(t, [0.3 + i * 0.45, 0.8 + i * 0.45], [0, 1]);
            return (
              <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'baseline', opacity: 0.25 + 0.75 * on, color: on > 0.9 ? 'var(--fg)' : 'var(--fg-muted)' }}>
                <span style={{ color: C.mint, fontWeight: 800, width: 28, flexShrink: 0 }}>{on > 0.9 ? '✓' : ' '}</span>
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cmd}</span>
                <span style={{ fontSize: 15, color: 'var(--fg-faint)', flexShrink: 0 }}>{tag}</span>
              </div>
            );
          })}
          {t >= 4.0 && (
            <div style={{ display: 'flex', gap: 16, alignItems: 'baseline', marginTop: 16, ...riseIn(t, 4.0, 0.4, 8) }}>
              <span style={{ color: C.mint, fontWeight: 800, width: 28 }}>›</span>
              <span style={{ color: 'var(--fg-faint)' }}>다음 시간: 기획 문서를 써 줘…</span>
              <span style={{ display: 'inline-block', width: 13, height: 26, background: cursorOn ? C.mint : 'transparent', verticalAlign: '-4px' }} />
            </div>
          )}
        </div>
      </div>
      {t >= 4.6 && (
        <div style={{ ...abs(1180, 570, 580), ...card, padding: '18px 22px', zIndex: 3, background: 'color-mix(in srgb, var(--fg) 8%, var(--bg))', ...riseIn(t, 4.6, 0.6, 12) }}>
          <div style={kick}>다음 시간 · 정거장 3</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6, wordBreak: 'keep-all' }}>같은 vibe 폴더에서 AI와 프로젝트 기획 문서 작성</div>
          <div style={{ ...small, fontSize: 17, marginTop: 8 }}>지난 시간 collab에 남긴 문제 후보를 가져온다</div>
          <div style={{ ...small, fontSize: 17, marginTop: 8 }}>준비물 — vibe 폴더 그대로 · ChatGPT 계정 로그인 유지</div>
        </div>
      )}
      <div style={{ ...abs(120, 850, 1680), textAlign: 'center', fontSize: 46, fontWeight: 900, letterSpacing: '-0.02em', ...riseIn(t, 5.0, 0.7, 16) }}>
        설치는 한 번, <span style={{ color: C.mint }}>명령은 매일.</span>
      </div>
    </>
  );
}

export { Key };
