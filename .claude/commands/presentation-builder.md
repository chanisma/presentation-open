---
name: presentation-builder
description: >
  한국 교육용 프레젠테이션 HTML 페이지를 생성합니다. 프레젠테이션, 발표자료, 슬라이드, PPT 대체, 수업자료, 학교 발표,
  교육 프레젠테이션을 만들고 싶을 때 사용하세요. '발표자료 만들어줘', '프레젠테이션 생성', '슬라이드 제작', '수업 PPT' 등의
  요청에 반드시 이 스킬을 사용하세요. 퀵스타트: "빠르게", "간단하게", "바로", "지금 바로" 키워드가 있으면 퀵스타트 모드를 사용하세요.
allowed-tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep", "WebFetch", "AskUserQuestion"]
---

# Presentation Builder - 한국 교육용 프레젠테이션 생성기

단일 HTML 파일로 아름다운 프레젠테이션을 생성하는 스킬입니다.
브라우저 윈도우 크롬 스타일의 카드 기반 디자인을 사용하며, 반응형이고 터치/키보드/마우스 휠/프레젠터 클리커 네비게이션을 지원합니다.

## References 가이드

이 스킬은 progressive disclosure 방식으로 구성되어 있습니다. 아래 참조 파일들은 **해당 단계에서만** 읽으세요.

| 파일 | 읽는 시점 | 내용 |
|------|----------|------|
| `references/styles.md` | 스타일 선택 후, 해당 스타일 섹션만 | 31개 디자인 스타일 상세 스펙 (배경, 컬러, 폰트, 레이아웃) |
| `references/html-template.md` | HTML 생성 직전 | HTML 뼈대, CSS 설계, JS 네비게이션 코드 |
| `references/features.md` | 해당 기능 활성화 시에만 | 자동재생, 다크모드, 발표자노트, 인쇄, 전체화면 상세 |
| `references/web-image-search.md` | 이미지 스타일 `web-search` 선택 시 | Playwright 기반 웹 이미지 검색 및 다운로드 워크플로우 |

---

## ⚡ 퀵스타트 모드 (빠른 생성)

사용자가 "빠르게", "바로", "간단하게", "지금 바로" 등을 언급하거나, 주제만 간단히 제시한 경우 사용합니다.

**3가지만 확인 후 즉시 생성:**

```
다음 3가지만 알려주시면 바로 만들어 드립니다:
1. 📌 주제/제목: (예: 2026년 프로그래밍 수업 오리엔테이션)
2. 👥 발표 대상: (예: 중학교 1학년 학생 / 학부모 / 교사)
3. 🏫 학교/기관명: (선택사항)
```

**퀵스타트 기본값 (자동 적용):**

| 항목 | 기본값 |
|------|--------|
| 슬라이드 수 | 대상에 따라 자동 결정 (아래 템플릿 참조) |
| 디자인 스타일 | 대상에 따라 자동 선택 |
| 컬러 테마 | `blue` |
| 폰트 | `noto-sans-kr` |
| 이미지 | `미사용` (이모지 + CSS 컴포넌트) |
| 네비게이션 | 기본값 전체 적용 |
| 추가 기능 | 모두 off |

퀵스타트로 생성 후: "디자인이나 구성을 바꾸고 싶으시면 말씀해 주세요."

---

## 1단계: 설정 인터뷰 (표준 모드)

퀵스타트가 아닌 경우, `AskUserQuestion` 도구를 사용하여 대화형 UI로 설정을 수집한다.

### AskUserQuestion 기반 인터뷰 시스템

**워크플로우 (2단계로 수집):**

**Step A — 과목 선택 (AskUserQuestion, 동적 생성)**
1. 작업 디렉토리의 `pages.json`을 읽어 기존 과목 목록을 추출한다.
2. 프레젠테이션 수가 많은 순으로 정렬하여 **상위 3개**를 AskUserQuestion 옵션으로 구성한다.
3. 나머지 과목과 신규 과목은 "Other" (직접 입력)로 입력받는다.
4. `pages.json`이 없거나 과목이 없으면 이 단계를 건너뛰고 텍스트로 직접 입력받는다.

```
// 실행 시 동적으로 구성하는 방법:
1. Read 도구로 pages.json 읽기
2. subjects 배열에서 {name, icon, pages.length}를 추출
3. pages.length 내림차순 정렬 → 상위 3개를 options로 구성:
   - label: "{icon} {name}"
   - description: "기존 {count}개 프레젠테이션 보유"
4. AskUserQuestion 호출
```
→ 과목 확정 후, 수업 제목을 텍스트로 질문: "📌 수업 제목을 알려주세요. (예: 웹개발을 위한 자바스크립트 기초)"

**Step B — 선택형 설정 3개를 AskUserQuestion으로 한 번에 수집**
```json
AskUserQuestion({
  "questions": [
    {
      "question": "발표 대상은 누구인가요?",
      "header": "발표 대상",
      "options": [
        {"label": "고등학생 (Recommended)", "description": "전문 어휘 허용, 논리적 문체, 데이터 포함"},
        {"label": "학부모", "description": "정중한 일상 어휘, 공손한 문체, 실용 정보 우선"},
        {"label": "교사/교직원", "description": "교육 전문 용어, 간결한 업무 문체"}
      ],
      "multiSelect": false
    },
    {
      "question": "내용을 어떻게 구성할까요?",
      "header": "내용 구성",
      "options": [
        {"label": "자동 구성 (Recommended)", "description": "주제만으로 제가 알아서 슬라이드 내용을 생성합니다"},
        {"label": "직접 제공", "description": "내용을 텍스트로 붙여넣으면 슬라이드로 변환합니다"}
      ],
      "multiSelect": false
    },
    {
      "question": "이미지는 어떻게 할까요?",
      "header": "이미지",
      "options": [
        {"label": "미사용 (Recommended)", "description": "이모지와 CSS 컴포넌트만 사용. 가장 빠르고 오프라인 지원"},
        {"label": "자동 검색", "description": "웹에서 이미지를 자동 검색하여 삽입 (슬라이드당 +30초)"},
        {"label": "직접 지정", "description": "키워드나 URL로 원하는 이미지를 직접 알려주세요"}
      ],
      "multiSelect": false
    }
  ]
})
```

**Step C — 참고 자료 (선택사항)**
선택형 수집 후 추가 질문:
"📎 참고할 자료가 있나요? (없으면 '없음') — PDF, PPTX, 한글(HWPX), 이미지, 구글 문서 URL 지원"

**답변 매핑 규칙:**
- "고등학생" → high_school (스타일: Bento Grid)
- "학부모" → parents (스타일: Soft Pink Card UI / Nordic Minimalism)
- "교사/교직원" → teachers (스타일: Swiss International / Bento Grid)
- Other 선택 시 → 사용자 입력을 그대로 사용, 맥락에 맞는 스타일 자동 선택

**과목 선택지 동적 생성 규칙:**
- `pages.json`에서 subjects를 읽어 과목명, 아이콘, 프레젠테이션 수를 추출
- 프레젠테이션 수가 많은 순으로 정렬하여 상위 3개를 옵션으로 표시
- 나머지 과목과 신규 과목은 "Other" (직접 입력)로 입력
- `pages.json`이 없으면 과목 선택 단계를 건너뛰고 텍스트로 직접 입력받음

