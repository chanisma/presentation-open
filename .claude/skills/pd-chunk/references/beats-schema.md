# beats.json — 비트 스키마 (pd-script → pd-chunk → pd-scene 공용 계약)

> 원본: newVideoGen `/vg-chunk` Step 3 + Step 5 (`lesson-script-planner/references/vg-chunk.md`).
> 매체 때문에 바뀐 곳은 **두 군데뿐**이다 — ① `start_ms/end_ms` → `sentences[]`(문장 번호),
> ② `start_frame/end_frame` 삭제. 연출 메타(3a~3f)는 필드명·값·의미 모두 원문 그대로다.

## 원자성 — 가장 먼저 지킬 것

**script.json의 문장 1개 = 자막의 원자 단위다. 비트는 시각 연출 그룹일 뿐, 문장을
합치는 단위가 아니다.**

원문이 이 규칙을 얻은 경위 (developer-titles, 2026-04-22): SRT 260 entry를 beat 96개로
합치면서 `beat.text`에 여러 entry를 이어 붙인 긴 문자열을 만들었고, 다음 단계가 그걸
자막으로 그대로 써서 자막 하나가 122자·3줄이 됐다. 원본 180 entry 이상을 잃었다.

```
script.json 문장 총수 === 모든 beat.sentences[] 길이의 합   (손실 0)
```

`narration_summary`는 **화면 설계용 요약**이지 자막이 아니다. 발표자 노트·자막은
항상 `sentences[]`가 가리키는 원문 문장에서 가져온다.

## 스키마

```typescript
interface BeatsFile {
  project_id: string;
  source: "script.json";
  total_sentences: number;        // script.json 문장 총수 — 원자성 검증 기준
  beats: Beat[];
}

interface Beat {
  beat_index: number;
  chapter_id: string;             // script.json chapters[].id
  sentences: number[];            // script.json 전역 문장 번호 목록 (원자성 보존) — 예: [12, 13, 14]
  narration_summary: string;      // 시각 연출 설계용 요약. 자막 아님.

  // ── Step 3: 연출 메타 (원문 3a~3f 그대로) ──
  scene: {
    role: "declaration" | "comparison" | "escalation" | "evidence" | "sequence"
        | "payoff" | "pause" | "metaphor" | "cluster" | "support";
    semantic_shape: "contrast" | "flow" | "cluster" | "metric" | "hierarchy"
        | "transformation" | "symbol" | "evidence" | "summary";
    merge_hint: "standalone" | "merge_prev" | "merge_next" | "candidate_for_merge";
    visual_weight: "low" | "medium" | "high";
    energy: "calm" | "neutral" | "sharp" | "explosive";
    focal_candidate: string | null;      // 화면을 지배할 단 하나
    subline_candidate: string | null;    // 읽을 수 있는 한 문장 (declaration/evidence/comparison/payoff는 필수)
    support_candidates: string[];        // 1~3개
    contrast_with_prev: boolean;
    continues_motif: boolean;
    should_break_rhythm: boolean;
  };

  // ── 3.5: 부분 에셋 후보 (선택) ──
  svg_needs?: Array<{
    concept: string;
    asset_id?: string;                   // assets/manifest.json slug. 없으면 pending
    role: "focal" | "support" | "accent";
    style: "line-art" | "duotone" | "filled";
    pending_forge: boolean;
    rationale?: string;
  }>;

  // ── 3g: 보조 필드 ──
  semantic: {
    tone: "neutral" | "dramatic" | "questioning" | "confident" | "analytical" | "warning";
    evidence_type: "statement" | "statistic" | "quote" | "example" | "definition";
    emphasis_tokens: string[];           // 최대 5
    density: 1 | 2 | 3 | 4 | 5;
    brand_keywords: string[];
    visual_keywords: string[];
  };
}
```

## 비트 길이 — 원문 규칙의 매체 변환

원문은 초 단위(2~6초 이상적, 10초 이상 분할)다. 여기서는 **문장 수**로 읽는다.

| 원문 (초) | 이식 (문장) | 지침 |
|---|---|---|
| 2~6초 | 1~3문장 | 이상적 — 시각 의도 하나 |
| 7~9초 | 4~5문장 | comparison/evidence에서 허용 |
| 10초+ | 6문장+ | 진짜 하나의 시각 사건이 아니면 분할 |
| 12초+ | 8문장+ | 거의 항상 분할 |

**분할 트리거** (원문 그대로): 한 비트에 다음 중 둘 이상이 있으면 나눈다.
- 주장 + 설명
- 숫자 + 비교
- 질문 + 답
- 예시 + 결론

> 비트는 문단이 아니다. 비트는 시각 의도 하나다.
> 의미가 이어진다는 이유로 합치지 마라. 하나의 시각 사건으로 봐야 할 때만 합쳐라.
> 짧은 비트는 문제가 아니다 — 리듬을 만든다. 긴 비트가 문제다 — 화면을 설명으로 납작하게 만든다.

## 자가 검증

```bash
node .claude/skills/pd-chunk/scripts/validate-beats.mjs <프로젝트 폴더>
```

검사 항목: 원자성(손실 0 · 중복 0 · 순서 보존) · 필수 필드 · subline 필수 role에 subline 존재 ·
emphasis_tokens ≤ 5 · 비트 길이 8문장+ 경고.
