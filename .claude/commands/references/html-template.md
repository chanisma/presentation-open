# HTML 템플릿 & CSS/JS 레퍼런스

> 이 파일은 HTML 생성 단계(4단계)에서 참조합니다.

---

## 기본 HTML 뼈대

반드시 단일 HTML 파일로 생성합니다. 외부 의존성은 Google Fonts CDN만 허용합니다.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script>if(!location.pathname.endsWith('/')&&!location.pathname.endsWith('.html')){var b=document.createElement('base');b.href=location.pathname+'/';document.head.appendChild(b);}</script>
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
    /* 8. Accessibility & High Contrast */
    /* 9. Animation & Performance */
  </style>
</head>
<body>
  <!-- 접근성: 슬라이드 스킵 링크 -->
  <a href="#presentation" class="skip-link">본문으로 바로가기</a>

  <div class="progress-bar" id="progressBar" role="progressbar"
       aria-valuenow="1" aria-valuemin="1" aria-valuemax="N"
       aria-label="프레젠테이션 진행률"></div>

  <div class="presentation" id="presentation" role="main">
    <!-- Slides here -->
  </div>

  <!-- 접근성: 슬라이드 상태 알림 (스크린 리더용) -->
  <div id="slideAnnounce" aria-live="polite" aria-atomic="true"
       class="sr-only"></div>

  <!-- Navigation -->
  <nav class="nav-bar" aria-label="슬라이드 네비게이션">
    <button class="nav-btn" id="prevBtn" onclick="prevSlide()" disabled
            aria-label="이전 슬라이드">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
      </svg>
    </button>
    <span class="nav-counter" aria-label="슬라이드 위치">
      <input type="text" class="slide-input" id="slideInput" value="1"
             aria-label="슬라이드 번호 입력 (Enter로 이동)"
             inputmode="numeric" pattern="[0-9]*">
      / <span id="totalSlides" aria-hidden="true">N</span>
    </span>
    <button class="nav-btn" id="nextBtn" onclick="nextSlide()"
            aria-label="다음 슬라이드">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
      </svg>
    </button>
    <!-- 전체화면 버튼 (설정: on 시 포함) -->
    <button class="nav-btn" id="fsBtn" onclick="toggleFullscreen()"
            aria-label="전체화면 전환" style="margin-left:0.3rem;">
      <svg id="fsExpand" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
      </svg>
      <svg id="fsCompress" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="display:none">
        <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
      </svg>
    </button>
  </nav>
  <script>
    // Slide navigation logic
  </script>
</body>
</html>
```

---

## CSS 설계 원칙

### 접근성(A11y) 필수 CSS

```css
/* 스크린 리더 전용 텍스트 (시각적으로 숨김) */
.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0);
  white-space: nowrap; border: 0;
}

/* 스킵 링크 (Tab 키 접근 시 표시) */
.skip-link {
  position: absolute;
  top: -40px; left: 0;
  background: var(--main);
  color: var(--white);
  padding: 8px 16px;
  z-index: 9999;
  font-size: 14px;
  border-radius: 0 0 4px 0;
  transition: top 0.2s;
}
.skip-link:focus { top: 0; }

/* 키보드 포커스 링 (마우스 사용 시 숨김) */
:focus-visible {
  outline: 3px solid var(--main);
  outline-offset: 2px;
  border-radius: 4px;
}
:focus:not(:focus-visible) { outline: none; }

/* 고대비 모드 지원 */
@media (prefers-contrast: high) {
  :root {
    --main: #0000ff;
    --dark: #000080;
    --text: #000000;
    --white: #ffffff;
    --gray-200: #666666;
  }
  .browser-card {
    border: 2px solid #000000;
  }
  .badge, .info-box {
    border: 2px solid currentColor;
  }
}

/* 동작 감소 모드 (전정기관 장애 등) */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 반응형 폰트 크기

> **빔프로젝터 가독성 원칙**: 1920x1080 기준 본문 최소 22px, 보조 텍스트 최소 20px.
> **어떤 텍스트도 0.8rem 미만으로 설정하지 마세요.**

