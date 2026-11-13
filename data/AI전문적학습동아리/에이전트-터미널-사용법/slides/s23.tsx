import Build from '../../../../src/deck/Build';
import { useDeck } from '../../../../src/deck/DeckContext';
import { C, Head, BuildSubs, Chip, type SlideMeta } from '../kit';
import { Crop, NAT } from './_d';

/* 23 — build: 안전하게 쓰는 다섯 가지
   메타포: 방패 — 왼쪽 큰 방패 안에 수칙 다섯 칸이 한 칸씩 채워지고, 오른쪽에는 그 수칙의 «실화면 증거»가 한 장씩 바뀐다.
   증거는 모두 실제 실행 화면에서 잘라 왔다(패널 A-03·A-05, 터미널 B-01·B-02·B-05). */

const SUBS = [
  '안전하게 쓰는 다섯 가지를 정리합니다.',
  '맡길 폴더를 앞에 띄운 다음에 여세요. 바탕 화면이나 다운로드 폴더에서는 열지 않습니다.',
  '중요한 원본은 복사본 폴더를 만들어 그 안에서 작업하세요.',
  '학생 이름·연락처·성적이 든 파일은 넣지 마세요. 학교 개인정보 지침이 먼저입니다.',
  '권한 확인은 읽고 누르고, 권한 묻지 않기는 잠깐만 켭니다.',
  '결과는 원본과 맞춰 보세요. 에이전트가 만든 것은 초안입니다.',
];
export const meta: SlideMeta = { kind: 'build', subs: SUBS };

const RULES = ['맡길 폴더만 띄우고 연다', '원본은 사본 폴더에서', '개인정보 파일은 넣지 않는다', '권한 확인은 읽고 누른다', '결과는 원본과 맞춰 본다'];

/* 오른쪽 증거 카드 — 실화면 조각 + 한 줄 해설 */
function Evidence({ step }: { step: number }) {
  const cardTitle: Record<number, string> = {
    1: '패널 맨 위 «지금 보던 창»이 곧 에이전트가 일할 폴더입니다',
    2: '에이전트가 «내용은 건드리지 않았습니다»라고 해도, 원본은 따로 두세요',
    3: '이 PC의 에이전트도 «학생별 점수가 있다»며 웹에 올리지 않았습니다',
    4: '무엇을 실행하려는지 읽고 1번을 누릅니다 · 묻지 않기를 켜면 빨갛게 바뀝니다',
    5: '에이전트 스스로 «직접 열어 풀어 보지는 않았다»고 밝혔습니다',
  };
  return (
    <div style={{ position: 'absolute', left: 820, top: 196, width: 1030, height: 720 }}>
      <div style={{ fontSize: 27, fontWeight: 800, color: C.ink, lineHeight: 1.4, wordBreak: 'keep-all', marginBottom: 22 }}>
        <span style={{ color: C.gold, marginRight: 12 }}>{step}</span>{cardTitle[step]}
      </div>
      <div style={{ position: 'relative', height: 600 }}>
        {step === 1 && (
          <>
            <Crop name="A-03-패널-기본" nat={NAT.panel} region={[30, 40, 760, 112]} w={1000} style={{ left: 0, top: 0 }} />
            <Crop name="A-07a-패널-보던창-폴더없음" nat={NAT.panel} region={[40, 424, 728, 98]} w={760} style={{ left: 0, top: 380 }} />
            <Chip tone="warn" style={{ position: 'absolute', left: 0, top: 190, fontSize: 22 }}>바탕 화면을 보다가 누르면 바탕 화면 폴더에서 열립니다</Chip>
            <Chip tone="muted" style={{ position: 'absolute', left: 0, top: 254, fontSize: 21 }}>시스템·프로그램 폴더는 고르지 않지만, 다운로드·바탕 화면은 고릅니다</Chip>
          </>
        )}
        {step === 2 && (
          <>
            <Crop name="B-01-파일정리-완료" nat={NAT.term} region={[20, 784, 790, 36]} w={1000} style={{ left: 0, top: 0 }} />
            <Crop name="B-01-파일정리-완료" nat={NAT.term} region={[20, 92, 900, 360]} w={560} style={{ left: 0, top: 64 }} />
            <Chip tone="gold" style={{ position: 'absolute', left: 600, top: 120, fontSize: 22 }}>파일 15개가 한 번에 옮겨졌습니다</Chip>
            <Chip tone="gold" style={{ position: 'absolute', left: 600, top: 184, fontSize: 22 }}>원본을 복사해 «사본» 폴더에서 시키기</Chip>
          </>
        )}
        {step === 3 && (
          <>
            <Crop name="B-02-설문요약-완료" nat={NAT.term} region={[1155, 754, 725, 34]} w={1000} style={{ left: 0, top: 0 }} />
            <Crop name="B-02-설문요약-완료" nat={NAT.term} region={[20, 784, 360, 34]} w={497} style={{ left: 0, top: 50 }} />
            <Chip tone="warn" style={{ position: 'absolute', left: 0, top: 130, fontSize: 22 }}>에이전트가 읽은 내용은 답을 만들려고 AI 회사 서버로 보내집니다</Chip>
            <Chip tone="muted" style={{ position: 'absolute', left: 0, top: 194, fontSize: 21 }}>연습은 «학생01»처럼 가짜 이름으로 바꾼 파일로</Chip>
          </>
        )}
        {step === 4 && (
          <>
            <Crop name="B-01-파일정리-권한확인" nat={NAT.term} region={[14, 846, 830, 150]} w={830} style={{ left: 0, top: 0 }} />
            <Crop name="A-05-패널-권한묻지않기-Claude" nat={NAT.panel} region={[40, 268, 730, 110]} w={830} style={{ left: 0, top: 180 }} />
            <Chip tone="warn" style={{ position: 'absolute', left: 0, top: 326, fontSize: 21 }}>한 번 켜면 다음에 바로 열 때도 켜진 채 — 쓰고 나면 끄기</Chip>
          </>
        )}
        {step === 5 && (
          <>
            <Crop name="B-05-퀴즈웹-완료" nat={NAT.term} region={[20, 754, 890, 34]} w={1000} style={{ left: 0, top: 0 }} />
            <Crop name="R-퀴즈-채점" nat={NAT.term} region={[580, 10, 780, 690]} w={470} style={{ left: 0, top: 70, border: '1px solid rgba(31,27,22,.15)' }} />
            <Chip tone="ok" style={{ position: 'absolute', left: 600, top: 150, fontSize: 22 }}>숫자·정답·날짜는 원본과 맞춰 보고 내보내기</Chip>
            <Chip tone="muted" style={{ position: 'absolute', left: 600, top: 214, fontSize: 20 }}>만든 퀴즈는 직접 풀어 보고 학생에게</Chip>
          </>
        )}
      </div>
    </div>
  );
}

