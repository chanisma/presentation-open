import { useEffect, useMemo, useRef, useState } from 'react';
import { DECKS, DECK_MAP, type DeckMeta } from '../decks/registry';
import './hub.css';

/* ── pages.json 스키마 ────────────────────────────────────────────────
   레거시 허브와 동일한 파일을 런타임에 fetch한다. 덱 등록 스킬
   (update_pages_json.py 등)이 계속 이 파일을 갱신하므로, 레거시 덱
   추가에는 리빌드가 필요 없다. 네이티브 React 덱은 registry.tsx의
   DeckMeta(subject 필드)로 각 과목 섹션에 병합된다. */
type PageTag = { label: string; color?: string };
type PageEntry = {
  title: string;
  path: string;
  emoji?: string;
  description?: string;
  tags?: PageTag[];
  gradient?: string;
  live?: boolean;
  /** 'deck'=페이지형 슬라이드(뷰어로 열기) · 'doc'=활동지/문서(원본 열기).
      scripts/classify-pages.mjs 가 런타임 판정으로 기록한다. */
  type?: 'deck' | 'doc';
  /** 생성일(ISO) — scripts/stamp-created.mjs 가 git 이력에서 기록. 섹션 내 정렬 기준. */
  created?: string;
};
/** 학기·구분 그룹 (data/2026-1 · data/dev 폴더 구조와 짝) */
type Group = { id: string; label: string; icon?: string; description?: string };
type Subject = {
  name: string;
  icon?: string;
  color?: string;
  /** groups[].id 참조 — 없으면 'etc' */
  group?: string;
  pages: PageEntry[];
};
type PagesData = {
  title?: string;
  description?: string;
  school?: string;
  year?: string;
  groups?: Group[];
  subjects: Subject[];
};

const FALLBACK_GROUP = 'etc';

/* 레거시 카드와 네이티브 덱 카드를 하나의 렌더 모델로 통일 */
type HubCard = {
  key: string;
  href: string;
  title: string;
  emoji: string;
  description: string;
  tags: string[];
  tagColors: (string | undefined)[];
  gradient?: string;
  /** 라이브 문항(퀴즈)이 등록되어 있다 — QUIZ 배지 */
  live: boolean;
  /** "발표" — 교사 콘솔로 진입. 문항 유무와 무관하며,
      라이브 세션에 연결할 수 없는 문서형 자료(type:'doc')만 없다 */
  hostHref?: string;
  /** "편집" — 로컬 덱 에디터(?app=edit). 웹앱 덱만, dev 서버에서만 렌더한다 */
  editHref?: string;
  native?: { slides: number; accent: string };
  /** 활동지·문서형 자료 (뷰어가 아닌 원본으로 연다) */
  doc?: boolean;
  /** 생성일(ISO) — 섹션 내 최신순 정렬 기준 */
  created?: string;
  /** 소속 과목 — 검색 대상에 포함(“정보 반복문”으로도 찾을 수 있게) */
  subject?: string;
};

const TAG_HUES: Record<string, string> = {
  blue: '#5aa9ff',
  green: '#4fe5b0',
  purple: '#a78bfa',
  orange: '#ffb45c',
};

/* 허브는 /hub 에서 서빙되므로 카드 링크는 전부 사이트 루트 기준으로 만든다
   (상대 경로면 현재 경로 아래로 잘못 붙는다). */
function rootUrl(path: string) {
  return path.startsWith('/') ? path : `/${path}`;
}

