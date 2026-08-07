// CardBem glass: identificacao serif gold + chip origem + valor + grid de
// detalhes. Prop `mostrarChipOrigem` (default true) — cliente passa false
// (nao mostra a fonte da consulta).
import { formatBRL, formatData } from "@/lib/format";
import type { Bem } from "@/lib/casos";
import type { TipoBem } from "@/lib/mock-fixtures";

export function CardBem({
  bem,
  mostrarChipOrigem = true,
}: {
  bem: Bem;
  mostrarChipOrigem?: boolean;
}) {
  const titulo = identificacaoPrincipal(bem);
  const origem = origemDoBem(bem.fonte, bem.tipo);
  // Valor de veiculo vindo da tabela FIPE: declara a fonte + referencia
  // junto do numero (ex.: "Tabela FIPE · jul/2026 · ano 2019").
  const fipeRef = getStr(bem.detalhes, "fipe_referencia");
  const anoVeiculo =
    getNum(bem.detalhes, "ano_modelo") ?? getStr(bem.detalhes, "ano");
  const ehValorFipe = bem.tipo === "veiculo" && !!getStr(bem.detalhes, "fipe_codigo");
  return (
    <div className="glass p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p
            className="truncate font-serif text-lg uppercase tracking-[0.04em] text-[var(--color-gold)]"
            title={titulo}
          >
            {titulo}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {mostrarChipOrigem ? (
              <span
                className="inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.22em]"
                style={{
                  borderColor: origem.border,
                  color: origem.color,
                  backgroundColor: origem.bg,
                }}
              >
                {origem.label}
              </span>
            ) : null}
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              {formatData(bem.fonte_consultada_em)}
            </span>
          </div>
        </div>
        {bem.valor_estimado_brl !== null ? (
          <div className="shrink-0 text-right">
            <span className="whitespace-nowrap font-mono text-lg text-[var(--color-gold)]">
              {formatBRL(bem.valor_estimado_brl)}
            </span>
            {ehValorFipe ? (
              <p className="mt-0.5 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-ivory-66)]">
                Tabela FIPE{fipeRef ? ` · ${fipeRef}` : ""}
                {anoVeiculo ? ` · ano ${anoVeiculo}` : ""}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="my-4 h-px bg-[var(--color-ivory-12)]" />

      <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
        <DetalhesRender tipo={bem.tipo} detalhes={bem.detalhes} />
      </div>
    </div>
  );
}

// ============================================================
// Helpers de detalhes
// ============================================================

function Linha({
  rotulo,
  valor,
}: {
  rotulo: string;
  valor: string | number | undefined | null;
}) {
  if (valor === undefined || valor === null || valor === "") return null;
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
        {rotulo}
      </p>
      <p className="mt-1 text-sm text-ivory">{valor}</p>
    </div>
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

function getArr(
  obj: Record<string, unknown>,
  key: string,
): unknown[] | undefined {
  const v = obj[key];
  return Array.isArray(v) ? v : undefined;
}

export function identificacaoPrincipal(bem: Bem): string {
  const d = bem.detalhes;
  switch (bem.tipo) {
    case "veiculo":
      return getStr(d, "placa") ?? bem.titulo;
    case "imovel":
      return getStr(d, "matricula") ?? bem.titulo;
    case "empresa":
      return getStr(d, "cnpj") ?? getStr(d, "razao_social") ?? bem.titulo;
    case "processo_credito":
      return getStr(d, "numero_cnj") ?? bem.titulo;
    case "endereco": {
      const log = getStr(d, "logradouro");
      const cidade = getStr(d, "cidade");
      const uf = getStr(d, "uf");
      const partes = [log, [cidade, uf].filter(Boolean).join("/")].filter(
        (p) => p && p.length > 0,
      );
      return partes.length > 0 ? partes.join(" — ") : bem.titulo;
    }
    case "vinculo":
      return getStr(d, "nome") ?? bem.titulo;
    default:
      return bem.titulo;
  }
}

type ChipBemOrigem = {
  label: string;
  color: string;
  bg: string;
  border: string;
};

// Paleta de origem (padrao Caio 2026-07-02): Themis verde signal;
// Assertiva VEICULOS (frota) laranja neon; Assertiva LOCALIZE
// (enderecos/empresas do enriquecimento) roxo neon.
export function origemDoBem(fonte: string, tipoBem?: string): ChipBemOrigem {
  switch (fonte) {
    case "Themis":
      return {
        label: "VIA THEMIS",
        color: "var(--color-signal)",
        bg: "rgba(60,255,138,0.10)",
        border: "rgba(60,255,138,0.45)",
      };
    case "Assertiva":
      if (tipoBem === "veiculo") {
        return {
          label: "ASSERTIVA VEÍCULOS",
          color: "#FF9C41",
          bg: "rgba(255,156,65,0.12)",
          border: "rgba(255,156,65,0.50)",
        };
      }
      return {
        label: "ASSERTIVA LOCALIZE",
        color: "#C084FC",
        bg: "rgba(192,132,252,0.12)",
        border: "rgba(192,132,252,0.50)",
      };
    case "DataJud":
      return {
        label: "VIA DATAJUD",
        color: "var(--color-gold)",
        bg: "rgba(201,162,74,0.12)",
        border: "rgba(201,162,74,0.45)",
      };
    case "Manual":
      return {
        label: "MANUAL",
        color: "var(--color-ivory-88)",
        bg: "rgba(245,243,238,0.06)",
        border: "rgba(245,243,238,0.30)",
      };
    default:
      return {
        label: `VIA ${fonte.toUpperCase()}`,
        color: "var(--color-ivory-88)",
        bg: "rgba(245,243,238,0.06)",
        border: "rgba(245,243,238,0.22)",
      };
  }
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
      // Ano/restricao: aceita os DOIS formatos gravados no historico —
      // ano_modelo (number, seeds antigos) e ano (string, Assertiva);
      // restricoes (array) e restricao (string).
      const ano = getNum(detalhes, "ano_modelo") ?? getStr(detalhes, "ano");
      const restricoes = getArr(detalhes, "restricoes");
      const restricaoStr = getStr(detalhes, "restricao");
      const cor = getStr(detalhes, "cor");
      const chassi = getStr(detalhes, "chassi");
      const renavam = getStr(detalhes, "renavam");
      const localizacao = getStr(detalhes, "localizacao");
      const fipeCodigo = getStr(detalhes, "fipe_codigo");
      const fipeReferencia = getStr(detalhes, "fipe_referencia");
      const veiculo = [marca, modelo].filter(Boolean).join(" ");
      const restricaoTexto =
        restricoes && restricoes.length > 0
          ? restricoes.map((r) => String(r)).join("; ")
          : restricaoStr || undefined;
      return (
        <>
          <Linha rotulo="Placa" valor={placa} />
          <Linha rotulo="Veículo" valor={veiculo || undefined} />
          <Linha rotulo="Ano" valor={ano} />
          <Linha rotulo="Cor" valor={cor} />
          <Linha rotulo="Renavam" valor={renavam} />
          <Linha rotulo="Chassi" valor={chassi} />
          <Linha rotulo="Registro" valor={localizacao} />
          {fipeCodigo ? (
            <Linha
              rotulo="Tabela FIPE"
              valor={`${fipeCodigo}${fipeReferencia ? ` · ref. ${fipeReferencia}` : ""}`}
            />
          ) : null}
          <Linha rotulo="Restrições" valor={restricaoTexto} />
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
