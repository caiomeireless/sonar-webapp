// Timbre completo do escritorio Battaglia & Pedrosa Advogados.
// Usa a imagem REAL do timbre extraida dos .docx do escritorio
// (word/media/image5.png), que ja contem:
//   - Blocos pixelados dourados (escada) a esquerda
//   - "Battaglia & Pedrosa" em serif preta (& dourado)
//   - "ADVOGADOS" em caps dourado abaixo
//   - Selo "25 ANOS" com louros dourados a direita
//
// Os enderecos dos 2 escritorios sao renderizados em texto ao lado,
// como no papel timbrado original.

const INK = "#1a1a1a";

function BlocoEndereco({
  cidade,
  linha1,
  linha2,
}: {
  cidade: string;
  linha1: string;
  linha2: string;
}) {
  return (
    <div style={{ lineHeight: 1.3 }}>
      <p
        className="uppercase"
        style={{
          fontSize: "9pt",
          fontWeight: 700,
          letterSpacing: "0.06em",
          color: INK,
        }}
      >
        {cidade}
      </p>
      <p
        style={{
          fontSize: "8.5pt",
          color: INK,
          opacity: 0.85,
          marginTop: "1pt",
        }}
      >
        {linha1}
      </p>
      <p style={{ fontSize: "8.5pt", color: INK, opacity: 0.85 }}>{linha2}</p>
    </div>
  );
}

export function TimbreBP() {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: "24px",
        width: "100%",
      }}
    >
      {/* Timbre completo (imagem extraida do docx original) */}
      <div style={{ flex: "0 0 auto", lineHeight: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/timbre/timbre-bp-completo.png"
          alt="Battaglia & Pedrosa Advogados - 25 anos"
          style={{
            width: "380px",
            height: "auto",
            display: "block",
          }}
        />
      </div>

      {/* Enderecos dos 2 escritorios, alinhados a direita */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          flex: 1,
        }}
      >
        <BlocoEndereco
          cidade="São Paulo Capital"
          linha1="Rua Funchal, 573 - 5º andar"
          linha2="Vila Olímpia - São Paulo."
        />
        <BlocoEndereco
          cidade="Sorocaba & Região"
          linha1="Av. Gisele Constantino 1.850 - CJ. 1216"
          linha2="Pq. Bela Vista - Votorantim."
        />
      </div>
    </header>
  );
}
