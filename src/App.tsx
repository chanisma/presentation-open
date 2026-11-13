import { lazy, Suspense, useEffect, useMemo } from 'react';
import { DECK_MAP, type DeckMeta } from './decks/registry';
import Hub from './hub/Hub';
import LiveBridge from './live/LiveBridge';
import HostPage from './live/HostPage';
import JoinPage from './live/JoinPage';
import LegacyDeckViewer from './legacy/LegacyDeckViewer';
import CompositeDeck from './composite/CompositeDeck';

/* ── Multi-deck router ───────────────────────────────────────────────
   The engine owns the URL hash (slide number, e.g. #7) and the ?presenter=1
   query, so deck selection rides on a separate ?deck=<id> query param. The
   presenter tab is opened by the engine as `?presenter=1` WITHOUT the deck
   param, so we remember the last-opened deck in localStorage and fall back to
   it there. No engine files are touched.

   ?live=<CODE>(&host=1)까지 오면 LiveBridge가 덱 위에 라이브 레이어
   (교사 미니바 + 슬라이드 동기화)를 얹는다 — 역시 엔진 무수정.

   메인(/)은 학생 참여 화면이고, 수업 자료 허브는 /hub 로 분리했다. */
const CURRENT_KEY = 'deck:current';

/* 로컬 덱 에디터(?app=edit) — 파일 쓰기 API가 dev 서버 플러그인이라 dev에서만 뜬다.
   프로덕션 빌드에서는 DEV가 false로 치환되어 이 동적 import가 통째로 사라진다. */
const EditorPage = import.meta.env.DEV ? lazy(() => import('./edit/EditorPage')) : null;

/* 허브 경로 판정 — `/hub`. 수업 파일이 사는 `/data/…`와 이름을 겹치지 않게
   분리했다(=/data 로는 허브가 뜨지 않는다). 프로덕션에서 `/hub`(및 `/hub/`)를
   index.html로 넘기는 리라이트는 _redirects에 있다. */
function isHubPath(pathname: string) {
  return /^\/hub\/?$/.test(pathname);
}

function resolveDeck(): DeckMeta | null {
  const params = new URLSearchParams(window.location.search);
  let id = params.get('deck');
  if (!id && params.has('presenter')) id = localStorage.getItem(CURRENT_KEY);
  return id && DECK_MAP[id] ? DECK_MAP[id] : null;
}

function setFavicon(emoji: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${emoji}</text></svg>`;
}

export default function App() {
  const active = useMemo(resolveDeck, []);
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const liveCode = params.get('live');
  // 라이브 앱 라우트: ?app=host(교사 콘솔) / ?app=join(학생 참여) / ?app=hub(허브)
  const appPage = params.get('app');
  // 허브는 /hub 경로 — ?app=hub는 리라이트 없이도 닿는 별칭
  const showHub = appPage === 'hub' || (!appPage && isHubPath(window.location.pathname));
  // 레거시 HTML 덱 뷰어: ?legacy=<data/…/index.html> — 진짜 bolt 크롬으로 컨트롤.
  // 프레젠터 탭은 ?presenter=1만 갖고 열리므로, 최근에 연 뷰어가 네이티브 덱보다
  // 더 최신이면 저장된 경로로 복구한다.
  const legacyPath = useMemo(() => {
    const p = params.get('legacy');
    if (p) return p;
    if (params.has('presenter') && !params.get('deck') && !params.get('composite')) {
      try {
        const saved = JSON.parse(localStorage.getItem('viewer:legacy') || 'null');
        const deckAt = Number(localStorage.getItem('deck:currentAt') || 0);
        const compAt =
          JSON.parse(localStorage.getItem('composite:current') || 'null')?.at ?? 0;
        if (saved?.path && saved.at > deckAt && saved.at > compAt)
          return saved.path as string;
      } catch {
        /* 무시 */
      }
    }
    return null;
  }, [params]);

  // 컴포지트 덱: ?composite=<data/…/deck.json> — deck.json 매니페스트 시퀀싱.
  // 프레젠터 복구는 네이티브/뷰어와 동일하게 최신 기록이 이긴다.
  const compositePath = useMemo(() => {
    const p = params.get('composite');
    if (p) return p;
    if (params.has('presenter') && !params.get('deck') && !params.get('legacy')) {
      try {
        const saved = JSON.parse(
          localStorage.getItem('composite:current') || 'null'
        );
        const deckAt = Number(localStorage.getItem('deck:currentAt') || 0);
        const legacyAt =
          JSON.parse(localStorage.getItem('viewer:legacy') || 'null')?.at ?? 0;
        if (saved?.path && saved.at > deckAt && saved.at > legacyAt)
          return saved.path as string;
      } catch {
        /* 무시 */
      }
    }
    return null;
  }, [params]);

  // Per-deck theme + tab title + favicon. Theme vars are set on the document
  // root so body's var(--bg) recolors too; cleaned up if the deck unmounts.
  useEffect(() => {
    // host/join/뷰어/컴포지트는 자체 관리
    if (legacyPath || compositePath) return;
    // 에디터는 ?deck=<id>를 함께 받지만 덱 테마를 입으면 도구 화면이 물든다
    if (appPage === 'host' || appPage === 'join' || appPage === 'edit') return;
    const root = document.documentElement;
    if (active) {
      localStorage.setItem(CURRENT_KEY, active.id);
      localStorage.setItem('deck:currentAt', String(Date.now()));
      document.title = active.title;
      setFavicon(active.favicon);
      const theme = active.theme;
      if (theme)
        for (const [k, v] of Object.entries(theme)) root.style.setProperty(k, v);
      return () => {
        if (theme) for (const k of Object.keys(theme)) root.style.removeProperty(k);
      };
    }
    // 메인(/)은 학생 참여 화면 — 타이틀·파비콘은 JoinPage/index.html이 관리
    if (!showHub) return;
    document.title = '수업 자료 허브 — 샘플고등학교';
    setFavicon('🎓');
  }, [active, appPage, legacyPath, compositePath, showHub]);

  if (appPage === 'edit' && EditorPage)
    return (
      <Suspense fallback={null}>
        <EditorPage />
      </Suspense>
    );
  if (appPage === 'host') return <HostPage />;
  if (appPage === 'join') return <JoinPage />;
  if (compositePath) return <CompositeDeck path={compositePath} />;
  if (legacyPath) return <LegacyDeckViewer path={legacyPath} />;

  if (active) {
    const Deck = active.Component;
    return (
      <>
        <Deck />
        {liveCode && <LiveBridge deck={active} code={liveCode} />}
      </>
    );
  }
  // /hub → 수업 자료 허브, 그 외(메인 /) → 학생 참여
  return showHub ? <Hub /> : <JoinPage />;
}
