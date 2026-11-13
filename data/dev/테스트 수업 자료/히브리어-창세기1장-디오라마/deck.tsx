import { useEffect, type CSSProperties, type ReactNode } from 'react';
import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import Build from '../../../../src/deck/Build';
import { Scene, useSceneTime, interpolate, easeOut, riseIn, spring } from '../../../../src/scene';
import {
  Stage,
  Actor,
  Bubble,
  HandNote,
  LabelChip,
  Stamp,
  WavyUnderline,
  RouteDraw,
  SpeedLines,
  DustPuff,
  FocusVignette,
  pulse,
  ghostIn,
} from '../../../../src/diorama';

/* ── 히브리어로 보는 창세기 1장 — 디오라마판 ─────────────────────────────
   원본 `히브리어-창세기1장-씬`(동적 씬 HTML 11장)의 교육 내용·히브리어 8단어·
   아크를 그대로 계승하고, 표현을 무대·배우·오버레이 3층 문법으로 다시 짠 덱.

   설계는 같은 폴더의 plan.md. 자산은 image-asset-builder로 생성:
     images/stage-01~06.png            (양피지 두루마리·필사실·발굴 트렌치·혼돈의 수면·
                                        정돈된 세계·균열의 저녁 — 하단 1/3은 배우 자리)
     assets/sprites/히브리어-사본/*.png  (필사자 4포즈 · 뱀 · 저울 · 품는 새 · 봉인 도장)

   원칙: 신적 존재는 형상화하지 않는다 — 무대와 빛과 도장이 대신한다.
   히브리어·그리스어는 전부 코드 오버레이(이미지 안 텍스트 금지). ─────────── */

const IMG = 'data/dev/테스트 수업 자료/히브리어-창세기1장-디오라마/images';
const SPR = 'assets/sprites/히브리어-사본';

const SCRIBE = {
  idle: `${SPR}/scribe-idle.png`,
  write: `${SPR}/scribe-write.png`,
  point: `${SPR}/scribe-point.png`,
  wonder: `${SPR}/scribe-wonder.png`,
};
const SERPENT = `${SPR}/serpent.png`;
const SCALE = `${SPR}/scale-balance.png`;
const BIRD = `${SPR}/hover-bird.png`;

/* 크롭 원본 비율 (검수 후 실측값으로 갱신) */
const AR = { scribe: 0.55, serpent: 1.3, scale: 1.0, bird: 1.35 };

const GOLD = '#c9a227';
const LAPIS = '#2f5d8a';
const WINE = '#7b2d2d';
const INK = '#3b2a1c';
const PARCH = '#f0e4cb';

/* ── 히브리어·그리스어 조판 (RTL + 전용 세리프, 첫 사용 시 지연 로드) ── */
const FONT_ID = 'heb-deck-font';
function useAncientFonts() {
  useEffect(() => {
    if (document.getElementById(FONT_ID)) return;
    const l = document.createElement('link');
    l.id = FONT_ID;
    l.rel = 'stylesheet';
    l.href =
      'https://fonts.googleapis.com/css2?family=Noto+Serif+Hebrew:wght@400;600;700&family=Noto+Serif:wght@600;700&display=swap';
    document.head.appendChild(l);
  }, []);
}

function He({ children, size = '2.4rem', color = INK }: { children: ReactNode; size?: string; color?: string }) {
  return (
    <span
      dir="rtl"
      lang="he"
      style={{ fontFamily: '"Noto Serif Hebrew", serif', fontSize: size, fontWeight: 700, color, lineHeight: 1.5 }}
    >
      {children}
    </span>
  );
}

function Gk({ children, size = '2rem', color = INK }: { children: ReactNode; size?: string; color?: string }) {
  return (
    <span lang="grc" style={{ fontFamily: '"Noto Serif", serif', fontSize: size, fontWeight: 700, color }}>
      {children}
    </span>
  );
}

