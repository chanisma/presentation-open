import Build from '../../../../src/deck/Build';
import { useDeck } from '../../../../src/deck/DeckContext';
import { C, Head, BuildSubs, Dock, Glyph, LOOK, Chip, type SlideMeta, type DockTile, type Look } from '../kit';
import { ALWAYS, BLUE } from './_web';

/* 5 — build: 더하기 탭 다섯 개가 독의 타일이 된다
   구도: 왼쪽 위 탭 줄 → 오른쪽 아래 실제 독으로 흐르는 대각선 매핑. 탭 하나마다
   «누르면 어떻게 열리는지» 카드 + 곡선 + 독 타일이 함께 나온다. */

const SUBS = [
    '세팅 창에는 다섯 개의 «더하기» 탭이 있습니다. «구글»과 «내 드라이브»는 넣지 않아도 독에 늘 있습니다.',
    '«구글 앱»은 클래스룸·문서·설문지 같은 구글 서비스입니다.',
    '«웹사이트»는 패들렛·ChatGPT 같은 사이트입니다. 이번 수업만 쓰는 빈 브라우저에서 열립니다.',
    '«드라이브»에서 고른 폴더는 탐색기로, 파일은 PC 프로그램으로 열립니다.',
    '«프로그램»은 교실 PC에 설치된 PowerPoint·한글 같은 것입니다.',
    '«스페이스기전»은 자리 배치·출결 같은 화면입니다. 선생님 계정으로 로그인된 채 열리고, 끝나면 서버가 로그아웃시킵니다.',
];
export const meta: SlideMeta = { kind: 'build', subs: SUBS };

type Col = { tab: string; tile: DockTile; color: string; head: string; body: string; ex: Look[] };
const COLS: Col[] = [
  { tab: '구글 앱', tile: { id: 'classroom', look: LOOK.classroom, label: '클래스룸' }, color: '#15803d', head: '수업용 Edge에서', body: '구글 서비스로 열림', ex: [LOOK.classroom, LOOK.docs, LOOK.forms] },
  { tab: '웹사이트', tile: { id: 'padlet', look: LOOK.site, label: '패들렛' }, color: '#0891b2', head: '이번 수업만 쓰는', body: '빈 브라우저(수업용 Edge)', ex: [LOOK.site, LOOK.site, LOOK.site] },
  { tab: '드라이브', tile: { id: 'folder', look: LOOK.folder, label: '수업자료' }, color: '#d97706', head: '폴더 → 탐색기', body: '파일 → 받아서 PC 프로그램', ex: [LOOK.folder, LOOK.file] },
  { tab: '프로그램', tile: { id: 'ppt', look: LOOK.powerpoint, label: 'PowerPoint' }, color: '#ea580c', head: '교실 PC에 설치된', body: '허용 목록 프로그램만', ex: [LOOK.powerpoint, LOOK.hwp, LOOK.word] },
  { tab: '스페이스기전', tile: { id: 'seat', look: LOOK.space, label: '자리 배치' }, color: C.primary, head: '로그인된 채로', body: '끝나면 서버가 로그아웃', ex: [LOOK.space, LOOK.space] },
];

const TAB_X = 110, TAB_Y = 218, TAB_W = 232, TAB_GAP = 18;
const colX = (i: number) => TAB_X + i * (TAB_W + TAB_GAP);
/* 독 배치(k=1.3) — 타일 i(0=구글)의 가운데 x */
const DK = { x: 520, y: 700, k: 1.3 };
const tileCx = (i: number) => DK.x + (14 + 170 + 12 + 1 + 12) * DK.k + i * (74 + 4) * DK.k + 37 * DK.k;

export default function S05() {
  const { clicks, isStatic } = useDeck();
  const n = isStatic ? 5 : Math.min(5, clicks);
  const tiles: DockTile[] = [
    ...ALWAYS.map((a) => ({ ...a, style: n === 0 ? { background: 'rgba(79,70,229,.08)' } : undefined })),
    ...COLS.slice(0, n).map((c) => c.tile),
  ];
  return (
    <>
      <Head chapter="② 세팅 만들기 · 3/7" title="탭 다섯 개 → 독의 타일" />
      <div style={{ position: 'absolute', left: TAB_X, top: 182, fontSize: 19, color: C.muted, fontWeight: 600 }}>세팅 창 «더하기» 탭</div>
      {COLS.map((c, i) => {
        const on = n === i + 1;
        const done = n >= i + 1;
        return (
          <div key={c.tab} style={{
            position: 'absolute', left: colX(i), top: TAB_Y, width: TAB_W, height: 64, borderRadius: 14, display: 'grid', placeItems: 'center', fontSize: 27, fontWeight: 700,
            background: on ? '#fff' : done ? '#fff' : '#eef1f6', color: on ? BLUE : done ? C.ink : '#64748b',
            border: `2px solid ${on ? BLUE : done ? C.line : 'transparent'}`, boxShadow: on ? '0 8px 24px -10px rgba(37,99,235,.45)' : undefined, transition: 'all .35s',
          }}>{c.tab}</div>
        );
      })}

      {/* 늘 있는 두 타일 */}
      <div style={{ position: 'absolute', left: tileCx(0) - 60, top: 858, width: tileCx(1) - tileCx(0) + 120, display: 'flex', justifyContent: 'center' }}>
        <Chip tone="muted" style={{ fontSize: 19, padding: '6px 14px' }}>늘 있음 · 넣지 않아도 됨</Chip>
      </div>

      {COLS.map((c, i) => {
        const x0 = colX(i) + TAB_W / 2, y0 = 458;
        const x1 = tileCx(i + 2), y1 = DK.y + 6;
        return (
          <Build key={c.tab} at={i + 1} style={{ position: 'absolute', inset: 0 }}>
            <div style={{ position: 'absolute', left: colX(i), top: 300, width: TAB_W, height: 156, borderRadius: 16, background: '#fff', border: `2px solid color-mix(in srgb, ${c.color} 35%, #fff)`, padding: '14px 16px', boxShadow: '0 10px 30px -18px rgba(15,23,42,.35)' }}>
              <div style={{ display: 'flex', gap: 6 }}>{c.ex.map((l, k) => <Glyph key={k} look={l} size={34} />)}</div>
              <div style={{ fontSize: 15, color: C.muted, marginTop: 12 }}>누르면</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: c.color, lineHeight: 1.3, wordBreak: 'keep-all' }}>{c.head}</div>
              <div style={{ fontSize: 17, color: C.ink, lineHeight: 1.3, wordBreak: 'keep-all' }}>{c.body}</div>
            </div>
            <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <path d={`M${x0},${y0} C${x0},${(y0 + y1) / 2 + 40} ${x1},${(y0 + y1) / 2 - 40} ${x1},${y1}`} fill="none" stroke={c.color} strokeWidth={4} strokeLinecap="round" strokeDasharray="2 9" />
              <circle cx={x1} cy={y1} r={6} fill={c.color} />
            </svg>
          </Build>
        );
      })}

      <Dock tiles={tiles} teacher="선생님" title="1-3 정보 수업" time="50:00" k={DK.k} width={1330} style={{ left: DK.x, top: DK.y }} />
      {/* 아직 비어 있는 타일 자리 */}
      {COLS.map((c, i) => i >= n && (
        <span key={c.tab} style={{ position: 'absolute', left: tileCx(i + 2) - 33, top: DK.y + 13 + 5 * DK.k, width: 65, height: 65, borderRadius: 15, border: '2.5px dashed #cbd5e1' }} />
      ))}
      <BuildSubs lines={SUBS} />
    </>
  );
}
