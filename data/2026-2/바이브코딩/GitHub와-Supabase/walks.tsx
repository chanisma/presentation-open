import type { CSSProperties, ReactNode } from 'react';
import { useSceneTime, interpolate, spring, riseIn, easeInOut } from '../../../../src/scene';
import { Pointer, AppWindow, popIn, dimAfter, typed, typedDoneAt, clickFlash, Caret } from '../../../../src/walkthrough';
import { abs, C, SVG, kick, h2, small, mono, solid, Chip, Code, Note, LinkButton, Mark, MiniPage, Phone, Cloud } from './shared';
import { CARDS, GUESTBOOK_PROMPT } from './cards';

/* ── 시연(walkthrough) 7장 — plan.md 각 장의 「절차 대본」이 원본.
   화면 문구는 대본용 예시. 실제 화면과 다르면 실제에 맞춘다(plan F4·F6·F12~F14·G2).
   포인터 좌표(TG)는 measure_pointer.mjs 실측값. */

const ring = (t: number, at: number, color: string = C.violet): CSSProperties => ({ boxShadow: `0 0 0 ${clickFlash(t, at, 0.6) * 9}px color-mix(in srgb, ${color} 40%, transparent)` });
const fadeIn = (t: number, at: number, d = 0.25) => interpolate(t, [at, at + d], [0, 1]);

function WalkHead({ kicker, title, x = 110, w = 1200 }: { kicker: string; title: ReactNode; x?: number; w?: number }) {
  return (
    <div style={{ ...abs(x, 40, w) }}>
      <div style={kick}>{kicker}</div>
      <h2 style={{ ...h2, fontSize: 44, marginTop: 6 }}>{title}</h2>
    </div>
  );
}

/* 웹 폼 입력 칸 목업 */
function Field({ label, value, focus, pt, w = 520, mono: m = false, caret }: { label: string; value: ReactNode; focus?: boolean; pt?: string; w?: number; mono?: boolean; caret?: boolean }) {
  return (
    <div style={{ width: w }}>
      <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{label}</div>
      <div data-pt={pt} style={{ height: 46, borderRadius: 8, border: `2px solid ${focus ? C.violet : 'var(--hair)'}`, background: '#fffdf8', display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 20, fontWeight: 600, ...(m ? mono : {}), color: C.ink }}>
        {value}
        {caret && <Caret color={C.violet} />}
      </div>
    </div>
  );
}
function Btn({ children, pt, color = '#1f883d', t, at, w, style }: { children: ReactNode; pt?: string; color?: string; t: number; at: number; w?: number; style?: CSSProperties }) {
  return (
    <span data-pt={pt} style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', width: w, padding: '11px 22px', borderRadius: 8, background: color, color: C.white, fontSize: 19, fontWeight: 800, whiteSpace: 'nowrap', ...ring(t, at, color), ...style }}>
      {children}
    </span>
  );
}
function Ff({ t, at, label, style }: { t: number; at: number; label: string; style?: CSSProperties }) {
  const o = Math.min(fadeIn(t, at, 0.15), interpolate(t, [at + 0.9, at + 1.1], [1, 0]));
  if (o <= 0) return null;
  const turn = interpolate(t, [at, at + 1.0], [0, 360]);
  return (
    <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderRadius: 999, background: C.ink, color: C.white, fontSize: 22, fontWeight: 800, opacity: o, zIndex: 5, ...style }}>
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden>
        <circle cx="17" cy="17" r="14" fill="none" stroke="#ffffff" strokeWidth="3" />
        <path d={`M17 17 L${17 + 10 * Math.sin((turn * Math.PI) / 180)} ${17 - 10 * Math.cos((turn * Math.PI) / 180)}`} stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      </svg>
      ⏩ {label}
    </div>
  );
}
const tl: CSSProperties = { ...mono, fontSize: 19, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'keep-all' };

/* ═══════════════════ S7 — GitHub 가입하기 ═══════════════════ */
const T7 = { URL: 0.3, PAGE: 1.7, EMAIL: 2.4, PW: 4.6, USER: 5.8, BAL: 6.9, CONT: 8.0, CODEPAGE: 8.4, MAIL: 8.8, CODE: 9.8, DONE: 11.2, END: 12.6 };
const EMAIL = 'kijun.student@example.com';
const USER = 'mintcode07';
const CODE7 = '38104672';
const TG7 = { /* measure_pointer.mjs 실측 2026-10-28 */
  email: { x: 36.51, y: 34.54 },
  pw: { x: 36.51, y: 43.24 },
  user: { x: 36.51, y: 51.94 },
  cont: { x: 36.51, y: 59.49 },
  code: { x: 37.55, y: 39.22 },
};
export function SignupWalk() {
  const t = useSceneTime();
  const page = t < T7.CODEPAGE ? 'form' : t < T7.DONE ? 'code' : 'home';
  const emailV = typed(t, EMAIL, T7.EMAIL + 0.2, 16);
  const pwV = '•'.repeat(Math.floor(interpolate(t, [T7.PW + 0.2, T7.PW + 0.8], [0, 12])));
  const userV = typed(t, USER, T7.USER + 0.2, 12);
  const codeV = typed(t, CODE7, T7.CODE + 0.2, 10);
  const focus = t >= T7.USER ? 'user' : t >= T7.PW ? 'pw' : t >= T7.EMAIL ? 'email' : '';
  return (
    <>
      <WalkHead kicker="따라 하기 1 · github.com/signup" title={<>GitHub 가입하기 — <span style={{ color: C.violet }}>사용자 이름이 주소가 된다</span></>} />
      <AppWindow kind="browser" url={typed(t, 'github.com/signup', T7.URL, 14) || ' '} badge="①" style={{ ...abs(110, 160, 1200, 830), ...popIn(t, 0.05), ...(t < T7.DONE ? dimAfter(t, T7.MAIL, 0.7) : {}) }} bodyStyle={{ position: 'relative', flex: 1 }}>
        {t >= T7.PAGE && page === 'form' && (
          <div style={{ ...abs(330, 50, 540), opacity: fadeIn(t, T7.PAGE) }}>
            <div style={{ fontSize: 34, fontWeight: 800 }}>Sign up to GitHub</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22, marginTop: 30 }}>
              <Field label="Email*" value={emailV} focus={focus === 'email'} pt="s7-email" caret={focus === 'email' && emailV.length < EMAIL.length} />
              <Field label="Password*" value={pwV} focus={focus === 'pw'} pt="s7-pw" />
              <Field label="Username*" value={userV} focus={focus === 'user'} pt="s7-user" mono />
              <div style={{ marginTop: 12 }}>
                <Btn pt="s7-cont" color={C.ink} t={t} at={T7.CONT} w={520}>Continue →</Btn>
              </div>
            </div>
          </div>
        )}
        {page === 'code' && (
          <div style={{ ...abs(330, 70, 560), opacity: fadeIn(t, T7.CODEPAGE) }}>
            <div style={{ fontSize: 32, fontWeight: 800 }}>Confirm your email address</div>
            <div style={{ ...small, marginTop: 12 }}>We sent a code to {EMAIL}</div>
            <div data-pt="s7-code" style={{ display: 'flex', gap: 10, marginTop: 40 }}>
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} style={{ width: 52, height: 64, borderRadius: 8, border: `2px solid ${i === codeV.length ? C.violet : 'var(--hair)'}`, background: '#fffdf8', display: 'grid', placeItems: 'center', ...mono, fontSize: 30, fontWeight: 800 }}>{codeV[i] ?? ''}</div>
              ))}
            </div>
          </div>
        )}
        {page === 'home' && (
          <div style={{ ...abs(0, 0, 1200, 790), opacity: fadeIn(t, T7.DONE), display: 'flex' }}>
            <div style={{ width: 300, borderRight: '1px solid var(--hair-2)', padding: 26 }}>
              <div style={{ width: 70, height: 70, borderRadius: '50%', background: C.violetSoft, border: `3px solid ${C.ink}` }} />
              <div style={{ ...mono, fontSize: 22, fontWeight: 800, marginTop: 14 }}>{USER}</div>
            </div>
            <div style={{ padding: 40 }}>
              <div style={{ fontSize: 30, fontWeight: 800 }}>Home</div>
              <div style={{ ...small, marginTop: 10 }}>가입 완료 — GitHub 첫 화면</div>
              <div style={{ marginTop: 26 }}><Chip color={C.teal} solidFill size={22}>✓ 계정이 생겼다</Chip></div>
            </div>
          </div>
        )}
      </AppWindow>
      {/* 사용자 이름 = 주소 풍선 (덱 설명 레이어) */}
      {page === 'form' && t >= T7.BAL && (
        <div style={{ ...abs(990, 548, 520), ...riseIn(t, T7.BAL, 0.5) }}>
          <Note>내 사이트 주소: <span style={mono}>https://{USER}.github.io/…</span></Note>
        </div>
      )}
      {/* 메일 창 */}
      {t >= T7.MAIL - 0.1 && t < T7.DONE + 0.4 && (
        <AppWindow kind="app" title="메일 — 받은편지함" badge="②" style={{ ...abs(1180, 620, 600, 300), ...popIn(t, T7.MAIL), opacity: interpolate(t, [T7.DONE, T7.DONE + 0.4], [1, 0]) }} bodyStyle={{ padding: '18px 22px' }}>
          <div style={{ fontSize: 19, fontWeight: 800 }}>[GitHub] Your GitHub launch code</div>
          <div style={{ ...small, marginTop: 8 }}>Here is your GitHub launch code:</div>
          <div style={{ ...mono, fontSize: 44, fontWeight: 900, letterSpacing: '0.12em', marginTop: 12, color: C.ink }}>{CODE7}</div>
        </AppWindow>
      )}
      {/* 오른쪽 띠 */}
      <div style={{ ...abs(1360, 170, 450), display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Chip color={t >= T7.BAL ? C.violet : C.mute} solidFill={t >= T7.BAL} size={21}>사용자 이름 = 주소</Chip>
        <Chip color={C.ink} size={21}>실명이 아니어도 된다</Chip>
        <Chip color={C.ink} size={21}>비밀번호는 다른 사이트와 다르게</Chip>
        <div style={{ ...solid, padding: '14px 16px', marginTop: 8, borderColor: C.warn }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.warn }}>퍼즐이 계속 실패하거나 메일이 안 열리면</div>
          <div style={{ ...small, fontSize: 17, marginTop: 4 }}>폰의 모바일 데이터로 가입하고, 노트북에서는 로그인만</div>
        </div>
      </div>
      <div style={{ ...abs(1360, 452) }}>
        <LinkButton href="https://github.com/signup" size={19}>github.com/signup ↗</LinkButton>
      </div>
      <Pointer
        timelineEnd={T7.END}
        path={[
          { t: 1.9, x: 52, y: 30 },
          { t: T7.EMAIL, x: TG7.email.x, y: TG7.email.y, click: true, label: '이메일' },
          { t: T7.EMAIL + 0.15, x: TG7.email.x, y: TG7.email.y, hide: true },
          { t: T7.PW, x: TG7.pw.x, y: TG7.pw.y, click: true, label: '비밀번호' },
          { t: T7.PW + 0.15, x: TG7.pw.x, y: TG7.pw.y, hide: true },
          { t: T7.USER, x: TG7.user.x, y: TG7.user.y, click: true, label: '사용자 이름' },
          { t: T7.USER + 0.15, x: TG7.user.x, y: TG7.user.y, hide: true },
          { t: T7.CONT, x: TG7.cont.x, y: TG7.cont.y, click: true, label: 'Continue' },
          { t: T7.CODE, x: TG7.code.x, y: TG7.code.y, click: true, label: '인증 코드' },
          { t: T7.CODE + 0.15, x: TG7.code.x, y: TG7.code.y, hide: true },
        ]}
      />
    </>
  );
}

