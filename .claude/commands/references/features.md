# 추가 기능 레퍼런스

> 이 파일은 사용자가 해당 기능을 활성화했을 때만 참조합니다.

---

## 자동 재생 모드

```javascript
// 자동 재생 시작 (ms: 밀리초 단위, 예: 5000 = 5초)
let autoPlayInterval = null;

function startAutoPlay(ms) {
  stopAutoPlay(); // 중복 방지
  autoPlayInterval = setInterval(() => {
    if (currentSlide < totalSlides - 1) {
      nextSlide();
    } else {
      stopAutoPlay(); // 마지막 슬라이드에서 자동 중지
    }
  }, ms);
}

function stopAutoPlay() {
  if (autoPlayInterval) {
    clearInterval(autoPlayInterval);
    autoPlayInterval = null;
  }
}

// 사용자 조작 시 자동 재생 중지
['click', 'keydown', 'touchstart'].forEach(evt => {
  document.addEventListener(evt, stopAutoPlay, { once: false, passive: true });
});
```

---

## 다크모드

- CSS 변수 오버라이드 방식
- `body.dark-mode` 클래스 토글
- 어두운 배경(`#1a1a2e`) + 밝은 텍스트(`#e0e0e0`)
- 카드 배경: `#2d2d44`
- 토글 버튼: 네비바 또는 우상단 고정

```css
/* 다크모드 CSS 변수 오버라이드 */
body.dark-mode {
  --bg: #1a1a2e;
  --card-bg: #2d2d44;
  --text: #e0e0e0;
  --text-secondary: #b0b0c0;
  --white: #2d2d44;
  --gray-200: #444466;
  --gray-600: #a0a0b8;
  --light: #383856;
}
body.dark-mode .browser-card { background: var(--card-bg); }
body.dark-mode .nav-bar { background: rgba(26, 26, 46, 0.95); }
body.dark-mode .highlight-box { background: rgba(255,255,255,0.07); }
```

```javascript
// 다크모드 토글 (localStorage로 상태 유지)
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDark ? '1' : '0');
  const btn = document.getElementById('darkModeBtn');
  if (btn) btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
}

// 페이지 로드 시 상태 복원
(function() {
  if (localStorage.getItem('darkMode') === '1') {
    document.body.classList.add('dark-mode');
  }
})();
```

---

## 발표자 노트

- 각 슬라이드에 `data-notes="..."` 속성
- N키로 노트 패널 토글
- 반투명 오버레이, 하단 30% 영역

```javascript
// N키: 노트 패널 토글
document.addEventListener('keydown', (e) => {
  if (e.key === 'n' || e.key === 'N') {
    toggleNotes();
  }
});

function toggleNotes() {
  const panel = document.getElementById('notesPanel');
  const isVisible = panel.style.display !== 'none';
  panel.style.display = isVisible ? 'none' : 'block';
  panel.setAttribute('aria-hidden', isVisible ? 'true' : 'false');
  updateNotesContent();
}

function updateNotesContent() {
  // textContent 사용: 노트는 순수 텍스트 (XSS 방지)
  const note = slides[currentSlide].getAttribute('data-notes') || '(노트 없음)';
  document.getElementById('notesContent').textContent = note;
}
```

```html
<!-- 노트 패널 HTML (body 끝에 추가) -->
<div id="notesPanel" role="complementary" aria-label="발표자 노트"
     style="display:none; position:fixed; bottom:2.5rem; left:0; right:0;
            height:30%; background:rgba(0,0,0,0.88); color:#fff;
            padding:1rem 1.5rem; overflow-y:auto; z-index:998;">
  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
    <strong style="font-size:13px;">📝 발표자 노트</strong>
    <button onclick="toggleNotes()" style="background:none;border:none;color:#fff;cursor:pointer;font-size:16px;"
            aria-label="노트 패널 닫기">✕</button>
  </div>
  <!-- textContent로만 노트 내용을 표시하므로 XSS 위험 없음 -->
  <p id="notesContent" style="font-size:14px; line-height:1.6; margin:0;"></p>
</div>
```

---

## 인쇄 스타일

```css
@media print {
  .slide {
    page-break-after: always;
    opacity: 1 !important;
    pointer-events: auto !important;
    position: relative;
    display: block !important;
  }
  .nav-bar, .progress-bar, .skip-link { display: none !important; }
  /* 인쇄 시 배경색 강제 출력 */
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
```

---

## 전체화면

- 네비게이션 바 우측에 전체화면 버튼 추가 (nav-btn 스타일 동일)
- 진입 아이콘: expand, 해제 아이콘: compress — `fullscreenchange` 이벤트로 자동 전환
- ESC 또는 버튼 재클릭으로 해제

```javascript
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

// 아이콘 전환: expand/compress SVG를 display로 토글
document.addEventListener('fullscreenchange', () => {
  const expand = document.getElementById('fsExpand');
  const compress = document.getElementById('fsCompress');
  const btn = document.getElementById('fsBtn');
  if (document.fullscreenElement) {
    if (expand) expand.style.display = 'none';
    if (compress) compress.style.display = 'block';
    if (btn) btn.setAttribute('aria-label', '전체화면 해제');
  } else {
    if (expand) expand.style.display = 'block';
    if (compress) compress.style.display = 'none';
    if (btn) btn.setAttribute('aria-label', '전체화면 전환');
  }
});
```

---

## 인터랙티브 퀴즈 슬라이드

