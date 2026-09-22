import { Link } from "@tanstack/react-router";
import { CalendarDays, MapPin } from "lucide-react";

import { Reveal } from "@/components/brand/reveal";
import { eventStatusLabels, type Ae2vEvent } from "@/data/events";
import type { Audience } from "@/lib/event-pricing";
import { cn } from "@/lib/utils";

const statusTone: Record<Ae2vEvent["status"], string> = {
  NON_PUBLIE: "bg-ae2v-black text-ae2v-offwhite",
  OUVERT: "bg-ae2v-green text-ae2v-black",
  BIENTOT: "bg-ae2v-offwhite text-ae2v-black",
  COMPLET: "bg-ae2v-red text-ae2v-offwhite",
  TERMINE: "bg-ae2v-black text-ae2v-offwhite",
};

/** Carte entièrement cliquable menant vers la page complète de l’événement. */
export function EventCard({
  event,
  audience: _audience,
  connected: _connected,
  index = 0,
  compact = false,
}: {
  event: Ae2vEvent;
  audience: Audience;
  connected: boolean;
  index?: number;
  compact?: boolean;
}) {
  return (
    <Reveal delay={index * 70}>
      <article className="group relative flex h-full flex-col border-2 border-ae2v-black bg-ae2v-offwhite text-ae2v-black shadow-[6px_6px_0_var(--ae2v-black)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-[10px_10px_0_var(--ae2v-red)] focus-within:-translate-y-1 focus-within:shadow-[10px_10px_0_var(--ae2v-red)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
        <Link
          to="/evenements/$eventId"
          params={{ eventId: event.id }}
          aria-label={`Voir la page complète de ${event.title}`}
          data-cursor="navigate"
          data-cursor-label="Voir l’événement"
          className="absolute inset-0 z-10 cursor-pointer focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-ae2v-green"
        >
          <span className="sr-only">Voir tous les détails de {event.title}</span>
        </Link>

        <div className="relative overflow-hidden border-b-2 border-ae2v-black">
          <img
            src={event.image}
            alt=""
            width={1680}
            height={943}
            loading="lazy"
            decoding="async"
            className={cn(
              "w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none",
              compact ? "aspect-[21/9]" : "aspect-[16/9]",
            )}
          />
          <p
            className={cn(
              "absolute top-3 left-0 border-2 border-ae2v-black px-3 py-1 text-xs font-bold uppercase",
              statusTone[event.status],
            )}
          >
            {eventStatusLabels[event.status]}
          </p>
        </div>

        <div className={cn("flex flex-1 flex-col", compact ? "p-4" : "p-5")}>
          <p className="text-[0.65rem] font-bold tracking-[0.18em] text-ae2v-red uppercase">
            {event.kind}
          </p>
          <h3
            className={cn(
              "ae2v-headline mt-1",
              compact ? "text-[clamp(1.15rem,2.2vw,1.5rem)]" : "text-[clamp(1.4rem,3vw,2rem)]",
            )}
          >
            {event.title}
          </h3>

          <dl className={cn("mt-2 space-y-1", compact ? "text-xs" : "mt-3 space-y-1.5 text-sm")}>
            <div className="flex items-center gap-2">
              <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-ae2v-red" />
              <dt className="sr-only">Date</dt>
              <dd>
                {event.date} · {event.doors}
              </dd>
            </div>
            <div className="flex items-start gap-2">
              <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ae2v-red" />
              <dt className="sr-only">Lieu</dt>
              <dd>{compact ? event.place : `${event.place} · ${event.address}`}</dd>
            </div>
          </dl>

          {!compact && <p className="mt-3 text-sm leading-6 text-ae2v-black/80">{event.summary}</p>}

          <div
            className={cn(
              "mt-auto flex items-end justify-between gap-3 border-t-2 border-ae2v-black/15",
              compact ? "pt-3" : "pt-4",
            )}
          >
            <div>
              <p className="font-impact text-2xl uppercase text-ae2v-red">Gratuit</p>
              <p className="text-[0.65rem] font-bold tracking-[0.12em] uppercase text-ae2v-black/60">
                sur inscription
              </p>
            </div>
            <span
              aria-hidden="true"
              className="border-2 border-ae2v-black bg-ae2v-black px-3 py-2 text-xs font-bold uppercase text-ae2v-offwhite transition-colors group-hover:bg-ae2v-red"
            >
              Voir les détails
            </span>
          </div>
        </div>
      </article>
    </Reveal>
  );
}
