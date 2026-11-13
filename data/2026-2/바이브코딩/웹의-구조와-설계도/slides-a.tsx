import type { CSSProperties, ReactNode } from 'react';
import Build from '../../../../src/deck/Build';
import { useSceneTime, interpolate, spring, riseIn, easeInOut, easeOut } from '../../../../src/scene';
import { typed } from '../../../../src/walkthrough';
import {
  abs, C, kick, h1, h3, body, small, mono, solid, Header, Term, Chip, Code, LinkButton,
  Pet, Hearts, Arrow, Stamp, MiniMap, Rack, Cylinder, Phone,
} from './shared';

const line = (p: number) => ({ pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - p });

/* ═══════════════════ S1 — 표지: 청사진 위의 다마고찌 (scene) ═══════════════════ */
const EGG = 'M560 200 C790 200 880 470 880 630 C880 800 740 910 560 910 C380 910 240 800 240 630 C240 470 330 200 560 200 Z';
export function TitleScene() {
  const t = useSceneTime();
  const d = (a: number, b: number) => interpolate(t, [a, b], [0, 1], easeInOut);
  const pBody = d(0.2, 1.3);
  const pScreen = d(1.1, 1.8);
  const pBtn = d(1.6, 2.2);
  const lcd = interpolate(t, [2.3, 2.7], [0, 1]);
  const pet = t < 3.4 ? 'egg-whole' : t < 4.0 ? 'egg-crack' : 'baby-idle';
  const wob = t >= 3.4 && t < 4.0 ? Math.sin(t * 38) * 5 : 0;
  const ann = interpolate(t, [2.0, 2.6], [0, 1]);
  return (
    <>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }} aria-hidden>
        {/* 도면 표제 치수선 */}
        <g opacity={ann} stroke={C.sky} strokeWidth="1.6">
          <path d="M240 150 L880 150 M240 138 L240 162 M880 138 L880 162" />
        </g>
        <path d={EGG} fill={`rgba(156,195,255,${0.05 * pBody})`} stroke={C.sky} strokeWidth="4" {...line(pBody)} />
        <rect x="400" y="420" width="320" height="230" rx="26" fill={`rgba(217,230,245,${0.92 * lcd})`} stroke={C.sky} strokeWidth="4" {...line(pScreen)} />
        {[470, 560, 650].map((cx, i) => (
          <circle key={cx} cx={cx} cy={i === 1 ? 800 : 772} r="26" fill={`rgba(255,122,107,${0.18 * pBtn})`} stroke={C.sky} strokeWidth="3.5" {...line(pBtn)} />
        ))}
        {/* 주석 지시선 — 라벨은 도형 bbox 바깥 */}
        <g opacity={ann} stroke={C.sky} strokeWidth="1.6" fill="none">
          <path d="M196 535 L396 535" strokeDasharray="5 6" />
          <path d="M196 860 L440 788" strokeDasharray="5 6" />
        </g>
      </svg>
      <div style={{ ...abs(240, 104, 640), textAlign: 'center', ...mono, fontSize: 17, color: C.sky, opacity: ann }}>도면 1 · 다마고찌 기기</div>
      <div style={{ ...abs(70, 516, 120), textAlign: 'right', fontSize: 21, fontWeight: 700, color: C.sky, opacity: ann }}>화면</div>
      <div style={{ ...abs(20, 842, 170), textAlign: 'right', fontSize: 21, fontWeight: 700, color: C.sky, opacity: ann }}>버튼 A · B · C</div>
      <div style={{ ...abs(400, 420, 320, 230), display: 'grid', placeItems: 'center', opacity: lcd }}>
        <div style={{ transform: `rotate(${wob}deg)` }}>
          <Pet name={pet} px={7} alt="다마고찌 펫" />
        </div>
      </div>
      <div style={{ ...abs(1010, 300, 820) }}>
        <div style={{ ...kick, color: C.sky, ...riseIn(t, 0.5) }}>바이브코딩 · 2026-2 · 정거장 3</div>
        <h1 style={{ ...h1, fontSize: 108, marginTop: 22, ...riseIn(t, 0.7) }}>
          웹의 구조와
          <br />
          <span style={{ color: C.coral }}>설계도</span>
        </h1>
        <p style={{ ...body, fontSize: 28, marginTop: 34, maxWidth: 720, ...riseIn(t, 1.0) }}>
          웹이 어떻게 움직이는지 알고, 에이전트의 인터뷰로 내 프로젝트의 설계도를 쓴다
        </p>
        <div style={{ marginTop: 40, display: 'flex', gap: 14, ...riseIn(t, 1.3) }}>
          <Chip color={C.sky}>오늘은 만들지 않는다</Chip>
          <Chip color={C.coral}>먼저 그린다</Chip>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════ S2 — "만들어 줘" 한 줄이면 될까 (build 4) ═══════════════════ */
