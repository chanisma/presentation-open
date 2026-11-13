# Playwright Validation Report - Cycle 3

**Tested at**: 1920x1080 (Full HD)
**Date**: 2026-03-24
**Browser**: Chromium (Playwright)

## Executive Summary

- **Total images tested**: 41 (across 3 presentations)
- **Images loaded correctly**: 38
- **Broken/corrupted images**: 3
- **Layout overflow issues**: 3 slides
- **Missing planned images**: 4 slots (emoji fallback used)
- **Console errors**: 0 (excluding favicon 404)

### Overall Assessment
All three presentations are functional and navigable. The primary issues are: (1) corrupted downloaded files masquerading as JPEGs, (2) portrait-orientation images causing slide overflow, and (3) inconsistent image coverage across slides.

---

## Per-Presentation Results

### cycle3-1-world-heritage (Editorial Magazine Style)

**Images**: 13 files on disk, 10 used in slides (10 `<img>` tags + 2 background images)
**Cover background**: img-01-cover.jpg — **CORRUPTED** (HTML file, not JPEG)

| Slide | Image | Loads | Sized OK | Visible | Alt Text | Notes |
|-------|-------|:-----:|:--------:|:-------:|:--------:|-------|
| 1 (cover) | img-01-cover.jpg (bg) | ❌ | N/A | ❌ | N/A | **CORRUPTED**: File is HTML, not JPEG. Cover appears as plain white/light gray |
| 2 | img-02-unesco.jpg | ✅ | ✅ (527x277) | ✅ | ✅ "유네스코 세계유산" | Two-column layout, image fits well |
| 3 | img-03-machu-picchu.jpg | ✅ | ✅ (805x537) | ✅ | ✅ "마추픽추 전경" | Good quality 2000x1334 source |
| 4 | img-04-colosseum.jpg | ✅ | ✅ (805x537) | ✅ | ✅ "콜로세움" | Good display |
| 5 | img-05-angkor-wat.jpg | ✅ | ✅ (527x329) | ✅ | ✅ "앙코르 와트" | Good quality 2048x1280 source |
| 6 | img-06-great-wall.jpg | ✅ | ⚠️ (527x350) | ✅ | ✅ "만리장성" | Source only 512x512 — upscaled, slight quality loss |
| 7 | img-07-taj-mahal.jpg | ✅ | ❌ (805x803) | ✅ | ✅ "타지마할" | **OVERFLOW**: Nearly square image (1009x1007) causes content to overflow. Caption and note hidden below viewport |
| 8 | img-08a-bulguksa.jpg | ✅ | ✅ (495x120) | ✅ | ✅ "불국사" | Grid card, object-fit:cover, 6536x3676 source (13.9MB — very large!) |
| 8 | img-08b-hwaseong.jpg | ✅ | ✅ (495x120) | ✅ | ✅ "수원 화성" | Grid card |
| 8 | img-08c-seokguram.jpg | ✅ | ✅ (495x120) | ✅ | ✅ "석굴암" | Grid card, portrait source 1091x1488 |
| 8 | img-08d-haeinsa.jpg | ✅ | ✅ (495x120) | ✅ | ✅ "해인사 장경판전" | Grid card, 4484x3066 source (7.3MB — very large!) |
| 9 | img-09-conservation.jpg | ✅ | ✅ (527x350) | ✅ | ✅ "유산 보존 작업" | Two-column layout, source 560x373 |
| 10 (closing) | img-10-closing.jpg (bg) | ✅ | ✅ | ✅ | N/A | Background image renders well with overlay |

**Issues Summary**:
- Cover background image corrupted (HTML file downloaded instead of JPEG)
- Slide 7 Taj Mahal: square aspect ratio causes layout overflow
- img-08a-bulguksa.jpg is 13.9MB — excessive for a presentation
- img-08d-haeinsa.jpg is 7.3MB — excessive for a presentation

---

### cycle3-2-ai-careers (Glassmorphism Style)

**Images**: 11 files on disk, 10 used in slides
**Cover background**: img-01-cover.jpg — Works correctly

