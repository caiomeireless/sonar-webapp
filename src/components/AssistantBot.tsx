"use client";

import { useRef, useState, type FormEvent } from "react";
import { SplineScene } from "@/components/ui/SplineScene";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { STAIRCASE_PATTERN } from "@/components/LogoSvg";

const SCENE_URL = "https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode";
const SUPPORT_EMAIL = "contato@bpadvogados.com.br";
// WhatsApp do escritorio — formato internacional sem mascara.
const SUPPORT_WHATSAPP = "5511995049829";

type Props = {
  /** Modo "topbar": SEM fundo onyx atras do robo — deixa o quadriculado
   * verde da topbar aparecer + remove o mixBlendMode pra que o robo
   * fique visivel sem precisar de fundo preto. */
  solido?: boolean;
};

export function AssistantBot({ solido = false }: Props = {}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  function open() {
    dialogRef.current?.showModal();
  }
  function close() {
    dialogRef.current?.close();
  }
  function send(e: FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent("Dúvida sobre o Sonar");
    const body = encodeURIComponent(`De: ${email}\n\n${msg}`);
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    close();
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        title="Tem dúvidas? Fale com a equipe"
        aria-label="Tire suas dúvidas com a equipe"
        className="group relative h-[130px] w-[110px] cursor-pointer overflow-hidden rounded-xl"
      >
        {/* Renderiza o canvas Spline INTEIRO em alta resolução (400x520),
            depois encolhe via CSS transform pra caber em 110x130 visualmente.
            O scene aparece em miniatura COMPLETA (robô + cubo, sem corte).
            Filter: roxo -> verde escuro + tom dourado (sepia).
            Quando `solido` (topbar) NAO aplicamos mixBlendMode lighten —
            assim o robo continua visivel mesmo sem fundo preto, deixando
            o quadriculado da topbar aparecer atras. */}
        <div
          className="absolute left-0 top-0"
          style={{
            width: "400px",
            height: "520px",
            transform: "scale(0.275)",
            transformOrigin: "top left",
            mixBlendMode: solido ? "normal" : "lighten",
            filter:
              "hue-rotate(-115deg) sepia(0.3) brightness(0.65) saturate(1.5)",
          }}
        >
          <SplineScene scene={SCENE_URL} className="h-full w-full" />
        </div>
        {/* Cobertura do watermark — barra full-width estendida ABAIXO do botão
            (canvas escalado vaza ~15px além do botão). Mantida em bg-onyx
            tambem no modo solido pra esconder o "PYZD..." que o Spline
            estampa no canto inferior — pequena faixa (h-8) fica acima da
            borda da topbar e nao atrapalha o layout. */}
        <span className="pointer-events-none absolute -bottom-5 left-0 right-0 z-10 h-8 bg-onyx" />
        {/* Escada B&P estampada na parede da caixa (lado esquerdo, espelhando o badge "?") */}
        <svg
          viewBox="0 0 39 39"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-[72%] z-10 h-5 w-5 drop-shadow-[0_0_3px_rgba(201,162,74,0.5)]"
        >
          {STAIRCASE_PATTERN.map((r, i) => (
            <rect
              key={i}
              x={r.x}
              y={r.y}
              width={5}
              height={5}
              fill="#C9A24A"
              opacity={r.op}
            />
          ))}
        </svg>
        {/* Badge "?" — canto superior direito do robozinho */}
        <span className="absolute right-0 top-0 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-gold)] text-[10px] font-bold text-onyx shadow-lg ring-2 ring-onyx">
          ?
        </span>
      </button>

      <dialog
        ref={dialogRef}
        className="fixed inset-0 m-auto h-fit w-fit max-w-[92vw] border-0 bg-transparent p-0 text-ivory outline-none backdrop:bg-onyx/80 backdrop:backdrop-blur-sm"
      >
        <SpotlightCard className="w-[min(440px,92vw)] p-8">
          <form onSubmit={send}>
            <h3 className="font-serif text-2xl text-ivory">Alguma dúvida?</h3>
            <p className="mt-2 text-sm text-[var(--color-ivory-88)]">
              Em breve teremos chat em tempo real aqui. Por enquanto, deixe sua
              mensagem e a equipe retorna por e-mail.
            </p>
            <label className="mt-5 block text-xs uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
              E-mail
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-[var(--color-ivory-12)] bg-onyx px-3 py-2 text-sm normal-case tracking-normal text-ivory focus:border-[var(--color-signal)] focus:outline-none"
              />
            </label>
            <label className="mt-4 block text-xs uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
              Mensagem
              <textarea
                required
                rows={4}
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-[var(--color-ivory-12)] bg-onyx px-3 py-2 text-sm normal-case tracking-normal text-ivory focus:border-[var(--color-signal)] focus:outline-none"
              />
            </label>
            <p className="mt-4 text-[10px] uppercase tracking-[0.18em] text-[var(--color-gold)]">
              Battaglia &amp; Pedrosa · Suporte Sonar
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={close}
                className="rounded-lg px-4 py-2 text-sm text-[var(--color-ivory-66)] transition hover:text-ivory"
              >
                Cancelar
              </button>
              <a
                href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent("Ola! Tenho uma duvida sobre o Sonar.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-[#25D366]/60 bg-[#25D366]/15 px-4 py-2 text-sm font-semibold text-[#25D366] transition hover:bg-[#25D366]/25"
              >
                {/* Icone WhatsApp inline (lucide nao tem icone oficial) */}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                </svg>
                WhatsApp
              </a>
              <button
                type="submit"
                className="rounded-lg bg-[var(--color-signal)] px-4 py-2 text-sm font-semibold text-onyx transition hover:bg-[var(--color-tip-glow)]"
              >
                Enviar →
              </button>
            </div>
          </form>
        </SpotlightCard>
      </dialog>
    </>
  );
}
