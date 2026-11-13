import { useState, type CSSProperties, type ReactNode } from 'react';
import Build from '../../../../src/deck/Build';
import { useDeck } from '../../../../src/deck/DeckContext';
import { useSceneTime, interpolate, spring, riseIn } from '../../../../src/scene';
import { Pointer, AppWindow, popIn, dimAfter, typed, typedDoneAt, clickFlash, Caret } from '../../../../src/walkthrough';
import { abs, BASE, C, kick, h2, h3, small, mono, solid, Header, Chip, LinkButton, Pet } from './shared';
import { PROMPT } from './prompt';

const COLLAB = 'https://spacekijun.lovable.app/collab/28fa5003-3201-4d6f-aea9-eda51c1f6489';
const DECK20 = 'https://2026kijunit.netlify.app/index.html?deck=vibe-web-blueprint#20';

/* ═══════════════════ S18 — 시연: Codex가 나를 인터뷰한다 (walkthrough) ═══════════════════ */
const tl: CSSProperties = { ...mono, fontSize: 19, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'keep-all' };
const T = {
  CODEX: 0.6,
  HEAD: 1.4,
  COPY: 2.2,
  FOCUS: 3.0,
  PASTE: 3.3,
  SEND1: 3.9,
  AI1: 4.3,
  INTRO: 4.7,
  Q1: 7.0,
  A1: 7.6,
  SUM: 8.2,
  A2: 8.8,
  FF: 9.4,
  Q4: 9.9,
  A4: 10.4,
  EXPL: 11.2,
  A5: 11.9,
  PREV: 12.4,
  A6: 12.9,
  SAVED: 13.5,
  EXPLORER: 13.8,
  DBL1: 14.6,
  DBL2: 14.8,
  NOTE: 15.0,
};
const INTRO = '우리 반 친구들이 같이 키우는 다마고찌 게임을 만들고 싶어';
const SENT = {
  intro: typedDoneAt(INTRO, T.INTRO, 16) + 0.3,
};
type Entry = { at: number; who: 'me' | 'ai' | 'sys' | 'ff'; body: ReactNode };
const ENTRIES: Entry[] = [
  { at: T.SEND1, who: 'me', body: `[Pasted Content ${PROMPT.length} chars]` },
  { at: T.AI1, who: 'ai', body: '무엇을 만들고 싶은지 한두 줄로 알려 줘.' },
  { at: SENT.intro, who: 'me', body: INTRO },
  { at: T.Q1, who: 'ai', body: '좋아요. ① 목적·사용자·문제부터 할게요.\n이 게임을 주로 쓰는 사람은 누구인가요?\n  1) 나 혼자 — 내 습관 관리용\n  2) 우리 반 친구들 — 같이 키우고 서로 본다\n  3) 학교 전체 — 누구나 들어온다\n  4) 직접 적기' },
  { at: T.A1 + 0.35, who: 'me', body: '2' },
  { at: T.SUM, who: 'ai', body: '① 요약\n  - 사용자: 우리 반 친구들\n  - 문제: 플래너·과제를 자꾸 잊는다\n이대로 정할까?' },
  { at: T.A2 + 0.35, who: 'me', body: '응' },
  { at: T.FF, who: 'ff', body: '⏩  ② 기능 목록 · ③ 화면 구성·사용 흐름 진행 …' },
  { at: T.Q4, who: 'ai', body: '④ 데이터·기술 구조예요. 펫 정보를 다른 친구도 볼 수 있어야 하나요?\n  1) 나만 보면 됨 (브라우저 저장)\n  2) 친구도 봐야 함 (서버 데이터베이스)\n  3) 모르겠어   4) 직접 적기' },
  { at: T.A4 + 0.5, who: 'me', body: '모르겠어' },
  { at: T.EXPL, who: 'ai', body: '1)은 쉽지만 내 기기에만 남아요. 2)는 친구도 같은 펫을 보지만 로그인과 배포(인터넷에 올려 주소로 열게 하는 일)가 필요해요.\n친구 펫 방문을 나중에 넣고 싶다면 2)를 추천해요. 결정은 당신이 해요.' },
  { at: T.A5 + 0.35, who: 'me', body: '2' },
  { at: T.PREV, who: 'ai', body: '네 칸을 모두 정했어요. 전체 설계도를 보여 드릴게요. (…)\n이대로 설계도.md로 저장할까?' },
  { at: T.A6 + 0.35, who: 'me', body: '응' },
  { at: T.SAVED, who: 'sys', body: '✓ 설계도.md 를 저장했습니다' },
];
/* 컴포저(입력창)에 무엇이 떠 있는지 — 타이핑 국면 */
function composer(t: number): { text: string; typing: boolean } | null {
  const seg = (from: number, text: string, cps: number, send: number) => (t >= from && t < send ? { text: typed(t, text, from, cps), typing: true } : null);
  if (t >= T.PASTE && t < T.SEND1) return { text: `[Pasted Content ${PROMPT.length} chars]`, typing: true };
  return (
    seg(T.INTRO, INTRO, 16, SENT.intro) ||
    seg(T.A1, '2', 8, T.A1 + 0.35) ||
    seg(T.A2, '응', 8, T.A2 + 0.35) ||
    seg(T.A4, '모르겠어', 10, T.A4 + 0.5) ||
    seg(T.A5, '2', 8, T.A5 + 0.35) ||
    seg(T.A6, '응', 8, T.A6 + 0.35)
  );
}
/* 클릭 대상 (씬 %) — measure_pointer.mjs 실측값 (2026-10-20) */
const TG = {
  copy: { x: 90.8, y: 23.43 },
  input: { x: 32.81, y: 87.38 },
  file: { x: 79.69, y: 72.27 },
};
export function InterviewWalk() {
  const t = useSceneTime();
  const copied = t >= T.COPY;
  const comp = composer(t);
  const phase = t >= T.SAVED ? 5 : t >= T.Q4 ? 4 : t >= T.FF ? 3 : t >= T.Q1 ? 1 : 0;
  /* 위에서부터 쌓고, 창이 차면 오래된 줄부터 밀어낸다 (줄 수 어림: 줄바꿈 + 54자마다 한 줄) */
  const lines = (e: Entry) => (typeof e.body === 'string' ? e.body.split('\n').reduce((n, l) => n + Math.max(1, Math.ceil(l.length / 54)), 0) : 1) + 0.4;
  const BUDGET = 22;
  const all = ENTRIES.filter((e) => t >= e.at);
  let used = 0;
  let cut = all.length;
  while (cut > 0 && used + lines(all[cut - 1]) <= BUDGET) used += lines(all[--cut]);
  const shown = all.slice(cut);
  const showHead = cut === 0 && used + (t >= T.HEAD ? 6.4 : 1.4) <= BUDGET;
  return (
    <>
      <div style={{ ...abs(100, 46, 1100) }}>
        <div style={kick}>시연 · Codex CLI</div>
        <h2 style={{ ...h2, fontSize: 44, marginTop: 6 }}>Codex가 <span style={{ color: C.coral }}>나를</span> 인터뷰한다</h2>
      </div>
      {/* ① 프롬프트 장 (학생 노트북의 이 덱 20장) */}
      <AppWindow kind="browser" url="2026kijunit.netlify.app · 20장" badge="①" style={{ ...abs(1220, 170, 620, 250), ...popIn(t, 0.2), ...dimAfter(t, T.FOCUS) }} bodyStyle={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 20, fontWeight: 800 }}>인터뷰 프롬프트</span>
          <span data-pt="s18-copy" style={{ padding: '10px 18px', borderRadius: 999, fontSize: 18, fontWeight: 800, background: copied ? C.ok : C.coral, color: C.deep, boxShadow: `0 0 0 ${clickFlash(t, T.COPY, 0.6) * 8}px color-mix(in srgb, ${C.coral} 45%, transparent)` }}>{copied ? '복사했습니다 ✓' : '프롬프트 복사'}</span>
        </div>
        <div style={{ ...mono, fontSize: 14, lineHeight: 1.55, color: 'var(--fg-muted)', marginTop: 12, whiteSpace: 'pre', overflow: 'hidden' }}>{PROMPT.split('\n').slice(0, 4).join('\n')}</div>
      </AppWindow>
      {/* 설계도 네 칸 진행 */}
      <div style={{ ...abs(1220, 452, 620), ...riseIn(t, 0.4, 0.6) }}>
        <div style={{ ...kick, fontSize: 14 }}>설계도 네 칸 — 지금 묻는 칸</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          {['① 목적', '② 기능', '③ 화면', '④ 데이터'].map((n, i) => {
            const done = phase === 5 || (phase >= 3 && i < 3) || (phase >= 1 && i === 0 && t >= T.A2 + 0.35);
            const now = (phase === 1 && i === 0 && !done) || (phase === 3 && i < 3 && !done) || (phase === 4 && i === 3);
            return <span key={n} style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 12, fontSize: 19, fontWeight: 800, border: `2px solid ${now ? C.coral : done ? C.sky : 'var(--hair)'}`, background: done ? `color-mix(in srgb, ${C.sky} 18%, transparent)` : now ? `color-mix(in srgb, ${C.coral} 16%, transparent)` : 'transparent', color: now ? C.coral : done ? C.ink : 'var(--fg-faint)' }}>{done ? '✓ ' : ''}{n}</span>;
          })}
        </div>
      </div>
      {/* ② 터미널 */}
      <AppWindow kind="terminal" title="PowerShell — vibe" badge="②" style={{ ...abs(100, 170, 1060, 820), ...popIn(t, 0.3), ...dimAfter(t, T.EXPLORER) }} bodyStyle={{ padding: 0, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: '16px 22px', gap: 10 }}>
          {showHead && <div style={{ ...tl, fontWeight: 700, color: C.ink }}>{typed(t, 'codex', T.CODEX, 10)}{t < T.HEAD && t > 0.4 && <Caret color={C.sky} />}</div>}
          {showHead && t >= T.HEAD && (
            <div style={{ ...tl, fontSize: 17, color: 'var(--fg-muted)', lineHeight: 1.45 }}>
              {'╭─────────────────────────────────────────────╮\n│ >_ OpenAI Codex (v0.163.0)                  │\n│ model:     gpt-5.6-sol    /model 로 바꾸기   │\n│ directory: ~\\Documents\\vibe                 │\n╰─────────────────────────────────────────────╯'}
            </div>
          )}
          {shown.map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              {e.who === 'me' && <Chip color={C.coral} solidFill size={15} style={{ marginTop: 2 }}>나</Chip>}
              {e.who === 'ai' && <Chip color={C.sky} size={15} style={{ marginTop: 2 }}>Codex</Chip>}
              <div style={{ ...tl, flex: 1, color: e.who === 'me' ? C.coral : e.who === 'sys' ? C.ok : e.who === 'ff' ? C.gold : C.ink, fontWeight: e.who === 'me' || e.who === 'sys' ? 800 : 500, fontStyle: e.who === 'ff' ? 'italic' : 'normal' }}>{e.body}</div>
            </div>
          ))}
        </div>
        {/* 입력창 */}
        <div data-pt="s18-input" style={{ margin: '0 16px 16px', padding: '14px 18px', borderRadius: 12, border: `1.5px solid ${comp ? C.coral : 'var(--hair)'}`, ...tl, color: comp ? C.coral : 'var(--fg-faint)', fontWeight: comp ? 800 : 400, boxShadow: `0 0 0 ${clickFlash(t, T.FOCUS, 0.5) * 8}px color-mix(in srgb, ${C.coral} 35%, transparent)`, minHeight: 30 }}>
          {comp ? <>{comp.text}<Caret color={C.coral} /></> : t >= T.HEAD ? 'Codex에게 말하기…' : ''}
        </div>
      </AppWindow>
      {/* 키 힌트 */}
      {[{ at: T.PASTE, k: 'Ctrl + V' }, { at: T.SEND1, k: 'Enter' }].map((h) => {
        const o = Math.min(interpolate(t, [h.at, h.at + 0.15], [0, 1]), interpolate(t, [h.at + 0.55, h.at + 0.75], [1, 0]));
        return o > 0 ? <div key={h.k} style={{ ...abs(900, 900), opacity: o }}><span style={{ ...mono, fontSize: 22, fontWeight: 900, padding: '8px 16px', borderRadius: 10, border: `2px solid ${C.gold}`, color: C.gold, background: 'var(--bg)' }}>{h.k}</span></div> : null;
      })}
      {/* ③ 탐색기 */}
      {t >= T.EXPLORER - 0.1 && (
        <AppWindow kind="app" title="vibe — 파일 탐색기" badge="③" style={{ ...abs(1220, 600, 620, 300), ...popIn(t, T.EXPLORER) }} bodyStyle={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {['hello.txt', 'index.html', '설계도.md'].map((f) => {
            const hot = f === '설계도.md';
            return (
              <div key={f} data-pt={hot ? 's18-file' : undefined} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', borderRadius: 8, ...mono, fontSize: 21, fontWeight: hot ? 800 : 500, color: hot ? C.ink : 'var(--fg-muted)', background: hot ? `color-mix(in srgb, ${C.coral} ${12 + clickFlash(t, T.DBL1, 0.3) * 25 + clickFlash(t, T.DBL2, 0.3) * 25}%, transparent)` : 'transparent' }}>
                📄 {f} {hot && <Chip color={C.coral} size={14}>새 파일</Chip>}
              </div>
            );
          })}
        </AppWindow>
      )}
      {t >= T.NOTE - 0.1 && (
        <AppWindow kind="app" title="설계도.md — 메모장" badge="④" style={{ ...abs(1260, 640, 600, 340), ...popIn(t, T.NOTE) }} bodyStyle={{ padding: '14px 20px' }}>
          <div style={{ ...mono, fontSize: 17, lineHeight: 1.6, color: C.ink, whiteSpace: 'pre' }}>
            {'# 우리 반 다마고찌 설계도\n## 1. 목적·사용자·문제\n- 사용자: 우리 반 친구들\n- 문제: 플래너·과제를 자꾸 잊는다\n## 2. 기능 목록 …\n## 4. 데이터·기술 구조\n- 위치: 서버 데이터베이스\n## 5. 아직 정하지 못한 것'}
          </div>
        </AppWindow>
      )}
      <Pointer
        timelineEnd={15.8}
        path={[
          { t: 1.3, x: 70, y: 22 },
          { t: T.COPY, x: TG.copy.x, y: TG.copy.y, click: true, label: '프롬프트 복사' },
          { t: T.FOCUS, x: TG.input.x, y: TG.input.y, click: true, label: '입력창 클릭 → 붙여넣기' },
          { t: T.FOCUS + 0.25, x: TG.input.x, y: TG.input.y, hide: true },
          { t: T.EXPLORER + 0.4, x: TG.file.x, y: TG.file.y },
          { t: T.DBL1, x: TG.file.x, y: TG.file.y, click: true, label: '설계도.md 열기' },
          { t: T.DBL2, x: TG.file.x, y: TG.file.y, click: true },
        ]}
      />
    </>
  );
}

