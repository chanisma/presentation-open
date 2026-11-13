import { Scene, useSceneTime, interpolate } from '../../../../src/scene';
import { C, Head, SceneSubs, Cursor, ring, LinkOut, window4, type SlideMeta, type Sub } from '../kit';
import { Browser, SideNav, TopBar, SetCard, ChipW, BLUE, IT, BAR } from './_web';

/* 3 — walkthrough: 교실 기기 화면 찾아가기
   구도: 브라우저 한 창을 크게 — 메뉴를 따라 내려가는 단일 동선, 마지막엔 다섯 구역에
   창 바깥 라벨이 붙는다(라벨은 bbox 바깥). */

const T = { TOOLS: 1.4, CLS: 2.8, LOAD: 3.2, Z_LIVE: 4.6, Z_CARD: 6.0, Z_BOTTOM: 7.4, Z_CHIP: 9.0, HOVER_CHIP: 9.6, HELP: 11.8 };
const DUR = 15;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '세팅은 스페이스기전 웹에서 만듭니다. 메뉴 [도구]를 열고 «교실 기기»를 누르세요.' },
  { at: 4.4, text: '이 화면 하나에 내 세팅과 지금 연결된 교실, 최근 연결 기록이 모여 있습니다.' },
  { at: 8.8, text: '아직 세팅이 없는 반은 점선 칩으로 보입니다. 누르면 그 반 세팅이 바로 만들어집니다.' },
  { at: 11.2, text: '오른쪽 위 [사용 방법]에 네 단계 요약이 있으니, 기억이 안 날 때 다시 열어 보세요.' },
];

const WIN = { x: 72, y: 160, w: 1500, h: 780 };
const BY = WIN.y + BAR; // 본문 위쪽 y
/* 포인터 좌표(씬 %) — measure_pointer.mjs 실측 2026-10-15 */
const TG = { tools: { x: 9.0, y: 50.6 }, cls: { x: 9.6, y: 59.0 }, chip: { x: 22.8, y: 48.2 }, help: { x: 70.8, y: 30.4 } };

/** 구역(본문 좌표 y) — 윤곽 깜빡임 + 바깥 라벨 */
const ZONES = [
  { key: 'live', at: T.Z_LIVE, y: 176, h: 76, label: '지금 연결된 교실' },
  { key: 'chip', at: T.Z_CHIP, y: 266, h: 76, label: '세팅이 없는 반' },
  { key: 'card', at: T.Z_CARD, y: 354, h: 210, label: '세팅 카드' },
  { key: 'keep', at: T.Z_BOTTOM, y: 584, h: 136, label: '보관한 구글 로그인 · 최근 연결' },
];

function Home() {
  return (
    <div style={{ position: 'absolute', left: 308, top: 92, right: 28 }}>
      <div style={{ fontSize: 28, fontWeight: 800 }}>홈 대시보드</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18, marginTop: 22 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ height: 150, borderRadius: 16, border: `1px solid ${C.line}`, background: '#fbfcfe', padding: 20 }}>
            <div style={{ width: 120, height: 14, borderRadius: 7, background: '#e2e8f0' }} />
            <div style={{ width: '80%', height: 10, borderRadius: 5, background: '#eef1f6', marginTop: 18 }} />
            <div style={{ width: '60%', height: 10, borderRadius: 5, background: '#eef1f6', marginTop: 10 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ClassroomPage({ t }: { t: number }) {
  const L = 308, R = 1472, W = R - L;
  return (
    <div style={{ opacity: interpolate(t, [T.LOAD, T.LOAD + 0.35], [0, 1]) }}>
      {/* 머리글 카드 */}
      <div style={{ position: 'absolute', left: L, top: 88, width: W, height: 70, borderRadius: 16, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 14, padding: '0 14px' }}>
        <span style={{ width: 42, height: 42, borderRadius: 10, background: '#eff6ff', color: BLUE, display: 'grid', placeItems: 'center', fontWeight: 800 }}>⊞</span>
        <span style={{ flex: 1, height: 44, borderRadius: 10, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 17, color: C.faint }}>⌕ 세팅·반·항목 찾기</span>
        <span data-pt="help" style={{ fontSize: 17, color: '#475569', padding: '8px 12px', borderRadius: 8, ...ring(t, T.HELP, BLUE) }}>ⓘ 사용 방법</span>
        <span style={{ height: 44, padding: '0 18px', borderRadius: 10, background: BLUE, color: '#fff', display: 'flex', alignItems: 'center', fontSize: 17, fontWeight: 600 }}>＋ 새 세팅</span>
      </div>
      {/* 지금 연결된 교실 */}
      <div style={{ position: 'absolute', left: L, top: 178, width: W, height: 72, borderRadius: 16, border: '1px solid #a7f3d0', background: '#ecfdf5', display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px' }}>
        <span style={{ color: '#059669', fontSize: 22 }}>((·))</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 19, fontWeight: 700 }}>2-3 교실 <span style={{ fontWeight: 400, color: '#047857' }}>· 1-3 정보 수업</span></div>
          <div style={{ fontSize: 15, color: '#047857' }}>오전 10:00 연결 · 오전 10:50 자동 정리</div>
        </div>
        <span style={{ height: 42, padding: '0 18px', borderRadius: 10, border: '1px solid #6ee7b7', background: '#fff', display: 'flex', alignItems: 'center', fontSize: 16 }}>여기서 수업 끝내기</span>
      </div>
      {/* 세팅이 없는 반 */}
      <div style={{ position: 'absolute', left: L, top: 270, fontSize: 15, color: C.muted }}>＋ 세팅이 없는 반</div>
      <div style={{ position: 'absolute', left: L, top: 296 }}><ChipW dashed pt="nochip">＋ 정보 2-3</ChipW></div>
      {/* 세팅 카드 */}
      <SetCard title="1-3 정보 수업" section="정보 1-3" now items={[IT.classroom, IT.padlet, IT.ppt, IT.seat, IT.folder]} style={{ left: L, top: 356, width: 560, height: 204 }} />
      <SetCard title="2-1 인공지능 수업" section="인공지능 2-1" items={[IT.padlet, { ...IT.school, label: 'ChatGPT' }]} used="5일 전 사용" style={{ left: L + 584, top: 356, width: 560, height: 204 }} />
      {/* 보관한 구글 로그인 · 최근 연결 */}
      <div style={{ position: 'absolute', left: L, top: 586, width: W / 2 - 10, height: 132, borderRadius: 16, border: `1px solid ${C.line}`, padding: '16px 20px' }}>
        <div style={{ fontSize: 15, color: C.muted }}>⚿ 보관한 구글 로그인</div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 12 }}>
          <div style={{ flex: 1 }}><div style={{ fontSize: 18, fontWeight: 600 }}>🖥 2-3 교실</div><div style={{ fontSize: 14, color: C.muted }}>12분 전 사용</div></div>
          <span style={{ color: '#dc2626', fontSize: 16 }}>지우기</span>
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 8 }}>열쇠는 서버에 있어, 그 PC 에서 선생님이 QR 로 승인할 때만 풀립니다.</div>
      </div>
      <div style={{ position: 'absolute', left: L + W / 2 + 10, top: 586, width: W / 2 - 10, height: 132, borderRadius: 16, border: `1px solid ${C.line}`, padding: '16px 20px' }}>
        <div style={{ fontSize: 15, color: C.muted }}>↺ 최근 연결</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, marginTop: 12 }}><span>2-3 교실 <span style={{ color: C.muted }}>· 1-3 정보 수업</span></span><span style={{ color: C.muted }}>3일 전</span></div>
        <div style={{ height: 1, background: C.line, margin: '10px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17 }}><span>3-1 교실 <span style={{ color: C.muted }}>· 2-1 인공지능 수업</span></span><span style={{ color: C.muted }}>5일 전</span></div>
      </div>
    </div>
  );
}

