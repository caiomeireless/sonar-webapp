"use client";

// Menu radial de GOMOS (roda segmentada) — portado do BP Internal
// (radial-hub) pro tema do Sonar: anel externo dourado, fatias em vidro
// escuro, ícone + rótulo por gomo e a FOTO DO USUÁRIO no centro.
// Estático de propósito: alvo que gira é difícil de clicar.
// Tudo escala com `size`; em `compacto` os rótulos usam o campo `curto`.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";

export interface ItemRadial {
  href: string;
  label: string; // rótulo completo (roda grande)
  curto?: string; // legenda breve pro modo compacto (roda pequena)
  icon: LucideIcon;
}

const START_ANGLE = -90;
// Mesma chave da foto do TopBar (localStorage) — fallback quando o perfil
// não tem foto salva no servidor.
const FOTO_STORAGE_KEY = "sonar-user-photo";

function polar(radius: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius };
}

function slicePath(index: number, total: number, outer: number, inner: number) {
  if (total <= 0) return "";
  if (total === 1) {
    return `M ${outer} 0 A ${outer} ${outer} 0 1 1 ${-outer} 0 A ${outer} ${outer} 0 1 1 ${outer} 0
            M ${inner} 0 A ${inner} ${inner} 0 1 0 ${-inner} 0 A ${inner} ${inner} 0 1 0 ${inner} 0`;
  }
  const fatia = 360 / total;
  const meio = START_ANGLE + fatia * index;
  const ini = meio - fatia / 2;
  const fim = meio + fatia / 2;
  const oIni = polar(outer, ini);
  const oFim = polar(outer, fim);
  const iIni = polar(inner, ini);
  const iFim = polar(inner, fim);
  const arcoGrande = fatia > 180 ? 1 : 0;
  return `M ${oIni.x} ${oIni.y}
          A ${outer} ${outer} 0 ${arcoGrande} 1 ${oFim.x} ${oFim.y}
          L ${iFim.x} ${iFim.y}
          A ${inner} ${inner} 0 ${arcoGrande} 0 ${iIni.x} ${iIni.y} Z`;
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  return ((partes[0][0] ?? "") + (partes[partes.length - 1][0] ?? "")).toUpperCase();
}