> 외부 의존성 없음. 모든 로직 인라인 구현. 한국어 교육 현장 최적화.

### 객관식 퀴즈

```html
<!-- 객관식 퀴즈 슬라이드 예시 -->
<div class="slide" data-slide="N" role="region" aria-label="퀴즈 슬라이드">
  <div class="browser-card">
    <div class="browser-topbar" aria-hidden="true">
      <div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div>
      <span class="topbar-title">퀴즈</span>
    </div>
    <div class="browser-content quiz-slide">
      <!-- 문제 번호 + 뱃지 -->
      <div class="quiz-header">
        <span class="badge badge-purple">Q1</span>
        <span class="quiz-score" id="quizScore-1" aria-live="polite"></span>
      </div>
      <!-- 문제 텍스트 -->
      <h2 class="quiz-question" id="quizQ-1">
        다음 중 HTML 태그가 아닌 것은?
      </h2>
      <!-- 보기 목록 -->
      <div class="quiz-options" role="radiogroup" aria-labelledby="quizQ-1">
        <button class="quiz-option" data-quiz="1" data-answer="false"
                role="radio" aria-checked="false"
                onclick="selectQuizOption(this, 1)">
          <span class="opt-label" aria-hidden="true">①</span>
          <span class="opt-text">&lt;div&gt;</span>
        </button>
        <button class="quiz-option" data-quiz="1" data-answer="false"
                role="radio" aria-checked="false"
                onclick="selectQuizOption(this, 1)">
          <span class="opt-label" aria-hidden="true">②</span>
          <span class="opt-text">&lt;span&gt;</span>
        </button>
        <button class="quiz-option" data-quiz="1" data-answer="true"
                role="radio" aria-checked="false"
                onclick="selectQuizOption(this, 1)">
          <span class="opt-label" aria-hidden="true">③</span>
          <span class="opt-text">&lt;box&gt;</span>
        </button>
        <button class="quiz-option" data-quiz="1" data-answer="false"
                role="radio" aria-checked="false"
                onclick="selectQuizOption(this, 1)">
          <span class="opt-label" aria-hidden="true">④</span>
          <span class="opt-text">&lt;p&gt;</span>
        </button>
      </div>
      <!-- 정답 해설 (초기에는 숨김) -->
      <!-- 피드백 텍스트는 JS에서 textContent로 설정 (XSS 방지) -->
      <div class="quiz-feedback" id="quizFeedback-1" aria-live="assertive"
           style="display:none;" role="alert">
        <p class="feedback-text"></p>
        <p class="feedback-explain">💡 &lt;box&gt;는 HTML 표준 태그가 아닙니다. 레이아웃에는 &lt;div&gt;를 사용합니다.</p>
      </div>
    </div>
  </div>
</div>
```

### O/X 퀴즈

```html
<!-- O/X 퀴즈 슬라이드 -->
<div class="browser-content quiz-slide ox-quiz">
  <div class="quiz-header">
    <span class="badge badge-orange">O / X</span>
  </div>
  <h2 class="quiz-question" id="quizOX-1">
    CSS는 웹 페이지의 구조를 정의하는 언어이다.
  </h2>
  <div class="ox-options" role="radiogroup" aria-labelledby="quizOX-1">
    <button class="ox-btn ox-o" data-quiz="ox1" data-answer="false"
            onclick="selectOX(this, 'ox1')"
            aria-label="O: 맞다">
      <span aria-hidden="true">O</span>
    </button>
    <button class="ox-btn ox-x" data-quiz="ox1" data-answer="true"
            onclick="selectOX(this, 'ox1')"
            aria-label="X: 틀리다">
      <span aria-hidden="true">X</span>
    </button>
  </div>
  <!-- 피드백 텍스트는 JS에서 textContent로 설정 -->
  <div class="quiz-feedback" id="quizFeedback-ox1" aria-live="assertive"
       style="display:none;" role="alert">
    <p class="feedback-text"></p>
    <p class="feedback-explain">💡 CSS는 스타일(디자인)을 담당합니다. 구조는 HTML이 정의합니다.</p>
  </div>
</div>
```

### 퀴즈 CSS