function Pict({ kind }: { kind: 'phone' | 'closed' | 'bowl' }) {
  const s = { stroke: C.ink, strokeWidth: 3, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden>
      {kind === 'phone' && (
        <>
          <rect x="18" y="6" width="28" height="52" rx="6" {...s} />
          <path d="M28 50 L36 50" {...s} />
        </>
      )}
      {kind === 'closed' && (
        <>
          <rect x="6" y="12" width="52" height="40" rx="6" {...s} />
          <path d="M6 22 L58 22 M24 30 L40 46 M40 30 L24 46" {...s} />
        </>
      )}
      {kind === 'bowl' && (
        <>
          <path d="M8 30 L56 30 C56 44 46 54 32 54 C18 54 8 44 8 30 Z" {...s} />
          <path d="M40 8 C46 8 50 12 50 16 C50 21 44 22 44 26" {...s} stroke={C.coral} />
          <circle cx="44" cy="30" r="0.5" {...s} />
        </>
      )}
    </svg>
  );
}
const Q2 = [
  { y: 200, kind: 'phone' as const, q: '친구가 자기 폰에서 열 수 있나?', term: '동작 방식 · 배포' },
  { y: 420, kind: 'closed' as const, q: '창을 닫았다 열어도 펫이 그대로 있나?', term: '데이터 저장 · DB' },
  { y: 640, kind: 'bowl' as const, q: '누가 몇 번 밥을 줬는지, 코인을 몇 개 받았는지 믿을 수 있나?', term: '백엔드' },
];
export function OneLineSlide() {
  return (
    <>
      <Header kicker="도입" title="한 줄이면 될까?" />
      <div style={{ ...abs(120, 300, 520), ...solid, padding: '0 0 22px', overflow: 'hidden' }}>
        <div style={{ ...mono, fontSize: 15, color: 'var(--fg-faint)', padding: '10px 18px', borderBottom: '1px solid var(--hair-2)' }}>터미널 — vibe</div>
        <div style={{ ...mono, fontSize: 26, color: C.ink, padding: '22px 22px 0' }}>다마고찌 게임 만들어 줘</div>
        <div style={{ ...mono, fontSize: 18, color: 'var(--fg-muted)', padding: '14px 22px 0' }}>✓ index.html 을 만들었습니다</div>
      </div>
      <div style={{ ...abs(120, 520), display: 'flex', alignItems: 'center', gap: 12 }}>
        <Code size={22}>index.html</Code>
        <span style={{ ...small }}>지난 시간처럼 파일 하나가 생긴다</span>
      </div>
      <Arrow x1={650} y1={390} x2={756} y2={390} color={C.coral} width={5} head={18} />
      <div style={{ ...abs(770, 190, 560, 600), ...solid, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--hair-2)' }}>
          {[0, 1, 2].map((i) => <i key={i} style={{ width: 11, height: 11, borderRadius: 6, background: 'var(--hair)' }} />)}
          <span style={{ ...mono, fontSize: 15, color: 'var(--fg-faint)', marginLeft: 8, padding: '4px 12px', borderRadius: 8, background: 'color-mix(in srgb, var(--fg) 6%, transparent)' }}>file:///C:/…/vibe/index.html</span>
        </div>
        <div style={{ display: 'grid', placeItems: 'center', flex: 1, background: C.lcd }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'grid', placeItems: 'center' }}><Pet name="baby-idle" px={11} alt="아기 펫" /></div>
            <div style={{ marginTop: 18 }}><Hearts n={3} size={34} color="#e0533f" /></div>
            <div style={{ marginTop: 18, display: 'flex', gap: 12, justifyContent: 'center' }}>
              {['밥', '놀이', '불'].map((b) => <span key={b} style={{ padding: '6px 18px', borderRadius: 10, background: '#0f2747', color: C.ink, fontSize: 19, fontWeight: 700 }}>{b}</span>)}
            </div>
          </div>
        </div>
      </div>
      {Q2.map((q, i) => (
        <Build key={i} at={i + 1} style={{ ...abs(1380, q.y, 440) }}>
          <div style={{ ...solid, padding: '18px 22px', display: 'flex', gap: 16, alignItems: 'center', borderColor: `color-mix(in srgb, ${C.coral} 50%, transparent)` }}>
            <Pict kind={q.kind} />
            <div style={{ fontSize: 23, fontWeight: 700, lineHeight: 1.35, wordBreak: 'keep-all' }}>{q.q}</div>
          </div>
        </Build>
      ))}
      {Q2.map((q, i) => (
        <Build key={`t${i}`} at={4} style={{ ...abs(1400, q.y + 150) }}>
          <Chip color={C.sky}>→ {q.term}</Chip>
        </Build>
      ))}
      <Build at={4} style={{ ...abs(120, 900, 1200) }}>
        <div style={{ fontSize: 30, fontWeight: 800 }}>
          이 질문에 답하는 것이 <span style={{ color: C.sky }}>웹의 구조</span>다
        </div>
      </Build>
    </>
  );
}

