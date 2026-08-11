import { createFileRoute } from "@tanstack/react-router";

import { BureauModuleRedirect } from "@/components/bureau/bureau-module-redirect";

export const Route = createFileRoute("/bureau/candidatures")({
  head: () => ({
    meta: [
      { title: "Candidatures — Bureau AE2V" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => <BureauModuleRedirect section="demandes" tab="candidatures" />,
});
