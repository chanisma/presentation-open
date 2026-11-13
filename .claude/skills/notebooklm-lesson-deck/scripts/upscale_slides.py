# -*- coding: utf-8 -*-
"""NotebookLM 슬라이드 초해상도 업스케일 (SKILL Step 6.5).

NotebookLM PDF의 내장 래스터는 1376x768뿐이라 DPI 200 추출은 보간 확대에
불과하다. 이 스크립트는 PDF에서 네이티브 해상도로 다시 추출한 뒤
Real-ESRGAN(x4plus)으로 4배 초해상도 → LANCZOS 다운스케일(기본 2752x1536)을
거쳐 images/ 를 같은 파일명으로 교체한다 (index.html 무수정).

사용:
    python upscale_slides.py <덱폴더>            # <덱폴더>/*_slides.pdf 자동 탐지
    python upscale_slides.py <덱폴더> --pdf <경로> --out <폴더> --width 2752
    python upscale_slides.py <덱폴더> --check    # 도구·PDF 확인만 (처리 없음)

도구 준비는 자동: OS에 맞는 realesrgan-ncnn-vulkan 포터블을 공식 GitHub
릴리스에서 캐시 폴더로 1회 다운로드해 재사용한다.
  캐시 위치: $REALESRGAN_HOME > ~/.cache/realesrgan-ncnn-vulkan
요구: PyMuPDF, Pillow, Vulkan 지원 GPU(대부분의 내장 GPU 포함).
"""
import argparse
import glob
import os
import platform
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.request
import zipfile

sys.stdout.reconfigure(encoding="utf-8")

RELEASE_TAG = "v0.2.5.0"
RELEASE_BUILD = "realesrgan-ncnn-vulkan-20220424"
PLAT = {"Windows": "windows", "Darwin": "macos", "Linux": "ubuntu"}.get(platform.system())
EXE_NAME = "realesrgan-ncnn-vulkan.exe" if platform.system() == "Windows" else "realesrgan-ncnn-vulkan"
CACHE = os.environ.get("REALESRGAN_HOME") or os.path.join(
    os.path.expanduser("~"), ".cache", "realesrgan-ncnn-vulkan"
)


def find_exe() -> str | None:
    hits = glob.glob(os.path.join(CACHE, "**", EXE_NAME), recursive=True)
    return hits[0] if hits else None


def ensure_tool() -> str:
    exe = find_exe()
    if exe:
        return exe
    if not PLAT:
        sys.exit(f"지원하지 않는 OS: {platform.system()}")
    url = (
        f"https://github.com/xinntao/Real-ESRGAN/releases/download/"
        f"{RELEASE_TAG}/{RELEASE_BUILD}-{PLAT}.zip"
    )
    os.makedirs(CACHE, exist_ok=True)
    zip_path = os.path.join(CACHE, f"{RELEASE_BUILD}-{PLAT}.zip")
    print(f"[도구] Real-ESRGAN 포터블 다운로드: {url}")
    urllib.request.urlretrieve(url, zip_path)
    dest = os.path.join(CACHE, f"{RELEASE_BUILD}-{PLAT}")
    with zipfile.ZipFile(zip_path) as z:
        z.extractall(dest)
    exe = find_exe()
    if not exe:
        sys.exit("다운로드 후에도 실행 파일을 찾지 못했습니다.")
    if platform.system() != "Windows":
        os.chmod(exe, 0o755)
    print(f"[도구] 설치 완료: {exe}")
    return exe


def find_pdf(deck: str, arg_pdf: str | None) -> str:
    if arg_pdf:
        return arg_pdf
    cands = glob.glob(os.path.join(deck, "*_slides.pdf")) or glob.glob(
        os.path.join(deck, "*.pdf")
    )
    if len(cands) != 1:
        sys.exit(f"PDF를 특정할 수 없습니다({len(cands)}개) — --pdf 로 지정하세요: {cands}")
    return cands[0]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("deck", help="덱 폴더 (예: data/2026-1/정보/조건문)")
    ap.add_argument("--pdf", help="원본 PDF 경로 (기본: 덱폴더/*_slides.pdf)")
    ap.add_argument("--out", help="최종 출력 폴더 (기본: 덱폴더/images)")
    ap.add_argument("--width", type=int, default=2752, help="최종 가로 픽셀 (기본 2752 = 4x의 절반)")
    ap.add_argument("--check", action="store_true", help="도구·PDF 확인만 하고 종료")
    args = ap.parse_args()

    import fitz
    from PIL import Image

    deck = os.path.abspath(args.deck)
    pdf = find_pdf(deck, args.pdf)
    exe = ensure_tool()
    print(f"[확인] PDF: {pdf}")
    print(f"[확인] 업스케일러: {exe}")
    if args.check:
        return

    out_dir = args.out or os.path.join(deck, "images")
    native_dir = os.path.join(deck, "images_native")
    os.makedirs(out_dir, exist_ok=True)
    os.makedirs(native_dir, exist_ok=True)

    # 1) 네이티브 해상도 추출 (Matrix(1,1) = PDF 내장 래스터 크기 그대로)
    doc = fitz.open(pdf)
    for i, page in enumerate(doc):
        page.get_pixmap(matrix=fitz.Matrix(1, 1), alpha=False).save(
            os.path.join(native_dir, f"slide-{i + 1:02d}.png")
        )
    n = len(doc)
    w0, h0 = Image.open(os.path.join(native_dir, "slide-01.png")).size
    print(f"[1/3] 네이티브 추출 {n}장 ({w0}x{h0}) → {native_dir}")

    # 2) Real-ESRGAN 4배 (폴더 단위)
    t0 = time.time()
    with tempfile.TemporaryDirectory() as sr_dir:
        r = subprocess.run(
            [exe, "-i", native_dir, "-o", sr_dir, "-n", "realesrgan-x4plus"],
            capture_output=True,
            text=True,
        )
        if r.returncode != 0:
            sys.exit(f"Real-ESRGAN 실패 (Vulkan GPU 확인):\n{r.stderr[-800:]}")
        t_sr = time.time() - t0
        print(f"[2/3] 초해상도 4배 완료 ({t_sr:.0f}초, {t_sr / n:.1f}초/장)")

        # 3) LANCZOS 다운스케일 → 최종
        target = (args.width, int(args.width * h0 / w0))
        for f in sorted(os.listdir(sr_dir)):
            im = Image.open(os.path.join(sr_dir, f))
            im.resize(target, Image.LANCZOS).save(
                os.path.join(out_dir, f), optimize=True
            )

    finals = sorted(glob.glob(os.path.join(out_dir, "slide-*.png")))
    sizes = {Image.open(f).size for f in finals}
    total = sum(os.path.getsize(f) for f in finals) / 1e6
    assert sizes == {target}, f"해상도 불일치: {sizes}"
    print(f"[3/3] 최종 {len(finals)}장 {target[0]}x{target[1]} · 합계 {total:.1f}MB → {out_dir}")
    print("검증: 전/후 크롭 비교로 선명도·왜곡을 확인하세요 (SKILL Step 6.5).")


if __name__ == "__main__":
    main()
