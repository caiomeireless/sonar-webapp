-- 024_imoveis_pesquisas.sql
-- ============================================================
-- Imóveis — pesquisa manual RI Digital (dossiê do devedor).
--
-- Não existe API de matrículas de imóveis: o advogado pesquisa
-- manualmente no RI Digital e registra aqui que a pesquisa foi
-- feita (data + observação), anexando o print do resultado e os
-- PDFs de eventuais matrículas. Tudo por devedor.
--
-- Segurança (mesmo padrão das tabelas sensíveis):
--   * RLS ligado SEM policies  -> só o service_role lê/escreve
--     (as Server Actions fazem o gate de equipe antes).
--   * revoke explícito de anon/authenticated.
--   * bucket PRIVADO com limite de 20 MB e mimes restritos —
--     camada que nenhum caminho de código dribla.
--
-- Como aplicar: Supabase > SQL Editor > cole tudo > Run. Idempotente.
-- ============================================================

create table if not exists public.imoveis_pesquisas (
  id bigint generated always as identity primary key,
  devedor_id bigint not null references public.devedores(id),
  pesquisado_em timestamptz not null default now(),
  observacao text,
  -- E-mail de quem registrou a pesquisa (equipe).
  criado_por text not null,
  -- Lista de {path, nome, tipo: 'print'|'matricula', content_type}.
  anexos jsonb not null default '[]',
  criado_em timestamptz default now()
);

create index if not exists imoveis_pesquisas_devedor_idx
  on public.imoveis_pesquisas (devedor_id);

-- RLS ligado SEM policies: nenhum acesso via anon/authenticated;
-- somente o service_role (que ignora RLS) enxerga a tabela.
alter table public.imoveis_pesquisas enable row level security;

revoke all on table public.imoveis_pesquisas from anon, authenticated;

-- GRANTs obrigatórios para a Data API (mudança Supabase out/2026):
grant all on table public.imoveis_pesquisas to service_role;
grant usage, select on sequence public.imoveis_pesquisas_id_seq to service_role;

-- Bucket PRIVADO dos anexos (print do resultado + PDFs de matrículas).
-- Limite de 20 MB por arquivo e mimes restritos garantidos pelo bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'imoveis-pesquisas',
  'imoveis-pesquisas',
  false,
  20971520, -- 20 MB
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do nothing;

-- Recarrega o schema cache do PostgREST.
notify pgrst, 'reload schema';
