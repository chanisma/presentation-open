import { Scene, useSceneTime, interpolate, spring } from '../../../../src/scene';
import { C, Head, SceneSubs, type SlideMeta, type Sub } from '../kit';
import { Crop, NAT } from './_d';

/* 27 — scene: 한눈 정리
   메타포: 1장의 «내 책상»으로 돌아와, 이 영상의 다섯 단계가 서류철처럼 책상 위에 차례로 쌓인다.
   서류철마다 실화면 조각(독 아이콘 · 패널 · 요청 입력칸 · 권한 확인 · 결과)을 붙였다. 왼쪽은 «한 번 / 매번»과 좋은 요청 네 가지. */

const DUR = 15.5;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '정리하면, 설치와 로그인은 처음 한 번이면 됩니다.' },
  { at: 3.4, text: '매번은 맡길 폴더를 띄우고, 독을 눌러 열고, 할 일·파일·결과 형식·진행 방식을 담아 요청합니다.' },
  { at: 8.0, text: '권한 확인은 읽고 허락하고, 결과는 원본과 맞춰 확인하세요.' },
  { at: 11.6, text: '연습 폴더에서 오늘 업무 하나를 맡겨 보는 것부터 시작해 보세요.' },
];

type Folder = { at: number; tab: string; line: string; name: string; nat: [number, number]; region: [number, number, number, number] };
const FOLDERS: Folder[] = [
  { at: 0.8, tab: '한 번 · 준비', line: '독에서 찾고 «설치하기» · 로그인', name: 'A-08a-패널-설치필요-Claude', nat: NAT.panel, region: [52, 290, 704, 150] },
  { at: 3.6, tab: '매번 ① 열기', line: '맡길 폴더를 띄우고 독을 누른다', name: 'A-02-독-눌러-곧바로-열림', nat: NAT.dock, region: [2200, 110, 1100, 250] },
  { at: 5.8, tab: '매번 ② 요청', line: '할 일 · 파일 · 결과 형식 · «계획부터»', name: 'B-01-파일정리-요청', nat: NAT.term, region: [8, 920, 800, 64] },
  { at: 8.2, tab: '매번 ③ 허락', line: '무엇을 하려는지 읽고 1번', name: 'B-01-파일정리-권한확인', nat: NAT.term, region: [14, 846, 830, 150] },
  { at: 10.0, tab: '매번 ④ 확인', line: '결과를 원본과 맞춰 본다 — AI 결과는 초안', name: 'B-01-파일정리-완료', nat: NAT.term, region: [20, 90, 900, 200] },
];
/* 서류철을 위에서 내려다본 띠 — 탭이 보이게 위아래로 쌓는다(앞 장의 내용이 가려지지 않게) */
const CARD = { w: 1200, h: 112, x0: 624, y0: 236, dx: 10, dy: 142, crop: 470 };

function Stage() {
  const t = useSceneTime();
  return (
    <>
      <Head chapter="마치며" title="한 번 준비하고, 매번 네 걸음" />
      {/* 왼쪽 기둥: 한 번 / 매번 + 좋은 요청 네 가지 */}
      <div style={{ position: 'absolute', left: 72, top: 200, width: 470 }}>
        <div style={{ fontSize: 21, fontWeight: 800, color: C.muted, letterSpacing: 1 }}>처음 한 번</div>
        <div style={{ fontSize: 30, fontWeight: 850, color: C.ink, marginTop: 4 }}>설치 · 로그인</div>
        <div style={{ fontSize: 21, fontWeight: 800, color: C.gold, letterSpacing: 1, marginTop: 30 }}>매번</div>
        <div style={{ fontSize: 30, fontWeight: 850, color: C.ink, marginTop: 4, lineHeight: 1.35, wordBreak: 'keep-all' }}>폴더 열기 → 요청 →<br />허락 → 확인</div>
        <div style={{ marginTop: 40, borderRadius: 18, background: '#fff', border: '1px solid rgba(31,27,22,.12)', padding: '20px 24px', opacity: interpolate(t, [5.6, 6.2], [0.3, 1]) }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.gold }}>좋은 요청의 네 가지</div>
          {['할 일 (동사로)', '대상 파일 (이름으로)', '결과의 형식·이름', '진행 방식 («계획부터»)'].map((s, i) => (
            <div key={s} style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12, fontSize: 23, color: C.ink }}>
              <span style={{ width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', background: C.gold, color: '#fff', fontWeight: 800, fontSize: 17 }}>{i + 1}</span>{s}
            </div>
          ))}
        </div>
      </div>

      {/* 책상 */}
      <div style={{ position: 'absolute', left: 580, top: 176, width: 1290, height: 760, borderRadius: 28, background: 'linear-gradient(160deg, #efe2cc, #e6d5b8)', boxShadow: 'inset 0 0 0 1px rgba(31,27,22,.08), 0 30px 70px -40px rgba(31,27,22,.5)' }} />
      <div style={{ position: 'absolute', left: 1600, top: 196, fontSize: 18, fontWeight: 700, color: 'rgba(31,27,22,.45)' }}>내 책상</div>

      {FOLDERS.map((f, i) => {
        const s = spring(t, f.at, 0.7);
        if (s <= 0) return null;
        const x = CARD.x0 + i * CARD.dx;
        const y = CARD.y0 + i * CARD.dy;
        const latest = i === FOLDERS.length - 1 || t < FOLDERS[i + 1].at;
        return (
          <div key={f.tab} style={{ position: 'absolute', left: x, top: y, width: CARD.w, height: CARD.h, transform: `translate(${(1 - s) * 260}px, ${(1 - s) * -30}px) rotate(${(1 - s) * 4 - 0.4 + i * 0.2}deg)`, opacity: Math.min(1, s * 1.4), zIndex: 10 + i }}>
            {/* 서류철 탭 */}
            <div style={{ position: 'absolute', left: 22, top: -30, height: 34, padding: '0 18px', borderRadius: '10px 10px 0 0', background: latest ? C.gold : '#d8c6a8', color: latest ? '#fff' : C.ink, fontSize: 19, fontWeight: 800, display: 'flex', alignItems: 'center' }}>{f.tab}</div>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 14, background: '#fffaf1', border: '1px solid rgba(31,27,22,.14)', boxShadow: '0 18px 40px -22px rgba(31,27,22,.55)' }}>
              <div style={{ position: 'absolute', left: 28, top: 0, bottom: 0, width: CARD.w - CARD.crop - 70, display: 'flex', alignItems: 'center', fontSize: 27, fontWeight: 800, color: C.ink, wordBreak: 'keep-all', lineHeight: 1.3 }}>{f.line}</div>
              <Crop name={f.name} nat={f.nat} region={f.region} w={CARD.crop} style={{ right: 18, top: '50%', transform: 'translateY(-50%)', maxHeight: 96, borderRadius: 8 }} />
            </div>
          </div>
        );
      })}
      <SceneSubs items={SUBS} credit="에이전트 터미널 · 스페이스기전 데스크 · AI전문적학습동아리" />
    </>
  );
}

export default function S27() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
