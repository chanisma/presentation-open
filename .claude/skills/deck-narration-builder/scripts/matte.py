"""Robust Video Matting(RVM)으로 발표자 영상의 배경을 지워 투명 WebM(VP9 알파) + 투명 포스터 PNG를 만든다.
RVM 코드는 GPL-3.0 — torch.hub로 저장소 밖(~/.cache/torch/hub)에서만 불러 쓰고 결과 영상만 가져간다. 저장소로 복사하지 않는다.
인물 옷색이 배경색과 비슷하면 윤곽이 번진다 — 참조 이미지의 배경을 옷과 대비되게 바꿔 두는 것이 먼저다.

사용: python matte.py <in.mp4> <out.webm> [--poster out.png] [--preview out.jpg] [--model resnet50|mobilenetv3] [--device cuda|cpu] [--ratio 0.5]
"""
import argparse, subprocess, time
import av, numpy as np, torch
from narr import ffmpeg

ap = argparse.ArgumentParser()
ap.add_argument('inp'); ap.add_argument('out')
ap.add_argument('--model', default='resnet50'); ap.add_argument('--device', default='cuda')
ap.add_argument('--ratio', type=float, default=0.5); ap.add_argument('--preview'); ap.add_argument('--poster')
a = ap.parse_args()

model = torch.hub.load('PeterL1n/RobustVideoMatting', a.model, trust_repo=True).eval().to(a.device)
cont = av.open(a.inp)
vs = cont.streams.video[0]
fps = float(vs.average_rate)
W, H = vs.codec_context.width, vs.codec_context.height
enc = subprocess.Popen([ffmpeg(), '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', f'{W}x{H}', '-r', f'{fps}', '-i', '-',
                        '-i', a.inp, '-map', '0:v', '-map', '1:a?', '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '30',
                        '-row-mt', '1', '-deadline', 'good', '-cpu-used', '4', '-auto-alt-ref', '0',
                        '-c:a', 'libopus', '-b:a', '128k', a.out], stdin=subprocess.PIPE)
rec = [None] * 4
t0, n, samples = time.time(), 0, []
with torch.no_grad():
    for frame in cont.decode(video=0):
        img = torch.from_numpy(frame.to_ndarray(format='rgb24')).permute(2, 0, 1).float().div(255).unsqueeze(0).to(a.device)
        fgr, pha, *rec = model(img, *rec, a.ratio)
        rgba = torch.cat([fgr, pha], 1)[0].permute(1, 2, 0).clamp(0, 1).mul(255).byte().cpu().numpy()
        enc.stdin.write(rgba.tobytes())
        if n == 0 and a.poster:
            from PIL import Image
            Image.fromarray(rgba).save(a.poster, optimize=True)
        if n in (24, 96, 168):
            samples.append(rgba.copy())
        n += 1
enc.stdin.close(); enc.wait()
print(f'{n} frames, {time.time() - t0:.1f}s on {a.device} ({a.model})')

if a.preview and samples:  # 밝은 배경 · 어두운 배경 · 알파 채널 세 줄 — 윤곽 번짐 확인용
    from PIL import Image
    rows = []
    for bg in [(243, 245, 242), (22, 32, 27)]:
        tiles = []
        for s in samples:
            al = s[..., 3:4].astype(np.float32) / 255
            tiles.append((s[..., :3].astype(np.float32) * al + np.array(bg, np.float32) * (1 - al)).astype(np.uint8))
        rows.append(np.concatenate(tiles, 1))
    rows.append(np.concatenate([np.repeat(s[..., 3:4], 3, 2) for s in samples], 1))
    Image.fromarray(np.concatenate(rows, 0)).resize((W * len(samples) // 2, H * 3 // 2)).save(a.preview, quality=90)
