# 웹 이미지 검색 레퍼런스 (Playwright 기반)

> 이 파일은 `이미지 스타일: web-search` 또는 `웹 이미지 검색: on` 설정 시 참조합니다.

## ⚡ 이미지 처리 모드

| 모드 | 설명 | 사용 시점 |
|------|------|----------|
| **`url-link`** (기본값) | 검색 후 원본 URL을 HTML에 직접 삽입 | 온라인 배포 (Netlify 등), 용량 절약 필요 시 |
| **`download`** | 검색 후 이미지를 로컬에 다운로드 | 오프라인 사용, USB 배포, 인터넷 없는 교실 |

**기본값은 `url-link`입니다.** 사용자가 "오프라인", "USB", "인터넷 없이" 등을 언급하면 `download` 모드로 전환하세요.

---

## 🎯 이미지 사용 판단 기준

**모든 슬라이드에 이미지가 필요한 것은 아닙니다.** 아래 기준에 따라 이미지 검색 여부를 결정하세요.

### 이미지가 효과적인 슬라이드

| 슬라이드 유형 | 이유 | 예시 |
|-------------|------|------|
| **표지 (cover)** | 시각적 임팩트, 주제 전달 | 배경 사진 + 오버레이 |
| **실물/장소 소개** | 텍스트로 대체 불가능한 시각 정보 | 마추픽추 사진, 한국 음식 사진 |
| **인물 소개** | 얼굴을 보여주는 것이 핵심 | 역사적 인물 초상화 |
| **비교/전후** | 시각적 대비가 설명보다 강력 | 환경 오염 전/후 |

### 이미지 없이 더 나은 슬라이드

| 슬라이드 유형 | 더 나은 대안 | 이유 |
|-------------|------------|------|
| **개념/정의 설명** | 텍스트 + CSS 박스/카드 | 추상적 개념은 사진이 오히려 혼란 |
| **목록/절차** | 번호 리스트 + 이모지 아이콘 | 순서와 구조가 핵심 |
| **통계/수치** | stat-highlight 컴포넌트 | 숫자 자체가 시각적 효과 |
| **일정/타임라인** | timeline 컴포넌트 | CSS로 충분히 표현 가능 |
| **비교표** | comparison 컴포넌트 | 표가 이미지보다 정보 밀도 높음 |
| **인용/메시지** | quote 컴포넌트 + 이모지 | 텍스트 자체가 콘텐츠 |
| **마무리/Q&A** | 이모지 + 간결한 텍스트 | 불필요한 이미지는 산만함 |

### 판단 원칙

```
"이 이미지가 없으면 이해가 어려운가?" → Yes → 이미지 검색
"이 이미지가 없으면 이해가 어려운가?" → No  → 텍스트/이모지/CSS 컴포넌트
```

**프레젠테이션 전체에서 이미지가 있는 슬라이드는 30~50%가 적절합니다.** 모든 슬라이드에 이미지를 넣으면 검색 시간이 길어지고, 시각적 피로도가 높아집니다.

---

## Playwright MCP 도구 매핑

| 단계 | Playwright 도구 | 설명 |
|------|----------------|------|
| 브라우저 열기 | `browser_navigate` | Google Images URL로 이동 |
| 검색어 입력 | `browser_fill_form` | 검색창에 키워드 입력 |
| 검색 실행 | `browser_press_key` | Enter 키 전송 |
| 페이지 구조 읽기 | `browser_snapshot` | 검색 결과 구조 파악 |
| 이미지 클릭 | `browser_click` | 이미지 썸네일 클릭하여 확대 |
| 원본 URL 추출 | `browser_evaluate` | JS로 원본 소스 이미지 URL 추출 |
| (선택) 스크린샷 저장 | `browser_take_screenshot` | URL 사용 불가 시 최후 수단으로 로컬 저장 |

---

## 검색 워크플로우 상세

### Step 1: 검색 키워드 생성

슬라이드 내용에서 적절한 이미지 검색 키워드를 생성합니다.

