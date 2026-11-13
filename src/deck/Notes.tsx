import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { IconClose } from './icons';
import { downloadShot } from './Capture';
import { fontPx, resolveInk, TEXT_FAMILY, type Tool } from './Annotator';

/* ── Notes layer — 슬라이드 위 자유 배치 노트 영역 ─────────────────────
   annotate 전체 캔버스와 별개인 독립 필기 영역. 노트마다 고유 id로 관리하고
   세션 스토리지에 저장한다.
   · 활성화: 노트를 클릭하면 활성(액센트 링 + annotate 자동 켜짐)이 되고,
     annotate 도구막대의 도구·색·굵기가 "활성 노트에만" 적용된다.
     노트 밖을 클릭하면 비활성 + annotate 종료 (Deck이 조율).
   · 이동(헤더 드래그)·크기 조절(우하단 핸들) — 크기 조절은 보이는 창만
     바꾼다: 내용 좌표는 노트 원점 기준 px 고정이라 손실 없이 클립만 된다.
   · 배경색 순환, 숨김(✕) 후 Notes 레일에서 재표시, 노트별 PNG 저장. */

export type NotePt = { x: number; y: number }; // 노트 원점 기준 px
export type NoteStroke = {
  tool: Exclude<Tool, 'eraser'>;
  color: string; // 저장 시점에 resolve된 실제 색
  size: number;
  points: NotePt[];
  text?: string;
};
export type NoteData = {
  id: string;
  slide: number; // 0-based
  x: number; // viewport %
  y: number; // viewport %
  w: number; // px
  h: number; // px
  bg: string;
  visible: boolean;
  strokes: NoteStroke[];
};

export const NOTE_BGS = ['#f5e6a4', '#f6c6d8', '#bfe8d1', '#bcdcf5', '#23242c'];
const HEADER_H = 30;

const storeKey = () => `deck:notes:${location.pathname}${location.search}`;
export function loadNotes(): NoteData[] {
  try {
    return JSON.parse(sessionStorage.getItem(storeKey()) || '[]') as NoteData[];
  } catch {
    return [];
  }
}
export function saveNotes(notes: NoteData[]): void {
  try {
    sessionStorage.setItem(storeKey(), JSON.stringify(notes));
  } catch {
    /* 저장 실패는 치명적이지 않다 */
  }
}
export const newNoteId = () => 'n' + Math.random().toString(36).slice(2, 9);

/* ── 그리기 — annotate와 같은 도구 어휘 (좌표만 노트 로컬 px) ── */

function outlinePts(tool: NoteStroke['tool'], p: NotePt[]): NotePt[] {
  if (p.length < 2) return p;
  const a = p[0];
  const b = p[p.length - 1];
  if (tool === 'rect') return [a, { x: b.x, y: a.y }, b, { x: a.x, y: b.y }, a];
  if (tool === 'ellipse') {
    const cx = (a.x + b.x) / 2;
    const cy = (a.y + b.y) / 2;
    const rx = Math.abs(b.x - a.x) / 2;
    const ry = Math.abs(b.y - a.y) / 2;
    return Array.from({ length: 25 }, (_, i) => ({
      x: cx + rx * Math.cos((i / 24) * 2 * Math.PI),
      y: cy + ry * Math.sin((i / 24) * 2 * Math.PI),
    }));
  }
  return p;
}

function paintNoteStroke(ctx: CanvasRenderingContext2D, s: NoteStroke) {
  if (!s.points.length) return;
  const p = s.points;
  const a = p[0];
  const b = p[p.length - 1];
  ctx.save();
  if (s.tool === 'text') {
    const px = fontPx(s.size);
    ctx.fillStyle = s.color;
    ctx.font = `600 ${px}px ${TEXT_FAMILY}`;
    ctx.textBaseline = 'top';
    (s.text || '').split('\n').forEach((line, i) => ctx.fillText(line, a.x, a.y + i * px * 1.35));
    ctx.restore();
    return;
  }
  ctx.strokeStyle = s.color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = s.size;
  if (s.tool === 'highlighter') {
    ctx.globalAlpha = 0.32;
    ctx.lineWidth = s.size * 3.2;
  }
  ctx.beginPath();
  if (s.tool === 'pen' || s.tool === 'highlighter') {
    ctx.moveTo(a.x, a.y);
    for (let i = 1; i < p.length; i++) ctx.lineTo(p[i].x, p[i].y);
    ctx.stroke();
  } else if (s.tool === 'line' || s.tool === 'arrow') {
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    if (s.tool === 'arrow') {
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      const h = 8 + s.size * 1.8;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - h * Math.cos(ang - 0.4), b.y - h * Math.sin(ang - 0.4));
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - h * Math.cos(ang + 0.4), b.y - h * Math.sin(ang + 0.4));
      ctx.stroke();
    }
  } else if (s.tool === 'rect') {
    ctx.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
  } else if (s.tool === 'ellipse') {
    ctx.ellipse(
      (a.x + b.x) / 2,
      (a.y + b.y) / 2,
      Math.abs(b.x - a.x) / 2,
      Math.abs(b.y - a.y) / 2,
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }
  ctx.restore();
}

function distToSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / len;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function noteHit(s: NoteStroke, x: number, y: number, r: number): boolean {
  if (s.tool === 'text') {
    const p0 = s.points[0];
    if (!p0) return false;
    const px = fontPx(s.size);
    const lines = (s.text || '').split('\n');
    const w = Math.max(...lines.map((l) => l.length), 1) * px * 0.62;
    const h = lines.length * px * 1.35;
    return x > p0.x - r && x < p0.x + w + r && y > p0.y - r && y < p0.y + h + r;
  }
  const pts = outlinePts(s.tool, s.points);
  if (pts.length === 1) return Math.hypot(pts[0].x - x, pts[0].y - y) < r + s.size;
  for (let i = 0; i < pts.length - 1; i++)
    if (distToSeg(x, y, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y) < r + s.size / 2)
      return true;
  return false;
}

/** 노트를 PNG dataURL로 (레일 미리보기·이미지 저장 공용) */
export function renderNotePng(n: NoteData, scale = 2): string {
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, n.w * scale);
  cv.height = Math.max(1, n.h * scale);
  const ctx = cv.getContext('2d')!;
  ctx.scale(scale, scale);
  ctx.fillStyle = n.bg;
  ctx.fillRect(0, 0, n.w, n.h);
  for (const s of n.strokes) paintNoteStroke(ctx, s);
  return cv.toDataURL('image/png');
}

/* ── 슬라이드 위 노트 한 장 ── */

