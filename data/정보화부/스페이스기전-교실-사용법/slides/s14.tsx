import type { CSSProperties } from 'react';
import { Scene, useSceneTime, interpolate, easeInOut } from '../../../../src/scene';
import { AppWindow, popIn } from '../../../../src/walkthrough';
import { C, Head, SceneSubs, Cursor, Dock, LOOK, Glyph, Chip, type DockTile, type SlideMeta, type Sub } from '../kit';
import { Toast } from './_pc';

/* 14 — walkthrough: 독에서 열기 — 사이트 · 프로그램 · 스페이스기전 화면
   구도: 화면 아래 가운데 고정된 독에서 세 창이 솟아올라 왼쪽·가운데·오른쪽 부채꼴로 정착(분기). */

const T = { PADLET: 1.2, W1: 1.9, PPT: 5.0, W2: 5.6, HWP: 7.8, TOAST: 8.2, SEAT: 10.8, W3: 11.4 };
const DUR = 15;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '사이트 타일은 이번 수업만 쓰는 빈 브라우저에서 열립니다. 수업이 끝나면 그 브라우저째 지웁니다.' },
  { at: 4.6, text: '프로그램 타일은 교실 PC에 설치된 프로그램을 엽니다. 설치되지 않았으면 알림이 뜹니다.' },
  { at: 10.4, text: '스페이스기전 화면은 선생님 계정으로 로그인된 채 열리고, 수업이 끝나면 서버가 로그아웃시킵니다.' },
];

const DK = 1.15, DX = 330, DY = 790, DWID = 1260;
const tileX = (i: number) => DX + 14 * DK + 170 * DK + 12 * DK + 1 + 12 * DK + i * 78 * DK + 37 * DK;
/* 포인터 좌표(씬 %) — measure_pointer.mjs 실측 2026-10-15 */
const TG = { padlet: { x: 45.9, y: 78.6 }, ppt: { x: 50.6, y: 78.6 }, hwp: { x: 55.3, y: 78.6 }, seat: { x: 59.9, y: 78.6 } };

const WIN = [
  { x: 84, y: 196, w: 560, h: 390, rot: -3, from: 3 },
  { x: 680, y: 176, w: 560, h: 390, rot: 0, from: 4 },
  { x: 1276, y: 196, w: 560, h: 390, rot: 3, from: 6 },
];

/** 지나간 창은 어둡게 물렸다가, 마지막 요약 컷(13.4초~)에서 셋 다 다시 밝힌다 */
function dimBack(t: number, at: number): CSSProperties {
  if (t <= at) return {};
  const k = Math.min(interpolate(t, [at, at + 0.6], [1, 0.6], easeInOut), 1) + interpolate(t, [13.4, 14.0], [0, 0.4], easeInOut);
  return { filter: `brightness(${k}) saturate(${0.5 + 0.5 * k})` };
}

function Lead({ i, t, at }: { i: number; t: number; at: number }) {
  const w = WIN[i];
  const u = interpolate(t, [at - 0.3, at + 0.3], [0, 1], easeInOut);
  if (u <= 0) return null;
  const x0 = tileX(w.from), y0 = DY - 6;
  const x1 = w.x + w.w / 2, y1 = w.y + w.h + 8;
  return (
    <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <path d={`M${x0},${y0} C${x0},${y0 - 90} ${x1},${y1 + 90} ${x1},${y1}`} fill="none" stroke={C.primary} strokeWidth={4} strokeDasharray="8 8" opacity={0.75 * u} />
    </svg>
  );
}

const tag = (t: number, at: number): CSSProperties => ({ position: 'absolute', right: 18, top: -24, zIndex: 3, opacity: interpolate(t, [at + 0.3, at + 0.7], [0, 1]) });

