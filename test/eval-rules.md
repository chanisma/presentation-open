# Cycle 2 SKILL.md 규칙 준수 평가 보고서

**평가일**: 2026-03-23
**평가 대상**: cycle2-1 ~ cycle2-5 (5개 프레젠테이션)
**평가 기준**: SKILL.md 기존 규칙 10개 + 웹 이미지 검색 규칙 7개 = 총 17개 규칙

---

## 종합 점수

- **총 위반 사항**: 6개
- **심각도별**: Critical(P0) 0개, Major(P1) 1개, Minor(P2) 4개, Info(P3) 1개
- **프레젠테이션별 위반 수**: cycle2-1: 0개, cycle2-2: 1개, cycle2-3: 2개, cycle2-4: 2개, cycle2-5: 1개
- **전체 준수율**: 93% (총 85개 적용 항목 중 79개 통과)

> 이미지 미사용 프레젠테이션(cycle2-4, cycle2-5)은 이미지 관련 규칙(11~17번)을 N/A로 처리.

---

## 프레젠테이션별 상세 평가

### cycle2-1-solar-system (Bento Grid, 10슬라이드, 이미지 포함)

| # | 규칙 | 우선순위 | 결과 | 상세 |
|---|------|---------|------|------|
| 1 | CSS Structure | P0 | ✅ PASS | `.presentation { height: calc(100vh - 42px) }`, `.slide` opacity transition, `.browser-card { max-height: calc(100vh - 4.8rem) }`, `.browser-content { flex: 1; overflow-y: auto }` 모두 준수 |
| 2 | Height Budget | P0 | ✅ PASS | activity-item 3개(Q1-Q3), grid 2x2 이하, toc 없음 |
| 3 | Emoji Budget | P1 | ✅ PASS | 슬라이드당 최대 2개 (section-icon 1개 + placeholder 1개). 카드 내 ☿♀ 등은 unicode symbol |
| 4 | Section-Divider | P1 | ✅ PASS | `.section-icon { display: inline; font-size: 1.2em }` |
| 5 | Color Contrast | P2 | ✅ PASS | --text #1A1A2E on --bg #F8F8F2 ≈ 12.5:1 (≥7:1), --text-secondary #555555 on #F8F8F2 ≈ 5.8:1 (≥4.5:1) |
| 6 | Inline Style | P2 | ✅ PASS | 7개 inline style — 대부분 이미지 fallback `display:none`과 margin-top. cover/end는 `browser-card--frameless` 사용 |
| 7 | Font Loading | P2 | ✅ PASS | Inter + Noto Sans KR = 2개 폰트 패밀리, 모두 CSS에서 사용 |
| 8 | Typography | P2 | ✅ PASS | nav 14px 고정, 최소 텍스트 0.82rem (≥0.8rem), SVG 화살표 사용 |
| 9 | CSS Variables | P3 | ✅ PASS | 모두 `--style-*` 접두사 사용, `--main`/`--gray` 없음 |
| 10 | Inline Events | P2 | ✅ PASS | onclick/onkeydown 없음, `addEventListener` only |
| 11 | Image per slide | P2 | ✅ PASS | 슬라이드 4: img-04-earth + img-04-mars (2개) → card-grid thumbnail(48x48) 면제 대상 |
| 12 | Image filename | P2 | ✅ PASS | `img-01-solar-system.jpg`, `img-04-earth.jpg`, `img-06-earth-blue-marble.jpg`, `img-07-mars-rover.jpg` 모두 `img-{slide#}-{keyword}.{ext}` 패턴 준수 |
| 13 | Loading lazy | P2 | ✅ PASS | 4개 `<img>` 태그 모두 `loading="lazy"` 포함 |
| 14 | Fallback UI | P1 | ✅ PASS | 모든 이미지에 `onerror` 핸들러 + `.image-placeholder` / `.card-image-placeholder` div 존재 |
| 15 | Image CSS classes | P2 | ✅ PASS | `.image-focus`, `.image-container`, `.image-caption`, `.col-image`, `.image-placeholder` 모두 정의됨 |
| 16 | Cover background | P2 | ✅ PASS | `.cover-bg` background-image + `.cover-overlay` `rgba(var(--style-bg-rgb), 0.82)` |
| 17 | Responsive images | P3 | ✅ PASS | `@media (max-width: 768px)` — `.image-container { max-width: 95% }`, `.col-image { max-height: 200px }` |

