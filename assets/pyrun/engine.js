// assets/pyrun/engine.js — <py-runner>가 쓰는 파이썬 실행 엔진 (페이지당 워커 하나)
//
// live/runtime/code-runner.js와 같은 방식(Pyodide를 Web Worker 안에서 구동)이지만
// 교육용 실행기에 필요한 것을 더 돌려준다. 라이브 code 문항을 깨지 않으려고 파일을 나눴다.
//   - 출력, 오류(종류·메시지·줄 번호), 실행이 끝난 뒤의 사용자 변수
//   - trace: true 이면 줄마다 상태(현재 줄·전역 변수·함수 칸·그때까지의 출력)를 기록한다
//   - info: 코드 구조 요약(print 호출 수, f-문자열 print 수, def와 매개변수 수 등) — 자동 점검용
// 무한 루프는 시간 제한 뒤 워커를 끊고 다음 실행 때 다시 띄운다.

const PYODIDE_BASE = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';

const HARNESS = String.raw`
import sys, io, ast, json, contextlib, traceback

class __PyrunNeedInput(BaseException):
    """input()이 받을 값이 대기열에 없을 때 실행을 멈추는 신호. 학생 코드의 except Exception이 잡지 못하게 BaseException을 바로 상속한다."""
    def __init__(self, prompt):
        self.prompt = prompt

OUT_CAP = 20000

class __PyrunOut:
    """출력을 조각(o 프로그램 출력 · p 안내 문구 · e 입력 메아리)으로 모은다. 상한은 쓰는 순간에 건다."""
    def __init__(self):
        self.segs = []
        self.n = 0
        self.cut = False
    def add(self, kind, s):
        s = str(s)
        if not s: return
        room = OUT_CAP - self.n
        if room <= 0:
            self.cut = True
            return
        if len(s) > room:
            s = s[:room]
            self.cut = True
        self.n += len(s)
        if self.segs and self.segs[-1][0] == kind: self.segs[-1][1] += s
        else: self.segs.append([kind, s])
    def write(self, s):
        self.add('o', s)
        return len(s)
    def flush(self): pass
    def getvalue(self): return ''.join(x[1] for x in self.segs)
    def prog(self): return ''.join(x[1] for x in self.segs if x[0] == 'o')

def __pyrun_val(v):
    if isinstance(v, bool): return {'t': 'bool', 'r': repr(v)}
    if isinstance(v, (int, float)): return {'t': 'num', 'r': repr(v), 'n': 'int' if isinstance(v, int) else 'float'}
    if isinstance(v, str): return {'t': 'str', 'r': v[:200]}
    if v is None: return {'t': 'none', 'r': 'None'}
    if callable(v): return {'t': 'func', 'r': getattr(v, '__name__', '?')}
    if isinstance(v, (list, tuple, dict, set)): return {'t': 'coll', 'r': repr(v)[:200]}
    return {'t': 'other', 'r': repr(v)[:200]}

def __pyrun_vars(d):
    out = []
    for k, v in list(d.items()):
        if k.startswith('__'): continue
        if type(v).__name__ == 'module': continue
        out.append([k, __pyrun_val(v)])
    return out

__OPS = {ast.Add: '+', ast.Sub: '-', ast.Mult: '*', ast.Div: '/', ast.FloorDiv: '//', ast.Mod: '%', ast.Pow: '**'}

def __pyrun_info(src):
    info = {'prints': 0, 'fprints': 0, 'commaprints': 0, 'nameprints': 0, 'defs': [], 'calls': {}, 'assigns': 0,
            'ops': {}, 'fstrings': 0, 'assign_from': []}
    try:
        tree = ast.parse(src)
    except Exception:
        return info
    for node in ast.walk(tree):
        if isinstance(node, ast.BinOp) and type(node.op) in __OPS:
            k = __OPS[type(node.op)]
            info['ops'][k] = info['ops'].get(k, 0) + 1
        elif isinstance(node, ast.JoinedStr) and any(isinstance(v, ast.FormattedValue) for v in node.values):
            info['fstrings'] += 1
        if isinstance(node, ast.Assign) and len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
            calls = [c.func.id for c in ast.walk(node.value) if isinstance(c, ast.Call) and isinstance(c.func, ast.Name)]
            names = [n.id for n in ast.walk(node.value) if isinstance(n, ast.Name)]
            info['assign_from'].append({'target': node.targets[0].id, 'calls': calls, 'names': names})
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
            name = node.func.id
            info['calls'][name] = info['calls'].get(name, 0) + 1
            if name == 'print':
                info['prints'] += 1
                if any(isinstance(a, ast.JoinedStr) and any(isinstance(v, ast.FormattedValue) for v in a.values) for a in node.args): info['fprints'] += 1
                if len(node.args) == 1 and isinstance(node.args[0], ast.Name): info['nameprints'] += 1
                if len(node.args) >= 2: info['commaprints'] += 1
        elif isinstance(node, ast.FunctionDef):
            info['defs'].append({'name': node.name, 'params': len(node.args.args)})
        elif isinstance(node, ast.Assign):
            info['assigns'] += 1
    return info

def __pyrun_exec(src, trace_on, max_steps, inputs_json='[]', interactive=False):
    out = __PyrunOut()
    inputs = [str(x) for x in json.loads(inputs_json or '[]')]
    pos = {'i': 0}
    g = {'__name__': '__main__'}
    steps = []
    state = {'truncated': False}

    def frames_of(frame):
        frames = []
        f = frame
        while f is not None and f.f_code.co_filename == '<code>' and f.f_code.co_name != '<module>':
            frames.append({'name': f.f_code.co_name, 'vars': __pyrun_vars(f.f_locals)})
            f = f.f_back
        frames.reverse()
        return frames

    def snap(frame, line):
        if len(steps) >= max_steps:
            state['truncated'] = True
            sys.settrace(None)
            return
        steps.append({'line': line, 'g': __pyrun_vars(g), 'frames': frames_of(frame), 'out': out.getvalue()})

    def local_tr(frame, event, arg):
        if frame.f_code.co_filename != '<code>': return None
        if event == 'line':
            snap(frame, frame.f_lineno)
        return local_tr

    def global_tr(frame, event, arg):
        if frame.f_code.co_filename != '<code>': return None
        return local_tr

    # 다시 실행 방식의 input(): 입력 기록을 처음부터 차례로 돌려주고, 기록이 떨어지면 멈춘다.
    # (실행을 그 자리에 세워 두는 것이 아니다. 화면이 값을 받으면 기록에 더해 처음부터 다시 실행한다.)
    def py_input(prompt=''):
        p = str(prompt)
        out.add('p', p)
        if pos['i'] < len(inputs):
            v = inputs[pos['i']]
            pos['i'] += 1
            out.add('e', v + '\n')
            return v
        raise __PyrunNeedInput(p)
    import builtins
    b = dict(builtins.__dict__)
    b['input'] = py_input
    g['__builtins__'] = b

    error = None
    status = 'completed'
    prompt = None
    try:
        code = compile(src, '<code>', 'exec')
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(out):
            if trace_on: sys.settrace(global_tr)
            try:
                exec(code, g)
            finally:
                sys.settrace(None)
    except __PyrunNeedInput as e:
        status = 'waiting_input' if interactive else 'input_short'
        prompt = e.prompt
    except SyntaxError as e:
        error = {'type': type(e).__name__, 'msg': str(e.msg), 'line': e.lineno, 'offset': e.offset}
    except BaseException as e:
        line = None
        for fr in traceback.extract_tb(e.__traceback__):
            if fr.filename == '<code>': line = fr.lineno
        error = {'type': type(e).__name__, 'msg': str(e), 'line': line}
    if error: status = 'error'
    if trace_on and not state['truncated'] and status != 'waiting_input':
        steps.append({'line': None, 'g': __pyrun_vars(g), 'frames': [], 'out': out.getvalue()})
    return json.dumps({
        'status': status,
        'prompt': prompt,
        'out': out.getvalue(),
        'prog': out.prog(),
        'segs': out.segs,
        'out_cut': out.cut,
        'inputs_given': len(inputs),
        'inputs_used': pos['i'],
        'error': error,
        'vars': __pyrun_vars(g),
        'steps': steps if trace_on else None,
        'truncated': state['truncated'],
        'info': __pyrun_info(src),
    }, ensure_ascii=False)
`;

