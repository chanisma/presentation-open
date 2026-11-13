# Google Sheets 완전 연동 패턴

## 전체 구조 요약

```
활동지.html  ──fetch POST (no-cors)──▶  Apps Script  ──▶  Google Sheets
    │
    └──▶  TXT 다운로드 (동시, 항상 성공)
```

---

## 1. 상수 정의

```javascript
var DRAFT_KEY   = 'draft_활동지명';          // 임시저장용
var URL_KEY     = 'sheets_url_활동지명';     // Apps Script URL 저장용
var DEFAULT_URL = '';  // 배포 후 여기에 URL 하드코딩 (선택)
```

---

## 2. 교사 설정 패널 CSS

헤더 바로 아래 위치. 기본 hidden, ⚙ 버튼으로 토글.

```css
.settings-panel {
  background: #FFFBEB; border-bottom: 2px solid #FDE68A;
  padding: 0.7rem 1.5rem; display: none;
  align-items: center; gap: 0.8rem; flex-wrap: wrap;
}
.settings-panel.open { display: flex; }
.settings-panel label { font-size: 0.82rem; color: #92400E; font-weight: 600; white-space: nowrap; }
.settings-panel input[type="text"] {
  flex: 1; min-width: 260px; font-size: 0.82rem;
  background: #FFFFFF; border: 1px solid #FCD34D; color: #111827;
  padding: 0.4rem 0.7rem; border-radius: 0.4rem;
}
.settings-label {
  font-size: 0.78rem; color: #92400E; background: #FEF3C7;
  padding: 0.15rem 0.5rem; border-radius: 0.3rem; border: 1px solid #FDE68A;
}
```

---

## 3. 교사 설정 패널 HTML

헤더 닫는 태그 `</header>` 바로 뒤에 삽입.

```html
<!-- 헤더 우측 -->
<button class="btn" id="btnSettings" title="교사 설정"
  style="background:#FFFBEB;border-color:#FDE68A;color:#92400E;">⚙</button>

<!-- 헤더 아래 패널 -->
<div class="settings-panel" id="settingsPanel">
  <span class="settings-label">교사 전용</span>
  <label for="scriptUrl">Apps Script URL</label>
  <input type="text" id="scriptUrl"
    placeholder="https://script.google.com/macros/s/.../exec">
  <button class="btn" id="btnSaveUrl"
    style="background:#FEF3C7;border-color:#FCD34D;color:#92400E;white-space:nowrap;">URL 저장</button>
  <button class="btn" id="btnClearUrl"
    style="background:#FEF2F2;border-color:#FCA5A5;color:#DC2626;white-space:nowrap;">URL 초기화</button>
</div>
```

---

## 4. JS — 시트 전송 + 설정 패널

```javascript
/* 시트 전송 (no-cors — 응답 확인 불가, 낙관적 UI) */
function sendToSheet(data) {
  var url = localStorage.getItem(URL_KEY) || DEFAULT_URL;
  if (!url) return;
  fetch(url, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).catch(function() {});
}

/* 저장 버튼: TXT + 시트 동시 */
document.getElementById('btnSave').addEventListener('click', function() {
  if (!validate()) { /* ... */ return; }
  var data = getFormData();
  downloadTxt(data);
  sendToSheet(data);
  saveDraft();
  var url = localStorage.getItem(URL_KEY) || DEFAULT_URL;
  showToast(url ? '저장 완료! TXT + 구글 시트 전송' : '저장 완료! TXT 다운로드', 'success', 4000);
});

/* 교사 설정 패널 */
document.getElementById('btnSettings').addEventListener('click', function() {
  var panel = document.getElementById('settingsPanel');
  panel.classList.toggle('open');
  if (panel.classList.contains('open')) {
    document.getElementById('scriptUrl').value = localStorage.getItem(URL_KEY) || '';
  }
});
document.getElementById('btnSaveUrl').addEventListener('click', function() {
  var url = document.getElementById('scriptUrl').value.trim();
  if (url) { localStorage.setItem(URL_KEY, url); showToast('URL 저장됨', 'success'); }
  else showToast('URL을 입력해 주세요', 'error');
});
document.getElementById('btnClearUrl').addEventListener('click', function() {
  localStorage.removeItem(URL_KEY);
  document.getElementById('scriptUrl').value = '';
  showToast('URL 초기화됨', 'info');
});
```