function legacyCard(p: PageEntry): HubCard {
  // 제목이 emoji 필드와 같은 이모지로 시작하면 중복 표기를 걷어낸다
  // (카드 상단에 이모지를 크게 따로 그리므로)
  const title =
    p.emoji && p.title.startsWith(p.emoji)
      ? p.title.slice(p.emoji.length).trim()
      : p.title;
  const isDoc = p.type === 'doc';
  // index.html?… 관례로 등록된 SPA 라우트(컴포지트 덱 등)는 뷰어를 거치지 않는다
  const isSpaRoute = p.path.startsWith('index.html?');
  return {
    key: p.path,
    // 슬라이드 덱은 진짜 bolt 크롬(독·그리드·주석·프레젠터)을 입히는 뷰어로,
    // 활동지·문서형 자료(type:'doc')는 원본 그대로 연다.
    // 원본 직접 URL(공유 링크)은 chrome.js 폴백 독으로 계속 동작한다.
    href:
      isDoc || isSpaRoute
        ? rootUrl(p.path)
        : `/?legacy=${encodeURIComponent(p.path)}`,
    doc: isDoc,
    title,
    emoji: p.emoji ?? '📄',
    description: p.description ?? '',
    tags: (p.tags ?? []).map((t) => t.label),
    tagColors: (p.tags ?? []).map((t) => t.color),
    gradient: p.gradient,
    live: !!p.live,
    // 발표(라이브 세션)는 문항이 없어도 가능하므로 모든 수업에 건다.
    // 문서형 자료는 교사 콘솔이 덱 목록에서 걸러내므로(HostPage: type!=='doc') 제외.
    hostHref: isDoc ? undefined : `/?app=host&deck=${encodeURIComponent(p.path)}`,
    created: p.created,
  };
}

function nativeCard(d: DeckMeta, created?: string): HubCard {
  return {
    key: `deck:${d.id}`,
    href: `/?deck=${d.id}#1`,
    title: d.title,
    emoji: d.favicon,
    description: d.description,
    tags: d.tags ?? [],
    tagColors: (d.tags ?? []).map(() => undefined),
    live: !!d.quizJson,
    // pages.json의 네이티브 덱 path 관례와 동일한 문자열이어야
    // 교사 콘솔의 ?deck= 딥링크 프리필(옵션 값 일치 검사)이 동작한다
    hostHref: `/?app=host&deck=${encodeURIComponent(`index.html?deck=${d.id}`)}`,
    editHref: `/?app=edit&deck=${d.id}`,
    native: { slides: d.slides, accent: d.accent },
    created,
  };
}

/* pages.json에도 등록된 네이티브 덱(path: index.html?deck=<id>)은
   registry 카드로 승격 렌더 — 같은 덱이 두 번 나오지 않게 거른다 */
function isNativePath(path: string) {
  const m = path.match(/^index\.html\?deck=([\w-]+)$/);
  return m ? m[1] : null;
}

function cardMatches(card: HubCard, tokens: string[]) {
  if (!tokens.length) return true;
  const hay =
    `${card.title} ${card.description} ${card.tags.join(' ')} ${card.subject ?? ''}`.toLowerCase();
  return tokens.every((t) => hay.includes(t));
}

type Section = { name: string; icon: string; group: string; cards: HubCard[] };

