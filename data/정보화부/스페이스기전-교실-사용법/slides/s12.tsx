import { Scene, useSceneTime, interpolate, easeInOut, spring } from '../../../../src/scene';
import {
  C, Head, SceneSubs, Cursor, ring, Monitor, Desktop, QrWindow, Dock, BASE_TILES, Phone, WebBar, DeviceCard,
  PresetCard, OptionRow, SectionLabel, ApproveBar, ConnectedPanel, QR, LOOK, window4, type SlideMeta, type Sub,
} from '../kit';

/* 12 — walkthrough: 수업 시작 — QR 찍고 «이 기기에 펼치기»
   구도: 왼쪽 교실 PC 모니터 · 오른쪽 휴대폰. 두 기기 사이로 신호가 한 번 갔다가(QR 스캔) 돌아온다(펼치기). */

const T = {
  PHONE_IN: 0.3, SCAN: 0.8, DETECT: 1.8, SIG1: 1.5, PAGE: 2.8,
  MATCH: 3.4, SET: 6.3, OPT: 7.5, TAP: 9.6, CONSENT: 10.0, CONT: 11.2, DONE: 11.9, SIG2: 12.0, FOLD: 12.7, DOCK: 13.3,
};
const DUR = 16;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '교실 PC의 QR을 휴대폰 카메라로 찍으면 승인 화면이 열립니다.' },
  { at: 3.0, text: '맨 위 기기 이름이 교실 화면의 이름과 같은지 먼저 확인하세요.' },
  { at: 6.0, text: '이 반 세팅은 미리 골라져 있습니다. «내 구글 드라이브 연결»과 «로그인 보관»은 켜 둔 채로 두면 됩니다.' },
  { at: 9.0, text: '[이 기기에 펼치기]를 누르세요. 처음 한 번은 구글 허용 창이 뜹니다.' },
  { at: 11.9, text: '휴대폰에 «교실 화면에 펼쳤습니다»가 뜨고, 교실 PC 화면 아래에 독이 나타납니다.' },
];

/* 무대 좌표(px) — 모니터 화면 1120×630, 휴대폰 폭 360 */
const MON = { x: 72, y: 214, w: 1120, h: 630 };
const PH = { x: 1490, y: 168, w: 360 };
const SW = PH.w - PH.w * 0.064; // 휴대폰 화면 폭
/* 포인터 좌표(씬 %) — measure_pointer.mjs 실측 */
const TG = { tap: { x: 88.6, y: 81.7 }, cont: { x: 93.3, y: 83.7 } }; // 2026-10-15 실측

function bez(p0: number[], p1: number[], p2: number[], u: number) {
  const a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u;
  return [a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]];
}

/** 신호 — 곡선을 따라 흐르는 점 다섯 개 */
function Signal({ t, at, p0, p1, p2, color }: { t: number; at: number; p0: number[]; p1: number[]; p2: number[]; color: string }) {
  if (t < at || t > at + 1.5) return null;
  const d = `M${p0[0]},${p0[1]} Q${p1[0]},${p1[1]} ${p2[0]},${p2[1]}`;
  const fade = window4(t, at, at + 0.2, at + 1.2, at + 1.5);
  return (
    <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'none', opacity: fade }}>
      <path d={d} fill="none" stroke={color} strokeWidth={3} strokeDasharray="2 10" strokeLinecap="round" opacity={0.5} />
      {[0, 1, 2, 3, 4].map((i) => {
        const u = Math.max(0, Math.min(1, (t - at) / 1.0 - i * 0.07));
        const [x, y] = bez(p0, p1, p2, u);
        return <circle key={i} cx={x} cy={y} r={9 - i * 1.4} fill={color} opacity={u > 0 && u < 1 ? 1 - i * 0.15 : 0} />;
      })}
    </svg>
  );
}

