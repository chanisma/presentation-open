---
name: notebooklm-lesson-deck
description: 기존 수업 자료(.odp/.pdf/.pptx/.hwpx) 또는 주제만 가지고 NotebookLM으로 슬라이드덱(기본 Whitetone — 그 외 Whiteboard/Etching/Critter)을 생성하고, data/2026-1/정보/<주제>/index.html 형태의 단일 파일 프레젠테이션 + pages.json 등록까지 끝내는 7단계 자동 파이프라인. 트리거: "/notebooklm 으로 수업 자료 만들어줘", "ODP 분석해서 슬라이드덱", "고등학생 ___ 수업 만들어줘", "Whiteboard 스타일 수업", "Etching 스타일 슬라이드", "data/2026-1/정보/___ 폴더에 수업 제작".
---

# NotebookLM Lesson Deck Builder

NotebookLM을 활용한 **고등학생 정보 교과 수업 슬라이드덱** 제작 자동화 스킬.
"조건문", "반복문", "함수" 같이 단원명만 받아도, 또는 기존 ODP/PDF가 있다면 그것을 분석하여 — 결국 `data/2026-1/정보/<주제>/index.html` + 추출 이미지 13장 + PDF/PPTX 백업 + `pages.json` 등록까지 한 번에 끝낸다.

## 활성화 조건

