import type { CSSProperties, ReactNode } from 'react';
import Build from '../../../../src/deck/Build';
import { useDeck } from '../../../../src/deck/DeckContext';
import { useSceneTime, interpolate, spring, riseIn, easeInOut } from '../../../../src/scene';
import { typed } from '../../../../src/walkthrough';
import {
  abs, BASE, C, SVG, COLLAB, DECK11, kick, h1, body, small, mono, solid, Header, Term, Chip, Code, Note,
  Arrow, CommitDot, MiniPage, Phone, Mark, Pet, CopyButton, QrLink,
} from './shared';
import { CARDS } from './cards';

/* ═══════════════════ S11 — 에이전트와 일하는 커밋 습관 (build 4 · 복사 카드) ═══════════════════ */
export function CardsSlide() {
  const Y = [196, 290, 384, 498, 680];
  return (
    <>
      <Header kicker="부탁 카드 — 실습 때 복사해서 쓴다" title="에이전트와 일하는 커밋 습관" size={48} />
      {CARDS.map((c, i) => {
        const big = c.when === 'always';
        return (
          <Build key={c.n} at={big ? 2 : 1} style={{ ...abs(140 + i * 26, Y[i], 1060 - i * 26) }}>
            <div style={{ ...solid, padding: big ? '18px 24px' : '12px 20px', borderColor: big ? C.violet : 'var(--hair)', borderWidth: big ? 2.5 : 1.5, background: big ? 'color-mix(in srgb, #6c4cf0 6%, #fffdf8)' : '#fffdf8', display: 'flex', gap: 18, alignItems: 'center' }}>
              <span style={{ ...mono, fontSize: big ? 30 : 22, fontWeight: 900, color: big ? C.violet : C.mute, width: 36, textAlign: 'center' }}>{c.n}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <b style={{ fontSize: big ? 26 : 21 }}>{c.title}</b>
                  <Chip color={big ? C.violet : C.mute} size={14}>{big ? '매번' : '오늘 한 번'}</Chip>
                </div>
                <div style={{ fontSize: big ? 19 : 15.5, lineHeight: 1.45, color: big ? C.ink : 'var(--fg-muted)', marginTop: 4, wordBreak: 'keep-all', ...(big ? {} : { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }) }}>{c.text}</div>
              </div>
              <CopyButton text={c.text} size={big ? 18 : 15} color={big ? C.violet : C.mute} />
            </div>
          </Build>
        );
      })}
      <Build at={3} style={{ ...abs(1290, 210, 520) }}>
        <div style={{ ...h1, fontSize: 150, color: C.violet, letterSpacing: '-0.05em' }}>1,238</div>
        <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>spacekijun 저장소의 커밋 수</div>
        <div style={{ ...small, marginTop: 6 }}>이 수업 사이트와 다마고찌를 만든 선생님 프로젝트 (2026-10-28)</div>
        <svg width="500" height="60" viewBox="0 0 500 60" style={{ marginTop: 24 }} aria-hidden>
          <line x1="6" y1="30" x2="494" y2="30" stroke={C.violetSoft} strokeWidth="6" strokeLinecap="round" />
          {Array.from({ length: 70 }, (_, i) => (
            <circle key={i} cx={8 + i * 7} cy={30} r={2.6} fill={C.violet} />
          ))}
        </svg>
        <div style={{ ...small, fontSize: 16 }}>점은 실제 개수가 아니라 촘촘함의 표시</div>
        <div style={{ fontSize: 24, fontWeight: 800, marginTop: 26, wordBreak: 'keep-all' }}>되돌아갈 수 있는 자리가 1,238개</div>
      </Build>
      <Build at={4} style={{ ...abs(140, 900, 1660) }}>
        <div style={{ display: 'flex', gap: 22, alignItems: 'center', padding: '16px 24px', borderRadius: 16, border: `2.5px solid ${C.warn}`, background: 'color-mix(in srgb, #e0573b 7%, #fffdf8)' }}>
          <b style={{ fontSize: 25, color: C.warn, whiteSpace: 'nowrap' }}>올리지 말 것</b>
          <span style={{ fontSize: 22, fontWeight: 700 }}>비밀번호 · 비밀 키 · 개인 정보가 든 파일</span>
          <span style={{ fontSize: 22 }}>→</span>
          <Term term=".gitignore" gloss="올리지 않을 파일 목록 — 여기 넣어 달라고 한다" color={C.warn} style={{ padding: '8px 16px' }} />
        </div>
      </Build>
    </>
  );
}

