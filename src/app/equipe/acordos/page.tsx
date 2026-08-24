// CENTRAL DE ACORDOS — controle da progressão dos acordos firmados
// (reforma 25/08, ditado do Caio). A ideia: um acordo registrado POR
// PROCESSO com termos, parcelas, vencimentos, homologação, % da dívida
// quitado, alerta de inadimplência e PONTE com o financeiro (do
// escritório ou do cliente). Por ora é uma DEMONSTRAÇÃO com dados
// fictícios — o cadastro real vem na próxima etapa (tabela acordos).
import Link from "next/link";
import { redirect } from "next/navigation";
import { TriangleAlert, Handshake } from "lucide-react";

import { perfilLogado } from "@/lib/perfis-server";
import { ehCliente } from "@/lib/perfis";
import { devEuFromParam } from "@/lib/dev-auth";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { BORDA_CADERNO } from "@/app/_shared/dossie/SecaoFicha";

type Props = { searchParams?: Promise<{ eu?: string | string[] }> };

const NEON = {
  verde: "#3CFF8A",
  laranja: "#FF9C41",
  ciano: "#38BDF8",
  violeta: "#C084FC",
  amarelo: "#FFD93D",
  rosa: "#FB7185",
};

type StatusAcordo = "homologado" | "aguardando" | "inadimplente";

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

const ACORDOS_DEMO: AcordoDemo[] = [
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

const META_STATUS: Record<StatusAcordo, { label: string; cor: string }> = {
  homologado: { label: "Homologado", cor: NEON.verde },
  aguardando: { label: "Aguardando Homologação", cor: NEON.amarelo },
  inadimplente: { label: "Inadimplente", cor: NEON.rosa },
};

function fmtBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function CentralAcordosPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  if (ehCliente(perfil)) redirect("/cliente/casos");
  const euDev = devEuFromParam(sp.eu);
  const eu = euDev ?? perfil?.email ?? null;
  if (!eu) redirect("/login");
  const linkBase = euDev ? `?eu=${encodeURIComponent(euDev)}` : "";

  return (
    <main className="relative min-h-svh">
      <div aria-hidden="true" className="absolute inset-0 bg-black" />
      <div className="relative z-10 mx-auto max-w-[1200px] px-6 py-12 sm:px-10">
        {/* ============ HEADER (padrão da cara nova) ============ */}
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

        {/* Aviso demo */}
        <div
          className="mb-4 flex items-center justify-center gap-3 rounded-2xl border px-5 py-3.5"
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
            Demonstração — Acordos Fictícios · O Cadastro Real Chega na
            Próxima Etapa
          </p>
        </div>

        {/* Contador vermelho */}
        <p className="mb-4 font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-devedor)]">
          {ACORDOS_DEMO.length} acordos · 1 homologado · 1 aguardando · 1
          inadimplente · {fmtBRL(336000)} já recuperados
        </p>

        {/* ============ LISTA DE ACORDOS ============ */}
        <div className="flex flex-col gap-4">
          {ACORDOS_DEMO.map((a) => {
            const meta = META_STATUS[a.status];
            const pct = Math.round((a.quitadoBrl / a.valorAcordoBrl) * 100);
            const saldo = a.valorAcordoBrl - a.quitadoBrl;
            return (
              <SpotlightCard
                key={a.id}
                blur={false}
                local
                claro
                borda={a.status === "inadimplente" ? "rgba(251,113,133,0.45)" : BORDA_CADERNO}
                className="p-6 sm:p-7"
              >
                {/* Linha 1: identificação + status */}
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

                {/* Linha 2: progresso do acordo */}
                <div className="mt-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 font-mono text-[13px] uppercase tracking-[0.14em]">
                    <span className="text-[var(--color-ivory-66)]">
                      Progressão do Acordo · {a.parcelasPagas}/{a.parcelasTotal}{" "}
                      parcelas de {fmtBRL(a.parcelaBrl)}
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
                  {/* Evolução: bolinhas por parcela */}
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
                              : a.status === "inadimplente" &&
                                  i < a.parcelasPagas + 2
                                ? NEON.rosa
                                : "rgba(255,255,255,0.14)",
                          boxShadow:
                            i < a.parcelasPagas ? `0 0 6px ${meta.cor}` : "none",
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Linha 3: números-chave */}
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
                      <p
                        className="mt-1 font-mono text-[17px] tabular-nums"
                        style={{ color: n.cor }}
                      >
                        {n.valor}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Linha 4: termos + vencimento + ponte financeira */}
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
                      style={{
                        color:
                          a.status === "inadimplente" ? NEON.rosa : NEON.ciano,
                      }}
                    >
                      {a.proximoVencimento}
                    </span>
                  </p>
                  <p className="text-sm leading-snug">
                    <span
                      className="font-mono text-[12px] uppercase tracking-[0.18em]"
                      style={{ color: "#2DD4BF" }}
                    >
                      Ponte Financeira ·{" "}
                    </span>
                    <span className="text-[var(--color-ivory-88)]">{a.ponte}</span>
                  </p>
                </div>

                {/* Alerta de inadimplência */}
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
          })}
        </div>

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
            aberto e, no inadimplemento, sugere a petição de retomada da
            execução pelo saldo.
          </p>
          <p className="mt-4 font-mono text-[12px] uppercase tracking-[0.2em] text-[var(--color-ivory-66)]">
            Cadastro real de acordos — próxima etapa
          </p>
        </SpotlightCard>

        {/* Link útil de volta */}
        <p className="mt-6 text-center">
          <Link
            href={`/equipe/themis${linkBase}`}
            className="font-mono text-[12px] uppercase tracking-[0.2em] text-[var(--color-gold)] underline-offset-4 hover:underline"
          >
            Ver a Ficha das Execuções
          </Link>
        </p>
      </div>
    </main>
  );
}
