# BytePlus walkthrough 재제작

기존 범용 목업을 제거하고 실제 공개 Playground의 화면 구조로 2·4장을 다시 제작했다.

- 출처: https://ai.byteplus.com/en/playground/model
- 영상 화면: https://ai.byteplus.com/en/playground/model/gen_video?model=dreamina-seedance-2-5-260628
- 실사: tmp/byteplus-models.png, tmp/byteplus-video.png, tmp/byteplus-real/{mode,settings,seconds}.png 및 같은 이름의 DOM 텍스트.
- 2장: 우측 상단 Sign in, 좌측 상단 모델명, 중앙 Featured 탭·모델 카드, 하단 입력창. Seedance 카드 클릭 후 영상 입력창으로 이동.
- 4장: 모델명과 중앙 Reference·입력창·아래 설정 줄·오른쪽 ↑ 위치 유지. 설정 줄 클릭 → Ratio 9:16 → Resolution 480P → Duration Seconds → 5s → 바깥 클릭으로 패널 닫기. 이 설정 선택은 실제 브라우저로 확인했다.
- 실제 기본값 16:9·720P·smart time을 먼저 표시하고 클릭 후 값이 바뀐다. 수업용 모델 예시는 공개 화면에서 확인한 Seedance 2.5다.
- 긴 시간 선택지와 무관한 에셋 갤러리는 축약했다. 실제 로그인, 결제, 영상 생성 접수·완료는 실행하지 않았으며 성공 화면도 만들지 않았다.
- 검수: 1920×1080·1280×720에서 주요 국면 캡처, 영역 경계와 페이지 오류 확인. 클릭 대상의 실제 위치를 측정해 포인터 좌표를 연결한다.