/* ═══════════════════ S12 — GitHub Pages: 창고 문을 진열창으로 (scene) ═══════════════════ */
const SITE12 = 'https://mintcode07.github.io/vibe-site/';
export function ShopScene() {
  const t = useSceneTime();
  const roll = interpolate(t, [0.5, 1.8], [0, 1], easeInOut);
  const W = { x: 600, y: 360, w: 720, h: 400 };
  const people = [-1, 0, 1].map((k, i) => interpolate(t, [2.6 + i * 0.15, 3.4 + i * 0.15], [k < 0 ? -260 : k > 0 ? 260 : 0, 0], easeInOut));
  const urlV = typed(t, SITE12, 2.0, 30);
  return (
    <>
      <div style={{ ...abs(140, 60, 900) }}>
        <div style={kick}>GitHub Pages</div>
        <h2 style={{ ...h1, fontSize: 52, marginTop: 10 }}>창고 문을 <span style={{ color: C.violet }}>진열창</span>으로</h2>
      </div>
      <div style={{ ...abs(1400, 70, 400), ...riseIn(t, 0.3) }}>
        <Chip color={C.mute} size={17}>지난 시간: 호스팅 = 건물 임대</Chip>
      </div>
      {/* 창고 */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }} aria-hidden>
        <path d={`M${W.x - 80} ${W.y - 10} L${W.x + W.w / 2} ${W.y - 150} L${W.x + W.w + 80} ${W.y - 10} Z`} fill="#c9a77a" stroke={C.ink} strokeWidth="4" strokeLinejoin="round" />
        <rect x={W.x - 60} y={W.y - 10} width={W.w + 120} height={W.h + 60} fill="#e6d6b8" stroke={C.ink} strokeWidth="4" />
        <rect x={W.x} y={W.y + 40} width={W.w} height={W.h - 20} fill="#cfe3ef" stroke={C.ink} strokeWidth="3" />
        <path d={`M${W.x + 40} ${W.y + 340} L${W.x + 200} ${W.y + 60} M${W.x + 110} ${W.y + 360} L${W.x + 270} ${W.y + 80}`} stroke="#ffffff" strokeWidth="8" opacity=".55" strokeLinecap="round" />
        <path d={`M0 ${W.y + W.h + 50} L1920 ${W.y + W.h + 50}`} stroke={C.ink} strokeWidth="3" />
      </svg>
      {/* 진열창 안 내 페이지 */}
      <div style={{ ...abs(W.x + 200, W.y + 80, 320, 240), border: `3px solid ${C.ink}`, borderRadius: 10, overflow: 'hidden', background: '#fff', opacity: roll }}>
        <MiniPage scale={1.3} />
      </div>
      <div style={{ ...abs(W.x + 540, W.y + 250), opacity: interpolate(t, [3.0, 3.3], [0, 1]) }}>
        <Chip color={C.violet} size={18}><span style={mono}>index.html</span> = 첫 화면</Chip>
      </div>
      {/* 셔터 */}
      <div style={{ ...abs(W.x, W.y + 40, W.w, (W.h - 20) * (1 - roll)), overflow: 'hidden', background: '#9aa7b4', borderBottom: roll < 1 ? `4px solid ${C.ink}` : 'none' }}>
        {Array.from({ length: 20 }, (_, i) => <div key={i} style={{ height: 3, background: C.ink, opacity: 0.25, marginTop: 17 }} />)}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 20, textAlign: 'center', fontSize: 26, fontWeight: 800, color: C.ink }}>vibe-site 저장소</div>
      </div>
      {/* 간판 */}
      <div style={{ ...abs(W.x - 60, W.y - 110, W.w + 120), textAlign: 'center', opacity: interpolate(t, [1.8, 2.0], [0, 1]) }}>
        <div style={{ display: 'inline-block', padding: '12px 24px', borderRadius: 12, background: C.ink, color: '#fffdf8', ...mono, fontSize: 28, fontWeight: 800, minWidth: 600 }}>
          {urlV.length <= 8 ? urlV : (
            <>
              {'https://'}
              <span style={{ color: C.violetSoft, textDecoration: 'underline' }}>{urlV.slice(8, 18)}</span>
              {urlV.slice(18, 29)}
              <span style={{ color: C.violetSoft, textDecoration: 'underline' }}>{urlV.slice(29, 38)}</span>
              {urlV.slice(38)}
            </>
          )}
        </div>
      </div>
      <div style={{ ...abs(W.x + 40, W.y - 44), display: 'flex', gap: 220, opacity: interpolate(t, [3.0, 3.3], [0, 1]) }}>
        <Chip color={C.violet} solidFill size={16}>사용자 이름</Chip>
        <Chip color={C.violet} solidFill size={16}>저장소 이름</Chip>
      </div>
      {/* 폰 셋 */}
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ ...abs(720 + i * 200 + people[i], W.y + W.h + 62), opacity: interpolate(t, [2.6 + i * 0.15, 2.9 + i * 0.15], [0, 1]) }}>
          <Phone w={96} h={164} style={{ borderRadius: 18, padding: '16px 7px 10px' }}><MiniPage scale={0.4} /></Phone>
        </div>
      ))}
      <div style={{ ...abs(140, 860, 440), ...riseIn(t, 1.0) }}>
        <Term term="GitHub Pages" gloss="저장소의 웹 파일을 주소로 열어 주는 GitHub 기능" />
        <div style={{ ...small, marginTop: 10 }}>푸시하면 1~2분 뒤 사이트에 반영된다</div>
      </div>
    </>
  );
}

