# 연동 지도 — 무엇을 만들고, URL을 어디에 넣는가

구글 연동은 셋 다 모양이 같다: **Apps Script 웹앱을 배포해 `/exec` URL을 얻고,
그 URL을 쓰는 쪽에 등록한다.** 다른 건 "쓰는 쪽이 어디냐" 뿐이다.

| 연동 | 보내는 쪽 | 받는 쪽 | URL을 넣는 곳 |
|---|---|---|---|
| 활동지 시트 | 활동지 HTML (학생 브라우저) | 과목 폴더 `apps-script.js` | HTML의 `DEFAULT_URL` 또는 ⚙ 패널 |
| 라이브 아카이브 | `live/runtime/archive.js` (교사 콘솔) | `docs/apps-script/live-archive.gs` | 교사 콘솔 ⚙ 설정 |
| 클래스룸 게시 | `scripts/classroom-post.mjs` (로컬) | `docs/apps-script/classroom/` | `.classroom.json` 의 `gasUrl` |

세 웹앱 모두 배포 설정은 **실행 계정 "나" · 액세스 "모든 사용자"** 다. 학생
브라우저와 로컬 스크립트가 구글 로그인 없이 익명으로 POST 하기 때문이다.

---

## 1. 활동지 시트 (activity-sheet-builder)

과목당 스프레드시트 1개 + Apps Script 1개. 그 과목의 활동지 전부가 이 하나를
공유하고, payload 의 `source` 필드로 어느 활동지인지 분기해 탭을 나눈다.

### 만들기 (A) 새 과목 — 스프레드시트까지 에이전트가 만든다

`--type sheets` 는 **새 스프레드시트를 만들면서** 거기 붙은 Apps Script 를 함께
생성한다. 사용자가 드라이브를 열 필요가 없다.

```bash
cd data/<그룹>/<과목>/
clasp create-script --type sheets --title "<과목명> 활동지"
```

만들어진 스프레드시트는 `clasp open-container` 로 연다. 생성 직후
`appsscript.json` 이 기본값으로 덮어써지므로(→ `references/clasp.md`) 매니페스트를
다시 쓰고 `.claspignore` 를 작성한 뒤 `clasp push`.

> ⚠ 새 시트는 **로그인 계정의 드라이브 최상위**에 생긴다. 사용자에게 어디로
> 옮길지·이름이 맞는지 확인받는다. 만들기 전에 한 번 묻는 게 좋다.

### 만들기 (B) 이미 시트가 있는 경우 — 연결만

1. **사용자가** 확장 프로그램 → Apps Script → ⚙ 프로젝트 설정 → **스크립트 ID** 복사
2. 에이전트가 과목 폴더에서 연결하고 코드를 올린다

```bash
cd data/<그룹>/<과목>/
clasp clone-script <스크립트ID>
# .claspignore 작성 (references/clasp.md 참고)
clasp push
```

### 공통 마무리

3. **사용자가** 편집기에서 배포 → 새 배포 → 웹 앱 (실행: 나 / 액세스: 모든 사용자)
   → 권한 승인 → `/exec` URL 복사
   (매니페스트에 `webapp` 블록을 넣었다면 `clasp create-deployment` 로 대신할 수
   있지만, **권한 승인은 여전히 사용자가** 편집기에서 한 번 해야 한다)
4. 그 URL을 활동지 HTML의 `DEFAULT_URL` 상수에 넣는다

### 활동지를 추가할 때

같은 스크립트에 핸들러만 늘린다 — **새 스프레드시트를 만들지 않는다.**

```bash
cd data/<그룹>/<과목>/
clasp push
clasp update-deployment <배포ID> -d "활동지 추가"
```

기존 배포를 갱신하므로 **URL이 바뀌지 않아** HTML 을 고칠 필요가 없다.

구현 세부(폼 패턴·시트 기록·이미지 업로드)는 `activity-sheet-builder` 스킬의
`references/sheets-integration.md`·`apps-script-template.md`.

---

## 2. 라이브 세션 아카이브 (live-quiz-builder / live-upgrade)

실시간 수업이 끝나면 교사 콘솔의 [시트에 저장]이 세션 요약·문항·응답을 시트 3탭에
쌓는다. 같은 세션코드로 다시 저장하면 덮어쓰므로 중복이 안 쌓인다.

배포용 코드 `docs/apps-script/live-archive.gs` 는 **자기완결**이다 — 파일 상단
주석에 설치 5단계가 그대로 들어 있으니 그걸 따르면 된다. 요약하면:

1. 결과용 스프레드시트 생성 → 확장 프로그램 → Apps Script
2. 파일 전체 붙여넣기 → 웹 앱 배포(실행: 나 / 액세스: 모든 사용자)
3. `/exec` URL 을 **교사 콘솔 ⚙ 설정 → "시트 아카이브 URL"** 에 저장

이미 쓰는 활동지 스크립트에 얹을 수도 있다 — `doPost()` 맨 위에서 `source` 로
분기시키는 3줄이 그 파일 주석에 있다.

콘솔의 시트 후보 목록은 `live/archives.json` 이고, 다음으로 재생성한다:

```bash
node scripts/scan-archives.mjs
```

---

## 3. 클래스룸 자동 게시

**설치 절차는 `docs/apps-script/classroom/README.md` 에 완결돼 있다.** 여기서
중복 설명하지 말고 그 문서를 따른다. 이 연동만의 특징:

- 다른 둘과 달리 **보내는 쪽이 로컬 CLI**(`scripts/classroom-post.mjs`)다.
  로컬에 구글 인증이 없고, 인증은 전부 Apps Script 쪽에서 끝난다.
- 익명 접근 웹앱이라 **공유 토큰 게이트**가 필수다. 토큰은 스크립트 속성에 두고
  코드에 적지 않는다(코드는 git 에 올라간다).
- 로컬 설정은 `.classroom.json`(gitignore). 예시는 `.classroom.example.json`.
- 링크 생성 규칙이 허브(`src/hub/Hub.tsx` 의 `legacyCard`)와 **동일해야 한다.**
  한쪽을 바꾸면 `classroom-post.mjs` 의 `pageUrl()` 도 같이 고친다.

---

## 공통 점검

```bash
node scripts/check-setup.mjs --net
```

웹앱이 살아 있는지는 브라우저로 `/exec` 를 그냥 열어보는 게 제일 빠르다 —
`{"status":"ok",…}` 가 보이면 정상이다.

| 증상 | 원인 |
|---|---|
| 403 | OAuth 승인 전 · 액세스가 "모든 사용자"가 아님 · 학교 정책 차단 |
| 로그인 화면 HTML 이 돌아옴 | 액세스가 `ANYONE`(구글 로그인 필요)로 잡혀 있음 |
| 고친 코드가 반영 안 됨 | `push` 만 하고 `update-deployment` 를 안 함 |
| `permissions are not sufficient` | 매니페스트 `oauthScopes` 에 빠진 스코프 |
| 시트에 값이 안 쌓임 | `source` 분기 이름 불일치 · 탭 헤더 이름 변경 |
