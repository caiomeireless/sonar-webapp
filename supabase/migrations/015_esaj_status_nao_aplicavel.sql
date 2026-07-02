-- 015_esaj_status_nao_aplicavel.sql
-- ============================================================
-- Adiciona o valor 'nao_aplicavel' ao check constraint de esaj_status.
--
-- Motivo: hoje 88 casos com numero_processo malformado (recursos STJ/STF
-- como REsp/AREsp/Reclamacao, CNJ truncado por erro de digitacao, processo
-- administrativo CARF, etc) ficam ETERNAMENTE como 'pendente' na fila do
-- e-SAJ, poluindo o dashboard. Eles NAO sao consultaveis no e-SAJ TJSP
-- (STJ/STF: outro tribunal; CARF: nao judicial; CNJ truncado: precisa
-- correcao manual).
--
-- Solucao: 'nao_aplicavel' significa "este caso esta fora do escopo do
-- crawler e-SAJ TJSP". Aparece em cinza no painel, nao tenta novo enrich.
--
-- O UPDATE em si NAO entra nesta migration — eh feito via service role
-- separadamente apos esta alteracao de constraint ser aplicada.
--
-- Como aplicar: Supabase > SQL Editor > cola e roda. Idempotente.
-- ============================================================

alter table public.casos drop constraint if exists casos_esaj_status_check;

alter table public.casos
  add constraint casos_esaj_status_check
  check (esaj_status is null or esaj_status in (
    'pendente',       -- nao foi pro e-SAJ ainda OU sincronizou ha mais de 24h
    'ok',             -- enriquecido com sucesso, andamentos carregados
    'erro',           -- crawler tentou e bateu em erro tecnico
    'nao_encontrado', -- e-SAJ respondeu mas sem dados do CNJ (provavel eproc/PJe/etc)
    'rodando',        -- reservado pelo crawler em execucao (defesa contra paralelismo)
    'nao_aplicavel'   -- fora do escopo TJSP (STJ/STF, CARF, CNJ truncado, etc)
  ));
