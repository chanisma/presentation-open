#!/usr/bin/env python3
"""crop_sheet.py — 스프라이트 시트(균일 단색 배경)를 격자로 잘라 배경 투명 PNG로.

newVideoGen `wb-crop-sheet.py`의 격자 모드를 이 저장소 환경(PIL+numpy만, scipy 없음)으로
이식한 것. 시트 1장에 2x3 / 3x3으로 그려진 캐릭터 포즈·소품을 슬러그별 개별 PNG로 만든다.

사용:
  python crop_sheet.py <sheet.png> <outdir> <slug1,slug2,...> --grid 3x2
      [--tol 30] [--pad 8] [--min-side 700] [--key "#c8c8c8"] [--no-alpha] [--dry-run]

  --grid CxR : 열x행 (슬러그 순서 = 좌상 → 우하, 행 우선)
  --tol      : 배경 판정 허용 오차(0~255, 기본 30). 잘린 부위가 남으면 낮추고,
               배경이 남으면 높인다
  --pad      : 크롭 여백(px)
  --key      : 배경색 직접 지정 (기본: 각 셀 테두리에서 자동 추정)
  --min-side : 크롭 긴 변 경고 임계 (기본 700 — 확대해 쓰면 뭉개진다)

산출: <outdir>/<slug>.png + <outdir>/_crop-meta.json (register_images.mjs가 읽는다)
"""
import json
import os
import sys
from datetime import date

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

# Windows 콘솔(cp949)에서 한글·기호 출력이 죽지 않게
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass


def parse_args(argv):
    if len(argv) < 4:
        print(__doc__, file=sys.stderr)
        raise SystemExit(1)
    a = {
        "sheet": argv[1],
        "outdir": argv[2],
        "slugs": [s.strip() for s in argv[3].split(",") if s.strip()],
        "grid": None,
        "tol": 30,
        "pad": 8,
        "min_side": 700,
        "key": None,
        "alpha": True,
        "dry": False,
    }
    i = 4
    while i < len(argv):
        f = argv[i]
        if f == "--grid":
            i += 1
            a["grid"] = tuple(int(v) for v in argv[i].lower().split("x"))
        elif f == "--tol":
            i += 1
            a["tol"] = int(argv[i])
        elif f == "--pad":
            i += 1
            a["pad"] = int(argv[i])
        elif f == "--min-side":
            i += 1
            a["min_side"] = int(argv[i])
        elif f == "--key":
            i += 1
            h = argv[i].lstrip("#")
            a["key"] = tuple(int(h[j : j + 2], 16) for j in (0, 2, 4))
        elif f == "--no-alpha":
            a["alpha"] = False
        elif f == "--dry-run":
            a["dry"] = True
        i += 1
    if not a["grid"]:
        print("error: --grid CxR 필수 (예: --grid 3x2)", file=sys.stderr)
        raise SystemExit(1)
    return a


