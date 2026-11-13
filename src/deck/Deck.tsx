import {
  Children,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactElement, ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { DeckCtx } from './DeckContext';
import {
  SCENE_CONTROL_EVENT,
  SCENE_STATE_EVENT,
  type SceneControl,
  type ScenePlaybackState,
} from '../scene';
import Annotator, { COLORS, type Stroke, type Tool } from './Annotator';
import {
  TabRecorder,
  domShot,
  downloadShot,
  ShotsRail,
  ShotModal,
  ZoomSelect,
  type Shot,
  type ZoomRect,
} from './Capture';
import {
  NoteBox,
  NotesRail,
  loadNotes,
  saveNotes,
  newNoteId,
  NOTE_BGS,
  type NoteData,
} from './Notes';
import {
  IconSidebar,
  IconGrid,
  IconLeft,
  IconRight,
  IconPencil,
  IconExpand,
  IconShrink,
  IconPresent,
  IconClose,
  IconCamera,
  IconImages,
  IconZoom,
  IconReplay,
  IconNote,
} from './icons';

/* ── The paged presentation engine + the Slidev-style chrome (dock + rail).
   Wrap your <Slide>/<Bento>/… in <Deck>. Each top-level child is one slide.
     → / ↓ / Space   next (타임라인 슬라이드의 Space는 재생/일시정지)
     ← / ↑           previous            S sidebar     G grid view
     Home / End      first / last        A annotate    P presenter (new tab)
     F fullscreen    H hide/show the UI
   Copy verbatim; theme only via the :root tokens. ───────────────────────── */

const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(
    2,
    '0'
  )}`;

const fmtSceneTime = (seconds: number) => {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const rest = safe - minutes * 60;
  return minutes > 0
    ? `${minutes}:${String(Math.floor(rest)).padStart(2, '0')}`
    : `${rest.toFixed(1)}s`;
};

function Thumb({ children }: { children: ReactNode }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [d, setD] = useState({ vw: 1280, vh: 720, scale: 0.15 });
  // measure before paint — with useEffect the first frame renders at the
  // default scale and visibly snaps (worst in the grid view, which has no
  // slide-in transition to mask it).
  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const update = () =>
      setD({
        vw: window.innerWidth,
        vh: window.innerHeight,
        scale: el.clientWidth / window.innerWidth,
      });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);
  return (
    <div
      className="noir-thumb-frame"
      ref={frameRef}
      style={{ aspectRatio: `${d.vw} / ${d.vh}` }}
    >
      <DeckCtx.Provider value={{ clicks: 9999, isStatic: true }}>
        <div
          className="noir-thumb-scale"
          style={{ width: d.vw, height: d.vh, transform: `scale(${d.scale})` }}
        >
          {children}
        </div>
      </DeckCtx.Provider>
    </div>
  );
}

export default function Deck({ children }: { children: ReactNode }) {
  const slides = useMemo(
    () => Children.toArray(children) as ReactElement[],
    [children]
  );
  const total = slides.length;
  const isPresenter = useMemo(
    () => new URLSearchParams(window.location.search).has('presenter'),
    []
  );

  const [slide, setSlide] = useState(() => {
    const h = parseInt(window.location.hash.slice(1), 10);
    return h >= 1 && h <= total ? h - 1 : 0;
  });
  const [clicks, setClicks] = useState(0);
  const [curMax, setCurMax] = useState(0);
  const [railOpen, setRailOpen] = useState(false);
  const [gridOpen, setGridOpen] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [fs, setFs] = useState(false);
  const [uiHidden, setUiHidden] = useState(false);
  const [nearDock, setNearDock] = useState(false);
  const [cursorIdle, setCursorIdle] = useState(false);
  // capture(현재 탭 스크린샷 — 주석 포함) + 캡처 갤러리 + 영역 확대
  const [shots, setShots] = useState<Shot[]>([]);
  const [shotsOpen, setShotsOpen] = useState(false);
  const [shotView, setShotView] = useState<Shot | null>(null);
  const [shotFlash, setShotFlash] = useState(false);
  const [zoomMode, setZoomMode] = useState(false);
  const [zoom, setZoom] = useState<{ s: number; tx: number; ty: number } | null>(
    null
  );
  // 씬(타임라인) 슬라이드 재생 — epoch가 바뀌면 스테이지가 리마운트되어 t=0
  const [sceneEpoch, setSceneEpoch] = useState(0);
  const [hasScene, setHasScene] = useState(false);
  const [scenePlayback, setScenePlayback] = useState<ScenePlaybackState | null>(null);
  const chan = useRef<BroadcastChannel | null>(null);
  const controlScene = useCallback((control: SceneControl) => {
    window.dispatchEvent(new CustomEvent(SCENE_CONTROL_EVENT, { detail: control }));
    chan.current?.postMessage({ type: 'scene-control', control });
  }, []);
  // 노트 영역 — annotate와 별개의 자유 배치 필기 노트 (세션 저장)
  // (발표자 노트 변수 `notes`와 구분해 noteRegions로 명명)
  const [noteRegions, setNoteRegions] = useState<NoteData[]>(() => loadNotes());
  const [notesOpen, setNotesOpen] = useState(false);
  // annotate 도구 상태 — Deck 소유: 활성 노트가 같은 도구를 공유한다
  const [annTool, setAnnTool] = useState<Tool>('pen');
  const [annColor, setAnnColor] = useState(COLORS[0]);
  const [annSize, setAnnSize] = useState(6);
  // 활성(선택된) 노트 — 있으면 annotate가 자동으로 켜지고 그 노트에만 적용
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  /* 세로 화면(폰): 슬라이드를 가로 16:9 가상 캔버스로 렌더해 폭에 맞춰
     축소한다 — 데스크톱 저작 레이아웃을 그대로 보존하면서 세로에서의
     겹침·붕괴만 막는 최소 개입. (완전한 모바일 재배치는 슬라이드 재저작 영역) */
  const [vp, setVp] = useState(() => ({
    w: window.innerWidth,
    h: window.innerHeight,
  }));
  const [noteOverrides, setNoteOverrides] = useState<Record<number, string>>(
    () => {
      try {
        return JSON.parse(localStorage.getItem('deck:notes') || '{}');
      } catch {
        return {};
      }
    }
  );

  // per-slide build maxima (so going back restores the right click state) and
  // per-slide annotations (so drawings persist on the slide they were made).
  const maxMap = useRef<Record<number, number>>({});
  const annStore = useRef<Record<number, Stroke[]>>({});
  const slideRef = useRef(slide);
  slideRef.current = slide;
  const recorder = useRef<TabRecorder | null>(null);
  const capBusy = useRef(false);

  const registerMax = useCallback((at: number) => {
    const m = maxMap.current;
    m[slideRef.current] = Math.max(m[slideRef.current] || 0, at);
    setCurMax((c) => Math.max(c, at));
  }, []);

  const go = useCallback(
    (i: number) => {
      const n = Math.max(0, Math.min(total - 1, i));
      setSlide(n);
      setClicks(0);
      setCurMax(maxMap.current[n] || 0);
    },
    [total]
  );
  const next = useCallback(() => {
    if (clicks < curMax) {
      setClicks(clicks + 1);
      return;
    }
    if (slide < total - 1) {
      const n = slide + 1;
      setSlide(n);
      setClicks(0);
      setCurMax(maxMap.current[n] || 0);
    }
  }, [clicks, curMax, slide, total]);
  const prev = useCallback(() => {
    if (clicks > 0) {
      setClicks(clicks - 1);
      return;
    }
    if (slide > 0) {
      const n = slide - 1;
      const m = maxMap.current[n] || 0;
      setSlide(n);
      setClicks(m);
      setCurMax(m);
    }
  }, [clicks, slide]);

  const toggleFs = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  }, []);
  // sidebar and grid view are mutually exclusive — opening one closes the other
  const toggleRail = useCallback(() => {
    setRailOpen((v) => !v);
    setGridOpen(false);
  }, []);
  const toggleGrid = useCallback(() => {
    setGridOpen((v) => !v);
    setRailOpen(false);
  }, []);
  const setNote = useCallback((text: string) => {
    setNoteOverrides((prev) => {
      const nextO = { ...prev, [slideRef.current]: text };
      try {
        localStorage.setItem('deck:notes', JSON.stringify(nextO));
      } catch {
        /* ignore */
      }
      return nextO;
    });
  }, []);
  const openPresenter = useCallback(() => {
    if (isPresenter) return;
    const url =
      window.location.pathname + '?presenter=1' + window.location.hash;
    window.open(url, 'deck-presenter');
  }, [isPresenter]);

  /* 버튼을 누른 '그 순간'의 화면(주석 캔버스 포함)을 DOM 래스터화로 한 장
     캡처 → 파일 저장 + 세션 갤러리. 화면 공유 권한도 '공유 중지' 바도 상시
     스트림도 없다. 독·도구막대·갤러리는 filter로 빠지므로 UI를 숨겼다
     복원할 필요도 없다. DOM 캡처가 실패하는 예외에서만 화면 공유 원샷
     (잡고 즉시 해제) 폴백. */
  const doCapture = useCallback(async () => {
    if (capBusy.current) return;
    capBusy.current = true;
    try {
      let url: string;
      try {
        url = await domShot();
      } catch {
        if (!recorder.current) recorder.current = new TabRecorder();
        url = await recorder.current.oneShot();
      }
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      const cur = slideRef.current;
      const title = (document.title || 'deck')
        .replace(/[\\/:*?"<>|]/g, '')
        .trim()
        .slice(0, 40);
      downloadShot(url, `${title}_슬라이드${cur + 1}_${hh}${mm}${ss}.png`);
      setShots((s) => [...s, { url, slide: cur, label: `${hh}:${mm}:${ss}` }]);
      setShotFlash(true);
      window.setTimeout(() => setShotFlash(false), 180);
    } catch {
      /* 폴백까지 취소/실패 — 조용히 무시 */
    } finally {
      capBusy.current = false;
    }
  }, []);

  const toggleShots = useCallback(() => {
    setShotsOpen((v) => !v);
    setGridOpen(false);
    setNotesOpen(false);
  }, []);

  /* 노트 영역 — 생성·수정·재표시. 우측 레일은 캡처 레일과 상호 배타 */
  useEffect(() => saveNotes(noteRegions), [noteRegions]);
  const addNote = useCallback(() => {
    const cur = slideRef.current;
    setNoteRegions((ns) => [
      ...ns,
      {
        id: newNoteId(),
        slide: cur,
        x: 30 + ((ns.length * 3) % 12),
        y: 22 + ((ns.length * 4) % 14),
        w: 340,
        h: 240,
        bg: NOTE_BGS[0],
        visible: true,
        strokes: [],
      },
    ]);
    setNotesOpen(false);
  }, []);
  const patchNote = useCallback((id: string, patch: Partial<NoteData>) => {
    setNoteRegions((ns) => ns.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }, []);
  const toggleNotes = useCallback(() => {
    setNotesOpen((v) => !v);
    setGridOpen(false);
    setShotsOpen(false);
  }, []);
  const showNote = useCallback(
    (n: NoteData) => {
      go(n.slide);
      patchNote(n.id, { visible: true });
      setNotesOpen(false);
    },
    [go, patchNote]
  );
  /* 노트 활성화 = annotate 자동 ON. 노트 밖(도구막대·독 제외)을 클릭하면
     비활성 + annotate OFF. */
  const activateNote = useCallback((id: string) => {
    setActiveNoteId(id);
    setDrawing(true);
  }, []);
  useEffect(() => {
    if (!activeNoteId) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.closest(`[data-note-id="${activeNoteId}"]`)) return;
      if (t.closest('.ann-bar')) return; // 도구 바꾸는 클릭은 유지
      setActiveNoteId(null);
      setDrawing(false);
    };
    window.addEventListener('pointerdown', onDown, true);
    return () => window.removeEventListener('pointerdown', onDown, true);
  }, [activeNoteId]);
  // 슬라이드 이동·노트 숨김 시 활성 해제
  useEffect(() => {
    setActiveNoteId(null);
  }, [slide]);

  /* 영역 확대 — 버튼/Z로 선택 모드 진입, 드래그한 사각형이 화면에 꽉 차게
     slide-stage를 transform. 다시 누르면(또는 슬라이드 이동 시) 원래대로. */
  const applyZoom = useCallback((r: ZoomRect) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const s = Math.min(8, Math.min(vw / r.w, vh / r.h) * 0.92);
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    setZoom({ s, tx: vw / 2 - s * cx, ty: vh / 2 - s * cy });
    setZoomMode(false);
  }, []);
  const toggleZoom = useCallback(() => {
    if (zoom) {
      setZoom(null);
      setZoomMode(false);
    } else {
      setZoomMode((v) => !v);
    }
  }, [zoom]);

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      const sceneRange = t?.matches('.noir-scene-inline-range') ?? false;
      const sceneSeekDelta =
        e.code === 'Comma' || e.key === '<' || e.key === ','
          ? -0.5
          : e.code === 'Period' || e.key === '>' || e.key === '.'
            ? 0.5
            : null;
      if (sceneRange) {
        if (e.key === ' ' && scenePlayback && !e.repeat) {
          e.preventDefault();
          controlScene({
            action: scenePlayback.playing ? 'pause' : 'play',
            time: scenePlayback.time,
          });
        } else if (sceneSeekDelta !== null && scenePlayback) {
          e.preventDefault();
          controlScene({
            action: 'seekBy',
            time: sceneSeekDelta,
          });
        }
        return;
      }
      if (
        t &&
        (t.tagName === 'TEXTAREA' ||
          t.tagName === 'INPUT' ||
          t.isContentEditable)
      )
        return;
      if (sceneSeekDelta !== null && scenePlayback) {
        e.preventDefault();
        controlScene({ action: 'seekBy', time: sceneSeekDelta });
        return;
      }
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          next();
          break;
        case ' ':
          e.preventDefault();
          if (scenePlayback) {
            if (e.repeat) break;
            controlScene({
              action: scenePlayback.playing ? 'pause' : 'play',
              time: scenePlayback.time,
            });
          } else {
            next();
          }
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          prev();
          break;
        case 'Home':
          e.preventDefault();
          go(0);
          break;
        case 'End':
          e.preventDefault();
          go(total - 1);
          break;
        case 's':
        case 'S':
          toggleRail();
          break;
        case 'g':
        case 'G':
          toggleGrid();
          break;
        case 'f':
        case 'F':
          toggleFs();
          break;
        case 'a':
        case 'A':
          setDrawing((v) => !v);
          break;
        case 'p':
        case 'P':
          openPresenter();
          break;
        case 'h':
        case 'H':
          setUiHidden((v) => !v);
          break;
        case 'c':
        case 'C':
          void doCapture();
          break;
        case 'r':
        case 'R':
          toggleShots();
          break;
        case 'z':
        case 'Z':
          toggleZoom();
          break;
        case 'n':
        case 'N':
          addNote();
          break;
        case 'Escape':
          setRailOpen(false);
          setGridOpen(false);
          setDrawing(false);
          setUiHidden(false);
          setShotsOpen(false);
          setShotView(null);
          setZoomMode(false);
          setZoom(null);
          setNotesOpen(false);
          setActiveNoteId(null);
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    next,
    prev,
    go,
    total,
    toggleRail,
    toggleGrid,
    toggleFs,
    openPresenter,
    doCapture,
    toggleShots,
    toggleZoom,
    addNote,
    scenePlayback,
    controlScene,
  ]);

  // safety net: if the authored deck kept the placeholder tab title, derive
  // one from the current slide's heading so shared links look right.
  useEffect(() => {
    if (!document.title.startsWith('Replace')) return;
    const h = document.querySelector<HTMLElement>(
      '.slide-stage h1, .slide-stage h2'
    );
    const t = h?.innerText.replace(/\s+/g, ' ').trim();
    if (t) document.title = t;
  }, []);

  // URL hash sync (initial slide comes from the hash via useState above)
  useEffect(() => {
    const want = String(slide + 1);
    if (window.location.hash.slice(1) !== want)
      history.replaceState(null, '', '#' + want);
  }, [slide]);
  useEffect(() => {
    const onHash = () => {
      const h = parseInt(window.location.hash.slice(1), 10);
      if (h >= 1 && h <= total && h - 1 !== slide) go(h - 1);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [slide, total, go]);

  // cross-tab sync (audience ⇄ presenter), via BroadcastChannel
  const applyingRemote = useRef(false);
  useEffect(() => {
    // iframe 임베드(학생 미러 등)는 수동 미러 — BC에 참여하면 지연된 옛
    // 슬라이드를 재방송해 호스트/발표자 덱을 뒤로 끌어당긴다(연타 시 튐).
    // 대신 부모(join 페이지)가 postMessage로 slide+clicks를 명령한다(아래 effect).
    if (window.self !== window.top) return;
    const c = new BroadcastChannel('deck-sync');
    chan.current = c;
    c.onmessage = (e) => {
      if (e.data?.type === 'state') {
        applyingRemote.current = true;
        setSlide(e.data.slide);
        setClicks(e.data.clicks);
      } else if (e.data?.type === 'scene-control') {
        window.dispatchEvent(
          new CustomEvent(SCENE_CONTROL_EVENT, { detail: e.data.control })
        );
      }
    };
    return () => c.close();
  }, []);
  useEffect(() => {
    if (applyingRemote.current) {
      applyingRemote.current = false;
      return;
    }
    chan.current?.postMessage({ type: 'state', slide, clicks });
  }, [slide, clicks]);

  // 미러 임베드 수신: 부모(join 페이지)가 호스트의 slide + clicks(빌드 단계)를
  // postMessage로 전달한다 — 한 슬라이드 안에서 하나씩 열리는 요소까지 추종
  useEffect(() => {
    if (window.self === window.top) return;
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== location.origin) return;
      const d = e.data as { type?: string; slide?: number; clicks?: number };
      if (d?.type !== 'deck-mirror' || !Number.isInteger(d.slide)) return;
      const c = Number.isInteger(d.clicks) ? (d.clicks as number) : 0;
      setSlide(d.slide as number);
      setClicks(c);
      setCurMax((m) => Math.max(m, c));
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  // 슬라이드를 옮기면 확대는 해제 (확대는 "이 장면의 이 부분" 한정)
  useEffect(() => {
    setZoom(null);
    setZoomMode(false);
  }, [slide]);
  // 현재 슬라이드에 씬 타임라인이 있는지 감지 → 재생 버튼 노출
  useEffect(() => {
    setHasScene(!!document.querySelector('.slide-stage [data-scene-root]'));
  }, [slide, sceneEpoch]);
  useEffect(() => {
    setScenePlayback(null);
  }, [slide, sceneEpoch]);
  useEffect(() => {
    const onSceneState = (event: Event) => {
      setScenePlayback(
        (event as CustomEvent<ScenePlaybackState | null>).detail ?? null
      );
    };
    window.addEventListener(SCENE_STATE_EVENT, onSceneState);
    return () => window.removeEventListener(SCENE_STATE_EVENT, onSceneState);
  }, []);
  useEffect(() => {
    const onR = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onR);
    window.addEventListener('orientationchange', onR);
    return () => {
      window.removeEventListener('resize', onR);
      window.removeEventListener('orientationchange', onR);
    };
  }, []);
  const portrait = vp.h > vp.w;
  // 세션 종료 시 캡처 스트림 정리
  useEffect(() => {
    const rec = recorder;
    return () => rec.current?.dispose();
  }, []);

  // fullscreen flag, presenter timer, idle auto-hide
  useEffect(() => {
    const h = () => setFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);
  useEffect(() => {
    if (!isPresenter) return;
    setElapsed(0);
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [isPresenter]);
  // mouse-driven only: keyboard nav keeps the UI hidden; the dock returns when
  // the pointer nears the bottom (where it lives); the cursor hides on idle.
  useEffect(() => {
    let t = 0;
    const onMove = (e: MouseEvent) => {
      setCursorIdle(false);
      setNearDock(e.clientY > window.innerHeight - 150);
      clearTimeout(t);
      t = window.setTimeout(() => setCursorIdle(true), 2600);
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      clearTimeout(t);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  const liveCtx = useMemo(
    () => ({ clicks, isStatic: false, registerMax }),
    [clicks, registerMax]
  );
  const hasPrev = slide > 0 || clicks > 0;
  const hasNext = slide < total - 1 || clicks < curMax;
  const notes = (slides[slide]?.props as { notes?: string } | undefined)?.notes;
  const noteText = noteOverrides[slide] ?? notes ?? '';
  const nextSlide = slides[slide + 1];
  const hideUI = uiHidden || (fs && !nearDock);
  const cursorHidden = fs && cursorIdle && !drawing;
  const showAnnotator = drawing || (annStore.current[slide]?.length ?? 0) > 0;

  // prev / counter / next — rendered inside the pill on desktop, in its own
  // pill above the tools on phones (only one is visible at a time).
  const navCluster = (
    <>
      <button
        className="noir-icon-btn"
        data-tip="Previous"
        disabled={!hasPrev}
        onClick={prev}
      >
        <IconLeft />
      </button>
      <div className="noir-counter">
        <span className="noir-counter-now">{slide + 1}</span>
        <span className="noir-counter-tot">/ {total}</span>
      </div>
      <button
        className="noir-icon-btn"
        data-tip="Next"
        disabled={!hasNext}
        onClick={next}
      >
        <IconRight />
      </button>
    </>
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className={'deck' + (cursorHidden ? ' nocursor' : '')}>
        <DeckCtx.Provider value={liveCtx}>
          <div className="slide-stage" key={`${slide}:${sceneEpoch}`}>
            {/* 확대 변환은 엔진 CSS(.slide-stage 애니메이션 등)와 간섭하지 않는
                자체 래퍼가 담당한다 */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transformOrigin: '0 0',
                transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
                transform: zoom
                  ? `translate(${zoom.tx}px, ${zoom.ty}px) scale(${zoom.s})`
                  : undefined,
                willChange: zoom ? 'transform' : undefined,
              }}
            >
            {portrait ? (
              /* 가로 가상 캔버스(긴 변 기준 16:9)를 폭에 맞춰 축소 — 세로에서도
                 데스크톱 구도가 그대로 유지된다 (핀치 줌으로 확대 가능) */
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  width: vp.h,
                  height: (vp.h * 9) / 16,
                  transform: `translateY(-50%) scale(${vp.w / vp.h})`,
                  transformOrigin: 'left center',
                }}
              >
                {slides[slide]}
              </div>
            ) : (
              slides[slide]
            )}
            </div>
          </div>
        </DeckCtx.Provider>

        {showAnnotator && (
          <Annotator
            key={slide}
            slide={slide}
            store={annStore.current}
            active={drawing}
            tool={annTool}
            color={annColor}
            size={annSize}
            onTool={setAnnTool}
            onColor={setAnnColor}
            onSize={setAnnSize}
            inputDisabled={activeNoteId !== null}
          />
        )}

        <aside className={'noir-rail' + (railOpen ? ' open' : '')}>
          <div className="noir-rail-head">
            <span className="noir-rail-title">Slides</span>
            <button
              className="noir-icon-btn sm"
              data-tip="Close"
              onClick={() => setRailOpen(false)}
            >
              <IconClose />
            </button>
          </div>
          <div className="noir-rail-list">
            {railOpen &&
              slides.map((s, i) => (
                <button
                  key={i}
                  className={'noir-thumb' + (i === slide ? ' active' : '')}
                  onClick={() => {
                    go(i);
                    setRailOpen(false);
                  }}
                >
                  <span className="noir-thumb-no">{i + 1}</span>
                  <Thumb>{s}</Thumb>
                </button>
              ))}
          </div>
        </aside>

        {gridOpen && (
          <div className="noir-grid">
            <div className="noir-grid-head">
              <span className="noir-rail-title">All slides</span>
              <button
                className="noir-icon-btn sm"
                data-tip="Close"
                onClick={() => setGridOpen(false)}
              >
                <IconClose />
              </button>
            </div>
            <div className="noir-grid-list">
              {slides.map((s, i) => (
                <button
                  key={i}
                  className={'noir-thumb' + (i === slide ? ' active' : '')}
                  onClick={() => {
                    go(i);
                    setGridOpen(false);
                  }}
                >
                  <span className="noir-thumb-no">{i + 1}</span>
                  <Thumb>{s}</Thumb>
                </button>
              ))}
            </div>
          </div>
        )}

        {isPresenter && (
          <div className="noir-presenter">
            <div className="noir-presenter-row">
              <span className="noir-presenter-label">
                Presenter · {slide + 1} / {total}
              </span>
              <span className="noir-presenter-timer">{fmt(elapsed)}</span>
            </div>
            {nextSlide && (
              <div className="noir-presenter-next">
                <Thumb>{nextSlide}</Thumb>
              </div>
            )}
            <textarea
              className="noir-presenter-notes"
              value={noteText}
              spellCheck={false}
              placeholder={'No notes — type here, or add notes="…" in code.'}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="noir-presenter-hint">
              Notes you type are saved on this device.
            </div>
          </div>
        )}

        <div
          className={
            'noir-dock' +
            (scenePlayback ? ' has-scene-timeline' : '') +
            (hideUI ? ' hidden' : '')
          }
        >
          {/* phones: nav floats bare above the tools pill (see base.css) */}
          <div className="noir-bar noir-nav-bar">{navCluster}</div>
          <div className="noir-bar">
            <button
              className={'noir-icon-btn' + (railOpen ? ' on' : '')}
              data-tip="Sidebar (S)"
              onClick={toggleRail}
            >
              <IconSidebar />
            </button>
            <button
              className={'noir-icon-btn' + (gridOpen ? ' on' : '')}
              data-tip="Grid view (G)"
              onClick={toggleGrid}
            >
              <IconGrid />
            </button>
            <span className="noir-sep" />
            <div className="noir-nav-inline">{navCluster}</div>
            <span className="noir-sep" />
            <button
              className={'noir-icon-btn' + (drawing ? ' on' : '')}
              data-tip="Annotate (A)"
              onClick={() => setDrawing((v) => !v)}
            >
              <IconPencil />
            </button>
            {hasScene && !scenePlayback && (
              <button
                className="noir-icon-btn"
                data-tip="씬 다시 재생"
                onClick={() => setSceneEpoch((e) => e + 1)}
              >
                <IconReplay />
              </button>
            )}
            {scenePlayback && (
              <div className="noir-scene-inline" aria-label="씬 재생 컨트롤">
                <button
                  type="button"
                  className="noir-icon-btn sm"
                  data-tip="씬 처음부터 다시 보기"
                  aria-label="씬 처음부터 다시 보기"
                  onClick={() => controlScene({ action: 'restart' })}
                >
                  <IconReplay />
                </button>
                <button
                  type="button"
                  className="noir-icon-btn sm noir-scene-inline-play"
                  data-tip={scenePlayback.playing ? '씬 일시정지' : '씬 재생'}
                  aria-label={scenePlayback.playing ? '씬 일시정지' : '씬 재생'}
                  onClick={() =>
                    controlScene({
                      action: scenePlayback.playing ? 'pause' : 'play',
                      time: scenePlayback.time,
                    })
                  }
                >
                  {scenePlayback.playing ? '❚❚' : '▶'}
                </button>
                <input
                  className="noir-scene-inline-range"
                  type="range"
                  min={0}
                  max={
                    scenePlayback.duration ??
                    Math.max(10, Math.ceil((scenePlayback.time + 5) / 5) * 5)
                  }
                  step={0.01}
                  value={
                    scenePlayback.duration === null
                      ? scenePlayback.time
                      : Math.min(scenePlayback.time, scenePlayback.duration)
                  }
                  aria-label="씬 시간"
                  aria-valuetext={
                    scenePlayback.duration === null
                      ? fmtSceneTime(scenePlayback.time)
                      : `${fmtSceneTime(scenePlayback.time)} / ${fmtSceneTime(scenePlayback.duration)}`
                  }
                  title={
                    scenePlayback.duration === null
                      ? `${fmtSceneTime(scenePlayback.time)} · 계속 재생`
                      : `${fmtSceneTime(scenePlayback.time)} / ${fmtSceneTime(scenePlayback.duration)}`
                  }
                  onChange={(event) =>
                    controlScene({
                      action: 'seek',
                      time: Number(event.currentTarget.value),
                    })
                  }
                />
                <output className="noir-scene-inline-time">
                  {fmtSceneTime(scenePlayback.time)}
                </output>
              </div>
            )}
            <button
              className={'noir-icon-btn' + (zoomMode || zoom ? ' on' : '')}
              data-tip={zoom ? 'Zoom 해제 (Z)' : 'Zoom 영역 (Z)'}
              onClick={toggleZoom}
            >
              <IconZoom />
            </button>
            <button
              className="noir-icon-btn"
              data-tip="Capture (C)"
              onClick={() => void doCapture()}
            >
              <IconCamera />
            </button>
            <button
              className={'noir-icon-btn' + (notesOpen ? ' on' : '')}
              data-tip="Notes (N: 새 노트)"
              onClick={toggleNotes}
              style={{ position: 'relative' }}
            >
              <IconNote />
              {noteRegions.length > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 1,
                    right: 1,
                    minWidth: 15,
                    height: 15,
                    padding: '0 3px',
                    borderRadius: 999,
                    background: 'var(--primary, #4fe5b0)',
                    color: 'var(--accent-ink, #04140e)',
                    fontSize: 10,
                    fontWeight: 800,
                    display: 'grid',
                    placeItems: 'center',
                    lineHeight: 1,
                  }}
                >
                  {noteRegions.length}
                </span>
              )}
            </button>
            <button
              className={'noir-icon-btn' + (shotsOpen ? ' on' : '')}
              data-tip="Captures (R)"
              onClick={toggleShots}
              style={{ position: 'relative' }}
            >
              <IconImages />
              {shots.length > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 1,
                    right: 1,
                    minWidth: 15,
                    height: 15,
                    padding: '0 3px',
                    borderRadius: 999,
                    background: 'var(--primary, #4fe5b0)',
                    color: 'var(--accent-ink, #04140e)',
                    fontSize: 10,
                    fontWeight: 800,
                    display: 'grid',
                    placeItems: 'center',
                    lineHeight: 1,
                  }}
                >
                  {shots.length}
                </span>
              )}
            </button>
            <button
              className="noir-icon-btn"
              data-tip={fs ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
              onClick={toggleFs}
            >
              {fs ? <IconShrink /> : <IconExpand />}
            </button>
            <button
              className="noir-icon-btn"
              data-tip="Presenter — new tab (P)"
              onClick={openPresenter}
            >
              <IconPresent />
            </button>
          </div>
        </div>

        {portrait && (
          <div
            data-capture-exclude
            style={{
              position: 'fixed',
              left: '50%',
              bottom: 86,
              transform: 'translateX(-50%)',
              zIndex: 80,
              padding: '7px 16px',
              borderRadius: 999,
              background: 'rgba(28,28,30,0.72)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#c7c7cc',
              fontSize: 12.5,
              fontFamily: 'var(--font-body)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            기기를 가로로 돌리면 꽉 차게 보여요
          </div>
        )}
        {/* 캡처 순간 확인 플래시 (캡처 이후에 뜨므로 이미지에는 안 담긴다) */}
        {shotFlash && (
          <div
            data-capture-exclude
            aria-hidden
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 300,
              background: 'rgba(255,255,255,0.16)',
              pointerEvents: 'none',
            }}
          />
        )}
        {/* 노트 영역 — 현재 슬라이드에 보이는 것만 */}
        {noteRegions
          .filter((n) => n.slide === slide && n.visible)
          .map((n) => (
            <NoteBox
              key={n.id}
              note={n}
              active={activeNoteId === n.id}
              tool={annTool}
              color={annColor}
              size={annSize}
              onChange={(patch) => patchNote(n.id, patch)}
              onHide={() => {
                patchNote(n.id, { visible: false });
                if (activeNoteId === n.id) {
                  setActiveNoteId(null);
                  setDrawing(false);
                }
              }}
              onActivate={() => activateNote(n.id)}
            />
          ))}
        <NotesRail
          open={notesOpen}
          notes={noteRegions}
          onClose={() => setNotesOpen(false)}
          onAdd={addNote}
          onShow={showNote}
          onDelete={(id) => setNoteRegions((ns) => ns.filter((n) => n.id !== id))}
        />
        <ShotsRail
          open={shotsOpen}
          shots={shots}
          onClose={() => setShotsOpen(false)}
          onOpenShot={(s) => setShotView(s)}
          onDelete={(i) => setShots((ss) => ss.filter((_, idx) => idx !== i))}
        />
        {shotView && (
          <ShotModal shot={shotView} onClose={() => setShotView(null)} />
        )}
        {zoomMode && (
          <ZoomSelect onPick={applyZoom} onCancel={() => setZoomMode(false)} />
        )}
        {/* 확대 중 상태 표시 + 원클릭 해제 */}
        {zoom && (
          <div
            data-capture-exclude
            style={{
              position: 'fixed',
              top: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 97,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '7px 8px 7px 16px',
              borderRadius: 999,
              background: 'rgba(28,28,30,0.8)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#e8e8ea',
              fontSize: 12.5,
              fontFamily: 'var(--font-body)',
              whiteSpace: 'nowrap',
            }}
          >
            {zoom.s.toFixed(1)}× 확대 중
            <button
              onClick={() => setZoom(null)}
              style={{
                border: 'none',
                borderRadius: 999,
                padding: '4px 12px',
                background: 'var(--accent, #4fe5b0)',
                color: 'var(--accent-ink, #04140e)',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              해제 (Z)
            </button>
          </div>
        )}
      </div>
    </MotionConfig>
  );
}
