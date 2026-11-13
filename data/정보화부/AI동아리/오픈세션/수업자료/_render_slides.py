"""Render each PDF page to PNG at high DPI.

Usage:
    python render_slides.py <pdf-path> <images-dir>
    python render_slides.py <pdf-path> <images-dir> --dpi 200

이 스크립트는 정보/<주제>/_render_slides.py 로 복사된 후
경로를 하드코딩하여 실행되는 것이 일반적이지만, CLI 인자로도 호출 가능.
"""
import argparse
import os
import sys
import fitz

sys.stdout.reconfigure(encoding="utf-8")


def render(pdf_path: str, images_dir: str, dpi: int = 200) -> int:
    os.makedirs(images_dir, exist_ok=True)

    # Wipe any existing slide-NN.png so re-runs are clean
    for old in os.listdir(images_dir):
        if old.startswith("slide-") and old.endswith(".png"):
            os.remove(os.path.join(images_dir, old))

    doc = fitz.open(pdf_path)
    total = len(doc)
    print(f"Total pages: {total}")

    zoom = dpi / 72.0
    mat = fitz.Matrix(zoom, zoom)

    for i, page in enumerate(doc, start=1):
        pix = page.get_pixmap(matrix=mat, alpha=False)
        out = os.path.join(images_dir, f"slide-{i:02d}.png")
        pix.save(out)
        print(f"  -> {os.path.basename(out)} ({pix.width}x{pix.height})")

    doc.close()
    print(f"Done. TOTAL = {total} (use this in index.html)")
    return total


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf", help="Path to the slide-deck PDF")
    ap.add_argument("images_dir", help="Directory to write slide-NN.png files")
    ap.add_argument("--dpi", type=int, default=200)
    args = ap.parse_args()
    render(args.pdf, args.images_dir, args.dpi)


if __name__ == "__main__":
    main()