```css
/* 퀴즈 공통 */
.quiz-slide { display: flex; flex-direction: column; gap: 1rem; }
.quiz-header { display: flex; align-items: center; gap: 0.5rem; }
.quiz-question {
  font-size: 1.15rem; font-weight: 700;
  line-height: 1.5; color: var(--text);
  background: var(--light); border-radius: 0.7rem;
  padding: 1rem 1.2rem; border-left: 4px solid var(--main);
}

/* 객관식 보기 */
.quiz-options { display: flex; flex-direction: column; gap: 0.5rem; }
.quiz-option {
  display: flex; align-items: center; gap: 0.8rem;
  padding: 0.7rem 1rem; border-radius: 0.5rem;
  border: 2px solid var(--gray-200); background: var(--white);
  cursor: pointer; text-align: left; font-size: 0.95rem;
  font-family: inherit; transition: all 0.15s;
}
.quiz-option:hover:not(:disabled) {
  border-color: var(--main); background: var(--light);
  transform: translateX(4px);
}
.quiz-option:focus-visible { outline: 3px solid var(--main); outline-offset: 2px; }
.quiz-option.correct { border-color: #3aaa5c; background: #e8f5e9; color: #1b5e20; }
.quiz-option.wrong   { border-color: #e53935; background: #fce4ec; color: #b71c1c; }
.quiz-option:disabled { cursor: default; }
.opt-label { font-weight: 700; color: var(--main); min-width: 1.5rem; }

/* O/X 퀴즈 */
.ox-options { display: flex; gap: 1.5rem; justify-content: center; margin: 1rem 0; }
.ox-btn {
  width: 6rem; height: 6rem; border-radius: 50%;
  border: 3px solid transparent; cursor: pointer;
  font-size: 2.5rem; font-weight: 900;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s; font-family: inherit;
}
.ox-o { background: #e3f2fd; color: #1565c0; border-color: #2196f3; }
.ox-x { background: #fce4ec; color: #ad1457; border-color: #e91e63; }
.ox-btn:hover:not(:disabled) { transform: scale(1.1); }
.ox-btn:focus-visible { outline: 3px solid var(--main); outline-offset: 3px; }
.ox-btn.correct { background: #e8f5e9; border-color: #3aaa5c; color: #1b5e20; }
.ox-btn.wrong   { background: #ffebee; border-color: #e53935; color: #b71c1c; }
.ox-btn:disabled { cursor: default; }

/* 피드백 박스 */
.quiz-feedback {
  padding: 0.8rem 1rem; border-radius: 0.5rem;
  font-size: 0.95rem; line-height: 1.5;
  animation: popUp 0.3s ease both;
}
.quiz-feedback.correct-fb { background: #e8f5e9; border: 1.5px solid #3aaa5c; color: #1b5e20; }
.quiz-feedback.wrong-fb   { background: #fce4ec; border: 1.5px solid #e53935; color: #b71c1c; }
.feedback-explain { font-size: 0.88rem; margin-top: 0.3rem; color: var(--text-secondary); }

@media (max-width: 768px) {
  .ox-btn { width: 4.5rem; height: 4.5rem; font-size: 2rem; }
  .quiz-option { padding: 0.6rem 0.8rem; font-size: 0.9rem; }
}
```

### 퀴즈 JavaScript

```javascript
// 객관식 퀴즈 선택 처리
function selectQuizOption(el, quizId) {
  if (el.disabled) return;
  const options = document.querySelectorAll('[data-quiz="' + quizId + '"]');
  const isCorrect = el.getAttribute('data-answer') === 'true';

  // 모든 보기 비활성화
  options.forEach(opt => {
    opt.disabled = true;
    opt.setAttribute('aria-checked', 'false');
    if (opt.getAttribute('data-answer') === 'true') opt.classList.add('correct');
  });
  el.setAttribute('aria-checked', 'true');
  if (!isCorrect) el.classList.add('wrong');

  // 피드백 표시 (textContent로 설정 — XSS 방지)
  const feedback = document.getElementById('quizFeedback-' + quizId);
  if (feedback) {
    feedback.style.display = 'block';
    feedback.classList.add(isCorrect ? 'correct-fb' : 'wrong-fb');
    // textContent 사용: 동적 텍스트는 항상 textContent로 삽입
    feedback.querySelector('.feedback-text').textContent =
      isCorrect ? '✅ 정답입니다!' : '❌ 틀렸습니다. 정답을 확인하세요.';
  }
}

// O/X 퀴즈 선택 처리
function selectOX(el, quizId) {
  if (el.disabled) return;
  const options = document.querySelectorAll('[data-quiz="' + quizId + '"]');
  const isCorrect = el.getAttribute('data-answer') === 'true';

  options.forEach(opt => {
    opt.disabled = true;
    if (opt.getAttribute('data-answer') === 'true') opt.classList.add('correct');
  });
  if (!isCorrect) el.classList.add('wrong');

  const feedback = document.getElementById('quizFeedback-' + quizId);
  if (feedback) {
    feedback.style.display = 'block';
    feedback.classList.add(isCorrect ? 'correct-fb' : 'wrong-fb');
    feedback.querySelector('.feedback-text').textContent =
      isCorrect ? '✅ 정답입니다!' : '❌ 틀렸습니다!';
  }
}
```

---

## 타이머/카운트다운

> 활동 시간 안내용. 교실 활동, 모둠 토론, 발표 시간 제한 등에 활용합니다.

### HTML

```html
<!-- 플로팅 타이머: 모든 슬라이드 위에 고정 -->
<div id="floatTimer" class="float-timer" role="timer"
     aria-label="활동 타이머" style="display:none;">
  <div class="timer-icon" aria-hidden="true">⏱</div>
  <div class="timer-display" id="timerDisplay" aria-live="polite">05:00</div>
  <div class="timer-controls">
    <button class="timer-btn" onclick="startTimer()" aria-label="타이머 시작">▶</button>
    <button class="timer-btn" onclick="pauseTimer()" aria-label="일시정지">⏸</button>
    <button class="timer-btn" onclick="resetTimer()" aria-label="초기화">↺</button>
    <button class="timer-btn" onclick="hideTimer()" aria-label="닫기">✕</button>
  </div>
  <!-- SVG 원형 진행률 링 -->
  <svg class="timer-ring" viewBox="0 0 36 36" aria-hidden="true">
    <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--gray-200)" stroke-width="2"/>
    <circle id="timerRing" cx="18" cy="18" r="15.9" fill="none"
            stroke="var(--main)" stroke-width="2.5"
            stroke-dasharray="100 0" stroke-dashoffset="25"
            stroke-linecap="round"
            style="transition:stroke-dasharray 1s linear;
                   transform:rotate(-90deg); transform-origin:50% 50%;"/>
  </svg>
</div>

<!-- 네비바 타이머 버튼 (nav-bar 내 삽입) -->
<button onclick="showTimer(300)" class="nav-btn" aria-label="5분 타이머"
        style="margin-left:0.3rem; font-size:0;">
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
  </svg>
</button>
```

