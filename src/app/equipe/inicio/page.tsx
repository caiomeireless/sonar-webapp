// Aba Início — CONSOLE SONAR (21/08): o menu radial vira o centro de um
// radar operacional (feixe varrendo + blips reais dos robôs) cercado de
// instrumentos: números da plataforma, cota Assertiva do mês e o Diário
// de Bordo com os últimos andamentos de alto sinal. Estética "monitor
// anos 70 refinado": fósforo verde, scanlines discretas, mono uppercase.
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Gauge, ScrollText } from "lucide-react";

import { perfilLogado } from "@/lib/perfis-server";
import { obterDadosConsole } from "@/lib/console-inicio";
import { CATEGORIAS_RADAR } from "@/lib/radar";
import { formatData } from "@/lib/format";

import ConsoleRadar from "./_components/ConsoleRadar";
import { NumeroTicker } from "./_components/NumeroTicker";

export const dynamic = "force-dynamic";

const DIAS_SEMANA = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

// Medidor segmentado da cota Assertiva (inspiração: Energy Meter/HUD do
// 21st, refeito em casa). Server component — zero JS no cliente.
function MedidorCota({ gasto, teto }: { gasto: number; teto: number }) {
  const SEGMENTOS = 20;
  const frac = teto > 0 ? Math.min(1, gasto / teto) : 0;
  const acesos = Math.round(frac * SEGMENTOS);
  const critico = frac >= 0.85;
  return (
    <div>
      <div className="flex items-end justify-between">
        <span className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
          Cota Assertiva do Mês
        </span>
        <span
          className={`font-mono text-[13px] tabular-nums ${critico ? "text-[var(--color-devedor)]" : "text-[var(--color-gold)]"}`}
        >
          {gasto.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}{" "}
          / R$ {teto}
        </span>
      </div>
      <div className="mt-3 flex gap-1" role="img" aria-label={`Consumo de ${Math.round(frac * 100)}% da cota`}>
        {Array.from({ length: SEGMENTOS }, (_, i) => {
          const aceso = i < acesos;
          const cor = !aceso
            ? "bg-[var(--color-surface-2)]"
            : critico && i >= SEGMENTOS * 0.7
              ? "bg-[var(--color-devedor)]"
              : "bg-[var(--color-gold)]";
          return (
            <span
              key={i}
              className={`h-5 flex-1 rounded-[2px] ${cor} ${aceso ? "shadow-[0_0_6px_rgba(201,162,74,0.45)]" : ""}`}
            />
          );
        })}
      </div>
    </div>
  );
}

export default async function InicioPage() {
  const perfil = await perfilLogado();
  if (!perfil && process.env.NODE_ENV === "production") redirect("/login");

  const nome = perfil?.nome?.trim() || perfil?.email || "Equipe";
  const primeiroNome = nome.split(" ")[0];
  const dados = await obterDadosConsole();

  const agora = new Date();
  const dataLonga = `${DIAS_SEMANA[agora.getDay()]}, ${formatData(agora.toISOString())}`;

  const rotuloCategoria = new Map(
    CATEGORIAS_RADAR.map((c) => [c.chave, c.rotulo]),
  );

  const KPIS: { rotulo: string; valor: number; formato: "brl" | "int" }[] = [
    { rotulo: "Patrimônio Localizado", valor: dados.patrimonioBrl, formato: "brl" },
    { rotulo: "Bens em Rastreio", valor: dados.totalBens, formato: "int" },
    { rotulo: "Casos Ativos", valor: dados.casosAtivos, formato: "int" },
    { rotulo: "Capturas em 7 Dias", valor: dados.capturas7d, formato: "int" },
  ];

  return (
    <main className="mx-auto max-w-[1560px] px-6 py-8 sm:px-10">
      {/* ===== Cabeçalho do console ===== */}
      <header className="mb-8 flex flex-col items-center gap-1 text-center">
        <p className="font-mono text-[12px] uppercase tracking-[0.32em] text-[var(--color-signal)]">
          Console Sonar · {dataLonga}
        </p>
        <h1 className="font-serif text-[clamp(20px,2.4vw,30px)] text-ivory">
          Na escuta, {primeiroNome}.
        </h1>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(260px,330px)_1fr_minmax(290px,360px)]">
        {/* ===== Coluna esquerda: números + cota ===== */}
        <div className="order-2 flex flex-col gap-4 lg:order-1">
          {KPIS.map((k) => (
            <section key={k.rotulo} className="glass-flat crt-scan p-5">
              <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
                {k.rotulo}
              </p>
              <p className="mt-1 font-serif text-[clamp(24px,2vw,34px)] leading-tight text-[var(--color-signal)]">
                <NumeroTicker valor={k.valor} formato={k.formato} />
              </p>
            </section>
          ))}
          <section className="glass-flat crt-scan p-5">
            <div className="mb-1 flex items-center gap-2 text-[var(--color-gold)]">
              <Gauge className="h-4 w-4" aria-hidden="true" />
            </div>
            <MedidorCota gasto={dados.gastoMesBrl} teto={dados.tetoMesBrl} />
          </section>
        </div>

        {/* ===== Centro: o radar ===== */}
        <div className="order-1 lg:order-2">
          <ConsoleRadar
            nome={nome}
            fotoUrl={perfil?.fotoUrl ?? null}
            blips={dados.blips}
          />
          <p className="mt-3 text-center font-mono text-[12px] uppercase tracking-[0.24em] text-[var(--color-ivory-40)]">
            {dados.blips.length > 0
              ? `${dados.blips.length} contatos no mostrador · clique num ponto pra abrir o Radar`
              : "Sem contatos novos no mostrador"}
          </p>
        </div>

        {/* ===== Coluna direita: Diário de Bordo ===== */}
        <section className="order-3 glass-flat crt-scan flex flex-col p-5">
          <div className="flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-[var(--color-gold)]" aria-hidden="true" />
            <h2 className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              Diário de Bordo
            </h2>
          </div>

          {dados.diario.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--color-ivory-66)]">
              Nada de alto sinal capturado ainda. Os robôs varrem os
              tribunais às terças e sextas.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {dados.diario.map((a) => (
                <li
                  key={a.id}
                  className="border-b border-[var(--color-line)] pb-3 last:border-b-0 last:pb-0"
                >
                  <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--color-signal)]">
                    {a.data_andamento ? formatData(a.data_andamento) : "—"} ·{" "}
                    {rotuloCategoria.get(a.categoria) ?? a.categoria}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-[var(--color-ivory-88)]">
                    {a.descricao}
                  </p>
                  {a.devedor && (
                    <p className="mt-0.5 truncate font-mono text-[12px] text-[var(--color-ivory-66)]">
                      {a.devedor.nome}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}

          <Link
            href="/equipe/radar"
            className="btn-neon-signal mt-5 self-center"
          >
            Abrir Radar Completo
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </main>
  );
}