```css
html, body {
  font-size: clamp(16px, 1.5vw, 28px); /* 빔프로젝터 가독성 확보 */
}

/* 태블릿 (1024px 이하): grid 유지, 폰트 소폭 축소 */
@media (max-width: 1024px) {
  html, body { font-size: clamp(15px, 2vw, 22px); }
  .slide { padding: 1.5rem; }
  .browser-card { border-radius: 0.8rem; }
}

/* 모바일 가로 (768px 이하): grid 2→1열, 이미지 숨김 */
@media (max-width: 768px) {
  html, body { font-size: clamp(14px, 3vw, 20px); }
  .grid-2, .grid-3 { grid-template-columns: 1fr; }
  .activity-photos { display: none; }
  .mobile-only-photo { display: block; }
  .timeline { flex-direction: column; align-items: flex-start; }
  .timeline-item { flex-direction: row; align-items: center; }
  .browser-topbar { padding: 0.4rem 0.8rem; }
  h1 { font-size: 2rem; }
  h2 { font-size: 1.3rem; }
}

/* 모바일 세로 (480px 이하): 최소 레이아웃 */
@media (max-width: 480px) {
  html, body { font-size: clamp(14px, 3.5vw, 18px); }
  .club-grid { grid-template-columns: repeat(2, 1fr); }
  .nav-btn { width: 1.5rem; height: 1.5rem; }
  .nav-bar { padding: 0.25rem 0.75rem; }
  .showcase-grid { grid-template-columns: repeat(2, 1fr); }
  .stat-grid { grid-template-columns: repeat(2, 1fr); }
  .card-grid.grid-3 { grid-template-columns: repeat(2, 1fr); }
  h1 { font-size: 1.7rem; }
  h2 { font-size: 1.2rem; }
  .browser-content { padding: 0.8rem; }
}
```

### 타이포그래피 스케일

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

### 카드 스타일별 상단바

- `browser`: 빨강/노랑/초록 dot 3개 + 중앙 타이틀
- `minimal`: 타이틀만 표시, 얇은 하단 보더
- `rounded`: dot 없이, 더 둥근 모서리(1.5rem), 그림자 강화

---

## 슬라이드 구조

각 슬라이드는 이 패턴을 따릅니다:

```html
<div class="slide {active if first}" data-slide="{index}"
     role="region" aria-label="슬라이드 {index}: {제목}">
  <div class="browser-card">
    <div class="browser-topbar" aria-hidden="true">
      <!-- 카드 스타일에 따른 상단바 -->
    </div>
    <div class="browser-content" tabindex="-1">
      <!-- 슬라이드 콘텐츠 -->
    </div>
  </div>
</div>
```

---

## 컴포넌트별 HTML 코드 예시

### 1. cover — 표지

```html
<div class="slide active" data-slide="0" role="region" aria-label="슬라이드 1: 표지">
  <div class="browser-card">
    <div class="browser-topbar" aria-hidden="true">
      <div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div>
      <span class="topbar-title">발표자료</span>
    </div>
    <div class="browser-content cover-slide">
      <!-- 연도 뱃지 -->
      <div class="badge main-badge">2025학년도</div>
      <!-- 대제목 -->
      <h1 class="cover-title">프레젠테이션 제목</h1>
      <!-- 부제목 -->
      <p class="cover-subtitle">부제목 또는 슬로건</p>
      <!-- 구분선 -->
      <div class="cover-divider" aria-hidden="true"></div>
      <!-- 기관명/날짜 -->
      <div class="cover-meta">
        <span>○○중학교 정보부</span>
        <span aria-hidden="true">·</span>
        <span><time datetime="2025-03">2025년 3월</time></span>
      </div>
    </div>
  </div>
</div>
```

### 2. toc — 목차

