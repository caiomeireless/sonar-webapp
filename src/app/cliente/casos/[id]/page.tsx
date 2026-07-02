// Dossie patrimonial do devedor — VISAO DO CLIENTE.
// Server Component: obterDossieParaCliente faz a checagem de visibilidade
// (so libera se o devedor pertence a um caso de credor com email_contato = eu).
// Fallback admin/socio (defesa em profundidade) — preservado.
//
// Layout reescrito (jun/2026) pra dar PARIDADE VISUAL com o dossie do
// advogado (/equipe/devedores/[id]). Reusa _shared/dossie/* — esconde so o
// que e exclusivo do escritorio: gerador de peca, calculo, acoes de busca,
// chips de origem (THEMIS/ASSERTIVA/DATAJUD), custos das APIs,
// email do advogado responsavel, cross-reference, dashboard analitico.
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  obterDossie,
  obterDossieParaCliente,
} from "@/lib/casos";
import { perfilLogado } from "@/lib/perfis-server";
import { previewEuFromParam } from "@/lib/dev-auth";
import { formatBRL, formatData } from "@/lib/format";
import { listarMedidasPorDevedor } from "@/lib/medidas";
import { TimelineMedidas } from "@/app/equipe/devedores/[id]/TimelineMedidas";

// ---- Componentes compartilhados ----
import { HeaderDossie } from "@/app/_shared/dossie/HeaderDossie";
import { EstatisticasGrid } from "@/app/_shared/dossie/EstatisticasGrid";
import { SectionTitle } from "@/app/_shared/dossie/SectionTitle";
import { SecaoFicha, CampoFicha } from "@/app/_shared/dossie/SecaoFicha";
import { CardCasoVinculado } from "@/app/_shared/dossie/CardCasoVinculado";
import { CardBem } from "@/app/_shared/dossie/CardBem";
import { AcessoNegado } from "@/app/_shared/dossie/AcessoNegado";
import {
  TIPO_META,
  ICONES_TIPO_BEM,
  ORDEM,
} from "@/app/_shared/dossie/icones-tipo-bem";
import {
  primeiroEndereco,
  areasDoDevedor,
  somaCredito,
} from "@/app/_shared/dossie/helpers-ficha";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ eu?: string | string[] }>;
};

// Fallback de "acesso negado" — copy especifica do cliente (autorizacao
// por email_contato).
function AcessoNegadoCliente() {
  return (
    <AcessoNegado
      eyebrow="Restrito"
      titulo="Acesso não autorizado a este dossiê"
      copy="Este devedor não consta entre os casos vinculados ao seu email de contato. Se isso está errado, entre em contato com o escritório."
      voltarHref="/cliente/casos"
      voltarLabel="← Voltar para casos"
    />
  );
}