**키워드 생성 규칙:**
- 영어 키워드가 검색 결과 품질이 높음 (한국어 대비 이미지 풀이 넓음)
- 슬라이드 제목 + 핵심 개념을 조합
- 교육용 이미지가 필요하면 `"education"`, `"classroom"`, `"diagram"` 추가
- 사진이 필요하면 `"photo"`, 다이어그램이면 `"diagram"` 또는 `"infographic"` 추가
- 투명 배경이 필요하면 `"png transparent background"` 추가
- **안정적인 URL을 위해**: `site:wikimedia.org` 또는 `site:wikipedia.org` 추가 권장

**슬라이드 유형별 키워드 전략:**

| 슬라이드 유형 | 키워드 패턴 | 필수 수식어 |
|-------------|-----------|-----------|
| **표지 (cover)** | `"{주제} wide panoramic landscape"` | `wide`, `panoramic`, `landscape`, `banner` 중 1개 이상 |
| **개념 설명** | `"{개념} diagram explanation"` | — |
| **실물/장소** | `"{대상} photo high resolution"` | `high resolution` 권장 |
| **인물** | `"{인물명} portrait official"` | — |
| **card-grid 카드** | `"{카드주제} icon illustration"` | — |

> **⚠️ 표지 이미지 키워드 필수 규칙**: 표지(cover) 배경에 사용할 이미지는 반드시 `wide`, `panoramic`, `landscape`, `banner` 중 하나를 키워드에 포함하세요. 정사각형(1:1) 이미지는 커버 배경에 부적합합니다 — 좌우 빈 공간이 생기거나 과도한 확대가 발생합니다.

**키워드 예시:**
```
슬라이드: "셰익스피어 소개" → "shakespeare portrait painting"
슬라이드: "CNN 구조" → "CNN architecture diagram layers"
슬라이드: "교실 에너지 절약" → "classroom energy saving robot education"
슬라이드: "오감 탐험" → "five senses children education illustration"
슬라이드: "타지마할" → "taj mahal landscape photo site:wikimedia.org"
슬라이드: "태양계 표지" → "solar system wide panoramic space landscape"
슬라이드: "AI 교육 표지" → "artificial intelligence technology wide banner"
```

### Step 2: Google Images 검색

```
1. browser_navigate → "https://www.google.com/search?q={keyword}&tbm=isch&safe=active&tbs=iar:w"
   - safe=active: 안전 검색 필수 (교육 환경)
   - tbm=isch: 이미지 검색 모드
   - tbs=iar:w: 가로형(wide) 이미지만 필터링 (세로형 이미지 방지)

2. browser_snapshot → 페이지 구조 확인
   - 이미지 썸네일 목록이 표시됨
   - 각 이미지에 ref 값이 할당됨

3. 적합한 이미지 선택:
   - 첫 10개 결과 중에서 선택
   - 교육용으로 적합한 이미지 우선
   - 로고, 워터마크가 없는 이미지 우선
   - 텍스트가 적은 깨끗한 이미지 우선
   - ⚠️ 가로형(landscape) 이미지 필수 선택 (width > height)
     - 세로형(portrait) 이미지는 슬라이드 레이아웃을 깨뜨림
     - 정사각형(1:1)은 허용하되 가로형 우선
     - 검색 URL에 `&tbs=iar:w` 파라미터 추가하여 가로형 필터링
   - 한국어 프레젠테이션에는 한국어 또는 언어 무관 이미지 우선 (영어 인포그래픽 회피)
   - ⭐ URL 안정성 우선순위: Wikimedia > Wikipedia > 공공기관 > 기타 (아래 "URL 안정성 가이드" 참조)
```

### Step 3: 원본 이미지 URL 추출