/* ═══════════════════ S14 — 안 열릴 때 보는 표 (static) ═══════════════════ */
function Sym({ kind }: { kind: 0 | 1 | 2 | 3 }) {
  const s = { stroke: C.ink, strokeWidth: 3, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  return (
    <svg width="90" height="70" viewBox="0 0 90 70" aria-hidden>
      {kind === 0 && <text x="45" y="48" textAnchor="middle" fontSize="34" fontWeight="900" fill={C.warn} fontFamily="var(--font-mono)">404</text>}
      {kind === 1 && (<><rect x="10" y="10" width="54" height="50" rx="6" {...s} /><circle cx="66" cy="44" r="16" {...s} fill="#fffdf8" /><path d="M66 36 L66 44 L72 48" {...s} /></>)}
      {kind === 2 && (<><rect x="10" y="20" width="62" height="28" rx="6" {...s} stroke={C.faint} /><path d="M58 30 L63 36 L68 30" {...s} stroke={C.faint} /><rect x="68" y="34" width="16" height="14" rx="3" fill={C.warn} stroke={C.ink} strokeWidth="2" /><path d="M71 34 L71 29 C71 24 81 24 81 29 L81 34" {...s} strokeWidth={2} /></>)}
      {kind === 3 && (<><rect x="14" y="10" width="60" height="50" rx="4" {...s} /><path d="M14 46 L34 30 L46 40 L58 28 L74 42" {...s} stroke={C.faint} /><path d="M20 16 L68 54 M68 16 L20 54" {...s} stroke={C.warn} /></>)}
    </svg>
  );
}
const ROWS14: { kind: 0 | 1 | 2 | 3; sym: string; cause: string; fix: string }[] = [
  { kind: 0, sym: '주소를 열면 404', cause: '첫 화면 파일 이름이 index.html이 아니거나, 폴더 안쪽에 있다', fix: '첫 페이지 이름을 index.html로 바꾸고 저장소 맨 위에 두고 푸시해 줘' },
  { kind: 1, sym: '고쳤는데 사이트가 그대로', cause: '푸시를 안 했다 · 아직 1~2분이 안 지났다 · 브라우저가 옛 화면을 기억한다', fix: '푸시 확인 → 기다리기 → Ctrl+F5 (강력 새로고침)' },
  { kind: 2, sym: 'Pages에서 브랜치를 못 고른다', cause: '저장소가 비공개(Private) — 무료 계정은 공개 저장소만', fix: 'Settings 맨 아래에서 Public으로 바꾸기' },
  { kind: 3, sym: '그림이 깨진다', cause: '그림 파일을 안 올렸다 · 파일 이름이 한글이거나 띄어쓰기가 있다', fix: '그림 파일도 커밋했는지 확인하고, 파일 이름을 영문으로 바꿔 줘' },
];
export function TroubleSlide() {
  return (
    <>
      <Header kicker="자주 하는 실수 — 실습 중에 다시 띄운다" title="안 열릴 때 보는 표" />
      <div style={{ ...abs(140, 210, 1280), ...solid, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '110px 280px 1fr 1fr', background: 'color-mix(in srgb, #1f2430 6%, #fffdf8)', fontSize: 18, fontWeight: 800, color: C.mute }}>
          <div style={{ padding: '12px 16px' }} />
          <div style={{ padding: '12px 16px' }}>증상</div>
          <div style={{ padding: '12px 16px' }}>원인</div>
          <div style={{ padding: '12px 16px', color: C.violet }}>Codex에게 이렇게 부탁</div>
        </div>
        {ROWS14.map((r) => (
          <div key={r.sym} style={{ display: 'grid', gridTemplateColumns: '110px 280px 1fr 1fr', borderTop: '1px solid var(--hair-2)', alignItems: 'center', minHeight: 150 }}>
            <div style={{ display: 'grid', placeItems: 'center' }}><Sym kind={r.kind} /></div>
            <div style={{ padding: '14px 16px', fontSize: 23, fontWeight: 800, wordBreak: 'keep-all' }}>{r.sym}</div>
            <div style={{ padding: '14px 16px', fontSize: 19, lineHeight: 1.45, color: 'var(--fg-muted)', wordBreak: 'keep-all' }}>{r.cause}</div>
            <div style={{ padding: '14px 16px', fontSize: 19, lineHeight: 1.45, fontWeight: 700, color: C.violet, wordBreak: 'keep-all' }}>{r.fix}</div>
          </div>
        ))}
      </div>
      <div style={{ ...abs(1470, 210, 330, 830), borderRadius: 22, background: C.violet, color: C.white, padding: '40px 32px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 700, opacity: 0.85 }}>먼저 물어볼 것</div>
        <div style={{ ...h1, color: C.white, fontSize: 76, marginTop: 14 }}>푸시<br />했나?</div>
        <div style={{ fontSize: 20, lineHeight: 1.5, marginTop: 24, opacity: 0.9, wordBreak: 'keep-all' }}>커밋만 하고 푸시를 안 한 경우가 가장 많다</div>
      </div>
    </>
  );
}

/* ═══════════════════ S15 — 실습: 내 페이지를 세상에 걸기 (activity) ═══════════════════ */
const STEPS15 = [
  { s: 'GitHub 가입 — 사용자 이름 신중히', ref: 'S7', sub: '퍼즐이 계속 실패하거나 메일이 안 열리면 폰 데이터로 가입' },
  { s: 'Codex에게 Git 설치 (카드 1)', ref: 'S8·S11', sub: '설치 뒤 터미널을 새로 열고 codex 다시 실행 → 이름표 (카드 2)' },
  { s: 'GitHub에 공개 저장소 vibe-site → 주소 복사', ref: 'S9', sub: '' },
  { s: 'Codex에게 첫 커밋과 푸시 (카드 3)', ref: 'S10', sub: '첫 푸시 때 브라우저 로그인 허용' },
  { s: 'Settings → Pages → main → Save', ref: 'S13', sub: '1~2분 기다려 주소 확인' },
  { s: '협업보드에 새 노트로 주소 올리기', ref: '', sub: '제목: 이름 · 사이트 이름 / 내용: Pages 주소' },
  { s: '친구 주소를 내 폰으로 열고 댓글 한 줄', ref: '', sub: '' },
];
export function PracticeSlide() {
  return (
    <>
      <Header kicker="실습" title="내 페이지를 세상에 걸기" />
      <div style={{ ...abs(140, 196, 1000) }}>
        {STEPS15.map((s, i) => {
          const col = i >= 5 ? C.teal : C.violet;
          return (
            <div key={i} style={{ display: 'flex', gap: 20, alignItems: 'flex-start', minHeight: 110, position: 'relative' }}>
              {i < STEPS15.length - 1 && <i style={{ position: 'absolute', left: 25, top: 52, bottom: -6, width: 3, background: 'var(--hair)' }} />}
              <span style={{ width: 52, height: 52, borderRadius: '50%', border: `4px solid ${col}`, background: '#fffdf8', display: 'grid', placeItems: 'center', ...mono, fontSize: 22, fontWeight: 900, color: col, flexShrink: 0, position: 'relative' }}>{i + 1}</span>
              <div style={{ paddingTop: 6 }}>
                <div style={{ fontSize: 25, fontWeight: 800, wordBreak: 'keep-all' }}>
                  {s.s} {s.ref && <span style={{ fontSize: 17, color: C.faint, fontWeight: 700 }}>{s.ref}</span>}
                </div>
                {s.sub && <div style={{ ...small, fontSize: 18, marginTop: 2 }}>{s.sub}</div>}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ ...abs(1180, 200, 640), display: 'flex', flexDirection: 'column', gap: 60 }}>
        <QrLink img={`${BASE}/images/cards-qr.png`} title="11번 장: 부탁 카드 복사" href={DECK11} btn="부탁 카드 장 열기 ↗" />
        <QrLink img={`${BASE}/images/collab-qr.png`} title="협업보드에 올리기" href={COLLAB} btn="협업보드 열기 ↗" color={C.teal} />
      </div>
      <div style={{ ...abs(1180, 880, 640), display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <Chip color={C.ink} size={20}>막히면 14번 장 표</Chip>
        <Chip color={C.warn} solidFill size={20}>관리자 암호 창 = 무조건 손 들기</Chip>
      </div>
    </>
  );
}

/* ═══════════════════ S16 — 친구가 남긴 글은 어디로 가나 (scene · 칠판과 지우개) ═══════════════════ */
export const CHALK = [
  { name: '민지', msg: '잘 봤어!' },
  { name: '서연', msg: '버튼 귀엽다' },
  { name: '하윤', msg: '나도 만들래' },
];
export function ChalkScene() {
  const t = useSceneTime();
  const B = { x: 760, y: 250, w: 1020, h: 520 };
  const ex = interpolate(t, [2.6, 3.3], [B.x - 160, B.x + B.w + 20], easeInOut);
  const cut = Math.max(0, ex + 120 - B.x);
  const spin = interpolate(t, [2.2, 2.6], [0, 360]);
  return (
    <>
      <div style={{ ...abs(140, 60, 1200) }}>
        <div style={kick}>정적 사이트의 한계</div>
        <h2 style={{ ...h1, fontSize: 52, marginTop: 10 }}>친구가 남긴 글은 <span style={{ color: C.teal }}>어디로</span> 가나</h2>
      </div>
      {/* 작은 진열창 */}
      <div style={{ ...abs(140, 300, 500, 400), ...riseIn(t, 0.1) }}>
        <svg width="500" height="400" viewBox="0 0 500 400" aria-hidden>
          <path d="M20 90 L250 10 L480 90 Z" fill="#c9a77a" stroke={C.ink} strokeWidth="3" strokeLinejoin="round" />
          <rect x="34" y="90" width="432" height="300" fill="#e6d6b8" stroke={C.ink} strokeWidth="3" />
          <rect x="70" y="120" width="360" height="240" fill="#cfe3ef" stroke={C.ink} strokeWidth="3" />
        </svg>
        <div style={{ ...abs(130, 150, 240, 180), border: `2px solid ${C.ink}`, borderRadius: 8, overflow: 'hidden' }}><MiniPage scale={0.9} /></div>
        <div style={{ ...abs(400, 90, 80, 80), opacity: interpolate(t, [2.1, 2.3], [0, 1]) * interpolate(t, [2.8, 3.0], [1, 0]), transform: `rotate(${spin}deg)` }}>
          <svg width="80" height="80" viewBox="0 0 80 80" aria-hidden>
            <circle cx="40" cy="40" r="36" fill={C.ink} />
            <path d="M58 40 A18 18 0 1 1 52 27" stroke="#fffdf8" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M50 16 L54 28 L42 30" stroke="#fffdf8" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <div style={{ ...abs(140, 730, 520), ...riseIn(t, 0.6) }}>
        <Term term="정적 사이트" gloss="미리 만든 파일을 보여 주기만 하는 사이트" color={C.ink} />
        <div style={{ ...small, marginTop: 10 }}>GitHub Pages가 그렇다 — 받은 글을 적어 둘 곳이 없다</div>
      </div>
      {/* 칠판 */}
      <div style={{ ...abs(B.x, B.y, B.w, B.h), borderRadius: 18, background: '#2c3442', border: `14px solid #8a6a44`, boxSizing: 'border-box', boxShadow: '0 30px 60px -36px rgba(31,36,48,.7)' }}>
        <div style={{ ...abs(40, 24), color: '#cfc7b4', fontSize: 22, fontWeight: 700 }}>방명록</div>
        <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 0 0 ${cut}px)` }}>
          {CHALK.map((c, i) => {
            const at = 0.4 + i * 0.55;
            const line = `${c.msg} — ${c.name}`;
            return (
              <div key={c.name} style={{ ...abs(70, 100 + i * 110), fontSize: 46, fontWeight: 700, color: '#f4efe6', fontFamily: "'Nanum Pen Script', 'Gaegu', var(--font-head)", letterSpacing: '0.01em', opacity: 0.92 }}>
                {typed(t, line, at, 18)}
              </div>
            );
          })}
        </div>
        <div style={{ ...abs(B.w - 300, B.h - 34, 120, 14), background: '#f4efe6', borderRadius: 4, opacity: 0.9 }} />
      </div>
      {/* 지우개 */}
      {t >= 2.5 && t < 3.4 && (
        <div style={{ ...abs(ex, B.y + 160, 120, 200), borderRadius: 12, background: '#d9b27c', border: `3px solid ${C.ink}` }}>
          <div style={{ height: 60, borderRadius: '9px 9px 0 0', background: '#5b6c80' }} />
        </div>
      )}
      <div style={{ ...abs(B.x + 40, B.y + B.h + 30), display: 'flex', gap: 16, alignItems: 'center', opacity: interpolate(t, [3.5, 3.8], [0, 1]) }}>
        <span style={{ fontSize: 24, fontWeight: 700 }}>새로고침하면 사라진다 → 모두가 보고 내일도 남게 하려면</span>
        <Chip color={C.teal} solidFill size={24}>데이터베이스</Chip>
      </div>
    </>
  );
}

/* ═══════════════════ S17 — 데이터베이스는 표로 담는다 (build 4 · 구글 시트) ═══════════════════ */
const COLS = [
  { k: 'id', type: '숫자', w: 120 },
  { k: 'name', type: '글자', w: 220 },
  { k: 'message', type: '글자', w: 400 },
  { k: 'created_at', type: '시각', w: 280 },
];
export function SheetSlide() {
  const { clicks, isStatic } = useDeck();
  const c = isStatic ? 9 : clicks;
  const X0 = 140;
  const cx = (i: number) => X0 + 60 + COLS.slice(0, i).reduce((s, x) => s + x.w, 0);
  return (
    <>
      <Header kicker="데이터베이스 기초" title="데이터베이스는 표로 담는다" />
      {/* 시트 */}
      <Build at={1} style={{ ...abs(X0, 210, 1090, 640) }}>
        <div style={{ ...abs(0, 0, 1080, 600), ...solid, overflow: 'hidden' }}>
          <div style={{ display: 'flex' }}>
            <div style={{ width: 60, height: 54, background: 'color-mix(in srgb, #1f2430 7%, #fffdf8)', borderRight: '1px solid var(--hair)', borderBottom: '1px solid var(--hair)' }} />
            {COLS.map((col, i) => (
              <div key={col.k} style={{ width: col.w, height: 54, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', boxSizing: 'border-box', borderRight: '1px solid var(--hair)', borderBottom: '1px solid var(--hair)', background: c >= 2 ? 'color-mix(in srgb, #1f9e7a 14%, #fffdf8)' : 'color-mix(in srgb, #1f2430 7%, #fffdf8)', ...mono, fontSize: 21, fontWeight: 800, color: c >= 2 ? C.teal : C.ink }}>
                {col.k}
                {c >= 2 && <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700, color: C.mute, padding: '1px 8px', borderRadius: 999, border: '1px solid var(--hair)' }}>{col.type}</span>}
              </div>
            ))}
          </div>
          {Array.from({ length: 7 }, (_, r) => {
            const row = c >= 3 ? CHALK[r] : undefined;
            return (
              <div key={r} style={{ display: 'flex', height: 72, background: row && r === 0 ? 'color-mix(in srgb, #6c4cf0 8%, #fffdf8)' : 'transparent' }}>
                <div style={{ width: 60, display: 'grid', placeItems: 'center', ...mono, fontSize: 16, color: C.faint, borderRight: '1px solid var(--hair)', borderBottom: '1px solid var(--hair-2)', background: 'color-mix(in srgb, #1f2430 4%, #fffdf8)' }}>{r + 1}</div>
                {COLS.map((col, i) => (
                  <div key={col.k} style={{ width: col.w, padding: '0 14px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', borderRight: '1px solid var(--hair-2)', borderBottom: '1px solid var(--hair-2)', fontSize: 22, fontWeight: 600, ...(i === 0 || i === 3 ? mono : {}) }}>
                    {row && (i === 0 ? r + 1 : i === 1 ? row.name : i === 2 ? row.msg : `10-28 14:0${r}`)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <div style={{ ...abs(0, 600), display: 'flex' }}>
          <span style={{ padding: '6px 20px', borderRadius: '0 0 10px 10px', background: '#fffdf8', border: '1.5px solid var(--hair)', borderTop: 'none', ...mono, fontSize: 18, fontWeight: 800, color: C.teal }}>guestbook</span>
        </div>
      </Build>
      {/* 열 강조 · 행 강조 */}
      {c >= 2 && <div style={{ ...abs(cx(2) - 2, 206, COLS[2].w + 4, 600), border: `3px solid ${C.teal}`, borderRadius: 6, pointerEvents: 'none' }} />}
      {c >= 3 && <div style={{ ...abs(X0 - 4, 210 + 54 - 2, 1088, 76), border: `3px solid ${C.violet}`, borderRadius: 6, pointerEvents: 'none' }} />}
      {/* 용어 */}
      <div style={{ ...abs(1290, 220, 520), display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Build at={1}><Term term="표 (테이블)" gloss="한 종류의 기록을 모아 두는 곳" color={C.ink} /></Build>
        <Build at={2}><Term term="열" gloss="기록마다 담을 항목 — 종류가 정해져 있다" color={C.teal} /></Build>
        <Build at={3}><Term term="행" gloss="기록 하나 — 친구 한 명의 글 한 줄" color={C.violet} /></Build>
      </div>
      <Build at={3} style={{ ...abs(1290, 500, 520) }}>
        <div style={{ ...small, fontSize: 18 }}>16장 칠판에서 지워졌던 그 글이 행으로 들어왔다</div>
      </Build>
      <Build at={4} style={{ ...abs(1290, 600, 520) }}>
        <div style={{ ...solid, padding: '20px 24px' }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>구글 시트와 닮았다</div>
          <div style={{ ...small, marginTop: 10 }}>다른 점</div>
          <div style={{ fontSize: 20, lineHeight: 1.6, marginTop: 4, wordBreak: 'keep-all' }}>· 열의 종류를 미리 정한다<br />· 수많은 사람이 동시에 써도 엉키지 않는다</div>
        </div>
      </Build>
    </>
  );
}

/* ═══════════════════ S18 — 기본 키: 행마다 학번이 있다 (static) ═══════════════════ */
const PET_COLS = [
  { k: 'id', what: '펫마다 다른 번호', rule: '기본 키', pk: true },
  { k: 'owner', what: '주인 학생의 계정', rule: '계정이 있어야 한다' },
  { k: 'name', what: '펫 이름', rule: '1~8자' },
  { k: 'state', what: '배고픔·행복·단계 묶음', rule: '정해진 모양이어야 한다' },
  { k: 'version · updated_at', what: '몇 번째 저장 · 언제 저장', rule: '—' },
];
function StudentCard({ no, style }: { no: string; style?: CSSProperties }) {
  return (
    <div style={{ width: 340, height: 210, borderRadius: 18, background: '#fffdf8', border: `3px solid ${C.ink}`, padding: 20, boxSizing: 'border-box', boxShadow: '0 20px 40px -28px rgba(31,36,48,.6)', ...style }}>
      <div style={{ ...kick, fontSize: 13 }}>샘플고 학생증</div>
      <div style={{ display: 'flex', gap: 18, marginTop: 14 }}>
        <div style={{ width: 80, height: 100, borderRadius: 8, background: C.sand, border: `2px solid ${C.ink}` }} />
        <div>
          <div style={{ ...small, fontSize: 14 }}>이름</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>한시우</div>
          <div style={{ ...small, fontSize: 14, marginTop: 8 }}>학번</div>
          <div style={{ ...mono, fontSize: 26, fontWeight: 900, color: C.teal, padding: '0 8px', border: `2.5px solid ${C.teal}`, borderRadius: 8, display: 'inline-block' }}>{no}</div>
        </div>
      </div>
    </div>
  );
}
export function KeySlide() {
  return (
    <>
      <Header kicker="데이터베이스 기초" title={<>기본 키: 행마다 <span style={{ color: C.teal }}>학번</span>이 있다</>} />
      <div style={{ ...abs(140, 250, 560, 520) }}>
        <StudentCard no="10203" style={{ ...abs(0, 0), transform: 'rotate(-4deg)' }} />
        <StudentCard no="20115" style={{ ...abs(150, 170), transform: 'rotate(3deg)' }} />
      </div>
      <div style={{ ...abs(140, 690, 620), fontSize: 26, fontWeight: 800, wordBreak: 'keep-all' }}>이름은 겹쳐도, <span style={{ color: C.teal }}>학번은 안 겹친다</span></div>
      <div style={{ ...abs(140, 760, 620) }}>
        <Term term="기본 키" gloss="행마다 다르고 절대 겹치지 않는 값" color={C.teal} />
      </div>
      <div style={{ ...abs(820, 210, 980) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
          <Pet px={4} />
          <Chip color={C.teal} size={18}>spacekijun 다마고찌의 실제 표</Chip>
          <Code size={20} color={C.ink}>tama_pet</Code>
        </div>
        <div style={{ ...solid, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 280px', background: 'color-mix(in srgb, #1f2430 6%, #fffdf8)', fontSize: 18, fontWeight: 800, color: C.mute }}>
            {['열', '담는 것', '규칙'].map((h) => <div key={h} style={{ padding: '12px 18px' }}>{h}</div>)}
          </div>
          {PET_COLS.map((r) => (
            <div key={r.k} style={{ display: 'grid', gridTemplateColumns: '300px 1fr 280px', borderTop: '1px solid var(--hair-2)', background: r.pk ? 'color-mix(in srgb, #1f9e7a 12%, #fffdf8)' : 'transparent', minHeight: 84, alignItems: 'center' }}>
              <div style={{ padding: '0 18px', ...mono, fontSize: 23, fontWeight: 800, color: r.pk ? C.teal : C.ink }}>{r.k}</div>
              <div style={{ padding: '0 18px', fontSize: 21, wordBreak: 'keep-all' }}>{r.what}</div>
              <div style={{ padding: '0 18px', fontSize: 20, fontWeight: r.pk ? 900 : 600, color: r.pk ? C.teal : C.mute, wordBreak: 'keep-all' }}>{r.rule}</div>
            </div>
          ))}
        </div>
        <div style={{ ...small, fontSize: 17, marginTop: 12 }}>출처: spacekijun 저장소 supabase/migrations/20261006120000_tamagotchi_pet.sql</div>
      </div>
    </>
  );
}

/* ═══════════════════ S19 — Supabase가 주는 열쇠 두 개 (scene · 방문증과 마스터키) ═══════════════════ */
export function KeysScene() {
  const t = useSceneTime();
  const out = spring(t, 0.5, 0.7);
  const go = interpolate(t, [1.4, 2.4], [0, 1], easeInOut);
  const door = interpolate(t, [2.3, 2.6], [0, 1]);
  const ban = interpolate(t, [2.8, 3.1], [0, 1]);
  const badge = { x: 760 + (300 - 760) * go, y: 330 + (620 - 330) * go };
  const key = { x: 1040 + (1450 - 1040) * go, y: 330 + (640 - 330) * go };
  return (
    <>
      <div style={{ ...abs(140, 60, 900) }}>
        <div style={kick}>데이터베이스 보안</div>
        <h2 style={{ ...h1, fontSize: 52, marginTop: 10 }}>열쇠 두 개, <span style={{ color: C.warn }}>운명은 반대</span></h2>
      </div>
      {/* 창구 */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }} aria-hidden>
        <rect x="640" y="150" width="640" height="150" rx="14" fill="#cfe3ef" stroke={C.ink} strokeWidth="3" opacity=".8" />
        <path d="M960 150 L960 300" stroke={C.ink} strokeWidth="2.4" />
        <rect x="600" y="300" width="720" height="40" rx="8" fill="#c99a62" stroke={C.ink} strokeWidth="3" />
        <path d="M880 300 L1040 300" stroke="#fffdf8" strokeWidth="6" />
        {/* X 경로 */}
        <path d="M900 380 C760 460 500 520 380 600" stroke={C.teal} strokeWidth="3" strokeDasharray="10 10" fill="none" opacity={out} />
        <path d="M1020 380 C1160 460 1380 520 1500 600" stroke={C.warn} strokeWidth="3" strokeDasharray="10 10" fill="none" opacity={out} />
      </svg>
      <div style={{ ...abs(640, 110, 640), textAlign: 'center', ...small, fontSize: 18 }}>Supabase 프로젝트 창구</div>
      {/* 진열창(내 사이트) 축소판 */}
      <div style={{ ...abs(150, 620, 420, 330) }}>
        <svg width="420" height="330" viewBox="0 0 420 330" aria-hidden>
          <path d="M14 70 L210 8 L406 70 Z" fill="#c9a77a" stroke={C.ink} strokeWidth="3" strokeLinejoin="round" />
          <rect x="26" y="70" width="368" height="250" fill="#e6d6b8" stroke={C.ink} strokeWidth="3" />
          <rect x="56" y="96" width="308" height="196" fill="#cfe3ef" stroke={C.ink} strokeWidth="3" />
        </svg>
        <div style={{ ...abs(0, 334, 420), textAlign: 'center', fontSize: 20, fontWeight: 800 }}>내 사이트 코드 (공개 저장소)</div>
      </div>
      {/* 금고 */}
      <div style={{ ...abs(1360, 600, 380, 340) }}>
        <svg width="380" height="340" viewBox="0 0 380 340" aria-hidden>
          <rect x="20" y="20" width="340" height="300" rx="18" fill="#5b6c80" stroke={C.ink} strokeWidth="4" />
          <rect x="44" y="44" width="292" height="252" rx="10" fill="#7f93a8" stroke={C.ink} strokeWidth="3" />
          <g transform={`translate(${190 - 120 * door * 0} 170)`}>
            <circle r="58" fill="#c4d2e0" stroke={C.ink} strokeWidth="4" />
            <g transform={`rotate(${door * 180})`}>
              <path d="M0 -44 L0 44 M-44 0 L44 0" stroke={C.ink} strokeWidth="6" strokeLinecap="round" />
            </g>
            <circle r="12" fill={C.ink} />
          </g>
        </svg>
        <div style={{ ...abs(0, 330, 380), textAlign: 'center', fontSize: 20, fontWeight: 800 }}>금고 — 서버에서만</div>
      </div>
      {/* 방문증 */}
      <div style={{ ...abs(badge.x, badge.y), opacity: Math.min(1, out * 1.4), transform: `translateY(${(1 - out) * -40}px)` }}>
        <svg width="40" height="60" viewBox="0 0 40 60" style={{ display: 'block', margin: '0 auto' }} aria-hidden><path d="M8 0 L20 50 L32 0" stroke={C.teal} strokeWidth="5" fill="none" /></svg>
        <div style={{ width: 230, padding: '14px 16px', borderRadius: 14, background: '#fffdf8', border: `3px solid ${C.teal}`, boxShadow: '0 18px 36px -24px rgba(31,36,48,.6)' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.teal, letterSpacing: '0.1em' }}>VISITOR</div>
          <div style={{ fontSize: 24, fontWeight: 900, marginTop: 2 }}>공개 키</div>
          <div style={{ ...mono, fontSize: 13, color: C.mute, marginTop: 4 }}>sb_publishable_…</div>
        </div>
      </div>
      {/* 마스터키 */}
      <div style={{ ...abs(key.x, key.y), opacity: Math.min(1, out * 1.4) * (1 - door * 0.9), transform: `translateY(${(1 - out) * -40}px)` }}>
        <svg width="230" height="90" viewBox="0 0 230 90" aria-hidden>
          <circle cx="44" cy="45" r="34" fill={C.gold} stroke={C.ink} strokeWidth="4" />
          <circle cx="44" cy="45" r="12" fill="#fffdf8" stroke={C.ink} strokeWidth="3" />
          <path d="M78 38 L216 38 L216 52 L196 52 L196 70 L180 70 L180 52 L160 52 L160 64 L146 64 L146 52 L78 52 Z" fill={C.gold} stroke={C.ink} strokeWidth="4" strokeLinejoin="round" />
        </svg>
        <div style={{ fontSize: 24, fontWeight: 900, color: C.warn }}>비밀 키</div>
        <div style={{ ...mono, fontSize: 13, color: C.mute }}>sb_secret_…</div>
      </div>
      {/* 칩 */}
      <div style={{ ...abs(150, 560), opacity: interpolate(t, [2.4, 2.7], [0, 1]) }}><Chip color={C.teal} solidFill size={22}>코드에 넣어도 된다</Chip></div>
      <div style={{ ...abs(1400, 560), opacity: interpolate(t, [2.6, 2.9], [0, 1]) }}><Chip color={C.warn} solidFill size={22}>절대 공개 금지</Chip></div>
      <div style={{ ...abs(1300, 420, 520), display: 'flex', gap: 12, opacity: ban }}>
        {['GitHub', '채팅', '화면 공유'].map((k) => (
          <span key={k} style={{ position: 'relative', padding: '6px 14px', borderRadius: 10, border: `2px solid ${C.warn}`, color: C.warn, fontWeight: 800, fontSize: 19 }}>
            {k}
            <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }} aria-hidden><path d="M4 36 L96 4" stroke={C.warn} strokeWidth="4" /></svg>
          </span>
        ))}
      </div>
      <div style={{ ...abs(620, 820, 700), textAlign: 'center', ...riseIn(t, 3.2, 0.6) }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>사이트가 DB에 접속하려면 <b>프로젝트 주소 + 키</b></div>
        <div style={{ ...small, marginTop: 8 }}>옛 이름: anon 키 = 공개 키 · service_role 키 = 비밀 키</div>
      </div>
    </>
  );
}

/* ═══════════════════ S20 — RLS: 내 열쇠로 내 칸만 (build 5 · 사물함) ═══════════════════ */
const LOCK_S = 1.0;
const DOORS = [
  { x: 44, name: '서연의 펫' },
  { x: 201, name: '하윤의 펫' },
  { x: 358, name: '민지의 펫' },
];
export function LockerSlide() {
  const { clicks, isStatic } = useDeck();
  const c = isStatic ? 9 : clicks;
  const LX = 150;
  const LY = 240;
  const open = (i: number) => (c >= 5 ? (i === 0 ? 110 : 96 + i * 6) : c >= 3 && i === 0 ? 110 : 0);
  return (
    <>
      <Header kicker="데이터베이스 보안" title={<>RLS: <span style={{ color: C.teal }}>내 열쇠로 내 칸만</span></>} />
      {/* 사물함 */}
      <div style={{ ...abs(LX, LY, 540 * LOCK_S, 560 * LOCK_S), perspective: 1400 }}>
        <img src={`${SVG}/school-lockers.svg`} alt="세 칸짜리 학교 사물함" style={{ ...abs(0, 0, 540 * LOCK_S, 560 * LOCK_S) }} />
        {DOORS.map((d, i) => (
          <div key={d.name} style={{ ...abs(d.x * LOCK_S, 62 * LOCK_S, 138 * LOCK_S, 434 * LOCK_S), transformOrigin: 'left center', transform: `rotateY(${-open(i)}deg)`, transition: 'transform 0.8s cubic-bezier(.2,.9,.3,1.2)', transformStyle: 'preserve-3d' }}>
            <img src={`${SVG}/locker-door.svg`} alt="" aria-hidden style={{ ...abs(0, 0, 138 * LOCK_S, 434 * LOCK_S), backfaceVisibility: 'hidden' }} />
            <div style={{ ...abs(18 * LOCK_S, 128 * LOCK_S, 98 * LOCK_S, 36 * LOCK_S), display: 'grid', placeItems: 'center', fontSize: 16, fontWeight: 800, color: C.ink, backfaceVisibility: 'hidden' }}>{d.name}</div>
          </div>
        ))}
        {c >= 3 && (
          <div style={{ ...abs(64, 200, 100), display: 'grid', placeItems: 'center' }}>
            <Pet px={4} />
          </div>
        )}
      </div>
      <div style={{ ...abs(LX, LY + 570, 540), display: 'flex', justifyContent: 'space-around' }}>
        {DOORS.map((d, i) => <Chip key={i} color={C.ink} size={16}>행 {i + 1}</Chip>)}
      </div>
      <Build at={1} style={{ ...abs(LX, 870, 560) }}>
        <Term term="RLS (행 수준 보안)" gloss="표의 행마다 거는 잠금" color={C.teal} />
      </Build>
      {/* 정책 카드 */}
      <Build at={2} style={{ ...abs(800, 220, 1000) }}>
        <div style={{ ...solid, padding: '22px 28px', borderColor: C.teal, borderWidth: 2.5 }}>
          <div style={{ ...small, fontSize: 16 }}>다마고찌 표 tama_pet에 실제로 걸린 정책</div>
          <div style={{ ...mono, fontSize: 28, fontWeight: 800, color: C.teal, marginTop: 6 }}>tama_pet_owner_read</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 10, wordBreak: 'keep-all' }}>로그인한 사람 = 주인인 행만 읽기</div>
          <div style={{ ...mono, fontSize: 16, color: C.mute, marginTop: 10 }}>using ((select auth.uid()) = owner)</div>
        </div>
        <Term term="정책 (policy)" gloss="잠금의 규칙 한 줄" color={C.teal} style={{ marginTop: 16, width: 560 }} />
      </Build>
      <Build at={3} style={{ ...abs(800, 590, 1000) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ padding: '10px 16px', borderRadius: 12, border: `3px solid ${C.teal}`, background: '#fffdf8', fontWeight: 800, fontSize: 20 }}>서연의 방문증</div>
          <span style={{ fontSize: 20, fontWeight: 700 }}>→ 서연의 칸만 열린다 · 다른 칸은 잠긴 채</span>
        </div>
      </Build>
      <Build at={4} style={{ ...abs(800, 680, 1000) }}>
        <div style={{ ...solid, overflow: 'hidden' }}>
          <div style={{ padding: '10px 18px', fontSize: 19, fontWeight: 800, background: 'color-mix(in srgb, #1f2430 6%, #fffdf8)' }}>방명록이라면 정책은</div>
          {[
            { k: '읽기', v: '누구나', ok: true },
            { k: '쓰기', v: '누구나', ok: true },
            { k: '고치기 · 지우기', v: '아무도 못 함', ok: false },
          ].map((r) => (
            <div key={r.k} style={{ display: 'flex', borderTop: '1px solid var(--hair-2)', padding: '8px 18px', fontSize: 21 }}>
              <span style={{ width: 240, fontWeight: 700 }}>{r.k}</span>
              <span style={{ fontWeight: 800, color: r.ok ? C.teal : C.warn }}>{r.ok ? '✓' : '✕'} {r.v}</span>
            </div>
          ))}
        </div>
      </Build>
      <Build at={5} style={{ ...abs(800, 930, 1000) }}>
        <div style={{ padding: '14px 22px', borderRadius: 14, background: C.warn, color: C.white, fontSize: 25, fontWeight: 800, wordBreak: 'keep-all' }}>RLS 꺼짐 + 공개 키 = 누구나 다 읽고 지운다</div>
      </Build>
    </>
  );
}