**설정 수집 완료 후:** `scripts/interview.py summary`와 `config`를 호출하여 자동 추천 설정을 확인하고 사용자에게 요약을 보여준다.
```
Bash: python scripts/interview.py summary --answers '{...}'
Bash: python scripts/interview.py config --answers '{...}'
```

**이미지 옵션 상세:**

| 옵션 | 동작 | 소요 시간 | 결과물 |
|------|------|----------|--------|
| **자동 검색** | Playwright로 Google Images 검색 → URL 삽입 (url-link 모드) | 슬라이드당 +30초 | 실제 사진/다이어그램 포함 |
| **사용자 설명** | 사용자가 키워드나 URL 제공 → 해당 이미지로 삽입 | 빠름 | 사용자 의도에 정확히 맞는 이미지 |
| **미사용** | 이모지 아이콘 + CSS 컴포넌트만 | 즉시 | 깔끔하고 가벼움, 오프라인 완벽 지원 |

- **자동 검색**: `references/web-image-search.md`의 이미지 사용 판단 기준에 따라 모든 슬라이드가 아닌 **30~50%**에만 이미지 삽입. 기본 url-link 모드(다운로드 없음).
- **사용자 설명**: 사용자가 제공한 키워드로 검색하거나, URL을 직접 `<img src>`에 삽입
- **미사용**: CSS 컴포넌트(stat-highlight, card-grid, diagram, comparison 등)로 시각화. **⚠️ 이미지가 없다고 이모지로 보상하지 마세요.** 이모지 예산 규칙(슬라이드당 최대 3개)은 이미지 유무와 무관하게 동일 적용됩니다. 포멀 스타일에서는 이모지 대신 유니코드 기호(✦ ◆ ※ ❧ ⊕)나 `border-left` 색상 구분을 사용하세요.

### 선택 질문 (사용자가 원할 때만)

사용자가 "커스터마이징", "세부 설정", "직접 고를게요" 등을 언급할 때만 아래 항목을 **하나씩** 물어보세요.

**디자인 분위기** → 아래 스타일 추천 매트릭스 참조
**슬라이드 수** → 기본: 대상/유형별 자동 결정
**추가 기능** → QR코드, 다크모드, 발표자노트, 자동재생 등

---

## 1.5단계: 외부 자료 참조 워크플로우

사용자가 참고 자료를 제공한 경우, 아래 형식별 처리 방법을 따릅니다.

### 자료 형식 자동 감지 (확장자 기반)

| 확장자 / 형식 | 처리 방법 | 도구 |
|--------------|----------|------|
| `.pdf` | `opendataloader-pdf`로 마크다운 변환 후 읽기 | `Bash` + `Read` |
| `.pptx`, `.ppt` | `/pptx` 스킬로 내용 추출 | `Skill: pptx` |
| `.hwpx`, `.hwp` | `/hwpxskill` 스킬로 읽기 | `Skill: hwpxskill` |
| `.png`, `.jpg`, `.jpeg`, `.webp` | Read 도구로 시각적 분석 | `Read` |
| `.csv`, `.xlsx` | Read 도구 또는 Bash로 읽기, 통계/차트 슬라이드 변환 | `Read` / `Bash` |
| Google Docs/Slides/Sheets URL | WebFetch 또는 브라우저 자동화(GWS)로 접근 | `WebFetch` / `Browser` |
| 기타 텍스트 파일 (`.txt`, `.md`) | Read 도구로 읽기 | `Read` |

### 형식별 처리 상세

#### PDF 파일 (opendataloader-pdf 사용)
```
1. Bash로 PDF를 마크다운으로 변환:
   python -c "from opendataloader_pdf import convert; convert('<파일경로>', output_dir='<출력폴더>', format='markdown', quiet=True)"

   옵션:
   - pages="1-5" : 특정 페이지만 변환
   - format="markdown-with-images" : 이미지 포함 마크다운
   - use_struct_tree=True : 태그된 PDF의 구조 활용
   - table_method="cluster" : 표 감지 향상

2. 변환된 .md 파일을 Read 도구로 읽기
3. 마크다운 헤딩(#, ##)을 슬라이드 구분 기준으로 활용
4. 표는 comparison 컴포넌트, 목록은 activity-list로 자동 매핑
5. 원본 문서의 섹션 구조를 존중하여 슬라이드 순서 결정
```

#### PPTX 파일
```
1. /pptx 스킬 활용하여 슬라이드별 텍스트, 제목, 구조 추출
2. 기존 슬라이드 순서와 주요 내용을 파악
3. 텍스트 내용을 HTML 프레젠테이션으로 재구성
4. 원본 PPTX의 논리적 흐름을 유지하되, 디자인은 새 스타일 적용
```

#### HWPX / HWP 파일 (한글 문서)
```
1. /hwpxskill 스킬로 한글 문서 내용 읽기
2. 한국 교육 현장 공문/학습지/안내문 형식을 파악
3. 문서의 항목, 번호, 표 등을 슬라이드 컴포넌트로 변환
   - 번호 목록 → activity-list 또는 task-list
   - 표 → comparison 컴포넌트
   - 제목/섹션 → section-overview
```

#### 이미지 파일 (PNG, JPG 등)
```
1. Read 도구로 이미지 시각적 분석
2. 이미지 내 텍스트, 도표, 구조 파악
3. 분석 내용을 슬라이드로 구성, 원본 이미지는 image-focus 컴포넌트에 삽입 가능
```

#### CSV / Excel 데이터
```
1. 데이터 구조와 주요 수치 파악
2. 핵심 지표 → stat-highlight 컴포넌트
3. 비교 데이터 → comparison 또는 two-column 컴포넌트
4. 시계열/변화 → timeline 컴포넌트
5. 데이터 출처를 슬라이드 하단에 표기
```

#### Google Workspace 문서

**방법 1: WebFetch (공개 문서)**
```
공개 문서 (공유 링크 있음):
- WebFetch로 URL 접근하여 내용 추출
- Google Docs/Slides/Sheets의 공개 공유 링크에서 텍스트 추출
```

**방법 2: 브라우저 자동화 - GWS (로그인된 문서, 권장)**
```
사용자가 Chrome에서 Google 계정에 로그인된 상태라면:
1. mcp__claude-in-chrome 도구로 브라우저에서 직접 문서 접근
2. Google Docs:
   - navigate로 문서 URL 열기
   - get_page_text로 전체 텍스트 추출
   - 제목/본문/목록/표 구조 파악
3. Google Slides:
   - navigate로 프레젠테이션 URL 열기
   - get_page_text로 슬라이드별 텍스트 추출
   - 슬라이드 순서와 구조를 파악하여 HTML 프레젠테이션으로 재구성
4. Google Sheets:
   - navigate로 스프레드시트 URL 열기
   - get_page_text 또는 javascript_tool로 셀 데이터 추출
   - 데이터를 stat-highlight, comparison 등 컴포넌트로 변환

주의: 브라우저 자동화 시 alert/confirm 다이얼로그를 트리거하지 않도록 주의
```

**방법 3: 수동 제공 (접근 불가 시)**
```
WebFetch와 브라우저 자동화 모두 불가능한 경우:
- 사용자에게 안내:
  "구글 문서에 직접 접근이 어렵습니다.
   다음 방법 중 하나를 선택해 주세요:
   ① Chrome에서 해당 문서를 열어주세요 (브라우저 자동화로 읽기)
   ② 문서 내용을 텍스트로 붙여넣기
   ③ 파일 → 다운로드 → PDF 또는 PPTX로 저장 후 경로 제공"
```

