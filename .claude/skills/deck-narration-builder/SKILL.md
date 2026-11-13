---
name: deck-narration-builder
description: >-
  완성된 React 덱에 "가상 발표자" 나레이션 영상을 입히는 스킬 — 발표자 노트를 대본으로 다듬고,
  오픈소스 TTS(OmniVoice)로 음성을, MiniMax H3(로컬 ComfyUI)로 그 음성에 입을 맞춘 인물 영상을 만들고,
  매팅(RVM)으로 배경을 지워 슬라이드 위에 투명하게 세운다. 클릭 단계마다 영상 한 편이 빌드와 함께 넘어간다.
  인물·목소리 조합(캐스트)을 여러 벌 둘 수 있다(?cast=<id>). 선택 사항으로 덱 전체를 발표자가 설명하는
  한 편의 mp4로 내보낸다. "나레이션 영상", "가상 발표자", "발표자 영상 오버레이", "슬라이드를 설명하는 영상",
  "덱에 목소리·발표자 입히기", "덱을 영상으로", "발표 영상 만들기", "캐릭터를 바꿔서 같은 영상" 등에 사용.
---

# 덱 나레이션 — 가상 발표자 영상 오버레이

완성된 네이티브 React 덱의 발표자 노트를 가상 발표자가 말한다. 슬라이드 오른쪽 아래에 배경 없이 서서
그 장을 설명하고, 클릭하면 빌드와 다음 발표 조각이 함께 넘어간다. 원형:
`data/정보화부/교사중심-AI지원체계/` (`?deck=teacher-centered-ai`, 애니메이션 캐스트는 `&cast=anime`).

```
노트(notes.ts) ─make_narration→ narration.json(대본·자리) ─┐
인물 이미지(Codex) + 목소리(OmniVoice 설계) → cast.json ───┤
                                                           ├ tts.py  → 음성 조각 + Whisper 받아쓰기
                                                           ├ h3.py   → 조각마다 입 맞춘 인물 영상 (ComfyUI)
                                                           ├ assemble.py → 클릭 단계별 영상
                                                           └ matte.py → 투명 WebM + 투명 포스터
덱: <Presenter {...presenterFor(narration, n)} />  ← presenter-media/<media>[-<cast>]/ (gitignore, dev 서버가 서빙)
[선택] record.mjs + compose.py → 덱 전체 한 편의 mp4   (references/video-export.md)
```

**비용 감각**: RTX 5090 기준 H3 조각(≤13초) 1개 ≈ 1분. 21장 · 약 200조각 · 20분 분량이면 음성 15분 + 영상
3~4시간 + 매팅 수 분. 영상은 장당 수 MB, 21장 약 270MB(캐스트마다) — **git에 넣지 않는다.**
완성본은 저장소 루트 `presenter-media/`(gitignore·Vite 감시 제외), 중간 작업물(음성 조각·H3 원본·녹화 프레임)은
저장소 밖 `C:/AI/narration/`.

## 0. 먼저 읽기

- `references/setup.md` — 준비물(OmniVoice 가상환경, ComfyUI + H3 모델, ffmpeg, RVM)과 **라이선스**.
  OpenMontage 워크플로(AGPL)·RVM 코드(GPL)는 저장소로 복사하지 않고 경로·torch.hub로만 쓴다
- 스크립트는 전부 `scripts/`. 파이썬은 OmniVoice 가상환경 하나로 돌린다(아래 `$PY`)
- 경로 설정은 `scripts/narr.py` 머리 주석 — `NARR_*` 환경변수, 없으면 이 PC 기본값

```bash
PY=C:/AI/tts/omnivoice-venv/Scripts/python.exe      # 준비물 참고
S=.claude/skills/deck-narration-builder/scripts
P="data/<그룹>/<과목>/<수업>/presenter"                # 자료 폴더의 presenter/
export PYTHONIOENCODING=utf-8
```

## 1. 대본 — `presenter/narration.json`

```bash
$PY $S/make_narration.py "<수업>/notes.ts" "$P" --deck <덱 id> --media <영상 폴더 이름> [--abbr 약어.json]
```

노트의 `(클릭 n)`에서 단계를 나누고, 연출 괄호를 지우고, 숫자·영문을 한글 발음으로 푼다
(2,800억 → 이천팔백 억, 31% → 삼십일 퍼센트, AI → 에이아이). **초안은 반드시 사람이 다듬는다**:

