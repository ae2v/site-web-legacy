import { createFileRoute } from "@tanstack/react-router";

import { SectionHeading, TapeLabel } from "@/components/brand";
import { ContactForm } from "@/components/contact/contact-form";
import { LinksSection } from "@/components/layout/links-section";
import { PageHero } from "@/components/layout/page-hero";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — AE2V" },
      {
        name: "description",
        content: "Contacter l'AE2V : email du bureau et réseaux sociaux de l'association étudiante de Vélizy.",
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
          Réponse du bureau sous 3 jours ouvrés en moyenne. Les champs marqués d'une étoile sont
          obligatoires.
        </p>
        <div className="mt-8">
          <ContactForm />
        </div>
      </section>

      <LinksSection id="nos-liens" className="scroll-mt-28 border-t-2 border-ae2v-black" />
    </>
  );
}
