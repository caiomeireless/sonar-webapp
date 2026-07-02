-- 012_sync_esaj_log.sql
-- ============================================================
-- Log das sincronizacoes e-SAJ TJSP -> Sonar (analogo a sync_themis_log).
--
-- Cada execucao do sync-esaj.ps1 registra inicio/fim/sucesso/erro/origem.
-- Frequencia: diaria 12:00 (Task Scheduler), pode rodar manual.
--
-- Como aplicar: Supabase > SQL Editor > cola e roda. Idempotente.
-- ============================================================

create table if not exists public.sync_esaj_log (
  id             serial primary key,
  iniciado_em    timestamptz not null default now(),
  terminou_em    timestamptz,
  ok             boolean,
  erro           text,
  origem         text not null default 'manual'
    check (origem in ('manual', 'agendado')),
  oab            text,
  criado_por     text,
  duracao_seg    integer,
  processos_lidos integer,
  andamentos_novos integer
);

create index if not exists sync_esaj_log_iniciado_idx
  on public.sync_esaj_log (iniciado_em desc);

alter table public.sync_esaj_log enable row level security;

grant select, insert, update on public.sync_esaj_log to service_role;
grant usage, select on sequence public.sync_esaj_log_id_seq to service_role;
