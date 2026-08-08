import { createFileRoute, Link } from "@tanstack/react-router";

import { EventCard } from "@/components/evenements/event-card";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { demoEvents } from "@/data/events";
import { hasDiscount, isMember, useDemoSession } from "@/lib/demo-session";
import type { Audience } from "@/lib/event-pricing";

export const Route = createFileRoute("/evenements/")({
  head: () => ({
    meta: [
      { title: "Événements AE2V — Soirées, gala et sorties étudiantes" },
      {
        name: "description",
        content:
          "Tous les événements de l'AE2V : soirées, afterworks, tournois et gala. Tarifs adhérents, jauges et billetterie avec QR code.",
      },
      { property: "og:title", content: "Événements AE2V" },
      {
        property: "og:description",
        content: "Soirées, afterworks, tournois et gala de l'association étudiante de Vélizy.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/evenements" },
    ],
    links: [{ rel: "canonical", href: "/evenements" }],
  }),
  component: EvenementsPage,
});

function EvenementsPage() {
  const { account } = useDemoSession();
  const audience: Audience = hasDiscount(account)
    ? "adherent"
    : isMember(account)
      ? "membre"
      : "public";
  const upcoming = demoEvents.filter((e) => e.status !== "TERMINE");
  const past = demoEvents.filter((e) => e.status === "TERMINE");

  return (
    <>
      <PageHero
        eyebrow="Billetterie"
        title="Événements"
        intro="Soirées, afterworks, tournois et gala. Tarif réduit pour les adhérents, billet nominatif avec QR code."
      >
        {!account && (
          <Button asChild size="lg">
            <Link to="/connexion">Se connecter pour voir mon tarif</Link>
          </Button>
        )}
      </PageHero>

      <Section
        number={1}
        ghost="AGENDA"
        title="À venir"
        intro={
          account
            ? `Tarifs affichés pour ton statut : ${audience === "adherent" ? "membre cotisant" : "membre non cotisant (réductions réservées aux cotisants)"}.`
            : "Connecte-toi pour voir ton tarif personnel et t'inscrire. Les tarifs public restent visibles."
        }
      >
        <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {upcoming.map((event, index) => (
            <li key={event.id} className="h-full">
              <EventCard
                event={event}
                audience={audience}
                connected={Boolean(account)}
                index={index}
              />
            </li>
          ))}
        </ul>
      </Section>

      <Section
        number={2}
        ghost="ARCHIVES"
        title="Événements passés"
        tone="dark"
        intro="L'historique reste consultable : il alimente ton espace et les billets déjà utilisés."
      >
        <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {past.map((event, index) => (
            <li key={event.id} className="h-full">
              <EventCard
                event={event}
                audience={audience}
                connected={Boolean(account)}
                index={index}
              />
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
