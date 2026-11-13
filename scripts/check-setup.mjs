/* 작업 환경 점검 — 이 저장소의 스킬들이 필요로 하는 것이 갖춰졌는지 한눈에 본다.
   workspace-setup 스킬이 제일 먼저 실행하는 진단기. 아무것도 고치지 않고 상태만 보고한다.

   실행:  node scripts/check-setup.mjs
          node scripts/check-setup.mjs --net    (배포 도메인·웹앱까지 실제로 두드려 확인)

   비밀값(토큰)은 마스킹해서 출력한다. */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const ROOT = process.cwd();
const NET = process.argv.includes('--net');

const rows = [];
/** ok: true(갖춰짐) · false(빠짐) · null(선택/해당없음) */
function row(ok, label, detail, next) {
  rows.push({ ok, label, detail, next });
}

/** Windows에서 clasp·npm 은 .cmd 셸 스크립트라 셸을 거쳐야 실행된다.
    (인자를 따로 넘기면 Node 가 DEP0190 경고를 내므로 명령 전체를 한 문자열로 준다) */
function sh(command) {
  try {
    return execSync(command, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    return '';
  }
}

/** 터미널 표시 폭 — 한글·CJK 는 2칸을 차지한다. 이걸 안 세면 표가 틀어진다. */
function width(s) {
  let n = 0;
  for (const ch of String(s)) {
    const c = ch.codePointAt(0);
    n +=
      (c >= 0x1100 && c <= 0x115f) ||
      (c >= 0x2e80 && c <= 0xa4cf) ||
      (c >= 0xac00 && c <= 0xd7a3) ||
      (c >= 0xf900 && c <= 0xfaff) ||
      (c >= 0xfe30 && c <= 0xfe6f) ||
      (c >= 0xff00 && c <= 0xff60) ||
      (c >= 0xffe0 && c <= 0xffe6) ||
      (c >= 0x1f300 && c <= 0x1f64f)
        ? 2
        : 1;
  }
  return n;
}

function readJson(p) {
  try {
    return JSON.parse(readFileSync(p, 'utf-8'));
  } catch {
    return null;
  }
}

const mask = (s) => (s ? `${String(s).slice(0, 4)}…${String(s).slice(-4)}` : '');

/* ── 1. 저장소 기본 ─────────────────────────────────────────────────────── */

const major = Number(process.versions.node.split('.')[0]);
row(major >= 18, 'Node.js', `v${process.versions.node}`, 'Node 18 이상이 필요합니다 (fetch 내장).');

row(
  existsSync(join(ROOT, 'node_modules')),
  'npm 의존성',
  existsSync(join(ROOT, 'node_modules')) ? '설치됨' : '없음',
  'npm install'
);

const pages = readJson(join(ROOT, 'pages.json'));
row(
  !!pages,
  'pages.json',
  pages ? `과목 ${pages.subjects.length} · 수업 ${pages.subjects.reduce((n, s) => n + s.pages.length, 0)}` : '읽기 실패',
  '저장소 루트에서 실행했는지 확인하세요.'
);

/* ── 2. clasp (Apps Script 배포 도구) ───────────────────────────────────── */

const claspVer = sh('clasp --version');
row(!!claspVer, 'clasp 설치', claspVer || '없음', 'npm install -g @google/clasp');

if (claspVer) {
  const who = sh('clasp show-authorized-user');
  // "You are logged in as teacher@school.hs.kr." — 문장 끝 마침표만 떼어낸다
  const email = ((who.match(/logged in as (\S+)/) || [])[1] || '').replace(/\.$/, '');
  row(!!email, 'clasp 로그인', email || '로그아웃 상태', 'clasp login  (교사 계정으로!)');
}

/* ── 3. 과목별 Apps Script 연결 (활동지 시트) ───────────────────────────── */

const linked = [];
function scanClasp(dir, depth = 0) {
  if (depth > 3) return;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  if (entries.some((e) => e.name === '.clasp.json')) {
    const cfg = readJson(join(dir, '.clasp.json'));
    linked.push({ dir: dir.slice(ROOT.length + 1).replace(/\\/g, '/'), scriptId: cfg?.scriptId ?? '?' });
  }
  for (const e of entries) {
    if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules') {
      scanClasp(join(dir, e.name), depth + 1);
    }
  }
}
scanClasp(join(ROOT, 'data'));
scanClasp(join(ROOT, 'docs'));

