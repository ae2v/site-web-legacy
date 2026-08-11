import { createFileRoute } from "@tanstack/react-router";

import { PersonSectionRedirect } from "@/components/bureau/person-section-redirect";

export const Route = createFileRoute("/bureau/personnes/$personId/adhesions")({
  head: () => ({
    meta: [
      { title: "Adhésions — Fiche membre AE2V" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PersonSectionPage,
});

function PersonSectionPage() {
  return <PersonSectionRedirect personId={Route.useParams().personId} section="dossier-complet" />;
}
