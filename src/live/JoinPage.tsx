import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  loadCharts,
  loadCodeRunner,
  loadConfig,
  loadDriver,
  type Channel,
  type ConfigModule,
  type Driver,
  type JoinResult,
  type LiveActivity,
  type PythonRunner,
  type StudentState,
} from './runtime';
import './live.css';

/* ── 학생 참여 페이지 (클래식 live/join의 React 재구현, bolt 디자인) ──
   프로토콜 계약은 클래식과 동일:
   · broadcast는 핑+동봉이고 진실은 항상 studentState 재조회로 수렴
   · 제출 payload 형태·localStorage 키(lp.ans/lp.draft/lp.nickname 등) 유지
   · 미러 모드: React 덱은 hash 내비, 클래식 덱은 .slide.active 토글 */

const CODE_RE = /^[A-Z0-9]{6}$/;
const RATING_LABELS = ['전혀 모르겠어요', '조금 어려웠어요', '보통이에요', '잘 이해했어요', '완벽해요!'];
const KIND_LABEL: Record<string, string> = {
  choice: '객관식', ox: 'OX 퀴즈', short: '주관식', wordcloud: '워드클라우드',
  exit: '출구티켓', code: '코드 실습',
};

function myAnswer(actId: string, round: number): Record<string, any> | null {
  try {
    return JSON.parse(localStorage.getItem(`lp.ans.${actId}:${round}`) || 'null');
  } catch {
    return null;
  }
}

function normalizeJoinError(msg: string) {
  return /not found|ended/i.test(msg)
    ? '세션을 찾을 수 없습니다. 코드를 확인하거나 선생님께 문의하세요.'
    : msg;
}

type Sys = { cfg: ConfigModule; driver: Driver };

