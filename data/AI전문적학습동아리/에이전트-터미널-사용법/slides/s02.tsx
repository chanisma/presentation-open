import Build from '../../../../src/deck/Build';
import { C, MONO, Head, BuildSubs, SHOT, type SlideMeta } from '../kit';
import { Pic, type Region } from './_a';

/* 2 — build: 이 영상의 길
   메타포: 독의 «에이전트 터미널» 아이콘에서 출발한 길이 다섯 정거장을 지그재그로 잇는다.
   첫 정거장(준비)은 한 번만, 나머지 넷은 매번 되풀이하는 일 — 마지막 단계에서 괄호로 묶는다. */

const SUBS = [
    '이 영상은 처음 쓰는 선생님이 막히는 순서대로 갑니다.',
    '먼저 독에서 기능을 찾고, 에이전트를 설치하고 로그인합니다. 처음 한 번이면 됩니다.',
    '그다음 원하는 폴더에서 에이전트를 여는 법을 봅니다.',
    '첫 요청을 보내고, 계획을 보고, 허락하는 흐름을 따라 합니다.',
    '설문 요약, 학습지, 퀴즈 웹페이지 같은 실제 활용을 봅니다.',
    '마지막으로 권한과 개인정보를 안전하게 다루는 법을 정리합니다.',
];
export const meta: SlideMeta = { kind: 'build', subs: SUBS };

/* 독(A-01b, 3200×400) — 도구 무리부터 끝까지 */
const DOCK_R: Region = [1550, 100, 1650, 300];
const DOCK = { x: 72, y: 168, w: 900 };
const TILE = { x: 72 + (2562 - 1550) * (900 / 1650), y: 168 + (272 - 100) * (900 / 1650) }; // 에이전트 아이콘 중심

type Stn = { cx: number; cy: number; title: string; sub: string; src: string; nat: [number, number]; region: Region };
const STN: Stn[] = [
  { cx: 300, cy: 500, title: '준비', sub: '찾기 · 설치 · 로그인', src: SHOT('A-08a-패널-설치필요-Claude'), nat: [808, 1008], region: [24, 150, 760, 428] },
  { cx: 640, cy: 690, title: '열기', sub: '보던 폴더에서 · 패널', src: SHOT('A-03-패널-기본'), nat: [808, 1008], region: [24, 24, 760, 428] },
  { cx: 980, cy: 500, title: '첫 대화', sub: '요청 → 계획', src: SHOT('B-01-파일정리-계획끝과질문'), nat: [1920, 1080], region: [0, 300, 1280, 720] },
  { cx: 1320, cy: 690, title: '활용', sub: '설문 · 학습지 · 퀴즈', src: SHOT('R-퀴즈-문항'), nat: [1920, 1080], region: [560, 10, 800, 450] },
  { cx: 1660, cy: 500, title: '안전', sub: '권한 · 개인정보', src: SHOT('B-01-파일정리-권한확인'), nat: [1920, 1080], region: [0, 360, 1280, 720] },
];
const CW = 300;

function Station({ s, i }: { s: Stn; i: number }) {
  const x = s.cx - CW / 2;
  const y = s.cy - 84;
  return (
    <>
      <Pic src={s.src} nat={s.nat} region={s.region} x={x} y={y} w={CW} style={{ border: `2px solid ${i === 0 ? C.gold : C.line}` }} />
      <span style={{ position: 'absolute', left: x - 18, top: y - 18, width: 42, height: 42, borderRadius: '50%', background: C.gold, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 21, fontWeight: 800, boxShadow: '0 0 0 5px rgba(217,105,46,.18)' }}>{i + 1}</span>
      <div style={{ position: 'absolute', left: x, top: y + 178, width: CW }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: C.ink }}>{s.title}</div>
        <div style={{ fontSize: 19, color: C.muted, marginTop: 2 }}>{s.sub}</div>
      </div>
    </>
  );
}

/* 정거장 사이 길(카드 가장자리에서 시작·끝) */
function seg(i: number) {
  if (i === 0) return `M${TILE.x},${TILE.y + 40} C${TILE.x},${380} ${STN[0].cx + 40},${360} ${STN[0].cx},${STN[0].cy - 90}`;
  const a = STN[i - 1];
  const b = STN[i];
  if (b.cy > a.cy) {
    // 아래로: a의 오른쪽 가장자리 → b의 위 가장자리
    const ax = a.cx + CW / 2, by = b.cy - 84;
    return `M${ax},${a.cy} C${b.cx},${a.cy} ${b.cx},${a.cy} ${b.cx},${by}`;
  }
  // 위로: a의 위 가장자리 → b의 왼쪽 가장자리
  const ay = a.cy - 84, bx = b.cx - CW / 2;
  return `M${a.cx},${ay} C${a.cx},${b.cy} ${a.cx},${b.cy} ${bx},${b.cy}`;
}

export default function S02() {
  return (
    <>
      <Head chapter="① 시작하며" title="이 영상의 길" />
      <Pic src={SHOT('A-01b-교사판-독-에이전트-가리킴')} nat={[3200, 400]} region={DOCK_R} x={DOCK.x} y={DOCK.y} w={DOCK.w} />
      <div style={{ position: 'absolute', left: 1010, top: 210, width: 840, fontSize: 24, lineHeight: 1.55, color: C.ink, wordBreak: 'keep-all' }}>
        독의 <b style={{ color: C.gold }}><span style={{ fontFamily: MONO }}>{'>_'}</span> 에이전트 터미널</b>에서 출발해<br />다섯 정거장을 차례로 지납니다.
      </div>
      {STN.map((s, i) => (
        <Build key={i} at={i + 1} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: 1920, height: 1080 }}>
            <path d={seg(i)} fill="none" stroke={C.gold} strokeWidth={4} strokeDasharray="2 12" strokeLinecap="round" />
          </svg>
          <Station s={s} i={i} />
        </Build>
      ))}
      <Build at={5} style={{ position: 'absolute', left: 0, top: 0, width: 1920, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', left: STN[0].cx - CW / 2, top: 884, width: CW, borderTop: `3px solid ${C.gold}`, paddingTop: 6, fontSize: 19, fontWeight: 700, color: C.gold, textAlign: 'center' }}>한 번만</div>
        <div style={{ position: 'absolute', left: STN[1].cx - CW / 2, top: 884, width: STN[4].cx - STN[1].cx + CW, borderTop: `3px solid ${C.ink}`, paddingTop: 6, fontSize: 19, fontWeight: 700, color: C.ink, textAlign: 'center' }}>매번 · 열기부터 결과 확인까지</div>
      </Build>
      <BuildSubs lines={SUBS} />
    </>
  );
}