/* ═══════════════════ S9 — GitHub에 빈 저장소 만들기 ═══════════════════ */
const T9 = { PAGE: 0.3, NAME: 1.0, AVAIL: 2.3, PUBLIC: 3.0, README: 3.9, CREATE: 4.8, REPO: 5.2, COPY: 6.4, FLY: 6.6, END: 8.2 };
const REPO_URL = 'https://github.com/mintcode07/vibe-site.git';
const TG9 = { /* measure_pointer.mjs 실측 2026-10-28 */
  name: { x: 57.81, y: 33.43 },
  pub: { x: 52.66, y: 45.15 },
  readme: { x: 52.66, y: 60.68 },
  create: { x: 42.39, y: 67.67 },
  copy: { x: 86.03, y: 38.47 },
};
export function NewRepoWalk() {
  const t = useSceneTime();
  const repo = t >= T9.REPO;
  const nameV = typed(t, 'vibe-site', T9.NAME + 0.2, 10);
  const copied = t >= T9.COPY;
  const fly = interpolate(t, [T9.FLY, T9.FLY + 0.7], [0, 1], easeInOut);
  return (
    <>
      <WalkHead kicker="따라 하기 2 · github.com/new" title={<>GitHub에 <span style={{ color: C.violet }}>빈 저장소</span> 만들기</>} />
      {/* 왼쪽: 이 장에서 정하는 세 가지 */}
      <div style={{ ...abs(110, 200, 400), display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ ...kick, fontSize: 14 }}>이 장에서 정하는 세 가지</div>
        {[
          { k: '이름', v: 'vibe-site', on: t >= T9.AVAIL },
          { k: '공개', v: 'Public', on: t >= T9.PUBLIC },
          { k: '비워 두기', v: 'README 추가 안 함', on: t >= T9.README },
        ].map((r) => (
          <div key={r.k} style={{ ...solid, padding: '16px 20px', borderColor: r.on ? C.violet : 'var(--hair)', background: r.on ? 'color-mix(in srgb, #6c4cf0 7%, #fffdf8)' : '#fffdf8' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.mute }}>{r.on ? '✓ ' : ''}{r.k}</div>
            <div style={{ ...mono, fontSize: 24, fontWeight: 800, marginTop: 4 }}>{r.v}</div>
          </div>
        ))}
        <div style={{ ...small, fontSize: 17 }}>Pages는 무료 계정에서 <b style={{ color: C.violet }}>공개 저장소</b>만 된다</div>
      </div>
      <AppWindow kind="browser" url={repo ? 'github.com/mintcode07/vibe-site' : 'github.com/new'} badge="②" style={{ ...abs(560, 160, 1250, 800), ...popIn(t, T9.PAGE) }} bodyStyle={{ position: 'relative', flex: 1 }}>
        {!repo && (
          <div style={{ ...abs(150, 40, 900) }}>
            <div style={{ fontSize: 32, fontWeight: 800 }}>Create a new repository</div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', marginTop: 30 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Owner</div>
                <div style={{ height: 46, borderRadius: 8, border: '2px solid var(--hair)', display: 'flex', alignItems: 'center', padding: '0 14px', ...mono, fontSize: 20 }}>mintcode07</div>
              </div>
              <div style={{ fontSize: 30, paddingBottom: 6 }}>/</div>
              <Field label="Repository name*" value={nameV} focus={t >= T9.NAME && t < T9.PUBLIC} pt="s9-name" w={420} mono caret={t >= T9.NAME && nameV.length < 9} />
            </div>
            {t >= T9.AVAIL && <div style={{ color: '#1f883d', fontWeight: 700, fontSize: 18, marginTop: 10, marginLeft: 220 }}>✓ vibe-site is available.</div>}
            <div style={{ marginTop: 34, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { k: 'Public', d: 'Anyone on the internet can see this repository.', on: true, pt: 's9-public' },
                { k: 'Private', d: 'You choose who can see and commit.', on: false, pt: undefined },
              ].map((r) => (
                <div key={r.k} data-pt={r.pt} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '10px 14px', borderRadius: 10, width: 600, border: `2px solid ${r.on && t >= T9.PUBLIC ? C.violet : 'transparent'}`, ...(r.pt ? ring(t, T9.PUBLIC) : {}) }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${C.ink}`, display: 'grid', placeItems: 'center' }}>{r.on && <i style={{ width: 11, height: 11, borderRadius: '50%', background: C.ink }} />}</span>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{r.k}</div>
                    <div style={{ ...small, fontSize: 16 }}>{r.d}</div>
                  </div>
                </div>
              ))}
            </div>
            <div data-pt="s9-readme" style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 22, padding: '10px 14px', borderRadius: 10, width: 600, ...ring(t, T9.README) }}>
              <span style={{ width: 46, height: 26, borderRadius: 13, background: 'color-mix(in srgb, #1f2430 18%, transparent)', position: 'relative' }}>
                <i style={{ position: 'absolute', left: 3, top: 3, width: 20, height: 20, borderRadius: '50%', background: '#fffdf8' }} />
              </span>
              <span style={{ fontSize: 20, fontWeight: 700 }}>Add README</span>
              <span style={{ ...small, fontSize: 16 }}>Off</span>
            </div>
            <div style={{ marginTop: 30 }}>
              <Btn pt="s9-create" t={t} at={T9.CREATE}>Create repository</Btn>
            </div>
          </div>
        )}
        {repo && (
          <div style={{ ...abs(80, 40, 1090), opacity: fadeIn(t, T9.REPO) }}>
            <div style={{ ...mono, fontSize: 28, fontWeight: 800 }}>mintcode07 / <span style={{ color: C.violet }}>vibe-site</span> <Chip color={C.mute} size={15}>Public</Chip></div>
            <div style={{ ...solid, marginTop: 40, padding: '24px 28px' }}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>Quick setup — if you’ve done this kind of thing before</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 18 }}>
                <span style={{ ...mono, fontSize: 15, padding: '6px 10px', borderRadius: 6, background: C.ink, color: C.white }}>HTTPS</span>
                <span style={{ ...mono, fontSize: 21, flex: 1, padding: '8px 12px', border: '2px solid var(--hair)', borderRadius: 8 }}>{REPO_URL}</span>
                <span data-pt="s9-copy" style={{ padding: '8px 14px', borderRadius: 8, border: `2px solid ${copied ? '#1f883d' : C.ink}`, fontSize: 18, fontWeight: 800, color: copied ? '#1f883d' : C.ink, ...ring(t, T9.COPY) }}>{copied ? 'Copied!' : '⧉ 복사'}</span>
              </div>
            </div>
            <div style={{ ...small, marginTop: 24 }}>…or push an existing repository from the command line</div>
          </div>
        )}
      </AppWindow>
      {/* 클립보드 칩 — 다음 장(S10)의 첫 입력이 여기서 출발 */}
      {copied && (
        <div style={{ ...abs(1500 + (110 - 1500) * fly, 470 + (760 - 470) * fly), zIndex: 4 }}>
          <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center', padding: '10px 18px', borderRadius: 12, background: C.violet, color: C.white, fontWeight: 800, fontSize: 18, boxShadow: '0 14px 30px -16px rgba(31,36,48,.7)' }}>📋 <span style={mono}>…/vibe-site.git</span> 복사됨</span>
        </div>
      )}
      <div style={{ ...abs(110, 650) }}>
        <LinkButton href="https://github.com/new" size={17}>github.com/new ↗</LinkButton>
      </div>
      <Pointer
        timelineEnd={T9.END}
        path={[
          { t: 0.7, x: 60, y: 28 },
          { t: T9.NAME, x: TG9.name.x, y: TG9.name.y, click: true, label: '저장소 이름' },
          { t: T9.NAME + 0.15, x: TG9.name.x, y: TG9.name.y, hide: true },
          { t: T9.PUBLIC, x: TG9.pub.x, y: TG9.pub.y, click: true, label: 'Public' },
          { t: T9.README, x: TG9.readme.x, y: TG9.readme.y, click: true, label: 'README 끔 확인' },
          { t: T9.CREATE, x: TG9.create.x, y: TG9.create.y, click: true, label: 'Create repository' },
          { t: T9.COPY, x: TG9.copy.x, y: TG9.copy.y, click: true, label: '주소 복사' },
        ]}
      />
    </>
  );
}

/* ═══════════════════ S10 — 시연: Codex가 커밋하고 푸시한다 ═══════════════════ */
const T10 = { CODEX: 0.4, HEAD: 1.0, CLIP: 1.9, ENTER: 2.6, CMD: 3.0, LOGIN: 5.3, SIGNIN: 6.1, AUTH: 6.6, AUTHCLICK: 7.3, PUSHED: 8.0, BROWSER: 8.6, REFRESH: 9.3, FILES: 9.6, END: 11.2 };
const CMDS = ['git init', 'git add .', 'git commit -m "첫 페이지와 설계도"', 'git remote add origin https://github.com/mintcode07/vibe-site.git', 'git push -u origin main'];
const TG10 = { /* measure_pointer.mjs 실측 2026-10-28 */
  clip: { x: 13.65, y: 92.87 },
  signin: { x: 50.0, y: 54.54 },
  auth: { x: 50.0, y: 61.02 },
  refresh: { x: 90.41, y: 29.31 },
};
export function PushWalk() {
  const t = useSceneTime();
  const pastedLen = CARDS[2].text.length;
  const cmdShown = CMDS.filter((_, i) => t >= T10.CMD + i * 0.5);
  const loginOn = t >= T10.LOGIN && t < T10.AUTHCLICK + 0.4;
  const authOn = t >= T10.AUTH && t < T10.AUTHCLICK + 0.4;
  return (
    <>
      <WalkHead kicker="시연 · 실습 4단계" title={<>Codex가 <span style={{ color: C.violet }}>커밋하고 푸시</span>한다</>} />
      <AppWindow kind="terminal" title="PowerShell — vibe" badge="③" style={{ ...abs(110, 160, 1180, 790), ...popIn(t, 0.05), ...dimAfter(t, T10.BROWSER, 0.6) }} bodyStyle={{ padding: 0, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
          <div style={{ ...tl, fontWeight: 800 }}>{typed(t, 'codex', T10.CODEX, 10)}</div>
          {t >= T10.HEAD && <div style={{ ...tl, fontSize: 16, color: C.mute }}>{'>_ OpenAI Codex   directory: ~\\Documents\\vibe'}</div>}
          {t >= T10.ENTER && (
            <div style={{ display: 'flex', gap: 10 }}>
              <Chip color={C.violet} solidFill size={14}>나</Chip>
              <span style={{ ...tl, color: C.violet, fontWeight: 800 }}>[Pasted Content {pastedLen} chars] — 카드 3 · 주소 자리에 복사한 저장소 주소</span>
            </div>
          )}
          {cmdShown.map((c, i) => (
            <div key={c} style={{ display: 'flex', gap: 12, alignItems: 'baseline', opacity: fadeIn(t, T10.CMD + i * 0.5) }}>
              <Chip color={C.ink} size={13}>실행</Chip>
              <span style={{ ...tl, fontSize: 18, color: C.mute }}>{c}</span>
              {(i < 4 || t >= T10.PUSHED) && <span style={{ color: C.teal, fontWeight: 800 }}>✓</span>}
              {i === 4 && t < T10.PUSHED && <span style={{ ...small, fontSize: 16, color: C.warn }}>로그인 기다리는 중…</span>}
            </div>
          ))}
          {t >= T10.CMD + 0.2 && (
            <div style={{ ...abs(40, 520), opacity: fadeIn(t, T10.CMD + 0.2) }}>
              <Note style={{ fontSize: 17 }}>외우지 않아도 된다 — Codex가 친다</Note>
            </div>
          )}
          {t >= T10.PUSHED && (
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <Chip color={C.teal} size={14}>Codex</Chip>
              <span style={{ ...tl, color: C.teal, fontWeight: 800 }}>main 브랜치로 푸시했습니다. 파일 2개 (index.html, 설계도.md)</span>
            </div>
          )}
        </div>
        <div style={{ margin: '0 16px 16px', padding: '14px 18px', borderRadius: 12, border: `1.5px solid ${t >= T10.CLIP && t < T10.ENTER ? C.violet : 'var(--hair)'}`, ...tl, color: t >= T10.CLIP && t < T10.ENTER ? C.violet : C.faint, fontWeight: 700 }}>
          {t >= T10.CLIP && t < T10.ENTER ? <>[Pasted Content {pastedLen} chars]<Caret color={C.violet} /></> : t >= T10.HEAD ? 'Codex에게 말하기…' : ''}
        </div>
      </AppWindow>
      {/* S9에서 넘어온 클립보드 칩 */}
      <div data-pt="s10-clip" style={{ ...abs(110, 980), opacity: t < T10.ENTER ? 1 : interpolate(t, [T10.ENTER, T10.ENTER + 0.3], [1, 0]), ...ring(t, T10.CLIP) }}>
        <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center', padding: '10px 18px', borderRadius: 12, background: C.violet, color: C.white, fontWeight: 800, fontSize: 18 }}>📋 <span style={mono}>…/vibe-site.git</span> + 카드 3</span>
      </div>
      {/* 로그인 창 */}
      {loginOn && (
        <AppWindow kind="app" title="Git Credential Manager" style={{ ...abs(700, 420, 520, 300), ...popIn(t, T10.LOGIN), zIndex: 3 }} bodyStyle={{ padding: '22px 26px', textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>Connect to GitHub</div>
          <div style={{ ...small, marginTop: 8 }}>처음 한 번만 — 이 노트북이 내 대신 올려도 되는지 허락</div>
          <div style={{ marginTop: 24 }}>
            <Btn pt="s10-signin" color={C.ink} t={t} at={T10.SIGNIN}>Sign in with your browser</Btn>
          </div>
        </AppWindow>
      )}
      {authOn && (
        <AppWindow kind="browser" url="github.com/login/oauth/authorize" style={{ ...abs(660, 480, 600, 330), ...popIn(t, T10.AUTH), zIndex: 4 }} bodyStyle={{ padding: '24px 28px', textAlign: 'center' }}>
          <div style={{ fontSize: 23, fontWeight: 800 }}>Authorize Git Credential Manager</div>
          <div style={{ ...small, marginTop: 8 }}>mintcode07 계정으로 로그인한 상태</div>
          <div style={{ marginTop: 26 }}>
            <Btn pt="s10-auth" t={t} at={T10.AUTHCLICK}>Authorize</Btn>
          </div>
        </AppWindow>
      )}
      {/* GitHub 저장소 창 */}
      {t >= T10.BROWSER - 0.1 && (
        <AppWindow kind="browser" url="github.com/mintcode07/vibe-site" badge="④" style={{ ...abs(1060, 230, 760, 560), ...popIn(t, T10.BROWSER), zIndex: 3 }} bodyStyle={{ padding: '22px 26px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ ...mono, fontSize: 22, fontWeight: 800 }}>mintcode07 / vibe-site</span>
            <span data-pt="s10-refresh" style={{ padding: '6px 12px', borderRadius: 8, border: `2px solid ${C.ink}`, fontSize: 18, fontWeight: 800, ...ring(t, T10.REFRESH) }}>⟳ 새로고침</span>
          </div>
          {t < T10.FILES ? (
            <div style={{ ...small, marginTop: 40 }}>Quick setup — 아직 비어 있음</div>
          ) : (
            <div style={{ marginTop: 22, ...solid, overflow: 'hidden', opacity: fadeIn(t, T10.FILES) }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 18px', background: 'color-mix(in srgb, #6c4cf0 8%, #fffdf8)', borderBottom: '1px solid var(--hair-2)' }}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', background: C.violetSoft, border: `2px solid ${C.ink}` }} />
                <b style={{ fontSize: 18 }}>mintcode07</b>
                <span style={{ fontSize: 18, color: C.violet, fontWeight: 800 }}>첫 페이지와 설계도</span>
                <span style={{ ...mono, fontSize: 14, color: C.mute, marginLeft: 'auto' }}>a1f3c2e · now</span>
              </div>
              {['index.html', '설계도.md'].map((f) => (
                <div key={f} style={{ padding: '12px 18px', borderBottom: '1px solid var(--hair-2)', ...mono, fontSize: 20 }}>📄 {f}</div>
              ))}
            </div>
          )}
          {t >= T10.FILES + 0.4 && <div style={{ marginTop: 20, opacity: fadeIn(t, T10.FILES + 0.4) }}><Chip color={C.teal} solidFill size={20}>✓ 내 파일이 GitHub에 있다</Chip></div>}
        </AppWindow>
      )}
      <Pointer
        timelineEnd={T10.END}
        path={[
          { t: 1.4, x: 30, y: 80 },
          { t: T10.CLIP, x: TG10.clip.x, y: TG10.clip.y, click: true, label: '카드 3 붙여넣기' },
          { t: T10.CLIP + 0.2, x: TG10.clip.x, y: TG10.clip.y, hide: true },
          { t: T10.SIGNIN, x: TG10.signin.x, y: TG10.signin.y, click: true, label: '브라우저로 로그인' },
          { t: T10.AUTHCLICK, x: TG10.auth.x, y: TG10.auth.y, click: true, label: 'Authorize' },
          { t: T10.REFRESH, x: TG10.refresh.x, y: TG10.refresh.y, click: true, label: '새로고침' },
        ]}
      />
    </>
  );
}

/* ═══════════════════ S13 — Pages 켜기 ═══════════════════ */
const T13 = { PAGE: 0.2, SETTINGS: 1.0, PAGES: 2.2, BRANCH: 3.2, MAIN: 3.9, SAVE: 4.7, FF: 5.1, LIVE: 6.4, VISIT: 7.2, PHONE: 7.7, END: 9.6 };
const SITE = 'https://mintcode07.github.io/vibe-site/';
const TG13 = { /* measure_pointer.mjs 실측 2026-10-28 */
  settings: { x: 38.39, y: 27.45 },
  pages: { x: 20.86, y: 63.96 },
  branch: { x: 33.85, y: 53.98 },
  main: { x: 36.2, y: 59.26 },
  save: { x: 47.88, y: 54.03 },
  visit: { x: 74.93, y: 39.72 },
};
export function PagesWalk() {
  const t = useSceneTime();
  const view = t < T13.SETTINGS + 0.3 ? 'repo' : t < T13.PAGES + 0.3 ? 'settings' : 'pages';
  const menuOpen = t >= T13.BRANCH && t < T13.MAIN + 0.2;
  const picked = t >= T13.MAIN;
  const live = t >= T13.LIVE;
  const path = [
    { k: 'Settings', on: t >= T13.SETTINGS },
    { k: 'Pages', on: t >= T13.PAGES },
    { k: 'main', on: t >= T13.MAIN },
  ];
  return (
    <>
      <WalkHead kicker="따라 하기 3 · 저장소 설정" title={<>Pages 켜기 — <span style={{ color: C.violet }}>클릭 다섯 번과 1~2분</span></>} w={1000} />
      <div style={{ ...abs(1180, 70, 640), display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
        {path.map((p, i) => (
          <span key={p.k} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <Chip color={p.on ? C.violet : C.mute} solidFill={p.on} size={22}>{p.k}</Chip>
            {i < 2 && <span style={{ fontSize: 22, color: C.mute }}>→</span>}
          </span>
        ))}
      </div>
      <AppWindow kind="browser" url={view === 'repo' ? 'github.com/mintcode07/vibe-site' : view === 'settings' ? 'github.com/mintcode07/vibe-site/settings' : 'github.com/mintcode07/vibe-site/settings/pages'} badge="⑤" style={{ ...abs(250, 170, 1300, 800), ...popIn(t, T13.PAGE), ...dimAfter(t, T13.PHONE, 0.7) }} bodyStyle={{ position: 'relative', flex: 1 }}>
        <div style={{ padding: '18px 30px 0', borderBottom: '1px solid var(--hair-2)' }}>
          <div style={{ ...mono, fontSize: 24, fontWeight: 800 }}>mintcode07 / vibe-site</div>
          <div style={{ display: 'flex', gap: 28, marginTop: 14, fontSize: 19, fontWeight: 700 }}>
            {['Code', 'Issues', 'Pull requests', 'Actions', 'Settings'].map((tab) => {
              const on = tab === 'Settings' ? view !== 'repo' : tab === 'Code' && view === 'repo';
              return (
                <span key={tab} data-pt={tab === 'Settings' ? 's13-settings' : undefined} style={{ paddingBottom: 12, borderBottom: `3px solid ${on ? '#fd8c73' : 'transparent'}`, ...(tab === 'Settings' ? ring(t, T13.SETTINGS) : {}) }}>
                  {tab === 'Settings' ? '⚙ ' : ''}
                  {tab}
                </span>
              );
            })}
          </div>
        </div>
        {view === 'repo' && <div style={{ padding: 30, ...mono, fontSize: 20, display: 'flex', flexDirection: 'column', gap: 12 }}><span>📄 index.html</span><span>📄 설계도.md</span></div>}
        {view !== 'repo' && (
          <div style={{ display: 'flex', height: 640 }}>
            <div style={{ width: 300, borderRight: '1px solid var(--hair-2)', padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 18 }}>
              <span style={{ fontWeight: 700 }}>General</span>
              <span style={{ ...small, fontSize: 14, marginTop: 10 }}>Code and automation</span>
              {['Branches', 'Tags', 'Rules', 'Actions', 'Webhooks', 'Environments', 'Codespaces', 'Pages'].map((m) => (
                <span key={m} data-pt={m === 'Pages' ? 's13-pages' : undefined} style={{ padding: '6px 10px', borderRadius: 8, fontWeight: m === 'Pages' && view === 'pages' ? 800 : 500, background: m === 'Pages' && view === 'pages' ? 'color-mix(in srgb, #6c4cf0 12%, transparent)' : 'transparent', ...(m === 'Pages' ? ring(t, T13.PAGES) : {}) }}>
                  {m}
                </span>
              ))}
            </div>
            <div style={{ flex: 1, padding: '24px 34px', position: 'relative' }}>
              {view === 'settings' && <div style={{ fontSize: 28, fontWeight: 800 }}>General</div>}
              {view === 'pages' && (
                <>
                  <div style={{ fontSize: 30, fontWeight: 800 }}>GitHub Pages</div>
                  {live && (
                    <div style={{ marginTop: 16, padding: '14px 18px', borderRadius: 10, background: '#dafbe1', border: '1.5px solid #1f883d', display: 'flex', alignItems: 'center', gap: 14, opacity: fadeIn(t, T13.LIVE) }}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: '#1a7f37', flex: 1 }}>Your site is live at <span style={mono}>{SITE}</span></span>
                      <Btn pt="s13-visit" color={C.ink} t={t} at={T13.VISIT} style={{ padding: '8px 14px', fontSize: 16 }}>Visit site ↗</Btn>
                    </div>
                  )}
                  <div style={{ fontSize: 22, fontWeight: 800, marginTop: 26 }}>Build and deployment</div>
                  <div style={{ fontSize: 17, fontWeight: 700, marginTop: 16 }}>Source</div>
                  <div style={{ marginTop: 6, display: 'inline-block', padding: '8px 14px', borderRadius: 8, border: '2px solid var(--hair)', fontSize: 18, fontWeight: 700 }}>Deploy from a branch ▾</div>
                  <div style={{ fontSize: 17, fontWeight: 700, marginTop: 20 }}>Branch</div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 6, alignItems: 'center', position: 'relative' }}>
                    <span data-pt="s13-branch" style={{ padding: '8px 14px', borderRadius: 8, border: `2px solid ${menuOpen ? C.violet : 'var(--hair)'}`, fontSize: 18, fontWeight: 700, minWidth: 130, ...ring(t, T13.BRANCH) }}>{picked ? '⑂ main' : '⑂ None'} ▾</span>
                    {picked && <span style={{ padding: '8px 14px', borderRadius: 8, border: '2px solid var(--hair)', fontSize: 18, fontWeight: 700 }}>📁 / (root) ▾</span>}
                    <span data-pt="s13-save" style={{ padding: '8px 18px', borderRadius: 8, border: '2px solid var(--hair)', fontSize: 18, fontWeight: 800, background: picked ? 'color-mix(in srgb, #1f2430 6%, #fffdf8)' : 'transparent', color: picked ? C.ink : C.faint, ...ring(t, T13.SAVE) }}>Save</span>
                    {menuOpen && (
                      <div style={{ position: 'absolute', left: 0, top: 50, width: 220, ...solid, padding: 8, zIndex: 3 }}>
                        <div data-pt="s13-main" style={{ padding: '8px 12px', borderRadius: 8, fontSize: 18, fontWeight: 800, background: 'color-mix(in srgb, #6c4cf0 12%, transparent)', ...ring(t, T13.MAIN) }}>⑂ main</div>
                        <div style={{ padding: '8px 12px', fontSize: 18, color: C.mute }}>None</div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        <Ff t={t} at={T13.FF} label="1~2분 기다린 뒤 새로고침" style={{ left: 480, top: 380 }} />
      </AppWindow>
      {t >= T13.PHONE - 0.1 && (
        <div style={{ ...abs(1500, 360), ...popIn(t, T13.PHONE), zIndex: 4 }}>
          <Phone w={280} h={540} url="mintcode07.github.io/vibe-site/">
            <MiniPage scale={1.2} />
          </Phone>
          <div style={{ marginTop: 14, textAlign: 'center' }}><Chip color={C.teal} solidFill>✓ 노트북 밖에서 열린다</Chip></div>
        </div>
      )}
      <Pointer
        timelineEnd={T13.END}
        path={[
          { t: 0.6, x: 45, y: 40 },
          { t: T13.SETTINGS, x: TG13.settings.x, y: TG13.settings.y, click: true, label: 'Settings' },
          { t: T13.PAGES, x: TG13.pages.x, y: TG13.pages.y, click: true, label: 'Pages' },
          { t: T13.BRANCH, x: TG13.branch.x, y: TG13.branch.y, click: true, label: 'Branch' },
          { t: T13.MAIN, x: TG13.main.x, y: TG13.main.y, click: true, label: 'main' },
          { t: T13.SAVE, x: TG13.save.x, y: TG13.save.y, click: true, label: 'Save' },
          { t: T13.VISIT, x: TG13.visit.x, y: TG13.visit.y, click: true, label: 'Visit site' },
        ]}
      />
    </>
  );
}

/* ═══════════════════ S22 — 시연: Supabase 가입과 프로젝트 만들기 ═══════════════════ */
const T22 = { PAGE: 0.2, GH: 1.2, AUTH: 1.6, AUTHCLICK: 2.4, DASH: 2.8, NEW: 3.6, FORM: 3.9, NAME: 4.3, GEN: 6.0, REGION: 7.0, CREATE: 8.0, FF: 8.3, PROJ: 9.4, END: 11.2 };
const TG22 = { /* measure_pointer.mjs 실측 2026-10-28 */
  gh: { x: 31.3, y: 35.75 },
  auth: { x: 31.3, y: 41.39 },
  newp: { x: 21.26, y: 25.51 },
  name: { x: 31.3, y: 33.81 },
  gen: { x: 41.82, y: 42.24 },
  region: { x: 31.3, y: 50.48 },
  create: { x: 31.3, y: 56.92 },
};
export function SupabaseWalk() {
  const t = useSceneTime();
  const view = t < T22.AUTH ? 'signin' : t < T22.DASH ? 'auth' : t < T22.FORM ? 'dash' : t < T22.PROJ ? 'form' : 'proj';
  const nameV = typed(t, 'guestbook-demo', T22.NAME + 0.2, 12);
  const pwFill = t >= T22.GEN;
  const regionPicked = t >= T22.REGION;
  const linkOn = t < 3.4;
  return (
    <>
      <WalkHead kicker="시연 · supabase.com/dashboard" title={<>Supabase 가입과 <span style={{ color: C.teal }}>프로젝트 만들기</span></>} />
      <div style={{ ...abs(1500, 60) }}><Chip color={C.mute} size={18}>시연 — 오늘은 따라 하지 않아도 됨</Chip></div>
      <AppWindow kind="browser" url={view === 'signin' ? 'supabase.com/dashboard/sign-in' : view === 'auth' ? 'github.com/login/oauth/authorize' : view === 'proj' ? 'supabase.com/dashboard/project/…' : 'supabase.com/dashboard/projects'} badge="①" style={{ ...abs(110, 160, 1180, 820), ...popIn(t, T22.PAGE) }} bodyStyle={{ position: 'relative', flex: 1 }}>
        {view === 'signin' && (
          <div style={{ ...abs(240, 60, 500) }}>
            <div style={{ fontSize: 32, fontWeight: 800 }}>Welcome back</div>
            <div style={{ ...small, marginTop: 6 }}>Sign in to your account</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 28 }}>
              <Btn pt="s22-gh" color={C.ink} t={t} at={T22.GH} w={500}>Continue with GitHub</Btn>
              <Btn color="#8a8f99" t={t} at={-9} w={500}>Continue with ChatGPT</Btn>
              <Btn color="#8a8f99" t={t} at={-9} w={500}>Continue with SSO</Btn>
            </div>
            <div style={{ ...small, marginTop: 22, fontSize: 16 }}>or · Email · Password</div>
          </div>
        )}
        {view === 'auth' && (
          <div style={{ ...abs(240, 120, 500), textAlign: 'center', opacity: fadeIn(t, T22.AUTH) }}>
            <div style={{ fontSize: 28, fontWeight: 800 }}>Authorize Supabase</div>
            <div style={{ ...small, marginTop: 10 }}>mintcode07 계정의 기본 정보에 접근</div>
            <div style={{ marginTop: 30 }}><Btn pt="s22-auth" t={t} at={T22.AUTHCLICK} w={500}>Authorize supabase</Btn></div>
          </div>
        )}
        {view === 'dash' && (
          <div style={{ ...abs(60, 50, 1060), opacity: fadeIn(t, T22.DASH) }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
              <span style={{ fontSize: 30, fontWeight: 800 }}>Projects</span>
              <Btn pt="s22-new" color={C.teal} t={t} at={T22.NEW}>+ New project</Btn>
            </div>
            <div style={{ ...small, marginTop: 30 }}>아직 프로젝트가 없다</div>
          </div>
        )}
        {view === 'form' && (
          <div style={{ ...abs(240, 30, 640), opacity: fadeIn(t, T22.FORM) }}>
            <div style={{ fontSize: 28, fontWeight: 800 }}>Create a new project</div>
            <div style={{ ...small, fontSize: 16, marginTop: 4 }}>Organization · mintcode07's Org · Free</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 22 }}>
              <Field label="Project name" value={nameV} focus={t >= T22.NAME && t < T22.GEN} pt="s22-name" w={500} mono caret={t >= T22.NAME && nameV.length < 14} />
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
                <Field label="Database password" value={pwFill ? '••••••••••••••••' : ''} w={340} />
                <span data-pt="s22-gen" style={{ padding: '10px 14px', borderRadius: 8, border: `2px solid ${C.teal}`, color: C.teal, fontSize: 16, fontWeight: 800, whiteSpace: 'nowrap', ...ring(t, T22.GEN, C.teal) }}>Generate a password</span>
              </div>
              <Field label="Region" value={regionPicked ? 'Northeast Asia (Seoul) ▾' : 'Select a region ▾'} pt="s22-region" w={500} focus={t >= T22.REGION && t < T22.CREATE} />
              <div style={{ marginTop: 6 }}><Btn pt="s22-create" color={C.teal} t={t} at={T22.CREATE} w={500}>Create new project</Btn></div>
            </div>
          </div>
        )}
        {view === 'form' && pwFill && (
          <div style={{ ...abs(840, 190, 300), opacity: fadeIn(t, T22.GEN + 0.2) }}>
            <Note color={C.warn}>이것도 비밀 — 따로 보관, 공개 금지</Note>
          </div>
        )}
        {view === 'proj' && (
          <div style={{ ...abs(60, 40, 1060), opacity: fadeIn(t, T22.PROJ) }}>
            <div style={{ fontSize: 28, fontWeight: 800 }}>guestbook-demo <Chip color={C.teal} size={15}>Northeast Asia (Seoul)</Chip></div>
            <div style={{ ...small, marginTop: 6 }}>연결 정보</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
              {[
                { k: 'Project URL', v: 'https://abcdefghijklmnop.supabase.co', c: C.teal, tag: '코드에 들어간다' },
                { k: 'Publishable key', v: 'sb_publishable_xxxxxxxxxxxxxxxx', c: C.teal, tag: '공개 키 — 코드에 넣어도 된다' },
                { k: 'Secret key', v: '••••••••••••••••••••  (Reveal)', c: C.warn, tag: '누르지 않는다' },
              ].map((r) => (
                <div key={r.k} style={{ padding: '14px 18px', borderRadius: 12, border: `2.5px solid ${r.c}`, background: '#fffdf8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <b style={{ fontSize: 19 }}>{r.k}</b>
                    <span style={{ fontSize: 17, fontWeight: 800, color: r.c }}>{r.tag}</span>
                  </div>
                  <div style={{ ...mono, fontSize: 20, marginTop: 6, color: C.ink }}>{r.v}</div>
                </div>
              ))}
            </div>
            <div style={{ ...small, fontSize: 15, marginTop: 12 }}>키 값과 주소는 가짜 예시</div>
          </div>
        )}
        <Ff t={t} at={T22.FF} label="몇 분 — 프로젝트를 만드는 중" style={{ left: 380, top: 360 }} />
      </AppWindow>
      {/* 오른쪽 띠 */}
      <div style={{ ...abs(1330, 190, 490) }}>
        <div style={{ opacity: linkOn ? 1 : 0.25, transition: 'none' }}>
          <div style={{ ...kick, fontSize: 14 }}>GitHub 계정이 열쇠</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
            <Cloud w={180}><Mark size={18} color={C.violet}>GitHub</Mark></Cloud>
            <span style={{ fontSize: 30, color: C.mute }}>→</span>
            <div style={{ width: 170, height: 90, borderRadius: 14, border: `3px solid ${C.teal}`, display: 'grid', placeItems: 'center' }}><Mark size={22} color={C.teal}>Supabase</Mark></div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 40 }}>
          {[
            { at: T22.GEN, c: C.warn, k: 'DB 비밀번호 = 비밀' },
            { at: T22.PROJ + 0.3, c: C.teal, k: '공개 키 = 코드에 넣어도 됨' },
            { at: T22.PROJ + 0.6, c: C.warn, k: '비밀 키 = 절대 공개 금지' },
          ].map((s) => (t >= s.at ? <div key={s.k} style={{ ...riseIn(t, s.at, 0.5) }}><Chip color={s.c} solidFill size={22}>{s.k}</Chip></div> : null))}
        </div>
        <div style={{ marginTop: 40 }}>
          <LinkButton href="https://supabase.com/dashboard" size={18} color={C.teal}>supabase.com/dashboard ↗</LinkButton>
        </div>
      </div>
      <Pointer
        timelineEnd={T22.END}
        color={C.teal}
        path={[
          { t: 0.7, x: 40, y: 30 },
          { t: T22.GH, x: TG22.gh.x, y: TG22.gh.y, click: true, label: 'Continue with GitHub' },
          { t: T22.AUTHCLICK, x: TG22.auth.x, y: TG22.auth.y, click: true, label: 'Authorize' },
          { t: T22.NEW, x: TG22.newp.x, y: TG22.newp.y, click: true, label: 'New project' },
          { t: T22.NAME, x: TG22.name.x, y: TG22.name.y, click: true, label: '프로젝트 이름' },
          { t: T22.NAME + 0.15, x: TG22.name.x, y: TG22.name.y, hide: true },
          { t: T22.GEN, x: TG22.gen.x, y: TG22.gen.y, click: true, label: 'DB 비밀번호 생성' },
          { t: T22.REGION, x: TG22.region.x, y: TG22.region.y, click: true, label: '지역: 서울' },
          { t: T22.CREATE, x: TG22.create.x, y: TG22.create.y, click: true, label: 'Create new project' },
        ]}
      />
    </>
  );
}

/* ═══════════════════ S26 — 시연: Codex에 Supabase 플러그인 설치 ═══════════════════ */
const T26 = { CMD: 0.4, INST: 2.9, CODEX: 3.4, HEAD: 3.9, ASK: 4.3, OAUTH: 6.3, PICK: 6.9, AUTH: 7.5, APPROVE: 8.2, ALLOW: 8.8, RESULT: 9.2, OK: 9.7, END: 11.2 };
const INSTALL = 'codex plugin add supabase@openai-curated-remote';
const ASK26 = '내 Supabase 프로젝트 목록을 보여 줘';
const TG26 = { /* measure_pointer.mjs 실측 2026-10-28 */
  pick: { x: 53.13, y: 49.77 },
  auth: { x: 53.18, y: 56.49 },
  allow: { x: 37.6, y: 47.74 },
};
export function PluginWalk() {
  const t = useSceneTime();
  const askDone = typedDoneAt(ASK26, T26.ASK, 14) + 0.3;
  const kit = interpolate(t, [T26.INST - 0.6, T26.INST], [0, 1], easeInOut);
  const oauth = t >= T26.OAUTH && t < T26.AUTH + 0.4;
  return (
    <>
      <WalkHead kicker="시연 · 터미널" title={<>Codex에 <span style={{ color: C.teal }}>Supabase 플러그인</span> 설치</>} />
      <div style={{ ...abs(1500, 60) }}><Chip color={C.mute} size={18}>시연</Chip></div>
      {/* 키트 상자 — 설치 순간 터미널로 들어간다 */}
      <div style={{ ...abs(110 + kit * 640, 380 + kit * 80, 420 * (1 - kit * 0.7)), opacity: 1 - kit }}>
        <img src={`${SVG}/kit-box.svg`} alt="플러그인 상자" style={{ width: '100%', display: 'block' }} />
      </div>
      {t < T26.INST && <div style={{ ...abs(110, 720, 420), ...small, textAlign: 'center' }}>25장의 그 상자 — 한 줄로 들인다</div>}
      {t >= T26.INST && (
        <div style={{ ...abs(110, 360, 470), ...riseIn(t, T26.INST, 0.6) }}>
          <div style={{ ...kick, fontSize: 14 }}>세 단계</div>
          {[
            { k: '① 설치', d: '터미널 한 줄 (또는 Codex 안에서 /plugins)', on: t >= T26.INST },
            { k: '② 처음 한 번 허용', d: '브라우저에서 Supabase 로그인 · 연습용 프로젝트만', on: t >= T26.AUTH },
            { k: '③ 확인', d: 'Codex가 Supabase 도구를 쓴다', on: t >= T26.OK },
          ].map((s) => (
            <div key={s.k} style={{ ...solid, padding: '14px 18px', marginTop: 14, borderColor: s.on ? C.teal : 'var(--hair)' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.on ? C.teal : C.mute }}>{s.on ? '✓ ' : ''}{s.k}</div>
              <div style={{ ...small, fontSize: 17, marginTop: 4 }}>{s.d}</div>
            </div>
          ))}
        </div>
      )}
      <AppWindow kind="terminal" title="PowerShell — vibe" badge="②" style={{ ...abs(640, 160, 1180, 820), ...popIn(t, 0.05) }} bodyStyle={{ padding: 0, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ ...tl, fontWeight: 800, color: C.ink }}>{typed(t, INSTALL, T26.CMD, 22)}{t < T26.INST && t > T26.CMD && <Caret color={C.teal} />}</div>
          {t >= T26.INST && <div style={{ ...tl, color: C.teal, fontWeight: 800, opacity: fadeIn(t, T26.INST) }}>✓ Installed supabase@openai-curated-remote (MCP 서버 1 · 스킬 2)</div>}
          {t >= T26.CODEX && <div style={{ ...tl, fontWeight: 800, marginTop: 10 }}>{typed(t, 'codex', T26.CODEX, 10)}</div>}
          {t >= T26.HEAD && <div style={{ ...tl, fontSize: 16, color: C.mute }}>{'>_ OpenAI Codex   directory: ~\\Documents\\vibe'}</div>}
          {t >= askDone && (
            <div style={{ display: 'flex', gap: 10 }}>
              <Chip color={C.violet} solidFill size={14}>나</Chip>
              <span style={{ ...tl, color: C.violet, fontWeight: 800 }}>{ASK26}</span>
            </div>
          )}
          {t >= T26.OAUTH - 0.2 && t < T26.APPROVE && <div style={{ ...tl, color: C.mute, opacity: fadeIn(t, T26.OAUTH - 0.2) }}>supabase에 처음 연결합니다 — 브라우저에서 허용해 주세요…</div>}
          {t >= T26.APPROVE && (
            <div style={{ ...solid, padding: '16px 20px', borderColor: C.violet, opacity: fadeIn(t, T26.APPROVE), maxWidth: 820 }}>
              <div style={{ ...tl, fontWeight: 800 }}>도구를 실행할까요?  supabase · list_projects</div>
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <span data-pt="s26-allow" style={{ padding: '8px 18px', borderRadius: 8, background: C.violet, color: C.white, fontWeight: 800, fontSize: 18, ...ring(t, T26.ALLOW) }}>허용</span>
                <span style={{ padding: '8px 18px', borderRadius: 8, border: '2px solid var(--hair)', fontWeight: 700, fontSize: 18, color: C.mute }}>거절</span>
              </div>
            </div>
          )}
          {t >= T26.RESULT && (
            <div style={{ display: 'flex', gap: 10, opacity: fadeIn(t, T26.RESULT) }}>
              <Chip color={C.teal} size={14}>Codex</Chip>
              <span style={{ ...tl, color: C.ink }}>프로젝트 1개: guestbook-demo (Northeast Asia (Seoul))</span>
            </div>
          )}
          {t >= T26.OK && <div style={{ opacity: fadeIn(t, T26.OK) }}><Note color={C.teal}>연결 확인 — Codex가 Supabase 도구를 쓴다 ✓ (유리벽이 사라졌다)</Note></div>}
        </div>
        <div style={{ margin: '0 16px 16px', padding: '14px 18px', borderRadius: 12, border: `1.5px solid ${t >= T26.ASK && t < askDone ? C.violet : 'var(--hair)'}`, ...tl, color: t >= T26.ASK && t < askDone ? C.violet : C.faint, fontWeight: 700 }}>
          {t >= T26.ASK && t < askDone ? <>{typed(t, ASK26, T26.ASK, 14)}<Caret color={C.violet} /></> : t >= T26.HEAD ? 'Codex에게 말하기…' : ''}
        </div>
      </AppWindow>
      {oauth && (
        <AppWindow kind="browser" url="supabase.com/dashboard/authorize" badge="③" style={{ ...abs(700, 330, 640, 420), ...popIn(t, T26.OAUTH), zIndex: 3 }} bodyStyle={{ padding: '24px 30px' }}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>Authorize Codex</div>
          <div style={{ ...small, marginTop: 6 }}>Codex가 내 Supabase에 접근하도록 허용</div>
          <div style={{ fontSize: 17, fontWeight: 700, marginTop: 20 }}>Organization · mintcode07's Org</div>
          <div data-pt="s26-pick" style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 10, padding: '10px 14px', borderRadius: 10, border: `2px solid ${t >= T26.PICK ? C.teal : 'var(--hair)'}`, ...ring(t, T26.PICK, C.teal) }}>
            <span style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${C.ink}`, display: 'grid', placeItems: 'center', background: t >= T26.PICK ? C.teal : 'transparent', color: C.white, fontSize: 15, fontWeight: 900 }}>{t >= T26.PICK ? '✓' : ''}</span>
            <span style={{ ...mono, fontSize: 19 }}>guestbook-demo</span>
            <Chip color={C.teal} size={14}>연습용만</Chip>
          </div>
          <div style={{ marginTop: 22 }}><Btn pt="s26-auth" color={C.teal} t={t} at={T26.AUTH} w={580}>Authorize</Btn></div>
        </AppWindow>
      )}
      <div style={{ ...abs(110, 990) }}>
        <LinkButton href="https://developers.openai.com/codex/plugins" size={17} color={C.teal}>Codex 플러그인 문서 ↗</LinkButton>
      </div>
      <Pointer
        timelineEnd={T26.END}
        color={C.teal}
        path={[
          { t: 6.4, x: 60, y: 40 },
          { t: T26.PICK, x: TG26.pick.x, y: TG26.pick.y, click: true, label: '연습용 프로젝트만' },
          { t: T26.AUTH, x: TG26.auth.x, y: TG26.auth.y, click: true, label: 'Authorize' },
          { t: T26.ALLOW, x: TG26.allow.x, y: TG26.allow.y, click: true, label: '도구 허용' },
        ]}
      />
    </>
  );
}

