# 스페이스기전 데스크 자동화 업무 사용법 — 나레이션 안내 영상

- 덱: `?deck=automation-guide` (네이티브 React · 씬 11장) · 영상: `presenter-media/video/automation-guide-voice.mp4`
- 유튜브(일부 공개, 2026-10-25): https://youtu.be/YQ5DcpEGQms
- 대상: 에이전트를 처음 쓰는 선생님. 길지 않게(약 7분), 스킬·MCP를 비유로 짧게.
- 근거: NEIS_helper `app/core/automation.py` · `app/core/spacekijun_mcp.py` · `app/web/popover.js`(자동화 업무 패널) ·
  `app/resources/skills/*/SKILL.md`·`skill.json` (데스크 1.3.34, 2026-10-25 pull) · spacekijun `docs/features/mcp-agent.md`,
  `supabase/migrations/20261023150000_mcp_student_profile_attendance.sql`(데이터 카탈로그·학생 공개 등급).

## ELI5 적용 원칙

- 청중: 교사(에이전트 초보). 용어는 나오자마자 생활 비유로 푼다 — 에이전트 = 직접 일하는 AI 조수, 스킬 = 업무 매뉴얼, MCP = 출입증·플러그.
- 한 문장에 생각 하나. 각 장은 «그래서 무엇을 할 수 있나»로 닫는다.
- 정확성: 기능 이름·승인 절차·데이터 범위는 코드·스킬 문서와 같게. 예시 대화는 재구성 화면임을 화면에 표기.

## 구성 (장 · 형태 · 메타포)

| # | 제목 | 형태 | 메타포 |
|---|---|---|---|
| 1 | 말 한 줄로 맡기는 학교 업무 | scene · 실화면(독) | 탐조등이 독의 마법봉에 멈춤 → 한 문장이 세 시스템으로 갈라져 «완료» 도장 |
| 2 | 에이전트 · 스킬 · MCP | scene | 조수(터미널) + 매뉴얼 바인더 + 출입증 |
| 3 | 스킬 | scene | 폴더 나무 + 펼쳐지는 SKILL.md, 절차 체크 |
| 4 | MCP | scene | 플러그가 SPACEKIJUN 콘센트에 꽂히고 허용된 서랍만 켜짐 |
| 5 | 자동화 업무 패널 | scene · 실화면(패널) | 실제 패널을 구역별로 스크롤·강조, 연결 안 함 → 인증 중 → 연결됨 |
| 6 | 쿨메신저 쪽지 | scene · 재구성 대화 | 쪽지 봉투가 승인 관문에서 멈췄다가 보낸 쪽지함으로 |
| 7 | 리로스쿨 문자 | scene · 재구성 | 휴대폰 + 발송 미리보기 영수증 + 승인 도장 |
| 8 | SPACEKIJUN 업무 도구 | scene | 요청 → 확인 → 결과 계단 세 칸 |
| 9 | 스킬 엮어 쓰기 | scene | 요청 기차가 세 역(일정 → 명단 → 쪽지)을 지남 + 노선도 둘 |
| 10 | 읽을 수 있는 데이터 | scene | 자료 보관함 서랍 네 칸 + 잠긴 서랍 |
| 11 | 안전하게 쓰기 | scene | 세 줄 수칙 + 마법봉 |

## 영상 만들기

```
node video/subs.mjs                                   # 자막(SUBS) → video/narration.json
C:/AI/tts/omnivoice-venv/Scripts/python.exe video/tts.py   # ElevenLabs 녹음 + Whisper 검수
node video/voice.mjs                                  # 녹음 길이 → voice.ts (장면 시각이 목소리를 따라감)
node video/record.mjs ../../../presenter-media/automation-guide/rec    # dev 서버 5199
python video/compose.py ../../../presenter-media/automation-guide/rec ../../../presenter-media/video/automation-guide-voice.mp4 --voice --fade-in
```
