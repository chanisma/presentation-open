# HTML 템플릿 — Deck Contract 기반 미니멀 이미지 덱

NotebookLM 덱의 index.html은 **콘텐츠(.slide 이미지들)만 갖는다.**
자체 헤더/푸터/네비 크롬(ribbon·corner-note·nav 버튼·index 패널·진행바)은 만들지 않는다:

- **허브에서 열 때** (`/?legacy=data/…/index.html`): 레거시 뷰어의 진짜 bolt 엔진이
  독·레일·그리드·주석·프레젠터 등 모든 크롬과 페이지 넘김을 소유한다.
  iframe에는 `?chrome=0`이 붙어 덱 자체 크롬이 억제된다.
- **단독으로 열 때** (원본 URL 직접 접속): `live/runtime/deck.js`(Deck Contract v1)가
  진행바·하단 네비·키보드/휠·해시 딥링크를 자동 주입한다. `?chrome=0`이면 스스로 빠진다.
- **라이브**: `?live=` 감지 시 deck.js가 live.js를 동적 로드 — 문항은 `<수업폴더>/quiz.json`.

모든 텍스트는 PNG 안에 이미 구워져 있으므로 웹폰트도 필요 없다.

## HTML 파일 골격 (전체)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script>if(!location.pathname.endsWith('/')&&!location.pathname.endsWith('.html')){var b=document.createElement('base');b.href=location.pathname+'/';document.head.appendChild(b);}</script>
<title>__TITLE__</title>
<style>
  :root{
    --paper:__PAPER__;        /* 스타일별 종이색 — style-<스타일>.md 참조 */
    --dk-accent:__ACCENT__;   /* deck.js 진행바 색 */
  }
  html,body{height:100%;overflow:hidden;background:var(--paper);}
  .slide{display:flex;align-items:center;justify-content:center;background:var(--paper);}
  .slide img{width:100%;height:100%;object-fit:contain;display:block;user-select:none;-webkit-user-drag:none;}
</style>
</head>
<body data-deck-title="__TITLE_SHORT__" data-subject="__SUBJECT__">
<script>
  const TOTAL = __TOTAL__;
  for (let i = 1; i <= TOTAL; i++) {
    const num = String(i).padStart(2, '0');
    const sec = document.createElement('section');
    sec.className = 'slide';
    const img = document.createElement('img');
    img.src = 'images/slide-' + num + '.png';
    img.alt = '슬라이드 ' + i;
    img.loading = i <= 2 ? 'eager' : 'lazy';
    sec.appendChild(img);
    document.body.appendChild(sec);
  }
</script>
<script type="module" src="../../../../live/runtime/deck.js?v=1"></script>
</body>
</html>
```

## 치환 변수 요약

| 변수 | 예시 | 비고 |
|------|------|------|
| `__TITLE__` | `반복문 — 고등학생 파이썬 입문` | `<title>` |
| `__TITLE_SHORT__` | `반복문` | deck.js 하단 네비 제목 칩 |
| `__SUBJECT__` | `정보` | 과목 칩 |
| `__PAPER__` | Whiteboard `#F4F5F6` / Etching `#F7F7F4` / Critter `#FDFDFB` | 레터박스 배경 |
| `__ACCENT__` | Whiteboard `#1E5BD0` / Etching `#1F1F1F` / Critter `#3E9C93` | 진행바 색 |
| `__TOTAL__` | `13` | 실제 PNG 페이지 수 |

**deck.js 상대경로는 폴더 깊이에 맞춘다**: `data/2026-1/정보/<주제>/index.html`(4단)이면
`../../../../live/runtime/deck.js?v=1`, `data/<그룹>/<과목>/<수업>/`(4단)이면 `../../../../…`.
루트에서 서빙되므로 깊이만 세면 된다.

## 인터랙션 (deck.js 제공 — 코드 복사 없음)

- `←`/`→`/`Space`/`PageUp`/`PageDown`/`Home`/`End` 키보드, 마우스 휠, `#N` 해시 딥링크
- 진행바 + 하단 네비 필(제목·과목·카운터·화살표), bolt 크롬(독/그리드)은 chrome.js가 추가
- 인쇄 시 크롬 자동 숨김, `?chrome=0`(뷰어 iframe)에서 전체 크롬 억제

## (레거시) 자기완결 인라인 크롬 골격

2026-07 이전 덱(조건문·반복문·변수와 함수·입력함수·자료형과연산자·수학정보·정보네트워크)은
ribbon 푸터·corner-note·index 패널·인라인 네비 JS(~100줄)를 각 파일에 복제한 자기완결
구조다. **신규 제작에는 사용하지 않는다** — 뷰어가 같은 기능을 더 잘 제공하며, 인라인 크롬은
`?chrome=0`을 인식하지 못해 뷰어 안에서 이중 크롬으로 겹쳐 보인다.
기존 덱을 고칠 일이 있으면 해당 수업 폴더의 index.html을 직접 참조할 것
(예: `data/2026-1/정보/조건문/index.html`). 기존 덱은 그대로 두어도 뷰어와 호환된다
(`.slide`/`.slide.active` 규약만 지키면 됨).
