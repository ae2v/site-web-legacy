import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Info } from "lucide-react";

import { MembershipForm } from "@/components/adhesion/membership-form";
import { MemberCard } from "@/components/membre/member-card";
import { PageHero } from "@/components/layout/page-hero";
import { FaqList, HardCard, Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/adherer")({
  head: () => ({
    meta: [
      { title: "Adhérer à l'AE2V — Adhésion étudiante" },
      {
        name: "description",
        content:
          "Formulaire d'adhésion à l'AE2V : quelques minutes, cotisation facultative à montant libre dès 5 €, carte de membre avec QR code après validation.",
      },
      { property: "og:title", content: "Adhérer à l'AE2V" },
      {
        property: "og:description",
        content: "Une adhésion par année scolaire, cotisation facultative à montant libre.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/adherer" },
    ],
    links: [{ rel: "canonical", href: "/adherer" }],
  }),
  component: AdhererPage,
});

/** Carte de démonstration affichée en aperçu (données fictives). */
const previewCard = {
  firstName: "Prénom",
  lastName: "Nom",
  membershipStatus: "VALIDE" as const,
  contributionStatus: "COTISANT" as const,
  departement: "MMI",
  niveau: "1re année",
  schoolYear: "2026-2027",
  memberSince: "12/09/2026",
  cardCode: "AE2V-EXEMPLE-0000",
};

function AdhererPage() {
  return (
    <>
      <PageHero
        eyebrow="Adhésion annuelle"
        title="Adhérer"
        intro="Remplis le formulaire ci-dessous : c'est la seule étape. L'adhésion est gratuite, la cotisation est facultative."
      >
        <Button asChild size="lg">
          <a href="#formulaire-adhesion">Aller au formulaire</a>
        </Button>
      </PageHero>

      {/* -------- Le formulaire d'abord : c'est l'action principale --------- */}
      <Section
        id="formulaire-adhesion"
        number={1}
        ghost="FORMULAIRE"
        title="Formulaire d'adhésion"
        intro="Cinq étapes courtes : identité, scolarité, adhésion, e-mails, confirmation. Aucun paiement n'est demandé sur ce site."
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
          <MembershipForm />

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="border-2 border-ae2v-black bg-card p-5">
              <p className="text-[0.65rem] font-bold tracking-[0.16em] uppercase">
                Ce qui se passe ensuite
              </p>
              <ul className="mt-3 space-y-3 text-sm">
                {[
                  "Ta demande est vérifiée par le BDE.",
                  "Un e-mail de validation t'est envoyé dès que possible.",
                  "Si tu cotises, le règlement se fait au bureau du BDE après validation ; l'e-mail explique la procédure.",
                  "Ta carte de membre apparaît ensuite dans « Mon espace ».",
                ].map((text) => (
                  <li key={text} className="flex gap-2">
                    <CheckCircle2
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-ae2v-red"
                    />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-start gap-2 border-2 border-ae2v-black/25 bg-transparent p-4 text-sm text-muted-foreground">
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <p>
                Besoin d'aide pour remplir le formulaire ? Écris-nous depuis la page{" "}
                <Link className="ae2v-link font-bold text-ae2v-red" to="/contact">
                  contact
                </Link>
                .
              </p>
            </div>
          </aside>
        </div>
      </Section>

      {/* --------------------- Aperçu de la future carte -------------------- */}
      <Section
        number={2}
        ghost="CARTE"
        title="Ta future carte de membre"
        tone="dark"
        intro="Aperçu du modèle exact de la carte numérique, avec des informations fictives. Elle apparaîtra dans « Mon espace » après validation de ton adhésion."
      >
        <div className="grid gap-6 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
          <MemberCard data={previewCard} size="preview" preview />
          <ul className="space-y-2 text-sm">
            <li>→ Nom, statut de membre et statut de cotisation.</li>
            <li>→ Formation, année et date d'adhésion.</li>
            <li>→ QR code scanné à l'entrée des événements et en boutique.</li>
            <li>→ Aucune donnée personnelle n'est encodée dans le QR code.</li>
          </ul>
        </div>
      </Section>

      {/* ---------------------- Informations, sans hover -------------------- */}
      <Section
        number={3}
        ghost="INFOS"
        title="Bon à savoir"
        intro="Les informations essentielles avant d'envoyer ta demande."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <HardCard interactive={false} eyebrow="Durée" title="Une année scolaire">
            L'adhésion couvre l'année en cours et prend fin à la rentrée suivante. L'historique
            reste visible dans ton espace.
          </HardCard>
          <HardCard interactive={false} eyebrow="Cotisation" title="Facultative, dès 5 €">
            Adhérer est gratuit. Cotiser est un soutien libre à partir de 5 €, réglé au bureau du
            BDE après validation. Seule une cotisation confirmée ouvre les tarifs réduits.
          </HardCard>
          <HardCard interactive={false} eyebrow="Portée" title="Carte nominative">
            L'adhésion est personnelle et non cessible : elle est liée à ton compte étudiant.
          </HardCard>
        </div>
      </Section>

      <Section number={4} ghost="FAQ" title="Questions fréquentes">
        <FaqList
          items={[
            {
              q: "Qui peut adhérer ?",
              a: "Les étudiantes et étudiants de l'IUT de Vélizy. Certaines offres peuvent être ouvertes plus largement selon l'événement.",
            },
            {
              q: "Dois-je payer quelque chose sur le site ?",
              a: "Non. Aucun paiement n'est demandé ici. Si tu choisis de cotiser, le règlement se fait au bureau du BDE après validation de ton adhésion.",
            },
            {
              q: "Suis-je membre si je ne cotise pas ?",
              a: "Oui. Une fois ton adhésion validée, tu es membre à part entière. Seules les réductions sont réservées aux cotisants.",
            },
            {
              q: "Que se passe-t-il à la fin de l'année ?",
              a: "L'adhésion expire à la fin de l'année scolaire. Ton historique est conservé et tu peux réadhérer à la rentrée.",
            },
            {
              q: "L'adhésion est-elle remboursable ?",
              a: (
                <>
                  Les cas sont précisés sur la page{" "}
                  <Link className="ae2v-link font-bold text-ae2v-red" to="/remboursements">
                    remboursements
                  </Link>
                  .
                </>
              ),
            },
          ]}
        />
      </Section>
    </>
  );
}
