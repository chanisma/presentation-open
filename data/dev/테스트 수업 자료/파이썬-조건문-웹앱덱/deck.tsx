import { useId, type ReactNode } from 'react';
import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import Build from '../../../../src/deck/Build';
import Reveal from '../../../../src/deck/Reveal';
import Cover from '../../../../src/components/Cover';
import Split from '../../../../src/components/Split';
import Bento from '../../../../src/components/Bento';
import Table from '../../../../src/components/Table';
import CodeWindow from '../../../../src/components/CodeWindow';

/* ══════════════════════════════════════════════════════════════════════
   파이썬 조건문 — 고등학교 정보 교과 1차시 (14장)
   조건문 수업계획_v2.md의 "수업 내용"만 참고해 이 덱 엔진으로 재구성했다.
   테마(파이썬 블루 다크)는 registry.tsx 의 theme 로 주입된다.
   ══════════════════════════════════════════════════════════════════════ */

const Code = ({ children }: { children: ReactNode }) => (
  <span
    style={{
      fontFamily: 'var(--font-mono)',
      fontSize: '0.92em',
      padding: '3px 8px',
      borderRadius: 7,
      background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
      border: '1px solid color-mix(in srgb, var(--primary) 26%, transparent)',
      color: 'var(--primary)',
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </span>
);

const mediaBg: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background:
    'radial-gradient(120% 100% at 70% 16%, color-mix(in srgb, var(--primary) 14%, transparent), transparent 60%), var(--surface-2)',
};

/* 결정 마름모 → 두 갈래(참/거짓) 손그림 도식 */
function Diamond() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
      }}
    >
      <div style={{ position: 'relative', width: 132, height: 132, display: 'grid', placeItems: 'center' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: 'rotate(45deg)',
            borderRadius: 16,
            background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
            border: '1.5px solid color-mix(in srgb, var(--primary) 46%, transparent)',
          }}
        />
        <span style={{ position: 'relative', fontWeight: 700, fontSize: 18, color: 'var(--fg)' }}>
          조건?
        </span>
      </div>
      <div style={{ display: 'flex', gap: 'clamp(16px,4vw,44px)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--fg-faint)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            거짓 ↙
          </div>
          <div style={{ color: 'var(--fg-muted)', fontSize: 14, marginTop: 4 }}>행동 2</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            ↘ 참
          </div>
          <div style={{ color: 'var(--fg)', fontSize: 14, marginTop: 4, fontWeight: 600 }}>행동 1</div>
        </div>
      </div>
    </div>
  );
}

/* 벤다이어그램 — AND: 교집합만 채움 / OR: 두 원 모두 채움 */
function Venn({ mode }: { mode: 'and' | 'or' }) {
  const clip = 'venn' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const fillOr = 'color-mix(in srgb, var(--primary) 24%, transparent)';
  return (
    <svg viewBox="0 0 168 96" style={{ width: 168, maxWidth: '100%', height: 'auto' }} aria-hidden>
      <defs>
        <clipPath id={clip}>
          <circle cx="60" cy="48" r="36" />
        </clipPath>
      </defs>
      <circle cx="60" cy="48" r="36" fill={mode === 'or' ? fillOr : 'none'} stroke="var(--primary)" strokeWidth="1.6" />
      <circle cx="108" cy="48" r="36" fill={mode === 'or' ? fillOr : 'none'} stroke="var(--primary)" strokeWidth="1.6" />
      {mode === 'and' && (
        <circle
          cx="108"
          cy="48"
          r="36"
          fill="color-mix(in srgb, var(--primary) 46%, transparent)"
          clipPath={`url(#${clip})`}
        />
      )}
    </svg>
  );
}

