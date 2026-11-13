import type { CSSProperties, ReactNode } from 'react';
import { C, Glyph, LOOK, QR, type Look } from '../kit';

/* ── ⑤ 드라이브 · ⑥ 구글 장이 함께 쓰는 제품 화면 ──────────────────────
   드라이브 탐색기(classroom-drive.html, 실물 1000×700)와 구글 창(classroom-google.html, 560×580).
   문구·색은 NEIS_helper app/web 원문(classroom-drive.css · classroom-popup.css). k배로 그린다. */

export type Kind = 'folder' | 'doc' | 'sheet' | 'slide' | 'pdf' | 'hwp' | 'img' | 'video' | 'file' | 'gdoc';

const KIND: Record<Kind, [string, string]> = {
  folder: ['#f59e0b', ''], doc: ['#2563eb', 'W'], sheet: ['#16a34a', 'X'], slide: ['#ea580c', 'P'], pdf: ['#dc2626', 'PDF'],
  hwp: ['#0284c7', '한'], img: ['#9333ea', ''], video: ['#ef4444', '▶'], file: ['#64748b', ''], gdoc: ['#4285f4', '문'],
};

/** 파일 종류 타일(.kind) */
export function KindIcon({ kind, size = 22 }: { kind: Kind; size?: number }) {
  const [bg, txt] = KIND[kind];
  return (
    <span style={{ width: size, height: size, borderRadius: size * 0.23, background: bg, color: '#fff', display: 'grid', placeItems: 'center', fontSize: size * (txt.length > 2 ? 0.34 : 0.5), fontWeight: 800, flexShrink: 0 }}>
      {kind === 'folder' ? (
        <svg viewBox="0 0 24 24" width={size * 0.7} height={size * 0.7} fill="#fff"><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2.5h6.5A2.5 2.5 0 0 1 21 10v7.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5Z" /></svg>
      ) : txt}
    </span>
  );
}

export type Row = {
  id: string; name: string; kind: Kind; date?: string; size?: string;
  pill?: { text: string; tone: 'ok' | 'warn' | 'danger' | 'brand' };
  selected?: boolean; ref?: string; style?: CSSProperties;
};

export type Side = 'root' | 'shared' | 'pc' | 'preset' | 'sdrive';

const pillColor = { ok: C.ok, warn: C.warn, danger: C.danger, brand: C.primary };

function SideBtn({ k, icon, label, on, count, refName, style }: { k: number; icon: string; label: string; on?: boolean; count?: string; refName?: string; style?: CSSProperties }) {
  return (
    <div data-pt={refName} style={{ display: 'flex', alignItems: 'center', gap: 8 * k, padding: 8 * k, borderRadius: 8 * k, fontSize: 13 * k, background: on ? '#eef2ff' : undefined, color: on ? C.primary : C.ink, fontWeight: on ? 600 : 400, ...style }}>
      <span style={{ width: 18 * k, textAlign: 'center', fontSize: 14 * k }}>{icon}</span>
      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      {count && <span style={{ marginLeft: 'auto', fontSize: 11 * k, color: C.muted, fontWeight: 600 }}>{count}</span>}
    </div>
  );
}

const btn = (k: number, primary?: boolean, danger?: boolean): CSSProperties => ({
  border: `1px solid ${primary ? C.primary : C.line}`, background: primary ? C.primary : C.card, color: primary ? '#fff' : danger ? C.danger : C.ink,
  borderRadius: 8 * k, padding: `${7 * k}px ${14 * k}px`, fontWeight: 600, fontSize: 13 * k, whiteSpace: 'nowrap',
});