/* 단어 카드 — 히브리어 + 음역 + 뜻. 무대 위에 놓이는 종잇조각 */
function WordCard({
  x,
  y,
  at = 0,
  he,
  ko,
  gloss,
  tone = 'parch',
  size = '2.4rem',
  w,
  struck = false,
  style,
}: {
  x: number;
  y: number;
  at?: number;
  he?: string;
  ko?: string;
  gloss?: string;
  /** parch=양피지 · gold=강조 · dim=회색 처리(쓰이지 않은 것) · dark=어두운 무대용 */
  tone?: 'parch' | 'gold' | 'dim' | 'dark';
  size?: string;
  w?: number;
  struck?: boolean;
  style?: CSSProperties;
}) {
  const t = useSceneTime();
  if (t < at) return null;
  const s = spring(t, at, 0.45);
  const skin =
    tone === 'gold'
      ? { bg: '#fff7e2', border: GOLD, ink: INK }
      : tone === 'dim'
        ? { bg: 'rgba(240,228,203,0.74)', border: 'rgba(59,42,28,0.4)', ink: 'rgba(59,42,28,0.72)' }
        : tone === 'dark'
          ? { bg: 'rgba(20,26,40,0.82)', border: 'rgba(201,162,39,0.5)', ink: '#f2e9d6' }
          : { bg: PARCH, border: 'rgba(59,42,28,0.45)', ink: INK };
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: w ? `${w}%` : undefined,
        transform: `translate(-50%, -50%) scale(${0.86 + 0.14 * s})`,
        opacity: Math.min(1, s * 1.7),
        background: skin.bg,
        border: `2px solid ${skin.border}`,
        borderRadius: 10,
        padding: '10px 18px',
        textAlign: 'center',
        boxShadow: '0 8px 20px rgba(20,12,4,0.28)',
        zIndex: 8,
        ...style,
      }}
    >
      {he && (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <He size={size} color={skin.ink}>
            {he}
          </He>
          {struck && (
            <span
              aria-hidden
              style={{
                position: 'absolute',
                left: '-6%',
                right: '-6%',
                top: '52%',
                height: 3,
                background: WINE,
                transform: 'rotate(-4deg)',
              }}
            />
          )}
        </div>
      )}
      {ko && (
        <div style={{ color: skin.ink, fontSize: '1rem', fontWeight: 700, marginTop: he ? 2 : 0, opacity: 0.9 }}>
          {ko}
        </div>
      )}
      {gloss && (
        <div style={{ color: skin.ink, fontSize: '0.92rem', opacity: 0.72, marginTop: 2, wordBreak: 'keep-all' }}>
          {gloss}
        </div>
      )}
    </div>
  );
}

/* 무대 위 텍스트 밴드 — 어두운 zone에만 놓는다 */
function Band({
  children,
  side = 'left',
  bottom = 10,
  top,
  width = 42,
  at = 0,
}: {
  children: ReactNode;
  side?: 'left' | 'right' | 'center';
  bottom?: number;
  /** 주면 bottom 대신 상단 기준 — 하단이 배우·소품으로 찬 무대에서 */
  top?: number;
  width?: number;
  at?: number;
}) {
  const t = useSceneTime();
  const pos: CSSProperties =
    side === 'center'
      ? { left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }
      : side === 'left'
        ? { left: '5%' }
        : { right: '5%', textAlign: 'right' };
  return (
    <div
      style={{
        position: 'absolute',
        ...(top === undefined ? { bottom: `${bottom}%` } : { top: `${top}%` }),
        width: `${width}%`,
        zIndex: 12,
        ...pos,
        ...ghostIn(t, at, 0.7),
      }}
    >
      {children}
    </div>
  );
}

