"use client";

// Topbar global das áreas autenticadas (Equipe + Cliente).
//
// Estrutura (reforma 09/08):
//   - Esquerda: LOGO da plataforma, grande (títulos de página saíram).
//   - Direita: Sincronizar, sino, avatar com dropdown (foto, modo de
//     navegação lateral/radial, ver como cliente, Sair).

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera, ChevronDown, CircleDot, Eye, LogOut, PanelLeft, RefreshCw, Trash2 } from "lucide-react";

import { AssistantBot } from "./AssistantBot";
import { LogoSvg } from "./LogoSvg";
import { BordaLiquidaMetal } from "./ui/BordaLiquidaMetal";
import { SinoNotificacoes } from "./SinoNotificacoes";
import { gravarNavModo, useNavModo } from "./ui/use-nav-modo";
import type { Notificacao } from "@/lib/notificacoes";

const FOTO_STORAGE_KEY = "sonar-user-photo";

type Usuario = { email: string; papel: string };


export function TopBar({
  usuario,
  portal,
  notificacoes,
  naoLidas,
  emailCliente,
}: {
  usuario: Usuario;
  portal: "equipe" | "cliente";
  notificacoes: Notificacao[];
  naoLidas: number;
  emailCliente?: string | null;
}) {
  const inicial = (usuario.email[0] || "?").toUpperCase();

  return (
    <header className="relative sticky top-0 z-20 border-b border-[var(--color-line)] bg-onyx">
      {/* Quadriculado verde com fade diagonal — EXATAMENTE igual à faixa
          superior da landing page. Background-attachment: fixed pra que
          as linhas se ALINHEM com o grid do header da sidebar (que também
          usa fixed), formando uma faixa contínua sem emendas.
          Wrapper interno tem overflow-hidden pra conter o bg-grid sem
          cortar dropdowns/popovers que pertencem ao header. */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="bg-grid-strong animate-grid-pulse absolute inset-0"
        style={{
          backgroundAttachment: "fixed",
          // Fade horizontal: brilho FORTE na ESQUERDA, apaga em direção
          // à direita. (to right = começa pleno na esquerda, transparente na direita)
          maskImage:
            "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.55) 45%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.55) 45%, transparent 100%)",
        }}
        aria-hidden="true"
      />
      </div>
      {/* Luz signal radial no canto esquerdo — funde com o bg-grid da
          sidebar e dá o "ponto de brilho" na junção sidebar+topbar.
          Alpha reduzido em 50% (0.20 -> 0.10). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 480px 220px at 12% 50%, rgba(60,255,138,0.10), transparent 70%)",
        }}
      />
      {/* Vinheta lateral: SÓ escurece a borda DIREITA (onde o quadriculado
          some no fade). Esquerda fica transparente pra que o bg-grid
          continue visualmente o quadriculado da sidebar header. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, transparent 82%, rgba(10,12,11,0.85) 100%)",
        }}
        aria-hidden="true"
      />

      {/* +30% de altura (122 -> 159, pedido 09/08). Título/subtítulo da
          página SAÍRAM — no lugar, o logo da plataforma (o mesmo que vivia
          no nav lateral) grande no canto esquerdo. Como a faixa começa
          DEPOIS do aside no flex do layout, o logo nunca fica embaixo do
          nav lateral aberto. */}
      <div className="relative flex min-h-[159px] items-center pl-6 pr-3 sm:pl-10 sm:pr-4">
        <Link
          href={portal === "equipe" ? "/equipe/inicio" : "/cliente"}
          className="inline-flex items-center rounded-lg outline-none transition
                     focus-visible:ring-2 focus-visible:ring-[var(--color-signal)]"
          aria-label="Sonar — página inicial"
        >
          <LogoSvg height={118} />
        </Link>

        {/* Direita: tudo agrupado — robô + Sincronizar + Sino + Avatar.
            Aproximado da borda direita (pr-3/4) pra empurrar o robo pra
            longe do titulo centralizado. */}
        <div className="ml-auto flex items-center gap-3">
          <AssistantBot solido />
          <BotaoSincronizar />
          <SinoNotificacoes
            portal={portal}
            notificacoes={notificacoes}
            naoLidas={naoLidas}
            emailCliente={emailCliente}
          />
          <AvatarMenu usuario={usuario} inicial={inicial} portal={portal} />
        </div>
      </div>
    </header>
  );
}

// --------------------------------------------------------------------------

function BotaoSincronizar() {
  const [girando, setGirando] = useState(false);

  function sincronizar() {
    if (girando) return;
    setGirando(true);
    // Placeholder: ação real vem com integração Themis (Sem 2-8).
    // Aqui só simula o feedback visual.
    setTimeout(() => setGirando(false), 1400);
  }

  // Borda metal líquido (shader) VERDE — pedido do Caio 21/08: o botão
  // continua verde, a borda ganha o efeito. Único canvas WebGL da faixa 1.
  return (
    <BordaLiquidaMetal cor="signal" radius={14} className="inline-flex">
      <button
        type="button"
        onClick={sincronizar}
        className="
          inline-flex h-full w-full items-center gap-2.5 rounded-[11px]
          bg-[var(--color-signal-soft)] px-5 py-3 text-sm font-medium text-[var(--color-signal)]
          transition hover:bg-[var(--color-signal-soft-2)]
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-signal)]
        "
      >
        <RefreshCw
          className={`h-5 w-5 ${girando ? "animate-spin" : ""}`}
          aria-hidden="true"
        />
        Sincronizar
      </button>
    </BordaLiquidaMetal>
  );
}

