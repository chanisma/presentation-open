import { Scene, useSceneTime, interpolate, easeInOut, spring } from '../../../../src/scene';
import { typed } from '../../../../src/walkthrough';
import { Head, SceneSubs, Cursor, ring, QR, LOOK, Glyph, window4, type SlideMeta, type Sub } from '../kit';
import { GtWindow, TopBar, Avatar, G, TOP_H, BOT_Y } from './_gtools';

/* 23 — walkthrough: 구글 수업 도구 ① 클래스룸
   구도: 구글 수업 도구 창 하나를 화면 가득. 수업 카드 하나가 커져 스트림 배너가 되는 «줌인»이 이 장의 메타포.
   문구는 reference/pc-13·14·14b·14c 캡처와 gtools.js 원문. 수업 이름·코드·숫자는 가상. */

const T = {
  CARD: 1.6, ZOOM: 1.75, STREAM: 2.35,
  EXPAND: 4.6, CLOSE: 7.0,
  COMPOSE: 8.2, TYPE: 8.7, POST: 11.0, OK: 12.3,
  WORKTAB: 13.8, ROW: 15.0,
};
const DUR = 18.5;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '구글 창의 [클래스룸]을 누르면 로그인 없이 내 수업들이 카드로 보입니다.' },
  { at: 3.8, text: '수업 코드를 크게 띄우면 학생이 코드를 입력하거나 QR을 찍어 바로 참여합니다.' },
  { at: 7.6, text: '«수업에 공지하기»로 공지를 올릴 수 있습니다. 게시 전에 한 번 더 확인합니다.' },
  { at: 13.4, text: '«수업» 탭에서는 과제마다 제출한 학생 수를 바로 볼 수 있습니다.' },
];

const WIN = { x: 345, y: 172, s: 0.96 };
/* 포인터 좌표(씬 %) — measure_pointer.mjs 실측 2026-10-15 */
const TG = {
  card: { x: 26.7, y: 36.9 }, expand: { x: 34.86, y: 48.33 }, close: { x: 63.22, y: 25.79 },
  compose: { x: 48.0, y: 50.4 }, post: { x: 71.08, y: 56.55 }, ok: { x: 57.83, y: 52.57 },
  work: { x: 50.0, y: 18.8 }, row: { x: 45.0, y: 38.28 },
};
const CODE = 'abc12de';
const NOTE = '오늘 활동지는 드라이브 3주차 폴더에 있습니다.';

const COURSES = [
  { name: '1-3 정보', sub: '2026학년도 2학기', room: '2-3 교실', color: G.orange },
  { name: '1-1 정보', sub: '2026학년도 2학기', color: '#7b1fa2' },
  { name: '2-3 프로그래밍', sub: '2026학년도 2학기', color: '#1967d2' },
  { name: '정보 동아리', sub: '코딩반', color: '#d93025' },
];
const CARD_POS = [[24, 88], [348, 88], [672, 88], [24, 408]];
const BANNER = { x: 164, y: 84, w: 952, h: 236 };

/* 배너 장식 — 캡처의 원·삼각 무늬를 단순화 */
function Deco({ w, h }: { w: number; h: number }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ position: 'absolute', inset: 0 }}>
      <circle cx={w - 70} cy={h * 0.32} r={h * 0.42} fill="rgba(255,255,255,.14)" />
      <circle cx={w - 230} cy={h * 0.95} r={h * 0.28} fill="rgba(255,255,255,.12)" />
      <path d={`M${w - 380} ${h * 0.8} l60 -60 l60 60`} fill="none" stroke="rgba(255,255,255,.2)" strokeWidth={5} />
    </svg>
  );
}

