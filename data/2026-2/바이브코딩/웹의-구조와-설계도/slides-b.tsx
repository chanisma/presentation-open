import Build from '../../../../src/deck/Build';
import { useDeck } from '../../../../src/deck/DeckContext';
import { useSceneTime, interpolate, spring, riseIn, easeInOut, easeOut } from '../../../../src/scene';
import { abs, C, kick, h3, small, mono, solid, Header, Term, Chip, Pet, Hearts, MiniMap } from './shared';
import { WebMap } from './slides-a';
import { PROMPT_LINES, SECTIONS } from './prompt';

/* ═══════════════════ S10 — 정하지 않은 것은, 에이전트가 추측한다 (scene · 빈칸 주사위 · wordcloud) ═══════════════════ */
const ROWS10 = [
  { k: '사용자', guess: '혼자', mine: '우리 반 친구들' },
  { k: '기능', guess: '밥 주기만', mine: '밥 · 놀이 · 코인' },
  { k: '화면', guess: '1개', mine: '3개' },
  { k: '저장', guess: '저장 안 함', mine: '서버 DB' },
  { k: '배포', guess: '안 함', mine: '필요' },
];
function Die({ rot, size = 46 }: { rot: number; size?: number }) {
  const pips = [[0.5, 0.5], [0.25, 0.25], [0.75, 0.75], [0.25, 0.75], [0.75, 0.25]];
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" style={{ transform: `rotate(${rot}deg)` }} aria-hidden>
      <rect x="3" y="3" width="40" height="40" rx="9" fill={C.paper} stroke={C.deep} strokeWidth="2.4" />
      {pips.map(([x, y], i) => <circle key={i} cx={3 + 40 * x} cy={3 + 40 * y} r="3.6" fill={C.deep} />)}
    </svg>
  );
}
function FormCard({ x, title, accent, children, style }: { x: number; title: React.ReactNode; accent: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ ...abs(x, 215, 660, 700), ...solid, padding: '26px 34px', borderColor: `color-mix(in srgb, ${accent} 45%, transparent)`, ...style }}>
      <div style={{ ...mono, fontSize: 25, fontWeight: 800, color: accent, paddingBottom: 18, borderBottom: '1px solid var(--hair-2)' }}>{title}</div>
      {children}
    </div>
  );
}
export function DiceScene() {
  const t = useSceneTime();
  const slide = spring(t, 3.0, 0.8);
  const diff = interpolate(t, [3.7, 4.1], [0, 1]);
  return (
    <>
      <Header kicker="설계도" title="정하지 않은 것은, 에이전트가 추측한다" />
      <FormCard x={180} title="다마고찌 게임 만들어 줘" accent={C.sky}>
        {ROWS10.map((r, i) => {
          const a = 0.4 + i * 0.4;
          const roll = interpolate(t, [a, a + 0.55], [0, 1], easeOut);
          const settled = t >= a + 0.55;
          return (
            <div key={r.k} style={{ position: 'relative', height: 108, display: 'flex', alignItems: 'center', borderBottom: '1px dashed var(--hair-2)' }}>
              <span style={{ width: 120, fontSize: 25, fontWeight: 800, color: 'var(--fg-muted)' }}>{r.k}</span>
              <span style={{ flex: 1, height: 2, background: 'var(--hair)', marginRight: 20 }} />
              {t >= a && (
                <div style={{ position: 'absolute', left: 140 + roll * 300, top: 30, opacity: settled ? 0.55 : 1 }}>
                  <Die rot={roll * 540} />
                </div>
              )}
              {settled && (
                <span style={{ position: 'absolute', left: 230, top: 30, fontSize: 30, fontWeight: 700, fontStyle: 'italic', color: C.sky, transform: 'rotate(-2deg)', opacity: interpolate(t, [a + 0.55, a + 0.8], [0, 1]) }}>{r.guess}?</span>
              )}
            </div>
          );
        })}
      </FormCard>
      <div style={{ ...abs(870, 520, 180), textAlign: 'center', opacity: diff }}>
        <div style={{ fontSize: 44, fontWeight: 900, color: C.gold }}>↔</div>
        <div style={{ fontSize: 26, fontWeight: 900, color: C.gold }}>다르다</div>
      </div>
      <div style={{ opacity: Math.min(1, slide * 1.4), transform: `translateX(${(1 - slide) * 160}px)` }}>
        <FormCard x={1080} title={<>설계도 <span style={{ fontSize: 18, color: 'var(--fg-muted)' }}>· 내가 정한 것</span></>} accent={C.coral}>
          {ROWS10.map((r) => (
            <div key={r.k} style={{ height: 108, display: 'flex', alignItems: 'center', borderBottom: '1px dashed var(--hair-2)' }}>
              <span style={{ width: 120, fontSize: 25, fontWeight: 800, color: 'var(--fg-muted)' }}>{r.k}</span>
              <span style={{ fontSize: 30, fontWeight: 800, color: C.coral }}>{r.mine}</span>
            </div>
          ))}
        </FormCard>
      </div>
      <div style={{ ...abs(180, 940, 1560), ...small, fontSize: 22, opacity: diff }}>
        설계도 = 만들기 전에 이 빈칸을 <b style={{ color: C.coral }}>내가 정해서</b> 적어 둔 문서 · 다음 시간 에이전트가 이것을 읽고 만든다
      </div>
    </>
  );
}

