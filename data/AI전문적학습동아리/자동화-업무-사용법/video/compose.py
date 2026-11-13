"""영상 내보내기 2/2 — 녹화 프레임을 고정 30fps H.264 mp4로 편다 (기본은 소리 없음, --voice 면 나레이션).

사용: python video/compose.py <rec_dir> <out.mp4> [--voice] [--fade-in] [--keep-frames]
  ffmpeg 은 FFMPEG 환경 변수 → imageio_ffmpeg 순으로 찾는다.
  스크린캐스트 프레임은 화면이 바뀔 때만 오므로(정지 화면에서는 드문드문) 출력 프레임 시각마다
  그 시각 직전의 녹화 프레임을 고른다. 시간축은 events.json 첫 단계 시작 ~ 마지막 단계 끝.

--voice (나레이션 3/3): narration.json 의 줄마다 녹음(tts.py)을 깐다.
  한 줄의 구간 = 녹화 중 그 자막이 화면에 뜬 시각(subs.json) ~ 다음 자막이 뜬 시각.
  목소리가 구간보다 길면 구간을 최대 STRETCH 배까지 느리게 펴고, 그래도 모자란 시간은
  구간 끝 화면(아직 그 자막이 떠 있는 프레임)에 멈춰 기다린다. 화면 자막과 목소리는 늘 같은 줄이다.
"""
import json
import os
import shutil
import subprocess
import sys
import wave
from bisect import bisect_right
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
WAVS = ROOT / 'presenter-media' / 'automation-guide' / 'narration'
FPS = 30
LEAD = 0.25  # 자막이 뜬 뒤 말을 시작하기까지
TAIL = 0.45  # 말이 끝난 뒤 다음 자막까지 최소 쉼
STRETCH = 1.25  # 구간을 느리게 펴는 한도 — 넘는 만큼은 멈춤
EPS = 0.12  # 멈출 때 다음 자막 전환보다 이만큼 앞의 프레임을 쓴다


def ffmpeg_exe() -> str:
    if os.environ.get('FFMPEG'):
        return os.environ['FFMPEG']
    import imageio_ffmpeg  # pip install imageio-ffmpeg

    return imageio_ffmpeg.get_ffmpeg_exe()


def voice_segments(rec: Path, t0: float, t1: float):
    """[(녹화 시작, 녹화 끝, 출력 길이, wav 경로|None)] — 자막 전환 시각으로 자른 구간"""
    lines = json.loads((HERE / 'narration.json').read_text(encoding='utf-8'))
    log = json.loads((rec / 'subs.json').read_text(encoding='utf-8'))
    cuts = []  # (녹화 시각, 줄)
    j = 0
    for line in lines:
        while j < len(log) and log[j]['text'] != line['text']:
            j += 1
        if j == len(log):
            raise SystemExit(f"녹화 자막 기록에서 {line['key']} 를 찾지 못함 — 녹화 범위(--from/--to)나 자막이 바뀌었는지 확인")
        cuts.append((min(max(log[j]['t'], t0), t1), line))
        j += 1
    if cuts[0][0] > t0:  # 첫 자막 전 화면은 소리 없이 그대로
        cuts.insert(0, (t0, None))
    segs = []
    for k, (a, line) in enumerate(cuts):
        b = cuts[k + 1][0] if k + 1 < len(cuts) else t1
        wav = WAVS / f"{line['key']}.wav" if line else None
        need = (LEAD + line['seconds'] + TAIL) if line else 0
        if line and not wav.exists():
            raise SystemExit(f'녹음 없음: {wav} — video/tts.py 먼저')
        segs.append((a, b, max(b - a, need), wav))
    return segs


