-- 019_perfis_credor_id.sql
-- ============================================================
-- Sprint 2 — Cadastro de cliente sem SQL.
--
-- 1) perfis.credor_id: FK opcional ligando o perfil de login (email) ao
--    credor correspondente. Antes a ligacao era so implicita via
--    credores.email_contato = perfis.email; a FK torna o vinculo estavel
--    (sobrevive a troca de email de contato do credor) e permite que um
--    perfil cliente aponte pro credor mesmo quando os emails divergem.
--
-- 2) Backfill: todo perfil papel='cliente' cujo email bate com o
--    email_contato de um credor ganha o credor_id na hora.
--
-- Como aplicar: Supabase > SQL Editor > cola e roda. Idempotente.
-- ============================================================

alter table public.perfis
  add column if not exists credor_id bigint references public.credores(id);

create index if not exists perfis_credor_id_idx
  on public.perfis (credor_id)
  where credor_id is not null;

-- Backfill: liga perfis-cliente existentes ao credor pelo email de contato.
update public.perfis p
  set credor_id = c.id
  from public.credores c
  where p.credor_id is null
    and p.papel = 'cliente'
    and lower(c.email_contato) = lower(p.email);

-- Recarrega schema cache do PostgREST.
notify pgrst, 'reload schema';
