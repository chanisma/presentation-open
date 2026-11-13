---
description: "한국 교육용 프레젠테이션 HTML 페이지를 생성합니다. 프레젠테이션, 발표자료, 슬라이드, PPT 대체, 수업자료, 학교 발표, 교육 프레젠테이션을 만들고 싶을 때 사용하세요. '발표자료 만들어줘', '프레젠테이션 생성', '슬라이드 제작', '수업 PPT' 등의 요청에 반드시 이 스킬을 사용하세요."
allowed-tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep", "WebFetch", "AskUserQuestion"]
---

# Presentation Builder - 한국 교육용 프레젠테이션 생성기

단일 HTML 파일로 아름다운 프레젠테이션을 생성하는 스킬입니다.
브라우저 윈도우 크롬 스타일의 카드 기반 디자인을 사용하며, 반응형이고 터치/키보드/마우스 휠/프레젠터 클리커 네비게이션을 지원합니다.

---

## 1단계: 설정 인터뷰

프레젠테이션을 생성하기 전에 반드시 사용자에게 설정을 확인하세요. AskUserQuestion 도구를 활용하여 아래 항목들을 체계적으로 수집합니다.

### 필수 수집 항목

**기본 정보:**
- 프레젠테이션 제목
- 부제목 (선택)
- 발표 대상 (예: 교사, 학생, 학부모)
- 학교/기관명 (선택)

**내용 설정:**
- 주제 및 핵심 내용 (사용자가 내용을 제공하거나, 주제만 주면 자동 구성)
- 원하는 슬라이드 수 (기본: 8~12장)
- 포함할 슬라이드 유형 (아래 컴포넌트 카탈로그 참조)

### 선택 설정 (AskUserQuestion으로 확인)

아래 설정들은 사용자가 별도 요청이 없으면 기본값을 사용하되, "세팅을 자세히 하고 싶다"거나 "커스터마이징" 요청 시 하나씩 물어보세요.

**디자인 스타일 (30가지 모던 스타일):**

사용자에게 프레젠테이션 분위기/목적을 물어보고, 아래 추천 매트릭스를 참고하여 스타일을 제안하세요.
스타일이 선택되면 반드시 `.claude/commands/references/styles.md`를 읽어서 해당 스타일의 상세 스펙(배경, 컬러, 폰트, 레이아웃, 시그니처 요소)을 적용합니다.

| 프레젠테이션 목적 | 추천 스타일 |
|-------------------|------------|
| 테크 / AI / 스타트업 | Glassmorphism, Aurora Neon, Cyberpunk Outline, SciFi Holographic |
| 기업 / 컨설팅 / 금융 | Swiss International, Monochrome Minimal, Editorial Magazine, Architectural Blueprint |
| 교육 / 연구 / 역사 | Dark Academia, Nordic Minimalism, Brutalist Newspaper |
| 브랜드 / 마케팅 | Gradient Mesh, Typographic Bold, Duotone Split, Risograph Print |
| 제품 / 앱 / UX | Bento Grid, Claymorphism, Pastel Soft UI, Liquid Blob |
| 엔터테인먼트 / 게임 | Retro Y2K, Dark Neon Miami, Vaporwave, Memphis Pop |
| 에코 / 웰니스 / 문화 | Hand-crafted Organic, Nordic Minimalism, Dark Forest Nature |
| IT 인프라 / 아키텍처 | Isometric 3D Flat, Cyberpunk Outline, Architectural Blueprint |
| 포트폴리오 / 아트 / 크리에이티브 | Monochrome Minimal, Editorial Magazine, Risograph Print, Maximalist Collage |
| 피치덱 / 전략 | Neo-Brutalism, Duotone Split, Bento Grid, Art Deco Luxe |
| 럭셔리 / 이벤트 / 갈라 | Art Deco Luxe, Monochrome Minimal, Dark Academia |
| 과학 / 바이오텍 / 혁신 | Liquid Blob, SciFi Holographic, Aurora Neon |

**사용 가능한 30가지 스타일:**

