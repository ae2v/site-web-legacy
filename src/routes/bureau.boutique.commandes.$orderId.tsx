import { createFileRoute } from "@tanstack/react-router";

import { BureauModuleRedirect } from "@/components/bureau/bureau-module-redirect";

export const Route = createFileRoute("/bureau/boutique/commandes/$orderId")({
  head: () => ({
    meta: [
      { title: "Commande HelloAsso — Bureau AE2V" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: OrderRedirect,
});

function OrderRedirect() {
  return (
    <BureauModuleRedirect
      section="gestion"
      tab="commandes"
      contextKey="orderId"
      contextId={Route.useParams().orderId}
    />
  );
}
