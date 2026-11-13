# 발표자 오버레이 — 가상 발표자가 슬라이드를 설명하는 영상

2026-09-29 시도. 슬라이드마다 가상 발표자가 오른쪽 아래에 서서(배경 투명) 발표자 노트를
말하고, 클릭하면 빌드와 다음 발표 조각이 함께 넘어간다. 이 작업을 일반화한 것이
**`deck-narration-builder` 스킬**이다 — 절차·도구·함정은 그쪽 `SKILL.md`를 본다.

## 이 폴더

| 파일 | 내용 |
|---|---|
| `narration.json` | 대본(slides) + 덱 id + 발표자 자리(overlay). 덱(`presenterFor`)과 영상 합성이 함께 읽는다 |
| `cast.json` | 기본 캐스트 — 실사풍 40대 여성 교사. 인물 `presenter-ref.png`, 목소리 `voice-ref.wav` |
| `cast-anime.json` | 애니메이션 캐스트 — 차분한 젊은 여성, 웹툰풍. 인물 `presenter-ref-anime.png`(원본 `anime-b.png`에서 배경만 웜그레이로), 목소리 `voice-ref-anime.wav` |
| `voice-ref*.wav` | 캐스트의 기준 목소리(OmniVoice 설계). 모든 조각이 이 목소리를 복제한다 |

## 결과물 (저장소 루트 `presenter-media/` — gitignore)

| 캐스트 | 발표자 영상 (덱) | 덱 전체 영상 |
|---|---|---|
| 기본 | `presenter-media\teacher-centered-ai\` · 63단계 19분 51초 | `presenter-media\video\teacher-centered-ai.mp4` 19분 52초 |
| anime | `presenter-media\teacher-centered-ai-anime\` · 63단계 18분 56초 · 덱은 `?cast=anime` | `presenter-media\video\teacher-centered-ai-anime.mp4` 18분 57초 |

```bash
npm run dev -- --port 5199            # 덱 → /?deck=teacher-centered-ai  (애니메이션: &cast=anime)
```

## 이 덱의 특이사항

- 발표자 자리: 기본 오른쪽 아래(x 1548 · y 650 · w 352). 본문과 겹치는 10·13·15장은 줄이거나 옮겼고,
  애니메이션 캐스트의 넓은 머리가 2장 인용문 끝에 닿아 2장은 24px 내렸다(두 캐스트 공통)
- 2026-09-30 단계 끝 자르기: 처음 조립 때 단계의 마지막 조각을 H3 원본 길이 그대로 써서, 말이 끝난 뒤 소리 없이 입만
  움직이는 구간이 최대 3초(1초 이상 27~29단계) 남았다. 음성 + 0.3초에서 자르도록 다시 조립·매팅하고 덱 전체 영상도 다시 합성했다
- 13장 "뉴쌤" 발음은 받아쓰기로 판별이 안 된다(늘 "뉴스엠") — 귀로 확인
- 중간 산출물: 기본 캐스트는 `C:\AI\tts\pilot`, 애니메이션은 `C:\AI\tts\anime` (스킬 정리 전 작업이라
  스킬 기본 경로 `C:\AI\narration\<폴더>`와 다르다 — 이어서 고치려면 `NARR_WORKDIR`로 지정)
