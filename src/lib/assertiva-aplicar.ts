// Aplica o resultado das consultas Assertiva no domínio do Sonar —
// server-only. Chamado pelas Server Actions do dossiê do devedor.
//
// REGRA [[assertiva-camada-paralela]]: dado da Assertiva NUNCA sobrescreve
// valor já preenchido (manual ou de outra fonte). Só completa o que está
// vazio. Achados viram bens_encontrados com fonte='Assertiva' e dedup por
// título — rodar 2x não duplica.

import { createAdminClient } from "@/lib/supabase/admin";
import { registrarCusto } from "@/lib/custos";
import { estimarValorFipe } from "@/lib/fipe";
import {
  consultarLocalize,
  consultarVeiculos,
  tipoDocumento,
  type ResultadoAssertiva,
} from "@/lib/assertiva";

if (typeof window !== "undefined") {
  throw new Error("lib/assertiva-aplicar.ts e server-only.");
}

// ---------------------------------------------------------------------------
// Helpers de parsing (shape Localize v3 — validado no BP CRM)
// ---------------------------------------------------------------------------

function asObj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}
function asArr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function asStr(v: unknown): string {
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v);
}
function soDigitos(s: string): string {
  return (s ?? "").replace(/\D/g, "");
}

// dd/mm/aaaa (Assertiva) -> aaaa-mm-dd (coluna date). Devolve null se
// nao parsear — melhor faltar do que gravar lixo.
function paraDataISO(s: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

interface ExtraidoLocalize {
  rg: string;
  dataNascimento: string | null;
  nomeMae: string;
  telefones: { numero: string; whatsapp: boolean }[];
  emails: string[];
  enderecos: {
    titulo: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  }[];
  participacoes: { cnpj: string; razaoSocial: string; cargo: string }[];
  redesSociais: string[];
}

export function extrairLocalize(json: Record<string, unknown>): ExtraidoLocalize {
  const resp = asObj(json.resposta);
  const dc = asObj(resp.dadosCadastrais);

  const telefones: ExtraidoLocalize["telefones"] = [];
  const tel = asObj(resp.telefones);
  for (const arr of [asArr(tel.moveis), asArr(tel.fixos)]) {
    for (const item of arr) {
      const o = asObj(item);
      const numero = soDigitos(asStr(o.numero));
      if (numero.length < 10) continue;
      const apps = asObj(o.aplicativos);
      telefones.push({
        numero,
        whatsapp: apps.whatsApp === true || apps.whatsAppBusiness === true,
      });
    }
  }

  const emails: string[] = [];
  for (const item of asArr(resp.emails)) {
    const e = asStr(asObj(item).email).toLowerCase();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && !emails.includes(e)) emails.push(e);
  }

  const enderecos: ExtraidoLocalize["enderecos"] = [];
  for (const item of asArr(resp.enderecos)) {
    const o = asObj(item);
    const logradouro = [asStr(o.tipoLogradouro), asStr(o.logradouro)]
      .filter(Boolean)
      .join(" ");
    const cidade = asStr(o.cidade);
    const uf = asStr(o.uf);
    if (!logradouro && !cidade) continue;
    const numero = asStr(o.numero);
    const titulo = [logradouro, numero, cidade && `${cidade}/${uf}`]
      .filter(Boolean)
      .join(", ");
    enderecos.push({
      titulo,
      logradouro,
      numero,
      complemento: asStr(o.complemento),
      bairro: asStr(o.bairro),
      cidade,
      uf,
      cep: asStr(o.cep),
    });
  }

  const participacoes: ExtraidoLocalize["participacoes"] = [];
  for (const item of asArr(resp.participacoesEmpresas)) {
    const o = asObj(item);
    const cnpj = soDigitos(asStr(o.cnpj));
    const razaoSocial = asStr(o.razaoSocial);
    if (!cnpj && !razaoSocial) continue;
    participacoes.push({ cnpj, razaoSocial, cargo: asStr(o.cargo) });
  }

  const redesSociais = asArr(resp.redesSociais)
    .map((item) => asStr(asObj(item).url))
    .filter(Boolean);

  return {
    rg: asStr(dc.rg),
    dataNascimento: paraDataISO(asStr(dc.dataNascimento)),
    nomeMae: asStr(dc.maeNome) || asStr(dc.nomeMae),
    telefones,
    emails,
    enderecos,
    participacoes,
    redesSociais,
  };
}