function PhoneScreen({ t }: { t: number }) {
  const u = SW / 100;
  const camera = t < T.PAGE;
  if (camera) {
    const scanY = interpolate(t, [T.SCAN, T.SCAN + 1.0], [18, 78]) % 100;
    const pill = interpolate(t, [T.DETECT, T.DETECT + 0.3], [0, 1]);
    return (
      <div style={{ position: 'absolute', inset: 0, background: '#0b1220', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: '50%', top: '42%', transform: 'translate(-50%,-50%) rotate(-4deg)', opacity: 0.92 }}>
          <QR size={SW * 0.55} seed={3} />
        </div>
        {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b], i) => (
          <span key={i} style={{ position: 'absolute', left: `${18 + a * 64}%`, top: `${20 + b * 44}%`, width: 30, height: 30, transform: `translate(${a ? -100 : 0}%, ${b ? -100 : 0}%)`,
            borderColor: '#fde047', borderStyle: 'solid', borderWidth: `${b ? 0 : 4}px ${a ? 4 : 0}px ${b ? 4 : 0}px ${a ? 0 : 4}px`, borderRadius: 6 }} />
        ))}
        {t > T.SCAN && t < T.DETECT + 0.4 && <span style={{ position: 'absolute', left: '18%', right: '18%', top: `${scanY}%`, height: 3, background: '#fde047', boxShadow: '0 0 12px #fde047' }} />}
        <div style={{ position: 'absolute', left: '50%', bottom: '14%', transform: `translate(-50%, ${(1 - pill) * 12}px)`, opacity: pill, background: '#fde047', color: '#111', borderRadius: 99, padding: `${2.2 * u}px ${4.4 * u}px`, fontSize: 3.6 * u, fontWeight: 700, whiteSpace: 'nowrap' }}>
          spacekijun.lovable.app 열기
        </div>
      </div>
    );
  }
  const done = t >= T.DONE;
  const consent = t >= T.CONSENT && t < T.DONE;
  const sheet = spring(t, T.CONSENT, 0.5);
  const matchGlow = t >= T.MATCH && t < T.SET ? 0.5 + 0.5 * Math.sin((t - T.MATCH) * 5) : 0;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: C.bg }}>
      <WebBar w={SW} />
      {!done ? (
        <div style={{ position: 'relative', flex: 1, padding: 3.6 * u, overflow: 'hidden' }}>
          <DeviceCard w={SW - 7.2 * u} style={{ boxShadow: matchGlow ? `0 0 0 ${4 + 4 * matchGlow}px rgba(250,204,21,${0.35 + 0.4 * matchGlow})` : undefined }} />
          <SectionLabel w={SW}>펼칠 세팅</SectionLabel>
          <PresetCard w={SW - 7.2 * u} title="1-3 정보 수업" section="정보 1-3" now checked tiles={[LOOK.classroom, LOOK.site, LOOK.powerpoint, LOOK.space]}
            style={{ ...ring(t, T.SET, '#2563eb') }} />
          <PresetCard w={SW - 7.2 * u} title="2-1 인공지능 수업" section="인공지능 2-1" minutes={50} tiles={[LOOK.site, LOOK.folder]} style={{ marginTop: 2.4 * u }} />
          <SectionLabel w={SW}>이번 수업</SectionLabel>
          <div style={{ borderRadius: 5 * u, background: C.card, border: `1px solid ${C.line}`, ...ring(t, T.OPT, '#2563eb') }}>
            <OptionRow w={SW - 7.2 * u} look={LOOK.mydrive} title="내 구글 드라이브 연결" text="독에서 드라이브를 폴더처럼 열고, 저장하면 드라이브에 올라갑니다." />
            <div style={{ height: 1, background: C.line }} />
            <OptionRow w={SW - 7.2 * u} look="key" title="이 PC에 로그인 보관" text="수업이 끝날 때 사이트 로그인을 암호화해 이 PC에 남깁니다." />
          </div>
          <ApproveBar w={SW} refName="approve" glow={ring(t, T.TAP, '#2563eb')} />
          {consent && (
            <>
              <div style={{ position: 'absolute', inset: 0, background: `rgba(15,23,42,${0.45 * sheet})` }} />
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, transform: `translateY(${(1 - sheet) * 100}%)`, background: '#fff', borderRadius: `${6 * u}px ${6 * u}px 0 0`, padding: `${6 * u}px ${5 * u}px ${5 * u}px` }}>
                <div style={{ fontSize: 4.4 * u, fontWeight: 700, color: '#1f2937' }}>Google 계정으로 계속</div>
                <div style={{ fontSize: 3.2 * u, color: C.muted, marginTop: 1.5 * u, lineHeight: 1.5 }}>스페이스기전이 이 수업 동안 «내 드라이브»를 쓰도록 허용합니다.</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2.5 * u, marginTop: 4 * u, padding: 3 * u, border: `1px solid ${C.line}`, borderRadius: 3 * u }}>
                  <span style={{ width: 8 * u, height: 8 * u, borderRadius: '50%', background: '#c7d2fe', color: '#3730a3', display: 'grid', placeItems: 'center', fontSize: 3.6 * u, fontWeight: 800 }}>김</span>
                  <div style={{ fontSize: 3.3 * u }}>
                    <div style={{ fontWeight: 600 }}>김기전</div>
                    <div style={{ color: C.muted }}>teacher@myschool.hs.kr</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 2 * u, marginTop: 5 * u }}>
                  <span style={{ padding: `${2.4 * u}px ${4 * u}px`, fontSize: 3.6 * u, color: '#1a73e8', fontWeight: 600 }}>취소</span>
                  <span data-pt="continue" style={{ padding: `${2.4 * u}px ${6 * u}px`, fontSize: 3.6 * u, background: '#1a73e8', color: '#fff', borderRadius: 99, fontWeight: 600, ...ring(t, T.CONT, '#1a73e8') }}>계속</span>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, padding: 3.6 * u, ...{ opacity: interpolate(t, [T.DONE, T.DONE + 0.3], [0, 1]) } }}>
          <DeviceCard w={SW - 7.2 * u} label="연결된 기기" left={null} />
          <ConnectedPanel w={SW - 7.2 * u} style={{ marginTop: 3 * u }} />
        </div>
      )}
    </div>
  );
}

