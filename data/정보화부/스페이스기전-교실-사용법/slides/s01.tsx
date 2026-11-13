import { Scene, useSceneTime, interpolate, easeInOut, spring } from '../../../../src/scene';
import {
  C, Head, SceneSubs, Cursor, ring, Monitor, Desktop, QrWindow, Dock, BASE_TILES, Phone, QR, Glyph, LOOK, Chip, window4,
  type SlideMeta, type Sub,
} from '../kit';

/* 1 — scene: QR 한 번이면 수업 도구가 화면 아래에
   무대: 교실 PC 모니터 한 대(가운데 dominant). QR → 타일이 위에서 떨어져 독으로 정렬 → 드라이브 열고 닫기 →
   수업 끝: 타일이 사라지고 파일 하나가 드라이브로 날아간 뒤 다시 QR. 30장이 이 무대를 거울상으로 다시 쓴다. */

const T = { PHONE_IN: 0.5, SCAN: 1.3, PHONE_OUT: 3.0, FOLD: 3.0, DOCK: 3.3, DROP: 3.6, DRIVE: 7.6, EXP: 7.9, EXP_OUT: 10.3, END: 11.4, VANISH: 11.8, FLY: 12.0, QR_BACK: 13.6 };
const DUR = 15.5;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '스페이스기전 교실은 교실 PC에서 내 수업 도구를 꺼내 주는 프로그램입니다.' },
  { at: 3.0, text: '휴대폰으로 화면의 QR을 찍으면, 미리 만들어 둔 세팅이 화면 아래 «독»에 놓입니다.' },
  { at: 7.0, text: '드라이브·사이트·프로그램을 누르기만 하면 열립니다. 저절로 열리지는 않습니다.' },
  { at: 11.0, text: '수업이 끝나면 고친 파일은 드라이브에 올리고, 교실 PC의 사본과 로그인은 지웁니다.' },
];

/* 무대 — 모니터 화면 1200×675 (30장이 같은 값으로 거울상을 만든다) */
export const STAGE1 = { x: 346, y: 196, w: 1200, h: 675 };
const MON = STAGE1;
const DOCK_K = 1.05;
/* 포인터 좌표(씬 %) — measure_pointer.mjs 실측 2026-10-15 */
const TG = { drive: { x: 43.5, y: 70.8 }, end: { x: 71.3, y: 70.8 } };

