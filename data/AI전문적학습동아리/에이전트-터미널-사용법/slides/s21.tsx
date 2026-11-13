import { Scene, useSceneTime, interpolate, spring } from '../../../../src/scene';
import { C, Head, SceneSubs, SHOT, window4, type SlideMeta, type Sub } from '../kit';
import { Crop } from './_c';

/* 21 — scene: 이런 일에 맡겨 보세요
   메타포: 교무수첩 한 주 펼침 — 요일마다 «맡길 만한 일» 포스트잇이 붙고(각 포스트잇에 앞 장의 실제 결과 화면 조각),
   오른쪽 빨간 테두리 칸에 «맡기지 말 것»이 따로 모인다. */

const DUR = 14.5;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '정리하고, 요약하고, 초안을 만드는 일은 에이전트에게 맡기기 좋습니다.' },
  { at: 4.6, text: '자료 폴더 정리, 형성평가 요약, 학습지와 퀴즈, 회의록 정리, 수업용 웹페이지까지 같은 방법으로 할 수 있습니다.' },
  { at: 10.2, text: '성적 확정이나 생기부 최종 문장, 개인정보가 든 파일은 맡기지 말고 선생님이 직접 다루세요.' },
];

const DAYS: { day: string; text: string; shot: string; region: [number, number, number, number]; color: string; tilt: number }[] = [
  { day: '월', text: '지난주 자료 폴더 정리 · 이름 규칙 맞추기', shot: 'B-01-파일정리-완료', region: [0, 60, 1300, 700], color: '#fff3b0', tilt: -2 },
  { day: '화', text: '형성평가 결과 요약 · 다음 차시 제안', shot: 'R-설문그래프', region: [480, 280, 960, 340], color: '#d9f0ff', tilt: 1.5 },
  { day: '수', text: '학습지 · 퀴즈 초안', shot: 'B-03-학습지-완료', region: [0, 260, 1300, 460], color: '#e3f5d8', tilt: -1 },
  { day: '목', text: '회의록 할 일 · 안내문 초안', shot: 'B-04-할일정리-완료', region: [30, 60, 1040, 280], color: '#ffe0d6', tilt: 2 },
  { day: '금', text: '수업 웹페이지 · 활동 도구 만들기', shot: 'R-퀴즈-채점', region: [590, 20, 740, 560], color: '#efe2ff', tilt: -1.5 },
];
const NOT = ['성적 확정', '생기부 최종 문장', '학생 개인정보가 든 파일', '결재 문서 최종본'];

const BOOK = { x: 72, y: 170, w: 1300, h: 740 };
const COL = (BOOK.w - 80) / 5;

function Stage() {
  const t = useSceneTime();
  return (
    <>
      <Head chapter="⑤ 활용 · 6/6" title="이런 일에 맡겨 보세요" />

      {/* 교무수첩 펼침 */}
      <div style={{ position: 'absolute', left: BOOK.x, top: BOOK.y, width: BOOK.w, height: BOOK.h, borderRadius: 18, background: '#fffdf7',
        boxShadow: '0 30px 60px -30px rgba(31,27,22,.5), inset 0 0 0 1px rgba(31,27,22,.08)' }}>
        {/* 가운데 접힘 */}
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 26, transform: 'translateX(-50%)', background: 'linear-gradient(90deg, transparent, rgba(31,27,22,.12), transparent)' }} />
        <div style={{ position: 'absolute', left: 40, top: 22, fontSize: 20, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>교무수첩 · 이번 주</div>
        {DAYS.map((d, i) => (
          <div key={d.day} style={{ position: 'absolute', left: 40 + i * COL, top: 64, width: COL - 12, height: BOOK.h - 96, borderLeft: i ? '1px dashed rgba(31,27,22,.15)' : 'none' }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: C.ink, paddingLeft: 14 }}>{d.day}</div>
            {/* 줄 */}
            {Array.from({ length: 11 }, (_, k) => (
              <div key={k} style={{ position: 'absolute', left: 12, right: 6, top: 70 + k * 52, height: 1, background: 'rgba(31,27,22,.07)' }} />
            ))}
          </div>
        ))}
        {DAYS.map((d, i) => {
          const at = 0.8 + i * 1.6;
          const s = spring(t, at, 0.7);
          const W = COL - 34;
          return (
            <div key={d.day} style={{
              position: 'absolute', left: 52 + i * COL, top: 130, width: W, padding: '14px 14px 16px', background: d.color, borderRadius: 4,
              boxShadow: '0 12px 22px -14px rgba(31,27,22,.55)', transform: `translateY(${(1 - s) * -60}px) rotate(${d.tilt * s}deg) scale(${0.85 + 0.15 * s})`,
              opacity: Math.min(1, s * 1.5), transformOrigin: 'top center',
            }}>
              <div style={{ fontSize: 21, fontWeight: 800, lineHeight: 1.4, color: C.ink, wordBreak: 'keep-all', minHeight: 88 }}>{d.text}</div>
              <div style={{ position: 'relative', height: W * d.region[3] / d.region[2], marginTop: 10 }}>
                <Crop src={SHOT(d.shot)} region={d.region} w={W - 28} radius={6} style={{ left: 0, top: 0, boxShadow: '0 4px 10px rgba(0,0,0,.25)' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 오른쪽: 맡기지 말 것 */}
      <div style={{ position: 'absolute', left: 1430, top: 170, width: 420, height: 740, borderRadius: 18, border: `3px solid ${C.warn}`, background: `color-mix(in srgb, ${C.warn} 6%, #fff)`,
        padding: '26px 28px', opacity: interpolate(t, [9.6, 10.2], [0, 1]) }}>
        <div style={{ fontSize: 30, fontWeight: 900, color: C.warn, letterSpacing: -0.6 }}>맡기지 말 것</div>
        <div style={{ fontSize: 18, color: C.muted, marginTop: 6, lineHeight: 1.5, wordBreak: 'keep-all' }}>책임이 따르는 결정과 개인정보는 선생님이 직접</div>
        <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {NOT.map((n, i) => {
            const k = window4(t, 10.4 + i * 0.45, 10.8 + i * 0.45, DUR + 1, DUR + 2);
            return (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 14, opacity: k, transform: `translateX(${(1 - k) * 20}px)` }}>
                <span style={{ width: 34, height: 34, borderRadius: '50%', border: `3px solid ${C.warn}`, color: C.warn, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 20 }}>✕</span>
                <span style={{ fontSize: 25, fontWeight: 700, color: C.ink }}>{n}</span>
              </div>
            );
          })}
        </div>
        <div style={{ position: 'absolute', left: 28, right: 28, bottom: 26, fontSize: 19, lineHeight: 1.55, color: C.ink, opacity: interpolate(t, [12.4, 12.9], [0, 1]), wordBreak: 'keep-all' }}>
          에이전트가 만든 것은 <b>초안</b>입니다. 사실과 숫자는 원본과 맞춰 확인하세요.
        </div>
      </div>
      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S21() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