```
1. browser_click → 선택한 이미지 썸네일 클릭
   - 이미지 확대 패널이 열림

2. browser_snapshot → 확대된 이미지 패널 구조 확인

3. browser_evaluate → 원본 소스 URL 추출:
   () => {
     // 방법 1: 확대된 이미지의 원본 src 추출
     const imgs = document.querySelectorAll('img[data-noaft]');
     const results = [];
     imgs.forEach(img => {
       if (img.src && img.src.startsWith('http') && img.naturalWidth > 200) {
         results.push({
           src: img.src,
           width: img.naturalWidth,
           height: img.naturalHeight,
           // Google 캐시 URL 여부 확인
           isGoogleCached: img.src.includes('encrypted-tbn') || img.src.includes('gstatic.com')
         });
       }
     });

     // 방법 2: "방문" 링크에서 원본 사이트 URL 추출
     const visitLink = document.querySelector('a[href*="imgrefurl"]');
     const sourceUrl = visitLink ? visitLink.href : null;

     return JSON.stringify({ images: results, sourcePageUrl: sourceUrl });
   }

   ⚠️ 중요: Google 캐시 URL(encrypted-tbn*.gstatic.com)은 사용하지 마세요!
   - Google 캐시 URL은 세션 만료 후 깨짐
   - 반드시 원본 소스 URL(upload.wikimedia.org, *.cdn.* 등)을 사용
   - isGoogleCached가 true인 경우: 원본 사이트 방문하여 이미지 URL 추출 필요
```

### Step 4: URL 선택 및 검증 (url-link 모드)

**기본 모드 (url-link)에서는 이미지를 다운로드하지 않습니다.**

추출한 URL이 HTML 삽입에 적합한지 검증합니다:

```
1. URL 안정성 확인:
   ✅ 안정적: upload.wikimedia.org, *.wikipedia.org, *.gov, *.edu
   ✅ 보통: *.cdn.*, *.cloudfront.net, *.amazonaws.com
   ❌ 불안정: encrypted-tbn*.gstatic.com (Google 캐시 — 절대 사용 금지)
   ❌ 불안정: 블로그/뉴스 사이트 이미지 (몇 달 후 만료 가능)

2. URL이 Google 캐시인 경우:
   - 원본 사이트 링크를 통해 실제 이미지 URL 추출
   - browser_navigate → 원본 사이트로 이동
   - browser_evaluate → 해당 이미지의 원본 URL 찾기

3. URL 형식 확인:
   - https:// 로 시작하는지 확인 (http는 mixed content 에러 가능)
   - 이미지 확장자(.jpg, .png, .webp, .svg) 또는 이미지 서빙 URL인지 확인
```

### Step 4-B: 이미지 다운로드 (download 모드 — 오프라인 전용)

> 이 단계는 사용자가 오프라인 지원을 요청한 경우에만 실행합니다.

```bash
# curl로 이미지 다운로드
curl -L -o "{프레젠테이션폴더}/img-{번호}-{키워드}.jpg" "{이미지URL}" \
  --max-time 10 \
  --user-agent "Mozilla/5.0"

# 다운로드 실패 시 대체 방법: Playwright 스크린샷
browser_take_screenshot → filename: "{프레젠테이션폴더}/img-{번호}-{키워드}.png"
```

**다운로드 후 검증 (필수):**

```bash
# 1. 파일 형식 검증 (magic bytes 확인)
file "{다운로드된파일}"
# ❌ "HTML document", "ASCII text" → 이미지가 아닌 오류 페이지 → 재다운로드

# 2. 파일 크기 확인 (2MB 초과 시 다른 이미지 선택)
size=$(wc -c < "{다운로드된파일}")
if [ "$size" -gt 2097152 ]; then echo "⚠️ OVERSIZED — 재검색"; fi

# 3. 해상도 및 종횡비 검증 (Python PIL 사용)
python3 -c "
from PIL import Image
img = Image.open('{다운로드된파일}')
w, h = img.size
ratio = w / h
print(f'Size: {w}x{h}, Ratio: {ratio:.2f}')
if w < 1280:
    print(f'⚠️ LOW-RES: {w}px wide — 최소 1280px 권장, FHD에서 흐릿할 수 있음')
if ratio < 1.0:
    print(f'⚠️ PORTRAIT: ratio={ratio:.2f} — 세로형 이미지, object-fit:cover 시 과도한 크롭 발생')
    print(f'   → 가로형(landscape) 이미지로 재검색 권장 (검색 URL에 &tbs=iar:w 추가)')
if 0.95 <= ratio <= 1.05:
    print(f'⚠️ SQUARE: ratio={ratio:.2f} — 커버 배경에 부적합, 일반 슬라이드에서만 사용')
"

# 4. 일괄 검증 스크립트
for img in "{프레젠테이션폴더}"/img-*.{jpg,png}; do
  [ -f "$img" ] || continue
  mime=$(file -b --mime-type "$img")
  size=$(wc -c < "$img")
  if [[ "$mime" == text/* ]]; then
    echo "❌ INVALID: $img is $mime — 재다운로드 필요"
    rm "$img"
    continue
  fi
  if [ "$size" -gt 2097152 ]; then
    echo "⚠️ OVERSIZED: $img — 재다운로드 권장"
  fi
  echo "✅ OK: $img ($mime, ${size} bytes)"
done
```