export default async function DossieClientePage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  const eu = previewEuFromParam(sp.eu, perfil) ?? perfil?.email ?? null;
  if (!eu) redirect("/login");

  if (!/^\d+$/.test(id)) {
    return <AcessoNegadoCliente />;
  }
  const devedorId = Number.parseInt(id, 10);
  if (!Number.isFinite(devedorId)) {
    return <AcessoNegadoCliente />;
  }

  let dossie = await obterDossieParaCliente(devedorId, eu);
  // Fallback admin/socio: se autorizacao por email falhar mas o perfil
  // logado tem papel privilegiado (modo visualizacao sem ?eu= correto),
  // libera o dossie direto. Defesa em profundidade do fix do CardStack.
  if (!dossie && (perfil?.papel === "admin" || perfil?.papel === "socio")) {
    dossie = await obterDossie(devedorId);
  }
  if (!dossie) {
    return <AcessoNegadoCliente />;
  }

  const { devedor, casos, por_tipo, total_bens, valor_estimado_total_brl } = dossie;

  // Medidas tomadas (timeline) — todas dos casos que o cliente ja enxerga.
  // obterDossieParaCliente filtra `casos` pelo email_contato do credor;
  // como medidas vivem dentro desses casos, nao ha vazamento.
  const medidas = await listarMedidasPorDevedor(devedorId);

  // Status do devedor — replica logica do advogado.
  const algumAtivo = casos.some((c) => c.status === "ativo");
  const statusLabel = algumAtivo ? "Ativo" : "Pausado";
  const statusColor = algumAtivo
    ? "var(--color-signal)"
    : "var(--color-ivory-66)";

  // Query string ?eu= pra preservar modo visualizacao nos links internos.
  const euParam = previewEuFromParam(sp.eu, perfil);
  const qsEu = euParam ? `?eu=${encodeURIComponent(euParam)}` : "";

  return (
    <main>
      {/* ============ HEADER ============ */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto max-w-[1400px] px-6 py-14 sm:px-10">
          {/* Top bar: Voltar (esq). Sem botao Editar pra cliente. */}
          <div className="flex items-center justify-between">
            <Link
              href="/cliente/casos"
              className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-gold)] transition hover:text-[var(--color-tip-glow)]"
            >
              ← Voltar aos Casos
            </Link>
          </div>

          {/* ============ HEADER DOSSIÊ ============ */}
          {/* dashboardHref habilitado: cliente AGORA tem dashboard analitico
              proprio em /cliente/casos/[id]/dashboard (reusa componentes da
              equipe; esconde CustosPorAPI). */}
          <HeaderDossie
            devedor={devedor}
            statusLabel={statusLabel}
            statusColor={statusColor}
            dashboardHref={`/cliente/casos/${devedor.id}/dashboard${qsEu}`}
          />

          {/* ============ ESTATÍSTICAS ============ */}
          <EstatisticasGrid
            totalBens={total_bens}
            valorEstimado={valor_estimado_total_brl}
            casosVinculados={casos.length}
          />

          {/* ============ DADOS CADASTRAIS ============ */}
          {/* Cliente nao ve: Responsavel no Escritorio, Areas Envolvidas,
              Valor Total em Credito. ChipOrigem omitido em todos os campos. */}
          <div className="mt-12">
            <SectionTitle texto="Dados Cadastrais" />

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <SecaoFicha titulo="Identificação">
                <CampoFicha
                  rotulo={devedor.tipo === "PF" ? "CPF" : "CNPJ"}
                  valor={devedor.documento}
                  mostrarChipOrigem={false}
                />
                <CampoFicha
                  rotulo={devedor.tipo === "PF" ? "RG" : "IE"}
                  valor={devedor.rg}
                  mostrarChipOrigem={false}
                />
                {devedor.tipo === "PF" ? (
                  <CampoFicha
                    rotulo="Data de Nascimento"
                    valor={
                      devedor.data_nascimento
                        ? formatData(devedor.data_nascimento)
                        : null
                    }
                    mostrarChipOrigem={false}
                  />
                ) : null}
                {devedor.tipo === "PF" ? (
                  <CampoFicha
                    rotulo="Nome da Mãe"
                    valor={devedor.nome_mae}
                    mostrarChipOrigem={false}
                  />
                ) : null}
              </SecaoFicha>

              <SecaoFicha titulo="Contato">
                <CampoFicha
                  rotulo="E-mail"
                  valor={devedor.email}
                  mostrarChipOrigem={false}
                />
                <CampoFicha
                  rotulo="Telefone"
                  valor={devedor.telefone}
                  mostrarChipOrigem={false}
                />
                <CampoFicha
                  rotulo="Redes Sociais"
                  valor={devedor.redes_sociais}
                  mostrarChipOrigem={false}
                />
              </SecaoFicha>

              <div className="md:col-span-2">
                <SecaoFicha titulo="Endereço">
                  <CampoFicha
                    rotulo="Endereço Completo"
                    valor={primeiroEndereco(dossie.bens)}
                    mostrarChipOrigem={false}
                  />
                </SecaoFicha>
              </div>

              <SecaoFicha titulo="Relacionamento">
                <CampoFicha
                  rotulo="Primeira Ocorrência"
                  valor={formatData(devedor.criado_em)}
                  mostrarChipOrigem={false}
                />
                <CampoFicha
                  rotulo="Casos Vinculados"
                  valor={String(casos.length)}
                  mostrarChipOrigem={false}
                />
              </SecaoFicha>

              <SecaoFicha titulo="Perfil Jurídico">
                <CampoFicha
                  rotulo="Áreas Envolvidas"
                  valor={areasDoDevedor(casos)}
                  mostrarChipOrigem={false}
                />
                <CampoFicha
                  rotulo="Status Geral"
                  valor={statusLabel}
                  mostrarChipOrigem={false}
                />
                <CampoFicha
                  rotulo="Valor Total em Crédito"
                  valor={formatBRL(somaCredito(casos))}
                  mostrarChipOrigem={false}
                />
              </SecaoFicha>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CASOS ============ */}
      {casos.length > 0 ? (
        <section className="border-t border-[var(--color-ivory-12)]">
          <div className="mx-auto max-w-[1400px] px-6 py-12 sm:px-10">
            <SectionTitle
              texto="Casos Vinculados"
              eyebrow="Casos Onde Este Devedor Aparece"
            />
            <div className="mt-6 space-y-3">
              {casos.map((c) => (
                <CardCasoVinculado
                  key={c.id}
                  caso={c}
                  mostrarAdvogado={false}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ============ CATEGORIAS DE BENS ============ */}
      <section className="border-t border-[var(--color-ivory-12)]">
        <div className="mx-auto max-w-[1400px] px-6 py-16 sm:px-10">
          <SectionTitle
            texto="Bens Encontrados por Categoria"
            eyebrow="Bens Encontrados"
          />

          <div className="mt-12 space-y-16">
            {ORDEM.map((tipo) => {
              const bens = por_tipo[tipo];
              const Icone = ICONES_TIPO_BEM[tipo];
              return (
                <div key={tipo}>
                  <div className="mb-6 flex items-center gap-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)]">
                      <Icone className="h-6 w-6 text-[var(--color-gold)]" />
                    </div>
                    <div>
                      <h2 className="font-serif text-2xl uppercase tracking-[0.08em] text-[var(--color-gold)]">
                        {TIPO_META[tipo].label}
                      </h2>
                      <p className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
                        {bens.length}{" "}
                        {bens.length === 1
                          ? "item encontrado"
                          : "itens encontrados"}
                      </p>
                    </div>
                  </div>

                  {bens.length === 0 ? (
                    <p className="mt-6 text-sm italic text-[var(--color-ivory-66)]">
                      Nenhum item encontrado.
                    </p>
                  ) : (
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      {bens.map((bem) => (
                        <CardBem
                          key={bem.id}
                          bem={bem}
                          mostrarChipOrigem={false}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ DOCUMENTOS API ============ */}
      {/* ============ TIMELINE ============ */}
      {/* somenteLeitura: nao mostra botao + modal "Adicionar medida". */}
      <section className="border-t border-[var(--color-ivory-12)]">
        <div className="mx-auto max-w-[1400px] px-6 py-12 sm:px-10">
          <SectionTitle
            texto="Cronologia de Medidas"
            eyebrow="Linha do Tempo"
          />
          <div className="mt-6 -mx-6 sm:-mx-10">
            <TimelineMedidas
              medidas={medidas}
              casos={casos}
              advogadoEmail={null}
              somenteLeitura
            />
          </div>
        </div>
      </section>

      {/* Cliente NAO tem: Acoes de Busca, Gerar Peca, Calculo, Cross-Reference. */}
    </main>
  );
}
