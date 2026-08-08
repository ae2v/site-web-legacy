import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

import { PageHero } from "@/components/layout/page-hero";
import { Reveal } from "@/components/brand/reveal";
import { SectionNumber } from "@/components/brand";

export const Route = createFileRoute("/bde/")({
  head: () => ({
    meta: [
      { title: "Le BDE — AE2V" },
      {
        name: "description",
        content: "L'association AE2V : missions, pôles et équipe du bureau étudiant de Vélizy.",
      },
      { property: "og:title", content: "Le BDE — AE2V" },
      { property: "og:description", content: "Missions, pôles et équipe du bureau étudiant AE2V." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/bde" },
    ],
    links: [{ rel: "canonical", href: "/bde" }],
  }),
  component: BdeIndex,
});

const cards = [
  {
    to: "/bde/association",
    label: "L'association",
    text: "Ce qu'est l'AE2V, ses missions et son fonctionnement.",
  },
  { to: "/bde/poles", label: "Les pôles", text: "Événementiel, com', partenariats, trésorerie." },
  {
    to: "/bde/equipe",
    label: "L'équipe",
    text: "Les membres du bureau et leurs cartes de visite.",
  },
] as const;

function BdeIndex() {
  return (
    <>
      <PageHero
        eyebrow="L'association"
        title="Le BDE"
        intro="AE2V fait vivre le campus de Vélizy : événements, entraide, partenariats et représentation étudiante."
      />

      <section className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-20">
        <ul className="grid gap-4 sm:grid-cols-2">
          {cards.map((card, index) => (
            <Reveal as="li" key={card.to} delay={index * 80}>
              <Link
                to={card.to}
                className="group flex h-full flex-col justify-between border-2 border-ae2v-black bg-card p-6 transition-[transform,background-color,color] hover:-translate-y-1 hover:bg-ae2v-black hover:text-ae2v-offwhite"
              >
                <SectionNumber value={index + 1} tone="red" />
                <div className="mt-4">
                  <span className="font-impact text-2xl">{card.label}</span>
                  <p className="mt-2 text-sm text-muted-foreground group-hover:text-ae2v-offwhite/75">
                    {card.text}
                  </p>
                </div>
                <ArrowUpRight
                  aria-hidden="true"
                  className="mt-6 size-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                />
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>
    </>
  );
}