/* ── 1 — 훅: 세 번역이 가리키는 단 하나의 원문 (spine · S11) ── */
function HookScene() {
  const t = useSceneTime();
  const HIT = 3.6;
  return (
    <Stage src={`${IMG}/stage-01.png`}>
      <WordCard x={22} y={22} at={0.6} ko="개역개정" gloss="태초에" tone="parch" />
      <WordCard x={50} y={17} at={0.9} ko="새번역" gloss="한처음에" tone="parch" />
      <WordCard x={78} y={22} at={1.2} ko="KJV" gloss="In the beginning" tone="parch" />

      <RouteDraw points={[[22, 28], [50, 44]]} at={1.8} dur={0.8} color={LAPIS} width={3} />
      <RouteDraw points={[[50, 24], [50, 44]]} at={2.1} dur={0.8} color={LAPIS} width={3} />
      <RouteDraw points={[[78, 28], [50, 44]]} at={2.4} dur={0.8} color={LAPIS} width={3} />

      <Stamp x={50} y={48} at={HIT} rotate={-3} color={WINE} scale={pulse(t, HIT + 0.3)}>
        <He size="2.2rem" color={WINE}>
          בְּרֵאשִׁית
        </He>
        <div style={{ fontSize: '0.95rem', letterSpacing: '0.04em' }}>베레쉬트 · 태초에</div>
      </Stamp>
      <SpeedLines x={50} y={48} at={HIT} size={20} count={12} color="rgba(201,162,39,0.95)" />

      <Actor src={SCRIBE.idle} x={88} ground={96} h={30} enter={{ at: 0.3, style: 'ghost' }} bob={{ amp: 0.8, period: 3 }} />

      <Band side="left" bottom={11} width={44} at={0.15}>
        <div className="kicker" style={{ color: GOLD, ...riseIn(t, 0.2) }}>
          창세기 1장 · 원문으로 읽기
        </div>
        <h1
          className="headline"
          style={{ margin: '8px 0 6px', color: PARCH, wordBreak: 'keep-all', ...riseIn(t, 0.45) }}
        >
          번역 셋이 가리키는, <span style={{ color: GOLD }}>단 하나의 원문</span>
        </h1>
        <p className="lead" style={{ margin: 0, color: 'rgba(240,228,203,0.78)', wordBreak: 'keep-all', ...riseIn(t, 0.8) }}>
          오늘 읽을 것은 번역이 아니라 그 아래 놓인 히브리어 한 줄이다.
        </p>
      </Band>
    </Stage>
  );
}

/* ── 2 — 발굴: 뿌리에 닿는다 ── */
function RootScene() {
  const t = useSceneTime();
  const ROOT = 4.2;
  return (
    <Stage src={`${IMG}/stage-03.png`}>
      <WordCard x={32} y={21} at={0.8} he="בְּרֵאשִׁית" ko="베레쉬트" gloss="표층 · 태초에" size="2rem" />
      <WordCard x={32} y={38} at={2.0} he="רֵאשִׁית" ko="레쉬트" gloss="중간층 · 시작" size="2rem" />
      <RouteDraw points={[[32, 28], [32, 33]]} at={1.6} dur={0.5} color={GOLD} width={3} />
      <RouteDraw points={[[32, 44], [32, 48]]} at={3.4} dur={0.5} color={GOLD} width={3} />

      <Stamp x={32} y={52} at={ROOT} rotate={-4} color={WINE} scale={pulse(t, ROOT + 0.3)}>
        <He size="2.1rem" color={WINE}>
          רֹאשׁ
        </He>
        <div style={{ fontSize: '0.95rem' }}>로쉬 · 머리</div>
      </Stamp>
      <DustPuff x={32} y={58} at={ROOT} size={9} color="rgba(120,90,60,0.5)" />

      <Actor src={SCRIBE.point} x={76} ground={95} h={38} enter={{ at: 0.3, style: 'ghost' }} flip />
      <HandNote x={74} y={30} at={5.2} rotate={-5} size="2rem" color="#4a2f18">
        이 뿌리, 결말에서 다시 캔다
      </HandNote>

      <Band side="left" bottom={8} width={36} at={0.1}>
        <h2 className="headline" style={{ margin: 0, color: PARCH, wordBreak: 'keep-all', ...riseIn(t, 0.15) }}>
          단어 하나를 <span style={{ color: GOLD }}>파 내려가면</span>
        </h2>
      </Band>
    </Stage>
  );
}

