import type { CSSProperties } from 'react';
import Build from '../../../../src/deck/Build';
import { useSceneTime, interpolate } from '../../../../src/scene';
import { abs, C, ASPECT, SVG, STILL, COLLAB, HIGGS, kick, small, mono, solid, Header, Chip, Note, Arrow, SceneCard, CopyBox, Clapper, Frame916, LinkButton, useClicks } from './shared';
import { CARD_A, CARD_B } from './cards';

const show = (on: boolean, delay = 0): CSSProperties => ({ opacity: on ? 1 : 0, transition: `opacity .5s ${delay}s` });

/* ═══════════════════ S15 — AI가 초안을 쓰고, 사람이 고친다 (scene · 클릭 2) ═══════════════════ */
/* 조수 초안 — 카드에 없는 구절 두 개(bad)가 일부러 섞여 있다 */
const DRAFT: { s: string; bad?: string }[] = [
  { s: 'Medium shot at eye level, static camera, ' },
  { s: 'slow zoom in on the girl', bad: '고정 숏인데 zoom?' },
  { s: ". A high-school girl in a navy hoodie stands under the school gate's awning. She holds out her palm, then a yellow umbrella covers her head" },
  { s: ' while dramatic thunder flashes across the sky', bad: '카드에 없음' },
  { s: '. She looks to her right. Rainy late afternoon, wet asphalt, soft natural light.' },
];
export function ProofScene() {
  const t = useSceneTime();
  const c = useClicks(2);
  const CPS = 70;
  let budget = Math.floor(Math.max(0, t - 0.4) * CPS);
  return (
    <>
      <Header kicker="장면 감독 조수 = 챗봇" title="AI가 초안을 쓰고, 사람이 고친다" />
      {/* 왼쪽 역할 표 */}
      <div style={{ ...abs(120, 250, 380), display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ ...solid, padding: '18px 20px' }}>
          <div style={{ ...kick }}>조수 (챗봇)</div>
          <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>초안 · 질문 · 번역</div>
        </div>
        <div style={{ ...solid, padding: '18px 20px', borderLeft: `8px solid ${C.red}` }}>
          <div style={{ ...kick }}>나</div>
          <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>카드와 대조 · 고치기 · 승인</div>
        </div>
        <div style={{ ...small, fontSize: 17, marginTop: 6 }}>근거: OpenMontage의 사람 승인 역 · 영상 설명 연구에서 'AI 초안 → 전문가 검토'가 가장 정확했다 (Cen 외, CVPR 2026)</div>
      </div>
      {/* 가운데 교정지 */}
      <div style={{ ...abs(560, 200, 900, 780), background: C.paper, borderRadius: 6, boxShadow: '0 30px 60px -34px rgba(29,27,34,.6)', border: '1.5px solid rgba(29,27,34,.15)' }}>
        <div style={{ ...abs(48, 34), ...kick }}>프롬프트 초안 — 조수가 씀</div>
        <svg width="900" height="780" style={{ position: 'absolute', inset: 0 }} aria-hidden>
          <path d="M36 0 V780" stroke={C.red} strokeWidth="1.5" opacity=".25" />
        </svg>
        <div style={{ ...abs(48, 80, 800), ...mono, fontSize: 27, lineHeight: 1.75, color: C.ink, wordBreak: 'keep-all' }}>
          {DRAFT.map((d, i) => {
            const vis = d.s.slice(0, Math.max(0, budget));
            budget -= d.s.length;
            if (!vis) return null;
            const struck = !!d.bad && c >= 1;
            return (
              <span key={i}>
                <span style={{ backgroundImage: `linear-gradient(${C.red}, ${C.red})`, backgroundRepeat: 'no-repeat', backgroundPosition: '0 58%', backgroundSize: `${struck ? 100 : 0}% 4px`, transition: 'background-size .7s', color: struck ? C.mute : C.ink }}>{vis}</span>
                {d.bad && (
                  <span style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 900, color: C.red, marginLeft: 8, whiteSpace: 'nowrap', ...show(struck, 0.5) }}>↖ {d.bad}</span>
                )}
              </span>
            );
          })}
          {budget < 0 && <span style={{ display: 'inline-block', width: 14, height: 30, background: C.ink, verticalAlign: 'middle', opacity: Math.floor(t * 2) % 2 ? 1 : 0.2 }} />}
        </div>
        {/* 클릭 2: 승인 도장 */}
        <img src={`${SVG}/rubber-stamp.svg`} alt="" aria-hidden style={{ ...abs(780, 430, 110), transform: `translateY(${c >= 2 ? 0 : -240}px) rotate(${c >= 2 ? 12 : 0}deg)`, opacity: c >= 2 ? 1 : 0, transition: 'transform .45s cubic-bezier(.5,0,.8,1), opacity .2s' }} />
        <div style={{ ...abs(640, 600, 200, 130), border: `6px solid ${C.red}`, borderRadius: 14, color: C.red, display: 'grid', placeItems: 'center', fontSize: 56, fontWeight: 900, transform: `rotate(-9deg) scale(${c >= 2 ? 1 : 1.4})`, opacity: c >= 2 ? 0.9 : 0, transition: 'transform .3s .4s, opacity .2s .4s', background: 'rgba(255,253,248,.5)' }}>승인</div>
      </div>
      <div style={{ ...abs(1500, 300, 320), ...show(c >= 1) }}>
        <Note color={C.red}>카드와 한 줄씩 대조하면 끼어든 장면을 생성 전에 걸러낸다</Note>
      </div>
    </>
  );
}

