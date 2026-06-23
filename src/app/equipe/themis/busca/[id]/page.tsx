// Wrapper Server Component da animação cinematográfica.
// Lê `modo` e `apis` da query string (vindos do Server Action
// `iniciarBuscaCombo`), busca devedor + contagem real de bens por fonte
// e passa pro Client Component AnimacaoBusca.
//
// Defaults: se ?modo= ausente, assume "lead"; se ?apis= ausente, usa o
// combo correspondente. Garante fallback seguro mesmo se a URL for
// digitada na mão.
import { redirect } from "next/navigation";
import { contarBensPorFonte, obterDossie } from "@/lib/casos";
import { perfilLogado } from "@/lib/perfis-server";
import { ehCliente } from "@/lib/perfis";
import { devEuFromParam } from "@/lib/dev-auth";
import {
  apisDeIds,
  COMBO_LEAD,
  COMBO_DOC,
  type ApiSonar,
} from "@/lib/sonar-apis";
import { AnimacaoBusca } from "./AnimacaoBusca";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    eu?: string | string[];
    modo?: string | string[];
    apis?: string | string[];
  }>;
};

function umDe(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default async function BuscaPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  if (ehCliente(perfil)) redirect("/cliente/casos");
  const euDev = devEuFromParam(sp.eu);
  const eu = euDev ?? perfil?.email ?? null;
  if (!eu) redirect("/login");

  const euQuery = euDev ? `?eu=${encodeURIComponent(euDev)}` : "";

  if (!/^\d+$/.test(id)) redirect(`/equipe/themis${euQuery}`);
  const devedorId = Number.parseInt(id, 10);
  if (!Number.isFinite(devedorId)) redirect(`/equipe/themis${euQuery}`);

  const dossie = await obterDossie(devedorId);
  if (!dossie) redirect(`/equipe/themis${euQuery}`);

  const contagem = await contarBensPorFonte(devedorId);

  // Lê modo + apis da query (com defaults seguros)
  const modoRaw = umDe(sp.modo);
  const apisRaw = umDe(sp.apis);

  const modo: "lead" | "doc" | "individual" =
    modoRaw === "doc"
      ? "doc"
      : modoRaw === "individual"
        ? "individual"
        : "lead";

  let apisAtivas: ApiSonar[];
  if (apisRaw && apisRaw.trim()) {
    apisAtivas = apisDeIds(apisRaw.split(",").map((s) => s.trim()).filter(Boolean));
  } else {
    apisAtivas = modo === "doc" ? COMBO_DOC : COMBO_LEAD;
  }

  return (
    <AnimacaoBusca
      devedorId={devedorId}
      devedorNome={dossie.devedor.nome}
      devedorTipo={dossie.devedor.tipo}
      devedorDocumento={dossie.devedor.documento}
      modo={modo}
      apisAtivas={apisAtivas}
      contagemPorFonte={contagem}
      totalBens={dossie.total_bens}
      valorEstimadoTotal={dossie.valor_estimado_total_brl}
      euQuery={euQuery}
    />
  );
}
