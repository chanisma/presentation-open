import type { CSSProperties, ReactNode } from 'react';
import { useSceneTime, interpolate, riseIn } from '../../../../src/scene';
import { Pointer, AppWindow, popIn, dimAfter, typed, clickFlash, Caret } from '../../../../src/walkthrough';
import { abs, C, ASPECT, HIGGS, kick, small, mono, Chip, Note, LinkButton } from './shared';
import { CARD_C } from './cards';

/* ── 시연(walkthrough) 2장 — plan.md S17·S18의 「절차 대본」이 원본.
   챗봇 화면은 특정 서비스가 아닌 일반 대화창 목업, 답은 시연용 예시.
   Higgsfield 화면 라벨은 2026-10-29 실제 브라우저로 채집한 것(plan F6). 비율 메뉴 모양과 결과 화면은 예시.
   포인터 좌표(TG)는 measure_pointer.mjs 실측값. */

const ring = (t: number, at: number, color: string = C.slate): CSSProperties => ({ boxShadow: `0 0 0 ${clickFlash(t, at, 0.6) * 9}px color-mix(in srgb, ${color} 40%, transparent)` });
const fadeIn = (t: number, at: number, d = 0.25) => interpolate(t, [at, at + d], [0, 1]);

function WalkHead({ kicker, title }: { kicker: string; title: ReactNode }) {
  return (
    <div style={{ ...abs(110, 36, 1300) }}>
      <div style={kick}>{kicker}</div>
      <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, letterSpacing: '-0.03em', fontSize: 44, margin: '6px 0 0', wordBreak: 'keep-all', color: C.ink }}>{title}</h2>
    </div>
  );
}
function Bubble({ me, children, style }: { me?: boolean; children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ alignSelf: me ? 'flex-end' : 'flex-start', maxWidth: me ? 640 : 860, padding: '12px 18px', borderRadius: 16, borderBottomRightRadius: me ? 4 : 16, borderBottomLeftRadius: me ? 16 : 4, background: me ? '#e7e2f5' : C.card, border: '1.5px solid rgba(29,27,34,.12)', fontSize: 19, lineHeight: 1.5, color: C.ink, wordBreak: 'keep-all', ...style }}>
      {children}
    </div>
  );
}

