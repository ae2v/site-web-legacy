import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { EventCard } from "@/components/evenements/event-card";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { getDynamicEvents } from "@/lib/dynamic-store";
import { getPublicEventsServer } from "@/lib/server-functions/events";
import { publicRecordToEvent } from "@/data/events";
import { hasDiscount, useDemoSession } from "@/lib/demo-session";
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
  const { account } = useDemoSession();
  const getPublicEvents = useServerFn(getPublicEventsServer);
  const [events, setEvents] = useState(import.meta.env.DEV ? getDynamicEvents() : []);

  useEffect(() => {
    let active = true;
    void getPublicEvents({ data: undefined })
      .then((records) => {
        if (!active) return;
        const serverEvents = records.map(publicRecordToEvent);
        const serverIds = new Set(serverEvents.map((event) => event.id));
        setEvents([
          ...serverEvents,
          ...(import.meta.env.DEV
            ? getDynamicEvents().filter((event) => !serverIds.has(event.id))
            : []),
        ]);
      })
      .catch(() => {
        if (import.meta.env.DEV) setEvents(getDynamicEvents());
      });
    const handleChanged = () => {
      if (import.meta.env.DEV) setEvents(getDynamicEvents());
    };
    window.addEventListener("ae2v_events_changed", handleChanged);
    return () => {
      active = false;
      window.removeEventListener("ae2v_events_changed", handleChanged);
    };
  }, [getPublicEvents]);

  const audience: Audience = hasDiscount(account) ? "adherent" : "public";
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
