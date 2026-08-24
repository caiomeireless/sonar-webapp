// CENTRAL DE ACORDOS — três frentes (ditado 25/08):
//   1) ACORDOS JUDICIAIS — homologados/aguardando nos autos;
//   2) ACORDOS EXTRAJUDICIAIS — confissões de dívida e composições fora
//      dos autos;
//   3) TENTATIVAS PRÉ-PROCESSUAIS — notificação extrajudicial de
//      composição amigável ANTES de judicializar, gerada na folha
//      timbrada do Battaglia e disparada por e-mail (Assertiva) pela
//      própria plataforma.
// A aba abre com os três painéis; cada seção mostra os casos REAIS
// (hoje vazios) + um card DEMO opt-in. Cadastro real = próxima etapa.
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  FileSignature,
  Gavel,
  Handshake,
  Send,
  TriangleAlert,
} from "lucide-react";

import { perfilLogado } from "@/lib/perfis-server";
import { ehCliente } from "@/lib/perfis";
import { devEuFromParam } from "@/lib/dev-auth";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { BordaLiquidaMetal } from "@/components/ui/BordaLiquidaMetal";
import { BORDA_CADERNO } from "@/app/_shared/dossie/SecaoFicha";
import { TimbreBP } from "@/app/equipe/devedores/[id]/peca/[template]/TimbreBP";
import { AssinaturasBP } from "@/app/equipe/devedores/[id]/peca/[template]/AssinaturasBP";
import { RodapeBP } from "@/app/equipe/devedores/[id]/peca/[template]/RodapeBP";

type Props = {
  searchParams?: Promise<{
    eu?: string | string[];
    secao?: string | string[];
    demo?: string | string[];
  }>;
};

const NEON = {
  verde: "#3CFF8A",
  laranja: "#FF9C41",
  ciano: "#38BDF8",
  violeta: "#C084FC",
  amarelo: "#FFD93D",
  rosa: "#FB7185",
  turquesa: "#2DD4BF",
};

type StatusAcordo =
  | "homologado"
  | "aguardando"
  | "inadimplente"
  | "assinado"
  | "negociacao";

type AcordoDemo = {
  id: number;
  devedor: string;
  credor: string;
  processo: string;
  status: StatusAcordo;
  dividaOriginalBrl: number;
  valorAcordoBrl: number;
  quitadoBrl: number;
  parcelasTotal: number;
  parcelasPagas: number;
  parcelaBrl: number;
  proximoVencimento: string;
  termos: string;
  ponte: string;
  alerta?: string;
};

const JUDICIAIS_DEMO: AcordoDemo[] = [
  {
    id: 1,
    devedor: "João da Silva",
    credor: "Distribuidora Modelo Ltda.",
    processo: "1002345-67.2024.8.26.0602",
    status: "homologado",
    dividaOriginalBrl: 984310.2,
    valorAcordoBrl: 720000,
    quitadoBrl: 270000,
    parcelasTotal: 24,
    parcelasPagas: 9,
    parcelaBrl: 30000,
    proximoVencimento: "10/09/2026",
    termos:
      "Entrada de R$ 90.000 + 24 parcelas mensais de R$ 30.000 com correção pela Selic; desconto de 26,9% sobre o débito atualizado condicionado ao adimplemento integral; garantia: manutenção da penhora do apartamento (matrícula 45.678) até a quitação.",
    ponte: "Baixas conciliadas com o Financeiro BP — última parcela confirmada em 10/08/2026.",
  },
  {
    id: 2,
    devedor: "Empresa XYZ Transportes Ltda.",
    credor: "Cliente Exemplo S/A",
    processo: "1007890-11.2025.8.26.0602",
    status: "aguardando",
    dividaOriginalBrl: 412500,
    valorAcordoBrl: 350000,
    quitadoBrl: 70000,
    parcelasTotal: 12,
    parcelasPagas: 0,
    parcelaBrl: 23333.33,
    proximoVencimento: "05/09/2026",
    termos:
      "Entrada de R$ 70.000 (paga na assinatura) + 12 parcelas mensais de R$ 23.333,33; petição de homologação protocolada em 18/08/2026 — aguardando decisão; cláusula de vencimento antecipado em caso de 2 parcelas em aberto.",
    ponte: "Entrada confirmada pelo financeiro do CLIENTE — comprovante anexado ao protocolo.",
  },
  {
    id: 3,
    devedor: "Marcos Pereira dos Santos",
    credor: "Condomínio Solar das Águas",
    processo: "1009876-54.2025.8.26.0602",
    status: "inadimplente",
    dividaOriginalBrl: 239730.24,
    valorAcordoBrl: 198000,
    quitadoBrl: 66000,
    parcelasTotal: 18,
    parcelasPagas: 6,
    parcelaBrl: 11000,
    proximoVencimento: "vencida em 10/07/2026",
    termos:
      "18 parcelas mensais de R$ 11.000; homologado em 12/12/2025; cláusula penal: retomada da execução pelo SALDO em caso de inadimplemento superior a 30 dias.",
    ponte: "Financeiro BP sinalizou ausência das parcelas 7 e 8 — cliente comunicado em 12/08/2026.",
    alerta:
      "2 parcelas em aberto (> 30 dias). Cláusula penal acionável: peticionar a retomada da execução pelo saldo de R$ 132.000.",
  },
];

