# references/ — newVideoGen 원본 스킬 (바이트 그대로)

이 폴더의 세 파일은 `E:\newVideoGen\.claude\skills\<이름>\SKILL.md`를 **한 바이트도
고치지 않고** 옮긴 것이다. 헤더도 붙이지 않았다 — 원문을 그대로 읽을 수 있어야
`../SKILL.md`가 무엇을 바꾸고 무엇을 버렸는지 대조할 수 있기 때문이다.
(같은 관례: `react-deck-builder/references/bolt-authoring.md`)

| 파일 | 원본 | 크기 | 마지막 대조 |
|---|---|---|---|
| `vg-script.md` | `/vg-script` | 158줄 · 4,488바이트 | 2026-08-22 |
| `vg-chunk.md` | `/vg-chunk` | 552줄 · 23,009바이트 | 2026-08-22 |
| `vg-scene.md` | `/vg-scene` | 538줄 · 28,173바이트 | 2026-08-22 |

newVideoGen은 공개 저장소가 아니고 폴더 안에 LICENSE 파일이나 저작권 표기가 없다.
권리 관계는 `THIRD-PARTY-NOTICES.md` §2에 정리돼 있고 확인해야 할 항목도 거기 있다.

---

## 원본 파이프라인

```
주제 → /vg-script → script.json (챕터 × 문장)
     → /vg-voice  → mp3 + SRT (문장 단위 타이밍)
     → /vg-chunk  → beats.json (SRT entry를 의미 그룹으로 묶고 연출 메타 부여)
     → /vg-scene  → scenes-v2.json (beat 2~4개 = scene 1개, visual_plan 확정)
     → /vg-layout → TSX
```

`/vg-voice`와 `/vg-layout`은 이 폴더에 없다. TTS 합성과 Remotion 컴포넌트 저작이라
슬라이드덱에 대응물이 없기 때문이다.

## 무엇을 가져오고 무엇을 버렸나

`../SKILL.md`(lesson-script-planner)가 이식한 것은 **코드가 아니라 순서와 게이트**다.

| 원본의 규칙 | 이 저장소에서 대응하는 것 | 위치 |
|---|---|---|
| 대본을 먼저 만들고 그 위에서 씬을 자른다 | 교사 발화를 먼저 쓰고 그 경계에서 슬라이드를 자른다 | SKILL.md ①④ |
| 구어체 · 1문장 15~30자 · 마침표가 호흡 단위 | 그대로 (한 줄 = 한 문장) | SKILL.md ① |
| **SRT entry 원자성** — beat는 묶기만, 합치지 않는다 | 발화 문장 원자성 — 비트는 묶기만 | SKILL.md ③ |
| 자막 ↔ 노드 text dedup, Levenshtein ≤ 0.6 | 발화 ↔ 화면 텍스트 dedup ≤ 0.6 (2-gram Dice) | SKILL.md ⑤ |
| intent progression (emphasize 2연속 금지 등) | 그대로 | SKILL.md ③ |
| 오디오 길이가 곧 영상 길이 | **발화 분량이 곧 수업 시간** (원본에 없는 확장) | SKILL.md ② |

버린 것: SRT 파싱·타임코드 정렬·`scene 경계 = SRT entry 경계` 불변식·비디오 클립
배경·pattern_ref 20종 카탈로그·`visual_plan` 스키마. 전부 Remotion 렌더 파이프라인에
묶인 규칙이라 브라우저에서 클릭으로 넘기는 슬라이드덱에는 대응물이 없다.

바꾼 것 하나: dedup 유사도 계산을 Levenshtein에서 **2-gram Dice 계수**로 바꿨다.
한국어는 어절 순서를 바꿔도 같은 뜻이 되는 경우가 많아 편집 거리가 과소평가한다
(`scripts/script-budget.mjs`의 `similarity()` 참조).

## 원본에서 배운 실패 사례

두 파일 모두 첫머리에 실제 사고 기록을 달고 있다. 규칙의 근거이므로 옮겨 적어 둔다.

- **developer-titles (2026-04-22)**: SRT 260 entry를 beat 96개로 **합쳤더니** 자막
  하나가 평균 50자·최장 122자가 되어 화면에서 3줄로 감겼고, 원본 180 entry 이상을
  잃었다. → "묶는 것은 화면 전환을 설계하는 일이지 말을 줄이는 일이 아니다."
- **deep-blue (2026-04-13)**: 재TTS 후 씬 경계만 1.00058배로 스케일했더니 자막과
  오디오가 최대 6.5초 어긋났다. → 균등 비례 보정 금지.
- **harnes-app (2026-05-02)**: atomicity만 검증하고 schema를 안 봐서
  `{startMs/endMs}` vs `{startTime/endTime}` 불일치로 60분 풀 렌더 후 자막 0건 발견.
  → 게이트를 두 단계로 분리.
