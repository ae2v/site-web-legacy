import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, MessageCircle } from "lucide-react";

import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/adherer")({
  head: () => ({
    meta: [
      { title: "Rejoindre l'AE2V — Discord" },
      { name: "description", content: "Rejoins la communauté AE2V directement sur Discord." },
    ],
  }),
  component: AdhererPage,
});

function AdhererPage() {
  return (
    <>
      <PageHero
        eyebrow="Rejoindre l'association"
        title="Viens avec nous"
        intro="Pour rejoindre l'AE2V, découvrir les projets et participer à la vie du campus, passe directement par notre Discord."
      />
      <section className="mx-auto w-full max-w-3xl px-4 py-16 md:px-6 md:py-24">
        <div className="border-2 border-ae2v-black bg-ae2v-red p-8 text-ae2v-offwhite md:p-12">
          <MessageCircle className="size-10 text-ae2v-green" aria-hidden="true" />
          <h2 className="mt-6 font-impact text-4xl uppercase md:text-6xl">Rejoins le Discord AE2V</h2>
          <p className="mt-4 max-w-xl text-base text-ae2v-offwhite/85">
            Tu souhaites devenir adhérent, aider sur un événement ou rejoindre le bureau ? Échange
            avec nous sur le serveur : on te guidera simplement.
          </p>
          <Button asChild size="lg" className="mt-8">
            <a href="https://discord.gg/z85wnSmdnH" target="_blank" rel="noreferrer">
              Ouvrir Discord <ArrowUpRight aria-hidden="true" />
            </a>
          </Button>
        </div>
      </section>
    </>
  );
}
