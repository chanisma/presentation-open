# HTML 활동지 구현 패턴

## 전체 파일 구조

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>활동지 제목</title>
  <!-- Google Fonts (발표자료와 동일한 폰트 사용 권장) -->
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
  <style>/* CSS */</style>
</head>
<body>
  <!-- 1. 헤더 -->
  <!-- 2. 메인 (폼 카드들) -->
  <!-- 3. 액션 바 -->
  <!-- 4. 토스트 컨테이너 -->
  <!-- 5. 가이드 모달 (선택) -->
  <script>/* JS */</script>
</body>
</html>
```

---

## CSS 변수 — 발표 자료의 테마에 맞춰 수정

```css
:root {
  --bg: #0F0F2D;
  --primary: #A78BFA;
  --accent: #67E8F9;
  --success: #34D399;
  --warn: #FBBF24;
  --text: #FFFFFF;
  --text-sub: #C8C8E0;
  --glass: rgba(255,255,255,0.08);
  --glass-border: rgba(255,255,255,0.15);
  --glass-strong: rgba(255,255,255,0.12);
}
body {
  background: var(--bg);
  background-image:
    radial-gradient(ellipse 60% 50% at 15% 20%, rgba(167,139,250,0.12), transparent),
    radial-gradient(ellipse 50% 40% at 85% 80%, rgba(103,232,249,0.08), transparent);
  color: var(--text);
  font-family: 'Noto Sans KR', sans-serif;
  min-height: 100vh;
  padding-bottom: 6rem;
}
```

## CSS 변수 — 밝은 테마 (일반 학교 활동지용)

```css
:root {
  --bg: #f8f9fa;
  --primary: #3b82f6;
  --accent: #10b981;
  --success: #22c55e;
  --warn: #f59e0b;
  --text: #1e293b;
  --text-sub: #64748b;
  --glass: #ffffff;
  --glass-border: #e2e8f0;
  --glass-strong: #f1f5f9;
}
body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Noto Sans KR', sans-serif;
  min-height: 100vh;
  padding-bottom: 6rem;
}
```

---

## 헤더 패턴

```html
<header class="page-header">
  <div class="page-header-left">
    <a href="index.html" class="btn btn-ghost" id="btnBack">← 발표자료</a>
    <h1 class="page-title">활동지 제목</h1>
    <span class="page-badge">2026</span>
  </div>
</header>

<style>
.page-header {
  position: sticky; top: 0; z-index: 100;
  background: rgba(15,15,45,0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--glass-border);
  padding: 0.7rem 1.5rem;
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
}
.page-title { font-size: 1rem; font-weight: 600; }
.page-badge {
  font-size: 0.78rem; padding: 0.15rem 0.6rem; border-radius: 2rem;
  background: rgba(167,139,250,0.2); color: var(--primary);
  border: 1px solid rgba(167,139,250,0.3);
}
</style>
```

---

## 폼 카드 패턴

```html
<main class="main" id="main">
  <div class="form-card">
    <div class="form-card-header">
      <span class="form-card-num">1</span>
      <span class="form-card-title">섹션 제목</span>
      <span class="form-card-desc">부연 설명 (선택)</span>
    </div>
    <div class="form-card-body">
      <!-- 필드들 -->
    </div>
  </div>
</main>

<style>
.main { max-width: 860px; margin: 0 auto; padding: 1.5rem 1rem; }
.form-card {
  background: var(--glass); border: 1px solid var(--glass-border);
  border-radius: 1rem; overflow: hidden; margin-bottom: 1rem;
}
.form-card-header {
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.7rem 1.2rem; border-bottom: 1px solid var(--glass-border);
  background: var(--glass-strong);
}
.form-card-num {
  font-size: 0.78rem; font-weight: 700; color: var(--primary);
  background: rgba(167,139,250,0.15); border: 1px solid rgba(167,139,250,0.25);
  border-radius: 50%; width: 1.6rem; height: 1.6rem;
  display: flex; align-items: center; justify-content: center;
}
.form-card-title { font-size: 1rem; font-weight: 600; }
.form-card-desc { font-size: 0.82rem; color: var(--text-sub); margin-left: auto; }
.form-card-body { padding: 1rem 1.2rem; display: flex; flex-direction: column; gap: 0.8rem; }
</style>
```

---

## 입력 필드 패턴

```html
<!-- 텍스트 입력 -->
<div class="field">
  <label for="fieldId">레이블 <span class="required">*</span></label>
  <input type="text" id="fieldId" placeholder="입력 힌트">
</div>

<!-- 여러 줄 텍스트 -->
<div class="field">
  <label for="textareaId">레이블</label>
  <textarea id="textareaId" rows="3" placeholder="입력 힌트"></textarea>
