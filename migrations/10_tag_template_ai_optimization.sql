alter table public.tag_templates
  add column if not exists is_ai_optimized boolean not null default false;