/* ═══════════════════ S19 — 인터뷰를 잘 받는 법 (build 5 · 교정지) ═══════════════════ */
const FIX = [
  { q: '펫 이름은 몇 글자까지 할까요?', bad: '알아서 해 줘', good: '"모르겠어, 장단점 알려 줘"', why: '알아서 하면 빈칸을 다시 추측한다' },
  { q: '첫 버전 필수 기능을 골라 주세요.', bad: '전부 다 필수!', good: '필수는 셋, 나머지는 "나중"', why: '다음 시간에 끝나지 않는다' },
  { q: '화면은 몇 개가 필요할까요?', bad: '그냥 만들어 줘', good: '끝까지 답하고 설계도.md 확인', why: '설계도 없이 코드가 생긴다' },
  { q: '① 요약입니다. 이대로 정할까?', bad: '응 (읽지 않음)', good: '요약 세 줄을 읽고 고친다', why: '틀린 내용이 파일에 남는다' },
];
export function ProofSlide() {
  const { clicks, isStatic } = useDeck();
  const c = isStatic ? 9 : clicks;
  const RY = (i: number) => 230 + i * 180;
  return (
    <>
      <Header kicker="실습 전에" title="인터뷰를 잘 받는 법" />
      <div style={{ ...abs(120, 200, 900, 740), borderRadius: 10, background: C.paper, boxShadow: '0 24px 50px rgba(0,0,0,.4)' }} />
      {FIX.map((f, i) => {
        const on = c >= i + 1;
        return (
          <div key={i} style={{ ...abs(160, RY(i), 820) }}>
            <div style={{ fontSize: 22, color: '#3d5a86', fontWeight: 700 }}><b>Codex</b> &nbsp;{f.q}</div>
            <div style={{ position: 'relative', display: 'inline-block', marginTop: 12, fontSize: 30, fontWeight: 800, color: C.deep }}>
              <span style={{ color: '#a14a3c' }}>나 &nbsp;</span>{f.bad}
              <span style={{ position: 'absolute', left: 50, right: -6, top: '52%', height: 4, background: C.coral, borderRadius: 2, transform: `scaleX(${on ? 1 : 0})`, transformOrigin: 'left', transition: 'transform .45s cubic-bezier(.16,1,.3,1)' }} />
            </div>
          </div>
        );
      })}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }} aria-hidden>
        {FIX.map((_, i) => <path key={i} d={`M1000 ${RY(i) + 70} C1040 ${RY(i) + 70} 1040 ${RY(i) + 50} 1080 ${RY(i) + 50}`} fill="none" stroke={C.coral} strokeWidth="3" opacity={c >= i + 1 ? 1 : 0} style={{ transition: 'opacity .4s' }} />)}
      </svg>
      {FIX.map((f, i) => (
        <Build key={i} at={i + 1} style={{ ...abs(1090, RY(i) + 10, 740) }}>
          <div style={{ fontSize: 29, fontWeight: 800, color: C.coral, fontFamily: 'var(--font-head)', transform: 'rotate(-1.2deg)', transformOrigin: 'left' }}>✓ {f.good}</div>
          <div style={{ ...small, fontSize: 20, marginTop: 6 }}>왜: {f.why}</div>
        </Build>
      ))}
      <Build at={5} style={{ ...abs(120, 975, 1700) }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: 24, fontWeight: 700 }}>
          <span style={{ color: C.gold }}>막히면</span>
          <Chip color={C.sky}>협업보드의 내 문제 후보 다시 보기</Chip>
          <Chip color={C.sky}>손 들기</Chip>
        </div>
      </Build>
    </>
  );
}