function Stage() {
  const t = useSceneTime();
  const tiles: DockTile[] = [
    { id: 'google', look: LOOK.google, label: '구글' },
    { id: 'drive', look: LOOK.mydrive, label: '내 드라이브' },
    { id: 'classroom', look: LOOK.classroom, label: '클래스룸' },
    { id: 'padlet', look: LOOK.site, label: '패들렛', spin: t > T.PADLET && t < T.W1 ? (t - T.PADLET) * 500 : undefined },
    { id: 'ppt', look: LOOK.powerpoint, label: 'PowerPoint', spin: t > T.PPT && t < T.W2 ? (t - T.PPT) * 500 : undefined },
    { id: 'hwp', look: LOOK.hwp, label: '한글', badge: t > T.TOAST ? '!' : undefined, badgeTone: 'err', spin: t > T.HWP && t < T.TOAST ? (t - T.HWP) * 500 : undefined },
    { id: 'seat', look: LOOK.space, label: '자리 배치', spin: t > T.SEAT && t < T.W3 ? (t - T.SEAT) * 500 : undefined },
  ];
  const toastK = interpolate(t, [T.TOAST, T.TOAST + 0.3], [0, 1]) * interpolate(t, [10.2, 10.6], [1, 0]);
  return (
    <>
      <Head chapter="④ 수업 시작과 독 · 3/3" title="독에서 열기: 종류마다 열리는 곳이 다릅니다" />

      <Lead i={0} t={t} at={T.W1} />
      <Lead i={1} t={t} at={T.W2} />
      <Lead i={2} t={t} at={T.W3} />

      {/* ① 패들렛 — 수업용 Edge */}
      {t >= T.W1 && (
        <AppWindow kind="browser" url="padlet.com/kijun/1-3-오늘의-질문" badge="①"
          style={{ left: WIN[0].x, top: WIN[0].y, width: WIN[0].w, height: WIN[0].h, ...popIn(t, T.W1), ...dimBack(t, T.W2), rotate: `${WIN[0].rot}deg` }}
          bodyStyle={{ background: 'linear-gradient(160deg,#f5f3ff,#ede9fe)', padding: 18 }}>
          <span style={tag(t, T.W1)}><Chip style={{ fontSize: 19, padding: '5px 12px' }}>이번 수업 전용 브라우저</Chip></span>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#4c1d95' }}>1-3 · 오늘의 질문</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
            {[3, 2, 3].map((n, c) => (
              <div key={c} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Array.from({ length: n }).map((_, r) => (
                  <div key={r} style={{ background: '#fff', borderRadius: 10, padding: 10, boxShadow: '0 2px 6px rgba(76,29,149,.12)' }}>
                    <div style={{ height: 9, width: '70%', borderRadius: 5, background: '#c4b5fd' }} />
                    <div style={{ height: 7, width: '90%', borderRadius: 4, background: '#e5e7eb', marginTop: 8 }} />
                    <div style={{ height: 7, width: '55%', borderRadius: 4, background: '#e5e7eb', marginTop: 6 }} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </AppWindow>
      )}

      {/* ② PowerPoint — 교실 PC 프로그램 */}
      {t >= T.W2 && (
        <AppWindow kind="app" title="PowerPoint" badge="②"
          style={{ left: WIN[1].x, top: WIN[1].y, width: WIN[1].w, height: WIN[1].h, ...popIn(t, T.W2), ...dimBack(t, T.W3) }}
          bodyStyle={{ display: 'flex', background: '#fff' }}>
          <span style={tag(t, T.W2)}><Chip tone="warn" style={{ fontSize: 19, padding: '5px 12px' }}>교실 PC 프로그램</Chip></span>
          <div style={{ width: 120, background: '#c43e1c', color: '#fff', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 14, fontSize: 17 }}>
            <b style={{ fontSize: 19 }}>PowerPoint</b><span>홈</span><span>새로 만들기</span><span>열기</span>
          </div>
          <div style={{ flex: 1, padding: 18 }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>새로 만들기</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
              {['새 프레젠테이션', '테마'].map((n, i) => (
                <div key={n} style={{ textAlign: 'center', fontSize: 14, color: C.muted }}>
                  <div style={{ width: 150, height: 86, border: `2px solid ${i === 0 ? '#c43e1c' : C.line}`, borderRadius: 6, background: i ? 'linear-gradient(135deg,#fde68a,#fb923c)' : '#fff' }} />
                  <div style={{ marginTop: 6 }}>{n}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 16 }}>최근 항목</div>
            {['3주차 개념 정리.pptx', '오리엔테이션.pptx'].map((n) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${C.line}`, fontSize: 16 }}>
                <Glyph look={LOOK.powerpoint} size={26} />{n}
              </div>
            ))}
          </div>
        </AppWindow>
      )}

      {/* ③ 자리 배치 — 스페이스기전 화면 */}
      {t >= T.W3 && (
        <AppWindow kind="app" title="스페이스기전 — 자리 배치" badge="③"
          style={{ left: WIN[2].x, top: WIN[2].y, width: WIN[2].w, height: WIN[2].h, ...popIn(t, T.W3), rotate: `${WIN[2].rot}deg` }}
          bodyStyle={{ background: C.bg, padding: 16 }}>
          <span style={tag(t, T.W3)}><Chip tone="ok" style={{ fontSize: 19, padding: '5px 12px' }}>로그인된 채로</Chip></span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <b style={{ fontSize: 21 }}>자리 배치 · 1-3</b>
            <span style={{ fontSize: 14, color: C.ok, background: '#dcfce7', borderRadius: 99, padding: '4px 10px', fontWeight: 700 }}>✓ 김기전 선생님</span>
          </div>
          <div style={{ margin: '12px auto 10px', width: 200, textAlign: 'center', fontSize: 13, color: C.muted, background: '#e2e8f0', borderRadius: 6, padding: 4 }}>교탁</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} style={{ height: 44, borderRadius: 8, background: '#fff', border: `1px solid ${C.line}`, display: 'grid', placeItems: 'center', fontSize: 14, color: C.muted }}>{i + 1}번</div>
            ))}
          </div>
        </AppWindow>
      )}

      {t >= T.TOAST && toastK > 0 && (
        <Toast k={1.25} error style={{ left: 640, top: 660, opacity: toastK, zIndex: 4 }}>이 기기에 설치되어 있지 않거나 등록되지 않은 프로그램입니다.</Toast>
      )}

      <Dock tiles={tiles} k={DK} width={DWID} style={{ left: DX, top: DY }}
        tileRefs={{ padlet: 'padlet', ppt: 'ppt', hwp: 'hwp', seat: 'seat' }} />

      <Cursor path={[
        { t: 0.6, x: 40, y: 70 },
        { t: T.PADLET, x: TG.padlet.x, y: TG.padlet.y, click: true },
        { t: T.PPT, x: TG.ppt.x, y: TG.ppt.y, click: true },
        { t: T.HWP, x: TG.hwp.x, y: TG.hwp.y, click: true },
        { t: T.SEAT, x: TG.seat.x, y: TG.seat.y, click: true },
        { t: T.SEAT + 1.2, x: TG.seat.x + 4, y: TG.seat.y + 4, hide: true },
      ]} />
      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S14() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
