# 라이브 코드 에디터 레퍼런스

> 이 파일은 프레젠테이션에 실시간 코드 편집 + 적용 기능을 추가할 때 참조합니다.
> 두 가지 모드가 있습니다: **인라인 에디터** (설명 슬라이드용)와 **탭 에디터** (실습 슬라이드용).

---

## 1. 인라인 에디터 (설명 슬라이드 코드 블록)

설명 슬라이드의 `.code-block` 요소를 편집 가능한 textarea로 자동 변환하고, 수정하면 같은 셀/슬라이드의 요소에 CSS가 즉시 적용됩니다.

### 동작 원리

1. 페이지 로드 시 JS가 모든 `.code-block`을 `<textarea class="code-block-textarea">`로 교체
2. 각 textarea에 대응하는 `<style id="live-css-N">` 요소를 `<head>`에 생성
3. textarea 입력(input) 이벤트 발생 시:
   - **속성만 있는 코드** (`font-size: 24px;`) → 부모 셀(`[data-live="N"]`)에 CSS 적용
   - **셀렉터 포함 코드** (`.card:hover { ... }`) → 해당 슬라이드에 스코핑 적용
4. 슬라이드별로 제외 가능 (`data-slide` 값으로 필터링)

### 필수 CSS

```css
/* 인라인 편집 가능 코드 블록 */
.code-block-wrap { position: relative; }
.code-block-textarea {
  display: block; width: 100%; resize: none; border: none;
  background: var(--style-primary); color: #E8E8E8;
  border-radius: 0.6rem; padding: 0.55rem 0.8rem;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 0.8rem; line-height: 1.55;
  outline: none; tab-size: 2; white-space: pre;
  overflow: hidden; min-height: 1.8rem;
}
.code-block-textarea:focus {
  box-shadow: inset 0 0 0 2px var(--style-accent3);
}
```

### 필수 JS

```javascript
// 제외할 슬라이드 목록 (data-slide 값)
var excludeSlides = ['2']; // 예: 슬라이드 3(Google Fonts)은 HTML이라 제외

var liveCodeIndex = 0;
document.querySelectorAll('.code-block').forEach(function(block) {
  // 탭 에디터 내부 코드 블록은 건너뜀
  if (block.closest('.editor-container')) return;

  // 제외 슬라이드 확인
  var parentSlide = block.closest('.slide');
  if (parentSlide && excludeSlides.includes(parentSlide.getAttribute('data-slide'))) return;

  var idx = liveCodeIndex++;
  var text = block.textContent;

  // 부모 셀에 타겟 ID 부여
  var cell = block.closest('.bento-cell') || block.closest('.col-box') || block.closest('.browser-content');
  if (cell) cell.setAttribute('data-live', idx);

  // 동적 CSS 주입용 <style> 생성
  var liveStyle = document.createElement('style');
  liveStyle.id = 'live-css-' + idx;
  document.head.appendChild(liveStyle);

  // textarea로 교체
  var wrap = document.createElement('div');
  wrap.className = 'code-block-wrap';
  var textarea = document.createElement('textarea');
  textarea.className = 'code-block-textarea';
  textarea.value = text;
  textarea.spellcheck = false;
  textarea.setAttribute('data-live-idx', idx);

  // 실시간 적용
  textarea.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
    var code = this.value.trim();
    if (!code) { liveStyle.textContent = ''; return; }
    if (code.indexOf('{') !== -1) {
      // 셀렉터 포함 → 슬라이드에 스코핑
      var slideAttr = parentSlide ? parentSlide.getAttribute('data-slide') : '0';
      liveStyle.textContent = code.replace(/([^{]+)\{/g, function(m, sel) {
        return '[data-slide="' + slideAttr + '"] ' + sel.trim() + ' {';
      });
    } else {
      // 속성만 → 부모 셀에 적용
      liveStyle.textContent = '[data-live="' + idx + '"] { ' + code + ' }';
    }
  });

  wrap.appendChild(textarea);
  block.replaceWith(wrap);
  textarea.style.height = textarea.scrollHeight + 'px';
});
```

### 키보드/휠 네비게이션 차단

코드 편집 중 슬라이드가 넘어가지 않도록 반드시 아래 가드를 추가해야 합니다:

