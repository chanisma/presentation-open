# 현대 교육 프레젠테이션 디자인 스타일 가이드

각 스타일은 다음 항목으로 문서화됩니다:
- **Background** — 슬라이드 배경색 / 그라데이션
- **Colors** — 주요 색상(HEX 값 포함)
- **Fonts** — 제목/본문 폰트 권장사항
- **Layout** — 슬라이드 구성 방식
- **Signature Elements** — 스타일 완성에 필수적인 디자인 요소
- **CSS Variables** — 표준 CSS 변수 매핑
- **Avoid** — 스타일을 망치는 흔한 실수

---

## 📚 스타일 카테고리 체계

| 카테고리 | 설명 | 해당 스타일 번호 |
|----------|------|-----------------|
| 🌑 **다크 계열** | 어두운 배경, 빛나는 요소 | 01, 04, 08, 14, 17, 19, 20, 21, 24, 26, 27, 29 |
| ☀️ **라이트 계열** | 밝은 배경, 명확한 가독성 | 03, 07, 10, 11, 13, 15, 18, 22, 25, 28, 30 |
| 🎨 **컬러풀 계열** | 강렬한 색상, 역동적 에너지 | 02, 05, 06, 09, 12, 16, 23 |
| 🎓 **한국 교육 특화** | 국내 교육 현장 최적화 | 31, 32, 33, 34 |

---

## 🎯 스타일 추천 매트릭스

> **사용법**: 대상 × 목적 × 분위기 조합으로 스타일 선택. `1순위` → `2순위` 순으로 추천.

### 학생 대상

| 목적 \ 분위기 | 전문적 | 친근한 | 역동적 |
|--------------|--------|--------|--------|
| **수업 자료** | `07` 스위스 → `03` 벤토 | `06` 클레이 → `16` 파스텔 | `02` 브루탈 → `25` 멤피스 |
| **발표/PPT** | `07` 스위스 → `15` 에디토리얼 | `31` 소프트핑크 → `06` 클레이 | `01` 글라스 → `08` 오로라 |
| **학교 안내** | `03` 벤토 → `07` 스위스 | `31` 소프트핑크 → `16` 파스텔 | `02` 브루탈 → `25` 멤피스 |

### 교사 대상

| 목적 \ 분위기 | 전문적 | 친근한 | 역동적 |
|--------------|--------|--------|--------|
| **수업 자료** | `33` 디지털교과서 → `07` 스위스 | `34` 칠판 → `10` 노르딕 | `11` 타이포 → `03` 벤토 |
| **발표/PPT** | `32` K에듀클린 → `15` 에디토리얼 | `10` 노르딕 → `18` 핸드크래프트 | `11` 타이포 → `12` 듀오톤 |
| **학교 안내** | `32` K에듀클린 → `13` 모노크롬 | `10` 노르딕 → `18` 핸드크래프트 | `03` 벤토 → `11` 타이포 |

### 학부모 대상

| 목적 \ 분위기 | 전문적 | 친근한 | 역동적 |
|--------------|--------|--------|--------|
| **수업 자료** | `07` 스위스 → `13` 모노크롬 | `31` 소프트핑크 → `10` 노르딕 | `03` 벤토 → `11` 타이포 |
| **발표/PPT** | `32` K에듀클린 → `15` 에디토리얼 | `31` 소프트핑크 → `16` 파스텔 | `11` 타이포 → `03` 벤토 |
| **학교 안내** | `32` K에듀클린 → `07` 스위스 | `31` 소프트핑크 → `16` 파스텔 | `03` 벤토 → `11` 타이포 |

---

## 🖥️ 스타일 호환성 매트릭스

> **빔프로젝터 등급**: A = 밝은 교실에서도 선명 / B = 적당한 조도에서 양호 / C = 어두운 환경 필요
> **인쇄 친화도**: 높음 / 중간 / 낮음

| # | 스타일명 | 카테고리 | 빔프로젝터 | 인쇄 친화도 | 추천 컴포넌트 |
|---|----------|----------|------------|-------------|--------------|
| 01 | Glassmorphism | 다크 | B | 낮음 | 카드, KPI, 통계 |
| 02 | Neo-Brutalism | 컬러풀 | A | 중간 | 헤드라인, 강조, CTA |
| 03 | Bento Grid | 라이트 | A | 높음 | 비교표, 기능목록, 데이터 |
| 04 | Dark Academia | 다크 | B | 낮음 | 인용구, 역사, 배경설명 |
| 05 | Gradient Mesh | 컬러풀 | B | 낮음 | 커버, 타이틀슬라이드 |
| 06 | Claymorphism | 컬러풀 | A | 중간 | 아이콘, 단계설명, 카드 |
| 07 | Swiss International | 라이트 | A | 높음 | 데이터, 리포트, 모든 유형 |
| 08 | Aurora Neon Glow | 다크 | C | 낮음 | AI/기술, 커버, 임팩트 |
| 09 | Retro Y2K | 다크 | C | 낮음 | 이벤트, 트렌드 |
| 10 | Nordic Minimalism | 라이트 | A | 높음 | 인용구, 웰빙, 장기계획 |
| 11 | Typographic Bold | 라이트 | A | 높음 | 핵심메시지, 선언문 |
| 12 | Duotone/Color Split | 컬러풀 | B | 중간 | 비교/대조, 전후 |
| 13 | Monochrome Minimal | 라이트 | A | 높음 | 포트폴리오, 고급보고서 |
| 14 | Cyberpunk Outline | 다크 | C | 낮음 | 기술/게임, HUD UI |
| 15 | Editorial Magazine | 라이트 | A | 높음 | 스토리텔링, 연간보고 |
| 16 | Pastel Soft UI | 라이트 | B | 중간 | 앱소개, 헬스케어, 교육 |
| 17 | Dark Neon Miami | 다크 | C | 낮음 | 이벤트, 엔터테인먼트 |
| 18 | Hand-crafted Organic | 라이트 | A | 높음 | 환경/자연, 공예, 식품 |
| 19 | Isometric 3D Flat | 다크 | B | 낮음 | 시스템구조, IT다이어그램 |
| 20 | Vaporwave | 다크 | C | 낮음 | 창작물, 서브컬처 |
| 21 | Art Deco Luxe | 다크 | B | 낮음 | 갈라, 명품, 시상식 |
| 22 | Brutalist Newspaper | 라이트 | A | 높음 | 연구, 저널, 미디어 |
| 23 | Stained Glass Mosaic | 다크 | C | 낮음 | 문화예술, 박물관 |
| 24 | Liquid Blob Morphing | 다크 | C | 낮음 | 바이오텍, 혁신 |
| 25 | Memphis Pop Pattern | 라이트 | B | 중간 | 패션, 라이프스타일 |
| 26 | Dark Forest Nature | 다크 | C | 낮음 | 환경, 자연, 모험 |
| 27 | Architectural Blueprint | 다크 | B | 낮음 | 건축, 엔지니어링 |
| 28 | Maximalist Collage | 라이트 | B | 중간 | 광고, 패션, 편집 |
| 29 | SciFi Holographic Data | 다크 | C | 낮음 | 방위기술, AI연구 |
| 30 | Risograph Print | 라이트 | A | 높음 | 독립출판, 아트, 잡지 |
| 31 | Soft Pink Card UI | 교육특화 | B | 중간 | 학부모안내, 교육행사 |
| 32 | K-에듀 클린 | 교육특화 | A | 높음 | 교사발표, 공식보고, 수업 |
| 33 | 디지털 교과서 | 교육특화 | A | 높음 | 수업자료, 교과연계 |
| 34 | 교실 칠판 | 교육특화 | B | 낮음 | 학생발표, 인문수업 |

---

## 🔧 CSS 변수 표준

모든 스타일은 다음 5개 표준 CSS 변수를 정의합니다:

```css
--style-bg              /* 슬라이드 배경 기본색 */
--style-primary         /* 주요 강조색 (제목, 아이콘, 핵심요소) */
--style-accent          /* 보조 강조색 (포인트, CTA, 하이라이트) */
--style-text            /* 본문 텍스트 기본색 */
--style-text-secondary  /* 보조 텍스트, 캡션, 설명 */
```

---

## 🌑 카테고리 1: 다크 계열

---

## 01. Glassmorphism

**Mood**: Premium, tech, futuristic
**Best For**: SaaS, app launches, AI product decks
**카테고리**: 🌑 다크 계열 | **빔프로젝터**: B | **인쇄 친화도**: 낮음

### Background
- Deep 3-color gradient: `#1A1A4E → #6B21A8 → #1E3A5F`
- Or deep single-tone blue: `#0F0F2D`

### Colors
| Role | Color | HEX |
|------|-------|-----|
| Glass card fill | White translucent | `#FFFFFF` @ 15–20% opacity |
| Glass card border | White translucent | `#FFFFFF` @ 25% opacity |
| Title text | White | `#FFFFFF` |
| Body text | Soft white | `#E0E0F0` |
| Accent | Cyan or violet | `#67E8F9` or `#A78BFA` |

### Fonts
- Title: **Segoe UI Light / Calibri Light**, 36–44pt, bold
- Body: **Segoe UI**, 14–16pt, regular
- KPI numbers: 52–64pt bold

