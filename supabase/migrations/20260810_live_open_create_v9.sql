-- ============================================================
-- live_presentation_* v9 — 세션 생성 비밀구절 "선택제"
--
--   v1~v8: lp_create_session 이 항상 host_passphrase_hash 와 대조 → 비밀구절
--   없이는 세션을 만들 수 없었다. 교사가 매번 ⚙ 설정에 구절을 넣어야 해서
--   실사용 마찰이 컸다.
--
--   v9: 검증 여부를 config 스위치로 뺀다.
--     live_presentation_config('host_passphrase_required') = 'true' 일 때만 검증.
--     행이 없으면(= 기본값) 비밀구절 없이 세션 생성 가능.
--
--   ⚠ 열어 두면 anon 키를 아는 누구나 세션을 만들 수 있다(스팸 가능).
--     다시 잠그려면 아래 한 줄이면 된다:
--       insert into live_presentation_config(key, value)
--       values ('host_passphrase_required', 'true')
--       on conflict (key) do update set value = excluded.value;
--     (해제는 value = 'false' 또는 해당 행 삭제)
--
--   host_passphrase_hash 행은 지우지 않는다 — 다시 잠글 때 그대로 쓰인다.
--   세션 조작(슬라이드·문항·종료)은 여전히 host_token 게이트라 변화 없음.
-- ============================================================

-- 시그니처가 동일하므로 create or replace 로 충분하지만, v7에서 만든
-- 오버로드가 남아 있으면 PostgREST가 모호성 오류를 내므로 구버전을 먼저 정리한다.
drop function if exists lp_create_session(text, text, text, text);

create or replace function lp_create_session(
  p_passphrase text default null, p_title text default '', p_deck_path text default null,
  p_name_mode text default 'anonymous', p_gamify boolean default false
) returns jsonb
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  need boolean;
  stored text;
  new_code text;
  s live_presentation_sessions;
  attempts int := 0;
begin
  -- 비밀구절 게이트는 옵트인 — 스위치가 켜져 있을 때만 검증한다
  select value = 'true' into need
    from live_presentation_config where key = 'host_passphrase_required';

  if coalesce(need, false) then
    select value into stored from live_presentation_config where key = 'host_passphrase_hash';
    if stored is null or p_passphrase is null or stored <> crypt(p_passphrase, stored) then
      perform pg_sleep(0.5);   -- 무차별 대입 지연
      raise exception 'LP_AUTH: invalid passphrase';
    end if;
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

-- ── 실행 권한 재정비 (v8과 동일 규칙 — 함수를 다시 만들면 default privileges가
--    anon/authenticated 에 다시 붙으므로 lp_* 게이트웨이만 남기고 회수) ──
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
