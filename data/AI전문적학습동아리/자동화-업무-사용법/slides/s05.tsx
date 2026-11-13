import { Scene, useSceneTime, interpolate } from '../../../../src/scene';
import { C, Head, SceneSubs, SHOT, Cursor, seq, type SlideMeta } from '../kit';
import { fade } from './_ui';

/* 5 — 실제 패널 둘러보기 (실화면 P-auto-*: NEIS_helper app/web 패널을 가짜 데스크 응답으로 렌더).
   왼쪽에 패널을 세우고 구역마다 빛, 오른쪽 «안내판»에는 지금 구역의 요점 카드가 쌓인다.
   SPACEKIJUN 연결 칸은 연결 안 함 → 인증 중 → 연결됨으로 실제 화면이 바뀐다. 좌표는 캡처(904×1720) px. */

const SUBS = [
  '독에서 «자동화 업무»를 누르면 이 패널이 열립니다.',
  '맨 위는 스킬이 설치되는 «자동화 업무» 폴더입니다. 쓸 에이전트를 고르고 열기를 누르면, 이 폴더에서 에이전트가 열립니다.',
  '가운데는 SPACEKIJUN 연결입니다. 연결하기를 누르면 브라우저가 열리고, 선생님이 직접 로그인해서 승인합니다.',
  '승인이 끝나면 «연결됨»으로 바뀝니다.',
  '아래는 스킬 목록입니다. 스위치를 켜면 설치되고, 끄면 빠집니다. «개인정보» 표시가 붙은 스킬은 학생과 학부모 정보를 다룹니다.',
  '스킬에 필요한 프로그램이 없으면, 데스크가 열 때 알아서 설치해 줍니다.',
];
const { subs, at, end } = seq(5, SUBS);
export const meta: SlideMeta = { kind: 'scene', dur: end };

const P = { x: 230, y: 150, k: 0.6 };
const VIEW_H = 780; // 덱 위 창 높이 — 패널이 길어 구역마다 스크롤한다
const OFF = [0, 0, 420, 420, 860, 860]; // 단계별 스크롤(캡처 px)
const R: [number, number, number, number][] = [
  [30, 30, 845, 130],     // 0 머리
  [55, 178, 795, 350],    // 1 폴더·에이전트·열기
  [55, 600, 795, 262],    // 2 SPACEKIJUN 연결
  [55, 600, 795, 262],    // 3 연결됨
  [55, 955, 795, 700],    // 4 스킬
  [175, 1100, 440, 50],   // 5 준비물 칩
];
const CARDS = [
  { title: '자동화 업무 패널', text: '독의 마법봉 아이콘 · 교사판 데스크' },
  { title: '폴더 · 에이전트 · 열기', text: '스킬이 깔린 «자동화 업무» 폴더에서 Claude Code 또는 Codex를 연다' },
  { title: 'SPACEKIJUN 연결', text: '[연결하기] → 브라우저에서 직접 로그인 → [승인]' },
  { title: '연결됨', text: '에이전트가 선생님 권한으로 업무·일정·문서 도구를 쓴다' },
  { title: '스킬 스위치', text: '켜면 설치, 끄면 뺀다 · «개인정보» = 학생·학부모 정보를 다룸' },
  { title: '준비물 자동 설치', text: 'Node.js·Python이 없으면 열 때 설치 (관리자 권한 없이)' },
];

const box = (r: number[], off: number) => ({ left: P.x + r[0] * P.k, top: P.y + (r[1] - off) * P.k, width: r[2] * P.k, height: r[3] * P.k });
const pct = (x: number, y: number, off: number) => ({ x: ((P.x + x * P.k) / 1920) * 100, y: ((P.y + (y - off) * P.k) / 1080) * 100 });

function Stage() {
  const t = useSceneTime();
  let cur = 0;
  for (let i = 0; i < at.length; i++) if (t >= at[i]) cur = i;
  const shot = t < at[2] + 2.2 ? 'P-auto-missing' : t < at[3] ? 'P-auto-auth' : 'P-auto-ok';
  // 스크롤은 구간 시작 0.6초 동안 부드럽게 (t의 순수 함수)
  let off = OFF[0];
  for (let i = 1; i < at.length; i++) off = interpolate(t, [at[i], at[i] + 0.6], [off, OFF[i]]);
  const r = box(R[cur], off);
  const click = pct(753, 662, OFF[2]);
  const open = pct(696, 320, 0);
  const sw = pct(784, 1013, OFF[4]);
  return (
    <>
      <Head chapter="④ 패널 둘러보기" title="자동화 업무 패널" />
      <div style={{ position: 'absolute', left: P.x, top: P.y, width: 904 * P.k, height: VIEW_H, borderRadius: 18, overflow: 'hidden', boxShadow: '0 30px 70px -30px rgba(31,27,22,.55)', opacity: fade(t, 0.1) }}>
        {['P-auto-missing', 'P-auto-auth', 'P-auto-ok'].map((n) => (
          <img key={n} src={SHOT(n)} alt="" style={{ position: 'absolute', left: 0, top: -off * P.k, width: '100%', opacity: n === shot ? 1 : 0, transition: 'opacity .35s' }} />
        ))}
      </div>
      <div style={{ position: 'absolute', ...r, borderRadius: 12, border: `3px solid ${C.gold}`, boxShadow: `0 0 0 6px color-mix(in srgb, ${C.gold} 20%, transparent)`, transition: 'width .45s, height .45s', zIndex: 10 }} />
      <Cursor path={[
        { t: at[1] + 1.5, x: 40, y: 60 }, { t: at[1] + 3.0, x: open.x, y: open.y }, { t: at[2] + 0.4, x: open.x, y: open.y },
        { t: at[2] + 1.6, x: click.x, y: click.y, click: true }, { t: at[2] + 2.6, x: click.x + 2, y: click.y + 6, hide: true },
        { t: at[4] + 0.8, x: sw.x, y: sw.y }, { t: at[4] + 2.2, x: sw.x, y: sw.y, click: true }, { t: at[4] + 3.2, x: 40, y: 80, hide: true },
      ]} />
      {/* 오른쪽 안내판 */}
      <div style={{ position: 'absolute', left: 860, top: 170, width: 990 }}>
        {CARDS.map((c, i) => {
          if (i > cur) return null;
          const now = i === cur;
          const k = interpolate(t, [at[i], at[i] + 0.4], [0, 1]);
          return (
            <div key={i} style={{ display: 'flex', gap: 18, alignItems: 'flex-start', padding: now ? '20px 26px' : '10px 26px', marginBottom: 10, borderRadius: 14,
              background: now ? C.panel : 'transparent', border: `1.5px solid ${now ? C.gold : 'transparent'}`, opacity: now ? k : 0.55, boxShadow: now ? '0 18px 40px -26px rgba(15,138,120,.6)' : 'none' }}>
              <span style={{ flexShrink: 0, width: 38, height: 38, borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 19, color: '#fff', background: now ? C.gold : C.faint }}>{i + 1}</span>
              <div>
                <div style={{ fontSize: now ? 31 : 23, fontWeight: 800 }}>{c.title}</div>
                {now && <div style={{ marginTop: 6, fontSize: 24, lineHeight: 1.5, color: C.muted, wordBreak: 'keep-all' }}>{c.text}</div>}
              </div>
            </div>
          );
        })}
      </div>
      <SceneSubs items={subs} />
    </>
  );
}

export default function S05() {
  return (
    <Scene duration={end}>
      <Stage />
    </Scene>
  );
}