/** 드라이브 탐색기 창 — 실물 1000×700 기준 */
export function DriveWin({
  k = 1, w = 1000, h = 700, crumbs = ['내 드라이브', '1-3 정보 수업자료', '3주차'], side = 'preset', rows, mode = 'normal', selCount = 0,
  banner, files, pcCount = '2', presetName = '1-3 정보 수업자료', dateHead = '수정한 날', overlay, refs = {}, style, toolsStyle, chrome = true, glow,
}: {
  k?: number; w?: number; h?: number; crumbs?: string[]; side?: Side; rows: Row[]; mode?: 'normal' | 'select' | 'pc' | 'pcselect'; selCount?: number;
  banner?: { text: ReactNode; tone?: 'warn' | 'error' | 'info'; action?: string; actionRef?: string; style?: CSSProperties };
  files?: { name: string; state: string; tone: 'ok' | 'warn' }[]; pcCount?: string; presetName?: string; dateHead?: string;
  overlay?: ReactNode; refs?: Record<string, string>; style?: CSSProperties; toolsStyle?: CSSProperties; chrome?: boolean;
  /** data-pt 이름별 덧칠(클릭 발광 등) */ glow?: Record<string, CSSProperties>;
}) {
  const g = (name?: string): CSSProperties => (name && glow?.[name]) || {};
  const bannerBg = banner?.tone === 'error' ? `color-mix(in srgb, ${C.danger} 12%, #fff)` : banner?.tone === 'info' ? `color-mix(in srgb, ${C.primary} 9%, #fff)` : `color-mix(in srgb, ${C.warn} 12%, #fff)`;
  return (
    <div style={{ position: 'absolute', width: w * k, height: h * k, borderRadius: 10 * k, overflow: 'hidden', background: C.bg, color: C.ink, boxShadow: '0 30px 70px -30px rgba(15,23,42,.5), 0 0 0 1px rgba(15,23,42,.12)', display: 'flex', flexDirection: 'column', ...style }}>
      {chrome && (
        <div style={{ height: 34 * k, flexShrink: 0, display: 'flex', alignItems: 'center', padding: `0 ${12 * k}px`, background: '#fff', borderBottom: `1px solid ${C.line}`, fontSize: 12 * k, color: C.muted }}>
          <span>드라이브 — 스페이스기전 교실</span>
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 18 * k, fontSize: 12 * k }}><span>─</span><span>▢</span><span>✕</span></span>
        </div>
      )}
      <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex' }}>
        <aside style={{ width: 210 * k, flexShrink: 0, background: C.card, borderRight: `1px solid ${C.line}`, padding: `${16 * k}px ${10 * k}px` }}>
          <div style={{ fontWeight: 700, padding: `0 ${8 * k}px ${12 * k}px`, fontSize: 13 * k }}>김기전 선생님의 드라이브</div>
          <SideBtn k={k} icon="⌂" label="내 드라이브" on={side === 'root'} refName={refs.root} />
          <SideBtn k={k} icon="⚇" label="공유 문서함" on={side === 'shared'} />
          <div style={{ color: C.muted, fontSize: 11 * k, fontWeight: 600, padding: `${14 * k}px ${8 * k}px ${6 * k}px` }}>이 PC</div>
          <SideBtn k={k} icon="▭" label="이 PC 에 복사한 파일" count={pcCount} on={side === 'pc'} refName={refs.pc} style={g(refs.pc)} />
          <div style={{ color: C.muted, fontSize: 11 * k, fontWeight: 600, padding: `${14 * k}px ${8 * k}px ${6 * k}px` }}>이 수업 폴더</div>
          <SideBtn k={k} icon="↑" label={presetName} on={side === 'preset'} refName={refs.preset} style={g(refs.preset)} />
          <div style={{ color: C.muted, fontSize: 11 * k, fontWeight: 600, padding: `${14 * k}px ${8 * k}px ${6 * k}px` }}>공유 드라이브</div>
          <SideBtn k={k} icon="▤" label="정보과 공유 드라이브" on={side === 'sdrive'} />
        </aside>
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <header style={{ display: 'flex', alignItems: 'center', gap: 8 * k, padding: `${12 * k}px ${16 * k}px`, borderBottom: `1px solid ${C.line}`, background: C.card }}>
            <span data-pt={refs.up} style={{ width: 34 * k, height: 34 * k, borderRadius: 8 * k, border: `1px solid ${C.line}`, display: 'grid', placeItems: 'center', fontSize: 15 * k }}>↑</span>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', fontSize: 13 * k, overflow: 'hidden' }}>
              {crumbs.map((c, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', fontWeight: i === crumbs.length - 1 ? 700 : 400 }}>
                  {i > 0 && <span style={{ color: C.muted, padding: `0 ${6 * k}px` }}>›</span>}
                  <span style={{ padding: `${4 * k}px ${4 * k}px` }}>{c}</span>
                </span>
              ))}
            </div>
            <span style={{ width: 34 * k, height: 34 * k, borderRadius: 8 * k, border: `1px solid ${C.line}`, display: 'grid', placeItems: 'center', fontSize: 15 * k }}>⟳</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 * k, flexShrink: 0, ...toolsStyle }}>
              {mode === 'normal' && (<><span style={btn(k)}>새 폴더</span><span style={btn(k, true)}>올리기</span></>)}
              {mode === 'pc' && <span style={{ color: C.muted, fontSize: 12 * k, maxWidth: 300 * k, lineHeight: 1.4 }}>이 PC 의 파일 — 수업이 끝나도 남고, 드라이브와는 따로입니다.</span>}
              {mode === 'select' && (<>
                <strong style={{ fontSize: 13 * k, color: C.primary, whiteSpace: 'nowrap' }}>{selCount}개 선택</strong>
                <span data-pt={refs.open} style={{ ...btn(k), ...g(refs.open) }}>열기</span>
                <span data-pt={refs.copy} style={{ ...btn(k, true), ...g(refs.copy) }}>컴퓨터로 복사</span>
                <span style={btn(k)}>✕</span>
              </>)}
              {mode === 'pcselect' && (<>
                <strong style={{ fontSize: 13 * k, color: C.primary, whiteSpace: 'nowrap' }}>{selCount}개 선택</strong>
                <span style={btn(k)}>열기</span>
                <span data-pt={refs.reveal} style={{ ...btn(k), ...g(refs.reveal) }}>위치 열기</span>
                <span data-pt={refs.forget} style={{ ...btn(k), ...g(refs.forget) }}>목록에서 빼기</span>
                <span data-pt={refs.trash} style={{ ...btn(k, false, true), ...g(refs.trash) }}>지우기</span>
                <span style={btn(k)}>✕</span>
              </>)}
            </span>
          </header>
          {banner && (
            <div style={{ padding: `${8 * k}px ${16 * k}px`, fontSize: 13 * k, background: bannerBg, borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 8 * k, lineHeight: 1.5, ...banner.style }}>
              <span style={{ flex: 1, minWidth: 0 }}>{banner.text}</span>
              {banner.action && <span data-pt={banner.actionRef} style={{ ...btn(k), padding: `${3 * k}px ${10 * k}px`, flexShrink: 0, ...g(banner.actionRef) }}>{banner.action}</span>}
            </div>
          )}
          <div style={{ flex: 1, background: C.card, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: `${22 * k}px minmax(0,1fr) ${150 * k}px ${90 * k}px`, alignItems: 'center', gap: 12 * k, padding: `${8 * k}px ${16 * k}px`, borderBottom: `1px solid ${C.line}`, color: C.muted, fontSize: 12 * k }}>
              <Check k={k} on={rows.length > 0 && rows.every((r) => r.selected)} part={rows.some((r) => r.selected) && !rows.every((r) => r.selected)} />
              <span>이름</span><span>{dateHead}</span><span>크기</span>
            </div>
            {rows.map((r) => (
              <div key={r.id} data-pt={r.ref} style={{ display: 'grid', gridTemplateColumns: `${22 * k}px minmax(0,1fr) ${150 * k}px ${90 * k}px`, alignItems: 'center', gap: 12 * k, padding: `${8 * k}px ${16 * k}px`, borderBottom: `1px solid ${C.line}`,
                background: r.selected ? `color-mix(in srgb, ${C.primary} 14%, #fff)` : undefined, ...r.style, ...g(r.ref) }}>
                <Check k={k} on={r.selected} />
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 * k, minWidth: 0, fontSize: 14 * k }}>
                  <KindIcon kind={r.kind} size={22 * k} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
                  {r.pill && (
                    <span style={{ flexShrink: 0, fontSize: 11 * k, fontWeight: 600, padding: `${2 * k}px ${8 * k}px`, borderRadius: 999, border: '1px solid currentColor', color: pillColor[r.pill.tone], whiteSpace: 'nowrap' }}>{r.pill.text}</span>
                  )}
                </span>
                <span style={{ color: C.muted, fontSize: 12 * k }}>{r.date}</span>
                <span style={{ color: C.muted, fontSize: 12 * k }}>{r.size}</span>
              </div>
            ))}
          </div>
          {files && (
            <footer style={{ borderTop: `1px solid ${C.line}`, background: C.card, padding: `${10 * k}px ${16 * k}px`, fontSize: 12 * k }}>
              <strong>열어 둔 파일</strong>
              <span style={{ color: C.muted, marginLeft: 8 * k, fontSize: 11 * k }}>저장하면 드라이브에 올라가고, 수업이 끝나면 이 PC 에서 지웁니다 — 남기려면 [이 PC 에 저장].</span>
              {files.map((f) => (
                <div key={f.name} style={{ display: 'flex', gap: 10 * k, alignItems: 'center', marginTop: 6 * k }}>
                  <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</span>
                  <span style={{ color: f.tone === 'ok' ? C.ok : C.warn }}>{f.state}</span>
                  <span data-pt={refs.reopen} style={{ border: `1px solid ${C.line}`, borderRadius: 6 * k, padding: `${2 * k}px ${8 * k}px`, fontSize: 11 * k }}>다시 열기</span>
                  <span data-pt={refs.keep} style={{ ...g(refs.keep), border: `1px solid ${C.line}`, borderRadius: 6 * k, padding: `${2 * k}px ${8 * k}px`, fontSize: 11 * k }}>이 PC 에 저장</span>
                </div>
              ))}
            </footer>
          )}
        </main>
        {overlay}
      </div>
    </div>
  );
}

