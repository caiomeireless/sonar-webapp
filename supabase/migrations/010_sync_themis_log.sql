-- 010_sync_themis_log.sql
-- ============================================================
-- Log das sincronizacoes Themis -> Sonar
--
-- Cada execucao do sync-mensal.ps1 (manual ou via Task Scheduler) registra:
--   - inicio + fim
--   - sucesso/erro
--   - origem (manual = duplo-clique; agendado = Task Scheduler)
--   - quem disparou (opcional)
--
-- Usado por painel interno de health da sync (fora do showroom — rota
-- nova futura, NUNCA dentro do demo de producao).
--
-- Padrao 1:1 com BP CRM (migration 035). Mantemos espelhado por dois
-- motivos: (1) reaproveitar 100% do sync-mensal-log.mjs e (2) facilitar
-- consolidar comparacao das duas syncs num dashboard interno se um dia
-- precisar.
--
-- Como aplicar: Supabase > SQL Editor > cola e roda. Idempotente.
-- ============================================================

create table if not exists public.sync_themis_log (
  id             serial primary key,
  iniciado_em    timestamptz not null default now(),
  terminou_em    timestamptz,
  ok             boolean,
  erro           text,
  origem         text not null default 'manual'
    check (origem in ('manual', 'agendado')),
  criado_por     text,
  duracao_seg    integer
);

create index if not exists sync_themis_log_iniciado_idx
  on public.sync_themis_log (iniciado_em desc);

alter table public.sync_themis_log enable row level security;

grant select, insert, update on public.sync_themis_log to service_role;
grant usage, select on sequence public.sync_themis_log_id_seq to service_role;
