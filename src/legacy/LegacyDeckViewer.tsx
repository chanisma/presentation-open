import { useEffect, useMemo, useRef, useState } from 'react';
import Deck from '../deck/Deck';
import Slide from '../deck/Slide';
import { useDeck } from '../deck/DeckContext';
import LiveBridge from '../live/LiveBridge';

/* ── 레거시 HTML 덱 뷰어 — 진짜 bolt 엔진으로 HTML 수업을 컨트롤 ──────
   ?legacy=<data/…/index.html> 라우트.

   구조 (엔진 무수정):
   · 실제 <Deck> 엔진이 독·레일·그리드·주석·프레젠터 등 모든 크롬을 소유.
     슬라이드 자리는 투명 자리표시자 — 실제 화면은 아래 iframe이 담당.
   · 콘텐츠 iframe(z=40)은 스테이지(z auto) 위, 크롬(주석 88 · 그리드 89 ·
     독 90 · 프레젠터 92 · 레일 95) 아래 — 상호작용(코드 에디터 등) 보존.
   · 동기화: 엔진이 상태 변경마다 송신하는 deck-sync 브로드캐스트를 구독해
     iframe의 .slide.active를 토글(미러와 동일 기법). 컨트랙트 덱은
     reconcile 관찰자가 자기 컨트롤러를 함께 맞춘다.
   · iframe 내부의 자체 키보드/휠 내비와 주입 크롬은 무장 해제:
     ?chrome=0 + 캡처 단계 키 포워딩(부모 엔진으로 전달).
   · 레일/그리드 썸네일: 자리표시자가 isStatic(썸네일 컨텍스트)일 때만
     슬라이드별 미니 iframe 스냅샷을 렌더. */

const FWD_KEYS = new Set([
  'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', ' ', 'PageUp', 'PageDown',
  'Home', 'End', 'Escape', 'g', 'G', 'f', 'F', 'h', 'H', 's', 'S', 'a', 'A', 'p', 'P',
]);

function LegacyThumb({ url, i }: { url: string; i: number }) {
  const { isStatic } = useDeck();
  const ref = useRef<HTMLIFrameElement | null>(null);
  // 덱 자체 초기화 스크립트·iframe 재생성과의 경합이 있어, 마운트 동안
  // 주기적으로 i쪽 활성 상태를 강제해 수렴시킨다 (load 1회 토글로는 불충분)
  useEffect(() => {
    if (isStatic === false) return;
    const enforce = () => {
      try {
        ref.current?.contentDocument
          ?.querySelectorAll('.slide')
          .forEach((s, k) => s.classList.toggle('active', k === i));
      } catch {
        /* 접근 불가 시 다음 틱에서 재시도 */
      }
    };
    enforce();
    const t = setInterval(enforce, 700);
    return () => clearInterval(t);
  }, [i, isStatic]);
  if (!isStatic) return null; // 라이브 스테이지에서는 투명 — 콘텐츠는 아래 iframe
  return (
    <iframe
      ref={ref}
      src={url}
      title={`${i + 1}쪽 미리보기`}
      loading="lazy"
      style={{ width: '100%', height: '100%', border: 0, pointerEvents: 'none' }}
    />
  );
}