function Check({ k, on, part }: { k: number; on?: boolean; part?: boolean }) {
  return (
    <span style={{ width: 16 * k, height: 16 * k, borderRadius: 3 * k, border: `1.5px solid ${on || part ? C.primary : '#94a3b8'}`, background: on || part ? C.primary : '#fff', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11 * k, fontWeight: 800, lineHeight: 1 }}>
      {on ? '✓' : part ? '−' : ''}
    </span>
  );
}

/** 드라이브 다시 연결 덮개(.overlay .card) */
export function ReconnectCard({ k = 1, qr, left, refMake, makeStyle }: { k?: number; qr?: boolean; left?: string; refMake?: string; makeStyle?: CSSProperties }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'color-mix(in srgb, #f4f6fb 88%, transparent)', display: 'grid', placeItems: 'center', zIndex: 5 }}>
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18 * k, padding: 28 * k, width: 440 * k, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 * k, alignItems: 'center', boxShadow: '0 20px 50px -20px rgba(15,23,42,.3)' }}>
        <div style={{ fontSize: 20 * k, fontWeight: 800 }}>드라이브 연결이 끝났습니다</div>
        <div style={{ color: C.muted, fontSize: 13 * k, lineHeight: 1.7 }}>구글 드라이브 연결은 1시간입니다. 수업 중인 선생님이 휴대폰으로 QR 을 찍으면 1시간 더 이어집니다.</div>
        {qr && <QR size={200 * k} seed={21} style={{ border: `1px solid ${C.line}` }} />}
        {left && <div style={{ color: C.muted, fontSize: 12 * k }}>{left}</div>}
        {!qr && <span data-pt={refMake} style={{ ...btn(k, true), padding: `${10 * k}px ${20 * k}px`, fontSize: 15 * k, ...makeStyle }}>QR 만들기</span>}
        {!qr && <span style={{ color: C.primary, fontSize: 13 * k, textDecoration: 'underline' }}>이 PC 에 복사한 파일 보기</span>}
      </div>
    </div>
  );
}

