// Dossiê patrimonial — visão da EQUIPE. Sem checagem de email_contato:
// obterDossie() devolve TUDO. Mantém a mesma estrutura visual do dossiê
// do cliente (header + casos + bens por categoria).
import Link from "next/link";
import { redirect } from "next/navigation";
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
  empresa: { label: "Participações societárias", icone: "E" },
  processo_credito: { label: "Processos onde é credor", icone: "P" },
  endereco: { label: "Endereços confirmados", icone: "A" },
  vinculo: { label: "Vínculos familiares", icone: "F" },
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

  return (
    <main>
      {/* ============ HEADER ============ */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[900px] -translate-x-1/2 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(201,162,74,0.16), transparent 65%)",
          }}
        />
        <div className="relative mx-auto max-w-[1400px] px-6 py-16 sm:px-10">
          <Link
            href={`/equipe/devedores${linkBase}`}
            className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-gold)] transition hover:text-[var(--color-tip-glow)]"
          >
            ← Voltar
          </Link>

          <div className="mt-6 flex items-center gap-3">
            <span className="eyebrow">Dossiê patrimonial</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-signal)]">
              Visão da equipe
            </span>
          </div>

          <h1 className="mt-4 font-serif text-[clamp(28px,4vw,46px)] font-medium leading-[1.1] tracking-tight text-ivory">
            {devedor.nome}
          </h1>
          <p className="mt-3 font-mono text-sm text-[var(--color-ivory-66)]">
            {devedor.tipo === "PF" ? "Pessoa Física" : "Pessoa Jurídica"} ·{" "}
            {devedor.documento}
            {devedor.data_nascimento
              ? ` · Nasc. ${formatData(devedor.data_nascimento)}`
              : ""}
          </p>

          {devedor.ultima_consulta_em ? (
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
              Última consulta {formatTempoRelativo(devedor.ultima_consulta_em)}
            </p>
          ) : null}

          {/* Link discreto pro dashboard analítico — atalho no topo do dossiê.
              Cor signal pra ficar levemente acima do ruído sem competir com
              os CTAs dourados mais abaixo. */}
          <div className="mt-4">
            <Link
              href={`/equipe/devedores/${devedor.id}/dashboard${linkBase}`}
              className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-signal)] transition hover:text-[var(--color-tip-glow)]"
            >
              Ver dashboard analítico →
            </Link>
          </div>

          {/* 3 cards de número grande */}
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <CardNumero rotulo="Total de bens" valor={String(total_bens)} />
            <CardNumero
              rotulo="Valor estimado"
              valor={formatBRL(valor_estimado_total_brl)}
            />
            <CardNumero rotulo="Casos vinculados" valor={String(casos.length)} />
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
              🚀 Abrir Gerador de Peça →
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
            <span className="eyebrow">Casos onde este devedor aparece</span>
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
          <span className="eyebrow">Bens encontrados</span>
          <h2 className="mt-4 font-serif text-3xl text-ivory">Por categoria</h2>

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
                    <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
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
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-300/90">
            Atenção · Cross-reference
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
        className="self-start rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] sm:self-auto"
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
      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
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
