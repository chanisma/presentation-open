# 라이브 문항 규약 — quiz.json(권장) + 덱 마크업(legacy/시각 강화)

## quiz.json (권장) — <수업폴더>/quiz.json

```json
{
  "version": 1,
  "activities": [
    { "id": "q1-first-step", "slide": 6, "kind": "choice",
      "prompt": "…", "options": ["…"], "answer": 1,
      "misconceptions": { "0": "…" }, "peerInstruction": false },
    { "id": "practice", "kind": "code", "language": "python",
      "starter": "def f(n):\n    return 0",
      "tests": [{ "call": "f(5)", "expected": "15" }] },
    { "id": "exit", "slide": "last", "kind": "exit", "prompt": "오늘 수업을 마무리하며" }
  ]
}
```

- `id` (필수): 문항 식별자 = DB `slide_key`. 재열기 idempotency 기준 — 세션 사용 후 변경 금지
- `slide`: **0-base** 슬라이드 인덱스 | `"last"` | 생략. 귀속 문항은 해당 슬라이드에서 미니바
  컨텍스트 버튼으로, 비귀속 문항은 미니바 [문항 ▾] 목록/콘솔에서 연다
- 나머지 필드는 아래 kind별 스키마와 동일 (kind·prompt + 유형별 config)
- 덱 마크업과 병행 시 **같은 id는 quiz.json이 우선**
- 정답이 quiz.json(공개 URL)에 있으므로 덱 내장과 동일하게 **형성평가 전용**

## 덱 마크업 (legacy / 문항을 슬라이드 화면에 크게 보여줄 때)

### 슬라이드 골격

```html
<div class="slide" data-slide="live-q1" data-live="quiz" data-live-id="q1-first-step">
  <script type="application/json" class="live-config">
  { ...문항 정의(아래 스키마)... }
  </script>
  <!-- 정적 폴백: 라이브 미연결 시에도 일반 퀴즈 슬라이드로 보임. 덱의 기존 스타일 재사용 -->
  <div class="browser-card 또는 덱의 카드 클래스">
    <div class="... live-stage">문항을 시각적으로 렌더</div>
  </div>
</div>
```

- `data-live="quiz"` — live.js가 이 슬라이드를 라이브 문항으로 인식
- `data-live-id` — 문항 식별자(덱 내 고유, kebab-case). DB의 `slide_key`가 되어
  같은 세션에서 재열기 시 동일 문항으로 idempotent 처리된다. 생략 시 `s<슬라이드인덱스>-<kind>` 자동 생성
  (슬라이드 순서를 바꾸면 식별자가 변하므로 **명시를 권장**)
- `script.live-config` — 반드시 `type="application/json"` (브라우저가 실행하지 않는 데이터 블록)
- 덱 네비게이션 JS는 인덱스 기반이므로 `data-slide` 값은 자유 문자열 가능

## live-config JSON 스키마

공통 필드:

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `kind` | `"choice"` \| `"ox"` \| `"short"` | ✅ | 문항 유형 (Phase 3: wordcloud/exit, Phase 5: code) |
| `prompt` | string | ✅ | 문항 텍스트 (학생 화면에 그대로 표시) |
| `misconceptions` | object | — | 오답 키 → 오개념 라벨 (교사 진단용, 학생에게 비노출) |
| `peerInstruction` | boolean | — | Phase 3: 2라운드 투표 |

### choice
```json
{
  "kind": "choice",
  "prompt": "주소창에 naver.com을 입력하고 Enter를 눌렀다. 가장 먼저 일어나는 일은?",
  "options": ["보기1", "보기2", "보기3", "보기4"],
  "answer": 1,
  "misconceptions": { "0": "…라고 생각", "2": "…라고 생각" }
}
```
- `options`: 2~6개. `answer`: 정답 인덱스(0-base), **생략하면 투표(정답 없음) 모드**
- `misconceptions` 키는 오답 인덱스 문자열

### ox
```json
{ "kind": "ox", "prompt": "HTML은 디자인을 담당하는 언어다.", "answer": false }
```
- `answer`: boolean, 생략 가능(찬반 투표)

### short
```json
{ "kind": "short", "prompt": "오늘 배운 내용 중 가장 기억에 남는 한 가지는?" }
```
- 자동 채점 없음. 학생 입력은 localStorage에 자동 임시저장

### wordcloud
```json
{ "kind": "wordcloud", "prompt": "오늘 수업을 한 단어로 표현하면?" }
```
- 학생은 짧은 단어/구절(30자) 1개 제출. 공개 화면에서 빈도가 높을수록 크게 표시

### exit (출구티켓)
```json
{ "kind": "exit", "prompt": "오늘 수업을 마무리하며" }
```
- 이해도 별점(1~5) 필수 + 선생님께 한마디(선택). 공개 시 평균·분포 + 한마디 목록
- 수업 마지막 슬라이드에 배치하는 것을 권장

