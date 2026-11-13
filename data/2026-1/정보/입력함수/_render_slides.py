"""Render each PDF page to PNG in images/slide-NN.png at high DPI."""
import os
import sys
import fitz

sys.stdout.reconfigure(encoding="utf-8")

BASE = r"E:\presentation\정보\입력함수"
PDF = os.path.join(BASE, "입력함수_slides.pdf")
IMAGES_DIR = os.path.join(BASE, "images")
DPI = 200

os.makedirs(IMAGES_DIR, exist_ok=True)

for old in os.listdir(IMAGES_DIR):
    if old.startswith("slide-") and old.endswith(".png"):
        os.remove(os.path.join(IMAGES_DIR, old))

doc = fitz.open(PDF)
print(f"Total pages: {len(doc)}")

zoom = DPI / 72.0
mat = fitz.Matrix(zoom, zoom)

for i, page in enumerate(doc, start=1):
    pix = page.get_pixmap(matrix=mat, alpha=False)
    out = os.path.join(IMAGES_DIR, f"slide-{i:02d}.png")
    pix.save(out)
    print(f"  -> {os.path.basename(out)} ({pix.width}x{pix.height})")

doc.close()
print(f"Done. TOTAL = {len(doc)} (use this in index.html)")
