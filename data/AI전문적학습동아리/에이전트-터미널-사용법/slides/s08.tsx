import Build from '../../../../src/deck/Build';
import { C, MONO, Head, BuildSubs, SHOT, type SlideMeta } from '../kit';
import { Hi, onBox, useStep, type Box } from './_b';

/* 8 — build: 패널 한눈에 보기 (실화면 A-03, 열린 탐색기 창은 A-06b 조각)
   구도: 왼쪽에 실제 패널을 크게 세우고, 단계마다 그 구역이 빛나며 오른쪽 해설 카드가 한 장씩 꽂힌다.
   왼쪽 아래 독 조각에서 «오른쪽 클릭»이 패널로 올라가는 화살표가 시작점이다. 좌표는 패널 캡처(808×1008) px. */

const SUBS = [
  '독의 아이콘을 오른쪽 클릭하면 언제나 이 패널이 열립니다.',
  '맨 위에는 독을 누르기 전에 보던 창이 적혀 있습니다.',
  '쓸 에이전트를 Claude Code와 Codex 가운데 고릅니다.',
  '«권한 묻지 않기»는 기본으로 꺼져 있습니다. 뒤에서 따로 설명합니다.',
  '보던 창의 폴더가 여기 나오고, 줄을 누르면 그 폴더에서 열립니다.',
  '자주 쓰는 폴더를 넣어 두면 다음부터 한 번에 고를 수 있습니다.',
];
export const meta: SlideMeta = { kind: 'build', subs: SUBS };

const P: Box = { x: 330, y: 146, k: 0.78 }; // 패널 실화면 자리
const R = [
  [40, 44, 730, 100],   // 1 머리 — 지금 보던 창
  [54, 180, 700, 66],   // 2 에이전트 고르기
  [44, 266, 720, 112],  // 3 권한 묻지 않기
  [40, 420, 730, 135],  // 4 지금 보던 창의 폴더
  [40, 596, 730, 165],  // 5 자주 쓰는 폴더 · ＋ 폴더 넣기
] as const;

const CARDS: { y: number; title: string; text: string; code?: string }[] = [
  { y: 160, title: '지금 보던 창', text: '독을 누르기 바로 전에 보던 창. 예: «파일 탐색기 — 수업 자료»' },
  { y: 300, title: '에이전트 고르기', text: 'Claude Code | Codex — 기본은 Claude Code. 고르면 바로 저장됩니다.' },
  { y: 440, title: '권한 묻지 않기', text: '기본 꺼짐. 켜면 묻지 않고 파일을 고칩니다 — 15장에서 자세히.', code: '--dangerously-skip-permissions' },
  { y: 590, title: '지금 보던 창의 폴더', text: '☆ 자주 쓰는 폴더에 넣기 · «열기» — 줄 아무 곳이나 눌러도 열립니다.' },
  { y: 735, title: '자주 쓰는 폴더 · 열린 탐색기 창', text: '«＋ 폴더 넣기»로 20개까지. 열려 있는 탐색기 창도 따로 모여 나옵니다.' },
];

function Card({ i, step }: { i: number; step: number }) {
  const c = CARDS[i];
  const now = step === i + 1;
  const ry = P.y + (R[i][1] + R[i][3] / 2) * P.k;
  return (
    <Build at={i + 1} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <path d={`M${P.x + 780 * P.k},${ry} C980,${ry} 990,${c.y + 50} 1030,${c.y + 50}`} fill="none" stroke={now ? C.gold : 'rgba(31,27,22,.25)'} strokeWidth={now ? 3 : 2} />
        <circle cx={P.x + 780 * P.k} cy={ry} r={6} fill={now ? C.gold : 'rgba(31,27,22,.35)'} />
      </svg>
      <div style={{ position: 'absolute', left: 1030, top: c.y, width: 830, padding: '16px 22px', borderRadius: 14, background: C.panel,
        border: `1.5px solid ${now ? C.gold : C.line}`, boxShadow: now ? '0 18px 40px -22px rgba(217,105,46,.6)' : '0 10px 30px -24px rgba(31,27,22,.4)', transition: 'border-color .3s, box-shadow .3s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 34, height: 34, borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 18, color: '#fff', background: now ? C.gold : C.muted }}>{i + 1}</span>
          <span style={{ fontSize: 27, fontWeight: 800, color: C.ink }}>{c.title}</span>
          {c.code && <code style={{ fontFamily: MONO, fontSize: 16, color: C.muted, background: C.bg2, borderRadius: 6, padding: '2px 8px' }}>{c.code}</code>}
        </div>
        <div style={{ marginTop: 6, marginLeft: 46, fontSize: 21, lineHeight: 1.45, color: C.muted, wordBreak: 'keep-all' }}>{c.text}</div>
        {i === 4 && (
          <div style={{ marginTop: 10, marginLeft: 46, width: 420, height: 92, borderRadius: 8, overflow: 'hidden', position: 'relative', background: '#1e2230' }}>
            <img src={SHOT('A-06b-패널-폴더여러개-전체')} alt="" style={{ position: 'absolute', left: -24 * 0.553, top: -1388 * 0.553, width: 808 * 0.553 }} />
          </div>
        )}
      </div>
    </Build>
  );
}

export default function S08() {
  const step = useStep(SUBS.length - 1);
  return (
    <>
      <Head chapter="③ 열기 · 2/4" title="패널 한눈에 보기" />
      {/* 실제 패널 */}
      <img src={SHOT('A-03-패널-기본')} alt="에이전트 터미널 패널" style={{ position: 'absolute', left: P.x, top: P.y, width: 808 * P.k, borderRadius: 26, boxShadow: '0 30px 70px -30px rgba(31,27,22,.55)' }} />
      {R.map((r, i) => (
        <Hi key={i} style={onBox(P, r)} on={step === i + 1 ? 1 : 0} />
      ))}
      {/* 왼쪽 아래: 독 조각 — 오른쪽 클릭이 시작점 */}
      <div style={{ position: 'absolute', left: 54, top: 700, width: 240 }}>
        <div style={{ width: 240, height: 150, borderRadius: 14, overflow: 'hidden', position: 'relative', background: '#1e2230', boxShadow: '0 16px 30px -18px rgba(31,27,22,.6)' }}>
          <img src={SHOT('A-01b-교사판-독-에이전트-가리킴')} alt="" style={{ position: 'absolute', left: -2330 * 0.6, top: -120 * 0.6, width: 3200 * 0.6 }} />
        </div>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 21, fontWeight: 700, color: C.gold }}>
          <span style={{ fontFamily: MONO, fontSize: 18, border: `1.5px solid ${C.gold}`, borderRadius: 6, padding: '1px 8px' }}>오른쪽 클릭</span> = 언제나 패널
        </div>
      </div>
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <defs><marker id="s08-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill={C.gold} /></marker></defs>
        <path d="M200,698 C210,560 250,520 320,500" fill="none" stroke={C.gold} strokeWidth={3} strokeDasharray="8 7" markerEnd="url(#s08-ah)" />
      </svg>
      {CARDS.map((_, i) => <Card key={i} i={i} step={step} />)}
      <BuildSubs lines={SUBS} />
    </>
  );
}