/* ── 3 — 바라: 하나님만 쓰는 동사 ── */
function BaraScene() {
  const t = useSceneTime();
  const SEAL = 3.8;
  return (
    <Stage src={`${IMG}/stage-02.png`} shake={{ at: SEAL, amp: 6 }}>
      <WordCard x={13} y={44} at={0.9} he="עָשָׂה" ko="아사 · 만들다" gloss="사람도 한다" tone="dim" size="1.8rem" struck />
      <WordCard x={13} y={66} at={1.4} he="יָצַר" ko="야차르 · 빚다" gloss="토기장이도 한다" tone="dim" size="1.8rem" struck />

      <WordCard x={44} y={31} at={2.4} he="בָּרָא" ko="바라 · 창조하다" gloss="주어는 언제나 하나님" tone="gold" size="2.6rem" />
      <Stamp x={72} y={30} at={SEAL} rotate={-6} color={WINE} scale={pulse(t, SEAL + 0.3)}>
        CREATOR ONLY
      </Stamp>
      <SpeedLines x={72} y={30} at={SEAL} size={18} count={11} color="rgba(201,162,39,0.9)" />

      <Actor src={SCRIBE.write} x={80} ground={96} h={40} enter={{ at: 0.3, style: 'ghost' }} flip />

      <Band side="center" bottom={13} width={56} at={0.1}>
        <h2 className="headline" style={{ margin: 0, color: PARCH, wordBreak: 'keep-all', ...riseIn(t, 0.15) }}>
          창조의 동사는 <span style={{ color: GOLD }}>따로 있다</span>
        </h2>
      </Band>
    </Stage>
  );
}

/* ── 4 — 같은 무대 펀치인: 복수형 주어 + 단수형 동사 ── */
const PUNCH = 1.45;
function PluralScene() {
  const t = useSceneTime();
  return (
    <Stage src={`${IMG}/stage-02.png`} framing={{ scale: PUNCH, x: 6, y: -4 }} dim={0.14}>
      <Actor src={SCRIBE.wonder} x={22} ground={106} h={56} enter={{ at: 0.2, style: 'ghost' }} bob={{ amp: 0.7, period: 3.2 }} />

      <WordCard x={62} y={26} at={0.9} he="אֱלֹהִים" ko="엘로힘 · 하나님" gloss="문법상 복수형" tone="parch" size="2.6rem" />
      <WordCard x={62} y={52} at={1.6} he="בָּרָא" ko="바라 · 창조하셨다" gloss="문법상 단수형 동사" tone="gold" size="2.6rem" />
      <div style={{ position: 'absolute', left: '48%', top: '62%', width: '30%', zIndex: 9 }}>
        <WavyUnderline x={0} y={0} w={100} at={2.4} dur={0.8} color={GOLD} />
      </div>
      <Bubble x={41} y={40} at={3.0} tail="bl" w={24}>
        여럿이신 한 분?
      </Bubble>

      <Band side="left" top={7} width={32} at={0.1}>
        <h2 className="headline" style={{ margin: 0, color: PARCH, wordBreak: 'keep-all', ...riseIn(t, 0.15) }}>
          문법 자체가 <span style={{ color: GOLD }}>힌트다</span>
        </h2>
        <Build at={1}>
          <p className="lead" style={{ marginTop: 12, color: 'rgba(240,228,203,0.85)', wordBreak: 'keep-all' }}>
            복수형 주어에 단수형 동사. 히브리어 문법이 어색해지는 이 자리에서 성경은 처음부터
            한 분을 여럿으로 말한다.
          </p>
        </Build>
      </Band>
    </Stage>
  );
}

/* ── 5 — 혼돈: 없던 것은 정확히 두 가지 ── */
function ChaosScene() {
  const t = useSceneTime();
  return (
    <Stage src={`${IMG}/stage-04.png`} dim={0.2}>
      <FocusVignette at={0.4} dur={1.2} strength={0.5} />
      <WordCard x={31} y={33} at={1.0} he="תֹהוּ" ko="토후" gloss="형태 없음" size="2.6rem" />
      <WordCard x={67} y={33} at={1.6} he="בֹהוּ" ko="보후" gloss="비어 있음" size="2.6rem" />
      <LabelChip x={50} y={56} at={2.6} color={GOLD}>
        창세기 1:2 — 땅이 혼돈하고 공허하며
      </LabelChip>

      <Actor src={SCRIBE.idle} x={82} ground={90} h={24} enter={{ at: 0.4, style: 'ghost' }} />

      <Band side="left" bottom={12} width={38} at={0.1}>
        <h2 className="headline" style={{ margin: 0, color: PARCH, wordBreak: 'keep-all', ...riseIn(t, 0.15) }}>
          태초의 땅에 <span style={{ color: GOLD }}>없던 두 가지</span>
        </h2>
      </Band>
    </Stage>
  );
}