```html
<div class="browser-content toc-slide">
  <h2 class="section-title">목차</h2>
  <nav aria-label="슬라이드 목차">
    <ol class="toc-list">
      <li class="toc-item" onclick="goToSlide(2)" role="button" tabindex="0"
          aria-label="3번 슬라이드로 이동: 섹션 1 제목"
          onkeydown="if(event.key==='Enter'||event.key===' ')goToSlide(2)">
        <span class="toc-num" aria-hidden="true">01</span>
        <span class="toc-text">섹션 1 제목</span>
        <span class="toc-arrow" aria-hidden="true">→</span>
      </li>
      <li class="toc-item" onclick="goToSlide(4)" role="button" tabindex="0"
          aria-label="5번 슬라이드로 이동: 섹션 2 제목"
          onkeydown="if(event.key==='Enter'||event.key===' ')goToSlide(4)">
        <span class="toc-num" aria-hidden="true">02</span>
        <span class="toc-text">섹션 2 제목</span>
        <span class="toc-arrow" aria-hidden="true">→</span>
      </li>
    </ol>
  </nav>
</div>
```

### 3. section-overview — 섹션 시작

```html
<div class="browser-content section-overview">
  <!-- 섹션 헤더 -->
  <div class="section-divider">
    <span class="section-icon" aria-hidden="true">📌</span>
    <h2>섹션 제목</h2>
  </div>
  <!-- 요약 박스 -->
  <div class="highlight-box" role="note">
    <p>이 섹션에서 다룰 핵심 내용을 한 두 문장으로 소개합니다.</p>
  </div>
  <!-- 하위 항목 카드 -->
  <div class="grid-2 card-grid" role="list">
    <div class="card" role="listitem">
      <span class="card-icon" aria-hidden="true">✅</span>
      <h3 class="card-title">항목 1</h3>
      <p class="card-desc">간략한 설명</p>
    </div>
    <div class="card" role="listitem">
      <span class="card-icon" aria-hidden="true">✅</span>
      <h3 class="card-title">항목 2</h3>
      <p class="card-desc">간략한 설명</p>
    </div>
  </div>
</div>
```

### 4. activity-list — 활동/항목 나열

```html
<div class="browser-content activity-slide">
  <h2>활동 목록</h2>
  <ul class="activity-list" role="list">
    <li class="activity-item" role="listitem">
      <span class="activity-icon" aria-hidden="true">🎯</span>
      <div class="activity-body">
        <h3 class="activity-title">활동 제목 1</h3>
        <p class="activity-desc">활동에 대한 상세 설명을 여기에 작성합니다.</p>
      </div>
    </li>
    <li class="activity-item" role="listitem">
      <span class="activity-icon" aria-hidden="true">🚀</span>
      <div class="activity-body">
        <h3 class="activity-title">활동 제목 2</h3>
        <p class="activity-desc">활동에 대한 상세 설명을 여기에 작성합니다.</p>
      </div>
    </li>
  </ul>
</div>
```

### 5. card-grid — 항목 비교/소개 (2열 또는 3열)

```html
<div class="browser-content">
  <h2>카드 그리드</h2>
  <!-- grid-2 또는 grid-3 클래스로 열 수 조정 -->
  <div class="grid-3 card-grid" role="list">
    <div class="card" role="listitem">
      <span class="card-icon" aria-hidden="true">💡</span>
      <h3 class="card-title">카드 제목</h3>
      <p class="card-desc">카드 설명 텍스트</p>
      <!-- 선택적 뱃지 -->
      <span class="badge badge-blue">추천</span>
    </div>
    <!-- 추가 카드 반복 -->
  </div>
</div>
```

#### card-grid 이미지 변형 (web-search 모드)

이미지 검색이 활성화되고 `needs_image: true`인 카드 슬라이드에는 이모지 아이콘 대신 실제 이미지를 삽입합니다:

```html
<div class="grid-3 card-grid" role="list">
  <div class="card" role="listitem">
    <img src="img-04-inner-planets.jpg" alt="내행성 사진"
         loading="lazy" class="card-img"
         referrerpolicy="no-referrer"
         crossorigin="anonymous"
         onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';">
    <div class="image-placeholder" style="display:none;">
      <span class="placeholder-icon">🖼️</span>
      <span class="placeholder-text">이미지를 불러올 수 없습니다</span>
    </div>
    <h3 class="card-title">내행성</h3>
    <p class="card-desc">수성, 금성, 지구, 화성</p>
  </div>
  <!-- 추가 카드 반복 — 다운로드된 이미지가 있으면 모두 삽입 -->
</div>
```

