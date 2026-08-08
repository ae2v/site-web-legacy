import type { ReactNode } from "react";

import { PageHero } from "@/components/layout/page-hero";

/**
 * Informations légales centralisées.
 * ⚠️ Les valeurs marquées `TODO` doivent être renseignées par le bureau AE2V
 * avec les pièces officielles (récépissé de déclaration, statuts, assurance).
 * Ne jamais inventer ces informations.
 */
export const legalInfo = {
  siteName: "AE2V",
  legalName: "AE2V — Association des Étudiants de Vélizy",
  status: "Association loi 1901",
  /** TODO bureau : n° RNA (W…) figurant sur le récépissé de déclaration en préfecture. */
  rna: null as string | null,
  /** TODO bureau : n° SIRET si l'association en possède un. */
  siret: null as string | null,
  /** TODO bureau : adresse du siège social déclarée en préfecture. */
  address: null as string | null,
  /** TODO bureau : nom du/de la président·e en exercice (directeur·rice de la publication). */
  publicationDirector: null as string | null,
  contactEmail: "contact@ae2v.fr",
  /** Le site est conçu, publié et maintenu par l'association elle-même. */
  webmaster: "Le pôle Communication / Web de l'AE2V (webmestre interne à l'association)",
  webmasterEmail: "contact@ae2v.fr",
  host: {
    name: "Oracle Cloud Infrastructure (OCI)",
    company: "Oracle France SAS",
    /** TODO bureau : adresse exacte figurant au contrat OCI. */
    address: null as string | null,
    region: "Régions Oracle Cloud situées dans l'Union européenne",
    site: "https://www.oracle.com/fr/cloud/",
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

/** Valeur non encore fournie par le bureau : affichée honnêtement, jamais inventée. */
export function LegalPending({ label }: { label: string }) {
  return (
    <span className="text-ae2v-black/60 italic">
      {label} — information en cours de validation par le bureau, communiquée sur demande à{" "}
      <LegalMail />.
    </span>
  );
}
