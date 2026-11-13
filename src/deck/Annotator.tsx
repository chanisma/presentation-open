import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

/* State-of-the-art annotation: a full-screen canvas + a floating tool bar.
   Tools: pen, highlighter, line, arrow, rectangle, ellipse, eraser; a color
   palette; three sizes; undo + clear. Strokes are stored as data (per slide,
   in `store`) so they PERSIST on the slide they were made on, and undo /
   stroke-erase work cleanly. The bar + drawing are only interactive when
   `active`; otherwise the canvas just displays the slide's saved annotations.

   CONTENT-ANCHORED: when a stroke is committed it is anchored to the block
   element under its center (stored as a child-index path from the slide
   stage) with coordinates relative to THAT element's box. Because the slide
   DOM is identical at every viewport — only CSS reflows it — the same path
   resolves on any screen, so a circle drawn around a stat on a laptop rings
   the same stat on a phone, wherever the layout moved it. Strokes over empty
   background anchor to the stage and scale with the viewport. */

export type Tool =
  | 'select'
  | 'pen'
  | 'highlighter'
  | 'line'
  | 'arrow'
  | 'rect'
  | 'ellipse'
  | 'text'
  | 'eraser';
type Pt = { x: number; y: number }; // relative to the stroke's anchor box (0..1)
export type Stroke = {
  tool: Tool;
  color: string;
  size: number;
  points: Pt[];
  anchor?: string;
  /** tool === 'text'일 때의 내용 (\n 줄바꿈) */
  text?: string;
};

/** 텍스트 도구: 획 굵기 단계(3/6/11)를 글자 크기로 사상 (노트와 공용) */
export const fontPx = (size: number) => Math.round(12 + size * 2.4);
export const TEXT_FAMILY = "'Noto Sans KR', 'Malgun Gothic', sans-serif";
type Box = { left: number; top: number; width: number; height: number };

const TOOLS: { id: Tool; label: string; path: string }[] = [
  {
    id: 'select',
    label: 'Select — 텍스트 선택·이동',
    path: 'M6 3l12 9.2-6.6 1 3.4 6.4-2.8 1.4-3.4-6.4L6 18.4z',
  },
  { id: 'pen', label: 'Pen', path: 'M4 20h4L18 10a2 2 0 0 0-3-3L5 17z' },
  {
    id: 'highlighter',
    label: 'Highlighter',
    path: 'M4 20h5l8-8-4-4-9 9zM13 7l4 4',
  },
  { id: 'line', label: 'Line', path: 'M5 19L19 5' },
  { id: 'arrow', label: 'Arrow', path: 'M6 18L18 6M18 6h-6M18 6v6' },
  { id: 'rect', label: 'Rectangle', path: 'M4 6h16v12H4z' },
  {
    id: 'ellipse',
    label: 'Ellipse',
    path: 'M12 6c4.5 0 8 2.7 8 6s-3.5 6-8 6-8-2.7-8-6 3.5-6 8-6z',
  },
  { id: 'text', label: 'Text', path: 'M6 6V4.8h12V6M12 4.8V19M9.5 19h5' },
  {
    id: 'eraser',
    label: 'Eraser',
    path: 'M8 18l-4-4a2 2 0 0 1 0-3l7-7a2 2 0 0 1 3 0l4 4a2 2 0 0 1 0 3l-7 7zM7 17h11',
  },
];
export const COLORS = ['var(--primary)', '#ffffff', '#ef4444', '#f5b73a', '#4aa8ff'];
export const SIZES = [3, 6, 11];
/** var(--primary) 같은 토큰을 실제 색으로 (노트 캔버스와 공용) */
export const resolveInk = (c: string) =>
  c.startsWith('var(')
    ? getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() ||
      '#4fe5b0'
    : c;

const IconUndo = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.9}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 8L5 12l4 4" />
    <path d="M5 12h9a4 4 0 1 1 0 8h-3" />
  </svg>
);
const IconTrash = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.9}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 7h14M10 7V5h4v2M6 7l1 13h10l1-13" />
  </svg>
);

/* ── content anchoring ─────────────────────────────────────────────── */
const stage = () => document.querySelector('.slide-stage');
const viewportBox = (): Box => ({
  left: 0,
  top: 0,
  width: window.innerWidth,
  height: window.innerHeight,
});

