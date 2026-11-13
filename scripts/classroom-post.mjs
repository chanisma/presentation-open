/* 수업 자료 링크를 구글 클래스룸에 올린다 — 클로드코드/터미널에서 명령 한 줄.
   pages.json 에서 수업을 찾아 허브와 **똑같은 규칙**으로 절대 URL을 만든 뒤,
   Apps Script 웹앱(docs/apps-script/classroom/)으로 POST 한다. 실제 클래스룸 게시는
   그 스크립트가 교사 계정 권한으로 수행한다 — 여기(로컬)에는 구글 인증이 없다.

   설정: 프로젝트 루트 .classroom.json (gitignore 됨 — .classroom.example.json 참고)

   사용:
     node scripts/classroom-post.mjs --ping                     배포·계정 확인
     node scripts/classroom-post.mjs --courses                  내 반 목록 (courseId 확인)
     node scripts/classroom-post.mjs --topics <반>              그 반의 주제 목록
     node scripts/classroom-post.mjs --find <검색어>            pages.json 에서 수업 찾기만
     node scripts/classroom-post.mjs --posts <반>               그 반에 이미 올라간 글 (링크 포함)

     node scripts/classroom-post.mjs --unpublish <게시물 링크>  올린 글을 비공개(초안)로
     node scripts/classroom-post.mjs --publish   <게시물 링크>  다시 공개로
       ↑ 이 스크립트로 올린 게시물만 바꿀 수 있다 (구글 정책)

     node scripts/classroom-post.mjs "바꾸는 세상" --to 인공지능기초
     node scripts/classroom-post.mjs "바꾸는 세상" "탐험 일지" --to 인공지능기초,정보
     node scripts/classroom-post.mjs "정렬" --to 정보 --type assignment --due 2026-08-25T23:59 --points 20
     node scripts/classroom-post.mjs --url https://forms.gle/xxx --title "사전 설문" --to 정보

   옵션:
     --to <반,반>       대상 반 — .classroom.json 의 별칭 또는 courseId (필수)
     --type <종류>      announcement(공지·기본) | material(수업 자료) | assignment(과제)
     --title <제목>     게시물 제목 (material·assignment 필수 — 없으면 수업 제목 사용)
     --message <본문>   공지 본문 / 자료·과제 설명 (없으면 수업 설명 사용)
     --topic <주제>     주제 이름 또는 topicId (material·assignment 만)
     --due <일시>       과제 마감 — 2026-08-25T23:59 (한국 시간으로 해석)
     --points <점수>    과제 만점 (기본: 채점 없음)
     --at <일시>        예약 게시 — 그 시각까지 학생에게 안 보임
     --draft            초안으로만 생성 (학생에게 안 보임, 클래스룸에서 수동 게시)
     --dry-run          보낼 내용만 출력하고 실제로 올리지 않음
*/
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const CONFIG_PATH = resolve(ROOT, '.classroom.json');

/* ── 인자 파싱 ─────────────────────────────────────────────────────────── */

const FLAGS = new Set(['--draft', '--dry-run', '--ping', '--courses', '--json']);
const argv = process.argv.slice(2);
const opts = {};
const queries = [];

for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith('--')) {
    queries.push(a);
    continue;
  }
  const key = a.slice(2);
  if (FLAGS.has(a)) opts[key] = true;
  else opts[key] = argv[++i];
}

