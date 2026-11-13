// live/runtime/charts.js — 의존성 없는 집계 차트 렌더러
// 지원: choice/ox 단일 집계, Peer Instruction 1·2차 비교(pi), 워드클라우드, 출구티켓, 텍스트 나열
// 학생 답변 텍스트는 신뢰할 수 없는 입력이므로 반드시 escape하여 렌더한다.

const STYLE_ID = 'lp-charts-style';

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const st = document.createElement('style');
  st.id = STYLE_ID;
  st.textContent = `
  .lp-chart { font-family: 'Noto Sans KR', 'Pretendard', sans-serif; width: 100%; }
  .lp-chart * { box-sizing: border-box; }
  .lp-chart--dark { --lp-fg: #f1f5f9; --lp-sub: #94a3b8; --lp-track: rgba(148,163,184,.18);
                    --lp-bar: #60a5fa; --lp-ok: #34d399; --lp-mut: #7c8aa0;
                    --lp-chip: rgba(148,163,184,.14); }
  .lp-chart--light { --lp-fg: #1e293b; --lp-sub: #64748b; --lp-track: #e2e8f0;
                     --lp-bar: #3b82f6; --lp-ok: #10b981; --lp-mut: #94a3b8;
                     --lp-chip: #f1f5f9; }
  .lp-chart__total { color: var(--lp-sub); font-size: .85em; margin-bottom: .8em; }
  .lp-bar-row { display: grid; grid-template-columns: minmax(0,1fr) auto; align-items: center;
                gap: .6em; margin: .55em 0; color: var(--lp-fg); }
  .lp-bar-row__label { font-size: .95em; overflow-wrap: anywhere; }
  .lp-bar-row__label .lp-num { display: inline-block; min-width: 1.5em; color: var(--lp-sub); font-weight: 700; }
  .lp-bar-row__track { grid-column: 1 / -1; height: 14px; background: var(--lp-track);
                       border-radius: 7px; overflow: hidden; }
  .lp-bar-row__fill { height: 100%; width: 0; background: var(--lp-bar); border-radius: 7px;
                      transition: width .6s cubic-bezier(.22,1,.36,1); }
  .lp-bar-row--answer .lp-bar-row__fill { background: var(--lp-ok); }
  .lp-bar-row--answer .lp-bar-row__label { font-weight: 700; }
  .lp-bar-row__count { color: var(--lp-sub); font-variant-numeric: tabular-nums; font-size: .9em; white-space: nowrap; }
  .lp-badge-answer { display: inline-block; margin-left: .45em; padding: .1em .5em; border-radius: 999px;
                     background: var(--lp-ok); color: #fff; font-size: .7em; font-weight: 700; vertical-align: middle; }
  .lp-ox { display: flex; gap: 1em; }
  .lp-ox__card { flex: 1; border-radius: 14px; padding: 1em; text-align: center;
                 background: var(--lp-chip); color: var(--lp-fg); position: relative; }
  .lp-ox__card--answer { outline: 3px solid var(--lp-ok); }
  .lp-ox__mark { font-size: 2.2em; font-weight: 800; line-height: 1.1; }
  .lp-ox__mark--o { color: #34d399; } .lp-ox__mark--x { color: #f87171; }
  .lp-ox__count { font-size: 1.3em; font-weight: 700; margin-top: .2em; }
  .lp-ox__pct { color: var(--lp-sub); font-size: .85em; }
  .lp-texts { display: flex; flex-wrap: wrap; gap: .5em; max-height: 46vh; overflow-y: auto; }
  .lp-texts__chip { background: var(--lp-chip); color: var(--lp-fg); padding: .45em .8em;
                    border-radius: 10px; font-size: .92em; max-width: 100%; overflow-wrap: anywhere; }
  .lp-empty { color: var(--lp-sub); text-align: center; padding: 1.2em 0; }
  /* ── Peer Instruction 1·2차 비교 ── */
  .lp-pi-legend { display: flex; gap: 1.2em; color: var(--lp-sub); font-size: .82em; margin-bottom: .9em; }
  .lp-pi-legend i { display: inline-block; width: .9em; height: .9em; border-radius: 3px;
                    margin-right: .35em; vertical-align: -0.12em; font-style: normal; }
  .lp-pi-row { margin: .8em 0; color: var(--lp-fg); }
  .lp-pi-row__label { font-size: .95em; margin-bottom: .35em; overflow-wrap: anywhere; }
  .lp-pi-row__label .lp-num { display: inline-block; min-width: 1.5em; color: var(--lp-sub); font-weight: 700; }
  .lp-pi-row--answer .lp-pi-row__label { font-weight: 700; }
  .lp-pi-bar { display: grid; grid-template-columns: 2.2em minmax(0,1fr) auto; align-items: center;
               gap: .55em; margin: .22em 0; }
  .lp-pi-bar__tag { color: var(--lp-sub); font-size: .74em; font-weight: 700; text-align: right; }
  .lp-pi-bar__track { height: 11px; background: var(--lp-track); border-radius: 6px; overflow: hidden; }
  .lp-pi-bar__fill { height: 100%; width: 0; border-radius: 6px; background: var(--lp-mut);
                     transition: width .6s cubic-bezier(.22,1,.36,1); }
  .lp-pi-bar--r2 .lp-pi-bar__fill { background: var(--lp-bar); }
  .lp-pi-row--answer .lp-pi-bar--r2 .lp-pi-bar__fill { background: var(--lp-ok); }
  .lp-pi-bar__count { color: var(--lp-sub); font-size: .82em; font-variant-numeric: tabular-nums; white-space: nowrap; }
  /* ── 워드클라우드 ── */
  .lp-cloud { display: flex; flex-wrap: wrap; gap: .35em 1em; align-items: baseline;
              justify-content: center; padding: .6em 0; max-height: 52vh; overflow-y: auto; }
  .lp-cloud span { line-height: 1.25; font-weight: 700; overflow-wrap: anywhere; }
  /* ── 출구티켓 ── */
  .lp-exit-avg { display: flex; align-items: baseline; gap: .5em; color: var(--lp-fg); margin-bottom: .7em; }
  .lp-exit-avg b { font-size: 1.9em; }
  .lp-exit-avg span { color: var(--lp-sub); font-size: .85em; }
  .lp-exit-texts-title { color: var(--lp-sub); font-size: .82em; font-weight: 700; margin: 1em 0 .5em; }
  /* ── 리더보드 (gamify 탑5) ── */
  .lp-lb { margin-top: 1.1em; }
  .lp-lb__title { color: var(--lp-sub); font-size: .85em; font-weight: 700; margin-bottom: .55em; }
  .lp-lb__row { display: flex; align-items: center; gap: .7em; padding: .5em .8em;
                border-radius: 10px; background: var(--lp-chip); color: var(--lp-fg); margin: .3em 0; }
  .lp-lb__row--top { outline: 2px solid #f59e0b; }
  .lp-lb__rank { flex: none; width: 1.7em; text-align: center; font-weight: 800; }
  .lp-lb__name { min-width: 0; overflow-wrap: anywhere; font-weight: 700; }
  .lp-lb__score { margin-left: auto; color: var(--lp-sub); font-variant-numeric: tabular-nums;
                  font-weight: 700; white-space: nowrap; }
  `;
  document.head.appendChild(st);
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function pct(n, total) {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

const CLOUD_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#0ea5e9', '#f43f5e'];

// choice/ox의 counts를 [숫자] 배열로 정규화 (PI 비교 공용 경로)
function normalizedCounts(kind, config, agg) {
  if (kind === 'ox') {
    const c = (agg && agg.counts) || {};
    return { labels: ['O', 'X'], counts: [c.O || 0, c.X || 0] };
  }
  const options = (config && config.options) || [];
  return { labels: options, counts: (agg && agg.counts) || options.map(() => 0) };
}

function answerIndexOf(kind, agg) {
  if (!agg || agg.answer === undefined || agg.answer === null) return -1;
  if (kind === 'ox') return (agg.answer === true || agg.answer === 'true') ? 0 : 1;
  return Number(agg.answer);
}

// ── Peer Instruction: 보기별 1차/2차 이중 막대 ──
function renderPi(activity, agg) {
  const [r1, r2] = agg.rounds || [{}, {}];
  const kind = agg.kind || activity.kind;
  const n1 = normalizedCounts(kind, activity.config, r1);
  const n2 = normalizedCounts(kind, activity.config, r2);
  const ansIdx = answerIndexOf(kind, agg);
  const max = Math.max(1, ...n1.counts, ...n2.counts);
  const t1 = r1.total || 0, t2 = r2.total || 0;

  let html = `
    <div class="lp-chart__total">1차 ${t1}명 → 2차 ${t2}명 (토론 후 재투표)</div>
    <div class="lp-pi-legend">
      <span><i style="background:var(--lp-mut)"></i>1차 투표</span>
      <span><i style="background:var(--lp-bar)"></i>2차 투표</span>
      ${ansIdx >= 0 ? '<span><i style="background:var(--lp-ok)"></i>정답(2차)</span>' : ''}
    </div>`;

  html += n1.labels.map((label, i) => {
    const isAnswer = i === ansIdx;
    const numLabel = kind === 'ox' ? label : `${i + 1}`;
    const text = kind === 'ox' ? (label === 'O' ? 'O (맞다)' : 'X (아니다)') : esc(label);
    return `
    <div class="lp-pi-row${isAnswer ? ' lp-pi-row--answer' : ''}">
      <div class="lp-pi-row__label"><span class="lp-num">${esc(numLabel)}</span>${text}${isAnswer ? '<span class="lp-badge-answer">정답</span>' : ''}</div>
      <div class="lp-pi-bar lp-pi-bar--r1">
        <span class="lp-pi-bar__tag">1차</span>
        <div class="lp-pi-bar__track"><div class="lp-pi-bar__fill" data-w="${(n1.counts[i] / max) * 100}"></div></div>
        <span class="lp-pi-bar__count">${n1.counts[i]}명 · ${pct(n1.counts[i], t1)}%</span>
      </div>
      <div class="lp-pi-bar lp-pi-bar--r2">
        <span class="lp-pi-bar__tag">2차</span>
        <div class="lp-pi-bar__track"><div class="lp-pi-bar__fill" data-w="${(n2.counts[i] / max) * 100}"></div></div>
        <span class="lp-pi-bar__count">${n2.counts[i]}명 · ${pct(n2.counts[i], t2)}%</span>
      </div>
    </div>`;
  }).join('');
  return html;
}

// ── 워드클라우드: 빈도 기반 크기 ──
function renderCloud(agg) {
  const freq = new Map();
  (agg.texts || []).forEach((t) => {
    const key = String(t).trim().replace(/\s+/g, ' ');
    if (!key) return;
    freq.set(key, (freq.get(key) || 0) + 1);
  });
  if (!freq.size) return '<div class="lp-empty">아직 응답이 없습니다</div>';
  const entries = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 60);
  const max = entries[0][1];
  const html = entries.map(([word, count], i) => {
    const scale = max > 1 ? (count - 1) / (max - 1) : 0;   // 0~1
    const size = (0.95 + scale * 1.8).toFixed(2);           // 0.95em ~ 2.75em
    const color = CLOUD_COLORS[i % CLOUD_COLORS.length];
    return `<span style="font-size:${size}em;color:${color}" title="${count}회">${esc(word)}</span>`;
  }).join('');
  return `<div class="lp-chart__total">응답 ${agg.total || 0}명 · 단어 ${freq.size}개</div>
          <div class="lp-cloud">${html}</div>`;
}

