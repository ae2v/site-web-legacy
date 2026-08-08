import { teamMembers, type TeamMember } from "@/data/team";
import { eventsData, type EventItem } from "@/data/events";
import { shopProducts, type ShopProduct } from "@/data/shop";

const DYNAMIC_MEMBERS_KEY = "ae2v_dynamic_team_v1";
const DYNAMIC_EVENTS_KEY = "ae2v_dynamic_events_v1";
const DYNAMIC_PRODUCTS_KEY = "ae2v_dynamic_products_v1";

/* -------------------------------------------------------------------------- */
/* 1. ÉQUIPE BDE                                                              */
/* -------------------------------------------------------------------------- */

export function getDynamicTeamMembers(): TeamMember[] {
  if (typeof window === "undefined") return teamMembers;
  try {
    const raw = localStorage.getItem(DYNAMIC_MEMBERS_KEY);
    if (!raw) return teamMembers;
    return JSON.parse(raw);
  } catch {
    return teamMembers;
  }
}

export function saveDynamicTeamMembers(members: TeamMember[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DYNAMIC_MEMBERS_KEY, JSON.stringify(members));
    window.dispatchEvent(new CustomEvent("ae2v_team_changed", { detail: members }));
  } catch (e) {
    console.error("Erreur sauvegarde équipe:", e);
  }
}

export function addTeamMember(member: Omit<TeamMember, "id">): TeamMember {
  const current = getDynamicTeamMembers();
  const newMember: TeamMember = {
    ...member,
    id: `custom-member-${Date.now()}`,
  };
  const updated = [newMember, ...current];
  saveDynamicTeamMembers(updated);
  return newMember;
}

export function deleteTeamMember(id: string) {
  const current = getDynamicTeamMembers();
  const updated = current.filter((m) => m.id !== id);
  saveDynamicTeamMembers(updated);
}

/* -------------------------------------------------------------------------- */
/* 2. ÉVÉNEMENTS                                                              */
/* -------------------------------------------------------------------------- */

export function getDynamicEvents(): EventItem[] {
  if (typeof window === "undefined") return eventsData;
  try {
    const raw = localStorage.getItem(DYNAMIC_EVENTS_KEY);
    if (!raw) return eventsData;
    return JSON.parse(raw);
  } catch {
    return eventsData;
  }
}

export function saveDynamicEvents(events: EventItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DYNAMIC_EVENTS_KEY, JSON.stringify(events));
    window.dispatchEvent(new CustomEvent("ae2v_events_changed", { detail: events }));
  } catch (e) {
    console.error("Erreur sauvegarde événements:", e);
  }
}

/* -------------------------------------------------------------------------- */
/* 3. BOUTIQUE                                                                */
/* -------------------------------------------------------------------------- */

export function getDynamicShopProducts(): ShopProduct[] {
  if (typeof window === "undefined") return shopProducts;
  try {
    const raw = localStorage.getItem(DYNAMIC_PRODUCTS_KEY);
    if (!raw) return shopProducts;
    return JSON.parse(raw);
  } catch {
    return shopProducts;
  }
}

export function saveDynamicShopProducts(products: ShopProduct[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DYNAMIC_PRODUCTS_KEY, JSON.stringify(products));
    window.dispatchEvent(new CustomEvent("ae2v_products_changed", { detail: products }));
  } catch (e) {
    console.error("Erreur sauvegarde boutique:", e);
  }
}
