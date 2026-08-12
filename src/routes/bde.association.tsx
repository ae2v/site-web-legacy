import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  FileText,
  Users,
  ChevronDown,
  ChevronUp,
  Download,
  Building2,
  CheckCircle2,
  Lock,
  HeartHandshake,
  Sparkles,
} from "lucide-react";

import { PageHero } from "@/components/layout/page-hero";
import { Reveal } from "@/components/brand/reveal";
import { CrossMarker, TapeLabel } from "@/components/brand";
import { Section, HardCard } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { notifySite } from "@/components/ui/site-feedback";

export const Route = createFileRoute("/bde/association")({
  head: () => ({
    meta: [
      { title: "L'Association & Gouvernance — AE2V Vélizy" },
      {
        name: "description",
        content:
          "Missions, gouvernance, transparence financière et statut juridique de l'AE2V, association étudiante de l'IUT de Vélizy.",
      },
      { property: "og:title", content: "L'Association & Gouvernance — AE2V" },
      { property: "og:description", content: "Missions et fonctionnement de l'AE2V." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/bde/association" },
    ],
    links: [{ rel: "canonical", href: "/bde/association" }],
  }),
  component: AssociationPage,
});

const missionsList = [
  {
    title: "1. Animer le Campus",
    desc: "Organiser des événements inclusifs (Soirée d'intégration, Afterworks, Tournois e-sport, Gala) pour rassembler les promos GEII, MMI, Info, RT et Métiers de la Transition.",
  },
  {
    title: "2. Défendre & Représenter",
    desc: "Porter la voix des étudiants auprès de l'administration de l'IUT, de l'Université et du CROUS pour faire valoir vos besoins et projets.",
  },
  {
    title: "3. Négocier des Avantages",
    desc: "Développer des partenariats locaux stratégiques (restauration, auto-école, loisirs) débloquant des tarifs préférentiels exclusifs pour les membres.",
  },
];

const faqList = [
  {
    question: "Qui peut adhérer à l'AE2V ?",
    answer:
      "Tout étudiant inscrit à l'IUT de Vélizy (quel que soit son département : GEII, Informatique, MMI, RT, etc.) ou membre du personnel de l'établissement peut adhérer.",
  },
  {
    question: "Quelle est la différence entre membre adhérent et cotisant ?",
    answer:
      "Rejoins-nous sur Discord pour découvrir les projets et les avantages proposés par l'association.",
  },
  {
    question: "Comment sont prises les décisions au BDE ?",
    answer:
      "Les décisions stratégiques et budgétaires sont discutées lors des réunions régulières du bureau et votées en Assemblée Générale.",
  },
  {
    question: "Comment candidater pour rejoindre le bureau ?",
    answer:
      "Rendez-vous sur Discord ou utilisez la page contact pour rejoindre le bureau.",
  },
];

function AssociationPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      <PageHero
        eyebrow="Gouvernance & Engagements"
        title="L'Association AE2V"
        intro="L'AE2V est l'association étudiante officielle de l'IUT de Vélizy. Fondée par des étudiants pour les étudiants, elle fonctionne sous statut Loi 1901."
      />

      {/* Section 1: Nos Missions */}
      <Section number={1} ghost="MISSIONS" title="Nos 3 Axes d'Engagement">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {missionsList.map((mission, index) => (
            <Reveal key={mission.title} delay={index * 60}>
              <div className="h-full border-2 border-ae2v-black bg-card p-6 flex flex-col justify-between">
                <div>
                  <CrossMarker className="text-ae2v-red mb-3" size={18} />
                  <h3 className="font-impact text-xl uppercase">{mission.title}</h3>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    {mission.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-ae2v-black/10 flex items-center gap-1.5 text-[0.65rem] font-bold text-ae2v-black uppercase">
                  <CheckCircle2 className="size-3.5 text-ae2v-green" />
                  <span>Engagement garanti</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Section 3: Transparence & Documents Légal */}
      <Section
        number={2}
        ghost="DOCUMENTS"
        title="Transparence & Documents de l'Association"
        intro="Retrouvez ci-dessous les informations légales et les règles de fonctionnement de l'association AE2V."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <HardCard eyebrow="Identité Légale" title="Fiche Fédérale AE2V">
            <dl className="grid gap-2 text-xs sm:grid-cols-2 mt-3 font-mono">
              <div>
                <dt className="opacity-70 uppercase font-sans">Nom officiel :</dt>
                <dd className="font-bold">ASSOCIATION ETUDIANTE DE VELIZY-VILLACOUBLAY.</dd>
              </div>
              <div>
                <dt className="opacity-70 uppercase font-sans">Numéro RNA :</dt>
                <dd className="font-bold">W784003407</dd>
              </div>
              <div>
                <dt className="opacity-70 uppercase font-sans">N° de parution :</dt>
                <dd className="font-bold">20120047</dd>
              </div>
              <div>
                <dt className="opacity-70 uppercase font-sans">N° d'annonce :</dt>
                <dd className="font-bold">1402</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="opacity-70 uppercase font-sans">Objet :</dt>
                <dd className="font-bold">Organisation d'évènements extra-scolaires afin de créer et entretenir les liens entre les étudiants des différents départements de l'IUT de Vélizy.</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="opacity-70 uppercase font-sans">Siège social :</dt>
                <dd className="font-bold">5e étage, appartement 517, 5 rue Paul Dautier, 78140 Vélizy-Villacoublay</dd>
              </div>
              <div>
                <dt className="opacity-70 uppercase font-sans">Date de déclaration :</dt>
                <dd className="font-bold">4 novembre 2012</dd>
              </div>
              <div>
                <dt className="opacity-70 uppercase font-sans">Lieu :</dt>
                <dd className="font-bold">Préfecture</dd>
              </div>
              <div>
                <dt className="opacity-70 uppercase font-sans">Domaines :</dt>
                <dd className="font-bold">Éducation, formation · Associations d'étudiants et d'élèves</dd>
              </div>
              <div>
                <dt className="opacity-70 uppercase font-sans">Localisation :</dt>
                <dd className="font-bold">Yvelines</dd>
              </div>
            </dl>
          </HardCard>

          <HardCard eyebrow="Journal officiel" title="Liens de l'annonce">
            Retrouvez la publication officielle de l'association et son justificatif PDF sur le site du Journal officiel.
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="sm" variant="black" asChild><a href="https://www.journal-officiel.gouv.fr/pages/associations-detail-annonce/?q.id=id:201200471402" target="_blank" rel="noreferrer">Voir l'annonce</a></Button>
              <Button size="sm" variant="secondary" asChild><a href="https://compte.journal-officiel.gouv.fr/pages/verification_pdf/?source=jo_associations&q=id:201200471402" target="_blank" rel="noreferrer">Télécharger le justificatif PDF</a></Button>
            </div>
          </HardCard>
        </div>

        {/* FAQ Accordion */}
        <h3 className="font-impact text-2xl uppercase mt-12 mb-6">Foire Aux Questions (FAQ)</h3>
        <div className="space-y-3">
          {faqList.map((item, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={index} className="border-2 border-ae2v-black bg-card">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left font-impact text-lg uppercase"
                >
                  <span>{item.question}</span>
                  {isOpen ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
                </button>
                {isOpen && (
                  <div className="p-4 pt-0 text-xs leading-relaxed text-muted-foreground border-t border-ae2v-black/10 mt-2">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>
    </>
  );
}
