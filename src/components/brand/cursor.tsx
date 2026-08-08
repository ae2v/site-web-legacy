import { cloneElement, useEffect, useRef, useState, type ReactElement } from "react";
import { getSiteConfig } from "@/lib/site-config";

/* ------------------------------------------------------------------ */
/* Types & wrapper sémantique                                          */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Types & wrapper sémantique                                          */
/* ------------------------------------------------------------------ */

export type CursorIntent =
  | "add"
  | "remove"
  | "delete"
  | "upload"
  | "send"
  | "navigate"
  | "open"
  | "select"
  | "success"
  | "text"
  | "disabled";

export interface CursorInteraction {
  intent: CursorIntent;
  label?: string;
  icon?: string;
  ring?: "free" | "target";
}

/** Ajoute la sémantique de curseur sans insérer de wrapper DOM autour de l'enfant. */
export function CursorTarget({
  interaction,
  children,
}: {
  interaction: CursorInteraction;
  children: ReactElement<Record<string, unknown>>;
}) {
  return cloneElement(children, {
    "data-cursor": interaction.intent,
    "data-cursor-label": interaction.label,
    "data-cursor-icon": interaction.icon,
    "data-cursor-ring": interaction.ring,
  });
}

/* ------------------------------------------------------------------ */
/* Curseur global AE2V                                                 */
/* ------------------------------------------------------------------ */

const INTENTS: CursorIntent[] = [
  "add",
  "remove",
  "delete",
  "upload",
  "send",
  "navigate",
  "open",
  "select",
  "success",
  "text",
  "disabled",
];

const HIT_SELECTOR =
  "[data-cursor],[data-cursor-text],a[href],button,input,select,textarea,[role='button'],[role='link'],summary";

/** Contenus réellement sélectionnables : le curseur doit y passer en mode texte. */
const TEXT_SELECTOR =
  "p,h1,h2,h3,h4,h5,h6,li,blockquote,figcaption,dd,dt,td,th,label,code,pre,small,address,input,textarea,[data-cursor-text]";

const TRASH_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 8v10m4-10v10m4-10v10M5 5h14M9 5V3h6v2m-9 0 1 16h10l1-16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/**
 * Vrai test de survol : le point est-il réellement sur une ligne de texte ?
 * Évite le curseur texte dans les paddings, marges ou blocs vides.
 */