| # | 스타일명 | 분위기 | 적합 용도 |
|---|---------|--------|----------|
| 01 | Glassmorphism | 프리미엄 · 테크 | SaaS, AI 제품 |
| 02 | Neo-Brutalism | 대담 · 스타트업 | 피치덱, 마케팅 |
| 03 | Bento Grid | 모듈 · 구조적 | 기능 소개 |
| 04 | Dark Academia | 학술 · 고풍 | 교육, 연구 |
| 05 | Gradient Mesh | 예술 · 생동감 | 브랜드 런칭 |
| 06 | Claymorphism | 친근 · 3D | 앱, 교육 |
| 07 | Swiss International | 기능적 · 기업 | 컨설팅, 금융 IR |
| 08 | Aurora Neon Glow | 미래 · AI | AI, 사이버보안 |
| 09 | Retro Y2K | 레트로 · 팝 | 이벤트, 마케팅 |
| 10 | Nordic Minimalism | 차분 · 자연 | 웰니스, 비영리 |
| 11 | Typographic Bold | 에디토리얼 · 임팩트 | 브랜드 선언 |
| 12 | Duotone Color Split | 드라마틱 · 대비 | 전략, 비교 |
| 13 | Monochrome Minimal | 절제 · 럭셔리 | 럭셔리 브랜드 |
| 14 | Cyberpunk Outline | HUD · SF | 게임, 인프라 |
| 15 | Editorial Magazine | 매거진 · 서사 | 연간 리뷰 |
| 16 | Pastel Soft UI | 소프트 · 앱 | 헬스케어, 뷰티 |
| 17 | Dark Neon Miami | 신스웨이브 · 80s | 엔터테인먼트, 음악 |
| 18 | Hand-crafted Organic | 자연 · 에코 | 에코 브랜드, 식품 |
| 19 | Isometric 3D Flat | 기술 · 구조적 | IT 아키텍처 |
| 20 | Vaporwave | 몽환 · 서브컬처 | 크리에이티브 에이전시 |
| 21 | Art Deco Luxe | 골드 · 기하학 | 럭셔리, 갈라 이벤트 |
| 22 | Brutalist Newspaper | 에디토리얼 · 로 | 미디어, 연구 |
| 23 | Stained Glass Mosaic | 화려 · 예술적 | 문화, 뮤지엄 |
| 24 | Liquid Blob Morphing | 유기 · 바이오테크 | 바이오텍, 혁신 |
| 25 | Memphis Pop Pattern | 80s · 기하학 | 패션, 라이프스타일 |
| 26 | Dark Forest Nature | 신비 · 분위기 | 에코 프리미엄, 어드벤처 |
| 27 | Architectural Blueprint | 기술 · 정밀 | 건축, 계획 |
| 28 | Maximalist Collage | 에너지 · 레이어 | 광고, 패션 |
| 29 | SciFi Holographic Data | 홀로그램 · HUD | AI, 양자, 국방 |
| 30 | Risograph Print | CMYK · 인디 | 출판, 아트, 음악 |

> **스타일 미선택 시**: 기본 테마(아래)를 사용합니다. 스타일을 선택하면 아래 기본 테마 대신 스타일 스펙이 적용됩니다.

**기본 테마 설정 (스타일 미선택 시):**

| 설정 | 옵션 | 기본값 |
|------|------|--------|
| 컬러 테마 | `green`, `blue`, `purple`, `orange`, `navy`, `rose`, `custom` | `green` |
| 폰트 | `noto-sans-kr`, `pretendard`, `wanted-sans`, `gmarket-sans` | `noto-sans-kr` |
| 카드 스타일 | `browser` (macOS 윈도우), `minimal` (깔끔), `rounded` (둥근 모서리) | `browser` |
| 배경색 | 테마 메인 컬러 또는 커스텀 HEX | 테마 기본 |

**레이아웃 설정:**

| 설정 | 옵션 | 기본값 |
|------|------|--------|
| 콘텐츠 밀도 | `compact`, `normal`, `spacious` | `normal` |
| 최대 너비 | `1200px`, `1400px`, `1600px`, `full` | `1600px` |
| 이미지 스타일 | `emoji` (이모지 아이콘), `placeholder` (빈 이미지 박스), `url` (실제 이미지) | `emoji` |

**네비게이션 설정:**

| 설정 | 옵션 | 기본값 |
|------|------|--------|
| 네비 위치 | `bottom`, `top`, `hidden` | `bottom` |
| 프로그레스바 | `top`, `bottom`, `hidden` | `top` |
| 키보드 네비게이션 | `on`, `off` | `on` |
| 프레젠터 클리커 | `on`, `off` | `on` |
| 마우스 휠 네비게이션 | `on`, `off` | `on` |
| 터치 스와이프 | `on`, `off` | `on` |
| 슬라이드 번호 표시 | `on`, `off` | `on` |

