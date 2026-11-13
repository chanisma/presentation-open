import { Scene, useSceneTime, interpolate, spring } from '../../../../src/scene';
import { popIn } from '../../../../src/walkthrough';
import { C, Head, SceneSubs, Cursor, ring, Desktop, Chip, type SlideMeta, type Sub } from '../kit';
import { DriveWin, KindIcon, type Row, type Kind } from './_drive';

/* 17 — walkthrough: 여러 개 고르기와 컴퓨터로 복사
   메타포: «변신 막대» — 줄이 하나씩 물들 때 위 막대의 단추 무리가 카드처럼 뒤집혀 [열기]·[컴퓨터로 복사]로 바뀐다.
   복사가 끝나면 파일 세 개가 창 밖 바탕 화면으로 떨어진다. */

const T = { PICK1: 1.2, PICK2: 2.7, PICK3: 4.1, COPY: 6.5, DLG: 6.9, OK: 8.5, COPYING: 8.9, PROG: 9.6, DONE: 10.8, NOTE: 12.2 };
const DUR = 15.5;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '여러 파일을 고를 때는 Ctrl을 누른 채 클릭하세요. Shift는 범위, Ctrl+A는 모두입니다.' },
  { at: 4.6, text: '고르면 위 막대의 단추가 [열기]와 [컴퓨터로 복사]로 바뀝니다.' },
  { at: 6.4, text: '[컴퓨터로 복사]는 고른 파일을 교실 PC의 폴더로 받습니다. 처음에는 바탕 화면이 골라져 있습니다.' },
  { at: T.DONE, text: '복사한 파일은 수업이 끝나도 지우지 않습니다. 학생들이 다음 시간에도 쓸 자료라면 이렇게 받아 두세요.' },
];

/* 포인터 좌표(씬 %) — measure_pointer.mjs 실측 2026-10-15 */
const TG = { doc: { x: 30, y: 36.8 }, vid: { x: 30, y: 41.3 }, fold: { x: 30, y: 32.3 }, copy: { x: 77.1, y: 22.9 }, ok: { x: 60.1, y: 51.6 } };

const WIN = { x: 297, y: 168, k: 1.25 };

function Key({ label }: { label: string }) {
  return <span style={{ padding: '4px 12px', borderRadius: 8, border: `2px solid ${C.ink}`, borderBottomWidth: 4, fontSize: 20, fontWeight: 800, background: '#fff', boxShadow: '0 6px 14px -6px rgba(15,23,42,.4)' }}>{label}</span>;
}

