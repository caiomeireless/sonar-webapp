import MapaCidadeA from "@/components/mapa3d/MapaCidadeA";

export const dynamic = "force-dynamic";

export default function MapaDemoVarianteA() {
  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        background: "#0A0C0B",
        color: "#E8E4D6",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <header
        style={{
          padding: "18px 28px",
          borderBottom: "0.5px solid rgba(201,162,74,0.18)",
          display: "flex",
          alignItems: "baseline",
          gap: 16,
          zIndex: 2,
        }}
      >
        <h1
          style={{
            fontSize: 18,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            margin: 0,
          }}
        >
          Variante A &mdash; Metropole
        </h1>
        <span
          style={{
            fontFamily:
              "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
            fontSize: 12,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgba(232,228,214,0.55)",
          }}
        >
          Mapa 3D &middot; cidade isometrica densa
        </span>
      </header>

      <section style={{ flex: 1, position: "relative" }}>
        <MapaCidadeA />
      </section>
    </main>
  );
}
