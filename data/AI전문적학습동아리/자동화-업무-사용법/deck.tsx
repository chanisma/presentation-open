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

/* ── 스페이스기전 데스크 자동화 업무 사용법 (교사 안내 영상 · 11장) ──────────────
   plan.md(같은 폴더)가 기획 원본. 슬라이드 본문은 slides/sNN.tsx, 공용 틀은 kit.tsx(에이전트 터미널 덱의 틀을 옮김).
   실화면 screens/: 독·패널은 NEIS_helper app/web 을 가짜 데스크 응답으로 렌더한 화면. 스킬 사용 장면(6~9장)은 실제 발송을
   하지 않으려고 재구성한 대화 화면이다. 장면 시각은 나레이션 녹음 길이(voice.ts)에서 잡는다.
   영상 내보내기: TIMING(단계별 초)을 video/record.mjs가 window.__AUG_TIMING 으로 읽는다. */

const SLIDES: [ComponentType, SlideMeta, string][] = [
  [S01, m01, '말 한 줄로 맡기는 학교 업무'],
  [S02, m02, '에이전트 · 스킬 · MCP'],
  [S03, m03, '스킬'],
  [S04, m04, 'MCP'],
  [S05, m05, '자동화 업무 패널'],
  [S06, m06, '쿨메신저 쪽지'],
  [S07, m07, '리로스쿨 문자'],
  [S08, m08, 'SPACEKIJUN 업무 도구'],
  [S09, m09, '스킬 엮어 쓰기'],
  [S10, m10, '읽을 수 있는 데이터'],
  [S11, m11, '안전하게 쓰기'],
];

export const SLIDE_COUNT = SLIDES.length;
export const TIMING = SLIDES.map(([, m]) => stepDurations(m));
if (typeof window !== 'undefined') (window as unknown as { __AUG_TIMING?: number[][] }).__AUG_TIMING = TIMING;

export default function AutomationGuideDeck() {
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
