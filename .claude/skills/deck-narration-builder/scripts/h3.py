"""음성 조각마다 MiniMax H3(로컬 ComfyUI) 인물 참조(ref2va) + 오디오 가이드로 발표자 클립을 만든다.
- 오디오 가이드: MiniMaxH3AddGuide로 TTS 음성을 0번 프레임부터 고정 → H3가 그 소리에 맞춰 입·손짓을 만든다
- 이음새: 다음 조각 0번 프레임에 직전 조각을 '자르는 지점'(음성 길이 + 0.12초)의 프레임을 고정한다
- 사슬은 클릭 단계마다, 그리고 MAXCHAIN(기본 3) 조각마다 끊는다 — 계속 물려주면 생성 흠이 누적돼
  7번째 조각쯤 얼굴이 다른 사람처럼 흐트러진다. 끊은 이음새는 assemble.py가 크로스페이드로 잇는다
- 최종 클립의 소리는 H3 소리가 아니라 TTS 원음 — 발음은 TTS가 정확하다
- 프레임 수는 17k+5 격자(24fps), 해상도는 narration.json overlay.size(기본 576×704)

사용: python h3.py <presenter_dir> [--cast id] <장>
환경변수: SEED(42) · MAXCHAIN(3) · ONLY=sN_stepK_JJ.wav(조각 하나만) · ONLY_STEPS=0,2(그 단계만)
         · MIN_IDX=3(조각 번호 3 이상만 다시 — 나머지 기록 유지)
"""
import copy, json, math, os, shutil, subprocess, sys
from narr import job_from_args, env, ffmpeg
from comfy_run import run

job, rest = job_from_args(sys.argv[1:])
S = int(rest[0])
TTS, OUT = job.tts_dir(S), job.h3_dir(S)
W, H = job.size
SEED = int(os.environ.get('SEED', 42))
MAXCHAIN = int(os.environ.get('MAXCHAIN', 3))
MIN_IDX = int(os.environ.get('MIN_IDX', 0))
only = os.environ.get('ONLY')
only_steps = {int(x) for x in os.environ['ONLY_STEPS'].split(',')} if os.environ.get('ONLY_STEPS') else None
COMFY_IN = os.path.join(env('NARR_COMFY'), 'input')
TAG = job.tag  # ComfyUI 입력·출력 파일 이름 접두사 — 캐스트마다 달라야 서로 섞이지 않는다
P = job.cast['h3']
os.makedirs(OUT, exist_ok=True)

shutil.copy(job.image(), os.path.join(COMFY_IN, f'{TAG}_presenter_ref.png'))
wf = json.load(open(env('NARR_H3_WORKFLOW'), encoding='utf-8'))
chunks = json.load(open(os.path.join(TTS, 'chunks.json'), encoding='utf-8'))
steps_last = {c['step']: c['file'] for c in chunks}


def idx(f):
    return int(f[:-4].rsplit('_', 1)[1])


def frames_for(sec):
    need = math.ceil(sec * 24) + 10  # 끝에 0.4초 정도 여유
    return 17 * max(7, math.ceil((need - 5) / 17)) + 5


keep = only_steps is not None or MIN_IDX > 0 or only
logf = os.path.join(OUT, 'h3_log.json')
old = json.load(open(logf, encoding='utf-8')) if keep and os.path.exists(logf) else []
log = [e for e in old if (only and e['file'] != only) or (only_steps is not None and int(e['file'].split('_step')[1].split('_')[0]) not in only_steps)
       or (MIN_IDX > 0 and idx(e['file']) < MIN_IDX)]
prev_last, prev_step = None, None
for c in chunks:
    wav = c['file']
    if (only and wav != only) or (only_steps is not None and c['step'] not in only_steps) or (MIN_IDX and idx(wav) < MIN_IDX):
        continue
    if c['step'] != prev_step:
        prev_last, prev_step = None, c['step']
    if idx(wav) % MAXCHAIN == 0:
        prev_last = None
    if prev_last is None and idx(wav) % MAXCHAIN:
        # 사슬 중간부터 다시 만들 때 — 직전 조각의 자르는 지점 프레임을 원본에서 다시 뽑는다
        pe = next((e for e in log if e['file'] == wav.replace(f'_{idx(wav):02d}.wav', f'_{idx(wav) - 1:02d}.wav')), None)
        if pe and os.path.exists(pe['raw']):
            prev_last = f'{TAG}_last_{pe["file"][:-4]}.png'
            subprocess.run([ffmpeg(), '-y', '-loglevel', 'error', '-ss', f"{pe['audio_sec'] + 0.12 - 1 / 24:.3f}", '-i', pe['raw'],
                            '-frames:v', '1', '-update', '1', os.path.join(COMFY_IN, prev_last)], check=True)
    shutil.copy(os.path.join(TTS, wav), os.path.join(COMFY_IN, f'{TAG}_' + wav))
    g = copy.deepcopy(wf)
    g['21'] = {'class_type': 'LoadAudio', 'inputs': {'audio': f'{TAG}_' + wav}}
    g['22'] = {'class_type': 'MiniMaxH3AddGuide', 'inputs': {'positive': ['6', 0], 'latent': ['6', 1], 'audio_vae': ['5', 0], 'audio': ['21', 0], 'frame_idx': 0}}
    g['8']['inputs']['conditioning'] = ['22', 0]
    if prev_last:
        g['23'] = {'class_type': 'LoadImage', 'inputs': {'image': prev_last}}
        g['24'] = {'class_type': 'MiniMaxH3AddGuide', 'inputs': {'positive': ['22', 0], 'latent': ['6', 1], 'vae': ['4', 0], 'image': ['23', 0], 'frame_idx': 0}}
        g['8']['inputs']['conditioning'] = ['24', 0]
    length = frames_for(c['seconds'])
    tail = P['tail_end'] if steps_last[c['step']] == wav else P['tail_mid']
    patch = {
        '6': {'prompt': P['prompt'].format(text=c['text'], tail=tail), 'width': W, 'height': H, 'length': length, 'ref_image_size': 'match'},
        '7': {'noise_seed': SEED},
        '15': {'filename_prefix': f'video/{TAG}_' + wav[:-4]},
        '20': {'image': f'{TAG}_presenter_ref.png'},
    }
    raw = [o for o in run(g, patch, os.path.join(OUT, 'raw')) if o.lower().endswith('.mp4')][0]
    prev_last = f'{TAG}_last_' + wav[:-4] + '.png'
    subprocess.run([ffmpeg(), '-y', '-loglevel', 'error', '-ss', f"{c['seconds'] + 0.12 - 1 / 24:.3f}", '-i', raw, '-frames:v', '1', '-update', '1',
                    os.path.join(COMFY_IN, prev_last)], check=True)
    final = os.path.join(OUT, wav[:-4] + '.mp4')
    subprocess.run([ffmpeg(), '-y', '-loglevel', 'error', '-i', raw, '-i', os.path.join(TTS, wav), '-map', '0:v', '-map', '1:a',
                    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', final], check=True)
    log = [e for e in log if e['file'] != wav] + [{'file': wav, 'text': c['text'], 'audio_sec': c['seconds'], 'frames': length, 'raw': raw, 'final': final}]
    print(json.dumps(log[-1], ensure_ascii=False), flush=True)
log.sort(key=lambda e: (int(e['file'].split('_step')[1].split('_')[0]), idx(e['file'])))
json.dump(log, open(logf, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
