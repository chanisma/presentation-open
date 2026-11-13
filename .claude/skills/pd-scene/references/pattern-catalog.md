# pattern-catalog.md — Visual DNA 패턴 39종 (pd-scene `visual_plan.pattern_ref` 어휘)

> 원본: newVideoGen `src/services/pattern-catalog.ts` (reference/SC *.png에서 추출한 시각 DNA).
> 코드가 아니라 **어휘표**로 옮겼다. 각 패턴의 id·관계·focal 타입·support·컨테이너·non_card·
> 매칭 조건·realize 힌트는 원문 값 그대로다.
>
> **쓰임 (R11 이후)**: 렌더러가 그대로 구현하는 설계도가 아니라 ① 씬 설계의 **힌트**,
> ② **분포 관리**의 단위다. semantic signature = `pattern_ref` + `focal.type`. 직전 3씬과
> signature가 2개 이상 겹치면 같은 `relationship` 안에서 다른 `focal_type`을 가진 패턴으로 회피한다.
>
> `focal_type`·`support_types`는 원문 Remotion 노드 이름이다. 이 저장소에서는 **대응하는
> 시각 관계**로 읽는다 (ImpactStat=거대 수치, CompareBars=대비 막대, RingChart=비율 링,
> FlowDiagram=흐름도, AnimatedTimeline=타임라인, VersusCard=좌우 대비 카드, BulletList=불릿,
> SvgGraphic=손그림 에셋, BrowserMockup=창 목업, TerminalBlock=터미널, ChatBubble=말풍선).

## relationship 어휘 (7)

`metric` 수치 강조 · `contrast` A vs B / 전후 · `flow` 순서·단계 · `evidence` 사례·인용 · `pause` 전환·숨 · `enumerate` 나열 · `case` 사례·인물

## 전체 목록

