import { Scene, useSceneTime, interpolate, easeInOut, spring } from '../../../../src/scene';
import { popIn } from '../../../../src/walkthrough';
import { C, Head, SceneSubs, Cursor, ring, Dock, BASE_TILES, Desktop, type SlideMeta, type Sub } from '../kit';
import { DriveWin, KindIcon, type Row } from './_drive';

/* 18 — walkthrough: 이 PC 에 복사한 파일 — 다음 수업에도 바로
   메타포: 날짜 2막 — 위 날짜 막대가 «10월 14일 → 10월 16일»로 넘어가고, 탐색기 왼쪽 «이 PC» 칸이
   두 수업을 잇는 다리로 빛난다. */

const T = { HOP: 1.0, ACT2: 2.3, TOAST: 2.4, WIN: 3.9, PC: 5.0, PICK: 7.4, TRASH: 8.4, DLG: 8.7, YES: 9.9, GONE: 10.2, PICK2: 11.4, TIPS: 11.9 };
const DUR = 15.5;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '같은 선생님이 다음 수업을 열면, 지난번에 복사해 둔 파일이 있다고 알려 줍니다.' },
  { at: 4.3, text: '탐색기 왼쪽 «이 PC 에 복사한 파일»에 선생님별로 모여 있습니다. 드라이브를 연결하지 않아도 열립니다.' },
  { at: 7.2, text: '다 쓴 파일은 [목록에서 빼기]로 목록만 정리하거나, [지우기]로 휴지통에 보낼 수 있습니다.' },
  { at: T.PICK2, text: '이 파일은 교실 PC의 파일이라, 고쳐도 드라이브에는 올라가지 않습니다.' },
];

/* 포인터 좌표(씬 %) — measure_pointer.mjs 실측 2026-10-15 */
const TG = { pc: { x: 23.7, y: 40.0 }, fold: { x: 40, y: 34.3 }, trash: { x: 77.5, y: 25.2 }, yes: { x: 64.5, y: 52.3 }, doc: { x: 40, y: 38.3 } };

const WIN = { x: 330, y: 196, k: 1.2 };
const D = '26. 10. 14. 오후 03:20';