> **⚠️ 중요**: 시나리오에서 `needs_image: true`로 지정하고 다운로드된 이미지가 있는 card-grid 슬라이드에는 **반드시** 해당 이미지를 `card-img`로 삽입하세요. 다운로드한 이미지를 HTML에서 참조하지 않는 것은 리소스 낭비입니다.

### 6. showcase-grid — 쇼케이스 (5열)

```html
<div class="browser-content">
  <h2>쇼케이스</h2>
  <div class="showcase-grid" role="list"
       aria-label="쇼케이스 항목 목록">
    <div class="showcase-item" role="listitem"
         tabindex="0" aria-label="항목 이름: 설명">
      <span class="showcase-icon" aria-hidden="true">🏆</span>
      <h3 class="showcase-name">항목 이름</h3>
      <p class="showcase-desc">간단한 설명</p>
    </div>
    <!-- 반복 -->
  </div>
</div>
```

### 7. task-list — 과제/단계 목록

```html
<div class="browser-content">
  <h2>단계별 과제</h2>
  <ol class="task-list" role="list">
    <li class="task-item" role="listitem">
      <span class="task-num" aria-hidden="true">01</span>
      <div class="task-body">
        <h3 class="task-title">1단계: 제목</h3>
        <p class="task-desc">단계에 대한 설명. 핵심 내용 포함.</p>
      </div>
    </li>
    <li class="task-item" role="listitem">
      <span class="task-num" aria-hidden="true">02</span>
      <div class="task-body">
        <h3 class="task-title">2단계: 제목</h3>
        <p class="task-desc">단계에 대한 설명.</p>
      </div>
    </li>
  </ol>
</div>
```

### 8. timeline — 일정/연혁

```html
<div class="browser-content">
  <h2>일정 타임라인</h2>
  <div class="timeline" role="list" aria-label="일정 타임라인">
    <div class="timeline-item" role="listitem">
      <!-- 마커 -->
      <div class="timeline-marker" aria-hidden="true"></div>
      <div class="timeline-content">
        <span class="timeline-date">
          <time datetime="2025-03">3월</time>
        </span>
        <h3 class="timeline-title">일정 제목</h3>
        <p class="timeline-desc">상세 설명</p>
      </div>
    </div>
    <!-- highlight 항목: 중요 일정 -->
    <div class="timeline-item highlight" role="listitem">
      <div class="timeline-marker highlight-marker" aria-hidden="true"></div>
      <div class="timeline-content">
        <span class="timeline-date">
          <time datetime="2025-06">6월</time>
        </span>
        <h3 class="timeline-title">중요 일정 <span class="badge badge-red">중요</span></h3>
        <p class="timeline-desc">반드시 확인할 일정</p>
      </div>
    </div>
  </div>
</div>
```

### 9. comparison — 비교 표

```html
<div class="browser-content">
  <h2>비교 분석</h2>
  <div class="table-wrapper" role="region" aria-label="비교 표" tabindex="0">
    <table class="comparison-table">
      <caption class="sr-only">항목별 비교 분석표</caption>
      <thead>
        <tr>
          <th scope="col">구분</th>
          <th scope="col">방법 A</th>
          <th scope="col">방법 B</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">속도</th>
          <td>빠름</td>
          <td>보통</td>
        </tr>
        <tr>
          <th scope="row">비용</th>
          <td>높음</td>
          <td>낮음</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

### 10. deadline-callout — 마감/강조 알림

```html
<div class="browser-content">
  <div class="deadline-callout" role="alert" aria-live="polite">
    <span class="deadline-icon" aria-hidden="true">⏰</span>
    <div class="deadline-body">
      <h2 class="deadline-title">제출 마감</h2>
      <p class="deadline-date">
        <time datetime="2025-04-30">2025년 4월 30일 (수)</time>
      </p>
      <p class="deadline-desc">마감 전 충분한 시간을 두고 제출하세요.</p>
    </div>
    <a href="#" class="deadline-btn" role="button"
       aria-label="제출 방법 확인하기">제출 방법 확인 →</a>
  </div>