**추가 기능:**

| 설정 | 옵션 | 기본값 |
|------|------|--------|
| QR 코드 | `on` (표지+마지막), `cover-only`, `end-only`, `off` | `off` |
| 전환 효과 | `fade`, `slide`, `none` | `fade` |
| 자동 재생 | `off`, `5s`, `10s`, `15s`, `30s` | `off` |
| 인쇄 스타일 | `on`, `off` | `off` |
| 다크모드 토글 | `on`, `off` | `off` |
| 발표자 노트 | `on`, `off` | `off` |
| 전체화면 버튼 | `on`, `off` | `off` |

---

## 2단계: 디자인 스타일 & 컬러 테마 시스템

### 모던 디자인 스타일 적용 (30가지)

사용자가 1단계에서 디자인 스타일을 선택한 경우, 아래 워크플로우를 따릅니다:

1. **스펙 로딩**: `.claude/commands/references/styles.md`에서 선택된 스타일의 상세 스펙을 Read로 읽기
2. **배경 적용**: 스타일의 Background 스펙을 `body` 및 `.slide` 배경에 적용
3. **컬러 매핑**: 스타일의 Colors를 CSS 변수로 변환
   ```css
   :root {
     --style-bg: /* Background HEX */;
     --style-primary: /* Primary color */;
     --style-accent: /* Accent color */;
     --style-text: /* Text color */;
     --style-text-secondary: /* Secondary text */;
   }
   ```
4. **폰트 적용**: 스타일 스펙의 Font를 Google Fonts CDN으로 로딩, 기존 폰트 설정 대체
5. **레이아웃 변환**: 스타일의 Layout/Signature Elements를 슬라이드 구조에 반영
   - 카드 스타일(`browser`/`minimal`/`rounded`)은 스타일과 조화되도록 자동 조정
   - 예: Glassmorphism → 카드를 frosted glass 처리, Cyberpunk → 카드에 neon border
6. **시그니처 요소**: 각 슬라이드에 스타일의 Signature Elements를 최소 1개 포함
7. **금지 사항**: 스타일의 Avoid 항목을 반드시 준수

**스타일-카드 호환 매핑:**

| 스타일 계열 | 권장 카드 스타일 | 카드 변형 |
|------------|-----------------|----------|
| 다크 배경 (Aurora, Cyberpunk, Vaporwave 등) | `minimal` | 반투명 dark panel, neon/glow border |
| 글래스 계열 (Glassmorphism, Pastel Soft UI) | `rounded` | frosted glass, backdrop-filter |
| 에디토리얼 (Swiss, Editorial, Brutalist) | `minimal` | thin border, serif 타이포 강조 |
| 유기적 (Nordic, Organic, Dark Forest) | `rounded` | soft shadow, organic shape |
| 팝/레트로 (Y2K, Memphis, Neo-Brutalism) | `browser` | thick border, hard shadow |
| 럭셔리 (Art Deco, Monochrome, Dark Academia) | `minimal` | gold/thin border, wide spacing |

### 기본 프리셋 테마 (스타일 미선택 시)

스타일을 선택하지 않은 경우, 아래 기본 테마를 사용합니다.
각 테마는 CSS 변수로 정의됩니다. `--main`이 배경색, `--dark`가 강조색, `--light`가 연한 배경입니다.

```
green:  --main: #3aaa5c  --dark: #2d8a49  --light: #e8f5e9  --accent: #43b867
blue:   --main: #2196f3  --dark: #1565c0  --light: #e3f2fd  --accent: #42a5f5
purple: --main: #7c4dff  --dark: #6200ea  --light: #ede7f6  --accent: #9c27b0
orange: --main: #ff9800  --dark: #e65100  --light: #fff3e0  --accent: #ffb74d
navy:   --main: #1a237e  --dark: #0d1642  --light: #e8eaf6  --accent: #3f51b5
rose:   --main: #e91e63  --dark: #ad1457  --light: #fce4ec  --accent: #f06292
```

`custom` 선택 시 사용자에게 메인 컬러 HEX를 물어보고, 그로부터 dark/light/accent를 자동 생성하세요.

### 보조 컬러 (모든 테마 공통)