function isOverGlyph(element: HTMLElement, x: number, y: number): boolean {
  const range = document.createRange();
  const pad = 2;
  for (const node of Array.from(element.childNodes)) {
    if (node.nodeType !== Node.TEXT_NODE) continue;
    if (!(node.textContent ?? "").trim()) continue;
    range.selectNodeContents(node);
    for (const rect of Array.from(range.getClientRects())) {
      if (
        x >= rect.left - pad &&
        x <= rect.right + pad &&
        y >= rect.top - pad &&
        y <= rect.bottom + pad
      ) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Clarté perçue d'une couleur calculée (0 = noir, 1 = blanc).
 * Gère `rgb()/rgba()` mais aussi `oklch()/oklab()`, renvoyés par les tokens AE2V.
 * Retourne `null` si la couleur est transparente ou illisible.
 */
function backgroundLightness(color: string): number | null {
  const numbers = color.match(/-?\d*\.?\d+/g)?.map(Number) ?? [];
  if (numbers.length < 3) return null;

  const alpha = numbers.length > 3 ? (numbers[3] ?? 1) : 1;
  if (alpha <= 0.5) return null;

  if (color.startsWith("oklch") || color.startsWith("oklab")) {
    return numbers[0] ?? null;
  }

  const [r = 255, g = 255, b = 255] = numbers;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** Détermine si le curseur doit passer en version claire (fond sombre/rouge). */
function resolveScheme(element: Element | null): "light" | "dark" {
  let node: Element | null = element;
  while (node && node !== document.documentElement) {
    const declared = (node as HTMLElement).dataset?.["cursorScheme"];
    if (declared === "light" || declared === "dark") return declared;

    const lightness = backgroundLightness(getComputedStyle(node).backgroundColor);
    if (lightness !== null) return lightness < 0.6 ? "light" : "dark";

    node = node.parentElement;
  }
  return "dark";
}

type Descriptor = {
  mode: string;
  label: string;
  icon: string;
  ring: string;
};

/**
 * Curseur contextuel AE2V (noyau + anneau aimanté + bulle de label).
 *
 * - Pas de state React pendant le mouvement : tout passe par des refs + rAF.
 * - Désactivé sur pointeur grossier (tactile) et si `prefers-reduced-motion`.
 * - Le curseur natif n'est masqué que lorsque le curseur custom est actif.
 */
export function BrandCursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLSpanElement>(null);
  const coreRef = useRef<HTMLSpanElement>(null);
  const iconRef = useRef<HTMLElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!getSiteConfig().customCursorEnabled) return;
    if (!window.matchMedia("(pointer:fine) and (prefers-reduced-motion:no-preference)").matches) {
      return;
    }

    const root = rootRef.current;
    const ring = ringRef.current;
    const core = coreRef.current;
    const icon = iconRef.current;
    const bubble = bubbleRef.current;
    if (!root || !ring || !core || !icon || !bubble) return;

    let x = -200;
    let y = -200;
    let target: HTMLElement | null = null;
    let releaseTimer = 0;
    let moveFrame = 0;
    let sizeObserver: ResizeObserver | null = null;
    let attrObserver: MutationObserver | null = null;

    const getDescriptor = (element: HTMLElement | null): Descriptor | null => {
      if (!element) return null;

      const interactive = element.matches(HIT_SELECTOR);
      if (
        element.hasAttribute("data-cursor-text") ||
        element.matches("input, textarea") ||
        (!interactive && element.matches(TEXT_SELECTOR))
      ) {
        return { mode: "text", label: "", icon: "I", ring: "free" };
      }

      const disabled = element.matches(":disabled, [aria-disabled='true']");
      const link = element.matches("a[href], [role='link']");
      const destructive = element.matches("[data-destructive], .danger-link");

      return {
        mode: disabled
          ? "disabled"
          : (element.dataset["cursor"] ?? (destructive ? "delete" : link ? "navigate" : "open")),
        label: disabled ? "Indisponible" : (element.dataset["cursorLabel"] ?? ""),
        icon: disabled ? "×" : (element.dataset["cursorIcon"] ?? (link ? "→" : "")),
        ring: element.dataset["cursorRing"] ?? "target",
      };
    };

    const setCircle = () => {
      ring.style.left = `${x - 17}px`;
      ring.style.top = `${y - 17}px`;
      ring.style.width = "34px";
      ring.style.height = "34px";
    };

    const release = (animate = true) => {
      window.clearTimeout(releaseTimer);
      ring.classList.remove("target");
      ring.classList.toggle("returning", animate);
      setCircle();
      if (animate) {
        releaseTimer = window.setTimeout(() => ring.classList.remove("returning"), 140);
      }
    };

    const morphToElement = (element: HTMLElement) => {
      if (!element.isConnected) {
        release();
        return;
      }
      const rect = element.getBoundingClientRect();
      ring.classList.remove("returning");
      ring.classList.add("target");
      ring.style.left = `${rect.left - 4}px`;
      ring.style.top = `${rect.top - 4}px`;
      ring.style.width = `${rect.width + 8}px`;
      ring.style.height = `${rect.height + 8}px`;
    };

    const updateCursor = (element: HTMLElement | null) => {
      const descriptor = getDescriptor(element);

      for (const intent of INTENTS) root.classList.remove(intent);
      if (descriptor) root.classList.add(descriptor.mode);

      const contextual = Boolean(
        descriptor && (descriptor.icon || descriptor.label || descriptor.mode === "text"),
      );
      core.classList.toggle("contextual", contextual);

      if (descriptor?.icon === "trash") {
        icon.innerHTML = TRASH_ICON;
      } else {
        icon.textContent = descriptor?.icon ?? "";
      }

      bubble.textContent = descriptor?.label ?? "";
      bubble.classList.toggle("show", Boolean(descriptor?.label));

      if (descriptor?.ring === "target" && element) {
        morphToElement(element);
      } else {
        release(target !== null);
      }
    };

    const setTargetElement = (element: HTMLElement | null) => {
      if (element === target) {
        updateCursor(element);
        return;
      }

      target = element;
      sizeObserver?.disconnect();
      attrObserver?.disconnect();
      sizeObserver = null;
      attrObserver = null;

      if (element && getDescriptor(element)?.ring === "target") {
        sizeObserver = new ResizeObserver(() => morphToElement(element));
        sizeObserver.observe(element);
      }

      if (element) {
        attrObserver = new MutationObserver(() => updateCursor(element));
        attrObserver.observe(element, {
          attributes: true,
          attributeFilter: [
            "class",
            "disabled",
            "aria-disabled",
            "aria-pressed",
            "data-cursor",
            "data-cursor-icon",
            "data-cursor-label",
            "data-cursor-ring",
          ],
        });
      }

      updateCursor(element);
    };

    const render = () => {
      moveFrame = 0;
      root.classList.add("visible");

      core.style.left = `${x}px`;
      core.style.top = `${y}px`;
      bubble.style.left = `${x + 22}px`;
      bubble.style.top = `${y}px`;

      const under = document.elementFromPoint(x, y) as HTMLElement | null;
      const textBlock = under?.closest<HTMLElement>(TEXT_SELECTOR) ?? null;
      const hit =
        under?.closest<HTMLElement>(HIT_SELECTOR) ??
        (textBlock &&
        getComputedStyle(textBlock).userSelect !== "none" &&
        isOverGlyph(textBlock, x, y)
          ? textBlock
          : null);

      // Contraste : curseur clair sur les grands blocs rouges/noirs.
      root.classList.toggle("on-dark", resolveScheme(hit ?? under) === "light");

      setTargetElement(hit);

      if (target && getDescriptor(target)?.ring === "target") {
        morphToElement(target);
      } else {
        setCircle();
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      x = event.clientX;
      y = event.clientY;
      if (!moveFrame) moveFrame = requestAnimationFrame(render);
    };
    const handlePointerDown = () => root.classList.add("pressed");
    const handlePointerUp = () => root.classList.remove("pressed");
    const refreshTargetState = () =>
      requestAnimationFrame(() => {
        if (target) updateCursor(target);
      });
    const handleMouseLeave = () => root.classList.remove("visible");
    const handleReflow = () => {
      if (target && getDescriptor(target)?.ring === "target") morphToElement(target);
      else setCircle();
    };

    document.documentElement.classList.add("ae2v-cursor-ready");
    document.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("pointerdown", handlePointerDown, { passive: true });
    document.addEventListener("pointerup", handlePointerUp, { passive: true });
    document.addEventListener("click", refreshTargetState, true);
    document.addEventListener("change", refreshTargetState, true);
    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("resize", handleReflow, { passive: true });
    window.addEventListener("scroll", handleReflow, { passive: true });

    return () => {
      document.documentElement.classList.remove("ae2v-cursor-ready");
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("click", refreshTargetState, true);
      document.removeEventListener("change", refreshTargetState, true);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleReflow);
      window.removeEventListener("scroll", handleReflow);
      sizeObserver?.disconnect();
      attrObserver?.disconnect();
      window.clearTimeout(releaseTimer);
      cancelAnimationFrame(moveFrame);
    };
  }, []);

  return (
    <div aria-hidden="true" className="ae2v-cursor" ref={rootRef}>
      <span className="ae2v-cursor-ring" ref={ringRef} />
      <span className="ae2v-cursor-core" ref={coreRef}>
        <i ref={iconRef} />
      </span>
      <span className="ae2v-cursor-bubble" ref={bubbleRef} />
    </div>
  );
}
