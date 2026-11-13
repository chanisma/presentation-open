import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import { Scene } from '../../../../src/scene';
import { Fit } from './shared';
import { NOTES } from './notes';
import { TitleScene, QuestionsSlide, SandScene, GitHubSlide, SaveScene, PushSlide, NametagSlide } from './slides-a';
import { CardsSlide, ShopScene, TroubleSlide, PracticeSlide, ChalkScene, SheetSlide, KeySlide, KeysScene, LockerSlide } from './slides-b';
import { ConveyorScene, GlassScene, OutletScene, KitSlide, ChecklistSlide, ClosingScene } from './slides-c';
import { SignupWalk, NewRepoWalk, PushWalk, PagesWalk, SupabaseWalk, PluginWalk, GuestbookWalk } from './walks';

/* ── 바이브코딩 · 내 폴더에서 세상으로 — GitHub · Supabase · MCP (29장) ──
   plan: data/2026-2/바이브코딩/GitHub와-Supabase/plan.md
   1 여권 표지 씬 → 2 질문 꼬리표(build) → 3 모래성과 파도 씬(choice) → 4 Git과 GitHub(build) → 5 세이브 슬롯 씬(커밋)
   → 6 서랍과 우체통(build·choice) → 7 GitHub 가입 walkthrough → 8 이름표(build) → 9 빈 저장소 walkthrough
   → 10 커밋·푸시 walkthrough → 11 부탁 카드(build·복사) → 12 창고와 진열창 씬(Pages) → 13 Pages 켜기 walkthrough
   → 14 안 열릴 때 표(static) → 15 실습·협업보드(activity) → 16 칠판과 지우개 씬(wordcloud) → 17 구글 시트(build)
   → 18 학번(static) → 19 방문증과 마스터키 씬 → 20 사물함(build·choice) → 21 컨베이어 씬(Supabase)
   → 22 Supabase 가입 walkthrough → 23 유리벽 씬 → 24 콘센트 씬(MCP·choice) → 25 키트 상자(build·플러그인)
   → 26 플러그인 설치 walkthrough → 27 방명록 walkthrough → 28 이륙 전 점검표(static) → 29 여권 도장 씬(exit) */

export const SLIDE_COUNT = 29;

export default function VibeGithubSupabaseDeck() {
  return (
    <Deck>
      <Slide full nav="표지" notes={NOTES[1]}><Fit><Scene duration={3.2}><TitleScene /></Scene></Fit></Slide>
      <Slide full nav="오늘의 질문" notes={NOTES[2]}><Fit><QuestionsSlide /></Fit></Slide>
      <Slide full nav="망쳤을 때" notes={NOTES[3]}><Fit><Scene duration={4}><SandScene /></Scene></Fit></Slide>
      <Slide full nav="Git·GitHub" notes={NOTES[4]}><Fit><GitHubSlide /></Fit></Slide>
      <Slide full nav="커밋" notes={NOTES[5]}><Fit><Scene duration={4.6}><SaveScene /></Scene></Fit></Slide>
      <Slide full nav="푸시" notes={NOTES[6]}><Fit><PushSlide /></Fit></Slide>
      <Slide full nav="가입" notes={NOTES[7]}><Fit><Scene><SignupWalk /></Scene></Fit></Slide>
      <Slide full nav="이름표" notes={NOTES[8]}><Fit><NametagSlide /></Fit></Slide>
      <Slide full nav="저장소 만들기" notes={NOTES[9]}><Fit><Scene><NewRepoWalk /></Scene></Fit></Slide>
      <Slide full nav="커밋·푸시 시연" notes={NOTES[10]}><Fit><Scene><PushWalk /></Scene></Fit></Slide>
      <Slide full nav="부탁 카드" notes={NOTES[11]}><Fit><CardsSlide /></Fit></Slide>
      <Slide full nav="Pages" notes={NOTES[12]}><Fit><Scene duration={3.8}><ShopScene /></Scene></Fit></Slide>
      <Slide full nav="Pages 켜기" notes={NOTES[13]}><Fit><Scene><PagesWalk /></Scene></Fit></Slide>
      <Slide full nav="안 열릴 때" notes={NOTES[14]}><Fit><TroubleSlide /></Fit></Slide>
      <Slide full nav="실습" notes={NOTES[15]}><Fit><PracticeSlide /></Fit></Slide>
      <Slide full nav="정적 사이트" notes={NOTES[16]}><Fit><Scene duration={4}><ChalkScene /></Scene></Fit></Slide>
      <Slide full nav="표·행·열" notes={NOTES[17]}><Fit><SheetSlide /></Fit></Slide>
      <Slide full nav="기본 키" notes={NOTES[18]}><Fit><KeySlide /></Fit></Slide>
      <Slide full nav="키 두 개" notes={NOTES[19]}><Fit><Scene duration={3.8}><KeysScene /></Scene></Fit></Slide>
      <Slide full nav="RLS" notes={NOTES[20]}><Fit><LockerSlide /></Fit></Slide>
      <Slide full nav="Supabase" notes={NOTES[21]}><Fit><Scene duration={3.8}><ConveyorScene /></Scene></Fit></Slide>
      <Slide full nav="Supabase 시연" notes={NOTES[22]}><Fit><Scene><SupabaseWalk /></Scene></Fit></Slide>
      <Slide full nav="유리벽" notes={NOTES[23]}><Fit><Scene duration={4}><GlassScene /></Scene></Fit></Slide>
      <Slide full nav="MCP" notes={NOTES[24]}><Fit><Scene duration={4.6}><OutletScene /></Scene></Fit></Slide>
      <Slide full nav="플러그인" notes={NOTES[25]}><Fit><KitSlide /></Fit></Slide>
      <Slide full nav="플러그인 설치" notes={NOTES[26]}><Fit><Scene><PluginWalk /></Scene></Fit></Slide>
      <Slide full nav="방명록 시연" notes={NOTES[27]}><Fit><Scene><GuestbookWalk /></Scene></Fit></Slide>
      <Slide full nav="안전 수칙" notes={NOTES[28]}><Fit><ChecklistSlide /></Fit></Slide>
      <Slide full nav="마무리" notes={NOTES[29]}><Fit><Scene duration={3.4}><ClosingScene /></Scene></Fit></Slide>
    </Deck>
  );
}
