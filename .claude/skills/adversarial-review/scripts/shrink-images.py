# 캡처 PNG를 codex 첨부용으로 줄인다. 16장을 원본으로 보내면 웹소켓이 끊긴다(18MB → 1.3MB).
#
# 사용:  python shrink-images.py <입력폴더> [출력폴더] [최대변]
#   예:  python .claude/skills/adversarial-review/scripts/shrink-images.py tmp/scene-shots tmp/scene-small 1100
import io
import os
import sys
import glob

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
try:
    from PIL import Image
except ImportError:
    print('PIL이 필요하다: python -m pip install pillow')
    sys.exit(1)

src = sys.argv[1] if len(sys.argv) > 1 else 'tmp/scene-shots'
dst = sys.argv[2] if len(sys.argv) > 2 else 'tmp/scene-small'
side = int(sys.argv[3]) if len(sys.argv) > 3 else 1100
os.makedirs(dst, exist_ok=True)

files = sorted(glob.glob(os.path.join(src, '*.png')) + glob.glob(os.path.join(src, '*.jpg')))
if not files:
    print('입력 이미지가 없다:', src)
    sys.exit(1)

before = after = 0
for f in files:
    before += os.path.getsize(f)
    im = Image.open(f).convert('RGB')
    im.thumbnail((side, side))
    # 파일명은 ASCII로 — codex가 한글 경로에서 실패한 적이 있다
    name = os.path.splitext(os.path.basename(f))[0]
    name = ''.join(ch if ord(ch) < 128 else '_' for ch in name)
    out = os.path.join(dst, name + '.jpg')
    im.save(out, quality=88)
    after += os.path.getsize(out)

print(f'{len(files)}장 · {before/1e6:.1f}MB → {after/1e6:.1f}MB · 저장: {dst}')
