import type { Ae2vEvent, EventTier } from "@/data/events";

/**
 * Audience tarifaire : la réduction « cotisant » est réservée aux COTISANTS.
 * Un adhérent validé mais non cotisant (ou en attente de paiement) reste au
 * tarif public.
 */
export type Audience = "adherent" | "public" | "bureau";

/** Tarif applicable pour une audience donnée (repli sur le tarif public). */
export function tierForAudience(event: Ae2vEvent, wanted: Audience): EventTier | undefined {
  const activeTiers = event.tiers.filter((tier) => !tier.disabled);
  return (
    activeTiers.find((t) => t.audience === wanted) ??
    activeTiers.find((t) => t.audience === "public") ??
    activeTiers[0]
  );
}

export function remainingSeats(event: Ae2vEvent): number {
  return Math.max(0, event.capacity - event.registered);
}

export function fillPercent(event: Ae2vEvent): number {
  return Math.min(100, Math.round((event.registered / event.capacity) * 100));
}
