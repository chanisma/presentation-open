# 히브리어로 보는 창세기 1장 — 디오라마판

- 대상: 성경 히브리어 입문 (동아리·성인 강좌) 1차시
- 렌더러: `react-deck-builder` + `diorama-deck-builder` (전 슬라이드 form: diorama)
- 덱 id: `hebrew-genesis-diorama` · 11장
- 원본: `히브리어-창세기1장-씬`(동적 씬, HTML 11씬) — **교육 내용·히브리어 8단어·아크를
  그대로 계승**하고 표현만 무대·배우·오버레이 3층으로 다시 짠다.

## 왜 디오라마인가

원본은 각 씬이 고유 메타포(삼각측량·발굴·봉인·계기판·품는 새·점화 스위치·대칭
블루프린트·도장 컨베이어·조각과 흙·균열·저울)를 가진 **추상 도형 씬**이었다. 그런데 이
수업의 뼈대는 *사건과 여정*이다 — 태초에서 출발해 균열을 지나 약속의 성취에 닿는 한 줄기
이야기. 그래서 무대(창조의 장소들) 위에 **필사자(해설자)** 가 서서 단어를 캐내고 도장을
찍는 3층 문법이 이 내용에 더 맞는다. 신적 존재는 **그리지 않는다** — 무대와 빛이 대신한다.

## 자산

- set `히브리어-사본` / style `illuminated-manuscript` (양피지 크림 · 세피아 잉크 ·
  라피스 블루 · 금박 · 포도주색)
- 무대 6장: `images/stage-01~06.png` (1920×1080, 하단 1/3 비움)
  - 01 펼쳐진 빈 두루마리 보드 **(척추)** · 02 필사실 · 03 발굴 트렌치 ·
    04 혼돈의 수면 · 05 정돈된 세계(하늘·바다·땅) · 06 균열의 저녁
- 스프라이트 8종: `assets/sprites/히브리어-사본/`
  - 필사자 4포즈(idle · write · point · wonder) · 뱀 · 저울 · 품는 새 · 봉인 도장
- 추상 무대(9쪽 클로즈업)는 생성하지 않고 `<Stage bg="radial-gradient(...)">`로

## 척추(spine) — 빈 두루마리 보드 (stage-01)

1쪽(훅)·8쪽(창조 완성 후 복귀는 생략, 대신 11쪽)·11쪽(클로징)에서 재등장하며 **진행이
누적**된다: 훅에서 세 번역이 한 점으로 수렴 → 마지막에 그 점에서 뻗어 나간 선이
`τετέλεσται`로 닫히며 수미상관.

---

- slide 1 | form: diorama · 역할 spine · 훅(S11)
  stage: 빈 두루마리 보드 (stage-01) | framing: wide
  intent: 번역 셋이 각자 다른 방향에서 가리키는 단 하나의 원문이 오늘의 본문이다
  actors: scribe(idle, 우측 · ghost 입장)
  overlays: LabelChip ×3 "개역개정 태초에" "새번역 한처음에" "KJV In the beginning" ·
    RouteDraw 3선이 한 점으로 수렴 · Stamp `בְּרֵאשִׁית` 베레쉬트 + 타이틀
  impact: 수렴 순간 SpeedLines 1

- slide 2 | form: diorama · 역할 episode
  stage: 발굴 트렌치 (stage-03) | framing: wide
  intent: 단어 하나를 파 내려가면 뿌리에 닿는다 — 이 뿌리를 결말에서 다시 캔다
  actors: scribe(point, 좌측)
  overlays: LabelChip 3층 `בְּרֵאשִׁית`(표층·태초에) → `רֵאשִׁית`(중간층·시작) →
    `רֹאשׁ`(뿌리·머리) · RouteDraw 수직 하강 · HandNote "결말에서 다시 캔다"
  impact: 뿌리 도달 Stamp + shake

- slide 3 | form: diorama · 역할 episode
  stage: 필사실 (stage-02) | framing: wide
  intent: 히브리어에는 하나님만 주어가 되는 창조의 동사가 따로 있다
  actors: scribe(write, 좌측)
  overlays: 동사 카드 3개 — `עָשָׂה`(아사·만들다, 사람도 함) `יָצַר`(야차르·빚다, 토기장이도 함)
    는 회색 처리, `בָּרָא`(바라·창조하다)에 Stamp "CREATOR ONLY"
  impact: 도장 slam + shake

- slide 4 | form: diorama · 역할 episode (같은 무대 펀치인 — S1)
  stage: stage-02 | framing: 펀치인 scale 1.45
  intent: 복수형 주어에 단수형 동사 — 문법 자체가 이미 힌트다
  actors: scribe(wonder, 확대)
  overlays: `אֱלֹהִים`(복수형) + `בָּרָא`(단수형 동사) 칩 · WavyUnderline · Bubble "여럿이신 한 분?"
    · Build 1: 정리 한 줄

