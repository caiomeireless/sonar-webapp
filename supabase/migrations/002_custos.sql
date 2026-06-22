-- 002_custos.sql
-- ============================================================
-- Tabela de custos: registra cada consulta paga (Assertiva, BigDataCorp, etc.)
-- para o Monitor de Custos no /app/custos.
--
-- Como aplicar:
--   Supabase > SQL Editor > cole tudo > Run. Idempotente.
-- ============================================================

create table if not exists public.custos (
  id bigserial primary key,
  email text not null,
  tipo text not null,
  descricao text,
  custo numeric(10,4) not null default 0,
  criado_em timestamptz not null default now()
);

alter table public.custos enable row level security;

grant all on table public.custos to service_role;
grant usage, select on sequence public.custos_id_seq to service_role;

create index if not exists custos_email_idx on public.custos (email);
create index if not exists custos_tipo_idx on public.custos (tipo);
create index if not exists custos_criado_em_idx on public.custos (criado_em desc);