---

## 5. Apps Script 파일 (apps-script.js)

활동지와 함께 `apps-script.js` 파일을 생성해 교사가 복사할 수 있게 한다.

### 파일 구조 규칙

```javascript
/**
 * [활동지명] — Google Apps Script
 * 설정 방법: ... (주석으로 안내)
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('활동지') || ss.insertSheet('활동지');

    if (sheet.getLastRow() === 0) {
      // 헤더: getFormData()의 키와 1:1 매핑
      // '반/번호' 열에는 학번 GCCNN 5자리가 들어간다 (헤더명은 기존 분석
      // 스크립트가 찾는 이름이므로 그대로 둔다 — html-patterns.md 참조)
      sheet.appendRow(['제출시각', '이름', '반/번호', /* 모든 필드 */ ]);
      // 헤더 스타일 (선택)
      var h = sheet.getRange(1, 1, 1, /* 열수 */);
      h.setBackground('#2563EB'); h.setFontColor('#FFFFFF'); h.setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      new Date().toLocaleString('ko-KR'),
      data.studentName || '',
      data.studentId   || '',   // 학번 GCCNN (구 활동지는 data.classInfo)
      /* getFormData() 키 순서와 동일하게 나열 */
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

### 배포 설정 (중요)

| 항목 | 값 |
|------|-----|
| 유형 | 웹 앱 |
| 실행 계정 | 나 |
| 액세스 권한 | **모든 사용자 (익명 포함)** ← 반드시 |

> 학교 Google Workspace: URL이 `/a/macros/도메인/...` 형태일 수 있음.
> 배포 후 시크릿 창에서 `GET .../exec?test=1` 으로 응답 확인 권장.

---

## 5-2. 임시저장 (localStorage) 패턴

> **원칙 두 가지 (2026-08-22 추가).**
> ① 입력이 시작되면 곧바로 '대기 중'으로 바꾸고, 저장이 끝난 뒤에만 '임시저장됨'을 띄운다.
>    아직 저장되지 않았는데 이전의 '임시저장됨'이 남아 있으면 학생이 저장된 줄 알고 창을 닫는다.
> ② localStorage는 그 기기의 그 브라우저에만 남는다. 학교에서 쓰다가 집에서 이어 쓰려다
>    잃어버리는 일이 생기므로, 상태 표시 아래에 저장 범위를 한 줄로 적어 둔다.

### 액션 바 버튼

```html
<div class="action-bar-right">
  <span class="draft-wrap">
    <span class="draft-label" id="draftLabel">임시저장: 대기 중</span>
    <span class="draft-note">이 기기의 이 브라우저에만 저장돼요</span>
  </span>
  <button class="btn" id="btnDraft"
    style="background:#EFF6FF;border-color:#93C5FD;color:#1D4ED8;">💾 임시저장</button>
  <button class="btn btn-danger" id="btnClear">초기화</button>
</div>
```

### JS — 자동저장 + 수동저장

```javascript
var DRAFT_KEY = 'draft_활동지명';   // localStorage 키
var draftTimer = null;

var label = document.getElementById('draftLabel');

/* 자동저장 예약 — 입력하는 순간 '대기 중'으로 먼저 바꾼다 */
function scheduleDraft() {
  label.textContent = '입력 중… 잠시 멈추면 임시저장됩니다';
  label.className = 'draft-label pending';
  clearTimeout(draftTimer);
  draftTimer = setTimeout(saveDraft, 1200);
}

/* 실제 저장 — 끝난 뒤에만 '임시저장됨'을 띄운다 */
function saveDraft() {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(getFormData()));
    label.textContent = '임시저장됨 · ' + new Date().toLocaleTimeString('ko-KR');
    label.className = 'draft-label saved';
  } catch (e) {
    // 저장 공간 부족 등 — 저장되지 않았다는 사실을 숨기지 않는다
    label.textContent = '임시저장 실패 — 이 기기에 저장 공간이 부족해요';
    label.className = 'draft-label failed';
  }
}

/* 불러오기 (페이지 로드 시) */
function loadDraft() {
  try {
    var raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    setFormData(JSON.parse(raw));
    showToast('이전 작성 내용을 불러왔습니다.', 'info', 3000);
  } catch(e) {}
}