function DateBar({ t }: { t: number }) {
  const p = interpolate(t, [T.HOP, T.ACT2], [0, 1], easeInOut);
  return (
    <div style={{ position: 'absolute', left: 1130, top: 64, width: 720, height: 64, borderRadius: 32, background: C.card, border: `2px solid ${C.line}`, display: 'flex', alignItems: 'center', padding: '0 26px', gap: 18, fontSize: 25, fontWeight: 700 }}>
      <span style={{ color: p < 0.5 ? C.primary : C.faint }}>10월 14일 3교시</span>
      <span style={{ flex: 1, height: 6, borderRadius: 3, background: C.line, position: 'relative' }}>
        <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${p * 100}%`, borderRadius: 3, background: C.primary }} />
        <span style={{ position: 'absolute', left: `${p * 100}%`, top: '50%', width: 18, height: 18, borderRadius: '50%', background: C.primary, transform: 'translate(-50%,-50%)' }} />
      </span>
      <span style={{ color: p >= 0.5 ? C.primary : C.faint }}>10월 16일 3교시</span>
    </div>
  );
}

function Stage() {
  const t = useSceneTime();
  const act1 = t < T.ACT2 + 0.3;
  const a1 = interpolate(t, [T.ACT2 - 0.3, T.ACT2 + 0.3], [1, 0]);
  const pcView = t >= T.PC + 0.15;
  const gone = t >= T.GONE;
  const sel = t >= T.PICK2 + 0.1 ? 'doc' : t >= T.PICK && !gone ? 'fold' : null;
  const rows: Row[] = pcView ? [
    ...(gone ? [] : [{ id: 'f', name: '자료 폴더', kind: 'folder' as const, date: D, selected: sel === 'fold', ref: 'fold' }]),
    { id: 'x', name: '활동지.docx', kind: 'doc', date: D, size: '38 KB', selected: sel === 'doc', ref: gone ? 'doc' : undefined },
    { id: 'v', name: '예시 영상.mp4', kind: 'video', date: D, size: '48.6 MB' },
  ] : [
    { id: 'a', name: '1-3 정보 수업자료', kind: 'folder', date: '26. 10. 14. 오후 02:12' },
    { id: 'b', name: '2-1 인공지능 수업', kind: 'folder', date: '26. 10. 10. 오전 09:40' },
    { id: 'c', name: '수행평가 안내', kind: 'gdoc', date: '26. 10. 13. 오후 04:05' },
  ];
  const mode = !pcView ? 'normal' : sel ? 'pcselect' : 'pc';
  const banner = gone && t < T.PICK2 + 0.1 ? { text: '1개를 휴지통으로 옮겼습니다.', tone: 'warn' as const } : undefined;
  const dlg = t >= T.DLG && t < T.YES + 0.3;
  const bridge = pcView ? 0.5 + 0.5 * Math.sin(t * 3) : 0;
  const tips = spring(t, T.TIPS, 0.5);
  return (
    <>
      <Head chapter="⑤ 드라이브 · 4/5" title="이 PC 에 복사한 파일: 다음 수업에도 바로" />
      <DateBar t={t} />

      {/* 1막 — 지난 수업의 끝 화면(17쪽)을 줄여 회상 */}
      {act1 && (
        <div style={{ position: 'absolute', left: 560, top: 230, width: 800, opacity: a1, transform: `scale(${1 - 0.1 * (1 - a1)})` }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.muted, marginBottom: 10 }}>지난 수업 · 컴퓨터로 복사</div>
          <Desktop style={{ position: 'relative', width: 800, height: 300, borderRadius: 16 }}>
            {(['doc', 'video', 'folder'] as const).map((k, i) => (
              <div key={k} style={{ position: 'absolute', left: 50 + i * 170, top: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <KindIcon kind={k} size={76} />
                <span style={{ color: '#fff', fontSize: 20 }}>{['활동지.docx', '예시 영상.mp4', '자료 폴더'][i]}</span>
              </div>
            ))}
          </Desktop>
        </div>
      )}

      {/* 2막 */}
      {t >= T.ACT2 && (
        <Dock tiles={BASE_TILES} k={0.86} style={{ left: 72, top: 818, ...popIn(t, T.ACT2) }} />
      )}
      {t >= T.TOAST && t < T.WIN + 1.0 && (
        <div style={{ position: 'absolute', left: interpolate(t, [T.WIN - 0.5, T.WIN], [470, 72], easeInOut), top: interpolate(t, [T.WIN - 0.5, T.WIN], [380, 720], easeInOut), width: 980, ...popIn(t, T.TOAST), opacity: interpolate(t, [T.WIN + 0.6, T.WIN + 1.0], [1, 0]) }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.muted, marginBottom: 8, opacity: interpolate(t, [T.WIN - 0.5, T.WIN - 0.2], [1, 0]) }}>독 위 알림 창</div>
          <div style={{ padding: '16px 22px', background: '#fff', borderLeft: `5px solid ${C.primary}`, borderRadius: 12, boxShadow: '0 18px 40px -18px rgba(15,23,42,.45)', fontSize: interpolate(t, [T.WIN - 0.5, T.WIN], [26, 20]), lineHeight: 1.5, wordBreak: 'keep-all' }}>
            지난 수업에 이 PC 에 복사해 둔 파일 3개가 있습니다. «내 드라이브» 창 왼쪽 «이 PC 에 복사한 파일»에서 열 수 있습니다.
          </div>
        </div>
      )}
      {t >= T.WIN && (
        <DriveWin k={WIN.k} w={1060} h={380} side={pcView ? 'pc' : 'root'} crumbs={pcView ? ['이 PC 에 복사한 파일'] : ['내 드라이브']} rows={rows}
          mode={mode} selCount={1} banner={banner} pcCount={gone ? '2' : '3'} dateHead={pcView ? '복사한 때' : '수정한 날'}
          refs={{ pc: 'pc', trash: 'trash', reveal: 'reveal', forget: 'forget' }}
          glow={{
            pc: { ...ring(t, T.PC), boxShadow: bridge ? `0 0 0 ${3 + 3 * bridge}px rgba(79,70,229,${0.25 + 0.3 * bridge})` : ring(t, T.PC).boxShadow },
            fold: ring(t, T.PICK), trash: ring(t, T.TRASH, C.danger), doc: ring(t, T.PICK2),
          }}
          style={{ left: WIN.x, top: WIN.y, ...popIn(t, T.WIN) }} />
      )}

      {/* 지우기 확인 창 */}
      {dlg && (
        <div style={{ position: 'absolute', left: 760, top: 400, width: 560, borderRadius: 14, background: '#fff', boxShadow: '0 30px 80px -20px rgba(15,23,42,.5), 0 0 0 1px rgba(15,23,42,.12)', padding: 24, zIndex: 20, ...popIn(t, T.DLG, 0.45) }}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>이 PC 에서 지우기</div>
          <div style={{ fontSize: 19, color: C.muted, lineHeight: 1.6, marginTop: 10, wordBreak: 'keep-all' }}>«자료 폴더» 을(를) 이 PC 의 휴지통으로 옮깁니다. 드라이브의 원본은 그대로입니다.</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
            <span style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: '10px 18px', fontSize: 19 }}>취소</span>
            <span data-pt="yes" style={{ background: C.danger, color: '#fff', borderRadius: 10, padding: '10px 18px', fontSize: 19, fontWeight: 700, ...ring(t, T.YES, C.danger) }}>휴지통으로</span>
          </div>
        </div>
      )}

      {/* 단추 설명(마우스를 올리면 뜨는 글 원문) */}
      {t >= T.TIPS && (
        <div style={{ position: 'absolute', left: 1080, top: 740, width: 780, display: 'flex', flexDirection: 'column', gap: 10, opacity: Math.min(1, tips * 1.5), transform: `translateY(${(1 - tips) * 14}px)` }}>
          {[['위치 열기', 'Windows 탐색기에서 이 파일이 있는 자리를 엽니다'], ['목록에서 빼기', '이 목록에서만 뺍니다. 파일은 그 자리에 그대로 남습니다.']].map(([b, d]) => (
            <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 19 }}>
              <span style={{ border: `1px solid ${C.line}`, background: '#fff', borderRadius: 8, padding: '5px 12px', fontWeight: 700, whiteSpace: 'nowrap' }}>{b}</span>
              <span style={{ color: C.muted }}>{d}</span>
            </div>
          ))}
        </div>
      )}

      <Cursor path={[
        { t: 4.4, x: 30, y: 60 },
        { t: T.PC, x: TG.pc.x, y: TG.pc.y, click: true },
        { t: T.PICK, x: TG.fold.x, y: TG.fold.y, click: true },
        { t: T.TRASH, x: TG.trash.x, y: TG.trash.y, click: true },
        { t: T.YES, x: TG.yes.x, y: TG.yes.y, click: true },
        { t: T.PICK2, x: TG.doc.x, y: TG.doc.y, click: true },
        { t: 12.2, x: TG.doc.x + 3, y: TG.doc.y + 6, hide: true },
      ]} />
      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S18() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
