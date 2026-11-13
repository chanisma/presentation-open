---
name: workspace-setup
description: >
  이 저장소의 스킬들(활동지·라이브·클래스룸 게시 등)이 돌아가려면 필요한 구글 쪽 기본 환경을 갖추도록 안내하는 도우미 스킬. clasp 설치·로그인, Apps Script 프로젝트 생성·배포, 수업 스프레드시트 만들기, 활동지 시트 연동, 라이브 세션 아카이브, 클래스룸 자동 게시 연결을 순서대로 처리한다.
  사용자가 "환경 설정", "처음 설정", "세팅해줘", "clasp 설치", "clasp 로그인", "시트 연동 준비", "스프레드시트 만들어줘", "Apps Script 연결", "클래스룸 연동", "새 컴퓨터에서 시작", "왜 안 되지", "권한 오류" 등을 언급하거나, 다른 스킬을 쓰려다 연동이 안 돼 막혔을 때 사용한다.
---

# Workspace Setup — 기본 환경 구성 도우미

이 저장소의 스킬 대부분은 **구글 계정에 붙어 있는 무언가**(스프레드시트, Apps Script
웹앱, 클래스룸)를 필요로 한다. 이 스킬은 그 연결을 처음부터 끝까지 세워주는
안내자다. **문서를 처음부터 읽히지 말고, 먼저 진단해서 빠진 것만 처리한다.**

## 0단계: 진단 (항상 먼저)

```bash
node scripts/check-setup.mjs --net
```

`--net` 은 배포 사이트와 웹앱을 실제로 두드려본다(느리면 생략 가능). 출력의 `✗`
항목에 `→` 로 다음 명령이 붙어 나온다. **`✓` 인 것은 건드리지 않는다.**

```
 ✓ clasp 설치                      3.3.0
 ✗ clasp 로그인                    로그아웃 상태
     → clasp login  (교사 계정으로!)
```

진단이 전부 `✓` 면 이 스킬은 할 일이 없다 — 사용자가 하려던 원래 작업으로 돌아간다.

## 핵심 원칙 — 무엇을 내가 하고, 무엇을 사용자가 하는가

이 경계를 흐리면 사용자를 하염없이 기다리게 만든다. 반드시 명시적으로 나눈다.

| 에이전트가 직접 할 수 있음 | 사용자가 브라우저에서 해야 함 |
|---|---|
| `clasp create-script` · `push` · `deploy` | **구글 로그인**(`clasp login`) |
| 코드·매니페스트 작성, 스코프 지정 | **OAuth 권한 승인** (동의 화면 클릭) |
| 설정 파일 기록, 별칭 등록 | **Apps Script API 활성화** 토글 |
| 링크 200 확인, 드라이런 검증 | 배포 대화상자에서 액세스 권한 확인 |
| **스프레드시트 생성**(`--type sheets`) | 승인 후 **로그의 토큰·ID를 알려주기** |
| 진단·문제 원인 좁히기 | 만들어진 시트 위치·이름 확인 |

**OAuth 동의는 계정 소유자만 클릭할 수 있다.** 여기서 반드시 한 번 멈춘다. 멈출
때는 ① 정확한 URL ② 무엇을 클릭할지 ③ **무엇을 가지고 돌아와야 하는지** 세 가지를
한 번에 준다. 나눠서 물으면 왕복이 늘어난다.

사용자가 터미널에서 직접 실행해야 하는 명령(`clasp login` 같은 대화형)은
`! clasp login` 처럼 `!` 프리픽스로 안내한다 — 출력이 대화로 바로 들어온다.

## 트랙 — 하려는 일에 따라 필요한 것만

진단 결과와 사용자 목적을 맞춰 해당 트랙만 진행한다. 트랙끼리는 독립이다.
단 **A는 B·C·D의 전제**다.

### A. clasp (Apps Script 배포 도구) — 다른 모든 것의 전제

```bash
npm install -g @google/clasp
! clasp login          # 브라우저가 열린다 — 교사 계정으로 로그인
```

