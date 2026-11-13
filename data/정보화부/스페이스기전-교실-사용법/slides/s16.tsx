import type { ReactNode } from 'react';
import { Scene, useSceneTime, interpolate, easeInOut, spring } from '../../../../src/scene';
import { C, Head, SceneSubs, Chip, window4, type SlideMeta, type Sub } from '../kit';
import { KindIcon, type Kind } from './_drive';

/* 16 — scene: 고쳐서 저장하면 드라이브로
   메타포: 택배 추적 화면 — 파일 한 장이 교실 PC → 드라이브로 가는 동안 상태 알약이 정거장마다 바뀐다.
   아래 두 번째 레일은 구글 문서의 경우(원본을 덮지 않고 «(교실에서 고침)» 새 파일). */

const T = { SAVE: 0.8, CHECK: 1.7, UP: 3.3, DONE: 4.8, R2: 6.4, LOCK: 8.2, NEWF: 9.2, FILES: 12.0 };
const DUR = 15.5;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '교실에서 연 파일은 따로 올릴 필요가 없습니다. 저장만 하면 됩니다.' },
  { at: 2.6, text: '저장이 끝나면 드라이브의 같은 파일에 새 판으로 올라가고, 탐색기 줄에 «올림»과 시각이 표시됩니다.' },
  { at: 6.2, text: '구글 문서는 원본을 덮지 않습니다. 같은 폴더에 «(교실에서 고침)» 파일로 따로 올라갑니다.' },
  { at: T.FILES, text: '고친 내용을 이 PC에도 남기고 싶으면 아래 «열어 둔 파일»에서 [이 PC 에 저장]을 누르세요.' },
];

const R1 = 300; // 첫 레일 y
const R2 = 610; // 둘째 레일 y
const X0 = 330, X1 = 1530; // 레일 양 끝(정거장 구간)
const ST = [
  { x: 470, label: '저장', at: T.SAVE },
  { x: 780, label: '저장 확인 중', at: T.CHECK },
  { x: 1090, label: '올리는 중', at: T.UP },
  { x: 1400, label: '올림', at: T.DONE },
];

function End({ x, y, title, sub, children }: { x: number; y: number; title: string; sub: string; children?: ReactNode }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y - 70, width: 240, height: 140, borderRadius: 20, background: C.card, border: `2px solid ${C.line}`, boxShadow: '0 16px 36px -22px rgba(15,23,42,.4)', padding: '16px 18px' }}>
      <div style={{ fontSize: 24, fontWeight: 800 }}>{title}</div>
      <div style={{ fontSize: 17, color: C.muted, marginTop: 2 }}>{sub}</div>
      {children}
    </div>
  );
}

function Pill({ text, tone }: { text: string; tone: 'ok' | 'warn' }) {
  const col = tone === 'ok' ? C.ok : C.warn;
  return <span style={{ fontSize: 20, fontWeight: 700, padding: '4px 14px', borderRadius: 999, border: `2px solid ${col}`, color: col, background: '#fff', whiteSpace: 'nowrap' }}>{text}</span>;
}

function Rail({ y, from, to, t, color = C.primary }: { y: number; from: number; to: number; t: number; color?: string }) {
  const fill = interpolate(t, [from, to], [0, 1], easeInOut);
  return (
    <>
      <div style={{ position: 'absolute', left: X0, top: y - 4, width: X1 - X0, height: 8, borderRadius: 4, background: C.line }} />
      <div style={{ position: 'absolute', left: X0, top: y - 4, width: (X1 - X0) * fill, height: 8, borderRadius: 4, background: color }} />
    </>
  );
}

function Row({ kind, name, pill, y, x = 600, opacity = 1, extra }: { kind: Kind; name: string; pill?: ReactNode; y: number; x?: number; opacity?: number; extra?: ReactNode }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, display: 'flex', alignItems: 'center', gap: 14, padding: '12px 22px', background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, boxShadow: '0 10px 24px -18px rgba(15,23,42,.35)', opacity, fontSize: 24 }}>
      <KindIcon kind={kind} size={32} />
      <span style={{ whiteSpace: 'nowrap' }}>{name}</span>
      {pill}
      {extra}
    </div>
  );
}

