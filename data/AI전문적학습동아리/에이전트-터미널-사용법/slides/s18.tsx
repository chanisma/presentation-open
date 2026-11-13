import Build from '../../../../src/deck/Build';
import { useDeck } from '../../../../src/deck/DeckContext';
import { C, MONO, Head, BuildSubs, type SlideMeta } from '../kit';

/* 18 — build: 좋은 요청의 네 가지
   메타포: 업무 지시서 형광펜 — 앞 장에서 실제로 보낸 요청 세 줄(B-01·B-02·B-03 원문)에
   클릭마다 색이 다른 형광펜이 한 가지씩 칠해진다. 오른쪽 범례가 같은 순서로 켜진다. */

const SUBS = [
  '앞의 요청 문장들에는 공통점이 있습니다.',
  '무엇을 할지 동사로 분명히 말했습니다.',
  '어느 파일을 쓸지 이름으로 짚었습니다.',
  '결과를 어떤 형식과 이름으로 받을지 정했습니다.',
  '그리고 계획부터 보여 달라는 식으로 진행 방식을 말했습니다. 이 네 가지만 넣으면 결과가 훨씬 정확해집니다.',
];
export const meta: SlideMeta = { kind: 'build', subs: SUBS };

/* 1 할 일 · 2 대상 파일 · 3 결과 형식·이름 · 4 진행 방식 */
const PEN: Record<number, { color: string; name: string; note: string }> = {
  1: { color: '#ffd166', name: '할 일', note: '정리하고 · 요약해서 · 만들어 줘' },
  2: { color: '#9ad7ff', name: '대상 파일', note: '이 폴더 파일들 · 설문응답.csv · 수업 메모.txt' },
  3: { color: '#b6f0a9', name: '결과 형식·이름', note: "'날짜_단원_제목' · '설문 결과 요약.md' · 문항 5개, 정답 따로" },
  4: { color: '#ffb3a7', name: '진행 방식', note: '바꾸기 전에 계획부터 · 그래프가 필요하면 html 한 장으로' },
};

type Seg = [string, number];
const REQS: { from: string; segs: Seg[] }[] = [
  { from: '12장 · 파일 정리', segs: [['이 폴더 파일들을', 2], [' ', 0], ['단원별 폴더로 정리하고', 1], [' 파일 이름을 ', 0], ["'날짜_단원_제목' 형식으로", 3], [' ', 0], ['바꿔 줘.', 1], [' ', 0], ['바꾸기 전에 계획부터 보여 줘.', 4]] },
  { from: '16장 · 설문 요약', segs: [['설문응답.csv를', 2], [' ', 0], ['읽고 문항별로 요약해서', 1], [' ', 0], ["'설문 결과 요약.md'로 저장해 줘.", 3], [' ', 0], ['그래프가 필요하면 html 한 장으로.', 4]] },
  { from: '17장 · 학습지', segs: [['수업 메모.txt를', 2], [' 바탕으로 학습지 초안', 0], ['(문항 5개, 정답 따로)', 3], ['을 ', 0], ['만들어 줘.', 1]] },
];

export default function S18() {
  const { clicks, isStatic } = useDeck();
  const step = isStatic ? 4 : clicks;
  return (
    <>
      <Head chapter="⑤ 활용 · 3/6" title="좋은 요청의 네 가지" />

      {/* 왼쪽: 실제 요청 세 줄 = 업무 지시서 */}
      <div style={{ position: 'absolute', left: 72, top: 190, width: 1230, display: 'flex', flexDirection: 'column', gap: 22 }}>
        {REQS.map((r) => (
          <div key={r.from} style={{ background: C.panel, borderRadius: 16, border: `1px solid ${C.line}`, padding: '18px 26px 22px', boxShadow: '0 14px 30px -22px rgba(31,27,22,.5)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.faint, marginBottom: 8 }}>{r.from}</div>
            <div style={{ fontFamily: MONO, fontSize: 29, lineHeight: 1.7, color: C.ink, wordBreak: 'keep-all' }}>
              <span style={{ color: C.gold, fontWeight: 800 }}>{'❯ '}</span>
              {r.segs.map(([text, k], i) => {
                const lit = k > 0 && step >= k;
                return (
                  <span key={i} style={{
                    backgroundImage: lit ? `linear-gradient(transparent 38%, ${PEN[k].color} 38%, ${PEN[k].color} 92%, transparent 92%)` : 'none',
                    fontWeight: lit ? 700 : 400, transition: 'background-image .3s',
                  }}>{text}</span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 오른쪽: 형광펜 범례 */}
      <div style={{ position: 'absolute', left: 1370, top: 190, width: 480, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {[1, 2, 3, 4].map((k) => {
          const on = step >= k;
          return (
            <div key={k} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', opacity: on ? 1 : 0.3, transition: 'opacity .4s' }}>
              <span style={{ flexShrink: 0, width: 54, height: 30, borderRadius: 6, background: PEN[k].color, marginTop: 6, transform: 'skewX(-12deg)' }} />
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, color: C.ink, letterSpacing: -0.6 }}>{k}. {PEN[k].name}</div>
                <div style={{ fontSize: 18, color: C.muted, lineHeight: 1.5, wordBreak: 'keep-all' }}>{PEN[k].note}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 아래: 나쁜 예 → 좋은 예 */}
      <Build at={4} style={{ position: 'absolute', left: 72, top: 800, width: 1776 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, fontSize: 25 }}>
          <span style={{ padding: '10px 20px', borderRadius: 12, background: '#f3e3df', color: C.warn, fontFamily: MONO, textDecoration: 'line-through', textDecorationThickness: 2 }}>정리해 줘</span>
          <span style={{ fontSize: 30, color: C.gold, fontWeight: 900 }}>→</span>
          <span style={{ padding: '10px 20px', borderRadius: 12, background: '#e3f0e6', color: C.ok, fontFamily: MONO, fontWeight: 700 }}>이 폴더의 hwp 파일만 단원별 폴더로 옮겨 줘. 먼저 계획부터.</span>
        </div>
      </Build>
      <BuildSubs lines={SUBS} />
    </>
  );
}
