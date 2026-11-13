import type { CSSProperties, ReactNode } from 'react';
import Build from '../../../../src/deck/Build';
import { useDeck } from '../../../../src/deck/DeckContext';
import { useSceneTime, interpolate, spring, riseIn, easeInOut } from '../../../../src/scene';
import {
  abs, C, SVG, kick, h1, body, small, mono, solid, Header, Term, Chip, Code, Note,
  Arrow, Cloud, Laptop, CommitDot, Mark,
} from './shared';

/* ═══════════════════ S1 · S29 공용 — 펼친 여권과 도장 칸 ═══════════════════
   passport-open.svg 1000px 폭(배율 1.5625). 오른쪽 사증 면 = 상대좌표 x 537~925, y 91~612.
   rubber-stamp.svg 폭 110px → 인면 중심은 이미지 위에서 141px, 가로 55px. */
export const SLOTS = [
  { label: '기록', sub: 'GitHub', color: C.violet, cy: 196 },
  { label: '주소', sub: 'GitHub Pages', color: C.violet, cy: 356 },
  { label: '기억', sub: 'Supabase', color: C.teal, cy: 516 },
];
const SLOT_CX = 731;
const SLOT_R = 68;

/** press: 0~1 도장이 내려온 정도(칸 윤곽이 진해짐) · inked: 찍힌 도장 자국 표시 · dashedInk: 점선 도장 */
export function Passport({ press, inked, stamp, style }: { press: number[]; inked?: ('solid' | 'dashed' | null)[]; stamp?: { x: number; y: number; o: number } | null; style?: CSSProperties }) {
  return (
    <div style={{ position: 'absolute', width: 1000, height: 688, ...style }}>
      <img src={`${SVG}/passport-open.svg`} alt="펼친 여권" style={{ ...abs(0, 0, 1000, 688) }} />
      {SLOTS.map((s, i) => {
        const p = press[i] ?? 0;
        const ink = inked?.[i] ?? null;
        return (
          <div key={s.label} style={{ ...abs(SLOT_CX - SLOT_R, s.cy - SLOT_R, SLOT_R * 2, SLOT_R * 2) }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: `3px dashed color-mix(in srgb, ${s.color} ${40 + p * 60}%, transparent)`,
                background: `color-mix(in srgb, ${s.color} ${p * 10}%, transparent)`,
              }}
            />
            {ink && (
              <div
                style={{
                  position: 'absolute',
                  inset: 6,
                  borderRadius: '50%',
                  border: `5px ${ink === 'dashed' ? 'dashed' : 'solid'} ${s.color}`,
                  display: 'grid',
                  placeItems: 'center',
                  transform: `rotate(${-8 + i * 7}deg)`,
                  color: s.color,
                  textAlign: 'center',
                  lineHeight: 1.1,
                }}
              >
                <div>
                  <div style={{ fontSize: 26, fontWeight: 900 }}>{s.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, marginTop: 4 }}>{s.sub}</div>
                </div>
              </div>
            )}
            {!ink && (
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center', color: s.color, opacity: 0.55 + p * 0.45 }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 900 }}>{s.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, marginTop: 4 }}>{s.sub}</div>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {stamp && stamp.o > 0 && (
        <img src={`${SVG}/rubber-stamp.svg`} alt="" aria-hidden style={{ ...abs(stamp.x - 55, stamp.y - 141, 110), opacity: stamp.o }} />
      )}
    </div>
  );
}

/** 도장이 칸 i를 누르는 궤적 — 시작 at, 내려옴 0.3s · 머묾 0.15s · 올라감 0.25s */
export function stampPath(t: number, ats: number[], exitAt: number) {
  let idx = 0;
  for (let i = 0; i < ats.length; i++) if (t >= ats[i] - 0.35) idx = i;
  const at = ats[idx];
  const down = interpolate(t, [at - 0.35, at], [1, 0], easeInOut);
  const up = interpolate(t, [at + 0.15, at + 0.4], [0, 1], easeInOut);
  const lift = Math.max(down, up) * 90;
  const o = Math.min(interpolate(t, [ats[0] - 0.6, ats[0] - 0.3], [0, 1]), interpolate(t, [exitAt, exitAt + 0.3], [1, 0]));
  return { x: SLOT_CX, y: SLOTS[idx].cy - lift, o, idx };
}

/* ═══════════════════ S1 — 표지: 내 폴더에서 세상으로 (scene) ═══════════════════ */
export function TitleScene() {
  const t = useSceneTime();
  const ats = [0.9, 1.6, 2.3];
  const st = stampPath(t, ats, 2.6);
  const press = ats.map((a) => Math.min(interpolate(t, [a - 0.05, a], [0, 1]), interpolate(t, [a + 0.3, a + 0.6], [1, 0])));
  return (
    <>
      <div style={{ ...abs(150, 250, 700) }}>
        <div style={{ ...kick, color: C.violet, ...riseIn(t, 0.1) }}>바이브코딩 · 2026-2</div>
        <h1 style={{ ...h1, fontSize: 112, marginTop: 22, ...riseIn(t, 0.25) }}>
          내 폴더에서
          <br />
          <span style={{ color: C.violet }}>세상으로</span>
        </h1>
        <p style={{ ...body, fontSize: 28, marginTop: 34, maxWidth: 640, ...riseIn(t, 0.5) }}>
          고친 기록을 남기고, 친구가 들어올 주소를 얻고, 사이트가 기억하게 하는 방법
        </p>
        <div style={{ marginTop: 34, display: 'flex', gap: 12, flexWrap: 'wrap', ...riseIn(t, 0.7) }}>
          <Chip color={C.violet}>GitHub</Chip>
          <Chip color={C.violet}>GitHub Pages</Chip>
          <Chip color={C.teal}>Supabase</Chip>
          <Chip color={C.ink}>MCP · 플러그인</Chip>
        </div>
      </div>
      {/* 폴더 칩 */}
      <div style={{ ...abs(150, 900), display: 'flex', alignItems: 'center', gap: 14, ...riseIn(t, 0.9) }}>
        <svg width="54" height="42" viewBox="0 0 54 42" aria-hidden>
          <path d="M3 8 C3 5 5 3 8 3 L20 3 L25 9 L46 9 C49 9 51 11 51 14 L51 36 C51 39 49 39 46 39 L8 39 C5 39 3 37 3 34 Z" fill="#f2c36b" stroke={C.ink} strokeWidth="2.4" strokeLinejoin="round" />
        </svg>
        <Code size={24} color={C.ink}>vibe/</Code>
        <span style={{ ...small }}>아직 내 노트북 밖으로 나가 본 적 없는 폴더</span>
      </div>
      <Passport press={press} stamp={st} style={{ left: 860, top: 220, transform: `rotate(-3deg) translateY(${(1 - spring(t, 0, 0.9)) * 40}px)`, opacity: Math.min(1, spring(t, 0, 0.9) * 1.4) }} />
    </>
  );
}

/* ═══════════════════ S2 — 지난 시간의 질문에 오늘 답한다 (build 4) ═══════════════════ */
const TAGS = [
  { q: '에이전트가 망쳐 놓으면 되돌릴 수 있나?', isNew: true, tool: 'GitHub', sub: '커밋 — 저장 지점', color: C.violet },
  { q: '친구가 자기 폰에서 열 수 있나?', isNew: false, tool: 'GitHub Pages', sub: '내 페이지에 주소를', color: C.violet },
  { q: '내일도 살아 있나? 누가 무엇을 남겼나?', isNew: false, tool: 'Supabase', sub: '데이터베이스', color: C.teal },
  { q: '에이전트가 그 데이터베이스를 직접 만지려면?', isNew: false, tool: 'MCP · 플러그인', sub: 'Codex ↔ Supabase 연결', color: C.mute },
];
function Tag({ children, isNew }: { children: ReactNode; isNew: boolean }) {
  return (
    <div style={{ position: 'relative', height: 120, display: 'flex', alignItems: 'center' }}>
      <svg width="720" height="120" viewBox="0 0 720 120" style={{ position: 'absolute', inset: 0 }} aria-hidden>
        <path d="M60 6 L704 6 C710 6 714 10 714 16 L714 104 C714 110 710 114 704 114 L60 114 L8 60 Z" fill="#fffdf8" stroke={isNew ? C.violet : C.ink} strokeWidth={isNew ? 3.5 : 2.2} strokeLinejoin="round" />
        <circle cx="44" cy="60" r="9" fill="var(--bg)" stroke={C.ink} strokeWidth="2" />
      </svg>
      <div style={{ position: 'relative', paddingLeft: 80, paddingRight: 24, fontSize: 27, fontWeight: 700, wordBreak: 'keep-all', lineHeight: 1.3 }}>{children}</div>
      {isNew && <Chip color={C.violet} solidFill size={15} style={{ position: 'absolute', right: 18, top: -14 }}>NEW · 오늘 더한 질문</Chip>}
    </div>
  );
}
export function QuestionsSlide() {
  const Y = (i: number) => 230 + i * 170;
  return (
    <>
      <Header kicker="지난 시간에서 이어서" title="막혔던 질문에, 오늘 도구 하나씩" />
      {TAGS.map((g, i) => (
        <div key={i} style={{ ...abs(140, Y(i), 720) }}>
          <Tag isNew={g.isNew}>{g.q}</Tag>
        </div>
      ))}
      {TAGS.map((g, i) => (
        <Build key={`a${i}`} at={i + 1}>
          <Arrow x1={872} y1={Y(i) + 60} x2={1010} y2={Y(i) + 60} color={g.color} width={4} head={16} dashed={i === 3} />
          <div style={{ ...abs(1024, Y(i) + (i === 3 ? 16 : 4), i === 3 ? 520 : 640, i === 3 ? 88 : 112), ...solid, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 22, padding: '0 28px', border: `${i === 3 ? '2.5px dashed' : '3px solid'} ${g.color}`, background: i === 3 ? '#fffdf8' : `color-mix(in srgb, ${g.color} 8%, #fffdf8)` }}>
            <Mark size={i === 3 ? 30 : 40} color={g.color}>{g.tool}</Mark>
            <span style={{ ...small, fontSize: 21 }}>{g.sub}</span>
          </div>
        </Build>
      ))}
      <Build at={4} style={{ ...abs(140, 940, 1640) }}>
        <div style={{ ...small, fontSize: 22 }}>
          오늘 순서도 위에서 아래로 — <b style={{ color: C.violet }}>앞의 둘은 직접 하고</b>, <b style={{ color: C.teal }}>뒤의 둘은 방법을 본다</b>
        </div>
      </Build>
    </>
  );
}

/* ═══════════════════ S3 — 에이전트가 망쳐 놓으면 (scene · 모래성과 파도) ═══════════════════ */
const TOWERS = [
  { x: 640, w: 170, h: 250, file: 'index.html' },
  { x: 880, w: 190, h: 330, file: 'style.css' },
  { x: 1140, w: 170, h: 270, file: 'script.js' },
];
const BASE_Y = 900;
function towerPath(x: number, w: number, h: number, ruin: number) {
  /* ruin 0 → 성곽 꼭대기 · 1 → 무너져 비탈 */
  const top = BASE_Y - h * (1 - ruin * 0.48);
  const c = w / 5;
  if (ruin < 0.02) {
    return `M${x} ${BASE_Y} L${x} ${top} L${x + c} ${top} L${x + c} ${top + 22} L${x + 2 * c} ${top + 22} L${x + 2 * c} ${top} L${x + 3 * c} ${top} L${x + 3 * c} ${top + 22} L${x + 4 * c} ${top + 22} L${x + 4 * c} ${top} L${x + w} ${top} L${x + w} ${BASE_Y} Z`;
  }
  const s = ruin * 60;
  return `M${x - s} ${BASE_Y} C${x - s * 0.4} ${top + 60} ${x + c} ${top + 10} ${x + 2 * c} ${top + 18} C${x + 3 * c} ${top + 24} ${x + 4 * c} ${top + 40} ${x + w + s * 0.6} ${BASE_Y} Z`;
}
export function SandScene() {
  const t = useSceneTime();
  const front = t < 2.0 ? interpolate(t, [0.8, 1.8], [-200, 1560], easeInOut) : interpolate(t, [2.0, 2.8], [1560, -260], easeInOut);
  const ruin = interpolate(t, [1.2, 2.2], [0, 1], easeInOut);
  const keyO = interpolate(t, [2.8, 3.1], [0, 1]);
  const strike = interpolate(t, [3.2, 3.5], [0, 1]);
  const waveH = 260;
  return (
    <>
      <div style={{ ...abs(140, 70, 900) }}>
        <div style={kick}>바이브코딩의 고통</div>
        <h2 style={{ ...h1, fontSize: 56, marginTop: 10 }}>한 줄 부탁, 세 파일 변경</h2>
      </div>
      {/* 말풍선 */}
      <div style={{ ...abs(140, 220), ...riseIn(t, 0.2) }}>
        <div style={{ position: 'relative', padding: '18px 28px', borderRadius: 22, background: C.violet, color: C.white, fontSize: 30, fontWeight: 800 }}>
          버튼 색만 바꿔 줘
          <svg width="40" height="30" viewBox="0 0 40 30" style={{ position: 'absolute', left: 40, bottom: -26 }} aria-hidden>
            <path d="M0 0 L36 0 L6 28 Z" fill={C.violet} />
          </svg>
        </div>
      </div>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }} aria-hidden>
        {/* 모래사장 */}
        <path d="M0 760 C400 730 900 770 1920 740 L1920 1080 L0 1080 Z" fill="#ecd9b0" />
        <path d="M0 790 C500 770 1100 800 1920 772" stroke="#d8c08e" strokeWidth="3" fill="none" opacity=".7" />
        {/* 성 */}
        {TOWERS.map((w) => (
          <path key={w.file} d={towerPath(w.x, w.w, w.h, ruin)} fill="#dcbf86" stroke={C.ink} strokeWidth="3" strokeLinejoin="round" />
        ))}
        <path d={`M600 ${BASE_Y} L1360 ${BASE_Y}`} stroke={C.ink} strokeWidth="3" />
        {/* 파도 */}
        <g transform={`translate(${front - 1700} 0)`}>
          <path d={`M0 ${BASE_Y + 20} L0 ${BASE_Y - waveH} C600 ${BASE_Y - waveH - 40} 1300 ${BASE_Y - waveH + 30} 1560 ${BASE_Y - waveH + 10} C1680 ${BASE_Y - waveH + 30} 1700 ${BASE_Y - 120} 1660 ${BASE_Y + 20} Z`} fill={C.teal} opacity=".72" stroke={C.ink} strokeWidth="2.6" />
          <path d={`M200 ${BASE_Y - waveH + 18} C700 ${BASE_Y - waveH - 6} 1200 ${BASE_Y - waveH + 40} 1560 ${BASE_Y - waveH + 30}`} stroke="#ffffff" strokeWidth="6" fill="none" opacity=".7" strokeLinecap="round" />
        </g>
      </svg>
      {/* 깃발 */}
      {TOWERS.map((w, i) => {
        const top = BASE_Y - w.h * (1 - ruin * 0.48);
        const lean = ruin * (i === 1 ? -28 : 24);
        return (
          <div key={w.file} style={{ ...abs(w.x + w.w / 2, top - 96), transform: `rotate(${lean}deg)`, transformOrigin: '0 96px' }}>
            <div style={{ width: 4, height: 96, background: C.ink }} />
            <div style={{ position: 'absolute', left: 4, top: 0 }}>
              <Code size={20} color={C.ink}>{w.file}</Code>
            </div>
          </div>
        );
      })}
      <div style={{ ...abs(1000, 540), opacity: interpolate(t, [2.6, 2.9], [0, 1]) }}>
        <Chip color={C.warn} size={20}>어디가 바뀌었지?</Chip>
      </div>
      {/* Ctrl+Z */}
      <div style={{ ...abs(1460, 240, 360), opacity: keyO, textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <span style={{ ...mono, display: 'inline-block', fontSize: 64, fontWeight: 900, padding: '18px 36px', borderRadius: 18, border: `3px solid ${C.ink}`, borderBottomWidth: 9, background: '#fffdf8', color: C.ink }}>Ctrl+Z</span>
          <svg width="320" height="140" viewBox="0 0 320 140" style={{ position: 'absolute', left: -20, top: -10 }} aria-hidden>
            <path d={`M10 120 L${10 + 300 * strike} ${120 - 110 * strike}`} stroke={C.warn} strokeWidth="9" strokeLinecap="round" />
          </svg>
        </div>
        <div style={{ ...small, marginTop: 18, fontSize: 21, opacity: strike }}>에이전트가 바꾼 파일에는 되돌리기가 없다</div>
      </div>
    </>
  );
}

/* ═══════════════════ S4 — Git과 GitHub는 다르다 (build 3) ═══════════════════ */
function Shutter({ size = 140 }: { size?: number }) {
  const blades = Array.from({ length: 6 }, (_, i) => i * 60);
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" aria-hidden>
      <circle cx="70" cy="70" r="64" fill="#fffdf8" stroke={C.ink} strokeWidth="4" />
      <circle cx="70" cy="70" r="50" fill={C.violet} stroke={C.ink} strokeWidth="3" />
      {blades.map((a) => (
        <path key={a} d="M70 70 L70 22 C88 24 104 36 112 52 Z" fill="#8a70f4" stroke={C.ink} strokeWidth="2" transform={`rotate(${a} 70 70)`} strokeLinejoin="round" />
      ))}
      <circle cx="70" cy="70" r="14" fill={C.ink} />
    </svg>
  );
}
export function GitHubSlide() {
  return (
    <>
      <Header kicker="도구 둘" title="Git과 GitHub는 다르다" />
      <Build at={1} style={{ ...abs(150, 300, 620) }}>
        <Laptop w={520}>
          <Shutter size={150} />
        </Laptop>
        <div style={{ marginTop: 26, textAlign: 'center', width: 520 }}>
          <Mark size={44} color={C.violet}>Git</Mark>
          <span style={{ ...small, fontSize: 22, marginLeft: 14 }}>내 노트북 안</span>
        </div>
        <Term term="Git" gloss="파일이 어떻게 바뀌어 왔는지 기록하는 프로그램" style={{ marginTop: 18, width: 580 }} />
        <div style={{ ...small, marginTop: 10, paddingLeft: 6 }}>인터넷이 없어도 돈다</div>
      </Build>
      <Build at={2}>
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }} aria-hidden>
          <path d="M700 330 C780 220 900 210 1010 260" fill="none" stroke={C.violet} strokeWidth="4" strokeDasharray="12 10" strokeLinecap="round" />
          <path d="M992 244 L1012 262 L986 270" fill="none" stroke={C.violet} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ ...abs(1020, 170) }}>
          <Cloud w={720}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 74px)', gap: 12 }}>
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} style={{ height: 56, borderRadius: 8, border: `2px solid ${C.ink}`, background: i % 3 === 0 ? C.violetSoft : i % 3 === 1 ? '#f6dfb2' : C.tealSoft }} />
              ))}
            </div>
          </Cloud>
          <div style={{ marginTop: 6, textAlign: 'center', width: 720 }}>
            <Mark size={44} color={C.violet}>GitHub</Mark>
            <span style={{ ...small, fontSize: 22, marginLeft: 14 }}>인터넷</span>
          </div>
          <Term term="GitHub" gloss="Git 기록을 올려 두고 나누는 웹사이트" style={{ marginTop: 18, width: 640, marginLeft: 40 }} />
        </div>
      </Build>
      <Build at={3} style={{ ...abs(1060, 830, 700) }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ ...small, fontSize: 22 }}>올려 두면:</span>
          <Chip color={C.ink}>백업</Chip>
          <Chip color={C.ink}>다른 기기 · 친구와 공유</Chip>
          <Chip color={C.violet} solidFill>웹사이트로 서비스</Chip>
        </div>
      </Build>
      <Build at={3} style={{ ...abs(150, 960, 1620) }}>
        <div style={{ display: 'flex', gap: 40, fontSize: 24, fontWeight: 800 }}>
          <span>Git = <span style={{ color: C.violet }}>Codex가 설치하고 실행</span></span>
          <span>GitHub = <span style={{ color: C.violet }}>내가 가입</span></span>
        </div>
      </Build>
    </>
  );
}

