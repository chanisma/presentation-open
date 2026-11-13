/* live/archives.json 생성 — 교사 콘솔 '결과 저장 시트' 선택지.
   data/ 아래에서 apps-script.js 가 있는 폴더를 찾아,
     1) 그 폴더의 .js 가 live_session_archive 를 처리하고
     2) 폴더 안 HTML/JS 에서 Apps Script 배포 URL(…/exec)을 찾을 수 있으면
   후보로 등재한다. 과목별 아카이브 스크립트를 추가·변경한 뒤 1회 실행.
   (dev 서버 불필요 — 파일 시스템만 읽는다) */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'data');
const URL_RE = /https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec/g;

// data/ 전체에서 apps-script.js 위치 수집
async function findScriptDirs(dir, out = []) {
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) await findScriptDirs(p, out);
    else if (ent.name === 'apps-script.js') out.push(dir);
  }
  return out;
}

// 폴더 아래 모든 파일 경로 (재귀)
async function listFiles(dir, out = []) {
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) await listFiles(p, out);
    else out.push(p);
  }
  return out;
}

const archives = [];
for (const dir of await findScriptDirs(dataDir)) {
  const rel = relative(dataDir, dir).replaceAll('\\', '/');

  // (1) 이 폴더의 Apps Script 가 라이브 아카이브(source: live_session_archive)를 받는가
  const jsFiles = (await readdir(dir)).filter((n) => n.endsWith('.js'));
  let handles = false;
  for (const n of jsFiles) {
    if ((await readFile(join(dir, n), 'utf8')).includes('live_session_archive')) handles = true;
  }
  if (!handles) {
    console.log(`(건너뜀) ${rel} — live_session_archive 미처리`);
    continue;
  }

  // (2) 폴더 내 HTML/JS 에서 배포 URL 추출 — 가장 많이 쓰인 URL 채택
  const counts = new Map();
  for (const f of await listFiles(dir)) {
    if (!/\.(html|js)$/.test(f)) continue;
    for (const m of (await readFile(f, 'utf8')).match(URL_RE) || []) {
      counts.set(m, (counts.get(m) || 0) + 1);
    }
  }
  const url = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!url) {
    console.log(`(건너뜀) ${rel} — 배포 URL 미발견 (활동지 HTML에 …/exec URL 필요)`);
    continue;
  }

  // 라벨: "<과목> (<그룹>)" — data/<그룹>/<과목> 이 아니면 경로 그대로
  const parts = rel.split('/');
  const label = parts.length >= 2
    ? `${parts.slice(1).join('/')} (${parts[0]})`
    : parts[0];
  archives.push({ label, dir: `data/${rel}/`, url });
  console.log(`등재: ${label} → …${url.slice(-24)}`);
}

archives.sort((a, b) => a.dir.localeCompare(b.dir, 'ko'));
const outPath = join(root, 'live', 'archives.json');
await mkdir(dirname(outPath), { recursive: true });
await writeFile(outPath, JSON.stringify({ archives }, null, 2) + '\n', 'utf8');
console.log(`\nlive/archives.json — 아카이브 ${archives.length}건 기록`);
