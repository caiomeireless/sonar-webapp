import MapaCidadeB from "@/components/mapa3d/MapaCidadeB";

export const dynamic = "force-dynamic";

export default function MapaCidadeBPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0A0C0B",
        color: "#E8E4D6",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <h1
        style={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 18,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#C9A24A",
          margin: 0,
        }}
      >
        Variante B — Bairro Brasileiro
      </h1>
      <div
        style={{
          flex: 1,
          borderRadius: 8,
          overflow: "hidden",
          border: "1px solid rgba(201,162,74,0.25)",
          minHeight: "calc(100vh - 120px)",
        }}
      >
        <MapaCidadeB />
      </div>
    </main>
  );
}
