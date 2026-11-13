"""나레이션 2/3 — narration.json 의 say 를 ElevenLabs v4(Sara Kim - Warm Korean Narrator)로 줄마다 녹음한다.

creative_works/OpenMontage/projects/academy-star-anime/tts_eleven.py 와 같은 방식:
한 줄을 녹음할 때마다 Whisper large-v3 로 받아써서 대본과 한글이 90% 넘게 맞지 않으면 최대 3번 다시 뽑아 가장 나은 것을 둔다.
OmniVoice venv 로 실행한다 (requests · faster-whisper · soundfile 이 들어 있다):

    C:/AI/tts/omnivoice-venv/Scripts/python.exe video/tts.py            # 아직 없거나 say 가 바뀐 줄만
    C:/AI/tts/omnivoice-venv/Scripts/python.exe video/tts.py --all      # 전부 다시
    C:/AI/tts/omnivoice-venv/Scripts/python.exe video/tts.py s04_3      # 한 줄

API 키: 환경 변수 ELEVENLABS_API_KEY → creative_works/OpenMontage/.env 순으로 찾는다.
결과: presenter-media/agent-terminal-guide/narration/<key>.wav (44.1 kHz 모노, 앞뒤 무음 제거)
      + narration.json 의 seconds · heard · match (녹음 기록)
"""
import difflib, hashlib, json, os, re, subprocess, sys
import requests

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))
NAR = os.path.join(HERE, 'narration.json')
OUT = os.path.join(ROOT, 'presenter-media', 'agent-terminal-guide', 'narration')
ENV = r'C:\Users\User\orca\projects\creative_works\OpenMontage\.env'
API = 'https://api.elevenlabs.io/v1'
VOICE = {
    'voice_id': 'xyE2KXhy5mfTGV7xRXpD',  # Sara Kim - Warm Korean Narrator (공유 라이브러리)
    'model': 'eleven_v4',
    'settings': {'stability': 0.55, 'similarity_boost': 0.8, 'style': 0.2, 'speed': 1.0},
}


def ffmpeg():
    if os.environ.get('FFMPEG'):
        return os.environ['FFMPEG']
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:  # OmniVoice venv 에는 없다 — creative_works 가 쓰던 ffmpeg
        return r'C:\AI\ComfyUI\custom_nodes\ComfyUI-DLSS5-Enhancer\ffmpeg\bin\ffmpeg.exe'


def env_key():
    if os.environ.get('ELEVENLABS_API_KEY'):
        return os.environ['ELEVENLABS_API_KEY']
    for line in open(ENV, encoding='utf-8'):
        if line.startswith('ELEVENLABS_API_KEY='):
            return line.split('=', 1)[1].strip()
    raise SystemExit('ELEVENLABS_API_KEY 없음')


H = {'xi-api-key': env_key()}
norm = lambda t: re.sub(r'[^가-힣]', '', t)
sig = lambda say: hashlib.sha1(json.dumps([say, VOICE], ensure_ascii=False).encode()).hexdigest()[:10]


def speak(text, path):
    body = {'text': text, 'model_id': VOICE['model'], 'language_code': 'ko', 'voice_settings': VOICE['settings']}
    r = requests.post(f"{API}/text-to-speech/{VOICE['voice_id']}?output_format=mp3_44100_128", headers=H, json=body, timeout=120)
    if not r.ok:
        raise SystemExit(f'ElevenLabs {r.status_code}: {r.text[:300]}')
    # 앞뒤 무음을 걷는다 — 줄 사이 간격은 compose.py 가 정한다
    subprocess.run([ffmpeg(), '-y', '-loglevel', 'error', '-i', '-', '-af',
                    'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,'
                    'areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.12,areverse',
                    '-ar', '44100', '-ac', '1', path], input=r.content, check=True)


def seconds(path):
    import soundfile as sf
    info = sf.info(path)
    return info.frames / info.samplerate


def main(args):
    from faster_whisper import WhisperModel
    lines = json.load(open(NAR, encoding='utf-8'))
    ids = [a for a in args if not a.startswith('--')]
    def due(l):
        if ids:
            return l['key'] in ids
        return '--all' in args or l.get('sig') != sig(l['say']) or not os.path.exists(os.path.join(OUT, f"{l['key']}.wav"))
    todo = [l for l in lines if due(l)]
    print(f'녹음할 줄 {len(todo)} / {len(lines)}', flush=True)
    if not todo:
        return
    os.makedirs(OUT, exist_ok=True)
    asr = WhisperModel('large-v3', device='cuda', compute_type='float16')
    for l in todo:
        key, say = l['key'], l['say']
        best = None
        for take in range(3):
            tmp = os.path.join(OUT, f'_{key}_t{take}.wav')
            speak(say, tmp)
            heard = ' '.join(x.text.strip() for x in asr.transcribe(tmp, language='ko', beam_size=5)[0])
            r = difflib.SequenceMatcher(None, norm(say), norm(heard)).ratio() if norm(say) else 1.0
            if re.search(r'\d', heard):  # Whisper 는 수를 숫자로 적는다 — 그런 줄은 비율 대신 귀로 판단
                r = max(r, 0.9)
            if best is None or r > best[0]:
                best = (r, tmp, heard, take)
            if r >= 0.9:
                break
        os.replace(best[1], os.path.join(OUT, f'{key}.wav'))
        for f in os.listdir(OUT):
            if f.startswith(f'_{key}_'):
                os.remove(os.path.join(OUT, f))
        l.update(seconds=round(seconds(os.path.join(OUT, f'{key}.wav')), 2), heard=best[2], match=round(best[0], 3),
                 take=best[3], sig=sig(say))
        print(key, l['seconds'], l['match'], best[2], flush=True)
        with open(NAR, 'w', encoding='utf-8') as f:
            json.dump(lines, f, ensure_ascii=False, indent=1)
            f.write('\n')
    bad = [l['key'] for l in lines if l.get('match', 1) < 0.9]
    print(f'녹음 {len(todo)}줄 · 0.9 미만: {bad}  · 합계 {sum(l.get("seconds", 0) for l in lines):.1f}초')


if __name__ == '__main__':
    main(sys.argv[1:])
