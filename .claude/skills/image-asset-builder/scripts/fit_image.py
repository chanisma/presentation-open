#!/usr/bin/env python3
"""fit_image.py — 이미지를 정확한 해상도로 cover-crop (ImageMagick 대체, PIL만 사용).

사용:  python fit_image.py <image.png> <width> <height>
       python fit_image.py stage-01.png 1920 1080

가로세로비를 유지한 채 짧은 변을 채우도록 확대·축소한 뒤 중앙에서 잘라낸다
(magick -resize WxH^ -gravity center -extent WxH 와 같은 동작). 알파는 보존.
"""
import sys
from PIL import Image

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass


def main() -> int:
    if len(sys.argv) < 4:
        print("usage: fit_image.py <image> <width> <height>", file=sys.stderr)
        return 1
    src, w, h = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])

    im = Image.open(src)
    if im.mode not in ("RGB", "RGBA"):
        im = im.convert("RGBA" if "A" in im.getbands() else "RGB")
    if im.size == (w, h):
        print(f"  ⓘ 이미 {w}x{h} — 보정 불필요")
        return 0

    scale = max(w / im.width, h / im.height)
    nw, nh = max(w, round(im.width * scale)), max(h, round(im.height * scale))
    im = im.resize((nw, nh), Image.LANCZOS)
    left, top = (nw - w) // 2, (nh - h) // 2
    im = im.crop((left, top, left + w, top + h))
    im.save(src)
    print(f"  ⓘ 해상도 보정 → {w}x{h}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
