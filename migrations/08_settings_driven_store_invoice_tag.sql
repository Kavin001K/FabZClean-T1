create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  scope_key text not null unique default 'global',
  company_name text not null,
  legal_name text,
  company_address jsonb not null default '{}'::jsonb,
  contact_details jsonb not null default '{}'::jsonb,
  tax_details jsonb not null default '{}'::jsonb,
  payment_details jsonb not null default '{}'::jsonb,
  invoice_defaults jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  short_name text,
  is_active boolean not null default true,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  address jsonb not null default '{}'::jsonb,
  contact_details jsonb not null default '{}'::jsonb,
  legal_details jsonb not null default '{}'::jsonb,
  invoice_overrides jsonb not null default '{}'::jsonb,
  tag_overrides jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stores_code_chk check (code ~ '^[A-Z0-9_]{2,10}$')
);

create unique index if not exists idx_stores_single_default
on public.stores (is_default) where is_default = true;

create table if not exists public.invoice_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique,
  name text not null,
  description text,
  preset_key text not null,
  store_id uuid references public.stores(id) on delete cascade,
  is_active boolean not null default true,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_invoice_templates_global_default
on public.invoice_templates (is_default)
where is_default = true and store_id is null;

create unique index if not exists idx_invoice_templates_store_default
on public.invoice_templates (store_id)
where is_default = true and store_id is not null;

create table if not exists public.tag_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique,
  name text not null,
  description text,
  layout_key text not null default 'thermal_compact',
  store_id uuid references public.stores(id) on delete cascade,
  is_active boolean not null default true,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_tag_templates_global_default
on public.tag_templates (is_default)
where is_default = true and store_id is null;

create unique index if not exists idx_tag_templates_store_default
on public.tag_templates (store_id)
where is_default = true and store_id is not null;

alter table public.orders
  add column if not exists store_id uuid references public.stores(id) on delete set null,
  add column if not exists invoice_template_id uuid references public.invoice_templates(id) on delete set null,
  add column if not exists tag_template_id uuid references public.tag_templates(id) on delete set null;

alter table public.documents
  add column if not exists store_id uuid references public.stores(id) on delete set null,
  add column if not exists template_key text;

create index if not exists idx_orders_store_id_created_at
on public.orders (store_id, created_at desc);

create index if not exists idx_documents_store_id_created_at
on public.documents (store_id, created_at desc);

drop trigger if exists trg_business_profiles_updated_at on public.business_profiles;
create trigger trg_business_profiles_updated_at before update on public.business_profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_stores_updated_at on public.stores;
create trigger trg_stores_updated_at before update on public.stores
for each row execute function public.set_updated_at();

drop trigger if exists trg_invoice_templates_updated_at on public.invoice_templates;
create trigger trg_invoice_templates_updated_at before update on public.invoice_templates
for each row execute function public.set_updated_at();

drop trigger if exists trg_tag_templates_updated_at on public.tag_templates;
create trigger trg_tag_templates_updated_at before update on public.tag_templates
for each row execute function public.set_updated_at();

insert into public.business_profiles
  (scope_key, company_name, legal_name, company_address, contact_details, tax_details, payment_details, invoice_defaults)
values
  ('global', 'FabZClean', 'FabZClean', '{"line1":"#16, Venkatramana Round Road, Mahalingapuram","city":"Pollachi","state":"Tamil Nadu","pincode":"642002","country":"India"}',
   '{"phone":"+91 93630 59595","email":"support@myfabclean.com","website":"https://erp.myfabclean.com"}',
   '{"gstin":"33AITPD3522F1ZK","pan":"AITPD3522F","currency":"INR"}',
   '{"upiId":"9886788858@pz","upiName":"Fab Clean"}',
   '{"defaultDueDays":2,"showPaymentQr":true,"showGstBreakup":true,"showPaymentBreakdown":true,"footerNote":"Thank you for choosing Fab Clean."}')
on conflict (scope_key) do nothing;

insert into public.stores (code, name, short_name, is_default, sort_order, address, contact_details, legal_details)
values
  ('POL', 'Pollachi', 'Pollachi', true, 1, '{"line1":"#16, Venkatramana Round Road, Mahalingapuram","city":"Pollachi","state":"Tamil Nadu","pincode":"642002","country":"India"}', '{"phone":"+91 93630 59595","email":"pollachi@myfabclean.com"}', '{"gstin":"33AITPD3522F1ZK"}'),
  ('KIN', 'Kinathukadavu', 'KIN', false, 2, '{"line1":"#442/11, Opp MLA Office, Krishnasamypuram","city":"Kinathukadavu","state":"Tamil Nadu","pincode":"642109","country":"India"}', '{"phone":"+91 93637 19595","email":"kinathukadavu@myfabclean.com"}', '{"gstin":"33AITPD3522F1ZK"}'),
  ('MCET', 'MCET', 'MCET', false, 3, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb),
  ('UDM', 'Udumalpet', 'UDM', false, 4, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb)
on conflict (code) do nothing;

insert into public.invoice_templates (template_key, name, description, preset_key, is_default, sort_order, config)
values
  ('classic-default', 'Classic Invoice', 'Balanced branded invoice', 'classic', true, 1, '{"showLogo":true,"showStoreAddress":true,"showCustomerAddress":true,"showItemNotes":true,"showTerms":true,"showPaymentQr":true}'),
  ('modern-default', 'Modern Invoice', 'Cleaner modern layout', 'modern', false, 2, '{"showLogo":true,"showStoreAddress":true,"showCustomerAddress":true,"showItemNotes":false,"showTerms":true,"showPaymentQr":true}'),
  ('compact-default', 'Compact Invoice', 'Dense low-ink layout', 'compact', false, 3, '{"showLogo":false,"showStoreAddress":true,"showCustomerAddress":true,"showItemNotes":false,"showTerms":false,"showPaymentQr":true}'),
  ('express-default', 'Express Bill', 'Priority bill layout for fast-turnaround orders', 'express', false, 4, '{"showLogo":true,"showStoreAddress":true,"showCustomerAddress":true,"showItemNotes":true,"showTerms":true,"showPaymentQr":true,"showDeliveryBlock":true}'),
  ('edited-default', 'Edited Order Bill', 'Revision bill layout for regenerated invoices', 'edited', false, 5, '{"showLogo":true,"showStoreAddress":true,"showCustomerAddress":true,"showItemNotes":true,"showTerms":true,"showPaymentQr":true,"showPaymentBreakdown":true}')
on conflict (template_key) do nothing;

insert into public.tag_templates (template_key, name, description, layout_key, is_default, sort_order, config)
values
  ('thermal-default', 'Thermal Default', 'Default garment tag', 'thermal_compact', true, 1, '{"showStoreCode":true,"showCustomerName":true,"showOrderNumber":true,"showServiceName":true,"showDueDate":true,"showQuantity":true,"showTagNote":true,"maxNoteChars":32}')
on conflict (template_key) do nothing;

update public.orders o
set store_id = s.id
from public.stores s
where o.store_id is null
  and upper(coalesce(nullif(trim(o.store_code), ''), 'POL')) = s.code;
