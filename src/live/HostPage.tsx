import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  loadArchive,
  loadCharts,
  loadConfig,
  loadDriver,
  loadQrLib,
  type Channel,
  type ConfigModule,
  type Driver,
  type HostState,
  type LiveActivity,
} from './runtime';
import { DECKS } from '../decks/registry';
import './live.css';

/* ── 교사 콘솔 (클래식 live/host의 React 재구현, bolt 디자인) ──
   RPC 계약·3동사(열기→공개→닫기)·broadcast payload는 클래식과 동일. */

const KIND_LABEL: Record<string, string> = {
  choice: '객관식', ox: 'OX', short: '주관식', wordcloud: '워드클라우드',
  exit: '출구티켓', code: '코드',
};
const ST_LABEL: Record<string, string> = { open: '진행 중', closed: '닫힘', revealed: '공개됨' };

type SessionInfo = {
  sessionId: string;
  code: string;
  hostToken: string;
  title?: string;
  deckPath?: string | null;
  archiveUrl?: string; // 결과 저장 시트 (''이면 저장 안 함, 없으면 config 기본값)
};

type QuizJsonAct = {
  id: string;
  slide?: number | 'last';
  kind: string;
  prompt: string;
  config: Record<string, any>;
};

/* 문항 파일 위치 — 덱 유형과 무관하게 '수업 폴더의 quiz.json'.
   네이티브 React 덱(index.html?deck=<id>)은 경로가 URL에 없으므로
   registry의 quizJson으로 찾고, 레거시 덱은 index.html 옆에서 찾는다. */
function quizJsonPath(deckPath: string): string | null {
  const native = deckPath.match(/\?deck=([\w-]+)/);
  if (native) return DECKS.find((d) => d.id === native[1])?.quizJson ?? null;
  return deckPath.replace(/[^/]*$/, '') + 'quiz.json';
}

async function fetchQuizJson(deckPath: string | null): Promise<QuizJsonAct[] | null> {
  if (!deckPath) return null;
  const path = quizJsonPath(deckPath);
  if (!path) return null;
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const data = await res.json();
    const acts = (Array.isArray(data.activities) ? data.activities : [])
      .map((raw: Record<string, any>) => {
        const { id, slide, kind, prompt, ...config } = raw;
        return { id, slide, kind, prompt, config } as QuizJsonAct;
      })
      .filter((x: QuizJsonAct) => x.id && x.kind && typeof x.prompt === 'string');
    return acts.length ? acts : null;
  } catch {
    return null;
  }
}

function deckHostHref(deckPath: string, code: string) {
  // 네이티브 덱(쿼리 포함)은 쿼리 유지 + &, 레거시는 뷰어(?legacy=) 경유 —
  // 진짜 bolt 독 안에 라이브 세그먼트가 통합된 화면으로 진행한다
  if (deckPath.includes('?')) return `${deckPath}&live=${code}&host=1`;
  return `?legacy=${encodeURIComponent(deckPath)}&live=${code}&host=1`;
}

type Toast = { msg: string; kind?: 'ok' | 'err'; link?: string } | null;

/* 세션에 연결할 수 있는 덱 하나 (pages.json에서 평탄화) */
type DeckOption = {
  path: string;
  title: string;
  subject: string;
  group: string;
  /** 라이브 문항(퀴즈)이 등록된 수업 — QUIZ 배지. 발표는 이 값과 무관하게 가능 */
  live: boolean;
};
type GroupOption = { id: string; label: string; count: number };

/* 결과 저장 시트 후보 — scripts/scan-archives.mjs 가 각 수업(과목) 폴더의
   Apps Script URL을 모아 live/archives.json 으로 생성한다 */
type ArchiveOption = { label: string; dir: string; url: string };

const normName = (s: string) => s.replace(/\s+/g, '');
const dirSubject = (dir: string) => dir.replace(/\/+$/, '').split('/').pop() || '';

/* 선택한 덱에 맞는 아카이브 자동 매칭 — 과목명 우선, 경로 접두어 보조
   (과목 pages가 다른 폴더에 있는 경우가 있어 과목명 매칭이 먼저다) */
function matchArchive(archives: ArchiveOption[], deck: DeckOption | undefined | null) {
  if (!deck) return null;
  return (
    archives.find((a) => normName(dirSubject(a.dir)) === normName(deck.subject)) ??
    archives.find((a) => a.dir && deck.path.startsWith(a.dir)) ??
    null
  );
}

