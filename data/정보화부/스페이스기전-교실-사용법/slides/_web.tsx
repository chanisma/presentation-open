import type { CSSProperties, ReactNode } from 'react';
import { C, Glyph, Dock, LOOK, Mark, type Look, type DockTile } from '../kit';

/* ── 스페이스기전 웹(세팅 만들기 장 3~9) 공용 부품 ──────────────────────
   웹 화면은 실물 캡처(reference/web-01b·web-02)와 spacekijun 코드 원문을 따른다.
   웹의 강조색은 blue-600(#2563eb) — 교실 PC 쪽 인디고와 구분된다.
   편집 창은 장마다 크기·구도가 다르게 놓이므로, 본문 좌표를 상수로 고정해
   (EB) 날아가는 타일·검산 좌표가 같은 숫자를 쓰게 한다. */

export const BLUE = '#2563eb';

/** 세팅 항목 하나 — 독 타일 모양 + 이름 + 종류(순서 목록의 둘째 줄) */
export type Item = { id: string; look: Look; label: string; kind: '구글' | '웹사이트' | '드라이브' | '프로그램' | '스페이스기전' };

export const IT: Record<string, Item> = {
  classroom: { id: 'classroom', look: LOOK.classroom, label: '클래스룸', kind: '구글' },
  padlet: { id: 'padlet', look: LOOK.site, label: '패들렛', kind: '웹사이트' },
  tkbell: { id: 'tkbell', look: LOOK.site, label: '띵커벨', kind: '웹사이트' },
  school: { id: 'school', look: LOOK.site, label: '학교 홈페이지', kind: '웹사이트' },
  folder: { id: 'folder', look: LOOK.folder, label: '1-3 정보 수업자료', kind: '드라이브' },
  pptx: { id: 'pptx', look: LOOK.file, label: '3주차 활동.pptx', kind: '드라이브' },
  ppt: { id: 'ppt', look: LOOK.powerpoint, label: 'PowerPoint', kind: '프로그램' },
  seat: { id: 'seat', look: LOOK.space, label: '자리 배치', kind: '스페이스기전' },
};

export const toTile = (it: Item): DockTile => ({ id: it.id, look: it.look, label: it.label });
export const ALWAYS: DockTile[] = [
  { id: 'google', look: LOOK.google, label: '구글' },
  { id: 'drive', look: LOOK.mydrive, label: '내 드라이브' },
];

/** 더하기 탭의 목록 — presetItems.ts 원문 순서 */
export const GOOGLE_APPS: [string, string][] = [
  ['classroom', '클래스룸'], ['drive', '드라이브(웹)'], ['docs', '문서'], ['sheets', '시트'], ['slides', '슬라이드'], ['forms', '설문지'],
  ['calendar', '캘린더'], ['meet', 'Meet'], ['gmail', 'Gmail'], ['keep', 'Keep'], ['sites', '사이트'], ['youtube', 'YouTube'],
];
export const SITES = ['패들렛', 'ChatGPT', 'Gemini', 'Claude', '캔바', '미리캔버스', '띵커벨', '카훗', '클래스카드', '멘티미터', '퀴즈즈', '리로스쿨', '판서노트'];
export const PROGRAMS: [string, string][] = [
  ['powerpoint', 'PowerPoint'], ['hwp', '한글'], ['word', 'Word'], ['excel', 'Excel'], ['whiteboard', 'Microsoft Whiteboard'],
  ['notepad', '메모장'], ['paint', '그림판'], ['calculator', '계산기'], ['snipping', '캡처 도구'], ['osk', '화상 키보드'],
];
export const SPACES = ['홈', '시간표', '자리 배치', '담임 출결', '협업보드', '학생 협업보드', '코드 공유', '일정', '영상', '툴박스'];
export const TABS: [string, string][] = [['google', '구글 앱'], ['url', '웹사이트'], ['drive', '드라이브'], ['program', '프로그램'], ['space', '스페이스기전']];

