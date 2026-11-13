import { Scene, useSceneTime, interpolate, easeInOut } from '../../../../src/scene';
import { C, MONO, Head, SceneSubs, Cursor, StepRail, SHOT, window4, type Key, type SlideMeta, type Sub } from '../kit';
import { Hi, onBox, midBox, ptBox, type Box } from './_b';

/* 10 — walkthrough: 폴더가 여럿이거나 없을 때 · 자주 쓰는 폴더 (실화면 A-06 → A-03 → A-11b → A-07a)
   메타포: 책갈피 꽂기 — ☆를 누른 폴더 줄이 아래 «자주 쓰는 폴더» 서랍으로 날아가 꽂힌다.
   좌표는 패널 캡처(808×1008) px, 2026-10-16 실화면에서 잼. */

const T = { MULTI: 0, STAR_IN: 4.4, STAR: 5.6, FAV: 6.0, NONE: 9.6, ADD: 11.6, DIALOG: 12.1 };
const DUR = 16;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '탐색기 탭이 여러 개면 폴더도 여러 개라, 패널에서 하나를 고르게 합니다.' },
  { at: T.STAR_IN, text: '자주 여는 폴더는 별을 눌러 «자주 쓰는 폴더»에 넣어 두세요.' },
  { at: T.NONE, text: '폴더를 못 찾았을 때는 자주 쓰는 폴더에서 고르거나 «＋ 폴더 넣기»로 직접 넣습니다.' },
];

const P: Box = { x: 640, y: 146, k: 0.79 };
const R = {
  multiHead: [50, 422, 360, 34],
  multiRows: [44, 474, 720, 260],
  rowFolder: [44, 470, 726, 82],     // A-03 지금 보던 창의 폴더 줄
  star: [604, 488, 44, 44],          // A-03 ☆
  favRow: [44, 650, 726, 82],        // A-11b 자주 쓰는 폴더에 꽂힌 줄
  toast: [240, 816, 330, 70],
  none: [50, 470, 700, 40],
  add: [54, 652, 160, 52],           // A-07a ＋ 폴더 넣기
} as const;