- **단계 수 = 덱의 클릭 수 + 1** 인지 장마다 맞춘다. 발표자는 n번째 클릭에 n번째 영상을 튼다
- **빈 단계 금지** — 스크립트가 빈 단계를 알려 준다. 말할 것이 없는 단계라도 짧은 이음말을 넣는다
- 고유어 수사("열한 개", "두 가지"), 덱 고유 약어(`--abbr [["AIEP","에이아이이피"]]`), 받아쓰기 기호(「」)
- 발표 투로 — 슬라이드 카피를 읽지 말고 노트의 설명 문장을 말한다 (`eli5` 원칙 그대로)

`overlay`(발표자 자리)는 덱과 영상 합성이 **함께** 읽는 단일 원천이다:

```json
"overlay": { "media": "teacher-centered-ai", "size": [576, 704],
             "default": { "x": 1548, "y": 650, "w": 352 },
             "slides": { "10": { "x": 1600, "y": 713, "w": 300 }, "2": { "y": 674 } } }
```

좌표는 덱 설계 박스(1920×1080) px. 기본은 오른쪽 아래(w 352 → 높이 430). 본문과 겹치는 장만 줄이거나
옮기고, **인물의 윤곽(머리 폭)이 캐스트마다 다르니 캐스트를 추가하면 다시 확인한다**(애니메이션 캐스트의
넓은 머리가 2장 인용문 끝에 닿아 2장만 24px 내렸다).

## 2. 캐스트 — 인물 + 목소리 = `cast.json` / `cast-<id>.json`

기본 캐스트는 `cast.json`(영상 폴더 `<media>`), 추가 캐스트는 `cast-<id>.json`(영상 폴더 `<media>-<id>`,
덱은 `?cast=<id>`). 대본과 자리는 공유하고 인물·목소리·H3 프롬프트만 다르다.

```json
{ "id": "anime", "tag": "tcaa", "image": "presenter-ref-anime.png",
  "voice": { "engine": "OmniVoice (k2-fsa, Apache-2.0)", "instruct": "female, young adult, low pitch",
             "seed": 14, "language": "ko", "ref": "voice-ref-anime.wav", "ref_text": "안녕하십니까. …" },
  "h3": { "prompt": "… She says, in Korean: \"{text}\" … {tail}", "tail_end": "…", "tail_mid": "…" } }
```

- `tag` — ComfyUI 입력·출력 파일 이름 접두사. **캐스트마다 달라야** 두 작업의 파일이 섞이지 않는다

### 2a. 인물 이미지 (Codex)

`image-asset-builder`의 `gen_image.mjs`로 만든다(`--size 1024x1280`). 구도 조건을 프롬프트에 박는다:
**가슴 위 정면, 머리는 위쪽 1/3, 양손이 가슴 높이에서 보임(손짓 여지), 소품·글자 없음, 균일한 무지 배경,
고른 정면 조명.** 화풍이 다른 후보 2장을 나란히 붙여 보여 주고 **사용자가 고른다**(이번에는 셀 애니 대신
웹툰풍을 골랐다).

