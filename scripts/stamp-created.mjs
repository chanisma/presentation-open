/* pages.json 각 항목에 created(ISO 생성일)를 기록한다 — 허브 생성순 정렬용.
   판정 기준:
   - 파일 경로 항목(data/…, test/…): git 최초 추가 커밋(--diff-filter=A --follow)의 날짜.
     git에 아직 없는(untracked) 파일은 파일시스템 birthtime.
   - 컴포지트(index.html?composite=<경로>): 매니페스트 deck.json 기준 위와 동일.
   - 네이티브 덱(index.html?deck=<id>): 해당 path 문자열이 pages.json에
     처음 등장한 커밋(-S) 날짜.
   이미 created가 있는 항목은 건드리지 않는다(수동 보정 유지).
   실행: node scripts/stamp-created.mjs  (자료 추가 후 1회 — dev 서버 불필요) */
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const data = JSON.parse(readFileSync('pages.json', 'utf-8'));

function git(args) {
  try {
    return execFileSync('git', args, { encoding: 'utf-8' }).trim();
  } catch {
    return '';
  }
}

/** 파일이 git에 처음 추가된 커밋의 저자 날짜(ISO). 없으면 fs birthtime. */
function fileCreated(file) {
  const log = git(['log', '--follow', '--diff-filter=A', '--format=%aI', '--', file]);
  const lines = log.split('\n').filter(Boolean);
  if (lines.length) return lines[lines.length - 1]; // 가장 오래된 추가 커밋
  try {
    return new Date(statSync(file).birthtimeMs).toISOString();
  } catch {
    return '';
  }
}

/** path 문자열이 pages.json에 처음 등장한 커밋의 저자 날짜(ISO). */
function registeredCreated(path) {
  const log = git(['log', '--reverse', '--format=%aI', '-S', path, '--', 'pages.json']);
  return log.split('\n').filter(Boolean)[0] ?? '';
}

const stats = { stamped: 0, kept: 0, missing: 0 };

for (const subj of data.subjects) {
  for (const p of subj.pages) {
    if (p.created) {
      stats.kept++;
      continue;
    }
    const path = p.path || '';
    const composite = path.match(/\?composite=(.+)$/);
    let created = '';
    if (composite) created = fileCreated(decodeURIComponent(composite[1]));
    else if (path.includes('?deck=')) created = registeredCreated(path);
    else created = fileCreated(path);

    if (created) {
      p.created = created;
      stats.stamped++;
    } else {
      stats.missing++;
      console.log(`  (생성일 미상) ${path}`);
    }
  }
}

writeFileSync('pages.json', JSON.stringify(data, null, 2) + '\n', 'utf-8');
console.log(`완료 — 스탬프 ${stats.stamped} · 기존 유지 ${stats.kept} · 미상 ${stats.missing}`);
