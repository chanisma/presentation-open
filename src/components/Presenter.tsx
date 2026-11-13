import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useDeck } from '../deck/DeckContext';

/* ── Presenter — 슬라이드를 설명하는 가상 발표자 영상 오버레이 ──
   deck-narration-builder 스킬의 덱 쪽 부품. 클릭 단계마다 영상 한 편:
   n번째 클릭 뒤에 <media>/sNN-stepK.{webm,png}(배경 투명) 또는 .{mp4,jpg}(배경 있음)를 튼다.

   영상은 용량 때문에 git에 넣지 않는다 — 저장소 루트의 presenter-media/(gitignore)에 두면 dev 서버가
   /presenter-media/로 그대로 서빙한다(Range 지원). 다른 곳에 두면 VITE_PRESENTER_BASE로 주소를 넘긴다.
   배포본에는 영상이 없으므로(build-static TARGETS 밖) 발표자만 숨는다.
   URL에 ?cast=<id>를 붙이면 다른 캐스트(인물·목소리) 폴더 <media>-<id>를 쓴다.
   영상이 없거나 서버가 꺼져 있으면 조용히 숨는다. × 버튼으로 끄고 켠다(브라우저에 기억).
   사파리는 VP9 알파(투명 WebM)를 못 틀어 둥근 창 mp4로 대신한다.
   isStatic(썸네일·그리드)에서는 포스터만 — 격자가 영상을 내려받지 않게.

   위치·단계 수의 원천은 자료 폴더의 presenter/narration.json:
     { "overlay": { "media": "<폴더>", "default": {x,y,w}, "slides": { "10": {x,y,w} } },
       "slides": { "1": [{ "step": 0, "text": "…" }], … } }
   덱에서는 presenterFor(narration, n)로 props를 만든다. */

type Box = { x: number; y: number; w: number };
export type NarrationStep = { step: number; text: string };
export type Narration = {
  overlay?: { media: string; default: Box; slides?: Record<string, Partial<Box>>; size?: number[] };
  slides: Record<string, NarrationStep[]>;
};
export type PresenterProps = Box & { steps: string[]; mode?: 'card' | 'cutout'; aspect?: number };

const BASE = String(import.meta.env.VITE_PRESENTER_BASE ?? '/presenter-media').replace(/\/$/, '');
const HIDDEN_KEY = 'presenter:hidden';

/** ?cast=<id> → 폴더 접미사 "-<id>" (영문·숫자·-_만) */
function castSuffix(): string {
  try {
    const c = new URLSearchParams(window.location.search).get('cast');
    return c && /^[\w-]+$/.test(c) ? `-${c}` : '';
  } catch {
    return '';
  }
}

/** narration.json에서 n번째 슬라이드의 발표자 props — 대본이나 overlay가 없으면 null */
export function presenterFor(nar: Narration, slide: number): PresenterProps | null {
  const ov = nar.overlay;
  const segs = nar.slides[String(slide)];
  if (!ov || !segs?.length) return null;
  const box = { ...ov.default, ...(ov.slides?.[String(slide)] ?? {}) };
  const dir = `${BASE}/${ov.media}${castSuffix()}`;
  const nn = String(slide).padStart(2, '0');
  const [fw, fh] = ov.size?.length === 2 ? ov.size : [576, 704];
  return { ...box, aspect: fh / fw, steps: segs.map((_, k) => `${dir}/s${nn}-step${k}`) };
}

/** VP9 알파(투명 WebM)를 재생할 수 있는가 — 사파리는 못 한다 */
function canPlayAlphaWebm() {
  if (typeof navigator === 'undefined' || typeof document === 'undefined') return false;
  const ua = navigator.userAgent;
  const safari = /Safari\//.test(ua) && !/Chrome|Chromium|Edg\//.test(ua);
  return !safari && document.createElement('video').canPlayType('video/webm; codecs="vp9"') !== '';
}

/** card: 둥근 창 / cutout: 배경 없이 슬라이드 위에 선다(사파리는 card로 대체). 좌표는 덱 설계 박스 기준 px */
export function Presenter({ steps, x, y, w, mode = 'cutout', aspect = 704 / 576 }: PresenterProps) {
  const { clicks, isStatic } = useDeck();
  const step = Math.min(clicks, steps.length - 1);
  const ref = useRef<HTMLVideoElement>(null);
  const [alphaOk] = useState(canPlayAlphaWebm);
  const [missing, setMissing] = useState(false);
  const cut = mode === 'cutout' && alphaOk;
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(HIDDEN_KEY) === '1';
    } catch {
      return false;
    }
  });
  const h = Math.round(w * aspect);
  useEffect(() => {
    const v = ref.current;
    if (!v || isStatic || hidden) return;
    v.load();
    v.play().catch(() => {});
  }, [step, isStatic, hidden, cut]);
  const toggle = () => {
    const nv = !hidden;
    setHidden(nv);
    try {
      localStorage.setItem(HIDDEN_KEY, nv ? '1' : '0');
    } catch {
      /* 저장 불가 환경 */
    }
  };
  if (missing || !steps.length) return null;
  const base = steps[step];
  const poster = base + (cut ? '.png' : '.jpg');
  const src = base + (cut ? '.webm' : '.mp4');
  const box: CSSProperties = { position: 'absolute', left: x, top: y, width: w, height: h, zIndex: 20 };
  if (hidden)
    return (
      <button
        data-capture-exclude
        onClick={toggle}
        style={{ position: 'absolute', left: x + w - 150, top: y + h - 48, width: 150, height: 40, zIndex: 20, borderRadius: 99, border: '1px solid var(--hair)', background: 'var(--surface)', fontSize: 16, color: 'var(--fg-muted)', cursor: 'pointer' }}
      >
        발표자 보기
      </button>
    );
  const frame: CSSProperties = cut
    ? { ...box, filter: 'drop-shadow(0 14px 22px rgba(22,32,27,.16))' }
    : { ...box, borderRadius: 18, overflow: 'hidden', boxShadow: '0 18px 44px -20px rgba(22,32,27,.55)', border: '3px solid var(--surface)', background: 'var(--surface)' };
  const media: CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' };
  return (
    <div style={frame}>
      {isStatic ? (
        <img src={poster} alt="발표자" style={media} onError={() => setMissing(true)} />
      ) : (
        <video ref={ref} src={src} poster={poster} playsInline preload="auto" style={media} onError={() => setMissing(true)} />
      )}
      {!isStatic && (
        <button
          data-capture-exclude
          onClick={toggle}
          title="발표자 끄기"
          style={{ position: 'absolute', right: cut ? 40 : 8, top: 8, width: 30, height: 30, borderRadius: 15, border: 'none', background: 'rgba(22,32,27,.45)', color: '#fff', fontSize: 16, cursor: 'pointer', lineHeight: '30px' }}
        >
          ×
        </button>
      )}
    </div>
  );
}
