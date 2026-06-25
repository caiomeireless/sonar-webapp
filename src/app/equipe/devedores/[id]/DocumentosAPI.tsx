"use client";

// Cards de documentos puxados via API. Cada card mostra um documento
// borrado por padrão; o advogado clica em "Revelar" pra ver o conteúdo
// (e gastar o crédito). Depois pode baixar PDF. Mock visual — quando
// integrar com Assertiva/Receita/ARISP/etc, plugar aqui.
import { Download, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type Doc = {
  id: string;
  titulo: string;
  fonte: string;
  custoBrl: number;
  conteudo: string;
};

export function DocumentosAPI({
  devedorNome,
  esconderCustos = false,
}: {
  devedorNome: string;
  esconderCustos?: boolean;
}) {
  const [revelados, setRevelados] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setRevelados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const docs: Doc[] = [
    {
      id: "comp-end",
      titulo: "Comprovante de Endereço",
      fonte: "Assertiva",
      custoBrl: 2.4,
      conteudo:
        "Rua das Acácias, 1234 · Belo Horizonte/MG · CEP 30000-000\nÚltima atualização: 12/06/2026\nFonte: Assertiva — base de dados Receita Federal\nValidação: 98% confiável",
    },
    {
      id: "cnd-receita",
      titulo: "Certidão Negativa de Débitos Federais",
      fonte: "Receita Federal",
      custoBrl: 3.8,
      conteudo:
        "CERTIDÃO POSITIVA COM EFEITOS DE NEGATIVA\nNº 2026.04.12.0000123\nValidade: 90 dias\nDébitos parcelados: R$ 14.230,00\nSituação fiscal: regular sob parcelamento",
    },
    {
      id: "matricula",
      titulo: "Matrícula Imóvel (ARISP)",
      fonte: "ARISP",
      custoBrl: 12.5,
      conteudo:
        "Matrícula nº 98.765\n2º Oficial de Registro de Imóveis de São Paulo\nÁrea total: 320m²\nProprietário desde 03/05/2018\nValor de cadastro: R$ 1.450.000\nÔnus: hipoteca 1ª grau Banco do Brasil",
    },
    {
      id: "ficha-bdc",
      titulo: "Ficha Cadastral Completa",
      fonte: "BigDataCorp",
      custoBrl: 4.8,
      conteudo:
        "Renda estimada: R$ 18.500/mês\nScore: 720/1000\nProfissão: Engenheiro Civil\nVínculo trabalhista ativo desde 2019\nReceita declarada IR 2024: R$ 248.000\nPatrimônio aparente: R$ 2.1M",
    },
    {
      id: "ata-junta",
      titulo: "Ata de Constituição (Junta SP)",
      fonte: "Junta Comercial SP",
      custoBrl: 6.2,
      conteudo:
        "Sociedade Limitada\nCapital social: R$ 500.000 (integralizado)\nSócios:\n- João Silva (51%)\n- Maria Souza (49%)\nAtividade principal: comércio varejista\nÚltima alteração: 14/03/2025",
    },
    {
      id: "ir-infojud",
      titulo: "Última Declaração IR (INFOJUD)",
      fonte: "INFOJUD",
      custoBrl: 0,
      conteudo:
        "DECLARAÇÃO 2024 (ano-base 2023)\nRendimentos tributáveis: R$ 248.000\nRendimentos isentos: R$ 18.500\nBens declarados: R$ 1.890.000\nIRPF apurado: R$ 67.420\nRestituição/imposto a pagar: R$ 12.840 (paga)",
    },
  ];

  function formatCusto(brl: number): string {
    if (brl === 0) return "Grátis";
    return `R$ ${brl.toFixed(2).replace(".", ",")}`;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {docs.map((doc) => {
        const revelado = revelados.has(doc.id);
        const custoLabel = formatCusto(doc.custoBrl);
        return (
          <div
            key={doc.id}
            className="glass relative min-h-[260px] overflow-hidden rounded-2xl p-5"
          >
            {/* Header: titulo + chip fonte + custo */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-serif text-base text-[var(--color-gold)]">
                  {doc.titulo}
                </h3>
                <span className="mt-2 inline-flex items-center rounded-full border border-[var(--color-signal)]/45 bg-[rgba(60,255,138,0.10)] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-signal)]">
                  {doc.fonte}
                </span>
              </div>
              {esconderCustos ? null : (
                <span className="whitespace-nowrap font-mono text-xs tabular-nums uppercase tracking-[0.18em] text-[var(--color-gold)]">
                  {custoLabel}
                </span>
              )}
            </div>

            {/* Botão Ocultar (canto superior direito, só quando revelado) */}
            {revelado ? (
              <button
                type="button"
                onClick={() => toggle(doc.id)}
                aria-label="Ocultar documento"
                className="absolute right-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-md border border-[var(--color-ivory-22)] bg-[rgba(5,7,6,0.8)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-88)] transition hover:border-[var(--color-signal)] hover:text-[var(--color-signal)]"
              >
                <EyeOff className="h-3 w-3" />
                Ocultar
              </button>
            ) : null}

            {/* Conteúdo do documento */}
            <div className="mt-5">
              <pre
                className={
                  revelado
                    ? "max-h-[180px] overflow-y-auto whitespace-pre-line font-sans text-sm leading-relaxed text-ivory"
                    : "pointer-events-none select-none whitespace-pre-line font-sans text-sm leading-relaxed text-ivory blur-md filter"
                }
                aria-hidden={revelado ? undefined : "true"}
              >
                {doc.conteudo}
              </pre>
            </div>

            {/* Overlay quando NÃO revelado */}
            {!revelado ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-onyx/40 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => toggle(doc.id)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-signal)]/85 px-4 py-2 font-mono text-xs uppercase tracking-[0.22em] text-[var(--color-onyx)] transition hover:bg-[var(--color-signal)]"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {esconderCustos ? "Revelar" : `Revelar (${custoLabel})`}
                </button>
              </div>
            ) : null}

            {/* Botão Download (sempre visível, canto inferior direito) */}
            <button
              type="button"
              aria-label={`Baixar PDF do documento ${doc.titulo} de ${devedorNome}`}
              className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-1.5 rounded-md border border-[var(--color-signal)]/45 bg-[rgba(5,7,6,0.7)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-signal)] transition hover:border-[var(--color-signal)] hover:bg-[rgba(60,255,138,0.10)]"
            >
              <Download className="h-3 w-3" />
              PDF
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default DocumentosAPI;