**처리 우선순위**: 브라우저 자동화(GWS) > WebFetch > 수동 제공

### 자료 처리 후 워크플로우

```
자료 읽기 완료 →
  핵심 내용 목록 추출 →
  슬라이드 구조 자동 제안 (사용자에게 확인):
    "자료에서 다음 구조를 제안합니다:
     1. [섹션 제목] - [컴포넌트 유형]
     2. ...
     이 구조로 진행할까요, 아니면 수정하시겠어요?"
  →
  확인 후 HTML 생성
```

**원본 자료 존중 원칙:**
- 원본 문서의 논리적 순서와 섹션 구조를 최대한 유지
- 내용을 임의로 삭제하지 않고, 많으면 슬라이드를 추가로 분리
- 원본에서 온 수치, 날짜, 고유명사는 정확히 그대로 사용
- 디자인(색상, 레이아웃)만 새로 적용하고 내용은 원본 기준

---

## 2단계: 슬라이드 구조 자동 추천

발표 대상과 목적에 따라 아래 템플릿 중 하나를 자동 선택합니다. 사용자가 수정을 원하면 조정합니다.

### 🏫 오리엔테이션용 (학생 대상, 학기 초)

**추천 슬라이드 수:** 10~12장 | **추천 스타일:** `Glassmorphism`, `Bento Grid`, `Soft Pink Card UI`

```
1. 표지 (cover) - 연도, 과목명, 교사 소개
2. 목차 (toc) - 오늘 배울 내용
3. 수업 소개 (section-overview) - 과목이 뭘 배우나
4. 연간 학습 로드맵 (timeline) - 학기별 주요 단원
5. 수업 방식 (card-grid) - 이론/실습/프로젝트
6. 평가 기준 (comparison) - 성적 구성 비율
7. 준비물 & 규칙 (activity-list) - 필수 준비 사항
8. 주요 일정 (deadline-callout) - 시험, 제출 마감일
9. 선생님 소개 (two-column) - 연락처, 상담 시간
10. 기대하는 것 (quote) - 동기 부여 메시지
11. 마무리 (end) - 기대감 메시지 + QR
```

### 📚 수업자료용 (개념 설명, 단원 학습)

**추천 슬라이드 수:** 8~15장 | **추천 스타일:** `Swiss International`, `Nordic Minimalism`, `Dark Academia`

```
1. 표지 (cover) - 단원명, 학습 목표
2. 학습 목표 (stat-highlight) - 이번 수업에서 배울 3가지
3. 핵심 개념 도입 (section-overview) - 왜 배우나
4~N. 개념 설명 (card-grid / two-column / activity-list) - 핵심 내용
N+1. 예시 & 실습 (showcase-grid / task-list) - 실제 적용
N+2. 정리 & 요약 (stat-highlight) - 핵심 포인트 3가지
N+3. 다음 시간 예고 (deadline-callout) - 숙제, 다음 단원
N+4. 마무리 (end)
```

### 👨‍👩‍👧 학부모 안내용 (학부모 대상)

**추천 슬라이드 수:** 8~10장 | **추천 스타일:** `Soft Pink Card UI`, `Nordic Minimalism`, `Monochrome Minimal`

```
1. 표지 (cover) - 학교명, 행사/안내 제목, 날짜
2. 안내 목적 (section-overview) - 왜 이 안내를 드리나
3. 핵심 내용 1 (card-grid) - 주요 변경/안내 사항
4. 핵심 내용 2 (activity-list) - 세부 사항
5. 일정 & 마감 (deadline-callout) - 중요 날짜, 제출 서류
6. 학교 지원 방안 (two-column) - 학교에서 하는 것 vs 가정에서 할 것
7. 자주 묻는 질문 (card-grid) - FAQ 형식
8. 연락처 & 문의 (end) - 담임 연락처, QR코드
```

### 🎓 교사 연수용 (교사/직원 대상)

**추천 슬라이드 수:** 10~14장 | **추천 스타일:** `Swiss International`, `Bento Grid`, `Editorial Magazine`

```
1. 표지 (cover) - 연수 제목, 강사명, 날짜
2. 목차 (toc)
3. 배경 & 필요성 (two-column) - 현황 vs 문제점
4. 핵심 내용 1~3 (section-overview + card-grid)
5. 실습 / 적용 사례 (showcase-grid / task-list)
6. 토론 & Q&A 안내 (activity-list)
7. 실행 계획 (timeline) - 적용 단계
8. 참고 자료 (card-grid) - 링크, 자료 목록
9. 마무리 (end) - 핵심 요약, QR
```

### 🚀 프로젝트 발표용 (학생 결과물 발표)

**추천 슬라이드 수:** 6~10장 | **추천 스타일:** `Glassmorphism`, `Bento Grid`, `Neo-Brutalism`

```
1. 표지 (cover) - 프로젝트명, 팀원
2. 문제 정의 (two-column) - 문제 vs 해결 방향
3. 과정 (timeline) - 단계별 진행 과정
4. 결과물 소개 (showcase-grid / image-focus)
5. 핵심 성과 (stat-highlight) - 수치, 데이터
6. 배운 점 (card-grid) - 팀원별 소감
7. 마무리 (end) - 감사 + 데모 QR
```

---

## 3단계: 디자인 스타일 & 컬러 테마

### 모던 디자인 스타일 적용

사용자가 디자인 스타일을 선택한 경우:

1. **스펙 로딩**: `references/styles.md`에서 선택된 스타일의 상세 스펙을 읽기
2. **배경 적용**: 스타일의 Background 스펙을 `body` 및 `.slide` 배경에 적용
3. **컬러 매핑**: 스타일의 Colors를 CSS 변수로 변환 (`--style-bg`, `--style-primary`, `--style-accent`, `--style-text`, `--style-text-secondary`)
4. **폰트 적용**: 스타일 스펙의 Font를 Google Fonts CDN으로 로딩
5. **레이아웃 변환**: Layout/Signature Elements를 슬라이드 구조에 반영
6. **시그니처 요소**: 각 슬라이드에 Signature Elements를 최소 1개 포함
7. **금지 사항**: 스타일의 Avoid 항목을 반드시 준수

**스타일 추천 매트릭스 (발표 목적별):**

| 프레젠테이션 목적 | 추천 스타일 |
|-------------------|------------|
| 테크 / AI / 스타트업 | Glassmorphism, Aurora Neon, Cyberpunk Outline, SciFi Holographic |
| 기업 / 컨설팅 / 금융 | Swiss International, Monochrome Minimal, Editorial Magazine, Architectural Blueprint |
| 교육 / 연구 / 역사 | Dark Academia, Nordic Minimalism, Brutalist Newspaper |
| 한국 학교 / 학부모 안내 | Soft Pink Card UI |
| 브랜드 / 마케팅 | Gradient Mesh, Typographic Bold, Duotone Split, Risograph Print |
| 제품 / 앱 / UX | Bento Grid, Claymorphism, Pastel Soft UI, Liquid Blob |
| 엔터테인먼트 / 게임 | Retro Y2K, Dark Neon Miami, Vaporwave, Memphis Pop |
| 에코 / 웰니스 / 문화 | Hand-crafted Organic, Nordic Minimalism, Dark Forest Nature |
| IT 인프라 / 아키텍처 | Isometric 3D Flat, Cyberpunk Outline, Architectural Blueprint |
| 포트폴리오 / 크리에이티브 | Monochrome Minimal, Editorial Magazine, Risograph Print, Maximalist Collage |
| 피치덱 / 전략 | Neo-Brutalism, Duotone Split, Bento Grid, Art Deco Luxe |
| 럭셔리 / 이벤트 / 갈라 | Art Deco Luxe, Monochrome Minimal, Dark Academia |
| 과학 / 바이오텍 / 혁신 | Liquid Blob, SciFi Holographic, Aurora Neon |

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

