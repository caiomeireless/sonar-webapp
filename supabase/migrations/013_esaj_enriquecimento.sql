-- 013_esaj_enriquecimento.sql
-- ============================================================
-- Themis = fonte mestre. e-SAJ enriquece por CNJ.
--
-- Adiciona em casos:
--   - parte_ativa boolean         (true=polo ativo/credor, false=passivo; do Themis parteAtiva)
--   - tipo_execucao text          ('cumprimento' | 'execucao' | 'outro')
--   - esaj_synced_at timestamptz  (ultima vez que e-SAJ visitou esse CNJ)
--   - esaj_status text            ('pendente' | 'ok' | 'erro' | 'nao_encontrado')
--   - esaj_ultimo_erro text
--   - desdobramento_de_caso_id    (auto-FK; filho herda credor+devedor do pai)
--   - desdobramento_themis_id     (id do desdobramento no payload Themis)
--
-- E:
--   - esaj_consultas_cnj          (snapshot bruto por CNJ, analogo a esaj_consultas_oab)
--   - drop unique(credor_id,devedor_id) que bloqueava 2+ casos por par (pai + filhos)
--   - unique parcial em numero_processo (1 caso por CNJ)
--   - novos contadores em sync_esaj_log + coluna `modo`
--
-- Como aplicar: Supabase > SQL Editor > cola e roda. Idempotente.
-- ============================================================

alter table public.casos
  add column if not exists parte_ativa boolean,
  add column if not exists tipo_execucao text,
  add column if not exists esaj_synced_at timestamptz,
  add column if not exists esaj_status text default 'pendente',
  add column if not exists esaj_ultimo_erro text,
  add column if not exists desdobramento_de_caso_id bigint
    references public.casos(id) on delete set null,
  add column if not exists desdobramento_themis_id bigint;

-- Constraints (separadas pra serem idempotentes)
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'casos_tipo_execucao_check') then
    alter table public.casos
      add constraint casos_tipo_execucao_check
      check (tipo_execucao is null or tipo_execucao in ('cumprimento','execucao','outro'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'casos_esaj_status_check') then
    alter table public.casos
      add constraint casos_esaj_status_check
      check (esaj_status is null or esaj_status in ('pendente','ok','erro','nao_encontrado'));
  end if;
end $$;

-- Drop do unique(credor_id, devedor_id) que bloqueia desdobramentos no mesmo par.
-- Pai + filho de cumprimento sao 2 casos legitimos com mesmo credor+devedor.
alter table public.casos drop constraint if exists casos_credor_id_devedor_id_key;

-- Unicidade real do CNJ (1 caso por numero_processo, ignora nulos)
create unique index if not exists casos_numero_processo_uniq
  on public.casos (numero_processo)
  where numero_processo is not null;

-- Unique do desdobramento_themis_id (pra upsert sem duplicar filhos)
create unique index if not exists casos_desdobramento_themis_id_uniq
  on public.casos (desdobramento_themis_id)
  where desdobramento_themis_id is not null;

-- Fila e-SAJ: casos reais ativos ordenados por idade da ultima sync
create index if not exists casos_esaj_fila_idx
  on public.casos (esaj_synced_at nulls first)
  where eh_demo = false and status = 'ativo';

create index if not exists casos_desdobramento_pai_idx
  on public.casos (desdobramento_de_caso_id)
  where desdobramento_de_caso_id is not null;

-- ============================================================
-- esaj_consultas_cnj: snapshot bruto por consulta NUMPROC
-- ============================================================
create table if not exists public.esaj_consultas_cnj (
  id            bigserial primary key,
  caso_id       bigint references public.casos(id) on delete set null,
  cnj           text not null,
  cenario       text not null check (cenario in (
    'detalhe', 'lista', 'erro', 'nao_encontrado', 'desconhecido'
  )),
  processo      jsonb,
  erro          text,
  consultado_em timestamptz not null default now(),
  duracao_ms    integer
);

alter table public.esaj_consultas_cnj enable row level security;
grant all on table public.esaj_consultas_cnj to service_role;
grant usage, select on sequence public.esaj_consultas_cnj_id_seq to service_role;

create index if not exists esaj_consultas_cnj_cnj_idx
  on public.esaj_consultas_cnj (cnj, consultado_em desc);
create index if not exists esaj_consultas_cnj_caso_idx
  on public.esaj_consultas_cnj (caso_id, consultado_em desc);

-- ============================================================
-- sync_esaj_log: novos contadores + modo (oab/cnj)
-- ============================================================
alter table public.sync_esaj_log
  add column if not exists casos_atualizados integer,
  add column if not exists desdobramentos_criados integer,
  add column if not exists modo text default 'oab';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'sync_esaj_log_modo_check') then
    alter table public.sync_esaj_log
      add constraint sync_esaj_log_modo_check
      check (modo is null or modo in ('oab','cnj'));
  end if;
end $$;

-- ============================================================
-- caso_id na tabela andamentos (vinculo direto pra queries rapidas)
-- ============================================================
-- Ja existe a coluna caso_id em andamentos (migration 011), mas adicionar
-- indice se faltar (tava sem WHERE):
create index if not exists andamentos_caso_id_idx
  on public.andamentos (caso_id) where caso_id is not null;
