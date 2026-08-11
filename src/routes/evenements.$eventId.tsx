import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { GrainOverlay } from "@/components/brand";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import {
  demoEvents,
  eventStatusLabels,
  findEvent,
  publicRecordToEvent,
  type Ae2vEvent,
} from "@/data/events";
import { formatCents, hasDiscount, useDemoSession } from "@/lib/demo-session";
import { fillPercent, remainingSeats, tierForAudience, type Audience } from "@/lib/event-pricing";
import { getDynamicEvents, saveDynamicEvents } from "@/lib/dynamic-store";
import { generateRandom2026Code } from "@/lib/id-generator";
import { cn } from "@/lib/utils";
import { getPublicEventServer, registerEventServer } from "@/lib/server-functions/events";

export const Route = createFileRoute("/evenements/$eventId")({
  loader: async ({ params }): Promise<{ event: Ae2vEvent }> => {
    const serverEvent = await getPublicEventServer({ data: { slug: params.eventId } });
    if (serverEvent) return { event: publicRecordToEvent(serverEvent) };
    if (import.meta.env.DEV) {
      const event = findEvent(params.eventId);
      if (event) return { event };
    }
    throw notFound();
  },

  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Événement introuvable — AE2V" }, { name: "robots", content: "noindex" }],
      };
    }
    const { event } = loaderData;
    const title = `${event.title} — Événement AE2V`;
    const description = `${event.date} · ${event.place}. ${event.summary}`;
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
  notFoundComponent: EventNotFound,
  component: EventPage,
});

const anchors = [
  { id: "infos", label: "Infos" },
  { id: "programme", label: "Programme" },
  { id: "tarifs", label: "Tarifs" },
  { id: "inscription", label: "Inscription" },
  { id: "acces", label: "Accès" },
] as const;

function EventNotFound() {
  return (
    <>
      <PageHero
        eyebrow="Événement"
        title="Introuvable"
        intro="Cet événement n'existe pas ou n'est plus publié."
      >
        <Button asChild size="lg">
          <Link to="/evenements">Retour aux événements</Link>
        </Button>
      </PageHero>
    </>
  );
}

