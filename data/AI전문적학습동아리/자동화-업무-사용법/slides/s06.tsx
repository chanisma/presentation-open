import { Scene, useSceneTime, spring } from '../../../../src/scene';
import { C, Head, SceneSubs, seq, type SlideMeta } from '../kit';
import { AgentChat, DraftCard, Recon, fade, type Line } from './_ui';

/* 6 — 스킬 ① 쿨메신저 쪽지: 왼쪽 대화 창에서 요청 → 조직도 검색 → 초안 → 승인 → 발송·확인이 이어지고,
   오른쪽에서는 쪽지 봉투 여섯 장이 «승인» 관문 앞에서 멈춰 있다가 승인 뒤에 날아가 «보낸 쪽지함»에 꽂힌다. */

const SUBS = [
  '첫 번째 스킬, 쿨메신저 쪽지 보내기입니다.',
  '예를 들어 «2학년 담임 선생님들께 내일 연수 안내 쪽지를 보내 줘»라고 부탁합니다.',
  '에이전트가 조직도에서 받는 사람을 찾고, 선생님 말투에 맞춰 쪽지 초안을 씁니다.',
  '초안을 보여 주고 승인을 받은 뒤에만 보냅니다. 보낸 뒤에는 보낸 쪽지함을 읽어 실제로 나갔는지 확인합니다.',
  '처음 쓸 때는 평소 쪽지 말투를 몇 가지 물어보고, 문체 프로필로 기억해 둡니다.',
];
const { subs, at, end } = seq(6, SUBS);
export const meta: SlideMeta = { kind: 'scene', dur: end };

const APPROVE = at[3] + 2.2;
const LINES: Line[] = [
  { at: at[1] + 0.3, kind: 'user', text: '2학년 담임 선생님들께 내일 15시 교직원 연수 안내 쪽지 보내 줘' },
  { at: at[2] + 0.2, kind: 'tool', text: 'Skill · coolmessenger-send' },
  { at: at[2] + 1.0, kind: 'tool', text: '조직도 검색 · 2학년 담임 → 6명' },
  { at: at[2] + 2.4, kind: 'block', node: <DraftCard label="쪽지 초안" rows={[['받는 사람', '2학년 1~6반 담임 (6명)'], ['제목', '[안내] 내일 교직원 연수'], ['내용', '내일(수) 15:00 시청각실에서 연수가 있습니다. 참석 부탁드립니다.']]} ask="이대로 보낼까요?" /> },
  { at: APPROVE, kind: 'user', text: '응, 보내 줘' },
  { at: APPROVE + 1.6, kind: 'ok', text: '발송 완료 · 보낸 쪽지함에서 6통 모두 확인' },
];

function Stage() {
  const t = useSceneTime();
  return (
    <>
      <Head chapter="⑤ 스킬 ① 쿨메신저 쪽지 보내기" title="받는 사람 찾기부터 도착 확인까지" />
      <AgentChat x={72} y={170} w={1060} h={700} lines={LINES} />
      <Recon style={{ left: 72, top: 878 }} />
      {/* 오른쪽: 승인 관문과 봉투 */}
      <div style={{ position: 'absolute', left: 1200, top: 180, width: 650, height: 690 }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, fontSize: 24, fontWeight: 800, color: C.muted, opacity: fade(t, at[2]) }}>쪽지 6통</div>
        {Array.from({ length: 6 }, (_, i) => {
          const make = spring(t, at[2] + 1.2 + i * 0.15, 0.4);
          const fly = spring(t, APPROVE + 0.5 + i * 0.15, 0.7);
          const x0 = 20 + (i % 3) * 120, y0 = 60 + Math.floor(i / 3) * 100;
          const x = x0 + fly * (330 + i * 34 - x0);
          const y = y0 + fly * (560 + (i % 2) * 18 - y0);
          return (
            <div key={i} style={{ position: 'absolute', left: x, top: y, width: 100, height: 70, borderRadius: 8, background: '#fff', border: '2px solid #2a9fd8', opacity: make,
              zIndex: 5, transform: `rotate(${(1 - fly) * (i - 2.5) * 3}deg) scale(${1 - fly * 0.35})`, display: 'grid', placeItems: 'center', fontSize: 30, boxShadow: '0 10px 20px -12px rgba(0,0,0,.4)' }}>✉</div>
          );
        })}
        {/* 관문 */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 290, height: 64, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: 25, fontWeight: 800,
          background: t > APPROVE ? `color-mix(in srgb, ${C.ok} 14%, #fff)` : '#fff4e0', color: t > APPROVE ? C.ok : '#b26a00', border: `2px dashed ${t > APPROVE ? C.ok : '#e0a030'}`, opacity: fade(t, at[3]) }}>
          {t > APPROVE ? '✓ 선생님 승인' : '⏸ 승인 전에는 보내지 않음'}
        </div>
        <div style={{ position: 'absolute', left: 300, top: 470, width: 320, height: 200, borderRadius: 16, background: C.panel, border: `1.5px solid ${C.line}`, padding: '18px 22px', opacity: fade(t, at[3]) }}>
          <div style={{ fontSize: 23, fontWeight: 800 }}>보낸 쪽지함</div>
          <div style={{ marginTop: 8, fontSize: 20, color: C.ok, fontWeight: 700, opacity: fade(t, APPROVE + 1.8) }}>6 / 6 도착 확인</div>
        </div>
        {/* 문체 프로필 */}
        <div style={{ position: 'absolute', left: 0, top: 470, width: 270, padding: '16px 20px', borderRadius: 14, background: '#fffdf6', border: `1.5px solid ${C.line}`, fontSize: 20, lineHeight: 1.55, opacity: fade(t, at[4]) }}>
          <b>문체 프로필</b><br />인사말 · 맺음말<br />존댓말 수준 · 서명
        </div>
      </div>
      <SceneSubs items={subs} />
    </>
  );
}

export default function S06() {
  return (
    <Scene duration={end}>
      <Stage />
    </Scene>
  );
}
