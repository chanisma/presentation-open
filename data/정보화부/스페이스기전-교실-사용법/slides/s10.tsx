import { Scene, useSceneTime, interpolate, easeInOut, spring } from '../../../../src/scene';
import { C, Head, SceneSubs, QrWindow, Dock, BASE_TILES, Chip, window4, ring, type SlideMeta, type Sub } from '../kit';
import { Widget, WinTitle } from './_pc';

/* 10 — scene: 교실 PC는 늘 QR을 기다린다
   메타포: 하루를 도는 궤도. Windows 시작에서 궤도로 들어와 위젯 → QR 창 → 수업 중(독) → 정리 → 다시 위젯.
   가운데에는 점이 선 정거장의 실제 화면이 뜬다. 오른쪽 위에는 실제 바탕 화면 구석의 위젯. */

const DUR = 15.5;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '교실 PC의 «스페이스기전 교실»은 Windows를 켜면 저절로 켜집니다.' },
  { at: 2.6, text: '평소에는 화면 오른쪽 아래 작은 위젯으로 기다립니다. 위젯의 작은 QR을 찍어도 연결됩니다.' },
  { at: 6.4, text: 'QR 창의 ✕는 프로그램을 끄지 않고 내리기만 합니다. 10분 동안 아무도 쓰지 않으면 다시 뜹니다.' },
  { at: 11.0, text: '갑자기 꺼져도 스스로 다시 켜지고, 새 판은 수업이 없을 때 알아서 바뀝니다.' },
];

const CX = 960, CY = 530, R = 262;
const ST = [
  { a: -90, name: '작은 위젯', sub: '쉬는 시간' },
  { a: 0, name: 'QR 창', sub: '선생님을 기다림' },
  { a: 90, name: '수업 중', sub: '화면 아래 독' },
  { a: 180, name: '정리', sub: '수업 끝' },
];
const ENTRY = { x: 470, y: 250 };
const pt = (a: number) => [CX + R * Math.cos((a * Math.PI) / 180), CY + R * Math.sin((a * Math.PI) / 180)];

/* 점의 일정: [도착 시각, 각도] — 각도는 계속 늘어난다(한 바퀴 = 360) */
const LEGS: [number, number][] = [[2.4, -90], [3.6, -90], [5.2, 0], [7.8, 0], [9.2, 90], [10.0, 90], [11.2, 180], [11.8, 180], [13.0, 270]];

function dotPos(t: number): [number, number] {
  if (t < 2.4) {
    const u = interpolate(t, [0.6, 2.4], [0, 1], easeInOut);
    const [wx, wy] = pt(-90);
    return [ENTRY.x + (wx - ENTRY.x) * u, ENTRY.y + (wy - ENTRY.y) * u];
  }
  let a = LEGS[LEGS.length - 1][1];
  for (let i = 0; i < LEGS.length - 1; i++) {
    const [t0, a0] = LEGS[i];
    const [t1, a1] = LEGS[i + 1];
    if (t >= t0 && t <= t1) { a = interpolate(t, [t0, t1], [a0, a1], easeInOut); break; }
  }
  return pt(a) as [number, number];
}

/** 가운데 미리 보기 — 지금 점이 선 정거장의 화면 */
function Preview({ t }: { t: number }) {
  const box = { position: 'absolute' as const, left: CX - 210, top: CY - 135, width: 420, height: 270, display: 'grid', placeItems: 'center' };
  const win = window4(t, -1, 0, 2.2, 2.6);
  const wid = Math.max(window4(t, 2.2, 2.6, 5.0, 5.4), interpolate(t, [12.8, 13.3], [0, 1]));
  const qr = window4(t, 5.0, 5.4, 9.0, 9.4);
  const dock = window4(t, 9.0, 9.4, 11.0, 11.4);
  const end = window4(t, 11.0, 11.4, 12.8, 13.2);
  return (
    <>
      <div style={{ ...box, opacity: win }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, width: 96, margin: '0 auto' }}>
            {[0, 1, 2, 3].map((i) => <span key={i} style={{ height: 45, borderRadius: 4, background: 'linear-gradient(135deg,#60a5fa,#1d4ed8)' }} />)}
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 16 }}>Windows 를 켜면</div>
          <div style={{ fontSize: 20, color: C.muted, marginTop: 4 }}>자동으로 실행</div>
        </div>
      </div>
      <div style={{ ...box, opacity: wid }}><Widget k={1.15} style={{ position: 'relative' }} /></div>
      <div style={{ ...box, opacity: qr }}>
        <div style={{ position: 'relative', width: 400, height: 250, borderRadius: 10, overflow: 'hidden', boxShadow: '0 16px 36px -14px rgba(15,23,42,.45)', background: C.bg }}>
          <WinTitle title="스페이스기전 교실" k={0.62} xStyle={{ ...(t > 6.6 ? { background: '#e81123', color: '#fff' } : {}), ...ring(t, 6.6, '#e81123') }} />
          <QrWindow k={0.3125} style={{ position: 'absolute', left: 0, top: 21, width: 400, height: 229 }} />
        </div>
      </div>
      <div style={{ ...box, opacity: dock }}><Dock tiles={BASE_TILES} k={0.44} style={{ position: 'relative' }} /></div>
      <div style={{ ...box, opacity: end }}><Dock tiles={BASE_TILES} k={0.44} style={{ position: 'relative' }} ending="정리하는 중입니다." /></div>
    </>
  );
}

