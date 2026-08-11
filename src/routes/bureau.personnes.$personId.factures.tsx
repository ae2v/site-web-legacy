import { createFileRoute } from "@tanstack/react-router";

import { PersonSectionRedirect } from "@/components/bureau/person-section-redirect";

export const Route = createFileRoute("/bureau/personnes/$personId/factures")({
  head: () => ({
    meta: [
      { title: "Factures — Fiche membre AE2V" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PersonSectionPage,
});

function PersonSectionPage() {
  return <PersonSectionRedirect personId={Route.useParams().personId} section="factures" />;
}
