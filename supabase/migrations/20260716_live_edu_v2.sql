-- ============================================================
-- live_presentation_* v2 — Phase 3 교육적 강화
--   1) Peer Instruction 2라운드: activities.current_round + lp_advance_round
--   2) 출구티켓(exit) 집계: 이해도 1~5 분포 + 평균 + 한마디 텍스트
--   3) 공개 payload 통일: PI 활동은 1·2차 비교(rounds[]) 형태
--   4) lp_submit: 라운드를 서버가 결정 (클라이언트 p_round 무시)
--   5) 기명 모드 지원 보강: lp_join 응답에 myStudentNo
-- ============================================================

alter table live_presentation_activities
  add column if not exists current_round int not null default 1;

-- ── 학생용 문항 JSON: 현재 라운드 포함 (정답·오개념 라벨은 계속 제거) ──
create or replace function live_presentation__activity_public(a live_presentation_activities)
returns jsonb
language sql
security definer set search_path = public, extensions
as $$
  select jsonb_build_object(
    'id', a.id, 'kind', a.kind, 'prompt', a.prompt, 'status', a.status,
    'slideKey', a.slide_key, 'round', a.current_round,
    'config', (a.config - 'answer' - 'misconceptions')
  );
$$;

-- ── 집계: exit(이해도+한마디) 분기 추가 ──
create or replace function live_presentation__aggregate(p_activity_id uuid, p_round int default 1)
returns jsonb
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  a live_presentation_activities;
  agg jsonb;
  total int;
begin
  select * into a from live_presentation_activities where id = p_activity_id;
  if not found then return '{}'::jsonb; end if;

  select count(*) into total from live_presentation_responses
   where activity_id = p_activity_id and round = p_round;

  if a.kind = 'choice' then
    select jsonb_build_object(
      'kind','choice','total',total,
      'counts', coalesce((
        select jsonb_agg(cnt order by idx)
        from (
          select gs.idx, count(r.id) as cnt
          from generate_series(0, jsonb_array_length(a.config->'options') - 1) gs(idx)
          left join live_presentation_responses r
            on r.activity_id = p_activity_id and r.round = p_round
           and (r.payload->>'choice')::int = gs.idx
          group by gs.idx
        ) t
      ), '[]'::jsonb))
    into agg;
  elsif a.kind = 'ox' then
    select jsonb_build_object(
      'kind','ox','total',total,
      'counts', jsonb_build_object(
        'O', count(*) filter (where (payload->>'ox')::boolean is true),
        'X', count(*) filter (where (payload->>'ox')::boolean is false)))
    from live_presentation_responses
    where activity_id = p_activity_id and round = p_round
    into agg;
  elsif a.kind = 'exit' then
    select jsonb_build_object(
      'kind','exit','total',total,
      'ratings', coalesce((
        select jsonb_agg(cnt order by r)
        from (
          select gs.r, count(x.id) as cnt
          from generate_series(1, 5) gs(r)
          left join live_presentation_responses x
            on x.activity_id = p_activity_id and x.round = p_round
           and (x.payload->>'rating')::int = gs.r
          group by gs.r
        ) t
      ), '[]'::jsonb),
      'avg', (select round(avg((payload->>'rating')::numeric), 2)
                from live_presentation_responses
               where activity_id = p_activity_id and round = p_round
                 and payload ? 'rating'),
      'texts', coalesce((
        select jsonb_agg(left(payload->>'text', 300) order by created_at)
        from (
          select payload, created_at from live_presentation_responses
          where activity_id = p_activity_id and round = p_round
            and coalesce(trim(payload->>'text'), '') <> ''
          order by created_at limit 200
        ) t
      ), '[]'::jsonb))
    into agg;
  else
    -- short / wordcloud / code: 텍스트 나열
    select jsonb_build_object(
      'kind', a.kind, 'total', total,
      'texts', coalesce((
        select jsonb_agg(left(payload->>'text', 300) order by created_at)
        from (
          select payload, created_at from live_presentation_responses
          where activity_id = p_activity_id and round = p_round
          order by created_at limit 200
        ) t
      ), '[]'::jsonb))
    into agg;
  end if;

  return agg;
end;
$$;

-- ── 공개 payload (교사 reveal·학생 state 공용): PI면 1·2차 비교 ──
create or replace function live_presentation__reveal_payload(a live_presentation_activities)
returns jsonb
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  agg jsonb;
  r1 jsonb;
  r2 jsonb;
