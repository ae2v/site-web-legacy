import { createFileRoute } from "@tanstack/react-router";
import { BureauPersonRedirect } from "@/components/bureau/bureau-person-redirect";

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
  component: LegacyDossierRedirect,
});

function LegacyDossierRedirect() {
  const { dossierId } = Route.useParams();
  return <BureauPersonRedirect personId={dossierId} />;
}
