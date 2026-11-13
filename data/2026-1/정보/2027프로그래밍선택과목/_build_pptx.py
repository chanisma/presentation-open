# -*- coding: utf-8 -*-
"""4장 PNG를 각각 한 슬라이드로 채워 16:9 PPTX 생성."""
import os
import sys
from pptx import Presentation
from pptx.util import Inches

sys.stdout.reconfigure(encoding="utf-8")

BASE = r"C:\repository\presentation\정보\2027프로그래밍선택과목"
IMAGES = os.path.join(BASE, "images")
OUT = os.path.join(BASE, "프로그래밍선택과목_이미지.pptx")

# 16:9 캔버스 (widescreen)
prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
blank = prs.slide_layouts[6]  # blank layout

pngs = sorted(
    f for f in os.listdir(IMAGES) if f.startswith("slide-") and f.endswith(".png")
)
if not pngs:
    raise SystemExit("No slide PNGs found in " + IMAGES)

for name in pngs:
    slide = prs.slides.add_slide(blank)
    slide.shapes.add_picture(
        os.path.join(IMAGES, name),
        0, 0,
        width=prs.slide_width,
        height=prs.slide_height,
    )
    print(f"  + {name}")

prs.save(OUT)
print(f"Saved: {OUT} ({len(pngs)} slides)")
