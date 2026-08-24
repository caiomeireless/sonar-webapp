// FICHA DE DEMONSTRAÇÃO — João da Silva (DADOS 100% FICTÍCIOS).
// Pedido do Caio 25/08 (véspera de reunião): os dossiês reais são
// sigilosos, então esta página recria a Ficha do Devedor inteira com
// dados inventados, bem recheada e colorida, pra apresentar a
// plataforma sem expor cliente nenhum. NADA aqui toca o banco.
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Briefcase,
  Car,
  MapPin,
  Scale,
  Users2,
  TriangleAlert,
} from "lucide-react";

import { perfilLogado } from "@/lib/perfis-server";
import { ehCliente } from "@/lib/perfis";
import { devEuFromParam } from "@/lib/dev-auth";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { BordaLiquidaMetal } from "@/components/ui/BordaLiquidaMetal";
import { HeaderDossie } from "@/app/_shared/dossie/HeaderDossie";
import { EstatisticasGrid } from "@/app/_shared/dossie/EstatisticasGrid";
import {
  SecaoFicha,
  CampoFicha,
  BORDA_CADERNO,
} from "@/app/_shared/dossie/SecaoFicha";

type Props = { searchParams?: Promise<{ eu?: string | string[] }> };

const NEON = {
  verde: "#3CFF8A",
  laranja: "#FF9C41",
  ciano: "#38BDF8",
  violeta: "#C084FC",
  amarelo: "#FFD93D",
  rosa: "#FB7185",
  turquesa: "#2DD4BF",
};

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

function AvisoFicticio() {
  return (
    <div
      className="flex items-center justify-center gap-3 rounded-2xl border px-5 py-3.5"
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
        Demonstração — Todos os Dados Desta Ficha São Fictícios
      </p>
    </div>
  );
}

function ChipDemo({ label, cor }: { label: string; cor: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[12px] uppercase tracking-[0.16em]"
      style={{
        color: cor,
        borderColor: `color-mix(in srgb, ${cor} 50%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${cor} 10%, transparent)`,
      }}
    >
      {label}
    </span>
  );
}

// Card de bem fictício — mesma linguagem visual do CardBem real.
function BemDemo({
  titulo,
  detalhe,
  valor,
  fonte,
  corFonte,
}: {
  titulo: string;
  detalhe: string;
  valor: string | null;
  fonte: string;
  corFonte: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-ivory-12)] bg-[rgba(10,12,11,0.75)] p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-lg font-medium leading-snug text-ivory">{titulo}</p>
        {valor ? (
          <p
            className="shrink-0 font-mono text-lg tabular-nums"
            style={{ color: NEON.verde }}
          >
            {valor}
          </p>
        ) : null}
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-ivory-66)]">
        {detalhe}
      </p>
      <div className="mt-3">
        <ChipDemo label={fonte} cor={corFonte} />
      </div>
    </div>
  );
}

function CategoriaDemo({
  Icone,
  cor,
  titulo,
  sub,
  children,
}: {
  Icone: React.ComponentType<{ className?: string }>;
  cor: string;
  titulo: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <SpotlightCard local claro borda={BORDA_CADERNO} className="p-6 sm:p-8">
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
          <h3
            className="font-serif text-2xl uppercase tracking-[0.08em]"
            style={{ color: cor }}
          >
            {titulo}
          </h3>
          <p className="font-mono text-[13px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
            {sub}
          </p>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </SpotlightCard>
  );
}

