---
name: pd-chunk
description: script.json의 문장을 시각 의도 단위(beat)로 묶고 연출 메타(scene_role·semantic_shape·merge_hint·visual_weight·energy·focal/subline/support·이웃 관계)를 붙여 beats.json을 만드는 범용 스킬. newVideoGen /vg-chunk Step 3의 프레젠테이션 이식판. "/pd-chunk", "비트로 묶어줘", "연출 메타 붙여줘", "씬 블루프린트" 등을 언급하거나 pd-script 다음 단계가 필요할 때 사용. 다음 단계는 pd-scene.
---

# /pd-chunk — 씬 인식 청커

> 원본: newVideoGen `/vg-chunk` (`lesson-script-planner/references/vg-chunk.md`, 바이트 그대로).
> 이 문서는 원문 **Step 3(Scene-Aware Semantic Analysis)을 그대로** 옮기고, SRT 타임코드만
> 문장 번호로 바꿨다. 원문 Step 1·2·3.5(이미지 수집)·4·6·7은 영상 렌더 전용이라 뺐다.
> 스키마 전문은 `references/beats-schema.md`.

비트는 "태그 붙은 자막"이 아니다. **pd-scene에게 어떤 관계를 보여 줄지, 얼마나 중요한지,
이웃과 어떻게 이어지는지를 말해 주는 씬 블루프린트**다.

## 🚨 원자성 — 문장을 합치지 마라

> **script.json의 문장 1개 = 자막·노트의 원자 단위.** 비트는 시각 연출 그룹일 뿐이다.

원문 사고 (developer-titles, 2026-04-22): 자막 260개를 비트 96개로 **합쳤더니** 자막 하나가
122자·3줄로 감겼고 원본 180개를 잃었다. → 비트는 **`sentences: [12, 13, 14]`처럼 번호로
가리키기만** 한다. `narration_summary`는 화면 설계용 요약이지 자막이 아니다.

```
script.json 문장 총수 === Σ beat.sentences.length   (손실 0 · 중복 0 · 순서 보존)
```

## 입력 · 출력

- 입력: `<폴더>/script.json` (pd-script 산출물)
- 출력: `<폴더>/beats.json`

## Step 3: 연출 메타 분석 — 가장 중요한 단계

각 문장 그룹에 대해 아래를 판정한다. **필드명·값·의미 전부 원문 그대로.**

### 3a. Scene Role — 이 비트가 서사에서 맡는 역할

| scene_role | 의미 | 레이아웃 함의 |
|---|---|---|
| `declaration` | 대담한 주장, 논지, 핵심 진술 | 히어로 텍스트, 큰 focal, 희박한 support |
| `comparison` | A vs B, 전후, 대비 | VersusCard, 비대칭 Split |
| `escalation` | 논점을 향해 쌓아 가기, 커지는 숫자 | 순차 reveal, 상승 막대 |
| `evidence` | 증거, 인용, 주장을 받치는 데이터 | 인용+권위, 수치+맥락 |
| `sequence` | 단계, 과정, 타임라인 | FlowDiagram, Timeline |
| `payoff` | 펀치라인, 결론, "그래서 뭐" | 단일 히어로 숫자/텍스트, 극적 reveal |
| `pause` | 전환, 숨 고르기, 수사적 질문 | 희박한 심볼, 개념 하나 |
| `metaphor` | 비유, 익숙한 개념에 빗대기 | 심볼 중앙 + 설명 주변 |
| `cluster` | 같은 층위의 여러 항목 | 그리드, 대시보드 |
| `support` | 배경 정보, 맥락 | merge 후보 — 자동 merge 아님 |

**support 비트는 merge 후보이지 자동 merge가 아니다.** 리듬을 만들거나, 강한 focal이
있거나, pause로 작동하면 standalone으로 둘 수 있다.

### 장면 문법 트리거 키워드

scene_role 판별 시 참고한다 (원문 표 그대로):

| 트리거 키워드 | scene_role | semantic_shape | 활성화되는 패턴 |
|---|---|---|---|
| 숫자, %, 배수, 원, 시간, "증가", "감소" | `evidence` / `payoff` | `metric` | stats-number (히어로 넘버) |
| "반면", "반대로", "A와 B", "대신", "똑같다" | `comparison` | `contrast` | compare-versus (좌우 대비) |
| "이전에는", "지금은", "예전엔", "바뀌었다", "현재" | `comparison` | `transformation` | before-after |
| "먼저", "그다음", "이후", "마지막으로", "단계" | `sequence` | `flow` | process-steps |
| 연도, 월, "초기", "중반", "최근" | `sequence` | `flow` | timeline |
| 따옴표, "라고 말했다", "핵심은", "한마디로", "바로" | `declaration` | `symbol` | quote-focus |
| "첫째", "둘째", "셋째", "핵심은 세 가지" | `cluster` | `cluster` | key-point-bullet |
| "확인해야", "체크", "조건", "준비", "꼭 지켜" | `cluster` | `cluster` | checklist |
| "넣으면", "거치고", "결과로", "출력" | `sequence` | `transformation` | input-output |
| "문제는", "하지만", "해법은", "그래서 필요한" | `declaration` | `evidence` | problem-solution |
| "많이들 착각하는데", "사실은", "오해" | `comparison` | `contrast` | myth-vs-reality |
| "하지 말고", "대신", "좋은 방법", "피해야" | `comparison` | `contrast` | do-dont |
| "때문에", "그래서", "결국", "원인" | `evidence` | `evidence` | cause-effect |
| "판도", "지도", "생태계", "어디쯤" | `cluster` | `hierarchy` | map-or-landscape |
| "이제", "다음은", "그 전에", "정리하면" | `pause` | `symbol` | chapter-transition |
| 역할명 + 감정/공감 표현 | `declaration` | `symbol` | persona-empathy |

