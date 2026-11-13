import type { CSSProperties, ReactNode } from 'react';
import { useSceneTime, interpolate, easeInOut, riseIn } from '../../../../src/scene';
import { Pointer, AppWindow, typed, typedDoneAt, Caret, clickFlash, popIn, dimAfter } from '../../../../src/walkthrough';
import { abs, C, kick, h2, small, mono, solid, Code, CodeBlock, TextLink, Key, shrinkAfter } from './shared';

/* walkthrough 4장 — 창 목업은 장마다 자유 저작, 역학은 src/walkthrough.
   좌표: 창은 설계 박스 px(abs), Pointer는 씬 컨테이너 % (px/19.2, px/10.8).
   클릭 대상에는 data-pt를 달고 measure_pointer.mjs로 실측해 TG 상수를 확정한다. */

const termLine: CSSProperties = { ...mono, fontSize: 19, lineHeight: 1.75, whiteSpace: 'pre-wrap', wordBreak: 'break-all' };
const muted: CSSProperties = { color: 'var(--fg-muted)' };
const faint: CSSProperties = { color: 'var(--fg-faint)', fontStyle: 'italic' };
const ok: CSSProperties = { color: C.mint, fontWeight: 700 };

function KeyHint({ t, at, x, y, children }: { t: number; at: number; x: number; y: number; children: ReactNode }) {
  const on = t >= at && t < at + 1.4;
  if (!on) return null;
  return (
    <div style={{ ...abs(x, y), fontSize: 20, opacity: Math.min(interpolate(t, [at, at + 0.15], [0, 1]), interpolate(t, [at + 1.1, at + 1.4], [1, 0])), zIndex: 20 }}>
      <Key hot>{children}</Key>
    </div>
  );
}