```javascript
// 키보드: textarea에서는 슬라이드 이동 차단
document.addEventListener('keydown', (e) => {
  if (e.target === slideInput || e.target.tagName === 'TEXTAREA') return;
  // ... 기존 네비게이션 로직
});

// 마우스 휠: 에디터 영역에서는 슬라이드 이동 차단
document.addEventListener('wheel', (e) => {
  if (e.target.tagName === 'TEXTAREA'
    || e.target.closest('.editor-container')
    || e.target.closest('.code-block-wrap')) return;
  e.preventDefault();
  // ... 기존 휠 로직
}, { passive: false });
```

### 데모 텍스트 가이드

코드 변경 효과를 보이려면 같은 셀에 **데모 텍스트**가 있어야 합니다:

| 속성 | 데모 텍스트 요구사항 |
|------|---------------------|
| `font-size` | 한 줄 텍스트면 충분 |
| `font-weight` | 한 줄 텍스트면 충분 |
| `line-height` | **3줄 이상** (줄 간격 변화가 보여야 함) — `<br>` 태그로 줄바꿈 |
| `letter-spacing` | 한 줄 텍스트면 충분 (한글 추천) |
| `color`, `background-color` | 배경/텍스트 색이 변하므로 별도 데모 불필요 |
| `border-radius`, `box-shadow` | 시각적 데모 박스 필요 (`.demo-box` 등) |
| `:hover` 등 의사 클래스 | 인터랙티브 데모 요소 필요 (`.demo-hover-card` 등) |

---

## 2. 탭 에디터 (실습 슬라이드용)

실습 전용 슬라이드에 탭 전환이 가능한 풀 에디터(textarea + iframe 미리보기)를 제공합니다.

### 구조

```
[탭 바: 폰트 & 색상 | 둥글기 & 그림자 | hover 효과]
┌──────────────────┬──────────────────┐
│   textarea       │   iframe         │
│   (코드 편집)     │   (실시간 미리보기) │
└──────────────────┴──────────────────┘
```

### 필수 CSS

```css
.editor-container {
  display: flex; border-radius: 0.6rem; overflow: hidden;
  border: 1px solid #E0E0E0; height: 100%; min-height: 280px;
}
.editor-pane {
  flex: 1; display: flex; flex-direction: column;
  background: #1e1e1e; min-width: 0;
}
.pane-title {
  background: #2d2d2d; color: #d4d4d4; font-size: 0.8rem;
  padding: 0.25rem 0.8rem; font-family: 'Consolas', monospace;
  border-bottom: 1px solid #1e1e1e; flex-shrink: 0;
}
.code-editor {
  flex: 1; width: 100%; resize: none; border: none;
  background: transparent; color: #d4d4d4;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 0.8rem; padding: 0.6rem; outline: none;
  line-height: 1.5; tab-size: 2; white-space: pre; overflow: auto;
}
.preview-pane {
  flex: 1; background: #fff; position: relative;
  min-width: 0; border-left: 1px solid #E0E0E0;
}
.pane-title--preview {
  background: #F0F0F0; color: var(--style-text);
  border-bottom: 1px solid #E0E0E0;
}
.code-preview { width: 100%; height: 100%; border: none; }

/* 탭 바 */
.editor-tabs {
  display: flex; gap: 0; background: var(--style-primary);
  border-radius: 0.6rem 0.6rem 0 0; overflow: hidden;
}
.editor-tab {
  padding: 0.35rem 0.8rem; font-size: 0.8rem; font-weight: 600;
  cursor: pointer; border: none; background: transparent;
  color: rgba(255,255,255,0.5); transition: all 0.2s;
}
.editor-tab.active {
  background: var(--style-accent3); color: var(--style-primary);
}
.editor-tab:hover:not(.active) {
  background: rgba(255,255,255,0.1); color: #fff;
}
```

### HTML 구조

