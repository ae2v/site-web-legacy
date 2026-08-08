import { createFileRoute, Outlet } from "@tanstack/react-router";

import { BureauGate } from "@/components/bureau/bureau-gate";

export const Route = createFileRoute("/bureau")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex, nofollow" }],
  }),
  component: BureauLayout,
});

function BureauLayout() {
  return (
    <BureauGate>
      <Outlet />
    </BureauGate>
  );
}
