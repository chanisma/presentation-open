import { type CSSProperties, type ReactNode } from 'react';
import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import Build from '../../../../src/deck/Build';
import Reveal from '../../../../src/deck/Reveal';
import {
  Scene,
  useSceneTime,
  interpolate,
  spring,
  riseIn,
  easeInOut,
} from '../../../../src/scene';
import {
  AppWindow,
  Pointer,
  typed,
  popIn,
  clickFlash,
} from '../../../../src/walkthrough';

/* ── 인공지능 기초 · 나의 첫 AI 서비스 (19장) ─────────────────────────
   plan: data/2026-2/인공지능기초/나의-첫-AI-서비스/plan.md (SSOT)
   아크: 체험(데모 3종) → 해부(무대 뒤) → API 두 장(창구·요청) → 사례
        → 설계(세 질문·입출력·시스템 프롬프트) → 활동지 A·B·C
        → 코드 생성 프롬프트 → walkthrough → 기능 테스트 → 고장 진단(씬)
        → 제출 → 개발 한 바퀴
   씬 국면: plan은 "클릭이 국면을 넘긴다"로 적었으나 이 과목 기존 덱
   (오리엔테이션 RippleScene 등)과 같게 t 자동 진행으로 저작 — 어디서
   멈춰도 정돈된 화면이 되도록 국면 정착 시각을 넉넉히 뒀다. */

const C = {
  orange: '#fb923c',
  mint: '#5eead4',
  amber: '#fcd34d',
  rose: '#fda4af',
  green: '#34d399',
  blue: '#7dd3fc',
};

const mono = 'var(--font-mono, monospace)';
/* 종이 질감 색 — S4 대본·S16 프롬프트 종이 (구 whiteboard 팔레트에서 가져온 값) */
const TAN = '#f6e3c9';
const kw: CSSProperties = { wordBreak: 'keep-all' };
const card: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: 16,
  padding: 'clamp(14px, 2vw, 24px)',
};

const BASE = 'data/2026-2/인공지능기초/나의-첫-AI-서비스';
const DEMO = {
  coach: `${BASE}/demo/면접-리허설-코치.html`,
  plan: `${BASE}/demo/벼락치기-설계사.html`,
  wiro: `${BASE}/demo/3줄-위로.html`,
};
const ACTIVITY = `${BASE}/활동지.html`;
const BOARD_URL = 'data/2026-2/인공지능기초/제출현황.html';
const CHATGPT = 'https://chatgpt.com';

/* 야간 작업실 무대 이미지 — 표지·데모 카드·마무리 (image-asset-builder, 앵커 stage-cover) */
const IMG = {
  cover: `${BASE}/images/stage-cover.png`,
  interview: `${BASE}/images/stage-interview.png`,
  cram: `${BASE}/images/stage-cram.png`,
  comfort: `${BASE}/images/stage-comfort.png`,
  start: `${BASE}/images/stage-start.png`,
  finish: `${BASE}/images/stage-finish.png`,
  openai: 'assets/external/openai.png',
};

/* 풀블리드 무대 이미지 + 어두운 스크림 — 텍스트 가독성 확보 */
function Stage({ src, scrim, style }: { src: string; scrim?: string; style?: CSSProperties }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', ...style }} aria-hidden>
      <img src={src} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: scrim ?? 'linear-gradient(90deg, rgba(9,24,20,0.93) 0%, rgba(9,24,20,0.72) 46%, rgba(9,24,20,0.3) 100%)' }} />
    </div>
  );
}

function Kicker({ children }: { children: ReactNode }) {
  return <div className="kicker">{children}</div>;
}

