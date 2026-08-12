import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, CalendarDays, MessageCircle } from "lucide-react";

import { CrystalCluster, DiagonalStripe, GrainOverlay, ImpactTitle, SectionHeading, TapeLabel } from "@/components/brand";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { publicEvents } from "@/data/events";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "AE2V — Le BDE de Vélizy" }, { name: "description", content: "L'association étudiante de Vélizy : événements, projets et vie de campus." }] }),
  component: HomePage,
});

function HomePage() {
  const nextEvents = publicEvents.filter((event) => event.status !== "TERMINE").slice(0, 3);
  return <><section className="relative overflow-hidden bg-ae2v-red px-4 py-20 text-ae2v-offwhite md:px-6 md:py-32"><GrainOverlay opacity={0.08} /><CrystalCluster tone="black" variant={1} className="absolute -right-16 -bottom-24 h-80 w-80 opacity-25" /><div className="relative mx-auto max-w-7xl"><TapeLabel tone="green">Association étudiante · IUT de Vélizy</TapeLabel><ImpactTitle as="h1" size="mega" className="mt-7 max-w-4xl">Toujours<br /><span className="text-ae2v-black/80">plus loin,</span><br />ensemble.</ImpactTitle><p className="mt-7 max-w-xl text-lg">L'AE2V fait vivre le campus grâce à des événements, des projets et une communauté étudiante ouverte.</p><div className="mt-8 flex flex-wrap gap-3"><Button asChild size="lg"><Link to="/evenements">Voir les événements</Link></Button><Button asChild size="lg" variant="black"><a href="https://discord.gg/z85wnSmdnH" target="_blank" rel="noreferrer">Rejoindre Discord</a></Button></div></div><DiagonalStripe height={10} className="absolute right-0 bottom-0 left-0 text-ae2v-black" /></section><section className="mx-auto max-w-7xl px-4 py-16 md:px-6"><SectionHeading as="h2" size="md" ghost="AGENDA">Prochains événements</SectionHeading><div className="mt-8 grid gap-4 md:grid-cols-3">{nextEvents.map((event) => <Link key={event.id} to="/evenements" className="group border-2 border-ae2v-black bg-card p-5 hover:-translate-y-1 hover:bg-ae2v-red hover:text-white"><CalendarDays className="size-7" aria-hidden="true" /><h3 className="mt-6 font-impact text-2xl uppercase">{event.title}</h3><p className="mt-2 text-sm">{event.date} · {event.place}</p><ArrowUpRight className="mt-6 size-5" aria-hidden="true" /></Link>)}</div></section><section className="bg-ae2v-black px-4 py-16 text-ae2v-offwhite md:px-6"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 md:flex-row md:items-center"><div><MessageCircle className="size-8 text-ae2v-green" aria-hidden="true" /><h2 className="mt-4 font-impact text-4xl uppercase">Tu veux nous rejoindre ?</h2><p className="mt-2 max-w-xl text-sm text-ae2v-offwhite/75">Adhésion, bénévolat ou bureau : viens échanger directement avec nous sur Discord.</p></div><Button asChild size="lg"><a href="https://discord.gg/z85wnSmdnH" target="_blank" rel="noreferrer">Rejoindre Discord</a></Button></div></section><PageHero eyebrow="Découvrir l'AE2V" title="Une association qui avance ensemble" intro="Découvre nos actions, l'équipe du bureau et les prochains rendez-vous." ><Button asChild size="lg"><Link to="/bde">Découvrir le BDE</Link></Button></PageHero></>;
}
