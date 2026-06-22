// Pagina de impressao do calculo atualizado (Dia 5+).
// Documento A4 estilo peca BP: timbre no topo, tabelas formatadas,
// rodape com URL + QR. window.print() do botao salva como PDF.
//
// MOCK — valores fixos representativos pra demo. Sem 5+ recebe via
// query string o snapshot do calculo gerado pelo EditorCalculo.

import { redirect } from "next/navigation";
import Link from "next/link";
import { obterDossie } from "@/lib/casos";
import { perfilLogado } from "@/lib/perfis-server";
import { ehCliente } from "@/lib/perfis";
import { devEuFromParam } from "@/lib/dev-auth";
import { TimbreBP } from "../../peca/[template]/TimbreBP";
import { RodapeBP } from "../../peca/[template]/RodapeBP";
import { BotaoImprimir } from "../../peca/[template]/BotaoImprimir";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ eu?: string | string[] }>;
};

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────

const fmtBRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatBRL(v: number): string {
  return fmtBRL.format(v);
}

function hojeBR(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

// ────────────────────────────────────────────────────────────────────────
// Mock data — valores fixos do brief
// ────────────────────────────────────────────────────────────────────────

const MOCK = {
  valorOriginal: 5_000.0,
  valorCorrigido: 10_694.0,
  juros: 15_350.0,
  honorarios: 2_604.0,
  multa: 3_151.0,
  subtotal: 31_799.0,
  total: 34_665.66,
};

const MOCK_LINHAS = [
  {
    descricao: "Verba principal",
    dataOrigem: "01/04/2012",
    valorOriginal: 3_500.0,
    valorCorrigido: 7_486.5,
  },
  {
    descricao: "Acessorios contratuais",
    dataOrigem: "01/04/2012",
    valorOriginal: 1_500.0,
    valorCorrigido: 3_207.5,
  },
];

const CONFIG = [
  { chave: "Indice de correcao monetaria", valor: "Tabela TJSP" },
  { chave: "SELIC EC 113 (a partir de 12/2021)", valor: "Sim" },
  { chave: "Calculo pro-rata", valor: "Nao" },
  { chave: "Utilizar indices negativos", valor: "Sim" },
  { chave: "Data de atualizacao", valor: hojeBR() },
];

// ────────────────────────────────────────────────────────────────────────
// Estilos das tabelas
// ────────────────────────────────────────────────────────────────────────

const INK = "#1a1a1a";
const BORDER = "rgba(26,26,26,0.15)";
const HEADER_BG = "#f3f1ec";
const ZEBRA_BG = "rgba(26,26,26,0.025)";

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "10pt",
  lineHeight: 1.5,
  color: INK,
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  fontWeight: 700,
  padding: "6pt 8pt",
  borderBottom: `1px solid ${BORDER}`,
  backgroundColor: HEADER_BG,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  fontSize: "8.5pt",
};

const tdStyle: React.CSSProperties = {
  padding: "5pt 8pt",
  borderBottom: `1px solid ${BORDER}`,
  verticalAlign: "top",
};

const tdRight: React.CSSProperties = {
  ...tdStyle,
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
};

const thRight: React.CSSProperties = {
  ...thStyle,
  textAlign: "right",
};

// ────────────────────────────────────────────────────────────────────────
// Pagina
// ────────────────────────────────────────────────────────────────────────