function die(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

/* ── 설정 ──────────────────────────────────────────────────────────────── */

if (!existsSync(CONFIG_PATH)) {
  die(
    `.classroom.json 이 없습니다.\n` +
      `  .classroom.example.json 을 복사해 채우세요:\n` +
      `    copy .classroom.example.json .classroom.json\n` +
      `  (gasUrl·token 은 docs/apps-script/classroom/apps-script.js 상단 설치 절차 참고)`
  );
}

const cfg = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
// 예시 파일을 복사만 하고 안 채운 경우를 여기서 잡는다 — 안 그러면 알 수 없는 네트워크 오류로 튄다
if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(String(cfg.gasUrl || ''))) {
  die(
    `.classroom.json 의 gasUrl 이 아직 채워지지 않았습니다.\n` +
      `  Apps Script 웹앱 배포 URL(…/exec)을 넣으세요.\n` +
      `  설치 절차: docs/apps-script/classroom/README.md`
  );
}
const ORIGIN = String(cfg.origin || '').replace(/\/+$/, '');
if (ORIGIN && !/^https?:\/\//.test(ORIGIN)) die('.classroom.json 의 origin 은 https:// 로 시작해야 합니다.');

async function call(action, payload = {}) {
  // 토큰은 setup() 이 만든 32자 이상 문자열 — 예시 파일의 한글 안내문이 남아 있으면 여기서 걸린다.
  // (검사를 call() 안에 두어야 --find·--dry-run 은 설치 전에도 쓸 수 있다)
  if (!/^[A-Za-z0-9_-]{20,}$/.test(String(cfg.token || ''))) {
    die(
      `.classroom.json 의 token 이 아직 채워지지 않았습니다.\n` +
        `  스크립트 편집기에서 setup() 을 실행하면 실행 로그에 토큰이 찍힙니다.\n` +
        `  https://script.google.com/d/1NTPbxsv2gPrxOJp59KWpo1tEheANR3l_j0tAldIkcHgdSmDJd2Y9OdBT/edit`
    );
  }
  const res = await fetch(cfg.gasUrl, {
    method: 'POST',
    // text/plain — Apps Script 웹앱이 preflight 없이 받는 단순 요청 형식
    // Connection: close — 유지 소켓이 열린 채 process.exit() 하면 Windows에서 libuv assertion 이 뜬다
    headers: { 'Content-Type': 'text/plain;charset=utf-8', Connection: 'close' },
    body: JSON.stringify({ source: 'classroom_post', token: cfg.token, action, ...payload }),
    redirect: 'follow'
  });
  const text = await res.text();
  let out;
  try {
    out = JSON.parse(text);
  } catch {
    if (res.status === 401 || res.status === 403) {
      die(
        `웹앱이 요청을 거부했습니다 (HTTP ${res.status}). 원인은 둘 중 하나입니다.\n\n` +
          `  ① 아직 권한 승인 전 — 스크립트 편집기에서 setup() 을 한 번 실행하세요.\n` +
          `     https://script.google.com/d/1NTPbxsv2gPrxOJp59KWpo1tEheANR3l_j0tAldIkcHgdSmDJd2Y9OdBT/edit\n\n` +
          `  ② 배포 설정 — [배포 관리]에서 실행 계정 "나" · 액세스 권한 "모든 사용자" 확인.\n` +
          `     학교 Workspace가 외부 공개 웹앱을 막아둔 경우에도 여기서 막힙니다.`
      );
    }
    die(
      `Apps Script 응답이 JSON이 아닙니다 (HTTP ${res.status}).\n` +
        `  ${text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200)}`
    );
  }
  if (!out.ok) {
    // 클래스룸의 영구 제약 — 세 종류 모두 같은 이유로 실패하므로 원문 3줄 대신 설명으로 바꾼다
    if (/State can only be changed to PUBLISHED/.test(out.error || '')) {
      die(
        `이미 공개된 게시물은 비공개(초안)로 되돌릴 수 없습니다 — 구글 클래스룸의 제약입니다.\n` +
          `  클래스룸 웹 화면에도 '초안으로 되돌리기'가 없는 것과 같은 이유입니다.\n\n` +
          `  대안: 지우고 초안으로 다시 올립니다 (링크는 새로 생깁니다).\n` +
          `    ① 클래스룸에서 해당 글 ⋮ → 삭제\n` +
          `    ② node scripts/classroom-post.mjs "<검색어>" --to <반> --draft`
      );
    }
    die(`Apps Script 오류: ${out.error}`);
  }
  return out;
}

/* ── pages.json 에서 수업 찾기 ──────────────────────────────────────────── */

/** 검색용 정규화 — 이모지·공백·기호를 걷어내고 소문자로. */
function norm(s) {
  return String(s)
    .toLowerCase()
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
    .replace(/[\s·・_\-—–()[\]{}'"`,.!?]/g, '');
}

/** 허브(src/hub/Hub.tsx legacyCard)와 동일한 링크 규칙. 이게 어긋나면 학생이 빈 화면을 본다. */
function pageUrl(page) {
  const isSpaRoute = page.path.startsWith('index.html?');
  const rel =
    page.type === 'doc' || isSpaRoute
      ? `/${page.path}`
      : `/?legacy=${encodeURIComponent(page.path)}`;
  return ORIGIN + rel;
}

function loadPages() {
  const data = JSON.parse(readFileSync(resolve(ROOT, 'pages.json'), 'utf-8'));
  const out = [];
  for (const subj of data.subjects) {
    for (const p of subj.pages) {
      out.push({ ...p, subject: subj.name, group: subj.group ?? 'etc' });
    }
  }
  return out;
}

function findPage(all, query) {
  const q = norm(query);
  const hits = all.filter(
    (p) => norm(p.title).includes(q) || norm(p.path).includes(q) || norm(p.subject).includes(q)
  );
  if (!hits.length) die(`"${query}" 와 맞는 수업이 pages.json 에 없습니다.`);
  if (hits.length > 1) {
    // 제목이 정확히 하나만 걸리면 그걸 택한다 (과목명까지 걸려서 늘어난 경우)
    const byTitle = hits.filter((p) => norm(p.title).includes(q));
    if (byTitle.length === 1) return byTitle[0];
    console.error(`\n"${query}" 에 ${hits.length}개가 걸렸습니다 — 더 구체적으로 적어주세요:\n`);
    for (const p of hits.slice(0, 15)) console.error(`  · [${p.subject}] ${p.title}`);
    if (hits.length > 15) console.error(`  … 외 ${hits.length - 15}개`);
    console.error('');
    process.exit(1);
  }
  return hits[0];
}

/* ── 반 별칭 → courseId ────────────────────────────────────────────────── */

async function resolveCourses(spec) {
  const wanted = String(spec)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!wanted.length) die('--to 에 대상 반을 적어주세요. (--courses 로 목록 확인)');

  const aliases = cfg.courses || {};
  const unresolved = wanted.filter((w) => !aliases[w] && !/^\d+$/.test(w));
  let remote = null;
  if (unresolved.length) {
    remote = (await call('courses')).courses;
  }

  return wanted.map((w) => {
    if (aliases[w]) return { id: String(aliases[w]), label: w };
    if (/^\d+$/.test(w)) return { id: w, label: w };
    const hits = remote.filter(
      (c) => norm(c.name).includes(norm(w)) || norm(c.section).includes(norm(w))
    );
    if (hits.length === 1) return { id: hits[0].id, label: hits[0].name };
    if (!hits.length) die(`"${w}" 와 맞는 반이 없습니다. --courses 로 목록을 확인하세요.`);
    die(`"${w}" 에 여러 반이 걸립니다: ${hits.map((c) => c.name).join(', ')}`);
  });
}

/* ── 마감/예약 시각: 한국 시간 입력 → ISO(+09:00) ───────────────────────── */

function toKstIso(input) {
  const s = String(input).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2}):(\d{2}))?$/);
  if (!m) die(`시각 형식이 잘못됐습니다: ${s}  (예: 2026-08-25T23:59)`);
  const [, y, mo, d, h = '23', mi = '59'] = m;
  return `${y}-${mo}-${d}T${String(h).padStart(2, '0')}:${mi}:00+09:00`;
}