- **옷과 배경의 대비** — 매팅은 색이 비슷하면 윤곽이 번진다(초록 카디건 + 회녹색 배경). 대비가 약하면
  인물은 그대로 두고 배경만 바꾼다: 정지 이미지를 2초 영상으로 만들어 `matte.py --poster`로 오려
  대비되는 무지 배경(예: 웜그레이 #ECE9E2)에 다시 얹는다. 원본은 남겨 둔다(`anime-b.png` → `presenter-ref-anime.png`)
- 실존 인물을 흉내 내지 않는다

### 2b. 목소리 (OmniVoice 목소리 설계)

```bash
$PY $S/voice_design.py "$P" [--cast id] candidates 11 12 13 14   # 후보 + report.json
$PY $S/voice_design.py "$P" [--cast id] pick 14                  # → presenter/<voice.ref>, cast에 seed
```

`instruct`는 **고정 어휘만** 받는다(자유 문장 불가): `female|male`, `child|teenager|young adult|middle-aged|elderly`,
`very low|low|moderate|high|very high pitch`, `whisper`, `<나라> accent`. 쉼표+공백으로 잇는다.
report의 `f0_spread_st`(음높이 변화폭, 작을수록 차분)·`syl_per_s`(느긋함)·`match`(받아쓰기)는 보조 수치다 —
**후보 wav를 사용자에게 들려 주고 고르게 하는 것이 원칙.** "차분한" 요청에는 변화폭·속도가 가장 낮은 후보가
맞았다(7.6반음 · 5.4음절/초, 기존 목소리 10.7반음). 기준 음성은 자료 폴더에 두어 재현할 수 있게 한다.

### 2c. H3 프롬프트

인물 묘사 + 배경 + "Medium close-up, chest-up, static camera" + 차분한 손짓 + `She says, in Korean: "{text}"` +
오디오 묘사 + `{tail}`. `tail_end`(단계의 마지막 조각: 말을 마치고 입을 다물고 미소), `tail_mid`(중간 조각:
멈추지 않고 이어 말함). **일러스트 캐스트는 "Keep exactly the art style of the reference … not photorealistic,
not 3D"를 반드시 넣는다** — 빼면 실사로 끌려간다.

### 2d. 시범 한 조각 (필수)

```bash
$PY $S/tts.py "$P" --cast <id> 2                                    # 한 장 음성
ONLY=s2_step0_00.wav $PY $S/h3.py "$P" --cast <id> 2                 # 조각 하나 (ComfyUI 켠 뒤)
```

프레임 4장(처음·⅓·⅔·끝)을 뽑아 화풍 유지·입 모양·손짓을 보고, 배경을 지워 밝은·어두운 바탕에 얹어
윤곽을 본다. 사용자에게 보여 주고 전체로 넘어간다.

## 3. 음성 → 영상 → 매팅 (일괄)

```bash
# 터미널 1 — ComfyUI (VRAM 32GB 중 30GB를 쥔다)
cd C:\AI\ComfyUI && .\venv\Scripts\python.exe main.py --port 8188 --reserve-vram 2.0
# 터미널 2 — 음성까지 한 번에 (--tts는 ComfyUI의 VRAM을 먼저 비운다)
$PY $S/run.py "$P" --cast <id> --tts [장…]
```

`run.py`는 장마다 H3 → 조립 → 매팅을 돌리고 `=== slide N done …` / `H3_FAIL N` / `RUN_ALL_DONE`을 찍는다
(모니터는 이 줄을 잡는다). **몇 시간짜리는 사용자 터미널에서 돌리는 것이 안전하다** — Claude Code의
백그라운드 셸은 시스템 메모리가 부족하면 강제로 멈춘다(실제로 ComfyUI·파이프라인이 한밤중에 함께 멈췄다).
Claude가 돌릴 때는 `nohup … &`로 셸에서 떼어 띄우고 로그를 모니터한다.

음성 검수는 H3 전에:

```bash
$PY $S/check_tts.py "$P" --cast <id>        # ◀ 확인 표시만 귀로 듣는다 — [숫자·영문]은 표기 차이
$PY $S/tts.py "$P" --cast <id> --redo s5_step2_01.wav ["대본 수정본"]
```

부분 재생성: `ONLY=<조각>`(하나) · `ONLY_STEPS=0,2`(단계) · `MIN_IDX=3`(3번 조각부터) → 그 장만 `assemble.py`
→ `matte.py`. 자르는 규칙만 바꿨으면 `run.py … --skip-h3`(조립·매팅만, ComfyUI 불필요 — 21장 약 20분). 사슬 중간 조각을 다시 만들면 h3.py가 직전 조각 원본에서 이음새 프레임을 다시 뽑는다.

## 4. 검수 (BLOCKING — "생성 끝"은 완료가 아니다)

1. `$PY $S/verify_media.py "$P" --cast <id>` — 파일 네 종 모두·영상/소리/WebM 길이 일치·알파·**자리표시 사본 없음**
   ·**말이 끝난 뒤 0.6초 넘게 이어지는 단계 없음**(작업 폴더의 음성 길이로 계산)
2. **얼굴 유지** — 가장 긴 단계 8개의 끝 1.5초 전 프레임을 한 줄로 붙여 본다. 한 사람·한 화풍이어야 한다
3. 이음새 — 사슬을 끊은 자리(조각 3·6·9…)의 0.25초 크로스페이드가 잠깐 겹쳐 보이는 것은 정상
4. **브라우저** — 모든 장·단계에서 `currentSrc`가 그 단계 WebM이고 재생 중인지(Playwright, 5200 요청은
   `page.route`로 디스크 파일을 돌려줘도 된다), 발표자가 본문을 가리지 않는지 장마다 스크린샷
5. `npm run check` · `npm run build` · `node test/merge-smoke.mjs`
6. 받아쓰기로 판별할 수 없는 고유명사 발음(예: "뉴쌤"이 늘 "뉴스엠"으로 적힘)은 사용자에게 들어 보라고 알린다

## 5. 덱에 붙이기

```tsx
import { Presenter, presenterFor } from '../../../src/components/Presenter';
import narration from './presenter/narration.json';

function Page({ nav, notes, children, pres }: { …; pres?: number }) {
  const p = pres ? presenterFor(narration, pres) : null;
  return (<Slide full nav={nav} notes={notes}><Fit>{children}{p && <Presenter {...p} />}</Fit></Slide>);
}
// <Page nav="…" notes={NOTES[3]} pres={3}>…</Page>
```

- `Presenter`는 **1920×1080 설계 박스 안**에 둔다(`Fit` 패턴 — 원형 덱 참고). 좌표가 설계 px이기 때문
- 영상이 없거나 서버가 꺼져 있으면 조용히 숨는다. × 버튼으로 끄고 켠다(localStorage `presenter:hidden`)
- 사파리는 VP9 알파를 못 튼다 → 둥근 창 mp4로 대신. 썸네일(isStatic)은 포스터만
- 서빙: dev 서버가 `presenter-media/`를 `/presenter-media/`로 그대로 내준다(Range 지원) — 따로 켤 것 없다.
  다른 폴더·기기에서 볼 때만 `node scripts/serve-media.mjs [폴더]`(5200) + `VITE_PRESENTER_BASE=http://127.0.0.1:5200`.
  **배포**: `presenter-media/`는 build-static TARGETS 밖이라 배포본에 안 들어간다 → 발표자만 숨고 덱은 그대로.
  배포본에도 띄우려면 영상을 외부 저장소에 올리고 빌드 때 `VITE_PRESENTER_BASE`로 주소를 넘긴다
- **`presenter-media/`를 `data/` 아래로 옮기지 않는다** — build-static이 `data/`를 통째로 dist에 복사한다

## 6. [선택] 덱 전체를 한 편의 영상으로

`references/video-export.md` — 덱을 실시간 녹화(`record.mjs`)하고 발표자·소리를 합성(`compose.py`)한다.
캐스트를 바꾸면 단계 길이가 달라지므로 **녹화부터 다시** 한다.

## 7. 끝내기 전에

- `presenter/README.md`에 이번 캐스트·결과 폴더·길이·특이사항(위치 조정 등)을 적는다
- `prompts.md`에 사용자 프롬프트 전문 (`.claude/rules/prompt-log.md`)
- 커밋하지 않는다(사용자가 요청할 때만). 저장소에 들어가는 것은 대본·캐스트·참조 이미지·기준 음성뿐

## 함정 (겪은 순서)

| 증상 | 원인 → 처방 |
|---|---|
| 음성이 노이즈 | `generate(language_id=…)` → `language='ko'` |
| 목소리 설계 오류 | instruct에 자유 문장("calm and clear") → 고정 어휘만 |
| 조각 이음새에서 자세가 튄다 | 다음 조각 고정 프레임을 클립 끝에서 뽑음 → **자르는 지점**(음성 + 0.12초)에서 |
| 조각을 이을수록 잡티·대비, 7번째쯤 다른 얼굴 | 사슬 누적 → 단계마다·3조각마다 끊고 크로스페이드 (`MAXCHAIN=3`) |
| xfade 실패 | 시간축 불일치 → concat·xfade 뒤 `settb=1/24` |
| 일러스트 캐스트가 실사로 | 프롬프트에 화풍 유지 문구 |
| 머리카락 둘레 초록 테두리 | 옷·배경 색이 비슷 → 참조 이미지 배경만 교체 |
| 두 캐스트 파일이 섞임 | ComfyUI 입력 이름이 같음 → 캐스트마다 `tag` |
| TTS가 CUDA 메모리 부족 | ComfyUI가 VRAM을 쥐고 있음 → `/free`(run.py --tts가 한다) |
| 밤새 돌던 작업이 한꺼번에 멈춤 | Claude Code 메모리 압박 정리 → 사용자 터미널 또는 `nohup` |
| 받아쓰기 점수가 낮은데 멀쩡 | 숫자·영문 표기 차이 → check_tts의 [숫자·영문] 표시 |
| 배치 확인용 임시 사본이 남음 | verify_media의 "내용이 같은 파일" |
| **음성은 끝났는데 영상이 이어진다**(단계 끝, 최대 3초) | H3 조각은 17프레임 격자·최소 124프레임이라 음성보다 길고, "입을 다물라"를 따르지 않고 소리 없이 입을 움직인다 → assemble.py가 마지막 조각도 음성 + `TAIL_HOLD`(0.3초)에서 자른다. 이미 만든 영상은 `--skip-h3`로 다시 조립, 덱 전체 영상은 녹화 그대로 합성만 다시 |