### CSS

```css
.float-timer {
  position: fixed; bottom: 3.5rem; right: 1rem;
  background: rgba(255,255,255,0.97);
  border: 2px solid var(--main); border-radius: 1rem;
  padding: 0.8rem 1rem; z-index: 1000;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  display: flex; flex-direction: column; align-items: center; gap: 0.3rem;
  min-width: 7rem; will-change: transform;
}
.timer-icon { font-size: 1.2rem; }
.timer-display {
  font-size: 1.8rem; font-weight: 900; color: var(--main);
  font-variant-numeric: tabular-nums; /* 숫자 너비 고정 — 흔들림 방지 */
  line-height: 1; letter-spacing: 0.05em;
}
.timer-display.warning { color: #ff9800; }
.timer-display.danger  { color: #e53935; }
.timer-display.blink   { animation: blink 0.5s step-end infinite; }
@keyframes blink { 50% { opacity: 0; } }

.timer-controls { display: flex; gap: 0.3rem; }
.timer-btn {
  background: var(--light); border: 1px solid var(--gray-200);
  border-radius: 0.4rem; padding: 0.25rem 0.5rem;
  cursor: pointer; font-size: 0.85rem; font-family: inherit;
  transition: background 0.15s;
}
.timer-btn:hover { background: var(--main); color: white; }
.timer-btn:focus-visible { outline: 2px solid var(--main); outline-offset: 2px; }

.timer-ring {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 100%; height: 100%;
  pointer-events: none; opacity: 0.2;
}
```

### JavaScript

```javascript
// 타이머 상태 변수
let timerTotal = 300;
let timerLeft = 300;
let timerInterval = null;
let timerRunning = false;

function showTimer(seconds) {
  timerTotal = seconds;
  timerLeft = seconds;
  timerRunning = false;
  updateTimerDisplay();
  document.getElementById('floatTimer').style.display = 'flex';
}

function hideTimer() {
  pauseTimer();
  document.getElementById('floatTimer').style.display = 'none';
}

function startTimer() {
  if (timerRunning || timerLeft <= 0) return;
  timerRunning = true;
  timerInterval = setInterval(() => {
    timerLeft--;
    updateTimerDisplay();
    if (timerLeft <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      timerFinished();
    }
  }, 1000);
}

function pauseTimer() {
  timerRunning = false;
  clearInterval(timerInterval);
}

function resetTimer() {
  pauseTimer();
  timerLeft = timerTotal;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const min = String(Math.floor(timerLeft / 60)).padStart(2, '0');
  const sec = String(timerLeft % 60).padStart(2, '0');
  const disp = document.getElementById('timerDisplay');
  if (!disp) return;
  // textContent 사용 — 순수 텍스트
  disp.textContent = min + ':' + sec;

  disp.classList.remove('warning', 'danger', 'blink');
  if (timerLeft <= 10)      disp.classList.add('danger', 'blink');
  else if (timerLeft <= 30) disp.classList.add('warning');

  // SVG 링 진행률 업데이트
  const ring = document.getElementById('timerRing');
  if (ring && timerTotal > 0) {
    const pct = (timerLeft / timerTotal) * 100;
    ring.setAttribute('stroke-dasharray', pct + ' ' + (100 - pct));
  }
}

function timerFinished() {
  const disp = document.getElementById('timerDisplay');
  if (disp) { disp.textContent = '00:00'; disp.classList.add('danger'); }
}
```

---

## 코드 구문 강조 (프로그래밍 수업용)

> 외부 CDN 없이 인라인으로 구현. Python, JavaScript, HTML 기본 토크나이저.
> 교육용 시각화 목적 — 완전한 파서가 아닙니다.

### HTML

```html
<!-- 코드 블록 슬라이드 예시 -->
<div class="browser-content code-slide">
  <h2>파이썬 기초: 변수와 자료형</h2>

  <div class="code-block" data-lang="python" role="region"
       aria-label="Python 코드 예시">
    <!-- 상단바: 언어 표시 + 복사 버튼 -->
    <div class="code-topbar">
      <span class="code-lang-badge">Python</span>
      <button class="code-copy-btn" data-copy-target="code1"
              onclick="copyCode('code1', this)" aria-label="코드 복사">복사</button>
    </div>
    <!-- 코드는 pre/code 태그 내 정적 텍스트로 작성
         JS 강조기가 data-highlight 속성을 보고 처리 -->
    <pre class="code-pre"><code id="code1" data-highlight="python"># 변수 선언
name = "홍길동"   # 문자열
age  = 17         # 정수
score = 98.5      # 실수
is_student = True # 불리언

print(f"이름: {name}, 나이: {age}")</code></pre>
  </div>

  <!-- 실행 결과 박스 -->
  <div class="code-output" role="region" aria-label="실행 결과">
    <span class="output-label" aria-hidden="true">▶ 출력</span>
    <pre class="output-content">이름: 홍길동, 나이: 17</pre>
  </div>
</div>
```

### CSS