/* child-index path from the stage root, e.g. "0.2.1" ("" = the stage itself) */
function pathOf(el: Element): string {
  const root = stage();
  const parts: number[] = [];
  let cur: Element | null = el;
  while (cur && cur !== root) {
    const parent: Element | null = cur.parentElement;
    if (!parent) return '';
    parts.unshift(Array.prototype.indexOf.call(parent.children, cur));
    cur = parent;
  }
  return cur === root ? parts.join('.') : '';
}
function resolveAnchor(path?: string): Box | null {
  if (path === undefined) return null;
  const root = stage();
  if (!root) return null;
  let cur: Element = root;
  if (path !== '') {
    for (const i of path.split('.').map(Number)) {
      const next = cur.children[i];
      if (!next) return null;
      cur = next;
    }
  }
  const r = cur.getBoundingClientRect();
  return r.width > 4 && r.height > 4 ? r : null;
}
/* the block element under a client point (skipping the canvas + chrome) */
function anchorAt(cx: number, cy: number): string {
  for (const el of document.elementsFromPoint(cx, cy)) {
    if (!el.closest('.slide-stage')) continue;
    let block: Element | null = el;
    while (
      block &&
      block !== stage() &&
      getComputedStyle(block).display === 'inline'
    )
      block = block.parentElement;
    return block ? pathOf(block) : '';
  }
  return '';
}
/* a stroke's points mapped to client pixels at the CURRENT layout */
function clientPts(s: Stroke): Pt[] {
  const r = resolveAnchor(s.anchor) ?? viewportBox();
  return s.points.map((p) => ({
    x: r.left + p.x * r.width,
    y: r.top + p.y * r.height,
  }));
}