/* ═══════════════════ S5 — 저장소와 커밋: 세이브 슬롯 (scene) ═══════════════════ */
const SAVES = [
  { x: 380, msg: '첫 페이지', hash: 'a1f3c2e' },
  { x: 700, msg: '제목 추가', hash: '4b9d0e1' },
  { x: 1020, msg: '사진 넣기', hash: 'c7e21a8' },
  { x: 1340, msg: '버튼 색 변경', hash: '9f0b5d3' },
];
const BAR_Y = 560;
export function SaveScene() {
  const t = useSceneTime();
  const runX = interpolate(t, [0.4, 2.8], [180, 1640]);
  const back = interpolate(t, [3.4, 4.2], [0, 1], easeInOut);
  const charX = t < 3.4 ? runX : 1640 + (SAVES[2].x - 1640) * back;
  const charY = BAR_Y - Math.sin(back * Math.PI) * 140;
  const bug = interpolate(t, [2.6, 2.9], [0, 1]);
  const flash = t > 2.8 && t < 3.4 ? 0.5 + 0.5 * Math.sin(t * 30) : 1;
  return (
    <>
      <Header kicker="커밋" title={<>잘 될 때마다 <span style={{ color: C.violet }}>세이브</span></>} />
      {/* 오른쪽 위 세이브 슬롯 */}
      <div style={{ ...abs(1400, 70, 380), ...solid, padding: '14px 18px', ...riseIn(t, 0.2) }}>
        <div style={{ ...kick, fontSize: 13 }}>세이브 슬롯</div>
        {SAVES.slice(0, 3).map((s, i) => {
          const on = t >= 0.4 + ((s.x - 180) / 1460) * 2.4;
          return (
            <div key={s.hash} style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8, fontSize: 18, fontWeight: 700, color: on ? C.ink : C.faint }}>
              <span style={{ ...mono, fontSize: 14 }}>슬롯 {i + 1}</span>
              <span>{on ? s.msg : '— 비어 있음'}</span>
            </div>
          );
        })}
      </div>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }} aria-hidden>
        <line x1="180" y1={BAR_Y} x2="1700" y2={BAR_Y} stroke="color-mix(in srgb, #1f2430 18%, transparent)" strokeWidth="10" strokeLinecap="round" />
        <line x1="180" y1={BAR_Y} x2={Math.min(runX, 1640)} y2={BAR_Y} stroke={C.violetSoft} strokeWidth="10" strokeLinecap="round" />
        {back > 0 && <path d={`M1640 ${BAR_Y} Q${(1640 + SAVES[2].x) / 2} ${BAR_Y - 280} ${SAVES[2].x} ${BAR_Y}`} fill="none" stroke={C.violet} strokeWidth="3" strokeDasharray="8 10" opacity={0.7} />}
      </svg>
      {SAVES.map((s) => {
        const at = 0.4 + ((s.x - 180) / 1460) * 2.4;
        const o = spring(t, at, 0.5);
        return (
          <div key={s.hash} style={{ ...abs(s.x - 110, BAR_Y - 130, 220), textAlign: 'center', opacity: Math.min(1, o * 1.4) }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: C.ink, wordBreak: 'keep-all' }}>«{s.msg}»</div>
            <div style={{ marginTop: 44, display: 'grid', placeItems: 'center', transform: `scale(${0.6 + 0.4 * o})` }}>
              <CommitDot r={20} />
            </div>
            <div style={{ marginTop: 14 }}>
              <Code size={16} color={C.mute}>{s.hash}</Code>
            </div>
          </div>
        );
      })}
      {/* 버그 */}
      <div style={{ ...abs(1610, BAR_Y - 90), opacity: bug }}>
        <svg width="70" height="110" viewBox="0 0 70 110" aria-hidden>
          <path d="M40 4 L10 60 L32 60 L22 106 L62 42 L38 42 Z" fill={C.warn} stroke={C.ink} strokeWidth="3" strokeLinejoin="round" />
        </svg>
      </div>
      {/* 캐릭터 */}
      <div style={{ ...abs(charX - 18, charY - 18, 36, 36), borderRadius: '50%', background: C.ink, border: '4px solid #fffdf8', boxShadow: `0 0 0 3px ${C.ink}`, opacity: t < 0.3 ? 0 : flash }} />
      {back >= 1 && <div style={{ ...abs(SAVES[2].x - 140, BAR_Y + 120, 280), textAlign: 'center' }}><Chip color={C.violet} solidFill>마지막으로 잘 됐던 곳으로</Chip></div>}
      {/* 정의 */}
      <div style={{ ...abs(150, 820, 1620), display: 'flex', gap: 24, ...riseIn(t, 1.2) }}>
        <Term term="저장소" gloss="프로젝트 폴더 + 그 폴더의 모든 변경 기록" style={{ flex: 1 }} />
        <Term term="커밋" gloss="지금 상태를 이름 붙여 저장한 지점" style={{ flex: 1 }} />
      </div>
      <div style={{ ...abs(150, 930, 1620), ...small, ...riseIn(t, 1.5) }}>
        <b style={{ color: C.ink }}>커밋 메시지</b> = 그 저장 지점에 붙이는 이름 · 커밋마다 고유 번호(<span style={mono}>a1f3c2e</span> 같은 7자, 여기 숫자는 예시)가 붙는다
      </div>
    </>
  );
}