/* ── 구글 창 (classroom-google.html · 560×580) ── */

/** 구글 앱 글자 타일 — classroom-popup.js APP_LOOK (공식 아이콘을 못 읽을 때의 모양) */
const APP: [string, string, string][] = [
  ['클래스룸', 'C', '#188038'], ['드라이브(웹)', 'D', '#1a73e8'], ['문서', '문', '#4285f4'], ['시트', '시', '#0f9d58'],
  ['슬라이드', '슬', '#f4b400'], ['설문지', '설', '#7248b9'], ['캘린더', '31', '#1967d2'], ['Meet', 'M', '#00897b'],
  ['Gmail', 'M', '#ea4335'], ['Keep', 'K', '#f6bf26'], ['사이트', 'S', '#3f51b5'], ['YouTube', '▶', '#ff0000'],
];

export function AppTile({ letter, color, size }: { letter: string; color: string; size: number }) {
  return <span style={{ width: size, height: size, borderRadius: size * 0.26, background: color, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: size * 0.37, flexShrink: 0 }}>{letter}</span>;
}

export type GStatus = 'none' | 'ok';

export function GoogleWin({ k = 1, status = 'ok', email = 'teacher@myschool.hs.kr', refs = {}, style, toolsStyle, appsStyle, footStyle, phoneStyle, saved = true }: {
  k?: number; status?: GStatus; email?: string; refs?: Record<string, string>; style?: CSSProperties; toolsStyle?: CSSProperties; appsStyle?: CSSProperties; footStyle?: CSSProperties; phoneStyle?: CSSProperties; saved?: boolean;
}) {
  return (
    <div style={{ position: 'absolute', width: 560 * k, height: 580 * k, background: C.card, color: C.ink, borderRadius: 14 * k, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 70px -30px rgba(15,23,42,.5), 0 0 0 1px rgba(15,23,42,.1)', ...style }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12 * k, padding: `${16 * k}px ${18 * k}px`, borderBottom: `1px solid ${C.line}` }}>
        <Glyph look={LOOK.google} size={36 * k} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ display: 'block', fontSize: 15 * k }}>구글</strong>
          <span style={{ display: 'block', fontSize: 12 * k, color: C.muted }}>{status === 'ok' ? email : '로그인 전'}</span>
        </div>
        <span style={{ fontSize: 16 * k, color: C.muted }}>✕</span>
      </header>
      <div style={{ padding: `${12 * k}px ${14 * k}px 0`, ...toolsStyle }}>
        <div style={{ fontSize: 12 * k, fontWeight: 700, color: C.muted, margin: `${2 * k}px ${4 * k}px ${8 * k}px` }}>로그인 없이 바로</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 * k, marginBottom: 12 * k }}>
          {([['클래스룸', 'C', '#188038', refs.classroom], ['슬라이드 발표', '슬', '#f4b400', refs.slides], ['설문지', '설', '#7248b9', refs.forms]] as const).map(([n, l, c, r]) => (
            <div key={n} data-pt={r} style={{ display: 'flex', alignItems: 'center', gap: 10 * k, border: `1px solid ${C.line}`, background: C.bg, borderRadius: 12 * k, padding: `${10 * k}px ${12 * k}px`, minHeight: 52 * k, fontWeight: 700, fontSize: 13 * k }}>
              <AppTile letter={l} color={c} size={28 * k} />{n}
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, padding: `0 ${14 * k}px`, ...appsStyle }}>
        <div style={{ fontSize: 12 * k, fontWeight: 700, color: C.muted, margin: `${2 * k}px ${4 * k}px ${4 * k}px` }}>웹으로 열기 <small style={{ fontWeight: 400 }}>(구글 로그인 필요)</small></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 * k }}>
          {APP.map(([n, l, c]) => (
            <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 * k, padding: `${7 * k}px ${4 * k}px` }}>
              <AppTile letter={l} color={c} size={38 * k} />
              <span style={{ fontSize: 11.5 * k }}>{n}</span>
            </div>
          ))}
        </div>
      </div>
      <footer style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 * k, padding: `${10 * k}px ${16 * k}px ${12 * k}px`, borderTop: `1px solid ${C.line}`, ...footStyle }}>
        <div data-pt={refs.status} style={{ flex: '1 0 100%', padding: `${7 * k}px ${10 * k}px`, borderRadius: 8 * k, fontSize: 13 * k, fontWeight: 600, color: status === 'ok' ? '#166534' : '#1f2937', background: status === 'ok' ? '#dcfce7' : '#f1f5f9' }}>
          {status === 'ok' ? `✓ 로그인됨 · ${email}` : '구글에 로그인되어 있지 않습니다. [휴대폰으로 로그인]으로 로그인하세요.'}
        </div>
        <span style={{ flex: 1, fontSize: 11.5 * k, color: C.muted, lineHeight: 1.4 }}>수업이 끝나면 이 PC 에 암호화해 보관합니다.</span>
        <span data-pt={refs.phone} style={{ ...btn(k, true), ...phoneStyle }}>휴대폰으로 로그인</span>
        <span style={btn(k)}>로그인 창 열기</span>
        {saved && <span data-pt={refs.forget} style={{ color: C.danger, fontSize: 12.5 * k }}>이 PC 로그인 지우기</span>}
      </footer>
    </div>
  );
}