function Cards({ t }: { t: number }) {
  const out = interpolate(t, [T.ZOOM, T.ZOOM + 0.35], [1, 0]);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: out }}>
      <TopBar look={LOOK.classroom} title="클래스룸" right={<Avatar />} />
      {COURSES.map((c, i) => (
        <div key={c.name} data-pt={i === 0 ? 'card' : undefined} style={{ position: 'absolute', left: CARD_POS[i][0], top: CARD_POS[i][1], width: 300, height: 290, border: `1px solid ${G.line}`, borderRadius: 10, overflow: 'hidden', background: '#fff', ...(i === 0 ? ring(t, T.CARD, G.orange) : {}) }}>
          <div style={{ position: 'relative', height: 100, background: c.color, color: '#fff', padding: '16px 18px' }}>
            <Deco w={300} h={100} />
            <div style={{ position: 'relative', fontSize: 23 }}>{c.name}</div>
            <div style={{ position: 'relative', fontSize: 14, marginTop: 4 }}>{c.sub}</div>
            {c.room && <div style={{ position: 'relative', fontSize: 13, marginTop: 8 }}>{c.room}</div>}
            <span style={{ position: 'absolute', right: 16, bottom: -36 }}><Avatar size={72} /></span>
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 56, borderTop: `1px solid ${G.line}`, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 22, padding: '0 22px', color: G.muted, fontSize: 20 }}>
            <span>▤</span><span>👥</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/** 카드 머리 → 스트림 배너로 커지는 줌인 사각형 */
function ZoomRect({ t }: { t: number }) {
  if (t < T.ZOOM || t > T.STREAM + 0.3) return null;
  const k = interpolate(t, [T.ZOOM, T.STREAM], [0, 1], easeInOut);
  const x = 24 + (BANNER.x - 24) * k, y = 88 + (BANNER.y + 20 - 88) * k;
  const w = 300 + (BANNER.w - 300) * k, h = 100 + (BANNER.h - 20 - 100) * k;
  return <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 10, background: G.orange, zIndex: 3, opacity: interpolate(t, [T.STREAM, T.STREAM + 0.3], [1, 0]) }} />;
}

