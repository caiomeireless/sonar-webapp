-- 021_devedores_origem_campos.sql
-- ============================================================
-- Origem por CAMPO do devedor — alimenta as etiquetas da ficha
-- (VIA THEMIS / VIA ASSERTIVA / MANUAL) com a fonte REAL de cada dado,
-- em vez do chute hardcoded que etiquetava tudo como Themis.
--
-- Formato: { "telefone": "assertiva", "email": "assertiva",
--            "nome_mae": "themis", ... }
-- Campos sem entrada usam o fallback do código (dados base = themis).
--
-- Como aplicar: Supabase > SQL Editor > cola e roda. Idempotente.
-- ============================================================

alter table public.devedores
  add column if not exists origem_campos jsonb not null default '{}';

notify pgrst, 'reload schema';
