import { useSceneTime, interpolate } from '../scene';

/* ── KenBurns — 생성 일러스트(NotebookLM 등)를 무대화하는 슬로우 줌·팬 ──
   레거시 재사용의 단위는 페이지가 아니라 자산: 수업 폴더의
   images/slide-NN.png 같은 이미지 파일을 풀블리드 배경으로 깔고
   t(초)의 순수 함수로 느린 줌·팬을 건다 (썸네일 freeze 안전).
   반드시 <Scene> 컨텍스트 안에서 사용. 장마다 flip을 번갈아 주면
   전환감이 산다. 사용 예시: data/dev/테스트 수업 자료/혼합-데모(3쪽). */
export default function KenBurns({
  src,
  flip,
  zoom = [1.02, 1.1],
  pan = 1.1,
  duration = 16,
  alt = '',
}: {
  src: string;
  /** 팬 방향 반전 */
  flip?: boolean;
  /** [시작, 끝] 배율 */
  zoom?: [number, number];
  /** 수평 팬 총량(%) */
  pan?: number;
  /** 줌·팬이 끝 값에 도달하는 시간(초) */
  duration?: number;
  alt?: string;
}) {
  const t = useSceneTime();
  const dir = flip ? -1 : 1;
  const scale = interpolate(t, [0, duration], zoom);
  const x = interpolate(t, [0, duration], [0, pan]) * dir;
  return (
    <img
      src={src}
      alt={alt}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: `scale(${scale}) translateX(${x}%)`,
      }}
    />
  );
}
