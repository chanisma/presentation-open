import { Scene, useSceneTime, interpolate } from '../../../../src/scene';
import { popIn } from '../../../../src/walkthrough';
import { C, MONO, Head, SceneSubs, Screen, Mark, StepRail, SHOT, camAt, window4, type Cam, type Frame, type Shot, type SlideMeta, type Sub } from '../kit';
import { Gloss } from './_a';

/* 6 — walkthrough: 처음 실행 — 폴더 믿기와 로그인
   (B-00-첫실행-폴더신뢰확인 → 폴더신뢰선택 → 처음설치-테마선택 → 처음설치-로그인방법 → 첫실행-시작화면)
   메타포: 출입문 세 개 — 문마다 키(↓·Enter)를 누르면 다음 문이 열리고, 마지막에 대화 화면에 닿는다.
   터미널은 마우스가 아니라 키보드로 고르므로 포인터 대신 키 모양 칩을 띄운다. 좌표는 원본 1920×1080. */

const T = { DOWN: 2.4, S1: 2.8, ENTER1: 3.8, S2: 4.4, ENTER2: 6.2, S3: 6.8, ENTER3: 8.4, WEB: 8.8, S4: 10.8 };
const DUR = 15;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '처음 열면 이 폴더를 믿는지 묻습니다. 선생님이 만든 자료 폴더라면 «Yes, I trust this folder»를 고르세요.' },
  { at: T.S2, text: '다음으로 화면 글자 스타일을 고르고, 로그인 방법을 고릅니다.' },
  { at: T.WEB, text: '브라우저 창에서 계정으로 로그인하면 터미널로 돌아와 대화 화면이 열립니다. 이 과정은 처음 한 번뿐입니다.' },
];

const FR: Frame = { x: 250, y: 150, w: 1180, h: 664 };
const SHOTS: Shot[] = [
  { at: 0, src: SHOT('B-00-첫실행-폴더신뢰확인') },
  { at: T.S1, src: SHOT('B-00-첫실행-폴더신뢰선택'), fade: 0.05 },
  { at: T.S2, src: SHOT('B-00-처음설치-테마선택') },
  { at: T.S3, src: SHOT('B-00-처음설치-로그인방법') },
  { at: T.S4, src: SHOT('B-00-첫실행-시작화면') },
];
const CAMS: Cam[] = [
  { t: 0, cx: 640, cy: 320, z: 1.55 },
  { t: T.S2 - 0.01, cx: 640, cy: 320, z: 1.55 },
  { t: T.S2, cx: 520, cy: 640, z: 1.45 },
  { t: T.S3 - 0.01, cx: 520, cy: 640, z: 1.45 },
  { t: T.S3, cx: 680, cy: 680, z: 1.4 },
  { t: T.S4 - 0.01, cx: 680, cy: 680, z: 1.4 },
  { t: T.S4, cx: 960, cy: 540, z: 1 },
  { t: 12.4, cx: 960, cy: 540, z: 1 },
];

/** 키 모양 칩 — 누른 순간 눌림 */
function KeyCap({ t, at, label }: { t: number; at: number; label: string }) {
  const k = window4(t, at - 0.4, at - 0.15, at + 0.55, at + 0.8);
  if (k <= 0) return null;
  const press = t >= at && t < at + 0.18 ? 4 : 0;
  return (
    <div style={{ position: 'absolute', left: FR.x + FR.w - 210, top: FR.y + FR.h - 120, opacity: k, zIndex: 50 }}>
      <span style={{ display: 'inline-grid', placeItems: 'center', minWidth: 120, height: 76, padding: '0 22px', borderRadius: 14, background: '#fbfaf7', color: C.ink,
        fontFamily: MONO, fontSize: 30, fontWeight: 800, border: `2px solid ${C.ink}`, boxShadow: `0 ${8 - press}px 0 ${C.ink}`, transform: `translateY(${press}px)` }}>{label}</span>
    </div>
  );
}

