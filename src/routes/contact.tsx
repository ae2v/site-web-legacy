import { createFileRoute } from "@tanstack/react-router";
import { Facebook, Instagram, Mail, MessageCircle } from "lucide-react";

import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — AE2V" },
      { name: "description", content: "Contacter l'AE2V par email, Discord ou sur les réseaux sociaux." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <>
      <PageHero eyebrow="Nous écrire" title="Contact" intro="Une question, un projet ou envie de nous rejoindre ? Retrouve-nous sur nos canaux publics." />
      <section id="nos-liens" className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-16 md:grid-cols-2 md:px-6 md:py-24">
        <a className="flex min-h-32 flex-col justify-between border-2 border-ae2v-black bg-card p-6 transition hover:-translate-y-1 hover:bg-ae2v-red hover:text-white" href="mailto:ae2v.asso@gmail.com">
          <Mail className="size-7" aria-hidden="true" />
          <span className="mt-6 font-impact text-2xl uppercase">ae2v.asso@gmail.com</span>
        </a>
        <a className="flex min-h-32 flex-col justify-between border-2 border-ae2v-black bg-ae2v-green p-6 text-ae2v-black transition hover:-translate-y-1" href="https://discord.gg/z85wnSmdnH" target="_blank" rel="noreferrer">
          <MessageCircle className="size-7" aria-hidden="true" />
          <span className="mt-6 font-impact text-2xl uppercase">Discord AE2V</span>
        </a>
        <a className="flex min-h-32 flex-col justify-between border-2 border-ae2v-black bg-card p-6 transition hover:-translate-y-1 hover:bg-ae2v-red hover:text-white" href="https://www.instagram.com/bde.velizy/" target="_blank" rel="noreferrer">
          <Instagram className="size-7" aria-hidden="true" />
          <span className="mt-6 font-impact text-2xl uppercase">Instagram</span>
        </a>
        <a className="flex min-h-32 flex-col justify-between border-2 border-ae2v-black bg-card p-6 transition hover:-translate-y-1 hover:bg-ae2v-red hover:text-white" href="https://www.facebook.com/Ae2velizy" target="_blank" rel="noreferrer">
          <Facebook className="size-7" aria-hidden="true" />
          <span className="mt-6 font-impact text-2xl uppercase">Facebook</span>
        </a>
      </section>
      <div className="flex justify-center pb-16"><Button asChild size="lg"><a href="https://discord.gg/z85wnSmdnH" target="_blank" rel="noreferrer">Rejoindre le Discord</a></Button></div>
    </>
  );
}