export default function HostPage() {
  const sysRef = useRef<{ cfg: ConfigModule; driver: Driver } | null>(null);
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  useEffect(() => {
    document.title = '교사 콘솔 — 라이브';
    let alive = true;
    (async () => {
      const cfg = await loadConfig();
      const driver = await loadDriver();
      if (alive) {
        sysRef.current = { cfg, driver };
        setReady(true);
      }
    })().catch((e) => alive && setToast({ msg: '연결 준비 실패: ' + e.message, kind: 'err' }));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.kind === 'err' ? 9000 : 6000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div className="lv">
      <div className="lv-shell lv-shell--wide">
        <header className="lv-top">
          <div className="lv-top__brand">
            <span className="kicker">LIVE · HOST</span>
            <span className="lv-top__title">교사 콘솔</span>
          </div>
          <nav className="lv-top__actions">
            <a className="lv-btn lv-btn--ghost lv-btn--sm" href="/hub">
              수업 자료
            </a>
          </nav>
        </header>

        {!ready && (
          <div className="mat lv-card lv-wait">
            <div className="lv-pulse">⏳</div>
            <p className="lv-sub">연결 준비 중…</p>
          </div>
        )}

        {ready && !session && (
          <Home
            sys={sysRef.current!}
            onToast={setToast}
            onSession={setSession}
          />
        )}

        {ready && session && (
          <Dashboard
            sys={sysRef.current!}
            session={session}
            onToast={setToast}
            onHome={() => setSession(null)}
          />
        )}
      </div>

      {toast && (
        <div className={`lv-toast${toast.kind === 'err' ? ' lv-toast--err' : ''}`}>
          <span>{toast.msg}</span>
          {toast.link && (
            <a href={toast.link} target="_blank" rel="noreferrer">
              시트 열기 ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/* ── 홈: 새 세션 + 최근 세션 ── */
function Home({
  sys, onToast, onSession,
}: {
  sys: { cfg: ConfigModule; driver: Driver };
  onToast: (t: Toast) => void;
  onSession: (s: SessionInfo) => void;
}) {
  const [title, setTitle] = useState('');
  const [deckPath, setDeckPath] = useState('');
  const [nameMode, setNameMode] = useState('anonymous');
  const [gamify, setGamify] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [decks, setDecks] = useState<DeckOption[]>([]);
  const [deckGroups, setDeckGroups] = useState<GroupOption[]>([]);
  const [archives, setArchives] = useState<ArchiveOption[]>([]);
  const [archiveUrl, setArchiveUrl] = useState('');
  const [preview, setPreview] = useState<QuizJsonAct[] | null>(null);
  const [recent, setRecent] = useState(() => sys.cfg.listHostSessions().slice(0, 6));

  useEffect(() => {
    let alive = true;
    // 결과 저장 시트 후보 로드 — 없으면 config 기본값 하나로 폴백
    fetch('live/archives.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('no archives.json'))))
      .then((d) => {
        if (!alive) return;
        const list: ArchiveOption[] = (d.archives || []).filter(
          (a: any) => a && a.url && a.label
        );
        if (!list.length) throw new Error('empty');
        setArchives(list);
        const def = sys.cfg.getConfig().appsScriptUrl || '';
        setArchiveUrl((cur) => cur || (list.some((a) => a.url === def) ? def : list[0].url));
      })
      .catch(() => {
        if (!alive) return;
        const def = sys.cfg.getConfig().appsScriptUrl || '';
        if (def) {
          setArchives([{ label: '기본 아카이브 시트', dir: '', url: def }]);
          setArchiveUrl((cur) => cur || def);
        }
      });
    return () => {
      alive = false;
    };
  }, [sys]);

  useEffect(() => {
    let alive = true;
    // 허브와 같은 레지스트리를 쓰되, 여기서는 과목 묶음이 아니라
    // 검색 가능한 평탄 목록 + 학기 그룹 필터로 다룬다
    fetch('/pages.json')
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const flat: DeckOption[] = (d.subjects || []).flatMap((s: any) =>
          (s.pages || [])
            // 활동지·문서형 자료(type:'doc')는 라이브 세션에 연결할 수 없다
            .filter((p: any) => p.type !== 'doc')
            .map((p: any) => ({
              path: p.path,
              title: p.title,
              subject: s.name,
              group: s.group || 'etc',
              live: !!p.live,
            }))
        );
        const labels = new Map<string, string>(
          (d.groups || []).map((g: any) => [g.id, g.label])
        );
        const counts = new Map<string, number>();
        for (const x of flat) counts.set(x.group, (counts.get(x.group) ?? 0) + 1);
        setDecks(flat);
        setDeckGroups(
          [...counts.entries()].map(([id, count]) => ({
            id,
            label: labels.get(id) ?? id,
            count,
          }))
        );
        // 딥링크 프리필: ?deck=<path> 가 목록에 있으면 선택
        const want = new URLSearchParams(location.search).get('deck');
        if (want && flat.some((x) => x.path === want)) setDeckPath(want);
      })
      .catch(() => { /* pages.json 없이도 동작 */ });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    setPreview(null);
    if (deckPath) fetchQuizJson(deckPath).then((acts) => alive && setPreview(acts));
    return () => {
      alive = false;
    };
  }, [deckPath]);

  // 덱을 고르면 그 수업(과목)의 아카이브 시트를 자동 선택 — 이후 수동 변경 가능
  useEffect(() => {
    const hit = matchArchive(archives, decks.find((d) => d.path === deckPath));
    if (hit) setArchiveUrl(hit.url);
  }, [deckPath, decks, archives]);

  const create = async () => {
    setBusy(true);
    setErr('');
    try {
      const s = await sys.driver.createSession({
        title: title.trim(),
        deckPath: deckPath || null,
        nameMode,
        gamify,
      });
      const info: SessionInfo = {
        sessionId: s.sessionId, code: s.code, hostToken: s.hostToken,
        title: title.trim(), deckPath: deckPath || null, archiveUrl,
      };
      sys.cfg.saveHostSession(info);
      onSession(info);
    } catch (e) {
      setErr('세션 생성 실패: ' + (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const resume = async (code: string) => {
    const saved = sys.cfg.loadHostSession(code);
    if (!saved?.hostToken) return;
    try {
      const r = await sys.driver.resumeSession(code, saved.hostToken);
      if (r.status === 'ended') {
        sys.cfg.removeHostSession(code);
        setRecent(sys.cfg.listHostSessions().slice(0, 6));
        onToast({ msg: '이미 종료된 세션입니다.', kind: 'err' });
        return;
      }
      onSession({
        sessionId: r.sessionId ?? saved.sessionId, code,
        hostToken: saved.hostToken,
        title: r.title ?? saved.title, deckPath: r.deckPath ?? saved.deckPath,
        archiveUrl: saved.archiveUrl,
      });
    } catch (e) {
      sys.cfg.removeHostSession(code);
      setRecent(sys.cfg.listHostSessions().slice(0, 6));
      onToast({ msg: '세션을 열 수 없어 목록에서 지웠습니다: ' + (e as Error).message, kind: 'err' });
    }
  };

  return (
    <>
      <div className="mat lv-card">
        <h2>새 라이브 세션</h2>
        <p className="lv-sub">
          세션을 만들면 6자리 코드가 발급됩니다. 학생은 <b>학생 참여</b> 페이지에서 코드로 참여합니다.
        </p>
        <label className="lv-label" htmlFor="lvTitle">수업 제목</label>
        <input
          id="lvTitle" className="lv-input" maxLength={60} value={title}
          placeholder="예: 3차시 — HTTP와 웹의 동작"
          onChange={(e) => setTitle(e.target.value)}
        />
        <label className="lv-label" id="lvDeckLabel">연결할 슬라이드덱 (선택)</label>
        <DeckPicker
          decks={decks}
          groups={deckGroups}
          value={deckPath}
          onChange={setDeckPath}
        />
        {preview && (
          <div className="lv-card" style={{ background: 'var(--surface)', border: '1px solid var(--hair-2)', marginTop: 10, marginBottom: 0, padding: 14 }}>
            <div className="lv-label" style={{ marginTop: 0 }}>
              이 수업의 라이브 문항 {preview.length}개 (quiz.json)
            </div>
            {preview.map((x) => (
              <div key={x.id} className="lv-act" style={{ padding: '8px 0' }}>
                <div className="lv-act__prompt">{x.prompt}</div>
                <div className="lv-act__meta">
                  {[
                    KIND_LABEL[x.kind] || x.kind,
                    x.config.peerInstruction ? 'PI 2라운드' : null,
                    x.config.answer !== undefined && x.config.answer !== null ? '정답 있음' : null,
                    x.slide === 'last' ? '마지막 쪽' : Number.isInteger(x.slide) ? `${(x.slide as number) + 1}쪽` : null,
                  ].filter(Boolean).join(' · ')}
                </div>
              </div>
            ))}
          </div>
        )}
        <label className="lv-label" htmlFor="lvArchiveSel">결과 저장 시트</label>
        {/* 직접 입력 대신 각 수업(과목)에 연결된 아카이브 시트 중에서 고른다 —
            덱을 선택하면 해당 과목 시트가 자동으로 잡힌다 */}
        <select
          id="lvArchiveSel"
          className="lv-select"
          value={archiveUrl}
          onChange={(e) => setArchiveUrl(e.target.value)}
        >
          {archives.map((a) => (
            <option key={a.url} value={a.url}>{a.label}</option>
          ))}
          <option value="">저장 안 함</option>
        </select>
        <p className="lv-sub" style={{ marginTop: 4 }}>
          세션 종료 시 선택한 과목 시트(라이브_세션·문항·응답 탭)에 자동 저장됩니다.
        </p>
        <label className="lv-label" id="lvModeLabel">참여 방식</label>
        {/* 선택지가 둘뿐이므로 드롭다운 대신 한눈에 보이는 버튼 두 개 */}
        <div className="lv-choicegrid" role="radiogroup" aria-labelledby="lvModeLabel">
          {[
            { v: 'anonymous', icon: '🙈', t: '익명', d: '학번 없이 이름만' },
            { v: 'named', icon: '🪪', t: '기명', d: '학번 + 이름' },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              role="radio"
              aria-checked={nameMode === o.v}
              data-mode={o.v}
              className={`lv-choicecard${nameMode === o.v ? ' sel' : ''}`}
              onClick={() => setNameMode(o.v)}
            >
              <span className="lv-choicecard__icon" aria-hidden>{o.icon}</span>
              <span className="lv-choicecard__t">{o.t}</span>
              <span className="lv-choicecard__d">{o.d}</span>
            </button>
          ))}
        </div>
        <label className="lv-check">
          <input type="checkbox" checked={gamify} onChange={(e) => setGamify(e.target.checked)} />
          ⚡ 스피드 퀴즈 세션 — 정답 + 속도 점수, 누적 리더보드
        </label>
        <button className="lv-btn lv-btn--block" onClick={create} disabled={busy}>
          {busy ? '생성 중…' : '세션 만들기'}
        </button>
        <div className={`lv-error${err ? ' show' : ''}`}>{err}</div>
      </div>

      {recent.length > 0 && (
        <div className="mat lv-card">
          <h2>최근 세션</h2>
          {recent.map((s) => (
            <div key={s.code} className="lv-sess-item">
              <div style={{ minWidth: 0, display: 'flex', gap: 10, alignItems: 'baseline' }}>
                <span className="lv-sess-item__code">{s.code}</span>
                <span className="lv-sess-item__title">{s.title || '제목 없음'}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flex: 'none' }}>
                <button className="lv-btn lv-btn--sm" onClick={() => resume(s.code)}>
                  열기
                </button>
                <button
                  className="lv-btn lv-btn--ghost lv-btn--sm"
                  onClick={() => {
                    sys.cfg.removeHostSession(s.code);
                    setRecent(sys.cfg.listHostSessions().slice(0, 6));
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ── 덱 선택기 ────────────────────────────────────────────────────
   자료가 70개를 넘어 드롭다운으로는 원하는 수업을 찾을 수 없다.
   검색(제목·과목) + 학기 그룹 필터 + 키보드 이동(↑↓/Enter)로 바꾼다.
   선택 후에는 목록을 접고 고른 수업만 보여준다 — 화면을 비워 둔다. */
function DeckPicker({
  decks, groups, value, onChange,
}: {
  decks: DeckOption[];
  groups: GroupOption[];
  value: string;
  onChange: (path: string) => void;
}) {
  const [q, setQ] = useState('');
  const [group, setGroup] = useState<string | null>(null);
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const selected = useMemo(
    () => decks.find((d) => d.path === value) ?? null,
    [decks, value]
  );

  const tokens = useMemo(
    () => q.toLowerCase().split(/\s+/).filter(Boolean),
    [q]
  );

  const results = useMemo(() => {
    const pool = group ? decks.filter((d) => d.group === group) : decks;
    if (!tokens.length) return pool;
    return pool.filter((d) => {
      const hay = `${d.title} ${d.subject}`.toLowerCase();
      return tokens.every((t) => hay.includes(t));
    });
  }, [decks, group, tokens]);

  useEffect(() => {
    setCursor(0);
  }, [q, group]);

  // 커서가 보이도록 스크롤 (키보드만 쓰는 진행 상황에서도 길을 잃지 않게)
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>('.lv-deckrow.cur');
    el?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  if (selected)
    return (
      <div className="lv-deckpick" data-selected-path={selected.path}>
        <div className="lv-deckpick__chosen">
          <div className="lv-deckpick__chosen-text">
            <span className="lv-deckrow__subject">{selected.subject}</span>
            <span className="lv-deckpick__chosen-title">{selected.title}</span>
          </div>
          <button
            type="button"
            className="lv-btn lv-btn--ghost lv-btn--sm"
            onClick={() => {
              onChange('');
              setQ('');
            }}
          >
            변경
          </button>
        </div>
      </div>
    );

  const pick = (path: string) => {
    onChange(path);
    setQ('');
  };

  return (
    <div className="lv-deckpick" data-selected-path="">
      <div className="lv-deckpick__search">
        <span aria-hidden>🔎</span>
        <input
          id="lvDeckSearch"
          className="lv-input"
          value={q}
          placeholder="수업 제목·과목으로 검색"
          aria-label="슬라이드덱 검색"
          autoComplete="off"
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setCursor((c) => Math.min(results.length - 1, c + 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setCursor((c) => Math.max(0, c - 1));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (results[cursor]) pick(results[cursor].path);
            } else if (e.key === 'Escape') {
              setQ('');
            }
          }}
        />
      </div>

      {groups.length > 1 && (
        <div className="lv-deckpick__groups">
          <button
            type="button"
            className={`lv-fpill${group === null ? ' sel' : ''}`}
            onClick={() => setGroup(null)}
          >
            전체 <b>{decks.length}</b>
          </button>
          {groups.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`lv-fpill${group === g.id ? ' sel' : ''}`}
              onClick={() => setGroup(group === g.id ? null : g.id)}
            >
              {g.label} <b>{g.count}</b>
            </button>
          ))}
        </div>
      )}

      <div className="lv-decklist" ref={listRef} role="listbox" aria-label="슬라이드덱 목록">
        {results.length === 0 && (
          <p className="lv-sub" style={{ padding: '14px 4px' }}>
            검색 결과가 없습니다.
          </p>
        )}
        {results.map((d, i) => (
          <button
            key={d.path}
            type="button"
            role="option"
            aria-selected={false}
            data-path={d.path}
            className={`lv-deckrow${i === cursor ? ' cur' : ''}`}
            onMouseEnter={() => setCursor(i)}
            onClick={() => pick(d.path)}
          >
            <span className="lv-deckrow__subject">{d.subject}</span>
            <span className="lv-deckrow__title">{d.title}</span>
            {d.live && (
              <span className="lv-deckrow__quiz" title="실시간 참여 문항이 준비된 수업">QUIZ</span>
            )}
          </button>
        ))}
      </div>

      <p className="lv-deckpick__hint">
        고르지 않으면 <b>덱 없이</b> 진행합니다 — 즉석 문항만 사용.
      </p>
    </div>
  );
}

/* ── 세션 대시보드 ── */
function Dashboard({
  sys, session, onToast, onHome,
}: {
  sys: { cfg: ConfigModule; driver: Driver };
  session: SessionInfo;
  onToast: (t: Toast) => void;
  onHome: () => void;
}) {
  const { driver, cfg } = sys;
  const [state, setState] = useState<HostState | null>(null);
  const [deckActs, setDeckActs] = useState<QuizJsonAct[] | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const chanRef = useRef<Channel | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const endedRef = useRef(false);

  const refresh = useCallback(async () => {
    if (endedRef.current) return;
    try {
      setState(await driver.hostState(session.sessionId, session.hostToken));
    } catch { /* 다음 폴링에서 재시도 */ }
  }, [driver, session]);

  const send = useCallback((payload: Record<string, unknown>) => {
    try {
      chanRef.current?.send(payload);
    } catch { /* 무시 */ }
  }, []);

  useEffect(() => {
    let alive = true;
    endedRef.current = false;
    refresh();
    const poll = setInterval(refresh, 3000);
    let debounce: ReturnType<typeof setTimeout>;
    driver.connectChannel(session.code, () => {
      clearTimeout(debounce);
      debounce = setTimeout(refresh, 400);
    }).then((ch) => {
      if (alive) chanRef.current = ch;
      else ch.close();
    });
    fetchQuizJson(session.deckPath ?? null).then((acts) => alive && setDeckActs(acts));
    return () => {
      alive = false;
      clearInterval(poll);
      clearTimeout(debounce);
      chanRef.current?.close();
      chanRef.current = null;
    };
  }, [driver, session, refresh]);

  // QR
  useEffect(() => {
    let alive = true;
    loadQrLib()
      .then((qrcode) => {
        if (!alive || !qrRef.current) return;
        const qr = qrcode(0, 'M');
        qr.addData(cfg.joinUrl(session.code));
        qr.make();
        qrRef.current.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
      })
      .catch(() => { /* QR 없이도 코드/URL로 참여 가능 */ });
    return () => {
      alive = false;
    };
  }, [cfg, session.code]);

  const act = async (fn: () => Promise<void>) => {
    try {
      await fn();
      await refresh();
    } catch (e) {
      onToast({ msg: (e as Error).message, kind: 'err' });
    }
  };

  const openDef = (def: { slideKey: string; slideIndex: number | null; kind: string; prompt: string; config: any }) =>
    act(async () => {
      const pub = await driver.openActivity(session.sessionId, session.hostToken, def);
      send({ type: 'activity', activity: pub });
    });

  // 학생 미러 화면의 클릭 차단 해제 — 학생이 자기 기기에서 슬라이드를 직접 넘겨본다
  // (덱이 연결된 세션에서만 의미 있다 — 로컬 세션정보가 비어도 hostState로 보정)
  const mirroring = !!(session.deckPath || state?.session?.deckPath);
  const allowInteract = !!state?.session?.allowInteract;
  const toggleInteract = () =>
    act(async () => {
      const on = !allowInteract;
      try {
        await driver.setInteract(session.sessionId, session.hostToken, on);
      } catch (e) {
        throw new Error(
          '학생 조작 설정 실패: ' + (e as Error).message
            + ' (Supabase 마이그레이션 v11 적용 여부를 확인하세요)'
        );
      }
      send({ type: 'interact', on });   // 학생 화면 즉시 반영 (재조회 없음)
    });

  // 세션 만들 때 고른 과목 아카이브 — 구버전 저장 세션(필드 없음)은 config 기본값
  const archiveUrl = session.archiveUrl ?? (cfg.getConfig().appsScriptUrl || '');

  const saveToSheet = async (): Promise<boolean> => {
    if (!archiveUrl) {
      onToast({ msg: '결과 저장 시트가 "저장 안 함"으로 선택된 세션입니다.', kind: 'err' });
      return false;
    }
    try {
      const dump = await driver.exportSession(session.sessionId, session.hostToken);
      const archive = await loadArchive();
      const r = await archive.archiveToSheet(dump, archiveUrl);
      onToast({
        msg: `시트 저장 완료 — 응답 ${r.rows.responses}건 · 문항 ${r.rows.activities}건`,
        kind: 'ok', link: r.sheetUrl,
      });
      return true;
    } catch (e) {
      onToast({ msg: '시트 저장 실패: ' + (e as Error).message, kind: 'err' });
      return false;
    }
  };

  const exportJson = async () => {
    try {
      const dump = await driver.exportSession(session.sessionId, session.hostToken);
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `live-session-${session.code}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      onToast({ msg: '내보내기 실패: ' + (e as Error).message, kind: 'err' });
    }
  };

  const endSession = async () => {
    if (!confirmEnd) {
      setConfirmEnd(true);
      setTimeout(() => setConfirmEnd(false), 3500);
      return;
    }
    setConfirmEnd(false);
    await act(async () => {
      await driver.endSession(session.sessionId, session.hostToken);
      send({ type: 'end' });
      endedRef.current = true;
    });
    if (archiveUrl) await saveToSheet();
    onHome();
  };

  const deckHref = session.deckPath ? deckHostHref(session.deckPath, session.code) : null;
  const joinUrl = cfg.joinUrl(session.code);

  return (
    <>
      <div className="mat lv-card" style={{ textAlign: 'center' }}>
        <div className="lv-top" style={{ marginBottom: 0 }}>
          <h2 style={{ margin: 0 }}>{session.title || '수업 세션'}</h2>
          <button className="lv-btn lv-btn--ghost lv-btn--sm" onClick={onHome}>
            ← 홈
          </button>
        </div>
        <div className="lv-bigcode">{session.code}</div>
        <div className="lv-qr">
          <div ref={qrRef} />
        </div>
        <div className="lv-joinurl">{joinUrl}</div>
        <div className="lv-row">
          <button
            className="lv-btn lv-btn--ghost"
            onClick={() =>
              navigator.clipboard
                .writeText(joinUrl)
                .then(() => onToast({ msg: '참여 링크를 복사했습니다.' }))
            }
          >
            참여 링크 복사
          </button>
          {deckHref && (
            <a className="lv-btn" href={deckHref} target="_blank" rel="noreferrer">
              덱을 호스트 모드로 열기 ↗
            </a>
          )}
          {/* 미러(=덱 연결) 세션에서만 의미 있는 토글 — 덱 없는 세션엔 학생 미러가 없다 */}
          {mirroring && (
          <button
            className={`lv-btn ${allowInteract ? '' : 'lv-btn--ghost'}`}
            onClick={toggleInteract}
            title={allowInteract
              ? '학생이 자기 화면에서 슬라이드를 직접 넘기고 있습니다 — 누르면 다시 잠급니다'
              : '학생 화면의 클릭 차단을 풉니다 — 학생이 미러된 슬라이드를 직접 눌러볼 수 있습니다'}
          >
            {allowInteract ? '🔓 학생 조작 허용됨' : '🔒 학생 조작 잠금'}
          </button>
          )}
          <button className="lv-btn lv-btn--ghost" onClick={saveToSheet}>
            시트에 저장
          </button>
          <button
            className={`lv-btn ${confirmEnd ? 'lv-btn--warn' : 'lv-btn--ghost'}`}
            onClick={endSession}
          >
            {confirmEnd ? '정말 종료할까요?' : '세션 종료'}
          </button>
        </div>
      </div>

      <div className="mat lv-card">
        <div className="lv-stats">
          <div className="lv-stat">
            <b>{state?.participantCount ?? '—'}</b>
            <span>참여 학생</span>
          </div>
          <div className="lv-stat">
            <b>{state?.activities.length ?? '—'}</b>
            <span>진행 문항</span>
          </div>
          {state?.session.gamify && (
            <div className="lv-stat">
              <b>⚡</b>
              <span>스피드 퀴즈</span>
            </div>
          )}
        </div>
        {!!state?.participants.length && (
          <div className="lv-chips">
            {state.participants.map((p, i) => (
              <span key={i} className="lv-chip">
                {p.studentNo && <b>{p.studentNo}</b>}
                {p.nickname || '익명'}
              </span>
            ))}
          </div>
        )}
      </div>

      {deckActs && (
        <div className="mat lv-card">
          <h2>덱 문항 · quiz.json</h2>
          <p className="lv-sub">
            덱을 열지 않아도 여기서 바로 문항을 열 수 있습니다. 진행·집계·마감/공개는 아래 '문항 현황'에서.
          </p>
          {deckActs.map((x) => (
            <div key={x.id} className="lv-act">
              <div className="lv-act__head">
                <div style={{ minWidth: 0 }}>
                  <div className="lv-act__prompt">{x.prompt}</div>
                  <div className="lv-act__meta">
                    {[
                      KIND_LABEL[x.kind] || x.kind,
                      x.config.peerInstruction ? 'PI' : null,
                      x.slide === 'last' ? '마지막 쪽' : Number.isInteger(x.slide) ? `${(x.slide as number) + 1}쪽` : null,
                    ].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <div className="lv-act__btns">
                  <button
                    className="lv-btn lv-btn--sm"
                    onClick={() =>
                      openDef({
                        slideKey: x.id,
                        slideIndex: Number.isInteger(x.slide) ? (x.slide as number) : null,
                        kind: x.kind, prompt: x.prompt, config: x.config,
                      })
                    }
                  >
                    열기
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AdhocComposer onOpen={openDef} />

      <div className="mat lv-card">
        <div className="lv-top" style={{ marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>문항 현황</h2>
          <button className="lv-btn lv-btn--ghost lv-btn--sm" onClick={exportJson}>
            데이터 내보내기 (JSON)
          </button>
        </div>
        {!state?.activities.length && (
          <p className="lv-sub">아직 연 문항이 없습니다. 덱 문항 또는 즉석 문항을 열어보세요.</p>
        )}
        {state?.activities.map((a) => (
          <ActRow
            key={a.id}
            a={a}
            state={state}
            sys={sys}
            session={session}
            onAction={(kind) => {
              if (kind === 'reopen')
                openDef({
                  slideKey: a.slideKey || a.id, slideIndex: a.slideIndex ?? null,
                  kind: a.kind, prompt: a.prompt, config: a.config,
                });
              else if (kind === 'close')
                act(async () => {
                  await driver.closeActivity(session.sessionId, session.hostToken, a.id);
                  send({ type: 'close', activityId: a.id });
                });
              else if (kind === 'reveal')
                act(async () => {
                  const agg = await driver.revealActivity(session.sessionId, session.hostToken, a.id);
                  send({ type: 'reveal', activityId: a.id, agg });
                });
              else if (kind === 'round2')
                act(async () => {
                  const pub = await driver.advanceRound(session.sessionId, session.hostToken, a.id);
                  send({ type: 'activity', activity: pub });
                });
            }}
          />
        ))}
      </div>
    </>
  );
}

/* ── 즉석 문항 작성기 ── */
function AdhocComposer({
  onOpen,
}: {
  onOpen: (def: { slideKey: string; slideIndex: number | null; kind: string; prompt: string; config: any }) => void;
}) {
  const [kind, setKind] = useState('choice');
  const [prompt, setPrompt] = useState('');
  const [optionsText, setOptionsText] = useState('');
  const [answer, setAnswer] = useState('');
  const [pi, setPi] = useState(false);
  const [lang, setLang] = useState('python');
  const [starter, setStarter] = useState('');
  const [testsText, setTestsText] = useState('');

  const options = useMemo(
    () => optionsText.split('\n').map((s) => s.trim()).filter(Boolean),
    [optionsText]
  );

  const open = () => {
    const p = prompt.trim();
    if (!p) return;
    const config: Record<string, any> = {};
    if (kind === 'choice') {
      if (options.length < 2) return;
      config.options = options;
      if (answer !== '') config.answer = Number(answer);
    } else if (kind === 'ox' && answer !== '') {
      config.answer = answer === 'true';
    }
    if ((kind === 'choice' || kind === 'ox') && pi) config.peerInstruction = true;
    if (kind === 'code') {
      config.language = lang;
      config.starter = starter;
      if (lang === 'python') {
        config.tests = testsText
          .split('\n')
          .map((line) => line.split('=>'))
          .filter((parts) => parts.length === 2 && parts[0].trim())
          .map(([call, expected]) => ({ call: call.trim(), expected: expected.trim() }));
      }
    }
    onOpen({ slideKey: 'adhoc-' + Date.now(), slideIndex: null, kind, prompt: p, config });
    setPrompt('');
  };

  return (
    <div className="mat lv-card">
      <h2>즉석 문항</h2>
      <p className="lv-sub">덱과 무관하게 바로 던지는 문항입니다. 열면 학생 화면에 즉시 표시됩니다.</p>
      <label className="lv-label">유형</label>
      <select className="lv-select" value={kind} onChange={(e) => { setKind(e.target.value); setAnswer(''); }}>
        {Object.entries(KIND_LABEL).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
      <label className="lv-label">질문</label>
      <input
        className="lv-input" value={prompt} maxLength={200}
        placeholder="예: HTTP에서 상태코드 404의 의미는?"
        onChange={(e) => setPrompt(e.target.value)}
      />
      {kind === 'choice' && (
        <>
          <label className="lv-label">보기 (한 줄에 하나)</label>
          <textarea
            className="lv-textarea" value={optionsText}
            placeholder={'서버 오류\n페이지 없음\n권한 없음'}
            onChange={(e) => setOptionsText(e.target.value)}
          />
        </>
      )}
      {(kind === 'choice' || kind === 'ox') && (
        <>
          <label className="lv-label">정답 (선택)</label>
          <select className="lv-select" value={answer} onChange={(e) => setAnswer(e.target.value)}>
            <option value="">정답 없음 (투표)</option>
            {kind === 'ox' ? (
              <>
                <option value="true">정답: O</option>
                <option value="false">정답: X</option>
              </>
            ) : (
              options.map((opt, i) => (
                <option key={i} value={i}>
                  정답: {i + 1}. {opt.slice(0, 20)}
                </option>
              ))
            )}
          </select>
          <label className="lv-check">
            <input type="checkbox" checked={pi} onChange={(e) => setPi(e.target.checked)} />
            🗣️ Peer Instruction — 1차 투표 → 토론 → 2차 투표
          </label>
        </>
      )}
      {kind === 'code' && (
        <>
          <label className="lv-label">언어</label>
          <select className="lv-select" value={lang} onChange={(e) => setLang(e.target.value)}>
            <option value="python">Python (Pyodide 실행·채점)</option>
            <option value="web">Web (HTML/CSS/JS 미리보기)</option>
          </select>
          <label className="lv-label">시작 코드 (선택)</label>
          <textarea
            className="lv-textarea lv-code-editor" style={{ minHeight: 100 }}
            value={starter} spellCheck={false}
            onChange={(e) => setStarter(e.target.value)}
          />
          {lang === 'python' && (
            <>
              <label className="lv-label">테스트 (한 줄에 하나, 호출 =&gt; 기대값)</label>
              <textarea
                className="lv-textarea" style={{ fontFamily: 'var(--font-mono)' }}
                value={testsText} placeholder={'판별(4) => 짝수\n판별(7) => 홀수'}
                onChange={(e) => setTestsText(e.target.value)}
              />
            </>
          )}
        </>
      )}
      <button className="lv-btn lv-btn--block" onClick={open} disabled={!prompt.trim()}>
        문항 열기
      </button>
    </div>
  );
}

/* ── 문항 현황 행 (상태별 3동사 + 인라인 차트 + 코드 브라우저) ── */
function ActRow({
  a, state, sys, session, onAction,
}: {
  a: LiveActivity;
  state: HostState;
  sys: { cfg: ConfigModule; driver: Driver };
  session: SessionInfo;
  onAction: (kind: 'reopen' | 'close' | 'reveal' | 'round2') => void;
}) {
  const st = a.status;
  const isPi = !!a.config?.peerInstruction;
  const round = a.currentRound || 1;
  const rc = a.roundCounts || [0, 0];
  const n = round > 1 ? rc[1] : rc[0];
  const wasRevealed = !!a.revealedAt;
  const chartRef = useRef<HTMLDivElement>(null);
  const [codesOpen, setCodesOpen] = useState(false);
  const [subs, setSubs] = useState<Awaited<ReturnType<Driver['codeSubmissions']>> | null>(null);
  const [selIdx, setSelIdx] = useState<number | null>(null);

  // 인라인 집계 차트 (교사 전용 화면 — 정답 병합)
  const agg = useMemo(() => {
    let merged: Record<string, any>;
    if (round > 1) {
      merged = {
        kind: a.kind, pi: true,
        rounds: [a.aggregates || {}, a.aggregates2 || {}],
        total: (a.aggregates2 || {}).total || 0,
      };
    } else {
      merged = { ...(a.aggregates || {}) };
    }
    if (['choice', 'ox'].includes(a.kind) && a.config && 'answer' in a.config)
      merged.answer = a.config.answer;
    if (state.session.gamify && state.leaderboard?.length)
      merged.leaderboard = state.leaderboard;
    return merged;
  }, [a, round, state]);

  const hasData = (agg.total || 0) > 0 || (agg.rounds && (agg.rounds[0]?.total || 0) > 0);
  useEffect(() => {
    if (!hasData || !chartRef.current) return;
    let alive = true;
    loadCharts().then((charts) => {
      if (alive && chartRef.current)
        charts.renderAggregates(
          chartRef.current, { kind: a.kind, config: a.config || {} }, agg, { theme: 'dark' }
        );
    });
    return () => {
      alive = false;
    };
  }, [agg, a, hasData]);

  const toggleCodes = async () => {
    if (codesOpen) return setCodesOpen(false);
    try {
      setSubs(await sys.driver.codeSubmissions(session.sessionId, session.hostToken, a.id));
      setSelIdx(null);
      setCodesOpen(true);
    } catch (e) {
      /* 조회 실패 시 무시 — 폴링과 무관 */
    }
  };

  const btns: { label: string; act: 'reopen' | 'close' | 'reveal' | 'round2'; primary?: boolean }[] = [];
  if (st === 'open') {
    if (isPi && round === 1) btns.push({ label: '2차 투표 →', act: 'round2', primary: true });
    else btns.push({ label: '결과 공개', act: 'reveal', primary: true });
    btns.push({ label: '닫기', act: 'close' });
  } else if (st === 'revealed') {
    btns.push({ label: '닫기', act: 'close', primary: true });
  } else if (st === 'closed') {
    if (isPi && round === 1) btns.push({ label: '2차 투표 →', act: 'round2', primary: true });
    else btns.push({ label: '다시 열기', act: 'reopen' });
    btns.push(
      wasRevealed
        ? { label: '다시 공개', act: 'reveal' }
        : { label: '결과 공개', act: 'reveal', primary: true }
    );
  } else {
    btns.push({ label: '다시 열기', act: 'reopen' });
  }

  return (
    <div className="lv-act">
      <div className="lv-act__head">
        <div style={{ minWidth: 0 }}>
          <div className="lv-act__prompt">{a.prompt}</div>
          <div className="lv-act__meta">
            {KIND_LABEL[a.kind] || a.kind}
            {isPi ? ' · PI' : ''}
            {round > 1 ? ' · 2차' : ''}
            {' · '}
            <span className={`st--${st}`}>{ST_LABEL[st] || '대기'}</span>
            {` · 응답 ${n}`}
          </div>
        </div>
        <div className="lv-act__btns">
          {btns.map((b) => (
            <button
              key={b.act + b.label}
              className={`lv-btn lv-btn--sm${b.primary ? '' : ' lv-btn--ghost'}`}
              onClick={() => onAction(b.act)}
            >
              {b.label}
            </button>
          ))}
          {a.kind === 'code' && st !== 'draft' && (
            <button className="lv-btn lv-btn--ghost lv-btn--sm" onClick={toggleCodes}>
              {codesOpen ? '코드 접기' : '코드 보기'}
            </button>
          )}
        </div>
      </div>
      {hasData && <div className="lv-act__chart" ref={chartRef} />}
      {codesOpen && subs && (
        <>
          <div className="lv-code-list">
            {subs.length === 0 && <span className="lv-sub">아직 제출이 없습니다</span>}
            {subs.map((s, i) => (
              <button
                key={i}
                className={`lv-code-item${selIdx === i ? ' sel' : ''}`}
                onClick={() => setSelIdx(i)}
              >
                <span>{(s.studentNo ? s.studentNo + ' ' : '') + (s.nickname || '익명')}</span>
                {Number.isInteger(s.total) && (s.total as number) > 0 && (
                  <span className={`lv-code-badge${s.passed === s.total ? '' : ' lv-code-badge--partial'}`}>
                    {s.passed}/{s.total}
                  </span>
                )}
              </button>
            ))}
          </div>
          {selIdx !== null && subs[selIdx] && (
            <pre className="lv-code-view">{subs[selIdx].code || '(빈 코드)'}</pre>
          )}
        </>
      )}
    </div>
  );
}