function Stage() {
  const t = useSceneTime();
  const open = t >= T.TOOLS + 0.15;
  const onClassroom = t >= T.LOAD;
  return (
    <>
      <Head chapter="② 세팅 만들기 · 1/7" title="[도구] → «교실 기기»에 다 모여 있다" />
      <Browser x={WIN.x} y={WIN.y} w={WIN.w} h={WIN.h} url={onClassroom ? 'spacekijun.lovable.app/classroom' : 'spacekijun.lovable.app'}>
        <SideNav toolsOpen={open} active={onClassroom ? 'classroom' : 'home'} ring={{ 'nav-tools': ring(t, T.TOOLS, BLUE), 'nav-classroom': ring(t, T.CLS, BLUE) }} />
        <TopBar />
        {onClassroom ? <ClassroomPage t={t} /> : <Home />}
        {/* 구역 윤곽 깜빡임 */}
        {ZONES.map((z) => {
          const k = window4(t, z.at, z.at + 0.25, z.at + 1.2, z.at + 1.6);
          return k > 0 ? <div key={z.key} style={{ position: 'absolute', left: 298, top: z.y - 6, width: 1184, height: z.h + 12, borderRadius: 18, border: `4px solid ${C.primary}`, opacity: k, boxShadow: '0 0 0 8px rgba(79,70,229,.15)' }} /> : null;
        })}
      </Browser>
      {/* 창 바깥 라벨 — 구역마다 지시선 */}
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {ZONES.map((z) => {
          const k = interpolate(t, [z.at, z.at + 0.4], [0, 1]);
          const yz = BY + z.y + z.h / 2;
          return <path key={z.key} d={`M${WIN.x + WIN.w + 6},${yz} L${WIN.x + WIN.w + 34},${yz}`} stroke={C.primary} strokeWidth={3} strokeDasharray="3 6" opacity={k} />;
        })}
      </svg>
      {ZONES.map((z) => {
        const k = interpolate(t, [z.at, z.at + 0.4], [0, 1]);
        return (
          <div key={z.key} style={{ position: 'absolute', left: WIN.x + WIN.w + 40, top: BY + z.y + z.h / 2 - 22, width: 290, opacity: k, transform: `translateX(${(1 - k) * 16}px)`, fontSize: 21, fontWeight: 700, color: C.primary, lineHeight: 1.25, wordBreak: 'keep-all' }}>
            {z.label}
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: WIN.x + WIN.w + 40, top: 186, fontSize: 19, opacity: interpolate(t, [T.LOAD, T.LOAD + 0.5], [0, 1]) }}>
        <LinkOut href="https://spacekijun.lovable.app/classroom">교실 기기 열기</LinkOut>
      </div>
      <Cursor path={[
        { t: 0.6, x: 30, y: 40 },
        { t: T.TOOLS, x: TG.tools.x, y: TG.tools.y, click: true },
        { t: T.CLS, x: TG.cls.x, y: TG.cls.y, click: true },
        { t: 4.2, x: 40, y: 60 },
        { t: T.HOVER_CHIP, x: TG.chip.x, y: TG.chip.y },
        { t: T.HELP, x: TG.help.x, y: TG.help.y },
      ]} />
      <SceneSubs items={SUBS} />
    </>
  );
}

export default function S03() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