function Stream({ t }: { t: number }) {
  const inK = interpolate(t, [T.STREAM - 0.1, T.STREAM + 0.25], [0, 1]);
  const work = t >= T.WORKTAB;
  const posted = t >= T.OK;
  const composing = t >= T.COMPOSE && !posted;
  const note = typed(t, NOTE, T.TYPE, 14);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: inK }}>
      <TopBar look={LOOK.classroom} title={<span>클래스룸 <span style={{ color: G.muted }}>›</span> 1-3 정보</span>} sub="2026학년도 2학기"
        tabs={['스트림', '수업', '사용자']} activeTab={work ? 1 : 0} tabRefs={{ 1: 'worktab' }} right={<Avatar />} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: TOP_H, bottom: 800 - BOT_Y, overflow: 'hidden' }}>
        {!work ? (
          <>
            <div style={{ position: 'absolute', left: BANNER.x, top: BANNER.y - TOP_H + 20, width: BANNER.w, height: BANNER.h - 20, borderRadius: 10, background: G.orange, color: '#fff', overflow: 'hidden' }}>
              <Deco w={BANNER.w} h={BANNER.h - 20} />
              <div style={{ position: 'absolute', left: 26, bottom: 26 }}>
                <div style={{ fontSize: 38 }}>1-3 정보</div>
                <div style={{ fontSize: 21, marginTop: 4 }}>2026학년도 2학기</div>
              </div>
            </div>
            {/* 왼쪽: 수업 코드 · 예정된 과제 */}
            <div style={{ position: 'absolute', left: 164, top: 276, width: 200, height: 92, border: `1px solid ${G.line}`, borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
                수업 코드
                <span data-pt="expand" style={{ fontSize: 17, lineHeight: 1, padding: 2, borderRadius: 6, ...ring(t, T.EXPAND, G.orange) }}>⛶</span>
              </div>
              <div style={{ fontSize: 25, color: G.orange, marginTop: 8 }}>{CODE}</div>
            </div>
            <div style={{ position: 'absolute', left: 164, top: 384, width: 200, height: 182, border: `1px solid ${G.line}`, borderRadius: 10, padding: '14px 16px', fontSize: 14, lineHeight: 1.45 }}>
              <div style={{ fontSize: 15, marginBottom: 10 }}>예정된 과제</div>
              <div style={{ color: G.muted, fontSize: 12 }}>기한: 10월 18일 (일)</div>
              <div>반복문 활동지 제출</div>
              <div style={{ color: G.muted, fontSize: 12, marginTop: 8 }}>기한: 10월 16일 (금)</div>
              <div>반복 횟수는 몇 번일까요?</div>
            </div>
            {/* 오른쪽: 공지 입력 · 게시물 */}
            <div data-pt="compose" style={{ position: 'absolute', left: 388, top: 276, width: 728, height: composing ? 168 : 70, border: `1px solid ${G.line}`, borderRadius: 10, boxShadow: '0 1px 3px rgba(60,64,67,.2)', background: '#fff', padding: composing ? '14px 18px' : '0 18px', display: 'flex', flexDirection: composing ? 'column' : 'row', alignItems: composing ? 'stretch' : 'center', gap: 14, zIndex: 2, ...ring(t, T.COMPOSE, G.orange) }}>
              {!composing ? (
                <><Avatar size={40} /><span style={{ fontSize: 16, color: G.muted }}>수업에 공지하기</span></>
              ) : (
                <>
                  <div style={{ background: G.soft, borderRadius: '6px 6px 0 0', borderBottom: `2px solid ${G.orange}`, padding: '8px 12px', height: 72 }}>
                    <div style={{ fontSize: 12, color: G.orange }}>수업에 공지할 내용 입력</div>
                    <div style={{ fontSize: 17, marginTop: 4 }}>{note}{t < T.POST && <span style={{ display: 'inline-block', width: 2, height: 19, background: G.ink, marginLeft: 1, verticalAlign: 'text-bottom', opacity: Math.floor(t * 2.4) % 2 ? 0.2 : 1 }} />}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <span style={{ padding: '8px 18px', fontSize: 15, color: G.muted }}>취소</span>
                    <span data-pt="post" style={{ padding: '8px 22px', fontSize: 15, borderRadius: 6, background: note.length === NOTE.length ? G.orange : '#e8eaed', color: note.length === NOTE.length ? '#fff' : G.muted, ...ring(t, T.POST, G.orange) }}>게시</span>
                  </div>
                </>
              )}
            </div>
            <div style={{ position: 'absolute', left: 388, top: (composing ? 460 : 362) + (posted ? 0 : 0), width: 728 }}>
              {posted && (
                <div style={{ border: `1px solid ${G.line}`, borderRadius: 10, padding: '14px 18px', marginBottom: 14, background: '#fffaf3', ...{ opacity: interpolate(t, [T.OK, T.OK + 0.4], [0, 1]) } }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><Avatar size={40} /><div style={{ lineHeight: 1.25 }}><div style={{ fontSize: 15 }}>김기전</div><div style={{ fontSize: 12, color: G.muted }}>오전 10:34</div></div></div>
                  <div style={{ fontSize: 16, marginTop: 10 }}>{NOTE}</div>
                </div>
              )}
              <div style={{ border: `1px solid ${G.line}`, borderRadius: 10, padding: '14px 18px', marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><Avatar size={40} /><div style={{ lineHeight: 1.25 }}><div style={{ fontSize: 15 }}>김기전</div><div style={{ fontSize: 12, color: G.muted }}>오전 09:47</div></div></div>
                <div style={{ fontSize: 16, marginTop: 10 }}>오늘은 3주차 반복문 수업입니다. 활동지를 열어 두세요.</div>
              </div>
              <div style={{ border: `1px solid ${G.line}`, borderRadius: 10, padding: '12px 18px', display: 'flex', gap: 14, alignItems: 'center' }}>
                <span style={{ width: 40, height: 40, borderRadius: '50%', background: G.orange, color: '#fff', display: 'grid', placeItems: 'center' }}>▤</span>
                <div style={{ lineHeight: 1.3 }}><div style={{ fontSize: 15 }}>김기전님이 새 과제를 게시했습니다: 반복문 활동지 제출</div><div style={{ fontSize: 12, color: G.muted }}>오전 09:12</div></div>
              </div>
            </div>
          </>
        ) : (
          <WorkTab t={t} />
        )}
      </div>
      {/* 수업 코드 크게 보기 */}
      {t >= T.EXPAND + 0.15 && t < T.CLOSE + 0.35 && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 5, background: `rgba(32,33,36,${0.45 * window4(t, T.EXPAND, T.EXPAND + 0.4, T.CLOSE, T.CLOSE + 0.35)})` }}>
          <div style={{ position: 'absolute', left: 330, top: 70, width: 620, height: 570, background: '#fff', borderRadius: 12, padding: '26px 30px', textAlign: 'center',
            opacity: interpolate(t, [T.CLOSE + 0.05, T.CLOSE + 0.3], [1, 0]), transform: `scale(${0.92 + 0.08 * spring(t, T.EXPAND + 0.15, 0.5)})` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, color: G.muted }}>1-3 정보<span data-pt="close" style={{ fontSize: 22, color: G.ink, padding: '0 6px', borderRadius: 6, ...ring(t, T.CLOSE, G.orange) }}>✕</span></div>
            <div style={{ fontSize: 110, color: G.orange, letterSpacing: 4, lineHeight: 1.2, marginTop: 6 }}>{CODE}</div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}><QR size={250} seed={23} fg="#111" /></div>
            <div style={{ fontSize: 16, color: G.muted, marginTop: 16, lineHeight: 1.5 }}>학생: 클래스룸 → [+] → 수업 참여하기 → 이 코드를 입력하거나 QR 을 찍으세요.</div>
          </div>
        </div>
      )}
      {/* 공지 게시 확인 창 */}
      {t >= T.POST + 0.2 && t < T.OK + 0.3 && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 5, background: 'rgba(32,33,36,.4)', opacity: interpolate(t, [T.OK, T.OK + 0.3], [1, 0]) }}>
          <div style={{ position: 'absolute', left: 420, top: 290, width: 440, background: '#fff', borderRadius: 12, padding: '24px 26px', boxShadow: '0 12px 40px rgba(0,0,0,.25)' }}>
            <div style={{ fontSize: 21 }}>공지를 게시할까요?</div>
            <div style={{ fontSize: 15, color: G.muted, marginTop: 10, lineHeight: 1.55 }}>«1-3 정보» 학생들에게 바로 보이고 알림이 갑니다.</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
              <span style={{ padding: '9px 18px', fontSize: 15, color: G.muted }}>취소</span>
              <span data-pt="ok" style={{ padding: '9px 24px', fontSize: 15, borderRadius: 6, background: G.orange, color: '#fff', ...ring(t, T.OK, G.orange) }}>게시</span>
            </div>
          </div>
        </div>
      )}
      {/* 알림 */}
      {t >= T.OK + 0.2 && t < T.WORKTAB + 0.6 && (
        <div style={{ position: 'absolute', left: '50%', top: 650, transform: 'translateX(-50%)', zIndex: 6, background: '#323232', color: '#fff', borderRadius: 8, padding: '12px 24px', fontSize: 16, opacity: interpolate(t, [T.OK + 0.2, T.OK + 0.5], [0, 1]) * interpolate(t, [T.WORKTAB + 0.2, T.WORKTAB + 0.6], [1, 0]) }}>
          공지를 게시했습니다.
        </div>
      )}
    </div>
  );
}

