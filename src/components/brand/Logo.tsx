import emblemRed from "@/assets/brand/emblem-red.svg?url";
import emblemWhite from "@/assets/brand/emblem-white.svg?url";
import emblemBlack from "@/assets/brand/emblem-black.svg?url";
import horizontalRed from "@/assets/brand/logo-horizontal-red.svg?url";
import horizontalWhite from "@/assets/brand/logo-horizontal-white.svg?url";
import horizontalBlack from "@/assets/brand/logo-horizontal-black.svg?url";
import verticalWhite from "@/assets/brand/logo-vertical-white-red.svg?url";
import wordmarkRed from "@/assets/brand/wordmark-red.svg?url";
import wordmarkWhite from "@/assets/brand/wordmark-white.svg?url";
import wordmarkBlack from "@/assets/brand/wordmark-black.svg?url";
import signatureWhite from "@/assets/brand/signature-white.svg?url";
import signatureBlack from "@/assets/brand/signature-black.svg?url";

/**
 * Bibliothèque officielle des logos AE2V.
 * Tous les fichiers sont à FOND TRANSPARENT : le fond (rouge, noir, off-white)
 * est décidé par le conteneur, jamais par le SVG.
 * Ne jamais recréer le lion ou le mot "AE2V" en CSS.
 */
export const ae2vLogos = {
  emblem: {
    red: emblemRed,
    white: emblemWhite,
    black: emblemBlack,
  },
  horizontal: {
    red: horizontalRed,
    white: horizontalWhite,
    black: horizontalBlack,
  },
  vertical: {
    white: verticalWhite,
  },
  wordmark: {
    red: wordmarkRed,
    white: wordmarkWhite,
    black: wordmarkBlack,
  },
  signature: {
    white: signatureWhite,
    black: signatureBlack,
  },
} as const;

export type LogoVariant = "emblem" | "horizontal" | "vertical" | "wordmark" | "signature";
export type LogoTone = "red" | "white" | "black";

type LogoProps = {
  /** Composition du logo. */
  variant?: LogoVariant;
  /** Déclinaison couleur (selon le fond du conteneur). */
  tone?: LogoTone;
  className?: string;
  /** Texte alternatif ; vide si le logo est purement décoratif. */
  alt?: string;
  priority?: boolean;
};

function resolve(variant: LogoVariant, tone: LogoTone): string {
  const group = ae2vLogos[variant] as Record<string, string | undefined>;
  return group[tone] ?? group["white"] ?? group["red"] ?? group["black"] ?? "";
}

export function Logo({
  variant = "horizontal",
  tone = "red",
  className,
  alt = "AE2V — Always further, together",
  priority = false,
}: LogoProps) {
  const src = resolve(variant, tone);

  return (
    <img
      src={src}
      alt={alt}
      aria-hidden={alt === "" ? true : undefined}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
    />
  );
}

export default Logo;