/* ── 6 — 같은 무대 반전: 품는 새 ── */
function BroodScene() {
  const t = useSceneTime();
  return (
    <Stage src={`${IMG}/stage-04.png`} framing={{ flip: true, scale: 1.15, blur: 2 }} dim={0.28}>
      <Actor
        src={BIRD}
        x={50}
        ground={50}
        h={19}
        enter={{ at: 0.4, style: 'ghost', dur: 0.8 }}
        bob={{ amp: 3.2, period: 1.8 }}
        shadow={false}
      />
      <WordCard x={50} y={20} at={1.6} he="רוּחַ מְרַחֶפֶת" ko="루아흐 메라헤페트" gloss="품다 · 날개 치며 맴돌다" size="2.4rem" />
      <HandNote x={74} y={72} at={3.0} rotate={-4} size="1.9rem" color={GOLD}>
        신명기 32:11 — 같은 단어
      </HandNote>

      <Band side="left" bottom={12} width={40} at={0.1}>
        <h2 className="headline" style={{ margin: 0, color: PARCH, wordBreak: 'keep-all', ...riseIn(t, 0.15) }}>
          혼돈 위에 있던 것은 <span style={{ color: GOLD }}>돌봄</span>이었다
        </h2>
      </Band>
    </Stage>
  );
}

/* ── 7 — 예히 오르: 말과 사건 사이에 틈이 없다 ── */
function LightScene() {
  const t = useSceneTime();
  const FLASH = 2.6;
  return (
    <Stage src={`${IMG}/stage-05.png`} shake={{ at: FLASH, amp: 7 }}>
      <WordCard x={25} y={20} at={0.9} he="יְהִי אוֹר" ko="예히 오르" gloss="빛이 있으라" size="2.3rem" />
      <RouteDraw points={[[34, 20], [66, 20]]} at={2.0} dur={0.5} color={WINE} width={4} />
      <WordCard x={75} y={20} at={FLASH} he="וַיְהִי־אוֹר" ko="바예히 오르" gloss="빛이 있었다" tone="gold" size="2.3rem" />
      <SpeedLines x={75} y={20} at={FLASH} size={22} count={14} color="rgba(201,162,39,0.95)" />
      <HandNote x={50} y={41} at={3.4} rotate={-3} size="1.9rem" color={WINE}>
        도구도, 재료도, 시간차도 없다
      </HandNote>

      <Actor src={SCRIBE.point} x={14} ground={94} h={36} enter={{ at: 0.3, style: 'ghost' }} />

      <Band side="right" bottom={16} width={48} at={0.1}>
        <h2 className="headline" style={{ margin: 0, color: '#2a2213', wordBreak: 'keep-all', ...riseIn(t, 0.15) }}>
          말과 사건 사이에 <span style={{ color: WINE }}>아무 틈이 없다</span>
        </h2>
      </Band>
    </Stage>
  );
}

