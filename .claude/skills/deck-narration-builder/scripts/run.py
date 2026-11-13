"""일괄 실행 — 장마다 H3 → 조립 → 매팅. 한 장이 실패해도 다음 장으로 넘어가고, 진행을 한 줄씩 찍는다
(=== slide N done … / H3_FAIL N / ASM_FAIL N / MATTE_FAIL 파일 / RUN_ALL_DONE — 모니터가 이 줄을 잡는다).

사용: python run.py <presenter_dir> [--cast id] [장…]      (장을 안 주면 전부)
  --tts        H3 전에 음성부터 만든다(tts.py). ComfyUI의 VRAM을 먼저 비운다
  --skip-h3    H3는 건너뛰고 조립·매팅만 다시 한다(자르는 규칙을 바꿨을 때 등 — ComfyUI 불필요)
환경변수 SEED·MAXCHAIN·MIN_IDX 등은 h3.py로 그대로 넘어간다.
ComfyUI(NARR_COMFY_URL)가 먼저 떠 있어야 한다. 몇 시간 걸리므로 별도 터미널에서 돌리는 것이 안전하다
(Claude Code 백그라운드 셸은 메모리가 부족하면 강제로 멈출 수 있다).
"""
import datetime, json, os, subprocess, sys
from narr import job_from_args
import comfy_run

job, rest = job_from_args(sys.argv[1:])
HERE = os.path.dirname(os.path.abspath(__file__))
PY = sys.executable
base = [job.dir] + (['--cast', job.cast_id] if job.cast_id else [])
do_tts = '--tts' in rest
skip_h3 = '--skip-h3' in rest
slides = [int(x) for x in rest if not x.startswith('--')] or job.slides()
now = lambda: datetime.datetime.now().strftime('%H:%M:%S')
os.environ.setdefault('PYTHONIOENCODING', 'utf-8')


def call(script, *args, log=None):
    with open(log, 'w', encoding='utf-8') if log else open(os.devnull, 'w') as fh:
        return subprocess.run([PY, os.path.join(HERE, script), *base, *args], stdout=fh, stderr=subprocess.STDOUT).returncode == 0


if do_tts:
    comfy_run.free()
    for s in slides:
        ok = call('tts.py', str(s), log=os.path.join(job.work, f'tts_s{s}.log'))
        print(f'tts {s} {"done" if ok else "TTS_FAIL"} {now()}', flush=True)
if not skip_h3 and not comfy_run.alive():
    raise SystemExit(f'ComfyUI가 응답하지 않는다: {comfy_run.BASE} — 먼저 켠다')
for s in slides:
    print(f'=== slide {s} start {now()}', flush=True)
    if not skip_h3 and not call('h3.py', str(s), log=os.path.join(job.work, f'h3_s{s}.log')):
        print(f'H3_FAIL {s}', flush=True); continue
    if not call('assemble.py', str(s), log=os.path.join(job.work, f'asm_s{s}.log')):
        print(f'ASM_FAIL {s}', flush=True); continue
    for k in range(job.steps(s)):
        mp4 = job.clip(s, k, 'mp4')
        r = subprocess.run([PY, os.path.join(HERE, 'matte.py'), mp4, mp4[:-4] + '.webm', '--poster', mp4[:-4] + '.png'],
                           capture_output=True, text=True)
        if 'frames' not in r.stdout:
            print(f'MATTE_FAIL {mp4}', flush=True)
    chunks = len(json.load(open(os.path.join(job.h3_dir(s), 'h3_log.json'), encoding='utf-8')))
    print(f'=== slide {s} done {now()} chunks={chunks}', flush=True)
print('RUN_ALL_DONE', flush=True)
