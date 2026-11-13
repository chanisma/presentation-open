import { Scene, useSceneTime, interpolate, easeInOut, spring } from '../../../../src/scene';
import {
  C, Head, SceneSubs, Cursor, ring, Dock, BASE_TILES, Phone, WebBar, Chip, Mark, type SlideMeta, type Sub,
} from '../kit';
import { Toast } from './_pc';

/* 26 — walkthrough: 수업을 끝내는 세 가지 방법
   메타포: 세 갈래 길(시계 · 교실 PC 독 · 휴대폰·웹)이 오른쪽 끝 «정리» 문 하나로 모인다(합류). */

const T = { CLOCK: 1.6, TOAST: 1.8, TOK1: 3.6, END: 5.4, DLG: 5.7, DLG_END: 7.0, TOK2: 7.3, TAP: 9.6, CLOSED: 10.0, TOK3: 10.3 };
const DUR = 14;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '수업은 정해 둔 시간이 지나면 저절로 정리됩니다. 끝나기 5분 전에는 시간이 주황색으로 바뀌고, 누르면 10분 늘어납니다.' },
  { at: 4.6, text: '일찍 끝낼 때는 독의 빨간 [수업 끝]을 누르세요. 한 번 더 확인합니다.' },
  { at: 8.6, text: '깜빡하고 교실을 나왔다면 휴대폰의 [여기서 수업 끝내기]를 누르세요. 스페이스기전 «교실 기기» 화면에서도 됩니다.' },
];

/* 포인터 좌표(씬 %) — measure_pointer.mjs 실측 2026-10-15 */
const TG = { clock: { x: 24.5, y: 26.9 }, end: { x: 44.1, y: 45.8 }, dlgEnd: { x: 72.5, y: 50.4 }, stop: { x: 13.3, y: 79.7 } };

const DOOR = { x: 1600, y: 280, w: 230, h: 560 };
/* 각 갈래 끝 → 문 */
const MERGE = [
  { from: [1120, 282], to: [DOOR.x, DOOR.y + 150] },
  { from: [904, 494], to: [DOOR.x, DOOR.y + 300] },
  { from: [1000, 800], to: [DOOR.x, DOOR.y + 450] },
];
const TOK = [T.TOK1, T.TOK2, T.TOK3];

function bez(f: number[], to: number[], u: number) {
  const c1 = [f[0] + (to[0] - f[0]) * 0.55, f[1]];
  const c2 = [f[0] + (to[0] - f[0]) * 0.45, to[1]];
  const a = (1 - u) ** 3, b = 3 * (1 - u) ** 2 * u, c = 3 * (1 - u) * u * u, d = u ** 3;
  return [a * f[0] + b * c1[0] + c * c2[0] + d * to[0], a * f[1] + b * c1[1] + c * c2[1] + d * to[1]];
}

function LaneLabel({ n, y, children }: { n: string; y: number; children: string }) {
  return (
    <div style={{ position: 'absolute', left: 72, top: y, display: 'flex', alignItems: 'center', gap: 10, fontSize: 22, fontWeight: 800, color: C.primary }}>
      <span style={{ width: 36, height: 36, borderRadius: '50%', background: C.primary, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 20 }}>{n}</span>{children}
    </div>
  );
}

