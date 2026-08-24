// Dossie patrimonial — visao da EQUIPE. Sem checagem de email_contato:
// obterDossie() devolve TUDO. Layout reorganizado (jun/2026):
// 1) header com eyebrow "DOSSIE PATRIMONIAL" gigante acima do nome,
// 2) estatisticas, 3) acoes de busca, 4) gerar peca, 5) calculo judicial,
// 6) dados cadastrais com chips de origem por campo (THEMIS/ASSERTIVA/MANUAL),
// 7) casos vinculados, 8) bens por categoria, 9) timeline,
// 10) banner cross-detection.
//
// Componentes de cabecalho/bens/casos/ficha foram extraidos pra
// src/app/_shared/dossie/ (jun/2026) — reaproveitados pelo dossie do cliente
// (paridade visual). Esta pagina mantem o que e EXCLUSIVO da equipe:
// Acoes de Busca, Gerar Peca, Calculo, Cross-Reference.
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { BordaLiquidaMetal } from "@/components/ui/BordaLiquidaMetal";
import {
  obterDossie,
  outrosCredoresDoDevedor,
  type OutroCasoDoDevedor,
} from "@/lib/casos";
import { perfilLogado } from "@/lib/perfis-server";
import { ehCliente } from "@/lib/perfis";
import { devEuFromParam } from "@/lib/dev-auth";
import { formatBRL, formatData } from "@/lib/format";
import {
  CUSTO_LOCALIZE_BRL,
  CUSTO_VEICULOS_BRL,
  temCredenciais,
} from "@/lib/assertiva";
import { crawlConfigurado } from "@/lib/crawl-tribunais";
import { AcoesAssertiva } from "./AcoesAssertiva";
import { BotaoGerarPeca } from "./BotaoGerarPeca";
import { listarMedidasPorDevedor } from "@/lib/medidas";
import { templatesSugeridos } from "@/lib/pecas-templates";
import { listarPesquisasImoveis } from "@/lib/imoveis-pesquisas";
import { obterDadosDashboardCasoV2 } from "@/lib/dashboard-caso";
import { PainelImoveisManual } from "./_components/PainelImoveisManual";
import { DashboardCasoGrid } from "./dashboard/_components/DashboardCasoGrid";

// ---- Componentes compartilhados (cliente + advogado) ----
import { HeaderDossie } from "@/app/_shared/dossie/HeaderDossie";
import { EstatisticasGrid } from "@/app/_shared/dossie/EstatisticasGrid";
import {
  SecaoFicha,
  CampoFicha,
  BORDA_CADERNO,
} from "@/app/_shared/dossie/SecaoFicha";
import { CardCasoVinculado } from "@/app/_shared/dossie/CardCasoVinculado";
import { CardBem } from "@/app/_shared/dossie/CardBem";
import { AcessoNegado } from "@/app/_shared/dossie/AcessoNegado";
import {
  TIPO_META,
  ICONES_TIPO_BEM,
  ORDEM,
} from "@/app/_shared/dossie/icones-tipo-bem";
import {
  primeiroEndereco,
  responsavelPrincipal,
  areasDoDevedor,
  somaCredito,
} from "@/app/_shared/dossie/helpers-ficha";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ eu?: string | string[] }>;
};

// Resolve a etiqueta de origem de um campo da ficha:
// 1. origem_campos[campo] gravado pela fonte que preencheu (Assertiva etc);
// 2. fallback: campos base importados = Themis; contato preenchido sem
//    registro = Manual (alguem da equipe digitou).
type OrigemChip = "VIA THEMIS" | "VIA ASSERTIVA" | "MANUAL";
const CAMPOS_BASE_THEMIS = new Set([
  "documento",
  "nome",
  "data_nascimento",
  "nome_mae",
]);
function origemDoCampo(
  origemCampos: Record<string, string>,
  campo: string,
  valor: string | null | undefined,
): OrigemChip | undefined {
  if (!valor) return undefined;
  const fonte = (origemCampos[campo] ?? "").toLowerCase();
  if (fonte === "assertiva") return "VIA ASSERTIVA";
  if (fonte === "themis") return "VIA THEMIS";
  if (fonte === "manual") return "MANUAL";
  return CAMPOS_BASE_THEMIS.has(campo) ? "VIA THEMIS" : "MANUAL";
}

