import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Mail, Search, Users, Shield, ArrowUpRight } from "lucide-react";

import { PageHero } from "@/components/layout/page-hero";
import { TeamGrid } from "@/components/bde/team-card";
import { Button } from "@/components/ui/button";
import {
  displayedTeamTitles,
  membersByPole,
  teamPoles,
  type TeamMember,
  type TeamPole,
} from "@/data/team";
import { getDynamicTeamMembers } from "@/lib/dynamic-store";
import { EmailComposerModal } from "@/components/bureau/email-composer-modal";
import { cn } from "@/lib/utils";
import { getPublicTeamMembersServer } from "@/lib/server-functions/team";

export const Route = createFileRoute("/bde/equipe")({
  validateSearch: (search: Record<string, unknown>): { pole?: string } => {
    const pole = typeof search["pole"] === "string" ? (search["pole"] as string) : undefined;
    return pole && (teamPoles as string[]).includes(pole) ? { pole } : {};
  },
  head: () => ({
    meta: [
      { title: "L'Équipe du Bureau — AE2V Vélizy" },
      {
        name: "description",
        content:
          "Les membres du bureau de l'AE2V : fiches détaillées, rôle, pôle et cartes de visite avec adresses e-mail professionnelles @ae2v.fr.",
      },
      { property: "og:title", content: "L'Équipe du Bureau — AE2V" },
      {
        property: "og:description",
        content: "Les membres du bureau de l'AE2V et leurs cartes de visite.",
      },
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
  const [allMembers, setAllMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [query, setQuery] = useState("");
  const [contactEmail, setContactEmail] = useState<string | null>(null);
  const loadPublicTeam = useServerFn(getPublicTeamMembersServer);

  useEffect(() => {
    if (import.meta.env.DEV) setAllMembers(getDynamicTeamMembers());
    void loadPublicTeam({ data: undefined })
      .then((members) => {
        const mappedMembers = members.map((member) => ({
          id: member.id,
          displayName: member.displayName,
          roleTitle: member.roleTitle,
          roleTitles: member.roleTitles,
          officerRole: member.officerRole,
          poles: member.poles as TeamPole[],
          showDefaultPoleTitles: member.showDefaultPoleTitles,
          mandate: member.mandateYear,
          publicVisible: member.publicVisible,
          photoUrl: member.photoUrl,
          roleEmail: member.roleEmail,
          personalAe2vEmail: member.personalAe2vEmail,
          bio: member.bio,
          isOfficer: member.isOfficer,
          isDemo: false,
          isPlaceholder: !member.photoUrl,
        }));
        // En développement, une base locale partiellement initialisée ne doit
        // pas masquer le roster de démonstration complet. En production, seule
        // la source PostgreSQL est utilisée.
        const fallbackMembers = getDynamicTeamMembers();
        setAllMembers(
          mappedMembers.length === 0
            ? fallbackMembers
            : import.meta.env.DEV && mappedMembers.length < fallbackMembers.length
              ? fallbackMembers
              : mappedMembers,
        );
      })
      .catch(() => {
        setAllMembers(getDynamicTeamMembers());
      })
      .finally(() => setLoadingMembers(false));
    const handleChanged = () => {
      if (import.meta.env.DEV) setAllMembers(getDynamicTeamMembers());
    };
    window.addEventListener("ae2v_team_changed", handleChanged);
    return () => window.removeEventListener("ae2v_team_changed", handleChanged);
  }, [loadPublicTeam]);

  const filter: TeamPole | "Tous" = (search.pole as TeamPole | undefined) ?? "Tous";
  const setFilter = (pole: TeamPole | "Tous") => {
    void navigate({ search: pole === "Tous" ? {} : { pole }, replace: true });
  };

  const safeMembers = allMembers ?? [];
  const filtered = safeMembers
    .filter((m) => filter === "Tous" || m.poles.includes(filter))
    .filter(
      (m) =>
        !query.trim() ||
        m.displayName.toLowerCase().includes(query.trim().toLowerCase()) ||
        displayedTeamTitles(m).some((title) =>
          title.toLowerCase().includes(query.trim().toLowerCase()),
        ) ||
        m.poles.some((pole) => pole.toLowerCase().includes(query.trim().toLowerCase())),
    );

  const groups = membersByPole(filtered);
  const membersWithoutPole = filtered.filter((member) => member.poles.length === 0);
  const officers = filtered.filter((m) => m.isOfficer);

  return (
    <>
      <PageHero
        eyebrow="Trombinoscope 2026-2027"
        title="L'Équipe AE2V"
        intro="Cliquez sur n'importe quelle carte pour révéler la carte de visite professionnelle avec poste officiel et e-mail nominatif @ae2v.fr."
      />

      <section className="relative overflow-hidden scroll-mt-24 bg-background text-foreground">
        <div className="relative mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-20">
          {/* Barre de Recherche et Filtres */}
          <div className="grid gap-4 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:items-end mb-8 border-2 border-ae2v-black bg-card p-4">
            <div>
              <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
                Rechercher un membre du bureau
              </label>
              <div className="relative mt-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nom, poste, pôle..."
                  className="min-h-[40px] w-full border-2 border-ae2v-black/25 bg-ae2v-offwhite pl-9 pr-3 py-1 text-sm outline-none focus-visible:border-ae2v-red"
                />
              </div>
            </div>

            <div>
              <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Filtrer par Pôle
              </label>
              <div className="flex flex-wrap gap-2">
                {(["Tous", ...teamPoles] as const).map((pole) => {
                  const active = filter === pole;
                  return (
                    <button
                      key={pole}
                      type="button"
                      onClick={() => setFilter(pole)}
                      className={cn(
                        "px-3 py-1.5 border-2 border-ae2v-black text-xs font-bold uppercase tracking-wider transition-colors",
                        active
                          ? "bg-ae2v-red text-white border-ae2v-red"
                          : "bg-ae2v-offwhite text-ae2v-black hover:bg-ae2v-black hover:text-white",
                      )}
                    >
                      {pole}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Compteur d'affichage */}
          <p
            className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-6"
            role="status"
          >
            {loadingMembers && safeMembers.length === 0
              ? "Chargement des membres du bureau…"
              : `${filtered.length} membre${filtered.length > 1 ? "s" : ""} du bureau affiché${filtered.length > 1 ? "s" : ""} — dont ${officers.length} rôle${officers.length > 1 ? "s" : ""} exécutif${officers.length > 1 ? "s" : ""}.`}
          </p>

          {/* Grille par Pôle */}
          {loadingMembers && safeMembers.length === 0 ? (
            <div
              className="border-2 border-ae2v-black bg-ae2v-offwhite p-8 text-center text-sm font-bold uppercase"
              role="status"
              aria-live="polite"
            >
              Chargement des cartes…
            </div>
          ) : groups.length === 0 ? (
            <div className="border-2 border-dashed border-ae2v-black/40 p-8 text-center text-sm text-muted-foreground">
              Aucun membre du bureau ne correspond à votre recherche.
            </div>
          ) : (
            <div className="space-y-14">
              {officers.length > 0 && (
                <div className="border-2 border-ae2v-black bg-ae2v-black p-5 text-ae2v-offwhite">
                  <div className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-ae2v-offwhite/25 pb-3">
                    <h2 className="font-impact text-2xl uppercase text-ae2v-green md:text-3xl">
                      Dirigeants
                    </h2>
                    <span className="text-xs font-bold tracking-[0.14em] uppercase opacity-75">
                      Fonctions officielles du bureau
                    </span>
                  </div>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {officers.map((member) => (
                      <li key={member.id} className="border-2 border-ae2v-offwhite/25 p-3">
                        <p className="font-bold">{member.displayName}</p>
                        <p className="mt-1 text-sm text-ae2v-green">
                          {member.officerRole ?? displayedTeamTitles(member).join(" · ")}
                        </p>
                        <p className="mt-1 text-[0.65rem] opacity-70">
                          {member.poles.length ? member.poles.join(" · ") : "Membre du bureau"}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {groups.map(({ pole, members: poleMembers }) => (
                <div key={pole}>
                  <div className="mb-6 flex items-baseline gap-4 border-b-2 border-ae2v-black pb-2">
                    <h2 className="font-impact text-2xl tracking-tight uppercase md:text-3xl">
                      Pôle {pole}
                    </h2>
                    <span className="text-xs font-bold tracking-[0.14em] uppercase text-muted-foreground">
                      {poleMembers.length} membre{poleMembers.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <TeamGrid members={poleMembers} />
                </div>
              ))}
              {membersWithoutPole.length > 0 && (
                <div>
                  <div className="mb-6 flex items-baseline gap-4 border-b-2 border-ae2v-black pb-2">
                    <h2 className="font-impact text-2xl tracking-tight uppercase md:text-3xl">
                      Membres du bureau
                    </h2>
                    <span className="text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">
                      {membersWithoutPole.length} membre
                      {membersWithoutPole.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <TeamGrid members={membersWithoutPole} />
                </div>
              )}
            </div>
          )}

          {/* Banner rejoindre le bureau */}
          <div className="mt-14 border-2 border-ae2v-black bg-ae2v-black p-6 text-ae2v-offwhite flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="font-impact text-2xl uppercase text-ae2v-green">
                Rejoindre l'équipe du bureau ?
              </h2>
              <p className="mt-1 max-w-xl text-xs text-ae2v-offwhite/80">
                Chaque année, l'AE2V forme une nouvelle équipe d'étudiants motivés. Déposez votre
                candidature pour le pôle de votre choix !
              </p>
            </div>
            <Button asChild size="lg" variant="default">
              <Link to="/espace">Proposer ma candidature</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Modal de Rédaction E-mail à un membre */}
      {contactEmail && (
        <EmailComposerModal
          isOpen={Boolean(contactEmail)}
          onClose={() => setContactEmail(null)}
          defaultRecipient={contactEmail}
          defaultSubject="[BDE AE2V] Question d'un étudiant"
        />
      )}
    </>
  );
}
