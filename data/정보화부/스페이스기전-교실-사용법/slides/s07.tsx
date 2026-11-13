import { Scene, useSceneTime, interpolate, spring } from '../../../../src/scene';
import { C, Head, SceneSubs, Cursor, ring, Glyph, LOOK, Chip, window4, type SlideMeta, type Sub } from '../kit';
import { Browser, EditorBody, IT, BLUE, BAR } from './_web';

/* 7 — walkthrough: 드라이브 · 프로그램 · 스페이스기전 화면 넣기
   구도: 세팅 창(뒤, 왼쪽 위) 위로 구글 «파일 선택» 창이 오른쪽 아래로 겹쳐 떴다가 걷히는 2창 왕복.
   걷힌 뒤 세팅 창에서 프로그램·스페이스기전 탭을 차례로 고른다. */

const T = { TAB_D: 1.0, PICK: 2.0, P_IN: 2.3, FOLDER: 3.6, FILE: 4.8, SELECT: 6.0, P_OUT: 6.25, TAB_P: 7.6, PPT: 8.6, TAB_S: 9.8, SEAT: 10.8 };
const DUR = 14.5;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '«드라이브» 탭의 단추를 누르면 구글 드라이브 창이 뜹니다. 폴더와 파일을 여러 개 한 번에 고를 수 있습니다.' },
  { at: 6.3, text: '폴더를 넣으면 교실에서 그 폴더가 바로 열리고, 파일은 받아서 열었다가 저장하면 드라이브에 다시 올라갑니다.' },
  { at: 8.0, text: '프로그램은 교실 PC에 설치된 것만 열립니다. 지오지브라처럼 목록에 없는 것은 그 PC에 등록한 영문 이름으로 넣습니다.' },
  { at: 11.4, text: '자리 배치·출결 같은 스페이스기전 화면도 넣을 수 있습니다.' },
];

const K = 0.8; // 세팅 창 본문 배율
const WIN = { x: 72, y: 176, w: Math.round(1776 * K) + 2, h: BAR + Math.round(740 * K) + 2 };
const PK = { x: 880, y: 368, w: 940, h: 560 };
/* 포인터 좌표(씬 %) — measure_pointer.mjs 실측 2026-10-15 */
const TG = {
  tabD: { x: 51.3, y: 42.8 }, pick: { x: 58.0, y: 49.5 }, folder: { x: 54.6, y: 53.1 }, file: { x: 86.5, y: 53.1 }, select: { x: 91.3, y: 82.3 },
  tabP: { x: 55.6, y: 42.8 }, ppt: { x: 43.7, y: 47.9 }, tabS: { x: 60.5, y: 42.8 }, seat: { x: 57.8, y: 47.9 },
};

const PICK_ITEMS = [
  { id: 'folder', name: '1-3 정보 수업자료', look: LOOK.folder, kind: '폴더' },
  { id: 'f2', name: '2-1 인공지능', look: LOOK.folder, kind: '폴더' },
  { id: 'pptx', name: '3주차 활동.pptx', look: LOOK.powerpoint, kind: 'PowerPoint' },
  { id: 'f3', name: '학급 운영', look: LOOK.folder, kind: '폴더' },
  { id: 'doc', name: '수행평가 안내', look: LOOK.docs, kind: '구글 문서' },
  { id: 'xlsx', name: '출결 정리.xlsx', look: LOOK.excel, kind: 'Excel' },
];

