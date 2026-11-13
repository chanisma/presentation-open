---
name: pd-scene
description: beats.json의 비트를 씬 블록(비트 2~4개)으로 묶고, 씬마다 고유 metaphor·emotion·jsx_plan과 visual_plan(pattern_ref 힌트)을 확정해 scene-plan.json을 만든 뒤 기존 렌더러가 소비하는 plan.md로 변환하는 범용 스킬. newVideoGen /vg-scene의 프레젠테이션 이식판. "/pd-scene", "씬 구성해줘", "씬 플랜", "비트를 씬으로" 등을 언급하거나 pd-chunk 다음 단계가 필요할 때 사용. 직전 3씬 semantic cluster 금지와 sketch_request 4조건이 BLOCKING.
---

# /pd-scene — 씬 플랜 생성

> 원본: newVideoGen `/vg-scene` (`lesson-script-planner/references/vg-scene.md`, 바이트 그대로).
> 매체 때문에 바뀐 곳: ① 씬 길이 `5.5~14초` → **비트 2~4개**, ② 씬 경계 `= SRT entry 경계`
> → **= 문장 경계**, ③ 산출물이 Remotion `scenes-v2.json` → **`plan.md`**(기존 렌더러 소비).
> visual_plan 구조·pattern 분포 관리·dedup·sketch_request 4조건·intent progression은 원문 그대로다.

```
beats.json → [씬 블록 묶기] → [씬마다 metaphor·emotion·jsx_plan] → [visual_plan 커밋]
           → scene-plan.json → plan.md → react-deck-builder 등
```

## 🔴 DUAL-FILE 구조

원문과 같다. 둘 다 만든다.
- `scene-plan.json` — 씬 단위 설계 기록 (metaphor·emotion·visual_plan·sketch_request). **이 파일이 원본**이다.
- `plan.md` — `lesson-deck-planner/references/plan-format.md` 형식으로 **기계 변환**한 것. 렌더러가 읽는다.
  plan.md를 손으로 고치지 말고 scene-plan.json을 고친 뒤 다시 변환한다.

## 처리 흐름

### 1. 비트를 씬 블록으로 묶기

원문 3-a~c 그대로:
- 기본 목표: **비트 2~4개 = 씬 1개**
- `그런데`, `즉`, `예를 들어`, `반면` 같은 연결 비트는 독립 씬 금지
- 새 씬은 새 비트가 아니라 **새 시각 흐름이 필요할 때만** 만든다
- `merge_hint`를 따른다. `merge_prev`/`merge_next`는 같은 씬에, `standalone`은 경계 후보

> 씬은 비트 하나가 아니라 **여러 비트를 묶은 scene block**이다. 짧은 연결 비트는 같은
> 씬 안에서 `<Build>` 단계로 처리한다.

### 2. 씬마다 metaphor · emotion · jsx_plan

씬 하나에 **고유 시각 메타포** 하나. 이 저장소 `scene-grammar.md`의 "씬 1장당 고유 메타포"와
같은 규칙이고, 원문 scene-plan.json 구조(R12)도 같은 필드를 요구한다.

```typescript
{
  scene_index: number;
  beat_range: [number, number];        // inclusive
  sentence_range: [number, number];    // script.json 전역 문장 번호 (원자성 추적)
  metaphor: string;                    // 씬 1개의 고유 시각 메타포
  emotion: string;                     // 감정 1단어 또는 슬래시 쌍
  jsx_plan: string;                    // 자유 한 줄 — 렌더러의 영감원. 구도를 지시하지 않는다
  form: string;                        // plan.md form — scene/static/build/image/… (변환용)
  sketch_request?: SketchRequest;      // ⚠ 4조건 모두 만족 시만
  visual_plan: VisualPlan;             // 아래
}
```

`jsx_plan`은 **한 줄**이다. 렌더러(react-deck-builder·dynamic-scene-builder)가 씬 본문을
자유 TSX로 설계하므로 구도를 못 박지 않는다. 원문 R11 원칙 A — "layout은 visual_plan을
힌트로만 읽는다" — 와 같다.

### 3. visual_plan 커밋 (MANDATORY)

씬마다 반드시 붙인다. **렌더러가 그대로 쓰는 설계도가 아니라 힌트 + 분포 관리 장치**다.

```json
"visual_plan": {
  "pattern_ref": "P04_ring_with_bullets",
  "relationship": "metric",
  "focal": { "type": "RingChart", "value": 80, "label": "자동화 범위" },
  "support": [{ "type": "BulletList", "items": ["…", "…", "…"] }],
  "accent_color": "primary",
  "recommended_container": "Stack",
  "rationale": "role=evidence shape=metric → 링차트 + 불릿"
}
```

`pattern_ref`는 `references/pattern-catalog.md`의 39종(P01~P40) 중 하나. 비트의 `scene.role` ·
`semantic_shape` · `evidence_type` · `focal_candidate`에서 고른다. `focal.type`은 카탈로그의
`focal_type`을 따른다.

### 4. 분포 관리 — 직전 3씬 semantic cluster 금지 (BLOCKING)

원문 v1.2 규칙 그대로. hash가 구조만 비교해서 놓쳤던 쌍둥이(trio gauge ×2, table pair,
terminal ×4)를 잡기 위한 장치다.

1. **semantic signature** = `pattern_ref` + `focal.type` 조합
2. 현재 씬의 signature가 **직전 3씬 중 2개 이상과 같으면** 대안 pattern_ref로 회피
3. 회피는 같은 `relationship` 안에서 다른 `focal_type`을 가진 패턴으로 (카탈로그 참조)
4. 회피 후에도 2개 이상 같으면 `[FAIL:semantic-cluster]` — 씬 생성 중단, 메타포 재발명

