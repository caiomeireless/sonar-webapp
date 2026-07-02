-- ============================================================
-- 014_documento_nullable.sql
-- Permite NULL em credores.documento e devedores.documento
-- Motivo: Themis tem 488 pessoas legitimas sem CPF/CNPJ cadastrado
-- (espolio, condominio em formacao, PJ estrangeira, devedor antes de
-- enriquecimento Receita, etc). Sao alcancadas via themis_id como
-- chave alternativa. Postgres permite multiplos NULLs no UNIQUE por
-- padrao (NULL nao se compara igual a NULL em constraint UNIQUE).
-- ============================================================

alter table public.credores alter column documento drop not null;
alter table public.devedores alter column documento drop not null;

-- UNIQUE (documento) ja existe e continua valido — multiplos NULL sao ok.
-- Lookups por themis_id ja sao indexados em 009_themis_sync.
