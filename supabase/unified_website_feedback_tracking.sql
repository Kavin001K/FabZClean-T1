-- ============================================================
-- Unified Fab Clean Website + FabZClean-T1 Migration
-- Run this file in the FabZClean-T1 Supabase SQL editor.
-- Recommended: take a backup / snapshot before applying.
-- ============================================================

begin;

-- ============================================================
-- 1. Extensions
-- ============================================================

create extension if not exists pgcrypto;
create extension if not exists pg_net;

-- ============================================================
-- 2. Shared updated_at trigger helper
-- ============================================================

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 3. Orders feedback expansion
-- ============================================================

alter table public.orders
  add column if not exists customer_rating integer,
  add column if not exists feedback_comment text,
  add column if not exists feedback_metadata jsonb,
  add column if not exists feedback_submitted_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_customer_rating_range'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_customer_rating_range
      check (
        customer_rating is null
        or customer_rating between 1 and 5
      );
  end if;
end
$$;

create index if not exists idx_orders_order_number_lookup
  on public.orders (lower(replace(coalesce(order_number, ''), '#', '')));

create index if not exists idx_orders_customer_feedback
  on public.orders (customer_id, feedback_submitted_at desc)
  where customer_rating is not null;

create index if not exists idx_orders_phone_lookup
  on public.orders ((right(regexp_replace(coalesce(customer_phone, ''), '\D', '', 'g'), 10)));

-- ============================================================
-- 4. Curated public reviews
-- ============================================================