function Explorer({ t }: { t: number }) {
  const s = spring(t, T.EXP, 0.5);
  const out = interpolate(t, [T.EXP_OUT, T.EXP_OUT + 0.35], [1, 0]);
  if (t < T.EXP || t > T.EXP_OUT + 0.4) return null;
  const rows: [string, string, string][] = [['folder', '3주차', '10. 14.'], ['word', '활동지.docx', '10. 14.'], ['file', '수행평가 안내', '10. 10.'], ['folder', '자료 폴더', '10. 14.'], ['word', '모둠 역할표.docx', '10. 13.']];
  return (
    <div style={{ position: 'absolute', left: 250, top: 60, width: 700, height: 400, background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 30px 60px -20px rgba(15,23,42,.6)', opacity: Math.min(1, s * 1.5) * out, transform: `scale(${0.9 + 0.1 * s})`, transformOrigin: '30% 100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 36, display: 'flex', alignItems: 'center', padding: '0 14px', borderBottom: `1px solid ${C.line}`, fontSize: 15, color: C.muted }}>드라이브 — 스페이스기전 교실</div>
      <div style={{ flex: 1, display: 'flex' }}>
        <div style={{ width: 190, background: '#f8fafc', borderRight: `1px solid ${C.line}`, padding: 14, fontSize: 15, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <b>내 드라이브</b><span style={{ color: C.muted }}>공유 문서함</span><span style={{ color: C.muted }}>이 PC 에 복사한 파일</span><span style={{ color: C.primary, fontWeight: 700 }}>1-3 정보 수업자료</span>
        </div>
        <div style={{ flex: 1, padding: '12px 18px' }}>
          <div style={{ fontSize: 14, color: C.muted, marginBottom: 10 }}>1-3 정보 수업자료</div>
          {rows.map(([lk, name, d]) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: `1px solid ${C.line}`, fontSize: 17 }}>
              <Glyph look={lk === 'folder' ? LOOK.folder : lk === 'word' ? LOOK.word : LOOK.docs} size={30} />
              <span style={{ flex: 1 }}>{name}</span><span style={{ color: C.muted, fontSize: 14 }}>{d}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stage() {
  const t = useSceneTime();
  const phoneIn = spring(t, T.PHONE_IN, 0.6);
  const phoneOut = interpolate(t, [T.PHONE_OUT, T.PHONE_OUT + 0.5], [0, 1], easeInOut);
  const fold = interpolate(t, [T.FOLD, T.FOLD + 0.5], [0, 1], easeInOut);
  const qrBack = spring(t, T.QR_BACK, 0.7);
  const qrShown = t < T.FOLD + 0.5 || t >= T.QR_BACK;
  const qrOpacity = t >= T.QR_BACK ? Math.min(1, qrBack * 1.4) : 1 - fold;
  const dockIn = spring(t, T.DOCK, 0.6);
  const dockGone = interpolate(t, [T.VANISH + 1.4, T.VANISH + 1.8], [0, 1]);
  const showDock = t >= T.DOCK && dockGone < 1;
  const scanY = interpolate(t, [T.SCAN, T.SCAN + 1.2], [10, 90]);
  const tiles = BASE_TILES.map((tl, i) => {
    const drop = spring(t, T.DROP + i * 0.28, 0.75);
    const gone = interpolate(t, [T.VANISH + i * 0.18, T.VANISH + i * 0.18 + 0.3], [0, 1]);
    return {
      ...tl,
      spin: tl.id === 'drive' && t > T.DRIVE && t < T.EXP ? (t - T.DRIVE) * 520 : undefined,
      style: { transform: `translateY(${-(1 - drop) * 520}px) scale(${1 - 0.6 * gone})`, opacity: Math.min(1, drop * 3) * (1 - gone), ...(tl.id === 'drive' ? ring(t, T.DRIVE) : {}) },
    };
  });
  // 수업 끝 — 고친 파일이 드라이브 칩으로 날아간다
  const fly = interpolate(t, [T.FLY, T.FLY + 1.3], [0, 1], easeInOut);
  const fx = 900 + (1640 - 900) * fly;
  const fy = 640 - Math.sin(fly * Math.PI) * 300 + (300 - 640) * fly;
  const chip = spring(t, T.FLY - 0.3, 0.5);
  return (
    <>
      <Head chapter="① 시작하며" kicker="스페이스기전 교실 사용 방법" title="QR 한 번, 수업 준비 끝" />

      <Monitor x={MON.x} y={MON.y} w={MON.w} h={MON.h}>
        <Desktop style={{ inset: 0 }}>
          {qrShown && (
            <QrWindow k={0.84} style={{ left: 0, top: 0, width: MON.w, height: MON.h - 44, opacity: qrOpacity, transform: `scale(${t >= T.QR_BACK ? 0.94 + 0.06 * qrBack : 1 - 0.2 * fold})`, transformOrigin: '50% 100%' }} />
          )}
          {t > 5.0 && t < T.EXP + 0.3 && (
            <div style={{ position: 'absolute', left: 0, right: 0, top: 210, textAlign: 'center', color: '#fff', opacity: window4(t, 5.0, 5.5, T.EXP - 0.2, T.EXP + 0.3) }}>
              <div style={{ fontSize: 22, opacity: 0.75, fontWeight: 600 }}>내 세팅 «1-3 정보 수업»</div>
              <div style={{ fontSize: 46, fontWeight: 850, letterSpacing: -1.2, marginTop: 6 }}>독에 놓였습니다</div>
              <div style={{ fontSize: 22, opacity: 0.8, marginTop: 10 }}>누르기 전에는 아무것도 열리지 않습니다</div>
              <div style={{ fontSize: 40, marginTop: 24, transform: `translateY(${Math.sin(t * 4) * 6}px)` }}>↓</div>
            </div>
          )}
          <Explorer t={t} />
          {showDock && (
            <Dock tiles={tiles} k={DOCK_K} tileRefs={{ drive: 'drive' }} endRef="end"
              style={{ left: '50%', bottom: 62, transform: `translate(-50%, ${(1 - dockIn) * 140}px)`, opacity: Math.min(1, dockIn * 1.6) * (1 - dockGone), overflow: 'visible' }}
              endStyle={ring(t, T.END, C.danger)} ending={t > T.VANISH + 1.1 ? '정리하는 중입니다.' : undefined} endingSpin={t * 360} />
          )}
        </Desktop>
      </Monitor>

      {/* 휴대폰 — 오른쪽 아래에서 올라와 QR을 비춘다 */}
      {t < T.PHONE_OUT + 0.6 && (
        <div style={{ position: 'absolute', inset: 0, transform: `translate(${phoneOut * 420}px, ${(1 - phoneIn) * 480}px)`, opacity: Math.min(1, phoneIn * 2) * (1 - phoneOut) }}>
          <Phone x={1500} y={470} w={210} style={{ transform: 'rotate(-8deg)' }}>
            <div style={{ position: 'absolute', inset: 0, background: '#0b1220' }}>
              <div style={{ position: 'absolute', left: '50%', top: '45%', transform: 'translate(-50%,-50%)' }}><QR size={120} seed={3} /></div>
              {t > T.SCAN && <span style={{ position: 'absolute', left: '12%', right: '12%', top: `${scanY}%`, height: 3, background: '#fde047', boxShadow: '0 0 12px #fde047' }} />}
            </div>
          </Phone>
        </div>
      )}

      {/* 드라이브 칩 — 수업 끝에 고친 파일이 여기로 */}
      {t >= T.FLY - 0.3 && (
        <div style={{ position: 'absolute', left: 1585, top: 250, opacity: Math.min(1, chip * 1.5), transform: `scale(${0.8 + 0.2 * chip})`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <Glyph look={LOOK.mydrive} size={96} />
          <span style={{ fontSize: 24, fontWeight: 800 }}>구글 드라이브</span>
          {fly >= 1 && <Chip tone="ok">✓ 드라이브에 올림</Chip>}
        </div>
      )}
      {t >= T.FLY && fly < 1 && (
        <div style={{ position: 'absolute', left: fx, top: fy, transform: 'translate(-50%,-50%) rotate(-6deg)', zIndex: 40, display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 12, padding: '10px 16px', boxShadow: '0 14px 30px -10px rgba(15,23,42,.5)', fontSize: 20, fontWeight: 700 }}>
          <Glyph look={LOOK.word} size={36} />활동지.docx
        </div>
      )}

      {/* 교실 PC 쪽 — 지우는 것 */}
      {t >= T.VANISH + 1.2 && (
        <div style={{ position: 'absolute', left: 64, top: 360, width: 262, opacity: interpolate(t, [T.VANISH + 1.2, T.VANISH + 1.7], [0, 1]), display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 24, fontWeight: 800 }}>교실 PC</span>
          {['받은 사본', '수업용 브라우저', '로그인'].map((x) => (
            <span key={x} style={{ fontSize: 21, color: C.muted, textDecoration: 'line-through', textDecorationThickness: 2 }}>{x}</span>
          ))}
          <Chip tone="muted" style={{ alignSelf: 'flex-start' }}>✓ 지움</Chip>
        </div>
      )}

      <Cursor path={[
        { t: 6.9, x: 52, y: 52 },
        { t: T.DRIVE, x: TG.drive.x, y: TG.drive.y, click: true },
        { t: 10.6, x: 58, y: 62 },
        { t: T.END, x: TG.end.x, y: TG.end.y, click: true },
        { t: 12.2, x: TG.end.x, y: TG.end.y, hide: true },
      ]} />
      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S01() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
