import { Scene, useSceneTime, interpolate, spring } from '../../../../src/scene';
import { typed } from '../../../../src/walkthrough';
import { C, Head, SceneSubs, seq, type SlideMeta } from '../kit';
import { fade } from './_ui';

/* 9 — 복합 활용: 한 문장이 «기차»가 되어 세 역(스페이스기전 일정 → 교직원 명단 → 쿨메신저)을 차례로 지난다.
   역마다 스킬 색 깃발과 결과 꼬리표. 아래에는 같은 방식의 노선도 두 개(발급번호 → 문자, 진행 확인 → 쪽지)가 더 그려진다. */

const SUBS = [
  '스킬은 하나씩도 쓸 수 있지만, 한 번에 엮어 쓸 때 힘이 커집니다.',
  '«다음 주 수요일 교직원 연수를 일정에 넣고, 대상 선생님들께 쪽지로 안내해 줘»',
  '에이전트는 스페이스기전에 일정을 넣고, 교직원 명단에서 대상을 뽑아, 쿨메신저로 쪽지를 보냅니다. 세 가지 일이 한 문장으로 끝납니다.',
  '봉사활동 확인서 발급번호를 받고, 그 학생의 학부모님께 리로스쿨 문자로 알리는 일도 마찬가지입니다.',
  '내 업무의 진행 상황을 읽고, 남은 할 일을 담당 선생님께 쪽지로 알려 드리는 식으로도 쓸 수 있습니다.',
];
const { subs, at, end } = seq(9, SUBS);
export const meta: SlideMeta = { kind: 'scene', dur: end };

const SK = { space: '#5b5bd6', cool: '#2a9fd8', riro: '#ee7a2a' };
const MAIN = [
  { x: 330, tone: SK.space, skill: 'SPACEKIJUN', act: '연수 일정 등록', tag: '수 15:00 · 시청각실' },
  { x: 900, tone: SK.space, skill: 'SPACEKIJUN', act: '교직원 명단에서 대상 찾기', tag: '대상 12명' },
  { x: 1470, tone: SK.cool, skill: '쿨메신저', act: '안내 쪽지 발송', tag: '초안 승인 → 12통' },
];

function Line({ y, t0, stops }: { y: number; t0: number; stops: { label: string; tone: string }[] }) {
  const t = useSceneTime();
  const k = interpolate(t, [t0 + 0.4, t0 + 2.4], [0, 1]);
  return (
    <div style={{ position: 'absolute', left: 150, top: y, width: 1620, height: 80, opacity: fade(t, t0) }}>
      <div style={{ position: 'absolute', left: 0, top: 38, height: 6, width: `${k * 100}%`, borderRadius: 3, background: C.ink, opacity: 0.25 }} />
      {stops.map((s, i) => {
        const x = (i / (stops.length - 1)) * 100;
        const on = k * 100 >= x - 0.5;
        return (
          <div key={i} style={{ position: 'absolute', left: `${x}%`, top: 0, transform: `translateX(${i === 0 ? 0 : i === stops.length - 1 ? -100 : -50}%)`, display: 'flex', flexDirection: 'column', alignItems: i === 0 ? 'flex-start' : i === stops.length - 1 ? 'flex-end' : 'center' }}>
            <span style={{ width: 26, height: 26, marginTop: 28, borderRadius: '50%', background: on ? s.tone : '#ddd', border: '4px solid #fff', boxShadow: '0 0 0 2px rgba(0,0,0,.08)' }} />
            <span style={{ marginTop: 6, fontSize: 22, fontWeight: 700, whiteSpace: 'nowrap', opacity: on ? 1 : 0.3 }}>{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function Stage() {
  const t = useSceneTime();
  const go = interpolate(t, [at[2] + 0.4, at[2] + 6.5], [0, 1]);
  const trainX = 200 + go * 1500;
  return (
    <>
      <Head chapter="⑧ 스킬 엮어 쓰기" title="한 문장, 여러 시스템" />
      <div style={{ position: 'absolute', left: 150, top: 190, width: 1620, padding: '18px 30px', borderRadius: 18, background: C.gold, color: '#fff', fontSize: 29, fontWeight: 700, opacity: fade(t, at[1]), wordBreak: 'keep-all' }}>
        🎙 {typed(t, '다음 주 수요일 교직원 연수를 일정에 넣고, 대상 선생님들께 쪽지로 안내해 줘', at[1] + 0.2, 17)}
      </div>
      {/* 선로 */}
      <div style={{ position: 'absolute', left: 150, top: 420, width: 1620, height: 8, borderRadius: 4, background: 'repeating-linear-gradient(90deg, #8b8579 0 30px, transparent 30px 44px)', opacity: fade(t, at[1] + 1) }} />
      {MAIN.map((s, i) => {
        const reached = trainX >= s.x;
        const k = spring(t, at[2] + 0.4 + ((s.x - 200) / 1500) * 6.1, 0.5);
        return (
          <div key={i} style={{ position: 'absolute', left: s.x - 30, top: 300, width: 380, opacity: fade(t, at[1] + 1.2 + i * 0.3) }}>
            <div style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 8, background: s.tone, color: '#fff', fontSize: 20, fontWeight: 800 }}>{s.skill}</div>
            <div style={{ marginTop: 8, fontSize: 25, fontWeight: 800, color: reached ? C.ink : C.faint }}>{s.act}</div>
            <div style={{ position: 'absolute', top: 150, left: 0, padding: '8px 16px', borderRadius: 10, background: C.panel, border: `1.5px solid ${s.tone}`, fontSize: 21, fontWeight: 700, opacity: reached ? k : 0 }}>✓ {s.tag}</div>
          </div>
        );
      })}
      {/* 기차 = 요청 */}
      <div style={{ position: 'absolute', left: trainX - 60, top: 392, width: 120, height: 56, borderRadius: 14, background: C.ink, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 800, opacity: fade(t, at[2]) }}>요청</div>

      {/* 다른 노선 */}
      <div style={{ position: 'absolute', left: 150, top: 590, fontSize: 22, fontWeight: 800, color: C.muted, opacity: fade(t, at[3]) }}>같은 방식으로</div>
      <Line y={630} t0={at[3]} stops={[{ label: '봉사활동 발급번호 받기', tone: SK.space }, { label: '학생 학반 번호 확인', tone: SK.space }, { label: '학부모님께 문자', tone: SK.riro }]} />
      <Line y={760} t0={at[4]} stops={[{ label: '내 업무 진행 상황 읽기', tone: SK.space }, { label: '남은 할 일 정리', tone: SK.space }, { label: '담당 선생님께 쪽지', tone: SK.cool }]} />
      <SceneSubs items={subs} />
    </>
  );
}

export default function S09() {
  return (
    <Scene duration={end}>
      <Stage />
    </Scene>
  );
}
