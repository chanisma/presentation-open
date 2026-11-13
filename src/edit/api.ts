/* 로컬 에디터 API 클라이언트 — 서버는 scripts/deck-editor-api.mjs (dev 전용) */

export type Candidate = {
  file: string;
  start: number;
  end: number;
  /** 소스에 있는 그대로 — 저장할 때 이 자리가 그대로인지 확인하는 데 쓴다 */
  expect: string;
  /** 사람이 읽는 꼴(이스케이프를 푼 것) — 편집 상자에 이걸 넣는다 */
  display: string;
  line: number;
  preview: string;
  /** 방금 미리보기에서 누른 그 자리인가 */
  hinted: boolean;
  inLiteral: boolean;
};

/** 고칠 수 있는 자리·크기 한 덩어리 — abs(x,y,w,h) 호출이거나 이름 붙인 상자 */
export type Geometry = {
  kind: 'abs' | 'rect';
  start: number;
  end: number;
  text: string;
  nums: Record<string, number>;
  line: number;
  label: string;
};

async function call<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({ error: `응답을 읽지 못했습니다 (${res.status})` }));
  if (!res.ok) throw new Error(json.error ?? `요청 실패 (${res.status})`);
  return json as T;
}

export const api = {
  info: () => call<{ root: string; undo: number }>('GET', '/__edit/info'),
  /** words < total이면 화면 글자가 여러 조각이라 앞부분 몇 낱말로 좁혀 찾았다는 뜻 */
  locate: (q: {
    text: string;
    dir: string;
    hintFile?: string;
    hintLine?: number;
    /** 누른 요소부터 위로 올라가며 만난 소스 줄들 — 어느 후보가 그 자리인지 가리는 데 쓴다 */
    hintLines?: number[];
  }) =>
    call<{ candidates: Candidate[]; words: number; total: number }>('POST', '/__edit/locate', q),
  /** dir(수업 폴더)은 편집 기록을 남길 자리를 정한다 — 서버가 edits.md를 여기에 쓴다.
      spots를 여럿 주면 같은 파일의 그 자리들을 한꺼번에 바꾼다. */
  patch: (spots: Candidate[], replacement: string, dir: string) =>
    call<{ ok: true; file: string; line: number; count: number; undo: number }>(
      'POST',
      '/__edit/patch',
      {
        file: spots[0].file,
        spots: spots.map((c) => ({ start: c.start, end: c.end, expect: c.expect })),
        replacement,
        dir,
      }
    ),
  /** 덱을 읽은 직후 한 번 — 줄 번호 밀림(dev 변환의 머리말 길이)과 조작 가능 여부를 받는다 */
  anchors: (file: string, anchors: [number, number][]) =>
    call<{
      ok: boolean;
      shift?: number;
      /** 숨긴 슬라이드까지 포함한 소스 기준 목록 — 레일이 이 순서로 그린다 */
      list?: { hidden: boolean; label: string }[];
      reason?: string;
    }>('POST', '/__edit/anchors', { file, anchors }),
  /** 슬라이드 조작 — anchors(각 슬라이드의 원본 줄·열)가 서버가 자를 경계다 */
  slides: (q: {
    file: string;
    anchors: [number, number][];
    op: 'move' | 'delete' | 'duplicate' | 'hide' | 'show' | 'insert';
    index: number;
    to?: number;
    dir: string;
    deckId?: string;
    quizFile?: string;
    /** insert 전용 — 자리 이름과, 그 자리에 무엇을 담고 싶은지 적은 맥락 */
    title?: string;
    plan?: string;
  }) =>
    call<{ ok: true; file: string; slides: number; undo: number; planId?: string }>(
      'POST',
      '/__edit/slides',
      q
    ),
  /** 집은 요소 언저리에서 고칠 수 있는 자리·크기를 찾는다 */
  geometry: (file: string, line: number, lines?: number[]) =>
    call<{ items: Geometry[] }>('POST', '/__edit/geometry', { file, line, lines }),
  /** 자리·크기 저장. 워크스루 슬라이드면 서버가 포인터를 다시 재서 함께 고친다 */
  geometrySave: (q: {
    file: string;
    start: number;
    end: number;
    expect: string;
    kind: 'abs' | 'rect';
    nums: Record<string, number>;
    dir: string;
    deckId?: string;
    slideNo?: number;
    walkthrough?: boolean;
  }) =>
    call<{
      ok: true;
      file: string;
      line: number;
      undo: number;
      walkthrough: boolean;
      fixes: string[];
      /** 다시 재고도 화살촉이 닿지 않는 자리 — 사람이 봐야 한다 */
      misses: string[];
      skipped: string | null;
    }>('POST', '/__edit/geometry/save', q),
  undo: () => call<{ ok: true; file: string; files: string[]; undo: number }>('POST', '/__edit/undo'),
  readJson: <T>(file: string) =>
    call<{ exists: boolean; data: T | null }>('GET', `/__edit/json?file=${encodeURIComponent(file)}`),
  writeJson: (file: string, data: unknown, dir: string) =>
    call<{ ok: true; file: string; undo: number }>('POST', '/__edit/json', { file, data, dir }),
};
