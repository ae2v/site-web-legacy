import type { ReactNode } from "react";

import {
  DiagonalStripe,
  DotCloud,
  SectionHeading,
  SectionNumber,
  TapeLabel,
} from "@/components/brand";
import { Reveal } from "@/components/brand/reveal";
import { cn } from "@/lib/utils";

/** Section éditoriale AE2V : numéro, titre monumental, contenu. */
export function Section({
  id,
  number,
  ghost,
  title,
  intro,
  tone = "light",
  children,
  className,
}: {
  id?: string;
  number?: number | string;
  ghost?: string;
  title: string;
  intro?: string;
  tone?: "light" | "dark" | "red";
  children?: ReactNode;
  className?: string;
}) {
  const toneClass =
    tone === "dark"
      ? "bg-ae2v-black text-ae2v-offwhite"
      : tone === "red"
        ? "bg-ae2v-red text-ae2v-offwhite"
        : "bg-background text-foreground";

  return (
    <section
      id={id}
      data-cursor-scheme={tone === "light" ? "dark" : "light"}
      className={cn("relative overflow-hidden scroll-mt-24", toneClass, className)}
    >
      {tone !== "light" && (
        <DotCloud className="absolute top-6 right-6 text-current opacity-20" columns={6} rows={3} />
      )}
      <div className="relative mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-20">
        <Reveal>
          <div className="flex items-end gap-4">
            {number !== undefined && (
              <SectionNumber value={number} tone={tone === "light" ? "red" : "green"} />
            )}
            <SectionHeading
              {...(ghost ? { ghost } : {})}
              tone={tone === "light" ? "black" : "offwhite"}
              className="flex-1"
            >
              {title}
            </SectionHeading>
          </div>
          {intro && (
            <p
              className={cn(
                "mt-5 max-w-2xl border-l-4 border-ae2v-green pl-4 text-sm md:text-base",
                tone === "light" ? "text-muted-foreground" : "text-current",
              )}
            >
              {intro}
            </p>
          )}
        </Reveal>
        {children && <div className="mt-10">{children}</div>}
      </div>
    </section>
  );
}

/**
 * Carte carrée à bord dur.
 * Par défaut la carte est purement informative : aucun survol, aucune
 * animation, rien qui laisse croire qu'elle est cliquable.
 * `interactive` uniquement si la carte entière est réellement actionnable.
 */
export function HardCard({
  title,
  children,
  eyebrow,
  tone = "light",
  interactive = false,
  className,
}: {
  title: string;
  children?: ReactNode;
  eyebrow?: string;
  tone?: "light" | "dark" | "green";
  interactive?: boolean;
  className?: string;
}) {
  const toneClass =
    tone === "dark"
      ? "border-ae2v-offwhite/20 bg-ae2v-black text-ae2v-offwhite"
      : tone === "green"
        ? "border-ae2v-black bg-ae2v-green text-ae2v-black"
        : "border-ae2v-black bg-card text-card-foreground";

  return (
    <div
      className={cn(
        "group relative border-2 p-6",
        interactive && "transition-transform duration-200 motion-safe:hover:-translate-y-1",
        toneClass,
        className,
      )}
    >
      <DiagonalStripe className="pointer-events-none absolute inset-x-0 bottom-0 h-1 opacity-40" />
      {eyebrow && (
        <p className="text-[0.7rem] font-bold tracking-[0.18em] uppercase opacity-70">{eyebrow}</p>
      )}
      <h3 className="ae2v-headline mt-2 text-[clamp(1.4rem,3vw,2rem)]">{title}</h3>
      {children && <div className="mt-3 text-sm leading-relaxed opacity-90">{children}</div>}
    </div>
  );
}

/** Étapes numérotées d'un parcours. */
export function StepList({ steps }: { steps: { title: string; text: string }[] }) {
  return (
    <ol className="grid gap-px bg-ae2v-black/15 md:grid-cols-2 lg:grid-cols-4">
      {steps.map((step, index) => (
        <li key={step.title} className="bg-background p-6">
          <SectionNumber value={index + 1} />
          <h3 className="ae2v-headline mt-2 text-xl">{step.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
        </li>
      ))}
    </ol>
  );
}

/** FAQ en <details> natifs : accessible au clavier par construction. */
export function FaqList({ items }: { items: { q: string; a: ReactNode }[] }) {
  return (
    <div className="divide-y-2 divide-ae2v-black/15 border-y-2 border-ae2v-black/15">
      {items.map((item) => (
        <details key={item.q} className="group py-4">
          <summary className="ae2v-focus flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-impact text-lg">
            {item.q}
            <span
              aria-hidden="true"
              className="text-ae2v-red transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</div>
        </details>
      ))}
    </div>
  );
}

/** État vide honnête : rien n'est inventé tant que le bureau n'a pas publié. */
export function EmptyState({
  label,
  detail,
  action,
}: {
  label: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <div className="relative border-2 border-dashed border-ae2v-black/40 bg-card p-8">
      <TapeLabel tone="green">Rien à afficher pour le moment</TapeLabel>
      <h3 className="ae2v-headline mt-4 text-[clamp(1.6rem,4vw,2.6rem)]">{label}</h3>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">{detail}</p>
      {action && <div className="mt-6 flex">{action}</div>}
    </div>
  );
}
