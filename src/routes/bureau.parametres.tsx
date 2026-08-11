import { createFileRoute } from "@tanstack/react-router";

import { BureauModuleRedirect } from "@/components/bureau/bureau-module-redirect";

export const Route = createFileRoute("/bureau/parametres")({
  head: () => ({
    meta: [{ title: "Paramètres — Bureau AE2V" }, { name: "robots", content: "noindex" }],
  }),
  component: () => <BureauModuleRedirect section="gestion" />,
});
