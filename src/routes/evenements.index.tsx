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
        eyebrow="Agenda AE2V"
        title="Événements"
        intro="La soirée d’intégration AE2V chez Doddy’s Coffee a eu lieu le vendredi 18 septembre. Les inscriptions sont fermées ; retrouve ses informations parmi les événements passés."
      >
        {!account && (
          <Button asChild size="lg">
            <a href="https://discord.gg/z85wnSmdnH" target="_blank" rel="noreferrer">
              Rejoindre Discord pour les informations d'inscription
            </a>
          </Button>
        )}
      </PageHero>

      <Section
        ghost="AGENDA"
        title="À venir"
        intro={
          upcoming.length
            ? "Retrouve les informations pratiques des prochains rendez-vous."
            : "Aucun nouvel événement n’est annoncé pour le moment. Suis notre Discord pour les prochaines dates."
        }
      >
        {upcoming.length > 0 && (
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
        )}
      </Section>

      <Section
        ghost="ARCHIVES"
        title="Événements passés"
        intro="Retrouve les informations des événements terminés."
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
