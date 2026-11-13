import type { ReactNode } from 'react';
import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import Build from '../../../../src/deck/Build';
import Reveal from '../../../../src/deck/Reveal';
import Contrast from '../../../../src/components/Contrast';
import Split from '../../../../src/components/Split';
import Bento from '../../../../src/components/Bento';
import Chat from '../../../../src/components/Chat';
import Steps from '../../../../src/components/Steps';
import Terminal from '../../../../src/components/Terminal';

/* ══════════════════════════════════════════════════════════════════════
   터미널로 시작하는 클로드 코드 — 교사(AI 전문적 학습동아리) 대상 1차시 강의
   수업계획_v1.md의 "수업 내용"만 참고해 이 덱 엔진의 컴포넌트로 재구성했다.
   테마(다크 터미널 + 코랄 강조)는 registry.tsx 의 theme 로 주입된다.
   ══════════════════════════════════════════════════════════════════════ */

const Code = ({ children }: { children: ReactNode }) => (
  <span
    style={{
      fontFamily: 'var(--font-mono)',
      fontSize: '0.9em',
      padding: '4px 10px',
      borderRadius: 8,
      background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
      border: '1px solid color-mix(in srgb, var(--primary) 24%, transparent)',
      color: 'var(--primary)',
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </span>
);

const X = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.4}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: 16, height: 16, flexShrink: 0, color: 'var(--fg-faint)' }}
  >
    <path d="M7 7l10 10M17 7L7 17" />
  </svg>
);
const Check = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: 16, height: 16, flexShrink: 0, color: 'var(--primary)' }}
  >
    <path d="M5 12.5l4.5 4.5L19 6.5" />
  </svg>
);

const mediaBg: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background:
    'radial-gradient(120% 100% at 70% 18%, color-mix(in srgb, var(--primary) 15%, transparent), transparent 60%), var(--surface-2)',
};

const traps = [
  {
    wrong: 'cd 없이 실행 → 엉뚱한 폴더를 건드림',
    fix: '항상 작업 폴더로 먼저 이동',
  },
  { wrong: '한 번에 다 시키기 → 뒤엉킴', fix: '작게 쪼개 단계별로' },
  {
    wrong: '결과 안 보고 넘기기 → 실수를 놓침',
    fix: '바뀐 것을 확인하고 승인',
  },
  {
    wrong: '학생 개인정보 부주의',
    fix: '민감정보는 신중히 · 외부 전송 주의',
  },
];

const branches = [
  { k: '준비', title: 'Node.js · 설치', body: '토대를 깔고 npm 한 줄로 설치' },
  {
    k: '대화',
    title: 'cd · claude · 자연어',
    body: '폴더로 들어가 말로 시키기',
  },
  {
    k: '도구',
    title: '단축 열쇠',
    body: 'Shift+Tab · /init · /clear · Esc',
  },
  { k: '스킬', title: '→ 생기부', body: '전문 절차로 세특 작성·검수' },
];

