// Dossiê patrimonial — visão da EQUIPE. Sem checagem de email_contato:
// obterDossie() devolve TUDO. Layout no estilo da FICHA DO CLIENTE do BP CRM:
// header com icone + nome grande + badges, grid 2-col de secoes glass com
// rotulos mono + badges de origem (VIA THEMIS / VIA ASSERTIVA / MANUAL),
// e abaixo as 3 secoes ricas existentes (cross-detection, timeline, casos,
// bens por categoria).
import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, User, Pencil } from "lucide-react";
import {
  obterDossie,
  outrosCredoresDoDevedor,
  type Bem,
  type CasoResumo,
  type OutroCasoDoDevedor,
} from "@/lib/casos";
import type { TipoBem } from "@/lib/mock-fixtures";
import { perfilLogado } from "@/lib/perfis-server";
import { ehCliente } from "@/lib/perfis";
import { devEuFromParam } from "@/lib/dev-auth";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import {
  formatBRL,
  formatData,
  formatStatus,
  formatTempoRelativo,
} from "@/lib/format";
import { AcoesBuscaMockadas } from "./AcoesBuscaMockadas";
import { BotaoGerarPeca } from "./BotaoGerarPeca";
import { AtualizadorCalculo } from "./AtualizadorCalculo";
import { TimelineMedidas } from "./TimelineMedidas";
import { listarMedidasPorDevedor } from "@/lib/medidas";
import { templatesSugeridos } from "@/lib/pecas-templates";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ eu?: string | string[] }>;
};

const TIPO_META: Record<TipoBem, { label: string; icone: string }> = {
  veiculo: { label: "Veículos", icone: "V" },
  imovel: { label: "Imóveis", icone: "I" },
  empresa: { label: "Participações Societárias", icone: "E" },
  processo_credito: { label: "Processos Onde é Credor", icone: "P" },
  endereco: { label: "Endereços Confirmados", icone: "A" },
  vinculo: { label: "Vínculos Familiares", icone: "F" },
};

