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
import { redirect } from "next/navigation";
import { ArrowRight, Pencil } from "lucide-react";
import {
  obterDossie,
  outrosCredoresDoDevedor,
  type OutroCasoDoDevedor,
} from "@/lib/casos";
import { perfilLogado } from "@/lib/perfis-server";
import { ehCliente } from "@/lib/perfis";
import { devEuFromParam } from "@/lib/dev-auth";
import { formatBRL, formatData } from "@/lib/format";
import { AcoesBuscaMockadas } from "./AcoesBuscaMockadas";
import { BotaoGerarPeca } from "./BotaoGerarPeca";
import { AtualizadorCalculo } from "./AtualizadorCalculo";
import { DocumentosAPI } from "./DocumentosAPI";
import { TimelineMedidas } from "./TimelineMedidas";
import { listarMedidasPorDevedor } from "@/lib/medidas";
import { templatesSugeridos } from "@/lib/pecas-templates";

// ---- Componentes compartilhados (cliente + advogado) ----
import { HeaderDossie } from "@/app/_shared/dossie/HeaderDossie";
import { EstatisticasGrid } from "@/app/_shared/dossie/EstatisticasGrid";
import { SectionTitle } from "@/app/_shared/dossie/SectionTitle";
import {
  SecaoFicha,
  CampoFicha,
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

  // Medidas tomadas (timeline). Se a tabela ainda nao existir, devolve [].
  const medidas = await listarMedidasPorDevedor(devedorId);

  // Status do devedor — devedor nao tem flag propria; usa o status do
  // primeiro caso vinculado ("ativo" se houver caso ativo, senao "pausado").
  // Quando casos.status virar enum por devedor, trocar pra dado real.
  const algumAtivo = casos.some((c) => c.status === "ativo");
  const statusLabel = algumAtivo ? "Ativo" : "Pausado";
  const statusColor = algumAtivo
    ? "var(--color-signal)"
    : "var(--color-ivory-66)";

  return (
    <main>
      {/* ============ HEADER + AÇÕES ============ */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto max-w-[1400px] px-6 py-14 sm:px-10">
          {/* Top bar: Voltar (esq) + Editar (dir) */}
          <div className="flex items-center justify-between">
            <Link
              href={`/equipe/devedores${linkBase}`}
              className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-gold)] transition hover:text-[var(--color-tip-glow)]"
            >
              ← Voltar à Lista
            </Link>
            <button
              type="button"
              disabled
              title="Edição em breve"
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-[var(--color-ivory-22)] bg-white/5 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-ivory-66)] opacity-60"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </button>
          </div>

          {/* ============ HEADER DOSSIÊ ============ */}
          <HeaderDossie
            devedor={devedor}
            statusLabel={statusLabel}
            statusColor={statusColor}
            dashboardHref={`/equipe/devedores/${devedor.id}/dashboard${linkBase}`}
          />

          {/* ============ ESTATÍSTICAS ============ */}
          <EstatisticasGrid
            totalBens={total_bens}
            valorEstimado={valor_estimado_total_brl}
            casosVinculados={casos.length}
          />

          {/* ============ AÇÕES DE BUSCA ============ */}
          <div className="mt-10">
            <BlocoAcao titulo="Ações de Busca">
              <AcoesBuscaMockadas devedorNome={devedor.nome} />
            </BlocoAcao>
          </div>

          {/* ============ GERAR PEÇA ============ */}
          <div className="mt-6">
            <BlocoAcao titulo="Gerar Peça">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                <Link
                  href={`/equipe/devedores/${devedor.id}/gerador-peca${linkBase}`}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-gold)] px-6 py-4 text-sm font-bold uppercase tracking-[0.12em] text-[var(--color-carbon)] shadow-[0_10px_40px_-10px_rgba(201,162,74,0.55)] transition hover:bg-[var(--color-tip-glow)]"
                >
                  Abrir Gerador de Peça
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <div className="sm:flex-1">
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
              </div>
            </BlocoAcao>
          </div>

          {/* ============ CÁLCULO JUDICIAL ============ */}
          <div className="mt-6">
            <BlocoAcao titulo="Cálculo Judicial">
              <AtualizadorCalculo devedorId={devedor.id} euQuery={linkBase} />
            </BlocoAcao>
          </div>

          {/* ============ DADOS CADASTRAIS ============ */}
          <div className="mt-12">
            <SectionTitle texto="Dados Cadastrais" />

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <SecaoFicha titulo="Identificação">
                <CampoFicha
                  rotulo={devedor.tipo === "PF" ? "CPF" : "CNPJ"}
                  valor={devedor.documento}
                  origem="VIA THEMIS"
                />
                <CampoFicha
                  rotulo={devedor.tipo === "PF" ? "RG" : "IE"}
                  valor={devedor.rg}
                  origem={devedor.rg ? "MANUAL" : undefined}
                />
                {devedor.tipo === "PF" ? (
                  <CampoFicha
                    rotulo="Data de Nascimento"
                    valor={
                      devedor.data_nascimento
                        ? formatData(devedor.data_nascimento)
                        : null
                    }
                    origem={devedor.data_nascimento ? "VIA THEMIS" : undefined}
                  />
                ) : null}
                {devedor.tipo === "PF" ? (
                  <CampoFicha
                    rotulo="Nome da Mãe"
                    valor={devedor.nome_mae}
                    origem={devedor.nome_mae ? "VIA THEMIS" : undefined}
                  />
                ) : null}
              </SecaoFicha>

              <SecaoFicha titulo="Contato">
                <CampoFicha
                  rotulo="E-mail"
                  valor={devedor.email}
                  origem={devedor.email ? "MANUAL" : undefined}
                />
                <CampoFicha
                  rotulo="Telefone"
                  valor={devedor.telefone}
                  origem={devedor.telefone ? "MANUAL" : undefined}
                />
                <CampoFicha
                  rotulo="Redes Sociais"
                  valor={devedor.redes_sociais}
                  origem={devedor.redes_sociais ? "MANUAL" : undefined}
                />
              </SecaoFicha>

              <div className="md:col-span-2">
                <SecaoFicha titulo="Endereço">
                  <CampoFicha
                    rotulo="Endereço Completo"
                    valor={primeiroEndereco(dossie.bens)}
                    origem={primeiroEndereco(dossie.bens) ? "VIA THEMIS" : undefined}
                  />
                </SecaoFicha>
              </div>

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
                  rotulo="Valor Total em Crédito"
                  valor={formatBRL(somaCredito(casos))}
                  origem="MANUAL"
                />
              </SecaoFicha>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CASOS ============ */}
      {casos.length > 0 ? (
        <section className="border-t border-[var(--color-ivory-12)]">
          <div className="mx-auto max-w-[1400px] px-6 py-12 sm:px-10">
            <SectionTitle texto="Casos Vinculados" eyebrow="Casos Onde Este Devedor Aparece" />
            <div className="mt-6 space-y-3">
              {casos.map((c) => (
                <CardCasoVinculado key={c.id} caso={c} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ============ CATEGORIAS ============ */}
      <section className="border-t border-[var(--color-ivory-12)]">
        <div className="mx-auto max-w-[1400px] px-6 py-16 sm:px-10">
          <SectionTitle texto="Bens Encontrados por Categoria" eyebrow="Bens Encontrados" />

          <div className="mt-12 space-y-16">
            {ORDEM.map((tipo) => {
              const bens = por_tipo[tipo];
              const Icone = ICONES_TIPO_BEM[tipo];
              return (
                <div key={tipo}>
                  {/* Header da categoria: icone + titulo serif gold uppercase + contador mono */}
                  <div className="mb-6 flex items-center gap-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)]">
                      <Icone className="h-6 w-6 text-[var(--color-gold)]" />
                    </div>
                    <div>
                      <h2 className="font-serif text-2xl uppercase tracking-[0.08em] text-[var(--color-gold)]">
                        {TIPO_META[tipo].label}
                      </h2>
                      <p className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
                        {bens.length} {bens.length === 1 ? "item encontrado" : "itens encontrados"}
                      </p>
                    </div>
                  </div>

                  {bens.length === 0 ? (
                    <p className="mt-6 text-sm italic text-[var(--color-ivory-66)]">
                      Nenhum item encontrado.
                    </p>
                  ) : (
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      {bens.map((bem) => (
                        <CardBem key={bem.id} bem={bem} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ DOCUMENTOS API ============ */}
      <section className="border-t border-[var(--color-ivory-12)]">
        <div className="mx-auto max-w-[1400px] px-6 py-12 sm:px-10">
          <SectionTitle texto="Documentos Disponíveis (API)" />
          <p className="mt-2 text-sm text-[var(--color-ivory-66)]">
            Documentos que a plataforma pode puxar automaticamente. Toque pra revelar e fazer download.
          </p>
          <div className="mt-6">
            <DocumentosAPI devedorNome={devedor.nome} />
          </div>
        </div>
      </section>

      {/* ============ TIMELINE ============ */}
      <section className="border-t border-[var(--color-ivory-12)]">
        <div className="mx-auto max-w-[1400px] px-6 py-12 sm:px-10">
          <SectionTitle texto="Cronologia de Medidas" eyebrow="Linha do Tempo" />
          <div className="mt-6 -mx-6 sm:-mx-10">
            <TimelineMedidas
              medidas={medidas}
              casos={casos}
              advogadoEmail={eu}
            />
          </div>
        </div>
      </section>

      {/* ============ CROSS-REFERENCE (no fim, banner de contexto estrategico) ============ */}
      {mostrarAlertaCross ? (
        <section className="border-t border-[var(--color-ivory-12)]">
          <div className="mx-auto max-w-[1400px] px-6 py-12 sm:px-10">
            <SectionTitle
              texto="Cross-Reference Detectado"
              eyebrow="Atenção · Sinergia entre Carteiras"
              eyebrowColor="var(--color-gold)"
            />
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
    </main>
  );
}

// ============================================================
// COMPONENTES LOCAIS (exclusivos da equipe)
// ============================================================

// ---------- BlocoAcao (wrapper com barra vertical signal) ----------

function BlocoAcao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-ivory-12)] bg-[rgba(5,7,6,0.45)] p-6 sm:p-7">
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
    </div>
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
