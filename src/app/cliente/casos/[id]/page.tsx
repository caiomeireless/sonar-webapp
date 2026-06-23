// Dossiê patrimonial de um devedor para o cliente.
// Server Component: obterDossieParaCliente faz a checagem de visibilidade
// (só libera se o devedor pertence a um caso de credor com email_contato = eu).
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  obterDossieParaCliente,
  type Bem,
  type CasoResumo,
} from "@/lib/casos";
import type { TipoBem } from "@/lib/mock-fixtures";
import { perfilLogado } from "@/lib/perfis-server";
import { devEuFromParam } from "@/lib/dev-auth";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import {
  formatBRL,
  formatData,
  formatStatus,
  formatTempoRelativo,
} from "@/lib/format";

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

export default async function DossieClientePage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  const eu = devEuFromParam(sp.eu) ?? perfil?.email ?? null;
  if (!eu) redirect("/login");

  if (!/^\d+$/.test(id)) {
    return <AcessoNegado />;
  }
  const devedorId = Number.parseInt(id, 10);
  if (!Number.isFinite(devedorId)) {
    return <AcessoNegado />;
  }

  const dossie = await obterDossieParaCliente(devedorId, eu);
  if (!dossie) {
    return <AcessoNegado />;
  }

  const { devedor, casos, por_tipo, total_bens, valor_estimado_total_brl } = dossie;

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
            href="/cliente/casos"
            className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-gold)] transition hover:text-[var(--color-tip-glow)]"
          >
            ← Voltar
          </Link>

          <span className="eyebrow mt-6 block">Dossiê patrimonial</span>
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

          {/* 3 cards de número grande */}
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <CardNumero rotulo="Total de bens" valor={String(total_bens)} />
            <CardNumero
              rotulo="Valor estimado"
              valor={formatBRL(valor_estimado_total_brl)}
            />
            <CardNumero rotulo="Casos vinculados" valor={String(casos.length)} />
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

function AcessoNegado() {
  return (
    <main className="mx-auto max-w-[1400px] px-6 py-24 sm:px-10">
      <div className="grid place-items-center">
        <SpotlightCard className="max-w-[520px] p-10 text-center">
          <span className="eyebrow !text-[var(--color-gold)]">Restrito</span>
          <h3 className="mt-4 font-serif text-2xl text-ivory">
            Acesso não autorizado a este dossiê
          </h3>
          <p className="mt-3 text-sm text-[var(--color-ivory-88)]">
            Este devedor não consta entre os casos vinculados ao seu email de
            contato. Se isso está errado, entre em contato com o escritório.
          </p>
          <Link
            href="/cliente/casos"
            className="mt-6 inline-block rounded-lg border border-[var(--color-ivory-22)] bg-white/5 px-4 py-2 text-xs font-medium text-ivory transition hover:border-[var(--color-signal)] hover:text-[var(--color-signal)]"
          >
            ← Voltar para casos
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

function CardCasoVinculado({ caso }: { caso: CasoResumo }) {
  const status = formatStatus(caso.status);
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[var(--color-ivory-12)] bg-[rgba(5,7,6,0.5)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-mono text-xs text-[var(--color-ivory-66)]">
          {caso.numero_processo || "Sem processo cadastrado"}
        </p>
        <p className="mt-1 text-sm text-ivory">
          Crédito:{" "}
          <span className="text-[var(--color-gold)]">
            {formatBRL(caso.valor_credito_brl)}
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