const ORDEM: TipoBem[] = [
  "veiculo",
  "imovel",
  "empresa",
  "processo_credito",
  "endereco",
  "vinculo",
];

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
      {/* ============ HEADER FICHA (estilo BP CRM) ============ */}
      <section className="relative overflow-hidden">
        {/* Glow gold removido — fundo unico (AetherBackground do layout). */}
        <div className="relative mx-auto max-w-[1400px] px-6 py-16 sm:px-10">
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

          {/* Card header grande: icone PF/PJ centralizado + nome em gold serif uppercase + badges */}
          <header className="title-shield mt-6 text-center">
            {/* Icone PF/PJ acima, centralizado */}
            <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-gold)]/35 bg-gradient-to-br from-[rgba(201,162,74,0.18)] to-[rgba(201,162,74,0.04)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              {devedor.tipo === "PJ" ? (
                <Building2 className="h-5 w-5 text-[var(--color-gold)]" />
              ) : (
                <User className="h-5 w-5 text-[var(--color-gold)]" />
              )}
            </div>

            <h1 className="break-words font-serif text-[clamp(19px,2.75vw,34px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[var(--color-gold)]">
              {devedor.nome}
            </h1>
            <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
              Dossiê Patrimonial · Visão da Equipe
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <BadgeFicha
                label={devedor.tipo === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}
                color="var(--color-gold)"
              />
              <BadgeFicha
                label={statusLabel}
                color={statusColor}
                dot
              />
              {devedor.ultima_consulta_em ? (
                <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
                  · Última Consulta {formatTempoRelativo(devedor.ultima_consulta_em)}
                </span>
              ) : null}
            </div>
            <div className="mt-4">
              <Link
                href={`/equipe/devedores/${devedor.id}/dashboard${linkBase}`}
                className="inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--color-signal)] transition hover:text-[var(--color-tip-glow)]"
              >
                Ver Dashboard Analítico →
              </Link>
            </div>
          </header>

          {/* Grid 2 colunas — secoes glass estilo BP CRM */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <SecaoFicha titulo="Identificação">
              <CampoFicha
                rotulo={devedor.tipo === "PF" ? "CPF" : "CNPJ"}
                valor={devedor.documento}
                origem="VIA THEMIS"
              />
              <CampoFicha
                rotulo={devedor.tipo === "PF" ? "RG" : "IE"}
                valor={null}
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
              <CampoFicha rotulo="E-mail" valor={null} />
              <CampoFicha rotulo="Telefone" valor={null} />
              <CampoFicha rotulo="Redes Sociais" valor={null} />
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

          {/* 3 cards de número grande (mantidos) */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <CardNumero rotulo="Total de Bens" valor={String(total_bens)} />
            <CardNumero
              rotulo="Valor Estimado"
              valor={formatBRL(valor_estimado_total_brl)}
            />
            <CardNumero rotulo="Casos Vinculados" valor={String(casos.length)} />
          </div>

          {/* Alerta de cross-reference: devedor figura em casos de 2+ clientes
              diferentes do escritório. Aumenta o valor estratégico do dossiê. */}
          {mostrarAlertaCross ? (
            <div className="mt-8">
              <AlertaCrossReference
                outros={outros}
                totalCredores={credoresUnicos.size}
                euQuery={linkBase}
              />
            </div>
          ) : null}

          {/* Histórico de medidas tomadas — timeline horizontal logo após
              o banner cross-detection. Quebra o padding lateral do header
              com -mx-* pra o scroll-x ocupar toda a largura. */}
          <div className="mt-8 -mx-6 sm:-mx-10">
            <TimelineMedidas
              medidas={medidas}
              casos={casos}
              advogadoEmail={eu}
            />
          </div>

          {/* Barra de ações de busca paga (MOCK Dia 4 — ver memória
              sonar-consultas-pagas-sob-demanda; real entra Sem 2) */}
          <div className="mt-8">
            <AcoesBuscaMockadas devedorNome={devedor.nome} />
          </div>

          {/* Gerador de peças — CTA principal (página dedicada) + atalho rápido
              (modal antigo). O botão dourado abaixo é a entrada destacada agora;
              o BotaoGerarPeca permanece como atalho pra quem prefere o modal. */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <Link
              href={`/equipe/devedores/${devedor.id}/gerador-peca${linkBase}`}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-gold)] px-6 py-4 text-sm font-bold uppercase tracking-[0.12em] text-[var(--color-carbon)] shadow-[0_10px_40px_-10px_rgba(201,162,74,0.55)] transition hover:bg-[var(--color-tip-glow)]"
            >
              Abrir Gerador de Peça →
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

          {/* Atualizador de cálculo do débito (MOCK Dia 5; real na Sem 5+:
              OCR + tabela TJSP + Lei 14.905/2024 via Debit) — card slim;
              editor completo + impressão vive em /calculo */}
          <div className="mt-6">
            <AtualizadorCalculo devedorId={devedor.id} euQuery={linkBase} />
          </div>
        </div>
      </section>

      {/* ============ CASOS ============ */}
      {casos.length > 0 ? (
        <section className="border-t border-[var(--color-ivory-12)]">
          <div className="mx-auto max-w-[1400px] px-6 py-12 sm:px-10">
            <span className="eyebrow">Casos Onde Este Devedor Aparece</span>
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
          <span className="eyebrow">Bens Encontrados</span>
          <h2 className="mt-4 font-serif text-3xl text-ivory">Por Categoria</h2>

          <div className="mt-12 space-y-12">
            {ORDEM.map((tipo) => {
              const bens = por_tipo[tipo];
              const meta = TIPO_META[tipo];
              return (
                <div key={tipo}>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-ivory-12)] font-mono text-sm text-[var(--color-gold)]">
                      {meta.icone}
                    </span>
                    <h3 className="font-serif text-xl text-ivory">{meta.label}</h3>
                    <span className="ml-auto font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
                      {bens.length} {bens.length === 1 ? "item" : "itens"}
                    </span>
                  </div>

                  {bens.length === 0 ? (
                    <p className="mt-4 pl-12 text-sm italic text-[var(--color-ivory-66)]">
                      Nenhum item encontrado.
                    </p>
                  ) : (
                    <div className="mt-4 grid gap-3 pl-12">
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
    </main>
  );
}

// ============================================================
// COMPONENTES INTERNOS
// ============================================================

// ---------- Componentes da FICHA (estilo BP CRM) ----------

type OrigemFicha = "VIA THEMIS" | "VIA ASSERTIVA" | "MANUAL";

function BadgeFicha({
  label,
  color,
  dot = false,
}: {
  label: string;
  color: string;
  dot?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[12px] uppercase tracking-[0.18em]"
      style={{
        borderColor: color,
        color,
        backgroundColor: "rgba(255,255,255,0.03)",
      }}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
        />
      ) : null}
      {label}
    </span>
  );
}

function SecaoFicha({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="inline-block h-4 w-[3px] rounded-full bg-[var(--color-gold)]"
        />
        <span className="font-mono text-[12px] uppercase tracking-[0.32em] text-[var(--color-gold)]">
          {titulo}
        </span>
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

function CampoFicha({
  rotulo,
  valor,
  origem,
}: {
  rotulo: string;
  valor: string | null | undefined;
  origem?: OrigemFicha;
}) {
  const valorFinal = valor && valor.trim() !== "" ? valor : null;
  return (
    <div className="flex flex-col gap-1">
      <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
        {rotulo}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={
            valorFinal
              ? "text-base text-ivory"
              : "text-base text-[var(--color-ivory-66)]"
          }
        >
          {valorFinal ?? "—"}
        </span>
        {valorFinal && origem ? <PillOrigem origem={origem} /> : null}
      </div>
    </div>
  );
}

function PillOrigem({ origem }: { origem: OrigemFicha }) {
  const map: Record<OrigemFicha, { color: string; bg: string }> = {
    "VIA THEMIS": {
      color: "var(--color-gold)",
      bg: "rgba(201,162,74,0.10)",
    },
    "VIA ASSERTIVA": {
      color: "var(--color-signal)",
      bg: "rgba(60,255,138,0.08)",
    },
    MANUAL: {
      color: "var(--color-ivory-66)",
      bg: "rgba(255,255,255,0.04)",
    },
  };
  const { color, bg } = map[origem];
  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[12px] uppercase tracking-[0.18em]"
      style={{ borderColor: color, color, backgroundColor: bg }}
    >
      {origem}
    </span>
  );
}

// ---------- Helpers de derivação de dados pra Ficha ----------

function primeiroEndereco(bens: Bem[]): string | null {
  const end = bens.find((b) => b.tipo === "endereco");
  if (!end) return null;
  const d = end.detalhes;
  const log = typeof d.logradouro === "string" ? d.logradouro : null;
  const cidade = typeof d.cidade === "string" ? d.cidade : null;
  const uf = typeof d.uf === "string" ? d.uf : null;
  const partes: string[] = [];
  if (log) partes.push(log);
  if (cidade && uf) partes.push(`${cidade}/${uf}`);
  else if (cidade) partes.push(cidade);
  else if (uf) partes.push(uf);
  return partes.length > 0 ? partes.join(" — ") : null;
}

function responsavelPrincipal(casos: CasoResumo[]): string | null {
  const c = casos.find((x) => x.responsavel_email);
  return c?.responsavel_email ?? null;
}

function areasDoDevedor(casos: CasoResumo[]): string | null {
  // No demo nao temos campo "area" no CasoResumo; mostra um placeholder
  // quando houver pelo menos um caso, vazio caso contrario. Real entra Sem 2.
  if (casos.length === 0) return null;
  return "Recuperação de Crédito";
}

function somaCredito(casos: CasoResumo[]): number {
  return casos.reduce((acc, c) => acc + (c.valor_credito_brl ?? 0), 0);
}

// ---------- Componentes herdados ----------

function AcessoNegado({ voltarHref }: { voltarHref: string }) {
  return (
    <main className="mx-auto max-w-[1400px] px-6 py-24 sm:px-10">
      <div className="grid place-items-center">
        <SpotlightCard className="max-w-[520px] p-10 text-center">
          <span className="eyebrow !text-[var(--color-gold)]">Não encontrado</span>
          <h3 className="mt-4 font-serif text-2xl text-ivory">
            Devedor não localizado
          </h3>
          <p className="mt-3 text-sm text-[var(--color-ivory-88)]">
            O identificador informado não corresponde a nenhum devedor
            cadastrado.
          </p>
          <Link
            href={voltarHref}
            className="mt-6 inline-block rounded-lg border border-[var(--color-ivory-22)] bg-white/5 px-4 py-2 text-xs font-medium text-ivory transition hover:border-[var(--color-signal)] hover:text-[var(--color-signal)]"
          >
            ← Voltar para devedores
          </Link>
        </SpotlightCard>
      </div>
    </main>
  );
}

function CardNumero({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <SpotlightCard className="p-6">
      <span className="eyebrow">{rotulo}</span>
      <p className="mt-3 font-serif text-3xl text-[var(--color-gold)]">{valor}</p>
    </SpotlightCard>
  );
}

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
                    <p className="truncate text-sm text-[var(--color-gold)] group-hover:text-[var(--color-tip-glow)]">
                      {o.credor.nome}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-[var(--color-ivory-66)]">
                      {o.numero_processo ?? "Sem processo cadastrado"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 sm:flex-shrink-0">
                    <span className="font-mono text-xs text-[var(--color-ivory-88)]">
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

function CardCasoVinculado({ caso }: { caso: CasoResumo }) {
  const status = formatStatus(caso.status);
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[var(--color-ivory-12)] bg-[rgba(5,7,6,0.5)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-mono text-xs text-[var(--color-ivory-66)]">
          {caso.numero_processo || "Sem processo cadastrado"}
        </p>
        <p className="mt-1 text-sm text-ivory">
          Credor:{" "}
          <span className="text-[var(--color-gold)]">{caso.credor.nome}</span>
        </p>
        <p className="mt-1 text-sm text-ivory">
          Crédito:{" "}
          <span className="text-[var(--color-gold)]">
            {formatBRL(caso.valor_credito_brl)}
          </span>
        </p>
        <p className="mt-1 font-mono text-[11px] text-[var(--color-ivory-66)]">
          Advogado responsável:{" "}
          <span className="text-ivory">
            {caso.responsavel_email ?? "—"}
          </span>
        </p>
      </div>
      <span
        className="self-start rounded-full border px-3 py-1 font-mono text-[12px] uppercase tracking-[0.18em] sm:self-auto"
        style={{ borderColor: status.color, color: status.color }}
      >
        {status.label}
      </span>
    </div>
  );
}

function CardBem({ bem }: { bem: Bem }) {
  return (
    <div className="rounded-lg border border-[var(--color-ivory-12)] bg-[rgba(5,7,6,0.4)] p-5 transition hover:border-[var(--color-gold)]/60 hover:bg-[rgba(5,7,6,0.6)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="font-medium text-ivory">{bem.titulo}</p>
          <DetalhesRender tipo={bem.tipo} detalhes={bem.detalhes} />
        </div>
        {bem.valor_estimado_brl !== null ? (
          <span className="whitespace-nowrap font-mono text-sm text-[var(--color-gold)]">
            {formatBRL(bem.valor_estimado_brl)}
          </span>
        ) : null}
      </div>
      <p className="mt-4 font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
        {bem.fonte} · {formatData(bem.fonte_consultada_em)}
      </p>
    </div>
  );
}

// ============================================================
// DetalhesRender — renderiza só as chaves úteis por tipo de bem.
// ============================================================

function Linha({ rotulo, valor }: { rotulo: string; valor: string | number | undefined | null }) {
  if (valor === undefined || valor === null || valor === "") return null;
  return (
    <p className="mt-1 text-xs text-[var(--color-ivory-66)]">
      {rotulo}: <span className="text-ivory">{valor}</span>
    </p>
  );
}

function getStr(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key];
  return typeof v === "string" ? v : undefined;
}

function getNum(obj: Record<string, unknown>, key: string): number | undefined {
  const v = obj[key];
  return typeof v === "number" ? v : undefined;
}

function getArr(obj: Record<string, unknown>, key: string): unknown[] | undefined {
  const v = obj[key];
  return Array.isArray(v) ? v : undefined;
}

function DetalhesRender({
  tipo,
  detalhes,
}: {
  tipo: TipoBem;
  detalhes: Record<string, unknown>;
}) {
  switch (tipo) {
    case "veiculo": {
      const placa = getStr(detalhes, "placa");
      const marca = getStr(detalhes, "marca");
      const modelo = getStr(detalhes, "modelo");
      const ano = getNum(detalhes, "ano_modelo");
      const restricoes = getArr(detalhes, "restricoes");
      const veiculo = [marca, modelo].filter(Boolean).join(" ");
      return (
        <>
          <Linha rotulo="Placa" valor={placa} />
          <Linha rotulo="Veículo" valor={veiculo || undefined} />
          <Linha rotulo="Ano" valor={ano} />
          {restricoes && restricoes.length > 0 ? (
            <Linha
              rotulo="Restrições"
              valor={restricoes.map((r) => String(r)).join("; ")}
            />
          ) : null}
        </>
      );
    }
    case "imovel": {
      const cidade = getStr(detalhes, "cidade");
      const uf = getStr(detalhes, "uf");
      const areaH = getNum(detalhes, "area_hectares");
      const areaM = getNum(detalhes, "area_m2");
      const matricula = getStr(detalhes, "matricula");
      const local = [cidade, uf].filter(Boolean).join(" / ");
      const area =
        areaH !== undefined
          ? `${areaH} ha`
          : areaM !== undefined
          ? `${areaM} m²`
          : undefined;
      return (
        <>
          <Linha rotulo="Localização" valor={local || undefined} />
          <Linha rotulo="Área" valor={area} />
          <Linha rotulo="Matrícula" valor={matricula} />
        </>
      );
    }
    case "empresa": {
      const cnpj = getStr(detalhes, "cnpj");
      const razao = getStr(detalhes, "razao_social");
      const pct = getNum(detalhes, "percent_participacao");
      const qual = getStr(detalhes, "qual");
      return (
        <>
          <Linha rotulo="CNPJ" valor={cnpj} />
          <Linha rotulo="Razão social" valor={razao} />
          <Linha
            rotulo="Participação"
            valor={pct !== undefined ? `${pct}%` : undefined}
          />
          <Linha rotulo="Qualificação" valor={qual} />
        </>
      );
    }
    case "processo_credito": {
      const cnj = getStr(detalhes, "numero_cnj");
      const tribunal = getStr(detalhes, "tribunal");
      const classe = getStr(detalhes, "classe");
      return (
        <>
          <Linha rotulo="CNJ" valor={cnj} />
          <Linha rotulo="Tribunal" valor={tribunal} />
          <Linha rotulo="Classe" valor={classe} />
        </>
      );
    }
    case "endereco": {
      const log = getStr(detalhes, "logradouro");
      const cidade = getStr(detalhes, "cidade");
      const uf = getStr(detalhes, "uf");
      const tipoEnd = getStr(detalhes, "tipo");
      const local = [cidade, uf].filter(Boolean).join(" / ");
      return (
        <>
          <Linha rotulo="Logradouro" valor={log} />
          <Linha rotulo="Cidade" valor={local || undefined} />
          <Linha rotulo="Tipo" valor={tipoEnd} />
        </>
      );
    }
    case "vinculo": {
      const nome = getStr(detalhes, "nome");
      const doc = getStr(detalhes, "documento");
      const tipoVinc = getStr(detalhes, "tipo_vinculo");
      return (
        <>
          <Linha rotulo="Nome" valor={nome} />
          <Linha rotulo="Documento" valor={doc} />
          <Linha rotulo="Vínculo" valor={tipoVinc} />
        </>
      );
    }
    default:
      return null;
  }
}
