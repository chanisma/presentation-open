import type { CSSProperties } from 'react';
import { Scene, useSceneTime, interpolate, easeInOut, spring } from '../../../../src/scene';
import { popIn } from '../../../../src/walkthrough';
import { C, Head, SceneSubs, Cursor, ring, Monitor, Desktop, Dock, BASE_TILES, Phone, WebBar, DeviceCard, QR, Glyph, LOOK, Chip, type SlideMeta, type Sub } from '../kit';
import { GoogleWin } from './_drive';

/* 21 — walkthrough: 휴대폰으로 로그인 — 비밀번호를 칠판에 치지 않는다
   구도: 공통 지형(왼쪽 교실 PC · 오른쪽 휴대폰). 가운데로 봉인된 봉투가 휴대폰 → 교실 PC로 건너간다.
   교실 화면의 비밀번호 칸에는 끝까지 ●만 찍힌다. (12쪽의 신호 점과 다른 오브젝트) */

const T = { PHONEBTN: 1.4, TYPEWIN: 1.8, PHONE: 3.4, PAGE: 4.1, FILL: 5.0, SEND: 6.5, ENV: 6.8, ARRIVE: 8.6, DOTS: 8.8, NEXT: 9.6, ALERT: 10.4, YES: 11.4, OK: 11.9 };
const DUR = 15.5;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '학생들 앞에서 구글 비밀번호를 칠 필요가 없습니다. 구글 창의 [휴대폰으로 로그인]을 누르세요.' },
  { at: 3.4, text: '화면의 QR을 수업을 연 선생님 휴대폰으로 찍고, 휴대폰에서 비밀번호를 넣어 [교실 기기로 보내기]를 누릅니다.' },
  { at: T.ENV, text: '비밀번호는 휴대폰에서 잠겨 그 교실 PC만 풀 수 있습니다. 서버도 내용을 볼 수 없습니다.' },
  { at: T.ALERT, text: '교실 화면의 구글 로그인이 저절로 이어지고, 휴대폰에 확인 알림이 오면 «예»를 누르면 끝입니다.' },
];

/* 포인터 좌표(씬 %) — measure_pointer.mjs 실측 2026-10-15 */
const TG = { phoneBtn: { x: 31.3, y: 63.8 }, send: { x: 87.5, y: 47.9 }, yes: { x: 93.9, y: 32.0 } };

const MON = { x: 72, y: 210, w: 1100, h: 619 };
const PH = { x: 1500, y: 168, w: 360 };
const SW = PH.w - PH.w * 0.064;

function bez(p0: number[], p1: number[], p2: number[], u: number) {
  const a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u;
  return [a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]];
}
const P0 = [1560, 430], P1 = [1330, 200], P2 = [960, 380];

