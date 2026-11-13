# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

샘플고등학교 수업 자료 허브. bolt-slides(React 18 + Vite + framer-motion) 덱 엔진을 기반으로 레거시 HTML 덱(65+), 실시간 수업 라이브 레이어(Supabase), 활동지 시스템(Google Apps Script)이 하나의 SPA로 병합되어 있다. Netlify 배포(publish=dist). 모든 콘텐츠·폴더명·커밋은 한국어가 기본.

## 출처와 라이선스 (작업 중 반드시 지킬 것)

이 저장소는 **코드 SPACEKIJUN 교육용 비상업 1.0**(`LICENSE`) + **수업 자료 CC BY-NC-SA 4.0**(`LICENSE-CONTENT.md`)
이중 라이선스다. 외부에서 들어온 것의 상세는 `THIRD-PARTY-NOTICES.md`.
작업 중 걸리는 규칙만 추린다.

- **bolt-slides (MIT)** — `src/deck/`·`src/components/`·`src/styles/base.css`는 상류
  코드다(39개 중 33개가 바이트 단위로 동일). "수정 금지" 규약을 지키면 라이선스도
  같이 지켜진다. `THIRD-PARTY-NOTICES.md`에 MIT 전문이 들어 있으므로 **이 파일을
  지우거나 배포에서 빼지 말 것.**
- **OpenMontage (AGPL-3.0)** — 저장소 밖 도구다. **코드·스킬 문서·컴포지션 소스를 이
  저장소로 복사하지 않는다.** 필름 덱은 렌더된 mp4·poster만 `data/…/media/`로 가져온다.
  복사하는 순간 이 저장소가 AGPL 파생물이 된다.
- **newVideoGen** — 씬 문법·스킬 설계의 원본. 이식한 문서에는 하단의 "원본:" 표기를
  유지한다. 공개 저장소가 아니고 라이선스 표기도 없다.