/* ── 8 — 같은 무대 펀치인: 짓다 → 채우다 대칭 (핵심 주장) ── */
function SymmetryScene() {
  const t = useSceneTime();
  const LAST = 6.2;
  /* 무대의 세 띠가 곧 도표다: 하늘(y≈20) · 바다(y≈55) · 땅(y≈76) */
  const ROWS: { y: number; a: string; b: string }[] = [
    { y: 21, a: '1일 · 빛과 어둠', b: '4일 · 해·달·별' },
    { y: 55, a: '2일 · 하늘과 바다', b: '5일 · 새와 물고기' },
    { y: 76, a: '3일 · 땅과 식물', b: '6일 · 짐승과 사람' },
  ];
  return (
    <Stage src={`${IMG}/stage-05.png`} framing={{ flip: true }} dim={0.1}>
      <LabelChip x={27} y={9} at={0.5} color={LAPIS}>
        짓다 · 토후를 해결
      </LabelChip>
      <LabelChip x={73} y={9} at={0.8} color={WINE}>
        채우다 · 보후를 해결
      </LabelChip>

      {ROWS.map((r, i) => (
        <div key={r.a}>
          {/* 하늘 띠에는 해·달이 그려져 있으므로 첫 줄만 안쪽으로 들여 놓는다 */}
          <WordCard x={i === 0 ? 34 : 27} y={r.y} at={1.2 + i * 0.4} ko={r.a} tone="dark" />
          <WordCard x={i === 0 ? 66 : 73} y={r.y} at={2.6 + i * 0.4} ko={r.b} tone="dark" />
          <RouteDraw
            points={[
              [i === 0 ? 41 : 36, r.y],
              [i === 0 ? 59 : 64, r.y],
            ]}
            at={3.9 + i * 0.3}
            dur={0.5}
            color={GOLD}
            width={3}
          />
        </div>
      ))}

      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Stamp key={i} x={17 + i * 9.5} y={40} at={4.8 + i * 0.16} rotate={i % 2 ? 4 : -4} color={LAPIS} scale={0.78}>
          <He size="1.25rem" color={LAPIS}>
            טוֹב
          </He>
        </Stamp>
      ))}
      <Stamp x={80} y={40} at={LAST} rotate={-5} color={WINE} scale={pulse(t, LAST + 0.3) * 1.02}>
        <He size="1.4rem" color={WINE}>
          טוֹב מְאֹד
        </He>
        <div style={{ fontSize: '0.82rem' }}>토브 메오드 · 심히 좋았더라</div>
      </Stamp>
      <SpeedLines x={80} y={40} at={LAST} size={16} count={12} color="rgba(123,45,45,0.85)" />

      <Band side="center" bottom={11} width={64} at={0.1}>
        <p className="lead" style={{ margin: 0, color: '#22200f', wordBreak: 'keep-all', fontWeight: 700 }}>
          앞 3일이 <b style={{ color: WINE }}>형태</b>를 짓고, 뒤 3일이 그 형태를 <b style={{ color: WINE }}>채운다</b>
        </p>
      </Band>
    </Stage>
  );
}

/* ── 9 — 클로즈업(추상): 흙에서 형상으로 ── */
function AdamScene() {
  const t = useSceneTime();
  return (
    <Stage bg="radial-gradient(ellipse at 32% 52%, #4a3a1f 0%, #1a1409 72%)">
      <FocusVignette at={0.3} dur={1} strength={0.45} />
      <Actor
        src={SCRIBE.wonder}
        x={26}
        ground={96}
        h={62}
        enter={{ at: 0.2, style: 'pop', dur: 0.7 }}
        bob={{ amp: 0.8, period: 2.6 }}
        shadow={false}
      />
      <WordCard x={68} y={25} at={1.0} he="נַעֲשֶׂה אָדָם" ko="나아세 아담" gloss="우리가 사람을 만들자" tone="dark" size="2.4rem" />
      <WordCard x={63} y={49} at={1.8} he="אֲדָמָה → אָדָם" ko="아다마 → 아담" gloss="흙 → 사람" tone="dark" size="2.1rem" />
      <WordCard x={71} y={71} at={2.4} he="צֶלֶם" ko="첼렘" gloss="형상" tone="dark" size="2.1rem" />

      <Band side="right" bottom={82} width={44} at={0.1}>
        <h2 className="headline" style={{ margin: 0, color: PARCH, wordBreak: 'keep-all', ...riseIn(t, 0.2) }}>
          여기서만 <span style={{ color: GOLD }}>명령이 상의로</span> 바뀐다
        </h2>
      </Band>
      <Build at={1}>
        <div
          style={{
            position: 'absolute',
            left: '6%',
            bottom: '9%',
            width: '34%',
            background: 'rgba(20,16,9,0.86)',
            border: `2px solid ${GOLD}`,
            borderRadius: 10,
            padding: '16px 20px',
            zIndex: 14,
          }}
        >
          <p style={{ margin: 0, color: PARCH, fontSize: '1.02rem', lineHeight: 1.6, wordBreak: 'keep-all' }}>
            명령이 아니라 <b style={{ color: GOLD }}>상의</b>, 단수가 아니라 <b style={{ color: GOLD }}>복수</b> —
            3쪽의 <He size="1.05rem" color={GOLD}>אֱלֹהִים</He> 힌트와 여기서 만난다.
          </p>
        </div>
      </Build>
    </Stage>
  );
}

