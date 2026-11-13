import Build from '../../../../src/deck/Build';
import { useDeck } from '../../../../src/deck/DeckContext';
import { C, Head, BuildSubs, Chip, SHOT, type SlideMeta } from '../kit';
import { Crop, NAT, boxOn, Ring } from './_d';

/* 24 — build: 학생판에서 쓸 때
   메타포: 수업 준비 체크리스트 — 왼쪽은 학생판 독과 패널(같은 기능 · 막는 장치 없음), 오른쪽 체크리스트 칸에 하나씩 체크가 들어간다.
   학생판 독 A-13(2400×400), 패널 조각 A-08a(808×1008). 좌표는 원본 px, 2026-10-16 잼. */

const SUBS = [
  '학생판 독에도 에이전트 터미널이 있습니다.',
  '기능은 교사판과 같고, 설치나 권한 묻지 않기를 막는 장치는 없습니다.',
  '수업에서 쓰려면 먼저 어떤 계정으로 쓸지 학교 방침과 이용 연령을 확인하세요.',
  '학생이 일할 연습 폴더를 정해 두고,',
  '권한 묻지 않기는 끈 채 권한 확인을 읽는 연습부터 시키세요.',
];
export const meta: SlideMeta = { kind: 'build', subs: SUBS };

const DOCK = { x: 56, y: 196, w: 820, nat: NAT.studentDock };
const PANEL_REGION: [number, number, number, number] = [40, 176, 728, 392];
const PANEL = { x: 96, y: 428, w: 640 };

const ITEMS = [
  { title: '계정', body: '누구 계정으로 쓸지 — 학교 방침과 각 AI 서비스의 이용 연령 기준 확인' },
  { title: '폴더', body: '수업용 연습 폴더를 정해 «자주 쓰는 폴더»에 넣어 두기' },
  { title: '권한', body: '«권한 묻지 않기»는 끄고, 권한 확인 화면을 읽는 연습부터' },
];

export default function S24() {
  const { clicks, isStatic } = useDeck();
  const step = isStatic ? 4 : Math.min(4, clicks);
  // 패널 조각 위 강조(원본 px → 덱 px)
  const k = PANEL.w / PANEL_REGION[2];
  const onPanel = (r: [number, number, number, number]) => ({ left: PANEL.x + (r[0] - PANEL_REGION[0]) * k, top: PANEL.y + (r[1] - PANEL_REGION[1]) * k, width: r[2] * k, height: r[3] * k });
  return (
    <>
      <Head chapter="⑥ 안전하게 · 2/4" title="학생판에서 쓸 때" />
      {/* 학생판 독 */}
      <img src={SHOT('A-13-학생판-독-에이전트-가리킴')} alt="" style={{ position: 'absolute', left: DOCK.x, top: DOCK.y, width: DOCK.w, borderRadius: 16 }} />
      <Ring box={boxOn(DOCK, [1868, 196, 160, 156])} label="학생판 독 · 같은 자리" side="right" size={18} />
      {/* 패널 조각 — 설치하기·권한 묻지 않기가 그대로 있다 */}
      <Crop name="A-08a-패널-설치필요-Claude" nat={NAT.panel} region={PANEL_REGION} w={PANEL.w} style={{ left: PANEL.x, top: PANEL.y, opacity: step >= 1 ? 1 : 0.35, transition: 'opacity .4s' }} />
      <Ring box={onPanel([604, 334, 134, 58])} k={step >= 1 ? 1 : 0} label="설치하기" side="right" size={17} />
      <Ring box={onPanel([46, 456, 716, 104])} k={step >= 1 ? 1 : 0} label="권한 묻지 않기" side="bottom" size={17} />
      <Build at={1} style={{ position: 'absolute', left: 96, top: 868 }}>
        <Chip tone="warn" style={{ fontSize: 21 }}>학생판 = 교사판과 같은 기능 · 막는 장치 없음</Chip>
      </Build>

      {/* 오른쪽 체크리스트 */}
      <div style={{ position: 'absolute', left: 1010, top: 196, width: 850, height: 720, borderRadius: 22, background: '#fff', border: '1px solid rgba(31,27,22,.12)', boxShadow: '0 24px 60px -34px rgba(31,27,22,.4)', padding: '34px 40px' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.gold }}>수업에서 쓰기 전에</div>
        <div style={{ fontSize: 40, fontWeight: 850, color: C.ink, letterSpacing: '-1px', marginTop: 4 }}>교사가 먼저 정할 것</div>
        <div style={{ marginTop: 34, display: 'flex', flexDirection: 'column', gap: 26 }}>
          {ITEMS.map((it, i) => {
            const on = step >= i + 2;
            return (
              <div key={it.title} style={{ display: 'flex', gap: 22, alignItems: 'flex-start', opacity: on ? 1 : 0.4, transition: 'opacity .4s' }}>
                <span style={{ flexShrink: 0, width: 54, height: 54, borderRadius: 12, border: `3px solid ${on ? C.ok : 'rgba(31,27,22,.25)'}`, display: 'grid', placeItems: 'center', fontSize: 34, fontWeight: 900, color: C.ok, background: on ? 'color-mix(in srgb, #2e7d4f 10%, #fff)' : '#fff' }}>{on ? '✓' : ''}</span>
                <div>
                  <div style={{ fontSize: 30, fontWeight: 800, color: C.ink }}>{it.title}</div>
                  <div style={{ fontSize: 23, color: C.muted, lineHeight: 1.5, marginTop: 4, wordBreak: 'keep-all' }}>{it.body}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ position: 'absolute', left: 40, right: 40, bottom: 30, fontSize: 20, color: C.muted, lineHeight: 1.5, wordBreak: 'keep-all', borderTop: '1px solid rgba(31,27,22,.1)', paddingTop: 16 }}>
          학생에게는 «결과를 확인하는 습관»을 가르치는 기회이기도 합니다.
        </div>
      </div>
      {[2, 3, 4].map((n) => <Build key={n} at={n} style={{ position: 'absolute', width: 0, height: 0 }}><span /></Build>)}
      <BuildSubs lines={SUBS} />
    </>
  );
}
