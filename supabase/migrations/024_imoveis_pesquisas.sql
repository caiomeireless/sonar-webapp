-- 024_imoveis_pesquisas.sql
-- ============================================================
-- DOIS módulos manuais do dossiê do devedor:
--
--   1) Imóveis — pesquisa manual RI Digital (tabela
--      `imoveis_pesquisas`): não existe API de matrículas de
--      imóveis, então o advogado pesquisa manualmente no RI
--      Digital e registra aqui que a pesquisa foi feita (data +
--      observação), anexando o print do resultado e os PDFs de
--      eventuais matrículas.
--
--   2) Mandado de Avaliação e Penhora — endereços confirmados
--      (tabela `enderecos_mandados`): o advogado registra a
--      expedição e o cumprimento do mandado num endereço do
--      devedor (aguardando / cumprido positivo / cumprido
--      negativo), anexando a certidão do oficial de justiça.
--
-- Os dois módulos compartilham o MESMO bucket privado
-- `imoveis-pesquisas` (paths com sufixos distintos por módulo).
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

-- ------------------------------------------------------------
-- Mandado de Avaliação e Penhora — endereços confirmados.
-- Um registro por mandado expedido; a certidão do oficial de
-- justiça entra como anexo no MESMO bucket dos imóveis.
-- ------------------------------------------------------------

create table if not exists public.enderecos_mandados (
  id bigint generated always as identity primary key,
  devedor_id bigint not null references public.devedores(id),
  -- Situação do mandado no endereço.
  resultado text not null
    check (resultado in ('aguardando', 'cumprido_positivo', 'cumprido_negativo')),
  -- Endereço / observação livre do advogado.
  observacao text,
  -- E-mail de quem registrou o mandado (equipe).
  criado_por text not null,
  -- Lista de {path, nome, tipo: 'certidao', content_type}.
  anexos jsonb not null default '[]',
  criado_em timestamptz default now()
);

create index if not exists enderecos_mandados_devedor_idx
  on public.enderecos_mandados (devedor_id);

-- RLS ligado SEM policies: nenhum acesso via anon/authenticated;
-- somente o service_role (que ignora RLS) enxerga a tabela.
alter table public.enderecos_mandados enable row level security;

revoke all on table public.enderecos_mandados from anon, authenticated;

-- GRANTs obrigatórios para a Data API (mudança Supabase out/2026):
grant all on table public.enderecos_mandados to service_role;
grant usage, select on sequence public.enderecos_mandados_id_seq to service_role;

-- ------------------------------------------------------------
-- Bucket PRIVADO COMPARTILHADO pelos dois módulos: anexos das
-- pesquisas de imóveis (print + matrículas) E certidões de
-- mandado de avaliação e penhora.
-- Limite de 20 MB por arquivo e mimes restritos garantidos pelo bucket.
-- ------------------------------------------------------------
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
