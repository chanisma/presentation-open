import type { CSSProperties, ReactNode } from 'react';
import Build from '../../../../src/deck/Build';
import { useDeck } from '../../../../src/deck/DeckContext';
import { useSceneTime, interpolate, spring, riseIn, easeInOut, easeOut } from '../../../../src/scene';
import { typed } from '../../../../src/walkthrough';
import { abs, C, kick, h2, body, small, mono, card, solid, Code, CodeBlock, Header, Stamp, Key, TextLink } from './shared';

/* ═══════════════════ S9 — 막히는 곳 네 군데 (build 4 + 미니 루프) ═══════════════════ */
const miniBox: CSSProperties = { ...solid, borderRadius: 12, overflow: 'hidden', position: 'absolute' };
function MiniWin({ title, children, style, bad = false }: { title: string; children: ReactNode; style?: CSSProperties; bad?: boolean }) {
  return (
    <div style={{ ...miniBox, borderColor: bad ? C.rose : 'var(--hair)', ...style }}>
      <div style={{ height: 26, display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px', borderBottom: '1px solid var(--hair-2)', ...mono, fontSize: 12, color: 'var(--fg-faint)', background: 'color-mix(in srgb, var(--fg) 6%, transparent)' }}>
        <i style={{ width: 7, height: 7, borderRadius: 4, background: 'var(--hair)' }} /> {title}
      </div>
      <div style={{ padding: '8px 12px', ...mono, fontSize: 15, lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}
function Mini1() {
  const t = useSceneTime();
  const p = t % 3.8;
  return (
    <div style={{ position: 'relative', width: 340, height: 200 }}>
      {p < 1.3 && (
        <MiniWin title="옛 PowerShell" bad style={{ left: 0, top: 10, width: 300 }}>
          <div style={{ color: 'var(--fg)' }}>codex --version</div>
          <div style={{ color: C.rose }}>codex: 인식되지 않는 용어… ✕</div>
        </MiniWin>
      )}
      {p >= 1.3 && p < 2.5 && (
        <MiniWin title="새 PowerShell" style={{ left: 20, top: 10, width: 300, borderColor: C.mint }}>
          <div style={{ color: 'var(--fg)' }}>codex --version</div>
          <div style={{ color: C.mint }}>codex-cli 0.154.0 ✓</div>
        </MiniWin>
      )}
      {p >= 2.5 && (
        <MiniWin title="사용자 환경 변수 — Path 편집" style={{ left: 0, top: 6, width: 340, borderColor: C.sky }}>
          <div style={{ color: 'var(--fg-muted)' }}>C:\Users\학생\AppData\Roaming\npm</div>
          <div style={{ color: C.sky }}>{typed(t, '%LOCALAPPDATA%\\Programs\\OpenAI\\Codex\\bin', 2.6 + Math.floor(t / 3.8) * 3.8, 40)}</div>
          <div style={{ color: 'var(--fg-faint)', fontSize: 12 }}>그래도 안 되면 — 관리자 없이 열리는 창</div>
        </MiniWin>
      )}
    </div>
  );
}
function Mini2() {
  const t = useSceneTime();
  const p = (t + 1.1) % 3.8;
  const base = Math.floor((t + 1.1) / 3.8) * 3.8 - 1.1 + 1.7;
  return (
    <div style={{ position: 'relative', width: 340, height: 200 }}>
      <MiniWin title="PowerShell" style={{ left: 0, top: 10, width: 320, borderColor: p < 1.7 ? C.rose : C.mint }}>
        <div style={{ color: 'var(--fg)', textDecoration: p >= 1.2 ? `line-through ${C.rose}` : 'none' }}>codex.ps1</div>
        {p < 1.7 ? <div style={{ color: C.rose, fontSize: 13 }}>이 시스템에서 스크립트를 실행할 수 없으므로… ✕</div> : <div style={{ color: C.mint }}>{typed(t, 'codex.cmd --version', base, 16)}</div>}
        {p >= 3.0 && <div style={{ color: C.mint }}>codex-cli 0.154.0 ✓</div>}
      </MiniWin>
    </div>
  );
}
function Mini3() {
  const t = useSceneTime();
  const p = (t + 2.2) % 3.8;
  return (
    <div style={{ position: 'relative', width: 340, height: 200 }}>
      <MiniWin title="사용자 계정 컨트롤" bad style={{ left: 0, top: 6, width: 300 }}>
        <div style={{ color: 'var(--fg)', fontFamily: 'var(--font-body)' }}>이 앱이 디바이스를 변경하도록 허용하시겠어요?</div>
        <div style={{ color: 'var(--fg-muted)', fontSize: 13, fontFamily: 'var(--font-body)' }}>관리자 계정의 암호를 입력하세요</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <span style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid var(--hair)', fontSize: 13, fontFamily: 'var(--font-body)', color: p >= 1.4 ? 'var(--fg-faint)' : 'var(--fg)' }}>예</span>
          <span style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid var(--hair)', fontSize: 13, fontFamily: 'var(--font-body)' }}>아니요</span>
        </div>
      </MiniWin>
      {p >= 1.4 && (
        <div style={{ position: 'absolute', left: 230, top: 40, fontSize: 64, transform: `translateY(${(1 - Math.min(1, (p - 1.4) / 0.4)) * 20}px)`, opacity: Math.min(1, (p - 1.4) / 0.3) }}>✋</div>
      )}
      {p >= 2.4 && (
        <div style={{ position: 'absolute', left: 120, top: 150, padding: '4px 12px', borderRadius: 999, background: C.amber, color: C.navy, fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-body)' }}>선생님 — 관리자 계정으로 처리</div>
      )}
    </div>
  );
}
function Mini4() {
  const t = useSceneTime();
  const p = (t + 3.0) % 3.8;
  return (
    <div style={{ position: 'relative', width: 340, height: 200 }}>
      {p < 1.7 ? (
        <MiniWin title="PowerShell" bad style={{ left: 0, top: 10, width: 320 }}>
          <div style={{ color: 'var(--fg-muted)' }}>==&gt; Downloading Codex CLI</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 160, height: 8, borderRadius: 4, background: 'var(--hair-2)', overflow: 'hidden' }}><span style={{ display: 'block', width: '30%', height: '100%', background: C.rose }} /></span>
            <span style={{ color: C.rose }}>멈춤 ✕</span>
          </div>
        </MiniWin>
      ) : (
        <MiniWin title="학급 드라이브 → vibe 폴더" style={{ left: 0, top: 10, width: 320, borderColor: C.mint }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-body)' }}>
            <span style={{ fontSize: 22 }}>💾</span> <span style={{ color: 'var(--fg-faint)' }}>→</span> <span style={{ fontSize: 22 }}>📁</span>
            <span style={{ color: C.mint }}>codex.exe 복사</span>
          </div>
          <div style={{ color: 'var(--fg)' }}>{typed(t, '.\\codex.exe --version', Math.floor((t + 3.0) / 3.8) * 3.8 - 3.0 + 2.2, 16)}</div>
        </MiniWin>
      )}
    </div>
  );
}
const STUCK = [
  { x: 120, y: 210, w: 900, h: 290, n: '①', title: "'codex'을(를) 찾을 수 없다", rx: `codex: 인식되지 않는 용어 / 내부 또는 외부 명령이 아닙니다`, fix: ['옛 창을 닫고 새 PowerShell을 연다', '그래도 안 되면 사용자 환경 변수 창에서 Path에 설치 폴더 추가', 'rundll32 sysdm.cpl,EditEnvironmentVariables'], Mini: Mini1 },
  { x: 1060, y: 210, w: 740, h: 290, n: '②', title: '스크립트 실행이 막힌다', rx: '이 시스템에서 스크립트를 실행할 수 없으므로…', fix: ['오늘 설치 방식에서는 나오지 않는다', 'npm으로 설치했을 때만 — codex.cmd로 실행하거나 cmd 창'], Mini: Mini2 },
  { x: 120, y: 540, w: 820, h: 290, n: '③', title: '관리자 암호를 묻는 창', rx: '오늘 경로에서는 뜨지 않는다 — 떴다면 관리자용 설치기를 눌렀다는 뜻', fix: ['멈추고 손을 든다', '선생님이 관리자 계정으로 진행하거나 사용자 경로로 되돌린다'], Mini: Mini3 },
  { x: 980, y: 540, w: 820, h: 290, n: '④', title: '다운로드에서 멈춘다', rx: '학교 네트워크가 releases.openai.com을 막는 경우', fix: ['교사가 미리 받아 둔 codex.exe를 학급 드라이브에서 vibe 폴더로', '.\\codex.exe 로 실행 (최후 수단)'], Mini: Mini4 },
];
export function StuckSlide() {
  return (
    <>
      <Header x={120} y={90} w={900} kicker="막히는 곳 네 군데" title="십중팔구 이 넷 중 하나" />
      <div style={{ ...abs(1060, 100, 740), ...small, textAlign: 'right' }}>라이브 · "지금 내 화면은?" 분포를 본 뒤, 많이 나온 카드부터 연다</div>
      {STUCK.map((s, i) => (
        <Build key={s.n} at={i + 1} style={{ ...abs(s.x, s.y, s.w, s.h) }}>
          <div style={{ ...solid, height: '100%', padding: '18px 22px', display: 'flex', gap: 18, borderColor: i === 0 ? C.mint : 'var(--hair)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <span style={{ ...mono, fontSize: 28, fontWeight: 800, color: i === 2 ? C.amber : C.mint }}>{s.n}</span>
                <span style={{ fontSize: 26, fontWeight: 800, wordBreak: 'keep-all' }}>{s.title}</span>
              </div>
              <div style={{ ...small, fontSize: 16, color: C.rose, marginTop: 6, ...(i === 0 ? mono : {}) }}>{s.rx}</div>
              <ul style={{ ...small, fontSize: 18, color: 'var(--fg)', marginTop: 10, paddingLeft: 22, lineHeight: 1.5 }}>
                {s.fix.map((f, j) => <li key={j} style={j === 2 ? { ...mono, fontSize: 15, color: C.sky, listStyle: 'none', marginLeft: -22 } : {}}>{f}</li>)}
              </ul>
            </div>
            <div style={{ width: 340, flexShrink: 0 }}><s.Mini /></div>
          </div>
        </Build>
      ))}
      <div style={{ ...abs(120, 870, 1680), ...small, fontSize: 19, color: 'var(--fg-muted)', textAlign: 'center' }}>대부분 관리자 권한 없이 풀린다. 안 풀리면 선생님이 관리자 계정으로 처리한다 — 이 장은 사진 찍어 두세요, 집에서 설치할 때도 똑같이 막힙니다</div>
    </>
  );
}

/* ═══════════════════ S11 — 요금소와 하이패스: codex와 codex --yolo (scene) ═══════════════════ */
const CMDS = ['index.html 만들기', 'style.css 수정', '파일 삭제'];
export function TollgateScene() {
  const t = useSceneTime();
  const boundary = interpolate(t, [2.8, 4.2], [1, 0], easeInOut);
  const lane = (y: number): CSSProperties => ({ ...abs(120, y, 1100, 200), background: 'color-mix(in srgb, var(--fg) 4%, var(--bg))', border: '1px solid var(--hair)', borderRadius: 18 });
  const dash = (y: number): CSSProperties => ({ ...abs(140, y, 1060, 0), borderTop: '3px dashed var(--hair)' });
  const CardChip = ({ x, y, label, dim = 1, amber = false }: { x: number; y: number; label: string; dim?: number; amber?: boolean }) => (
    <div style={{ ...abs(x, y, 220, 64), ...solid, borderRadius: 12, display: 'grid', placeItems: 'center', fontSize: 19, fontWeight: 700, opacity: dim, borderColor: amber ? C.amber : 'var(--hair)', boxShadow: amber ? `0 0 24px ${C.amber}` : 'var(--shadow)', whiteSpace: 'nowrap' }}>{label}</div>
  );
  return (
    <>
      <div style={{ ...abs(120, 70, 1100) }}>
        <div style={kick}>실행 방식 두 가지</div>
        <h2 style={{ ...h2, marginTop: 6 }}>묻지 않는 대신, 브레이크가 없다</h2>
      </div>
      {/* 차선 */}
      <div style={lane(300)} /><div style={dash(400)} />
      <div style={lane(600)} /><div style={dash(700)} />
      <div style={{ ...abs(140, 264, 760), ...mono, fontSize: 18, color: 'var(--fg-muted)', whiteSpace: 'nowrap' }}><b style={{ color: 'var(--fg)' }}>codex</b> — 기본: 파일을 바꾸거나 명령을 실행하기 전에 승인을 묻는다</div>
      <div style={{ ...abs(140, 564, 760), ...mono, fontSize: 18, color: 'var(--fg-muted)', whiteSpace: 'nowrap' }}><b style={{ color: C.amber }}>codex --yolo</b> — 묻지 않는다 · 샌드박스도 끈다</div>
      {/* 샌드박스 경계 — 아래 차선을 감싸다 사라진다 */}
      <div style={{ ...abs(104, 584, 1132, 232), border: `3px dashed ${C.mint}`, borderRadius: 24, opacity: boundary }} />
      <div style={{ ...abs(900, 826, 340), ...mono, fontSize: 16, color: C.mint, opacity: boundary, textAlign: 'right' }}>샌드박스 — 작업 폴더 안에서만</div>
      {/* 요금소·하이패스 (SVG 자산) */}
      <img src="assets/svg/tollgate-arch.svg" alt="" aria-hidden style={{ ...abs(860, 200, 360, 640), opacity: interpolate(t, [0, 0.5], [0, 1]) }} />
      {/* 위 차선 카드 — 요금소에서 멈춰 승인 */}
      {CMDS.map((c, i) => {
        const s = 0.4 + 1.7 * i;
        const last = i === CMDS.length - 1; // 마지막 카드는 요금소 앞에 멈춘 채 끝난다 (썸네일 = 승인 대기 컷)
        const toGate = interpolate(t, [s, s + 1.0], [60, 640], easeOut);
        const after = last ? 640 : interpolate(t, [s + 1.8, s + 2.7], [640, 1900], easeInOut);
        const x = t < s + 1.8 ? toGate : after;
        const dim = t < s ? 0 : last ? 1 : interpolate(t, [s + 2.4, s + 2.7], [1, 0]);
        const stamp = t >= s + 1.1 && (last || t < s + 1.9);
        return (
          <div key={c}>
            <CardChip x={x} y={368} label={c} dim={dim} />
            {stamp && (
              <div style={{ ...abs(600, 306), ...riseIn(t, s + 1.1, 0.3, 8), padding: '6px 14px', borderRadius: 999, background: C.navy, border: `2px solid ${C.mint}`, fontSize: 17, fontWeight: 800, color: C.mint, whiteSpace: 'nowrap', zIndex: 5 }}>
                실행할까요? [y/n] {t >= s + 1.5 && <Key hot>y</Key>}
              </div>
            )}
          </div>
        );
      })}
      {/* 아래 차선 카드 — 멈춤 없이 통과 */}
      {CMDS.map((c, i) => {
        const s = 0.9 + 1.7 * i;
        const last = i === CMDS.length - 1; // 마지막 카드는 하이패스 아래를 지나는 순간에 멈춘다 (경고 컷)
        const x = last ? interpolate(t, [s, s + 1.0], [60, 680], easeOut) : interpolate(t, [s, s + 1.9], [60, 1900]);
        const dim = t < s ? 0 : last ? 1 : interpolate(t, [s + 1.7, s + 1.9], [1, 0]);
        const amber = last && boundary < 0.1 && t > s + 0.8;
        return <CardChip key={c} x={x} y={668} label={c} dim={dim} amber={amber} />;
      })}
      {t > 5.2 && (
        <div style={{ ...abs(560, 866, 640), fontSize: 20, fontWeight: 800, color: C.amber, ...riseIn(t, 5.2, 0.3, 8) }}>⚠ 울타리가 없으면 "파일 삭제"도 묻지 않고 지나간다</div>
      )}
      {/* 오른쪽 밴드 */}
      <div style={{ ...abs(1300, 230, 540), display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ ...solid, padding: '16px 20px', ...riseIn(t, 0.3, 0.6, 12) }}>
          <Code size={22}>codex</Code>
          <div style={{ ...small, marginTop: 8 }}>승인을 묻는다. 작업 폴더 밖·위험한 명령은 멈춘다 (샌드박스)</div>
        </div>
        <div style={{ ...solid, padding: '16px 20px', borderColor: C.amber, ...riseIn(t, 0.8, 0.6, 12) }}>
          <Code size={22} color={C.amber}>codex --yolo</Code>
          <div style={{ ...small, marginTop: 8 }}>묻지 않고, 샌드박스도 끈다. 정식 이름은 <span style={{ ...mono, fontSize: 15, color: 'var(--fg)' }}>--dangerously-bypass-approvals-and-sandbox</span> — "yolo"는 그 별명</div>
        </div>
        <div style={{ ...card, padding: '16px 20px', borderColor: C.mint, ...riseIn(t, 1.3, 0.6, 12) }}>
          <div style={kick}>수업에서는</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6, wordBreak: 'keep-all' }}><Code size={20} color={C.amber}>codex --yolo</Code>로 실행한다 — 단, <span style={{ color: C.mint }}>오늘 만든 vibe 폴더 안에서만</span></div>
          <div style={{ ...small, marginTop: 8 }}>바탕화면·문서 루트에서 켜지 않는다</div>
        </div>
        <div style={{ ...small, fontSize: 19, ...riseIn(t, 4.4, 0.6, 12) }}>판단 기준 한 줄 — 폴더 안에 잃으면 안 되는 파일이 있으면 <b style={{ color: 'var(--fg)' }}>--yolo를 끈다</b></div>
      </div>
    </>
  );
}

/* ═══════════════════ S12 — 첫 명령: 파일을 만들고, 그 파일을 쓴다 (build 5) ═══════════════════ */
const CMD_A = '이 폴더에 hello.txt 파일을 만들고 "안녕, 에이전트"라고 적어 줘';
const CMD_B = 'hello.txt를 읽고, 그 내용을 영어로 번역한 hello-en.txt를 만들어 줘';
export function FirstCommandSlide() {
  const { clicks } = useDeck();
  const c = Math.min(clicks, 9);
  const line: CSSProperties = { ...mono, fontSize: 21, lineHeight: 1.75, wordBreak: 'break-all' };
  const FileRow = ({ name, on }: { name: string; on: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', borderRadius: 10, ...mono, fontSize: 21, fontWeight: 700, opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(10px)', transition: 'all .5s', background: on ? 'color-mix(in srgb, var(--primary) 16%, transparent)' : 'transparent', color: C.mint }}>
      <svg width="22" height="26" viewBox="0 0 20 24" aria-hidden><path d="M2 2h10l6 6v14H2z" fill="none" stroke={C.mint} strokeWidth="1.8" strokeLinejoin="round" /></svg>
      {name}
    </div>
  );
  return (
    <>
      <Header x={120} y={80} w={1000} kicker="첫 명령" title="파일을 만들고, 그 파일을 쓴다" />
      <div style={{ ...abs(120, 220, 1080, 580), ...solid, overflow: 'hidden' }}>
        <div style={{ height: 40, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', background: 'color-mix(in srgb, var(--fg) 7%, var(--bg))', borderBottom: '1px solid var(--hair-2)', ...mono, fontSize: 14, color: 'var(--fg-faint)' }}>PowerShell — vibe</div>
        <div style={{ padding: '18px 24px' }}>
          <div style={{ ...line, color: 'var(--fg-faint)', fontStyle: 'italic' }}>vibe 폴더에서 연 터미널</div>
          <Build at={1}><div style={{ ...line, fontWeight: 700 }}>codex --yolo</div><div style={{ ...line, color: 'var(--fg-muted)' }}>✓ 준비 완료 — 무엇을 할까요?</div></Build>
          <Build at={2}>
            <div style={{ ...line, fontWeight: 700, color: 'var(--fg)', marginTop: 10 }}>› {CMD_A}</div>
            <div style={{ ...line, color: C.mintSoft }}>● hello.txt를 만들었습니다 — "안녕, 에이전트"</div>
          </Build>
          <Build at={4}>
            <div style={{ ...line, fontWeight: 700, color: 'var(--fg)', marginTop: 10 }}>› {CMD_B}</div>
            <div style={{ ...line, color: C.mintSoft }}>● hello.txt를 읽었습니다 → "Hello, agent"</div>
            <div style={{ ...line, color: C.mintSoft }}>● hello-en.txt를 만들었습니다</div>
          </Build>
        </div>
        <div style={{ position: 'absolute', left: 24, bottom: 16, ...small, fontSize: 15, color: 'var(--fg-faint)' }}>› 로 시작하는 두 줄이 학생이 그대로 칠 문장 — 드래그해 복사</div>
      </div>
      <div style={{ ...abs(1260, 220, 540, 580), ...solid, overflow: 'hidden' }}>
        <div style={{ height: 40, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', borderBottom: '1px solid var(--hair-2)', ...mono, fontSize: 14, color: 'var(--fg-faint)' }}>문서 › vibe — 파일 탐색기</div>
        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FileRow name="hello.txt" on={c >= 3} />
          <FileRow name="hello-en.txt" on={c >= 4} />
          {c < 3 && <div style={{ ...small, fontStyle: 'italic', color: 'var(--fg-faint)', padding: 14 }}>아직 비어 있다</div>}
        </div>
        <Build at={3} style={{ position: 'absolute', left: 20, bottom: 24, width: 500 }}>
          <div style={{ ...card, padding: '14px 18px', ...small, fontSize: 18, color: 'var(--fg)' }}>더블클릭해 보면 진짜 파일이다 — 웹 채팅에서는 안 되는 일</div>
        </Build>
      </div>
      <Build at={5} style={{ ...abs(120, 850, 1680) }}>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
          <div style={{ ...solid, borderColor: C.mint, padding: '14px 26px', fontSize: 24, fontWeight: 800 }}>① 파일을 만들었다</div>
          <div style={{ ...solid, borderColor: C.sky, padding: '14px 26px', fontSize: 24, fontWeight: 800 }}>② 내 파일을 읽었다</div>
          <div style={{ ...small, fontSize: 20, alignSelf: 'center' }}>— 유리벽(4장)의 두 가지, 손으로 확인</div>
        </div>
      </Build>
    </>
  );
}

/* ═══════════════════ S13 — 네 개의 모델: 성능과 소모량 (build 4) ═══════════════════ */
const MODEL_CHIPS = [
  { id: 'Luna', sub: 'GPT-5.6', x: 420, size: 120, use: '가장 빠르고 저렴 · 분명하고 반복적인 작업', at: 1 },
  { id: 'Terra', sub: 'GPT-5.6', x: 780, size: 150, use: '균형 · 일상 작업 · Codex 기본값', at: 1 },
  { id: 'Sol', sub: 'GPT-5.6', x: 1160, size: 190, use: '복잡한 코딩 · 깊이 있는 작업', at: 2 },
  { id: 'Astra', sub: 'GPT-6', x: 1500, size: 240, use: '가장 강함 · 여러 단계와 도구를 오가는 작업', at: 2 },
];
export function ModelsSlide() {
  const { clicks } = useDeck();
  const c = Math.min(clicks, 9);
  return (
    <>
      <Header x={120} y={80} w={900} kicker="Codex의 모델 네 종" title="좋을수록 빨리 줄어든다" />
      <svg style={{ ...abs(0, 0, 1920, 1080), pointerEvents: 'none' }} viewBox="0 0 1920 1080" aria-hidden>
        <defs><linearGradient id="s13-ax" x1="0" x2="1"><stop offset="0" stopColor={C.sky} /><stop offset="1" stopColor={C.mint} /></linearGradient></defs>
        <line x1={200} y1={520} x2={1760} y2={520} stroke="url(#s13-ax)" strokeWidth={8} strokeLinecap="round" />
        <path d="M1740 508 L1764 520 L1740 532" fill="none" stroke={C.mint} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
        {c >= 3 && (
          <>
            <line x1={200} y1={720} x2={1720} y2={720} stroke={C.amber} strokeWidth={5} strokeLinecap="round" strokeDasharray="14 12" />
            <path d="M1700 708 L1724 720 L1700 732" fill="none" stroke={C.amber} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
      </svg>
      <div style={{ ...abs(200, 474, 150), ...small, fontSize: 19, fontWeight: 700 }}>빠르고 가볍다</div>
      <div style={{ ...abs(1610, 474, 160), ...small, fontSize: 19, fontWeight: 700, textAlign: 'right' }}>강하고 무겁다</div>
      {c >= 3 && (
        <>
          <div style={{ ...abs(200, 742, 600), fontSize: 20, fontWeight: 800, color: C.amber }}>사용량 소모 속도 — 같은 방향으로 늘어난다</div>
          <div style={{ ...abs(1220, 742, 500), ...small, fontSize: 18, textAlign: 'right' }}>토큰 기준 · 5시간 창과 주간 한도를 모두 빨리 쓴다</div>
        </>
      )}
      {MODEL_CHIPS.map((m) => {
        const on = c >= m.at;
        const isSol = m.id === 'Sol';
        return (
          <div key={m.id} style={{ ...abs(m.x - m.size / 2, 520 - m.size / 2 - 40, m.size, m.size), opacity: on ? 1 : 0, transform: on ? 'none' : 'scale(.7)', transition: 'all .5s' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: `6px solid ${isSol && c >= 4 ? C.mint : 'var(--hair)'}`, background: 'color-mix(in srgb, var(--fg) 6%, var(--bg))', boxShadow: isSol && c >= 4 ? `0 0 0 10px color-mix(in srgb, ${C.mint} 25%, transparent), var(--glow)` : 'var(--shadow)', display: 'grid', placeItems: 'center', textAlign: 'center', transition: 'all .5s' }}>
              <div>
                <div style={{ fontSize: m.size * 0.22, fontWeight: 900, letterSpacing: '-0.02em' }}>{m.id}</div>
                <div style={{ ...mono, fontSize: 14, color: 'var(--fg-faint)' }}>{m.sub}</div>
              </div>
            </div>
            <div style={{ position: 'absolute', left: '50%', top: '100%', transform: 'translateX(-50%)', width: 300, marginTop: 58, textAlign: 'center', ...small, fontSize: 17 }}>{m.use}</div>
            {m.id === 'Astra' && c >= 2 && <div style={{ position: 'absolute', left: '50%', top: -34, transform: 'translateX(-50%)' }}><Code size={14}>GPT-6 · 2026-09 출시</Code></div>}
            {m.id === 'Terra' && c >= 4 && <div style={{ position: 'absolute', left: '50%', top: -34, transform: 'translateX(-50%)' }}><Code size={14} color="var(--fg-muted)">기본값</Code></div>}
          </div>
        );
      })}
      <Build at={4} style={{ ...abs(1040, 300), zIndex: 3 }}>
        <Stamp size={26}>여기서 시작</Stamp>
      </Build>
      <div style={{ ...abs(120, 880, 1680), ...body, textAlign: 'center' }}>
        모델은 <b style={{ color: 'var(--fg)' }}>두뇌 종류</b>다 — 같은 명령이라도 결과의 깊이와 속도가 달라진다. 사용량이 아주 많지 않으면 <b style={{ color: C.mint }}>Sol에서 시작</b>. 기본값은 Terra라 한 번 바꿔야 한다.
      </div>
      <Build at={1} style={{ ...abs(0, 0, 1, 1), opacity: 0 }}><span /></Build>
      <Build at={2} style={{ ...abs(0, 0, 1, 1), opacity: 0 }}><span /></Build>
      <Build at={3} style={{ ...abs(0, 0, 1, 1), opacity: 0 }}><span /></Build>
    </>
  );
}

/* ═══════════════════ S14 — Astra는 어디까지 하나: 영상 두 편 (static) ═══════════════════ */
const VIDEOS = [
  { id: 'zpGx_Db4FGo', ch: '안될공학 - IT 테크 신기술', title: 'GPT6 Astra, 난리인 이유가 보이네요 | 진짜 좋아진 능력과 기술적 차이 | OpenAI만의 기술적 해자일까?', len: '8분 02초', likes: '좋아요 1,991', note: '통째로 시청 가능' },
  { id: 'viemdZ0JNhM', ch: '안될과학 Unrealscience', title: '이제 AI한테 컴퓨터를 맡겨도 될까? 우리가 알던 챗GPT와 완전히 달라진 이유 (GPT6 아스트라)', len: '13분 06초', likes: '좋아요 917', note: '구간 선택' },
];
export function VideosSlide() {
  return (
    <>
      <Header x={120} y={70} w={1000} kicker="Astra는 어디까지 하나" title="가장 강한 모델을 남의 눈으로" />
      <div style={{ ...abs(120, 220, 1000, 562), ...solid, overflow: 'hidden', borderColor: C.mint }}>
        <iframe
          title={VIDEOS[0].title}
          src={`https://www.youtube-nocookie.com/embed/${VIDEOS[0].id}?rel=0`}
          style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
      <div style={{ ...abs(1180, 220, 620), display: 'flex', flexDirection: 'column', gap: 16 }}>
        {VIDEOS.map((v, i) => (
          <div key={v.id} style={{ ...solid, padding: '16px 20px', borderColor: i === 0 ? C.mint : 'var(--hair)' }}>
            <div style={{ ...kick, color: i === 0 ? C.mint : 'var(--fg-faint)' }}>영상 {i === 0 ? '①' : '②'} · {v.ch}</div>
            <div style={{ fontSize: 19, fontWeight: 800, marginTop: 6, wordBreak: 'keep-all', lineHeight: 1.35 }}>{v.title}</div>
            <div style={{ ...small, fontSize: 16, marginTop: 6 }}>{v.len} · {v.likes} · {v.note}</div>
            <div style={{ marginTop: 8 }}><TextLink href={`https://www.youtube.com/watch?v=${v.id}`} size={17}>새 탭에서 열기 → youtube.com/watch?v={v.id}</TextLink></div>
          </div>
        ))}
        <div style={{ ...small, fontSize: 14, color: 'var(--fg-faint)', lineHeight: 1.5 }}>
          다음 순위(2026-09-15 좋아요 기준): 안될공학 「AI로 돈 번다…」 889 — 산업·경제 주제라 제외 · AI 겸임교수 이종범 463 · 조팀장의 AI 공략집 111 · 로치의개발일기 76 · AI상상력대장 50
        </div>
      </div>
      <div style={{ ...abs(120, 830, 1680) }}>
        <div style={{ ...kick, marginBottom: 12 }}>시청 포인트</div>
        <div style={{ display: 'flex', gap: 16 }}>
          {['어떤 작업에서 성능 차이가 체감되는가', '시간·비용은 얼마나 들었는가', '나라면 어떤 일에 이 모델을 쓸까'].map((p, i) => (
            <div key={i} style={{ ...solid, padding: '14px 22px', fontSize: 21, fontWeight: 700, display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ ...mono, color: C.mint, fontWeight: 800 }}>{i + 1}</span>{p}
            </div>
          ))}
        </div>
        <div style={{ ...small, fontSize: 16, color: 'var(--fg-faint)', marginTop: 12 }}>제목의 "난리인 이유", "완전히 달라진"은 만든 사람의 주장 — 우리는 근거를 보러 왔다</div>
      </div>
    </>
  );
}