function distToSeg(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
) {
  const dx = bx - ax,
    dy = by - ay;
  const len = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / len;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function outline(tool: Tool, pts: Pt[]): Pt[] {
  if (pts.length < 2) return pts;
  const a = pts[0],
    b = pts[pts.length - 1];
  if (tool === 'rect') return [a, { x: b.x, y: a.y }, b, { x: a.x, y: b.y }, a];
  if (tool === 'ellipse') {
    const cx = (a.x + b.x) / 2,
      cy = (a.y + b.y) / 2,
      rx = Math.abs(b.x - a.x) / 2,
      ry = Math.abs(b.y - a.y) / 2;
    return Array.from({ length: 25 }, (_, i) => ({
      x: cx + rx * Math.cos((i / 24) * 2 * Math.PI),
      y: cy + ry * Math.sin((i / 24) * 2 * Math.PI),
    }));
  }
  return pts;
}
/* 텍스트 실측 bbox (client px) — 선택 박스·칩 위치·히트 판정 공용 */
const measureCtx = document.createElement('canvas').getContext('2d')!;
function textBBox(s: Stroke): Box | null {
  const p0 = clientPts(s)[0];
  if (!p0) return null;
  const px = fontPx(s.size);
  measureCtx.font = `600 ${px}px ${TEXT_FAMILY}`;
  const lines = (s.text || '').split('\n');
  const w = Math.max(...lines.map((l) => measureCtx.measureText(l).width), 8);
  return { left: p0.x, top: p0.y, width: w, height: lines.length * px * 1.35 };
}

/* 임의 획의 bbox (client px) — 마퀴 선택·다중 선택 박스용 */
function strokeBBox(s: Stroke): Box | null {
  if (s.tool === 'text') return textBBox(s);
  const pts = outline(s.tool, clientPts(s));
  if (!pts.length) return null;
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const pad = (s.tool === 'highlighter' ? s.size * 1.6 : s.size / 2) + 2;
  const left = Math.min(...xs) - pad;
  const top = Math.min(...ys) - pad;
  return {
    left,
    top,
    width: Math.max(...xs) + pad - left,
    height: Math.max(...ys) + pad - top,
  };
}
const boxesIntersect = (a: Box, b: Box) =>
  a.left < b.left + b.width &&
  a.left + a.width > b.left &&
  a.top < b.top + b.height &&
  a.top + a.height > b.top;

function hits(s: Stroke, x: number, y: number, r: number) {
  if (s.tool === 'text') {
    const b = textBBox(s);
    if (!b) return false;
    return (
      x > b.left - r &&
      x < b.left + b.width + r &&
      y > b.top - r &&
      y < b.top + b.height + r
    );
  }
  const pts = outline(s.tool, clientPts(s));
  if (pts.length === 1)
    return Math.hypot(pts[0].x - x, pts[0].y - y) < r + s.size;
  for (let i = 0; i < pts.length - 1; i++)
    if (
      distToSeg(x, y, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y) <
      r + s.size / 2
    )
      return true;
  return false;
}

export default function Annotator({
  slide,
  store,
  active,
  tool,
  color,
  size,
  onTool,
  onColor,
  onSize,
  inputDisabled = false,
}: {
  slide: number;
  store: Record<number, Stroke[]>;
  active: boolean;
  /* 도구 상태는 Deck이 소유(controlled) — 노트 영역이 같은 도구를 공유한다 */
  tool: Tool;
  color: string;
  size: number;
  onTool: (t: Tool) => void;
  onColor: (c: string) => void;
  onSize: (s: number) => void;
  /** 활성 노트가 입력을 가져갈 때 — 도구막대는 그대로, 캔버스 입력만 차단 */
  inputDisabled?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  if (!store[slide]) store[slide] = [];
  const strokes = useRef<Stroke[]>(store[slide]);
  const draft = useRef<Stroke | null>(null); // draft points are raw client px
  const setTool = onTool;
  const setColor = onColor;
  const setSize = onSize;
  // 텍스트 도구: 클릭 지점 인라인 입력(contentEditable — 내용에 맞춰 자동
  // 확장) → Enter/blur로 스트로크 확정. 기존 텍스트는 클릭=재편집, 드래그=이동.
  const [textEdit, setTextEdit] = useState<{
    x: number;
    y: number;
    initial?: string;
    color?: string;
    size?: number;
  } | null>(null);
  const textRef = useRef<HTMLDivElement>(null);
  // 여는 클릭 제스처의 포커스 경합으로 마운트 직후 blur가 오면 무시하고 재포커스
  const textBornAt = useRef(0);
  // 기존 텍스트 드래그(이동)·클릭(재편집) 추적
  const textDrag = useRef<{
    stroke: Stroke;
    sx: number;
    sy: number;
    moved: boolean;
    orig: Pt[];
  } | null>(null);
  // 재편집 중 원본 — Esc 취소 시 복원
  const editingOriginal = useRef<Stroke | null>(null);
  // 선택 도구: 선택된 획들(텍스트·펜·도형) — 개별 대시 박스 + 칩.
  // 클릭=단일 선택, 빈 곳 드래그=마퀴(러버밴드) 다중 선택, 잡아 끌면 함께 이동
  const [selected, setSelected] = useState<Stroke[]>([]);
  const selectedRef = useRef<Stroke[]>([]);
  selectedRef.current = selected;
  const [, bumpSel] = useState(0); // 이동 확정 후 칩 위치 재계산 트리거
  const groupDrag = useRef<{
    sx: number;
    sy: number;
    moved: boolean;
    items: { stroke: Stroke; orig: Pt[] }[];
  } | null>(null);
  const marquee = useRef<{ x0: number; y0: number; x1: number; y1: number } | null>(null);

  // 입력 상자가 열리면 초기 내용을 채우고 캐럿을 끝으로
  useEffect(() => {
    const el = textRef.current;
    if (!el || !textEdit) return;
    el.innerText = textEdit.initial ?? '';
    el.focus();
    const sel = window.getSelection();
    if (sel) {
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textEdit]);
  const toolRef = useRef(tool),
    colorRef = useRef(color),
    sizeRef = useRef(size);
  toolRef.current = tool;
  colorRef.current = color;
  sizeRef.current = size;

  // 선택 도구를 벗어나면 선택 해제, 선택 변경 시 박스 다시 그림
  useEffect(() => {
    if (tool !== 'select' && selectedRef.current.length) setSelected([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool]);
  useEffect(() => {
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);
  // 선택된 획: Delete/Backspace로 일괄 삭제
  useEffect(() => {
    if (!selected.length) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || t.tagName === 'INPUT' || t.tagName === 'TEXTAREA'))
        return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const resolve = (c: string) =>
    c.startsWith('var(')
      ? getComputedStyle(document.documentElement)
          .getPropertyValue('--primary')
          .trim() || '#4fe5b0'
      : c;

  function paint(ctx: CanvasRenderingContext2D, s: Stroke, p: Pt[]) {
    if (!p.length) return;
    if (s.tool === 'text') {
      const px = fontPx(s.size);
      ctx.save();
      ctx.fillStyle = resolve(s.color);
      ctx.font = `600 ${px}px ${TEXT_FAMILY}`;
      ctx.textBaseline = 'top';
      (s.text || '')
        .split('\n')
        .forEach((line, i) => ctx.fillText(line, p[0].x, p[0].y + i * px * 1.35));
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.strokeStyle = resolve(s.color);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = s.size;
    if (s.tool === 'highlighter') {
      ctx.globalAlpha = 0.32;
      ctx.lineWidth = s.size * 3.2;
    }
    const a = p[0],
      b = p[p.length - 1];
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
        const ang = Math.atan2(b.y - a.y, b.x - a.x),
          h = 8 + s.size * 1.8;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(
          b.x - h * Math.cos(ang - 0.4),
          b.y - h * Math.sin(ang - 0.4)
        );
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(
          b.x - h * Math.cos(ang + 0.4),
          b.y - h * Math.sin(ang + 0.4)
        );
        ctx.stroke();
      }
    } else if (s.tool === 'rect') {
      ctx.strokeRect(
        Math.min(a.x, b.x),
        Math.min(a.y, b.y),
        Math.abs(b.x - a.x),
        Math.abs(b.y - a.y)
      );
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
  function redraw() {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cv.width / dpr, cv.height / dpr);
    for (const s of strokes.current) paint(ctx, s, clientPts(s));
    if (draft.current) paint(ctx, draft.current, draft.current.points);
    // 선택 박스들 (선택 도구) — 이동 중에도 획을 따라간다
    ctx.save();
    ctx.strokeStyle = resolve('var(--primary)');
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 1.5;
    for (const sel of selectedRef.current) {
      if (!strokes.current.includes(sel)) continue;
      const b = strokeBBox(sel);
      if (b) ctx.strokeRect(b.left - 6, b.top - 5, b.width + 12, b.height + 10);
    }
    // 마퀴(러버밴드) 진행 중 표시
    const m = marquee.current;
    if (m) {
      ctx.strokeRect(
        Math.min(m.x0, m.x1),
        Math.min(m.y0, m.y1),
        Math.abs(m.x1 - m.x0),
        Math.abs(m.y1 - m.y0)
      );
    }
    ctx.restore();
  }
  function commit() {
    store[slide] = strokes.current;
    redraw();
  }
  function erase(x: number, y: number) {
    const before = strokes.current.length;
    strokes.current = strokes.current.filter((s) => !hits(s, x, y, 12));
    if (strokes.current.length !== before) commit();
  }

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      cv.width = window.innerWidth * dpr;
      cv.height = window.innerHeight * dpr;
      cv.style.width = window.innerWidth + 'px';
      cv.style.height = window.innerHeight + 'px';
      redraw();
    };
    fit();
    const onUp = () => {
      // 마퀴 종결: 사각형에 걸친 획 전부 선택
      const m = marquee.current;
      if (m) {
        marquee.current = null;
        const rect: Box = {
          left: Math.min(m.x0, m.x1),
          top: Math.min(m.y0, m.y1),
          width: Math.abs(m.x1 - m.x0),
          height: Math.abs(m.y1 - m.y0),
        };
        if (rect.width > 6 || rect.height > 6) {
          const sel = strokes.current.filter((s) => {
            const b = strokeBBox(s);
            return b ? boxesIntersect(b, rect) : false;
          });
          selectedRef.current = sel;
          setSelected(sel);
        }
        redraw();
        return;
      }
      // 무리 이동 종결
      const g = groupDrag.current;
      if (g) {
        groupDrag.current = null;
        if (g.moved) {
          commit();
          bumpSel((v) => v + 1); // 칩 위치 갱신
        }
        redraw();
        return;
      }
      // 텍스트 도구 드래그 종결: 움직였으면 이동 확정, 제자리 클릭은 재편집
      const td = textDrag.current;
      if (td) {
        textDrag.current = null;
        if (td.moved) {
          commit();
        } else {
          strokes.current = strokes.current.filter((s) => s !== td.stroke);
          commit();
          const p0 = clientPts(td.stroke)[0];
          editingOriginal.current = td.stroke;
          textBornAt.current = performance.now();
          setTextEdit({
            x: p0.x,
            y: p0.y,
            initial: td.stroke.text,
            color: td.stroke.color,
            size: td.stroke.size,
          });
        }
        return;
      }
      const d = draft.current;
      if (!d) return;
      draft.current = null;
      // anchor the stroke to the content under its center, then store its
      // points relative to that element's box
      const xs = d.points.map((p) => p.x),
        ys = d.points.map((p) => p.y);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      d.anchor = anchorAt(cx, cy);
      const r = resolveAnchor(d.anchor) ?? viewportBox();
      d.points = d.points.map((p) => ({
        x: (p.x - r.left) / r.width,
        y: (p.y - r.top) / r.height,
      }));
      strokes.current.push(d);
      commit();
    };
    // re-render after the slide's entrance motion settles (anchor boxes move)
    const t1 = window.setTimeout(redraw, 400);
    const t2 = window.setTimeout(redraw, 1100);
    window.addEventListener('resize', fit);
    window.addEventListener('pointerup', onUp);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', fit);
      window.removeEventListener('pointerup', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function commitText() {
    const el = textRef.current;
    const pos = textEdit;
    editingOriginal.current = null; // 확정 — 원본 복원 불필요
    setTextEdit(null);
    if (!el || !pos) return;
    const text = el.innerText.replace(/\s+$/, '');
    if (!text.trim()) return;
    const anchor = anchorAt(pos.x, pos.y);
    const r = resolveAnchor(anchor) ?? viewportBox();
    strokes.current.push({
      tool: 'text',
      color: pos.color ?? colorRef.current,
      size: pos.size ?? sizeRef.current,
      points: [{ x: (pos.x - r.left) / r.width, y: (pos.y - r.top) / r.height }],
      anchor,
      text,
    });
    commit();
  }

  function cancelText() {
    // Esc — 재편집이었다면 원본 텍스트 복원
    if (editingOriginal.current) {
      strokes.current.push(editingOriginal.current);
      editingOriginal.current = null;
      commit();
    }
    setTextEdit(null);
  }

  function editSelected() {
    // 정확히 텍스트 1개가 선택됐을 때만 (칩이 그 조건에서만 [수정] 노출)
    const sel = selectedRef.current;
    if (sel.length !== 1 || sel[0].tool !== 'text') return;
    const target = sel[0];
    strokes.current = strokes.current.filter((s) => s !== target);
    commit();
    setSelected([]);
    const p0 = clientPts(target)[0];
    editingOriginal.current = target;
    textBornAt.current = performance.now();
    setTextEdit({
      x: p0.x,
      y: p0.y,
      initial: target.text,
      color: target.color,
      size: target.size,
    });
  }
  function deleteSelected() {
    const sel = selectedRef.current;
    if (!sel.length) return;
    strokes.current = strokes.current.filter((s) => !sel.includes(s));
    setSelected([]);
    commit();
  }

  function down(e: React.PointerEvent) {
    if (toolRef.current === 'select') {
      // 획 위 클릭 → 선택(이미 선택된 것을 잡으면 무리 전체 이동 준비),
      // 빈 곳 → 마퀴(러버밴드) 드래그로 다중 선택
      const hit = [...strokes.current]
        .reverse()
        .find((s) => hits(s, e.clientX, e.clientY, 6));
      if (hit) {
        let sel = selectedRef.current;
        if (!sel.includes(hit)) {
          sel = [hit];
          selectedRef.current = sel;
          setSelected(sel);
        }
        groupDrag.current = {
          sx: e.clientX,
          sy: e.clientY,
          moved: false,
          items: sel.map((s) => ({ stroke: s, orig: s.points.map((p) => ({ ...p })) })),
        };
      } else {
        selectedRef.current = [];
        setSelected([]);
        marquee.current = { x0: e.clientX, y0: e.clientY, x1: e.clientX, y1: e.clientY };
      }
      redraw();
      return;
    }
    if (toolRef.current === 'text') {
      // 편집 중이면 이번 클릭은 확정만
      if (textEdit) {
        commitText();
        return;
      }
      // 기존 텍스트 위 클릭: 드래그=이동, 제자리 클릭=재편집 (up에서 판정)
      const hit = [...strokes.current]
        .reverse()
        .find((s) => s.tool === 'text' && hits(s, e.clientX, e.clientY, 6));
      if (hit) {
        textDrag.current = {
          stroke: hit,
          sx: e.clientX,
          sy: e.clientY,
          moved: false,
          orig: hit.points.map((p) => ({ ...p })),
        };
        return;
      }
      textBornAt.current = performance.now();
      setTextEdit({ x: e.clientX, y: e.clientY });
      return;
    }
    if (toolRef.current === 'eraser') {
      erase(e.clientX, e.clientY);
      return;
    }
    draft.current = {
      tool: toolRef.current,
      color: colorRef.current,
      size: sizeRef.current,
      points: [{ x: e.clientX, y: e.clientY }],
    };
    redraw();
  }
  function move(e: React.PointerEvent) {
    // 선택 무리 이동 — 각 획을 자기 앵커 좌표계에서 같은 화면 delta만큼 평행이동
    const g = groupDrag.current;
    if (g) {
      const dx = e.clientX - g.sx;
      const dy = e.clientY - g.sy;
      if (!g.moved && Math.hypot(dx, dy) < 4) return;
      g.moved = true;
      for (const it of g.items) {
        const r = resolveAnchor(it.stroke.anchor) ?? viewportBox();
        it.stroke.points = it.orig.map((p) => ({
          x: p.x + dx / r.width,
          y: p.y + dy / r.height,
        }));
      }
      redraw();
      return;
    }
    // 마퀴 사각형 갱신
    if (marquee.current) {
      marquee.current.x1 = e.clientX;
      marquee.current.y1 = e.clientY;
      redraw();
      return;
    }
    // 텍스트 이동 드래그
    const td = textDrag.current;
    if (td) {
      const dx = e.clientX - td.sx;
      const dy = e.clientY - td.sy;
      if (!td.moved && Math.hypot(dx, dy) < 4) return;
      td.moved = true;
      const r = resolveAnchor(td.stroke.anchor) ?? viewportBox();
      td.stroke.points = td.orig.map((p) => ({
        x: p.x + dx / r.width,
        y: p.y + dy / r.height,
      }));
      redraw();
      return;
    }
    // 선택 도구 호버: 획 위에서 이동 커서로 — 선택 가능함을 알린다
    if (toolRef.current === 'select') {
      const over = strokes.current.some((s) => hits(s, e.clientX, e.clientY, 6));
      const cv = canvasRef.current;
      if (cv) cv.style.cursor = over ? 'move' : 'default';
      return;
    }
    if (toolRef.current === 'eraser') {
      if (e.buttons) erase(e.clientX, e.clientY);
      return;
    }
    const d = draft.current;
    if (!d) return;
    if (d.tool === 'pen' || d.tool === 'highlighter')
      d.points.push({ x: e.clientX, y: e.clientY });
    else d.points = [d.points[0], { x: e.clientX, y: e.clientY }];
    redraw();
  }

  // drag-to-scroll for the bar when it overflows (phones scroll natively by
  // touch; this covers mouse users). A 4px threshold keeps clicks working,
  // and a capture-phase click handler swallows the click after a real drag.
  const barRef = useRef<HTMLDivElement>(null);
  const barDrag = useRef({ down: false, moved: false, x: 0, left: 0 });
  function barDown(e: React.PointerEvent) {
    if (e.pointerType !== 'mouse' || !barRef.current) return;
    barDrag.current = {
      down: true,
      moved: false,
      x: e.clientX,
      left: barRef.current.scrollLeft,
    };
  }
  function barMove(e: React.PointerEvent) {
    const d = barDrag.current;
    if (!d.down || !barRef.current) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) < 4) return;
    d.moved = true;
    barRef.current.scrollLeft = d.left - dx;
  }
  function barUp() {
    barDrag.current.down = false;
  }
  function barClickCapture(e: React.MouseEvent) {
    if (barDrag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      barDrag.current.moved = false;
    }
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        className="ann-canvas"
        style={{
          pointerEvents: active && !inputDisabled ? 'auto' : 'none',
          cursor:
            tool === 'eraser' ? 'cell' : tool === 'select' ? 'default' : 'crosshair',
        }}
        onPointerDown={down}
        onPointerMove={move}
      />
      {/* 선택된 획들의 수정/삭제 칩 — 다중 선택은 일괄 삭제, 단일 텍스트만 수정 */}
      {active &&
        selected.length > 0 &&
        (() => {
          const valid = selected.filter((s) => strokes.current.includes(s));
          if (!valid.length) return null;
          const boxes = valid
            .map(strokeBBox)
            .filter((b): b is Box => b !== null);
          if (!boxes.length) return null;
          const b: Box = boxes.reduce((acc, cur) => {
            const left = Math.min(acc.left, cur.left);
            const top = Math.min(acc.top, cur.top);
            return {
              left,
              top,
              width: Math.max(acc.left + acc.width, cur.left + cur.width) - left,
              height: Math.max(acc.top + acc.height, cur.top + cur.height) - top,
            };
          });
          const canEdit = valid.length === 1 && valid[0].tool === 'text';
          const chipBtn: CSSProperties = {
            border: 'none',
            borderRadius: 999,
            padding: '5px 12px',
            background: 'transparent',
            color: '#e8e8ea',
            fontSize: 12.5,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            whiteSpace: 'nowrap',
          };
          return (
            <div
              data-capture-exclude
              style={{
                position: 'fixed',
                left: Math.min(b.left + b.width + 12, window.innerWidth - 140),
                top: Math.max(8, b.top - 10),
                zIndex: 93,
                display: 'flex',
                gap: 2,
                padding: 3,
                borderRadius: 999,
                background: 'rgba(28,28,30,0.88)',
                border: '1px solid rgba(255,255,255,0.14)',
              }}
            >
              {canEdit && (
                <button onClick={editSelected} style={chipBtn}>
                  수정
                </button>
              )}
              <button
                onClick={deleteSelected}
                style={{ ...chipBtn, color: '#ff8f8f' }}
              >
                삭제{valid.length > 1 ? ` (${valid.length})` : ''}
              </button>
            </div>
          );
        })()}
      {active && textEdit && (
        /* contentEditable — 내용이 길어지면 상자가 저절로 자란다 */
        <div
          ref={textRef}
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          data-tip="Enter 확정 · Shift+Enter 줄바꿈 · Esc 취소"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              commitText();
            }
            if (e.key === 'Escape') {
              e.stopPropagation();
              cancelText();
            }
          }}
          onBlur={() => {
            if (performance.now() - textBornAt.current < 250) {
              textRef.current?.focus();
              return;
            }
            commitText();
          }}
          style={{
            position: 'fixed',
            left: textEdit.x,
            top: textEdit.y - 4,
            zIndex: 93,
            minWidth: 60,
            maxWidth: '50vw',
            minHeight: fontPx(textEdit.size ?? size) * 1.5,
            padding: '3px 8px',
            background: 'rgba(10,10,14,0.55)',
            color: resolve(textEdit.color ?? color),
            fontFamily: TEXT_FAMILY,
            fontWeight: 600,
            fontSize: fontPx(textEdit.size ?? size),
            lineHeight: 1.35,
            whiteSpace: 'pre-wrap',
            border: `1.5px dashed ${resolve(textEdit.color ?? color)}`,
            borderRadius: 8,
            outline: 'none',
          }}
        />
      )}
      {active && (
        <div
          className="ann-bar"
          ref={barRef}
          onPointerDown={barDown}
          onPointerMove={barMove}
          onPointerUp={barUp}
          onPointerLeave={barUp}
          onClickCapture={barClickCapture}
        >
          {TOOLS.map((t) => (
            <button
              key={t.id}
              className={'ann-btn' + (tool === t.id ? ' on' : '')}
              data-tip={t.label}
              onClick={() => setTool(t.id)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={t.path} />
              </svg>
            </button>
          ))}
          <span className="ann-sep" />
          {COLORS.map((c) => (
            <button
              key={c}
              className={'ann-color' + (color === c ? ' on' : '')}
              data-tip="Color"
              onClick={() => setColor(c)}
              style={{ background: c }}
            />
          ))}
          <span className="ann-sep" />
          {SIZES.map((s) => (
            <button
              key={s}
              className={'ann-size' + (size === s ? ' on' : '')}
              data-tip="Stroke size"
              onClick={() => setSize(s)}
            >
              <span style={{ width: s + 4, height: s + 4 }} />
            </button>
          ))}
          <span className="ann-sep" />
          <button
            className="ann-btn"
            data-tip="Undo"
            onClick={() => {
              strokes.current = strokes.current.slice(0, -1);
              commit();
            }}
          >
            <IconUndo />
          </button>
          <button
            className="ann-btn"
            data-tip="Clear all"
            onClick={() => {
              strokes.current = [];
              commit();
            }}
          >
            <IconTrash />
          </button>
        </div>
      )}
    </>
  );
}