> **스타일 미선택 시**: 아래 기본 테마를 사용합니다.

| 설정 | 옵션 | 기본값 |
|------|------|--------|
| 컬러 테마 | `green`, `blue`, `purple`, `orange`, `navy`, `rose`, `custom` | `green` |
| 폰트 | `noto-sans-kr`, `pretendard`, `wanted-sans`, `gmarket-sans` | `noto-sans-kr` |
| 카드 스타일 | `browser` (macOS 윈도우), `minimal` (깔끔), `rounded` (둥근 모서리) | `browser` |
| 배경색 | 테마 메인 컬러 또는 커스텀 HEX | 테마 기본 |

```
green:  --main: #3aaa5c  --dark: #2d8a49  --light: #e8f5e9  --accent: #43b867
blue:   --main: #2196f3  --dark: #1565c0  --light: #e3f2fd  --accent: #42a5f5
purple: --main: #7c4dff  --dark: #6200ea  --light: #ede7f6  --accent: #9c27b0
orange: --main: #ff9800  --dark: #e65100  --light: #fff3e0  --accent: #ffb74d
navy:   --main: #1a237e  --dark: #0d1642  --light: #e8eaf6  --accent: #3f51b5
rose:   --main: #e91e63  --dark: #ad1457  --light: #fce4ec  --accent: #f06292
```

`custom` 선택 시 사용자에게 메인 컬러 HEX를 물어보고, dark/light/accent를 자동 생성하세요.

**보조 컬러 (모든 테마 공통):** 뱃지, 인포박스, 보더 등에 사용
```
blue-accent:   #2196f3 / bg: #e3f2fd
orange-accent: #ff9800 / bg: #fff3e0
purple-accent: #9c27b0 / bg: #f3e5f5
red-accent:    #e53935 / bg: #fce4ec
green-sub:     #43b867 / bg: #e8f5e9
```

---

## 4단계: 슬라이드 컴포넌트 카탈로그

아래 컴포넌트들을 조합하여 슬라이드를 구성합니다. 사용자가 특별히 지정하지 않으면, 내용에 맞게 적절한 컴포넌트를 선택하세요.

| 컴포넌트 | 설명 | 적합 용도 |
|----------|------|----------|
| `cover` | 연도 뱃지 + 대제목 + 부제목 + 기관명, 중앙 정렬 | 표지 |
| `toc` | 번호 리스트 + goToSlide 연결 + 호버 효과 | 목차 |
| `section-overview` | 아이콘+제목 divider + highlight-box + grid-2 카드 | 섹션 시작 |
| `activity-list` | 이모지+제목+설명 리스트, 선택적 사이드 이미지 | 활동/항목 나열 |
| `card-grid` | grid-2 또는 grid-3, 아이콘+제목+설명 카드 | 항목 비교/소개 |
| `showcase-grid` | 5열 그리드, 큰 이모지+이름+설명, 호버 효과 | 쇼케이스 |
| `task-list` | 번호+제목+설명, 왼쪽 컬러 보더 | 과제/단계 목록 |
| `timeline` | 가로 배치, 원형 마커, highlight 강조 | 일정/연혁 |
| `comparison` | 표 형태, 테마 dark 헤더, 짝수행 배경 교대 | 비교 |
| `deadline-callout` | 큰 아이콘+날짜+설명, 주황색 테두리, 액션 버튼 | 마감/강조 알림 |
| `cosware-cards` | 3열 그리드, 고유 배경색 카드 | 서비스/도구 소개 |
| `qr-section` | 중앙 QR 이미지 + 라벨 + URL | QR 코드 |
| `stat-highlight` | 큰 숫자+라벨 그리드, highlight-box | 통계/수치 강조 |
| `quote` | 큰 따옴표 + 인용 텍스트(이탤릭) + 출처 | 인용문/명언 |
| `two-column` | 좌우 분할 (50:50 / 60:40) | 비교, 전후 대비 |
| `image-focus` | 큰 이미지 영역 + 캡션 | 사진/도표 설명 |
| `end` | 감사 메시지 + 핵심 요약 highlight-box + QR | 마무리 |

---

## 5단계: HTML 생성

> HTML/CSS/JS 코드 템플릿은 `references/html-template.md`를 읽으세요.

핵심 원칙만 여기에 기록합니다:

- **단일 HTML 파일**, 외부 의존성은 Google Fonts CDN만 허용
- **Base URL 보정 스크립트**: `<head>` 최상단(`<meta viewport>` 바로 아래)에 아래 스크립트를 **반드시** 포함한다. 로컬 서버에서 trailing slash 없이 디렉토리 URL로 접근할 때 상대 경로(이미지, 에셋)가 깨지는 것을 방지한다:
  ```html
  <script>if(!location.pathname.endsWith('/')&&!location.pathname.endsWith('.html')){var b=document.createElement('base');b.href=location.pathname+'/';document.head.appendChild(b);}</script>
  ```
- **빔프로젝터 가독성**: 1920x1080 기준 본문 최소 22px, 어떤 텍스트도 0.8rem 미만 금지
- **반응형 폰트**: `clamp()`로 뷰포트 대응
- **카드 스타일별 상단바**: browser(dot 3개), minimal(타이틀만), rounded(둥근+그림자)
- **네비게이션 바**: 고정 px(14px)로 본문 rem과 독립, 최소 크기 유지
- **SVG 아이콘**: 유니코드(◀▶) 대신 반드시 SVG 사용 (폰트별 정렬 문제 방지)
- **이모지 절제**: 한 슬라이드에 **동시에 보이는 이모지는 최대 3개**. section-divider 아이콘도 이 예산에 포함된다. 카드 그리드에 아이콘을 넣으면 section 아이콘은 생략하는 것이 좋다. 본문 텍스트·highlight-box·tip 설명문 안에 이모지를 넣지 않는다. 같은 이모지 반복 금지. **리스트 항목(`<li>`) 내 이모지 아이콘(예: "🍬 단맛")도 이모지 예산에 포함된다.** 포멀한 스타일(Dark Academia, Swiss International, Monochrome 등)에서는 이모지 대신 유니코드 기호(❧ ✦ ◆ ※ ⊕)나 SVG 아이콘을 사용한다.
  - **이모지 정의**: Unicode Emoji 속성을 가진 문자(😀🎯🔬 등). 유니코드 기호(✦ ◆ ※ ❧ ⊕ ① ② ③ ⚡)는 이모지가 아니며 예산에 포함되지 않는다.
  - **예산 면제 슬라이드**: cover(표지)와 end(마무리) 슬라이드는 이모지 예산에서 면제된다. 단, 면제 슬라이드에서도 과도한 사용(5개 이상)은 자제한다.
