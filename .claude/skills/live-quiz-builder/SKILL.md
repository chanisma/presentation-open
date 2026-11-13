---
name: live-quiz-builder
description: 수업에 실시간 참여 문항(객관식/OX/주관식/워드클라우드/출구티켓/코드실습)을 붙이는 스킬. 권장 방식은 수업 폴더의 quiz.json 파일 — 덱 HTML 무수정으로 문항을 관리한다. "실시간 퀴즈 넣어줘", "라이브 투표", "멘티미터처럼", "학생 참여", "quiz.json", "라이브 문항", "실시간 OX", "라이브 세션" 등을 언급하거나 수업에 학생 실시간 참여 기능을 붙일 때 사용.
---

# Live Quiz Builder — 라이브 문항 저작 (quiz.json 중심)

**문항 선정 원칙 (2026-08-26 사용자 지정)**: 라이브 문항은 중요한 개념의 확인이나
개념을 설명하기 위한 발문에 주로 쓴다. 활동지에서 답하게 되는 질문은 라이브 문항으로
내지 않는다 — 같은 질문을 두 번 시키게 된다. 이 이상 세칙화하지 않는다.

수업에 학생 실시간 참여 문항을 붙인다. **권장 방식은 `<수업폴더>/quiz.json`** — 덱 HTML을
건드리지 않고 문항을 관리하며, 덱에 전용 퀴즈 슬라이드가 없어도 어느 슬라이드에서든 열 수 있다.
백엔드는 `app/` 레이어(Supabase RPC + broadcast)가 처리한다.

## 아키텍처 요약

```
<수업폴더>/quiz.json ──┐ (권장: 문항 정의 파일)
덱 data-live 마크업 ──┴─ live/runtime/live.js — 병합 (같은 id는 quiz.json 우선)
                             │
덱(?live=CODE&host=1) — 미니바: 현재 슬라이드 문항 버튼 + [문항 ▾] 전체 목록
학생: live/join/?code=CODE — 문항 응답 → 실시간 집계   │ Supabase RPC (lp_*)
교사 콘솔: live/host/ — 세션 생성·QR·덱 문항 미리보기/바로 열기·즉석 문항·내보내기
```

- 세션 생성은 교사 콘솔(`?app=host`)에서. 비밀구절 없음(v10에서 기능 삭제 — 세션 조작은 host_token 게이트). 뷰어 카드의 [▶ 발표 시작]이 콘솔에 덱을 프리필한다.
- 덱 로드 경로: **Contract v1 덱**(deck.js)은 자동, **legacy 덱**은 opt-in 스크립트 1줄. `?live=` 없이 열면 100% 기존 동작.
- 문항은 콘솔에서도 열 수 있으므로 **덱 없이 quiz.json + 콘솔만으로 수업 진행 가능**.

**설명 방식 (2026-09-16)**: 질문·선지·해설(`explanation`·`misconceptions`)은 `eli5`
스킬의 원칙을 따른다. 선지에는 정식 용어를 쓰고(용어 원칙), 해설은 "왜 그 답이
맞는가"를 한 문장으로 먼저 말한 뒤 오답이 왜 끌리는지를 덧붙인다. 지문에 새 용어를
넣어야 하면 그 자리에서 풀이한다.

## 문항 설계 원칙

- 수업 흐름 상 개념 체크 지점(오개념이 갈리는 곳)에 배치한다. 무작정 마지막에 몰지 말 것.
- choice: 오답 선택지는 실제 오개념에서 도출하고 `misconceptions` 라벨을 단다
- choice/ox + `"peerInstruction": true`: 오개념이 첨예하게 갈리는 핵심 문항 1~2개에만 (투표→토론→재투표, 5분+ 소요)
- 스피드 퀴즈(gamification)는 **문항이 아니라 세션 단위 설정** — 콘솔 세션 생성 시 '⚡ 스피드 퀴즈 세션' 체크.
  정답 있는 choice/ox가 자동 점수 대상(서버 계산: 정답 500 + 속도 보너스 1등 +500, 순위당 −50, 최소 +50),
  결과 공개 화면에 세션 누적 탑5 리더보드가 항상 표시됨. quiz.json의 문항 gamify 필드는 무시된다