function Stage() {
  const t = useSceneTime();
  const shot = t < T.STAR_IN ? 'A-06-패널-폴더여러개' : t < T.FAV ? 'A-03-패널-기본' : t < T.NONE ? 'A-11b-패널-즐겨찾기토스트' : 'A-07a-패널-보던창-폴더없음';
  const shots = ['A-06-패널-폴더여러개', 'A-03-패널-기본', 'A-11b-패널-즐겨찾기토스트', 'A-07a-패널-보던창-폴더없음'];
  const fly = interpolate(t, [T.FAV - 0.15, T.FAV + 0.9], [0, 1], easeInOut);
  const dlg = interpolate(t, [T.DIALOG, T.DIALOG + 0.45], [0, 1]);
  const star = midBox(P, R.star);
  const add = midBox(P, R.add);
  const path: Key[] = [
    { t: 1.4, ...ptBox(P, 560, 640) },
    { t: 2.6, ...ptBox(P, 300, 510) },
    { t: 3.6, ...ptBox(P, 300, 690) },
    { t: 4.8, ...ptBox(P, 520, 600) },
    { t: T.STAR, ...star, click: true },
    { t: 10.6, ...ptBox(P, 400, 560) },
    { t: T.ADD, ...add, click: true },
    { t: 13.2, ...ptBox(P, 360, 760), hide: true },
  ];
  return (
    <>
      <Head chapter="③ 열기 · 4/4" title="폴더가 여럿이거나 없을 때 · 자주 쓰는 폴더" />
      <StepRail t={t} steps={['여럿이면 하나 고르기', '☆로 자주 쓰는 폴더에 넣기', '못 찾으면 ＋ 폴더 넣기']} at={[0, T.STAR_IN, T.NONE]} x={60} y={210} w={300} />
      {shots.map((s) => (
        <img key={s} src={SHOT(s)} alt="" style={{ position: 'absolute', left: P.x, top: P.y, width: 808 * P.k, borderRadius: 24, opacity: s === shot ? 1 : 0, transition: 'opacity .3s', boxShadow: '0 30px 70px -30px rgba(31,27,22,.55)' }} />
      ))}
      <Hi style={onBox(P, R.multiHead)} on={window4(t, 0.4, 0.8, 2.0, 2.4)} label="폴더가 여럿 — 하나를 고르세요" side="right" />
      <Hi style={onBox(P, R.multiRows)} on={window4(t, 2.2, 2.6, 4.0, 4.4)} label="탐색기 탭마다 한 줄" side="right" />
      <Hi style={onBox(P, R.star)} on={window4(t, T.STAR - 0.6, T.STAR - 0.3, T.STAR + 0.2, T.STAR + 0.5)} />
      {/* 책갈피 꽂기 — ☆를 누른 줄의 사본이 자주 쓰는 폴더 자리로 날아간다 */}
      {t > T.FAV - 0.15 && t < T.FAV + 1.3 && (
        <div style={{
          ...onBox(P, [R.rowFolder[0], R.rowFolder[1] + (R.favRow[1] - R.rowFolder[1]) * fly, R.rowFolder[2], R.rowFolder[3]]),
          borderRadius: 12, border: `3px solid ${C.gold}`, background: 'rgba(217,105,46,.12)', boxShadow: '0 16px 30px -12px rgba(217,105,46,.6)',
          opacity: 1 - interpolate(t, [T.FAV + 0.9, T.FAV + 1.3], [0, 1]), zIndex: 30,
        }} />
      )}
      <Hi style={onBox(P, R.favRow)} on={window4(t, T.FAV + 0.9, T.FAV + 1.2, 8.8, 9.2)} label="자주 쓰는 폴더에 꽂힘" side="right" />
      <Hi style={onBox(P, R.toast)} on={window4(t, 7.4, 7.7, 8.8, 9.2)} label="알림" side="right" size={18} />
      <Hi style={onBox(P, R.none)} on={window4(t, T.NONE + 0.3, T.NONE + 0.6, T.ADD - 0.6, T.ADD - 0.3)} label="보던 창에서 폴더를 찾지 못함" side="top" />
      <Hi style={onBox(P, R.add)} on={window4(t, T.ADD - 0.4, T.ADD - 0.1, DUR + 1, DUR + 2)} />
      {/* 오른쪽: 단계별 해설 */}
      <div style={{ position: 'absolute', left: 1330, top: 230, width: 540, opacity: window4(t, 0.6, 1.0, T.STAR_IN - 0.3, T.STAR_IN) }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: C.ink }}>탐색기 탭이 여럿 = 폴더도 여럿</div>
        <div style={{ marginTop: 10, fontSize: 21, lineHeight: 1.55, color: C.muted, wordBreak: 'keep-all' }}>독을 왼쪽 클릭해도 바로 열지 않고 패널을 띄웁니다. 맡길 폴더의 줄을 누르면 그 폴더에서 열리고 패널은 접힙니다.</div>
      </div>
      <div style={{ position: 'absolute', left: 1330, top: 230, width: 540, opacity: window4(t, T.STAR_IN + 0.3, T.STAR_IN + 0.7, T.NONE - 0.3, T.NONE) }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: C.ink }}>☆ = 책갈피</div>
        <div style={{ marginTop: 10, fontSize: 21, lineHeight: 1.55, color: C.muted, wordBreak: 'keep-all' }}>넣은 폴더는 패널의 «자주 쓰는 폴더»에 남아, 탐색기를 열지 않아도 바로 고를 수 있습니다. 20개까지 넣고 ✕로 뺍니다.</div>
        <div style={{ marginTop: 14, fontFamily: MONO, fontSize: 17, color: C.gold }}>«자주 쓰는 폴더에 넣었습니다.»</div>
      </div>
      {/* Windows 폴더 고르기 창(추상 목업) */}
      <div style={{ position: 'absolute', left: 1330, top: 300, width: 520, borderRadius: 10, overflow: 'hidden', background: '#fff', border: '1px solid rgba(31,27,22,.2)',
        boxShadow: '0 30px 60px -24px rgba(31,27,22,.55)', opacity: dlg, transform: `translateY(${(1 - dlg) * 16}px)` }}>
        <div style={{ height: 38, background: '#eef1f5', display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 16, color: C.ink, borderBottom: '1px solid rgba(31,27,22,.1)' }}>폴더 선택</div>
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {['문서', '2학기 수업', '학급 운영', '교과협의회'].map((n, i) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, color: C.ink, padding: '6px 8px', borderRadius: 6, background: i === 1 ? 'rgba(74,95,193,.12)' : 'transparent' }}>
              <span style={{ width: 22, height: 17, borderRadius: 3, background: '#f2c14e' }} />{n}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '10px 14px 14px' }}>
          <span style={{ fontSize: 16, padding: '6px 16px', borderRadius: 6, border: '1px solid rgba(31,27,22,.2)' }}>취소</span>
          <span style={{ fontSize: 16, padding: '6px 16px', borderRadius: 6, background: '#3b6fd8', color: '#fff' }}>폴더 선택</span>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 1330, top: 640, width: 520, fontSize: 20, lineHeight: 1.5, color: C.muted, opacity: dlg, wordBreak: 'keep-all' }}>
        Windows 폴더 고르기 창에서 폴더를 고르면 «자주 쓰는 폴더»에 바로 들어갑니다.
      </div>
      <Cursor path={path} />
      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S10() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
