// Configurações da plataforma — placeholder. Vai abrigar gestão de
// usuários, papéis, integrações (Themis/Assertiva), aparência e
// auditoria. Acesso restrito a admin/sócio.
import { redirect } from "next/navigation";
import { Settings, Users, Plug, Eye, ShieldCheck } from "lucide-react";

import { perfilLogado } from "@/lib/perfis-server";
import { ehAdmin, ehSocio } from "@/lib/perfis";

export const dynamic = "force-dynamic";

const SECOES = [
  { icon: Users, titulo: "Usuários e papéis", descricao: "Convidar equipe, definir admin/sócio/funcionário, vincular clientes." },
  { icon: Plug, titulo: "Integrações", descricao: "Themis, Assertiva, BigDataCorp, ARISP, Resend. Tokens e limites." },
  { icon: Eye, titulo: "Aparência", descricao: "Tema padrão da equipe, logos do escritório, cores institucionais." },
  { icon: ShieldCheck, titulo: "Segurança e auditoria", descricao: "Logs de consultas pagas, downloads de peça, sessões ativas." },
];

export default async function ConfiguracoesPage() {
  const perfil = await perfilLogado();
  if (!ehAdmin(perfil) && !ehSocio(perfil)) redirect("/equipe");

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-10 sm:px-10">
      <header className="mb-6 flex items-center gap-3">
        <Settings className="h-6 w-6 text-[var(--color-signal)]" />
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
            Configurações
          </p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight text-ivory sm:text-4xl">
            Administração da plataforma
          </h1>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {SECOES.map((s) => (
          <article key={s.titulo} className="glass p-6">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-signal-soft)]">
              <s.icon className="h-5 w-5 text-[var(--color-signal)]" />
            </div>
            <h2 className="font-serif text-xl text-ivory">{s.titulo}</h2>
            <p className="mt-1.5 text-sm text-[var(--color-ivory-66)]">
              {s.descricao}
            </p>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-40)]">
              Em construção
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