export default function Hub() {
  const [data, setData] = useState<PagesData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<string | null>(null);
  /* 학기·구분 필터 — null이면 전체. ?group=2026-1 딥링크로 바로 열 수 있다
     (예: /hub?group=2026-1 → 이번 학기 수업만) */
  const [group, setGroup] = useState<string | null>(
    () => new URLSearchParams(location.search).get('group')
  );
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    // 허브는 /hub 에서 서빙되므로 루트 기준으로 받아온다
    fetch('/pages.json')
      .then((r) => {
        if (!r.ok) throw new Error(`pages.json HTTP ${r.status}`);
        return r.json();
      })
      .then((d: PagesData) => alive && setData(d))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  // '/'로 검색 포커스, Esc로 초기화 — 덱 엔진의 단축키 감성과 맞춘다
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
      if (e.key === '/' && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'Escape' && typing) {
        setQuery('');
        searchRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const sections: Section[] = useMemo(() => {
    if (!data) return [];
    const out: Section[] = data.subjects.map((s) => {
      // 네이티브 덱은 registry 카드로 승격 렌더되므로, 생성일은
      // pages.json의 같은 path 항목(stamp-created.mjs가 기록)에서 가져온다
      const createdByPath = new Map(s.pages.map((p) => [p.path, p.created]));
      const cards = [
        ...DECKS.filter((d) => d.subject === s.name).map((d) =>
          nativeCard(d, createdByPath.get(`index.html?deck=${d.id}`))
        ),
        ...s.pages
          .filter((p) => {
            const id = isNativePath(p.path);
            return !(id && DECK_MAP[id]);
          })
          .map(legacyCard),
      ];
      // 생성순 정렬 — 최신 먼저. created 없는 카드는 뒤로, 동률은 기존 순서 유지(stable)
      cards.sort((a, b) => (b.created ?? '').localeCompare(a.created ?? ''));
      for (const c of cards) c.subject = s.name;
      return {
        name: s.name,
        icon: s.icon ?? '📁',
        group: s.group ?? FALLBACK_GROUP,
        cards,
      };
    });
    const known = new Set(data.subjects.map((s) => s.name));
    const orphans = DECKS.filter((d) => !d.subject || !known.has(d.subject));
    if (orphans.length)
      out.push({
        name: '웹앱 덱',
        icon: '⚡',
        group: FALLBACK_GROUP,
        cards: orphans.map((d) => nativeCard(d)),
      });
    return out;
  }, [data]);

  /* 그룹 칩 — pages.json groups 순서를 따르고, 자료가 없는 그룹은 숨긴다 */
  const groups = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of sections)
      counts.set(s.group, (counts.get(s.group) ?? 0) + s.cards.length);
    const declared = data?.groups ?? [];
    const listed = declared.filter((g) => counts.has(g.id));
    // pages.json에 선언되지 않은 그룹이 있으면 뒤에 붙여 누락 없이 노출
    for (const id of counts.keys())
      if (!listed.some((g) => g.id === id)) listed.push({ id, label: id });
    return listed.map((g) => ({ ...g, count: counts.get(g.id) ?? 0 }));
  }, [sections, data]);

  const activeGroup = groups.some((g) => g.id === group) ? group : null;
  const groupMeta = groups.find((g) => g.id === activeGroup) ?? null;

  // 그룹 선택을 URL에 반영해 공유·새로고침에도 살아남게 한다
  useEffect(() => {
    const url = new URL(location.href);
    if (activeGroup) url.searchParams.set('group', activeGroup);
    else url.searchParams.delete('group');
    if (url.href !== location.href) history.replaceState(null, '', url.href);
  }, [activeGroup]);

  // 그룹 밖의 과목 탭이 남아 있으면 해제 (빈 화면 방지)
  useEffect(() => {
    if (!tab) return;
    const s = sections.find((x) => x.name === tab);
    if (activeGroup && s && s.group !== activeGroup) setTab(null);
  }, [activeGroup, tab, sections]);

  const tokens = useMemo(
    () => query.toLowerCase().split(/\s+/).filter(Boolean),
    [query]
  );

  // 선택한 학기·구분에 속한 과목 섹션 (그룹 미선택이면 전체)
  const inGroup: Section[] = useMemo(
    () => sections.filter((s) => !activeGroup || s.group === activeGroup),
    [sections, activeGroup]
  );

  const visible: Section[] = useMemo(
    () =>
      inGroup
        .filter((s) => tab === null || s.name === tab)
        .map((s) => ({ ...s, cards: s.cards.filter((c) => cardMatches(c, tokens)) }))
        .filter((s) => s.cards.length > 0),
    [inGroup, tab, tokens]
  );

  // 지금 화면에 실제로 보이는 것에 대한 상태 표시 (필터·검색 반영 후)
  const shown = useMemo(() => {
    const all = visible.flatMap((s) => s.cards);
    return { total: all.length, live: all.filter((c) => c.live).length };
  }, [visible]);

  const filtered = !!query || !!tab || !!activeGroup;
  const resetAll = () => {
    setQuery('');
    setTab(null);
    setGroup(null);
  };

  if (error)
    return (
      <div className="hub">
        <div className="hub-shell hub-center">
          <h1 className="hub-state-title">자료 목록을 불러오지 못했습니다</h1>
          <p className="hub-state-sub">{error}</p>
          <button className="hub-action" onClick={() => location.reload()}>
            다시 시도
          </button>
        </div>
      </div>
    );

  if (!data)
    return (
      <div className="hub">
        <div className="hub-shell hub-center">
          <p className="hub-state-sub hub-pulse">불러오는 중…</p>
        </div>
      </div>
    );

  return (
    <div className="hub">
      {/* 상단 바 — 반투명 재질 위로 콘텐츠가 흘러 지나간다.
          찾기(검색) · 분류(학기·과목) · 활용(참여·콘솔)만 남긴다. */}
      <header className="hub-bar">
        <div className="hub-bar-row">
          <a className="hub-mark" href="/hub" title={data.school ?? ''}>
            <span className="hub-mark-dot" aria-hidden />
            수업 자료
          </a>

          <div className="hub-search">
            <span className="hub-search-icon" aria-hidden>
              🔎
            </span>
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="자료 검색"
              aria-label="자료 검색"
            />
            {query ? (
              <button
                type="button"
                className="hub-search-clear"
                aria-label="검색 지우기"
                onClick={() => {
                  setQuery('');
                  searchRef.current?.focus();
                }}
              >
                ✕
              </button>
            ) : (
              <kbd className="hub-search-kbd" aria-hidden>
                /
              </kbd>
            )}
          </div>

          <nav className="hub-actions">
            {/* 학생 참여는 사이트 메인(/) */}
            <a className="hub-action" href="/">
              🙋 <span>학생 참여</span>
            </a>
            <a className="hub-action hub-action--primary" href="/?app=host">
              🎛️ <span>교사 콘솔</span>
            </a>
          </nav>
        </div>

        {/* 분류 — 학기·구분(1차) → 과목(2차). 한 줄, 가로 스크롤. */}
        <div className="hub-filters">
          <div className="hub-seg" role="tablist" aria-label="학기·구분">
            <button
              role="tab"
              aria-selected={activeGroup === null}
              className={`hub-seg-btn${activeGroup === null ? ' active' : ''}`}
              onClick={() => setGroup(null)}
            >
              전체
            </button>
            {groups.map((g) => (
              <button
                key={g.id}
                role="tab"
                aria-selected={activeGroup === g.id}
                className={`hub-seg-btn${activeGroup === g.id ? ' active' : ''}`}
                onClick={() => setGroup(activeGroup === g.id ? null : g.id)}
                title={g.description}
              >
                {g.label}
              </button>
            ))}
          </div>

          <span className="hub-filter-sep" aria-hidden />

          <div className="hub-tabs" role="tablist" aria-label="과목">
            <button
              role="tab"
              aria-selected={tab === null}
              className={`hub-tab${tab === null ? ' active' : ''}`}
              onClick={() => setTab(null)}
            >
              모든 과목
            </button>
            {inGroup.map((s) => (
              <button
                key={s.name}
                role="tab"
                aria-selected={tab === s.name}
                className={`hub-tab${tab === s.name ? ' active' : ''}`}
                onClick={() => setTab(tab === s.name ? null : s.name)}
              >
                <span aria-hidden>{s.icon}</span> {s.name}
                <span className="hub-tab-n">{s.cards.length}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="hub-shell">
        {/* 상태 — 지금 무엇을 보고 있는지 한 줄로 */}
        <div className="hub-status">
          <span>
            <b>{shown.total}</b>개 자료
          </span>
          {shown.live > 0 && (
            <span className="hub-status-live">
              <span className="hub-live-dot" />
              퀴즈 {shown.live}
            </span>
          )}
          {filtered && (
            <button type="button" className="hub-reset" onClick={resetAll}>
              필터 해제
            </button>
          )}
        </div>

        {visible.length === 0 && (
          <div className="hub-empty">
            <p className="hub-state-sub">
              {query
                ? `‘${query}’에 해당하는 자료가 없습니다.`
                : '표시할 자료가 없습니다.'}
            </p>
            {filtered && (
              <button type="button" className="hub-action" onClick={resetAll}>
                필터 해제
              </button>
            )}
          </div>
        )}

        {visible.map((s) => (
          <section key={s.name} className="hub-section">
            <div className="hub-section-head">
              <h2>
                <span aria-hidden>{s.icon}</span> {s.name}
              </h2>
              <span className="hub-section-n">{s.cards.length}</span>
            </div>
            <div className="hub-grid">
              {s.cards.map((c) => (
                <Card key={c.key} card={c} />
              ))}
            </div>
          </section>
        ))}

        <footer className="hub-foot">
          <span>
            {data.school} · {data.year}
          </span>
          <a href="/legacy-hub.html">구버전 허브</a>
        </footer>
      </div>
    </div>
  );
}

function Card({ card }: { card: HubCard }) {
  /* 카드 전체가 클릭 영역이지만 내부에 "발표 시작" 앵커가 있어
     중첩 <a>를 피하려고 div[role=link] + 수동 내비게이션을 쓴다
     (레거시 허브의 dataset.href 패턴과 동일한 동작) */
  const open = () => {
    location.href = card.href;
  };
  return (
    <div
      className="mat hub-card"
      role="link"
      tabIndex={0}
      aria-label={card.title}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('a')) return;
        open();
      }}
      onKeyDown={(e) => {
        // 카드 안의 '발표' 링크에 포커스가 있을 때는 링크가 이기게 둔다
        if (e.key !== 'Enter') return;
        if ((e.target as HTMLElement).closest('a')) return;
        open();
      }}
    >
      {card.gradient && (
        <span className="hub-card-bar" style={{ background: card.gradient }} />
      )}
      {card.native && (
        <span
          className="hub-card-bar"
          style={{
            background: `linear-gradient(90deg, ${card.native.accent}, transparent)`,
          }}
        />
      )}
      <div className="hub-card-head">
        <span className="hub-emoji" aria-hidden>
          {card.emoji}
        </span>
        <span className="hub-badges">
          {card.native && <span className="hub-badge-app">웹앱</span>}
          {card.doc && <span className="hub-badge-doc">자료</span>}
          {card.live && (
            <span className="hub-badge-quiz" title="실시간 참여 문항이 준비된 수업">
              QUIZ
            </span>
          )}
        </span>
      </div>
      {/* 본문 래퍼 — 설명의 줄 수 제한(-webkit-line-clamp)은 플렉스 아이템에서
          블록화되어 무시되므로, 늘어나는 쪽은 래퍼가 맡는다 */}
      <div className="hub-card-body">
        <h3 className="hub-card-title">{card.title}</h3>
        <p className="hub-card-desc">{card.description}</p>
      </div>
      <div className="hub-card-foot">
        <div className="hub-chips">
          {card.tags.slice(0, 3).map((t, i) => {
            const hue = card.tagColors[i] ? TAG_HUES[card.tagColors[i]!] : undefined;
            return (
              <span
                key={t}
                className="hub-chip"
                style={
                  hue
                    ? {
                        color: hue,
                        borderColor: `color-mix(in srgb, ${hue} 35%, transparent)`,
                      }
                    : undefined
                }
              >
                {t}
              </span>
            );
          })}
        </div>
        <span className="hub-card-cta">
          {card.native ? `${card.native.slides}장` : ''}
          {/* 열기(자료 보기) · 발표(교사 콘솔에서 라이브 세션) — 둘 다 상시 노출 */}
          <span className="hub-acts">
            <span className="hub-open">열기</span>
            {card.hostHref && (
              <a
                className="hub-present"
                href={card.hostHref}
                title="교사 콘솔에서 이 수업으로 라이브 세션을 시작합니다"
                onClick={(e) => e.stopPropagation()}
              >
                ▶ 발표
              </a>
            )}
            {/* 편집은 dev 서버에서만 — 파일 쓰기 API가 dev 플러그인이다 */}
            {import.meta.env.DEV && card.editHref && (
              <a
                className="hub-edit"
                href={card.editHref}
                title="이 컴퓨터의 원본 파일을 고칩니다"
                onClick={(e) => e.stopPropagation()}
              >
                ✎ 편집
              </a>
            )}
          </span>
        </span>
      </div>
    </div>
  );
}
