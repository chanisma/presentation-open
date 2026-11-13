import Build from '../../../../src/deck/Build';
import { C, Head, BuildSubs, Phone, Mark, QR, Glyph, LOOK, Chip, type SlideMeta } from '../kit';

/* 2 — build: 네 단계로 쓴다
   구도: 왼쪽 큰 색면 ①(한 번만 하는 준비, dominant) → 오른쪽 고리 ②③④(매 수업 반복).
   ④에서 ②로 돌아가는 화살표가 «다음 수업도 같은 방법». */

const SUBS = [
    '쓰는 방법은 네 단계입니다.',
    '첫째, 스페이스기전에서 반별 세팅을 만듭니다. 처음 한 번만 하면 됩니다.',
    '둘째, 교실 PC의 QR을 휴대폰으로 찍고 «이 기기에 펼치기»를 누릅니다.',
    '셋째, 화면 아래 독에서 필요한 것을 눌러 엽니다.',
    '넷째, 수업을 끝내면 정리는 프로그램이 합니다. 다음 수업은 둘째 단계부터 다시 하면 됩니다.',
];
export const meta: SlideMeta = { kind: 'build', subs: SUBS };

/* 고리 — 중심과 반지름, 세 정거장 각도 */
const CX = 1290, CY = 560, R = 250;
const NODE = [
  { a: -90, n: '②', title: 'QR 찍고 펼치기', cap: '교실 PC QR → «이 기기에 펼치기»' },
  { a: 30, n: '③', title: '독에서 눌러 열기', cap: '구글 · 드라이브 · 사이트 · 프로그램' },
  { a: 150, n: '④', title: '수업 끝', cap: '고친 파일은 드라이브로, 사본·로그인은 지움' },
];
const pos = (a: number, r = R) => [CX + r * Math.cos((a * Math.PI) / 180), CY + r * Math.sin((a * Math.PI) / 180)];

/** 고리 위 호(시작각→끝각) — 정거장 원(반지름 74)을 피해 끝을 잘라 그린다 */
function Arc({ a0, a1, color = C.primary, dashed }: { a0: number; a1: number; color?: string; dashed?: boolean }) {
  const pad = 22; // 정거장 원 가장자리에서 시작·끝
  const [x0, y0] = pos(a0 + pad);
  const [x1, y1] = pos(a1 - pad);
  const ang = ((a1 - pad) * Math.PI) / 180 + Math.PI / 2; // 접선 방향(시계 방향 진행)
  return (
    <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
      <path d={`M${x0},${y0} A${R},${R} 0 0 1 ${x1},${y1}`} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeDasharray={dashed ? '4 14' : undefined} />
      <path d="M-14,-11 L4,0 L-14,11 Z" fill={color} transform={`translate(${x1},${y1}) rotate(${(ang * 180) / Math.PI})`} />
    </svg>
  );
}

function NodeIcon({ i }: { i: number }) {
  if (i === 0) return <QR size={74} seed={3} />;
  if (i === 1)
    return (
      <div style={{ display: 'flex', gap: 4, background: C.shelf, borderRadius: 10, padding: 6 }}>
        {[LOOK.google, LOOK.mydrive, LOOK.site, LOOK.powerpoint].map((lk, k) => <Glyph key={k} look={lk} size={30} />)}
      </div>
    );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.shelf, borderRadius: 10, padding: '8px 9px', fontSize: 12.5, whiteSpace: 'nowrap' }}>
      <span style={{ width: 16, height: 16, borderRadius: '50%', border: '3px solid rgba(15,23,42,.15)', borderTopColor: C.primary }} />정리하는 중입니다.
    </div>
  );
}