/* 수동저장 버튼 */
document.getElementById('btnDraft').addEventListener('click', function() {
  saveDraft();
  showToast('임시저장되었습니다.', 'info', 2500);
});

/* 초기화 시 draft 삭제 */
// ... localStorage.removeItem(DRAFT_KEY);

/* 모든 입력 필드에 자동저장 연결 */
document.querySelectorAll('input, textarea, select').forEach(function(el) {
  el.addEventListener('input', scheduleDraft);
  el.addEventListener('change', scheduleDraft);
});

/* 페이지 로드 시 불러오기 */
loadDraft();
```

> **localStorage vs sessionStorage**: `localStorage`는 브라우저를 닫아도 유지, `sessionStorage`는 탭을 닫으면 삭제. 수업 활동지는 `localStorage` 권장 (브라우저 새로고침·재접속 시에도 복원).

---

---

## 6. 과목 공용 multi-source 패턴

같은 과목의 활동지가 여러 개일 때 `apps-script.js` 하나를 **과목 폴더**에 두고 `source` 필드로 시트 탭을 분기한다.

### 폴더 구조

```
data/2026-1/정보/
  apps-script.js          ← 과목 공용 (하나만 배포)
  활동지A/활동지.html      ← source: 'activity-a'
  활동지B/활동지.html      ← source: 'activity-b'
```

### 활동지 HTML — getFormData()에 source 추가

```javascript
function getFormData() {
  return {
    source: 'activity-a',   // ← 활동지마다 고유 식별자
    studentName: val('studentName'),
    studentId: val('studentId'),   // ← 학번 GCCNN 5자리 (반/번호 두 칸 대신)
    // ...
  };
}
```

### apps-script.js — source 분기

```javascript
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss   = SpreadsheetApp.getActiveSpreadsheet();

    if (data.source === 'activity-a') {
      var sheet = ss.getSheetByName('활동지A') || ss.insertSheet('활동지A');
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(['제출시각', '이름', /* A 활동지 헤더 */]);
        var h = sheet.getRange(1, 1, 1, /* 열수 */);
        h.setBackground('#F27321'); h.setFontColor('#FFFFFF'); h.setFontWeight('bold');
        sheet.setFrozenRows(1);
      }
      sheet.appendRow([new Date().toLocaleString('ko-KR'), data.studentName || '', data.studentId || '', /* ... */]);

    } else if (data.source === 'activity-b') {
      var sheet2 = ss.getSheetByName('활동지B') || ss.insertSheet('활동지B');
      // ... 동일 패턴
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

### 새 활동지 추가 시

1. 활동지 HTML `getFormData()`에 `source: '새식별자'` 추가
2. `apps-script.js`에 `else if (data.source === '새식별자')` 블록 추가
3. Apps Script **재배포 (배포 관리 → 새 버전)** — URL은 동일하게 유지
4. 모든 활동지 ⚙ 패널에 **동일한 URL** 입력

---

## 6. 체크리스트

- [ ] 같은 과목이면 `apps-script.js`를 **과목 폴더**에 하나만 생성
- [ ] 각 활동지 `getFormData()`에 `source` 식별자 추가
- [ ] `apps-script.js` 헤더 행과 `getFormData()` 키가 1:1 매핑 확인
- [ ] Apps Script 배포 → 액세스 권한 "모든 사용자(익명 포함)"
- [ ] 배포 URL → `DEFAULT_URL` 하드코딩 또는 ⚙ 설정 패널로 입력
- [ ] 시트가 없어도 OK (첫 POST 시 자동 생성)
- [ ] TXT 다운로드는 URL 없어도 항상 동작 확인
- [ ] 임시저장 버튼(`btnDraft`) + 자동저장(`scheduleDraft`) 모두 구현
- [ ] 입력 중에는 '임시저장됨'이 뜨지 않고, 저장이 끝난 뒤에만 뜨는지 확인
- [ ] '이 기기의 이 브라우저에만 저장된다'는 안내를 상태 표시 아래에 배치
- [ ] `loadDraft()`를 페이지 로드 마지막에 호출
- [ ] 초기화 시 `localStorage.removeItem(DRAFT_KEY)` 포함