```css
.code-block {
  border-radius: 0.6rem; overflow: hidden;
  border: 1.5px solid var(--gray-200);
  background: #1e1e2e; margin: 0.5rem 0;
}
.code-topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.4rem 0.8rem;
  background: #2a2a3e; border-bottom: 1px solid #3a3a5a;
}
.code-lang-badge {
  font-size: 0.78rem; font-weight: 700;
  color: #a0a0c0; letter-spacing: 0.05em; text-transform: uppercase;
}
.code-copy-btn {
  font-size: 0.78rem; padding: 0.2rem 0.6rem;
  background: #3a3a5a; border: 1px solid #5a5a7a;
  border-radius: 0.3rem; color: #c0c0d8; cursor: pointer;
  font-family: inherit; transition: background 0.15s;
}
.code-copy-btn:hover { background: #4a4a6a; color: #fff; }
.code-copy-btn.copied { background: #2d5a3d; border-color: #3aaa5c; color: #3aaa5c; }
.code-copy-btn:focus-visible { outline: 2px solid #7c4dff; outline-offset: 2px; }

.code-pre {
  margin: 0; padding: 0.8rem 1rem;
  overflow-x: auto; background: transparent;
}
.code-pre code {
  font-family: 'Consolas', 'D2Coding', 'Nanum Gothic Coding', monospace;
  font-size: 0.88rem; line-height: 1.65; color: #cdd6f4;
  tab-size: 4; white-space: pre; display: block;
}

/* 구문 강조 토큰 — Catppuccin Mocha 색상 */
.tok-kw      { color: #cba6f7; font-weight: 600; } /* 키워드 */
.tok-str     { color: #a6e3a1; }                   /* 문자열 */
.tok-num     { color: #fab387; }                   /* 숫자 */
.tok-cmt     { color: #6c7086; font-style: italic; } /* 주석 */
.tok-fn      { color: #89b4fa; }                   /* 함수명 */
.tok-builtin { color: #f38ba8; }                   /* 내장 함수 */
.tok-bool    { color: #fab387; font-weight: 600; } /* True/False/None */
.tok-attr    { color: #f9e2af; }                   /* HTML 속성 */
.tok-tag     { color: #f38ba8; }                   /* HTML 태그 */
.tok-op      { color: #89dceb; }                   /* 연산자 */

/* 실행 결과 */
.code-output {
  border-radius: 0.5rem; overflow: hidden;
  border: 1.5px solid rgba(58,170,92,0.25);
  background: #0d1b0f; margin-top: 0.4rem;
}
.output-label {
  display: block; padding: 0.3rem 0.8rem;
  background: #1a3a22; color: #3aaa5c;
  font-size: 0.78rem; font-weight: 700;
  border-bottom: 1px solid rgba(58,170,92,0.18);
}
.output-content {
  margin: 0; padding: 0.6rem 1rem;
  font-family: 'Consolas', 'D2Coding', monospace;
  font-size: 0.88rem; color: #a6e3a1; line-height: 1.5;
}

@media (max-width: 768px) {
  .code-pre code, .output-content { font-size: 0.82rem; }
}
```

### JavaScript (인라인 구문 강조기)

