import type { NextConfig } from "next";

// Sem bodySizeLimit custom: os anexos da Comunicação de Custos sobem DIRETO
// do navegador pro bucket (URL assinada) — nenhuma server action recebe
// arquivo, então o default de 1 MB basta (e a Vercel cortaria em ~4.5 MB
// de qualquer forma).
const nextConfig: NextConfig = {};

export default nextConfig;
