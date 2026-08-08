import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHero } from "@/components/layout/page-hero";
import { TeamGrid } from "@/components/bde/team-card";
import { Button } from "@/components/ui/button";
import { membersByPole, teamPoles, type TeamMember, type TeamPole } from "@/data/team";
import { getDynamicTeamMembers } from "@/lib/dynamic-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/bde/equipe")({
  /** `?pole=` permet d'arriver depuis la page Pôles avec le filtre déjà appliqué. */
  validateSearch: (search: Record<string, unknown>): { pole?: string } => {
    const pole = typeof search["pole"] === "string" ? (search["pole"] as string) : undefined;
    return pole && (teamPoles as string[]).includes(pole) ? { pole } : {};
  },
  head: () => ({
    meta: [
      { title: "L'équipe — AE2V" },
      {
        name: "description",
        content:
          "Les membres du bureau de l'AE2V : poste, pôle et contact professionnel @ae2v.fr sur leur carte de visite.",
      },
      { property: "og:title", content: "L'équipe — AE2V" },
      { property: "og:description", content: "Les membres du bureau de l'AE2V et leurs pôles." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/bde/equipe" },
    ],
    links: [{ rel: "canonical", href: "/bde/equipe" }],
  }),
  component: EquipePage,
});

function EquipePage() {
  const search = Route.useSearch() as { pole?: string };
  const navigate = Route.useNavigate();
  const [allMembers, setAllMembers] = useState<TeamMember[]>(getDynamicTeamMembers());

  useEffect(() => {
    const handleChanged = () => setAllMembers(getDynamicTeamMembers());
    window.addEventListener("ae2v_team_changed", handleChanged);
    return () => window.removeEventListener("ae2v_team_changed", handleChanged);
  }, []);

  const filter: TeamPole | "Tous" = (search.pole as TeamPole | undefined) ?? "Tous";
  const setFilter = (pole: TeamPole | "Tous") => {
    void navigate({ search: pole === "Tous" ? {} : { pole }, replace: true });
  };
  const members = filter === "Tous" ? allMembers : allMembers.filter((m) => m.pole === filter);

  const groups = membersByPole(members);
  const officers = members.filter((m) => m.isOfficer);

  return (
    <>
      <PageHero
        eyebrow="Le bureau"
        title="L'équipe"
        intro="Sélectionne une carte : elle se transforme en carte de visite AE2V avec le poste, le pôle et les adresses professionnelles du membre."
      />

      <section className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6 md:py-16">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrer par pôle">
          {(["Tous", ...teamPoles] as const).map((pole) => {
            const active = filter === pole;
            return (
              <button
                key={pole}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(pole)}
                className={cn(
                  "tap-44 border-2 border-ae2v-black px-4 text-xs font-bold tracking-[0.12em] uppercase transition-colors",
                  active
                    ? "bg-ae2v-red text-ae2v-offwhite"
                    : "bg-card text-ae2v-black hover:bg-ae2v-black hover:text-ae2v-offwhite",
                )}
              >
                {pole}
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-sm text-muted-foreground" role="status">
          {members.length} membre{members.length > 1 ? "s" : ""} affiché
          {members.length > 1 ? "s" : ""} — dont {officers.length} rôle
          {officers.length > 1 ? "s" : ""} essentiel{officers.length > 1 ? "s" : ""}.
        </p>

        <div className="mt-10 space-y-14">
          {groups.map(({ pole, members: poleMembers }) => (
            <div key={pole}>
              <div className="mb-6 flex items-baseline gap-4 border-b-2 border-ae2v-black pb-2">
                <h2 className="font-impact text-2xl tracking-tight uppercase md:text-3xl">
                  {pole}
                </h2>
                <span className="text-xs font-bold tracking-[0.14em] uppercase text-muted-foreground">
                  {poleMembers.length} membre{poleMembers.length > 1 ? "s" : ""}
                </span>
              </div>
              <TeamGrid members={poleMembers} />
            </div>
          ))}
        </div>


        <div className="mt-12 border-2 border-ae2v-black bg-ae2v-black p-6 text-ae2v-offwhite">
          <h2 className="font-impact text-2xl">Envie d'en faire partie ?</h2>
          <p className="mt-2 max-w-xl text-sm text-ae2v-offwhite/75">
            Les postes se renouvellent chaque année scolaire. Tu peux rejoindre un pôle en cours
            d'année.
          </p>
          <Button asChild size="lg" className="mt-5">
            <Link to="/espace">Rejoindre le bureau</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