export default function LegacyDeckViewer({ path }: { path: string }) {
  const [n, setN] = useState(0);
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const lastIdxRef = useRef(-1);
  const liveCode = useMemo(
    () => new URLSearchParams(location.search).get('live'),
    []
  );

  const contentUrl = useMemo(() => {
    const u = new URL(path, document.baseURI);
    u.searchParams.set('chrome', '0'); // iframe 내부 자체 크롬 억제
    return u.href;
  }, [path]);

  const sync = (idx: number) => {
    if (idx === lastIdxRef.current) return;
    try {
      const doc = frameRef.current?.contentDocument;
      if (!doc) return;
      const slides = doc.querySelectorAll('.slide');
      if (!slides.length) return;
      const clamped = Math.max(0, Math.min(slides.length - 1, idx));
      lastIdxRef.current = clamped;
      slides.forEach((s, k) => s.classList.toggle('active', k === clamped));
    } catch {
      /* 다음 동기화에서 재시도 */
    }
  };

  // 엔진 상태 구독 (같은 탭의 다른 BroadcastChannel 인스턴스도 수신)
  useEffect(() => {
    const chan = new BroadcastChannel('deck-sync');
    chan.onmessage = (e) => {
      if (e.data?.type === 'state' && Number.isInteger(e.data.slide))
        sync(e.data.slide);
    };
    return () => chan.close();
  }, []);

  // 프레젠터 모드(?presenter=1)는 legacy 파라미터 없이 열리므로 복구 정보 저장
  useEffect(() => {
    try {
      localStorage.setItem(
        'viewer:legacy',
        JSON.stringify({ path, at: Date.now() })
      );
    } catch {
      /* 무시 */
    }
  }, [path]);

  const onLoad = () => {
    const frame = frameRef.current;
    try {
      const doc = frame?.contentDocument;
      if (!doc) return;
      const count = doc.querySelectorAll('.slide').length;
      if (doc.title) document.title = doc.title;
      // 키 입력을 부모 엔진으로 포워딩 + iframe 자체 내비 무력화 (캡처가 버블보다 먼저)
      doc.addEventListener(
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
      // 휠 내비 무력화 — 콘텐츠 스크롤은 자연 동작 (bolt은 휠 내비 없음)
      doc.addEventListener('wheel', (e) => e.stopImmediatePropagation(), {
        capture: true,
        passive: true,
      });
      // 역방향 동기화 — 덱 자체 내비 UI(NotebookLM 화살표 등)로 넘긴 경우
      // 부모 hash를 갱신해 엔진이 따라오게 한다 (엔진 hashchange 수신).
      // 우리 sync()의 토글은 lastIdxRef와 일치하므로 루프 없음.
      const back = new MutationObserver(() => {
        try {
          const slides2 = doc.querySelectorAll('.slide');
          const idx = [...slides2].findIndex((s) => s.classList.contains('active'));
          if (idx >= 0 && idx !== lastIdxRef.current) {
            lastIdxRef.current = idx;
            location.hash = '#' + (idx + 1);
          }
        } catch {
          /* 무시 */
        }
      });
      doc.querySelectorAll('.slide').forEach((s) =>
        back.observe(s, { attributes: true, attributeFilter: ['class'] })
      );
      lastIdxRef.current = -1;
      const h = parseInt(location.hash.slice(1), 10);
      sync(Number.isInteger(h) && h >= 1 ? h - 1 : 0);
      if (count >= 2) {
        setN(count);
      } else {
        // 슬라이드가 없는 문서·활동지가 잘못 들어온 경우(미분류 항목 안전망):
        // 비동기 렌더 덱 대비 한 박자 재확인 후, 그래도 없으면 원본으로 전환
        setTimeout(() => {
          try {
            const n2 = frame?.contentDocument?.querySelectorAll('.slide').length ?? 0;
            if (n2 >= 2) setN(n2);
            else location.replace(new URL(path, document.baseURI).href);
          } catch {
            location.replace(new URL(path, document.baseURI).href);
          }
        }, 900);
      }
    } catch {
      /* 접근 불가 — 동일 출처가 아니면 뷰어를 쓸 수 없음 */
    }
  };

  return (
    <>
      <iframe
        ref={frameRef}
        src={contentUrl}
        title="수업 콘텐츠"
        onLoad={onLoad}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          border: 0,
          zIndex: 40, // 스테이지 위 · 크롬(88+) 아래
          background: '#05070a',
        }}
      />
      {n === 0 && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 41, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--fg-muted)', fontFamily: 'var(--font-body)',
            background: 'var(--bg)', fontSize: 14,
          }}
        >
          수업 자료를 불러오는 중…
        </div>
      )}
      {n > 0 && (
        <Deck>
          {Array.from({ length: n }, (_, i) => (
            <Slide full key={i} nav={`${i + 1}쪽`}>
              <LegacyThumb url={contentUrl} i={i} />
            </Slide>
          ))}
        </Deck>
      )}
      {liveCode && n > 0 && (
        <LiveBridge code={liveCode} legacy={{ path, slides: n }} />
      )}
    </>
  );
}
