-- ============================================================
-- live_presentation_* : 실시간 수업 참여(퀴즈) 스키마 v1
-- 공유 운영 DB이므로 격리 원칙:
--   1) 모든 객체는 live_presentation_ 접두사
--   2) 모든 테이블 RLS 활성 + 정책 없음(deny-all) → 클라이언트 직접 접근 전면 차단
--   3) 접근은 security definer RPC(lp_*)로만 — 교사는 host_token, 세션 생성은 passphrase 검증
--   4) realtime publication 사용 안 함 (broadcast/presence + RPC 폴링만)
-- ============================================================

create extension if not exists pgcrypto;

-- ── 설정 (교사 passphrase 해시 저장; 클라이언트 접근 불가) ──
create table if not exists live_presentation_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
alter table live_presentation_config enable row level security;

-- ── 세션 ──
create table if not exists live_presentation_sessions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  host_token uuid not null default gen_random_uuid(),  -- RPC 외부로 절대 노출 금지(교사에게만 반환)
  title text not null default '',
  deck_path text,
  status text not null default 'open' check (status in ('open','ended')),
  current_slide int not null default 0,
  name_mode text not null default 'anonymous' check (name_mode in ('anonymous','named')),
  created_at timestamptz not null default now(),
  ended_at timestamptz
);
alter table live_presentation_sessions enable row level security;

-- ── 참가자 (client_id = 학생 브라우저 localStorage UUID, 재접속 복구용) ──
create table if not exists live_presentation_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references live_presentation_sessions(id) on delete cascade,
  client_id uuid not null,
  nickname text not null default '',
  student_no text,
  joined_at timestamptz not null default now(),
  unique (session_id, client_id)
);
alter table live_presentation_participants enable row level security;

-- ── 활동(문항) ──
create table if not exists live_presentation_activities (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references live_presentation_sessions(id) on delete cascade,
  slide_key text not null,          -- 덱 슬라이드 식별자 (재열기 idempotency 기준)
  slide_index int,
  kind text not null check (kind in ('choice','ox','short','wordcloud','exit','code')),
  prompt text not null,
  config jsonb not null default '{}'::jsonb,   -- {options, answer, misconceptions, peerInstruction, ...}
  status text not null default 'draft' check (status in ('draft','open','closed','revealed')),
  opened_at timestamptz,
  closed_at timestamptz,
  unique (session_id, slide_key)
);
alter table live_presentation_activities enable row level security;
create index if not exists live_presentation_activities_session_idx
  on live_presentation_activities(session_id);

-- ── 응답 (round: Peer Instruction 1·2차) ──
create table if not exists live_presentation_responses (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references live_presentation_activities(id) on delete cascade,
  session_id uuid not null references live_presentation_sessions(id) on delete cascade,
  participant_id uuid not null references live_presentation_participants(id) on delete cascade,
  round int not null default 1,
  payload jsonb not null,
  is_correct boolean,               -- 서버(lp_submit)에서 계산 — 클라이언트 변조 불가
  created_at timestamptz not null default now(),
  unique (activity_id, participant_id, round)
);
alter table live_presentation_responses enable row level security;
create index if not exists live_presentation_responses_activity_idx
  on live_presentation_responses(activity_id);
create index if not exists live_presentation_responses_session_idx
  on live_presentation_responses(session_id);

-- ============================================================
-- 내부 헬퍼 (RPC 아님 — anon 실행 권한 없음)
-- ============================================================

-- 세션 코드 생성: 혼동 문자 제외 30자 집합에서 6자
create or replace function live_presentation__gen_code()
returns text
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  chars constant text := '23456789ACDEFGHJKMNPQRSTUVWXYZ';
  result text := '';
  i int;
begin
  for i in 1..6 loop
    result := result || substr(chars, (floor(random() * 30) + 1)::int, 1);
  end loop;
  return result;
end;
$$;

-- host_token 검증 → 세션 row 반환 (실패 시 예외)
create or replace function live_presentation__auth_host(p_session_id uuid, p_host_token uuid)
returns live_presentation_sessions
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  s live_presentation_sessions;
begin
  select * into s from live_presentation_sessions
   where id = p_session_id and host_token = p_host_token;
  if not found then
    raise exception 'LP_AUTH: invalid session or host token';
  end if;
  return s;