**이미지 품질 기준:**

| 기준 | 최소값 | 권장값 | 비고 |
|------|--------|--------|------|
| **너비** | 1024px | 1280px 이상 | FHD(1920px) 디스플레이에서 선명하게 표시 |
| **종횡비** | 1.2:1 이상 | 16:9 ~ 16:10 | 가로형 필수, 세로형은 크롭 과다 |
| **커버 이미지 너비** | 1280px | 1920px | 전체 화면 배경 사용 |
| **커버 종횡비** | 1.5:1 이상 | 16:9 (1.78:1) | 와이드스크린에 맞는 파노라마형 |
| **파일 크기** | — | 100KB~500KB | 2MB 초과 시 거부 |

### Step 5: HTML에 이미지 삽입

> **모든 `<img>` 태그에는 반드시 `referrerpolicy`와 `onerror` 속성을 포함하세요.**

#### image-focus 컴포넌트
```html
<div class="image-focus">
  <div class="image-container">
    <img src="https://upload.wikimedia.org/wikipedia/commons/..." alt="셰익스피어 초상화"
         loading="lazy"
         referrerpolicy="no-referrer"
         crossorigin="anonymous"
         onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';">
    <div class="image-placeholder" style="display:none;">
      <span class="placeholder-icon">🖼️</span>
      <span class="placeholder-text">이미지를 불러올 수 없습니다</span>
    </div>
  </div>
  <p class="image-caption">윌리엄 셰익스피어 (1564-1616)</p>
</div>
```

#### cover 배경 이미지
```html
<div class="slide cover" id="cover-slide"
     style="background-image: url('https://upload.wikimedia.org/...');">
  <div class="cover-overlay"></div>
  <div class="browser-card browser-card--frameless">
    <!-- 표지 내용 -->
  </div>
</div>
```

```css
.cover { background-color: var(--style-bg); background-size: cover; background-position: center; }
.cover-overlay {
  position: absolute; inset: 0;
  background: rgba(var(--style-bg-rgb), 0.75);
}
```

#### two-column 이미지
```html
<div class="two-col">
  <div class="col">
    <img src="https://example.com/robot.jpg" alt="에코봇 프로토타입"
         loading="lazy" class="col-image"
         referrerpolicy="no-referrer"
         crossorigin="anonymous"
         onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';">
    <div class="image-placeholder" style="display:none;">
      <span class="placeholder-icon">🖼️</span>
      <span class="placeholder-text">이미지를 불러올 수 없습니다</span>
    </div>
  </div>
  <div class="col">
    <h3>에코봇 기능</h3>
    <ul>...</ul>
  </div>
</div>
```

```css
.col-image {
  width: 100%; max-height: 350px;
  object-fit: cover; border-radius: 0.5rem;
  aspect-ratio: 16/10; /* 가로형 비율 강제 — 세로형 이미지 크롭 */
}
```

#### grid 카드 이미지
```html
<div class="card" role="listitem">
  <img src="https://example.com/image.jpg" alt="설명"
       loading="lazy" class="card-img"
       referrerpolicy="no-referrer"
       crossorigin="anonymous"
       onerror="this.onerror=null; this.style.display='none';">
  <h3 class="card-title">제목</h3>
  <p class="card-desc">설명</p>
</div>
```

---

## 이미지 CSS 클래스

프레젠테이션에 이미지를 삽입할 때 사용하는 CSS 클래스:

> **⚠️ 일관성 규칙**: 모든 프레젠테이션에서 이미지를 사용할 때 반드시 `.image-container` + `.image-caption` 래퍼를 사용하세요 (cover 배경, card-img 제외). 프레젠테이션마다 다른 구조를 사용하면 유지보수가 어렵고 스타일 불일치가 발생합니다.

