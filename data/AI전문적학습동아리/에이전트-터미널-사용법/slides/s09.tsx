import { Scene, useSceneTime, interpolate, easeInOut, spring } from '../../../../src/scene';
import { C, MONO, Head, SceneSubs, Cursor, SHOT, window4, type SlideMeta, type Sub } from '../kit';

/* 9 — scene: «보던 창»은 어떻게 정해질까
   메타포: 마지막으로 본 창의 발자국 — 창 카드 네 장이 차례로 앞에 섰다 물러나고(발자국 점선이 뒤따름),
   독을 누르는 순간 «바로 전 창»의 폴더만 집혀 올라간다. 마지막 창이 바탕 화면이라 경고가 붙는다.
   창 카드는 실화면이 아니라 추상 도형(제목줄 + 내용 줄)이다. 규칙 근거: research/features.md 3장. */

const DUR = 15;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '독은 선생님이 독을 누르기 바로 전에 보던 창을 기억합니다.' },
  { at: 3.6, text: '탐색기라면 그 폴더, 한글이나 엑셀 문서라면 그 문서가 든 폴더를 찾습니다.' },
  { at: 9.0, text: '바탕 화면을 보고 있었다면 바탕 화면 폴더에서 열립니다. 열기 전에 맡길 폴더를 앞에 띄워 두세요.' },
];

type Win = { title: string; app: string; folder: string; kind: 'explorer' | 'doc' | 'code' | 'desk' };
const WINS: Win[] = [
  { title: '수업 자료 - 파일 탐색기', app: '파일 탐색기', folder: '그 폴더 → 수업 자료', kind: 'explorer' },
  { title: '학습지.hwp - 한글', app: '한글·Office 문서', folder: '문서가 든 폴더 → 3단원', kind: 'doc' },
  { title: '수업 웹 - Visual Studio Code', app: 'VS Code 같은 편집기', folder: '연 폴더 → 수업 웹', kind: 'code' },
  { title: '바탕 화면', app: '바탕 화면', folder: '바탕 화면 폴더 → Desktop', kind: 'desk' },
];
const X0 = 110, W = 390, GAP = 40, Y = 210, H = 290;
const AT = [0.6, 2.6, 4.6, 6.6]; // 각 창이 앞에 서는 시각
const CLICK = 9.0;

function WinBody({ kind }: { kind: Win['kind'] }) {
  if (kind === 'explorer') return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {['1단원_컴퓨팅시스템', '2단원_자료와정보', '3단원_알고리즘', '수업 메모.txt'].map((n, i) => (
        <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 17, color: C.ink }}>
          <span style={{ width: 22, height: 17, borderRadius: 3, background: i < 3 ? '#f2c14e' : '#cfd6e0' }} />{n}
        </div>
      ))}
    </div>
  );
  if (kind === 'doc') return (
    <div style={{ padding: '14px 40px' }}>
      <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 4, height: 186, padding: 16 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.ink }}>[학습지] 정렬과 탐색</div>
        {[90, 75, 82, 60, 70].map((w, i) => <div key={i} style={{ marginTop: 12, height: 8, width: `${w}%`, borderRadius: 4, background: '#e6e0d4' }} />)}
      </div>
    </div>
  );
  if (kind === 'code') return (
    <div style={{ background: '#1e1e1e', height: '100%', padding: 16, fontFamily: MONO, fontSize: 15, lineHeight: 1.7 }}>
      {[['#569cd6', '<html>'], ['#9cdcfe', '  <body>'], ['#ce9178', '    <h1>퀴즈</h1>'], ['#9cdcfe', '  </body>'], ['#569cd6', '</html>']].map(([c, s], i) => (
        <div key={i} style={{ color: c, whiteSpace: 'pre' }}>{s}</div>
      ))}
    </div>
  );
  return (
    <div style={{ height: '100%', background: 'linear-gradient(160deg, #3d6aa8, #1f3b63)', padding: 18, display: 'grid', gridTemplateColumns: 'repeat(3, 60px)', gap: 18, alignContent: 'start' }}>
      {['다운로드', '사진', '설문.xlsx', '새 폴더', '메모', '공문'].map((n) => (
        <div key={n} style={{ textAlign: 'center', fontSize: 12, color: '#fff' }}>
          <div style={{ width: 40, height: 34, margin: '0 auto 4px', borderRadius: 6, background: 'rgba(255,255,255,.75)' }} />{n}
        </div>
      ))}
    </div>
  );
}