function Stage() {
  const t = useSceneTime();
  const cam = camAt(CAMS, t);
  const phase = t < T.S2 ? 0 : t < T.S3 ? 1 : t < T.S4 ? 2 : 3;
  return (
    <>
      <Head chapter="② 준비 · 4/4" title="처음 실행: 폴더 믿기와 로그인" />
      <StepRail t={t} steps={['이 폴더를 믿나요?', '화면 스타일', '로그인 방법', '대화 화면']} at={[0, T.S2, T.S3, T.S4]} />
      <Screen shots={SHOTS} cams={CAMS} frame={FR} account="처음 한 번만 나오는 화면" />

      <Mark rect={[18, 466, 360, 30]} cam={cam} frame={FR} k={window4(t, T.S1, T.S1 + 0.2, T.ENTER1 + 0.3, T.S2)} />
      <Mark rect={[20, 606, 200, 30]} cam={cam} frame={FR} k={window4(t, T.S2 + 0.4, T.S2 + 0.7, T.ENTER2 + 0.3, T.S3)} />
      <Mark rect={[20, 696, 920, 30]} cam={cam} frame={FR} k={window4(t, T.S3 + 0.4, T.S3 + 0.7, T.ENTER3 + 0.3, T.S4)} />
      <Mark rect={[12, 925, 1886, 52]} cam={cam} frame={FR} k={window4(t, 12.6, 12.9, DUR + 1, DUR + 2)} label="여기에 요청을 씁니다" labelSide="top" />

      <KeyCap t={t} at={T.DOWN} label="↓" />
      <KeyCap t={t} at={T.ENTER1} label="Enter" />
      <KeyCap t={t} at={T.ENTER2} label="Enter" />
      <KeyCap t={t} at={T.ENTER3} label="Enter" />

      {/* 오른쪽: 영어 화면 문구의 우리말 뜻 */}
      <div style={{ position: 'absolute', left: 1462, top: 160, width: 400, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {phase === 0 && <>
          <div style={popIn(t, 0.4)}><Gloss en="Is this a project you created or one you trust?" ko="선생님이 만들었거나 믿는 폴더인가요?" /></div>
          <div style={popIn(t, 1.2)}><Gloss en="Claude Code'll be able to read, edit, and execute files here." ko="이 폴더의 파일을 읽고, 고치고, 실행하게 됩니다." /></div>
          <div style={popIn(t, T.S1)}><Gloss en="Yes, I trust this folder" ko="네, 이 폴더를 믿습니다 → Enter" /></div>
        </>}
        {phase === 1 && <div style={popIn(t, T.S2 + 0.3)}><Gloss en="Choose the text style that looks best with your terminal" ko="화면 글자 스타일 고르기 — 그대로 Enter" /></div>}
        {phase === 2 && <>
          <div style={popIn(t, T.S3 + 0.3)}><Gloss en="Select login method" ko="로그인 방법 고르기 — 구독 계정이면 1번" /></div>
          {t >= T.WEB && (
            <div style={{ ...popIn(t, T.WEB), background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 14px 30px -20px rgba(31,27,22,.5)' }}>
              <div style={{ height: 30, background: '#ece7de', display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px' }}>
                {[0, 1, 2].map((i) => <span key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: '#c9c1b4' }} />)}
                <span style={{ marginLeft: 10, fontSize: 13, color: C.muted }}>브라우저</span>
              </div>
              <div style={{ padding: '14px 16px', fontSize: 20, lineHeight: 1.5, color: C.ink, wordBreak: 'keep-all' }}>
                브라우저 창이 열리면<br /><b>계정으로 로그인</b> → 터미널로 돌아옵니다
              </div>
            </div>
          )}
        </>}
        {phase === 3 && <>
          <div style={popIn(t, T.S4 + 0.3)}><Gloss en="Claude Code v2.1.301 · 폴더 경로" ko="대화 화면 — 맨 위에 지금 일하는 폴더가 보입니다" /></div>
          <div style={popIn(t, T.S4 + 1.0)}><Gloss en="No, exit" ko="낯선 폴더라면 처음 문에서 «No, exit»" /></div>
        </>}
      </div>
      <div style={{ position: 'absolute', left: FR.x, top: FR.y + FR.h + 22, fontSize: 18, color: C.muted, opacity: interpolate(t, [0.5, 1], [0, 1]) }}>
        모델·요금제 표시(«Opus 5.5 · Claude Max»)는 촬영한 계정 기준이며 선생님 계정에 따라 다릅니다.
      </div>
      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S06() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
