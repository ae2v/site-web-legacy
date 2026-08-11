import { createFileRoute } from "@tanstack/react-router";

import { BureauModuleRedirect } from "@/components/bureau/bureau-module-redirect";

export const Route = createFileRoute("/bureau/messages")({
  head: () => ({
    meta: [{ title: "Messages — Bureau AE2V" }, { name: "robots", content: "noindex" }],
  }),
  component: () => <BureauModuleRedirect section="demandes" tab="messages" />,
});
