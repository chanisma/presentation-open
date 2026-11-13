import { Scene, useSceneTime, spring } from '../../../../src/scene';
import { C, Head, SceneSubs, SHOT, seq, type SlideMeta } from '../kit';
import { fade } from './_ui';

/* 11 — 안전 수칙 + 마무리: 세 개의 «신호등» 줄이 위에서 차례로 켜지고, 마지막에 독의 마법봉이 다시 빛나며 끝난다. */

const SUBS = [
  '마지막으로 안전하게 쓰는 법 세 가지입니다.',
  '첫째, 쪽지나 문자처럼 다른 사람에게 가는 것은 보내기 전에 초안을 꼭 읽고 승인합니다. 보낸 것은 되돌릴 수 없습니다.',
  '둘째, 로그인과 승인은 선생님이 직접 합니다. 학생 개인정보를 다루는 일에는 원격 제어를 꺼 둡니다.',
  '셋째, 처음에는 «먼저 계획부터 보여 줘»라고 시작해 보세요. 가장 쉬운 안전장치입니다.',
  '독의 마법봉을 누르고, 오늘 할 일 하나를 말로 맡겨 보세요.',
];
const { subs, at, end } = seq(11, SUBS);
export const meta: SlideMeta = { kind: 'scene', dur: end };

const RULES: [string, string, string][] = [
  ['🛑', '보내기 전에 초안 승인', '쪽지 · 문자 · 결재 반려는 되돌릴 수 없다'],
  ['🔑', '로그인·승인은 직접', '개인정보를 다룰 때는 원격 제어 끄기'],
  ['🧭', '«먼저 계획부터 보여 줘»', '무엇을 할지 듣고 나서 맡긴다'],
];

function Stage() {
  const t = useSceneTime();
  const fin = spring(t, at[4], 0.7);
  return (
    <>
      <Head chapter="⑩ 안전하게 쓰기" title="세 가지만 지키면 됩니다" />
      {RULES.map(([icon, head, sub], i) => {
        const k = spring(t, at[i + 1], 0.55);
        return (
          <div key={head} style={{ position: 'absolute', left: 72 + i * 90, top: 200 + i * 150, width: 1100, height: 124, borderRadius: 20, background: C.panel, border: `1.5px solid ${C.line}`,
            display: 'flex', alignItems: 'center', gap: 28, padding: '0 34px', opacity: Math.min(1, k * 1.4), transform: `translateX(${(1 - k) * -50}px)`, boxShadow: '0 20px 40px -28px rgba(31,27,22,.5)' }}>
            <span style={{ fontSize: 54 }}>{icon}</span>
            <div>
              <div style={{ fontSize: 34, fontWeight: 800 }}>{head}</div>
              <div style={{ marginTop: 4, fontSize: 23, color: C.muted }}>{sub}</div>
            </div>
          </div>
        );
      })}
      {/* 마무리 — 마법봉 */}
      <div style={{ position: 'absolute', left: 1420, top: 260, width: 360, height: 420, borderRadius: 30, background: C.panel, border: `2px solid ${C.gold}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 26,
        opacity: fin, transform: `scale(${0.85 + 0.15 * fin})`, boxShadow: `0 0 ${60 * fin}px color-mix(in srgb, ${C.gold} 35%, transparent)` }}>
        <div style={{ width: 150, height: 150, borderRadius: 34, overflow: 'hidden', position: 'relative' }}>
          <img src={SHOT('D-dock')} alt="" style={{ position: 'absolute', left: -2430 * 1.38, top: -14 * 1.38, width: 2860 * 1.38 }} />
        </div>
        <div style={{ fontSize: 34, fontWeight: 800, color: C.gold }}>자동화 업무</div>
        <div style={{ fontSize: 24, color: C.muted, textAlign: 'center', lineHeight: 1.5, opacity: fade(t, at[4] + 1.2) }}>오늘 할 일 하나,<br />말로 맡겨 보세요</div>
      </div>
      <SceneSubs items={subs} />
    </>
  );
}

export default function S11() {
  return (
    <Scene duration={end}>
      <Stage />
    </Scene>
  );
}
