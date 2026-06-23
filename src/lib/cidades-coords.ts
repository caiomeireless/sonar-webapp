/**
 * Lookup de coordenadas (lat/lng) para cidades de SP, capitais BR e centroides de UF.
 *
 * Chaves SEMPRE em minusculo e SEM acentos. Use `buscarCoord` que ja normaliza.
 * Precisao: ~4 casas decimais (suficiente pra plotar pin em mapa).
 */

export const CIDADES_SP: Record<string, { lat: number; lng: number }> = {
  // Capital + RMSP
  'sao paulo': { lat: -23.5505, lng: -46.6333 },
  'guarulhos': { lat: -23.4538, lng: -46.5333 },
  'sao bernardo do campo': { lat: -23.6914, lng: -46.5646 },
  'santo andre': { lat: -23.6639, lng: -46.5383 },
  'sao caetano do sul': { lat: -23.6229, lng: -46.5547 },
  'diadema': { lat: -23.6861, lng: -46.6228 },
  'maua': { lat: -23.6678, lng: -46.4614 },
  'ribeirao pires': { lat: -23.7106, lng: -46.4136 },
  'osasco': { lat: -23.5325, lng: -46.7919 },
  'barueri': { lat: -23.5106, lng: -46.8761 },
  'carapicuiba': { lat: -23.5225, lng: -46.8358 },
  'cotia': { lat: -23.6039, lng: -46.9192 },
  'embu das artes': { lat: -23.6489, lng: -46.8522 },
  'taboao da serra': { lat: -23.6261, lng: -46.7903 },
  'itapecerica da serra': { lat: -23.7167, lng: -46.8492 },
  'suzano': { lat: -23.5425, lng: -46.3108 },
  'mogi das cruzes': { lat: -23.5228, lng: -46.1881 },
  'itaquaquecetuba': { lat: -23.4861, lng: -46.3486 },

  // Interior - principais
  'campinas': { lat: -22.9099, lng: -47.0626 },
  'sorocaba': { lat: -23.5015, lng: -47.4526 },
  'ribeirao preto': { lat: -21.1775, lng: -47.8103 },
  'santos': { lat: -23.9608, lng: -46.3331 },
  'sao vicente': { lat: -23.9608, lng: -46.3922 },
  'guaruja': { lat: -23.9931, lng: -46.2564 },
  'praia grande': { lat: -24.0058, lng: -46.4028 },
  'cubatao': { lat: -23.8956, lng: -46.4253 },
  'sao jose dos campos': { lat: -23.2237, lng: -45.9009 },
  'taubate': { lat: -23.0264, lng: -45.5553 },
  'jacarei': { lat: -23.3053, lng: -45.9658 },
  'pindamonhangaba': { lat: -22.9236, lng: -45.4614 },
  'piracicaba': { lat: -22.7253, lng: -47.6492 },
  'limeira': { lat: -22.5644, lng: -47.4017 },
  'americana': { lat: -22.7392, lng: -47.3308 },
  'rio claro': { lat: -22.4108, lng: -47.5611 },
  'jundiai': { lat: -23.1864, lng: -46.8842 },
  'itu': { lat: -23.2642, lng: -47.2992 },
  'salto': { lat: -23.2008, lng: -47.2864 },
  'indaiatuba': { lat: -23.0903, lng: -47.2181 },
  'bauru': { lat: -22.3147, lng: -49.0606 },
  'marilia': { lat: -22.2139, lng: -49.9461 },
  'araraquara': { lat: -21.7842, lng: -48.1781 },
  'sao carlos': { lat: -22.0175, lng: -47.8908 },
  'franca': { lat: -20.5386, lng: -47.4006 },
  'presidente prudente': { lat: -22.1256, lng: -51.3889 },
  'aracatuba': { lat: -21.2089, lng: -50.4328 },
  'sao jose do rio preto': { lat: -20.8197, lng: -49.3794 },
  'catanduva': { lat: -21.1378, lng: -48.9728 },
  'jau': { lat: -22.2964, lng: -48.5575 },
  'botucatu': { lat: -22.8858, lng: -48.4450 },
  'itapeva': { lat: -23.9822, lng: -48.8761 },
  'itapetininga': { lat: -23.5917, lng: -48.0533 },
  'registro': { lat: -24.4878, lng: -47.8442 },
  'avare': { lat: -23.0997, lng: -48.9264 },
  'ourinhos': { lat: -22.9786, lng: -49.8706 },
  'assis': { lat: -22.6614, lng: -50.4117 },
  'tupa': { lat: -21.9344, lng: -50.5136 },
  'lins': { lat: -21.6794, lng: -49.7422 },
  'caraguatatuba': { lat: -23.6203, lng: -45.4128 },
  'ubatuba': { lat: -23.4339, lng: -45.0711 },
  'sao sebastiao': { lat: -23.7600, lng: -45.4097 },
  'ilhabela': { lat: -23.7781, lng: -45.3578 },
}

