-- ============================================================================
--  023 — ÍNDICE TRIGRAM PRO RADAR DE MOVIMENTAÇÕES (21/08)
--
--  O Radar (/equipe/radar) filtra `andamentos.descricao` com ~35 ILIKEs por
--  palavra-chave (penhora, sisbajud, leilão...). Sem índice isso vira seq
--  scan de 162 mil+ linhas a cada visita. O índice GIN + pg_trgm atende
--  ILIKE '%termo%' direto no plano da query.
--
--  Como aplicar: Supabase > SQL Editor > cole tudo > Run. Idempotente.
--  (A criação do índice leva alguns segundos na primeira vez — normal.)
-- ============================================================================

create extension if not exists pg_trgm;

create index if not exists andamentos_descricao_trgm_idx
  on public.andamentos
  using gin (descricao gin_trgm_ops);

-- "Última captura por fonte" do Console do Início: sem este índice o
-- ORDER BY capturado_em filtrado por fonte estoura o statement timeout
-- (erro 57014 visto em 21/08 — o e-SAJ aparecia como "—" na tela).
create index if not exists andamentos_fonte_capturado_idx
  on public.andamentos (fonte, capturado_em desc);

-- ============================================================================
--  CONFERÊNCIA:
--    explain analyse
--      select id from public.andamentos where descricao ilike '%penhora%'
--      limit 10;
--    -- deve mostrar "Bitmap Index Scan on andamentos_descricao_trgm_idx"
-- ============================================================================