end;
$$;

-- 문항 집계 (교사용 전체 / 공개용은 동일 구조 사용)
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
  else
    -- short/wordcloud/exit/code: 텍스트 나열 (최대 200개, 각 300자 절단)
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

-- 학생에게 안전한 문항 JSON (정답·오개념 라벨 제거)
create or replace function live_presentation__activity_public(a live_presentation_activities)
returns jsonb
language sql
security definer set search_path = public, extensions
as $$
  select jsonb_build_object(
    'id', a.id, 'kind', a.kind, 'prompt', a.prompt, 'status', a.status,
    'slideKey', a.slide_key,
    'config', (a.config - 'answer' - 'misconceptions')
  );
$$;

-- ============================================================
-- 교사(호스트) RPC — passphrase / host_token 게이트
-- ============================================================

create or replace function lp_create_session(
  p_passphrase text, p_title text, p_deck_path text default null,
  p_name_mode text default 'anonymous'
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
      insert into live_presentation_sessions (code, title, deck_path, name_mode)
      values (new_code, coalesce(p_title,''), p_deck_path,
              case when p_name_mode in ('anonymous','named') then p_name_mode else 'anonymous' end)
      returning * into s;
      exit;
    exception when unique_violation then
      if attempts >= 5 then raise; end if;
    end;
  end loop;

  return jsonb_build_object('sessionId', s.id, 'code', s.code, 'hostToken', s.host_token,
                            'title', s.title, 'nameMode', s.name_mode);
end;
$$;

-- 코드로 세션 재개 (새로고침 복구; host_token 필요)
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
                            'deckPath', s.deck_path);
end;
$$;

create or replace function lp_set_slide(p_session_id uuid, p_host_token uuid, p_slide_index int)
returns void
language plpgsql
security definer set search_path = public, extensions
as $$
begin
  perform live_presentation__auth_host(p_session_id, p_host_token);
  update live_presentation_sessions set current_slide = p_slide_index where id = p_session_id;
end;
$$;

-- 문항 열기 (slide_key 기준 idempotent: 재열기 시 기존 문항 재사용)
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
     set status = 'open', opened_at = now(), closed_at = null,
         prompt = excluded.prompt, config = excluded.config, slide_index = excluded.slide_index
  returning * into a;
  return live_presentation__activity_public(a);
end;
$$;

create or replace function lp_close_activity(p_session_id uuid, p_host_token uuid, p_activity_id uuid)
returns void
language plpgsql
security definer set search_path = public, extensions
as $$
begin
  perform live_presentation__auth_host(p_session_id, p_host_token);
  update live_presentation_activities
     set status = 'closed', closed_at = now()
   where id = p_activity_id and session_id = p_session_id and status = 'open';
end;
$$;

-- 결과 공개: status→revealed + 공개용 집계 반환 (choice/ox는 정답 포함)
create or replace function lp_reveal_activity(p_session_id uuid, p_host_token uuid, p_activity_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  a live_presentation_activities;
  agg jsonb;
begin
  perform live_presentation__auth_host(p_session_id, p_host_token);
  update live_presentation_activities
     set status = 'revealed', closed_at = coalesce(closed_at, now())
   where id = p_activity_id and session_id = p_session_id
  returning * into a;
  if not found then raise exception 'LP: activity not found'; end if;
  agg := live_presentation__aggregate(p_activity_id, 1);
  if a.kind in ('choice','ox') and a.config ? 'answer' then
    agg := agg || jsonb_build_object('answer', a.config->'answer');
  end if;
  return agg;
end;
$$;

create or replace function lp_end_session(p_session_id uuid, p_host_token uuid)
returns void
language plpgsql
security definer set search_path = public, extensions
as $$
begin
  perform live_presentation__auth_host(p_session_id, p_host_token);
  update live_presentation_sessions
     set status = 'ended', ended_at = now()
   where id = p_session_id and status = 'open';
end;
$$;

-- 교사 폴링 엔드포인트: 참가자 + 문항 + 집계 전체 상태
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
                                  'responseCount', (select count(*) from live_presentation_responses r
                                                     where r.activity_id = a.id),
                                  'aggregates', live_presentation__aggregate(a.id, 1))
               order by a.opened_at nulls last)
      from live_presentation_activities a where a.session_id = s.id), '[]'::jsonb)
  );