/* ═══════════════════ S16 — 조수에게 보내는 부탁 문장 (static) ═══════════════════ */
export function AskCardSlide() {
  const X = 120;
  const Y = 200;
  const LH = 22 * 1.55;
  const lineY = (i: number) => Y + 52 + 16 + (i + 0.5) * LH;
  const notes = [
    { n: '①', s: '빈칸은 질문부터', d: '조수가 마음대로 채우면 내 장면이 아니라 평균적인 장면이 된다', line: 1 },
    { n: '②', s: '조립 순서를 정해 준다', d: '숏 크기·카메라 → 피사체 → 동작 → 배경·빛 → 스타일', line: 3 },
    { n: '③', s: '없는 것은 더하지 않는다', d: '카드에 없는 사건·사람, 화면 속 글자는 금지', line: 4 },
    { n: '④', s: '칸 ↔ 문장 표를 받는다', d: '어느 칸이 어느 문장이 됐는지 — 내가 대조하기 쉽게', line: 5 },
  ];
  return (
    <>
      <Header kicker="카드 B · 복사해서 그대로 쓴다" title="조수에게 보내는 부탁 문장" />
      <CopyBox title="카드 B — 장면 감독 조수에게" text={CARD_B} w={1240} size={22} style={{ ...abs(X, Y) }} />
      {/* 줄 옆 번호 */}
      {notes.map((n) => (
        <div key={n.n + 'b'} style={{ ...abs(X + 1250, lineY(n.line) - 20, 44, 40), borderRadius: 999, background: C.red, color: C.white, display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 900 }}>{n.n}</div>
      ))}
      {/* 아래 해설 2×2 */}
      <div style={{ ...abs(X, 650, 1680), display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {notes.map((n) => (
          <div key={n.n} style={{ ...solid, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'baseline', borderLeft: `8px solid ${C.red}` }}>
            <b style={{ fontSize: 28, color: C.red }}>{n.n}</b>
            <div>
              <div style={{ fontSize: 26, fontWeight: 900 }}>{n.s}</div>
              <div style={{ ...small, fontSize: 19, marginTop: 4, color: C.ink }}>{n.d}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ═══════════════════ S19 — 실습: 내 장면 한 숏 만들기 (activity · 클릭 6) ═══════════════════ */
const STEPS = [
  { t: '비트 하나 고르기', d: '내 쇼츠 아이디어에서 (없으면 「비 오는 하굣길」 ④ 착지)' },
  { t: '장면 카드 직접 쓰기', d: '조수 없이 먼저 — 카드 A 복사' },
  { t: '조수에게 질문 받기', d: '카드 B + 내 카드를 챗봇에' },
  { t: '점검 다섯 줄로 확정', d: '카드에 없는 것·움직임 단어·글자 확인' },
  { t: 'Higgsfield에서 생성 한 번', d: '모델·길이·비율 확인 후 GENERATE 한 번' },
  { t: '기다리는 동안: 짝이 그려 보기', d: '프롬프트만 보고 시작·끝 화면 스케치 → 내 카드와 비교' },
];
export function PracticeSlide() {
  const c = useClicks(6);
  return (
    <>
      <Header kicker="직접 해 보기 · 노트 공간에 기록" title="실습: 내 장면 한 숏 만들기" />
      <div style={{ ...abs(120, 200, 820), display: 'flex', flexDirection: 'column', gap: 12 }}>
        {STEPS.map((s, i) => {
          const on = c === i + 1;
          const done = c > i + 1;
          return (
            <div key={s.t} style={{ display: 'flex', gap: 18, alignItems: 'center', padding: '14px 18px', borderRadius: 14, background: on ? C.card : 'transparent', border: on ? `3px solid ${C.slate}` : '3px solid transparent', boxShadow: on ? '0 18px 40px -26px rgba(29,27,34,.5)' : 'none', opacity: c === 0 || on || done ? 1 : 0.5, transition: 'all .35s' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', fontSize: 28, fontWeight: 900, background: done ? '#2f8f7f' : on ? C.slate : 'rgba(29,27,34,.08)', color: done || on ? C.white : C.ink }}>{done ? '✓' : i + 1}</div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900 }}>{s.t}</div>
                <div style={{ ...small, fontSize: 19 }}>{s.d}</div>
              </div>
            </div>
          );
        })}
      </div>
      <CopyBox title="카드 A — 장면 카드 양식" text={CARD_A} w={820} size={18} style={{ ...abs(980, 200) }} />
      <div style={{ ...abs(980, 560, 820), display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        <LinkButton href={COLLAB}>노트 공간 열기 ↗</LinkButton>
        <LinkButton href={HIGGS} color="#3d4a12">Higgsfield 열기 ↗</LinkButton>
        <Chip size={20}>챗봇: 선생님이 정한 서비스</Chip>
      </div>
      <div style={{ ...abs(980, 650, 820) }}>
        <Note>크레딧이 모자라면 짝끼리 한 편만 생성하고, 다른 사람은 ⑥ '그려 보기'를 맡는다</Note>
      </div>
      <div style={{ ...abs(1380, 760, 420), ...show(c >= 6) }}>
        <img src={`${SVG}/sketchbook-pencil.svg`} alt="스케치북" style={{ width: 300 }} />
        <div style={{ ...small, color: C.ink, fontWeight: 800, marginTop: -6 }}>본 적 없는 사람 시험 — 진짜로</div>
      </div>
    </>
  );
}

/* ═══════════════════ S20 — 결과를 카드와 대조하기 (build 4) ═══════════════════ */
export function CompareSlide() {
  const c = useClicks(4);
  const marks = c >= 2 ? { subject: '○', motion: '△', scene: '○', space: '✕', camera: '○' } : {};
  return (
    <>
      <Header kicker="결과가 나오면" title="결과를 카드와 대조하기" />
      <div style={{ ...abs(120, 210) }}>
        <Frame916 h={620} label="내 결과">
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'repeating-linear-gradient(135deg, #e4e7ea 0 18px, #dadee2 18px 36px)' }}>
            <div style={{ ...small, color: C.ink, fontWeight: 800, textAlign: 'center' }}>내가 생성한<br />영상을 여기서<br />다시 본다</div>
          </div>
        </Frame916>
      </div>
      <div style={{ ...abs(560, 200, 1240) }}>
        <div style={{ padding: '14px 18px', borderRadius: 12, border: `3px solid ${c >= 1 ? C.slate : 'transparent'}`, transition: 'border-color .4s' }}>
          <div style={{ ...kick }}>먼저 볼 것</div>
          <div style={{ fontSize: 30, fontWeight: 900, marginTop: 4 }}>숏 의도가 보이나? — 「혼자인 줄 알았는데, 우산이 왔다」</div>
        </div>
        <SceneCard w={1240} size={21} rowGap={8} keys={['subject', 'motion', 'scene', 'space', 'camera']} values={{ subject: '여학생 · 노란 우산', motion: '비 확인 → 우산이 덮음 → 오른쪽을 봄', scene: '비 오는 오후 · 교문 처마', space: '왼쪽 1/3 · 미디엄 숏', camera: '눈높이 고정 숏' }} marks={c >= 2 ? marks : { subject: '', motion: '', scene: '', space: '', camera: '' }} style={{ marginTop: 16 }} />
        <div style={{ ...small, fontSize: 18, marginTop: 8 }}>○ 반영 · △ 일부 · ✕ 안 됨 (예시 표시)</div>
      </div>
      <Build at={3} style={{ ...abs(560, 800, 1240) }}>
        <div style={{ ...solid, padding: '16px 22px', borderLeft: `8px solid ${ASPECT.space.color}` }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>다음 생성에서는 ✕ 칸 하나만 고친다</div>
          <div style={{ ...mono, fontSize: 19, marginTop: 8, wordBreak: 'keep-all' }}>
            <s style={{ color: C.mute }}>in the left third of the frame</s> → standing at the far left edge, empty space on the right
          </div>
        </div>
      </Build>
      <Build at={4} style={{ ...abs(120, 880, 400) }}>
        <Note>같은 문장도 결과는 매번 다를 수 있다 — 한 번으로 단정하지 않기</Note>
      </Build>
    </>
  );
}

/* ═══════════════════ S21 — 한 장의 그림에서 한 장면으로 (static) ═══════════════════ */
export function ClosingSlide() {
  const t = useSceneTime();
  const sum = [
    ['프레임 · 숏 · 장면', 'AI 생성 한 번 = 숏 하나'],
    ['장면 카드', '숏 의도 + 피사체·동작·배경·공간 구도·카메라 + 영상 밖'],
    ['조수와 나', '조수는 질문과 초안, 나는 대조와 승인'],
    ['다음 시간', '숏 여러 개를 이어 한 장면 — 숏마다 인물 모습 유지하기'],
  ];
  const mini = {
    intent: '도착 — 소년이 처음으로 도시를 본다',
    subject: '검은 후드의 소년 (뒷모습)',
    motion: '물결 위를 세 걸음 → 멈춘다 → 고개를 든다',
    scene: '밤, 잔잔한 바다, 멀리 빛나는 도시',
    space: '와이드 숏, 소년은 아래 중앙 중경',
    camera: '뒤에서 천천히 따라가는 돌리',
  };
  return (
    <>
      <Header kicker="오늘 정리" title="한 장의 그림에서 한 장면으로" />
      <div style={{ ...abs(120, 210, 820, 461), borderRadius: 18, overflow: 'hidden', border: `4px solid ${C.ink}` }}>
        <img src={STILL} alt="심해 위를 걷는 소년 뒷모습 실루엣" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
      {/* 꽂힌 장면 카드 */}
      <div style={{ ...abs(150, 560), transform: 'rotate(-2deg)' }}>
        <div style={{ ...abs(330, -20, 70, 34), background: '#b8b2c4', borderRadius: 6, border: `2px solid ${C.ink}`, zIndex: 2 }} />
        <SceneCard w={760} size={16} rowGap={4} values={mini} keys={['intent', 'subject', 'motion', 'scene', 'space', 'camera']} showEn={false} />
      </div>
      <div style={{ ...abs(1010, 220, 790), display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sum.map(([a, b], i) => (
          <div key={a} style={{ ...solid, padding: '16px 22px', borderLeft: `8px solid ${i === 3 ? C.umbrella : C.slate}` }}>
            <div style={{ fontSize: 27, fontWeight: 900 }}>{a}</div>
            <div style={{ ...small, fontSize: 21, color: C.ink, marginTop: 4 }}>{b}</div>
          </div>
        ))}
      </div>
      <Clapper x={1500} y={740} w={300} angle={interpolate(t, [0.3, 0.6], [-20, 0])}>
        <span style={{ position: 'absolute', left: 24, top: 120, color: C.chalk, fontSize: 30, fontWeight: 900, whiteSpace: 'nowrap' }}>다음: 장면 3 · 숏 2</span>
      </Clapper>
    </>
  );
}