- ox: 흔한 오개념 명제를 그대로 제시 / short: 열린 질문 / wordcloud: 한 단어 반응
- exit: 출구티켓(이해도 1~5 + 한마디) — `"slide": "last"` 권장
- code: 코드 실습(컴퓨터실) — python(브라우저 내 Pyodide 채점)·web(iframe 미리보기), 재제출 허용, [제출 코드]로 우수작 송출.
  `solution`(모범 답안) 지정 시 호스트 결과 오버레이에 모범 답안 + 모든 테스트 통과 학생 코드가 함께 표시(학생에겐 비전송)
- 기명(학번) 수집은 콘솔에서 세션 생성 시 "기명" 선택 (문항 정의 변경 불필요)

## 절차 A — quiz.json (권장)

1. `<수업폴더>/quiz.json` 작성 — 전체 스키마는 `references/live-markup.md`:
   ```json
   { "version": 1, "activities": [
       { "id": "q1-dns", "slide": 6, "kind": "choice", "prompt": "…", "options": ["…"], "answer": 1 },
       { "id": "exit", "slide": "last", "kind": "exit", "prompt": "오늘 수업을 마무리하며" } ] }
   ```
   - `slide`: 0-base 숫자 | `"last"` | 생략(비귀속 — [문항 ▾]/콘솔에서만 열기)
   - `id` = DB slide_key (재열기 idempotency 기준) — 세션에서 한 번 쓴 뒤 변경 금지
   - **네이티브 React 덱도 같은 자리**(deck.tsx 옆). 단 URL(`?deck=<id>`)에 폴더가
     없으므로 경로를 두 곳에 등록해야 찾는다 — `src/decks/registry.tsx`의 `quizJson`
     (React 허브·콘솔)과 pages.json 항목의 `quizJson`(클래식 콘솔). **두 값은 같게.**
2. **검증 (BLOCKING)**: `python .claude/skills/live-quiz-builder/scripts/validate_live_config.py <수업폴더>`
3. pages.json 등록/갱신 시 `--live` 플래그 → 허브 카드에 QUIZ 배지
4. 수동 확인: 콘솔에서 세션 생성(덱 선택 시 문항 미리보기 표시) → 호스트 모드 덱 미니바 [문항 ▾]
   또는 콘솔 '덱 문항'에서 열기 → join에서 응답 → 공개

## 절차 B — 덱 마크업 (문항을 슬라이드 화면에 크게 보여줄 때)

문항을 **프로젝터 슬라이드에도 시각적으로 렌더**하고 싶을 때만 data-live 슬라이드를 삽입한다
(라이브 미사용 시 정적 퀴즈 슬라이드 겸용). quiz.json과 병행 시 같은 id는 quiz.json이 우선.

1. `references/live-markup.md`의 "덱 마크업" 규약대로 `.slide` 삽입
   (필수: `data-live="quiz"`, 고유 `data-live-id`, `script.live-config` JSON, `.live-stage` 정적 폴백 —
   폴백은 그 덱의 디자인 언어를 재사용해 이질감 없게)
2. legacy 덱(인라인 네비)이면 `</body>` 직전 opt-in 1줄 (Contract v1 덱은 불필요):
   ```html
   <script type="module" src="../../../live/runtime/live.js?v=2"></script>
   ```
   상대경로 깊이 주의 — `data/<그룹>/<과목>/<주제>/`는 `../../../../`, `test/<주제>/`는 `../../`
3. 검증·확인은 절차 A의 2~4와 동일 (검증기에 덱 경로 또는 폴더 전달)

## 세션 결과 → 구글 시트 아카이빙

세션 데이터(참여자·문항·응답)는 Supabase에 저장되며, 교사 콘솔에서 **활동지와 같은 스프레드시트**로 아카이빙할 수 있다.