end;
$$;

-- 세션 전체 데이터 내보내기 (학생별 응답 원문 포함 — Phase 3 xlsx export의 원천)
create or replace function lp_export_session(p_session_id uuid, p_host_token uuid)
returns jsonb
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  s live_presentation_sessions;
begin
  s := live_presentation__auth_host(p_session_id, p_host_token);
  return jsonb_build_object(
    'session', to_jsonb(s) - 'host_token',
    'participants', coalesce((select jsonb_agg(to_jsonb(p) order by p.joined_at)
      from live_presentation_participants p where p.session_id = s.id), '[]'::jsonb),
    'activities', coalesce((select jsonb_agg(to_jsonb(a) order by a.opened_at nulls last)
      from live_presentation_activities a where a.session_id = s.id), '[]'::jsonb),
    'responses', coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at)
      from live_presentation_responses r where r.session_id = s.id), '[]'::jsonb)
  );
end;
$$;

-- ============================================================
-- 학생 RPC — 세션 코드 기반
-- ============================================================

-- 참가 (재접속 시 동일 client_id면 기존 참가자 반환)
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

  -- 현재 열려 있거나 공개된 문항 (늦게 들어온 학생 동기화)
  select live_presentation__activity_public(a) into cur
    from live_presentation_activities a
   where a.session_id = s.id and a.status in ('open','revealed')
   order by a.opened_at desc nulls last limit 1;

  return jsonb_build_object(
    'sessionId', s.id, 'code', s.code, 'title', s.title, 'nameMode', s.name_mode,
    'participantId', p.id, 'currentSlide', s.current_slide,
    'currentActivity', cur,
    'myResponses', coalesce((
      select jsonb_agg(jsonb_build_object('activityId', r.activity_id, 'round', r.round))
      from live_presentation_responses r where r.participant_id = p.id), '[]'::jsonb)
  );
end;
$$;

-- 응답 제출 (서버 채점, 1인 1응답, 열린 문항에만)
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
  correct boolean;
begin
  if pg_column_size(p_payload) > 20000 then
    raise exception 'LP_SUBMIT: payload too large';
  end if;

  select * into a from live_presentation_activities where id = p_activity_id;
  if not found or a.status <> 'open' then
    return jsonb_build_object('ok', false, 'reason', 'not_open');
  end if;

  -- participant 소유 검증: client_id 일치해야 함 (participant_id 도용 방지)
  select * into p from live_presentation_participants
   where id = p_participant_id and session_id = a.session_id and client_id = p_client_id;
  if not found then raise exception 'LP_SUBMIT: invalid participant'; end if;

  -- 서버 측 채점
  if a.kind = 'choice' and a.config ? 'answer' then
    correct := (p_payload->>'choice')::int = (a.config->>'answer')::int;
  elsif a.kind = 'ox' and a.config ? 'answer' then
    correct := (p_payload->>'ox')::boolean = (a.config->>'answer')::boolean;
  else
    correct := null;
  end if;

  begin
    insert into live_presentation_responses (activity_id, session_id, participant_id, round, payload, is_correct)
    values (p_activity_id, a.session_id, p_participant_id, greatest(1, p_round), p_payload, correct);
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'reason', 'duplicate');
  end;

  return jsonb_build_object('ok', true);
end;
$$;

-- 학생 상태 조회 (재접속/broadcast 유실 대비 폴백; 공개된 경우에만 집계 포함)
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
      agg := live_presentation__aggregate(a.id, 1);
      if a.kind in ('choice','ox') and a.config ? 'answer' then
        agg := agg || jsonb_build_object('answer', a.config->'answer');
      end if;
    end if;
  end if;

  return jsonb_build_object(
    'status', s.status, 'currentSlide', s.current_slide,
    'currentActivity', cur, 'revealedAggregates', agg);
end;
$$;

-- ============================================================
-- 실행 권한: PUBLIC 기본 실행권 제거 후 anon/authenticated에 lp_* 만 부여
-- ============================================================
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