| Slide | Image | Loads | Sized OK | Visible | Alt Text | Notes |
|-------|-------|:-----:|:--------:|:-------:|:--------:|-------|
| 1 (cover) | img-01-cover.jpg (bg) | ✅ | ✅ | ✅ | N/A | Excellent cover — AI/cyberpunk theme, good contrast |
| 2 | (no image) | — | — | — | — | Text/emoji only slide (no image planned) |
| 3 | img-03-alphago.jpg | ✅ | ✅ (527x296) | ✅ | ✅ "알파고 vs 이세돌" | Two-column layout |
| 4 | img-04a-medical-ai.jpg | ✅ | ✅ (489x110) | ✅ | ✅ "AI 의료" | Grid card with object-fit:cover |
| 4 | (금융 — no image) | — | — | — | — | Emoji fallback 💰 used instead |
| 4 | (교육 — no image) | — | — | — | — | Emoji fallback 📚 used instead |
| 4 | img-04b-smart-factory.jpg | ✅ | ✅ (489x110) | ✅ | ✅ "스마트 팩토리" | Grid card |
| 5 | img-05-future-jobs.jpg | ✅ | ❌ (804x2199) | ✅ | ✅ "미래 직업 변화" | **CRITICAL OVERFLOW**: Portrait infographic (630x1724) displayed at 804x2199. English-only image doesn't match Korean context. Completely hides text below |
| 6 | (no image) | — | — | — | — | Emoji-based grid (🧠💡🤝📖), works well |
| 7 | img-07-prompt-eng.jpg | ✅ | ✅ (527x297) | ✅ | ✅ "프롬프트 엔지니어링" | Two-column layout |
| 8 | img-08a-data-scientist.jpg | ✅ | ✅ (489x110) | ✅ | ✅ "데이터 사이언티스트" | Grid card, 2560x1709 source |
| 8 | img-08b-robotics.jpg | ✅ | ✅ (489x110) | ✅ | ✅ "로봇 공학자" | Grid card, 2880x1980 source |
| 8 | img-08c-ai-ethics.jpg | ✅ | ✅ (489x110) | ✅ | ✅ "AI 윤리 전문가" | Grid card |
| 8 | img-08d-ml-engineer.jpg | ✅ | ✅ (489x110) | ✅ | ✅ "데이터 사이언티스트" | **FORMAT MISMATCH**: WebP file saved as .jpg — renders in Chrome but may fail in other browsers |
| 9 | img-09-ai-ethics.jpg | ✅ | ✅ (527x275) | ✅ | ✅ "AI 윤리" | Two-column layout |
| 10 (closing) | (no image) | — | — | — | — | No background image — text-only closing slide with emojis |

**Issues Summary**:
- Slide 5: Portrait infographic causes critical overflow + wrong language (English)
- img-08d-ml-engineer.jpg is actually WebP format (not JPEG)
- Slide 10 has no closing background image (unlike other presentations)
- Missing images for 금융 and 교육 in slide 4 (emoji fallbacks used)

---

### cycle3-3-korean-food (Soft Pink Card UI Style)

**Images**: 16 files on disk, 14 used in slides
**Cover background**: img-01-cover.jpg — Works excellently

