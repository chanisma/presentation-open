import Build from '../../../../src/deck/Build';
import { useDeck } from '../../../../src/deck/DeckContext';
import { Head, BuildSubs, QR, LOOK, Glyph, Chip, type SlideMeta } from '../kit';
import { GtWindow, TopBar, G, TOP_H, BOT_Y } from './_gtools';

/* 25 — build: 구글 수업 도구 ③ 설문지
   구도: 왼쪽 2/3 응답 화면(보라) — 단계마다 응답 수가 3 → 7 → 12로 늘며 차트가 자란다(빌드 단계마다 고정 값).
   오른쪽 1/3 «설문지 보내기» 큰 QR. 문구는 reference/pc-16b·16d 캡처와 gtools.js 원문. 응답 내용은 가상. */

const SUBS = [
    '설문지도 로그인 없이 씁니다. 아래 줄의 [설문지]에서 설문을 고르세요.',
    '[보내기]를 누르면 큰 QR이 뜹니다. 학생이 휴대폰으로 찍어 답합니다.',
    '응답은 15초마다 새로 모여 차트로 그려집니다. 객관식은 원형, 체크박스는 막대로 보입니다.',
    '글로 쓴 답은 최근 30개까지 카드로 보입니다. 수업 중 바로 함께 읽어 보세요.',
];
export const meta: SlideMeta = { kind: 'build', subs: SUBS };

/* 단계별 응답 (잘 됐다 · 보통이다 · 어려웠다) */
const STEPS: [number, number, number][] = [[2, 1, 0], [4, 2, 1], [7, 3, 2], [7, 3, 2]];
const PIE = ['#4285f4', '#db4437', '#f4b400'];
const LABELS = ['잘 됐다', '보통이다', '어려웠다'];

function Pie({ v, r = 112 }: { v: number[]; r?: number }) {
  const total = v.reduce((a, b) => a + b, 0) || 1;
  let a0 = -Math.PI / 2;
  return (
    <svg width={r * 2} height={r * 2} viewBox={`${-r} ${-r} ${r * 2} ${r * 2}`}>
      {v.map((n, i) => {
        if (!n) return null;
        const a1 = a0 + (n / total) * Math.PI * 2;
        const large = a1 - a0 > Math.PI ? 1 : 0;
        const d = n === total
          ? `M0 ${-r} A${r} ${r} 0 1 1 -0.01 ${-r} Z`
          : `M0 0 L${r * Math.cos(a0)} ${r * Math.sin(a0)} A${r} ${r} 0 ${large} 1 ${r * Math.cos(a1)} ${r * Math.sin(a1)} Z`;
        const mid = (a0 + a1) / 2;
        const el = (
          <g key={i}>
            <path d={d} fill={PIE[i]} stroke="#fff" strokeWidth={2} />
            <text x={r * 0.6 * Math.cos(mid)} y={r * 0.6 * Math.sin(mid) + 6} textAnchor="middle" fontSize={17} fill="#fff" fontWeight={600}>{((n / total) * 100).toFixed(1)}%</text>
          </g>
        );
        a0 = a1;
        return el;
      })}
    </svg>
  );
}

const card = { background: '#fff', border: `1px solid ${G.line}`, borderRadius: 10, padding: '22px 28px', marginBottom: 16 };

