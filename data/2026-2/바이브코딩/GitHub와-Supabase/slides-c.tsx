import Build from '../../../../src/deck/Build';
import { useSceneTime, interpolate, spring, riseIn, easeInOut } from '../../../../src/scene';
import {
  abs, C, SVG, COLLAB, kick, h1, body, small, mono, solid, Term, Chip, Code, Note, LinkButton, Mark, Cloud,
} from './shared';
import { Passport, stampPath } from './slides-a';

/* ═══════════════════ S21 — Supabase: 방금 낸 답도 여기 들어갔다 (scene · 컨베이어) ═══════════════════ */
const ANSWERS = ['①', '①', '②', '①', '④'];
export function ConveyorScene() {
  const t = useSceneTime();
  const BELT_Y = 540;
  const BOX = { x: 1300, y: 300, w: 460, h: 470 };
  return (
    <>
      <div style={{ ...abs(140, 60, 1000) }}>
        <div style={kick}>Supabase</div>
        <h2 style={{ ...h1, fontSize: 52, marginTop: 10 }}>방금 낸 답, <span style={{ color: C.teal }}>여기 있다</span></h2>
      </div>
      <div style={{ ...abs(140, 190, 1000), ...riseIn(t, 0.4) }}>
        <Term term="Supabase" gloss="데이터베이스를 인터넷에서 빌려 쓰게 해 주는 서비스 — 무료로 시작" color={C.teal} style={{ display: 'inline-flex' }} />
      </div>
      {/* 벨트 */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }} aria-hidden>
        <rect x="120" y={BELT_Y} width="1200" height="44" rx="22" fill="#5b6c80" stroke={C.ink} strokeWidth="3" />
        {Array.from({ length: 13 }, (_, i) => {
          const cx = 150 + i * 94;
          const rot = t * 220;
          return (
            <g key={i} transform={`translate(${cx} ${BELT_Y + 22}) rotate(${rot})`}>
              <circle r="16" fill="#c4d2e0" stroke={C.ink} strokeWidth="2.4" />
              <path d="M-10 0 L10 0" stroke={C.ink} strokeWidth="2.4" />
            </g>
          );
        })}
        <path d={`M180 ${BELT_Y + 44} L180 ${BELT_Y + 140} M1260 ${BELT_Y + 44} L1260 ${BELT_Y + 140}`} stroke={C.ink} strokeWidth="6" />
      </svg>
      {/* 답 카드 */}
      {ANSWERS.map((a, i) => {
        const start = 0.3 + i * 0.35;
        const x = interpolate(t, [start, start + 1.2], [120, 1260]);
        const inside = t >= start + 1.2;
        if (inside || t < start) return null;
        return (
          <div key={i} style={{ ...abs(x, BELT_Y - 92, 90, 88), borderRadius: 12, background: '#fffdf8', border: `3px solid ${C.violet}`, display: 'grid', placeItems: 'center', fontSize: 40, fontWeight: 900, color: C.violet }}>
            {a}
          </div>
        );
      })}
      <div style={{ ...abs(150, BELT_Y + 70), opacity: interpolate(t, [0.4, 0.7], [0, 1]) }}><Chip color={C.mute} size={16}>답 카드는 예시</Chip></div>
      {/* 상자 */}
      <div style={{ ...abs(BOX.x, BOX.y, BOX.w, BOX.h), borderRadius: 22, border: `4px solid ${C.teal}`, background: 'color-mix(in srgb, #1f9e7a 7%, #fffdf8)', boxShadow: '0 30px 60px -36px rgba(31,36,48,.6)' }}>
        <div style={{ padding: '20px 24px', borderBottom: `2px solid color-mix(in srgb, #1f9e7a 40%, transparent)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Mark size={34} color={C.teal}>Supabase</Mark>
          <span style={{ ...mono, fontSize: 15, color: C.mute }}>live_presentation_*</span>
        </div>
        <div style={{ padding: '16px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 90px', ...mono, fontSize: 16, fontWeight: 800, color: C.mute, paddingBottom: 6, borderBottom: '1px solid var(--hair)' }}>
            <span>번호</span><span>학생</span><span>답</span>
          </div>
          {ANSWERS.map((a, i) => {
            const at = 0.3 + i * 0.35 + 1.2;
            return t >= at ? (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 90px', fontSize: 20, padding: '8px 0', borderBottom: '1px solid var(--hair-2)', ...riseIn(t, at, 0.4, 12) }}>
                <span style={mono}>{i + 1}</span><span>{['학생 A', '학생 B', '학생 C', '학생 D', '학생 E'][i]}</span><span style={{ fontWeight: 900, color: C.violet }}>{a}</span>
              </div>
            ) : null;
          })}
        </div>
        <div style={{ position: 'absolute', right: -18, bottom: 70, padding: '8px 14px', borderRadius: 12, background: C.ink, color: '#fffdf8', fontSize: 17, fontWeight: 800, opacity: interpolate(t, [3.0, 3.3], [0, 1]) }}>🔒 RLS로 전부 잠금 · 정해진 문으로만</div>
      </div>
      {/* 안에 든 것 네 칩 — 상자 위 한 줄 */}
      <div style={{ ...abs(BOX.x - 60, BOX.y - 70, BOX.w + 120), display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
        {['PostgreSQL', '연결 주소', '로그인', '파일 보관'].map((k, i) => (
          <div key={k} style={{ opacity: Math.min(1, spring(t, 2.6 + i * 0.12, 0.6) * 1.4), transform: `translateY(${(1 - spring(t, 2.6 + i * 0.12, 0.6)) * 24}px)` }}>
            <Chip color={C.teal} solidFill={i === 0} size={i === 0 ? 24 : 18}>{k}</Chip>
          </div>
        ))}
      </div>
      <div style={{ ...abs(140, 790, 1560), ...riseIn(t, 3.2, 0.6) }}>
        <div style={{ fontSize: 24, fontWeight: 700, wordBreak: 'keep-all' }}>
          <b style={{ color: C.teal }}>PostgreSQL</b> — 가장 널리 쓰이는 데이터베이스 중 하나. Supabase가 그 위에 연결 주소·로그인·파일 보관을 묶어 빌려준다
        </div>
        <div style={{ ...small, marginTop: 12 }}>이 수업의 라이브 문항도, 선생님의 다마고찌도 Supabase에 저장된다</div>
      </div>
    </>
  );
}

/* ═══════════════════ S23 — 에이전트의 손은 내 폴더 안에 있다 (scene · 수족관 유리벽) ═══════════════════ */
export function GlassScene() {
  const t = useSceneTime();
  const GX = 1080;
  const reach = interpolate(t, [1.4, 2.0], [0, 1], easeInOut);
  const loop = Math.sin(t * 2.4);
  const ripple = interpolate(t, [2.0, 2.6], [0, 1]);
  const hand = t >= 2.4 ? ((t - 2.4) / 0.55) % 2 : -1;
  const handX = hand < 0 ? -1 : hand < 1 ? 1340 - hand * 520 : 820 + (hand - 1) * 520;
  const labels = ['클릭', '복사', '붙여넣기'];
  const lab = hand < 0 ? '' : labels[Math.min(2, Math.floor((t - 2.4) / 0.55))];
  return (
    <>
      <div style={{ ...abs(1180, 60, 640), textAlign: 'right' }}>
        <div style={kick}>MCP로 가는 다리</div>
        <h2 style={{ ...h1, fontSize: 52, marginTop: 10 }}>손이 <span style={{ color: C.warn }}>닿지 않는다</span></h2>
      </div>
      {/* 수조 */}
      <div style={{ ...abs(120, 190, GX - 120, 570), borderRadius: '24px 0 0 24px', background: 'color-mix(in srgb, #6c4cf0 5%, #fffdf8)', border: `3px solid ${C.ink}`, borderRight: 'none' }} />
      <div style={{ ...abs(150, 210) }}><Chip color={C.violet} size={18}>내 노트북 · vibe 폴더</Chip></div>
      {/* 파일 카드 */}
      {['index.html', 'style.css', '설계도.md'].map((f, i) => (
        <div key={f} style={{ ...abs(240 + i * 230, 500 + (i === 1 ? loop * 14 : 0), 190, 120), ...solid, display: 'grid', placeItems: 'center', ...mono, fontSize: 21, fontWeight: 800 }}>📄 {f}</div>
      ))}
      {/* Codex 손 */}
      <div style={{ ...abs(560 + reach * 330, 300 + loop * (1 - reach) * 20) }}>
        <svg width="300" height="120" viewBox="0 0 300 120" aria-hidden>
          <rect x="0" y="34" width="110" height="56" rx="12" fill={C.ink} />
          <text x="55" y="70" textAnchor="middle" fontSize="26" fontWeight="900" fill="#fffdf8" fontFamily="var(--font-mono)">&gt;_</text>
          <path d="M110 62 L230 62" stroke={C.violet} strokeWidth="10" strokeLinecap="round" />
          <path d="M226 62 C248 36 268 34 284 46 M226 62 C248 88 268 90 284 78" stroke={C.violet} strokeWidth="9" strokeLinecap="round" fill="none" />
        </svg>
        <div style={{ ...small, fontSize: 17, marginTop: -6 }}>Codex</div>
      </div>
      {/* 유리벽 */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }} aria-hidden>
        <rect x={GX} y="170" width="30" height="610" fill="#cfe3ef" stroke={C.ink} strokeWidth="3" opacity=".9" />
        <path d={`M${GX + 6} 260 L${GX + 24} 230 M${GX + 6} 330 L${GX + 24} 300`} stroke="#ffffff" strokeWidth="4" opacity=".8" />
        {ripple > 0 && ripple < 1 && [0, 1, 2].map((k) => (
          <circle key={k} cx={GX} cy="362" r={10 + (ripple * 60 + k * 18)} fill="none" stroke={C.violet} strokeWidth="3" opacity={1 - ripple} />
        ))}
        <rect x="120" y="780" width="1680" height="8" fill={C.ink} />
      </svg>
      {/* 바깥 Supabase */}
      <div style={{ ...abs(1300, 280, 440, 300), borderRadius: 20, border: `4px solid ${C.teal}`, background: 'color-mix(in srgb, #1f9e7a 7%, #fffdf8)', display: 'grid', placeItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Mark size={40} color={C.teal}>Supabase</Mark>
          <div style={{ ...small, marginTop: 10 }}>인터넷 저편 — 표 · 정책 · 키</div>
        </div>
      </div>
      {/* 사람 손 왕복 */}
      {hand >= 0 && (
        <div style={{ ...abs(handX, 800), display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 40 }}>🖱️</span>
          <Chip color={C.warn} size={18}>{lab}</Chip>
        </div>
      )}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: t >= 2.4 ? 1 : 0 }} aria-hidden>
        <path d="M700 840 L1560 840" stroke={C.warn} strokeWidth="3" strokeDasharray="10 10" />
      </svg>
      <div style={{ ...abs(150, 900, 1600), ...small, fontSize: 22, opacity: interpolate(t, [3.4, 3.8], [0, 1]) }}>
        연결이 없으면 내가 대시보드와 채팅 사이를 오가야 한다 — 비밀 키를 채팅에 붙이는 실수도 여기서 생긴다
      </div>
    </>
  );
}

/* ═══════════════════ S24 — MCP: 에이전트용 콘센트 규격 (scene) ═══════════════════ */
const OUTLETS = [
  { k: 'Supabase', x: 760, c: C.teal },
  { k: 'GitHub', x: 1110, c: C.violet },
  { k: 'Google Drive', x: 1460, c: C.mute },
];
const TOOLS = [
  { k: 'list_tables', d: '표 목록 보기' },
  { k: 'execute_sql', d: 'SQL 실행' },
  { k: 'apply_migration', d: '표 구조 바꾸기' },
  { k: 'get_publishable_keys', d: '공개 키 가져오기' },
];
export function OutletScene() {
  const t = useSceneTime();
  const plug = interpolate(t, [0.6, 1.6], [0, 1], easeInOut);
  const ghost = Math.min(interpolate(t, [3.4, 3.7], [0, 0.7]), interpolate(t, [4.3, 4.6], [0.7, 0]));
  /* 콘센트 SVG 160×200을 폭 150으로 — 구멍 중심 (80,100) → (75, 94) */
  const OY = 170;
  const holeY = OY + 94;
  const target = OUTLETS[0].x + 75;
  const px = 140 + (target - 330 - 140) * plug; /* 플러그 앞면이 구멍 앞에 오도록 */
  const py = 560 + (holeY - 80 * 0.92 - 560) * plug; /* 핀 중심선(y 80) → 구멍 높이 */
  return (
    <>
      <div style={{ ...abs(140, 60, 520) }}>
        <div style={kick}>MCP · Model Context Protocol</div>
        <h2 style={{ ...h1, fontSize: 50, marginTop: 10 }}>에이전트용 <span style={{ color: C.violet }}>콘센트 규격</span></h2>
      </div>
      {/* 벽 패널 */}
      <div style={{ ...abs(640, 80, 1200, 540), borderRadius: 24, background: '#2b3446', border: `3px solid ${C.ink}` }} />
      {OUTLETS.map((o) => (
        <div key={o.k}>
          <img src={`${SVG}/power-outlet.svg`} alt="" aria-hidden style={{ ...abs(o.x, OY, 150) }} />
          <div style={{ ...abs(o.x - 40, OY + 200, 230), textAlign: 'center' }}><Mark size={24} color={o.k === 'Supabase' ? C.tealSoft : o.k === 'GitHub' ? C.violetSoft : '#c4cad6'}>{o.k}</Mark></div>
        </div>
      ))}
      <div style={{ ...abs(680, 100), ...small, fontSize: 16, color: '#c4cad6' }}>서비스마다 같은 모양의 콘센트 — MCP 서버</div>
      {/* 도구 버튼 */}
      {TOOLS.map((tool, i) => {
        const at = 1.8 + i * 0.3;
        return (
          <div key={tool.k} style={{ ...abs(680 + i * 290, 480, 270), opacity: interpolate(t, [at, at + 0.25], [0, 1]), transform: `translateY(${(1 - spring(t, at, 0.5)) * 20}px)` }}>
            <div style={{ padding: '10px 12px', borderRadius: 12, background: C.teal, color: C.white, textAlign: 'center' }}>
              <div style={{ ...mono, fontSize: 15, fontWeight: 800 }}>{tool.k}</div>
              <div style={{ fontSize: 17, fontWeight: 700, marginTop: 2 }}>{tool.d}</div>
            </div>
          </div>
        );
      })}
      {/* 고스트 플러그 */}
      {ghost > 0 && <img src={`${SVG}/power-plug.svg`} alt="" aria-hidden style={{ ...abs(OUTLETS[1].x + 75 - 330, py, 360 * 0.92), opacity: ghost * 0.5, filter: 'grayscale(1)' }} />}
      {/* Codex 칩 + 플러그 */}
      <div style={{ ...abs(140, 760), display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ ...mono, padding: '14px 22px', borderRadius: 14, background: C.ink, color: '#fffdf8', fontSize: 28, fontWeight: 900 }}>&gt;_ Codex</span>
      </div>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }} aria-hidden>
        <path d={`M300 790 C ${px - 60} 900 ${px - 80} ${py + 160} ${px + 6} ${py + 118 * 0.92}`} stroke="#2b3a55" strokeWidth="9" fill="none" strokeLinecap="round" />
      </svg>
      <img src={`${SVG}/power-plug.svg`} alt="플러그" style={{ ...abs(px, py, 360 * 0.92) }} />
      {/* 용어 */}
      <div style={{ ...abs(640, 660, 1200), display: 'flex', flexDirection: 'column', gap: 12, ...riseIn(t, 2.8, 0.6) }}>
        <Term term="MCP" gloss="AI 에이전트가 바깥 서비스의 기능을 쓰는 공통 규격 (2024년 Anthropic 공개, 지금은 Codex도 쓴다)" color={C.ink} />
        <div style={{ display: 'flex', gap: 12 }}>
          <Term term="MCP 서버" gloss={<>서비스 쪽 연결 지점 — <span style={mono}>mcp.supabase.com/mcp</span></>} color={C.teal} style={{ flex: 1.3 }} />
          <Term term="도구" gloss="MCP 서버가 내미는 기능 하나하나" color={C.teal} style={{ flex: 1 }} />
        </div>
      </div>
      <div style={{ ...abs(140, 880, 460), ...small, fontSize: 19, opacity: interpolate(t, [3.6, 3.9], [0, 1]) }}>같은 플러그로 다른 콘센트에도 — 규격이 같으니까</div>
    </>
  );
}

/* ═══════════════════ S25 — 플러그인: 부품과 설명서가 든 키트 (build 4) ═══════════════════ */
export function KitSlide() {
  /* kit-box.svg 620×440을 폭 900으로 (배율 1.4516). 왼쪽 칸 (200,200) → (290,290), 오른쪽 칸 (424,200) → (615,290), 라벨 x 222~402,y 296~360 → (322~584, 430~523) */
  const K = { x: 860, y: 300 };
  return (
    <>
      <div style={{ ...abs(140, 70, 1100) }}>
        <div style={kick}>플러그인</div>
        <h2 style={{ ...h1, fontSize: 52, marginTop: 10 }}>부품과 설명서가 든 <span style={{ color: C.violet }}>키트</span></h2>
      </div>
      <Build at={1}>
        <img src={`${SVG}/kit-box.svg`} alt="뚜껑 열린 조립 키트 상자" style={{ ...abs(K.x, K.y, 900) }} />
        <div style={{ ...abs(K.x + 322, K.y + 430, 262, 93), display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          <div>
            <Mark size={24} color={C.ink}>Supabase</Mark>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.violet }}>플러그인</div>
          </div>
        </div>
        <div style={{ ...abs(140, 230, 640) }}>
          <Term term="플러그인" gloss="MCP 서버 연결 + 스킬을 한 번에 설치하는 묶음" />
        </div>
      </Build>
      <Build at={2}>
        <img src={`${SVG}/power-plug.svg`} alt="" aria-hidden style={{ ...abs(K.x + 120, K.y + 120, 240) }} />
        <div style={{ ...abs(K.x + 20, K.y + 10, 440) }}>
          <div style={{ ...solid, padding: '10px 14px' }}>
            <div style={{ ...mono, fontSize: 18, fontWeight: 800 }}>.mcp.json</div>
            <div style={{ ...mono, fontSize: 15, color: C.teal }}>→ https://mcp.supabase.com/mcp</div>
          </div>
        </div>
        <div style={{ ...abs(K.x + 120, K.y - 40) }}><Chip color={C.ink} size={17}>부품 = MCP 서버</Chip></div>
      </Build>
      <Build at={3}>
        {['supabase', 'supabase-postgres-best-practices'].map((s, i) => (
          <div key={s} style={{ ...abs(K.x + 470 + i * 60, K.y - 6 + i * 128, 400), padding: '12px 16px', borderRadius: 10, background: i === 0 ? '#fff4d6' : '#e9f4ff', border: `2.5px solid ${C.ink}`, boxShadow: '0 12px 26px -18px rgba(31,36,48,.7)', transform: `rotate(${i === 0 ? -4 : 3}deg)` }}>
            <div style={{ ...small, fontSize: 13, fontWeight: 800 }}>스킬 · SKILL.md</div>
            <div style={{ ...mono, fontSize: 17, fontWeight: 800, marginTop: 2 }}>{s}</div>
            {i === 0 && <div style={{ fontSize: 17, marginTop: 6, fontWeight: 700, color: C.violet }}>«표를 만들면 RLS를 켜고 정책을 건다»</div>}
          </div>
        ))}
        <div style={{ ...abs(K.x + 560, K.y - 40) }}><Chip color={C.ink} size={17}>설명서 = 스킬</Chip></div>
        <div style={{ ...abs(140, 340, 640) }}>
          <Term term="스킬" gloss="에이전트가 읽고 따르는 '일하는 요령' 문서" color={C.violet} />
        </div>
      </Build>
      <Build at={4} style={{ ...abs(140, 500, 640) }}>
        <div style={{ ...solid, padding: '18px 22px' }}>
          <div style={{ fontSize: 23, fontWeight: 800 }}>MCP만 연결하면</div>
          <div style={{ ...small, marginTop: 4 }}>부품만 받은 레고 — 도구는 있지만 조립 요령은 알아서</div>
        </div>
        <div style={{ ...solid, padding: '18px 22px', marginTop: 16, borderColor: C.violet, borderWidth: 3 }}>
          <div style={{ fontSize: 23, fontWeight: 800, color: C.violet }}>플러그인으로 설치하면</div>
          <div style={{ ...small, marginTop: 4 }}>부품 + 설명서 — RLS 같은 요령을 덜 빠뜨린다</div>
        </div>
        <div style={{ ...small, fontSize: 16, marginTop: 18 }}>교사 PC에 설치된 실제 Supabase 플러그인 파일에서 확인 (2026-10-28)</div>
      </Build>
    </>
  );
}

/* ═══════════════════ S28 — 에이전트에게 데이터베이스를 맡길 때 (static · 이륙 전 점검표) ═══════════════════ */
const CHECKS = [
  { b: '연습용 프로젝트에만 연결한다', s: '진짜 사람들의 데이터가 든 프로젝트는 연결하지 않는다. 꼭 필요하면 그 프로젝트 하나로 묶고(project_ref) 읽기 전용(read_only)으로', top: true },
  { b: '승인 창을 읽고 허락한다', s: '«지우기 · 표 삭제 · 정책 변경»이 보이면 멈춘다. 데이터베이스 작업에는 --yolo를 쓰지 않는다 (묻지 않고 다 해 버린다)' },
  { b: '비밀은 건네지 않는다', s: '비밀 키 · DB 비밀번호를 채팅에 붙이지 않는다 — MCP가 연결해 주니 필요 없다' },
  { b: '끝나면 보안 점검을 시킨다', s: '«모든 표에 RLS가 켜져 있고 정책이 맞는지 점검해 줘»' },
  { b: '표를 바꿨으면 커밋한다', s: '코드와 함께 기록이 남는다' },
];
export function ChecklistSlide() {
  return (
    <>
      <div style={{ ...abs(140, 60, 1200) }}>
        <div style={kick}>MCP 안전 수칙</div>
        <h2 style={{ ...h1, fontSize: 50, marginTop: 10 }}>에이전트에게 데이터베이스를 맡기기 전 <span style={{ color: C.warn }}>점검표</span></h2>
      </div>
      <div style={{ ...abs(1500, 70) }}><Chip color={C.mute} size={16}>Supabase MCP 공식 문서의 권고</Chip></div>
      <div style={{ ...abs(140, 190, 1220, 790), ...solid, padding: '6px 0', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        {CHECKS.map((c, i) => (
          <div key={c.b} style={{ flex: c.top ? 1.35 : 1, display: 'flex', alignItems: 'center', gap: 22, padding: '0 30px', borderTop: i ? '1px solid var(--hair-2)' : 'none', borderLeft: c.top ? `10px solid ${C.warn}` : '10px solid transparent' }}>
            <span style={{ ...mono, fontSize: c.top ? 46 : 34, fontWeight: 900, color: c.top ? C.warn : C.mute, width: 54 }}>{i + 1}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: c.top ? 34 : 28, fontWeight: 800, wordBreak: 'keep-all' }}>{c.b}</div>
              <div style={{ ...small, fontSize: c.top ? 21 : 19, marginTop: 6 }}>
                {c.s.split('--yolo').map((part, k, arr) => (
                  <span key={k}>{part}{k < arr.length - 1 && <Code size={17} color={C.warn}>--yolo</Code>}</span>
                ))}
              </div>
            </div>
            <span style={{ width: 54, height: 54, borderRadius: 10, border: `3px solid ${C.ink}`, display: 'grid', placeItems: 'center', fontSize: 30, fontWeight: 900, color: C.teal }}>✓</span>
          </div>
        ))}
      </div>
      {/* 활주로 */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }} aria-hidden>
        <path d="M1460 1000 L1560 260 M1800 1000 L1700 260" stroke={C.ink} strokeWidth="4" />
        {Array.from({ length: 7 }, (_, i) => {
          const y = 960 - i * 110;
          const k = (y - 260) / 740;
          return <path key={i} d={`M1630 ${y} L1630 ${y - 50 * (0.4 + 0.6 * k)}`} stroke="#fffdf8" strokeWidth={10 * (0.4 + 0.6 * k)} />;
        })}
        <path d="M1580 300 L1680 300" stroke={C.warn} strokeWidth="8" />
      </svg>
      <div style={{ ...abs(1440, 210, 400), textAlign: 'center', fontSize: 20, fontWeight: 800 }}>점검을 마쳐야 출발</div>
    </>
  );
}

/* ═══════════════════ S29 — 마무리: 도장 세 개 (scene · 표지의 거울상) ═══════════════════ */
export function ClosingScene() {
  const t = useSceneTime();
  const ats = [0.8, 1.5, 2.2];
  const st = stampPath(t, ats, 2.5);
  const press = ats.map((a) => Math.min(interpolate(t, [a - 0.05, a], [0, 1]), interpolate(t, [a + 0.3, a + 0.6], [1, 0])));
  const inked = ats.map((a, i) => (t >= a ? (i === 2 ? 'dashed' : 'solid') : null)) as ('solid' | 'dashed' | null)[];
  const next = interpolate(t, [2.8, 3.3], [0, 1], easeInOut);
  const SUM = [
    { c: C.violet, b: '기록 — GitHub', s: '커밋은 세이브, 푸시는 올리기' },
    { c: C.violet, b: '주소 — GitHub Pages', s: '사용자이름.github.io/저장소' },
    { c: C.teal, b: '기억 — Supabase (방법만)', s: '표 · RLS · 공개 키만 / MCP · 플러그인으로 에이전트가 직접' },
  ];
  return (
    <>
      <div style={{ ...abs(150, 120, 700) }}>
        <div style={{ ...kick, color: C.violet }}>오늘 받은 도장</div>
        <h1 style={{ ...h1, fontSize: 84, marginTop: 18 }}>
          내 폴더가
          <br />
          <span style={{ color: C.violet }}>세상에 나갔다</span>
        </h1>
        <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 22 }}>
          {SUM.map((s, i) => (
            <div key={s.b} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', ...riseIn(t, ats[i] + 0.1, 0.5) }}>
              <i style={{ width: 16, height: 16, borderRadius: '50%', background: s.c, marginTop: 10, flexShrink: 0, ...(i === 2 ? { background: 'transparent', border: `3px dashed ${s.c}` } : {}) }} />
              <div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{s.b}</div>
                <div style={{ ...small, fontSize: 20 }}>{s.s}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Passport press={press} inked={inked} stamp={st} style={{ left: 860, top: 220, transform: 'rotate(-3deg)' }} />
      {/* 다음 쪽 빈 칸 */}
      <div style={{ ...abs(1700 - next * 40, 860, 200, 150), opacity: next, borderRadius: 14, border: `3px dashed ${C.ink}`, background: '#fffdf8', display: 'grid', placeItems: 'center', textAlign: 'center', transform: 'rotate(4deg)' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900 }}>내 프로젝트</div>
          <div style={{ ...small, fontSize: 15 }}>다음 시간</div>
        </div>
      </div>
      <div style={{ ...abs(150, 860, 700), display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14, ...riseIn(t, 2.9, 0.6) }}>
        <div style={{ fontSize: 22, fontWeight: 700, wordBreak: 'keep-all' }}>
          다음 시간: <b>설계도.md</b>를 에이전트에게 읽혀 첫 버전부터 — 기능마다 커밋·푸시
        </div>
        <LinkButton href={COLLAB} size={18} color={C.teal}>협업보드 ↗</LinkButton>
      </div>
    </>
  );
}
