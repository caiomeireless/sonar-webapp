-- 003_credores_devedores.sql
-- ============================================================
-- Modelo de dominio do Sonar:
--   - credores: clientes do escritorio (o credor da execucao)
--   - devedores: alvo da busca patrimonial (CPF/CNPJ rastreado)
--   - casos: ligacao credor-devedor (1 caso = 1 execucao buscando bens)
--   - bens_encontrados: catalogo unificado dos achados (veiculo,
--     imovel, empresa, processo_credito, endereco, vinculo)
--
-- Como aplicar: Supabase > SQL Editor > cola e roda. Idempotente.
-- ============================================================

-- ============================================================
-- CREDORES — clientes do escritorio
-- ============================================================
create table if not exists public.credores (
  id bigserial primary key,
  tipo text not null check (tipo in ('PF', 'PJ')),
  documento text not null,
  nome text not null,
  email_contato text,
  telefone text,
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (documento)
);

alter table public.credores enable row level security;
grant all on table public.credores to service_role;
grant usage, select on sequence public.credores_id_seq to service_role;

create index if not exists credores_nome_idx on public.credores using gin (to_tsvector('portuguese', nome));
create index if not exists credores_tipo_idx on public.credores (tipo);

-- ============================================================
-- DEVEDORES — alvos da busca patrimonial
-- ============================================================
create table if not exists public.devedores (
  id bigserial primary key,
  tipo text not null check (tipo in ('PF', 'PJ')),
  documento text not null,
  nome text not null,
  data_nascimento date,
  nome_mae text,
  ultima_consulta_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (documento)
);

alter table public.devedores enable row level security;
grant all on table public.devedores to service_role;
grant usage, select on sequence public.devedores_id_seq to service_role;

create index if not exists devedores_nome_idx on public.devedores using gin (to_tsvector('portuguese', nome));
create index if not exists devedores_tipo_idx on public.devedores (tipo);
create index if not exists devedores_ultima_consulta_idx on public.devedores (ultima_consulta_em desc nulls last);

-- ============================================================
-- CASOS — ligacao credor-devedor (uma execucao)
-- ============================================================
create table if not exists public.casos (
  id bigserial primary key,
  credor_id bigint not null references public.credores(id) on delete cascade,
  devedor_id bigint not null references public.devedores(id) on delete cascade,
  numero_processo text,
  valor_credito_brl numeric(14, 2),
  status text not null default 'ativo' check (status in ('ativo', 'pausado', 'encerrado', 'satisfeito')),
  responsavel_email text references public.perfis(email),
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (credor_id, devedor_id)
);

alter table public.casos enable row level security;
grant all on table public.casos to service_role;
grant usage, select on sequence public.casos_id_seq to service_role;

create index if not exists casos_credor_idx on public.casos (credor_id);
create index if not exists casos_devedor_idx on public.casos (devedor_id);
create index if not exists casos_status_idx on public.casos (status);
create index if not exists casos_responsavel_idx on public.casos (responsavel_email);

-- ============================================================
-- BENS_ENCONTRADOS — catalogo unificado dos achados
-- ============================================================
-- Cada bem pertence a um devedor (nao ao caso) — assim o mesmo
-- bem aparece em todos os casos que rastreiam aquele devedor.
-- detalhes (jsonb) guarda dados especificos por tipo:
--   veiculo: { placa, marca, modelo, ano, restricao }
--   imovel: { matricula, endereco, area_m2, tipo: urbano|rural }
--   empresa: { cnpj, razao_social, qual_participacao, percent }
--   processo_credito: { numero_cnj, tribunal, valor_estimado, polo }
--   endereco: { logradouro, cidade, uf, cep, data_origem }
--   vinculo: { tipo: conjuge|filho|pai|mae|irmao, nome, documento }
-- ============================================================
create table if not exists public.bens_encontrados (
  id bigserial primary key,
  devedor_id bigint not null references public.devedores(id) on delete cascade,
  tipo text not null check (tipo in ('veiculo', 'imovel', 'empresa', 'processo_credito', 'endereco', 'vinculo')),
  fonte text not null,
  fonte_consultada_em timestamptz not null default now(),
  titulo text not null,
  detalhes jsonb not null default '{}',
  valor_estimado_brl numeric(14, 2),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

alter table public.bens_encontrados enable row level security;
grant all on table public.bens_encontrados to service_role;
grant usage, select on sequence public.bens_encontrados_id_seq to service_role;

create index if not exists bens_devedor_idx on public.bens_encontrados (devedor_id);
create index if not exists bens_tipo_idx on public.bens_encontrados (tipo);
create index if not exists bens_ativo_idx on public.bens_encontrados (ativo) where ativo;