function Stage() {
  const t = useSceneTime();
  const extended = t >= T.CLOCK;
  const toast = interpolate(t, [T.TOAST, T.TOAST + 0.3], [0, 1]) * interpolate(t, [3.4, 3.8], [1, 0]);
  const dlg = spring(t, T.DLG, 0.5);
  const dlgOut = interpolate(t, [T.DLG_END + 0.2, T.DLG_END + 0.5], [1, 0]);
  const ending = t >= T.DLG_END + 0.3;
  const closed = t >= T.CLOSED;
  const doorGlow = Math.max(...TOK.map((a) => Math.max(0, 1 - Math.abs(t - (a + 1.2)) / 0.5)));
  const wedge = extended ? 14.97 : 4.97; // 남은 분
  return (
    <>
      <Head chapter="⑦ 수업 끝 · 1/2" title="수업을 끝내는 세 가지 방법" />

      {/* 합류선 */}
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {MERGE.map((m, i) => {
          const c1 = [m.from[0] + (m.to[0] - m.from[0]) * 0.55, m.from[1]];
          const c2 = [m.from[0] + (m.to[0] - m.from[0]) * 0.45, m.to[1]];
          return <path key={i} d={`M${m.from[0]},${m.from[1]} C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${m.to[0]},${m.to[1]}`} fill="none" stroke={C.line} strokeWidth={10} strokeLinecap="round" />;
        })}
        {MERGE.map((m, i) => {
          const u = interpolate(t, [TOK[i], TOK[i] + 1.2], [0, 1], easeInOut);
          if (u <= 0 || u >= 1) return null;
          const [x, y] = bez(m.from, m.to, u);
          return <circle key={i} cx={x} cy={y} r={14} fill={C.primary} stroke="#fff" strokeWidth={4} />;
        })}
      </svg>

      {/* ① 시간 */}
      <LaneLabel n="1" y={170}>정해 둔 시간</LaneLabel>
      <svg viewBox="-80 -80 160 160" width={150} height={150} style={{ position: 'absolute', left: 90, top: 214 }}>
        <circle r={70} fill="#fff" stroke={C.line} strokeWidth={5} />
        <path d={`M0,0 L0,-62 A62,62 0 0 1 ${62 * Math.sin((wedge / 60) * 2 * Math.PI)},${-62 * Math.cos((wedge / 60) * 2 * Math.PI)} Z`} fill={extended ? 'color-mix(in srgb, #4f46e5 30%, transparent)' : 'color-mix(in srgb, #c2410c 35%, transparent)'} />
        <line x1={0} y1={0} x2={0} y2={-52} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
        <circle r={6} fill={C.ink} />
      </svg>
      <div data-pt="clock" style={{ position: 'absolute', left: 400, top: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', background: C.shelf, border: `2px solid ${extended ? 'rgba(15,23,42,.15)' : C.warn}`, borderRadius: 18, padding: '10px 22px', ...ring(t, T.CLOCK) }}>
        <strong style={{ fontSize: 40, fontVariantNumeric: 'tabular-nums', color: extended ? C.ink : C.warn, lineHeight: 1.1 }}>{extended ? '14:58' : '04:58'}</strong>
        <span style={{ fontSize: 17, color: C.muted }}>+10분</span>
      </div>
      <div style={{ position: 'absolute', left: 620, top: 236, width: 480, fontSize: 21, color: C.muted, lineHeight: 1.5, opacity: 1 - toast }}>
        5분 전부터 주황 · 누르면 10분씩, 승인부터 최대 4시간
      </div>
      {toast > 0 && <Toast k={0.95} style={{ left: 620, top: 236, opacity: toast }}>10분 연장했습니다.</Toast>}

      {/* ② 독 [수업 끝] */}
      <LaneLabel n="2" y={392}>독의 [수업 끝]</LaneLabel>
      <Dock tiles={BASE_TILES} k={0.86} width={820} style={{ left: 72, top: 446 }} endRef="end" endStyle={ring(t, T.END, C.danger)}
        ending={ending ? '정리하는 중입니다.' : undefined} endingSpin={t * 360} />
      {t >= T.DLG && dlgOut > 0 && (
        <div style={{ position: 'absolute', left: 960, top: 400, width: 500, background: '#fff', borderRadius: 16, padding: '22px 26px', boxShadow: '0 30px 60px -20px rgba(15,23,42,.55)', opacity: Math.min(1, dlg * 1.5) * dlgOut, transform: `scale(${0.94 + 0.06 * dlg})`, zIndex: 6 }}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>수업을 끝낼까요?</div>
          <div style={{ fontSize: 15.5, color: C.muted, lineHeight: 1.65, marginTop: 8 }}>열린 창과 프로그램을 닫고(고친 문서는 저장할지 묻습니다), 고친 드라이브 파일을 올린 뒤 이 PC 의 사본과 로그인을 지웁니다.</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
            <span style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: '9px 18px', fontSize: 17, fontWeight: 700 }}>취소</span>
            <span data-pt="dlgEnd" style={{ background: C.danger, color: '#fff', borderRadius: 10, padding: '9px 18px', fontSize: 17, fontWeight: 700, ...ring(t, T.DLG_END, C.danger) }}>수업 끝</span>
          </div>
        </div>
      )}

      {/* ③ 휴대폰 · 웹 */}
      <LaneLabel n="3" y={612}>교실을 나왔다면</LaneLabel>
      <div style={{ position: 'absolute', left: 92, top: 664, width: 330, height: 280, overflow: 'hidden' }}>
        <Phone x={14} y={0} w={300} url="spacekijun.lovable.app/classroom/link" style={{ boxShadow: 'none' }}>
          <WebBar w={281} />
          <div style={{ padding: 10 }}>
            {closed ? (
              <div style={{ borderRadius: 14, background: '#fff', border: `1px solid ${C.line}`, padding: '26px 14px', textAlign: 'center' }}>
                <span style={{ display: 'inline-grid', placeItems: 'center', width: 40, height: 40, borderRadius: 12, background: '#f1f5f9', color: C.muted, fontSize: 22 }}>✓</span>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 8 }}>수업이 끝났습니다</div>
                <div style={{ fontSize: 11.5, color: C.muted, marginTop: 4, lineHeight: 1.5 }}>교실 기기가 열린 창과 받은 파일, 로그인을 정리합니다.</div>
              </div>
            ) : (
              <div style={{ borderRadius: 14, background: '#fff', border: `1px solid ${C.line}`, padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}><span style={{ color: '#10b981' }}>✓</span> 교실 화면에 펼쳤습니다</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>11:20에 자동으로 정리</div>
                <div data-pt="stop" style={{ marginTop: 10, height: 36, borderRadius: 10, border: '1px solid #fecdd3', color: '#e11d48', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 700, ...ring(t, T.TAP, '#e11d48') }}>여기서 수업 끝내기</div>
              </div>
            )}
          </div>
        </Phone>
      </div>
      <div style={{ position: 'absolute', left: 430, top: 676 }}><Chip tone="muted" style={{ fontSize: 19, padding: '5px 12px' }}>교실 밖</Chip></div>
      <div style={{ position: 'absolute', left: 430, top: 736, width: 560, borderRadius: 16, border: '1px solid #a7f3d0', background: '#ecfdf5', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#059669', flexShrink: 0, opacity: closed ? 0.3 : 1 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#047857' }}><Mark size={16} />교실 기기 · 지금 연결된 교실</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#064e3b', marginTop: 2 }}>2-3 교실 <span style={{ fontWeight: 400, color: '#047857' }}>· 1-3 정보 수업</span></div>
          <div style={{ fontSize: 14, color: '#047857' }}>10:30 연결 · 11:20 자동 정리</div>
        </div>
        <span style={{ border: '1px solid #6ee7b7', background: '#fff', color: '#065f46', borderRadius: 10, padding: '8px 12px', fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap' }}>여기서 수업 끝내기</span>
      </div>

      {/* 정리 문 */}
      <div style={{ position: 'absolute', left: DOOR.x, top: DOOR.y, width: DOOR.w, height: DOOR.h, borderRadius: '115px 115px 22px 22px', background: 'linear-gradient(180deg, #4f46e5, #312e81)', boxShadow: `0 0 0 ${10 * doorGlow}px rgba(79,70,229,.25), 0 30px 60px -30px rgba(49,46,129,.7)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: 10 }}>
        <span style={{ fontSize: 58, fontWeight: 900, letterSpacing: -1.5 }}>정리</span>
        <span style={{ fontSize: 20, opacity: 0.8 }}>어느 길이든 같음</span>
        <span style={{ position: 'absolute', right: 30, top: '55%', width: 14, height: 14, borderRadius: '50%', background: '#fde047' }} />
      </div>

      <Cursor path={[
        { t: 0.8, x: 30, y: 40 },
        { t: T.CLOCK, x: TG.clock.x, y: TG.clock.y, click: true },
        { t: T.END, x: TG.end.x, y: TG.end.y, click: true },
        { t: T.DLG_END, x: TG.dlgEnd.x, y: TG.dlgEnd.y, click: true },
        { t: 7.6, x: TG.dlgEnd.x, y: TG.dlgEnd.y, hide: true },
        { t: T.TAP, x: TG.stop.x, y: TG.stop.y, click: true, finger: true },
        { t: 10.4, x: TG.stop.x, y: TG.stop.y, hide: true, finger: true },
      ]} />
      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S26() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
