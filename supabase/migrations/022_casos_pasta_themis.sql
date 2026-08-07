-- 022_casos_pasta_themis.sql
-- ============================================================
-- Pasta REAL do Themis no caso (ex.: "1214A - 142").
--
-- Bug corrigido: a UI mostrava "Pasta #<id interno do Sonar>" — que
-- obviamente nunca batia com a pasta que a equipe conhece do Themis.
-- O importador passa a gravar p.pasta aqui; a UI exibe e a busca
-- (Fila Themis + Banco de Devedores) encontra por ela.
--
-- Backfill: automatico na proxima rodada do importador (a pasta entrou
-- no hash de mudanca, entao todos os casos serao atualizados 1x).
--
-- Como aplicar: Supabase > SQL Editor > cola e roda. Idempotente.
-- ============================================================

alter table public.casos
  add column if not exists pasta_themis text;

create index if not exists casos_pasta_themis_idx
  on public.casos (pasta_themis)
  where pasta_themis is not null;

notify pgrst, 'reload schema';
