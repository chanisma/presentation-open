import { Scene, useSceneTime, interpolate, spring } from '../../../../src/scene';
import { typed } from '../../../../src/walkthrough';
import { C, MONO, Head, SceneSubs, seq, type SlideMeta } from '../kit';
import { fade } from './_ui';

/* 3 — 스킬: 왼쪽 폴더 나무가 한 줄씩 펼쳐지고(자동화 업무 › .claude/skills › 세 스킬),
   «쪽지 보내 줘» 한마디에 탐색 빛이 세 스킬 위를 훑다 쿨메신저에서 멈춘다. 오른쪽에 그 SKILL.md가 펼쳐지고
   절차 줄이 위에서부터 체크된다 — «매번 같은 순서로». */

const SUBS = [
  '스킬은 «자동화 업무» 폴더 안에 파일로 설치됩니다.',
  '스킬마다 SKILL.md라는 설명서가 들어 있고, 언제 쓰는지와 작업 순서, 주의할 점이 적혀 있습니다.',
  '선생님이 «쪽지 보내 줘»라고 말하면, 에이전트가 알맞은 스킬을 스스로 찾아 읽고 그대로 따릅니다.',
  '그래서 매번 방법을 길게 설명하지 않아도, 같은 일을 같은 순서로 해냅니다.',
];
const { subs, at, end } = seq(3, SUBS);
export const meta: SlideMeta = { kind: 'scene', dur: end };

const TREE: [number, string, string?][] = [
  [0, '📁 자동화 업무'],
  [1, '📁 .claude/skills', 'Claude Code가 읽는 곳'],
  [2, '📁 coolmessenger-send', '쿨메신저 쪽지'],
  [3, '📄 SKILL.md'],
  [2, '📁 riroschool-sms', '리로스쿨 문자'],
  [2, '📁 spacekijun-mcp', 'SPACEKIJUN 업무 도구'],
  [1, '📁 .agents/skills', 'Codex가 읽는 곳'],
];
const STEPS = ['조직도에서 받는 사람 이름 찾기', '문체 프로필대로 초안 쓰기', '초안을 보여 주고 승인받기', '발송 → 보낸 쪽지함에서 확인'];

function Stage() {
  const t = useSceneTime();
  const ask = at[2] + 0.2;
  const scan = interpolate(t, [ask + 1.4, ask + 3.0], [0, 1]);
  const scanRow = [2, 4, 5, 2][Math.min(3, Math.floor(scan * 3.99))];
  const doc = spring(t, at[1] + 0.2, 0.6);
  return (
    <>
      <Head chapter="② 스킬" title="스킬 = 폴더에 넣어 두는 업무 매뉴얼" />
      {/* 폴더 나무 */}
      <div style={{ position: 'absolute', left: 72, top: 200, width: 700, padding: '24px 28px', borderRadius: 18, background: C.panel, border: `1.5px solid ${C.line}`, boxShadow: '0 24px 50px -32px rgba(31,27,22,.5)' }}>
        {TREE.map(([d, name, note], i) => {
          const k = fade(t, at[0] + 0.4 + i * 0.35, 0.35);
          const hot = t > ask + 1.4 && i === scanRow;
          const picked = t > ask + 3.0 && i === 2;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, height: 62, paddingLeft: d * 34, opacity: k, borderRadius: 10,
              background: picked ? `color-mix(in srgb, ${C.gold} 16%, #fff)` : hot ? 'rgba(15,138,120,.08)' : 'transparent', outline: picked ? `2.5px solid ${C.gold}` : 'none' }}>
              <span style={{ fontSize: 25, fontFamily: d ? MONO : undefined, fontWeight: d < 2 ? 700 : 600 }}>{name}</span>
              {note && <span style={{ fontSize: 19, color: C.muted }}>— {note}</span>}
            </div>
          );
        })}
      </div>
      {/* 말 한마디 */}
      <div style={{ position: 'absolute', left: 72, top: 720, padding: '16px 28px', borderRadius: '24px 24px 24px 6px', background: C.gold, color: '#fff', fontSize: 30, fontWeight: 700, opacity: fade(t, ask) }}>
        {typed(t, '«2학년 담임 선생님들께 쪽지 보내 줘»', ask + 0.2, 16)}
      </div>
      {/* SKILL.md 펼침 */}
      <div style={{ position: 'absolute', left: 860, top: 200, width: 990, height: 640, borderRadius: 18, background: '#fffdf6', border: `1.5px solid ${C.line}`,
        boxShadow: '0 30px 60px -32px rgba(31,27,22,.55)', opacity: doc, transform: `translateX(${(1 - doc) * 60}px)`, padding: '30px 40px', overflow: 'hidden' }}>
        <div style={{ fontFamily: MONO, fontSize: 19, color: C.muted }}>coolmessenger-send / SKILL.md</div>
        <div style={{ marginTop: 18, fontFamily: MONO, fontSize: 18, color: C.faint }}>---</div>
        <div style={{ fontFamily: MONO, fontSize: 21, lineHeight: 1.6, opacity: fade(t, at[1] + 1.2) }}>
          <span style={{ color: C.gold }}>name:</span> coolmessenger-send<br />
          <span style={{ color: C.gold }}>description:</span> 쿨메신저로 쪽지를 작성·발송하고 확인한다.<br />
          «쪽지 보내기», «메신저로 안내 보내줘» 요청 시 사용.
        </div>
        <div style={{ fontFamily: MONO, fontSize: 18, color: C.faint }}>---</div>
        <div style={{ marginTop: 18, fontSize: 28, fontWeight: 800, opacity: fade(t, at[1] + 2.4) }}>작업 순서</div>
        {STEPS.map((s, i) => {
          const done = t > at[3] + 0.4 + i * 0.7;
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, fontSize: 25, opacity: fade(t, at[1] + 2.8 + i * 0.4) }}>
              <span style={{ width: 34, height: 34, borderRadius: 8, display: 'grid', placeItems: 'center', border: `2px solid ${done ? C.ok : C.line}`, background: done ? C.ok : 'transparent', color: '#fff', fontSize: 22 }}>{done ? '✓' : ''}</span>
              <span style={{ color: i === 2 ? C.warn : C.ink, fontWeight: i === 2 ? 700 : 500 }}>{s}</span>
            </div>
          );
        })}
        <div style={{ position: 'absolute', right: 34, top: 28, padding: '6px 16px', borderRadius: 999, background: C.gold, color: '#fff', fontSize: 20, fontWeight: 700, opacity: fade(t, ask + 3.2) }}>에이전트가 읽는 중</div>
      </div>
      <SceneSubs items={subs} />
    </>
  );
}

export default function S03() {
  return (
    <Scene duration={end}>
      <Stage />
    </Scene>
  );
}