/* ═══════════════════ S8 — Codex 설치: 한 줄 릴레이 (walkthrough) ═══════════════════ */
export const INSTALL_CMD = 'powershell -ExecutionPolicy ByPass -c "irm https://chatgpt.com/codex/install.ps1 | iex"';
export function CodexInstallWalk() {
  const t = useSceneTime();
  const MENU_IN = 0.3;
  const SEARCH = 'powershell';
  const SEARCH_AT = 1.0;
  const RESULT_CLICK = 2.6;
  const TERM_IN = 3.1;
  const PASTE = 4.0;
  const ENTER = 4.8;
  const L = [5.2, 5.6, 6.0, 7.9, 8.3, 8.7, 9.1]; // 출력 라인 시각
  const N_AT = 9.6;
  const TERM2_IN = 10.6;
  const CMD2 = 'codex --version';
  const CMD2_AT = 11.3;
  const OK_AT = typedDoneAt(CMD2, CMD2_AT, 12) + 0.5;
  const dl = interpolate(t, [6.0, 7.6], [0, 1], easeInOut);
  /* 클릭 대상 (씬 %) — measure_pointer.mjs 실측값으로 갱신 (2026-09-16) */
  const TG = { result: { x: 18.75, y: 40.37 } };
  const menuOn = t > MENU_IN && t < RESULT_CLICK + 0.3;
  return (
    <>
      {/* 헤더 밴드 + 복사용 명령 */}
      <div style={{ ...abs(120, 60, 1000) }}>
        <div style={kick}>설치 · Codex CLI</div>
        <h2 style={{ ...h2, marginTop: 8 }}>한 줄이면 <span style={{ color: C.mint }}>설치 끝</span></h2>
        <div style={{ ...small, marginTop: 8 }}>터미널을 열고 → 한 줄을 붙여넣고 → <b style={{ color: 'var(--fg)' }}>새 창</b>에서 확인</div>
      </div>
      <div style={{ ...abs(1150, 70, 650) }}>
        <div style={{ ...kick, marginBottom: 6 }}>복사해서 붙여넣을 한 줄 · 원전 <TextLink href="https://github.com/openai/codex" size={15}>github.com/openai/codex</TextLink></div>
        <CodeBlock lines={[INSTALL_CMD]} size={17} />
      </div>
      {/* 절차 순서는 ①②③ 배지와 겹쳐 내려가는 캐스케이드 배치가 말한다 — 연결선은 창에 가려 파편만 남아 뺐다 */}
      {/* ① 시작 메뉴 */}
      <AppWindow kind="app" title="시작 메뉴 — Win 키 또는 시작 버튼" badge="①" style={{ ...abs(120, 300, 480, 290), ...popIn(t, MENU_IN), ...dimAfter(t, TERM_IN + 0.2) }} bodyStyle={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 999, border: '1px solid var(--hair)', background: 'color-mix(in srgb, var(--fg) 6%, transparent)', ...mono, fontSize: 19 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="var(--fg-faint)" strokeWidth="2.4" /><path d="M15.4 15.4L21 21" stroke="var(--fg-faint)" strokeWidth="2.4" strokeLinecap="round" /></svg>
          {typed(t, SEARCH, SEARCH_AT, 11)}
          {menuOn && t > MENU_IN + 0.3 && t < RESULT_CLICK && <Caret />}
        </div>
        <div data-pt="s8-result" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, fontSize: 21, fontWeight: 800, background: `color-mix(in srgb, var(--primary) ${t > typedDoneAt(SEARCH, SEARCH_AT, 11) ? 18 + clickFlash(t, RESULT_CLICK) * 32 : 0}%, transparent)` }}>
          <span style={{ display: 'inline-grid', placeItems: 'center', width: 28, height: 28, borderRadius: 6, background: 'color-mix(in srgb, #4aa8ff 30%, transparent)', ...mono, fontSize: 14, color: '#9fd0ff' }}>&gt;_</span>
          Windows PowerShell
          <span style={{ marginLeft: 'auto', fontWeight: 400, fontSize: 15, color: 'var(--fg-faint)' }}>앱</span>
        </div>
        {[52, 40].map((w, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 16px' }}>
            <span style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--hair-2)' }} />
            <span style={{ width: `${w}%`, height: 8, borderRadius: 4, background: 'var(--hair-2)' }} />
          </div>
        ))}
      </AppWindow>
      {/* ② PowerShell — 붙여넣기 → 설치 로그 */}
      <AppWindow kind="terminal" title="Windows PowerShell" badge="②" style={{ ...abs(480, 400, 760), zIndex: 3, ...popIn(t, TERM_IN), ...dimAfter(t, TERM2_IN + 0.2) }}>
        <div style={{ ...termLine, fontWeight: 700, color: 'var(--fg)', wordBreak: 'normal', overflowWrap: 'anywhere' }}>
          {t >= PASTE ? INSTALL_CMD : ''}
          {t > TERM_IN + 0.4 && t < ENTER && <Caret />}
        </div>
        {t >= L[0] && <div style={{ ...termLine, ...muted }}>==&gt; Installing Codex CLI</div>}
        {t >= L[1] && <div style={{ ...termLine, ...muted }}>==&gt; Resolved version: 0.154.0</div>}
        {t >= L[2] && (
          <div style={{ ...termLine, ...muted }}>
            ==&gt; Downloading Codex CLI{' '}
            <span style={{ display: 'inline-block', width: 220, height: 10, borderRadius: 5, background: 'var(--hair-2)', verticalAlign: 'middle', overflow: 'hidden' }}>
              <span style={{ display: 'block', width: `${dl * 100}%`, height: '100%', background: C.mint }} />
            </span>
          </div>
        )}
        {t >= L[3] && <div style={{ ...termLine, ...muted }}>==&gt; PATH updated for future PowerShell sessions.</div>}
        {t >= L[4] && <div style={{ ...termLine, ...muted }}>==&gt; Future PowerShell windows: open a new PowerShell window and run: codex</div>}
        {t >= L[5] && <div style={{ ...termLine, ...ok }}>Codex CLI 0.154.0 installed successfully.</div>}
        {t >= L[6] && (
          <div style={{ ...termLine, color: 'var(--fg)' }}>
            Start Codex now? [y/N]: <b>{typed(t, 'N', N_AT, 10)}</b>
            {t >= L[6] && t < N_AT + 0.6 && <Caret />}
          </div>
        )}
        {t >= N_AT + 0.6 && <div style={{ ...termLine, ...faint }}>N을 고른 이유 — 확인은 새 창에서 한다</div>}
      </AppWindow>
      <KeyHint t={t} at={PASTE} x={1270} y={420}>Ctrl + V</KeyHint>
      <KeyHint t={t} at={ENTER} x={1270} y={472}>Enter</KeyHint>
      <KeyHint t={t} at={N_AT} x={1270} y={420}>N → Enter</KeyHint>
      {/* ③ 새 PowerShell — 버전 확인 */}
      <AppWindow kind="terminal" title="Windows PowerShell (새 창)" badge="③" style={{ ...abs(1180, 560, 620), zIndex: 4, ...popIn(t, TERM2_IN) }}>
        <div style={{ ...termLine, ...faint }}>창을 닫고 ①을 다시 — 새 창이어야 PATH가 반영된다</div>
        {t > CMD2_AT - 0.3 && (
          <div style={{ ...termLine, fontWeight: 700, color: 'var(--fg)' }}>
            {typed(t, CMD2, CMD2_AT, 12)}
            {t < OK_AT && <Caret />}
          </div>
        )}
        {t >= OK_AT && <div style={{ ...termLine, ...ok }}>codex-cli 0.154.0 ✓ 설치 확인 <Caret color="var(--fg-muted)" /></div>}
      </AppWindow>
      <Pointer
        path={[
          { t: 0.7, x: 27, y: 33 },
          { t: RESULT_CLICK, ...TG.result, click: true, label: '① PowerShell 실행', hide: true },
        ]}
        timelineEnd={14.5}
      />
    </>
  );
}

