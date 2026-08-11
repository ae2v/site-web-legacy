import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/bureau/boutique")({
  head: () => ({
    meta: [{ title: "Boutique — Bureau AE2V" }, { name: "robots", content: "noindex" }],
  }),
  component: () => <Outlet />,
});
