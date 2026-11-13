import type { ReactNode } from 'react';
import Build from '../../../../src/deck/Build';
import { useDeck } from '../../../../src/deck/DeckContext';
import { Scene, useSceneTime } from '../../../../src/scene';
import { C, Head, BuildSubs, Dock, Glyph, LOOK, type DockTile, type SlideMeta } from '../kit';
import { Toast } from './_pc';

/* 13 — build: 독 한눈에 보기
   구도: 화면을 가로지르는 1.6배 독(dominant). 위·아래로 번갈아 붙는 해설 칩이 지시선으로 독 부위를 가리킨다.
   독의 상태(✓·배지·고리·시간)는 클릭 단계로 바뀌고, 도는 고리·바뀌는 배지는 씬 t로 움직인다. */

const SUBS = [
  '화면 아래 독입니다. 세팅에 넣은 것이 이 순서로 놓이고, 누르기 전에는 아무것도 열리지 않습니다.',
  '왼쪽 선생님 이름을 끌면 독을 옮길 수 있습니다.',
  '구글 타일의 초록 ✓는 지난번 로그인이 보관되어 있다는 뜻입니다.',
  '내 드라이브의 배지는 올리지 못한 파일, 올리는 중, 연결 시간이 얼마 남지 않았음을 알려 줍니다.',
  '타일을 누르면 고리가 돌며 열리고, 열지 못하면 빨간 느낌표가 붙습니다.',
  '남은 시간을 누르면 10분 늘어납니다. 끝낼 때는 빨간 [수업 끝]을 누르세요.',
];
export const meta: SlideMeta = { kind: 'build', subs: SUBS };

const K = 1.6;
const DX = 210, DY = 450, DWID = 1500, DH = 112 * K;
const tileX = (i: number) => DX + 22 + 272 + 19 + 1 + 19 + i * 78 * K + 37 * K;
const CLOCK_X = 1458, END_X = 1613;

/** 지시선 + 칩 묶음 — 칩 상자는 독 bbox 바깥 */
function Note({ at, ax, above, x, y, w, children }: { at: number; ax: number; above?: boolean; x: number; y: number; w: number; children: ReactNode }) {
  const y0 = above ? DY - 8 : DY + DH + 8;
  const y1 = above ? y + 112 : y;
  return (
    <Build at={at} style={{ position: 'absolute', inset: 0 }}>
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0 }}>
        <line x1={ax} y1={y0} x2={Math.min(Math.max(ax, x + 24), x + w - 24)} y2={y1} stroke={C.primary} strokeWidth={3} />
        <circle cx={ax} cy={y0} r={7} fill={C.primary} />
      </svg>
      <div style={{ position: 'absolute', left: x, top: y, width: w, background: C.card, border: `2px solid color-mix(in srgb, ${C.primary} 30%, #fff)`, borderRadius: 18, padding: '16px 20px', boxShadow: '0 16px 30px -22px rgba(15,23,42,.5)' }}>
        {children}
      </div>
    </Build>
  );
}

const ttl = { fontSize: 27, fontWeight: 850, letterSpacing: -0.6 } as const;
const txt = { fontSize: 21, color: C.muted, marginTop: 4, lineHeight: 1.45, wordBreak: 'keep-all' } as const;

function Body() {
  const t = useSceneTime();
  const { clicks } = useDeck();
  const c = clicks;
  const driveBadges = ['!', '↑', '8분'] as const;
  const db = driveBadges[Math.floor(t / 1.3) % 3];
  const tiles: DockTile[] = [
    { id: 'google', look: LOOK.google, label: '구글', badge: c >= 2 ? '✓' : undefined, badgeTone: 'ok' },
    { id: 'drive', look: LOOK.mydrive, label: '내 드라이브', badge: c >= 3 ? db : undefined, badgeTone: db === '!' ? 'err' : 'warn' },
    { id: 'classroom', look: LOOK.classroom, label: '클래스룸' },
    { id: 'padlet', look: LOOK.site, label: '패들렛', badge: c >= 4 ? '!' : undefined, badgeTone: 'err' },
    { id: 'ppt', look: LOOK.powerpoint, label: 'PowerPoint', spin: c >= 4 ? (t * 420) % 360 : undefined },
    { id: 'seat', look: LOOK.space, label: '자리 배치' },
  ];
  return (
    <>
      <Head chapter="④ 수업 시작과 독 · 2/3" title="독 한눈에 보기" />

      {c === 1 && (
        <div style={{ position: 'absolute', left: DX + 46, top: DY - 30, width: DWID, height: DH, borderRadius: 16 * K, border: `3px dashed ${C.primary}`, opacity: 0.55 }} />
      )}
      <Dock tiles={tiles} k={K} width={DWID} time={c >= 5 ? '48:12' : '38:12'} style={{ left: DX, top: DY }}
        clockStyle={c >= 5 ? { boxShadow: '0 0 0 5px rgba(79,70,229,.25)' } : undefined} />

      <Note at={1} ax={DX + 22 + 136} above x={96} y={258} w={430}>
        <div style={ttl}>선생님 이름 칸</div>
        <div style={txt}>끌어서 독을 화면 어디로든 옮깁니다.</div>
      </Note>
      <Note at={2} ax={tileX(0)} x={380} y={700} w={430}>
        <div style={ttl}><span style={{ color: C.ok }}>✓</span> 구글</div>
        <div style={txt}>지난번 로그인이 보관되어 있다는 뜻입니다.</div>
      </Note>
      <Note at={3} ax={tileX(1)} above x={590} y={240} w={600}>
        <div style={ttl}>내 드라이브 배지</div>
        <div style={{ display: 'flex', gap: 22, marginTop: 12 }}>
          {([['!', 'err', '못 올린 파일'], ['↑', 'warn', '올리는 중'], ['8분', 'warn', '연결 10분 안쪽']] as const).map(([b, tone, cap]) => (
            <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Glyph look={LOOK.mydrive} size={58} badge={b} badgeTone={tone} />
              <span style={{ fontSize: 19, color: C.muted, lineHeight: 1.3, width: 92, wordBreak: 'keep-all' }}>{cap}</span>
            </div>
          ))}
        </div>
      </Note>
      <Note at={4} ax={(tileX(3) + tileX(4)) / 2} x={860} y={700} w={470}>
        <div style={ttl}>세팅 항목</div>
        <div style={txt}>도는 고리 = 여는 중 · 빨간 «!» = 열지 못함</div>
      </Note>
      <Note at={5} ax={(CLOCK_X + END_X) / 2} x={1390} y={700} w={470}>
        <div style={ttl}>남은 시간 · 수업 끝</div>
        <div style={txt}>누르면 +10분(5분 전부터 주황). 끝낼 때는 빨간 [수업 끝].</div>
      </Note>
      <Build at={5} style={{ position: 'absolute', left: 1236, top: 296 }}>
        <Toast k={1.2} style={{ position: 'relative' }}>10분 연장했습니다.</Toast>
      </Build>

      <BuildSubs lines={SUBS} />
    </>
  );
}

export default function S13() {
  return (
    <Scene>
      <Body />
    </Scene>
  );
}