/* ═══════════════════ S10 — 첫 실행과 로그인: 폴더에서 열기 (walkthrough) ═══════════════════ */
export function FirstRunWalk() {
  const t = useSceneTime();
  const RCLICK = 1.3;
  const OPEN = 2.6;
  const TERM_IN = 3.2;
  const CODEX_AT = 4.0;
  const MENU_AT = 5.0;
  const ENTER1 = 6.0;
  const BROWSER_IN = 6.8;
  const CLICK_LOGIN = 8.4;
  const AUTH_OK = 9.0;
  const BACK = 10.0;
  const TRUST_AT = 10.8;
  const ENTER2 = 12.4;
  const READY = 13.0;
  /* 클릭 대상 (씬 %) — measure_pointer.mjs 실측값으로 갱신 (2026-09-16) */
  const TG = { open: { x: 60.42, y: 37.45 }, login: { x: 75.0, y: 81.83 } };
  const step = t < TERM_IN ? 0 : t < BROWSER_IN ? 1 : t < BACK ? 2 : 3;
  const steps = [
    { h: "문서 › vibe 폴더 → 빈 곳 우클릭 → '터미널에서 열기'", b: 'cd 없이 시작 — 연 폴더가 곧 작업 폴더' },
    { h: 'codex 입력 → Sign in with ChatGPT', b: '브라우저가 열린다 · 최초 1회' },
    { h: '브라우저에서 ChatGPT 계정 로그인', b: 'Free 계정도 된다 (한도는 작다)' },
    { h: '터미널 복귀 → 폴더 신뢰 확인 → 준비 완료', b: 'Trust and continue · 다음부터는 로그인 없이' },
  ];
  const menuOn = t > RCLICK + 0.1 && t < OPEN + 0.25;
  return (
    <>
      <div style={{ ...abs(80, 110, 600) }}>
        <div style={kick}>첫 실행 · 로그인</div>
        <h2 style={{ ...h2, marginTop: 8 }}>폴더에서 열면 <span style={{ color: C.mint }}>끝</span></h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ ...solid, padding: '14px 18px', display: 'flex', gap: 14, borderColor: i === step ? C.mint : 'var(--hair)', boxShadow: i === step ? 'var(--glow)' : 'none', opacity: i <= step ? 1 : 0.5, transition: 'all .4s' }}>
              <span style={{ ...mono, fontSize: 24, fontWeight: 800, color: C.mint }}>{i + 1}</span>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, wordBreak: 'keep-all' }}>{s.h}</div>
                <div style={{ ...small, fontSize: 16 }}>{s.b}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* ① 파일 탐색기 */}
      <AppWindow kind="app" title="vibe — 파일 탐색기" badge="①" style={{ ...abs(760, 90, 660, 330), ...popIn(t, 0.25), ...dimAfter(t, TERM_IN + 0.2) }} bodyStyle={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--hair-2)', ...mono, fontSize: 17, color: 'var(--fg-muted)' }}>
          문서 <span style={{ color: 'var(--fg-faint)' }}>›</span> <b style={{ color: 'var(--fg)' }}>vibe</b>
          <span style={{ marginLeft: 'auto', fontSize: 14, color: 'var(--fg-faint)' }}>새 폴더 · 영문 이름</span>
        </div>
        <div style={{ flex: 1, display: 'grid', placeItems: 'center', ...faint, fontSize: 18, textAlign: 'center' }}>
          {t < RCLICK + 0.1 ? '아직 비어 있다 — 빈 곳에서 마우스 오른쪽 클릭' : "우클릭 → '터미널에서 열기' — 이 폴더가 작업 폴더가 된다"}
        </div>
      </AppWindow>
      {menuOn && (
        <div style={{ ...abs(1000, 240, 320), zIndex: 5, ...solid, borderRadius: 12, padding: 6, fontSize: 19, ...popIn(t, RCLICK + 0.1, 0.35) }}>
          {['새로 만들기', '정렬 기준', '새로 고침', '터미널에서 열기', '속성'].map((m) => {
            const hot = m === '터미널에서 열기';
            return (
              <div key={m} data-pt={hot ? 's10-open' : undefined} style={{ padding: '9px 16px', borderRadius: 8, color: hot ? 'var(--fg)' : 'var(--fg-muted)', fontWeight: hot ? 800 : 400, background: hot ? `color-mix(in srgb, var(--primary) ${18 + clickFlash(t, OPEN) * 32}%, transparent)` : undefined }}>
                {m}
              </div>
            );
          })}
        </div>
      )}
      {/* ② 터미널 — 국면별로 보이는 줄이 바뀐다(스크롤된 터미널) */}
      <AppWindow kind="terminal" title="PowerShell — vibe · codex" badge="②" style={{ ...abs(880, 380, 920, 420), zIndex: 3, ...popIn(t, TERM_IN) }}>
        <div style={{ ...termLine, ...faint }}>문서\vibe 폴더에서 터미널이 열렸습니다</div>
        {t > CODEX_AT - 0.4 && t < TRUST_AT && (
          <div style={{ ...termLine, fontWeight: 700, color: 'var(--fg)' }}>
            {typed(t, 'codex', CODEX_AT, 12)}
            {t < MENU_AT && <Caret />}
          </div>
        )}
        {t >= MENU_AT && t < ENTER1 + 0.3 && (
          <>
            <div style={{ ...termLine, color: 'var(--fg)' }}>  Choose how you want to use Codex.</div>
            <div style={{ ...termLine, ...ok }}>› 1. Sign in with ChatGPT <span style={{ ...muted, fontWeight: 400 }}>— Usage included with Plus, Pro, Business, and Enterprise plans</span></div>
            <div style={{ ...termLine, ...muted }}>  2. Sign in with Device Code</div>
            <div style={{ ...termLine, ...muted }}>  3. Use an OpenAI API key</div>
            <div style={{ ...termLine, ...faint }}>  Press enter to continue</div>
          </>
        )}
        {t >= ENTER1 + 0.3 && t < BACK && (
          <>
            <div style={{ ...termLine, color: 'var(--fg)' }}>  Finish signing in via your browser</div>
            <div style={{ ...termLine, ...muted }}>  If the link doesn't open automatically, open the following link to authenticate:</div>
            <div style={{ ...termLine, color: C.sky, textDecoration: 'underline' }}>  https://auth.openai.com/oauth/authorize?…</div>
          </>
        )}
        {t >= BACK && t < TRUST_AT && <div style={{ ...termLine, ...ok }}>✓ Signed in with your ChatGPT account</div>}
        {t >= TRUST_AT && t < READY && (
          <>
            <div style={{ ...termLine, color: 'var(--fg)' }}>&gt; <b>You are in</b> C:\Users\학생\Documents\vibe</div>
            <div style={{ ...termLine, ...muted }}>  Trust this folder? Codex can read, edit, and run files here, subject to your permission settings. …</div>
            <div style={{ ...termLine, ...ok }}>› 1. Trust and continue</div>
            <div style={{ ...termLine, ...muted }}>  2. Quit</div>
            <div style={{ ...termLine, ...faint }}>  Press enter to continue and create a sandbox...</div>
          </>
        )}
        {t >= READY && (
          <>
            <div style={{ ...termLine, ...ok }}>✓ 준비 완료 — 여기가 에이전트에게 말하는 입력창</div>
            <div style={{ marginTop: 10, padding: '12px 16px', borderRadius: 10, border: `1px solid ${C.mint}`, ...termLine, color: 'var(--fg-faint)' }}>
              무엇을 할까요? <Caret />
            </div>
            <div style={{ ...termLine, ...faint, fontSize: 16 }}>gpt-5.6-terra · Documents\vibe · 입력창 문구는 목업(의역)</div>
          </>
        )}
      </AppWindow>
      <KeyHint t={t} at={ENTER1} x={1620} y={300}>Enter</KeyHint>
      <KeyHint t={t} at={ENTER2} x={1620} y={300}>Enter</KeyHint>
      {/* ③ 브라우저 — ChatGPT 로그인 */}
      <AppWindow kind="browser" url="auth.openai.com — ChatGPT 로그인" badge="③" style={{ ...abs(1080, 640, 720, 310), zIndex: 4, ...popIn(t, BROWSER_IN), ...dimAfter(t, BACK) }} bodyStyle={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center', padding: '10px 20px' }}>
        <div style={{ fontWeight: 900, fontSize: 28 }}>ChatGPT</div>
        <div style={{ ...small, fontSize: 17 }}>Codex에 사용할 계정으로 로그인 — Free 계정도 된다</div>
        <div style={{ ...mono, fontSize: 17, padding: '8px 18px', borderRadius: 9, border: '1px solid var(--hair)', color: 'var(--fg-muted)', minWidth: '58%' }}>you@school.kr</div>
        {t < AUTH_OK ? (
          <span data-pt="s10-login" style={{ padding: '10px 28px', borderRadius: 10, background: C.mint, color: C.navy, fontWeight: 800, fontSize: 18, boxShadow: `0 0 0 ${clickFlash(t, CLICK_LOGIN) * 9}px color-mix(in srgb, ${C.mint} 35%, transparent)` }}>로그인</span>
        ) : (
          <div style={{ ...ok, fontSize: 19 }}>✓ 로그인 완료 — 터미널로 돌아가세요</div>
        )}
      </AppWindow>
      {/* 포인터 하나로 왕복 — hide 뒤 다음 키에서 돌아온다 (검산기도 포인터 하나만 본다) */}
      <Pointer
        path={[
          { t: 0.8, x: 66, y: 12 },
          { t: RCLICK, x: 62, y: 28, click: true, label: '① 우클릭' },
          { t: OPEN, ...TG.open, click: true, label: "'터미널에서 열기'", hide: true },
          { t: BROWSER_IN + 0.5, x: 90, y: 70 },
          { t: CLICK_LOGIN, ...TG.login, click: true, label: '③ 로그인' },
          { t: CLICK_LOGIN + 0.8, ...TG.login, hide: true },
        ]}
        timelineEnd={14.2}
      />
    </>
  );
}