/* ═══════════════════ S17 — 조수와 함께 프롬프트 다듬기 ═══════════════════ */
const T17 = { PASTE: 1.0, SEND: 2.0, Q: 2.5, ANS: 4.6, SEND2: 6.6, DRAFT: 7.1, NOTE: 10.4, CHK: 11.0, DEL: 13.2, FILL: 13.9, END: 15.4 };
const ANSWER = '친구는 흰 소매와 손만 보여. 카메라는 눈높이.';
const QS = '두 가지만 물어볼게요.\n1) 우산을 든 친구는 화면에 얼마나 보이나요?\n2) 카메라 높이는요? (눈높이 · 낮은 앵글 · 높은 앵글)';
const DRAFT17 = [
  { s: 'Medium shot at eye level, locked-off static camera, shallow depth of field. ' },
  { s: 'A high-school girl in a navy hoodie with a black backpack stands under the school gate awning, left third of the frame. ' },
  { s: 'She holds out her palm; a yellow umbrella held by a hand in a white sleeve slides in from the top and covers her head; she looks to her right. ' },
  { s: 'A gentle wind blows her hair. ', extra: true },
  { s: 'Rainy late afternoon, wet asphalt, soft natural light. No text on screen.' },
];
const TG17 = { /* measure_pointer.mjs 실측 2026-10-29 */
  input: { x: 30.78, y: 83.06 },
  send: { x: 57.6, y: 83.06 },
  extra: { x: 85.82, y: 56.88 },
  chk: { x: 81.2, y: 43.9 },
};
export function ChatWalk() {
  const t = useSceneTime();
  const sent1 = t >= T17.SEND;
  const sent2 = t >= T17.SEND2;
  const ansV = t >= T17.ANS && !sent2 ? typed(t, ANSWER, T17.ANS + 0.15, 16) : '';
  const qV = typed(t, QS, T17.Q, 45);
  const draftChars = Math.max(0, Math.floor((t - T17.DRAFT) * 90));
  let budget = draftChars;
  const front = t >= T17.NOTE;
  const checks = Math.max(0, Math.min(5, Math.floor((t - T17.CHK) / 0.4) + 1));
  const deleted = t >= T17.DEL + 0.3;
  const filled = t >= T17.FILL;
  return (
    <>
      <WalkHead kicker="조수와 함께 · 카드 B + 내 장면 카드" title={<>조수와 함께 프롬프트 다듬기 — <span style={{ color: C.red }}>묻게 하고, 내가 확인한다</span></>} />
      {/* 챗봇 창 */}
      <AppWindow kind="app" title="챗봇 — 새 대화" badge="①" style={{ ...abs(110, 150, 1100, 860), ...popIn(t, 0.05), ...(front ? dimAfter(t, T17.NOTE, 0.6) : {}) }} bodyStyle={{ position: 'relative', flex: 1, background: '#f6f3ec' }}>
        <div style={{ ...abs(30, 20, 1040, 640), display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }}>
          {sent1 && (
            <Bubble me style={{ opacity: fadeIn(t, T17.SEND) }}>
              <div style={{ fontWeight: 800 }}>[카드 B] 너는 짧은 영상의 장면 감독 조수야 …</div>
              <div style={{ ...small, fontSize: 16, marginTop: 4 }}>+ 내 장면 카드 (숏 의도 · 피사체 · 동작 · 배경 · 공간 구도 · 카메라 · 영상 밖)</div>
            </Bubble>
          )}
          {t >= T17.Q && <Bubble><span style={{ whiteSpace: 'pre-wrap' }}>{qV}</span></Bubble>}
          {sent2 && <Bubble me style={{ opacity: fadeIn(t, T17.SEND2) }}>{ANSWER}</Bubble>}
          {t >= T17.DRAFT && (
            <Bubble style={{ ...mono, fontSize: 16 }}>
              {DRAFT17.map((d, i) => {
                const vis = d.s.slice(0, Math.max(0, budget));
                budget -= d.s.length;
                return vis ? <span key={i} style={d.extra ? { background: 'rgba(242,194,48,.35)' } : undefined}>{vis}</span> : null;
              })}
              {budget > 0 && (
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 16, marginTop: 10, display: 'grid', gridTemplateColumns: '120px 1fr', gap: '2px 12px', opacity: fadeIn(t, T17.DRAFT + 6.2) }}>
                  <b>칸</b><b>문장</b>
                  <span>공간 구도·카메라</span><span>1</span>
                  <span>피사체</span><span>2</span>
                  <span>동작</span><span>3</span>
                  <span>배경 · 영상 밖</span><span>5</span>
                </div>
              )}
            </Bubble>
          )}
        </div>
        {/* 입력칸 */}
        <div data-pt="s17-input" style={{ ...abs(30, 680, 900, 60), borderRadius: 14, border: `2px solid ${t >= T17.PASTE && !sent1 ? C.slate : 'rgba(29,27,34,.2)'}`, background: C.card, display: 'flex', alignItems: 'center', padding: '0 18px', fontSize: 19, color: C.ink, overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {!sent1 && t >= T17.PASTE ? <span style={{ fontWeight: 700 }}>[카드 B] 너는 짧은 영상의 장면 감독 조수야 … + 내 장면 카드</span> : ansV ? <>{ansV}<Caret color={C.slate} /></> : <span style={{ color: C.faint }}>메시지 입력</span>}
        </div>
        <span data-pt="s17-send" style={{ ...abs(950, 680, 90, 60), borderRadius: 14, background: C.slate, color: C.white, display: 'grid', placeItems: 'center', fontSize: 20, fontWeight: 800, ...ring(t, T17.SEND), ...(t >= T17.SEND2 - 0.1 ? ring(t, T17.SEND2) : {}) }}>보내기</span>
        {t >= T17.PASTE && t < T17.SEND && <div style={{ ...abs(30, 640), ...riseIn(t, T17.PASTE, 0.3) }}><Chip size={16}>Ctrl + V 로 붙여 넣기</Chip></div>}
      </AppWindow>
      {/* 노트 창 — 내 장면 카드 */}
      <AppWindow kind="browser" url="spacekijun.lovable.app/collab" badge="②" style={{ ...abs(1240, front ? 170 : 230, front ? 640 : 580, front ? 820 : 640), zIndex: front ? 5 : 1, transition: 'all .5s', boxShadow: front ? '0 40px 80px -40px rgba(0,0,0,.6)' : undefined }} bodyStyle={{ position: 'relative', flex: 1, padding: '16px 20px', overflow: 'hidden' }}>
        <div style={{ fontSize: 20, fontWeight: 900 }}>내 장면 카드</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10, fontSize: 15, lineHeight: 1.4 }}>
          {[
            ['subject', <>남색 후드티에 검은 책가방을 멘 여학생 · 노란 우산 {filled ? <mark style={{ background: 'rgba(242,194,48,.5)' }}>(우산을 든 친구는 흰 소매와 손만 보인다)</mark> : <span style={{ color: C.red, fontWeight: 800 }}>?</span>}</>],
            ['motion', '비 확인 → 우산이 위에서 덮음 → 오른쪽을 봄'],
            ['scene', '비 오는 늦은 오후 · 교문 처마 · 젖은 아스팔트'],
            ['camera', <>{filled ? <mark style={{ background: 'rgba(242,194,48,.5)' }}>눈높이, </mark> : <span style={{ color: C.red, fontWeight: 800 }}>? </span>}삼각대 고정 숏, 얕은 심도</>],
          ].map(([k, v]) => (
            <div key={k as string} style={{ padding: '6px 10px', borderRadius: 8, borderLeft: `5px solid ${ASPECT[k as 'subject'].color}`, background: `color-mix(in srgb, ${ASPECT[k as 'subject'].color} 10%, ${C.card})` }}>
              <b>{ASPECT[k as 'subject'].ko}</b> {v}
            </div>
          ))}
        </div>
        {front && (
          <div style={{ marginTop: 14, opacity: fadeIn(t, T17.NOTE + 0.3) }}>
            <div style={{ fontSize: 17, fontWeight: 900 }}>점검 다섯 줄 (카드 C)</div>
            {CARD_C.map((line, i) => (
              <div key={line} data-pt={i === 0 ? 's17-chk' : undefined} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 15, marginTop: 5, lineHeight: 1.35 }}>
                <span style={{ width: 20, height: 20, flexShrink: 0, borderRadius: 4, border: `2px solid ${C.ink}`, background: checks > i ? '#2f8f7f' : C.card, color: C.white, display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 900 }}>{checks > i ? '✓' : ''}</span>
                <span>{line}</span>
              </div>
            ))}
            <div style={{ marginTop: 12, ...mono, fontSize: 13.5, lineHeight: 1.45, padding: '8px 10px', borderRadius: 8, background: 'rgba(29,27,34,.05)' }}>
              확정본: … she looks to her right.{' '}
              <span data-pt="s17-extra" style={{ textDecoration: deleted ? 'line-through' : 'none', color: deleted ? C.red : C.ink, background: 'rgba(242,194,48,.35)', ...ring(t, T17.DEL, C.red) }}>A gentle wind blows her hair.</span> Rainy late afternoon …
            </div>
            {deleted && <div style={{ ...small, fontSize: 14, color: C.red, fontWeight: 800, marginTop: 4 }}>카드에 없는 구절 → 지움</div>}
          </div>
        )}
      </AppWindow>
      {t >= T17.Q + 0.4 && t < T17.NOTE && (
        <div style={{ ...abs(1240, 890, 580), ...riseIn(t, T17.Q + 0.4) }}>
          <Note color={C.red}>좋은 조수는 바로 쓰지 않고, 비어 있는 두 칸(?)을 묻는다</Note>
        </div>
      )}
      <Pointer
        timelineEnd={T17.END}
        path={[
          { t: 0.5, x: 40, y: 70 },
          { t: T17.PASTE, x: TG17.input.x, y: TG17.input.y, click: true, label: '붙여 넣기' },
          { t: T17.SEND, x: TG17.send.x, y: TG17.send.y, click: true, label: '보내기' },
          { t: T17.ANS, x: TG17.input.x, y: TG17.input.y, click: true, label: '답하기' },
          { t: T17.ANS + 0.15, x: TG17.input.x, y: TG17.input.y, hide: true },
          { t: T17.SEND2, x: TG17.send.x, y: TG17.send.y, click: true, label: '보내기' },
          { t: T17.CHK, x: TG17.chk.x, y: TG17.chk.y, click: true, label: '점검' },
          { t: T17.DEL, x: TG17.extra.x, y: TG17.extra.y, click: true, label: '카드에 없는 구절' },
        ]}
      />
    </>
  );
}

