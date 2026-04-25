-- Realign booking ID generator sequence to current data (safe, additive)
begin;

create sequence if not exists public.booking_request_running_no_seq start 1;

create or replace function public.next_booking_request_id()
returns text
language plpgsql
as $$
declare
  running_no bigint;
  suffix char(1);
  year_part text;
begin
  running_no := nextval('public.booking_request_running_no_seq');
  suffix := chr(65 + ((running_no - 1) % 26));
  year_part := to_char(now() at time zone 'Asia/Kolkata', 'YY');

  return year_part || 'FAB' || lpad(running_no::text, 3, '0') || suffix;
end;
$$;

do $$
declare
  max_existing bigint;
begin
  select max((regexp_match(coalesce(booking_id, request_number, ''), '^\\d{2}FAB(\\d+)[A-Z]$'))[1]::bigint)
    into max_existing
  from public.booking_requests
  where coalesce(booking_id, request_number, '') ~ '^\\d{2}FAB\\d+[A-Z]$';

  if max_existing is null then
    perform setval('public.booking_request_running_no_seq', 1, false);
  else
    perform setval('public.booking_request_running_no_seq', max_existing, true);
  end if;
end $$;

create or replace function public.booking_requests_assign_booking_id()
returns trigger
language plpgsql
as $$
begin
  if new.booking_id is null or btrim(new.booking_id) = '' then
    new.booking_id := public.next_booking_request_id();
  end if;

  if new.request_number is null or btrim(new.request_number) = '' then
    new.request_number := new.booking_id;
  end if;

  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'trg_booking_requests_assign_booking_id'
      and tgrelid = 'public.booking_requests'::regclass
  ) then
    create trigger trg_booking_requests_assign_booking_id
    before insert on public.booking_requests
    for each row
    execute function public.booking_requests_assign_booking_id();
  end if;
end $$;

commit;