export default function ClaudeCodeDeck() {
  return (
    <Deck>
      {/* 1 — 표지 */}
      <Slide
        center
        nav="표지"
        notes="여러분, 검은 화면 보면 막막하시죠? 오늘 끝나면 이 화면이 제일 든든한 조수가 됩니다. 목표는 딱 하나예요 — 여기다 말 걸어서 생기부까지 써보는 것."
      >
        <Reveal>
          <div className="kicker" style={{ marginBottom: 14 }}>
            AI 전문적 학습동아리 · 1차시
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <h1 className="display" style={{ fontSize: 'clamp(38px,7.4vw,96px)' }}>
            검은 화면이 <span className="accent-text">말을 건다</span>
          </h1>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="subhead" style={{ marginTop: 18, marginInline: 'auto' }}>
            설치부터 생활기록부 세특까지 — 필요한 건 자연어 한마디.
          </p>
        </Reveal>
        <div style={{ marginTop: 'clamp(24px,4.5vh,44px)', width: '100%' }}>
          <Terminal
            title="terminal — claude"
            maxWidth={560}
            lines={[
              { type: 'comment', text: '명령어를 외우는 곳이 아니라, 말을 거는 곳' },
              { type: 'cmd', text: 'claude' },
              { type: 'ai', text: '무엇을 도와드릴까요?' },
              { type: 'you', text: '우리 반 세특 초안부터 잡아줘', cursor: true },
            ]}
          />
        </div>
      </Slide>

      {/* 2 — 일상 비유 (챗봇 vs 에이전트) */}
      <Contrast
        nav="에이전트란"
        notes="내비게이션은 '200m 앞 좌회전'만 말하죠. 자율주행차는 직접 운전해요. 클로드 코드가 그 자율주행입니다 — 조언이 아니라 실제로 손을 씁니다. 이게 '에이전트'예요."
        kicker="오늘의 키워드 · 에이전트"
        title="길만 알려줄까, 대신 운전해줄까"
        left={{
          label: '일반 챗봇 · 내비게이션',
          title: '방법을 “말”해준다',
          points: [
            '“이렇게 하세요”라고 알려주기만 함',
            '복사·붙여넣기는 결국 내 몫',
            '파일을 직접 열거나 실행하진 못함',
          ],
        }}
        right={{
          label: '클로드 코드 · 자율주행',
          title: '그 일을 “대신” 해준다',
          points: [
            '파일을 직접 읽고 고침',
            '명령을 실제로 실행',
            '정리·문서 작성까지 손수 처리',
          ],
        }}
      />

      {/* 3 — Node.js (토대) */}
      <Split
        nav="준비물 · Node.js"
        notes="집 지을 때 주춧돌부터 놓죠. 클로드 코드도 Node.js라는 받침이 있어야 서요. nodejs.org 가서 LTS 하나 받으면 끝. 확인은 node -v."
        kicker="준비물 · Node.js"
        title={
          <>
            집을 세우려면 <span className="accent-text">주춧돌</span>부터
          </>
        }
        body="클로드 코드가 서 있으려면 Node.js라는 토대가 먼저 필요해요. nodejs.org에서 LTS(안정 버전)를 내려받아 설치합니다."
        media={
          <>
            <div style={mediaBg} />
            <div
              style={{
                position: 'relative',
                padding: 'clamp(22px,4vw,52px)',
                width: '100%',
              }}
            >
              {/* 토대 위에 얹히는 2단 구조 */}
              <div
                style={{
                  display: 'grid',
                  gap: 8,
                  width: 'min(320px,100%)',
                  marginInline: 'auto',
                  marginBottom: 18,
                }}
              >
                <div
                  className="mat"
                  style={{
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 18px',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: 'var(--fg)',
                    width: '82%',
                    marginInline: 'auto',
                  }}
                >
                  Claude Code
                </div>
                <div
                  className="mat"
                  style={{
                    borderRadius: 'var(--radius-sm)',
                    padding: '14px 18px',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: 'var(--fg)',
                    borderColor:
                      'color-mix(in srgb, var(--primary) 32%, transparent)',
                  }}
                >
                  Node.js{' '}
                  <span style={{ color: 'var(--fg-faint)', fontWeight: 400 }}>
                    · 토대(엔진)
                  </span>
                </div>
              </div>
              <Terminal
                title="terminal"
                maxWidth={360}
                lines={[
                  { type: 'comment', text: '제대로 깔렸는지 확인' },
                  { type: 'cmd', text: 'node -v' },
                  { type: 'ok', text: 'v22.11.0' },
                ]}
              />
            </div>
          </>
        }
      />

      {/* 4 — 설치 (npm 한 줄) */}
      <Slide
        center
        nav="설치"
        notes="설치, 어렵지 않아요. 이 한 줄 복사·붙여넣기. -g는 '전역'이라는 뜻 — 어느 폴더에 있든 claude 부를 수 있다는 거예요."
      >
        <Reveal>
          <div className="kicker" style={{ marginBottom: 12 }}>
            설치 · npm
          </div>
        </Reveal>
        <Reveal delay={0.06}>
          <h2
            className="headline"
            style={{
              marginInline: 'auto',
              marginBottom: 'clamp(22px,4vh,38px)',
            }}
          >
            딱 한 줄이면 <span className="accent-text">설치 끝</span>
          </h2>
        </Reveal>
        <div style={{ width: '100%' }}>
          <Terminal
            title="terminal"
            maxWidth={720}
            lines={[
              {
                type: 'comment',
                text: '어느 폴더에서든 claude 를 부를 수 있게 (-g = 전역)',
              },
              { type: 'cmd', text: 'npm install -g @anthropic-ai/claude-code' },
              { type: 'ok', text: '설치 완료' },
              { type: 'cmd', text: 'claude --version' },
              { type: 'out', text: '2.x.x  (Claude Code)' },
            ]}
          />
        </div>
        <Build at={1}>
          <p
            className="lead"
            style={{ marginInline: 'auto', marginTop: 'clamp(18px,3vh,26px)' }}
          >
            <Code>-g</Code> 는 전역(global) — 이 컴퓨터 어디에 있든{' '}
            <span className="accent-text">claude</span> 를 부를 수 있어요.
          </p>
        </Build>
      </Slide>

      {/* 5 — 실행 & 첫 대화 */}
      <Chat
        nav="실행"
        notes="먼저 일할 폴더로 들어가요 — cd. 그리고 claude. 대화창이 열리면 '이거 정리해줘'처럼 그냥 말로 시키면 됩니다."
        kicker="실행 · cd → claude → 자연어"
        title="폴더로 들어가, 말을 건다"
        name="claude"
        messages={[
          { from: 'user', text: '이 폴더의 파일들, 학생별로 한눈에 정리해줘' },
          {
            from: 'ai',
            text: '3개 폴더·42개 파일을 훑었어요. 학생별로 묶어 목록으로 만들까요?',
          },
          { from: 'user', text: '응, 표로 만들어줘' },
          { from: 'ai', text: '완료했어요. students.csv 로 저장해 뒀습니다.' },
        ]}
      />

      {/* 6 — 단축 열쇠 */}
      <Bento
        nav="단축 열쇠"
        notes="전부 외울 필요 없어요. 오늘은 Shift+Tab 하나만. 계획만 세우게 할지, 알아서 하게 할지 이걸로 바꿉니다."
        kicker="도구 활용 · 단축 열쇠"
        title="손에 익히는 단축 열쇠"
        tiles={[
          {
            k: '가장 먼저 익힐 것',
            title: 'Shift + Tab',
            body: '계획 모드 ↔ 자동 승인 모드 전환. 오늘은 이 하나만 기억하세요.',
            c: 5,
            r: 2,
            variant: 'glow',
          },
          {
            k: '프로젝트 파악',
            title: '/init',
            body: '코드·자료를 훑어 정리 문서 자동 생성',
            c: 4,
          },
          { k: '맥락 초기화', title: '/clear', body: '대화가 길어지면 리셋', c: 3 },
          {
            k: '셸 명령 바로',
            title: '! 명령',
            body: '클로드를 거치지 않고 즉시 실행',
            c: 4,
          },
          { k: '즉시 중단', title: 'Esc', body: '진행 중인 작업을 바로 멈춤', c: 3 },
        ]}
      />

      {/* 7 — 스킬 */}
      <Split
        nav="스킬"
        flip
        notes="스킬은 '전문가 매뉴얼'이에요. 평소엔 접혀 있다가, 관련 얘기 나오면 스르륵 펼쳐져 정해진 순서대로 일합니다."
        kicker="실전 관문 · 스킬"
        title={
          <>
            접힌 <span className="accent-text">전문가</span>를 펼친다
          </>
        }
        body="스킬은 특정 작업의 전문 절차를 담은 지침서예요. 관련 키워드나 /스킬이름으로 발동되면, 클로드가 정해진 순서대로 그 분야 전문가처럼 일합니다."
        media={
          <>
            <div style={mediaBg} />
            <div
              style={{
                position: 'relative',
                padding: 'clamp(22px,4vw,52px)',
                width: '100%',
              }}
            >
              <div
                className="mat"
                style={{
                  borderRadius: 'var(--radius)',
                  padding: 'clamp(20px,2.6vw,30px)',
                  maxWidth: 380,
                  marginInline: 'auto',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 18,
                  }}
                >
                  <span className="tick" />
                  <span className="chip">SKILL · saenggibu-writer</span>
                </div>
                {[
                  ['01', '정리', '자료를 훑어 표준 형식으로'],
                  ['02', '작성', '세특 문장 초안 생성'],
                  ['03', '검수', 'NEIS 바이트·규칙 확인'],
                  ['04', '출력', '최종 문장 내보내기'],
                ].map(([n, t, d]) => (
                  <div
                    key={n}
                    style={{
                      display: 'flex',
                      gap: 14,
                      alignItems: 'baseline',
                      padding: '9px 0',
                      borderTop:
                        n === '01' ? 'none' : '1px solid var(--hair-2)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        fontSize: 13,
                        color: 'var(--primary)',
                        flexShrink: 0,
                      }}
                    >
                      {n}
                    </span>
                    <span style={{ color: 'var(--fg)', fontWeight: 600 }}>
                      {t}
                    </span>
                    <span
                      style={{
                        color: 'var(--fg-muted)',
                        fontSize: 13.5,
                        marginLeft: 'auto',
                        textAlign: 'right',
                      }}
                    >
                      {d}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        }
      />

      {/* 8 — 자주 하는 실수 */}
      <Slide
        nav="자주 하는 실수"
        notes="몇 가지만 조심하면 돼요. 첫째 꼭 작업 폴더로 들어가서 실행, 둘째 한꺼번에 말고 쪼개서, 셋째 결과 확인하고 승인, 넷째 학생 정보는 신중하게."
      >
        <Reveal>
          <div
            className="kicker"
            style={{ marginBottom: 10, textAlign: 'center' }}
          >
            피드백 · 자주 하는 실수
          </div>
          <h2
            className="headline"
            style={{
              textAlign: 'center',
              marginInline: 'auto',
              marginBottom: 'clamp(24px,4vh,40px)',
            }}
          >
            이 <span className="accent-text">네 가지</span>만 조심하세요
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="cols" style={{ maxWidth: 920, marginInline: 'auto' }}>
            {traps.map((t, i) => (
              <div
                key={i}
                className="mat"
                style={{
                  borderRadius: 'var(--radius)',
                  padding: 'clamp(18px,2vw,24px)',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div
                  style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}
                >
                  <X />
                  <span style={{ color: 'var(--fg)', fontWeight: 600, lineHeight: 1.4 }}>
                    {t.wrong}
                  </span>
                </div>
                <div
                  style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}
                >
                  <Check />
                  <span style={{ color: 'var(--fg-muted)', lineHeight: 1.4 }}>
                    {t.fix}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </Slide>

      {/* 9 — 생기부 실습 (목적지) */}
      <Steps
        nav="생기부 실습"
        notes="오늘의 목적지예요. 학생 자료 폴더에 넣고 '세특 써줘' 한마디. 정리부터 문장 작성, NEIS 바이트 맞추기, 검수까지 스킬이 다 합니다."
        kicker="실생활 적용 · 오늘의 목적지"
        title="진짜로 이렇게 씁니다: 스킬로 생기부"
        items={[
          {
            title: '자료를 넣는다',
            body: '학생 보고서·자기평가·활동내역을 한 폴더에 모아두기',
          },
          {
            title: '한마디로 요청',
            body: '“생기부 세특 써줘” → saenggibu-writer 스킬 발동',
          },
          {
            title: '세특 + 검수 완료',
            body: '세특 문장에 NEIS 바이트(1498/1500)까지 맞춰 출력',
          },
        ]}
      />

      {/* 10 — 한눈에 정리 */}
      <Slide
        center
        nav="한눈에 정리"
        notes="오늘 걸어온 길을 한 장으로. 가운데 클로드 코드, 거기서 준비·대화·도구·스킬로 뻗어요. 스킬 끝엔 생기부. 이제 여러분 폴더에서 직접 말 걸어보세요."
      >
        <Reveal>
          <div className="kicker" style={{ marginBottom: 10 }}>
            마무리 · 한눈에 정리
          </div>
          <h2
            className="headline"
            style={{
              marginInline: 'auto',
              marginBottom: 'clamp(20px,3vh,32px)',
            }}
          >
            오늘 걸어온 길
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 24px',
              borderRadius: 999,
              background: 'var(--accent)',
              color: 'var(--accent-ink)',
              fontWeight: 700,
              fontSize: 'clamp(18px,2.4vw,26px)',
              boxShadow: 'var(--glow)',
              marginBottom: 'clamp(20px,3.5vh,34px)',
            }}
          >
            클로드 코드
            <span style={{ opacity: 0.72, fontWeight: 500, fontSize: '0.62em' }}>
              터미널 에이전트
            </span>
          </div>
        </Reveal>
        <Reveal delay={0.16}>
          <div className="cols" style={{ maxWidth: 960, marginInline: 'auto' }}>
            {branches.map((b) => (
              <div
                key={b.k}
                className="mat"
                style={{
                  borderRadius: 'var(--radius)',
                  padding: 'clamp(18px,2vw,24px)',
                  textAlign: 'left',
                }}
              >
                <div className="kicker accent-text" style={{ marginBottom: 8 }}>
                  {b.k}
                </div>
                <h3
                  style={{
                    fontSize: 'clamp(18px,2vw,22px)',
                    marginBottom: 6,
                  }}
                >
                  {b.title}
                </h3>
                <p
                  style={{
                    color: 'var(--fg-muted)',
                    fontSize: 14,
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {b.body}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
        <Build at={1}>
          <p
            className="lead"
            style={{ marginInline: 'auto', marginTop: 'clamp(20px,3vh,28px)' }}
          >
            다음 걸음 —{' '}
            <span className="accent-text">내 폴더에서 직접 말 걸어보기.</span>
          </p>
        </Build>
      </Slide>
    </Deck>
  );
}
