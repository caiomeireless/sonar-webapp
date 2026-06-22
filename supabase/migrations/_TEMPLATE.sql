-- TEMPLATE de migration do Sonar
-- ============================================================
-- Como aplicar:
--   Supabase > SQL Editor > cole tudo > Run.
--   Tudo idempotente: pode rodar varias vezes sem efeito colateral.
--
-- REGRA CRITICA (mudanca Data API do Supabase, out/2026):
--   Toda tabela nova precisa de `grant all on table ... to service_role`
--   e (se tiver bigserial/serial) `grant usage, select on sequence`
--   para o service_role enxergar. Sem isso, supabase-js da erro de permissao.
-- ============================================================

create table if not exists public.minha_tabela (
  id bigserial primary key,
  email text not null,
  criado_em timestamptz not null default now()
);

alter table public.minha_tabela enable row level security;

-- GRANTs obrigatorios para a Data API:
grant all on table public.minha_tabela to service_role;
grant usage, select on sequence public.minha_tabela_id_seq to service_role;

-- Indices uteis (sempre `if not exists`):
create index if not exists minha_tabela_email_idx on public.minha_tabela (email);