export default async function DossieEquipePage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  if (ehCliente(perfil)) redirect("/cliente/casos");
  const eu = devEuFromParam(sp.eu) ?? perfil?.email ?? null;
  if (!eu) redirect("/login");

  const euDev = devEuFromParam(sp.eu);
  const linkBase = euDev ? `?eu=${encodeURIComponent(euDev)}` : "";

  if (!/^\d+$/.test(id)) {
    return <AcessoNegado voltarHref={`/equipe/devedores${linkBase}`} />;
  }
  const devedorId = Number.parseInt(id, 10);
  if (!Number.isFinite(devedorId)) {
    return <AcessoNegado voltarHref={`/equipe/devedores${linkBase}`} />;
  }

  const dossie = await obterDossie(devedorId);
  if (!dossie) {
    return <AcessoNegado voltarHref={`/equipe/devedores${linkBase}`} />;
  }

  const { devedor, casos, por_tipo, total_bens, valor_estimado_total_brl } = dossie;

  // Cross-detection: TODOS os casos deste devedor (sem excluir nenhum credor).
  // Alerta dispara quando mesmo devedor aparece em 2+ clientes diferentes.
  const outros = await outrosCredoresDoDevedor(devedorId);
  const credoresUnicos = new Set(outros.map((o) => o.credor.id));
  const mostrarAlertaCross = credoresUnicos.size >= 2;

  // Medidas (etiqueta "Última Medida") e pesquisas manuais de imóveis
  // (RI Digital). O dashboard analítico carrega em STREAMING (Suspense)
  // pra não segurar a pintura da ficha — é a consulta mais pesada.
  // Andamentos/linha do tempo SAÍRAM da ficha — vão pras fichas de
  // processo da aba Rotas das Execuções (reforma 25/08).
  const [medidas, pesquisasImoveis, ultimaVarredura] = await Promise.all([
    listarMedidasPorDevedor(devedorId),
    listarPesquisasImoveis(devedorId),
    ultimaVarreduraTribunais(devedorId),
  ]);

  // Status do devedor — devedor nao tem flag propria; usa o status do
  // primeiro caso vinculado ("ativo" se houver caso ativo, senao "pausado").
  // Quando casos.status virar enum por devedor, trocar pra dado real.
  const algumAtivo = casos.some((c) => c.status === "ativo");
  const statusLabel = algumAtivo ? "Ativo" : "Pausado";
  const statusColor = algumAtivo
    ? "var(--color-signal)"
    : "var(--color-ivory-66)";

  return (
    <main className="relative">
      {/* Fundo: preto puro cobrindo a ficha toda (cara nova 24/08). */}
      <div aria-hidden="true" className="absolute inset-0 bg-black" />
      <div className="relative z-10">
      {/* ============ HEADER + AÇÕES ============ */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto max-w-[1400px] px-6 py-14 sm:px-10">
          {/* Top bar: Voltar em metal líquido LARANJA (layout do
              Sincronizar) — sem botão Editar (reforma 25/08). */}
          <div className="flex items-center justify-between">
            <BordaLiquidaMetal cor="laranja" radius={14} className="inline-flex">
              <Link
                href={`/equipe/devedores${linkBase}`}
                className="inline-flex h-full w-full items-center gap-2.5 rounded-[11px] bg-[rgba(255,156,65,0.10)] px-5 py-3 text-sm font-medium text-[#FF9C41] transition hover:bg-[rgba(255,156,65,0.18)]"
              >
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                Voltar à Lista
              </Link>
            </BordaLiquidaMetal>
          </div>

          {/* ============ HEADER DA FICHA ============ */}
          <HeaderDossie
            devedor={devedor}
            statusLabel={statusLabel}
            statusColor={statusColor}
            processos={casos.length}
            ultimaMedidaEm={medidas[0]?.data ?? null}
          />

          {/* ============ ESTATÍSTICAS ============ */}
          <EstatisticasGrid
            totalBens={total_bens}
            valorEstimado={valor_estimado_total_brl}
            casosVinculados={casos.length}
          />

          {/* ============ AÇÕES: PESQUISAS + GERAR PEÇA (2 colunas) ============ */}
          <div id="pesquisas" className="mt-8 grid gap-4 scroll-mt-16 lg:grid-cols-2">
            <BlocoAcao titulo="Central de Pesquisas" tinta={TINTA_PESQUISAS}>
              <AcoesAssertiva
                devedorId={devedor.id}
                custoLocalizeBrl={CUSTO_LOCALIZE_BRL}
                custoVeiculosBrl={CUSTO_VEICULOS_BRL}
                credenciaisOk={temCredenciais()}
                crawlOk={crawlConfigurado()}
              />
            </BlocoAcao>

            <BlocoAcao titulo="Gerar Peça" tinta={TINTA_PECA}>
              <div className="flex flex-col gap-3">
                {/* Metal líquido no botão principal (padrão Sincronizar). */}
                <BordaLiquidaMetal cor="gold" radius={14} className="flex">
                  <Link
                    href={`/equipe/devedores/${devedor.id}/gerador-peca${linkBase}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-[11px] bg-[var(--color-gold)] px-6 py-4 text-sm font-bold uppercase tracking-[0.12em] text-[var(--color-carbon)] shadow-[0_10px_40px_-10px_rgba(201,162,74,0.55)] transition hover:bg-[var(--color-tip-glow)]"
                  >
                    Abrir Gerador de Peça
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </BordaLiquidaMetal>
                <BotaoGerarPeca
                  devedorId={devedor.id}
                  euQuery={linkBase}
                  sugeridos={templatesSugeridos({
                    devedor,
                    casos,
                    bens: dossie.bens,
                    total_bens,
                    valor_estimado_total_brl,
                    por_tipo,
                  })}
                />
              </div>
            </BlocoAcao>
          </div>

          {/* ============ SETOR: DADOS PARA LOCALIZAÇÃO ============ */}
          <div id="ficha" className="mt-12 scroll-mt-16">
            <TituloSetor texto="Dados para Localização" />

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <SecaoFicha titulo="Identificação">
                <CampoFicha
                  rotulo={devedor.tipo === "PF" ? "CPF" : "CNPJ"}
                  valor={devedor.documento}
                  origem={origemDoCampo(devedor.origem_campos, "documento", devedor.documento)}
                />
                <CampoFicha
                  rotulo={devedor.tipo === "PF" ? "RG" : "IE"}
                  valor={devedor.rg}
                  origem={origemDoCampo(devedor.origem_campos, "rg", devedor.rg)}
                />
                {devedor.tipo === "PF" ? (
                  <CampoFicha
                    rotulo="Data de Nascimento"
                    valor={
                      devedor.data_nascimento
                        ? formatData(devedor.data_nascimento)
                        : null
                    }
                    origem={origemDoCampo(devedor.origem_campos, "data_nascimento", devedor.data_nascimento)}
                  />
                ) : null}
                {devedor.tipo === "PF" ? (
                  <CampoFicha
                    rotulo="Nome da Mãe"
                    valor={devedor.nome_mae}
                    origem={origemDoCampo(devedor.origem_campos, "nome_mae", devedor.nome_mae)}
                  />
                ) : null}
              </SecaoFicha>

              <SecaoFicha titulo="Contato">
                <CampoFicha
                  rotulo="E-mail"
                  valor={devedor.email}
                  origem={origemDoCampo(devedor.origem_campos, "email", devedor.email)}
                />
                <CampoFicha
                  rotulo="Telefone"
                  valor={devedor.telefone}
                  origem={origemDoCampo(devedor.origem_campos, "telefone", devedor.telefone)}
                />
                <CampoFicha
                  rotulo="Redes Sociais"
                  valor={devedor.redes_sociais}
                  origem={origemDoCampo(devedor.origem_campos, "redes_sociais", devedor.redes_sociais)}
                />
                <CampoFicha
                  rotulo="Endereço"
                  valor={primeiroEndereco(dossie.bens)}
                  origem={
                    primeiroEndereco(dossie.bens)
                      ? dossie.bens.some(
                          (b) => b.tipo === "endereco" && b.fonte === "Assertiva",
                        )
                        ? "VIA ASSERTIVA"
                        : "VIA THEMIS"
                      : undefined
                  }
                />
              </SecaoFicha>

            </div>
          </div>

          {/* ============ SETOR: DADOS PROCESSUAIS ============ */}
          <div id="casos" className="mt-12 scroll-mt-16">
            <TituloSetor texto="Dados Processuais" />

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <SecaoFicha titulo="Relacionamento">
                <CampoFicha
                  rotulo="Responsável no Escritório"
                  valor={responsavelPrincipal(casos)}
                  origem={responsavelPrincipal(casos) ? "MANUAL" : undefined}
                  valorClassName="text-[var(--color-advogado)]"
                />
                <CampoFicha
                  rotulo="Primeira Ocorrência"
                  valor={formatData(devedor.criado_em)}
                  origem="MANUAL"
                />
                <CampoFicha
                  rotulo="Casos Vinculados"
                  valor={String(casos.length)}
                  origem="MANUAL"
                />
              </SecaoFicha>

              <SecaoFicha titulo="Perfil Jurídico">
                <CampoFicha
                  rotulo="Áreas Envolvidas"
                  valor={areasDoDevedor(casos)}
                  origem={areasDoDevedor(casos) ? "MANUAL" : undefined}
                />
                <CampoFicha
                  rotulo="Status Geral"
                  valor={statusLabel}
                  origem="MANUAL"
                />
                <CampoFicha
                  rotulo="Débito Judicial Total"
                  valor={formatBRL(somaCredito(casos))}
                  origem="VIA THEMIS"
                />
              </SecaoFicha>
            </div>

            {/* Processos vinculados — lista com ROLAGEM dentro do setor
                (fundiu a antiga seção Casos Vinculados aqui). */}
            {casos.length > 0 ? (
              <SpotlightCard
                local
                claro
                borda={BORDA_CADERNO}
                className="mt-5 p-6 sm:p-8"
              >
                <h3 className="font-mono text-[15px] font-semibold uppercase tracking-[0.28em] text-[var(--color-gold)]">
                  Processos Vinculados · {casos.length}
                </h3>
                <div className="sem-scrollbar mt-5 max-h-[480px] space-y-3 overflow-y-auto pr-1">
                  {casos.map((c) => (
                    <CardCasoVinculado key={c.id} caso={c} />
                  ))}
                </div>
              </SpotlightCard>
            ) : null}
          </div>

          {/* Andamentos processuais e linha do tempo SAÍRAM da ficha do
              devedor — passam a viver nas fichas de PROCESSO da aba
              Rotas das Execuções (reforma 25/08, a construir). */}
        </div>
      </section>

      {/* ============ SETOR: BENS ENCONTRADOS (ficha pautada) ============ */}
      {/* TODAS as categorias aparecem SEMPRE (ditado 25/08) — mesmo sem
          registro, o espacinho fica na ficha com a explicação do que os
          robôs procuram ali. Imóveis é MANUAL (RI Digital, sem API). */}
      <section id="bens" className="scroll-mt-16 border-t border-[var(--color-ivory-12)]">
        <div className="mx-auto max-w-[1400px] px-6 py-16 sm:px-10">
          <TituloSetor texto="Bens Encontrados" />

          <div className="mt-8 space-y-6">
            {ORDEM.map((tipo) => {
              const bens = por_tipo[tipo];
              const Icone = ICONES_TIPO_BEM[tipo];
              const cor = COR_TIPO_BEM[tipo] ?? "var(--color-gold)";
              return (
                <SpotlightCard
                  key={tipo}
                  local
                  claro
                  borda={BORDA_CADERNO}
                  className="p-6 sm:p-8"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="inline-flex h-12 w-12 items-center justify-center rounded-xl border"
                      style={{
                        color: cor,
                        borderColor: `color-mix(in srgb, ${cor} 45%, transparent)`,
                        backgroundColor: `color-mix(in srgb, ${cor} 10%, transparent)`,
                      }}
                    >
                      <Icone className="h-6 w-6" />
                    </div>
                    <div>
                      <h2
                        className="font-serif text-2xl uppercase tracking-[0.08em]"
                        style={{ color: cor }}
                      >
                        {TIPO_META[tipo].label}
                      </h2>
                      <p className="font-mono text-[13px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
                        {bens.length > 0
                          ? `${bens.length} ${bens.length === 1 ? "item encontrado" : "itens encontrados"}`
                          : "Sem registros até agora"}
                        {tipo === "processo_credito"
                          ? ` · Última varredura ${
                              ultimaVarredura
                                ? formatData(ultimaVarredura)
                                : "ainda não realizada"
                            }`
                          : ""}
                      </p>
                    </div>
                  </div>

                  {bens.length > 0 ? (
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      {bens.map((bem) => (
                        <CardBem key={bem.id} bem={bem} />
                      ))}
                    </div>
                  ) : tipo !== "imovel" ? (
                    <p className="mt-4 max-w-[720px] text-sm leading-relaxed text-[var(--color-ivory-66)]">
                      {FRASE_SEM_REGISTRO[tipo]}
                    </p>
                  ) : null}

                  {/* Imóveis: atuação MANUAL do advogado via RI Digital —
                      registro de pesquisa + prints + PDFs de matrículas. */}
                  {tipo === "imovel" ? (
                    <div className="mt-6">
                      <PainelImoveisManual
                        devedorId={devedor.id}
                        pesquisas={pesquisasImoveis}
                      />
                    </div>
                  ) : null}
                </SpotlightCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ SETOR: DASHBOARD ANALÍTICO (fim da ficha) ============ */}
      <section id="dashboard" className="scroll-mt-16 border-t border-[var(--color-ivory-12)]">
        <div className="mx-auto max-w-[1400px] px-6 py-16 sm:px-10">
          <TituloSetor texto="Dashboard Analítico" />
          <div className="mt-8">
            <Suspense
              fallback={
                <p className="animate-pulse text-center font-mono text-[13px] uppercase tracking-[0.28em] text-[var(--color-ivory-66)]">
                  Calculando indicadores…
                </p>
              }
            >
              <SetorDashboardFicha devedorId={devedorId} />
            </Suspense>
          </div>
        </div>
      </section>

      {/* ============ CROSS-REFERENCE (no fim, banner de contexto estrategico) ============ */}
      {mostrarAlertaCross ? (
        <section className="border-t border-[var(--color-ivory-12)]">
          <div className="mx-auto max-w-[1400px] px-6 py-12 sm:px-10">
            <TituloSetor texto="Cross-Reference Detectado" />
            <div className="mt-6">
              <AlertaCrossReference
                outros={outros}
                totalCredores={credoresUnicos.size}
                euQuery={linkBase}
              />
            </div>
          </div>
        </section>
      ) : null}
      </div>
    </main>
  );
}

// ============================================================
// COMPONENTES LOCAIS (exclusivos da equipe)
// ============================================================

// Tintas dos cards de ação (ditado 25/08: "fundo esbranquiçado de outra
// cor" — a Central de Pesquisas é um dos cards mais importantes).
const TINTA_PESQUISAS =
  "linear-gradient(0deg, rgba(10,48,28,0.7), rgba(10,48,28,0.7))";
const TINTA_PECA =
  "linear-gradient(0deg, rgba(58,42,10,0.6), rgba(58,42,10,0.6))";

// Classificação visual dos bens por tipo — mesma paleta neon do Início.
const COR_TIPO_BEM: Record<string, string> = {
  veiculo: "#FF9C41",
  imovel: "#38BDF8",
  empresa: "#C084FC",
  processo_credito: "#FFD93D",
  endereco: "#2DD4BF",
  vinculo: "#FB7185",
};

// Frases dos espaços SEM registro — a ficha sempre mostra o espacinho
// de cada categoria com o que os robôs procuram ali (ditado 25/08).
const FRASE_SEM_REGISTRO: Record<string, string> = {
  veiculo:
    "Nenhum veículo localizado até agora. A busca Assertiva Veículos varre a frota registrada no CPF/CNPJ (placa, modelo, ano e restrições).",
  empresa:
    "Nenhuma participação societária localizada até agora. O Enriquecer Dados traz os vínculos societários registrados no documento.",
  processo_credito:
    "Os robôs pesquisam processos em que o devedor tem crédito a receber (é credor em outra ação) — nada localizado até agora.",
  endereco:
    "Nenhum endereço confirmado até agora. O Enriquecer Dados traz os endereços vinculados ao documento.",
  vinculo:
    "Nenhum vínculo familiar mapeado até agora. Os vínculos ajudam a rastrear patrimônio em nome de terceiros.",
};

// ---------- Última varredura dos robôs (e-SAJ/eproc) ----------
// Data mais recente em que os robôs varreram algum processo deste
// devedor — exibida na categoria "Processos Onde é Credor".

async function ultimaVarreduraTribunais(
  devedorId: number,
): Promise<string | null> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const sb = createAdminClient();
  const { data } = await sb
    .from("casos")
    .select("esaj_synced_at")
    .eq("devedor_id", devedorId)
    .not("esaj_synced_at", "is", null)
    .order("esaj_synced_at", { ascending: false })
    .limit(1);
  return ((data ?? [])[0]?.esaj_synced_at as string | null) ?? null;
}

// ---------- SetorDashboardFicha (streaming, versão enxuta) ----------
// Async server component dentro de <Suspense>: a ficha pinta primeiro e
// os indicadores chegam depois. Próxima Ação, Cronologia, Próximos Atos
// e Sazonalidade ficam FORA (moram na Ficha do Processo).

async function SetorDashboardFicha({ devedorId }: { devedorId: number }) {
  const dados = await obterDadosDashboardCasoV2(devedorId);
  if (!dados) {
    return (
      <p className="text-center text-sm text-[var(--color-ivory-66)]">
        Dados analíticos indisponíveis no momento.
      </p>
    );
  }
  return <DashboardCasoGrid dados={dados} ocultarProcessuais />;
}

// ---------- TituloSetor (dourado neon CENTRALIZADO, sem card) ----------

function TituloSetor({ texto }: { texto: string }) {
  return (
    <h2
      className="text-center font-serif text-[clamp(26px,2.8vw,42px)] uppercase leading-[1.1] tracking-[0.08em] text-[var(--color-gold)]"
      style={{
        WebkitTextStroke: "1px rgba(255,255,255,0.55)",
        textShadow: "0 0 18px rgba(201,162,74,0.4)",
      }}
    >
      {texto}
    </h2>
  );
}

// ---------- BlocoAcao (card de ação com tinta própria) ----------

function BlocoAcao({
  titulo,
  children,
  tinta,
}: {
  titulo: string;
  children: React.ReactNode;
  tinta?: string;
}) {
  return (
    <SpotlightCard local claro degrade={tinta} className="p-6 sm:p-7">
      <div className="relative pl-4">
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 h-6 w-1 rounded-full bg-[var(--color-signal)]"
        />
        <h3 className="font-mono text-[13px] uppercase tracking-[0.32em] text-[var(--color-signal)]">
          {titulo}
        </h3>
      </div>
      <div className="mt-5">{children}</div>
    </SpotlightCard>
  );
}

// ---------- AlertaCrossReference (exclusivo da equipe) ----------

function AlertaCrossReference({
  outros,
  totalCredores,
  euQuery,
}: {
  outros: OutroCasoDoDevedor[];
  totalCredores: number;
  euQuery: string;
}) {
  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 shadow-[0_0_30px_rgba(245,158,11,0.08)]">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-amber-400/60 bg-amber-500/15 font-mono text-xs font-bold text-amber-200"
        >
          !
        </span>
        <div className="flex-1">
          <p className="font-mono text-[12px] uppercase tracking-[0.32em] text-amber-300/90">
            Atenção · Cross-Reference
          </p>
          <p className="mt-2 text-sm leading-snug text-amber-100">
            Este devedor figura em{" "}
            <span className="font-semibold text-amber-50">
              {outros.length} {outros.length === 1 ? "processo" : "processos"}
            </span>{" "}
            do escritório, vinculado a{" "}
            <span className="font-semibold text-amber-50">
              {totalCredores} clientes diferentes
            </span>
            . Avalie sinergia entre carteiras antes de agir.
          </p>

          <ul className="mt-4 space-y-2">
            {outros.map((o) => (
              <li key={o.caso_id}>
                <Link
                  href={`/equipe/devedores/credor/${o.credor.id}${euQuery}`}
                  className="group flex flex-col gap-1 rounded-lg border border-amber-500/20 bg-[rgba(5,7,6,0.45)] px-3 py-2 transition hover:border-amber-400/60 hover:bg-[rgba(5,7,6,0.65)] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xl text-[var(--color-gold)] group-hover:text-[var(--color-tip-glow)]">
                      {o.credor.nome}
                    </p>
                    <p className="mt-0.5 font-mono text-[15px] text-[var(--color-ivory-66)]">
                      {o.numero_processo ?? "Sem processo cadastrado"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 sm:flex-shrink-0">
                    <span className="font-mono text-base text-[var(--color-ivory-88)]">
                      {formatBRL(o.valor_credito_brl)}
                    </span>
                    <span className="rounded-full border border-amber-500/30 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-amber-200/80">
                      {o.status}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
