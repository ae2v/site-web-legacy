import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, MessageCircle } from "lucide-react";

import { PageHero } from "@/components/layout/page-hero";
import { Section, HardCard } from "@/components/layout/section";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/bde/")({
  head: () => ({ meta: [{ title: "Le BDE — AE2V" }, { name: "description", content: "Découvrir l'association étudiante AE2V." }] }),
  component: BdePage,
});

function BdePage() {
  return <><PageHero eyebrow="L'association étudiante" title="Le BDE AE2V" intro="Une équipe étudiante qui anime la vie de campus, crée des événements et rassemble les étudiants de Vélizy." /><Section number={1} ghost="MISSION" title="Faire vivre le campus"><div className="grid gap-5 md:grid-cols-3"><HardCard eyebrow="Événements" title="Des moments ensemble">Soirées, sorties, tournois et rencontres pour créer des souvenirs sur le campus.</HardCard><HardCard eyebrow="Collectif" title="Une association ouverte">Les projets se construisent avec les étudiants, au rythme de leurs idées et de leurs envies.</HardCard><HardCard eyebrow="Communauté" title="Un point de rencontre">Le Discord AE2V centralise les échanges, les annonces et les opportunités de participation.</HardCard></div></Section><section className="bg-ae2v-black px-4 py-16 text-ae2v-offwhite md:px-6"><div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 md:flex-row md:items-center"><div><MessageCircle className="size-8 text-ae2v-green" aria-hidden="true" /><h2 className="mt-4 font-impact text-4xl uppercase">Envie de participer ?</h2><p className="mt-2 max-w-xl text-sm text-ae2v-offwhite/75">Rejoins-nous sur Discord pour échanger avec l'équipe et découvrir les prochains projets.</p></div><Button asChild size="lg"><a href="https://discord.gg/z85wnSmdnH" target="_blank" rel="noreferrer">Rejoindre Discord <ArrowUpRight aria-hidden="true" /></a></Button></div></section><div className="mx-auto flex max-w-5xl flex-wrap gap-3 px-4 py-12 md:px-6"><Button asChild><Link to="/bde/association">L'association</Link></Button><Button asChild variant="black"><Link to="/bde/equipe">L'équipe</Link></Button><Button asChild variant="secondary"><Link to="/evenements">Les événements</Link></Button></div></>;
}
