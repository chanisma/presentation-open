import Build from '../../../../src/deck/Build';
import { C, MONO, Head, BuildSubs, type Frame, type SlideMeta } from '../kit';
import { BuildFrame, Hi, inFrame, stepCam, useStep } from './_b';

/* 11 — build: 터미널 화면 읽는 법 (실화면 B-01 요청 · 살펴보는중 · 계획끝과질문)
   구도: 왼쪽에 실제 터미널(dominant), 단계마다 카메라가 그 구역으로 다가가고 오른쪽 «읽는 순서» 카드가 하나씩 켜진다.
   좌표는 원본 1920×1080 px. */

const SUBS = [
  '터미널 화면은 네 부분만 알면 됩니다.',
  '맨 위에는 버전과 모델, 지금 일하는 폴더가 보입니다.',
  '가운데에는 선생님의 요청과 에이전트가 한 일이 차례로 쌓입니다.',
  '아래 입력칸에 우리말로 요청을 쓰고 Enter를 누르면 보냅니다.',
  '맨 아래 줄은 지금 모드를 보여 줍니다. 입력칸의 흐린 글은 다음 요청 제안일 뿐이니 무시해도 됩니다.',
];
export const meta: SlideMeta = { kind: 'build', subs: SUBS };

const F: Frame = { x: 80, y: 168, w: 1180, h: 664 };
const SHOTS = ['B-01-파일정리-요청', 'B-01-파일정리-요청', 'B-01-파일정리-살펴보는중', 'B-01-파일정리-요청', 'B-01-파일정리-계획끝과질문'];
const CAMS = [
  { cx: 960, cy: 540, z: 1 },
  { cx: 0, cy: 150, z: 1.9 },   // cx 0 = 왼쪽 끝에 붙임(camAt이 조인다)
  { cx: 0, cy: 400, z: 1.7 },
  { cx: 0, cy: 960, z: 1.7 },
  { cx: 0, cy: 975, z: 1.85 },
];
const RECT: (readonly number[] | null)[] = [
  null,
  [18, 88, 980, 102],     // 머리: 버전·모델·폴더
  [14, 240, 1080, 300],     // 대화 기록(● 에이전트가 한 일)
  [4, 925, 1110, 52],      // 입력칸
  [18, 925, 690, 140],     // 흐린 제안 글 + 상태 줄
];

const CARDS: { title: string; text: string; tag?: string }[] = [
  { title: '머리', text: '버전 · 모델 · 지금 일하는 폴더', tag: '모델 표시는 선생님 계정에 따라 다릅니다' },
  { title: '대화 기록', text: '«●» 표시가 에이전트가 한 일입니다. 위가 먼저, 아래가 나중.' },
  { title: '입력칸 ›', text: '여기에 우리말로 요청을 쓰고 Enter로 보냅니다.' },
  { title: '상태 줄', text: '«manual mode on» = 허락받고 일하는 모드. 흐린 글은 다음 요청 제안.' },
];

export default function S11() {
  const step = useStep(SUBS.length - 1);
  const cam = stepCam(CAMS, step);
  const r = RECT[step];
  return (
    <>
      <Head chapter="④ 첫 대화 · 1/5" title="터미널 화면 읽는 법" />
      <BuildFrame frame={F} step={step} shots={SHOTS} cams={CAMS}>
        {r && <Hi style={inFrame(F, cam, r)} on={1} />}
      </BuildFrame>
      <div style={{ position: 'absolute', left: 1310, top: 180, width: 560, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.muted, letterSpacing: 1 }}>위에서 아래로 읽기</div>
        {CARDS.map((c, i) => {
          const now = step === i + 1;
          return (
            <Build key={i} at={i + 1}>
              <div style={{ padding: '16px 20px', borderRadius: 14, background: C.panel, border: `1.5px solid ${now ? C.gold : C.line}`,
                boxShadow: now ? '0 18px 36px -22px rgba(217,105,46,.65)' : 'none', transition: 'border-color .3s, box-shadow .3s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 34, height: 34, borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 18, color: '#fff', background: now ? C.gold : C.muted }}>{i + 1}</span>
                  <span style={{ fontSize: 27, fontWeight: 800, color: C.ink, fontFamily: i === 2 ? MONO : undefined }}>{c.title}</span>
                </div>
                <div style={{ marginTop: 6, marginLeft: 46, fontSize: 21, lineHeight: 1.45, color: C.muted, wordBreak: 'keep-all' }}>{c.text}</div>
                {c.tag && <div style={{ marginTop: 6, marginLeft: 46, fontSize: 17, color: C.gold }}>{c.tag}</div>}
              </div>
            </Build>
          );
        })}
      </div>
      <BuildSubs lines={SUBS} />
    </>
  );
}
