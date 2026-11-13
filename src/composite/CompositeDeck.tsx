import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Deck from '../deck/Deck';
import Slide from '../deck/Slide';
import Build from '../deck/Build';
import KenBurns from '../components/KenBurns';
import HtmlSlide from '../components/HtmlSlide';
import LiveBridge from '../live/LiveBridge';
import { Scene, useSceneTime, riseIn } from '../scene';

/* ── CompositeDeck — deck.json 매니페스트로 엮는 선언적 혼합 덱 ────────
   ?composite=<data/…/deck.json> 라우트. 코드 배포 없이 JSON만으로
   여러 소스(타이틀·NotebookLM 이미지·불릿·레거시 HTML)를 하나의 bolt
   덱으로 시퀀싱한다. 혼합 덱 연구의 옵션 C.

   매니페스트 스키마 v1 (경로는 모두 매니페스트 파일 기준 상대):
   {
     "title": "탭 제목", "favicon": "🧩",
     "theme": { "--bg": "…", "--primary": "…", … },   // 선택
     "segments": [
       { "type": "title",  "kicker"?, "title", "lead"?, "nav"?, "notes"? },
       { "type": "images", "src"?: "images", "pages": [1,2,4],
         "captions"?: [ {kicker?,title?,body?} | null, … ],   // pages와 짝
         "nav"?, "notes"? },                                  // → 쪽당 1슬라이드
       { "type": "bullets", "kicker"?, "title", "items": ["…"], "nav"?, "notes"? },
       { "type": "html",   "src", "page"?, "nav"?, "notes"? } // 니치 — 활동지 등
     ]
   }
   images는 <src>/slide-NN.png (NotebookLM 파이프라인 규약, NN은 pages의
   숫자를 2자리 패딩). 라이브 문항은 레거시 덱과 동일하게 매니페스트 옆
   quiz.json — LiveBridge의 legacy 소스 규약을 그대로 탄다.

   프레젠터 복구: ?presenter=1 탭은 composite 파라미터 없이 열리므로
   localStorage('composite:current')에 경로를 남긴다 (App.tsx가 판독). */

type Caption = { kicker?: string; title?: string; body?: string };
type Segment =
  | { type: 'title'; kicker?: string; title: string; lead?: string; nav?: string; notes?: string }
  | { type: 'bullets'; kicker?: string; title: string; items: string[]; nav?: string; notes?: string }
  | {
      type: 'images';
      src?: string;
      pages: number[];
      captions?: (Caption | null)[];
      nav?: string;
      notes?: string;
    }
  | { type: 'html'; src: string; page?: number; nav?: string; notes?: string };

type Manifest = {
  title?: string;
  favicon?: string;
  theme?: Record<string, string>;
  segments: Segment[];
};