// ---------------------------------------------------------------------------
// Dedup de bens: nao recria bem Assertiva com o mesmo titulo
// ---------------------------------------------------------------------------

async function titulosExistentes(
  devedorId: number,
  tipo: string,
): Promise<Set<string>> {
  const sb = createAdminClient();
  const { data } = await sb
    .from("bens_encontrados")
    .select("titulo")
    .eq("devedor_id", devedorId)
    .eq("tipo", tipo)
    .limit(1000);
  return new Set((data ?? []).map((b) => (b.titulo as string).toLowerCase()));
}

// ---------------------------------------------------------------------------
// Enriquecer dados (Localize)
// ---------------------------------------------------------------------------

export type ResultadoAplicacao =
  | {
      ok: true;
      custoBrl: number;
      doCache: boolean;
      camposPreenchidos: string[];
      bensNovos: number;
    }
  | { ok: false; mensagem: string };

export async function enriquecerDevedor(input: {
  devedorId: number;
  email: string;
  credorId?: number | null;
}): Promise<ResultadoAplicacao> {
  const sb = createAdminClient();

  const { data: devedor } = await sb
    .from("devedores")
    .select("*")
    .eq("id", input.devedorId)
    .maybeSingle();
  if (!devedor) return { ok: false, mensagem: "Devedor não encontrado." };

  const documento = devedor.documento as string;
  if (!tipoDocumento(documento)) {
    return {
      ok: false,
      mensagem: "Devedor sem CPF/CNPJ válido — a Assertiva consulta por documento.",
    };
  }

  const resultado: ResultadoAssertiva = await consultarLocalize({
    documento,
    email: input.email,
  });
  if (!resultado.ok) return { ok: false, mensagem: resultado.mensagem };

  const ext = extrairLocalize(resultado.dados);

  // 1. Completa campos VAZIOS do devedor (nunca sobrescreve).
  const updates: Record<string, string> = {};
  const camposPreenchidos: string[] = [];
  // Campos cujo valor atual JA bate com o da Assertiva (ex.: devedor
  // enriquecido antes da migration 021) ganham a etiqueta retroativa.
  const origemRetroativa: string[] = [];
  const d = devedor as Record<string, unknown>;
  const preenche = (coluna: string, valor: string | null, rotulo: string) => {
    if (!valor) return;
    const atual = asStr(d[coluna]);
    if (atual) {
      if (atual === valor) origemRetroativa.push(coluna);
      return;
    }
    updates[coluna] = valor;
    camposPreenchidos.push(rotulo);
  };

  const telPrincipal =
    ext.telefones.find((t) => t.whatsapp)?.numero ?? ext.telefones[0]?.numero ?? null;
  preenche("telefone", telPrincipal, "telefone");
  preenche("email", ext.emails[0] ?? null, "e-mail");
  preenche("rg", ext.rg || null, "RG");
  preenche("nome_mae", ext.nomeMae || null, "nome da mãe");
  preenche("data_nascimento", ext.dataNascimento, "data de nascimento");
  preenche("redes_sociais", ext.redesSociais.slice(0, 3).join(" · ") || null, "redes sociais");

  if (Object.keys(updates).length > 0 || origemRetroativa.length > 0) {
    updates.atualizado_em = new Date().toISOString();

    // Etiquetas da ficha: registra que ESTES campos vieram da Assertiva
    // (migration 021). Merge com o mapa existente pra nao apagar origem
    // de campos preenchidos por outra fonte.
    const origemAtual =
      (d.origem_campos as Record<string, string> | null | undefined) ?? {};
    const origemNova = { ...origemAtual };
    for (const coluna of Object.keys(updates)) {
      if (coluna === "atualizado_em") continue;
      origemNova[coluna] = "assertiva";
    }
    for (const coluna of origemRetroativa) {
      if (!origemNova[coluna]) origemNova[coluna] = "assertiva";
    }

    const { error } = await sb
      .from("devedores")
      .update({ ...updates, origem_campos: origemNova })
      .eq("id", input.devedorId);
    if (error) {
      // Coluna origem_campos (mig 021) ou colunas de contato (mig 020)
      // podem nao existir ainda — degrada em etapas.
      const semOrigem = await sb
        .from("devedores")
        .update(updates)
        .eq("id", input.devedorId);
      if (semOrigem.error) {
        const baseOnly: Record<string, string> = {};
        for (const k of ["nome_mae", "data_nascimento", "atualizado_em"]) {
          if (updates[k]) baseOnly[k] = updates[k];
        }
        if (Object.keys(baseOnly).length > 0) {
          await sb.from("devedores").update(baseOnly).eq("id", input.devedorId);
        }
      }
    }
  }

  // 2. Endereços novos viram bens tipo 'endereco' (dedup por título).
  let bensNovos = 0;
  if (ext.enderecos.length > 0) {
    const vistos = await titulosExistentes(input.devedorId, "endereco");
    const inserir = ext.enderecos
      .filter((e) => !vistos.has(e.titulo.toLowerCase()))
      .slice(0, 10)
      .map((e) => ({
        devedor_id: input.devedorId,
        tipo: "endereco",
        fonte: "Assertiva",
        titulo: e.titulo,
        detalhes: {
          logradouro: e.logradouro,
          numero: e.numero,
          complemento: e.complemento,
          bairro: e.bairro,
          cidade: e.cidade,
          uf: e.uf,
          cep: e.cep,
        },
        ativo: true,
      }));
    if (inserir.length > 0) {
      const { error } = await sb.from("bens_encontrados").insert(inserir);
      if (!error) bensNovos += inserir.length;
    }
  }

  // 3. Participações societárias viram bens tipo 'empresa'.
  if (ext.participacoes.length > 0) {
    const vistos = await titulosExistentes(input.devedorId, "empresa");
    const inserir = ext.participacoes
      .filter((p) => {
        const titulo = (p.razaoSocial || p.cnpj).toLowerCase();
        return titulo && !vistos.has(titulo);
      })
      .slice(0, 10)
      .map((p) => ({
        devedor_id: input.devedorId,
        tipo: "empresa",
        fonte: "Assertiva",
        titulo: p.razaoSocial || p.cnpj,
        detalhes: {
          cnpj: p.cnpj,
          razao_social: p.razaoSocial,
          qual_participacao: p.cargo,
        },
        ativo: true,
      }));
    if (inserir.length > 0) {
      const { error } = await sb.from("bens_encontrados").insert(inserir);
      if (!error) bensNovos += inserir.length;
    }
  }

  // 4. Custo real (só quando NÃO veio do cache) + timestamp da consulta.
  if (!resultado.doCache && resultado.custoBrl > 0) {
    await registrarCusto({
      email: input.email,
      tipo: (devedor.tipo as string) === "PF" ? "assertiva-pf" : "assertiva-pj",
      descricao: `Localize ${devedor.tipo} ${documento} — ${devedor.nome}`,
      custo: resultado.custoBrl,
      devedorId: input.devedorId,
      credorId: input.credorId ?? null,
    });
  }
  await sb
    .from("devedores")
    .update({ ultima_consulta_em: new Date().toISOString() })
    .eq("id", input.devedorId);

  return {
    ok: true,
    custoBrl: resultado.doCache ? 0 : resultado.custoBrl,
    doCache: resultado.doCache,
    camposPreenchidos,
    bensNovos,
  };
}