def cell_key_color(arr, key):
    """셀 테두리 픽셀의 중앙값 = 배경색 추정."""
    if key is not None:
        return np.array(key, dtype=np.int16)
    h, w = arr.shape[:2]
    b = max(2, min(h, w) // 40)
    border = np.concatenate(
        [
            arr[:b, :, :3].reshape(-1, 3),
            arr[-b:, :, :3].reshape(-1, 3),
            arr[:, :b, :3].reshape(-1, 3),
            arr[:, -b:, :3].reshape(-1, 3),
        ]
    )
    return np.median(border, axis=0).astype(np.int16)


def main() -> int:
    a = parse_args(sys.argv)
    cols, rows = a["grid"]
    sheet = Image.open(a["sheet"]).convert("RGBA")
    W, H = sheet.size
    cw, ch = W // cols, H // rows
    os.makedirs(a["outdir"], exist_ok=True)

    if len(a["slugs"]) != cols * rows:
        print(
            f"  ⚠ 슬러그 {len(a['slugs'])}개 ≠ 격자 칸 {cols * rows}개 — 앞에서부터 매칭한다"
        )

    records = []
    for idx, slug in enumerate(a["slugs"]):
        if idx >= cols * rows:
            break
        r, c = divmod(idx, cols)
        cell = sheet.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))
        arr = np.asarray(cell).astype(np.int16)
        key = cell_key_color(arr, a["key"])

        # 배경과의 채널 최대 거리 → 배경 후보 마스크
        dist = np.abs(arr[:, :, :3] - key).max(axis=2)
        bg_like = ((dist <= a["tol"]).astype(np.uint8) * 255)

        # 가장자리에서 flood-fill 한 영역만 "바깥 배경"이다.
        # 거리만으로 알파를 만들면 배경색과 비슷한 **내부**(크림색 몸통 등)까지
        # 반투명해져 배경이 비쳐 보인다 — 2026-08-18 검수에서 실제로 터진 사고.
        # .copy() 필수 — fromarray 결과는 읽기 전용 버퍼라 floodfill 쓰기가 먹지 않는다
        fill = Image.fromarray(bg_like).copy()
        h_, w_ = bg_like.shape
        seeds = [(0, 0), (w_ - 1, 0), (0, h_ - 1), (w_ - 1, h_ - 1),
                 (w_ // 2, 0), (w_ // 2, h_ - 1), (0, h_ // 2), (w_ - 1, h_ // 2)]
        for sx, sy in seeds:
            if fill.getpixel((sx, sy)) == 255:
                ImageDraw.floodfill(fill, (sx, sy), 128)
        outside = np.asarray(fill) == 128
        fg = (~outside).astype(np.uint8) * 255

        # 스펙클 제거 (opening) — scipy 없이 PIL 필터로
        m = Image.fromarray(fg).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
        solid = np.asarray(m) > 127
        if not solid.any():
            print(f"  ✗ {slug}: 전경을 못 찾았다 (tol {a['tol']} 조정)")
            continue

        ys, xs = np.where(solid)
        y0, y1 = max(0, ys.min() - a["pad"]), min(ch, ys.max() + 1 + a["pad"])
        x0, x1 = max(0, xs.min() - a["pad"]), min(cw, xs.max() + 1 + a["pad"])

        out = np.asarray(cell).copy()
        if a["alpha"]:
            # 내부는 완전 불투명, 경계만 1px 안으로 당겨 부드럽게 (배경색 후광 방지)
            edge = Image.fromarray((solid.astype(np.uint8) * 255))
            edge = edge.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
            out[:, :, 3] = np.asarray(edge)
        crop = Image.fromarray(out[y0:y1, x0:x1])

        w, h = crop.size
        long_side = max(w, h)
        flag = "" if long_side >= a["min_side"] else f"  ⚠ 긴 변 {long_side}px < {a['min_side']} (확대 시 뭉개짐)"
        print(f"  · {slug}.png  {w}x{h}{flag}")
        if not a["dry"]:
            crop.save(os.path.join(a["outdir"], f"{slug}.png"))
        records.append((slug, [int(x0 + c * cw), int(y0 + r * ch), int(x1 - x0), int(y1 - y0)], w, h))

    if records and not a["dry"]:
        meta_path = os.path.join(a["outdir"], "_crop-meta.json")
        meta = {"version": 1, "entries": {}}
        if os.path.exists(meta_path):
            try:
                meta = json.load(open(meta_path, encoding="utf-8"))
            except Exception:
                pass
        for slug, bbox, w, h in records:
            meta["entries"][slug] = {
                "sheet": os.path.basename(a["sheet"]),
                "bbox": bbox,
                "w": w,
                "h": h,
                "cropped_at": date.today().isoformat(),
            }
        json.dump(meta, open(meta_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        print(f"  ⓘ _crop-meta.json — {len(records)}건 기록")
    print(f"✅ 크롭 완료 — {a['outdir']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
