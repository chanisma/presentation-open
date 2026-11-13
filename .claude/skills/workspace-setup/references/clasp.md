# clasp 레퍼런스 (v3 기준)

clasp 는 Apps Script 프로젝트를 로컬 파일로 다루는 구글 공식 CLI다. 이 저장소는
Apps Script 코드를 저장소 안에 두고(`apps-script.js`) clasp 로 올리는 방식을 쓴다.

## 설치·로그인

```bash
npm install -g @google/clasp
clasp --version              # 3.x 확인
! clasp login                # 대화형 — 브라우저가 열린다
clasp show-authorized-user   # 어느 계정인지 확인
```

그리고 브라우저에서 한 번: <https://script.google.com/home/usersettings> →
**Google Apps Script API 켜기**. 이걸 안 켜면 `create-script`·`push` 가 거부된다.

> 로그인 계정 = 앞으로 만들어질 모든 스크립트·시트·클래스룸 게시물의 소유자.
> 학교 Workspace 계정으로 로그인했는지 `show-authorized-user` 로 확인하고 시작한다.

## v2 → v3 명령 이름

v3는 이름이 바뀌었지만 **옛 이름도 별칭으로 살아 있다.** 기존 문서가 v2 이름을
써도 그대로 동작한다.

| 하는 일 | v3 정식 | v2 별칭 (계속 동작) |
|---|---|---|
| 새 스크립트 만들기 | `create-script` | `create` |
| 기존 스크립트 연결 | `clone-script <ID>` | `clone` |
| 코드 올리기 | `push` | `push` |
| 새 배포 만들기 | `create-deployment` | `deploy` |
| 기존 배포 갱신 | `update-deployment <배포ID>` | `redeploy` |
| 배포 목록 | `list-deployments` | `deployments` |
| 편집기 열기 | `open-script` | — |

배포 갱신은 두 가지가 같은 일을 한다: `clasp deploy -i <배포ID>` 또는
`clasp update-deployment <배포ID>`. 어느 쪽이든 **URL은 유지**된다.

## 새 프로젝트 만들기

```bash
cd <프로젝트를 둘 폴더>
clasp create-script --type standalone --title "이름"
```

> 🚨 **이 명령은 폴더의 `appsscript.json` 을 기본 매니페스트로 덮어쓴다.**
> 고급 서비스·스코프·webapp 블록을 미리 써뒀다면 **생성 직후 다시 써넣고** push 한다.
> 순서를 바꿔서 "생성 → 매니페스트 작성 → push" 로 가는 게 안전하다.

`--type` 은 `standalone`(단독) 외에 `sheets`·`docs`·`forms` 등으로 컨테이너에 붙은
스크립트도 만들 수 있다. 활동지 백엔드는 보통 스프레드시트에 붙인 것을 `clone-script`
로 연결해 쓴다(스프레드시트를 먼저 사용자가 만들기 때문).

## 기존 스크립트에 연결

스프레드시트 → 확장 프로그램 → Apps Script → ⚙ 프로젝트 설정 → **스크립트 ID** 복사.

```bash
cd <과목 폴더>
clasp clone-script <스크립트ID>
```

`clone-script` 가 받아오는 `Code.js` 는 지워도 된다(`apps-script.js` 가 대신한다).
그리고 `.claspignore` 로 올릴 파일을 좁힌다 — 안 그러면 폴더의 HTML·이미지까지 전부
올라간다.

```
**
!apps-script.js
!appsscript.json
```

여러 스크립트 파일을 쓴다면 `!live-archive.js` 처럼 줄을 추가한다
(`data/2026-2/인공지능기초/.claspignore` 참고).

## 매니페스트 (`appsscript.json`)

```json
{
  "timeZone": "Asia/Seoul",
  "runtimeVersion": "V8",
  "exceptionLogging": "STACKDRIVER",
  "dependencies": {
    "enabledAdvancedServices": [
      { "userSymbol": "Classroom", "serviceId": "classroom", "version": "v1" }
    ]
  },
  "oauthScopes": ["…"],
  "webapp": { "executeAs": "USER_DEPLOYING", "access": "ANYONE_ANONYMOUS" }
}
```

- **`oauthScopes` 를 적는 순간 자동 추론이 꺼진다.** 코드가 쓰는 스코프를 전부
  직접 나열해야 한다. 빠뜨리면 런타임에
  `Specified permissions are not sufficient to call …` 로 터진다.
  자주 빠뜨리는 것: `userinfo.email`(`Session.getEffectiveUser`),
  `script.external_request`(`UrlFetchApp`), `spreadsheets`(`SpreadsheetApp`).
  **스코프를 늘리면 사용자가 권한 승인을 다시 해야 한다.**
- `webapp` 블록을 넣어두면 `clasp create-deployment` 만으로 웹앱이 배포된다
  (편집기에서 드롭다운을 고를 필요 없음).
  - `executeAs`: `USER_DEPLOYING`(배포자 권한으로 실행) / `USER_ACCESSING`
  - `access`: `ANYONE_ANONYMOUS`(로그인 없이) / `ANYONE`(구글 로그인 필요) /
    `DOMAIN`(같은 학교 계정만) / `MYSELF`
- 익명 접근 웹앱은 **반드시 토큰 같은 자체 게이트**를 둔다. URL만 알면 누구나
  호출할 수 있기 때문이다.

## 배포

```bash
clasp push                                        # 코드 업로드 (HEAD)
clasp create-deployment -d "설명"                 # 새 배포 (새 URL)
clasp update-deployment <배포ID> -d "설명"        # 기존 배포 갱신 (URL 유지)
clasp list-deployments                            # 배포 ID 확인
```

**코드를 고쳤으면 push 만으로는 웹앱에 반영되지 않는다.** 배포된 버전은 스냅샷이라
`update-deployment` 로 새 버전을 가리켜야 한다.

웹앱 URL 형식: `https://script.google.com/macros/s/<배포ID>/exec`

## 확인·디버깅

```bash
clasp show-file-status      # 무엇이 push 될지 (=status)
clasp open-script           # 편집기 열기
clasp tail-logs             # 실행 로그
```

**푸시가 됐는지 의심스러울 때** — `clasp push` 가 "Script is already up to date"
라고 해도 실제로는 올라갔을 수 있다. 확실히 보려면 빈 폴더에 받아서 직접 읽는다.

```bash
mkdir /tmp/check && cd /tmp/check
clasp clone-script <스크립트ID>
cat appsscript.json
```

## 권한 승인은 대신 해줄 수 없다

스코프가 붙은 함수는 **계정 소유자가 편집기에서 한 번 실행**해 동의 화면을 통과해야
한다. 에이전트가 대신 할 수 없는 유일한 단계다.

1. `clasp open-script` 로 편집기를 연다
2. 함수 목록에서 초기화 함수(`setup` 등) 선택 → 실행
3. 「확인되지 않은 앱」 경고 → **고급 → …(안전하지 않음)으로 이동** → 허용
4. 실행 로그에 찍힌 값(토큰·ID)을 가지고 돌아온다

3번 경고는 정상이다 — 구글에 심사 등록하지 않은 내부 스크립트라 항상 뜬다.