export function NoteBox({
  note,
  active,
  tool,
  color,
  size,
  onChange,
  onHide,
  onActivate,
}: {
  note: NoteData;
  /** 선택(활성) 상태 — annotate 도구가 이 노트에 적용된다 */
  active: boolean;
  tool: Tool;
  color: string;
  size: number;
  onChange: (patch: Partial<NoteData>) => void;
  onHide: () => void;
  onActivate: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draft = useRef<NoteStroke | null>(null);
  const drag = useRef<{ mode: 'move' | 'resize'; sx: number; sy: number; ox: number; oy: number } | null>(null);
  // 텍스트 도구용 인라인 입력 (노트 로컬 좌표)
  const [textEdit, setTextEdit] = useState<{ x: number; y: number } | null>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const textBornAt = useRef(0);

  function redraw() {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cv.width / dpr, cv.height / dpr);
    for (const s of note.strokes) paintNoteStroke(ctx, s);
    if (draft.current) paintNoteStroke(ctx, draft.current);
  }
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    const bw = note.w;
    const bh = note.h - HEADER_H;
    cv.width = bw * dpr;
    cv.height = bh * dpr;
    cv.style.width = bw + 'px';
    cv.style.height = bh + 'px';
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.w, note.h, note.strokes, note.bg]);

  useEffect(() => {
    const el = textRef.current;
    if (!el || !textEdit) return;
    el.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textEdit]);

  function commitNoteText() {
    const el = textRef.current;
    const pos = textEdit;
    setTextEdit(null);
    if (!el || !pos) return;
    const text = el.innerText.replace(/\s+$/, '');
    if (!text.trim()) return;
    onChange({
      strokes: [
        ...note.strokes,
        { tool: 'text', color: resolveInk(color), size, points: [{ x: pos.x, y: pos.y }], text },
      ],
    });
  }

  /* 본문 입력 — 활성 노트에만 annotate 도구 적용.
     비활성 상태의 첫 클릭은 "선택"만 한다 (그리기 시작 안 함). */
  function bodyDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!active) return; // 이 클릭은 onActivate(루트 캡처)가 처리
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    if (tool === 'eraser') {
      const before = note.strokes.length;
      const remain = note.strokes.filter((s) => !noteHit(s, x, y, 12));
      if (remain.length !== before) onChange({ strokes: remain });
      return;
    }
    if (tool === 'text') {
      if (textEdit) commitNoteText();
      else {
        textBornAt.current = performance.now();
        setTextEdit({ x, y });
      }
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    draft.current = { tool, color: resolveInk(color), size, points: [{ x, y }] };
  }
  function bodyMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    if (active && tool === 'eraser' && e.buttons) {
      const remain = note.strokes.filter((s) => !noteHit(s, x, y, 12));
      if (remain.length !== note.strokes.length) onChange({ strokes: remain });
      return;
    }
    const d = draft.current;
    if (!d) return;
    if (d.tool === 'pen' || d.tool === 'highlighter') d.points.push({ x, y });
    else d.points = [d.points[0], { x, y }];
    redraw();
  }
  function bodyUp() {
    const d = draft.current;
    draft.current = null;
    if (d && d.points.length > 1) onChange({ strokes: [...note.strokes, d] });
    else redraw();
  }

  /* 헤더 드래그 = 이동, 핸들 드래그 = 크기 조절 */
  function dragDown(mode: 'move' | 'resize') {
    return (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      drag.current = {
        mode,
        sx: e.clientX,
        sy: e.clientY,
        ox: mode === 'move' ? note.x : note.w,
        oy: mode === 'move' ? note.y : note.h,
      };
    };
  }
  function dragMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (d.mode === 'move') {
      onChange({
        x: Math.max(0, Math.min(96, d.ox + (dx / window.innerWidth) * 100)),
        y: Math.max(0, Math.min(94, d.oy + (dy / window.innerHeight) * 100)),
      });
    } else {
      onChange({ w: Math.max(150, d.ox + dx), h: Math.max(110, d.oy + dy) });
    }
  }
  function dragUp() {
    drag.current = null;
  }

  const ink = note.bg === '#23242c' ? '#f2f4f8' : '#22242e';
  const nextBg = () => {
    const i = NOTE_BGS.indexOf(note.bg);
    onChange({ bg: NOTE_BGS[(i + 1) % NOTE_BGS.length] });
  };

  return (
    <div
      data-note-id={note.id}
      onPointerDownCapture={onActivate}
      style={{
        position: 'fixed',
        left: `${note.x}%`,
        top: `${note.y}%`,
        width: note.w,
        height: note.h,
        zIndex: active ? 89 : 87,
        borderRadius: 12,
        background: note.bg,
        border: '1px solid rgba(0,0,0,0.25)',
        /* 활성 상태가 눈에 보이도록 액센트 링 */
        boxShadow: active
          ? '0 0 0 2.5px var(--primary, #4fe5b0), 0 22px 60px -22px rgba(0,0,0,0.75)'
          : '0 22px 60px -22px rgba(0,0,0,0.75)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 헤더 — 드래그로 이동 */}
      <div
        onPointerDown={dragDown('move')}
        onPointerMove={dragMove}
        onPointerUp={dragUp}
        style={{
          height: HEADER_H,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 8px',
          cursor: 'grab',
          background: 'rgba(0,0,0,0.14)',
          borderRadius: '12px 12px 0 0',
          touchAction: 'none',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: ink,
            opacity: 0.75,
            userSelect: 'none',
          }}
        >
          NOTE{active ? ' · 편집 중' : ''}
        </span>
        <span style={{ flex: 1 }} />
        <button
          data-tip="배경색"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={nextBg}
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            border: `1.5px solid ${ink}`,
            background: NOTE_BGS[(NOTE_BGS.indexOf(note.bg) + 1) % NOTE_BGS.length],
            cursor: 'pointer',
            padding: 0,
          }}
        />
        <button
          data-tip="숨기기 (Notes에서 다시 열기)"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onHide}
          style={{
            border: 'none',
            background: 'transparent',
            color: ink,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 800,
            padding: '0 2px',
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>
      {/* 본문 — 독립 필기 캔버스 (영역보다 큰 내용은 클립만 된다) */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', borderRadius: '0 0 12px 12px' }}>
        <canvas
          ref={canvasRef}
          onPointerDown={bodyDown}
          onPointerMove={bodyMove}
          onPointerUp={bodyUp}
          style={{
            display: 'block',
            cursor: active ? (tool === 'eraser' ? 'cell' : 'crosshair') : 'pointer',
            touchAction: 'none',
          }}
        />
        {active && textEdit && (
          <div
            ref={textRef}
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                commitNoteText();
              }
              if (e.key === 'Escape') {
                e.stopPropagation();
                setTextEdit(null);
              }
            }}
            onBlur={() => {
              if (performance.now() - textBornAt.current < 250) {
                textRef.current?.focus();
                return;
              }
              commitNoteText();
            }}
            style={{
              position: 'absolute',
              left: textEdit.x,
              top: textEdit.y - 2,
              minWidth: 40,
              maxWidth: '90%',
              padding: '1px 6px',
              color: resolveInk(color),
              fontFamily: TEXT_FAMILY,
              fontWeight: 600,
              fontSize: fontPx(size),
              lineHeight: 1.35,
              whiteSpace: 'pre-wrap',
              border: `1.5px dashed ${resolveInk(color)}`,
              borderRadius: 6,
              outline: 'none',
              background: 'rgba(255,255,255,0.25)',
            }}
          />
        )}
      </div>
      {/* 크기 조절 핸들 */}
      <div
        onPointerDown={dragDown('resize')}
        onPointerMove={dragMove}
        onPointerUp={dragUp}
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: 18,
          height: 18,
          cursor: 'nwse-resize',
          touchAction: 'none',
        }}
      >
        <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden>
          <path
            d="M6 16L16 6M11 16l5-5M15.5 16l.5-.5"
            stroke={ink}
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.55"
          />
        </svg>
      </div>
    </div>
  );
}