// ── 출구티켓: 이해도 1~5 분포 + 평균 + 한마디 ──
function renderExit(agg) {
  const ratings = agg.ratings || [0, 0, 0, 0, 0];
  const total = agg.total || 0;
  const max = Math.max(1, ...ratings);
  const labels = ['1 · 전혀 모르겠어요', '2 · 조금 어려웠어요', '3 · 보통이에요', '4 · 잘 이해했어요', '5 · 완벽해요!'];
  let html = `<div class="lp-chart__total">응답 ${total}명</div>`;
  if (agg.avg !== null && agg.avg !== undefined) {
    html += `<div class="lp-exit-avg"><b>${Number(agg.avg).toFixed(1)}</b><span>/ 5 평균 이해도</span></div>`;
  }
  html += labels.map((label, i) => `
    <div class="lp-bar-row">
      <div class="lp-bar-row__label">${label}</div>
      <div class="lp-bar-row__count">${ratings[i] || 0}명</div>
      <div class="lp-bar-row__track"><div class="lp-bar-row__fill" data-w="${((ratings[i] || 0) / max) * 100}"></div></div>
    </div>`).join('');
  const texts = (agg.texts || []);
  if (texts.length) {
    html += `<div class="lp-exit-texts-title">학생 한마디 (${texts.length})</div>
             <div class="lp-texts">${texts.map((t) => `<div class="lp-texts__chip">${esc(t)}</div>`).join('')}</div>`;
  }
  return html;
}

