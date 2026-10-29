-- 025 — ANÁLISE DE AUTOS (capa a capa)
-- ============================================================
-- Como aplicar:
--   Supabase > SQL Editor > cole tudo > Run.
--   Tudo idempotente: pode rodar várias vezes sem efeito colateral.
--
-- Por que esta migration existe:
--   O Themis saiu do ar como fonte de alimentação. A partir de agora o
--   capa a capa jogado pelo advogado é que alimenta a base. Para isso,
--   três eixos centrais da análise não tinham onde morar:
--     1. medida ATÍPICA (CPC 139, IV) era REJEITADA pelo CHECK do `tipo`;
--     2. não havia coluna de valor em R$ (bloqueado x liberado);
--     3. não havia ordem, nem as quatro datas que separam requerida de
--        deferida, de cumprida, do resultado.
--   Mais o job da análise em si, e o débito atualizado do processo.
-- ============================================================

-- ============================================================
-- 1) MEDIDAS_TOMADAS — abre o vocabulário e ganha os eixos novos
-- ============================================================

-- O CHECK antigo tinha 14 valores e barrava toda medida atípica. O novo é
-- SUPERCONJUNTO do antigo: nenhuma linha existente vira inválida.
alter table public.medidas_tomadas
  drop constraint if exists medidas_tomadas_tipo_check;

alter table public.medidas_tomadas
  add constraint medidas_tomadas_tipo_check check (tipo in (
    -- ---- vocabulário legado (mantido na íntegra) ----
    'sisbajud', 'infojud', 'renajud', 'arisp', 'oficio_cartorio', 'oficio_junta',
    'peticao_penhora', 'penhora_efetivada', 'audiencia', 'recurso',
    'cumprimento_sentenca', 'sniper', 'serasajud', 'outro',
    -- ---- típicas que faltavam (CPC 824 a 909) ----
    'citacao', 'sisbajud_teimosinha', 'penhora_imovel', 'penhora_faturamento',
    'penhora_quotas', 'penhora_credito', 'penhora_precatorio',
    'penhora_estoque_semovente', 'penhora_rosto_autos', 'cnib', 'protesto',
    'oficial_justica_penhora', 'avaliacao', 'adjudicacao', 'alienacao_judicial',
    'arresto', 'busca_apreensao',
    -- ---- atípicas (CPC 139, IV — ADI 5.941/STF) ----
    'suspensao_cnh', 'apreensao_passaporte', 'bloqueio_cartoes',
    'proibicao_licitar', 'quebra_sigilo_fiscal', 'quebra_sigilo_bancario',
    'idpj', 'fraude_execucao', 'grupo_economico', 'astreintes',
    'inclusao_cadastro_inadimplentes'
  ));

-- Resultado ganha dois estados que os autos exigem e não existiam:
-- 'indeferida' (o juízo negou) e 'abandonada' (pedida e nunca decidida).
alter table public.medidas_tomadas
  drop constraint if exists medidas_tomadas_resultado_check;

alter table public.medidas_tomadas
  add constraint medidas_tomadas_resultado_check check (resultado in (
    'positivo', 'negativo', 'parcial', 'aguardando', 'nao_aplica',
    'indeferida', 'abandonada'
  ));

alter table public.medidas_tomadas
  -- típica (lei processual) x atípica (poder geral de efetivação)
  add column if not exists classe text
    check (classe is null or classe in ('tipica', 'atipica')),
  -- os quatro estados, que `data` sozinha não distinguia
  add column if not exists requerida_em date,
  add column if not exists deferida_em date,
  add column if not exists cumprida_em date,
  -- dinheiro: constrição e satisfação são números diferentes
  add column if not exists valor_bloqueado_brl numeric(14, 2),
  add column if not exists valor_liberado_brl numeric(14, 2),
  -- rastro de auditoria: de que páginas do capa a capa isto saiu
  add column if not exists paginas integer[],
  add column if not exists trecho text,
  -- de onde veio o registro (fonte primária agora é 'autos')
  add column if not exists origem text not null default 'manual'
    check (origem in ('manual', 'themis', 'esaj', 'eproc', 'autos')),
  -- posição no caminho da execução (para a trilha visual)
  add column if not exists ordem smallint;