/* ── 브라우저 창(크롬 44px + 본문) ── */
export const BAR = 44;
export function Browser({ x, y, w, h, url, children, style, bodyStyle }: { x: number; y: number; w: number; h: number; url: string; children: ReactNode; style?: CSSProperties; bodyStyle?: CSSProperties }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 14, overflow: 'hidden', background: '#fff', border: `1px solid ${C.line}`, boxShadow: '0 30px 70px -36px rgba(15,23,42,.45)', ...style }}>
      <div style={{ height: BAR, display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px', background: '#eef1f6', borderBottom: `1px solid ${C.line}` }}>
        <span style={{ display: 'flex', gap: 7 }}>{['#f87171', '#fbbf24', '#34d399'].map((c) => <i key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />)}</span>
        <span style={{ flex: 1, maxWidth: 720, background: '#fff', borderRadius: 99, padding: '6px 16px', fontSize: 16, color: C.muted, fontFamily: 'var(--font-mono, monospace)', whiteSpace: 'nowrap', overflow: 'hidden' }}>{url}</span>
      </div>
      <div style={{ position: 'relative', height: h - BAR, overflow: 'hidden', background: '#fff', ...bodyStyle }}>{children}</div>
    </div>
  );
}

/** 웹 칩(자동 정리·수업(반)) */
export function ChipW({ on, children, dashed, style, pt }: { on?: boolean; children: ReactNode; dashed?: boolean; style?: CSSProperties; pt?: string }) {
  return (
    <span data-pt={pt} style={{
      display: 'inline-flex', alignItems: 'center', height: 40, padding: '0 16px', borderRadius: 999, fontSize: 17, whiteSpace: 'nowrap',
      border: `1.5px ${dashed ? 'dashed' : 'solid'} ${on ? BLUE : dashed ? '#93c5fd' : '#e2e8f0'}`, background: on ? BLUE : dashed ? '#f8fbff' : '#fff',
      color: on ? '#fff' : dashed ? BLUE : '#475569', fontWeight: on ? 600 : 400, transition: 'background .25s, color .25s', ...style,
    }}>{children}</span>
  );
}

/** 섹션 라벨(웹) */
export function LabelW({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ position: 'absolute', fontSize: 16, color: C.muted, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, ...style }}>{children}</div>;
}

/** 토스트(오른쪽 아래 알림) */
export function Toast({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderRadius: 12, background: '#fff', border: `1px solid ${C.line}`, boxShadow: '0 16px 40px -16px rgba(15,23,42,.4)', fontSize: 18, fontWeight: 600, whiteSpace: 'nowrap', ...style }}>
      <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#16a34a', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 13 }}>✓</span>{children}
    </div>
  );
}