// ── 리더보드: gamify 문항 공개 시 세션 누적 탑5 (agg.leaderboard) ──
function renderLeaderboard(rows) {
  const medals = ['🥇', '🥈', '🥉'];
  return `<div class="lp-lb">
    <div class="lp-lb__title">🏆 현재까지 탑5 — 빠르고 정확한 순</div>
    ${rows.map((r, i) => `
    <div class="lp-lb__row${i === 0 ? ' lp-lb__row--top' : ''}">
      <span class="lp-lb__rank">${medals[i] || (i + 1)}</span>
      <span class="lp-lb__name">${esc((r.studentNo ? r.studentNo + ' ' : '') + (r.nickname || '익명'))}</span>
      <span class="lp-lb__score">${Number(r.score || 0).toLocaleString()}점</span>
    </div>`).join('')}
  </div>`;
}

// container에 집계를 렌더. activity = {kind, config}, agg = 집계 payload
export function renderAggregates(container, activity, agg, opts = {}) {
  ensureStyle();
  const theme = opts.theme === 'light' ? 'light' : 'dark';
  const total = (agg && agg.total) || 0;
  const kind = (agg && agg.kind) || activity.kind;
  let inner;

  if (agg && agg.pi) {
    inner = renderPi(activity, agg);
  } else if (kind === 'wordcloud') {
    inner = renderCloud(agg || {});
  } else if (kind === 'exit') {
    inner = renderExit(agg || {});
  } else if (kind === 'choice') {
    const options = (activity.config && activity.config.options) || [];
    const counts = (agg && agg.counts) || options.map(() => 0);
    const max = Math.max(1, ...counts);
    inner = `<div class="lp-chart__total">응답 ${total}명</div>` + options.map((opt, i) => {
      const isAnswer = agg && agg.answer !== undefined && agg.answer !== null && Number(agg.answer) === i;
      return `
      <div class="lp-bar-row${isAnswer ? ' lp-bar-row--answer' : ''}">
        <div class="lp-bar-row__label"><span class="lp-num">${i + 1}</span>${esc(opt)}${isAnswer ? '<span class="lp-badge-answer">정답</span>' : ''}</div>
        <div class="lp-bar-row__count">${counts[i] || 0}명 · ${pct(counts[i] || 0, total)}%</div>
        <div class="lp-bar-row__track"><div class="lp-bar-row__fill" data-w="${((counts[i] || 0) / max) * 100}"></div></div>
      </div>`;
    }).join('');
  } else if (kind === 'ox') {
    const counts = (agg && agg.counts) || { O: 0, X: 0 };
    const hasAnswer = agg && agg.answer !== undefined && agg.answer !== null;
    const ansO = hasAnswer && (agg.answer === true || agg.answer === 'true');
    inner = `<div class="lp-chart__total">응답 ${total}명</div>
    <div class="lp-ox">
      <div class="lp-ox__card${hasAnswer && ansO ? ' lp-ox__card--answer' : ''}">
        <div class="lp-ox__mark lp-ox__mark--o">O</div>
        <div class="lp-ox__count">${counts.O || 0}명</div>
        <div class="lp-ox__pct">${pct(counts.O || 0, total)}%${hasAnswer && ansO ? ' · 정답' : ''}</div>
      </div>
      <div class="lp-ox__card${hasAnswer && !ansO ? ' lp-ox__card--answer' : ''}">
        <div class="lp-ox__mark lp-ox__mark--x">X</div>
        <div class="lp-ox__count">${counts.X || 0}명</div>
        <div class="lp-ox__pct">${pct(counts.X || 0, total)}%${hasAnswer && !ansO ? ' · 정답' : ''}</div>
      </div>
    </div>`;
  } else if (kind === 'code') {
    const hist = (agg && agg.histogram) || [];
    const rates = (agg && agg.caseRates) || [];
    const testCount = (agg && agg.testCount) || 0;
    inner = `<div class="lp-chart__total">제출 ${total}명${testCount ? ` · 테스트 ${testCount}개` : ''}</div>`;
    if (testCount > 0) {
      const max = Math.max(1, ...hist);
      inner += hist.map((c, i) => `
        <div class="lp-bar-row${i === testCount ? ' lp-bar-row--answer' : ''}">
          <div class="lp-bar-row__label">${i === testCount ? '전부 통과' : `${i}개 통과`}</div>
          <div class="lp-bar-row__count">${c || 0}명 · ${pct(c || 0, total)}%</div>
          <div class="lp-bar-row__track"><div class="lp-bar-row__fill" data-w="${((c || 0) / max) * 100}"></div></div>
        </div>`).join('');
      if (rates.length) {
        inner += `<div class="lp-exit-texts-title">테스트케이스별 통과율 — 어디서 막히는지 보인다</div>`
          + rates.map((r, i) => `
          <div class="lp-bar-row">
            <div class="lp-bar-row__label">케이스 ${i + 1}</div>
            <div class="lp-bar-row__count">${r ?? 0}%</div>
            <div class="lp-bar-row__track"><div class="lp-bar-row__fill" data-w="${r ?? 0}"></div></div>
          </div>`).join('');
      }
    } else if (!total) {
      inner += '<div class="lp-empty">아직 제출이 없습니다</div>';
    }
  } else {
    // short → 텍스트 나열
    const texts = (agg && agg.texts) || [];
    inner = `<div class="lp-chart__total">응답 ${total}명</div>` + (texts.length
      ? `<div class="lp-texts">${texts.map((t) => `<div class="lp-texts__chip">${esc(t)}</div>`).join('')}</div>`
      : '<div class="lp-empty">아직 응답이 없습니다</div>');
  }

  if (agg && Array.isArray(agg.leaderboard) && agg.leaderboard.length) {
    inner += renderLeaderboard(agg.leaderboard);
  }

  container.innerHTML = `<div class="lp-chart lp-chart--${theme}">${inner}</div>`;
  requestAnimationFrame(() => {
    container.querySelectorAll('.lp-bar-row__fill, .lp-pi-bar__fill').forEach((el) => {
      el.style.width = el.dataset.w + '%';
    });
  });
}