/* ═══════════════════ S20 — 인터뷰 프롬프트 (복사 버튼) ═══════════════════ */
const Blank = () => <span style={{ display: 'inline-block', width: 72, borderBottom: `3px solid ${C.coral}`, margin: '0 6px', transform: 'translateY(-6px)' }} />;
export function CopySlide() {
  const [state, setState] = useState<'idle' | 'ok' | 'manual'>('idle');
  const boxId = 'vibe-blueprint-prompt';
  const selectAll = () => {
    const el = document.getElementById(boxId);
    if (!el) return;
    const r = document.createRange();
    r.selectNodeContents(el);
    const s = window.getSelection();
    s?.removeAllRanges();
    s?.addRange(r);
  };
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(PROMPT);
      setState('ok');
      window.setTimeout(() => setState('idle'), 2000);
    } catch {
      selectAll();
      setState('manual');
    }
  };
  return (
    <>
      <Header kicker="복사해서 Codex에 붙여 넣기" title="인터뷰 프롬프트" />
      <div style={{ ...abs(120, 200, 1200, 820), ...solid, borderRadius: 18, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 14px 26px', borderBottom: '1px solid var(--hair-2)' }}>
          <span style={{ ...mono, fontSize: 17, color: 'var(--fg-faint)' }}>{PROMPT.length}자 · 상자 안을 스크롤해 볼 수 있다</span>
          <button
            type="button"
            onClick={onCopy}
            style={{ cursor: 'pointer', border: 'none', padding: '14px 30px', borderRadius: 999, fontSize: 24, fontWeight: 900, fontFamily: 'inherit', background: state === 'ok' ? C.ok : C.coral, color: C.deep, boxShadow: 'var(--glow)' }}
          >
            {state === 'ok' ? '복사했습니다 ✓' : '프롬프트 복사'}
          </button>
        </div>
        {state === 'manual' && <div style={{ padding: '10px 26px', background: `color-mix(in srgb, ${C.gold} 18%, transparent)`, fontSize: 20, fontWeight: 700, color: C.gold }}>복사 권한이 없어 글자를 모두 선택했습니다. Ctrl + C 를 누르세요.</div>}
        <pre id={boxId} onKeyDown={(e) => e.stopPropagation()} style={{ flex: 1, margin: 0, padding: '20px 26px', overflow: 'auto', ...mono, fontSize: 19, lineHeight: 1.6, color: C.ink, whiteSpace: 'pre-wrap', wordBreak: 'keep-all', userSelect: 'text' }}>
          {PROMPT}
        </pre>
      </div>
      <div style={{ ...abs(1380, 200, 440) }}>
        {[
          ['①', 'vibe 폴더에서 codex 실행'],
          ['②', '복사 → 입력창에 붙여 넣고 Enter'],
          ['③', '만들고 싶은 것을 한두 줄로'],
        ].map(([n, s]) => (
          <div key={n} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '18px 20px', marginBottom: 14, ...solid }}>
            <span style={{ fontSize: 34, fontWeight: 900, color: C.coral }}>{n}</span>
            <span style={{ fontSize: 23, fontWeight: 700, lineHeight: 1.35, wordBreak: 'keep-all' }}>{s}</span>
          </div>
        ))}
        <div style={{ marginTop: 26, padding: '22px 24px', borderRadius: 16, border: `2px dashed ${C.coral}` }}>
          <div style={{ ...kick, fontSize: 14 }}>첫 소개 문장 틀</div>
          <div style={{ fontSize: 25, fontWeight: 800, lineHeight: 1.55, marginTop: 10, wordBreak: 'keep-all' }}>
            나는 <Blank />할 때 <Blank />가 불편해서, <Blank />을 만들고 싶어
          </div>
        </div>
        <div style={{ ...small, marginTop: 22 }}>붙여 넣으면 입력창에 <b style={{ color: C.ink }}>[Pasted Content … chars]</b> 로 접혀 보인다. 그대로 Enter.</div>
      </div>
    </>
  );
}

