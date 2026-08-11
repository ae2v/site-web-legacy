import { createFileRoute, Outlet } from "@tanstack/react-router";
import { z } from "zod";

import { BureauGate } from "@/components/bureau/bureau-gate";

export const Route = createFileRoute("/bureau")({
  validateSearch: z.object({
    eventId: z.string().optional(),
    invoiceId: z.string().optional(),
    orderId: z.string().optional(),
    tab: z.string().optional(),
  }),
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