</div>

<!-- 2열 레이아웃 -->
<div class="field-grid">
  <div class="field">...</div>
  <div class="field">...</div>
</div>

<style>
.field { display: flex; flex-direction: column; gap: 0.3rem; }
label { font-size: 0.88rem; color: var(--text-sub); font-weight: 500; }
.required { color: var(--warn); }
input[type="text"], textarea, select {
  background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border);
  border-radius: 0.5rem; padding: 0.55rem 0.8rem;
  color: var(--text); font-family: inherit; font-size: 0.95rem;
  width: 100%; transition: border-color 0.2s;
}
input:focus, textarea:focus, select:focus {
  outline: none; border-color: var(--primary);
  background: rgba(167,139,250,0.08);
}
input.invalid, textarea.invalid { border-color: #ef4444; }
.field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; }
</style>
```

---

## 학생 식별 필드 — 이름 + 학번 (표준)

새 활동지는 **반/번호 두 칸 대신 학번 한 칸**을 받는다. 학번은 `GCCNN` 5자리:

| 자리 | 의미 | 범위 |
|---|---|---|
| `G` | 학년 | 1~3 |
| `CC` | 반 | 01~ (2자리 0패딩) |
| `NN` | 번호 | 01~ (2자리 0패딩) |

예) `10315` = 1학년 3반 15번 · `20109` = 2학년 1반 9번

숫자 한 칸이라 오타·표기 흔들림(`1반 15번` / `1-15` / `01반15`)이 사라지고,
제출현황·생활기록부 스크립트가 (학년, 반, 번호)로 바로 쪼갤 수 있다.

```html
<div class="field-grid">
  <div class="field">
    <label for="studentName">이름 <span class="required">*</span></label>
    <input type="text" id="studentName" placeholder="홍길동" autocomplete="name">
  </div>
  <div class="field">
    <label for="studentId">학번 <span class="required">*</span></label>
    <input type="text" id="studentId" placeholder="10315"
           inputmode="numeric" maxlength="5" autocomplete="off">
    <!-- 입력하는 대로 "1학년 3반 15번"을 되비쳐 학생이 스스로 오타를 잡게 한다 -->
    <span class="field-hint" id="studentIdHint">학년·반·번호 5자리 (예: 1학년 3반 15번 → 10315)</span>
  </div>
</div>

