-- 009_themis_sync.sql
-- ============================================================
-- Sincronizacao Themis -> Sonar
--
-- Adiciona em credores / devedores / casos:
--   - themis_id (bigint): correlacao com o registro la no Themis
--   - themis_synced_at (timestamptz): quando foi sincronizado pela ultima vez
--   - themis_hash (text): impressao digital do estado conhecido (detectar mudanca)
--
-- E o flag eh_demo (devedores e casos): protege os 3 mocks do showroom
-- (Carlos Eduardo, Construtora Horizonte, Maria) de serem misturados com
-- os dados reais que vierem do Themis. Sync NUNCA toca rows com eh_demo=true.
--
-- Como aplicar: Supabase > SQL Editor > cola e roda. Idempotente.
-- ============================================================

-- ============================================================
-- CREDORES
-- ============================================================
alter table public.credores
  add column if not exists themis_id bigint;

create unique index if not exists credores_themis_id_key
  on public.credores (themis_id)
  where themis_id is not null;

alter table public.credores
  add column if not exists themis_synced_at timestamptz;

alter table public.credores
  add column if not exists themis_hash text;

-- ============================================================
-- DEVEDORES
-- ============================================================
alter table public.devedores
  add column if not exists themis_id bigint;

create unique index if not exists devedores_themis_id_key
  on public.devedores (themis_id)
  where themis_id is not null;

alter table public.devedores
  add column if not exists themis_synced_at timestamptz;

alter table public.devedores
  add column if not exists themis_hash text;

alter table public.devedores
  add column if not exists eh_demo boolean not null default false;

create index if not exists devedores_eh_demo_idx
  on public.devedores (eh_demo)
  where eh_demo;

-- ============================================================
-- CASOS
-- ============================================================
alter table public.casos
  add column if not exists themis_id bigint;

create unique index if not exists casos_themis_id_key
  on public.casos (themis_id)
  where themis_id is not null;

alter table public.casos
  add column if not exists themis_synced_at timestamptz;

alter table public.casos
  add column if not exists themis_hash text;

alter table public.casos
  add column if not exists eh_demo boolean not null default false;

create index if not exists casos_eh_demo_idx
  on public.casos (eh_demo)
  where eh_demo;

-- ============================================================
-- Marca os mocks existentes como demo
-- ============================================================
-- Carlos Eduardo, Construtora Horizonte, Maria sao os 3 devedores do
-- showroom (sonar-bpa.vercel.app). Quando a sync popular com dados reais,
-- esses 3 + casos relacionados ficam isolados via eh_demo=true.
update public.devedores
  set eh_demo = true
  where nome ilike 'Carlos Eduardo%'
     or nome ilike 'Construtora Horizonte%'
     or nome ilike 'Maria %';

update public.casos
  set eh_demo = true
  where devedor_id in (select id from public.devedores where eh_demo = true);
