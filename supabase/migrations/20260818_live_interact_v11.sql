-- ============================================================
-- live_presentation_* v11 — 학생 화면 조작 허용 (미러 클릭 차단 해제)
--
--   v4의 학생 미러는 선생님 덱을 iframe으로 띄우고 그 위에 투명한 차단막
--   (lv-mirror-shield / #mirrorShield)을 덮어 학생이 자기 화면을 임의로
--   넘기지 못하게 막는다. 수업 중 "각자 직접 눌러보게" 하고 싶을 때가 있어
--   교사가 라이브 독·콘솔에서 이 차단을 풀 수 있게 세션 플래그를 둔다.
--
--   세션 컬럼으로 저장하는 이유: 브로드캐스트는 즉시 반영용 핑일 뿐이고
--   진실은 항상 RPC 재조회로 수렴해야 한다(wss가 막힌 학교망에서는 폴링만
--   남는다). 늦게 들어온 학생·새로고침한 학생도 같은 상태를 받아야 한다.
--
--   조작 주체는 여전히 host_token 게이트 — anon 키만으로는 못 바꾼다.
-- ============================================================

alter table live_presentation_sessions
  add column if not exists allow_interact boolean not null default false;

-- ── 교사: 학생 조작 허용 토글 ──
create or replace function lp_set_interact(
  p_session_id uuid, p_host_token uuid, p_on boolean
) returns jsonb
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  s live_presentation_sessions;
begin
  s := live_presentation__auth_host(p_session_id, p_host_token);
  update live_presentation_sessions
     set allow_interact = coalesce(p_on, false)
   where id = s.id
  returning * into s;
  return jsonb_build_object('allowInteract', s.allow_interact);
end;
$$;

-- ── 교사: 세션 재개 / 상태 조회에 allowInteract 포함 (v7 본문 + 필드 추가) ──
create or replace function lp_resume_session(p_code text, p_host_token uuid)
returns jsonb
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  s live_presentation_sessions;
begin
  select * into s from live_presentation_sessions
   where code = upper(p_code) and host_token = p_host_token;
  if not found then raise exception 'LP_AUTH: invalid session or host token'; end if;
  return jsonb_build_object('sessionId', s.id, 'code', s.code, 'hostToken', s.host_token,
                            'title', s.title, 'status', s.status,
                            'currentSlide', s.current_slide, 'nameMode', s.name_mode,
                            'deckPath', s.deck_path, 'gamify', s.gamify,
                            'allowInteract', s.allow_interact);
end;
$$;

create or replace function lp_host_state(p_session_id uuid, p_host_token uuid)
returns jsonb
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  s live_presentation_sessions;
begin
  s := live_presentation__auth_host(p_session_id, p_host_token);
  return jsonb_build_object(
    'session', jsonb_build_object('id', s.id, 'code', s.code, 'title', s.title,
                                  'status', s.status, 'currentSlide', s.current_slide,
                                  'nameMode', s.name_mode, 'deckPath', s.deck_path,
                                  'gamify', s.gamify,
                                  'allowInteract', s.allow_interact),
    'participantCount', (select count(*) from live_presentation_participants where session_id = s.id),
    'leaderboard', case when s.gamify then live_presentation__leaderboard(s.id) else '[]'::jsonb end,
    'participants', coalesce((
      select jsonb_agg(jsonb_build_object('id', p.id, 'nickname', p.nickname,
                                          'studentNo', p.student_no, 'joinedAt', p.joined_at)
                       order by p.joined_at)
      from live_presentation_participants p where p.session_id = s.id), '[]'::jsonb),
    'activities', coalesce((
      select jsonb_agg(
               jsonb_build_object('id', a.id, 'slideKey', a.slide_key, 'slideIndex', a.slide_index,
                                  'kind', a.kind, 'prompt', a.prompt, 'status', a.status,
                                  'config', a.config,
                                  'currentRound', a.current_round,
                                  'revealedAt', a.revealed_at,
                                  'responseCount', (select count(*) from live_presentation_responses r
                                                     where r.activity_id = a.id),
                                  'roundCounts', jsonb_build_array(
                                    (select count(*) from live_presentation_responses r
                                      where r.activity_id = a.id and r.round = 1),
                                    (select count(*) from live_presentation_responses r
                                      where r.activity_id = a.id and r.round = 2)),
                                  'aggregates', live_presentation__aggregate(a.id, 1),
                                  'aggregates2', case when a.current_round > 1
                                    then live_presentation__aggregate(a.id, 2) else null end)
               order by a.opened_at nulls last)
      from live_presentation_activities a where a.session_id = s.id), '[]'::jsonb)
  );
end;
$$;

-- ── 학생: 입장 / 상태 조회에 allowInteract 포함 (v4 본문 + 필드 추가) ──
create or replace function lp_join(
  p_code text, p_client_id uuid, p_nickname text default '', p_student_no text default null
) returns jsonb
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  s live_presentation_sessions;
  p live_presentation_participants;
  cur jsonb;
begin
  select * into s from live_presentation_sessions where code = upper(trim(p_code)) and status = 'open';
  if not found then raise exception 'LP_JOIN: session not found or ended'; end if;

  insert into live_presentation_participants (session_id, client_id, nickname, student_no)
  values (s.id, p_client_id, left(coalesce(p_nickname,''), 30), left(p_student_no, 20))
  on conflict (session_id, client_id) do update
     set nickname = case when excluded.nickname <> '' then excluded.nickname
                         else live_presentation_participants.nickname end,
         student_no = coalesce(excluded.student_no, live_presentation_participants.student_no)
  returning * into p;

  select live_presentation__activity_public(a) into cur
    from live_presentation_activities a
   where a.session_id = s.id and a.status in ('open','revealed')
   order by a.opened_at desc nulls last limit 1;

  return jsonb_build_object(
    'sessionId', s.id, 'code', s.code, 'title', s.title, 'nameMode', s.name_mode,
    'participantId', p.id, 'currentSlide', s.current_slide,
    'deckPath', s.deck_path,
    'allowInteract', s.allow_interact,
    'myStudentNo', p.student_no,
    'currentActivity', cur,
    'myResponses', coalesce((
      select jsonb_agg(jsonb_build_object('activityId', r.activity_id, 'round', r.round))
      from live_presentation_responses r where r.participant_id = p.id), '[]'::jsonb)
  );
end;
$$;

create or replace function lp_student_state(p_code text, p_client_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  s live_presentation_sessions;
  a live_presentation_activities;
  cur jsonb;
  agg jsonb;
begin
  select * into s from live_presentation_sessions where code = upper(trim(p_code));
  if not found then raise exception 'LP: session not found'; end if;

  select * into a from live_presentation_activities
   where session_id = s.id and status in ('open','revealed')
   order by opened_at desc nulls last limit 1;

  if found then
    cur := live_presentation__activity_public(a);
    if a.status = 'revealed' then
      agg := live_presentation__reveal_payload(a);
    end if;
  end if;

  return jsonb_build_object(
    'status', s.status, 'currentSlide', s.current_slide, 'deckPath', s.deck_path,
    'allowInteract', s.allow_interact,
    'currentActivity', cur, 'revealedAggregates', agg);
end;
$$;

-- ── 실행 권한 재정비 (v8~v10과 동일 규칙 — 함수를 다시 만들면 default
--    privileges가 다시 붙으므로 lp_* 게이트웨이만 남기고 회수) ──
do $$
declare fn record;
begin
  for fn in
    select p.oid::regprocedure as sig, p.proname
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and (p.proname like 'lp\_%' escape '\' or p.proname like 'live\_presentation\_\_%' escape '\')
  loop
    execute format('revoke all on function %s from public, anon, authenticated', fn.sig);
    if fn.proname like 'lp\_%' escape '\' then
      execute format('grant execute on function %s to anon, authenticated', fn.sig);
    end if;
  end loop;
end $$;
