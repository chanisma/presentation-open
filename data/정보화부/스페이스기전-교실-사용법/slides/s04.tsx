import { Scene, useSceneTime, interpolate, spring, easeInOut } from '../../../../src/scene';
import { C, Head, SceneSubs, Cursor, ring, Phone, Dock, Glyph, LOOK, window4, type SlideMeta, type Sub } from '../kit';
import { ALWAYS, BLUE } from './_web';

/* 4 — walkthrough: 새 세팅 — 이름 · 자동 정리 · 반 (휴대폰)
   구도: 왼쪽 휴대폰 한 대에서 폼을 위→아래로 채우는 세로 동선, 오른쪽에 같은 순간의
   «교실 화면 아래 독 미리 보기»를 크게 확대한 띠 — 휴대폰 값이 연결선을 타고 띠에 반영된다. */

const T = { NEW: 1.2, SHEET: 1.5, SEC: 3.6, MIN: 6.4, HINT: 8.9, NAMEF: 10.6, TYPE: 10.9 };
const DUR = 14;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };
const NAME = '1-3 정보 수업';
const CPS = 7;

const SUBS: Sub[] = [
  { at: 0, text: '[새 세팅]을 누르면 세팅 창이 열립니다. 휴대폰에서도 똑같이 만들 수 있습니다.' },
  { at: 3.2, text: '먼저 반을 고르세요. 그 반 수업 시간에 QR을 찍으면 이 세팅이 미리 골라져 있습니다.' },
  { at: 6.0, text: '«자동 정리»는 수업이 저절로 정리되는 시간입니다. 기본은 50분이고, 블록 수업이면 90분을 고르세요.' },
  { at: 8.8, text: '이름은 비워 두면 «정보 1-3 수업»처럼 반 이름으로 저장됩니다. 원하는 이름을 직접 넣어도 됩니다.' },
];

const PH = { x: 230, y: 168, w: 360 };
/* 포인터 좌표(씬 %) — measure_pointer.mjs 실측 2026-10-15 */
const TG = { new: { x: 28.0, y: 26.8 }, sec: { x: 20.2, y: 48.0 }, min: { x: 22.1, y: 41.9 }, name: { x: 19.0, y: 35.4 } };

function chip(on: boolean, extra?: React.CSSProperties): React.CSSProperties {
  return { display: 'inline-flex', alignItems: 'center', height: 30, padding: '0 11px', borderRadius: 99, fontSize: 13, whiteSpace: 'nowrap',
    border: `1.5px solid ${on ? BLUE : '#e2e8f0'}`, background: on ? BLUE : '#fff', color: on ? '#fff' : '#475569', fontWeight: on ? 600 : 400, ...extra };
}

