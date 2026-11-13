import { Scene, useSceneTime } from '../../../../src/scene';
import { C, Head, SceneSubs, Dock, BASE_TILES, Glyph, LOOK, type SlideMeta, type Sub, type Look } from '../kit';

/* 28 — static: 전자칠판판은 이렇게 다르다
   구도: 비대칭 비교 — 왼쪽 작은 Windows 독(«같은 흐름» 기준점), 오른쪽 큰 전자칠판 «수업 화면»(dominant)에
   차이점 칩 6개를 지시선으로 붙인다. 그림은 정지, 자막만 시간에 따라 바뀐다.
   문구는 NEIS_helper android/README.md 원문(수업 화면 개편 · 이 칠판에 없음 · ◀ 수업 화면 · 새 판 설치). */

const DUR = 18;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '전자칠판판도 QR을 찍어 펼치는 흐름은 같습니다.' },
  { at: 4.5, text: '다만 독 대신 타일을 크게 놓은 «수업 화면»을 쓰고, 손이 닿도록 단추를 모두 아래에 두었습니다.' },
  { at: 9.5, text: '사이트와 구글은 앱 안 브라우저에서 열리고, 비밀번호는 [📱 휴대폰으로 입력]으로 보냅니다.' },
  { at: 14, text: '메모장처럼 칠판에 없는 프로그램은 타일이 흐리게 «이 칠판에 없음»으로 보입니다.' },
];

/* 전자칠판 화면 배치(px) */
const B = { x: 600, y: 196, w: 980, h: 552 };
const TILES: { look: Look; label: string; off?: boolean }[] = [
  { look: LOOK.google, label: '구글' },
  { look: LOOK.mydrive, label: '내 드라이브' },
  { look: LOOK.classroom, label: '클래스룸' },
  { look: LOOK.site, label: '패들렛' },
  { look: LOOK.powerpoint, label: 'PowerPoint' },
  { look: LOOK.notepad, label: '메모장', off: true },
];

/* 지시선 끝점: [칩 앵커 x,y] → [대상 x,y] */
const NOTES: { text: string; x: number; y: number; w: number; from: [number, number]; to: [number, number] }[] = [
  { text: '[📱 휴대폰으로 입력] · «이 칠판 로그인 지우기»', x: 600, y: 786, w: 470, from: [745, 786], to: [745, 510] },
  { text: '누르는 단추는 모두 아래 — 큰 칠판도 손이 닿게', x: 1110, y: 786, w: 470, from: [1345, 786], to: [1345, 752] },
  { text: '사이트·구글은 앱 안 브라우저', x: 1612, y: 214, w: 268, from: [1612, 238], to: [1196, 372] },
  { text: '«◀ 수업 화면» — 다른 앱 위에 떠 있는 단추', x: 1612, y: 330, w: 268, from: [1612, 352], to: [1594, 298] },
  { text: '«이 칠판에 없음» — 메모장·그림판·캡처 도구·화상 키보드', x: 1612, y: 590, w: 268, from: [1612, 620], to: [1468, 470] },
  { text: '자동 실행 없음 · 새 판은 QR 화면 [새 판 설치]', x: 600, y: 866, w: 980, from: [0, 0], to: [0, 0] },
];