/* ═══════════════════ S11 — 설계도의 네 칸 (build 4 · 접힌 도면 펼치기) ═══════════════════ */
const PANELS = [
  { n: '②', t: '기능 목록', q: '무엇을 할 수 있나? 필수와 나중으로 나눈다', next: '12장' },
  { n: '③', t: '화면 구성 · 사용 흐름', q: '어떤 화면이 있고, 어떤 순서로 누르나?', next: '13장' },
  { n: '④', t: '데이터 · 기술 구조', q: '무엇을 어디에 저장하나? 무엇이 필요한가?', next: '14장' },
];
export function FourPanelsSlide() {
  const { clicks, isStatic } = useDeck();
  const c = isStatic ? 9 : clicks;
  const unfold = (k: number) => ({
    transform: `scaleX(${c >= k ? 1 : 0.04})`,
    opacity: c >= k ? 1 : 0,
    transformOrigin: 'left center',
    transition: 'transform .6s cubic-bezier(.16,1,.3,1), opacity .35s',
  });
  return (
    <>
      <Header kicker="설계도" title="설계도의 네 칸" />
      {[1, 2, 3, 4].map((k) => <Build key={k} at={k} style={{ position: 'absolute', width: 0, height: 0 }}><span /></Build>)}
      {/* 접힌 도면 */}
      <div style={{ ...abs(120, 250, 320, 440), borderRadius: 14, background: `linear-gradient(135deg, color-mix(in srgb, ${C.sky} 22%, var(--bg)) 0%, color-mix(in srgb, ${C.sky} 10%, var(--bg)) 100%)`, border: `2px solid ${C.sky}`, display: 'grid', placeItems: 'center', opacity: c >= 1 ? 0 : 1, transition: 'opacity .3s' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'grid', placeItems: 'center' }}><Pet name="adult-idle" px={4} /></div>
          <div style={{ fontSize: 28, fontWeight: 900, marginTop: 16 }}>다마고찌 설계도</div>
          <div style={{ ...small, marginTop: 6 }}>(접힌 도면)</div>
        </div>
      </div>
      {/* ① 넓게 */}
      <div style={{ ...abs(120, 240, 860, 720), ...unfold(1) }}>
        <div style={{ height: '100%', boxSizing: 'border-box', padding: '34px 40px', borderRadius: 20, border: `2px solid ${C.coral}`, background: 'color-mix(in srgb, #ff7a6b 6%, var(--bg))' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <span style={{ fontSize: 44, fontWeight: 900, color: C.coral }}>①</span>
            <span style={{ ...h3, fontSize: 40 }}>목적 · 사용자 · 문제</span>
          </div>
          <div style={{ ...small, fontSize: 23, marginTop: 8 }}>누가, 어떤 불편 때문에 쓰는가?</div>
          <div style={{ marginTop: 34, padding: '24px 28px', borderLeft: `5px solid ${C.gold}`, background: 'color-mix(in srgb, var(--fg) 5%, transparent)', borderRadius: '0 14px 14px 0' }}>
            <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.45, wordBreak: 'keep-all' }}>"학교생활의 알림을 <span style={{ color: C.gold }}>돌봐야 하는 작은 생명</span>의 얼굴로 전하는 펫"</div>
            <div style={{ ...small, marginTop: 10 }}>— 다마고찌 기획 문서의 첫 줄</div>
          </div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginTop: 40 }}>
            <Pet name="baby-no" px={5} />
            <div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>계기: 9월 이후 플래너 기록 <span style={{ color: C.coral }}>3건</span></div>
              <div style={{ ...small, fontSize: 21, marginTop: 4 }}>게임이 하고 싶어서가 아니라, 불편이 있어서 시작했다</div>
            </div>
          </div>
        </div>
      </div>
      {/* ②③④ 좁게 */}
      {PANELS.map((p, i) => (
        <div key={p.n} style={{ ...abs(1020, 240 + i * 245, 800, 225), ...unfold(i + 2) }}>
          <div style={{ height: '100%', boxSizing: 'border-box', padding: '24px 30px', borderRadius: 18, border: `2px solid ${C.sky}`, background: 'color-mix(in srgb, #9cc3ff 6%, var(--bg))', display: 'flex', gap: 22, alignItems: 'center' }}>
            <span style={{ fontSize: 44, fontWeight: 900, color: C.sky }}>{p.n}</span>
            <div style={{ flex: 1 }}>
              <div style={{ ...h3, fontSize: 32 }}>{p.t}</div>
              <div style={{ ...small, fontSize: 21, marginTop: 6 }}>{p.q}</div>
              <div style={{ marginTop: 12 }}><Chip color="#b7c3d6" size={16}>→ {p.next}에서 채운다</Chip></div>
            </div>
            {i === 2 && <MiniMap level={3} w={150} />}
          </div>
        </div>
      ))}
    </>
  );
}

