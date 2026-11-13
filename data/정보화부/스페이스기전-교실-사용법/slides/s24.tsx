import { Scene, useSceneTime, interpolate, easeInOut } from '../../../../src/scene';
import { Head, SceneSubs, Cursor, ring, LOOK, Glyph, Chip, type SlideMeta, type Sub } from '../kit';
import { GtWindow, TopBar, Avatar, G, TOP_H } from './_gtools';

/* 24 — walkthrough: 구글 수업 도구 ② 슬라이드 발표
   구도: 창 하나 → [▶ 슬라이드쇼]를 누르는 순간 창 바깥(덱 배경)까지 암전되고 슬라이드 하나만 남는다(이 장의 메타포).
   문구는 reference/pc-15·15b 캡처와 gtools.js 원문. 프레젠테이션 내용은 가상. */

const T = { TAB: 1.3, LIST: 1.55, CARD: 3.3, EDIT: 3.6, SHOW: 5.9, DARK: 6.0, NEXT1: 8.1, NEXT2: 9.2, HINT: 10.2, PPT: 11.2 };
const DUR = 14.5;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '아래 줄의 [슬라이드]를 누르면 드라이브의 최근 프레젠테이션이 보입니다.' },
  { at: 3.0, text: '하나를 고르면 편집 화면처럼 열리고, [▶ 슬라이드쇼]를 누르면 전체 화면 발표가 됩니다.' },
  { at: 7.8, text: '화면을 누르거나 방향키로 넘기고, Esc를 누르면 끝납니다.' },
  { at: 11.0, text: 'PowerPoint 파일은 이 화면 대신 교실 PC의 PowerPoint로 열립니다.' },
];

const WIN = { x: 345, y: 172, s: 0.96 };
/* 포인터 좌표(씬 %) — measure_pointer.mjs 실측 2026-10-15 */
const TG = { tab: { x: 36.2, y: 83.57 }, card: { x: 26.87, y: 38.29 }, show: { x: 77.48, y: 18.68 }, next: { x: 76.0, y: 46.0 } };

const DECKS = [
  { name: '3주차 반복문', when: '10월 14일 수정', bg: '#fdf6e0', ink: '#202124', head: '3주차 · 반복문' },
  { name: '2주차 조건문', when: '10월 8일 수정', bg: '#e8f0fe', ink: '#202124', head: '2주차 · 조건문' },
  { name: '수행평가 안내', when: '10월 5일 수정', bg: '#fff', ink: '#202124', head: '수행평가 안내' },
  { name: '1주차 오리엔테이션', when: '10월 1일 수정', bg: '#263238', ink: '#fff', head: '오리엔테이션' },
];

/* 발표 슬라이드 다섯 장(가상의 수업 자료) — 제목 막대와 추상 도형으로만 */
const PAGES = [
  { bg: '#fdf6e0', ink: '#202124', title: '3주차 · 반복문', sub: '1-3 정보 · 김기전' },
  { bg: '#ffffff', ink: '#202124', title: '같은 일을 여러 번', sub: 'for 문이 하는 일' },
  { bg: '#263238', ink: '#ffffff', title: 'for i in range(5):', sub: '다섯 번 되풀이하기', mono: true },
  { bg: '#e8f0fe', ink: '#202124', title: '모둠 활동', sub: '활동지 2번을 풀어 봅시다' },
  { bg: '#ffffff', ink: '#202124', title: '정리', sub: '오늘 배운 것' },
];

function Page({ i, w, h }: { i: number; w: number; h: number }) {
  const p = PAGES[i];
  return (
    <div style={{ position: 'relative', width: w, height: h, background: p.bg, color: p.ink, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: w * 0.08, top: h * 0.36 }}>
        <div style={{ fontSize: h * 0.13, fontWeight: 800, fontFamily: p.mono ? 'ui-monospace, Consolas, monospace' : undefined, letterSpacing: -1 }}>{p.title}</div>
        <div style={{ fontSize: h * 0.055, opacity: 0.6, marginTop: h * 0.03 }}>{p.sub}</div>
      </div>
      {i === 1 && [0, 1, 2, 3, 4].map((k) => <span key={k} style={{ position: 'absolute', left: w * (0.08 + k * 0.1), top: h * 0.7, width: w * 0.07, height: w * 0.07, borderRadius: '50%', background: '#fbbc04', opacity: 0.35 + k * 0.13 }} />)}
      {i === 2 && <span style={{ position: 'absolute', right: w * 0.06, top: h * 0.62, width: w * 0.16, height: h * 0.18, borderRadius: h * 0.04, border: `${h * 0.012}px solid #80cbc4`, opacity: 0.6 }} />}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: h * 0.09, background: p.mono ? '#1c262b' : 'rgba(120,100,40,.08)' }} />
    </div>
  );
}