/* ── 10 — 균열: 상처 위에 선포된 전쟁 ── */
function WarScene() {
  const t = useSceneTime();
  const SLAM = 3.6;
  return (
    <Stage src={`${IMG}/stage-06.png`} shake={{ at: SLAM, amp: 8 }}>
      <Actor
        src={SERPENT}
        x={[
          { t: 0, x: 6 },
          { t: 2.6, x: 31 },
        ]}
        ground={88}
        h={17}
        enter={{ at: 0.3, style: 'slide-left' }}
      />
      <Actor src={SCRIBE.idle} x={90} ground={88} h={25} enter={{ at: 0.6, style: 'ghost' }} flip />

      <WordCard x={24} y={28} at={1.6} ko="뱀의 후손" />
      <WordCard x={72} y={28} at={2.0} ko="여자의 후손" />
      <RouteDraw points={[[32, 30], [64, 30]]} at={2.6} dur={0.6} color={WINE} width={3} ghost />

      <Stamp x={50} y={53} at={SLAM} rotate={-5} color={WINE} scale={pulse(t, SLAM + 0.3)}>
        <He size="2.1rem" color={WINE}>
          אֵיבָה
        </He>
        <div style={{ fontSize: '0.95rem' }}>에이바 · 원수 됨</div>
      </Stamp>
      <DustPuff x={50} y={59} at={SLAM} size={13} color="rgba(150,100,70,0.6)" />
      <LabelChip x={50} y={70} at={4.6} color={GOLD}>
        창세기 3:15 — 심판 한가운데 놓인 첫 약속
      </LabelChip>

      <Band side="left" top={8} width={38} at={0.1}>
        <h2 className="headline" style={{ margin: 0, color: '#fff3dd', wordBreak: 'keep-all', ...riseIn(t, 0.15) }}>
          사람이 숨은 <span style={{ color: '#ffd66b' }}>그 상처 위에</span>
        </h2>
      </Band>
    </Stage>
  );
}

/* ── 11 — 척추 회귀: 저울과 판결 봉인 (S12) ── */
function VerdictScene() {
  const t = useSceneTime();
  const SEAL = 5.0;
  return (
    <Stage src={`${IMG}/stage-01.png`} dim={0.06}>
      <Actor src={SCALE} x={50} ground={58} h={26} enter={{ at: 0.4, style: 'drop' }} shadow={false} />
      <WordCard x={26} y={34} at={1.4} he="עָקֵב" ko="아케브" gloss="발꿈치 상처" size="2rem" />
      <WordCard x={74} y={28} at={2.0} he="רֹאשׁ" ko="로쉬" gloss="머리 — 2쪽의 그 뿌리" tone="gold" size="2rem" />

      <RouteDraw points={[[74, 34], [50, 48]]} at={2.8} dur={0.7} color={GOLD} width={3} />
      <RouteDraw points={[[26, 40], [50, 48]]} at={3.1} dur={0.7} color="rgba(123,45,45,0.7)" width={3} ghost />

      <Stamp x={50} y={66} at={SEAL} rotate={-4} color={WINE} scale={pulse(t, SEAL + 0.3)}>
        <Gk size="1.6rem" color={WINE}>
          τετέλεσται
        </Gk>
        <div style={{ fontSize: '0.95rem' }}>테텔레스타이 · 다 이루었다</div>
      </Stamp>
      <SpeedLines x={50} y={66} at={SEAL} size={22} count={14} color="rgba(201,162,39,0.95)" />

      <div style={{ position: 'absolute', left: '9%', top: '4%', zIndex: 8, ...ghostIn(t, 6.0, 0.8) }}>
        <He size="1.5rem" color={GOLD}>
          בְּרֵאשִׁית
        </He>
        <div style={{ color: 'rgba(240,228,203,0.75)', fontSize: '0.9rem' }}>창세기 1:1</div>
      </div>
      <div style={{ position: 'absolute', right: '9%', top: '4%', zIndex: 8, textAlign: 'right', ...ghostIn(t, 6.3, 0.8) }}>
        <Gk size="1.4rem" color={GOLD}>
          ἐν ἀρχῇ
        </Gk>
        <div style={{ color: 'rgba(240,228,203,0.75)', fontSize: '0.9rem' }}>요한복음 1:1 — 같은 말</div>
      </div>

      <Actor src={SCRIBE.idle} x={11} ground={96} h={28} enter={{ at: 0.3, style: 'ghost' }} />

      <Band side="center" bottom={12} width={72} at={6.6}>
        <p className="lead" style={{ margin: 0, color: PARCH, wordBreak: 'keep-all', fontSize: '1.15rem' }}>
          발꿈치와 머리의 값은 같지 않다 — 태초의 그 <b style={{ color: GOLD }}>머리</b>가 결말에서 다시 나온다.
        </p>
      </Band>
    </Stage>
  );
}

