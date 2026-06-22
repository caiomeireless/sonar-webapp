// Rastreia progresso de scroll da faixa 2 (hero) — usado pelo WireframeGlobe
// pra zoomar + acelerar rotacao conforme o usuario rola a pagina.
// Auto-attach por id="hero" no DOM, sem prop drilling.

const state = { progress: 0 };
let attached = false;

export function getHeroScroll(): number {
  return state.progress;
}

export function attachHeroScrollTracker(): () => void {
  if (typeof window === "undefined") return () => {};
  if (attached) return () => {};
  attached = true;

  const onScroll = () => {
    const el = document.getElementById("hero");
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const height = Math.max(rect.height, 1);
    const raw = -rect.top / height;
    state.progress = Math.max(0, Math.min(1, raw));
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  return () => {
    window.removeEventListener("scroll", onScroll);
    attached = false;
  };
}