function Board() {
  const tile = 104;
  const gap = 34;
  const rowW = TILES.length * tile + (TILES.length - 1) * gap;
  return (
    <div style={{ position: 'absolute', left: B.x - 16, top: B.y - 16, width: B.w + 32, height: B.h + 32, borderRadius: 22, background: '#1f2937', padding: 16, boxShadow: '0 30px 70px -30px rgba(15,23,42,.6)' }}>
      <div style={{ position: 'relative', width: B.w, height: B.h, borderRadius: 8, overflow: 'hidden', background: '#f4f6fb' }}>
        <div style={{ position: 'absolute', left: 22, top: 18, display: 'flex', alignItems: 'center', gap: 10, fontSize: 17, fontWeight: 700, color: C.muted }}>
          <span style={{ padding: '4px 12px', borderRadius: 99, background: '#eef0ff', color: C.primary, fontSize: 15 }}>전자칠판</span>수업 화면
        </div>
        {/* 타일 — 가운데 크게(종류 글씨 없이) */}
        <div style={{ position: 'absolute', left: (B.w - rowW) / 2, top: 168, display: 'flex', gap }}>
          {TILES.map((tl) => (
            <div key={tl.label} style={{ width: tile, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <Glyph look={tl.look} size={tile} off={tl.off} />
              <span style={{ fontSize: 17, color: tl.off ? C.faint : C.ink, whiteSpace: 'nowrap' }}>{tl.label}</span>
              {tl.off && <span style={{ fontSize: 13, color: C.muted, marginTop: -6 }}>이 칠판에 없음</span>}
            </div>
          ))}
        </div>
        {/* 아래 줄 — 세팅·선생님 · 열어 둔 파일 · 남은 시간 · +10분 · 수업 끝 */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 86, background: '#eef0f6', borderTop: '1px solid rgba(15,23,42,.08)', display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px' }}>
          <div style={{ lineHeight: 1.3, flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>1-3 정보 수업</div>
            <div style={{ fontSize: 14, color: C.muted }}>김기전 선생님</div>
          </div>
          <span style={{ padding: '12px 18px', borderRadius: 12, border: '1px solid rgba(15,23,42,.14)', fontSize: 17, background: '#fff' }}>열어 둔 파일 2개</span>
          <span style={{ padding: '6px 16px', borderRadius: 12, border: '1px solid rgba(15,23,42,.14)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <b style={{ fontSize: 24, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>38:12</b><span style={{ fontSize: 12, color: C.muted }}>남은 시간</span>
          </span>
          <span style={{ padding: '14px 18px', borderRadius: 12, border: '1px solid rgba(15,23,42,.14)', fontSize: 17, background: '#fff' }}>+10분</span>
          <span style={{ padding: '16px 22px', borderRadius: 12, background: C.danger, color: '#fff', fontSize: 18, fontWeight: 700 }}>수업 끝</span>
        </div>
        {/* 다른 앱 위의 «◀ 수업 화면» 단추 */}
        <div style={{ position: 'absolute', right: 0, top: 80, padding: '12px 14px 12px 18px', borderRadius: '14px 0 0 14px', background: C.primary, color: '#fff', fontSize: 16, fontWeight: 700, boxShadow: '0 6px 16px rgba(79,70,229,.35)' }}>◀ 수업 화면</div>
      </div>
    </div>
  );
}

function Stage() {
  useSceneTime();
  return (
    <>
      <Head chapter="⑦ 수업 끝 · 부록" title="전자칠판판은 이렇게 다르다" />

      {/* 왼쪽 기준점 — Windows 판 독 */}
      <div style={{ position: 'absolute', left: 72, top: 214, width: 470 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.muted, marginBottom: 14 }}>Windows 판 · 화면 아래 독</div>
        <div style={{ position: 'relative', height: 64 }}>
          <Dock tiles={BASE_TILES} k={0.5} style={{ left: 0, top: 0 }} />
        </div>
        <div style={{ marginTop: 40, padding: '22px 24px', borderRadius: 16, background: '#fff', border: `1.5px solid ${C.line}` }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.ok, marginBottom: 12 }}>같은 것</div>
          {['QR → 휴대폰 승인 → 이 기기에 펼치기', '세팅 타일 · 드라이브 · 수업 끝 정리', '구글 수업 도구 화면', '세팅 하나로 PC·칠판 어디서든'].map((s) => (
            <div key={s} style={{ fontSize: 20, lineHeight: 1.75, display: 'flex', gap: 10 }}><span style={{ color: C.ok }}>✓</span>{s}</div>
          ))}
        </div>
        <div style={{ marginTop: 18, fontSize: 18, color: C.muted, lineHeight: 1.6 }}>승인 화면의 기기 카드에는 «전자칠판»이라고 표시됩니다.</div>
      </div>


      <Board />

      {/* 기준점 → 칠판으로 이어지는 화살표 */}
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <path d="M548 300 C 570 300, 570 300, 580 300" stroke={C.primary} strokeWidth={4} fill="none" />
        <path d="M576 290 L588 300 L576 310" stroke={C.primary} strokeWidth={4} fill="none" strokeLinejoin="round" />
        {NOTES.filter((n) => n.from[0]).map((n, i) => (
          <g key={i}>
            <path d={`M${n.from[0]} ${n.from[1]} L${n.to[0]} ${n.to[1]}`} stroke="#94a3b8" strokeWidth={2.5} strokeDasharray="6 6" fill="none" />
            <circle cx={n.to[0]} cy={n.to[1]} r={7} fill="#fff" stroke={C.primary} strokeWidth={3} />
          </g>
        ))}
      </svg>

      {NOTES.map((n) => (
        <div key={n.text} style={{ position: 'absolute', left: n.x, top: n.y, width: n.w, padding: '10px 16px', borderRadius: 12, background: '#fff', border: `1.5px solid color-mix(in srgb, ${C.primary} 35%, #fff)`, fontSize: 19, fontWeight: 700, color: C.ink, lineHeight: 1.4, wordBreak: 'keep-all', zIndex: 5, textAlign: n.w > 900 ? 'center' : 'left' }}>
          {n.text}
        </div>
      ))}
      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S28() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