- slide 5 | form: diorama · 역할 episode
  stage: 혼돈의 수면 (stage-04) | framing: wide + dim
  intent: 태초의 땅에 없던 것은 정확히 두 가지였다
  actors: scribe(idle, 우측 바위 위 · 작게)
  overlays: 빈 칩 2개 `תֹהוּ`(토후·형태 없음) `בֹהוּ`(보후·비어 있음) · FocusVignette
    · LabelChip "창세기 1:2"

- slide 6 | form: diorama · 역할 episode (같은 무대 반전 — S1)
  stage: stage-04 | framing: flip + blur 살짝
  intent: 혼돈 위에 있던 것은 무관심이 아니라 품는 돌봄이었다
  actors: hover-bird(수면 위, 날개 bob) · scribe 없음
  overlays: `רוּחַ מְרַחֶפֶת`(루아흐 메라헤페트 · 품다, 날개 치며 맴돌다) ·
    HandNote "신명기 32:11 — 같은 단어"

- slide 7 | form: diorama · 역할 episode
  stage: 정돈된 세계 (stage-05) | framing: wide
  intent: 말과 사건 사이에 어떤 틈도 없다
  actors: scribe(point, 좌측)
  overlays: `יְהִי אוֹר`(예히 오르 · 빛이 있으라) → `וַיְהִי־אוֹר`(바예히 오르 · 빛이 있었다) ·
    두 칩 사이 "아무것도 없음" · 도구·재료·시간차 취소
  impact: 명령 순간 SpeedLines + shake

- slide 8 | form: diorama · 역할 episode (같은 무대 펀치인)
  stage: stage-05 | framing: scale 1.3
  intent: 앞 3일이 짓고 뒤 3일이 채운다 — 토후와 보후가 정확히 해결된다 (핵심 주장)
  actors: 없음 (도표가 주인공)
  overlays: 1~3일 / 4~6일 칩 6개 + RouteDraw 3쌍 매칭선 + `טוֹב` 도장 6개(stagger, pulse)
    + `טוֹב מְאֹד`(토브 메오드) 7번째
  impact: 7번째 도장 shake

- slide 9 | form: diorama · 역할 closeup (추상 무대)
  stage: 없음 — 어두운 금빛 그라데이션
  intent: 가장 낮은 재료에서 가장 높은 것을 닮은 존재가 나온다. 사람 앞에서만 명령이 상의로 바뀐다
  actors: scribe(wonder, 클로즈업 h 62)
  overlays: `נַעֲשֶׂה אָדָם`(나아세 아담 · 우리가 사람을 만들자) · `אֲדָמָה → אָדָם` ·
    `צֶלֶם`(첼렘 · 형상) · Build 1: "명령이 아니라 상의, 단수가 아니라 복수"

- slide 10 | form: diorama · 역할 episode
  stage: 균열의 저녁 (stage-06) | framing: wide
  intent: 사람이 숨은 그 상처 위에 전쟁이 선포된다
  actors: serpent(좌측 · slide 입장) · scribe(idle, 우측 끝 작게)
  overlays: `אֵיבָה`(에이바 · 원수 됨) Stamp가 균열 위에 slam · 뱀의 후손 / 여자의 후손 칩 ·
    LabelChip "창세기 3:15"
  impact: slam shake + DustPuff

- slide 11 | form: diorama · 역할 spine 회귀 (S12)
  stage: 빈 두루마리 보드 (stage-01) | framing: wide
  intent: 발꿈치와 머리의 값은 같지 않다 — 태초의 그 뿌리가 결말에서 다시 나온다
  actors: scale(저울 소품, 중앙) · scribe(idle, 좌측)
  overlays: `עָקֵב`(아케브 · 발꿈치 상처) vs `רֹאשׁ`(로쉬 · 머리) 저울 양쪽 ·
    `τετέλεσται`(테텔레스타이 · 다 이루었다) 봉인 도장 · `ἐν ἀρχῇ` ↔ `בְּרֵאשִׁית` 수미상관 선
  impact: 봉인 순간 SpeedLines + pulse

## 검증 체크

- 무대당 슬라이드: 01 ×2(1·11, 누적 상태 다름) · 02 ×2(3·4 wide/펀치인) · 03 ×1 ·
  04 ×2(5·6 wide/반전) · 05 ×2(7·8 wide/펀치인) · 06 ×1 → 모두 ≤ 3 OK
- 역할 순환: spine → episode ×5 → closeup → episode → spine (3연속 동일 역할 없음)
- 말풍선 2회(4·9쪽) — 연속 아님
- 임팩트 슬라이드당 ≤ 2
- 신적 존재 형상화 없음 · 이미지 안 텍스트 없음(히브리어는 전부 코드 오버레이)
