// Preview da peça de DEMONSTRAÇÃO — João da Silva (DADOS 100% FICTÍCIOS).
// Espelho da rota real /equipe/devedores/[id]/peca/[template], mas
// alimentado pelo DOSSIE_DEMO em vez do banco. É carregada como IFRAME
// pelo Gerador de Peça demo (/equipe/devedores/demo/gerador-peca), com
// ?opcoes=...&bens=... na query — a peça é montada AO VIVO pelo mesmo
// gerarPeca() real a partir dos bens fictícios selecionados.
//
// Os subcomponentes de renderização do "documento A4" (cabeçalho
// processual, seções, **negrito**) são duplicados localmente de propósito:
// a página real não os exporta e a regra da demo é não mexer no fluxo real.
import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { perfilLogado } from "@/lib/perfis-server";
import { ehCliente } from "@/lib/perfis";
import { devEuFromParam } from "@/lib/dev-auth";
import {
  TEMPLATES,
  dataExtenso,
  gerarPeca,
  normalizarParagrafo,
  opcoesPadrao,
  parseBensCSV,
  parseOpcoesCSV,
  type PecaGerada,
  type Secao,
  type TemplateId,
} from "@/lib/pecas-templates";
import { TimbreBP } from "@/app/equipe/devedores/[id]/peca/[template]/TimbreBP";
import { AssinaturasBP } from "@/app/equipe/devedores/[id]/peca/[template]/AssinaturasBP";
import { RodapeBP } from "@/app/equipe/devedores/[id]/peca/[template]/RodapeBP";
import { BotaoImprimir } from "@/app/equipe/devedores/[id]/peca/[template]/BotaoImprimir";
import { DOSSIE_DEMO } from "../../dossie-ficticio";

type Props = {
  params: Promise<{ template: string }>;
  searchParams?: Promise<{
    eu?: string | string[];
    opcoes?: string | string[];
    bens?: string | string[];
  }>;
};

function umDe(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default async function PecaDemoPage({ params, searchParams }: Props) {
  const { template } = await params;
  const sp = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  if (ehCliente(perfil)) redirect("/cliente/casos");
  const euDev = devEuFromParam(sp.eu);
  const eu = euDev ?? perfil?.email ?? null;
  if (!eu) redirect("/login");
  const euQuery = euDev ? `?eu=${encodeURIComponent(euDev)}` : "";

  // Valida template — inválido volta pro gerador demo.
  const templateMeta = TEMPLATES.find((t) => t.id === template);
  if (!templateMeta) {
    redirect(`/equipe/devedores/demo/gerador-peca${euQuery}`);
  }

  // Caso principal fictício (1002345-67.2024.8.26.0602 — Sorocaba).
  const caso = DOSSIE_DEMO.casos[0];

  // Opções via query CSV (?opcoes=...); sem query usa os defaults.
  const opcoesQuery = umDe(sp.opcoes);
  const opcoes =
    opcoesQuery !== undefined
      ? parseOpcoesCSV(opcoesQuery)
      : opcoesPadrao(templateMeta);

  // Bens selecionados via query CSV (?bens=1,2,3); sem query entram todos.
  const bensQuery = umDe(sp.bens);
  const bensSelecionados = bensQuery ? parseBensCSV(bensQuery) : undefined;

  const peca = gerarPeca(
    template as TemplateId,
    DOSSIE_DEMO,
    caso,
    opcoes,
    bensSelecionados,
  );

  return (
    <main className="min-h-svh bg-onyx text-ivory">
      {/* Barra superior (some no print) */}
      <div className="sticky top-0 z-20 border-b border-[var(--color-ivory-12)] bg-[rgba(10,12,11,0.85)] backdrop-blur-md print:hidden">
        <div className="mx-auto flex max-w-[920px] items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <Link
            href={`/equipe/devedores/demo/gerador-peca${euQuery}`}
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-gold)] transition hover:text-[var(--color-tip-glow)]"
          >
            ← voltar ao gerador demo
          </Link>
          <div className="flex items-center gap-3">
            {/* .docx da DEMO habilitado: a API aceita devedorId "demo" e
                gera o arquivo real com o dossiê fictício. */}
            <a
              href={`/api/pecas/demo/${template}/docx${euQuery}`}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-signal)]/50 bg-[var(--color-signal)]/10 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-signal)] transition hover:bg-[var(--color-signal)]/20"
            >
              ⬇ Baixar .docx
            </a>
            <BotaoImprimir />
          </div>
        </div>
      </div>

      {/* Aviso de demonstração — só na UI, não vai pro print/PDF. */}
      <div className="mx-auto mt-6 max-w-[920px] px-4 sm:px-8 print:hidden">
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border px-4 py-3"
          style={{
            borderColor: "rgba(255,217,61,0.55)",
            backgroundColor: "rgba(255,217,61,0.10)",
          }}
        >
          <span className="text-lg leading-none" style={{ color: "#FFD93D" }}>
            ⚠
          </span>
          <p
            className="font-mono text-[12px] leading-relaxed"
            style={{ color: "#FFD93D" }}
          >
            <strong className="font-semibold">
              Demonstração — Todos os Dados Desta Peça São Fictícios.
            </strong>{" "}
            Devedor, processo, credora e bens foram inventados para
            apresentar o Gerador de Peça sem expor informação sigilosa.
          </p>
        </div>
      </div>

      {/* Documento A4 simulado — mesma tipografia das peças BP reais. */}
      <div className="mx-auto max-w-[920px] px-4 py-8 sm:px-8 sm:py-10">
        <article
          id="peca-documento"
          className="mx-auto bg-white text-[#1a1a1a] shadow-[0_30px_120px_-20px_rgba(0,0,0,0.7)]"
          style={{
            minHeight: "29.7cm",
            width: "min(100%, 21cm)",
            padding: "2.5cm 2.2cm",
            fontFamily:
              "var(--font-open-sans), 'Open Sans', Arial, sans-serif",
            fontSize: "10pt",
            lineHeight: 1.5,
          }}
        >
          <TimbreBP />
          <CabecalhoProcessual peca={peca} />
          <div>
            {peca.secoes.map((s, i) => (
              <SecaoRender key={i} secao={s} />
            ))}
          </div>
          <p
            style={{
              textAlign: "justify",
              textIndent: 0,
              margin: 0,
              lineHeight: 1.5,
              fontSize: "10pt",
            }}
          >
            Sao Paulo, {dataExtenso()}.
          </p>
          <AssinaturasBP />
          <RodapeBP />
        </article>
      </div>
    </main>
  );
}

