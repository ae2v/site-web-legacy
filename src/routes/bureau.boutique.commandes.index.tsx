import { createFileRoute } from "@tanstack/react-router";

import { BureauModuleRedirect } from "@/components/bureau/bureau-module-redirect";

export const Route = createFileRoute("/bureau/boutique/commandes/")({
  component: () => <BureauModuleRedirect section="gestion" tab="commandes" />,
});
