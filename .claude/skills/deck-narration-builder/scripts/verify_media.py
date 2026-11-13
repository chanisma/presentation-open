"""완성 미디어 점검 — 덱이 찾을 파일이 모두 있는가, 길이가 맞는가, 투명한가.
- 장·단계마다 sNN-stepK.{mp4,jpg,webm,png} 네 개가 모두 있다 (대본 단계 수 기준)
- mp4의 영상·소리 길이, webm 길이가 서로 0.15초 이내
- webm에 알파 채널(alpha_mode=1)
- 서로 다른 단계에 내용이 똑같은 파일이 없다 — 배치 확인용 임시 사본(자리표시)이 남았는지 잡는다
- 대본 단계보다 많은 파일(지난 판의 찌꺼기)
- 말이 끝난 뒤 영상이 TAIL_MAX초(기본 0.6)보다 길게 이어지는 단계 — 작업 폴더의 음성 조각 길이로 계산 (assemble.py가 자른다)

사용: python verify_media.py <presenter_dir> [--cast id]
"""
import hashlib, json, os, subprocess, sys
from narr import job_from_args, ffprobe

job, _ = job_from_args(sys.argv[1:])


def probe(path, sel, entry):
    return subprocess.run([ffprobe(), '-v', 'error', *sel, '-show_entries', entry, '-of', 'csv=p=0', path],
                          capture_output=True, text=True).stdout.strip()


miss, bad, total, hashes = [], [], 0.0, {}
TAIL_MAX = float(os.environ.get('TAIL_MAX', 0.6))
tails = []


def speech_end(s, k):
    cj = os.path.join(job.tts_dir(s), 'chunks.json')
    if not os.path.exists(cj):
        return None
    secs = [c['seconds'] for c in json.load(open(cj, encoding='utf-8')) if c['step'] == k]
    return sum(secs) + 0.12 * (len(secs) - 1) if secs else None
for s in job.slides():
    for k in range(job.steps(s)):
        files = {e: job.clip(s, k, e) for e in ('mp4', 'jpg', 'webm', 'png')}
        miss += [f for f in files.values() if not os.path.exists(f)]
        if not os.path.exists(files['mp4']) or not os.path.exists(files['webm']):
            continue
        v = float(probe(files['mp4'], ['-select_streams', 'v:0'], 'stream=duration') or 0)
        a = float(probe(files['mp4'], ['-select_streams', 'a:0'], 'stream=duration') or 0)
        w = float(probe(files['webm'], [], 'format=duration') or 0)
        al = probe(files['webm'], ['-select_streams', 'v:0'], 'stream_tags=alpha_mode')
        if abs(v - a) > 0.15 or abs(v - w) > 0.15 or al != '1':
            bad.append(f's{s:02d}-step{k}: 영상 {v:.2f} 소리 {a:.2f} webm {w:.2f} alpha={al or "없음"}')
        total += v
        se = speech_end(s, k)
        if se is not None and v - se > TAIL_MAX:
            tails.append(f's{s:02d}-step{k}: 말 끝 {se:.2f}s 뒤 {v - se:.2f}s 더')
        for e in ('mp4', 'webm'):
            hashes.setdefault(hashlib.md5(open(files[e], 'rb').read()).hexdigest(), []).append(os.path.basename(files[e]))
known = {os.path.basename(job.clip(s, k, e)) for s in job.slides() for k in range(job.steps(s)) for e in ('mp4', 'jpg', 'webm', 'png')}
extra = sorted(f for f in os.listdir(job.media) if f.startswith('s') and f not in known)
dups = [v for v in hashes.values() if len(v) > 1]
print(f'{job.media}\n단계 {sum(job.steps(s) for s in job.slides())}개 · 합계 {int(total // 60)}분 {total % 60:.0f}초')
print('없는 파일:', miss or '없음')
print('길이·알파 이상:', bad or '없음')
print('내용이 같은 파일(자리표시 의심):', dups or '없음')
print('대본에 없는 파일:', extra or '없음')
print(f'말이 끝난 뒤 {TAIL_MAX}초 넘게 이어지는 단계:', tails or '없음')
sys.exit(1 if (miss or bad or dups or tails) else 0)