function PhoneScreen({ t, section, minutes, name }: { t: number; section: string | null; minutes: number; name: string }) {
  const sheet = spring(t, T.SHEET, 0.6);
  const hint = window4(t, T.HINT, T.HINT + 0.3, T.NAMEF - 0.2, T.NAMEF);
  return (
    <div style={{ position: 'absolute', inset: 0, background: C.bg }}>
      {/* /classroom (휴대폰: 글자 없이 아이콘 단추) */}
      <div style={{ position: 'absolute', left: 12, right: 12, top: 12, height: 52, borderRadius: 14, background: '#fff', border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px' }}>
        <span style={{ flex: 1, height: 36, borderRadius: 9, border: `1px solid ${C.line}`, fontSize: 12, color: C.faint, display: 'flex', alignItems: 'center', padding: '0 10px' }}>⌕ 세팅·반·항목 찾기</span>
        <span style={{ width: 36, height: 36, borderRadius: 9, display: 'grid', placeItems: 'center', color: '#475569' }}>ⓘ</span>
        <span data-pt="new" style={{ width: 40, height: 40, borderRadius: 10, background: BLUE, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 22, ...ring(t, T.NEW, BLUE) }}>＋</span>
      </div>
      <div style={{ position: 'absolute', left: 12, right: 12, top: 78, fontSize: 12, color: C.muted }}>＋ 세팅이 없는 반</div>
      <div style={{ position: 'absolute', left: 12, top: 98, ...chip(false, { border: '1.5px dashed #93c5fd', color: BLUE, background: '#f8fbff' }) }}>＋ 정보 1-3</div>
      <div style={{ position: 'absolute', left: 12, right: 12, top: 144, height: 150, borderRadius: 14, background: '#fff', border: `1px solid ${C.line}`, padding: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>2-1 인공지능 수업</div>
        <div style={{ display: 'flex', gap: 5, marginTop: 16 }}>{[LOOK.google, LOOK.mydrive, LOOK.site, LOOK.folder].map((l, i) => <Glyph key={i} look={l} size={30} />)}</div>
      </div>
      {/* 새 교실 세팅 — 전체 화면 창 */}
      {t >= T.SHEET && (
        <div style={{ position: 'absolute', inset: 0, background: '#fff', transform: `translateY(${(1 - sheet) * 100}%)` }}>
          <div style={{ position: 'absolute', left: 16, top: 12, fontSize: 18, fontWeight: 700 }}>새 교실 세팅</div>
          <div style={{ position: 'absolute', right: 16, top: 12, fontSize: 18, color: C.muted }}>✕</div>
          <div style={{ position: 'absolute', left: 16, right: 16, top: 40, fontSize: 11.5, color: C.muted, lineHeight: 1.45 }}>QR 로 승인하면 화면 아래 독에 이 순서로 놓입니다. 누르면 열립니다.</div>
          <i style={{ position: 'absolute', left: 0, right: 0, top: 78, height: 1, background: C.line }} />
          <div style={{ position: 'absolute', left: 16, top: 90, fontSize: 12.5, color: C.muted }}>🏷 이름</div>
          <div data-pt="name" style={{ position: 'absolute', left: 16, right: 16, top: 110, height: 42, borderRadius: 9, border: t >= T.NAMEF ? `2px solid ${C.ink}` : `1px solid ${C.line}`, display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 15,
            boxShadow: hint ? `0 0 0 ${3 + 3 * hint}px rgba(250,204,21,${0.5 * hint})` : undefined }}>
            {name ? <span>{name}</span> : <span style={{ color: C.faint }}>{section ? `${section} 수업` : '예: 1-3 정보 수업'}</span>}
            {t >= T.NAMEF && <span style={{ width: 2, height: 18, background: C.ink, marginLeft: 1 }} />}
          </div>
          <div style={{ position: 'absolute', left: 16, top: 166, fontSize: 12.5, color: C.muted }}>◷ 자동 정리</div>
          <div style={{ position: 'absolute', left: 16, top: 186, display: 'flex', gap: 5 }}>
            {[45, 50, 60, 90, 120, 180].map((m) => <span key={m} data-pt={m === 90 ? 'm90' : undefined} style={chip(minutes === m, { padding: '0 8px', fontSize: 12.5, ...(m === 90 ? ring(t, T.MIN, BLUE) : {}) })}>{m}분</span>)}
          </div>
          <div style={{ position: 'absolute', left: 16, top: 232, fontSize: 12.5, color: C.muted }}>👥 수업(반)</div>
          <div style={{ position: 'absolute', left: 16, right: 16, top: 252, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <span style={chip(section === null)}>반 없이(공통)</span>
            <span data-pt="sec" style={chip(section === '정보 1-3', ring(t, T.SEC, BLUE))}>정보 1-3</span>
            <span style={chip(false)}>정보 2-3</span>
            <span style={chip(false)}>인공지능 2-1</span>
          </div>
          <div style={{ position: 'absolute', left: 16, right: 16, top: 330, fontSize: 11.5, color: C.muted, lineHeight: 1.5 }}>반을 고르면, 그 반 수업 시간에 QR 을 찍었을 때 이 세팅이 미리 골라집니다.</div>
          <div style={{ position: 'absolute', left: 16, top: 384, fontSize: 12.5, color: C.muted }}>＋ 더하기</div>
          <div style={{ position: 'absolute', left: 16, right: 16, top: 404, height: 36, borderRadius: 9, background: '#f8fafc', display: 'flex', alignItems: 'center', gap: 12, padding: '0 10px', fontSize: 12.5, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden' }}>
            <b style={{ color: BLUE }}>구글 앱</b><span>웹사이트</span><span>드라이브</span><span>프로그램</span>
          </div>
          <div style={{ position: 'absolute', left: 16, right: 16, top: 452, height: 120, borderRadius: 12, border: `1px solid ${C.line}`, background: 'linear-gradient(#fff, #f8fafc)' }} />
        </div>
      )}
    </div>
  );
}

function Stage() {
  const t = useSceneTime();
  const section = t >= T.SEC ? '정보 1-3' : null;
  const minutes = t >= T.MIN ? 90 : 50;
  const typedN = Math.max(0, Math.min(NAME.length, Math.floor((t - T.TYPE) * CPS)));
  const name = NAME.slice(0, typedN);
  const shown = name || (section ? `${section} 수업` : '세팅 이름');
  const titleFlash = Math.max(window4(t, T.SEC, T.SEC + 0.2, T.SEC + 0.8, T.SEC + 1.4), window4(t, T.HINT, T.HINT + 0.3, T.NAMEF - 0.2, T.NAMEF), t >= T.TYPE && t < T.TYPE + 2 ? 0.7 : 0);
  const clockFlash = window4(t, T.MIN, T.MIN + 0.2, T.MIN + 1.2, T.MIN + 1.8);
  const band = spring(t, T.SHEET + 0.2, 0.7);
  const barW = interpolate(t, [T.MIN, T.MIN + 0.6], [50, 90], easeInOut);
  const lineName = interpolate(t, [T.SEC, T.SEC + 0.6], [0, 1]);
  const lineMin = interpolate(t, [T.MIN, T.MIN + 0.6], [0, 1]);
  return (
    <>
      <Head chapter="② 세팅 만들기 · 2/7" title="세팅의 뼈대: 이름 · 자동 정리 · 반" />
      <Phone x={PH.x} y={PH.y} w={PH.w} url="spacekijun.lovable.app/classroom">
        <PhoneScreen t={t} section={section} minutes={minutes} name={name} />
      </Phone>

      {/* 연결선 — 휴대폰 칸 → 미리 보기 띠 */}
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <defs>
          <clipPath id="s4-l1"><rect x={590} y={0} width={lineName * 180} height={1080} /></clipPath>
          <clipPath id="s4-l2"><rect x={590} y={0} width={lineMin * 1060} height={1080} /></clipPath>
        </defs>
        <path d="M594,383 C690,383 690,572 758,572" fill="none" stroke={C.primary} strokeWidth={3} strokeDasharray="4 7" clipPath="url(#s4-l1)" />
        <path d="M594,452 C680,452 680,668 900,668 L1560,668 C1620,668 1640,650 1640,604" fill="none" stroke={C.warn} strokeWidth={3} strokeDasharray="4 7" clipPath="url(#s4-l2)" />
      </svg>

      <div style={{ position: 'absolute', left: 760, top: 436, fontSize: 22, fontWeight: 700, color: C.muted, opacity: band }}>👁 교실 화면 아래 독 미리 보기</div>
      <div style={{ opacity: band, transform: `translateY(${(1 - band) * 20}px)` }}>
        <Dock tiles={ALWAYS} teacher="선생님" title={shown} time={`${minutes}:00`} k={1.4} width={1080}
          style={{ left: 760, top: 480, background: '#f1f5f9' }}
          clockStyle={clockFlash ? { boxShadow: `0 0 0 ${4 + 4 * clockFlash}px rgba(194,65,12,${0.35 * clockFlash})` } : undefined} />
        <div style={{ position: 'absolute', left: 1280, top: 506, width: 266, height: 104, borderRadius: 14, border: '2px dashed #cbd5e1', display: 'grid', placeItems: 'center', textAlign: 'center', fontSize: 17, color: C.faint, lineHeight: 1.4 }}>
          «더하기»에서 고른 것이<br />여기에 놓입니다
        </div>
        {titleFlash > 0 && <span style={{ position: 'absolute', left: 772, top: 532, width: 240, height: 56, borderRadius: 12, border: `3px solid ${C.primary}`, opacity: titleFlash }} />}
      </div>

      {/* 자동 정리 막대 — 0~180분 위에 정리 시각 */}
      <div style={{ position: 'absolute', left: 760, top: 700, width: 1080, opacity: band }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.ink }}>자동 정리까지 <span style={{ color: C.warn, fontVariantNumeric: 'tabular-nums' }}>{minutes}분</span></div>
        <div style={{ position: 'relative', height: 26, marginTop: 14, borderRadius: 13, background: '#e8ecf4', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(barW / 180) * 100}%`, borderRadius: 13, background: 'linear-gradient(90deg, #fdba74, #ea580c)' }} />
        </div>
        <div style={{ position: 'relative', height: 26, marginTop: 6, fontSize: 16, color: C.muted }}>
          {[45, 50, 60, 90, 120, 180].map((m) => <span key={m} style={{ position: 'absolute', left: `${(m / 180) * 100}%`, transform: 'translateX(-50%)', fontWeight: m === minutes ? 800 : 400, color: m === minutes ? C.warn : C.muted }}>{m}</span>)}
        </div>
        <div style={{ fontSize: 17, color: C.muted, marginTop: 8 }}>지나도 독의 시간을 누르면 10분씩, 승인부터 최대 4시간까지 늘릴 수 있습니다.</div>
      </div>

      <Cursor path={[
        { t: 0.5, x: 26, y: 40, finger: true },
        { t: T.NEW, x: TG.new.x, y: TG.new.y, click: true, finger: true },
        { t: T.SEC, x: TG.sec.x, y: TG.sec.y, click: true, finger: true },
        { t: T.MIN, x: TG.min.x, y: TG.min.y, click: true, finger: true },
        { t: T.NAMEF, x: TG.name.x, y: TG.name.y, click: true, finger: true },
        { t: T.NAMEF + 0.4, x: TG.name.x, y: TG.name.y, hide: true, finger: true },
      ]} />
      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S04() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