```css
/* 이미지 공통 — 슬라이드 내 모든 이미지에 오버플로 방지 */
.slide img {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}
.slide-image {
  max-width: 100%;
  height: auto;
  max-height: 400px;
  object-fit: contain;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* image-focus 컴포넌트 */
.image-focus { text-align: center; }
.image-container {
  max-width: 80%;
  margin: 0 auto;
  border-radius: 0.5rem;
  overflow: hidden;
}
.image-container img {
  width: 100%;
  height: auto;
  max-height: 400px;
  object-fit: contain;
  display: block;
}
.image-caption {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: var(--style-text-secondary);
  font-style: italic;
}

/* 종횡비 대응 — 세로형/정사각형 이미지 레이아웃 보정 */
.col-image {
  width: 100%; max-height: 350px;
  object-fit: cover; border-radius: 0.5rem;
  aspect-ratio: 16/10; /* 가로형 비율 강제 — 세로형 이미지 크롭 */
}
.col-image[data-ratio="portrait"] {
  /* 세로형 이미지: contain으로 전환하여 과도한 크롭 방지 */
  object-fit: contain;
  background: linear-gradient(135deg, var(--style-bg), rgba(0,0,0,0.03));
  aspect-ratio: auto; /* 자연스러운 비율 유지 */
  max-height: 380px;
}
.col-image[data-ratio="square"] {
  /* 정사각형 이미지: 비율 유지하되 크기 제한 */
  object-fit: contain;
  aspect-ratio: auto;
  max-height: 320px;
  max-width: 80%;
  margin: 0 auto;
  display: block;
}

/* 커버 배경 이미지 — 반드시 가로형(landscape) 이미지 사용 */
.cover {
  background-color: var(--style-bg);
  background-size: cover;
  background-position: center;
}
.cover-overlay {
  position: absolute; inset: 0;
  background: rgba(var(--style-bg-rgb), 0.75);
}

/* placeholder (이미지 로드 실패 시) */
.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  background: linear-gradient(135deg, var(--style-bg), rgba(0,0,0,0.05));
  border: 2px dashed var(--style-text-secondary);
  border-radius: 0.5rem;
  opacity: 0.6;
}
.placeholder-icon { font-size: 2rem; }
.placeholder-text { font-size: 0.85rem; margin-top: 0.3rem; }

/* 카드 내 이미지 */
.card-img {
  width: 100%; height: 120px;
  object-fit: cover;
  border-radius: 0.5rem 0.5rem 0 0;
}
.card-image {
  width: 48px; height: 48px;
  object-fit: cover;
  border-radius: 0.3rem;
}

/* 반응형 */
@media (max-width: 768px) {
  .image-container { max-width: 95%; }
  .col-image { max-height: 200px; }
  .col-image[data-ratio="portrait"] { max-height: 250px; }
}
```

### 이미지 종횡비별 data-ratio 적용 규칙

HTML 생성 시 이미지의 종횡비를 확인하고 `data-ratio` 속성을 적용하세요:

```javascript
// 이미지 종횡비 판별 후 data-ratio 속성 자동 적용
document.querySelectorAll('.col-image').forEach(img => {
  img.addEventListener('load', function() {
    const ratio = this.naturalWidth / this.naturalHeight;
    if (ratio < 0.95) {
      this.dataset.ratio = 'portrait';  // 세로형
    } else if (ratio <= 1.05) {
      this.dataset.ratio = 'square';    // 정사각형
    }
    // 가로형(ratio > 1.05)은 기본 스타일 적용 (data-ratio 없음)
  });
});
```

> **권장**: 다운로드 모드에서는 이미지 다운로드 후 PIL로 종횡비를 확인하여 HTML 생성 시 `data-ratio` 속성을 직접 삽입하는 것이 더 안정적입니다. 런타임 JS 판별은 url-link 모드에서만 사용하세요.

---

## URL 안정성 가이드

외부 이미지 URL을 사용할 때, 소스별 안정성이 다릅니다. 안정적인 URL을 우선 선택하세요.