</div>
```

### 11. cosware-cards — 서비스/도구 소개 (3열 고유색 카드)

```html
<div class="browser-content">
  <h2>도구 소개</h2>
  <div class="cosware-grid" role="list">
    <div class="cosware-card cosware-blue" role="listitem">
      <span class="cosware-icon" aria-hidden="true">🔧</span>
      <h3 class="cosware-title">도구 이름</h3>
      <p class="cosware-desc">도구 설명</p>
    </div>
    <div class="cosware-card cosware-green" role="listitem">
      <span class="cosware-icon" aria-hidden="true">⚡</span>
      <h3 class="cosware-title">도구 이름</h3>
      <p class="cosware-desc">도구 설명</p>
    </div>
    <div class="cosware-card cosware-purple" role="listitem">
      <span class="cosware-icon" aria-hidden="true">🎨</span>
      <h3 class="cosware-title">도구 이름</h3>
      <p class="cosware-desc">도구 설명</p>
    </div>
  </div>
</div>
```

### 12. qr-section — QR 코드

```html
<div class="browser-content qr-slide">
  <h2>QR 코드로 접속하기</h2>
  <div class="qr-container">
    <figure class="qr-figure">
      <!-- 실제 QR 이미지 또는 placeholder -->
      <img src="qr-code.png" alt="QR 코드: https://example.com 접속용"
           class="qr-image" width="200" height="200">
      <figcaption class="qr-label">스캔하여 자료 확인</figcaption>
    </figure>
    <p class="qr-url">
      <a href="https://example.com" target="_blank" rel="noopener">
        https://example.com
      </a>
    </p>
  </div>
</div>
```

### 13. stat-highlight — 통계/수치 강조

```html
<div class="browser-content">
  <h2>핵심 수치</h2>
  <div class="stat-grid" role="list">
    <div class="stat-item" role="listitem">
      <span class="stat-number" aria-label="95 퍼센트">95%</span>
      <span class="stat-label">만족도</span>
    </div>
    <div class="stat-item" role="listitem">
      <span class="stat-number" aria-label="1200명">1,200명</span>
      <span class="stat-label">참여 학생</span>
    </div>
    <div class="stat-item" role="listitem">
      <span class="stat-number" aria-label="3개 학교">3개</span>
      <span class="stat-label">협력 학교</span>
    </div>
  </div>
  <div class="highlight-box" role="note">
    핵심 메시지를 여기에 작성합니다.
  </div>
</div>
```

### 14. quote — 인용문/명언

```html
<div class="browser-content quote-slide">
  <figure class="quote-figure">
    <span class="quote-mark" aria-hidden="true">"</span>
    <blockquote class="quote-text">
      <p>인용할 텍스트를 여기에 작성합니다. 명언이나 핵심 메시지를 강조합니다.</p>
    </blockquote>
    <figcaption class="quote-source">
      — <cite>출처 또는 발화자 이름</cite>
    </figcaption>
  </figure>
</div>
```

### 15. two-column — 좌우 분할

```html
<div class="browser-content">
  <h2>비교 / 대조</h2>
  <!-- 50:50 비율. 60:40은 two-col-60-40 클래스 사용 -->
  <div class="two-col">
    <div class="col-left">
      <h3 class="col-title">왼쪽 제목</h3>
      <ul class="col-list" role="list">
        <li role="listitem">항목 1</li>
        <li role="listitem">항목 2</li>
      </ul>
    </div>
    <div class="col-divider" aria-hidden="true"></div>
    <div class="col-right">
      <h3 class="col-title">오른쪽 제목</h3>
      <ul class="col-list" role="list">
        <li role="listitem">항목 1</li>
        <li role="listitem">항목 2</li>
      </ul>
    </div>
  </div>