def build_audio(segs, starts, total, out_wav: Path):
    """starts — 구간마다 영상에서 실제로 시작한 시각(프레임 단위로 올림된 값). 구간 길이를 그대로 더하면
    구간마다 1/FPS 미만씩 영상이 늘어나 뒤로 갈수록 목소리가 화면보다 앞선다"""
    rate = 44100
    pcm = bytearray(int(total * rate + rate) * 2)
    for (_, _, _, wav), pos in zip(segs, starts):
        if wav:
            with wave.open(str(wav)) as w:
                assert w.getframerate() == rate and w.getnchannels() == 1 and w.getsampwidth() == 2, wav
                data = w.readframes(w.getnframes())
            at = int((pos + LEAD) * rate) * 2
            pcm[at:at + len(data)] = data
    with wave.open(str(out_wav), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(bytes(pcm[: int(total * rate) * 2]))


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    rec, out = Path(args[0]).resolve(), Path(args[1]).resolve()
    fade = '--fade-in' in sys.argv
    voice = '--voice' in sys.argv
    frames = json.loads((rec / 'frames.json').read_text(encoding='utf-8'))
    events = json.loads((rec / 'events.json').read_text(encoding='utf-8'))
    ts = [f['ts'] for f in frames]
    t0 = events[0]['t']
    t1 = events[-1]['t'] + events[-1]['dur']

    # 출력 시각 → 녹화 시각 대응표. 소리가 없으면 그대로(1:1)
    segs = voice_segments(rec, t0, t1) if voice else [(t0, t1, t1 - t0, None)]
    tmap: list[float] = []
    starts: list[float] = []
    for a, b, dur, _ in segs:
        r = b - a
        s = min(STRETCH, dur / r) if r > 0 else 1.0
        start = len(tmap) / FPS
        starts.append(start)
        end = start + dur
        while len(tmap) / FPS < end - 1e-9:
            u = len(tmap) / FPS - start
            tmap.append(a + u / s if u / s < r - EPS else max(a, b - EPS))
    n = len(tmap)

    # 출력 프레임마다 고른 녹화 프레임 → 같은 프레임이 이어지는 구간을 하나의 duration 으로 묶는다
    runs: list[list] = []
    for tau in tmap:
        j = max(0, bisect_right(ts, tau) - 1)
        name = frames[j]['file']
        if runs and runs[-1][0] == name:
            runs[-1][1] += 1
        else:
            runs.append([name, 1])
    lst = rec / 'concat.txt'
    with lst.open('w', encoding='utf-8') as f:
        for name, cnt in runs:
            f.write(f"file 'frames/{name}'\nduration {cnt / FPS:.6f}\n")
        f.write(f"file 'frames/{runs[-1][0]}'\n")

    vf = f'fps={FPS},format=yuv420p'
    if fade:
        vf = f'fps={FPS},fade=t=in:st=0:d=0.8,format=yuv420p'
    out.parent.mkdir(parents=True, exist_ok=True)
    cmd = [ffmpeg_exe(), '-y', '-f', 'concat', '-safe', '0', '-i', str(lst)]
    if voice:
        build_audio(segs, starts, n / FPS, rec / 'voice.wav')
        cmd += ['-i', str(rec / 'voice.wav')]
    cmd += ['-vf', vf, '-c:v', 'libx264', '-preset', 'medium', '-crf', '22']
    if voice:
        cmd += ['-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '160k', '-shortest']
    else:
        cmd += ['-an']
    cmd += ['-movflags', '+faststart', str(out)]
    subprocess.run(cmd, check=True, cwd=rec)
    if voice:
        held = sum(max(0.0, d - (b - a) * STRETCH) for a, b, d, _ in segs)
        print(f'나레이션 {sum(1 for s in segs if s[3])}줄 · 녹화 {t1 - t0:.1f}s → 영상 {n / FPS:.1f}s (멈춤 합계 {held:.1f}s)')
    print(f'{out}  {n / FPS:.1f}s  {out.stat().st_size / 1e6:.1f}MB')
    if '--keep-frames' not in sys.argv:
        shutil.rmtree(rec / 'frames', ignore_errors=True)


if __name__ == '__main__':
    main()
