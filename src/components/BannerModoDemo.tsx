// Banner fixo no topo das paginas autenticadas via cookie de demo.
// Mostra o tipo (Equipe/Cliente) + lembrete que sao 24h + botao pra
// limpar o cookie e voltar pra landing.

import { cookies } from "next/headers";

export async function BannerModoDemo() {
  const cookieStore = await cookies();
  const demo = cookieStore.get("sonar.demo")?.value ?? "";
  const [tipo] = demo.split(":");
  if (tipo !== "equipe" && tipo !== "cliente") return null;

  const tipoLabel = tipo === "equipe" ? "Equipe" : "Cliente";
  return (
    <div
      className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-3 border-b px-4 py-2 text-center text-[11px] font-mono uppercase tracking-[0.22em]"
      style={{
        background: "linear-gradient(90deg, rgba(168,85,247,0.22), rgba(192,132,252,0.18), rgba(168,85,247,0.22))",
        borderColor: "rgba(192,132,252,0.4)",
        color: "#e9d5ff",
      }}
    >
      <span>
        Modo Demo · {tipoLabel} · acesso temporário
      </span>
      <a
        href="/api/demo/sair"
        className="rounded-full border border-[rgba(192,132,252,0.5)] px-3 py-0.5 text-[10px] transition hover:bg-[rgba(168,85,247,0.25)]"
      >
        Sair
      </a>
    </div>
  );
}
