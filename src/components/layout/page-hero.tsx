import type { ReactNode } from "react";

import { CrystalCluster, DotCloud, GrainOverlay, ImpactTitle, TapeLabel } from "@/components/brand";

/**
 * Gabarit de page publique : bandeau titre de marque + contenu.
 */
export function PageHero({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children?: ReactNode;
}) {
  return (
    <section
      data-cursor-scheme="light"
      className="relative overflow-hidden bg-ae2v-red text-ae2v-offwhite"
    >
      <GrainOverlay opacity={0.08} />
      <CrystalCluster
        tone="black"
        variant={2}
        className="absolute -right-10 -bottom-16 h-56 w-56 opacity-25"
      />
      <DotCloud className="absolute top-6 left-6 text-ae2v-offwhite/30" columns={7} rows={4} />

      {/* Titre fantôme monumental, purement décoratif */}
      <span
        aria-hidden="true"
        className="ae2v-headline pointer-events-none absolute -bottom-[0.14em] left-0 w-full overflow-hidden text-[clamp(7rem,26vw,20rem)] whitespace-nowrap text-ae2v-black/10 select-none"
      >
        {title}
      </span>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <TapeLabel tone="green">{eyebrow}</TapeLabel>
        <ImpactTitle
          as="h1"
          size="xl"
          className="mt-6 motion-safe:[animation:ae2v-rise_0.6s_cubic-bezier(0.22,1,0.36,1)_both]"
        >
          {title}
        </ImpactTitle>
        {intro && (
          <p className="mt-6 max-w-2xl border-l-4 border-ae2v-green pl-4 text-base md:text-lg">
            {intro}
          </p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}

/**
 * État vide honnête : aucune donnée inventée avant la phase fonctionnelle.
 */
export function ComingSoon({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6">
      <div className="border-2 border-ae2v-black bg-card p-8">
        <h2 className="ae2v-headline text-[clamp(2rem,5.5vw,3.5rem)]">{label}</h2>
        <p className="mt-4 max-w-xl text-sm text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

