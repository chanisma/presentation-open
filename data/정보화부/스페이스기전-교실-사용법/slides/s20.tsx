import type { ReactNode } from 'react';
import Build from '../../../../src/deck/Build';
import { useDeck } from '../../../../src/deck/DeckContext';
import { C, Head, BuildSubs, Dock, BASE_TILES, type SlideMeta } from '../kit';
import { GoogleWin, AppTile } from './_drive';

/* 20 — build: 구글 창 — 로그인 없이 바로 vs 웹으로 열기
   메타포: 두 문 — 구글 창을 위아래로 가르는 굵은 선이 «열쇠 없이 들어가는 문 / 열쇠가 필요한 문»을 나눈다.
   선은 창 밖 오른쪽 해설 열까지 이어진다. */

const SUBS = [
    '독 맨 앞의 «구글»을 누르면 구글 창이 뜹니다.',
    '위쪽 세 개는 로그인 없이 바로 씁니다. QR로 승인할 때 받은 권한으로 프로그램 안에서 열립니다.',
    '아래 열두 개는 구글 웹 화면이라 구글 로그인이 필요합니다.',
    '맨 아래 줄에서 지금 로그인되어 있는지 확인하고, 필요하면 [휴대폰으로 로그인]을 누르세요.',
];
export const meta: SlideMeta = { kind: 'build', subs: SUBS };

const W = { x: 150, y: 176, k: 1.3 };
/* 창 안 구역의 y(설계 박스 px) — 2026-10-15 캡처로 맞춤 */
const Y = { toolsTop: 264, split: 398, appsBottom: 806, footTop: 806, footBottom: 930 };

function Door({ top, height, title, sub, tone, children }: { top: number; height: number; title: string; sub: string; tone: string; children?: ReactNode }) {
  return (
    <div style={{ position: 'absolute', left: 1010, top, width: 840, height, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10, paddingLeft: 34, borderLeft: `6px solid ${tone}` }}>
      <div style={{ fontSize: 38, fontWeight: 850, letterSpacing: -1, color: tone, wordBreak: 'keep-all' }}>{title}</div>
      <div style={{ fontSize: 25, lineHeight: 1.5, color: C.ink, wordBreak: 'keep-all' }}>{sub}</div>
      {children}
    </div>
  );
}

export default function S20() {
  const { clicks, isStatic } = useDeck();
  const c = isStatic ? 3 : clicks;
  const box = (top: number, bottom: number, col: string) => ({
    position: 'absolute' as const, left: W.x - 10, top, width: 560 * W.k + 20, height: bottom - top, borderRadius: 18, border: `5px solid ${col}`, zIndex: 5,
  });
  return (
    <>
      <Head chapter="⑥ 구글 · 1/5" title="구글 창: 로그인 없이 바로 vs 웹으로 열기" />

      <GoogleWin k={W.k} status={c >= 3 ? 'ok' : 'none'} saved={c >= 3} style={{ left: W.x, top: W.y }} appsStyle={{ paddingTop: 14 }} />

      {/* 두 문을 가르는 선 — 창 밖 해설 열까지 */}
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 6 }}>
        <line x1={W.x - 30} y1={Y.split} x2={1850} y2={Y.split} stroke={C.ink} strokeWidth={5} strokeDasharray="2 0" opacity={c >= 1 ? 0.85 : 0.25} />
      </svg>

      <Build at={1} style={box(Y.toolsTop, Y.split - 8, C.ok)}><span /></Build>
      <Build at={1} style={{ position: 'absolute', inset: 0 }}>
        <Door top={190} height={200} tone={C.ok} title="로그인 없이 바로" sub="QR 승인 때 받은 권한으로, 이 프로그램 안 화면에서 엽니다.">
          <div style={{ display: 'flex', gap: 12 }}>
            {([['클래스룸', 'C', '#188038'], ['슬라이드 발표', '슬', '#f4b400'], ['설문지', '설', '#7248b9']] as const).map(([n, l, col]) => (
              <span key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 22, fontWeight: 700 }}><AppTile letter={l} color={col} size={34} />{n}</span>
            ))}
          </div>
        </Door>
      </Build>

      <Build at={2} style={box(Y.split + 8, Y.appsBottom - 4, C.primary)}><span /></Build>
      <Build at={2} style={{ position: 'absolute', inset: 0 }}>
        <Door top={430} height={200} tone={C.primary} title="웹으로 열기 · 구글 로그인 필요" sub="수업용 Edge 에서 원래 구글 웹 화면이 열립니다. 만들기·채점처럼 모든 기능은 여기서." />
      </Build>

      <Build at={3} style={box(Y.footTop, Y.footBottom, C.warn)}><span /></Build>
      <Build at={3} style={{ position: 'absolute', inset: 0 }}>
        <div style={{ position: 'absolute', left: 1010, top: 690, width: 840, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.muted }}>맨 아래 로그인 상태 줄</div>
          <div style={{ padding: '12px 18px', borderRadius: 12, background: '#f1f5f9', fontSize: 23, fontWeight: 600 }}>구글에 로그인되어 있지 않습니다.</div>
          <div style={{ padding: '12px 18px', borderRadius: 12, background: '#dcfce7', color: '#166534', fontSize: 23, fontWeight: 600 }}>✓ 로그인됨 · teacher@myschool.hs.kr</div>
          <div style={{ fontSize: 22, color: C.ink }}>로그인이 필요하면 → <b style={{ color: C.primary }}>[휴대폰으로 로그인]</b></div>
        </div>
      </Build>

      {/* 독의 «구글» — 이 창을 여는 곳 */}
      {c === 0 && (
        <Dock tiles={BASE_TILES.map((x) => (x.id === 'google' ? { ...x, style: { boxShadow: `0 0 0 4px ${C.primary}` } } : x))} k={0.8} style={{ left: 1010, top: 560 }} />
      )}
      {c === 0 && (
        <div style={{ position: 'absolute', left: 1010, top: 480, fontSize: 26, fontWeight: 700, color: C.primary }}>← 독 맨 앞 «구글»을 누르면 이 창이 뜹니다</div>
      )}

      <BuildSubs lines={SUBS} />
    </>
  );
}
