import MapaCidadeC from "@/components/mapa3d/MapaCidadeC";

export const dynamic = "force-dynamic";

export default function MapaCidadeCDemoPage() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0A0C0B",
        color: "#E8E4D6",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      <h1
        style={{
          position: "absolute",
          left: "50%",
          top: 18,
          transform: "translateX(-50%)",
          margin: 0,
          padding: "6px 18px",
          fontSize: 13,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "#E8E4D6",
          fontFamily: "ui-monospace, Menlo, monospace",
          background: "rgba(10,12,11,0.55)",
          border: "1px solid rgba(201,162,74,0.25)",
          borderRadius: 999,
          backdropFilter: "blur(4px)",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        Variante C — Radar Wireframe
      </h1>

      <MapaCidadeC />
    </div>
  );
}
