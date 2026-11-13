import type { ComponentType } from 'react';
import Deck from '../../../src/deck/Deck';
import Slide from '../../../src/deck/Slide';
import { Fit, useDeckFonts, stepDurations, type SlideMeta } from './kit';
import { NOTES } from './notes';
import S01, { meta as m01 } from './slides/s01';
import S02, { meta as m02 } from './slides/s02';
import S03, { meta as m03 } from './slides/s03';
import S04, { meta as m04 } from './slides/s04';
import S05, { meta as m05 } from './slides/s05';
import S06, { meta as m06 } from './slides/s06';
import S07, { meta as m07 } from './slides/s07';
import S08, { meta as m08 } from './slides/s08';
import S09, { meta as m09 } from './slides/s09';
import S10, { meta as m10 } from './slides/s10';
import S11, { meta as m11 } from './slides/s11';
import S12, { meta as m12 } from './slides/s12';
import S13, { meta as m13 } from './slides/s13';
import S14, { meta as m14 } from './slides/s14';
import S15, { meta as m15 } from './slides/s15';
import S16, { meta as m16 } from './slides/s16';
import S17, { meta as m17 } from './slides/s17';
import S18, { meta as m18 } from './slides/s18';
import S19, { meta as m19 } from './slides/s19';
import S20, { meta as m20 } from './slides/s20';
import S21, { meta as m21 } from './slides/s21';
import S22, { meta as m22 } from './slides/s22';
import S23, { meta as m23 } from './slides/s23';
import S24, { meta as m24 } from './slides/s24';
import S25, { meta as m25 } from './slides/s25';
import S26, { meta as m26 } from './slides/s26';
import S27, { meta as m27 } from './slides/s27';

/* ── 에이전트 터미널 사용법과 활용 (교사 연수 영상 · 27장) ──────────────────
   plan.md(같은 폴더)가 단일 진실 원천. 슬라이드 본문은 slides/sNN.tsx, 공용 크롬과 실화면 틀은 kit.tsx.
   실화면은 screens/<이름>.jpg — 독·패널(A-*)은 NEIS_helper 실제 화면을 가짜 응답으로 렌더, 터미널(B-*)은 실제 Claude Code·Codex 실행.
   영상 내보내기: TIMING(단계별 초)을 video/record.mjs가 window.__ATG_TIMING 으로 읽는다. */

const SLIDES: [ComponentType, SlideMeta, string][] = [
  [S01, m01, "답해 주는 AI, 일해 주"],
  [S02, m02, "이 영상의 길"],
  [S03, m03, "독에서 에이전트 터미널 찾"],
  [S04, m04, "처음 한 번"],
  [S05, m05, "무엇이 필요한가"],
  [S06, m06, "처음 실행"],
  [S07, m07, "왼쪽 클릭"],
  [S08, m08, "패널 한눈에 보기"],
  [S09, m09, "보던 창은 어떻게 정해질까"],
  [S10, m10, "폴더가 여럿이거나 없을 때"],
  [S11, m11, "터미널 화면 읽는 법"],
  [S12, m12, "첫 요청"],
  [S13, m13, "허락하고 맡기기"],
  [S14, m14, "권한 확인, 무엇을 묻는가"],
  [S15, m15, "권한 묻지 않기, 언제 켜"],
  [S16, m16, "설문 결과를 요약하기"],
  [S17, m17, "수업 메모로 학습지 초안 "],
  [S18, m18, "좋은 요청의 네 가지"],
  [S19, m19, "회의록에서 할 일만 뽑기"],
  [S20, m20, "퀴즈 웹페이지 만들기"],
  [S21, m21, "이런 일에 맡겨 보세요"],
  [S22, m22, "Codex로도 똑같이"],
  [S23, m23, "안전하게 쓰는 다섯 가지"],
  [S24, m24, "학생판에서 쓸 때"],
  [S25, m25, "끝내고 이어 하기"],
  [S26, m26, "막히면 여기부터"],
  [S27, m27, "한눈 정리"],
];

export const SLIDE_COUNT = SLIDES.length;
export const TIMING = SLIDES.map(([, m]) => stepDurations(m));
if (typeof window !== 'undefined') (window as unknown as { __ATG_TIMING?: number[][] }).__ATG_TIMING = TIMING;

export default function AgentTerminalGuideDeck() {
  useDeckFonts();
  return (
    <Deck>
      {SLIDES.map(([Body, , nav], i) => (
        <Slide key={i} full nav={nav} notes={NOTES[i + 1]}>
          <Fit>
            <Body />
          </Fit>
        </Slide>
      ))}
    </Deck>
  );
}
