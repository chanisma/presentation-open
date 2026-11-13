/* 로컬 덱 에디터 — ?app=edit (dev 서버 전용)
   덱은 로컬 파일이므로 DB 없이 Vite dev 서버의 /__edit API로 원본을 직접 고친다.

   ?app=edit            → 덱 고르기
   ?app=edit&deck=<id>  → 네이티브 React 덱 (레거시 HTML 덱은 다루지 않는다)

   편집 모델
   - 문구: 자유 TSX는 구조 편집이 불가능하므로 "보이는 글자를 눌러 그 문구만 바꾼다".
   - 슬라이드: 최상위 자식의 소스 위치(_source)를 경계로 원본을 토막 내 순서·삭제·복제·
     숨김·추가를 한다. 추가는 자리만 잡고, 담을 내용은 계획으로 적어 slides-plan.md에 모은다.
   - 문항: quiz.json만 폼으로 편집한다. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DECKS, DECK_MAP } from '../decks/registry';
import { api, type Candidate, type Geometry } from './api';
import {
  drawHighlight,
  isWalkthrough,
  pickTextAt,
  readDeck,
  sceneControl,
  watchScene,
  type DeckInfo,
  type Picked,
} from './bridge';
import QuizEditor from './QuizEditor';
import './edit.css';

const STAGE_W = 1600;
const STAGE_H = 900;

type Target = { id: string; title: string; src: string; quizJson?: string };

function resolveTarget(): Target | null {
  const id = new URLSearchParams(location.search).get('deck');
  if (!id || !DECK_MAP[id]) return null;
  const d = DECK_MAP[id];
  return { id, title: d.title, src: `/?deck=${id}`, quizJson: d.quizJson };
}

export default function EditorPage() {
  const target = useMemo(resolveTarget, []);
  useEffect(() => {
    document.title = target ? `편집 · ${target.title}` : '덱 에디터';
  }, [target]);
  return target ? <Workspace target={target} /> : <Picker />;
}

/* ── 덱 고르기 ─────────────────────────────────────────────────────── */
function Picker() {
  const [q, setQ] = useState('');
  const hit = (s: string) => s.toLowerCase().includes(q.trim().toLowerCase());
  const decks = DECKS.filter((d) => hit(`${d.title} ${d.subject ?? ''} ${d.id}`));
  const bySubject = new Map<string, typeof decks>();
  for (const d of decks) {
    const k = d.subject ?? '기타';
    bySubject.set(k, [...(bySubject.get(k) ?? []), d]);
  }
  return (
    <div className="ed-root ed-picker">
      <header className="ed-picker-head">
        <p className="ed-label">LOCAL · 이 컴퓨터의 파일을 직접 고칩니다</p>
        <h1>어느 덱을 고칠까요?</h1>
        <input
          className="ed-input"
          autoFocus
          placeholder="수업 이름으로 찾기"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <p className="ed-note">웹앱 덱(deck.tsx)만 다룹니다. HTML 덱은 원본을 직접 고쳐 주세요.</p>
      </header>
      <div className="ed-picker-cols">
        {[...bySubject].map(([subject, list]) => (
          <section key={subject}>
            <p className="ed-label">
              {subject} · {list.length}
            </p>
            {list.map((d) => (
              <a key={d.id} className="ed-row" href={`/?app=edit&deck=${d.id}`}>
                <span>{d.favicon}</span>
                <strong>{d.title}</strong>
                <em>{d.slides}장</em>
              </a>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

/* ── 작업 화면 ─────────────────────────────────────────────────────── */
type SrcItem = { hidden: boolean; label: string };
/** 레일 한 줄 — 소스 순서(숨긴 것 포함). visible은 화면에서 몇 번째인지 */
type RailItem = { hidden: boolean; label: string; notes?: string; visible: number | null };

function Workspace({ target }: { target: Target }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [deck, setDeck] = useState<DeckInfo | null>(null);
  const [srcList, setSrcList] = useState<SrcItem[] | null>(null);
  const [shift, setShift] = useState(0);
  const [noOps, setNoOps] = useState('');
  const [root, setRoot] = useState('');
  const [slide, setSlide] = useState(() => Math.max(0, Number(location.hash.slice(1) || 1) - 1));
  const slideRef = useRef(slide);
  slideRef.current = slide;
  const [mode, setMode] = useState<'pick' | 'use'>('pick');
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const [tab, setTab] = useState<'text' | 'quiz'>('text');
  const [busy, setBusy] = useState(false);
  /** 이 쪽이 씬(타임라인)인가, 지금 돌고 있는가 — 글자가 움직이면 겨냥이 어렵다 */
  const [scene, setScene] = useState<{ has: boolean; playing: boolean }>({
    has: false,
    playing: false,
  });
  /* 레일에서 고른 줄. 보통은 지금 보는 쪽이지만, 숨긴 슬라이드도 골라야
     다시 보이게 할 수 있으므로 화면의 쪽 번호와 따로 둔다. */
  const [railSel, setRailSel] = useState(0);
  const [inserting, setInserting] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newPlan, setNewPlan] = useState('');

  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');
  const [hint, setHint] = useState<{ file?: string; lines?: number[] }>({});
  const [cands, setCands] = useState<Candidate[] | null>(null);
  const [chosen, setChosen] = useState(0);
  /** 화면 글자가 여러 조각이라 앞부분 몇 낱말로 좁혀 찾았을 때 알려 준다 */
  const [narrowed, setNarrowed] = useState<{ words: number; total: number } | null>(null);
  /* 집은 요소의 자리·크기. 구체적인 값을 다 열지 않고 "통째로 옮기고 키우는" 것만 다룬다 */
  const [geos, setGeos] = useState<Geometry[]>([]);
  const [geoIdx, setGeoIdx] = useState(0);
  const [geoNums, setGeoNums] = useState<Record<string, number>>({});
  const [geoBusy, setGeoBusy] = useState(false);
  const [status, setStatus] = useState<{ msg: string; bad?: boolean } | null>(null);
  const [undoCount, setUndoCount] = useState(0);

  useEffect(() => {
    api
      .info()
      .then((i) => {
        setRoot(i.root);
        setUndoCount(i.undo);
      })
      .catch(() =>
        setStatus({
          msg: '에디터 API에 연결하지 못했습니다. npm run dev로 연 화면인지 확인해 주세요.',
          bad: true,
        })
      );
  }, []);

  /* 수업 폴더·소스 파일 — 슬라이드 요소의 소스 경로(절대)를 프로젝트 기준으로 줄인다 */
  const rel = useCallback(
    (abs: string | null) => (abs && root && abs.startsWith(root) ? abs.slice(root.length + 1) : abs ?? ''),
    [root]
  );
  const dir = useMemo(() => {
    const d = rel(deck?.dir ?? null);
    return d || (target.quizJson ? target.quizJson.replace(/\/[^/]*$/, '') : '');
  }, [deck, rel, target.quizJson]);
  const srcFile = useMemo(() => rel(deck?.file ?? null), [deck, rel]);
  const quizFile = target.quizJson || (dir ? `${dir}/quiz.json` : '');

  /* 레일 = 소스 순서(숨긴 것 포함). 보이는 항목은 화면(fiber)에서 이름·노트를 가져온다 */
  const rail: RailItem[] = useMemo(() => {
    if (!deck) return [];
    const plain = deck.slides.map((s, i) => ({
      hidden: false,
      label: s.label,
      notes: s.notes,
      visible: i,
    }));
    if (!srcList) return plain;
    if (srcList.filter((x) => !x.hidden).length !== deck.slides.length) return plain;
    let v = 0;
    return srcList.map((it) => {
      if (it.hidden) return { hidden: true, label: it.label || '숨긴 슬라이드', visible: null };
      const s = deck.slides[v];
      return { hidden: false, label: s?.label ?? it.label, notes: s?.notes, visible: v++ };
    });
  }, [deck, srcList]);
  const canOps = !!srcList && rail.length === srcList.length && !noOps;

  /* 미리보기에서 쪽을 넘기면 레일의 선택도 그 줄로 따라간다 */
  useEffect(() => {
    const k = rail.findIndex((r) => r.visible === slide);
    if (k >= 0) setRailSel(k);
  }, [slide, rail]);

  /* 무대 배율 — 1600×900 고정 렌더를 가운데 칸에 맞춰 줄인다 (발표 때와 같은 구도) */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setScale(Math.min((r.width - 48) / STAGE_W, (r.height - 96) / STAGE_H));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const doc = () => frameRef.current?.contentDocument ?? null;

  const goto = useCallback((idx: number) => {
    const d = doc();
    const win = frameRef.current?.contentWindow;
    if (!d || !win) return;
    setSlide(idx);
    history.replaceState(null, '', `#${idx + 1}`);
    win.location.hash = `#${idx + 1}`;
    drawHighlight(d, null);
    drawHighlight(d, null, true);
  }, []);

  /* 덱을 다시 읽는다 — 화면(fiber)에서 슬라이드를 읽고, 서버에 원본 경계를 물어
     줄 번호 밀림과 숨긴 슬라이드를 받아 온다 */
  const reread = useCallback(() => {
    const d = doc();
    if (!d) return false;
    const info = readDeck(d);
    if (!info) return false;
    setDeck(info);
    const anchors = info.slides.map((s) => s.anchor).filter(Boolean) as [number, number][];
    const file = info.file && root && info.file.startsWith(root) ? info.file.slice(root.length + 1) : '';
    if (!file || anchors.length !== info.slides.length) {
      setNoOps('이 덱은 슬라이드 위치를 읽지 못해 순서를 바꿀 수 없습니다.');
      return true;
    }
    api
      .anchors(file, anchors)
      .then((r) => {
        if (r.ok && r.list) {
          setSrcList(r.list);
          setShift(r.shift ?? 0);
          setNoOps('');
        } else {
          setSrcList(null);
          setNoOps(r.reason ?? '슬라이드 경계를 읽지 못했습니다.');
        }
      })
      .catch((e) => setNoOps(String((e as Error).message)));
    return true;
  }, [root]);
  const rereadRef = useRef(reread);
  rereadRef.current = reread;

  /* 글자를 집었을 때 — 원본 후보 찾기 */
  const search = useCallback(
    async (text: string, h: { file?: string; lines?: number[] }) => {
      if (!text.trim() || !dir) return;
      try {
        // 화면이 알려 주는 줄 번호는 dev 변환의 머리말만큼 밀려 있다
        const lines = h.lines?.map((n) => Math.max(1, n - shift));
        const { candidates, words, total } = await api.locate({
          text,
          dir,
          hintFile: h.file,
          hintLine: lines?.[0],
          hintLines: lines,
        });
        setCands(candidates);
        setChosen(0);
        setNarrowed(words < total ? { words, total } : null);
        // 고친 결과가 엉뚱한 자리를 덮지 않도록, 실제로 맞은 그 조각을 편집 상자에 넣는다
        if (candidates.length) setReplace(candidates[0].display);
        setStatus(null);
      } catch (e) {
        setStatus({ msg: String((e as Error).message), bad: true });
      }
    },
    [dir, shift]
  );
  const searchRef = useRef(search);
  searchRef.current = search;

  /* 집은 요소의 소스 줄에서 자리·크기를 찾는다 (줄 번호는 dev 변환만큼 밀려 있다) */
  const lookGeometry = useCallback(
    (sources?: { file: string; line: number }[]) => {
      setGeos([]);
      setGeoNums({});
      if (!sources?.length || !root || !dir) return;
      // 조상 중에는 src/walkthrough 같은 엔진 파일도 섞인다 — 이 수업 폴더의 것만 본다
      const mine = sources
        .filter((s) => s.file.startsWith(`${root}/${dir}/`))
        .map((s) => ({ rel: s.file.slice(root.length + 1), line: Math.max(1, s.line - shift) }));
      const first = mine[0];
      if (!first) return;
      api
        .geometry(
          first.rel,
          first.line,
          mine.filter((m) => m.rel === first.rel).map((m) => m.line)
        )
        .then((r) => {
          setGeos(r.items);
          setGeoIdx(0);
          setGeoNums(r.items[0]?.nums ?? {});
        })
        .catch(() => setGeos([]));
    },
    [root, shift, dir]
  );
  const lookGeoRef = useRef(lookGeometry);
  lookGeoRef.current = lookGeometry;

  const onPicked = (p: Picked) => {
    setTab('text');
    setInserting(null);
    setFind(p.text);
    setReplace(p.text);
    // 조상 사슬 중 이 수업 폴더의 자리만 힌트로 쓴다 (엔진 쪽 파일이 섞여 있다)
    const mine = (p.sources ?? []).filter((s) => !root || s.file.startsWith(`${root}/${dir}/`));
    const h = { file: mine[0]?.file ?? p.hintFile, lines: mine.map((s) => s.line) };
    setHint(h);
    searchRef.current(p.text, h);
    lookGeoRef.current(p.sources);
  };
  const onPickedRef = useRef(onPicked);
  onPickedRef.current = onPicked;

  /* iframe이 뜰 때마다: 덱 읽기 + 집기 리스너 설치 */
  const onLoad = () => {
    const d = doc();
    if (!d) return;
    let tries = 0;
    const wait = setInterval(() => {
      if (rereadRef.current() || ++tries > 40) clearInterval(wait);
    }, 150);

    const block = (e: Event) => {
      if (modeRef.current !== 'pick') return;
      e.preventDefault();
      e.stopPropagation();
    };
    d.addEventListener(
      'mousemove',
      (e) => {
        if (modeRef.current !== 'pick') {
          d.body.style.cursor = '';
          return drawHighlight(d, null);
        }
        const hit = pickTextAt(d, e.clientX, e.clientY);
        // 고치기 모드에서는 덱의 커서를 덮는다 — 지금 누를 수 있는 것은 글자뿐이다
        d.body.style.cursor = hit ? 'pointer' : 'default';
        drawHighlight(d, hit?.rect ?? null);
      },
      true
    );
    d.addEventListener('mouseleave', () => drawHighlight(d, null), true);
    watchScene(d, setScene);
    for (const t of ['pointerdown', 'mousedown', 'mouseup', 'pointerup', 'dblclick'])
      d.addEventListener(t, block, true);
    d.addEventListener(
      'click',
      (e) => {
        if (modeRef.current !== 'pick') return;
        block(e);
        const p = pickTextAt(d, e.clientX, e.clientY);
        drawHighlight(d, p?.rect ?? null, true);
        if (p) onPickedRef.current(p);
      },
      true
    );
  };

  /* 쪽을 옮기면 씬 상태를 초기화한다 — 새 쪽이 씬인지는 엔진이 다시 알려 준다 */
  useEffect(() => {
    setScene({ has: false, playing: false });
  }, [slide]);

  /* 현재 쪽 추적 — 미리보기 안에서 키보드로 넘겨도 따라간다 */
  useEffect(() => {
    const t = setInterval(() => {
      const win = frameRef.current?.contentWindow;
      if (!win) return;
      const now = Math.max(0, Number(win.location.hash.slice(1) || 1) - 1);
      if (now !== slideRef.current) {
        setSlide(now);
        history.replaceState(null, '', `#${now + 1}`);
      }
    }, 400);
    return () => clearInterval(t);
  }, []);

  /* 저장 뒤 — HMR이 미리보기를 갈아 끼우므로 조금 기다렸다 덱을 다시 읽는다 */
  const afterWrite = () => {
    const d = doc();
    if (d) drawHighlight(d, null, true);
    setTimeout(() => rereadRef.current(), 900);
  };

  /* 같은 글자가 nav와 본문에 함께 있는 일이 잦다. 고른 한 곳만 바꾸는 것이 기본이고,
     같은 글자인 자리들은 한꺼번에 바꿀 수 있게 따로 단추를 둔다. */
  const twins = useMemo(() => {
    const c = cands?.[chosen];
    if (!c || !cands) return [];
    return cands.filter((x) => x.file === c.file && x.display === c.display);
  }, [cands, chosen]);

  const save = async (all = false) => {
    const c = cands?.[chosen];
    if (!c) return;
    const spots = all ? twins : [c];
    try {
      const r = await api.patch(spots, replace, dir);
      setStatus({
        msg: `${r.file.split('/').pop()}의 ${r.count > 1 ? `${r.count}곳을` : `${r.line}번째 줄을`} 고쳤습니다`,
      });
      setUndoCount(r.undo);
      setCands(null);
      setFind('');
      setReplace('');
      afterWrite();
    } catch (e) {
      setStatus({ msg: String((e as Error).message), bad: true });
    }
  };

  const undo = async () => {
    try {
      const r = await api.undo();
      setUndoCount(r.undo);
      setStatus({ msg: `${r.files.join(', ')}의 마지막 저장을 되돌렸습니다` });
      reload(slideRef.current);
    } catch (e) {
      setStatus({ msg: String((e as Error).message), bad: true });
    }
  };

  /** 슬라이드가 늘거나 줄면 미리보기를 통째로 다시 읽는다.
      같은 주소로 replace하면 브라우저가 해시 이동으로 보고 문서를 다시 읽지 않으므로,
      해시를 맞춘 뒤 reload를 부른다. */
  const reload = (at: number) => {
    setSlide(at);
    history.replaceState(null, '', `#${at + 1}`);
    setTimeout(() => {
      const w = frameRef.current?.contentWindow;
      if (!w) return;
      w.location.hash = `#${at + 1}`;
      w.location.reload();
    }, 400);
  };

  /* 슬라이드 조작 — 서버가 원본을 토막 내 다시 붙이고 quiz.json·registry까지 맞춘다.
     index는 레일(소스) 순서다. 숨긴 슬라이드도 한 자리를 차지한다. */
  const slideOp = async (
    op: 'move' | 'delete' | 'duplicate' | 'hide' | 'show' | 'insert',
    index: number,
    extra?: { to?: number; title?: string; plan?: string }
  ) => {
    if (!deck || !canOps || busy) return;
    if (op === 'delete' && !confirm(`${index + 1}번째 슬라이드를 지울까요?`)) return;
    setBusy(true);
    try {
      const r = await api.slides({
        file: srcFile,
        anchors: deck.slides.map((s) => s.anchor!),
        op,
        index,
        to: extra?.to,
        dir,
        deckId: target.id,
        quizFile,
        title: extra?.title,
        plan: extra?.plan,
      });
      const label = {
        move: '옮겼습니다',
        delete: '지웠습니다',
        duplicate: '복제했습니다',
        hide: '숨겼습니다',
        show: '다시 보이게 했습니다',
        insert: '아래에 빈 슬라이드를 넣었습니다',
      }[op];
      setStatus({
        msg:
          `${index + 1}번째 슬라이드를 ${label} (화면에 ${r.slides}장)` +
          (r.planId ? ` · 계획은 slides-plan.md의 ${r.planId}` : ''),
      });
      setUndoCount(r.undo);
      // 옮기거나 새로 넣은 자리를 계속 보고 있게 한다 (화면 기준 번호로 환산)
      const vis = rail[index]?.visible ?? slideRef.current;
      const at =
        op === 'insert'
          ? Math.min(vis + 1, r.slides - 1)
          : op === 'duplicate'
            ? Math.min(vis + 1, r.slides - 1)
            : Math.min(Math.max(vis, 0), r.slides - 1);
      reload(at);
    } catch (e) {
      setStatus({ msg: String((e as Error).message), bad: true });
    } finally {
      setBusy(false);
    }
  };

  /* 자리·크기 저장. 워크스루면 서버가 포인터를 다시 재서 같이 고친다 */
  const saveGeometry = async () => {
    const g = geos[geoIdx];
    if (!g || !deck) return;
    setGeoBusy(true);
    setStatus({ msg: '저장하는 중입니다. 워크스루면 포인터를 다시 재느라 시간이 걸립니다.' });
    try {
      const r = await api.geometrySave({
        file: srcFile,
        start: g.start,
        end: g.end,
        expect: g.text,
        kind: g.kind,
        nums: geoNums,
        dir,
        deckId: target.id,
        slideNo: slide + 1,
        // 워크스루면 서버가 고치기 전후로 포인터를 재서 찍는 자리를 맞춰 준다
        walkthrough: !!doc() && isWalkthrough(doc()!),
      });
      setUndoCount(r.undo);
      setStatus({
        msg:
          `${r.file.split('/').pop()} ${r.line}번째 줄의 자리를 고쳤습니다` +
          (r.fixes.length
            ? ` · 워크스루 포인터 ${r.fixes.length}곳을 다시 재서 맞췄습니다 (${r.fixes.join(', ')})`
            : r.walkthrough
              ? ` · 워크스루입니다. ${r.skipped ?? '포인터는 그대로여도 됩니다'}`
              : '') +
          (r.misses.length ? ` · ⚠ 아직 닿지 않는 자리: ${r.misses.join(', ')}` : ''),
        bad: r.misses.length > 0,
      });
      setGeos([]);
      afterWrite();
    } catch (e) {
      setStatus({ msg: String((e as Error).message), bad: true });
    } finally {
      setGeoBusy(false);
    }
  };

  const addSlide = async () => {
    if (inserting === null) return;
    const at = inserting;
    setInserting(null);
    await slideOp('insert', at, { title: newTitle, plan: newPlan });
    setNewTitle('');
    setNewPlan('');
  };

  const cur = rail.find((r) => r.visible === slide);
  const notes = cur?.notes;
  const editNotes = () => {
    if (!notes) return;
    setTab('text');
    setInserting(null);
    setFind(notes);
    setReplace(notes);
    setHint({});
    search(notes, {});
  };

  const shown = rail.filter((r) => !r.hidden).length;

  return (
    <div className="ed-root ed-work">
      <header className="ed-top">
        <a className="ed-back" href="/?app=edit" title="덱 고르기">
          ←
        </a>
        <div className="ed-title">
          <strong>{target.title}</strong>
          <span className="ed-path">{dir || '수업 폴더 확인 중'}</span>
        </div>
        <div className="ed-seg" role="tablist" aria-label="미리보기 동작">
          <button
            className={mode === 'pick' ? 'is-on' : ''}
            onClick={() => setMode('pick')}
            title="글자를 눌러 고칩니다"
          >
            ✎ 고치기
          </button>
          <button
            className={mode === 'use' ? 'is-on' : ''}
            onClick={() => setMode('use')}
            title="덱을 평소처럼 눌러 봅니다 (빌드·버튼)"
          >
            ☝ 눌러 보기
          </button>
        </div>
        {/* 씬 슬라이드에서만 — 글자가 움직이는 동안에는 겨냥이 어려우니 세워 놓고 고친다 */}
        {scene.has && (
          <button
            className="ed-btn"
            title="움직이는 장면을 세우거나 다시 돌립니다"
            onClick={() => {
              const d = doc();
              if (d) sceneControl(d, scene.playing ? 'pause' : 'play');
            }}
          >
            {scene.playing ? '⏸ 장면 멈춤' : '▶ 장면 재생'}
          </button>
        )}
        <span className="ed-spacer" />
        <button className="ed-btn" disabled={!undoCount} onClick={undo}>
          ↶ 되돌리기{undoCount ? ` ${undoCount}` : ''}
        </button>
        <a
          className="ed-btn"
          href={`/?deck=${target.id}#${slide + 1}`}
          target="_blank"
          rel="noreferrer"
        >
          발표 화면으로 열기 ↗
        </a>
      </header>

      <nav className="ed-rail" aria-label="슬라이드 목록">
        <p className="ed-label">
          {deck ? `${shown}쪽${rail.length > shown ? ` · 숨김 ${rail.length - shown}` : ''}` : '읽는 중'}
        </p>
        {rail.map((s, i) => (
          <div
            key={i}
            className={`ed-rail-item${railSel === i ? ' is-on' : ''}${
              s.hidden ? ' is-hidden' : ''
            }${inserting === i ? ' is-adding' : ''}`}
          >
            <button
              className="ed-rail-go"
              onClick={() => {
                setRailSel(i);
                if (s.visible !== null) goto(s.visible);
              }}
              title={s.hidden ? '숨긴 슬라이드 — 화면에는 나오지 않습니다' : undefined}
            >
              <span className="ed-num">{s.hidden ? '––' : String(s.visible! + 1).padStart(2, '0')}</span>
              <span className="ed-rail-label">{s.label}</span>
            </button>
            {canOps && (
              <span className="ed-rail-tools">
                <button disabled={i === 0 || busy} title="위로" onClick={() => slideOp('move', i, { to: i - 1 })}>
                  ↑
                </button>
                <button
                  disabled={i === rail.length - 1 || busy}
                  title="아래로"
                  onClick={() => slideOp('move', i, { to: i + 1 })}
                >
                  ↓
                </button>
                <button
                  disabled={busy}
                  title={s.hidden ? '다시 보이기' : '숨기기'}
                  onClick={() => slideOp(s.hidden ? 'show' : 'hide', i)}
                >
                  {s.hidden ? '◉' : '◌'}
                </button>
                <button
                  disabled={busy}
                  title="이 아래에 빈 슬라이드 추가"
                  onClick={() => {
                    setInserting(i);
                    setTab('text');
                  }}
                >
                  ＋
                </button>
                <button disabled={busy} title="복제" onClick={() => slideOp('duplicate', i)}>
                  ⧉
                </button>
                <button
                  disabled={rail.length < 2 || busy}
                  title="삭제"
                  onClick={() => slideOp('delete', i)}
                >
                  ✕
                </button>
              </span>
            )}
          </div>
        ))}
        {deck && noOps && <p className="ed-note">{noOps}</p>}
      </nav>

      <main className="ed-stage" ref={stageRef}>
        <div
          className={`ed-frame${mode === 'pick' ? ' is-pick' : ''}`}
          style={{ width: STAGE_W * scale, height: STAGE_H * scale }}
        >
          <iframe
            ref={frameRef}
            title="덱 미리보기"
            src={`${target.src}#${slide + 1}`}
            onLoad={onLoad}
            style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})` }}
          />
        </div>
        <div className="ed-stage-foot">
          <button className="ed-btn" disabled={slide <= 0} onClick={() => goto(slide - 1)}>
            ‹
          </button>
          <span className="ed-num">
            {slide + 1} / {shown || '–'}
          </span>
          <button className="ed-btn" disabled={slide >= shown - 1} onClick={() => goto(slide + 1)}>
            ›
          </button>
        </div>
      </main>

      <aside className="ed-side">
        <div className="ed-tabs" role="tablist">
          <button className={tab === 'text' ? 'is-on' : ''} onClick={() => setTab('text')}>
            문구
          </button>
          <button className={tab === 'quiz' ? 'is-on' : ''} onClick={() => setTab('quiz')}>
            문항
          </button>
        </div>

        {status && (
          <p className={`ed-note${status.bad ? ' ed-note--bad' : ' ed-note--ok'}`}>{status.msg}</p>
        )}

        {tab === 'text' && inserting !== null && (
          <div className="ed-panel">
            <p className="ed-label">빈 슬라이드 · {inserting + 1}번째 아래</p>
            <p className="ed-note">
              자리만 잡습니다. 아래에 적은 맥락은 <code>slides-plan.md</code>에 모아 두었다가
              나중에 인공지능이 읽고 슬라이드를 만듭니다.
            </p>
            <input
              className="ed-input"
              autoFocus
              placeholder="자리 이름 (선택)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <textarea
              className="ed-input"
              rows={8}
              placeholder="여기에 무엇을 담고 싶은지 편하게 적어 주세요. 형태나 구성은 정하지 않아도 됩니다."
              value={newPlan}
              onChange={(e) => setNewPlan(e.target.value)}
            />
            <div className="ed-row-btns">
              <button className="ed-btn ed-btn--primary" disabled={busy} onClick={addSlide}>
                자리 만들기
              </button>
              <button className="ed-btn ed-btn--ghost" onClick={() => setInserting(null)}>
                취소
              </button>
            </div>
          </div>
        )}

        {tab === 'text' && inserting === null && (
          <div className="ed-panel">
            <p className="ed-label">찾을 문구</p>
            <textarea
              className="ed-input"
              rows={3}
              placeholder="미리보기에서 글자를 누르면 여기에 들어옵니다"
              value={find}
              onChange={(e) => setFind(e.target.value)}
            />
            <button
              className="ed-btn ed-btn--ghost"
              disabled={!find.trim() || !dir}
              onClick={() => search(find, hint)}
            >
              원본에서 찾기
            </button>

            {cands && (
              <>
                <p className="ed-label">원본 위치 · {cands.length ? `${cands.length}곳` : '없음'}</p>
                {narrowed && !!cands.length && (
                  <p className="ed-note">
                    화면의 글자가 원본에서는 여러 조각으로 나뉘어 있어서, 앞의 {narrowed.words}낱말만
                    잡았습니다(전체 {narrowed.total}낱말). 아래 「바꿀 문구」에 든 그 조각만 바뀝니다.
                  </p>
                )}
                {!cands.length && (
                  <p className="ed-note">
                    원본에서 이 문구를 찾지 못했습니다. 계산해서 만든 글자이거나 이미지 안의 글씨일
                    수 있습니다. 「찾을 문구」를 다른 낱말로 바꿔서 다시 찾아 주세요.
                  </p>
                )}
                <div className="ed-cands">
                  {cands.map((c, i) => (
                    <button
                      key={`${c.file}:${c.start}`}
                      className={`ed-cand${i === chosen ? ' is-on' : ''}`}
                      onClick={() => {
                        setChosen(i);
                        setReplace(c.display);
                      }}
                    >
                      <span className="ed-num">
                        {c.file.split('/').pop()}:{c.line}
                        {c.hinted && <em className="ed-here">누른 자리</em>}
                      </span>
                      <code>{c.preview}</code>
                    </button>
                  ))}
                </div>
              </>
            )}

            {!!cands?.length && (
              <>
                <p className="ed-label">바꿀 문구</p>
                <textarea
                  className="ed-input"
                  rows={Math.min(12, Math.max(3, Math.ceil(replace.length / 28)))}
                  value={replace}
                  onChange={(e) => setReplace(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') save(false);
                  }}
                />
                <div className="ed-row-btns">
                  <button
                    className="ed-btn ed-btn--primary"
                    disabled={replace === cands[chosen]?.display}
                    onClick={() => save(false)}
                  >
                    이 자리만 저장 <kbd>Ctrl ↵</kbd>
                  </button>
                  {twins.length > 1 && (
                    <button
                      className="ed-btn"
                      disabled={replace === cands[chosen]?.display}
                      title="같은 글자가 든 자리를 한꺼번에 바꿉니다"
                      onClick={() => save(true)}
                    >
                      {twins.length}곳 모두
                    </button>
                  )}
                </div>
                {twins.length > 1 && (
                  <p className="ed-note">
                    같은 글자가 이 파일에 {twins.length}곳 있습니다(
                    {twins
                      .map((t) => t.line)
                      .sort((a, b) => a - b)
                      .join('·')}
                    번째 줄). 제목과 레일 이름처럼 짝지어 적은 것이면 함께 바꾸는 편이 낫습니다.
                  </p>
                )}
              </>
            )}

            {!!geos.length && (
              <>
                <p className="ed-label">자리·크기</p>
                {geos.length > 1 && (
                  <div className="ed-seg ed-geo-pick">
                    {geos.map((g, i) => (
                      <button
                        key={`${g.start}`}
                        className={i === geoIdx ? 'is-on' : ''}
                        onClick={() => {
                          setGeoIdx(i);
                          setGeoNums(g.nums);
                        }}
                      >
                        {g.kind === 'rect' ? g.label.split(' ')[0] : `${g.line}줄`}
                      </button>
                    ))}
                  </div>
                )}
                <p className="ed-note">
                  {geos[geoIdx].label} · <code>{geos[geoIdx].text.slice(0, 60)}</code>
                </p>
                <div className="ed-geo">
                  {Object.keys(geos[geoIdx].nums).map((k) => (
                    <label key={k}>
                      <span>{{ x: '가로', y: '세로', w: '너비', h: '높이' }[k] ?? k}</span>
                      <input
                        type="number"
                        className="ed-input"
                        value={geoNums[k] ?? 0}
                        onChange={(e) => setGeoNums({ ...geoNums, [k]: Number(e.target.value) })}
                      />
                    </label>
                  ))}
                </div>
                <div className="ed-row-btns">
                  <button
                    className="ed-btn ed-btn--primary"
                    disabled={
                      geoBusy ||
                      Object.entries(geoNums).every(([k, v]) => geos[geoIdx].nums[k] === v)
                    }
                    onClick={saveGeometry}
                  >
                    자리 저장
                  </button>
                  {/* 상단의 「↶ 되돌리기」(저장 취소)와 헷갈리지 않게 이름을 달리한다 */}
                  <button className="ed-btn ed-btn--ghost" onClick={() => setGeoNums(geos[geoIdx].nums)}>
                    원래 값으로
                  </button>
                </div>
              </>
            )}

            <p className="ed-label">발표자 노트 · {slide + 1}쪽</p>
            {notes ? (
              <>
                <p className="ed-notes">{notes}</p>
                <button className="ed-btn ed-btn--ghost" onClick={editNotes}>
                  이 노트 고치기
                </button>
              </>
            ) : (
              <p className="ed-note">이 쪽에는 발표자 노트가 없습니다.</p>
            )}
          </div>
        )}

        {tab === 'quiz' &&
          (quizFile ? (
            <QuizEditor
              file={quizFile}
              dir={dir}
              slide={slide}
              onSaved={(msg, undoCount) => {
                setStatus({ msg });
                setUndoCount(undoCount);
              }}
            />
          ) : (
            <p className="ed-note">수업 폴더를 확인하는 중입니다.</p>
          ))}
      </aside>
    </div>
  );
}