</div>
```

### 16. end — 마무리

```html
<div class="browser-content end-slide">
  <!-- 감사 메시지 -->
  <div class="end-header">
    <span class="end-icon" aria-hidden="true">🙏</span>
    <h1 class="end-title">감사합니다</h1>
    <p class="end-subtitle">궁금한 점이 있으시면 언제든지 질문해 주세요.</p>
  </div>
  <!-- 핵심 요약 -->
  <div class="highlight-box end-summary" role="complementary"
       aria-label="핵심 요약">
    <h2 class="summary-title">오늘의 핵심</h2>
    <ul class="summary-list" role="list">
      <li role="listitem">✅ 핵심 내용 1</li>
      <li role="listitem">✅ 핵심 내용 2</li>
      <li role="listitem">✅ 핵심 내용 3</li>
    </ul>
  </div>
  <!-- 선택적 QR -->
  <div class="end-qr">
    <img src="qr.png" alt="자료 QR 코드" class="end-qr-img" width="120" height="120">
    <p class="end-qr-label">자료 다운로드</p>
  </div>
</div>
```

---

## 네비게이션 바 CSS

> 네비게이션 바는 발표 콘텐츠를 가리지 않도록 최소 크기로 유지합니다.
> font-size는 본문 rem과 독립적으로 고정 px 사용합니다.

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
.nav-btn:focus-visible {
  outline: 3px solid var(--main);
  outline-offset: 2px;
}
.nav-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.nav-counter {
  font-size: 13px; /* 고정 px */
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

---

## JavaScript 네비게이션

**UI 원칙:**
- **화살표 버튼은 반드시 SVG 아이콘** — 유니코드(◀▶)는 폰트에 따라 정렬 어긋남
- **네비 바 font-size 고정 px (14px)** — 본문 rem에 영향받지 않도록
- **카운터도 고정 px (13px)** + `line-height: 1`로 수직 정렬
- **네비 바 최소 크기** — 발표 콘텐츠 영역 최대 확보

### 필수 기능

- 이전/다음 슬라이드 버튼 (SVG 아이콘)
- 키보드: 좌우 화살표, Space, Home, End
- 프레젠터 클리커: PageDown(다음), PageUp(이전) — 로지텍 호환
- 마우스 휠: 600ms 디바운스, `{ passive: false }` + `preventDefault()`
- 터치 스와이프 (50px 임계값)
- 프로그레스바 업데이트
- 슬라이드 카운터 (input 필드로 직접 번호 입력 이동)
- goToSlide(index) 함수 (목차 클릭용)
- 버튼 disabled 상태 관리
- 페이지 번호 입력: focus → select → Enter 이동 → Escape 취소 → blur 이동 → keydown stopPropagation
- **접근성**: aria-valuenow 업데이트, aria-live 슬라이드 번호 알림

### 키보드/클리커 이벤트 핸들러

```javascript
// 슬라이드 상태 알림 (스크린 리더용)
function announceSlide(current, total) {
  const el = document.getElementById('slideAnnounce');
  if (el) el.textContent = `슬라이드 ${current + 1} / ${total}`;
}

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

// goToSlide: 슬라이드 이동 + 접근성 업데이트
function goToSlide(index) {
  if (index < 0 || index >= totalSlides) return;
  slides[currentSlide].classList.remove('active');
  currentSlide = index;
  slides[currentSlide].classList.add('active');
  updateNav();
  announceSlide(currentSlide, totalSlides);
  // 포커스를 슬라이드 콘텐츠로 이동 (스크린 리더 지원)
  const content = slides[currentSlide].querySelector('.browser-content');
  if (content) { content.focus(); }
}

// 진행률 바 + aria 업데이트
function updateNav() {
  const pct = ((currentSlide + 1) / totalSlides) * 100;
  progressBar.style.width = pct + '%';
  progressBar.setAttribute('aria-valuenow', currentSlide + 1);
  slideInput.value = currentSlide + 1;
  prevBtn.disabled = currentSlide === 0;
  nextBtn.disabled = currentSlide === totalSlides - 1;
}
```

---

## 성능 최적화: CSS 애니메이션

### will-change 활용 원칙

> `will-change`는 실제 애니메이션 직전에만 적용하고, 완료 후 제거합니다.
> 남발 시 오히려 메모리 낭비 — 슬라이드 전환처럼 명확한 시점에만 사용합니다.

```css
/* 슬라이드 전환 성능 최적화 */
.slide {
  /* 기본: will-change 없음 */
  transform: translateZ(0); /* 합성 레이어 강제 생성 (GPU 가속) */
  backface-visibility: hidden; /* 3D 변환 최적화 */
}