function ListView({ t }: { t: number }) {
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: interpolate(t, [T.LIST, T.LIST + 0.3], [0, 1]) }}>
      <TopBar look={LOOK.slides} title="프레젠테이션" right={<Avatar />} />
      <div style={{ position: 'absolute', left: 40, top: TOP_H + 28, fontSize: 21 }}>최근 프레젠테이션</div>
      {DECKS.map((d, i) => (
        <div key={d.name} data-pt={i === 0 ? 'card' : undefined} style={{ position: 'absolute', left: 40 + i * 300, top: TOP_H + 80, width: 276, border: `1px solid ${G.line}`, borderRadius: 10, overflow: 'hidden', background: '#fff', ...(i === 0 ? ring(t, T.CARD, '#f9ab00') : {}) }}>
          <div style={{ height: 156, background: d.bg, color: d.ink, padding: '52px 22px 0', fontSize: 20, fontWeight: 800, borderBottom: `1px solid ${G.line}` }}>{d.head}</div>
          <div style={{ padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
            <Glyph look={LOOK.slides} size={26} />
            <div style={{ lineHeight: 1.3 }}><div style={{ fontSize: 15 }}>{d.name}</div><div style={{ fontSize: 12, color: G.muted }}>{d.when}</div></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EditorView({ t }: { t: number }) {
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: interpolate(t, [T.EDIT, T.EDIT + 0.3], [0, 1]) }}>
      <TopBar look={LOOK.slides} title="3주차 반복문" right={
        <span data-pt="show" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, height: 44, padding: '0 24px', borderRadius: 999, background: '#c2e7ff', fontSize: 17, color: G.ink, ...ring(t, T.SHOW, G.blue) }}>▶ 슬라이드쇼</span>
      } />
      <div style={{ position: 'absolute', left: 0, top: TOP_H, width: 220, bottom: 79, borderRight: `1px solid ${G.line}`, padding: '14px 0 0 18px' }}>
        {PAGES.map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <span style={{ width: 12, fontSize: 12, color: G.muted }}>{i + 1}</span>
            <div style={{ border: i === 0 ? '3px solid #fbbc04' : `1px solid ${G.line}`, borderRadius: 6, overflow: 'hidden' }}><Page i={i} w={164} h={92} /></div>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 248, top: TOP_H + 46, boxShadow: '0 2px 8px rgba(60,64,67,.25)' }}><Page i={0} w={1004} h={565} /></div>
    </div>
  );
}

