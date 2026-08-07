"use client";

// Seção "Clientes do Portal" — Sprint 2.
// Form de cadastro (nome + tipo + documento + email + telefone) e lista
// dos credores reais com status de acesso + botão de convite.
// Server Actions com useActionState — feedback inline sem toast lib.

import { useActionState, useState } from "react";
import {
  CheckCircle2,
  Eye,
  Mail,
  Pencil,
  Send,
  UserPlus,
  Users,
  X,
  XCircle,
} from "lucide-react";

import type { CredorAdmin } from "@/lib/credores-admin";
import { formatTempoRelativo } from "@/lib/format";
import {
  atualizarClienteAction,
  cadastrarClienteAction,
  enviarConviteAction,
  type EstadoAcaoCliente,
} from "../actions";

// ------------------------------------------------------------
// Feedback inline (sucesso verde / erro vermelho)
// ------------------------------------------------------------
function Feedback({ estado }: { estado: EstadoAcaoCliente }) {
  if (!estado) return null;
  const Icone = estado.ok ? CheckCircle2 : XCircle;
  const cor = estado.ok ? "var(--color-signal)" : "#DC2626";
  return (
    <div
      className="mt-4 flex items-start gap-2 rounded-xl border px-4 py-3"
      style={{
        borderColor: `color-mix(in srgb, ${cor} 45%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${cor} 10%, transparent)`,
      }}
    >
      <Icone className="mt-0.5 h-4 w-4 shrink-0" style={{ color: cor }} />
      <p className="text-sm" style={{ color: cor }}>
        {estado.mensagem}
      </p>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] " +
  "px-4 py-3 text-sm text-ivory placeholder:text-[var(--color-ivory-40)] " +
  "focus:border-[var(--color-signal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-signal)]/30";

const labelCls =
  "block font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]";

// ------------------------------------------------------------
// Form de cadastro
// ------------------------------------------------------------
function FormNovoCliente() {
  const [estado, formAction, pendente] = useActionState(
    cadastrarClienteAction,
    null,
  );
  const [tipo, setTipo] = useState<"PF" | "PJ">("PJ");

  return (
    <form action={formAction} className="glass p-7">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-signal-soft)]">
          <UserPlus className="h-5 w-5 text-[var(--color-signal)]" />
        </div>
        <div>
          <h3 className="font-serif text-xl text-ivory">Cadastrar Novo Cliente</h3>
          <p className="text-sm text-[var(--color-ivory-66)]">
            O cliente entra no portal com o e-mail cadastrado aqui — código de
            verificação, sem senha.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {/* Tipo PF/PJ */}
        <div>
          <span className={labelCls}>Tipo</span>
          <div className="mt-2 inline-flex gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-1">
            {(["PJ", "PF"] as const).map((t) => (
              <label key={t} className="cursor-pointer">
                <input
                  type="radio"
                  name="tipo"
                  value={t}
                  checked={tipo === t}
                  onChange={() => setTipo(t)}
                  className="peer sr-only"
                />
                <span className="inline-flex items-center rounded-lg px-4 py-2 font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)] transition peer-checked:bg-[var(--color-signal)]/15 peer-checked:text-[var(--color-signal)] peer-checked:ring-1 peer-checked:ring-[var(--color-signal)]/40">
                  {t === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Documento */}
        <div>
          <label htmlFor="nc-documento" className={labelCls}>
            {tipo === "PJ" ? "CNPJ" : "CPF"}
          </label>
          <input
            id="nc-documento"
            name="documento"
            type="text"
            required
            placeholder={tipo === "PJ" ? "00.000.000/0000-00" : "000.000.000-00"}
            className={`mt-2 ${inputCls}`}
          />
        </div>

        {/* Nome */}
        <div className="md:col-span-2">
          <label htmlFor="nc-nome" className={labelCls}>
            {tipo === "PJ" ? "Razão Social" : "Nome Completo"}
          </label>
          <input
            id="nc-nome"
            name="nome"
            type="text"
            required
            maxLength={160}
            placeholder="Ex.: Irmandade da Santa Casa de Misericórdia"
            className={`mt-2 ${inputCls}`}
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="nc-email" className={labelCls}>
            E-mail de Acesso ao Portal
          </label>
          <input
            id="nc-email"
            name="email"
            type="email"
            placeholder="contato@cliente.com.br"
            className={`mt-2 ${inputCls}`}
          />
        </div>

        {/* Telefone */}
        <div>
          <label htmlFor="nc-telefone" className={labelCls}>
            Telefone
          </label>
          <input
            id="nc-telefone"
            name="telefone"
            type="tel"
            placeholder="(15) 99999-9999"
            className={`mt-2 ${inputCls}`}
          />
        </div>

        {/* Observações */}
        <div className="md:col-span-2">
          <label htmlFor="nc-obs" className={labelCls}>
            Observações (Interno)
          </label>
          <textarea
            id="nc-obs"
            name="observacoes"
            rows={2}
            placeholder="Notas internas — o cliente não vê."
            className={`mt-2 resize-y ${inputCls}`}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--color-ivory-88)]">
          <input
            type="checkbox"
            name="enviar_convite"
            defaultChecked
            className="h-4 w-4 accent-[var(--color-signal)]"
          />
          Enviar convite por e-mail ao cadastrar
        </label>
        <button type="submit" disabled={pendente} className="btn-neon-signal disabled:opacity-50">
          <UserPlus className="h-4 w-4" />
          {pendente ? "Cadastrando…" : "Cadastrar Cliente"}
        </button>
      </div>

      <Feedback estado={estado} />
    </form>
  );
}

