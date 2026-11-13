-- ============================================================
-- live_presentation_* v5 — 문항 진행 파이프라인 정비
--   교사 진행 순서: 1) 열기 → 2) 결과 공개 → 3) 마감 → 4) 다시 열기(선택)
--   1) lp_close_activity: revealed 상태에서도 마감 허용
--      → 공개된 결과를 교사가 학생 화면에서 끌 수 있게 됨 (기존: open에서만 마감)
--   2) activities.revealed_at: 공개 이력 — 마감된 문항의 [결과 공개]와
--      [다시 공개](이미 한 번 공개함)를 UI가 구분하는 근거
--   3) lp_open_activity / lp_advance_round: 재열기 시 revealed_at 초기화 (새 사이클)
--   4) lp_host_state: revealedAt 노출
-- ============================================================

alter table live_presentation_activities
  add column if not exists revealed_at timestamptz;

-- ── 마감 v5: open·revealed 어디서든 마감 가능 (학생 화면 결과 표시 종료) ──
create or replace function lp_close_activity(p_session_id uuid, p_host_token uuid, p_activity_id uuid)
returns void
language plpgsql
security definer set search_path = public, extensions
as $$
begin
  perform live_presentation__auth_host(p_session_id, p_host_token);
  update live_presentation_activities
     set status = 'closed', closed_at = coalesce(closed_at, now())
   where id = p_activity_id and session_id = p_session_id
     and status in ('open','revealed');
end;
$$;

-- ── 공개 v5: revealed_at 기록 (최초 공개 시각 유지) ──
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
     set status = 'revealed',
         closed_at = coalesce(closed_at, now()),
         revealed_at = coalesce(revealed_at, now())
   where id = p_activity_id and session_id = p_session_id
  returning * into a;
  if not found then raise exception 'LP: activity not found'; end if;
  return live_presentation__reveal_payload(a);
end;
$$;

-- ── 열기 v5: 재열기 시 revealed_at 초기화 (공개 이력 리셋 — 새 진행 사이클) ──
create or replace function lp_open_activity(
  p_session_id uuid, p_host_token uuid, p_slide_key text,
  p_slide_index int, p_kind text, p_prompt text, p_config jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  a live_presentation_activities;
begin
  perform live_presentation__auth_host(p_session_id, p_host_token);
  insert into live_presentation_activities
         (session_id, slide_key, slide_index, kind, prompt, config, status, opened_at)
  values (p_session_id, p_slide_key, p_slide_index, p_kind, p_prompt, coalesce(p_config,'{}'::jsonb), 'open', now())
  on conflict (session_id, slide_key) do update
     set status = 'open', opened_at = now(), closed_at = null, revealed_at = null,
         prompt = excluded.prompt, config = excluded.config, slide_index = excluded.slide_index
  returning * into a;
  return live_presentation__activity_public(a);
end;
$$;

-- ── 2차 투표 v5: 새 라운드 시작 시 revealed_at 초기화 ──
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
     set current_round = 2, status = 'open', opened_at = now(), closed_at = null, revealed_at = null
   where id = p_activity_id and session_id = p_session_id
  returning * into a;
  if not found then raise exception 'LP: activity not found'; end if;
  return live_presentation__activity_public(a);
end;
$$;

-- ── 교사 상태 v5: revealedAt 포함 ──
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

-- ── 실행 권한 재정비 ──
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