/* ── 실행 ──────────────────────────────────────────────────────────────── */

if (opts.ping) {
  const r = await call('ping');
  console.log(`\n✓ 연결됨 — 게시 계정: ${r.user}\n`);
  process.exit(0);
}

if (opts.courses) {
  const { courses } = await call('courses');
  console.log(`\n내가 교사인 활성 수업 ${courses.length}개:\n`);
  for (const c of courses) {
    console.log(`  ${c.id}  ${c.name}${c.section ? ` — ${c.section}` : ''}`);
  }
  console.log(`\n→ .classroom.json 의 courses 에 { "별칭": "${courses[0]?.id ?? 'ID'}" } 로 등록해두면 --to 별칭 으로 쓸 수 있습니다.\n`);
  process.exit(0);
}

if (opts.topics) {
  const [course] = await resolveCourses(opts.topics);
  const { topics } = await call('topics', { courseId: course.id });
  console.log(`\n[${course.label}] 주제 ${topics.length}개:\n`);
  for (const t of topics) console.log(`  ${t.id}  ${t.name}`);
  console.log('');
  process.exit(0);
}

if (opts.posts) {
  const [course] = await resolveCourses(opts.posts);
  const { posts } = await call('posts', { courseId: course.id });
  if (opts.json) {
    console.log(JSON.stringify(posts, null, 2));
    process.exit(0);
  }
  console.log(`\n[${course.label}] 게시물 ${posts.length}개:\n`);
  for (const p of posts) {
    const head = p.title.split('\n')[0].slice(0, 60);
    console.log(`  ${p.kind}${p.state === 'DRAFT' ? '(초안)' : ''}  ${p.created.slice(0, 10)}  ${head}`);
    for (const l of p.links) console.log(`      ${l}`);
  }
  console.log('');
  process.exit(0);
}

