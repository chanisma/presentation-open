# 패킷의 여행 — 내 메시지는 어떻게 도착할까 (디오라마 샘플)

- 대상: 고1 정보 · 네트워크 도입 1차시 (데모/레퍼런스 덱)
- 렌더러: `react-deck-builder` + `diorama-deck-builder` (form: diorama 중심)
- 덱 id: `diorama-demo` · 8장
- 재사용 자산: 없음(신규 생성) — set `디오라마-샘플` / style `cartoon-diorama`
  - 무대: `images/stage-01~04.png` (1920×1080, image-asset-builder)
  - 스프라이트: `assets/sprites/디오라마-샘플/*.png`
- 척추(spine): 세계 지도 보드(stage-01) — 1장(훅) · 8장(회귀)에서 항로 누적
- 캐릭터 인벤토리: 패킷 4포즈(idle/walk-a/walk-b/worry) · 라우터 문지기 2포즈 · 소품 2

## 흐름 근거

"인터넷이 어떻게 동작하나"는 용어 나열로 가르치면 남지 않는다. **편지 한 통이
직접 여행하는 사건**으로 만들면 쪼개기(패킷)·주소(IP)·길찾기(라우터)·재조립(TCP)이
여정의 사건으로 순서대로 붙는다. 그래서 form은 diorama, 척추는 지도다.

---

- slide 1 | form: diorama · 역할 spine · 훅(S11)
  stage: 세계 지도 보드 (stage-01) | framing: wide
  intent: 메시지는 직선으로 가지 않는다 — 왜?
  overlays: RouteDraw ghost(직항 점선) → 실제 지그재그 항로 · LabelChip "내 컴퓨터"/"친구 컴퓨터" · 타이틀
  actors: 없음 (보드만)

- slide 2 | form: diorama · 역할 chapter-card (S10)
  stage: 없음 — 다크 틴트 배경(코드)
  intent: 1막 "쪼개기"로 진입
  overlays: 타이핑 제목 + Caret · 모서리 장식

- slide 3 | form: diorama · 역할 episode
  stage: 밤의 책상 (stage-02) | framing: wide
  intent: 메시지는 통째로 가지 않고 조각(패킷)이 되어 출발한다
  actors: packet(idle, 좌측 등장 ghost)
  overlays: Bubble "나 지금 출발해!" · LabelChip "패킷 = 메시지 조각" · HandNote "한 통 → 여러 조각"

- slide 4 | form: diorama · 역할 episode(같은 무대 펀치인 — S1 프레이밍 컷)
  stage: stage-02 | framing: 펀치인 scale 1.45
  intent: 모든 조각은 받는 사람 주소(IP)를 달고 있다
  actors: packet(idle, 크게)
  overlays: Stamp "받는 곳 · IP 주소" 슬램 + Stage shake + SpeedLines · Build 1: 정의 한 줄
  impact: shake 1 · speedlines 1

- slide 5 | form: diorama · 역할 episode
  stage: 관문(라우터) (stage-03) | framing: wide
  intent: 라우터는 목적지를 모른다 — "다음 한 걸음"만 안다
  actors: packet(walk-a/walk-b 걷기 → idle, 좌→중앙) · keeper(등장 ghost, 우측)
  overlays: LabelChip flag "라우터" · 팻말 3방향 라벨(A·B·C) · Bubble "다음 길만 알려줄게"
  impact: 도착 DustPuff 1

- slide 6 | form: diorama · 역할 episode
  stage: 해저 케이블 (stage-04) | framing: wide
  intent: 바다 밑 케이블이 진짜 인터넷의 몸이다
  actors: packet(idle, 케이블 위를 Traveler로 이동)
  overlays: RouteDraw(케이블 경로) · HandNote "빛으로 0.07초" · LabelChip "해저 광케이블"
  impact: 도착 SpeedLines 1

- slide 7 | form: diorama · 역할 closeup
  stage: 없음 — 추상 배경(코드 그라데이션) + 배우 확대
  intent: 조각은 순서가 섞여 도착한다 — 다시 맞추는 건 누구?
  actors: packet(worry, 클로즈업 h 70)
  overlays: 생각 풍선(Bubble tone dark) · Build 1: "TCP가 번호대로 재조립" + WavyUnderline

- slide 8 | form: diorama · 역할 spine 회귀 (S12)
  stage: 세계 지도 보드 (stage-01) | framing: wide
  intent: 여정 전체를 한 화면에 — 쪼개고 · 길 찾고 · 다시 맞춘다
  actors: packet(idle, 도착점에 재등장)
  overlays: 완성된 항로 + Stamp 3개(쪼개기·길찾기·재조립, stagger) · 주제 한 문장
  impact: 스탬프마다 pulse

## 검증 체크

- form 3연속 동일? — 전량 diorama이나 **역할이 순환**(spine·card·episode×4·closeup·spine)하고
  무대·프레이밍이 매 장 다르다
- 무대당 슬라이드 수: stage-01 ×2(1·8, 누적 상태 다름) · stage-02 ×2(3·4, wide/펀치인) · 나머지 ×1 → OK
- 말풍선 3회(3·5·7) — 연속 아님 OK
- 임팩트 슬라이드당 ≤3 OK