export default async function FichaDemoPage({ searchParams }: Props) {
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
      <div className="relative z-10 mx-auto max-w-[1400px] px-6 py-12 sm:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <BordaLiquidaMetal cor="laranja" radius={14} className="inline-flex">
            <Link
              href={`/equipe/devedores${linkBase}`}
              className="inline-flex h-full w-full items-center gap-2.5 rounded-[11px] bg-[rgba(255,156,65,0.10)] px-5 py-3 text-sm font-medium text-[#FF9C41] transition hover:bg-[rgba(255,156,65,0.18)]"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              Voltar à Lista
            </Link>
          </BordaLiquidaMetal>
          <div className="min-w-0 flex-1">
            <AvisoFicticio />
          </div>
        </div>

        {/* ============ HEADER ============ */}
        <HeaderDossie
          devedor={{
            id: 0,
            nome: "João da Silva",
            tipo: "PF",
            documento: "123.456.789-00",
            criado_em: "2024-03-12",
          }}
          statusLabel="Ativo"
          statusColor="var(--color-signal)"
          processos={3}
          ultimaMedidaEm="2026-08-14"
        />

        {/* ============ ESTATÍSTICAS ============ */}
        <EstatisticasGrid
          totalBens={12}
          valorEstimado={2415380}
          casosVinculados={3}
        />

        {/* ============ DADOS PARA LOCALIZAÇÃO ============ */}
        <div className="mt-12">
          <TituloSetor texto="Dados para Localização" />
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <SecaoFicha titulo="Identificação">
              <CampoFicha rotulo="CPF" valor="123.456.789-00" origem="VIA THEMIS" />
              <CampoFicha rotulo="RG" valor="12.345.678-9 SSP/SP" origem="VIA ASSERTIVA" />
              <CampoFicha rotulo="Data de Nascimento" valor="14/07/1978" origem="VIA ASSERTIVA" />
              <CampoFicha rotulo="Nome da Mãe" valor="Maria Aparecida da Silva" origem="VIA THEMIS" />
            </SecaoFicha>
            <SecaoFicha titulo="Contato">
              <CampoFicha rotulo="E-mail" valor="joaodasilva.demo@exemplo.com.br" origem="VIA ASSERTIVA" />
              <CampoFicha rotulo="Telefone" valor="(15) 99876-5432" origem="VIA ASSERTIVA" />
              <CampoFicha rotulo="Endereço" valor="Rua das Palmeiras, 123 — Jardim Europa, Sorocaba/SP" origem="VIA ASSERTIVA" />
              <CampoFicha rotulo="Redes Sociais" valor="@joaodasilva.demo" origem="MANUAL" />
            </SecaoFicha>
          </div>

          {/* Intimação/Citação — exemplo preenchido */}
          <SpotlightCard local claro borda={BORDA_CADERNO} className="mt-5 p-6 sm:p-7">
            <h3 className="font-mono text-[15px] font-semibold uppercase tracking-[0.28em]" style={{ color: NEON.turquesa }}>
              Intimação / Citação no Endereço
            </h3>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <ChipDemo label="Êxito na Intimação" cor={NEON.verde} />
              <span className="text-sm text-[var(--color-ivory-88)]">
                Citado pessoalmente na Rua das Palmeiras, 123 em 22/05/2026 —
                AR positivo anexado.
              </span>
              <ChipDemo label="AR-2026-0522.pdf" cor={NEON.ciano} />
            </div>
          </SpotlightCard>
        </div>

        {/* ============ DADOS PROCESSUAIS ============ */}
        <div className="mt-12">
          <TituloSetor texto="Dados Processuais" />
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <SecaoFicha titulo="Relacionamento">
              <CampoFicha rotulo="Responsável no Escritório" valor="Dra. Ana Beatriz Campos" origem="MANUAL" />
              <CampoFicha rotulo="Primeira Ocorrência" valor="12/03/2024" origem="MANUAL" />
              <CampoFicha rotulo="Casos Vinculados" valor="3" origem="MANUAL" />
            </SecaoFicha>
            <SecaoFicha titulo="Perfil Jurídico">
              <CampoFicha rotulo="Áreas Envolvidas" valor="Cível · Execução de Título" origem="MANUAL" />
              <CampoFicha rotulo="Status Geral" valor="Ativo" origem="MANUAL" />
              <CampoFicha rotulo="Débito Judicial Total" valor="R$ 1.847.520,44" origem="VIA THEMIS" />
            </SecaoFicha>
          </div>

          <SpotlightCard local claro borda={BORDA_CADERNO} className="mt-5 p-6 sm:p-8">
            <h3 className="font-mono text-[15px] font-semibold uppercase tracking-[0.28em] text-[var(--color-gold)]">
              Processos Vinculados · 3
            </h3>
            <div className="mt-5 space-y-3">
              {[
                {
                  numero: "1002345-67.2024.8.26.0602",
                  vara: "3ª Vara Cível de Sorocaba",
                  credor: "Distribuidora Modelo Ltda.",
                  debito: "R$ 984.310,20",
                  fase: "Cumprimento de Sentença",
                },
                {
                  numero: "0007890-12.2023.8.26.0100",
                  vara: "12ª Vara Cível Central — SP",
                  credor: "Banco Exemplo S/A",
                  debito: "R$ 623.480,00",
                  fase: "Execução de Título Extrajudicial",
                },
                {
                  numero: "1009876-54.2025.8.26.0602",
                  vara: "1ª Vara Cível de Sorocaba",
                  credor: "Condomínio Solar das Águas",
                  debito: "R$ 239.730,24",
                  fase: "Execução",
                },
              ].map((p) => (
                <div
                  key={p.numero}
                  className="grid items-center gap-x-6 gap-y-2 rounded-xl border border-[var(--color-ivory-12)] bg-[rgba(10,12,11,0.75)] px-5 py-4 sm:grid-cols-[minmax(0,1fr)_180px]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-[15px] text-ivory">
                      {p.numero}
                    </p>
                    <p className="mt-1 truncate font-mono text-[12px] uppercase tracking-[0.08em]">
                      <span style={{ color: NEON.laranja }}>{p.credor}</span>
                      <span className="text-[var(--color-ivory-66)]">
                        {" "}
                        · {p.vara} · {p.fase}
                      </span>
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-mono text-[16px] tabular-nums text-ivory">
                      {p.debito}
                    </p>
                    <p className="mt-0.5 font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--color-ivory-66)]">
                      Execução Atualizada
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </SpotlightCard>
        </div>

        {/* ============ BENS ENCONTRADOS ============ */}
        <div className="mt-12">
          <TituloSetor texto="Bens Encontrados" />
          <div className="mt-8 space-y-6">
            <CategoriaDemo Icone={Car} cor={NEON.laranja} titulo="Veículos" sub="2 itens encontrados">
              <div className="grid gap-4 md:grid-cols-2">
                <BemDemo
                  titulo="Toyota Hilux SRX 4x4 2022"
                  detalhe="Placa DEM-0A22 · Diesel · Sem restrição de venda · Tabela FIPE ref. 08/2026"
                  valor="R$ 248.900,00"
                  fonte="Assertiva Veículos"
                  corFonte={NEON.laranja}
                />
                <BemDemo
                  titulo="Honda Civic Touring 2020"
                  detalhe="Placa DEM-0B20 · Alienação fiduciária baixada · Tabela FIPE ref. 08/2026"
                  valor="R$ 132.400,00"
                  fonte="Assertiva Veículos"
                  corFonte={NEON.laranja}
                />
              </div>
            </CategoriaDemo>

            <CategoriaDemo Icone={Building2} cor={NEON.ciano} titulo="Imóveis" sub="2 itens · pesquisa manual RI Digital registrada">
              <div className="grid gap-4 md:grid-cols-2">
                <BemDemo
                  titulo="Apartamento 142 m² — Jardim Vergueiro, Sorocaba/SP"
                  detalhe="Matrícula 45.678 do 2º CRI de Sorocaba · Livre de ônus · Matrícula anexada (PDF)"
                  valor="R$ 890.000,00"
                  fonte="RI Digital · Manual"
                  corFonte={NEON.ciano}
                />
                <BemDemo
                  titulo="Terreno 480 m² — Cond. Reserva Ipanema"
                  detalhe="Matrícula 12.309 do 1º CRI de Sorocaba · Penhora averbada em 06/2026"
                  valor="R$ 410.000,00"
                  fonte="RI Digital · Manual"
                  corFonte={NEON.ciano}
                />
              </div>
            </CategoriaDemo>

            <CategoriaDemo Icone={Briefcase} cor={NEON.violeta} titulo="Participações Societárias" sub="1 item encontrado">
              <BemDemo
                titulo="Silva Comércio de Materiais Ltda. — 50% das quotas"
                detalhe="CNPJ 12.345.678/0001-90 · Capital social R$ 400.000,00 · Sócio-administrador"
                valor="R$ 200.000,00"
                fonte="Assertiva Localize"
                corFonte={NEON.violeta}
              />
            </CategoriaDemo>

            <CategoriaDemo Icone={Scale} cor={NEON.amarelo} titulo="Processos Onde é Credor" sub="1 item · Última varredura 23/08/2026">
              <BemDemo
                titulo="Crédito em ação de despejo — 2ª Vara Cível de Votorantim"
                detalhe="Processo 1000111-22.2024.8.26.0672 · Penhora no rosto dos autos requerida"
                valor="R$ 86.500,00"
                fonte="Robô e-SAJ"
                corFonte={NEON.amarelo}
              />
            </CategoriaDemo>

            <CategoriaDemo Icone={MapPin} cor={NEON.turquesa} titulo="Endereços Confirmados" sub="3 itens · mandado cumprido">
              <div className="grid gap-4 md:grid-cols-2">
                <BemDemo
                  titulo="Rua das Palmeiras, 123 — Jardim Europa, Sorocaba/SP"
                  detalhe="Residencial · Citação positiva em 22/05/2026 · Mandado de avaliação e penhora CUMPRIDO POSITIVO (certidão anexada)"
                  valor={null}
                  fonte="Assertiva + Oficial de Justiça"
                  corFonte={NEON.turquesa}
                />
                <BemDemo
                  titulo="Av. Ipanema, 2.500 — sala 34, Sorocaba/SP"
                  detalhe="Comercial (sede da Silva Comércio) · Diligência agendada"
                  valor={null}
                  fonte="Assertiva Localize"
                  corFonte={NEON.turquesa}
                />
              </div>
            </CategoriaDemo>

            <CategoriaDemo Icone={Users2} cor={NEON.rosa} titulo="Vínculos Familiares" sub="2 itens encontrados">
              <div className="grid gap-4 md:grid-cols-2">
                <BemDemo
                  titulo="Maria Fernanda da Silva — cônjuge"
                  detalhe="Comunhão parcial de bens · Sócia em 25% da Silva Comércio"
                  valor={null}
                  fonte="Assertiva Localize"
                  corFonte={NEON.rosa}
                />
                <BemDemo
                  titulo="Pedro Henrique da Silva — filho"
                  detalhe="Veículo Jeep Renegade 2023 registrado no CPF (investigar doação)"
                  valor={null}
                  fonte="Assertiva Localize"
                  corFonte={NEON.rosa}
                />
              </div>
            </CategoriaDemo>
          </div>
        </div>

        {/* ============ MEDIDAS E RESULTADOS ============ */}
        <div className="mt-12">
          <TituloSetor texto="Medidas e Resultados" />
          <SpotlightCard local claro borda={BORDA_CADERNO} className="mt-6 p-6 sm:p-8">
            <ul className="divide-y divide-[rgba(201,162,74,0.14)]">
              {[
                { data: "05/04/2025", titulo: "SISBAJUD — bloqueio de R$ 42.318,90", chip: "Positivo", cor: NEON.verde },
                { data: "18/06/2025", titulo: "RENAJUD — restrição nos 2 veículos", chip: "Positivo", cor: NEON.verde },
                { data: "02/09/2025", titulo: "INFOJUD — declarações obtidas", chip: "Positivo", cor: NEON.verde },
                { data: "11/02/2026", titulo: "Penhora do apartamento (matrícula 45.678)", chip: "Efetivada", cor: NEON.amarelo },
                { data: "14/08/2026", titulo: "Avaliação do imóvel pelo oficial de justiça", chip: "Aguardando", cor: NEON.ciano },
              ].map((m) => (
                <li key={m.data} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3.5 first:pt-0 last:pb-0">
                  <span className="font-mono text-[13px] uppercase tracking-[0.16em]" style={{ color: NEON.verde }}>
                    {m.data}
                  </span>
                  <span className="min-w-0 flex-1 text-lg text-ivory">{m.titulo}</span>
                  <ChipDemo label={m.chip} cor={m.cor} />
                </li>
              ))}
            </ul>
          </SpotlightCard>
        </div>

        <div className="mt-12">
          <AvisoFicticio />
        </div>
      </div>
    </main>
  );
}