function Stage() {
  const t = useSceneTime();
  const dark = interpolate(t, [T.DARK, T.DARK + 0.55], [0, 1], easeInOut);
  const page = t >= T.NEXT2 ? 2 : t >= T.NEXT1 ? 1 : 0;
  /* 암전 사각형 — 창 자리에서 화면 전체(자막 띠 위)로 번진다 */
  const rx = 345 * (1 - dark), ry = 172 * (1 - dark), rw = 1229 + (1920 - 1229) * dark, rh = 768 + (950 - 768) * dark;
  const SW = 1360, SH = 765, SX = (1920 - SW) / 2, SY = 70;
  return (
    <>
      <Head chapter="⑥ 구글 · 5/5" title="구글 수업 도구 ② 슬라이드 발표" />
      <div style={{ position: 'absolute', right: 40, top: 70, display: 'flex', alignItems: 'center', gap: 10, fontSize: 21, fontWeight: 700, color: '#15803d' }}>
        <Glyph look={LOOK.slides} size={30} />로그인 없이
      </div>
      <GtWindow x={WIN.x} y={WIN.y} s={WIN.s} active={t >= T.TAB ? 'slides' : 'classroom'} tabRefs={{ slides: 'tab' }}
        right={t >= T.EDIT ? ['← 프레젠테이션 목록', '웹으로 열기'] : ['새로고침']}>
        {t < T.LIST + 0.3 && (
          <div style={{ position: 'absolute', inset: 0, opacity: interpolate(t, [T.LIST, T.LIST + 0.3], [1, 0]) }}>
            <TopBar look={LOOK.classroom} title="클래스룸" right={<Avatar />} />
            {['#c26401', '#7b1fa2', '#1967d2'].map((c, i) => (
              <div key={c} style={{ position: 'absolute', left: 24 + i * 324, top: 88, width: 300, height: 290, border: `1px solid ${G.line}`, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ height: 100, background: c, color: '#fff', padding: 16, fontSize: 23 }}>{['1-3 정보', '1-1 정보', '2-3 프로그래밍'][i]}</div>
              </div>
            ))}
          </div>
        )}
        {t >= T.LIST && t < T.EDIT + 0.3 && <ListView t={t} />}
        {t >= T.EDIT && <EditorView t={t} />}
      </GtWindow>

      {t >= T.DARK && (
        <div style={{ position: 'absolute', left: rx, top: ry, width: rw, height: rh, background: '#000', zIndex: 40, borderRadius: 14 * (1 - dark) }}>
          {dark > 0.6 && (
            <div style={{ position: 'absolute', left: SX, top: SY, opacity: interpolate(t, [T.DARK + 0.35, T.DARK + 0.7], [0, 1]) }} data-pt="next">
              <Page i={page} w={SW} h={SH} />
            </div>
          )}
          {dark > 0.6 && (
            <div style={{ position: 'absolute', left: 36, bottom: 26, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderRadius: 10, background: 'rgba(60,64,67,.85)', color: '#fff', fontSize: 20 }}>
              <span style={{ padding: '2px 10px' }}>‹</span>
              <span style={{ fontVariantNumeric: 'tabular-nums', padding: '0 4px' }}>{page + 1} / {PAGES.length}</span>
              <span style={{ padding: '2px 10px' }}>›</span>
              <span style={{ marginLeft: 8, padding: '4px 14px', borderRadius: 8, background: 'rgba(255,255,255,.14)', fontSize: 18 }}>슬라이드쇼 종료</span>
            </div>
          )}
          {t >= T.HINT && (
            <div style={{ position: 'absolute', right: 36, bottom: 24, display: 'flex', gap: 10, opacity: interpolate(t, [T.HINT, T.HINT + 0.4], [0, 1]) }}>
              {['화면 누르기 · 왼쪽 1/3은 이전', '← → 방향키', 'Esc 로 끝'].map((h) => (
                <span key={h} style={{ padding: '8px 16px', borderRadius: 999, border: '1.5px solid rgba(255,255,255,.4)', color: '#fff', fontSize: 19, fontWeight: 600 }}>{h}</span>
              ))}
            </div>
          )}
        </div>
      )}
      {t >= T.PPT && (
        <div style={{ position: 'absolute', left: '50%', top: 22, transform: `translate(-50%, ${(1 - interpolate(t, [T.PPT, T.PPT + 0.4], [0, 1])) * -14}px)`, zIndex: 45, opacity: interpolate(t, [T.PPT, T.PPT + 0.4], [0, 1]) }}>
          <Chip tone="warn" style={{ background: '#fff7ed', fontSize: 22 }}><Glyph look={LOOK.powerpoint} size={30} />.pptx 파일은 교실 PC의 PowerPoint로 열림</Chip>
        </div>
      )}

      <Cursor color={t > T.DARK ? '#fff' : undefined} path={[
        { t: 0.5, x: 45, y: 70 },
        { t: T.TAB, x: TG.tab.x, y: TG.tab.y, click: true },
        { t: T.CARD, x: TG.card.x, y: TG.card.y, click: true },
        { t: T.SHOW, x: TG.show.x, y: TG.show.y, click: true },
        { t: T.NEXT1, x: TG.next.x, y: TG.next.y, click: true },
        { t: T.NEXT2, x: TG.next.x, y: TG.next.y, click: true },
        { t: T.NEXT2 + 1.0, x: TG.next.x + 4, y: TG.next.y + 8, hide: true },
      ]} />
      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S24() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