const EXTRAJUDICIAIS_DEMO: AcordoDemo[] = [
  {
    id: 11,
    devedor: "Fernanda Costa Lima",
    credor: "Cliente Exemplo S/A",
    processo: "Confissão de Dívida nº 2026/014 (sem processo)",
    status: "assinado",
    dividaOriginalBrl: 86000,
    valorAcordoBrl: 72000,
    quitadoBrl: 28800,
    parcelasTotal: 10,
    parcelasPagas: 4,
    parcelaBrl: 7200,
    proximoVencimento: "15/09/2026",
    termos:
      "Instrumento particular de confissão de dívida com 2 testemunhas (título executivo extrajudicial — CPC 784, III); 10 parcelas de R$ 7.200; desconto de 16% condicionado ao adimplemento; sem garantia real.",
    ponte: "Baixas conciliadas com o Financeiro BP — 4 parcelas confirmadas.",
  },
  {
    id: 12,
    devedor: "Mercado Bom Preço Ltda.",
    credor: "Distribuidora Modelo Ltda.",
    processo: "Em negociação (sem processo)",
    status: "negociacao",
    dividaOriginalBrl: 154300,
    valorAcordoBrl: 128000,
    quitadoBrl: 0,
    parcelasTotal: 8,
    parcelasPagas: 0,
    parcelaBrl: 16000,
    proximoVencimento: "proposta expira em 30/08/2026",
    termos:
      "Proposta enviada em 12/08/2026: entrada de R$ 16.000 + 8 parcelas; contraproposta do devedor pedindo 12 parcelas recebida em 20/08 — em análise com o cliente.",
    ponte: "Sem movimentação financeira até a assinatura — minuta na mesa.",
  },
  {
    id: 13,
    devedor: "Paulo Roberto Nunes",
    credor: "Cliente Exemplo S/A",
    processo: "Confissão de Dívida nº 2025/089 (sem processo)",
    status: "inadimplente",
    dividaOriginalBrl: 64200,
    valorAcordoBrl: 54000,
    quitadoBrl: 18000,
    parcelasTotal: 12,
    parcelasPagas: 4,
    parcelaBrl: 4500,
    proximoVencimento: "vencida em 05/07/2026",
    termos:
      "12 parcelas de R$ 4.500 com vencimento todo dia 5; confissão assinada com 2 testemunhas — título executivo extrajudicial pronto para execução direta.",
    ponte: "Financeiro BP acusou 2 parcelas em aberto — cliente comunicado em 08/08/2026.",
    alerta:
      "2 parcelas em aberto. O título extrajudicial permite EXECUTAR direto o saldo de R$ 36.000 (CPC 784, III) — sem fase de conhecimento.",
  },
];

const META_STATUS: Record<StatusAcordo, { label: string; cor: string }> = {
  homologado: { label: "Homologado", cor: NEON.verde },
  aguardando: { label: "Aguardando Homologação", cor: NEON.amarelo },
  inadimplente: { label: "Inadimplente", cor: NEON.rosa },
  assinado: { label: "Assinado · Em Dia", cor: NEON.verde },
  negociacao: { label: "Em Negociação", cor: NEON.amarelo },
};

function fmtBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function AvisoDemo({ ocultarHref }: { ocultarHref: string }) {
  return (
    <div
      className="mb-4 flex flex-wrap items-center justify-center gap-3 rounded-2xl border px-5 py-3.5"
      style={{
        borderColor: "rgba(255,217,61,0.55)",
        backgroundColor: "rgba(255,217,61,0.10)",
      }}
    >
      <TriangleAlert
        className="h-5 w-5 shrink-0"
        style={{ color: NEON.amarelo }}
        aria-hidden="true"
      />
      <p
        className="font-mono text-[13px] font-semibold uppercase tracking-[0.22em]"
        style={{ color: NEON.amarelo }}
      >
        Demonstração — Dados Fictícios · Cadastro Real na Próxima Etapa
      </p>
      <Link
        href={ocultarHref}
        className="font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)] underline-offset-2 hover:underline"
      >
        Ocultar
      </Link>
    </div>
  );
}

function CardDemoRoxo({ href, texto }: { href: string; texto: string }) {
  return (
    <SpotlightCard
      local
      degrade="linear-gradient(0deg, rgba(58,32,88,0.55), rgba(58,32,88,0.55))"
      borda="rgba(192, 132, 252, 0.45)"
      className="mb-4"
    >
      <Link
        href={href}
        className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4"
      >
        <div className="min-w-0">
          <p className="font-mono text-[13px] font-semibold uppercase tracking-[0.26em] text-[#C084FC]">
            Demonstração
          </p>
          <p className="mt-1 text-[15px] leading-snug text-ivory">{texto}</p>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-full border border-[#C084FC]/60 bg-[#C084FC]/10 px-4 py-2 font-mono text-[12px] font-semibold uppercase tracking-[0.18em] text-[#C084FC]">
          Ver Demonstração
        </span>
      </Link>
    </SpotlightCard>
  );
}

function VazioReal({ texto }: { texto: string }) {
  return (
    <SpotlightCard local claro className="p-10 text-center">
      <p className="font-serif text-2xl text-ivory">
        Nenhum registro real ainda
      </p>
      <p className="mx-auto mt-3 max-w-[560px] text-sm text-[var(--color-ivory-88)]">
        {texto}
      </p>
    </SpotlightCard>
  );
}

function CardAcordo({ a }: { a: AcordoDemo }) {
  const meta = META_STATUS[a.status];
  const pct =
    a.valorAcordoBrl > 0
      ? Math.round((a.quitadoBrl / a.valorAcordoBrl) * 100)
      : 0;
  const saldo = a.valorAcordoBrl - a.quitadoBrl;
  return (
    <SpotlightCard
      blur={false}
      local
      claro
      borda={a.status === "inadimplente" ? "rgba(251,113,133,0.45)" : BORDA_CADERNO}
      className="p-6 sm:p-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3
              className="max-w-full truncate font-serif text-[clamp(18px,1.8vw,24px)] font-semibold uppercase leading-tight tracking-[0.02em] text-[var(--color-devedor)]"
              style={{
                textShadow:
                  "0 0 1px rgba(220,38,38,0.6), 0 0 12px rgba(220,38,38,0.16)",
              }}
            >
              {a.devedor}
            </h3>
            <span className="font-mono text-[12px] text-[var(--color-ivory-66)]">
              {a.processo}
            </span>
          </div>
          <p className="mt-1 font-mono text-[13px]">
            <span className="text-ivory">Cliente: </span>
            <span className="text-[#FF9C41]">{a.credor}</span>
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-mono text-[12px] font-semibold uppercase tracking-[0.18em]"
          style={{
            color: meta.cor,
            borderColor: `color-mix(in srgb, ${meta.cor} 55%, transparent)`,
            backgroundColor: `color-mix(in srgb, ${meta.cor} 10%, transparent)`,
          }}
        >
          <Handshake className="h-3.5 w-3.5" aria-hidden="true" />
          {meta.label}
        </span>
      </div>

      <div className="mt-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2 font-mono text-[13px] uppercase tracking-[0.14em]">
          <span className="text-[var(--color-ivory-66)]">
            Progressão · {a.parcelasPagas}/{a.parcelasTotal} parcelas de{" "}
            {fmtBRL(a.parcelaBrl)}
          </span>
          <span style={{ color: meta.cor }}>{pct}% quitado</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              backgroundColor: meta.cor,
              boxShadow: `0 0 12px ${meta.cor}`,
            }}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {Array.from({ length: a.parcelasTotal }, (_, i) => (
            <span
              key={i}
              title={`Parcela ${i + 1}`}
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor:
                  i < a.parcelasPagas
                    ? meta.cor
                    : a.status === "inadimplente" && i < a.parcelasPagas + 2
                      ? NEON.rosa
                      : "rgba(255,255,255,0.14)",
                boxShadow: i < a.parcelasPagas ? `0 0 6px ${meta.cor}` : "none",
              }}
            />
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/8 pt-4 sm:grid-cols-4">
        {[
          { rotulo: "Dívida Original", valor: fmtBRL(a.dividaOriginalBrl), cor: "var(--color-ivory-88)" },
          { rotulo: "Valor do Acordo", valor: fmtBRL(a.valorAcordoBrl), cor: "var(--color-gold)" },
          { rotulo: "Já Quitado", valor: fmtBRL(a.quitadoBrl), cor: NEON.verde },
          { rotulo: "Saldo Devedor", valor: fmtBRL(saldo), cor: a.status === "inadimplente" ? NEON.rosa : "var(--color-ivory)" },
        ].map((n) => (
          <div key={n.rotulo}>
            <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
              {n.rotulo}
            </p>
            <p className="mt-1 font-mono text-[17px] tabular-nums" style={{ color: n.cor }}>
              {n.valor}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2.5 border-t border-white/8 pt-4">
        <p className="text-sm leading-relaxed text-[var(--color-ivory-88)]">
          <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--color-gold)]/80">
            Termos ·{" "}
          </span>
          {a.termos}
        </p>
        <p className="font-mono text-[13px] uppercase tracking-[0.12em]">
          <span className="text-[var(--color-ivory-66)]">
            Próximo vencimento:{" "}
          </span>
          <span
            style={{ color: a.status === "inadimplente" ? NEON.rosa : NEON.ciano }}
          >
            {a.proximoVencimento}
          </span>
        </p>
        <p className="text-sm leading-snug">
          <span
            className="font-mono text-[12px] uppercase tracking-[0.18em]"
            style={{ color: NEON.turquesa }}
          >
            Ponte Financeira ·{" "}
          </span>
          <span className="text-[var(--color-ivory-88)]">{a.ponte}</span>
        </p>
      </div>

      {a.alerta ? (
        <div
          className="mt-4 flex items-start gap-3 rounded-xl border px-4 py-3"
          style={{
            borderColor: "rgba(251,113,133,0.5)",
            backgroundColor: "rgba(251,113,133,0.08)",
          }}
        >
          <TriangleAlert
            className="mt-0.5 h-4.5 w-4.5 shrink-0"
            style={{ color: NEON.rosa }}
            aria-hidden="true"
          />
          <p className="text-sm leading-snug" style={{ color: NEON.rosa }}>
            {a.alerta}
          </p>
        </div>
      ) : null}
    </SpotlightCard>
  );
}

export default async function CentralAcordosPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  if (ehCliente(perfil)) redirect("/cliente/casos");
  const euDev = devEuFromParam(sp.eu);
  const eu = euDev ?? perfil?.email ?? null;
  if (!eu) redirect("/login");
  const euQS = euDev ? `&eu=${encodeURIComponent(euDev)}` : "";
  const linkBase = euDev ? `?eu=${encodeURIComponent(euDev)}` : "";

  const secaoRaw = Array.isArray(sp.secao) ? sp.secao[0] : sp.secao;
  const secao =
    secaoRaw === "judiciais" ||
    secaoRaw === "extrajudiciais" ||
    secaoRaw === "tentativas"
      ? secaoRaw
      : null;
  const demoRaw = Array.isArray(sp.demo) ? sp.demo[0] : sp.demo;
  const mostrarDemo = demoRaw === "1";

  const hrefSecao = (s: string, demo = false) =>
    `/equipe/acordos?secao=${s}${demo ? "&demo=1" : ""}${euQS}`;

  return (
    <main className="relative min-h-svh">
      <div aria-hidden="true" className="absolute inset-0 bg-black" />
      <div className="relative z-10 mx-auto max-w-[1200px] px-6 py-12 sm:px-10">
        <header className="mb-8 text-center">
          <h1
            className="font-serif text-[clamp(29px,4.2vw,52px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[#C97B2A]"
            style={{ WebkitTextStroke: "1px rgba(255,255,255,0.65)" }}
          >
            Central de Acordos
          </h1>
          <p className="mt-3 font-mono text-[clamp(13px,1.6vw,20px)] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
            Progressão e Controle dos Acordos Firmados.
          </p>
        </header>

        {secao === null ? (
          /* ============ ENTRADA: os três painéis ============ */
          <div className="grid gap-5 lg:grid-cols-3">
            {[
              {
                s: "judiciais",
                Icone: Gavel,
                cor: NEON.verde,
                titulo: "Acordos Judiciais",
                desc: "Acordos nos autos: homologação, parcelas, % quitado e retomada da execução no inadimplemento.",
              },
              {
                s: "extrajudiciais",
                Icone: Handshake,
                cor: NEON.ciano,
                titulo: "Acordos Extrajudiciais",
                desc: "Confissões de dívida e composições fora dos autos — título executivo pronto se o devedor falhar.",
              },
              {
                s: "tentativas",
                Icone: Send,
                cor: NEON.violeta,
                titulo: "Tentativas Pré-Processuais",
                desc: "Notificação extrajudicial de composição amigável, gerada no timbre do escritório e disparada por e-mail antes de judicializar.",
              },
            ].map(({ s, Icone, cor, titulo, desc }) => (
              <SpotlightCard
                key={s}
                local
                claro
                borda={BORDA_CADERNO}
                className="transition hover:shadow-[0_0_28px_-10px_rgba(201,162,74,0.35)]"
              >
                <Link href={hrefSecao(s)} className="flex h-full flex-col p-7">
                  <div
                    className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border"
                    style={{
                      color: cor,
                      borderColor: `color-mix(in srgb, ${cor} 45%, transparent)`,
                      backgroundColor: `color-mix(in srgb, ${cor} 10%, transparent)`,
                    }}
                  >
                    <Icone className="h-7 w-7" />
                  </div>
                  <h2
                    className="mt-4 font-serif text-2xl font-semibold uppercase tracking-[0.04em]"
                    style={{ color: cor }}
                  >
                    {titulo}
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--color-ivory-88)]">
                    {desc}
                  </p>
                  <p className="mt-4 font-mono text-[12px] uppercase tracking-[0.2em] text-[var(--color-ivory-66)]">
                    0 registros reais · demonstração disponível →
                  </p>
                </Link>
              </SpotlightCard>
            ))}
          </div>
        ) : (
          <>
            {/* Voltar aos painéis */}
            <BordaLiquidaMetal cor="laranja" radius={14} className="inline-flex">
              <Link
                href={`/equipe/acordos${linkBase}`}
                className="inline-flex h-full w-full items-center gap-2.5 rounded-[11px] bg-[rgba(255,156,65,0.10)] px-5 py-3 text-sm font-medium text-[#FF9C41] transition hover:bg-[rgba(255,156,65,0.18)]"
              >
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                Voltar aos Painéis
              </Link>
            </BordaLiquidaMetal>

            <h2
              className="mt-8 text-center font-serif text-[clamp(24px,2.5vw,38px)] uppercase leading-[1.1] tracking-[0.08em] text-[var(--color-gold)]"
              style={{
                WebkitTextStroke: "1px rgba(255,255,255,0.55)",
                textShadow: "0 0 18px rgba(201,162,74,0.4)",
              }}
            >
              {secao === "judiciais"
                ? "Acordos Judiciais"
                : secao === "extrajudiciais"
                  ? "Acordos Extrajudiciais"
                  : "Tentativas Pré-Processuais"}
            </h2>

            <div className="mt-6">
              {!mostrarDemo ? (
                <>
                  <CardDemoRoxo
                    href={hrefSecao(secao, true)}
                    texto={
                      secao === "judiciais"
                        ? "Três acordos judiciais fictícios — homologado em dia, aguardando homologação e inadimplente com cláusula penal."
                        : secao === "extrajudiciais"
                          ? "Três composições fictícias — confissão assinada em dia, negociação em curso e inadimplente com título pronto pra executar."
                          : "Formulário + notificação extrajudicial fictícia no timbre do Battaglia, com disparo por e-mail pela plataforma."
                    }
                  />
                  <VazioReal
                    texto={
                      secao === "tentativas"
                        ? "Nenhuma notificação elaborada ainda. O cadastro real — com geração no timbre, revisão e disparo por e-mail localizado via Assertiva — chega na próxima etapa."
                        : "Nenhum acordo registrado ainda. O cadastro real, com parcelas, conciliação financeira e alertas, chega na próxima etapa."
                    }
                  />
                </>
              ) : secao === "tentativas" ? (
                <>
                  <AvisoDemo ocultarHref={hrefSecao(secao)} />

                  {/* ===== Formulário de elaboração (demo, preenchido) ===== */}
                  <SpotlightCard
                    local
                    claro
                    degrade="linear-gradient(0deg, rgba(10,48,28,0.7), rgba(10,48,28,0.7))"
                    className="p-6 sm:p-7"
                  >
                    <h3 className="font-mono text-[13px] uppercase tracking-[0.32em] text-[var(--color-signal)]">
                      Elaborar Notificação Extrajudicial
                    </h3>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        { rotulo: "Pré-Devedor", valor: "Ricardo Almeida Prado" },
                        { rotulo: "CPF/CNPJ", valor: "321.654.987-00" },
                        { rotulo: "Cliente (Credor)", valor: "Cliente Exemplo S/A" },
                        { rotulo: "Valor da Dívida", valor: "R$ 48.500,00" },
                        { rotulo: "Proposta", valor: "30% de desconto à vista OU 12 parcelas" },
                        { rotulo: "Prazo para Resposta", valor: "10 dias corridos" },
                      ].map((c) => (
                        <label key={c.rotulo} className="block">
                          <span className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
                            {c.rotulo}
                          </span>
                          <input
                            readOnly
                            value={c.valor}
                            className="mt-1.5 w-full rounded-lg border border-[var(--color-ivory-22)] bg-[var(--color-carbon)] px-3.5 py-2.5 text-sm text-ivory outline-none"
                          />
                        </label>
                      ))}
                    </div>
                    <div className="mt-5">
                      <BordaLiquidaMetal cor="gold" radius={14} className="inline-flex">
                        <span className="inline-flex cursor-default items-center gap-2 rounded-[11px] bg-[var(--color-gold)] px-6 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-[var(--color-carbon)]">
                          <FileSignature className="h-4.5 w-4.5" aria-hidden="true" />
                          Gerar Notificação
                        </span>
                      </BordaLiquidaMetal>
                    </div>
                  </SpotlightCard>

                  {/* ===== Pré-visualização na folha do Battaglia ===== */}
                  <SpotlightCard
                    local
                    claro
                    borda={BORDA_CADERNO}
                    className="mt-5 p-6 sm:p-8"
                  >
                    <h3 className="font-mono text-[15px] font-semibold uppercase tracking-[0.28em] text-[var(--color-gold)]">
                      Pré-Visualização · Notificação Extrajudicial
                    </h3>
                    <div className="mx-auto mt-5 max-w-[820px] overflow-hidden rounded-lg bg-white px-10 py-8 text-[#1a1a1a] shadow-2xl">
                      <TimbreBP />
                      <h4
                        className="mt-8 text-center font-serif text-[15pt] font-bold uppercase tracking-wide"
                        style={{ color: "#1a1a1a" }}
                      >
                        Notificação Extrajudicial
                      </h4>
                      <div className="mt-6 space-y-4 text-justify font-serif text-[11.5pt] leading-relaxed">
                        <p>
                          <strong>RICARDO ALMEIDA PRADO</strong>, CPF
                          321.654.987-00, residente na Rua das Hortênsias, 456,
                          Sorocaba/SP.
                        </p>
                        <p>
                          <strong>CLIENTE EXEMPLO S/A</strong>, por seus
                          advogados que esta subscrevem, vem NOTIFICÁ-LO do
                          débito em aberto no valor atualizado de{" "}
                          <strong>R$ 48.500,00</strong> (quarenta e oito mil e
                          quinhentos reais), decorrente do contrato de
                          fornecimento nº 2024/117, vencido e não pago.
                        </p>
                        <p>
                          Antes de adotar as medidas judiciais cabíveis — com
                          os acréscimos de custas, honorários e constrição
                          patrimonial que delas decorrem —, a credora propõe a{" "}
                          <strong>composição amigável</strong> nos seguintes
                          termos: (a) pagamento à vista com{" "}
                          <strong>30% de desconto</strong> (R$ 33.950,00); ou
                          (b) parcelamento em <strong>12 parcelas mensais</strong>{" "}
                          de R$ 4.041,67, sem desconto.
                        </p>
                        <p>
                          Fica concedido o prazo de <strong>10 (dez) dias
                          corridos</strong>, contados do recebimento desta, para
                          manifestação pelos canais abaixo. O silêncio será
                          interpretado como recusa, autorizando o imediato
                          ajuizamento da ação competente.
                        </p>
                        <p>Sorocaba, 25 de agosto de 2026.</p>
                      </div>
                      <AssinaturasBP />
                      <RodapeBP />
                    </div>
                  </SpotlightCard>

                  {/* ===== Fluxo: corrigir → arrastar versão final → disparar ===== */}
                  <SpotlightCard
                    local
                    claro
                    borda={BORDA_CADERNO}
                    className="mt-5 p-6 sm:p-7"
                  >
                    <h3 className="font-mono text-[15px] font-semibold uppercase tracking-[0.28em]" style={{ color: NEON.violeta }}>
                      Revisão e Disparo
                    </h3>
                    <p className="mt-3 max-w-[820px] text-sm leading-relaxed text-[var(--color-ivory-88)]">
                      O Sonar gera a minuta acima, o advogado ajusta o texto no
                      Word, e a <strong className="text-ivory">versão final</strong>{" "}
                      volta pra cá — arrastando o PDF na caixa abaixo. O disparo
                      sai pela própria plataforma: o e-mail do devedor é
                      localizado via <span style={{ color: NEON.violeta }}>Assertiva Localize</span>{" "}
                      e o envio fica registrado com data e trilha de leitura.
                    </p>
                    <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                      <div
                        className="flex min-h-[130px] flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-4 py-4 text-center"
                        style={{
                          borderColor: "rgba(192,132,252,0.45)",
                          backgroundColor: "rgba(192,132,252,0.05)",
                        }}
                      >
                        <p className="font-mono text-[13px] uppercase tracking-[0.2em]" style={{ color: NEON.violeta }}>
                          Arraste a Versão Final Aqui
                        </p>
                        <p className="max-w-[460px] text-[13px] leading-snug text-[var(--color-ivory-66)]">
                          PDF da notificação revisada — fica anexada à
                          tentativa com data e autor.
                        </p>
                      </div>
                      <div className="flex flex-col justify-center gap-2">
                        <BordaLiquidaMetal cor="violeta" radius={14} className="flex">
                          <span className="flex w-full cursor-default items-center justify-center gap-2 rounded-[11px] px-6 py-4 text-sm font-bold uppercase tracking-[0.1em]" style={{ color: NEON.violeta, backgroundColor: "rgba(192,132,252,0.10)" }}>
                            <Send className="h-4.5 w-4.5" aria-hidden="true" />
                            Enviar ao Devedor
                          </span>
                        </BordaLiquidaMetal>
                        <p className="text-center font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--color-ivory-66)]">
                          E-mail via Assertiva · Trilha de Leitura
                        </p>
                      </div>
                    </div>
                  </SpotlightCard>
                </>
              ) : (
                <>
                  <AvisoDemo ocultarHref={hrefSecao(secao)} />
                  <div className="flex flex-col gap-4">
                    {(secao === "judiciais"
                      ? JUDICIAIS_DEMO
                      : EXTRAJUDICIAIS_DEMO
                    ).map((a) => (
                      <CardAcordo key={a.id} a={a} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* Rodapé: visão da ponte financeira */}
        <SpotlightCard
          local
          claro
          borda={BORDA_CADERNO}
          className="mt-8 p-6 text-center sm:p-7"
        >
          <p className="font-mono text-[13px] uppercase tracking-[0.28em] text-[var(--color-signal)]">
            Como Funciona a Ponte Financeira
          </p>
          <p className="mx-auto mt-3 max-w-[720px] text-sm leading-relaxed text-[var(--color-ivory-88)]">
            Cada parcela paga é conciliada com o financeiro do escritório (ou
            do cliente, quando ele recebe direto). O Sonar atualiza a
            progressão sozinho, avisa o advogado quando um vencimento passa em
            aberto e, no inadimplemento, sugere a retomada da execução ou a
            execução direta do título extrajudicial.
          </p>
          <p className="mt-4 font-mono text-[12px] uppercase tracking-[0.2em] text-[var(--color-ivory-66)]">
            Cadastro real de acordos e notificações — próxima etapa
          </p>
        </SpotlightCard>
      </div>
    </main>
  );
}
