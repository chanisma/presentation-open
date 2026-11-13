-- ============================================================
-- live_presentation_* v3 — Phase 5 코드 실행 참여
--   1) 집계에 code 분기: 통과 개수 히스토그램 + 테스트케이스별 통과율
--   2) lp_code_submissions: 교사용 제출 코드 열람 (host_token 게이트)
--   3) lp_submit: code 문항은 재제출 허용 (최신 제출로 갱신 — 반복 개선 장려)
-- ============================================================

-- ── 집계 v3: code 분기 추가 ──
create or replace function live_presentation__aggregate(p_activity_id uuid, p_round int default 1)
returns jsonb
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  a live_presentation_activities;
  agg jsonb;
  total int;
  test_count int;
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
  elsif a.kind = 'code' then
    -- 채점형(payload.total 보유) 제출 기준 히스토그램/케이스 통과율
    select coalesce(max((payload->>'total')::int), 0) into test_count
      from live_presentation_responses
     where activity_id = p_activity_id and round = p_round and payload ? 'total';

    select jsonb_build_object(
      'kind','code','total',total,'testCount',test_count,
      'histogram', case when test_count > 0 then coalesce((
        select jsonb_agg(cnt order by p)
        from (
          select gs.p, count(r.id) as cnt
          from generate_series(0, test_count) gs(p)
          left join live_presentation_responses r
            on r.activity_id = p_activity_id and r.round = p_round
           and (r.payload->>'passed')::int = gs.p
          group by gs.p
        ) t
      ), '[]'::jsonb) else '[]'::jsonb end,
      'caseRates', case when test_count > 0 then coalesce((
        select jsonb_agg(rate order by idx)
        from (
          select idx,
                 round(100.0 * count(*) filter (where (r.payload->'results'->idx->>'ok')::boolean)
                       / nullif(count(*), 0)) as rate
          from live_presentation_responses r,
               lateral generate_series(0, jsonb_array_length(r.payload->'results') - 1) idx
          where r.activity_id = p_activity_id and r.round = p_round and r.payload ? 'results'
          group by idx
        ) t
      ), '[]'::jsonb) else '[]'::jsonb end)
    into agg;
  else
    -- short / wordcloud: 텍스트 나열
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

-- ── 교사용 제출 코드 열람 (우수작 프로젝터 송출의 데이터 소스) ──
create or replace function lp_code_submissions(p_session_id uuid, p_host_token uuid, p_activity_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public, extensions
as $$
begin
  perform live_presentation__auth_host(p_session_id, p_host_token);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'nickname', p.nickname, 'studentNo', p.student_no,
             'passed', (r.payload->>'passed')::int, 'total', (r.payload->>'total')::int,
             'code', left(r.payload->>'code', 8000),
             'submittedAt', r.created_at)
           order by (r.payload->>'passed')::int desc nulls last, r.created_at)
    from live_presentation_responses r
    join live_presentation_participants p on p.id = r.participant_id
    where r.activity_id = p_activity_id
      and r.session_id = p_session_id
  ), '[]'::jsonb);
end;
$$;

-- ── 제출 v3: code 문항은 재제출 허용 (최신 제출로 갱신) ──
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
    if a.kind = 'code' then
      -- 반복 개선 장려: 최신 코드로 갱신
      update live_presentation_responses
         set payload = p_payload, is_correct = correct, created_at = now()
       where activity_id = p_activity_id and participant_id = p_participant_id and round = v_round;
      return jsonb_build_object('ok', true, 'round', v_round, 'updated', true);
    end if;
    return jsonb_build_object('ok', false, 'reason', 'duplicate', 'round', v_round);
  end;

  return jsonb_build_object('ok', true, 'round', v_round);
end;
$$;

-- ── 실행 권한 재정비 (신규 lp_code_submissions 포함) ──
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