// 루트에 .clasp.json 이 있으면 clasp 를 잘못된 폴더에서 돌린 것이다.
// 그 상태로 clasp push 하면 저장소 전체를 Apps Script 에 올리려 든다.
if (existsSync(join(ROOT, '.clasp.json'))) {
  const stray = readJson(join(ROOT, '.clasp.json'));
  row(
    false,
    '⚠ 루트 .clasp.json',
    `${(stray?.scriptId ?? '?').slice(0, 18)}… — 잘못된 위치`,
    '대상 폴더에서 다시 만드세요. 루트의 .clasp.json·appsscript.json 은 지워도 됩니다(드라이브의 스크립트는 남습니다).'
  );
}

row(
  linked.length > 0,
  'Apps Script 연결',
  linked.length ? `${linked.length}곳` : '없음',
  '활동지 시트를 쓸 과목 폴더에서 clasp clone-script <스크립트ID>'
);
for (const l of linked) row(null, `  └ ${l.dir}`, l.scriptId.slice(0, 18) + '…');

/* ── 4. 클래스룸 자동 게시 ──────────────────────────────────────────────── */

const cr = readJson(join(ROOT, '.classroom.json'));
if (!cr) {
  row(false, '클래스룸 연동', '.classroom.json 없음', 'copy .classroom.example.json .classroom.json');
} else {
  const urlOk = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(cr.gasUrl || '');
  const tokOk = /^[A-Za-z0-9_-]{20,}$/.test(cr.token || '');
  const orgOk = /^https?:\/\//.test(cr.origin || '');
  const nCourse = Object.keys(cr.courses || {}).length;
  row(urlOk, '  웹앱 URL', urlOk ? '설정됨' : '미설정', 'docs/apps-script/classroom/README.md 3단계');
  row(tokOk, '  토큰', tokOk ? mask(cr.token) : '미설정', '편집기에서 setup() 실행 → 로그의 토큰');
  row(orgOk, '  배포 도메인', cr.origin || '미설정', '.classroom.json 의 origin');
  row(nCourse > 0, '  반 별칭', nCourse ? `${nCourse}개` : '없음', 'node scripts/classroom-post.mjs --courses');
}

/* ── 5. 라이브 레이어 ───────────────────────────────────────────────────── */

const archives = readJson(join(ROOT, 'live', 'archives.json'));
row(
  !!archives,
  '라이브 아카이브 후보',
  archives ? `${(Array.isArray(archives) ? archives : archives.archives || []).length}건` : '없음',
  'node scripts/scan-archives.mjs'
);

/* ── 6. 네트워크 확인 (--net) ───────────────────────────────────────────── */

if (NET) {
  const hit = async (url) => {
    try {
      const r = await fetch(url, { redirect: 'follow', headers: { Connection: 'close' } });
      return r.status;
    } catch {
      return 0;
    }
  };
  if (cr?.origin) {
    const s = await hit(`${cr.origin.replace(/\/+$/, '')}/pages.json`);
    row(s === 200, '배포 사이트', `HTTP ${s || '연결 실패'}`, 'origin 주소를 확인하세요.');
  }
  if (cr?.gasUrl) {
    const s = await hit(cr.gasUrl);
    row(
      s === 200,
      '클래스룸 웹앱',
      `HTTP ${s || '연결 실패'}`,
      s === 403 ? 'setup() 승인 전이거나 배포 액세스가 "모든 사용자"가 아닙니다.' : ''
    );
  }
}

/* ── 출력 ───────────────────────────────────────────────────────────────── */

const W = Math.max(...rows.map((r) => width(r.label))) + 2;
console.log('\n작업 환경 점검\n' + '─'.repeat(58));
for (const r of rows) {
  const mark = r.ok === null ? ' ' : r.ok ? '✓' : '✗';
  console.log(` ${mark} ${r.label}${' '.repeat(Math.max(1, W - width(r.label)))}${r.detail ?? ''}`);
  if (r.ok === false && r.next) console.log(`     → ${r.next}`);
}

const missing = rows.filter((r) => r.ok === false);
console.log('─'.repeat(58));
if (!missing.length) {
  console.log(' 모두 갖춰졌습니다.\n');
} else {
  console.log(` 빠진 항목 ${missing.length}개 — 위 → 표시를 순서대로 처리하세요.`);
  console.log(' 자세한 절차: .claude/skills/workspace-setup/SKILL.md\n');
  process.exitCode = 1;
}