| id | relationship | focal_type | support | container | non_card | label |
|---|---|---|---|---|---|---|
| `P01_mega_number` | metric | ImpactStat | Kicker, FooterCaption | null | true | 메가 숫자 + 짧은 라벨 |
| `P02_number_hero_double_bar` | metric | ImpactStat | CompareBars, FooterCaption | Stack | false | 거대 숫자 히어로 + 더블 바 |
| `P03_weekly_bars` | metric | CompareBars | Kicker, FooterCaption | null | true | 주간 7-막대 그래프 |
| `P04_ring_with_bullets` | metric | RingChart | BulletList, FooterCaption | Stack | false | 링차트 + 불릿 리스트 |
| `P05_ring_triplet` | enumerate | RingChart | RingChart, RingChart | Grid | false | 링차트 3개 병렬 |
| `P06_brand_bar_pair` | contrast | DevIcon | CompareBars, FooterCaption | Split | false | 브랜드 로고 + 비교 바 |
| `P07_tile_triplet` | enumerate | Grid | Kicker | Grid | false | 타일 3개 (라벨+값) |
| `P08_vertical_timeline` | flow | AnimatedTimeline | Kicker | null | true | 세로 타임라인 (원+연결선) |
| `P09_number_chain_arrow` | flow | FlowDiagram | Kicker, FooterCaption | null | true | 번호 체인 화살표 |
| `P10_hub_satellite` | case | CycleDiagram | Kicker | null | true | 허브 + 위성 |
| `P11_persona_stack` | case | ImageAsset | Headline, Badge | Split | false | 인물 실루엣 + 라벨 |
| `P12_doc_split` | evidence | SvgGraphic | Headline, BodyText, FooterCaption | Split | false | 문서 SVG + 텍스트 분할 |
| `P13_radial_people` | case | SvgGraphic | Headline, ImageAsset | null | true | 중앙 아이콘 + 방사형 인물 |
| `P14_color_bar_bullet` | enumerate | BulletList | Kicker, FooterCaption | Stack | false | 색상 바 글머리 리스트 |
| `P15_era_timeline` | flow | AnimatedTimeline | ImpactStat, Headline | null | true | 시대 타임라인 (연도+이미지) |
| `P16_warning_triangle` | pause | SvgGraphic | Headline, Badge | null | true | 경고 삼각형 + 배지 |
| `P17_icon_title_sub_badge` | case | IconCard | Badge | FrameBox | false | 아이콘+제목+부제+배지 |
| `P18_vertical_dual_bar` | contrast | CompareBars | Kicker, FooterCaption | null | true | 세로 듀얼 바 |
| `P19_two_col_contrast` | contrast | VersusCard | Kicker, CheckMark | Split | false | 2열 대비 (✓ vs ✗) |
| `P20_mini_flow` | flow | FlowDiagram | Kicker, FooterCaption | Stack | false | 박스→화살표→박스 (미니 플로우) |
| `P21_vertical_dual_bar` | contrast | VerticalBars | Kicker, FooterCaption | null | true | 수직 듀얼 바 (빠름 vs 성능) |
| `P22_browser_mockup` | evidence | BrowserMockup | FooterCaption | null | true | 브라우저 mockup (반복) |
| `P23_terminal_code` | evidence | TerminalBlock | FooterCaption | null | true | 터미널 코드 블록 |
| `P24_emoji_icon_row` | enumerate | EmojiIconList | Kicker, Badge | Stack | false | 이모지 아이콘 + 라벨 스택 |
| `P25_brand_satellite` | case | BrandSatellite | FooterCaption | null | true | 중앙 인물 + 브랜드 위성 |
| `P26_diagonal_flow` | flow | DiagonalFlow | Kicker, FooterCaption | null | true | 대각선 흐름 (↘) |
| `P27_ralph_loop` | flow | CycleDiagram | Kicker | null | true | Ralph loop (내부 메시지 순환) |
| `P28_priority_color_list` | enumerate | BulletList | Kicker | Stack | false | 컬러 숫자 우선순위 리스트 |
| `P29_radial_people` | case | SvgGraphic | Kicker, FooterCaption | null | true | 폴더+방사형 인물 (팀 공유) |
| `P30_era_timeline_photo` | flow | AnimatedTimeline | ImageAsset, ImpactStat | null | true | 시대 타임라인 + 인물 photo |
| `P31_ai_comparison_triangle` | contrast | BrandSatellite | Headline | null | true | AI 3사 삼각 비교 |
| `P32_big_ratio_contrast` | contrast | ImpactStat | ImpactStat, Divider | Split | false | 거대 2-column 수치 대비 |
| `P33_chat_conversation` | contrast | ChatBubble | Kicker | Split | false | ChatBubble 대화 (사용자 vs AI) |
| `P34_quad_mockup` | evidence | BrowserMockup | FooterCaption | Grid | false | 4 mockup 반복 가로 (다 비슷비슷) |
| `P35_stat_with_bullets_side` | metric | RingChart | BulletList, EmojiIconList | Split | false | 링/원 + 오른쪽 아이콘+라벨 리스트 |
| `P37_brand_card_triptych` | contrast | Grid | DevIcon, Headline | Grid | false | 3 브랜드 카드 (강조 border) |
| `P38_hero_wordmark` | pause | MarkerHighlight | Kicker, FooterCaption | null | true | 거대 wordmark (단어/키워드) |
| `P39_big_number_context_sub` | metric | ImpactStat | ImageAsset, FooterCaption | Stack | false | 거대 숫자 + 좌 아이콘/인물 + 하단 부제 |
| `P40_safety_priority_list` | enumerate | BulletList | Kicker | Stack | false | 색상 우선순위 4단계 (빨→노→녹→녹) |

## 패턴별 매칭 조건과 realize 힌트

### `P01_mega_number` — 메가 숫자 + 짧은 라벨
- 매칭: intent emphasize/introduce · evidence statistic
- realize: ImpactStat size='xl' 단독. focal 이 화면 60%+. Kicker 생략 OK.

### `P02_number_hero_double_bar` — 거대 숫자 히어로 + 더블 바
- 매칭: intent emphasize/compare · evidence statistic
- realize: ImpactStat + 2-item CompareBars. Stack column, 숫자 위/바 아래.

### `P03_weekly_bars` — 주간 7-막대 그래프
- 매칭: intent list/sequence/emphasize · evidence statistic · 키워드 주간, 매일, 일주일, 요일, 월요일, 화요일, 시간대, 매주
- realize: CompareBars 7개, 마지막 하나 accent 강조.

