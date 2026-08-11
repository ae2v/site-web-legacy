import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/bureau/evenements")({
  head: () => ({
    meta: [{ title: "Événements — Bureau AE2V" }, { name: "robots", content: "noindex" }],
  }),
  component: () => <Outlet />,
});
