-- ============================================================
-- live_presentation_* v4 — 학생 미러링 지원
--   lp_join / lp_student_state 응답에 deckPath 추가
--   (학생 참여 페이지가 호스트의 덱을 iframe으로 미러링하고
--    currentSlide로 현재 슬라이드를 따라가기 위함)
-- ============================================================

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
    'currentActivity', cur, 'revealedAggregates', agg);
end;
$$;

-- 실행 권한 재정비
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
