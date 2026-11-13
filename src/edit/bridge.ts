/* 미리보기 iframe 브리지 — 같은 출처의 덱 문서를 밖에서 읽고 조작한다.
   엔진(src/deck)은 건드리지 않는다: 슬라이드 이동은 엔진이 이미 듣고 있는
   URL 해시로, 슬라이드 목록·노트·소스 위치는 React dev 빌드가 남기는
   fiber(_debugSource · element._source)에서 읽는다. dev 전용이라 가능한 방법.

   element._source(파일·줄·열)는 슬라이드 조작의 근거이기도 하다 — 이 좌표를 경계로
   서버가 원본을 토막 내므로, JSX 파서를 따로 만들지 않아도 순서·삭제·복제가 된다. */
import { Children, isValidElement } from 'react';

/** 슬라이드 하나가 원본 어디에서 왔는지 — [줄, 열] */
export type Anchor = [number, number];
export type SlideInfo = { label: string; notes?: string; anchor?: Anchor };
export type DeckInfo = { slides: SlideInfo[]; dir: string | null; file: string | null };
export type Picked = {
  text: string;
  hintFile?: string;
  hintLine?: number;
  /** 집은 요소부터 위로 올라가며 만난 소스 자리들(가까운 쪽부터) — 자리·크기를 찾을 때 쓴다.
      글자를 눌렀어도 옮기고 싶은 것은 그 글자를 담은 상자나 창일 때가 많다.
      중간에 src/walkthrough 같은 엔진 쪽 파일이 섞이므로 파일도 함께 들고 간다. */
  sources?: { file: string; line: number }[];
  rect: DOMRect;
};

type Fiber = {
  type?: { name?: string } | string;
  memoizedProps?: { children?: unknown };
  child?: Fiber | null;
  sibling?: Fiber | null;
  return?: Fiber | null;
  stateNode?: { current?: Fiber };
  _debugSource?: { fileName: string; lineNumber: number };
};

function reactKey(el: object, prefix: string) {
  return Object.keys(el).find((k) => k.startsWith(prefix));
}

function findFiber(root: Fiber, pred: (f: Fiber) => boolean): Fiber | null {
  const stack: Fiber[] = [root];
  let guard = 0;
  while (stack.length && guard++ < 20000) {
    const f = stack.pop()!;
    if (pred(f)) return f;
    if (f.sibling) stack.push(f.sibling);
    if (f.child) stack.push(f.child);
  }
  return null;
}

const dirOf = (file: string) => file.replace(/\\/g, '/').replace(/\/[^/]*$/, '');

/** 엔진 <Deck>의 자식 = 슬라이드 (Deck.tsx와 같은 Children.toArray) */
export function readDeck(doc: Document): DeckInfo | null {
  const rootEl = doc.getElementById('root');
  if (!rootEl) return null;
  const key = reactKey(rootEl, '__reactContainer$');
  if (!key) return null;
  const host = (rootEl as unknown as Record<string, Fiber>)[key];
  const current = host?.stateNode?.current ?? host;
  const deck = findFiber(current, (f) => typeof f.type === 'function' && f.type.name === 'Deck');
  if (!deck) return null;
  const kids = Children.toArray(deck.memoizedProps?.children as never);
  let file: string | null = null;
  const slides = kids.map((k, i) => {
    const el = isValidElement(k)
      ? (k as unknown as {
          props: Record<string, unknown>;
          _source?: { fileName: string; lineNumber: number; columnNumber?: number };
        })
      : null;
    const s = el?._source;
    if (s && !file) file = s.fileName.replace(/\\/g, '/');
    const nav = typeof el?.props.nav === 'string' ? el.props.nav : '';
    const notes = typeof el?.props.notes === 'string' ? el.props.notes : undefined;
    return {
      label: nav || `슬라이드 ${i + 1}`,
      notes,
      // 슬라이드가 전부 한 파일에서 왔을 때만 조작할 수 있다 (아래에서 거른다)
      anchor:
        s && s.fileName.replace(/\\/g, '/') === file
          ? ([s.lineNumber, s.columnNumber ?? 0] as Anchor)
          : undefined,
    };
  });
  return { slides, dir: file ? dirOf(file) : null, file };
}

/* 씬(타임라인) 슬라이드는 글자가 움직이는 동안에는 겨냥하기 어렵다. 엔진이 이미 듣고
   있는 CustomEvent로 재생을 멈추고 이어 간다 — 엔진은 건드리지 않는다.
   (규약은 src/scene/index.tsx의 SCENE_CONTROL_EVENT · SCENE_STATE_EVENT) */
