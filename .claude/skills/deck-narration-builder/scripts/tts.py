"""대본 → 음성 조각. 클릭 단계마다 대본을 문장 단위로 묶어 H3 한 클립(≤ 약 13초)에 들어갈 조각으로 나누고,
캐스트의 기준 목소리를 복제해 합성한 뒤 Whisper large-v3로 받아써 chunks.json에 남긴다.

사용:
  python tts.py <presenter_dir> [--cast id] [장…]                         (장을 안 주면 전부)
  python tts.py <presenter_dir> [--cast id] --redo <sN_stepK_JJ.wav> [대본 수정본] [시도=4]
      조각 하나를 시드를 바꿔 다시 — 받아쓰기가 대본과 맞을 때까지(일치 0.93)
결과: <work>/tts_sN/sN_stepK_JJ.wav + chunks.json
주의: generate(language='ko') — language_id로 넘기면 음성이 노이즈가 된다
"""
import difflib, json, os, re, sys
import soundfile as sf, torch
from faster_whisper import WhisperModel
from omnivoice import OmniVoice
from narr import job_from_args

job, rest = job_from_args(sys.argv[1:])
V = job.cast['voice']
REF, REF_TEXT, LANG = job.voice_ref(), V['ref_text'], V.get('language', 'ko')
if not os.path.exists(REF):
    raise SystemExit(f'기준 목소리가 없다: {REF} — voice_design.py 먼저')
MAX_CHARS = int(os.environ.get('MAX_CHARS', 58))  # 한국어 약 4.5~5음절/초 → 58자 ≈ 12~13초 (H3 한 클립)
SR = 24000
model = OmniVoice.from_pretrained('k2-fsa/OmniVoice', device_map='cuda:0', dtype=torch.float16)
asr = WhisperModel('large-v3', device='cuda', compute_type='float16')


def hear(path):
    return ' '.join(x.text.strip() for x in asr.transcribe(path, language='ko', beam_size=5)[0])


def chunks(text):
    sents = [s.strip() for s in re.split(r'(?<=[.?!])\s+', text) if s.strip()]
    out, cur = [], ''
    for s in sents:
        parts = [p.strip() for p in re.split(r'(?<=,)\s+', s)] if len(s) > MAX_CHARS else [s]  # 긴 문장은 쉼표에서 한 번 더
        for p in parts:
            if cur and len(cur) + 1 + len(p) > MAX_CHARS:
                out.append(cur)
                cur = p
            else:
                cur = (cur + ' ' + p).strip()
    if cur:
        out.append(cur)
    return out


if rest and rest[0] == '--redo':
    name = rest[1]
    s = int(re.match(r's(\d+)_', name).group(1))
    D = job.tts_dir(s)
    cj = os.path.join(D, 'chunks.json')
    allc = json.load(open(cj, encoding='utf-8'))
    c = next(x for x in allc if x['file'] == name)
    text = rest[2] if len(rest) > 2 and rest[2] else c['text']
    tries = int(rest[3]) if len(rest) > 3 else 4
    best = None
    for i in range(tries):
        torch.manual_seed(1000 + i)
        a = model.generate(text=text, ref_audio=REF, ref_text=REF_TEXT, language=LANG)[0]
        tmp = os.path.join(D, f'_try{i}.wav')
        sf.write(tmp, a, SR)
        h = hear(tmp)
        r = difflib.SequenceMatcher(None, re.sub(r'[^가-힣]', '', text), re.sub(r'[^가-힣0-9]', '', h)).ratio()
        print(i, round(r, 3), round(len(a) / SR, 2), h)
        if best is None or r > best[0]:
            best = (r, tmp, h, len(a) / SR)
        if r > 0.93:
            break
    os.replace(best[1], os.path.join(D, name))
    for f in os.listdir(D):
        if f.startswith('_try'):
            os.remove(os.path.join(D, f))
    c.update({'text': text, 'heard': best[2], 'seconds': round(best[3], 2)})
    json.dump(allc, open(cj, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('선택:', round(best[0], 3), best[2])
    raise SystemExit(0)

for s in [int(x) for x in rest] or job.slides():
    D = job.tts_dir(s)
    os.makedirs(D, exist_ok=True)
    manifest = []
    for seg in job.segments(s):
        for j, c in enumerate(chunks(seg['text'])):
            name = f's{s}_step{seg["step"]}_{j:02d}.wav'
            a = model.generate(text=c, ref_audio=REF, ref_text=REF_TEXT, language=LANG)[0]
            sf.write(os.path.join(D, name), a, SR)
            manifest.append({'step': seg['step'], 'idx': j, 'text': c, 'heard': hear(os.path.join(D, name)), 'file': name, 'seconds': round(len(a) / SR, 2)})
            print(name, manifest[-1]['seconds'], '| 대본:', c, '| 들림:', manifest[-1]['heard'], flush=True)
    json.dump(manifest, open(os.path.join(D, 'chunks.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'tts {s} done', flush=True)
