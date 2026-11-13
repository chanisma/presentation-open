import { useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { domToPng } from 'modern-screenshot';
import { IconClose } from './icons';

/* ── Capture & Zoom layer — 미니바 확장 기능의 부품들 ──────────────────
   · domShot      버튼을 누른 '그 순간'의 화면을 DOM 래스터화로 한 장 캡처.
                  화면 공유 권한도, 상단 '공유 중지' 바도, 상시 스트림
                  오버헤드도 없다. 주석 캔버스는 픽셀 그대로 포함되고
                  독/도구막대/갤러리는 filter로 제외된다.
   · TabRecorder  domShot이 실패하는 예외 상황용 폴백 — 화면 공유를 잡아
                  한 프레임만 뽑고 즉시 해제한다(oneShot).
   · ShotsRail    캡처 목록 right sidebar (좌측 noir-rail의 거울)
   · ShotModal    캡처 확대 보기 — 화면 90%, 원본 비율 유지
   · ZoomSelect   드래그로 확대 영역을 지정하는 오버레이
   base.css를 건드리지 않도록 새 UI는 전부 인라인 스타일. */

/** 현재 화면(body)을 즉시 PNG 한 장으로 — 크롬 UI는 제외 */
export async function domShot(): Promise<string> {
  return domToPng(document.body, {
    scale: Math.max(1.5, window.devicePixelRatio || 1),
    filter: (node) => {
      if (!(node instanceof Element)) return true;
      return !node.closest('[data-capture-exclude], .noir-dock, .ann-bar');
    },
  });
}

export type Shot = {
  url: string; // PNG dataURL
  slide: number; // 0-based
  label: string; // 시각 등 표시용
};

export class TabRecorder {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;

  /** 스트림 확보 (없거나 사용자가 공유를 중단했으면 다시 요청) */
  async ensure(): Promise<void> {
    if (this.stream?.active && this.video) return;
    this.dispose();
    const md = navigator.mediaDevices as MediaDevices & {
      getDisplayMedia(o?: unknown): Promise<MediaStream>;
    };
    // preferCurrentTab/selfBrowserSurface: 크로미움 전용 힌트 — "현재 탭"을
    // 기본 선택지로 띄운다 (표준 타입에 없어 unknown 캐스트)
    this.stream = await md.getDisplayMedia({
      video: { frameRate: 15 },
      audio: false,
      preferCurrentTab: true,
      selfBrowserSurface: 'include',
    });
    const v = document.createElement('video');
    v.muted = true;
    v.srcObject = this.stream;
    await v.play();
    this.video = v;
  }

  /** 현재 프레임을 PNG dataURL로 */
  grab(): string {
    const v = this.video;
    if (!v || !v.videoWidth) throw new Error('capture stream not ready');
    const cv = document.createElement('canvas');
    cv.width = v.videoWidth;
    cv.height = v.videoHeight;
    cv.getContext('2d')!.drawImage(v, 0, 0);
    return cv.toDataURL('image/png');
  }

  /** 한 장만: 잡고 → 찍고 → 즉시 해제 ('공유 중지' 바가 남지 않는다) */
  async oneShot(): Promise<string> {
    try {
      await this.ensure();
      await new Promise((r) => setTimeout(r, 300)); // 첫 프레임 대기
      return this.grab();
    } finally {
      this.dispose();
    }
  }

  dispose(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.video = null;
  }
}

/** dataURL을 파일로 저장 */
export function downloadShot(url: string, name: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
}

/* ── right sidebar — 캡처 갤러리 ── */

const railTitle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: '#8e8e93',
};

