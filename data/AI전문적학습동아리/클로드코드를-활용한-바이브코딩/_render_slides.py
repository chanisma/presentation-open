"""클로드코드를 활용한 바이브코딩 — NotebookLM PDF를 슬라이드 PNG로 추출.

실행: python _render_slides.py
"""
import os
import sys
import fitz

sys.stdout.reconfigure(encoding="utf-8")

BASE = os.path.dirname(os.path.abspath(__file__))
PDF = os.path.join(BASE, "바이브코딩_slides.pdf")
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
        print(f"  -> {os.path.basename(out)} ({pix.width}x{pix.height})")
    doc.close()
    print(f"Done. TOTAL = {total} (use this in index.html)")
    return total


if __name__ == "__main__":
    render()