// ------------------------------------------------------------
// Linha da lista (com edição inline)
// ------------------------------------------------------------
function LinhaCliente({ credor }: { credor: CredorAdmin }) {
  const [editando, setEditando] = useState(false);
  const [estadoConvite, conviteAction, convitePendente] = useActionState(
    enviarConviteAction,
    null,
  );
  const [estadoEdicao, edicaoAction, edicaoPendente] = useActionState(
    atualizarClienteAction,
    null,
  );

  return (
    <article className="glass-flat p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="nome-cliente font-serif text-lg text-[var(--color-cliente)]">
              {credor.nome}
            </h4>
            <span className="inline-flex items-center rounded-full border border-[var(--color-signal-soft-2)] bg-[var(--color-signal-soft)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.20em] text-[var(--color-signal)]">
              {credor.tipo}
            </span>
            {credor.tem_acesso_portal ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-signal)]/45 bg-[var(--color-signal)]/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.20em] text-[var(--color-signal)]">
                <CheckCircle2 className="h-3 w-3" />
                Portal Ativo
              </span>
            ) : credor.email_contato ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-gold)]/40 bg-[var(--color-gold)]/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.20em] text-[var(--color-gold)]">
                <Mail className="h-3 w-3" />
                Aguardando 1º Login
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-[var(--color-ivory-22)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.20em] text-[var(--color-ivory-66)]">
                Sem E-mail
              </span>
            )}
          </div>

          {!editando ? (
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[12px] text-[var(--color-ivory-66)]">
              <span>{credor.documento}</span>
              {credor.email_contato ? <span>{credor.email_contato}</span> : null}
              {credor.telefone ? <span>{credor.telefone}</span> : null}
              <span>
                {credor.total_casos}{" "}
                {credor.total_casos === 1 ? "caso" : "casos"}
              </span>
              <span>Cadastrado {formatTempoRelativo(credor.criado_em)}</span>
            </div>
          ) : (
            <form action={edicaoAction} className="mt-3 grid gap-3 md:grid-cols-3">
              <input type="hidden" name="id" value={credor.id} />
              <input
                name="nome"
                defaultValue={credor.nome}
                aria-label="Nome"
                required
                className={inputCls}
              />
              <input
                name="email"
                type="email"
                defaultValue={credor.email_contato ?? ""}
                aria-label="E-mail"
                placeholder="E-mail de acesso"
                className={inputCls}
              />
              <div className="flex gap-2">
                <input
                  name="telefone"
                  defaultValue={credor.telefone ?? ""}
                  aria-label="Telefone"
                  placeholder="Telefone"
                  className={inputCls}
                />
                <button
                  type="submit"
                  disabled={edicaoPendente}
                  className="btn-neon-signal shrink-0 disabled:opacity-50"
                >
                  {edicaoPendente ? "…" : "Salvar"}
                </button>
              </div>
            </form>
          )}
          <Feedback estado={estadoEdicao} />
          <Feedback estado={estadoConvite} />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {credor.email_contato ? (
            <a
              href={`/cliente?eu=${encodeURIComponent(credor.email_contato)}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Ver o portal como este cliente (modo visualização)"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)] px-3 font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--color-ivory-66)] transition hover:border-[var(--color-gold)]/60 hover:text-[var(--color-gold)]"
            >
              <Eye className="h-4 w-4" />
              Ver Portal
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => setEditando((e) => !e)}
            aria-label={editando ? "Cancelar edição" : "Editar cliente"}
            title={editando ? "Cancelar edição" : "Editar cliente"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)] text-[var(--color-ivory-66)] transition hover:border-[var(--color-signal-soft-2)] hover:text-[var(--color-ivory)]"
          >
            {editando ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          </button>
          {credor.email_contato && !credor.tem_acesso_portal ? (
            <form action={conviteAction}>
              <input type="hidden" name="id" value={credor.id} />
              <button
                type="submit"
                disabled={convitePendente}
                className="btn-neon-gold disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                {convitePendente ? "Enviando…" : "Enviar Convite"}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </article>
  );
}

// ------------------------------------------------------------
// Seção completa (form + lista)
// ------------------------------------------------------------
export default function ClientesPortal({ credores }: { credores: CredorAdmin[] }) {
  return (
    <section className="mt-12">
      <div className="mb-4 flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-signal-soft)]">
          <Users className="h-5 w-5 text-[var(--color-signal)]" />
        </div>
        <div>
          <h2 className="font-serif text-xl text-ivory">Clientes do Portal</h2>
          <p className="text-sm text-[var(--color-ivory-66)]">
            Cadastre o cliente, envie o convite e ele acessa o portal com o
            próprio e-mail — sem SQL, sem senha.
          </p>
        </div>
      </div>

      <FormNovoCliente />

      <div className="mt-6">
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="font-serif text-lg text-ivory">Clientes Cadastrados</h3>
          {credores.length > 0 ? (
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              {credores.length} {credores.length === 1 ? "registro" : "registros"}
            </span>
          ) : null}
        </div>

        {credores.length === 0 ? (
          <div className="glass-flat p-8 text-center">
            <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-40)]">
              Nenhum cliente real cadastrado ainda
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {credores.map((c) => (
              <LinhaCliente key={c.id} credor={c} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
