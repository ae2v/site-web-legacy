import { createFileRoute } from "@tanstack/react-router";

import { SectionHeading, TapeLabel } from "@/components/brand";
import { LinksSection } from "@/components/layout/links-section";
import { PageHero } from "@/components/layout/page-hero";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — AE2V" },
      {
        name: "description",
        content:
          "Contacter l'AE2V : email du bureau et réseaux sociaux de l'association étudiante de Vélizy.",
      },
      { property: "og:title", content: "Contact — AE2V" },
      { property: "og:description", content: "Contacter le bureau de l'AE2V." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Nous écrire"
        title="Contact"
        intro="Une question sur l'adhésion, un événement, un partenariat ? Écris au bureau."
      />

      <section
        id="formulaire-contact"
        aria-labelledby="ae2v-formulaire"
        className="mx-auto w-full max-w-7xl scroll-mt-28 px-4 py-14 md:px-6 md:py-20"
      >
        <TapeLabel tone="red">Écrire au bureau</TapeLabel>
        <SectionHeading as="h2" size="md" ghost="CONTACT" className="mt-5">
          <span id="ae2v-formulaire">Formulaire de contact</span>
        </SectionHeading>
        <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
          Pour toute question ou envie de participer, contacte-nous par email ou rejoins directement notre Discord.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="mailto:ae2v.asso@gmail.com" className="inline-flex min-h-12 items-center border-2 border-ae2v-black bg-ae2v-red px-5 font-bold uppercase text-ae2v-offwhite hover:bg-ae2v-black">Envoyer un email</a>
          <a href="https://discord.gg/z85wnSmdnH" target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center border-2 border-ae2v-black bg-ae2v-green px-5 font-bold uppercase text-ae2v-black hover:bg-ae2v-black hover:text-ae2v-offwhite">Rejoindre Discord</a>
        </div>
      </section>

      <LinksSection id="nos-liens" className="scroll-mt-28 border-t-2 border-ae2v-black" />
    </>
  );
}
