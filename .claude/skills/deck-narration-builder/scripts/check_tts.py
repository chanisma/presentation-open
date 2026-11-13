"""음성 조각 검수 — 대본과 Whisper 받아쓰기를 한글 음절만 남겨 비교해 일치도가 낮은 조각을 뽑는다.
받아쓰기는 숫자·영문을 아라비아 숫자·영문으로 돌려 적으므로(삼십 퍼센트 → 30%), 그런 조각은 점수가 낮아도
[숫자·영문]으로 표시만 한다 — 진짜 의심 조각은 표시가 없는 쪽이다. 의심 조각은 귀로 확인하고 tts.py --redo.
받아쓰기가 늘 틀리는 고유명사(예: 뉴쌤 → 뉴스엠)는 기계로 판별할 수 없으니 사람이 듣는다.

사용: python check_tts.py <presenter_dir> [--cast id] [기준=0.85]
"""
import difflib, glob, json, os, re, sys
from narr import job_from_args

job, rest = job_from_args(sys.argv[1:])
TH = float(rest[0]) if rest else 0.85
bad, total = [], 0
for f in sorted(glob.glob(os.path.join(job.work, 'tts_s*', 'chunks.json')), key=lambda p: int(re.search(r'tts_s(\d+)', p).group(1))):
    for c in json.load(open(f, encoding='utf-8')):
        total += 1
        h = c.get('heard', '')
        a, b = re.sub(r'[^가-힣]', '', c['text']), re.sub(r'[^가-힣]', '', h)
        r = difflib.SequenceMatcher(None, a, b).ratio() if a else 1
        if r < TH:
            bad.append((round(r, 2), c['file'], c['text'], h, bool(re.search(r'[0-9A-Za-z%]', h))))
real = [x for x in bad if not x[4]]
print(f'{total}조각 중 {len(bad)}조각이 일치도 {TH} 미만 — 숫자·영문 표기 차이를 뺀 의심 조각 {len(real)}개')
for r, f, t, h, digit in sorted(bad, key=lambda x: (x[4], x[0])):
    print(f'{r} {f}{"  [숫자·영문]" if digit else "  ◀ 확인"}\n  대본: {t}\n  들림: {h}')
