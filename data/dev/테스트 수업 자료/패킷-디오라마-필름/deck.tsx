import { motion, AnimatePresence } from 'framer-motion';
import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import { useDeck } from '../../../../src/deck/DeckContext';
import { StepVideo } from '../../../../src/components/SceneVideo';

/* ── 패킷의 여행 — 디오라마 필름 덱 ──────────────────────────────────
   페이지 = 디오라마 문법(무대·배우·오버레이)으로 렌더한 13.5초 영상 1편.
   OpenMontage remotion-composer의 PacketVox.tsx(무대 지속·프레이밍 컷·
   고스트 입장·포즈 하드컷·말풍선·스탬프·항로 드로잉) 저작.

   jeonju-vox와 같은 step 진행(장면 1 자동, 클릭이 다음 장면)에 더해,
   **영상 위에 페이지 소유의 텍스트 레이어**를 얹는다 — 고정 킥커·제목과
   장면(step)에 동기화되어 갈리는 설명 캡션. 영상 쪽 레이아웃 계약:
   상단 24%는 무대의 하늘/벽 여백이라 텍스트 밴드가 안전하다.

   스텝 UI는 두지 않는다 — 스텝은 한 영상 안에서 자연스럽게 이어지는
   단계이고, 다른 영상이 필요하면 그건 다음 페이지다.

   재렌더: OpenMontage/remotion-composer에서
   npx remotion render src/index.tsx PacketDepart|PacketJourney|PacketArrive */

const MEDIA = 'data/dev/테스트 수업 자료/패킷-디오라마-필름/media';
const SEGS = [4.4, 8.9, 13.4];
const INK = '#0d1120';
const CREAM = '#f4ecdd';
const AMBER = '#f5b544';

function FilmPage({
  src,
  poster,
  kicker,
  title,
  captions,
}: {
  src: string;
  poster: string;
  kicker: string;
  title: string;
  /** 장면별 설명 캡션 — step에 동기화되어 갈린다.
      스텝 자체는 영상 안에서 자연스럽게 진행되는 단계라 별도 UI로 표시하지 않는다. */
  captions: [string, string, string];
}) {
  const { clicks, isStatic } = useDeck();
  const cur = isStatic ? 2 : Math.min(2, clicks);
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: INK,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* 16:9 콘텐츠 박스 — 텍스트 레이어가 영상 좌표계에 정확히 붙는다 */}
      <div
        style={{
          position: 'relative',
          width: 'min(100%, calc(100vh * 16 / 9))',
          aspectRatio: '16 / 9',
        }}
      >
        <StepVideo
          src={src}
          poster={poster}
          segments={SEGS}
          auto
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />

        {/* ── 페이지 텍스트 레이어 (영상 위) — 상단 좌측 밴드 ── */}
        <div
          style={{
            position: 'absolute',
            left: '4.2%',
            top: '5%',
            maxWidth: '58%',
            zIndex: 20,
            pointerEvents: 'none',
            padding: '1.1% 1.6% 1.3%',
            borderRadius: 14,
            background: 'linear-gradient(100deg, rgba(13,17,32,0.72) 0%, rgba(13,17,32,0.42) 70%, rgba(13,17,32,0.08) 100%)',
          }}
        >
          <div
            style={{
              color: AMBER,
              fontWeight: 800,
              fontSize: 'clamp(11px,1.15vw,15px)',
              letterSpacing: '0.14em',
            }}
          >
            {kicker}
          </div>
          <h2
            style={{
              margin: '4px 0 6px',
              color: CREAM,
              fontWeight: 800,
              fontSize: 'clamp(22px,2.5vw,34px)',
              letterSpacing: '-0.01em',
              wordBreak: 'keep-all',
              textShadow: '0 2px 10px rgba(10,14,28,0.6)',
            }}
          >
            {title}
          </h2>
          <AnimatePresence mode="wait">
            <motion.p
              key={cur}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{
                margin: 0,
                color: 'rgba(244,236,221,0.92)',
                fontWeight: 600,
                fontSize: 'clamp(13px,1.5vw,19px)',
                wordBreak: 'keep-all',
                lineHeight: 1.5,
              }}
            >
              {captions[cur]}
            </motion.p>
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}

export default function PacketFilmDeck() {
  return (
    <Deck>
      <Slide
        full
        nav="출발"
        notes="1편: 책상 무대 지속 + 프레이밍 컷. 보내기 → 조각내기(패킷 스탬프) → 주소표(IP 스탬프). 페이지 텍스트 레이어의 캡션이 장면과 함께 갈린다."
      >
        <FilmPage
          src={`${MEDIA}/depart.mp4`}
          poster={`${MEDIA}/depart.jpg`}
          kicker="패킷의 여행 · 1편"
          title="메시지가 짐을 싼다"
          captions={[
            '보내기를 누르는 순간, 작은 배달부가 깨어난다.',
            '긴 메시지는 한 번에 못 간다 — 여러 조각, 패킷으로 나눈다.',
            '조각마다 받는 곳 주소(IP)를 붙인다 — 이제 떠날 준비 끝.',
          ]}
        />
      </Slide>
      <Slide
        full
        nav="여정"
        notes="2편: 갈림길(라우터) → 해저케이블 항로 드로잉+Traveler → 서버 도착. 라우터는 다음 한 걸음만 안다는 것이 이 편의 한 문장."
      >
        <FilmPage
          src={`${MEDIA}/journey.mp4`}
          poster={`${MEDIA}/journey.jpg`}
          kicker="패킷의 여행 · 2편"
          title="바다를 건너는 길"
          captions={[
            '라우터는 전체 지도를 모른다 — 다음 한 걸음만 안다.',
            '대륙 사이를 잇는 건 위성이 아니라 바다 밑 케이블이다.',
            '수많은 관문을 지나, 조각들이 목적지 서버에 닿는다.',
          ]}
        />
      </Slide>
      <Slide
        full
        nav="도착"
        notes="3편: 순서 뒤죽박죽 도착 → TCP 재조립(스탬프) → 지도 회귀·완주. 마지막 프레임에 여정 전체가 남는다."
      >
        <FilmPage
          src={`${MEDIA}/arrive.mp4`}
          poster={`${MEDIA}/arrive.jpg`}
          kicker="패킷의 여행 · 3편"
          title="다시 하나로"
          captions={[
            '서로 다른 길로 온 조각들은 순서가 뒤섞여 도착한다.',
            'TCP가 번호표를 보고 조각을 순서대로 다시 맞춘다.',
            '받는 사람 화면엔 — 처음 그 메시지 그대로.',
          ]}
        />
      </Slide>
    </Deck>
  );
}