- 사용자가 `/notebooklm`을 명시
- 사용자가 `ODP`, `PDF`, `PPTX`, `HWPX` 파일 경로를 첨부하며 "수업 자료 만들어줘"
- 사용자가 단원명만 제시하며 "고등학생 [단원명] 수업 만들어줘"
- 사용자가 "Whiteboard 스타일" / "Etching 스타일" / "손그림 슬라이드" 언급
- 정보 과목 폴더(`E:\presentation\정보\`) 안에 새 수업을 만들겠다고 언급

## 사전 요구사항

| 항목 | 확인 명령 | 미설치 시 |
|------|-----------|----------|
| NotebookLM CLI | `python -m notebooklm --version` | `pip install notebooklm-py` |
| PyMuPDF | `python -c "import fitz; print(fitz.__version__)"` | `pip install PyMuPDF` |
| Pillow (Step 6.5용) | `python -c "import PIL"` | `pip install pillow` |
| NotebookLM 인증 | `python -m notebooklm status` | 사용자에게 `! python -m notebooklm login` 실행 요청 |
| 인코딩 환경변수 | — | 모든 PowerShell 호출 앞에 `$env:PYTHONIOENCODING="utf-8"` |

## 워크플로우 (Step 1~7)

> **계획 선행**: `data/<그룹>/<과목>/<수업>/plan.md`(lesson-deck-planner 산출물)가
> 있으면 Step 1~2의 분석·구조 설계를 건너뛰고 plan.md의 image 블록(핵심
> 메시지·핵심 내용·비주얼 가이드·발표자 노트)을 수업계획.md로 그대로 옮긴다.

### Step 1 — 입력 자료 분석

**ODP가 있을 때 (가장 흔함):**
```powershell
# ODP는 ZIP 포맷이므로 직접 압축 해제
$src = "<ODP 경로>"
$dest = "E:\presentation\정보\_odp_extract_<주제>"
Copy-Item $src "$dest\file.zip" -Force
Expand-Archive -Path "$dest\file.zip" -DestinationPath "$dest\unpacked" -Force
# content.xml에서 슬라이드별 텍스트 추출 (scripts/extract_odp.py 사용)
python "<skill>/scripts/extract_odp.py" "$dest\unpacked\content.xml"
```

**PDF가 있을 때:** `Read` 도구로 직접 읽거나 `opendataloader-pdf`로 마크다운 변환
**PPTX가 있을 때:** `/pptx` 스킬 활용
**HWPX가 있을 때:** `/hwpxskill` 스킬 활용
**주제만 있을 때:** Step 2로 바로 진입 (자료 분석 생략)

→ 입력 자료의 **페이지 수, 강점, 약점, 핵심 비유, 구조적 공백**을 파악

### Step 2 — Master Plan 작성

`references/master-prompt-pattern.md`를 읽고 계획서를 작성한다. 흐름·구성은 **사용자가 언급한 맥락이 최우선**이고, 공백은 교육학적 근거로 직접 판단해 설계한다 — 7단계 아크는 참고 예시일 뿐 기본값이 아니다 (상세 원칙은 해당 문서 최상단). 분량은 한 차시 기준 13페이지 안팎.

**저장 위치:** `E:\presentation\정보\_plan\<주제>_수업계획_v1.md`

각 슬라이드는 다음 4개 블록을 반드시 포함:
- **핵심 메시지 (Heading)** — 한 문장
- **핵심 내용 (Key Points)** — 3~4개 요점
- **비주얼 가이드 (Visual Concept)** — 도식·아이콘·말풍선·색상 묘사
- **발표자 노트 (Presenter Note)** — 교사가 실제로 학생에게 건넬 친근한 멘트

### Step 3 — Plan 개선

기존 자료의 강점은 살리고 약점은 보완한다. 아래는 점검 예시일 뿐 — 보강 여부는
사용자 맥락과 수업 성격으로 판단한다:
- 도입부 흥미 유발이 약하면 비유·일상 예시 추가
- 디버깅/자주 하는 실수 슬라이드 누락 시 별도 추가
- 실생활 적용 사례 누락 시 마무리 직전에 추가
- 너무 길면 (15장+) 핵심으로 압축
- 사용자에게 응용 예시 선택을 받을 수 있음 (선택사항)

### Step 4 — NotebookLM 노트북 + 자료 업로드

**자료 폴더 준비:**
```
E:\presentation\정보\<주제>\_notebooklm_sources\
├── 01_수업계획.md          (Step 2/3에서 작성)
├── 02_디자인_프롬프트.txt   (slide_prompt_<스타일>.txt 복사)
└── 03_스타일_참조.png       (slide_template_<스타일>.png 복사)
```

**노트북 생성 + 자료 업로드:**
```powershell
$env:PYTHONIOENCODING="utf-8"
# 노트북 생성
python -m notebooklm create "고등학생 파이썬 <주제> 수업 (<스타일>)" --json
# → JSON에서 .notebook.id 추출

# 3개 자료 순차 업로드 (각각 source_id 캡처)
python -m notebooklm source add "<path>\01_수업계획.md" --notebook $nb --json
python -m notebooklm source add "<path>\02_디자인_프롬프트.txt" --notebook $nb --json
python -m notebooklm source add "<path>\03_스타일_참조.png" --notebook $nb --json

# 3개 모두 READY 대기
foreach ($s in $sources) {
  python -m notebooklm source wait $s -n $nb --timeout 300
}
```

**슬라이드덱 생성 (생성 시작은 약 1초, 완료까지 5~15분):**
```powershell
$instruction = "수업계획.md에 명시된 N페이지 구조를 정확히 따라주세요. 각 슬라이드는 master plan의 핵심 메시지·핵심 내용·비주얼 가이드를 그대로 반영하고, 디자인_프롬프트.txt와 스타일_참조.png에 묘사된 <스타일별 묘사>로 모든 슬라이드를 디자인해 주세요. ... 슬라이드 순서: ①... ②... ③..."
python -m notebooklm generate slide-deck $instruction --format detailed --language ko --notebook $nb --json
# → task_id 캡처
```

**완료 대기는 반드시 백그라운드로:**
```powershell
# run_in_background: true 로 호출
python -m notebooklm artifact wait $task_id -n $nb --timeout 1800
```

→ 알림이 오면 다음 단계 자동 진행

### Step 5 — PDF/PPTX 다운로드

```powershell
$env:PYTHONIOENCODING="utf-8"
python -m notebooklm download slide-deck "E:\presentation\정보\<주제>\<주제>_slides.pdf" -a $art -n $nb
python -m notebooklm download slide-deck "E:\presentation\정보\<주제>\<주제>_slides.pptx" -a $art -n $nb --format pptx
```

### Step 6 — PNG 추출

`scripts/render_slides.py` 를 `data/2026-1/정보/<주제>/_render_slides.py`로 복사하고 BASE/PDF 경로만 수정 후 실행.

```powershell
python "E:\presentation\정보\<주제>\_render_slides.py"
# → images/slide-01.png ~ slide-NN.png (DPI 200, 3823x2134)
```

검증: 추출된 이미지 중 2~3장(표지·중간·마지막)을 `Read` 도구로 시각 검증하여 NotebookLM이 마스터 플랜의 비주얼 가이드를 반영했는지 확인.

### Step 6.5 — 이미지 초해상도 업스케일 (선택 · scripts/upscale_slides.py)

**왜:** NotebookLM PDF의 내장 래스터는 **1376×768**뿐이다. Step 6의 DPI 200 추출(3823×2134)은
보간 확대라 텍스트 획이 뭉개진다. Real-ESRGAN 초해상도를 거치면 획 가장자리가 실질적으로
선명해진다 (2026-07 조건문·오픈세션 덱에서 크롭 비교로 검증).

한 명령으로 끝난다 — PDF 네이티브 재추출(1376×768, `images_native/` 보존) → Real-ESRGAN
x4plus 4배 → LANCZOS ½ 다운스케일 **2752×1536** → `images/` 같은 파일명 교체(HTML 무수정):

```powershell
python "<skill>/scripts/upscale_slides.py" "data/<그룹>/<과목>/<주제>"   # *_slides.pdf 자동 탐지
# 옵션: --pdf <경로> · --out <폴더> · --width 2752 · --check (도구·PDF 확인만)
```

- **이식성:** 업스케일러(realesrgan-ncnn-vulkan 포터블)는 최초 1회 OS에 맞춰 공식 GitHub
  릴리스에서 `~/.cache/realesrgan-ncnn-vulkan/`으로 **자동 다운로드**된다
  (Windows/macOS/Linux). 캐시 위치는 `REALESRGAN_HOME` 환경변수로 재정의. 하드코딩 경로 없음.
- **요구:** Vulkan 지원 GPU(대부분의 내장 GPU 포함) + Pillow. GPU 기준 3~7초/장,
  14장 덱 전체 약 1분. Vulkan이 없는 PC에서는 이 단계를 건너뛴다(보간본 유지).
- 파일 크기가 보간본보다 커지므로(스타일에 따라 1.5~10배) 20장 이상 대형 덱은 적용 후 총량 확인.
- 결정론: 같은 입력·같은 GPU면 산출물이 바이트 단위로 동일 — 재실행 안전.

**검증 (BLOCKING):** 업스케일 전/후를 같은 상대좌표로 크롭해 나란히 붙인 비교 이미지를 만들어
`Read`로 확인 — ① 텍스트 획이 실제로 선명해졌는지 ② 글자·도형 왜곡(SR 환각)이 없는지.
왜곡이 보이면 해당 장만 보간본으로 되돌린다.

### Step 7 — HTML 생성 + pages.json 등록

`references/html-template.md`의 **Deck Contract 기반 미니멀 골격**을 사용한다 — 콘텐츠(.slide 이미지)만 갖고, 자체 헤더/푸터/네비 크롬(ribbon·corner-note·index 패널·nav 버튼·진행바)은 만들지 않는다. 허브가 레거시 뷰어(`?legacy=`)로 열어 페이지 넘김·그리드·프레젠터 크롬을 전부 제공하고, 단독 열람 시엔 `live/runtime/deck.js`가 최소 네비를 붙인다(뷰어 iframe에서는 `?chrome=0`으로 자동 억제).

**index.html 의 변경 포인트:**
- `<title>` — `<주제> — 고등학생 파이썬 입문`
- `<body data-deck-title="<주제>" data-subject="<과목>">`
- `const TOTAL = N` — 실제 PNG 페이지 수
- `:root`의 `--paper`·`--dk-accent` — 스타일별 값 (`references/style-<스타일>.md`)
- deck.js 스크립트 상대경로 — 폴더 깊이에 맞춤

**pages.json 업데이트 (`scripts/update_pages_json.py` 사용):**
정보 과목 `pages` 배열 끝에 새 항목 추가. gradient는 스타일별 고유 색:
- Whiteboard 조건문: blue→red `#1E5BD0, #D6263A`
- Whiteboard 반복문: blue→green `#1E5BD0, #1B9E4B`
- Whiteboard 신규: blue→purple `#1E5BD0, #7C3AED` 등 시리즈마다 다르게
- Etching 시리즈: dark grey `#1F1F1F, #5C5853` (기존)

## 스타일 선택 가이드

| 스타일 | 자산 위치 | 톤 | 적합 단원 |
|--------|----------|-----|----------|
| **Whitetone** (기본) | `data/2026-1/정보/slide_prompt_whitetone.txt`, `data/2026-1/정보/slide_template_whitetone.png` | 오프화이트 + 얇은 균일 벡터선, 틸·코랄·머스터드·네이비 4색 절제, 캐릭터 없음 — 깔끔한 인포그래픽 | 스타일 언급이 없는 모든 수업 (과목·단원 중립) |
| **Whiteboard** | `data/2026-1/정보/slide_prompt_whiteboard.txt`, `data/2026-1/정보/slide_template_whiteboard.png` | 화이트보드 + 4색 마커, 손그림 흐름도, 경고 표지판 | 조건문, 반복문, 함수, 알고리즘 — 흐름·결정·분기가 많은 단원 |
| **Etching** | `data/2026-1/정보/slide_prompt_etching.txt`, `data/2026-1/정보/slide_template_etching.png` | 크림색 종이 + 검정 잉크선, 한 톤의 회색 워시, 우아한 시리프 | 변수와 함수, 입력함수, 자료형, 추상 개념·역사·이론 단원 |
| **Critter** | `data/2026-1/스팀/slide_prompt_critter.txt`, `data/2026-1/스팀/slide_template_critter.png` | 오프화이트 + 얇은 SVG 벡터선, 틸·코랄·머스터드 3색, 아기자기한 플랫 동물 캐릭터가 여백에만 절제되게 등장 | 융합 수업, 네트워크·관계·데이터, 소외/포용처럼 정서적 결이 있는 주제, 저학년 |

→ **기본값은 Whitetone(깔끔한 화이트톤).** 사용자가 스타일을 언급하지 않으면 Whitetone으로 진행하되, 단원 성격상 다른 스타일이 명확히 유리하면(흐름·분기 → Whiteboard, 추상·이론 → Etching, 정서·저학년 → Critter) 그 스타일을 제안하고 1회 확인한다.

Critter는 동물 캐릭터 남용이 최대 리스크다. 프롬프트·instruction에 **"슬라이드당 최대 2마리, 높이 15% 이하, 여백에만"** 을 수치로 명시해야 한다. 자세한 규칙은 `references/style-critter.md`.

## 산출물 폴더 구조

각 수업 폴더에는 다음을 모두 남긴다 (재현 가능성 + 디버깅):

```
data/2026-1/정보/<주제>/
├── index.html                       ← 본체 프레젠테이션
├── images/slide-01.png ~ slide-NN.png   ← 최종 이미지 (Step 6.5 적용 시 2752x1536 SR본)
├── images_native/                   ← (6.5 적용 시) 1376x768 네이티브 추출 — SR 입력 보존
├── <주제>_slides.pdf                ← NotebookLM 원본
├── <주제>_slides.pptx               ← 편집 가능 백업
├── _render_slides.py                ← PNG 재추출용
├── _notebooklm_sources/             ← 업로드 자료 묶음
│   ├── 01_수업계획.md
│   ├── 02_디자인_프롬프트.txt
│   └── 03_스타일_참조.png
└── _notebooklm_output/
    ├── notebook_id.txt
    └── artifact_id.txt
```

## 흔한 문제와 대응

| 문제 | 원인 | 해결 |
|------|------|------|
| `Authentication expired` | NotebookLM 세션 만료 | 사용자에게 `! $env:PYTHONIOENCODING="utf-8"; python -m notebooklm login` 안내 |
| `UnicodeEncodeError 'cp949'` | Windows cp949 | 명령 앞에 `$env:PYTHONIOENCODING="utf-8"` 필수 |
| 슬라이드 페이지 수가 의도와 다름 | instruction이 모호 | instruction에 페이지 순서 ①②③④... 명시 |
| PDF는 잘 받아졌는데 PNG 추출 실패 | 한글 경로 인코딩 | `Out-File ... -Encoding utf8 -NoNewline` 사용 |
| Step 6.5에서 Real-ESRGAN 실행 실패 | Vulkan 미지원 GPU 또는 드라이버 문제 | 해당 PC에서는 6.5를 생략(보간본 유지)하거나 Vulkan 가능한 PC에서 실행 |
| Chrome MCP가 localhost 거부 | IPv6 only 또는 확장 정책 | 정적 검증만 하고 사용자에게 직접 확인 안내 (CLAUDE.md 가이드라인) |
| `download` 했는데 파일 내용이 그대로 | CLI는 **기존 파일을 덮어쓰지 않고** `이름 (2).pdf`로 따로 저장한다 | 받기 전에 `rm -f` 로 대상 파일을 지운다. 받은 뒤 `md5sum`으로 원본과 다른지 확인 |
| `revise-slide` 후에도 슬라이드가 안 바뀜 | revise는 in-place 수정이 아니라 **새 artifact를 복제 생성**한다 (`제목 (2)`, `(3)` …) | 여러 장을 고칠 땐 직전 결과의 artifact ID를 `-a`로 넘겨 **순차 누적**한다. 원본 ID로 병렬 호출하면 수정이 합쳐지지 않는다 |
| 표 안의 숫자가 다른 슬라이드 값과 뒤섞임 | 문서 내 비슷한 숫자열끼리 오염됨 | revise 지시에 행·열 좌표를 콕 집어 "N행 M번째 값은 반드시 X"라고 쓴다. 수정 후 원본 PDF와 **페이지별 픽셀 해시 비교**로 의도한 장만 바뀌었는지 확인 |
| 26장 요청했는데 21장만 생성됨 | NotebookLM은 긴 덱을 **~21장 안팎에서 잘라낸다**. 후반부(프로젝트·마무리)가 통째로 누락 | 앞부분(잘 나온 21장)은 그대로 두고, **누락분만 별도 슬라이드덱으로 생성**("표지·도입 없이 이 5개 내용 슬라이드만")한 뒤 `fitz.insert_pdf`로 병합. PPTX는 최종 26장 PNG로 `python-pptx` 재조립(슬라이드 복사가 불안정하므로 이미지 조립이 안전) |
| PDF는 텍스트 추출이 안 됨(빈 문자열) | NotebookLM PDF는 슬라이드를 **이미지로 렌더**해 텍스트 레이어가 없다 | 텍스트 매핑 대신 **컨택트 시트(PIL로 썸네일 그리드)**를 만들어 Read로 한 번에 전체 구성 파악. 숫자·코드 슬라이드만 full-res로 재확인 |

### 수정 후 회귀 검증 (권장)

```python
import fitz, hashlib
old, new = fitz.open("backup.pdf"), fitz.open("final.pdf")
mat = fitz.Matrix(1,1)
changed = [i+1 for i in range(len(old))
           if hashlib.md5(old[i].get_pixmap(matrix=mat, alpha=False).samples).hexdigest()
           != hashlib.md5(new[i].get_pixmap(matrix=mat, alpha=False).samples).hexdigest()]
print("변경된 슬라이드:", changed)   # 의도한 장만 나와야 한다
```

## Progressive Disclosure 가이드

- **항상 읽기:** SKILL.md (이 파일)
- **Master Plan 작성 직전:** `references/master-prompt-pattern.md`
- **스타일 선택 후 HTML 생성 직전:** `references/style-<선택>.md`
- **HTML 코드 작성 직전:** `references/html-template.md`
- **scripts/*.py:** 필요한 시점에 실행 (Read는 선택)

## 검증된 결과물 (참조 사례)

- `data/2026-1/정보/조건문/` — 13페이지 Whiteboard, blue→red 그라데이션
- `data/2026-1/정보/반복문/` — 13페이지 Whiteboard, blue→green 그라데이션
- `data/2026-1/정보/변수와 함수/`, `data/2026-1/정보/입력함수/`, `data/2026-1/정보/자료형과연산자/` — 21~24페이지 Etching, grey 그라데이션
- `data/2026-1/스팀/수학정보/` — 17페이지 Critter, teal→mustard 그라데이션 (수학×정보 융합, 인접행렬·A²)
- `data/2026-1/스팀/정보네트워크/` — 26페이지 Critter, teal→coral 그라데이션 (정보 편, NumPy·NetworkX·중심성 3종·프로젝트). **21장 생성 후 프로젝트 5장 별도 생성·병합**한 사례

→ 이미 이 패턴으로 7개 수업이 성공적으로 만들어진 검증된 워크플로우.

## 수식·숫자가 있는 수업의 필수 절차

행렬·계산 결과가 슬라이드에 인쇄되는 수업은, **Master Plan을 쓰기 전에 파이썬으로 값을 검증**한다.
NotebookLM은 표 안 숫자를 그럴듯하게 지어내므로, 계획서에 틀린 값이 들어가면 그대로 렌더링된다.

1. 예제 데이터를 코드로 만들고 결과를 `assert`로 확인 (대칭성, 대각선 = 차수 등)
2. 검증된 값만 계획서에 옮겨 적는다
3. instruction에 "숫자를 한 글자도 바꾸지 말라"를 명시
4. Step 6의 PNG 시각 검증에서 **숫자가 맞는 슬라이드를 우선 확인**한다

## 마무리 — 프롬프트 기록 (모든 덱·활동지 작업 공통)

작업을 끝내기 직전, 사용자가 이 자료를 위해 입력한 프롬프트를 자료 폴더의 `prompts.md`에
**전문 그대로** 덧붙인다. 형식과 제외 규칙은 `.claude/rules/prompt-log.md`. 최초 요청이면
머리글에 이 스킬 이름을 적는다 (`· /<스킬명>`). 첨부 이미지는 세션 id와 순번만.
