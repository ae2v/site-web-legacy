/**
 * Primitives graphiques AE2V.
 *
 * Toutes ces primitives sont purement décoratives :
 * - `aria-hidden` et non focusables ;
 * - `pointer-events-none` pour ne jamais bloquer un formulaire ou un CTA ;
 * - SVG / CSS uniquement, aucune dépendance externe.
 *
 * Règle de charte : pas plus de 2–3 familles de motifs par section.
 */
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Decor = {
  className?: string;
  style?: CSSProperties;
};

const DECOR_BASE = "pointer-events-none select-none";

/* ------------------------------------------------------------------ */
/* Cristaux / triangles facettés                                       */
/* ------------------------------------------------------------------ */

export function CrystalCluster({
  className,
  tone = "red",
  variant = 1,
}: Decor & { tone?: "red" | "black" | "green"; variant?: 1 | 2 | 3 }) {
  const fill =
    tone === "red"
      ? ["var(--ae2v-red)", "var(--ae2v-red-dark)", "var(--ae2v-red-light)"]
      : tone === "black"
        ? ["var(--ae2v-black)", "oklch(0.24 0.012 106.7)", "oklch(0.34 0.012 106.7)"]
        : ["var(--ae2v-green)", "var(--ae2v-green-dark)", "var(--ae2v-green)"];

  const shapes: Record<1 | 2 | 3, string[]> = {
    1: ["10,90 52,4 68,92", "52,4 96,44 68,92", "0,58 10,90 40,74"],
    2: ["4,10 74,0 44,66", "74,0 100,52 44,66", "44,66 78,100 20,96"],
    3: ["0,0 62,18 24,72", "62,18 100,8 84,70", "24,72 84,70 52,100"],
  };

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={cn(DECOR_BASE, className)}
    >
      {shapes[variant].map((points, i) => (
        <polygon key={points} points={points} fill={fill[i % fill.length]} opacity={1 - i * 0.18} />
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Nuage / grille de points                                            */
/* ------------------------------------------------------------------ */

export function DotCloud({
  className,
  columns = 6,
  rows = 5,
  gap = 14,
  dot = 2,
}: Decor & { columns?: number; rows?: number; gap?: number; dot?: number }) {
  const width = (columns - 1) * gap + dot * 2;
  const height = (rows - 1) * gap + dot * 2;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn(DECOR_BASE, className)}
    >
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: columns }).map((__, c) => (
          <circle
            key={`${r}-${c}`}
            cx={dot + c * gap}
            cy={dot + r * gap}
            r={dot}
            fill="currentColor"
          />
        )),
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Croix / repères techniques                                          */
/* ------------------------------------------------------------------ */

export function CrossMarker({
  className,
  size = 16,
  weight = 2,
  variant = "plus",
}: Decor & { size?: number; weight?: number; variant?: "plus" | "times" | "circled" }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={cn(DECOR_BASE, className)}
      stroke="currentColor"
      strokeWidth={weight}
    >
      {variant === "circled" && <circle cx="12" cy="12" r="9" fill="none" />}
      {variant === "times" ? (
        <>
          <line x1="5" y1="5" x2="19" y2="19" />
          <line x1="19" y1="5" x2="5" y2="19" />
        </>
      ) : (
        <>
          <line
            x1="12"
            y1={variant === "circled" ? 7 : 3}
            x2="12"
            y2={variant === "circled" ? 17 : 21}
          />
          <line
            x1={variant === "circled" ? 7 : 3}
            y1="12"
            x2={variant === "circled" ? 17 : 21}
            y2="12"
          />
        </>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Coins de cadre incomplets                                           */
/* ------------------------------------------------------------------ */

export function FrameCorners({
  className,
  size = 18,
  weight = 2,
  corners = "all",
}: Decor & { size?: number; weight?: number; corners?: "all" | "diagonal" }) {
  const shown = corners === "all" ? (["tl", "tr", "bl", "br"] as const) : (["tl", "br"] as const);

  const position: Record<string, string> = {
    tl: "left-0 top-0 border-l-2 border-t-2",
    tr: "right-0 top-0 border-r-2 border-t-2",
    bl: "left-0 bottom-0 border-l-2 border-b-2",
    br: "right-0 bottom-0 border-r-2 border-b-2",
  };

  return (
    <span aria-hidden="true" className={cn(DECOR_BASE, "absolute inset-0", className)}>
      {shown.map((corner) => (
        <span
          key={corner}
          className={cn("absolute border-current", position[corner])}
          style={{
            width: size,
            height: size,
            borderWidth: undefined,
            borderStyle: "solid",
            borderTopWidth: corner.startsWith("t") ? weight : 0,
            borderBottomWidth: corner.startsWith("b") ? weight : 0,
            borderLeftWidth: corner.endsWith("l") ? weight : 0,
            borderRightWidth: corner.endsWith("r") ? weight : 0,
          }}
        />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Traits obliques                                                     */
/* ------------------------------------------------------------------ */

export function DiagonalStripe({
  className,
  height = 10,
  orientation = "horizontal",
}: Decor & { height?: number; orientation?: "horizontal" | "vertical" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(DECOR_BASE, "ae2v-stripes block", className)}
      style={orientation === "horizontal" ? { height } : { width: height }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Ruban éditorial (bandeau plein derrière le mot)                      */
/* ------------------------------------------------------------------ */

export function EditorialUnderline({
  children,
  className,
  tone = "green",
  /** Inclinaison du ruban, en degrés. */
  tilt = -1.5,
  animate = true,
}: {
  children: ReactNode;
  className?: string;
  tone?: "red" | "black" | "green" | "offwhite";
  /** @deprecated conservé pour compatibilité, non utilisé. */
  thickness?: number;
  tilt?: number;
  animate?: boolean;
}) {
  const tones: Record<
    "red" | "black" | "green" | "offwhite",
    { bg: string; fg: string; fold: string }
  > = {
    red: { bg: "var(--ae2v-red)", fg: "var(--ae2v-offwhite)", fold: "var(--ae2v-red-dark)" },
    black: { bg: "var(--ae2v-black)", fg: "var(--ae2v-offwhite)", fold: "var(--ae2v-red)" },
    green: { bg: "var(--ae2v-green)", fg: "var(--ae2v-black)", fold: "var(--ae2v-green-dark)" },
    offwhite: { bg: "var(--ae2v-offwhite)", fg: "var(--ae2v-black)", fold: "var(--ae2v-gray)" },
  };
  const t = tones[tone];

  return (
    <span
      className={cn("relative isolate inline-block px-[0.22em] py-[0.02em]", className)}
      style={{ transform: `rotate(${tilt}deg)`, color: t.fg }}
    >
      {/* Corps du ruban */}
      <span
        aria-hidden="true"
        className={cn(
          DECOR_BASE,
          "absolute inset-0 -z-10 origin-left",
          animate &&
            "motion-safe:[animation:ae2v-marker_0.6s_cubic-bezier(0.22,1,0.36,1)_0.2s_both]",
        )}
        style={{
          backgroundColor: t.bg,
          clipPath: "polygon(0 4%, 100% 0, 100% 96%, 0 100%)",
        }}
      />
      {/* Pointes repliées du ruban */}
      <span
        aria-hidden="true"
        className={cn(DECOR_BASE, "absolute top-[16%] -left-[0.28em] -z-20 h-[68%] w-[0.3em]")}
        style={{ backgroundColor: t.fold, clipPath: "polygon(0 0, 100% 14%, 100% 86%, 0 100%)" }}
      />
      <span
        aria-hidden="true"
        className={cn(DECOR_BASE, "absolute top-[16%] -right-[0.28em] -z-20 h-[68%] w-[0.3em]")}
        style={{ backgroundColor: t.fold, clipPath: "polygon(0 14%, 100% 0, 100% 100%, 0 86%)" }}
      />
      <span className="relative">{children}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Ruban / étiquette papier                                            */
/* ------------------------------------------------------------------ */

export function TapeLabel({
  children,
  className,
  tone = "green",
  tilt = -2,
}: {
  children: ReactNode;
  className?: string;
  tone?: "red" | "black" | "green" | "offwhite";
  tilt?: number;
}) {
  const tones: Record<string, string> = {
    red: "bg-ae2v-red text-ae2v-offwhite",
    black: "bg-ae2v-black text-ae2v-offwhite",
    green: "bg-ae2v-green text-ae2v-black",
    offwhite: "bg-ae2v-offwhite text-ae2v-black",
  };

  return (
    <span
      className={cn(
        "inline-block px-3 py-1 text-xs font-bold tracking-[0.14em] uppercase",
        "[clip-path:polygon(1%_0,100%_2%,99%_100%,0_97%)]",
        tones[tone],
        className,
      )}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Grain global                                                        */
/* ------------------------------------------------------------------ */

export function GrainOverlay({ className, opacity = 0.05 }: Decor & { opacity?: number }) {
  return (
    <span
      aria-hidden="true"
      className={cn(DECOR_BASE, "absolute inset-0 mix-blend-multiply", className)}
      style={{
        opacity,
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Titres impact et numéros de section                                 */
/* ------------------------------------------------------------------ */

export function ImpactTitle({
  children,
  className,
  as: Tag = "h2",
  size = "lg",
  stroke = false,
}: {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  size?: "sm" | "md" | "lg" | "xl" | "mega";
  /** Rendu en contour (décor ou emphase) — ne pas utiliser sur du texte fin. */
  stroke?: boolean;
}) {
  const sizes: Record<string, string> = {
    sm: "text-[clamp(1.85rem,4.5vw,2.9rem)]",
    md: "text-[clamp(2.4rem,6vw,4.25rem)]",
    lg: "text-[clamp(2.9rem,8vw,5.5rem)]",
    xl: "text-[clamp(3.25rem,10vw,7rem)]",
    mega: "text-[clamp(2.9rem,6vw,5.75rem)]",
  };

  return (
    <Tag className={cn("ae2v-headline", sizes[size], stroke && "ae2v-stroke", className)}>
      {children}
    </Tag>
  );
}

/**
 * Titre de section monumental : mot fantôme en contour derrière le titre plein.
 */
export function SectionHeading({
  children,
  ghost,
  className,
  as = "h2",
  size = "md",
  tone = "black",
}: {
  children: ReactNode;
  /** Mot décoratif répété en contour derrière le titre. */
  ghost?: string;
  className?: string;
  as?: "h1" | "h2" | "h3";
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "black" | "offwhite" | "red";
}) {
  const ghostColor =
    tone === "offwhite"
      ? "text-ae2v-offwhite/12"
      : tone === "red"
        ? "text-ae2v-red/10"
        : "text-ae2v-black/7";

  return (
    <div className={cn("relative isolate", className)}>
      {ghost && (
        /* Décoratif : le texte est rendu via ::before (hors arbre d'accessibilité,
           donc jamais annoncé ni évalué comme texte porteur d'information). */
        <span
          aria-hidden="true"
          role="presentation"
          data-ghost={ghost}
          className={cn(
            "ae2v-ghost-word ae2v-headline pointer-events-none absolute -top-[0.42em] -left-[0.04em] -z-10 block w-full overflow-hidden text-[clamp(4.5rem,13vw,11rem)] whitespace-nowrap select-none",
            ghostColor,
          )}
        />
      )}
      <ImpactTitle as={as} size={size}>
        {children}
      </ImpactTitle>
    </div>
  );
}

export function SectionNumber({
  value,
  className,
  tone = "red",
}: {
  value: string | number;
  className?: string;
  tone?: "red" | "black" | "green";
}) {
  const color =
    tone === "red" ? "text-ae2v-red" : tone === "black" ? "text-ae2v-black" : "text-ae2v-green";

  const label = typeof value === "number" ? String(value).padStart(2, "0") : value;

  return (
    <span
      aria-hidden="true"
      className={cn("font-impact text-[clamp(2rem,5vw,3.5rem)] leading-none", color, className)}
    >
      {label}.
    </span>
  );
}
