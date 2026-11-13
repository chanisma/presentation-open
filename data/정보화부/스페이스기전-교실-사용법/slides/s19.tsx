import { Scene, useSceneTime, interpolate, easeInOut, spring } from '../../../../src/scene';
import { popIn } from '../../../../src/walkthrough';
import { C, Head, SceneSubs, Cursor, ring, Dock, BASE_TILES, Phone, WebBar, DeviceCard, ConnectedPanel, Glyph, LOOK, type SlideMeta, type Sub } from '../kit';
import { DriveWin, ReconnectCard, type Row } from './_drive';

/* 19 — scene: 드라이브 연결은 1시간, QR로 이어 간다
   메타포: 60분짜리 모래시계 게이지(왼쪽, dominant)가 줄어들다 비고, 휴대폰 QR 한 번에 다시 가득 찬다.
   오른쪽에는 같은 시각의 탐색기·독·휴대폰. 독과 열린 창은 그대로라는 점을 화면이 계속 보여 준다. */

const T = { WARN: 2.9, EMPTY: 5.9, MAKE: 7.2, QR: 7.5, PHONE: 8.6, PAGE: 9.3, TAP: 10.5, DONE: 10.9, FILL: 11.0, BACK: 11.9 };
const DUR = 15;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '드라이브 연결은 1시간입니다. 수업 연결과는 따로 셉니다.' },
  { at: T.WARN, text: '10분 남으면 독과 탐색기가 알려 줍니다. 고친 파일을 저장해 두세요.' },
  { at: T.EMPTY, text: '끝나면 탐색기에 «드라이브 연결이 끝났습니다»가 뜹니다. [QR 만들기]를 누르고 휴대폰으로 찍으세요.' },
  { at: T.DONE, text: '[드라이브 다시 연결]을 누르면 1시간이 더 이어집니다. 독과 열어 둔 창은 그대로입니다.' },
];

/* 포인터 좌표(씬 %) — measure_pointer.mjs 실측 2026-10-15 */
const TG = { make: { x: 50.0, y: 46.0 }, tap: { x: 88.3, y: 50.7 } };

const G = { x: 96, y: 210, w: 210, h: 640 }; // 게이지 관
const PH = { x: 1530, y: 196, w: 330 };
const SW = PH.w - PH.w * 0.064;

function minutesAt(t: number) {
  if (t < T.WARN) return interpolate(t, [0.4, T.WARN], [60, 8], easeInOut);
  if (t < T.EMPTY) return interpolate(t, [T.EMPTY - 1.1, T.EMPTY], [8, 0], easeInOut);
  if (t < T.FILL) return 0;
  return 60 * spring(t, T.FILL, 1.0);
}

function Gauge({ t }: { t: number }) {
  const m = Math.max(0, minutesAt(t));
  const col = m <= 10 ? C.warn : C.primary;
  const fillH = (G.h - 16) * Math.min(1, m / 60);
  return (
    <>
      <div style={{ position: 'absolute', left: G.x - 24, top: 166, width: G.w + 120, fontSize: 22, fontWeight: 700, color: C.muted }}>드라이브 연결</div>
      <div style={{ position: 'absolute', left: G.x, top: G.y, width: G.w, height: G.h, borderRadius: 40, background: '#fff', border: `4px solid ${C.line}`, overflow: 'hidden', boxShadow: 'inset 0 6px 18px rgba(15,23,42,.06)' }}>
        <div style={{ position: 'absolute', left: 8, right: 8, bottom: 8, height: fillH, borderRadius: 30, background: `linear-gradient(180deg, color-mix(in srgb, ${col} 70%, #fff), ${col})` }} />
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <div style={{ textAlign: 'center', color: m > 30 ? '#fff' : C.ink, textShadow: m > 30 ? '0 2px 6px rgba(15,23,42,.3)' : undefined }}>
            <div style={{ fontSize: 76, fontWeight: 850, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{Math.round(m)}</div>
            <div style={{ fontSize: 26, fontWeight: 700 }}>분 남음</div>
          </div>
        </div>
      </div>
      {[60, 30, 10, 0].map((v) => (
        <div key={v} style={{ position: 'absolute', left: G.x + G.w + 14, top: G.y + 8 + (G.h - 16) * (1 - v / 60) - 14, fontSize: 20, fontWeight: v === 10 ? 800 : 600, color: v === 10 ? C.warn : C.muted, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 16, height: 3, background: v === 10 ? C.warn : C.faint }} />{v}분{v === 10 ? ' · 알림' : ''}
        </div>
      ))}
    </>
  );
}

const ROWS: Row[] = [
  { id: 'f', name: '자료 폴더', kind: 'folder', date: '26. 10. 14. 오후 02:12' },
  { id: 'x', name: '활동지.docx', kind: 'doc', date: '26. 10. 14. 오후 03:12', size: '38 KB', pill: { text: '열림 · 올림 오후 02:05', tone: 'ok' } },
  { id: 'v', name: '예시 영상.mp4', kind: 'video', date: '26. 10. 14. 오후 12:12', size: '48.6 MB' },
];

function PhonePage({ t }: { t: number }) {
  const u = SW / 100;
  const done = t >= T.DONE;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: C.bg }}>
      <WebBar w={SW} />
      <div style={{ padding: 3.6 * u }}>
        <DeviceCard w={SW - 7.2 * u} label="드라이브를 이어 갈 기기" left={done ? null : '2:52'} />
        {!done ? (
          <div style={{ marginTop: 3 * u, borderRadius: 5 * u, background: C.card, border: `1px solid ${C.line}`, padding: 5 * u, textAlign: 'center' }}>
            <Glyph look={LOOK.mydrive} size={14 * u} style={{ margin: '0 auto' }} />
            <div style={{ marginTop: 3 * u, fontSize: 4.4 * u, fontWeight: 700 }}>드라이브를 다시 연결할까요?</div>
            <div style={{ marginTop: 1.5 * u, fontSize: 3.3 * u, color: C.muted, lineHeight: 1.55, wordBreak: 'keep-all' }}>수업 중인 이 기기의 «내 드라이브»를 1시간 더 쓸 수 있게 합니다. 구글 허용 창이 잠깐 뜹니다.</div>
            <div data-pt="tap" style={{ marginTop: 5 * u, height: 12 * u, borderRadius: 3 * u, background: '#2563eb', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 4 * u, fontWeight: 600, ...ring(t, T.TAP, '#2563eb') }}>드라이브 다시 연결</div>
            <div style={{ marginTop: 3 * u, fontSize: 2.9 * u, color: C.faint }}>이 기기에서 수업을 시작한 선생님만 연결할 수 있습니다.</div>
          </div>
        ) : (
          <ConnectedPanel w={SW - 7.2 * u} drive style={{ marginTop: 3 * u, opacity: interpolate(t, [T.DONE, T.DONE + 0.3], [0, 1]) }} />
        )}
      </div>
    </div>
  );
}