```html
<!-- 탭 바 -->
<div class="editor-tabs" role="tablist">
  <button class="editor-tab active" data-editor-tab="1">탭 1</button>
  <button class="editor-tab" data-editor-tab="2">탭 2</button>
  <button class="editor-tab" data-editor-tab="3">탭 3</button>
</div>

<!-- 에디터 패널 (탭당 하나) -->
<div class="editor-container" id="editorPanel-1" style="display:flex;">
  <div class="editor-pane">
    <div class="pane-title">index.html</div>
    <textarea class="code-editor" id="code-1" data-id="1" spellcheck="false"></textarea>
  </div>
  <div class="preview-pane">
    <div class="pane-title pane-title--preview">미리보기</div>
    <iframe class="code-preview" id="preview-1" title="코드 미리보기 1"></iframe>
  </div>
</div>
<!-- 나머지 패널: display:none -->
```

### 필수 JS

```javascript
// 에디터 기본 코드 (완전한 HTML 문서)
var editorDefaults = {
  1: '<!DOCTYPE html>...',  // 각 탭의 초기 코드
  2: '<!DOCTYPE html>...',
  3: '<!DOCTYPE html>...'
};

// 미리보기 업데이트 (srcdoc 사용 — 안전)
function updatePreview(id) {
  var editor = document.getElementById('code-' + id);
  var iframe = document.getElementById('preview-' + id);
  if (!editor || !iframe) return;
  iframe.srcdoc = editor.value;
}

// Input + Tab 키 지원
document.querySelectorAll('.code-editor').forEach(function(editor) {
  editor.addEventListener('input', function(e) {
    updatePreview(e.target.getAttribute('data-id'));
  });
  editor.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      var start = this.selectionStart;
      var end = this.selectionEnd;
      this.value = this.value.substring(0, start) + '  ' + this.value.substring(end);
      this.selectionStart = this.selectionEnd = start + 2;
      updatePreview(this.getAttribute('data-id'));
    }
  });
});

// 초기화
Object.keys(editorDefaults).forEach(function(id) {
  var editor = document.getElementById('code-' + id);
  if (editor) { editor.value = editorDefaults[id]; updatePreview(id); }
});

// 탭 전환
document.querySelectorAll('.editor-tab').forEach(function(tab) {
  tab.addEventListener('click', function() {
    var tabId = this.getAttribute('data-editor-tab');
    document.querySelectorAll('.editor-tab').forEach(function(t) {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    this.classList.add('active');
    this.setAttribute('aria-selected', 'true');
    document.querySelectorAll('[id^="editorPanel-"]').forEach(function(p) {
      p.style.display = 'none';
    });
    var panel = document.getElementById('editorPanel-' + tabId);
    if (panel) panel.style.display = 'flex';
  });
});
```

### 탭 에디터 기본 코드 작성 가이드

각 탭의 `editorDefaults`는 **완전한 HTML 문서**여야 합니다 (iframe의 `srcdoc`에 주입되므로):

```javascript
editorDefaults = {
  1: '<!DOCTYPE html>\n<html lang="ko">\n<head>\n  <meta charset="UTF-8">\n  <style>\n    /* 여기에 CSS */\n  </style>\n</head>\n<body>\n  <!-- 여기에 HTML -->\n</body>\n</html>'
};
```

**팁:**
- 학생들이 바꿀 부분에 주석을 달아주세요 (`/* 값을 바꿔보세요! */`)
- 한 탭에 너무 많은 코드를 넣지 마세요 (20~40줄 적당)
- Google Fonts를 사용하려면 `<link>` 태그를 head에 포함하세요

---

## 적용 체크리스트

프레젠테이션에 라이브 코드 에디터를 추가할 때:

- [ ] 인라인 에디터 CSS (`.code-block-wrap`, `.code-block-textarea`) 추가
- [ ] 탭 에디터 CSS (`.editor-container`, `.editor-pane`, `.code-editor` 등) 추가 (실습 슬라이드 사용 시)
- [ ] 키보드 가드: `e.target.tagName === 'TEXTAREA'` 체크 추가
- [ ] 마우스 휠 가드: `.editor-container`, `.code-block-wrap` 영역 체크 추가
- [ ] 제외할 슬라이드 설정 (HTML 코드 등 CSS가 아닌 슬라이드)
- [ ] 데모 텍스트 추가 (font-size, line-height 등 변화가 보여야 하는 속성)
- [ ] `editorDefaults` 작성 (탭 에디터용, 완전한 HTML 문서)
