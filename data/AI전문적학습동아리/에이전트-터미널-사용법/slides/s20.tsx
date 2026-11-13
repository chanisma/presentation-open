import { Scene, useSceneTime, interpolate, easeInOut } from '../../../../src/scene';
import {
  C, FRAME, Head, SceneSubs, Cursor, Screen, Mark, SkipChip, Chip, SHOT, camAt, toScene, window4,
  type Cam, type Key, type Shot, type SlideMeta, type Sub,
} from '../kit';
import { KeyCap } from './_c';

/* 20 — walkthrough: 퀴즈 웹페이지 만들기 (실화면 B-05 요청 → 계획 → 권한확인 → 완료 → 결과 html R-퀴즈-*)
   메타포: 무대 막 걷기 — 터미널 위로 막이 닫혔다가 걷히면, 그 뒤에 완성된 퀴즈 페이지가 서 있다.
   결과 화면은 에이전트가 만든 3단원_알고리즘_퀴즈.html 을 브라우저로 연 실제 화면. 좌표는 원본 1920×1080 px. */

const T = { ENTER: 1.2, S1: 2.4, S2: 5.4, KEY1: 6.4, S3: 7.6, CLOSE: 10.4, S4: 11.0, START: 12.4, S5: 12.8, PICK: 13.9, S6: 14.2 };
const DUR = 17.5;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '이번 단원 퀴즈를 풀 수 있는 웹페이지 하나를 만들어 달라고 했습니다.' },
  { at: 2.8, text: '에이전트는 폴더의 수업 메모와 설문을 보고 학생들이 헷갈린 부분에 문항을 더 배치했습니다.' },
  { at: T.S4, text: '만든 html 파일을 두 번 누르면 브라우저에서 바로 풀 수 있습니다. 학생에게 내기 전에 직접 풀어 보세요.' },
];

const SHOTS: Shot[] = [
  { at: 0, src: SHOT('B-05-퀴즈웹-요청') },
  { at: T.S1, src: SHOT('B-05-퀴즈웹-계획') },
  { at: T.S2, src: SHOT('B-05-퀴즈웹-권한확인') },
  { at: T.S3, src: SHOT('B-05-퀴즈웹-완료') },
  { at: T.S4, src: SHOT('R-퀴즈-시작'), fade: 0.05 },
  { at: T.S5, src: SHOT('R-퀴즈-문항'), fade: 0.15 },
  { at: T.S6, src: SHOT('R-퀴즈-채점'), fade: 0.15 },
];
const CAMS: Cam[] = [
  { t: 0, cx: 900, cy: 732, z: 1.55 },
  { t: T.S1, cx: 900, cy: 732, z: 1.55 },
  { t: T.S1 + 0.5, cx: 960, cy: 540, z: 1 },
  { t: T.S2, cx: 960, cy: 540, z: 1 },
  { t: T.S2 + 0.5, cx: 620, cy: 800, z: 1.6 },
  { t: T.S3, cx: 620, cy: 800, z: 1.6 },
  { t: T.S3 + 0.5, cx: 960, cy: 540, z: 1 },
  { t: T.S4, cx: 960, cy: 540, z: 1 },
  { t: T.S4 + 0.01, cx: 960, cy: 330, z: 1.6 },
];

const R = {
  request: [14, 925, 1890, 52],
  plan: [14, 485, 1890, 62],          // «현재 단원은 … 헷갈려한 부분에 문제를 더 배치할게요»
  create: [20, 874, 1150, 62],        // «Do you want to create 3단원_알고리즘_퀴즈.html?» + «❯ 1. Yes»
  reason: [36, 212, 1830, 66],        // «단원을 고른 이유…»
  check: [36, 755, 1810, 66],         // «코드 문법 검사만 했고, 브라우저에서 직접 열어 풀어 보지는 않았어요»
  start: [887, 349, 146, 45],         // «퀴즈 시작하기»
  opt1: [624, 165, 672, 57],          // 보기 1
} as const;
const mid = (r: readonly number[]) => [r[0] + r[2] / 2, r[1] + r[3] / 2] as const;
function key(t: number, r: readonly number[], click = true): Key {
  const [px, py] = mid(r);
  return { t, ...toScene(px, py, camAt(CAMS, t)), click };
}

