import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowUpRight,
  Shield,
  Zap,
  Users,
  Target,
  Sparkles,
  Award,
  HeartHandshake,
  ChevronRight,
  BookOpen,
} from "lucide-react";

import { PageHero } from "@/components/layout/page-hero";
import { Reveal } from "@/components/brand/reveal";
import { SectionNumber, TapeLabel } from "@/components/brand";
import { HardCard, Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { getPublicEventsServer } from "@/lib/server-functions/events";
import { getPublicTeamMembersServer } from "@/lib/server-functions/team";
import { getDynamicEvents, getDynamicTeamMembers } from "@/lib/dynamic-store";

export const Route = createFileRoute("/bde/")({
  head: () => ({
    meta: [
      { title: "Le BDE — AE2V Vélizy" },
      {
        name: "description",
        content:
          "Découvrez le BDE AE2V : son rôle, ses actions et l'équipe du bureau étudiant de l'IUT de Vélizy.",
      },
      { property: "og:title", content: "Le BDE — AE2V Vélizy" },
      { property: "og:description", content: "Missions et équipe du bureau étudiant AE2V." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/bde" },
    ],
    links: [{ rel: "canonical", href: "/bde" }],
  }),
  component: BdeIndex,
});

const bdeNavCards = [
  {
    to: "/bde/association",
    label: "L'association & Gouvernance",
    badge: "Missions & Statuts",
    text: "Ce qu'est l'AE2V, notre rôle de représentation, notre fonctionnement transparent et notre charte associative.",
  },
  {
    to: "/bde/equipe",
    label: "L'Équipe du Bureau",
    badge: "Cartes de visite",
    text: "Rencontrez les membres du bureau 2026-2027 et accédez à leurs cartes de visite et adresses nominatives @ae2v.fr.",
  },
];

const pillars = [
  {
    icon: Zap,
    title: "Animation du Campus",
    desc: "Soirées d'intégration, afterworks, tournois e-sport, gala annuel et temps forts pour dynamiser la vie étudiante.",
  },
  {
    icon: Shield,
    title: "Représentation Étudiante",
    desc: "Porte-parole des étudiants auprès de la direction de l'IUT, du CROUS et des instances universitaires.",
  },
  {
    icon: HeartHandshake,
    title: "Avantages & Partenariats",
    desc: "Négociation de réductions exclusives chez les commerçants de Vélizy et tarifs préférentiels pour les cotisants.",
  },
  {
    icon: Target,
    title: "Transparence & Rigueur",
    desc: "Gestion comptable claire, billetterie sécurisée et décisions prises en Assemblée Générale.",
  },
];

function BdeIndex() {
  const [teamCount, setTeamCount] = useState<number | null>(null);
  const [eventCount, setEventCount] = useState<number | null>(null);
  const loadTeam = useServerFn(getPublicTeamMembersServer);
  const loadEvents = useServerFn(getPublicEventsServer);

  useEffect(() => {
    void Promise.all([loadTeam({ data: undefined }), loadEvents({ data: undefined })])
      .then(([members, events]) => {
        if (import.meta.env.DEV && members.length === 0 && events.length === 0) {
          setTeamCount(getDynamicTeamMembers().length);
          setEventCount(getDynamicEvents().length);
          return;
        }
        setTeamCount(members.length);
        setEventCount(events.length);
      })
      .catch(() => {
        if (import.meta.env.DEV) {
          setTeamCount(getDynamicTeamMembers().length);
          setEventCount(getDynamicEvents().length);
        } else {
          setTeamCount(0);
          setEventCount(0);
        }
      });
  }, [loadEvents, loadTeam]);

  return (
    <>
      <PageHero
        eyebrow="Association Étudiante IUT Vélizy"
        title="Le BDE AE2V"
        intro="AE2V fait vivre le campus de Vélizy : événements, entraide, partenariats, représentation et projets étudiants."
      />

      {/* KPI Bar */}
      <section className="border-b-2 border-ae2v-black bg-card py-8">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="border-2 border-ae2v-black bg-ae2v-offwhite p-5">
              <p className="font-impact text-3xl text-ae2v-black">
                {teamCount === null ? "…" : teamCount} Membres du bureau
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Équipe du bureau 2026-2027
              </p>
            </div>
            <div className="border-2 border-ae2v-black bg-ae2v-offwhite p-5">
              <p className="font-impact text-3xl text-ae2v-green">
                {eventCount === null ? "…" : eventCount} Événements
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Programmés cette année
              </p>
            </div>
            <div className="border-2 border-ae2v-black bg-ae2v-black p-5 text-white">
              <p className="font-impact text-3xl text-ae2v-green">100%</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-ae2v-offwhite/80">
                Géré par les étudiants
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: Navigation Principale */}
      <Section number={1} ghost="SECTIONS" title="Explorer le BDE">
        <ul className="grid gap-6 md:grid-cols-3">
          {bdeNavCards.map((card, index) => (
            <Reveal as="li" key={card.to} delay={index * 90}>
              <Link
                to={card.to}
                className="group flex h-full flex-col justify-between border-2 border-ae2v-black bg-card p-6 transition-transform motion-safe:hover:-translate-y-1 hover:bg-ae2v-black hover:text-ae2v-offwhite"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <SectionNumber value={index + 1} tone="red" />
                    <span className="border-2 border-ae2v-black bg-ae2v-green px-2 py-0.5 text-[0.65rem] font-bold uppercase text-ae2v-black group-hover:border-ae2v-green">
                      {card.badge}
                    </span>
                  </div>
                  <h2 className="mt-6 font-impact text-2xl uppercase leading-tight">
                    {card.label}
                  </h2>
                  <p className="mt-3 text-sm text-muted-foreground group-hover:text-ae2v-offwhite/80">
                    {card.text}
                  </p>
                </div>
                <div className="mt-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ae2v-red group-hover:text-ae2v-green">
                  <span>Découvrir</span>
                  <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
              </Link>
            </Reveal>
          ))}
        </ul>
      </Section>

      {/* Section 2: Nos Piliers d'Action */}
      <Section number={2} ghost="ENGAGEMENT" title="Nos 4 Piliers d'Action" tone="dark">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <Reveal key={p.title} delay={i * 80}>
                <div className="h-full border-2 border-ae2v-offwhite/20 bg-ae2v-black p-6 text-ae2v-offwhite">
                  <Icon className="size-8 text-ae2v-green mb-4" />
                  <h3 className="font-impact text-xl uppercase tracking-wide text-ae2v-offwhite">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-ae2v-offwhite/75">{p.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Section>

      {/* Section 3: Appel à Action / Participation */}
      <Section
        number={3}
        ghost="REJOINDRE"
        title="Participer à la vie du BDE"
        intro="L'AE2V est ouverte à tous les étudiants de l'IUT. Adhérer ou s'investir dans le bureau permet d'enrichir son expérience associative."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <HardCard eyebrow="Pour les étudiants" title="Devenir adhérent cotisant">
            Devenir adhérent à l'AE2V débloque les tarifs réduits sur toutes les soirées, les
            goodies de la boutique et les réductions chez nos commerçants partenaires.
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/adherer">Adhérer maintenant</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link to="/espace">Mon espace étudiant</Link>
              </Button>
            </div>
          </HardCard>

          <HardCard eyebrow="Pour les passionnés" title="S'investir dans le Bureau">
            Envie de concevoir les événements, de créer, d'aider à la gestion ou de représenter les
            étudiants ? Écris au bureau pour découvrir les possibilités d'implication.
            <div className="mt-6">
              <Button asChild variant="black" size="lg">
                <Link to="/contact">Écrire au bureau</Link>
              </Button>
            </div>
          </HardCard>
        </div>
      </Section>
    </>
  );
}