/* ═══════════════════ S6 — 로컬과 원격, 그리고 푸시 (build 4) ═══════════════════ */
function CommitCard({ msg, style }: { msg: string; style?: CSSProperties }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 10, background: '#fffdf8', border: `2px solid ${C.violet}`, fontSize: 19, fontWeight: 700, boxSizing: 'border-box', whiteSpace: 'nowrap', ...style, width: style?.width ?? 230 }}>
      <CommitDot r={8} />
      {msg}
    </div>
  );
}
const MSGS = ['첫 페이지', '제목 추가', '사진 넣기'];
export function PushSlide() {
  return (
    <>
      <Header kicker="커밋은 어디에 쌓이나" title="커밋은 서랍에, 푸시해야 GitHub에" />
      {/* 책상과 서랍 */}
      <div style={{ ...abs(140, 690, 820, 300) }}>
        <div style={{ ...abs(0, 0, 820, 34), background: '#c99a62', border: `3px solid ${C.ink}`, borderRadius: 8 }} />
        <div style={{ ...abs(60, 34, 700, 230), background: '#dcb27c', border: `3px solid ${C.ink}`, borderTop: 'none', borderRadius: '0 0 12px 12px' }} />
        <div style={{ ...abs(130, 70, 560, 170), background: '#a9784a', border: `3px solid ${C.ink}`, borderRadius: 10, boxShadow: 'inset 0 10px 0 rgba(0,0,0,.18)' }} />
      </div>
      <Build at={1} style={{ ...abs(300, 770) }}>
        {MSGS.map((m, i) => <CommitCard key={m} msg={m} style={{ ...abs(i * 22, i * 34) }} />)}
      </Build>
      <Build at={1} style={{ ...abs(140, 560, 520) }}>
        <Term term="로컬" gloss="내 노트북 쪽 — 커밋이 먼저 쌓인다" />
      </Build>
      {/* 원격 */}
      <Build at={2} style={{ ...abs(1220, 150) }}>
        <Cloud w={560}>
          <div style={{ ...small, fontSize: 20, color: C.faint }}>원격 저장소</div>
        </Cloud>
        <Term term="원격" gloss="GitHub에 있는 같은 저장소" style={{ marginTop: 6, width: 520 }} />
      </Build>
      {/* 우체통 */}
      <div style={{ ...abs(1010, 560, 160, 300) }}>
        <svg width="160" height="300" viewBox="0 0 160 300" aria-hidden>
          <path d="M20 70 C20 30 50 10 80 10 C110 10 140 30 140 70 L140 190 L20 190 Z" fill={C.violet} stroke={C.ink} strokeWidth="3.4" strokeLinejoin="round" />
          <rect x="44" y="66" width="72" height="12" rx="6" fill={C.ink} />
          <rect x="66" y="190" width="28" height="100" fill="#8a70f4" stroke={C.ink} strokeWidth="3" />
          <path d="M34 40 C50 24 70 20 90 22" stroke="#ffffff" strokeWidth="4" opacity=".4" fill="none" strokeLinecap="round" />
        </svg>
      </div>
      <Build at={3}>
        <Arrow x1={700} y1={760} x2={1000} y2={640} color={C.violet} width={4} head={16} />
        <Arrow x1={1140} y1={600} x2={1300} y2={420} color={C.violet} width={4} head={16} />
        <div style={{ ...abs(1180, 600) }}><Chip color={C.violet} solidFill size={24}>푸시 (push)</Chip></div>
        <div style={{ ...abs(1330, 310) }}>
          {MSGS.map((m, i) => <CommitCard key={m} msg={m} style={{ ...abs(i * 18, i * 28), width: 200, fontSize: 16 }} />)}
        </div>
        <div style={{ ...abs(1240, 700, 560) }}>
          <Term term="푸시" gloss="로컬의 커밋을 원격으로 올리는 일 — 인터넷이 필요" />
        </div>
      </Build>
      <Build at={4} style={{ ...abs(1240, 850, 580) }}>
        <div style={{ padding: '14px 20px', borderRadius: 14, border: `2.5px solid ${C.warn}`, background: 'color-mix(in srgb, #e0573b 7%, #fffdf8)', fontSize: 23, fontWeight: 800, color: C.warn, wordBreak: 'keep-all' }}>커밋만 하고 푸시를 안 하면 GitHub에는 아무것도 없다</div>
      </Build>
    </>
  );
}