### Layout
- **Card-based**: use frosted-glass rectangles as content containers
- Rounded corners (radius 12–20px equivalent)
- Layer cards slightly offset and rotated ±5° for depth
- Add large blurred circles/ellipses behind cards for glow effect

### Signature Elements
- Translucent card (fill 15–20%, white border 25%)
- Blurred glow blobs in background
- All containers use the same glass treatment

### CSS Variables
```css
--style-bg: #0F0F2D;
--style-primary: #A78BFA;
--style-accent: #67E8F9;
--style-text: #FFFFFF;
--style-text-secondary: #E0E0F0;
```

### Avoid
- White backgrounds (kills the effect)
- Fully opaque cards
- Bright saturated solid colors

---

## 04. Dark Academia

**Mood**: Scholarly, vintage, refined, literary
**Best For**: Education, historical research, book presentations, university talks
**카테고리**: 🌑 다크 계열 | **빔프로젝터**: B | **인쇄 친화도**: 낮음

### Background
- Deep warm dark brown: `#1A1208`
- Or `#0E0A05` for maximum drama

### Colors
| Role | Color | HEX |
|------|-------|-----|
| Background | Deep warm brown | `#1A1208` |
| Title text | Antique gold | `#C9A84C` |
| Body text | Warm parchment | `#D4BF9A` |
| Border / ornament | Dark gold | `#3D2E10` |
| Accent | Muted gold | `#8A7340` |

### Fonts
- Title: **Playfair Display Italic / Georgia Italic**, 36–48pt
- Body: **EB Garamond / Georgia**, 13–16pt
- Label: **Space Mono**, 9–11pt, wide letter-spacing

### Layout
- **Inset border frame** — thin gold border 12–20pt from slide edge
- Centered title with wide letter-spacing (6–10pt)
- Body text in serif, generous leading (1.6–1.8)
- Decorative horizontal rule line (thin, gold tint)

### Signature Elements
- Double inset border (outer + inner, slightly different widths)
- Italic serif title in gold
- Monospace footnote or date in muted gold

### CSS Variables
```css
--style-bg: #1A1208;
--style-primary: #C9A84C;
--style-accent: #8A7340;
--style-text: #D4BF9A;
--style-text-secondary: #8A7340;
```

### Avoid
- Modern sans-serif fonts
- Bright or saturated colors
- Clean minimal layouts — add texture and decoration

---

## 08. Aurora Neon Glow

**Mood**: Futuristic, AI, electric, otherworldly
**Best For**: AI products, cybersecurity, deep tech, innovation summits
**카테고리**: 🌑 다크 계열 | **빔프로젝터**: C | **인쇄 친화도**: 낮음

### Background
- Near-black deep space: `#050510` or `#020208`

### Colors
| Role | Color | HEX |
|------|-------|-----|
| Background | Deep space black | `#050510` |
| Glow 1 | Neon green | `#00FF88` |
| Glow 2 | Electric violet | `#7B00FF` |
| Glow 3 | Cyan | `#00B4FF` |
| Title gradient | Green → cyan → violet | multi-stop |
| Body text | Soft white | `#D0D0F0` |

### Fonts
- Title: **Bebas Neue / Barlow Condensed**, 44–60pt, wide letter-spacing 4–8pt
- Body: **DM Mono / Space Mono**, 12–14pt
- Gradient text clip on title

### Layout
- Large blurred glow blobs (filter blur 30–50pt) in background corners
- Centered or left-aligned title with gradient text effect
- Body on semi-transparent dark panel
- Optional scan-line texture overlay (5% opacity)

### Signature Elements
- Blurred neon glow circles (not sharp shapes)
- Gradient text (green → cyan → violet)
- Dark panel for body text legibility

### CSS Variables
```css
--style-bg: #050510;
--style-primary: #00FF88;
--style-accent: #7B00FF;
--style-text: #D0D0F0;
--style-text-secondary: rgba(208, 208, 240, 0.7);
```

### Avoid
- White or light backgrounds
- Solid non-glowing colors
- Dense body text without panels

---

## 09. Retro Y2K

**Mood**: Nostalgic, pop, chaotic fun, millennium energy
**Best For**: Events, lifestyle marketing, fashion, creative campaigns
**카테고리**: 🌑 다크 계열 | **빔프로젝터**: C | **인쇄 친화도**: 낮음

### Background
- Navy blue: `#000080`
- Or electric blue: `#0020C2`

### Colors
| Role | Color | HEX |
|------|-------|-----|
| Background | Navy | `#000080` |
| Rainbow stripe | Full spectrum | gradient: `#FF0080 → #FFFF00 → #00FF00 → #00FFFF → #0000FF → #FF00FF` |
| Title text | White | `#FFFFFF` |
| Title glow | Cyan + magenta shadow | `#00FFFF` / `#FF00FF` |
| Star accent | Yellow | `#FFFF00` |

### Fonts
- Title: **Bebas Neue / Impact**, 36–52pt
- Body: **VT323 / Space Mono**, 12–14pt
- Double text shadow: 2px cyan + 2px magenta offset

### Layout
- **Rainbow stripe bars** top and bottom (6–8pt height)
- Star/sparkle icons in corners (✦ ★)
- Title centered with double text shadow
- Optional: spinning star animation placeholder

### Signature Elements
- Rainbow gradient stripe bars
- Double-color text shadow (cyan + magenta)
- Star/sparkle motifs

### CSS Variables
```css
--style-bg: #000080;
--style-primary: #FFFFFF;
--style-accent: #00FFFF;
--style-text: #FFFFFF;
--style-text-secondary: rgba(255, 255, 255, 0.8);
```

### Avoid
- Minimalist layouts
- Muted or desaturated colors
- Serif fonts

---

## 14. Cyberpunk Outline

**Mood**: HUD interface, sci-fi, dark tech, surveillance
**Best For**: Gaming, AI infrastructure, security, data engineering decks
**카테고리**: 🌑 다크 계열 | **빔프로젝터**: C | **인쇄 친화도**: 낮음

### Background
- Near-black: `#0D0D0D`

### Colors
| Role | Color | HEX |
|------|-------|-----|
| Background | Near-black | `#0D0D0D` |
| Grid lines | Neon cyan | `#00FFC8` @ 6% opacity |
| Outline text | Transparent fill | stroke `#00FFC8`, 1.5pt |
| Glow | Neon cyan | `#00FFC8` @ 50% blur glow |
| Corner marks | Neon cyan | `#00FFC8` @ 60% |
| Subtext | Neon cyan | `#00FFC8` @ 50% |

### Fonts
- Title: **Bebas Neue**, 44–60pt, letter-spacing 6–8pt, **outline text** (no fill, colored stroke)
- Body: **Space Mono**, 9–11pt
- Data labels: **Space Mono**, 8pt, wider spacing

### Layout
- Subtle dot-grid or line-grid background (6% opacity)
- **Corner bracket markers** (L-shaped, 20pt, neon) in all 4 corners
- Title centered with outline stroke effect
- Bottom subtext label

### Signature Elements
- Outline (stroke-only) text for title
- Four corner bracket markers
- Grid overlay background

### CSS Variables
```css
--style-bg: #0D0D0D;
--style-primary: #00FFC8;
--style-accent: #00FFC8;
--style-text: #00FFC8;
--style-text-secondary: rgba(0, 255, 200, 0.5);
```

### Avoid
- White backgrounds
- Filled (non-outline) title text
- Bright, warm colors

---

## 17. Dark Neon Miami

**Mood**: Synthwave, 80s nostalgia, hedonistic neon
**Best For**: Entertainment, music festivals, events, nightlife brands
**카테고리**: 🌑 다크 계열 | **빔프로젝터**: C | **인쇄 친화도**: 낮음

### Background
- Deep purple-black: `#0A0014`

### Colors
| Role | Color | HEX |
|------|-------|-----|
| Background | Deep purple-black | `#0A0014` |
| Sunset semicircle | Orange → hot pink | `#FF6B35 → #FF0080` |
| Title gradient | Orange → pink → purple | `#FF6B35 → #FF0080 → #9B00FF` |
| Grid lines | Hot pink transparent | `#FF0080` @ 15–40% |

### Fonts
- Title: **Bebas Neue**, 36–52pt, letter-spacing 6–8pt
- Body: **Space Mono**, 11–13pt
- All text white or gradient

### Layout
- **Horizon semicircle** (sunset) in lower-center third
- Perspective grid lines converging toward horizon (4–6 lines)
- Title positioned top-center
- Palm tree or geometric accent in lower corners (optional)

### Signature Elements
- Sunset semicircle gradient shape
- Converging perspective grid
- Gradient text (orange → pink → purple)

### CSS Variables
```css
--style-bg: #0A0014;
--style-primary: #FF6B35;
--style-accent: #FF0080;
--style-text: #FFFFFF;
--style-text-secondary: rgba(255, 255, 255, 0.8);
```

### Avoid
- Cool color palettes (blue/green dominant)
- Daylight or bright backgrounds
- Sans-serif body text

---

## 19. Isometric 3D Flat

**Mood**: Technical clarity, structured, architectural
**Best For**: IT architecture, data flow, system diagrams, infrastructure
**카테고리**: 🌑 다크 계열 | **빔프로젝터**: B | **인쇄 친화도**: 낮음