export default function RadialHub({
  itens,
  nome,
  fotoUrl,
  size = 460,
  compacto = false,
  paleta = "gold",
  escalaFonte = 1,
  onCentroClick,
}: {
  itens: ItemRadial[];
  nome: string;
  fotoUrl?: string | null;
  size?: number;
  compacto?: boolean;
  /** "gold" (padrão da plataforma) ou "verde" neon (Console do Início). */
  paleta?: "gold" | "verde";
  /** Multiplicador do tamanho das letras dos gomos (Início usa >1). */
  escalaFonte?: number;
  onCentroClick?: () => void;
}) {
  const router = useRouter();
  const [ativo, setAtivo] = useState<number | null>(null);
  const [foto, setFoto] = useState<string | null>(fotoUrl ?? null);

  // Fallback: foto carregada pelo usuário no menu do avatar (localStorage).
  useEffect(() => {
    if (fotoUrl) return;
    try {
      const cached = localStorage.getItem(FOTO_STORAGE_KEY);
      if (cached) setFoto(cached);
    } catch {
      // sem localStorage — fica nas iniciais
    }
  }, [fotoUrl]);

  const raio = size / 2;
  const anelExt = raio; // anel externo fino (dourado)
  const anelInt = raio - Math.max(3, size * 0.014);
  const bandaExt = anelInt - Math.max(3, size * 0.014); // banda dos gomos
  const bandaInt = raio * 0.42;
  const raioIcones = (bandaExt + bandaInt) / 2;
  const raioCentro = bandaInt - Math.max(5, size * 0.024); // foto do usuário

  // escalaFonte também alarga a caixa (senão a letra maior clipa no gomo).
  const CAIXA = Math.round(size * 0.222 * Math.min(1.25, escalaFonte));
  const icone = Math.max(14, Math.round(size * 0.048));
  const fonte = Math.max(8, Math.round(size * 0.0242 * escalaFonte));
  const clipId = `radial-centro-${compacto ? "c" : "g"}`;

  // Paleta da roda — gold (padrão) ou verde neon (Console do Início).
  const P =
    paleta === "verde"
      ? {
          halo: "rgba(60,255,138,0.05)",
          fatiaOn: "var(--color-signal)",
          fatiaOff: "rgba(60,255,138,0.30)",
          bandaOn: "rgba(60,255,138,0.16)",
          bordaOn: "rgba(60,255,138,0.55)",
          destaque: "var(--color-signal)",
          aroCentro: "rgba(60,255,138,0.40)",
          centroBg: "rgba(60,255,138,0.12)",
        }
      : {
          halo: "rgba(201,162,74,0.05)",
          fatiaOn: "var(--color-gold)",
          fatiaOff: "rgba(201,162,74,0.30)",
          bandaOn: "rgba(201,162,74,0.16)",
          bordaOn: "rgba(201,162,74,0.55)",
          destaque: "var(--color-gold)",
          aroCentro: "rgba(201,162,74,0.40)",
          centroBg: "rgba(201,162,74,0.12)",
        };

  return (
    <div className="relative select-none" style={{ width: size, height: size }}>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`${-raio} ${-raio} ${size} ${size}`}
      >
        <defs>
          <clipPath id={clipId}>
            <circle cx={0} cy={0} r={raioCentro} />
          </clipPath>
        </defs>

        {/* halo atrás da roda */}
        <circle cx={0} cy={0} r={raio * 0.9} fill={P.halo} />

        {itens.map((item, i) => {
          const Icon = item.icon;
          const meio = START_ANGLE + (360 / itens.length) * i;
          const p = polar(raioIcones, meio);
          const on = ativo === i;
          return (
            <g
              key={item.href}
              className="cursor-pointer"
              onClick={() => router.push(item.href)}
              onMouseEnter={() => setAtivo(i)}
              onMouseLeave={() => setAtivo(null)}
            >
              <title>{item.label}</title>
              {/* anel externo do gomo */}
              <path
                d={slicePath(i, itens.length, anelExt, anelInt)}
                fill={on ? P.fatiaOn : P.fatiaOff}
                style={{ transition: "fill .15s" }}
              />
              {/* banda principal */}
              <path
                d={slicePath(i, itens.length, bandaExt, bandaInt)}
                fill={on ? P.bandaOn : "rgba(8,10,9,0.92)"}
                stroke={on ? P.bordaOn : "var(--color-line)"}
                strokeWidth={1}
                style={{ transition: "fill .15s, stroke .15s" }}
              />
              <foreignObject
                x={p.x - CAIXA / 2}
                y={p.y - CAIXA / 2}
                width={CAIXA}
                height={CAIXA}
                className="pointer-events-none"
              >
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-center">
                  <Icon
                    style={{
                      width: icone,
                      height: icone,
                      color: on ? P.destaque : "var(--color-ivory-88)",
                    }}
                  />
                  <span
                    className="px-0.5 font-medium leading-tight"
                    style={{
                      fontSize: fonte,
                      color: on ? P.destaque : "var(--color-ivory-66)",
                    }}
                  >
                    {compacto ? (item.curto ?? item.label) : item.label}
                  </span>
                </div>
              </foreignObject>
            </g>
          );
        })}

        {/* centro: foto do usuário */}
        <g
          className={onCentroClick ? "cursor-pointer" : undefined}
          onClick={onCentroClick}
        >
          {onCentroClick && <title>Ir para o Início</title>}
          <circle
            cx={0}
            cy={0}
            r={raioCentro + 5}
            fill="var(--color-surface-2)"
            stroke={P.aroCentro}
            strokeWidth={2}
          />
          {foto ? (
            <image
              href={foto}
              x={-raioCentro}
              y={-raioCentro}
              width={raioCentro * 2}
              height={raioCentro * 2}
              clipPath={`url(#${clipId})`}
              preserveAspectRatio="xMidYMid slice"
            />
          ) : (
            <>
              <circle cx={0} cy={0} r={raioCentro} fill={P.centroBg} />
              <text
                x={0}
                y={0}
                textAnchor="middle"
                dominantBaseline="central"
                className="font-serif"
                fill={P.destaque}
                style={{ fontSize: raioCentro * 0.6, fontWeight: 600 }}
              >
                {iniciais(nome)}
              </text>
            </>
          )}
        </g>
      </svg>
    </div>
  );
}