- **⚠️ 색상 대비 검증 (가장 빈번한 위반 — 반드시 준수)**: 스타일 팔레트 적용 시 다음 최소 대비를 확인한다. `--text` on `--bg` ≥ 7:1, `--text-secondary` on `--bg` ≥ 4.5:1, `--primary` on `--bg` ≥ 3:1. `--text`가 `--text-secondary`보다 대비가 낮으면 안 된다(이름과 역할 일치). **⚠️ `--text-secondary` 주의**: 대부분의 스타일 스펙이 보조 텍스트 색상을 실제 접근성 기준보다 밝게 지정한다. 스타일 스펙 적용 후 반드시 `--text-secondary`를 점검하고, 4.5:1 미달 시 명도를 약 10% 낮춘다(밝은 배경 기준). 예시: `#777777`→`#757575`, `#8A7A6A`→`#6D6053`, `#888888`→`#767676`. **대비 미달 시 자동 조정 절차**: (1) 밝은 배경이면 해당 색상의 명도를 10~15% 낮춘다. (2) 어두운 배경이면 해당 색상의 명도를 10~15% 높인다. (3) 조정 후에도 미달이면 `--text`와 `--text-secondary`의 값을 교환하거나, 스타일 스펙 범위 내에서 가장 가까운 적합 색상을 선택한다.
- **인라인 스타일 금지 (허용 예외 있음)**: HTML body 내 `style=""` 속성 사용을 최소화한다. 반복되는 패턴은 CSS 클래스로 정의한다. 표지/마무리 슬라이드의 투명 카드는 `.browser-card--frameless` 클래스를 사용한다. 단, Neo-Brutalism 등 두꺼운 테두리가 스타일 정체성인 경우, 표지에서도 프레임을 유지할 수 있다(frameless 대신 스타일 시그니처 유지 우선). **허용되는 인라인 스타일**: (1) 이미지 fallback placeholder의 `style="display:none;"`, (2) cover 슬라이드의 `background-image: url(...)` (JS `data-bg` 패턴 권장), (3) 전체화면 버튼의 초기 `display:none`. 이 외 반복되는 인라인 스타일은 CSS 클래스로 추출해야 한다.
- **인라인 이벤트 핸들러 금지**: HTML body에 `onclick`, `onkeydown`, `onmouseover` 등 인라인 이벤트 핸들러를 사용하지 않는다. 모든 이벤트는 `<script>` 블록에서 `addEventListener`로 등록한다. **예외**: `<img>` 태그의 `onerror`는 이미지 로드 실패 시 fallback UI 표시 용도로 허용한다 (예: `onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"`). 이 외의 인라인 이벤트 핸들러는 모두 금지.
- **미사용 폰트 금지**: `<link>` 태그로 로드하는 폰트는 CSS에서 실제 사용하는 것만 포함한다. 스타일 스펙에 명시된 폰트만 로드하고, 사용하지 않는 폰트를 Google Fonts URL에 포함하지 않는다.
- **필수 슬라이드 레이아웃 CSS 구조**: 모든 스타일에서 반드시 아래 CSS 구조를 준수해야 한다. 이 구조가 없으면 overflow가 발생한다:
  ```css
  .presentation { height: calc(100vh - 42px); position: relative; overflow: hidden; }
  .slide { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 0.8rem 1.2rem; opacity: 0; pointer-events: none; }
  .slide.active { opacity: 1; pointer-events: auto; }
  .browser-card { width: 100%; max-width: 1200px; max-height: calc(100vh - 4.8rem); display: flex; flex-direction: column; overflow: hidden; }
  .browser-content { flex: 1; overflow-y: auto; padding: 1rem 2rem 0.8rem; }
  ```
  특히 `.browser-card`의 `max-height: calc(100vh - 4.8rem)`과 `.browser-content`의 `flex: 1; overflow-y: auto`는 반드시 포함해야 한다. `display: none/block` 전환 방식을 사용하면 안 되며, `opacity` 전환 방식을 사용한다.

---

## 5.5단계: 슬라이드 세로 높이 검증

> **목표**: 모든 슬라이드가 1920×1080 전체화면에서 스크롤 없이 표시되도록 보장합니다.

### 높이 예산 계산 (1080px 기준, base font 28px)

```
전체 뷰포트:          1080px
─ progress bar:         3px
─ nav bar:             42px
─ slide padding:       34px  (1.2rem × 28px)
─ browser topbar:      35px
─ content padding:     50px  (1.8rem × 28px)
─ 안전 마진:           60px  (line-height, border 등 미세 요소)
──────────────────────────────
content 가용 높이:    ≈800px (보수적 기준)
```

> **주의**: 이론상 860px이나, line-height·border·box-shadow·margin collapse 등 미세 요소로 인해 실측에서 차이가 발생합니다. 안전하게 **800px**을 기준으로 설계하세요.

### 요소별 높이 참조표 (1920×1080 실측 기반)

> 이 수치는 Playwright로 실측한 값입니다. 추정이 아닌 실측 기준으로 설계하세요.

| 요소 | 실측 높이 | 비고 |
|------|----------|------|
| section-label + h2 + rule | **95px** | 라벨+제목+구분선 세트 |
| section-divider (아이콘 인라인 + 제목 + 자막) | **80px** | 인라인 아이콘 방식 |
| highlight-box (1줄) | **100px** | padding 포함 |
| highlight-box (2줄) | **140px** | padding 포함 |
| highlight-box (3줄+) | **170px** | 가급적 2줄 이하로 |
| card (아이콘 + 제목 + 본문 1줄) | **120px** | padding+gap 포함 |
| card (아이콘 + 제목 + 본문 2줄) | **150px** | padding+gap 포함 |
| grid-2 (2×1) | **카드높이 + gap 17px** | 1행 |
| grid-2 (2×2) | **카드높이×2 + gap×3 ≈ 350px** | 2행 (본문 1줄 기준) |
| grid-3 (3×2) | **카드높이×2 + gap×3 ≈ 350px** | 2행 |
| toc-item (1개) | **80px** | 패딩+호버영역 포함 |
| activity-item (1개) | **140px** | 아이콘+제목+설명 |
| step-item (2x2 grid) | **110px** | compact 레이아웃 |
| stat-card | **120px** | 아이콘+숫자+라벨 |
| tip-item | **55px** | 아이콘+텍스트 |
| gold-rule / divider | **5px** | 구분선 |
| gap (grid/flex) | **17px** | 0.6rem 기준 |

### 슬라이드당 콘텐츠 제한 규칙

content 가용 높이 실측값은 약 **880px**이나, 안전 마진을 포함하여 **800px**을 예산으로 사용합니다.

**콘텐츠 조합 상한 (800px 이내):**
- section-header(95px) + grid-2×2(350px) + highlight(140px) = **585px** ✓
- section-header(95px) + activity-item×4(560px) = **655px** ✓
- section-header(95px) + activity-item×5(700px) = **795px** ⚠️ 한계
- section-header(95px) + toc-item×8(640px) = **735px** ✓
- section-header(95px) + toc-item×10(800px) = **895px** ✗ 넘침!

