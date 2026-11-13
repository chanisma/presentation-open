---
name: pd-script
description: 주제·키워드·개요 파일에서 프레젠테이션 대본(script.json + script.md)을 만드는 범용 대본 생성 스킬. newVideoGen /vg-script의 프레젠테이션 이식판. 수업·발표·강연·제품 소개·홍보 어느 소재든 받는다. "대본 써줘", "스크립트 만들어줘", "말할 내용부터", "/pd-script", "pd 파이프라인" 등을 언급하거나, 슬라이드보다 말을 먼저 설계해야 할 때 사용. 다음 단계는 pd-chunk → pd-scene.
---

# /pd-script — 대본 생성

> 원본: newVideoGen `/vg-script` (`lesson-script-planner/references/vg-script.md`, 바이트 그대로).
> 매체 때문에 바뀐 곳: `--length`의 단위가 **분 → 슬라이드 장수**, 출력 위치가
> `data/{pid}/` → **프레젠테이션 폴더**. 대본 작성 원칙·구조·스키마는 원문 그대로다.

```
소재 → [pd-script] → script.json + script.md → [pd-chunk] → beats.json → [pd-scene] → plan.md → 렌더러
```

이 파이프라인은 **범용**이다. 수업 대사든 투자 발표든 제품 소개든, "말할 내용을 먼저
쓰고 그 위에서 화면을 자른다"는 순서는 같다. 소재별 특수 규칙(수업의 시간 배분 검산
같은 것)은 이 스킬이 아니라 소재별 응용 스킬이 갖는다 — `lesson-script-planner`가 그 예다.

## 트리거

```
/pd-script "AI 시대의 가치 노동"
/pd-script "RAG 검색의 원리" --tone formal --length 15
/pd-script docs/topic-outline.md --audience "고등학생"
```

## 입력

| 파라미터 | 필수 | 설명 | 기본값 |
|---|---|---|---|
| 주제 | ✅ | 텍스트 또는 파일 경로 (md/txt/pdf) | - |
| `--tone` | | casual / formal / storytelling | storytelling |
| `--length` | | 목표 슬라이드 장수 (8 / 13 / 20 / 30) | 13 |
| `--audience` | | 청중 한 줄 | 주제에서 추론 |
| `--lang` | | ko / en | ko |
| `--out` | | 출력 폴더 | 주제에서 자동 생성 |

## 워크플로우

### Step 1: 주제 분석

주제를 읽고 셋을 결정한다.
- **핵심 메시지** — 이 프레젠테이션이 전달해야 하는 한 줄
- **타겟 청중** — 누구 앞에서 말하는가. 청중이 톤과 어휘를 정한다
- **톤앤매너** — 강의식 / 대화식 / 스토리텔링

### Step 2: 구조 설계

```
도입 (10~15%) — 후킹, 문제 제기, 궁금증 유발
전개 (60~70%) — 핵심 개념 2~4개, 예시, 비교
절정 (10~15%) — 핵심 인사이트, 반전, 감정적 피크
마무리 (10%)   — 정리, CTA, 여운
```

목표 장수별 챕터 수 (원문의 분 단위 표를 장수로 환산):

| 장수 | 챕터 수 | 문장 수 (총) |
|---|---|---|
| 8 | 3~4 | 40~60 |
| 13 | 5~7 | 80~120 |
| 20 | 7~9 | 120~170 |
| 30 | 9~12 | 160~220 |

### Step 3: 대본 작성

각 챕터의 나레이션을 쓴다. **원문의 7원칙 그대로**:

1. **구어체**: "~입니다" 대신 "~이에요", "~거든요", "~잖아요"
2. **짧은 문장**: 1문장 = 2~3초 (15~30자)
3. **호흡 단위**: 마침표(.) 기준으로 끊어 읽는다
4. **청자 참여**: "여러분은 어떻게 생각하세요?", "한번 생각해 보세요"
5. **전환어**: "그런데 말이죠", "자 그러면", "여기서 중요한 건"
6. **구체적 사례**: 추상적 설명 < 구체적 에피소드
7. **반복 강조**: 핵심 키워드는 3번 이상 자연스럽게 반복

톤별 가이드:

| 톤 | 특징 | 예시 |
|---|---|---|
| casual | 친구와 대화하듯 | "이거 진짜 대박인 게요..." |
| formal | 강의/발표 톤 | "오늘 말씀드릴 주제는..." |
| storytelling | 이야기 풀어가듯 | "오늘 한 가지 이야기를 들려드릴게요..." |

**한 paragraph = 한 문장.** 이 원자성이 뒤 단계(pd-chunk의 `sentences[]`, 발표자
노트, 원자성 검증)의 기준이다. 두 문장을 한 paragraph에 넣지 않는다.

### Step 4: 출력 파일 저장

**script.json** (원문 스키마 그대로 + 전역 문장 번호):

```json
{
  "title": "AI 시대의 가치 노동",
  "description": "1줄 설명",
  "tone": "storytelling",
  "audience": "고등학생",
  "target_slides": 13,
  "chapters": [
    {
      "id": "ch01",
      "title": "도입 — 하청 개발사 이야기",
      "intent": "hook",
      "paragraphs": [
        { "n": 1, "text": "오늘 커뮤니티에서 읽은 에피소드 하나를 들려드릴게요.", "pause_after": 0.5 },
        { "n": 2, "text": "어떤 회사에서 하청 개발사에게 사내 시스템 개발을 의뢰했는데요.", "pause_after": 0.3 }
      ]
    }
  ]
}
```

`n`은 **파일 전체에서 1부터 이어지는 전역 번호**다. 챕터가 바뀌어도 리셋하지 않는다.
pd-chunk가 이 번호로 비트를 묶고, 원자성 검증이 이 번호를 센다.

`chapters[].intent` 어휘: `hook` · `question` · `define` · `explain` · `compare` ·
`example` · `emphasize` · `list` · `cta`.

**script.md** (사람이 읽기 쉬운 형태):

```markdown
# AI 시대의 가치 노동

## CH01. 도입 — 하청 개발사 이야기
[intent: hook | tone: storytelling]

오늘 커뮤니티에서 읽은 에피소드 하나를 들려드릴게요.
어떤 회사에서 하청 개발사에게 사내 시스템 개발을 의뢰했는데요.
```

### Step 5: 프로젝트 초기화

```json
// <출력 폴더>/project.json
{ "id": "{pid}", "name": "프레젠테이션 제목", "status": "scripted", "pipeline": "pd" }
```

## 출력

```
<출력 폴더>/
  ├── project.json     # status: "scripted"
  ├── script.json      # 구조화된 대본 (전역 문장 번호 포함)
  └── script.md        # 읽기 쉬운 대본
```

## 다음 단계

대본을 사용자가 검토·수정한 뒤:
```
/pd-chunk <폴더>     # script.json → beats.json (연출 메타)
/pd-scene <폴더>     # beats.json → scene-plan.json → plan.md
```
