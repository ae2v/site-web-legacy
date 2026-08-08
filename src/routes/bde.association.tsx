import { createFileRoute } from "@tanstack/react-router";

import { PageHero } from "@/components/layout/page-hero";
import { Reveal } from "@/components/brand/reveal";
import { CrossMarker } from "@/components/brand";

export const Route = createFileRoute("/bde/association")({
  head: () => ({
    meta: [
      { title: "L'association — AE2V" },
      {
        name: "description",
        content:
          "Missions, fonctionnement et engagements de l'AE2V, association étudiante de l'IUT de Vélizy.",
      },
      { property: "og:title", content: "L'association — AE2V" },
      { property: "og:description", content: "Missions et fonctionnement de l'AE2V." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/bde/association" },
    ],
    links: [{ rel: "canonical", href: "/bde/association" }],
  }),
  component: AssociationPage,
});

const missions = [
  {
    title: "Animer le campus",
    text: "Organiser des événements accessibles qui rassemblent les étudiants de l'IUT.",
  },
  {
    title: "Accompagner les étudiants",
    text: "Proposer des avantages concrets et relayer les infos utiles de la vie étudiante.",
  },
  {
    title: "Représenter",
    text: "Porter la voix des étudiants auprès de l'établissement et des partenaires.",
  },
  {
    title: "Gérer avec transparence",
    text: "Un budget suivi, des tarifs clairs et une trésorerie tenue par le pôle dédié.",
  },
];

function AssociationPage() {
  return (
    <>
      <PageHero
        eyebrow="Qui sommes-nous"
        title="L'association"
        intro="L'AE2V est une association étudiante gérée par des étudiants de l'IUT de Vélizy, élus pour un mandat d'une année scolaire."
      />

      <section className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-20">
        <h2 className="font-impact text-3xl md:text-4xl">Nos missions</h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {missions.map((mission, index) => (
            <Reveal as="li" key={mission.title} delay={index * 70}>
              <div className="h-full border-2 border-ae2v-black bg-card p-6">
                <CrossMarker className="text-ae2v-red" size={18} />
                <h3 className="mt-4 font-impact text-2xl">{mission.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{mission.text}</p>
              </div>
            </Reveal>
          ))}
        </ul>

        <div className="mt-10 border-2 border-ae2v-black bg-ae2v-black p-6 text-ae2v-offwhite">
          <h2 className="font-impact text-2xl">Informations légales</h2>
          <p className="mt-3 max-w-2xl text-sm text-ae2v-offwhite/75">
            Les mentions légales détaillées (statuts, numéro d'association, siège) seront publiées
            ici une fois validées par le bureau. Rien n'est affiché tant que l'information n'est pas
            confirmée.
          </p>
        </div>
      </section>
    </>
  );
}
