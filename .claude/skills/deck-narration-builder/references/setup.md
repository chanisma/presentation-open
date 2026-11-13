# 준비물 · 라이선스

이 파이프라인의 무거운 부품(모델·가상환경·중간 작업물)은 전부 **저장소 밖**에 있다. 완성 영상만 저장소 루트
`presenter-media/`(gitignore)에 둔다. 이 문서는 새 PC에서 다시 갖추는 순서와,
무엇을 저장소에 들여도 되고 무엇은 안 되는지를 적는다. 경로는 `scripts/narr.py`의 `NARR_*` 환경변수로 바꾼다.

## 1. 라이선스 — 먼저 지킬 것

| 부품 | 라이선스 | 저장소와의 관계 |
|---|---|---|
| OmniVoice (k2-fsa) | Apache-2.0 | pip 패키지 + 허깅페이스 모델. 생성한 음성은 자료로 써도 된다 |
| MiniMax H3 (ComfyUI 모델) | 모델 배포처의 약관을 따른다 | 모델은 ComfyUI 폴더에만. 생성한 영상만 쓴다 |
| H3 ref2va 워크플로 JSON | OpenMontage — **AGPL-3.0** | **복사 금지.** `NARR_H3_WORKFLOW` 경로로 읽기만 한다. 노드 id(6·7·8·15·20·4·5)에 기대어 입력을 바꾼다 |
| Robust Video Matting | **GPL-3.0** | **복사 금지.** `torch.hub.load('PeterL1n/RobustVideoMatting', …)`로 `~/.cache/torch/hub`에서만 부른다 |
| VoiceStudio (DEBPLALASH) | AGPL | 참고만 했다. 코드를 쓰지 않는다 — 모델(OmniVoice)만 쓴다 |
| faster-whisper · librosa · PyAV | MIT · ISC · BSD | pip |

`scripts/`의 코드는 이 저장소 코드(MIT)다. 위 부품의 소스를 `scripts/`로 옮겨 붙이는 순간 파생물이 된다.

## 2. 파이썬 가상환경 (OmniVoice · Whisper · RVM · 매팅)

모든 스크립트를 이 가상환경 하나로 돌린다(`$PY`). 이 PC: `C:\AI\tts\omnivoice-venv`.

```bash
python -m venv C:/AI/tts/omnivoice-venv
C:/AI/tts/omnivoice-venv/Scripts/python.exe -m pip install torch==2.8.0 torchvision==0.23.0 --index-url https://download.pytorch.org/whl/cu128
C:/AI/tts/omnivoice-venv/Scripts/python.exe -m pip install omnivoice faster-whisper librosa soundfile av pillow numpy
```

확인한 버전: torch 2.8.0+cu128 · omnivoice 0.2.1 · faster-whisper 1.2.1 · librosa 0.11.0 · av 18.1.0.
첫 실행 때 OmniVoice(`k2-fsa/OmniVoice`)·Whisper large-v3·RVM 가중치를 내려받는다.

## 3. ComfyUI + MiniMax H3

이 PC: `C:\AI\ComfyUI` (자체 venv). 실행: `.\venv\Scripts\python.exe main.py --port 8188 --reserve-vram 2.0`.
워크플로가 부르는 모델 파일(`models/` 아래 해당 폴더):

| 노드 | 종류 | 파일 |
|---|---|---|
| 1 | UNETLoader | `minimax_h3_ref2va_pruned_int8_convrot.safetensors` |
| 2 | LoraLoaderModelOnly | `minimax_h3_ref2v_turbo_4step_v0.1_comfyui_bf16.safetensors` (4스텝) |
| 3 | CLIPLoader (type minimax) | `qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors` |
| 4 | VAELoader (영상) | `minimax_h3_video_vae_fp16.safetensors` |
| 5 | VAELoader (소리) | `minimax_h3_audio_vae_fp32.safetensors` |

h3.py가 더하는 노드: `LoadAudio`(21) → `MiniMaxH3AddGuide`(22, 오디오 가이드 frame 0) → 사슬이면
`LoadImage`(23) → `MiniMaxH3AddGuide`(24, 이미지 가이드 frame 0). `MiniMaxH3ReferenceToVideo`(6)의
`length`는 17k+5 프레임(24fps), `ref_image_size: match`.

VRAM: RTX 5090 32GB에서 ComfyUI가 약 30GB를 쥔다 — TTS와 동시에 못 돌린다(run.py --tts가 `/free`로 비운다).
시스템 RAM 32GB에서 한 번 메모리 압박으로 작업이 강제 종료됐다 — 긴 작업 중에는 브라우저 등 무거운 프로그램을 닫는다.

## 4. ffmpeg

`NARR_FFMPEG`(없으면 PATH, 그다음 이 PC의 `C:\Users\User\Desktop\08_소프트웨어\ffmpeg-…\bin\ffmpeg.exe`).
libvpx-vp9(투명 WebM 인코딩·디코딩)·libx264·libopus가 들어 있는 빌드여야 한다. ffprobe는 같은 폴더.
record.mjs는 `NARR_FFPROBE`를 따로 본다.

## 5. 인물 이미지

`image-asset-builder` 스킬의 `gen_image.mjs`(Codex CLI의 image_gen). Codex 로그인 필요.

## 6. 서빙

기본: 완성본을 저장소 루트 `presenter-media/`에 두면(= `NARR_MEDIA` 기본값) dev 서버가 `/presenter-media/`로
서빙한다(Range 지원) — 덱의 기본 주소도 `/presenter-media`. `.gitignore`와 `vite.config.ts`의 감시 제외에 이미 들어 있다.
다른 폴더를 쓰면 `node scripts/serve-media.mjs <폴더>`(5200) + `VITE_PRESENTER_BASE=http://127.0.0.1:5200`.