/* ═══════════════════ S3 — 주소를 치면 일어나는 일 (scene · 도서관 대출 창구) ═══════════════════ */
const URL3 = 'https://spacekijun.lovable.app/tamagotchi';
export function LibraryScene() {
  const t = useSceneTime();
  const go = interpolate(t, [1.8, 2.7], [0, 1], easeInOut);
  const back = interpolate(t, [3.2, 4.1], [0, 1], easeInOut);
  const lit = t >= 2.8;
  const page = interpolate(t, [4.1, 4.5], [0, 1]);
  const fold = interpolate(t, [1.6, 1.85], [0, 1]);
  return (
    <>
      <Header kicker="웹의 동작 방식" title="주소를 치면 일어나는 일" />
      {/* 브라우저 */}
      <div style={{ ...abs(100, 260, 560, 400), ...solid, overflow: 'hidden', ...riseIn(t, 0, 0.6) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderBottom: '1px solid var(--hair-2)' }}>
          {[0, 1, 2].map((i) => <i key={i} style={{ width: 10, height: 10, borderRadius: 5, background: 'var(--hair)' }} />)}
          <span style={{ ...mono, fontSize: 16, color: C.ink, marginLeft: 6, padding: '5px 12px', borderRadius: 8, background: 'color-mix(in srgb, var(--fg) 7%, transparent)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden' }}>
            {typed(t, URL3, 0.3, 34)}
          </span>
        </div>
        <div style={{ height: 344, display: 'grid', placeItems: 'center', background: page > 0 ? `rgba(217,230,245,${page})` : 'transparent' }}>
          {page > 0 ? (
            <div style={{ opacity: page, textAlign: 'center' }}>
              <div style={{ display: 'grid', placeItems: 'center' }}><Pet name="baby-idle" px={8} /></div>
              <div style={{ marginTop: 10 }}><Hearts n={3} size={26} color="#e0533f" /></div>
            </div>
          ) : (
            <span style={{ ...small, color: 'var(--fg-faint)' }}>{t > 2 ? '불러오는 중…' : ''}</span>
          )}
        </div>
      </div>
      <div style={{ ...abs(100, 676, 560), textAlign: 'center', fontSize: 22, fontWeight: 800, color: C.sky }}>브라우저 (클라이언트)</div>
      {/* 대출 창구 */}
      <img src="assets/svg/library-desk.svg" alt="" aria-hidden style={{ ...abs(700, 420, 520, 300), opacity: interpolate(t, [0, 0.5], [0, 1]) }} />
      {/* 서버 */}
      <div style={{ ...abs(1300, 250), ...riseIn(t, 0.2, 0.6) }}>
        <Rack w={420} units={4} lit={lit ? 1 : -1} labels={['/', '/tamagotchi', '/planner', '/collab']} />
      </div>
      <div style={{ ...abs(1300, 560, 420), textAlign: 'center', fontSize: 22, fontWeight: 800, color: C.sky }}>서버</div>
      {/* 요청 쪽지 */}
      {t >= 1.6 && go < 1 && (
        <div style={{ ...abs(600 + go * 640, 330 - Math.sin(go * Math.PI) * 60), transform: `scale(${0.6 + 0.4 * fold})`, opacity: fold }}>
          <div style={{ padding: '10px 16px', borderRadius: 8, background: C.paper, color: C.deep, ...mono, fontSize: 17, fontWeight: 700, boxShadow: '0 10px 24px rgba(0,0,0,.35)', whiteSpace: 'nowrap' }}>/tamagotchi 주세요</div>
        </div>
      )}
      {t >= 1.8 && <div style={{ ...abs(880, 250), opacity: interpolate(t, [1.8, 2.1], [0, 1]) }}><Chip color={C.sky} solidFill>요청 →</Chip></div>}
      {/* 응답 책 */}
      {t >= 3.0 && back < 1 && (
        <div style={{ ...abs(1240 - back * 600, 500 - Math.sin(back * Math.PI) * 70), opacity: interpolate(t, [3.0, 3.2], [0, 1]) }}>
          <div style={{ padding: '12px 18px', borderRadius: 6, background: C.coral, color: C.deep, fontWeight: 800, fontSize: 18, boxShadow: '0 10px 24px rgba(0,0,0,.35)', borderLeft: `8px solid #e0533f`, whiteSpace: 'nowrap' }}>tamagotchi 페이지</div>
        </div>
      )}
      {t >= 3.2 && <div style={{ ...abs(880, 740), opacity: interpolate(t, [3.2, 3.5], [0, 1]) }}><Chip color={C.coral} solidFill>← 응답</Chip></div>}
      {/* 주소 풀이 */}
      <UrlParts t={t} />
      <div style={{ ...abs(100, 905, 1720), display: 'flex', gap: 18, ...riseIn(t, 4.4, 0.6) }}>
        <Term term="브라우저" gloss="주소로 요청하고, 받은 것을 화면에 그린다" />
        <Term term="서버" gloss="요청을 받아 응답을 돌려주는 컴퓨터" />
        <Term term="요청 · 응답" gloss="달라는 말 · 돌려준 파일" color={C.coral} />
      </div>
    </>
  );
}
function UrlParts({ t }: { t: number }) {
  const o = interpolate(t, [4.2, 4.6], [0, 1]);
  const seg = (text: string, label: string, w: number, color: string) => (
    <div style={{ width: w, textAlign: 'center' }}>
      <div style={{ ...mono, fontSize: 22, fontWeight: 800, color, whiteSpace: 'nowrap' }}>{text}</div>
      <div style={{ height: 12, margin: '6px 8px 0', borderLeft: `2px solid ${color}`, borderRight: `2px solid ${color}`, borderBottom: `2px solid ${color}`, borderRadius: '0 0 6px 6px' }} />
      <div style={{ fontSize: 18, color: 'var(--fg-muted)', marginTop: 6 }}>{label}</div>
    </div>
  );
  return (
    <div style={{ ...abs(1250, 650, 640), display: 'flex', justifyContent: 'flex-start', gap: 4, opacity: o, flexWrap: 'wrap' }}>
      <div style={{ ...small, width: '100%', marginBottom: 10, color: C.sky, fontWeight: 700 }}>URL = 어느 서버의 어느 파일인지 적은 주소</div>
      {seg('https://', '약속된 방식', 116, C.sky)}
      {seg('spacekijun.lovable.app', '어느 서버', 310, C.ink)}
      {seg('/tamagotchi', '어느 페이지', 160, C.coral)}
    </div>
  );
}

