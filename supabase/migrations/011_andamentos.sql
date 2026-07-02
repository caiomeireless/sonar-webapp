-- 011_andamentos.sql
-- ============================================================
-- Andamentos processuais (timeline do caso) — multi-fonte.
--
-- Cada andamento traz a FONTE de onde veio (datajud, esaj-tjsp,
-- eproc-tjsp, pje-tst, etc.) — Sonar e agnostico de tribunal.
-- Mesma tabela aceita todas as fontes futuras (pje, projudi, eproc TRFs).
--
-- Dedup: (numero_processo, data_andamento, descricao_hash) — se a mesma
-- movimentacao chega por DataJud e por e-SAJ, fica so uma linha.
--
-- Snapshot bruto da consulta do dia fica em payload jsonb (rastreabilidade
-- pra debug e re-parse futuro se o schema mudar).
--
-- Como aplicar: Supabase > SQL Editor > cola e roda. Idempotente.
-- ============================================================

create table if not exists public.andamentos (
  id bigserial primary key,
  caso_id bigint references public.casos(id) on delete set null,
  numero_processo text not null,
  fonte text not null check (fonte in (
    'datajud', 'esaj-tjsp', 'eproc-tjsp', 'pje', 'projudi', 'manual'
  )),
  tribunal text,
  data_andamento timestamptz,
  descricao text not null,
  descricao_hash text not null,
  payload jsonb not null default '{}',
  capturado_em timestamptz not null default now(),
  unique (numero_processo, fonte, data_andamento, descricao_hash)
);

alter table public.andamentos enable row level security;
grant all on table public.andamentos to service_role;
grant usage, select on sequence public.andamentos_id_seq to service_role;

create index if not exists andamentos_caso_idx on public.andamentos (caso_id);
create index if not exists andamentos_numero_idx on public.andamentos (numero_processo);
create index if not exists andamentos_fonte_idx on public.andamentos (fonte);
create index if not exists andamentos_data_idx on public.andamentos (data_andamento desc nulls last);

-- ============================================================
-- Snapshot bruto da consulta por OAB no e-SAJ (uma row por consulta).
-- Permite re-parse offline + debug + auditoria.
-- ============================================================
create table if not exists public.esaj_consultas_oab (
  id bigserial primary key,
  oab text not null,
  uf text not null default 'SP',
  total_encontrado integer,
  processos jsonb not null default '[]',
  html_pages jsonb not null default '[]',
  consultado_em timestamptz not null default now(),
  duracao_seg integer,
  erro text
);

alter table public.esaj_consultas_oab enable row level security;
grant all on table public.esaj_consultas_oab to service_role;
grant usage, select on sequence public.esaj_consultas_oab_id_seq to service_role;

create index if not exists esaj_consultas_oab_oab_idx on public.esaj_consultas_oab (oab, consultado_em desc);
