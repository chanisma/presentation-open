import type { CSSProperties } from 'react';
import Build from '../../../../src/deck/Build';
import Reveal from '../../../../src/deck/Reveal';
import { useDeck } from '../../../../src/deck/DeckContext';
import { useSceneTime, interpolate, spring, riseIn, easeInOut, easeOut } from '../../../../src/scene';
import { typed } from '../../../../src/walkthrough';
import { abs, C, kick, h1, h2, body, small, mono, card, solid, accentText, Code, Header, Stamp } from './shared';

/* ═══════════════════ S1 — 표지: 말에서 손으로 (scene) ═══════════════════
   metaphor: 채팅 말풍선 하나가 터미널 창으로 바뀌고, 그 아래로 파일이 떨어진다 */
const S1_REQ = '자기소개 페이지 만들어줘';
const S1_CODE = ['<!doctype html>', '<h1>안녕, 나는 ○○</h1>', '<p>좋아하는 것 세 가지</p>', '<button>더 보기</button>'];
export function TitleScene() {
  const t = useSceneTime();
  const m = interpolate(t, [1.6, 2.4], [0, 1], easeInOut); // 말풍선 → 터미널 변형
  const fileS = spring(t, 3.6, 0.7);
  const bub = (at: number): CSSProperties => {
    const s = spring(t, at, 0.6);
    return { opacity: Math.min(1, s * 1.4), transform: `translateY(${(1 - s) * 16}px) scale(${0.92 + 0.08 * s})` };
  };
  return (
    <>
      {/* 왼쪽 위 — 채팅 말풍선 셋 */}
      <div style={{ ...abs(150, 150, 360), ...bub(0.3), padding: '14px 22px', borderRadius: '22px 22px 6px 22px', background: 'color-mix(in srgb, var(--primary) 22%, var(--bg))', border: '1px solid var(--hair)', fontSize: 22, fontWeight: 700, marginLeft: 200, textAlign: 'right' }}>
        {S1_REQ}
      </div>
      <div style={{ ...abs(150, 240, 420), ...bub(0.75), padding: '14px 22px', borderRadius: '22px 22px 22px 6px', ...card, fontSize: 21, color: 'var(--fg-muted)' }}>
        네, 아래 코드를 복사해 쓰세요
      </div>
      {/* 셋째 말풍선 → 터미널 창 */}
      <div
        style={{
          ...abs(150, 330, 560 + 120 * m, 200 + 10 * m),
          ...bub(1.2),
          borderRadius: 22 - 12 * m,
          background: `color-mix(in srgb, var(--fg) ${8 - 5 * m}%, var(--bg))`,
          border: `1px solid ${m > 0.5 ? C.mint : 'var(--hair)'}`,
          boxShadow: m > 0.5 ? 'var(--glow)' : 'none',
          overflow: 'hidden',
          ...mono,
          fontSize: 20,
          lineHeight: 1.6,
        }}
      >
        {/* 제목줄 — 변형되며 드러남 */}
        <div style={{ height: 38 * m, opacity: m, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', background: 'color-mix(in srgb, var(--fg) 7%, var(--bg))', borderBottom: '1px solid var(--hair-2)', fontSize: 14, color: 'var(--fg-faint)' }}>
          <i style={{ width: 10, height: 10, borderRadius: 5, background: 'var(--hair)' }} /> <i style={{ width: 10, height: 10, borderRadius: 5, background: 'var(--hair)' }} /> PowerShell — vibe
        </div>
        <div style={{ padding: '14px 22px', position: 'relative' }}>
          <div style={{ opacity: 1 - m, color: 'var(--fg-muted)' }}>
            {S1_CODE.map((l, i) => <div key={i}>{l}</div>)}
          </div>
          <div style={{ position: 'absolute', left: 22, top: 14, opacity: m, fontWeight: 700, color: 'var(--fg)' }}>
            {typed(t, S1_REQ, 2.4, 14)}
            <span style={{ display: 'inline-block', width: 11, height: 22, marginLeft: 4, verticalAlign: '-3px', background: (t * 2.2) % 1 < 0.55 ? C.mint : 'transparent' }} />
            {t > 3.3 && <div style={{ color: C.mintSoft, fontWeight: 500 }}>● index.html을 만들었습니다</div>}
          </div>
        </div>
      </div>
      {/* 떨어지는 파일 */}
      <div style={{ ...abs(400, 600), opacity: Math.min(1, fileS * 1.5), transform: `translateY(${(1 - fileS) * -60}px)`, display: 'flex', alignItems: 'center', gap: 14 }}>
        <svg width="56" height="68" viewBox="0 0 56 68" aria-hidden>
          <path d="M6 4h30l14 14v46H6z" fill="color-mix(in srgb, var(--primary) 20%, var(--bg))" stroke={C.mint} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M36 4v14h14" fill="none" stroke={C.mint} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M14 34h28M14 44h28M14 54h18" stroke={C.mintSoft} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        </svg>
        <span style={{ ...mono, fontSize: 24, fontWeight: 700, color: C.mint }}>index.html</span>
      </div>
      {/* 오른쪽 밴드 — 제목 */}
      <div style={{ ...abs(1000, 300, 820) }}>
        <div style={{ ...kick, ...riseIn(t, 0.4, 0.7, 18) }}>바이브코딩 · 2026-2</div>
        <h1 style={{ ...h1, fontSize: 128, marginTop: 18, lineHeight: 1.02, ...riseIn(t, 0.7, 0.8, 24) }}>
          에이전트에게<br /><span style={accentText}>첫 명령</span>
        </h1>
        <p style={{ ...body, fontSize: 27, marginTop: 30, ...riseIn(t, 1.1, 0.8, 18) }}>
          Codex를 설치하고, 첫 명령을 내리고,<br />첫 웹 페이지를 띄운다
        </p>
      </div>
    </>
  );
}

/* ═══════════════════ S2 — 세 정거장 중 둘 (build 3) ═══════════════════ */
const STATIONS = [
  { x: 380, name: '바이브코딩 프로그램 설치', today: true },
  { x: 960, name: 'AI 에이전트 사용 방법', today: true },
  { x: 1540, name: 'AI를 활용한 프로젝트 기획 문서 작성', today: false },
];
export function StationsSlide() {
  const { clicks } = useDeck();
  const c = Math.min(clicks, 9);
  return (
    <>
      <Header x={1000} y={100} w={820} align="right" kicker="지난 시간의 예고" title="세 정거장 중 둘" />
      <div style={{ ...abs(120, 100, 700), ...body }}>오리엔테이션에서 예고한 세 정거장. 오늘은 앞의 둘을 갑니다.</div>
      {/* 노선 */}
      <svg style={{ ...abs(0, 0, 1920, 1080), pointerEvents: 'none' }} viewBox="0 0 1920 1080" aria-hidden>
        <line x1={160} y1={520} x2={1760} y2={520} stroke="var(--hair)" strokeWidth={10} strokeLinecap="round" />
        <line x1={160} y1={520} x2={c >= 1 ? 1250 : 160} y2={520} stroke={C.mint} strokeWidth={10} strokeLinecap="round" style={{ transition: 'x2 .6s ease' }} />
        {c >= 2 && <line x1={1250} y1={520} x2={1760} y2={520} stroke="var(--fg-faint)" strokeWidth={6} strokeDasharray="14 16" strokeLinecap="round" />}
      </svg>
      {STATIONS.map((s, i) => {
        const on = s.today ? c >= 1 : c >= 2;
        return (
          <div key={i} style={{ ...abs(s.x - 200, 440, 400), textAlign: 'center' }}>
            <div
              style={{
                width: 76, height: 76, borderRadius: 38, margin: '0 auto',
                border: `6px ${s.today ? 'solid' : 'dashed'} ${on ? (s.today ? C.mint : 'var(--fg-faint)') : 'var(--hair)'}`,
                background: on && s.today ? 'color-mix(in srgb, var(--primary) 25%, var(--bg))' : 'var(--bg)',
                boxShadow: on && s.today ? 'var(--glow)' : 'none',
                display: 'grid', placeItems: 'center', ...mono, fontSize: 30, fontWeight: 800, color: on ? 'var(--fg)' : 'var(--fg-faint)',
                transition: 'all .5s ease',
              }}
            >
              {i + 1}
            </div>
            <div style={{ ...body, fontSize: 24, fontWeight: 700, color: on ? 'var(--fg)' : 'var(--fg-faint)', marginTop: 20, transition: 'color .5s' }}>{s.name}</div>
          </div>
        );
      })}
      <Build at={1} style={{ ...abs(560, 330), zIndex: 3 }}>
        <Stamp>오늘</Stamp>
      </Build>
      <Build at={2} style={{ ...abs(1420, 330), zIndex: 3 }}>
        <Stamp color="var(--fg-faint)" rotate={5}>다음 시간</Stamp>
      </Build>
      <Build at={3} style={{ ...abs(160, 760, 1600) }}>
        <div style={{ ...kick, marginBottom: 16 }}>오늘 끝나면 손에 남는 것</div>
        <div style={{ display: 'flex', gap: 18 }}>
          {['설치된 Codex', '작업 폴더 vibe', '내가 만든 첫 웹 페이지'].map((x) => (
            <div key={x} style={{ ...solid, padding: '16px 28px', fontSize: 26, fontWeight: 800, borderColor: C.mint }}>{x}</div>
          ))}
        </div>
      </Build>
    </>
  );
}

/* ═══════════════════ S3 — 에이전트: 스스로 채워지는 체크리스트 (scene) ═══════════════════ */
const S3_TASKS = ['폴더 살펴보기', 'index.html 만들기', '브라우저에서 열어 확인', '오류가 있으면 고치기', '완료 보고'];
export function ChecklistScene() {
  const t = useSceneTime();
  // 체크 시각: ①②③ 순서, ④는 빨간 줄 → 되돌아감 → 늦은 체크, ⑤ 마지막
  const checkAt = [4.2, 4.7, 5.2, 6.6, 7.1];
  const redAt = 5.7;
  const stampS = spring(t, 7.6, 0.6);
  const popup = Math.min(interpolate(t, [5.2, 5.5], [0, 1]), interpolate(t, [6.0, 6.3], [1, 0]));
  return (
    <>
      <Header x={120} y={100} w={540} kicker="에이전트란" title={<>스스로 채워지는<br />체크리스트</>} />
      <div style={{ ...abs(120, 420, 470), ...card, padding: '22px 26px', borderTopLeftRadius: 4, ...riseIn(t, 0.2, 0.6, 14) }}>
        <div style={{ ...kick, marginBottom: 8 }}>내가 한 말 — 한 줄</div>
        <div style={{ fontSize: 30, fontWeight: 800, wordBreak: 'keep-all' }}>"자기소개 페이지 만들어줘"</div>
      </div>
      <div style={{ ...abs(120, 640, 470), ...small, fontSize: 19, opacity: interpolate(t, [4.0, 4.6], [0, 1]) }}>
        오른쪽 다섯 줄은 내가 쓴 게 아니다.<br />에이전트가 스스로 쓰고, 스스로 지운다.
      </div>
      {/* 클립보드 (SVG 자산, 덱 좌표 viewBox) */}
      <img src="assets/svg/clipboard-check.svg" alt="" aria-hidden style={{ ...abs(700, 120, 1020, 860), opacity: interpolate(t, [0, 0.5], [0, 1]) }} />
      {/* 할 일 다섯 줄 — 에이전트가 직접 쓰듯 타이핑 */}
      {S3_TASKS.map((task, i) => {
        const y = 380 + 100 * i;
        const done = t >= checkAt[i];
        const red = i === 3 && t >= redAt && t < checkAt[3];
        return (
          <div key={i}>
            <div style={{ ...abs(930, y - 2, 620), fontSize: 30, fontWeight: 700, color: done ? 'var(--fg)' : 'var(--fg-muted)', textDecoration: red ? `underline wavy ${C.rose}` : 'none', textUnderlineOffset: 8 }}>
              {typed(t, `${i + 1}. ${task}`, 0.6 + 0.7 * i, 16)}
            </div>
            {done && (
              <svg style={{ ...abs(846, y - 6, 60, 60) }} viewBox="0 0 60 60" aria-hidden>
                <path d="M12 32 L26 45 L50 14" fill="none" stroke={C.mint} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
                  strokeDasharray={80} strokeDashoffset={80 * (1 - Math.min(1, (t - checkAt[i]) / 0.35))} />
              </svg>
            )}
          </div>
        );
      })}
      {/* ③ 확인 단계 — 작은 브라우저 팝업 */}
      <div style={{ ...abs(1300, 300, 320, 200), ...solid, opacity: popup, transform: `scale(${0.9 + 0.1 * popup})`, overflow: 'hidden' }}>
        <div style={{ height: 30, background: 'color-mix(in srgb, var(--fg) 8%, transparent)', borderBottom: '1px solid var(--hair-2)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 6 }}>
          <i style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--hair)' }} /><i style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--hair)' }} />
          <span style={{ ...mono, fontSize: 12, color: 'var(--fg-faint)', marginLeft: 6 }}>index.html</span>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>안녕, 나는 ○○</div>
          <div style={{ width: '70%', height: 8, background: 'var(--hair)', borderRadius: 4, marginTop: 10 }} />
          <div style={{ width: '50%', height: 8, background: 'var(--hair)', borderRadius: 4, marginTop: 8 }} />
          <div style={{ display: 'inline-block', marginTop: 14, padding: '6px 14px', borderRadius: 8, background: C.mint, color: C.navy, fontSize: 14, fontWeight: 800 }}>더 보기</div>
        </div>
      </div>
      {/* ④ → ③ 되돌이 화살 (박스 왼쪽 바깥, 가장자리 앵커) */}
      {t >= redAt && t < checkAt[3] + 0.3 && (
        <svg style={{ ...abs(760, 560, 100, 140) }} viewBox="0 0 100 140" aria-hidden>
          <path d="M70 128 C 20 128, 20 20, 62 20" fill="none" stroke={C.rose} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={200} strokeDashoffset={200 * (1 - interpolate(t, [redAt + 0.2, redAt + 0.8], [0, 1]))} />
          {t > redAt + 0.75 && <path d="M50 8 L64 20 L50 32" fill="none" stroke={C.rose} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
          <text x="4" y="80" fontSize="18" fontWeight="800" fill={C.rose} fontFamily="var(--font-body)">다시</text>
        </svg>
      )}
      {/* 완료 스탬프 */}
      <div style={{ ...abs(1380, 780), opacity: Math.min(1, stampS * 1.6), transform: `scale(${0.6 + 0.4 * stampS})` }}>
        <Stamp size={34}>완료</Stamp>
      </div>
      {/* 하단 정의 문장 (정식 용어) */}
      <div style={{ ...abs(120, 770, 520), ...card, padding: '18px 22px', borderColor: C.mint, ...body, fontSize: 21, opacity: interpolate(t, [7.8, 8.4], [0, 1]) }}>
        <div style={{ ...kick, color: C.mint, marginBottom: 6 }}>정식 용어</div>
        <b style={{ color: 'var(--fg)' }}>AI 에이전트</b> — 목표를 받아 스스로 단계를 정하고, 도구를 써서 실행하며, 결과를 확인해 다음 행동을 정하는 인공지능
      </div>
    </>
  );
}

/* ═══════════════════ S4 — 유리벽: 웹 채팅과 CLI (scene) ═══════════════════ */
export function GlassWallScene() {
  const t = useSceneTime();
  const wallDown = interpolate(t, [2.6, 3.3], [0, 1], easeInOut);
  // 코드 조각: 채팅창에서 나와 벽에 부딪힘
  const chipX = interpolate(t, [0.5, 1.4], [520, 730], easeOut);
  const chipBounce = t > 1.4 && t < 1.7 ? Math.sin(((t - 1.4) / 0.3) * Math.PI) * 14 : 0;
  const arrowP = interpolate(t, [1.6, 2.4], [0, 1], easeInOut);
  const fileLanded = spring(t, 2.4, 0.5);
  const termS = spring(t, 3.4, 0.6);
  const f1 = spring(t, 3.9, 0.5);
  const f2 = spring(t, 4.1, 0.5);
  const openS = interpolate(t, [4.3, 4.8], [0, 1], easeInOut);
  const FileCard = ({ x, y, s, name, open = 0 }: { x: number; y: number; s: number; name: string; open?: number }) => (
    <div style={{ ...abs(x, y, 150, 96), opacity: Math.min(1, s * 1.5), transform: `translateY(${(1 - s) * 20}px) rotate(${-open * 6}deg)`, ...solid, borderRadius: 12, padding: '10px 12px', ...mono, fontSize: 15, borderColor: open > 0.5 ? C.mint : 'var(--hair)' }}>
      <div style={{ color: C.mint, fontWeight: 700 }}>{name}</div>
      <div style={{ width: `${60 + open * 30}%`, height: 6, background: 'var(--hair)', borderRadius: 3, marginTop: 8 }} />
      <div style={{ width: `${40 + open * 40}%`, height: 6, background: 'var(--hair)', borderRadius: 3, marginTop: 6 }} />
    </div>
  );
  return (
    <>
      <Header x={120} y={90} w={900} kicker="웹 채팅과 CLI" title="유리벽이 사라진다" />
      {/* 왼쪽 방 — 웹 채팅 */}
      <div style={{ ...abs(140, 270, 470, 420), ...solid, overflow: 'hidden', opacity: 1 - wallDown * 0.5 }}>
        <div style={{ height: 40, display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', borderBottom: '1px solid var(--hair-2)', fontSize: 14, color: 'var(--fg-faint)' }}>
          <i style={{ width: 9, height: 9, borderRadius: 5, background: 'var(--hair)' }} /> chatgpt.com — 웹 채팅
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ alignSelf: 'flex-end', padding: '8px 14px', borderRadius: '14px 14px 4px 14px', background: 'color-mix(in srgb, var(--primary) 20%, var(--bg))', fontSize: 17 }}>페이지 만들어줘</div>
          <div style={{ padding: '8px 14px', borderRadius: '14px 14px 14px 4px', ...card, fontSize: 16, color: 'var(--fg-muted)' }}>아래 코드를 복사해서 파일로 저장하세요</div>
          <div style={{ ...mono, fontSize: 14, padding: '8px 12px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--hair)', color: 'var(--fg-muted)' }}>&lt;h1&gt;안녕&lt;/h1&gt;<br />&lt;button&gt;…&lt;/button&gt;</div>
        </div>
      </div>
      <div style={{ ...abs(140, 700, 470), ...small, textAlign: 'center' }}>대답은 여기까지. 파일은 <b style={{ color: 'var(--fg)' }}>내가</b> 옮긴다</div>
      {/* 코드 조각 — 벽에 부딪힘 */}
      {t > 0.5 && t < 2.5 && (
        <div style={{ ...abs(chipX, 520 - chipBounce, 150), ...mono, fontSize: 15, padding: '8px 12px', borderRadius: 8, background: 'var(--bg)', border: `1px solid ${C.sky}`, color: C.sky, opacity: 1 - interpolate(t, [2.2, 2.5], [0, 1]) }}>
          &lt;h1&gt;안녕&lt;/h1&gt;
        </div>
      )}
      {/* 복사 → 붙여넣기 점선 화살 (벽을 넘는다) */}
      {t > 1.6 && t < 3.0 && (
        <svg style={{ ...abs(640, 380, 340, 200) }} viewBox="0 0 340 200" aria-hidden>
          <path d="M20 150 C 80 20, 220 20, 300 120" fill="none" stroke={C.amber} strokeWidth="4" strokeDasharray="10 10" strokeDashoffset={-(t * 30)} opacity={0.9} style={{ clipPath: `inset(0 ${(1 - arrowP) * 100}% 0 0)` }} />
          {arrowP > 0.95 && <path d="M280 96 L302 122 L272 130" fill="none" stroke={C.amber} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
          <text x="80" y="24" fontSize="20" fontWeight="800" fill={C.amber} fontFamily="var(--font-body)">복사 → 붙여넣기</text>
        </svg>
      )}
      {/* 유리벽 */}
      <div style={{ ...abs(756, 240, 18, 700), borderRadius: 9, background: 'linear-gradient(180deg, rgba(87,242,176,0.55), rgba(124,196,255,0.25))', border: `1px solid ${C.mint}`, boxShadow: '0 0 30px rgba(87,242,176,0.35)', transform: `translateY(${wallDown * 820}px)`, opacity: 1 - wallDown }} />
      {t < 2.6 && <div style={{ ...abs(700, 210, 130), textAlign: 'center', ...kick, color: C.mint }}>유리벽</div>}
      {/* 오른쪽 방 — 작업 폴더 */}
      <div style={{ ...abs(880, 240, 900, 680), border: `3px dashed ${wallDown > 0.9 ? C.mint : 'var(--hair)'}`, borderRadius: 26, transition: 'border-color .4s' }} />
      <div style={{ ...abs(910, 216, 400), ...mono, fontSize: 20, fontWeight: 700, background: 'var(--bg)', display: 'inline-block', width: 'auto', padding: '0 12px', color: wallDown > 0.9 ? C.mint : 'var(--fg-muted)' }}>
        {wallDown > 0.9 && t > 4.4 ? '작업 폴더 = 에이전트의 작업대' : '내 컴퓨터 · 문서\\vibe'}
      </div>
      <FileCard x={960} y={500} s={fileLanded} name="복사한.html" />
      {/* 터미널 — 폴더 안에 직접 나타나 파일을 만든다 */}
      <div style={{ ...abs(1240, 300, 500, 250), ...solid, borderColor: C.mint, opacity: Math.min(1, termS * 1.5), transform: `translateY(${(1 - termS) * 20}px)`, overflow: 'hidden' }}>
        <div style={{ height: 36, display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', background: 'color-mix(in srgb, var(--fg) 7%, var(--bg))', borderBottom: '1px solid var(--hair-2)', fontSize: 13, color: 'var(--fg-faint)', ...mono }}>PowerShell — vibe · codex</div>
        <div style={{ padding: '12px 16px', ...mono, fontSize: 17, lineHeight: 1.7 }}>
          <div style={{ fontWeight: 700 }}>{typed(t, '페이지 파일을 만들고 스타일도 붙여 줘', 3.6, 16)}</div>
          {t > 3.9 && <div style={{ color: C.mintSoft }}>● index.html 생성</div>}
          {t > 4.1 && <div style={{ color: C.mintSoft }}>● style.css 생성</div>}
          {t > 4.3 && <div style={{ color: C.mintSoft }}>● index.html을 읽어 확인 ✓</div>}
        </div>
      </div>
      <FileCard x={1000} y={640} s={f1} name="index.html" open={openS} />
      <FileCard x={1200} y={700} s={f2} name="style.css" />
      <div style={{ ...abs(1360, 720, 400), ...small, fontSize: 19, opacity: interpolate(t, [4.4, 5.0], [0, 1]) }}>
        만들고 · 읽고 · 실행한다.<br />옮기는 사람이 필요 없다.
      </div>
      {/* 하단 대비 */}
      <div style={{ ...abs(120, 970, 1680), display: 'flex', gap: 40, ...small, fontSize: 20, opacity: interpolate(t, [4.6, 5.2], [0, 1]) }}>
        <span><b style={{ color: 'var(--fg)' }}>웹 채팅</b> — 대화창 안에서 답을 준다 · 파일은 내가 복사해 옮긴다</span>
        <span><b style={{ color: C.mint }}>CLI</b> — 내 작업 폴더 안에서 일한다 · 파일 생성 · 내 파일 읽기 · 명령 실행</span>
      </div>
    </>
  );
}

/* ═══════════════════ S5 — CLI로 할 수 있는 일 (build 2 + wordcloud) ═══════════════════ */
const USES = [
  { x: 130, y: 270, r: -4, w: 380, text: '다운로드 폴더의 파일 300개를 종류별 폴더로 정리' },
  { x: 540, y: 230, r: 3, w: 360, text: '수행평가 사진 100장을 한 번에 크기 줄여 압축' },
  { x: 180, y: 470, r: 2, w: 400, text: '발표 대본 텍스트를 카드뉴스 형식 HTML로 변환' },
  { x: 620, y: 440, r: -3, w: 340, text: '영어 단어 목록으로 시험지 5종 자동 생성' },
  { x: 330, y: 660, r: 4, w: 420, text: '시간표와 수행평가 마감을 한 화면에 보여 주는 페이지' },
];
export function UsesSlide() {
  const { clicks } = useDeck();
  const dim = clicks >= 2 && clicks < 9999;
  return (
    <>
      <Header x={1040} y={100} w={780} align="right" kicker="CLI로 할 수 있는 일" title="손으로 하던 일은 대부분" />
      <Build at={1} style={{ ...abs(0, 0, 1920, 1080), pointerEvents: 'none' }}>
        {USES.map((u, i) => (
          <div key={i} style={{ ...abs(u.x, u.y, u.w), ...solid, padding: '16px 20px', fontSize: 21, fontWeight: 600, transform: `rotate(${u.r}deg)`, opacity: dim ? 0.55 : 1, transition: 'opacity .4s', wordBreak: 'keep-all', borderRadius: 8 }}>
            <span style={{ ...mono, color: 'var(--fg-faint)', fontSize: 14, display: 'block', marginBottom: 4 }}>영수증 #{i + 1}</span>
            {u.text}
          </div>
        ))}
      </Build>
      <Build at={2} style={{ ...abs(1040, 400, 760, 520), zIndex: 3 }}>
        <div style={{ ...solid, borderColor: C.mint, boxShadow: 'var(--glow)', height: '100%', overflow: 'hidden', position: 'relative' }}>
          <div style={{ height: 44, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', borderBottom: '1px solid var(--hair-2)', fontSize: 15, color: 'var(--fg-faint)', ...mono }}>
            <i style={{ width: 10, height: 10, borderRadius: 5, background: 'var(--hair)' }} /><i style={{ width: 10, height: 10, borderRadius: 5, background: 'var(--hair)' }} />
            <span style={{ marginLeft: 8, padding: '3px 14px', borderRadius: 999, background: 'color-mix(in srgb, var(--fg) 8%, transparent)' }}>localhost — 내가 만든 페이지</span>
          </div>
          <div style={{ padding: '30px 34px' }}>
            <div style={kick}>이번 학기의 용도</div>
            <div style={{ ...h2, fontSize: 54, marginTop: 10 }}>웹 프로그램 개발</div>
            <p style={{ ...body, marginTop: 16 }}>브라우저에서 열리는 프로그램을 만든다. 오늘은 그 첫 장을 띄운다.</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              {['index.html', 'style.css', 'script.js'].map((f) => <Code key={f} size={17}>{f}</Code>)}
            </div>
          </div>
          <div style={{ position: 'absolute', right: 26, top: 60 }}><Stamp rotate={8}>이번 학기는 이것</Stamp></div>
        </div>
      </Build>
      <div style={{ ...abs(120, 980, 1000), ...kick }}>라이브 · 워드클라우드 "내 컴퓨터에서 AI가 대신 해 줬으면 하는 일 하나" → 그다음 클릭</div>
    </>
  );
}

/* ═══════════════════ S6 — 무대 뒤: 웹 페이지는 코드, 코드는 파일 (scene) ═══════════════════ */
const S6_HTML = ['<!doctype html>', '<h1>안녕, 나는 유진</h1>', '<p>좋아하는 것 세 가지</p>', '<ul><li>농구</li><li>떡볶이</li></ul>', '<button id="more">더 보기</button>', '<script src="script.js"></script>'];
const S6_FILES = [
  { name: 'index.html', role: '내용', color: C.mint, y: 380 },
  { name: 'style.css', role: '모양', color: C.sky, y: 520 },
  { name: 'script.js', role: '동작', color: C.amber, y: 660 },
];
export function FlipScene() {
  const t = useSceneTime();
  const rot = interpolate(t, [0.8, 1.8], [0, 180], easeInOut);
  const back = rot > 90;
  const termS = spring(t, 3.4, 0.6);
  return (
    <>
      <Header x={120} y={90} w={800} kicker="프로그램은 코드다" title="웹 페이지를 뒤집으면" />
      {/* 카드 — Y축 뒤집기 */}
      <div style={{ ...abs(200, 300, 620, 460), perspective: 1600 }}>
        <div style={{ position: 'absolute', inset: 0, transform: `rotateY(${rot}deg)`, transformStyle: 'preserve-3d' }}>
          {/* 앞면: 웹 페이지 */}
          <div style={{ position: 'absolute', inset: 0, ...solid, background: '#f4f7fb', color: '#12203a', backfaceVisibility: 'hidden', overflow: 'hidden', borderRadius: 18 }}>
            <div style={{ height: 40, background: '#e5eaf2', display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', fontSize: 13, color: '#5b6a83', ...mono }}>
              <i style={{ width: 9, height: 9, borderRadius: 5, background: '#c3cbd8' }} /><i style={{ width: 9, height: 9, borderRadius: 5, background: '#c3cbd8' }} /> index.html
            </div>
            <div style={{ padding: '34px 40px' }}>
              <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: '-0.02em' }}>안녕, 나는 유진</div>
              <div style={{ fontSize: 22, color: '#4a5a75', marginTop: 12 }}>좋아하는 것 세 가지</div>
              <ul style={{ fontSize: 22, marginTop: 10, paddingLeft: 26, color: '#2b3a55' }}><li>농구</li><li>떡볶이</li><li>새벽 산책</li></ul>
              <div style={{ display: 'inline-block', marginTop: 16, padding: '12px 26px', borderRadius: 10, background: '#1d4ed8', color: '#fff', fontWeight: 800, fontSize: 20 }}>더 보기</div>
            </div>
          </div>
          {/* 뒷면: 코드 */}
          <div style={{ position: 'absolute', inset: 0, ...solid, transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', overflow: 'hidden', borderRadius: 18, borderColor: C.mint }}>
            <div style={{ height: 40, display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', fontSize: 13, color: 'var(--fg-faint)', borderBottom: '1px solid var(--hair-2)', ...mono }}>index.html — 코드</div>
            <div style={{ padding: '22px 28px', ...mono, fontSize: 20, lineHeight: 1.7, color: 'var(--fg)' }}>
              {S6_HTML.map((l, i) => <div key={i}><span style={{ color: 'var(--fg-faint)', marginRight: 18 }}>{i + 1}</span>{l}</div>)}
            </div>
            <div style={{ position: 'absolute', right: 20, bottom: 18, display: 'flex', gap: 8 }}>
              <Code size={14} color={C.sky}>style.css · 12줄</Code>
              <Code size={14} color={C.amber}>script.js · 6줄</Code>
            </div>
          </div>
        </div>
      </div>
      <div style={{ ...abs(200, 790, 620), ...small, textAlign: 'center', opacity: back ? 1 : 0.5 }}>
        {back ? '뒤집으면 전부 글자 — 코드' : '보이는 것: 제목·글·버튼'}
      </div>
      {/* 폴더 트리 */}
      <svg style={{ ...abs(0, 0, 1920, 1080), pointerEvents: 'none' }} viewBox="0 0 1920 1080" aria-hidden>
        <line x1={1100} y1={356} x2={1100} y2={700} stroke="var(--hair)" strokeWidth={4} strokeLinecap="round" opacity={interpolate(t, [2.0, 2.6], [0, 1])} />
        {S6_FILES.map((f) => (
          <line key={f.name} x1={1100} y1={f.y + 40} x2={1180} y2={f.y + 40} stroke="var(--hair)" strokeWidth={4} strokeLinecap="round" opacity={interpolate(t, [2.0, 2.6], [0, 1])} />
        ))}
      </svg>
      <div style={{ ...abs(1050, 280, 300), ...mono, fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 12, opacity: interpolate(t, [2.0, 2.5], [0, 1]) }}>
        <svg width="34" height="28" viewBox="0 0 34 28" aria-hidden><path d="M2 6 Q2 3 5 3 H12 L15 6 H29 Q32 6 32 9 V23 Q32 26 29 26 H5 Q2 26 2 23 Z" fill="color-mix(in srgb, var(--primary) 40%, transparent)" stroke={C.mint} strokeWidth="2" /></svg>
        vibe/
      </div>
      {S6_FILES.map((f, i) => {
        const p = interpolate(t, [2.2 + i * 0.25, 3.1 + i * 0.25], [0, 1], easeInOut);
        const x = 300 + (1180 - 300) * p;
        const y = 500 + (f.y - 500) * p;
        const s = 0.6 + 0.4 * p;
        const labelOn = t > 3.5 + i * 0.2;
        return (
          <div key={f.name} style={{ ...abs(x, y, 260, 80), opacity: p === 0 ? 0 : 1, transform: `scale(${s})`, transformOrigin: 'left center', ...solid, borderColor: f.color, borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ ...mono, fontSize: 22, fontWeight: 700, color: f.color }}>{f.name}</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--fg)', opacity: labelOn ? 1 : 0, transition: 'opacity .3s', padding: '2px 10px', borderRadius: 6, background: 'color-mix(in srgb, var(--fg) 10%, transparent)' }}>{f.role}</span>
          </div>
        );
      })}
      {/* 터미널 아이콘 — 에이전트가 규칙 라벨을 붙인다 */}
      <div style={{ ...abs(1500, 292, 300), opacity: Math.min(1, termS * 1.5), transform: `translateX(${(1 - termS) * 20}px)`, display: 'flex', alignItems: 'center', gap: 12, ...mono, fontSize: 18, color: C.mintSoft }}>
        <span style={{ display: 'inline-grid', placeItems: 'center', width: 40, height: 40, borderRadius: 10, background: 'color-mix(in srgb, var(--primary) 25%, var(--bg))', border: `1px solid ${C.mint}`, fontWeight: 800 }}>&gt;_</span>
        에이전트가 만들고 관리
      </div>
      <div style={{ ...abs(120, 968, 1680), ...body, fontSize: 22, textAlign: 'center', opacity: interpolate(t, [4.0, 4.6], [0, 1]) }}>
        프로그램은 <b style={{ color: 'var(--fg)' }}>코드</b>로 이루어져 있고, 코드는 <b style={{ color: 'var(--fg)' }}>파일</b>에 담긴다. 에이전트는 그 파일들을 만들고, 고치고, 규칙대로 정리한다.
      </div>
    </>
  );
}

/* ═══════════════════ S7 — 설치 지도: 관리자 권한 없이 가는 길 (build 3) ═══════════════════ */
export function MapSlide() {
  const { clicks } = useDeck();
  const c = Math.min(clicks, 9);
  return (
    <>
      <Header x={1000} y={100} w={820} align="right" kicker="설치 지도" title="설치는 하나, 원칙은 셋" />
      <div style={{ ...abs(120, 100), ...kick }}>관리자 권한 없이 가는 길</div>
      <svg style={{ ...abs(0, 0, 1920, 1080), pointerEvents: 'none' }} viewBox="0 0 1920 1080" aria-hidden>
        <line x1={360} y1={200} x2={360} y2={900} stroke="var(--hair)" strokeWidth={10} strokeLinecap="round" />
        <line x1={360} y1={200} x2={360} y2={c >= 1 ? 560 : 200} stroke={C.mint} strokeWidth={10} strokeLinecap="round" style={{ transition: 'all .5s' }} />
        {c >= 2 && (
          <path d="M360 600 C 360 700, 500 680, 620 700 M620 700 C 700 720, 700 800, 620 860" fill="none" stroke="var(--fg-faint)" strokeWidth={6} strokeDasharray="12 14" strokeLinecap="round" />
        )}
      </svg>
      {/* Codex 정거장 */}
      <div style={{ ...abs(290, 350, 140, 140), borderRadius: 70, border: `8px solid ${c >= 1 ? C.mint : 'var(--hair)'}`, background: c >= 1 ? 'color-mix(in srgb, var(--primary) 22%, var(--bg))' : 'var(--bg)', boxShadow: c >= 1 ? 'var(--glow)' : 'none', display: 'grid', placeItems: 'center', ...mono, fontSize: 26, fontWeight: 800, transition: 'all .5s' }}>Codex</div>
      <Build at={1} style={{ ...abs(470, 340, 620) }}>
        <div style={{ ...kick, color: C.mint }}>필수 · 오늘 설치</div>
        <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>Codex CLI — 공식 설치 명령 한 줄</div>
        <div style={{ ...mono, fontSize: 16, marginTop: 10, color: 'var(--fg-muted)', wordBreak: 'break-all' }}>내 사용자 폴더 · %LOCALAPPDATA%\Programs\OpenAI\Codex\bin</div>
        <div style={{ ...small, marginTop: 6 }}>Node.js 불필요 · 관리자 권한 불필요</div>
      </Build>
      {/* 지선 — 오늘은 아니다 */}
      {[{ y: 640, n: 'Node.js' }, { y: 800, n: 'Git' }].map((s) => (
        <div key={s.n} style={{ ...abs(570, s.y, 100, 100), borderRadius: 50, border: `5px dashed ${c >= 2 ? 'var(--fg-faint)' : 'var(--hair)'}`, display: 'grid', placeItems: 'center', ...mono, fontSize: 18, fontWeight: 700, color: c >= 2 ? 'var(--fg-muted)' : 'var(--hair)', transition: 'all .5s', background: 'var(--bg)' }}>{s.n}</div>
      ))}
      <Build at={2} style={{ ...abs(700, 690, 300) }}>
        <div style={{ ...kick }}>오늘은 아니다</div>
        <div style={{ ...small, marginTop: 6 }}>프로젝트가 커져 도구 상자(npm)나 변경 기록(git)이 필요해지면 그 수업에서. 오늘 첫 페이지는 브라우저만 있으면 열린다.</div>
      </Build>
      {/* 원칙 카드 — 계단식 */}
      {[
        { x: 1000, y: 260, w: 800, n: '①', t: '관리자 암호를 묻는 창이 뜨면, 그 길이 아니다', b: '멈추고 손을 든다 — 선생님이 처리한다', warn: true },
        { x: 1040, y: 470, w: 760, n: '②', t: '작업 폴더 이름은 영문', b: '문서 안에 vibe 폴더 · 한글·공백 없이' },
        { x: 1080, y: 680, w: 720, n: '③', t: '설치 뒤에는 터미널을 새로 연다', b: '옛 창은 새 PATH를 모른다' },
      ].map((p, i) => (
        <Build key={i} at={3} style={{ ...abs(p.x, p.y, p.w) }}>
          <div style={{ ...solid, padding: '20px 26px', display: 'flex', gap: 18, alignItems: 'flex-start', borderColor: p.warn ? C.amber : 'var(--hair)' }}>
            <span style={{ ...mono, fontSize: 30, fontWeight: 800, color: p.warn ? C.amber : C.mint }}>{p.n}</span>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, wordBreak: 'keep-all', color: p.warn ? C.amber : 'var(--fg)' }}>{p.t}</div>
              <div style={{ ...small, marginTop: 4 }}>{p.b}</div>
            </div>
          </div>
        </Build>
      ))}
      <div style={{ ...abs(120, 980, 1680), ...small, fontSize: 18, color: 'var(--fg-faint)' }}>
        학교 노트북(Intune) 참고 — 시스템 설정은 못 바꾸지만 <b style={{ color: 'var(--fg-muted)' }}>내 사용자 폴더와 사용자 환경 변수는 바꿀 수 있다</b>. 오늘의 모든 단계는 그 안에서 끝난다.
      </div>
    </>
  );
}

/* 미사용 경고 방지 — Reveal은 다른 파일에서 쓴다 */
export { Reveal };
