"""deck-narration-builder 공용 설정 — 자료 폴더의 presenter/ 설정과 저장소 밖 도구 경로를 한 곳에서 푼다.

자료 쪽 (저장소 안, <자료 폴더>/presenter/)
  narration.json   대본(slides) + 덱 id(deck) + 발표자 자리(overlay: media·default·slides)
  cast.json        기본 캐스트 — 인물 이미지·목소리·H3 프롬프트
  cast-<id>.json   다른 캐스트. 영상 폴더는 <overlay.media>-<id>, 덱은 ?cast=<id>

도구·산출물 (저장소 밖) — 환경변수로 바꾼다. 값이 없으면 아래 DEFAULTS(이 저장소를 만든 PC 기준).
  NARR_FFMPEG       ffmpeg 실행 파일 (ffprobe는 같은 폴더)
  NARR_COMFY        ComfyUI 설치 폴더 (input/·output/)
  NARR_COMFY_URL    ComfyUI 주소
  NARR_H3_WORKFLOW  MiniMax H3 ref2va 워크플로 JSON — OpenMontage(AGPL) 파일이라 저장소로 복사하지 않고 경로로만 읽는다
  NARR_MEDIA        완성 영상 뿌리 폴더 — 기본은 저장소 루트의 presenter-media/(gitignore, dev 서버가 /presenter-media/로 서빙)
  NARR_WORK         중간 산출물(음성 조각·H3 원본) 뿌리 폴더
  NARR_WORKDIR · NARR_MEDIA_DIR   한 작업의 폴더를 통째로 지정(기존 작업 이어받기·시험용)
"""
import json, os, shutil, subprocess

DEFAULTS = {
    'NARR_FFMPEG': r'C:\Users\User\Desktop\08_소프트웨어\ffmpeg-2024-11-25-git-04ce01df0b-essentials_build\bin\ffmpeg.exe',
    'NARR_COMFY': r'C:\AI\ComfyUI',
    'NARR_COMFY_URL': 'http://127.0.0.1:8188',
    'NARR_H3_WORKFLOW': r'C:\Users\User\orca\projects\creative_works\OpenMontage\tools\_comfyui\workflows\minimax-h3-r2v.json',
    'NARR_MEDIA': os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', 'presenter-media')),  # 저장소/presenter-media (gitignore)
    'NARR_WORK': r'C:\AI\narration',
}


def env(key):
    return os.environ.get(key) or DEFAULTS[key]


def ffmpeg():
    f = os.environ.get('NARR_FFMPEG') or shutil.which('ffmpeg') or DEFAULTS['NARR_FFMPEG']
    if not os.path.exists(f):
        raise SystemExit(f'ffmpeg를 찾을 수 없다: {f} — NARR_FFMPEG로 지정')
    return f


def ffprobe():
    f = ffmpeg()
    return os.path.join(os.path.dirname(f), 'ffprobe' + ('.exe' if f.lower().endswith('.exe') else ''))


def duration(path):
    out = subprocess.run([ffprobe(), '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path],
                         capture_output=True, text=True, check=True).stdout
    return float(out.strip())


class Job:
    """자료 폴더(presenter/) + 캐스트 하나 = 작업 하나"""

    def __init__(self, presenter_dir, cast=''):
        self.dir = os.path.abspath(presenter_dir)
        self.nar = json.load(open(os.path.join(self.dir, 'narration.json'), encoding='utf-8'))
        cf = os.path.join(self.dir, f'cast-{cast}.json' if cast else 'cast.json')
        if not os.path.exists(cf):
            raise SystemExit(f'캐스트 파일이 없다: {cf}')
        self.cast_file = cf
        self.cast = json.load(open(cf, encoding='utf-8'))
        self.cast_id = cast
        ov = self.nar.get('overlay') or {}
        if 'media' not in ov:
            raise SystemExit('narration.json에 overlay.media가 없다')
        self.media_name = ov['media'] + (f'-{cast}' if cast else '')
        self.media = os.environ.get('NARR_MEDIA_DIR') or os.path.join(env('NARR_MEDIA'), self.media_name)
        self.work = os.environ.get('NARR_WORKDIR') or os.path.join(env('NARR_WORK'), self.media_name)
        self.tag = self.cast.get('tag') or ('n' + self.media_name.replace('-', '')[:10])
        self.size = ov.get('size') or [576, 704]
        os.makedirs(self.media, exist_ok=True)
        os.makedirs(self.work, exist_ok=True)

    # 대본
    def slides(self):
        return sorted(int(k) for k in self.nar['slides'])

    def segments(self, s):
        return self.nar['slides'][str(s)]

    def steps(self, s):
        return len(self.segments(s))

    # 자리 (덱 설계 박스 px) — 덱의 presenterFor와 같은 규칙
    def box(self, s):
        ov = self.nar['overlay']
        b = dict(ov['default'])
        b.update(ov.get('slides', {}).get(str(s), {}))
        return b['x'], b['y'], b['w']

    # 경로
    def tts_dir(self, s):
        return os.path.join(self.work, f'tts_s{s}')

    def h3_dir(self, s):
        return os.path.join(self.work, f'h3_s{s}')

    def clip(self, s, k, ext):
        return os.path.join(self.media, f's{s:02d}-step{k}.{ext}')

    def voice_ref(self):
        return os.path.join(self.dir, self.cast['voice']['ref'])

    def image(self):
        return os.path.join(self.dir, self.cast['image'])

    def save_cast(self):
        json.dump(self.cast, open(self.cast_file, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


def job_from_args(argv):
    """공통 인자: <presenter_dir> [--cast <id>] [나머지…]"""
    rest, cast, d = [], '', None
    it = iter(argv)
    for a in it:
        if a == '--cast':
            cast = next(it)
        elif d is None:
            d = a
        else:
            rest.append(a)
    if d is None:
        raise SystemExit('사용: <자료 폴더>/presenter [--cast <id>] …')
    return Job(d, cast), rest