뱃지, 인포박스, 보더 등에 사용하는 보조 컬러:
```
blue-accent:   #2196f3 / bg: #e3f2fd
orange-accent: #ff9800 / bg: #fff3e0
purple-accent: #9c27b0 / bg: #f3e5f5
red-accent:    #e53935 / bg: #fce4ec
green-sub:     #43b867 / bg: #e8f5e9
```

---

## 3단계: 슬라이드 컴포넌트 카탈로그

아래 컴포넌트들을 조합하여 슬라이드를 구성합니다. 사용자가 특별히 지정하지 않으면, 내용에 맞게 적절한 컴포넌트를 선택하세요.

### 슬라이드 유형

#### `cover` - 표지 슬라이드
- 연도 뱃지 (둥근 배지에 연도 표시)
- 대제목 (h1, 굵게)
- 부제목 (연한 색상)
- 기관명
- QR 코드 영역 (설정 시)
- 중앙 정렬

#### `toc` - 목차 슬라이드
- 번호가 있는 리스트 (원형 숫자 배지 + 제목 + 설명)
- 클릭 시 해당 슬라이드로 이동 (goToSlide 연결)
- 호버 효과 (배경색 변경 + 살짝 이동)

#### `section-overview` - 섹션 개요
- section-divider (아이콘 + 제목 + 부제)
- highlight-box (강조 문구, 그라데이션 배경)
- grid-2 카드 (아이콘 + 제목 + 설명)
- info-box (보충 설명)

#### `activity-list` - 활동/항목 나열
- 이모지 아이콘 + 제목 + 설명의 리스트
- 선택적으로 사이드에 이미지 배치 (activity-layout)
- 모바일에서는 이미지가 인라인으로 전환

#### `card-grid` - 카드 그리드
- grid-2 또는 grid-3 레이아웃
- 각 카드: 아이콘 + 제목 + 설명
- 균일한 카드 크기

#### `showcase-grid` - 쇼케이스 (5열 그리드)
- club-grid 스타일 (최대 5열)
- 각 항목: 큰 이모지 + 이름 + 짧은 설명
- 호버 효과
- 모바일에서 3열 → 2열 자동 축소

#### `task-list` - 과제/단계 목록
- 번호 + 제목 + 설명의 task-box
- 왼쪽 컬러 보더 (항목마다 다른 색상)
- 순서가 있는 작업 나열에 적합

#### `timeline` - 타임라인
- 가로 배치, 원형 마커 연결
- 각 항목: 월/기간 + 이벤트 설명
- highlight 클래스로 특정 항목 강조 (주황색)
- 모바일에서 3열씩 줄바꿈

#### `comparison` - 비교 테이블
- 표 형태 (th: 테마 dark 배경, 흰색 텍스트)
- 짝수 행 배경색 교대
- 둥근 모서리

#### `deadline-callout` - 마감/강조 알림
- 큰 아이콘 + 날짜/핵심 텍스트 + 설명
- 주황색 테두리, 눈에 띄는 디자인
- 액션 버튼 (링크) 포함 가능

#### `cosware-cards` - 서비스/도구 소개
- 3열 그리드, 각 카드에 고유 배경색
- 이름 + 짧은 설명
- 서비스/플랫폼/도구 소개에 적합

#### `qr-section` - QR 코드 섹션
- 중앙 정렬 QR 이미지
- 라벨 + URL 텍스트
- 표지나 마지막 슬라이드에 포함

#### `end` - 마무리 슬라이드
- 감사 메시지 (h1)
- 마무리 문구
- highlight-box로 핵심 요약
- QR 코드 (설정 시)

#### `stat-highlight` - 통계/수치 강조
- 큰 숫자 + 라벨의 그리드
- highlight-box 스타일
- 핵심 수치를 임팩트 있게 전달

#### `quote` - 인용문/명언
- 큰 따옴표 장식
- 인용 텍스트 (이탤릭, 큰 폰트)
- 출처/화자
- 중앙 정렬

#### `two-column` - 2단 레이아웃
- 좌우 분할 (50:50 또는 60:40)
- 각 열에 독립된 콘텐츠
- 비교, 전후 대비에 적합

#### `image-focus` - 이미지 중심
- 큰 이미지 영역 + 캡션
- 이미지 URL 또는 placeholder
- 사진/도표 설명에 적합

---

## 4단계: HTML 생성 구조

### 기본 HTML 뼈대

