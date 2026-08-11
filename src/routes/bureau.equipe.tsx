import { createFileRoute } from "@tanstack/react-router";

import { BureauModuleRedirect } from "@/components/bureau/bureau-module-redirect";

export const Route = createFileRoute("/bureau/equipe")({
  head: () => ({
    meta: [
      { title: "Membres du bureau — Bureau AE2V" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => <BureauModuleRedirect section="personnes" tab="equipe_bde" />,
});