/** 수업용 Edge — 구글 로그인 화면(교실 PC 안) */
function EdgeLogin({ t }: { t: number }) {
  const n = Math.max(0, Math.min(10, Math.floor((t - T.DOTS) * 14)));
  const signed = t >= T.OK;
  return (
    <div style={{ position: 'absolute', left: 26, top: 22, width: 640, height: 470, background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 20px 50px -24px rgba(0,0,0,.5)' }}>
      <div style={{ height: 34, background: '#eef1f6', display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', fontSize: 12.5, color: C.muted }}>
        <span style={{ fontWeight: 700, color: '#0e7490' }}>e</span>수업용 Edge
        <span style={{ flex: 1, background: '#fff', borderRadius: 99, padding: '3px 12px' }}>accounts.google.com</span>
      </div>
      {!signed ? (
        <div style={{ padding: '34px 46px' }}>
          <div style={{ fontSize: 20, color: C.muted, fontWeight: 600 }}>Google</div>
          <div style={{ fontSize: 30, fontWeight: 600, marginTop: 10 }}>환영합니다</div>
          <div style={{ display: 'inline-block', marginTop: 12, border: `1px solid ${C.line}`, borderRadius: 99, padding: '5px 14px', fontSize: 15 }}>teacher@myschool.hs.kr</div>
          <div style={{ marginTop: 26, border: `2px solid ${n ? '#1a73e8' : '#cbd5e1'}`, borderRadius: 6, height: 54, display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: n ? 26 : 17, letterSpacing: n ? 4 : 0, color: n ? C.ink : C.faint }}>
            {n ? '●'.repeat(n) : '비밀번호 입력'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 34 }}>
            <span style={{ background: '#1a73e8', color: '#fff', borderRadius: 99, padding: '10px 26px', fontSize: 16, fontWeight: 600, ...ring(t, T.NEXT, '#1a73e8') }}>다음</span>
          </div>
        </div>
      ) : (
        <div style={{ padding: '60px 46px', textAlign: 'center' }}>
          <div style={{ fontSize: 46, color: C.ok }}>✓</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>teacher@myschool.hs.kr 로 로그인됨</div>
        </div>
      )}
    </div>
  );
}

/** 휴대폰으로 구글 로그인 창(classroom-type.html) */
function TypeWin({ t, style }: { t: number; style?: CSSProperties }) {
  const ok = t >= T.ARRIVE + 0.2;
  return (
    <div style={{ position: 'absolute', left: 676, top: 30, width: 400, height: 500, background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 24px 60px -24px rgba(0,0,0,.55), 0 0 0 1px rgba(15,23,42,.1)', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: `1px solid ${C.line}` }}>
        <Glyph look={LOOK.google} size={30} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>휴대폰으로 구글 로그인</div>
          <div style={{ fontSize: 12, color: C.muted }}>비밀번호를 칠판에서 치지 않습니다</div>
        </div>
        <span style={{ color: C.muted }}>✕</span>
      </div>
      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <QR size={170} seed={33} style={{ border: `1px solid ${C.line}` }} />
        <div style={{ fontSize: 14, fontWeight: 700, textAlign: 'center', lineHeight: 1.5, color: ok ? C.ok : C.ink, wordBreak: 'keep-all' }}>
          {ok ? '구글 로그인 칸에 넣었습니다. 휴대폰에 구글 확인 알림이 오면 «예»를 누르세요.' : '휴대폰에서 보내기를 기다리는 중…'}
        </div>
        <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, lineHeight: 1.7, alignSelf: 'stretch' }}>
          <li>수업을 연 선생님 휴대폰 카메라로 QR 을 찍으세요.</li>
          <li>휴대폰에서 구글 비밀번호를 넣고 <b>교실 기기로 보내기</b>를 누르세요.</li>
          <li>칠판의 구글 로그인이 저절로 이어집니다.</li>
        </ol>
      </div>
    </div>
  );
}

function PhoneScreen({ t }: { t: number }) {
  const u = SW / 100;
  if (t < T.PHONE) return (
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #334155, #0f172a)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 22 * u }}>
      <div style={{ fontSize: 16 * u, fontWeight: 300, letterSpacing: -1 }}>10:31</div>
      <div style={{ fontSize: 3.6 * u, opacity: 0.75 }}>10월 15일 수요일</div>
      <div style={{ marginTop: 'auto', marginBottom: 14 * u, fontSize: 3.6 * u, opacity: 0.8 }}>수업을 연 선생님 휴대폰</div>
    </div>
  );
  if (t < T.PAGE) return <div style={{ position: 'absolute', inset: 0, background: '#0b1220', display: 'grid', placeItems: 'center', color: '#fde047', fontSize: 18, fontWeight: 700 }}>QR 찍는 중…</div>;
  const sent = t >= T.SEND + 0.3;
  const filled = t >= T.FILL;
  const alert = t >= T.ALERT && t < T.YES + 0.4;
  const al = spring(t, T.ALERT, 0.5);
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: C.bg }}>
      <WebBar w={SW} title="스페이스기전" />
      <div style={{ padding: 3.6 * u }}>
        <DeviceCard w={SW - 7.2 * u} label="구글 로그인할 교실 기기" left={null} />
        {!sent ? (
          <div style={{ marginTop: 3 * u, borderRadius: 5 * u, background: C.card, border: `1px solid ${C.line}`, padding: 5 * u }}>
            <div style={{ fontSize: 3.8 * u, fontWeight: 700, display: 'flex', gap: 1.5 * u, alignItems: 'center' }}><span style={{ color: '#2563eb' }}>⚿</span>구글 비밀번호</div>
            <div style={{ fontSize: 3.3 * u, color: C.muted, marginTop: 1.5 * u }}>teacher@myschool.hs.kr</div>
            <div style={{ marginTop: 2.5 * u, height: 12 * u, borderRadius: 3 * u, border: `1.5px solid ${filled ? '#3b82f6' : C.line}`, display: 'flex', alignItems: 'center', padding: `0 ${4 * u}px`, fontSize: filled ? 5 * u : 3.6 * u, letterSpacing: filled ? 1 : 0, color: filled ? C.ink : C.faint, background: filled ? '#eff6ff' : '#fff' }}>
              {filled ? '●●●●●●●●●●' : '비밀번호'}
            </div>
            {filled && t < T.SEND && <div style={{ fontSize: 2.9 * u, color: C.muted, marginTop: 1.2 * u }}>휴대폰의 비밀번호 관리자가 채웠습니다</div>}
            <div data-pt="send" style={{ marginTop: 3.5 * u, height: 12 * u, borderRadius: 3 * u, background: '#2563eb', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 4 * u, fontWeight: 600, ...ring(t, T.SEND, '#2563eb') }}>🔒 교실 기기로 보내기</div>
            <div style={{ marginTop: 3 * u, fontSize: 2.9 * u, color: C.muted, lineHeight: 1.55, wordBreak: 'keep-all' }}>✓ 비밀번호는 이 휴대폰에서 암호화되어 그 교실 기기만 풀 수 있습니다. 서버는 내용을 볼 수 없고 바로 지웁니다.</div>
          </div>
        ) : (
          <div style={{ marginTop: 3 * u, borderRadius: 5 * u, background: C.card, border: `1px solid ${C.line}`, padding: 6 * u, textAlign: 'center' }}>
            <span style={{ display: 'grid', placeItems: 'center', width: 15 * u, height: 15 * u, margin: '0 auto', borderRadius: '50%', background: '#ecfdf5', color: '#10b981', fontSize: 8 * u, fontWeight: 800 }}>✓</span>
            <div style={{ marginTop: 3 * u, fontSize: 4.5 * u, fontWeight: 700 }}>교실 기기로 보냈습니다</div>
            <div style={{ marginTop: 1.5 * u, fontSize: 3.3 * u, color: C.muted, lineHeight: 1.55, wordBreak: 'keep-all' }}>곧 교실 화면의 구글 로그인이 이어집니다. 이 휴대폰에 구글 확인 알림이 오면 «예»를 누르세요.</div>
          </div>
        )}
      </div>
      {alert && (
        <div style={{ position: 'absolute', left: 3 * u, right: 3 * u, top: 3 * u, borderRadius: 5 * u, background: '#fff', boxShadow: '0 16px 30px -10px rgba(15,23,42,.45)', padding: 4 * u, transform: `translateY(${(1 - al) * -40 * u}px)`, opacity: Math.min(1, al * 1.6), zIndex: 3 }}>
          <div style={{ fontSize: 3 * u, color: C.muted }}>Google · 지금</div>
          <div style={{ fontSize: 4.2 * u, fontWeight: 700, marginTop: 1 * u }}>로그인하려고 하시나요?</div>
          <div style={{ fontSize: 3.2 * u, color: C.muted, marginTop: 1 * u }}>Windows · 수업용 Edge</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 3 * u, marginTop: 3 * u }}>
            <span style={{ fontSize: 3.6 * u, color: '#1a73e8', padding: `${1.6 * u}px ${3 * u}px` }}>아니요</span>
            <span data-pt="yes" style={{ fontSize: 3.6 * u, background: '#1a73e8', color: '#fff', borderRadius: 99, padding: `${1.6 * u}px ${5 * u}px`, fontWeight: 700, ...ring(t, T.YES, '#1a73e8') }}>예</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Stage() {
  const t = useSceneTime();
  const phoneIn = spring(t, 0.3, 0.7);
  const typeOn = t >= T.TYPEWIN && t < T.OK;
  const gwBack = t >= T.OK;
  const envU = interpolate(t, [T.ENV, T.ARRIVE], [0, 1], easeInOut);
  const [ex, ey] = bez(P0, P1, P2, envU);
  const envOn = t >= T.ENV && t < T.ARRIVE + 0.25;
  return (
    <>
      <Head chapter="⑥ 구글 · 2/5" title="휴대폰으로 로그인: 비밀번호를 칠판에 치지 않는다" />

      <Monitor x={MON.x} y={MON.y} w={MON.w} h={MON.h}>
        <Desktop style={{ inset: 0 }}>
          {t >= T.TYPEWIN && <EdgeLogin t={t} />}
          {(!typeOn || gwBack) && (
            <GoogleWin k={0.82} status={gwBack ? 'ok' : 'none'} refs={{ phone: 'phonebtn' }} phoneStyle={ring(t, T.PHONEBTN)}
              style={{ left: gwBack ? 560 : 300, top: 22, transform: 'scale(0.98)', transformOrigin: 'top left', ...(gwBack ? popIn(t, T.OK) : {}) }} />
          )}
          {typeOn && <TypeWin t={t} style={popIn(t, T.TYPEWIN)} />}
          <Dock tiles={BASE_TILES.map((x) => (x.id === 'google' && gwBack ? { ...x, badge: '✓', badgeTone: 'ok' } : x))} k={0.62} style={{ left: 170, bottom: 50 }} />
        </Desktop>
      </Monitor>

      {/* 봉인 봉투 — 휴대폰에서 교실 PC 로 */}
      {envOn && (
        <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 40 }}>
          <path d={`M${P0[0]},${P0[1]} Q${P1[0]},${P1[1]} ${P2[0]},${P2[1]}`} fill="none" stroke={C.primary} strokeWidth={3} strokeDasharray="3 10" strokeLinecap="round" opacity={0.45} />
          <g transform={`translate(${ex},${ey}) rotate(${-8 + 16 * envU})`}>
            <rect x={-46} y={-30} width={92} height={60} rx={8} fill="#fff" stroke={C.primary} strokeWidth={4} />
            <path d="M-46,-30 L0,6 L46,-30" fill="none" stroke={C.primary} strokeWidth={4} strokeLinejoin="round" />
            <circle cx={0} cy={10} r={13} fill={C.danger} />
            <text x={0} y={16} textAnchor="middle" fontSize={15} fontWeight={800} fill="#fff">🔒</text>
          </g>
        </svg>
      )}
      {envOn && (
        <div style={{ position: 'absolute', left: 1190, top: 172, zIndex: 41, opacity: interpolate(t, [T.ENV, T.ENV + 0.3], [0, 1]) }}>
          <Chip tone="ok" style={{ fontSize: 21 }}>🔒 서버는 내용을 볼 수 없음</Chip>
        </div>
      )}
      {t >= T.DOTS && t < T.ALERT + 1.6 && (
        <div style={{ position: 'absolute', left: 140, top: 862, zIndex: 41, opacity: interpolate(t, [T.DOTS, T.DOTS + 0.3], [0, 1]) }}>
          <Chip tone="primary" style={{ fontSize: 21 }}>교실 화면에는 ● 만 — 비밀번호 글자는 보이지 않음</Chip>
        </div>
      )}

      <div style={{ position: 'absolute', inset: 0, transform: `translateX(${(1 - phoneIn) * 520}px)`, opacity: Math.min(1, phoneIn * 2) }}>
        <Phone x={PH.x} y={PH.y} w={PH.w} url={t >= T.PAGE ? 'spacekijun.lovable.app/classroom/type' : undefined}>
          <PhoneScreen t={t} />
        </Phone>
      </div>

      <Cursor path={[
        { t: 0.7, x: 30, y: 55 },
        { t: T.PHONEBTN, x: TG.phoneBtn.x, y: TG.phoneBtn.y, click: true },
        { t: 2.0, x: TG.phoneBtn.x + 3, y: TG.phoneBtn.y + 6, hide: true },
        { t: 5.9, x: TG.send.x - 2, y: TG.send.y + 10, finger: true },
        { t: T.SEND, x: TG.send.x, y: TG.send.y, click: true, finger: true },
        { t: 7.0, x: TG.send.x, y: TG.send.y, hide: true, finger: true },
        { t: T.YES, x: TG.yes.x, y: TG.yes.y, click: true, finger: true },
        { t: 12.0, x: TG.yes.x, y: TG.yes.y, hide: true, finger: true },
      ]} />
      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S21() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
