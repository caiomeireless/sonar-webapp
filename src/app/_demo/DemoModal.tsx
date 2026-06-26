"use client";

// Modal acionado pelo DemoButton. Tem 3 estados:
//   1. "escolha"      — 2 cards (Demo Equipe / Demo Cliente)
//   2. "form"         — campos nome/email/motivo + submit pra server action
//   3. "confirmacao"  — mensagem de sucesso + botao WhatsApp Caio
//
// Portala pra document.body pra escapar de qualquer ancestral com
// backdrop-filter (memoria portal-para-modal-em-pai-com-backdrop-filter).

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { pedirDemo } from "./actions";
import type { DemoTipo } from "@/lib/demo-tokens";

const WHATSAPP_CAIO = "5515981155238"; // (15) 981155238 com 55 internacional
const WHATSAPP_TEXTO =
  "Ola Caio! Pedi acesso a demo do Sonar e gostaria de prosseguir.";

type Etapa = "escolha" | "form" | "confirmacao";

export function DemoModal({
  aberto,
  onFechar,
}: {
  aberto: boolean;
  onFechar: () => void;
}) {
  const [etapa, setEtapa] = useState<Etapa>("escolha");
  const [tipoEscolhido, setTipoEscolhido] = useState<DemoTipo | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();
  const [montado, setMontado] = useState(false);

  useEffect(() => setMontado(true), []);

  useEffect(() => {
    if (!aberto) {
      // reseta estado quando fechar
      const t = setTimeout(() => {
        setEtapa("escolha");
        setTipoEscolhido(null);
        setErro(null);
      }, 200);
      return () => clearTimeout(t);
    }
    // ESC fecha
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aberto, onFechar]);

  if (!aberto || !montado) return null;

  function escolherTipo(tipo: DemoTipo) {
    setTipoEscolhido(tipo);
    setEtapa("form");
  }

  function submeter(formData: FormData) {
    setErro(null);
    if (tipoEscolhido) formData.set("tipo", tipoEscolhido);
    startTransition(async () => {
      const result = await pedirDemo(formData);
      if (!result.ok) {
        setErro(result.mensagem);
        return;
      }
      setEtapa("confirmacao");
    });
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Versao Demo do Sonar"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        background: "rgba(5, 7, 6, 0.84)",
        backdropFilter: "blur(8px)",
      }}
      onClick={onFechar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[640px] rounded-2xl border p-8 sm:p-10"
        style={{
          background: "var(--color-onyx)",
          borderColor: "rgba(192, 132, 252, 0.4)",
          boxShadow:
            "0 0 0 1px rgba(192,132,252,0.15), 0 24px 80px rgba(168,85,247,0.18)",
        }}
      >
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-ivory-22)] text-[var(--color-ivory-66)] transition hover:bg-[var(--color-ivory-12)] hover:text-ivory"
        >
          x
        </button>

        {etapa === "escolha" ? (
          <EtapaEscolha onEscolher={escolherTipo} />
        ) : etapa === "form" && tipoEscolhido ? (
          <EtapaForm
            tipo={tipoEscolhido}
            onVoltar={() => setEtapa("escolha")}
            onSubmeter={submeter}
            pendente={pendente}
            erro={erro}
          />
        ) : (
          <EtapaConfirmacao tipo={tipoEscolhido} />
        )}
      </div>
    </div>,
    document.body,
  );
}

// =====================================================================
// ETAPAS
// =====================================================================

function EtapaEscolha({
  onEscolher,
}: {
  onEscolher: (t: DemoTipo) => void;
}) {
  return (
    <>
      <div className="text-center">
        <span
          className="font-mono text-[11px] uppercase tracking-[0.28em]"
          style={{ color: "#c084fc" }}
        >
          Versao Demo
        </span>
        <h2 className="mt-3 font-serif text-[clamp(22px,3vw,30px)] font-medium leading-tight tracking-tight text-ivory">
          Como voce quer explorar o Sonar?
        </h2>
        <p className="mt-3 text-sm text-[var(--color-ivory-88)]">
          Escolha o perfil que quer ver. Acesso liberado em poucos minutos.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <CardEscolha
          tipo="equipe"
          eyebrow="Voce e advogado(a)?"
          titulo="Demo Equipe"
          descricao="Painel completo do escritorio: gerador de pecas, monitor de custos, banco de devedores, dashboard analitico."
          cor="signal"
          onClick={() => onEscolher("equipe")}
        />
        <CardEscolha
          tipo="cliente"
          eyebrow="Voce e cliente?"
          titulo="Demo Cliente"
          descricao="Portal do cliente: dossie patrimonial, mapa de bens, dashboard do devedor, transparencia financeira."
          cor="devedor"
          onClick={() => onEscolher("cliente")}
        />
      </div>
    </>
  );
}

