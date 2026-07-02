-- 016_eproc_enriquecimento.sql
-- ============================================================
-- Enriquecimento via eproc TJSP (espelha o padrao do e-SAJ na 013/015).
--
-- Themis = fonte mestre. e-SAJ cobre 1o grau classico TJSP.
-- eproc TJSP cobre processos digitais novos (2024+) que NAO estao no e-SAJ.
-- Crawler tenta e-SAJ primeiro; se 'nao_encontrado', cai pro eproc.
--
-- Adiciona em casos:
--   - eproc_synced_at timestamptz   (ultima vez que o eproc visitou esse CNJ)
--   - eproc_status text             ('pendente'|'ok'|'erro'|'nao_encontrado'|'rodando'|'nao_aplicavel')
--   - eproc_ultimo_erro text
--
-- E:
--   - eproc_consultas_cnj           (snapshot bruto por CNJ, analogo a esaj_consultas_cnj)
--   - sync_eproc_log                (log de execucoes, analogo a sync_esaj_log)
--
-- Observacao: a tabela andamentos (migration 011) ja aceita fonte='eproc-tjsp'
-- no check constraint. Nada a fazer la.
--
-- Como aplicar: Supabase > SQL Editor > cola e roda. Idempotente.
-- ============================================================

-- ============================================================
-- casos: colunas de status do enriquecimento eproc
-- ============================================================
alter table public.casos
  add column if not exists eproc_synced_at timestamptz,
  add column if not exists eproc_status text default 'pendente',
  add column if not exists eproc_ultimo_erro text;

-- Constraint do eproc_status (mesmos valores da 015 pro esaj_status)
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'casos_eproc_status_check') then
    alter table public.casos
      add constraint casos_eproc_status_check
      check (eproc_status is null or eproc_status in (
        'pendente',       -- nao foi pro eproc ainda OU sincronizou ha mais de 24h
        'ok',             -- enriquecido com sucesso, andamentos carregados
        'erro',           -- crawler tentou e bateu em erro tecnico
        'nao_encontrado', -- eproc respondeu mas sem dados do CNJ
        'rodando',        -- reservado pelo crawler em execucao (defesa contra paralelismo)
        'nao_aplicavel'   -- fora do escopo eproc TJSP (STJ/STF, CARF, CNJ truncado, etc)
      ));
  end if;
end $$;

-- Fila eproc: casos reais ativos ordenados por idade da ultima sync
create index if not exists casos_eproc_fila_idx
  on public.casos (eproc_synced_at nulls first)
  where eh_demo = false and status = 'ativo';

-- ============================================================
-- eproc_consultas_cnj: snapshot bruto por consulta NUMPROC
-- (espelha esaj_consultas_cnj, mas guarda HTML bruto pra auditoria)
-- ============================================================
create table if not exists public.eproc_consultas_cnj (
  id                     bigserial primary key,
  caso_id                bigint references public.casos(id) on delete cascade,
  cnj                    text not null,
  cenario                text check (cenario is null or cenario in (
    'detalhe', 'lista', 'erro', 'nao_encontrado', 'desconhecido'
  )),
  http_status            integer,
  html_bruto             text,            -- capa + lista de eventos extraida (auditoria)
  andamentos_capturados  integer,
  erro                   text,
  criado_em              timestamptz not null default now()
);

alter table public.eproc_consultas_cnj enable row level security;
grant all on table public.eproc_consultas_cnj to service_role;
grant usage, select on sequence public.eproc_consultas_cnj_id_seq to service_role;

create index if not exists eproc_consultas_cnj_caso_idx
  on public.eproc_consultas_cnj (caso_id, criado_em desc);
create index if not exists eproc_consultas_cnj_cnj_idx
  on public.eproc_consultas_cnj (cnj, criado_em desc);

-- ============================================================
-- sync_eproc_log: log das execucoes do crawler eproc
-- (espelha sync_esaj_log; tabela separada pra desacoplar metricas e debug)
-- ============================================================
create table if not exists public.sync_eproc_log (
  id                serial primary key,
  iniciado_em       timestamptz not null default now(),
  terminou_em       timestamptz,
  ok                boolean,
  erro              text,
  origem            text not null default 'manual'
    check (origem in ('manual', 'agendado')),
  criado_por        text,
  duracao_seg       integer,
  processos_lidos   integer,
  andamentos_novos  integer,
  casos_atualizados integer,
  modo              text default 'cnj'
);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'sync_eproc_log_modo_check') then
    alter table public.sync_eproc_log
      add constraint sync_eproc_log_modo_check
      check (modo is null or modo in ('cnj'));
  end if;
end $$;

create index if not exists sync_eproc_log_iniciado_idx
  on public.sync_eproc_log (iniciado_em desc);

alter table public.sync_eproc_log enable row level security;
grant select, insert, update on public.sync_eproc_log to service_role;
grant usage, select on sequence public.sync_eproc_log_id_seq to service_role;

-- ============================================================
-- andamentos: nada a fazer
-- ============================================================
-- A migration 011 ja declarou: fonte in (
--   'datajud', 'esaj-tjsp', 'eproc-tjsp', 'pje', 'projudi', 'manual'
-- )
-- Portanto 'eproc-tjsp' ja eh aceito. Sem alteracoes nessa tabela.
