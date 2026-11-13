import { Scene, useSceneTime, interpolate, easeInOut, spring } from '../../../../src/scene';
import { C, Head, SceneSubs, Cursor, ring, Desktop, QrWindow, Chip, type SlideMeta, type Sub } from '../kit';
import { typed } from '../../../../src/walkthrough';
import { Widget, WinTitle } from './_pc';

/* 11 — walkthrough: 기기 설정 — 기기 이름 · 자동 실행 · 새 판 · 끝내기
   무대: 슬라이드 = 교실 PC 바탕 화면. 구석의 작은 위젯 하나에서 시작해 QR 창 → 설정 겹창으로 화면이 커진다. */

const T = { OPEN: 1.4, QR_IN: 1.6, SETTINGS: 2.9, DLG: 3.3, NAME: 4.4, TYPE: 4.9, CHECK: 7.6, CHECKED: 8.2, QUIT: 10.5, X: 11.7, SAVE: 13.0, CLOSE: 13.3 };
const DUR = 16.5;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '위젯의 [QR 크게 보기]를 누르면 큰 QR 창이 뜹니다. 오른쪽 위 [기기 설정]을 누르세요.' },
  { at: 4.0, text: '기기 이름을 «2-3 교실»처럼 바꿔 두면, 선생님 휴대폰에 그 이름이 떠서 교실을 헷갈리지 않습니다.' },
  { at: 7.0, text: '[새 판 확인]으로 업데이트를 직접 확인할 수 있습니다. 수업 중에는 바뀌지 않습니다.' },
  { at: 10.0, text: '프로그램을 끄는 것은 [프로그램 끝내기]뿐입니다. 끄면 QR이 뜨지 않으니, 화면만 치우려면 ✕를 누르세요.' },
];

/* 바탕 화면 무대(px) */
const D = { x: 72, y: 170, w: 1776, h: 760 };
const NEW_NAME = '2-3 교실';
const OLD_NAME = 'KIJUN-PC07';
const WK = 1.35; // 위젯 배율
/* 포인터 좌표(씬 %) — measure_pointer.mjs 실측 2026-10-15 */
const TG = {
  open: { x: 83.0, y: 77.3 }, settings: { x: 92.5, y: 23.4 }, name: { x: 50, y: 39.5 }, check: { x: 60.7, y: 57.9 },
  quit: { x: 39.5, y: 65.8 }, x: { x: 94.7, y: 17.7 }, save: { x: 62.7, y: 65.8 },
};

