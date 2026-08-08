import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Apparition au scroll, purement décorative.
 * - Sans JS / avant hydratation : le contenu est visible (aucun contenu masqué).
 * - `prefers-reduced-motion` : géré globalement dans styles.css.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
  variant = "rise",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: ElementType;
  variant?: "rise" | "slide" | "pop";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    setArmed(true);
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const animation =
    variant === "slide" ? "ae2v-slide-in" : variant === "pop" ? "ae2v-pop" : "ae2v-rise";

  return (
    <Tag
      ref={ref as never}
      className={cn(armed && !shown && "opacity-0", shown && animation, className)}
      style={{ "--d": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}

export default Reveal;
