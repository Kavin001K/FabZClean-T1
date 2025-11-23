-- Enable extensions (safe if they already exist)
create extension if not exists "uuid-ossp";

-- Role enum used across the stack
do $$
begin
  if not exists (
    select 1
    from pg_type t
    where t.typname = 'user_role'
  ) then
    create type public.user_role as enum (
      'admin',
      'employee',
      'franchise_manager',
      'factory_manager'
    );
  end if;
end;
$$;

-- Table describing what each role is allowed to do (useful for UI/ops)
create table if not exists public.role_capabilities (
  role user_role primary key,
  label text not null,
  description text not null,
  can_manage_orders boolean not null default false,
  can_manage_customers boolean not null default false,
  can_manage_inventory boolean not null default false,
  can_view_analytics boolean not null default false,
  can_manage_logistics boolean not null default false,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

insert into public.role_capabilities (
  role,
  label,
  description,
  can_manage_orders,
  can_manage_customers,
  can_manage_inventory,
  can_view_analytics,
  can_manage_logistics
) values
  (
    'admin',
    'Administrator',
    'Full platform access including settings and staff management.',
    true, true, true, true, true
  ),
  (
    'employee',
    'Employee',
    'Front-line operator handling orders and customer interactions.',
    true, true, false, false, false
  ),
  (
    'franchise_manager',
    'Franchise Manager',
    'Manages franchise performance, KPIs, and escalated customer issues.',
    true, true, false, true, false
  ),
  (
    'factory_manager',
    'Factory Manager',
    'Oversees production, inventory, and logistics workflows.',
    true, false, true, true, true
  )
on conflict (role) do update
set
  label = excluded.label,
  description = excluded.description,
  can_manage_orders = excluded.can_manage_orders,
  can_manage_customers = excluded.can_manage_customers,
  can_manage_inventory = excluded.can_manage_inventory,
  can_view_analytics = excluded.can_view_analytics,
  can_manage_logistics = excluded.can_manage_logistics,
  updated_at = timezone('utc'::text, now());

-- Profiles table mirrors auth.users with richer metadata
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  full_name text,
  role user_role not null default 'employee',
  avatar_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.profiles enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper to bump updated_at
create or replace function public.touch_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.touch_profiles_updated_at();

-- RLS policies
create policy "Profiles are viewable by owners or admins"
  on public.profiles
  for select
  using (
    auth.uid() = id
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Profiles are editable by owners"
  on public.profiles
  for update
  using (auth.uid() = id);

create policy "Profiles are manageable by admins"
  on public.profiles
  for all
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