// --------------------------------------------------------------------------

function AvatarMenu({
  usuario,
  inicial,
  portal,
}: {
  usuario: Usuario;
  inicial: string;
  portal: "equipe" | "cliente";
}) {
  const [aberto, setAberto] = useState(false);
  const navModo = useNavModo();
  const [foto, setFoto] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Carrega foto salva em localStorage no primeiro mount.
  useEffect(() => {
    try {
      const cached = localStorage.getItem(FOTO_STORAGE_KEY);
      if (cached) setFoto(cached);
    } catch {
      // localStorage indisponível — segue com fallback inicial.
    }
  }, []);

  // Fecha ao clicar fora.
  useEffect(() => {
    if (!aberto) return;
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [aberto]);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2_000_000) {
      alert("Imagem grande demais (máx. 2 MB). Comprima ou redimensione antes.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setFoto(url);
      try {
        localStorage.setItem(FOTO_STORAGE_KEY, url);
      } catch {
        // localStorage cheio ou indisponível — segue só em memória.
      }
    };
    reader.readAsDataURL(file);
  }

  function removerFoto() {
    setFoto(null);
    try {
      localStorage.removeItem(FOTO_STORAGE_KEY);
    } catch {
      /* ignora */
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-haspopup="menu"
        aria-expanded={aberto}
        className="
          inline-flex items-center gap-2 rounded-full border border-[var(--color-line)]
          bg-[var(--color-surface-2)] py-1.5 pl-1.5 pr-3 transition
          hover:border-[var(--color-signal-soft-2)]
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-signal-soft-2)]
        "
      >
        <span
          className="
            flex h-12 w-12 items-center justify-center overflow-hidden rounded-full
            bg-[var(--color-signal-soft)] text-[18px] font-semibold text-[var(--color-signal)]
          "
        >
          {foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={foto}
              alt="Foto do usuário"
              className="h-full w-full object-cover"
            />
          ) : (
            inicial
          )}
        </span>
        <ChevronDown
          className={`h-5 w-5 text-[var(--color-fg-muted)] transition ${aberto ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {aberto && (
        <div
          className="
            absolute right-0 mt-2 w-[260px] overflow-hidden rounded-xl border
            border-[var(--color-line)] bg-[var(--color-surface-solid)] shadow-2xl
          "
        >
          {/* Upload da foto de perfil — persistida em localStorage. */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="
              flex w-full items-center gap-2 border-b border-[var(--color-line)]
              px-4 py-2.5 text-left text-sm text-[var(--color-ivory-88)] transition
              hover:bg-[var(--color-surface-2)] hover:text-[var(--color-signal)]
            "
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
            {foto ? "Trocar foto" : "Carregar foto do escritório"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            aria-label="Carregar foto do usuário"
            title="Carregar foto do usuário"
            className="hidden"
            onChange={handleUpload}
          />
          {foto && (
            <button
              type="button"
              onClick={removerFoto}
              className="
                flex w-full items-center gap-2 border-b border-[var(--color-line)]
                px-4 py-2.5 text-left text-sm text-[var(--color-ivory-88)] transition
                hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]
              "
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Remover foto
            </button>
          )}

          {/* Modo de navegação (só equipe): nav lateral clássico OU menu
              radial (o lateral some e a roda flutuante assume). */}
          {portal === "equipe" && (
            <div className="border-b border-[var(--color-line)] px-4 py-2.5">
              <p className="mb-2 font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
                Modo de Navegação
              </p>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => gravarNavModo("lateral")}
                  aria-pressed={navModo === "lateral"}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs transition ${
                    navModo === "lateral"
                      ? "border-[var(--color-signal)]/60 bg-[var(--color-signal-soft)] text-[var(--color-signal)]"
                      : "border-[var(--color-line)] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)]"
                  }`}
                >
                  <PanelLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  Nav Lateral
                </button>
                <button
                  type="button"
                  onClick={() => gravarNavModo("radial")}
                  aria-pressed={navModo === "radial"}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs transition ${
                    navModo === "radial"
                      ? "border-[var(--color-gold)]/60 bg-[var(--color-gold)]/12 text-[var(--color-gold)]"
                      : "border-[var(--color-line)] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)]"
                  }`}
                >
                  <CircleDot className="h-3.5 w-3.5" aria-hidden="true" />
                  Menu Radial
                </button>
              </div>
            </div>
          )}

          {/* Admin/Sócio: abre a tela de escolha do Ver Como Cliente. */}
          {(usuario.papel === "ADMIN" || usuario.papel === "SOCIO") && (
            <Link
              href="/equipe/ver-como"
              className="
                flex items-center gap-2 border-b border-[var(--color-line)]
                px-4 py-2.5 text-sm text-[var(--color-fg-muted)] transition
                hover:bg-[var(--color-surface-2)] hover:text-[var(--color-signal)]
              "
              onClick={() => setAberto(false)}
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
              Visualizar como cliente
            </Link>
          )}

          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="
                flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm
                text-[var(--color-fg-muted)] transition
                hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]
              "
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sair
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
