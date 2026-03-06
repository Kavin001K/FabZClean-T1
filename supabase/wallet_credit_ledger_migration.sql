-- =====================================================================
-- FabZClean Wallet Ledger Migration (TEXT-ID Compatible)
-- Safe for existing schemas where customers.id is TEXT/VARCHAR
-- =====================================================================

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1) Customer wallet fields
-- ---------------------------------------------------------------------
alter table public.customers
  add column if not exists credit_limit numeric(10,2);

alter table public.customers
  add column if not exists wallet_balance_cache numeric(10,2);

alter table public.customers
  alter column credit_limit set default -500;

alter table public.customers
  alter column wallet_balance_cache set default 0;

update public.customers
set credit_limit = -500
where credit_limit is null;

update public.customers
set wallet_balance_cache = coalesce(wallet_balance_cache, -coalesce(credit_balance, 0), 0)
where wallet_balance_cache is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'customers_credit_limit_non_positive_chk'
      and conrelid = 'public.customers'::regclass
  ) then
    alter table public.customers
      add constraint customers_credit_limit_non_positive_chk
      check (credit_limit <= 0);
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 2) Wallet default settings
-- ---------------------------------------------------------------------
create table if not exists public.wallet_settings (
  id smallint primary key check (id = 1),
  default_credit_limit numeric(10,2) not null check (default_credit_limit <= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.wallet_settings (id, default_credit_limit)
values (1, -500)
on conflict (id) do nothing;

create or replace function public.wallet_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_wallet_settings_updated_at on public.wallet_settings;
create trigger trg_wallet_settings_updated_at
before update on public.wallet_settings
for each row execute function public.wallet_set_updated_at();

create or replace function public.customers_set_default_credit_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.credit_limit is null then
    select ws.default_credit_limit
    into new.credit_limit
    from public.wallet_settings ws
    where ws.id = 1;

    if new.credit_limit is null then
      new.credit_limit := -500;
    end if;
  end if;

  if new.wallet_balance_cache is null then
    new.wallet_balance_cache := 0;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_customers_default_credit_limit on public.customers;
create trigger trg_customers_default_credit_limit
before insert on public.customers
for each row execute function public.customers_set_default_credit_limit();

-- ---------------------------------------------------------------------
-- 3) Wallet ledger table (TEXT IDs to match current app schema)
-- ---------------------------------------------------------------------
create table if not exists public.wallet_transactions (
  id text primary key default gen_random_uuid()::text,
  entry_no bigint generated always as identity,
  franchise_id text references public.franchises(id) on delete cascade,
  customer_id text not null,
  transaction_type text not null,
  amount numeric(10,2) not null,
  balance_after numeric(10,2) not null,
  payment_method text,
  verified_by_staff text references public.employees(id) on delete set null,
  reference_type text not null,
  reference_id text,
  note text,
  created_by text references public.employees(id) on delete set null,
  created_at timestamptz not null default now()
);

-- If the table already exists with UUID columns, cast to TEXT to avoid FK mismatch.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'wallet_transactions'
      and column_name = 'customer_id'
      and udt_name = 'uuid'
  ) then
    alter table public.wallet_transactions
      drop constraint if exists wallet_transactions_customer_id_fkey;

    alter table public.wallet_transactions
      alter column customer_id type text using customer_id::text;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'wallet_transactions'
      and column_name = 'reference_id'
      and udt_name = 'uuid'
  ) then
    alter table public.wallet_transactions
      alter column reference_id type text using reference_id::text;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'wallet_transactions_customer_fk'
      and conrelid = 'public.wallet_transactions'::regclass
  ) then
    alter table public.wallet_transactions
      add constraint wallet_transactions_customer_fk
      foreign key (customer_id)
      references public.customers(id)
      on delete restrict;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'wallet_transactions_transaction_type_chk'
      and conrelid = 'public.wallet_transactions'::regclass
  ) then
    alter table public.wallet_transactions
      add constraint wallet_transactions_transaction_type_chk
      check (transaction_type in ('CREDIT', 'DEBIT', 'ADJUSTMENT'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'wallet_transactions_reference_type_chk'
      and conrelid = 'public.wallet_transactions'::regclass
  ) then
    alter table public.wallet_transactions
      add constraint wallet_transactions_reference_type_chk
      check (reference_type in ('PAYMENT', 'ORDER', 'ADJUSTMENT', 'MANUAL'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'wallet_transactions_amount_non_zero_chk'
      and conrelid = 'public.wallet_transactions'::regclass
  ) then
    alter table public.wallet_transactions
      add constraint wallet_transactions_amount_non_zero_chk
      check (amount <> 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'wallet_transactions_payment_method_chk'
      and conrelid = 'public.wallet_transactions'::regclass
  ) then
    alter table public.wallet_transactions
      add constraint wallet_transactions_payment_method_chk
      check (
        payment_method is null
        or payment_method in ('CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'CHEQUE')
      );
  end if;
end $$;

create unique index if not exists idx_wallet_transactions_entry_no_unique
  on public.wallet_transactions(entry_no);

create index if not exists idx_wallet_transactions_customer_entry
  on public.wallet_transactions(customer_id, entry_no desc);

create index if not exists idx_wallet_transactions_reference
  on public.wallet_transactions(reference_type, reference_id)
  where reference_id is not null;

create index if not exists idx_wallet_transactions_created_at
  on public.wallet_transactions(created_at desc);

create unique index if not exists idx_wallet_transactions_order_reference_unique
  on public.wallet_transactions(reference_id)
  where reference_type = 'ORDER';

-- ---------------------------------------------------------------------
-- 4) Staff role helpers
-- ---------------------------------------------------------------------
create or replace function public.is_staff_employee(p_employee_id text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.employees e
    where e.id = p_employee_id
      and coalesce(e.status, 'active') = 'active'
      and e.role in ('admin', 'franchise_manager', 'employee', 'staff')
  );
$$;

create or replace function public.is_admin_employee(p_employee_id text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.employees e
    where e.id = p_employee_id
      and coalesce(e.status, 'active') = 'active'
      and e.role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- 5) Ledger validation + balance derivation
-- ---------------------------------------------------------------------
create or replace function public.wallet_transactions_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_balance numeric(10,2);
  v_credit_limit numeric(10,2);
  v_customer_franchise_id text;
begin
  perform 1
  from public.customers c
  where c.id = new.customer_id
  for update;

  if not found then
    raise exception 'Customer % not found', new.customer_id;
  end if;

  select c.credit_limit, c.franchise_id
  into v_credit_limit, v_customer_franchise_id
  from public.customers c
  where c.id = new.customer_id;

  select wt.balance_after
  into v_current_balance
  from public.wallet_transactions wt
  where wt.customer_id = new.customer_id
  order by wt.entry_no desc
  limit 1;

  if v_current_balance is null then
    -- bootstrap from current outstanding credit if ledger is empty
    select -coalesce(c.credit_balance, 0)
    into v_current_balance
    from public.customers c
    where c.id = new.customer_id;
  end if;

  v_current_balance := coalesce(v_current_balance, 0);

  if new.franchise_id is null then
    new.franchise_id := v_customer_franchise_id;
  end if;

  if new.transaction_type = 'CREDIT' then
    if new.amount <= 0 then
      raise exception 'CREDIT amount must be > 0';
    end if;
    if new.reference_type not in ('PAYMENT', 'MANUAL', 'ADJUSTMENT') then
      raise exception 'CREDIT reference_type must be PAYMENT, MANUAL, or ADJUSTMENT';
    end if;

  elsif new.transaction_type = 'DEBIT' then
    if new.amount >= 0 then
      raise exception 'DEBIT amount must be < 0';
    end if;
    if new.reference_type not in ('ORDER', 'MANUAL') then
      raise exception 'DEBIT reference_type must be ORDER or MANUAL';
    end if;

    if v_current_balance + new.amount < v_credit_limit then
      raise exception 'Credit limit exceeded. current=%, debit=%, limit=%',
        v_current_balance, new.amount, v_credit_limit;
    end if;

  elsif new.transaction_type = 'ADJUSTMENT' then
    if new.amount = 0 then
      raise exception 'ADJUSTMENT amount cannot be 0';
    end if;
    if new.reference_type not in ('ADJUSTMENT', 'MANUAL') then
      raise exception 'ADJUSTMENT reference_type must be ADJUSTMENT or MANUAL';
    end if;

    if new.amount < 0
       and coalesce(new.note, '') not ilike 'Opening balance migration%'
       and (v_current_balance + new.amount < v_credit_limit) then
      raise exception 'Credit limit exceeded by adjustment. current=%, adjustment=%, limit=%',
        v_current_balance, new.amount, v_credit_limit;
    end if;
  else
    raise exception 'Unsupported transaction_type: %', new.transaction_type;
  end if;

  if new.verified_by_staff is not null and not public.is_staff_employee(new.verified_by_staff) then
    raise exception 'verified_by_staff must be an active staff/admin employee';
  end if;

  new.balance_after := v_current_balance + new.amount;
  return new;
end;
$$;

drop trigger if exists trg_wallet_transactions_before_insert on public.wallet_transactions;
create trigger trg_wallet_transactions_before_insert
before insert on public.wallet_transactions
for each row execute function public.wallet_transactions_before_insert();

create or replace function public.wallet_transactions_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.wallet_sync', 'on', true);

  update public.customers c
  set wallet_balance_cache = new.balance_after,
      credit_balance = case when new.balance_after < 0 then abs(new.balance_after) else 0 end,
      updated_at = now()
  where c.id = new.customer_id;

  return new;
end;
$$;

drop trigger if exists trg_wallet_transactions_after_insert on public.wallet_transactions;
create trigger trg_wallet_transactions_after_insert
after insert on public.wallet_transactions
for each row execute function public.wallet_transactions_after_insert();

create or replace function public.prevent_wallet_transaction_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'wallet_transactions is immutable. Use ADJUSTMENT entries instead.';
end;
$$;

drop trigger if exists trg_wallet_transactions_block_mutation on public.wallet_transactions;
create trigger trg_wallet_transactions_block_mutation
before update or delete on public.wallet_transactions
for each row execute function public.prevent_wallet_transaction_mutation();

create or replace function public.prevent_manual_wallet_customer_updates()
returns trigger
language plpgsql
as $$
begin
  if (new.wallet_balance_cache is distinct from old.wallet_balance_cache
      or new.credit_balance is distinct from old.credit_balance)
     and coalesce(current_setting('app.wallet_sync', true), 'off') <> 'on' then
    raise exception 'Wallet/credit balances are ledger-derived and cannot be updated directly';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_customers_block_manual_wallet_update on public.customers;
create trigger trg_customers_block_manual_wallet_update
before update on public.customers
for each row execute function public.prevent_manual_wallet_customer_updates();

-- ---------------------------------------------------------------------
-- 6) RPC functions for app/service use
-- ---------------------------------------------------------------------
create or replace function public.add_wallet_credit(
  p_customer_id text,
  p_amount numeric,
  p_payment_method text,
  p_verified_by_staff text,
  p_reference_id text default null,
  p_note text default null
)
returns table (
  transaction_id text,
  new_wallet_balance numeric,
  new_credit_balance numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tx_id text;
  v_balance numeric(10,2);
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Credit amount must be greater than 0';
  end if;

  if not public.is_staff_employee(p_verified_by_staff) then
    raise exception 'Only active staff/admin can add wallet credits';
  end if;

  insert into public.wallet_transactions (
    customer_id,
    transaction_type,
    amount,
    payment_method,
    verified_by_staff,
    reference_type,
    reference_id,
    note,
    created_by
  )
  values (
    p_customer_id,
    'CREDIT',
    p_amount,
    upper(replace(coalesce(p_payment_method, ''), ' ', '_')),
    p_verified_by_staff,
    'PAYMENT',
    p_reference_id,
    p_note,
    p_verified_by_staff
  )
  returning id, balance_after
  into v_tx_id, v_balance;

  transaction_id := v_tx_id;
  new_wallet_balance := v_balance;
  new_credit_balance := case when v_balance < 0 then abs(v_balance) else 0 end;

  return next;
end;
$$;

create or replace function public.process_order_debit(
  p_customer_id text,
  p_order_amount numeric,
  p_order_id text,
  p_created_by text default null,
  p_note text default null
)
returns table (
  transaction_id text,
  new_wallet_balance numeric,
  new_credit_balance numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tx_id text;
  v_balance numeric(10,2);
begin
  if p_order_amount is null or p_order_amount <= 0 then
    raise exception 'Order amount must be greater than 0';
  end if;

  insert into public.wallet_transactions (
    customer_id,
    transaction_type,
    amount,
    verified_by_staff,
    reference_type,
    reference_id,
    note,
    created_by
  )
  values (
    p_customer_id,
    'DEBIT',
    -p_order_amount,
    p_created_by,
    'ORDER',
    p_order_id,
    coalesce(p_note, 'Order debit'),
    p_created_by
  )
  returning id, balance_after
  into v_tx_id, v_balance;

  transaction_id := v_tx_id;
  new_wallet_balance := v_balance;
  new_credit_balance := case when v_balance < 0 then abs(v_balance) else 0 end;

  return next;
end;
$$;

create or replace function public.admin_adjust_wallet(
  p_customer_id text,
  p_amount numeric,
  p_admin_id text,
  p_reason text,
  p_reference_id text default null
)
returns table (
  transaction_id text,
  new_wallet_balance numeric,
  new_credit_balance numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tx_id text;
  v_balance numeric(10,2);
begin
  if p_amount is null or p_amount = 0 then
    raise exception 'Adjustment amount cannot be 0';
  end if;

  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'Adjustment reason is required';
  end if;

  if not public.is_admin_employee(p_admin_id) then
    raise exception 'Only admin can create wallet adjustments';
  end if;

  insert into public.wallet_transactions (
    customer_id,
    transaction_type,
    amount,
    verified_by_staff,
    reference_type,
    reference_id,
    note,
    created_by
  )
  values (
    p_customer_id,
    'ADJUSTMENT',
    p_amount,
    p_admin_id,
    'ADJUSTMENT',
    p_reference_id,
    p_reason,
    p_admin_id
  )
  returning id, balance_after
  into v_tx_id, v_balance;

  transaction_id := v_tx_id;
  new_wallet_balance := v_balance;
  new_credit_balance := case when v_balance < 0 then abs(v_balance) else 0 end;

  return next;
end;
$$;

-- ---------------------------------------------------------------------
-- 7) Opening-balance migration (legacy customers -> wallet ledger)
-- ---------------------------------------------------------------------
insert into public.wallet_transactions (
  customer_id,
  franchise_id,
  transaction_type,
  amount,
  reference_type,
  note,
  created_by
)
select
  c.id,
  c.franchise_id,
  'ADJUSTMENT',
  -coalesce(c.credit_balance, 0),
  'MANUAL',
  'Opening balance migration from customers.credit_balance',
  null
from public.customers c
where coalesce(c.credit_balance, 0) <> 0
  and not exists (
    select 1
    from public.wallet_transactions wt
    where wt.customer_id = c.id
  );

-- ---------------------------------------------------------------------
-- 8) Optional RLS template (for Supabase auth projects)
-- ---------------------------------------------------------------------
alter table public.wallet_transactions enable row level security;

-- These policies assume a public.profiles table with columns: id, role.
-- Safe to execute even if profiles is absent (guarded by dynamic SQL).
do $$
begin
  if to_regclass('public.profiles') is not null then
    execute 'drop policy if exists wallet_tx_staff_read on public.wallet_transactions';
    execute 'create policy wallet_tx_staff_read on public.wallet_transactions for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in (''admin'', ''staff'')))';

    execute 'drop policy if exists wallet_tx_staff_credit_insert on public.wallet_transactions';
    execute 'create policy wallet_tx_staff_credit_insert on public.wallet_transactions for insert with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in (''admin'', ''staff'')) and transaction_type = ''CREDIT'')';

    execute 'drop policy if exists wallet_tx_admin_adjust_insert on public.wallet_transactions';
    execute 'create policy wallet_tx_admin_adjust_insert on public.wallet_transactions for insert with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = ''admin'') and transaction_type = ''ADJUSTMENT'')';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 9) Helpful reconciliation view
-- ---------------------------------------------------------------------
create or replace view public.customer_wallet_balances as
select
  c.id as customer_id,
  c.wallet_balance_cache as cached_wallet_balance,
  c.credit_balance as cached_credit_balance,
  coalesce(sum(wt.amount), 0)::numeric(10,2) as derived_wallet_balance,
  case
    when coalesce(sum(wt.amount), 0) < 0 then abs(coalesce(sum(wt.amount), 0))
    else 0
  end::numeric(10,2) as derived_credit_balance,
  max(wt.entry_no) as last_entry_no,
  max(wt.created_at) as last_transaction_at
from public.customers c
left join public.wallet_transactions wt on wt.customer_id = c.id
group by c.id, c.wallet_balance_cache, c.credit_balance;

commit;
