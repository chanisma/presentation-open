/**
 * 클래스룸 자동 게시 — Google Apps Script (단독 배포용)
 * ============================================================
 * 로컬(클로드코드)에서 `node scripts/classroom-post.mjs …` 를 실행하면 이 웹앱으로
 * POST가 오고, 이 스크립트가 **배포한 교사 계정 권한으로** 구글 클래스룸에 글을 올린다.
 * 로컬에 구글 OAuth 설정이 전혀 필요 없는 이유가 이것 — 인증은 여기서 끝난다.
 *
 * 보내는 쪽: scripts/classroom-post.mjs
 *            POST, Content-Type: text/plain (단순 요청)
 *            body = { source:'classroom_post', token, action, … }
 *
 * 액션:
 *   ping    — 배포 상태·실행 계정 확인
 *   courses — 내가 교사인 활성 수업(반) 목록
 *   topics  — 특정 반의 주제(topic) 목록
 *   posts   — 특정 반에 올라간 공지·자료·과제 목록 (링크 URL 포함, 읽기 전용)
 *   post    — 공지(announcement) · 자료(material) · 과제(assignment) 생성
 *
 * ⚠ 액세스 권한이 "모든 사용자"여야 로컬에서 익명 POST가 닿는다. 그래서 **토큰 게이트**가
 *   필수다 — 토큰 없이는 어떤 액션도 실행되지 않는다. 토큰은 스크립트 속성에 보관하고
 *   코드에는 절대 적지 않는다(이 파일은 git에 올라간다).
 *
 * ── 설치 (10분) ─────────────────────────────────────────────
 * 1. clasp로 프로젝트 생성 + 푸시 (docs/apps-script/classroom/ 에서):
 *      clasp create --type standalone --title "클래스룸 자동 게시"
 *      clasp push
 * 2. clasp open-script 로 편집기를 열고 → 함수 목록에서 setup 선택 → 실행.
 *    권한 승인 창이 뜨면 승인(클래스룸 접근 1회 동의). 실행 로그에 토큰이 찍힌다.
 * 3. 배포 → 새 배포 → 유형 [웹 앱]
 *      설명       : 클래스룸 자동 게시
 *      실행 계정  : 나            ← 이 계정의 클래스룸에 올라간다 (교사 계정이어야 함)
 *      액세스 권한: 모든 사용자   ← ⚠ 반드시 이것 (로컬 스크립트가 익명으로 POST)
 * 4. /exec 로 끝나는 URL과 2번의 토큰을 프로젝트 루트 `.classroom.json` 에 넣는다.
 * 5. 확인: node scripts/classroom-post.mjs --ping
 *
 * ⚠ 코드를 고친 뒤에는 [배포 관리 → 편집(연필) → 버전: 새 버전 → 배포] 를 해야 반영된다.
 *   (URL은 그대로 유지) — clasp deploy --deploymentId <ID> 로도 된다.
 */

var TOKEN_KEY = 'CLASSROOM_POST_TOKEN';

/** 설치 2단계에서 편집기에서 직접 실행하는 함수 — 토큰을 만들어 스크립트 속성에 저장한다. */
function setup() {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty(TOKEN_KEY);
  if (!token) {
    token = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
    props.setProperty(TOKEN_KEY, token);
  }
  // 클래스룸 권한 동의를 이 시점에 받아두려고 실제 호출을 한 번 태운다.
  var courses = listCourses_();
  // getEffectiveUser() 는 userinfo.email 스코프가 필요하다 — appsscript.json 에 명시 스코프를
  // 적으면 자동 추론이 꺼지므로 그 목록에 반드시 들어 있어야 한다.
  Logger.log('실행 계정 : ' + Session.getEffectiveUser().getEmail());
  Logger.log('토큰      : ' + token);
  Logger.log('내 수업   : ' + courses.length + '개');
  courses.forEach(function (c) {
    Logger.log('  ' + c.id + '  ' + c.name + (c.section ? ' (' + c.section + ')' : ''));
  });
  Logger.log('→ 위 토큰을 .classroom.json 의 token 에 넣으세요.');
  return token;
}