- **ELI5 (MIT)** — `.claude/skills/eli5/`의 원본([DreambigOu/ELI5](https://github.com/DreambigOu/ELI5)).
  문서만 이식했고 이 저장소 매체에 맞게 변형했다. **스킬 문서의 "원본:" 표기와
  `THIRD-PARTY-NOTICES.md` §4의 MIT 전문을 지우지 말 것.**
- **에셋** — 외부에서 이미지·영상을 가져오면 `assets/manifest.json`에 `origin`과
  `license`(라이선스 · 저작자 · 원본 파일명)를 반드시 채운다. CC BY·CC BY-SA는
  슬라이드에도 출처를 싣는다. 출처를 못 적을 자료는 쓰지 않는다.

## 명령

```bash
npm run dev                  # Vite dev 서버 — 모든 라우트 + data/ 등 정적 자산을 루트에서 직접 서빙
npm run build                # vite build + scripts/build-static.mjs (정적 자산 dist/ 복사)
npm run check                # tsc --noEmit (타입 체크 — lint 없음)
node scripts/classify-pages.mjs   # pages.json type(deck/doc) 자동 분류 — 자료 추가/개편 후 1회 실행 (dev 서버 필요)
node scripts/stamp-created.mjs    # pages.json created(생성일) 스탬프 — 허브가 섹션 내 카드를 최신순 정렬. 자료 추가 후 1회 실행 (git 이력 기반, dev 서버 불필요)
node scripts/scan-archives.mjs    # live/archives.json 재생성 — 교사 콘솔 '결과 저장 시트' 후보 (과목 폴더의 apps-script.js·활동지 URL 스캔, dev 서버 불필요)
node scripts/serve-media.mjs      # 미디어 폴더를 5200 포트로 따로 서빙 (Range) — 보통은 불필요: presenter-media/(gitignore)는 dev 서버가 /presenter-media/로 서빙. 다른 폴더일 때만 + VITE_PRESENTER_BASE

node scripts/check-setup.mjs --net                          # 작업 환경 점검 (clasp·시트·클래스룸 연동 상태) — workspace-setup 스킬의 진단기
node scripts/classroom-post.mjs --courses                  # 내 클래스룸 반 목록 (courseId 확인)
node scripts/classroom-post.mjs "<수업 검색어>" --to <반>  # 수업 링크를 클래스룸에 게시 (--type material|assignment, --due, --dry-run)
```

클래스룸 게시는 Apps Script 웹앱(`docs/apps-script/classroom/`)을 교사 계정으로 경유한다 —
로컬에 구글 인증 없음, 공유 토큰만. 설정은 `.classroom.json`(gitignore, 예시는
`.classroom.example.json`). 링크 생성 규칙은 허브(`src/hub/Hub.tsx`의 `legacyCard`)와
**반드시 동일**해야 하므로 한쪽을 바꾸면 `classroom-post.mjs`의 `pageUrl()`도 같이 고칠 것.
설치 절차는 `docs/apps-script/classroom/README.md`.

### 테스트 (E2E, Playwright 직접 스크립트 — 테스트 러너 없음)

dev 서버를 **포트 5199**로 먼저 기동해야 한다: `npm run dev -- --port 5199`
(또는 `SMOKE_BASE` 환경변수로 대상 변경)

```bash
node test/merge-smoke.mjs                 # 허브·덱·콘솔 스모크
node test/chrome-e2e.mjs                  # 폴백 독 — 레거시/컨트랙트 덱
node test/viewer-e2e.mjs                  # 레거시 뷰어 (진짜 엔진 크롬)
node test/edit-e2e.mjs                    # 로컬 덱 에디터 (실제 파일을 고치고 git으로 복구)
node test/live/native-bridge-e2e.mjs      # 라이브 독 통합 (RPC 스텁)
node test/live/react-live-e2e.mjs         # React host/join 흐름 (RPC 스텁)
node test/live/quiz-e2e.mjs               # 실서버 E2E (classic 대상 — 비밀구절 불필요)
```

개별 테스트는 각 .mjs 파일을 node로 직접 실행한다.

## 아키텍처

### 라우팅 — 쿼리 파라미터 기반 SPA (src/App.tsx)

엔진이 URL 해시(슬라이드 번호 `#7`)와 `?presenter=1`을 소유하므로, 화면 선택은 별도 쿼리 파라미터로 탄다:

- `/` → **학생 참여**(JoinPage) — 사이트 메인. 학생이 세션 코드로 바로 들어온다
- `/hub` → **수업 자료 허브**(Hub) — pages.json(런타임 fetch) + src/decks/registry.tsx 병합 갤러리. `?group=<id>`로 학기 필터 딥링크(`/hub?group=2026-1`). `?app=hub`는 리라이트 없이 닿는 별칭. Netlify 리라이트는 `_redirects` 맨 위 두 줄. **`/data`는 수업 파일 전용 경로 — 허브가 아니다**
- `/?app=edit` → **로컬 덱 에디터**(dev 서버 전용, 웹앱 덱만) — 미리보기에서 글자를 눌러 원본
  파일의 그 문구를 고치고, 요소를 통째로 옮기거나 키우며(자리·크기), 슬라이드 순서·숨김·
  복제·삭제·추가를 하고, quiz.json은 폼으로 편집한다. `?deck=<id>`로 대상을 지정한다.
  슬라이드를 추가하면 자리만 잡고 사용자가 적은 맥락이 수업 폴더의 `slides-plan.md`에 쌓이므로,
  **나중에 그 계획을 읽고 내용을 저작한다.** 워크스루 창을 옮기면 포인터 좌표(`TG21` 등)를
  `measure_pointer.mjs`로 자동으로 다시 재어 고친다. 저장하면 `edits.md`에 기록이 쌓인다.
  상세는 `docs/deck-editor-plan.md`
- `/?deck=<id>` → 네이티브 React 덱 (bolt 엔진)
- `/?legacy=<data/…/index.html>` → 레거시 뷰어 — 진짜 bolt 크롬(독·레일·그리드·주석·프레젠터)이 iframe HTML 덱을 컨트롤
- `/?composite=<data/…/deck.json>` → 컴포지트 덱 — 매니페스트로 타이틀·NotebookLM 이미지·불릿 세그먼트 시퀀싱 (src/composite/)
- `/?app=host` · `/?app=join` → 교사 콘솔 · 학생 참여
- `…&live=<코드>&host=1` → 라이브 호스트 모드 — 덱의 bolt 독 안에 라이브 세그먼트(세션 코드·참여 수·문항 제어·QR) 통합

프레젠터 탭은 `?presenter=1`만 갖고 열리므로 최근 덱/뷰어 경로를 localStorage(`deck:current`, `viewer:legacy`)에서 복구한다.

### 수정 금지 영역

- `src/deck/` — bolt-slides 프레젠테이션 엔진 + 크롬
- `src/styles/base.css` — 엔진 스타일 (테마 토큰은 `src/styles/tokens.css`에서)

### data/ 폴더 구조 — 그룹 > 과목 > 수업

수업 폴더는 **학기·구분 그룹** 아래에 모은다 (2026-08-09 재구성):

```
data/2026-1/{프로그래밍,정보,스팀,인공지능과피지컬컴퓨팅}/<수업>/   # 진행 학기 정규 수업
data/dev/테스트 수업 자료/<수업>/                                   # 데모·실험 (덱 엔진 레퍼런스)
data/AI전문적학습동아리/<수업>/ · data/정보화부/<수업>/             # 연수·부서 (그룹 없음 = etc)
```

그룹은 pages.json 최상위 `groups[]`(id·label·icon·description)에 선언하고 각
subject에 `group: "<id>"`로 건다. 허브 상단 세그먼트가 이 값으로 필터하고
`/hub?group=2026-1` 딥링크가 된다. 그룹 미지정 subject는 `etc`로 떨어진다.

**상대경로 깊이 주의**: 수업 폴더가 한 단계 깊어졌다. `data/<그룹>/<과목>/<수업>/index.html`
에서 루트(live/·assets/·src/)까지는 `../../../../`. 구 링크는 `_redirects` 301로 보존.

### 덱의 다섯 가지 유형

| 유형 | 소스 위치 | 등록 |
|---|---|---|
| 네이티브 React 덱 | `data/<그룹>/<과목>/<수업>/deck.tsx` | `src/decks/registry.tsx` + pages.json에 `path: "index.html?deck=<id>"` |
| 씬(타임라인) 덱 | 위와 같음 — `src/scene`의 `Scene`/`useSceneTime`/`interpolate`/`spring` 사용, 모든 모션은 t(초)의 순수 함수 | 위와 같음 (예시: `?deck=scene-demo`) |
| 필름 덱 | 위와 같음 — 페이지 전체가 미리 구운 mp4 1편. 영상은 `data/…/<수업>/media/`, `src/components/SceneVideo`의 `StepVideo`가 클릭으로 장면을 하나씩 재생 (film-deck-builder 스킬) | 위와 같음 (예시: `?deck=packet-film`, `?deck=jeonju-vox`) |
| 레거시 HTML 덱 | `data/<그룹>/<과목>/<수업>/index.html` | pages.json만 |
| 컴포지트 덱 | `data/<그룹>/<과목>/<수업>/deck.json` — 코드 없이 매니페스트로 세그먼트(타이틀·이미지·불릿·html) 시퀀싱. 스키마는 `src/composite/CompositeDeck.tsx` 상단 주석 | pages.json에 `path: "index.html?composite=<경로>"` (예시: 컴포지트-데모) |

혼합 저작 원칙: 레거시 재사용의 단위는 페이지(iframe)가 아니라 **자산** — NotebookLM 수업 폴더의 `images/slide-NN.png`를 URL로 참조해 `KenBurns`(src/components)로 무대화한다. 페이지 내 혼합(씬×빌드×컴포넌트) 패턴은 `?deck=mixed-demo` 참조.

에셋 규약: 재활용 에셋 레지스트리는 `assets/manifest.json`(asset-library 스킬). 생성 래스터는 두 갈래 — ① 화면 전체를 채우는 **무대/일러스트**(image form·디오라마 무대) ② **디오라마 배우 스프라이트**(배경 투명 크롭 PNG, `assets/sprites/<세트>/`, image-asset-builder 스킬). 사물·기계·도구 같은 장면 소품은 **손그림 일러스트 SVG 직필**(`assets/svg/`, svg-asset-builder 스킬, 덱당 ≤5, 스타일 `clean-hand-illustration`)이되, **인물·생물처럼 비례·해부학이 있는 형태는 SVG로 흉내내지 말고 생성 이미지 크롭**을 쓴다(졸라맨 금지 — scene-grammar §17). NotebookLM 이미지 재사용은 스타일 보수 원칙 — 같은 set/style만 한 덱에. SVG 재사용은 **2세대(manifest `reusable: true`, 2026-09-29 이후 생성)만** 하고, 그대로 붙이지 않고 덱 디자인에 맞는지 판단해 필요하면 팔레트를 바꾼 변형을 만든다. 쓰인 맥락은 manifest `contexts`에 남긴다(판단 재료일 뿐 조건은 아니다). 접속용 URL은 반드시 클릭 가능한 링크로.

영상 자산: 구운 mp4는 수업 폴더 `media/`에 poster jpg와 **쌍으로** 둔다(썸네일·그리드가 poster를 렌더 — 없으면 허브 격자가 영상을 내려받는다). 렌더는 OpenMontage `remotion-composer`(`C:\Users\User\orca\projects\creative_works\OpenMontage`)의 컴포지션, 덱용 재인코딩은 `-g 30`(구간 재생) 또는 `-g 1`(t 스크럽). 클립도 `assets/manifest.json`에 `type: "video"`로 등록해 재사용 조회가 되게 한다. 상세는 film-deck-builder 스킬.

장면 조립 수칙: 씬(scene form)을 저작하기 전 반드시 `.claude/rules/scene-grammar.md`를 Read — Lazy Defaults 거부, 씬당 고유 메타포, 레이아웃 계약, 픽셀 검수가 BLOCKING 규칙이다. 덱의 적은 "무난함" — 요소는 존재 이유를 증명해야 한다.

프롬프트 기록: 덱·활동지·quiz.json을 만들거나 고치는 작업을 끝내기 직전, 사용자가 그 자료를
위해 입력한 프롬프트를 **자료 폴더의 `prompts.md`에 전문 그대로** 덧붙인다
(`.claude/rules/prompt-log.md`). 세션 기록은 지워지지만 이 파일은 자료와 함께 남는다.

편집 기록: 자료 폴더에 **`edits.md`가 있으면 그 자료를 고치기 전에 먼저 읽는다.** 사람이 로컬 덱
에디터(`?app=edit`)로 화면에서 직접 고친 문구·문항·슬라이드 구성이 시간순으로 쌓여 있고,
저장할 때마다 에디터가 자동으로 덧붙인다(`docs/deck-editor-plan.md`). 이 기록에 있는 변경은
그 자료의 상위 원본(`plan.md`·`scene-plan.json`·`script.json`)에는 **반영되어 있지 않다** —
자료를 다시 뽑거나 크게 고칠 때 이 기록을 상위 원본에 먼저 옮겨 놓지 않으면 사용자가 손으로
고친 내용이 사라진다.

만들 슬라이드 계획: 자료 폴더에 **`slides-plan.md`가 있으면 아직 만들지 않은 슬라이드가
있다는 뜻이다.** 사용자가 에디터에서 자리만 잡고 "무엇을 담고 싶은지"를 적어 둔 것이며,
`deck.tsx`에는 `{/* TODO(계획) plan-xxxxx */}` 자리표시가 같은 id로 들어가 있다. 그 맥락을
읽고 형태(form)는 `lesson-deck-planner`로 판단해 저작한 뒤, 자리표시와 계획 항목을 함께
지운다. 사용자가 형태나 구성까지 정해 주지는 않으므로 그 판단은 이쪽 몫이다.

활동지·문서형 자료는 pages.json `type: "doc"` — 허브가 뷰어 없이 원본으로 연다. 분류는 `classify-pages.mjs`가 실제 로드 후 `.slide` 수로 판정한다.

### Vite 모듈 그래프 밖의 정적 자산

`data/`, `live/`, `assets/`, `pages.json` 등은 Vite 번들 밖(프로젝트 루트)에 있다. dev 서버는 루트에서 그대로 서빙하고(`publicDir: false`), 프로덕션은 `scripts/build-static.mjs`의 `TARGETS` 목록대로 dist/에 복사한다. **배포에 포함될 새 루트 자산은 반드시 TARGETS에 추가할 것.** 구 URL은 `_redirects`(Netlify 301)로 보존한다.

### 라이브 레이어 (Supabase)

- 스키마: 공유 Supabase에 `live_presentation_*` 테이블 접두사, **deny-all RLS + `lp_*` SECURITY DEFINER RPC**만 노출. 세션 조작은 host_token 게이트. 세션 생성 비밀구절은 v10에서 **기능 삭제** — 항상 개방.
- 마이그레이션: `supabase/migrations/` 날짜별 SQL(v1~v11). 스키마 변경은 새 마이그레이션 파일 추가.
- 학생 미러 조작(v11): 학생 참여 화면은 교사 덱을 iframe으로 미러링하며 클릭 차단막(`lv-mirror-shield` / `#mirrorShield`)을 덮는다. 교사가 라이브 독·콘솔의 **[🔒/🔓 학생 조작]** 토글로 이 차단을 풀면 학생이 자기 기기에서 슬라이드를 직접 넘겨보고, 교사가 슬라이드를 옮기면 다시 교사 화면으로 수렴한다. 상태는 세션 컬럼 `allow_interact`(RPC `lp_set_interact`, join·studentState·hostState에 `allowInteract`) — 브로드캐스트 `{type:'interact', on}`은 즉시 반영용 핑일 뿐 진실은 폴링으로 수렴한다.
- 세션 결과 시트 저장: `live/runtime/archive.js` → Apps Script POST. 대상 시트는 콘솔에서 세션 만들 때 과목별 아카이브(`live/archives.json`, `scan-archives.mjs` 생성) 중 선택 — 덱 선택 시 해당 과목 자동 매칭. GAS 측은 각 과목 폴더의 `live-archive.js`(apps-script.js doPost 위임).
- 문항 소스: 덱 유형과 무관하게 **`<수업폴더>/quiz.json`** (deck.tsx·index.html 옆 — 덱 HTML 무수정 원칙).
  네이티브 React 덱은 URL(`?deck=<id>`)에 폴더가 없으므로 registry의 `quizJson`에 그 경로를 적어 연결한다.
  루트 `live/`에는 이제 `archives.json`만 있다.
- 공유 런타임 `live/runtime/*`(live.js, chrome.js, host-overlay.js 등)은 클래식/React 공용 — **반드시 서빙 URL에서 `/* @vite-ignore */` 동적 import.** 번들하면 `import.meta.url` 경로가 깨진다.
- 구 QR/링크(`live/join/?code=…`)는 리다이렉트로 보존, 클래식 페이지는 `live/{host,join}/classic.html`.
- 라이브 레이어는 2026-08-22에 `app/` 을 `live/` 로 합쳤다. 구 경로 `/app/*` 는 `_redirects` 301로 살아 있다. **쿼리 파라미터 `?app=host`·`?app=join` 은 폴더 이름과 무관하므로 그대로 둔다.**

## 프로젝트 스킬 (.claude/skills/)

작업 유형에 맞는 스킬을 우선 사용할 것. **새 수업 덱 제작은 2단계 파이프라인**:
소재만 있으면 `lesson-deck-planner`로 `data/<그룹>/<과목>/<수업>/plan.md`(슬라이드별
form 결정 포함)를 먼저 만들고, 그 계획을 렌더러 스킬이 소비한다.
앞단은 세 갈래다 — 시각 메타포가 뼈대면 `lesson-deck-planner`, 말할 내용을 먼저 쓰고
그 위에서 씬을 자르려면 **pd 파이프라인**(`pd-script` → `pd-chunk` → `pd-scene`, 범용),
수업 대사 전용 시간 검산이 필요하면 `lesson-script-planner`(pd의 한 응용). 셋 다 같은
형식의 plan.md를 내므로 렌더러는 동일하다.

슬라이드가 아니라 **조작하는 교구**가 맞는 소재인지(값을 바꾸면 그림과 숫자가 함께
바뀌어야 이해되는 원리)도 `lesson-deck-planner`가 판별해 `3d-model-builder`로 넘긴다.

**설명 방식은 `eli5`가 기본값이다 (2026-09-16 사용자 결정).** 어느 앞단을 타든 plan.md에
「ELI5 적용 원칙」 절이 들어가고, 렌더러·활동지·문항이 그 원칙을 따르며,
`adversarial-review`의 ⑤ 눈높이 갈래가 결과물을 점검한다. 같은 소재를 적용 전후로 한 번씩
기획해 비교한 결과(「인공지능은 어떻게 배울까」 v1 대 v2) 적용한 쪽이 나아서 공식 절차가
되었다. 대상이 학생이 아니면 끄는 것이 아니라 청중을 바꿔 적용한다.

- `eli5` — **모든 수업 자료의 기본 설명 방식** (외부 ELI5 스킬 이식, MIT). 청중에 맞춰
  어휘·비유·깊이·어조를 보정한다. 일곱 원칙(구조·어휘·비유·문장·어조·정확성·분량)과
  다섯 가지 점검, 청중별 보정 표(`references/audience-calibration.md`). 기본 청중은 고등학생
- `lesson-deck-planner` — 덱 기획 앞단: 아크 설계 + 슬라이드별 형태(form) 결정 → plan.md
- `pd-script` · `pd-chunk` · `pd-scene` — **범용 대본 우선 파이프라인** (newVideoGen
  `/vg-script → /vg-chunk → /vg-scene` 이식). 소재 → script.json → beats.json(연출 메타
  3a~3f) → scene-plan.json(씬당 metaphor·visual_plan, 직전 3씬 cluster 금지, dedup) →
  plan.md. 수업·발표·강연·홍보 어느 소재든 받는다. 게이트 도구는 각 스킬의 `scripts/`
- `lesson-script-planner` — pd 파이프라인의 **수업 대사 응용**: 교사 발화 분량으로 50분을
  검산(260자/분)하고 `[행동]` 시간을 센다. 범용 규칙은 pd-*에, 수업 특수 규칙만 여기에
- `asset-library` — assets/manifest.json 스캔·태깅·검색 + 이미지 재사용 보수 원칙
- `svg-asset-builder` — 장면 소품용 손그림 일러스트 SVG 직필 생성·등록 (2026-09-29 개정: `clean-hand-illustration` 표준, 2세대만 재사용, 맥락 기록)
- `image-asset-builder` — Codex CLI(image_gen)로 무대 배경·캐릭터 시트 생성 → 크롭(배경 투명) → manifest 등록
- `react-deck-builder` — 네이티브 React 덱 저작·등록 절차
- `composite-deck-builder` — deck.json 매니페스트로 컴포지트(혼합) 덱 저작
- `dynamic-scene-builder` — 씬(타임라인) 덱 자유 저작 + validator/픽셀 검수
- `software-walkthrough-builder` — 소프트웨어 절차(사이트·설치·CLI·앱)를 창 목업+포인터+타이핑으로 시연하는 walkthrough 씬 (React 전용, src/walkthrough)
- `diorama-deck-builder` — 생성 무대 위에서 캐릭터 스프라이트가 연기하는 3층 스토리텔링 덱 (React 전용, src/diorama · 사건·여정·역사 서사용)
- `whiteboard-deck-builder` — 한 획씩 그려지는 화이트보드 두들 덱 (React 전용, src/whiteboard · 개념을 쌓아 설명할 때 · rough 생성기 내장, 의존성 0)
- `3d-model-builder` — 원리를 만질 수 있는 **인터랙티브 3D 개념 모형(교구)**을 three.js로 단일 HTML 한 장에 만든다 (`assets/vendor/three/` r169 · 아트보드 스케일 · 상태 변수 하나에서 무대·차트·수식이 유도 · 자가 점검 API + 헤드리스 검수). 슬라이드가 아니라 학생이 손잡이를 돌려 보는 자료일 때. UI 컨셉은 소재마다 새로 정하고 기술 스택과 설계 문법만 고정한다. 레퍼런스: dev의 확산 모델·어텐션 모형
- `vox-collage-deck-builder` — 프레임보다 넓은 종이 세계 위를 카메라가 여행하는 에디토리얼 콜라주 덱 (React 전용, src/vox · 관계를 넓게 펼칠 때)
- `watercolor-deck-builder` — 붓이 지나가며 색면이 차오르는 수채화 wash 덱 (React 전용, src/watercolor · 정서·성찰 도입/마무리)
- `film-deck-builder` — 페이지 자체가 구운 영상인 덱 (React 전용, src/components/SceneVideo · OpenMontage(Remotion)로 덱 문법을 렌더 → 클릭이 영상 안 장면을 하나씩 재생 · 영상 위 텍스트 레이어 지원). ⚠ **사용자가 명시적으로 요청했을 때만** — 렌더에 필요한 OpenMontage는 이 저장소 밖 프로젝트라 모든 PC에 있지 않다. 기획 단계 게이트는 lesson-deck-planner의 `film` 옵트인 규칙
- `deck-narration-builder` — 완성된 React 덱에 **가상 발표자 나레이션 영상**을 입힌다. 발표자 노트 →
  `presenter/narration.json`(대본·발표자 자리) → OmniVoice TTS → MiniMax H3(로컬 ComfyUI, 음성에 입을 맞춤) →
  RVM 매팅(투명 WebM). 덱은 `src/components/Presenter`(`presenterFor`)로 클릭 단계마다 재생. 인물·목소리는
  캐스트 파일(`cast.json`·`cast-<id>.json`, 덱 `?cast=<id>`)로 여러 벌. 선택: 덱 전체를 한 편의 mp4로 내보내기.
  완성 영상은 저장소 루트 `presenter-media/`(gitignore·배포 제외, dev 서버가 서빙), 중간 작업물은 저장소 밖. 원형: `?deck=teacher-centered-ai`
- `live-quiz-builder` — quiz.json 실시간 문항 저작
- `live-upgrade` — 기존 덱을 라이브 가능 버전으로 변환
- `notebooklm-lesson-deck` — NotebookLM 손그림 스타일 덱 파이프라인
- `activity-sheet-builder` — HTML 활동지 + Google Sheets(GAS) 연동
- `adversarial-review` — 완성한 자료를 codex에 넘겨 적대 검증 (사실·교육 설계·일관성 세 갈래 + 씬은 프레임 캡처로 그림 심사). **배포·클래스룸 게시 직전의 마지막 관문**
- `hwpx-skill` — HWP/HWPX 문서 생성·변환
- `workspace-setup` — 구글 연동 기본 환경 구성 도우미 (clasp 설치·로그인, Apps Script
  배포, 활동지 시트·라이브 아카이브·클래스룸 연결). 연동이 안 돼 막혔을 때도 여기부터

**presentation-builder는 레거시** (`.claude/commands/presentation-builder.md`):
자기완결 HTML 프레젠테이션 생성기로 **이제 주로 사용되지 않는다.** "발표자료/
프레젠테이션 만들어줘" 요청도 위 2단계 파이프라인(lesson-deck-planner → 렌더러
스킬)으로 처리할 것. 기존 산출물(`data/AI전문적학습동아리/` 등) 유지보수 시에만 참조.

## 한국어 출력 (fluent-korean 보완 조항)

output-style `fluent-korean`(플러그인 `fluent-korean@fluent-korean`)이 적용된 상태를
전제로 한다. 아래 네 줄은 [snflkd/fluent-korean](https://github.com/snflkd/fluent-korean)
README의 선택 블록을 그대로 가져온 것이며, 플러그인이 갱신될 때 덮어써지지 않도록
output-style 파일이 아니라 이 문서에 둔다.

```
- 한국어로 출력되는 모든 결과물에도 이 지침들을 적용합니다.
- 구체적인 지침이 따로 존재하는 산출물 유형에는 이 지침을 적용하지 않습니다. 적용 여부가 애매하다면 사용자에게 확인합니다.
- 항상, 한국어로 사고하고, 한국어로 보고하고, 한국어로 출력합니다.
- 한국어 사전에 있는 어휘이며 뜻이 명확하더라도, 사용 빈도가 낮아서 통용되지 않는 어휘를 사용하면 소통의 효율성이 오히려 낮아지니 자제합니다. 대신 의미가 명확하며 실제로 통용되는 어휘를 우선적으로 선택합니다.
```

이 저장소에서 위 네 줄이 실제로 무엇을 가리키는지 보충한다.

- **'모든 결과물'의 범위**: 덱 슬라이드 본문과 발표자 노트, `plan.md`, `quiz.json` 문항과
  선택지, 활동지 문구, 학생에게 보이는 모든 안내 텍스트가 여기에 해당한다. 이 저장소는
  수업 텍스트가 `deck.tsx`·`index.html`·`quiz.json` 안에 들어 있으므로, 이 조항이 없으면
  수업 자료 문구가 "코드에 속하는 텍스트"로 분류되어 지침 적용 대상에서 빠진다.
- **적용하지 않는 텍스트**: 변수명·함수명 등 코드 식별자, 코드 주석, 커밋 메시지, 로그
  문자열은 기존 관례를 따른다(output-style 본문 '동작 범위' 2항).
- **'구체적인 지침이 따로 존재하는 산출물'**: `.claude/rules/scene-grammar.md`가 규율하는
  슬라이드 카피(헤드라인·불릿 라벨·킥커)와 `hwpx-skill`로 출제하는 시험지 문항이 대표적이다.
  짧게 끊어 쓴 카피를 완결된 문장으로 늘리지 않는다. 다만 이 예외는 카피 형식에만 적용되며,
  같은 덱 안이라도 설명 문장·발표자 노트·활동 안내처럼 문장으로 쓰는 텍스트에는 위 지침을
  그대로 적용한다.
- **서브에이전트**: 한국어로 서브에이전트 프롬프트를 작성할 때에도 지침을 지키고, 서브에이전트가
  돌려준 결과를 사용자에게 전달할 때 다시 한 번 지침에 맞추어 다듬는다.
- **`eli5`와의 관계**: 두 규율은 층이 다르므로 함께 지킨다. fluent-korean은 **문장을
  어떻게 쓰는가**(조사·어미를 갖춘 완결 문장, 통용되는 어휘, 엠대시 회피)를 정하고,
  `eli5`는 **무엇을 어떤 순서로 말하는가**(용어 즉시 풀이, 생활에서 온 비유, so what으로
  닫기, 한 문장에 생각 하나)를 정한다. 충돌하는 자리는 슬라이드 카피뿐인데, 카피는
  위의 '구체적인 지침이 따로 존재하는 산출물' 예외를 따라 짧게 끊어 쓴다.