```javascript
// 인라인 구문 강조기 — Python / JavaScript / HTML 지원
// 보안 설계:
//   1. el.textContent 로 원본 텍스트를 읽음 (이미 안전한 순수 텍스트)
//   2. escapeHtml()로 HTML 특수문자를 먼저 이스케이프
//   3. 이후 오직 허용된 span 태그와 클래스명만 추가
//   4. 결과를 el.innerHTML 에 할당 — 외부/사용자 입력이 절대 포함되지 않음

(function initSyntaxHighlight() {
  // 안전한 HTML 이스케이프 (먼저 실행)
  function escapeHtml(s) {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // 허용된 클래스명만 사용하는 span 래퍼
  const ALLOWED_CLASSES = ['kw','str','num','cmt','fn','builtin','bool','tag','attr','op'];
  function span(cls, text) {
    if (!ALLOWED_CLASSES.includes(cls)) return text; // 방어 코드
    return '<span class="tok-' + cls + '">' + text + '</span>';
  }

  // Python 강조 (escapeHtml 결과물에만 적용)
  function highlightPython(raw) {
    let s = escapeHtml(raw);
    // 주석: # 이후 줄 끝까지
    s = s.replace(/(#[^\n]*)/g, span('cmt', '$1'));
    // 문자열: f"..." f'...' "..." '...' (이미 이스케이프된 상태)
    s = s.replace(/(f?&quot;[^&]*&quot;|f?'[^']*')/g, span('str', '$1'));
    // 숫자
    s = s.replace(/\b(\d+\.?\d*)\b/g, span('num', '$1'));
    // 내장 함수
    s = s.replace(/\b(print|len|range|int|float|str|bool|list|dict|tuple|set|input|type|isinstance|enumerate|zip|map|filter|sorted|sum|min|max|abs|round)\b/g,
      function(m) { return span('builtin', m); });
    // True / False / None
    s = s.replace(/\b(True|False|None)\b/g, function(m) { return span('bool', m); });
    // 키워드
    s = s.replace(/\b(def|class|if|elif|else|for|while|return|import|from|as|in|not|and|or|is|pass|break|continue|lambda|try|except|finally|with|yield|global|nonlocal|del|raise|assert)\b/g,
      function(m) { return span('kw', m); });
    return s;
  }

  // JavaScript 강조
  function highlightJS(raw) {
    let s = escapeHtml(raw);
    s = s.replace(/(\/\/[^\n]*)/g, span('cmt', '$1'));
    s = s.replace(/(\/\*[\s\S]*?\*\/)/g, span('cmt', '$1'));
    s = s.replace(/(&quot;[^&]*&quot;|'[^']*'|`[^`]*`)/g, span('str', '$1'));
    s = s.replace(/\b(\d+\.?\d*)\b/g, span('num', '$1'));
    s = s.replace(/\b(console|document|window|Array|Object|String|Number|Boolean|Math|JSON|Promise|fetch|setTimeout|setInterval|clearInterval|parseInt|parseFloat)\b/g,
      function(m) { return span('builtin', m); });
    s = s.replace(/\b(true|false|null|undefined)\b/g, function(m) { return span('bool', m); });
    s = s.replace(/\b(const|let|var|function|return|if|else|for|while|class|new|this|typeof|instanceof|import|export|default|from|async|await|try|catch|finally|throw|switch|case|break|continue|of|in|do)\b/g,
      function(m) { return span('kw', m); });
    return s;
  }

  // HTML 강조
  function highlightHTML(raw) {
    let s = escapeHtml(raw);
    s = s.replace(/(&lt;!--[\s\S]*?--&gt;)/g, span('cmt', '$1'));
    s = s.replace(/(&lt;\/?)([\w-]+)/g, function(m, bracket, tag) {
      return bracket + span('tag', tag);
    });
    s = s.replace(/\s([\w-]+)=/g, function(m, attr) {
      return ' ' + span('attr', attr) + '=';
    });
    s = s.replace(/=(&quot;[^&]*&quot;)/g, function(m, val) {
      return '=' + span('str', val);
    });
    return s;
  }

  // data-highlight 속성이 있는 code 요소에 자동 적용
  document.querySelectorAll('code[data-highlight]').forEach(function(el) {
    var lang = el.getAttribute('data-highlight');
    var raw = el.textContent; // 순수 텍스트로 읽기
    var result = '';
    if (lang === 'python')           result = highlightPython(raw);
    else if (lang === 'js' || lang === 'javascript') result = highlightJS(raw);
    else if (lang === 'html')        result = highlightHTML(raw);
    else                             result = escapeHtml(raw);
    // 위 함수들은 항상 escapeHtml()을 먼저 적용하고
    // 허용된 span 태그만 추가하므로 안전함
    el.innerHTML = result;
  });
})();

// 코드 복사 (id로 대상 지정)
function copyCode(targetId, btn) {
  var el = document.getElementById(targetId);
  if (!el) return;
  // textContent로 순수 텍스트 복사 (강조 태그 제외)
  navigator.clipboard.writeText(el.textContent).then(function() {
    btn.textContent = '복사됨!';
    btn.classList.add('copied');
    setTimeout(function() {
      btn.textContent = '복사';
      btn.classList.remove('copied');
    }, 2000);
  });
}
```

---

## 학생 참여 요소

> 손들기 카운터, 간단한 투표. 모두 인라인 구현. 외부 의존성 없음.

### 손들기 카운터

```html
<!-- 손들기 카운터 위젯 (플로팅) -->
<div id="handCounter" class="hand-counter-widget" role="region"
     aria-label="손들기 카운터" style="display:none;">
  <div class="hand-counter-display">
    <span class="hand-icon" aria-hidden="true">✋</span>
    <!-- textContent로만 숫자 표시 -->
    <span class="hand-count" id="handCount" aria-live="polite"
          aria-label="손든 학생 수">0</span>
  </div>
  <div class="hand-controls">
    <button onclick="addHand(1)"  class="hand-btn" aria-label="+1명">+1</button>
    <button onclick="addHand(5)"  class="hand-btn" aria-label="+5명">+5</button>
    <button onclick="resetHands()" class="hand-btn" aria-label="초기화">↺</button>
    <button onclick="toggleHandCounter()" class="hand-btn" aria-label="닫기">✕</button>
  </div>
  <div class="hand-progress" role="progressbar"
       aria-valuenow="0" aria-valuemin="0" aria-valuemax="30"
       aria-label="참여율">
    <div class="hand-progress-fill" id="handProgressFill"></div>
  </div>
  <span class="hand-goal-label" id="handGoalLabel" aria-live="polite">0 / 30명</span>
</div>
```

```css
.hand-counter-widget {
  position: fixed; bottom: 3.5rem; left: 1rem;
  background: rgba(255,255,255,0.97);
  border: 2px solid var(--main); border-radius: 1rem;
  padding: 0.7rem 0.9rem; z-index: 1000;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  display: flex; flex-direction: column; align-items: center; gap: 0.35rem;
  min-width: 8rem;
}
.hand-counter-display { display: flex; align-items: center; gap: 0.4rem; }
.hand-icon { font-size: 1.4rem; }
.hand-count {
  font-size: 2rem; font-weight: 900; color: var(--main);
  font-variant-numeric: tabular-nums; line-height: 1;
}
.hand-controls { display: flex; gap: 0.3rem; }
.hand-btn {
  padding: 0.25rem 0.5rem; border-radius: 0.4rem;
  border: 1.5px solid var(--gray-200); background: var(--light);
  cursor: pointer; font-size: 0.85rem; font-family: inherit;
  transition: all 0.15s;
}
.hand-btn:hover { background: var(--main); color: white; border-color: var(--main); }
.hand-btn:focus-visible { outline: 2px solid var(--main); outline-offset: 2px; }
.hand-progress {
  width: 100%; height: 6px; background: var(--gray-200);
  border-radius: 3px; overflow: hidden;
}
.hand-progress-fill {
  height: 100%; background: var(--main); border-radius: 3px;
  transition: width 0.3s ease; will-change: width;
}
.hand-goal-label { font-size: 0.78rem; color: var(--gray-600); }
```

```javascript
var handCount = 0;
var HAND_GOAL = 30; // 학급 인원으로 변경

