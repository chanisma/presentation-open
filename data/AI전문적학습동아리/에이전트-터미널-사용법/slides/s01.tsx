import { Scene, useSceneTime, interpolate, spring } from '../../../../src/scene';
import { typed, popIn } from '../../../../src/walkthrough';
import { C, MONO, Head, SceneSubs, Screen, SHOT, window4, type Cam, type Shot, type SlideMeta, type Sub } from '../kit';
import { ExplorerMock } from './_a';

/* 1 — scene: 답해 주는 AI, 일해 주는 AI
   메타포: 같은 요청 한 줄을 왼쪽 «상담 창구»(채팅 창)와 오른쪽 «내 책상»(폴더 + 실제 터미널)이 받는다.
   채팅 창은 답 문단으로 끝나고, 에이전트 쪽은 폴더에 파일 두 개가 실제로 생긴다(실화면 B-02 완료). */

const T = { TYPE: 0.3, USER: 2.3, AI: 3.4, TAIL: 6.3, FRAME: 3.0, F1: 7.0, F2: 7.9, STEPS: 10.6 };
const DUR = 15;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '에이전트 터미널은 선생님의 폴더에서 AI 에이전트를 여는 기능입니다.' },
  { at: 3, text: '챗봇은 답을 말해 주지만, 파일을 만들고 정리하는 일은 선생님 몫으로 남습니다.' },
  { at: 7, text: '에이전트는 폴더의 파일을 직접 읽고, 새 파일을 만들고, 고칩니다.' },
  { at: 11, text: '대신 무엇을 할지 먼저 말하고, 선생님이 허락하면 진행합니다.' },
];

const REQ = '설문응답.csv를 요약해서 파일로 저장해 줘';
const AI_ANS = '문항별로 요약하면, 평균 이해도는 3.6점이고 가장 많이 헷갈린 내용은 «버블 정렬의 한 바퀴»입니다. …';

const FR = { x: 760, y: 250, w: 1088, h: 612 };
const SHOTS: Shot[] = [{ at: 0, src: SHOT('B-02-설문요약-완료') }];
const CAMS: Cam[] = [
  { t: 0, cx: 768, cy: 480, z: 1.25 },
  { t: 6, cx: 768, cy: 480, z: 1.25 },
  { t: 8, cx: 700, cy: 430, z: 1.45 },
];

function Stage() {
  const t = useSceneTime();
  const req = typed(t, REQ, T.TYPE, 14);
  const ans = typed(t, AI_ANS, T.AI, 22);
  return (
    <>
      <Head chapter="① 시작하며 · 에이전트 터미널 사용법과 활용" title="답해 주는 AI, 일해 주는 AI" />

      {/* 같은 요청 한 줄 */}
      <div style={{ position: 'absolute', left: 760, top: 146, width: 1088, height: 54, borderRadius: 999, background: C.panel, border: `1.5px solid ${C.line}`,
        display: 'flex', alignItems: 'center', gap: 14, padding: '0 24px', boxShadow: '0 12px 30px -20px rgba(31,27,22,.5)', zIndex: 5 }}>
        <span style={{ fontSize: 17, fontWeight: 700, color: C.gold, whiteSpace: 'nowrap' }}>같은 요청</span>
        <span style={{ fontSize: 24, color: C.ink, fontWeight: 600 }}>{req}<span style={{ opacity: t < 3 && Math.floor(t * 2.4) % 2 ? 0 : 1, color: C.gold }}>|</span></span>
      </div>

      {/* 왼쪽: 상담 창구 — 채팅 창 */}
      <div style={{ position: 'absolute', left: 72, top: 250, width: 620, height: 370, background: C.panel, borderRadius: 18, border: `1px solid ${C.line}`,
        boxShadow: '0 24px 60px -30px rgba(31,27,22,.45)', padding: '18px 22px', ...popIn(t, 1.2) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 19, fontWeight: 700, color: C.muted }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: C.violet }} />챗봇 · 답을 말해 준다
        </div>
        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', opacity: interpolate(t, [T.USER, T.USER + 0.3], [0, 1]) }}>
          <span style={{ background: C.violet, color: '#fff', borderRadius: '16px 16px 4px 16px', padding: '10px 16px', fontSize: 20, maxWidth: 440 }}>{REQ}</span>
        </div>
        <div style={{ marginTop: 16, background: '#f3f0ea', borderRadius: '16px 16px 16px 4px', padding: '12px 16px', fontSize: 20, lineHeight: 1.5, color: C.ink, minHeight: 96,
          opacity: interpolate(t, [T.AI - 0.2, T.AI], [0, 1]) }}>
          {ans}
        </div>
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 700, color: C.warn, opacity: interpolate(t, [T.TAIL, T.TAIL + 0.4], [0, 1]) }}>
          <span style={{ fontSize: 24 }}>✋</span>«파일은 직접 복사해서 저장해 주세요.»
        </div>
      </div>

      {/* 오른쪽: 내 책상 — 실제 터미널 + 폴더에 생기는 파일 */}
      <div style={{ position: 'absolute', left: FR.x, top: FR.y - 34, fontSize: 19, fontWeight: 700, color: C.gold, display: 'flex', gap: 10, alignItems: 'center', opacity: interpolate(t, [T.FRAME, T.FRAME + 0.4], [0, 1]) }}>
        <span style={{ fontFamily: MONO }}>{'>_'}</span>에이전트 · 내 폴더에서 일한다
      </div>
      <div style={{ position: 'absolute', inset: 0, ...popIn(t, T.FRAME) }}>
        <Screen shots={SHOTS} cams={CAMS} frame={FR} />
      </div>
      <ExplorerMock x={1350} y={560} w={498} h={292}
        files={['설문응답.csv', '수업 메모.txt', '회의록.txt', '반복문 연습문제.txt']}
        extra={['설문 결과 요약.md', '설문 결과 그래프.html']}
        extraOn={[spring(t, T.F1, 0.6), spring(t, T.F2, 0.6)]}
        style={{ ...popIn(t, 5.6), zIndex: 30 }} />

      {/* 아래 왼쪽: 에이전트가 일하는 네 칸 */}
      <div style={{ position: 'absolute', left: 72, top: 680, width: 620, zIndex: 20 }}>
        <div style={{ fontSize: 19, fontWeight: 700, color: C.muted, marginBottom: 12, opacity: window4(t, T.STEPS - 0.3, T.STEPS, DUR + 1, DUR + 2) }}>에이전트가 일하는 순서</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {['읽기', '계획', '허락', '만들기'].map((s, i) => {
            const k = spring(t, T.STEPS + i * 0.45, 0.5);
            const key = s === '허락';
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: Math.min(1, k * 1.4), transform: `translateY(${(1 - k) * 14}px)` }}>
                <span style={{ padding: '14px 20px', borderRadius: 12, fontSize: 24, fontWeight: 800, background: key ? C.gold : C.panel, color: key ? '#fff' : C.ink, border: `1.5px solid ${key ? C.gold : C.line}` }}>{s}</span>
                {i < 3 && <span style={{ color: C.faint, fontSize: 22 }}>→</span>}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 12, fontSize: 18, color: C.muted, opacity: window4(t, T.STEPS + 1.6, T.STEPS + 2, DUR + 1, DUR + 2) }}>«허락»은 선생님 몫입니다.</div>
      </div>
      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S01() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