// ============================================================
// SUBCOMPONENTES (duplicados da rota real — ver comentário do topo)
// ============================================================

function CabecalhoProcessual({ peca }: { peca: PecaGerada }) {
  return (
    <div
      style={{
        fontSize: "10pt",
        lineHeight: 1.5,
        // 1 parágrafo em branco entre timbre e endereçamento.
        marginTop: "1.5em",
      }}
    >
      <p
        style={{
          textAlign: "justify",
          fontWeight: 700,
          textTransform: "uppercase",
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {peca.vara}
      </p>

      {/* 7 parágrafos pulados entre endereçamento e número do processo. */}
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <p key={i} style={{ margin: 0, lineHeight: 1.5, minHeight: "1.5em" }}>
          &nbsp;
        </p>
      ))}

      <p
        style={{
          textAlign: "left",
          fontWeight: 700,
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        Processo Nº {peca.numeroProcesso}
      </p>
    </div>
  );
}

function SecaoRender({ secao }: { secao: Secao }) {
  const temTitulo = !!secao.titulo;
  return (
    <section>
      {temTitulo ? (
        <h2
          style={{
            fontSize: "10pt",
            fontWeight: 700,
            textTransform: "none",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {secao.titulo}
        </h2>
      ) : null}
      <div>
        {secao.paragrafos.map((p, i) => {
          const par = normalizarParagrafo(p);
          const tipo = par.tipo ?? "normal";

          let elemento: React.ReactNode;
          if (tipo === "sigiloso") {
            elemento = (
              <p
                style={{
                  textAlign: "left",
                  textIndent: 0,
                  fontWeight: 700,
                  color: "#C00",
                  textTransform: "uppercase",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {renderParagrafo(par.texto)}
              </p>
            );
          } else if (tipo === "item") {
            elemento = (
              <p
                style={{
                  textAlign: "left",
                  textIndent: "2cm",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {renderParagrafo(par.texto)}
              </p>
            );
          } else if (tipo === "citacao") {
            elemento = (
              <p
                style={{
                  marginLeft: "2.5cm",
                  textAlign: "justify",
                  textIndent: 0,
                  fontSize: "9pt",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {renderParagrafo(par.texto)}
              </p>
            );
          } else {
            elemento = (
              <p
                style={{
                  textAlign: "justify",
                  textIndent: "2.5cm",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {renderParagrafo(par.texto)}
              </p>
            );
          }

          return <React.Fragment key={i}>{elemento}</React.Fragment>;
        })}
      </div>
    </section>
  );
}

// Suporta marcação simples **negrito** dentro do parágrafo.
function renderParagrafo(text: string) {
  const partes = text.split(/(\*\*[^*]+\*\*)/g);
  return partes.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    }
    return <span key={i}>{p}</span>;
  });
}
