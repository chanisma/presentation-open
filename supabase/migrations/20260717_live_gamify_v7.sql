-- ============================================================
-- live_presentation_* v7 — gamification (스피드 퀴즈, 세션 단위)
--   gamify는 **세션 생성 시 옵션** (문항 개별 설정 아님).
--   gamify 세션에서는 정답(answer)이 있는 choice/ox 문항이 자동으로 점수 대상:
--     정답 기본 500점 + 속도 보너스 (정답 제출 순위 기반)
--     보너스 = greatest(50, 500 - (순위-1)*50) → 1등 1000, 2등 950, … 11등부터 550
--     오답·정답 없는 문항·code 문항(재제출 허용이라 제외)은 0점
--   gamify 세션의 [결과 공개] payload에는 항상 세션 누적 탑5 리더보드 동봉
--   → 교사·학생 결과 화면에 탑5 표시.
-- ============================================================

alter table live_presentation_responses
  add column if not exists score int not null default 0;

alter table live_presentation_sessions
  add column if not exists gamify boolean not null default false;

-- ── 세션 생성 v7: p_gamify 옵션 (시그니처 변경 — 구버전 오버로드 제거 필수) ──
drop function if exists lp_create_session(text, text, text, text);
create or replace function lp_create_session(
  p_passphrase text, p_title text, p_deck_path text default null,
  p_name_mode text default 'anonymous', p_gamify boolean default false
) returns jsonb
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  stored text;
  new_code text;
  s live_presentation_sessions;
  attempts int := 0;
begin
  select value into stored from live_presentation_config where key = 'host_passphrase_hash';
  if stored is null or stored <> crypt(p_passphrase, stored) then
    perform pg_sleep(0.5);   -- 무차별 대입 지연
    raise exception 'LP_AUTH: invalid passphrase';
  end if;

  loop
    attempts := attempts + 1;
    new_code := live_presentation__gen_code();
    begin
      insert into live_presentation_sessions (code, title, deck_path, name_mode, gamify)
      values (new_code, coalesce(p_title,''), p_deck_path,
              case when p_name_mode in ('anonymous','named') then p_name_mode else 'anonymous' end,
              coalesce(p_gamify, false))
      returning * into s;
      exit;
    exception when unique_violation then
      if attempts >= 5 then raise; end if;
    end;
  end loop;

  return jsonb_build_object('sessionId', s.id, 'code', s.code, 'hostToken', s.host_token,
                            'title', s.title, 'nameMode', s.name_mode, 'gamify', s.gamify);
end;
$$;

-- ── 세션 재개 v7: gamify 포함 ──
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
                            'deckPath', s.deck_path, 'gamify', s.gamify);
end;
$$;

-- ── 학생용 문항 JSON v7: 점수 대상 문항이면 gamify 표식 (⚡ 배너용) ──
--    (v6의 solution 제거 유지 — answer·misconceptions·solution은 학생 비전송)
create or replace function live_presentation__activity_public(a live_presentation_activities)
returns jsonb
language sql
security definer set search_path = public, extensions
as $$
  select jsonb_build_object(
    'id', a.id, 'kind', a.kind, 'prompt', a.prompt, 'status', a.status,
    'slideKey', a.slide_key, 'round', a.current_round,
    'gamify', (a.kind in ('choice','ox') and a.config ? 'answer'
               and exists (select 1 from live_presentation_sessions s
                            where s.id = a.session_id and s.gamify)),
    'config', (a.config - 'answer' - 'misconceptions' - 'solution')
  );
$$;

-- ── 세션 누적 리더보드 탑5 (내부 헬퍼 — anon 실행 권한 없음) ──
create or replace function live_presentation__leaderboard(p_session_id uuid)
returns jsonb
language sql
security definer set search_path = public, extensions
as $$
  select coalesce((
    select jsonb_agg(jsonb_build_object(
             'nickname', t.nickname, 'studentNo', t.student_no, 'score', t.score)
           order by t.score desc, t.first_at)
    from (
      select p.nickname, p.student_no, sum(r.score)::int as score,
             min(r.created_at) as first_at
      from live_presentation_responses r
      join live_presentation_participants p on p.id = r.participant_id
      where r.session_id = p_session_id and r.score > 0
      group by p.id, p.nickname, p.student_no
      order by sum(r.score) desc, min(r.created_at)
      limit 5
    ) t
  ), '[]'::jsonb);
$$;

-- ── 제출 v7: gamify 세션이면 서버가 점수 계산 (v3의 code 재제출 upsert 유지) ──
create or replace function lp_submit(
  p_activity_id uuid, p_participant_id uuid, p_client_id uuid,
  p_payload jsonb, p_round int default 1
) returns jsonb
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  a live_presentation_activities;
  s live_presentation_sessions;
  p live_presentation_participants;
  v_round int;
  correct boolean;
  v_score int := 0;
  v_prev_correct int;
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

  -- gamify 세션: 정답 500 + 속도 보너스(정답 제출 순위, 라운드별 독립)
  if correct is true then
    select * into s from live_presentation_sessions where id = a.session_id;
    if s.gamify then
      select count(*) into v_prev_correct from live_presentation_responses
       where activity_id = p_activity_id and round = v_round and is_correct is true;
      v_score := 500 + greatest(50, 500 - v_prev_correct * 50);
    end if;
  end if;

  begin
    insert into live_presentation_responses
           (activity_id, session_id, participant_id, round, payload, is_correct, score)
    values (p_activity_id, a.session_id, p_participant_id, v_round, p_payload, correct, v_score);
  exception when unique_violation then
    if a.kind = 'code' then
      -- 반복 개선 장려: 최신 코드로 갱신 (code는 gamify 채점 제외 — score 0 유지)
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

-- ── 공개 payload v7: gamify 세션이면 항상 세션 누적 탑5 동봉 ──
create or replace function live_presentation__reveal_payload(a live_presentation_activities)
returns jsonb
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  agg jsonb;
  r1 jsonb;
  r2 jsonb;
  v_gamify boolean;
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
  select gamify into v_gamify from live_presentation_sessions where id = a.session_id;
  if coalesce(v_gamify, false) then
    agg := agg || jsonb_build_object('leaderboard', live_presentation__leaderboard(a.session_id));
  end if;
  return agg;
end;
$$;

-- ── 교사 상태 v7: session.gamify + 세션 리더보드 (v5의 revealedAt 유지) ──
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
                                  'gamify', s.gamify),
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