function Stage() {
  const t = useSceneTime();
  const [dx, dy] = dotPos(t);
  const [wx, wy] = pt(-90);
  const near = (a: number) => {
    const [x, y] = pt(a);
    return Math.hypot(dx - x, dy - y) < 30;
  };
  const dial = spring(t, 6.4, 0.6);
  const hand = interpolate(t, [6.8, 10.4], [0, 359.5]);
  const chipA = spring(t, 11.2, 0.6);
  const chipB = spring(t, 11.8, 0.6);
  return (
    <>
      <Head chapter="③ 교실 PC · 1/2" title="교실 PC는 늘 QR을 기다립니다" />

      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0 }}>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke={C.line} strokeWidth={14} />
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="color-mix(in srgb, #4f46e5 22%, transparent)" strokeWidth={4} strokeDasharray="3 16" strokeLinecap="round" />
        {/* 진행 방향 화살표 4개 */}
        {[-45, 45, 135, 225].map((a) => {
          const [x, y] = pt(a);
          return <path key={a} d="M-11,-9 L5,0 L-11,9 Z" fill={C.faint} transform={`translate(${x},${y}) rotate(${a + 90})`} />;
        })}
        {/* Windows 시작 → 궤도 진입 */}
        <path d={`M${ENTRY.x + 50},${ENTRY.y + 6} L${wx - 64},${wy - 2}`} stroke={C.faint} strokeWidth={4} strokeDasharray="8 8" />
        <path d="M-12,-10 L6,0 L-12,10 Z" fill={C.faint} transform={`translate(${wx - 62},${wy - 2}) rotate(3)`} />
        {/* 위젯 정거장 → 실제 바탕 화면 구석 */}
        <path d={`M${wx + 48},${wy + 34} C1150,330 1300,320 1418,300`} stroke={C.primary} strokeWidth={3} strokeDasharray="6 8" fill="none" opacity={0.6} />
      </svg>

      {/* 진입점: Windows 시작 */}
      <div style={{ position: 'absolute', left: ENTRY.x - 46, top: ENTRY.y - 46, width: 92, height: 92, borderRadius: 22, background: C.card, border: `2px solid ${C.line}`, display: 'grid', placeItems: 'center', boxShadow: t < 2.4 ? '0 0 0 8px rgba(79,70,229,.15)' : undefined }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, width: 44 }}>
          {[0, 1, 2, 3].map((i) => <span key={i} style={{ height: 20, borderRadius: 3, background: 'linear-gradient(135deg,#60a5fa,#1d4ed8)' }} />)}
        </div>
      </div>
      <div style={{ position: 'absolute', left: ENTRY.x - 140, top: ENTRY.y + 56, width: 280, textAlign: 'center', fontSize: 24, fontWeight: 800 }}>Windows 시작</div>

      {/* 정거장 */}
      {ST.map((s, i) => {
        const [x, y] = pt(s.a);
        const on = near(s.a);
        const lab: Record<number, React.CSSProperties> = {
          0: { left: x + 70, top: y - 44, textAlign: 'left' },
          1: { left: x + 72, top: y - 92, textAlign: 'left' },
          2: { left: x - 150, top: y + 64, textAlign: 'center' },
          3: { left: x - 372, top: y - 30, textAlign: 'right' },
        };
        return (
          <div key={s.name}>
            <div style={{ position: 'absolute', left: x - 56, top: y - 56, width: 112, height: 112, borderRadius: '50%', background: on ? C.primary : C.card, border: `4px solid ${on ? C.primary : C.line}`, color: on ? '#fff' : C.muted, display: 'grid', placeItems: 'center', fontSize: 36, fontWeight: 850, boxShadow: on ? '0 0 0 12px rgba(79,70,229,.18)' : undefined }}>{i + 1}</div>
            <div style={{ position: 'absolute', width: i === 2 ? 300 : 300, ...lab[i] }}>
              <div style={{ fontSize: 30, fontWeight: 850, letterSpacing: -0.8, color: on ? C.primary : C.ink }}>{s.name}</div>
              <div style={{ fontSize: 20, color: C.muted, marginTop: 2 }}>{s.sub}</div>
            </div>
          </div>
        );
      })}

      {/* 궤도를 도는 점 */}
      <span style={{ position: 'absolute', left: dx - 20, top: dy - 20, width: 40, height: 40, borderRadius: '50%', background: '#facc15', border: '5px solid #fff', boxShadow: '0 6px 18px rgba(15,23,42,.35)', zIndex: 5 }} />

      <Preview t={t} />

      {/* 실제 바탕 화면 오른쪽 아래 구석 */}
      <div style={{ position: 'absolute', left: 1420, top: 184, width: 440, height: 224, borderRadius: 16, overflow: 'hidden', background: 'radial-gradient(120% 120% at 20% 0%, #2f5f96, #1f3b63)', boxShadow: '0 20px 40px -24px rgba(15,23,42,.6)' }}>
        <div style={{ position: 'absolute', left: 16, top: 12, color: 'rgba(255,255,255,.85)', fontSize: 18, fontWeight: 700 }}>바탕 화면 오른쪽 아래</div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 30, background: 'rgba(232,236,244,.92)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingRight: 12, fontSize: 12, color: C.ink }}>10:31</div>
        <Widget k={1} style={{ right: 14, bottom: 42, ...(t > 2.4 && t < 6 ? ring(t, 2.4) : {}) }} />
      </div>

      {/* ✕ = 내림, 10분 뒤 다시 */}
      {t >= 6.4 && (
        <div style={{ position: 'absolute', left: 1330, top: 610, display: 'flex', alignItems: 'center', gap: 18, opacity: Math.min(1, dial * 1.5), transform: `scale(${0.9 + 0.1 * dial})`, transformOrigin: 'left center' }}>
          <svg width={110} height={110} viewBox="-55 -55 110 110">
            <circle r={48} fill="#fff" stroke={C.line} strokeWidth={4} />
            <path d={`M0,0 L0,-48 A48,48 0 ${hand > 180 ? 1 : 0} 1 ${48 * Math.sin((hand * Math.PI) / 180)},${-48 * Math.cos((hand * Math.PI) / 180)} Z`} fill="color-mix(in srgb, #4f46e5 22%, transparent)" />
            <line x1={0} y1={0} x2={34 * Math.sin((hand * Math.PI) / 180)} y2={-34 * Math.cos((hand * Math.PI) / 180)} stroke={C.primary} strokeWidth={5} strokeLinecap="round" />
            <circle r={6} fill={C.primary} />
          </svg>
          <div style={{ fontSize: 22, lineHeight: 1.5 }}>
            <div><b style={{ color: '#e81123' }}>✕</b> 를 누르면 → <b>위젯으로 내림</b></div>
            <div style={{ color: C.muted }}>10분 동안 안 쓰면 → <b style={{ color: C.ink }}>QR 창 다시</b></div>
          </div>
        </div>
      )}

      {/* 스스로 지키는 두 가지 */}
      <div style={{ position: 'absolute', left: 72, top: 760, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ opacity: Math.min(1, chipA * 1.5), transform: `translateX(${(1 - chipA) * -30}px)` }}><Chip tone="ok">갑자기 꺼지면 → 스스로 다시 켜짐</Chip></div>
        <div style={{ opacity: Math.min(1, chipB * 1.5), transform: `translateX(${(1 - chipB) * -30}px)` }}><Chip>새 판 → 수업이 없을 때 바꿈</Chip></div>
      </div>

      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S10() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
