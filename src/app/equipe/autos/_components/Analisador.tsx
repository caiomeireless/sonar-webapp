"use client";

// O quadro onde o advogado joga o capa a capa.
//
// Quem orquestra é o NAVEGADOR, de propósito: ele lê o PDF, tria, e vai
// mandando um lote por requisição. Assim cada chamada ao servidor é curta
// (cabe no tempo de função da Vercel), nada grande trafega, e o progresso
// que aparece na tela é o progresso de verdade.
//
// Cada lote é gravado no banco assim que sai, e a consolidação roda em duas
// requisições que leem do banco. Se qualquer etapa cair — rede, tempo de
// função, API —, arrastar o MESMO arquivo de novo retoma de onde parou, sem
// triar e sem reler o que já está gravado.
import { useCallback, useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";

import { SimboloSonar } from "@/components/ui/SimboloSonar";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { BordaLiquidaMetal } from "@/components/ui/BordaLiquidaMetal";
import type { PaginaTexto } from "@/lib/autos/claude";
import {
  impressaoDigital,
  lerPdf,
  montarLotes,
  montarLotesTriagem,
} from "@/lib/autos/extrair-pdf";
import type {
  CustoTokens,
  FichaAutos,
  ResultadoExtracao,
  ResultadoTriagem,
} from "@/lib/autos/tipos";

import {
  abrirAnalise,
  gravarTriagem,
  localizarAnaliseRetomavel,
  registrarErroAnalise,
} from "../actions";
import { FichaResultado } from "./FichaResultado";

type Fase =
  | "ocioso"
  | "lendo"
  | "triando"
  | "analisando"
  | "consolidando"
  | "pronto"
  | "erro";

interface Progresso {
  fase: Fase;
  rotulo: string;
  pct: number;
}

const INICIAL: Progresso = { fase: "ocioso", rotulo: "", pct: 0 };

async function postar<T>(
  url: string,
  corpo: unknown,
  sinal?: AbortSignal,
): Promise<T> {
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(corpo),
    signal: sinal,
  });
  if (!r.ok) {
    const j = (await r.json().catch(() => null)) as { erro?: string } | null;
    throw new Error(j?.erro ?? `Falha na requisição (${r.status}).`);
  }
  return (await r.json()) as T;
}

function cancelado(sinal: AbortSignal) {
  if (sinal.aborted) throw new DOMException("Cancelado", "AbortError");
}

