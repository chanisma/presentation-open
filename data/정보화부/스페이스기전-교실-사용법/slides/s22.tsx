import { Scene, useSceneTime, interpolate, easeInOut, spring } from '../../../../src/scene';
import { C, Head, SceneSubs, OptionRow, Dock, BASE_TILES, Chip, window4, type SlideMeta, type Sub } from '../kit';

/* 22 — scene: 로그인 보관 — 금고는 교실 PC에, 열쇠는 서버에
   메타포: 위아래 2층 무대. 아래층 교실 PC 안의 금고, 위층 서버의 열쇠함(선생님 × PC마다 열쇠 하나).
   같은 선생님이 그 PC에서 QR로 승인할 때만 맞는 열쇠가 내려와 금고가 열린다. */

const T = { END: 1.0, IN: 1.6, LOCK: 3.4, OTHER: 4.4, KEY2: 5.2, MISS: 6.5, BACK2: 7.2, SAME: 8.2, KEY1: 9.0, OPEN: 10.3, DOCK: 10.9, DEL: 12.6 };
const DUR = 16;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '매 수업 구글에 다시 로그인하기 번거롭다면 «로그인 보관»을 켜 두세요. 승인 화면에서 기본으로 켜져 있습니다.' },
  { at: T.END, text: '수업이 끝나면 로그인을 잠가 교실 PC에 둡니다. 그 잠금을 여는 열쇠는 서버에 있습니다.' },
  { at: T.OTHER, text: '같은 선생님이 그 PC에서 QR로 승인할 때만 열쇠가 내려와 풀립니다. 다른 사람은 열 수 없습니다.' },
  { at: T.OPEN, text: '다음 수업에는 독의 «구글»에 초록 ✓가 붙고 로그인된 채 열립니다.' },
  { at: T.DEL, text: '지우고 싶으면 교실 구글 창이나 스페이스기전 «교실 기기» 화면에서 [지우기]를 누르세요.' },
];

const VAULT = { x: 300, y: 600, w: 300, h: 260 }; // 금고(아래층)
const HOOK = [{ x: 1290, who: '김기전', pc: '2-3 교실', col: C.primary }, { x: 1470, who: '이영희', pc: '2-3 교실', col: '#0f766e' }, { x: 1650, who: '김기전', pc: '1-1 교실', col: '#a16207' }];
const KEY_Y = 410;
const LOCK_PT = [VAULT.x + VAULT.w / 2, VAULT.y + 118];

