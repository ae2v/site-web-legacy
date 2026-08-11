import { createFileRoute } from "@tanstack/react-router";

import { PersonSectionRedirect } from "@/components/bureau/person-section-redirect";

export const Route = createFileRoute("/bureau/personnes/$personId/commandes")({
  head: () => ({
    meta: [
      { title: "Commandes — Fiche membre AE2V" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PersonSectionPage,
});

function PersonSectionPage() {
  return <PersonSectionRedirect personId={Route.useParams().personId} section="commandes" />;
}
