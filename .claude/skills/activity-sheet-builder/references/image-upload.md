# 이미지 첨부 구현 패턴

활동지에서 학생이 사진(스케치, 회로 사진, 결과물 캡처 등)을 첨부하고 구글 드라이브에 저장하는 패턴.

---

## HTML — 이미지 업로드 필드

```html
<div class="field">
  <label>결과물 사진 첨부 <span class="field-hint">(선택, 최대 5MB)</span></label>
  <div class="image-upload-area" id="imageUploadArea">
    <input type="file" id="imageInput" accept="image/*" capture="environment">
    <div class="image-upload-placeholder" id="imagePlaceholder">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
      </svg>
      <span>클릭하거나 사진을 끌어다 놓으세요</span>
      <span class="field-hint">JPG, PNG, GIF, WEBP — 최대 5MB</span>
    </div>
    <img id="imagePreview" alt="첨부 이미지 미리보기"
         onerror="this.style.display='none'; document.getElementById('imagePlaceholder').style.display='flex';">
  </div>
  <button type="button" class="btn btn-ghost btn-sm" id="btnRemoveImage" style="display:none;">
    × 이미지 제거
  </button>
</div>
```

---

## CSS — 업로드 영역

```css
.image-upload-area {
  position: relative; border: 2px dashed var(--glass-border);
  border-radius: 0.8rem; overflow: hidden; cursor: pointer;
  transition: border-color 0.2s;
  min-height: 140px; display: flex; align-items: center; justify-content: center;
}
.image-upload-area:hover { border-color: var(--primary); }
.image-upload-area.drag-over { border-color: var(--accent); background: rgba(103,232,249,0.06); }

.image-upload-area input[type="file"] {
  position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%;
}
.image-upload-placeholder {
  display: flex; flex-direction: column; align-items: center; gap: 0.4rem;
  color: var(--text-sub); font-size: 0.88rem; padding: 1.5rem;
  pointer-events: none;
}
.image-upload-placeholder svg { width: 2.5rem; height: 2.5rem; opacity: 0.5; }

#imagePreview {
  display: none; width: 100%; max-height: 280px;
  object-fit: contain; padding: 0.5rem;
}

.field-hint { font-size: 0.78rem; color: var(--text-sub); }
.btn-sm { font-size: 0.82rem; padding: 0.3rem 0.7rem; margin-top: 0.3rem; }
```

---

## JavaScript — 이미지 처리

```javascript
var imageBase64 = null; // 전역 변수로 base64 저장

/* ─── 이미지 선택/드래그 처리 ─── */
document.getElementById('imageInput').addEventListener('change', function(e) {
  handleImageFile(e.target.files[0]);
});

var uploadArea = document.getElementById('imageUploadArea');
uploadArea.addEventListener('dragover', function(e) {
  e.preventDefault();
  uploadArea.classList.add('drag-over');
});
uploadArea.addEventListener('dragleave', function() {
  uploadArea.classList.remove('drag-over');
});
uploadArea.addEventListener('drop', function(e) {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');
  var file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) handleImageFile(file);
});

document.getElementById('btnRemoveImage').addEventListener('click', function() {
  imageBase64 = null;
  document.getElementById('imagePreview').style.display = 'none';
  document.getElementById('imagePlaceholder').style.display = 'flex';
  document.getElementById('imageInput').value = '';
  this.style.display = 'none';
});

function handleImageFile(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast('이미지 파일만 첨부할 수 있습니다.', 'error');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast('파일 크기가 5MB를 초과합니다.', 'error');
    return;
  }

  var reader = new FileReader();
  reader.onload = function(e) {
    imageBase64 = e.target.result; // "data:image/png;base64,..." 형태
    var preview = document.getElementById('imagePreview');
    preview.src = imageBase64;
    preview.style.display = 'block';
    document.getElementById('imagePlaceholder').style.display = 'none';
    document.getElementById('btnRemoveImage').style.display = 'inline-flex';
  };
  reader.readAsDataURL(file);
}
```

---

## getFormData에 이미지 포함

```javascript
function getFormData() {
  return {
    // ... 기존 필드들 ...
    imageBase64: imageBase64 || null   // null이면 Apps Script에서 무시
  };
}
```

---

## TXT에 이미지 정보 포함

```javascript
function buildTxt(data) {
  var lines = [];
  // ... 기존 내용 ...
  lines.push('');
  lines.push('【 첨부 이미지 】');
  if (data.imageBase64) {
    lines.push('이미지 첨부됨 (구글 시트에서 드라이브 링크 확인)');
  } else {
    lines.push('첨부 없음');
  }
  return lines.join('\n');
}
```

---

## Apps Script — 이미지 저장 (apps-script-template.md 참조)

`apps-script-template.md`의 "이미지 포함 템플릿" 섹션에서 `saveImageToDrive()` 함수를 가져온다.

### 저장 폴더 지정 (선택)

특정 드라이브 폴더에 정리하고 싶을 때:

```javascript
// Google Drive에서 폴더 ID 확인: 폴더 열기 → URL의 마지막 부분
var FOLDER_ID = "1xxxxxxxxxxxxxxxxxxxxxxxxxxx";

function saveImageToDrive(base64String, prefix) {
  var match = base64String.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return "";
  var mimeType = match[1];
  var ext = mimeType.split("/")[1];
  var blob = Utilities.newBlob(
    Utilities.base64Decode(match[2]),
    mimeType,
    prefix + "_" + new Date().getTime() + "." + ext
  );
  var folder = DriveApp.getFolderById(FOLDER_ID);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}
```

---

## 주의사항

- **base64 크기**: 5MB 이미지 → base64 약 6.7MB. Apps Script의 단일 요청 크기 제한(50MB)은 충분하지만, 학교 Wi-Fi에서 큰 이미지는 전송이 느릴 수 있다.
- **모바일 최적화**: `capture="environment"` 속성을 추가하면 모바일에서 카메라가 직접 실행된다.
- **이미지 압축 (선택)**: 큰 이미지를 압축해서 보내려면 `<canvas>`로 리사이즈 후 base64 변환한다.

```javascript
function resizeAndEncode(file, maxWidth, maxHeight, quality, callback) {
  var img = new Image();
  var url = URL.createObjectURL(file);
  img.onload = function() {
    var scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
    var canvas = document.createElement('canvas');
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    callback(canvas.toDataURL('image/jpeg', quality));
  };
  img.src = url;
}

// 사용 예시: 최대 1200×900, 품질 0.85
resizeAndEncode(file, 1200, 900, 0.85, function(base64) {
  imageBase64 = base64;
  // 미리보기 업데이트
});
```
