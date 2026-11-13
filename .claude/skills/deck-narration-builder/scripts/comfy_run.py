"""ComfyUI API 도우미 — 워크플로(dict)의 입력을 바꿔 제출하고, 끝나면 결과 파일을 out_dir로 복사해 경로를 돌려준다."""
import json, os, shutil, time, urllib.request, uuid
from narr import env

BASE = env('NARR_COMFY_URL').rstrip('/')
COMFY_OUT = os.path.join(env('NARR_COMFY'), 'output')


def post(path, data):
    req = urllib.request.Request(BASE + path, data=json.dumps(data).encode(), headers={'Content-Type': 'application/json'})
    return json.load(urllib.request.urlopen(req))


def get(path):
    return json.load(urllib.request.urlopen(BASE + path))


def alive():
    try:
        urllib.request.urlopen(BASE + '/system_stats', timeout=3)
        return True
    except Exception:
        return False


def free():
    """모델을 내려 VRAM을 비운다 — TTS와 H3를 번갈아 돌릴 때 (ComfyUI는 끝나도 VRAM을 쥐고 있다)"""
    try:
        post('/free', {'unload_models': True, 'free_memory': True})
    except Exception:
        pass


def run(wf, patch, out_dir, timeout=1800):
    wf = json.loads(json.dumps(wf))
    for nid, inputs in patch.items():
        wf[nid]['inputs'].update(inputs)
    pid = post('/prompt', {'prompt': wf, 'client_id': str(uuid.uuid4())})['prompt_id']
    t0 = time.time()
    while True:
        h = get('/history/' + pid)
        if pid in h:
            st = h[pid].get('status', {})
            if st.get('status_str') == 'error':
                raise RuntimeError(json.dumps(st.get('messages', [])[-3:], ensure_ascii=False)[:2000])
            if st.get('completed'):
                break
        if time.time() - t0 > timeout:
            raise TimeoutError(pid)
        time.sleep(2)
    os.makedirs(out_dir, exist_ok=True)
    outs = []
    for node in h[pid]['outputs'].values():
        for key in ('images', 'gifs', 'videos', 'audio'):
            for f in node.get(key, []):
                dst = os.path.join(out_dir, f['filename'])
                shutil.copy(os.path.join(COMFY_OUT, f.get('subfolder', ''), f['filename']), dst)
                outs.append(dst)
    print(json.dumps({'prompt_id': pid, 'seconds': round(time.time() - t0, 1), 'outputs': outs}, ensure_ascii=False), flush=True)
    return outs