export const CAPITAIS_BR: Record<string, { lat: number; lng: number }> = {
  'sao paulo': { lat: -23.5505, lng: -46.6333 },
  'rio de janeiro': { lat: -22.9068, lng: -43.1729 },
  'belo horizonte': { lat: -19.9167, lng: -43.9345 },
  'vitoria': { lat: -20.3155, lng: -40.3128 },
  'curitiba': { lat: -25.4284, lng: -49.2733 },
  'florianopolis': { lat: -27.5954, lng: -48.5480 },
  'porto alegre': { lat: -30.0346, lng: -51.2177 },
  'brasilia': { lat: -15.7942, lng: -47.8825 },
  'goiania': { lat: -16.6864, lng: -49.2643 },
  'cuiaba': { lat: -15.6014, lng: -56.0978 },
  'campo grande': { lat: -20.4697, lng: -54.6201 },
  'salvador': { lat: -12.9714, lng: -38.5014 },
  'aracaju': { lat: -10.9472, lng: -37.0731 },
  'maceio': { lat: -9.6658, lng: -35.7350 },
  'recife': { lat: -8.0476, lng: -34.8770 },
  'joao pessoa': { lat: -7.1153, lng: -34.8610 },
  'natal': { lat: -5.7945, lng: -35.2110 },
  'fortaleza': { lat: -3.7319, lng: -38.5267 },
  'teresina': { lat: -5.0892, lng: -42.8019 },
  'sao luis': { lat: -2.5391, lng: -44.2829 },
  'belem': { lat: -1.4558, lng: -48.5039 },
  'macapa': { lat: 0.0349, lng: -51.0694 },
  'manaus': { lat: -3.1190, lng: -60.0217 },
  'boa vista': { lat: 2.8235, lng: -60.6758 },
  'porto velho': { lat: -8.7619, lng: -63.9039 },
  'rio branco': { lat: -9.9747, lng: -67.8100 },
  'palmas': { lat: -10.2491, lng: -48.3243 },
}

export const UF_CENTROIDES: Record<string, { lat: number; lng: number }> = {
  AC: { lat: -8.7775, lng: -70.5511 },
  AL: { lat: -9.5713, lng: -36.7820 },
  AP: { lat: 1.4144, lng: -51.7865 },
  AM: { lat: -3.4168, lng: -65.8561 },
  BA: { lat: -12.5797, lng: -41.7007 },
  CE: { lat: -5.4984, lng: -39.3206 },
  DF: { lat: -15.7998, lng: -47.8645 },
  ES: { lat: -19.1834, lng: -40.3089 },
  GO: { lat: -15.8270, lng: -49.8362 },
  MA: { lat: -4.9609, lng: -45.2744 },
  MT: { lat: -12.6819, lng: -56.9211 },
  MS: { lat: -20.7722, lng: -54.7852 },
  MG: { lat: -18.5122, lng: -44.5550 },
  PA: { lat: -3.4168, lng: -52.4811 },
  PB: { lat: -7.2400, lng: -36.7820 },
  PR: { lat: -25.2521, lng: -52.0215 },
  PE: { lat: -8.8137, lng: -36.9541 },
  PI: { lat: -7.7183, lng: -42.7289 },
  RJ: { lat: -22.9068, lng: -43.1729 },
  RN: { lat: -5.4026, lng: -36.9541 },
  RS: { lat: -30.0346, lng: -53.2177 },
  RO: { lat: -11.5057, lng: -63.5806 },
  RR: { lat: 1.9981, lng: -61.3300 },
  SC: { lat: -27.2423, lng: -50.2189 },
  SP: { lat: -22.8184, lng: -48.3989 },
  SE: { lat: -10.5741, lng: -37.3857 },
  TO: { lat: -10.1753, lng: -48.2982 },
}

/** Remove acentos e baixa pra minusculo. Trim. */
function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Busca coordenada por nome de cidade, com fallback pra capital da UF e centroide da UF.
 * Ordem: CIDADES_SP → CAPITAIS_BR → UF_CENTROIDES. Retorna null se nao achar.
 */
export function buscarCoord(
  cidade: string | undefined | null,
  uf: string | undefined | null,
): { lat: number; lng: number } | null {
  const cidadeNorm = cidade ? normalizar(cidade) : ''
  const ufNorm = uf ? uf.trim().toUpperCase() : ''

  if (cidadeNorm) {
    if (CIDADES_SP[cidadeNorm]) return CIDADES_SP[cidadeNorm]
    if (CAPITAIS_BR[cidadeNorm]) return CAPITAIS_BR[cidadeNorm]
  }

  if (ufNorm && UF_CENTROIDES[ufNorm]) return UF_CENTROIDES[ufNorm]

  return null
}
