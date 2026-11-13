import { Scene, useSceneTime, riseIn } from '../../../../src/scene';
import { C, Head, SceneSubs, Monitor, Desktop, Glyph, LOOK, QR, Mark, LinkOut, type SlideMeta, type Sub, type Look } from '../kit';
import { STAGE1 } from './s01';

/* 30 — static: 한눈 정리
   구도: 1장의 무대(모니터 한 대, 같은 자리·크기)를 거울상으로 다시 쓴다 — 1장에서 타일이 떨어지던 독 자리에
   네 단계 요약 카드가 놓이고, 모니터 오른쪽 바깥에 실제로 찍히는 «세팅 만들기» QR과 클릭 링크.
   그림은 정지(진입 때 카드만 한 번 떠오름), 자막만 시간에 따라 바뀐다. */

const DUR = 18;
export const meta: SlideMeta = { kind: 'scene', dur: DUR };

const SUBS: Sub[] = [
  { at: 0, text: '정리하면, 세팅은 스페이스기전 «교실 기기»에서 반마다 한 번만 만듭니다.' },
  { at: 4.5, text: '수업마다 QR을 찍어 펼치고, 독에서 눌러 열고, 끝나면 버튼 한 번으로 정리합니다.' },
  { at: 9.5, text: '고친 파일은 드라이브에, 로그인은 잠가서, 복사한 파일만 교실에 남습니다.' },
  { at: 13.5, text: '오른쪽 QR로 지금 바로 첫 세팅을 만들어 보세요.' },
];

const URL = 'https://spacekijun.lovable.app/classroom';
const QR_SRC = 'data/정보화부/스페이스기전-교실-사용법/media/qr-classroom.png';

const CARDS: { step: string; title: string; look: Look; lines: string[]; tone: string }[] = [
  { step: '준비', title: '한 번만', look: LOOK.space, tone: C.primary, lines: ['[도구] → 교실 기기', '반마다 세팅 하나', '다른 반은 복제'] },
  { step: '시작', title: 'QR 한 번', look: { text: 'QR', tone: 'slate' }, tone: '#0f766e', lines: ['휴대폰으로 QR 찍기', '기기 이름 확인', '이 기기에 펼치기'] },
  { step: '수업 중', title: '독에서 열기', look: LOOK.mydrive, tone: '#1d4ed8', lines: ['저장하면 드라이브로', '남길 것은 컴퓨터로 복사', '비밀번호는 휴대폰으로'] },
  { step: '끝', title: '버튼 한 번', look: { text: '끝', tone: 'red' }, tone: C.danger, lines: ['시간 · [수업 끝] · 휴대폰', '로그인은 잠가 보관', '나머지는 모두 지움'] },
];

function Stage() {
  const t = useSceneTime();
  const M = STAGE1;
  return (
    <>
      <Head chapter="마치며" title="준비는 한 번, 수업은 QR 한 번" />

      <Monitor x={M.x} y={M.y} w={M.w} h={M.h}>
        <Desktop style={{ inset: 0 }}>
          {/* 위쪽 — 다음 수업을 기다리는 교실 PC */}
          <div style={{ position: 'absolute', left: 48, top: 44, color: '#fff' }}>
            <div style={{ fontSize: 22, fontWeight: 600, opacity: 0.75 }}>2-3 교실 · 다음 수업도</div>
            <div style={{ fontSize: 50, fontWeight: 850, letterSpacing: -1.5, marginTop: 6 }}>QR 한 번이면 됩니다</div>
          </div>
          <div style={{ position: 'absolute', right: 30, top: 34, width: 340, height: 124, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', boxShadow: '0 10px 30px rgba(0,0,0,.25)' }}>
            <QR size={96} seed={30} style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: 2 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: C.muted }}><Mark size={18} />스페이스기전 교실</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 3 }}>2-3 교실</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>휴대폰으로 찍어 연결 · 2:47</div>
              <span style={{ display: 'inline-block', marginTop: 6, border: `1px solid ${C.line}`, borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 600, color: C.primary }}>QR 크게 보기</span>
            </div>
          </div>
          {/* 아래쪽 — 1장의 독 자리 = 네 단계 요약 */}
          <div style={{ position: 'absolute', left: 30, right: 30, bottom: 62, height: 290, borderRadius: 20, background: C.shelf, boxShadow: '0 18px 40px -18px rgba(15,23,42,.5)', display: 'flex', gap: 14, padding: 16 }}>
            {CARDS.map((c, i) => (
              <div key={c.step} style={{ flex: 1, borderRadius: 16, background: '#fff', border: `1.5px solid ${C.line}`, borderTop: `6px solid ${c.tone}`, padding: '18px 20px', ...riseIn(t, 0.2 + i * 0.18, 0.7) }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Glyph look={c.look} size={52} />
                  <div style={{ lineHeight: 1.2 }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: c.tone }}>{i + 1}. {c.step}</div>
                    <div style={{ fontSize: 26, fontWeight: 850, letterSpacing: -0.8 }}>{c.title}</div>
                  </div>
                </div>
                <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {c.lines.map((l) => (
                    <div key={l} style={{ fontSize: 19, lineHeight: 1.35, display: 'flex', gap: 8, wordBreak: 'keep-all' }}><span style={{ color: c.tone, fontWeight: 800 }}>·</span>{l}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Desktop>
      </Monitor>

      {/* 모니터 오른쪽 바깥 — 실제로 찍히는 세팅 만들기 QR + 클릭 링크 */}
      <div style={{ position: 'absolute', left: 1606, top: 300, width: 280, textAlign: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: 16, border: `1.5px solid ${C.line}`, boxShadow: '0 20px 50px -28px rgba(15,23,42,.4)' }}>
          <img src={QR_SRC} alt="세팅 만들기 QR — spacekijun.lovable.app/classroom" style={{ display: 'block', width: 248, height: 248 }} />
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 10 }}>세팅 만들기</div>
          <div style={{ fontSize: 15, color: C.muted, marginTop: 2 }}>[도구] → 교실 기기</div>
        </div>
        <div style={{ marginTop: 16, fontSize: 15, whiteSpace: 'nowrap' }}>
          <LinkOut href={URL}>spacekijun.lovable.app/classroom</LinkOut>
        </div>
      </div>

      <SceneSubs items={SUBS} credit="스페이스기전 교실 · 정보화부" />
    </>
  );
}

export default function S30() {
  return (
    <Scene duration={DUR}>
      <Stage />
    </Scene>
  );
}