반드시 단일 HTML 파일로 생성합니다. 외부 의존성은 Google Fonts CDN만 허용합니다.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{제목}</title>
  <!-- Google Fonts -->
  <style>
    /* 1. Reset & CSS Variables */
    /* 2. Base Typography */
    /* 3. Slide Container & Navigation */
    /* 4. Browser Card Chrome */
    /* 5. Components (badges, info-boxes, grids, etc.) */
    /* 6. Slide-type-specific styles */
    /* 7. Responsive breakpoints */
  </style>
</head>
<body>
  <div class="progress-bar" id="progressBar"></div>
  <div class="presentation" id="presentation">
    <!-- Slides here -->
  </div>
  <!-- Navigation -->
  <div class="nav-bar">
    <button class="nav-btn" id="prevBtn" onclick="prevSlide()" disabled aria-label="이전"><svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg></button>
    <span class="nav-counter"><input type="text" class="slide-input" id="slideInput" value="1" aria-label="슬라이드 번호 입력"> / <span id="totalSlides">N</span></span>
    <button class="nav-btn" id="nextBtn" onclick="nextSlide()" aria-label="다음"><svg viewBox="0 0 24 24"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg></button>
  </div>
  <script>
    // Slide navigation logic
  </script>
</body>
</html>
```

### CSS 설계 원칙

**반응형 폰트 크기** - `clamp()`로 뷰포트 대응:

> **⚠️ 빔프로젝터 가독성 원칙**: 이 프레젠테이션은 빔프로젝터에 투사하여 발표하는 용도입니다.
> 1920x1080 기준 본문 텍스트 최소 22px, 보조 텍스트 최소 20px을 확보해야 합니다.
> **어떤 텍스트도 0.8rem 미만으로 설정하지 마세요.**

```css
html, body {
  font-size: clamp(16px, 1.5vw, 28px); /* 빔프로젝터 가독성 확보 */
}
@media (max-width: 1024px) { font-size: clamp(15px, 2vw, 22px); }
@media (max-width: 768px)  { font-size: clamp(14px, 3vw, 20px); }
@media (max-width: 480px)  { font-size: clamp(14px, 3.5vw, 18px); }
```

**타이포그래피 스케일** (rem 단위, html font-size 기준):
```
h1: 2.4rem / 800 weight
h2: 1.5rem / 700 weight
h3: 1.15rem / 600 weight
p:  1rem / line-height 1.7
보조 텍스트 (desc-sm, caption): 0.88rem (최소)
뱃지, 라벨: 0.82rem (최소)
타임라인 설명 등 가장 작은 텍스트: 0.8rem (절대 최소)
```

**빔프로젝터 폰트 크기 참조표** (base 28px 기준 실제 렌더링 크기):
| rem | 실제 px | 용도 |
|-----|---------|------|
| 2.4rem | 67px | h1 대제목 |
| 1.5rem | 42px | h2 섹션 제목 |
| 1.15rem | 32px | h3 카드 제목 |
| 1rem | 28px | 본문 텍스트 |
| 0.95rem | 27px | 리스트 항목 |
| 0.88rem | 25px | 보조 설명 |
| 0.82rem | 23px | 뱃지, 라벨 |
| 0.8rem | 22px | 절대 최소 (타임라인 설명 등) |

**카드 스타일별 상단바:**
- `browser`: 빨강/노랑/초록 dot 3개 + 중앙 타이틀
- `minimal`: 타이틀만 표시, 얇은 하단 보더
- `rounded`: dot 없이, 더 둥근 모서리(1.5rem), 그림자 강화

### 슬라이드 구조

각 슬라이드는 이 패턴을 따릅니다:
```html
<div class="slide {active if first}" data-slide="{index}">
  <div class="browser-card">
    <div class="browser-topbar">
      <!-- 카드 스타일에 따른 상단바 -->
    </div>
    <div class="browser-content">
      <!-- 슬라이드 콘텐츠 -->
    </div>
  </div>