/** 작은 Word 창 — 교실 PC 프로그램으로 열린 문서 */
export function WordWin({ k = 1, name = '활동지.docx', style, children }: { k?: number; name?: string; style?: CSSProperties; children?: ReactNode }) {
  return (
    <div style={{ position: 'absolute', width: 520 * k, height: 400 * k, background: '#fff', borderRadius: 8 * k, overflow: 'hidden', boxShadow: '0 30px 60px -28px rgba(15,23,42,.55), 0 0 0 1px rgba(15,23,42,.12)', display: 'flex', flexDirection: 'column', ...style }}>
      <div style={{ height: 34 * k, background: '#2b579a', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 * k, padding: `0 ${12 * k}px`, fontSize: 13 * k }}>
        <span style={{ fontWeight: 800 }}>W</span>{name} — Word
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 16 * k, fontSize: 12 * k }}><span>─</span><span>▢</span><span>✕</span></span>
      </div>
      <div style={{ height: 30 * k, background: '#f3f4f6', borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 14 * k, padding: `0 ${12 * k}px`, fontSize: 11.5 * k, color: '#475569' }}>
        <span>파일</span><span>홈</span><span>삽입</span><span>레이아웃</span>
      </div>
      <div style={{ flex: 1, background: '#e5e7eb', padding: `${16 * k}px ${40 * k}px 0` }}>
        <div style={{ background: '#fff', height: '100%', padding: `${24 * k}px ${28 * k}px`, boxShadow: '0 2px 6px rgba(15,23,42,.12)' }}>
          {children ?? (
            <>
              <div style={{ fontSize: 17 * k, fontWeight: 800 }}>3주차 활동지</div>
              {[92, 80, 86, 60, 74].map((w, i) => <div key={i} style={{ height: 8 * k, width: `${w}%`, background: '#e2e8f0', borderRadius: 4, marginTop: 12 * k }} />)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export const LOOKS: Record<string, Look> = LOOK;
