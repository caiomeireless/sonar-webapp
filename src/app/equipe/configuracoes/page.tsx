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
      <header className="title-shield mb-6 text-center">
        <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)]">
          <Settings className="h-5 w-5 text-[var(--color-signal)]" />
        </div>
        <h1 className="font-serif text-[clamp(19px,2.75vw,34px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[var(--color-gold)]">
          Administração da Plataforma
        </h1>
        <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
          Configurações
        </p>
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
