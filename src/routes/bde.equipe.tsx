import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";

import { PageHero } from "@/components/layout/page-hero";
import { TeamGrid } from "@/components/bde/team-card";
import { teamMembers, teamPoles, membersByPole, type TeamPole } from "@/data/team";

export const Route = createFileRoute("/bde/equipe")({
  head: () => ({ meta: [{ title: "L'équipe AE2V" }, { name: "description", content: "Les membres du bureau AE2V." }] }),
  component: TeamPage,
});

function TeamPage() {
  const [query, setQuery] = useState("");
  const [pole, setPole] = useState<TeamPole | "Tous">("Tous");
  const filtered = teamMembers.filter((member) => (pole === "Tous" || member.poles.includes(pole)) && (!query.trim() || `${member.displayName} ${member.roleTitle} ${member.poles.join(" ")}`.toLowerCase().includes(query.toLowerCase())));
  const groups = membersByPole(filtered);
  return <><PageHero eyebrow="Le bureau AE2V" title="L'Équipe AE2V" intro="Découvre les membres du bureau et les personnes qui font vivre l'association." /><section className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20"><div className="grid gap-4 border-2 border-ae2v-black bg-card p-4 md:grid-cols-[minmax(0,20rem)_1fr]"><label className="text-xs font-bold uppercase">Rechercher<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom, rôle..." className="mt-2 min-h-11 w-full border-2 border-ae2v-black/30 bg-ae2v-offwhite px-3" /></label><div><span className="text-xs font-bold uppercase">Filtrer par pôle</span><div className="mt-2 flex flex-wrap gap-2"><button className="border-2 border-ae2v-black px-3 py-2 text-xs font-bold uppercase" onClick={() => setPole("Tous")}>Tous</button>{teamPoles.map((item) => <button key={item} className={`border-2 border-ae2v-black px-3 py-2 text-xs font-bold uppercase ${pole === item ? "bg-ae2v-red text-white" : ""}`} onClick={() => setPole(item)}>{item}</button>)}</div></div></div><div className="mt-10 space-y-12">{groups.map(({ pole: groupPole, members }) => <section key={groupPole}><h2 className="mb-5 border-b-2 border-ae2v-black pb-2 font-impact text-3xl uppercase">{groupPole}</h2><TeamGrid members={members} /></section>)}{groups.length === 0 && <p className="border-2 border-dashed border-ae2v-black/30 p-8">Aucun membre ne correspond à la recherche.</p>}</div></section></>;
}