begin
  if a.current_round > 1 then
    r1 := live_presentation__aggregate(a.id, 1);
    r2 := live_presentation__aggregate(a.id, 2);
    agg := jsonb_build_object('kind', a.kind, 'pi', true,
                              'rounds', jsonb_build_array(r1, r2),
                              'total', coalesce((r2->>'total')::int, 0));
  else
    agg := live_presentation__aggregate(a.id, 1);
  end if;
  if a.kind in ('choice','ox') and a.config ? 'answer' then
    agg := agg || jsonb_build_object('answer', a.config->'answer');
  end if;
  return agg;
end;
$$;

-- ── 2차 투표 시작 (Peer Instruction) — idempotent ──
create or replace function lp_advance_round(p_session_id uuid, p_host_token uuid, p_activity_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  a live_presentation_activities;
begin
  perform live_presentation__auth_host(p_session_id, p_host_token);
  update live_presentation_activities
     set current_round = 2, status = 'open', opened_at = now(), closed_at = null
   where id = p_activity_id and session_id = p_session_id
  returning * into a;
  if not found then raise exception 'LP: activity not found'; end if;
  return live_presentation__activity_public(a);
end;
$$;

-- ── reveal: 공용 payload 사용 ──
create or replace function lp_reveal_activity(p_session_id uuid, p_host_token uuid, p_activity_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  a live_presentation_activities;
begin
  perform live_presentation__auth_host(p_session_id, p_host_token);
  update live_presentation_activities
     set status = 'revealed', closed_at = coalesce(closed_at, now())
   where id = p_activity_id and session_id = p_session_id
  returning * into a;
  if not found then raise exception 'LP: activity not found'; end if;
  return live_presentation__reveal_payload(a);
end;
$$;

-- ── 제출: 라운드는 서버가 결정 (p_round는 하위호환용으로만 남김) ──
create or replace function lp_submit(
  p_activity_id uuid, p_participant_id uuid, p_client_id uuid,
  p_payload jsonb, p_round int default 1
) returns jsonb
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  a live_presentation_activities;
  p live_presentation_participants;
  v_round int;
  correct boolean;
begin
  if pg_column_size(p_payload) > 20000 then
    raise exception 'LP_SUBMIT: payload too large';
  end if;

  select * into a from live_presentation_activities where id = p_activity_id;
  if not found or a.status <> 'open' then
    return jsonb_build_object('ok', false, 'reason', 'not_open');
  end if;
  v_round := greatest(1, a.current_round);

  select * into p from live_presentation_participants
   where id = p_participant_id and session_id = a.session_id and client_id = p_client_id;
  if not found then raise exception 'LP_SUBMIT: invalid participant'; end if;

  if a.kind = 'choice' and a.config ? 'answer' then
    correct := (p_payload->>'choice')::int = (a.config->>'answer')::int;
  elsif a.kind = 'ox' and a.config ? 'answer' then
    correct := (p_payload->>'ox')::boolean = (a.config->>'answer')::boolean;
  else
    correct := null;
  end if;

  begin
    insert into live_presentation_responses (activity_id, session_id, participant_id, round, payload, is_correct)
    values (p_activity_id, a.session_id, p_participant_id, v_round, p_payload, correct);
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'reason', 'duplicate', 'round', v_round);
  end;

  return jsonb_build_object('ok', true, 'round', v_round);
end;
$$;

-- ── 학생 상태: 공개 payload 통일 ──
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
    'status', s.status, 'currentSlide', s.current_slide,
    'currentActivity', cur, 'revealedAggregates', agg);
end;
$$;

-- ── 참가: 내 학번 포함 (기명 모드 재접속 판단용) ──
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
    'myStudentNo', p.student_no,
    'currentActivity', cur,
    'myResponses', coalesce((
      select jsonb_agg(jsonb_build_object('activityId', r.activity_id, 'round', r.round))
      from live_presentation_responses r where r.participant_id = p.id), '[]'::jsonb)
  );
end;
$$;

-- ── 교사 상태: 라운드별 응답 수 + 2차 집계 ──
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
                                  'nameMode', s.name_mode, 'deckPath', s.deck_path),
    'participantCount', (select count(*) from live_presentation_participants where session_id = s.id),
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

-- ── 실행 권한 재정비 (신규 lp_advance_round 포함) ──
do $$
declare fn record;
begin
  for fn in
    select p.oid::regprocedure as sig, p.proname
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and (p.proname like 'lp\_%' escape '\' or p.proname like 'live\_presentation\_\_%' escape '\')
  loop
    execute format('revoke all on function %s from public', fn.sig);
    if fn.proname like 'lp\_%' escape '\' then
      execute format('grant execute on function %s to anon, authenticated', fn.sig);
    end if;
  end loop;
end $$;
