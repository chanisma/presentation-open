"""Extract slide text from an ODP file (or its already-extracted content.xml).

Usage:
    python extract_odp.py <path-to-odp-or-content.xml>
    python extract_odp.py <path-to-odp> --extract-to <dir>

ODP는 ZIP 포맷이라 LibreOffice 없이 표준 라이브러리만으로 텍스트를 뽑을 수 있다.
출력은 슬라이드별로 구분된 평문 텍스트.
"""
import argparse
import os
import re
import sys
import xml.etree.ElementTree as ET
import zipfile

sys.stdout.reconfigure(encoding="utf-8")

NS = {
    "office": "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
    "draw":   "urn:oasis:names:tc:opendocument:xmlns:drawing:1.0",
    "text":   "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
}


def extract_odp_to_dir(odp_path: str, dest_dir: str) -> str:
    """Unpack ODP (a ZIP) into dest_dir. Returns path to content.xml."""
    os.makedirs(dest_dir, exist_ok=True)
    with zipfile.ZipFile(odp_path) as zf:
        zf.extractall(dest_dir)
    return os.path.join(dest_dir, "content.xml")


def collect_text(elem) -> str:
    """Return concatenated text content of an element, preserving line order."""
    parts = []
    for p in elem.findall(".//text:p", NS):
        # text:p may contain mixed inline elements; collect itertext.
        txt = "".join(p.itertext()).strip()
        if txt:
            parts.append(txt)
    return "\n".join(parts)


def extract_slides(content_xml_path: str) -> list[tuple[str, str]]:
    """Return list of (slide_name, text) for each draw:page."""
    tree = ET.parse(content_xml_path)
    root = tree.getroot()
    slides = []
    for page in root.findall(".//draw:page", NS):
        name = page.get(f"{{{NS['draw']}}}name") or f"page{len(slides)+1}"
        slides.append((name, collect_text(page)))
    return slides


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("path", help="Path to .odp file or already-extracted content.xml")
    ap.add_argument("--extract-to", default=None, help="If .odp given, where to unpack")
    args = ap.parse_args()

    p = args.path
    if p.lower().endswith(".odp"):
        dest = args.extract_to or (os.path.splitext(p)[0] + "_unpacked")
        content_xml = extract_odp_to_dir(p, dest)
        print(f"[extracted] {dest}", file=sys.stderr)
    elif p.endswith("content.xml"):
        content_xml = p
    else:
        sys.exit(f"Unknown input: {p} (expected .odp or content.xml)")

    slides = extract_slides(content_xml)
    print(f"Total pages: {len(slides)}")
    for i, (name, text) in enumerate(slides, start=1):
        print(f"===== SLIDE {i} ({name}) =====")
        print(text)
        print()


if __name__ == "__main__":
    main()
