"""캐스트의 기준 목소리를 설계한다 — OmniVoice 목소리 설계(instruct)로 후보를 여러 개 만들고 수치로 비교한 뒤 하나를 고른다.
기준 목소리는 한 번만 만들고, 이후 모든 조각은 이 목소리를 복제한다(장마다 목소리가 같다).

사용:
  python voice_design.py <presenter_dir> [--cast id] candidates [시드…]     후보 생성 + report.json (기본 시드 11 12 13 14)
  python voice_design.py <presenter_dir> [--cast id] pick <시드>            그 후보를 presenter/<voice.ref>로 복사, cast에 seed 기록

비교 수치: match(받아쓰기 일치) · f0_median(음높이 중앙값 Hz) · f0_spread_st(음높이 변화폭, 반음 — 작을수록 차분)
          · syl_per_s(초당 음절 — 작을수록 느긋). 귀로 듣고 고르는 것이 원칙이고 수치는 보조다.
instruct 어휘는 고정(자유 문장 불가): female/male · child/teenager/young adult/middle-aged/elderly
          · very low/low/moderate/high/very high pitch · whisper · <국가> accent
"""
import difflib, json, os, re, shutil, sys
from narr import job_from_args

job, rest = job_from_args(sys.argv[1:])
cmd = rest[0] if rest else 'candidates'
V = job.cast['voice']
REF_TEXT = V['ref_text']
OUT = os.path.join(job.work, 'voice')
os.makedirs(OUT, exist_ok=True)

if cmd == 'pick':
    seed = int(rest[1])
    shutil.copy(os.path.join(OUT, f'cand_{seed}_ref.wav'), job.voice_ref())
    V['seed'] = seed
    job.save_cast()
    print('기준 목소리 ->', job.voice_ref())
    raise SystemExit(0)

import numpy as np, librosa, soundfile as sf, torch
from faster_whisper import WhisperModel
from omnivoice import OmniVoice

seeds = [int(x) for x in rest[1:]] or [11, 12, 13, 14]
TEST = V.get('test_text') or '오늘 말씀드릴 내용은 세 가지입니다. 먼저 지금 상황을 보고, 무엇을 바꾸면 좋을지 차례로 짚어 보겠습니다.'
SR = 24000
m = OmniVoice.from_pretrained('k2-fsa/OmniVoice', device_map='cuda:0', dtype=torch.float16)
asr = WhisperModel('large-v3', device='cuda', compute_type='float16')
norm = lambda t: re.sub(r'[^가-힣]', '', t)
rep = []
for seed in seeds:
    torch.manual_seed(seed)
    ref = m.generate(text=REF_TEXT, instruct=V['instruct'], language=V.get('language', 'ko'))[0]
    rf = os.path.join(OUT, f'cand_{seed}_ref.wav')
    sf.write(rf, ref, SR)
    torch.manual_seed(0)  # 복제 안정성 — 이 기준 음성으로 다른 문장을 읽혀 본다
    a = m.generate(text=TEST, ref_audio=rf, ref_text=REF_TEXT, language=V.get('language', 'ko'))[0]
    tf = os.path.join(OUT, f'cand_{seed}_test.wav')
    sf.write(tf, a, SR)
    heard = ' '.join(s.text.strip() for s in asr.transcribe(tf, language='ko', beam_size=5)[0])
    f0, vf, _ = librosa.pyin(a.astype(np.float32), fmin=80, fmax=500, sr=SR)
    f0 = f0[vf & ~np.isnan(f0)]
    st = 12 * np.log2(f0 / np.median(f0))
    r = {'seed': seed, 'match': round(difflib.SequenceMatcher(None, norm(TEST), norm(heard)).ratio(), 3),
         'f0_median': round(float(np.median(f0)), 1), 'f0_spread_st': round(float(np.percentile(st, 90) - np.percentile(st, 10)), 2),
         'syl_per_s': round(len(norm(TEST)) / (len(a) / SR), 2), 'ref': rf, 'test': tf, 'heard': heard}
    rep.append(r)
    print(json.dumps(r, ensure_ascii=False), flush=True)
json.dump(rep, open(os.path.join(OUT, 'report.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('후보:', OUT, '— 들어 보고 `pick <시드>`')