function workerMain() {
  let pyodide = null;
  self.onmessage = async (e) => {
    const msg = e.data;
    try {
      if (msg.type === 'init') {
        importScripts(msg.pyodideUrl);
        pyodide = await self.loadPyodide({ indexURL: msg.indexUrl });
        pyodide.runPython(msg.harness);
        self.postMessage({ type: 'ready' });
        return;
      }
      if (msg.type === 'run') {
        pyodide.globals.set('__pyrun_src', msg.code);
        pyodide.globals.set('__pyrun_inputs', JSON.stringify(msg.inputs || []));
        const json = pyodide.runPython(
          `__pyrun_exec(__pyrun_src, ${msg.trace ? 'True' : 'False'}, ${Number(msg.maxSteps) || 400}, __pyrun_inputs, ${msg.interactive ? 'True' : 'False'})`,
        );
        self.postMessage({ type: 'result', runId: msg.runId, result: JSON.parse(json) });
      }
    } catch (err) {
      self.postMessage({ type: 'fatal', runId: msg && msg.runId, error: String((err && err.message) || err) });
    }
  };
}

let worker = null;
let readyPromise = null;
let seq = 0;
let chain = Promise.resolve();
let status = 'idle';
const listeners = new Set();

function setStatus(s) {
  status = s;
  for (const fn of listeners) { try { fn(s); } catch (e) { /* 무시 */ } }
}

