// Rodape do papel timbrado do Battaglia & Pedrosa.
// URL centralizada + linha dourada horizontal + QR code real a direita.

const GOLD = "#C9A24A";
const GRAY = "#666666";

export function RodapeBP() {
  return (
    <footer
      style={{
        marginTop: "32pt",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        alignItems: "end",
        columnGap: "12pt",
        fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            fontSize: "10pt",
            fontWeight: 700,
            color: GRAY,
            letterSpacing: "0.02em",
          }}
        >
          www.bpadvogados.com.br
        </div>
        <div
          style={{
            marginTop: "4pt",
            width: "100%",
            height: "1px",
            backgroundColor: GOLD,
          }}
        />
      </div>

      {/* QR code real (escaneavel) extraido do docx original */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/timbre/qr-bp.png"
        alt="QR code site BP Advogados"
        style={{
          width: "50px",
          height: "50px",
          display: "block",
        }}
      />
    </footer>
  );
}
