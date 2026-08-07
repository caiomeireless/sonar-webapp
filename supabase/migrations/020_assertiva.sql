-- 020_assertiva.sql
-- ============================================================
-- Sprint 3 — Integração Assertiva (Localiza + Veículos).
--
-- 1) assertiva_cache: primeira consulta de um documento é paga e fica
--    salva aqui; consultas seguintes do MESMO documento saem do cache
--    com custo zero. Espelho do padrão já validado no BP CRM.
--
-- 2) custos.credor_id: até agora o custo só apontava pro devedor
--    (migration 006). Com credor_id o Monitor de Custos do CLIENTE
--    passa a agregar gasto real por carteira (mata o mock de R$ 47,20).
--
-- Como aplicar: Supabase > SQL Editor > cola e roda. Idempotente.
-- ============================================================

create table if not exists public.assertiva_cache (
  id bigserial primary key,
  documento text not null,
  tipo text not null check (tipo in ('cpf', 'cnpj')),
  produto text not null default 'localize',
  endpoint text not null default '',
  resposta jsonb not null default '{}',
  custo_brl numeric(10,4) not null default 0,
  consultado_por_email text not null default '',
  sucesso boolean not null default true,
  erro_msg text not null default '',
  consultado_em timestamptz not null default now(),
  unique (documento, tipo, produto)
);

alter table public.assertiva_cache enable row level security;
grant all on table public.assertiva_cache to service_role;
grant usage, select on sequence public.assertiva_cache_id_seq to service_role;

create index if not exists assertiva_cache_doc_idx
  on public.assertiva_cache (documento, tipo, produto);
create index if not exists assertiva_cache_consultado_idx
  on public.assertiva_cache (consultado_em desc);

-- custos.credor_id — agrega gasto por cliente no monitor do portal.
alter table public.custos
  add column if not exists credor_id bigint references public.credores(id) on delete set null;

create index if not exists custos_credor_idx
  on public.custos (credor_id)
  where credor_id is not null;

-- Campos de contato do devedor — o dossiê já exibe (hoje sempre "—");
-- o Localize passa a preencher. Preenchimento NUNCA sobrescreve valor
-- manual (regra aplicada no código, não no banco).
alter table public.devedores
  add column if not exists rg text,
  add column if not exists email text,
  add column if not exists telefone text,
  add column if not exists redes_sociais text;

-- Recarrega schema cache do PostgREST.
notify pgrst, 'reload schema';