/* ═══════════════════ S12 — 기능 목록: 첫 버전은 가방 하나 (scene · 수학여행 가방) ═══════════════════ */
const FEATS = ['알 · 부화', '배고파짐', '밥 주기', '간식', '불 끄기', '주사', '씻기', '놀이 3종', '쓰다듬기', '산책', '코인', '펫 일기', '함께 집중', '가챠', '꾸미기', '펫 집', '친구 교환', '순위', '휴대폰 알림', '수업 중 멈춤'];
// 흩어진 자리 (고정 시드 배열 — 결정론)
const SPOT = [
  [180, 230, -6], [470, 210, 4], [760, 250, -3], [1050, 205, 7], [1340, 240, -5], [1610, 215, 3],
  [140, 360, 5], [420, 395, -7], [700, 370, 2], [980, 400, -4], [1260, 365, 6], [1550, 390, -2],
  [260, 500, -3], [560, 525, 6], [860, 505, -6], [1130, 530, 3], [1420, 510, -5], [1690, 520, 4],
  [380, 300, 8], [1460, 300, -8],
];
export function BagScene() {
  const t = useSceneTime();
  const label = interpolate(t, [3.8, 4.2], [0, 1]);
  return (
    <>
      <Header kicker="설계도 ②" title="기능 목록: 첫 버전은 가방 하나" />
      {/* 가방 */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }} aria-hidden>
        <g transform={`translate(960 800) scale(${t >= 1.8 && t < 2.1 ? 1.04 : 1}, ${t >= 1.8 && t < 2.1 ? 0.97 : 1})`}>
          <path d="M-90 -170 C-90 -220 90 -220 90 -170" fill="none" stroke={C.coral} strokeWidth="10" strokeLinecap="round" />
          <path d="M-200 -150 L200 -150 L230 130 C232 148 220 160 202 160 L-202 160 C-220 160 -232 148 -230 130 Z" fill="color-mix(in srgb, #ff7a6b 16%, #0f2747)" stroke={C.coral} strokeWidth="5" strokeLinejoin="round" />
          <path d="M-200 -90 L200 -90" stroke={C.coral} strokeWidth="3" opacity=".5" />
        </g>
        {/* 나중 상자 */}
        <g transform="translate(1600 830)">
          <path d="M-200 -110 L200 -110 L200 130 L-200 130 Z" fill="color-mix(in srgb, #9cc3ff 8%, #0f2747)" stroke="#8fa3c0" strokeWidth="4" />
          <path d="M-200 -110 L-160 -150 L240 -150 L200 -110 M200 130 L240 90 L240 -150" fill="none" stroke="#8fa3c0" strokeWidth="4" strokeLinejoin="round" />
        </g>
      </svg>
      {FEATS.map((f, i) => {
        const [sx, sy, sr] = SPOT[i];
        const gone = interpolate(t, i < 3 ? [0.4 + i * 0.45, 1.0 + i * 0.45] : [2.2 + (i - 3) * 0.06, 2.8 + (i - 3) * 0.06], [0, 1]);
        return (
          <div key={`g${f}`} style={{ ...abs(sx, sy, 200, 62), transform: `rotate(${sr}deg)`, transformOrigin: 'left top', borderRadius: 12, border: `2px dashed ${i < 3 ? C.coral : '#8fa3c0'}`, opacity: 0.45 * gone, display: 'grid', placeItems: 'center', fontSize: 19, color: i < 3 ? C.coralSoft : '#8fa3c0' }}>{f}</div>
        );
      })}
      {FEATS.map((f, i) => {
        const [sx, sy, sr] = SPOT[i];
        let x = sx, y = sy, r = sr, sc = 1, op = 1;
        if (i < 3) {
          const p = interpolate(t, [0.4 + i * 0.45, 1.0 + i * 0.45], [0, 1], easeInOut);
          const tx = 860, ty = 700 + i * 72;
          x = sx + (tx - sx) * p; y = sy + (ty - sy) * p - Math.sin(p * Math.PI) * 80; r = sr * (1 - p);
        } else {
          const a = 2.2 + (i - 3) * 0.06;
          const p = interpolate(t, [a, a + 0.6], [0, 1], easeInOut);
          const k = i - 3;
          const tx = 1430 + (k % 4) * 82, ty = 730 + Math.floor(k / 4) * 44;
          x = sx + (tx - sx) * p; y = sy + (ty - sy) * p; r = sr + (k % 2 ? 8 : -8) * p; sc = 1 - 0.55 * p; op = 1 - 0.25 * p;
        }
        const keep = i < 3;
        return (
          <div key={f} style={{ ...abs(x, y, 200, 62), transform: `rotate(${r}deg) scale(${sc})`, transformOrigin: 'left top', opacity: op, borderRadius: 12, display: 'grid', placeItems: 'center', fontSize: 23, fontWeight: 800, whiteSpace: 'nowrap', background: keep ? C.paper : 'color-mix(in srgb, var(--fg) 10%, var(--bg))', color: keep ? C.deep : C.ink, border: keep ? `2px solid ${C.coral}` : '1.5px solid var(--hair)', boxShadow: '0 8px 18px rgba(0,0,0,.3)', zIndex: keep ? 2 : 1 }}>
            {f}
          </div>
        );
      })}
      <div style={{ ...abs(760, 540, 400), textAlign: 'center', opacity: label }}><Chip color={C.coral} solidFill size={21}>필수 · 첫 버전 (MVP)</Chip></div>
      <div style={{ ...abs(1400, 640, 400), textAlign: 'center', opacity: label }}><Chip color="#b7c3d6" size={21}>나중</Chip></div>
      <div style={{ ...abs(130, 680, 560), display: 'flex', gap: 22, alignItems: 'center', ...riseIn(t, 4.4, 0.6) }}>
        <Pet name="baby-no" px={6} />
        <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.4, wordBreak: 'keep-all' }}>이것만으로도 <span style={{ color: C.coral }}>'돌보는 재미'</span>는 확인된다</div>
      </div>
      <div style={{ ...abs(130, 880, 560), ...riseIn(t, 4.6, 0.6) }}>
        <Term term="MVP" gloss="최소 기능 제품 — 핵심이 확인되는 가장 작은 첫 버전" color={C.coral} />
      </div>
    </>
  );
}