</div>
```

### 네비게이션 바 CSS

기본 네비게이션 바 스타일 (하단 고정, 중앙 정렬, 컴팩트 디자인):

> **⚠️ 네비게이션 바는 발표 콘텐츠를 가리지 않도록 최소 크기로 유지합니다.**
> 네비 바의 font-size는 본문 rem과 독립적으로 고정 px 사용을 권장합니다.

```css
.nav-bar {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.35rem 1.5rem;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid var(--gray-200);
  z-index: 999;
  font-size: 14px; /* 본문 rem과 독립 */
}
.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.8rem; height: 1.8rem;
  border: 1.5px solid var(--gray-200);
  border-radius: 50%;
  background: var(--white);
  cursor: pointer;
  font-size: 0; /* 텍스트 숨김, SVG만 표시 */
  color: var(--gray-700);
  transition: all 0.2s;
  padding: 0; line-height: 1;
}
.nav-btn svg { width: 0.55rem; height: 0.55rem; fill: currentColor; display: block; }
.nav-btn:hover:not(:disabled) {
  border-color: var(--main);
  background: var(--main);
}
.nav-btn:hover:not(:disabled) svg { fill: var(--white); }
.nav-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.nav-counter {
  font-size: 13px; /* 고정 px — 본문 rem과 독립 */
  font-weight: 700;
  color: var(--gray-600);
  min-width: 3rem;
  text-align: center;
  display: flex; align-items: center; gap: 0.15rem;
  line-height: 1;
}
.slide-input {
  width: 1.4rem; text-align: center; border: none; border-bottom: 1.5px solid transparent;
  background: transparent; font-size: 13px; font-weight: 700; color: inherit;
  font-family: inherit; padding: 0; outline: none; cursor: pointer;
  transition: border-color 0.2s; line-height: 1;
}
.slide-input:hover { border-bottom-color: var(--main); }
.slide-input:focus { border-bottom-color: var(--main); background: var(--light); border-radius: 4px; }
```

### JavaScript 네비게이션

**네비게이션 UI 원칙:**
> - **화살표 버튼은 반드시 SVG 아이콘 사용** — 유니코드 문자(◀▶)는 폰트에 따라 중앙 정렬이 어긋남
> - **네비 바의 font-size는 고정 px (14px)** — 본문 rem 증가에 영향받지 않도록 독립
> - **카운터 텍스트도 고정 px (13px)** + `line-height: 1`로 수직 정렬 일치
> - **네비 바는 최소 크기 유지** — 발표 콘텐츠 영역을 최대한 확보

필수 기능:
- 이전/다음 슬라이드 버튼 (SVG 아이콘: Material Icons chevron_left/chevron_right)
- 키보드: 좌우 화살표, Space, Home, End
- 프레젠터 클리커: PageDown(다음), PageUp(이전) — 로지텍 등 대부분의 무선 클리커 호환
- 마우스 휠: deltaY > 0 → 다음, deltaY < 0 → 이전. 600ms 디바운스로 과도한 연속 이동 방지. `{ passive: false }`로 등록하여 `e.preventDefault()` 호출
- 터치 스와이프 (50px 임계값)
- 프로그레스바 업데이트
- 슬라이드 카운터 업데이트 (input 필드로 직접 페이지 번호 입력하여 이동 가능)
- goToSlide(index) 함수 (목차 클릭용)
- 버튼 disabled 상태 관리
- 페이지 번호 입력 점프: slideInput에 focus → select → 번호 입력 → Enter로 이동, Escape로 취소, blur 시에도 이동 처리, keydown에서 stopPropagation으로 좌우 화살표 충돌 방지

**키보드/클리커 이벤트 핸들러 예시:**
```javascript
document.addEventListener('keydown', (e) => {
  if (e.target === slideInput) return;
  if (['ArrowRight', 'ArrowDown', ' ', 'PageDown'].includes(e.key)) {
    e.preventDefault(); nextSlide();
  } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) {
    e.preventDefault(); prevSlide();
  } else if (e.key === 'Home') { e.preventDefault(); goToSlide(0); }
  else if (e.key === 'End')  { e.preventDefault(); goToSlide(totalSlides - 1); }
});

