import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Bandeau défilant AE2V (décoratif), boucle réellement infinie.
 *
 * Principe : un groupe est mesuré en JS, dupliqué autant de fois que nécessaire
 * pour couvrir 2× la largeur du conteneur, puis translaté en rAF avec un modulo
 * sur la largeur d'un groupe (téléportation invisible).
 *
 * Accessibilité (RGAA 13.8 / WCAG 2.2.2) :
 * - le texte est annoncé une seule fois aux lecteurs d'écran ;
 * - un bouton permet de mettre en pause (clavier + souris) ;
 * - le défilement est arrêté par défaut si l'utilisateur demande moins d'animations.
 */
export function BrandMarquee({
  items,
  className,
  tone = "green",
  /** vitesse en pixels par seconde */
  speed = 60,
}: {
  items: string[];
  className?: string;
  tone?: "green" | "black" | "red" | "offwhite";
  speed?: number;
}) {
  const [paused, setPaused] = useState(false);
  const [copies, setCopies] = useState(2);

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPaused(true);
  }, []);

  // Nombre de copies nécessaires pour couvrir largement le conteneur.
  const measure = useCallback(() => {
    const container = containerRef.current;
    const group = groupRef.current;
    if (!container || !group) return;
    const groupWidth = group.offsetWidth;
    if (groupWidth <= 0) return;
    const needed = Math.max(2, Math.ceil((container.offsetWidth * 2) / groupWidth) + 1);
    setCopies((current) => (current === needed ? current : needed));
  }, []);

  useLayoutEffect(() => {
    measure();
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    if (groupRef.current) ro.observe(groupRef.current);
    return () => ro.disconnect();
  }, [measure, items]);

  // Boucle d'animation : translation continue + modulo sur la largeur d'un groupe.
  useEffect(() => {
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const delta = (now - last) / 1000;
      last = now;
      const group = groupRef.current;
      const track = trackRef.current;
      if (group && track) {
        const groupWidth = group.offsetWidth;
        if (groupWidth > 0) {
          if (!pausedRef.current) offsetRef.current += speed * delta;
          // téléportation invisible : on ne dépasse jamais une largeur de groupe
          offsetRef.current %= groupWidth;
          track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
        }
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [speed]);

  const tones: Record<string, string> = {
    green: "bg-ae2v-green text-ae2v-black",
    black: "bg-ae2v-black text-ae2v-offwhite",
    red: "bg-ae2v-red text-ae2v-offwhite",
    offwhite: "bg-ae2v-offwhite text-ae2v-black",
  };

  const controlTone =
    tone === "green" || tone === "offwhite"
      ? "border-ae2v-black text-ae2v-black hover:bg-ae2v-black hover:text-ae2v-offwhite"
      : "border-ae2v-offwhite text-ae2v-offwhite hover:bg-ae2v-offwhite hover:text-ae2v-black";

  const group = (key: string, isRef: boolean) => (
    <div
      key={key}
      ref={isRef ? groupRef : undefined}
      className="flex shrink-0 items-center"
    >
      {items.map((item, index) => (
        <span
          key={`${key}-${item}-${index}`}
          className="flex items-center gap-6 px-6 font-impact text-xl whitespace-nowrap md:text-2xl"
        >
          {item}
          <span className="text-base opacity-70">✕</span>
        </span>
      ))}
    </div>
  );

  return (
    <div
      ref={containerRef}
      data-paused={paused ? "true" : "false"}
      className={cn(
        "group relative overflow-hidden border-y-2 border-ae2v-black",
        tones[tone],
        className,
      )}
    >
      <span className="sr-only">{items.join(" · ")}</span>

      <div
        ref={trackRef}
        aria-hidden="true"
        className="flex w-max py-2.5 will-change-transform"
      >
        {Array.from({ length: copies }, (_, i) => group(`g${i}`, i === 0))}
      </div>

      <button
        type="button"
        onClick={() => setPaused((v) => !v)}
        aria-pressed={paused}
        className={cn(
          "absolute top-1/2 right-2 inline-flex size-11 -translate-y-1/2 items-center justify-center border-2 bg-transparent transition-colors",
          "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ae2v-black",
          controlTone,
        )}
      >
        {paused ? (
          <Play aria-hidden="true" className="size-4" />
        ) : (
          <Pause aria-hidden="true" className="size-4" />
        )}
        <span className="sr-only">
          {paused ? "Relancer le bandeau défilant" : "Mettre en pause le bandeau défilant"}
        </span>
      </button>
    </div>
  );
}

export default BrandMarquee;
