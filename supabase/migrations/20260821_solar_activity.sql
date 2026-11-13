-- ============================================================
-- solar_* — 활동지 「글의 설계도 되찾기」용 Solar Pro 2 호출 제한
--
--   Edge Function 'solar'가 Upstage Solar Pro 2를 대신 불러 준다. 키와
--   시스템 프롬프트를 서버에 두기 위한 구조이며, 학생 브라우저는 함수만
--   부른다. 그런데 anon 키는 app/runtime/config.js에 공개되어 있으므로
--   함수 자체는 누구나 부를 수 있다. 그래서 브라우저별 일일 호출 상한을
--   여기에서 센다.
--
--   테이블은 deny-all RLS로 잠그고, Edge Function이 service_role로만
--   접근한다 (live_presentation_* 와 같은 원칙).
-- ============================================================

create table if not exists solar_usage (
  client_id text not null,
  day       date not null,
  calls     int  not null default 0,
  primary key (client_id, day)
);

alter table solar_usage enable row level security;
-- 정책을 하나도 만들지 않는다 = anon/authenticated 모두 접근 불가

-- 오래된 기록은 쌓아 둘 이유가 없다 (수업일 기준 조회만 한다)
create index if not exists solar_usage_day_idx on solar_usage (day);

-- ── 호출 1회를 기록하고 상한 초과 여부를 돌려준다 ──
--    한국 시간 기준 날짜로 센다 (수업이 오전에 열린다).
create or replace function solar_bump_usage(p_client_id text, p_limit int)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  d date := (now() at time zone 'Asia/Seoul')::date;
  n int;
begin
  if p_client_id is null or length(p_client_id) < 8 then
    return jsonb_build_object('allowed', false, 'calls', 0, 'reason', 'bad_client');
  end if;

  insert into solar_usage (client_id, day, calls)
  values (p_client_id, d, 1)
  on conflict (client_id, day)
  do update set calls = solar_usage.calls + 1
  returning calls into n;

  return jsonb_build_object('allowed', n <= p_limit, 'calls', n, 'limit', p_limit);
end;
$$;

revoke all on function solar_bump_usage(text, int) from public, anon, authenticated;

-- ── 수업이 끝난 뒤 정리용 (교사가 필요할 때 직접 실행) ──
--    delete from solar_usage where day < current_date - 7;
