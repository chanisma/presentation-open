import Build from '../../../../src/deck/Build';
import { C, Head, BuildSubs, QR, Glyph, LOOK, type SlideMeta } from '../kit';

/* 29 — build: 문제가 생겼을 때
   구도: 왼쪽에 가장 흔한 해결 «새 QR, 다시 찍기»(dominant), 오른쪽에 증상 카드 열이 무리별로 쌓이고
   각 무리가 지시선으로 처방에 이어진다. 증상 문구는 제품 원문(ClassroomLinkPage · classroom.py · gtools.js). */

const SUBS = [
  '막혔을 때는 화면에 뜬 문구를 먼저 읽어 보세요.',
  'QR 관련 문구는 대부분 교실 화면의 새 QR을 다시 찍으면 해결됩니다.',
  '드라이브 문제는 독의 «내 드라이브»나 탐색기에서 QR로 다시 연결하면 됩니다. 못 올린 파일은 다음 연결 때 저절로 올라갑니다.',
  '프로그램이 없거나 구글 기능이 꺼져 있다는 문구는 교실 PC 담당자나 관리자에게 알려 주세요.',
];
export const meta: SlideMeta = { kind: 'build', subs: SUBS };

type Card = { quote: string; fix: string };
const GROUPS: { at: number; title: string; tone: string; fixTag: string; cards: Card[]; top: number }[] = [
  {
    at: 1, title: 'QR', tone: C.primary, fixTag: '새 QR 다시 찍기', top: 196,
    cards: [
      { quote: '«QR 이 만료됐습니다» · «취소된 QR 입니다»', fix: '교실 화면에 새로 뜬 QR 을 다시 찍기' },
      { quote: '«이미 연결된 QR 입니다»', fix: '다른 선생님이 먼저 연결함 — 그 수업이 끝난 뒤 다시' },
    ],
  },
  {
    at: 2, title: '드라이브', tone: '#0891b2', fixTag: 'QR 로 다시 연결', top: 420,
    cards: [
      { quote: '«구글 허용 창이 막혀 드라이브 없이 펼쳤습니다»', fix: '독 «내 드라이브»에서 QR 로 다시 연결' },
      { quote: '«드라이브 연결이 끝났습니다»', fix: '탐색기 [QR 만들기] — 수업을 시작한 선생님만' },
      { quote: '내 드라이브 배지 «!»', fix: '못 올린 파일 — 다음에 드라이브를 연결하면 저절로 올라감' },
    ],
  },
  {
    at: 3, title: '담당자', tone: C.warn, fixTag: '담당자·관리자에게', top: 712,
    cards: [
      { quote: '«이 기기에 설치되어 있지 않거나 등록되지 않은 프로그램입니다.»', fix: '교실 PC 담당자에게 설치·등록 요청' },
      { quote: '«학교 Google Cloud 에서 이 API 가 꺼져 있습니다…»', fix: '학교 관리자에게 알리기' },
    ],
  },
];

const CARD_X = 900;
const CARD_W = 960;
const CARD_H = 70;

function GroupBlock({ g }: { g: (typeof GROUPS)[number] }) {
  return (
    <div style={{ width: CARD_W }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: g.tone }}>{g.title}</span>
        <span style={{ flex: 1, height: 2, background: `color-mix(in srgb, ${g.tone} 25%, transparent)` }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#fff', background: g.tone, borderRadius: 999, padding: '4px 14px' }}>→ {g.fixTag}</span>
      </div>
      {g.cards.map((c) => (
        <div key={c.quote} style={{ height: CARD_H, marginBottom: 8, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 22px', borderRadius: 14, background: '#fff', border: `1.5px solid ${C.line}`, borderLeft: `6px solid ${g.tone}` }}>
          <div style={{ fontSize: 21, fontWeight: 750, wordBreak: 'keep-all', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.quote}</div>
          <div style={{ fontSize: 17, color: C.muted, marginTop: 2 }}>{c.fix}</div>
        </div>
      ))}
    </div>
  );
}

/* 무리 → 왼쪽 처방으로 이어지는 지시선(무리 머리 높이에서 출발) */
function Lead({ y, toY, tone, dashed, x1 = 620 }: { y: number; toY: number; tone: string; dashed?: boolean; x1?: number }) {
  const x0 = CARD_X - 16;
  return (
    <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: 1920, height: 1080, pointerEvents: 'none' }}>
      <path d={`M${x0} ${y} C ${x0 - 70} ${y}, ${x1 + 70} ${toY}, ${x1} ${toY}`} fill="none" stroke={tone} strokeWidth={4} strokeDasharray={dashed ? '10 8' : undefined} />
      <circle cx={x0} cy={y} r={7} fill="#fff" stroke={tone} strokeWidth={4} />
    </svg>
  );
}

export default function S29() {
  return (
    <>
      <Head chapter="⑦ 수업 끝 · 부록" title="문제가 생겼을 때" />

      {/* 왼쪽 dominant — 가장 흔한 해결 */}
      <div style={{ position: 'absolute', left: 72, top: 232, width: 690 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.muted }}>먼저 화면의 문구를 읽고, 가장 흔한 해결은</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 26, marginTop: 26 }}>
          <div style={{ position: 'relative', width: 170, height: 170, flexShrink: 0 }}>
            <QR size={150} seed={29} style={{ position: 'absolute', left: 10, top: 10, borderRadius: 14, border: `1.5px solid ${C.line}` }} />
            <svg viewBox="0 0 170 170" width={170} height={170} style={{ position: 'absolute', inset: 0 }}>
              <path d="M160 85 A75 75 0 1 1 132 26" fill="none" stroke={C.primary} strokeWidth={7} strokeLinecap="round" />
              <path d="M118 14 L136 24 L126 42" fill="none" stroke={C.primary} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ fontSize: 92, fontWeight: 900, lineHeight: 1.05, letterSpacing: -3, color: C.ink, wordBreak: 'keep-all' }}>
            새 QR,<br /><span style={{ color: C.primary }}>다시 찍기</span>
          </div>
        </div>
        <div style={{ marginTop: 34, fontSize: 22, color: C.muted, lineHeight: 1.6, wordBreak: 'keep-all' }}>
          QR 은 3분마다 바뀌고, 한 번 쓰면 끝납니다.<br />교실 화면에 지금 떠 있는 QR 을 찍으면 대부분 풀립니다.
        </div>
        <div style={{ marginTop: 40, display: 'flex', gap: 14, alignItems: 'center', fontSize: 20, color: C.muted }}>
          <Glyph look={LOOK.mydrive} size={40} badge="!" badgeTone="err" />
          <span>독의 배지와 알림 글이 무엇이 막혔는지 알려 줍니다.</span>
        </div>
      </div>

      {GROUPS.map((g) => (
        <Build key={g.title} at={g.at} style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 950 }}>
          <Lead y={g.top + 16} toY={g.at === 3 ? 688 : 425} x1={g.at === 3 ? 792 : 620} tone={g.tone} dashed={g.at !== 1} />
          {g.at === 3 && (
            <div style={{ position: 'absolute', left: 560, top: 668, padding: '8px 16px', borderRadius: 12, background: '#fff7ed', border: `1.5px solid color-mix(in srgb, ${C.warn} 40%, #fff)`, color: C.warn, fontSize: 19, fontWeight: 700 }}>선생님이 고칠 수 없는 부분</div>
          )}
          <div style={{ position: 'absolute', left: CARD_X, top: g.top }}>
            <GroupBlock g={g} />
          </div>
        </Build>
      ))}
      <BuildSubs lines={SUBS} />
    </>
  );
}
