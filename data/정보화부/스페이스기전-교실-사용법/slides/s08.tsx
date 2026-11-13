import Build from '../../../../src/deck/Build';
import { useDeck } from '../../../../src/deck/DeckContext';
import { C, Head, BuildSubs, Dock, Glyph, type SlideMeta } from '../kit';
import { ALWAYS, IT, BLUE, SetCard, Toast, toTile, type Item } from './_web';

/* 8 — build: 독에 놓일 순서와 저장
   구도: 위쪽 세로 목록 ↔ 아래쪽 가로 독(dominant)의 거울 구도. 세로 순서가 90도 돌아
   가로 순서가 된다는 것을 사분원 가이드선과 번호 배지가 보여 준다. */

const SUBS = [
  '왼쪽 목록의 위에서 아래 순서가 교실 독의 왼쪽에서 오른쪽 순서입니다.',
  '손잡이를 끌어 순서를 바꿉니다. 휴대폰에서는 길게 눌러 끕니다.',
  '빼고 싶으면 줄 끝의 X를 누르세요.',
  '[✓ 저장]을 누르면 세팅 카드가 생깁니다. 교실에 갈 준비는 여기까지입니다.',
];
export const meta: SlideMeta = { kind: 'build', subs: SUBS };

const BASE: Item[] = [IT.classroom, IT.padlet, IT.tkbell, IT.folder, IT.ppt, IT.seat];
const L = { x: 130, y: 226, w: 640, rowH: 56, gap: 8 };
const DK = { x: 240, y: 700, k: 1.45 };
const tileCx = (i: number) => DK.x + (14 + 170 + 12 + 1 + 12) * DK.k + i * 78 * DK.k + 37 * DK.k;
const NUM = ['①', '②', '③', '④', '⑤', '⑥'];

export default function S08() {
  const { clicks, isStatic } = useDeck();
  const n = isStatic ? 3 : Math.min(3, clicks);
  let order = BASE;
  if (n >= 1) order = [IT.ppt, ...BASE.filter((i) => i.id !== 'ppt')];
  const removed = n >= 2 ? 'tkbell' : null;
  const live = order.filter((i) => i.id !== removed);
  return (
    <>
      <Head chapter="② 세팅 만들기 · 6/7" title="목록의 순서 = 독의 순서" />

      {/* 세로 목록 */}
      <div style={{ position: 'absolute', left: L.x, top: 186, fontSize: 19, color: C.muted, fontWeight: 600 }}>☰ 독에 놓일 순서 <span style={{ fontWeight: 400, color: C.faint, marginLeft: 12 }}>{live.length}/30 · 끌어서 순서</span></div>
      <div style={{ position: 'absolute', left: L.x - 12, top: L.y - 12, width: L.w + 24, height: 6 * (L.rowH + L.gap) + 16, borderRadius: 16, background: '#f8fafc', border: `1px solid ${C.line}` }} />
      {order.map((it) => {
        const gone = it.id === removed;
        const idx = gone ? BASE.indexOf(it) : live.indexOf(it);
        const lifted = n === 1 && it.id === 'ppt';
        return (
          <div key={it.id} style={{
            position: 'absolute', left: L.x, top: L.y + (gone ? order.indexOf(it) : idx) * (L.rowH + L.gap), width: L.w, height: L.rowH, borderRadius: 12,
            background: gone ? '#fef2f2' : '#fff', border: `1px solid ${gone ? '#fecaca' : C.line}`, display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px',
            opacity: gone ? 0 : 1, transform: gone ? 'translateX(60px)' : lifted ? 'scale(1.03)' : undefined,
            boxShadow: lifted ? '0 18px 34px -16px rgba(15,23,42,.45)' : undefined, transition: 'top .7s cubic-bezier(.3,.7,.3,1), opacity .6s, transform .6s, box-shadow .4s', zIndex: lifted ? 3 : 1,
          }}>
            {!gone && <span style={{ position: 'absolute', left: -44, width: 30, textAlign: 'center', fontSize: 24, fontWeight: 800, color: C.primary }}>{NUM[idx]}</span>}
            <span style={{ color: lifted ? BLUE : '#cbd5e1', fontSize: 22, letterSpacing: -3, fontWeight: 800 }}>⋮⋮</span>
            <Glyph look={it.look} size={38} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 600 }}>{it.label}</div>
              <div style={{ fontSize: 15, color: C.muted }}>{it.kind}</div>
            </div>
            <span style={{ fontSize: 22, color: it.id === 'tkbell' && n >= 2 ? C.danger : C.faint }}>✕</span>
          </div>
        );
      })}
      <Build at={1} style={{ position: 'absolute', left: L.x + L.w + 26, top: L.y + 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 21, fontWeight: 700, color: BLUE }}>
          <span style={{ fontSize: 28 }}>↑</span> 손잡이를 끌어 맨 위로
        </div>
        <div style={{ fontSize: 17, color: C.muted, marginTop: 4, marginLeft: 40 }}>휴대폰은 길게 눌러 끌기</div>
      </Build>
      <Build at={2} style={{ position: 'absolute', left: L.x + L.w + 26, top: L.y + 3 * (L.rowH + L.gap) + 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 21, fontWeight: 700, color: C.danger }}>
          <span style={{ fontSize: 24 }}>✕</span> 띵커벨 빼기
        </div>
      </Build>

      {/* 90도 회전 가이드 — 세로 목록에서 가로 독으로 */}
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <defs>
          <marker id="s8-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 Z" fill={C.primary} /></marker>
        </defs>
                <path d="M 112,240 L 112,612 A 236,276 0 0 0 348,888 L 1660,888" fill="none" stroke={C.primary} strokeWidth={4} strokeLinecap="round" markerEnd="url(#s8-arrow)" opacity={0.55} />
              </svg>
      <div style={{ position: 'absolute', left: 820, top: 632, fontSize: 22, fontWeight: 700, color: C.primary }}>위→아래 = 왼쪽→오른쪽</div>

      {/* 가로 독 미리 보기 */}
      <Dock tiles={[...ALWAYS, ...live.map(toTile)]} teacher="선생님" title="1-3 정보 수업" time="50:00" k={DK.k} width={1500} style={{ left: DK.x, top: DK.y, background: '#f1f5f9' }} />
      {live.map((it, i) => (
        <span key={it.id} style={{ position: 'absolute', left: tileCx(i + 2) - 15, top: DK.y - 34, width: 30, textAlign: 'center', fontSize: 24, fontWeight: 800, color: C.primary }}>{NUM[i]}</span>
      ))}

      {/* 저장 */}
      <div style={{ position: 'absolute', left: 1240, top: 214, width: 600, height: 84, borderRadius: 16, background: '#fff', border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14, padding: '0 20px' }}>
        <span style={{ fontSize: 20, color: '#475569', padding: '10px 18px' }}>취소</span>
        <span style={{ fontSize: 21, background: BLUE, color: '#fff', borderRadius: 12, padding: '12px 26px', fontWeight: 700, boxShadow: n >= 3 ? '0 0 0 8px rgba(37,99,235,.25)' : undefined, transition: 'box-shadow .4s' }}>✓ 저장</span>
      </div>
      <Build at={3} style={{ position: 'absolute', left: 1240, top: 318, width: 600 }}>
        <Toast style={{ position: 'relative' }}>교실 세팅을 저장했습니다.</Toast>
        <SetCard title="1-3 정보 수업" section="정보 1-3" items={live} used="아직 안 씀" style={{ position: 'relative', marginTop: 16, width: 600 }} />
      </Build>
      <BuildSubs lines={SUBS} />
    </>
  );
}