### Background
- Dark navy: `#1E1E2E`

### Colors
| Role | Color | HEX |
|------|-------|-----|
| Background | Dark navy | `#1E1E2E` |
| Top face | Mid violet | `#7C6FFF` |
| Left face | Dark violet | `#4A3FCC` |
| Right face | Medium violet | `#6254E8` |
| Top face 2 (highlight) | Light violet | `#A594FF` |

### Fonts
- Labels: **Space Mono**, 10–12pt, white
- Title: **Bebas Neue / Barlow Condensed**, 28–40pt, white

### Layout
- Isometric (30° angle) 3D block shapes — two or three stacked cubes
- Blocks assembled left-center, title upper-right
- Thin connecting lines or arrows between blocks (for diagrams)
- All shapes share the same 3-face color system (top lighter, sides darker)

### Signature Elements
- Strict isometric angle (30°/60°)
- 3-face shading system (top, left, right faces)
- Dark navy background contrast

### CSS Variables
```css
--style-bg: #1E1E2E;
--style-primary: #7C6FFF;
--style-accent: #A594FF;
--style-text: #FFFFFF;
--style-text-secondary: rgba(255, 255, 255, 0.8);
```

### Avoid
- Perspective 3D (use isometric only)
- Rounded shapes
- Light or white backgrounds

---

## 20. Vaporwave

**Mood**: Dreamy, nostalgic internet aesthetics, surreal
**Best For**: Creative agencies, music/art portfolios, subculture brands
**카테고리**: 🌑 다크 계열 | **빔프로젝터**: C | **인쇄 친화도**: 낮음

### Background
- Dark purple gradient: `#1A0533 → #2D0057 → #570038`

### Colors
| Role | Color | HEX |
|------|-------|-----|
| Background | Deep purple | `#1A0533 → #570038` |
| Sun gradient | Orange → pink → violet | `#FF9F43 → #FF6B9D → #C44DFF` |
| Grid lines | Pink transparent | `#FF64C8` @ 40% |
| Gradient text | Orange → pink → violet | same as sun |
| Ghost title | White very low opacity | `#FFFFFF` @ 8% |

### Fonts
- Ghost title: **Bebas Neue**, 38–52pt, 6pt spacing, near-invisible
- Gradient text: **Bebas Neue**, 24–34pt
- Body: **Space Mono**, 10pt

### Layout
- **Perspective grid** in lower 60% (horizontal + vertical lines converging)
- Semicircle sun top-center, sliced by 2 horizontal bars (background color)
- Ghost watermark text near sun area
- Gradient text at bottom

### Signature Elements
- Sliced sunset semicircle (sun with stripes)
- Perspective grid floor
- Ghost/watermark title text

### CSS Variables
```css
--style-bg: #1A0533;
--style-primary: #FF9F43;
--style-accent: #C44DFF;
--style-text: #FFFFFF;
--style-text-secondary: rgba(255, 255, 255, 0.6);
```

### Avoid
- Clean or corporate layouts
- Muted or warm earth tones
- Readable "normal" typography style

---

## 21. Art Deco Luxe

**Mood**: 1920s grandeur, gilded, prestigious
**Best For**: Luxury brands, gala events, premium annual reports, high-end hospitality
**카테고리**: 🌑 다크 계열 | **빔프로젝터**: B | **인쇄 친화도**: 낮음

### Background
- Deep black-brown: `#0E0A05`

### Colors
| Role | Color | HEX |
|------|-------|-----|
| Background | Deep black-brown | `#0E0A05` |
| Border / ornament | Antique gold | `#B8960C` |
| Title text | Rich gold | `#D4AA2A` |
| Subtitle | Muted gold | `#8A7020` |
| Diamond accent | Bright gold | `#B8960C` |

### Fonts
- Title: **Cormorant Garamond / Trajan / Didot**, 26–36pt, wide letter-spacing 6–10pt
- Caption: **Space Mono**, 9pt, 4–5pt letter-spacing
- All text uppercase

### Layout
- **Double inset gold border** frame (outer full, inner slightly inset)
- **Fan / quarter-circle ornaments** in left and right mid-edge
- Thin horizontal gold rule at vertical center
- Diamond (rotated square) at rule-center intersection
- Title centered, uppercase, wide-spaced

### Signature Elements
- Double inset border frame (two concentric rectangles)
- Fan ornaments on sides
- Diamond divider at center rule
- ALL CAPS wide letter-spaced serif

### CSS Variables
```css
--style-bg: #0E0A05;
--style-primary: #D4AA2A;
--style-accent: #B8960C;
--style-text: #D4AA2A;
--style-text-secondary: #8A7020;
```

### Avoid
- Modern sans-serif fonts
- Colorful or pastel tones
- Asymmetric layouts

---

## 24. Liquid Blob Morphing

**Mood**: Organic, fluid, living, bio-digital
**Best For**: Biotech, environmental tech, innovation labs, wellness brands
**카테고리**: 🌑 다크 계열 | **빔프로젝터**: C | **인쇄 친화도**: 낮음

### Background
- Deep ocean gradient: `#0F2027 → #203A43 → #2C5364`

### Colors
| Role | Color | HEX |
|------|-------|-----|
| Background | Deep ocean | `#0F2027 → #2C5364` |
| Blob 1 | Teal glow | `#00D2BE` @ 35% |
| Blob 2 | Electric blue | `#0078FF` @ 30% |
| Blob 3 | Violet | `#7800FF` @ 25% |
| Title | White / near-white | `#F0FFFE` |
| Glow | Teal | `#00D2BE` radial glow |

### Fonts
- Title: **Bebas Neue**, 36–48pt, 6pt letter-spacing
- Body: **DM Mono / Space Mono**, 12–14pt
- All text white

### Layout
- 3 large blurred blob shapes positioned asymmetrically (corners + center)
- Blobs overlap with `multiply` or `screen` blend mode effect
- Title centered with teal text glow
- Optional: animated morphing border-radius effect

### Signature Elements
- Three overlapping blurred blobs (low opacity)
- Ocean-depth dark background
- Glowing white text with colored halo

### CSS Variables
```css
--style-bg: #0F2027;
--style-primary: #00D2BE;
--style-accent: #0078FF;
--style-text: #F0FFFE;
--style-text-secondary: rgba(240, 255, 254, 0.7);
```

### Avoid
- Sharp geometric shapes
- Bright or warm backgrounds
- Dense text content

---

## 26. Dark Forest Nature

**Mood**: Mysterious, atmospheric, primal, eco-premium
**Best For**: Environmental brands, adventure/outdoor, sustainable luxury, conservation
**카테고리**: 🌑 다크 계열 | **빔프로젝터**: C | **인쇄 친화도**: 낮음

### Background
- Radial dark gradient: `#0D2B14` center → `#060E08` edges

### Colors
| Role | Color | HEX |
|------|-------|-----|
| Background | Deep forest black | `#060E08` |
| Tree silhouettes | Dark forest green | `#0A3D1A` → `#0D4D20` |
| Moon | Pale sage glow | `#E8F4D0` → `#B8CC80` |
| Stars | Pale green-white | `#D4F0B0` |
| Mist glow | Soft mint | `#B4FFC8` @ 4% |
| Title text | Sage-white italic | `rgba(200,255,180,0.85)` |

### Fonts
- Title: **Playfair Display Italic / DM Serif Display Italic**, 20–28pt
- Body: **EB Garamond**, 13–15pt
- Caption: **Space Mono**, 9pt, wide spacing

### Layout
- **Tree silhouettes** rising from bottom — triangular/fir shapes, 3+ overlapping depths
- **Moon** top-right with soft radial glow
- Star dots scattered sparingly in upper half
- Mist gradient rising from bottom over trees
- Italic serif title near bottom (above mist)

### Signature Elements
- Layered tree silhouettes (3+ depths)
- Glowing moon top-right
- Fog/mist gradient overlay
- Italic serif text in sage-white

### CSS Variables
```css
--style-bg: #060E08;
--style-primary: rgba(200, 255, 180, 0.85);
--style-accent: #B4FFC8;
--style-text: rgba(200, 255, 180, 0.85);
--style-text-secondary: rgba(200, 255, 180, 0.6);
```

### Avoid
- Bright greens (use near-black forest tones)
- Hard edges on tree shapes
- Sans-serif fonts

---

## 27. Architectural Blueprint

**Mood**: Precise, technical, professional, structured
**Best For**: Architecture, urban planning, engineering, spatial design firms
**카테고리**: 🌑 다크 계열 | **빔프로젝터**: B | **인쇄 친화도**: 낮음

### Background
- Blueprint blue: `#0D2240`

### Colors
| Role | Color | HEX |
|------|-------|-----|
| Background | Blueprint navy | `#0D2240` |
| Fine grid | Cyan-white | `#64B4FF` @ 12% |
| Major grid | Cyan-white | `#64B4FF` @ 22% |
| Shape lines | Blueprint line | `#64C8FF` @ 60% |
| Dimension text | Blueprint text | `#64C8FF` @ 60% |
| Title | Blueprint white | `#96DCFF` @ 80% |

