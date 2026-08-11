import { createFileRoute } from "@tanstack/react-router";

import { BureauModuleRedirect } from "@/components/bureau/bureau-module-redirect";

export const Route = createFileRoute("/bureau/exports")({
  head: () => ({
    meta: [{ title: "Exports — Bureau AE2V" }, { name: "robots", content: "noindex" }],
  }),
  component: () => <BureauModuleRedirect section="personnes" />,
});