function Responses({ step }: { step: number }) {
  const v = STEPS[step];
  const n = v[0] + v[1] + v[2];
  const scrolled = step >= 3;
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <TopBar look={LOOK.forms} title="3주차 수업 돌아보기" tabs={['질문', `응답 ${n}`]} activeTab={1} accent={G.purple}
        right={<span style={{ height: 46, padding: '0 26px', borderRadius: 6, background: G.purple, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 18, boxShadow: step === 1 ? '0 0 0 6px rgba(103,58,183,.3)' : undefined }}>보내기</span>} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: TOP_H, height: BOT_Y - TOP_H, background: '#ede7f6', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 200, width: 880, top: 16, transform: `translateY(${scrolled ? -455 : 0}px)`, transition: 'transform .8s cubic-bezier(.2,.8,.2,1)' }}>
          <div style={{ ...card, display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 36 }}>응답 {n}개</div>
              <div style={{ fontSize: 16, color: '#188038', marginTop: 8 }}>● 응답을 받는 중 · 15초마다 새로 고침</div>
            </div>
            <QR size={104} seed={25} fg="#111" style={{ border: `1px solid ${G.line}`, borderRadius: 8 }} />
          </div>
          <div style={card}>
            <div style={{ fontSize: 19 }}>오늘 수업은 이해가 잘 됐나요?</div>
            <div style={{ fontSize: 13, color: G.muted, marginTop: 4 }}>응답 {n}개</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 50, marginTop: 18 }}>
              <Pie v={v} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 18 }}>
                {LABELS.map((l, i) => (
                  <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <i style={{ width: 14, height: 14, borderRadius: '50%', background: PIE[i] }} />{l}<b style={{ fontWeight: 500, color: G.muted, marginLeft: 10 }}>{v[i]}</b>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div style={card}>
            <div style={{ fontSize: 19 }}>어려웠던 부분을 모두 고르세요</div>
            <div style={{ fontSize: 13, color: G.muted, marginTop: 4 }}>응답 15개</div>
            {[['range 쓰기', 4], ['들여쓰기', 4], ['반복 횟수 세기', 3], ['없음', 3]].map(([l, c]) => (
              <div key={l as string} style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, fontSize: 16 }}>
                <span style={{ width: 140, textAlign: 'right' }}>{l}</span>
                <span style={{ height: 26, width: (c as number) * 120, background: '#4285f4' }} />
                <span style={{ color: G.muted }}>{c} ({Math.round(((c as number) / 12) * 100)}%)</span>
              </div>
            ))}
          </div>
          <div style={card}>
            <div style={{ fontSize: 19 }}>한 줄 소감</div>
            <div style={{ fontSize: 13, color: G.muted, marginTop: 4 }}>응답 12개 · 최근 30개까지</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
              {['range(5)가 0부터 시작하는 걸 알았어요', '반복문이 생각보다 쉬웠다', '들여쓰기를 자꾸 틀려요', '모둠 활동이 재밌었어요', '횟수 세는 게 헷갈렸음', '다음 시간에 while도 배우고 싶어요'].map((s) => (
                <div key={s} style={{ background: '#f8f9fa', borderRadius: 8, padding: '12px 14px', fontSize: 16 }}>{s}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function S25() {
  const { clicks, isStatic } = useDeck();
  const step = isStatic ? 3 : Math.min(3, clicks);
  return (
    <>
      <Head chapter="⑥ 구글 · 부록" title="구글 수업 도구 ③ 설문지" />
      <GtWindow x={72} y={176} s={0.86} active="forms" right={['← 설문 목록', '새로고침', '웹으로 열기']}>
        <Responses step={step} />
      </GtWindow>
      {/* 아래 줄 [설문지] 탭 강조(단계 0) */}
      {step === 0 && <span style={{ position: 'absolute', left: 442, top: 805, width: 108, height: 52, borderRadius: 10, border: '4px solid #7e22ce', boxShadow: '0 0 0 6px rgba(126,34,206,.2)' }} />}
      {step === 0 && (
        <div style={{ position: 'absolute', left: 1252, top: 176, width: 600, background: '#fff', borderRadius: 16, boxShadow: '0 30px 70px -30px rgba(15,23,42,.35), 0 0 0 1px rgba(15,23,42,.1)', padding: '26px 30px' }}>
          <div style={{ fontSize: 26, color: G.ink, marginBottom: 18 }}>최근 설문지</div>
          {[['3주차 수업 돌아보기', '오전 09:57 수정', true], ['모둠 편성 설문', '10월 9일 수정', false]].map(([n, w, on]) => (
            <div key={n as string} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px', borderRadius: 12, marginBottom: 10, border: `1.5px solid ${on ? G.purple : G.line}`, background: on ? '#f3effb' : '#fff' }}>
              <Glyph look={LOOK.forms} size={40} />
              <div style={{ lineHeight: 1.35 }}><div style={{ fontSize: 21 }}>{n}</div><div style={{ fontSize: 15, color: G.muted }}>{w}</div></div>
            </div>
          ))}
        </div>
      )}

      <Build at={1} style={{ position: 'absolute', left: 1252, top: 176, width: 600, zIndex: 5 }}>
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 30px 70px -30px rgba(15,23,42,.45), 0 0 0 1px rgba(15,23,42,.1)', padding: '28px 34px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 30, color: G.ink }}>설문지 보내기<span style={{ fontSize: 28, color: G.muted }}>✕</span></div>
          <div style={{ fontSize: 19, color: G.muted, margin: '14px 0 18px' }}>학생 휴대폰 카메라로 찍으면 응답 화면이 열립니다.</div>
          <div style={{ display: 'flex', justifyContent: 'center' }}><QR size={400} seed={31} fg="#111" /></div>
          <div style={{ fontSize: 15, color: G.muted, marginTop: 16, borderBottom: `1px solid ${G.line}`, paddingBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>https://docs.google.com/forms/d/e/…/viewform</div>
        </div>
      </Build>
      <Build at={2} style={{ position: 'absolute', left: 1252, top: 868, zIndex: 6 }}>
        <Chip tone="ok"><Glyph look={LOOK.forms} size={28} />15초마다 응답이 차트로</Chip>
      </Build>
      <Build at={3} style={{ position: 'absolute', left: 1575, top: 868, zIndex: 6 }}>
        <Chip tone="primary">글 답 최근 30개</Chip>
      </Build>
      <BuildSubs lines={SUBS} />
    </>
  );
}
