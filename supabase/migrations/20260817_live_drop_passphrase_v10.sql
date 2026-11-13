-- ============================================================
-- live_presentation_* v10 — 세션 생성 비밀구절 기능 삭제
--
--   v9는 config 스위치(host_passphrase_required)로 검증을 옵트인화했지만,
--   운영 DB가 v9 이전이거나 스위치가 켜져 있으면 콘솔이 여전히 비밀구절을
--   요구한다. 교사 콘솔에서 비밀구절 UI를 제거하면서 서버 게이트도 함께
--   삭제한다 — lp_create_session 은 더 이상 어떤 경우에도 검증하지 않는다.
--
--   p_passphrase 파라미터는 구 클라이언트(캐시된 classic 페이지·기존
--   테스트)가 계속 보내므로 시그니처에는 남기고 무시한다.
--
--   ⚠ anon 키를 아는 누구나 세션을 만들 수 있다(v9 기본 상태와 동일).
--     세션 조작(슬라이드·문항·종료·내보내기)은 여전히 host_token 게이트.
-- ============================================================

-- v9 미적용 DB에 남아 있을 수 있는 구버전 오버로드 정리 (PostgREST 모호성 방지)
drop function if exists lp_create_session(text, text, text, text);

create or replace function lp_create_session(
  p_passphrase text default null, p_title text default '', p_deck_path text default null,
  p_name_mode text default 'anonymous', p_gamify boolean default false
) returns jsonb
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  new_code text;
  s live_presentation_sessions;
  attempts int := 0;
begin
  -- v10: 비밀구절 검증 없음 (p_passphrase 는 구 클라이언트 호환용으로만 존재)
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

-- 비밀구절 관련 config 행 제거 (검증 스위치·해시 모두 — 기능 자체가 없어졌다)
delete from live_presentation_config
 where key in ('host_passphrase_required', 'host_passphrase_hash');

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