export function sceneControl(doc: Document, action: 'play' | 'pause' | 'restart') {
  doc.defaultView?.dispatchEvent(
    new CustomEvent('deck-scene-control', { detail: { action } })
  );
}

/** 이 쪽에 움직이는 씬이 있는가 — 엔진이 알려 주는 재생 상태를 듣는다 */
export function watchScene(doc: Document, on: (s: { playing: boolean; has: boolean }) => void) {
  const win = doc.defaultView;
  if (!win) return () => {};
  const h = (e: Event) => {
    const d = (e as CustomEvent).detail as { playing?: boolean } | undefined;
    on({ playing: !!d?.playing, has: true });
  };
  win.addEventListener('deck-scene-state', h);
  return () => win.removeEventListener('deck-scene-state', h);
}

/** 지금 보는 쪽이 워크스루인가 — 클릭 대상(data-pt)과 포인터가 함께 있어야 한다.
    창을 옮기면 포인터가 찍는 자리를 다시 재야 하므로, 저장 전에 서버에 알려 준다.
    좌표·시각표는 <Deck> 자식 바깥에 있어서 소스만으로는 어느 쪽인지 가를 수 없다. */
export function isWalkthrough(doc: Document) {
  const slide = doc.querySelector('.slide.active') ?? doc.querySelector('.slide');
  if (!slide) return false;
  return !!slide.querySelector('[data-pt]') && !!doc.querySelector('[data-walkthrough-pointer]');
}

/** 좌표 아래의 글자(텍스트 노드) 하나를 집는다 */
export function pickTextAt(doc: Document, x: number, y: number): Picked | null {
  let node: Text | null = null;
  const caret = (doc as unknown as { caretRangeFromPoint?: (x: number, y: number) => Range | null })
    .caretRangeFromPoint?.(x, y);
  if (caret && caret.startContainer.nodeType === 3) node = caret.startContainer as Text;
  if (!node) {
    const el = doc.elementFromPoint(x, y);
    node = (Array.from(el?.childNodes ?? []).find(
      (c) => c.nodeType === 3 && (c.textContent ?? '').trim()
    ) ?? null) as Text | null;
  }
  if (!node || !node.data.trim() || node.parentElement?.closest('#__ed_hl')) return null;
  const range = doc.createRange();
  range.selectNodeContents(node);
  const rect = range.getBoundingClientRect();
  // caretRangeFromPoint는 글자 밖을 눌러도 가장 가까운 글자를 돌려주므로 범위를 확인
  const pad = 6;
  if (x < rect.left - pad || x > rect.right + pad || y < rect.top - pad || y > rect.bottom + pad)
    return null;
  const picked: Picked = { text: node.data.replace(/\s+/g, ' ').trim(), rect };
  const parent = node.parentElement;
  const fk = parent && reactKey(parent, '__reactFiber$');
  if (parent && fk) {
    let f: Fiber | null | undefined = (parent as unknown as Record<string, Fiber>)[fk];
    const src: { file: string; line: number }[] = [];
    // 위로 올라가며 서로 다른 자리를 열 개까지 모은다 (어느 파일인지는 부르는 쪽이 가린다)
    while (f && src.length < 10) {
      const s = f._debugSource;
      if (s) {
        const file = s.fileName.replace(/\\/g, '/');
        if (!src.some((x) => x.file === file && x.line === s.lineNumber))
          src.push({ file, line: s.lineNumber });
      }
      f = f.return;
    }
    if (src.length) {
      picked.hintFile = src[0].file;
      picked.hintLine = src[0].line;
      picked.sources = src;
    }
  }
  return picked;
}

/** 미리보기 문서 안에 그리는 선택 테두리 (덱 DOM은 건드리지 않고 떠 있는 상자 하나) */
export function drawHighlight(doc: Document, rect: DOMRect | null, solid = false) {
  let box = doc.getElementById(solid ? '__ed_sel' : '__ed_hl');
  if (!rect) {
    box?.remove();
    return;
  }
  if (!box) {
    box = doc.createElement('div');
    box.id = solid ? '__ed_sel' : '__ed_hl';
    box.style.cssText =
      'position:fixed;z-index:2147483647;pointer-events:none;border-radius:4px;' +
      (solid
        ? 'outline:2px solid #4fe5b0;background:rgba(79,229,176,.12);'
        : 'outline:1.5px dashed rgba(79,229,176,.9);');
    doc.body.appendChild(box);
  }
  box.style.left = `${rect.left - 4}px`;
  box.style.top = `${rect.top - 3}px`;
  box.style.width = `${rect.width + 8}px`;
  box.style.height = `${rect.height + 6}px`;
}
