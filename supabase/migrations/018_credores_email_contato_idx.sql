-- 018_credores_email_contato_idx.sql
-- ============================================================
-- Indice funcional em credores.email_contato pra acelerar o login
-- do portal cliente e todo lookup de credor por email.
--
-- Antes: cada abertura de /cliente/* fazia sequential scan em credores
-- ate achar o email_contato (varre a tabela toda). Com ~200 credores
-- ainda e' rapido, mas fica visivelmente lento na medida que a base cresce
-- (a plataforma tem 187 credores hoje e vai crescer).
--
-- As queries no TS usam .eq("email_contato", email.toLowerCase().trim()) —
-- comparacao direta com o valor da coluna. Um indice btree simples da
-- lookup O(log n) desde que o email seja gravado ja em lowercase (padrao
-- do cadastro). NULL fica de fora do indice (parcial WHERE not null),
-- economizando espaco.
--
-- Como aplicar: Supabase > SQL Editor > cola e roda. Idempotente.
-- ============================================================

create index if not exists credores_email_contato_idx
  on public.credores (email_contato)
  where email_contato is not null;

-- Recarrega schema cache do PostgREST.
notify pgrst, 'reload schema';
