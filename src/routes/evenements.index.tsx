import { createFileRoute, Link } from "@tanstack/react-router";

import { EventCard } from "@/components/evenements/event-card";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { publicEvents } from "@/data/events";
import type { Audience } from "@/lib/event-pricing";

export const Route = createFileRoute("/evenements/")({
  head: () => ({
    meta: [
      { title: "Événements AE2V — Soirées, gala et sorties étudiantes" },
      {
        name: "description",
        content:
          "Tous les événements de l'AE2V : soirées, afterworks, tournois et gala. Tarifs cotisants, jauges et billetterie avec QR code.",
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
  const account = null;
  const events = publicEvents;
  const audience: Audience = "public";
  const upcoming = events.filter((e) => e.status !== "TERMINE");
  const past = events.filter((e) => e.status === "TERMINE");

  return (
    <>
      <PageHero
        eyebrow="Billetterie"
        title="Événements"
        intro="Soirées, afterworks, tournois et gala. Tarif réduit pour les adhérents, billet nominatif avec QR code."
      >
        {!account && (
          <Button asChild size="lg">
            <a href="https://discord.gg/z85wnSmdnH" target="_blank" rel="noreferrer">Rejoindre Discord pour les informations d'inscription</a>
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
            : "Inscris-toi directement au tarif public ; connecte-toi seulement pour accéder aux tarifs cotisant ou bureau."
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