/** 열쇠 — 추상 도형(고리 + 막대 + 이) */
function KeyShape({ x, y, col, rot = 0, label }: { x: number; y: number; col: string; rot?: number; label?: string }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${rot})`}>
      <circle cx={0} cy={0} r={20} fill="none" stroke={col} strokeWidth={9} />
      <rect x={-5} y={18} width={10} height={64} rx={4} fill={col} />
      <rect x={5} y={58} width={16} height={9} rx={2} fill={col} />
      <rect x={5} y={72} width={11} height={9} rx={2} fill={col} />
      {label && <text x={0} y={112} textAnchor="middle" fontSize={19} fontWeight={700} fill={C.ink} transform={`rotate(${-rot})`}>{label}</text>}
    </g>
  );
}

function keyPos(t: number, i: number): { x: number; y: number; rot: number } {
  const home = { x: HOOK[i].x, y: KEY_Y, rot: 0 };
  const dest = { x: LOCK_PT[0] + 40, y: LOCK_PT[1] - 70, rot: -90 };
  let u = 0;
  if (i === 1) u = t < T.KEY2 ? 0 : t < T.MISS ? interpolate(t, [T.KEY2, T.MISS - 0.2], [0, 1], easeInOut) : t < T.BACK2 + 0.9 ? interpolate(t, [T.BACK2, T.BACK2 + 0.9], [1, 0], easeInOut) : 0;
  if (i === 0) u = t < T.KEY1 ? 0 : interpolate(t, [T.KEY1, T.OPEN - 0.15], [0, 1], easeInOut);
  const lift = Math.sin(u * Math.PI) * -120;
  return { x: home.x + (dest.x - home.x) * u, y: home.y + (dest.y - home.y) * u + lift, rot: home.rot + (dest.rot - home.rot) * u };
}

function Stage() {
  const t = useSceneTime();
  const locked = t >= T.LOCK && t < T.OPEN;
  const shackle = t < T.LOCK ? interpolate(t, [T.LOCK - 0.4, T.LOCK], [26, 0], easeInOut) : t < T.OPEN ? 0 : interpolate(t, [T.OPEN, T.OPEN + 0.4], [0, 26], easeInOut);
  const miss = window4(t, T.MISS, T.MISS + 0.15, T.BACK2, T.BACK2 + 0.3);
  const visitor = t >= T.OTHER - 0.2 && t < T.SAME ? 'other' : t >= T.SAME ? 'same' : null;
  const vis = visitor === 'other' ? spring(t, T.OTHER, 0.5) : spring(t, T.SAME, 0.5);
  const dock = spring(t, T.DOCK, 0.6);
  return (
    <>
      <Head chapter="⑥ 구글 · 3/5" title="로그인 보관: 금고는 교실 PC에, 열쇠는 서버에" />

      {/* 승인 화면의 스위치(출발점) */}
      <div style={{ position: 'absolute', left: 72, top: 176, width: 640, borderRadius: 18, background: C.card, border: `1px solid ${C.line}`, boxShadow: '0 12px 30px -20px rgba(15,23,42,.4)' }}>
        <OptionRow w={640} look="key" title="이 PC에 로그인 보관" text="수업이 끝날 때 구글·패들렛 같은 사이트 로그인을 암호화해 이 PC에 남깁니다. 열쇠는 서버에 있습니다." />
      </div>
      <div style={{ position: 'absolute', left: 82, top: 152, fontSize: 18, fontWeight: 700, color: C.muted }}>승인 화면 · 기본 켬</div>

      {/* 위층: 서버 열쇠함 */}
      <div style={{ position: 'absolute', left: 1160, top: 200, width: 640, height: 120, borderRadius: 26, background: '#eef0ff', border: `2px solid #c7d2fe`, display: 'flex', alignItems: 'center', padding: '0 30px', gap: 14 }}>
        <span style={{ fontSize: 30, fontWeight: 850, color: C.primary }}>스페이스기전 서버</span>
        <span style={{ fontSize: 20, color: C.muted }}>열쇠함 · 선생님 × PC 마다 하나</span>
      </div>
      <div style={{ position: 'absolute', left: 1185, top: 330, width: 590, height: 6, borderRadius: 3, background: '#c7d2fe' }} />
      <div style={{ position: 'absolute', left: 1170, top: 166, fontSize: 22, fontWeight: 700, color: C.muted }}>서버 · 위층</div>

      {/* 아래층: 교실 PC 와 금고 */}
      <div style={{ position: 'absolute', left: 72, top: 540, width: 960, height: 4, background: C.line }} />
      <div style={{ position: 'absolute', left: 80, top: 552, fontSize: 22, fontWeight: 700, color: C.muted }}>교실 PC · 아래층</div>
      <div style={{ position: 'absolute', left: VAULT.x, top: VAULT.y, width: VAULT.w, height: VAULT.h, borderRadius: 28, background: locked ? '#1e293b' : '#334155', border: '8px solid #475569', boxShadow: '0 30px 50px -28px rgba(15,23,42,.6)', transition: 'none' }}>
        <svg viewBox="0 0 300 260" style={{ position: 'absolute', inset: -8, width: 316, height: 276 }}>
          <path d={`M126,${110 - shackle} v-24 a24,24 0 0 1 48,0 v${24 + (shackle > 0 ? -shackle * 0.2 : 0)}`} fill="none" stroke={t >= T.OPEN ? '#86efac' : '#e2e8f0'} strokeWidth={10} strokeLinecap="round" transform={`translate(0,${shackle > 0 ? 0 : 0})`} />
          <rect x={108} y={108} width={84} height={70} rx={12} fill={t >= T.OPEN ? '#16a34a' : '#e2e8f0'} />
          <circle cx={150} cy={140} r={9} fill={t >= T.OPEN ? '#dcfce7' : '#1e293b'} />
          <rect x={146} y={142} width={8} height={18} rx={3} fill={t >= T.OPEN ? '#dcfce7' : '#1e293b'} />
        </svg>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 16, textAlign: 'center', color: '#e2e8f0', fontSize: 21, fontWeight: 700 }}>{t >= T.OPEN ? '열림 · 로그인 복원' : locked ? '잠김 · 이 PC 에 보관' : '로그인 보관함'}</div>
      </div>
      {miss > 0 && (
        <div style={{ position: 'absolute', left: VAULT.x + VAULT.w - 30, top: VAULT.y - 40, width: 90, height: 90, borderRadius: '50%', background: C.danger, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 54, fontWeight: 900, opacity: miss, transform: `scale(${0.6 + 0.4 * miss})`, zIndex: 5 }}>✕</div>
      )}

      {/* 들어가는 로그인 카드 */}
      {t >= T.END && t < T.LOCK + 0.1 && ['구글 로그인', '패들렛 로그인'].map((n, i) => {
        const p = interpolate(t, [T.IN + i * 0.35, T.LOCK - 0.3], [0, 1], easeInOut);
        return (
          <div key={n} style={{ position: 'absolute', left: 80 + (VAULT.x + 70 - 80) * p, top: 640 + i * 70 + (60 - i * 70) * p, transform: `scale(${1 - 0.5 * p})`, opacity: 1 - p * 0.9, padding: '10px 16px', borderRadius: 12, background: '#fff', border: `2px solid ${C.line}`, fontSize: 20, fontWeight: 700, whiteSpace: 'nowrap', zIndex: 4 }}>{n}</div>
        );
      })}
      {t >= T.END && t < T.LOCK + 0.4 && (
        <div style={{ position: 'absolute', left: 80, top: 600, opacity: window4(t, T.END, T.END + 0.3, T.LOCK, T.LOCK + 0.4) }}><Chip tone="danger" style={{ fontSize: 20 }}>수업 끝</Chip></div>
      )}

      {/* 방문자: QR 승인한 사람 */}
      {visitor && (
        <div style={{ position: 'absolute', left: 660, top: 610, width: 330, padding: '16px 20px', borderRadius: 18, background: '#fff', border: `3px solid ${visitor === 'same' ? C.primary : '#0f766e'}`, opacity: Math.min(1, vis * 1.5), transform: `translateX(${(1 - vis) * 40}px)` }}>
          <div style={{ fontSize: 18, color: C.muted, fontWeight: 600 }}>{visitor === 'same' ? '다음 수업 · 같은 PC' : '다른 사람이 이 PC 에서'}</div>
          <div style={{ fontSize: 26, fontWeight: 850, marginTop: 4 }}>{visitor === 'same' ? '김기전 선생님' : '이영희 선생님'}</div>
          <div style={{ fontSize: 20, marginTop: 4 }}>휴대폰으로 QR 승인</div>
          {visitor === 'other' && t >= T.MISS && <div style={{ marginTop: 8, fontSize: 20, fontWeight: 800, color: C.danger }}>열쇠가 맞지 않음 — 못 엶</div>}
          {visitor === 'same' && t >= T.OPEN && <div style={{ marginTop: 8, fontSize: 20, fontWeight: 800, color: C.ok }}>맞는 열쇠 — 로그인된 채 시작</div>}
        </div>
      )}

      {/* 열쇠가 내려오는 길 — 가운데를 지난다 */}
      {t >= T.OTHER && (
        <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2, opacity: interpolate(t, [T.OTHER, T.OTHER + 0.4], [0, 1]) }}>
          <path d="M1270,470 C1100,380 820,400 620,610" fill="none" stroke="#a5b4fc" strokeWidth={4} strokeDasharray="6 10" />
        </svg>
      )}
      {t >= T.OTHER && (
        <div style={{ position: 'absolute', left: 780, top: 380, zIndex: 3, opacity: interpolate(t, [T.OTHER, T.OTHER + 0.4], [0, 1]) }}>
          <Chip tone="primary" style={{ fontSize: 21 }}>같은 선생님 × 같은 PC 의 QR 승인일 때만 내려옴</Chip>
        </div>
      )}

      {/* 열쇠 — 위층에서 아래층으로 */}
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 6 }}>
        {HOOK.map((h, i) => <line key={i} x1={h.x} y1={336} x2={h.x} y2={KEY_Y - 20} stroke="#a5b4fc" strokeWidth={3} />)}
        {HOOK.map((h, i) => {
          const p = keyPos(t, i);
          const moving = p.x !== h.x;
          return <KeyShape key={i} x={p.x} y={p.y} col={h.col} rot={p.rot} label={moving ? undefined : `${h.who} × ${h.pc}`} />;
        })}
      </svg>

      {/* 결과: 독의 구글 ✓ */}
      {t >= T.DOCK && (
        <div style={{ position: 'absolute', left: 1160, top: 610, opacity: Math.min(1, dock * 1.5), transform: `translateY(${(1 - dock) * 30}px)` }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.muted, marginBottom: 8 }}>다음 수업의 독</div>
          <Dock tiles={BASE_TILES.slice(0, 4).map((x) => (x.id === 'google' ? { ...x, badge: '✓', badgeTone: 'ok' as const } : x))} k={0.85} width={650} />
        </div>
      )}
      {t >= T.DEL && (
        <div style={{ position: 'absolute', left: 1160, top: 760, width: 690, display: 'flex', flexDirection: 'column', gap: 10, opacity: interpolate(t, [T.DEL, T.DEL + 0.4], [0, 1]) }}>
          <Chip tone="danger" style={{ fontSize: 19, justifyContent: 'flex-start' }}>지우기 ① 교실 구글 창 [이 PC 로그인 지우기]</Chip>
          <Chip tone="danger" style={{ fontSize: 19, justifyContent: 'flex-start' }}>지우기 ② 스페이스기전 교실 기기 › 보관한 구글 로그인 [지우기]</Chip>
          <Chip tone="muted" style={{ fontSize: 19, justifyContent: 'flex-start' }}>60일 동안 쓰지 않으면 저절로 지웁니다</Chip>
        </div>
      )}

      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S22() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
