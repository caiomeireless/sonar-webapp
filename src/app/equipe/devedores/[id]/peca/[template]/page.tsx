// Pagina da peca gerada — MOCK pra demo (Dia 5).
// Renderiza um "documento A4" (fundo branco, serif preta, margens) com
// timbre BP no topo e Sonar no rodape. Funciona como visual da peca
// pronta pra imprimir / salvar PDF.
//
// Quando a Sem 5 entregar a geracao real (.docx via docxtemplater ou
// PDF via react-pdf), substitui este Server Component por uma rota
// /api/pecas/[template]/[devedor_id] que devolve binario.
import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { obterDossie, type Dossie } from "@/lib/casos";
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
import { TimbreBP } from "./TimbreBP";
import { AssinaturasBP } from "./AssinaturasBP";
import { RodapeBP } from "./RodapeBP";
import { BotaoImprimir } from "./BotaoImprimir";
import { BotaoBaixarDocx } from "./BotaoBaixarDocx";

type Props = {
  params: Promise<{ id: string; template: string }>;
  searchParams?: Promise<{
    eu?: string | string[];
    caso_id?: string | string[];
    opcoes?: string | string[];
    bens?: string | string[];
  }>;
};

function umDe(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default async function PecaPage({ params, searchParams }: Props) {
  const { id, template } = await params;
  const sp = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  if (ehCliente(perfil)) redirect("/cliente/casos");
  const euDev = devEuFromParam(sp.eu);
  const eu = euDev ?? perfil?.email ?? null;
  if (!eu) redirect("/login");
  const euQuery = euDev ? `?eu=${encodeURIComponent(euDev)}` : "";

  if (!/^\d+$/.test(id)) redirect("/equipe/themis" + euQuery);
  const devedorId = Number.parseInt(id, 10);
  const dossie = await obterDossie(devedorId);
  if (!dossie) redirect("/equipe/themis" + euQuery);

  // Valida template
  const templateMeta = TEMPLATES.find((t) => t.id === template);
  if (!templateMeta) redirect(`/equipe/devedores/${devedorId}${euQuery}`);

  // Pega o caso (primeiro do devedor por default; pode-se filtrar por caso_id futuramente)
  const casoIdQuery = umDe(sp.caso_id);
  const casoIdNum = casoIdQuery ? Number.parseInt(casoIdQuery, 10) : null;
  const caso = casoIdNum
    ? dossie.casos.find((c) => c.id === casoIdNum) ?? dossie.casos[0]
    : dossie.casos[0];

  if (!caso) {
    return <SemCasoVinculado devedorId={devedorId} euQuery={euQuery} />;
  }

  // Opcoes via query string CSV: ?opcoes=sigiloso,gratuidade,reiterada
  // Se a query nao vier, usa os defaults do template.
  const opcoesQuery = umDe(sp.opcoes);
  const opcoes =
    opcoesQuery !== undefined ? parseOpcoesCSV(opcoesQuery) : opcoesPadrao(templateMeta);

  // Bens especificos via query string CSV: ?bens=1,2,3
  // Se a query nao vier, usa todos os bens do dossie.
  const bensQuery = umDe(sp.bens);
  const bensSelecionados = bensQuery ? parseBensCSV(bensQuery) : undefined;

  const peca = gerarPeca(
    template as TemplateId,
    dossie,
    caso,
    opcoes,
    bensSelecionados,
  );

  return (
    <main className="min-h-svh bg-onyx text-ivory">
      {/* Barra superior (some no print via media query inline) */}
      <BarraTopo
        devedorId={devedorId}
        euQuery={euQuery}
        templateId={template}
        opcoesCsv={opcoesQuery ?? ""}
        casoId={caso.id}
      />

      {/* Aviso de revisao — visivel apenas na UI, fora do <article>
          (nao vai pro print/docx). Instrucao Caio 2026-06-22:
          "aviso de que a peca precisa ser rigorosamente revisada". */}
      <div className="mx-auto mt-6 max-w-[920px] px-4 sm:px-8 print:hidden">
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3"
        >
          <span className="text-lg leading-none text-amber-300">⚠</span>
          <p className="font-mono text-[11px] leading-relaxed text-amber-200">
            <strong className="font-semibold">Minuta auto-gerada pelo Sonar.</strong>{" "}
            Revise rigorosamente antes do protocolo — confira citacoes,
            valores, dados dos bens e fundamentos. Complementacoes ou
            ajustes podem ser necessarios conforme o caso concreto.
          </p>
        </div>
      </div>

      {/* Documento A4 simulado */}
      <div className="mx-auto max-w-[920px] px-4 py-8 sm:px-8 sm:py-10">
        <article
          id="peca-documento"
          className="mx-auto bg-white text-[#1a1a1a] shadow-[0_30px_120px_-20px_rgba(0,0,0,0.7)]"
          style={{
            minHeight: "29.7cm",
            width: "min(100%, 21cm)",
            padding: "2.5cm 2.2cm",
            // Tipografia padrao das pecas BP (instrucao do Caio):
            // Open Sans 10pt, line-height 1.5, paragrafos com recuo 2.5cm.
            fontFamily:
              "var(--font-open-sans), 'Open Sans', Arial, sans-serif",
            fontSize: "10pt",
            lineHeight: 1.5,
          }}
        >
          {/* Timbre */}
          <TimbreBP />

          {/* Cabecalho processual — recebe 1 paragrafo em branco ACIMA via
              marginTop pra refletir a regra Caio 2026-06-22 final:
              "1 paragrafo entre timbre e endercamento". */}
          <CabecalhoProcessual peca={peca} dossie={dossie} />

          {/* Titulo da peca REMOVIDO (instrucao Caio 2026-06-22):
              as pecas BP nao tem linha "REQUERIMENTO - XYZ" entre o
              cabecalho processual e o corpo. */}

          {/* Secoes — sem space-y (instrucao Caio 2026-06-22 final:
              "tudo junto com espacamento 1,5"). lineHeight 1.5 ja separa. */}
          <div>
            {peca.secoes.map((s, i) => (
              <SecaoRender key={i} secao={s} />
            ))}
          </div>

          {/* Sao Paulo, [data] — logo apos a ultima secao, justificada,
              fluindo continuamente (sem marginTop extra). */}
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

          {/* Bloco "Anexos" REMOVIDO (instrucao Caio 2026-06-22):
              as pecas reais do BP nao tem essa lista no final;
              os documentos sao referenciados in-line no corpo. */}

          {/* Bloco de assinaturas dos 3 socios BP */}
          <AssinaturasBP />

          {/* Rodape com URL do escritorio + QR code */}
          <RodapeBP />
        </article>
      </div>
    </main>
  );
}

// ============================================================
// SUBCOMPONENTES
// ============================================================

function BarraTopo({
  devedorId,
  euQuery,
  templateId,
  opcoesCsv,
  casoId,
}: {
  devedorId: number;
  euQuery: string;
  templateId: string;
  opcoesCsv: string;
  casoId?: number;
}) {
  return (
    <div className="sticky top-[57px] z-20 border-b border-[var(--color-ivory-12)] bg-[rgba(10,12,11,0.85)] backdrop-blur-md print:hidden">
      <div className="mx-auto flex max-w-[920px] items-center justify-between gap-3 px-4 py-3 sm:px-8">
        <Link
          href={`/equipe/devedores/${devedorId}${euQuery}`}
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-gold)] transition hover:text-[var(--color-tip-glow)]"
        >
          ← voltar ao dossie
        </Link>
        <div className="flex items-center gap-3">
          {/* Fallback: HTML print (caso o user prefira PDF do navegador) */}
          <span className="hidden sm:inline-flex">
            <BotaoImprimir />
          </span>
          {/* Default: gera .docx real via API */}
          <BotaoBaixarDocx
            devedorId={devedorId}
            templateId={templateId}
            euQuery={euQuery}
            opcoesCsv={opcoesCsv}
            casoId={casoId}
          />
        </div>
      </div>
    </div>
  );
}