// 마우스 휠 (디바운스 600ms)
let wheelLocked = false;
document.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (wheelLocked) return;
  wheelLocked = true;
  if (e.deltaY > 0) nextSlide();
  else if (e.deltaY < 0) prevSlide();
  setTimeout(() => { wheelLocked = false; }, 600);
}, { passive: false });
```

선택 기능 (설정에 따라):
- 자동 재생 (setInterval + 일시정지/재개)
- 전체화면 (Fullscreen API)
- 다크모드 토글
- 발표자 노트 (N키로 토글, 오버레이 패널)
- 인쇄 스타일시트 (@media print)

---

## 5단계: 생성 워크플로우

1. **설정 수집**: 위 1단계에 따라 사용자 설정 확인 (디자인 스타일 포함)
2. **스타일 스펙 로딩**: 스타일 선택 시 `.claude/commands/references/styles.md`를 Read로 읽어 해당 스타일의 상세 스펙 확인
3. **구조 설계**: 슬라이드 순서와 각 슬라이드의 컴포넌트 구성을 정하고 사용자에게 간략히 공유
4. **HTML 생성**: 단일 파일로 완전한 프레젠테이션 생성 (선택된 스타일의 배경, 컬러, 폰트, 레이아웃, 시그니처 요소 반영)
5. **폴더 생성 & 파일 저장**: 아래 디렉토리 규칙에 따라 저장
6. **pages.json 업데이트**: 아래 매니페스트 규칙에 따라 루트 `pages.json`에 새 항목 추가
7. **확인 안내**: 브라우저에서 열어 확인하도록 안내

### 파일 저장 디렉토리 규칙

반드시 `과목/내용/` 폴더 구조를 생성한 뒤 그 안에 파일을 저장합니다.

```
{작업 디렉토리}/
└── {과목명}/
    └── {내용(주제)}/
        ├── index.html          ← 프레젠테이션 본체
        └── (이미지, QR 등 에셋)
```

**예시:**
```
프로그래밍/오리엔테이션/index.html
수학/확률과통계-소개/index.html
정보/AI윤리-수업자료/index.html
과학/물리-파동단원정리/index.html
```

**규칙:**
- 과목명과 내용(주제)은 사용자에게 확인하거나, 제목에서 자동 추출
- 폴더명에 공백 대신 하이픈(`-`) 사용 가능, 한글 폴더명 허용
- HTML 파일명은 `index.html`을 기본으로 사용 (사용자 지정 시 변경 가능)
- 이미지 등 에셋 파일이 있으면 같은 폴더에 함께 저장

### pages.json 매니페스트 업데이트 규칙

프레젠테이션을 생성한 후, 반드시 작업 디렉토리 루트의 `pages.json`을 읽어서 새 항목을 추가합니다. 루트 `index.html`이 이 파일을 동적으로 읽어 관리 대시보드를 렌더링합니다.

**추가할 항목 구조:**
```json
{
  "title": "프레젠테이션 제목",
  "path": "과목/내용/index.html",
  "emoji": "대표 이모지",
  "description": "1~2문장 설명",
  "tags": [
    { "label": "태그명", "color": "blue|green|purple|orange" }
  ],
  "gradient": "linear-gradient(90deg, #색상1, #색상2)"
}
```

**규칙:**
- `pages.json`이 존재하면 Read로 읽고, 해당 과목의 `pages` 배열에 새 항목을 추가
- 해당 과목이 아직 없으면 `subjects` 배열에 새 과목 객체를 추가
- `pages.json`이 없으면 새로 생성 (위 구조를 따름)
- gradient 색상은 선택한 컬러 테마에 맞춰 설정
- tags는 프레젠테이션의 핵심 키워드 2~4개를 추출

### 관리 대시보드 초기화 (없을 경우 안내 및 생성)

프레젠테이션 생성 후, 작업 디렉토리 루트에 아래 두 파일이 존재하는지 반드시 확인하세요.

**확인 순서:**

1. **`pages.json` 존재 여부 확인** (Glob으로 루트 탐색)
2. **루트 `index.html` 존재 여부 확인** (관리 대시보드)

두 파일 중 하나라도 없으면, 사용자에게 아래와 같이 안내하고 생성 여부를 확인합니다:

> "현재 수업 자료를 한눈에 볼 수 있는 **관리 대시보드**(`index.html`)와 목록 데이터(`pages.json`)가 없습니다.
> 지금 생성할까요? 생성하면 이후 프레젠테이션이 자동으로 목록에 추가됩니다."

사용자가 동의하면 아래 구조로 생성합니다.

#### `pages.json` 초기 구조

```json
{
  "subjects": [
    {
      "id": "과목ID",
      "name": "과목명",
      "emoji": "📚",
      "pages": [
        {
          "title": "프레젠테이션 제목",
          "path": "과목/내용/index.html",
          "emoji": "🎓",
          "description": "간단한 설명",
          "tags": [
            { "label": "태그명", "color": "green" }
          ],
          "gradient": "linear-gradient(90deg, #3aaa5c, #43b867)"
        }
      ]
    }
  ]
}
```

#### 루트 `index.html` 관리 대시보드 구조

단일 HTML 파일로 생성합니다. `pages.json`을 fetch로 읽어 동적으로 렌더링합니다.

**필수 기능:**
- `pages.json` fetch → 과목별 섹션으로 분류하여 카드 목록 렌더링
- 각 카드 클릭 시 해당 `path`로 이동 (`window.open` 또는 `location.href`)
- 과목별 필터 탭 (상단 탭 버튼으로 과목 선택)
- 검색창 (제목/설명/태그 기준 실시간 필터)
- 카드 디자인: gradient 배경, emoji, 제목, 설명, 태그 뱃지

**fetch 로직 예시:**
```javascript
fetch('pages.json')
  .then(r => r.json())
  .then(data => renderDashboard(data))
  .catch(() => {
    document.body.innerHTML = '<p style="text-align:center;padding:3rem;">pages.json을 찾을 수 없습니다.</p>';
  });