export default function JoinPage() {
  const [phase, setPhase] = useState<'form' | 'sno' | 'session'>('form');
  const [busy, setBusy] = useState(false);
  const [joinErr, setJoinErr] = useState('');
  const sysRef = useRef<Sys | null>(null);
  const meRef = useRef<JoinResult | null>(null);
  const chanRef = useRef<Channel | null>(null);
  const codeRef = useRef('');
  const [st, setSt] = useState<StudentState | null>(null);
  // answered는 ref가 진실(상태 업데이터 안에서 다른 setState를 부르면 안 되므로),
  // tick은 재렌더 트리거 전용
  const answeredRef = useRef<Set<string>>(new Set());
  const [, setAnsweredTick] = useState(0);
  const lastSigRef = useRef('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconcileRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endedRef = useRef(false);
  // 교사가 푼 "학생 조작 허용" (세션 플래그 v11) — 차단막 제거 + 미러 재동기화 억제
  const [interact, setInteract] = useState(false);
  const interactRef = useRef(false);
  const lastMirrorClicksRef = useRef(-1);
  const applyInteract = useCallback((v: unknown) => {
    if (typeof v !== 'boolean' || v === interactRef.current) return;
    interactRef.current = v;
    setInteract(v);
  }, []);

  const params = useMemo(() => new URLSearchParams(location.search), []);

  useEffect(() => {
    document.title = '수업 참여 — 라이브';
    let alive = true;
    (async () => {
      const cfg = await loadConfig();
      const driver = await loadDriver();
      if (alive) sysRef.current = { cfg, driver };
    })().catch((e) => alive && setJoinErr('연결 준비 실패: ' + e.message));
    return () => {
      alive = false;
      if (pollRef.current) clearInterval(pollRef.current);
      if (reconcileRef.current) clearTimeout(reconcileRef.current);
      chanRef.current?.close();
    };
  }, []);

  /* ── 상태 수렴 ── */
  const sigOf = useCallback(
    (s: StudentState | null, ans: Set<string>) => {
      if (!s) return '';
      const a = s.currentActivity;
      // code 문항은 제출 여부로 재렌더하지 않음 (작성 중 코드 보호)
      const answeredSig = a
        ? a.kind === 'code'
          ? 'code'
          : String(ans.has(`${a.id}:${a.round || 1}`))
        : '';
      return [
        s.status, a?.id ?? '', a?.status ?? '', a?.round ?? 1,
        s.revealedAggregates?.total ?? '', answeredSig,
      ].join('|');
    },
    []
  );

  const applyState = useCallback(
    (s: StudentState, force = false) => {
      if (endedRef.current) return;
      if (s.status === 'ended') {
        endedRef.current = true;
        if (pollRef.current) clearInterval(pollRef.current);
      }
      // DB 슬라이드는 입장·재접속 복구용 — 호스트의 DB 반영이 디바운스라
      // 연타 직후 옛 값일 수 있다. 최근 브로드캐스트 핑이 있으면 핑이 우선.
      if (
        Number.isInteger(s.currentSlide) &&
        Date.now() - lastSlidePingAtRef.current > 4000
      )
        syncMirror(s.currentSlide as number);
      const sig = sigOf(s, answeredRef.current);
      if (!force && sig === lastSigRef.current) return; // 타이핑 보호 — 재렌더 스킵
      lastSigRef.current = sig;
      setSt(s);
    },
    [sigOf] // syncMirror는 안정 ref 기반
  );

  const refresh = useCallback(
    async (force = false) => {
      const sys = sysRef.current;
      if (!sys || !codeRef.current || endedRef.current) return;
      try {
        const s = await sys.driver.studentState(codeRef.current, sys.cfg.getClientId());
        applyInteract(s.allowInteract);
        applyState(s, force);
      } catch {
        /* 다음 폴링에서 재시도 */
      }
    },
    [applyInteract, applyState]
  );

  const scheduleReconcile = useCallback(() => {
    if (reconcileRef.current) clearTimeout(reconcileRef.current);
    reconcileRef.current = setTimeout(() => refresh(), 1500);
  }, [refresh]);

  /* ── 미러 모드 (ref 기반 — 재렌더와 독립) ── */
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const mirrorReadyRef = useRef(false);
  const lastKnownSlideRef = useRef(0);
  const lastKnownClicksRef = useRef(0);
  const lastMirrorSlideRef = useRef(-1);
  // 슬라이드 핑 순서 보호 + DB 보정이 최근 핑을 되돌리지 않게 하는 기준 시각
  const lastSlideSeqRef = useRef(0);
  const lastSlidePingAtRef = useRef(0);
  const [peek, setPeek] = useState(false);
  const modalKeyRef = useRef('');

  function syncMirror(n?: number, clicks?: number) {
    if (Number.isInteger(n)) lastKnownSlideRef.current = n as number;
    if (Number.isInteger(clicks)) lastKnownClicksRef.current = clicks as number;
    const frame = frameRef.current;
    if (!frame || !mirrorReadyRef.current) return;
    try {
      const doc = frame.contentDocument;
      if (!doc) return;
      const idx = lastKnownSlideRef.current;
      if (doc.getElementById('root')) {
        // 네이티브 React 덱 — hash 내비게이션(초기 진입 안전망) +
        // postMessage로 빌드 단계(clicks)까지 전달 (엔진의 미러 수신 effect)
        // 학생 조작 허용 중에는 "같은 위치"를 되풀이 밀어넣지 않는다 — 5초 폴링이
        // 학생이 방금 넘긴 슬라이드를 되돌리기 때문. 교사가 실제로 움직였을 때만 따라간다.
        if (
          interactRef.current &&
          idx === lastMirrorSlideRef.current &&
          lastKnownClicksRef.current === lastMirrorClicksRef.current
        )
          return;
        const target = '#' + (idx + 1);
        if (frame.contentWindow!.location.hash !== target)
          frame.contentWindow!.location.hash = target;
        frame.contentWindow!.postMessage(
          { type: 'deck-mirror', slide: idx, clicks: lastKnownClicksRef.current },
          location.origin
        );
        lastMirrorSlideRef.current = idx;
        lastMirrorClicksRef.current = lastKnownClicksRef.current;
        return;
      }
      const slides = doc.querySelectorAll('.slide');
      if (!slides.length) return;
      const clamped = Math.max(0, Math.min(slides.length - 1, idx));
      if (clamped === lastMirrorSlideRef.current) return;
      lastMirrorSlideRef.current = clamped;
      slides.forEach((s, i) => s.classList.toggle('active', i === clamped));
    } catch {
      /* 프레임 접근 불가 — 다음 동기화에서 재시도 */
    }
  }

  /* ── 슬라이드 안 위젯 상태 (예: 업다운 게임) — 호스트 LiveBridge가 보낸 것을 미러에 넣는다 ── */
  const widgetsRef = useRef(new Map<string, unknown>());
  function postWidgets() {
    const win = frameRef.current?.contentWindow;
    if (!win || !mirrorReadyRef.current) return;
    widgetsRef.current.forEach((state, id) => {
      try {
        win.postMessage({ type: 'deck-widget', id, state }, location.origin);
      } catch { /* 다음 핑에서 재시도 */ }
    });
  }

  /* ── broadcast 수신 ── */
  const onPing = useCallback(
    (p: Record<string, any>) => {
      if (!p || !p.type) return refresh();
      if (p.type === 'widget') {
        if (typeof p.id === 'string' && p.state) {
          widgetsRef.current.set(p.id, p.state);
          postWidgets();
        }
        return; // 재렌더 없음
      }
      if (p.type === 'slide') {
        if (Number.isInteger(p.index)) {
          // 연타 시 순서 역전 도착한 옛 핑은 버린다 (seq 단조 증가)
          if (typeof p.seq === 'number') {
            if (p.seq <= lastSlideSeqRef.current) return;
            lastSlideSeqRef.current = p.seq;
          }
          lastSlidePingAtRef.current = Date.now();
          syncMirror(p.index, Number.isInteger(p.clicks) ? p.clicks : 0);
        }
        return; // 재렌더 없음
      }
      if (p.type === 'interact') {
        applyInteract(!!p.on);
        return; // 차단막만 바뀐다 — 문항 상태 재조회 불필요
      }
      if (p.type === 'activity' && p.activity) {
        applyState({ status: 'open', currentActivity: p.activity, revealedAggregates: null }, true);
        scheduleReconcile();
      } else if (p.type === 'close') {
        setSt((prev) => {
          const a = prev?.currentActivity;
          if (a && a.id === p.activityId)
            applyState({ ...prev!, currentActivity: { ...a, status: 'closed' } }, true);
          return prev;
        });
        scheduleReconcile();
      } else if (p.type === 'reveal') {
        setSt((prev) => {
          const a = prev?.currentActivity;
          if (a && a.id === p.activityId)
            applyState(
              { ...prev!, currentActivity: { ...a, status: 'revealed' }, revealedAggregates: p.agg },
              true
            );
          return prev;
        });
        scheduleReconcile();
      } else if (p.type === 'end') {
        applyState({ status: 'ended', currentActivity: null }, true);
      } else if (p.type === 'submitted') {
        /* 다른 학생 제출 핑 — 교사용 */
      } else {
        refresh();
      }
    },
    [applyInteract, applyState, refresh, scheduleReconcile]
  );

  /* ── 입장 흐름 ── */
  async function doJoin(code: string, nickname: string, studentNo?: string | null) {
    const sys = sysRef.current;
    if (!sys) {
      setJoinErr('아직 연결 준비 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    setBusy(true);
    setJoinErr('');
    try {
      const me = await sys.driver.join(code, {
        clientId: sys.cfg.getClientId(),
        nickname,
        studentNo: studentNo || null,
      });
      meRef.current = { ...me, code };
      codeRef.current = code;
      sessionStorage.setItem('lp.code', code);
      if (me.nameMode === 'named' && !me.myStudentNo) {
        setPhase('sno');
        return;
      }
      await enterSession();
    } catch (e) {
      setJoinErr(normalizeJoinError((e as Error).message));
    } finally {
      setBusy(false);
    }
  }

  async function enterSession() {
    const sys = sysRef.current!;
    const me = meRef.current!;
    const ans = new Set<string>();
    (me.myResponses || []).forEach((r) => ans.add(`${r.activityId}:${r.round || 1}`));
    answeredRef.current = ans;
    setAnsweredTick((t) => t + 1);
    endedRef.current = false;
    lastSigRef.current = '';
    applyInteract(!!me.allowInteract);
    setPhase('session');
    applyState(
      {
        status: 'open',
        currentActivity: me.currentActivity,
        currentSlide: me.currentSlide,
        revealedAggregates: null,
      },
      true
    );
    chanRef.current = await sys.driver.connectChannel(codeRef.current, onPing);
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => refresh(), chanRef.current.ok ? 5000 : 2000);
    refresh();
  }

  /* ── 제출 ── */
  const [subErr, setSubErr] = useState('');
  const submitActivity = useCallback(
    async (a: LiveActivity, payload: Record<string, any>) => {
      const sys = sysRef.current!;
      const me = meRef.current!;
      setSubErr('');
      const r = await sys.driver.submit(
        a.id, me.participantId, sys.cfg.getClientId(), payload, 1
      );
      if (r.ok || r.reason === 'duplicate') {
        const round = r.round || a.round || 1;
        answeredRef.current.add(`${a.id}:${round}`);
        setAnsweredTick((t) => t + 1);
        try {
          localStorage.setItem(`lp.ans.${a.id}:${round}`, JSON.stringify(payload));
          localStorage.removeItem(`lp.draft.${a.id}`);
        } catch { /* 저장 실패 무시 */ }
        chanRef.current?.send({ type: 'submitted' });
        refresh(true);
        return r;
      }
      if (r.reason === 'not_open') {
        setSubErr('답변이 마감되었습니다.');
        refresh(true);
      } else {
        setSubErr('제출 실패: ' + (r.reason || '알 수 없는 오류'));
      }
      throw new Error(r.reason || 'submit failed');
    },
    [refresh]
  );

  /* ── 파생 표시 상태 ── */
  const a = st?.currentActivity ?? null;
  const round = a?.round || 1;
  const answeredNow = a ? answeredRef.current.has(`${a.id}:${round}`) : false;
  const mirror = phase === 'session' && !!meRef.current?.deckPath;
  const showable = !!(a && (a.status === 'open' || a.status === 'revealed')) || st?.status === 'ended';
  const modalKey = a ? `${a.id}:${a.status}:${round}` : '';
  useEffect(() => {
    if (modalKey !== modalKeyRef.current) {
      modalKeyRef.current = modalKey;
      setPeek(false); // 새 문항/상태 전환 시 peek 자동 해제
    }
  }, [modalKey]);

  const rootCls = [
    'lv',
    mirror ? 'lv--mirror' : '',
    mirror && !showable ? 'lv--idle' : '',
    mirror && peek ? 'lv--peek' : '',
  ].join(' ');

  return (
    <div className={rootCls}>
      {mirror && (
        <div className="lv-mirror-wrap">
          <iframe
            ref={(el) => {
              frameRef.current = el;
            }}
            title="선생님 수업 화면"
            src={mirrorSrc(meRef.current?.deckPath || '')}
            onLoad={() => {
              mirrorReadyRef.current = true;
              lastMirrorSlideRef.current = -1;
              try {
                // 미러 전용: 슬라이드 전환 짧게 (반응 체감)
                const doc = frameRef.current?.contentDocument;
                if (doc) {
                  const s = doc.createElement('style');
                  s.textContent = '.slide { transition-duration: .18s !important; }';
                  doc.head.appendChild(s);
                }
              } catch { /* 접근 불가 시 원본 유지 */ }
              syncMirror();
              // 덱 모듈이 뜬 뒤에 위젯 상태를 넣는다 (React 덱은 onLoad 뒤에 모듈을 읽는다)
              setTimeout(postWidgets, 1500);
            }}
          />
          {/* 교사가 "학생 조작"을 풀면 차단막을 걷어 학생이 덱을 직접 누를 수 있다 */}
          {!interact && <div className="lv-mirror-shield" />}
        </div>
      )}

      <div className="lv-shell">
        <header className="lv-top">
          <div className="lv-top__brand">
            <span className="kicker">LIVE</span>
            <span className="lv-top__title">
              {phase === 'session'
                ? `세션 ${codeRef.current}${meRef.current?.title ? ' · ' + meRef.current.title : ''}`
                : '수업 참여하기'}
            </span>
          </div>
        </header>

        {phase === 'form' && (
          <JoinForm
            initialCode={(params.get('code') || sessionStorage.getItem('lp.code') || '').toUpperCase()}
            busy={busy}
            error={joinErr}
            onJoin={(code, nick) => doJoin(code, nick, localStorage.getItem('lp.studentNo'))}
          />
        )}

        {phase === 'sno' && (
          <SnoForm
            busy={busy}
            error={joinErr}
            onSubmit={(sno) => {
              localStorage.setItem('lp.studentNo', sno);
              doJoin(codeRef.current, localStorage.getItem('lp.nickname') || '', sno);
            }}
          />
        )}

        {phase === 'session' && st && (
          <SessionView
            st={st}
            answered={answeredNow}
            subErr={subErr}
            onSubmit={submitActivity}
          />
        )}
      </div>

      {mirror && (
        <div className="lv-pill">
          <span>
            {!showable
              ? interact
                ? `세션 ${codeRef.current} · 직접 넘겨볼 수 있어요 — 선생님이 넘기면 그 화면으로 돌아갑니다`
                : `세션 ${codeRef.current} · 선생님 화면을 따라가는 중 — 문항이 열리면 여기에 표시됩니다`
              : peek
                ? '문항이 열려 있어요'
                : `세션 ${codeRef.current}`}
          </span>
          {showable && (
            <button type="button" onClick={() => setPeek((p) => !p)}>
              {peek ? '문항 보기' : '슬라이드만 보기'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function mirrorSrc(deckPath: string) {
  // 디렉터리 URL (서버의 .html 리다이렉트 쿼리 소실 무관, ?live 없음 → 일반 덱)
  // 네이티브 덱(쿼리 포함)은 그대로 사용. SPA는 루트에서 서빙되므로 루트 상대.
  if (deckPath.includes('?')) return deckPath;
  return deckPath.replace(/index\.html$/, '');
}

/* ── 입장 폼 ── */
function JoinForm({
  initialCode, busy, error, onJoin,
}: {
  initialCode: string;
  busy: boolean;
  error: string;
  onJoin: (code: string, nick: string) => void;
}) {
  const [code, setCode] = useState(initialCode);
  const [nick, setNick] = useState(localStorage.getItem('lp.nickname') || '');
  const [localErr, setLocalErr] = useState('');
  const codeInput = useRef<HTMLInputElement>(null);
  const nickInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    (initialCode ? nickInput : codeInput).current?.focus();
  }, [initialCode]);

  const go = () => {
    const c = code.trim().toUpperCase();
    if (!CODE_RE.test(c)) return setLocalErr('세션 코드는 6자리 영문·숫자입니다.');
    if (!nick.trim()) return setLocalErr('이름을 입력해주세요.');
    setLocalErr('');
    localStorage.setItem('lp.nickname', nick.trim());
    onJoin(c, nick.trim());
  };
  const err = localErr || error;

  return (
    <div className="mat lv-card">
      <h2>수업 참여하기</h2>
      <p className="lv-sub">선생님이 알려준 6자리 세션 코드를 입력하세요.</p>
      <label className="lv-label" htmlFor="lvCode">세션 코드</label>
      <input
        id="lvCode" ref={codeInput} className="lv-input lv-input--code" maxLength={6}
        value={code} placeholder="ABC123" autoComplete="off"
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        onKeyDown={(e) => e.key === 'Enter' && go()}
      />
      <label className="lv-label" htmlFor="lvNick">이름</label>
      <input
        id="lvNick" ref={nickInput} className="lv-input" maxLength={30}
        value={nick} placeholder="예: 한시우"
        onChange={(e) => setNick(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && go()}
      />
      <button className="lv-btn lv-btn--block" onClick={go} disabled={busy}>
        {busy ? '입장 중…' : '참여하기'}
      </button>
      <div className={`lv-error${err ? ' show' : ''}`}>{err}</div>
    </div>
  );
}

/* ── 학번 폼 (기명 세션) ── */
function SnoForm({
  busy, error, onSubmit,
}: {
  busy: boolean;
  error: string;
  onSubmit: (sno: string) => void;
}) {
  const [sno, setSno] = useState(localStorage.getItem('lp.studentNo') || '');
  const [localErr, setLocalErr] = useState('');
  const go = () => {
    if (!sno.trim()) return setLocalErr('학번을 입력해주세요.');
    setLocalErr('');
    onSubmit(sno.trim());
  };
  const err = localErr || error;
  return (
    <div className="mat lv-card">
      <h2>학번 입력</h2>
      <p className="lv-sub">기명 세션입니다. 학번을 입력하면 참여가 완료됩니다.</p>
      <label className="lv-label" htmlFor="lvSno">학번</label>
      <input
        id="lvSno" className="lv-input" maxLength={20} value={sno} placeholder="예: 10130"
        autoFocus onChange={(e) => setSno(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && go()}
      />
      <button className="lv-btn lv-btn--block" onClick={go} disabled={busy}>
        {busy ? '확인 중…' : '입장하기'}
      </button>
      <div className={`lv-error${err ? ' show' : ''}`}>{err}</div>
    </div>
  );
}

/* ── 세션 화면 분기 ── */
function SessionView({
  st, answered, subErr, onSubmit,
}: {
  st: StudentState;
  answered: boolean;
  subErr: string;
  onSubmit: (a: LiveActivity, payload: Record<string, any>) => Promise<any>;
}) {
  const a = st.currentActivity;
  if (st.status === 'ended')
    return (
      <div className="mat lv-card lv-wait">
        <div className="lv-pulse">🎓</div>
        <h2>수업 세션이 종료되었습니다</h2>
        <p className="lv-sub">참여해줘서 고마워요. 다음 수업에서 만나요!</p>
      </div>
    );
  if (!a || a.status === 'closed' || a.status === 'draft')
    return (
      <div className="mat lv-card lv-wait">
        <div className="lv-pulse">⏳</div>
        <p className="lv-sub">잠시만 기다려주세요 — 선생님이 문항을 열면 여기에 표시됩니다.</p>
      </div>
    );
  if (a.status === 'revealed')
    return <RevealedView a={a} agg={st.revealedAggregates || {}} />;
  if (a.kind === 'code')
    return (
      <CodeActivityView
        key={`${a.id}:${a.round || 1}`}
        a={a} answered={answered} subErr={subErr} onSubmit={onSubmit}
      />
    );
  if (answered)
    return (
      <div className="mat lv-card lv-wait">
        <div className="lv-pulse">✅</div>
        <h2>{(a.round || 1) > 1 ? '2차 투표 제출 완료!' : '제출 완료!'}</h2>
        <p className="lv-sub">다른 친구들이 제출할 때까지 기다려주세요.</p>
      </div>
    );
  return (
    <ActivityView
      key={`${a.id}:${a.round || 1}`}
      a={a} subErr={subErr} onSubmit={onSubmit}
    />
  );
}

/* ── 일반 문항 (choice/ox/short/wordcloud/exit) ── */
function ActivityView({
  a, subErr, onSubmit,
}: {
  a: LiveActivity;
  subErr: string;
  onSubmit: (a: LiveActivity, payload: Record<string, any>) => Promise<any>;
}) {
  const cfg = a.config || {};
  const round = a.round || 1;
  const [selected, setSelected] = useState<number | boolean | null>(null);
  const [text, setText] = useState(
    () => localStorage.getItem(`lp.draft.${a.id}`) || ''
  );
  const [rating, setRating] = useState<number | null>(null);
  const [exitText, setExitText] = useState('');
  const [busy, setBusy] = useState(false);
  const first = round > 1 ? myAnswer(a.id, 1) : null;

  const canSubmit = (() => {
    if (a.kind === 'choice' || a.kind === 'ox') return selected !== null;
    if (a.kind === 'exit') return rating !== null;
    return text.trim().length > 0; // wordcloud/short
  })();

  const buildPayload = (): Record<string, any> | null => {
    if (a.kind === 'choice') return selected === null ? null : { choice: selected as number };
    if (a.kind === 'ox') return selected === null ? null : { ox: selected as boolean };
    if (a.kind === 'wordcloud') return text.trim() ? { text: text.trim() } : null;
    if (a.kind === 'exit')
      return rating === null ? null : { rating, text: exitText.trim() };
    return text.trim() ? { text: text.trim() } : null; // short/기타
  };

  const submit = async () => {
    const payload = buildPayload();
    if (!payload || busy) return;
    setBusy(true);
    try {
      await onSubmit(a, payload);
    } catch { /* 오류는 subErr로 표시됨 */ } finally {
      setBusy(false);
    }
  };

  const draftSave = (v: string) => {
    setText(v);
    try {
      localStorage.setItem(`lp.draft.${a.id}`, v);
    } catch { /* 무시 */ }
  };

  // 키보드 단축키: 숫자(보기/별점), O/X(ㅐ/ㅌ), Enter 제출
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable) {
        if (e.key === 'Enter' && el.tagName === 'INPUT') submit();
        return;
      }
      if (a.kind === 'choice' && /^[1-9]$/.test(e.key)) {
        const i = Number(e.key) - 1;
        if (i < (cfg.options || []).length) setSelected(i);
      } else if (a.kind === 'exit' && /^[1-5]$/.test(e.key)) {
        setRating(Number(e.key));
      } else if (a.kind === 'ox' && ['o', 'O', 'ㅐ'].includes(e.key)) {
        setSelected(true);
      } else if (a.kind === 'ox' && ['x', 'X', 'ㅌ'].includes(e.key)) {
        setSelected(false);
      } else if (e.key === 'Enter') {
        submit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="mat lv-card">
      <span className="lv-kind">{KIND_LABEL[a.kind] || a.kind}</span>
      {round > 1 && (
        <div>
          <span className="lv-round-banner">
            🔄 2차 투표 — 친구와 토론한 내용을 반영해 다시 선택하세요
            {first &&
              (a.kind === 'ox'
                ? ` (내 1차 선택: ${first.ox ? 'O' : 'X'})`
                : Number.isInteger(first.choice)
                  ? ` (내 1차 선택: ${first.choice + 1}번)`
                  : '')}
          </span>
        </div>
      )}
      <h2 className="lv-prompt">{a.prompt}</h2>

      {a.kind === 'choice' &&
        (cfg.options || []).map((opt: string, i: number) => (
          <button
            key={i}
            className={`lv-choice${selected === i ? ' sel' : ''}`}
            onClick={() => setSelected(i)}
          >
            <span className="num">{i + 1}</span>
            <span>{opt}</span>
          </button>
        ))}

      {a.kind === 'ox' && (
        <div className="lv-oxwrap">
          <button
            className={`lv-ox lv-ox--o${selected === true ? ' sel' : ''}`}
            onClick={() => setSelected(true)}
          >
            O
          </button>
          <button
            className={`lv-ox lv-ox--x${selected === false ? ' sel' : ''}`}
            onClick={() => setSelected(false)}
          >
            X
          </button>
        </div>
      )}

      {a.kind === 'wordcloud' && (
        <input
          className="lv-input" maxLength={30} value={text} autoFocus
          placeholder="한 단어로 입력해주세요"
          onChange={(e) => draftSave(e.target.value)}
        />
      )}

      {a.kind === 'exit' && (
        <>
          <div className="lv-rating">
            {RATING_LABELS.map((label, i) => (
              <button
                key={i}
                className={rating === i + 1 ? 'sel' : ''}
                onClick={() => setRating(i + 1)}
              >
                <span className="r">{i + 1}</span>
                <span className="t">{label}</span>
              </button>
            ))}
          </div>
          <label className="lv-label" htmlFor="lvExitText">
            오늘 수업 한마디 (선택)
          </label>
          <textarea
            id="lvExitText" className="lv-textarea" maxLength={300} value={exitText}
            placeholder="궁금한 점, 어려웠던 점을 자유롭게"
            onChange={(e) => setExitText(e.target.value)}
          />
        </>
      )}

      {!['choice', 'ox', 'wordcloud', 'exit'].includes(a.kind) && (
        <textarea
          className="lv-textarea" maxLength={500} value={text} autoFocus
          placeholder="답변을 입력해주세요"
          onChange={(e) => draftSave(e.target.value)}
        />
      )}

      <button className="lv-btn lv-btn--block" disabled={!canSubmit || busy} onClick={submit}>
        {busy ? '제출 중…' : round > 1 ? '2차 투표 제출' : '제출하기'}
      </button>
      <div className={`lv-error${subErr ? ' show' : ''}`}>{subErr}</div>
      <p className="lv-hint">
        {a.kind === 'choice' && '숫자 키로 선택하고 Enter로 제출할 수 있어요.'}
        {a.kind === 'ox' && 'O/X 키로 선택하고 Enter로 제출할 수 있어요.'}
        {a.kind === 'exit' && '숫자(1~5) 키로 별점을 고를 수 있어요.'}
      </p>
    </div>
  );
}

/* ── 코드 문항 ── */
type RunRecord = {
  code: string;
  stdout: string;
  error: string | null;
  results: { call: string; expected: string; got: string; ok: boolean }[];
};

const runnerHolder: { runner: PythonRunner | null } = { runner: null };
const lastRunByActivity: Record<string, RunRecord> = {};

function CodeActivityView({
  a, answered, subErr, onSubmit,
}: {
  a: LiveActivity;
  answered: boolean;
  subErr: string;
  onSubmit: (a: LiveActivity, payload: Record<string, any>) => Promise<any>;
}) {
  const cfg = a.config || {};
  const isPy = (cfg.language || 'python') === 'python';
  const tests: { call: string; expected: string }[] = Array.isArray(cfg.tests) ? cfg.tests : [];
  const [code, setCode] = useState(
    () => localStorage.getItem(`lp.draft.${a.id}`) || cfg.starter || ''
  );
  const [engine, setEngine] = useState('');
  const [running, setRunning] = useState(false);
  const [run, setRun] = useState<RunRecord | null>(lastRunByActivity[a.id] || null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const webDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // python 러너 준비 (페이지 수명 동안 단일 인스턴스 재사용)
  useEffect(() => {
    if (!isPy) return;
    let alive = true;
    (async () => {
      const cr = await loadCodeRunner();
      if (!alive) return;
      if (!runnerHolder.runner) {
        runnerHolder.runner = cr.createPythonRunner({
          onStatus: (s) => {
            const map: Record<string, string> = {
              loading: '파이썬 엔진 불러오는 중… (처음 한 번만)',
              ready: '엔진 준비 완료',
              running: '실행 중…',
              error: '엔진 오류 — 다시 실행해보세요',
              'ready-after-reset': '엔진 재시작 완료',
            };
            setEngine(map[s] || s);
          },
        });
      }
      runnerHolder.runner.preload();
    })();
    return () => {
      alive = false;
    };
  }, [isPy]);

  // web 미리보기: 1초 디바운스
  useEffect(() => {
    if (isPy) return;
    if (webDebounce.current) clearTimeout(webDebounce.current);
    webDebounce.current = setTimeout(async () => {
      const cr = await loadCodeRunner();
      if (iframeRef.current) cr.renderWebPreview(iframeRef.current, code);
    }, 1000);
    return () => {
      if (webDebounce.current) clearTimeout(webDebounce.current);
    };
  }, [code, isPy]);

  const draftSave = (v: string) => {
    setCode(v);
    try {
      localStorage.setItem(`lp.draft.${a.id}`, v);
    } catch { /* 무시 */ }
  };

  const onTab = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const el = e.currentTarget;
    const indent = isPy ? '    ' : '  ';
    const s = el.selectionStart;
    const next = code.slice(0, s) + indent + code.slice(el.selectionEnd);
    draftSave(next);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = s + indent.length;
    });
  };

  const doRun = async () => {
    if (!isPy || running || !runnerHolder.runner) return;
    setRunning(true);
    try {
      const r = await runnerHolder.runner.run(code, tests, 10000);
      const rec: RunRecord = { code, ...r };
      lastRunByActivity[a.id] = rec;
      setRun(rec);
    } catch (e) {
      setRun({ code, stdout: '', error: (e as Error).message, results: [] });
    } finally {
      setRunning(false);
    }
  };

  // 제출 게이트: python은 "실행한 코드 === 현재 코드"일 때만
  const passed = run ? run.results.filter((t) => t.ok).length : 0;
  const total = tests.length;
  const canSubmit = isPy
    ? !!run && run.code === code && !busy
    : code.trim().length > 0 && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      const payload = isPy
        ? {
            lang: 'python',
            code: code.slice(0, 8000),
            passed,
            total,
            results: (run?.results || []).map((t) => ({
              call: t.call,
              expected: t.expected,
              got: String(t.got ?? '').slice(0, 120),
              ok: t.ok,
            })),
          }
        : { lang: 'web', code: code.slice(0, 8000) };
      const r = await onSubmit(a, payload);
      setNote(
        isPy && total > 0
          ? `제출 완료 (${passed}/${total} 통과)${r?.updated ? ' — 갱신됨' : ''}`
          : `제출 완료${r?.updated ? ' — 갱신됨' : ''}`
      );
    } catch { /* subErr에 표시 */ } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mat lv-card" style={{ maxWidth: 980 }}>
      <span className="lv-kind">코드 실습 · {isPy ? 'Python' : 'Web'}</span>
      <h2 className="lv-prompt">{a.prompt}</h2>

      {isPy ? (
        <>
          <textarea
            className="lv-code-editor" value={code} spellCheck={false}
            onChange={(e) => draftSave(e.target.value)} onKeyDown={onTab}
          />
          <div className="lv-row" style={{ justifyContent: 'flex-start', alignItems: 'center' }}>
            <button className="lv-btn" onClick={doRun} disabled={running}>
              {running ? '실행 중…' : total > 0 ? '▶ 실행 + 채점' : '▶ 실행'}
            </button>
            <span className="lv-engine">{engine}</span>
          </div>
          {run && (run.stdout || run.error) && (
            <pre className={`lv-code-out${run.error ? ' err' : ''}`}>
              {run.error || run.stdout}
            </pre>
          )}
          {run && run.results.length > 0 && (
            <div className="lv-tests">
              {run.results.map((t, i) => (
                <div key={i} className={`lv-test ${t.ok ? 'ok' : 'no'}`}>
                  <span className="b">{t.ok ? '통과' : '실패'}</span>
                  <span>
                    {t.call} → {t.got}
                    {!t.ok && ` (기대값: ${t.expected})`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="lv-web-wrap">
          <textarea
            className="lv-code-editor" value={code} spellCheck={false}
            onChange={(e) => draftSave(e.target.value)} onKeyDown={onTab}
          />
          <iframe ref={iframeRef} title="미리보기" sandbox="allow-scripts" />
        </div>
      )}

      <button className="lv-btn lv-btn--block" disabled={!canSubmit} onClick={submit}>
        {busy ? '제출 중…' : answered || note ? '다시 제출하기' : '제출하기'}
      </button>
      <div className={`lv-error${subErr ? ' show' : ''}`}>{subErr}</div>
      <p className="lv-hint">
        {note ||
          (answered
            ? '제출됨 — 고쳐서 다시 제출할 수 있어요'
            : isPy
              ? '실행해서 결과를 확인한 뒤 제출할 수 있어요.'
              : '오른쪽 미리보기를 확인하고 제출하세요.')}
      </p>
    </div>
  );
}

/* ── 공개 화면 ── */
function RevealedView({ a, agg }: { a: LiveActivity; agg: Record<string, any> }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const round = a.round || 1;
  const mine = myAnswer(a.id, round);
  const answeredIt = !!mine;

  useEffect(() => {
    let alive = true;
    (async () => {
      const charts = await loadCharts();
      if (alive && chartRef.current)
        charts.renderAggregates(
          chartRef.current,
          { kind: a.kind, config: a.config || {} },
          agg || {},
          { theme: 'dark' }
        );
    })();
    return () => {
      alive = false;
    };
  }, [a, agg]);

  let verdict: { cls: string; msg: string } | null = null;
  if ('answer' in (agg || {}) && mine) {
    const correct =
      a.kind === 'choice'
        ? Number(agg.answer) === mine.choice
        : a.kind === 'ox'
          ? (agg.answer === true || agg.answer === 'true') === mine.ox
          : false;
    if (a.kind === 'choice' || a.kind === 'ox')
      verdict = correct
        ? { cls: 'ok', msg: '정답이에요! 🎉' }
        : { cls: 'no', msg: '아쉬워요, 다음 문제로 만회해요!' };
  } else if (!answeredIt && a.kind !== 'code') {
    verdict = { cls: 'na', msg: '이 문항에는 응답하지 않았어요.' };
  }
  const myCodeRun = a.kind === 'code' ? lastRunByActivity[a.id] : null;

  return (
    <div className="mat lv-card" style={{ maxWidth: 980 }}>
      <span className="lv-kind">결과 공개</span>
      <h2 className="lv-prompt">{a.prompt}</h2>
      {verdict && <div className={`lv-verdict lv-verdict--${verdict.cls}`}>{verdict.msg}</div>}
      {myCodeRun && myCodeRun.results.length > 0 && (
        <div className="lv-verdict lv-verdict--ok">
          내 결과: {myCodeRun.results.filter((t) => t.ok).length}/{myCodeRun.results.length} 통과
        </div>
      )}
      <div ref={chartRef} />
    </div>
  );
}