- 흐름: 콘솔 [시트에 저장] 또는 [세션 종료](자동) → `lp_export_session` → `live/runtime/archive.js`가 읽기 쉬운 형태로 변환 → 정보 과목 공용 Apps Script(`source: 'live_session_archive'`) POST → 탭 3개(`라이브_세션`/`라이브_문항`/`라이브_응답`)에 기록
- **같은 세션코드를 다시 저장하면 덮어쓴다** (idempotent) — 세션 진행 중에도, 종료 후 콘솔 '최근 세션 → 열기'로도 재저장 가능
- 전송은 `Content-Type: text/plain` 단순 요청 — no-cors와 달리 **응답을 읽을 수 있어 저장 성공/실패가 확인됨** (기존 활동지에도 역이식 가능한 패턴)
- GAS 측 코드: 각 과목 폴더의 `live-archive.js` (`apps-script.js` doPost가 `source: 'live_session_archive'`를 위임). 수정 후 배포: clasp 자동배포 훅(.clasp.json 있는 폴더) 또는 `npx @google/clasp push && npx @google/clasp update-deployment <배포ID>` (URL 유지)
- 아카이브 대상 선택: 콘솔에서 세션 만들 때 '결과 저장 시트'를 과목별 아카이브 중 선택 — 후보는 `live/archives.json` (`node scripts/scan-archives.mjs`로 재생성, 덱 선택 시 해당 과목 자동 매칭). 미선택(구버전 세션) 폴백은 `live/runtime/config.js`의 `appsScriptUrl`

## 문항 컨트롤 3동사 (미니바·콘솔 공통)

**문항 열기 → 결과 공개 → 문항 닫기** — 녹색 버튼이 항상 다음 단계다. 별도의 '마감' 단계는 없다.

- **문항 열기**: 문항 화면을 교사(덱 모달)·학생 화면에 띄운다. 열려 있는 동안만 학생이 문항을 보고 제출할 수 있다
- **결과 공개**: 결과 화면(집계·정답 포함)을 교사·학생 화면에 띄운다. 제출은 잠긴다
- **문항 닫기**: 문항/결과 화면을 **교사·학생 양쪽에서 없앤다** (open·revealed 어느 상태에서든)
- 닫은 뒤: 한 번 공개했던 문항이면 [결과 보기(호스트만)]·[다시 공개], 아니면 [결과 공개]가 노출된다 (`revealed_at` 기준). [다시 열기]는 제출을 다시 받는 재개 — 공개 이력이 리셋된다 (기존 응답은 유지)
- 교사 콘솔에서 조작해도 브로드캐스트로 덱 미니바의 문항/결과 모달이 함께 동기화된다

## 주의사항

- **정답은 quiz.json/덱 소스(공개 URL)에 포함된다** → 수업 중 형성평가 전용, 성적 반영 평가 금지.
  (학생 화면으로 가는 데이터에서는 서버가 정답·misconceptions를 제거함)
- 문항 id(slide_key)는 한 번 세션에서 사용한 뒤 바꾸면 다른 문항으로 취급된다(집계 분리).
- 미니바 버튼은 클릭 후 자동 blur — 덱 키보드 네비게이션과 충돌하지 않는다.
- 세션 생성은 v10부터 항상 개방 (비밀구절 기능 삭제 — 잠금이 다시 필요하면 새 마이그레이션으로 게이트를 재도입해야 한다).

## 파일 위치

- 공통 컨트롤러: `live/runtime/deck.js` (Contract v1) · 라이브 레이어: `live/runtime/live.js`
- 런타임: `live/runtime/` (driver.js, drivers/, charts.js, host-overlay.js, archive.js, code-runner.js)
- 교사 콘솔: `live/host/index.html` · 학생 참여: `live/join/index.html`
- DB 스키마: `supabase/migrations/20260716_*.sql` (테이블 5종 + lp_* RPC)
- 문항 규약: `references/live-markup.md` · 레퍼런스 예시: `data/dev/테스트 수업 자료/동적씬-버블정렬/quiz.json`

## 마무리 — 프롬프트 기록 (모든 덱·활동지 작업 공통)

작업을 끝내기 직전, 사용자가 이 자료를 위해 입력한 프롬프트를 자료 폴더의 `prompts.md`에
**전문 그대로** 덧붙인다. 형식과 제외 규칙은 `.claude/rules/prompt-log.md`. 최초 요청이면
머리글에 이 스킬 이름을 적는다 (`· /<스킬명>`). 첨부 이미지는 세션 id와 순번만.
