# Cycle 4 - Image Search Skill Improvement Report

**Date**: 2026-03-24
**Author**: worker-5
**Based on**: cycle4-validation-report.md (worker-4)

---

## 발견된 문제 요약

검증 보고서에서 5개 주요 문제가 확인되었습니다:

| ID | 문제 | 심각도 | 영향 |
|----|------|--------|------|
| W-1 | 다운로드된 14개 이미지 중 10개만 HTML에 사용 (4개 미참조) | Warning | grid-cards 슬라이드에 이미지 누락, 리소스 낭비 |
| W-2 | 세로형 이미지(ratio 0.90)가 object-fit:cover에서 77% 크롭 | Warning | 이미지 핵심 내용 손실 |
| W-3 | 정사각형 커버 이미지(820x820)가 배경에 부적합 | Warning | 와이드스크린에서 좌우 빈 공간 발생 |
| W-4 | 저해상도 이미지(800x600)가 FHD에서 흐릿 | Warning | 빔프로젝터 환경에서 품질 저하 |
| I-4 | 프레젠테이션 간 image-container 사용 불일치 | Info | 유지보수 어려움, 스타일 불일치 |

추가 요구사항 (team-lead):
- Playwright MCP 사용 불가 시 fallback 전략 문서화 필요

---

## 파일별 변경 사항

### 1. `references/web-image-search.md` (이미지 검색 워크플로우)

#### 변경 1: 슬라이드 유형별 키워드 전략 테이블 추가
- **문제 해결**: W-3 (정사각형 커버 이미지)
- **변경 내용**: Step 1 키워드 생성 규칙에 슬라이드 유형별 키워드 전략 테이블 추가
- **개선 전**: 일반적인 키워드 생성 규칙만 존재, 커버용 키워드 구분 없음
- **개선 후**:
  - 표지(cover)에 `wide`, `panoramic`, `landscape`, `banner` 필수 키워드 명시
  - 정사각형 이미지가 커버에 부적합하다는 경고 추가
  - 커버용 키워드 예시 2개 추가

#### 변경 2: 해상도 및 종횡비 검증 단계 추가
- **문제 해결**: W-2 (세로형 크롭), W-4 (저해상도)
- **변경 내용**: Step 4-B 다운로드 후 검증에 PIL 기반 해상도/종횡비 검증 스크립트 추가
- **개선 전**: 파일 형식과 크기만 검증
- **개선 후**:
  - Python PIL로 너비, 높이, 종횡비 자동 검증
  - 1280px 미만 경고 (FHD 흐릿함 방지)
  - 세로형(ratio < 1.0) 경고 + 재검색 안내
  - 정사각형(0.95~1.05) 경고 + 커버 사용 금지 안내
  - 이미지 품질 기준 테이블 추가 (최소/권장 너비, 종횡비, 커버 요건)

#### 변경 3: Fallback 전략 확장 (Playwright 미사용 시)
- **문제 해결**: Chrome 확장 미연결 시 대안 부재
- **변경 내용**: 검색 실패 대응 섹션에 3단계 Playwright 미사용 fallback 추가
- **개선 전**: `Playwright 연결 실패 → emoji 모드로 fallback` (단일 대안)
- **개선 후**:
  1. `/google-image-search` 스킬 (Google Custom Search API)
  2. WebFetch로 Wikimedia Commons API 직접 검색 (URL 구성법 포함)
  3. Emoji + CSS placeholder (최종 fallback)
  - Fallback 순서도 업데이트: `Playwright → Google CSE API → WebFetch(Wikimedia) → 스크린샷 → placeholder → emoji`

#### 변경 4: 이미지 종횡비 대응 CSS 및 data-ratio 시스템 추가
- **문제 해결**: W-2 (세로형 크롭)
- **변경 내용**: CSS 클래스 섹션에 `.col-image[data-ratio]` 선택자 추가
- **개선 전**: `.col-image`에 일률적으로 `object-fit: cover` + `aspect-ratio: 16/10` 적용 → 세로형 이미지 77% 크롭
- **개선 후**:
  - `data-ratio="portrait"`: `object-fit: contain` + 배경 그라데이션 → 크롭 없이 표시
  - `data-ratio="square"`: `object-fit: contain` + 크기 제한 + 중앙 정렬
  - JavaScript 런타임 판별 스크립트 제공 (url-link 모드용)
  - 다운로드 모드에서는 PIL로 사전 판별 후 HTML 직접 삽입 권장
  - 일관성 규칙 추가: 모든 프레젠테이션에서 `.image-container` + `.image-caption` 래퍼 사용 필수

#### 변경 5: 표지 검색 전략 강화
- **문제 해결**: W-3 (정사각형 커버)
- **변경 내용**: 슬라이드별 검색 전략 > 표지(cover) 섹션 보강
- **개선 전**: `"{주제} aesthetic background"` 패턴
- **개선 후**:
  - `"{주제} wide panoramic landscape background"` 패턴
  - 필수 키워드, 종횡비 요건, 최소 해상도 명시