/* 실전 문제 카드 — 순수 텍스트 문제 진술 (원본 교과서 스타일) */
function ProblemCard({
  tag,
  title,
  children,
}: {
  tag: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      className="mat"
      style={{
        borderRadius: 'var(--radius)',
        padding: 'clamp(22px,2.6vw,30px)',
        textAlign: 'left',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <span className="chip" style={{ alignSelf: 'flex-start' }}>
        {tag}
      </span>
      <h3 style={{ fontSize: 'clamp(18px,2.1vw,23px)', letterSpacing: '-0.02em' }}>{title}</h3>
      <div
        style={{
          color: 'var(--fg-muted)',
          fontSize: 'clamp(14px,1.5vw,16px)',
          lineHeight: 1.65,
        }}
      >
        {children}
      </div>
    </div>
  );
}

const li: React.CSSProperties = { margin: '4px 0' };

export default function PythonConditionalsDeck() {
  return (
    <Deck>
      {/* 1 — 도입 */}
      <Cover
        nav="도입"
        notes="여러분, 오늘 학교 오는 길에 몇 번이나 선택을 했나요? 사실 우리 뇌는 1초에도 수백 번 '만약 ~라면'을 굴리고 있어요. 오늘은 컴퓨터에게 이 '만약'을 가르치는 법을 배워봅시다."
        kicker="고등학교 정보 · 파이썬"
        title={
          <>
            오늘도 만나는, <span className="accent-text">“만약”</span>
          </>
        }
        subtitle="우리의 하루는 선택의 연속. 그 ‘만약’을 컴퓨터에게 가르쳐 봅시다."
        foot="정보 교과 · 조건문 1차시"
      />

      {/* 2 — 조건문이란? */}
      <Split
        nav="조건문이란"
        notes="조건문은 어떤 조건이 참인지 거짓인지에 따라 다른 행동을 고르는 명령이에요. 갈림길의 분기점에서 컴퓨터가 결정을 내립니다."
        kicker="개념 · 컴퓨터의 갈림길"
        title={
          <>
            조건문이란? <span className="accent-text">참이냐 거짓이냐</span>
          </>
        }
        body={
          <>
            어떤 조건의 <strong>참(True)/거짓(False)</strong>에 따라 다른 행동을
            고르는 명령이에요. 마법의 키워드는 <Code>if</Code> <Code>elif</Code>{' '}
            <Code>else</Code>.
          </>
        }
        media={
          <>
            <div style={mediaBg} />
            <div style={{ position: 'relative', padding: 'clamp(22px,4vw,52px)', width: '100%' }}>
              <Diamond />
            </div>
          </>
        }
      />

      {/* 3 — 실생활 적용 */}
      <Bento
        nav="실생활"
        notes="조건문은 우리가 매일 쓰는 앱과 기계의 뇌 속에 숨어 있어요. 자율주행부터 게임까지 전부 '만약'으로 돌아갑니다."
        kicker="동기 부여 · 어디에 쓰일까"
        title="조건문은 이미 네 곁에 있다."
        tiles={[
          { k: '🚗 자율주행', title: '빨간 신호면 멈춤', body: 'if 신호 == "빨강": 정지', c: 6 },
          { k: '📱 알람', title: '평일 7시면 알림', body: 'if 평일 and 시각 == 7: 울림', c: 6 },
          { k: '🎬 추천', title: '취향과 비슷하면 추천', body: 'if 장르 == 좋아요: 목록에 추가', c: 6 },
          { k: '🎮 게임', title: 'HP가 0이면 게임 오버', body: 'if HP == 0: 게임 오버', c: 6 },
        ]}
      />

      {/* 4 — if 만 */}
      <Slide
        center
        nav="if"
        notes="if만 쓰면 조건이 참일 때만 한 가지 행동을 해요. 거짓이면 아무 일도 일어나지 않죠. 콜론과 들여쓰기 4칸을 꼭 기억하세요."
      >
        <Reveal>
          <div className="kicker" style={{ marginBottom: 12 }}>
            기본 문법 · if
          </div>
        </Reveal>
        <Reveal delay={0.06}>
          <h2 className="headline" style={{ marginInline: 'auto', marginBottom: 'clamp(20px,3.5vh,34px)' }}>
            참일 때만, <span className="accent-text">딱 한 가지</span> 행동
          </h2>
        </Reveal>
        <div style={{ width: '100%', maxWidth: 620, marginInline: 'auto' }}>
          <CodeWindow
            title="if_only.py"
            highlight={[2]}
            code={`점수 = 75
if 점수 >= 60:
    print("통과")`}
          />
        </div>
        <Build at={1}>
          <p className="lead" style={{ marginInline: 'auto', marginTop: 'clamp(16px,3vh,24px)' }}>
            거짓이면 아무 일도 없어요. <span className="accent-text">콜론(:)</span>과{' '}
            <span className="accent-text">4칸 들여쓰기</span>는 필수!
          </p>
        </Build>
      </Slide>

      {/* 5 — if-else */}
      <Split
        nav="if-else"
        notes="if-else는 참이면 A, 거짓이면 B. 둘 중 하나는 반드시 실행됩니다. 로그인 성공/실패, 합격/불합격 같은 이분법이죠."
        kicker="기본 문법 · if-else"
        title={
          <>
            둘 중 하나는 <span className="accent-text">무조건</span>
          </>
        }
        body="참이면 A, 거짓이면 B — 반드시 한쪽은 실행돼요. 로그인 성공/실패, 합격/불합격처럼 ‘이것 아니면 저것’ 사고입니다."
        media={
          <>
            <div style={mediaBg} />
            <div style={{ position: 'relative', padding: 'clamp(20px,4vw,44px)', width: '100%' }}>
              <CodeWindow
                title="login.py"
                highlight={[4]}
                code={`비밀번호 = input("암호: ")
if 비밀번호 == "1234":
    print("로그인 성공")
else:
    print("로그인 실패")`}
              />
            </div>
          </>
        }
      />

      {/* 6 — if-elif-else */}
      <Split
        nav="if-elif-else"
        flip
        notes="elif는 '그러면 만약~'의 줄임말. 위에서부터 차례로 검사해 가장 먼저 참이 되는 하나만 실행돼요. 아무것도 아니면 else로 갑니다."
        kicker="심화 · if-elif-else"
        title={
          <>
            선택지가 <span className="accent-text">여러 개</span>일 때
          </>
        }
        body="위에서부터 차례로 검사해 가장 먼저 참이 되는 분기 하나만 실행. 어느 것도 참이 아니면 else로 갑니다."
        media={
          <>
            <div style={mediaBg} />
            <div style={{ position: 'relative', padding: 'clamp(20px,4vw,44px)', width: '100%' }}>
              <CodeWindow
                title="age.py"
                highlight={[4, 6]}
                code={`나이 = int(input("나이: "))
if 나이 < 14:
    print("초등학생")
elif 나이 < 17:
    print("중학생")
elif 나이 < 20:
    print("고등학생")
else:
    print("성인")`}
              />
            </div>
          </>
        }
      />

      {/* 7 — 비교 연산자 */}
      <Slide
        nav="비교 연산자"
        notes="조건을 만들려면 두 값을 비교해야 해요. 비교 연산자는 6개. 결과는 언제나 True 아니면 False. 특히 =와 ==를 헷갈리지 마세요."
      >
        <Reveal>
          <div className="kicker" style={{ marginBottom: 10, textAlign: 'center' }}>
            도구 · 비교 연산자 6총사
          </div>
          <h2
            className="headline"
            style={{ textAlign: 'center', marginInline: 'auto', marginBottom: 'clamp(22px,4vh,38px)' }}
          >
            두 값을 <span className="accent-text">견주는</span> 여섯 도구
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <Table
            columns={['연산자', '의미', '예시', '결과']}
            rows={[
              ['==', '같다', '5 == 5', 'True'],
              ['!=', '다르다', '5 != 3', 'True'],
              ['>', '크다', '7 > 10', 'False'],
              ['<', '작다', '7 < 10', 'True'],
              ['>=', '크거나 같다', '5 >= 5', 'True'],
              ['<=', '작거나 같다', '6 <= 5', 'False'],
            ]}
            highlightCol={3}
            caption="⚠️ = 는 대입, == 는 비교 — 등호 개수에 주의!"
          />
        </Reveal>
      </Slide>

      {/* 8 — and / or */}
      <Slide
        nav="and / or"
        notes="중첩 if를 쓰기 전에 and와 or을 떠올려 보세요. 코드가 훨씬 깔끔해집니다. and는 둘 다 참, or는 하나만 참이어도 참, not은 뒤집기."
      >
        <Reveal>
          <div className="kicker" style={{ marginBottom: 10, textAlign: 'center' }}>
            도구 · 논리 연산자
          </div>
          <h2
            className="headline"
            style={{ textAlign: 'center', marginInline: 'auto', marginBottom: 'clamp(22px,4vh,38px)' }}
          >
            여러 조건을 <span className="accent-text">한 줄로</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="cols" style={{ maxWidth: 780, marginInline: 'auto' }}>
            {[
              {
                mode: 'and' as const,
                name: 'and',
                rule: '좌우 모두 참이어야 참 (교집합)',
                ex: '나이 >= 17 and 나이 <= 19',
              },
              {
                mode: 'or' as const,
                name: 'or',
                rule: '하나만 참이어도 참 (합집합)',
                ex: '요일 == "토" or 요일 == "일"',
              },
            ].map((c) => (
              <div
                key={c.name}
                className="mat"
                style={{
                  borderRadius: 'var(--radius)',
                  padding: 'clamp(20px,2.4vw,28px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <Venn mode={c.mode} />
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 22, color: 'var(--primary)' }}>
                  {c.name}
                </div>
                <div style={{ color: 'var(--fg-muted)', fontSize: 15, textAlign: 'center' }}>{c.rule}</div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    color: 'var(--fg)',
                    background: 'color-mix(in srgb, var(--primary) 8%, transparent)',
                    border: '1px solid var(--hair-2)',
                    borderRadius: 8,
                    padding: '6px 12px',
                    textAlign: 'center',
                  }}
                >
                  {c.ex}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
        <Build at={1}>
          <p className="lead" style={{ marginInline: 'auto', marginTop: 'clamp(16px,3vh,24px)', textAlign: 'center' }}>
            <Code>not</Code> 은 참/거짓을 <span className="accent-text">뒤집기</span>.
          </p>
        </Build>
      </Slide>

      {/* 9 — 자주 하는 실수 */}
      <Slide
        nav="자주 하는 실수"
        notes="조건문에서 초보자가 가장 많이 빠지는 함정 4가지예요. ==와 = 혼동, 콜론 빠뜨림, 들여쓰기 누락, elif 대신 if 반복. 이것만 피하면 됩니다."
      >
        <Reveal>
          <div className="kicker" style={{ marginBottom: 10, textAlign: 'center' }}>
            피드백 · 디버깅 노하우
          </div>
          <h2
            className="headline"
            style={{ textAlign: 'center', marginInline: 'auto', marginBottom: 'clamp(22px,4vh,38px)' }}
          >
            초보자가 빠지는 <span className="accent-text">네 함정</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="cols" style={{ maxWidth: 940, marginInline: 'auto' }}>
            {[
              { t: '① == 와 = 혼동', bad: 'if x = 5:', good: 'if x == 5:' },
              { t: '② 콜론(:) 빠뜨림', bad: 'if x > 5', good: 'if x > 5:' },
              { t: '③ 들여쓰기 누락', bad: 'if x > 5:\nprint(x)', good: 'if x > 5:\n    print(x)' },
              { t: '④ elif 자리에 if 반복', bad: 'if ...:\nif ...:', good: 'if ...:\nelif ...:' },
            ].map((f, i) => (
              <div
                key={i}
                className="mat"
                style={{
                  borderRadius: 'var(--radius)',
                  padding: 'clamp(16px,1.9vw,22px)',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--fg)', fontSize: 15 }}>{f.t}</div>
                <FixRow bad={f.bad} good={f.good} />
              </div>
            ))}
          </div>
        </Reveal>
      </Slide>

      {/* 10 — 연습 문제 1 & 2 */}
      <Slide
        nav="연습 1·2"
        notes="원본 교과서 스타일 그대로 문제만 제시합니다. 학생들이 직접 코드를 작성하도록 한 후, 다음 시간에 풀이를 함께 봅시다."
      >
        <Reveal>
          <div className="kicker" style={{ marginBottom: 10, textAlign: 'center' }}>
            실전 연습 · 직접 작성해 보기
          </div>
          <h2
            className="headline"
            style={{ textAlign: 'center', marginInline: 'auto', marginBottom: 'clamp(22px,4vh,36px)' }}
          >
            연습 문제 1 &amp; 2
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="cols" style={{ maxWidth: 920, marginInline: 'auto' }}>
            <ProblemCard tag="연습 문제 1" title="5보다 크면 “절반 이상”">
              변수 <Code>x</Code>에 <Code>input()</Code>으로 사용자에게서 숫자를
              입력받고, 조건문을 활용해 <strong>x가 5보다 크면</strong> “절반 이상”을
              출력하는 프로그램을 작성하시오.
            </ProblemCard>
            <ProblemCard tag="연습 문제 2" title="정답이면 “정답”, 틀리면 “오답”">
              변수 <Code>answer</Code>에 정답(임의의 값)을 저장하고, <Code>choice</Code>에
              사용자 입력을 받는다. 조건문으로 <strong>choice가 정답이면</strong> “정답”,
              틀리면 “오답”을 출력하는 프로그램을 작성하시오.
            </ProblemCard>
          </div>
        </Reveal>
      </Slide>

      {/* 11 — 연습 문제 3 */}
      <Slide
        nav="연습 3"
        notes="이 문제는 함정이 하나 있어요. 조건 순서가 잘못되면 50 이상인 값도 첫 번째 분기로 빠져버립니다. 학생들이 직접 풀면서 발견하도록 유도해 주세요."
      >
        <Reveal>
          <div className="kicker" style={{ marginBottom: 10, textAlign: 'center' }}>
            실전 연습 · elif 다중 분기
          </div>
          <h2
            className="headline"
            style={{ textAlign: 'center', marginInline: 'auto', marginBottom: 'clamp(20px,3.5vh,32px)' }}
          >
            연습 문제 3
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div style={{ maxWidth: 720, marginInline: 'auto' }}>
            <ProblemCard tag="연습 문제 3" title="입력 x를 조건에 따라 나눠 저장">
              변수 <Code>x</Code>에 사용자로부터 숫자를 입력받아:
              <ul style={{ margin: '10px 0 0', paddingLeft: 20 }}>
                <li style={li}>x가 10 이상이면 → x를 2로 나눈 값을 x에 저장</li>
                <li style={li}>그게 아니고 x가 50 이상이면 → x를 5로 나눈 값을 x에 저장</li>
                <li style={li}>모두 아니면 → x를 10으로 나눈 값을 x에 저장</li>
              </ul>
              <div style={{ marginTop: 10 }}>마지막에 x를 출력하는 프로그램을 작성하시오.</div>
              <div
                style={{
                  marginTop: 16,
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--primary) 26%, transparent)',
                }}
              >
                <span>💡</span>
                <span style={{ color: 'var(--fg)', fontWeight: 600 }}>
                  조건의 순서가 결과에 영향을 줍니다!
                </span>
              </div>
            </ProblemCard>
          </div>
        </Reveal>
      </Slide>

      {/* 12 — 응용 문제 1 */}
      <Slide
        nav="응용 1"
        notes="1부터 10 사이 정답을 맞추는 Up/Down 게임입니다. 입력값과 정답을 비교해 크다/작다/맞다에 따라 힌트를 출력하도록 유도해 주세요."
      >
        <Reveal>
          <div className="kicker" style={{ marginBottom: 10, textAlign: 'center' }}>
            실전 응용 · 게임 만들기
          </div>
          <h2
            className="headline"
            style={{ textAlign: 'center', marginInline: 'auto', marginBottom: 'clamp(20px,3.5vh,32px)' }}
          >
            응용 문제 1 — 숫자 맞추기 (Up/Down)
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div style={{ maxWidth: 720, marginInline: 'auto' }}>
            <ProblemCard tag="응용 문제 1" title="1~10 사이 숫자를 맞추는 게임">
              <div style={{ color: 'var(--fg)', fontWeight: 600, marginBottom: 4 }}>주제</div>
              <div>1부터 10 사이의 숫자를 맞추는 게임을 만든다.</div>
              <div style={{ color: 'var(--fg)', fontWeight: 600, margin: '14px 0 4px' }}>게임 방식</div>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li style={li}>정답 변수에 1~10 사이의 임의 숫자를 저장</li>
                <li style={li}>사용자로부터 숫자를 입력받기</li>
                <li style={li}>조건문으로 입력 숫자와 정답을 비교</li>
                <li style={li}>
                  정답이면 “정답”, 정답보다 크면 “더 작은 수”, 작으면 “더 큰 수”를 출력
                </li>
              </ul>
            </ProblemCard>
          </div>
        </Reveal>
      </Slide>

      {/* 13 — 응용 문제 2 */}
      <Slide
        nav="응용 2"
        notes="수학에서 배운 판별식을 조건문으로 자동화하는 문제예요. D = b² − 4ac 를 계산해 부호에 따라 근의 종류를 출력하도록 합니다."
      >
        <Reveal>
          <div className="kicker" style={{ marginBottom: 10, textAlign: 'center' }}>
            실전 응용 · 수학 자동화
          </div>
          <h2
            className="headline"
            style={{ textAlign: 'center', marginInline: 'auto', marginBottom: 'clamp(20px,3.5vh,32px)' }}
          >
            응용 문제 2 — 이차방정식 근 판별
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div style={{ maxWidth: 720, marginInline: 'auto' }}>
            <ProblemCard tag="응용 문제 2" title="판별식으로 근의 종류 판단">
              <div style={{ color: 'var(--fg)', fontWeight: 600, marginBottom: 4 }}>주제</div>
              <div>
                이차방정식 <Code>ax² + bx + c = 0</Code> 의 근이 어떤 종류인지 판단하는
                프로그램을 만든다.
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'clamp(20px,3vw,30px)',
                  fontWeight: 600,
                  color: 'var(--primary)',
                  margin: '14px 0 4px',
                }}
              >
                D = b² − 4ac
              </div>
              <div style={{ color: 'var(--fg)', fontWeight: 600, margin: '10px 0 4px' }}>규칙</div>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li style={li}>변수 a, b, c에 원하는 값을 저장</li>
                <li style={li}>판별식 D = b² − 4ac 를 계산해 변수 D에 저장</li>
                <li style={li}>
                  D에 따라 “두 실근 / 중근 / 두 허근” 중 하나를 조건문으로 출력
                </li>
              </ul>
            </ProblemCard>
          </div>
        </Reveal>
      </Slide>

      {/* 14 — 한눈에 정리 */}
      <Slide
        center
        nav="정리"
        notes="조건문은 결국 '만약 ~라면'. 네 가지 형태, 비교·논리 도구, 그리고 함정 네 개만 피하면 끝. 다음 시간엔 반복문과 합쳐 진짜 프로그램을 만들어요."
      >
        <Reveal>
          <div className="kicker" style={{ marginBottom: 10 }}>
            마무리 · 한눈에 정리
          </div>
          <h2 className="headline" style={{ marginInline: 'auto', marginBottom: 'clamp(20px,3vh,30px)' }}>
            조건문, 이것만 기억하자
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
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: 'clamp(18px,2.4vw,26px)',
              boxShadow: 'var(--glow)',
              marginBottom: 'clamp(20px,3.5vh,34px)',
            }}
          >
            조건문 · if
          </div>
        </Reveal>
        <Reveal delay={0.16}>
          <div className="cols" style={{ maxWidth: 980, marginInline: 'auto' }}>
            {[
              { k: 'FORMS · 형태', title: '네 가지 틀', body: 'if · if-else · if-elif-else · 중첩' },
              { k: 'TOOLS · 도구', title: '비교 + 논리', body: '== != > < >= <= · and or not' },
              { k: 'TRAPS · 함정', title: '네 가지 실수', body: '== 혼동 · 콜론 · 들여쓰기 · elif' },
              { k: 'NEXT · 다음', title: '진짜 프로그램', body: '조건문 + 반복문 = 완성!' },
            ].map((b) => (
              <div
                key={b.k}
                className="mat"
                style={{ borderRadius: 'var(--radius)', padding: 'clamp(18px,2vw,24px)', textAlign: 'left' }}
              >
                <div className="kicker accent-text" style={{ marginBottom: 8 }}>
                  {b.k}
                </div>
                <h3 style={{ fontSize: 'clamp(18px,2vw,22px)', marginBottom: 6 }}>{b.title}</h3>
                <p
                  style={{
                    color: 'var(--fg-muted)',
                    fontSize: 14,
                    lineHeight: 1.5,
                    margin: 0,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {b.body}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </Slide>
    </Deck>
  );
}

/* 실수 카드의 ✗ 틀린 코드 / ✓ 고친 코드 두 줄 */
function FixRow({ bad, good }: { bad: string; good: string }) {
  const row = (mark: string, color: string, text: string) => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <span style={{ color, fontWeight: 700, flexShrink: 0, fontFamily: 'var(--font-mono)' }}>{mark}</span>
      <code
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          color: 'var(--fg-muted)',
          whiteSpace: 'pre-wrap',
          lineHeight: 1.5,
        }}
      >
        {text}
      </code>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {row('✗', 'var(--fg-faint)', bad)}
      {row('✓', 'var(--primary)', good)}
    </div>
  );
}