create index if not exists medidas_origem_idx on public.medidas_tomadas (origem);
create index if not exists medidas_classe_idx on public.medidas_tomadas (classe);

-- ============================================================
-- 2) AUTOS_ANALISES — o job de uma análise de capa a capa
-- ============================================================

create table if not exists public.autos_analises (
  id bigserial primary key,

  -- Vínculo. Fica nulo até o advogado confirmar a quem o processo pertence:
  -- a análise nasce solta e só depois é promovida à biblioteca.
  devedor_id bigint references public.devedores(id) on delete set null,
  caso_id bigint references public.casos(id) on delete set null,

  arquivo_nome text not null,
  arquivo_hash text,                 -- sha-256 do texto: detecta reenvio do mesmo PDF
  numero_processo text,              -- CNJ lido dos autos, antes de ter caso_id

  total_paginas integer not null,
  paginas_uteis integer,             -- quantas sobraram depois da triagem

  status text not null default 'extraindo' check (status in (
    'extraindo',    -- navegador lendo o PDF
    'triando',      -- separando peça de anexo
    'analisando',   -- passada 1, lote a lote
    'consolidando', -- passada 2
    'revisao',      -- pronta, esperando o advogado conferir
    'confirmada',   -- promovida à biblioteca
    'erro',
    'cancelada'
  )),
  etapa_atual text,                  -- frase mostrada na tela
  progresso_pct smallint not null default 0,
  erro text,

  -- Resultados de cada passada, crus. Guardados para auditoria e para
  -- permitir reconsolidar sem reler o PDF.
  triagem jsonb,
  extracoes jsonb,
  ficha jsonb,                       -- saída da consolidação (a IA)
  ficha_revisada jsonb,              -- o que o advogado corrigiu; vence sobre `ficha`

  -- Custo real desta análise
  custo_tokens jsonb,
  custo_brl numeric(10, 4),

  criado_por text references public.perfis(email),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.autos_analises enable row level security;
grant all on table public.autos_analises to service_role;
grant usage, select on sequence public.autos_analises_id_seq to service_role;

create index if not exists autos_analises_devedor_idx on public.autos_analises (devedor_id);
create index if not exists autos_analises_caso_idx on public.autos_analises (caso_id);
create index if not exists autos_analises_status_idx on public.autos_analises (status);
create index if not exists autos_analises_criado_idx on public.autos_analises (criado_em desc);
create index if not exists autos_analises_processo_idx on public.autos_analises (numero_processo);

-- Liga a medida à análise que a produziu (só agora, que a tabela existe).
alter table public.medidas_tomadas
  add column if not exists analise_id bigint references public.autos_analises(id) on delete set null;

create index if not exists medidas_analise_idx on public.medidas_tomadas (analise_id);

-- Idempotência: confirmar a mesma análise duas vezes não duplica medidas.
create unique index if not exists medidas_analise_ordem_uniq
  on public.medidas_tomadas (analise_id, ordem)
  where analise_id is not null and ordem is not null;

-- ============================================================
-- 3) CASOS — débito atualizado e satisfação vindos dos autos
-- ============================================================
-- `valor_credito_brl` continua sendo o valor de origem do caso. O que a
-- análise apura é outra coisa: o saldo de hoje, com data-base e com a
-- indicação de onde cada número saiu.

alter table public.casos
  add column if not exists debito_atualizado_brl numeric(14, 2),
  add column if not exists debito_data_base date,
  add column if not exists debito_fonte text,           -- "planilha do exequente, fls. 412"
  add column if not exists debito_composicao jsonb,     -- rubricas detalhadas
  add column if not exists valor_satisfeito_brl numeric(14, 2),
  add column if not exists valor_constrito_brl numeric(14, 2),
  add column if not exists etapa_execucao text,
  add column if not exists chance_exito smallint
    check (chance_exito is null or (chance_exito between 0 and 100)),
  add column if not exists chance_exito_fatores jsonb,
  add column if not exists autos_analisado_em timestamptz;

create index if not exists casos_etapa_idx on public.casos (etapa_execucao);

notify pgrst, 'reload schema';