function setFavicon(emoji: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${emoji}</text></svg>`;
}

/* 이미지 슬라이드의 캡션 — Scene 안에서 t 스프링으로 떠오른다 */
function ImageCaption({ c }: { c: Caption }) {
  const t = useSceneTime();
  return (
    <div
      style={{
        position: 'absolute',
        left: 'clamp(24px,5vw,72px)',
        right: 'clamp(24px,5vw,72px)',
        bottom: 'clamp(24px,6vh,56px)',
        textShadow: '0 1px 14px rgba(5,7,10,0.85)',
      }}
    >
      {c.kicker && (
        <div className="kicker" style={{ color: '#ffd9a8', ...riseIn(t, 0.2) }}>
          {c.kicker}
        </div>
      )}
      {c.title && (
        <h2
          className="headline"
          style={{ margin: '10px 0 8px', wordBreak: 'keep-all', ...riseIn(t, 0.45) }}
        >
          {c.title}
        </h2>
      )}
      {c.body && (
        <p
          className="lead"
          style={{ maxWidth: 720, fontSize: 'clamp(14px,1.7vw,17px)', ...riseIn(t, 0.7) }}
        >
          {c.body}
        </p>
      )}
    </div>
  );
}

function expand(m: Manifest, base: (p: string) => string): ReactNode[] {
  const out: ReactNode[] = [];
  m.segments.forEach((seg, si) => {
    if (seg.type === 'title') {
      out.push(
        <Slide center key={`s${si}`} nav={seg.nav ?? '타이틀'} notes={seg.notes}>
          {seg.kicker && <div className="kicker">{seg.kicker}</div>}
          <h1
            className="display"
            style={{ margin: '14px auto', wordBreak: 'keep-all' }}
          >
            {seg.title}
          </h1>
          {seg.lead && (
            <p className="lead" style={{ marginInline: 'auto' }}>
              {seg.lead}
            </p>
          )}
        </Slide>
      );
    } else if (seg.type === 'images') {
      seg.pages.forEach((n, pi) => {
        const cap = seg.captions?.[pi] ?? null;
        const file = base(`${seg.src ?? 'images'}/slide-${String(n).padStart(2, '0')}.png`);
        out.push(
          <Slide
            full
            key={`s${si}p${n}`}
            nav={`${seg.nav ?? '이미지'} ${pi + 1}`}
            notes={seg.notes}
          >
            <Scene>
              <KenBurns src={file} flip={pi % 2 === 1} />
              {cap && (
                <>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'linear-gradient(to top, rgba(5,7,10,0.92) 0%, rgba(5,7,10,0.6) 26%, transparent 58%)',
                    }}
                  />
                  <ImageCaption c={cap} />
                </>
              )}
            </Scene>
          </Slide>
        );
      });
    } else if (seg.type === 'bullets') {
      out.push(
        <Slide center key={`s${si}`} nav={seg.nav ?? seg.title} notes={seg.notes}>
          {seg.kicker && <div className="kicker">{seg.kicker}</div>}
          <h2
            className="headline"
            style={{ margin: '10px auto 18px', wordBreak: 'keep-all' }}
          >
            {seg.title}
          </h2>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              width: 'min(680px, 92%)',
              marginInline: 'auto',
            }}
          >
            {seg.items.map((line, i) => (
              <Build key={i} at={i + 1}>
                <div
                  className="mat"
                  style={{
                    padding: '14px 22px',
                    borderRadius: 14,
                    display: 'flex',
                    gap: 14,
                    alignItems: 'center',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      color: 'var(--primary)',
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ color: 'var(--fg)', fontSize: 'clamp(14px,1.7vw,17px)' }}>
                    {line}
                  </span>
                </div>
              </Build>
            ))}
          </div>
        </Slide>
      );
    } else if (seg.type === 'html') {
      out.push(
        <HtmlSlide
          key={`s${si}`}
          src={base(seg.src)}
          page={seg.page}
          nav={seg.nav ?? 'HTML'}
          notes={seg.notes}
        />
      );
    }
  });
  return out;
}

export default function CompositeDeck({ path }: { path: string }) {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const manifestUrl = useMemo(() => new URL(path, document.baseURI).href, [path]);
  const liveCode = useMemo(
    () => new URLSearchParams(location.search).get('live'),
    []
  );

  useEffect(() => {
    let gone = false;
    (async () => {
      try {
        const res = await fetch(manifestUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as Manifest;
        if (!Array.isArray(data.segments) || data.segments.length === 0)
          throw new Error('segments가 비어 있습니다');
        if (!gone) setManifest(data);
      } catch (e) {
        if (!gone) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      gone = true;
    };
  }, [manifestUrl]);

  // 탭 제목·파비콘·테마 + 프레젠터 복구 정보 (App의 네이티브 덱 처리와 동일 규약)
  useEffect(() => {
    if (!manifest) return;
    try {
      localStorage.setItem(
        'composite:current',
        JSON.stringify({ path, at: Date.now() })
      );
    } catch {
      /* 무시 */
    }
    document.title = manifest.title ?? '컴포지트 덱';
    setFavicon(manifest.favicon ?? '🧩');
    const root = document.documentElement;
    const theme = manifest.theme;
    if (theme)
      for (const [k, v] of Object.entries(theme)) root.style.setProperty(k, v);
    return () => {
      if (theme) for (const k of Object.keys(theme)) root.style.removeProperty(k);
    };
  }, [manifest, path]);

  const slides = useMemo(
    () =>
      manifest
        ? expand(manifest, (p) => new URL(p, manifestUrl).href)
        : [],
    [manifest, manifestUrl]
  );

  if (error)
    return (
      <div
        style={{
          position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 8,
          color: 'var(--fg-muted)', fontFamily: 'var(--font-body)', fontSize: 14,
        }}
      >
        <div>컴포지트 매니페스트를 불러오지 못했습니다: {error}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{path}</div>
      </div>
    );
  if (!manifest)
    return (
      <div
        style={{
          position: 'fixed', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: 'var(--fg-muted)',
          fontFamily: 'var(--font-body)', fontSize: 14,
        }}
      >
        수업 구성을 불러오는 중…
      </div>
    );
  return (
    <>
      <Deck>{slides}</Deck>
      {liveCode && (
        <LiveBridge code={liveCode} legacy={{ path, slides: slides.length }} />
      )}
    </>
  );
}
