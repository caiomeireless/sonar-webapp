-- 005_preferencias_cliente.sql
-- ============================================================
-- Preferencias por cliente (credor) — incluindo limite mensal de gasto
-- em pesquisas patrimoniais pagas (Assertiva, BigDataCorp, ARISP, etc).
--
-- O cliente do escritorio (credor) define um TETO de gasto mensal. O
-- escritorio respeita esse limite ao rodar consultas pagas no nome dos
-- devedores dele. Se `bloquear_ao_exceder` for true, a consulta que
-- ultrapassaria o teto e bloqueada/exige aprovacao extra; se false,
-- apenas alerta.
--
-- Como aplicar: Supabase > SQL Editor > cola e roda. Idempotente.
-- ============================================================

create table if not exists public.preferencias_cliente (
  credor_id bigint primary key references public.credores(id) on delete cascade,
  -- Limite mensal em R$. 0 = sem limite explicito (usa o do escritorio).
  limite_mensal_brl numeric(12, 2) not null default 0,
  -- Se true: bloqueia consulta que ultrapassaria. Se false: alerta mas permite.
  bloquear_ao_exceder boolean not null default true,
  -- Email do cliente que ajustou por ultimo (auditoria).
  ajustado_por text references public.perfis(email),
  ajustado_em timestamptz not null default now(),
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Limites GRANULARES por modo e por API individual. Adicionados em jun/2026.
-- A regra "mais restritivo vence": consulta paga sera bloqueada se estourar
-- QUALQUER dos 3 niveis (global, por modo, por API).
-- 0 = sem limite explicito no nivel correspondente.
alter table public.preferencias_cliente
  add column if not exists limite_combo_lead_brl numeric(12, 2) not null default 0,
  add column if not exists limite_combo_doc_brl numeric(12, 2) not null default 0,
  -- JSON com { "<api_id>": <limite_brl>, ... }; vazio = sem limite especifico
  add column if not exists limites_por_api jsonb not null default '{}'::jsonb;

alter table public.preferencias_cliente enable row level security;
grant all on table public.preferencias_cliente to service_role;

create index if not exists pref_credor_idx on public.preferencias_cliente (credor_id);
