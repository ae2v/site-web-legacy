import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Zap,
  Users,
  MessageSquare,
  Handshake,
  DollarSign,
  Crown,
  CheckCircle2,
  Send,
} from "lucide-react";

import { PageHero } from "@/components/layout/page-hero";
import { Reveal } from "@/components/brand/reveal";
import { SectionNumber, TapeLabel } from "@/components/brand";
import { Section, HardCard } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { poles as polesData } from "@/data/poles";
import { getDynamicTeamMembers, type TeamMember } from "@/lib/dynamic-store";

export const Route = createFileRoute("/bde/poles")({
  head: () => ({
    meta: [
      { title: "Les Pôles d'Activité — AE2V Vélizy" },
      {
        name: "description",
        content:
          "Découvrez l'organisation en pôles du BDE AE2V : Événementiel, Communication, Partenariats, Trésorerie et Présidence.",
      },
      { property: "og:title", content: "Les Pôles d'Activité — AE2V" },
      { property: "og:description", content: "L'organisation en pôles de l'AE2V." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/bde/poles" },
    ],
    links: [{ rel: "canonical", href: "/bde/poles" }],
  }),
  component: PolesPage,
});

const POLE_ICONS: Record<string, typeof Zap> = {
  Direction: Crown,
  Événementiel: Zap,
  Communication: MessageSquare,
  Partenariats: Handshake,
  Trésorerie: DollarSign,
};

function PolesPage() {
  const [selectedPole, setSelectedPole] = useState<string>("Événementiel");
  const [team, setTeam] = useState<TeamMember[]>([]);

  useEffect(() => {
    setTeam(getDynamicTeamMembers());
  }, []);

  const activePoleData = polesData.find((p) => p.name === selectedPole) ?? polesData[0]!;
  const poleMembers = (team ?? []).filter((m) => m.pole === selectedPole);

  return (
    <>
      <PageHero
        eyebrow="Organisation Interne"
        title="Les 5 Pôles du BDE"
        intro="L'AE2V s'organise en 5 pôles spécialisés. Chaque pôle gère des missions précises et accueille des étudiants motivés pour contribuer aux projets du campus."
      />

      {/* Section 1: Navigation par Pôles (Tabs) */}
      <Section number={1} ghost="PÔLES" title="Explorer les Pôles d'Activité">
        <div className="flex flex-wrap gap-2 border-b-2 border-ae2v-black pb-4 mb-8">
          {polesData.map((pole) => {
            const Icon = POLE_ICONS[pole.name] ?? Users;
            const isSelected = selectedPole === pole.name;
            const count = (team ?? []).filter((m) => m.pole === pole.name).length;

            return (
              <button
                key={pole.slug}
                type="button"
                onClick={() => setSelectedPole(pole.name)}
                className={`flex items-center gap-2 border-2 border-ae2v-black px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                  isSelected
                    ? "bg-ae2v-red text-white border-ae2v-red"
                    : "bg-card text-ae2v-black hover:bg-ae2v-black hover:text-white"
                }`}
              >
                <Icon className="size-4" />
                <span>{pole.name}</span>
                <span
                  className={`px-1.5 py-0.5 text-[0.65rem] font-bold ${
                    isSelected ? "bg-white text-ae2v-red" : "bg-ae2v-black/10 text-ae2v-black"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Détail du pôle sélectionné */}
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="border-2 border-ae2v-black bg-card p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b-2 border-ae2v-black pb-4">
              <div>
                <TapeLabel tone="red">{activePoleData.name}</TapeLabel>
                <h2 className="font-impact text-3xl uppercase mt-2">{activePoleData.name}</h2>
              </div>
              <Button asChild size="sm" variant="black">
                <Link to="/bde/equipe" search={{ pole: activePoleData.name }}>
                  Voir l'équipe complète →
                </Link>
              </Button>
            </div>

            <div>
              <h3 className="font-impact text-lg uppercase text-ae2v-black">Mission Principale</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {activePoleData.mission}
              </p>
            </div>

            <div>
              <h3 className="font-impact text-lg uppercase text-ae2v-black mb-3">
                Missions & Responsabilités du Pôle
              </h3>
              <ul className="grid gap-3 sm:grid-cols-2">
                <li className="flex items-start gap-2 text-xs border-2 border-ae2v-black/10 bg-ae2v-offwhite p-3">
                  <CheckCircle2 className="size-4 text-ae2v-green shrink-0 mt-0.5" />
                  <span>Gestion des projets dédiés et suivi du calendrier associatif.</span>
                </li>
                <li className="flex items-start gap-2 text-xs border-2 border-ae2v-black/10 bg-ae2v-offwhite p-3">
                  <CheckCircle2 className="size-4 text-ae2v-green shrink-0 mt-0.5" />
                  <span>
                    Coordination avec les autres pôles pour assurer la cohérence des actions.
                  </span>
                </li>
                <li className="flex items-start gap-2 text-xs border-2 border-ae2v-black/10 bg-ae2v-offwhite p-3">
                  <CheckCircle2 className="size-4 text-ae2v-green shrink-0 mt-0.5" />
                  <span>Participation aux réunions hebdomadaires du bureau AE2V.</span>
                </li>
                <li className="flex items-start gap-2 text-xs border-2 border-ae2v-black/10 bg-ae2v-offwhite p-3">
                  <CheckCircle2 className="size-4 text-ae2v-green shrink-0 mt-0.5" />
                  <span>Relation directe avec les étudiants et partenaires du campus.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Sidebar des membres rattachés */}
          <div className="border-2 border-ae2v-black bg-ae2v-black p-6 text-white space-y-4">
            <h3 className="font-impact text-xl uppercase text-ae2v-green border-b border-white/20 pb-2">
              Membres du Pôle ({poleMembers.length})
            </h3>
            {poleMembers.length === 0 ? (
              <p className="text-xs text-ae2v-offwhite/70">
                Aucun membre rattaché directement à ce pôle. Le pôle accueille de nouveaux bénévoles
                !
              </p>
            ) : (
              <ul className="space-y-3">
                {poleMembers.map((m) => (
                  <li key={m.id} className="border border-white/20 bg-white/10 p-3 text-xs">
                    <p className="font-bold text-white">{m.displayName}</p>
                    <p className="text-ae2v-green font-bold text-[0.7rem] uppercase">
                      {m.roleTitle}
                    </p>
                    {m.personalAe2vEmail && (
                      <p className="text-[0.65rem] text-ae2v-offwhite/70 font-mono mt-1">
                        {m.personalAe2vEmail}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div className="pt-4 border-t border-white/20">
              <Button asChild className="w-full" size="sm" variant="default">
                <Link to="/espace">
                  <Send className="size-4" />
                  Rejoindre le pôle {activePoleData.name}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* Section 2: Tous les Pôles en Grille */}
      <Section number={2} ghost="VUE GLOBAL" title="Aperçu des 5 Pôles" tone="dark">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {polesData.map((pole, index) => {
            const Icon = POLE_ICONS[pole.name] ?? Users;
            const count = (team ?? []).filter((m) => m.pole === pole.name).length;

            return (
              <Reveal key={pole.slug} delay={index * 70}>
                <div className="h-full border-2 border-ae2v-offwhite/20 bg-ae2v-black p-6 text-ae2v-offwhite flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <Icon className="size-6 text-ae2v-green" />
                      <span className="border border-ae2v-green/40 px-2 py-0.5 text-[0.65rem] font-bold text-ae2v-green uppercase">
                        {count} membre{count > 1 ? "s" : ""}
                      </span>
                    </div>
                    <h3 className="font-impact text-xl uppercase text-white">{pole.name}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-ae2v-offwhite/75">
                      {pole.mission}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="black"
                    className="mt-6 w-full border-ae2v-offwhite/30"
                    onClick={() => setSelectedPole(pole.name)}
                  >
                    Sélectionner ce pôle
                  </Button>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Section>
    </>
  );
}
