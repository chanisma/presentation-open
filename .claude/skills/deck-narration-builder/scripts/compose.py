"""[선택] 영상 내보내기 2/2 — 녹화한 덱 화면 + 발표자 투명 WebM + TTS 소리 → 한 편의 mp4.
1) 스크린캐스트 프레임(시각 기록)을 30fps 고정 영상 base.mp4로 편다 (이미 있으면 다시 쓰지 않는다)
2) 단계마다 [누른 시각, 발표자 영상 길이] 구간을 잘라 발표자를 덱과 같은 자리·크기·그림자로 얹는다
   (자리는 narration.json overlay — 덱의 presenterFor와 같은 규칙. 그림자는 Presenter의 drop-shadow와 같은 값)
3) 단계 조각을 이어 붙인다 (-c copy)

사용: python compose.py <presenter_dir> [--cast id] <rec_dir> <out.mp4> [--fade-in] [--drop-frames]
  --fade-in      첫 장면을 0.8초 페이드인 (첫 장은 등장 애니메이션을 녹화하지 못한다)
  --drop-frames  base.mp4를 만든 뒤 frames/를 지운다 (수 GB)
"""
import json, os, shutil, subprocess, sys
from narr import job_from_args, ffmpeg, duration

job, rest = job_from_args(sys.argv[1:])
FLAGS = {a for a in rest if a.startswith('--')}
REC, OUT = [a for a in rest if not a.startswith('--')][:2]
FPS = 30
FW, FH = job.size
SEG = os.path.join(REC, 'seg')
os.makedirs(SEG, exist_ok=True)


def run(args):
    subprocess.run([ffmpeg(), '-y', '-loglevel', 'error', *args], check=True)


frames = sorted(json.load(open(os.path.join(REC, 'frames.json'))), key=lambda f: f['ts'])
events = json.load(open(os.path.join(REC, 'events.json'), encoding='utf-8'))
t0 = frames[0]['ts']

base = os.path.join(REC, 'base.mp4')
if not os.path.exists(base):
    lst = os.path.join(REC, 'frames.txt')
    with open(lst, 'w', encoding='utf-8') as fh:
        for a, b in zip(frames, frames[1:] + [None]):
            fh.write(f"file 'frames/{a['file']}'\nduration {max((b['ts'] - a['ts']) if b else 1.0, 0.001):.6f}\n")
        fh.write(f"file 'frames/{frames[-1]['file']}'\n")
    run(['-f', 'concat', '-safe', '0', '-i', lst, '-vf', f'fps={FPS},format=yuv420p', '-c:v', 'libx264', '-crf', '14', '-preset', 'fast', '-g', str(FPS), base])
if '--drop-frames' in FLAGS and os.path.isdir(os.path.join(REC, 'frames')):
    shutil.rmtree(os.path.join(REC, 'frames'))

segs = []
for i, e in enumerate(events):
    s, k = e['slide'], e['step']
    # 길이는 지금의 발표자 영상에서 — 녹화 뒤에 영상을 줄였으면(끝 자르기 등) 녹화본을 그대로 두고 합성만 다시 하면 된다.
    # 녹화 때보다 길어졌다면 다음 단계 화면이 섞이므로 다시 녹화한다
    d = duration(job.clip(s, k, 'mp4'))
    if d > e['dur'] + 0.05:
        raise SystemExit(f's{s:02d}-step{k}: 영상 {d:.2f}s > 녹화 {e["dur"]:.2f}s — 다시 녹화(record.mjs)')
    x, y, w = job.box(s)
    w2 = w + w % 2
    h = round(w * FH / FW)
    h += h % 2
    seg = os.path.join(SEG, f's{s:02d}-step{k}.mp4')
    fade = ',fade=t=in:st=0:d=0.8' if ('--fade-in' in FLAGS and i == 0) else ''
    fc = (f'[1:v]scale={w2}:{h}:flags=lanczos,format=rgba,split[p][q];'
          f'[q]colorchannelmixer=rr=0:gg=0:bb=0:aa=0.16,gblur=sigma=11[sh];'
          f'[0:v][sh]overlay={x}:{y + 14}:format=auto[b1];'
          f'[b1][p]overlay={x}:{y}:format=auto,format=yuv420p{fade}[v]')
    run(['-ss', f"{e['t'] - t0:.3f}", '-t', f'{d:.3f}', '-i', base,
         '-c:v', 'libvpx-vp9', '-i', job.clip(s, k, 'webm'),  # VP9 알파는 libvpx 디코더로 읽어야 투명이 산다
         '-i', job.clip(s, k, 'mp4'),
         '-filter_complex', fc, '-map', '[v]', '-map', '2:a',
         '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-r', str(FPS),
         '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-ac', '2', '-t', f'{d:.3f}', seg])
    segs.append(seg)
    print(os.path.basename(seg), round(e['t'] - t0, 2), round(d, 2), flush=True)

cl = os.path.join(SEG, 'concat.txt')
with open(cl, 'w', encoding='utf-8') as fh:
    fh.writelines(f"file '{os.path.abspath(sg)}'\n" for sg in segs)
os.makedirs(os.path.dirname(os.path.abspath(OUT)), exist_ok=True)
run(['-f', 'concat', '-safe', '0', '-i', cl, '-c', 'copy', '-movflags', '+faststart', OUT])
print('->', OUT)