function CabecalhoProcessual({
  peca,
}: {
  peca: PecaGerada;
  dossie: Dossie;
}) {
  return (
    <div
      style={{
        fontSize: "10pt",
        lineHeight: 1.5,
        // 1 paragrafo em branco entre timbre e endereçamento
        // (instrucao Caio 2026-06-22 final). 1.5em = 1 linha de altura
        // com lineHeight 1.5 (= 1 paragrafo vazio).
        marginTop: "1.5em",
      }}
    >
      {/* Endereçamento ao juízo: CAIXA ALTA bold JUSTIFICADO
          (instrucao Caio 2026-06-22 — estava centralizado errado). */}
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

      {/* 7 paragrafos pulados entre endereçamento e processo
          (instrucao Caio 2026-06-22 FINAL: era 8, reduziu pra 7 — UNICA
          excecao "blanks explicitos" entre vara e numero do processo). */}
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <p
          key={i}
          style={{ margin: 0, lineHeight: 1.5, minHeight: "1.5em" }}
        >
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
  // INSTRUCAO EXPLICITA Caio 2026-06-22 final:
  //   "deixa tudo junto com espacamento de 1,5"
  // ZERO blanks aqui — nem antes/depois do titulo, nem entre items, nem
  // no fim da secao. lineHeight 1.5 + margin zero entre paragrafos.
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
            // *PEDIDO SIGILOSO*: caixa alta bold vermelho, sem indent, esquerda.
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
            // Item de lista — indent moderado, esquerda. Sem blanks entre
            // items (fluxo continuo com lineHeight 1.5).
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
            // Trecho de lei in verbis: bloco recuado 2.5cm, justificado, 9pt.
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
            // tipo === 'normal'
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

// Suporta marcacao simples **negrito** dentro do paragrafo.
function renderParagrafo(text: string) {
  const partes = text.split(/(\*\*[^*]+\*\*)/g);
  return partes.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    }
    return <span key={i}>{p}</span>;
  });
}

function SemCasoVinculado({
  devedorId,
  euQuery,
}: {
  devedorId: number;
  euQuery: string;
}) {
  return (
    <main className="mx-auto max-w-[920px] px-6 py-24 sm:px-10">
      <div className="rounded-xl border border-[var(--color-ivory-22)] bg-[var(--color-carbon)] p-10 text-center">
        <span className="eyebrow !text-[var(--color-gold)]">Sem caso</span>
        <h3 className="mt-4 font-serif text-2xl text-ivory">
          Este devedor nao tem caso vinculado
        </h3>
        <p className="mt-3 text-sm text-[var(--color-ivory-88)]">
          A peca precisa de um processo cadastrado pra preencher cabecalho e
          partes. Volta pro dossie e crie o vinculo.
        </p>
        <Link
          href={`/equipe/devedores/${devedorId}${euQuery}`}
          className="mt-6 inline-block rounded-lg border border-[var(--color-ivory-22)] bg-white/5 px-4 py-2 text-xs font-medium text-ivory transition hover:border-[var(--color-signal)] hover:text-[var(--color-signal)]"
        >
          ← Voltar ao dossie
        </Link>
      </div>
    </main>
  );
}
