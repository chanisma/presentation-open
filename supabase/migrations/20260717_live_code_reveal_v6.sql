-- ============================================================
-- live_presentation_* v6 — 코드 문항 모범 답안(solution) 지원
--   live.json code 문항에 "solution"(모범 답안) 필드 도입.
--   모범 답안은 호스트 결과 화면 전용 — 학생에게 가는 공개용 문항 JSON에서
--   answer·misconceptions와 같은 방식으로 서버가 제거한다.
-- ============================================================

create or replace function live_presentation__activity_public(a live_presentation_activities)
returns jsonb
language sql
security definer set search_path = public, extensions
as $$
  select jsonb_build_object(
    'id', a.id, 'kind', a.kind, 'prompt', a.prompt, 'status', a.status,
    'slideKey', a.slide_key, 'round', a.current_round,
    'config', (a.config - 'answer' - 'misconceptions' - 'solution')
  );
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