/** 토큰을 새로 발급한다(유출 시). 실행 후 .classroom.json 도 같이 고쳐야 한다. */
function rotateToken() {
  PropertiesService.getScriptProperties().deleteProperty(TOKEN_KEY);
  return setup();
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/** URL을 브라우저로 열었을 때의 상태 확인 — 배포가 살아 있는지 1초 만에 판별. */
function doGet() {
  return json_({ status: 'ok', service: 'classroom-post', version: 1 });
}

function doPost(e) {
  var data;
  try {
    data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, error: 'JSON 파싱 실패: ' + err });
  }

  if (data.source !== 'classroom_post') {
    return json_({ ok: false, error: 'source 불일치' });
  }

  var expected = PropertiesService.getScriptProperties().getProperty(TOKEN_KEY);
  if (!expected) {
    return json_({ ok: false, error: '토큰 미설정 — 편집기에서 setup() 을 먼저 실행하세요.' });
  }
  if (String(data.token || '') !== expected) {
    return json_({ ok: false, error: '토큰 불일치' });
  }

  try {
    switch (data.action) {
      case 'ping':
        return json_({ ok: true, user: Session.getEffectiveUser().getEmail() });
      case 'courses':
        return json_({ ok: true, courses: listCourses_() });
      case 'topics':
        return json_({ ok: true, topics: listTopics_(String(data.courseId)) });
      case 'post':
        return json_(createPosts_(data));
      case 'posts':
        return json_({ ok: true, posts: listPosts_(String(data.courseId)) });
      case 'setstate':
        return json_(setState_(String(data.courseId), String(data.itemId), String(data.state)));
      default:
        return json_({ ok: false, error: '알 수 없는 action: ' + data.action });
    }
  } catch (err) {
    return json_({ ok: false, error: String((err && err.message) || err) });
  }
}

/** 내가 교사로 들어가 있는 활성 수업 전부 (페이지네이션 포함). */
function listCourses_() {
  var out = [];
  var token = null;
  do {
    var res = Classroom.Courses.list({
      teacherId: 'me',
      courseStates: ['ACTIVE'],
      pageSize: 100,
      pageToken: token || undefined
    });
    (res.courses || []).forEach(function (c) {
      out.push({
        id: c.id,
        name: c.name,
        section: c.section || '',
        room: c.room || '',
        enrollmentCode: c.enrollmentCode || '',
        link: c.alternateLink || ''
      });
    });
    token = res.nextPageToken;
  } while (token);
  return out;
}

function listTopics_(courseId) {
  var out = [];
  var token = null;
  do {
    var res = Classroom.Courses.Topics.list(courseId, {
      pageSize: 100,
      pageToken: token || undefined
    });
    (res.topic || []).forEach(function (t) {
      out.push({ id: t.topicId, name: t.name });
    });
    token = res.nextPageToken;
  } while (token);
  return out;
}

/** 그 반에 올라간 공지·자료·과제 전부 — 링크 URL을 함께 돌려줘 무엇이 이미 올라갔는지 대조한다. */
function listPosts_(courseId) {
  var out = [];
  function links_(mats) {
    return (mats || []).map(function (m) {
      return (m.link && m.link.url) || (m.driveFile && m.driveFile.driveFile && m.driveFile.driveFile.alternateLink) || '';
    }).filter(String);
  }
  function page_(kind, fetch, key) {
    var token = null;
    do {
      var res = fetch({ pageSize: 100, pageToken: token || undefined,
        courseWorkStates: undefined });
      (res[key] || []).forEach(function (it) {
        out.push({
          kind: kind,
          id: it.id,
          state: it.state,
          title: it.title || it.text || '',
          links: links_(it.materials),
          created: it.creationTime || '',
          link: it.alternateLink || ''
        });
      });
      token = res.nextPageToken;
    } while (token);
  }
  var states = ['PUBLISHED', 'DRAFT'];
  page_('공지', function (o) { o.announcementStates = states; delete o.courseWorkStates;
    return Classroom.Courses.Announcements.list(courseId, o); }, 'announcements');
  page_('자료', function (o) { o.courseWorkMaterialStates = states; delete o.courseWorkStates;
    return Classroom.Courses.CourseWorkMaterials.list(courseId, o); }, 'courseWorkMaterial');
  page_('과제', function (o) { o.courseWorkStates = states;
    return Classroom.Courses.CourseWork.list(courseId, o); }, 'courseWork');
  return out;
}

/**
 * 링크 자료 배열을 Classroom materials 로 변환.
 * Link 자원에서 쓰기 가능한 필드는 url 뿐 — title·thumbnailUrl 은 출력 전용이라
 * 우리가 보내도 무시된다(클래스룸이 페이지를 긁어 카드로 채운다).
 */
