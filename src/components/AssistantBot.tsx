"use client";

import { useRef, useState, type FormEvent } from "react";
import { SplineScene } from "@/components/ui/SplineScene";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { STAIRCASE_PATTERN } from "@/components/LogoSvg";

const SCENE_URL = "https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode";
const SUPPORT_EMAIL = "contato@bpadvogados.com.br";

type Props = {
  /** Modo "topbar": fundo onyx sólido atrás do robô + sem mixBlendMode (cor total). */
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
        {/* Fundo onyx opaco — usado quando `solido` (modo topbar) pra que o
            mixBlendMode lighten clareie sobre PRETO (igual à landing), mesmo
            quando o layout pai tem fundo translúcido ou particulas. */}
        {solido ? (
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-onyx"
          />
        ) : null}
        {/* Renderiza o canvas Spline INTEIRO em alta resolução (400x520),
            depois encolhe via CSS transform pra caber em 110x130 visualmente.
            O scene aparece em miniatura COMPLETA (robô + cubo, sem corte).
            Filter: roxo -> verde escuro + tom dourado (sepia). */}
        <div
          className="absolute left-0 top-0"
          style={{
            width: "400px",
            height: "520px",
            transform: "scale(0.275)",
            transformOrigin: "top left",
            mixBlendMode: "lighten",
            filter:
              "hue-rotate(-115deg) sepia(0.3) brightness(0.65) saturate(1.5)",
          }}
        >
          <SplineScene scene={SCENE_URL} className="h-full w-full" />
        </div>
        {/* Cobertura do watermark — barra full-width estendida ABAIXO do botão
            (canvas escalado vaza ~15px além do botão) */}
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
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={close}
                className="rounded-lg px-4 py-2 text-sm text-[var(--color-ivory-66)] transition hover:text-ivory"
              >
                Cancelar
              </button>
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
