import { Scene, useSceneTime, spring } from '../../../../src/scene';
import { C, Head, SceneSubs, seq, type SlideMeta } from '../kit';
import { Recon, fade } from './_ui';

/* 8 — 스킬 ③ SPACEKIJUN 업무 도구: 왼쪽 위에서 오른쪽 아래로 내려가는 계단 세 칸.
   칸마다 «말 한 줄 → 확인 질문 → 스페이스기전에 생긴 결과물»(일정 카드 · 업무 흐름 노드 · 기타 도구 꾸러미). */

const SUBS = [
  '세 번째 스킬은 SPACEKIJUN 업무 도구입니다. 연결된 MCP를 어떻게 쓰는지 정리한 매뉴얼입니다.',
  '«다음 주 화요일 7교시에 교과 협의회 일정을 잡아 줘» 하면, 참석자를 교직원 명단에서 찾아 확인받고 일정을 등록합니다.',
  '«정보공시 업무를 할 일 흐름으로 만들어 줘» 하면, 학교 업무 지도와 지난해 기록을 읽고 구성안을 보여 준 뒤 업무를 만듭니다.',
  '한글 양식으로 문서를 만들고, 플래너에 적고, 구매 신청과 발급번호, 결재 반려까지 선생님 권한 안에서 처리합니다.',
  '무언가를 바꾸기 전에는 항상 내용을 보여 주고 확인을 받습니다.',
];
const { subs, at, end } = seq(8, SUBS);
export const meta: SlideMeta = { kind: 'scene', dur: end };

function Step({ i, x, y, req, ask, children, t0 }: { i: number; x: number; y: number; req: string; ask: string; children: React.ReactNode; t0: number }) {
  const t = useSceneTime();
  const k = spring(t, t0, 0.6);
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: 1060, opacity: Math.min(1, k * 1.4), transform: `translateX(${(1 - k) * -40}px)` }}>
      <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
        <span style={{ width: 46, height: 46, borderRadius: 12, display: 'grid', placeItems: 'center', background: C.gold, color: '#fff', fontWeight: 900, fontSize: 24 }}>{i}</span>
        <span style={{ fontSize: 27, fontWeight: 700, padding: '10px 20px', borderRadius: 14, background: C.panel, border: `1.5px solid ${C.line}` }}>«{req}»</span>
      </div>
      <div style={{ marginLeft: 64, marginTop: 10, display: 'flex', gap: 18, alignItems: 'center' }}>
        <span style={{ fontSize: 21, color: '#b26a00', background: '#fff4e0', borderRadius: 10, padding: '6px 14px', opacity: fade(t, t0 + 2.2) }}>확인: {ask}</span>
        <span style={{ fontSize: 24, color: C.faint, opacity: fade(t, t0 + 3.2) }}>→</span>
        <div style={{ opacity: fade(t, t0 + 3.4) }}>{children}</div>
      </div>
    </div>
  );
}

function Stage() {
  const t = useSceneTime();
  return (
    <>
      <Head chapter="⑦ 스킬 ③ SPACEKIJUN 업무 도구 쓰기" title="스페이스기전 일을 말로 처리하기" />
      <Step i={1} x={72} y={190} t0={at[1]} req="다음 주 화요일 7교시에 교과 협의회 일정 잡아 줘" ask="참석자 4명 · 화 7교시 · 정보실">
        <span style={{ display: 'inline-flex', gap: 12, alignItems: 'center', padding: '10px 18px', borderRadius: 12, background: '#eef0ff', border: '1.5px solid #5b5bd6', fontSize: 22, fontWeight: 700 }}>📅 교과 협의회 · 화 7교시 · 참석자에게 알림</span>
      </Step>
      <Step i={2} x={240} y={400} t0={at[2]} req="정보공시 업무를 할 일 흐름으로 만들어 줘" ask="할 일 4단계 구성안">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {['자료 요청', '취합', '검토', '공시 입력'].map((s, n) => (
            <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: fade(t, at[2] + 3.6 + n * 0.35) }}>
              <span style={{ padding: '8px 14px', borderRadius: 10, background: '#fff', border: `1.5px solid ${C.gold}`, fontSize: 21, fontWeight: 700 }}>{s}</span>
              {n < 3 && <span style={{ color: C.gold }}>→</span>}
            </span>
          ))}
        </div>
      </Step>
      {/* 3 — 그 밖의 도구 꾸러미 */}
      <div style={{ position: 'absolute', left: 408, top: 620, width: 1100, opacity: fade(t, at[3]) }}>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          <span style={{ width: 46, height: 46, borderRadius: 12, display: 'grid', placeItems: 'center', background: C.gold, color: '#fff', fontWeight: 900, fontSize: 24 }}>3</span>
          <span style={{ fontSize: 27, fontWeight: 800 }}>그 밖에도</span>
        </div>
        <div style={{ marginLeft: 64, marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {['📄 한글 양식으로 문서 만들기', '🗒 플래너에 적기', '🛒 구매 신청', '🔢 가정통신문·봉사 발급번호', '✍ 결재·서명 반려', '📢 공지', '🗂 서류함'].map((s, n) => (
            <span key={s} style={{ padding: '10px 18px', borderRadius: 999, background: C.panel, border: `1.5px solid ${C.line}`, fontSize: 22, fontWeight: 600, opacity: fade(t, at[3] + 0.5 + n * 0.35) }}>{s}</span>
          ))}
        </div>
      </div>
      {/* 바꾸기 전 확인 */}
      <div style={{ position: 'absolute', right: 72, top: 190, width: 300, padding: '22px 24px', borderRadius: 16, background: '#fff4e0', border: '2px solid #e0a030', fontSize: 23, lineHeight: 1.5, fontWeight: 700, color: '#8a5200', opacity: fade(t, at[4]), wordBreak: 'keep-all' }}>
        ⏸ 바꾸기 전에<br />항상 보여 주고<br />확인받는다
      </div>
      <Recon style={{ left: 72, top: 900 }} />
      <SceneSubs items={subs} />
    </>
  );
}

export default function S08() {
  return (
    <Scene duration={end}>
      <Stage />
    </Scene>
  );
}
