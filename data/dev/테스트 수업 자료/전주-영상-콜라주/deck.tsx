import Deck from '../../../../src/deck/Deck';
import Slide from '../../../../src/deck/Slide';
import { StepVideo } from '../../../../src/components/SceneVideo';

/* ── 전주, 오려 붙인 도시 — vox 콜라주 "형식의" 정보 영상 덱 ──────────────
   페이지 자체가 영상이다. 각 페이지는 OpenMontage remotion-composer에
   저작한 vox 콜라주 문법 컴포지션(JeonjuVox.tsx — 종이 조각·타이포 칩·
   화살표 흐름·잉크 주석·카메라)을 렌더한 13.5초 영상 1편이고,
   3개 장면(4.5s×3)으로 구성된다.

   진행: 장면 1은 페이지 진입과 함께 자동 재생(StepVideo auto),
   클릭(Space/→)이 다음 장면을 재생하고 장면 경계 한 프레임 앞
   (4.4 / 8.9 / 13.4s)에서 멈춘다 — 어느 경계든 정돈된 콜라주 한 장.

   재렌더: OpenMontage/remotion-composer에서
   npx remotion render src/index.tsx JeonjuCity|JeonjuTenMillion|JeonjuCulture */

const MEDIA = 'data/dev/테스트 수업 자료/전주-영상-콜라주/media';
const SEGS = [4.4, 8.9, 13.4];
const PAPER = '#f3ece0';

function FilmPage({
  src,
  poster,
}: {
  src: string;
  poster: string;
}) {
  // 스텝은 한 영상 안에서 자연스럽게 진행되는 단계 — 별도 UI로 표시하지 않는다.
  // 다른 영상이 필요하면 다른 페이지다.
  return (
    <div style={{ position: 'absolute', inset: 0, background: PAPER }}>
      {/* contain + 종이색 배경 — 영상 배경과 같은 색이라 어떤 화면비에서도
          잘림 없이 이어져 보인다 (cover는 창이 16:9가 아닐 때 좌우를 자른다) */}
      <StepVideo
        src={src}
        poster={poster}
        segments={SEGS}
        auto
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
  );
}

export default function JeonjuVoxDeck() {
  return (
    <Deck>
      <Slide
        full
        nav="전주라는 도시"
        notes="1편: 전주 全州 타이틀(자동 재생) → 클릭: 천 년의 이력(900 후백제 → 1392 조선 → 경기전) → 클릭: 오늘(인구 약 64만). vox 콜라주 형식의 영상 — 페이지 전체가 영상이다."
      >
        <FilmPage src={`${MEDIA}/city.mp4`} poster={`${MEDIA}/city.jpg`} />
      </Slide>
      <Slide
        full
        nav="천만의 마을"
        notes="2편: 연 1,000만 방문객(자동) → 클릭: 한옥 700여 채(종이 지붕 실루엣) → 클릭: 걸어서 닿는 세 곳(경기전·전동성당·오목대)."
      >
        <FilmPage src={`${MEDIA}/tenmillion.mp4`} poster={`${MEDIA}/tenmillion.jpg`} />
      </Slide>
      <Slide
        full
        nav="맛·소리·종이"
        notes="3편: 맛 — 비빔밥·유네스코 음식창의도시(자동) → 클릭: 소리 — 판소리·대사습놀이 → 클릭: 종이 — 전주한지, 마지막 프레임에 세 키워드가 함께 남는다."
      >
        <FilmPage src={`${MEDIA}/culture.mp4`} poster={`${MEDIA}/culture.jpg`} />
      </Slide>
    </Deck>
  );
}