create table if not exists public.public_website_reviews (
  id uuid primary key default gen_random_uuid(),
  order_id varchar not null references public.orders(id) on delete cascade,
  customer_id varchar references public.customers(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  is_top_rating boolean not null default false,
  is_best_rating boolean not null default true,
  curation_score numeric(5, 2),
  curation_reason text,
  ai_provider text,
  ai_model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_public_website_reviews_order_id
  on public.public_website_reviews (order_id);

create index if not exists idx_public_website_reviews_best_created
  on public.public_website_reviews (is_best_rating, created_at desc);

create index if not exists idx_public_website_reviews_top_created
  on public.public_website_reviews (is_top_rating, created_at desc);

create index if not exists idx_public_website_reviews_customer
  on public.public_website_reviews (customer_id, created_at desc);

drop trigger if exists trg_public_website_reviews_set_updated_at on public.public_website_reviews;
create trigger trg_public_website_reviews_set_updated_at
before update on public.public_website_reviews
for each row
execute function public.set_current_timestamp_updated_at();

-- ============================================================
-- 5. Website support tables migrated into ERP Supabase
-- ============================================================

create table if not exists public.customer_portal_users (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  name text,
  email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customer_portal_users_phone
  on public.customer_portal_users (phone);

drop trigger if exists trg_customer_portal_users_set_updated_at on public.customer_portal_users;
create trigger trg_customer_portal_users_set_updated_at
before update on public.customer_portal_users
for each row
execute function public.set_current_timestamp_updated_at();

do $$
begin
  if not exists (select 1 from pg_type where typname = 'time_slot') then
    create type public.time_slot as enum ('morning', 'afternoon', 'evening');
  end if;

  if not exists (select 1 from pg_type where typname = 'branch') then
    create type public.branch as enum ('pollachi', 'kinathukadavu');
  end if;

  if not exists (select 1 from pg_type where typname = 'pickup_status') then
    create type public.pickup_status as enum (
      'pending',
      'confirmed',
      'picked_up',
      'processing',
      'ready',
      'out_for_delivery',
      'delivered',
      'cancelled'
    );
  end if;
end
$$;

create table if not exists public.pickups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.customer_portal_users(id) on delete set null,
  booking_reference text not null unique,
  customer_name text not null,
  customer_phone text not null,
  address text not null,
  address_lat real,
  address_lng real,
  services text[] not null,
  special_instructions text,
  preferred_date text not null,
  time_slot public.time_slot not null,
  branch public.branch not null,
  status public.pickup_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pickups_booking_reference
  on public.pickups (booking_reference);

create index if not exists idx_pickups_phone_created_at
  on public.pickups (customer_phone, created_at desc);

drop trigger if exists trg_pickups_set_updated_at on public.pickups;
create trigger trg_pickups_set_updated_at
before update on public.pickups
for each row
execute function public.set_current_timestamp_updated_at();

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contacts_created_at
  on public.contacts (created_at desc);

drop trigger if exists trg_contacts_set_updated_at on public.contacts;
create trigger trg_contacts_set_updated_at
before update on public.contacts
for each row
execute function public.set_current_timestamp_updated_at();

-- ============================================================
-- 6. Customer feedback aggregate view
-- ============================================================

create or replace view public.customer_feedback_stats as
select
  c.id as customer_id,
  count(o.id) filter (where o.customer_rating is not null) as feedback_count,
  round(avg(o.customer_rating)::numeric, 2) as average_rating,
  max(o.feedback_submitted_at) as last_feedback_submitted_at,
  count(o.id) filter (where o.customer_rating >= 4) as positive_feedback_count
from public.customers c
left join public.orders o
  on o.customer_id = c.id
group by c.id;

-- ============================================================
-- 7. Review ranking helper for atomic top-10 maintenance
-- ============================================================

create or replace function public.recompute_top_website_reviews()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  with ranked as (
    select
      id,
      row_number() over (
        order by
          coalesce(curation_score, 0) desc,
          rating desc,
          created_at desc,
          id asc
      ) as rn
    from public.public_website_reviews
    where is_best_rating = true
  )
  update public.public_website_reviews pwr
  set is_top_rating = coalesce(ranked.rn <= 10, false),
      updated_at = now()
  from ranked
  where pwr.id = ranked.id;

  update public.public_website_reviews
  set is_top_rating = false,
      updated_at = now()
  where is_best_rating = false
     or id not in (
       select id
       from public.public_website_reviews
       where is_best_rating = true
       order by
         coalesce(curation_score, 0) desc,
         rating desc,
         created_at desc,
         id asc
       limit 10
     );
end;
$$;

grant execute on function public.recompute_top_website_reviews() to anon, authenticated, service_role;

-- ============================================================
-- 8. Feedback curation trigger -> Edge Function webhook
-- ============================================================

create or replace function public.queue_feedback_curation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  webhook_url constant text := 'https://pxhydxsqtqpewmjfhhoh.functions.supabase.co/curate-feedback';
  webhook_headers jsonb := jsonb_build_object(
    'Content-Type', 'application/json'
  );
begin
  if tg_op = 'INSERT'
     and new.customer_rating is null
     and nullif(btrim(coalesce(new.feedback_comment, '')), '') is null
     and new.feedback_submitted_at is null then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and coalesce(new.customer_rating, -1) = coalesce(old.customer_rating, -1)
     and coalesce(new.feedback_comment, '') = coalesce(old.feedback_comment, '')
     and coalesce(new.feedback_metadata, '{}'::jsonb) = coalesce(old.feedback_metadata, '{}'::jsonb)
     and coalesce(new.feedback_submitted_at, 'epoch'::timestamptz) = coalesce(old.feedback_submitted_at, 'epoch'::timestamptz) then
    return new;
  end if;

  perform net.http_post(
    url := webhook_url,
    headers := webhook_headers,
    body := jsonb_build_object(
      'orderId', new.id,
      'orderNumber', new.order_number,
      'source', 'orders-feedback-trigger'
    ),
    timeout_milliseconds := 2000
  );

  return new;
end;
$$;

drop trigger if exists trg_orders_queue_feedback_curation on public.orders;
create trigger trg_orders_queue_feedback_curation
after insert or update of customer_rating, feedback_comment, feedback_metadata, feedback_submitted_at
on public.orders
for each row
execute function public.queue_feedback_curation();

-- ============================================================
-- 9. Public read access for curated website reviews
-- ============================================================

alter table public.public_website_reviews enable row level security;

drop policy if exists "Anyone can read public reviews" on public.public_website_reviews;
create policy "Anyone can read public reviews"
on public.public_website_reviews
for select
to anon, authenticated
using (is_best_rating = true);

commit;
