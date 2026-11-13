import { Scene, useSceneTime, interpolate, easeInOut } from '../../../../src/scene';
import {
  C, Head, SceneSubs, Screen, Mark, SkipChip, SHOT, camAt, window4,
  type Cam, type Frame, type Shot, type SlideMeta, type Sub,
} from '../kit';
import { Paper, KeyCap } from './_c';

/* 17 — walkthrough: 수업 메모로 학습지 초안 만들기 (실화면 B-03 요청 → 권한확인 → 완료, 결과 results/B-03)
   메타포: 종이접기 — 왼쪽 «수업 메모» 한 장이 가운데 선을 따라 접히며 «학습지»와 «정답지» 두 장으로 갈라진다.
   터미널은 오른쪽 틀(16장과 반대쪽). 좌표는 원본 1920×1080 px. */

const T = { ENTER: 1.4, S1: 3.2, KEY1: 5.2, S2: 7.6, SPLIT: 8.0, LAST: 11.4 };
const DUR = 15;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '수업 메모를 바탕으로 문항 다섯 개짜리 학습지와 정답지를 따로 만들어 달라고 했습니다.' },
  { at: 7.8, text: '에이전트는 메모의 내용과 학생들이 헷갈린 부분을 반영해 문항을 만들고, 풀이를 스스로 검산해 정답을 고쳤습니다.' },
  { at: T.LAST, text: '한글이나 Word 양식이 필요하면 이어서 «한글 파일로 옮겨 줘»처럼 다시 요청하면 됩니다.' },
];

const F: Frame = { x: 756, y: 160, w: 1100, h: 619 };
const SHOTS: Shot[] = [
  { at: 0, src: SHOT('B-03-학습지-요청') },
  { at: T.S1, src: SHOT('B-03-학습지-권한확인') },
  { at: T.S2, src: SHOT('B-03-학습지-완료') },
];
const CAMS: Cam[] = [
  { t: 0, cx: 900, cy: 732, z: 1.55 },
  { t: T.S1, cx: 900, cy: 732, z: 1.55 },
  { t: T.S1 + 0.6, cx: 620, cy: 800, z: 1.6 },
  { t: T.S2, cx: 620, cy: 800, z: 1.6 },
  { t: T.S2 + 0.6, cx: 740, cy: 560, z: 1.3 },
  { t: 11.0, cx: 740, cy: 560, z: 1.3 },
  { t: 11.6, cx: 740, cy: 640, z: 1.3 },
];

const R = {
  request: [14, 925, 1890, 52],
  create: [20, 874, 1150, 62],     // «Do you want to create …(초안).txt?» + «❯ 1. Yes»
  items: [36, 425, 1400, 270],     // 문항 구성 1~5
  last: [36, 785, 1400, 34],       // «파일은 초안이라 텍스트로 만들었습니다…»
} as const;

function Stage() {
  const t = useSceneTime();
  const cam = camAt(CAMS, t);
  const split = interpolate(t, [T.SPLIT, T.SPLIT + 1.2], [0, 1], easeInOut);
  return (
    <>
      <Head chapter="⑤ 활용 · 2/6" title="수업 메모로 학습지 초안 만들기" />
      <Screen shots={SHOTS} cams={CAMS} frame={F} account="Claude Code · 수업 자료" />
      <Mark rect={[...R.request]} cam={cam} frame={F} k={window4(t, 0.3, 0.6, T.S1 - 0.3, T.S1)} label="요청 한 줄" labelSide="top" />
      <Mark rect={[...R.create]} cam={cam} frame={F} k={window4(t, 3.9, 4.2, 6.9, 7.3)} label="파일을 만들어도 될까요? → 1. Yes" labelSide="top" labelSize={18} />
      <Mark rect={[...R.items]} cam={cam} frame={F} k={window4(t, 8.4, 8.7, 10.7, 11.1)} label="학생들이 헷갈린 점을 문항으로" labelSide="top" labelSize={18} />
      <Mark rect={[...R.last]} cam={cam} frame={F} k={window4(t, 11.8, 12.1, DUR + 1, DUR + 2)} label="양식 바꾸기는 이어서 요청" labelSide="top" labelSize={18} />
      <KeyCap on={window4(t, T.ENTER - 0.1, T.ENTER, T.ENTER + 0.1, T.ENTER + 0.25)} style={{ left: F.x + F.w - 150, top: F.y + F.h + 18, opacity: window4(t, 0.6, 0.9, 2.8, 3.1) }}>Enter ⏎</KeyCap>
      <KeyCap on={window4(t, T.KEY1 - 0.1, T.KEY1, T.KEY1 + 0.1, T.KEY1 + 0.25)} style={{ left: F.x + F.w - 70, top: F.y + F.h + 18, opacity: window4(t, 4.4, 4.7, 7.0, 7.4) }}>1</KeyCap>
      <SkipChip sec="75초" style={{ position: 'absolute', left: F.x, top: F.y + F.h + 24, opacity: window4(t, T.S1, T.S1 + 0.3, T.S2 + 0.8, T.S2 + 1.2) }} />

      {/* 왼쪽: 메모 한 장 → 두 장으로 접혀 갈라짐 */}
      <Paper name="수업 메모.txt" style={{
        left: 64, top: 170, width: 620, transformOrigin: 'center top',
        transform: `rotateX(${split * 80}deg) scale(${1 - 0.15 * split})`, opacity: 1 - split,
      }}>
        <div style={{ fontWeight: 700 }}>[수업 메모] 정보 3단원 알고리즘 - 정렬과 탐색</div>
        <div>· 버블 정렬: 이웃한 두 값을 비교해 큰 값을 뒤로 보낸다</div>
        <div>· 이진 탐색: 정렬된 자료에서 절반씩 줄여 간다</div>
        <div style={{ color: C.gold, fontWeight: 600 }}>· 학생들이 헷갈린 점: «한 바퀴»가 끝나는 시점, 교환과 비교의 차이</div>
      </Paper>
      {/* 접는 선 */}
      <svg viewBox="0 0 640 40" style={{ position: 'absolute', left: 64, top: 330, width: 620, height: 40, opacity: window4(t, T.SPLIT - 0.6, T.SPLIT - 0.2, T.SPLIT + 1.0, T.SPLIT + 1.4) }}>
        <line x1={10} y1={20} x2={630} y2={20} stroke={C.gold} strokeWidth={3} strokeDasharray="10 8" />
      </svg>
      <Paper name="3단원_정렬과탐색_학습지(초안).txt" mono style={{
        left: 64, top: 190, width: 620, opacity: split,
        transform: `translateY(${(1 - split) * 20}px) rotate(${-1.5 * split}deg)`,
      }}>
        {'[학습지] 정보 3단원 알고리즘 - 정렬과 탐색\n2학년 ___반 ___번  이름: _______\n\n2. [ 5, 3, 8, 1, 4 ]를 버블 정렬로\n  (1) 첫 번째 바퀴가 끝났을 때 순서는?\n  (2) 비교 ____번   교환 ____번'}
      </Paper>
      <Paper name="…학습지(초안)_정답.txt" mono style={{
        left: 104, top: 560, width: 580, opacity: split,
        transform: `translateY(${(1 - split) * -340}px) rotate(${1.2 * split}deg)`,
      }}>
        {'2. (1) [ 3, 5, 1, 4, 8 ]\n   (2) 비교 4번, 교환 3번'}
      </Paper>
      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S17() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