/** /classroom 세팅 카드 */
export function SetCard({ title, section, now, items, used = '3일 전 사용', minutes = 50, style, menuPt, menuStyle }: {
  title: string; section?: string | null; now?: boolean; items: Item[]; used?: string; minutes?: number; style?: CSSProperties; menuPt?: string; menuStyle?: CSSProperties;
}) {
  return (
    <div style={{ position: 'absolute', background: '#fff', border: `1px solid ${C.line}`, borderRadius: 18, padding: '18px 20px', boxShadow: '0 1px 3px rgba(15,23,42,.06)', ...style }}>
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 21, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
            {section ? <span style={{ fontSize: 15, background: '#f1f5f9', borderRadius: 8, padding: '3px 12px' }}>{section}</span>
              : <span style={{ fontSize: 15, border: `1px solid ${C.line}`, borderRadius: 8, padding: '2px 12px' }}>공통</span>}
            {now && <span style={{ fontSize: 15, background: BLUE, color: '#fff', borderRadius: 8, padding: '3px 12px', fontWeight: 600 }}>지금 수업</span>}
          </div>
        </div>
        <span data-pt={menuPt} style={{ width: 40, height: 34, borderRadius: 8, display: 'grid', placeItems: 'center', fontSize: 22, color: C.muted, letterSpacing: 1, ...menuStyle }}>···</span>
      </div>
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', borderRadius: 12, padding: '10px 12px', overflow: 'hidden' }}>
        <Glyph look={LOOK.google} size={36} />
        <Glyph look={LOOK.mydrive} size={36} />
        <i style={{ width: 1, height: 26, background: C.line, margin: '0 4px', flexShrink: 0 }} />
        {items.slice(0, 6).map((it) => <Glyph key={it.id} look={it.look} size={36} />)}
      </div>
      <div style={{ marginTop: 10, fontSize: 15, color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{items.map((i) => i.label).join(' · ') || '구글 · 내 드라이브만'}</div>
      <div style={{ marginTop: 4, fontSize: 14, color: C.faint }}>{minutes}분 뒤 자동 정리 · {used}</div>
    </div>
  );
}

/* ══ 편집 창 본문(데스크톱 넓은 배치) — 본문 좌표 1776×740 고정 ══ */
export const EB = {
  W: 1776, H: 740,
  list: { x: 32, y: 270, w: 788, h: 330 },
  panel: { x: 860, y: 270, w: 884, h: 330 },
  tabX: [876, 980, 1092, 1196, 1300], tabW: [96, 104, 96, 96, 124], tabY: 282,
  rowX: 44, rowY0: 280, rowW: 764,
};
/** 더하기 탭 안 타일의 본문 좌표(중심) */
export function tilePos(tab: string, i: number): { x: number; y: number; w: number; h: number } {
  if (tab === 'google') { const c = i % 6, r = Math.floor(i / 6); return { x: 876 + c * 140 + 66, y: 334 + r * 104 + 49, w: 132, h: 98 }; }
  if (tab === 'url') { const c = i % 7, r = Math.floor(i / 7); return { x: 876 + c * 122 + 58, y: 334 + r * 80 + 37, w: 116, h: 74 }; }
  const c = i % 5, r = Math.floor(i / 5); return { x: 876 + c * 170 + 81, y: 334 + r * 80 + 37, w: 162, h: 74 };
}
export function rowPos(i: number, rowH = 54) { return { x: EB.rowX + 34, y: EB.rowY0 + i * (rowH + 8) + rowH / 2 }; }

const siteLook = LOOK.site;

export function EditorBody({
  title = '교실 세팅 고치기', name, namePlaceholder = '예: 1-3 정보 수업', nameFocus, minutes = 50, sections = ['정보 1-3', '정보 2-3', '인공지능 2-1'], section = '정보 1-3',
  items, tab = 'google', picked = [], urlText = '', urlName = '', urlFocus, nameFieldFocus, rowH = 54, ring = {}, hidden = [], rowFlash = {}, children, footer,
}: {
  title?: string; name: string; namePlaceholder?: string; nameFocus?: boolean; minutes?: number; sections?: string[]; section?: string | null;
  items: Item[]; tab?: string; picked?: string[]; urlText?: string; urlName?: string; urlFocus?: boolean; nameFieldFocus?: boolean; rowH?: number;
  /** data-pt 이름 → 발광 스타일 */ ring?: Record<string, CSSProperties>; hidden?: string[];
  /** 항목 id → 0~1 새로 들어온 줄 강조 */ rowFlash?: Record<string, number>; children?: ReactNode; footer?: ReactNode;
}) {
  const box: CSSProperties = { position: 'absolute', borderRadius: 14, border: `1px solid ${C.line}` };
  const tileBox = (p: { x: number; y: number; w: number; h: number }, on: boolean, pt?: string): CSSProperties => ({
    position: 'absolute', left: p.x - p.w / 2, top: p.y - p.h / 2, width: p.w, height: p.h, borderRadius: 14,
    border: `2px solid ${on ? '#3b82f6' : 'transparent'}`, background: on ? '#eff6ff' : 'transparent',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, ...(pt ? ring[pt] : {}),
  });
  const check = <span style={{ position: 'absolute', right: 6, top: 6, width: 20, height: 20, borderRadius: '50%', background: BLUE, color: '#fff', fontSize: 12, display: 'grid', placeItems: 'center', fontWeight: 800 }}>✓</span>;
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: EB.W, height: EB.H, color: C.ink, background: '#fff' }}>
      {/* 머리글 */}
      <span style={{ position: 'absolute', left: 32, top: 14, width: 46, height: 46, borderRadius: 12, background: '#eff6ff', color: BLUE, display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 800 }}>⊞</span>
      <div style={{ position: 'absolute', left: 92, top: 10, fontSize: 25, fontWeight: 700 }}>{title}</div>
      <div style={{ position: 'absolute', left: 92, top: 44, fontSize: 16, color: C.muted }}>QR 로 승인하면 화면 아래 독에 이 순서로 놓입니다. 누르면 열립니다.</div>
      <span style={{ position: 'absolute', right: 28, top: 18, fontSize: 24, color: C.muted }}>✕</span>
      <i style={{ position: 'absolute', left: 0, right: 0, top: 72, height: 1, background: C.line }} />
      {/* 이름 · 자동 정리 */}
      <LabelW style={{ left: 32, top: 82 }}>🏷 이름</LabelW>
      <div data-pt="name" style={{ position: 'absolute', left: 32, top: 106, width: 1020, height: 46, borderRadius: 10, border: nameFocus ? `2px solid ${C.ink}` : `1px solid ${C.line}`, display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: 19, ...ring.name }}>
        {name ? <span>{name}</span> : <span style={{ color: C.faint }}>{namePlaceholder}</span>}
        {nameFocus && <span style={{ width: 2, height: 22, background: C.ink, marginLeft: 1 }} />}
      </div>
      <LabelW style={{ left: 1092, top: 82 }}>◷ 자동 정리</LabelW>
      <div style={{ position: 'absolute', left: 1092, top: 108, display: 'flex', gap: 8 }}>
        {[45, 50, 60, 90, 120, 180].map((m) => <ChipW key={m} on={minutes === m} pt={`m${m}`} style={ring[`m${m}`]}>{m}분</ChipW>)}
      </div>
      {/* 수업(반) */}
      <LabelW style={{ left: 32, top: 164 }}>👥 수업(반)</LabelW>
      <div style={{ position: 'absolute', left: 32, top: 188, display: 'flex', gap: 8, alignItems: 'center' }}>
        <ChipW on={section === null} pt="sec-none" style={ring['sec-none']}>반 없이(공통)</ChipW>
        {sections.map((s) => <ChipW key={s} on={section === s} pt={`sec-${s}`} style={ring[`sec-${s}`]}>{s}</ChipW>)}
        <span style={{ marginLeft: 12, fontSize: 15, color: C.muted }}>반을 고르면, 그 반 수업 시간에 QR 을 찍었을 때 이 세팅이 미리 골라집니다.</span>
      </div>
      {/* 독에 놓일 순서 */}
      <LabelW style={{ left: 32, top: 244 }}>☰ 독에 놓일 순서</LabelW>
      <div style={{ position: 'absolute', left: 620, top: 246, width: 200, textAlign: 'right', fontSize: 14, color: C.faint }}>{items.length}/30 · 끌어서 순서</div>
      <div style={{ ...box, left: EB.list.x, top: EB.list.y, width: EB.list.w, height: EB.list.h, background: '#f8fafc' }} />
      {items.length === 0 && (
        <div style={{ position: 'absolute', left: EB.list.x, top: EB.list.y + 110, width: EB.list.w, textAlign: 'center', color: C.muted, fontSize: 18, lineHeight: 1.7 }}>
          ＋<br />수업에 쓸 것을 눌러 넣으세요.<br /><span style={{ fontSize: 15, color: C.faint }}>비워 두어도 됩니다 — 독에는 «구글»·«내 드라이브»가 늘 놓입니다.</span>
        </div>
      )}
      {items.map((it, i) => (
        <div key={it.id} style={{
          position: 'absolute', left: EB.rowX, top: EB.rowY0 + i * (rowH + 8), width: EB.rowW, height: rowH, borderRadius: 10,
          background: rowFlash[it.id] ? `color-mix(in srgb, #fde68a ${Math.round(70 * rowFlash[it.id])}%, #fff)` : '#fff', border: `1px solid ${C.line}`,
          display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px', opacity: hidden.includes(it.id) ? 0 : 1,
        }}>
          <span style={{ color: '#cbd5e1', fontSize: 18, letterSpacing: -2 }}>⋮⋮</span>
          <Glyph look={it.look} size={rowH > 44 ? 36 : 28} />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: rowH > 44 ? 'flex-start' : 'center', flexDirection: rowH > 44 ? 'column' : 'row', gap: rowH > 44 ? 0 : 12 }}>
            <span style={{ fontSize: rowH > 44 ? 18 : 16, fontWeight: 500 }}>{it.label}</span>
            <span style={{ fontSize: 14, color: C.muted }}>{it.kind}</span>
          </div>
          <span style={{ color: C.faint, fontSize: 20 }}>✕</span>
        </div>
      ))}
      {/* 더하기 */}
      <LabelW style={{ left: 860, top: 244 }}>＋ 더하기</LabelW>
      <div style={{ ...box, left: EB.panel.x, top: EB.panel.y, width: EB.panel.w, height: EB.panel.h, background: '#fff' }} />
      <div style={{ position: 'absolute', left: 868, top: 278, width: 868, height: 48, borderRadius: 10, background: '#f8fafc' }} />
      {TABS.map(([k, label], i) => (
        <span key={k} data-pt={`tab-${k}`} style={{
          position: 'absolute', left: EB.tabX[i], top: EB.tabY, width: EB.tabW[i], height: 40, borderRadius: 8, display: 'grid', placeItems: 'center', fontSize: 17,
          background: tab === k ? '#fff' : 'transparent', color: tab === k ? BLUE : '#475569', fontWeight: tab === k ? 600 : 400,
          boxShadow: tab === k ? '0 1px 3px rgba(15,23,42,.12)' : undefined, ...ring[`tab-${k}`],
        }}>{label}</span>
      ))}
      {tab === 'google' && <>
        {GOOGLE_APPS.map(([k, label], i) => {
          const p = tilePos('google', i); const on = picked.includes(k);
          return <div key={k} data-pt={`g-${k}`} style={tileBox(p, on, `g-${k}`)}>{on && check}<Glyph look={LOOK[k === 'drive' ? 'mydrive' : k]} size={40} /><span style={{ fontSize: 16 }}>{label}</span></div>;
        })}
        <div style={{ position: 'absolute', left: 878, top: 552, width: 850, fontSize: 14, color: C.muted, lineHeight: 1.5 }}>교실 독의 «구글»로 한 번 로그인하면(그 PC 에 보관) 구글 앱이 로그인된 채 열립니다. 특정 반의 클래스룸·설문지는 «웹사이트»에 주소를 넣으세요.</div>
      </>}
      {tab === 'url' && <>
        {SITES.map((label, i) => {
          const p = tilePos('url', i); const on = picked.includes(label);
          return <div key={label} data-pt={`s-${label}`} style={tileBox(p, on, `s-${label}`)}>{on && check}<Glyph look={siteLook} size={32} /><span style={{ fontSize: 14 }}>{label}</span></div>;
        })}
        <div style={{ position: 'absolute', left: 878, top: 498, fontSize: 14, fontWeight: 600, color: '#64748b' }}>다른 사이트 넣기</div>
        <div data-pt="url-input" style={{ position: 'absolute', left: 876, top: 520, width: 440, height: 40, borderRadius: 8, border: urlFocus ? `2px solid ${C.ink}` : `1px solid ${C.line}`, display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 16, ...ring['url-input'] }}>
          {urlText ? <span>{urlText}</span> : <span style={{ color: C.faint }}>주소 (예: 클래스룸 반 주소, 학교 홈페이지)</span>}
        </div>
        <div data-pt="url-name" style={{ position: 'absolute', left: 1326, top: 520, width: 262, height: 40, borderRadius: 8, border: nameFieldFocus ? `2px solid ${C.ink}` : `1px solid ${C.line}`, display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 16, ...ring['url-name'] }}>
          {urlName ? <span>{urlName}</span> : <span style={{ color: C.faint }}>독에 보일 이름(선택)</span>}
        </div>
        <div data-pt="url-add" style={{ position: 'absolute', left: 1598, top: 520, width: 130, height: 40, borderRadius: 8, background: '#f1f5f9', border: `1px solid ${C.line}`, display: 'grid', placeItems: 'center', fontSize: 16, fontWeight: 600, ...ring['url-add'] }}>＋ 넣기</div>
        <div style={{ position: 'absolute', left: 878, top: 570, fontSize: 14, color: C.muted }}>교실 PC 의 수업용 브라우저에서 열립니다. 구글 주소면 «구글» 로그인을 함께 씁니다.</div>
      </>}
      {tab === 'drive' && <>
        <div data-pt="drive-pick" style={{ position: 'absolute', left: 876, top: 342, width: 852, height: 100, borderRadius: 14, border: '2px dashed #93c5fd', background: '#f8fbff', display: 'flex', alignItems: 'center', gap: 18, padding: '0 24px', ...ring['drive-pick'] }}>
          <Glyph look={LOOK.mydrive} size={52} />
          <div><div style={{ fontSize: 19, fontWeight: 600 }}>드라이브에서 폴더·파일 고르기</div><div style={{ fontSize: 15, color: C.muted, marginTop: 4 }}>여러 개를 한 번에 고를 수 있습니다.</div></div>
        </div>
      </>}
      {tab === 'program' && <>
        {PROGRAMS.map(([k, label], i) => {
          const p = tilePos('program', i); const on = picked.includes(k);
          return <div key={k} data-pt={`p-${k}`} style={tileBox(p, on, `p-${k}`)}>{on && check}<Glyph look={LOOK[k]} size={32} /><span style={{ fontSize: 14, whiteSpace: 'nowrap' }}>{label}</span></div>;
        })}
        <div style={{ position: 'absolute', left: 878, top: 502, width: 420, height: 38, borderRadius: 8, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 15, color: C.faint }}>기기에 등록한 다른 프로그램(영문 이름)</div>
        <div style={{ position: 'absolute', left: 878, top: 552, width: 850, fontSize: 14, color: C.muted, lineHeight: 1.5 }}>교실 PC 에 설치된 것만 열립니다. 목록 밖 프로그램은 그 PC 관리자가 교실 프로그램 설정 파일에 등록한 이름으로 넣으세요.</div>
      </>}
      {tab === 'space' && <>
        {SPACES.map((label, i) => {
          const p = tilePos('space', i); const on = picked.includes(label);
          return <div key={label} data-pt={`sp-${label}`} style={tileBox(p, on, `sp-${label}`)}>{on && check}<Glyph look={LOOK.space} size={32} /><span style={{ fontSize: 14, whiteSpace: 'nowrap' }}>{label}</span></div>;
        })}
        <div style={{ position: 'absolute', left: 878, top: 512, width: 850, fontSize: 14, color: C.muted, lineHeight: 1.5 }}>교실 PC 에서 선생님 계정으로 로그인된 채 열리고, 수업이 끝나면 서버가 그 로그인을 끊습니다.</div>
      </>}
      {/* 독 미리 보기 */}
      <LabelW style={{ left: 32, top: 612 }}>👁 교실 화면 아래 독 미리 보기</LabelW>
      <div style={{ position: 'absolute', left: 32, top: 636, width: 1712, height: 96, borderRadius: 16, background: '#f1f5f9', border: `1px solid ${C.line}` }} />
      <Dock tiles={[...ALWAYS, ...items.filter((i) => !hidden.includes(i.id)).map(toTile)]} teacher="선생님" title={name || namePlaceholder} time={`${minutes}:00`} k={0.78}
        style={{ left: 40, top: 640, background: 'transparent', boxShadow: 'none' }} />
      {footer}
      {children}
    </div>
  );
}