function Station({ i }: { i: number }) {
  const nd = NODE[i];
  const [x, y] = pos(nd.a);
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: 0, height: 0 }}>
      <div style={{ position: 'absolute', left: -74, top: -74, width: 148, height: 148, borderRadius: '50%', background: C.card, border: `3px solid ${C.primary}`, boxShadow: '0 18px 40px -22px rgba(79,70,229,.6)', display: 'grid', placeItems: 'center' }}>
        <NodeIcon i={i} />
      </div>
      <span style={{ position: 'absolute', left: -92, top: -92, width: 44, height: 44, borderRadius: '50%', background: C.primary, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 26, fontWeight: 800 }}>{nd.n}</span>
      <div style={{ position: 'absolute', left: i === 2 ? -380 : 96, top: i === 0 ? -122 : -44, width: i === 2 ? 280 : 300, textAlign: i === 2 ? 'right' : 'left' }}>
        <div style={{ fontSize: 32, fontWeight: 850, letterSpacing: -0.8 }}>{nd.title}</div>
        <div style={{ fontSize: 21, color: C.muted, marginTop: 4, lineHeight: 1.4, wordBreak: 'keep-all' }}>{nd.cap}</div>
      </div>
    </div>
  );
}

export default function S02() {
  return (
    <>
      <Head chapter="① 시작하며" title="네 단계로 씁니다" />

      {/* ① 한 번만 하는 준비 — dominant 색면 */}
      <Build at={1} style={{ position: 'absolute', left: 72, top: 196, width: 620, height: 720 }}>
        <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 32, background: 'linear-gradient(160deg, #4f46e5, #3730a3)', color: '#fff', padding: '40px 44px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff', color: C.primary, display: 'grid', placeItems: 'center', fontSize: 30, fontWeight: 850 }}>①</span>
            <span style={{ fontSize: 22, fontWeight: 800, background: '#fde047', color: '#713f12', borderRadius: 99, padding: '6px 16px' }}>한 번만</span>
          </div>
          <div style={{ fontSize: 46, fontWeight: 850, letterSpacing: -1.4, marginTop: 26, lineHeight: 1.2 }}>반별 세팅 만들기</div>
          <div style={{ fontSize: 23, opacity: 0.85, marginTop: 14, lineHeight: 1.5, wordBreak: 'keep-all' }}>스페이스기전 메뉴 [도구] → «교실 기기»에서 반마다 하나씩 만들어 둡니다.</div>
          <Phone x={318} y={300} w={230} url="spacekijun.lovable.app/classroom" style={{ transform: 'rotate(6deg)' }}>
            <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8, color: C.ink }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}><Mark size={16} />교실 기기</div>
              {['1-3 정보 수업', '2-3 정보 수업', '2-1 인공지능 수업'].map((n, k) => (
                <div key={n} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${C.line}`, padding: 8 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700 }}>{n}</div>
                  <div style={{ display: 'flex', gap: 3, marginTop: 5 }}>
                    {[LOOK.google, LOOK.mydrive, k === 2 ? LOOK.folder : LOOK.classroom, LOOK.site].map((lk, j) => <Glyph key={j} look={lk} size={18} />)}
                  </div>
                </div>
              ))}
            </div>
          </Phone>
        </div>
      </Build>

      {/* ① → ② 연결 */}
      <Build at={2} style={{ position: 'absolute', inset: 0 }}>
        <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0 }}>
          <path d="M700,300 C850,260 960,250 1110,300" fill="none" stroke={C.primary} strokeWidth={6} strokeLinecap="round" />
          <path d="M-14,-11 L4,0 L-14,11 Z" fill={C.primary} transform="translate(1112,301) rotate(22)" />
        </svg>
        <div style={{ position: 'absolute', left: 860, top: 212, fontSize: 21, fontWeight: 700, color: C.primary }}>매 수업</div>
        <Station i={0} />
      </Build>

      <Build at={3} style={{ position: 'absolute', inset: 0 }}>
        <Arc a0={-90} a1={30} />
        <Station i={1} />
      </Build>

      <Build at={4} style={{ position: 'absolute', inset: 0 }}>
        <Arc a0={30} a1={150} />
        <Arc a0={150} a1={270} color={C.ok} dashed />
        <Station i={2} />
        <div style={{ position: 'absolute', left: CX - 150, top: CY - 30, width: 300, textAlign: 'center' }}>
          <Chip tone="ok">↻ 다음 수업도 같은 방법</Chip>
        </div>
      </Build>

      <BuildSubs lines={SUBS} />
    </>
  );
}
