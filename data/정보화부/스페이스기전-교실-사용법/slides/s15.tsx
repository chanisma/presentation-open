import { Scene, useSceneTime, interpolate, spring } from '../../../../src/scene';
import { popIn } from '../../../../src/walkthrough';
import { C, Head, SceneSubs, Cursor, ring, Dock, BASE_TILES, Chip, type SlideMeta, type Sub } from '../kit';
import { DriveWin, WordWin, KindIcon, type Row } from './_drive';

/* 15 — walkthrough: 드라이브 탐색기 — 내 드라이브를 폴더처럼
   구도: 탐색기 창 하나를 크게(왼쪽 2/3). 폴더를 들어갈 때마다 오른쪽 «계단» 인디케이터가 한 칸씩 내려간다. */

const T = { DOCK: 1.2, WIN: 1.5, PRESET: 3.6, WEEK: 5.6, FILE: 8.2, OPENING: 8.5, OPENED: 9.7, NOTE: 11.6 };
const DUR = 15;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '독의 «내 드라이브»를 누르면 드라이브 탐색기가 열립니다. 드라이브 전체를 Windows 폴더처럼 씁니다.' },
  { at: 3.3, text: '세팅에 넣은 폴더는 왼쪽 «이 수업 폴더»에 바로 있습니다. 두 번 누르면 들어갑니다.' },
  { at: 8.0, text: '파일을 두 번 누르면 받아서 교실 PC 프로그램으로 엽니다. 구글 문서는 Word 파일로 받아 엽니다.' },
  { at: T.NOTE, text: '실수를 막기 위해 여기서는 지우기와 이름 바꾸기를 할 수 없습니다.' },
];

/* 포인터 좌표(씬 %) — measure_pointer.mjs 실측 2026-10-15 */
const TG = { dock: { x: 17.3, y: 78.2 }, preset: { x: 10.0, y: 43.5 }, week: { x: 23.6, y: 39.3 }, file: { x: 25.7, y: 35.1 } };

const ROOT: Row[] = [
  { id: 'a', name: '1-3 정보 수업자료', kind: 'folder', date: '26. 10. 14. 오후 02:12' },
  { id: 'b', name: '2-1 인공지능 수업', kind: 'folder', date: '26. 10. 10. 오전 09:40' },
  { id: 'c', name: '수행평가 안내', kind: 'gdoc', date: '26. 10. 13. 오후 04:05' },
  { id: 'd', name: '학년 협의회 회의록.hwpx', kind: 'hwp', date: '26. 10. 02. 오후 03:30', size: '82 KB' },
];
const PRESET: Row[] = [
  { id: 'w1', name: '1주차', kind: 'folder', date: '26. 09. 30. 오전 10:02' },
  { id: 'w2', name: '2주차', kind: 'folder', date: '26. 10. 07. 오전 10:15' },
  { id: 'w3', name: '3주차', kind: 'folder', date: '26. 10. 14. 오후 02:12', ref: 'week' },
  { id: 'p', name: '수업 안내.pdf', kind: 'pdf', date: '26. 09. 29. 오후 05:20', size: '1.2 MB' },
];
const WEEK3 = (pill?: Row['pill']): Row[] => [
  { id: 'f', name: '자료 폴더', kind: 'folder', date: '26. 10. 14. 오후 02:12' },
  { id: 'x', name: '활동지.docx', kind: 'doc', date: '26. 10. 14. 오후 03:12', size: '38 KB', ref: 'file', pill },
  { id: 'v', name: '예시 영상.mp4', kind: 'video', date: '26. 10. 14. 오후 12:12', size: '48.6 MB' },
  { id: 's', name: '3주차 개념 정리.pptx', kind: 'slide', date: '26. 10. 13. 오후 06:40', size: '4.1 MB' },
];

const STEPS = [
  { label: '내 드라이브', at: T.WIN },
  { label: '1-3 정보 수업자료', at: T.PRESET },
  { label: '3주차', at: T.WEEK + 0.4 },
  { label: '활동지.docx 열기', at: T.OPENED, file: true },
];

