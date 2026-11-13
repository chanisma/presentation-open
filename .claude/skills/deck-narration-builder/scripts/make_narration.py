"""발표자 노트(notes.ts) → narration.json 초안.
노트의 (클릭 n …) 표시에서 클릭 단계를 나누고, 연출 괄호를 지우고, 숫자·영문 약어를 TTS가 읽을 한글 발음으로 푼다.
초안은 반드시 사람이 읽고 다듬는다(고유명사 발음, 어색한 숫자 읽기, 빈 단계).

사용: python make_narration.py <notes.ts> <presenter_dir> --deck <덱 id> --media <영상 폴더 이름> [--abbr 약어.json] [--force]
  notes.ts 형식:  export const NOTES = { 1: "…", 2: "…" }  (한 줄에 한 장, 값은 JSON 문자열)
  약어.json:      [["AIEP", "에이아이이피"], …] — 기본 표보다 먼저 적용
  결과:           presenter/narration.json (있으면 narration.draft.json — --force로 덮어쓰기)
"""
import json, os, re, sys

args = sys.argv[1:]
opt = {k: args[args.index(k) + 1] for k in ('--deck', '--media', '--abbr') if k in args}
pos = [a for i, a in enumerate(args) if not a.startswith('--') and (i == 0 or args[i - 1] not in ('--deck', '--media', '--abbr'))]
NOTES, PDIR = pos[0], pos[1]
src = open(NOTES, encoding='utf-8').read()
notes = {int(m.group(1)): json.loads(m.group(2)) for m in re.finditer(r'^\s*(\d+):\s*(".*"),?\s*$', src, re.M)}
if not notes:
    raise SystemExit('notes.ts에서 노트를 찾지 못했다 — 한 줄에 `N: "…",` 형식인지 확인')

DIG = '영일이삼사오육칠팔구'


def small(n):
    s = ''
    for u, name in [(1000, '천'), (100, '백'), (10, '십')]:
        if n >= u:
            q, n = divmod(n, u)
            s += ('' if q == 1 else DIG[q]) + name
    return s + (DIG[n] if n else '')


def sino(n):
    """한자어 수사 — 2800 → 이천팔백, 124000000 → 일억 이천사백만"""
    if n == 0:
        return '영'
    out = ''
    for u, name in [(10 ** 8, '억'), (10 ** 4, '만')]:
        if n >= u:
            q, n = divmod(n, u)
            out += (small(q) if q > 1 or name != '만' else '') + name + ' '
    return (out + small(n)).strip() if n else out.strip()


def num(tok):
    tok = tok.replace(',', '')
    if '.' in tok:
        a, b = tok.split('.')
        return sino(int(a)) + ' 점 ' + ''.join(DIG[int(c)] for c in b)
    return sino(int(tok))


# 기본 약어 표 — 긴 것부터. 덱 고유 약어는 --abbr로 더한다
ABBR = [('ChatGPT', '챗지피티'), ('Claude Code', '클로드 코드'), ('Copilot', '코파일럿'), ('Gemini', '제미나이'), ('Codex', '코덱스'),
        ('KERIS', '케리스'), ('NEIS', '나이스'), ('LLM', '엘엘엠'), ('GPT', '지피티'), ('API', '에이피아이'), ('AI', '에이아이'),
        ('SW', '소프트웨어'), ('IT', '아이티'), ('PC', '피시'), ('URL', '유알엘'), ('QR', '큐알')]
if '--abbr' in opt:
    ABBR = [tuple(x) for x in json.load(open(opt['--abbr'], encoding='utf-8'))] + ABBR


def speak(t):
    t = re.sub(r'\s*\([^)]*\)\s*', ' ', t)  # 연출 괄호 (클릭·손짓 지시 등)
    t = re.sub('[「」"“”]', '', t)
    for a, b in ABBR:
        t = re.sub(rf'(?<![A-Za-z]){re.escape(a)}(?![A-Za-z])', b, t)
    t = re.sub(r'[’\'](\d{2})년', lambda m: '이천' + sino(int(m.group(1))) + '년', t)
    t = re.sub(r'(\d[\d,]*(?:\.\d+)?)\s*%', lambda m: num(m.group(1)) + ' 퍼센트', t)
    t = re.sub(r'(\d[\d,]*(?:\.\d+)?)(?=[가-힣])', lambda m: num(m.group(1)) + ' ', t)  # 숫자 뒤 단위는 띄어 읽게
    t = re.sub(r'(\d[\d,]*(?:\.\d+)?)', lambda m: num(m.group(1)), t)
    # 가·나 → 가와 나 (받침에 따라 과/와)
    t = re.sub(r'([가-힣]+)·([가-힣]+)', lambda m: m.group(1) + ('과 ' if (ord(m.group(1)[-1]) - 0xAC00) % 28 else '와 ') + m.group(2), t)
    t = t.replace('·', ', ').replace('→', ', ').replace('~', ' 에서 ')
    t = re.sub(r'\s+', ' ', t).strip()
    return re.sub(r'\s+([.,?!])', r'\1', t)


slides = {}
for k in sorted(notes):
    parts = re.split(r'\(클릭 \d[^)]*\)', notes[k])
    slides[str(k)] = [{'step': i, 'text': speak(p)} for i, p in enumerate(parts)]

out = {
    '_readme': '발표자 오버레이 영상용 대본과 배치(deck-narration-builder). slides는 발표자 노트에서 뽑은 초안 — 사람이 다듬는다. '
               'overlay는 덱(presenterFor)과 영상 합성이 함께 쓰는 발표자 자리(설계 박스 1920×1080 px).',
    'deck': opt.get('--deck', ''),
    'overlay': {'media': opt.get('--media', opt.get('--deck', '')), 'size': [576, 704], 'default': {'x': 1548, 'y': 650, 'w': 352}, 'slides': {}},
    'slides': slides,
}
dst = os.path.join(PDIR, 'narration.json')
if os.path.exists(dst) and '--force' not in args:
    dst = os.path.join(PDIR, 'narration.draft.json')
os.makedirs(PDIR, exist_ok=True)
json.dump(out, open(dst, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
empty = [f'{k}-{s["step"]}' for k, v in slides.items() for s in v if not s['text']]
for k, v in slides.items():
    for s in v:
        print(f'[{k}-{s["step"]}] {s["text"]}')
print('->', dst, '| 빈 단계(대사를 채우거나 덱 클릭 수를 확인):', empty or '없음')
