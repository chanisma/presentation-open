---
name: live-upgrade
description: 이미 만들어져 있는 수업(덱)을 실시간 참여(live) 가능 버전으로 변환하는 스킬. 덱 유형 감지 → opt-in 삽입 → 덱 내용 기반 quiz.json 문항 저작 → pages.json LIVE 배지까지 한 번에. "이 수업 live 되게 해줘", "라이브 변환", "기존 덱에 실시간 퀴즈 붙여줘", "live 가능한 버전으로 업데이트", "발표 시작 버튼 나오게 해줘" 등을 언급하거나 기존 수업 폴더를 라이브 수업으로 업그레이드할 때 사용.
---

# Live Upgrade — 기존 수업의 라이브 변환

이미 만들어진 수업 폴더(`data/<그룹>/<과목>/<주제>/`)를 실시간 참여 가능 버전으로 변환한다.
**기계적 단계는 스크립트가, 문항 저작은 에이전트가** 한다. 문항 저작 원칙·스키마·백엔드는
전부 live-quiz-builder 스킬을 따른다 (이 스킬은 그 위의 변환 워크플로우).

## 절차

1. **덱 파악**: 대상 폴더의 `index.html`을 읽고 수업 흐름을 파악한다
   — 슬라이드별 주제, 오개념이 갈릴 개념 체크 지점, 실습 여부(코드 문항 후보).
2. **변환 스크립트 실행** (idempotent — 재실행 안전):
   ```
   python .claude/skills/live-upgrade/scripts/upgrade_to_live.py "data/<그룹>/<과목>/<주제>"
   ```
   - Contract v1 덱(deck.js)은 그대로, legacy 덱이면 `</body>` 직전에 opt-in 태그 삽입
     (상대경로 깊이 자동 계산: `data/<그룹>/<과목>/<주제>/` → `../../../../`)
   - pages.json 해당 엔트리에 `"live": true` → 뷰어 LIVE 배지 + [▶ 발표 시작]
   - pages.json 미등록 덱이면 경고가 나온다 → 먼저 `update_pages_json.py`(notebooklm-lesson-deck 스킬)로 등록
3. **문항 저작**: 1에서 파악한 내용으로 `<수업폴더>/quiz.json` 작성.
   live-quiz-builder의 "문항 설계 원칙" 준수 — 개념 체크 지점 배치, choice 오답은 실제 오개념
   (`misconceptions` 라벨), 핵심 1~2개만 `peerInstruction`,
   마지막에 `exit`(출구티켓), 실습 수업이면 `code`(+`solution` 모범 답안).
   스피드 퀴즈(gamification)는 문항 필드가 아니라 **세션 생성 시 옵션**임을 사용자에게 안내.
   슬라이드 인덱스 바인딩(`slide`: 0-base)은 덱의 `.slide` 순서를 세어 정확히 지정하고,
   애매하면 생략(비귀속 — 미니바 [문항 ▾]에서 열기).
4. **검증 (BLOCKING)**:
   ```
   python .claude/skills/live-quiz-builder/scripts/validate_live_config.py "data/<그룹>/<과목>/<주제>"
   ```
5. **동작 확인 안내**: 뷰어에서 해당 카드에 LIVE 배지·[▶ 발표 시작]이 보이는지,
   콘솔에서 세션 생성 시 '덱 문항' 미리보기가 뜨는지 사용자에게 안내한다.

## 주의

- 덱 HTML은 opt-in 1줄 외에는 **절대 수정하지 않는다** (문항은 quiz.json으로만).
  문항을 슬라이드 화면에 크게 렌더해야 하면 live-quiz-builder 절차 B(덱 마크업)를 따로 적용.
- `?live=` 없이 열면 100% 기존 동작 — 변환해도 일반 수업 사용에 영향 없음.
- 문항 `id`(slide_key)는 세션에서 한 번 사용한 뒤 변경 금지 (집계가 분리됨).
- 정답이 quiz.json(공개 URL)에 포함되므로 형성평가 전용, 성적 반영 금지.
- 일괄 변환 요청("전부 다 live 되게") 시: pages.json의 페이지들을 순회하되,
  **문항 저작은 덱마다 내용을 읽고 개별적으로** 한다 — 템플릿 복붙 금지.

## 파일 위치

- 변환 스크립트: `scripts/upgrade_to_live.py` (덱 감지·opt-in·LIVE 플래그)
- 문항 스키마·설계 원칙: `.claude/skills/live-quiz-builder/` (SKILL.md, references/live-markup.md)
- 검증기: `.claude/skills/live-quiz-builder/scripts/validate_live_config.py`

## 마무리 — 프롬프트 기록 (모든 덱·활동지 작업 공통)

작업을 끝내기 직전, 사용자가 이 자료를 위해 입력한 프롬프트를 자료 폴더의 `prompts.md`에
**전문 그대로** 덧붙인다. 형식과 제외 규칙은 `.claude/rules/prompt-log.md`. 최초 요청이면
머리글에 이 스킬 이름을 적는다 (`· /<스킬명>`). 첨부 이미지는 세션 id와 순번만.
