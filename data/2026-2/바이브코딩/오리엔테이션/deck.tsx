/// <reference types="vite/client" />
import { type ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';
import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import Build from '../../../../src/deck/Build';
import { Scene, useSceneTime, interpolate } from '../../../../src/scene';
import { AppWindow, Pointer, typed, typedDoneAt, clickFlash } from '../../../../src/walkthrough';
import plan from './plan.md?raw';
import './deck.css';

const COLLAB = 'https://spacekijun.lovable.app/collab/28fa5003-3201-4d6f-aea9-eda51c1f6489';
const NOTE_TITLE = '2026-2 바이브코딩 OT — 해결하고 싶은 문제';
const sections = plan.split(/^## Slide \d+ — /m).slice(1);
const notes = (n: number) => {
  const section = sections[n - 1]?.split(/^## /m)[0] ?? '';
  const start = section.indexOf('**발표자 노트');
  return section.slice(start).replace(/\*\*/g, '').trim();
};

function Link({ children = 'collab 열기 ↗' }: { children?: ReactNode }) {
  return <a className="vo-link" href={COLLAB} target="_blank" rel="noopener noreferrer">{children}</a>;
}

function Page({ n, label, title, children, foot, className = '' }: {
  n: number; label: string; title: ReactNode; children: ReactNode; foot?: ReactNode; className?: string;
}) {
  return <div className={`vo-page ${className}`}>
    <header className="vo-head"><div className="vo-eyebrow">바이브코딩 <span>/</span> {label}</div><h2>{title}</h2></header>
    <main className="vo-main">{children}</main>
    <footer className="vo-foot"><span>{foot ?? '2026-2 · 내가 해결하고 싶은 문제에서 시작하기'}</span><span>{String(n).padStart(2, '0')} / 13</span></footer>
  </div>;
}

function useLessonTime(end: number) {
  const t = useSceneTime();
  const reduced = useReducedMotion();
  return reduced ? end : t;
}

// Scene 3: the problem statement changes as evidence returns from use.
function ProblemCycle() {
  const t = useLessonTime(8);
  const phase = t < 2 ? 0 : t < 4 ? 1 : t < 6 ? 2 : 3;
  const statements = ['학교생활을 편하게 하고 싶다.', '흩어진 준비물 정보를 한 번에 확인하기 어렵다.', '날짜별 준비물 목록을 작게 만든다.', '직접 써 보고, 필요한 정보와 문제를 다시 확인한다.'];
  return <div className="vo-cycle">
    <div className="vo-working-note">
      <span className="vo-label">문제 해결 기록</span>
      <div className="vo-note-rule" />
      <p className="vo-large" key={phase}>{statements[phase]}</p>
      <span className="vo-pencil">{['관심에서 시작', '상황과 불편을 구체화', 'AI와 첫 도구 제작', '관찰한 결과로 수정'][phase]}</span>
    </div>
    <div className="vo-cycle-path">
      <div className="vo-today-bracket"><span>오늘 함께 할 일</span></div>
      {['문제 제시', '문제 분해 · 핵심 문제 발견', 'AI와 제작 · 직접 사용', '확인하고 수정'].map((text, i) => <div key={text} className={`vo-cycle-step ${phase === i ? 'is-current' : ''}`}>
        <span className="vo-step-dot">{i + 1}</span><span>{text}</span>
      </div>)}
      <div className="vo-return" style={{ opacity: interpolate(t, [6, 7], [0, 1]) }}>↶ 발견한 내용을 다음 시도에 반영</div>
    </div>
  </div>;
}

// Scene 6: reduce scope, then compare an input with its output.
function FirstTool() {
  const t = useLessonTime(8);
  const scope = interpolate(t, [2, 3.6], [0, 1]);
  const result = interpolate(t, [4.3, 5.3], [0, 1]);
  return <div className="vo-tool-scene">
    <aside className="vo-scope">
      <span className="vo-label">기능 후보</span>
      <strong>준비물 목록</strong>
      <div style={{ opacity: 1 - scope * .5, transform: `translateY(${scope * 12}px)` }} className="vo-later">
        <p>자동 공지 수집</p><p>알림</p><p>친구 공유</p>
        <span style={{ opacity: scope }} className="vo-label">사용해 보고 나중에 판단</span>
      </div>
    </aside>
    <div className="vo-tool-preview">
      <div className="vo-tool-bar"><span>날짜별 준비물</span><span className="vo-label">첫 도구 · 가상 예시</span></div>
      <div className="vo-input-line"><span><small>과목</small>과학</span><span><small>날짜</small>9월 15일</span><span><small>준비물</small>색연필</span></div>
      <div className="vo-output" style={{ opacity: result, transform: `translateY(${(1 - result) * 12}px)` }}><span className="vo-date">9/15</span><div><strong>과학 수행평가</strong><p>준비물: 색연필</p></div><span className="vo-check" style={{ opacity: interpolate(t, [6, 6.7], [0, 1]) }}>✓</span></div>
      <div className="vo-success" style={{ opacity: interpolate(t, [6.4, 7.2], [0, 1]) }}><span className="vo-label">성공 기준</span><p>원래 공지를 다시 찾지 않고<br />입력한 준비물을 정확히 확인하는가?</p></div>
    </div>
  </div>;
}

// The private app cannot be inspected beyond sign-in. This is explicitly a
// conceptual participation example, not a reconstruction of its private UI.
const WALK = { titleAt: .6, titleDone: typedDoneAt(NOTE_TITLE, .6, 13), openAt: 4.8, commentAt: 5.5, postAt: 10.8, end: 13 };
const COMMENT = '[아이디어] 수행평가 준비물을 찾을 때 여러 공지를 다시 열어야 해서 불편하다.';
function CollabWalk() {
  const t = useLessonTime(WALK.end);
  const reduced = useReducedMotion();
  const student = t >= WALK.openAt;
  const posted = t >= WALK.postAt;
  return <div className="vo-walk">
    <div className="vo-walk-stage">
      <AppWindow kind="browser" url="spacekijun.lovable.app / collab" style={{ inset: 0, boxShadow: 'none' }} bodyStyle={{ padding: '4%', flex: 1 }}>
        <div className="vo-walk-label">참여 절차 예시 · 실제 화면은 다를 수 있음</div>
        <div className="vo-note-title">{typed(t, NOTE_TITLE, WALK.titleAt, 13) || '새 수업 노트'}</div>
        <p className="vo-note-prompt">누가 / 언제 / 무엇 때문에 불편한가?</p>
        <div className="vo-comment-area" style={{ opacity: student ? 1 : .25 }}>
          <span className="vo-label">{posted ? '댓글 목록' : '아이디어 댓글 작성'}</span>
          <p>{student ? typed(t, COMMENT, WALK.commentAt, 13) : '수업용 노트에 생각을 모읍니다.'}</p>
        </div>
        <span data-walk-target className={`vo-mock-action ${posted ? 'is-posted' : ''}`} style={{ boxShadow: `0 0 0 ${clickFlash(t, WALK.postAt) * 12}px color-mix(in srgb, var(--primary) 20%, transparent)` }}>{posted ? '✓ 내 댓글이 목록에 보이는지 확인' : student ? '댓글 게시 · 예시' : '교사가 노트 준비'}</span>
      </AppWindow>
      {!reduced && <Pointer path={[{ t: WALK.postAt - 1.1, x: 87, y: 86 }, { t: WALK.postAt, x: 67, y: 86, click: true, label: '댓글 게시 예시' }, { t: WALK.postAt + 1, x: 67, y: 86, hide: true }]} />}
    </div>
    <aside className="vo-walk-guide">
      <div className={!student ? 'is-current' : ''}><b>교사</b><p>공용 노트 하나 만들기</p></div>
      <div className={student && !posted ? 'is-current' : ''}><b>학생</b><p>해당 노트를 열고<br />아이디어 댓글 작성</p></div>
      <div className={posted ? 'is-current' : ''}><b>확인</b><p>내 댓글이 보이는가?</p></div>
      <Link />
      <small>로그인 화면이 나오면<br />‘구글로 로그인’으로 접속</small>
    </aside>
  </div>;
}

export default function VibeCodingOrientationDeck() {
  return <Deck>
    <Slide full className="vo" nav="내가 겪은 불편" notes={notes(1)}>
      <div className="vo-page vo-cover">
        <div className="vo-eyebrow">2026-2 <span>/</span> 바이브코딩 오리엔테이션</div>
        <main className="vo-cover-body"><div><p className="vo-label">최근에 이런 생각, 해 본 적 있나요?</p><h1>이건 좀<br /><em>편해졌으면.</em></h1><p className="vo-cover-lead">내가 해결하고 싶은 문제에서 시작하기</p></div>
          <aside className="vo-experience"><span className="vo-label">어느 학생의 하루 · 가상 예시</span><div className="vo-mini-notices"><span>과학 공지</span><span>국어 공지</span><span>준비물 안내</span></div><p>“준비물 하나 확인하려고<br />공지를 또 찾았네.”</p></aside>
        </main>
        <footer className="vo-foot"><span>귀찮았던 일 · 헷갈렸던 순간 · 반복했던 작업</span><span>01 / 13</span></footer>
      </div>
    </Slide>

    <Slide full className="vo" nav="바이브코딩의 의미" notes={notes(2)}>
      <Page n={2} label="수업의 관점" title={<>AI와 프로그램을 만들고,<br /><em>문제를 해결한다.</em></>}>
        <Build at={1}><p className="vo-definition">원하는 동작을 말로 설명하고, AI가 만든 프로그램을<br className="vo-wide-only" /> 실행하며 결과를 다듬는 개발 방식 — <b>바이브코딩</b></p></Build>
        <div className="vo-responsibility"><Build at={2}><section className="vo-ai-work"><span className="vo-label">AI에게 도움받는 작업</span><p>코드 생성·수정<br />오류 해결 방안 제안</p></section></Build><Build at={3}><section className="vo-my-work"><span className="vo-label">내가 판단할 것</span><p>무엇을 해결할까?<br />어떻게 요청할까?<br /><b>정말 도움이 되었나?</b></p></section></Build></div>
        <Build at={4}><p className="vo-takeaway">이 수업에서 바이브코딩은 <b>문제 해결의 도구</b>입니다.</p></Build>
      </Page>
    </Slide>

    <Slide full className="vo" nav="문제 해결의 과정" notes={notes(3)}>
      <Page n={3} label="수업 목표" title={<>찾고, 나누고,<br className="vo-mobile-only" /> <em>만들어 확인한다.</em></>} foot="오늘은 문제를 제시하고, 나누고, 핵심 문제 후보를 발견합니다.">
        <Scene duration={8} freezeAt={8} className="vo-scene"><ProblemCycle /></Scene>
      </Page>
    </Slide>

    <Slide full className="vo" nav="큰 문제를 작게 나누기" notes={notes(4)}>
      <Page n={4} label="문제 분해" title={<>“학교생활을 편하게”<br /><em>어디까지 나눌까?</em></>}>
        <div className="vo-breakdown">
          <Build at={1}><div className="vo-topic">학교생활</div></Build>
          <Build at={2}><div className="vo-context"><span>↳</span> 수행평가를 준비할 때</div></Build>
          <Build at={3}><div className="vo-branches"><span>공지 찾기</span><span>마감 확인</span><strong>준비물 확인</strong><span>준비 완료 확인</span></div></Build>
          <Build at={4}><p className="vo-specific">준비물 정보가 여러 공지에 흩어져 있어<br />확인할 때마다 다시 찾는다.</p></Build>
          <Build at={5}><div className="vo-core"><span className="vo-label">핵심 문제 후보</span><p>수행평가를 준비하는 학생이<br /><b>준비물 정보를 한 번에 확인하기 어렵다.</b></p></div></Build>
        </div>
      </Page>
    </Slide>

    <Slide full className="vo" nav="진로와 일상에서 출발" notes={notes(5)}>
      <Page n={5} label="출발점" title={<>진로도 좋고,<br /><em>내게 필요한 도구도 좋다.</em></>} foot="선택 기준: 누가, 언제 불편한지 구체적으로 말할 수 있는가?">
        <div className="vo-examples"><div className="vo-everyday"><span className="vo-label">내 일상에서</span><article><h3>반납 장소를 또 물었다.</h3><p>동아리 물품을 빌린 뒤, 반납할 곳을 찾기 어렵다.</p><span>→ 물품별 반납 장소를 찾는 도구</span></article><article><h3>그 문장, 어느 책이었지?</h3><p>예전에 기록한 문장의 출처를 다시 찾기 어렵다.</p><span>→ 문장과 책을 함께 검색하는 도구</span></article></div><aside className="vo-career"><span className="vo-label">진로·관심사에서</span><h3>교육에 관심이 있다면</h3><p>친구에게 설명할 때,<br />어려워했던 개념을<br />기억하기 어렵다.</p><span>→ 어려웠던 개념을<br />기록하는 도구</span><div className="vo-career-foot">아직 진로가 정해지지<br />않았어도 괜찮습니다.</div></aside></div>
      </Page>
    </Slide>

    <Slide full className="vo" nav="핵심 기능 하나부터" notes={notes(6)}>
      <Page n={6} label="첫 도구" title={<>핵심 문제 하나,<br className="vo-mobile-only" /> <em>작은 기능 하나부터.</em></>} foot="도움이 되지 않았다면 기능을 더 붙이기 전에 문제부터 다시 봅니다.">
        <Scene duration={8} freezeAt={8} className="vo-scene"><FirstTool /></Scene>
      </Page>
    </Slide>

    <Slide full className="vo" nav="직접 해 보고 질문하기" notes={notes(7)}>
      <Page n={7} label="수업 방식" title={<>직접 해 보고,<br /><em>질문하고, 다시 시도합니다.</em></>}>
        <div className="vo-classflow"><div className="vo-student-flow"><span className="vo-label">여러분이 직접</span><p><b>시도·제작</b><span>→</span>막힌 지점 기록<span>→</span><b>질문</b><span>↶</span></p></div><div className="vo-teacher-flow"><span className="vo-label">교사는 곁에서</span><p>필요한 설명과 바이브코딩 팁, 질문에 대한 피드백</p></div></div>
        <div className="vo-invitation"><span>수업 시간은 주로 <b>질문하는 시간</b>입니다.</span><p>수업 밖에서도 언제든 찾아와 질문해도 됩니다.</p></div>
      </Page>
    </Slide>

    <Slide full className="vo" nav="좋은 질문의 재료" notes={notes(8)}>
      <Page n={8} label="질문 연습" title={<>좋은 질문에는<br /><em>내가 해 본 일이 담긴다.</em></>}>
        <div className="vo-question"><div className="vo-question-labels"><span>목표·시도</span><span>기대·실제</span><span>도움 요청</span></div><div className="vo-question-message"><Build at={1}><p>“준비물을 날짜순으로 보려고<br /><b>AI에게 정렬을 요청했어요.</b></p></Build><Build at={2}><p>9월 2일이 먼저 나올 줄 알았는데<br /><b>9월 15일이 먼저 나와요.</b></p></Build><Build at={3}><p>입력과 결과를 <b>함께 봐 주세요.</b>”</p></Build></div></div>
        <Build at={4}><p className="vo-gentle">시작이 막혔다면? “문제를 나눠 봤지만 무엇부터 시도할지 모르겠어요.”도 좋은 질문입니다.</p></Build>
      </Page>
    </Slide>

    <Slide full className="vo" nav="브레인스토밍 안내" notes={notes(9)}>
      <Page n={9} label="활동 안내" title={<>먼저 넓게 내고,<br /><em>그다음 작게 좁힌다.</em></>}>
        <div className="vo-brain-flow"><Build at={1}><div><strong>발산</strong><p>평가를 잠시 미루고<br />여러 불편을 적기</p></div></Build><Build at={2}><div><strong>연결</strong><p>친구 생각에<br />상황과 질문 더하기</p></div></Build><Build at={3}><div><strong>수렴</strong><p>직접 확인할 수 있는<br />작은 문제 고르기</p></div></Build></div>
        <Build at={4}><div className="vo-comment-template"><span className="vo-label">아이디어 하나당 댓글 하나</span><p><b>[아이디어]</b> ___가 ___할 때<br />___ 때문에 불편하다. ___할 수 있으면 좋겠다.</p><small><b>[보완: 아이디어 첫 구절]</b> 이런 상황도 있나요? / ___부터 나눠 보면 어떨까요?</small></div></Build>
      </Page>
    </Slide>

    <Slide full className="vo" nav="collab 참여 절차" notes={notes(10)}>
      <Page n={10} label="참여 방법" title={<>공용 노트 하나에,<br className="vo-mobile-only" /> <em>댓글로 생각을 모읍니다.</em></>}>
        <Scene duration={WALK.end} freezeAt={WALK.end} className="vo-scene"><CollabWalk /></Scene>
      </Page>
    </Slide>

    <Slide full className="vo" nav="브레인스토밍 활동" notes={notes(11)}>
      <Page n={11} label="브레인스토밍" title={<>누가, 언제,<br /><em>어떤 일을 하다가 막히나요?</em></>} foot="오늘 고른 문제는 후보입니다. 직접 시도하면서 바꿀 수 있습니다.">
        <div className="vo-activity"><div className="vo-activity-sheet"><span className="vo-label">마지막에 남길 정리 댓글</span><div className="vo-summary-path"><span>큰 주제</span><i>→</i><span>작은 문제들</span><i>→</i><b>핵심 문제 후보</b></div><div className="vo-summary-fields"><p><span>첫 도구</span>어떤 기능부터 만들까?</p><p><span>확인 방법</span>도움이 됐는지 어떻게 알까?</p><p><span>다음 시도</span>먼저 무엇을 확인할까?</p></div><small>댓글 앞에 <b>[정리]</b>를 붙여 주세요.</small></div><aside className="vo-activity-steps"><ol><li>혼자 떠올리기</li><li>아이디어 댓글 쓰기</li><li>친구 생각 보완하기</li><li>내 문제 좁히기</li></ol><Link>브레인스토밍 참여하기 ↗</Link><small>교사가 안내한 수업용 노트를 엽니다.</small></aside></div>
      </Page>
    </Slide>

    <Slide full className="vo" nav="발견한 변화 공유" notes={notes(12)}>
      <Page n={12} label="오늘의 발견" title={<>처음 생각보다<br /><em>무엇이 구체적이 되었나요?</em></>}>
        <div className="vo-reflection"><Build at={1}><div className="vo-before"><span className="vo-label">처음 주제</span><p>학교생활을<br />편하게.</p></div></Build><div className="vo-after"><Build at={2}><div className="vo-reflection-process">공지 찾기 / 마감 확인 / <b>준비물 확인</b></div></Build><Build at={3}><div><span className="vo-label">핵심 문제 후보 · 예시</span><h3>흩어진 준비물 정보를<br />한 번에 확인하기 어렵다.</h3><p className="vo-next-attempt">다음 시도 → 실제 공지에서 흩어진 정보를 찾아보기</p></div></Build></div></div>
        <p className="vo-takeaway">누구의 어떤 불편이 줄어들까요? <b>다음에는 무엇을 확인할까요?</b></p>
      </Page>
    </Slide>

    <Slide full className="vo" nav="다음 시간 안내" notes={notes(13)}>
      <Page n={13} label="다음 시간" title={<>오늘의 문제를,<br /><em>첫 프로젝트로.</em></>} foot="직접 해 보고, 질문하고, 다시 시도합니다. 질문은 언제든 환영합니다.">
        <div className="vo-closing"><div className="vo-closing-main"><span className="vo-label">오늘 남긴 것</span><p>문제를 찾고<br />작게 나누어 발견한<br /><b>나의 핵심 문제 후보.</b></p><span className="vo-pencil">정리 댓글 + 다음 시도 + 떠오른 질문</span></div><aside className="vo-next-lesson"><span className="vo-label">다음 시간에는 함께</span><ol><li><b>프로그램 설치</b><span>바이브코딩 환경 준비</span></li><li><b>AI 에이전트 사용</b><span>지시하고 결과 확인하기</span></li><li><b>프로젝트 기획 문서 작성</b><span>AI와 문제·기능·확인 방법 구체화</span></li></ol></aside></div>
      </Page>
    </Slide>
  </Deck>;
}
