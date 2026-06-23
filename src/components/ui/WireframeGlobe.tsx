"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { attachHeroScrollTracker, getHeroScroll } from "@/lib/heroScroll";

interface WireframeGlobeProps {
  width?: number;
  height?: number;
  globeCenterX?: number;
  globeCenterY?: number;
  className?: string;
}

const LAND_URL =
  "https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_land.json";

// Pontos âncora em continentes — [lon, lat] + tipo de ícone vermelho
type AssetIcon = "house" | "car" | "building" | "money";
const LAND_ANCHORS: Array<{ lonLat: [number, number]; icon: AssetIcon }> = [
  { lonLat: [-55, -10], icon: "house" },    // Brasil — imóveis
  { lonLat: [-95, 40], icon: "car" },       // EUA — veículos
  { lonLat: [12, 50], icon: "building" },   // Europa — empresas
  { lonLat: [22, 5], icon: "money" },       // África — dinheiro
  { lonLat: [100, 32], icon: "house" },     // Ásia — imóveis
  { lonLat: [135, -25], icon: "car" },      // Austrália — veículos
];

// Desenha ícone com fundo vermelho + contorno e detalhes brancos
function drawAssetIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  type: AssetIcon,
  size: number,
  alpha: number,
) {
  const red = `rgba(255, 61, 90, ${alpha})`;
  const white = `rgba(255, 255, 255, ${alpha})`;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineWidth = Math.max(1, size * 0.18);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const s = size;
  if (type === "house") {
    ctx.fillStyle = red;
    ctx.strokeStyle = white;
    ctx.beginPath();
    ctx.moveTo(-s, -s * 0.2);
    ctx.lineTo(0, -s);
    ctx.lineTo(s, -s * 0.2);
    ctx.lineTo(s, s * 0.8);
    ctx.lineTo(-s, s * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Porta branca
    ctx.fillStyle = white;
    ctx.fillRect(-s * 0.25, s * 0.1, s * 0.5, s * 0.7);
  } else if (type === "car") {
    ctx.fillStyle = red;
    ctx.strokeStyle = white;
    ctx.beginPath();
    ctx.moveTo(-s, s * 0.1);
    ctx.lineTo(-s * 0.55, -s * 0.6);
    ctx.lineTo(s * 0.55, -s * 0.6);
    ctx.lineTo(s, s * 0.1);
    ctx.lineTo(s, s * 0.55);
    ctx.lineTo(-s, s * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Rodas brancas
    ctx.fillStyle = white;
    ctx.beginPath();
    ctx.arc(-s * 0.5, s * 0.55, s * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s * 0.5, s * 0.55, s * 0.22, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === "building") {
    ctx.fillStyle = red;
    ctx.strokeStyle = white;
    ctx.beginPath();
    ctx.rect(-s * 0.7, -s, s * 1.4, s * 1.9);
    ctx.fill();
    ctx.stroke();
    // Janelas brancas
    ctx.fillStyle = white;
    const w = s * 0.22;
    [-0.4, 0.18].forEach((x) =>
      [-0.65, -0.2, 0.25].forEach((y) => {
        ctx.fillRect(s * x, s * y, w, w);
      }),
    );
  } else if (type === "money") {
    ctx.fillStyle = red;
    ctx.strokeStyle = white;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.95, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // $ branco
    ctx.fillStyle = white;
    ctx.font = `700 ${Math.round(s * 1.6)}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("$", 0, s * 0.05);
  }
  ctx.restore();
}

// Fallback para o caso de o elemento [data-emit-anchor] não existir no DOM
const FALLBACK_EMIT = { x: 50, y: 350 };

// 20 pontos espalhados pelos continentes — alfinetes de localização vermelhos
const LAND_PIN_LOCATIONS: [number, number][] = [
  // América do Sul
  [-46, -23],  // São Paulo
  [-58, -34],  // Buenos Aires
  [-74, 4],    // Bogotá
  [-77, -12],  // Lima
  // América do Norte
  [-74, 40],   // NYC
  [-118, 34],  // LA
  [-99, 19],   // Mexico City
  [-87, 41],   // Chicago
  // Europa
  [-0.1, 51],  // London
  [2, 48],     // Paris
  [12, 41],    // Rome
  [-3, 40],    // Madrid
  [37, 55],    // Moscow
  // África
  [3, 6],      // Lagos
  [31, 30],    // Cairo
  [18, -33],   // Cape Town
  // Ásia
  [139, 35],   // Tokyo
  [72, 19],    // Mumbai
  [116, 39],   // Beijing
  [100, 13],   // Bangkok
  // Oceania
  [151, -33],  // Sydney
];

// Desenha alfinete clássico (push pin) centrado em (x, y):
// bola vermelha em cima + haste cinza diagonal pra baixo-esquerda + sombrinha
function drawLocationPin(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  alpha: number,
) {
  ctx.save();
  ctx.translate(x, y);

  // Sombrinha sob a ponta da haste (elipse achatada)
  ctx.beginPath();
  ctx.ellipse(
    -size * 0.65,
    size * 1.85,
    size * 0.55,
    size * 0.13,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.22})`;
  ctx.fill();

  // Haste cinza diagonal saindo da base da bola
  ctx.beginPath();
  ctx.moveTo(0, size * 0.55);
  ctx.lineTo(-size * 0.7, size * 1.8);
  ctx.strokeStyle = `rgba(150, 150, 150, ${alpha})`;
  ctx.lineWidth = Math.max(1, size * 0.32);
  ctx.lineCap = "round";
  ctx.stroke();

  // Bola vermelha — corpo principal
  ctx.beginPath();
  ctx.arc(0, 0, size, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(232, 60, 30, ${alpha})`;
  ctx.fill();

  // Highlight 3D no topo-esquerdo da bola
  ctx.beginPath();
  ctx.arc(-size * 0.35, -size * 0.42, size * 0.28, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 145, 120, ${alpha * 0.85})`;
  ctx.fill();

  ctx.restore();
}

// Globo wireframe halftone (adaptado do prompt do usuário) — cores adaptadas
// pra paleta do Sonar (signal-green nas linhas, gold nos dots), auto-rotate
// sem zoom/drag, sem texto de UI.
export function WireframeGlobe({
  width = 320,
  height = 320,
  globeCenterX,
  globeCenterY,
  className = "",
}: WireframeGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const containerWidth = width;
    const containerHeight = height;
    const radius = Math.min(containerWidth, containerHeight) / 2.4;
    const cx = globeCenterX ?? containerWidth / 2;
    const cy = globeCenterY ?? containerHeight / 2;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerWidth * dpr;
    canvas.height = containerHeight * dpr;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerHeight}px`;
    context.scale(dpr, dpr);

    const projection = d3
      .geoOrthographic()
      .scale(radius)
      .translate([cx, cy])
      .clipAngle(90);

    const path = d3.geoPath().projection(projection).context(context);

    // Helpers do prompt — point-in-polygon p/ gerar halftone dots
    const pointInPolygon = (
      point: [number, number],
      polygon: number[][],
    ): boolean => {
      const [x, y] = point;
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
          inside = !inside;
        }
      }
      return inside;
    };

    type GeoFeature = {
      geometry: {
        type: "Polygon" | "MultiPolygon";
        coordinates: number[][][] | number[][][][];
      };
    };

    const pointInFeature = (
      point: [number, number],
      feature: GeoFeature,
    ): boolean => {
      const geometry = feature.geometry;
      if (geometry.type === "Polygon") {
        const coordinates = geometry.coordinates as number[][][];
        if (!pointInPolygon(point, coordinates[0])) return false;
        for (let i = 1; i < coordinates.length; i++) {
          if (pointInPolygon(point, coordinates[i])) return false;
        }
        return true;
      } else if (geometry.type === "MultiPolygon") {
        const coords = geometry.coordinates as number[][][][];
        for (const polygon of coords) {
          if (pointInPolygon(point, polygon[0])) {
            let inHole = false;
            for (let i = 1; i < polygon.length; i++) {
              if (pointInPolygon(point, polygon[i])) {
                inHole = true;
                break;
              }
            }
            if (!inHole) return true;
          }
        }
        return false;
      }
      return false;
    };

    const generateDotsInPolygon = (feature: GeoFeature, dotSpacing = 16) => {
      const dots: [number, number][] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bounds = d3.geoBounds(feature as any);
      const [[minLng, minLat], [maxLng, maxLat]] = bounds;
      const stepSize = dotSpacing * 0.08;
      for (let lng = minLng; lng <= maxLng; lng += stepSize) {
        for (let lat = minLat; lat <= maxLat; lat += stepSize) {
          const point: [number, number] = [lng, lat];
          if (pointInFeature(point, feature)) {
            dots.push(point);
          }
        }
      }
      return dots;
    };

    const allDots: { lng: number; lat: number }[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let landFeatures: any = null;
    let cancelled = false;

    // === Shooting sticks (feixes voando pin-a-pin via great circle) ===
    interface Shot {
      from: [number, number];
      to: [number, number];
      interpolator: (t: number) => number[];
      progress: number; // segundos decorridos
      duration: number; // segundos totais
      trail: Array<[number, number]>;
    }
    const shots: Shot[] = [];
    let shotSpawnTimer = 0;
    const spawnShot = () => {
      const fromIdx = Math.floor(Math.random() * LAND_PIN_LOCATIONS.length);
      let toIdx = Math.floor(Math.random() * LAND_PIN_LOCATIONS.length);
      while (toIdx === fromIdx) {
        toIdx = Math.floor(Math.random() * LAND_PIN_LOCATIONS.length);
      }
      const from = LAND_PIN_LOCATIONS[fromIdx];
      const to = LAND_PIN_LOCATIONS[toIdx];
      shots.push({
        from,
        to,
        interpolator: d3.geoInterpolate(from, to),
        progress: 0,
        duration: 1.4 + Math.random() * 1.2,
        trail: [],
      });
    };

    // === Câmera parallax (mouse moviment leve em rotation y/x) ===
    const parallax = { x: 0, y: 0 };
    const onParallaxMove = (e: MouseEvent) => {
      parallax.x = (e.clientX / window.innerWidth - 0.5) * 2;
      parallax.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onParallaxMove, { passive: true });

    // Calcula posição do emit (elemento [data-emit-anchor] no DOM) em coords lógicas do canvas.
    // Recomputado a cada resize porque o layout muda com a viewport.
    let emitAnchor = { ...FALLBACK_EMIT };
    const computeEmitAnchor = () => {
      const emitEl = document.querySelector("[data-emit-anchor]");
      if (!emitEl) return;
      const emitRect = emitEl.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      if (canvasRect.width === 0 || canvasRect.height === 0) return;
      const emitCx = emitRect.left + emitRect.width / 2;
      const emitCy = emitRect.top + emitRect.height / 2;
      emitAnchor = {
        x: ((emitCx - canvasRect.left) / canvasRect.width) * containerWidth,
        y: ((emitCy - canvasRect.top) / canvasRect.height) * containerHeight,
      };
    };
    computeEmitAnchor();
    const onResize = () => computeEmitAnchor();
    window.addEventListener("resize", onResize);


    const render = () => {
      context.clearRect(0, 0, containerWidth, containerHeight);

      const currentScale = projection.scale();
      const scaleFactor = currentScale / radius;

      // Esfera (outline signal-green, sem fill — sticks vão por cima)
      context.beginPath();
      context.arc(cx, cy, currentScale, 0, 2 * Math.PI);
      context.strokeStyle = "rgba(60, 255, 138, 0.9)";
      context.lineWidth = 1.5 * scaleFactor;
      context.stroke();

      const center: [number, number] = [-rotation[0], 0];

      if (landFeatures) {
        // Graticule (grid lat/lon)
        const graticule = d3.geoGraticule();
        context.beginPath();
        path(graticule());
        context.strokeStyle = "rgba(60, 255, 138, 0.22)";
        context.lineWidth = 0.6 * scaleFactor;
        context.stroke();

        // Contornos dos continentes
        context.beginPath();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        landFeatures.features.forEach((feature: any) => {
          path(feature);
        });
        context.strokeStyle = "rgba(60, 255, 138, 0.75)";
        context.lineWidth = 0.9 * scaleFactor;
        context.stroke();

        // Halftone dots em gold
        allDots.forEach((dot) => {
          const projected = projection([dot.lng, dot.lat]);
          if (
            projected &&
            projected[0] >= 0 &&
            projected[0] <= containerWidth &&
            projected[1] >= 0 &&
            projected[1] <= containerHeight
          ) {
            context.beginPath();
            context.arc(
              projected[0],
              projected[1],
              1.2 * scaleFactor,
              0,
              2 * Math.PI,
            );
            context.fillStyle = "rgba(201, 162, 74, 0.65)";
            context.fill();
          }
        });
      }

      // Alfinetes vermelhos nas localizações espalhadas pelos continentes
      LAND_PIN_LOCATIONS.forEach((coord) => {
        const distance = d3.geoDistance(coord, center);
        if (distance >= Math.PI / 2) return;
        const projected = projection(coord);
        if (!projected) return;
        const fade = Math.cos(distance);
        drawLocationPin(
          context,
          projected[0],
          projected[1],
          3 * scaleFactor,
          0.95 * fade,
        );
      });

      // Shooting sticks — feixes verdes voando entre cidades via great circle.
      // Renderizados POR ÚLTIMO pra ficar por cima dos alfinetes/halftone.
      shots.forEach((shot) => {
        const t = Math.min(1, shot.progress / shot.duration);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - t, 3);
        const point = shot.interpolator(eased) as [number, number];
        const dist = d3.geoDistance(point, center);
        if (dist >= Math.PI / 2) return;
        const projected = projection(point);
        if (!projected) return;

        // Adiciona posição atual no trail (em front)
        shot.trail.unshift([projected[0], projected[1]]);
        if (shot.trail.length > 22) shot.trail.pop();

        // Desenha trail decaindo
        for (let i = shot.trail.length - 2; i >= 0; i--) {
          const [x1, y1] = shot.trail[i];
          const [x2, y2] = shot.trail[i + 1];
          const a = (1 - i / shot.trail.length) * 0.85;
          context.beginPath();
          context.moveTo(x1, y1);
          context.lineTo(x2, y2);
          context.strokeStyle = `rgba(60, 255, 138, ${a})`;
          context.lineWidth = 1.6 * scaleFactor;
          context.lineCap = "round";
          context.stroke();
        }
        // Cabeça brilhante do shot
        context.beginPath();
        context.arc(
          projected[0],
          projected[1],
          2.2 * scaleFactor,
          0,
          Math.PI * 2,
        );
        context.fillStyle = `rgba(220, 255, 230, 0.95)`;
        context.fill();
        context.beginPath();
        context.arc(
          projected[0],
          projected[1],
          4 * scaleFactor,
          0,
          Math.PI * 2,
        );
        context.fillStyle = `rgba(60, 255, 138, 0.25)`;
        context.fill();
      });
    };

    const loadData = async () => {
      try {
        const response = await fetch(LAND_URL);
        if (!response.ok || cancelled) return;
        landFeatures = await response.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        landFeatures.features.forEach((feature: any) => {
          const dots = generateDotsInPolygon(feature, 16);
          dots.forEach(([lng, lat]) => allDots.push({ lng, lat }));
        });
        render();
      } catch {
        // Silenciar erros de fetch — fallback é a esfera vazia
      }
    };

    // Rotação inicial — centraliza em ~75°E (Índia/Ásia) com leve tilt pra
    // mostrar mais o hemisfério norte. Drag do usuário continua funcionando.
    const rotation: [number, number] = [-75, -15];
    const rotationSpeed = 0.3;

    // Drag-to-rotate por mouse — listener no DOCUMENT, só ativa
    // dentro da esfera do globo (não bloqueia eventos do Sonar particle text)
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    const isInsideGlobe = (clientX: number, clientY: number): boolean => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      const scaleX = rect.width / containerWidth;
      const scaleY = rect.height / containerHeight;
      const globeCenterScreenX = rect.left + cx * scaleX;
      const globeCenterScreenY = rect.top + cy * scaleY;
      const globeRadiusScreen = projection.scale() * scaleX;
      const dx = clientX - globeCenterScreenX;
      const dy = clientY - globeCenterScreenY;
      return dx * dx + dy * dy < globeRadiusScreen * globeRadiusScreen;
    };
    const onDocMouseDown = (e: MouseEvent) => {
      if (!isInsideGlobe(e.clientX, e.clientY)) return;
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      document.body.style.cursor = "grabbing";
      e.preventDefault();
    };
    const onDocMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      rotation[0] += dx * 0.35;
      rotation[1] = Math.max(-85, Math.min(85, rotation[1] - dy * 0.35));
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onDocMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      document.body.style.cursor = "";
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("mousemove", onDocMouseMove);
    document.addEventListener("mouseup", onDocMouseUp);

    const tick = () => {
      const dt = 1 / 60; // delta aproximado (d3.timer chama ~60fps)

      // Scroll progress da faixa 2 (0 = topo do hero; 1 = hero scrollado fora)
      // ease-out cubic pra arranque suave
      const raw = getHeroScroll();
      const eased = 1 - Math.pow(1 - raw, 3);

      // Zoom: scale cresce de 1x até ~1.7x conforme o usuário rola
      projection.scale(radius * (1 + eased * 0.7));

      // Auto-rotação pausada enquanto o usuário arrasta
      if (!isDragging) {
        rotation[0] += rotationSpeed * (1 + eased * 2.5);
      }

      // Parallax sutil — adiciona offset em cima da rotação base
      const parallaxRotX = rotation[0] + parallax.x * 4;
      const parallaxRotY = Math.max(
        -85,
        Math.min(85, rotation[1] + parallax.y * 3),
      );
      projection.rotate([parallaxRotX, parallaxRotY]);

      // Avança os shots e spawna novos
      for (let i = shots.length - 1; i >= 0; i--) {
        shots[i].progress += dt;
        if (shots[i].progress >= shots[i].duration) {
          shots.splice(i, 1);
        }
      }
      shotSpawnTimer += dt;
      // spawna a cada 0.5s até manter ~4 shots no ar
      if (shotSpawnTimer >= 0.5 && shots.length < 4) {
        spawnShot();
        shotSpawnTimer = 0;
      }

      computeEmitAnchor();
      render();
    };

    const detachHeroScroll = attachHeroScrollTracker();
    const rotationTimer = d3.timer(tick);
    loadData();

    return () => {
      cancelled = true;
      rotationTimer.stop();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onParallaxMove);
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("mousemove", onDocMouseMove);
      document.removeEventListener("mouseup", onDocMouseUp);
      detachHeroScroll();
    };
  }, [width, height, globeCenterX, globeCenterY]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", background: "transparent" }}
    />
  );
}