/* ═══════════════════ S27 — 시연: 말로 방명록에 데이터베이스 붙이기 ═══════════════════ */
const T27 = { INPUT: 0.5, SEND: 1.4, AP1: 2.2, AL1: 2.9, R1: 3.3, AP2: 4.0, AL2: 4.6, R2: 5.0, FILES: 5.7, CHECK: 6.5, PUSH: 7.3, SHIFT: 8.8, PHONE: 9.3, FF: 9.7, NAMEF: 10.6, MSG: 11.3, SUBMIT: 12.3, ROW: 12.7, TABLE: 13.2, CHALK: 13.9, END: 15.4 };
const TG27 = { /* measure_pointer.mjs 실측 2026-10-28 */
  input: { x: 47.4, y: 82.04 },
  al1: { x: 22.11, y: 31.75 },
  al2: { x: 22.11, y: 48.28 },
  namef: { x: 84.9, y: 51.2 },
  submit: { x: 79.67, y: 60.42 },
};
type Line = { at: number; node: ReactNode; tag?: { label: string; until: number } };
export function GuestbookWalk() {
  const t = useSceneTime();
  const shift = interpolate(t, [T27.SHIFT, T27.SHIFT + 0.5], [0, 1], easeInOut);
  const nameV = typed(t, '민지', T27.NAMEF + 0.2, 6);
  const msgV = typed(t, '잘 봤어!', T27.MSG, 8);
  const posted = t >= T27.ROW;
  const approval = (at: number, allowAt: number, tool: string, desc: string, pt: string) => (
    <div style={{ ...solid, padding: '12px 18px', borderColor: C.violet, maxWidth: 860 }}>
      <div style={{ ...tl, fontSize: 18, fontWeight: 800 }}>도구를 실행할까요?  supabase · {tool}</div>
      <div style={{ ...small, fontSize: 16 }}>{desc}</div>
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <span data-pt={pt} style={{ padding: '6px 16px', borderRadius: 8, background: t >= allowAt ? C.teal : C.violet, color: C.white, fontWeight: 800, fontSize: 17, ...ring(t, allowAt) }}>{t >= allowAt ? '허용함 ✓' : '허용'}</span>
        <span style={{ padding: '6px 16px', borderRadius: 8, border: '2px solid var(--hair)', fontWeight: 700, fontSize: 17, color: C.mute }}>거절</span>
      </div>
    </div>
  );
  const lines: Line[] = [
    { at: T27.SEND, node: <div style={{ display: 'flex', gap: 10 }}><Chip color={C.violet} solidFill size={13}>나</Chip><span style={{ ...tl, fontSize: 17, color: C.violet, fontWeight: 800 }}>[Pasted Content {GUESTBOOK_PROMPT.length} chars] — 표 · RLS · 공개 키만 · CDN · 보안 점검 · 커밋·푸시</span></div> },
    { at: T27.AP1, node: approval(T27.AP1, T27.AL1, 'apply_migration', 'guestbook 표 만들기 + RLS 켜기 + 정책 2개(읽기·쓰기 누구나)', 's27-al1'), tag: { label: '17장 표 · 20장 RLS', until: T27.R1 + 0.5 } },
    { at: T27.R1, node: <span style={{ ...tl, fontSize: 17, color: C.teal, fontWeight: 800 }}>✓ guestbook 표를 만들었습니다 · RLS 켬 · 정책 2개</span> },
    { at: T27.AP2, node: approval(T27.AP2, T27.AL2, 'get_publishable_keys', '공개 키 가져오기', 's27-al2'), tag: { label: '19장 공개 키', until: T27.R2 + 0.5 } },
    { at: T27.R2, node: <span style={{ ...tl, fontSize: 17, color: C.teal, fontWeight: 800 }}>✓ 공개 키만 가져왔습니다. 비밀 키는 쓰지 않습니다</span> },
    { at: T27.FILES, node: <span style={{ ...tl, fontSize: 17 }}>✎ index.html 수정 — 방명록 칸 · 목록 · supabase-js CDN 스크립트</span> },
    { at: T27.CHECK, node: <span style={{ ...tl, fontSize: 17, color: C.teal, fontWeight: 800 }}>✓ 보안 점검: guestbook RLS 켜짐 · 정책 2개 · 비밀 키 없음</span> },
    { at: T27.PUSH, node: <span style={{ ...tl, fontSize: 17, color: C.violet, fontWeight: 800 }}>✓ 커밋 «방명록 추가 (Supabase)» · 푸시</span>, tag: { label: '6장 푸시', until: T27.SHIFT } },
  ];
  const shownTag = lines.find((l) => l.tag && t >= l.at && t < l.tag.until);
  return (
    <>
      <WalkHead kicker="시연 · 부탁 한 번" title={<>말로 방명록에 <span style={{ color: C.teal }}>데이터베이스</span> 붙이기</>} />
      <div style={{ ...abs(1500, 60) }}><Chip color={C.mute} size={18}>시연</Chip></div>
      {/* 터미널 — 5단계부터 뒤로 물러난다 */}
      <AppWindow
        kind="terminal"
        title="PowerShell — vibe"
        badge="①"
        style={{
          ...abs(330, 150, 1160, 790),
          ...popIn(t, 0.05),
          transform: `translate(${-shift * 220}px, ${shift * 20}px) scale(${1 - shift * 0.25})`,
          transformOrigin: 'left top',
          filter: shift > 0 ? `brightness(${1 - shift * 0.4}) saturate(${1 - shift * 0.5})` : undefined,
        }}
        bodyStyle={{ padding: 0, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
      >
        <div style={{ flex: 1, padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
          {lines.filter((l) => t >= l.at).map((l, i) => <div key={i} style={{ opacity: fadeIn(t, l.at) }}>{l.node}</div>)}
        </div>
        <div data-pt="s27-input" style={{ margin: '0 16px 16px', padding: '12px 16px', borderRadius: 12, border: `1.5px solid ${t >= T27.INPUT && t < T27.SEND ? C.violet : 'var(--hair)'}`, ...tl, fontSize: 16, color: t >= T27.INPUT && t < T27.SEND ? C.violet : C.faint, fontWeight: 700, maxHeight: 76, overflow: 'hidden', ...ring(t, T27.INPUT) }}>
          {t >= T27.INPUT && t < T27.SEND ? <>{GUESTBOOK_PROMPT.slice(0, 120)}…<Caret color={C.violet} /></> : 'Codex에게 말하기…'}
        </div>
      </AppWindow>
      {shownTag?.tag && (
        <div style={{ ...abs(1510, 300), ...riseIn(t, shownTag.at, 0.4) }}>
          <Chip color={C.ink} solidFill size={20}>↩ {shownTag.tag.label}</Chip>
        </div>
      )}
      {/* 폰 */}
      {t >= T27.PHONE - 0.1 && (
        <div style={{ ...abs(1470, 280), ...popIn(t, T27.PHONE), zIndex: 3 }}>
          <Phone w={320} h={640} url="mintcode07.github.io/vibe-site/">
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: 150 }}><MiniPage scale={0.9} /></div>
              <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <b style={{ fontSize: 17 }}>방명록</b>
                <div data-pt="s27-namef" style={{ height: 34, borderRadius: 6, border: `1.5px solid ${t >= T27.NAMEF && !posted ? C.violet : 'var(--hair)'}`, display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: 15, ...ring(t, T27.NAMEF) }}>{posted ? '' : nameV || <span style={{ color: C.faint }}>이름</span>}</div>
                <div style={{ height: 50, borderRadius: 6, border: '1.5px solid var(--hair)', padding: '6px 8px', fontSize: 15 }}>{posted ? '' : msgV || <span style={{ color: C.faint }}>남길 말</span>}</div>
                <span data-pt="s27-submit" style={{ alignSelf: 'flex-start', padding: '6px 16px', borderRadius: 8, background: C.teal, color: C.white, fontWeight: 800, fontSize: 15, ...ring(t, T27.SUBMIT, C.teal) }}>등록</span>
                {posted && (
                  <div style={{ marginTop: 6, padding: '8px 10px', borderRadius: 8, background: 'color-mix(in srgb, #1f9e7a 10%, #fffdf8)', border: `1.5px solid ${C.teal}`, fontSize: 15, ...riseIn(t, T27.ROW, 0.4) }}>
                    <b>민지</b> · 잘 봤어!
                  </div>
                )}
              </div>
            </div>
          </Phone>
        </div>
      )}
      <Ff t={t} at={T27.FF} label="1~2분 — Pages에 반영" style={{ left: 1190, top: 960 }} />
      {/* Supabase 표 창 */}
      {t >= T27.TABLE - 0.1 && (
        <AppWindow kind="browser" url="supabase.com/dashboard/project/…/editor" badge="③" style={{ ...abs(130, 590, 980, 360), ...popIn(t, T27.TABLE), zIndex: 3 }} bodyStyle={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 22, fontWeight: 800 }}>Table Editor · guestbook</span>
            <Chip color={C.teal} size={15}>RLS enabled</Chip>
          </div>
          <div style={{ marginTop: 16, borderRadius: 10, overflow: 'hidden', border: '1.5px solid var(--hair)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 160px 1fr 200px', background: 'color-mix(in srgb, #1f2430 6%, #fffdf8)', ...mono, fontSize: 17, fontWeight: 800 }}>
              {['id', 'name', 'message', 'created_at'].map((h) => <div key={h} style={{ padding: '10px 12px', borderRight: '1px solid var(--hair-2)' }}>{h}</div>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 160px 1fr 200px', fontSize: 19, background: `color-mix(in srgb, #1f9e7a ${12 + 18 * clickFlash(t, T27.TABLE + 0.3, 1.0)}%, #fffdf8)` }}>
              {['1', '민지', '잘 봤어!', '방금'].map((c, i) => <div key={i} style={{ padding: '12px 12px', borderRight: '1px solid var(--hair-2)', ...(i === 0 ? mono : {}) }}>{c}</div>)}
            </div>
          </div>
          <div style={{ ...small, marginTop: 12 }}>새로고침해도 그대로 남아 있다</div>
        </AppWindow>
      )}
      {t >= T27.CHALK && (
        <div style={{ ...abs(130, 960), ...riseIn(t, T27.CHALK, 0.5), zIndex: 4 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderRadius: 12, background: C.ink, color: '#f4efe6', fontSize: 21, fontWeight: 800 }}>
            <span style={{ width: 46, height: 28, borderRadius: 4, background: '#2c3442', border: '2px solid #8a7f6a' }} />
            16장 칠판의 글 — 이제 안 지워진다
          </span>
        </div>
      )}
      <Pointer
        timelineEnd={T27.END}
        path={[
          { t: 0.2, x: 50, y: 70 },
          { t: T27.INPUT, x: TG27.input.x, y: TG27.input.y, click: true, label: '부탁 붙여넣기' },
          { t: T27.INPUT + 0.2, x: TG27.input.x, y: TG27.input.y, hide: true },
          { t: T27.AL1, x: TG27.al1.x, y: TG27.al1.y, click: true, label: '표 만들기 허용' },
          { t: T27.AL2, x: TG27.al2.x, y: TG27.al2.y, click: true, label: '공개 키 허용' },
          { t: T27.AL2 + 0.3, x: TG27.al2.x, y: TG27.al2.y, hide: true },
          { t: T27.NAMEF, x: TG27.namef.x, y: TG27.namef.y, click: true, label: '친구가 방명록에' },
          { t: T27.NAMEF + 0.2, x: TG27.namef.x, y: TG27.namef.y, hide: true },
          { t: T27.SUBMIT, x: TG27.submit.x, y: TG27.submit.y, click: true, label: '등록' },
        ]}
      />
    </>
  );
}
