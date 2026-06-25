// Server Action — recebe o formulário de reportar bug e dispara o e-mail
// pra caio@bpadvogados.com.br (Resend, se disponível). Persiste em memória
// via lib/bugs.ts. Migrar pra Supabase quando ganhar tabela `bugs`.
"use server";

import { redirect } from "next/navigation";

import { adicionarBug } from "@/lib/bugs";
import { ehEquipe } from "@/lib/perfis";
import { perfilLogado } from "@/lib/perfis-server";

export async function enviarBug(formData: FormData) {
  const perfil = await perfilLogado();
  if (!ehEquipe(perfil)) redirect("/login");

  const titulo = String(formData.get("titulo") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  if (!titulo || !descricao) return;

  // Screenshots — pra demo, coletamos só o nome do arquivo. Em produção,
  // upload pro Supabase Storage e gravamos as URLs.
  const screenshots: string[] = [];
  for (const file of formData.getAll("screenshots")) {
    if (file instanceof File && file.size > 0) screenshots.push(file.name);
  }

  const novo = await adicionarBug({
    titulo,
    descricao,
    screenshots,
    reportadoPorEmail: perfil?.email ?? "anônimo",
    reportadoPorNome: perfil?.nome ?? perfil?.email ?? "anônimo",
  });

  // E-mail pra caio@bpadvogados.com.br via Resend (se a lib estiver instalada
  // e a env existir). Se não houver, falha silenciosamente — a demo segue
  // só com a persistência em memória.
  try {
    // `resend` é opcional — a lib pode não estar instalada na demo.
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const linhas = [
      `Reportado por: ${novo.reportadoPorNome} <${novo.reportadoPorEmail}>`,
      "",
      descricao,
      "",
      screenshots.length ? `Screenshots: ${screenshots.join(", ")}` : "",
    ].filter(Boolean);
    await resend.emails.send({
      from: "Sonar Bugs <bugs@bpadvogados.com.br>",
      to: ["caio@bpadvogados.com.br"],
      subject: `[Sonar Bug] ${titulo}`,
      text: linhas.join("\n"),
    });
  } catch (err) {
    console.error("[bugs] envio de e-mail falhou:", err);
  }

  redirect("/equipe/bugs?ok=1");
}