function Stage() {
  const t = useSceneTime();
  const n = t < T.PICK1 ? 0 : t < T.PICK2 ? 1 : t < T.PICK3 ? 2 : 3;
  const flipMid = T.PICK1 + 0.15;
  const mode = t < flipMid ? 'normal' : 'select';
  const ang = t < T.PICK1 || t > T.PICK1 + 0.3 ? 0 : t < flipMid ? ((t - T.PICK1) / 0.15) * 90 : 90 - ((t - flipMid) / 0.15) * 90;
  const done = t >= T.DONE;
  const rows: Row[] = [
    { id: 'f', name: '자료 폴더', kind: 'folder', date: '26. 10. 14. 오후 02:12', selected: n >= 3, ref: 'fold' },
    { id: 'x', name: '활동지.docx', kind: 'doc', date: '26. 10. 14. 오후 03:12', size: '38 KB', selected: n >= 1, ref: 'doc' },
    { id: 'v', name: '예시 영상.mp4', kind: 'video', date: '26. 10. 14. 오후 12:12', size: '48.6 MB', selected: n >= 2, ref: 'vid' },
    { id: 's', name: '3주차 개념 정리.pptx', kind: 'slide', date: '26. 10. 13. 오후 06:40', size: '4.1 MB' },
  ];
  const banner = t < T.COPYING ? undefined
    : t < T.PROG ? { text: '«바탕 화면» 에 복사하는 중…', tone: 'info' as const }
    : t < T.DONE ? { text: '복사하는 중 2/3 — 예시 영상.mp4', tone: 'info' as const }
    : { text: '3개를 «바탕 화면» 에 복사했습니다. 수업이 끝나도 남고, 다음 수업에도 왼쪽 «이 PC 에 복사한 파일»에서 바로 열 수 있습니다.', tone: 'warn' as const, action: '폴더 열기' };
  const dlg = t >= T.DLG && t < T.OK + 0.35;
  const ctrl = (at: number) => t >= at - 0.5 && t < at + 0.5;
  const DROP: [Kind, string, number][] = [['doc', '활동지.docx', 0], ['video', '예시 영상.mp4', 1], ['folder', '자료 폴더', 2]];
  return (
    <>
      <Head chapter="⑤ 드라이브 · 3/5" title="여러 개 고르기와 컴퓨터로 복사" />

      {/* 창 아래 바탕 화면 띠 */}
      <Desktop style={{ left: WIN.x, top: 718, width: 1325, height: 212, borderRadius: 14 }}>
        <span style={{ position: 'absolute', right: 20, top: 14, color: 'rgba(255,255,255,.75)', fontSize: 18, fontWeight: 600 }}>교실 PC 바탕 화면</span>
        {DROP.map(([kind, name, i]) => {
          const p = spring(t, T.DONE + 0.15 * i, 0.7);
          if (t < T.DONE) return null;
          return (
            <div key={name} style={{ position: 'absolute', left: 40 + i * 150, top: 22, width: 130, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transform: `translateY(${(1 - p) * -170}px)`, opacity: Math.min(1, p * 2) }}>
              <KindIcon kind={kind} size={58} />
              <span style={{ color: '#fff', fontSize: 17, textAlign: 'center', textShadow: '0 1px 3px rgba(0,0,0,.6)' }}>{name}</span>
            </div>
          );
        })}
      </Desktop>

      <DriveWin k={WIN.k} w={1060} h={420} crumbs={['1-3 정보 수업자료', '3주차']} rows={rows} mode={mode} selCount={n} banner={banner}
        pcCount={done ? '5' : '2'} refs={{ copy: 'copy' }}
        glow={{ copy: ring(t, T.COPY), doc: ring(t, T.PICK1), vid: ring(t, T.PICK2), fold: ring(t, T.PICK3) }}
        toolsStyle={{ transform: `perspective(500px) rotateX(${ang}deg)`, transformOrigin: 'center' }}
        style={{ left: WIN.x, top: WIN.y, ...popIn(t, 0.1) }} />

      {/* Windows 폴더 고르기 창 */}
      {dlg && (
        <div style={{ position: 'absolute', left: 820, top: 300, width: 470, borderRadius: 10, background: '#fff', boxShadow: '0 30px 70px -20px rgba(15,23,42,.55), 0 0 0 1px rgba(15,23,42,.15)', overflow: 'hidden', zIndex: 20, ...popIn(t, T.DLG, 0.45) }}>
          <div style={{ padding: '10px 16px', fontSize: 17, borderBottom: `1px solid ${C.line}`, display: 'flex' }}>폴더 선택<span style={{ marginLeft: 'auto', color: C.muted }}>✕</span></div>
          <div style={{ display: 'flex', fontSize: 19 }}>
            <div style={{ width: 190, borderRight: `1px solid ${C.line}`, padding: '10px 8px', background: '#f8fafc' }}>
              {['바탕 화면', '문서', '다운로드', '사진'].map((f, i) => (
                <div key={f} style={{ padding: '8px 10px', borderRadius: 6, background: i === 0 ? '#dbeafe' : undefined, fontWeight: i === 0 ? 700 : 400 }}>{i === 0 ? '▣ ' : '▢ '}{f}</div>
              ))}
            </div>
            <div style={{ flex: 1, padding: 16, color: C.muted, fontSize: 17, wordBreak: 'keep-all' }}>처음엔 «바탕 화면»이 골라져 있습니다.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderTop: `1px solid ${C.line}`, fontSize: 18 }}>
            <span style={{ flex: 1, border: `1px solid ${C.line}`, borderRadius: 6, padding: '6px 10px' }}>폴더: 바탕 화면</span>
            <span data-pt="ok" style={{ background: '#2563eb', color: '#fff', borderRadius: 6, padding: '7px 16px', fontWeight: 700, ...ring(t, T.OK, '#2563eb') }}>폴더 선택</span>
            <span style={{ border: `1px solid ${C.line}`, borderRadius: 6, padding: '7px 14px' }}>취소</span>
          </div>
        </div>
      )}

      {/* Ctrl 키캡 */}
      {(ctrl(T.PICK2) || ctrl(T.PICK3)) && (
        <div style={{ position: 'absolute', left: `${TG.doc.x - 7.5}%`, top: `${(ctrl(T.PICK2) ? TG.vid.y : TG.fold.y) - 1.6}%`, zIndex: 61 }}><Key label="Ctrl" /></div>
      )}

      {t >= T.NOTE && (
        <div style={{ position: 'absolute', left: 1650, top: 740, width: 230, display: 'flex', flexDirection: 'column', gap: 10, ...popIn(t, T.NOTE) }}>
          <Chip tone="ok" style={{ fontSize: 19, whiteSpace: 'normal' }}>수업이 끝나도 남음</Chip>
          <Chip tone="muted" style={{ fontSize: 19 }}>한 번에 500개까지</Chip>
          <Chip tone="muted" style={{ fontSize: 19 }}>같은 이름은 «(2)»</Chip>
        </div>
      )}
      {t >= T.NOTE + 0.3 && (
        <div style={{ position: 'absolute', left: 72, top: 760, width: 210, fontSize: 19, lineHeight: 1.5, color: C.warn, fontWeight: 700, wordBreak: 'keep-all', opacity: interpolate(t, [T.NOTE + 0.3, T.NOTE + 0.7], [0, 1]) }}>
          교실 PC 에 남긴 파일은 학생도 볼 수 있습니다. 개인정보가 든 파일은 복사하지 마세요.
        </div>
      )}

      <Cursor path={[
        { t: 0.6, x: 50, y: 70 },
        { t: T.PICK1, x: TG.doc.x, y: TG.doc.y, click: true },
        { t: T.PICK2, x: TG.vid.x, y: TG.vid.y, click: true },
        { t: T.PICK3, x: TG.fold.x, y: TG.fold.y, click: true },
        { t: T.COPY, x: TG.copy.x, y: TG.copy.y, click: true },
        { t: T.OK, x: TG.ok.x, y: TG.ok.y, click: true },
        { t: 9.3, x: TG.ok.x + 3, y: TG.ok.y + 6, hide: true },
      ]} />
      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S17() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
