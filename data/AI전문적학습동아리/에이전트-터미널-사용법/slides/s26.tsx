import Build from '../../../../src/deck/Build';
import { C, Head, BuildSubs, type SlideMeta } from '../kit';
import { Crop, NAT } from './_d';

/* 26 — build: 막히면 여기부터
   메타포: 진료 차트 — 왼쪽 «증상»(실화면 원문 조각)마다 화살표로 오른쪽 «처방»이 이어진다. 한 줄씩 공개.
   증상 조각: A-08a(설치 필요) · A-07a(폴더 못 찾음) · A-05(권한 묻지 않기 켬) · B-02-진행(오래 걸림), 원본 px. */

const SUBS = [
  '막혔을 때는 화면의 문구부터 읽어 보세요.',
  '«설치되어 있지 않습니다»가 보이면 설치하기를 누르고, 끝날 때까지 패널을 열어 두세요.',
  '폴더를 찾지 못했다면 자주 쓰는 폴더에서 고르거나 폴더를 직접 넣으세요.',
  '말풍선에 «권한 묻지 않기»가 보이면 패널에서 꺼 두세요.',
  '작업이 길면 진행 표시를 보며 기다리고, 멈추려면 Esc를 누르세요.',
];
export const meta: SlideMeta = { kind: 'build', subs: SUBS };

type Row = { name: string; nat: [number, number]; region: [number, number, number, number]; symptom: string; fix: string; sub: string };
const ROWS: Row[] = [
  { name: 'A-08a-패널-설치필요-Claude', nat: NAT.panel, region: [52, 290, 704, 150], symptom: '«… 설치되어 있지 않습니다»', fix: '«설치하기»를 누르고, 끝날 때까지 패널을 열어 둔다', sub: '설치가 끝나면 패널이 저절로 바뀝니다 — 프로그램을 다시 켤 필요 없음' },
  { name: 'A-07a-패널-보던창-폴더없음', nat: NAT.panel, region: [40, 424, 728, 98], symptom: '«이 창에서는 폴더를 찾지 못했습니다»', fix: '«자주 쓰는 폴더»에서 고르거나 «＋ 폴더 넣기»', sub: '맡길 폴더를 탐색기로 띄운 뒤 다시 눌러도 됩니다' },
  { name: 'A-05-패널-권한묻지않기-Claude', nat: NAT.panel, region: [40, 268, 730, 110], symptom: '말풍선에 «(권한 묻지 않기)»가 보임', fix: '패널에서 «권한 묻지 않기» 스위치를 끈다', sub: '한 번 켜면 다음에도 켜진 채 열립니다 — 독 아이콘에는 표시가 없어요' },
  { name: 'B-02-설문요약-진행', nat: NAT.term, region: [0, 784, 1000, 110], symptom: '오래 걸림 · 화면이 영어', fix: '진행 표시를 보며 기다리고, 멈추려면 Esc', sub: '화면 문구는 영어여도 우리말로 요청하면 우리말로 답합니다' },
];

export default function S26() {
  return (
    <>
      <Head chapter="⑥ 안전하게 · 4/4" title="막히면 여기부터" />
      {/* 머리줄 */}
      <div style={{ position: 'absolute', left: 72, top: 168, width: 600, fontSize: 21, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>증상 — 화면에 뜬 문구</div>
      <div style={{ position: 'absolute', left: 800, top: 168, fontSize: 21, fontWeight: 800, color: C.gold, letterSpacing: 2 }}>처방</div>
      {ROWS.map((r, i) => {
        const top = 212 + i * 182;
        return (
          <Build key={r.name} at={i + 1} style={{ position: 'absolute', left: 0, top, width: 1920, height: 170 }}>
            <div style={{ position: 'relative', width: 1920, height: 170 }}>
              <div style={{ position: 'absolute', left: 72, top: 0, fontSize: 21, fontWeight: 700, color: C.ink }}>{r.symptom}</div>
              <Crop name={r.name} nat={r.nat} region={r.region} w={600} style={{ left: 72, top: 36, maxHeight: 126 }} />
              <svg viewBox="0 0 90 40" width={90} height={40} style={{ position: 'absolute', left: 690, top: 72 }}>
                <path d="M4 20 H72" stroke={C.gold} strokeWidth={5} strokeLinecap="round" />
                <path d="M62 8 L82 20 L62 32" fill="none" stroke={C.gold} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div style={{ position: 'absolute', left: 800, top: 34, width: 1050, height: 120, borderRadius: 16, background: '#fff', border: '1px solid rgba(31,27,22,.12)', padding: '18px 26px', boxShadow: '0 16px 40px -28px rgba(31,27,22,.45)' }}>
                <div style={{ fontSize: 30, fontWeight: 850, color: C.ink, letterSpacing: '-0.6px', wordBreak: 'keep-all' }}>{r.fix}</div>
                <div style={{ fontSize: 20, color: C.muted, marginTop: 8, wordBreak: 'keep-all' }}>{r.sub}</div>
              </div>
            </div>
          </Build>
        );
      })}
      <BuildSubs lines={SUBS} />
    </>
  );
}