### `P04_ring_with_bullets` — 링차트 + 불릿 리스트
- 매칭: intent focus/highlight/emphasize · evidence statistic
- realize: RingChart size 280~360 중앙 + 하단 3 bullet.

### `P05_ring_triplet` — 링차트 3개 병렬
- 매칭: intent compare/list/enumerate · evidence statistic
- realize: Grid columns:3 + RingChart 3개 (mint/yellow/red 색 구분).

### `P06_brand_bar_pair` — 브랜드 로고 + 비교 바
- 매칭: intent compare/contrast/introduce · evidence statistic/example · 키워드 OpenAI, GPT, Claude, Anthropic, Google, Gemini, Microsoft, Meta …
- realize: Split ratio:[1,2]. DevIcon 왼쪽 + CompareBars 오른쪽.

### `P07_tile_triplet` — 타일 3개 (라벨+값)
- 매칭: intent list/enumerate/introduce
- realize: Grid columns:3, 각 셀: muted 라벨 상단 + bold 값 하단.

### `P08_vertical_timeline` — 세로 타임라인 (원+연결선)
- 매칭: intent sequence/timeline/list · 키워드 단계, 순서, 먼저, 다음, 마지막, 첫째, 둘째, 셋째
- realize: AnimatedTimeline direction:'vertical'. stepEnterAts 자막 싱크 필수.

### `P09_number_chain_arrow` — 번호 체인 화살표
- 매칭: intent sequence/timeline · 키워드 단계, 프로세스, 흐름, 과정, 거치
- realize: FlowDiagram variant:'circle-chain'. 하나의 노드만 accent.

### `P10_hub_satellite` — 허브 + 위성
- 매칭: intent stack/layer/list/focus · 키워드 중심, 허브, 사이클, 자동화, 순환, 연결
- realize: CycleDiagram centerLabel + 4~6 위성 노드.

### `P11_persona_stack` — 인물 실루엣 + 라벨
- 매칭: intent introduce/empathy/example · 키워드 기획자, 개발자, 디자이너, 사용자, 팀원, 엔지니어, 분들, 여러분 …
- realize: Split ratio:[1,2]. ImageAsset circle:true + Headline+Badge.

### `P12_doc_split` — 문서 SVG + 텍스트 분할
- 매칭: intent explain/define/example · evidence definition/example · 키워드 문서, 보고서, 리포트, 논문, 자료, 기록, 정의
- realize: Split ratio:[1,1.5]. SvgGraphic 문서 실루엣 + BodyText.

### `P13_radial_people` — 중앙 아이콘 + 방사형 인물
- 매칭: intent stack/layer/list · 키워드 팀, 조직, 협업, 공유, 분배, 역할
- realize: SvgGraphic 중앙 + 4방향 ImageAsset(circle).

### `P14_color_bar_bullet` — 색상 바 글머리 리스트
- 매칭: intent list/enumerate/stack
- realize: BulletList variant:'dot' 또는 SvgGraphic 색상 바 3~4개 + 각 라벨.

### `P15_era_timeline` — 시대 타임라인 (연도+이미지)
- 매칭: intent sequence/timeline/compare · 키워드 년, 시대, 과거, 현재, 미래, 세대, 옛날
- realize: AnimatedTimeline horizontal + 각 step 에 거대 연도 숫자.

### `P16_warning_triangle` — 경고 삼각형 + 배지
- 매칭: intent emphasize/warn/contrast · 키워드 경고, 주의, 문제, 위험, 실패, 오류, 사고, 버그 …
- realize: SvgGraphic: outline triangle stroke 4 + ! dot. Badge 아래.

### `P17_icon_title_sub_badge` — 아이콘+제목+부제+배지
- 매칭: intent introduce/example/define · evidence quote/example
- realize: IconCard title+body + 우측 Badge. FrameBox variant:'glass'.

### `P18_vertical_dual_bar` — 세로 듀얼 바
- 매칭: intent compare/contrast · evidence statistic
- realize: CompareBars 2 items, 색 대비 강하게 (mint vs red).

