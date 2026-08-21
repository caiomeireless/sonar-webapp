import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = {}
for (const arq of ['c:/Users/caiom/projetos/sonar/webapp/.env.local']) {
  if (!existsSync(arq)) continue
  for (const l of readFileSync(arq, 'utf8').split(/\r?\n/)) {
    const m = l.match(/^([A-Z_]+)=(.*)$/)
    if (m && !env[m[1]]) env[m[1]] = m[2].trim()
  }
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

let all = [], from = 0
while (true) {
  const { data, error } = await sb.from('casos').select('id,numero_processo,themis_id,desdobramento_themis_id')
    .eq('eh_demo', false).eq('status', 'ativo')
    .not('numero_processo','is',null).range(from, from+999)
  if (error) { console.error(error); break }
  if (!data || !data.length) break
  all.push(...data)
  if (data.length < 1000) break
  from += 1000
}

// Helper: extrai CNJ de qualquer texto que contenha 20 digitos no padrao NNNNNNN-DD.AAAA.J.TR.OOOO
function tentaExtrairCNJ(np) {
  // padrao formatado
  const m = np.match(/(\d{7})-?(\d{2})\.?(\d{4})\.?(\d)\.?(\d{2})\.?(\d{4})/)
  if (m) return (m[1]+m[2]+m[3]+m[4]+m[5]+m[6])
  return null
}

const invalidos = all.filter(r => String(r.numero_processo).replace(/\D/g,'').length !== 20)

// CATEGORIAS REVISADAS
const cats = {
  desdobramento_cnj_ok: [],   // sufixo /NN ou (NN) com CNJ base extraivel -> e-SAJ OK pela base
  stj_resp: [],               // REsp explicito OU padrao "NNNNNNN/SP (AAAA/NNNNNNN-N)"
  stj_aresp: [],              // AREsp explicito
  stf_recurso: [],            // ARE / RE / Reclamacao Constitucional STF
  stj_so_registro: [],        // so "AAAA/NNNNNNN-N" (numero de registro STJ sem o numero do recurso)
  stj_so_numero: [],          // so "NNNNNNN" sem o "AAAA/..." (numero STJ solto)
  cnj_truncado: [],           // tem padrao CNJ MAS com vara incompleta (.8.26.060 em vez de .8.26.0602)
  cnj_com_lixo: [],           // tem CNJ extraivel + lixo no final (" - 00001", "/00001", " (...)")
  proc_administrativo: [],    // 11610.725830/2012-23 etc
  outros: [],
}

const reSufixoBarra = /\/(\d{1,4})\s*$/
const reSufixoParens = /\((\d{1,3})\)\s*$/
const reResp = /\bREsp\b/i
const reAresp = /\bAREsp\b/i
const reStfRecurso = /\b(A?RE|Reclama[cç][aã]o)\b/i
const reRegistroStj = /\b(19|20)\d{2}\/\d{7}-\d\b/  // AAAA/NNNNNNN-N
const reCnjCompleto = /\d{7}-?\d{2}\.?\d{4}\.?\d\.?\d{2}\.?\d{4}/
const reAdministrativo = /^\d{5}\.\d{6}\/\d{4}-\d{2}$/

for (const r of invalidos) {
  const np = String(r.numero_processo).trim()
  const cnjEmbutido = tentaExtrairCNJ(np)

  // 1. Desdobramentos com CNJ base preservado
  if (cnjEmbutido && (reSufixoBarra.test(np) || reSufixoParens.test(np))) {
    cats.desdobramento_cnj_ok.push({ ...r, _cnj: cnjEmbutido })
    continue
  }

  // 2. CNJ com lixo (numero/numero, " - NNN", etc) mas sem sufixo limpo
  if (cnjEmbutido && reCnjCompleto.test(np)) {
    cats.cnj_com_lixo.push({ ...r, _cnj: cnjEmbutido })
    continue
  }

  // 3. STJ explicito
  if (reAresp.test(np)) { cats.stj_aresp.push(r); continue }
  if (reResp.test(np))  { cats.stj_resp.push(r); continue }
  if (reStfRecurso.test(np)) { cats.stf_recurso.push(r); continue }

  // 4. CNJ truncado: tem ".A.TT.OOO" mas vara so com 3 digitos
  if (/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{3}\b/.test(np) && !cnjEmbutido) {
    cats.cnj_truncado.push(r)
    continue
  }

  // 5. Numero administrativo (CARF/CPF da Receita)
  if (reAdministrativo.test(np)) { cats.proc_administrativo.push(r); continue }

  // 6. So registro STJ "AAAA/NNNNNNN-N" sem mais nada
  const ehSoRegistro = reRegistroStj.test(np) && np.replace(/\s+/g,'').length < 25
  if (ehSoRegistro) { cats.stj_so_registro.push(r); continue }

  // 7. Tem registro STJ + numero (formato disfarcado de REsp/AREsp)
  if (reRegistroStj.test(np)) {
    cats.stj_resp.push(r) // disfarcado
    continue
  }

  // 8. So numero curto "NNNNNNN" -> provavel numero STJ solto
  if (/^\d{6,7}$/.test(np.replace(/\D/g,'')) && np.replace(/\D/g,'').length >= 6 && np.replace(/\D/g,'').length <= 7) {
    cats.stj_so_numero.push(r)
    continue
  }

  cats.outros.push(r)
}

console.log('=== CATEGORIAS REVISADAS ===')
for (const [k, v] of Object.entries(cats)) {
  console.log(`${k.padEnd(28)} ${v.length}`)
}
const soma = Object.values(cats).reduce((a,b) => a+b.length, 0)
console.log(`${'TOTAL'.padEnd(28)} ${soma} (esperado: ${invalidos.length})`)

console.log('\n=== AMOSTRAS ===')
for (const [k, v] of Object.entries(cats)) {
  if (!v.length) continue
  console.log(`\n[${k}] (${v.length}):`)
  for (const r of v.slice(0, 10)) {
    console.log(`  id=${r.id}  "${r.numero_processo}"${r._cnj ? '  base='+r._cnj : ''}`)
  }
  if (v.length > 10) console.log(`  ... +${v.length-10}`)
}

// Salva resumo final
const resumo = {
  total: invalidos.length,
  porCategoria: Object.fromEntries(Object.entries(cats).map(([k,v])=>[k,v.length])),
  detalhe: Object.fromEntries(Object.entries(cats).map(([k,v])=>[
    k,
    v.map(r => ({ id: r.id, numero_processo: r.numero_processo, cnj_extraido: r._cnj ?? null }))
  ]))
}
writeFileSync('C:/Users/caiom/AppData/Local/Temp/claude/c--Users-caiom-projetos-bp-customer-office/a30f2b23-5f95-46b0-91ad-433aadf667b0/scratchpad/resumo-final.json', JSON.stringify(resumo, null, 2))
console.log('\n[ok] resumo final salvo')
