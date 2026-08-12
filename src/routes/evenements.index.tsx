import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, MapPin, ArrowUpRight } from "lucide-react";

import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { publicEvents, eventStatusLabels } from "@/data/events";

export const Route = createFileRoute("/evenements/")({
  head: () => ({ meta: [{ title: "Événements — AE2V" }, { name: "description", content: "Les événements publics de l'AE2V à Vélizy." }] }),
  component: EventsPage,
});

function EventsPage() {
  const events = publicEvents.filter((event) => event.status !== "TERMINE");
  return (
    <>
      <PageHero eyebrow="Agenda AE2V" title="Événements" intro="Retrouve les rendez-vous qui font vivre le campus. Les inscriptions et informations pratiques sont annoncées sur Discord." />
      <Section number={1} ghost="AGENDA" title="À venir">
        {events.length === 0 ? <p className="border-2 border-dashed border-ae2v-black/30 p-8">La programmation arrive bientôt sur Discord.</p> : <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{events.map((event) => <li key={event.id} className="border-2 border-ae2v-black bg-card p-5"><div className="flex items-center justify-between gap-3 text-xs font-bold uppercase"><span className="bg-ae2v-green px-2 py-1 text-ae2v-black">{eventStatusLabels[event.status]}</span><span>{event.capacity ? `${event.capacity} places` : "Places limitées"}</span></div><h2 className="mt-5 font-impact text-3xl uppercase">{event.title}</h2><p className="mt-3 flex items-center gap-2 text-sm"><CalendarDays className="size-4" aria-hidden="true" />{event.date} · portes {event.doors}</p><p className="mt-2 flex items-center gap-2 text-sm"><MapPin className="size-4" aria-hidden="true" />{event.place}</p><p className="mt-4 text-sm text-muted-foreground">{event.description}</p><Link to="/contact" className="mt-6 inline-flex min-h-11 items-center gap-2 border-2 border-ae2v-black px-4 text-sm font-bold uppercase hover:bg-ae2v-red hover:text-white">Infos et inscription <ArrowUpRight className="size-4" aria-hidden="true" /></Link></li>)}</ul>}
      </Section>
    </>
  );
}
