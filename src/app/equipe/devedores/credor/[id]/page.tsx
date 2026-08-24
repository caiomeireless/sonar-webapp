// Drill-down da carteira — NÍVEL 2: casos de UM cliente (credor).
// Reforma 25/08: mesma cara nova da Ficha do Devedor — fundo preto,
// Voltar em metal laranja, nome do CLIENTE em laranja caixa alta com
// contorno branco, cards centralizados e lista em livro-razão. Cada
// caso clica SEMPRE pra ficha do devedor.
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { obterCredorComCasos } from "@/lib/devedores";
import { perfilLogado } from "@/lib/perfis-server";
import { ehCliente } from "@/lib/perfis";
import { devEuFromParam } from "@/lib/dev-auth";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { BordaLiquidaMetal } from "@/components/ui/BordaLiquidaMetal";
import { CardNumero } from "@/app/_shared/dossie/CardNumero";
import { BORDA_CADERNO } from "@/app/_shared/dossie/SecaoFicha";
import { formatBRL } from "@/lib/format";
import { CasosCredorView } from "./CasosCredorView";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ eu?: string | string[] }>;
};

export default async function CredorDrilldownPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  if (ehCliente(perfil)) redirect("/cliente/casos");
  const eu = devEuFromParam(sp.eu) ?? perfil?.email ?? null;
  if (!eu) redirect("/login");

  const euDev = devEuFromParam(sp.eu);
  const linkBase = euDev ? `?eu=${encodeURIComponent(euDev)}` : "";

  if (!/^\d+$/.test(id)) {
    return <NaoEncontrado voltarHref={`/equipe/devedores${linkBase}`} />;
  }
  const credorId = Number.parseInt(id, 10);
  if (!Number.isFinite(credorId)) {
    return <NaoEncontrado voltarHref={`/equipe/devedores${linkBase}`} />;
  }

  const data = await obterCredorComCasos(credorId);
  if (!data) {
    return <NaoEncontrado voltarHref={`/equipe/devedores${linkBase}`} />;
  }

  const { credor, casos, totalCasos, totalDevedores, valorEstimadoTotal } =
    data;
  const docLabel = credor.tipo === "PF" ? "CPF" : "CNPJ";

  return (
    <main className="relative min-h-svh">
      <div aria-hidden="true" className="absolute inset-0 bg-black" />
      <div className="relative z-10 mx-auto max-w-[1400px] px-6 py-12 sm:px-10">
        <BordaLiquidaMetal cor="laranja" radius={14} className="inline-flex">
          <Link
            href={`/equipe/devedores${linkBase}`}
            className="inline-flex h-full w-full items-center gap-2.5 rounded-[11px] bg-[rgba(255,156,65,0.10)] px-5 py-3 text-sm font-medium text-[#FF9C41] transition hover:bg-[rgba(255,156,65,0.18)]"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            Voltar à Lista
          </Link>
        </BordaLiquidaMetal>

        {/* ============ HEADER DO CLIENTE (solto, sem card) ============ */}
        <header className="mt-10 text-center">
          <div className="inline-flex items-center gap-3">
            <span
              aria-hidden="true"
              className="inline-block h-px w-10 bg-[var(--color-signal)] opacity-60 sm:w-14"
            />
            <span className="font-mono font-medium uppercase tracking-[0.34em] text-[14px] text-[var(--color-signal)]">
              Carteira do Cliente
            </span>
            <span
              aria-hidden="true"
              className="inline-block h-px w-10 bg-[var(--color-signal)] opacity-60 sm:w-14"
            />
          </div>
          <h1
            className="mt-4 break-words font-serif text-[clamp(28px,4.2vw,52px)] font-medium uppercase leading-[1.05] tracking-[0.06em] text-[#FF9C41]"
            style={{
              WebkitTextStroke: "1px rgba(255,255,255,0.6)",
              textShadow: "0 0 16px rgba(255,156,65,0.25)",
            }}
          >
            {credor.nome}
          </h1>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <BadgeCliente
              label={credor.tipo === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}
              color="var(--color-gold)"
            />
            <BadgeCliente
              label={`${docLabel} ${credor.documento}`}
              color="var(--color-ivory-88)"
            />
            {credor.email_contato ? (
              <BadgeCliente
                label={credor.email_contato}
                color="var(--color-ivory-66)"
                semCaixaAlta
              />
            ) : null}
            {credor.telefone ? (
              <BadgeCliente
                label={credor.telefone}
                color="var(--color-ivory-66)"
              />
            ) : null}
          </div>

          {credor.observacoes ? (
            <p className="mx-auto mt-4 max-w-[720px] text-sm italic text-[var(--color-ivory-88)]">
              {credor.observacoes}
            </p>
          ) : null}
        </header>

        {/* 3 cards de número centralizados (mesmo padrão da ficha) */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <CardNumero
            rotulo={totalCasos === 1 ? "Caso" : "Casos"}
            valor={String(totalCasos)}
          />
          <CardNumero
            rotulo={
              totalDevedores === 1
                ? "Devedor Rastreado"
                : "Devedores Rastreados"
            }
            valor={String(totalDevedores)}
          />
          <CardNumero
            rotulo="Valor Estimado Total"
            valor={formatBRL(valorEstimadoTotal)}
          />
        </div>

        {/* ============ DEVEDORES DESTE CLIENTE ============ */}
        <div className="mt-14">
          {casos.length === 0 ? (
            <SpotlightCard
              local
              claro
              borda={BORDA_CADERNO}
              className="p-10 text-center"
            >
              <p className="font-serif text-2xl text-ivory">
                Nenhum caso vinculado
              </p>
              <p className="mt-3 text-sm text-[var(--color-ivory-66)]">
                Este cliente ainda não tem casos cadastrados.
              </p>
            </SpotlightCard>
          ) : (
            <>
              <h2
                className="text-center font-serif text-[clamp(26px,2.8vw,42px)] uppercase leading-[1.1] tracking-[0.08em] text-[var(--color-devedor)]"
                style={{
                  WebkitTextStroke: "1px rgba(255,255,255,0.55)",
                  textShadow: "0 0 18px rgba(220,38,38,0.4)",
                }}
              >
                Escolha o Devedor
              </h2>
              <CasosCredorView casos={casos} euQuery={linkBase} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function BadgeCliente({
  label,
  color,
  semCaixaAlta = false,
}: {
  label: string;
  color: string;
  semCaixaAlta?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[12px] tracking-[0.18em] ${
        semCaixaAlta ? "lowercase tracking-[0.06em]" : "uppercase"
      }`}
      style={{
        borderColor: color,
        color,
        backgroundColor: "rgba(255,255,255,0.03)",
      }}
    >
      {label}
    </span>
  );
}

function NaoEncontrado({ voltarHref }: { voltarHref: string }) {
  return (
    <main className="relative min-h-svh">
      <div aria-hidden="true" className="absolute inset-0 bg-black" />
      <div className="relative z-10 mx-auto max-w-[1400px] px-6 py-24 sm:px-10">
        <SpotlightCard
          local
          claro
          borda={BORDA_CADERNO}
          className="mx-auto max-w-[520px] p-10 text-center"
        >
          <h3 className="font-serif text-2xl text-ivory">
            Cliente não encontrado
          </h3>
          <p className="mt-3 text-sm text-[var(--color-ivory-88)]">
            O cliente solicitado não existe ou foi removido da carteira.
          </p>
          <Link href={voltarHref} className="btn-neon-gold mt-6">
            ← Voltar à Lista
          </Link>
        </SpotlightCard>
      </div>
    </main>
  );
}
