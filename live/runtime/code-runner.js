// live/runtime/code-runner.js — 학생 코드 실행 엔진
//
// Python: Pyodide(WASM)를 Web Worker 안에서 구동
//   - 메인 스레드 비차단, 무한 루프는 타임아웃 시 워커 terminate 후 재생성
//   - 테스트케이스: config.tests = [{call: "sum_to(5)", expected: "15"}] —
//     학생 코드를 실행한 뒤 str(call) 결과 문자열을 expected와 비교
// Web(HTML/CSS/JS): iframe srcdoc 샌드박스 (sandbox="allow-scripts" — same-origin 없음)
//
// Pyodide는 ~10MB CDN 로드 (최초 1회, 이후 브라우저 캐시). 수업 시작 전 미리
// 참여 페이지를 열어두게 하면 로드가 끝나 있다.

const PYODIDE_BASE = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';

// 워커 본체 — 문자열 주입 없이 함수 직렬화 (URL은 init 메시지로 전달)
function workerMain() {
  let pyodide = null;
  self.onmessage = async (e) => {
    const msg = e.data;
    try {
      if (msg.type === 'init') {
        importScripts(msg.pyodideUrl);
        pyodide = await self.loadPyodide({ indexURL: msg.indexUrl });
        self.postMessage({ type: 'ready' });
        return;
      }
      if (msg.type === 'run') {
        const stdout = [];
        pyodide.setStdout({ batched: (s) => stdout.push(s) });
        pyodide.setStderr({ batched: (s) => stdout.push(s) });
        let error = null;
        try {
          await pyodide.runPythonAsync(msg.code);
        } catch (err) {
          error = String((err && err.message) || err).slice(0, 1500);
        }
        const results = [];
        if (!error && Array.isArray(msg.tests)) {
          for (const t of msg.tests) {
            try {
              const got = String(pyodide.runPython('str(' + t.call + ')'));
              results.push({
                call: t.call, expected: t.expected,
                got: got.slice(0, 200),
                ok: got.trim() === String(t.expected).trim(),
              });
            } catch (err) {
              results.push({
                call: t.call, expected: t.expected,
                got: '오류: ' + String((err && err.message) || err).slice(0, 150),
                ok: false,
              });
            }
          }
        }
        self.postMessage({
          type: 'result', runId: msg.runId,
          stdout: stdout.join('\n').slice(0, 4000), error, results,
        });
      }
    } catch (err) {
      self.postMessage({ type: 'fatal', error: String((err && err.message) || err) });
    }
  };
}

export function createPythonRunner({ onStatus } = {}) {
  let worker = null;
  let readyPromise = null;
  let seq = 0;
  let pending = null;
  const status = (s) => { try { onStatus && onStatus(s); } catch (e) { /* 무시 */ } };

  function boot() {
    if (readyPromise) return readyPromise;
    status('loading');
    const src = `(${workerMain.toString()})()`;
    const blobUrl = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
    worker = new Worker(blobUrl);
    readyPromise = new Promise((resolve, reject) => {
      const bootTimer = setTimeout(() => {
        reject(new Error('파이썬 엔진 로드 시간 초과 — 네트워크를 확인해주세요'));
      }, 90000);
      worker.onmessage = (e) => {
        const msg = e.data;
        if (msg.type === 'ready') {
          clearTimeout(bootTimer);
          status('ready');
          resolve();
        } else if (msg.type === 'result') {
          if (pending && pending.runId === msg.runId) {
            clearTimeout(pending.timer);
            const p = pending; pending = null;
            p.resolve({ stdout: msg.stdout, error: msg.error, results: msg.results });
          }
        } else if (msg.type === 'fatal') {
          clearTimeout(bootTimer);
          status('error');
          const err = new Error(msg.error || '파이썬 엔진 오류');
          if (pending) { clearTimeout(pending.timer); pending.reject(err); pending = null; }
          reject(err);
        }
      };
      worker.onerror = (e) => {
        clearTimeout(bootTimer);
        status('error');
        reject(new Error('워커 오류: ' + (e.message || '알 수 없음')));
      };
    });
    worker.postMessage({ type: 'init', pyodideUrl: PYODIDE_BASE + 'pyodide.js', indexUrl: PYODIDE_BASE });
    return readyPromise;
  }

  function destroy() {
    if (worker) { try { worker.terminate(); } catch (e) { /* 무시 */ } }
    worker = null; readyPromise = null;
    if (pending) { clearTimeout(pending.timer); pending = null; }
  }

  return {
    // 미리 로드 (문항 표시 시점에 호출해두면 첫 실행이 빠름)
    preload() { boot().catch(() => { /* run에서 다시 시도 */ }); },

    async run(code, tests, timeoutMs = 10000) {
      if (!readyPromise) boot();
      try { await readyPromise; } catch (e) { destroy(); throw e; }
      if (pending) throw new Error('이미 실행 중입니다');
      status('running');
      return new Promise((resolve, reject) => {
        const runId = ++seq;
        const timer = setTimeout(() => {
          // 무한 루프 등: 워커 폐기 (다음 실행 시 엔진 재로드 — 캐시라 수 초)
          destroy();
          status('ready-after-reset');
          reject(new Error(`시간 초과 (${Math.round(timeoutMs / 1000)}초) — 무한 루프가 아닌지 확인하세요`));
        }, timeoutMs);
        pending = {
          runId, timer,
          resolve: (v) => { status('ready'); resolve(v); },
          reject: (e) => { status('ready'); reject(e); },
        };
        worker.postMessage({ type: 'run', runId, code, tests: tests || [] });
      });
    },

    destroy,
  };
}

// ── Web(HTML/CSS/JS) 미리보기 — 루트 script.js의 srcdoc 패턴 계승 ──
// iframe에는 반드시 sandbox="allow-scripts" (allow-same-origin 금지 — localStorage 접근 차단)
export function renderWebPreview(iframe, code) {
  iframe.srcdoc = String(code || '').slice(0, 20000);
}