function WorkTab({ t }: { t: number }) {
  const open = spring(t, T.ROW + 0.1, 0.5);
  const row = (title: string, meta: string, refName?: string, draft?: boolean) => (
    <div data-pt={refName} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', borderBottom: `1px solid ${G.line}`, borderRadius: refName && t >= T.ROW ? '10px 10px 0 0' : 0, background: refName && t >= T.ROW ? '#fff7ed' : 'transparent', ...(refName ? ring(t, T.ROW, G.orange) : {}) }}>
      <span style={{ width: 38, height: 38, borderRadius: '50%', background: draft ? '#e8eaed' : G.orange, color: draft ? G.muted : '#fff', display: 'grid', placeItems: 'center', fontSize: 16 }}>▤</span>
      <span style={{ flex: 1, fontSize: 17 }}>{title}</span>
      <span style={{ fontSize: 14, color: G.muted }}>{meta}</span>
    </div>
  );
  return (
    <div style={{ position: 'absolute', left: 214, top: 24, width: 852, opacity: interpolate(t, [T.WORKTAB, T.WORKTAB + 0.3], [0, 1]) }}>
      {row('4주차 예습 과제', '초안', undefined, true)}
      <div style={{ fontSize: 26, color: G.orange, borderBottom: `1px solid ${G.orange}`, padding: '22px 4px 10px' }}>3주차 · 반복문</div>
      {row('반복문 활동지 제출', '기한: 10월 18일 (일)', 'row')}
      {t >= T.ROW && (
        <div style={{ overflow: 'hidden', height: 118 * open, background: '#fff7ed', borderRadius: '0 0 10px 10px', borderBottom: `1px solid ${G.line}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 46, padding: '16px 70px' }}>
            <span style={{ fontSize: 14, color: G.muted, width: 180 }}>게시일: 오전 09:42</span>
            {[['18', '제출함'], ['7', '할당됨']].map(([n, l]) => (
              <span key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingLeft: 30, borderLeft: `1px solid ${G.line}` }}>
                <b style={{ fontSize: 44, fontWeight: 500 }}>{n}</b><span style={{ fontSize: 15, color: G.muted }}>{l}</span>
              </span>
            ))}
          </div>
        </div>
      )}
      {row('반복 횟수는 몇 번일까요?', '기한: 10월 16일 (금)')}
      {row('3주차 수업 슬라이드', '게시일: 오전 07:12')}
    </div>
  );
}

function Stage() {
  const t = useSceneTime();
  return (
    <>
      <Head chapter="⑥ 구글 · 4/5" title="구글 수업 도구 ① 클래스룸" />
      <GtWindow x={WIN.x} y={WIN.y} s={WIN.s} active="classroom" right={t >= T.STREAM ? ['← 수업 목록', '새로고침', '웹으로 열기'] : ['새로고침']}>
        {t < T.STREAM + 0.3 && <Cards t={t} />}
        <ZoomRect t={t} />
        {t >= T.STREAM - 0.1 && <Stream t={t} />}
      </GtWindow>
      <div style={{ position: 'absolute', right: 40, top: 70, display: 'flex', alignItems: 'center', gap: 10, fontSize: 21, fontWeight: 700, color: '#15803d' }}>
        <Glyph look={LOOK.classroom} size={30} />로그인 없이
      </div>
      <Cursor path={[
        { t: 0.6, x: 50, y: 60 },
        { t: T.CARD, x: TG.card.x, y: TG.card.y, click: true },
        { t: T.EXPAND, x: TG.expand.x, y: TG.expand.y, click: true },
        { t: T.CLOSE, x: TG.close.x, y: TG.close.y, click: true },
        { t: T.COMPOSE, x: TG.compose.x, y: TG.compose.y, click: true },
        { t: T.COMPOSE + 0.4, x: TG.compose.x, y: TG.compose.y, hide: true },
        { t: T.POST, x: TG.post.x, y: TG.post.y, click: true },
        { t: T.OK, x: TG.ok.x, y: TG.ok.y, click: true },
        { t: T.WORKTAB, x: TG.work.x, y: TG.work.y, click: true },
        { t: T.ROW, x: TG.row.x, y: TG.row.y, click: true },
        { t: T.ROW + 1.4, x: TG.row.x + 8, y: TG.row.y + 18 },
      ]} />
      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S23() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
