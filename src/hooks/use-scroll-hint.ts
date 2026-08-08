import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Indique si un conteneur défilable horizontalement peut encore défiler
 * à gauche / à droite (pour afficher un repère visuel : dégradé + flèche).
 */
export function useScrollHint<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [state, setState] = useState({ left: false, right: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setState({
      left: el.scrollLeft > 2,
      right: max > 2 && el.scrollLeft < max - 2,
    });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c));
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const scrollBy = useCallback((dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(160, el.clientWidth * 0.7), behavior: "smooth" });
  }, []);

  return { ref, canLeft: state.left, canRight: state.right, scrollBy, update };
}
