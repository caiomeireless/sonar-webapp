-- 006_dashboard_columns.sql
-- ============================================================
-- Colunas pra destravar metricas de ROI no Dashboard do Caso:
--
--   - custos.devedor_id  -> custo de API por devedor (custo acumulado
--     vs valor recuperado = ROI real do rastreamento)
--   - medidas_tomadas.valor_recuperado_brl  -> quanto cada penhora
--     trouxe de volta (so faz sentido pra resultado='positivo' em
--     medidas tipo penhora_efetivada, sisbajud, infojud)
--
-- Ambas NULLABLE — dados historicos nao tinham essas colunas.
--
-- Como aplicar: Supabase > SQL Editor > cola e roda. Idempotente.
-- ============================================================

alter table public.custos
  add column if not exists devedor_id bigint references public.devedores(id) on delete set null;

create index if not exists custos_devedor_idx on public.custos (devedor_id) where devedor_id is not null;

alter table public.medidas_tomadas
  add column if not exists valor_recuperado_brl numeric(14, 2);