export function ShotsRail({
  open,
  shots,
  onClose,
  onOpenShot,
  onDelete,
}: {
  open: boolean;
  shots: Shot[];
  onClose: () => void;
  onOpenShot: (s: Shot) => void;
  /** index의 캡처를 목록에서 삭제 */
  onDelete: (index: number) => void;
}) {
  return (
    <aside
      data-capture-exclude
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 264,
        zIndex: 95,
        padding: '18px 14px 26px',
        overflowY: 'auto',
        background: 'rgba(18, 18, 20, 0.82)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(26px) saturate(180%)',
        WebkitBackdropFilter: 'blur(26px) saturate(180%)',
        fontFamily: 'var(--font-body)',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 6px 14px',
        }}
      >
        <span style={railTitle}>Captures</span>
        <button className="noir-icon-btn sm" data-tip="Close" onClick={onClose}>
          <IconClose />
        </button>
      </div>
      {shots.length === 0 ? (
        <div style={{ padding: '18px 8px', color: '#8e8e93', fontSize: 13, lineHeight: 1.7 }}>
          아직 캡처가 없습니다.
          <br />
          카메라 버튼(C)으로 현재 화면을 — 그려 둔 주석까지 — 담아 보세요.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {shots.map((s, i) => (
            <div
              key={i}
              style={{
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => onOpenShot(s)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: 0,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <img
                  src={s.url}
                  alt={`슬라이드 ${s.slide + 1} 캡처`}
                  style={{ display: 'block', width: '100%', height: 'auto' }}
                />
              </button>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 10px',
                  fontSize: 11.5,
                  color: '#c7c7cc',
                  fontFeatureSettings: "'tnum' 1",
                  background: 'rgba(0,0,0,0.3)',
                }}
              >
                <span style={{ flex: 1 }}>슬라이드 {s.slide + 1}</span>
                <span style={{ color: '#8e8e93' }}>{s.label}</span>
                <button
                  data-tip="삭제"
                  onClick={() => onDelete(i)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#8e8e93',
                    cursor: 'pointer',
                    fontSize: 12,
                    padding: 0,
                    fontWeight: 700,
                  }}
                >
                  ✕
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

/* ── 캡처 확대 보기 — 화면 90% 모달, 비율 유지 ── */

export function ShotModal({ shot, onClose }: { shot: Shot; onClose: () => void }) {
  return (
    <div
      data-capture-exclude
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 400,
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <figure
        onClick={(e) => e.stopPropagation()}
        style={{
          margin: 0,
          width: '90vw',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}
      >
        {/* objectFit contain — 가로세로비를 깨지 않고 90% 박스 안에 최대로 */}
        <img
          src={shot.url}
          alt={`슬라이드 ${shot.slide + 1} 캡처 확대`}
          style={{
            maxWidth: '100%',
            maxHeight: 'calc(100% - 34px)',
            objectFit: 'contain',
            borderRadius: 12,
            boxShadow: '0 40px 120px -30px rgba(0,0,0,0.9)',
          }}
        />
        <figcaption
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            color: '#c7c7cc',
            fontSize: 13,
            fontFamily: 'var(--font-body)',
          }}
        >
          슬라이드 {shot.slide + 1} · {shot.label}
          <button className="noir-icon-btn sm" data-tip="Close (Esc)" onClick={onClose}>
            <IconClose />
          </button>
        </figcaption>
      </figure>
    </div>
  );
}

/* ── 드래그 확대 영역 선택 오버레이 ── */

export type ZoomRect = { x: number; y: number; w: number; h: number };

export function ZoomSelect({
  onPick,
  onCancel,
}: {
  onPick: (r: ZoomRect) => void;
  onCancel: () => void;
}) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const [rect, setRect] = useState<ZoomRect | null>(null);

  return (
    <div
      data-capture-exclude
      onPointerDown={(e) => {
        start.current = { x: e.clientX, y: e.clientY };
        setRect({ x: e.clientX, y: e.clientY, w: 0, h: 0 });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const s = start.current;
        if (!s) return;
        setRect({
          x: Math.min(s.x, e.clientX),
          y: Math.min(s.y, e.clientY),
          w: Math.abs(e.clientX - s.x),
          h: Math.abs(e.clientY - s.y),
        });
      }}
      onPointerUp={() => {
        const r = rect;
        start.current = null;
        setRect(null);
        // 너무 작은 사각형은 취소로 간주 (실수 클릭)
        if (r && r.w > 24 && r.h > 24) onPick(r);
        else onCancel();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 96,
        cursor: 'crosshair',
        background: 'rgba(0,0,0,0.18)',
      }}
    >
      {rect && (
        <div
          style={{
            position: 'absolute',
            left: rect.x,
            top: rect.y,
            width: rect.w,
            height: rect.h,
            border: '1.5px solid var(--primary, #4fe5b0)',
            background: 'color-mix(in srgb, var(--primary, #4fe5b0) 12%, transparent)',
            borderRadius: 4,
            pointerEvents: 'none',
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          top: 18,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '8px 18px',
          borderRadius: 999,
          background: 'rgba(28,28,30,0.8)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#e8e8ea',
          fontSize: 13,
          fontFamily: 'var(--font-body)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        드래그로 확대할 영역을 지정하세요 — Esc 취소 · Z 원래대로
      </div>
    </div>
  );
}
