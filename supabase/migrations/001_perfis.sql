-- 001_perfis.sql
-- ============================================================
-- Tabela de perfis: papel + acessos granulares por email.
-- Papeis:
--   - admin/socio: equipe, acesso completo (escrita + leitura)
--   - funcionario: equipe, acesso por chave em `acessos`
--   - cliente: portal externo, SOMENTE LEITURA dos proprios processos
--
-- Como aplicar:
--   Supabase > SQL Editor > cole tudo > Run. Idempotente.
-- ============================================================

create table if not exists public.perfis (
  email text primary key,
  nome text not null default '',
  foto_path text,
  papel text not null default 'funcionario',
  acessos text[] not null default '{}',
  atualizado_em timestamptz not null default now()
);

-- CHECK constraint: trava papel a nivel de banco
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'perfis_papel_chk'
  ) then
    alter table public.perfis
      add constraint perfis_papel_chk
      check (papel in ('admin','socio','funcionario','cliente'));
  end if;
end$$;

alter table public.perfis enable row level security;

-- GRANTs obrigatorios (regra Data API Supabase, out/2026)
grant all on table public.perfis to service_role;

-- Indice para busca por papel (filtros no admin)
create index if not exists perfis_papel_idx on public.perfis (papel);

-- Bucket privado para avatares (criar se nao existir)
insert into storage.buckets (id, name, public)
values ('avatares', 'avatares', false)
on conflict (id) do nothing;

-- Semeia o dono / super-admin inicial.
-- TROCAR pelo email do Caio antes de rodar:
insert into public.perfis (email, nome, papel)
values ('caio@bpadvogados.com.br', 'Caio Vicentino', 'admin')
on conflict (email) do nothing;
