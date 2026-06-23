-- 007_dashboard_caso_v2.sql
-- ============================================================
-- Colunas pra suportar as 10 metricas novas do Dashboard do Caso v2:
--
--   - casos.data_distribuicao        -> base do calculo de prescricao (CPC 921)
--   - casos.marcos_processuais jsonb -> citacao, sentenca, transito_julgado,
--                                      inicio_cumprimento (cronologia)
--   - bens_encontrados.restricao_suspeita boolean  -> bem com possivel
--                                      impenhorabilidade (bem de familia,
--                                      salario, poupanca <40SM, etc)
--   - bens_encontrados.restricao_motivo text       -> motivo legal abreviado
--                                      ('lei_8009', 'cpc_833_iv', 'cpc_833_x', ...)
--   - bens_encontrados.cidade text  -> cidade onde o bem fisicamente esta
--   - bens_encontrados.uf char(2)   -> UF do bem (filtragem SP vs BR no mapa)
--
-- Como aplicar: Supabase > SQL Editor > cola e roda. Idempotente.
-- ============================================================

-- CASOS
alter table public.casos
  add column if not exists data_distribuicao date,
  add column if not exists marcos_processuais jsonb not null default '{}'::jsonb;

create index if not exists casos_data_distribuicao_idx on public.casos (data_distribuicao);

-- BENS_ENCONTRADOS
alter table public.bens_encontrados
  add column if not exists restricao_suspeita boolean not null default false,
  add column if not exists restricao_motivo text,
  add column if not exists cidade text,
  add column if not exists uf char(2);

create index if not exists bens_uf_idx on public.bens_encontrados (uf) where uf is not null;
create index if not exists bens_restricao_idx on public.bens_encontrados (restricao_suspeita) where restricao_suspeita;