### Fonts
- All text: **Space Mono**, 8–12pt (no exceptions — monospace only)
- Dimension annotations: 8pt
- Title: 11–13pt, 4pt letter-spacing
- Stamp: 8pt, multiline

### Layout
- **Fine grid** (20pt) + **major grid** (60pt) layered
- One or two geometric shapes with dimensions and annotation marks
- Arrow dimension lines between key points
- Circular stamp element (right side, mid-height)
- Title as full-width label at bottom

### Signature Elements
- Dual grid (fine + major)
- Dimension lines with annotation text
- Circular blueprint stamp

### CSS Variables
```css
--style-bg: #0D2240;
--style-primary: #64C8FF;
--style-accent: #64B4FF;
--style-text: #96DCFF;
--style-text-secondary: rgba(100, 200, 255, 0.6);
```

### Avoid
- Color or decorative elements
- Non-monospace fonts
- Photographic elements

---

## 29. SciFi Holographic Data

**Mood**: Military HUD, quantum computing, absolute precision
**Best For**: Defense tech, AI research, quantum, advanced data engineering
**카테고리**: 🌑 다크 계열 | **빔프로젝터**: C | **인쇄 친화도**: 낮음

### Background
- Deep space black: `#03050D`

### Colors
| Role | Color | HEX |
|------|-------|-----|
| Background | Deep space | `#03050D` |
| Ring outlines | Cyan | `#00C8FF` @ 25–60% (vary by ring) |
| Scan line | Cyan | `#00C8FF` @ 50% |
| Bar elements | Cyan gradient | `transparent → #00C8FF → transparent` |
| Text | Cyan | `#00C8FF` @ 70% |
| Center dot | Bright cyan | `#00C8FF` |

### Fonts
- All text: **Space Mono**, 9–11pt
- System labels: 10pt, 3pt letter-spacing
- Coordinates/data: 8pt

### Layout
- **3 concentric rings** (full circles, varying opacity increasing inward)
- Middle ring rotated 30° from outer ring
- **Horizontal scan line** animating top to bottom (or static at mid position)
- Horizontal bars (gradient center-glow) top and bottom
- Center dot at ring intersection
- Text labels at top-left and bottom-right

### Signature Elements
- 3 concentric circles (not uniform — one rotated)
- Scan line (animated or static)
- All elements strictly monochromatic cyan

### CSS Variables
```css
--style-bg: #03050D;
--style-primary: #00C8FF;
--style-accent: #00C8FF;
--style-text: rgba(0, 200, 255, 0.7);
--style-text-secondary: rgba(0, 200, 255, 0.5);
```

### Avoid
- Multiple hue accents
- Warm or saturated colors
- Any decorative illustration

---

## ☀️ 카테고리 2: 라이트 계열

---

## 03. Bento Grid

**Mood**: Modular, informational, Apple-inspired
**Best For**: Feature comparisons, product overviews, data summaries
**카테고리**: ☀️ 라이트 계열 | **빔프로젝터**: A | **인쇄 친화도**: 높음

### Background
- Near-white: `#F8F8F2` or `#F0F0F0`

### Colors
| Role | Color | HEX |
|------|-------|-----|
| Background | Off-white | `#F8F8F2` |
| Cell 1 (dark) | Deep navy | `#1A1A2E` |
| Cell 2 (accent 1) | Bright yellow | `#E8FF3B` |
| Cell 3 (accent 2) | Coral red | `#FF6B6B` |
| Cell 4 (accent 3) | Teal | `#4ECDC4` |
| Cell 5 (warm) | Warm yellow | `#FFE66D` |

### Fonts
- Cell title: **SF Pro / Inter**, 18–24pt, semibold
- Cell body: **Inter**, 12–14pt, regular
- Large stat: 48–64pt bold in dark cell

### Layout
- CSS Grid-style layout: cells of different sizes spanning columns/rows
- Gap between cells: 8–12pt equivalent
- **Asymmetric merging**: one cell spans 2 columns, one spans 2 rows
- Each cell has one focused piece of info

### Signature Elements
- Asymmetric multi-size grid
- One dark anchor cell with white text
- Color-coded cells for visual hierarchy

### CSS Variables
```css
--style-bg: #F8F8F2;
--style-primary: #1A1A2E;
--style-accent: #E8FF3B;
--style-text: #1A1A2E;
--style-text-secondary: #555555;
```

### Avoid
- Equal-sized cells (boring)
- Too many colors (max 5)
- Dense text inside cells

---

## 07. Swiss International Style

**Mood**: Functional, authoritative, timeless, corporate
**Best For**: Consulting, finance, government, institutional presentations
**카테고리**: ☀️ 라이트 계열 | **빔프로젝터**: A | **인쇄 친화도**: 높음

### Background
- Pure white: `#FFFFFF`
- Or off-white: `#FAFAFA`

### Colors
| Role | Color | HEX |
|------|-------|-----|
| Background | White | `#FFFFFF` |
| Primary text | Near-black | `#111111` |
| Accent bar | Signal red | `#E8000D` |
| Secondary text | Dark grey | `#444444` |
| Divider line | Light grey | `#DDDDDD` |

### Fonts
- Title: **Helvetica Neue Bold / Arial Bold**, 32–44pt, tight leading
- Body: **Helvetica Neue / Arial**, 12–14pt
- Labels/captions: **Space Mono**, 9–10pt, 3–4pt letter-spacing

### Layout
- Strict **5-column or 12-column grid** — every element snaps to columns
- **Vertical red rule** on left edge (4–8pt wide stripe)
- Single horizontal divider rule at mid-slide
- Circle accent element (red outline) in lower-right zone

### Signature Elements
- Left-edge vertical red bar
- Horizontal rule dividing title from content
- Grid-aligned text blocks with generous margins

### CSS Variables
```css
--style-bg: #FFFFFF;
--style-primary: #111111;
--style-accent: #E8000D;
--style-text: #111111;
--style-text-secondary: #444444;
```

### Avoid
- Decorative or illustrative elements
- Rounded corners
- More than 2 fonts

---

## 10. Nordic Minimalism

**Mood**: Calm, natural, considered, Scandinavian
**Best For**: Wellness, lifestyle, non-profit, sustainable brands
**카테고리**: ☀️ 라이트 계열 | **빔프로젝터**: A | **인쇄 친화도**: 높음

### Background
- Warm cream: `#F4F1EC` or `#F0EDE8`

### Colors
| Role | Color | HEX |
|------|-------|-----|
| Background | Warm cream | `#F4F1EC` |
| Organic shape | Warm grey | `#D9CFC4` |
| Primary text | Dark warm brown | `#3D3530` |
| Secondary text | Taupe | `#8A7A6A` |
| Accent dot | Deep brown | `#3D3530` |

### Fonts
- Title: **Canela / Freight Display / DM Serif Display**, 36–52pt, light weight
- Body: **Inter Light / Lato Light**, 13–15pt
- Caption: **Space Mono**, 9–10pt, 4–6pt letter-spacing

### Layout
- **Generous whitespace** — at least 40% of slide is empty
- One organic blob shape as background texture (low opacity, grey-beige)
- Minimal dot accent (3 dots in different brown tones) top-left corner
- Thin horizontal rule near bottom, then caption text

### Signature Elements
- Organic blob background shape
- 3-dot color accent
- Wide letter-spacing caption in monospace

### CSS Variables
```css
--style-bg: #F4F1EC;
--style-primary: #3D3530;
--style-accent: #3D3530;
--style-text: #3D3530;
--style-text-secondary: #8A7A6A;
```

### Avoid
- Bright or saturated colors
- Dense text or busy layouts
- Sans-serif display fonts (use serif or editorial)

---

## 11. Typographic Bold

**Mood**: Editorial, impactful, design-driven, authoritative
**Best For**: Brand statements, manifestos, headline announcements
**카테고리**: ☀️ 라이트 계열 | **빔프로젝터**: A | **인쇄 친화도**: 높음

### Background
- Off-white linen: `#F0EDE8`
- Or pure black: `#0A0A0A` (inverted version)

### Colors
| Role | Color | HEX |
|------|-------|-----|
| Background | Off-white | `#F0EDE8` |
| Primary type | Near-black | `#1A1A1A` |
| Accent word | Signal red | `#E63030` |
| Footnote | Light grey | `#AAAAAA` |

### Fonts
- Oversized display: **Bebas Neue / Anton**, 80–120pt, tight tracking (-2pt)
- Accent word: different color, same font
- Body (if any): **Space Mono**, 9pt, wide spacing

### Layout
- **Type fills the slide** — no illustrations or photos
- 2–3 lines maximum, massive scale
- One word or phrase in accent color
- Tiny footnote/label bottom-right in monospace

### Signature Elements
- Oversized type (80pt+) as the main visual
- Single accent color word breaking the monochrome
- Almost no margins — type bleeds toward edges

### CSS Variables
```css
--style-bg: #F0EDE8;
--style-primary: #1A1A1A;
--style-accent: #E63030;
--style-text: #1A1A1A;
--style-text-secondary: #AAAAAA;
```

### Avoid
- Images or icons (type IS the design)
- More than 3 lines of large text
- Mixing multiple font families

---

## 13. Monochrome Minimal