function Stage() {
  const t = useSceneTime();
  const cam = camAt(CAMS, t);
  // 막: CLOSE~S4 닫힘, S4~S4+0.8 걷힘
  const close = interpolate(t, [T.CLOSE, T.S4], [0, 1], easeInOut) * (1 - interpolate(t, [T.S4 + 0.05, T.S4 + 0.9], [0, 1], easeInOut));
  return (
    <>
      <Head chapter="⑤ 활용 · 5/6" title="퀴즈 웹페이지 만들기" />
      <Screen shots={SHOTS} cams={CAMS} account={t < T.S4 ? 'Claude Code · 수업 자료' : '브라우저 · 3단원_알고리즘_퀴즈.html'}>
        {close > 0 && (
          <>
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${50 * close}%`, background: 'repeating-linear-gradient(90deg, #8a3418 0 26px, #a5421f 26px 52px)', boxShadow: '8px 0 24px rgba(0,0,0,.4)' }} />
            <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: `${50 * close}%`, background: 'repeating-linear-gradient(90deg, #a5421f 0 26px, #8a3418 26px 52px)', boxShadow: '-8px 0 24px rgba(0,0,0,.4)' }} />
          </>
        )}
      </Screen>
      <Mark rect={[...R.request]} cam={cam} k={window4(t, 0.3, 0.6, T.S1 - 0.3, T.S1)} label="요청 한 줄" labelSide="top" />
      <Mark rect={[...R.plan]} cam={cam} k={window4(t, 3.2, 3.5, 5.0, 5.3)} label="헷갈린 부분에 문항을 더" labelSide="bottom" labelSize={18} />
      <Mark rect={[...R.create]} cam={cam} k={window4(t, 5.9, 6.2, 7.2, 7.5)} label="파일 만들기 → 1. Yes" labelSide="top" labelSize={18} />
      <Mark rect={[...R.reason]} cam={cam} k={window4(t, 8.0, 8.3, 9.0, 9.2)} label="이번 단원을 고른 이유" labelSide="bottom" labelSize={18} />
      <Mark rect={[...R.check]} cam={cam} k={window4(t, 9.2, 9.4, 10.1, 10.4)} color={C.warn} label="직접 풀어 보지는 않았다고 밝힘" labelSide="top" labelSize={18} />
      <KeyCap on={window4(t, T.ENTER - 0.1, T.ENTER, T.ENTER + 0.1, T.ENTER + 0.25)} style={{ left: FRAME.x + FRAME.w - 150, top: 40, opacity: window4(t, 0.4, 0.7, 2.1, 2.4) }}>Enter ⏎</KeyCap>
      <KeyCap on={window4(t, T.KEY1 - 0.1, T.KEY1, T.KEY1 + 0.1, T.KEY1 + 0.25)} style={{ left: FRAME.x + FRAME.w - 70, top: 40, opacity: window4(t, 5.7, 6.0, 7.3, 7.6) }}>1</KeyCap>
      <SkipChip sec="141초" style={{ position: 'absolute', left: FRAME.x + 470, top: 100, opacity: window4(t, T.S1, T.S1 + 0.3, T.S3 + 1, T.S3 + 1.4) }} />
      <Chip tone="ok" style={{ position: 'absolute', left: 30, top: 300, width: 200, whiteSpace: 'normal', fontSize: 19, lineHeight: 1.45, opacity: window4(t, T.S4 + 0.9, T.S4 + 1.3, DUR + 1, DUR + 2) }}>파일을 두 번 누르면 브라우저에서 열림 · 설치 필요 없음</Chip>
      <Chip tone="gold" style={{ position: 'absolute', left: 1690, top: 300, width: 200, whiteSpace: 'normal', fontSize: 19, lineHeight: 1.45, opacity: window4(t, T.S6 + 0.4, T.S6 + 0.8, DUR + 1, DUR + 2) }}>14문항 · 고르면 바로 정답과 풀이</Chip>
      <Cursor path={[
        { t: 11.6, ...toScene(1300, 520, camAt(CAMS, 11.6)) },
        key(T.START, R.start),
        key(T.PICK, R.opt1),
        { ...key(15.0, [1100, 560, 10, 10], false), hide: true },
      ]} />
      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S20() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