### `P19_two_col_contrast` — 2열 대비 (✓ vs ✗)
- 매칭: intent compare/contrast/do-dont · 키워드 반면, 하지만, 그러나, 대조적으로, 대신, vs, VS, 대 …
- realize: Split variant:'line' + VersusCard 또는 CheckMark 대비.

### `P20_mini_flow` — 박스→화살표→박스 (미니 플로우)
- 매칭: intent sequence/explain/define · 키워드 입력, 출력, 변환, 거쳐, 통해, →
- realize: FlowDiagram variant:'box-chain' 2~3 step.

### `P21_vertical_dual_bar` — 수직 듀얼 바 (빠름 vs 성능)
- 매칭: intent compare/contrast · evidence statistic · 키워드 속도, 성능, vs, 빠른, 느린, trade
- realize: 세로 2 bar, 서로 다른 높이 + 색상(mint/red). 라벨 상하.

### `P22_browser_mockup` — 브라우저 mockup (반복)
- 매칭: intent example/explain · 키워드 웹사이트, 사이트, 페이지, UI, 디자인, AI 만든
- realize: BrowserMockup 1~4개 반복. 'Unlock Your Potential' 같은 placeholder.

### `P23_terminal_code` — 터미널 코드 블록
- 매칭: intent explain/sequence/list · 키워드 명령어, 터미널, CLI, /command, cmd
- realize: TerminalBlock 안에 `$ /command` 목록. 모노스페이스.

### `P24_emoji_icon_row` — 이모지 아이콘 + 라벨 스택
- 매칭: intent list/enumerate/introduce · 키워드 역할, 종류, 분야, 기능, 작업, 업무
- realize: 이모지(🔍🛡️🚀📄) + 굵은 라벨 + muted 부제 행을 3~6개.

### `P25_brand_satellite` — 중앙 인물 + 브랜드 위성
- 매칭: intent introduce/example/emphasize · 키워드 대표, CEO, 창업자, 유명, 실리콘밸리, YC
- realize: 중앙 인물 circle + 주변 브랜드 로고 pill (Reddit, Airbnb, Stripe 등).

### `P26_diagonal_flow` — 대각선 흐름 (↘)
- 매칭: intent sequence/emphasize/compare · 키워드 다음, 그 다음, 진화, 넘어, 업그레이드
- realize: 상단 좌 + 하단 우 배치, 화살표로 연결.

### `P27_ralph_loop` — Ralph loop (내부 메시지 순환)
- 매칭: intent explain/sequence · 키워드 루프, 반복, 사이클, 매번, 다시
- realize: 4 단계 원형 순환 + 중앙 FrameBox 에 '핵심' 메시지.

### `P28_priority_color_list` — 컬러 숫자 우선순위 리스트
- 매칭: intent list/enumerate/emphasize · 키워드 첫째, 둘째, 셋째, 넷째, 금지, 주의, 필수, 지켜
- realize: 숫자 원 색상 구분 (빨/노/녹/녹) + 제목 + 부제 스택.

### `P29_radial_people` — 폴더+방사형 인물 (팀 공유)
- 매칭: intent stack/layer/introduce · 키워드 팀, 공유, 협업, 모두, 같이, 함께
- realize: 중앙 폴더 아이콘 + 4방향 person outline + 점선 연결.

### `P30_era_timeline_photo` — 시대 타임라인 + 인물 photo
- 매칭: intent timeline/compare/emphasize · 키워드 년, 시대, 과거, 철학, 역사
- realize: 상단 점선 타임라인 + 인물 photo circle + 거대 연도 inline.

### `P31_ai_comparison_triangle` — AI 3사 삼각 비교
- 매칭: intent compare/contrast/introduce · 키워드 ChatGPT, Claude, Gemini, 비교, 선택
- realize: 3 브랜드 로고 삼각 배치 + 중앙 accent 메시지.

### `P32_big_ratio_contrast` — 거대 2-column 수치 대비
- 매칭: intent compare/contrast/emphasize · evidence statistic
- realize: Split 1:1 + 거대 숫자+단위 좌/우, 중앙 세로선 divider.

### `P33_chat_conversation` — ChatBubble 대화 (사용자 vs AI)
- 매칭: intent contrast/explain/myth-reality · 키워드 잠깐, 사실은, 오해, \, , , , 
- realize: Split — 좌 사용자 (white bubble) + 우 AI (mint bubble) 비대칭.

