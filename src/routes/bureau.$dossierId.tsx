import { createFileRoute, Link } from "@tanstack/react-router";

import { DossierFiche } from "@/components/bureau/dossier-fiche";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { membershipStatusLabels, useDemoSession } from "@/lib/demo-session";

export const Route = createFileRoute("/bureau/$dossierId")({
  head: () => ({
    meta: [
      { title: "Fiche adhérent — Bureau AE2V" },
      { name: "description", content: "Fiche détaillée d'une demande d'adhésion ou d'un membre." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Fiche adhérent — Bureau AE2V" },
      { property: "og:description", content: "Fiche détaillée réservée au bureau AE2V." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: DossierPage,
});

function DossierPage() {
  const { dossierId } = Route.useParams() as { dossierId: string };
  const { dossiers } = useDemoSession();
  const dossier = dossiers.find((d) => d.id === dossierId) ?? null;

  if (!dossier) {
    return (
      <>
        <PageHero
          eyebrow="Bureau"
          title="Fiche introuvable"
          intro="Ce dossier n'existe pas ou a été supprimé de la démonstration."
        >
          <Button asChild size="lg">
            <Link to="/bureau">Retour aux dossiers</Link>
          </Button>
        </PageHero>
      </>
    );
  }

  return (
    <>
      <PageHero
        eyebrow={`Dossier ${dossier.id}`}
        title={`${dossier.firstName} ${dossier.lastName}`}
        intro={`Adhésion ${membershipStatusLabels[dossier.status].toLowerCase()} · demande déposée le ${dossier.submittedAt}.`}
      >
        <Button asChild size="lg" variant="black">
          <Link to="/bureau">← Retour à la liste</Link>
        </Button>
      </PageHero>

      <section className="mx-auto w-full max-w-5xl px-4 py-12 md:px-6 md:py-16">
        <DossierFiche dossier={dossier} />
      </section>
    </>
  );
}
