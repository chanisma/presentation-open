# -*- coding: utf-8 -*-
"""슬라이드 9~11 HTML 렌더링 검증용 스크린샷 (검증 후 삭제 가능)"""
from playwright.sync_api import sync_playwright
from pathlib import Path

BASE = Path(__file__).parent
URL = (BASE / "index.html").as_uri()

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1600, "height": 900})
    page.goto(URL)
    page.wait_for_timeout(1500)  # 폰트 로딩 대기
    for idx in (8, 9, 10):  # 0-based → 슬라이드 9, 10, 11
        page.evaluate(f"show({idx})")
        page.wait_for_timeout(400)
        out = BASE / f"_verify_slide-{idx + 1:02d}.png"
        page.screenshot(path=str(out))
        print("saved:", out)
    browser.close()