function toggleHandCounter() {
  var w = document.getElementById('handCounter');
  if (!w) return;
  var visible = w.style.display !== 'none';
  w.style.display = visible ? 'none' : 'flex';
}

function addHand(n) {
  handCount = Math.min(handCount + n, HAND_GOAL);
  updateHandDisplay();
}

function resetHands() {
  handCount = 0;
  updateHandDisplay();
}

function updateHandDisplay() {
  var countEl = document.getElementById('handCount');
  var fillEl  = document.getElementById('handProgressFill');
  var labelEl = document.getElementById('handGoalLabel');
  var progEl  = document.querySelector('.hand-progress');

  // 모두 textContent 사용
  if (countEl) countEl.textContent = handCount;
  if (labelEl) labelEl.textContent = handCount + ' / ' + HAND_GOAL + '명';

  var pct = (handCount / HAND_GOAL) * 100;
  if (fillEl) {
    fillEl.style.width = pct + '%';
    fillEl.style.background = handCount >= HAND_GOAL ? '#3aaa5c' : 'var(--main)';
  }
  if (progEl) progEl.setAttribute('aria-valuenow', handCount);
}
```

### 간단한 투표 (선택형)

```html
<!-- 투표 슬라이드 -->
<div class="browser-content poll-slide">
  <div class="poll-header">
    <span class="badge badge-green">📊 투표</span>
    <h2 class="poll-question" id="pollQ-1">
      가장 배우고 싶은 프로그래밍 언어는?
    </h2>
  </div>
  <div class="poll-options" id="pollOptions-1" role="radiogroup"
       aria-labelledby="pollQ-1">
    <!-- data-poll: 투표 그룹 ID, data-label: 선택지 텍스트 -->
    <button class="poll-option" data-poll="1" data-label="Python"
            onclick="votePoll(this, 1)" aria-label="Python에 투표">
      <span class="poll-emoji" aria-hidden="true">🐍</span>
      <span class="poll-label">Python</span>
      <span class="poll-bar-wrap"><span class="poll-bar" style="width:0%"></span></span>
      <span class="poll-pct" aria-live="polite">0%</span>
    </button>
    <button class="poll-option" data-poll="1" data-label="JavaScript"
            onclick="votePoll(this, 1)" aria-label="JavaScript에 투표">
      <span class="poll-emoji" aria-hidden="true">🌐</span>
      <span class="poll-label">JavaScript</span>
      <span class="poll-bar-wrap"><span class="poll-bar" style="width:0%"></span></span>
      <span class="poll-pct" aria-live="polite">0%</span>
    </button>
    <button class="poll-option" data-poll="1" data-label="Java"
            onclick="votePoll(this, 1)" aria-label="Java에 투표">
      <span class="poll-emoji" aria-hidden="true">☕</span>
      <span class="poll-label">Java</span>
      <span class="poll-bar-wrap"><span class="poll-bar" style="width:0%"></span></span>
      <span class="poll-pct" aria-live="polite">0%</span>
    </button>
  </div>
  <p class="poll-total" id="pollTotal-1" aria-live="polite">총 0표</p>
  <button class="poll-reset-btn" onclick="resetPoll(1)">초기화</button>
</div>
```

```css
.poll-slide { display: flex; flex-direction: column; gap: 0.8rem; }
.poll-question { font-size: 1.1rem; font-weight: 700; line-height: 1.4; }

