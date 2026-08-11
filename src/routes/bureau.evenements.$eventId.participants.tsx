import { createFileRoute } from "@tanstack/react-router";

import { BureauModuleRedirect } from "@/components/bureau/bureau-module-redirect";

export const Route = createFileRoute("/bureau/evenements/$eventId/participants")({
  head: () => ({
    meta: [
      { title: "Participants — Événement AE2V" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: EventParticipantsRedirect,
});

function EventParticipantsRedirect() {
  return (
    <BureauModuleRedirect section="gestion" tab="evenements" eventId={Route.useParams().eventId} />
  );
}
