# 수업 자료 허브 — 샘플고등학교

bolt-slides(React + Vite 덱 엔진)를 기반 프레임워크로, 레거시 HTML 덱·실시간
수업 라이브 레이어(Supabase)·활동지 시스템(GAS)이 하나로 병합된 수업 플랫폼.

> 덱 엔진은 [stackblitz/bolt-slides](https://github.com/stackblitz/bolt-slides)(MIT)를
> 가져와 얹은 것이다. 씬 문법은 로컬 프로젝트 newVideoGen에서, 필름 덱의 영상 렌더는
> [OpenMontage](https://github.com/calesthio/OpenMontage)(AGPL-3.0, 저장소 밖 도구)에서
> 온다. 반입 범위와 라이선스 의무는 **[THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)** 참조.

## 구조

```
index.html            Vite 엔트리 (React 앱: 허브·덱·뷰어·라이브 앱)
src/
  deck/               bolt-slides 프레젠테이션 엔진 + 크롬 — 수정 금지
  components/         슬라이드 컴포넌트 라이브러리 (28종 + Terminal)
  scene/              결정론적 씬 타임라인 런타임 (dynamic-scene의 React/TS 구조)
  decks/registry.tsx  네이티브 덱 카탈로그 (덱 소스는 data/에 있음)
  hub/                허브(덱 라이브러리) — pages.json 런타임 fetch
  legacy/             레거시 뷰어 — 진짜 bolt 크롬으로 HTML 덱 컨트롤
  live/               라이브: LiveBridge(덱 위 세그먼트) + HostPage/JoinPage
  styles/             tokens.css (테마 토큰) + base.css (엔진, 수정 금지)
data/<그룹>/<과목>/<수업>/    모든 덱 저장소 — 레거시 index.html 또는 네이티브 deck.tsx
                      그룹: 2026-1(진행 학기) · dev(데모·실험) · 없음(연수·부서)
live/                 라이브 레이어 전체 (2026-08-22에 app/ 을 여기로 합쳤다)
  archives.json       세션 결과 저장 시트 후보 (문항 quiz.json은 수업 폴더에 산다)
  host/ join/         구 URL 리다이렉트(→ ?app=host/join) + classic.html 보존
  runtime/            공유 라이브 런타임 + chrome.js(폴백 독) — 번들 금지, 동적 import
  vendor/             qrcode.js · supabase.umd.js (CDN 차단 학교망 대응 자체 서빙)
pages.json            모든 덱의 공용 레지스트리
supabase/migrations/  live_presentation_* 스키마 (RLS deny-all + lp_* RPC)
scripts/build-static.mjs  빌드 후 정적 자산 dist/ 복사 (Netlify publish=dist)
```

## 라우트 (React SPA)

| URL | 화면 |
|---|---|
| `/` | **학생 참여** — 사이트 메인, 세션 코드 입력 |
| `/hub` | **수업 자료 허브** (pages.json + registry 병합 갤러리). `?group=2026-1`로 학기 필터 딥링크. `/data/…`는 수업 파일 경로일 뿐 허브가 아니다 |
| `/?deck=<id>` | 네이티브 React 덱 (bolt 엔진) |
| `/?legacy=<data/…/index.html>` | **레거시 뷰어** — 진짜 bolt 크롬(독·레일·그리드·주석·프레젠터)이 HTML 덱을 컨트롤 |
| `/?composite=<data/…/deck.json>` | **컴포지트 덱** — deck.json 매니페스트로 타이틀·NotebookLM 이미지·불릿 세그먼트를 시퀀싱 |
| `/?app=host` · `/?app=join` | 교사 콘솔 · 학생 참여 (bolt 디자인) |
| `…&live=<코드>&host=1` | 라이브 호스트 모드 — 독 안에 라이브 세그먼트 통합 |

## 명령

```bash
npm run dev       # Vite dev — 모든 라우트 + 레거시 정적 서빙
npm run build     # vite build + 정적 복사 → dist (Netlify publish=dist)
npm run check     # tsc --noEmit
```

## 덱 추가

- **네이티브 React 덱**: `data/<그룹>/<과목>/<수업>/deck.tsx` 저작 →
  `src/decks/registry.tsx` 등록 → `pages.json`에 `path: "index.html?deck=<id>"`.
  절차·규칙은 `.claude/skills/react-deck-builder` 스킬.
- **씬(타임라인) 덱**: 위와 같되 `src/scene`의 `Scene`/`useSceneTime`/
  `interpolate`/`spring` 사용 — 모든 모션은 t(초)의 순수 함수.
  패턴 예시: `data/dev/테스트 수업 자료/씬-데모/deck.tsx` (`?deck=scene-demo`).
- **레거시 HTML 덱**: 기존 그대로 `data/<그룹>/<과목>/<수업>/index.html` + pages.json.
  허브에서는 자동으로 뷰어(`?legacy=`)로 열리고, 직접 URL은 `live/runtime/chrome.js`
  폴백 독으로 동작.
- **컴포지트 덱**: `data/<그룹>/<과목>/<수업>/deck.json` 매니페스트만 작성 →
  pages.json에 `path: "index.html?composite=<경로>"`. 코드 배포 없이 JSON으로
  타이틀·NotebookLM 이미지(KenBurns)·불릿을 시퀀싱. 스키마는
  `src/composite/CompositeDeck.tsx` 상단 주석, 예시는
  `data/dev/테스트 수업 자료/컴포지트-데모/deck.json`. 라이브 문항은 레거시와
  동일하게 매니페스트 옆 `live.json`.
- **활동지·문서형 자료**: pages.json의 `type: "doc"` — 허브가 뷰어 없이 원본으로
  연다(카드에 "자료" 배지, 교사 콘솔 덱 픽커에서 제외). 분류는
  `node scripts/classify-pages.mjs`(dev 서버 필요)가 실제 로드 후 `.slide` 수로
  판정해 기록한다 — **자료를 추가/개편한 뒤 이 스크립트를 한 번 돌려줄 것**.
  미분류 문서가 뷰어로 들어와도 원본으로 자동 전환된다(런타임 안전망).

## 라이브 수업

교사 콘솔(`?app=host`)에서 세션 생성 → 코드/QR → 학생은 사이트 메인(`/`)에서 코드 입력.
세션 생성에 비밀구절은 없다 (v10에서 기능 삭제 — 세션 조작은 여전히 host_token 게이트).
세션 결과 저장은 세션 만들 때 **결과 저장 시트**를 과목별 아카이브(`live/archives.json`,
`node scripts/scan-archives.mjs`로 생성) 중에서 고른다 — 덱을 선택하면 해당 과목 시트가 자동 선택된다.
"덱을 호스트 모드로 열기" → 덱 화면의 **bolt 독 안에 라이브 세그먼트**
(세션 코드·참여 수·문항 3동사·QR·종료)가 통합 장착된다.

- 문항 소스: 네이티브 `live/<deckId>.json` · 레거시 `수업폴더/live.json`
- 런타임(`live/runtime/*`)은 클래식/React 공용 — 반드시 서빙 URL에서 동적
  import (`/* @vite-ignore */`). 번들하면 `import.meta.url` 경로가 깨진다.
- 구 QR/링크(`live/join/?code=…`)는 리다이렉트로 보존, 클래식 페이지는
  `live/{host,join}/classic.html`.

## 테스트 (dev 서버 5199 기동 후)

```bash
node test/merge-smoke.mjs                 # 허브·덱·콘솔 (SMOKE_BASE로 대상 변경)
node test/chrome-e2e.mjs                  # 폴백 독 — 레거시/컨트랙트 덱
node test/viewer-e2e.mjs                  # 레거시 뷰어 (진짜 엔진 크롬)
node test/composite-e2e.mjs               # 컴포지트 덱 (매니페스트·이미지·테마)
node test/live/native-bridge-e2e.mjs      # 라이브 독 통합 (RPC 스텁)
node test/live/react-live-e2e.mjs         # React host/join 흐름 (RPC 스텁)
node test/live/quiz-e2e.mjs               # 실서버 E2E (classic 대상 — 비밀구절 불필요)
```

## 라이선스

코드와 수업 자료에 서로 다른 라이선스를 쓴다.

| 대상 | 라이선스 | 파일 |
|---|---|---|
| **코드** (`src/`·`scripts/`·`test/`·`live/`·`supabase/`) | SPACEKIJUN 교육용 비상업 1.0 | [LICENSE](LICENSE) |
| **수업 자료** (`data/`의 슬라이드·활동지·문항, 직접 만든 이미지·영상) | CC BY-NC-SA 4.0 | [LICENSE-CONTENT.md](LICENSE-CONTENT.md) |
| **외부에서 가져온 것** | 각자의 라이선스 | [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) |

**학교 안 활용은 자유, 상용 서비스 제작은 제한** — 코드는 학교·교육청·비영리 교육 단체가 자유롭게 고쳐 쓰고 나눌 수 있지만, 유료 판매·영리 서비스·사교육 상품에 쓰려면 저작권자의 서면 허락이 필요하다.

수업 자료는 출처를 밝히고 비영리로 쓰는 한 자유롭게 가져다 고쳐 쓸 수 있다(고쳐서
배포할 때는 같은 라이선스로). 다만 덱 안의 **외부 사진은 원래 라이선스를 그대로
유지**하므로, 사진을 쓸 때는 그 사진의 출처를 함께 실어야 한다.

## 출처 — 기대고 있는 세 프로젝트

전체 내용은 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)에 있고, 요약은 다음과 같다.

| 프로젝트 | 라이선스 | 관계 |
|---|---|---|
| [stackblitz/bolt-slides](https://github.com/stackblitz/bolt-slides) | MIT | **코드 반입** — `src/deck/`·`src/components/`·`src/styles/base.css`가 상류 코드다(39개 중 33개는 원본 그대로). MIT 전문은 THIRD-PARTY-NOTICES.md §1 |
| newVideoGen (로컬, 공개 저장소 아님) | 표기 없음 | **문법 이식** — `.claude/rules/scene-grammar.md`와 씬·디오라마·콜라주·화이트보드 스킬 문서의 원본. 각 문서에 원본 표기를 남긴다 |
| [calesthio/OpenMontage](https://github.com/calesthio/OpenMontage) | AGPL-3.0 | **저장소 밖 도구** — 필름 덱의 mp4를 렌더한다. 산출물(mp4·poster)만 반입하고 코드는 가져오지 않는다 |

지켜야 할 선 두 가지:

- **bolt-slides 코드를 배포할 때는 MIT 저작권 고지와 전문이 함께 가야 한다.**
  THIRD-PARTY-NOTICES.md가 그 역할을 하므로 저장소에서 지우지 말 것.
- **OpenMontage는 AGPL이다.** 소스·스킬 문서·컴포지션(`remotion-composer/src/*.tsx`)을
  이 저장소로 복사하지 않는다. 복사하는 순간 이 저장소가 AGPL 파생물이 된다.

수업 자료에 쓰는 이미지·영상의 출처는 `assets/manifest.json`의 `origin`·`license`
필드에 기록한다. 외부에서 가져온 사진은 라이선스·저작자·원본 파일명을 반드시 채운다.