function CardEscolha({
  eyebrow,
  titulo,
  descricao,
  cor,
  onClick,
}: {
  tipo: DemoTipo;
  eyebrow: string;
  titulo: string;
  descricao: string;
  cor: "signal" | "devedor";
  onClick: () => void;
}) {
  const tokenCor =
    cor === "signal" ? "var(--color-signal)" : "var(--color-devedor)";
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col items-start gap-2 rounded-xl border p-5 text-left transition hover:scale-[1.02]"
      style={{
        background: "rgba(5,7,6,0.5)",
        borderColor: "var(--color-ivory-22)",
      }}
    >
      <span
        className="font-mono text-[10px] uppercase tracking-[0.22em]"
        style={{ color: tokenCor }}
      >
        {eyebrow}
      </span>
      <span className="nome-devedor font-serif text-xl font-medium text-ivory">
        {titulo}
      </span>
      <p className="text-sm leading-relaxed text-[var(--color-ivory-88)]">
        {descricao}
      </p>
      <span
        className="mt-2 inline-flex items-center gap-1 text-sm font-semibold"
        style={{ color: tokenCor }}
      >
        Pedir acesso →
      </span>
    </button>
  );
}

function EtapaForm({
  tipo,
  onVoltar,
  onSubmeter,
  pendente,
  erro,
}: {
  tipo: DemoTipo;
  onVoltar: () => void;
  onSubmeter: (fd: FormData) => void;
  pendente: boolean;
  erro: string | null;
}) {
  const tipoLabel = tipo === "equipe" ? "Equipe" : "Cliente";
  return (
    <>
      <div className="text-center">
        <span
          className="font-mono text-[11px] uppercase tracking-[0.28em]"
          style={{ color: "#c084fc" }}
        >
          Demo {tipoLabel}
        </span>
        <h2 className="mt-3 font-serif text-[clamp(22px,3vw,30px)] font-medium leading-tight tracking-tight text-ivory">
          Quase la.
        </h2>
        <p className="mt-3 text-sm text-[var(--color-ivory-88)]">
          O Advogado Caio Vicentino vai conferir seu pedido e liberar o
          acesso por contato direto.
        </p>
      </div>

      <form
        action={onSubmeter}
        className="mt-7 flex flex-col gap-4"
        autoComplete="off"
      >
        <label className="block text-xs uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
          Seu nome
          <input
            type="text"
            name="nome"
            required
            minLength={2}
            placeholder="Como devemos te chamar"
            className="mt-1 block w-full rounded-lg border border-[var(--color-ivory-22)] bg-onyx px-3 py-2.5 text-sm normal-case tracking-normal text-ivory placeholder:text-[var(--color-ivory-66)] focus:border-[#c084fc] focus:outline-none"
          />
        </label>

        <label className="block text-xs uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
          Seu e-mail
          <input
            type="email"
            name="email"
            required
            placeholder="voce@exemplo.com"
            className="mt-1 block w-full rounded-lg border border-[var(--color-ivory-22)] bg-onyx px-3 py-2.5 text-sm normal-case tracking-normal text-ivory placeholder:text-[var(--color-ivory-66)] focus:border-[#c084fc] focus:outline-none"
          />
        </label>

        <label className="block text-xs uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
          Motivo (opcional)
          <textarea
            name="motivo"
            rows={3}
            placeholder="Quer recuperar credito? Avaliar contrato? So curioso?"
            className="mt-1 block w-full resize-none rounded-lg border border-[var(--color-ivory-22)] bg-onyx px-3 py-2.5 text-sm normal-case tracking-normal text-ivory placeholder:text-[var(--color-ivory-66)] focus:border-[#c084fc] focus:outline-none"
          />
        </label>

        {erro ? (
          <p className="text-sm text-red-400" role="alert">
            {erro}
          </p>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onVoltar}
            className="rounded-lg px-4 py-2 text-sm text-[var(--color-ivory-66)] transition hover:text-ivory"
          >
            ← Voltar
          </button>
          <button
            type="submit"
            disabled={pendente}
            className="relative inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition disabled:opacity-60"
            style={{
              background: "rgba(168, 85, 247, 0.28)",
              color: "#e9d5ff",
              border: "1px solid rgba(192, 132, 252, 0.7)",
              boxShadow:
                "0 0 0 1px rgba(192,132,252,0.25), 0 0 24px rgba(168,85,247,0.55), inset 0 0 14px rgba(168,85,247,0.22)",
              textShadow: "0 0 8px rgba(232,213,255,0.6)",
            }}
          >
            {pendente ? "Enviando…" : "Pedir acesso →"}
          </button>
        </div>
      </form>
    </>
  );
}

function EtapaConfirmacao({ tipo }: { tipo: DemoTipo | null }) {
  const tipoLabel = tipo === "equipe" ? "Equipe" : "Cliente";
  const whatsappUrl = `https://wa.me/${WHATSAPP_CAIO}?text=${encodeURIComponent(WHATSAPP_TEXTO)}`;
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Aceita so digitos, max 6
    const so = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCodigo(so);
    if (erro) setErro(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (codigo.length !== 6) {
      setErro("Informe os 6 digitos do codigo.");
      return;
    }
    setVerificando(true);
    // Redireciona pro endpoint de validacao — ele seta o cookie e
    // joga pra /equipe ou /cliente, OU devolve 404 com mensagem se
    // codigo nao for valido.
    window.location.href = `/api/demo/${codigo}`;
  }

  return (
    <div className="text-center">
      <span
        className="font-mono text-[11px] uppercase tracking-[0.28em]"
        style={{ color: "#c084fc" }}
      >
        Pedido recebido
      </span>
      <h2 className="mt-3 font-serif text-[clamp(22px,3vw,30px)] font-medium leading-tight tracking-tight text-ivory">
        Tudo certo!
      </h2>
      <p className="mx-auto mt-4 max-w-[460px] text-sm leading-relaxed text-[var(--color-ivory-88)]">
        Seu pedido de <strong>Demo {tipoLabel}</strong> chegou.{" "}
        O Advogado{" "}
        <strong className="text-[var(--color-gold)]">Caio Vicentino</strong>{" "}
        vai te enviar pelo WhatsApp um{" "}
        <strong>codigo de 6 digitos</strong>. Cole abaixo pra entrar:
      </p>

      {/* CARD INPUT DO CODIGO */}
      <form
        onSubmit={handleSubmit}
        className="mx-auto mt-6 max-w-[420px] rounded-2xl border p-5"
        style={{
          background: "rgba(168, 85, 247, 0.06)",
          borderColor: "rgba(192, 132, 252, 0.4)",
          boxShadow:
            "0 0 0 1px rgba(192,132,252,0.15), 0 0 24px rgba(168,85,247,0.18)",
        }}
      >
        <label
          htmlFor="demo-codigo"
          className="block font-mono text-[10px] uppercase tracking-[0.28em]"
          style={{ color: "#c084fc" }}
        >
          Codigo de acesso
        </label>
        <input
          id="demo-codigo"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          value={codigo}
          onChange={handleChange}
          placeholder="000000"
          maxLength={6}
          autoFocus
          className="mt-2 block w-full rounded-lg border bg-onyx px-4 py-3 text-center font-mono text-[28px] font-bold tracking-[0.5em] text-ivory placeholder:text-[var(--color-ivory-22)] focus:outline-none"
          style={{
            borderColor: erro
              ? "rgba(255,91,91,0.6)"
              : "rgba(192,132,252,0.4)",
          }}
        />
        {erro ? (
          <p className="mt-2 text-xs text-red-400" role="alert">
            {erro}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={codigo.length !== 6 || verificando}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition disabled:opacity-50"
          style={{
            background:
              codigo.length === 6
                ? "rgba(168, 85, 247, 0.28)"
                : "rgba(168, 85, 247, 0.10)",
            color: "#e9d5ff",
            border: "1px solid rgba(192, 132, 252, 0.7)",
            boxShadow:
              codigo.length === 6
                ? "0 0 0 1px rgba(192,132,252,0.25), 0 0 24px rgba(168,85,247,0.55), inset 0 0 14px rgba(168,85,247,0.22)"
                : "none",
            textShadow:
              codigo.length === 6 ? "0 0 8px rgba(232,213,255,0.6)" : "none",
          }}
        >
          {verificando ? "Verificando…" : "Entrar na demo →"}
        </button>
      </form>

      <p className="mx-auto mt-6 max-w-[400px] text-xs text-[var(--color-ivory-66)]">
        Ainda nao recebeu o codigo? Fale com o Caio:
      </p>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-2.5 rounded-lg px-5 py-2.5 text-xs font-semibold transition"
        style={{
          background: "rgba(37, 211, 102, 0.16)",
          color: "#86efac",
          border: "1px solid rgba(37, 211, 102, 0.6)",
          boxShadow:
            "0 0 0 1px rgba(37,211,102,0.25), 0 0 18px rgba(37,211,102,0.35), inset 0 0 12px rgba(37,211,102,0.14)",
          textShadow: "0 0 8px rgba(134,239,172,0.5)",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
        </svg>
        WhatsApp (15) 98115-5238
      </a>
    </div>
  );
}