| Slide | Image | Loads | Sized OK | Visible | Alt Text | Notes |
|-------|-------|:-----:|:--------:|:-------:|:--------:|-------|
| 1 (cover) | img-01-cover.jpg (bg) | ✅ | ✅ | ✅ | N/A | Beautiful Korean food spread, excellent cover |
| 2 | img-02-hansik.jpg | ✅ | ✅ (527x350) | ✅ | ✅ "한식 정식" | Two-column layout, source 700x489 |
| 3 | img-03-bibimbap.jpg | ✅ | ❌ (751x1051) | ✅ | ✅ "비빔밥" | **CRITICAL OVERFLOW**: Portrait image (1340x1876) displayed at 751x1051. Caption and note completely hidden |
| 4 | img-04-kimchi.jpg | ✅ | ✅ (527x350) | ✅ | ✅ "다양한 김치" | Two-column layout |
| 5 | img-05a-japchae.jpg | ✅ | ✅ (496x110) | ✅ | ✅ "잡채" | Grid card, portrait source 900x1125 |
| 5 | img-05b-doenjang.jpg | ✅ | ✅ (496x110) | ✅ | ✅ "된장찌개" | Grid card, portrait source 1367x2048 |
| 5 | img-05c-namul.jpg | ✅ | ✅ (496x110) | ✅ | ✅ "나물 무침" | Grid card, portrait source 650x974 |
| 5 | img-05d-fish.jpg | ❌ | ❌ (0x0) | ❌ | ✅ "생선구이" | **BROKEN**: File is HTML document, not JPEG. Falls back to text-only card |
| 6 | img-06-comparison.jpg | ✅ | ✅ (762x508) | ✅ | ✅ "한식 vs 패스트푸드 비교" | Full-width image, good display |
| 7 | img-07-fermented.jpg | ✅ | ✅ (527x350) | ✅ | ✅ "한국 발효 식품" | Two-column layout |
| 8 | img-08a-jumeokbap.jpg | ✅ | ✅ (496x110) | ✅ | ✅ "주먹밥" | Grid card, portrait source 900x1200 |
| 8 | img-08b-hobak-juk.jpg | ✅ | ✅ (496x110) | ✅ | ✅ "호박죽" | Grid card, portrait source 650x975 |
| 8 | img-08c-tofu-jeon.jpg | ✅ | ✅ (496x110) | ✅ | ✅ "두부전" | Grid card, portrait 1456x2038 (990KB) |
| 8 | img-08d-miyeokguk.jpg | ✅ | ✅ (496x110) | ✅ | ✅ "미역국" | Grid card, landscape 1200x900 |
| 9 | img-09-meal-plan.jpg | ✅ | ✅ (527x350) | ✅ | ✅ "한식 식단 계획" | Two-column layout |
| 10 (closing) | img-10-closing.jpg (bg) | ✅ | ✅ | ✅ | N/A | Beautiful family dining image, pink overlay |

**Issues Summary**:
- Slide 3 bibimbap: Portrait image causes critical overflow
- Slide 5 fish: Corrupted file (HTML saved as JPEG) — completely broken
- Many food images are portrait orientation (recipe/Instagram style)

---

## Common Issues Found

### 1. Corrupted Image Downloads (Critical)
Three files were downloaded incorrectly:
| File | Expected | Actual Content | Impact |
|------|----------|---------------|--------|
| cycle3-1/img-01-cover.jpg | JPEG image | HTML document (error/redirect page) | Cover slide has no background |
| cycle3-2/img-08d-ml-engineer.jpg | JPEG image | WebP image (wrong format) | Renders in Chrome, may break elsewhere |
| cycle3-3/img-05d-fish.jpg | JPEG image | HTML document (error/redirect page) | Broken image, empty card |

**Root cause**: The image download process doesn't validate that the response is actually an image file. Servers may return HTML error pages, redirect pages, or images in different formats (WebP instead of JPEG).

### 2. Portrait/Square Image Overflow (Critical)
Three slides have images that cause severe content overflow:
| Presentation | Slide | Image | Aspect Ratio | Display Size | Issue |
|-------------|-------|-------|-------------|-------------|-------|
| cycle3-1 | 7 (Taj Mahal) | 1009x1007 | ~1:1 (square) | 805x803 | Pushes caption/note below viewport |
| cycle3-2 | 5 (Future Jobs) | 630x1724 | 1:2.7 (tall portrait) | 804x2199 | Infographic extends 2x beyond viewport |
| cycle3-3 | 3 (Bibimbap) | 1340x1876 | 1:1.4 (portrait) | 751x1051 | Caption and note hidden |

**Root cause**: The HTML template has no `max-height` constraint on images in image-focus or full-image components. Portrait images expand to full natural height, overflowing the slide container.

### 3. Oversized Image Files (Warning)
Several images have unnecessarily large file sizes:
| File | Size | Resolution | Notes |
|------|------|-----------|-------|
| cycle3-1/img-08a-bulguksa.jpg | 13.9 MB | 6536x3676 | Far too large for a 495x120 display |
| cycle3-1/img-08d-haeinsa.jpg | 7.3 MB | 4484x3066 | Far too large for a 495x120 display |
| cycle3-1/img-05-angkor-wat.jpg | 1.8 MB | 2048x1280 | Acceptable but could be optimized |

**Impact**: Slow page loading, excessive bandwidth/storage usage. A 13.9MB image displayed at 495x120px is ~99.9% wasted data.

### 4. Missing Planned Images (Minor)
Some grid slots lack images and fall back to emoji:
- cycle3-2 slide 4: 금융 (💰), 교육 (📚) — no images downloaded
- cycle3-2 slide 10: No closing background image
- cycle3-2 slide 2: No image (text-only by design)

