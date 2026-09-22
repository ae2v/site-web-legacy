import { Link } from "@tanstack/react-router";
import { CalendarDays, Clock3, ExternalLink, MapPin, Ticket } from "lucide-react";

import { GrainOverlay } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { eventStatusLabels, type Ae2vEvent } from "@/data/events";

export function EventDetails({ event }: { event: Ae2vEvent }) {
  const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(
    `${event.place}, ${event.address}`,
  )}&output=embed`;

  return (
    <article className="bg-background text-foreground">
      <header
        data-cursor-scheme="light"
        className="relative isolate min-h-[28rem] overflow-hidden border-b-2 border-ae2v-black bg-ae2v-black text-ae2v-offwhite"
      >
        <img
          src={event.image}
          alt={`Affiche de ${event.title}`}
          width={1680}
          height={943}
          className="absolute inset-0 -z-20 size-full object-cover"
        />
        <span aria-hidden="true" className="absolute inset-0 -z-10 bg-ae2v-black/55" />
        <GrainOverlay opacity={0.12} />

        <div className="relative mx-auto w-full max-w-7xl px-5 py-14 md:px-6 md:py-20">
          <Link
            to="/evenements"
            className="ae2v-focus inline-flex min-h-11 items-center text-xs font-bold tracking-[0.16em] uppercase hover:text-ae2v-green"
          >
            ← Tous les événements
          </Link>
          <p className="mt-6 text-[0.7rem] font-bold tracking-[0.2em] text-ae2v-green uppercase">
            {event.kind} · AE2V
          </p>
          <h1 className="ae2v-headline mt-2 max-w-4xl text-[clamp(2.5rem,8vw,6rem)] leading-[0.92]">
            {event.title}
          </h1>
          <p className="mt-4 max-w-2xl border-l-4 border-ae2v-red pl-4 text-sm leading-6 md:text-base">
            {event.summary}
          </p>
          <span className="mt-5 inline-flex border-2 border-ae2v-black bg-ae2v-green px-3 py-1 text-xs font-bold uppercase text-ae2v-black">
            {eventStatusLabels[event.status]}
          </span>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-8 md:px-6 md:py-14 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.55fr)]">
        <div className="min-w-0 space-y-9">
          <section aria-labelledby={`${event.id}-infos`}>
            <h2 id={`${event.id}-infos`} className="ae2v-headline text-2xl md:text-3xl">
              Les infos à retenir
            </h2>
            <dl className="mt-4 grid gap-4 border-2 border-ae2v-black bg-card p-4 text-sm sm:grid-cols-2">
              <Info icon={CalendarDays} label="Date" value={event.date} />
              <Info icon={Clock3} label="Horaires" value={event.doors} />
              <Info icon={MapPin} label="Lieu" value={`${event.place} · ${event.address}`} />
              <Info icon={Ticket} label="Tarif" value="Gratuit sur inscription" />
            </dl>
            <p className="mt-5 max-w-3xl text-sm leading-7 md:text-base">{event.description}</p>
          </section>

          <section aria-labelledby={`${event.id}-programme`}>
            <h2 id={`${event.id}-programme`} className="ae2v-headline text-2xl md:text-3xl">
              Le déroulé
            </h2>
            <ol className="mt-4 border-l-4 border-ae2v-red pl-5">
              {event.program.map((step) => (
                <li key={`${step.time}-${step.label}`} className="relative pb-5 last:pb-0">
                  <span
                    aria-hidden="true"
                    className="absolute top-1.5 -left-[1.72rem] size-3 border-2 border-ae2v-black bg-ae2v-green"
                  />
                  <p className="font-impact text-lg text-ae2v-red">{step.time}</p>
                  <p className="text-sm font-bold">{step.label}</p>
                  {step.detail && (
                    <p className="mt-1 text-sm text-muted-foreground">{step.detail}</p>
                  )}
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby={`${event.id}-pratique`}>
            <h2 id={`${event.id}-pratique`} className="ae2v-headline text-2xl md:text-3xl">
              Bon à savoir
            </h2>
            <ul className="mt-4 space-y-3">
              {event.practical.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 border-l-2 border-ae2v-red pl-3 text-sm leading-6"
                >
                  <span aria-hidden="true" className="mt-2 size-2 shrink-0 bg-ae2v-red" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby={`${event.id}-acces`}>
            <h2 id={`${event.id}-acces`} className="ae2v-headline text-2xl md:text-3xl">
              Venir au Doddy’s
            </h2>
            <p className="mt-4 border-2 border-ae2v-black bg-card p-4 text-sm leading-7">
              {event.access}
            </p>
          </section>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <div className="border-2 border-ae2v-black bg-ae2v-green p-5 text-ae2v-black">
            <p className="text-xs font-bold uppercase tracking-[0.16em]">Entrée</p>
            <p className="mt-1 font-impact text-4xl uppercase">Gratuite</p>
            <p className="mt-2 text-sm leading-6">
              Inscris-toi pour que l’AE2V puisse prévoir ta boisson sans alcool offerte.
            </p>
          </div>
          {event.registrationUrl && (
            <Button asChild size="lg" className="min-h-12 w-full">
              <a
                href={event.registrationUrl}
                target="_blank"
                rel="noreferrer"
                data-cursor="navigate"
                data-cursor-label="HelloAsso"
              >
                S’inscrire sur HelloAsso <ExternalLink aria-hidden="true" />
              </a>
            </Button>
          )}
          {event.mapUrl && (
            <Button asChild size="lg" variant="outline" className="min-h-12 w-full">
              <a
                href={event.mapUrl}
                target="_blank"
                rel="noreferrer"
                data-cursor="navigate"
                data-cursor-label="Itinéraire"
              >
                Ouvrir dans Google Maps <MapPin aria-hidden="true" />
              </a>
            </Button>
          )}
        </aside>
      </div>

      <section
        aria-labelledby={`${event.id}-carte`}
        className="border-y-2 border-ae2v-black bg-ae2v-black text-ae2v-offwhite"
      >
        <div className="mx-auto w-full max-w-7xl px-5 py-10 md:px-6 md:py-14">
          <p className="text-xs font-bold tracking-[0.18em] text-ae2v-green uppercase">Accès</p>
          <div className="mt-2 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <h2 id={`${event.id}-carte`} className="ae2v-headline text-3xl md:text-5xl">
                Trouver {event.place}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-ae2v-offwhite/80">
                {event.access}
              </p>
            </div>
            {event.directionsUrl && (
              <Button asChild size="lg" className="min-h-12 shrink-0">
                <a
                  href={event.directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  data-cursor="navigate"
                  data-cursor-label="Itinéraire"
                >
                  Itinéraire à pied depuis l’IUT <ExternalLink aria-hidden="true" />
                </a>
              </Button>
            )}
          </div>

          <div className="mt-7 overflow-hidden border-2 border-ae2v-offwhite bg-ae2v-offwhite">
            <iframe
              src={mapEmbedUrl}
              title={`Carte Google Maps de ${event.place}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block h-[22rem] w-full md:h-[30rem]"
              allowFullScreen
            />
          </div>
        </div>
      </section>
    </article>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 gap-3">
      <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ae2v-red" />
      <div className="min-w-0">
        <dt className="text-[0.65rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
          {label}
        </dt>
        <dd className="mt-1 font-bold break-words">{value}</dd>
      </div>
    </div>
  );
}