/* ═══════════════════ S4 — 지난 시간 내 페이지는 어디에 있었나 (build 3 · ox) ═══════════════════ */
function AddrBar({ scheme, rest, y }: { scheme: string; rest: string; y: number }) {
  return (
    <div style={{ ...abs(120, y, 1160, 100), ...solid, display: 'flex', alignItems: 'center', gap: 18, padding: '0 28px', borderRadius: 999 }}>
      <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden><circle cx="15" cy="15" r="11" fill="none" stroke={C.sky} strokeWidth="2.4" /><path d="M4 15 L26 15 M15 4 C9 10 9 20 15 26 C21 20 21 10 15 4" fill="none" stroke={C.sky} strokeWidth="2" /></svg>
      <span style={{ ...mono, fontSize: 31, whiteSpace: 'nowrap' }}>
        <b style={{ color: C.coral, fontWeight: 900 }}>{scheme}</b>
        <span style={{ color: C.ink }}>{rest}</span>
      </span>
    </div>
  );
}
function Device({ kind, ok, label }: { kind: 'laptop' | 'phone'; ok: boolean; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg width="58" height="46" viewBox="0 0 58 46" aria-hidden>
        {kind === 'laptop' ? (
          <><rect x="9" y="4" width="40" height="28" rx="4" fill="none" stroke={C.ink} strokeWidth="2.6" /><path d="M2 40 L56 40" stroke={C.ink} strokeWidth="3" strokeLinecap="round" /></>
        ) : (
          <><rect x="19" y="2" width="20" height="42" rx="5" fill="none" stroke={C.ink} strokeWidth="2.6" /><path d="M26 37 L32 37" stroke={C.ink} strokeWidth="2.6" strokeLinecap="round" /></>
        )}
      </svg>
      <span style={{ fontSize: 30, fontWeight: 900, color: ok ? C.ok : C.coral }}>{ok ? '✓' : '✕'}</span>
      <span style={{ fontSize: 23, fontWeight: 700, color: ok ? C.ink : C.coralSoft, whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );
}
export function WhereSlide() {
  return (
    <>
      <Header kicker="웹의 동작 방식" title="지난 시간 내 페이지는 어디에 있었나" />
      <AddrBar scheme="file:///" rest="C:/Users/학생/Documents/vibe/index.html" y={270} />
      <Build at={1} style={{ ...abs(150, 392, 1100) }}>
        <div style={{ ...small, fontSize: 22 }}>내 노트북 C 드라이브의 이 폴더라는 뜻 — <b style={{ color: C.ink }}>요청할 서버가 없다</b></div>
      </Build>
      <Build at={1} style={{ ...abs(1360, 250, 470) }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Device kind="laptop" ok label="내 노트북: 열림" />
          <Device kind="phone" ok={false} label="친구 폰: 찾을 수 없음" />
        </div>
      </Build>
      <Build at={2} style={{ ...abs(0, 0, 1920, 1080) }}>
        <AddrBar scheme="https://" rest="spacekijun.lovable.app/tamagotchi" y={650} />
        <div style={{ ...abs(150, 772, 1100), ...small, fontSize: 22 }}>서버에 있다 — <b style={{ color: C.ink }}>누구든 이 주소로 요청할 수 있다</b></div>
        <div style={{ ...abs(1360, 630, 470), display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Device kind="laptop" ok label="내 노트북: 열림" />
          <Device kind="phone" ok label="친구 폰: 열림" />
        </div>
      </Build>
      <Build at={3} style={{ ...abs(0, 0, 1920, 1080) }}>
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }} aria-hidden>
          <path d="M560 446 C520 520 600 570 560 640" fill="none" stroke={C.coral} strokeWidth="4" strokeDasharray="12 10" strokeLinecap="round" />
          <path d="M548 626 L560 642 L574 628" fill="none" stroke={C.coral} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ ...abs(612, 520) }}><Chip color={C.coral} size={22}>배포 — 뒤에서 다룬다</Chip></div>
      </Build>
      <div style={{ ...abs(120, 900, 1600), ...small, color: 'var(--fg-faint)' }}>
        file:// 은 "내 컴퓨터의 파일", https:// 는 "서버에 요청하는 주소"
      </div>
    </>
  );
}

/* ═══════════════════ S5 — 프론트엔드와 백엔드 (scene · 식당 홀과 주방) ═══════════════════ */
const MINI_EGG = 'M0 -230 C150 -230 210 -60 210 40 C210 150 120 230 0 230 C-120 230 -210 150 -210 40 C-210 -60 -150 -230 0 -230 Z';
export function KitchenScene() {
  const t = useSceneTime();
  const press = t >= 0.4 && t < 0.75;
  const heart = t < 0.9 ? 2 : 3;
  const pet = t >= 0.5 && t < 1.6 ? 'baby-eat' : 'baby-idle';
  const go = interpolate(t, [2.0, 2.7], [0, 1], easeInOut);
  const stamp1 = spring(t, 2.8, 0.5);
  const stamp2 = spring(t, 3.1, 0.5);
  const row = interpolate(t, [3.6, 4.0], [0, 1]);
  return (
    <>
      <Header kicker="웹의 구조" title="화면과 그 뒤: 프론트엔드와 백엔드" size={48} />
      {/* 벽과 창구 */}
      <div style={{ ...abs(1176, 220, 30, 250), background: `color-mix(in srgb, ${C.sky} 30%, var(--bg))`, borderRadius: 6 }} />
      <div style={{ ...abs(1176, 600, 30, 300), background: `color-mix(in srgb, ${C.sky} 30%, var(--bg))`, borderRadius: 6 }} />
      <div style={{ ...abs(1150, 470, 82, 130), border: `2px dashed color-mix(in srgb, ${C.sky} 60%, transparent)`, borderLeft: 'none', borderRight: 'none' }} />
      {/* 홀 — 프론트엔드 */}
      <div style={{ ...abs(130, 220, 980) }}>
        <div style={{ fontSize: 30, fontWeight: 900, color: C.sky }}>프론트엔드</div>
        <div style={{ ...small }}>내 기기의 브라우저에서 돌아가는 부분 · 화면, 버튼, 계산</div>
      </div>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }} aria-hidden>
        <g transform="translate(560 600) scale(0.95)">
          <path d={MINI_EGG} fill="rgba(156,195,255,0.06)" stroke={C.sky} strokeWidth="4" />
          <rect x="-150" y="-120" width="300" height="210" rx="24" fill={C.lcd} stroke={C.sky} strokeWidth="4" />
          {[-90, 0, 90].map((cx, i) => (
            <circle key={cx} cx={cx} cy={i === 1 ? 170 : 148} r="24" fill={i === 1 && press ? C.coral : 'rgba(255,122,107,0.2)'} stroke={C.sky} strokeWidth="3.5" />
          ))}
        </g>
      </svg>
      <div style={{ ...abs(418, 488, 284, 200), display: 'grid', placeItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'grid', placeItems: 'center' }}><Pet name={pet} px={6} /></div>
          <div style={{ marginTop: 8 }}><Hearts n={heart} size={24} color="#e0533f" /></div>
        </div>
      </div>
      <div style={{ ...abs(820, 400, 300), ...riseIn(t, 1.0, 0.6) }}>
        <div style={{ padding: '12px 16px', borderRadius: 12, border: `1.5px dashed ${C.sky}`, fontSize: 20, lineHeight: 1.4, wordBreak: 'keep-all' }}>
          <b style={{ color: C.sky }}>배고픔 계산은 여기서</b>
          <br />앱을 열 때 지난 시간을 폰이 따라잡는다
        </div>
      </div>
      {/* 주방 — 백엔드 */}
      <div style={{ ...abs(1250, 220, 600) }}>
        <div style={{ fontSize: 30, fontWeight: 900, color: C.coral }}>백엔드</div>
        <div style={{ ...small }}>서버에서 돌아가는 부분 · 기록하고 확인한다</div>
      </div>
      <div style={{ ...abs(1640, 330) }}><Rack w={190} units={2} labels={['펫 저장', '코인']} /></div>
      {/* 전표 */}
      {t >= 1.9 && (
        <div style={{ ...abs(760 + go * 520, 500 - Math.sin(go * Math.PI) * 30), opacity: interpolate(t, [1.9, 2.1], [0, 1]) }}>
          <div style={{ width: 300, padding: '14px 18px', borderRadius: 8, background: C.paper, color: C.deep, boxShadow: '0 12px 26px rgba(0,0,0,.35)' }}>
            <div style={{ ...mono, fontSize: 16, fontWeight: 800 }}>state 저장</div>
            <div style={{ ...mono, fontSize: 15, marginTop: 6, lineHeight: 1.5 }}>배고픔 ♥♥♥♡<br />단계: 아기</div>
          </div>
          {t >= 2.8 && <div style={{ position: 'absolute', left: 150, top: -26, opacity: Math.min(1, stamp1 * 1.4), transform: `scale(${1.6 - 0.6 * stamp1})` }}><Stamp size={17} rotate={-8}>서버 시각 ✓</Stamp></div>}
          {t >= 3.1 && <div style={{ position: 'absolute', left: 120, top: 104, opacity: Math.min(1, stamp2 * 1.4), transform: `scale(${1.6 - 0.6 * stamp2})` }}><Stamp size={17} rotate={5} color={C.gold}>미래 시각 아님 ✓</Stamp></div>}
        </div>
      )}
      {t >= 2.1 && <div style={{ ...abs(1120, 420), opacity: interpolate(t, [2.1, 2.4], [0, 1]) }}><Chip color={C.sky} solidFill>저장 →</Chip></div>}
      {/* 코인 장부 */}
      <div style={{ ...abs(1250, 690, 600), ...solid, padding: '14px 20px' }}>
        <div style={{ ...mono, fontSize: 16, color: 'var(--fg-faint)', marginBottom: 6 }}>코인 장부 — 서버만 쓴다</div>
        {[['학생 B', '계획 세우기', '+2'], ['학생 D', '함께 집중', '+2']].map((r) => (
          <div key={r[0] + r[1]} style={{ display: 'flex', justifyContent: 'space-between', ...mono, fontSize: 19, padding: '4px 0', borderBottom: '1px solid var(--hair-2)' }}><span>{r[0]}</span><span>{r[1]}</span><span>{r[2]}</span></div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', ...mono, fontSize: 19, padding: '4px 0', color: C.coral, fontWeight: 800, opacity: row, transform: `translateY(${(1 - row) * 10}px)` }}><span>학생 A</span><span>돌아보기</span><span>+2</span></div>
      </div>
      <div style={{ ...abs(130, 925, 1700), display: 'flex', gap: 18, ...riseIn(t, 4.0, 0.6) }}>
        <Term term="프론트엔드" gloss="보이고 눌리는 부분 — 사용자 기기의 브라우저에서 돈다" />
        <Term term="백엔드" gloss="서버에서 규칙을 지키고 기록하는 부분" color={C.coral} />
      </div>
    </>
  );
}

/* ═══════════════════ S6 — 데이터베이스 (scene · 출석부) ═══════════════════ */
const COLS6 = [
  { k: '#', g: '', w: 80 },
  { k: 'owner', g: '주인', w: 260 },
  { k: 'name', g: '이름', w: 220 },
  { k: 'updated_at', g: '마지막 저장', w: 300 },
  { k: 'state', g: '상태', w: 400 },
];
const ROWS6 = [
  ['1', '학생 A', '별이', '10-20 07:52', '{ 배고픔 ♥♥♥♡ … }'],
  ['2', '학생 B', '콩이', '10-20 08:03', '{ 배고픔 ♥♡♡♡ … }'],
  ['3', '학생 C', '모찌', '10-20 08:10', '{ 배고픔 ♥♥♡♡ … }'],
  ['4', '학생 D', '구름', '10-19 22:41', '{ 배고픔 ♥♥♥♥ … }'],
  ['5', '학생 E', '두부', '10-20 07:30', '{ 배고픔 ♥♥♥♡ … }'],
];
export function RollbookScene() {
  const t = useSceneTime();
  const hl = interpolate(t, [2.0, 2.3], [0, 1]);
  const bub = spring(t, 2.6, 0.6);
  const fed = t >= 3.4;
  const X0 = 140;
  const Y0 = 270;
  const RH = 84;
  return (
    <>
      <Header kicker="웹의 구조" title="서버의 기억: 데이터베이스" />
      <div style={{ ...abs(X0, Y0 - 50), display: 'flex', gap: 12, alignItems: 'center', opacity: interpolate(t, [0, 0.4], [0, 1]) }}>
        <Chip color={C.sky} solidFill>펫 표 · tama_pet</Chip>
        <span style={{ ...small }}>다마고찌 데이터베이스의 실제 표 이름</span>
      </div>
      <div style={{ ...abs(X0, Y0, 1260), border: `2px solid ${C.sky}`, borderRadius: 14, overflow: 'hidden', background: 'color-mix(in srgb, #9cc3ff 4%, var(--bg))' }}>
        <div style={{ display: 'flex', height: 86, background: 'color-mix(in srgb, #9cc3ff 14%, transparent)', borderBottom: `2px solid ${C.sky}` }}>
          {COLS6.map((c) => (
            <div key={c.k} style={{ width: c.w, padding: '12px 16px', borderRight: '1px solid color-mix(in srgb, #9cc3ff 30%, transparent)' }}>
              <div style={{ ...mono, fontSize: 21, fontWeight: 800, color: C.ink }}>{c.k}</div>
              <div style={{ fontSize: 16, color: 'var(--fg-muted)' }}>{c.g}</div>
            </div>
          ))}
        </div>
        {ROWS6.map((r, i) => {
          const o = interpolate(t, [0.4 + i * 0.25, 0.7 + i * 0.25], [0, 1]);
          const hot = i === 2;
          const vals = hot && fed ? [r[0], r[1], r[2], '10-20 08:45', '{ 배고픔 ♥♥♥♡ … }'] : r;
          return (
            <div key={i} style={{ display: 'flex', height: RH, opacity: o, borderBottom: '1px solid color-mix(in srgb, #9cc3ff 22%, transparent)', background: hot ? `rgba(255,122,107,${0.14 * hl})` : 'transparent', boxShadow: hot ? `inset 0 0 0 ${3 * hl}px ${C.coral}` : 'none' }}>
              {COLS6.map((c, j) => (
                <div key={c.k} style={{ width: c.w, padding: '0 16px', display: 'flex', alignItems: 'center', borderRight: '1px solid color-mix(in srgb, #9cc3ff 18%, transparent)', ...(j === 0 || j >= 3 ? mono : {}), fontSize: j === 0 ? 20 : 22, color: j === 0 ? 'var(--fg-faint)' : hot && fed && j >= 3 ? C.coral : C.ink, fontWeight: hot && fed && j >= 3 ? 800 : 500, whiteSpace: 'nowrap' }}>
                  {vals[j]}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {/* 3번째 줄의 상태 칸이 펼쳐진다 */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: Math.min(1, bub * 1.5) }} aria-hidden>
        <path d={`M${X0 + 1260} ${Y0 + 86 + RH * 2.5} L1470 ${Y0 + 86 + RH * 2.5}`} stroke={C.coral} strokeWidth="3" strokeDasharray="6 6" />
      </svg>
      <div style={{ ...abs(1470, 360, 380), opacity: Math.min(1, bub * 1.5), transform: `scale(${0.85 + 0.15 * bub})`, transformOrigin: 'left center' }}>
        <div style={{ display: 'grid', placeItems: 'center', marginBottom: 14 }}><Pet name="child-happy" px={5} alt="모찌" /></div>
        <div style={{ padding: '18px 22px', borderRadius: 16, background: C.paper, color: C.deep, ...mono, fontSize: 21, lineHeight: 1.7, boxShadow: '0 16px 30px rgba(0,0,0,.35)' }}>
          <div style={{ fontWeight: 800 }}>state = {'{'}</div>
          <div>&nbsp; 배고픔: <span style={{ color: '#d23c2a' }}>{fed ? '♥♥♥♡' : '♥♥♡♡'}</span></div>
          <div>&nbsp; 행복: ♥♥♥♡</div>
          <div>&nbsp; 단계: 어린이</div>
          <div style={{ fontWeight: 800 }}>{'}'}</div>
        </div>
        {fed && <div style={{ marginTop: 12, ...riseIn(t, 3.4, 0.5) }}><Chip color={C.coral}>밥 주기 → 이 칸을 고쳐 쓴다</Chip></div>}
      </div>
      <div style={{ ...abs(140, 870, 1300), ...riseIn(t, 3.8, 0.6) }}>
        <Term term="데이터베이스(DB)" gloss="정보를 표(테이블)로 저장하고 찾아 주는 프로그램 · 한 줄 = 펫 한 마리, 칸 = 항목" />
      </div>
    </>
  );
}

/* ═══════════════════ S7 — 저장은 어디에? 세 갈래 (build 4 · choice) ═══════════════════ */
const WAYS = [
  { y: 230, w: 620, h: 190, title: '저장 안 함 — 화면만', role: '프론트엔드', desc: '새로 고치면 처음부터', ex: ['계산기', '타이머', '소개 페이지'], follow: '', level: 1 as const },
  { y: 455, w: 820, h: 210, title: '브라우저 저장', role: '내 기기에만', desc: '다른 기기에서는 안 보인다 · 브라우저 기록을 지우면 사라진다', ex: ['나만 쓰는 할 일 목록', '내 단어장'], follow: '', level: 2 as const },
  { y: 700, w: 1060, h: 250, title: '서버 데이터베이스', role: '백엔드 · DB', desc: '어느 기기에서든 같은 정보 · 여러 사람이 함께 본다', ex: ['게시판', '출석부', '다마고찌'], follow: '로그인 · 배포가 따라온다', level: 3 as const },
];
export function ThreeWaysSlide() {
  return (
    <>
      <Header kicker="웹의 구조" title="저장은 어디에? 세 갈래" />
      <div style={{ ...abs(120, 470, 470), padding: '28px 30px', borderRadius: 20, border: `2px solid ${C.sky}`, background: 'color-mix(in srgb, #9cc3ff 7%, var(--bg))' }}>
        <div style={{ ...h3, fontSize: 36, lineHeight: 1.3 }}>
          무엇을, <span style={{ color: C.coral }}>누구와 함께</span> 기억해야 하나?
        </div>
      </div>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }} aria-hidden>
        {WAYS.map((w) => (
          <path key={w.y} d={`M590 560 L640 560 L680 ${w.y + w.h / 2} L700 ${w.y + w.h / 2}`} fill="none" stroke={C.sky} strokeWidth="3" strokeLinejoin="round" opacity="0.7" />
        ))}
        <circle cx="590" cy="560" r="7" fill={C.sky} />
      </svg>
      {WAYS.map((w, i) => (
        <Build key={w.y} at={i + 1} style={{ ...abs(700, w.y, w.w, w.h) }}>
          <div style={{ ...solid, height: w.h, boxSizing: 'border-box', padding: '20px 26px', display: 'flex', gap: 24, alignItems: 'center', borderColor: i === 2 ? `color-mix(in srgb, ${C.coral} 55%, transparent)` : 'var(--hair)' }}>
            <MiniMap level={w.level} w={i === 2 ? 220 : 170} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                <span style={{ fontSize: 30, fontWeight: 900 }}>{w.title}</span>
                <span style={{ fontSize: 19, color: C.sky, fontWeight: 700 }}>{w.role}</span>
              </div>
              <div style={{ ...small, fontSize: 21, marginTop: 6 }}>{w.desc}</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                {w.ex.map((e) => <Chip key={e} color="#b7c3d6" size={17}>{e}</Chip>)}
                {w.follow && <Chip color={C.coral} size={17}>{w.follow}</Chip>}
              </div>
            </div>
          </div>
        </Build>
      ))}
      <Build at={4} style={{ ...abs(1610, 650) }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'grid', placeItems: 'center' }}><Pet name="adult-idle" px={4} alt="다마고찌 펫" /></div>
          <div style={{ marginTop: 6 }}><Chip color={C.coral} solidFill size={17}>다마고찌</Chip></div>
        </div>
      </Build>
    </>
  );
}

/* ═══════════════════ S8 — 배포·호스팅·도메인 (scene · 이사와 문패) ═══════════════════ */
const BOXES = ['index.html', 'style.css', 'game.js'];
export function MovingScene() {
  const t = useSceneTime();
  const host = interpolate(t, [2.6, 3.0], [0, 1]);
  const sign = spring(t, 3.4, 0.7);
  const phones = interpolate(t, [4.2, 4.8], [0, 1], easeOut);
  // 상자 경로: 노트북 옆 → 건물 문
  const start = [[690, 770], [860, 770], [775, 650]];
  const end = [1470, 640];
  return (
    <>
      <Header kicker="웹의 구조" title="다른 사람이 주소로 열게 하려면" />
      {/* 노트북 = 내 방 */}
      <div style={{ ...abs(260, 640, 320, 210), ...riseIn(t, 0, 0.5) }}>
        <div style={{ width: 300, height: 180, border: `3px solid ${C.sky}`, borderRadius: 12, background: 'color-mix(in srgb, #9cc3ff 6%, var(--bg))', display: 'grid', placeItems: 'center' }}>
          <span style={{ ...mono, fontSize: 18, color: 'var(--fg-muted)' }}>C:/…/vibe</span>
        </div>
        <div style={{ width: 340, height: 14, marginLeft: -20, borderRadius: 7, background: C.sky, opacity: 0.8 }} />
      </div>
      <div style={{ ...abs(260, 870, 320), textAlign: 'center', fontSize: 21, fontWeight: 800, color: C.sky }}>내 노트북</div>
      {/* 경로 */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }} aria-hidden>
        <path d="M610 760 C900 750 1200 730 1540 700" fill="none" stroke={C.coral} strokeWidth="4" strokeDasharray="12 12" opacity={interpolate(t, [0.6, 1.0], [0, 0.8])} />
      </svg>
      <div style={{ ...abs(820, 800), opacity: interpolate(t, [1.0, 1.4], [0, 1]) }}><Term term="배포" gloss="내 파일을 인터넷 서버에 올리는 일" color={C.coral} style={{ padding: '8px 16px' }} /></div>
      {/* 건물 = 호스팅 서버 */}
      <div style={{ ...abs(1380, 210, 440, 560), border: `3px solid ${C.sky}`, borderRadius: '14px 14px 0 0', background: 'color-mix(in srgb, #9cc3ff 6%, var(--bg))', boxShadow: host > 0 ? `0 0 0 ${4 * host}px color-mix(in srgb, ${C.sky} 30%, transparent)` : 'none' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, padding: 30 }}>
          {Array.from({ length: 9 }, (_, i) => {
            const fileIdx = i >= 3 && i < 6 ? i - 3 : -1;
            const on = fileIdx >= 0 && t >= 1.9 + fileIdx * 0.3;
            return (
              <div key={i} style={{ height: 70, borderRadius: 8, border: `1.5px solid color-mix(in srgb, ${C.sky} 45%, transparent)`, background: on ? `color-mix(in srgb, ${C.gold} 35%, transparent)` : 'transparent', display: 'grid', placeItems: 'center', ...mono, fontSize: 13, color: C.ink }}>
                {on ? BOXES[fileIdx] : ''}
              </div>
            );
          })}
        </div>
        {/* 정문 */}
        <div style={{ position: 'absolute', left: 170, bottom: 0, width: 100, height: 130, border: `3px solid ${C.sky}`, borderBottom: 'none', borderRadius: '50px 50px 0 0' }} />
      </div>
      {/* 문패 */}
      {t >= 3.4 && (
        <div style={{ ...abs(1336, 420 + (1 - sign) * -120, 528), opacity: Math.min(1, sign * 1.5), textAlign: 'center' }}>
          <div style={{ display: 'inline-block', padding: '14px 22px', borderRadius: 12, background: C.paper, color: C.deep, ...mono, fontSize: 25, fontWeight: 800, boxShadow: '0 14px 30px rgba(0,0,0,.4)' }}>
            <span style={{ color: '#d23c2a' }}>spacekijun</span>.lovable.app
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Term term="도메인" gloss="서버를 찾아오는 이름" style={{ padding: '6px 14px' }} />
          </div>
          <div style={{ marginTop: 8, fontSize: 17, color: C.coralSoft }}>앞의 spacekijun = 그 아래 하위 이름</div>
        </div>
      )}
      {/* 땅 + 호스팅 */}
      <div style={{ ...abs(1340, 770, 520, 6), background: C.sky, borderRadius: 3 }} />
      <div style={{ ...abs(1300, 800, 600), opacity: host, textAlign: 'center' }}>
        <Term term="호스팅" gloss="24시간 켜진 서버를 빌려 파일을 맡긴다" style={{ justifyContent: 'center' }} />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12 }}>
          {['Netlify — 이 수업 사이트', 'Lovable — 스페이스기전', 'GitHub Pages'].map((e) => <Chip key={e} color="#b7c3d6" size={16}>{e}</Chip>)}
        </div>
      </div>
      {/* 상자 */}
      {BOXES.map((b, i) => {
        const p = interpolate(t, [1.0 + i * 0.3, 2.0 + i * 0.3], [0, 1], easeInOut);
        const [sx, sy] = start[i];
        const x = sx + (end[0] - sx) * p;
        const y = sy + (end[1] - sy) * p - Math.sin(p * Math.PI) * 120;
        const sc = 1 - 0.55 * p;
        if (p >= 1) return null;
        return (
          <div key={b} style={{ ...abs(x - 85, y - 75, 170, 150), transform: `scale(${sc})`, opacity: p > 0.92 ? (1 - p) * 12 : 1 }}>
            <img src="assets/svg/moving-box.svg" alt="" aria-hidden style={{ width: 170, height: 150 }} />
            <div style={{ position: 'absolute', left: 19, top: 78, width: 92, height: 21, display: 'grid', placeItems: 'center', ...mono, fontSize: 12.5, fontWeight: 800, color: C.deep }}>{b}</div>
          </div>
        );
      })}
      {/* 요청하러 오는 휴대폰 (S3 회수) */}
      <div style={{ ...abs(760, 250), display: 'flex', gap: 26, opacity: phones }}>
        {[0, 1, 2].map((i) => (
          <svg key={i} width="40" height="66" viewBox="0 0 40 66" aria-hidden><rect x="3" y="3" width="34" height="60" rx="7" fill="none" stroke={C.ink} strokeWidth="3" /><path d="M15 54 L25 54" stroke={C.ink} strokeWidth="3" strokeLinecap="round" /></svg>
        ))}
      </div>
      <Arrow x1={980} y1={290} x2={1366} y2={360} color={C.ink} width={3} progress={phones} opacity={phones} />
      <div style={{ ...abs(760, 330, 300), ...small, opacity: phones }}>주소로 요청하면 누구나 연다</div>
    </>
  );
}

/* ═══════════════════ S9 — 한눈에: 다마고찌의 지도 (static) ═══════════════════ */
export type MapLit = { front?: boolean; back?: boolean; db?: boolean; host?: boolean };
export function WebMap({ lit, dim = false }: { lit?: MapLit; dim?: boolean }) {
  const on = (k: keyof MapLit) => !dim || !!lit?.[k];
  const op = (k: keyof MapLit) => ({ opacity: on(k) ? 1 : 0.22, transition: 'opacity .5s' });
  const ring = (k: keyof MapLit) => (dim && lit?.[k] ? C.coral : C.sky);
  return (
    <>
      {/* 호스팅 테두리 + 도메인 문패 */}
      <div style={{ ...abs(110, 240, 1220, 700), border: `3px dashed ${ring('host')}`, borderRadius: 26, ...op('host') }} />
      <div style={{ ...abs(130, 890), fontSize: 20, fontWeight: 800, color: ring('host'), ...op('host') }}>호스팅 · Lovable</div>
      <div style={{ ...abs(480, 214, 480), textAlign: 'center', ...op('host') }}>
        <span style={{ display: 'inline-block', padding: '8px 18px', borderRadius: 10, background: C.paper, color: C.deep, ...mono, fontSize: 21, fontWeight: 800 }}>spacekijun.lovable.app <span style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: '#5a6a80' }}>· 도메인</span></span>
      </div>
      {/* 프론트엔드 */}
      <div style={{ ...abs(180, 330), ...op('front') }}>
        <Phone w={240} h={400} color={ring('front')}>
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: C.lcd }}>
            <Pet name="adult-idle" px={4} />
          </div>
        </Phone>
      </div>
      <div style={{ ...abs(140, 750, 320), textAlign: 'center', ...op('front') }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: ring('front') }}>프론트엔드</div>
        <div style={{ ...small, fontSize: 18 }}>휴대폰 브라우저 · 화면 · 배고픔 계산</div>
      </div>
      {/* 요청·응답 */}
      <div style={{ ...op('back') }}>
        <Arrow x1={440} y1={470} x2={600} y2={470} color={C.ink} width={3} />
        <Arrow x1={600} y1={590} x2={440} y2={590} color={C.ink} width={3} />
        <div style={{ ...abs(452, 428), fontSize: 18, fontWeight: 700 }}>요청</div>
        <div style={{ ...abs(452, 602), fontSize: 18, fontWeight: 700 }}>응답</div>
      </div>
      {/* 백엔드 */}
      <div style={{ ...abs(612, 410), ...op('back') }}>
        <div style={{ width: 300, boxShadow: dim && lit?.back ? `0 0 0 3px ${C.coral}` : 'none', borderRadius: 16 }}>
          <Rack w={300} units={3} labels={['기준 시각', '저장 확인', '코인 · 가챠']} />
        </div>
      </div>
      <div style={{ ...abs(612, 750, 300), textAlign: 'center', ...op('back') }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: ring('back') }}>백엔드</div>
        <div style={{ ...small, fontSize: 18 }}>서버 · 속이면 안 되는 일</div>
      </div>
      {/* DB */}
      <div style={{ ...op('db') }}>
        <Arrow x1={922} y1={500} x2={1050} y2={500} color={C.ink} width={3} />
        <Arrow x1={1050} y1={570} x2={922} y2={570} color={C.ink} width={3} />
        <div style={{ ...abs(940, 458), fontSize: 17, fontWeight: 700 }}>쓰기</div>
        <div style={{ ...abs(940, 582), fontSize: 17, fontWeight: 700 }}>읽기</div>
      </div>
      <div style={{ ...abs(1060, 400), ...op('db') }}>
        <Cylinder w={220} h={290} color={ring('db')}>
          <div style={{ ...mono, fontSize: 17, lineHeight: 1.6, color: C.ink }}>tama_pet<br />코인 장부<br />…</div>
        </Cylinder>
      </div>
      <div style={{ ...abs(1020, 750, 300), textAlign: 'center', ...op('db') }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: ring('db') }}>DB</div>
        <div style={{ ...small, fontSize: 18 }}>펫 표 · 코인 장부</div>
      </div>
    </>
  );
}
const LADDER = [
  { level: 1 as const, t: '화면만', d: '프론트엔드' },
  { level: 2 as const, t: '+ 브라우저 저장', d: '내 기기에만 기억' },
  { level: 3 as const, t: '+ 서버·DB·배포', d: '여럿이 함께, 어디서나' },
];
export function MapSlide() {
  return (
    <>
      <Header kicker="웹 기초 정리" title="한눈에: 다마고찌의 지도" />
      <WebMap />
      <div style={{ ...abs(1400, 150, 440) }}>
        <div style={{ ...kick, color: C.sky }}>내 프로젝트는 어디까지?</div>
        {LADDER.map((s, i) => (
          <div key={s.level} style={{ marginTop: i === 0 ? 18 : 16, marginLeft: i * 26, ...solid, padding: '16px 18px', display: 'flex', gap: 16, alignItems: 'center' }}>
            <MiniMap level={s.level} w={150} />
            <div>
              <div style={{ fontSize: 23, fontWeight: 900 }}>{s.t}</div>
              <div style={{ ...small, fontSize: 17 }}>{s.d}</div>
            </div>
          </div>
        ))}
        <div style={{ ...small, marginTop: 22 }}>모든 프로젝트가 지도 전체를 쓰지는 않는다. 꼭 필요하지 않다면 위 칸이 훨씬 쉽다.</div>
      </div>
      <div style={{ ...abs(1400, 920) }}>
        <LinkButton href="https://spacekijun.lovable.app/tamagotchi" size={20}>다마고찌 열어 보기 ↗</LinkButton>
      </div>
    </>
  );
}