export default function HebrewGenesisDioramaDeck() {
  useAncientFonts();
  return (
    <Deck>
      <Slide full nav="훅 · 세 번역" notes="번역 셋이 한 점으로 수렴한다. 오늘 읽을 것은 번역이 아니라 원문 한 줄.">
        <Scene freezeAt={5}>
          <HookScene />
        </Scene>
      </Slide>
      <Slide full nav="발굴 · 뿌리" notes="표층에서 뿌리까지 파 내려간다. 이 רֹאשׁ를 11쪽에서 다시 캔다.">
        <Scene freezeAt={6}>
          <RootScene />
        </Scene>
      </Slide>
      <Slide full nav="바라" notes="아사·야차르는 사람도 하지만 바라의 주어는 언제나 하나님. 도장이 그 사실을 각인한다.">
        <Scene freezeAt={5}>
          <BaraScene />
        </Scene>
      </Slide>
      <Slide full nav="복수와 단수" notes="같은 무대 펀치인. 복수형 주어 + 단수형 동사. 정리는 클릭으로.">
        <Scene freezeAt={4}>
          <PluralScene />
        </Scene>
      </Slide>
      <Slide full nav="토후·보후" notes="없던 것은 정확히 두 가지. 어두운 수면 위 빈 칩 두 개로 정량화한다.">
        <Scene freezeAt={3.6}>
          <ChaosScene />
        </Scene>
      </Slide>
      <Slide full nav="품는 새" notes="같은 무대 반전. 무관심이 아니라 알을 품는 새처럼 맴도는 돌봄.">
        <Scene freezeAt={4}>
          <BroodScene />
        </Scene>
      </Slide>
      <Slide full nav="예히 오르" notes="명령과 결과 사이에 아무것도 없다. 빛이 터지는 순간 무대가 흔들린다.">
        <Scene freezeAt={4.4}>
          <LightScene />
        </Scene>
      </Slide>
      <Slide full nav="짓다 → 채우다" notes="이 덱의 핵심 주장. 앞 3일과 뒤 3일이 정확히 짝을 이루고, 좋다는 도장이 일곱 번 찍힌다.">
        <Scene freezeAt={7}>
          <SymmetryScene />
        </Scene>
      </Slide>
      <Slide full nav="사람" notes="흙에서 형상으로. 사람 앞에서만 명령이 상의로 바뀐다 — 클릭으로 3쪽과 연결.">
        <Scene freezeAt={3.4}>
          <AdamScene />
        </Scene>
      </Slide>
      <Slide full nav="균열 · 전쟁" notes="사람이 숨은 상처 위에 원수 됨이 선포된다. 도장이 균열에 꽂힌다.">
        <Scene freezeAt={5.2}>
          <WarScene />
        </Scene>
      </Slide>
      <Slide full nav="저울 · 판결" notes="발꿈치와 머리의 값은 다르다. 봉인이 찍히고 첫 장의 뿌리가 다시 나온다.">
        <Scene freezeAt={7.4}>
          <VerdictScene />
        </Scene>
      </Slide>
    </Deck>
  );
}
