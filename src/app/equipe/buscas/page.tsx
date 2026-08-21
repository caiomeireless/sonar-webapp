// Central de Buscas DISSOLVIDA (Caio, 21/08): os cards viraram abas
// principais — Banco de Dossiês (/equipe/devedores) e Avaliação
// Pré-Processual (/equipe/consultas). A rota fica só como redirect pra
// não quebrar link antigo/favorito — preservando o ?eu= de dev.
import { redirect } from "next/navigation";

type Props = {
  searchParams?: Promise<{ eu?: string | string[] }>;
};

export default async function CentralDeBuscasRedirect({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const eu = Array.isArray(params.eu) ? params.eu[0] : params.eu;
  redirect(eu ? `/equipe/devedores?eu=${encodeURIComponent(eu)}` : "/equipe/devedores");
}