### code (코드 작성 — 컴퓨터실 전제)
```json
{
  "kind": "code",
  "prompt": "1부터 n까지의 합을 구하는 sum_to(n)을 완성하세요.",
  "language": "python",
  "starter": "def sum_to(n):\n    return 0",
  "tests": [
    { "call": "sum_to(5)", "expected": "15" },
    { "call": "sum_to(10)", "expected": "55" }
  ],
  "solution": "def sum_to(n):\n    return n * (n + 1) // 2"
}
```
- `language`: `"python"` (Pyodide/WASM — 브라우저 안에서 실행·채점) 또는 `"web"` (HTML/CSS/JS — iframe 샌드박스 미리보기, 자동 채점 없음)
- `tests`(python 전용): 학생 코드 실행 후 `str(call)` 결과 문자열을 `expected`와 비교. 표현식 기반으로 작성
- `solution`(선택): 모범 답안 — **호스트 결과 화면 전용**. 서버가 answer처럼 학생 전송 config에서 제거
- **재제출 허용** — 제출해도 계속 고쳐서 다시 낼 수 있고 최신 제출로 갱신됨 (반복 개선 장려)
- 교사: 미니바/콘솔의 [제출 코드]로 학생 코드를 열람하고 우수작을 프로젝터에 크게 띄울 수 있음
- 공개 시 **학생**에게는 통과 개수 히스토그램 + **테스트케이스별 통과율**(어느 케이스에서 막히는지),
  **호스트** 결과 오버레이에는 여기에 더해 **모범 답안 + 모든 테스트를 통과한 학생 코드 목록**이 표시
- Pyodide는 최초 1회 ~10MB CDN 로드 — **수업 시작 전 참여 페이지를 미리 열어두게 안내** (무한 루프는 10초 타임아웃으로 차단)

### 스피드 퀴즈 (gamification) — 세션 단위 설정
문항 필드가 아니다 — **교사 콘솔에서 세션 생성 시 '⚡ 스피드 퀴즈 세션'을 체크**하면 세션 전체에 적용된다.
- gamify 세션에서는 **정답(answer)이 있는 choice/ox 문항이 자동으로 점수 대상**
- 점수는 **서버가 계산**(클라이언트 변조 불가): 정답 기본 500점 + 속도 보너스.
  보너스는 정답 제출 순위 기반 — 1등 +500, 이후 순위마다 −50, 최소 +50 (1등 1000 · 2등 950 · … · 11등부터 550)
- 오답·정답 없는 문항 0점. code 문항은 재제출이 허용되므로 점수 제외
- 점수 대상 문항의 학생 화면에 "⚡ 스피드 퀴즈" 배너 표시,
  **[결과 공개] 화면에는 항상 세션 누적 탑5 리더보드**가 학생·호스트·콘솔에 표시됨 (동점이면 먼저 제출한 쪽이 위)
- quiz.json 문항에 `gamify` 필드를 넣으면 무시된다 (검증기가 경고)

### Peer Instruction (2라운드 투표) — choice/ox 전용
```json
{ "kind": "choice", "prompt": "...", "options": [...], "answer": 1, "peerInstruction": true }
```
- 흐름: **1차 투표** → 미니바 [토론 후 2차 투표 →] (1차 자동 마감) → 짝 토론 → **2차 투표** → [결과 공개] 시 1·2차 분포 비교 차트 (정답 수렴 시각화)
- 학생 2차 화면에는 "2차 투표" 배너와 본인의 1차 선택이 표시됨
- 라운드는 서버가 결정하므로 학생이 조작 불가. 1인 1응답은 라운드별로 적용

## 정적 폴백(.live-stage) 작성 지침

- 라이브 미사용 수업에서도 이 슬라이드가 자연스러운 퀴즈 슬라이드로 기능해야 한다
- **해당 덱의 디자인 언어를 그대로 재사용**: CSS 변수, 카드/뱃지 클래스, 이모지 사용 여부까지 덱의 관례를 따른다
- choice는 번호 뱃지 + 보기 카드, ox는 큰 O/X 카드가 기본형
- 정답 표시는 넣지 않는다 (공개는 라이브 오버레이 또는 교사의 구두 설명)

## opt-in 스크립트

```html
<!-- </body> 직전, 덱당 1회 -->
<script type="module" src="../../../live/runtime/live.js?v=2"></script>
```
- 상대경로 깊이 주의: `data/<그룹>/<과목>/<주제>/index.html` → `../../../../`, `test/<주제>/index.html` → `../../`
- `?v=N`은 캐시 무효화 규약 — 런타임 수정 배포 시 N을 올린다. (배포처인 Netlify는 ETag 재검증이라 새 배포가 즉시 반영되지만, 교내망의 투명 캐싱 프록시·브라우저 캐시 대비로 유지)

## 동작 요약 (참고)

- 교사: 콘솔에서 세션 생성 → 저장된 hostToken이 localStorage(`lp.host.<CODE>`)로 덱에 전달됨
  → 덱을 `?live=CODE&host=1`로 열면 미니바 장착
- 문항 상태: `draft → open → closed → revealed` (미니바/콘솔 어느 쪽에서든 제어 가능, 동기화됨)
- 학생 집계는 교사가 [결과 공개]를 누르기 전에는 서버가 반환하지 않는다