추가 규칙 (원문 "렌더 ready 판정"): **비카드 비율 ≥ 40%** — `non_card: true` 패턴이 전체
씬의 40% 이상. 카드로 감싼 씬이 과반이면 덱 전체가 납작해진다.

### 5. 자막 ↔ 노드 text dedup (BLOCKING)

원문 v1.2 그대로. `focal.label` / `support[].text` / `subline`을 정할 때:

1. 씬이 덮는 문장들의 text를 사전 참조
2. 유사도 **> 0.6**이면 요약 · 은유 · 수치 추상화로 치환
   (예: 문장 "Github에서 별을 7만 5천 개 넘게" + 노드 "75K 깃허브 스타" → "업계 최상위권")
3. 0.6 이하가 될 때까지 최대 3회. 실패 시 `[FAIL:subtitle-visual-dedup]`

> 이 규칙은 **범용**이다. 발표자가 말하는 문장을 화면에도 적으면 청중은 같은 것을 두 번
> 처리한다. 화면은 말하지 않는 것을 담는다.

### 6. sketch_request — 4조건 모두 만족 시만 (HARD)

씬에 손그림 figural 에셋을 요청하려면 **넷 다 참**이어야 한다. 하나라도 아니면 추상 도형 ·
기존 에셋 · 정직한 플레이스홀더로 풀고 비워 둔다.

1. **figural_essential** — 메타포가 인물·동물·기계 단면·가구 내부·음식 디테일 같은 회화적
   표현일 때만 의미가 살고, 추상 도형으로 대체 불가
2. **no_realsource** — 실사 이미지로 풀리지 않음 (한국적 맥락, 가상 인물, 추상-시각 혼합)
3. **no_iconify** — 클린 아이콘이 톤을 깨뜨림 (손그림 회화 톤이어야 함)
4. **decomposable** — 머리/어깨/몸통/외곽 3~6획으로 분해 가능

**덱당 최대 5개** (소프트 cap). 6개째는 단조 회귀 신호 — 이전 것 하나를 추상화하거나
sketch를 덱의 핵심 시그니처로 승격. 판정은 metaphor/emotion 결정 직후. **의심스러우면
비운다 — 안 채우는 게 기본이고 채우는 게 예외.**

이 저장소에서의 실행: 4조건 통과분은 `svg-asset-builder`(추상·아이콘)로, 인물·생물은
`image-asset-builder`(생성 이미지 크롭)로 넘긴다. `scene-grammar.md` "졸라맨 금지" 조항과
같은 경계다.

### 7. Intent progression (BLOCKING)

원문 그대로. 씬 순서가 청중의 인지 흐름이다.
- emphasize 2연속 금지 · define/explain 3연속 금지
- compare 다음은 emphasize 또는 example
- 첫 씬은 define 또는 emphasize · 마지막 두 씬은 emphasize 또는 list

### 8. 검증 → plan.md 변환

```bash
node .claude/skills/pd-scene/scripts/validate-scene-plan.mjs <폴더>   # 게이트 전부
node .claude/skills/pd-scene/scripts/to-plan-md.mjs <폴더>            # scene-plan.json → plan.md
```

변환 규칙:
- 씬 1개 = `## Slide N` 블록 1개
- `form` 줄 · `- beats:` 줄 · `- scene: metaphor | emotion | intent` 줄 (scene form일 때)
- `**핵심 메시지:**` = 씬의 첫 `declaration`/`payoff` 비트의 subline, 없으면 narration_summary
- `**화면 텍스트:**` = visual_plan의 focal.label + support[].text (dedup 통과분)
- `**형태 설계:**` = jsx_plan + visual_plan.rationale + recommended_container
- `**발표자 노트:**` = `sentence_range`가 가리키는 script.json 문장을 **글자 그대로**

변환 뒤 손으로 채울 것: **「ELI5 적용 원칙」 절**(헤더 다음, 슬라이드 블록 앞).
이 저장소의 plan.md는 이 절이 필수다(`lesson-deck-planner` ④ · `eli5` 스킬).
변환기는 이 절을 만들지 않으므로, 대본의 청중 기준으로 일곱 원칙을 적고 노트가
그 원칙대로 흐르는지(용어 풀이·비유·so what) 확인한 뒤 렌더러로 넘긴다.

## 렌더 ready 체크리스트 (scene-plan.json 커밋 시)

- [ ] 모든 씬에 `visual_plan.pattern_ref` 존재
- [ ] 직전 3씬 semantic signature cluster ≤ 2
- [ ] focal/support/subline vs 문장 유사도 ≤ 0.6
- [ ] 비카드 비율 ≥ 40%
- [ ] sketch_request는 4조건 통과분만, 덱당 ≤ 5
- [ ] intent progression 위반 없음
- [ ] 원자성: Σ sentence_range 길이 = script.json 문장 총수
- [ ] 씬당 metaphor 중복 없음

**게이트 우회 플래그 없음** (원문 v1.2 ZERO-TOLERANCE).

## 다음 단계

plan.md의 form 분포로 렌더러를 고른다 — `lesson-deck-planner` ⑥ 표와 동일.
`scene` 중심이면 `react-deck-builder`, 전량 `image`면 `notebooklm-lesson-deck`, 등.

## 마무리 — 프롬프트 기록 (모든 덱·활동지 작업 공통)

작업을 끝내기 직전, 사용자가 이 자료를 위해 입력한 프롬프트를 자료 폴더의 `prompts.md`에
**전문 그대로** 덧붙인다. 형식과 제외 규칙은 `.claude/rules/prompt-log.md`. 최초 요청이면
머리글에 이 스킬 이름을 적는다 (`· /<스킬명>`). 첨부 이미지는 세션 id와 순번만.
