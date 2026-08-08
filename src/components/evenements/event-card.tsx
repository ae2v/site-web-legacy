import { Link } from "@tanstack/react-router";
import { CalendarDays, MapPin } from "lucide-react";

import { Reveal } from "@/components/brand/reveal";
import { eventStatusLabels, type Ae2vEvent } from "@/data/events";
import { fillPercent, remainingSeats, tierForAudience, type Audience } from "@/lib/event-pricing";
import { formatCents } from "@/lib/demo-session";
import { cn } from "@/lib/utils";

const statusTone: Record<Ae2vEvent["status"], string> = {
  OUVERT: "bg-ae2v-green text-ae2v-black",
  BIENTOT: "bg-ae2v-offwhite text-ae2v-black",
  COMPLET: "bg-ae2v-red text-ae2v-offwhite",
  TERMINE: "bg-ae2v-black text-ae2v-offwhite",
};

/**
 * Carte d'événement : visuel, titre, date, lieu, courte description et tarif
 * applicable. Toute la carte mène à la page complète de l'événement.
 */
export function EventCard({
  event,
  audience,
  connected,
  index = 0,
  compact = false,
}: {
  event: Ae2vEvent;
  audience: Audience;
  connected: boolean;
  index?: number;
  /** Version condensée (accueil) : visuel plus court, sans résumé ni jauge. */
  compact?: boolean;
}) {
  const tier = tierForAudience(event, audience);
  const remaining = remainingSeats(event);
  const fill = fillPercent(event);

  return (
    <Reveal delay={index * 70}>
      <article className="group relative flex h-full flex-col border-2 border-ae2v-black bg-ae2v-offwhite text-ae2v-black transition-transform duration-200 motion-safe:group-hover:-translate-y-1 motion-safe:hover:-translate-y-1">
        <div className="relative overflow-hidden border-b-2 border-ae2v-black">
          <img
            src={event.image}
            alt=""
            width={1280}
            height={720}
            loading="lazy"
            className={cn(
              "w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none",
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
            {event.kind} · démonstration
          </p>
          <h3
            className={cn(
              "ae2v-headline mt-1",
              compact ? "text-[clamp(1.15rem,2.2vw,1.5rem)]" : "text-[clamp(1.4rem,3vw,2rem)]",
            )}
          >
            <Link
              to="/evenements/$eventId"
              params={{ eventId: event.id }}
              data-cursor="interactive"
              data-cursor-label="Voir l'événement"
              className="ae2v-focus after:absolute after:inset-0 after:content-['']"
            >
              {event.title}
            </Link>
          </h3>

          <dl className={cn("mt-2 space-y-1", compact ? "text-xs" : "mt-3 space-y-1.5 text-sm")}>
            <div className="flex items-center gap-2">
              <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-ae2v-red" />
              <dt className="sr-only">Date</dt>
              <dd>
                {event.date} · {event.doors}
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <MapPin aria-hidden="true" className="size-4 shrink-0 text-ae2v-red" />
              <dt className="sr-only">Lieu</dt>
              <dd>{compact ? event.place : `${event.place} · ${event.address}`}</dd>
            </div>
          </dl>

          {!compact && <p className="mt-3 text-sm text-ae2v-black/80">{event.summary}</p>}

          {!compact && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-[0.65rem] font-bold tracking-[0.14em] uppercase">
                <span>Jauge</span>
                <span>
                  {event.registered}/{event.capacity} · {remaining} place{remaining > 1 ? "s" : ""}
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={fill}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Remplissage de ${event.title}`}
                className="mt-1.5 h-2.5 w-full border-2 border-ae2v-black bg-ae2v-offwhite"
              >
                <div
                  className={fill >= 100 ? "h-full bg-ae2v-red" : "h-full bg-ae2v-green"}
                  style={{ width: `${fill}%` }}
                />
              </div>
            </div>
          )}

          <div
            className={cn(
              "mt-auto flex items-end justify-between gap-3 border-t-2 border-ae2v-black/15",
              compact ? "pt-3" : "pt-4",
            )}
          >
            <p className="leading-tight">
              <span
                className={cn(
                  "block font-impact text-ae2v-red",
                  compact ? "text-xl" : "text-2xl",
                )}
              >
                {tier ? (tier.priceCents === 0 ? "Gratuit" : formatCents(tier.priceCents)) : "—"}
              </span>
              <span className="text-[0.65rem] font-bold tracking-[0.14em] text-ae2v-black/70 uppercase">
                {connected
                  ? audience === "adherent"
                    ? "ton tarif cotisant"
                    : "ton tarif membre"
                  : "tarif public"}
              </span>
            </p>
            <span
              aria-hidden="true"
              className="border-2 border-ae2v-black bg-ae2v-black px-3 py-2 text-xs font-bold uppercase text-ae2v-offwhite transition-colors group-hover:bg-ae2v-red"
            >
              Voir la page
            </span>
          </div>

        </div>
      </article>
    </Reveal>
  );
}