### `P34_quad_mockup` — 4 mockup 반복 가로 (다 비슷비슷)
- 매칭: intent example/contrast/emphasize · 키워드 비슷비슷, 똑같, 다 같, AI가 만든
- realize: Grid columns:4 + 브라우저 mockup 동일 placeholder 반복.

### `P35_stat_with_bullets_side` — 링/원 + 오른쪽 아이콘+라벨 리스트
- 매칭: intent focus/emphasize/list · evidence statistic
- realize: Split 1:1.2 — 좌 대형 링(68% 등) + 우 4~5 아이콘 라벨 행.

### `P37_brand_card_triptych` — 3 브랜드 카드 (강조 border)
- 매칭: intent compare/contrast/introduce · 키워드 ChatGPT, Claude, Gemini, 비교, 모델
- realize: Grid 3 — 각 카드 border accent 다르게 (green/yellow/neutral).

### `P38_hero_wordmark` — 거대 wordmark (단어/키워드)
- 매칭: intent emphasize/define/introduce
- realize: 화면 가득 메시지/단어 (200px+). 옆에 작은 아이콘/부제.

### `P39_big_number_context_sub` — 거대 숫자 + 좌 아이콘/인물 + 하단 부제
- 매칭: intent emphasize/compare · evidence statistic
- realize: Stack row: 좌 인물 icon + 우 거대 숫자. 아래 mint 부제.

### `P40_safety_priority_list` — 색상 우선순위 4단계 (빨→노→녹→녹)
- 매칭: intent list/enumerate/emphasize · 키워드 지켜, 주의, 금지, 필수, 원칙, 규칙
- realize: 4행 — 숫자 원 [빨/노/녹/녹] + 제목 굵게 + 부제 muted.

## 회피 규칙 (semantic cluster)

같은 `relationship`끼리 서로 대안이다. 직전 3씬과 signature가 2개 이상 겹치면 아래 묶음 안에서 **다른 focal_type**을 고른다.

- **metric**: `P01_mega_number`(ImpactStat) · `P02_number_hero_double_bar`(ImpactStat) · `P03_weekly_bars`(CompareBars) · `P04_ring_with_bullets`(RingChart) · `P35_stat_with_bullets_side`(RingChart) · `P39_big_number_context_sub`(ImpactStat)
- **contrast**: `P06_brand_bar_pair`(DevIcon) · `P18_vertical_dual_bar`(CompareBars) · `P19_two_col_contrast`(VersusCard) · `P21_vertical_dual_bar`(VerticalBars) · `P31_ai_comparison_triangle`(BrandSatellite) · `P32_big_ratio_contrast`(ImpactStat) · `P33_chat_conversation`(ChatBubble) · `P37_brand_card_triptych`(Grid)
- **flow**: `P08_vertical_timeline`(AnimatedTimeline) · `P09_number_chain_arrow`(FlowDiagram) · `P15_era_timeline`(AnimatedTimeline) · `P20_mini_flow`(FlowDiagram) · `P26_diagonal_flow`(DiagonalFlow) · `P27_ralph_loop`(CycleDiagram) · `P30_era_timeline_photo`(AnimatedTimeline)
- **evidence**: `P12_doc_split`(SvgGraphic) · `P22_browser_mockup`(BrowserMockup) · `P23_terminal_code`(TerminalBlock) · `P34_quad_mockup`(BrowserMockup)
- **enumerate**: `P05_ring_triplet`(RingChart) · `P07_tile_triplet`(Grid) · `P14_color_bar_bullet`(BulletList) · `P24_emoji_icon_row`(EmojiIconList) · `P28_priority_color_list`(BulletList) · `P40_safety_priority_list`(BulletList)
- **case**: `P10_hub_satellite`(CycleDiagram) · `P11_persona_stack`(ImageAsset) · `P13_radial_people`(SvgGraphic) · `P17_icon_title_sub_badge`(IconCard) · `P25_brand_satellite`(BrandSatellite) · `P29_radial_people`(SvgGraphic)
- **pause**: `P16_warning_triangle`(SvgGraphic) · `P38_hero_wordmark`(MarkerHighlight)
