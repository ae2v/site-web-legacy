import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Repère visuel de défilement horizontal : dégradé + petite flèche cliquable
 * de chaque côté, affichée uniquement quand il reste du contenu à faire défiler.
 * Décoratif pour le clavier (la liste reste navigable aux flèches).
 */
export function ScrollHintEdges({
  canLeft,
  canRight,
  onScroll,
  fadeClass,
  buttonClass,
  className,
}: {
  canLeft: boolean;
  canRight: boolean;
  onScroll: (dir: 1 | -1) => void;
  /** ex. "from-ae2v-black" */
  fadeClass: string;
  /** couleurs du bouton flèche */
  buttonClass: string;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none", className)}>
      <div
        data-visible={canLeft}
        className={cn(
          "absolute inset-y-0 left-0 flex w-14 items-center justify-start bg-gradient-to-r to-transparent pl-1 opacity-0 transition-opacity duration-200 data-[visible=true]:opacity-100",
          fadeClass,
        )}
      >
        <button
          type="button"
          tabIndex={-1}
          onClick={() => onScroll(-1)}
          className={cn(
            "pointer-events-auto inline-flex size-7 items-center justify-center border-2 border-current/40",
            canLeft ? "" : "hidden",
            buttonClass,
          )}
        >
          <ChevronLeft className="size-4" />
        </button>
      </div>

      <div
        data-visible={canRight}
        className={cn(
          "absolute inset-y-0 right-0 flex w-14 items-center justify-end bg-gradient-to-l to-transparent pr-1 opacity-0 transition-opacity duration-200 data-[visible=true]:opacity-100",
          fadeClass,
        )}
      >
        <button
          type="button"
          tabIndex={-1}
          onClick={() => onScroll(1)}
          className={cn(
            "pointer-events-auto inline-flex size-7 animate-pulse items-center justify-center border-2 border-current/40 motion-reduce:animate-none",
            canRight ? "" : "hidden",
            buttonClass,
          )}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
