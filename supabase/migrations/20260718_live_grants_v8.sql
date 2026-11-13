-- ============================================================
-- live_presentation_* v8 — 내부 헬퍼 실행 권한 교정
--   v1~v7의 revoke 루프는 `from public`(PUBLIC 의사 역할)만 회수했는데,
--   Supabase는 default privileges로 public 스키마의 새 함수에
--   anon/authenticated 실행 권한을 **직접** 부여한다 → 헬퍼가 anon 호출
--   가능한 채 남음 (get_advisors WARN으로 발견).
--   __aggregate/__leaderboard는 uuid 인자라 REST로 직접 호출 시
--   공개 전 결과·리더보드가 노출됨 — 의도("내부 헬퍼 — anon 실행 권한
--   없음")대로 lp_* 게이트웨이만 anon 허용으로 재정비.
--   (헬퍼는 security definer lp_* 내부에서 owner 권한으로 호출되므로
--    anon 회수가 정상 경로를 깨지 않는다.)
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
    execute format('revoke all on function %s from public, anon, authenticated', fn.sig);
    if fn.proname like 'lp\_%' escape '\' then
      execute format('grant execute on function %s to anon, authenticated', fn.sig);
    end if;
  end loop;
end $$;
