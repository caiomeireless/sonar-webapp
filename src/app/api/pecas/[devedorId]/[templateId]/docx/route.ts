// GET /api/pecas/[devedorId]/[templateId]/docx
// Gera a peca em formato .docx e devolve como download direto.
//
// Query params:
//   - eu=email      (dev-only bypass, ignorado em prod)
//   - caso_id=123   (escolhe um caso especifico do devedor; default: primeiro)
//   - opcoes=a,b,c  (CSV das opcoes do template; ausente = defaults)
//
// Auth:
//   - exige perfil logado (401) — incondicional, sem brecha de ambiente
//   - rejeita cliente (403)
import { NextRequest, NextResponse } from "next/server";
import { obterDossie } from "@/lib/casos";
import {
  TEMPLATES,
  dataExtenso,
  gerarPeca,
  opcoesPadrao,
  parseBensCSV,
  parseOpcoesCSV,
  type TemplateId,
} from "@/lib/pecas-templates";
import { perfilLogado } from "@/lib/perfis-server";
import { ehCliente } from "@/lib/perfis";
import { gerarDocxPeca } from "@/lib/peca-to-docx";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ devedorId: string; templateId: string }> },
) {
  // 1. Auth — incondicional. Dados pessoais LGPD nao podem vazar em nenhum ambiente.
  const perfil = await perfilLogado();
  if (!perfil) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (ehCliente(perfil)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 2. Validacao dos params da rota
  const { devedorId: devedorIdRaw, templateId } = await params;
  const devedorId = Number.parseInt(devedorIdRaw, 10);
  if (!Number.isFinite(devedorId)) {
    return NextResponse.json({ error: "Invalid devedorId" }, { status: 400 });
  }

  const templateMeta = TEMPLATES.find((t) => t.id === templateId);
  if (!templateMeta) {
    return NextResponse.json({ error: "Invalid templateId" }, { status: 400 });
  }

  // 3. Carrega o dossie + escolhe o caso
  const dossie = await obterDossie(devedorId);
  if (!dossie) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const casoIdParam = url.searchParams.get("caso_id");
  const casoIdNum = casoIdParam ? Number.parseInt(casoIdParam, 10) : null;
  const caso = casoIdNum
    ? dossie.casos.find((c) => c.id === casoIdNum) ?? dossie.casos[0]
    : dossie.casos[0];
  if (!caso) {
    return NextResponse.json(
      { error: "Devedor sem caso vinculado" },
      { status: 400 },
    );
  }

  // 4. Opcoes do template
  const opcoesParam = url.searchParams.get("opcoes");
  const opcoes =
    opcoesParam !== null
      ? parseOpcoesCSV(opcoesParam)
      : opcoesPadrao(templateMeta);

  // 4b. Bens especificos via ?bens=1,2,3 (opcional; ausente = todos)
  const bensParam = url.searchParams.get("bens");
  const bensSelecionados = bensParam ? parseBensCSV(bensParam) : undefined;

  // 5. Monta a peca e gera o .docx
  const peca = gerarPeca(
    templateId as TemplateId,
    dossie,
    caso,
    opcoes,
    bensSelecionados,
  );

  const buffer = await gerarDocxPeca({
    peca,
    dataExtenso: dataExtenso(),
    cidade: "Sao Paulo",
  });

  // 6. Nome do arquivo — Content-Disposition usa ByteString (so ASCII).
  // Precisa normalizar acentos, em-dashes (U+2014) e qualquer non-ASCII.
  function asciiSafe(s: string): string {
    return s
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "") // diacriticos (acentos)
      .replace(/[‐-―]/g, "-") // travessao, em-dash, en-dash
      .replace(/[^\x20-\x7E]/g, ""); // qualquer non-ASCII restante
  }
  const nomeTemplate = asciiSafe(templateMeta.nome).replace(/\s+/g, "-");
  const nomeDevedor = asciiSafe(dossie.devedor.nome)
    .split(" ")
    .slice(0, 2)
    .join("-")
    .replace(/[^a-zA-Z0-9_-]/g, "");
  const filename = `${nomeTemplate}-${nomeDevedor}.docx`;

  // Buffer (Node) e ArrayBuffer/Uint8Array sao aceitos como BodyInit no Next.
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
