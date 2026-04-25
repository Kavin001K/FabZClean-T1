-- Additive booking tracking migration (safe: no drops, no deletes)
begin;

create extension if not exists pgcrypto;

alter table if exists public.orders
  add column if not exists booking_source text,
  add column if not exists booking_channel text,
  add column if not exists booking_slot text,
  add column if not exists booking_context jsonb default '{}'::jsonb;

create index if not exists idx_orders_booking_source on public.orders(booking_source);
create index if not exists idx_orders_booking_channel on public.orders(booking_channel);
create index if not exists idx_orders_booking_slot on public.orders(booking_slot);

create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text unique,
  source text not null default 'website',         -- website | store | whatsapp | call | walkin
  channel text not null default 'web',            -- web | app | counter | phone | whatsapp
  store_code text,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  pickup_address jsonb,
  preferred_date date,
  preferred_slot text,
  notes text,
  weather_snapshot jsonb default '{}'::jsonb,
  ai_suggestions jsonb default '[]'::jsonb,
  status text not null default 'new',             -- new | confirmed | converted | cancelled
  converted_order_id text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_booking_requests_status on public.booking_requests(status);
create index if not exists idx_booking_requests_store on public.booking_requests(store_code);
create index if not exists idx_booking_requests_preferred_date on public.booking_requests(preferred_date);
create index if not exists idx_booking_requests_created_at on public.booking_requests(created_at desc);

create or replace function public.booking_requests_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_booking_requests_updated_at'
      and tgrelid = 'public.booking_requests'::regclass
  ) then
    create trigger trg_booking_requests_updated_at
    before update on public.booking_requests
    for each row
    execute function public.booking_requests_set_updated_at();
  end if;
end $$;

commit;
