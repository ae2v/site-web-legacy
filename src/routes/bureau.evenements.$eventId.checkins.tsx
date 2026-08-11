import { createFileRoute } from "@tanstack/react-router";

import { BureauModuleRedirect } from "@/components/bureau/bureau-module-redirect";

export const Route = createFileRoute("/bureau/evenements/$eventId/checkins")({
  head: () => ({
    meta: [
      { title: "Check-in — Événement AE2V" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: EventCheckinsRedirect,
});

function EventCheckinsRedirect() {
  return <BureauModuleRedirect section="gestion" eventId={Route.useParams().eventId} />;
}