/** 스페이스기전 웹의 왼쪽 메뉴(실물 사이드바 랜드마크) */
export function SideNav({ toolsOpen, active, ring = {} }: { toolsOpen: boolean; active?: string; ring?: Record<string, CSSProperties> }) {
  const item = (label: string, color: string, pt?: string, on?: boolean) => (
    <div key={label} data-pt={pt} style={{ display: 'flex', alignItems: 'center', gap: 14, height: 48, padding: '0 14px', borderRadius: 10, background: on ? '#eef2ff' : 'transparent', color: on ? BLUE : C.ink, fontSize: 18, fontWeight: on ? 600 : 400, ...(pt ? ring[pt] : {}) }}>
      <span style={{ width: 34, height: 34, borderRadius: 9, background: on ? '#1e293b' : '#f1f5f9', color: on ? '#fff' : color, display: 'grid', placeItems: 'center', fontSize: 16 }}>■</span>{label}
    </div>
  );
  const head = (label: string, pt?: string, chev?: boolean) => (
    <div data-pt={pt} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 15, color: C.muted, padding: '14px 14px 6px', borderRadius: 8, ...(pt ? ring[pt] : {}) }}>
      {label}{chev && <span style={{ fontSize: 14, transform: toolsOpen ? 'rotate(90deg)' : undefined, transition: 'transform .2s' }}>▸</span>}
    </div>
  );
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 280, borderRight: `1px solid ${C.line}`, background: '#fbfcfe', padding: '10px 12px' }}>
      <div style={{ fontSize: 22, fontWeight: 800, padding: '8px 14px 10px' }}>메뉴</div>
      {head('오늘')}
      {item('홈 대시보드', BLUE, undefined, active === 'home')}
      {item('시간표', '#16a34a')}
      {item('내 할 일', BLUE)}
      {head('학사 운영')}
      {item('학사 운영 허브', '#d97706')}
      {head('도구', 'nav-tools', true)}
      {toolsOpen && <>
        {item('협업 보드', '#d97706')}
        {item('교실 기기', BLUE, 'nav-classroom', active === 'classroom')}
        {item('문서 생성', '#0d9488')}
      </>}
    </div>
  );
}

/** 웹 상단 막대(SPACEKIJUN + 검색) */
export function TopBar({ left = 280 }: { left?: number }) {
  return (
    <div style={{ position: 'absolute', left, right: 0, top: 0, height: 64, borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 30, padding: '0 28px', background: '#fff' }}>
      <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>SPACEKIJUN</span>
      <span style={{ width: 420, height: 40, borderRadius: 10, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 15, color: C.faint }}>명령어나 찾고 싶은 내용 검색 (Ctrl+K)</span>
    </div>
  );
}

export { Mark };