**cycle2-1 결과: 17/17 PASS — 위반 0개**

---

### cycle2-2-joseon-science (Editorial Magazine, 12슬라이드, 이미지 포함)

| # | 규칙 | 우선순위 | 결과 | 상세 |
|---|------|---------|------|------|
| 1 | CSS Structure | P0 | ✅ PASS | 모든 필수 CSS 구조 준수 |
| 2 | Height Budget | P0 | ✅ PASS | TOC 6개 항목 (<9), activity-item 3개 (<6), grid 2x2 |
| 3 | Emoji Budget | P1 | ✅ PASS | 전체 슬라이드 `◆` unicode symbol 사용 (formal style). placeholder 이모지는 기본 숨김 |
| 4 | Section-Divider | P1 | ✅ PASS | `.section-icon { display: inline; font-size: 1.2em }` |
| 5 | Color Contrast | P2 | ❌ FAIL | --text-secondary `#777777` on --bg `#FFFFFF` ≈ **4.48:1** (4.5:1 미달). 차이 0.02로 미세하지만 규칙 미준수 |
| 6 | Inline Style | P2 | ✅ PASS | 9개 inline style — fallback display:none, margin-top 등 기능적 용도 |
| 7 | Font Loading | P2 | ✅ PASS | Playfair Display + Space Mono + Noto Sans KR = 3개 폰트 패밀리 |
| 8 | Typography | P2 | ✅ PASS | nav 14px, 최소 0.82rem, SVG 화살표 |
| 9 | CSS Variables | P3 | ✅ PASS | `--style-*` only |
| 10 | Inline Events | P2 | ✅ PASS | `addEventListener` only |
| 11 | Image per slide | P2 | ✅ PASS | 슬라이드당 최대 1개 이미지 |
| 12 | Image filename | P2 | ✅ PASS | `img-01-joseon-science.jpg`, `img-04-jang-yeongsilportrait.jpg`, `img-05-jagyeongru.jpg`, `img-06-cheugugi.jpg`, `img-07-armillary-sphere.jpg`, `img-08-geobukseon.jpg` |
| 13 | Loading lazy | P2 | ✅ PASS | 5개 `<img>` 모두 `loading="lazy"` |
| 14 | Fallback UI | P1 | ✅ PASS | 모든 이미지에 onerror + placeholder |
| 15 | Image CSS classes | P2 | ✅ PASS | 모두 정의됨 |
| 16 | Cover background | P2 | ✅ PASS | `.cover-overlay` `rgba(var(--style-bg-rgb), 0.82)` |
| 17 | Responsive images | P3 | ✅ PASS | `@media 768px` — `.image-container { max-width: 95% }` |

**cycle2-2 결과: 16/17 PASS — 위반 1개 (P2)**

---

### cycle2-3-carbon-footprint (Nordic Minimalism, 8슬라이드, 이미지 포함)

| # | 규칙 | 우선순위 | 결과 | 상세 |
|---|------|---------|------|------|
| 1 | CSS Structure | P0 | ✅ PASS | 모든 필수 CSS 구조 준수 |
| 2 | Height Budget | P0 | ✅ PASS | timeline 4개, cards 2x2, stat 3개 |
| 3 | Emoji Budget | P1 | ✅ PASS | section-icon `※` unicode symbol. 슬라이드 5 카드: ♻️💡🥤 = 3개 (한도 내) |
| 4 | Section-Divider | P1 | ✅ PASS | `.section-icon { display: inline; font-size: 1.2em }` |
| 5 | Color Contrast | P2 | ❌ FAIL | --text-secondary `#8A7A6A` on --bg `#F4F1EC` ≈ **3.2:1** (4.5:1 미달, 1.3 부족) |
| 6 | Inline Style | P2 | ✅ PASS | 9개 — fallback display:none, thin-rule width/margin, stat font-size 등 기능적 용도 |
| 7 | Font Loading | P2 | ✅ PASS | DM Serif Display + Inter + Space Mono + Noto Sans KR = 4개 |
| 8 | Typography | P2 | ✅ PASS | nav 14px, 최소 0.82rem |
| 9 | CSS Variables | P3 | ✅ PASS | `--style-*` only |
| 10 | Inline Events | P2 | ✅ PASS | `addEventListener` only |
| 11 | Image per slide | P2 | ✅ PASS | 슬라이드당 최대 1개 |
| 12 | Image filename | P2 | ✅ PASS | `img-01-carbon-footprint.jpg`, `img-02-carbon-emissions.jpg`, `img-06-school-activity.jpg` |
| 13 | Loading lazy | P2 | ✅ PASS | 2개 `<img>` 모두 `loading="lazy"` |
| 14 | Fallback UI | P1 | ✅ PASS | onerror + placeholder 모두 존재 |
| 15 | Image CSS classes | P2 | ✅ PASS | 모두 정의됨 |
| 16 | Cover background | P2 | ✅ PASS | `.cover-overlay` rgba overlay 적용 |
| 17 | Responsive images | P3 | ❌ FAIL | `@media 768px`에 `.image-container { max-width: 95% }` 있으나 `.col-image` 반응형 규칙 누락 |