function Stairs({ t }: { t: number }) {
  return (
    <div style={{ position: 'absolute', left: 1290, top: 172, width: 560 }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.muted, marginBottom: 10 }}>지금 있는 곳</div>
      {STEPS.map((s, i) => {
        const on = t >= s.at;
        const cur = on && (i === STEPS.length - 1 || t < STEPS[i + 1].at);
        const p = spring(t, s.at, 0.5);
        return (
          <div key={i} style={{ marginLeft: i * 64, marginTop: i ? 8 : 0, display: 'flex', alignItems: 'center', gap: 12, opacity: on ? 0.35 + 0.65 * Math.min(1, p) : 0.18 }}>
            <span style={{ width: 4, height: 30, borderRadius: 2, background: cur ? C.primary : C.line }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 16px', borderRadius: 14, background: cur ? C.primarySoft : C.card, border: `2px solid ${cur ? C.primary : C.line}`, fontSize: 23, fontWeight: cur ? 800 : 600, color: cur ? C.primary : C.ink, whiteSpace: 'nowrap', transform: `translateX(${(1 - Math.min(1, p)) * -16}px)` }}>
              <KindIcon kind={s.file ? 'doc' : 'folder'} size={30} />{s.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Stage() {
  const t = useSceneTime();
  const lvl = t < T.PRESET ? 0 : t < T.WEEK + 0.4 ? 1 : 2;
  const crumbs = [['내 드라이브'], ['1-3 정보 수업자료'], ['1-3 정보 수업자료', '3주차']][lvl];
  const opening = t >= T.OPENING && t < T.OPENED;
  const opened = t >= T.OPENED;
  const rows = lvl === 0 ? ROOT : lvl === 1 ? PRESET : WEEK3(opened ? { text: '열림 · 드라이브와 같음', tone: 'ok' } : undefined);
  const banner = opening ? { text: '«활동지.docx» 을(를) 받아 여는 중…', tone: 'info' as const }
    : opened ? { text: '«활동지.docx» 을(를) 열었습니다. 고쳐서 저장하면 드라이브에 다시 올라갑니다.', tone: 'warn' as const } : undefined;
  const note = t >= T.NOTE;
  const dbl = (at: number) => t >= at && t < at + 1.0;
  return (
    <>
      <Head chapter="⑤ 드라이브 · 1/5" title="드라이브 탐색기: 내 드라이브를 폴더처럼" />

      <Dock tiles={BASE_TILES.map((x) => (x.id === 'drive' ? { ...x, style: ring(t, T.DOCK) } : x))} k={0.8} tileRefs={{ drive: 'dock-drive' }}
        style={{ left: 72, top: 800 }} />

      {t >= T.WIN && (
        <DriveWin k={1.15} w={1000} h={500} side={lvl === 0 ? 'root' : 'preset'} crumbs={crumbs} rows={rows} banner={banner}
          refs={{ preset: 'preset' }} glow={{ preset: ring(t, T.PRESET), week: ring(t, T.WEEK), file: ring(t, T.FILE) }}
          style={{ left: 72, top: 168, ...popIn(t, T.WIN) }} toolsStyle={note ? { ...ring(t, T.NOTE, C.warn), borderRadius: 8, outline: `3px solid ${C.warn}`, outlineOffset: 4 } : undefined} />
      )}

      {/* 두 번 누르기 표시 */}
      {(dbl(T.WEEK) || dbl(T.FILE)) && (
        <div style={{ position: 'absolute', left: `${(dbl(T.WEEK) ? TG.week.x : TG.file.x) + 1.4}%`, top: `${(dbl(T.WEEK) ? TG.week.y : TG.file.y) + 2.6}%`, zIndex: 61 }}>
          <Chip style={{ fontSize: 18, padding: '4px 12px' }}>두 번 클릭</Chip>
        </div>
      )}

      <Stairs t={t} />

      {opened && (
        <WordWin k={0.92} style={{ left: 1330, top: 490, ...popIn(t, T.OPENED + 0.2) }} />
      )}
      {opened && (
        <div style={{ position: 'absolute', left: 1560, top: 878, opacity: interpolate(t, [T.OPENED + 0.6, T.OPENED + 1], [0, 1]) }}>
          <Chip tone="muted" style={{ fontSize: 19 }}>교실 PC 의 Word 로 열림</Chip>
        </div>
      )}
      {note && (
        <div style={{ position: 'absolute', left: 808, top: 816, zIndex: 30, ...popIn(t, T.NOTE) }}>
          <Chip tone="warn">지우기 · 이름 바꾸기는 없음</Chip>
        </div>
      )}

      <Cursor path={[
        { t: 0.6, x: 34, y: 92 },
        { t: T.DOCK, x: TG.dock.x, y: TG.dock.y, click: true },
        { t: T.PRESET, x: TG.preset.x, y: TG.preset.y, click: true },
        { t: T.WEEK, x: TG.week.x, y: TG.week.y, click: true },
        { t: T.WEEK + 0.25, x: TG.week.x, y: TG.week.y, click: true },
        { t: T.FILE, x: TG.file.x, y: TG.file.y, click: true },
        { t: T.FILE + 0.25, x: TG.file.x, y: TG.file.y, click: true },
        { t: 9.4, x: TG.file.x + 4, y: TG.file.y + 8, hide: true },
      ]} />
      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S15() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
