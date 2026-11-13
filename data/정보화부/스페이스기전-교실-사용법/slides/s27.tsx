import { Scene, useSceneTime, interpolate, easeInOut, spring } from '../../../../src/scene';
import { C, Head, SceneSubs, Glyph, LOOK, Mark, window4, type Look, type SlideMeta, type Sub } from '../kit';

/* 27 — scene: 끝나면 무엇이 남고 무엇이 지워지나
   메타포: 분리수거. 수업 동안 쌓인 것들이 컨베이어를 타고 와 «드라이브로 · 잠가 보관 · 남김 · 지움» 네 통으로 떨어진다.
   위쪽 띠는 독의 정리 덮개 문구(제품 원문)가 단계별로 바뀐다. */

const DUR = 17;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '수업이 끝나면 먼저 열린 창을 닫습니다. 고친 문서가 있으면 저장할지 묻습니다.' },
  { at: 3.0, text: '고친 파일은 드라이브에 올리고, 로그인은 잠가서 보관합니다.' },
  { at: 6.4, text: '«컴퓨터로 복사»한 파일만 남기고, 받아서 연 사본과 수업용 브라우저는 모두 지웁니다.' },
  { at: 10.6, text: '인터넷이 끊겨 못 올린 파일은 잠시 남겨 두었다가, 다음에 드라이브를 연결하면 올립니다.' },
  { at: 13.6, text: '정리가 끝나면 다시 QR 화면으로 돌아가 다음 수업을 기다립니다.' },
];

const BELT_Y = 470; // 벨트 윗면
const BINS = [
  { x: 330, label: '드라이브로', cap: '고친 파일', color: '#1d4ed8', look: LOOK.mydrive as Look | null },
  { x: 760, label: '잠가 보관', cap: '로그인 (보관을 켰을 때)', color: '#d97706', look: null },
  { x: 1190, label: '남김', cap: '컴퓨터로 복사 · 이 PC 에 저장', color: C.ok, look: LOOK.folder },
  { x: 1620, label: '지움', cap: '받은 사본 · 브라우저 · 세션', color: '#64748b', look: null },
];
const SPEED = 640; // px/s
const ITEMS: { name: string; look: Look | 'key'; bin: number; at: number }[] = [
  { name: '활동지.docx (고침)', look: LOOK.word, bin: 0, at: 2.4 },
  { name: '구글·패들렛 로그인', look: 'key', bin: 1, at: 3.4 },
  { name: '바탕 화면 복사본 3개', look: LOOK.folder, bin: 2, at: 6.2 },
  { name: '받아서 연 사본', look: LOOK.file, bin: 3, at: 6.8 },
  { name: '수업용 Edge', look: LOOK.site, bin: 3, at: 7.4 },
  { name: '스페이스기전 로그인', look: LOOK.space, bin: 3, at: 8.0 },
];
const STUCK = { name: '예시 영상.mp4 (못 올림)', at: 10.6 };

const PHASES: [number, string][] = [
  [0, '정리하는 중입니다.'],
  [0.8, '열린 창과 프로그램을 닫는 중입니다. 저장할지 묻는 창이 뜨면 골라 주세요.'],
  [3.0, '고친 파일을 드라이브에 올리는 중입니다.'],
  [4.6, '구글 로그인을 이 PC 에 암호화해 보관하는 중입니다.'],
  [6.2, '정리하는 중입니다.'],
];

function Card({ name, look }: { name: string; look: Look | 'key' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 14, padding: '10px 16px 10px 10px', boxShadow: '0 10px 22px -12px rgba(15,23,42,.45)', border: `1px solid ${C.line}`, whiteSpace: 'nowrap', fontSize: 21, fontWeight: 700 }}>
      {look === 'key'
        ? <span style={{ width: 40, height: 40, borderRadius: 10, background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', display: 'grid', placeItems: 'center', fontSize: 22 }}>⚿</span>
        : <Glyph look={look} size={40} />}
      {name}
    </div>
  );
}

