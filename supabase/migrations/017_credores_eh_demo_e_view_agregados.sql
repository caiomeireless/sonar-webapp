-- 017_credores_eh_demo_e_view_agregados.sql
-- ============================================================
-- Dois consertos de uma vez (descobertos no smoke test 2026-06-30/07-01):
--
-- 1) eh_demo em CREDORES.
--    Migration 009 adicionou eh_demo em devedores e casos, mas NAO em
--    credores. Consequencia: o credor demo "Comercial Vertice" aparecia
--    na carteira real, e um filtro .eq('eh_demo', false) em credores
--    quebrava silenciosamente (coluna inexistente -> catch -> []).
--    Marca como demo todo credor cujo unico vinculo e' com casos demo.
--
-- 2) View credores_com_agregados.
--    /equipe/devedores (listarCredoresComResumo) fazia 1 + 3N queries
--    (~151 pra 50 credores, 5-15s). A view agrega casos + devedores +
--    bens em UM SELECT com laterais — a pagina cai pra 1 query (~500ms).
--    So conta casos reais (eh_demo = false); credor sem caso real fica
--    de fora (comportamento identico ao filtro em TS aplicado 2026-06-30).
--
-- Como aplicar: Supabase > SQL Editor > cola e roda. Idempotente.
-- Depois: notify pgrst, 'reload schema';
-- ============================================================

-- ============================================================
-- 1) credores.eh_demo
-- ============================================================
alter table public.credores
  add column if not exists eh_demo boolean not null default false;

create index if not exists credores_eh_demo_idx
  on public.credores (eh_demo)
  where eh_demo;

-- Marca credores demo: aqueles cujos casos sao TODOS eh_demo=true
-- (e que tem pelo menos 1 caso). Credor sem caso nenhum fica false —
-- pode ser cadastro novo aguardando primeiro caso.
update public.credores c
  set eh_demo = true
  where exists (select 1 from public.casos k where k.credor_id = c.id)
    and not exists (
      select 1 from public.casos k
      where k.credor_id = c.id and k.eh_demo = false
    );

-- ============================================================
-- 2) View de agregados da carteira (nivel 1 da hierarquia)
-- ============================================================
-- security_invoker nao importa aqui: o webapp le via service_role
-- (createAdminClient). RLS das tabelas-base continua intacta.
create or replace view public.credores_com_agregados as
select
  c.id,
  c.tipo,
  c.documento,
  c.nome,
  c.email_contato,
  c.telefone,
  c.observacoes,
  agg.total_casos,
  agg.total_devedores,
  coalesce(b.total_bens, 0)                 as total_bens,
  coalesce(b.valor_estimado_total_brl, 0)   as valor_estimado_total_brl,
  b.ultima_consulta_em
from public.credores c
join lateral (
  -- casos REAIS do credor (eh_demo=false); traz tambem o set de devedores
  select
    count(*)::int                       as total_casos,
    count(distinct k.devedor_id)::int   as total_devedores
  from public.casos k
  where k.credor_id = c.id
    and k.eh_demo = false
) agg on agg.total_casos > 0            -- credor sem caso real fica fora
left join lateral (
  select
    count(*)::int                       as total_bens,
    sum(be.valor_estimado_brl)          as valor_estimado_total_brl,
    max(be.fonte_consultada_em)         as ultima_consulta_em
  from public.bens_encontrados be
  where be.ativo
    and be.devedor_id in (
      select k2.devedor_id from public.casos k2
      where k2.credor_id = c.id and k2.eh_demo = false
    )
) b on true
where c.eh_demo = false;

grant select on public.credores_com_agregados to service_role;

-- ============================================================
-- Recarrega o schema cache do PostgREST (rodar junto):
-- notify pgrst, 'reload schema';
-- ============================================================
notify pgrst, 'reload schema';