function Stage() {
  const t = useSceneTime();
  /* 첫 레일: 파일 위치 */
  const fx = t < T.SAVE ? X0 + 120 : interpolate(t, [T.SAVE, T.DONE], [ST[0].x, ST[3].x + 160], easeInOut);
  const pill1 = t < T.CHECK ? null : t < T.UP ? <Pill text="열림 · 저장 확인 중" tone="warn" /> : t < T.DONE ? <Pill text="열림 · 올리는 중" tone="warn" /> : <Pill text="열림 · 올림 오후 02:05" tone="ok" />;
  const key = window4(t, T.SAVE - 0.3, T.SAVE, T.SAVE + 0.5, T.SAVE + 0.8);
  /* 둘째 레일 */
  const r2 = t >= T.R2 - 0.4;
  const gx = interpolate(t, [T.R2, T.LOCK], [ST[0].x, 1290], easeInOut);
  const lock = spring(t, T.LOCK, 0.5);
  const nf = spring(t, T.NEWF, 0.6);
  const files = spring(t, T.FILES, 0.6);
  return (
    <>
      <Head chapter="⑤ 드라이브 · 2/5" title="고쳐서 저장하면 드라이브로" />

      {/* ── 레일 1: 일반 파일(활동지.docx) ── */}
      <Rail y={R1} from={T.SAVE} to={T.DONE} t={t} />
      <End x={72} y={R1} title="교실 PC" sub="Word 에서 저장">
        <div style={{ display: 'flex', gap: 8, marginTop: 12, opacity: 0.4 + 0.6 * key, transform: `scale(${1 + 0.08 * key})`, transformOrigin: 'left center' }}>
          {['Ctrl', 'S'].map((c) => <span key={c} style={{ padding: '4px 12px', borderRadius: 8, border: `2px solid ${C.ink}`, borderBottomWidth: 4, fontSize: 20, fontWeight: 800, background: '#fff' }}>{c}</span>)}
        </div>
      </End>
      <End x={X1 + 80} y={R1} title="구글 드라이브" sub="같은 파일의 새 판">
        {t >= T.DONE && <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 19, color: C.ok, fontWeight: 700 }}><KindIcon kind="doc" size={26} />활동지.docx ✓</div>}
      </End>
      {ST.map((s, i) => {
        const on = t >= s.at;
        const cur = on && (i === 3 || t < ST[i + 1].at);
        const col = i === 3 ? C.ok : i === 0 ? C.primary : C.warn;
        return (
          <div key={s.label} style={{ position: 'absolute', left: s.x - 90, top: R1 - 55, width: 180, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: cur ? 800 : 600, color: on ? col : C.faint, whiteSpace: 'nowrap' }}>{s.label}</div>
            <span style={{ display: 'block', margin: '12px auto 0', width: 26, height: 26, borderRadius: '50%', background: on ? col : '#fff', border: `4px solid ${on ? col : C.line}`, boxShadow: cur ? `0 0 0 8px color-mix(in srgb, ${col} 22%, transparent)` : undefined }} />
          </div>
        );
      })}
      {t >= T.CHECK && t < T.DONE + 1.2 && (
        <div style={{ position: 'absolute', left: ST[1].x - 120, top: R1 + 34, width: 240, textAlign: 'center', fontSize: 17, color: C.muted, opacity: interpolate(t, [T.CHECK, T.CHECK + 0.3], [0, 1]) }}>
          크기·시각이 2초 그대로면<br />저장이 끝난 것으로 봅니다
        </div>
      )}
      {t < T.DONE + 0.3 && (
        <div style={{ position: 'absolute', left: fx - 22, top: R1 - 22, transform: `rotate(${t < T.SAVE ? 0 : -6}deg)` }}><KindIcon kind="doc" size={44} /></div>
      )}
      {/* 탐색기 줄 — 상태 알약이 정거장과 같이 바뀐다 */}
      <Row kind="doc" name="활동지.docx" y={R1 + 98} x={560} pill={pill1} extra={<span style={{ fontSize: 17, color: C.muted, marginLeft: 6 }}>← 드라이브 탐색기 줄</span>} />

      {/* ── 레일 2: 구글 문서 ── */}
      <div style={{ opacity: r2 ? interpolate(t, [T.R2 - 0.4, T.R2], [0.22, 1]) : 0.22 }}>
        <Rail y={R2} from={T.R2} to={T.LOCK} t={t} color="#4285f4" />
        <End x={72} y={R2} title="구글 문서" sub="Word 파일로 받아 고침">
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 19 }}><KindIcon kind="gdoc" size={26} />수행평가 안내</div>
        </End>
        {/* 드라이브 쪽: 원본(잠금) + 새 파일 */}
        <div style={{ position: 'absolute', left: 1220, top: R2 - 40, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderRadius: 14, background: C.card, border: `2px solid ${lock > 0.5 ? '#4285f4' : C.line}`, fontSize: 22 }}>
          <KindIcon kind="gdoc" size={30} />수행평가 안내 <span style={{ fontSize: 16, color: C.muted }}>원본</span>
          <span style={{ marginLeft: 6, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: '#eff6ff', color: '#1d4ed8', fontSize: 18, fontWeight: 800, opacity: lock, transform: `scale(${0.7 + 0.3 * lock})` }}>🔒 덮지 않음</span>
        </div>
        {t < T.LOCK + 0.2 && t >= T.R2 && (
          <div style={{ position: 'absolute', left: gx - 22, top: R2 - 22 }}><KindIcon kind="doc" size={44} /></div>
        )}
        {t >= T.NEWF && (
          <Row kind="doc" name="수행평가 안내 (교실에서 고침).docx" y={R2 + 70} x={760} opacity={Math.min(1, nf * 1.4)}
            pill={<Pill text="교실에서 고친 파일 · 올림" tone="ok" />} />
        )}
        {t >= T.NEWF && (
          <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: Math.min(1, nf) }}>
            <path d="M1300,640 C1300,660 1290,670 1270,684" fill="none" stroke={C.ok} strokeWidth={4} />
            <path d="M1262,676 L1270,684 L1258,688" fill="none" stroke={C.ok} strokeWidth={4} strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* ── 열어 둔 파일 칸 ── */}
      {t >= T.FILES && (
        <div style={{ position: 'absolute', left: 72, top: 800, width: 1776, height: 118, borderRadius: 18, background: C.card, border: `1px solid ${C.line}`, padding: '16px 24px', opacity: Math.min(1, files * 1.4), transform: `translateY(${(1 - files) * 20}px)` }}>
          <div style={{ fontSize: 21 }}><strong>열어 둔 파일</strong><span style={{ color: C.muted, marginLeft: 12, fontSize: 18 }}>저장하면 드라이브에 올라가고, 수업이 끝나면 이 PC 에서 지웁니다 — 남기려면 [이 PC 에 저장].</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, fontSize: 21 }}>
            <span style={{ flex: 1 }}>활동지.docx</span>
            <span style={{ color: C.ok }}>올림 오후 02:05</span>
            <span style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: '4px 14px', fontSize: 19 }}>다시 열기</span>
            <span style={{ border: `2px solid ${C.primary}`, color: C.primary, fontWeight: 700, borderRadius: 8, padding: '4px 14px', fontSize: 19 }}>이 PC 에 저장</span>
            <Chip tone="primary" style={{ fontSize: 18, padding: '4px 12px' }}>수업이 끝나도 남김</Chip>
          </div>
        </div>
      )}

      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S16() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