function Picker({ t }: { t: number }) {
  const s = spring(t, T.P_IN, 0.55);
  const out = interpolate(t, [T.P_OUT, T.P_OUT + 0.35], [1, 0]);
  if (t < T.P_IN || out <= 0) return null;
  const sel = (id: string) => (id === 'folder' && t >= T.FOLDER) || (id === 'pptx' && t >= T.FILE);
  const n = (t >= T.FOLDER ? 1 : 0) + (t >= T.FILE ? 1 : 0);
  return (
    <div style={{ position: 'absolute', left: PK.x, top: PK.y, width: PK.w, height: PK.h, borderRadius: 12, background: '#fff', boxShadow: '0 40px 80px -30px rgba(15,23,42,.55), 0 0 0 1px rgba(15,23,42,.08)',
      opacity: Math.min(1, s * 1.5) * out, transform: `translateY(${(1 - s) * 30}px) scale(${0.94 + 0.06 * s})`, zIndex: 10, overflow: 'hidden' }}>
      <div style={{ height: 64, display: 'flex', alignItems: 'center', gap: 16, padding: '0 24px', borderBottom: '1px solid #e8eaed' }}>
        <span style={{ fontSize: 22, fontWeight: 600, color: '#202124' }}>파일 선택</span>
        <span style={{ flex: 1, height: 40, borderRadius: 8, background: '#f1f3f4', display: 'flex', alignItems: 'center', padding: '0 14px', color: '#80868b', fontSize: 16 }}>⌕ Drive에서 검색</span>
        <span style={{ fontSize: 22, color: '#5f6368' }}>✕</span>
      </div>
      <div style={{ height: 48, display: 'flex', alignItems: 'flex-end', gap: 28, padding: '0 24px', fontSize: 16, color: '#5f6368', borderBottom: '1px solid #e8eaed' }}>
        <span style={{ color: '#1a73e8', fontWeight: 600, borderBottom: '3px solid #1a73e8', paddingBottom: 10 }}>내 드라이브</span>
        <span style={{ paddingBottom: 12 }}>공유 문서함</span>
        <span style={{ paddingBottom: 12 }}>최근 문서함</span>
      </div>
      {PICK_ITEMS.map((it, i) => {
        const c = i % 3, r = Math.floor(i / 3), on = sel(it.id);
        return (
          <div key={it.id} data-pt={`pk-${it.id}`} style={{
            position: 'absolute', left: 24 + c * 306, top: 132 + r * 160, width: 290, height: 146, borderRadius: 12,
            border: `2px solid ${on ? '#1a73e8' : '#e8eaed'}`, background: on ? '#e8f0fe' : '#fff', padding: 16,
            ...ring(t, it.id === 'folder' ? T.FOLDER : it.id === 'pptx' ? T.FILE : -9, '#1a73e8'),
          }}>
            {on && <span style={{ position: 'absolute', right: 10, top: 10, width: 24, height: 24, borderRadius: '50%', background: '#1a73e8', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 800 }}>✓</span>}
            <Glyph look={it.look} size={54} />
            <div style={{ fontSize: 18, fontWeight: 600, marginTop: 14, color: '#202124' }}>{it.name}</div>
            <div style={{ fontSize: 14, color: '#5f6368', marginTop: 2 }}>{it.kind}</div>
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 80, borderTop: '1px solid #e8eaed', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, padding: '0 24px' }}>
        <span style={{ marginRight: 'auto', fontSize: 16, color: '#5f6368' }}>{n ? `${n}개 선택됨` : ''}</span>
        <span style={{ padding: '10px 22px', fontSize: 17, color: '#1a73e8', fontWeight: 600 }}>취소</span>
        <span data-pt="pk-select" style={{ padding: '10px 28px', fontSize: 17, background: '#1a73e8', color: '#fff', borderRadius: 8, fontWeight: 600, ...ring(t, T.SELECT, '#1a73e8') }}>선택</span>
      </div>
    </div>
  );
}

function Stage() {
  const t = useSceneTime();
  const items = [IT.classroom, IT.padlet, IT.tkbell, IT.school,
    ...(t >= T.P_OUT ? [IT.folder, IT.pptx] : []), ...(t >= T.PPT ? [IT.ppt] : []), ...(t >= T.SEAT ? [IT.seat] : [])];
  const tab = t >= T.TAB_S ? 'space' : t >= T.TAB_P ? 'program' : t >= T.TAB_D ? 'drive' : 'url';
  const dim = window4(t, T.PICK + 0.1, T.P_IN + 0.4, T.P_OUT, T.P_OUT + 0.4);
  const flash = (at: number) => window4(t, at, at + 0.15, at + 1.0, at + 1.6);
  const picked = [...(t >= T.PPT ? ['powerpoint'] : []), ...(t >= T.SEAT ? ['자리 배치'] : [])];
  const ctrl = window4(t, T.FILE - 0.6, T.FILE - 0.4, T.FILE + 0.4, T.FILE + 0.7);
  return (
    <>
      <Head chapter="② 세팅 만들기 · 5/7" title="드라이브 · 프로그램 · 스페이스기전 화면" />
      <Browser x={WIN.x} y={WIN.y} w={WIN.w} h={WIN.h} url="spacekijun.lovable.app/classroom"
        style={{ filter: dim ? `brightness(${1 - 0.45 * dim}) saturate(${1 - 0.4 * dim})` : undefined }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 1776, height: 740, transform: `scale(${K})`, transformOrigin: '0 0' }}>
          <EditorBody name="1-3 정보 수업" items={items} tab={tab} picked={picked} rowH={32}
            rowFlash={{ folder: flash(T.P_OUT), pptx: flash(T.P_OUT), ppt: flash(T.PPT), seat: flash(T.SEAT) }}
            ring={{ 'tab-drive': ring(t, T.TAB_D, BLUE), 'drive-pick': ring(t, T.PICK, BLUE), 'tab-program': ring(t, T.TAB_P, BLUE), 'p-powerpoint': ring(t, T.PPT, BLUE), 'tab-space': ring(t, T.TAB_S, BLUE), 'sp-자리 배치': ring(t, T.SEAT, BLUE) }} />
        </div>
      </Browser>
      {/* 오른쪽 아래 빈자리 — 마지막 국면에 종류 범례 */}
      <div style={{ position: 'absolute', left: WIN.x + WIN.w + 40, top: 214, width: 1848 - (WIN.x + WIN.w + 40), display: 'flex', flexDirection: 'column', gap: 12, opacity: interpolate(t, [T.SEAT + 0.4, T.SEAT + 1.0], [0, 1]) }}>
        <div style={{ fontSize: 19, color: C.muted, fontWeight: 600 }}>순서 목록 8줄</div>
        {[['구글', '#15803d'], ['웹사이트 ×3', '#0891b2'], ['드라이브 ×2', '#d97706'], ['프로그램', '#ea580c'], ['스페이스기전', C.primary]].map(([l, c]) => (
          <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 21, fontWeight: 700, color: c }}><i style={{ width: 14, height: 14, borderRadius: 4, background: c }} />{l}</span>
        ))}
      </div>
      <Picker t={t} />
      {ctrl > 0 && (
        <div style={{ position: 'absolute', left: `${TG.file.x + 1.6}%`, top: `${TG.file.y + 3.4}%`, zIndex: 70, opacity: ctrl }}>
          <span style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 8, background: '#1e293b', color: '#fff', fontSize: 20, fontWeight: 700, boxShadow: '0 3px 0 #0f172a' }}>Ctrl</span>
        </div>
      )}
      {t >= T.P_OUT && (() => {
        const [txt, tone, at] = t >= T.SEAT ? ['스페이스기전 화면 → 선생님 계정으로 로그인된 채 열림', 'primary', T.SEAT] as const
          : t >= T.PPT ? ['프로그램 → 교실 PC에 설치된 것만 열림', 'warn', T.PPT] as const
            : ['폴더 → 탐색기로 · 파일 → 받아서 열고 저장하면 다시 올라감', 'warn', T.P_OUT] as const;
        return (
          <div key={txt} style={{ position: 'absolute', left: WIN.x, top: WIN.y + WIN.h + 22, opacity: interpolate(t, [at, at + 0.4], [0, 1]) }}>
            <Chip tone={tone} style={{ fontSize: 22 }}>{txt}</Chip>
          </div>
        );
      })()}
      <Cursor path={[
        { t: 0.4, x: 40, y: 60 },
        { t: T.TAB_D, x: TG.tabD.x, y: TG.tabD.y, click: true },
        { t: T.PICK, x: TG.pick.x, y: TG.pick.y, click: true },
        { t: T.FOLDER, x: TG.folder.x, y: TG.folder.y, click: true },
        { t: T.FILE, x: TG.file.x, y: TG.file.y, click: true },
        { t: T.SELECT, x: TG.select.x, y: TG.select.y, click: true },
        { t: T.TAB_P, x: TG.tabP.x, y: TG.tabP.y, click: true },
        { t: T.PPT, x: TG.ppt.x, y: TG.ppt.y, click: true },
        { t: T.TAB_S, x: TG.tabS.x, y: TG.tabS.y, click: true },
        { t: T.SEAT, x: TG.seat.x, y: TG.seat.y, click: true },
        { t: 12.4, x: 75, y: 70 },
      ]} />
      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S07() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
