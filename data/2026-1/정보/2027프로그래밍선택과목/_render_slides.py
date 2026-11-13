# -*- coding: utf-8 -*-
"""정보/2027프로그래밍선택과목 슬라이드 PDF -> PNG 추출 (DPI 200)."""
import os
import sys
import fitz

sys.stdout.reconfigure(encoding="utf-8")

BASE = r"C:\repository\presentation\정보\2027프로그래밍선택과목"
PDF = os.path.join(BASE, "프로그래밍선택과목_slides.pdf")
IMAGES = os.path.join(BASE, "images")
DPI = 200


def render():
    os.makedirs(IMAGES, exist_ok=True)
    for old in os.listdir(IMAGES):
        if old.startswith("slide-") and old.endswith(".png"):
            os.remove(os.path.join(IMAGES, old))

    doc = fitz.open(PDF)
    total = len(doc)
    print(f"Total pages: {total}")
    zoom = DPI / 72.0
    mat = fitz.Matrix(zoom, zoom)
    for i, page in enumerate(doc, start=1):
        pix = page.get_pixmap(matrix=mat, alpha=False)
        out = os.path.join(IMAGES, f"slide-{i:02d}.png")
        pix.save(out)
        print(f"  -> slide-{i:02d}.png ({pix.width}x{pix.height})")
    doc.close()
    print(f"Done. TOTAL = {total}")
    return total


if __name__ == "__main__":
    render()
