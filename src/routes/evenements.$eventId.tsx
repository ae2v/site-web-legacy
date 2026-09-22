import { createFileRoute, notFound } from "@tanstack/react-router";

import { EventDetails } from "@/components/evenements/event-details";
import { findEvent } from "@/data/events";

export const Route = createFileRoute("/evenements/$eventId")({
  loader: ({ params }) => {
    const event = findEvent(params.eventId);
    if (!event) throw notFound();
    return { event };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Événement introuvable — AE2V" }] };
    }
    const { event } = loaderData;
    const title = `${event.title} — AE2V`;
    const description = `${event.date} à ${event.place}. ${event.summary}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/evenements/${event.id}` },
      ],
      links: [{ rel: "canonical", href: `/evenements/${event.id}` }],
    };
  },
  component: EventPage,
});

function EventPage() {
  const { event } = Route.useLoaderData();
  return <EventDetails event={event} />;
}
