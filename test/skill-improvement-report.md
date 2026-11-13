# Skill Improvement Report - Presentation Builder

**Date**: 2026-03-24
**Based on**: Playwright Validation Report (Cycle 3) + Team Lead Direction Change
**Files modified**: `references/web-image-search.md`

---

## Problems Identified (from validation)

### Critical Issues

| # | Issue | Root Cause | Affected Slides |
|---|-------|-----------|----------------|
| 1 | **HTML files saved as JPEG** — 2 images were HTML error pages | No post-download file format validation | cycle3-1 cover, cycle3-3 slide 5 |
| 2 | **Portrait images overflow slides** — 3 slides had content pushed below viewport | No aspect ratio filtering; no max-height CSS | cycle3-1 slide 7, cycle3-2 slide 5, cycle3-3 slide 3 |
| 3 | **WebP saved as .jpg** — wrong file extension | No magic bytes validation | cycle3-2 slide 8 |
| 4 | **Oversized files** — 13.9MB and 7.3MB images at 495x120px | No file size limit enforcement | cycle3-1 slide 8 |
| 5 | **25MB+ per presentation folder** | Download-based approach wastes storage/bandwidth | All presentations |

### Minor Issues

| # | Issue | Root Cause |
|---|-------|-----------|
| 6 | English infographic in Korean presentation | No language-context filtering |
| 7 | Missing images with emoji fallback | Search/download failures without retry |

---

## Direction Change: URL-Link Mode

**Team lead decision**: Switch from downloading images to embedding original source URLs directly in HTML.

**Rationale**:
- Project deploys on free Netlify (100GB bandwidth/month, storage matters)
- Download step causes most issues (corrupted files, wrong format, oversized)
- URL linking eliminates issues #1, #3, #4, and #5 entirely

---

## Changes Made to `references/web-image-search.md`

### 1. NEW: Dual Mode System (url-link / download)

**Before**: Single mode — always download images locally.

**After**: Two modes with `url-link` as default:
- `url-link` (default): Extract original source URL, embed directly in HTML `<img src="https://...">`
- `download`: Legacy mode for offline/USB use cases only

### 2. NEW: Original Source URL Extraction (Step 3 rewritten)

**Before**: Simple `img[data-noaft]` src extraction (often returns Google cached URLs).

**After**: Enhanced JS that:
- Extracts `img[data-noaft]` src with Google cache detection (`isGoogleCached` flag)
- Extracts original site visit link as backup
- Explicitly warns against Google cached URLs (`encrypted-tbn*.gstatic.com`)
- Provides fallback: navigate to source site to get real URL

### 3. NEW: URL Validation Step (Step 4 replaced)

**Before**: Step 4 was `curl` download + Step 4.5 was file validation.

**After**: Step 4 is URL validation:
- Check URL stability tier (Wikimedia > Wikipedia > CDN > others)
- Reject Google cached URLs
- Verify HTTPS
- Step 4-B preserved as optional download mode for offline use

### 4. NEW: URL Stability Guide Section

**Before**: No guidance on URL reliability.

**After**: Comprehensive table ranking sources by stability:
- Wikimedia Commons: permanent URLs, CC licensed (priority 1)
- Wikipedia: stable infrastructure (priority 2)
- Government/edu sites: long-lived (priority 3)
- CDN services: moderate stability (priority 4)
- News/blogs: unstable, may expire (priority 6)
- Google cache: **banned** — breaks on session expiry

### 5. Strengthened HTML Components with Fallback Attributes

**Before**:
```html
<img src="img-04-shakespeare.jpg" alt="..." loading="lazy"
     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
```

**After**:
```html
<img src="https://upload.wikimedia.org/..." alt="..." loading="lazy"
     referrerpolicy="no-referrer"
     crossorigin="anonymous"
     onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';">
```

Key additions:
- `referrerpolicy="no-referrer"` — bypasses hotlinking restrictions
- `crossorigin="anonymous"` — enables CORS for external images
- `this.onerror=null` — prevents infinite error loops
- External URLs instead of local file references

### 6. Landscape Image Filtering (preserved from initial pass)

- Search URL includes `&tbs=iar:w` for wide image filtering
- Step 2 selection criteria require landscape orientation
- Korean language preference for Korean presentations

### 7. CSS Overflow Protection (preserved from initial pass)

```css
.slide img { max-width: 100%; max-height: 70vh; object-fit: contain; }
.image-container img { max-height: 400px; object-fit: contain; }
.col-image { aspect-ratio: 16/10; object-fit: cover; }
```

### 8. Search Keyword Enhancement

- Added `site:wikimedia.org` recommendation for stable URLs
- Added keyword example: `"taj mahal landscape photo site:wikimedia.org"`

---

## Impact Summary

| Metric | Before | After (Expected) |
|--------|--------|-------------------|
| Presentation folder size | 25MB+ (downloaded images) | ~50KB (HTML only, no images) |
| Corrupted image downloads | 7.3% (3/41) | 0% (no downloads in default mode) |
| Portrait overflow issues | 7.3% (3/41) | ~0% (landscape filter + max-height CSS) |
| Oversized files (>2MB) | 7.3% (3/41) | 0% (no local files) |
| Wrong format (.webp as .jpg) | 2.4% (1/41) | 0% (no format conversion needed) |
| Image URL stability | N/A (local files) | High (Wikimedia priority + onerror fallback) |

---

## Remaining Issues for Next Cycle

1. **Cover background-image fallback**: CSS `background-image: url(...)` doesn't support `onerror`. Added `background-color` fallback but broken cover URLs will show plain color instead of image.

2. **CORS restrictions**: Some image hosts may block `crossorigin="anonymous"`. If this causes issues, may need to remove `crossorigin` and rely solely on `referrerpolicy`.

3. **URL permanence monitoring**: No automated way to check if embedded URLs are still valid after initial creation. Consider a validation script for existing presentations.

4. **Wikimedia URL format complexity**: Wikimedia Commons URLs can be very long and include hash paths. Need to verify they work correctly when embedded in HTML attributes.

5. **Download mode validation**: The download mode (Step 4-B) still has the file validation script, but it hasn't been re-tested after the refactor. Should validate in next cycle.

6. **Grid card image heights**: Cards display at 120px with `object-fit: cover`. Added `.card-img` class but existing presentations may not use it yet.