function Stage() {
  const t = useSceneTime();
  const phoneIn = spring(t, T.PHONE_IN, 0.7);
  const fold = interpolate(t, [T.FOLD, T.FOLD + 0.6], [0, 1], easeInOut);
  const dockUp = spring(t, T.DOCK, 0.8);
  const match = t >= T.MATCH && t < T.SET;
  const matchK = window4(t, T.MATCH, T.MATCH + 0.4, T.SET - 0.4, T.SET);
  return (
    <>
      <Head chapter="④ 수업 시작과 독 · 1/3" title="QR 찍고 «이 기기에 펼치기»" />

      <Monitor x={MON.x} y={MON.y} w={MON.w} h={MON.h}>
        <Desktop style={{ inset: 0 }}>
          {fold < 1 && (
            <QrWindow k={0.8} style={{ left: 0, top: 0, width: MON.w, height: MON.h - 44, opacity: 1 - fold, transform: `scale(${1 - 0.25 * fold}) translateY(${fold * 80}px)`, transformOrigin: '85% 100%' }}
              refs={{ device: 'monitor-name' }} />
          )}
          {t >= T.DOCK && (
            <Dock tiles={BASE_TILES} k={0.86} style={{ left: '50%', bottom: 58, transform: `translate(-50%, ${(1 - dockUp) * 160}px)`, opacity: Math.min(1, dockUp * 1.6) }} />
          )}
        </Desktop>
      </Monitor>
      {/* 모니터 쪽 기기 이름 강조 — 휴대폰 기기 카드와 같은 이름인지 대조 */}
      {match && (
        <span style={{ position: 'absolute', left: 632, top: 368, width: 164, height: 62, borderRadius: 12, border: '4px solid #facc15', opacity: matchK, boxShadow: '0 0 0 6px rgba(250,204,21,.25)', zIndex: 25 }} />
      )}
      {match && (
        <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, zIndex: 24, pointerEvents: 'none', opacity: matchK }}>
          <path d="M798,399 C1100,380 1330,300 1520,318" fill="none" stroke="#eab308" strokeWidth={4} strokeDasharray="10 9" />
          <g transform="translate(1226,338)">
            <rect x={-62} y={-26} width={124} height={52} rx={26} fill="#fef9c3" stroke="#eab308" strokeWidth={3} />
            <text x={0} y={9} textAnchor="middle" fontSize={26} fontWeight={800} fill="#854d0e">같은 이름</text>
          </g>
        </svg>
      )}

      <Signal t={t} at={T.SIG1} p0={[470, 520]} p1={[1150, 150]} p2={[1640, 420]} color={C.primary} />
      <Signal t={t} at={T.SIG2} p0={[1560, 760]} p1={[1300, 900]} p2={[700, 800]} color="#10b981" />

      <div style={{ position: 'absolute', inset: 0, transform: `translateX(${(1 - phoneIn) * 520}px)`, opacity: Math.min(1, phoneIn * 2) }}>
        <Phone x={PH.x} y={PH.y} w={PH.w} url={t >= T.PAGE ? 'spacekijun.lovable.app/classroom/link' : undefined}>
          <PhoneScreen t={t} />
        </Phone>
      </div>

      <Cursor path={[
        { t: 8.7, x: 80, y: 90, finger: true },
        { t: T.TAP, x: TG.tap.x, y: TG.tap.y, click: true, finger: true },
        { t: T.CONT, x: TG.cont.x, y: TG.cont.y, click: true, finger: true },
        { t: 11.7, x: TG.cont.x, y: TG.cont.y, hide: true, finger: true },
      ]} />
      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S12() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