/* ═══════════════════ S8 — Git은 Codex에게, 이름표는 내 것으로 (build 4) ═══════════════════ */
export function NametagSlide() {
  const { clicks, isStatic } = useDeck();
  const c = isStatic ? 9 : clicks;
  const swapped = c >= 3;
  return (
    <>
      <Header kicker="오늘 한 번만 하는 준비" title="Git은 Codex에게, 이름표는 내 것으로" />
      {/* 오른쪽 Codex 칩 */}
      <Build at={1} style={{ ...abs(1180, 250, 620) }}>
        <div style={{ ...solid, padding: '20px 24px', borderColor: C.violet }}>
          <div style={{ ...mono, fontSize: 15, color: C.mute }}>Codex에게</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6, wordBreak: 'keep-all' }}>«Git을 관리자 권한 없이 내 사용자 폴더에 설치해 줘»</div>
          <div style={{ ...small, marginTop: 8 }}>11번 장 카드 1</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 18 }}>
          <Chip color={C.warn} size={21}>관리자 암호 창이 뜨면 → 멈추고 손 든다</Chip>
          <Chip color={C.ink} size={21}>설치가 끝나면 → 터미널을 새로 열고 codex 다시 실행</Chip>
        </div>
      </Build>
      <Build at={4} style={{ ...abs(1180, 640, 620) }}>
        <div style={{ ...solid, padding: '18px 22px' }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>noreply 주소 찾는 곳</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
            <Code size={20} color={C.ink}>GitHub</Code><span>→</span><Code size={20} color={C.ink}>Settings</Code><span>→</span><Code size={20} color={C.violet}>Emails</Code>
          </div>
          <div style={{ ...small, marginTop: 10 }}>복사해서 Codex에게 건넨다 (카드 2)</div>
        </div>
      </Build>
      {/* 명찰 */}
      <Build at={2} style={{ ...abs(140, 180, 920, 820) }}>
        <svg width="920" height="300" viewBox="0 0 920 300" style={{ position: 'absolute', left: 0, top: 0 }} aria-hidden>
          <path d="M300 0 L430 240" stroke={C.violet} strokeWidth="14" strokeLinecap="round" />
          <path d="M620 0 L490 240" stroke={C.violet} strokeWidth="14" strokeLinecap="round" />
          <rect x="430" y="226" width="60" height="40" rx="8" fill={C.gold} stroke={C.ink} strokeWidth="3" />
        </svg>
        <div style={{ ...abs(80, 262, 760, 420), borderRadius: 28, background: '#fffdf8', border: `4px solid ${C.ink}`, boxShadow: '0 30px 60px -36px rgba(31,36,48,.6)', overflow: 'hidden' }}>
          <div style={{ height: 70, background: C.violet, display: 'flex', alignItems: 'center', padding: '0 34px', color: C.white, fontSize: 24, fontWeight: 900, letterSpacing: '0.1em' }}>커밋 이름표</div>
          <div style={{ padding: '30px 34px' }}>
            <div style={{ ...small, fontSize: 18 }}>이름</div>
            <div style={{ ...mono, fontSize: 40, fontWeight: 800, color: C.ink }}>mintcode07</div>
            <div style={{ ...small, fontSize: 18, marginTop: 24 }}>이메일</div>
            <div style={{ position: 'relative', height: 50 }}>
              {!swapped && <div style={{ ...mono, fontSize: 26, fontWeight: 700, color: C.warn }}>kijun.student@example.com</div>}
              {swapped && <div style={{ ...mono, fontSize: 22, fontWeight: 800, color: C.violet, wordBreak: 'break-all' }}>12345678+mintcode07@users.noreply.github.com</div>}
            </div>
            {swapped && <div style={{ ...small, fontSize: 16, marginTop: 4 }}>숫자 부분은 예시 — 사람마다 다르다</div>}
          </div>
        </div>
        <div style={{ ...abs(80, 700, 760) }}>
          <Term term="커밋 이름표" gloss="커밋마다 붙는 '누가 했나' 표시" />
        </div>
      </Build>
      <Build at={3} style={{ ...abs(220, 945, 900) }}>
        <Note color={C.warn}>공개 저장소에 올라간 이메일은 누구나 보고, 지우기 어렵다 → noreply 주소로</Note>
      </Build>
    </>
  );
}
