-- Migration 008: tabela demo_tokens
-- ============================================================
-- Persistencia dos codigos de 6 digitos que dao acesso a demo.
-- Antes os tokens ficavam in-memory na lib (array _tokens). Na
-- Vercel, cada serverless function pode estar em uma instancia
-- diferente -> o codigo gerado em uma POST submit sumia quando
-- o visitante tentava resgatar via GET /api/demo/{codigo} (cold
-- start ou instancia diferente).
--
-- Resolve persistindo num Postgres unico (Supabase). TTL de 24h
-- (validacao em codigo). Codigo de 6 digitos com unicidade
-- garantida pela PK + retry no insert.
-- ============================================================

create table if not exists public.demo_tokens (
  codigo char(6) primary key,
  tipo text not null check (tipo in ('equipe', 'cliente')),
  nome_visitante text not null,
  email_visitante text not null,
  motivo text,
  criado_em timestamptz not null default now(),
  consumido_em timestamptz
);

alter table public.demo_tokens enable row level security;

-- GRANT pro service_role (regra do projeto desde out/2026)
grant all on table public.demo_tokens to service_role;

-- Indice pra garbage collection eficiente
create index if not exists demo_tokens_criado_em_idx
  on public.demo_tokens (criado_em);