**Mood**: Restrained, luxury, precise, gallery-like
**Best For**: Luxury brands, portfolio, art direction, high-end consulting
**카테고리**: ☀️ 라이트 계열 | **빔프로젝터**: A | **인쇄 친화도**: 높음

### Background
- Near-white: `#FAFAFA`
- Or jet black: `#0A0A0A` (dark variant)

### Colors
| Role | Color | HEX |
|------|-------|-----|
| Background | Near-white | `#FAFAFA` |
| Heavy type | Near-black | `#1A1A1A` |
| Thin rule/border | Light grey | `#E0E0E0` |
| Medium element | Mid grey | `#888888` |
| Footnote | Pale grey | `#CCCCCC` |

### Fonts
- Display: **Helvetica Neue Thin / Futura Light**, 24–36pt, extreme letter-spacing (8–12pt)
- Body: **Helvetica Neue**, 11–13pt, 150% line height
- Accent: **Space Mono**, 9pt

### Layout
- Single thin circle outline centered (decorative, not functional)
- Width-varying bars (120pt, 80pt, 40pt) as visual hierarchy stand-in
- All elements centered or left-aligned — never right
- Extreme negative space

### Signature Elements
- Thin circle outline as focal point
- Descending-width bars (weight hierarchy without font changes)
- Monospace caption with wide spacing

### CSS Variables
```css
--style-bg: #FAFAFA;
--style-primary: #1A1A1A;
--style-accent: #888888;
--style-text: #1A1A1A;
--style-text-secondary: #888888;
```

### Avoid
- Any color (pure monochrome only)
- Decorative illustration or pattern
- Crowded layouts

---

## 15. Editorial Magazine

**Mood**: Journalistic, narrative, sophisticated
**Best For**: Annual reports, brand stories, long-form content decks
**카테고리**: ☀️ 라이트 계열 | **빔프로젝터**: A | **인쇄 친화도**: 높음

### Background
- White `#FFFFFF` with dark block

### Colors
| Role | Color | HEX |
|------|-------|-----|
| Background (main) | White | `#FFFFFF` |
| Dark block | Near-black | `#1A1A1A` |
| Title | Near-black | `#1A1A1A` |
| Rule line | Signal red | `#E63030` |
| Caption | Light grey | `#BBBBBB` |

### Fonts
- Title: **Playfair Display Italic**, 34–48pt
- Subhead: **Space Mono**, 8–9pt, 2–3pt letter-spacing
- Body: **Georgia**, 11–13pt

### Layout
- **Asymmetric two-zone layout**: left 55% white with text, right 45% dark block
- Large italic serif title upper-left
- Thin red horizontal rule (2pt) below title, 60pt wide
- Vertical label text rotated 90° in dark zone
- Column-style body text bottom-left

### Signature Elements
- Asymmetric white/dark split
- Short red rule line under title
- Rotated vertical label text in dark zone

### CSS Variables
```css
--style-bg: #FFFFFF;
--style-primary: #1A1A1A;
--style-accent: #E63030;
--style-text: #1A1A1A;
--style-text-secondary: #BBBBBB;
```

### Avoid
- Symmetric or centered layouts
- Sans-serif display fonts
- Full-bleed colored backgrounds

---

## 18. Hand-crafted Organic

**Mood**: Artisanal, natural, human, sustainable
**Best For**: Eco brands, food/beverage, craft studios, wellness
**카테고리**: ☀️ 라이트 계열 | **빔프로젝터**: A | **인쇄 친화도**: 높음

### Background
- Craft paper warm off-white: `#FDF6EE`

### Colors
| Role | Color | HEX |
|------|-------|-----|
| Background | Warm craft paper | `#FDF6EE` |
| Dashed circle (outer) | Light tan | `#C8A882` |
| Solid circle (inner) | Medium brown | `#A87850` |
| Title text | Dark warm brown | `#6B4C2A` |
| Leaf/flora accents | Natural greens | emoji or illustration |

### Fonts
- Title: **Playfair Display Italic / Cormorant Garamond Italic**, 22–34pt
- Body: **EB Garamond**, 13–15pt
- Caption: **Courier New**, 9pt

### Layout
- **Nested circles**: outer dashed + inner solid, slightly off-center or rotated
- Botanical emoji or line-art leaf accents in corners
- Dashed horizontal rule spanning slide
- Italic serif title centered within circles

### Signature Elements
- Dashed outer circle (imperfect, rotated 5–10°)
- Nested solid inner circle
- Botanical/leaf accent elements

### CSS Variables
```css
--style-bg: #FDF6EE;
--style-primary: #6B4C2A;
--style-accent: #A87850;
--style-text: #6B4C2A;
--style-text-secondary: #A87850;
```

### Avoid
- Clean geometric shapes
- Bright or synthetic colors
- Sans-serif fonts

---

## 22. Brutalist Newspaper

**Mood**: Editorial authority, raw journalism, confrontational
**Best For**: Media companies, research institutes, content industry decks
**카테고리**: ☀️ 라이트 계열 | **빔프로젝터**: A | **인쇄 친화도**: 높음

### Background
- Aged paper off-white: `#F2EFE8`

### Colors
| Role | Color | HEX |
|------|-------|-----|
| Background | Aged paper | `#F2EFE8` |
| Masthead bar | Deep warm black | `#1A1208` |
| Masthead text | Off-white | `#F2EFE8` |
| Body text | Dark warm brown | `#3A3020` |
| Column divider | Deep warm black | `#1A1208` |

### Fonts
- Masthead: **Space Mono Bold**, 12–14pt, tight
- Headline: **Georgia Bold / Playfair Display Bold**, 20–28pt
- Body: **Georgia**, 9–11pt, 1.5 line height
- Date/label: **Space Mono**, 7–9pt, 1pt letter-spacing

### Layout
- **Dark masthead bar** full-width at top (newspaper nameplate)
- Double rule lines below masthead (3pt + 1pt)
- **Two-column layout** with vertical divider rule
- Left: headline + body text; Right: photo placeholder + caption

### Signature Elements
- Newspaper masthead bar
- Double rule below masthead
- Two-column layout with divider
- Italic serif headline

### CSS Variables
```css
--style-bg: #F2EFE8;
--style-primary: #1A1208;
--style-accent: #1A1208;
--style-text: #3A3020;
--style-text-secondary: #666666;
```

### Avoid
- Modern sans-serif fonts
- Colorful elements
- Clean white space (embrace density)

---

## 25. Memphis Pop Pattern

**Mood**: Energetic, retro-contemporary, anti-minimalist
**Best For**: Fashion brands, lifestyle products, retail, youth marketing
**카테고리**: ☀️ 라이트 계열 | **빔프로젝터**: B | **인쇄 친화도**: 중간

### Background
- Warm off-white: `#FFF5E0`

### Colors
| Role | Color | HEX |
|------|-------|-----|
| Background | Warm off-white | `#FFF5E0` |
| Triangle accent | Crimson red | `#E8344A` |
| Circle outline | Royal blue | `#1E90FF` |
| Zigzag bar | Crimson red | `#E8344A` |
| Dot accent | Mint green | `#22BB88` |
| Star/triangle 2 | Golden yellow | `#FFD700` |

### Fonts
- Title: **Bebas Neue / Futura ExtraBold**, 32–44pt
- Body: **Futura / DM Sans**, 12–14pt

### Layout
- **Scattered geometric shapes** (triangles, circles, dots, zigzags) across slide
- No central focal point — distribute shapes with intentional asymmetry
- Title placed over a slightly cleared zone in center
- One zigzag bar cuts horizontally across the middle third

### Signature Elements
- Triangles, circles, dots, and zigzag bar all present
- Warm off-white background (not pure white or dark)
- Shapes feel random but are intentionally balanced

### CSS Variables
```css
--style-bg: #FFF5E0;
--style-primary: #E8344A;
--style-accent: #1E90FF;
--style-text: #1A1A1A;
--style-text-secondary: #555555;
```

### Avoid
- Minimalist compositions
- Monochromatic palettes
- Modern/clean fonts

---

## 28. Maximalist Collage

**Mood**: Chaotic energy, irreverent, advertising-bold
**Best For**: Advertising agencies, fashion brands, music promotions, editorial
**카테고리**: ☀️ 라이트 계열 | **빔프로젝터**: B | **인쇄 친화도**: 중간

### Background
- Warm antique cream: `#E8DDD0` with diagonal pattern overlay

### Colors
| Role | Color | HEX |
|------|-------|-----|
| Background | Antique cream | `#E8DDD0` |
| Block 1 | Bold red | `#E83030` |
| Block 2 | Near-black | `#1A1A1A` |
| Block 3 | Acid yellow | `#F5D020` |
| Text on red | White | `#FFFFFF` |
| Text on black | White | `#FFFFFF` |

### Fonts
- Bold word: **Bebas Neue**, 24–34pt
- Secondary: **Playfair Display Italic**, 16–22pt, vertical writing
- Giant number: **Bebas Neue**, 64–80pt (ghost/watermark at 8% opacity)
- Caption: **Space Mono**, 8pt

### Layout
- **Overlapping color blocks** (3 blocks, each slightly rotated ±2–5°)
- Each block contains one focused element (text, word, or icon)
- Diagonal stripe pattern on background (3% opacity)
- Ghost number lower-right
- Circle outline accent element (outline only, one of the bold colors)

