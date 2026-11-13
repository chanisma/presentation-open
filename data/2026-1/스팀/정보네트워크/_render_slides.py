"""디지털 네트워크와 행렬 [정보편] — NotebookLM PDF에서 슬라이드 PNG 추출.

    python _render_slides.py
"""
import os
import sys
import fitz

sys.stdout.reconfigure(encoding="utf-8")

BASE = os.path.dirname(os.path.abspath(__file__))
PDF = os.path.join(BASE, "정보네트워크_slides.pdf")
IMAGES = os.path.join(BASE, "images")
DPI = 200


def main():
    os.makedirs(IMAGES, exist_ok=True)
    for old in os.listdir(IMAGES):
        if old.startswith("slide-") and old.endswith(".png"):
            os.remove(os.path.join(IMAGES, old))

    doc = fitz.open(PDF)
    total = len(doc)
    print(f"Total pages: {total}")

    mat = fitz.Matrix(DPI / 72.0, DPI / 72.0)
    for i, page in enumerate(doc, start=1):
        pix = page.get_pixmap(matrix=mat, alpha=False)
        out = os.path.join(IMAGES, f"slide-{i:02d}.png")
        pix.save(out)
        print(f"  -> slide-{i:02d}.png ({pix.width}x{pix.height})")

    doc.close()
    print(f"Done. TOTAL = {total} (use this in index.html)")


if __name__ == "__main__":
    main()