.slide.will-animate {
  /* JS로 전환 직전에만 클래스 추가 */
  will-change: opacity, transform;
}

/* 슬라이드 페이드 전환 */
@keyframes slideIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

.slide.active {
  animation: slideIn 0.35s cubic-bezier(0.4, 0, 0.2, 1) both;
}

/* 카드 등장 애니메이션 — contain으로 리플로우 최적화 */
.card, .stat-item, .cosware-card {
  contain: layout style; /* 자식 요소 변화가 부모에 영향 안 줌 */
}

/* 프로그레스 바 최적화 */
.progress-bar {
  will-change: width; /* 진행률 바는 width가 지속 변하므로 적용 유지 */
  transform: translateZ(0);
  transition: width 0.3s ease;
}
```

### 애니메이션 프리셋

```css
/* 기본 등장 */
@keyframes popUp {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* 크기 확대 등장 */
@keyframes scaleUp {
  from { opacity: 0; transform: scale(0.9); }
  to   { opacity: 1; transform: scale(1); }
}

/* 원근감 틸트 등장 */
@keyframes tiltIn {
  from { opacity: 0; transform: perspective(600px) rotateX(-5deg); }
  to   { opacity: 1; transform: perspective(600px) rotateX(0); }
}

/* 왼쪽에서 슬라이드 인 */
@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-30px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* 스태거 애니메이션: 자식 요소 순차 등장 */
/* JS에서 각 자식에 --delay 변수 주입:
   el.style.setProperty('--delay', i * 0.08 + 's'); */
.stagger-item {
  opacity: 0;
  animation: popUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) both;
  animation-delay: var(--delay, 0s);
}

/* 활성 슬라이드에서만 자식 스태거 실행 */
.slide.active .stagger-item { animation-play-state: running; }
.slide:not(.active) .stagger-item { animation-play-state: paused; }
```

### 스태거 초기화 JavaScript

```javascript
// 슬라이드 로드 시 스태거 딜레이 설정
document.querySelectorAll('.stagger-item').forEach((el, i) => {
  el.style.setProperty('--delay', (i * 0.08) + 's');
});

// 슬라이드 전환 시 will-change 임시 적용 (성능 최적화)
function goToSlide(index) {
  if (index < 0 || index >= totalSlides) return;
  const current = slides[currentSlide];
  const next = slides[index];

  // 전환 직전 will-change 활성화
  current.classList.add('will-animate');
  next.classList.add('will-animate');

  current.classList.remove('active');
  currentSlide = index;
  next.classList.add('active');
  updateNav();
  announceSlide(currentSlide, totalSlides);

  // 전환 완료 후 will-change 제거 (메모리 해제)
  setTimeout(() => {
    current.classList.remove('will-animate');
    next.classList.remove('will-animate');
  }, 400);

  const content = next.querySelector('.browser-content');
  if (content) content.focus();
}
```

---

## 반응형 대응 필수 사항

### 브레이크포인트별 레이아웃 변화 요약

| 브레이크포인트 | 주요 변화 |
|--------------|---------|
| 기본 (1920px~) | grid-2/grid-3 정상 표시, showcase 5열 |
| 태블릿 (≤1024px) | 폰트 소폭 축소, 패딩 축소, showcase 4열 |
| 모바일 가로 (≤768px) | grid-2/grid-3 → 1열, activity-photos 숨김, timeline 세로 변환 |
| 모바일 세로 (≤480px) | showcase/stat 2열, 네비 버튼 축소, club-grid 2열 |

- 768px 이하: grid-2, grid-3 → 1열로 변경
- 768px 이하: activity-photos 숨기고 mobile-only-photo 표시
- 480px 이하: club-grid 2열, 네비 버튼 축소
- 타임라인: 모바일에서 세로 배치 (가로→세로)
- 비교표: 모바일에서 `overflow-x: auto` + `min-width` 적용
