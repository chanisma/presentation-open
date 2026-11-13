import type { CSSProperties, ReactNode } from 'react';
import Build from '../../../../src/deck/Build';
import { useDeck } from '../../../../src/deck/DeckContext';
import { C, MONO, Head, BuildSubs, SHOT, type SlideMeta } from '../kit';
import { Crop } from './_c';

/* 15 — build: «권한 묻지 않기», 언제 켜나
   메타포: 가운데 큰 스위치(dominant) — 왼쪽 꺼짐 패널(A-03)과 오른쪽 켬 패널(A-05)이 양쪽에 놓이고,
   클릭마다 스위치 아래에 «켜면 무엇이 달라지는가» 카드가 한 장씩 쌓인다. 패널 원본은 808×1008(배율 2). */

const SUBS = [
  '패널의 «권한 묻지 않기»를 켜면 에이전트가 더는 묻지 않습니다.',
  '켜면 글씨가 빨갛게 바뀝니다. 묻지 않고 파일을 고치고 명령을 실행한다는 뜻입니다.',
  'Codex는 작업을 가두는 안전 칸막이인 샌드박스까지 함께 끕니다.',
  '한 번 켜면 다음에 독을 눌러 바로 열 때도 켜진 채 열립니다.',
  '처음에는 꺼 둔 채 쓰고, 켤 때는 사본 폴더에서 잠깐만 켠 뒤 꺼 두세요.',
];
export const meta: SlideMeta = { kind: 'build', subs: SUBS };

const PW = 330; // 패널 폭(덱 px) — 원본 808
const NAT: [number, number] = [808, 1008];

function Card({ n, title, children, style }: { n: number; title: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', background: C.panel, border: `1px solid ${C.line}`, borderRadius: 16, padding: '16px 20px', boxShadow: '0 14px 30px -22px rgba(31,27,22,.5)', ...style }}>
      <span style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', background: C.gold, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 19 }}>{n}</span>
      <div>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.ink, letterSpacing: -0.4 }}>{title}</div>
        <div style={{ marginTop: 6, fontSize: 19, lineHeight: 1.55, color: C.muted, wordBreak: 'keep-all' }}>{children}</div>
      </div>
    </div>
  );
}

export default function S15() {
  const { clicks, isStatic } = useDeck();
  const step = isStatic ? 4 : clicks;
  const on = step >= 1;
  const codex = step >= 2;
  return (
    <>
      <Head chapter="④ 첫 대화 · 5/5" title="«권한 묻지 않기», 언제 켜나" />

      {/* 왼쪽: 꺼짐(기본값) */}
      <div style={{ position: 'absolute', left: 80, top: 200, width: PW }}>
        <div style={{ fontSize: 21, fontWeight: 800, color: C.ok, marginBottom: 10 }}>꺼짐 · 기본값</div>
        <div style={{ position: 'relative', height: PW * 1008 / 808 }}>
          <Crop src={SHOT('A-03-패널-기본')} region={[0, 0, 808, 1008]} nat={NAT} w={PW} radius={24} style={{ left: 0, top: 0, boxShadow: '0 20px 40px -24px rgba(0,0,0,.6)' }} />
        </div>
        <div style={{ marginTop: 12, fontSize: 18, color: C.muted, lineHeight: 1.5, wordBreak: 'keep-all' }}>파일을 고치거나 명령을 실행하기 전에 매번 묻습니다.</div>
      </div>

      {/* 가운데: 큰 스위치 */}
      <div style={{ position: 'absolute', left: 520, top: 196, width: 880, display: 'flex', alignItems: 'center', gap: 28 }}>
        <div style={{ position: 'relative', width: 260, height: 130, borderRadius: 999, background: on ? C.warn : '#cfc7ba', transition: 'background .45s', boxShadow: on ? `0 0 0 10px color-mix(in srgb, ${C.warn} 18%, transparent)` : 'inset 0 2px 6px rgba(0,0,0,.15)' }}>
          <span style={{ position: 'absolute', top: 12, left: on ? 142 : 12, width: 106, height: 106, borderRadius: '50%', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,.25)', transition: 'left .45s cubic-bezier(.16,1,.3,1)' }} />
        </div>
        <div>
          <div style={{ fontSize: 40, fontWeight: 900, color: on ? C.warn : C.ink, letterSpacing: -1 }}>권한 묻지 않기</div>
          <div style={{ marginTop: 6, fontFamily: MONO, fontSize: 19, color: on ? C.warn : C.muted }}>
            {codex ? '--dangerously-bypass-approvals-and-sandbox' : '--dangerously-skip-permissions'}
          </div>
        </div>
      </div>

      {/* 가운데: 단계 카드 */}
      <div style={{ position: 'absolute', left: 520, top: 370, width: 880, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Build at={1}>
          <Card n={1} title="켜면 글씨가 빨갛게">«묻지 않고 파일을 고치고 명령을 실행합니다. 믿는 폴더에서만 켜세요.» — 패널이 경고합니다.</Card>
        </Build>
        <Build at={2}>
          <Card n={2} title="Codex는 샌드박스까지 끈다">샌드박스 = 작업이 폴더 밖을 건드리지 못하게 가두는 안전 칸막이. Codex의 옵션은 승인 묻기와 샌드박스를 함께 끕니다.</Card>
        </Build>
        <Build at={3}>
          <Card n={3} title="한 번 켜면 저장된다">다음에 독을 눌러 바로 열 때도 켜진 채 열립니다. 독 아이콘에는 표시가 없고, 말풍선의 «(권한 묻지 않기)»로만 알 수 있습니다.</Card>
        </Build>
        <Build at={4}>
          <Card n={4} title="권하는 쓰임: 사본에서 잠깐만">사본 폴더를 만들어 켜고 → 작업이 끝나면 바로 끕니다. 처음 몇 주는 꺼 둔 채 권한 확인을 읽으며 익히세요.</Card>
        </Build>
      </div>

      {/* 오른쪽: 켬 */}
      <div style={{ position: 'absolute', left: 1510, top: 200, width: PW, opacity: on ? 1 : 0.25, filter: on ? 'none' : 'grayscale(1)', transition: 'opacity .45s, filter .45s' }}>
        <div style={{ fontSize: 21, fontWeight: 800, color: C.warn, marginBottom: 10 }}>켬 · {codex ? 'Codex' : 'Claude Code'}</div>
        <div style={{ position: 'relative', height: PW * 1008 / 808 }}>
          <Crop src={SHOT(codex ? 'A-05b-패널-권한묻지않기-Codex' : 'A-05-패널-권한묻지않기-Claude')} region={[0, 0, 808, 1008]} nat={NAT} w={PW} radius={24}
            style={{ left: 0, top: 0, boxShadow: '0 20px 40px -24px rgba(0,0,0,.6)' }} />
          {/* 빨간 경고 글씨 강조 — 원본 [40,262,730,112] */}
          {on && <span style={{ position: 'absolute', left: 40 * PW / 808 - 6, top: 262 * PW / 808 - 6, width: 730 * PW / 808 + 12, height: 112 * PW / 808 + 12, borderRadius: 12, border: `3px solid ${C.warn}`, boxShadow: `0 0 18px color-mix(in srgb, ${C.warn} 50%, transparent)` }} />}
        </div>
        <div style={{ marginTop: 12, fontSize: 18, color: C.muted, lineHeight: 1.5, wordBreak: 'keep-all' }}>묻지 않고 바로 고치고 실행합니다.</div>
      </div>

      <BuildSubs lines={SUBS} />
    </>
  );
}