**절대 금지:**
- activity-item 6개 이상을 한 슬라이드에 배치
- toc-item 9개 이상을 한 슬라이드에 배치
- card-grid 3행 이상 (grid-2×3, grid-3×3 등)
- highlight-box 2개 이상을 한 슬라이드에 배치
- two-column 레이아웃에서 한 쪽에 5개 이상의 리스트 항목

**10슬라이드 이상 프레젠테이션 추가 규칙:**
- 콘텐츠 슬라이드(표지/목차/마무리 제외)에서 콘텐츠 조합을 더 보수적으로 설계
- 한 슬라이드에 activity-item은 최대 3개 (4개가 아닌 3개)
- highlight-box + card-grid 2×2 조합은 highlight를 1줄로 제한
- two-column은 한 쪽에 최대 3개 항목

### 설계 시 검증 방법

각 슬라이드의 콘텐츠 요소 높이를 합산하여 **860px 이내**인지 확인합니다:

```
슬라이드 높이 = section-divider
             + grid 높이 (카드 높이 × 행 수 + gap × (행 수 - 1))
             + highlight-box (있으면)
             + margin/gap 합산

→ 800px 이내이면 OK
→ 초과하면 조정:
  1. 텍스트 간결하게 축약
  2. 카드 padding/gap 축소
  3. section-divider를 아이콘 인라인 배치로 변경
  4. 콘텐츠를 2개 슬라이드로 분리
```

### 넘침 방지 CSS 가이드라인

- card padding: `0.8rem 1rem` 이하
- grid gap: `0.6rem` 이하
- highlight-box margin: `0.6rem 0` 이하
- 카드 본문 텍스트 1~2줄 이내로 유지

### ⚠️ section-divider 필수 HTML 패턴 (P1) — 가장 빈번한 위반 항목

모든 콘텐츠 슬라이드의 섹션 헤더는 반드시 아이콘을 h2 왼쪽에 인라인 배치한다. **section-icon이 없는 h2는 절대 사용하지 않는다.**

**예외 슬라이드 (section-icon 불필요):** cover(표지), end(마무리) 슬라이드만 예외. TOC(목차), 참고자료, 쇼케이스 등 정보 나열형 슬라이드에도 반드시 section-icon을 포함한다.

```html
<div class="section-header">
  <h2><span class="section-icon" aria-hidden="true">📊</span> 데이터 과학이란?</h2>
  <p class="section-subtitle">데이터를 다루는 학문의 기초</p>
</div>
```

```css
.section-icon { display: inline; font-size: 1.2em; margin-right: 0.4em; vertical-align: -0.1em; }
```

> **CSS 값 허용 범위**: font-size `1.1em~1.3em`, margin-right `0.3em~0.5em`, vertical-align `-0.05em~-0.15em`. 스타일별 미세 조정은 이 범위 내에서 허용한다.

포멀한 스타일(Dark Academia, Swiss International, Nordic, Monochrome)에서는 이모지 대신 유니코드 기호(◆ ✦ ※ ❧)를 사용한다.

### 카드 그리드 이모지 예산 규칙 (P2)

슬라이드당 동시에 보이는 이모지 최대 3개. 카드 그리드에서는:

```
grid-2 (2항목): 카드 아이콘 OK (2개) + section 아이콘 OK = 최대 3개
grid-2 (4항목): 카드 아이콘 3개까지만, 4번째 카드는 아이콘 생략
grid-3 (3항목): 카드 아이콘 OK (3개), section 아이콘 생략
grid-3 (6항목): 카드 아이콘 3개까지만 (첫 행만), 나머지는 색상 테두리로 구분
```

**⚠️ card-grid 3×2 구체 예시 (가장 혼동이 많은 패턴):**
```
6개 카드가 있는 grid-3 슬라이드:
  - section-icon: 생략 (카드 아이콘에 예산 양보)
  - 카드 1~3 (첫 행): card-icon 이모지 사용 (🔬 📊 🌍) → 3개 = 예산 소진
  - 카드 4~6 (둘째 행): card-icon 대신 border-left 색상으로 구분
  - 총 이모지: 3개 ✓

잘못된 예: section-icon(🧪) + 카드 6개 모두 이모지 = 7개 ✗
```

### 카드 그리드 일관성 규칙 (P2.5)

- **카드 아이콘 일관성**: card-grid 내 모든 카드에 `card-icon`을 일관되게 포함하거나, 모두 제외해야 한다. 일부 카드에만 아이콘을 넣고 마지막 카드에서 누락하는 것은 금지. 이모지 예산 초과 시 아이콘 대신 색상 좌측 테두리(`border-left`)로 카드를 구분한다.
- **순차 등장 애니메이션**: card-grid, stat-grid 등 다수 항목이 나열되는 컴포넌트에는 기본적으로 staggered animation을 적용한다:
  ```css
  .slide.active .card { animation: popUp 0.5s ease-out both; }
  .slide.active .card:nth-child(2) { animation-delay: 0.08s; }
  .slide.active .card:nth-child(3) { animation-delay: 0.16s; }
  .slide.active .card:nth-child(4) { animation-delay: 0.24s; }
  ```

### 색상 변수 규칙 (P3)

- `--style-accent`는 `--style-primary`와 반드시 시각적으로 구분되어야 한다 (HSL 기준 색상 30° 이상 차이 또는 명도 20% 이상 차이)
- 같은 값을 두 변수에 할당하지 않는다. 단, 단색(monochrome) 팔레트 스타일(Swiss International, Neo-Brutalism 등)에서 스타일 스펙이 동일 색상을 지정한 경우는 예외로 허용한다 (예: `--style-primary`와 `--style-text`가 모두 `#000000`인 경우).
- **⚠️ CSS 변수는 `--style-*` 표준 변수만 사용한다.** `--main`, `--white`, `--gray-200`, `--gray-600`, `--gray-700`, `--light`, `--dark` 등 레거시 변수를 생성하지 않는다. 모든 색상 참조는 `--style-bg`, `--style-primary`, `--style-accent`, `--style-text`, `--style-text-secondary`와 그 rgba() 변형만 사용한다.

### 장식 요소 CSS 클래스 규칙 (P4)

배경 blob, 장식 SVG 등 반복되는 위치/크기 값은 인라인 스타일 대신 CSS 클래스로 정의한다:
```css
.deco-blob--tr { right: -2rem; top: -2rem; width: 38%; opacity: 0.45; }
.deco-blob--bl { left: -3rem; bottom: -1rem; width: 28%; opacity: 0.40; }
```

### 추가 규칙 (P5-P7)

- **browser-card max-width**: 기본 `1200px`. 스타일 스펙에서 명시적으로 지정한 경우만 다른 값 사용
- **마무리 슬라이드 제목**: `<h2 class="end-title">`을 사용한다. 페이지에 `<h1>`은 표지에만 1개
- **topbar-title**: 항상 `margin: 0 auto`로 중앙 정렬
- **아이콘 크기 통일**: activity-icon과 card-icon의 font-size는 동일 파일 내에서 같은 값(권장 `1.4rem`)을 사용

---

## 6단계: 생성 워크플로우

