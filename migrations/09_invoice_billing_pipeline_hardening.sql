alter table public.orders
  add column if not exists applied_template_id uuid references public.invoice_templates(id) on delete set null,
  add column if not exists whatsapp_bill_status text not null default 'pending';

alter table public.orders
  drop constraint if exists orders_whatsapp_bill_status_chk;

alter table public.orders
  add constraint orders_whatsapp_bill_status_chk
  check (whatsapp_bill_status in ('pending', 'sent', 'failed'));

alter table public.invoice_templates
  add column if not exists is_ai_optimized boolean not null default false;

create index if not exists idx_orders_whatsapp_bill_status
  on public.orders (whatsapp_bill_status);

create index if not exists idx_orders_applied_template_id
  on public.orders (applied_template_id);