function EventPage() {
  const { event } = Route.useLoaderData() as { event: Ae2vEvent };
  const { account } = useDemoSession();
  const audience: Audience =
    account?.role === "bureau" || account?.role === "bureau_admin"
      ? "bureau"
      : hasDiscount(account)
        ? "adherent"
        : "public";
  const myTier = tierForAudience(event, audience);
  const remaining = remainingSeats(event);
  const fill = fillPercent(event);
  const others = import.meta.env.DEV
    ? demoEvents.filter((e) => e.id !== event.id && e.status !== "TERMINE").slice(0, 3)
    : [];

  return (
    <>
      {/* --------------------------------- Hero --------------------------- */}
      <header
        data-cursor-scheme="light"
        className="relative isolate overflow-hidden border-b-2 border-ae2v-black bg-ae2v-black text-ae2v-offwhite"
      >
        {event.image ? (
          <img
            src={event.image}
            alt=""
            width={1280}
            height={720}
            className="absolute inset-0 -z-10 size-full object-cover opacity-45"
          />
        ) : null}
        <GrainOverlay opacity={0.14} />
        <div className="relative mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-20">
          <Link
            to="/evenements"
            className="ae2v-focus inline-flex min-h-11 items-center text-xs font-bold tracking-[0.16em] uppercase hover:text-ae2v-green"
          >
            ← Tous les événements
          </Link>
          <p className="mt-6 text-[0.7rem] font-bold tracking-[0.2em] text-ae2v-green uppercase">
            {event.kind} · AE2V
          </p>
          <h1 className="ae2v-headline mt-2 text-[clamp(2.4rem,8vw,6rem)] leading-[0.9]">
            {event.title}
          </h1>
          <p className="mt-4 max-w-2xl border-l-4 border-ae2v-red pl-4 text-sm md:text-base">
            {event.summary}
          </p>
          <p className="mt-6 inline-block border-2 border-ae2v-offwhite/50 px-3 py-1 text-xs font-bold uppercase">
            {eventStatusLabels[event.status]}
          </p>
        </div>
      </header>

      {/* ------------------------- Navigation par ancres ------------------- */}
      <nav
        aria-label="Sections de l'événement"
        data-cursor-scheme="light"
        className="sticky top-0 z-30 border-b-2 border-ae2v-black bg-ae2v-red text-ae2v-offwhite"
      >
        <ul className="mx-auto flex w-full max-w-7xl gap-1 overflow-x-auto px-4 md:px-6">
          {anchors.map((a) => (
            <li key={a.id}>
              <a
                href={`#${a.id}`}
                className="tap-44 inline-flex items-center px-4 text-xs font-bold tracking-[0.12em] whitespace-nowrap uppercase hover:bg-ae2v-black"
              >
                {a.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 md:px-6 md:py-20 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-14">
          {/* ------------------------------ Infos ------------------------- */}
          <section id="infos" className="scroll-mt-20">
            <h2 className="ae2v-headline text-[clamp(1.6rem,4vw,2.4rem)]">Informations</h2>
            <dl className="mt-5 grid gap-x-6 gap-y-4 border-2 border-ae2v-black bg-card p-5 text-sm sm:grid-cols-2">
              <Line label="Date" value={event.date} />
              <Line label="Horaires" value={event.doors} />
              <Line label="Lieu" value={`${event.place} · ${event.address}`} />
              <Line
                label="Inscriptions"
                value={`du ${event.registrationOpensAt} au ${event.registrationClosesAt}`}
              />
            </dl>
            <p className="mt-5 text-sm leading-relaxed">{event.description}</p>
            <ul className="mt-5 space-y-2">
              {event.practical.map((item) => (
                <li key={item} className="flex gap-3 text-sm">
                  <span aria-hidden="true" className="font-bold text-ae2v-red">
                    ✕
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* ---------------------------- Programme ------------------------ */}
          <section id="programme" className="scroll-mt-20">
            <h2 className="ae2v-headline text-[clamp(1.6rem,4vw,2.4rem)]">Programme</h2>
            <ol className="mt-5 border-l-4 border-ae2v-red pl-5">
              {event.program.map((step) => (
                <li key={`${step.time}-${step.label}`} className="relative pb-6 last:pb-0">
                  <span
                    aria-hidden="true"
                    className="absolute top-1.5 -left-[1.72rem] size-3 border-2 border-ae2v-black bg-ae2v-green"
                  />
                  <p className="font-impact text-lg">{step.time}</p>
                  <p className="text-sm font-bold">{step.label}</p>
                  {step.detail && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{step.detail}</p>
                  )}
                </li>
              ))}
            </ol>
          </section>

          {/* ------------------------------ Accès -------------------------- */}
          <section id="acces" className="scroll-mt-20">
            <h2 className="ae2v-headline text-[clamp(1.6rem,4vw,2.4rem)]">Accès</h2>
            <p className="mt-4 border-2 border-ae2v-black bg-card p-5 text-sm leading-relaxed">
              {event.access}
            </p>
          </section>
          {event.customSections?.map((section) => (
            <section key={section.title} className="scroll-mt-20">
              <h2 className="ae2v-headline text-[clamp(1.6rem,4vw,2.4rem)]">{section.title}</h2>
              <p className="mt-4 whitespace-pre-line border-2 border-ae2v-black bg-card p-5 text-sm leading-relaxed">
                {section.body}
              </p>
            </section>
          ))}
        </div>

        {/* --------------------------- Colonne latérale -------------------- */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <section
            id="tarifs"
            className="scroll-mt-20 border-2 border-ae2v-black bg-ae2v-offwhite p-5 text-ae2v-black"
          >
            <h2 className="font-impact text-xl uppercase">Tarifs</h2>
            <ul className="mt-4 space-y-2">
              {event.tiers
                .filter((tier) => !tier.disabled)
                .map((tier) => {
                  const mine = myTier?.id === tier.id && Boolean(account);
                  return (
                    <li
                      key={tier.id}
                      className={cn(
                        "flex items-baseline justify-between gap-3 border-2 px-3 py-2 text-sm",
                        mine ? "border-ae2v-red bg-ae2v-red/10 font-bold" : "border-ae2v-black/15",
                      )}
                    >
                      <span>
                        {tier.label}
                        {mine && (
                          <span className="ml-2 bg-ae2v-red px-1.5 py-0.5 text-[0.6rem] font-bold text-ae2v-offwhite uppercase">
                            Ton tarif
                          </span>
                        )}
                        {tier.note && (
                          <span className="block text-xs font-normal opacity-70">{tier.note}</span>
                        )}
                      </span>
                      <span className="font-impact text-lg whitespace-nowrap">
                        {tier.priceCents === 0 ? "Gratuit" : formatCents(tier.priceCents)}
                      </span>
                    </li>
                  );
                })}
            </ul>
          </section>

          <section id="inscription" className="scroll-mt-20 border-2 border-ae2v-black bg-card p-5">
            <h2 className="font-impact text-xl uppercase">Inscription</h2>
            <div className="mt-3 flex items-center justify-between text-xs font-bold uppercase">
              <span>Jauge</span>
              <span>
                {event.registered}/{event.capacity} · {remaining} restante
                {remaining > 1 ? "s" : ""}
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={fill}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Remplissage de ${event.title}`}
              className="mt-2 h-3 w-full border-2 border-ae2v-black bg-ae2v-offwhite"
            >
              <div
                className={fill >= 100 ? "h-full bg-ae2v-red" : "h-full bg-ae2v-green"}
                style={{ width: `${fill}%` }}
              />
            </div>
            <div className="mt-5">
              <RegistrationCta event={event} connected={Boolean(account)} audience={audience} />
            </div>
          </section>

          {others.length > 0 && (
            <section className="border-2 border-ae2v-black bg-ae2v-black p-5 text-ae2v-offwhite">
              <h2 className="font-impact text-xl uppercase">Autres événements</h2>
              <ul className="mt-3 space-y-2">
                {others.map((other) => (
                  <li key={other.id}>
                    <Link
                      to="/evenements/$eventId"
                      params={{ eventId: other.id }}
                      className="ae2v-focus flex min-h-11 items-center justify-between gap-3 border-2 border-ae2v-offwhite/25 px-3 text-sm hover:bg-ae2v-red"
                    >
                      <span className="font-bold">{other.title}</span>
                      <span className="text-xs opacity-75">{other.date}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}

function RegistrationCta({
  event,
  connected,
  audience,
}: {
  event: Ae2vEvent;
  connected: boolean;
  audience: Audience;
}) {
  const { account, addTicket } = useDemoSession();
  const registerEvent = useServerFn(registerEventServer);
  const [registrationState, setRegistrationState] = useState<
    "CONFIRMEE" | "LISTE_ATTENTE" | "PAIEMENT_EN_ATTENTE" | null
  >(null);
  const [registrationTicketCode, setRegistrationTicketCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guestFormOpen, setGuestFormOpen] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestConsent, setGuestConsent] = useState(false);
  const [guestTermsConsent, setGuestTermsConsent] = useState(false);
  const [guestImageConsent, setGuestImageConsent] = useState(false);

  const myTierLocal = tierForAudience(event, audience);
  const selectableTiers = event.tiers.filter(
    (tier) => !tier.disabled && (tier.audience === "public" || tier.audience === audience),
  );
  const [selectedTierId, setSelectedTierId] = useState(myTierLocal?.id ?? "");
  const selectedTier = selectableTiers.find((tier) => tier.id === selectedTierId) ?? myTierLocal;

  const alreadyHasTicket = account?.tickets.some(
    (t) => t.eventId === event.id && t.status === "valide",
  );
  const hasPendingTicket = account?.tickets.some(
    (t) => t.eventId === event.id && t.status !== "utilise" && t.status !== "valide",
  );

  if (event.status === "TERMINE") {
    return (
      <p className="border-2 border-dashed border-ae2v-black/40 p-3 text-sm">
        Événement terminé. Les billets associés sont marqués comme utilisés dans « Mon espace ».
      </p>
    );
  }
  if (event.status === "BIENTOT") {
    return (
      <p className="border-2 border-dashed border-ae2v-black/40 p-3 text-sm">
        Billetterie ouverte le {event.registrationOpensAt}.
      </p>
    );
  }
  if (event.status === "COMPLET" && !event.waitlist) {
    return (
      <>
        <Button className="w-full" size="lg" variant="secondary" disabled={!event.waitlist}>
          {event.waitlist ? "Rejoindre la liste d'attente" : "Complet"}
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          Jauge atteinte. La place se libère uniquement par désistement.
        </p>
      </>
    );
  }
  if (!connected && !guestFormOpen) {
    return (
      <>
        <Button className="w-full" size="lg" onClick={() => setGuestFormOpen(true)}>
          S'inscrire sans compte
        </Button>
        <Button asChild className="mt-2 w-full" size="lg" variant="outline">
          <Link to="/connexion">Se connecter (tarif cotisant / bureau)</Link>
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          L'inscription publique est nominative. Les tarifs cotisant et bureau nécessitent une
          connexion.
        </p>
      </>
    );
  }

  if (alreadyHasTicket || hasPendingTicket || registrationState) {
    const currentState =
      registrationState ?? (hasPendingTicket ? "PAIEMENT_EN_ATTENTE" : "CONFIRMEE");
    return (
      <div className="border-2 border-ae2v-green bg-ae2v-green/10 p-4 text-sm">
        <p className="font-bold text-ae2v-black">
          {currentState === "LISTE_ATTENTE"
            ? "✓ Ajouté à la liste d’attente"
            : currentState === "PAIEMENT_EN_ATTENTE"
              ? "✓ Inscription enregistrée — paiement en attente"
              : "✓ Inscription confirmée"}
        </p>
        <p className="mt-1 text-ae2v-black/80">
          {currentState === "LISTE_ATTENTE"
            ? "Tu seras informé si une place se libère."
            : currentState === "PAIEMENT_EN_ATTENTE"
              ? "Le bureau doit confirmer le règlement avant que le billet soit utilisable. Conserve la référence ci-dessous pour le retrouver au scanner."
              : "Ton billet apparaît dans "}
          {currentState !== "LISTE_ATTENTE" && currentState !== "PAIEMENT_EN_ATTENTE" && (
            <>
              {" "}
              <Link to="/espace" className="font-bold underline">
                Mon espace
              </Link>{" "}
              avec son QR code.
            </>
          )}
        </p>
        {registrationTicketCode && (
          <p className="mt-3 border-2 border-ae2v-black bg-card px-3 py-2 font-mono text-xs text-ae2v-black">
            Référence billet : <strong>{registrationTicketCode}</strong>
          </p>
        )}
      </div>
    );
  }

  async function handleRegister() {
    if (!selectedTier) return;
    if (
      !connected &&
      (!guestName.trim() || !guestEmail.trim() || !guestConsent || !guestTermsConsent)
    ) {
      setError("Renseigne ton nom, ton e-mail et accepte les conditions d'inscription.");
      return;
    }
    if (connected && (!guestConsent || !guestTermsConsent)) {
      setError("Accepte les conditions d'inscription avant de confirmer.");
      return;
    }
    setError(null);
    try {
      const isLocalDemo = Boolean(account?.id.startsWith("acc-"));
      if (!isLocalDemo) {
        try {
          const result = await registerEvent({
            data: {
              eventSlug: event.id,
              tierId: selectedTier.id,
              ...(connected
                ? {
                    legalConsent: true,
                    termsConsent: guestTermsConsent,
                    imageConsent: guestImageConsent,
                  }
                : {
                    participantName: guestName,
                    participantEmail: guestEmail,
                    participantPhone: guestPhone,
                    legalConsent: guestConsent,
                    termsConsent: guestTermsConsent,
                    imageConsent: guestImageConsent,
                  }),
            },
          });
          setRegistrationState(
            result.registration.status === "LISTE_ATTENTE"
              ? "LISTE_ATTENTE"
              : result.ticket?.status === "en_attente_paiement"
                ? "PAIEMENT_EN_ATTENTE"
                : "CONFIRMEE",
          );
          setRegistrationTicketCode(result.ticket?.code ?? null);
          return;
        } catch {
          setError("L'inscription n'a pas pu être enregistrée côté serveur.");
          return;
        }
      }
      if (!account) return;
      addTicket({
        eventId: event.id,
        eventTitle: event.title,
        date: event.date,
        place: event.place,
        tier: selectedTier.label,
        priceCents: selectedTier.priceCents,
        code: generateRandom2026Code("TK"),
        status: "valide",
      });

      // Increment jauge in dynamic store
      const allEvents = getDynamicEvents();
      const updatedEvents = allEvents.map((e) => {
        if (e.id === event.id) {
          const nextRegistered = e.registered + 1;
          const nextStatus = nextRegistered >= e.capacity ? "COMPLET" : e.status;
          return { ...e, registered: nextRegistered, status: nextStatus };
        }
        return e;
      });
      saveDynamicEvents(updatedEvents);

      setRegistrationState("CONFIRMEE");
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    }
  }

  if (!connected) {
    return (
      <form
        className="space-y-3 border-2 border-ae2v-black bg-ae2v-offwhite p-4 text-ae2v-black"
        onSubmit={(event) => {
          event.preventDefault();
          void handleRegister();
        }}
      >
        <p className="text-xs font-bold uppercase tracking-wider">Inscription publique</p>
        {selectableTiers.length > 1 && (
          <label className="block text-xs font-bold uppercase">
            Tarif choisi
            <select
              className="mt-1 min-h-11 w-full border-2 border-ae2v-black bg-card px-3 text-sm font-normal"
              value={selectedTier?.id ?? ""}
              onChange={(event) => setSelectedTierId(event.target.value)}
            >
              {selectableTiers.map((tier) => (
                <option key={tier.id} value={tier.id}>
                  {tier.label} · {tier.priceCents === 0 ? "Gratuit" : formatCents(tier.priceCents)}
                </option>
              ))}
            </select>
          </label>
        )}
        {selectedTier?.note && (
          <p className="mt-2 border-2 border-ae2v-red bg-ae2v-red/10 p-2 text-xs font-normal normal-case">
            {selectedTier.note}
          </p>
        )}
        <input
          className="min-h-11 w-full border-2 border-ae2v-black bg-card px-3"
          placeholder="Prénom et nom *"
          value={guestName}
          onChange={(event) => setGuestName(event.target.value)}
          required
        />
        <input
          className="min-h-11 w-full border-2 border-ae2v-black bg-card px-3"
          type="email"
          placeholder="E-mail *"
          value={guestEmail}
          onChange={(event) => setGuestEmail(event.target.value)}
          required
        />
        <input
          className="min-h-11 w-full border-2 border-ae2v-black bg-card px-3"
          type="tel"
          placeholder="Téléphone (facultatif)"
          value={guestPhone}
          onChange={(event) => setGuestPhone(event.target.value)}
        />
        <label className="flex gap-2 text-xs">
          <input
            type="checkbox"
            checked={guestConsent}
            onChange={(event) => setGuestConsent(event.target.checked)}
            required
          />{" "}
          J'accepte le traitement de mes données pour cette inscription.
        </label>
        <label className="flex gap-2 text-xs">
          <input
            type="checkbox"
            checked={guestTermsConsent}
            onChange={(event) => setGuestTermsConsent(event.target.checked)}
            required
          />{" "}
          J'accepte les conditions de l'événement et son règlement.
        </label>
        <label className="flex gap-2 text-xs">
          <input
            type="checkbox"
            checked={guestImageConsent}
            onChange={(event) => setGuestImageConsent(event.target.checked)}
          />{" "}
          J'autorise l'utilisation de mon image pendant l'événement (facultatif).
        </label>
        <Button className="w-full" size="lg" type="submit">
          Valider l'inscription
        </Button>
        {error && <p className="text-xs font-bold text-ae2v-red">{error}</p>}
      </form>
    );
  }

  return (
    <>
      {selectableTiers.length > 1 && (
        <label className="mb-3 block text-xs font-bold uppercase">
          Tarif choisi
          <select
            className="mt-1 min-h-11 w-full border-2 border-ae2v-black bg-card px-3 text-sm font-normal"
            value={selectedTier?.id ?? ""}
            onChange={(event) => setSelectedTierId(event.target.value)}
          >
            {selectableTiers.map((tier) => (
              <option key={tier.id} value={tier.id}>
                {tier.label} · {tier.priceCents === 0 ? "Gratuit" : formatCents(tier.priceCents)}
              </option>
            ))}
          </select>
        </label>
      )}
      {selectedTier?.note && (
        <p className="mb-3 border-2 border-ae2v-red bg-ae2v-red/10 p-2 text-xs font-normal normal-case">
          {selectedTier.note}
        </p>
      )}
      <label className="mb-3 flex items-start gap-2 text-xs text-ae2v-black">
        <input
          className="mt-0.5 size-4 shrink-0"
          type="checkbox"
          checked={guestConsent}
          onChange={(event) => setGuestConsent(event.target.checked)}
          required
        />
        <span>J'accepte le traitement de mes données pour cette inscription.</span>
      </label>
      <label className="mb-3 flex items-start gap-2 text-xs text-ae2v-black">
        <input
          className="mt-0.5 size-4 shrink-0"
          type="checkbox"
          checked={guestTermsConsent}
          onChange={(event) => setGuestTermsConsent(event.target.checked)}
          required
        />
        <span>J'accepte les conditions de l'événement et son règlement.</span>
      </label>
      <label className="mb-3 flex items-start gap-2 text-xs text-ae2v-black">
        <input
          className="mt-0.5 size-4 shrink-0"
          type="checkbox"
          checked={guestImageConsent}
          onChange={(event) => setGuestImageConsent(event.target.checked)}
        />
        <span>J'autorise l'utilisation de mon image pendant l'événement (facultatif).</span>
      </label>
      <Button className="w-full" size="lg" onClick={handleRegister}>
        {event.status === "COMPLET" ? "Rejoindre la liste d’attente" : "S'inscrire à cet événement"}
      </Button>
      {error && <p className="mt-2 text-xs font-bold text-ae2v-red">{error}</p>}
      <p className="mt-2 text-xs text-muted-foreground">
        {audience !== "adherent"
          ? "Astuce : cotiser réduit ce tarif pour toute l'année."
          : "Ton billet apparaître dans « Mon espace » avec son QR code."}
      </p>
    </>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.65rem] font-bold tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 font-bold">{value}</dd>
    </div>
  );
}
