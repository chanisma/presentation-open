/* vite build 후 레거시 정적 자산을 dist/로 복사한다.
   data/·app/ 등은 Vite 모듈 그래프 밖(프로젝트 루트)에 있어 dev 서버는
   그대로 서빙하지만, 프로덕션 번들에는 포함되지 않으므로 여기서 복사한다.
   Netlify publish 디렉토리는 dist. */
import { cp, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

const TARGETS = [
  'data', // 레거시 HTML 덱 + 활동지 전체
  'assets', // 재활용 에셋 라이브러리 (manifest.json + 생성 SVG)
  'live', // 라이브 레이어 전체 (host/join/runtime/vendor + archives.json)
          // 2026-08-22에 app/ 을 여기로 합쳤다 — 구 경로는 _redirects 301로 보존
  'pages.json', // 허브 덱 레지스트리 (런타임 fetch)
  '_redirects', // Netlify 구경로 리다이렉트
  'legacy-hub.html', // 구 허브 (백업 접근용)
  'LICENSE', // 코드 라이선스 (MIT)
  'LICENSE-CONTENT.md', // 수업 자료 라이선스 (CC BY-NC-SA 4.0)
  'THIRD-PARTY-NOTICES.md', // 출처·라이선스 고지 (bolt-slides MIT 전문 포함 — 배포본에도 동행)
];

let copied = 0;
for (const name of TARGETS) {
  const src = join(root, name);
  try {
    await stat(src);
  } catch {
    console.log(`(건너뜀) ${name} — 없음`);
    continue;
  }
  await cp(src, join(dist, name), { recursive: true });
  copied++;
  console.log(`복사됨: ${name}`);
}
console.log(`정적 자산 ${copied}건 복사 완료 → dist/`);
