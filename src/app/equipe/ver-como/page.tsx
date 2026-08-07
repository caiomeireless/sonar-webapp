// Ver Como Cliente — janela de seleção de qual cliente visualizar.
// Cada cliente enxerga um portal diferente (o portfólio DELE), então o
// admin/sócio escolhe aqui quem quer simular antes de entrar no /cliente.
// A visualização em si é o modo preview já existente: /cliente?eu=<email>
// (aceito em produção só pra admin/sócio via previewEuFromParam).
import { redirect } from "next/navigation";
import { Eye } from "lucide-react";

import { perfilLogadoReal } from "@/lib/perfis-server";
import { ehAdmin, ehSocio } from "@/lib/perfis";
import { listarCredoresAdmin } from "@/lib/credores-admin";

import SeletorCliente from "./_components/SeletorCliente";

export const dynamic = "force-dynamic";

export default async function VerComoPage() {
  // Sessão REAL obrigatória: a lista carrega PII de todos os clientes e o
  // cookie demo (sonar.demo=equipe:*) forja papel admin sem revalidação.
  const perfil = await perfilLogadoReal();
  if (!ehAdmin(perfil) && !ehSocio(perfil)) redirect("/equipe");

  const credores = await listarCredoresAdmin();

  return (
    <main className="mx-auto max-w-[860px] px-6 py-10 sm:px-10">
      <header className="title-shield mb-8 text-center">
        <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)]">
          <Eye className="h-5 w-5 text-[var(--color-gold)]" />
        </div>
        <h1 className="font-serif text-[clamp(19px,2.75vw,34px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[var(--color-gold)]">
          Ver Como Cliente
        </h1>
        <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
          Escolha o Cliente da Visualização
        </p>
        <p className="mx-auto mt-4 max-w-[560px] text-sm text-[var(--color-ivory-66)]">
          Cada cliente vê o portal com o próprio portfólio — devedores, casos,
          custos e mapa. Escolha abaixo quem você quer simular; um aviso dourado
          marca o modo visualização e traz você de volta pra equipe.
        </p>
      </header>

      <SeletorCliente credores={credores} />
    </main>
  );
}
