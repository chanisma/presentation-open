import { useEffect } from 'react';
import type { DeckMeta } from '../decks/registry';

/* ── LiveBridge — React 덱용 라이브 레이어 어댑터 ─────────────────────
   레거시 덱의 live.js(진입점)와 동일한 역할을 React 덱에서 수행한다.
   원칙은 두 층 모두 "무수정":
     · 덱 엔진(src/deck/)은 건드리지 않는다 — 슬라이드 추적은 엔진이
       항상 송신하는 BroadcastChannel('deck-sync') 상태를 구독한다.
     · 라이브 런타임(live/runtime/*)도 번들하지 않고 서빙 URL에서
       동적 import한다. 번들에 넣으면 import.meta.url 기반 경로
       (vendor/qrcode, join URL)가 전부 깨지기 때문. 이 방식이면
       레거시 덱과 React 덱이 문자 그대로 같은 코드를 실행한다.

   문항 소스: **수업 폴더의 quiz.json** — 네이티브 덱은 DeckMeta.quizJson이
   가리키는 경로(deck.tsx 옆), 레거시 덱은 index.html 옆. 즉 덱 유형과
   무관하게 "수업 폴더에 문항이 함께 산다"는 한 가지 규칙만 있다.
   { "version": 1, "activities": [ { "id", "slide": 숫자|"last"|생략, "kind", "prompt", … } ] } */

type ActivityDef = {
  slideKey: string;
  slideIndex: number | null;
  kind: string;
  prompt: string;
  config: Record<string, unknown>;
};

type Channel = {
  ok: boolean;
  send(payload?: Record<string, unknown>): void;
  close(): void;
};

type Driver = {
  resumeSession(
    code: string,
    hostToken: string
  ): Promise<{ sessionId: string; status: string }>;
  setSlide(sessionId: string, hostToken: string, idx: number): Promise<unknown>;
  connectChannel(
    code: string,
    onPing: (p: Record<string, unknown>) => void
  ): Promise<Channel>;
};

type OverlayApi = {
  onSlideChange(idx: number): void;
  refreshSoon(): void;
  onLiveEvent(p: unknown): void;
};

function banner(msg: string) {
  const el = document.createElement('div');
  el.style.cssText =
    'position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:100000;' +
    'background:#b91c1c;color:#fff;padding:10px 18px;border-radius:10px;' +
    "font-family:'Noto Sans KR',sans-serif;font-size:14px;box-shadow:0 4px 14px rgba(0,0,0,.35)";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 8000);
}

/* 레거시 뷰어(?legacy=)에서 쓰는 문항 소스 — 수업 폴더의 quiz.json */
export type LegacySource = { path: string; slides: number };

async function loadActivities(
  src: { quizJson: string; slides: number },
  url: (p: string) => string
): Promise<ActivityDef[]> {
  if (!src.quizJson) return [];   // 문항이 없는 덱 — 발표만 하는 라이브 세션
  try {
    const res = await fetch(url(src.quizJson));
    if (!res.ok) return [];
    const data = await res.json();
    const raw: Record<string, unknown>[] = Array.isArray(data.activities)
      ? data.activities
      : [];
    return raw
      .map((a) => {
        const { id, slide, kind, prompt, ...config } = a;
        let slideIndex: number | null = null;
        if (slide === 'last') slideIndex = src.slides - 1;
        else if (Number.isInteger(slide)) slideIndex = slide as number;
        return {
          slideKey: String(id ?? ''),
          slideIndex,
          kind: String(kind ?? ''),
          prompt: typeof prompt === 'string' ? prompt : '',
          config,
        };
      })
      .filter((d) => d.slideKey && d.kind && d.prompt);
  } catch (e) {
    console.warn('[live] 문항 로드 실패:', (e as Error).message);
    return [];
  }
}