### 2. `references/html-template.md` (HTML 템플릿)

#### 변경 1: card-grid 이미지 변형 HTML 패턴 추가
- **문제 해결**: W-1 (다운로드 이미지 미사용)
- **변경 내용**: card-grid 컴포넌트 섹션에 이미지가 포함된 카드 HTML 예시 추가
- **개선 전**: card-grid에 이모지 아이콘만 있는 예시만 존재 → 이미지 삽입 방법 불명확
- **개선 후**:
  - `card-img` 클래스를 사용한 카드 이미지 삽입 예시
  - `onerror` fallback + `referrerpolicy` 포함
  - `needs_image: true`인 카드에 반드시 이미지 삽입하라는 규칙 명시

### 3. `presentation-builder.md` (메인 스킬)

#### 변경 1: "다운로드 이미지 전량 사용" 규칙 추가
- **문제 해결**: W-1 (다운로드 이미지 미사용)
- **변경 내용**: 이미지 사용 규칙 첫 번째 항목으로 전량 사용 필수 규칙 추가
- **개선 전**: 슬라이드당 1개 제한 등 일반 규칙만 존재
- **개선 후**: `needs_image: true`로 다운로드한 이미지는 반드시 모두 HTML에서 참조해야 한다는 규칙 최우선 배치

#### 변경 2: card-grid 이미지 필요도 변경
- **문제 해결**: W-1 (grid-cards 슬라이드 이미지 누락)
- **변경 내용**: 이미지 검색 판단 기준 테이블에서 card-grid 필요도를 "낮음" → "needs_image 시 필수"로 변경
- **개선 전**: `card-grid | 낮음 | 이모지로 충분, 특별 요청 시만`
- **개선 후**: `card-grid | needs_image 시 필수 | needs_image: true인 카드에는 반드시 card-img 삽입`

#### 변경 3: 이미지 품질/일관성 규칙 추가
- **문제 해결**: W-4 (저해상도), I-4 (불일치)
- **변경 내용**: 이미지 사용 규칙에 최소 해상도, 커버 종횡비, 래퍼 일관성 규칙 추가
- **개선 전**: 해상도/종횡비/구조 일관성에 대한 규칙 없음
- **개선 후**:
  - 최소 해상도 1280px 권장, 800px 이하 흐릿함 경고
  - 커버 이미지 반드시 가로형(ratio > 1.5) 사용
  - `.image-container` + `.image-caption` 래퍼 일관 사용 규칙

#### 변경 4: HTML 생성 후 검증 체크리스트 추가
- **문제 해결**: 전체 (사전 방지)
- **변경 내용**: 이미지 관련 6개 항목 검증 체크리스트 신규 추가
- **체크리스트**:
  - ✅ 다운로드된 모든 이미지가 HTML에서 참조되는가?
  - ✅ 모든 `<img>` 태그에 onerror fallback이 있는가?
  - ✅ 모든 `<img>` 태그에 referrerpolicy가 있는가?
  - ✅ 커버 이미지가 가로형인가?
  - ✅ `.image-container` 래퍼가 일관되게 적용되었는가?
  - ✅ 세로형 이미지에 `data-ratio="portrait"`가 적용되었는가?

---

## 개선 전/후 비교 요약

| 영역 | 개선 전 | 개선 후 |
|------|---------|---------|
| **이미지 활용률** | 14개 다운로드, 10개만 사용 (71%) | "전량 사용 필수" 규칙 + card-grid 삽입 패턴 제공 |
| **세로형 이미지** | object-fit:cover로 77% 크롭 | data-ratio 시스템으로 contain/cover 자동 전환 |
| **커버 이미지** | 종횡비 제한 없음 → 정사각형 허용 | wide/panoramic 키워드 필수 + ratio > 1.5 요건 |
| **해상도** | 기준 없음 → 800x600 허용 | 최소 1280px 권장, PIL 검증 스크립트 |
| **Fallback** | Playwright 실패 → emoji만 | 3단계: Google CSE → Wikimedia API → emoji |
| **구조 일관성** | 프레젠테이션마다 다른 래퍼 | `.image-container` 래퍼 필수 규칙 |
| **검증** | 사후 검증만 | HTML 생성 후 6항목 체크리스트 + PIL 사전 검증 |

---

## 예상 효과

1. **이미지 활용률 100%**: card-grid 이미지 삽입 패턴과 전량 사용 규칙으로 다운로드한 이미지 낭비 방지
2. **세로형 이미지 품질 향상**: data-ratio 시스템으로 크롭 없이 이미지 전체 표시
3. **커버 이미지 적합성**: wide/panoramic 키워드로 와이드스크린에 적합한 이미지 검색
4. **FHD 선명도 보장**: 1280px 최소 해상도로 빔프로젝터 환경에서도 선명
5. **Playwright 미사용 환경 대응**: Wikimedia API 직접 검색으로 브라우저 자동화 없이도 이미지 확보
6. **프레젠테이션 간 일관성**: image-container 래퍼 통일로 CSS 유지보수 용이