function Chip({
  color = C.mint,
  children,
  style,
}: {
  color?: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: mono,
        fontWeight: 800,
        fontSize: 'clamp(11px, 1.2vw, 13px)',
        color,
        border: `1px solid color-mix(in srgb, ${color} 55%, transparent)`,
        borderRadius: 999,
        padding: '3px 12px',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/* 링크 버튼 — 수업 중 접속 URL은 전부 클릭 가능 (plan 링크 원칙) */
function LinkBtn({
  href,
  children,
  big,
}: {
  href: string;
  children: ReactNode;
  big?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      style={{
        display: 'inline-block',
        padding: big ? '14px 30px' : '9px 18px',
        borderRadius: 999,
        background: 'var(--accent)',
        color: 'var(--accent-ink)',
        fontWeight: 800,
        fontSize: big ? 'clamp(15px, 1.8vw, 19px)' : 'clamp(13px, 1.4vw, 15px)',
        textDecoration: 'none',
        boxShadow: 'var(--glow)',
      }}
    >
      {children}
    </a>
  );
}

/* ══ S4 — 무대 뒤에는 대본이 걸려 있다 (scene · t 자동 국면) ══════════ */
function BackstageScene() {
  const t = useSceneTime();
  // 국면: 0~2 폭로(앞면이 물러나고 대본 등장) · 2.6~4.6 조립·발사 · 5.4~7 응답 귀환 · 7.4~ 라벨
  const revealP = interpolate(t, [0.7, 2.0], [0, 1], easeInOut);
  const fly1 = interpolate(t, [2.6, 3.5], [0, 1], easeInOut);
  const fly2 = interpolate(t, [3.0, 3.9], [0, 1], easeInOut);
  const send = interpolate(t, [4.0, 4.9], [0, 1], easeInOut);
  const back = interpolate(t, [5.6, 6.7], [0, 1], easeInOut);
  const label = (i: number) => spring(t, 7.4 + i * 0.35, 0.7);

  const flyPos = (p: number, x0: number, y0: number, x1: number, y1: number) => ({
    x: x0 + (x1 - x0) * p,
    y: y0 + (y1 - y0) * p - Math.sin(Math.PI * p) * 70,
  });
  const c1 = flyPos(fly1, 250, 300, 660, 300);
  const c2 = flyPos(fly2, 250, 372, 660, 372);

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', paddingTop: 'clamp(30px, 6vh, 62px)' }}>
        <div className="kicker" style={riseIn(t, 0.05)}>무대 뒤로</div>
        <h2 className="display" style={{ margin: '10px auto 0', ...kw, ...riseIn(t, 0.2) }}>
          무대 뒤에는 <span className="accent-text">대본</span>이 걸려 있다
        </h2>
        <p className="lead" style={{ marginInline: 'auto', marginTop: 8, ...kw, ...riseIn(t, 0.4) }}>
          서비스 = 미리 써 둔 프롬프트 + 빈칸 + 겉옷(화면)
        </p>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '4vh' }}>
        <svg viewBox="0 0 1400 560" style={{ width: 'min(1240px, 96vw)', height: 'auto', overflow: 'visible' }}>
          {/* 겉옷(화면·UI) — 앞면 패널: 폭로되며 좌측 미니로 물러난다 */}
          <g
            transform={`translate(${interpolate(revealP, [0, 1], [420, 40])} ${interpolate(revealP, [0, 1], [60, 140])}) scale(${1 - 0.35 * revealP})`}
          >
            <rect width={520} height={400} rx={20} fill="var(--surface-2, var(--surface))" stroke="var(--line)" strokeWidth={2} />
            <rect width={520} height={52} rx={20} fill="color-mix(in srgb, var(--fg) 8%, transparent)" />
            <text x={26} y={34} fill="var(--fg)" style={{ font: `800 22px var(--font-body, sans-serif)` }}>
              🎤 면접 리허설 코치
            </text>
            {/* 입력 칸 두 개 — 값이 대본으로 날아간다 */}
            {[
              { y: 92, ph: '지망 분야', v: '간호학과', gone: fly1 },
              { y: 164, ph: '나를 한 줄로', v: '요양원 봉사 경험', gone: fly2 },
            ].map((f) => (
              <g key={f.y}>
                <rect x={30} y={f.y} width={460} height={54} rx={12} fill="var(--bg)" stroke="var(--line)" strokeWidth={1.5} />
                <text x={48} y={f.y - 8} fill="var(--fg-faint)" style={{ font: '600 15px var(--font-body, sans-serif)' }}>
                  {f.ph}
                </text>
                <text x={48} y={f.y + 35} fill={C.orange} opacity={1 - f.gone} style={{ font: '700 22px var(--font-body, sans-serif)' }}>
                  {f.v}
                </text>
              </g>
            ))}
            <rect x={30} y={244} width={200} height={50} rx={12} fill="var(--primary)" />
            <text x={130} y={276} textAnchor="middle" fill="var(--accent-ink)" style={{ font: '800 19px var(--font-body, sans-serif)' }}>
              질문 받기
            </text>
            {/* 결과 영역 — 응답 봉투가 돌아오면 채워진다 */}
            <rect x={30} y={314} width={460} height={64} rx={12} fill="var(--bg)" stroke={back >= 1 ? C.mint : 'var(--line)'} strokeWidth={1.5} strokeDasharray={back >= 1 ? undefined : '7 7'} />
            <text x={48} y={352} fill={back >= 1 ? 'var(--fg)' : 'var(--fg-faint)'} style={{ font: '600 17px var(--font-body, sans-serif)' }}>
              {back >= 1 ? '1. 지원 동기를 말해 보세요 …' : '결과 영역 (아직 비어 있음)'}
            </text>
          </g>

          {/* 대본(프롬프트 템플릿) — 무대 뒤 벽의 종이 */}
          <g opacity={revealP} transform={`translate(560 ${70 + (1 - revealP) * 40})`}>
            <rect width={420} height={420} rx={14} fill={`color-mix(in srgb, ${TAN} 88%, white)`} stroke="#b98a4e" strokeWidth={2.5} />
            <text x={26} y={46} fill="#6b4a1f" style={{ font: '800 21px var(--font-body, sans-serif)' }}>
              미리 써 둔 대본
            </text>
            {[
              '너는 진로 면접을 돕는 코치다.',
              '항상 존댓말로 격려하며 말한다.',
              '예상 질문 3개와 힌트를 만든다.',
            ].map((s, i) => (
              <text key={i} x={26} y={92 + i * 34} fill="#54432b" style={{ font: '600 17px var(--font-body, sans-serif)' }}>
                {s}
              </text>
            ))}
            {/* 빈칸(사용자 입력 자리) 두 슬롯 */}
            {[
              { y: 212, name: '지망 분야', filled: fly1 >= 1, v: '간호학과' },
              { y: 284, name: '나를 한 줄로', filled: fly2 >= 1, v: '요양원 봉사 경험' },
            ].map((s) => (
              <g key={s.y} transform={`translate(26 ${s.y})`}>
                <text x={0} y={-8} fill="#8a6a3c" style={{ font: '700 14px var(--font-body, sans-serif)' }}>
                  {'{' + s.name + '}'}
                </text>
                <rect width={368} height={48} rx={10} fill={s.filled ? 'color-mix(in srgb, #fb923c 22%, white)' : 'white'} stroke={s.filled ? C.orange : '#c9a06a'} strokeWidth={2} strokeDasharray={s.filled ? undefined : '8 7'} />
                {s.filled && (
                  <text x={16} y={31} fill="#7c3d08" style={{ font: '800 19px var(--font-body, sans-serif)' }}>
                    {s.v}
                  </text>
                )}
              </g>
            ))}
            <text x={26} y={382} fill="#54432b" style={{ font: '600 17px var(--font-body, sans-serif)' }}>
              위 내용으로 답을 만들어라.
            </text>
          </g>

          {/* 날아가는 입력 값 칩 */}
          {fly1 > 0 && fly1 < 1 && (
            <g transform={`translate(${c1.x} ${c1.y})`}>
              <rect x={-70} y={-20} width={150} height={40} rx={10} fill={C.orange} />
              <text x={5} y={7} textAnchor="middle" fill="#241203" style={{ font: '800 17px var(--font-body, sans-serif)' }}>
                간호학과
              </text>
            </g>
          )}
          {fly2 > 0 && fly2 < 1 && (
            <g transform={`translate(${c2.x} ${c2.y})`}>
              <rect x={-100} y={-20} width={210} height={40} rx={10} fill={C.orange} />
              <text x={5} y={7} textAnchor="middle" fill="#241203" style={{ font: '800 16px var(--font-body, sans-serif)' }}>
                요양원 봉사 경험
              </text>
            </g>
          )}

          {/* 두루마리 발사 — 대본에서 우체통으로 */}
          {send > 0 && send < 1 && (
            <g transform={`translate(${interpolate(send, [0, 1], [1000, 1170])} ${interpolate(send, [0, 1], [280, 250]) - Math.sin(Math.PI * send) * 60}) rotate(${send * 240})`}>
              <rect x={-34} y={-14} width={68} height={28} rx={13} fill={`color-mix(in srgb, ${TAN} 88%, white)`} stroke="#b98a4e" strokeWidth={2.5} />
              <line x1={-34} y1={0} x2={34} y2={0} stroke="#c9a06a" strokeWidth={1.5} />
            </g>
          )}

          {/* 우체통(API) */}
          <g opacity={revealP} transform="translate(1120 170)">
            <rect x={0} y={40} width={170} height={150} rx={22} fill="color-mix(in srgb, #5eead4 16%, var(--surface))" stroke={C.mint} strokeWidth={2.5} />
            <rect x={30} y={78} width={110} height={14} rx={7} fill="var(--bg)" stroke={C.mint} strokeWidth={1.5} />
            <rect x={62} y={190} width={26} height={120} fill="color-mix(in srgb, #5eead4 26%, transparent)" stroke={C.mint} strokeWidth={2} />
            <text x={85} y={30} textAnchor="middle" fill={C.mint} style={{ font: `800 20px ${mono}` }}>
              Solar
            </text>
            {send >= 1 && t < 6.9 && (
              <circle cx={85} cy={115} r={14 + ((t * 26) % 30)} fill="none" stroke={C.mint} strokeWidth={2.5} opacity={0.8 - (((t * 26) % 30) / 30) * 0.8} />
            )}
          </g>

          {/* 응답 봉투 귀환 — 우체통에서 겉옷 결과 영역으로 (하단 경로) */}
          {back > 0 && back < 1 && (
            <g transform={`translate(${interpolate(back, [0, 1], [1120, 330])} ${interpolate(back, [0, 1], [330, 420]) + Math.sin(Math.PI * back) * 80})`}>
              <rect x={-40} y={-26} width={80} height={52} rx={8} fill="white" stroke={C.mint} strokeWidth={2.5} />
              <path d="M -40 -26 L 0 6 L 40 -26" fill="none" stroke={C.mint} strokeWidth={2.5} />
              <text x={0} y={46} textAnchor="middle" fill={C.mint} style={{ font: `700 14px ${mono}` }}>
                응답
              </text>
            </g>
          )}

          {/* 구조 라벨 셋 — 요소 bbox 바깥 하단 */}
          {(
            [
              { x: 210, y: 520, text: '겉옷 — 화면(UI)', color: C.blue },
              { x: 770, y: 520, text: '대본 — 프롬프트 템플릿 + 빈칸(입력 자리)', color: C.orange },
              { x: 1205, y: 520, text: '우체통 — API', color: C.mint },
            ] as const
          ).map((l, i) => (
            <g key={l.text} opacity={Math.min(1, label(i) * 1.3)} transform={`translate(0 ${(1 - label(i)) * 16})`}>
              <text x={l.x} y={l.y} textAnchor="middle" fill={l.color} style={{ font: '800 19px var(--font-body, sans-serif)' }}>
                {l.text}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

/* ══ S13 — ChatGPT에게 맡기는 절차 (walkthrough) ═════════════════════
   2026-09-04 개정: 로그인한 ChatGPT는 코드 블록 위에 재생(▶)을 붙여 준다 —
   누르면 코드가 그 자리에서 실제 화면이 된다. 파일을 내려받아 더블클릭하던
   절차는 "▶가 안 보일 때"의 대안으로 강등했다. */
const GEN_LINES = [
  '<!doctype html>',
  '<html lang="ko">',
  '/* ★★★★★ 이 파일의 주인이 고치는 곳 ★★★★★ */',
  'const SYSTEM_PROMPT = `너는 …`;',
  'const PROMPT_TEMPLATE = `발표 주제: {발표 주제}`;',
  "const API_KEY = 'up_…';  const TEMPERATURE = 0.7;",
  '… (화면·호출 코드) …',
  '</html>',
];

function FactoryScene() {
  const t = useSceneTime();
  const codeShown = Math.max(0, Math.floor((t - 2.8) * 2.2));
  const played = t > 7.0;
  const steps = [
    { at: 1.0, label: 'chatgpt.com — 로그인' },
    { at: 2.4, label: '프롬프트 붙여넣기 · 전송' },
    { at: 7.0, label: '[▶ 재생] 클릭' },
    { at: 11.0, label: '열린 화면에서 바로 테스트' },
  ];
  const ghostBtn: CSSProperties = {
    fontFamily: mono,
    fontSize: 11,
    fontWeight: 700,
    padding: '2px 10px',
    borderRadius: 7,
    border: '1px solid var(--hair)',
    color: 'var(--fg-faint)',
  };
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', paddingTop: 'clamp(22px, 4.5vh, 46px)' }}>
        <div className="kicker" style={riseIn(t, 0.05)}>구현 — 네 걸음</div>
        <h2 className="headline" style={{ margin: '8px auto 0', ...kw, ...riseIn(t, 0.2) }}>
          ChatGPT에게 <span className="accent-text">맡기는 절차</span>
        </h2>
      </div>

      {/* ① ChatGPT 창 — 코드가 다 나오면 코드 블록 위에 재생(▶)이 붙는다 */}
      <AppWindow
        kind="browser"
        url="chatgpt.com"
        badge="①"
        style={{ left: '4%', top: '22%', width: '46%', height: '62%', ...popIn(t, 0.6) }}
        bodyStyle={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, opacity: 0.9 }}>
          <img src={IMG.openai} alt="" aria-hidden style={{ width: 18, height: 18, borderRadius: '50%' }} />
          <span style={{ fontWeight: 800, fontSize: 'clamp(11px, 1.2vw, 13px)', color: 'var(--fg-muted)' }}>ChatGPT</span>
          {/* 재생 버튼은 로그인한 계정에만 붙는다 — 오늘 로그인을 권하는 이유 */}
          <span style={{ marginLeft: 'auto', fontFamily: mono, fontSize: 'clamp(9.5px, 1vw, 11.5px)', fontWeight: 800, color: C.mint, border: `1px solid color-mix(in srgb, ${C.mint} 50%, transparent)`, borderRadius: 999, padding: '1px 9px' }}>
            로그인됨
          </span>
        </div>
        {t > 1.6 && (
          <div
            style={{
              alignSelf: 'flex-end',
              maxWidth: '86%',
              background: 'color-mix(in srgb, var(--primary) 22%, var(--bg))',
              borderRadius: 12,
              padding: '8px 12px',
              fontSize: 'clamp(11px, 1.2vw, 13px)',
              fontWeight: 700,
              boxShadow: `0 0 ${clickFlash(t, 1.6) * 18}px var(--primary)`,
              ...kw,
            }}
          >
            📋 코드 생성 프롬프트 (활동지 D에서 복사한 전문)
          </div>
        )}
        {t > 2.8 && (
          <div style={{ position: 'relative', flex: 1, minHeight: 0, background: 'color-mix(in srgb, var(--fg) 6%, var(--bg))', border: '1px solid var(--hair)', borderRadius: 10, padding: '28px 12px 10px', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 6, left: 12, fontFamily: mono, fontSize: 10.5, color: 'var(--fg-faint)' }}>html</div>
            {/* 코드 블록 우상단 — 로그인 상태에서만 붙는 [▶ 재생] + 복사·다운로드 */}
            <div style={{ position: 'absolute', top: 3, right: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
              <span
                style={{
                  fontFamily: mono,
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '2px 10px',
                  borderRadius: 7,
                  border: `1px solid ${played ? 'transparent' : 'color-mix(in srgb, var(--primary) 60%, transparent)'}`,
                  color: played ? 'var(--accent-ink)' : 'var(--primary)',
                  background: played ? 'var(--accent)' : 'color-mix(in srgb, var(--primary) 16%, transparent)',
                  boxShadow: `0 0 ${clickFlash(t, 7.0) * 18}px var(--primary)`,
                }}
              >
                {t > 7.3 ? '✓ 재생됨' : '▶ 재생'}
              </span>
              <span style={ghostBtn}>복사</span>
              <span style={ghostBtn}>⬇</span>
            </div>
            <div style={{ fontFamily: mono, fontSize: 'clamp(10px, 1.1vw, 12.5px)', lineHeight: 1.75, color: 'var(--fg-muted)' }}>
              {GEN_LINES.slice(0, codeShown).map((l, i2) => (
                <div key={i2} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l}</div>
              ))}
            </div>
            {/* 재생 결과 — 코드로만 보이던 것이 화면이 된다 */}
            {t > 7.8 && (
              <div style={{ ...popIn(t, 7.8), position: 'absolute', left: 10, right: 10, bottom: t > 12.2 ? 78 : 10, border: `1.5px solid ${C.mint}`, borderRadius: 10, padding: '6px 11px', fontSize: 'clamp(10.5px, 1.15vw, 12.5px)', fontWeight: 800, color: C.mint, background: 'color-mix(in srgb, #5eead4 10%, var(--bg))', ...kw }}>
                ▸ 코드가 화면이 되었다 — 내려받지 않아도 여기서 돈다
              </div>
            )}
            {/* 자주 막히는 문제 — 창 안 하단 */}
            {t > 12.2 && (
              <div style={{ position: 'absolute', left: 10, right: 10, bottom: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  '코드가 끊기면 → "완전한 HTML 전체를 하나의 코드 블록으로 다시 출력해 줘"',
                  '[▶ 재생]이 안 보이면 → 로그인 확인 · 그래도 없으면 [⬇]로 받아 더블클릭',
                ].map((msg, i2) => (
                  <div
                    key={i2}
                    style={{
                      ...popIn(t, 12.2 + i2 * 0.4),
                      border: `1.5px dashed color-mix(in srgb, ${C.amber} 55%, transparent)`,
                      borderRadius: 10,
                      padding: '5px 10px',
                      fontSize: 'clamp(10px, 1.1vw, 12px)',
                      fontWeight: 700,
                      color: C.amber,
                      background: 'color-mix(in srgb, #fcd34d 10%, var(--bg))',
                      ...kw,
                    }}
                  >
                    ⚠ {msg}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </AppWindow>

      {/* ② 미리보기 — ChatGPT 화면 안에서 내 서비스가 실제로 돈다 */}
      <AppWindow
        kind="app"
        title="미리보기 — 대본 뼈대 메이커"
        badge="②"
        style={{ left: '54%', top: '29%', width: '42%', height: '40%', ...popIn(t, 7.9) }}
        bodyStyle={{ padding: 12, textAlign: 'left' }}
      >
        <div style={{ fontWeight: 800, fontSize: 'clamp(12px, 1.4vw, 15px)', color: 'var(--fg)' }}>대본 뼈대 메이커</div>
        <div style={{ marginTop: 7, display: 'flex', gap: 7 }}>
          <span style={{ flex: 1, border: '1px solid var(--hair)', borderRadius: 8, padding: '5px 9px', fontSize: 11.5, color: t > 9.4 ? 'var(--fg)' : 'var(--fg-faint)' }}>
            {typed(t, '발표 주제: 우리 반 텃밭 프로젝트', 9.4, 16)}
          </span>
          <span
            style={{
              borderRadius: 8,
              padding: '5px 11px',
              fontSize: 11.5,
              fontWeight: 800,
              background: 'var(--accent)',
              color: 'var(--accent-ink)',
              boxShadow: `0 0 ${clickFlash(t, 11.0) * 16}px var(--primary)`,
            }}
          >
            실행
          </span>
        </div>
        {/* 첫 답 — 길고 별표가 섞여 있다. S15에서 고칠 바로 그 증상 */}
        {t > 11.5 && (
          <div style={{ ...popIn(t, 11.5), marginTop: 9, border: '1px solid var(--hair)', borderRadius: 9, padding: '7px 10px', fontSize: 'clamp(10px, 1.1vw, 12px)', lineHeight: 1.75, color: 'var(--fg-muted)', ...kw }}>
            **발표 대본 뼈대**
            <br />1. 도입 — 텃밭을 시작하게 된 계기를 자세히 …
            <br />2. 전개 — 우리가 겪은 어려움과 해결 과정을 …
            <br />3. 마무리 — 다음 학기 계획을 …
          </div>
        )}
        {t > 13.0 && (
          <div style={{ ...popIn(t, 13.0), marginTop: 8, fontSize: 11.5, color: C.mint, fontWeight: 700, ...kw }}>
            ✓ 내 서비스가 돌아간다 — 이제 테스트다
          </div>
        )}
        <div style={{ position: 'absolute', left: 12, right: 12, bottom: 10, fontSize: 'clamp(10px, 1.1vw, 12px)', color: 'var(--fg-faint)', ...kw }}>
          제출은 [복사]로 코드를 가져가거나 [⬇]로 파일을 받아 활동지 F에 낸다
        </div>
      </AppWindow>

      {/* 진행 레일 — 우측 하단(덱 독과 겹치지 않는 자리) */}
      <div style={{ position: 'absolute', right: '4%', bottom: '13%', display: 'flex', gap: 'clamp(6px, 1vw, 12px)', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '54%' }}>
        {steps.map((st) => (
          <span
            key={st.label}
            style={{
              fontFamily: mono,
              fontSize: 'clamp(10px, 1.1vw, 12px)',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 999,
              border: `1.5px solid ${t > st.at ? 'color-mix(in srgb, var(--primary) 60%, transparent)' : 'var(--hair)'}`,
              color: t > st.at ? 'var(--primary)' : 'var(--fg-faint)',
              opacity: Math.min(1, spring(t, st.at, 0.5) * 1.4 + 0.35),
              ...kw,
            }}
          >
            {t > st.at ? '✓ ' : ''}
            {st.label}
          </span>
        ))}
      </div>

      <Pointer
        path={[
          { t: 1.1, x: 24, y: 68 },
          { t: 1.6, x: 24, y: 68, click: true },
          { t: 7.0, x: 40, y: 38.4, click: true },
          { t: 9.0, x: 70, y: 39, click: true },
          { t: 11.0, x: 93.5, y: 39, click: true, hide: true },
        ]}
      />
    </div>
  );
}

/* ══ S15 — 고장 진단: 고칠 곳은 내가, 수정은 대화로 (scene) ═══════════
   2026-09-04 재작성: 파일을 내려받지 않으므로(재생 버튼으로 ChatGPT 안에서
   바로 돈다) 메모장 편집 절차가 사라졌다. 고치는 수단은 같은 대화창이지만
   "무엇을 어떻게 고칠지"를 정하는 것은 여전히 학생 몫이다.
   메타포: 창 목업(S13)이 아니라 말풍선의 왕복 — 요청·수정·재생. */
function RepairScene() {
  const t = useSceneTime();
  const ASK =
    '답이 너무 길고 별표(**)가 섞여 나옵니다. 시스템 프롬프트의 「답은 짧게 써라」를 「답은 3줄 이내로, 별표 없이 써라」로 바꿔서, 수정된 전체 HTML을 하나의 코드 블록으로 다시 주세요.';
  const asked = typed(t, ASK, 1.2, 46);
  const played = t > 9.2;

  const tag = (color: string): CSSProperties => ({
    fontFamily: mono,
    fontWeight: 800,
    fontSize: 'clamp(9.5px, 1.02vw, 11.5px)',
    color,
    border: `1px solid color-mix(in srgb, ${color} 50%, transparent)`,
    borderRadius: 999,
    padding: '1px 9px',
  });
  const codeLine: CSSProperties = {
    fontFamily: mono,
    fontSize: 'clamp(9.5px, 1.05vw, 12px)',
    lineHeight: 1.8,
    color: 'var(--fg-muted)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };
  const sideCard: CSSProperties = {
    border: '1px solid var(--line)',
    background: 'color-mix(in srgb, var(--fg) 6%, var(--bg))',
    borderRadius: 14,
    padding: 'clamp(11px, 1.9vh, 20px) clamp(13px, 1.6vw, 22px)',
    textAlign: 'left',
  };
  const sideHead: CSSProperties = {
    fontFamily: mono,
    fontWeight: 800,
    fontSize: 'clamp(11px, 1.25vw, 14.5px)',
  };
  const sideBody: CSSProperties = {
    fontSize: 'clamp(11px, 1.25vw, 14.5px)',
    lineHeight: 1.75,
    fontWeight: 700,
    color: 'var(--fg)',
    ...kw,
  };

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', paddingTop: 'clamp(18px, 3.6vh, 38px)' }}>
        <div className="kicker" style={riseIn(t, 0.05)}>개선 — 고칠 곳은 내가, 수정은 대화로</div>
        <h2 className="headline" style={{ margin: '6px auto 0', ...kw, ...riseIn(t, 0.2) }}>
          답이 이상하면 <span className="accent-text">말로 고친다</span>
        </h2>
      </div>

      {/* 판별 두 줄 — 증상에 따라 "무엇을 말할지"가 갈린다 */}
      <div style={{ position: 'absolute', left: '50%', top: '19.5%', transform: 'translateX(-50%)', display: 'flex', gap: 'clamp(8px, 1.4vw, 18px)', flexWrap: 'wrap', justifyContent: 'center', width: '94%' }}>
        {(
          [
            { at: 0.6, color: C.orange, text: '답의 내용·말투·형식이 이상하다 → 새 문장을 내가 정해 준다', now: true },
            { at: 0.95, color: C.blue, text: '화면·버튼·동작이 이상하다 → 증상을 그대로 말한다', now: false },
          ] as const
        ).map((r) => (
          <div
            key={r.text}
            style={{
              ...popIn(t, r.at),
              border: `2px solid ${r.color}`,
              background: `color-mix(in srgb, ${r.color} ${r.now ? 16 : 9}%, var(--bg))`,
              borderRadius: 12,
              padding: 'clamp(4px, 0.8vh, 9px) clamp(10px, 1.4vw, 18px)',
              color: r.color,
              fontWeight: 800,
              fontSize: 'clamp(11.5px, 1.35vw, 16px)',
              ...kw,
            }}
          >
            {r.text}
            {r.now && <span style={{ marginLeft: 8, fontFamily: mono, fontSize: '0.78em', opacity: 0.85 }}>← 지금 이것</span>}
          </div>
        ))}
      </div>

      {/* 대화의 왕복 — ① 요청 → ② 고쳐진 코드 → ③ 다시 재생 */}
      <div style={{ position: 'absolute', left: '3.5%', top: '28.5%', width: '52%', display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 1.1vh, 12px)' }}>
        {t > 1.0 && (
          <div style={{ ...popIn(t, 1.0), display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <span style={tag(C.orange)}>① 내 요청 — 증상 · 고칠 곳 · 원하는 결과</span>
            <div
              style={{
                maxWidth: '96%',
                background: 'color-mix(in srgb, #fb923c 16%, var(--bg))',
                border: `1.5px solid color-mix(in srgb, ${C.orange} 55%, transparent)`,
                borderRadius: '14px 14px 4px 14px',
                padding: '8px 13px',
                fontSize: 'clamp(10.5px, 1.15vw, 13px)',
                lineHeight: 1.72,
                fontWeight: 700,
                color: 'var(--fg)',
                ...kw,
              }}
            >
              {asked}
              {asked.length < ASK.length && <span style={{ opacity: Math.round(t * 2) % 2 ? 1 : 0.15 }}>▌</span>}
            </div>
          </div>
        )}

        {t > 5.4 && (
          <div style={{ ...popIn(t, 5.4), display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            <span style={tag(C.mint)}>② ChatGPT — 고친 코드를 통째로 다시 준다</span>
            <div
              style={{
                width: '100%',
                border: '1px solid var(--hair)',
                background: 'color-mix(in srgb, var(--fg) 8%, var(--bg))',
                borderRadius: '14px 14px 14px 4px',
                padding: '8px 12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                <img src={IMG.openai} alt="" aria-hidden style={{ width: 16, height: 16, borderRadius: '50%' }} />
                <span style={{ fontSize: 'clamp(10px, 1.1vw, 12.5px)', fontWeight: 700, color: 'var(--fg-muted)', ...kw }}>
                  말씀하신 문장만 바꿨습니다 — 전체 코드입니다
                </span>
                <span
                  style={{
                    marginLeft: 'auto',
                    flex: 'none',
                    fontFamily: mono,
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '2px 10px',
                    borderRadius: 7,
                    border: `1px solid ${played ? 'transparent' : 'color-mix(in srgb, var(--primary) 60%, transparent)'}`,
                    color: played ? 'var(--accent-ink)' : 'var(--primary)',
                    background: played ? 'var(--accent)' : 'color-mix(in srgb, var(--primary) 16%, transparent)',
                    boxShadow: `0 0 ${clickFlash(t, 9.2) * 18}px var(--primary)`,
                  }}
                >
                  {played ? '✓ 재생됨' : '▶ 재생'}
                </span>
              </div>
              <div style={{ background: 'color-mix(in srgb, var(--fg) 6%, var(--bg))', border: '1px solid var(--hair)', borderRadius: 9, padding: '6px 10px' }}>
                <div style={codeLine}>const SYSTEM_PROMPT = `너는 발표 대본을 돕는 도우미다.</div>
                {t > 5.9 && (
                  <div style={{ ...codeLine, color: 'var(--fg-faint)', textDecoration: 'line-through' }}>  답은 짧게 써라.</div>
                )}
                {t > 6.4 && (
                  <div style={{ ...codeLine, color: C.mint, fontWeight: 800, whiteSpace: 'normal' }}>  답은 3줄 이내로, 별표 없이 써라.</div>
                )}
                {t > 6.9 && <div style={codeLine}>  … (나머지 줄은 그대로) …`;</div>}
              </div>
            </div>
          </div>
        )}

        {t > 9.8 && (
          <div style={{ ...popIn(t, 9.8), display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, width: '100%' }}>
            <span style={tag(C.blue)}>③ 다시 재생 — 같은 입력을 한 번 더</span>
            <div
              style={{
                width: '100%',
                border: `1.5px solid ${C.mint}`,
                background: 'color-mix(in srgb, #5eead4 8%, var(--bg))',
                borderRadius: 12,
                padding: '7px 12px',
                fontSize: 'clamp(10.5px, 1.15vw, 13px)',
                lineHeight: 1.7,
                color: 'var(--fg)',
                ...kw,
              }}
            >
              ① 텃밭에서 배운 것으로 시작합니다
              <br />② 우리가 겪은 어려움을 보여 줍니다
              <br />③ 다음 학기 계획으로 맺습니다
              <div style={{ marginTop: 4, color: C.mint, fontWeight: 800 }}>✓ 세 줄로, 별표 없이 — 내가 정한 문장이 일했다</div>
            </div>
          </div>
        )}

      </div>

      {/* 곁노트 — 요청문 쓰는 법 · 코드가 잘려 올 때 · 화면 문제일 때 */}
      <div style={{ position: 'absolute', left: '58.5%', top: '28.5%', width: '38%', display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.9vh, 20px)' }}>
        {t > 2.2 && (
          <div style={{ ...sideCard, ...popIn(t, 2.2), borderColor: `color-mix(in srgb, ${C.orange} 45%, transparent)` }}>
            <div style={{ ...sideHead, color: C.orange }}>요청에 반드시 세 가지</div>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(
                [
                  ['증상', '무엇이 어떻게 이상한가'],
                  ['고칠 곳', '시스템 프롬프트인가, 화면인가'],
                  ['원하는 결과', '어떻게 바뀌길 바라는가'],
                ] as const
              ).map(([k, v], i2) => (
                <div key={k} style={{ ...popIn(t, 2.4 + i2 * 0.3), display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: mono, fontWeight: 800, fontSize: 'clamp(10px, 1.1vw, 13px)', color: C.orange, border: `1px solid color-mix(in srgb, ${C.orange} 50%, transparent)`, borderRadius: 6, padding: '1px 9px' }}>{k}</span>
                  <span style={{ fontSize: 'clamp(11px, 1.25vw, 14.5px)', color: 'var(--fg-muted)', fontWeight: 600, ...kw }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 9, color: C.rose, fontWeight: 800, fontSize: 'clamp(10.5px, 1.2vw, 14px)', ...kw }}>
              ✗ "이상해요, 고쳐 주세요" — 엉뚱한 곳이 바뀐다
            </div>
          </div>
        )}

        {t > 7.6 && (
          <div style={{ ...sideCard, ...popIn(t, 7.6), borderColor: `color-mix(in srgb, ${C.amber} 45%, transparent)` }}>
            <div style={{ ...sideHead, color: C.amber }}>바뀐 부분만 왔다면</div>
            <div style={{ ...sideBody, marginTop: 8 }}>"수정된 전체 HTML을 처음부터 끝까지 하나의 코드 블록으로 다시 줘"</div>
            <div style={{ marginTop: 8, fontSize: 'clamp(10.5px, 1.2vw, 14px)', color: 'var(--fg-faint)', fontWeight: 600, ...kw }}>
              고칠 때마다 코드가 새로 나온다 — 제출은 마지막에 받은 코드로
            </div>
          </div>
        )}

        {t > 11.4 && (
          <div style={{ ...sideCard, ...popIn(t, 11.4), borderColor: `color-mix(in srgb, ${C.blue} 50%, transparent)`, background: 'color-mix(in srgb, #7dd3fc 10%, var(--bg))' }}>
            <div style={{ ...sideHead, color: C.blue }}>화면·버튼이 이상할 때</div>
            <div style={{ ...sideBody, marginTop: 8 }}>
              문장을 정해 줄 필요 없다 — "○○을 눌렀을 때 △△이 됩니다. 고쳐 주세요"
            </div>
          </div>
        )}
      </div>

      {/* 마무리 한 줄 — 화면 아래 띠(덱 독 위) */}
      {t > 12.4 && (
        <div
          style={{
            ...riseIn(t, 12.4),
            position: 'absolute',
            left: '3.5%',
            right: '3.5%',
            top: '82%',
            textAlign: 'center',
            fontSize: 'clamp(12px, 1.55vw, 19px)',
            fontWeight: 800,
            color: 'var(--fg-muted)',
            ...kw,
          }}
        >
          대화로 고쳐도 바뀌는 것은 <strong style={{ color: 'var(--fg)' }}>코드 안의 그 한 문장</strong> — 프롬프트는 프로그램의 부품이다
        </div>
      )}

      <Pointer
        path={[
          { t: 8.6, x: 52, y: 44 },
          { t: 9.2, x: 52, y: 44, click: true, hide: true },
        ]}
      />
    </div>
  );
}

/* ══ S19 — 개발 사이클 링 ════════════════════════════════════════════ */
function CycleRing() {
  const stages = ['기획', '설계', '구현(위임)', '테스트', '개선', '제출'];
  const R = 170;
  return (
    <svg viewBox="0 0 520 480" style={{ width: 'min(460px, 88vw)', height: 'auto' }} role="img" aria-label="기획 설계 구현 테스트 개선 제출 여섯 단계의 반복 개발 사이클">
      <circle cx={260} cy={240} r={R} fill="none" stroke="var(--line)" strokeWidth={2.5} strokeDasharray="5 9" />
      {stages.map((s, i) => {
        const a = (i / stages.length) * Math.PI * 2 - Math.PI / 2;
        const x = 260 + Math.cos(a) * R;
        const y = 240 + Math.sin(a) * R;
        const hot = s === '개선';
        return (
          <g key={s}>
            <circle cx={x} cy={y} r={hot ? 46 : 38} fill={hot ? 'var(--primary)' : 'var(--surface)'} stroke={hot ? 'none' : 'var(--line)'} strokeWidth={2} />
            <text x={x} y={y - 2} textAnchor="middle" fill={hot ? 'var(--accent-ink)' : 'var(--fg)'} style={{ font: `800 ${hot ? 17 : 15}px var(--font-body, sans-serif)` }}>
              {s}
            </text>
            <text x={x} y={y + 18} textAnchor="middle" fill={hot ? 'var(--accent-ink)' : C.green} style={{ font: '800 14px var(--font-body, sans-serif)' }}>
              ✓
            </text>
          </g>
        );
      })}
      <text x={260} y={232} textAnchor="middle" fill="var(--fg)" style={{ font: '800 22px var(--font-body, sans-serif)' }}>
        오늘의
      </text>
      <text x={260} y={262} textAnchor="middle" fill="var(--fg)" style={{ font: '800 22px var(--font-body, sans-serif)' }}>
        개발 한 바퀴
      </text>
      <text x={260} y={462} textAnchor="middle" fill="var(--fg-faint)" style={{ font: '500 13.5px var(--font-body, sans-serif)' }}>
        실제 개발은 제출 대신 배포·공개까지 간다 — 오늘은 그 사이클의 축소판
      </text>
    </svg>
  );
}

/* ══ 덱 본체 ═════════════════════════════════════════════════════════ */
export default function MyFirstAiServiceDeck() {
  return (
    <Deck>
      {/* S1 표지 */}
      <Slide full nav="표지" notes="지난 시간에 여러분이 쓴 프롬프트, 채팅창에 넣고 끝났죠. 오늘은 그 프롬프트가 취직을 합니다. 프로그램 안에 들어가서, 여러분 대신 일하게 만들 거예요.">
        <Stage src={IMG.cover} scrim="linear-gradient(100deg, rgba(9,24,20,0.95) 0%, rgba(9,24,20,0.88) 38%, rgba(9,24,20,0.6) 70%, rgba(9,24,20,0.42) 100%)" />
        <div style={{ position: 'relative', width: 'min(1160px, 100%)', marginInline: 'auto', paddingInline: 'clamp(24px, 5vw, 64px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(360px, 100%), 1fr))', gap: 'clamp(24px, 4vw, 60px)', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Reveal>
              <div className="kicker">인공지능 기초 · 프로젝트</div>
              <h1 className="display" style={{ marginTop: 12, ...kw }}>
                나의 첫 <span className="accent-text">AI 서비스</span>
              </h1>
              <p className="lead" style={{ marginTop: 12, ...kw }}>
                내 프롬프트가 <strong style={{ color: 'var(--fg)' }}>취직하는 날</strong> —
                지난 시간의 프롬프트를 이제 프로그램 안에 넣는다.
              </p>
            </Reveal>
            <Reveal>
              <p style={{ color: 'var(--fg-faint)', fontSize: 'clamp(12.5px, 1.4vw, 14.5px)', fontFamily: mono, ...kw }}>
                준비물 — 각자 PC · 라이브 세션 참여
              </p>
            </Reveal>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(18px, 3vh, 30px)' }}>
            {/* 사원증 — 증명사진 자리에 프롬프트가 앉아 있다 */}
            <Reveal>
              <div style={{ position: 'relative', width: 'min(300px, 74vw)', transform: 'rotate(-3deg)' }}>
                <div style={{ position: 'absolute', left: '50%', top: -46, width: 3, height: 50, background: 'var(--line)', transform: 'translateX(-50%)' }} />
                <div style={{ position: 'absolute', left: '50%', top: -8, width: 46, height: 14, borderRadius: 5, background: 'var(--surface-2, var(--surface))', border: '1px solid var(--line)', transform: 'translateX(-50%)' }} />
                <div style={{ ...card, padding: 18, background: 'color-mix(in srgb, var(--fg) 9%, var(--bg))', borderColor: `color-mix(in srgb, ${C.orange} 45%, transparent)`, boxShadow: 'var(--glow), 0 24px 60px -20px rgba(0,0,0,0.75)' }}>
                  <div style={{ fontFamily: mono, fontSize: 11, fontWeight: 800, color: C.mint, letterSpacing: '0.1em' }}>EMPLOYEE CARD</div>
                  <div style={{ marginTop: 10, borderRadius: 10, background: 'var(--bg)', border: `1.5px dashed color-mix(in srgb, ${C.orange} 55%, transparent)`, padding: '14px 12px', fontFamily: mono, fontSize: 12.5, lineHeight: 1.6, color: C.orange, ...kw }}>
                    "너는 …하는 도우미다.
                    <br />답은 정확히 3줄로만…"
                  </div>
                  <div style={{ marginTop: 12, fontWeight: 800, fontSize: 17 }}>프롬프트 님</div>
                  <div style={{ color: 'var(--fg-muted)', fontSize: 13 }}>소속: 나의 첫 AI 서비스 · 담당: 동작 규칙</div>
                </div>
              </div>
            </Reveal>
            <Reveal>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignSelf: 'stretch' }}>
                {['기획', '설계', '구현(위임)', '테스트·개선', '제출'].map((s, i) => (
                  <div key={s} style={{ marginLeft: `${i * 7}%`, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: mono, fontWeight: 800, fontSize: 12, color: C.mint }}>{i + 1}</span>
                    <span style={{ fontWeight: 700, fontSize: 'clamp(13px, 1.5vw, 15.5px)', ...kw }}>{s}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </Slide>

      {/* S2 데모 체험 */}
      <Slide nav="데모 체험" notes="5분 드립니다. 마음에 드는 것부터 쓰고, 시간이 남으면 다른 것도 열어 보세요. 두 번째 미션이 중요합니다. 같은 입력을 두 번 넣고, 얼마나 달라지는지 기억해 두세요. 어느 데모를 썼느냐에 따라 결과가 얼마나 흔들리는지도 다를 겁니다. 이따 그 이유를 배웁니다.">
        <div style={{ width: 'min(1120px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 2vh, 20px)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14 }}>
            <Reveal>
              <div className="kicker">먼저 써 보자</div>
              <h2 className="headline" style={{ marginTop: 8, ...kw }}>
                세 개의 <span className="accent-text">미니 서비스</span>
              </h2>
              <p style={{ color: 'var(--fg-muted)', marginTop: 6, ...kw }}>챗봇이 아닌데, 안에 AI가 있다 — 로그인 없이 바로 쓴다.</p>
            </Reveal>
            <Reveal>
              <div style={{ ...card, padding: '12px 16px', maxWidth: 360 }}>
                <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 800, color: C.amber, marginBottom: 6 }}>체험 미션</div>
                <div style={{ fontSize: 'clamp(12.5px, 1.4vw, 14.5px)', lineHeight: 1.7, ...kw }}>
                  ☐ ① 마음에 드는 데모를 실제 상황으로 써 본다
                  <br />☐ ② <strong style={{ color: 'var(--fg)' }}>같은 입력을 두 번</strong> — 내용이 얼마나 달라지나? 형식은 유지되나?
                </div>
              </div>
            </Reveal>
          </div>
          {(
            [
              { href: DEMO.coach, emoji: '🎤', img: IMG.interview, field: '진로', name: '면접 리허설 코치', io: '지망 분야 · 나를 한 줄로 → 예상 질문 3개 + 답변 힌트', color: C.blue },
              { href: DEMO.plan, emoji: '⏱️', img: IMG.cram, field: '학습', name: '벼락치기 설계사', io: '과목 · 범위 · 남은 시간 → 남은 시간에 맞춘 구간표 + 포기할 것 하나', color: C.amber },
              { href: DEMO.wiro, emoji: '🍀', img: IMG.comfort, field: '감성', name: '3줄 위로', io: '오늘 있었던 일 → "정확히 3줄"을 지시해 둔 위로 — 정말 매번 3줄일까? (상관없는 입력에는 안내 한 문장)', color: C.mint },
            ] as const
          ).map((d, i) => (
            <Reveal key={d.name}>
              <a
                href={d.href}
                target="_blank"
                rel="noopener"
                style={{
                  ...card,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(12px, 2vw, 22px)',
                  textDecoration: 'none',
                  color: 'var(--fg)',
                  width: 'min(820px, 100%)',
                  marginLeft: `${i * 8}%`,
                  borderColor: `color-mix(in srgb, ${d.color} 40%, transparent)`,
                  padding: 0,
                  overflow: 'hidden',
                }}
              >
                {/* 이 서비스가 필요해지는 순간 — 사용 장면 썸네일 */}
                <span style={{ position: 'relative', flexShrink: 0, width: 'clamp(132px, 20vw, 232px)', alignSelf: 'stretch', minHeight: 'clamp(84px, 10.5vh, 124px)', overflow: 'hidden' }}>
                  <img src={d.img} alt="" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '62% center', filter: 'brightness(1.35) saturate(1.05)' }} />
                  <span style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, transparent 0%, transparent 42%, color-mix(in srgb, var(--surface) 82%, transparent) 78%, var(--surface) 100%)` }} />
                  <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: d.color, opacity: 0.85 }} />
                </span>
                <span style={{ flex: 1, minWidth: 0, paddingBlock: 'clamp(10px, 1.6vw, 18px)' }}>
                  <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 'clamp(18px, 2.2vw, 26px)' }}>{d.emoji}</span>
                    <strong style={{ fontSize: 'clamp(16px, 2vw, 21px)' }}>{d.name}</strong>
                    <Chip color={d.color}>{d.field}</Chip>
                  </span>
                  <span style={{ display: 'block', color: 'var(--fg-muted)', fontSize: 'clamp(12.5px, 1.5vw, 15px)', marginTop: 4, ...kw }}>{d.io}</span>
                </span>
                <span style={{ fontFamily: mono, fontWeight: 800, color: d.color, fontSize: 'clamp(13px, 1.5vw, 16px)', textDecoration: 'underline', textUnderlineOffset: 4, paddingRight: 'clamp(14px, 2vw, 24px)' }}>
                  열기 ↗
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </Slide>

      {/* S3 라이브 — 어떤 분야를 만들어 보고 싶나 (구 S11 분야 설문을 도입부로 이동, 2026-08-26) */}
      <Slide center nav="체크포인트 ①" notes="데모를 하나씩 써 봤죠. 본격적으로 들어가기 전에 가볍게 — 10초 만에 고르세요, 정답 없습니다. (분포 공개 후) 데모에 없던 분야를 고른 사람이 이만큼 있네요 — 여러분 것이 우리 반의 새 서비스가 됩니다. 구체적인 문제 찾기는 이따 활동지에서 아이디어 씨앗 카드와 함께 합니다.">
        <Reveal>
          <Kicker>라이브 문항 — 10초 즉답 · 정답 없음</Kicker>
          <h2 className="headline" style={{ marginInline: 'auto', marginTop: 10, ...kw }}>
            내가 만들고 싶은 건 <span className="accent-text">어떤 분야</span>일까
          </h2>
        </Reveal>
        <Reveal>
          <div style={{ ...card, width: 'min(820px, 100%)', marginInline: 'auto', marginTop: 'clamp(18px, 3vh, 30px)', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 'clamp(10px, 1.6vw, 16px)', padding: 'clamp(18px, 2.6vh, 28px)' }}>
            {['진로·입시', '공부·학습', '일상·생활', '마음·감성', '재미·창작'].map((f) => (
              <span key={f} style={{ border: `1.5px solid color-mix(in srgb, ${C.amber} 55%, transparent)`, color: C.amber, borderRadius: 12, padding: '10px 20px', fontWeight: 800, fontSize: 'clamp(14px, 1.8vw, 19px)', ...kw }}>{f}</span>
            ))}
          </div>
        </Reveal>
        <Build at={1}>
          <p className="lead" style={{ marginInline: 'auto', marginTop: 22, ...kw }}>
            데모(진로·학습·감성)에 없는 분야를 골랐다면 — <strong style={{ color: 'var(--fg)' }}>여러분 것이 우리 반의 새 서비스</strong>가 된다.
          </p>
        </Build>
      </Slide>

      {/* S4 설명 — 챗봇이 아니라 서비스다 (구 S3 라이브 문항을 설명 페이지로 전환, 2026-08-26) */}
      <Slide center nav="챗봇이 아니다" notes="방금 쓴 미니 서비스, 챗GPT와 달랐죠. 다른 점 네 가지를 짚어 봅시다. (넷 공개 후) 이 네 가지를 만든 범인이 하나 있습니다 — 누가 질문을 대신 만들어 뒀을까요? 지금부터 무대 뒤로 갑니다.">
        <Reveal>
          <Kicker>방금 관찰한 것</Kicker>
          <h2 className="headline" style={{ marginInline: 'auto', marginTop: 10, ...kw }}>
            방금 쓴 건 챗봇이 아니라 <span className="accent-text">서비스</span>다
          </h2>
        </Reveal>
        <div style={{ width: 'min(880px, 100%)', marginInline: 'auto', marginTop: 'clamp(18px, 3vh, 30px)', display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
          {(
            [
              ['채팅창이 없다', '입력 칸이 미리 정해져 있다'],
              ['프롬프트를 내가 다 쓰지 않았다', '몇 칸만 채웠는데 완성된 답이 온다'],
              ['답의 모양이 늘 비슷하다', '질문 3개 · 구간표 · 3줄 — 형식이 정해져 있다'],
              ['한 가지 일만 한다', '무엇이든 하는 챗봇과 달리, 좁고 깊다'],
            ] as const
          ).map(([t2, d], i) => (
            <Build key={t2} at={1}>
              <div style={{ ...card, padding: '10px 18px', display: 'flex', flexWrap: 'wrap', gap: '4px 14px', alignItems: 'baseline', marginLeft: `${i * 4}%` }}>
                <span style={{ fontFamily: mono, fontWeight: 800, color: C.mint, fontSize: 14 }}>{['①', '②', '③', '④'][i]}</span>
                <strong style={{ fontSize: 'clamp(15px, 1.9vw, 20px)', ...kw }}>{t2}</strong>
                <span style={{ color: 'var(--fg-muted)', fontSize: 'clamp(12px, 1.5vw, 15px)', ...kw }}>{d}</span>
              </div>
            </Build>
          ))}
        </div>
        <Build at={2}>
          <p className="lead" style={{ marginInline: 'auto', marginTop: 22, ...kw }}>
            이 넷을 만든 범인은 하나 — <strong style={{ color: 'var(--fg)' }}>누가 질문을 대신 만들어 뒀을까?</strong>
          </p>
        </Build>
      </Slide>

      {/* S5 무대 뒤 (scene) */}
      <Slide full nav="무대 뒤" notes="여러분이 입력 칸에 쓴 말은 그대로 AI한테 가지 않아요. 개발자가 미리 써 둔 대본의 빈칸에 끼워져서 갑니다. 데모 화면의 '내부 보기' 버튼 눌러 보세요 — 방금 여러분 입력이 어디에 끼워졌는지 그대로 보입니다. 그런데 저 우체통은 뭘까요?">
        <Scene>
          <BackstageScene />
        </Scene>
      </Slide>

      {/* S6 API 개념 — build 다이어그램 (2026-08-26 whiteboard→build 전환: 밝은 종이 판이 다크 덱과 이질적) */}
      <Slide nav="API란" notes="여러분이 만들 서비스에는 통로가 두 개 있습니다. 사용자가 들어오는 화면이 하나. 그리고 여러분의 프로그램 자신은 Solar 가게의 접수 창구에 요청서를 내러 가는 손님이 됩니다. 이 프로그램 전용 창구가 API예요. 다른 앱들도 이렇게 카카오모빌리티의 길찾기 API를 빌려 경로 기능을 넣고, 온라인 상점은 토스페이먼츠 같은 결제 API를 연결해 결제 기능을 넣습니다. 오늘 여러분도 창구 하나를 씁니다.">
        <div style={{ width: 'min(1140px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 2vh, 20px)' }}>
          <Reveal>
            <div style={{ textAlign: 'center' }}>
              <Kicker>서비스의 두 통로</Kicker>
              <h2 className="headline" style={{ marginInline: 'auto', marginTop: 8, ...kw }}>
                <span className="accent-text">API</span> — 프로그램의 접수 창구
              </h2>
              <p className="lead" style={{ marginInline: 'auto', marginTop: 8, ...kw }}>
                프로그램이 <strong style={{ color: 'var(--fg)' }}>정해진 형식</strong>으로 요청하고 응답받는 연결 방식
              </p>
            </div>
          </Reveal>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', justifyContent: 'center', gap: 'clamp(10px, 1.6vw, 18px)' }}>
            {/* 우리 프로그램 (at=2) */}
            <Build at={2} style={{ flex: '1 1 min(240px, 100%)', maxWidth: 330, display: 'flex' }}>
              <div style={{ ...card, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
                <div><Chip color={C.orange}>클라이언트</Chip></div>
                <div style={{ fontWeight: 800, fontSize: 'clamp(17px, 2.1vw, 23px)', ...kw }}>우리 프로그램</div>
                <p style={{ color: 'var(--fg-muted)', fontSize: 'clamp(12px, 1.4vw, 14.5px)', lineHeight: 1.65, ...kw }}>
                  Solar의 API 창구에 요청을 내는 손님 — 우리도 사람 손님을 위한 화면(UI)은 따로 연다.
                </p>
              </div>
            </Build>
            {/* 왕복 화살표 (at=2) — 가로축 중앙 통과 */}
            <Build at={2} style={{ flex: '0 0 clamp(150px, 17vw, 230px)', display: 'flex', alignItems: 'center' }}>
              <svg viewBox="0 0 220 150" style={{ width: '100%', height: 'auto', overflow: 'visible' }} role="img" aria-label="요청과 응답이 오가는 API 호출 왕복">
                <text x={110} y={16} textAnchor="middle" fill="var(--fg-muted)" style={{ font: `800 15px ${mono}` }}>API 호출</text>
                <line x1={8} y1={52} x2={192} y2={52} stroke={C.mint} strokeWidth={4} strokeLinecap="round" />
                <polygon points="212,52 190,44 190,60" fill={C.mint} />
                <text x={104} y={42} textAnchor="middle" fill={C.mint} style={{ font: '800 16px var(--font-body, sans-serif)' }}>요청 →</text>
                <line x1={28} y1={104} x2={212} y2={104} stroke={C.amber} strokeWidth={4} strokeLinecap="round" />
                <polygon points="8,104 30,96 30,112" fill={C.amber} />
                <text x={116} y={132} textAnchor="middle" fill={C.amber} style={{ font: '800 16px var(--font-body, sans-serif)' }}>← 응답</text>
              </svg>
            </Build>
            {/* Solar — 두 통로 (at=1 · dominant) */}
            <Build at={1} style={{ flex: '1.5 1 min(320px, 100%)', maxWidth: 460, display: 'flex' }}>
              <div style={{ ...card, flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, fontSize: 'clamp(17px, 2.1vw, 23px)' }}>Solar 가게</span>
                  <span style={{ color: 'var(--fg-faint)', fontSize: 'clamp(11px, 1.3vw, 13px)', ...kw }}>LLM(대규모 언어 모델)</span>
                </div>
                <div style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '10px 14px' }}>
                  <div style={{ fontWeight: 800, color: C.blue, fontSize: 'clamp(14px, 1.7vw, 17px)' }}>화면(UI)</div>
                  <div style={{ color: 'var(--fg-muted)', fontSize: 'clamp(11.5px, 1.3vw, 13.5px)', ...kw }}>사람 손님이 드나드는 통로</div>
                </div>
                <div style={{ position: 'relative', border: `2px solid ${C.mint}`, borderRadius: 12, padding: '10px 14px', boxShadow: `0 0 24px color-mix(in srgb, ${C.mint} 22%, transparent)` }}>
                  <div style={{ fontWeight: 800, color: C.mint, fontSize: 'clamp(15px, 1.8vw, 18px)' }}>API</div>
                  <div style={{ color: 'var(--fg-muted)', fontSize: 'clamp(11.5px, 1.3vw, 13.5px)', ...kw }}>프로그램 전용 접수 창구 — 오늘 우리가 쓰는 문</div>
                  <span style={{ position: 'absolute', top: -13, right: 12, background: C.amber, color: '#241a02', fontWeight: 800, fontSize: 'clamp(10.5px, 1.1vw, 12px)', borderRadius: 999, padding: '3px 11px' }}>정해진 형식!</span>
                </div>
              </div>
            </Build>
          </div>
          <Build at={3}>
            <div style={{ ...card, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 'clamp(8px, 1.4vw, 14px)', padding: '12px 18px' }}>
              {(
                [
                  ['지도 API', '길찾기'],
                  ['결제 API', '온라인 결제'],
                  ['날씨 API', '예보'],
                ] as const
              ).map(([n, d]) => (
                <span key={n} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '6px 13px', fontSize: 'clamp(12px, 1.4vw, 14.5px)', ...kw }}>
                  <strong>{n}</strong> <span style={{ color: 'var(--fg-faint)' }}>{d}</span>
                </span>
              ))}
              <span style={{ fontWeight: 800, color: C.mint, fontSize: 'clamp(13px, 1.6vw, 16.5px)', ...kw }}>
                세상 서비스는 남의 기능을 API로 빌려 조립된다 — LLM API는 "말을 다루는 능력"을 빌려주는 창구
              </span>
            </div>
          </Build>
        </div>
      </Slide>

      {/* S7 API 요청 해부 — 라이브 문항(api-where) 연결: 별도 퀴즈 슬라이드 없이 미니바에서 연다 */}
      <Slide nav="API 요청" notes="API 요청은 음식점 주문서 같은 겁니다 — 적을 항목이 정해져 있어요. 이 네 요소만 읽을 줄 알면 LLM API는 보인 겁니다. 하나만 더 — 이거 공짜가 아니에요. 토큰 수만큼 값을 냅니다. 지난 시간에 한국어가 조각이 많아서 손해라고 했죠? 오늘부터 그게 진짜 돈 얘기가 됩니다. 그리고 이 모델, 여러분 글 채점하던 걔예요. 오늘은 입장이 바뀝니다. 여기서 라이브 문항 하나 — 입력 칸의 값은 어디로 들어갈까요? 미니바에서 열어 풀어 봅시다. 정답은 user 역할 메시지 — system은 개발자의 시스템 프롬프트 자리라는 것까지 확인하고 넘어갑니다.">
        <div style={{ width: 'min(1140px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 2vh, 20px)' }}>
          <Reveal>
            <div style={{ textAlign: 'center' }}>
              <Kicker>LLM API — 먼저 읽는 네 곳</Kicker>
              <h2 className="headline" style={{ marginInline: 'auto', marginTop: 8, ...kw }}>
                <span className="accent-text">API 요청</span>, 먼저 읽을 네 곳
              </h2>
            </div>
          </Reveal>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(14px, 2vw, 26px)', alignItems: 'stretch', justifyContent: 'center' }}>
            {/* 주문표 스큐어모피즘 — 라벨은 정식 용어 */}
            <Build at={1} style={{ flex: '1 1 min(500px, 100%)', maxWidth: 620 }}>
              <div style={{ background: '#fbf7ef', borderRadius: 6, padding: 'clamp(16px, 2vw, 26px)', color: '#2b2117', fontFamily: mono, boxShadow: 'var(--shadow, 0 30px 60px -30px rgba(0,0,0,.5))', borderTop: `8px solid ${C.orange}` }}>
                <div style={{ textAlign: 'center', fontWeight: 800, fontSize: 15, letterSpacing: '0.14em', borderBottom: '2px dashed #c9bda9', paddingBottom: 8 }}>
                  API 요청 (요청 본문)
                </div>
                {[
                  { code: 'model: "solar-pro3"', tag: '요청을 처리할 모델', color: '#8a6a3c' },
                  { code: 'messages: [', tag: '역할별 메시지 목록', color: '#8a6a3c' },
                  { code: '  { role: "system", … }', tag: '개발자의 지시 — 시스템 프롬프트', color: '#c2410c', hot: true },
                  { code: '  { role: "user", … }', tag: '조립된 사용자 메시지', color: '#0f766e', hot: true },
                  { code: ']', tag: '', color: '#8a6a3c' },
                  { code: 'temperature: 0.7', tag: '지난 시간의 온도 손잡이', color: '#b45309', hot: true },
                ].map((l, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline', padding: '7px 2px', background: l.hot ? 'color-mix(in srgb, #fcd34d 26%, transparent)' : 'transparent', borderRadius: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 'clamp(12.5px, 1.5vw, 16px)', whiteSpace: 'pre' }}>{l.code}</span>
                    {l.tag && <span style={{ fontSize: 'clamp(10.5px, 1.2vw, 12.5px)', fontWeight: 700, color: l.color, textAlign: 'right', ...kw }}>← {l.tag}</span>}
                  </div>
                ))}
                <Build at={3}>
                  <div style={{ borderTop: '2px dashed #c9bda9', marginTop: 8, paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 'clamp(11.5px, 1.35vw, 14px)' }}>
                    <span style={kw}>요금 = 입력 토큰×단가 + 출력 토큰×단가 (단가는 서로 다르다)</span>
                    <span style={{ color: '#c2410c' }}>₩</span>
                  </div>
                </Build>
              </div>
              <p style={{ marginTop: 8, fontSize: 'clamp(11px, 1.2vw, 12.5px)', color: 'var(--fg-faint)', textAlign: 'center', ...kw }}>
                system은 비밀 금고가 아니다 — 코드에 넣으면 소스 보기로 읽힌다 (데모의 [내부 보기]가 일부러 공개하는 이유)
              </p>
            </Build>
            <div style={{ flex: '1 1 min(300px, 100%)', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'center' }}>
              <Build at={2}>
                <div style={{ ...card, borderColor: `color-mix(in srgb, ${C.mint} 45%, transparent)` }}>
                  <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 800, color: C.mint, marginBottom: 8 }}>API 응답</div>
                  <div style={{ fontFamily: mono, fontSize: 'clamp(12px, 1.4vw, 14px)', color: 'var(--fg-muted)' }}>
                    choices[0].message.<mark style={{ background: 'color-mix(in srgb, #5eead4 30%, transparent)', color: 'var(--fg)', padding: '1px 5px', borderRadius: 5, fontWeight: 800 }}>content</mark>
                  </div>
                  <p style={{ marginTop: 8, fontSize: 'clamp(12.5px, 1.4vw, 14.5px)', color: 'var(--fg-muted)', lineHeight: 1.6, ...kw }}>
                    돌아온 응답에서 답 문장(content)만 꺼내 화면에 붙인다 — 서비스가 하는 마지막 일.
                  </p>
                </div>
              </Build>
              <Build at={3}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Chip color={C.amber}>회수 — 지난 시간 온도 손잡이가 여기 한 줄</Chip>
                  <Chip color={C.orange}>회수 — 채점받던 Solar Pro 3, 오늘은 내가 부린다</Chip>
                  <Chip color={C.mint}>자체 실측 1회 — 응답 약 0.5초</Chip>
                </div>
              </Build>
            </div>
          </div>
        </div>
      </Slide>

      {/* S8 진짜 세상 */}
      <Slide nav="실제 사례" notes="스픽은 자기들의 교육 노하우와 음성 기술 위에 OpenAI 모델을 API로 연결해 서비스를 만들었습니다. 오늘 여러분이 하는 일이 구조적으로 그 일이에요. 물론 네이버·카카오처럼 자체 모델을 만드는 회사도 있습니다 — 빌릴지 만들지도 개발자의 선택이죠. 직접 체험은 아까 데모로 했으니 이건 눈으로만 봅니다 — 대부분 로그인이나 결제가 필요하거든요. (시간이 밀리면 이 장은 건너뛴다 — 활동지 읽을거리에 같은 내용)">
        <div style={{ width: 'min(1120px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 2vh, 22px)' }}>
          <Reveal>
            <Kicker>진짜 세상도 똑같이 만든다</Kicker>
            <h2 className="headline" style={{ ...kw }}>
              모델은 빌리고, <span className="accent-text">설계는 내 몫</span>이다
            </h2>
          </Reveal>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(16px, 2.4vw, 30px)' }}>
            <div style={{ flex: '2 1 min(480px, 100%)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(
                [
                  { name: '스픽', io: '내 영어 문장·발음 → 교정과 피드백', note: 'OpenAI 모델 활용 · OpenAI 공식 고객 사례' },
                  { name: "카카오톡 '안 읽은 대화 요약하기'", io: '안 읽은 대화 → 한눈 요약', note: '' },
                  { name: "듀오링고 'Explain My Answer'", io: '내 답 → 맞고 틀린 이유 설명', note: 'GPT-4 기반 Max 기능으로 시작해, 지금은 더 널리 제공' },
                  { name: '네이버 AI 브리핑', io: '검색어 → 일부 검색에서 생성형 AI가 정리한 요약 답변', note: '' },
                ] as const
              ).map((s, i) => (
                <Reveal key={s.name}>
                  <div style={{ ...card, padding: '12px 18px', display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '6px 14px' }}>
                    <strong style={{ fontSize: 'clamp(14.5px, 1.7vw, 18px)', ...kw }}>{s.name}</strong>
                    <span style={{ color: 'var(--fg-muted)', fontSize: 'clamp(12.5px, 1.4vw, 15px)', ...kw }}>{s.io}</span>
                    {s.note && <span style={{ width: '100%', color: 'var(--fg-faint)', fontSize: 'clamp(11px, 1.2vw, 12.5px)', ...kw }}>{s.note}</span>}
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal>
              <div style={{ flex: '1 1 min(240px, 100%)', ...card, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 800, color: C.mint }}>공통 구조</div>
                {['입력', '프롬프트 조립', 'API 호출', '응답 표시'].map((s, i) => (
                  <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontWeight: 800, fontSize: 'clamp(13px, 1.5vw, 16px)', color: i === 1 ? C.orange : i === 2 ? C.mint : 'var(--fg)' }}>{s}</span>
                    {i < 3 && <span style={{ color: 'var(--fg-faint)' }}>↓</span>}
                  </div>
                ))}
                <p style={{ fontSize: 'clamp(11px, 1.2vw, 12.5px)', color: 'var(--fg-faint)', ...kw }}>무대 뒤(S4)와 같은 그림 — 물론 실제 제품에는 음성·데이터·화면 기술이 더 얹힌다</p>
              </div>
            </Reveal>
          </div>
          <Build at={1}>
            <div style={{ background: 'var(--accent)', color: 'var(--accent-ink)', borderRadius: 12, padding: '12px 20px', fontWeight: 800, textAlign: 'center', fontSize: 'clamp(14px, 1.8vw, 19px)', ...kw }}>
              많은 AI 서비스는 이미 만들어진 모델을 API로 연결해 만든다 — 오늘 여러분도 그렇게 만든다
            </div>
          </Build>
        </div>
      </Slide>

      {/* S9 개발자의 세 질문 */}
      <Slide nav="세 질문" notes="'공부 도우미 만들래요'는 아직 아이디어가 아닙니다. 누가, 뭘 넣어서, 뭘 받는지 정해져야 만들 수 있어요. 아까 쓴 벼락치기 설계사도 이 세 칸을 채우는 데서 시작했습니다.">
        <div style={{ width: 'min(1120px, 100%)', marginInline: 'auto', display: 'flex', flexWrap: 'wrap', gap: 'clamp(18px, 3vw, 40px)' }}>
          <div style={{ flex: '1 1 min(320px, 100%)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Reveal>
              <Kicker>설계 — 만들기 전에 정한다</Kicker>
              <h2 className="headline" style={{ ...kw }}>
                개발자의 <span className="accent-text">세 질문</span>
              </h2>
            </Reveal>
            <Build at={1}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { n: '왜', q: '누가, 언제, 어떤 문제를 겪는가', d: '문제 없는 서비스는 장난감이다', ml: 0 },
                  { n: '입력', q: '사용자에게 무엇을 받아야 하는가', d: '그 문제를 풀기 위한 재료', ml: 5 },
                  { n: '출력', q: '무엇을, 어떤 모양으로 돌려주는가', d: '결과의 내용과 형식', ml: 10 },
                ].map((x) => (
                  <div key={x.n} style={{ ...card, marginLeft: `${x.ml}%`, padding: '12px 18px' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                      <Chip color={C.orange}>{x.n}</Chip>
                      <strong style={{ fontSize: 'clamp(14px, 1.7vw, 18px)', ...kw }}>{x.q}</strong>
                    </div>
                    <p style={{ color: 'var(--fg-faint)', fontSize: 'clamp(11.5px, 1.3vw, 13.5px)', marginTop: 4, ...kw }}>{x.d}</p>
                  </div>
                ))}
              </div>
            </Build>
          </div>
          <div style={{ flex: '1 1 min(340px, 100%)', display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
            <Build at={2}>
              <div style={{ ...card, borderColor: `color-mix(in srgb, ${C.rose} 45%, transparent)` }}>
                <Chip color={C.rose}>아직 아이디어가 아니다</Chip>
                <p style={{ fontSize: 'clamp(16px, 2vw, 21px)', fontWeight: 800, marginTop: 8 }}>"공부 도우미"</p>
                <p style={{ color: 'var(--fg-muted)', fontSize: 'clamp(12.5px, 1.4vw, 15px)', marginTop: 6, ...kw }}>
                  누가? <span style={{ borderBottom: '2px dashed var(--fg-faint)' }}>　　</span> 뭘 받아? <span style={{ borderBottom: '2px dashed var(--fg-faint)' }}>　　</span> 뭘 줘? <span style={{ borderBottom: '2px dashed var(--fg-faint)' }}>　　</span> — 셋 다 비어 있다
                </p>
              </div>
            </Build>
            <Build at={3}>
              <div style={{ ...card, borderColor: `color-mix(in srgb, ${C.green} 50%, transparent)` }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Chip color={C.green}>서비스가 된 문장</Chip>
                  <Chip color={C.amber}>= 벼락치기 설계사의 설계서</Chip>
                </div>
                <p style={{ fontSize: 'clamp(14px, 1.8vw, 18.5px)', fontWeight: 700, lineHeight: 1.65, marginTop: 8, ...kw }}>
                  <mark style={{ background: 'color-mix(in srgb, #fb923c 26%, transparent)', color: 'var(--fg)', padding: '0 4px', borderRadius: 5 }}>시험 전날 밤 계획이 안 서는 나</mark>에게,{' '}
                  <mark style={{ background: 'color-mix(in srgb, #fcd34d 24%, transparent)', color: 'var(--fg)', padding: '0 4px', borderRadius: 5 }}>과목·범위·남은 시간</mark>을 받아,{' '}
                  <mark style={{ background: 'color-mix(in srgb, #5eead4 24%, transparent)', color: 'var(--fg)', padding: '0 4px', borderRadius: 5 }}>남은 시간에 맞춘 구간표</mark>를 주는 서비스
                </p>
              </div>
              <p className="lead" style={{ marginTop: 14, ...kw }}>
                챗GPT가 이미 있는데 왜 따로 만들까? — <strong style={{ color: 'var(--fg)' }}>매번 길게 설명하지 않도록 미리 좁혀 둔 것</strong>이 서비스다.
              </p>
            </Build>
          </div>
        </div>
      </Slide>

      {/* S10 입출력 설계 */}
      <Slide nav="입출력 설계" notes="아까 같은 입력을 두 번 넣었을 때, 데모마다 결과가 흔들리는 정도가 달랐죠? 벼락치기 설계사는 비슷하게, 3줄 위로는 꽤 다르게 나왔을 겁니다. 제가 temperature를 다르게 설계했기 때문이에요. 혹시 3줄 위로가 3줄 지시를 어기고 한 덩어리로 답한 걸 본 사람? 그게 바로 '경향이지 보장이 아니다'의 증거입니다 — 높은 온도는 형식 준수까지 흔들어요. 여러분 서비스의 온도도 여러분이 가설을 세워 고릅니다. 계획표라면 낮게, 위로라면 높게.">
        <div style={{ width: 'min(1120px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 2vh, 20px)' }}>
          <Reveal>
            <Kicker>설계 — 입력과 출력</Kicker>
            <h2 className="headline" style={{ ...kw }}>
              입력은 아끼고, 출력은 <span className="accent-text">못 박는다</span>
            </h2>
          </Reveal>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(14px, 2vw, 26px)' }}>
            <Build at={1} style={{ flex: '1 1 min(280px, 100%)', maxWidth: 420 }}>
              <div style={{ ...card, height: '100%' }}>
                <Chip color={C.blue}>입력 규칙</Chip>
                <p style={{ fontWeight: 800, fontSize: 'clamp(15px, 1.9vw, 20px)', marginTop: 10, ...kw }}>칸은 1~3개 — 사용자는 귀찮은 걸 싫어한다</p>
                <p style={{ color: 'var(--fg-muted)', marginTop: 8, fontSize: 'clamp(12.5px, 1.4vw, 15px)', lineHeight: 1.7, ...kw }}>
                  칸마다 존재 이유를 말할 수 있어야 한다. 답을 바꾸지 않는 칸은 지운다.
                </p>
              </div>
            </Build>
            <Build at={2} style={{ flex: '1.6 1 min(380px, 100%)' }}>
              <div style={{ ...card, height: '100%', borderColor: `color-mix(in srgb, ${C.orange} 45%, transparent)` }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Chip color={C.orange}>출력 규칙</Chip>
                  <span style={{ fontFamily: mono, fontSize: 'clamp(11px, 1.2vw, 13px)', fontWeight: 800, color: C.amber, ...kw }}>
                    회수 — 내가 정하지 않은 것은 기계가 확률로 정한다
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  {[
                    { k: '내용', req: true },
                    { k: '형식', req: true },
                    { k: '길이', req: true },
                    { k: '말투', req: false },
                    { k: '금지', req: false },
                  ].map((x) => (
                    <span key={x.k} style={{ borderRadius: 10, padding: '8px 14px', fontWeight: 800, fontSize: 'clamp(13px, 1.5vw, 16px)', background: x.req ? 'var(--accent)' : 'transparent', color: x.req ? 'var(--accent-ink)' : 'var(--fg-muted)', border: x.req ? 'none' : '1.5px dashed var(--line)' }}>
                      {x.k} {x.req ? '· 필수' : '· 선택'}
                    </span>
                  ))}
                </div>
                <p style={{ color: 'var(--fg-muted)', marginTop: 12, fontSize: 'clamp(12.5px, 1.4vw, 15px)', ...kw }}>
                  금지의 실전 예 — "별표·머리기호 없이" (안 쓰면 화면에 <span style={{ fontFamily: mono }}>**</span> 기호가 그대로 찍힐 수 있다)
                </p>
              </div>
            </Build>
          </div>
          <Build at={3}>
            <div style={{ ...card, display: 'flex', flexWrap: 'wrap', gap: 'clamp(10px, 1.6vw, 18px)', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: mono, fontWeight: 800, fontSize: 'clamp(12px, 1.4vw, 14px)', color: C.mint }}>temperature(온도)</span>
              {[
                { v: '0.3', k: '변화 적게', demo: '벼락치기 설계사' },
                { v: '0.7', k: '중간', demo: '면접 리허설 코치' },
                { v: '1.1', k: '변화 많게', demo: '3줄 위로' },
              ].map((x) => (
                <div key={x.v} style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '8px 16px', textAlign: 'center' }}>
                  <div style={{ fontFamily: mono, fontWeight: 800, fontSize: 'clamp(16px, 2vw, 22px)', color: C.orange }}>{x.v}</div>
                  <div style={{ fontWeight: 700, fontSize: 'clamp(12px, 1.3vw, 14px)' }}>{x.k}</div>
                  <div style={{ color: 'var(--fg-faint)', fontSize: 'clamp(10.5px, 1.1vw, 12px)', ...kw }}>{x.demo}</div>
                </div>
              ))}
              <span style={{ color: 'var(--fg-faint)', fontSize: 'clamp(11px, 1.2vw, 13px)', fontWeight: 700, ...kw }}>경향이지, 보장이 아니다</span>
            </div>
          </Build>
        </div>
      </Slide>

      {/* S11 시스템 프롬프트 해부 */}
      <Slide nav="시스템 프롬프트" notes="이게 3줄 위로의 진짜 동작 규칙입니다. 화면도 버튼도 아니고 이 글 한 장이 서비스가 어떻게 움직일지를 정해요. 그래서 심장이라 부를 만하죠. 마지막 예외 처리 줄 보세요 — 여러분 서비스에도 엉뚱한 입력이 반드시 들어옵니다. 그때 어떻게 답할지까지가 설계입니다.">
        <div style={{ width: 'min(1060px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.8vh, 18px)' }}>
          <Reveal>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <Kicker>'3줄 위로'의 실제 시스템 프롬프트 — 전문</Kicker>
                <h2 className="headline" style={{ marginTop: 8, ...kw }}>
                  시스템 프롬프트: 서비스의 <span className="accent-text">동작 규칙</span>
                </h2>
              </div>
              <Chip color={C.rose}>❤ 오늘은 이 한 장을 심장이라 부르자</Chip>
            </div>
          </Reveal>
          <Reveal>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(
                [
                  { tag: '역할', color: C.blue, at: 1, hot: false, lines: ['너는 오늘 하루를 들려주는 고등학생에게 짧은 위로를 건네는 상담 도우미다.'] },
                  { tag: '규칙', color: C.green, at: 1, hot: false, lines: ['모든 문장을 "-요"나 "-습니다"로 끝나는 존댓말로 쓰고, 판단하거나 훈계하지 않는다.', '의학적 진단이나 치료에 해당하는 조언은 하지 않는다.'] },
                  { tag: '출력 형식', color: C.amber, at: 1, hot: false, lines: ['답은 정확히 3줄 — 한 줄에 문장 하나, 줄 사이는 반드시 줄바꿈으로 나눈다 (출력 전 스스로 확인).', '첫째 줄 — 공감 · 둘째 줄 — 다른 각도 · 셋째 줄 — 내일의 작은 한 걸음', '별표, 머리기호, 굵은 글씨를 쓰지 않고, 이모지는 전체에서 1개 이하로 쓴다.'] },
                  { tag: '예외 처리', color: C.rose, at: 2, hot: true, lines: ['고민이나 하루 이야기가 아닌, 장난이거나 위로와 상관없는 입력이 오면 3줄 형식 대신', '"오늘 있었던 일을 한 줄로 들려주시면 위로를 준비할게요."라고만 부드럽게 답한다.', '심각한 위기가 보이면 형식을 멈추고, 믿을 수 있는 어른이나 청소년 상담전화 1388을 안내한다.'] },
                ] as const
              ).map((p) => (
                <div key={p.tag} style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
                  <Build at={p.at} style={{ flex: 'none', width: 'clamp(76px, 9vw, 110px)', display: 'flex' }}>
                    <span style={{ alignSelf: 'center', width: '100%', textAlign: 'center', fontFamily: mono, fontWeight: 800, fontSize: 'clamp(11px, 1.2vw, 13px)', color: p.color, border: `1.5px solid color-mix(in srgb, ${p.color} 55%, transparent)`, borderRadius: 10, padding: '6px 4px', ...kw }}>
                      [{p.tag}]
                    </span>
                  </Build>
                  <div style={{ flex: 1, background: '#fbf7ef', borderRadius: 10, padding: 'clamp(10px, 1.4vh, 16px) clamp(12px, 1.8vw, 22px)', color: '#3b2f1e', border: p.hot ? `2.5px solid ${C.rose}` : '1px solid #d8cbb2' }}>
                    {p.lines.map((l, i) => (
                      <p key={i} style={{ fontSize: 'clamp(12.5px, 1.5vw, 16px)', fontWeight: 600, lineHeight: 1.6, ...kw }}>{l}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
          <Build at={2}>
            <p className="lead" style={{ marginInline: 'auto', textAlign: 'center', ...kw }}>
              서비스와 상관없는 말이나 장난은 반드시 들어온다 — <strong style={{ color: 'var(--fg)' }}>여러분 프롬프트에도 예외 처리 한 줄을.</strong>{' '}
              <span style={{ color: 'var(--fg-muted)' }}>이 한 장이 API 요청의 system 역할 메시지로 들어간다 (활동지 C1 — 입력 틀은 C2).</span>
            </p>
          </Build>
        </div>
      </Slide>

      {/* ── 활동 안내부: 구현·테스트·개선 — 활동지는 안내를 모두 마친 S16에서 연다 (2026-08-26 재구성) ── */}

      {/* S12 코드 생성 프롬프트 */}
      <Slide nav="코드 생성 프롬프트" notes="여러분이 기술 명세까지 쓸 필요는 없습니다. 그건 어느 서비스든 똑같은 부분이라 제가 미리 써 뒀어요. 여러분의 설계와 제 명세가 합쳐진 게 이 코드 생성 프롬프트입니다. 그리고 키 — 오늘은 코드에 넣지만, 진짜 서비스는 절대 이렇게 안 합니다. 지난 시간 활동지가 왜 키를 숨겼는지 이제 보이죠? 이 키는 수업 끝나면 잠급니다.">
        <div style={{ width: 'min(1060px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.6vh, 16px)' }}>
          <Reveal>
            <div style={{ textAlign: 'center' }}>
              <Kicker>구현 — 코드는 맡기고 설계는 내가</Kicker>
              <h2 className="headline" style={{ marginInline: 'auto', marginTop: 8, ...kw }}>
                <span className="accent-text">코드 생성 프롬프트</span> = 내가 쓴 것 + 받은 것
              </h2>
            </div>
          </Reveal>
          <Build at={1}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ ...card, borderStyle: 'dashed', borderColor: `color-mix(in srgb, ${C.orange} 55%, transparent)` }}>
                <Chip color={C.orange}>내가 쓴 것 — 서비스의 핵심 설계</Chip>
                <p style={{ marginTop: 8, fontSize: 'clamp(13px, 1.6vw, 16.5px)', fontWeight: 700, ...kw }}>
                  서비스 이름 · 한 문장 소개 · 입력 칸 · 출력 설계 · C1 시스템 프롬프트 · C2 사용자 메시지 틀 · temperature
                </p>
              </div>
              <div style={{ ...card, fontFamily: mono }}>
                <Chip color={C.mint}>받은 것 — 고정 기술 명세 (누구나 같다)</Chip>
                <p style={{ marginTop: 8, fontSize: 'clamp(12px, 1.4vw, 14.5px)', color: 'var(--fg-muted)', lineHeight: 1.7, ...kw }}>
                  단일 HTML 파일 하나 · Solar API 요청 코드(model·messages·temperature·max_tokens) · 수업용 키 · "프롬프트 상수는 파일 맨 위에, 백틱으로" · 오류·로딩 처리 · 모바일 대응
                </p>
              </div>
            </div>
          </Build>
          <Build at={2}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: 'var(--accent)', color: 'var(--accent-ink)', borderRadius: 12, padding: '10px 22px', fontWeight: 800, fontSize: 'clamp(13px, 1.6vw, 17px)' }}>
                활동지 D가 자동 조립 → [📋 전체 복사] → chatgpt.com에 붙여넣기
              </div>
              <p style={{ width: '100%', textAlign: 'center', color: 'var(--fg-muted)', fontSize: 'clamp(12px, 1.4vw, 14.5px)', ...kw }}>
                용어 정리 — <strong style={{ color: 'var(--fg)' }}>API 요청</strong>은 서비스가 Solar에 보내는 것,{' '}
                <strong style={{ color: 'var(--fg)' }}>코드 생성 프롬프트</strong>는 내가 ChatGPT에 내는 것 (그 안에 API 요청 코드 명세가 들어 있다)
              </p>
            </div>
          </Build>
          <Build at={3}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ ...card, flex: '1 1 min(280px, 100%)', borderColor: `color-mix(in srgb, ${C.amber} 45%, transparent)` }}>
                <div style={{ fontWeight: 800, fontSize: 'clamp(13px, 1.5vw, 16px)' }}>🔓 오늘 — 수업용 임시 키</div>
                <p style={{ color: 'var(--fg-muted)', fontSize: 'clamp(12px, 1.3vw, 14px)', marginTop: 6, lineHeight: 1.65, ...kw }}>
                  수업 기간에만 열리고 사용량 상한이 걸려 있다. 수업이 끝나면 잠근다. 교실이라 허락된 지름길.
                </p>
              </div>
              <div style={{ ...card, flex: '1 1 min(280px, 100%)' }}>
                <div style={{ fontWeight: 800, fontSize: 'clamp(13px, 1.5vw, 16px)' }}>🔒 진짜 서비스 — 키는 서버 금고에</div>
                <p style={{ color: 'var(--fg-muted)', fontSize: 'clamp(12px, 1.3vw, 14px)', marginTop: 6, lineHeight: 1.65, ...kw }}>
                  코드에 넣은 키는 소스 보기로 누구나 읽어 도용당한다 — 지난 시간 활동지가 키를 서버에 숨겼던 이유.
                </p>
              </div>
            </div>
          </Build>
        </div>
      </Slide>

      {/* S13 walkthrough — 생성·재생 절차 (2026-09-04: [다운로드] → 로그인 계정에 붙는 [▶ 재생]으로 교체) */}
      <Slide full nav="생성 절차" notes="오늘은 반드시 로그인해서 씁니다. 로그인한 계정에는 코드 블록 위에 삼각형 재생 버튼이 붙거든요. 코드가 다 나오면 그 재생을 누릅니다 — 코드로만 보이던 것이 그 자리에서 실제 화면이 됩니다. 파일을 내려받아 더블클릭할 필요가 없어요. 열린 화면에 바로 입력을 넣어 보면 그게 곧 테스트입니다. 코드가 끊기면 전체를 하나의 코드 블록으로 다시 출력해 달라고 하세요. 재생 버튼이 안 보이면 먼저 로그인을 확인하고, 그래도 없으면 다운로드 버튼으로 .html 파일을 받아 더블클릭하면 됩니다. 제출할 때는 복사 버튼으로 코드를 가져가거나 파일을 받아 활동지 F에 내세요. 실제 진행은 이따 활동 시간에 합니다 — 생성을 기다리는 동안 활동지 E의 테스트 입력을 먼저 적어 두면 좋아요. ChatGPT가 계속 안 되면 손 드세요, 구조가 완성된 예비 서비스 파일을 드립니다. 접속: chatgpt.com">
        <Scene freezeAt={14.2}>
          <FactoryScene />
        </Scene>
      </Slide>

      {/* S14 기능 테스트 */}
      <Slide nav="기능 테스트" notes="만들자마자 내면 그건 검증 없이 운에 맡기는 겁니다. 최소 두 가지는 꼭 넣어 보세요. 특히 서비스와 상관없는 입력 — 여러분이 예외 처리 줄을 썼다면 지금 그 줄이 일하는지 확인할 시간입니다.">
        <div style={{ width: 'min(1100px, 100%)', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 2vh, 20px)' }}>
          <Reveal>
            <Kicker>제출 전, 사용자가 되어 본다</Kicker>
            <h2 className="headline" style={{ ...kw }}>
              기능 테스트 — 기본 <span className="accent-text">두 가지 입력</span>
            </h2>
          </Reveal>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(12px, 1.8vw, 22px)', alignItems: 'stretch' }}>
            <Build at={1} style={{ flex: '1.2 1 min(300px, 100%)' }}>
              <div style={{ ...card, height: '100%', borderColor: `color-mix(in srgb, ${C.green} 50%, transparent)` }}>
                <Chip color={C.green}>기본 ① 정상 입력</Chip>
                <p style={{ fontWeight: 800, fontSize: 'clamp(15px, 1.9vw, 20px)', marginTop: 8, ...kw }}>설계할 때 상상한 그대로</p>
                <p style={{ color: 'var(--fg-muted)', fontSize: 'clamp(12.5px, 1.4vw, 15px)', marginTop: 6, ...kw }}>기대한 모양이 나오는가?</p>
              </div>
            </Build>
            <Build at={1} style={{ flex: '1.2 1 min(300px, 100%)' }}>
              <div style={{ ...card, height: '100%', borderColor: `color-mix(in srgb, ${C.rose} 50%, transparent)` }}>
                <Chip color={C.rose}>기본 ② 상관없는 말·장난 입력</Chip>
                <p style={{ fontWeight: 800, fontSize: 'clamp(15px, 1.9vw, 20px)', marginTop: 8, ...kw }}>서비스와 상관없는 말</p>
                <p style={{ color: 'var(--fg-muted)', fontSize: 'clamp(12.5px, 1.4vw, 15px)', marginTop: 6, ...kw }}>예외 처리 한 줄이 일하는가?</p>
              </div>
            </Build>
            <Build at={3} style={{ flex: '0.9 1 min(240px, 100%)' }}>
              <div style={{ ...card, height: '100%', borderStyle: 'dashed' }}>
                <Chip color={C.blue}>확장 ③ 경계·누락 입력</Chip>
                <p style={{ color: 'var(--fg-muted)', fontSize: 'clamp(12.5px, 1.4vw, 15px)', marginTop: 8, lineHeight: 1.65, ...kw }}>
                  아주 짧게 · 아주 길게 · 빈칸 — 시간이 남는 사람의 확장 과제
                </p>
              </div>
            </Build>
          </div>
          <Build at={2}>
            <div style={{ ...card, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
              <span style={{ fontFamily: mono, fontWeight: 800, fontSize: 'clamp(12px, 1.4vw, 14px)', color: C.amber }}>기록법 (활동지 E)</span>
              {['넣은 입력', '기대한 답', '실제 답'].map((s, i) => (
                <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ border: '1px solid var(--line)', borderRadius: 9, padding: '6px 14px', fontWeight: 700, fontSize: 'clamp(12.5px, 1.4vw, 15px)' }}>{s}</span>
                  {i < 2 && <span style={{ color: 'var(--fg-faint)' }}>→</span>}
                </span>
              ))}
              <span style={{ fontWeight: 800, color: C.orange, fontSize: 'clamp(13px, 1.5vw, 16px)', ...kw }}>기대와 실제의 차이가 개선의 재료다</span>
            </div>
          </Build>
          <Build at={3}>
            <p className="lead" style={{ ...kw }}>
              이런 검사의 이름은 <strong style={{ color: 'var(--fg)' }}>기능 테스트</strong> — 실제 개발에서는 품질 보증(QA) 활동의 한 부분으로, 제출·공개 전에 반드시 거친다.
            </p>
          </Build>
        </div>
      </Slide>

      {/* S15 고장 진단 — 같은 대화로 고치는 절차 (scene, 2026-09-04 재작성: 메모장 편집 → 대화 요청) */}
      <Slide full nav="고장 진단" notes="답이 이상할 때, 고치는 일은 같은 ChatGPT 대화에서 합니다. 코드를 직접 손대지 않아요. 대신 무엇을 어떻게 고칠지는 여러분이 정합니다 — 그게 오늘의 핵심입니다. 답의 내용이나 말투, 형식이 이상하면 새 문장을 내가 정해서 줍니다. 화면이나 버튼이 이상하면 증상만 그대로 말하면 돼요. ① 요청에는 세 가지가 들어갑니다. 증상, 고칠 곳, 원하는 결과. '이상해요, 고쳐 주세요'라고만 하면 엉뚱한 데가 바뀝니다. 화면의 요청문을 같이 읽어 봅시다. ② ChatGPT가 고친 코드를 통째로 다시 줍니다. 보세요, 바뀐 건 시스템 프롬프트 안의 문장 한 줄이에요. 만약 바뀐 부분만 왔다면 '수정된 전체 HTML을 처음부터 끝까지 하나의 코드 블록으로 다시 줘'라고 하세요. ③ 새 코드의 재생을 다시 누르면 같은 입력에 답이 달라집니다. 고칠 때마다 코드가 새로 나오니까, 제출은 마지막에 받은 코드로 하세요. 대화로 고쳐도 결국 바뀌는 것은 코드 안의 그 한 문장입니다 — 여러분 프롬프트는 채팅이 아니라 프로그램의 부품이에요. 참, 답이 아예 안 오면 그건 프롬프트 문제가 아닙니다 — 인터넷 연결과 수업용 키부터 확인하고 손 드세요.">
        <Scene freezeAt={13.5}>
          <RepairScene />
        </Scene>
      </Slide>

      {/* S16 활동 시작 — 설명을 모두 마친 뒤 활동지를 연다 (2026-08-26 재구성: 활동 안내 선행 → 활동지 일괄 오픈) */}
      <Slide full nav="활동 시작" notes="여기까지가 설명 전부입니다. 이제 활동지를 열고 A부터 F까지 한 흐름으로 갑니다. 오늘은 A·B·C 설계까지 가면 충분하고, 다음 시간은 이 화면에 머물면서 조립·생성·테스트·개선·제출을 합니다. 막히면 — 아이디어는 씨앗 카드, ChatGPT 생성이 계속 안 되면 손 드세요, 예비 서비스 파일을 드립니다. 미완성이어도 수업 안에 일단 제출하세요. 자정까지는 몇 번이든 다시 낼 수 있고, 마지막에 낸 것이 최종 제출본이 됩니다.">
        {/* 작업을 막 시작하려는 책상 — 설명이 끝나고 학생의 시간이 시작된다 */}
        <Stage
          src={IMG.start}
          scrim="linear-gradient(180deg, rgba(9,24,20,0.94) 0%, rgba(9,24,20,0.9) 42%, rgba(9,24,20,0.66) 74%, rgba(9,24,20,0.5) 100%)"
        />
        <div style={{ position: 'relative', width: 'min(1120px, 100%)', marginInline: 'auto', paddingInline: 'clamp(24px, 5vw, 64px)', display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 2vh, 20px)' }}>
          <Reveal>
            <div style={{ textAlign: 'center' }}>
              <Kicker>설명 끝 — 지금부터 전부 여러분 시간</Kicker>
              <h2 className="headline" style={{ marginInline: 'auto', marginTop: 8, ...kw }}>
                활동지, <span className="accent-text">A부터 F까지</span> 한 흐름으로
              </h2>
            </div>
          </Reveal>
          <Reveal>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(
                [
                  { chip: '1차시 — 설계', color: C.amber, steps: [['A', '기획 (막히면 씨앗 카드)'], ['B', '입출력 · temperature'], ['C', 'C1 시스템 프롬프트 · C2 메시지 틀']] },
                  { chip: '2차시 — 제작·제출', color: C.mint, steps: [['D', '조립 · 전체 복사'], ['🤖', 'ChatGPT 생성 → ▶ 재생'], ['E', '기능 테스트 · 개선'], ['F', '제출']] },
                ] as const
              ).map((row) => (
                <div key={row.chip} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'clamp(8px, 1.2vw, 14px)' }}>
                  <Chip color={row.color} style={{ flex: 'none' }}>{row.chip}</Chip>
                  {row.steps.map(([n, t], i) => (
                    <span key={n} style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.2vw, 14px)' }}>
                      <span style={{ ...card, padding: '8px 14px', display: 'inline-flex', gap: 8, alignItems: 'baseline' }}>
                        <strong style={{ fontFamily: mono, color: row.color, fontSize: 'clamp(13px, 1.5vw, 16px)' }}>{n}</strong>
                        <span style={{ fontWeight: 700, fontSize: 'clamp(12.5px, 1.5vw, 15.5px)', ...kw }}>{t}</span>
                      </span>
                      {i < row.steps.length - 1 && <span style={{ color: 'var(--fg-faint)' }}>→</span>}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </Reveal>
          <Build at={1}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 'clamp(14px, 2.2vw, 28px)' }}>
              <img src={`${BASE}/images/activity-qr.png`} alt="활동지 QR 코드" style={{ width: 'clamp(96px, 11vw, 150px)', borderRadius: 12, border: '5px solid #fff', background: '#fff' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <LinkBtn href={ACTIVITY} big>
                  🛠️ 활동지 열기 ↗
                </LinkBtn>
                <a href={BOARD_URL} target="_blank" rel="noopener" style={{ color: C.mint, fontWeight: 800, textDecoration: 'underline', textUnderlineOffset: 4, fontSize: 'clamp(12.5px, 1.4vw, 15px)' }}>
                  제출 현황 보기 ↗
                </a>
              </div>
              <div style={{ maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 'clamp(11.5px, 1.3vw, 13.5px)', color: 'var(--fg-faint)', ...kw }}>
                <span>· 설계 원칙 — 사람을 평가·진단·비방하는 서비스 금지, 개인정보 입력받지 않기, 고민되면 선생님께</span>
                <span>· 오늘의 종료 기준 — A·B 완성 + C 초안</span>
                <span>· 미완성이어도 수업 안에 일단 제출 — 자정까지 몇 번이든 다시 낼 수 있고 마지막 제출본이 최종본</span>
              </div>
            </div>
          </Build>
        </div>
      </Slide>

      {/* S17 마무리 */}
      <Slide full nav="마무리" notes="오늘 여러분은 사용자에서 개발자가 됐습니다. 마지막 질문 하나 놓고 끝낼게요 — 사용자가 100명이면 뭘 먼저 고칠래요? 힌트: 오늘 우리가 '교실이니까 괜찮다'고 넘어간 게 하나 있었죠.">
        {/* 작업이 끝난 새벽 작업실 — S1 표지와 수미상관 */}
        <Stage
          src={IMG.finish}
          scrim="radial-gradient(ellipse 38% 48% at 31% 52%, rgba(9,24,20,0.93) 0%, rgba(9,24,20,0.5) 66%, rgba(9,24,20,0) 100%), linear-gradient(180deg, rgba(9,24,20,0.62) 0%, rgba(9,24,20,0.5) 46%, rgba(9,24,20,0.78) 100%)"
        />
        <div style={{ position: 'relative', width: 'min(1120px, 100%)', marginInline: 'auto', paddingInline: 'clamp(24px, 5vw, 64px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))', gap: 'clamp(20px, 3vw, 48px)', alignItems: 'center' }}>
          <Reveal>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <CycleRing />
            </div>
          </Reveal>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Reveal>
              <Kicker>오늘, 개발 한 바퀴</Kicker>
              <h2 className="display" style={{ marginTop: 10, ...kw }}>
                프롬프트는 채팅이 아니라 <span className="accent-text">부품이다</span>
              </h2>
            </Reveal>
            <Build at={1}>
              <p className="lead" style={{ ...kw }}>
                코드는 빌렸지만 — 프롬프트 · 입출력 · temperature(온도) · 예외 처리는 전부 <strong style={{ color: 'var(--fg)' }}>여러분이 정했다.</strong>
              </p>
            </Build>
            <Build at={2}>
              <div style={{ ...card, borderColor: `color-mix(in srgb, ${C.orange} 45%, transparent)`, display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 26 }}>🔒</span>
                <p style={{ fontWeight: 800, fontSize: 'clamp(14px, 1.7vw, 18px)', lineHeight: 1.6, ...kw }}>
                  마지막 질문 — 사용자가 100명 생긴다면, 가장 먼저 무엇을 고치겠는가?
                  <span style={{ display: 'block', color: 'var(--fg-muted)', fontWeight: 600, fontSize: 'clamp(12px, 1.4vw, 14.5px)', marginTop: 4 }}>
                    예외 처리 · 응답 속도 · 토큰 요금 · 그리고 코드에 넣은 키…
                  </span>
                </p>
              </div>
            </Build>
          </div>
        </div>
      </Slide>
    </Deck>
  );
}