function Settings({ t }: { t: number }) {
  const k = 1.3;
  const s = spring(t, T.DLG, 0.5);
  const out = interpolate(t, [T.CLOSE, T.CLOSE + 0.3], [1, 0]);
  const typing = t >= T.TYPE;
  const name = typing ? typed(t, NEW_NAME, T.TYPE, 9) : OLD_NAME;
  const selected = t >= T.NAME + 0.2 && !typing;
  const checked = t >= T.CHECKED;
  const btn = { borderRadius: 8 * k, padding: `${10 * k}px ${16 * k}px`, fontSize: 14 * k, fontWeight: 600, border: `1px solid ${C.line}` };
  return (
    <div style={{ position: 'absolute', inset: 0, background: `rgba(15,23,42,${0.5 * Math.min(1, s * 1.5) * out})`, display: 'grid', placeItems: 'center', zIndex: 5 }}>
      <div style={{ width: 480 * k, background: '#fff', borderRadius: 16 * k, padding: 24 * k, display: 'flex', flexDirection: 'column', gap: 15 * k, boxShadow: '0 30px 60px -20px rgba(15,23,42,.6)', opacity: Math.min(1, s * 1.5) * out, transform: `scale(${0.94 + 0.06 * s})` }}>
        <div style={{ fontSize: 22 * k, fontWeight: 800, letterSpacing: -0.6 }}>이 기기 설정</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 * k, fontSize: 13 * k, fontWeight: 600 }}>
          <span>기기 이름 <small style={{ color: C.muted, fontWeight: 400, fontSize: 12 * k }}>(교사 휴대폰에 보입니다 — 예: 2-3 교실)</small></span>
          <span data-pt="name" style={{ border: `1px solid ${t >= T.NAME ? C.primary : C.line}`, borderRadius: 8 * k, padding: `${10 * k}px ${12 * k}px`, background: C.bg, fontSize: 14 * k, fontWeight: 500, boxShadow: t >= T.NAME && t < T.CLOSE ? '0 0 0 3px rgba(79,70,229,.2)' : undefined }}>
            <span style={{ background: selected ? '#c7d2fe' : 'transparent' }}>{name}</span>
            {t >= T.NAME && t < T.CHECK && <span style={{ display: 'inline-block', width: 2, height: 16 * k, background: C.ink, verticalAlign: 'text-bottom', marginLeft: 1, opacity: Math.floor(t * 2.4) % 2 ? 0.2 : 1 }} />}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10 * k, alignItems: 'flex-start', fontSize: 13 * k, fontWeight: 600 }}>
          <span style={{ width: 18 * k, height: 18 * k, borderRadius: 4 * k, background: C.primary, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 12 * k, flexShrink: 0, marginTop: 1 }}>✓</span>
          <span>Windows 를 켜면 자동으로 실행 <small style={{ color: C.muted, fontWeight: 400, fontSize: 12 * k }}>(교실 PC 는 켜 두는 것을 권합니다)</small></span>
        </div>
        <div style={{ color: C.muted, fontSize: 12 * k, lineHeight: 1.6 }}>추가 프로그램은 설정 파일에 등록합니다:<br /><code style={{ fontSize: 11.5 * k }}>C:\ProgramData\SpaceKijun\classroom\settings.json</code></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 * k, padding: `${12 * k}px ${14 * k}px`, border: `1px solid ${C.line}`, borderRadius: 12 * k, background: C.bg }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, fontSize: 14 * k }}>
            <b>판 1.5.7</b>
            <small style={{ fontSize: 12 * k, color: checked ? C.ok : C.muted, lineHeight: 1.5 }}>{checked ? '지금이 가장 새 판입니다.' : '새 판은 30분마다 확인해 수업이 없을 때 바꿉니다.'}</small>
          </div>
          <span data-pt="check" style={{ ...btn, color: C.muted, ...ring(t, T.CHECK) }}>새 판 확인</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 * k }}>
          <span data-pt="quit" style={{ ...btn, border: '1px solid transparent', color: C.danger, ...(t >= T.QUIT && t < T.X + 0.6 ? { background: '#fef2f2', boxShadow: '0 0 0 3px rgba(180,35,42,.25)' } : {}) }}>프로그램 끝내기</span>
          <span style={{ flex: 1 }} />
          <span style={{ ...btn, color: C.muted }}>닫기</span>
          <span data-pt="save" style={{ ...btn, border: '1px solid transparent', background: C.primary, color: '#fff', ...ring(t, T.SAVE) }}>저장</span>
        </div>
      </div>
    </div>
  );
}

