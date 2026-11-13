import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import { Scene } from '../../../../src/scene';
import { Fit } from './shared';
import { NOTES } from './notes';
import { TitleScene, StillSlide, NestScene, ShotsSlide, SubwayScene, BeatsSlide, CardAnatomySlide } from './slides-a';
import { SketchScene, SubjectMotionSlide, LayersScene, FloorPlanScene, AdjectiveSlide, OutsideSlide, AssembleSlide } from './slides-b';
import { ProofScene, AskCardSlide, PracticeSlide, CompareSlide, ClosingSlide } from './slides-c';
import { ChatWalk, HiggsWalk } from './walks';

/* ── AI쇼츠제작 · 한 숏을 설계하다 — 장면 카드에서 프롬프트까지 (21장) ──
   plan: data/2026-2/AI쇼츠제작/장면-설계와-프롬프트/plan.md
   1 클래퍼보드 씬 → 2 멈춘 그림(build·워드클라우드) → 3 필름 띠 줌 씬(프레임·숏·장면) → 4 쪽지 콘티(build·객관식)
   → 5 노선도 씬(OpenMontage 공정) → 6 비트 맵(build) → 7 장면 카드 다섯 칸 → 8 스케치북 씬(본 적 없는 사람 시험)
   → 9 피사체·동작(build) → 10 종이 무대의 겹 씬(공간 구도) → 11 평면도 씬(돌리·줌·고정·객관식) → 12 감정 형용사(build·단답)
   → 13 영상 밖(오버레이) → 14 조립(build) → 15 교정지 씬(AI 초안·사람 승인) → 16 카드 B → 17 챗봇 walkthrough
   → 18 Higgsfield walkthrough → 19 실습 → 20 대조(build) → 21 정리(출구 티켓) */

export const SLIDE_COUNT = 21;

export default function AiShortsSceneDesignDeck() {
  return (
    <Deck>
      <Slide full nav="표지" notes={NOTES[1]}><Fit><Scene duration={3.4}><TitleScene /></Scene></Fit></Slide>
      <Slide full nav="멈춘 그림" notes={NOTES[2]}><Fit><StillSlide /></Fit></Slide>
      <Slide full nav="프레임·숏·장면" notes={NOTES[3]}><Fit><Scene duration={1.4}><NestScene /></Scene></Fit></Slide>
      <Slide full nav="숏 나누기" notes={NOTES[4]}><Fit><ShotsSlide /></Fit></Slide>
      <Slide full nav="제작 공정" notes={NOTES[5]}><Fit><Scene duration={3}><SubwayScene /></Scene></Fit></Slide>
      <Slide full nav="비트" notes={NOTES[6]}><Fit><BeatsSlide /></Fit></Slide>
      <Slide full nav="장면 카드" notes={NOTES[7]}><Fit><CardAnatomySlide /></Fit></Slide>
      <Slide full nav="본 적 없는 사람" notes={NOTES[8]}><Fit><Scene duration={1.6}><SketchScene /></Scene></Fit></Slide>
      <Slide full nav="피사체·동작" notes={NOTES[9]}><Fit><SubjectMotionSlide /></Fit></Slide>
      <Slide full nav="공간 구도" notes={NOTES[10]}><Fit><Scene duration={6}><LayersScene /></Scene></Fit></Slide>
      <Slide full nav="카메라" notes={NOTES[11]}><Fit><Scene duration={0.6}><FloorPlanScene /></Scene></Fit></Slide>
      <Slide full nav="감정 형용사" notes={NOTES[12]}><Fit><AdjectiveSlide /></Fit></Slide>
      <Slide full nav="영상 밖" notes={NOTES[13]}><Fit><OutsideSlide /></Fit></Slide>
      <Slide full nav="조립" notes={NOTES[14]}><Fit><AssembleSlide /></Fit></Slide>
      <Slide full nav="초안과 승인" notes={NOTES[15]}><Fit><Scene duration={6}><ProofScene /></Scene></Fit></Slide>
      <Slide full nav="카드 B" notes={NOTES[16]}><Fit><AskCardSlide /></Fit></Slide>
      <Slide full nav="조수 시연" notes={NOTES[17]}><Fit><Scene><ChatWalk /></Scene></Fit></Slide>
      <Slide full nav="Higgsfield 시연" notes={NOTES[18]}><Fit><Scene><HiggsWalk /></Scene></Fit></Slide>
      <Slide full nav="실습" notes={NOTES[19]}><Fit><PracticeSlide /></Fit></Slide>
      <Slide full nav="대조" notes={NOTES[20]}><Fit><CompareSlide /></Fit></Slide>
      <Slide full nav="정리" notes={NOTES[21]}><Fit><Scene duration={0.8}><ClosingSlide /></Scene></Fit></Slide>
    </Deck>
  );
}