/* ═══════════════════ S15 — 모델 바꾸기와 사용량 확인 (walkthrough, 키보드) ═══════════════════ */
const MODELS = [
  { id: 'gpt-5.6-terra', d: '균형 잡힌 일상 작업 · 기본값' },
  { id: 'gpt-5.6-sol', d: '복잡한 코딩 · 깊이 있는 작업' },
  { id: 'gpt-6-astra', d: '가장 강함 · 여러 단계와 도구를 오가는 작업' },
  { id: 'gpt-5.6-luna', d: '가장 빠르고 저렴 · 분명하고 반복적인 작업' },
];
function Gauge({ x, y, pct, label, color }: { x: number; y: number; pct: number; label: string; color: string }) {
  const r = 120;
  const cx = 150;
  const cy = 150;
  // 반원 게이지: p=0 → 왼쪽 끝(θ=π), p=1 → 오른쪽 끝(θ=0), 위로 볼록
  const pt = (p: number, rad: number) => {
    const th = Math.PI * (1 - p);
    return [cx + Math.cos(th) * rad, cy - Math.sin(th) * rad] as const;
  };
  const [nx, ny] = pt(pct, r - 14);
  const arc = (from: number, to: number) => {
    const [x1, y1] = pt(from, r);
    const [x2, y2] = pt(to, r);
    // 어떤 구간도 180°를 넘지 않으므로 large-arc 플래그는 항상 0, 시계 방향(sweep 1)
    return `M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}`;
  };
  return (
    <div style={{ ...abs(x, y, 300, 230) }}>
      <svg viewBox="0 0 300 170" width={300} height={170} aria-hidden>
        <path d={arc(0, 0.999)} fill="none" stroke="var(--hair)" strokeWidth={18} strokeLinecap="round" />
        <path d={arc(0, Math.max(0.001, Math.min(0.999, pct)))} fill="none" stroke={color} strokeWidth={18} strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="var(--fg)" strokeWidth={5} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={9} fill="var(--fg)" />
      </svg>
      <div style={{ textAlign: 'center', marginTop: 2, fontSize: 30, fontWeight: 900, color, ...mono }}>{Math.round(pct * 100)}% 남음</div>
      <div style={{ textAlign: 'center', ...small, fontSize: 17 }}>{label}</div>
    </div>
  );
}
export function ModelSwitchWalk() {
  const t = useSceneTime();
  const M_AT = 0.8;
  const POP = 1.9;
  const DOWN = 3.0;
  const ENTER = 3.8;
  const S_AT = 5.2;
  const CARD = 6.5;
  const sel = t >= DOWN ? 1 : 0;
  const g1 = interpolate(t, [CARD, CARD + 1.0], [1, 0.62], easeInOut);
  const g2 = interpolate(t, [CARD, CARD + 1.0], [1, 0.81], easeInOut);
  const bar = (p: number) => '█'.repeat(Math.round(p * 20)) + '░'.repeat(20 - Math.round(p * 20));
  return (
    <>
      <div style={{ ...abs(80, 60, 1000) }}>
        <div style={kick}>모델 바꾸기 · 사용량 확인</div>
        <h2 style={{ ...h2, marginTop: 8 }}><Code size={40}>/model</Code> 로 바꾸고, <Code size={40}>/status</Code> 로 본다</h2>
      </div>
      <AppWindow kind="terminal" title="PowerShell — vibe · codex" style={{ ...abs(80, 200, 1080, 640), ...popIn(t, 0.2) }}>
        <div style={{ ...termLine, ...faint }}>슬래시로 시작하면 에이전트가 아니라 Codex 자체에 하는 명령</div>
        <div style={{ ...termLine, fontWeight: 700, color: 'var(--fg)' }}>
          {typed(t, '/model', M_AT, 10)}
          {t > 0.4 && t < POP && <Caret />}
        </div>
        {t >= POP && t < ENTER + 0.3 && (
          <div style={{ marginTop: 6, padding: '12px 16px', borderRadius: 10, border: '1px solid var(--hair)', background: 'color-mix(in srgb, var(--fg) 4%, transparent)' }}>
            <div style={{ ...termLine, color: 'var(--fg)', fontWeight: 700 }}>  Select Model and Effort</div>
            {MODELS.map((m, i) => {
              const hot = i === sel;
              return (
                <div key={m.id} style={{ ...termLine, color: hot ? C.mint : 'var(--fg-muted)', fontWeight: hot ? 700 : 400, background: hot ? 'color-mix(in srgb, var(--primary) 12%, transparent)' : 'transparent', borderRadius: 6 }}>
                  {hot ? '› ' : '  '}{i + 1}. {m.id}{i === 0 ? ' (current)' : ''}
                  <span style={{ ...muted, fontWeight: 400 }}>  {m.d}</span>
                </div>
              );
            })}
            <div style={{ ...termLine, ...faint }}>  ↑↓ 이동 · Enter 선택 · 모델 설명은 의역</div>
          </div>
        )}
        {t >= ENTER + 0.3 && <div style={{ ...termLine, ...ok }}>✓ 모델: gpt-5.6-sol — 이제부터 이 세션은 Sol이 일한다</div>}
        {t >= S_AT - 0.3 && (
          <div style={{ ...termLine, fontWeight: 700, color: 'var(--fg)' }}>
            {typed(t, '/status', S_AT, 10)}
            {t < CARD && <Caret />}
          </div>
        )}
        {t >= CARD && (
          <div style={{ ...termLine, fontSize: 17, lineHeight: 1.6, color: 'var(--fg-muted)', marginTop: 6 }}>
            <div>╭──────────────────────────────────────────────╮</div>
            <div>│  &gt;_ OpenAI Codex (v0.154.0)</div>
            <div>│  Model:            <span style={{ color: 'var(--fg)' }}>gpt-5.6-sol</span> (reasoning medium)</div>
            <div>│  Directory:        C:\Users\학생\Documents\vibe</div>
            <div>│  Permissions:      No Sandbox (never)  ← --yolo</div>
            <div>│  5h limit:         [{bar(g1)}] <span style={{ color: C.mint }}>{Math.round(g1 * 100)}% left</span> (resets 예시)</div>
            <div>│  Weekly limit:     [{bar(g2)}] <span style={{ color: C.sky }}>{Math.round(g2 * 100)}% left</span> (resets 예시)</div>
            <div>╰──────────────────────────────────────────────╯</div>
          </div>
        )}
      </AppWindow>
      <KeyHint t={t} at={DOWN} x={1000} y={240}>↓</KeyHint>
      <KeyHint t={t} at={ENTER} x={1000} y={240}>Enter</KeyHint>
      <div style={{ ...abs(80, 870, 1080), ...small, fontSize: 18, color: 'var(--fg-muted)', ...riseIn(t, CARD + 0.8, 0.6, 10) }}>
        <b style={{ color: 'var(--fg)' }}>5h limit</b>는 5시간 창, <b style={{ color: 'var(--fg)' }}>Weekly limit</b>는 주간 한도 — 남은 비율과 리셋 시각을 화면이 알려 준다. 다음 장에서 두 숫자의 뜻.
      </div>
      {/* 계기판 — /status의 두 숫자 (예시 수치) */}
      <div style={{ ...abs(1220, 200, 600), ...kick, ...riseIn(t, CARD, 0.6, 12) }}>계기판 — /status의 두 숫자 (예시 수치)</div>
      <div style={{ opacity: interpolate(t, [CARD, CARD + 0.5], [0.25, 1]) }}>
        <Gauge x={1220} y={240} pct={g1} label="5시간 창" color={C.mint} />
        <Gauge x={1530} y={240} pct={g2} label="이번 주" color={C.sky} />
      </div>
      <div style={{ ...abs(1220, 540, 600), ...solid, padding: '18px 22px', ...riseIn(t, 1.0, 0.6, 12) }}>
        <div style={{ ...kick, marginBottom: 10 }}>용도 한 줄</div>
        {MODELS.map((m) => (
          <div key={m.id} style={{ display: 'flex', gap: 12, alignItems: 'baseline', padding: '5px 0', borderBottom: '1px solid var(--hair-2)' }}>
            <span style={{ ...mono, fontSize: 17, fontWeight: 700, color: m.id.includes('sol') ? C.mint : 'var(--fg)', minWidth: 150 }}>{m.id.replace('gpt-5.6-', '').replace('gpt-6-', '')}</span>
            <span style={{ ...small, fontSize: 16 }}>{m.d}</span>
          </div>
        ))}
        <div style={{ ...small, fontSize: 16, marginTop: 10, color: C.mint }}>권장: Sol에서 시작 — 기본값은 Terra라 한 번 바꾼다</div>
      </div>
    </>
  );
}

