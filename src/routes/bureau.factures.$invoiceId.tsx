import { createFileRoute } from "@tanstack/react-router";

import { BureauModuleRedirect } from "@/components/bureau/bureau-module-redirect";

export const Route = createFileRoute("/bureau/factures/$invoiceId")({
  head: () => ({
    meta: [{ title: "Facture — Bureau AE2V" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: InvoiceRedirect,
});

function InvoiceRedirect() {
  return (
    <BureauModuleRedirect
      section="gestion"
      tab="factures"
      contextKey="invoiceId"
      contextId={Route.useParams().invoiceId}
    />
  );
}