function Stage() {
  const t = useSceneTime();
  const warn = t >= T.WARN && t < T.EMPTY;
  const over = t >= T.EMPTY && t < T.BACK;
  const back = t >= T.BACK;
  const phoneIn = spring(t, T.PHONE, 0.7);
  const banner = warn ? { text: '드라이브 연결이 8분 남았습니다. 고친 파일은 저장해 두세요.', tone: 'warn' as const, action: '지금 다시 연결' }
    : back ? { text: '드라이브를 다시 연결했습니다.', tone: 'info' as const } : undefined;
  const tiles = BASE_TILES.map((x) => (x.id === 'drive' && warn ? { ...x, badge: '8분' } : x));
  return (
    <>
      <Head chapter="⑤ 드라이브 · 5/5" title="드라이브 연결은 1시간, QR로 이어 간다" />
      <Gauge t={t} />

      <DriveWin k={1.0} w={980} h={500} crumbs={['1-3 정보 수업자료', '3주차']} rows={ROWS} banner={banner}
        style={{ left: 470, top: 196 }}
        overlay={over ? <ReconnectCard k={1.05} qr={t >= T.QR} left={t >= T.QR ? '휴대폰 카메라로 찍으세요 · 172초 뒤 사라짐' : undefined} refMake="make" makeStyle={ring(t, T.MAKE)} /> : undefined} />

      <Dock tiles={tiles} k={0.8} style={{ left: 470, top: 790 }} />
      <div style={{ position: 'absolute', left: 1215, top: 822, width: 300, fontSize: 19, color: C.muted, lineHeight: 1.45, wordBreak: 'keep-all' }}>
        {warn ? <b style={{ color: C.warn }}>독의 «내 드라이브»에도 «8분» 배지</b> : over ? '독과 열어 둔 창은 그대로' : ' '}
      </div>

      {/* 휴대폰 — 드라이브 다시 연결 */}
      {t >= T.PHONE - 0.2 && (
        <div style={{ position: 'absolute', inset: 0, transform: `translateX(${(1 - phoneIn) * 440}px)`, opacity: Math.min(1, phoneIn * 2) }}>
          <Phone x={PH.x} y={PH.y} w={PH.w} url={t >= T.PAGE ? 'spacekijun.lovable.app/classroom/link' : undefined}>
            {t < T.PAGE ? (
              <div style={{ position: 'absolute', inset: 0, background: '#0b1220', display: 'grid', placeItems: 'center', color: '#fde047', fontSize: 18, fontWeight: 700 }}>QR 찍는 중…</div>
            ) : <PhonePage t={t} />}
          </Phone>
        </div>
      )}
      {t >= T.FILL && t < T.FILL + 1.2 && (
        <div style={{ position: 'absolute', left: G.x + G.w / 2 - 70, top: G.y - 6, width: 140, textAlign: 'center', fontSize: 26, fontWeight: 800, color: C.ok, opacity: interpolate(t, [T.FILL + 0.8, T.FILL + 1.2], [1, 0]) }}>+ 1시간</div>
      )}

      <Cursor path={[
        { t: 6.6, x: 46, y: 52 },
        { t: T.MAKE, x: TG.make.x, y: TG.make.y, click: true },
        { t: 7.8, x: TG.make.x + 2, y: TG.make.y + 8, hide: true },
        { t: 10.0, x: TG.tap.x - 2, y: TG.tap.y + 10, finger: true },
        { t: T.TAP, x: TG.tap.x, y: TG.tap.y, click: true, finger: true },
        { t: 11.1, x: TG.tap.x, y: TG.tap.y, hide: true, finger: true },
      ]} />
      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S19() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