```

**로컬 환경 안내:**
`file://` 프로토콜에서는 fetch가 차단될 수 있습니다. 생성 후 사용자에게 반드시 아래를 안내하세요:

> ⚠️ **로컬에서 열 때**: `python -m http.server 8080` 등 로컬 서버를 실행한 후 `http://localhost:8080`으로 접속하세요.
> 또는 VS Code Live Server, Netlify Drop 등을 사용하세요.

### 콘텐츠 작성 가이드라인

- 한국어를 기본 언어로 사용
- 교육 현장에 적합한 정중하고 명확한 문체
- 이모지를 아이콘으로 적극 활용 (별도 이미지 불필요)
- 각 슬라이드의 텍스트량은 화면에 스크롤 없이 보일 정도로 조절
- 핵심 수치나 키워드는 `<strong>` 또는 뱃지로 강조
- 링크가 있으면 `target="_blank"`로 새 탭에서 열기

### 반응형 대응 필수 사항

- 768px 이하: grid-2, grid-3 → 1열로 변경
- 768px 이하: activity-photos 숨기고 mobile-only-photo 표시
- 480px 이하: club-grid 2열, 네비 버튼 축소
- 타임라인: 모바일에서 3열씩 줄바꿈

---

## 6단계: 추가 기능 상세

### 자동 재생 모드
```javascript
let autoPlayInterval = null;
function startAutoPlay(ms) {
  autoPlayInterval = setInterval(() => {
    if (currentSlide < totalSlides - 1) nextSlide();
    else clearInterval(autoPlayInterval);
  }, ms);
}
// 사용자 조작 시 자동 재생 중지
```

### 다크모드
- CSS 변수 오버라이드 방식
- `body.dark-mode` 클래스 토글
- 어두운 배경(#1a1a2e) + 밝은 텍스트(#e0e0e0)
- 카드 배경: #2d2d44
- 토글 버튼: 네비바 또는 우상단 고정

### 발표자 노트
- 각 슬라이드에 `data-notes="..."` 속성
- N키로 노트 패널 토글
- 반투명 오버레이, 하단 30% 영역

### 인쇄 스타일
```css
@media print {
  .slide { page-break-after: always; opacity: 1 !important; pointer-events: auto !important; position: relative; }
  .nav-bar, .progress-bar { display: none; }
}
```

### 전체화면
- F11 또는 전체화면 버튼
- `document.documentElement.requestFullscreen()`
- ESC로 해제

---

## 팁과 주의사항

- `overflow: hidden`이 body에 설정되므로 슬라이드 내용이 넘치지 않게 조절
- browser-content에 `overflow-y: auto`가 있어 내용이 많으면 스크롤 가능하지만, 가능하면 한 화면에 맞추는 것이 좋음
- 네비 바가 `position: fixed; bottom: 0`으로 고정되므로, `.slide` 또는 `.browser-content`에 `padding-bottom: 3rem` 이상을 확보하여 마지막 콘텐츠가 네비 바에 가려지지 않도록 할 것
- QR 코드 이미지는 사용자가 직접 제공하거나, placeholder 이미지를 사용
- 실제 이미지가 필요한 경우 `<img src="placeholder.png">` + 안내 주석
- CSS 변수를 활용하므로 나중에 색상 변경이 쉬움
- Google Fonts 외 CDN 사용 금지 (오프라인 환경 대비)
