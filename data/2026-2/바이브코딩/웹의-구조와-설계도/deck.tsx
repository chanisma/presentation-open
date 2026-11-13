import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import { Scene } from '../../../../src/scene';
import { Fit } from './shared';
import { NOTES } from './notes';
import { TitleScene, OneLineSlide, LibraryScene, WhereSlide, KitchenScene, RollbookScene, ThreeWaysSlide, MovingScene, MapSlide } from './slides-a';
import { DiceScene, FourPanelsSlide, BagScene, StoryboardSlide, PickSlide, MdFileSlide, InterviewScene, AnatomySlide } from './slides-b';
import { InterviewWalk, ProofSlide, CopySlide, PracticeSlide, ClosingScene } from './slides-c';

/* ── 바이브코딩 · 웹의 구조와 설계도 — 에이전트가 묻고, 내가 정한다 (22장) ──
   plan: data/2026-2/바이브코딩/웹의-구조와-설계도/plan.md
   1 청사진 표지 씬 → 2 한 줄이면 될까(build) → 3 도서관 대출 창구 씬(요청·응답) → 4 file:// vs https://(build·ox)
   → 5 식당 홀과 주방 씬(프론트·백) → 6 출석부 씬(DB) → 7 저장 세 갈래(build·choice) → 8 이사와 문패 씬(배포·호스팅·도메인)
   → 9 다마고찌 지도(static) → 10 빈칸 주사위 씬(wordcloud) → 11 설계도 네 칸(build) → 12 수학여행 가방 씬(MVP)
   → 13 화면 콘티(static) → 14 지도에서 고르기(build) → 15 설계도.md(static) → 16 문진표 씬(역할 뒤집기)
   → 17 프롬프트 해부(build) → 18 Codex 인터뷰 walkthrough → 19 교정지(build) → 20 프롬프트 복사(static)
   → 21 실습·협업보드(activity) → 22 1층과 비계 씬(exit) */

export default function VibeWebBlueprintDeck() {
  return (
    <Deck>
      <Slide full nav="표지" notes={NOTES[1]}><Fit><Scene duration={5}><TitleScene /></Scene></Fit></Slide>
      <Slide full nav="한 줄이면" notes={NOTES[2]}><Fit><OneLineSlide /></Fit></Slide>
      <Slide full nav="요청·응답" notes={NOTES[3]}><Fit><Scene duration={5.2}><LibraryScene /></Scene></Fit></Slide>
      <Slide full nav="file://" notes={NOTES[4]}><Fit><WhereSlide /></Fit></Slide>
      <Slide full nav="프론트·백엔드" notes={NOTES[5]}><Fit><Scene duration={4.8}><KitchenScene /></Scene></Fit></Slide>
      <Slide full nav="데이터베이스" notes={NOTES[6]}><Fit><Scene duration={4.6}><RollbookScene /></Scene></Fit></Slide>
      <Slide full nav="저장 세 갈래" notes={NOTES[7]}><Fit><ThreeWaysSlide /></Fit></Slide>
      <Slide full nav="배포" notes={NOTES[8]}><Fit><Scene duration={5}><MovingScene /></Scene></Fit></Slide>
      <Slide full nav="지도" notes={NOTES[9]}><Fit><MapSlide /></Fit></Slide>
      <Slide full nav="추측" notes={NOTES[10]}><Fit><Scene duration={4.4}><DiceScene /></Scene></Fit></Slide>
      <Slide full nav="네 칸" notes={NOTES[11]}><Fit><FourPanelsSlide /></Fit></Slide>
      <Slide full nav="MVP" notes={NOTES[12]}><Fit><Scene duration={5.2}><BagScene /></Scene></Fit></Slide>
      <Slide full nav="화면 흐름" notes={NOTES[13]}><Fit><StoryboardSlide /></Fit></Slide>
      <Slide full nav="기술 구조" notes={NOTES[14]}><Fit><PickSlide /></Fit></Slide>
      <Slide full nav="설계도.md" notes={NOTES[15]}><Fit><MdFileSlide /></Fit></Slide>
      <Slide full nav="역할 뒤집기" notes={NOTES[16]}><Fit><Scene duration={5.2}><InterviewScene /></Scene></Fit></Slide>
      <Slide full nav="프롬프트 해부" notes={NOTES[17]}><Fit><AnatomySlide /></Fit></Slide>
      <Slide full nav="시연" notes={NOTES[18]}><Fit><Scene duration={15.8}><InterviewWalk /></Scene></Fit></Slide>
      <Slide full nav="잘 받는 법" notes={NOTES[19]}><Fit><ProofSlide /></Fit></Slide>
      <Slide full nav="프롬프트 복사" notes={NOTES[20]}><Fit><CopySlide /></Fit></Slide>
      <Slide full nav="실습" notes={NOTES[21]}><Fit><PracticeSlide /></Fit></Slide>
      <Slide full nav="마무리" notes={NOTES[22]}><Fit><Scene duration={5}><ClosingScene /></Scene></Fit></Slide>
    </Deck>
  );
}
