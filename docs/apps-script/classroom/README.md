# 클래스룸 자동 게시

터미널(클로드코드)에서 명령 한 줄로 수업 자료 링크를 구글 클래스룸에 올린다.

```
로컬                          Apps Script 웹앱                구글 클래스룸
scripts/classroom-post.mjs ──POST(토큰)──▶ apps-script.js ──교사 권한──▶ 공지/자료/과제
   pages.json 에서 수업 찾기                (여기서만 구글 인증)
   허브와 동일한 규칙으로 URL 생성
```

로컬에는 구글 OAuth 설정이 **전혀 필요 없다**. 인증은 Apps Script 쪽에서 끝나고,
로컬은 공유 토큰으로만 자기를 증명한다.

## 설치 (한 번만, 약 10분)

### 1. 스크립트 생성·업로드

```bash
cd docs/apps-script/classroom
clasp create --type standalone --title "클래스룸 자동 게시"
clasp push
```

`clasp create` 가 만든 `.clasp.json` 은 gitignore 되어 있다.

### 2. 권한 승인 + 토큰 발급

```bash
clasp open-script
```

편집기에서 함수 목록 → **`setup`** 선택 → 실행. 권한 승인 창이 뜨면 승인한다
(클래스룸 접근 동의 1회). 실행 로그에 다음이 찍힌다.

```
실행 계정 : teacher@school.hs.kr
토큰      : 3f2a…            ← 복사
내 수업   : 4개
  812345678901  정보 1반
  …
```

> ⚠ 여기서 승인한 계정의 클래스룸에 글이 올라간다. **클래스룸 교사 권한이 있는
> 학교 계정**으로 로그인된 상태여야 한다. 개인 gmail 계정으로는 동작하지 않는다.

### 3. 웹앱 배포

편집기 우상단 **배포 → 새 배포 → 유형 [웹 앱]**

| 항목 | 값 |
|---|---|
| 설명 | 클래스룸 자동 게시 |
| 실행 계정 | **나** |
| 액세스 권한 | **모든 사용자** |

액세스 권한이 "모든 사용자"여야 로컬 스크립트가 익명으로 POST 할 수 있다.
그래서 토큰 게이트가 필수이고, 토큰 없는 요청은 전부 거절된다.

`/exec` 로 끝나는 URL을 복사한다.

### 4. 로컬 설정

프로젝트 루트의 `.classroom.json` (없으면 `.classroom.example.json` 복사)에
2·3단계에서 얻은 값을 채운다.

```json
{
  "gasUrl": "https://script.google.com/macros/s/…/exec",
  "token": "3f2a…",
  "origin": "https://내-사이트-주소",
  "courses": { "정보": "812345678901" },
  "defaultType": "announcement"
}
```

`.classroom.json` 은 gitignore 된다 — **커밋 금지**.

### 5. 확인

```bash
node scripts/classroom-post.mjs --ping      # 게시 계정 확인
node scripts/classroom-post.mjs --courses   # 반 목록 → courses 별칭에 등록
```

## 사용

```bash
# 공지로 올리기 (기본)
node scripts/classroom-post.mjs "바꾸는 세상" --to 정보

# 여러 반에, 자료로
node scripts/classroom-post.mjs "버블 정렬" --to 정보,인공지능기초 --type material

# 과제로 (마감·배점)
node scripts/classroom-post.mjs "탐험 일지" --to 정보 --type assignment \
  --due 2026-08-25T23:59 --points 20

# 수업 여러 개를 한 게시물에
node scripts/classroom-post.mjs "버블 정렬" "바꾸는 세상" --to 정보 --title "3주차 자료"

# pages.json 밖의 링크 (구글 폼 등)
node scripts/classroom-post.mjs --url https://forms.gle/xxx --title "사전 설문" --to 정보

# 올리기 전 확인
node scripts/classroom-post.mjs "정렬" --to 정보 --dry-run
```

전체 옵션은 `scripts/classroom-post.mjs` 상단 주석에 있다.

## 알아둘 것

- **URL 규칙은 허브(`src/hub/Hub.tsx`)와 같다.** `type:'doc'` 과 `index.html?…`
  는 원본 경로로, 레거시 HTML 덱은 `?legacy=` 뷰어 경유로 만든다. Hub 쪽 링크
  규칙을 바꾸면 `pageUrl()` 도 같이 고쳐야 학생이 빈 화면을 보지 않는다.
- **마감·예약 시각은 한국 시간으로 입력**한다(`--due 2026-08-25T23:59`).
  클래스룸 API가 UTC를 요구해서 Apps Script 쪽에서 변환한다.
- **API로 만든 게시물은 이 스크립트로만 수정·삭제할 수 있다.** 클래스룸 웹에서
  교사가 직접 지우는 건 되지만, 다른 도구로 고치는 건 막혀 있다(구글 정책).
- **한번 공개한 게시물은 비공개(초안)로 되돌릴 수 없다.** 클래스룸이 `state` 변경을
  `PUBLISHED` 방향으로만 허용한다(웹 화면에도 '초안으로 되돌리기'가 없다).
  비공개로 두고 싶으면 **처음 올릴 때 `--draft`** 를 쓰거나, 지우고 다시 올린다.
  `--publish <링크>` 로 초안을 공개하는 건 된다.
- **클래스룸에는 '공지 고정' API가 없다.** 스트림 상단 고정은 웹/앱에서 해당 글
  ⋮ → **맨 위로 이동** 으로만 가능하다.
- 학교 Workspace 관리자가 서드파티 앱 접근을 막아둔 경우 2단계 승인에서 막힌다.
- 코드를 고친 뒤에는 **`clasp push` 후 배포 관리 → 편집 → 버전: 새 버전 → 배포**
  를 해야 반영된다. URL은 유지된다.
- 토큰이 유출되면 편집기에서 `rotateToken()` 실행 후 `.classroom.json` 갱신.
