import type { ReactNode } from "react";

import { PageHero } from "@/components/layout/page-hero";

/**
 * Informations légales centralisées de la version publique.
 */
export const legalInfo = {
  siteName: "AE2V",
  legalName: "ASSOCIATION ETUDIANTE DE VELIZY-VILLACOUBLAY",
  status: "Association loi 1901",
  rna: "W784003407",
  address: "5e étage, appartement 517, 5 rue Paul Dautier, 78140 Vélizy-Villacoublay",
  publicationDirector: "Heytham KORTAS",
  contactEmail: "contact@ae2v.fr",
  /** Le site public a été conçu et développé par Bastian NOËL. */
  webmaster: "Bastian NOËL",
  webmasterEmail: "contact@ae2v.fr",
  host: {
    name: "Vercel Inc.",
    company: "Vercel Inc.",
    address: "440 N Barranca Ave #4133, Covina, CA 91723, United States",
    region: "États-Unis",
    site: "https://vercel.com",
  },
  lastUpdate: "8 août 2026",
} as const;

export function LegalPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} intro={intro} />
      <section className="mx-auto w-full max-w-3xl px-4 py-14 md:px-6 md:py-20">
        <div className="flex flex-col gap-8">{children}</div>
        <p className="mt-12 border-t-2 border-ae2v-black/10 pt-5 text-xs uppercase tracking-[0.12em] text-muted-foreground">
          Dernière mise à jour : {legalInfo.lastUpdate}
        </p>
      </section>
    </>
  );
}

export function LegalBlock({
  title,
  children,
  as = "h2",
}: {
  title: string;
  children: ReactNode;
  as?: "h2" | "h3";
}) {
  const Tag = as;
  return (
    <div className="border-l-4 border-ae2v-red pl-5">
      <Tag className={as === "h2" ? "font-impact text-2xl" : "font-impact text-xl"}>{title}</Tag>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}

export function LegalMail({ address = legalInfo.contactEmail }: { address?: string }) {
  return (
    <a className="ae2v-link font-bold text-ae2v-red" href={`mailto:${address}`}>
      {address}
    </a>
  );
}