export default function LiveBridge({
  deck,
  legacy,
  code,
}: {
  deck?: DeckMeta;
  legacy?: LegacySource;
  code: string;
}) {
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    // 학생은 join 페이지를 사용 — 덱 위 레이어는 호스트 모드만
    if (params.get('host') !== '1') return;

    let disposed = false;
    let channel: Channel | null = null;
    let syncChan: BroadcastChannel | null = null;
    let widgetChan: BroadcastChannel | null = null;
    const widgets = new Map<string, unknown>();
    let overlayApi: OverlayApi | null = null;
    let slideTimer: ReturnType<typeof setTimeout> | undefined;

    const liveCode = code.trim().toUpperCase();
    const url = (p: string) => new URL(p, document.baseURI).href;

    (async () => {
      const cfg = await import(/* @vite-ignore */ url('live/runtime/config.js'));
      const saved = cfg.loadHostSession(liveCode) as {
        hostToken?: string;
      } | null;
      if (!saved?.hostToken) {
        banner(
          `세션 ${liveCode}의 호스트 정보가 이 브라우저에 없습니다. 교사 콘솔(live/host/)에서 세션을 열어주세요.`
        );
        return;
      }

      const { createDriver } = await import(
        /* @vite-ignore */ url('live/runtime/driver.js')
      );
      const driver: Driver = await createDriver();
      const session = await driver.resumeSession(liveCode, saved.hostToken);
      if (disposed) return;
      if (session.status === 'ended') {
        banner('이미 종료된 세션입니다. 교사 콘솔에서 새 세션을 만들어주세요.');
        return;
      }

      // 둘 다 "수업 폴더의 quiz.json" — 네이티브는 registry가 경로를 들고 있고,
      // 레거시는 index.html 경로에서 파일명만 갈아끼운다
      const src = deck
        ? { quizJson: deck.quizJson ?? '', slides: deck.slides }
        : { quizJson: legacy!.path.replace(/[^/]*$/, '') + 'quiz.json', slides: legacy!.slides };
      const activities = await loadActivities(src, url);
      const liveSlides = new Map(
        activities
          .filter((d) => Number.isInteger(d.slideIndex))
          .map((d) => [d.slideIndex as number, d])
      );

      channel = await driver.connectChannel(liveCode, (p) => {
        overlayApi?.onLiveEvent(p);
      });
      if (disposed) {
        channel.close();
        return;
      }

      const { mountHostOverlay } = await import(
        /* @vite-ignore */ url('live/runtime/host-overlay.js')
      );
      if (disposed) {
        channel.close();
        return;
      }
      overlayApi = mountHostOverlay({
        driver,
        code: liveCode,
        sessionId: session.sessionId,
        hostToken: saved.hostToken,
        liveSlides,
        activities,
        channel,
      }) as OverlayApi;

      // 슬라이드 동기화 — 엔진이 상태 변경마다 송신하는 deck-sync 구독.
      // (같은 탭의 다른 BroadcastChannel 인스턴스도 메시지를 수신한다)
      const chan = channel;
      const hostToken = saved.hostToken;
      let lastIndex = -1;
      let lastClicks = -1;
      // 연타 시 브로드캐스트가 순서 역전되어 도착할 수 있다 — 수신 측이
      // 옛 핑을 버릴 수 있도록 단조 증가 seq를 동봉 (Date.now 기반이라
      // 호스트 새로고침 후에도 계속 증가)
      let slideSeq = 0;
      const apply = (idx: number, clicks = 0) => {
        if (idx < 0) return;
        const slideChanged = idx !== lastIndex;
        if (!slideChanged && clicks === lastClicks) return;
        lastIndex = idx;
        lastClicks = clicks;
        slideSeq = Math.max(slideSeq + 1, Date.now());
        // 학생 미러는 즉시 — 빌드 단계(clicks)까지 동봉해 슬라이드 안에서
        // 하나씩 열리는 요소도 따라가게 한다
        chan.send({ type: 'slide', index: idx, clicks, seq: slideSeq });
        if (slideChanged) {
          // 늦게 들어온 학생도 슬라이드 안 위젯 상태를 받도록 슬라이드가 바뀔 때 다시 보낸다
          widgets.forEach((state, id) => chan.send({ type: 'widget', id, state }));
          // DB 반영(재접속 복구용)만 디바운스 — 슬라이드 단위
          clearTimeout(slideTimer);
          slideTimer = setTimeout(() => {
            driver.setSlide(session.sessionId, hostToken, idx).catch(() => {
              /* 비필수 */
            });
          }, 400);
          overlayApi?.onSlideChange(idx);
        }
      };
      // 슬라이드 안 위젯 상태(덱이 'deck-widget'으로 송신 — 예: 업다운 게임) → 학생 미러
      widgetChan = new BroadcastChannel('deck-widget');
      widgetChan.onmessage = (e) => {
        const d = e.data;
        if (d?.type !== 'widget' || typeof d.id !== 'string' || !d.state) return;
        widgets.set(d.id, d.state);
        chan.send({ type: 'widget', id: d.id, state: d.state });
      };
      syncChan = new BroadcastChannel('deck-sync');
      syncChan.onmessage = (e) => {
        if (e.data?.type === 'state' && Number.isInteger(e.data.slide))
          apply(e.data.slide, Number.isInteger(e.data.clicks) ? e.data.clicks : 0);
      };
      // 초기 슬라이드: 엔진이 이미 hash(#n, 1-based)를 소유하고 있다
      const h = parseInt(location.hash.slice(1), 10);
      apply(Number.isInteger(h) && h >= 1 ? h - 1 : 0);
    })().catch((e: Error) => {
      console.error('[live] 초기화 실패:', e);
      banner('라이브 세션 연결 실패: ' + e.message);
    });

    return () => {
      disposed = true;
      clearTimeout(slideTimer);
      syncChan?.close();
      widgetChan?.close();
      channel?.close();
      document
        .querySelectorAll('.lp-hud, .lp-seg, .lp-question, .lp-result')
        .forEach((el) => el.remove());
    };
  }, [deck, legacy, code]);

  return null;
}
