/* 게임 클리어 기록 — 점등봇·심야 라면 공용
 *
 * 주소에 ?record=<수업 키>가 있을 때만 켜진다. 허브에서 그냥 열거나 덱 iframe으로 띄우면
 * 입력창도 전송도 없다. 수업 키는 그 과목의 Apps Script 배포를 가리킨다.
 *
 * 전송은 no-cors가 아니라 text/plain 단순 요청이다. 응답을 읽어야 "기록 완료"를 사실대로
 * 보여 줄 수 있고, 실패한 건은 큐에 남겨 다시 보낸다. 서버는 문제별 최고 기록만 남기므로
 * 같은 건을 두 번 보내도 결과가 달라지지 않는다.
 */
(function () {
  'use strict';
  var CLASSES = {
    'ai-basics': 'https://script.google.com/macros/s/YOUR_WEBAPP_ID/exec'
  };
  var script = document.currentScript;
  var game = script && script.getAttribute('data-game');
  var total = script ? Number(script.getAttribute('data-total')) : 0;
  var url = CLASSES[new URLSearchParams(location.search).get('record') || ''];
  if (!url || !game) { window.GameRecord = { enabled: false, report: function () {} }; return; }

  var STUDENT_KEY = 'gameRecord:student';
  var QUEUE_KEY = 'gameRecord:queue:' + game;
  var RETRY_MS = 20000;
  var SID = /^[1-3](0[1-9]|[1-9]\d)(0[1-9]|[1-9]\d)$/;

  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (e) { return fallback; }
  }
  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* 저장 공간 부족이면 이번 탭 안에서만 유지한다 */ }
  }

  var student = readJson(STUDENT_KEY, null);
  var queue = readJson(QUEUE_KEY, []);
  var sending = false, retryTimer = null, pill = null, nameEl = null, statusEl = null;

  var css = document.createElement('style');
  css.textContent =
    '#gr-pill{position:fixed;left:8px;bottom:4px;z-index:9000;display:flex;align-items:center;gap:8px;max-width:calc(100vw - 16px);padding:5px 12px;border-radius:999px;background:rgba(20,26,34,.9);color:#fff;font:600 12px/1.3 system-ui,"Malgun Gothic",sans-serif;white-space:nowrap}' +
    '#gr-pill button{all:unset;cursor:pointer;text-decoration:underline;opacity:.8}' +
    '#gr-status.ok{color:#8ee6b8}#gr-status.wait{color:#ffd479}' +
    '#gr-modal{position:fixed;inset:0;z-index:9100;display:flex;align-items:center;justify-content:center;background:rgba(10,14,20,.72);font-family:system-ui,"Malgun Gothic",sans-serif}' +
    '#gr-modal form{width:min(420px,calc(100vw - 32px));padding:26px;border-radius:16px;background:#fff;color:#1c2430;box-sizing:border-box}' +
    '#gr-modal h2{margin:0 0 8px;font-size:21px}#gr-modal p{margin:0 0 16px;font-size:14px;line-height:1.55;word-break:keep-all}' +
    '#gr-modal label{display:block;margin-bottom:12px;font-size:13px;font-weight:700}' +
    '#gr-modal input{display:block;width:100%;box-sizing:border-box;margin-top:5px;padding:10px 12px;border:1.5px solid #b8c0cc;border-radius:9px;font-size:16px;color:#1c2430;background:#fff}' +
    '#gr-hint{min-height:18px;margin:-6px 0 12px;font-size:12.5px;color:#4b5563}#gr-hint.bad{color:#b42318;font-weight:700}' +
    '#gr-modal button{width:100%;padding:12px;border:0;border-radius:10px;background:#176b5f;color:#fff;font-size:16px;font-weight:800;cursor:pointer}';
  document.head.appendChild(css);

  function describeSid(sid) {
    return sid.charAt(0) + '학년 ' + Number(sid.slice(1, 3)) + '반 ' + Number(sid.slice(3)) + '번';
  }

  function setStatus(text, cls) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.className = cls || '';
  }

  function renderPill() {
    if (!pill) {
      pill = document.createElement('div');
      pill.id = 'gr-pill';
      nameEl = document.createElement('span');
      statusEl = document.createElement('span');
      statusEl.id = 'gr-status';
      var change = document.createElement('button');
      change.type = 'button';
      change.textContent = '바꾸기';
      change.addEventListener('click', openModal);
      pill.append(nameEl, change, statusEl);
      document.body.appendChild(pill);
    }
    nameEl.textContent = student.studentId + ' ' + student.studentName;
    if (!statusEl.textContent) setStatus('통과하면 기록됩니다');
  }

  function openModal() {
    var modal = document.createElement('div');
    modal.id = 'gr-modal';
    var form = document.createElement('form');
    var h = document.createElement('h2');
    h.textContent = '이름과 학번을 입력하세요';
    var p = document.createElement('p');
    p.textContent = '문제를 통과할 때마다 결과가 선생님의 구글 시트에 기록됩니다. 이 게임은 별도의 활동지가 없고, 이 기록을 활동지 대신 확인합니다.';
    var nameLabel = document.createElement('label');
    nameLabel.textContent = '이름';
    var nameInput = document.createElement('input');
    nameInput.maxLength = 20;
    nameInput.autocomplete = 'name';
    nameLabel.appendChild(nameInput);
    var sidLabel = document.createElement('label');
    sidLabel.textContent = '학번 5자리 (2학년 3반 17번이면 20317)';
    var sidInput = document.createElement('input');
    sidInput.inputMode = 'numeric';
    sidInput.maxLength = 5;
    sidLabel.appendChild(sidInput);
    var hint = document.createElement('div');
    hint.id = 'gr-hint';
    var go = document.createElement('button');
    go.type = 'submit';
    go.textContent = '시작하기';
    form.append(h, p, nameLabel, sidLabel, hint, go);
    modal.appendChild(form);

    if (student) { nameInput.value = student.studentName; sidInput.value = student.studentId; }
    function showSid() {
      sidInput.value = sidInput.value.replace(/\D/g, '');
      var ok = SID.test(sidInput.value);
      hint.className = '';
      hint.textContent = ok ? describeSid(sidInput.value) : '';
    }
    showSid();
    sidInput.addEventListener('input', showSid);
    /* 게임 단축키가 입력 중인 글자를 가로채지 않게 한다 */
    ['keydown', 'keyup', 'keypress'].forEach(function (t) {
      modal.addEventListener(t, function (e) { e.stopPropagation(); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = nameInput.value.trim();
      if (!name) { hint.className = 'bad'; hint.textContent = '이름을 입력하세요.'; nameInput.focus(); return; }
      if (!SID.test(sidInput.value)) { hint.className = 'bad'; hint.textContent = '학번을 숫자 5자리로 입력하세요.'; sidInput.focus(); return; }
      student = { studentName: name, studentId: sidInput.value };
      writeJson(STUDENT_KEY, student);
      modal.remove();
      renderPill();
      flush();
    });
    document.body.appendChild(modal);
    nameInput.focus();
  }

  function scheduleRetry() {
    if (retryTimer) return;
    retryTimer = setTimeout(function () { retryTimer = null; flush(); }, RETRY_MS);
  }

  function flush() {
    if (sending || !queue.length) return;
    sending = true;
    var item = queue[0];
    setStatus(item.stage + '번 기록 중…', 'wait');
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(item)
    }).then(function (res) {
      return res.json();
    }).then(function (out) {
      if (out.status === 'error' || (out.status === 'ok' && typeof out.clears !== 'number')) throw new Error(out.message || '서버 오류');
      queue.shift();
      writeJson(QUEUE_KEY, queue);
      sending = false;
      if (out.status === 'ok') {
        setStatus(item.stage + '번 기록 완료 · ' + out.clears + '/' + total + '문제', 'ok');
      } else {
        setStatus(item.stage + '번은 기록하지 못했습니다. 선생님께 알려 주세요.', 'wait');
      }
      flush();
    }).catch(function () {
      sending = false;
      setStatus('전송 대기 중, 자동으로 다시 보냅니다', 'wait');
      scheduleRetry();
    });
  }

  function report(r) {
    if (!student) return;
    queue.push({
      source: 'game_clear',
      game: game,
      studentName: student.studentName,
      studentId: student.studentId,
      stage: r.stage,
      stageName: r.stageName,
      stars: r.stars,
      blocks: r.blocks,
      result: r.result,
      program: r.program
    });
    writeJson(QUEUE_KEY, queue);
    flush();
  }

  window.GameRecord = { enabled: true, report: report };
  window.addEventListener('online', flush);

  function start() {
    if (student) { renderPill(); flush(); } else { openModal(); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
