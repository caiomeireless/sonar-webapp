"use client";

// Topbar global das áreas autenticadas (Equipe + Cliente).
//
// Estrutura:
//   - Esquerda/centro: título + subtítulo da página corrente (mapa pathname→título).
//   - Direita: botão Sincronizar (placeholder visual, ação real virá com
//     integração Themis), sino de notificações (placeholder) e avatar
//     do usuário com dropdown (e-mail + Sair).
//
// Inspirada no BP CRM. Cores Sonar.

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Camera, ChevronDown, Eye, LogOut, RefreshCw, Trash2 } from "lucide-react";

import { AssistantBot } from "./AssistantBot";
import { SinoNotificacoes } from "./SinoNotificacoes";
import type { Notificacao } from "@/lib/notificacoes";

const FOTO_STORAGE_KEY = "sonar-user-photo";

type Usuario = { email: string; papel: string };

type TitulosMap = Record<string, { titulo: string; subtitulo?: string }>;

const TITULOS_EQUIPE: TitulosMap = {
  "/equipe": {
    titulo: "Dashboard",
    subtitulo: "Visão geral da carteira do escritório",
  },
  "/equipe/devedores": {
    titulo: "Banco de Devedores",
    subtitulo: "Carteira hierárquica de clientes e casos",
  },
  "/equipe/themis": {
    titulo: "Fila Themis",
    subtitulo: "Execuções aguardando rastreamento patrimonial",
  },
  "/equipe/custos": {
    titulo: "Monitor de Custos",
    subtitulo: "Gastos com APIs por advogado, cliente e devedor",
  },
  "/equipe/configuracoes": {
    titulo: "Configurações",
    subtitulo: "Administração da plataforma",
  },
  "/equipe/notificacoes": {
    titulo: "Central de Notificações",
    subtitulo: "Eventos do escritório em ordem cronológica",
  },
};

const TITULOS_CLIENTE: TitulosMap = {
  "/cliente": {
    titulo: "Dashboard",
    subtitulo: "Visão geral dos seus processos",
  },
  "/cliente/casos": {
    titulo: "Meus Casos",
    subtitulo: "Acompanhamento patrimonial dos seus processos",
  },
  "/cliente/consultas": {
    titulo: "Consultas Pré-Processuais",
    subtitulo: "Análises de viabilidade preventivas",
  },
  "/cliente/custos": {
    titulo: "Monitor de Custos",
    subtitulo: "Quanto está sendo investido na sua carteira",
  },
  "/cliente/sugestoes": {
    titulo: "Sugestões e Dúvidas",
    subtitulo: "Fale com o escritório",
  },
  "/cliente/preferencias": {
    titulo: "Preferências",
    subtitulo: "Limites de gasto e regras de consulta",
  },
  "/cliente/notificacoes": {
    titulo: "Central de Notificações",
    subtitulo: "Tudo que aconteceu na sua carteira",
  },
};

function resolverTitulo(
  pathname: string,
  mapa: TitulosMap,
): { titulo: string; subtitulo?: string } {
  // Match exato primeiro, depois maior prefixo.
  if (mapa[pathname]) return mapa[pathname];
  const chaves = Object.keys(mapa).sort((a, b) => b.length - a.length);
  const k = chaves.find((c) => pathname.startsWith(c + "/"));
  if (k) return mapa[k];
  // Fallback inteligente por contexto.
  if (pathname.startsWith("/equipe/devedores")) {
    return mapa["/equipe/devedores"] ?? { titulo: "Devedores" };
  }
  if (pathname.startsWith("/equipe")) {
    return { titulo: "Sonar", subtitulo: "Plataforma" };
  }
  if (pathname.startsWith("/cliente")) {
    return { titulo: "Dashboard" };
  }
  return { titulo: "Sonar" };
}

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
  const pathname = usePathname();
  const mapa = portal === "equipe" ? TITULOS_EQUIPE : TITULOS_CLIENTE;
  const { titulo, subtitulo } = resolverTitulo(pathname, mapa);

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

      <div className="relative flex min-h-[122px] items-center px-6 sm:px-10">
        {/* Centro absoluto: título + subtítulo, centralizados horizontal
            e vertical, independentes do conteúdo lateral. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <h1 className="font-serif text-2xl font-medium uppercase tracking-[0.06em] text-[var(--color-fg)] sm:text-[28px]">
            {titulo}
          </h1>
          {subtitulo ? (
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-muted)]">
              {subtitulo}
            </p>
          ) : null}
        </div>

        {/* Direita: tudo agrupado — robô + Sincronizar + Sino + Avatar */}
        <div className="ml-auto flex items-center gap-3">
          <AssistantBot solido />
          <BotaoSincronizar />
          <SinoNotificacoes
            portal={portal}
            notificacoes={notificacoes}
            naoLidas={naoLidas}
            emailCliente={emailCliente}
          />
          <AvatarMenu usuario={usuario} inicial={inicial} />
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

  return (
    <button
      type="button"
      onClick={sincronizar}
      className="
        inline-flex items-center gap-2.5 rounded-xl border border-[var(--color-signal-soft-2)]
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
  );
}

// --------------------------------------------------------------------------

function AvatarMenu({
  usuario,
  inicial,
}: {
  usuario: Usuario;
  inicial: string;
}) {
  const [aberto, setAberto] = useState(false);
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

          {/* Admin/Sócio: pode entrar na visão do cliente demo (banner mostra
              que está em modo visualização). */}
          {(usuario.papel === "ADMIN" || usuario.papel === "SOCIO") && (
            <Link
              href="/cliente?eu=cliente.demo@battaglia.com.br"
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
