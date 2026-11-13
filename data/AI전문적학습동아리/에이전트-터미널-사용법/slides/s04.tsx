import { Scene, useSceneTime, interpolate } from '../../../../src/scene';
import { popIn } from '../../../../src/walkthrough';
import { C, Head, SceneSubs, Cursor, Chip, SHOT, window4, type SlideMeta, type Sub } from '../kit';
import { Pic, picRect, pct, Box, PsWindow, PS, type Region } from './_a';

/* 4 — walkthrough: 처음 한 번 — «설치하기» (A-08a → 설치 창(목업) → A-09a → A-03)
   메타포: 신호등 — 패널 옆 신호가 빨강(설치 필요) → 주황(설치 창 진행 중) → 초록(바로 쓸 수 있음)으로 바뀐다.
   설치 창은 실제 설치를 다시 돌리지 않아 agent.py install_text() 의 문구로 다시 그린 목업이다(reference/labels.md). */

const T = { CLICK: 2.4, S2: 3.0, WIN: 3.4, L1: 3.9, L2: 4.6, WAIT: 5.4, OK: 9.2, ENTER: 10.0, WINOFF: 12.0, S3: 12.6, CHIPS: 12.9 };
const DUR = 16;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '에이전트가 아직 없으면 패널에 빨간 줄과 «설치하기» 단추가 나옵니다.' },
  { at: T.WIN, text: '누르면 설치 창이 열리고, 공식 설치 프로그램이 알아서 진행합니다. 관리자 권한은 필요 없습니다.' },
  { at: 11.6, text: '설치가 끝나면 패널이 저절로 바뀌어 바로 쓸 수 있습니다. 프로그램을 다시 켤 필요가 없습니다.' },
];

const NAT: [number, number] = [808, 1008];
const FULL: Region = [0, 0, 808, 1008];
const P = { x: 110, y: 186, w: 561 };
const BTN = picRect([608, 338, 128, 52], P.x, P.y, P.w, FULL); // «설치하기»

function Signal({ t }: { t: number }) {
  const phase = t < T.S2 ? 0 : t < T.S3 ? 1 : 2;
  const blink = phase === 1 ? 0.55 + 0.45 * Math.abs(Math.sin(t * 2.4)) : 1;
  const lamps = ['#d64541', '#f0a030', '#2fa35a'];
  const names = ['설치 필요', '설치 중', '쓸 수 있음'];
  return (
    <div style={{ position: 'absolute', left: P.x + P.w + 26, top: P.y + 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ background: '#22201d', borderRadius: 18, padding: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {lamps.map((c, i) => (
          <span key={c} style={{ width: 40, height: 40, borderRadius: '50%', background: i === phase ? c : '#3a3733', opacity: i === phase ? blink : 1, boxShadow: i === phase ? `0 0 18px ${c}` : 'none' }} />
        ))}
      </div>
      <span style={{ fontSize: 17, fontWeight: 700, color: lamps[phase], whiteSpace: 'nowrap' }}>{names[phase]}</span>
    </div>
  );
}

function Stage() {
  const t = useSceneTime();
  const dots = '·'.repeat(1 + (Math.floor(t * 3) % 6));
  const lines: [string, string][] = [];
  if (t >= T.L1) lines.push(['Claude Code 설치', PS.white], ['', PS.white]);
  if (t >= T.L2) lines.push(['Anthropic 공식 설치 스크립트로 설치합니다 (https://claude.ai/install.ps1)', PS.cyan]);
  if (t >= T.WAIT) lines.push([t < T.OK ? `  (설치 프로그램이 내려받아 설치하는 중 ${dots})` : '  (설치 프로그램 출력)', PS.faint]);
  if (t >= T.OK) lines.push(['', PS.white], ['설치를 마쳤습니다. 독의 에이전트 터미널에서 바로 쓸 수 있습니다.', PS.green]);
  if (t >= T.ENTER) lines.push(['엔터를 누르면 이 창을 닫습니다: ', PS.white]);
  const winK = window4(t, T.WIN, T.WIN + 0.01, T.WINOFF, T.S3);
  return (
    <>
      <Head chapter="② 준비 · 2/4" title="처음 한 번: «설치하기»" />

      <Pic src={SHOT('A-08a-패널-설치필요-Claude')} nat={NAT} region={FULL} x={P.x} y={P.y} w={P.w} radius={22} />
      <Pic src={SHOT('A-09a-패널-설치창연-Claude')} nat={NAT} region={FULL} x={P.x} y={P.y} w={P.w} radius={22} shadow={false} style={{ opacity: interpolate(t, [T.S2, T.S2 + 0.35], [0, 1]) }} />
      <Pic src={SHOT('A-03-패널-기본')} nat={NAT} region={FULL} x={P.x} y={P.y} w={P.w} radius={22} shadow={false} style={{ opacity: interpolate(t, [T.S3, T.S3 + 0.4], [0, 1]) }} />
      <Box r={BTN} k={window4(t, 1.2, 1.5, T.CLICK + 0.3, T.S2)} label="설치하기" side="bottom" />
      <Signal t={t} />

      {winK > 0 && (
        <div style={{ position: 'absolute', inset: 0, opacity: winK, ...(t < T.WIN + 0.6 ? popIn(t, T.WIN) : {}) }}>
          <PsWindow x={800} y={226} w={1048} h={560} lines={lines} />
          <div style={{ position: 'absolute', left: 800, top: 796, fontSize: 16, color: C.muted }}>설치 창 — 프로그램이 띄우는 문구 그대로 다시 그린 화면</div>
        </div>
      )}

      <div style={{ position: 'absolute', left: 800, top: 380, width: 1048, display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'flex-start' }}>
        <div style={{ ...popIn(t, T.CHIPS), fontSize: 30, fontWeight: 800, color: C.ink, wordBreak: 'keep-all' }}>설치 창이 닫히면 패널이 저절로 바뀝니다</div>
        <div style={{ ...popIn(t, T.CHIPS + 0.3) }}><Chip tone="ok">빨간 줄이 사라지고 «열기»가 켜짐</Chip></div>
        <div style={{ ...popIn(t, T.CHIPS + 0.6) }}><Chip>관리자 권한 필요 없음 · 이 사용자에게 설치</Chip></div>
        <div style={{ ...popIn(t, T.CHIPS + 0.9) }}><Chip tone="muted">Codex는 winget으로 (없으면 npm)</Chip></div>
        <div style={{ ...popIn(t, T.CHIPS + 1.2) }}><Chip tone="muted">프로그램을 다시 켜지 않아도 인식</Chip></div>
      </div>

      <Cursor path={[
        { t: 1.4, ...pct(BTN[0] + 40, BTN[1] + 140) },
        { t: T.CLICK, ...pct(BTN[0] + BTN[2] / 2, BTN[1] + BTN[3] / 2), click: true },
        { t: 3.2, ...pct(BTN[0] + BTN[2] / 2, BTN[1] + BTN[3] / 2), hide: true },
      ]} />
      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S04() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
