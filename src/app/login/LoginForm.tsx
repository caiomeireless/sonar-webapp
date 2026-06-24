"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({
  accent = "signal",
  titulo,
  subtitulo,
  compacto = false,
}: {
  accent?: "signal" | "gold";
  titulo?: string;
  subtitulo?: string;
  /** Versao reduzida pra caber 2 cards lado a lado dentro do radar. */
  compacto?: boolean;
} = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const erroQuery = searchParams.get("erro");

  const [supabase] = useState(() => createClient());
  const [etapa, setEtapa] = useState<"email" | "codigo">("email");
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(
    erroQuery === "dominio"
      ? "E-mail não autorizado. Use seu institucional do escritório ou um e-mail cadastrado pelo escritório."
      : erroQuery === "link"
        ? "Link inválido ou expirado. Solicite um novo código."
        : "",
  );

  // Cores por accent — equipe usa SIGNAL VERDE, cliente usa GOLD dourado.
  // Mesma UX, cor diferente pra dar clareza visual de qual entrada e' qual.
  const accentColors =
    accent === "gold"
      ? {
          text: "text-[#FFD93D]",
          ring: "focus:ring-[rgba(255,217,61,0.20)]",
          border: "focus:border-[#FFD93D]",
          bg: "bg-[#FFD93D]",
          bgHover: "hover:bg-[#FFE680]",
        }
      : {
          text: "text-[var(--color-signal)]",
          ring: "focus:ring-[var(--color-signal-12)]",
          border: "focus:border-[var(--color-signal)]",
          bg: "bg-[var(--color-signal)]",
          bgHover: "hover:bg-[var(--color-tip-glow)]",
        };

  async function enviarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        // shouldCreateUser=false: usuario PRECISA existir em auth.users
        // antes (criado pelo admin no Supabase Dashboard ou via API).
        // Sem isso, novos emails recebem o template "Confirm signup"
        // com link e nao o codigo OTP, o que confunde o usuario.
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });
    setCarregando(false);
    if (error) {
      // Mensagem amigavel pra "user not found"
      const msg = error.message.toLowerCase();
      if (msg.includes("not found") || msg.includes("signups not allowed")) {
        setErro(
          "E-mail nao autorizado. Peca ao administrador (Caio) pra liberar seu acesso.",
        );
      } else {
        setErro(error.message);
      }
    } else {
      setEtapa("codigo");
    }
  }

  async function verificarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: codigo.replace(/\s/g, ""),
      type: "email",
    });
    setCarregando(false);
    if (error) {
      setErro("Código inválido ou expirado. Confira e tente novamente.");
    } else {
      router.push("/app");
      router.refresh();
    }
  }

  const inputBase = `w-full rounded-lg border border-[var(--color-ivory-22)] bg-[var(--color-carbon)] px-4 ${compacto ? "py-2" : "py-3"} text-sm text-ivory outline-none transition placeholder:text-[var(--color-ivory-66)] ${accentColors.border} focus:ring-2 ${accentColors.ring}`;
  const btnBase = `w-full rounded-lg ${accentColors.bg} px-4 ${compacto ? "py-2" : "py-3"} text-sm font-semibold text-onyx transition ${accentColors.bgHover} disabled:opacity-50`;

  return (
    <div className={`glass ${compacto ? "p-5" : "p-7"} shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)]`}>
      <span className={`eyebrow ${accentColors.text}`}>Acesso</span>
      <h2 className={`mt-2 ${compacto ? "text-base" : "text-lg"} font-medium text-ivory`}>
        {etapa === "email"
          ? (titulo ?? "Entre com seu e-mail")
          : "Digite o código"}
      </h2>
      <p className="mt-1 text-xs text-[var(--color-ivory-66)]">
        {etapa === "email"
          ? (subtitulo ?? "Equipe ou cliente — o caminho é o mesmo.")
          : `Enviamos um código de 6 dígitos para ${email}.`}
      </p>

      {etapa === "email" ? (
        <form onSubmit={enviarCodigo} className={`${compacto ? "mt-3" : "mt-6"} flex flex-col gap-2`}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu.email@exemplo.com"
            className={inputBase}
            autoComplete="email"
          />
          <button type="submit" disabled={carregando} className={btnBase}>
            {carregando ? "Enviando..." : "Receber código por e-mail"}
          </button>
          {erro && <p className="text-sm text-red-400">{erro}</p>}
        </form>
      ) : (
        <form onSubmit={verificarCodigo} className="mt-6 flex flex-col gap-3">
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            autoFocus
            value={codigo}
            onChange={(e) => {
              const digitos = e.target.value.replace(/\D/g, "").slice(0, 6);
              setCodigo(digitos.length <= 3 ? digitos : `${digitos.slice(0, 3)} ${digitos.slice(3)}`);
            }}
            placeholder="000 000"
            maxLength={7}
            className={`${inputBase} text-center text-xl tracking-[0.4em]`}
          />
          <button type="submit" disabled={carregando} className={btnBase}>
            {carregando ? "Verificando..." : "Entrar"}
          </button>
          {erro && <p className="text-sm text-red-400">{erro}</p>}
          <button
            type="button"
            onClick={() => {
              setEtapa("email");
              setCodigo("");
              setErro("");
            }}
            className="text-xs text-[var(--color-ivory-66)] transition hover:text-ivory"
          >
            Usar outro e-mail
          </button>
        </form>
      )}

    </div>
  );
}
