// Bloco de assinaturas dos 3 socios do escritorio Battaglia & Pedrosa.
// Layout: Remo + Paulo lado a lado em cima, Caio sozinho centralizado embaixo.
// Cada coluna tem um espaco em branco superior pra rubrica fisica + linha fina
// + nome em caixa alta + OAB.

const INK = "#1a1a1a";

type Assinatura = {
  nome: string;
  oab: string;
};

function ColunaAssinatura({ nome, oab }: Assinatura) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* Espaco da rubrica */}
      <div style={{ height: "50px", width: "100%" }} />
      {/* Linha fina (local da assinatura) */}
      <div
        style={{
          width: "260px",
          maxWidth: "100%",
          borderTop: `1px solid ${INK}`,
        }}
      />
      <p
        className="uppercase"
        style={{
          marginTop: "6pt",
          fontSize: "11pt",
          fontWeight: 700,
          color: INK,
          letterSpacing: "0.04em",
        }}
      >
        {nome}
      </p>
      <p
        style={{
          marginTop: "2pt",
          fontSize: "10pt",
          fontWeight: 400,
          color: INK,
        }}
      >
        {oab}
      </p>
    </div>
  );
}

export function AssinaturasBP() {
  return (
    <div
      style={{
        marginTop: "32pt",
        display: "flex",
        flexDirection: "column",
        gap: "24pt",
      }}
    >
      {/* Linha 1: 2 socios lado a lado */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "32px",
        }}
      >
        <ColunaAssinatura
          nome="Remo Higashi Battaglia"
          oab="OAB/SP 157.500"
        />
        <ColunaAssinatura
          nome="Paulo Andre M. Pedrosa"
          oab="OAB/SP nº 286.704"
        />
      </div>

      {/* Linha 2: socio sozinho, centralizado */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "50%", minWidth: "260px" }}>
          <ColunaAssinatura
            nome="Caio Meireles Vicentino"
            oab="OAB/SP 466.468"
          />
        </div>
      </div>
    </div>
  );
}
