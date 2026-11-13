"""H3 조각 클립을 클릭 단계별 영상으로 잇는다 → <media>/sNN-stepK.mp4 + .jpg(포스터)
- 영상: 사슬로 이어진 이음새(직전 조각의 자르는 지점 프레임에서 시작)는 그대로 붙이고, 사슬을 새로 시작한 이음새
  (조각 번호가 MAXCHAIN의 배수)는 XF초 크로스페이드. 줄어드는 시간은 앞 조각을 XF초 더 길게 잘라 메운다 — 영상 길이 = 소리 길이
- 소리: TTS 원음을 조각마다 (음성 길이 + GAP)초로 맞춰 따로 잇는다
- 단계의 마지막 조각은 음성 + TAIL_HOLD초(기본 0.3)에서 자른다. H3 조각은 17프레임 격자·최소 124프레임이라 음성보다
  길고(짧은 문장은 최대 3초 이상), H3는 "말을 마치면 입을 다물라"는 지시를 따르지 않고 그 구간에서 소리 없이 입을 계속
  움직인다 — 자르지 않으면 "음성은 끝났는데 영상이 이어진다"(2026-09-30 두 캐스트 63단계 중 27~29단계가 1초 이상)
- concat·xfade 뒤에는 settb=1/24 — 없으면 시간축이 어긋나 xfade가 실패한다

사용: python assemble.py <presenter_dir> [--cast id] <장>
"""
import json, os, subprocess, sys
from collections import defaultdict
from narr import job_from_args, ffmpeg, duration

job, rest = job_from_args(sys.argv[1:])
S = int(rest[0])
MAXCHAIN = int(os.environ.get('MAXCHAIN', 3))
GAP, XF = 0.12, 0.25
TAIL_HOLD = float(os.environ.get('TAIL_HOLD', 0.3))
log = json.load(open(os.path.join(job.h3_dir(S), 'h3_log.json'), encoding='utf-8'))


def idx(e):
    return int(e['file'][:-4].rsplit('_', 1)[1])


by = defaultdict(list)
for e in log:
    by[int(e['file'].split('_step')[1].split('_')[0])].append(e)
if sorted(by) != list(range(job.steps(S))):
    raise SystemExit(f'{S}장: 단계 {sorted(by)} ≠ 대본 단계 0~{job.steps(S) - 1} — 빈 단계가 있거나 H3가 덜 끝났다')

for step, items in sorted(by.items()):
    items.sort(key=idx)
    n = len(items)
    vd, ad, reset_in = [], [], []
    for i, e in enumerate(items):
        nxt_reset = i + 1 < n and idx(items[i + 1]) % MAXCHAIN == 0
        if i == n - 1:
            v = a = min(duration(e['final']), e['audio_sec'] + TAIL_HOLD)
        else:
            a = e['audio_sec'] + GAP
            v = a + (XF if nxt_reset else 0)
        vd.append(v); ad.append(a)
        reset_in.append(i > 0 and idx(e) % MAXCHAIN == 0)
    args = [ffmpeg(), '-y', '-loglevel', 'error']
    for e in items:
        args += ['-i', e['final']]
    for e in items:
        args += ['-i', os.path.join(job.tts_dir(S), e['file'])]
    f = []
    for i in range(n):
        f.append(f'[{i}:v]trim=0:{vd[i]:.3f},setpts=PTS-STARTPTS,fps=24,format=yuv420p,settb=1/24[v{i}]')
        f.append(f'[{n + i}:a]aresample=48000,aformat=channel_layouts=stereo,apad,atrim=0:{ad[i]:.3f},asetpts=PTS-STARTPTS[a{i}]')
    cur, cum = 'v0', vd[0]
    for i in range(1, n):
        out = f'x{i}'
        if reset_in[i]:
            f.append(f'[{cur}][v{i}]xfade=transition=fade:duration={XF}:offset={cum - XF:.3f},settb=1/24[{out}]')
            cum += vd[i] - XF
        else:
            f.append(f'[{cur}][v{i}]concat=n=2:v=1:a=0,settb=1/24[{out}]')
            cum += vd[i]
        cur = out
    f.append(''.join(f'[a{i}]' for i in range(n)) + f'concat=n={n}:v=0:a=1[aout]')
    out = job.clip(S, step, 'mp4')
    args += ['-filter_complex', ';'.join(f), '-map', f'[{cur}]', '-map', '[aout]',
             '-c:v', 'libx264', '-crf', '22', '-preset', 'medium', '-g', '24', '-movflags', '+faststart',
             '-c:a', 'aac', '-b:a', '128k', '-shortest', out]
    subprocess.run(args, check=True)
    subprocess.run([ffmpeg(), '-y', '-loglevel', 'error', '-i', out, '-frames:v', '1', '-q:v', '3', out[:-4] + '.jpg'], check=True)
    print(out, round(cum, 2), 'resets', sum(reset_in), flush=True)