export function onStatus(fn) {
  listeners.add(fn);
  fn(status);
  return () => listeners.delete(fn);
}

export function getStatus() { return status; }

function destroy() {
  if (worker) { try { worker.terminate(); } catch (e) { /* 무시 */ } }
  worker = null;
  readyPromise = null;
}

function boot() {
  if (readyPromise) return readyPromise;
  setStatus('loading');
  const src = `(${workerMain.toString()})()`;
  const blobUrl = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
  worker = new Worker(blobUrl);
  const w = worker;
  readyPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      setStatus('error');
      reject(new Error('파이썬 엔진을 불러오지 못했어요. 인터넷 연결을 확인해 주세요.'));
    }, 90000);
    w.addEventListener('message', (e) => {
      if (e.data.type === 'ready') { clearTimeout(timer); setStatus('ready'); resolve(w); }
      else if (e.data.type === 'fatal' && !e.data.runId) { clearTimeout(timer); setStatus('error'); reject(new Error(e.data.error)); }
    });
    w.addEventListener('error', (e) => {
      clearTimeout(timer);
      setStatus('error');
      reject(new Error('워커 오류: ' + (e.message || '알 수 없음')));
    });
  });
  readyPromise.catch(() => destroy());
  w.postMessage({ type: 'init', pyodideUrl: PYODIDE_BASE + 'pyodide.js', indexUrl: PYODIDE_BASE, harness: HARNESS });
  return readyPromise;
}

/** 엔진을 미리 불러 둔다 (실패해도 run에서 다시 시도한다). */
export function preload() { boot().catch(() => {}); }

/**
 * 코드를 실행한다. 여러 실행기가 동시에 불러도 차례로 처리한다.
 * inputs: input()이 차례로 돌려줄 문자열 배열(입력 기록). 매 실행은 처음부터 이 기록을 다시 읽는다.
 * interactive: true면 기록이 떨어졌을 때 status 'waiting_input'(화면이 입력을 받아 다시 실행),
 *              false면 'input_short'(시험 실행 — 입력 부족)로 끝난다.
 * 시간 제한은 실행 한 번의 계산 시간에만 걸린다. 사용자가 입력하는 동안은 실행 중이 아니다.
 * @returns {Promise<{status:'completed'|'waiting_input'|'input_short'|'error',prompt:string|null,out:string,prog:string,segs:Array,
 *   out_cut:boolean,inputs_given:number,inputs_used:number,error:null|{type:string,msg:string,line:number|null},vars:Array,steps:Array|null,truncated:boolean,info:object}>}
 */
export function run(code, { trace = false, maxSteps = 400, timeoutMs = 8000, inputs = [], interactive = false } = {}) {
  const job = chain.then(async () => {
    const w = await boot();
    setStatus('running');
    return new Promise((resolve, reject) => {
      const runId = ++seq;
      const onMsg = (e) => {
        if (e.data.runId !== runId) return;
        clearTimeout(timer);
        w.removeEventListener('message', onMsg);
        setStatus('ready');
        if (e.data.type === 'result') resolve(e.data.result);
        else reject(new Error(e.data.error));
      };
      const timer = setTimeout(() => {
        w.removeEventListener('message', onMsg);
        destroy();
        setStatus('idle');
        reject(new Error(`${Math.round(timeoutMs / 1000)}초 안에 끝나지 않아 멈췄어요. 끝나지 않는 반복이 있는지 확인해 주세요.`));
      }, timeoutMs);
      w.addEventListener('message', onMsg);
      w.postMessage({ type: 'run', runId, code: String(code), trace, maxSteps, inputs: (inputs || []).map(String), interactive: !!interactive });
    });
  });
  chain = job.catch(() => {});
  return job;
}
