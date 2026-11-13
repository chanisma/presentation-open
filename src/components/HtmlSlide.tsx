import { useEffect, useMemo, useRef } from 'react';
import type { CSSProperties } from 'react';
import { useDeck } from '../deck/DeckContext';

/* ── HtmlSlide / HtmlIsland — 같은 출처 레거시 HTML을 네이티브 덱 안에 ──
   레거시 HTML 덱의 특정 쪽(또는 활동지·문서 전체)을 React 슬라이드에 장착.

     <HtmlSlide  src="data/…/index.html" page={1} nav="…" />  통짜 슬라이드
     <HtmlIsland src="data/…/index.html" page={1} />          조각 — 레이아웃 안에

   pinned 모드 (page 지정, 0-based — quiz.json의 slide와 동일 기준):
   · ?chrome=0 으로 폴백 독 주입 억제 (LegacyDeckViewer와 동일)
   · .slide.active를 대상 쪽으로 강제하고, MutationObserver가 이탈 즉시
     복원한다 — 컨트랙트 덱(live/runtime/deck.js)은 자체 reconcile 관찰자가
     내부 컨트롤러를 함께 맞추므로 상태 불일치가 없다. 주기 인터벌은
     슬라이드 노드 교체에 대비한 안전망(재관찰 포함).
   · 임베드 덱의 자체 내비 UI는 주입 CSS로 숨긴다 — 기본 셀렉터는 이
     저장소 레거시 덱 규약(.nav-btn·.counter), hide 프롭으로 교체 가능.
   · 내비 키는 캡처 단계에서 부모 엔진으로 포워딩 — 포커스가 iframe 안에
     있어도 호스트 덱 진행이 끊기지 않는다. 휠 내비도 무장 해제.

   free 모드 (page 미지정): 아무 개입 없음 — 활동지·문서·자유 탐색 임베드용.
   썸네일(isStatic)에서는 상호작용을 끈다. 다른 출처(cross-origin) URL은
   contentDocument 접근이 막혀 pinned 모드가 동작하지 않는다. */

const FWD_KEYS = new Set([
  'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', ' ', 'PageUp', 'PageDown',
  'Home', 'End', 'Escape', 'g', 'G', 'f', 'F', 'h', 'H', 's', 'S', 'a', 'A', 'p', 'P',
]);

// 이 저장소 레거시 덱들의 내비 UI 규약: .nav-btn/.counter(공용 템플릿),
// .index-toggle/.index-panel(NotebookLM 계열 쪽 픽커)
const DEFAULT_HIDE = ['.nav-btn', '.counter', '.index-toggle', '.index-panel'];

export function HtmlIsland({
  src,
  page,
  title,
  hide = DEFAULT_HIDE,
  style,
}: {
  src: string;
  /** 고정할 쪽 (0-based). 생략하면 자유 섬 — 개입 없음 */
  page?: number;
  title?: string;
  /** pinned 모드에서 숨길 임베드 덱 자체 UI 셀렉터 */
  hide?: string[];
  style?: CSSProperties;
}) {
  const { isStatic } = useDeck();
  const ref = useRef<HTMLIFrameElement | null>(null);
  const url = useMemo(() => {
    const u = new URL(src, document.baseURI);
    u.searchParams.set('chrome', '0');
    return u.href;
  }, [src]);

  useEffect(() => {
    if (page == null) return;
    const frame = ref.current;
    let observer: MutationObserver | null = null;
    let wired = false;

    const doc = () => {
      try {
        return frame?.contentDocument ?? null;
      } catch {
        return null; // cross-origin — pinned 모드 불가
      }
    };
    const enforce = () => {
      const d = doc();
      const slides = d?.querySelectorAll('.slide');
      if (slides?.length)
        slides.forEach((s, k) => s.classList.toggle('active', k === page));
    };
    // 이탈 즉시 복원 — enforce 자신의 토글은 page와 일치해 재진입하지 않는다
    const observe = () => {
      const d = doc();
      if (!d) return;
      observer?.disconnect();
      observer = new MutationObserver(() => {
        const slides = d.querySelectorAll('.slide');
        const idx = [...slides].findIndex((s) => s.classList.contains('active'));
        if (idx !== page) enforce();
      });
      d.querySelectorAll('.slide').forEach((s) =>
        observer!.observe(s, { attributes: true, attributeFilter: ['class'] })
      );
    };
    const wire = () => {
      const d = doc();
      if (!d || wired) return;
      wired = true;
      // 자체 내비 UI 숨김 (베스트 에포트 — 덱별 셀렉터는 hide로 교체)
      if (hide.length) {
        const s = d.createElement('style');
        s.textContent = `${hide.join(',')}{display:none !important}`;
        d.head?.appendChild(s);
      }
      // 내비 키 포워딩 + 자체 키 핸들러 무장 해제 (캡처가 버블보다 먼저)
      d.addEventListener(
        'keydown',
        (e) => {
          if (e.metaKey || e.ctrlKey || e.altKey) return;
          const el = e.target as HTMLElement;
          if (
            el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' ||
            el.tagName === 'SELECT' || el.isContentEditable
          )
            return;
          if (!FWD_KEYS.has(e.key)) return;
          e.preventDefault();
          e.stopImmediatePropagation();
          window.dispatchEvent(
            new KeyboardEvent('keydown', { key: e.key, bubbles: true, cancelable: true })
          );
        },
        true
      );
      // 휠 내비 무장 해제 — 콘텐츠 스크롤 자연 동작은 유지
      d.addEventListener('wheel', (e) => e.stopImmediatePropagation(), {
        capture: true,
        passive: true,
      });
    };

    const boot = () => {
      wired = false;
      wire();
      enforce();
      observe();
    };
    boot();
    frame?.addEventListener('load', boot);
    // 안전망 — 덱 자체 스크립트가 슬라이드 노드를 교체하면 관찰이 끊긴다
    const t = setInterval(() => {
      wire();
      enforce();
      observe();
    }, 1500);
    return () => {
      clearInterval(t);
      observer?.disconnect();
      frame?.removeEventListener('load', boot);
    };
  }, [page, url, hide]);

  return (
    <iframe
      ref={ref}
      src={url}
      title={title || src}
      loading="lazy"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        border: 0,
        background: '#05070a',
        pointerEvents: isStatic ? 'none' : 'auto',
        ...style,
      }}
    />
  );
}

/** 통짜 슬라이드 — <Deck>의 최상위 자식으로 사용 */
export default function HtmlSlide({
  src,
  page,
  title,
  hide,
}: {
  src: string;
  page?: number;
  title?: string;
  hide?: string[];
  nav?: string;
  notes?: string;
}) {
  return (
    <div className="slide full">
      <HtmlIsland src={src} page={page} title={title} hide={hide} />
    </div>
  );
}