export default async function ImprimirCalculoPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
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

  const { devedor, casos } = dossie;
  const caso = casos[0] ?? null;
  const credor = caso?.credor.nome ?? "—";
  const processo = caso?.numero_processo ?? "—";

  const voltarHref = `/equipe/devedores/${devedorId}/calculo${euQuery}`;

  return (
    <main className="min-h-svh bg-onyx text-ivory">
      {/* Barra superior (some no print) */}
      <BarraTopo voltarHref={voltarHref} />

      {/* Documento A4 simulado */}
      <div className="mx-auto max-w-[920px] px-4 py-12 sm:px-8 sm:py-16">
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

          {/* Titulo */}
          <div style={{ marginTop: "30pt", textAlign: "center" }}>
            <h1
              style={{
                fontSize: "16pt",
                fontWeight: 700,
                letterSpacing: "0.02em",
                margin: 0,
              }}
            >
              Atualizacao de Calculo Judicial
            </h1>
            <p
              style={{
                marginTop: "8pt",
                fontSize: "10pt",
                color: INK,
                opacity: 0.75,
              }}
            >
              Processo nº {processo} ·{" "}
              <span style={{ fontWeight: 600 }}>{credor}</span> ×{" "}
              <span style={{ fontWeight: 600 }}>{devedor.nome}</span>
            </p>
            <p
              style={{
                marginTop: "4pt",
                fontSize: "9pt",
                color: INK,
                opacity: 0.6,
              }}
            >
              Emitido em {hojeBR()}
            </p>
          </div>

          {/* Secao: Configuracao */}
          <SecaoTitulo numero="01" titulo="Configuracao da atualizacao" />
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Parametro</th>
                <th style={thStyle}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {CONFIG.map((c, i) => (
                <tr
                  key={c.chave}
                  style={i % 2 === 1 ? { backgroundColor: ZEBRA_BG } : {}}
                >
                  <td style={tdStyle}>{c.chave}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{c.valor}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Secao: Valores incluidos */}
          <SecaoTitulo numero="02" titulo="Valores incluidos" />
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Descricao</th>
                <th style={thStyle}>Data origem</th>
                <th style={thRight}>Valor original</th>
                <th style={thRight}>Valor corrigido</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_LINHAS.map((l, i) => (
                <tr
                  key={l.descricao}
                  style={i % 2 === 1 ? { backgroundColor: ZEBRA_BG } : {}}
                >
                  <td style={tdStyle}>{l.descricao}</td>
                  <td style={tdStyle}>{l.dataOrigem}</td>
                  <td style={tdRight}>{formatBRL(l.valorOriginal)}</td>
                  <td style={{ ...tdRight, fontWeight: 600 }}>
                    {formatBRL(l.valorCorrigido)}
                  </td>
                </tr>
              ))}
              <tr style={{ backgroundColor: HEADER_BG }}>
                <td style={{ ...tdStyle, fontWeight: 700 }} colSpan={2}>
                  Subtotal das verbas
                </td>
                <td style={{ ...tdRight, fontWeight: 700 }}>
                  {formatBRL(MOCK.valorOriginal)}
                </td>
                <td style={{ ...tdRight, fontWeight: 700 }}>
                  {formatBRL(MOCK.valorCorrigido)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Secao: Resumo */}
          <SecaoTitulo numero="03" titulo="Resumo do calculo" />
          <table style={tableStyle}>
            <tbody>
              <ResumoTR label="Valor original" valor={MOCK.valorOriginal} />
              <ResumoTR
                label="Correcao monetaria (TJSP)"
                valor={MOCK.valorCorrigido - MOCK.valorOriginal}
                zebra
              />
              <ResumoTR
                label="Juros moratorios (Lei 14.905/24)"
                valor={MOCK.juros}
              />
              <ResumoTR
                label="Honorarios sucumbencia (art. 85 §2 CPC)"
                valor={MOCK.honorarios}
                zebra
              />
              <ResumoTR
                label="Multa art. 523 NCPC (10%)"
                valor={MOCK.multa}
              />
              <tr style={{ backgroundColor: HEADER_BG }}>
                <td style={{ ...tdStyle, fontWeight: 700 }}>Subtotal</td>
                <td style={{ ...tdRight, fontWeight: 700 }}>
                  {formatBRL(MOCK.subtotal)}
                </td>
              </tr>
              <tr
                style={{
                  backgroundColor: "rgba(201,162,74,0.12)",
                  borderTop: `2px solid ${INK}`,
                }}
              >
                <td
                  style={{
                    ...tdStyle,
                    fontWeight: 700,
                    fontSize: "11pt",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Total devido
                </td>
                <td
                  style={{
                    ...tdRight,
                    fontWeight: 700,
                    fontSize: "12pt",
                    color: "#8b6a1f",
                  }}
                >
                  {formatBRL(MOCK.total)}
                </td>
              </tr>
            </tbody>
          </table>

          <p
            style={{
              marginTop: "24pt",
              fontSize: "8.5pt",
              fontStyle: "italic",
              color: INK,
              opacity: 0.65,
              lineHeight: 1.5,
            }}
          >
            Calculo elaborado conforme tabela pratica TJSP e Lei nº
            14.905/2024 (juros pela taxa SELIC). Valores expressos em moeda
            corrente nacional. Memoria de calculo disponivel a requerimento.
          </p>

          <RodapeBP />
        </article>
      </div>
    </main>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Subcomponentes
// ────────────────────────────────────────────────────────────────────────

function BarraTopo({ voltarHref }: { voltarHref: string }) {
  return (
    <div className="sticky top-[57px] z-20 border-b border-[var(--color-ivory-12)] bg-[rgba(10,12,11,0.85)] backdrop-blur-md print:hidden">
      <div className="mx-auto flex max-w-[920px] items-center justify-between gap-3 px-4 py-3 sm:px-8">
        <Link
          href={voltarHref}
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-gold)] transition hover:text-[var(--color-tip-glow)]"
        >
          ← voltar ao editor
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)] sm:inline">
            Mock · Sem 5+ usa calculo real
          </span>
          <BotaoImprimir />
        </div>
      </div>
    </div>
  );
}

function SecaoTitulo({ numero, titulo }: { numero: string; titulo: string }) {
  return (
    <div
      style={{
        marginTop: "26pt",
        marginBottom: "8pt",
        display: "flex",
        alignItems: "baseline",
        gap: "10pt",
        borderBottom: `1px solid ${BORDER}`,
        paddingBottom: "4pt",
      }}
    >
      <span
        style={{
          fontSize: "8pt",
          fontWeight: 700,
          letterSpacing: "0.18em",
          color: "#8b6a1f",
        }}
      >
        {numero}
      </span>
      <h2
        style={{
          margin: 0,
          fontSize: "11pt",
          fontWeight: 700,
          letterSpacing: "0.02em",
          color: INK,
        }}
      >
        {titulo}
      </h2>
    </div>
  );
}

function ResumoTR({
  label,
  valor,
  zebra,
}: {
  label: string;
  valor: number;
  zebra?: boolean;
}) {
  return (
    <tr style={zebra ? { backgroundColor: ZEBRA_BG } : {}}>
      <td style={tdStyle}>{label}</td>
      <td style={tdRight}>{formatBRL(valor)}</td>
    </tr>
  );
}