// ---------------------------------------------------------------------------
// Buscar veículos (produto Veículos)
// ---------------------------------------------------------------------------

// Shape confirmado no Swagger oficial (GET /veiculos/v3/historico-veiculos):
// resposta.historicoVeiculos[] com placa, marcaModelo, anoModelo,
// anoFabricacao, renavam, chassi, cor, combustivel, cidade, uf.
// Mantém fallbacks tolerantes (resposta.veiculos etc) por resiliência.
// O exemplo oficial traz virgulas soltas no fim dos valores — limpamos.
function limpa(s: string): string {
  return s.replace(/[,"\s]+$/g, "").trim();
}

export function extrairVeiculos(json: Record<string, unknown>): {
  placa: string;
  marcaModelo: string;
  ano: string;
  renavam: string;
  chassi: string;
  cor: string;
  cidadeUf: string;
  restricao: string;
}[] {
  const resp = asObj(json.resposta);
  const candidatos = [
    asArr(resp.historicoVeiculos),
    asArr(resp.veiculos),
    asArr(asObj(resp.veiculos).list),
    asArr(resp.list),
    asArr(json.veiculos),
  ].find((a) => a.length > 0) ?? [];

  const out: {
    placa: string;
    marcaModelo: string;
    ano: string;
    renavam: string;
    chassi: string;
    cor: string;
    cidadeUf: string;
    restricao: string;
  }[] = [];
  for (const item of candidatos) {
    const o = asObj(item);
    const placa = limpa(asStr(o.placa)).toUpperCase().replace(/[^A-Z0-9-]/g, "");
    const marcaModelo =
      limpa(asStr(o.marcaModelo)) ||
      [limpa(asStr(o.marca)), limpa(asStr(o.modelo))].filter(Boolean).join(" ");
    if (!placa && !marcaModelo) continue;
    const cidade = limpa(asStr(o.cidade));
    const uf = limpa(asStr(o.uf));
    out.push({
      placa,
      marcaModelo,
      ano:
        limpa(asStr(o.anoModelo)) ||
        limpa(asStr(o.anoFabricacao)) ||
        limpa(asStr(o.ano)),
      renavam: soDigitos(asStr(o.renavam)),
      chassi: limpa(asStr(o.chassi)),
      cor: limpa(asStr(o.cor)),
      cidadeUf: cidade && uf ? `${cidade}/${uf}` : cidade || uf,
      restricao: limpa(asStr(o.restricao)) || limpa(asStr(o.restricoes)),
    });
  }
  return out;
}

export async function buscarVeiculosDevedor(input: {
  devedorId: number;
  email: string;
  credorId?: number | null;
}): Promise<ResultadoAplicacao> {
  const sb = createAdminClient();

  const { data: devedor } = await sb
    .from("devedores")
    .select("id, tipo, documento, nome")
    .eq("id", input.devedorId)
    .maybeSingle();
  if (!devedor) return { ok: false, mensagem: "Devedor não encontrado." };

  const documento = devedor.documento as string;
  if (!tipoDocumento(documento)) {
    return {
      ok: false,
      mensagem: "Devedor sem CPF/CNPJ válido — a Assertiva consulta por documento.",
    };
  }

  const resultado = await consultarVeiculos({ documento, email: input.email });
  if (!resultado.ok) return { ok: false, mensagem: resultado.mensagem };

  const veiculos = extrairVeiculos(resultado.dados);

  // RETRO-FILL: veiculos Assertiva inseridos ANTES da integracao FIPE
  // estao sem valor — completa agora (consulta FIPE gratuita).
  try {
    const { data: semValor } = await sb
      .from("bens_encontrados")
      .select("id, detalhes")
      .eq("devedor_id", input.devedorId)
      .eq("tipo", "veiculo")
      .eq("fonte", "Assertiva")
      .is("valor_estimado_brl", null)
      .limit(20);
    for (const bem of semValor ?? []) {
      const det = (bem.detalhes ?? {}) as Record<string, unknown>;
      const marcaModelo = typeof det.marca === "string" ? det.marca : "";
      const anoDet = typeof det.ano === "string" ? det.ano : String(det.ano ?? "");
      if (!marcaModelo) continue;
      const fipe = await estimarValorFipe({ marcaModelo, ano: anoDet }).catch(
        () => null,
      );
      if (!fipe) continue;
      await sb
        .from("bens_encontrados")
        .update({
          valor_estimado_brl: fipe.valorBrl,
          detalhes: {
            ...det,
            fipe_codigo: fipe.codigoFipe,
            fipe_nome: fipe.nomeFipe,
            fipe_referencia: fipe.mesReferencia,
          },
        })
        .eq("id", bem.id as number);
    }
  } catch {
    /* retro-fill é best-effort */
  }

  let bensNovos = 0;
  if (veiculos.length > 0) {
    const vistos = await titulosExistentes(input.devedorId, "veiculo");
    // Dedup por placa (quando tem) ou por título completo.
    const { data: bensVeic } = await sb
      .from("bens_encontrados")
      .select("detalhes")
      .eq("devedor_id", input.devedorId)
      .eq("tipo", "veiculo")
      .limit(1000);
    const placasVistas = new Set(
      (bensVeic ?? [])
        .map((b) => asStr(asObj(b.detalhes as unknown).placa).toUpperCase())
        .filter(Boolean),
    );

    const novos = veiculos
      .filter((v) => {
        if (v.placa && placasVistas.has(v.placa)) return false;
        const titulo = [v.marcaModelo, v.placa].filter(Boolean).join(" · ");
        return titulo && !vistos.has(titulo.toLowerCase());
      })
      .slice(0, 20);

    // A Assertiva NAO devolve valor de mercado — a tabela FIPE preenche.
    // Consulta gratuita, em paralelo, tolerante a falha (sem FIPE o bem
    // entra sem valor; melhor vazio do que valor inventado).
    const valoresFipe = await Promise.all(
      novos.map((v) =>
        estimarValorFipe({ marcaModelo: v.marcaModelo, ano: v.ano }).catch(
          () => null,
        ),
      ),
    );

    const inserir = novos.map((v, i) => {
      const fipe = valoresFipe[i];
      return {
        devedor_id: input.devedorId,
        tipo: "veiculo",
        fonte: "Assertiva",
        titulo: [v.marcaModelo, v.placa].filter(Boolean).join(" · "),
        valor_estimado_brl: fipe?.valorBrl ?? null,
        detalhes: {
          placa: v.placa,
          marca: v.marcaModelo,
          modelo: "",
          ano: v.ano,
          renavam: v.renavam,
          chassi: v.chassi,
          cor: v.cor,
          localizacao: v.cidadeUf,
          restricao: v.restricao,
          ...(fipe
            ? {
                fipe_codigo: fipe.codigoFipe,
                fipe_nome: fipe.nomeFipe,
                fipe_referencia: fipe.mesReferencia,
              }
            : {}),
        },
        ativo: true,
      };
    });
    if (inserir.length > 0) {
      const { error } = await sb.from("bens_encontrados").insert(inserir);
      if (!error) bensNovos += inserir.length;
    }
  }

  if (!resultado.doCache && resultado.custoBrl > 0) {
    await registrarCusto({
      email: input.email,
      tipo: "assertiva-veiculos",
      descricao: `Veículos ${devedor.tipo} ${documento} — ${devedor.nome} (${veiculos.length} encontrados)`,
      custo: resultado.custoBrl,
      devedorId: input.devedorId,
      credorId: input.credorId ?? null,
    });
  }
  await sb
    .from("devedores")
    .update({ ultima_consulta_em: new Date().toISOString() })
    .eq("id", input.devedorId);

  return {
    ok: true,
    custoBrl: resultado.doCache ? 0 : resultado.custoBrl,
    doCache: resultado.doCache,
    camposPreenchidos: [],
    bensNovos,
  };
}
