"use server";

// Server actions do login OTP.
//
// O fluxo passa por aqui (em vez de chamar Supabase do browser direto) por 3
// razoes: (1) permite logar tentativas no servidor sem expor o admin client,
// (2) cookies da sessao sao gravados pelo server client do Supabase logo apos
// verifyOtp — sem round-trip extra, e (3) deixa a UI client component simples
// (so chama a action, recebe {ok, mensagem|destino}).
//
// O middleware ja barra emails nao autorizados (dominio + perfis cliente +
// credores). Aqui a gente NAO duplica essa checagem no envio do codigo: o
// Supabase ja recusa email inexistente quando shouldCreateUser=false. O
// motivo: se a allowlist mudar (admin acabou de cadastrar o cliente), o
// usuario consegue receber o codigo na mesma sessao sem esperar deploy/cache.

import { createClient } from "@/lib/supabase/server";

export interface ResultadoOtp {
  ok: boolean;
  mensagem?: string;
}

// Envia o codigo OTP de 6 digitos pro email informado.
// shouldCreateUser=false: usuario PRECISA existir em auth.users antes — assim
// o template enviado e o de "Login Code" (6 digitos) e nao "Confirm Signup"
// (link de confirmacao), que confundiria o usuario.
export async function enviarOtp(emailRaw: string): Promise<ResultadoOtp> {
  const email = (emailRaw ?? "").trim().toLowerCase();
  if (!email) {
    return { ok: false, mensagem: "Informe seu e-mail." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, mensagem: "E-mail inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
    },
  });

  if (error) {
    const msg = (error.message ?? "").toLowerCase();
    if (msg.includes("not found") || msg.includes("signups not allowed")) {
      return {
        ok: false,
        mensagem:
          "E-mail não autorizado. Peça ao administrador do escritório para liberar seu acesso.",
      };
    }
    if (msg.includes("rate") || msg.includes("too many")) {
      return {
        ok: false,
        mensagem:
          "Muitas tentativas em pouco tempo. Aguarde 1 minuto e tente novamente.",
      };
    }
    return {
      ok: false,
      mensagem:
        "Não foi possível enviar o código agora. Tente novamente em instantes.",
    };
  }

  return { ok: true };
}

// Verifica o codigo OTP. Em caso de sucesso, retorna ok:true — o client
// component faz router.push("/app") e o /app/page.tsx redireciona conforme
// o papel (cliente -> /cliente/casos; equipe -> /equipe).
export async function verificarOtp(
  emailRaw: string,
  codigoRaw: string,
): Promise<ResultadoOtp> {
  const email = (emailRaw ?? "").trim().toLowerCase();
  const codigo = (codigoRaw ?? "").replace(/\D/g, "");
  if (!email || codigo.length !== 6) {
    return { ok: false, mensagem: "Digite o código de 6 dígitos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token: codigo,
    type: "email",
  });

  if (error) {
    const msg = (error.message ?? "").toLowerCase();
    if (msg.includes("expired")) {
      return {
        ok: false,
        mensagem:
          "Código expirado. Volte e peça um novo código por e-mail.",
      };
    }
    return {
      ok: false,
      mensagem: "Código inválido. Confira os dígitos e tente novamente.",
    };
  }

  return { ok: true };
}