export default function S23() {
  const { clicks, isStatic } = useDeck();
  const step = isStatic ? 5 : Math.min(5, clicks);
  return (
    <>
      <Head chapter="⑥ 안전하게 · 1/4" title="안전하게 쓰는 다섯 가지" />
      {/* 방패 */}
      <svg viewBox="0 0 640 760" width={640} height={760} style={{ position: 'absolute', left: 96, top: 168 }}>
        <path d="M320 18 L604 92 L604 360 C604 560 470 680 320 742 C170 680 36 560 36 360 L36 92 Z" fill="#fff" stroke={C.ink} strokeWidth={4} />
        <path d="M320 18 L604 92 L604 360 C604 560 470 680 320 742 C170 680 36 560 36 360 L36 92 Z" fill="none" stroke={C.gold} strokeWidth={10} opacity={0.18 + 0.16 * Math.min(step, 5)} />
      </svg>
      {RULES.map((r, i) => {
        const on = step >= i + 1;
        const now = step === i + 1;
        const top = 240 + i * 112;
        const inset = i < 3 ? 0 : (i - 2) * 46; // 방패 아래로 갈수록 좁아짐
        return (
          <div key={r} style={{
            position: 'absolute', left: 150 + inset, top, width: 530 - inset * 2, height: 88, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px',
            background: on ? (now ? C.gold : 'color-mix(in srgb, #d9692e 14%, #fff)') : 'rgba(31,27,22,.04)',
            border: `2px ${on ? 'solid' : 'dashed'} ${on ? C.gold : 'rgba(31,27,22,.18)'}`,
            color: now ? '#fff' : on ? C.ink : C.faint, transition: 'background .35s, color .35s',
          }}>
            <span style={{ fontSize: 30, fontWeight: 900, width: 30 }}>{i + 1}</span>
            <span style={{ fontSize: 26, fontWeight: 800, wordBreak: 'keep-all', lineHeight: 1.25 }}>{r}</span>
          </div>
        );
      })}
      {step >= 1 && <Evidence step={step} />}
      {step === 0 && (
        <div style={{ position: 'absolute', left: 820, top: 420, width: 980, fontSize: 32, fontWeight: 700, color: C.muted, lineHeight: 1.5, wordBreak: 'keep-all' }}>
          에이전트는 폴더 안의 파일을 직접 읽고 바꿉니다.<br />그래서 «어디서, 무엇을 맡기는가»가 곧 안전입니다.
        </div>
      )}
      {/* 단계 수 등록용 — 실제 그림은 클릭 수로 그린다 */}
      {[1, 2, 3, 4, 5].map((n) => <Build key={n} at={n} style={{ position: 'absolute', width: 0, height: 0 }}><span /></Build>)}
      <BuildSubs lines={SUBS} />
    </>
  );
}