function Stage() {
  const t = useSceneTime();
  const qrIn = spring(t, T.QR_IN, 0.7);
  const spot = interpolate(t, [0.2, 0.6], [0, 1]) * interpolate(t, [T.OPEN, T.OPEN + 0.4], [1, 0]);
  const renamed = t >= T.CLOSE;
  const nameRing = renamed ? Math.min(1, (t - T.CLOSE) / 0.4) : 0;
  const quitChip = spring(t, T.QUIT + 0.1, 0.5);
  const xChip = spring(t, T.X + 0.1, 0.5);
  const finalChip = spring(t, T.CLOSE + 0.6, 0.5);
  return (
    <>
      <Head chapter="③ 교실 PC · 2/2" title="기기 설정: 이름 · 자동 실행 · 새 판 · 끝내기" />

      <Desktop style={{ left: D.x, top: D.y, width: D.w, height: D.h, borderRadius: 18 }}>
        {/* 시작: 구석의 위젯 하나 */}
        <Widget k={WK} style={{ right: 20, bottom: 56, opacity: 1 - Math.min(1, qrIn * 1.5) }} refOpen="open" openStyle={ring(t, T.OPEN)} />
        {spot > 0 && (
          <span style={{ position: 'absolute', right: 20 + 170 * WK - 260, bottom: 56 + 62 * WK - 260, width: 520, height: 520, borderRadius: '50%', boxShadow: `0 0 0 2000px rgba(15,23,42,${0.45 * spot})`, pointerEvents: 'none' }} />
        )}
        {/* QR 창 — 위젯 자리에서 화면 가득 펼쳐진다 */}
        {t >= T.QR_IN && (
          <div style={{ position: 'absolute', left: 0, top: 0, width: D.w, height: D.h - 44, overflow: 'hidden', background: C.bg, transformOrigin: '90% 92%', transform: `scale(${0.2 + 0.8 * qrIn})`, opacity: Math.min(1, qrIn * 2) }}>
            <WinTitle title="스페이스기전 교실" k={1.3} refX="x" xStyle={t >= T.X && t < T.SAVE ? { background: '#e81123', color: '#fff' } : undefined} />
            <QrWindow k={1} style={{ left: 0, top: 44, width: D.w, height: D.h - 88 }} device={renamed ? NEW_NAME : OLD_NAME} refs={{ settings: 'settings' }} />
            {renamed && <span style={{ position: 'absolute', left: 872, top: 208, width: 200, height: 64, borderRadius: 14, border: '4px solid #facc15', opacity: nameRing }} />}
            {t >= T.DLG && t < T.CLOSE + 0.35 && <Settings t={t} />}
          </div>
        )}
      </Desktop>
      {/* [기기 설정] 클릭 발광 — 창 안 버튼 위치에 얹는다 */}
      {t > T.SETTINGS && t < T.SETTINGS + 0.6 && (
        <span style={{ position: 'absolute', left: `${TG.settings.x}%`, top: `${TG.settings.y}%`, width: 120, height: 48, transform: 'translate(-50%,-50%)', borderRadius: 12, ...ring(t, T.SETTINGS) }} />
      )}

      {/* 바깥 칩 */}
      {t >= T.QUIT && t < T.CLOSE && (
        <div style={{ position: 'absolute', left: 96, top: 740, opacity: Math.min(1, quitChip * 1.5), transform: `translateX(${(1 - quitChip) * -20}px)`, zIndex: 20 }}>
          <Chip tone="danger" style={{ fontSize: 24 }}>[프로그램 끝내기] = 정말 끌 때만 · 끄면 QR이 뜨지 않음</Chip>
        </div>
      )}
      {t >= T.X && t < T.CLOSE && (
        <div style={{ position: 'absolute', right: 96, top: 222, opacity: Math.min(1, xChip * 1.5), zIndex: 20 }}>
          <Chip style={{ fontSize: 24 }}>✕ = 화면에서 내리기 · 10분 뒤 다시 뜸</Chip>
        </div>
      )}
      {renamed && (
        <div style={{ position: 'absolute', left: 300, top: 236, opacity: Math.min(1, finalChip * 1.5), zIndex: 20 }}>
          <Chip tone="ok" style={{ fontSize: 24 }}>✓ 휴대폰 승인 화면에 «2-3 교실»로 보임</Chip>
        </div>
      )}
      {renamed && (
        <div style={{ position: 'absolute', right: 96, top: 292, opacity: Math.min(1, spring(t, T.CLOSE + 1.0, 0.5) * 1.5), zIndex: 20 }}>
          <Chip tone="danger" style={{ fontSize: 22 }}>[기기 설정] › [프로그램 끝내기]는 정말 끌 때만</Chip>
        </div>
      )}

      <Cursor path={[
        { t: 0.7, x: 70, y: 60 },
        { t: T.OPEN, x: TG.open.x, y: TG.open.y, click: true },
        { t: T.SETTINGS, x: TG.settings.x, y: TG.settings.y, click: true },
        { t: T.NAME, x: TG.name.x, y: TG.name.y, click: true },
        { t: T.NAME + 0.4, x: TG.name.x, y: TG.name.y, hide: true },
        { t: T.CHECK, x: TG.check.x, y: TG.check.y, click: true },
        { t: T.QUIT, x: TG.quit.x, y: TG.quit.y },
        { t: T.X, x: TG.x.x, y: TG.x.y },
        { t: T.SAVE, x: TG.save.x, y: TG.save.y, click: true },
        { t: T.SAVE + 0.8, x: TG.save.x, y: TG.save.y + 4, hide: true },
      ]} />
      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S11() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