export function Analisador({
  credores,
}: {
  credores: { id: number; nome: string }[];
}) {
  const [prog, setProg] = useState<Progresso>(INICIAL);
  const [arrastando, setArrastando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ficha, setFicha] = useState<FichaAutos | null>(null);
  const [analiseId, setAnaliseId] = useState<number | null>(null);
  const [custoBrl, setCustoBrl] = useState<number | null>(null);
  const [retomada, setRetomada] = useState<{
    id: number;
    lidos: number;
    total: number;
  } | null>(null);
  const [resumoArquivo, setResumoArquivo] = useState<{
    nome: string;
    paginas: number;
    uteis: number;
    semTexto: number;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cancelar = useCallback(() => {
    abortRef.current?.abort();
    setProg(INICIAL);
  }, []);

  const analisar = useCallback(async (arquivo: File) => {
    setErro(null);
    setFicha(null);
    setCustoBrl(null);
    setResumoArquivo(null);
    setRetomada(null);

    const controller = new AbortController();
    const sinal = controller.signal;
    abortRef.current = controller;
    let idAnalise: number | null = null;

    try {
      // ---------- 1. LEITURA (no navegador) ----------
      setProg({ fase: "lendo", rotulo: "Abrindo o arquivo", pct: 0 });
      const { totalPaginas, paginas, paginasSemTexto } = await lerPdf(
        arquivo,
        (lidas, total) =>
          setProg({
            fase: "lendo",
            rotulo: `Lendo página ${lidas.toLocaleString("pt-BR")} de ${total.toLocaleString("pt-BR")}`,
            // a leitura vale os primeiros 25% da barra
            pct: Math.round((lidas / total) * 25),
          }),
        sinal,
      );

      // ---------- 2. É O MESMO ARQUIVO DE UMA ANÁLISE PARADA? ----------
      setProg({ fase: "triando", rotulo: "Reconhecendo o arquivo", pct: 25 });
      const hash = await impressaoDigital(arquivo);
      const anterior = await localizarAnaliseRetomavel(hash);
      cancelado(sinal);

      let relevantes: number[];
      let totalLotes: number;
      const lotesLidos = new Set<number>();

      if (anterior) {
        // Pula a triagem e os lotes já gravados.
        idAnalise = anterior.id;
        setAnaliseId(anterior.id);
        relevantes = anterior.triagem.relevantes;
        totalLotes = anterior.triagem.totalLotes;
        for (const i of anterior.lotesLidos) lotesLidos.add(i);
        setRetomada({
          id: anterior.id,
          lidos: lotesLidos.size,
          total: totalLotes,
        });
      } else {
        const aberta = await abrirAnalise(arquivo.name, totalPaginas);
        if ("erro" in aberta) throw new Error(aberta.erro);
        idAnalise = aberta.id;
        setAnaliseId(aberta.id);

        // ---------- 3. TRIAGEM (modelo barato) ----------
        setProg({
          fase: "triando",
          rotulo: "Separando peças de anexos",
          pct: 26,
        });

        const relPorPagina = new Map<number, number>();
        const lotesTriagem = montarLotesTriagem(paginas);

        for (const [i, lote] of lotesTriagem.entries()) {
          cancelado(sinal);
          const { triagem } = await postar<{
            triagem: ResultadoTriagem;
            custo: CustoTokens;
          }>("/api/autos/triagem", { paginas: lote }, sinal);
          for (const p of triagem.paginas) relPorPagina.set(p.p, p.rel);
          setProg({
            fase: "triando",
            rotulo: `Separando peças de anexos (${i + 1}/${lotesTriagem.length})`,
            pct: 26 + Math.round(((i + 1) / lotesTriagem.length) * 9),
          });
        }

        // Guarda o que tem alguma relevância. Página não classificada entra
        // por precaução: é melhor analisar demais que perder uma penhora.
        relevantes = paginas
          .filter((p) => {
            const rel = relPorPagina.get(p.pagina);
            return rel === undefined ? true : rel >= 1;
          })
          .map((p) => p.pagina);

        if (relevantes.length === 0) {
          throw new Error(
            "A triagem não encontrou nenhuma peça processual neste arquivo.",
          );
        }

        const porNumeroPrevia = new Map(paginas.map((p) => [p.pagina, p]));
        totalLotes = montarLotes(
          relevantes.map((n) => porNumeroPrevia.get(n)!),
        ).length;

        const gravada = await gravarTriagem(aberta.id, {
          hash,
          relevantes,
          totalLotes,
          semTexto: paginasSemTexto,
        });
        if (!gravada.ok) throw new Error(gravada.mensagem);
      }

      const porNumero = new Map(paginas.map((p) => [p.pagina, p]));
      const uteis: PaginaTexto[] = relevantes
        .map((n) => porNumero.get(n))
        .filter((p): p is PaginaTexto => Boolean(p));

      setResumoArquivo({
        nome: arquivo.name,
        paginas: totalPaginas,
        uteis: uteis.length,
        semTexto: paginasSemTexto.length,
      });

      // ---------- 4. EXTRAÇÃO (Opus, lote a lote, gravando cada um) ----------
      const lotes = montarLotes(uteis);
      let resumoAnterior: string | undefined;
      const especiesVistas: string[] = [];

      for (const [i, lote] of lotes.entries()) {
        if (lotesLidos.has(i)) continue;
        cancelado(sinal);

        setProg({
          fase: "analisando",
          rotulo: `Analisando lote ${i + 1} de ${lotes.length} · páginas ${lote[0].pagina} a ${lote[lote.length - 1].pagina}`,
          pct: 35 + Math.round((i / lotes.length) * 50),
        });

        const { extracao } = await postar<{
          extracao: ResultadoExtracao;
          custo: CustoTokens;
          lotesLidos: number;
        }>(
          "/api/autos/lote",
          {
            analiseId: idAnalise,
            indice: i,
            totalLotes: lotes.length,
            paginas: lote,
            totalPaginas,
            resumoAnterior,
          },
          sinal,
        );
        lotesLidos.add(i);

        // Passa adiante só o essencial, para o próximo lote não repetir a
        // identificação nem perder o fio da cronologia.
        const id = extracao.identificacao;
        for (const m of extracao.medidas ?? []) {
          if (!especiesVistas.includes(m.especie)) especiesVistas.push(m.especie);
        }
        resumoAnterior = [
          id.numeroCnj ? `Processo ${id.numeroCnj}` : null,
          id.vara && id.comarca ? `${id.vara}, ${id.comarca}` : null,
          especiesVistas.length > 0
            ? `Medidas já vistas: ${especiesVistas.slice(0, 30).join(", ")}`
            : null,
        ]
          .filter(Boolean)
          .join(". ");
      }

      // ---------- 5. CONSOLIDAÇÃO, EM DUAS REQUISIÇÕES ----------
      cancelado(sinal);
      setProg({
        fase: "consolidando",
        rotulo: "Apurando os fatos: deduplicando atos e fechando a conta",
        pct: 88,
      });
      await postar<{ ok: true }>(
        "/api/autos/consolidar-fatos",
        { analiseId: idAnalise },
        sinal,
      );

      cancelado(sinal);
      setProg({
        fase: "consolidando",
        rotulo: "Julgando: prescrição, vulnerabilidades e o que falta",
        pct: 94,
      });
      const final = await postar<{ ficha: FichaAutos; custoBrl: number }>(
        "/api/autos/consolidar-juizo",
        { analiseId: idAnalise },
        sinal,
      );

      setFicha(final.ficha);
      setCustoBrl(final.custoBrl);
      setProg({ fase: "pronto", rotulo: "Análise concluída", pct: 100 });
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setProg(INICIAL);
        return;
      }
      const mensagem =
        e instanceof Error ? e.message : "Falha inesperada na análise.";
      setErro(mensagem);
      setProg({ fase: "erro", rotulo: "Análise interrompida", pct: 0 });
      if (idAnalise) void registrarErroAnalise(idAnalise, mensagem);
    } finally {
      abortRef.current = null;
    }
  }, []);

  const aoSoltar = useCallback(
    (lista: FileList | null) => {
      setArrastando(false);
      const arquivo = lista?.[0];
      if (!arquivo) return;
      if (arquivo.type !== "application/pdf") {
        setErro("O arquivo precisa ser um PDF.");
        return;
      }
      void analisar(arquivo);
    },
    [analisar],
  );

  const trabalhando =
    prog.fase === "lendo" ||
    prog.fase === "triando" ||
    prog.fase === "analisando" ||
    prog.fase === "consolidando";

  return (
    <div className="flex flex-col gap-8">
      {/* ============ QUADRO DE ARRASTAR ============ */}
      {!trabalhando && !ficha && (
        <SpotlightCard
          local
          degrade="linear-gradient(0deg, rgba(10,48,28,0.7), rgba(10,48,28,0.7))"
          className="p-6 sm:p-8"
        >
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setArrastando(true);
            }}
            onDragLeave={() => setArrastando(false)}
            onDrop={(e) => {
              e.preventDefault();
              aoSoltar(e.dataTransfer.files);
            }}
            className={`flex w-full flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-16 text-center transition ${
              arrastando
                ? "border-[var(--color-signal)] bg-[var(--color-signal-soft)]"
                : "border-[var(--color-line)] bg-[var(--color-surface-2)] hover:border-[var(--color-signal)]/60 hover:bg-[var(--color-signal-06)]"
            }`}
          >
            <Upload
              className="h-10 w-10 text-[var(--color-signal)]"
              aria-hidden="true"
            />
            <span className="font-serif text-2xl text-ivory">
              Arraste o capa a capa aqui
            </span>
            <span className="max-w-[520px] font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-88)]">
              PDF integral dos autos · pode ter milhares de páginas
            </span>
            <span className="max-w-[560px] text-sm leading-relaxed text-[var(--color-ivory-66)]">
              O arquivo é lido aqui no seu navegador e não sai da sua máquina:
              só o texto das peças sobe para análise. Se uma análise parar no
              meio, arraste o mesmo arquivo de novo que ela continua de onde
              parou.
            </span>
          </button>
        </SpotlightCard>
      )}

      {/* ============ CARREGANDO, COM O SÍMBOLO DO SONAR ============ */}
      {trabalhando && (
        <SpotlightCard local claro className="p-10 sm:p-14">
          <div className="flex flex-col items-center gap-7 text-center">
            <SimboloSonar height={130} animado />

            <p className="font-mono text-[13px] uppercase tracking-[0.3em] text-[var(--color-signal)]">
              {prog.rotulo}
            </p>

            <div className="h-1.5 w-full max-w-[560px] overflow-hidden rounded-full bg-[var(--color-ivory-12)]">
              <div
                className="h-full rounded-full bg-[var(--color-signal)] transition-[width] duration-500 ease-out"
                style={{
                  width: `${prog.pct}%`,
                  boxShadow: "0 0 14px rgba(60,255,138,0.6)",
                }}
              />
            </div>

            {retomada && (
              <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-gold)]">
                Retomando a análise #{retomada.id}: {retomada.lidos} de{" "}
                {retomada.total} lotes já estavam gravados
              </p>
            )}

            <p className="max-w-[560px] text-sm leading-relaxed text-[var(--color-ivory-66)]">
              {prog.fase === "lendo" &&
                "Lendo o arquivo no navegador, página por página."}
              {prog.fase === "triando" &&
                "Separando as peças processuais dos anexos, para não gastar análise com procuração e comprovante."}
              {prog.fase === "analisando" &&
                "Lendo as peças com atenção: cada medida encontrada fica amarrada à página de onde saiu, e cada lote é gravado assim que termina."}
              {prog.fase === "consolidando" &&
                "Juntando os lotes, deduplicando os atos repetidos, fechando a conta do débito e calculando a prescrição."}
            </p>

            <button
              type="button"
              onClick={cancelar}
              className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-40)] transition hover:text-[#FF5B5B]"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Cancelar
            </button>
          </div>
        </SpotlightCard>
      )}

      {/* ============ ERRO ============ */}
      {erro && (
        <SpotlightCard local borda="rgba(255,91,91,0.35)" className="p-6">
          <p className="font-mono text-[12px] uppercase tracking-[0.24em] text-[#FF5B5B]">
            Não deu para concluir
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-ivory-88)]">
            {erro}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-ivory-66)]">
            O que já foi lido ficou gravado. Arraste o mesmo arquivo de novo
            para continuar de onde parou.
          </p>
          <button
            type="button"
            onClick={() => {
              setErro(null);
              setProg(INICIAL);
            }}
            className="mt-5 font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-gold)] hover:underline"
          >
            Tentar de novo
          </button>
        </SpotlightCard>
      )}

      {/* ============ RESUMO DO ARQUIVO ============ */}
      {resumoArquivo && ficha && (
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[12px] uppercase tracking-[0.2em] text-[var(--color-ivory-66)]">
          <span className="inline-flex items-center gap-2 text-[var(--color-ivory-88)]">
            <FileText className="h-4 w-4" aria-hidden="true" />
            {resumoArquivo.nome}
          </span>
          <span>
            {resumoArquivo.paginas.toLocaleString("pt-BR")} páginas ·{" "}
            <strong className="text-[var(--color-signal)]">
              {resumoArquivo.uteis.toLocaleString("pt-BR")} analisadas
            </strong>
          </span>
          {resumoArquivo.semTexto > 0 && (
            <span className="text-[#F4C542]">
              {resumoArquivo.semTexto} digitalizadas sem texto
            </span>
          )}
          {custoBrl !== null && (
            <span>
              custo{" "}
              {custoBrl.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          )}
        </div>
      )}

      {/* ============ RESULTADO ============ */}
      {ficha && analiseId && (
        <FichaResultado
          ficha={ficha}
          analiseId={analiseId}
          credores={credores}
        />
      )}

      {/* Botão de novo arquivo quando já há resultado na tela. */}
      {ficha && (
        <div className="flex justify-center">
          <BordaLiquidaMetal cor="laranja" radius={14} className="inline-flex">
            <button
              type="button"
              onClick={() => {
                setFicha(null);
                setAnaliseId(null);
                setProg(INICIAL);
                setResumoArquivo(null);
                inputRef.current?.click();
              }}
              className="inline-flex h-full w-full items-center gap-2.5 rounded-[11px] bg-[rgba(255,156,65,0.10)] px-5 py-3 text-sm font-medium text-[#FF9C41] transition hover:bg-[rgba(255,156,65,0.18)]"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              Analisar outro capa a capa
            </button>
          </BordaLiquidaMetal>
        </div>
      )}

      {/* Único input de arquivo da tela — os dois botões apontam para ele. */}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        hidden
        onChange={(e) => {
          aoSoltar(e.target.files);
          // Permite arrastar o MESMO arquivo de novo (retomada): sem isto o
          // input não dispara change para um arquivo igual ao anterior.
          e.target.value = "";
        }}
      />
    </div>
  );
}
