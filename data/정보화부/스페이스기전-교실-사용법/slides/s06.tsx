import { Scene, useSceneTime, interpolate, easeInOut } from '../../../../src/scene';
import { Head, SceneSubs, Cursor, ring, Glyph, LOOK, type SlideMeta, type Sub, type Look } from '../kit';
import { Browser, EditorBody, IT, BLUE, tilePos, rowPos, type Item } from './_web';

/* 6 — walkthrough: 구글 앱과 웹사이트 넣기
   구도: 넓은 PC 화면의 세팅 창 하나 — 오른쪽 «더하기»에서 누른 타일 사본이 포물선을 그리며
   왼쪽 «독에 놓일 순서»로 날아가 쌓이고, 아래 독 미리 보기가 한 칸씩 늘어난다. */

const T = { G: 1.6, TAB: 3.2, PADLET: 4.2, TK: 5.2, URLF: 6.6, URL_T: 6.9, NAMEF: 8.8, NAME_T: 9.1, ADD: 10.6 };
const DUR = 14;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };
const URL = 'www.myschool.hs.kr';
const UNAME = '학교 홈페이지';
const FLY = 0.65;

const SUBS: Sub[] = [
  { at: 0, text: '넣고 싶은 타일을 누르면 왼쪽 «독에 놓일 순서»에 들어갑니다. 다시 누르면 빠집니다.' },
  { at: 3.0, text: '패들렛·띵커벨처럼 자주 쓰는 사이트는 «웹사이트» 탭에 미리 준비되어 있습니다.' },
  { at: 6.4, text: '목록에 없는 사이트는 «다른 사이트 넣기»에 주소를 넣으세요. 특정 반의 클래스룸 주소도 여기에 넣습니다.' },
  { at: 11.0, text: '아래 독 미리 보기가 교실 화면에 실제로 놓일 모습입니다.' },
];

const WIN = { x: 72, y: 156, w: 1776, h: 784 };
/* 포인터 좌표(씬 %) — measure_pointer.mjs 실측 2026-10-15 */
const TG = {
  g: { x: 52.9, y: 54.1 }, tab: { x: 57.5, y: 46.6 }, padlet: { x: 52.5, y: 53.0 }, tk: { x: 90.6, y: 53.0 },
  urlf: { x: 60.9, y: 68.6 }, namef: { x: 79.7, y: 68.6 }, add: { x: 90.4, y: 68.6 },
};

/* 넣는 순서: [항목, 출발 본문 좌표, 시각] */
const ADDS: { it: Item; from: { x: number; y: number }; at: number; look: Look }[] = [
  { it: IT.classroom, from: tilePos('google', 0), at: T.G, look: LOOK.classroom },
  { it: IT.padlet, from: tilePos('url', 0), at: T.PADLET, look: LOOK.site },
  { it: IT.tkbell, from: tilePos('url', 6), at: T.TK, look: LOOK.site },
  { it: IT.school, from: { x: 1663, y: 540 }, at: T.ADD, look: LOOK.site },
];

function Stage() {
  const t = useSceneTime();
  const items = ADDS.filter((a) => t >= a.at + FLY).map((a) => a.it);
  const tab = t >= T.TAB ? 'url' : 'google';
  const picked = ['classroom', ...(t >= T.PADLET + FLY ? ['패들렛'] : []), ...(t >= T.TK + FLY ? ['띵커벨'] : [])].filter((k) => k !== 'classroom' || t >= T.G);
  const nU = Math.max(0, Math.min(URL.length, Math.floor((t - T.URL_T) * 12)));
  const nN = Math.max(0, Math.min(UNAME.length, Math.floor((t - T.NAME_T) * 8)));
  const added = t >= T.ADD + 0.2;
  return (
    <>
      <Head chapter="② 세팅 만들기 · 4/7" title="타일을 누르면 들어간다" />
      <Browser x={WIN.x} y={WIN.y} w={WIN.w} h={WIN.h} url="spacekijun.lovable.app/classroom">
        <EditorBody
          name="1-3 정보 수업" items={items} tab={tab} picked={picked}
          urlText={added ? '' : URL.slice(0, nU)} urlName={added ? '' : UNAME.slice(0, nN)}
          urlFocus={t >= T.URLF && t < T.NAMEF} nameFieldFocus={t >= T.NAMEF && t < T.ADD}
          ring={{
            'g-classroom': ring(t, T.G, BLUE), 'tab-url': ring(t, T.TAB, BLUE), 's-패들렛': ring(t, T.PADLET, BLUE), 's-띵커벨': ring(t, T.TK, BLUE),
            'url-input': ring(t, T.URLF, BLUE), 'url-name': ring(t, T.NAMEF, BLUE), 'url-add': ring(t, T.ADD, BLUE),
          }}
        >
          {/* 날아가는 타일 사본 — 포물선 */}
          {ADDS.map((a, i) => {
            if (t < a.at || t > a.at + FLY) return null;
            const u = easeInOut(interpolate(t, [a.at, a.at + FLY], [0, 1]));
            const to = rowPos(i);
            const x = a.from.x + (to.x - a.from.x) * u;
            const y = a.from.y + (to.y - a.from.y) * u - 150 * Math.sin(Math.PI * u);
            return (
              <div key={a.it.id} style={{ position: 'absolute', left: x - 24, top: y - 24, zIndex: 5, transform: `scale(${1.15 - 0.3 * u}) rotate(${-10 * Math.sin(Math.PI * u)}deg)`, filter: 'drop-shadow(0 10px 14px rgba(15,23,42,.3))' }}>
                <Glyph look={a.look} size={48} />
              </div>
            );
          })}
        </EditorBody>
      </Browser>
      <Cursor path={[
        { t: 0.6, x: 70, y: 70 },
        { t: T.G, x: TG.g.x, y: TG.g.y, click: true },
        { t: T.TAB, x: TG.tab.x, y: TG.tab.y, click: true },
        { t: T.PADLET, x: TG.padlet.x, y: TG.padlet.y, click: true },
        { t: T.TK, x: TG.tk.x, y: TG.tk.y, click: true },
        { t: T.URLF, x: TG.urlf.x, y: TG.urlf.y, click: true },
        { t: T.NAMEF, x: TG.namef.x, y: TG.namef.y, click: true },
        { t: T.ADD, x: TG.add.x, y: TG.add.y, click: true },
        { t: 12.4, x: 50, y: 80 },
      ]} />
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