/* ═══════════════════ S20 — 만든 페이지 열기와 고치기 (walkthrough, 핑퐁) ═══════════════════ */
export function OpenPageWalk() {
  const t = useSceneTime();
  const DBL1 = 1.4;
  const DBL2 = 1.55;
  const PAGE_IN = 2.0;
  const CMD1 = 'start index.html';
  const CMD1_AT = 3.4;
  const OUT1 = typedDoneAt(CMD1, CMD1_AT, 12) + 0.5;
  const REQ = '버튼 색을 민트색으로 바꾸고 제목을 더 크게 해 줘';
  const REQ_AT = 6.2;
  const A1 = typedDoneAt(REQ, REQ_AT, 14) + 0.5;
  const F5 = A1 + 2.0;
  const CHANGED = F5 + 0.25;
  const RHYTHM = CHANGED + 0.8;
  /* 클릭 대상 (씬 %) — measure_pointer.mjs 실측값으로 갱신 (2026-09-16) */
  const TG = { file: { x: 49.48, y: 31.25 } };
  const changed = t >= CHANGED;
  const flash = clickFlash(t, F5, 0.6);
  return (
    <>
      <div style={{ ...abs(80, 60, 1200) }}>
        <div style={kick}>만든 페이지 열기와 고치기</div>
        <h2 style={{ ...h2, marginTop: 8 }}>더블클릭으로 열고, <span style={{ color: C.mint }}>F5</span> 로 확인한다</h2>
      </div>
      {/* 탐색기 — 첫 국면만 앞으로, 이후 축소 */}
      <div style={{ ...abs(600, 180, 700, 220), zIndex: 5, ...shrinkAfter(t, PAGE_IN + 0.2, 0.8, 'top center') }}>
        <AppWindow kind="app" title="vibe — 파일 탐색기" badge="①" style={{ left: 0, top: 0, width: '100%', height: '100%', ...popIn(t, 0.2), ...dimAfter(t, PAGE_IN + 0.2) }} bodyStyle={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {['hello.txt', 'hello-en.txt', 'index.html'].map((f) => {
            const hot = f === 'index.html';
            return (
              <div key={f} data-pt={hot ? 's20-file' : undefined} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 12px', borderRadius: 8, ...mono, fontSize: 19, fontWeight: hot ? 800 : 500, color: hot ? 'var(--fg)' : 'var(--fg-muted)', background: hot ? `color-mix(in srgb, var(--primary) ${clickFlash(t, DBL1, 0.4) * 30 + clickFlash(t, DBL2, 0.4) * 30}%, transparent)` : 'transparent' }}>
                <svg width="20" height="24" viewBox="0 0 20 24" aria-hidden><path d="M2 2h10l6 6v14H2z" fill="none" stroke={hot ? C.mint : 'var(--fg-faint)'} strokeWidth="1.8" strokeLinejoin="round" /></svg>
                {f}
                {hot && t > DBL2 && t < PAGE_IN + 0.6 && <span style={{ marginLeft: 'auto', fontSize: 14, color: C.mint }}>더블클릭 → 브라우저</span>}
              </div>
            );
          })}
        </AppWindow>
      </div>
      {/* 브라우저 — 내 페이지 */}
      <AppWindow kind="browser" url="file:///C:/Users/학생/Documents/vibe/index.html" badge="②" style={{ ...abs(80, 440, 860, 470), zIndex: 3, ...popIn(t, PAGE_IN), boxShadow: flash > 0 ? `0 0 0 ${flash * 10}px color-mix(in srgb, ${C.mint} 35%, transparent), var(--shadow)` : 'var(--shadow)' }} bodyStyle={{ background: '#0d1a33', color: '#eaf1ff', padding: '34px 40px', overflow: 'hidden' }}>
        <div style={{ fontSize: changed ? 50 : 38, fontWeight: 900, letterSpacing: '-0.02em', textAlign: 'center', transition: 'font-size .35s' }}>안녕, 나는 유진</div>
        <div style={{ fontSize: 19, color: '#b9c7e6', textAlign: 'center', marginTop: 8 }}>처음 보는 친구가 30초 안에 나를 알게 하는 한 장</div>
        <ul style={{ fontSize: 21, marginTop: 14, paddingLeft: 30, lineHeight: 1.5 }}>
          <li>농구 — 주말마다 코트에서</li><li>떡볶이 — 매운 맛 2단계</li><li>새벽 산책 — 이어폰 없이</li>
        </ul>
        <div style={{ display: 'inline-block', marginTop: 12, padding: '10px 26px', borderRadius: 10, background: changed ? C.mint : '#3b4d7a', color: changed ? C.navy : '#eaf1ff', fontWeight: 800, fontSize: 19, transition: 'background .35s, color .35s' }}>더 보기</div>
        {t > F5 - 0.05 && t < F5 + 1.4 && (
          <div style={{ position: 'absolute', right: 24, top: 18, fontSize: 22 }}><Key hot>F5</Key></div>
        )}
        {changed && <div style={{ position: 'absolute', left: 40, bottom: 18, ...ok, fontSize: 18 }}>✓ 버튼은 민트색, 제목은 더 크게</div>}
      </AppWindow>
      {/* 터미널 — 두 번째 열기 방법 + 수정 요청 */}
      <AppWindow kind="terminal" title="PowerShell — vibe · codex --yolo" badge="③" style={{ ...abs(980, 440, 860, 470), zIndex: 4, ...popIn(t, PAGE_IN + 0.4) }}>
        <div style={{ ...termLine, ...faint }}>다른 방법 — 터미널에서 직접 열기</div>
        {t > CMD1_AT - 0.3 && (
          <div style={{ ...termLine, fontWeight: 700, color: 'var(--fg)' }}>
            {typed(t, CMD1, CMD1_AT, 12)}
            {t < OUT1 && <Caret />}
          </div>
        )}
        {t >= OUT1 && <div style={{ ...termLine, ...muted }}>브라우저가 열립니다 (에이전트에게 "index.html을 열어 줘"라고 해도 된다)</div>}
        {t > REQ_AT - 0.3 && (
          <div style={{ ...termLine, fontWeight: 700, color: 'var(--fg)', marginTop: 8 }}>
            {typed(t, REQ, REQ_AT, 14)}
            {t < A1 && <Caret />}
          </div>
        )}
        {t >= A1 && <div style={{ ...termLine, color: C.mintSoft }}>● index.html 수정 — 버튼 배경 #57f2b0</div>}
        {t >= A1 + 0.4 && <div style={{ ...termLine, color: C.mintSoft }}>● 제목 글자 크기 2.4rem → 3.2rem</div>}
        {t >= A1 + 0.8 && <div style={{ ...termLine, ...ok }}>✓ 저장했습니다 — 브라우저에서 F5</div>}
      </AppWindow>
      {t >= RHYTHM && (
        <div style={{ ...abs(80, 936, 1760), display: 'flex', justifyContent: 'center', gap: 16, ...riseIn(t, RHYTHM, 0.6, 12) }}>
          {['요청', '수정', 'F5', '확인'].map((w, i) => (
            <span key={w} style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 24, fontWeight: 800, color: w === 'F5' ? C.mint : 'var(--fg)' }}>
              {w}{i < 3 && <span style={{ color: 'var(--fg-faint)' }}>→</span>}
            </span>
          ))}
          <span style={{ ...small, fontSize: 20, marginLeft: 20 }}>— 앞으로의 작업 리듬</span>
        </div>
      )}
      <Pointer
        path={[
          { t: 0.8, x: 40, y: 14 },
          { t: DBL1, ...TG.file, click: true, label: '① index.html 더블클릭' },
          { t: DBL2, ...TG.file, click: true, hide: true },
        ]}
        timelineEnd={12.5}
      />
    </>
  );
}
