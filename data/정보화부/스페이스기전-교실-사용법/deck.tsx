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
import S28, { meta as m28 } from './slides/s28';
import S29, { meta as m29 } from './slides/s29';
import S30, { meta as m30 } from './slides/s30';

/* ── 스페이스기전 교실 사용 방법 (영상용 30장) ─────────────────────────
   plan.md(같은 폴더)가 단일 진실 원천 — 슬라이드마다 form(walkthrough·build·scene·static)과
   형태 설계·자막을 그대로 따른다. 슬라이드 본문은 slides/sNN.tsx, 공용 크롬과 제품 부품은 kit.tsx.
   영상 내보내기: 아래 TIMING(단계별 초)을 녹화 스크립트(video/record.mjs)가 window.__SKCG_TIMING 으로 읽는다. */

const SLIDES: [ComponentType, SlideMeta, string][] = [
  [S01, m01, 'QR 한 번'],
  [S02, m02, '네 단계'],
  [S03, m03, '교실 기기 화면'],
  [S04, m04, '새 세팅'],
  [S05, m05, '더하기 탭'],
  [S06, m06, '구글 앱·사이트'],
  [S07, m07, '드라이브·프로그램'],
  [S08, m08, '순서와 저장'],
  [S09, m09, '복제·지우기'],
  [S10, m10, '늘 기다리는 PC'],
  [S11, m11, '기기 설정'],
  [S12, m12, '수업 시작'],
  [S13, m13, '독 한눈에'],
  [S14, m14, '독에서 열기'],
  [S15, m15, '드라이브 탐색기'],
  [S16, m16, '저장하면 드라이브로'],
  [S17, m17, '컴퓨터로 복사'],
  [S18, m18, '이 PC 에 복사한 파일'],
  [S19, m19, '드라이브 1시간'],
  [S20, m20, '구글 창'],
  [S21, m21, '휴대폰으로 로그인'],
  [S22, m22, '로그인 보관'],
  [S23, m23, '클래스룸'],
  [S24, m24, '슬라이드 발표'],
  [S25, m25, '설문지'],
  [S26, m26, '끝내는 세 방법'],
  [S27, m27, '남는 것·지우는 것'],
  [S28, m28, '전자칠판판'],
  [S29, m29, '문제가 생겼을 때'],
  [S30, m30, '한눈 정리'],
];

export const SLIDE_COUNT = SLIDES.length;
/** 영상 녹화 시간표 — TIMING[i] = i+1번 슬라이드의 단계별 머무는 초 */
export const TIMING = SLIDES.map(([, m]) => stepDurations(m));
if (typeof window !== 'undefined') (window as unknown as { __SKCG_TIMING?: number[][] }).__SKCG_TIMING = TIMING;

export default function SpacekijunClassroomGuideDeck() {
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
