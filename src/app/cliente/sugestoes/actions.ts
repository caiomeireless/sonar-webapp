// Server Action — recebe o formulário de sugestão/dúvida do cliente e
// dispara o e-mail pra caio@bpadvogados.com.br (Resend, se disponível).
// Persistência: in-memory por enquanto, migrar pra Supabase quando criarmos
// tabela `sugestoes`.
"use server";

import { redirect } from "next/navigation";

import { adicionarSugestao } from "@/lib/sugestoes";
import { perfilLogado } from "@/lib/perfis-server";

export async function enviarSugestao(formData: FormData) {
  const perfil = await perfilLogado();
  // Em prod, sem perfil = nao processa (silencioso). Cliente sempre tem
  // perfil quando esta logado; admin/socio em modo visualizacao tambem.

  const tipo = String(formData.get("tipo") ?? "sugestao").trim();
  const titulo = String(formData.get("titulo") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  if (!titulo || !descricao) return;

  const tipoNormalizado = tipo === "duvida" ? "duvida" : "sugestao";

  const novo = await adicionarSugestao({
    tipo: tipoNormalizado,
    titulo,
    descricao,
    reportadoPorEmail: perfil?.email ?? "anônimo",
    reportadoPorNome: perfil?.nome ?? perfil?.email ?? "anônimo",
  });

  // E-mail pra caio@bpadvogados.com.br via Resend (se a env existir).
  // Falha silenciosamente — a sugestao continua persistida em memoria.
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const tipoRotulo = tipoNormalizado === "duvida" ? "Dúvida" : "Sugestão";
    const linhas = [
      `Tipo: ${tipoRotulo}`,
      `De: ${novo.reportadoPorNome} <${novo.reportadoPorEmail}>`,
      "",
      descricao,
    ];
    await resend.emails.send({
      from: "Sonar Cliente <contato@bpadvogados.com.br>",
      to: "caio@bpadvogados.com.br",
      subject: `[Sonar Cliente] ${tipoRotulo}: ${titulo}`,
      text: linhas.join("\n"),
    });
  } catch {
    // Resend indisponivel ou nao configurado — segue sem email.
  }

  redirect("/cliente/sugestoes?ok=1");
}
