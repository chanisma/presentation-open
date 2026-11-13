import Build from '../../../../src/deck/Build';
import { C, MONO, Head, BuildSubs, SHOT, type SlideMeta } from '../kit';
import { Hi, onBox, useStep, type Box } from './_b';

/* 14 — build: 권한 확인, 무엇을 묻는가 (실화면 B-02 권한확인 명령실행 · 파일만들기 · 파일고치기)
   구도: 실제 권한 확인 화면 세 장을 계단처럼 겹쳐 두고, 단계마다 한 장이 맨 앞으로 나온다.
   오른쪽에는 그 화면이 묻는 영어 문장과 우리말 뜻, 마지막 단계에 선택지의 뜻. 좌표는 원본 1920×1080 px. */

const SUBS = [
  '에이전트는 중요한 일을 하기 전에 세 가지를 묻습니다.',
  '첫째, 명령을 실행해도 되는지 묻습니다.',
  '둘째, 새 파일을 만들어도 되는지 묻습니다.',
  '셋째, 파일을 고칠 때는 바뀌는 줄을 빨강과 초록으로 보여 줍니다.',
  '1번은 이번만 허락, 2번은 이번 대화 동안 비슷한 일을 다시 묻지 않기, 거절하려면 No나 Esc를 누르세요.',
];
export const meta: SlideMeta = { kind: 'build', subs: SUBS };

const K = 0.5;
const CARDS = [
  { shot: 'B-02-설문요약-권한확인-명령실행', box: { x: 64, y: 168, k: K }, hi: [16, 776, 1060, 270], en: 'Bash command … Do you want to proceed?', ko: '이 명령을 실행해도 될까요?', kind: '명령 실행' },
  { shot: 'B-02-설문요약-권한확인-파일만들기', box: { x: 184, y: 288, k: K }, hi: [16, 868, 1540, 130], en: 'Do you want to create 설문 결과 요약.md?', ko: '이 파일을 새로 만들어도 될까요?', kind: '파일 만들기' },
  { shot: 'B-02-설문요약-권한확인-파일고치기', box: { x: 304, y: 408, k: K }, hi: [14, 640, 1890, 210], en: 'Do you want to make this edit to 설문 결과 그래프.html?', ko: '이렇게 고쳐도 될까요? (빨강 = 지울 줄, 초록 = 넣을 줄)', kind: '파일 고치기' },
] as const;

const CHOICES: [string, string, string][] = [
  ['1. Yes', '이번 한 번만 허락', C.ok],
  ['2. Yes, and …', '이번 대화 동안 비슷한 일은 다시 묻지 않기 (don’t ask again · accept edits)', C.gold],
  ['No · Esc', '거절 — 그리고 «다르게 해 줘», «무엇을 하려는지 설명해 줘»라고 말하기', C.warn],
];

export default function S14() {
  const step = useStep(SUBS.length - 1);
  const front = step >= 1 && step <= 3 ? step - 1 : -1;
  return (
    <>
      <Head chapter="④ 첫 대화 · 4/5" title="권한 확인, 무엇을 묻는가" />
      {CARDS.map((c, i) => {
        const on = front === i;
        const b = c.box as Box;
        return (
          <div key={i} style={{ position: 'absolute', inset: 0, zIndex: on ? 10 : i, pointerEvents: 'none' }}>
            <img src={SHOT(c.shot)} alt="" style={{ position: 'absolute', left: b.x, top: b.y, width: 1920 * K, height: 1080 * K, borderRadius: 10,
              border: `2px solid ${on ? C.gold : 'rgba(31,27,22,.2)'}`, boxShadow: on ? '0 30px 60px -24px rgba(31,27,22,.7)' : '0 16px 30px -24px rgba(31,27,22,.5)',
              filter: front >= 0 && !on ? 'brightness(.55)' : 'none', transition: 'filter .4s, border-color .4s' }} />
            <Hi style={onBox(b, c.hi)} on={on ? 1 : 0} />
            {/* 제목줄의 빈 자리에 꽂는 이름표 */}
            <span style={{ position: 'absolute', left: b.x + 300, top: b.y + 3, fontSize: 16, fontWeight: 800, color: '#fff', background: on ? C.gold : '#55504a',
              borderRadius: 6, padding: '2px 10px', transition: 'background .3s', filter: front >= 0 && !on ? 'brightness(.7)' : 'none' }}>{i + 1} · {c.kind}</span>
          </div>
        );
      })}
      {/* 오른쪽: 지금 화면이 묻는 말 */}
      <div style={{ position: 'absolute', left: 1330, top: 190, width: 540 }}>
        {CARDS.map((c, i) => (
          <Build key={i} at={i + 1} style={{ marginBottom: 16 }}>
            <div style={{ padding: '14px 18px', borderRadius: 14, background: C.panel, border: `1.5px solid ${front === i ? C.gold : C.line}`, transition: 'border-color .3s' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: front === i ? C.gold : C.ink }}>{i + 1}. {c.kind}</div>
              <div style={{ marginTop: 6, fontFamily: MONO, fontSize: 16, color: C.muted, wordBreak: 'break-all' }}>{c.en}</div>
              <div style={{ marginTop: 4, fontSize: 20, color: C.ink, wordBreak: 'keep-all' }}>{c.ko}</div>
            </div>
          </Build>
        ))}
      </div>
      {/* 마지막 단계: 선택지의 뜻 — 계단 위에 덮는 판 */}
      <Build at={4} style={{ position: 'absolute', left: 64, top: 640, width: 1240, zIndex: 20 }}>
        <div style={{ padding: '18px 24px', borderRadius: 16, background: C.panel, border: `2px solid ${C.gold}`, boxShadow: '0 24px 50px -24px rgba(31,27,22,.6)' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.muted, marginBottom: 8 }}>선택지의 뜻</div>
          {CHOICES.map(([k, v, col]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'baseline', gap: 16, padding: '6px 0' }}>
              <span style={{ flexShrink: 0, width: 190, fontFamily: MONO, fontSize: 21, fontWeight: 700, color: col }}>{k}</span>
              <span style={{ fontSize: 22, color: C.ink, wordBreak: 'keep-all' }}>{v}</span>
            </div>
          ))}
        </div>
      </Build>
      <BuildSubs lines={SUBS} />
    </>
  );
}