/* ═══════════════════ S18 — Higgsfield에서 한 숏 생성하기 ═══════════════════ */
const T18 = { URL: 0.3, PAGE: 1.3, INPUT: 2.0, MODEL: 4.4, MODEL_OK: 5.4, RATIO: 6.2, RATIO_OK: 7.0, GEN: 8.0, WAIT: 8.3, DONE: 10.6, END: 12.4 };
const PROMPT_SHORT = 'Medium shot at eye level, locked-off static camera on a tripod, shallow depth of field focused on the girl. A high-school girl in a navy hoodie with a black backpack stands under the school gate\'s awning, in the left third of the frame. First, she holds out her palm …';
const MODELS = ['Seedance 2.0', 'Kling 3.0', 'Veo 3.1', 'Wan 2.7', 'Sora 2'];
const RATIOS = ['Auto', '9:16', '16:9', '1:1'];
const TG18 = { /* measure_pointer.mjs 실측 2026-10-29 */
  input: { x: 37.08, y: 72.59 },
  model: { x: 20.51, y: 78.7 },
  modelOk: { x: 23.49, y: 47.31 },
  ratio: { x: 32.35, y: 78.7 },
  ratioOk: { x: 30, y: 58.33 },
  gen: { x: 61.82, y: 74.91 },
};
const LIME = '#d4f72a';
const DARK = '#111214';
function HChip({ icon, label, pt, active, t, at }: { icon: ReactNode; label: string; pt?: string; active?: boolean; t: number; at?: number }) {
  return (
    <span data-pt={pt} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: active ? '#2b2d31' : '#1e2023', border: `1.5px solid ${active ? LIME : '#2e3035'}`, color: '#e9eaec', fontSize: 17, fontWeight: 700, whiteSpace: 'nowrap', ...(at !== undefined ? ring(t, at, LIME) : {}) }}>
      <span style={{ opacity: 0.8 }}>{icon}</span>
      {label}
    </span>
  );
}
export function HiggsWalk() {
  const t = useSceneTime();
  const prompt = t >= T18.INPUT ? PROMPT_SHORT.slice(0, Math.floor((t - T18.INPUT - 0.15) * 160)) : '';
  const modelOpen = t >= T18.MODEL && t < T18.MODEL_OK + 0.2;
  const ratioOpen = t >= T18.RATIO && t < T18.RATIO_OK + 0.2;
  const ratio = t >= T18.RATIO_OK ? '9:16' : 'Auto';
  const waiting = t >= T18.WAIT && t < T18.DONE;
  const done = t >= T18.DONE;
  const turn = (t * 360) % 360;
  return (
    <>
      <WalkHead kicker="Higgsfield · 영상 생성 화면" title={<>Higgsfield에서 한 숏 생성하기 — <span style={{ color: '#5a6b0a' }}>GENERATE는 한 번만</span></>} />
      <AppWindow kind="browser" url={typed(t, 'higgsfield.ai/create/video', T18.URL, 18) || ' '} badge="①" style={{ ...abs(110, 150, 1340, 860), ...popIn(t, 0.05) }} bodyStyle={{ position: 'relative', flex: 1, background: DARK, overflow: 'hidden' }}>
        {t >= T18.PAGE && (
          <div style={{ position: 'absolute', inset: 0, opacity: fadeIn(t, T18.PAGE) }}>
            {/* 상단 메뉴 줄 */}
            <div style={{ ...abs(0, 0, 1340, 54), display: 'flex', alignItems: 'center', gap: 26, padding: '0 24px', borderBottom: '1px solid #222', color: '#9a9ca2', fontSize: 16, fontWeight: 700 }}>
              <span style={{ width: 26, height: 26, borderRadius: 8, background: '#e9eaec' }} />
              <span>Explore</span><span>Image</span><span style={{ color: '#fff' }}>Video</span><span>Audio</span>
              <span style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: 8, background: '#1e2023', color: '#e9eaec' }}>내 계정 · 로그인됨</span>
            </div>
            <div style={{ ...abs(0, 120, 1340), textAlign: 'center', color: '#fff', fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 46, letterSpacing: '-0.01em' }}>AI VIDEO GENERATOR</div>
            {!done && (
              <div style={{ ...abs(0, 186, 1340), textAlign: 'center', color: '#9a9ca2', fontSize: 18 }}>
                {waiting ? '' : 'Every top model, one workspace.'}
              </div>
            )}
            {/* 생성 대기 */}
            {waiting && (
              <div style={{ ...abs(470, 230, 400, 220), borderRadius: 16, background: '#1a1c1f', border: '1px solid #2e3035', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: '#e9eaec', opacity: fadeIn(t, T18.WAIT) }}>
                <svg width="54" height="54" viewBox="0 0 54 54" aria-hidden>
                  <circle cx="27" cy="27" r="22" fill="none" stroke="#2e3035" strokeWidth="6" />
                  <path d={`M27 5 A22 22 0 0 1 ${27 + 22 * Math.sin((turn * Math.PI) / 180 + 1.2)} ${27 - 22 * Math.cos((turn * Math.PI) / 180 + 1.2)}`} fill="none" stroke={LIME} strokeWidth="6" strokeLinecap="round" />
                </svg>
                <div style={{ fontSize: 20, fontWeight: 800 }}>생성 중 … 대기열</div>
                <div style={{ fontSize: 15, color: '#9a9ca2' }}>몇 분 걸릴 수 있다 (시연에서는 시간을 줄였다)</div>
              </div>
            )}
            {/* 결과 자리 */}
            {done && (
              <div style={{ ...abs(380, 200, 600, 330), display: 'flex', gap: 24, opacity: fadeIn(t, T18.DONE) }}>
                <div style={{ width: 180, height: 320, borderRadius: 12, border: `2px dashed ${LIME}`, background: 'repeating-linear-gradient(135deg, #1e2023 0 14px, #24262a 14px 28px)', display: 'grid', placeItems: 'center', color: '#e9eaec', fontSize: 15, fontWeight: 800, textAlign: 'center' }}>
                  <div><div style={{ fontSize: 40 }}>▶</div>결과 자리<br />(9:16)</div>
                </div>
                <div style={{ flex: 1, color: '#c9cbd0', fontSize: 15, lineHeight: 1.5 }}>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: 17 }}>Seedance 2.0 · 8s · 9:16</div>
                  <div style={{ ...mono, fontSize: 13, marginTop: 8, color: '#9a9ca2' }}>{PROMPT_SHORT.slice(0, 150)}…</div>
                  <div style={{ marginTop: 12, color: LIME, fontWeight: 800 }}>결과 옆에 프롬프트가 남는지 확인</div>
                </div>
              </div>
            )}
            {/* 입력 막대 (실제 화면 라벨) */}
            <div style={{ ...abs(170, 540, 1000, 150), borderRadius: 18, background: '#1a1c1f', border: '1.5px solid #2e3035', boxShadow: '0 20px 40px -20px rgba(0,0,0,.8)' }}>
              <span style={{ ...abs(20, 22, 34, 34), borderRadius: 10, border: '1.5px solid #3a3d43', color: '#c9cbd0', display: 'grid', placeItems: 'center', fontSize: 22 }}>+</span>
              <div data-pt="s18-input" style={{ ...abs(70, 18, 720, 64), color: prompt ? '#e9eaec' : '#8b8e95', fontSize: prompt ? 14.5 : 18, lineHeight: 1.45, overflow: 'hidden', ...(prompt ? mono : {}) }}>
                {prompt || 'Describe any visual idea. We will generate a video.'}
              </div>
              <div style={{ ...abs(20, 96), display: 'flex', gap: 10 }}>
                <HChip pt="s18-model" icon="▮▮" label="Seedance 2.0" active={modelOpen} t={t} at={T18.MODEL} />
                <HChip icon="◷" label="8s" t={t} />
                <HChip pt="s18-ratio" icon="⛶" label={ratio} active={ratioOpen || t >= T18.RATIO_OK} t={t} at={T18.RATIO} />
                <HChip icon="🔈" label="On" t={t} />
              </div>
              <span data-pt="s18-gen" style={{ ...abs(830, 22, 150, 106), borderRadius: 14, background: LIME, color: DARK, display: 'grid', placeItems: 'center', fontSize: 18, fontWeight: 900, letterSpacing: '0.04em', ...ring(t, T18.GEN, LIME) }}>GENERATE</span>
            </div>
            {/* 모델 목록 */}
            {modelOpen && (
              <div style={{ ...abs(190, 290, 300, 250), borderRadius: 12, background: '#1e2023', border: '1px solid #3a3d43', padding: 8, opacity: fadeIn(t, T18.MODEL, 0.15) }}>
                {MODELS.map((m, i) => (
                  <div key={m} data-pt={i === 0 ? 's18-model-ok' : undefined} style={{ padding: '8px 12px', borderRadius: 8, color: '#e9eaec', fontSize: 17, fontWeight: 700, background: i === 0 ? '#2b2d31' : 'transparent', display: 'flex', justifyContent: 'space-between' }}>
                    {m}{i === 0 && <span style={{ color: LIME }}>✓</span>}
                  </div>
                ))}
              </div>
            )}
            {ratioOpen && (
              <div style={{ ...abs(380, 380, 170, 170), borderRadius: 12, background: '#1e2023', border: '1px solid #3a3d43', padding: 8, opacity: fadeIn(t, T18.RATIO, 0.15) }}>
                {RATIOS.map((r) => (
                  <div key={r} data-pt={r === '9:16' ? 's18-ratio-ok' : undefined} style={{ padding: '6px 12px', borderRadius: 8, color: '#e9eaec', fontSize: 17, fontWeight: 700, background: r === '9:16' ? '#2b2d31' : 'transparent' }}>{r}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </AppWindow>
      {/* 오른쪽 띠 */}
      <div style={{ ...abs(1480, 160, 340), display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Chip size={20} color={t >= T18.INPUT ? C.slate : C.faint} strong={t >= T18.INPUT}>① 확정본 붙여 넣기</Chip>
        <Chip size={20} color={t >= T18.MODEL ? C.slate : C.faint} strong={t >= T18.MODEL}>② 모델은 선생님과 같게</Chip>
        <Chip size={20} color={t >= T18.RATIO ? C.slate : C.faint} strong={t >= T18.RATIO}>③ 비율 9:16 · 길이 짧게</Chip>
        <Chip size={20} color={t >= T18.GEN ? C.slate : C.faint} strong={t >= T18.GEN}>④ GENERATE 한 번</Chip>
        <Chip size={20} color={done ? C.slate : C.faint} strong={done}>⑤ 결과와 프롬프트 확인</Chip>
        <div style={{ marginTop: 10 }}>
          <Note>비율 메뉴 모양과 결과 화면은 예시 — 로그인한 실제 화면과 다를 수 있다</Note>
        </div>
        {t >= T18.GEN && (
          <div style={{ ...riseIn(t, T18.GEN + 0.2) }}>
            <Note color={C.red}>여러 번 누르면 크레딧만 줄어든다 — 차감량 확인</Note>
          </div>
        )}
        <div style={{ marginTop: 8 }}>
          <LinkButton href={HIGGS} size={19}>higgsfield.ai ↗</LinkButton>
        </div>
      </div>
      <Pointer
        timelineEnd={T18.END}
        path={[
          { t: 1.5, x: 50, y: 40 },
          { t: T18.INPUT, x: TG18.input.x, y: TG18.input.y, click: true, label: 'Prompt 칸' },
          { t: T18.INPUT + 0.15, x: TG18.input.x, y: TG18.input.y, hide: true },
          { t: T18.MODEL, x: TG18.model.x, y: TG18.model.y, click: true, label: '모델' },
          { t: T18.MODEL_OK, x: TG18.modelOk.x, y: TG18.modelOk.y, click: true, label: 'Seedance 2.0' },
          { t: T18.RATIO, x: TG18.ratio.x, y: TG18.ratio.y, click: true, label: '비율' },
          { t: T18.RATIO_OK, x: TG18.ratioOk.x, y: TG18.ratioOk.y, click: true, label: '9:16' },
          { t: T18.GEN, x: TG18.gen.x, y: TG18.gen.y, click: true, label: 'GENERATE' },
        ]}
      />
    </>
  );
}

