import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

import { PageHero } from "@/components/layout/page-hero";
import { Reveal } from "@/components/brand/reveal";
import { SectionNumber } from "@/components/brand";
import { poles } from "@/data/poles";
import { membersByPole, teamMembers, type TeamPole } from "@/data/team";

export const Route = createFileRoute("/bde/poles")({
  head: () => ({
    meta: [
      { title: "Les pôles — AE2V" },
      {
        name: "description",
        content:
          "Événementiel, communication, partenariats, trésorerie : comment l'AE2V s'organise en pôles.",
      },
      { property: "og:title", content: "Les pôles — AE2V" },
      { property: "og:description", content: "L'organisation en pôles de l'AE2V." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/bde/poles" },
    ],
    links: [{ rel: "canonical", href: "/bde/poles" }],
  }),
  component: PolesPage,
});

function PolesPage() {
  const counts = new Map(membersByPole(teamMembers).map((g) => [g.pole, g.members.length]));

  return (
    <>
      <PageHero
        eyebrow="Organisation"
        title="Les pôles"
        intro="Chaque pôle porte une partie de la vie de l'association. Sélectionne un pôle pour voir les membres qui le composent."
      />

      <section className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-20">
        <ul className="grid gap-4 md:grid-cols-2">
          {poles.map((pole, index) => {
            const count = counts.get(pole.name as TeamPole) ?? 0;
            return (
              <Reveal as="li" key={pole.slug} delay={index * 70}>
                <div className="group relative h-full overflow-hidden border-2 border-ae2v-black bg-card p-6 transition-transform motion-safe:hover:-translate-y-1">
                  <span
                    aria-hidden="true"
                    className="ae2v-stripes absolute inset-y-0 left-0 w-1.5 text-ae2v-red transition-colors group-hover:text-ae2v-green"
                  />
                  <SectionNumber value={index + 1} tone="red" />
                  <h2 className="mt-3 font-impact text-2xl">
                    <Link
                      to="/bde/equipe"
                      search={{ pole: pole.name }}
                      data-cursor="interactive"
                      data-cursor-label="Voir l'équipe du pôle"
                      className="ae2v-focus after:absolute after:inset-0 after:content-['']"
                    >
                      {pole.name}
                      <span className="sr-only"> — voir les membres de ce pôle</span>
                    </Link>
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">{pole.mission}</p>
                  <p className="mt-4 flex items-center gap-2 text-xs font-bold tracking-[0.14em] uppercase">
                    {count} membre{count > 1 ? "s" : ""}
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                    />
                  </p>
                </div>
              </Reveal>
            );
          })}
        </ul>
      </section>
    </>
  );
}