/* ── Notes 레일 — 캡처 레일의 노트판 ── */

const railTitle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: '#8e8e93',
};

export function NotesRail({
  open,
  notes,
  onClose,
  onAdd,
  onShow,
  onDelete,
}: {
  open: boolean;
  notes: NoteData[];
  onClose: () => void;
  onAdd: () => void;
  /** 해당 슬라이드로 이동해 노트를 다시 띄운다 */
  onShow: (n: NoteData) => void;
  onDelete: (id: string) => void;
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
        <span style={railTitle}>Notes</span>
        <button className="noir-icon-btn sm" data-tip="Close" onClick={onClose}>
          <IconClose />
        </button>
      </div>
      <button
        onClick={onAdd}
        style={{
          width: '100%',
          padding: '9px 0',
          marginBottom: 14,
          borderRadius: 10,
          border: '1px dashed rgba(255,255,255,0.25)',
          background: 'transparent',
          color: '#c7c7cc',
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        + 새 노트 (N)
      </button>
      {notes.length === 0 ? (
        <div style={{ padding: '8px 8px', color: '#8e8e93', fontSize: 13, lineHeight: 1.7 }}>
          노트가 없습니다.
          <br />새 노트를 만들어 슬라이드 위에 자유롭게 필기해 보세요. 세션 동안
          저장됩니다.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {notes.map((n) => (
            <div
              key={n.id}
              style={{
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                overflow: 'hidden',
              }}
            >
              <button
                data-tip="이 슬라이드에 다시 띄우기"
                onClick={() => onShow(n)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: 0,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                <img
                  src={renderNotePng(n, 1)}
                  alt={`노트 — 슬라이드 ${n.slide + 1}`}
                  style={{ display: 'block', width: '100%', height: 'auto' }}
                />
              </button>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 10px',
                  fontSize: 11.5,
                  color: '#c7c7cc',
                  background: 'rgba(0,0,0,0.3)',
                }}
              >
                <span style={{ flex: 1 }}>
                  슬라이드 {n.slide + 1}
                  {!n.visible && <span style={{ color: '#8e8e93' }}> · 숨김</span>}
                </span>
                <button
                  data-tip="PNG로 저장"
                  onClick={() =>
                    downloadShot(renderNotePng(n, 2), `노트_슬라이드${n.slide + 1}_${n.id}.png`)
                  }
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#c7c7cc',
                    cursor: 'pointer',
                    fontSize: 11.5,
                    fontWeight: 700,
                    padding: 0,
                  }}
                >
                  PNG
                </button>
                <button
                  data-tip="삭제"
                  onClick={() => onDelete(n.id)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#8e8e93',
                    cursor: 'pointer',
                    fontSize: 12,
                    padding: 0,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