function toMaterials_(links) {
  return (links || [])
    .filter(function (l) {
      return l && l.url;
    })
    .map(function (l) {
      return { link: { url: l.url } };
    });
}

/** ISO8601(오프셋 포함) → Classroom dueDate/dueTime. 클래스룸은 **UTC** 기준이다. */
function toDueUtc_(iso) {
  var d = new Date(iso);
  if (isNaN(d.getTime())) throw new Error('마감 시각 파싱 실패: ' + iso);
  return {
    dueDate: {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate()
    },
    dueTime: {
      hours: d.getUTCHours(),
      minutes: d.getUTCMinutes()
    }
  };
}

/**
 * 이미 올린 게시물의 공개 상태를 바꾼다.
 *   DRAFT     — 초안. 학생에게 보이지 않는다(= 비공개).
 *   PUBLISHED — 다시 공개.
 *   DELETED   — 삭제.
 *
 * 자료·과제·공지 중 어느 것인지 호출부가 몰라도 되게 순서대로 시도한다.
 * ⚠ 클래스룸은 **이 스크립트가 만든 게시물만** 수정하게 허용한다(구글 정책).
 *   손으로 올린 글에 쓰면 권한 오류가 난다.
 */
function setState_(courseId, itemId, state) {
  var attempts = [
    ['자료', function () {
      return Classroom.Courses.CourseWorkMaterials.patch(
        { state: state }, courseId, itemId, { updateMask: 'state' });
    }],
    ['과제', function () {
      return Classroom.Courses.CourseWork.patch(
        { state: state }, courseId, itemId, { updateMask: 'state' });
    }],
    ['공지', function () {
      return Classroom.Courses.Announcements.patch(
        { state: state }, courseId, itemId, { updateMask: 'state' });
    }]
  ];

  var errors = [];
  for (var i = 0; i < attempts.length; i++) {
    try {
      var item = attempts[i][1]();
      return {
        ok: true,
        kind: attempts[i][0],
        state: item.state,
        title: item.title || item.text || '',
        link: item.alternateLink || ''
      };
    } catch (err) {
      errors.push(attempts[i][0] + ': ' + String((err && err.message) || err));
    }
  }
  return { ok: false, error: errors.join(' | ') };
}

/** 여러 반에 같은 내용을 올린다. 반별로 성공/실패를 따로 담아 돌려준다. */
function createPosts_(data) {
  var courseIds = data.courseIds || [];
  if (!courseIds.length) return { ok: false, error: 'courseIds 가 비어 있습니다' };

  var materials = toMaterials_(data.links);
  var state = data.draft ? 'DRAFT' : 'PUBLISHED';
  var results = [];

  courseIds.forEach(function (courseId) {
    try {
      var created;
      if (data.type === 'assignment') {
        var work = {
          title: data.title,
          description: data.description || '',
          materials: materials,
          workType: 'ASSIGNMENT',
          state: state,
          assigneeMode: 'ALL_STUDENTS'
        };
        if (data.topicId) work.topicId = data.topicId;
        if (data.maxPoints != null) work.maxPoints = data.maxPoints;
        if (data.scheduledAt) work.scheduledTime = new Date(data.scheduledAt).toISOString();
        if (data.dueAt) {
          var due = toDueUtc_(data.dueAt);
          work.dueDate = due.dueDate;
          work.dueTime = due.dueTime;
        }
        created = Classroom.Courses.CourseWork.create(work, courseId);
      } else if (data.type === 'material') {
        var mat = {
          title: data.title,
          description: data.description || '',
          materials: materials,
          state: state
        };
        if (data.topicId) mat.topicId = data.topicId;
        if (data.scheduledAt) mat.scheduledTime = new Date(data.scheduledAt).toISOString();
        created = Classroom.Courses.CourseWorkMaterials.create(mat, courseId);
      } else {
        var ann = {
          text: data.text || data.title || '',
          materials: materials,
          state: state
        };
        if (data.scheduledAt) ann.scheduledTime = new Date(data.scheduledAt).toISOString();
        created = Classroom.Courses.Announcements.create(ann, courseId);
      }
      results.push({
        courseId: courseId,
        ok: true,
        id: created.id,
        link: created.alternateLink || ''
      });
    } catch (err) {
      results.push({
        courseId: courseId,
        ok: false,
        error: String((err && err.message) || err)
      });
    }
  });

  return { ok: results.some(function (r) { return r.ok; }), results: results };
}
