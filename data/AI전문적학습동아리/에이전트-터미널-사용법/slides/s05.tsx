import Build from '../../../../src/deck/Build';
import { C, MONO, Head, BuildSubs, SHOT, type SlideMeta } from '../kit';
import { Pic, picRect, Box, type Region } from './_a';

/* 5 — build: 무엇이 필요한가 — 계정과 요금
   실화면: Claude Code 처음 실행의 로그인 방법(B-00-처음설치-로그인방법), Codex 첫 화면(B-06-Codex-로그인화면).
   선택지 문구는 화면 원문, 아래 칩은 우리말 뜻. 요금제 이름은 화면에 적힌 것만 쓴다(tour.md B-00·B-06). */

const SUBS = [
  '설치한 뒤에는 계정이 필요합니다. 프로그램이 대신 로그인해 주지는 않습니다.',
  'Claude Code는 보통 Claude 유료 구독 계정으로 로그인합니다.',
  '쓴 만큼 요금을 내는 API 결제 계정도 쓸 수 있습니다.',
  'Codex는 ChatGPT 계정으로 로그인하거나 API 키를 넣습니다.',
  '어떤 계정과 결제 방식을 쓸지는 학교 방침을 먼저 확인하세요.',
];
export const meta: SlideMeta = { kind: 'build', subs: SUBS };

const NAT: [number, number] = [1920, 1080];
const CR: Region = [10, 630, 1040, 170];
const CP = { x: 72, y: 250, w: 1060 };
const XR: Region = [20, 60, 880, 400];
const XP = { x: 1228, y: 250, w: 620 };

const c1 = picRect([20, 697, 920, 27], CP.x, CP.y, CP.w, CR);
const c2 = picRect([20, 727, 670, 27], CP.x, CP.y, CP.w, CR);
const x1 = picRect([62, 212, 830, 64], XP.x, XP.y, XP.w, XR);
const x2 = picRect([62, 302, 660, 64], XP.x, XP.y, XP.w, XR);
const x3 = picRect([62, 392, 340, 64], XP.x, XP.y, XP.w, XR);

function Mean({ n, en, ko, y, x = CP.x, w = CP.w }: { n: string; en: string; ko: string; y: number; x?: number; w?: number }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <span style={{ flexShrink: 0, width: 38, height: 38, borderRadius: '50%', background: C.gold, color: '#fff', fontWeight: 800, fontSize: 20, display: 'grid', placeItems: 'center' }}>{n}</span>
      <div>
        <div style={{ fontFamily: MONO, fontSize: 17, color: C.muted }}>{en}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: C.ink, marginTop: 2, wordBreak: 'keep-all' }}>{ko}</div>
      </div>
    </div>
  );
}

const B = { position: 'absolute' as const, inset: 0, pointerEvents: 'none' as const };

export default function S05() {
  return (
    <>
      <Head chapter="② 준비 · 3/4" title="무엇이 필요한가: 계정과 요금" />

      <div style={{ position: 'absolute', left: CP.x, top: CP.y - 42, fontSize: 21, fontWeight: 700, color: C.ink }}>Claude Code — 처음 실행 때 고르는 로그인 방법</div>
      <Pic src={SHOT('B-00-처음설치-로그인방법')} nat={NAT} region={CR} x={CP.x} y={CP.y} w={CP.w} />
      <div style={{ position: 'absolute', left: XP.x, top: XP.y - 42, fontSize: 21, fontWeight: 700, color: C.ink }}>Codex — 처음 실행 화면</div>
      <Pic src={SHOT('B-06-Codex-로그인화면')} nat={NAT} region={XR} x={XP.x} y={XP.y} w={XP.w} />

      <div style={{ position: 'absolute', left: CP.x, top: 690, width: 1060, fontSize: 25, lineHeight: 1.55, color: C.ink, wordBreak: 'keep-all' }}>
        스페이스기전은 <b>설치</b>까지 도와줍니다.<br /><b style={{ color: C.gold }}>로그인</b>은 처음 실행할 때 각 도구가 직접 묻습니다.
      </div>

      <Build at={1} style={B}>
        <Box r={c1} />
        <Mean n="1" en="Claude account with subscription · Pro, Max, Team, or Enterprise" ko="Claude 유료 구독 계정으로 로그인" y={460} />
      </Build>
      <Build at={2} style={B}>
        <Box r={c2} />
        <Mean n="2" en="Anthropic Console account · API usage billing" ko="쓴 만큼 요금을 내는 API 결제 계정" y={560} />
      </Build>
      <Build at={3} style={B}>
        <Box r={[x1[0] - 8, x1[1] - 4, x1[2] + 16, x1[3] + 8]} />
        <Box r={[x2[0] - 8, x2[1] - 4, x2[2] + 16, x2[3] + 8]} />
        <Box r={[x3[0] - 8, x3[1] - 4, x3[2] + 16, x3[3] + 8]} />
        <div style={{ position: 'absolute', left: XP.x, top: 562, width: XP.w, fontSize: 21, lineHeight: 1.6, color: C.ink, wordBreak: 'keep-all' }}>
          <b>1</b> ChatGPT 계정(유료 요금제에 포함)<br /><b>2</b> 다른 기기에서 일회용 코드로 로그인<br /><b>3</b> API 키 — 쓴 만큼 결제
        </div>
      </Build>
      <Build at={4} style={{ position: 'absolute', left: 1228, top: 760, width: 620 }}>
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderLeft: `5px solid ${C.warn}`, borderRadius: 12, padding: '16px 20px', fontSize: 21, lineHeight: 1.55, color: C.ink, wordBreak: 'keep-all' }}>
          <b>학교 방침을 먼저 확인하세요.</b><br />어느 계정으로, 어떤 결제 방식으로 쓸지 정한 뒤 시작합니다.
        </div>
      </Build>
      <BuildSubs lines={SUBS} />
    </>
  );
}
