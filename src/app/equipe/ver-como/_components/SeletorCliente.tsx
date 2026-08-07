"use client";

// Lista de escolha do "Ver Como Cliente" — busca por nome/documento +
// cartão do cliente demo + clientes reais. Cliente sem e-mail cadastrado
// não tem como ser simulado (o preview resolve por credores.email_contato),
// então aparece desabilitado com atalho pras Configurações.
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText, Mail, MonitorPlay, Search } from "lucide-react";

import type { CredorAdmin } from "@/lib/credores-admin";
import { DEMO_CLIENTE_EMAIL } from "@/lib/mock-fixtures";

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export default function SeletorCliente({ credores }: { credores: CredorAdmin[] }) {
  const [busca, setBusca] = useState("");

  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim());
    const base = [...credores].sort((a, b) => {
      // Com e-mail primeiro (são os simuláveis), depois por nome.
      const aTem = a.email_contato ? 0 : 1;
      const bTem = b.email_contato ? 0 : 1;
      if (aTem !== bTem) return aTem - bTem;
      return a.nome.localeCompare(b.nome, "pt-BR");
    });
    if (!termo) return base;
    const digitos = termo.replace(/\D/g, "");
    return base.filter((c) => {
      if (normalizar(c.nome).includes(termo)) return true;
      if (digitos.length >= 3 && c.documento.replace(/\D/g, "").includes(digitos)) return true;
      return false;
    });
  }, [busca, credores]);

  return (
    <section>
      {/* Busca */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ivory-40)]" />
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar cliente por nome ou CPF/CNPJ…"
          aria-label="Buscar cliente"
          className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] py-3 pl-11 pr-4 text-sm text-ivory placeholder:text-[var(--color-ivory-40)] focus:border-[var(--color-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]/25"
        />
      </div>

      {/* Cliente Demonstração — portfólio sintético do showroom.
          Passa pelo handler /entrar como os reais: grava o cookie de
          preview e garante que sidebar/identidade sigam o demo. */}
      <Link
        href={`/equipe/ver-como/entrar?eu=${encodeURIComponent(DEMO_CLIENTE_EMAIL)}`}
        prefetch={false}
        className="glass mt-5 flex items-center justify-between gap-4 p-5 transition hover:border-[var(--color-gold)]/50"
      >
        <div className="flex min-w-0 items-center gap-4">
          <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-gold)]/12 text-[var(--color-gold)]">
            <MonitorPlay className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-serif text-lg text-ivory">Cliente Demonstração</p>
            <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
              Portfólio sintético do showroom
            </p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-[var(--color-gold)]" />
      </Link>

      {/* Clientes reais */}
      <div className="mb-3 mt-8 flex items-baseline justify-between">
        <h2 className="font-serif text-lg text-ivory">Clientes Reais</h2>
        <span className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
          {filtrados.length} {filtrados.length === 1 ? "cliente" : "clientes"}
        </span>
      </div>

      {filtrados.length === 0 ? (
        <div className="glass-flat p-8 text-center">
          <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-40)]">
            Nenhum cliente encontrado
          </p>
        </div>
      ) : (
        <ul className="grid gap-2.5">
          {filtrados.map((c) => {
            const docLabel = c.tipo === "PF" ? "CPF" : "CNPJ";
            const conteudo = (
              <>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="nome-cliente truncate font-serif text-lg text-[var(--color-cliente)]">
                      {c.nome}
                    </p>
                    <span className="inline-flex shrink-0 items-center rounded-full border border-[var(--color-ivory-22)] bg-[var(--color-surface-2)]/60 px-2 py-0.5 font-mono text-[12px] uppercase tracking-[0.20em] text-[var(--color-ivory-66)]">
                      {c.tipo}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[12px] text-[var(--color-ivory-66)]">
                    <span>
                      {docLabel} {c.documento}
                    </span>
                    {c.total_casos > 0 ? (
                      <span className="inline-flex items-center gap-1.5">
                        <FileText className="h-3 w-3 text-[var(--color-signal)]/70" />
                        {c.total_casos} {c.total_casos === 1 ? "caso" : "casos"}
                      </span>
                    ) : null}
                    {c.email_contato ? (
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate">{c.email_contato}</span>
                      </span>
                    ) : null}
                  </div>
                </div>
                {c.email_contato ? (
                  <span className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--color-gold)]">
                    Ver Portal <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                ) : (
                  <span className="shrink-0 text-right font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--color-ivory-40)]">
                    Sem e-mail —{" "}
                    <Link
                      href="/equipe/configuracoes"
                      className="text-[var(--color-signal)] hover:underline"
                    >
                      cadastrar
                    </Link>
                  </span>
                )}
              </>
            );

            return (
              <li key={c.id}>
                {c.email_contato ? (
                  <Link
                    href={`/equipe/ver-como/entrar?eu=${encodeURIComponent(c.email_contato)}`}
                    prefetch={false}
                    className="glass-flat flex items-center justify-between gap-4 p-4 transition hover:border-[var(--color-gold)]/50"
                  >
                    {conteudo}
                  </Link>
                ) : (
                  <div className="glass-flat flex items-center justify-between gap-4 p-4 opacity-70">
                    {conteudo}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-6 text-xs text-[var(--color-ivory-66)]">
        A simulação usa o e-mail de acesso do cliente. Cliente sem e-mail ainda
        não tem portal — cadastre o e-mail em Configurações &gt; Clientes do
        Portal pra habilitar a visualização (e o convite).
      </p>
    </section>
  );
}