1. **설정 수집**: 1단계(또는 퀵스타트)에 따라 사용자 설정 확인
2. **슬라이드 구조 선택**: 2단계 템플릿에서 대상/목적에 맞는 구조 자동 선택
3. **스타일 스펙 로딩**: 스타일 선택 시 `references/styles.md`에서 해당 스타일만 읽기
4. **HTML 템플릿 로딩**: `references/html-template.md`를 읽고 코드 구조 확인
5. **추가 기능 로딩**: 활성화된 추가 기능이 있으면 `references/features.md` 읽기
6. **구조 설계 공유**: 슬라이드 순서와 컴포넌트 구성을 사용자에게 간략히 공유
7. **HTML 생성**: 단일 파일로 완전한 프레젠테이션 생성
8. **세로 높이 검증**: 5.5단계 기준으로 각 슬라이드가 800px 이내인지 코드상 확인하고 초과 시 조정
9. **폴더 생성 & 파일 저장**: 아래 디렉토리 규칙에 따라 저장
10. **pages.json 업데이트**: 아래 매니페스트 규칙에 따라 항목 추가
11. **확인 안내**: 브라우저에서 열어 확인하도록 안내

### 파일 저장 디렉토리 규칙

```
{작업 디렉토리}/
└── {과목명}/
    └── {내용(주제)}/
        ├── index.html          ← 프레젠테이션 본체
        └── (이미지, QR 등 에셋)
```

**예시:** `프로그래밍/오리엔테이션/index.html`, `정보/AI윤리-수업자료/index.html`

**규칙:**
- 과목명과 내용(주제)은 사용자에게 확인하거나, 제목에서 자동 추출
- 폴더명에 공백 대신 하이픈(`-`) 사용 가능, 한글 폴더명 허용
- HTML 파일명은 `index.html` 기본
- 에셋 파일은 같은 폴더에 저장

### pages.json 매니페스트 업데이트 규칙

프레젠테이션 생성 후, 작업 디렉토리 루트의 `pages.json`을 읽어서 새 항목을 추가합니다.

```json
{
  "title": "프레젠테이션 제목",
  "path": "과목/내용/index.html",
  "emoji": "대표 이모지",
  "description": "1~2문장 설명",
  "tags": [{ "label": "태그명", "color": "blue|green|purple|orange" }],
  "gradient": "linear-gradient(90deg, #색상1, #색상2)"
}
```

**규칙:**
- `pages.json`이 존재하면 해당 과목의 `pages` 배열에 새 항목 추가
- 해당 과목이 없으면 `subjects` 배열에 새 과목 객체 추가
- `pages.json`이 없으면 새로 생성
- gradient 색상은 선택한 컬러 테마에 맞춰 설정
- tags는 핵심 키워드 2~4개 추출

### 관리 대시보드 초기화

프레젠테이션 생성 후, 루트에 `pages.json`과 `index.html`(관리 대시보드)이 있는지 확인하세요.

없으면 사용자에게 안내:
> "수업 자료를 한눈에 볼 수 있는 **관리 대시보드**가 없습니다. 지금 생성할까요?"

동의 시 단일 HTML 파일로 생성:
- `pages.json` fetch → 과목별 카드 목록 렌더링
- 과목별 필터 탭 + 검색창 + gradient 카드 디자인
- 로컬 환경 안내: `python -m http.server 8080` 등 로컬 서버 필요

---

## 콘텐츠 생성 가이드라인

### 대상별 언어 수준

| 대상 | 어휘 수준 | 문장 스타일 | 주의사항 |
|------|----------|------------|---------|
| 초등학생 (1~3학년) | 쉬운 한글, 한자 없음 | 짧은 문장, 구어체, "~해요" | 이모지 적극 활용, 긴 설명 금지 |
| 초등학생 (4~6학년) | 기본 어휘, 쉬운 외래어 | 보통 길이 문장, "~합니다" | 예시 중심, 추상 개념 최소화 |
| 중학생 | 일반 어휘, 교과 용어 허용 | 간결한 문어체, "~입니다" | 핵심 용어에 설명 병기 |
| 고등학생 | 전문 어휘, 영문 약어 가능 | 논리적 문체, 데이터 포함 | 근거 제시, 비판적 사고 유도 |
| 학부모 | 정중한 일상 어휘 | 공손한 문체, "~드립니다" | 전문 용어 최소화, 실용 정보 우선 |
| 교사/교직원 | 교육 전문 용어 가능 | 간결한 업무 문체 | 법령·정책 용어 정확히 사용 |

### 슬라이드당 최적 텍스트량

| 대상 | 슬라이드당 최대 단어 수 | 글머리 기호 최대 수 | 권장 폰트 크기 |
|------|----------------------|------------------|--------------|
| 초등학생 | 30단어 | 3개 | 30px+ |
| 중·고등학생 | 50단어 | 5개 | 24px+ |
| 학부모 | 60단어 | 5개 | 22px+ |
| 교사/교직원 | 80단어 | 7개 | 20px+ |
| 일반 발표 | 60단어 | 5개 | 22px+ |

**황금 규칙:**
- 빔프로젝터에서 5초 안에 핵심 파악 가능해야 함
- 한 슬라이드에 하나의 핵심 메시지만
- 텍스트가 많으면 슬라이드를 분리하거나 `activity-list`/`card-grid` 컴포넌트로 시각화

### 기타 콘텐츠 원칙

- 한국어를 기본 언어로 사용
- 교육 현장에 적합한 정중하고 명확한 문체
- 이모지를 아이콘으로 적극 활용 (별도 이미지 불필요)
- 각 슬라이드의 텍스트량은 화면에 스크롤 없이 보일 정도로 조절
- 핵심 수치나 키워드는 `<strong>` 또는 뱃지로 강조
- 링크가 있으면 `target="_blank"`

---

## 핵심 디자인 원칙

- 선택된 스타일의 배경, 폰트, 레이아웃 스펙을 **엄격히** 준수
- 모든 슬라이드에 **최소 1개 시각 요소** (아이콘, 컬러 블록, 도형) 포함 — 텍스트만 있는 슬라이드 금지
- 스타일의 **시그니처 요소**를 모든 슬라이드에 일관되게 반복
- **정확한 HEX 값** 사용 — 근사치 색상은 미적 일관성을 깨뜨림
- **⚠️ 폰트 페어링 필수**: 스타일 스펙의 Font 섹션에 명시된 폰트 페어링을 반드시 적용한다. **단일 폰트 사용 금지** — 최소 2개 폰트 패밀리(제목용 + 본문용)를 사용해야 한다. 타이포그래피가 스타일 인상의 50%를 결정하므로, Noto Sans KR만 단독 사용하는 것은 허용되지 않는다. 한국어 지원이 필요하면 제목/라벨용 스펙 폰트 + 본문용 한국어 폰트 조합을 사용한다.

---

## 에러 처리 가이드

### 흔한 실패 패턴과 대응법