/* ═══════════════════ S13 — 화면 구성과 사용 흐름 (static · 만화 콘티) ═══════════════════ */
function WireBox({ h = 120, children }: { h?: number; children?: React.ReactNode }) {
  return (
    <div style={{ height: h, border: '2px solid #8fa3c0', borderRadius: 8, position: 'relative', display: 'grid', placeItems: 'center' }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }} preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden>
        <path d="M0 0 L100 100 M100 0 L0 100" stroke="#8fa3c0" strokeWidth="1" vectorEffect="non-scaling-stroke" opacity=".6" />
      </svg>
      {children}
    </div>
  );
}
const wbtn: React.CSSProperties = { ...mono, fontSize: 19, fontWeight: 700, color: C.ink, border: '2px solid #8fa3c0', borderRadius: 8, padding: '8px 10px', textAlign: 'center' };
const wline = (w: string) => <div style={{ height: 10, width: w, borderRadius: 5, background: '#8fa3c0', opacity: 0.6, marginTop: 10 }} />;
const FRAMES = [
  { x: 150, y: 330, title: '① 알 받기' },
  { x: 690, y: 270, title: '② 펫 화면' },
  { x: 1230, y: 210, title: '③ 배고픔 알림' },
];
export function StoryboardSlide() {
  const fw = 290;
  const fh = 560;
  return (
    <>
      <Header kicker="설계도 ③" title="화면 구성과 사용 흐름" />
      {FRAMES.map((f, i) => (
        <div key={f.title} style={{ ...abs(f.x, f.y, fw) }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: C.sky, marginBottom: 10 }}>{f.title}</div>
          <div style={{ width: fw, height: fh, borderRadius: 32, border: `3px solid ${C.sky}`, padding: '40px 22px 22px', boxSizing: 'border-box', background: 'color-mix(in srgb, #9cc3ff 4%, var(--bg))', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {i === 0 && (
              <>
                {wline('60%')}
                <WireBox h={170} />
                <div style={{ ...wbtn, textAlign: 'left', color: 'var(--fg-muted)' }}>[ 이름 입력 ]</div>
                <div style={wbtn}>[ 알 받기 ]</div>
              </>
            )}
            {i === 1 && (
              <>
                <div style={{ ...mono, fontSize: 19, color: C.ink }}>모찌 · 어린이</div>
                <WireBox h={190}>
                  <div style={{ opacity: 0.85 }}><Pet name="child-happy" px={4} /></div>
                </WireBox>
                <div style={{ ...mono, fontSize: 19 }}>배고픔 <Hearts n={2} size={20} color="#ff9a8b" /></div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ ...wbtn, flex: 1, borderColor: C.coral, color: C.coral }}>[밥 주기]</div>
                  <div style={{ ...wbtn, flex: 1 }}>[놀이]</div>
                </div>
              </>
            )}
            {i === 2 && (
              <>
                <div style={{ border: `2px solid ${C.gold}`, borderRadius: 12, padding: '14px 14px', fontSize: 21, fontWeight: 800, color: C.gold }}>🔔 모찌가 배고파요!</div>
                {wline('80%')}
                {wline('55%')}
                <WireBox h={150} />
                <div style={wbtn}>[ 밥 주러 가기 ]</div>
              </>
            )}
          </div>
        </div>
      ))}
      {/* 흐름 화살표 — 프레임 가장자리 앵커 */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }} aria-hidden>
        <defs>
          <marker id="s13h" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill={C.ink} />
          </marker>
        </defs>
        <path d={`M${150 + fw + 6} 640 C${560} 640 ${600} 580 ${690 - 8} 580`} fill="none" stroke={C.ink} strokeWidth="3" markerEnd="url(#s13h)" />
        <path d={`M${690 + fw + 6} 560 C${1100} 560 ${1140} 520 ${1230 - 8} 520`} fill="none" stroke={C.ink} strokeWidth="3" markerEnd="url(#s13h)" />
        <path d={`M${1230 + fw / 2} ${210 + 50 + fh + 6} C${1375} 940 ${835} 940 ${690 + fw / 2} ${270 + 50 + fh + 8}`} fill="none" stroke={C.coral} strokeWidth="3" strokeDasharray="10 8" markerEnd="url(#s13h)" />
      </svg>
      <div style={{ ...abs(462, 580, 200), textAlign: 'center' }}><Chip color={C.ink} size={18} style={{ background: 'var(--bg)' }}>이름 입력</Chip></div>
      <div style={{ ...abs(1002, 500, 200), textAlign: 'center' }}><Chip color={C.ink} size={18} style={{ background: 'var(--bg)' }}>시간이 지나면</Chip></div>
      <div style={{ ...abs(985, 900, 260), textAlign: 'center' }}><Chip color={C.coral} size={18} style={{ background: 'var(--bg)' }}>밥 주러 가기 누름</Chip></div>
      <div style={{ ...abs(1560, 230, 300) }}>
        <Term term="와이어프레임" gloss="색과 그림 없이 상자와 글자로만 그린 화면 뼈대" style={{ flexDirection: 'column', gap: 6 }} />
      </div>
      <div style={{ ...abs(1560, 640, 300), ...solid, padding: '18px 22px' }}>
        <div style={{ ...kick, fontSize: 14 }}>설계도에는 글로 적는다</div>
        <div style={{ ...mono, fontSize: 18, lineHeight: 1.6, marginTop: 8, color: C.ink }}>화면: 알 받기 →<br />&nbsp;펫 화면 → 알림<br /><span style={{ color: 'var(--fg-muted)' }}>흐름: 이름 짓기 →<br />&nbsp;부화 → 밥 주기</span></div>
      </div>
    </>
  );
}

