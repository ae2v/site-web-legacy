import type { Ae2vEvent, EventTier } from "@/data/events";

/**
 * Audience tarifaire : la réduction « adhérent » est réservée aux COTISANTS.
 * Un membre validé mais non cotisant (ou en attente de paiement) reste au
 * tarif membre.
 */
export type Audience = "adherent" | "membre" | "public";

/** Tarif applicable pour une audience donnée (repli sur le tarif public). */
export function tierForAudience(event: Ae2vEvent, wanted: Audience): EventTier | undefined {
  return (
    event.tiers.find((t) => t.audience === wanted) ??
    event.tiers.find((t) => t.audience === "public") ??
    event.tiers[0]
  );
}

export function remainingSeats(event: Ae2vEvent): number {
  return Math.max(0, event.capacity - event.registered);
}

export function fillPercent(event: Ae2vEvent): number {
  return Math.min(100, Math.round((event.registered / event.capacity) * 100));
}
