// Rota de diagnostico — abre no browser pra testar se Resend esta
// configurado em producao. Mostra status JSON e tenta enviar email
// pro caio@bpadvogados.com.br. Devolve sempre 200 com o resultado pra
// debug (em vez de 500 silencioso).
//
// Uso: https://sonar.vercel.app/api/demo/teste-email

export const dynamic = "force-dynamic";

export async function GET() {
  const out: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_URL: process.env.VERCEL_URL ?? null,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL ?? null,
      RESEND_API_KEY_present: !!process.env.RESEND_API_KEY,
      RESEND_API_KEY_prefix: process.env.RESEND_API_KEY
        ? `${process.env.RESEND_API_KEY.slice(0, 6)}...`
        : null,
    },
  };

  if (!process.env.RESEND_API_KEY) {
    out.status = "FALHA";
    out.razao = "RESEND_API_KEY nao esta configurado em process.env";
    return Response.json(out, { status: 200 });
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const result = await resend.emails.send({
      from: "Sonar Landing <contato@bpadvogados.com.br>",
      to: "caio@bpadvogados.com.br",
      subject: "[Sonar] Teste de envio - diagnostico",
      html: `<p>Este e um email de teste do endpoint <code>/api/demo/teste-email</code>.</p>
<p>Se chegou, o Resend esta funcionando em producao.</p>
<p>Timestamp: ${new Date().toISOString()}</p>`,
      text: `Email de teste. Timestamp: ${new Date().toISOString()}`,
    });

    if (result.error) {
      out.status = "FALHA";
      out.razao = "Resend retornou erro";
      out.erro_resend = result.error;
    } else {
      out.status = "OK";
      out.email_id = result.data?.id ?? null;
    }
  } catch (err) {
    out.status = "FALHA";
    out.razao = "Excecao ao chamar Resend";
    out.erro = err instanceof Error ? { message: err.message, name: err.name } : String(err);
  }

  return Response.json(out, { status: 200 });
}
