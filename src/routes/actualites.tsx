import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHero } from "@/components/layout/page-hero";
import { EmptyState, HardCard, Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/actualites")({
  head: () => ({
    meta: [
      { title: "Actualités — AE2V" },
      {
        name: "description",
        content:
          "Annonces, comptes rendus et informations du bureau de l'AE2V, association étudiante de l'IUT de Vélizy.",
      },
      { property: "og:title", content: "Actualités — AE2V" },
      { property: "og:description", content: "Les annonces et informations du bureau AE2V." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/actualites" },
    ],
    links: [{ rel: "canonical", href: "/actualites" }],
  }),
  component: ActualitesPage,
});

function ActualitesPage() {
  return (
    <>
      <PageHero
        eyebrow="Le fil AE2V"
        title="Actualités"
        intro="Annonces du bureau, retours d'événements et informations pratiques pour la promo."
      />

      <Section number={1} ghost="NEWS" title="Dernières publications">
        <EmptyState
          label="Aucune actualité publiée"
          detail="Le bureau n'a pas encore publié d'article. En attendant, les annonces du jour passent surtout par Instagram et par les affichages du campus."
          action={
            <Button asChild size="lg" variant="secondary">
              <Link to="/contact">Contacter le bureau</Link>
            </Button>
          }
        />
      </Section>

      <Section number={2} ghost="SUIVRE" title="Où nous suivre" tone="dark">
        <div className="grid gap-4 md:grid-cols-3">
          <HardCard eyebrow="Événements" title="La programmation" tone="dark">
            Toutes les dates et la billetterie sont sur la page{" "}
            <Link className="ae2v-link font-bold text-ae2v-green" to="/evenements">
              événements
            </Link>
            .
          </HardCard>
          <HardCard eyebrow="Contact" title="Écrire au bureau" tone="dark">
            Une question, un projet, un partenariat : la page{" "}
            <Link className="ae2v-link font-bold text-ae2v-green" to="/contact">
              contact
            </Link>{" "}
            regroupe les bons interlocuteurs.
          </HardCard>
          <HardCard eyebrow="Association" title="Qui fait quoi" tone="dark">
            Les pôles et les membres du bureau sont présentés sur la page{" "}
            <Link className="ae2v-link font-bold text-ae2v-green" to="/bde">
              le BDE
            </Link>
            .
          </HardCard>
        </div>
      </Section>
    </>
  );
}