### Signature Elements
- 3+ overlapping rotated blocks
- Giant ghost number as texture
- Circle outline accent
- Vertical text in one block

### CSS Variables
```css
--style-bg: #E8DDD0;
--style-primary: #E83030;
--style-accent: #F5D020;
--style-text: #1A1A1A;
--style-text-secondary: #555555;
```

### Avoid
- Symmetric or centered compositions
- Clean uncluttered layouts
- Muted backgrounds

---

## 30. Risograph Print

**Mood**: Indie, artisanal printing, CMYK overlap, analog warmth
**Best For**: Independent publishers, music labels, art zines, boutique studios
**카테고리**: ☀️ 라이트 계열 | **빔프로젝터**: A | **인쇄 친화도**: 높음

### Background
- Aged paper: `#F7F2E8`

### Colors
| Role | Color | HEX |
|------|-------|-----|
| Background | Aged paper | `#F7F2E8` |
| Circle 1 (C) | Riso red | `#E8344A` |
| Circle 2 (M) | Riso blue | `#0D5C9E` |
| Circle 3 (Y) | Riso yellow | `#F5D020` |
| Overlap zones | Multiply blend | auto (red+blue=purple, red+yellow=orange, blue+yellow=green) |
| Ghost title | Red-tint offset | `#E8344A` @ 25%, shifted 3px |

### Fonts
- Main title: **Bebas Neue**, 34–44pt, 4pt letter-spacing
- Caption: **Space Mono**, 9pt

### Layout
- **Three overlapping circles** (CMYK primary colors) in center third
- Each circle uses `multiply` blend mode — overlaps create secondary colors naturally
- **Offset ghost text** behind main title (3–4pt shift, low opacity, accent color)
- Main title centered above circles
- Monospace caption at bottom

### Signature Elements
- Three overlapping multiply-blend circles
- Offset ghost title (registration mark error simulation)
- Warm paper background

### CSS Variables
```css
--style-bg: #F7F2E8;
--style-primary: #E8344A;
--style-accent: #0D5C9E;
--style-text: #1A1A1A;
--style-text-secondary: #555555;
```

### Avoid
- Digital-looking crisp shapes
- Dark backgrounds
- Screen-blend mode (must be multiply for authentic CMYK overlap)

---

## 🎨 카테고리 3: 컬러풀 계열

---

## 02. Neo-Brutalism

**Mood**: Bold, raw, provocative, startup energy
**Best For**: Startup pitches, marketing campaigns, creative agencies
**카테고리**: 🎨 컬러풀 계열 | **빔프로젝터**: A | **인쇄 친화도**: 중간

### Background
- High-saturation solid: Yellow `#F5F500`, Lime `#CCFF00`, Hot pink `#FF2D55`
- Or pure white `#FFFFFF`

### Colors
| Role | Color | HEX |
|------|-------|-----|
| Background | Primary yellow/lime | `#F5F500` or `#CCFF00` |
| Card fill | White or black | `#FFFFFF` / `#000000` |
| Border & shadow | Pure black | `#000000` |
| Accent | Red or blue | `#FF3B30` / `#0000FF` |
| Text | Black | `#000000` |

### Fonts
- Title: **Arial Black / Impact / Bebas Neue**, 40–56pt
- Body: **Courier New / Space Mono**, 13–16pt
- Numbers: 72–96pt Arial Black

### Layout
- **Thick black borders** on all elements (2–4pt solid black)
- **Hard offset shadow** bottom-right of every card (5–8pt, no blur)
- Slight intentional misalignment — tilted shapes allowed

### Signature Elements
- Hard drop shadow (no blur, pure black offset)
- Thick border on every element
- One oversized number or word breaking the layout

### CSS Variables
```css
--style-bg: #F5F500;
--style-primary: #000000;
--style-accent: #FF3B30;
--style-text: #000000;
--style-text-secondary: #333333;
```

### Avoid
- Soft shadows or gradients
- Rounded corners
- Pastel or muted colors

---

## 05. Gradient Mesh

**Mood**: Artistic, vibrant, sensory, brand-forward
**Best For**: Brand launches, creative portfolios, music/film promotions
**카테고리**: 🎨 컬러풀 계열 | **빔프로젝터**: B | **인쇄 친화도**: 낮음

### Background
- Multi-point radial gradient blend (4–6 colors overlapping)
- Example: `#FF6EC7` + `#7B61FF` + `#00D4FF` + `#FFB347` bleeding into each other

### Colors
| Role | Color | HEX |
|------|-------|-----|
| Mesh node 1 | Hot pink | `#FF6EC7` |
| Mesh node 2 | Violet | `#7B61FF` |
| Mesh node 3 | Cyan | `#00D4FF` |
| Mesh node 4 | Warm orange | `#FFB347` |
| Text | Pure white | `#FFFFFF` |

### Fonts
- Title: **Bebas Neue / Barlow Condensed ExtraBold**, 48–72pt
- Body: **Outfit / Poppins Light**, 14–16pt
- All text white with subtle drop shadow for legibility

### Layout
- Full-bleed gradient as background
- Minimal text overlay — let the gradient breathe
- Large centered title, small subtitle below
- Optional: frosted glass card for body text

### Signature Elements
- Multi-radial gradient that feels painterly, not linear
- White text with drop shadow
- Large typographic element dominating

### CSS Variables
```css
--style-bg: #7B61FF;
--style-primary: #FFFFFF;
--style-accent: #FF6EC7;
--style-text: #FFFFFF;
--style-text-secondary: rgba(255, 255, 255, 0.8);
```

### Avoid
- Linear two-color gradients (too plain)
- Dark or muted text
- Overcrowded layouts

---

## 06. Claymorphism

**Mood**: Friendly, soft 3D, tactile, playful
**Best For**: Product launches, education, children's content, app UI decks
**카테고리**: 🎨 컬러풀 계열 | **빔프로젝터**: A | **인쇄 친화도**: 중간

### Background
- Warm pastel gradient: `#FFECD2 → #FCB69F` or `#E0F7FA → #B2EBF2`

### Colors
| Role | Color | HEX |
|------|-------|-----|
| Background | Warm peach gradient | `#FFECD2` → `#FCB69F` |
| Clay element 1 | Soft teal | `#A8EDEA` |
| Clay element 2 | Blush pink | `#FED6E3` |
| Clay element 3 | Warm yellow | `#FFEAA7` |
| Shadow | Color-matched shadow | element color @ 50%, offset 8–12pt down |

### Fonts
- Title: **Nunito ExtraBold / Rounded Mplus**, 32–48pt
- Body: **Nunito / DM Sans**, 14–16pt
- Icon labels: 11–13pt medium

### Layout
- **3D rounded shapes** as primary containers (radius 20–32pt equivalent)
- Each element casts a **colored drop shadow** (same hue, shifted down, no X offset)
- Inner highlight on top edge (white, 30% opacity)
- Playful asymmetric arrangement of clay bubbles

### Signature Elements
- Colored soft shadow (not grey) matching element color
- Very high border radius
- Inner highlight stripe at top of each element

### CSS Variables
```css
--style-bg: #FFECD2;
--style-primary: #A8EDEA;
--style-accent: #FED6E3;
--style-text: #333333;
--style-text-secondary: #666666;
```

### Avoid
- Sharp corners
- Grey/neutral shadows
- Flat design elements mixed in

---

## 12. Duotone / Color Split

**Mood**: Dramatic, comparative, energetic, bold
**Best For**: Strategy decks, before/after, compare/contrast slides
**카테고리**: 🎨 컬러풀 계열 | **빔프로젝터**: B | **인쇄 친화도**: 중간

### Background
- Left half: vivid orange-red `#FF4500`
- Right half: deep navy `#1A1A2E`

### Colors
| Role | Color | HEX |
|------|-------|-----|
| Left panel | Orange-red | `#FF4500` |
| Right panel | Deep navy | `#1A1A2E` |
| Divider | White | `#FFFFFF` |
| Left text | White | `#FFFFFF` |
| Right text | Matches left panel color | `#FF4500` |

### Fonts
- Panel text: **Bebas Neue**, 40–56pt, vertical writing-mode optional
- Caption: **Space Mono**, 9pt

### Layout
- Strict **50/50 vertical split** with white divider line (2–4pt)
- Each panel shows one concept, one word, or one data point
- Text in left panel = white; text in right panel = left panel color
- Optional: diagonal split instead of vertical

### Signature Elements
- Exact 50/50 split
- White divider line
- Cross-panel color echo (right text = left panel color)

### CSS Variables
```css
--style-bg: #FF4500;
--style-primary: #1A1A2E;
--style-accent: #FFFFFF;
--style-text: #FFFFFF;
--style-text-secondary: rgba(255, 255, 255, 0.8);
```

### Avoid
- Three or more color panels
- Similar hues (needs strong contrast)
- Busy content — one idea per panel

---

## 16. Pastel Soft UI

**Mood**: Gentle, modern app, healthcare-friendly
**Best For**: Healthcare, beauty, education startups, consumer apps
**카테고리**: 🎨 컬러풀 계열 | **빔프로젝터**: B | **인쇄 친화도**: 중간

