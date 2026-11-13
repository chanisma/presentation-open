import { Scene, useSceneTime, interpolate, spring } from '../../../../src/scene';
import { typed } from '../../../../src/walkthrough';
import { C, Head, SceneSubs, seq, type SlideMeta } from '../kit';
import { Recon, fade } from './_ui';

/* 7 — 스킬 ② 리로스쿨 문자: 가운데 휴대폰 한 대가 dominant. 문자 미리보기가 타이핑되고,
   왼쪽 «계산대 영수증»(받는 사람 수 · 장문 · 차감 건수)이 한 줄씩 찍힌 뒤, 승인 도장이 찍혀야 휴대폰 화면이 «발송됨»으로 바뀐다. */

const SUBS = [
  '두 번째 스킬, 리로스쿨 알림 문자 보내기입니다.',
  '«1학년 3반 학부모님께 체험학습 준비물 안내 문자를 보내 줘»처럼 부탁하면,',
  '에이전트가 리로스쿨에 들어가 학급으로 받는 사람을 고르고, 문자 내용을 씁니다.',
  '보내기 전에 받는 사람 수와 단문, 장문 차감 건수를 미리 보여 주고, 승인해야 발송합니다.',
  '로그인은 데스크에 저장해 둔 리로스쿨 계정으로 자동으로 합니다.',
];
const { subs, at, end } = seq(7, SUBS);
export const meta: SlideMeta = { kind: 'scene', dur: end };

const MSG = '[샘플고] 1학년 3반 학부모님께, 금요일 현장체험학습에는 도시락과 물, 편한 운동화를 챙겨 보내 주세요. 집결은 8시 30분 정문입니다.';
const RECEIPT: [string, string][] = [['받는 사람', '1학년 3반 학부모 28명'], ['문자 종류', '장문 (90바이트 초과)'], ['차감 건수', '28건 (장문)']];

function Stage() {
  const t = useSceneTime();
  const sent = at[3] + 4.2;
  const stamp = spring(t, sent - 0.6, 0.4);
  return (
    <>
      <Head chapter="⑥ 스킬 ② 리로스쿨 알림 문자 보내기" title="보내기 전에 건수부터 확인" />
      {/* 요청 */}
      <div style={{ position: 'absolute', left: 72, top: 190, width: 760, padding: '20px 26px', borderRadius: '22px 22px 22px 6px', background: C.gold, color: '#fff', fontSize: 27, lineHeight: 1.5, fontWeight: 600, opacity: fade(t, at[1]), wordBreak: 'keep-all' }}>
        {typed(t, '1학년 3반 학부모님께 체험학습 준비물 안내 문자 보내 줘', at[1] + 0.2, 16)}
      </div>
      <div style={{ position: 'absolute', left: 72, top: 340, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 22, color: C.muted }}>
        {['리로스쿨 자동 로그인 (데스크에 저장한 계정)', '알림 › 문자 발송 › 1학년 3반 · 학부모', '문자 내용 작성'].map((s, i) => (
          <div key={s} style={{ opacity: fade(t, at[2] + 0.4 + i * 1.1) }}><span style={{ color: C.gold }}>●</span> {s}</div>
        ))}
      </div>
      {/* 영수증 */}
      <div style={{ position: 'absolute', left: 72, top: 500, width: 560, padding: '22px 28px 96px', background: '#fff', borderRadius: 6, boxShadow: '0 20px 40px -26px rgba(31,27,22,.6)', fontSize: 22,
        opacity: fade(t, at[3]), clipPath: `inset(0 0 ${100 - interpolate(t, [at[3], at[3] + 2.6], [8, 100])}% 0)`, backgroundImage: 'repeating-linear-gradient(0deg, transparent 0 39px, rgba(0,0,0,.035) 39px 40px)' }}>
        <div style={{ textAlign: 'center', fontWeight: 800, fontSize: 24, letterSpacing: 2, borderBottom: `2px dashed ${C.line}`, paddingBottom: 10 }}>발송 미리보기</div>
        {RECEIPT.map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0' }}><span style={{ color: C.muted }}>{k}</span><b>{v}</b></div>
        ))}
        <div style={{ position: 'absolute', right: 28, bottom: 18, padding: '6px 16px', border: `4px solid ${C.ok}`, borderRadius: 10, color: C.ok, fontWeight: 900, fontSize: 28, transform: `rotate(-10deg) scale(${1.7 - 0.7 * stamp})`, opacity: stamp }}>승인</div>
      </div>
      {/* 휴대폰 */}
      <div style={{ position: 'absolute', left: 900, top: 160, width: 400, height: 760, borderRadius: 54, background: '#15151a', padding: 16, boxShadow: '0 40px 80px -40px rgba(0,0,0,.7)', opacity: fade(t, 0.3) }}>
        <div style={{ position: 'absolute', inset: 16, borderRadius: 40, background: '#f2f3f7', overflow: 'hidden' }}>
          <div style={{ height: 90, background: '#fff', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 14, fontSize: 21, fontWeight: 700, borderBottom: '1px solid #e2e4ea' }}>학교 알림</div>
          <div style={{ margin: '24px 18px', padding: '16px 18px', borderRadius: '20px 20px 20px 6px', background: '#fff', fontSize: 21, lineHeight: 1.55, color: '#222', minHeight: 100, opacity: fade(t, at[2] + 2), wordBreak: 'keep-all', boxShadow: '0 4px 10px -6px rgba(0,0,0,.2)' }}>
            {typed(t, MSG, at[2] + 2.2, 22)}
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 40, textAlign: 'center', fontSize: 22, fontWeight: 800, color: t > sent ? C.ok : '#b26a00' }}>
            {t > sent ? '✓ 28명에게 발송됨' : t > at[3] ? '⏸ 승인 기다리는 중' : ''}
          </div>
        </div>
      </div>
      {/* 오른쪽 메모 */}
      <div style={{ position: 'absolute', left: 1380, top: 300, width: 460, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {[['개인정보', '학부모 연락처를 다루는 스킬 — 필요한 만큼만'], ['자동 로그인', '데스크에 저장한 리로스쿨 계정'], ['보낸 내역', '발송 뒤 보낸 내역으로 다시 확인']].map(([h, s], i) => (
          <div key={h} style={{ padding: '18px 22px', borderRadius: 14, background: C.panel, border: `1.5px solid ${C.line}`, opacity: fade(t, [at[3] + 0.8, at[4], sent + 0.6][i]) }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: i === 0 ? C.warn : C.gold }}>{h}</div>
            <div style={{ marginTop: 4, fontSize: 21, color: C.muted, lineHeight: 1.45, wordBreak: 'keep-all' }}>{s}</div>
          </div>
        ))}
      </div>
      <Recon style={{ left: 900, top: 930 }} />
      <SceneSubs items={subs} />
    </>
  );
}

export default function S07() {
  return (
    <Scene duration={end}>
      <Stage />
    </Scene>
  );
}