<style>
.field-hint { font-size: 0.78rem; color: var(--text-sub); }
.field-hint.bad { color: #ef4444; }
.field-hint.good { color: var(--primary); }
</style>
```

```javascript
/* ===== 학번(GCCNN) 파싱·검증 ===== */
// 반 00 · 번호 00은 없다 → 구조까지 검사한다
var STUDENT_ID_RE = /^[1-3](?!00)\d{2}(?!00)\d{2}$/;

function parseStudentId(raw) {
  // 숫자만 남긴다 — '1-03-15' · '10315번' · '103 15' 같은 표기는 통과하지만
  // '1반 15번'(반이 0패딩 안 됨)은 4자리가 되어 거부된다. 힌트가 안내한다.
  var s = String(raw || '').replace(/\D/g, '');
  if (!STUDENT_ID_RE.test(s)) return null;
  return {
    id: s,
    grade: Number(s.slice(0, 1)),
    classNo: Number(s.slice(1, 3)),
    number: Number(s.slice(3, 5)),
    label: Number(s.slice(0, 1)) + '학년 ' + Number(s.slice(1, 3)) + '반 ' + Number(s.slice(3, 5)) + '번'
  };
}

// 입력 중 숫자만 남기고, 5자리가 되면 해석 결과를 되비친다
(function bindStudentId() {
  var el = document.getElementById('studentId');
  var hint = document.getElementById('studentIdHint');
  if (!el || !hint) return;
  el.addEventListener('input', function () {
    var digits = el.value.replace(/\D/g, '').slice(0, 5);
    if (digits !== el.value) el.value = digits;      // 붙여넣기·오타 정리
    if (!digits) {
      hint.textContent = '학년·반·번호 5자리 (예: 1학년 3반 15번 → 10315)';
      hint.className = 'field-hint';
      return;
    }
    var p = parseStudentId(digits);
    if (p) {
      hint.textContent = p.label;
      hint.className = 'field-hint good';
    } else {
      hint.textContent = digits.length < 5 ? '5자리를 모두 입력하세요' : '학번 형식이 아닙니다 (예: 10315)';
      hint.className = 'field-hint bad';
    }
  });
})();
```

검증(`validate()`)에서는 빈 값 검사에 더해 구조까지 본다:

```javascript
var sid = parseStudentId(val('studentId'));
if (!sid) { document.getElementById('studentId').classList.add('invalid'); ok = false; }
```

전송 payload는 학번 문자열 하나만 보낸다 (시트에서 쪼개 쓸 수 있으므로 중복 전송 불필요):

```javascript
function getFormData() {
  return {
    source: 'activity-a',
    studentName: val('studentName'),
    studentId: val('studentId'),     // 'GCCNN' 5자리 문자열
    // ...
  };
}
```

> **시트 열 이름은 기존과 같이 `반/번호`를 쓴다.** 제출현황·생활기록부
> 스크립트(`build_submission_report.py`, `consolidate_jeongbo.py`)가 그 헤더명을
> 기준으로 열을 찾기 때문 — 값만 학번으로 바뀐다. 두 스크립트의 파서
> (`parse_classnum`, `parse_ban_no`)는 `1반 15번`(구)과 `10315`(신)를 모두
> (반, 번호)로 읽는다.

```javascript
// apps-script.js — 헤더는 '반/번호', 값은 학번
sheet.appendRow(['제출시각', '이름', '반/번호', /* ... */]);
sheet.appendRow([
  new Date().toLocaleString('ko-KR'),
  data.studentName || '',
  data.studentId || '',        // ← GCCNN
  /* ... */
]);
```

TXT 저장·파일명에서도 학번을 쓴다:

```javascript
lines.push('학번: ' + (data.studentId || ''));
a.download = '활동지_' + (data.studentId || '') + '_' + (data.studentName || '') + '.txt';
```

---

## 액션 바 패턴

```html
<div class="action-bar">
  <div class="action-bar-left">
    <button class="btn btn-success" id="btnSave">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17 3H5c-1.1 0-2 .9-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
      </svg>
      <span id="btnSaveText">저장하기</span>
    </button>
  </div>
  <div class="action-bar-right">
    <span class="draft-label" id="draftLabel">임시저장: 대기 중</span>
    <button class="btn btn-danger" id="btnClear">초기화</button>
  </div>
</div>

<style>
.action-bar {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
  background: rgba(15,15,45,0.95); backdrop-filter: blur(12px);
  border-top: 1px solid var(--glass-border);
  padding: 0.7rem 1.5rem;
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
}
.action-bar-left, .action-bar-right { display: flex; align-items: center; gap: 0.5rem; }
.draft-label { font-size: 0.8rem; color: var(--text-sub); }

/* 버튼 공통 */
.btn {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.45rem 1rem; border-radius: 0.5rem; border: 1px solid transparent;
  font-size: 0.9rem; font-weight: 500; cursor: pointer; font-family: inherit;
  transition: background 0.15s;
}
.btn svg { width: 1em; height: 1em; }
.btn-success { background: rgba(52,211,153,0.15); border-color: rgba(52,211,153,0.4); color: var(--success); }
.btn-success:hover { background: rgba(52,211,153,0.25); }
.btn-ghost { background: transparent; border-color: var(--glass-border); color: var(--text-sub); }
.btn-ghost:hover { background: var(--glass); color: var(--text); }
.btn-danger { background: rgba(244,114,182,0.1); border-color: rgba(244,114,182,0.3); color: #f472b6; }
.btn-danger:hover { background: rgba(244,114,182,0.2); }
.btn:disabled { opacity: 0.45; cursor: not-allowed; }
</style>
```

---

## 토스트 알림 패턴

```html
<div class="toast-container" id="toastContainer" aria-live="polite"></div>

<style>
.toast-container { position: fixed; bottom: 5rem; right: 1.5rem; z-index: 200; display: flex; flex-direction: column; gap: 0.5rem; }
.toast {
  padding: 0.6rem 1rem; border-radius: 0.5rem; font-size: 0.88rem;
  max-width: 320px; animation: slideIn 0.2s ease;
}
.toast.success { background: rgba(52,211,153,0.9); color: #022c22; }
.toast.error   { background: rgba(239,68,68,0.9);  color: #fff; }
.toast.info    { background: rgba(167,139,250,0.9); color: #fff; }
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: none; opacity: 1; } }
</style>

<script>
function showToast(msg, type, duration) {
  type = type || 'info'; duration = duration || 3000;
  var toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = msg;
  document.getElementById('toastContainer').appendChild(toast);
  setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, duration + 400);
}
</script>
```

---

## 인쇄(@media print) 패턴

```css
@media print {
  body { background: #fff; color: #111; padding: 0; }
  .page-header, .action-bar, .settings-panel, .toast-container { display: none !important; }
  .main { max-width: 100%; padding: 0; }
  .form-card { background: #fff; border: 1px solid #ccc; border-radius: 0; margin-bottom: 0.8rem; break-inside: avoid; }
  input, textarea { border: 1px solid #999; background: #fff; color: #111; }
}
```