| 우선순위 | 소스 | 안정성 | URL 패턴 예시 | 비고 |
|---------|------|--------|-------------|------|
| 1 (최우선) | **Wikimedia Commons** | ⭐⭐⭐ 매우 안정 | `upload.wikimedia.org/wikipedia/commons/...` | 영구 URL, CC 라이선스, 교육용 최적 |
| 2 | **Wikipedia** | ⭐⭐⭐ 매우 안정 | `upload.wikimedia.org/wikipedia/en/...` | Wikimedia 인프라 공유 |
| 3 | **공공기관/정부** | ⭐⭐ 안정 | `*.go.kr`, `*.gov`, `*.edu` | 공식 자료, 장기 유지 |
| 4 | **CDN 서비스** | ⭐⭐ 보통 | `*.cloudfront.net`, `*.cdn.*`, `*.amazonaws.com` | 서비스 운영 중에는 안정 |
| 5 | **Unsplash/Pexels** | ⭐⭐ 보통 | `images.unsplash.com/...` | 무료 스톡 이미지, API 안정적 |
| 6 | **뉴스/블로그** | ⭐ 불안정 | 각 사이트별 | 수 개월 후 만료 가능, URL 변경 잦음 |
| 🚫 | **Google 캐시** | ❌ 사용 금지 | `encrypted-tbn*.gstatic.com` | 세션 만료 즉시 깨짐, 절대 사용 금지 |

**URL 선택 규칙:**
1. Wikimedia Commons 이미지가 있으면 항상 우선 선택
2. Google 캐시 URL(`encrypted-tbn`, `gstatic.com`)은 **절대 사용하지 않음**
3. HTTPS URL만 사용 (HTTP는 mixed content 에러 발생)
4. 검색 시 `site:wikimedia.org` 키워드 추가하면 안정적인 결과 획득

---

## 검색 실패 대응 (Fallback 전략)

| 실패 유형 | 대응 |
|----------|------|
| 검색 결과 없음 | 키워드 변경하여 재검색 (영어 → 간단한 영어) |
| URL이 Google 캐시뿐 | 원본 사이트 방문하여 실제 URL 추출, 또는 `site:wikimedia.org` 재검색 |
| 이미지 로드 실패 (onerror) | CSS placeholder 자동 표시 (gradient 배경 + 이모지 아이콘) |
| Playwright 연결 실패 | **아래 "Playwright 미사용 Fallback" 참조** |
| Chrome 확장 미연결 | **아래 "Playwright 미사용 Fallback" 참조** |
| 이미지 너무 작음 (< 200px) | 다음 검색 결과로 이동 |
| 이미지 해상도 < 1280px | 재검색하여 고해상도 이미지 선택 (FHD 디스플레이 흐릿함 방지) |
| 부적절한 이미지 감지 | safe=active 유지, 교육용 키워드 추가하여 재검색 |
| 세로형 이미지 (portrait) | 다른 가로형 이미지 선택 (검색 시 `&tbs=iar:w` 필터 사용) |
| 정사각형 이미지 (cover용) | `wide panoramic landscape` 키워드 추가하여 재검색 |
| 영어 인포그래픽 (한국어 발표) | 한국어 키워드로 재검색, 또는 텍스트 없는 사진 선택 |
| (download 모드) HTML이 이미지로 저장됨 | `file` 명령으로 감지 → 삭제 → 재다운로드 |
| (download 모드) 파일 크기 > 2MB | 다른 이미지 선택하여 재다운로드 |

**Fallback 순서:**
```
Playwright(url-link) → Playwright(download) → Google Custom Search API → WebFetch(Wikimedia) → 스크린샷 캡처 → placeholder → emoji
```

### Playwright 미사용 Fallback (Chrome 확장 미연결 시)

Playwright MCP(browser 도구)를 사용할 수 없는 경우(Chrome 확장 미설치, 브라우저 미실행 등) 아래 대안을 순서대로 시도합니다:

**방법 1: `/google-image-search` 스킬 사용 (Google Custom Search API)**
```
Skill: google-image-search 스킬이 설치되어 있으면 이를 사용합니다.
- Google Custom Search API 기반으로 동작
- API 키가 설정되어 있어야 함
- LLM 기반 이미지 선택으로 품질 높은 결과
```

