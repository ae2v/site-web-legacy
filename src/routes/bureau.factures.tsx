import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/bureau/factures")({
  head: () => ({
    meta: [{ title: "Factures — Bureau AE2V" }, { name: "robots", content: "noindex" }],
  }),
  component: () => <Outlet />,
});