function Stage() {
  const t = useSceneTime();
  let front = -1;
  AT.forEach((a, i) => { if (t >= a) front = i; });
  const lift = spring(t, CLICK + 0.4, 0.9);
  const warn = window4(t, CLICK + 1.2, CLICK + 1.6, DUR + 1, DUR + 2);
  const sys = interpolate(t, [11.8, 12.4], [0, 1]);
  const DOCK = { x: 535, y: 742 };
  const ICON = { x: DOCK.x + (2564 - 1500) * 0.5, y: DOCK.y + (273 - 120) * 0.5 };
  return (
    <>
      <Head chapter="③ 열기 · 3/4" title="«보던 창»은 어떻게 정해질까" />
      {/* 시간 띠 + 발자국 점선 */}
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <line x1={X0} y1={Y + H + 96} x2={X0 + 4 * W + 3 * GAP} y2={Y + H + 96} stroke="rgba(31,27,22,.18)" strokeWidth={2} />
        {AT.map((a, i) => {
          const cx = X0 + i * (W + GAP) + W / 2;
          const on = t >= a;
          return (
            <g key={i}>
              <circle cx={cx} cy={Y + H + 96} r={on ? 9 : 6} fill={on ? C.gold : 'rgba(31,27,22,.25)'} />
              <text x={cx} y={Y + H + 130} textAnchor="middle" fontSize={18} fill={C.muted} fontFamily="Pretendard, sans-serif">{i + 1}번째로 본 창</text>
            </g>
          );
        })}
      </svg>
      {WINS.map((w, i) => {
        const x = X0 + i * (W + GAP);
        const on = t >= AT[i];
        const isFront = front === i;
        const enter = spring(t, AT[i], 0.6);
        const chosen = i === 3 && t >= CLICK;
        return (
          <div key={i}>
            <div style={{
              position: 'absolute', left: x, top: Y, width: W, height: H, borderRadius: 12, overflow: 'hidden', background: '#f7f8fa',
              border: `2px solid ${chosen ? C.warn : isFront ? C.gold : 'rgba(31,27,22,.16)'}`,
              boxShadow: isFront || chosen ? '0 26px 50px -24px rgba(31,27,22,.6)' : '0 10px 24px -20px rgba(31,27,22,.4)',
              opacity: on ? (isFront || chosen ? 1 : 0.5) : 0.15,
              transform: `translateY(${(1 - enter) * 24 - (isFront ? 14 : 0)}px) scale(${isFront ? 1.04 : 1})`,
              transition: 'opacity .3s, border-color .3s',
            }}>
              <div style={{ height: 34, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', background: '#e9ecf1', borderBottom: '1px solid rgba(31,27,22,.1)', fontSize: 15, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                <span style={{ display: 'flex', gap: 5 }}>{[0, 1, 2].map((k) => <i key={k} style={{ width: 9, height: 9, borderRadius: '50%', background: '#c3c9d3' }} />)}</span>{w.title}
              </div>
              <div style={{ height: H - 34 }}><WinBody kind={w.kind} /></div>
            </div>
            {/* 찾는 폴더 칩 */}
            <div style={{ position: 'absolute', left: x, top: Y + H + 18, width: W, textAlign: 'center', opacity: on ? 1 : 0.2, transition: 'opacity .3s' }}>
              <div style={{ fontSize: 17, color: C.muted }}>{w.app}</div>
              <div style={{ marginTop: 4, display: 'inline-block', fontSize: 20, fontWeight: 700, color: i === 3 ? C.warn : C.ink, background: C.panel, border: `1.5px solid ${i === 3 ? C.warn : C.line}`, borderRadius: 999, padding: '4px 14px' }}>{w.folder}</div>
            </div>
          </div>
        );
      })}
      {/* 독 조각 — 누르는 순간 바로 전 창(바탕 화면)의 폴더가 집혀 올라간다 */}
      <div style={{ position: 'absolute', left: DOCK.x, top: DOCK.y, width: 850, height: 130, borderRadius: 18, overflow: 'hidden', background: '#1e2230', boxShadow: '0 20px 40px -24px rgba(31,27,22,.7)' }}>
        <img src={SHOT('A-01b-교사판-독-에이전트-가리킴')} alt="" style={{ position: 'absolute', left: -1500 * 0.5, top: -120 * 0.5, width: 3200 * 0.5 }} />
      </div>
      {t >= CLICK + 0.3 && (
        <div style={{
          position: 'absolute', left: interpolate(lift, [0, 1], [X0 + 3 * (W + GAP) + 60, ICON.x + 70], easeInOut), top: interpolate(lift, [0, 1], [Y + H + 52, ICON.y - 128], easeInOut),
          fontSize: 22, fontWeight: 800, color: '#fff', background: C.warn, borderRadius: 10, padding: '8px 16px', whiteSpace: 'nowrap', boxShadow: '0 12px 30px -12px rgba(192,57,43,.7)',
        }}>📁 Desktop 에서 열림</div>
      )}
      <div style={{ position: 'absolute', left: 1420, top: 760, width: 440, opacity: warn }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.warn }}>엉뚱한 폴더에서 열릴 수 있어요</div>
        <div style={{ marginTop: 6, fontSize: 20, lineHeight: 1.5, color: C.muted, wordBreak: 'keep-all' }}>바탕 화면·다운로드처럼 파일이 섞인 곳은 피하고, 맡길 폴더를 앞에 띄운 뒤 누르세요.</div>
      </div>
      <div style={{ position: 'absolute', left: 110, top: 780, width: 380, opacity: sys, fontSize: 19, lineHeight: 1.5, color: C.muted, wordBreak: 'keep-all' }}>
        <b style={{ color: C.ink }}>고르지 않는 폴더</b><br />Windows·Program Files 같은 시스템·프로그램 폴더
      </div>
      <Cursor path={[
        { t: CLICK - 1.0, x: ((ICON.x + 160) / 1920) * 100, y: ((ICON.y - 120) / 1080) * 100 },
        { t: CLICK, x: (ICON.x / 1920) * 100, y: (ICON.y / 1080) * 100, click: true },
        { t: CLICK + 1.2, x: (ICON.x / 1920) * 100, y: (ICON.y / 1080) * 100, hide: true },
      ]} />
      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S09() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
