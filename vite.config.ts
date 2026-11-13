import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// 로컬 덱 에디터(?app=edit)의 파일 쓰기 API — dev 서버에만 붙는다 (apply: 'serve')
// @ts-ignore — 타입 선언이 없는 .mjs 플러그인
import deckEditorApi from './scripts/deck-editor-api.mjs';

// data/·app/ 등 레거시 정적 자산은 프로젝트 루트에 그대로 있고
// dev 서버가 루트에서 직접 서빙한다. 프로덕션은 vite build 후
// scripts/build-static.mjs 가 dist/로 복사한다 (npm run build).
export default defineConfig({
  plugins: [react(), deckEditorApi()],
  publicDir: false,
  server: {
    watch: {
      // 에이전트 세션 로그·상태 폴더가 계속 바뀌며 전체 리로드를 유발하므로 제외
      ignored: [
        '**/.remember/**',
        '**/.omc/**',
        '**/.claude/**',
        '**/dist/**',
        '**/test/**',
        '**/unpacked-llm/**',
        '**/_pptx_analysis/**',
        // 백업·NotebookLM 스크래치·픽셀 검수 산출물 — 서빙 대상 아님.
        // 다른 프로세스가 생성 중 파일을 잠그면 chokidar가 EBUSY로 죽으므로 제외.
        '**/backup/**',
        '**/_notebooklm_output/**',
        '**/_notebooklm_sources/**',
        '**/_pixel_review/**',
        '**/*.pdf',
        '**/*.pptx',
        // 발표자 영상 완성본(deck-narration-builder) — gitignore, 수백 MB. 생성·재인코딩 중 파일 잠금 → EBUSY
        '**/presenter-media/**',
      ],
    },
  },
});