/* ═══════════════════ S14 — 데이터·기술 구조: 지도에서 고른다 (build 4) ═══════════════════ */
const ROWS14 = [
  { at: 1, k: '저장할 것', v: '이름 · 상태 · 마지막 저장 시각 → 서버 DB' },
  { at: 2, k: '프론트엔드', v: '화면 · 시간이 지나 배고파지는 계산' },
  { at: 3, k: '백엔드', v: '기준 시각 · 저장 확인 · 코인' },
  { at: 4, k: '로그인 · 배포', v: '둘 다 필요 — 내 펫과 친구 펫 구분, 반 친구들이 씀' },
];
export function PickSlide() {
  const { clicks, isStatic } = useDeck();
  const c = isStatic ? 9 : clicks;
  return (
    <>
      <Header kicker="설계도 ④" title="데이터·기술 구조: 지도에서 고른다" />
      <WebMap dim lit={{ db: c >= 1, front: c >= 2, back: c >= 3, host: c >= 4 }} />
      <div style={{ ...abs(1400, 210, 450, 760), borderRadius: 20, border: `2px solid ${C.sky}`, background: 'color-mix(in srgb, #9cc3ff 6%, var(--bg))', padding: '26px 28px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{ fontSize: 38, fontWeight: 900, color: C.sky }}>④</span>
          <span style={{ ...h3, fontSize: 28 }}>데이터 · 기술 구조</span>
        </div>
        <div style={{ ...small, marginTop: 4 }}>다마고찌 첫 버전</div>
        {ROWS14.map((r) => (
          <Build key={r.k} at={r.at}>
            <div style={{ marginTop: 22, paddingTop: 16, borderTop: '1px solid var(--hair-2)' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.coral }}>{r.k}</div>
              <div style={{ fontSize: 22, lineHeight: 1.45, marginTop: 4, wordBreak: 'keep-all' }}>{r.v}</div>
            </div>
          </Build>
        ))}
        <Build at={4}>
          <div style={{ marginTop: 24, ...small, fontSize: 17, color: 'var(--fg-faint)' }}>화면만 있는 프로젝트라면 이 칸은 두 줄이면 끝난다</div>
        </Build>
      </div>
    </>
  );
}

/* ═══════════════════ S15 — 설계도.md는 이렇게 생겼다 (static) ═══════════════════ */
const MD = `# 우리 반 다마고찌 설계도

## 1. 목적·사용자·문제
- 사용자: 우리 반 친구들
- 문제: 플래너를 써야 하는데 자꾸 잊는다
- 목적: 펫을 돌보러 들어왔다가 플래너도 쓰게 만든다

## 2. 기능 목록
### 필수 (첫 버전)
- 알을 받아 이름을 짓고 부화시킨다
- 시간이 지나면 배고파진다
- 밥을 주면 배고픔이 찬다
### 나중
- 놀이, 코인, 꾸미기, 친구 펫 방문

## 3. 화면 구성·사용 흐름
- 화면: 알 받기 → 펫 화면 → 배고픔 알림
- 흐름: 이름 짓기 → 부화 → 하트가 줄어듦 → 밥 주기

## 4. 데이터·기술 구조
- 저장: 펫 이름, 상태(배고픔·단계), 마지막 저장 시각
- 위치: 서버 데이터베이스 (친구도 같은 펫을 봐야 함)
- 로그인 필요, 배포 필요

## 5. 아직 정하지 못한 것
- 펫이 오래 굶으면 어떻게 되는가`.split('\n');
const NOTES15: Record<number, { label: string; hot?: boolean }> = {
  2: { label: '① 목적·사용자·문제' },
  7: { label: '② 기능 목록 — 필수 / 나중' },
  15: { label: '③ 화면 구성·사용 흐름' },
  19: { label: '④ 데이터·기술 구조' },
  24: { label: '⑤ 아직 정하지 못한 것 — 있어도 괜찮다', hot: true },
};
export function MdFileSlide() {
  const LH = 27;
  const TOP = 120 + 46 + 18;
  return (
    <>
      <div style={{ ...abs(100, 120, 1060, 46 + 18 * 2 + MD.length * LH), ...solid, borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ height: 46, display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px', borderBottom: '1px solid var(--hair-2)', background: 'color-mix(in srgb, var(--fg) 5%, transparent)' }}>
          <span style={{ ...mono, fontSize: 17, padding: '4px 14px', borderRadius: 8, background: 'var(--bg)', color: C.ink }}>vibe/설계도.md</span>
        </div>
        <div style={{ padding: '18px 30px' }}>
          {MD.map((l, i) => {
            const m = l.match(/^(#+ |- )(.*)$/);
            return (
              <div key={i} style={{ ...mono, height: LH, fontSize: l.startsWith('# ') ? 22 : 19, lineHeight: `${LH}px`, whiteSpace: 'pre', fontWeight: l.startsWith('#') ? 800 : 500, color: C.ink }}>
                {m ? <><span style={{ color: C.sky }}>{m[1]}</span>{m[2]}</> : l}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ ...abs(1244, 60, 640) }}>
        <div style={kick}>설계도</div>
        <div style={{ ...h3, fontSize: 40, marginTop: 6 }}>설계도.md는 이렇게 생겼다</div>
      </div>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }} aria-hidden>
        {Object.keys(NOTES15).map((k) => {
          const y = TOP + Number(k) * LH + LH / 2;
          return <path key={k} d={`M1166 ${y} L1236 ${y}`} stroke={NOTES15[Number(k)].hot ? C.coral : C.sky} strokeWidth="2.5" strokeDasharray="5 5" />;
        })}
      </svg>
      {Object.entries(NOTES15).map(([k, n]) => (
        <div key={k} style={{ ...abs(1244, TOP + Number(k) * LH + LH / 2 - 21) }}>
          <Chip color={n.hot ? C.coral : C.sky} size={20}>{n.label}</Chip>
        </div>
      ))}
      <div style={{ ...abs(1244, 900, 620) }}>
        <Term term="마크다운(.md)" gloss="#은 제목, -는 목록 — 사람도 에이전트도 읽기 쉬운 글 파일" />
      </div>
    </>
  );
}

/* ═══════════════════ S16 — 이번에는 에이전트가 묻는다 (scene · 병원 문진표) ═══════════════════ */
const QA = [
  { q: '누가 주로 쓰나요?', opts: ['나 혼자', '우리 반', '학교 전체', '직접 적기'], pick: 1, row: '우리 반 친구들' },
  { q: '첫 버전에 꼭 필요한 기능은?', opts: ['밥 주기', '가챠', '꾸미기', '직접 적기'], pick: 0, row: '밥 주기 · 배고파짐' },
  { q: '화면은 몇 개면 될까요?', opts: ['1개', '3개', '5개 이상', '직접 적기'], pick: 1, row: '화면 3개' },
  { q: '친구도 펫을 봐야 하나요?', opts: ['나만', '친구도', '모르겠어', '직접 적기'], pick: 1, row: '서버 DB' },
];
const ROWLAB = ['목적·사용자·문제', '기능 목록', '화면 구성·사용 흐름', '데이터·기술 구조'];
export function InterviewScene() {
  const t = useSceneTime();
  const flip = interpolate(t, [0.5, 1.0], [0, 1], easeInOut);
  const CB = { x: 1300, y: 230, s: 1.0 };
  const fileDrop = spring(t, 4.5, 0.7);
  return (
    <>
      <Header kicker="에이전트로 설계도 쓰기" title="이번에는 에이전트가 묻는다" />
      {/* 방향 뒤집기 */}
      <div style={{ ...abs(160, 218, 980, 70), display: 'flex', alignItems: 'center', gap: 20 }}>
        <Chip color={C.coral} solidFill size={22}>나</Chip>
        <svg width="300" height="40" viewBox="0 0 300 40" aria-hidden>
          <g transform={`translate(150 20) scale(${1 - 2 * flip} 1)`}>
            <path d="M-130 0 L130 0 M110 -14 L130 0 L110 14" fill="none" stroke={flip > 0.5 ? C.sky : 'var(--fg-muted)'} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
        <Chip color={C.sky} solidFill size={22}>에이전트</Chip>
        <span style={{ fontSize: 23, fontWeight: 700, marginLeft: 12, color: flip > 0.5 ? C.sky : 'var(--fg-muted)' }}>{flip > 0.5 ? '이번엔 에이전트가 묻고, 내가 고른다' : '지금까지: 내가 묻고 AI가 답했다'}</span>
      </div>
      {/* 대화 줄기 */}
      {QA.map((qa, i) => {
        const a = 1.2 + i * 0.8;
        const sel = t >= a + 0.5;
        return (
          <div key={i} style={{ ...abs(160, 330 + i * 160, 1060), ...riseIn(t, a, 0.5) }}>
            <div style={{ display: 'inline-block', padding: '12px 20px', borderRadius: '18px 18px 18px 4px', border: `2px solid ${C.sky}`, fontSize: 24, fontWeight: 700, background: 'color-mix(in srgb, #9cc3ff 8%, var(--bg))' }}>{qa.q}</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              {qa.opts.map((o, j) => {
                const on = sel && j === qa.pick;
                return <span key={o} style={{ padding: '7px 18px', borderRadius: 999, fontSize: 20, fontWeight: 700, border: `1.5px solid ${on ? C.coral : 'var(--hair)'}`, background: on ? C.coral : 'transparent', color: on ? C.deep : 'var(--fg-muted)', transform: on ? `scale(${1 + 0.08 * Math.max(0, 1 - (t - a - 0.5) / 0.3)})` : 'none' }}>{j + 1}) {o}</span>;
              })}
            </div>
          </div>
        );
      })}
      {/* 선택 → 문진표 칸 */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }} aria-hidden>
        {QA.map((qa, i) => {
          const a = 1.2 + i * 0.8 + 0.5;
          const p = interpolate(t, [a, a + 0.3], [0, 1]);
          const y1 = 330 + i * 160 + 86;
          const y2 = CB.y + 196 + 20 + i * 88;
          return p > 0 ? <path key={i} d={`M1010 ${y1} C1150 ${y1} 1200 ${y2} ${CB.x + 60} ${y2}`} fill="none" stroke={C.coral} strokeWidth="2.5" strokeDasharray="6 6" opacity={0.75 * p} /> : null;
        })}
      </svg>
      <img src="assets/svg/clipboard-questionnaire.svg" alt="" aria-hidden style={{ ...abs(CB.x, CB.y, 420, 560), opacity: interpolate(t, [0, 0.5], [0, 1]) }} />
      {ROWLAB.map((lab, i) => {
        const a = 1.2 + i * 0.8 + 0.5;
        const done = t >= a + 0.2;
        const y = CB.y + 196 + i * 88;
        return (
          <div key={lab}>
            {done && <div style={{ ...abs(CB.x + 64, y - 8, 40, 48), fontSize: 40, fontWeight: 900, color: '#d23c2a', textAlign: 'center', lineHeight: '48px', opacity: interpolate(t, [a + 0.2, a + 0.4], [0, 1]) }}>✓</div>}
            <div style={{ ...abs(CB.x + 124, y - 2, 240), fontSize: 15, fontWeight: 800, color: '#5a6a80' }}>{lab}</div>
            {done && <div style={{ ...abs(CB.x + 124, y + 14, 240), fontSize: 19, fontWeight: 800, color: C.deep, whiteSpace: 'nowrap' }}>{QA[i].row}</div>}
          </div>
        );
      })}
      {t >= 4.5 && (
        <div style={{ ...abs(CB.x + 110, CB.y + 590 - (1 - fileDrop) * 60), opacity: Math.min(1, fileDrop * 1.4) }}>
          <Chip color={C.coral} solidFill size={24}>📄 설계도.md</Chip>
        </div>
      )}
    </>
  );
}

/* ═══════════════════ S17 — 인터뷰 프롬프트 해부 (build 6) ═══════════════════ */
const RULES17 = ['한 번에 한 질문', '보기 2~4개 + 직접 적기', '"모르겠어" → 장단점과 추천', '어려운 용어는 괄호 풀이', '항목마다 요약 확인', '마음대로 정하지 않기', '필수는 셋까지'];
export function AnatomySlide() {
  const { clicks, isStatic } = useDeck();
  const c = isStatic ? 9 : clicks;
  const LH = 21.6;
  const TOP = 92;
  const X = 96;
  const TAGS = [
    { y: 100, h: 92 },
    { y: 210, h: 92 },
    { y: 320, h: 300 },
    { y: 640, h: 120 },
    { y: 780, h: 150 },
  ];
  return (
    <>
      <div style={{ ...abs(X - 16, TOP - 22, 1150, PROMPT_LINES.length * LH + 44), ...solid, borderRadius: 16 }} />
      {SECTIONS.map((s, i) => (
        <div key={s.key} style={{ ...abs(X - 8, TOP + s.from * LH - 2, 1130, (s.to - s.from + 1) * LH + 4), borderRadius: 6, background: `color-mix(in srgb, ${C.coral} 20%, transparent)`, borderLeft: `5px solid ${C.coral}`, opacity: c >= i + 1 ? 1 : 0, transition: 'opacity .4s' }} />
      ))}
      <pre style={{ ...abs(X + 6, TOP, 1110), margin: 0, ...mono, fontSize: 15.5, lineHeight: `${LH}px`, color: 'var(--fg-muted)', whiteSpace: 'pre-wrap' }}>
        {PROMPT_LINES.map((l, i) => {
          const sec = SECTIONS.findIndex((s) => i >= s.from && i <= s.to);
          const lit = sec >= 0 && c >= sec + 1;
          return <div key={i} style={{ height: LH, color: lit ? C.ink : 'color-mix(in srgb, var(--fg) 45%, transparent)', transition: 'color .4s', whiteSpace: 'pre', overflow: 'hidden' }}>{l || ' '}</div>;
        })}
      </pre>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }} aria-hidden>
        {SECTIONS.map((s, i) => {
          const y1 = TOP + ((s.from + s.to + 1) / 2) * LH;
          const y2 = TAGS[i].y + 36;
          return <path key={s.key} d={`M1236 ${y1} C1270 ${y1} 1270 ${y2} 1300 ${y2}`} fill="none" stroke={C.coral} strokeWidth="2.5" opacity={c >= i + 1 ? 0.8 : 0} style={{ transition: 'opacity .4s' }} />;
        })}
      </svg>
      <div style={{ ...abs(1310, 40, 560), ...kick, color: C.sky }}>인터뷰 프롬프트 해부</div>
      {SECTIONS.map((s, i) => (
        <Build key={s.key} at={i + 1} style={{ ...abs(1310, TAGS[i].y, 560) }}>
          <div style={{ padding: '14px 20px', borderRadius: 14, border: `2px solid ${C.coral}`, background: 'color-mix(in srgb, #ff7a6b 8%, var(--bg))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: i === 2 ? 30 : 26, fontWeight: 900 }}>{s.name}</span>
              {c >= 6 && <Chip color="#b7c3d6" size={15}>지난 시간: {s.past}</Chip>}
            </div>
            {i === 0 && <div style={{ ...small, fontSize: 18 }}>"너는 … 인터뷰어야"</div>}
            {i === 1 && <div style={{ ...small, fontSize: 18 }}>"지금은 코드를 만들지 않는다" — 없으면 바로 만들기 시작한다</div>}
            {i === 2 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 14px', marginTop: 8 }}>
                {RULES17.map((r, j) => <div key={r} style={{ fontSize: 19, lineHeight: 1.35, wordBreak: 'keep-all' }}><b style={{ color: C.coral }}>{j + 1}</b> {r}</div>)}
              </div>
            )}
            {i === 3 && <div style={{ ...small, fontSize: 18 }}>설계도 네 칸 · ④에서 저장 · 함께 보는 사람 · 로그인 · 배포를 하나씩</div>}
            {i === 4 && <div style={{ ...small, fontSize: 18 }}>확인받은 뒤 설계도.md를 정해진 틀로 저장 — 틀이 예시 역할도 한다</div>}
          </div>
        </Build>
      ))}
      <Build at={6} style={{ ...abs(1310, 960, 560) }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.sky, wordBreak: 'keep-all' }}>지난 시간 배운 프롬프트 요소가 그대로 들어 있다</div>
      </Build>
    </>
  );
}