.poll-options { display: flex; flex-direction: column; gap: 0.4rem; }
.poll-option {
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.6rem 0.8rem; border-radius: 0.5rem;
  border: 2px solid var(--gray-200); background: var(--white);
  cursor: pointer; font-family: inherit; text-align: left;
  transition: border-color 0.15s; flex-wrap: wrap;
}
.poll-option:hover:not(:disabled) { border-color: var(--main); }
.poll-option:focus-visible { outline: 3px solid var(--main); outline-offset: 2px; }
.poll-option.voted   { border-color: var(--main); background: var(--light); }
.poll-option.leading { border-color: #3aaa5c; }
.poll-option:disabled { cursor: default; }
.poll-emoji { font-size: 1rem; }
.poll-label { font-size: 0.95rem; font-weight: 600; flex: 1; }
.poll-bar-wrap {
  flex-basis: 100%; height: 5px;
  background: var(--gray-200); border-radius: 3px; overflow: hidden;
}
.poll-bar {
  height: 100%; background: var(--main); border-radius: 3px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: width;
}
.poll-option.leading .poll-bar { background: #3aaa5c; }
.poll-pct { font-size: 0.82rem; font-weight: 700; color: var(--gray-600); min-width: 2.5rem; text-align: right; }
.poll-total { font-size: 0.85rem; color: var(--gray-600); text-align: right; }
.poll-reset-btn {
  align-self: flex-end; font-size: 0.82rem;
  padding: 0.25rem 0.6rem; border-radius: 0.4rem;
  border: 1px solid var(--gray-200); background: var(--light);
  cursor: pointer; font-family: inherit; transition: background 0.15s;
}
.poll-reset-btn:hover { background: var(--gray-200); }
.poll-reset-btn:focus-visible { outline: 2px solid var(--main); outline-offset: 2px; }
```

```javascript
// 투표 데이터 저장소
var pollData = {};

function votePoll(el, pollId) {
  if (el.disabled) return;
  var label = el.getAttribute('data-label');
  if (!pollData[pollId]) pollData[pollId] = {};
  pollData[pollId][label] = (pollData[pollId][label] || 0) + 1;

  // 같은 그룹의 모든 버튼 비활성화 (1인 1표)
  document.querySelectorAll('[data-poll="' + pollId + '"]').forEach(function(opt) {
    opt.disabled = true;
  });
  el.classList.add('voted');
  updatePollDisplay(pollId);
}

function updatePollDisplay(pollId) {
  var opts = document.querySelectorAll('[data-poll="' + pollId + '"]');
  var data = pollData[pollId] || {};
  var total = Object.values(data).reduce(function(a, b) { return a + b; }, 0);
  var maxCount = Math.max.apply(null, Object.values(data).concat([1]));

  opts.forEach(function(opt) {
    var label = opt.getAttribute('data-label');
    var count = data[label] || 0;
    var pct = total > 0 ? Math.round((count / total) * 100) : 0;

    var bar   = opt.querySelector('.poll-bar');
    var pctEl = opt.querySelector('.poll-pct');
    if (bar)   bar.style.width = pct + '%';
    // textContent로 퍼센트 표시
    if (pctEl) pctEl.textContent = pct + '%';
    opt.classList.toggle('leading', count === maxCount && count > 0);
  });

  var totalEl = document.getElementById('pollTotal-' + pollId);
  // textContent로 총 투표 수 표시
  if (totalEl) totalEl.textContent = '총 ' + total + '표';
}

function resetPoll(pollId) {
  pollData[pollId] = {};
  document.querySelectorAll('[data-poll="' + pollId + '"]').forEach(function(opt) {
    opt.disabled = false;
    opt.classList.remove('voted', 'leading');
    var bar   = opt.querySelector('.poll-bar');
    var pctEl = opt.querySelector('.poll-pct');
    if (bar)   bar.style.width = '0%';
    if (pctEl) pctEl.textContent = '0%';
  });
  var totalEl = document.getElementById('pollTotal-' + pollId);
  if (totalEl) totalEl.textContent = '총 0표';
}
```

---

## 애니메이션 프리셋 (선택적)

```css
/* 기본 등장 */
@keyframes popUp {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* 크기 확대 등장 */
@keyframes scaleUp {
  from { opacity: 0; transform: scale(0.9); }
  to   { opacity: 1; transform: scale(1); }
}

/* 원근감 틸트 등장 */
@keyframes tiltIn {
  from { opacity: 0; transform: perspective(600px) rotateX(-5deg); }
  to   { opacity: 1; transform: perspective(600px) rotateX(0); }
}

/* 왼쪽 슬라이드 인 */
@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-30px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* 위에서 낙하 */
@keyframes dropIn {
  from { opacity: 0; transform: translateY(-20px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* 스태거 애니메이션: 자식 요소 순차 등장
   JS에서 각 자식에 style="--delay: Xs" 주입 */
.stagger-item {
  opacity: 0;
  animation: popUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) both;
  animation-delay: var(--delay, 0s);
}

/* 활성 슬라이드에서만 실행 (비활성 슬라이드 CPU 낭비 방지) */
.slide.active .stagger-item { animation-play-state: running; }
.slide:not(.active) .stagger-item { animation-play-state: paused; }

/* 통계 숫자 등장 */
@keyframes countUp {
  from { opacity: 0; transform: translateY(15px); }
  to   { opacity: 1; transform: translateY(0); }
}
.stat-number {
  animation: countUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) both;
  animation-delay: var(--delay, 0s);
}

/* 진행 바 채우기 */
@keyframes barFill {
  from { width: 0%; }
  to   { width: var(--target-width, 100%); }
}
.animated-bar {
  animation: barFill 0.8s cubic-bezier(0.4, 0, 0.2, 1) both;
  animation-delay: var(--delay, 0.2s);
}

/* 동작 감소 모드: 모든 애니메이션 비활성화 */
@media (prefers-reduced-motion: reduce) {
  .stagger-item, .stat-number, .animated-bar {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
    width: var(--target-width, 100%) !important;
  }
}
```

### 스태거 JavaScript 유틸

```javascript
// 슬라이드 로드 시 스태거 딜레이 자동 설정
document.querySelectorAll('.slide').forEach(function(slide) {
  slide.querySelectorAll('.stagger-item').forEach(function(el, i) {
    el.style.setProperty('--delay', (i * 0.08) + 's');
  });
});

// 슬라이드 재방문 시 스태거 재실행
function resetStagger(slideEl) {
  slideEl.querySelectorAll('.stagger-item').forEach(function(el) {
    el.style.animation = 'none';
    el.offsetHeight; // 강제 리플로우로 애니메이션 재시작
    el.style.animation = '';
  });
}
// 사용: goToSlide() 내에서 resetStagger(slides[index]) 호출
```