### Background
- Soft tricolor gradient: `#FCE4F3 → #E8F4FF → #F0FCE4`

### Colors
| Role | Color | HEX |
|------|-------|-----|
| Background | Soft tricolor gradient | pink → blue → mint |
| Card fill | White semi-transparent | `#FFFFFF` @ 70% |
| Card border | White | `#FFFFFF` @ 90% |
| Dot accent 1 | Blush pink | `#F9C6E8` |
| Dot accent 2 | Sky blue | `#C6E8F9` |

### Fonts
- Title: **Nunito Bold / DM Sans Medium**, 28–36pt
- Body: **Nunito / DM Sans**, 13–15pt
- Labels: **Inter**, 11pt

### Layout
- Floating frosted-white cards on gradient background
- Large circle card (pill shape) as central element
- Small decorative blobs in opposite corners
- Cards have soft colored box-shadows (color-matched to blobs)

### Signature Elements
- Frosted white card (70% opacity, white border)
- Pastel tricolor gradient background
- Soft color-matched shadows

### CSS Variables
```css
--style-bg: #FCE4F3;
--style-primary: #555555;
--style-accent: #F9C6E8;
--style-text: #333333;
--style-text-secondary: #666666;
```

### Avoid
- Dark backgrounds
- Saturated or primary colors
- Hard drop shadows

---

## 23. Stained Glass Mosaic

**Mood**: Vibrant, artistic, cathedral richness
**Best For**: Cultural institutions, museums, arts organizations, creative festivals
**카테고리**: 🎨 컬러풀 계열 | **빔프로젝터**: C | **인쇄 친화도**: 낮음

### Background
- Near-black grid frame: `#0A0A12`

### Colors
| Role | Color | HEX |
|------|-------|-----|
| Background | Near-black (grout) | `#0A0A12` |
| Cell 1 | Deep royal blue | `#1A3A6E` |
| Cell 2 | Crimson | `#E63030` |
| Cell 3 | Golden yellow | `#F5D020` |
| Cell 4 | Forest green | `#2A6E1A` |
| Cell 5 | Deep purple | `#6E1A4E` |
| Overlay | Dark translucent | `#000000` @ 30% |

### Fonts
- Title overlay: **Cormorant Garamond Bold / Trajan**, 16–22pt, wide spacing
- Body (below mosaic): **Georgia**, 13–15pt

### Layout
- **6×4 (or similar) mosaic grid** covering full slide — 2pt dark gap between cells
- Cells vary in color following a stained-glass color rhythm
- Semi-transparent dark overlay to darken and unify
- Slide title rendered as overlay text at bottom (light, wide-spaced)

### Signature Elements
- Dark "grout" gaps between all cells
- No two adjacent cells the same color
- Translucent overlay for text legibility

### CSS Variables
```css
--style-bg: #0A0A12;
--style-primary: #E63030;
--style-accent: #F5D020;
--style-text: #FFFFFF;
--style-text-secondary: rgba(255, 255, 255, 0.8);
```

### Avoid
- Pastel or muted cell colors
- Large empty cells
- Sans-serif overlay text

---

## 🎓 카테고리 4: 한국 교육 특화

---

## 31. Soft Pink Card UI (학교사업안내-학부모)

**Mood**: 따뜻한, 신뢰감, 교육적, 여성적 우아함
**Best For**: 학부모 대상 학교 안내, 교육 프레젠테이션, 여자고등학교 발표자료
**카테고리**: 🎓 한국 교육 특화 | **빔프로젝터**: B | **인쇄 친화도**: 중간

### Background
- Soft pink: `#F4CED3`
- 배경 장식: 고정 원형 그라데이션 3개 (pink-mid, cream 반투명, red 얇은 테두리)

### Colors
| Role | Color | HEX |
|------|-------|-----|
| Page background | Pink light | `#F4CED3` |
| Card frame background | Cream | `#F3F3E9` |
| Default card | White | `#FFFFFF` |
| Pink card | Pink light | `#F4CED3` |
| Cream card | Cream dark | `#EDE2E2` |
| Accent card (CTA) | Red | `#E33529` |
| Pink mid (decorative) | Pink mid | `#F0B5BE` |
| Pink deep | Pink deep | `#E8A0AD` |
| Title / emphasis | Red | `#E33529` |
| Body text | Brown | `#924E26` |
| Dark heading | Brown dark | `#693413` |
| Highlight text (on red card) | Yellow | `#FFF500` |
| Secondary accent | Teal | `#2B6786` |
| Near-black | Black | `#1A1A1A` |

### Fonts
- Display: **Bayon** (Google Fonts), uppercase, letter-spacing 0.02em, line-height 0.95, color red
- Body: **DM Sans** + **Noto Sans KR**, regular weight
- Base font-size: `clamp(16px, 1.5vw, 28px)` (빔프로젝터 가독성 최적화)
- h1: 2.8rem/800, h2: 1.5rem/700, h3: 1.15rem/700
- p/desc: 1rem, line-height 1.65
- desc-sm: 0.88rem (보조 텍스트 최소)
- bullet-list li: 0.95rem
- badge: 0.82rem, club-desc/tl-desc: 0.8rem (절대 최소)
- Big numbers: Bayon 3.5rem (sm: 2.4rem)
- Section number: Bayon 2.2rem, red, opacity 0.2
- **⚠️ 0.8rem 미만 텍스트 금지** — 빔프로젝터 가독성 확보

### Layout
- **macOS-style card frame**: cream 배경, border-radius 1.8rem, 상단에 3색 점 (🔴🟡🟢) + 영문 타이틀
- Frame body: padding 1.6rem 2.2rem, flex column
- 슬라이드 내부는 flex-row + gap-md (0.9rem)으로 카드 배치
- 커버/엔딩은 card-frame 없이 전체 화면 사용
- max-width: 1500px

### Signature Elements
- **macOS 창 프레임** — 상단 dot-r/dot-y/dot-g + Bayon 영문 타이틀 바
- **기울어진 카드** — `.card-tilt` rotate(-2deg), `.card-tilt-r` rotate(1.5deg), hover시 rotate(0)
- **순차 popUp 애니메이션** — 0.08s 간격 딜레이 (anim-up, anim-up-d1~d5)
- **섹션 번호** — Bayon 대형 숫자, opacity 0.2, 좌측 배치
- **빨간 강조 카드** — `.card-red` 배경에 노란색 하이라이트 텍스트
- **커버 아웃라인 텍스트** — cream 색상 + `-webkit-text-stroke: 2px red`
- **Step 번호** — 카드 우상단 Bayon, opacity 0.15
- **Bullet dot** — 7px 빨간 원형 도트 리스트

### Component Reference

**Badges**: 둥근 알약형 (border-radius 2rem), 0.82rem, 700 weight
- `.badge-red`: red bg + white text
- `.badge-pink`: pink-mid bg + red-dark text
- `.badge-cream`: cream-dark bg + brown-dark text
- `.badge-teal`: teal 12% bg + teal text

**Club Grid**: flex로 5개 아이템 균등 배치, 홀수 rotate(-1deg), 짝수 rotate(1deg), 우상단에 Bayon 번호 (opacity 0.08)

**Timeline**: flex 가로 배치, 상단에 가로 그라데이션 라인 (red → pink → red, opacity 0.2), 14px dot (border 3px solid red)

**Cover Pills**: 흰색 둥근 알약 (border-radius 3rem, box-shadow), emoji + 텍스트

**Navigation**: 하단 고정, cream 반투명 backdrop-filter blur, 원형 ◀▶ 버튼 (border 2px red), 슬라이드 번호 직접 입력 가능

### Animations
```
popUp:   translateY(25px) → translateY(0), opacity 0→1, 0.55s ease-out
scaleUp: scale(0.92) → scale(1), opacity 0→1, 0.5s ease-out
tiltIn:  rotate(-3deg) translateY(20px) → rotate(0) translateY(0), 0.6s ease-out
```

### Responsive
- ≤1024px: font clamp(13px, 1.8vw, 18px), 패딩 축소, club-grid wrap
- ≤768px: flex-row → column, card border-radius 1rem, bg-circle 숨김, cover-deco 숨김
- ≤480px: card padding 0.9rem, nav-btn 2.2rem, cover-pill 100% width

### CSS Variables
```css
--style-bg: #F4CED3;
--style-primary: #E33529;
--style-accent: #2B6786;
--style-text: #924E26;
--style-text-secondary: #693413;
```

### Avoid
- 차가운 색상 (파란계열 주도)
- 각진 모서리 (항상 border-radius 1.2rem 이상)
- 그림자 없는 밋밋한 레이아웃
- card-frame 없는 내용 슬라이드 (커버/엔딩 제외)

---

## 32. K-에듀 클린 (K-Edu Clean)

**Mood**: 전문적, 신뢰감, 체계적, 현대적
**Best For**: 교사 수업 발표, 학교 공식 보고, 교육청 제출 자료, 수업 계획서
**카테고리**: 🎓 한국 교육 특화 | **빔프로젝터**: A | **인쇄 친화도**: 높음

### Background
- 밝은 블루-화이트: `#F0F4FF`
- 섹션 헤더: 딥 블루 `#1A3A6B` 풀-너비 바

