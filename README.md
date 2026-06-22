# Sonar

Plataforma de localização de bens de devedores do escritório **Battaglia & Pedrosa Advogados**.

> Encontra o que está escondido nas profundezas.

## Stack

- Next.js 16.2.6 + React 19.2.4
- Supabase (auth + dados)
- Tailwind v4
- Fontes: Manrope · Cormorant Garamond · JetBrains Mono (via Google Fonts)
- TypeScript 5 strict

## Setup

```bash
cd webapp
cp .env.example .env.local
# preencher NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY

npm install
npm run dev   # http://localhost:3000
```

### Migrations

Aplicar manualmente no painel do Supabase (SQL Editor):

1. `supabase/migrations/001_perfis.sql` — tabela `perfis` + bucket `avatares` + super-admin inicial.
2. `supabase/migrations/002_custos.sql` — tabela `custos` (monitor de gasto com APIs pagas).

**Atenção:** antes de rodar a 001, troque o e-mail do super-admin no INSERT final.

### SMTP do OTP (e-mail)

O login do Sonar usa OTP do Supabase Auth (`signInWithOtp` + `verifyOtp`).
O envio do código vai pelo SMTP configurado no painel do Supabase:

1. Supabase > **Authentication** > **Email** > **SMTP Settings**
2. Configure as credenciais do **Resend**:
   - Host: `smtp.resend.com`
   - Port: `465` (TLS) ou `587` (STARTTLS)
   - Username: `resend`
   - Password: sua `RESEND_API_KEY`
   - Sender email: institucional do escritório (`contato@bpadvogados.com.br`)

Sem essa config, o OTP não chega.

## Identidade visual

A marca está documentada em `../design_handoff_sonar_logo/README.md`.
Variante usada: **B** (radar limpo + escada B&P na assinatura institucional).

SVGs disponíveis em `public/brand/`. Componentes React em `src/components/`:
- `<SonarMark size={N} />` — só o símbolo
- `<Logo size="sm|md|lg" />` — lockup horizontal-B completo

## Roadmap

- [x] Scaffold + identidade + landing + login OTP + perfis (com `cliente`)
- [ ] Integrações: Themis (CRM legado) + DataJud (CNJ grátis)
- [ ] Modelo de dados: credores · devedores · casos · bens_encontrados · consultas_cache
- [ ] Pesquisa de bens (Assertiva já contratada · BigDataCorp pay-per-use · eDossiê à la carte)
- [ ] Dashboard com mapa do Brasil (devedores fixados no território)
- [ ] Portal do cliente (read-only por carteira)

## Padrões

Veja `AGENTS.md` — Next 16 tem breaking changes; consulte `node_modules/next/dist/docs/` antes de codar.