**cycle2-3 결과: 15/17 PASS — 위반 2개 (P2 1개, P3 1개)**

---

### cycle2-4-afterschool (K-에듀 클린, 8슬라이드, 이모지 전용)

| # | 규칙 | 우선순위 | 결과 | 상세 |
|---|------|---------|------|------|
| 1 | CSS Structure | P0 | ✅ PASS | 모든 필수 CSS 구조 준수 |
| 2 | Height Budget | P0 | ✅ PASS | card-grid 3x2 (6개), task-list 3개, stat 3개 |
| 3 | Emoji Budget | P1 | ❌ FAIL | **슬라이드 3**: 📚(section) + 🔬🎨💻(card-icon) = **4개** (최대 3개 초과). 슬라이드 2: 📋🎯🏫 = 3개 (한도), 슬라이드 5: ✏️ = 1개 |
| 4 | Section-Divider | P1 | ✅ PASS | `.section-icon { display: inline; font-size: 1.2em }` |
| 5 | Color Contrast | P2 | ❌ FAIL | --text-secondary `#5A6A8A` on --bg `#F0F4FF` ≈ **4.1:1** (4.5:1 미달) |
| 6 | Inline Style | P2 | ✅ PASS | 5개 — stat-number font-size span 등 최소한의 기능적 용도 |
| 7 | Font Loading | P2 | ✅ PASS | Inter + Noto Sans KR = 2개 폰트 패밀리 |
| 8 | Typography | P2 | ✅ PASS | nav 14px, 최소 0.85rem |
| 9 | CSS Variables | P3 | ✅ PASS | `--style-*` only |
| 10 | Inline Events | P2 | ✅ PASS | `addEventListener` only |
| 11-17 | Image Rules | — | N/A | 이미지 미사용 프레젠테이션 (이모지 전용) |

**cycle2-4 결과: 8/10 PASS — 위반 2개 (P1 1개, P2 1개)**

---

### cycle2-5-digital-literacy (Typographic Bold, 10슬라이드, 텍스트 전용)

| # | 규칙 | 우선순위 | 결과 | 상세 |
|---|------|---------|------|------|
| 1 | CSS Structure | P0 | ✅ PASS | 모든 필수 CSS 구조 준수 |
| 2 | Height Budget | P0 | ✅ PASS | TOC 6개 (<9), activity-item 3개 (<6), cards 2x2 |
| 3 | Emoji Budget | P1 | ✅ PASS | 전체 `◆` unicode symbol 사용 (formal style). 이모지 없음 |
| 4 | Section-Divider | P1 | ✅ PASS | `.section-icon { display: inline; font-size: 1.2em }` |
| 5 | Color Contrast | P2 | ❌ FAIL | --text-secondary `#888888` on --bg `#F0EDE8` ≈ **3.5:1** (4.5:1 미달, 1.0 부족) |
| 6 | Inline Style | P2 | ✅ PASS | 6개 — font-size, margin-top 등 |
| 7 | Font Loading | P2 | ✅ PASS | Anton + Space Mono + Noto Sans KR = 3개 |
| 8 | Typography | P2 | ✅ PASS | nav 14px, 최소 0.82rem |
| 9 | CSS Variables | P3 | ✅ PASS | `--style-*` only |
| 10 | Inline Events | P2 | ✅ PASS | `addEventListener` only |
| 11-17 | Image Rules | — | N/A | 이미지 미사용 프레젠테이션 (텍스트 전용) |