function Stage() {
  const t = useSceneTime();
  let phase = PHASES[0][1];
  for (const [a, s] of PHASES) if (t >= a) phase = s;
  const done = t >= 13.6;
  const roll = (t * SPEED) % 60;
  const save = window4(t, 0.8, 1.2, 2.6, 3.0);
  const counts = [0, 0, 0, 0];
  const stuckBox = spring(t, 10.4, 0.6);
  const doneK = spring(t, 13.6, 0.7);
  return (
    <>
      <Head chapter="⑦ 수업 끝 · 2/2" title="끝나면 무엇이 남고 무엇이 지워지나" />

      {/* 정리 덮개 문구 — 제품 독 그대로 */}
      <div style={{ position: 'absolute', left: 72, top: 176, width: 1230, height: 76, borderRadius: 18, background: C.shelf, boxShadow: '0 0 0 1px rgba(15,23,42,.08)', display: 'flex', alignItems: 'center', gap: 16, padding: '0 26px', opacity: done ? 0.35 : 1 }}>
        <span style={{ width: 28, height: 28, borderRadius: '50%', border: '4px solid rgba(15,23,42,.12)', borderTopColor: C.primary, transform: `rotate(${t * 360}deg)`, flexShrink: 0 }} />
        <span key={phase} style={{ fontSize: 23, fontWeight: 600 }}>{phase}</span>
        <span style={{ marginLeft: 'auto', fontSize: 16, color: C.muted, whiteSpace: 'nowrap' }}>교실 PC 독</span>
      </div>

      {/* 못 올린 파일 상자 */}
      <div style={{ position: 'absolute', left: 1360, top: 176, width: 488, height: 206, borderRadius: 18, border: `2px dashed ${C.warn}`, background: '#fff7ed', padding: '14px 20px', opacity: Math.min(1, stuckBox * 1.5) }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.warn }}>못 올린 파일</div>
        <div style={{ fontSize: 18, color: '#9a3412', marginTop: 4, lineHeight: 1.45 }}>이 PC 에 잠시 두었다가 다음 드라이브 연결 때 «교실에서 올리지 못한 파일» 폴더로</div>
      </div>

      {/* 저장 물음 */}
      {save > 0 && (
        <div style={{ position: 'absolute', left: 96, top: 290, width: 470, background: '#fff', borderRadius: 14, padding: '16px 20px', boxShadow: '0 20px 40px -20px rgba(15,23,42,.5)', opacity: save, zIndex: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 800 }}><Glyph look={LOOK.word} size={30} />Word</div>
          <div style={{ fontSize: 18, color: C.muted, marginTop: 6 }}>«활동지.docx»의 변경 내용을 저장할까요?</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10, fontSize: 17, fontWeight: 700 }}>
            <span style={{ background: '#2b579a', color: '#fff', borderRadius: 8, padding: '6px 16px' }}>저장</span>
            <span style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: '6px 14px' }}>저장 안 함</span>
          </div>
        </div>
      )}

      {/* 벨트 */}
      <div style={{ position: 'absolute', left: 40, top: BELT_Y, width: 1840, height: 34, borderRadius: 17, background: '#334155', overflow: 'hidden', boxShadow: 'inset 0 -6px 0 rgba(0,0,0,.25)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 40px, rgba(255,255,255,.18) 40px 60px)', transform: `translateX(${roll}px)`, width: 1900, left: -60 }} />
      </div>

      {/* 통 */}
      {BINS.map((b) => (
        <div key={b.label} style={{ position: 'absolute', left: b.x - 190, top: 610, width: 380, height: 300 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '10px 10px 30px 30px', border: `4px solid ${b.color}`, borderTop: 'none', background: `color-mix(in srgb, ${b.color} 8%, #fff)` }} />
          <div style={{ position: 'absolute', left: -12, right: -12, top: -6, height: 14, borderRadius: 7, background: b.color }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 22, textAlign: 'center' }}>
            <div style={{ fontSize: 34, fontWeight: 900, color: b.color, letterSpacing: -0.8 }}>{b.label}</div>
            <div style={{ fontSize: 18, color: C.muted, marginTop: 2 }}>{b.cap}</div>
          </div>
        </div>
      ))}

      {/* 물건 */}
      {ITEMS.map((it) => {
        const b = BINS[it.bin];
        const travel = (b.x + 260) / SPEED;
        const arrive = it.at + travel;
        if (t < it.at) return null;
        const stack = counts[it.bin]++;
        const x = t < arrive ? -260 + (t - it.at) * SPEED : b.x;
        const drop = spring(t, arrive, 0.6);
        const y = BELT_Y - 64 + drop * (628 + stack * 58 - (BELT_Y - 64));
        const tilt = it.bin === 3 ? drop * (stack % 2 ? 6 : -5) : 0;
        const faded = it.bin === 3 ? 1 - 0.45 * interpolate(t, [arrive + 0.6, arrive + 1.2], [0, 1]) : 1;
        return (
          <div key={it.name} style={{ position: 'absolute', left: x, top: y, transform: `translateX(-50%) rotate(${tilt}deg)`, zIndex: 3, opacity: faded, filter: it.bin === 3 && t > arrive + 0.6 ? 'grayscale(1)' : undefined }}>
            <Card name={it.name} look={it.look} />
          </div>
        );
      })}
      {/* 못 올린 파일 — 벨트에서 들려 위 상자로 */}
      {t >= STUCK.at && (() => {
        const lift = interpolate(t, [STUCK.at + 1.6, STUCK.at + 2.6], [0, 1], easeInOut);
        const bx = Math.min(-260 + (t - STUCK.at) * SPEED, 1240);
        const x = bx + (1604 - bx) * lift;
        const y = BELT_Y - 64 + (304 - (BELT_Y - 64)) * lift;
        return (
          <div style={{ position: 'absolute', left: x, top: y, transform: 'translateX(-50%)', zIndex: 5 }}>
            <Card name={STUCK.name} look={LOOK.file} />
          </div>
        );
      })()}

      {/* 끝 — QR 화면으로 */}
      {done && (
        <div style={{ position: 'absolute', left: 300, top: 290, width: 1000, display: 'flex', gap: 18, alignItems: 'flex-start', background: '#fff', borderRadius: 18, padding: '18px 24px', boxShadow: '0 24px 50px -24px rgba(15,23,42,.5)', border: `1px solid ${C.line}`, opacity: Math.min(1, doneK * 1.5), transform: `translateY(${(1 - doneK) * 16}px)`, zIndex: 6 }}>
          <Mark size={40} />
          <div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>QR 화면으로 돌아왔습니다</div>
            <div style={{ fontSize: 19, color: C.muted, marginTop: 4, lineHeight: 1.5 }}>수업을 정리했습니다. 구글 로그인을 이 PC 에 암호화해 보관했습니다. 이 PC 에 복사한 파일 3개는 남아 있습니다.</div>
          </div>
        </div>
      )}

      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S27() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
