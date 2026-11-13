import { Scene, useSceneTime, interpolate, easeInOut, spring } from '../../../../src/scene';
import { C, Head, SceneSubs, Cursor, ring, window4, type SlideMeta, type Sub } from '../kit';
import { Browser, SetCard, ChipW, Toast, IT, BLUE } from './_web';

/* 9 — walkthrough: 세팅 관리 — 고치기 · 복제 · 지우기
   구도: 카드 목록을 가로 «카드 슬롯» 무대로 키웠다. 복제하면 원본 카드에서 반투명 사본이
   떨어져 나와 오른쪽 빈 슬롯으로 미끄러지고, 그 위에 작은 세팅 창이 겹쳐 반 칩만 바뀐다. */

const T = { MENU1: 1.2, DUP: 2.4, SLIDE: 2.55, ED_IN: 3.6, SEC: 5.0, NAMEF: 6.2, CLR: 6.5, SAVE: 7.6, MENU2: 9.6, DEL: 10.4, DLG: 10.6, CONFIRM: 11.8 };
const DUR = 14.5;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '카드의 «…» 메뉴에 고치기·복제·지우기가 있습니다.' },
  { at: 2.4, text: '같은 과목을 여러 반에서 가르친다면 «복제(다른 반용)»을 쓰세요. 항목은 그대로 두고 반만 바꾸면 됩니다.' },
  { at: 9.4, text: '세팅을 지워도 지금 진행 중인 수업에는 영향이 없습니다.' },
];

const WIN = { x: 72, y: 160, w: 1776, h: 780 };
const SLOT = (i: number) => ({ x: 56 + i * 568, y: 128, w: 532 });
/* 포인터 좌표(씬 %) — measure_pointer.mjs 실측 2026-10-15 */
const TG = {
  menu1: { x: 32.3, y: 34.2 }, dup: { x: 27.9, y: 43.6 }, sec: { x: 73.3, y: 65.2 }, name: { x: 72.0, y: 57.1 }, save: { x: 89.6, y: 73.3 },
  menu2: { x: 61.9, y: 34.2 }, del: { x: 57.5, y: 49.1 }, confirm: { x: 62.8, y: 54.6 },
};
const ITEMS = [IT.classroom, IT.padlet, IT.ppt, IT.seat, IT.folder];

function Menu({ x, y, t, at, pick, pickAt }: { x: number; y: number; t: number; at: number; pick: 'dup' | 'del'; pickAt: number }) {
  const s = spring(t, at, 0.35);
  if (t < at || t > pickAt + 0.35) return null;
  const row = (label: string, icon: string, pt: string, danger?: boolean) => (
    <div data-pt={pt} style={{ display: 'flex', alignItems: 'center', gap: 12, height: 50, padding: '0 16px', borderRadius: 8, fontSize: 19, color: danger ? '#dc2626' : C.ink,
      background: (pick === 'dup' && pt === 'm-dup') || (pick === 'del' && pt === 'm-del') ? (t >= pickAt - 0.5 ? '#f1f5f9' : 'transparent') : 'transparent', ...ring(t, pt === `m-${pick}` ? pickAt : -9, BLUE) }}>
      <span style={{ width: 22, textAlign: 'center' }}>{icon}</span>{label}
    </div>
  );
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: 250, padding: 6, borderRadius: 12, background: '#fff', border: `1px solid ${C.line}`, boxShadow: '0 18px 40px -16px rgba(15,23,42,.35)',
      opacity: s, transform: `translateY(${(1 - s) * -8}px)`, zIndex: 20 }}>
      {row('고치기', '✎', 'm-edit')}
      {row('복제(다른 반용)', '⧉', 'm-dup')}
      <div style={{ height: 1, background: C.line, margin: '4px 6px' }} />
      {row('지우기', '🗑', 'm-del', true)}
    </div>
  );
}

