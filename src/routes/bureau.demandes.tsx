import { createFileRoute } from "@tanstack/react-router";

import { BureauModuleRedirect } from "@/components/bureau/bureau-module-redirect";

export const Route = createFileRoute("/bureau/demandes")({
  head: () => ({
    meta: [{ title: "Demandes — Bureau AE2V" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: () => <BureauModuleRedirect section="demandes" tab="adhesions" />,
});