/* 이미 올린 게시물의 공개 상태 바꾸기 — 링크만 있으면 된다 */

/** 클래스룸 게시물 링크에서 courseId·itemId를 꺼낸다.
    https://classroom.google.com/c/<b64 courseId>/m/<b64 itemId>/details
    (경로의 ID는 숫자를 base64로 감싼 것) */
function parseItemRef(s) {
  const link = String(s).match(/classroom\.google\.com\/c\/([^/]+)\/[a-z]+\/([^/?#]+)/);
  if (link) {
    const dec = (v) => Buffer.from(v, 'base64').toString('utf-8');
    return { courseId: dec(link[1]), itemId: dec(link[2]) };
  }
  const pair = String(s).match(/^(\d+)[/:](\d+)$/);
  if (pair) return { courseId: pair[1], itemId: pair[2] };
  die(
    `게시물을 알아볼 수 없습니다: ${s}\n` +
      `  클래스룸 게시물 링크를 그대로 붙여넣거나 <courseId>/<itemId> 형식으로 주세요.`
  );
}

for (const [flag, state, label] of [
  ['unpublish', 'DRAFT', '비공개(초안)'],
  ['publish', 'PUBLISHED', '공개']
]) {
  if (!opts[flag]) continue;
  const ref = parseItemRef(opts[flag]);
  const r = await call('setstate', { ...ref, state });
  console.log(`\n  ✓ ${r.kind} "${r.title}" → ${label}`);
  if (r.link) console.log(`    ${r.link}`);
  console.log('');
  process.exit(0);
}

if (opts.find) {
  const all = loadPages();
  const q = norm(opts.find);
  const hits = all.filter((p) => norm(p.title).includes(q) || norm(p.subject).includes(q));
  console.log(`\n"${opts.find}" — ${hits.length}건:\n`);
  for (const p of hits) {
    console.log(`  [${p.subject}] ${p.title}`);
    console.log(`      ${ORIGIN ? pageUrl(p) : p.path}`);
  }
  console.log('');
  process.exit(0);
}

/* 여기부터는 실제 게시 */

if (!queries.length && !opts.url) {
  die('올릴 수업을 적어주세요.  예) node scripts/classroom-post.mjs "바꾸는 세상" --to 정보\n  (도움말은 파일 상단 주석 참고)');
}
if (!opts.to) die('--to 로 대상 반을 지정해야 합니다. (--courses 로 목록 확인)');

const type = opts.type || cfg.defaultType || 'announcement';
if (!['announcement', 'material', 'assignment'].includes(type)) {
  die(`--type 은 announcement | material | assignment 중 하나입니다 (받은 값: ${type})`);
}

const links = [];
let title = opts.title || '';
let body = opts.message || '';

if (opts.url) {
  links.push({ url: opts.url });
  if (!title) die('--url 을 쓸 때는 --title 도 필요합니다.');
} else {
  if (!ORIGIN) die('.classroom.json 의 origin(배포 도메인)이 비어 있습니다.');
  const all = loadPages();
  const pages = queries.map((q) => findPage(all, q));
  for (const p of pages) links.push({ url: pageUrl(p) });

  if (pages.length === 1) {
    const p = pages[0];
    if (!title) title = p.title;
    if (!body) body = p.description || '';
  } else {
    if (!title) title = `수업 자료 ${pages.length}건`;
    if (!body) body = pages.map((p) => `· ${p.title}`).join('\n');
  }
  console.log('');
  for (const p of pages) console.log(`  📄 [${p.subject}] ${p.title}\n     ${pageUrl(p)}`);
}

const courses = await resolveCourses(opts.to);

/* 주제(topic)는 이름으로도 받는다 — material·assignment 에서만 의미가 있다 */
let topicId;
if (opts.topic) {
  if (type === 'announcement') {
    console.log('  ⚠ 공지(announcement)에는 주제를 붙일 수 없어 --topic 을 무시합니다.');
  } else if (/^\w{10,}$/.test(opts.topic) && !/\s/.test(opts.topic)) {
    topicId = opts.topic;
  } else {
    const { topics } = await call('topics', { courseId: courses[0].id });
    const hit = topics.find((t) => norm(t.name).includes(norm(opts.topic)));
    if (!hit) die(`"${opts.topic}" 주제를 [${courses[0].label}] 에서 못 찾았습니다.`);
    topicId = hit.id;
    if (courses.length > 1) {
      console.log(`  ⚠ 주제 ID는 반마다 다릅니다 — [${courses[0].label}] 기준으로만 적용됩니다.`);
    }
  }
}

const payload = {
  courseIds: courses.map((c) => c.id),
  type,
  title,
  // 공지는 제목 필드가 없다 — 제목·설명을 한 덩어리 본문으로 합친다.
  text:
    type === 'announcement'
      ? [title, body].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join('\n\n')
      : undefined,
  description: body,
  links,
  draft: !!opts.draft,
  topicId,
  maxPoints: opts.points != null ? Number(opts.points) : undefined,
  dueAt: opts.due ? toKstIso(opts.due) : undefined,
  scheduledAt: opts.at ? toKstIso(opts.at) : undefined
};

const TYPE_LABEL = { announcement: '공지', material: '수업 자료', assignment: '과제' };

console.log(`\n  → ${courses.map((c) => c.label).join(', ')} 에 ${TYPE_LABEL[type]}로 게시`);
if (payload.dueAt) console.log(`     마감 ${payload.dueAt}`);
if (payload.scheduledAt) console.log(`     예약 ${payload.scheduledAt}`);
if (payload.draft) console.log('     초안(학생에게 안 보임)');

if (opts['dry-run']) {
  console.log('\n[--dry-run] 실제로 올리지 않았습니다. 보낼 내용:\n');
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

const result = await call('post', payload);
console.log('');
for (const r of result.results) {
  const course = courses.find((c) => c.id === r.courseId);
  const name = course?.label ?? r.courseId;
  if (r.ok) console.log(`  ✓ ${name} — ${r.link}`);
  else console.log(`  ✖ ${name} — ${r.error}`);
}
console.log('');
if (result.results.some((r) => !r.ok)) process.exit(1);