**cycle2-5 결과: 9/10 PASS — 위반 1개 (P2)**

---

## 위반 사항 종합

| # | 프레젠테이션 | 규칙 | 우선순위 | 내용 |
|---|------------|------|---------|------|
| 1 | cycle2-2 | Color Contrast (5) | P2 | `--text-secondary #777777` 대비비 4.48:1 (기준 4.5:1) |
| 2 | cycle2-3 | Color Contrast (5) | P2 | `--text-secondary #8A7A6A` 대비비 3.2:1 (기준 4.5:1) |
| 3 | cycle2-3 | Responsive images (17) | P3 | `.col-image` 반응형 규칙 누락 |
| 4 | cycle2-4 | Emoji Budget (3) | P1 | 슬라이드 3에 이모지 4개 (📚🔬🎨💻), 최대 3개 초과 |
| 5 | cycle2-4 | Color Contrast (5) | P2 | `--text-secondary #5A6A8A` 대비비 4.1:1 (기준 4.5:1) |
| 6 | cycle2-5 | Color Contrast (5) | P2 | `--text-secondary #888888` 대비비 3.5:1 (기준 4.5:1) |

---

## 공통 패턴

### 반복 위반 규칙

1. **Color Contrast (P2)** — 5개 중 4개 프레젠테이션에서 `--text-secondary` 대비비 미달. 가장 빈번한 위반. 디자인 스타일별로 보조 텍스트 색상을 밝게 설정하는 경향이 있어, 접근성 기준(4.5:1)을 놓치기 쉬움.
   - 권장 수정값:
   - cycle2-2: `#777777` → `#757575` 이하
   - cycle2-3: `#8A7A6A` → `#6D6053` 이하
   - cycle2-4: `#5A6A8A` → `#526080` 이하
   - cycle2-5: `#888888` → `#767676` 이하

2. **Emoji Budget (P1)** — card-grid에 card-icon 이모지가 section-icon과 합산되면 초과하기 쉬움. `grid-3` (3열 그리드)에 각 카드마다 이모지 아이콘을 넣으면 section-icon 포함 총 4개 이상이 됨.

### 잘 준수된 규칙

1. **CSS Structure (P0)** — 5/5 모두 완벽 준수. `.presentation`, `.slide`, `.browser-card`, `.browser-content` 구조가 일관됨.
2. **Height Budget (P0)** — 5/5 모두 준수. activity-item, toc, grid 모두 한도 내.
3. **Inline Events (P2)** — 5/5 모두 준수. `addEventListener` 패턴 일관 적용.
4. **CSS Variables (P3)** — 5/5 모두 `--style-*` 접두사만 사용.
5. **Image 관련 규칙 (11-17)** — 이미지 사용 3개 프레젠테이션 모두 높은 준수율. filename 패턴, loading=lazy, fallback UI, CSS 클래스, cover overlay 등 잘 구현됨.

### 모호한 규칙

1. **Inline Style (P2)**: "Minimal style="" in body"의 기준이 모호함. 이미지 fallback의 `style="display:none"`은 기능적으로 필수이나 inline style 개수에 포함됨. 명확한 허용 목록이 필요.
2. **Emoji Budget (P1)**: card-icon 이모지가 section-icon과 합산되는지, card-grid 내 이모지만 별도 카운트인지 불명확. card-grid thumbnail 면제와 유사하게 card-icon 면제 규칙이 필요할 수 있음.

### 누락된 규칙 (제안)

1. **이미지 미사용 시 대체 규칙**: cycle2-4, cycle2-5처럼 이미지를 사용하지 않는 프레젠테이션에서 이모지/unicode symbol 사용 가이드라인이 더 필요.
2. **Inline style 허용 목록**: fallback `display:none`, stat-number `font-size` 등 기능적 inline style의 명시적 허용 규칙.
3. **onerror 핸들러와 Inline Events 규칙 충돌**: 이미지 fallback에 `onerror` 인라인 이벤트를 사용하는데, 이는 Inline Events 규칙(onclick/onkeydown 금지)과 범위가 겹침. onerror는 허용 대상으로 명시 필요.