### 5. Wrong Language/Context Images (Minor)
- cycle3-2 slide 5 (img-05-future-jobs.jpg): English infographic in a Korean presentation

---

## Image Search/Download Workflow Issues

1. **No file format validation**: Downloads save whatever the server returns (HTML error pages, WebP files) with a .jpg extension without verifying the content is actually JPEG
2. **No aspect ratio filtering**: The search doesn't filter by image orientation/aspect ratio, leading to portrait images that break landscape slide layouts
3. **No file size limits**: Images up to 13.9MB are downloaded when 200-500KB would suffice for presentation use
4. **No image resolution optimization**: Downloaded images are used at their original resolution (up to 6536x3676) when they display at 500x120
5. **Language mismatch**: Search results may return English-language infographics for Korean presentation topics
6. **No download verification**: After downloading, there's no check that the file is a valid image before using it in the HTML

---

## Suggestions for SKILL.md Improvement

1. **Add `max-height` constraint to image components**: All `<img>` and image-focus containers should have `max-height: 60vh` or similar to prevent portrait images from overflowing slides
2. **Add `object-fit: cover` with `aspect-ratio`**: For image-focus components, enforce a landscape aspect ratio (e.g., `aspect-ratio: 16/9`) with `object-fit: cover` to crop portrait images
3. **Specify image orientation requirements**: In the image search instructions, explicitly require landscape-oriented images (width > height) for standard slides
4. **Add image validation step**: After image download, validate that:
   - File starts with JPEG magic bytes (FF D8 FF)
   - File size is between 10KB and 2MB
   - Image dimensions are reasonable (width >= 600px, aspect ratio between 4:3 and 21:9)
5. **Add fallback handling in CSS**: For broken images, add CSS-based fallback with placeholder color/gradient:
   ```css
   img { background: linear-gradient(135deg, #f5f5f5, #e0e0e0); min-height: 200px; }
   ```
6. **Limit grid card image heights**: Grid/card layouts should use fixed aspect ratios instead of the current 120px height

---

## Suggestions for web-image-search.md Improvement

1. **Add content-type validation**: After downloading, check HTTP Content-Type header is `image/jpeg` or `image/png`; if response is `text/html`, retry with another image
2. **Add magic bytes validation**: Check first bytes of downloaded file: JPEG (FF D8 FF), PNG (89 50 4E 47), WebP (52 49 46 46)
3. **Add aspect ratio parameter to Google search**: Use `&imgtype=photo&tbs=iar:w` to filter for landscape/wide images
4. **Add file size limits**: Skip images over 2MB; resize/compress if larger
5. **Add retry logic**: If a downloaded file is invalid, try the next search result
6. **Convert WebP to JPEG**: If the downloaded file is WebP, convert to JPEG before saving
7. **Add Korean search terms priority**: For Korean presentations, prefer Korean search terms and Korean image sources to avoid language mismatch
8. **Add image dimension validation**: After download, verify image dimensions are at least 800x400 for standard images, and reject portrait-oriented images (height > width * 1.2) for non-grid layouts

---

## Screenshots Reference

| File | Description |
|------|-------------|
| screenshot-cycle3-1-1080p-cover.png | Pres 1 cover — barely visible background (corrupted image) |
| screenshot-cycle3-1-1080p-slide7-taj.png | Pres 1 slide 7 — square Taj Mahal image overflow |
| screenshot-cycle3-1-1080p-slide8-korean.png | Pres 1 slide 8 — Korean heritage grid (looks good) |
| screenshot-cycle3-2-1080p-cover.png | Pres 2 cover — excellent AI/cyberpunk background |
| screenshot-cycle3-2-1080p-slide5.png | Pres 2 slide 5 — English infographic overflow |
| screenshot-cycle3-2-1080p-slide4.png | Pres 2 slide 4 — mixed image/emoji grid |
| screenshot-cycle3-3-1080p-cover.png | Pres 3 cover — beautiful Korean food spread |
| screenshot-cycle3-3-1080p-slide3-bibimbap.png | Pres 3 slide 3 — portrait bibimbap overflow |
| screenshot-cycle3-3-1080p-slide5-broken.png | Pres 3 slide 5 — broken fish image (empty card) |
| screenshot-cycle3-3-1080p-slide10.png | Pres 3 slide 10 — excellent family dining closing |
