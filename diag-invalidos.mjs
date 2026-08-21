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
  if (error) { console.error('erro:', error); break }
  if (!data || !data.length) break
  all.push(...data)
  if (data.length < 1000) break
  from += 1000
}
console.log('total casos lidos:', all.length)

const invalidos = all.filter(r => String(r.numero_processo).replace(/\D/g,'').length !== 20)
console.log('total invalidos:', invalidos.length)

// Categorizacao
const categorias = {
  sufixo_barra: [],          // /01, /02, ..., /NN ao final
  sufixo_parens: [],         // (01), (02) ao final
  resp: [],                  // REsp ...
  aresp: [],                 // AREsp ...
  rext: [],                  // RE / ARE STF
  cnj_curto: [],             // 19 digitos (tipico de processos antigos)
  cnj_longo: [],             // > 20 digitos
  numero_curto: [],          // < 19 digitos, sem letra de recurso
  outros: [],
}

const reSufixoBarra = /[\/](\d{1,3})\s*$/
const reSufixoParens = /\((\d{1,3})\)\s*$/
const reResp = /^\s*REsp\b/i
const reAresp = /^\s*AREsp\b/i
const reRext = /^\s*A?RE\b/i

for (const r of invalidos) {
  const np = String(r.numero_processo).trim()
  const digitos = np.replace(/\D/g,'')

  if (reResp.test(np)) { categorias.resp.push(r); continue }
  if (reAresp.test(np)) { categorias.aresp.push(r); continue }
  if (reRext.test(np) && !reResp.test(np) && !reAresp.test(np)) { categorias.rext.push(r); continue }

  if (reSufixoBarra.test(np)) {
    // tenta extrair CNJ base dos 20 primeiros digitos
    const base = digitos.slice(0, 20)
    const baseValida = base.length === 20
    categorias.sufixo_barra.push({ ...r, _base: base, _baseValida: baseValida })
    continue
  }
  if (reSufixoParens.test(np)) {
    const base = digitos.slice(0, 20)
    const baseValida = base.length === 20
    categorias.sufixo_parens.push({ ...r, _base: base, _baseValida: baseValida })
    continue
  }

  if (digitos.length === 19) { categorias.cnj_curto.push(r); continue }
  if (digitos.length > 20) { categorias.cnj_longo.push(r); continue }
  if (digitos.length < 19 && digitos.length > 0) { categorias.numero_curto.push(r); continue }

  categorias.outros.push(r)
}

console.log('\n=== CATEGORIAS ===')
for (const [k, v] of Object.entries(categorias)) {
  console.log(`${k}: ${v.length}`)
}

console.log('\n=== SUFIXO /NN — base CNJ valida? ===')
const sb1 = categorias.sufixo_barra
const sb2 = categorias.sufixo_parens
const totalSuf = sb1.length + sb2.length
const validas = [...sb1, ...sb2].filter(r => r._baseValida).length
console.log(`Sufixo /NN: ${sb1.length}`)
console.log(`Sufixo (NN): ${sb2.length}`)
console.log(`Total c/ sufixo: ${totalSuf}`)
console.log(`Com CNJ base extraivel (20 digitos): ${validas}/${totalSuf} (${totalSuf?Math.round(validas/totalSuf*100):0}%)`)

console.log('\n=== AMOSTRAS POR CATEGORIA ===')
for (const [k, v] of Object.entries(categorias)) {
  if (!v.length) continue
  console.log(`\n[${k}] (${v.length} casos) — primeiros 5:`)
  for (const r of v.slice(0, 5)) {
    console.log(`  ${r.numero_processo}${r._base ? '  -> base: ' + r._base : ''}`)
  }
}

// Salva detalhe completo p/ inspeção
writeFileSync(
  'C:/Users/caiom/AppData/Local/Temp/claude/c--Users-caiom-projetos-bp-customer-office/a30f2b23-5f95-46b0-91ad-433aadf667b0/scratchpad/invalidos-detalhe.json',
  JSON.stringify({
    total: invalidos.length,
    porCategoria: Object.fromEntries(Object.entries(categorias).map(([k,v]) => [k, v.length])),
    amostrasPorCategoria: Object.fromEntries(
      Object.entries(categorias).map(([k,v]) => [k, v.slice(0,20).map(r => ({
        id: r.id, numero_processo: r.numero_processo, base: r._base ?? null
      }))])
    ),
    todosOutros: categorias.outros.map(r => ({ id: r.id, numero_processo: r.numero_processo })),
    todosCnjCurto: categorias.cnj_curto.map(r => ({ id: r.id, numero_processo: r.numero_processo })),
    todosCnjLongo: categorias.cnj_longo.map(r => ({ id: r.id, numero_processo: r.numero_processo })),
    todosNumCurto: categorias.numero_curto.map(r => ({ id: r.id, numero_processo: r.numero_processo })),
  }, null, 2)
)
console.log('\n[ok] detalhe salvo em invalidos-detalhe.json')
