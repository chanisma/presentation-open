import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import { Scene } from '../../../../src/scene';
import { Fit } from './shared';
import { NOTES } from './notes';
import { FeedScene, PositionSlide, LanesSlide, TwoTypesSlide, DripScene, HooksSlide, GapSlide } from './slides-a';
import { CoasterScene, ButThereforeSlide, MisconceptionSlide, HourglassScene, TrimSlide, CuesSlide, VoiceSlide, SafeZoneSlide } from './slides-b';
import { SilentScriptSlide, ScoreScene, ChecklistSlide, DelegateSlide, CardDSlide, PracticeSlide, MirrorScene } from './slides-c';

/* ── AI쇼츠제작 · 첫 1초부터 마지막 장면까지 — 쇼츠 대본 쓰기 (22장) ──
   plan: data/2026-2/AI쇼츠제작/쇼츠-대본-쓰기/plan.md
   1 피드 넘기는 엄지 씬 → 2 오늘의 위치(build·워드클라우드) → 3 네 줄 → 4 나레이션형·무대사형(build)
   → 5 드립 깔때기 씬(핵심 메시지) → 6 훅 네 가지(build) → 7 정보의 빈틈(build·선택) → 8 롤러코스터 씬(비트 맵)
   → 9 그런데·그래서(build) → 10 오해 먼저(build) → 11 모래시계 씬(글자 예산·단답) → 12 덜어내기(build·객관식)
   → 13 화면 단서 → 14 목소리 지시(build) → 15 자막·안전 영역 → 16 무대사형 대본(build) → 17 네 성부 악보 씬
   → 18 점검표 → 19 조수에게 맡길 것(build) → 20 카드 D → 21 실습 → 22 S1의 거울 씬(출구 티켓) */

export const SLIDE_COUNT = 22;

export default function AiShortsScriptDeck() {
  return (
    <Deck>
      <Slide full nav="표지" notes={NOTES[1]}><Fit><Scene duration={4.4}><FeedScene /></Scene></Fit></Slide>
      <Slide full nav="오늘의 위치" notes={NOTES[2]}><Fit><PositionSlide /></Fit></Slide>
      <Slide full nav="네 줄" notes={NOTES[3]}><Fit><LanesSlide /></Fit></Slide>
      <Slide full nav="두 가지 대본" notes={NOTES[4]}><Fit><TwoTypesSlide /></Fit></Slide>
      <Slide full nav="핵심 메시지" notes={NOTES[5]}><Fit><Scene duration={4.8}><DripScene /></Scene></Fit></Slide>
      <Slide full nav="훅" notes={NOTES[6]}><Fit><HooksSlide /></Fit></Slide>
      <Slide full nav="정보의 빈틈" notes={NOTES[7]}><Fit><GapSlide /></Fit></Slide>
      <Slide full nav="비트 맵" notes={NOTES[8]}><Fit><Scene duration={6.6}><CoasterScene /></Scene></Fit></Slide>
      <Slide full nav="그런데·그래서" notes={NOTES[9]}><Fit><ButThereforeSlide /></Fit></Slide>
      <Slide full nav="오해 먼저" notes={NOTES[10]}><Fit><MisconceptionSlide /></Fit></Slide>
      <Slide full nav="글자 예산" notes={NOTES[11]}><Fit><Scene duration={6}><HourglassScene /></Scene></Fit></Slide>
      <Slide full nav="덜어내기" notes={NOTES[12]}><Fit><TrimSlide /></Fit></Slide>
      <Slide full nav="화면 단서" notes={NOTES[13]}><Fit><CuesSlide /></Fit></Slide>
      <Slide full nav="목소리 지시" notes={NOTES[14]}><Fit><VoiceSlide /></Fit></Slide>
      <Slide full nav="자막" notes={NOTES[15]}><Fit><SafeZoneSlide /></Fit></Slide>
      <Slide full nav="무대사형" notes={NOTES[16]}><Fit><SilentScriptSlide /></Fit></Slide>
      <Slide full nav="완성 대본" notes={NOTES[17]}><Fit><Scene duration={8.8}><ScoreScene /></Scene></Fit></Slide>
      <Slide full nav="점검표" notes={NOTES[18]}><Fit><ChecklistSlide /></Fit></Slide>
      <Slide full nav="AI 조수" notes={NOTES[19]}><Fit><DelegateSlide /></Fit></Slide>
      <Slide full nav="카드 D" notes={NOTES[20]}><Fit><CardDSlide /></Fit></Slide>
      <Slide full nav="실습" notes={NOTES[21]}><Fit><PracticeSlide /></Fit></Slide>
      <Slide full nav="정리" notes={NOTES[22]}><Fit><Scene duration={4.6}><MirrorScene /></Scene></Fit></Slide>
    </Deck>
  );
}