| 문제 | 증상 | 해결법 |
|------|------|--------|
| **콘텐츠 과부하** | 슬라이드가 스크롤 필요, 텍스트가 카드 밖으로 넘침 | 슬라이드 분리, `activity-list`/`card-grid`로 시각화, 텍스트 50% 축소 |
| **스타일 충돌** | 다크 배경에 어두운 텍스트, 배경과 카드 구분 안 됨 | 스타일-카드 호환 매핑 재확인, 텍스트 색상 대비 4.5:1 이상 확보 |
| **폰트 미로딩** | 시스템 기본 폰트로 표시, 자간/행간 무너짐 | Google Fonts CDN 링크 점검, `preconnect` 태그 확인 |
| **모바일 레이아웃 붕괴** | grid가 겹치거나 텍스트 잘림 | 768px 미만 grid → 1열, `clamp()` 폰트 적용 확인 |
| **네비게이션 미작동** | 키보드/스와이프 반응 없음 | JS 이벤트 리스너 중복 등록 확인, `currentSlide`/`totalSlides` 변수 확인 |
| **슬라이드 수 부족** | 내용이 너무 압축되어 이해 어려움 | 복잡한 슬라이드를 2~3장으로 분리, 섹션 divider 추가 |
| **슬라이드 수 과다** | 발표 시간 초과, 집중력 저하 | 유사 내용 통합, 세부 사항은 발표자 노트로 이동 |
| **QR 코드 미작동** | 빈 이미지 박스 표시 | placeholder 이미지 또는 실제 QR URL 사용 안내 |
| **인쇄 레이아웃 깨짐** | 슬라이드 짤림, 배경 미출력 | `@media print` CSS 확인, `page-break-after: always` 적용 |

### 사용자 입력 부족 시 대응

```
사용자가 주제만 제시하고 내용을 제공하지 않은 경우:
→ 대상 학년/직군에 맞는 내용을 AI가 자동 구성
→ 생성 후: "내용을 자동 구성했습니다. 수정할 부분이 있으면 말씀해 주세요."

사용자가 슬라이드 수를 지정하지 않은 경우:
→ 2단계 템플릿의 기본 슬라이드 수 사용

사용자가 스타일을 지정하지 않은 경우:
→ 대상/목적에 따라 추천 스타일 자동 선택, 생성 후 알림
```

---

## 레이아웃 & 네비게이션 세부 설정 (선택)

사용자가 "세부 설정" 또는 "직접 설정"을 원할 때만 제공합니다.

**레이아웃:**

| 설정 | 옵션 | 기본값 |
|------|------|--------|
| 콘텐츠 밀도 | `compact`, `normal`, `spacious` | `normal` |
| 최대 너비 | `1200px`, `1400px`, `1600px`, `full` | `1600px` |
| 이미지 스타일 | `emoji`, `placeholder`, `url`, `web-search`, `ai-generate` | `emoji` |

**네비게이션:**

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
| 웹 이미지 검색 | `on`, `off` | `off` |
| AI 이미지 생성 | `on`, `off` | `off` |

---

## 웹 이미지 검색 (Playwright 기반)

> 이 기능은 `이미지 스타일: web-search` 또는 `웹 이미지 검색: on` 설정 시 활성화됩니다.
> 상세 워크플로우는 `references/web-image-search.md`를 읽으세요.

### 개요

Playwright 브라우저 자동화를 사용하여 Google 이미지 검색에서 프레젠테이션에 적합한 이미지를 찾아 다운로드합니다. **API 키 불필요** — 브라우저를 직접 제어하여 검색합니다.

### 활성화 조건

- 사용자가 `이미지 스타일: web-search`를 선택한 경우
- 사용자가 "실제 이미지", "사진 넣어줘", "이미지 검색해서" 등을 요청한 경우
- `image-focus` 컴포넌트에 실제 이미지가 필요한 경우

### 핵심 워크플로우 (요약)

```
1. 슬라이드별 이미지 필요 여부 판단
2. 검색 키워드 생성 (슬라이드 내용 기반, 영어 키워드 권장)
3. Playwright로 Google Images 검색
4. 적합한 이미지 선택 (교육용, 저작권 무관, 고해상도 우선)
5. 이미지 다운로드 → 프레젠테이션 폴더에 저장
6. HTML에 <img> 태그로 삽입 (상대 경로)
```

### 이미지 사용 규칙

- **⚠️ 다운로드된 이미지 전량 사용 필수**: 시나리오에서 `needs_image: true`로 지정하고 다운로드한 이미지는 **반드시 모두** HTML에서 참조해야 합니다. 다운로드했지만 HTML에 삽입하지 않은 이미지가 있으면 안 됩니다. grid-cards, two-column 등 이미지를 삽입할 수 있는 컴포넌트에 적극 배치하세요.
- **슬라이드당 이미지 최대 1개** — 이미지가 많으면 로딩 느려짐
- **image-focus 컴포넌트에 우선 배치** — 독립된 이미지 영역이 있는 컴포넌트
- **cover/end 슬라이드**: 배경 이미지로 사용 가능 (opacity 0.15~0.3 오버레이)
- **card-grid 카드 내**: `card-img` 클래스로 이미지 삽입 (이모지 대신). `needs_image: true`인 카드 슬라이드에는 반드시 이미지 포함
- **파일명 규칙**: `img-{슬라이드번호}-{키워드}.{확장자}` (예: `img-04-shakespeare.jpg`)
- **fallback**: 이미지 검색/다운로드 실패 시 이모지 또는 placeholder로 대체
- **로딩 최적화**: `loading="lazy"` 속성 추가, width/height 명시
- **일관된 래퍼 구조**: 모든 프레젠테이션에서 `.image-container` + `.image-caption` 래퍼를 일관되게 사용 (cover 배경, card-img 제외)
- **최소 해상도**: 이미지 너비 최소 1280px 권장 (FHD 디스플레이 선명도 확보). 800px 이하 이미지는 흐릿하게 표시됨
- **커버 이미지**: 반드시 가로형(landscape, ratio > 1.5) 이미지 사용. 정사각형/세로형은 커버 배경에 부적합

### 이미지 검색이 필요한 슬라이드 판단 기준

| 컴포넌트 | 이미지 필요도 | 설명 |
|----------|-------------|------|
| `image-focus` | **필수** | 이미지 전용 컴포넌트 |
| `cover` | 선택 | 배경 이미지로 분위기 연출 (가로형 필수) |
| `two-column` | 선택 | 한쪽에 이미지 배치 가능 |
| `card-grid` | **needs_image 시 필수** | `needs_image: true`인 카드에는 반드시 `card-img` 삽입 |
| `showcase-grid` | 선택 | 제품/결과물 사진 시 유용 |
| 기타 | 불필요 | 텍스트 위주 컴포넌트 |

### HTML 생성 후 이미지 검증 체크리스트

```
✅ 다운로드된 모든 이미지가 HTML에서 <img> 또는 background-image로 참조되는가?
✅ 모든 <img> 태그에 onerror fallback이 있는가?
✅ 모든 <img> 태그에 referrerpolicy="no-referrer"가 있는가?
✅ 커버 이미지가 가로형(landscape)인가?
✅ 모든 이미지에 .image-container 래퍼가 일관되게 적용되었는가? (cover, card 제외)
✅ 세로형 이미지에 data-ratio="portrait" 속성이 적용되었는가?
```

---

## 팁과 주의사항

- `overflow: hidden`이 body에 설정되므로 슬라이드 내용이 넘치지 않게 조절
- `browser-content`에 `overflow-y: auto`가 있어 스크롤 가능하지만, 가능하면 한 화면에 맞추기
- 네비 바가 하단 고정이므로 `.browser-content`에 `padding-bottom: 3rem` 이상 확보
- QR 코드는 사용자 제공 또는 placeholder 이미지
- CSS 변수 활용으로 색상 변경 용이
- Google Fonts 외 CDN 사용 금지 (오프라인 환경 대비)
- 반응형: 768px 이하에서 grid → 1열, 480px 이하에서 축소 대응