### 3b. Semantic Shape — 공간 관계

| semantic_shape | 관계 |
|---|---|
| `contrast` | 둘이 대립 |
| `flow` | 순차 진행 |
| `cluster` | 여러 동등 항목 |
| `metric` | 지배적 숫자 하나 |
| `hierarchy` | 중심 vs 주변 |
| `transformation` | 입력 → 출력, 원인 → 결과 |
| `symbol` | 개념/은유 하나 |
| `evidence` | 주장 + 증거 |
| `summary` | 요약, 모음 |

### 3c. Merge Hint — SPLIT-FIRST

| merge_hint | 의미 |
|---|---|
| `standalone` | 혼자 씬이 될 만큼 강함 (**기본값 — 이걸 선호**) |
| `merge_prev` | 이전 시각 사건의 일부로 **봐야만** 할 때만 |
| `merge_next` | 다음 비트가 이 비트의 시각 아이디어를 완성할 때만 |
| `candidate_for_merge` | 혼자는 약하지만 리듬 브레이크로 쓸 수 있음 — 레이아웃이 결정 |

**merge는 예외지 기본이 아니다.**
- 모든 비트의 기본값은 `standalone`
- 하나의 시각 사건이어야만 할 때만 `merge_prev`/`merge_next`
- 짧은 비트에 강한 focal(숫자, 이름, 질문)이 있으면 `standalone` 유지
- 리듬 브레이크·pause를 만드는 짧은 비트는 `standalone` 유지

**비트 길이** (원문 초 단위 → 문장 수, `references/beats-schema.md`):
1~3문장 이상적 · 4~5문장 허용 · 6문장+ 분할 검토 · 8문장+ 거의 항상 분할.

**분할 트리거** — 한 비트에 둘 이상 있으면 나눈다: 주장+설명 · 숫자+비교 · 질문+답 · 예시+결론.

> 비트는 문단이 아니다. 비트는 시각 의도 하나다.

### 3d. Visual Weight & Energy — 리듬 제어

| 필드 | 값 | 용도 |
|---|---|---|
| `visual_weight` | low / medium / high | 이 비트가 차지할 화면 비중 |
| `energy` | calm / neutral / sharp / explosive | 시각 처리의 극적 정도 |

- 통계, 핵심 숫자 → high · sharp/explosive
- 정의, 맥락 → low · calm
- 대담한 주장, 인용 → high · sharp
- 전환, pause → low · calm
- 비교 → medium-high · sharp
- 목록, cluster → medium · neutral

### 3e. Focal · Subline · Support — 레이아웃 힌트

- `focal_candidate`: 화면을 **지배할 단 하나** (숫자, 브랜드, 인용, 개념)
- `subline_candidate`: focal에 맥락을 주는 **읽을 수 있는 한 문장** (키워드가 아니라 문장)
- `support_candidates`: 맥락을 주는 보조 요소 1~3개

**"시각 의도 하나"는 "화면에 키워드 하나"가 아니다.** 좋은 비트는 focal **과** 읽을 수 있는
subline을 갖는다. 자막 바 없이도 화면이 핵심 주장을 전달해야 한다.

`declaration` / `evidence` / `comparison` / `payoff` 비트에서 `subline_candidate`는 **필수**다.
`pause`/전환 비트만 생략할 수 있다.

```
narration: "개발자의 92%가 AI 코딩 도구를 매일 쓰고 있고 전세계 코드의 41%를 AI가 만들고 있습니다"
focal_candidate:   "92%"
subline_candidate: "미국 개발자 AI 도구 사용률"
support_candidates: ["41%", "AI 코딩 도구"]
```

### 3f. 이웃 관계 — 리듬 인식

| 필드 | 값 |
|---|---|
| `contrast_with_prev` | 이 비트가 이전을 뒤집거나 반박하면 true |
| `continues_motif` | 같은 주제를 이어 가면 true |
| `should_break_rhythm` | 최근 씬들과 시각적으로 달라야 하면 true |

### 3.5. 부분 에셋 후보 (`svg_needs`, 선택)

시각화 가치가 있는 **핵심 명사**를 뽑아 기록한다. 이 저장소에서는 `assets/manifest.json`을
조회해 slug가 있으면 `asset_id`에, 없으면 `pending_forge: true`. 실제 생성은 pd-scene이
`sketch_request` 4조건을 통과시킨 뒤 `svg-asset-builder`/`image-asset-builder`에 넘긴다.

### 3g. 보조 필드

`tone` · `evidence_type` · `emphasis_tokens`(≤5) · `density`(1~5) · `brand_keywords` ·
`visual_keywords` — 원문 그대로. 씬 구조가 아니라 텍스트 렌더·에셋 검색용이다.

## 검증

```bash
node .claude/skills/pd-chunk/scripts/validate-beats.mjs <폴더>
```

원자성(손실·중복·순서) · 필수 필드 · subline 필수 role · emphasis ≤5 · 8문장+ 경고.
**통과 전 pd-scene을 부르지 않는다.**

## 다음 단계

```
/pd-scene <폴더>
```
