# 에이전트 터미널 — 기능 조사 (코드 기준)

> 조사일 2026-10-16 · 대상 저장소 `D:\NEIS_helper` (main, 기능 도입 커밋 `69668da` 2026-10-13 21:38 「에이전트 터미널 — 보던 창의 폴더에서 Claude Code·Codex 열기 (교사판·학생판), 학생판 1.0.2」)
> 현재 판 번호: 교사판(데스크) `DESK_VERSION = '1.3.10'`, 학생판 `STUDENT_VERSION = '1.0.5'` (`app/core/edition.py:23,26`)
> 코드는 읽기만 했다. 인용은 원문 그대로이며 `파일:행` 을 붙였다. 경로는 모두 `D:\NEIS_helper\` 기준.

---

## 0. 결론 요약 — 설치·로그인 자동화

| 항목 | 실제 동작 |
|---|---|
| **자동 설치** | **완전 자동(조용한 설치)은 없다.** 에이전트가 없으면 패널에 경고 줄과 **`설치하기` 단추**가 나오고, 교사가 그 단추를 누르면 **설치 명령이 미리 적힌 PowerShell 창**이 새로 뜬다. 즉 «한 번 누르면 설치 창이 알아서 설치를 진행하는» 반자동이다. 프로그램 시작 때나 독 아이콘을 누를 때 저절로 설치하지는 않는다. |
| Claude Code 설치 명령 | Anthropic 공식 스크립트 `Invoke-RestMethod 'https://claude.ai/install.ps1' \| Invoke-Expression` (= `irm … \| iex`). 관리자 권한 없이 **현재 사용자**에게 설치. (`app/core/agent.py:24,85-86`) |
| Codex 설치 명령 | winget 이 있으면 `winget install --id OpenAI.Codex -e --accept-source-agreements --accept-package-agreements`, 없고 npm 이 있으면 `npm install -g @openai/codex`, 둘 다 없으면 실패 안내. (`app/core/agent.py:93-101`) |
| Node.js·Git 설치 | **하지 않는다.** Git 이 없으면 Claude Code 설치 창 끝에 `winget install --id Git.Git -e` 로 직접 설치하라는 **노란 안내만** 낸다(`agent.py:87-90`). Node.js 는 Codex 의 2순위 경로(npm)에서 «있으면 쓴다»일 뿐 깔지 않는다. |
| 설치 뒤 인식 | 패널이 설치 진행 중이면 **3초마다** 다시 확인(최대 15분, 패널이 열려 있을 때만). 새 PATH 를 레지스트리에서 읽고 `~\.local\bin`·`%APPDATA%\npm`·`%LOCALAPPDATA%\Microsoft\WinGet\Links` 를 함께 뒤지므로 **프로그램을 다시 켜지 않아도** 찾는다. |
| **로그인(Claude 계정·ChatGPT 계정)** | **코드에 로그인 자동화·안내가 전혀 없다.** `agent.py` 에 `로그인`·`login`·`계정` 이 한 번도 나오지 않는다. 설치 창의 마지막 문구도 «설치를 마쳤습니다. 독의 에이전트 터미널에서 바로 쓸 수 있습니다.» 뿐이다. 로그인은 터미널에서 `claude`·`codex` 를 처음 실행할 때 **각 도구가 스스로 띄우는 로그인 절차**에 맡겨져 있다(이 부분은 NEIS_helper 코드 밖의 동작이라 이 조사로 확인되지 않는다). |
| 사용 안내(`사용 방법` 안내 화면) | 데스크의 React 안내(`app/guide-src/main.tsx`, 10단계)에는 **에이전트 터미널 항목이 없다.** 문서상 설명은 `app/README.md` 127~136행이 전부다. |

---

## 1. 독의 «에이전트 터미널» 단추

### 1-1. 정의·위치·모양

- 정의 (`app/web/dock-items.js:31-33`)
  ```js
  // 에이전트 터미널 (2026-10-13 요청, 교사·학생 모두) — 누르면 지금 보던 창의 폴더가 하나일 때 곧바로
  // Claude Code·Codex 를 열고, 여럿이거나 없으면 패널에서 고른다. 오른쪽 클릭은 언제나 패널 (dock.js agentClick).
  const AGENT = {id: 'agent', label: '에이전트 터미널', action: 'agent', key: 'agent', glyph: 'terminal', tone: 'terminal'};
  ```
- 문구(마우스를 올렸을 때 말풍선·aria-label): **`에이전트 터미널`**
- 아이콘: `terminal` 그림 — 둥근 사각형 창 안에 `>` 프롬프트와 밑줄 (`dock-items.js:23`
  `'<rect x="2.5" y="4" width="19" height="16" rx="3"/><path d="m6.5 9.5 3 2.5-3 2.5M12 15h5"/>'`)
- 색: `.tone-terminal{--a:#3a3a40;--b:#0b0b0e;color:#f5a065}` — 거의 검은 타일에 주황 선 (`app/web/dock-tones.css:24`)
- 위치
  - 교사판: `도구` 무리의 **맨 끝** — 쪽지함 · 스티커 메모 · 캡처 · 캡처 보관함 · 클립보드 · 교실 세팅 · **에이전트 터미널** 다음 구분선 뒤에 `데스크` 무리(데스크·연결 및 설정) (`dock-items.js:49-58`)
  - 학생판: `도구` 무리의 맨 끝 — 캡처 · 캡처 보관함 · 클립보드 · **에이전트 터미널** 다음 구분선 뒤에 `설정` (`dock-items.js:82-86`)
- 숨기기: 교사판은 데스크 `연결 및 설정` → `독 아이콘`, 학생판은 독의 `설정` 패널의 독 아이콘 칩에서 켜고 끈다(`app/README.md:110`, `app/web/popover.js:504-520`). 숨긴 목록은 `desktop-preferences.json` 의 `dock_hidden`.

### 1-2. 왼쪽 클릭 — `agentClick` (`app/web/dock.js:230-248`)

```js
async function agentClick(button, item) {
  if (popKey === item.key) {closePop(); return;}
  button.classList.add('launching');
  ...
    const result = await api('agent_quick');
    if (result.launched) {say(button, `${result.message} (오른쪽 클릭: 폴더 고르기)`, {hold: 3400}); return;}
  } catch (error) {
    say(button, error.message, {error: true, hold: 4200});
  ...
  togglePop(button, item);
}
```

- 누르는 동안 아이콘이 통통 튄다(`.item.launching .tile{animation:bounce …}`, `app/web/dock.css:115`; 애니메이션 끈 PC 는 반투명).
- 패널이 이미 열려 있으면 → 패널을 닫는다.
- 데스크 쪽 판단 `_agent_quick` (`app/desktop.py:456-463`):
  ```python
  """독 아이콘을 눌렀다 — 지금 보던 창의 폴더가 **하나**면 곧바로 연다. 아니면 패널에서 고른다."""
  ...
  if len(folders) != 1 or not agent.find(tool):
      return {'launched': False}
  return {'launched': True, 'message': self._agent_launch(folders[0])}
  ```

| 상황 | 일어나는 일 |
|---|---|
| 보던 창의 폴더가 **하나** + 고른 에이전트가 설치됨 | 곧바로 새 터미널을 연다. 아이콘 옆 말풍선(3.4초): **`<폴더 이름> 에서 Claude Code 를 열었습니다. (오른쪽 클릭: 폴더 고르기)`** — 권한 묻지 않기가 켜져 있으면 `Claude Code (권한 묻지 않기) 를 열었습니다.` (`agent.py:150-151`) |
| 폴더가 **여럿** (탐색기 탭 여러 개, VS Code 가 연 폴더를 제목으로 못 맞춘 경우 등) | 패널을 연다. 섹션 제목이 `지금 보던 창의 폴더 — 하나를 고르세요` 로 바뀐다. |
| 폴더가 **없음** (폴더를 못 찾았거나, 독을 누르기 전 본 창이 없음) | 패널을 연다. |
| 고른 에이전트가 **설치되어 있지 않음** | (폴더 수와 관계없이) 패널을 연다 → 빨간 경고 줄과 `설치하기` 단추. |
| 실행 중 오류 (예: 폴더가 그새 사라짐) | 아이콘 옆 빨간 말풍선 4.2초, 메시지는 6장 참고. |

### 1-3. 오른쪽 클릭 (`app/web/dock.js:605-611`)

```js
// 에이전트 아이콘의 오른쪽 클릭은 폴더 고르기 패널
...
if (popKey !== item.key) togglePop(agent, item);
```
- **언제나 패널**을 연다(이미 열려 있으면 그대로). 독의 일반 오른쪽 클릭 메뉴(`데스크 열기`·`세로로 놓기`·`독 숨기기`)는 이 아이콘에서는 뜨지 않는다.

---

## 2. 패널 (독 위로 펼치는 카드, `app/web/popover.js:601-686`)

### 2-1. 머리

- 제목: **`에이전트 터미널`**, 아이콘 `terminal`, 색 `terminal` (`popover.js:30`)
- 부제(한 줄, `popover.js:614`):
  - 찾은 창이 있으면 `지금 보던 창 · <프로그램 이름> — <창 제목>` (예: `지금 보던 창 · 파일 탐색기 — NEIS_helper - 파일 탐색기`). 제목이 프로그램 이름과 같으면 `— 제목` 은 생략.
  - 없으면 **`지금 보던 창을 알 수 없습니다`**
  - 프로그램 이름: 탐색기는 `파일 탐색기`, 바탕 화면은 `바탕 화면`, 나머지는 실행 파일 이름(확장자 뺀 것, 예 `Code`, `Hwp`) (`active_folder.py:410-416`)
- 오른쪽 위 단추: `새로고침`(↻, 패널을 다시 그림), `닫기 (Esc)`(✕) (`app/web/popover.html:25-26`). 바닥의 `…에서 크게 보기 →` 링크는 이 패널에선 숨긴다(`popover.js:79`).

### 2-2. 본문 — 위에서 아래로 (`popover.js:626-647`)

**① 에이전트·설정 섹션**

1. **에이전트 고르기** — 두 칸짜리 토글(세그먼트) `Claude Code` | `Codex`. 설치 안 된 쪽에는 작은 글씨 **`설치 필요`** 가 붙는다(`popover.js:626-627`). 누르면 바로 설정에 저장된다(`agent_settings`, `desktop-preferences.json` 의 `agent_tool`). **기본값은 Claude Code** (`desktop.py:408`).
2. **설치 경고 줄** (고른 에이전트가 없을 때만, 빨간 바탕 `.agent-row.warn`, `popover.js:628-632`)
   - 굵은 글씨: **`Claude Code 가 설치되어 있지 않습니다`** / **`Codex 가 설치되어 있지 않습니다`**
   - 작은 글씨:
     - Claude Code: **`Anthropic 공식 설치 스크립트로 이 사용자에게 설치합니다 (관리자 권한 없이).`**
     - Codex: **`winget 으로 설치합니다 (없으면 npm).`**
     - 설치 창을 띄운 뒤에는 뒤에 **` 설치 창에서 진행 중… 끝나면 여기가 바뀝니다.`** 가 붙는다.
   - 단추: **`설치하기`** → 설치 창을 띄운 뒤에는 **`다시 열기`**
   - 단추를 누르면 토스트: **`Claude Code 설치 창을 열었습니다. 끝나면 여기서 바로 쓸 수 있습니다.`** (`agent.py:164`)
3. **권한 묻지 않기** 줄 + 스위치 (`popover.js:633-635`)
   - 굵은 글씨: **`권한 묻지 않기`**
   - 작은 글씨: `` `--dangerously-skip-permissions` — 묻지 않고 파일을 고치고 명령을 실행합니다. 믿는 폴더에서만 켜세요. `` (Codex 를 고르면 코드 부분이 `--dangerously-bypass-approvals-and-sandbox`)
   - 켜져 있으면 이 작은 글씨 전체가 **빨간 굵은 글씨**로 바뀐다(`.skip-on{color:var(--danger)!important;font-weight:600}`, `app/web/popover.css:276`).
   - 스위치를 바꾸면 토스트: **`Claude Code · 권한 묻지 않기 켬`** / **`Claude Code · 권한을 물어 가며 실행`** (`desktop.py:484`)
   - **기본값은 꺼짐** — 설정에 `true` 로 저장된 경우만 켜진다(`desktop.py:408` `preferences.get('agent_skip') is True`). 도구와 무관하게 한 값이다(Claude Code 에서 켜면 Codex 로 바꿔도 켜져 있음).

**② `지금 보던 창의 폴더`** (폴더가 둘 이상이면 제목 뒤 ` — 하나를 고르세요`)

- 폴더 줄마다: 폴더 아이콘 · **폴더 이름(굵게)** · 전체 경로(작게) · ☆/★ 단추 · **`열기`** 단추 (`popover.js:617-625`)
  - ☆(빈 별) 툴팁 `자주 쓰는 폴더에 넣기` → 누르면 토스트 `자주 쓰는 폴더에 넣었습니다.`
  - ★(노란 별, 이미 들어 있음) 툴팁 `자주 쓰는 폴더에서 빼기` → 토스트 `자주 쓰는 폴더에서 뺐습니다.`
  - **줄 아무 곳이나 눌러도** `열기`와 같다(별·스위치는 제외, `popover.js:674-677`). 열고 0.7초 뒤 패널이 접힌다.
  - 에이전트가 설치되어 있지 않으면 `열기`가 **꺼진다**(눌러도 안 열림).
- 폴더가 없을 때(`popover.js:638`):
  - 창은 알지만 폴더를 못 찾음: **`이 창에서는 폴더를 찾지 못했습니다. 아래에서 고르거나 폴더를 넣어 주세요.`**
  - 보던 창 자체가 없음: **`독을 누르기 전에 보던 창이 없습니다. 아래에서 고르거나 폴더를 넣어 주세요.`**
- 한 창에서 최대 8개 (`active_folder.py:25` `LIMIT = 8`)

**③ `자주 쓰는 폴더`**

- 넣어 둔 폴더 줄. 별 대신 **✕** 단추(툴팁 `자주 쓰는 폴더에서 빼기`) (`popover.js:619-620`)
- 옮기거나 지워 **없어진 폴더**는 흐리게(`opacity:.55`) 보이고 `열기`가 꺼진다. ✕ 로는 뺄 수 있다(`desktop.py:487` «뺄 때는 지금 없는 폴더도 뺄 수 있다»).
- 비었을 때: **`☆ 를 눌러 넣거나 아래 단추로 폴더를 고르세요.`** (`popover.js:641`)
- 그 아래 단추 **`＋ 폴더 넣기`** → Windows 폴더 고르기 창(pywebview `FileDialog.FOLDER`)이 뜨고, 고른 폴더를 자주 쓰는 폴더에 넣는다(`desktop.py:508-519`).
- 상한 **20개** (`desktop.py:75` `AGENT_FAVORITES = 20`). 저장 위치 `desktop-preferences.json` 의 `agent_folders`.

**④ `열린 탐색기 창`** (있을 때만 나오는 섹션)

- 지금 열려 있는 **모든** 파일 탐색기 탭의 폴더(최대 12개). 이미 ②·③에 나온 폴더는 뺀다(`desktop.py:441`, `active_folder.py:431-435`). 줄 모양은 ②와 같다(☆·열기).

### 2-3. 토스트(패널 아래 알림)

- 보통 2.2초, 오류는 빨간색 4초 (`popover.js:403-410`).
- 줄을 눌러 열면 `<폴더 이름> 에서 Codex 를 열었습니다.` 같은 문장이 토스트로 뜬다.

### 2-4. 설치 진행 중 다시 보기 (`popover.js:648-652`)

```js
if (tool.installed) agentInstalling = 0;
else if (agentInstalling && Date.now() - agentInstalling < 15 * 60000) {
  agentTimer = setTimeout(() => {if (key === 'agent' && !$('card').hidden) loadAgent();}, 3000);
}
```
- `설치하기`를 누른 뒤 **패널이 열려 있는 동안** 3초마다 다시 확인, 15분까지. 설치가 확인되면 경고 줄이 사라지고 `설치 필요` 표시가 빠지며 `열기`가 켜진다.

---

## 3. «지금 보던 창» 폴더 찾기 규칙 (`app/core/active_folder.py`)

### 3-1. 어느 창을 «보던 창»으로 치나 — `Tracker` (46-77행)

- 독·패널을 누르는 순간의 앞 창은 독 자신이므로, 0.4초마다(`POLL = 0.4`) 앞 창을 보고 **«이 프로그램이 아닌 마지막 앞 창»** 을 기억한다.
- 제외: 이 프로그램(같은 pid) 창, 그리고 잠깐 앞에 서는 껍데기 창 — 작업 표시줄·시작 메뉴·Alt+Tab·알림 영역 넘침·썸네일·오른쪽 클릭 메뉴(`#32768`) 등 (`PASSING`, 32-34행).
- 프로그램 시작 때 켠다: `api._start_foreground()        # 에이전트 터미널이 '지금 보던 창'을 알도록` (`desktop.py:2942`). 교사판·학생판 공통 `main()` 경로.

### 3-2. 창 종류별로 폴더를 찾는 방법 (`folders_of`, 403-428행)

| 창 | 찾는 방법 |
|---|---|
| **바탕 화면** (`Progman`·`WorkerW`) | 레지스트리 `Shell Folders\Desktop` 의 바탕 화면 폴더 하나 (없으면 `~\Desktop`). 이것만 돌려준다. |
| **파일 탐색기** (`CabinetWClass`·`ExploreWClass`) | `Shell.Application` 으로 열린 창·탭을 모두 훑어, **이 창 핸들에 속한 탭마다** 그 폴더. Windows 11 탭은 같은 핸들을 나눠 쓰므로 탭이 여럿이면 폴더도 여럿 → 패널에서 고름. «내 PC» 같은 특수 폴더는 건너뜀. |
| **VS Code 류** (`code.exe`·`code - insiders.exe`·`cursor.exe`·`windsurf.exe`·`vscodium.exe`·`trae.exe`·`kiro.exe`) | `%APPDATA%\<편집기>\User\globalStorage\storage.json` 에서 열어 둔 폴더 목록을 읽고, **창 제목의 ` - ` 조각과 이름이 맞는 폴더**를 고른다. 못 맞추면 열린 폴더 전부(→ 고르게 함). |
| **터미널** (`windowsterminal.exe`·`openconsole.exe`·`conhost.exe`·`wezterm-gui.exe`·`alacritty.exe`·`mintty.exe`·`tabby.exe`·`hyper.exe`, 또는 `ConsoleWindowClass`) | 그 창 아래 자손 프로세스 가운데 셸(`cmd`·`powershell`·`pwsh`·`bash`·`zsh`·`fish`·`nu`·`wsl`·`claude`·`codex`·`node`·`python`)의 **현재 폴더**(PEB 를 읽음, 64비트 프로세스만). 최근에 뜬 셸부터. |
| **Office** (`winword.exe`·`excel.exe`·`powerpnt.exe`) | COM 으로 `ActiveDocument`·`ActiveWorkbook`·`ActivePresentation` 의 `Path`. OneDrive 웹 주소는 뺀다. |
| **모든 창 공통(추가)** | ① 창 제목 속 전체 경로(예 `C:\작업\보고서.hwp - 한글` → 실제로 있는 데까지 줄여 가며 찾음, 265-278행). ② 탐색기가 아니면 **실행 인자 속 절대 경로**(한글·메모장처럼 파일을 두 번 눌러 연 경우, `/open:C:\x` 꼴도 인식, 281-289행). |

- 파일 경로가 나오면 그 **파일이 든 폴더**로 바꾼다(`usable`, 251-252행).
- 중복 제거(대소문자·끝 `\` 무시), 실제로 있는 폴더만.

### 3-3. 빼는 폴더 (`_system_roots`·`usable`, 235-262행)

```python
"""실제로 있는 보통 폴더면 그 경로. 시스템·프로그램 폴더는 뺀다 — 거기서 에이전트를 돌릴 일은 없다."""
```
- `%SystemRoot%`(C:\Windows), `%ProgramFiles%`, `%ProgramFiles(x86)%`, `%ProgramData%`, `%LOCALAPPDATA%\Programs`, `%LOCALAPPDATA%\Microsoft`, `%LOCALAPPDATA%\Temp` 와 그 아래 전부.
- 상대 경로, 1024자 넘는 경로, 없는 경로도 뺀다.
- (참고) 사용자 홈 폴더·드라이브 루트(`C:\`)·다운로드 폴더는 **빼지 않는다.**

---

## 4. 터미널이 열리는 방식 (`app/core/agent.py`)

### 4-1. 실행기 파일 (`launcher_text`·`launch`, 74-77·136-151행)

- `<자료 폴더>\agent\claude.cmd` 또는 `codex.cmd` 를 매번 새로 쓴다.
  - 자료 폴더: 교사판 `%LOCALAPPDATA%\SpacekijunDesk`, 학생판 `%LOCALAPPDATA%\SpacekijunStudent` (`edition.py:17-20`)
- 내용 (시험 `test_agent.py:27-28` 의 기대값):
  ```
  @echo off
  call "C:\npm\claude.cmd" --dangerously-skip-permissions
  ```
  에이전트를 **전체 경로**로 부른다 — 설치 직후라 새 터미널의 PATH 가 옛것이어도 찾게.

### 4-2. 터미널 선택 (`terminal_args`, 119-124행)

- **Windows Terminal(`wt.exe`) 이 있으면** 새 창:
  `wt -w new -d <폴더> --title "<도구 이름> · <폴더 이름>" cmd.exe /k <실행기>`
  - 창 제목 예: **`Claude Code · 수업 자료`** (`agent.py:148`, `test_agent.py:34`)
- **없으면** 보통 명령 창(cmd, 새 콘솔). 폴더·제목·명령에 `;` 가 들어 있어도 cmd 로 연다(wt 가 `;` 를 명령 구분자로 읽기 때문).
- `cmd /k` 라서 에이전트를 끝내도(`/exit`, Ctrl+C 등) **창이 그 폴더에 남아** 이어서 쓸 수 있다.
- PowerShell 로 돌리지 않는 이유 (`agent.py:4-5`): «PowerShell 로 돌리면 npm 이 깐 `claude.ps1` 이 실행 정책에 막힐 수 있다 — cmd 는 `.cmd` 를 바로 쓴다.»
- 자식 프로세스 손질 (`app/core/child.py`): 한 파일 실행 파일(PyInstaller)이 바꿔 둔 DLL 찾는 자리를 잠시 되돌리고, `_MEI*`·`_PYI*` 환경 값을 빼며, PATH 는 레지스트리 PATH + 알려진 설치 자리까지 합친 값을 넘긴다.

### 4-3. «권한 묻지 않기»가 넘기는 옵션 (`agent.py:20-23`)

```python
TOOLS = {
    'claude': {'label': 'Claude Code', 'skip': '--dangerously-skip-permissions'},
    'codex': {'label': 'Codex', 'skip': '--dangerously-bypass-approvals-and-sandbox'},
}
```

| 도구 | 켰을 때 붙는 옵션 | 의미 (패널 문구) |
|---|---|---|
| Claude Code | `--dangerously-skip-permissions` | «묻지 않고 파일을 고치고 명령을 실행합니다. 믿는 폴더에서만 켜세요.» |
| Codex | `--dangerously-bypass-approvals-and-sandbox` | 같은 문구. 이름 그대로 **승인 묻기와 샌드박스를 함께 끈다.** |

- 끄면 옵션 없이 `call "<경로>"` 만 — 각 도구의 기본 동작(파일 수정·명령 실행 전에 물어봄)대로 돈다.
- 다른 옵션(모델, 프롬프트 등)은 넘기지 않는다.

### 4-4. 설치 창 (`install_text`·`install`, 80-115·154-164행)

- `<자료 폴더>\agent\install-claude.ps1`(또는 `install-codex.ps1`)을 BOM 있는 UTF-8 로 쓰고(«PowerShell 5.1 은 BOM 이 있어야 한글을 읽는다»), 
  `powershell.exe -NoProfile -ExecutionPolicy Bypass -File <스크립트>` 를 **사용자 홈 폴더**에서 새 터미널(wt 가 있으면 wt)로 연다.
- 창 제목: **`Claude Code 설치`** / **`Codex 설치`**
- 창에 나오는 문구(순서대로):
  - 흰색 `Claude Code 설치`
  - Claude Code: 하늘색 **`Anthropic 공식 설치 스크립트로 설치합니다 (https://claude.ai/install.ps1)`** → 설치 실패 시 빨간 `설치하지 못했습니다: <오류>` → Git 이 없으면 노란 **`참고: Git for Windows 가 없습니다. Claude Code 가 요구하면  winget install --id Git.Git -e  로 설치하세요.`**
  - Codex: 하늘색 **`winget 으로 설치합니다 (OpenAI.Codex)`** 또는 **`npm 으로 설치합니다 (@openai/codex)`**, 둘 다 없으면 빨간 **`winget 도 npm(Node.js)도 없어 설치하지 못했습니다. Microsoft Store 의 앱 설치 관리자를 먼저 설치해 주세요.`**
  - 끝에 PATH 를 다시 읽고 확인 → 초록 **`설치를 마쳤습니다. 독의 에이전트 터미널에서 바로 쓸 수 있습니다.`** 또는 노란 **`설치를 확인하지 못했습니다. 위의 메시지를 확인해 주세요.`**
  - 마지막 **`엔터를 누르면 이 창을 닫습니다`**
- 설치되는 자리(코드가 찾아보는 자리 기준, `search_path`, 44-58행): `%USERPROFILE%\.local\bin`(Claude 공식 스크립트), `%LOCALAPPDATA%\Microsoft\WinGet\Links`(winget), `%APPDATA%\npm`(npm 전역). 설치 위치 자체는 각 설치 프로그램이 정한다.
- 설치 대상 검사: `TOOLS` 에 없는 이름은 거절 — `지원하지 않는 에이전트입니다.` (시험: `agent.install('rm -rf', …)` 은 ValueError, `test_agent.py:72-73`)

### 4-5. 설치 여부 판정 (`find`, 61-65행)

- `shutil.which('claude' 또는 'codex', path=search_path())` — 현재 PATH + 레지스트리의 사용자·컴퓨터 PATH + 위 세 자리. 찾으면 그 전체 경로, 없으면 «설치되어 있지 않음».

---

## 5. 교사판과 학생판의 차이

| 항목 | 교사판(스페이스기전 데스크) | 학생판(스페이스기전 학생) |
|---|---|---|
| 기능 유무 | 있음 | **있음 — 똑같은 기능** (README 129행 «교사판·학생판 모두», 커밋 메시지 «(교사판·학생판)») |
| 허용 API | 전부 | 학생판은 `STUDENT_ACTIONS` 만 받는데, 에이전트 7개(`agent_state`·`agent_quick`·`agent_run`·`agent_settings`·`agent_favorite`·`agent_pick`·`agent_install`)가 **모두 들어 있다** (`desktop.py:74`, 시험 `test_agent.py:220-229`) |
| 독 위치 | `도구` 무리 끝, 그 뒤 `데스크` 무리 | `도구` 무리 끝, 그 뒤 `설정` |
| 권한 묻지 않기·설치하기 | 있음 | **똑같이 있음 — 학생판이라고 막거나 숨기는 코드가 없다** |
| 자료 폴더(실행기·설치 스크립트·설정) | `%LOCALAPPDATA%\SpacekijunDesk` | `%LOCALAPPDATA%\SpacekijunStudent` — 두 판이 한 PC 에 있어도 자주 쓰는 폴더·설정이 섞이지 않는다 |
| 아이콘 숨기기 | 데스크 `연결 및 설정` → `독 아이콘` | 독 `설정` 패널의 독 아이콘 칩 |
| 배포 | 데스크 자동 업데이트 | Intune 패키지(학생판 1.0.2 부터 포함). Intune 설치 스크립트(`deploy/intune/install.ps1`)는 에이전트를 **깔지 않는다** |
| 점검 | `app/packaging_check.py:64-70` | `app/student_check.py:41-46` |

- 참고: **스페이스기전 교실(교실 PC판, `classroom-*`)에는 에이전트 터미널이 없다** (`app/web/classroom*.js` 에 agent 관련 코드 없음).

---

## 6. 오류·안내 메시지 전부

| 문구 (원문) | 언제 | 출처 |
|---|---|---|
| `Claude Code 가 설치되어 있지 않습니다.` / `Codex 가 설치되어 있지 않습니다.` | 설치 없이 실행하려 할 때(예외) | `agent.py:140` |
| `Claude Code 가 설치되어 있지 않습니다` (패널 경고 줄 제목) | 고른 에이전트가 없을 때 | `popover.js:629` |
| `Anthropic 공식 설치 스크립트로 이 사용자에게 설치합니다 (관리자 권한 없이).` | 위 경고 줄, Claude Code | `popover.js:630` |
| `winget 으로 설치합니다 (없으면 npm).` | 위 경고 줄, Codex | `popover.js:630` |
| ` 설치 창에서 진행 중… 끝나면 여기가 바뀝니다.` | 설치 창을 띄운 뒤 | `popover.js:631` |
| `설치 필요` | 에이전트 고르기 토글의 작은 글씨 | `popover.js:627` |
| `Claude Code 설치 창을 열었습니다. 끝나면 여기서 바로 쓸 수 있습니다.` | `설치하기` 누른 직후 토스트 | `agent.py:164` |
| `폴더를 찾을 수 없습니다.` | 실행 직전 폴더가 없을 때 | `agent.py:142` |
| `폴더를 찾을 수 없습니다. 옮기거나 지웠는지 확인해 주세요.` | 패널에서 고른 폴더가 없을 때 | `desktop.py:423` |
| `폴더 형식이 올바르지 않습니다.` | 빈 값·상대 경로 등 | `desktop.py:420,503` |
| `지원하지 않는 에이전트입니다.` | claude·codex 가 아닌 이름 | `agent.py:64,156`, `desktop.py:473,701` |
| `설정 형식이 올바르지 않습니다.` / `바꿀 설정이 없습니다.` | 설정 저장 값 오류 | `desktop.py:477,480` |
| `요청 형식이 올바르지 않습니다.` | 자주 쓰는 폴더 요청 오류 | `desktop.py:490` |
| `이미 자주 쓰는 폴더에 있습니다.` | 같은 폴더를 또 넣을 때 | `desktop.py:497` |
| `자주 쓰는 폴더는 20개까지 둘 수 있습니다.` | 21번째 | `desktop.py:499` |
| `자주 쓰는 폴더에 넣었습니다.` / `자주 쓰는 폴더에서 뺐습니다.` | ☆·✕ | `desktop.py:506` |
| `독이 떠 있을 때 쓸 수 있습니다.` | `＋ 폴더 넣기` 를 독 없이 부를 때 | `desktop.py:514` |
| `이 창에서는 폴더를 찾지 못했습니다. 아래에서 고르거나 폴더를 넣어 주세요.` | 보던 창에 폴더 없음 | `popover.js:638` |
| `독을 누르기 전에 보던 창이 없습니다. 아래에서 고르거나 폴더를 넣어 주세요.` | 보던 창 자체가 없음 | `popover.js:638` |
| `지금 보던 창을 알 수 없습니다` | 패널 부제 | `popover.js:614` |
| `☆ 를 눌러 넣거나 아래 단추로 폴더를 고르세요.` | 자주 쓰는 폴더 비었음 | `popover.js:641` |
| `불러오지 못했습니다` + 오류 문구 | 패널 상태를 못 받았을 때 | `popover.js:610` |
| `<폴더> 에서 Claude Code 를 열었습니다.` / `… (권한 묻지 않기) 를 열었습니다.` | 실행 성공 | `agent.py:150-151` |
| `(오른쪽 클릭: 폴더 고르기)` | 독에서 바로 열었을 때 말풍선 꼬리 | `dock.js:239` |
| `Claude Code · 권한 묻지 않기 켬` / `Claude Code · 권한을 물어 가며 실행` | 스위치·도구 변경 | `desktop.py:484` |
| (로그) `지금 보던 창의 폴더를 찾지 못했습니다:` / `앞 창 지켜보기를 시작하지 못했습니다:` | 데스크 활동 기록에만 | `desktop.py:432,2944` |
| 설치 창 문구 전부 | 4-4 참고 | `agent.py:85-114` |

---

## 7. 주의할 점 (코드·문서에 적힌 것)

1. **권한 묻지 않기 경고** — 패널 문구 «묻지 않고 파일을 고치고 명령을 실행합니다. 믿는 폴더에서만 켜세요.», 켜면 빨간 글씨. 기본값 꺼짐. 옵션 이름에 `dangerously` 가 들어 있다. Codex 는 승인뿐 아니라 **샌드박스까지** 끈다.
2. **설정이 남는다** — 권한 묻지 않기를 한 번 켜면 다음에 독을 눌러 **바로 열 때도** 그 설정으로 열린다(독 단추 자체에는 켜져 있다는 표시가 없고, 말풍선 문구 `(권한 묻지 않기)` 로만 알 수 있다).
3. **독 단추 한 번에 바로 실행** — 폴더가 하나로 잡히면 확인 없이 열린다. 직전에 본 창이 엉뚱한 폴더(예: 바탕 화면, 다운로드)였다면 그 폴더에서 에이전트가 뜬다. 바탕 화면·홈·드라이브 루트는 제외 목록에 없다.
4. **학생판에도 같은 기능** — 학생 PC 에서도 설치하기·권한 묻지 않기를 그대로 쓸 수 있다. 막는 코드 없음.
5. **보던 창을 읽는 범위** — 폴더를 찾으려고 앞 창의 제목, 실행 줄, 셸의 현재 폴더(다른 프로세스 메모리 읽기), VS Code `storage.json`, Office 열린 문서 경로를 읽는다. 이 값은 이 PC 안에서 쓰이고 서버로 보내는 코드는 없다. 저장되는 것은 자주 쓰는 폴더 목록(`desktop-preferences.json`)과 실행기·설치 스크립트 파일, 활동 기록의 «…를 열었습니다» 한 줄뿐이다.
6. **설치는 인터넷 스크립트 실행** — Claude Code 는 `claude.ai/install.ps1` 을 받아 그 자리에서 실행(`Invoke-Expression`), 설치 창은 `-ExecutionPolicy Bypass` 로 뜬다. 관리자 권한은 요구하지 않는다.
7. **설치 전제 조건 안내는 최소한** — Git 이 없을 때 노란 참고 한 줄, winget·npm 이 모두 없을 때 «Microsoft Store 의 앱 설치 관리자를 먼저 설치해 주세요.» 뿐. Node.js 설치 안내는 없다.
8. **로그인·요금 안내 없음** — Claude 계정·ChatGPT 계정 로그인, 유료 플랜 필요 여부에 대한 안내 문구가 코드 어디에도 없다. 영상 덱에서 따로 채워야 할 빈칸이다(각 도구의 첫 실행 로그인 화면은 NEIS_helper 밖의 동작이므로 실제 화면을 따로 확인해야 함).
9. **개인정보(저장소 CLAUDE.md, 성격이 다른 규칙이지만 관련)** — `D:\NEIS_helper\CLAUDE.md` 는 NEIS 작업에 대해 «로그인은 자동화하지 않는다», «저장 / 마감 / 삭제는 사용자 확인을 받고 누른다», «작업 산출물의 개인정보를 정리한다. 스크린샷과 스냅샷에 학생·교직원 실명, 전화번호가 남는다.» 를 적어 두었다. 에이전트 터미널 자체의 주의 사항은 아니지만, 교사가 학생 자료 폴더에서 에이전트를 열 때 같은 원칙을 안내할 근거로 쓸 수 있다(이 연결은 조사자의 해석).

---

## 8. 기타 특이점

- 독에서 바로 열 때 «폴더가 하나»의 기준은 보던 창에서 찾은 폴더 수다. 탐색기 탭이 둘이면 패널로 간다. VS Code 는 제목으로 폴더를 맞추면 하나, 못 맞추면 여럿.
- 셸 현재 폴더 읽기는 64비트 프로세스만 된다(`process_cwd` 주석).
- Office 는 «앞 창의 문서»가 아니라 그 Office 앱의 **활성 문서**를 묻는다(같은 앱 창이 여럿이면 다른 문서가 잡힐 수 있음 — 코드 구조상 추론).
- 실행기 파일은 콘솔 코드 페이지(`encoding='oem'`)로 쓴다. 경로에 그 코드 페이지에 없는 글자가 있으면 실패할 수 있다(코드 구조상 추론, 한글은 cp949 에 있음).
- `사용 방법` 안내(guide)에는 이 기능이 없으므로, 이 영상 덱이 첫 사용 안내가 된다.

## 9. 점검 도구

- `python -m unittest test_agent` (`app/test_agent.py`) — 옵션 문자열, wt/cmd 선택, 실행기 내용, 설치 스크립트(BOM·winget·npm), 폴더 규칙(제목·인자·VS Code·시스템 폴더 제외), Tracker, 설정·자주 쓰는 폴더·바로 열기 조건, 학생판 허용.
- `node scripts/check-agent-panel.mjs [스크린샷.png]` — 가짜 응답으로 패널을 그려 확인: 제목 `에이전트 터미널`, 보던 창 폴더 둘, 없어진 즐겨찾기는 열기 꺼짐, ☆ 로 넣기, 줄 누르면 열고 패널 접기, Codex 를 고르면 `설치하기` 보임·누르면 codex 설치, 설치 전 열기 꺼짐. 라이트·다크 스크린샷을 남길 수 있어 **덱의 패널 목업 참고 화면**으로 쓸 만하다(가짜 상태: 탐색기 `NEIS_helper`, `2학기 수업 자료\정보 과목`, 즐겨찾기 `옮긴 폴더`(없음), 다운로드).