/* ═══════════════════ S21 — 실습: 인터뷰 받고 설계도 올리기 (activity) ═══════════════════ */
const STEPS21: [string, ReactNode][] = [
  ['협업보드에서 오리엔테이션 때 남긴 내 문제 후보를 확인한다', null],
  ['vibe 폴더에서 codex 실행 → 20장의 프롬프트를 복사해 붙여 넣는다', null],
  ['만들고 싶은 것을 한두 줄로 소개하고, 질문에 하나씩 답한다', <Chip key="c" color={C.gold} size={16}>모르면 "모르겠어"</Chip>],
  ['설계도.md를 메모장으로 열어 다섯 칸을 확인한다', <Chip key="c" color={C.sky} size={16}>⑤는 비어도 된다</Chip>],
  ['협업보드에 새 노트로 올린다 — 제목: 이름 · 프로젝트 이름 / 내용: 설계도.md 전체 붙여 넣기', <Chip key="c" color={C.coral} size={16}>Ctrl + A → Ctrl + C</Chip>],
];
export function PracticeSlide() {
  return (
    <>
      <Header kicker="실습" title="인터뷰 받고, 설계도 올리기" />
      <div style={{ ...abs(120, 220, 1020) }}>
        {STEPS21.map(([s, extra], i) => (
          <div key={i} style={{ display: 'flex', gap: 24, position: 'relative', paddingBottom: 30 }}>
            {i < STEPS21.length - 1 && <i style={{ position: 'absolute', left: 29, top: 62, bottom: 0, width: 3, background: `color-mix(in srgb, ${C.sky} 40%, transparent)` }} />}
            <span style={{ flex: '0 0 auto', width: 60, height: 60, borderRadius: 30, border: `3px solid ${i === 4 ? C.coral : C.sky}`, display: 'grid', placeItems: 'center', ...mono, fontSize: 26, fontWeight: 900, color: i === 4 ? C.coral : C.sky }}>{i + 1}</span>
            <div style={{ paddingTop: 10 }}>
              <div style={{ fontSize: 27, fontWeight: 700, lineHeight: 1.4, wordBreak: 'keep-all' }}>{s}</div>
              {extra && <div style={{ marginTop: 10 }}>{extra}</div>}
            </div>
          </div>
        ))}
      </div>
      {[
        { y: 200, img: `${BASE}/images/prompt-qr.png`, title: '20장: 프롬프트 복사', href: DECK20, btn: '프롬프트 장 열기 ↗' },
        { y: 590, img: `${BASE}/images/collab-qr.png`, title: '협업보드에 올리기', href: COLLAB, btn: '협업보드 열기 ↗' },
      ].map((q) => (
        <div key={q.title} style={{ ...abs(1240, q.y, 600, 360), ...solid, padding: 24, boxSizing: 'border-box', display: 'flex', gap: 24, alignItems: 'center' }}>
          <div style={{ width: 300, height: 300, borderRadius: 14, overflow: 'hidden', background: '#fff', flex: '0 0 auto' }}>
            <img src={q.img} alt={`${q.title} QR`} style={{ width: '100%', height: '100%', display: 'block', imageRendering: 'pixelated' }} onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none'; }} />
          </div>
          <div>
            <div style={{ ...h3, fontSize: 28 }}>{q.title}</div>
            <div style={{ marginTop: 18 }}><LinkButton href={q.href} size={18}>{q.btn}</LinkButton></div>
          </div>
        </div>
      ))}
      <div style={{ ...abs(120, 985, 1100), ...small, fontSize: 21 }}>막히면 19장의 요령 · 손 들기 · 에이전트가 코드를 만들기 시작하면 "지금은 설계만, 코드는 만들지 마"</div>
    </>
  );
}

