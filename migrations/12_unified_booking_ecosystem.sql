-- Unified booking ecosystem (additive only; no deletes/drops)
begin;

create extension if not exists pgcrypto;

-- =========================
-- booking_requests hardening
-- =========================
alter table if exists public.booking_requests
  add column if not exists booking_id text,
  add column if not exists customer_id text,
  add column if not exists converted_at timestamptz,
  add column if not exists conversion_note text,
  add column if not exists requested_services jsonb default '[]'::jsonb,
  add column if not exists delivery_preference text,
  add column if not exists weather_snapshot jsonb default '{}'::jsonb,
  add column if not exists ai_suggestions jsonb default '[]'::jsonb;

create unique index if not exists idx_booking_requests_booking_id_unique
  on public.booking_requests(booking_id)
  where booking_id is not null;

create index if not exists idx_booking_requests_customer_id on public.booking_requests(customer_id);
create index if not exists idx_booking_requests_source on public.booking_requests(source);
create index if not exists idx_booking_requests_channel on public.booking_requests(channel);

-- Booking ID generator: YYFABNNN<suffix>, suffix cycles A-Z from sequence
create sequence if not exists public.booking_request_running_no_seq start 1;

do $$
declare
  max_existing bigint;
begin
  select max((regexp_match(coalesce(booking_id, request_number, ''), '^\d{2}FAB(\d+)[A-Z]$'))[1]::bigint)
    into max_existing
  from public.booking_requests
  where coalesce(booking_id, request_number, '') ~ '^\d{2}FAB\d+[A-Z]$';

  if max_existing is not null and max_existing > 0 then
    perform setval('public.booking_request_running_no_seq', max_existing, true);
  end if;
end $$;

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

-- ====================
-- booking request items
-- ====================
create table if not exists public.booking_request_items (
  id uuid primary key default gen_random_uuid(),
  booking_request_id uuid not null references public.booking_requests(id) on delete cascade,
  line_no integer not null default 1,
  service_name text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0,
  total_price numeric(12,2) not null default 0,
  remarks text,
  created_at timestamptz not null default now()
);

create index if not exists idx_booking_request_items_booking_id
  on public.booking_request_items(booking_request_id);

-- ==================
-- customer addresses
-- ==================
create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id text not null,
  label text not null default 'Home',
  recipient_name text,
  phone text,
  line1 text not null,
  line2 text,
  city text,
  state text,
  pincode text,
  country text default 'India',
  landmark text,
  latitude double precision,
  longitude double precision,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customer_addresses_customer on public.customer_addresses(customer_id);
create index if not exists idx_customer_addresses_default on public.customer_addresses(customer_id, is_default);

create or replace function public.customer_addresses_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'trg_customer_addresses_updated_at'
      and tgrelid = 'public.customer_addresses'::regclass
  ) then
    create trigger trg_customer_addresses_updated_at
    before update on public.customer_addresses
    for each row
    execute function public.customer_addresses_touch_updated_at();
  end if;
end $$;

-- ensure one default per customer
create unique index if not exists idx_customer_addresses_one_default
  on public.customer_addresses(customer_id)
  where is_default = true;

-- =========================
-- orders booking traceability
-- =========================
alter table if exists public.orders
  add column if not exists booking_request_id uuid,
  add column if not exists booking_id text;

create index if not exists idx_orders_booking_request_id on public.orders(booking_request_id);
create index if not exists idx_orders_booking_id on public.orders(booking_id);

commit;
