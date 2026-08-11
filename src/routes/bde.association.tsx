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
  {
    title: "4. Gestion Comptable Rigoureuse",
    desc: "Chaque euro collecté par la cotisation ou les billets est comptabilisé, audité et réinvesti directement dans les services et soirées de l'association.",
  },
  {
    title: "5. Favoriser l'Entraide",
    desc: "Faciliter le parrainage des premières années par les anciens, le partage de cours et l'intégration de tous au sein du campus de Vélizy.",
  },
  {
    title: "6. Éco-responsabilité & Inclusivité",
    desc: "Mettre à disposition des ecocups réutilisables, prévoir des navettes de sécurité gratuites et veiller au respect des personnes lors de nos événements.",
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
      "L'adhésion valide votre dossier étudiant. La cotisation (à partir de 3 € / an) débloque les avantages tarifaires réduits sur les événements, le bar BDE et la boutique.",
  },
  {
    question: "Comment sont prises les décisions au BDE ?",
    answer:
      "Les décisions stratégiques et budgétaires sont discutées lors des réunions hebdomadaires du bureau et votées en Assemblée Générale.",
  },
  {
    question: "Comment candidater pour rejoindre le bureau ?",
    answer:
      "Rendez-vous sur votre espace étudiant (`/espace`) ou utilisez le formulaire de contact pour rejoindre le bureau.",
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
      <Section number={1} ghost="MISSIONS" title="Nos 6 Axes d'Engagement">
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

      {/* Section 2: Schéma de Gouvernance */}
      <Section number={2} ghost="STRUCTURE" title="Structure & Gouvernance" tone="dark">
        <div className="border-2 border-ae2v-offwhite/20 bg-ae2v-black p-6 md:p-8 text-ae2v-offwhite">
          <h3 className="font-impact text-2xl uppercase text-ae2v-green mb-2">
            Organigramme & Prise de Décision
          </h3>
          <p className="text-sm opacity-85 max-w-3xl mb-8">
            Le bureau exécutif est élu chaque année scolaire lors de l'Assemblée Générale. Il
            s'appuie sur une équipe opérationnelle et des bénévoles actifs.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="border-2 border-ae2v-offwhite/30 bg-card/10 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-ae2v-green">
                Niveau 1 — Bureau Exécutif
              </p>
              <h4 className="font-impact text-xl mt-1">Présidence & Trésorerie</h4>
              <p className="mt-2 text-xs opacity-75">
                Pilotage légal, direction stratégique, budget global et représentation auprès de
                l'IUT.
              </p>
            </div>
            <div className="border-2 border-ae2v-offwhite/30 bg-card/10 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-ae2v-green">
                Niveau 3 — Adhérents & Promo
              </p>
              <h4 className="font-impact text-xl mt-1">Assemblée Générale</h4>
              <p className="mt-2 text-xs opacity-75">
                Vote des budgets, validation des rapports d'activité et élection annuelle du bureau.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* Section 3: Transparence & Documents Légal */}
      <Section
        number={3}
        ghost="DOCUMENTS"
        title="Transparence & Documents de l'Association"
        intro="Retrouvez ci-dessous les informations légales et les règles de fonctionnement de l'association AE2V."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <HardCard eyebrow="Identité Légale" title="Fiche Fédérale AE2V">
            <dl className="grid gap-2 text-xs sm:grid-cols-2 mt-3 font-mono">
              <div>
                <dt className="opacity-70 uppercase font-sans">Nom officiel :</dt>
                <dd className="font-bold">AE2V (Association Étudiante Vélizy)</dd>
              </div>
              <div>
                <dt className="opacity-70 uppercase font-sans">Régime juridique :</dt>
                <dd className="font-bold">Association Loi 1901</dd>
              </div>
              <div>
                <dt className="opacity-70 uppercase font-sans">Siège social :</dt>
                <dd className="font-bold">IUT de Vélizy — 10-12 Rampe Bouvines</dd>
              </div>
              <div>
                <dt className="opacity-70 uppercase font-sans">Domaine E-mail :</dt>
                <dd className="font-bold text-ae2v-red">@ae2v.fr</dd>
              </div>
            </dl>
          </HardCard>

          <HardCard eyebrow="Charte & Statuts" title="Consultation des Statuts">
            L'association applique une politique stricte de transparence comptable. Les comptes
            rendus financiers et bilans annuels sont présentés lors de chaque AG.
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                size="sm"
                variant="black"
                onClick={() => alert("Statuts consultables au bureau de l'AE2V sur rendez-vous.")}
              >
                <FileText className="size-4" />
                Demander les statuts (PDF)
              </Button>
              <Button size="sm" variant="secondary" asChild>
                <Link to="/contact">Contacter le secrétaire</Link>
              </Button>
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
