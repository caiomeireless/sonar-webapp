-- 004_medidas_tomadas.sql
-- ============================================================
-- Historico de medidas processuais tomadas por caso.
-- Cada linha = uma acao do advogado (SISBAJUD rodado, RENAJUD oficiado,
-- peticao de penhora protocolada, audiencia realizada, etc).
--
-- Renderiza como timeline horizontal no dossie do devedor — agrega TODAS
-- as medidas dos casos vinculados aquele devedor.
--
-- Como aplicar: Supabase > SQL Editor > cola e roda. Idempotente.
-- ============================================================

create table if not exists public.medidas_tomadas (
  id bigserial primary key,
  caso_id bigint not null references public.casos(id) on delete cascade,
  data date not null,
  tipo text not null check (tipo in (
    'sisbajud', 'infojud', 'renajud', 'arisp', 'oficio_cartorio', 'oficio_junta',
    'peticao_penhora', 'penhora_efetivada', 'audiencia', 'recurso',
    'cumprimento_sentenca', 'sniper', 'serasajud', 'outro'
  )),
  resultado text not null check (resultado in ('positivo', 'negativo', 'parcial', 'aguardando', 'nao_aplica')),
  titulo text not null,
  detalhes text,
  advogado_email text references public.perfis(email),
  criado_em timestamptz not null default now()
);

alter table public.medidas_tomadas enable row level security;
grant all on table public.medidas_tomadas to service_role;
grant usage, select on sequence public.medidas_tomadas_id_seq to service_role;

create index if not exists medidas_caso_idx on public.medidas_tomadas (caso_id);
create index if not exists medidas_data_idx on public.medidas_tomadas (data desc);
