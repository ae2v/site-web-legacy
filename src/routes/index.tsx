import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, CalendarDays, Instagram, Mail, ShoppingBag, Ticket } from "lucide-react";

import {
  CrossMarker,
  CrystalCluster,
  DiagonalStripe,
  DotCloud,
  EditorialUnderline,
  FrameCorners,
  GrainOverlay,
  ImpactTitle,
  SectionHeading,
  SectionNumber,
  TapeLabel,
} from "@/components/brand";
import { BrandMarquee } from "@/components/brand/marquee";
import { Reveal } from "@/components/brand/reveal";
import { Logo } from "@/components/brand/Logo";
import { EventCard } from "@/components/evenements/event-card";
import { Button } from "@/components/ui/button";
import { demoEvents } from "@/data/events";
import { initials, teamMembers, type TeamMember } from "@/data/team";
import { hasDiscount, isMember, useDemoSession } from "@/lib/demo-session";
import type { Audience } from "@/lib/event-pricing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AE2V — Le BDE de l'IUT de Vélizy" },
      {
        name: "description",
        content:
          "Événements, adhésion, boutique et avantages étudiants à Vélizy. AE2V : toujours plus loin, ensemble.",
      },
      { property: "og:title", content: "AE2V — Le BDE de l'IUT de Vélizy" },
      {
        property: "og:description",
        content: "Événements, adhésion, boutique et avantages étudiants à Vélizy.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

const doors = [
  {
    to: "/evenements",
    label: "Vivre les événements",
    text: "Soirées, gala, afterworks, sorties : toute la programmation AE2V.",
    icon: Ticket,
  },
  {
    to: "/adherer",
    label: "Devenir adhérent",
    text: "Une adhésion par année scolaire, tous les avantages débloqués.",
    icon: CalendarDays,
  },
  {
    to: "/boutique",
    label: "Porter les couleurs",
    text: "Textile, goodies et packs étudiants aux couleurs de l'AE2V.",
    icon: ShoppingBag,
  },
] as const;

/** Podium desktop : vice-présidence (gauche) · présidence (centre, surélevée) · secrétariat (droite). */
const podiumIds = ["vice-presidence", "presidence", "secretariat"] as const;
const podium = podiumIds
  .map((id) => teamMembers.find((m) => m.id === id))
  .filter((m): m is TeamMember => Boolean(m));
const podiumOffsets = ["sm:translate-y-2", "sm:-translate-y-6", "sm:translate-y-6"];

function Index() {
  const { account } = useDemoSession();
  const audience: Audience = hasDiscount(account)
    ? "adherent"
    : isMember(account)
      ? "membre"
      : "public";
  const nextEvents = demoEvents.filter((e) => e.status !== "TERMINE").slice(0, 3);

  return (
    <>
      {/* 02 — HERO */}
      <section className="relative overflow-hidden bg-ae2v-red text-ae2v-offwhite">
        <GrainOverlay opacity={0.08} />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.18] [background:radial-gradient(120%_90%_at_82%_10%,var(--ae2v-black)_0%,transparent_60%)]"
        />
        <CrystalCluster
          tone="black"
          variant={1}
          className="absolute -right-16 -bottom-24 h-80 w-80 opacity-25 motion-safe:ae2v-float"
        />
        <CrystalCluster
          tone="green"
          variant={3}
          className="absolute top-10 right-1/3 hidden h-20 w-20 opacity-30 motion-safe:ae2v-float lg:block"
        />
        <DotCloud className="absolute top-8 left-6 text-ae2v-offwhite/30" columns={9} rows={5} />
        <CrossMarker className="absolute right-10 top-10 text-ae2v-offwhite/50" size={22} />

        <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 md:grid-cols-[1.3fr_0.7fr] md:items-center md:px-6 md:py-24">
          <div>
            <Reveal as="div" delay={0}>
              <TapeLabel tone="green">Association étudiante · IUT de Vélizy</TapeLabel>
            </Reveal>

            <ImpactTitle as="h1" size="mega" className="mt-6">
              <Reveal as="span" className="block" delay={60}>
                Toujours
              </Reveal>
              <Reveal as="span" className="block text-ae2v-black/80" delay={140}>
                plus loin,
              </Reveal>
              <Reveal as="span" className="block" delay={220}>
                <EditorialUnderline tone="black">ensemble.</EditorialUnderline>
              </Reveal>
            </ImpactTitle>


            <Reveal delay={320}>
              <p className="mt-6 max-w-xl text-base md:text-lg">
                L'AE2V fait vivre le campus : événements, adhésion annuelle, boutique et avantages
                étudiants, le tout au même endroit.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="transition-transform hover:-translate-y-0.5">
                  <Link to="/adherer">Devenir adhérent</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="black"
                  className="transition-transform hover:-translate-y-0.5"
                >
                  <Link to="/evenements">Voir les événements</Link>
                </Button>
              </div>
            </Reveal>
          </div>

          <Reveal variant="pop" delay={200} className="hidden justify-center md:flex">
            <div className="relative p-6">
              <FrameCorners className="text-ae2v-offwhite/70" size={28} />
              <Logo
                variant="emblem"
                tone="white"
                alt=""
                priority
                className="h-60 w-auto motion-safe:ae2v-float"
              />
            </div>
          </Reveal>
        </div>

        <DiagonalStripe height={10} className="text-ae2v-black" />
      </section>

      <BrandMarquee
        tone="green"
        items={["Événements", "Adhésion", "Boutique", "Vie de campus", "AE2V"]}
      />

      {/* 03 — PROCHAINS ÉVÉNEMENTS */}
      <section className="relative overflow-hidden bg-ae2v-black text-ae2v-offwhite">
        <DotCloud className="absolute bottom-6 right-8 text-ae2v-red/40" columns={9} rows={5} />
        <div className="relative mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-16">
          <Reveal className="flex items-start gap-4">
            <SectionNumber value={1} tone="red" />
            <SectionHeading as="h2" size="md" tone="offwhite" ghost="AGENDA">
              Prochains événements
            </SectionHeading>
          </Reveal>

          {nextEvents.length > 0 ? (
            <>
              <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {nextEvents.slice(0, 3).map((event, index) => (
                  <Reveal as="li" key={event.id} delay={index * 90} className="h-full">
                    <EventCard
                      event={event}
                      audience={audience}
                      connected={Boolean(account)}
                      index={index}
                      compact
                    />
                  </Reveal>
                ))}
              </ul>
              <Button asChild variant="black" className="mt-6 border-2 border-ae2v-offwhite/40">
                <Link to="/evenements">Voir plus d'événements</Link>
              </Button>
            </>
          ) : (
            <Reveal delay={80} className="mt-6 border-2 border-ae2v-offwhite/25 p-6 md:p-8">
              <p className="ae2v-headline text-[clamp(1.75rem,4.5vw,3rem)] text-ae2v-green">
                Programmation en préparation
              </p>
              <p className="mt-3 max-w-xl text-sm text-ae2v-offwhite/75">
                Aucune date n'est encore publiée. Reviens bientôt pour la billetterie.
              </p>
              <Button asChild variant="black" className="mt-6 border-2 border-ae2v-offwhite/40">
                <Link to="/evenements">Suivre la programmation</Link>
              </Button>
            </Reveal>
          )}
        </div>
      </section>


      {/* 04 — TROIS PORTES D'ENTRÉE */}
      <section className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-20">
        <Reveal className="flex items-start gap-4">
          <CrossMarker className="mt-3 shrink-0 text-ae2v-red" size={18} />
          <SectionHeading as="h2" size="md" ghost="START">
            Par où commencer
          </SectionHeading>
        </Reveal>


        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {doors.map((door, index) => (
            <Reveal as="li" key={door.to} delay={index * 90}>
              <Link
                to={door.to}
                className="group relative flex h-full flex-col justify-between overflow-hidden border-2 border-ae2v-black bg-card p-6 transition-[transform,background-color,color] duration-200 hover:-translate-y-1 hover:bg-ae2v-red hover:text-ae2v-offwhite"
              >
                <span
                  aria-hidden="true"
                  className="ae2v-stripes absolute inset-x-0 top-0 h-1.5 text-ae2v-red transition-colors group-hover:text-ae2v-green"
                />
                <door.icon aria-hidden="true" className="size-7" />
                <div className="mt-8">
                  <span className="ae2v-headline text-[clamp(1.5rem,3vw,2.25rem)]">{door.label}</span>
                  <p className="mt-2 text-sm text-muted-foreground transition-colors group-hover:text-ae2v-offwhite/80">
                    {door.text}
                  </p>
                </div>
                <ArrowUpRight
                  aria-hidden="true"
                  className="mt-6 size-5 transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1"
                />
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* 05 — ADHÉSION */}
      <section className="relative overflow-hidden bg-ae2v-red text-ae2v-offwhite">
        <GrainOverlay opacity={0.07} />
        <CrystalCluster
          tone="black"
          variant={2}
          className="absolute -left-10 -top-10 h-52 w-52 opacity-20"
        />
        <div className="relative mx-auto grid w-full max-w-7xl gap-8 px-4 py-14 md:grid-cols-2 md:items-center md:px-6 md:py-20">
          <Reveal variant="slide">
            <SectionNumber value={2} tone="black" />
            <ImpactTitle as="h2" size="lg" className="mt-3">
              <EditorialUnderline tone="green">L'adhésion</EditorialUnderline> AE2V
            </ImpactTitle>
            <p className="mt-5 max-w-lg">
              Une adhésion par année scolaire : tarifs événements, avantages partenaires, boutique
              et carte étudiante AE2V dans ton espace.
            </p>
            <Button asChild size="lg" className="mt-7">
              <Link to="/adherer">Voir l'adhésion</Link>
            </Button>
          </Reveal>

          <Reveal delay={120} className="relative border-2 border-ae2v-black bg-ae2v-black/35 p-6">
            <FrameCorners className="text-ae2v-green" size={22} />
            <ul className="flex flex-col gap-3 text-sm">
              {[
                "Tarifs réduits sur les événements AE2V",
                "Accès aux avantages partenaires locaux",
                "Carte d'adhérent numérique dans /espace",
                "Priorité sur les places limitées",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CrossMarker className="mt-0.5 shrink-0 text-ae2v-green" size={16} />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
        <DiagonalStripe height={8} className="text-ae2v-black" />
      </section>

      {/* 06 — LE BDE */}
      <section className="relative overflow-hidden bg-ae2v-black text-ae2v-offwhite">
        <DiagonalStripe height={8} className="text-ae2v-red" />
        <GrainOverlay opacity={0.06} />
        <DotCloud className="absolute top-16 right-10 text-ae2v-green/30" columns={8} rows={4} />

        <div className="relative mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-20">
          <Reveal className="flex items-start gap-4">
            <SectionNumber value={3} tone="green" />
            <SectionHeading as="h2" size="md" tone="offwhite" ghost="BDE">
              Le BDE
            </SectionHeading>
          </Reveal>

          <div className="mt-8 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <Reveal variant="slide">
              <p className="max-w-xl text-ae2v-offwhite/85">
                L'AE2V est l'association étudiante de l'IUT de Vélizy : elle anime la vie de campus,
                organise les événements, négocie les avantages étudiants et représente les étudiants
                auprès de l'établissement. Le bureau est élu chaque année et travaille en pôles.
              </p>

              <ul className="mt-6 flex flex-col gap-3 text-sm">
                {[
                  "Animer le campus : soirées, gala, afterworks, tournois",
                  "Représenter les étudiants et porter leurs demandes",
                  "Négocier des avantages et partenariats locaux",
                  "Gérer les adhésions, le budget et la transparence",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CrossMarker className="mt-0.5 shrink-0 text-ae2v-green" size={16} />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/bde">Découvrir le BDE</Link>
                </Button>
                <Button asChild size="lg" variant="black" className="border-2 border-ae2v-offwhite/40">
                  <Link to="/bde/association">L'association</Link>
                </Button>
                <Button asChild size="lg" variant="black" className="border-2 border-ae2v-offwhite/40">
                  <Link to="/bde/poles">Les pôles</Link>
                </Button>
                <Button asChild size="lg" variant="black" className="border-2 border-ae2v-offwhite/40">
                  <Link to="/bde/equipe">L'équipe</Link>
                </Button>
              </div>
            </Reveal>

            <Reveal variant="pop" delay={120}>
              <ul className="grid gap-4 sm:grid-cols-3 sm:items-end">
                {podium.map((member, index) => (
                  <li key={member.id} className={podiumOffsets[index]}>
                    <Link
                      to="/bde/equipe"
                      className="group flex h-full flex-col border-2 border-ae2v-offwhite/25 bg-ae2v-offwhite/5 p-4 transition-[transform,background-color,border-color] hover:-translate-y-1 hover:border-ae2v-green hover:bg-ae2v-offwhite/10"
                    >
                      <span className="relative block aspect-square overflow-hidden border-2 border-ae2v-offwhite/20">
                        {member.photoUrl ? (
                          <img
                            src={member.photoUrl}
                            alt={`Portrait de ${member.displayName}`}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center font-impact text-3xl text-ae2v-offwhite/60">
                            {initials(member.displayName)}
                          </span>
                        )}
                      </span>
                      <span className="mt-3 inline-block w-fit bg-ae2v-red px-2 py-0.5 text-[0.65rem] font-bold tracking-[0.12em] uppercase">
                        {member.roleTitle}
                      </span>
                      <span className="ae2v-headline mt-2 text-xl leading-tight">
                        {member.displayName}
                      </span>
                      <span className="mt-1 text-xs text-ae2v-offwhite/70">{member.pole}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-xs text-ae2v-offwhite/60 sm:mt-12">
                Bureau {podium[0]?.mandate ?? ""} · fiches complètes sur la page équipe.
              </p>
            </Reveal>
          </div>
        </div>
      </section>


      {/* 10 — RÉSEAUX / CONTACT */}
      <section className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-20">
        <Reveal className="grid gap-4 md:grid-cols-2">
          <a
            href="https://www.instagram.com/ae2v_officiel/"
            target="_blank"
            rel="noreferrer"
            className="tap-44 group flex items-center justify-between border-2 border-ae2v-black bg-card p-6 transition-colors hover:bg-ae2v-red hover:text-ae2v-offwhite"
          >
            <span className="flex items-center gap-3 font-impact text-2xl">
              <Instagram aria-hidden="true" className="size-6" />
              Instagram
            </span>
            <ArrowUpRight
              aria-hidden="true"
              className="size-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
            />
          </a>
          <Link
            to="/contact"
            className="tap-44 group flex items-center justify-between border-2 border-ae2v-black bg-ae2v-black p-6 text-ae2v-offwhite transition-colors hover:bg-ae2v-green hover:text-ae2v-black"
          >
            <span className="flex items-center gap-3 font-impact text-2xl">
              <Mail aria-hidden="true" className="size-6" />
              Nous contacter
            </span>
            <ArrowUpRight
              aria-hidden="true"
              className="size-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
            />
          </Link>
        </Reveal>
      </section>
    </>
  );
}