그리고 브라우저에서 **Apps Script API 켜기**:
<https://script.google.com/home/usersettings>

> ⚠ 여기서 로그인한 계정이 앞으로 **모든 것의 소유자**가 된다. 학교 Workspace
> 계정이어야 한다. 개인 gmail 로는 클래스룸 교사 API가 동작하지 않는다.

상세는 `references/clasp.md`.

### B. 활동지 → 스프레드시트 (activity-sheet-builder 용)

과목당 스프레드시트 1개 + Apps Script 1개. 학생 제출이 시트로 쌓인다.
절차와 URL을 어디에 넣는지는 `references/integrations.md`의 「활동지 시트」.

### C. 라이브 세션 아카이브 (live-quiz-builder / live-upgrade 용)

실시간 수업 결과를 시트에 남긴다. 배포용 코드는 `docs/apps-script/live-archive.gs`
하나로 자기완결이다. `references/integrations.md`의 「라이브 아카이브」.

### D. 클래스룸 자동 게시

수업 링크를 클래스룸에 올린다. **이미 완성된 설치 문서가 있으므로 그걸 따른다** —
`docs/apps-script/classroom/README.md`. 이 스킬에서 다시 설명하지 않는다.

## 알려진 함정 (실제로 밟은 것들)

- **`clasp` 명령은 실행한 폴더를 프로젝트로 삼는다.** `create-script` 를 저장소
  루트에서 돌리면 루트에 `.clasp.json`·`appsscript.json` 이 생기고, 그 상태에서
  `clasp push` 하면 **저장소 전체를 Apps Script 에 올리려 든다.** 반드시
  `cd <대상 폴더>` 를 먼저 확인하고, 루트에 이 두 파일이 보이면 잘못 만든 것이다.
- **`clasp create-script` 는 로컬 `appsscript.json` 을 기본 매니페스트로 덮어쓴다.**
  고급 서비스·스코프·webapp 설정을 미리 써놨다면 **생성 후 다시 써넣고** push 한다.
- **매니페스트에 `oauthScopes` 를 명시하면 자동 추론이 꺼진다.** 필요한 스코프를
  하나라도 빠뜨리면 런타임에 `Specified permissions are not sufficient` 로 터진다.
  `Session.getEffectiveUser()` 는 `userinfo.email` 이 별도로 필요하다.
- **`clasp push` 가 "Script is already up to date" 라고 해도 실제로는 올라간 경우가
  있다.** 의심되면 빈 폴더에 `clasp clone-script <ID>` 로 받아 원격 내용을 직접 본다.
- **웹앱 코드를 고쳐도 재배포 전까지 반영되지 않는다.** `clasp push` 후
  `clasp update-deployment <배포ID>` (URL은 유지된다).
- **웹앱 403** 은 원인이 둘이다 — ① OAuth 승인 전 ② 배포 액세스가 "모든 사용자"가
  아니거나 학교 Workspace가 외부 공개 웹앱을 차단. 둘을 구분해서 물어야 한다.
- **Windows 에서 `clasp`·`npm` 은 `.cmd` 셸 스크립트**라 `execFileSync` 로 직접
  호출하면 실패한다. 셸을 거쳐야 한다.
- **Windows curl 로 한글을 POST 하면 cp949 로 나간다.** UTF-8 파일로 저장해
  `--data-binary @file` 로 보내거나, Node `fetch` 를 쓴다.
- **비밀값을 `.env` 에 넣지 않는다** — 이 저장소의 `.env` 는 git 에 추적되고 공개
  원격에 올라간다. 토큰류는 gitignore 된 전용 파일에 둔다(`.classroom.json` 처럼).

## 마무리

트랙을 끝낼 때마다 진단을 다시 돌려 `✓` 로 바뀌었는지 확인한다.

```bash
node scripts/check-setup.mjs --net
```

새 연동을 추가했다면 `scripts/check-setup.mjs` 에 점검 항목도 같이 추가해서,
다음 사람이 진단 한 번으로 전체 상태를 보게 한다.