### Colors
| Role | Color | HEX |
|------|-------|-----|
| 페이지 배경 | 블루-화이트 | `#F0F4FF` |
| 섹션 헤더 바 | 딥 블루 | `#1A3A6B` |
| 헤더 텍스트 | 화이트 | `#FFFFFF` |
| 주요 강조 | 미디엄 블루 | `#2E5FA3` |
| 보조 강조 | 틸 | `#0B8A7A` |
| 콘텐츠 카드 | 화이트 | `#FFFFFF` |
| 본문 텍스트 | 니어-블랙 | `#1A1A2E` |
| 보조 텍스트 | 블루-그레이 | `#5A6A8A` |
| 구분선 | 라이트 블루 | `#C5D5F0` |

### Fonts
- 제목: **Noto Sans KR Bold**, 28–40pt
- 소제목: **Noto Sans KR Medium**, 18–22pt
- 본문: **Noto Sans KR Regular**, 14–16pt
- 캡션/라벨: **Noto Sans KR Regular**, 11–12pt
- **⚠️ 최소 12pt 이상** — 빔프로젝터 가독성 필수
- 영문 보조: **Inter / DM Sans**

### Layout
- 상단 딥 블루 헤더 바 (전체 너비, 패딩 1rem 2rem): 슬라이드 제목 + 페이지 번호
- 좌측 강조 바 (4–6pt 딥 블루 세로선): 콘텐츠 섹션 구분
- 콘텐츠 영역: 화이트 카드, 4–8pt 라이트 블루 shadow, border-radius 0.5rem
- 하단 얇은 구분선 + 학교명/날짜 캡션
- 그리드: 2–3단 균등 분할

### Signature Elements
- **딥 블루 헤더 바** — 모든 슬라이드 공통, 좌측에 학교 로고 공간 확보
- **좌측 강조 세로선** — 4–6pt 딥 블루, 섹션별 색상 변경 가능
- **포인트 넘버링** — 미디엄 블루 원형 배지 (① ② ③)
- **틸 강조 텍스트** — 핵심 키워드, 수치, 성과 표시
- **화이트 카드 그리드** — 그림자 있는 카드형 콘텐츠 블록

### CSS Variables
```css
--style-bg: #F0F4FF;
--style-primary: #1A3A6B;
--style-accent: #0B8A7A;
--style-text: #1A1A2E;
--style-text-secondary: #5A6A8A;
```

### Avoid
- 과도한 색상 혼용 (블루 계열 1–2가지 유지)
- 12pt 미만 텍스트
- 둥근 모서리 과다 사용 (미니멀 유지)
- 장식적 일러스트 (데이터/정보 중심 유지)

---

## 33. 디지털 교과서 (Digital Textbook)

**Mood**: 체계적, 학습 친화, 명확한 위계, 교육적
**Best For**: 수업 자료, 교과 연계 발표, 학습 목표 안내, 개념 설명
**카테고리**: 🎓 한국 교육 특화 | **빔프로젝터**: A | **인쇄 친화도**: 높음

### Background
- 순백 화이트: `#FFFFFF`
- 섹션 구분: 라이트 그레이 `#F5F7FA`

### Colors
| Role | Color | HEX |
|------|-------|-----|
| 페이지 배경 | 화이트 | `#FFFFFF` |
| 섹션 구분 배경 | 라이트 그레이 | `#F5F7FA` |
| 주 강조 (교과 포인트) | 오렌지 | `#F27321` |
| 보조 강조 (정보/링크) | 블루 | `#1B7ED4` |
| 정의 박스 | 크림 옐로 | `#FFFDE7` |
| 정의 박스 테두리 | 옐로 | `#FFD600` |
| 핵심 요약 박스 | 라이트 블루 | `#E3F2FD` |
| 핵심 요약 테두리 | 블루 | `#1B7ED4` |
| 본문 텍스트 | 다크 | `#222222` |
| 보조 텍스트 | 미디엄 그레이 | `#666666` |
| 넘버링 | 오렌지 | `#F27321` |

### Fonts
- 단원 제목: **Noto Sans KR Bold**, 30–38pt
- 학습 목표/소제목: **Noto Sans KR Medium**, 18–22pt
- 본문: **Noto Sans KR Regular / Noto Serif KR**, 14–16pt
- 정의/중요 텍스트: **Noto Sans KR Medium**, 13–15pt
- 캡션: **Noto Sans KR Regular**, 11–12pt
- **⚠️ 본문 최소 14pt** — 교실 후방 가독성

### Layout
- 상단 컬러 강조 바 (오렌지 또는 블루, 6–8pt 높이): 단원/차시 표시
- **정의 박스**: 크림 배경 + 노란 좌측 보더 (4pt), 둥근 모서리 0.3rem
- **핵심 요약 박스**: 라이트 블루 배경 + 블루 좌측 보더, 체크리스트 형식
- **학습 목표**: 번호 + 텍스트 리스트, 오렌지 넘버링
- **2단 레이아웃**: 좌측 개념 설명 (60%), 우측 예시/그림 (40%)
- 하단 페이지/차시 표시

### Signature Elements
- **컬러 강조 바** — 상단 얇은 바로 단원/교과 색상 표시
- **정의 박스** — 크림+노란 테두리의 용어 정의 영역
- **핵심 요약 박스** — 파란 테두리의 학습 요약
- **오렌지 넘버링** — ①②③ 학습 목표 및 단계 표시
- **예시 카드** — 회색 배경의 예시/문제 블록

### CSS Variables
```css
--style-bg: #FFFFFF;
--style-primary: #F27321;
--style-accent: #1B7ED4;
--style-text: #222222;
--style-text-secondary: #666666;
```

### Avoid
- 복잡한 배경 패턴 (콘텐츠에 집중)
- 14pt 미만 본문 텍스트
- 과도한 색상 (오렌지+블루 2색 체계 유지)
- 그라데이션 배경 (인쇄 시 잉크 낭비)

---

## 34. 교실 칠판 (Classroom Blackboard)

**Mood**: 친근한, 복고적, 교육적 향수, 따뜻한
**Best For**: 학생 발표, 국어/역사/사회 수업, 노스탤지아 테마, 선생님 이야기
**카테고리**: 🎓 한국 교육 특화 | **빔프로젝터**: B | **인쇄 친화도**: 낮음

### Background
- 칠판 그린: `#1A3A2A`
- 어두운 변형: `#162D20`

### Colors
| Role | Color | HEX |
|------|-------|-----|
| 배경 | 칠판 그린 | `#1A3A2A` |
| 분필 화이트 | 오프-화이트 | `#F5F5F0` |
| 분필 옐로 (강조) | 분필 노랑 | `#FFE680` |
| 분필 핑크 (부제목) | 분필 분홍 | `#FFB6C1` |
| 분필 블루 (정보) | 분필 파랑 | `#80BFFF` |
| 밑줄/구분선 | 화이트 저불투명 | `rgba(245,245,240,0.4)` |
| 본문 텍스트 | 분필 화이트 | `#F5F5F0` |
| 보조 텍스트 | 저불투명 화이트 | `rgba(245,245,240,0.7)` |
| 테두리 (칠판 테) | 다크 우드 브라운 | `#2C1810` |

### Fonts
- 제목: **Noto Sans KR Bold**, 32–44pt (분필 효과 텍스트 shadow)
- 소제목: **Noto Sans KR Medium**, 20–24pt, 분필 핑크
- 본문: **Noto Serif KR / Noto Sans KR**, 14–16pt
- 강조 텍스트: **Noto Sans KR Bold**, 분필 노랑
- 날짜/번호: **Space Mono**, 12pt
- **⚠️ 텍스트에 약한 blur 또는 opacity 변화** — 분필 효과 연출

### Layout
- 칠판 테두리 (우드 브라운 10–16pt 프레임) — 전체 슬라이드 둘러싸기
- **손글씨 스타일 제목** — 불규칙한 베이스라인 (±2pt 오프셋)
- **분필 밑줄** — 제목/섹션 구분, 2pt 화이트 저불투명 곡선
- **칠판 지운 흔적** — 배경에 옅은 사각형 흔적 (whitish 3% opacity)
- 좌상단: 날짜 (Space Mono, 분필 노랑)
- **2–3열 콘텐츠** 또는 중앙 단일 레이아웃

### Signature Elements
- **우드 프레임 테두리** — 전통 칠판 느낌
- **분필 텍스트 효과** — text-shadow: 1px 1px 2px rgba(255,255,255,0.3)
- **컬러 분필 구분** — 화이트(일반)/노랑(강조)/핑크(제목)/파랑(정보)
- **칠판 지운 흔적** — 배경 반투명 사각형
- **손으로 쓴 느낌** — 폰트 transform rotate ±1–2°

### CSS Variables
```css
--style-bg: #1A3A2A;
--style-primary: #F5F5F0;
--style-accent: #FFE680;
--style-text: #F5F5F0;
--style-text-secondary: rgba(245, 245, 240, 0.75);
```

### Avoid
- 날카롭고 깔끔한 현대 디자인 요소
- 파스텔 또는 밝은 배경색
- 색상 과다 사용 (분필 4색 이내 유지)
- 인쇄용으로 제출 시 (잉크 과다 사용)
