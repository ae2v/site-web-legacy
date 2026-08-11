import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/bureau/boutique/commandes")({
  head: () => ({
    meta: [
      { title: "Commandes HelloAsso — Bureau AE2V" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => <Outlet />,
});
