# Presentation Builder 테스트 시나리오

---

# Cycle 2: Playwright 웹 이미지 검색 기능 테스트

> 생성일: 2026-03-23 | 목적: web-search 이미지 기능 추가 후 스킬 테스트

---

## 시나리오 C2-1: 과학 수업 (이미지 검색 활성) - Bento Grid

- **제목**: 태양계 행성 탐험
- **대상**: 중학교 1학년
- **목적**: 수업자료 (과학)
- **디자인 스타일**: Bento Grid (#03)
- **슬라이드 수**: 10장
- **이미지 스타일**: `web-search` (Playwright)
- **카드 스타일**: minimal

### 슬라이드 구성 (이미지 필요 슬라이드 표시)
1. **표지 (cover)**: "태양계 행성 탐험" - 🌍 배경 이미지: 태양계 전경 [IMG: solar system planets]
2. **학습 목표 (stat-highlight)**: 3가지 목표
3. **태양계 소개 (section-overview)**: 태양계란? + highlight-box
4. **내행성 (card-grid 2x2)**: 수성, 금성, 지구, 화성 — 각 카드에 행성 이미지 [IMG: mercury/venus/earth/mars]
5. **외행성 (card-grid 2x2)**: 목성, 토성, 천왕성, 해왕성 [IMG 불필요 - 이모지]
6. **지구의 특별함 (image-focus)**: 지구 사진 + 설명 [IMG: earth from space blue marble]
7. **화성 탐사 (two-column)**: 탐사 역사 + 화성 사진 [IMG: mars surface rover]
8. **행성 크기 비교 (comparison)**: 표 형태
9. **퀴즈 (activity-list)**: 3문제
10. **마무리 (end)**: 요약 + 다음 시간 예고

### 테스트 포인트
- [ ] Playwright로 실제 이미지 검색 및 다운로드 동작
- [ ] image-focus 컴포넌트에 실제 이미지 삽입
- [ ] cover 배경 이미지 + 오버레이 구현
- [ ] card-grid 내 작은 이미지 (48x48) vs 이모지 혼용
- [ ] 이미지 파일명 규칙: img-{번호}-{키워드}.jpg
- [ ] loading="lazy" 속성 포함
- [ ] 이미지 로드 실패 시 fallback UI
- [ ] 슬라이드당 이미지 최대 1개 규칙 (카드 그리드 제외)

---

## 시나리오 C2-2: 역사 수업 (이미지 검색 활성) - Editorial Magazine

- **제목**: 조선시대 과학과 발명
- **대상**: 고등학교 1학년
- **목적**: 수업자료 (한국사)
- **디자인 스타일**: Editorial Magazine (#15)
- **슬라이드 수**: 12장
- **이미지 스타일**: `web-search`
- **카드 스타일**: minimal

### 슬라이드 구성
1. **표지 (cover)**: "조선시대 과학과 발명" [IMG: joseon dynasty science]
2. **목차 (toc)**: 6개 항목
3. **시대 배경 (section-overview)**: 조선 전기 과학 발전
4. **장영실 (two-column)**: 초상 + 업적 [IMG: jang yeongsilportrait]
5. **자격루 (image-focus)**: 자격루 사진/그림 [IMG: jagyeongru water clock joseon]
6. **측우기 (image-focus)**: 측우기 사진 [IMG: cheugugi rain gauge joseon]
7. **혼천의 (two-column)**: 혼천의 설명 + 이미지 [IMG: armillary sphere joseon]
8. **거북선 (image-focus)**: 거북선 복원 사진 [IMG: turtle ship geobukseon]
9. **조선 과학의 특징 (card-grid 2x2)**: 실용주의, 왕실후원, 중국기술수용, 독자발전
10. **현대와의 연결 (activity-list)**: 3가지 토론 주제
11. **정리 (stat-highlight)**: 핵심 수치
12. **마무리 (end)**: 감사 + 참고자료

### 테스트 포인트
- [ ] 역사적 유물/인물 이미지 검색 품질
- [ ] Editorial Magazine 스타일과 이미지 조화
- [ ] image-focus 3회 사용 시 시각적 단조로움 방지
- [ ] 한국사 관련 키워드의 영어 변환 품질
- [ ] 12장 프레젠테이션에서 이미지+텍스트 높이 예산 관리

---

## 시나리오 C2-3: 환경 프로젝트 (이미지 검색 활성) - Nordic Minimalism

- **제목**: 우리 학교 탄소 발자국 줄이기
- **대상**: 중학교 2학년 (프로젝트 발표)
- **목적**: 프로젝트 발표
- **디자인 스타일**: Nordic Minimalism (#10)
- **슬라이드 수**: 8장
- **이미지 스타일**: `web-search`
- **카드 스타일**: rounded

### 슬라이드 구성
1. **표지 (cover)**: "우리 학교 탄소 발자국 줄이기" [IMG: carbon footprint school]
2. **문제 정의 (two-column)**: 탄소 배출 현황 + 그래프 이미지 [IMG: carbon emissions graph education]
3. **조사 과정 (timeline)**: 4단계
4. **측정 결과 (stat-highlight)**: CO2 배출량, 전기 사용량, 쓰레기 양
5. **해결 방안 (card-grid 2x2)**: 분리수거, LED교체, 텀블러사용, 나무심기
6. **실행 결과 (image-focus)**: 활동 사진 [IMG: school environmental activity students]
7. **배운 점 (quote)**: 팀원 소감
8. **마무리 (end)**: 감사 + 실천 약속

### 테스트 포인트
- [ ] Nordic Minimalism 스타일(밝은 배경, 넓은 여백)에서 이미지 조화
- [ ] 환경/통계 관련 이미지 검색 품질
- [ ] 8장 짧은 발표에서 이미지 적절 배분
- [ ] rounded 카드 스타일과 이미지 border-radius 일치

---

## 시나리오 C2-4: 학부모 안내 (이미지 없음) - K-에듀 클린

- **제목**: 2026 방과후학교 프로그램 안내
- **대상**: 학부모
- **목적**: 학부모 안내
- **디자인 스타일**: K-에듀 클린 (#32)
- **슬라이드 수**: 8장
- **이미지 스타일**: `emoji` (이미지 검색 미사용)
- **카드 스타일**: minimal

### 슬라이드 구성
1. **표지 (cover)**: "2026 방과후학교 프로그램 안내"
2. **안내 목적 (section-overview)**: 방과후학교란?
3. **프로그램 목록 (card-grid 3x2)**: 6개 프로그램
4. **시간표 (comparison)**: 요일별 프로그램 표
5. **신청 방법 (task-list)**: 3단계
6. **자주 묻는 질문 (card-grid 2x2)**: FAQ
7. **비용 안내 (stat-highlight)**: 월 비용, 지원금
8. **마무리 (end)**: 연락처 + QR

### 테스트 포인트
- [ ] 이미지 검색 비활성 시 기존 emoji 방식 정상 동작
- [ ] K-에듀 클린 스타일 정확 구현
- [ ] 학부모 대상 공손 문체
- [ ] 이미지 없는 프레젠테이션의 시각적 완성도

---

## 시나리오 C2-5: 교사 연수 (이미지 없음) - Typographic Bold

- **제목**: 디지털 리터러시 교육 전략
- **대상**: 교사 연수
- **목적**: 교사 연수
- **디자인 스타일**: Typographic Bold (#11)
- **슬라이드 수**: 10장
- **이미지 스타일**: `placeholder` (이미지 검색 미사용)
- **카드 스타일**: minimal

### 슬라이드 구성
1. **표지 (cover)**: "디지털 리터러시 교육 전략"
2. **목차 (toc)**: 6개 항목
3. **배경 (two-column)**: 디지털 리터러시 정의 vs 필요성
4. **프레임워크 (section-overview)**: UNESCO 디지털 리터러시 프레임워크
5. **핵심 역량 (card-grid 2x2)**: 정보활용, 미디어이해, 디지털안전, 창작능력
6. **수업 적용 사례 (activity-list)**: 3가지 사례
7. **평가 방법 (comparison)**: 전통 vs 디지털 리터러시 평가
8. **실습 (task-list)**: 3단계 워크숍
9. **참고 자료 (card-grid 2x2)**: 4개 자료
10. **마무리 (end)**: 핵심 요약

### 테스트 포인트
- [ ] Typographic Bold 스타일 (큰 텍스트, 최소 장식)
- [ ] placeholder 이미지 스타일 정상 동작
- [ ] 이미지 없이도 시각적 풍부함 유지
- [ ] 교사 대상 전문 문체

---

## Cycle 2 테스트 커버리지

| 테스트 항목 | C2-1 | C2-2 | C2-3 | C2-4 | C2-5 |
|------------|------|------|------|------|------|
| **Playwright 이미지 검색** | ✓ | ✓ | ✓ | | |
| image-focus + 실제 이미지 | ✓ | ✓ | ✓ | | |
| cover 배경 이미지 | ✓ | ✓ | ✓ | | |
| two-column 이미지 | ✓ | ✓ | ✓ | | |
| card-grid 내 작은 이미지 | ✓ | | | | |
| 이미지 파일명 규칙 | ✓ | ✓ | ✓ | | |
| loading=lazy | ✓ | ✓ | ✓ | | |
| fallback UI | ✓ | ✓ | ✓ | | |
| 이미지 없는 프레젠테이션 | | | | ✓ | ✓ |
| emoji 모드 정상 | | | | ✓ | |
| placeholder 모드 정상 | | | | | ✓ |
| K-에듀 클린 스타일 | | | | ✓ | |
| Typographic Bold 스타일 | | | | | ✓ |
| 한국사 이미지 검색 | | ✓ | | | |
| 환경/과학 이미지 검색 | ✓ | | ✓ | | |

---
---

# Cycle 3: 고급 이미지 검색 기능 테스트

> 생성일: 2026-03-24 | 목적: Playwright 이미지 검색의 다양한 난이도와 사용 패턴 테스트

---

## 시나리오 C3-1: 세계의 명소와 문화유산 (Heavy Image Use) - Editorial Magazine

- **제목**: 세계의 명소와 문화유산
- **대상**: 중학교 2학년 학생
- **목적**: 수업자료 (사회/세계지리)
- **디자인 스타일**: Editorial Magazine (#15)
- **슬라이드 수**: 10장
- **이미지 스타일**: `web-search` (Playwright)
- **카드 스타일**: minimal
- **이미지 전략**: 모든 슬라이드에 최소 1개 이상 실제 웹 검색 이미지. cover-bg, image-focus, two-column, card-image 모두 활용.

### 슬라이드 구성

1. **표지 (cover)**: "세계의 명소와 문화유산" — 부제: "인류가 남긴 위대한 유산을 찾아서"
   - 이미지: `{ keyword: "world heritage sites collage aerial view", type: "photo", usage: "cover-bg", filename: "img-01-cover.jpg" }`

2. **문화유산 소개 (section-overview)**: "문화유산이란 무엇인가?"
   - 유네스코 세계유산의 정의와 등재 기준
   - 문화유산 vs 자연유산 vs 복합유산
   - 2024년 기준 전 세계 1,199건 등재
   - 이미지: `{ keyword: "UNESCO world heritage logo monument", type: "photo", usage: "two-column", filename: "img-02-unesco.jpg" }`

3. **마추픽추 (image-focus)**: "마추픽추 (페루)"
   - 잉카 제국의 잃어버린 도시
   - 해발 2,430m 안데스 산맥 위에 건설
   - 1983년 유네스코 세계유산 등재
   - 이미지: `{ keyword: "Machu Picchu panoramic view mountains", type: "photo", usage: "image-focus", filename: "img-03-machu-picchu.jpg" }`

4. **콜로세움 (image-focus)**: "콜로세움 (이탈리아)"
   - 로마 제국의 거대한 원형 경기장
   - 5만 명 수용 가능한 건축 걸작
   - 검투사 경기와 공연의 무대
   - 이미지: `{ keyword: "Colosseum Rome Italy sunset", type: "photo", usage: "image-focus", filename: "img-04-colosseum.jpg" }`

5. **앙코르 와트 (two-column)**: "앙코르 와트 (캄보디아)"
   - 세계 최대의 종교 건축물
   - 12세기 크메르 제국의 힌두교 사원
   - 정교한 부조와 탑 구조
   - 이미지: `{ keyword: "Angkor Wat temple Cambodia sunrise reflection", type: "photo", usage: "two-column", filename: "img-05-angkor-wat.jpg" }`

6. **만리장성 (two-column)**: "만리장성 (중국)"
   - 총 길이 약 21,196km
   - 2,000년에 걸쳐 건설된 방어 시설
   - 우주에서도 보인다는 전설 (실제로는 불가능)
   - 이미지: `{ keyword: "Great Wall of China aerial landscape", type: "photo", usage: "two-column", filename: "img-06-great-wall.jpg" }`

7. **타지마할 (image-focus)**: "타지마할 (인도)"
   - 무굴 제국 황제의 사랑의 기념물
   - 대리석으로 지어진 무덤 건축물
   - 완벽한 대칭 구조와 정원
   - 이미지: `{ keyword: "Taj Mahal India reflection pool", type: "photo", usage: "image-focus", filename: "img-07-taj-mahal.jpg" }`

8. **한국의 세계유산 (card-grid 2x2)**: "한국의 세계유산"
   - 석굴암과 불국사 / 해인사 장경판전 / 수원 화성 / 경주 역사유적지구
   - 이미지:
     - `{ keyword: "Bulguksa temple Gyeongju Korea", type: "photo", usage: "card-image", filename: "img-08a-bulguksa.jpg" }`
     - `{ keyword: "Hwaseong Fortress Suwon Korea", type: "photo", usage: "card-image", filename: "img-08b-hwaseong.jpg" }`
     - `{ keyword: "Seokguram Grotto Korea Buddha", type: "photo", usage: "card-image", filename: "img-08c-seokguram.jpg" }`
     - `{ keyword: "Haeinsa Temple Tripitaka Koreana", type: "photo", usage: "card-image", filename: "img-08d-haeinsa.jpg" }`

9. **세계유산 보호 (two-column)**: "세계유산 보호의 중요성"
   - 기후변화로 인한 유산 훼손 위기
   - 관광객 증가와 보존의 균형
   - 디지털 기술을 활용한 보존 노력
   - 이미지: `{ keyword: "heritage site conservation restoration work", type: "photo", usage: "two-column", filename: "img-09-conservation.jpg" }`

10. **마무리 (closing)**: "우리가 지켜야 할 인류의 유산"
    - 문화유산은 과거와 현재를 잇는 다리
    - 다음 세대를 위한 보존 실천
    - 이미지: `{ keyword: "children visiting world heritage site education", type: "photo", usage: "cover-bg", filename: "img-10-closing.jpg" }`

### 테스트 포인트
- [ ] 모든 10개 슬라이드에 웹 검색 이미지 포함 (총 14장)
- [ ] cover-bg 이미지 2회 사용 (표지, 마무리)
- [ ] image-focus 컴포넌트 3회 사용 시 시각적 다양성
- [ ] card-grid 4장 이미지 동시 검색 및 삽입
- [ ] 유명 랜드마크 키워드의 검색 품질 (쉬운 난이도)
- [ ] Editorial Magazine 스타일과 다수 이미지 레이아웃 조화
- [ ] 이미지 로드 실패 시 14장 중 fallback 처리

---

## 시나리오 C3-2: 인공지능과 미래 직업 (Mixed Content) - Glassmorphism

- **제목**: 인공지능과 미래 직업
- **대상**: 고등학교 1학년 학생
- **목적**: 진로 탐색 수업
- **디자인 스타일**: Glassmorphism (#01)
- **슬라이드 수**: 10장
- **이미지 스타일**: `web-search` + `emoji` 혼합
- **카드 스타일**: rounded
- **이미지 전략**: 일부 슬라이드는 웹 이미지, 일부는 이모지만 사용. 쉬운 검색어(robot, AI)와 어려운 검색어(prompt engineering, AI ethics concept) 혼합.

### 슬라이드 구성

1. **표지 (cover)**: "인공지능과 미래 직업" — 부제: "AI 시대, 나의 진로를 설계하다"
   - 이미지: `{ keyword: "artificial intelligence futuristic digital brain", type: "illustration", usage: "cover-bg", filename: "img-01-cover.jpg" }`

2. **AI란 무엇인가? (section-overview)**: AI 정의, 약한 AI vs 강한 AI, 머신러닝/딥러닝/생성형 AI 차이
   - 이모지: 🤖 (웹 이미지 없음 — emoji fallback 테스트)

3. **AI의 역사와 발전 (two-column)**: 1956 다트머스 → 2016 알파고 → 2022 ChatGPT
   - 이미지: `{ keyword: "AlphaGo vs Lee Sedol Go game 2016", type: "photo", usage: "two-column", filename: "img-03-alphago.jpg" }`

4. **AI가 바꾸는 산업 (card-grid 2x2)**: 의료, 금융, 교육, 제조
   - 이미지 (2장만):
     - `{ keyword: "AI medical diagnosis healthcare robot", type: "photo", usage: "card-image", filename: "img-04a-medical-ai.jpg" }`
     - `{ keyword: "smart factory robot manufacturing", type: "photo", usage: "card-image", filename: "img-04b-smart-factory.jpg" }`
   - 이모지 카드: 💰 (금융), 📚 (교육) — 이미지+이모지 혼합 카드 테스트

5. **사라지는 직업 vs 새로 생기는 직업 (image-focus)**: 단순 반복 → AI 대체, 프롬프트 엔지니어 등 신직업
   - 이미지: `{ keyword: "future jobs artificial intelligence infographic", type: "illustration", usage: "image-focus", filename: "img-05-future-jobs.jpg" }`

6. **AI 시대에 필요한 역량 (two-column)**: 컴퓨팅 사고력, 창의성, 감성 지능, 평생 학습
   - 이모지: 🧠 💡 🤝 📖 (웹 이미지 없음 — emoji 전용 슬라이드 테스트)

7. **프롬프트 엔지니어링이란? (two-column)**: AI 질문 설계, 구조: 역할+맥락+지시+형식
   - 이미지: `{ keyword: "prompt engineering ChatGPT interface example", type: "photo", usage: "two-column", filename: "img-07-prompt-eng.jpg" }`

8. **AI 관련 진로 탐색 (card-grid 2x2)**: AI 연구원, 데이터 사이언티스트, AI 윤리 전문가, 로봇 공학자
   - 이미지:
     - `{ keyword: "data scientist working with code", type: "photo", usage: "card-image", filename: "img-08a-data-scientist.jpg" }`
     - `{ keyword: "robotics engineer building robot", type: "photo", usage: "card-image", filename: "img-08b-robotics.jpg" }`
     - `{ keyword: "AI ethics researcher discussion", type: "photo", usage: "card-image", filename: "img-08c-ai-ethics.jpg" }`
     - `{ keyword: "machine learning engineer deep learning", type: "photo", usage: "card-image", filename: "img-08d-ml-engineer.jpg" }`

9. **AI 윤리와 책임 (two-column)**: 편향성, 딥페이크, 투명성, 일자리 대체
   - 이미지: `{ keyword: "AI ethics bias fairness concept", type: "illustration", usage: "two-column", filename: "img-09-ai-ethics.jpg" }`

10. **마무리 (closing)**: "AI와 함께 성장하는 나의 미래"
    - 이모지: 🚀 ✨ (웹 이미지 없음 — emoji 마무리 테스트)

### 테스트 포인트
- [ ] 이미지+이모지 혼합 슬라이드 (슬라이드 4: 카드 2장 이미지 + 2장 이모지)
- [ ] 이모지 전용 슬라이드 3개 (슬라이드 2, 6, 10)
- [ ] 추상적/개념적 키워드 검색 품질 ("AI ethics bias fairness concept")
- [ ] 특정 이벤트 검색 ("AlphaGo vs Lee Sedol")
- [ ] illustration 타입 이미지 검색 결과 적절성
- [ ] Glassmorphism frosted glass 효과와 이미지 배경 조화
- [ ] 총 10장 이미지 + 3개 이모지 슬라이드 적절 혼합

---

## 시나리오 C3-3: 한국의 전통 음식과 영양 (Complex Image Search) - Soft Pink Card UI

- **제목**: 한국의 전통 음식과 영양
- **대상**: 학부모
- **목적**: 가정통신 / 영양 교육
- **디자인 스타일**: Soft Pink Card UI (#31)
- **슬라이드 수**: 10장
- **이미지 스타일**: `web-search` (Playwright)
- **카드 스타일**: browser
- **이미지 전략**: 특정 한국 음식명(비빔밥, 김치, 잡채 등)의 로마자 표기 검색. 음식 사진 품질 테스트. 영양 비교 다이어그램 등 정보성 이미지 검색.

### 슬라이드 구성

1. **표지 (cover)**: "한국의 전통 음식과 영양" — 부제: "건강한 밥상, 현명한 선택"
   - 이미지: `{ keyword: "Korean traditional food table banchan beautiful", type: "photo", usage: "cover-bg", filename: "img-01-cover.jpg" }`

2. **한식의 특징 (section-overview)**: "한식의 특징과 우수성"
   - 균형 잡힌 영양소 구성 / 발효 음식의 건강 효능 / 채소 중심 식단 / 세계가 인정한 건강식
   - 이미지: `{ keyword: "Korean food hansik balanced meal", type: "photo", usage: "two-column", filename: "img-02-hansik.jpg" }`

3. **비빔밥 (image-focus)**: "비빔밥 — 영양의 보물 상자"
   - 5색 나물의 의미와 영양소 (빨강, 노랑, 초록, 흰색, 검정)
   - 한 그릇에 담긴 균형 잡힌 영양 / 칼로리: 약 500-600kcal
   - 비타민 A, C, 철분, 식이섬유 풍부
   - 이미지: `{ keyword: "bibimbap Korean mixed rice bowl colorful", type: "photo", usage: "image-focus", filename: "img-03-bibimbap.jpg" }`

4. **김치 (two-column)**: "김치 — 세계가 인정한 슈퍼푸드"
   - 유산균이 풍부한 발효 식품 / 비타민 C, B, 베타카로틴 함유
   - 면역력 강화, 항산화 효과
   - 종류: 배추김치, 깍두기, 파김치, 동치미 등 200여 종
   - 이미지: `{ keyword: "kimchi varieties Korean fermented vegetables", type: "photo", usage: "two-column", filename: "img-04-kimchi.jpg" }`

5. **건강 반찬 (card-grid 2x2)**: "건강을 지키는 전통 반찬"
   - 잡채 / 된장찌개 / 나물 무침 / 생선구이
   - 이미지:
     - `{ keyword: "japchae Korean glass noodle dish", type: "photo", usage: "card-image", filename: "img-05a-japchae.jpg" }`
     - `{ keyword: "doenjang jjigae Korean soybean paste stew", type: "photo", usage: "card-image", filename: "img-05b-doenjang.jpg" }`
     - `{ keyword: "Korean namul seasoned vegetables side dish", type: "photo", usage: "card-image", filename: "img-05c-namul.jpg" }`
     - `{ keyword: "grilled fish Korean style mackerel", type: "photo", usage: "card-image", filename: "img-05d-fish.jpg" }`

6. **영양 비교 (image-focus)**: "한식 vs 패스트푸드 영양 비교"
   - 비빔밥 (500kcal) vs 햄버거 세트 (900kcal)
   - 된장찌개 정식 vs 피자 (포화지방)
   - 한식의 식이섬유 2-3배 높음 / 항산화 성분 우수
   - 이미지: `{ keyword: "Korean food vs fast food nutrition comparison", type: "diagram", usage: "image-focus", filename: "img-06-comparison.jpg" }`

7. **발효 음식의 과학 (two-column)**: 된장·간장·고추장, 젓갈, 식초·막걸리, 장 건강과 면역력
   - 이미지: `{ keyword: "Korean fermented foods jang soy sauce gochujang", type: "photo", usage: "two-column", filename: "img-07-fermented.jpg" }`

8. **아이를 위한 레시피 (card-grid 2x2)**: "아이를 위한 건강 한식 레시피"
   - 영양 주먹밥 / 호박 죽 / 두부 채소전 / 미역국
   - 이미지:
     - `{ keyword: "Korean rice ball jumeokbap children food", type: "photo", usage: "card-image", filename: "img-08a-jumeokbap.jpg" }`
     - `{ keyword: "Korean pumpkin porridge hobak juk", type: "photo", usage: "card-image", filename: "img-08b-hobak-juk.jpg" }`
     - `{ keyword: "Korean tofu vegetable pancake jeon", type: "photo", usage: "card-image", filename: "img-08c-tofu-jeon.jpg" }`
     - `{ keyword: "miyeokguk Korean seaweed soup", type: "photo", usage: "card-image", filename: "img-08d-miyeokguk.jpg" }`

9. **식단 구성법 (two-column)**: "현명한 한식 식단 구성법"
   - 아침: 죽/간단한 국밥 / 점심: 비빔밥, 보리밥 정식
   - 저녁: 생선구이+나물+된장찌개 / 간식: 떡, 과일, 견과류
   - 나트륨 줄이기: 국물 섭취량 조절
   - 이미지: `{ keyword: "Korean daily meal plan balanced diet table", type: "diagram", usage: "two-column", filename: "img-09-meal-plan.jpg" }`

10. **마무리 (closing)**: "전통 밥상에서 찾는 건강의 지혜"
    - 한식은 조상이 남긴 건강 레시피
    - 가정에서 실천하는 바른 먹거리 교육
    - 아이와 함께 만드는 건강한 식습관
    - 이미지: `{ keyword: "Korean family cooking together traditional food", type: "photo", usage: "cover-bg", filename: "img-10-closing.jpg" }`

### 테스트 포인트
- [ ] 한국 음식 로마자 검색 품질 (bibimbap, kimchi, japchae, doenjang jjigae 등)
- [ ] 음식 사진의 비주얼 품질 (음식 사진은 고해상도 필요)
- [ ] diagram 타입 검색 (영양 비교 차트, 식단표)
- [ ] card-grid 2x2 x 2세트 (총 8장 카드 이미지) 안정성
- [ ] Soft Pink Card UI + browser 카드 스타일과 음식 사진 조화
- [ ] 학부모 대상 공손 문체 ("~드립니다", "~해 주세요")
- [ ] 총 14장 이미지의 다운로드 안정성

---

## Cycle 3 테스트 커버리지

| 테스트 항목 | C3-1 (Heritage) | C3-2 (AI Careers) | C3-3 (Korean Food) |
|------------|:---:|:---:|:---:|
| **총 이미지 수** | 14 | 10 | 14 |
| cover-bg 이미지 | 2 | 1 | 2 |
| image-focus 이미지 | 3 | 1 | 2 |
| two-column 이미지 | 3 | 3 | 3 |
| card-image 이미지 | 4 | 4 | 8 |
| 이모지 전용 슬라이드 | 0 | 3 | 0 |
| **검색 난이도** | 쉬움 (랜드마크) | 혼합 (개념+구체) | 어려움 (특정 음식) |
| **이미지 타입** | photo only | photo + illustration | photo + diagram |
| **언어 난이도** | 영어 이름 | 영어 기술 용어 | 한국어→로마자 음식명 |
| Editorial Magazine 스타일 | ✓ | | |
| Glassmorphism 스타일 | | ✓ | |
| Soft Pink Card UI 스타일 | | | ✓ |
| 이미지+이모지 혼합 | | ✓ | |
| 학부모 문체 | | | ✓ |
| 학생 문체 | ✓ | ✓ | |

---
---

# Cycle 1 (이전)

> 생성일: 2026-03-23 | 목적: SKILL.md 개선을 위한 다양한 프레젠테이션 생성 테스트

---

## 시나리오 1: 고등학생 수업자료 - Dark Academia

- **제목**: 셰익스피어와 르네상스 문학의 세계
- **대상**: 고등학교 2학년 (국어/영어 융합)
- **목적**: 수업자료 (개념 설명, 단원 학습)
- **디자인 스타일**: Dark Academia (#04)
- **슬라이드 수**: 12장
- **카드 스타일**: minimal (럭셔리 계열 권장)
- **컬러 테마**: 스타일 기본 (gold on dark brown)
- **폰트**: Playfair Display + EB Garamond

### 슬라이드 구성
1. **표지 (cover)**: "셰익스피어와 르네상스 문학의 세계" - 연도 뱃지, 학교명
2. **학습 목표 (stat-highlight)**: 3가지 학습 목표 (르네상스 배경, 주요 작품, 현대적 의의)
3. **시대 배경 (section-overview)**: 르네상스란 무엇인가 - highlight-box + grid-2
4. **르네상스 문학 특징 (card-grid 2x2)**: 인문주의, 개인의 발견, 자국어 문학, 고전 부활
5. **셰익스피어 소개 (two-column)**: 생애 vs 작품 목록
6. **4대 비극 (card-grid 2x2)**: 햄릿, 오셀로, 리어왕, 맥베스
7. **로미오와 줄리엣 분석 (activity-list)**: 3가지 핵심 장면 분석
8. **소네트 감상 (quote)**: Sonnet 18 원문 + 한국어 번역
9. **현대 속 셰익스피어 (showcase-grid)**: 영화, 뮤지컬, 웹툰 등 5가지 매체 적용
10. **토론 활동 (task-list)**: 3가지 토론 주제
11. **정리 & 요약 (stat-highlight)**: 핵심 포인트 3가지
12. **마무리 (end)**: 다음 시간 예고 + 참고자료

### 테스트 포인트
- [ ] Dark 배경에서 이모지 대신 유니코드 기호(❧ ✦ ◆ ※) 사용
- [ ] 포멀 스타일에서 이모지 예산 규칙 준수
- [ ] 12장 슬라이드에서 콘텐츠 밀도 관리 (activity-item 최대 3개 규칙)
- [ ] 색상 대비: gold text on dark brown 배경 ≥ 7:1
- [ ] serif 폰트 페어링 정확성 (Playfair Display + EB Garamond)
- [ ] section-divider에 유니코드 기호 인라인 배치

---

## 시나리오 2: 학부모 안내용 - Soft Pink Card UI

- **제목**: 2026학년도 AI 중점학교 운영 안내
- **대상**: 학부모
- **목적**: 학부모 안내 (학교 사업 설명)
- **디자인 스타일**: Soft Pink Card UI (#31)
- **슬라이드 수**: 8장
- **카드 스타일**: browser (macOS 윈도우)
- **컬러 테마**: 스타일 기본 (pink/red/cream)
- **폰트**: Bayon (Display) + DM Sans + Noto Sans KR

### 슬라이드 구성
1. **표지 (cover)**: "2026학년도 AI 중점학교 운영 안내" - 학교명, 날짜, frameless
2. **안내 목적 (section-overview)**: AI 중점학교란? - highlight-box + 간단 설명
3. **주요 프로그램 (card-grid 2x2)**: AI 기초교육, 코딩 동아리, AI 프로젝트, 외부 연계
4. **연간 일정 (timeline)**: 3월~12월 주요 일정 5개 마커
5. **학생이 얻는 것 (stat-highlight)**: 수치 강조 (인증서 3종, 대회 참여 5회, 진로 체험 4회)
6. **자주 묻는 질문 (card-grid 2x2)**: FAQ 4개
7. **가정에서의 지원 (two-column)**: 학교 지원 vs 가정 협조
8. **마무리 (end)**: 감사 메시지 + 담임 연락처 + QR placeholder, frameless

### 테스트 포인트
- [ ] 학부모 대상 공손한 문체 ("~드립니다", "~해 주세요")
- [ ] Soft Pink 스타일 정확한 HEX 값 (#F4CED3, #E33529, #924E26)
- [ ] macOS 창 프레임 구현 (3색 점 + Bayon 영문 타이틀)
- [ ] stat-highlight 컴포넌트에 Bayon 폰트 큰 숫자
- [ ] deadline-callout 없이 timeline으로 일정 표현
- [ ] 0.8rem 미만 텍스트 없음 검증
- [ ] 표지/마무리에 .browser-card--frameless 클래스 사용

---

## 시나리오 3: 초등학생(1-3학년) - Glassmorphism

- **제목**: 우리 몸의 신비 - 오감 탐험대
- **대상**: 초등학교 2학년
- **목적**: 수업자료 (과학)
- **디자인 스타일**: Glassmorphism (#01)
- **슬라이드 수**: 6장
- **카드 스타일**: rounded (글래스 계열 권장)
- **컬러 테마**: 스타일 기본 (deep purple/cyan)
- **폰트**: Noto Sans KR (쉬운 읽기)

### 슬라이드 구성
1. **표지 (cover)**: "우리 몸의 신비 - 오감 탐험대" - 큰 이모지 (👀👂👃✋👅)
2. **학습 목표 (section-overview)**: 오늘 배울 것 - 오감이 뭔지 알아보기
3. **오감 소개 (card-grid 2x2+1)**: 시각, 청각, 후각, 촉각 → 4개 카드 (이모지 아이콘)
4. **미각 + 활동 안내 (two-column)**: 미각 설명 + "맛 퀴즈 해볼까?"
5. **오감 실험 (activity-list)**: 3가지 체험 활동 (눈 감고 물건 맞추기, 소리 듣기, 냄새 맡기)
6. **마무리 (end)**: "오늘 배운 것" 요약 + 칭찬 메시지

### 테스트 포인트
- [ ] 초등 1-3학년 어휘 수준 (쉬운 한글, 한자 없음, 짧은 문장)
- [ ] 슬라이드당 30단어 이하
- [ ] 이모지 적극 활용하되 슬라이드당 최대 3개 규칙 준수
- [ ] card-grid 4항목에서 이모지 예산: 카드 아이콘 3개까지, 4번째 생략
- [ ] Glassmorphism 배경: deep gradient, frosted glass 카드
- [ ] 6장 짧은 프레젠테이션에서 구조 완성도
- [ ] 큰 폰트 30px+ 준수

---

## 시나리오 4: 교사 연수용 - Swiss International

- **제목**: 생성형 AI 활용 수업 설계 워크숍
- **대상**: 교사 (AI 전문적학습공동체 연수)
- **목적**: 교사 연수 (실습 포함)
- **디자인 스타일**: Swiss International (#07)
- **슬라이드 수**: 14장
- **카드 스타일**: minimal (에디토리얼 계열 권장)
- **컬러 테마**: 스타일 기본 (white/black/red)
- **폰트**: Helvetica Neue (또는 Arial) + Space Mono

### 슬라이드 구성
1. **표지 (cover)**: "생성형 AI 활용 수업 설계 워크숍" - 강사명, 날짜, 학교명
2. **목차 (toc)**: 8개 항목 (배경, 도구소개, 프롬프트, 수업설계, 실습1-3, 마무리)
3. **배경 & 필요성 (two-column)**: 현재 교육 현황 vs AI 도입 필요성
4. **AI 도구 소개 (card-grid 3x1)**: ChatGPT, Claude, Gemini
5. **프롬프트 엔지니어링 기초 (section-overview)**: 좋은 프롬프트의 3요소
6. **프롬프트 작성법 (activity-list)**: 역할 지정, 맥락 제공, 출력 형식 3가지
7. **수업 설계 프레임워크 (timeline)**: 5단계 (분석→설계→개발→적용→평가)
8. **실습 1: 학습지 생성 (task-list)**: 3단계 실습 과정
9. **실습 2: 평가 문항 생성 (task-list)**: 3단계 실습 과정
10. **실습 3: 피드백 자동화 (task-list)**: 3단계 실습 과정
11. **적용 사례 (showcase-grid)**: 5개 교과별 적용 사례
12. **윤리적 고려사항 (comparison)**: AI 활용 DO vs DON'T 표
13. **참고 자료 (card-grid 2x2)**: 4개 참고 사이트/자료
14. **마무리 (end)**: 핵심 요약 + 설문 QR + 감사

### 테스트 포인트
- [ ] 14장 최대 슬라이드 수에서 높이 예산 관리
- [ ] toc 8개 항목 (9개 미만 규칙 준수)
- [ ] Swiss International 시그니처: 좌측 빨간 세로 바, 수평 구분선
- [ ] 교사 대상 간결한 업무 문체 ("~입니다", 전문 용어 허용)
- [ ] timeline 컴포넌트 5개 마커 가로 배치
- [ ] task-list 3개 슬라이드 연속 사용 시 시각적 단조로움 없는지
- [ ] showcase-grid 5열 구현
- [ ] comparison 표 스타일 (dark 헤더, 짝수행 배경)
- [ ] 10슬라이드 이상 추가 규칙 적용 (activity-item 최대 3개 등)

---

## 시나리오 5: 프로젝트 발표용 - Neo-Brutalism

- **제목**: EcoBot - AI 기반 교실 에너지 절약 로봇
- **대상**: 고등학생 (프로젝트 발표)
- **목적**: 프로젝트 발표 (학생 결과물 발표)
- **디자인 스타일**: Neo-Brutalism (#02)
- **슬라이드 수**: 7장
- **카드 스타일**: browser (팝/레트로 계열 권장, thick border + hard shadow)
- **컬러 테마**: 스타일 기본 (yellow/black/red)
- **폰트**: Arial Black + Space Mono

### 슬라이드 구성
1. **표지 (cover)**: "EcoBot" - 프로젝트명 큰 글씨 + 팀원 3명 이름
2. **문제 정의 (two-column)**: 교실 에너지 낭비 문제 vs EcoBot 해결 방향
3. **개발 과정 (timeline)**: 4단계 (아이디어→설계→개발→테스트)
4. **EcoBot 소개 (image-focus)**: 로봇 이미지 placeholder + 기능 설명
5. **핵심 성과 (stat-highlight)**: 전기 절약 30%, CO2 감소 15kg, 수상 2회
6. **배운 점 (card-grid 2x1)**: 기술적 배움 + 협업 배움
7. **마무리 (end)**: 감사 + 데모 영상 QR placeholder

### 테스트 포인트
- [ ] Neo-Brutalism 시그니처: thick black border (2-4pt), hard drop shadow (no blur)
- [ ] browser 카드 스타일과 Neo-Brutalism 조합 (thick border + hard shadow)
- [ ] 고채도 배경 (#F5F500)에서 텍스트 가독성
- [ ] stat-highlight에 Arial Black 72-96pt 큰 숫자
- [ ] image-focus 컴포넌트 구현
- [ ] 7장 짧은 발표에서 프로젝트 스토리 완결성
- [ ] 인라인 스타일 최소화 (CSS 클래스 사용)
- [ ] 장식 요소 CSS 클래스 규칙 준수

---

## 테스트 커버리지 매트릭스

| 테스트 항목 | S1 | S2 | S3 | S4 | S5 |
|------------|----|----|----|----|-----|
| Dark 스타일 이모지→유니코드 | ✓ | | | | |
| Light 스타일 이모지 예산 | | | ✓ | | |
| 컬러풀 스타일 가독성 | | | | | ✓ |
| 학부모 공손체 | | ✓ | | | |
| 초등 어휘 수준 | | | ✓ | | |
| 교사 전문 문체 | | | | ✓ | |
| 고등학생 문체 | ✓ | | | | ✓ |
| 12+ 슬라이드 밀도 | ✓ | | | ✓ | |
| 6-7장 짧은 구성 | | | ✓ | | ✓ |
| 8장 표준 구성 | | ✓ | | | |
| timeline 컴포넌트 | | ✓ | | ✓ | ✓ |
| stat-highlight | ✓ | ✓ | | | ✓ |
| card-grid 2x2 | ✓ | ✓ | ✓ | ✓ | |
| showcase-grid | ✓ | | | ✓ | |
| comparison 표 | | | | ✓ | |
| quote 컴포넌트 | ✓ | | | | |
| image-focus | | | | | ✓ |
| task-list | ✓ | | | ✓ | |
| section-divider 패턴 | ✓ | ✓ | ✓ | ✓ | ✓ |
| browser-card max-width | ✓ | ✓ | ✓ | ✓ | ✓ |
| 높이 800px 예산 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 색상 대비 검증 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 인라인 스타일 금지 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 미사용 폰트 금지 | ✓ | ✓ | ✓ | ✓ | ✓ |
| frameless 표지/마무리 | | ✓ | | | |
| toc 항목 제한 | | | | ✓ | |