**방법 2: WebFetch로 Wikimedia Commons 직접 검색**
```
1. WebFetch로 Wikimedia Commons API 호출:
   URL: https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={keyword}&srnamespace=6&format=json&srlimit=5

2. 검색 결과에서 파일명 추출 후 이미지 URL 구성:
   URL: https://commons.wikimedia.org/wiki/Special:FilePath/{filename}?width=1280

3. 이미지 URL을 HTML에 직접 삽입 (url-link 모드)
   - Wikimedia URL은 매우 안정적 (영구 URL)
   - 교육용 이미지로 적합 (CC 라이선스)
```

**방법 3: Emoji + CSS placeholder (최종 fallback)**
```
- 이미지 대신 이모지 아이콘 + gradient 배경 placeholder 사용
- CSS 컴포넌트(stat-highlight, card-grid 등)로 시각화
- 사용자에게 "이미지 검색 도구를 사용할 수 없어 텍스트 기반으로 생성했습니다" 안내
```

---

## 슬라이드별 이미지 검색 전략

### 표지 (cover)
- **검색 전략**: 주제의 대표적 이미지, 추상적/미적 이미지 선호
- **키워드 패턴**: `"{주제} wide panoramic landscape background"` 또는 `"{주제} banner aesthetic"`
- **⚠️ 필수 키워드**: `wide`, `panoramic`, `landscape`, `banner` 중 1개 이상 포함
- **⚠️ 종횡비**: 반드시 가로형(ratio > 1.5:1) 선택. 정사각형/세로형 절대 사용 금지
- **⚠️ 최소 해상도**: 1280px 이상 (권장 1920px — FHD 전체 배경에 적합)
- **사용 방식**: 배경 이미지 + 반투명 오버레이 (`background-size: cover`)
- **URL 팁**: Unsplash/Pexels 이미지가 커버에 적합 (고해상도, 무료, 와이드 이미지 풍부)

### 개념 설명 슬라이드
- **검색 전략**: 다이어그램, 인포그래픽 선호
- **키워드 패턴**: `"{개념} diagram explanation"` 또는 `"{개념} infographic"`
- **사용 방식**: image-focus 컴포넌트 또는 two-column
- **URL 팁**: Wikimedia Commons에 학술 다이어그램 풍부

### 사례/결과물 슬라이드
- **검색 전략**: 실제 사진, 제품 이미지 선호
- **키워드 패턴**: `"{사례} photo real"` 또는 `"{제품} product"`
- **사용 방식**: showcase-grid 또는 image-focus

### 인물 슬라이드
- **검색 전략**: 초상화, 공식 사진 선호
- **키워드 패턴**: `"{인물명} portrait official"`
- **사용 방식**: two-column (이미지 + 소개글)
- **URL 팁**: Wikipedia 인물 사진은 안정적이고 저작권 명확

---

## 주의사항

1. **저작권**: 교육 목적 사용(Fair Use)이지만, 상업적 재배포 시 주의. Wikimedia Commons / Creative Commons 이미지 우선.
2. **안전 검색**: `safe=active` 파라미터 반드시 포함. 교육 환경에서 부적절한 이미지 방지.
3. **URL 모드 기본**: 이미지 다운로드 없이 URL 직접 삽입이 기본. 용량 절약 및 배포 효율성.
4. **referrerpolicy 필수**: 모든 외부 이미지 `<img>` 태그에 `referrerpolicy="no-referrer"` 추가. 핫링킹 제한 우회.
5. **onerror 필수**: 외부 URL은 언제든 깨질 수 있음. 반드시 placeholder fallback 포함.
6. **Google 캐시 URL 금지**: `encrypted-tbn*.gstatic.com` URL은 세션 만료 시 즉시 깨짐. 절대 사용 금지.
7. **검색 속도**: 슬라이드당 1개 이미지 × Playwright 검색 시간 → 전체 생성 시간 증가. 사용자에게 안내.
8. **Google 차단 방지**: 과도한 자동화 검색 시 CAPTCHA 발생 가능. 검색 간 1~2초 대기.
9. **(download 모드 전용) 파일 크기**: 다운로드 시 2MB 초과 이미지 반드시 거부. Step 4-B 검증에서 확인.