function Body({ t }: { t: number }) {
  const s1 = SLOT(0), s2 = SLOT(1), s3 = SLOT(2);
  /* 사본이 슬롯1 → 슬롯3 으로 위로 휘며 미끄러짐 */
  const u = easeInOut(interpolate(t, [T.SLIDE, T.SLIDE + 1.0], [0, 1]));
  const cx = s1.x + (s3.x - s1.x) * u;
  const cy = s1.y - 70 * Math.sin(Math.PI * u);
  const saved = t >= T.SAVE + 0.2;
  const ed = spring(t, T.ED_IN, 0.5) * (1 - interpolate(t, [T.SAVE + 0.05, T.SAVE + 0.3], [0, 1]));
  const sec = t >= T.SEC ? '정보 2-3' : null;
  const name = t >= T.CLR ? '' : '1-3 정보 수업 (복사본)';
  const delGone = interpolate(t, [T.CONFIRM + 0.15, T.CONFIRM + 0.7], [1, 0]);
  const dlg = spring(t, T.DLG, 0.4) * (t < T.CONFIRM + 0.15 ? 1 : 0);
  return (
    <>
      {/* 머리글 카드 */}
      <div style={{ position: 'absolute', left: 56, top: 28, width: 1664, height: 66, borderRadius: 16, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 14, padding: '0 14px' }}>
        <span style={{ flex: 1, height: 42, borderRadius: 10, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 17, color: C.faint }}>⌕ 세팅·반·항목 찾기</span>
        <span style={{ fontSize: 17, color: '#475569' }}>ⓘ 사용 방법</span>
        <span style={{ height: 42, padding: '0 18px', borderRadius: 10, background: BLUE, color: '#fff', display: 'flex', alignItems: 'center', fontSize: 17, fontWeight: 600 }}>＋ 새 세팅</span>
      </div>
      {/* 슬롯 바닥 */}
      {[s1, s2, s3].map((s, i) => <div key={i} style={{ position: 'absolute', left: s.x - 8, top: s.y - 8, width: s.w + 16, height: 236, borderRadius: 22, border: '2px dashed #e2e8f0' }} />)}
      <SetCard title="1-3 정보 수업" section="정보 1-3" items={ITEMS} menuPt="menu1" menuStyle={ring(t, T.MENU1, BLUE)} style={{ left: s1.x, top: s1.y, width: s1.w }} />
      {delGone > 0 && <SetCard title="테스트" section={null} items={[IT.padlet]} used="한 달 전 사용" menuPt="menu2" menuStyle={ring(t, T.MENU2, BLUE)}
        style={{ left: s2.x, top: s2.y, width: s2.w, opacity: delGone, transform: `scale(${0.9 + 0.1 * delGone})` }} />}
      {/* 복제본 */}
      {t >= T.SLIDE && (
        <SetCard title={saved ? '정보 2-3 수업' : '1-3 정보 수업 (복사본)'} section={saved ? '정보 2-3' : null} items={ITEMS} used="아직 안 씀"
          style={{ left: cx, top: cy, width: s1.w, opacity: saved ? 1 : 0.6, boxShadow: u < 1 ? '0 30px 50px -24px rgba(15,23,42,.45)' : undefined, border: saved ? `2px solid ${BLUE}` : `2px dashed ${BLUE}` }} />
      )}
      <Menu x={s1.x + s1.w - 250} y={s1.y + 56} t={t} at={T.MENU1 + 0.1} pick="dup" pickAt={T.DUP} />
      <Menu x={s2.x + s2.w - 250} y={s2.y + 56} t={t} at={T.MENU2 + 0.1} pick="del" pickAt={T.DEL} />

      {/* 카드 메뉴 세 가지 — 쓰는 순간 강조 */}
      <div style={{ position: 'absolute', left: 56, top: 440, width: 900, opacity: interpolate(t, [T.MENU1 + 0.3, T.MENU1 + 0.8], [0, 1]) }}>
        <div style={{ fontSize: 18, color: C.muted, fontWeight: 600, marginBottom: 12 }}>카드 «…» 메뉴</div>
        {([['✎', '고치기', '항목·순서·반을 바꿉니다', -1], ['⧉', '복제(다른 반용)', '항목은 그대로, 반만 바꿔 새 카드', T.DUP], ['🗑', '지우기', '진행 중인 수업에는 영향 없음', T.DEL]] as const).map(([ic, label, desc, at]) => {
          const on = at > 0 && t >= at;
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 16, padding: '12px 18px', borderRadius: 12, marginBottom: 8, background: on ? '#eff6ff' : 'transparent', border: `1.5px solid ${on ? '#bfdbfe' : 'transparent'}`, transition: 'background .3s' }}>
              <span style={{ width: 26, fontSize: 22 }}>{ic}</span>
              <span style={{ width: 220, fontSize: 24, fontWeight: 700, color: label === '지우기' ? '#dc2626' : C.ink }}>{label}</span>
              <span style={{ fontSize: 20, color: C.muted }}>{desc}</span>
            </div>
          );
        })}
      </div>
      {/* 사본 위 작은 세팅 창 */}
      {ed > 0.01 && (
        <div style={{ position: 'absolute', left: 1030, top: 300, width: 690, height: 330, borderRadius: 18, background: '#fff', border: `1px solid ${C.line}`, boxShadow: '0 40px 80px -30px rgba(15,23,42,.5)',
          opacity: ed, transform: `translateY(${(1 - ed) * 24}px) scale(${0.95 + 0.05 * ed})`, zIndex: 15, padding: '20px 26px' }}>
          <div style={{ fontSize: 23, fontWeight: 700 }}>새 교실 세팅</div>
          <div style={{ fontSize: 15, color: C.muted, marginTop: 14 }}>🏷 이름</div>
          <div data-pt="name" style={{ marginTop: 6, height: 46, borderRadius: 10, border: t >= T.NAMEF ? `2px solid ${C.ink}` : `1px solid ${C.line}`, display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 19,
            background: t >= T.NAMEF && t < T.CLR ? '#dbeafe' : '#fff' }}>
            {name ? <span>{name}</span> : <span style={{ color: C.faint }}>{sec ? `${sec} 수업` : '예: 1-3 정보 수업'}</span>}
          </div>
          <div style={{ fontSize: 15, color: C.muted, marginTop: 16 }}>👥 수업(반)</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <ChipW on={sec === null}>반 없이(공통)</ChipW>
            <ChipW on={false}>정보 1-3</ChipW>
            <ChipW on={sec === '정보 2-3'} pt="sec" style={ring(t, T.SEC, BLUE)}>정보 2-3</ChipW>
            <ChipW on={false}>인공지능 2-1</ChipW>
          </div>
          <div style={{ position: 'absolute', right: 26, bottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 18, color: '#475569', padding: '8px 14px' }}>취소</span>
            <span data-pt="save" style={{ fontSize: 18, background: BLUE, color: '#fff', borderRadius: 10, padding: '10px 22px', fontWeight: 600, ...ring(t, T.SAVE, BLUE) }}>✓ 저장</span>
          </div>
        </div>
      )}

      {/* 지우기 확인 창 */}
      {dlg > 0.01 && (
        <>
          <div style={{ position: 'absolute', inset: 0, background: `rgba(15,23,42,${0.35 * dlg})`, zIndex: 25 }} />
          <div style={{ position: 'absolute', left: 568, top: 250, width: 640, borderRadius: 18, background: '#fff', padding: '26px 30px', zIndex: 26, opacity: dlg, transform: `scale(${0.94 + 0.06 * dlg})`, boxShadow: '0 40px 80px -30px rgba(15,23,42,.5)' }}>
            <div style={{ fontSize: 23, fontWeight: 700 }}>«테스트» 세팅을 지울까요?</div>
            <div style={{ fontSize: 17, color: C.muted, marginTop: 10, lineHeight: 1.6, wordBreak: 'keep-all' }}>교실 기기에서 이 세팅을 더 고를 수 없습니다. 지금 연결된 수업에는 영향이 없습니다.</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 22 }}>
              <span style={{ fontSize: 18, padding: '10px 20px', borderRadius: 10, border: `1px solid ${C.line}` }}>취소</span>
              <span data-pt="confirm" style={{ fontSize: 18, padding: '10px 22px', borderRadius: 10, background: '#dc2626', color: '#fff', fontWeight: 600, ...ring(t, T.CONFIRM, '#dc2626') }}>지우기</span>
            </div>
          </div>
        </>
      )}

      {window4(t, T.SAVE + 0.3, T.SAVE + 0.6, T.MENU2 - 0.2, T.MENU2) > 0 && (
        <Toast style={{ right: 56, bottom: 30, opacity: window4(t, T.SAVE + 0.3, T.SAVE + 0.6, T.MENU2 - 0.2, T.MENU2) }}>교실 세팅을 저장했습니다.</Toast>
      )}
      {t >= T.CONFIRM + 0.3 && <Toast style={{ right: 56, bottom: 30, opacity: interpolate(t, [T.CONFIRM + 0.3, T.CONFIRM + 0.6], [0, 1]) }}>세팅을 지웠습니다.</Toast>}
      {/* 복제 결과 설명 — 슬롯 아래 */}
      {saved && (
        <div style={{ position: 'absolute', left: s3.x, top: 392, width: s3.w, fontSize: 19, color: BLUE, fontWeight: 600, lineHeight: 1.5, opacity: interpolate(t, [T.SAVE + 0.3, T.SAVE + 0.8], [0, 1]) }}>
          항목은 그대로 · 반만 «정보 2-3»<br /><span style={{ color: C.muted, fontWeight: 400, fontSize: 17 }}>이름을 비우면 «정보 2-3 수업»으로 저장</span>
        </div>
      )}
    </>
  );
}

function Stage() {
  const t = useSceneTime();
  return (
    <>
      <Head chapter="② 세팅 만들기 · 7/7" title="다른 반은 «복제(다른 반용)»" />
      <Browser x={WIN.x} y={WIN.y} w={WIN.w} h={WIN.h} url="spacekijun.lovable.app/classroom">
        <Body t={t} />
      </Browser>
      <Cursor path={[
        { t: 0.5, x: 40, y: 70 },
        { t: T.MENU1, x: TG.menu1.x, y: TG.menu1.y, click: true },
        { t: T.DUP, x: TG.dup.x, y: TG.dup.y, click: true },
        { t: T.SEC, x: TG.sec.x, y: TG.sec.y, click: true },
        { t: T.NAMEF, x: TG.name.x, y: TG.name.y, click: true },
        { t: T.SAVE, x: TG.save.x, y: TG.save.y, click: true },
        { t: T.MENU2, x: TG.menu2.x, y: TG.menu2.y, click: true },
        { t: T.DEL, x: TG.del.x, y: TG.del.y, click: true },
        { t: T.CONFIRM, x: TG.confirm.x, y: TG.confirm.y, click: true },
        { t: 13.2, x: 72, y: 80 },
      ]} />
      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S09() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}