/* ═══════════════════ S22 — 마무리: 도면이 있으니, 1층부터 (scene · 비계) ═══════════════════ */
const ROOMS = ['알 · 부화', '배고파짐', '밥 주기'];
const LATER = ['나중: 놀이 · 코인', '나중: 꾸미기 · 친구 방문'];
export function ClosingScene() {
  const t = useSceneTime();
  const X = 560;
  const Y = 850;
  const W = 840;
  const DX = 150;
  const DY = -80;
  const FH = 150;
  const rise = spring(t, 0.4, 1.4);
  const h = FH * rise;
  const upper = interpolate(t, [2.4, 2.9], [0, 1]);
  const win = interpolate(t, [3.0, 3.4], [0, 1]);
  const pt = (x: number, y: number) => `${x},${y}`;
  return (
    <>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }} aria-hidden>
        {/* 평면도 (바닥) */}
        <polygon points={[pt(X, Y), pt(X + W, Y), pt(X + W + DX, Y + DY), pt(X + DX, Y + DY)].join(' ')} fill="rgba(156,195,255,0.06)" stroke={C.sky} strokeWidth="3" />
        {[1, 2].map((k) => <line key={k} x1={X + (W / 3) * k} y1={Y} x2={X + (W / 3) * k + DX} y2={Y + DY} stroke={C.sky} strokeWidth="2" opacity="0.7" />)}
        {/* 위층 비계 (점선) */}
        <g opacity={upper} fill="none" stroke="#8fa3c0" strokeWidth="2.5" strokeDasharray="10 9">
          {[1, 2].map((f) => {
            const y0 = Y - FH * f;
            const y1 = Y - FH * (f + 1);
            return (
              <g key={f}>
                <polygon points={[pt(X, y0), pt(X + W, y0), pt(X + W, y1), pt(X, y1)].join(' ')} />
                <polygon points={[pt(X, y1), pt(X + W, y1), pt(X + W + DX, y1 + DY), pt(X + DX, y1 + DY)].join(' ')} />
                <polygon points={[pt(X + W, y0), pt(X + W + DX, y0 + DY), pt(X + W + DX, y1 + DY), pt(X + W, y1)].join(' ')} />
              </g>
            );
          })}
        </g>
        {/* 1층 */}
        {h > 1 && (
          <g>
            <polygon points={[pt(X + W, Y), pt(X + W + DX, Y + DY), pt(X + W + DX, Y + DY - h), pt(X + W, Y - h)].join(' ')} fill="#c9d8ee" stroke={C.deep} strokeWidth="3" />
            <polygon points={[pt(X, Y), pt(X + W, Y), pt(X + W, Y - h), pt(X, Y - h)].join(' ')} fill="#eaf2ff" stroke={C.deep} strokeWidth="3" />
            <polygon points={[pt(X, Y - h), pt(X + W, Y - h), pt(X + W + DX, Y + DY - h), pt(X + DX, Y + DY - h)].join(' ')} fill="#f6efe0" stroke={C.deep} strokeWidth="3" />
            {[1, 2].map((k) => <line key={k} x1={X + (W / 3) * k} y1={Y} x2={X + (W / 3) * k} y2={Y - h} stroke={C.deep} strokeWidth="2" opacity="0.5" />)}
          </g>
        )}
      </svg>
      {/* 방 이름 — 1층 앞면 */}
      {ROOMS.map((r, i) => (
        <div key={r} style={{ ...abs(X + (W / 3) * i, Y - 52, W / 3), textAlign: 'center', fontSize: 23, fontWeight: 900, color: C.deep, opacity: interpolate(t, [1.4, 1.8], [0, 1]) }}>{r}</div>
      ))}
      {/* 창문 속 아기 펫 */}
      <div style={{ ...abs(X + W / 3 + W / 6 - 60, Y - 140, 120, 80), borderRadius: 10, background: C.lcd, border: `3px solid ${C.deep}`, display: 'grid', placeItems: 'center', opacity: win }}>
        <Pet name="baby-idle" px={3} />
      </div>
      {/* 위층 라벨 */}
      {LATER.map((l, i) => (
        <div key={l} style={{ ...abs(X + W + DX + 24, Y + DY - FH * (i + 1) - FH / 2 - 16), opacity: upper }}><Chip color="#b7c3d6" size={18}>{l}</Chip></div>
      ))}
      <div style={{ ...abs(X - 330, Y - FH / 2 - 20, 300), textAlign: 'right', opacity: interpolate(t, [1.6, 2.0], [0, 1]) }}>
        <Chip color={C.coral} solidFill size={20}>1층 = 필수 기능</Chip>
      </div>
      {/* 오늘 배운 것 */}
      <div style={{ ...abs(120, 90, 640), ...riseIn(t, 3.6, 0.7) }}>
        <div style={{ ...kick, color: C.sky }}>오늘</div>
        {['요청과 응답', '프론트엔드 · 백엔드 · DB', '배포 · 호스팅 · 도메인', '설계도 네 칸', '인터뷰로 설계도.md'].map((s) => (
          <div key={s} style={{ fontSize: 25, fontWeight: 700, marginTop: 10 }}><span style={{ color: C.ok }}>✓</span> {s}</div>
        ))}
      </div>
      <div style={{ ...abs(1240, 90, 580), ...solid, padding: '24px 28px', ...riseIn(t, 3.8, 0.7) }}>
        <div style={{ ...kick, fontSize: 14 }}>다음 시간</div>
        <div style={{ ...mono, fontSize: 23, fontWeight: 800, color: C.coral, marginTop: 10, lineHeight: 1.5, wordBreak: 'keep-all' }}>설계도.md를 읽고<br />필수 기능부터 만들어 줘</div>
        <div style={{ ...small, marginTop: 12 }}>아직 못 올렸으면 수업 뒤에도 올릴 수 있다</div>
        <div style={{ marginTop: 14 }}><LinkButton href={COLLAB} size={17}>협업보드 열기 ↗</LinkButton></div>
      </div>
      <div style={{ ...abs(0, 905, 1920), textAlign: 'center', fontSize: 40, fontWeight: 900, ...riseIn(t, 4.2, 0.7) }}>
        도면이 있으니, 이제 <span style={{ color: C.coral }}>1층부터</span>.
      </div>
    </>
  );
}

