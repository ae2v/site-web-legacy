import { teamMembers, type TeamMember } from "@/data/team";
import { demoEvents, normalizeEventTiers, type Ae2vEvent } from "@/data/events";
import { shopProducts, type ShopProduct } from "@/data/shop";

export type { TeamMember } from "@/data/team";

const DYNAMIC_MEMBERS_KEY = "ae2v_dynamic_team_v1";
const DYNAMIC_EVENTS_KEY = "ae2v_dynamic_events_v1";
const DYNAMIC_PRODUCTS_KEY = "ae2v_dynamic_products_v1";
const DYNAMIC_PARTNERS_KEY = "ae2v_dynamic_partners_v1";
const DYNAMIC_AUDIT_KEY = "ae2v_dynamic_audit_v1";

/* -------------------------------------------------------------------------- */
/* 1. ÉQUIPE BDE (100% DYNAMIQUE & SÉCURISÉE)                                   */
/* -------------------------------------------------------------------------- */

export function getDynamicTeamMembers(): TeamMember[] {
  if (typeof window === "undefined") return teamMembers;
  try {
    const raw = localStorage.getItem(DYNAMIC_MEMBERS_KEY);
    if (!raw) return teamMembers;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed.map((member) => ({
          ...member,
          poles: Array.isArray(member.poles)
            ? member.poles
            : [
                member.pole,
                ...(Array.isArray(member.secondaryPoles) ? member.secondaryPoles : []),
              ].filter(Boolean),
          showDefaultPoleTitles: member.showDefaultPoleTitles !== false,
        }))
      : teamMembers;
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
    id: `db-member-${Date.now()}`,
  };
  const updated = [newMember, ...current];
  saveDynamicTeamMembers(updated);
  return newMember;
}

export function updateTeamMember(id: string, updates: Partial<TeamMember>) {
  const current = getDynamicTeamMembers();
  const updated = current.map((m) => (m.id === id ? { ...m, ...updates } : m));
  saveDynamicTeamMembers(updated);
}

export function deleteTeamMember(id: string) {
  const current = getDynamicTeamMembers();
  const updated = current.filter((m) => m.id !== id);
  saveDynamicTeamMembers(updated);
}

/* -------------------------------------------------------------------------- */
/* 2. ÉVÉNEMENTS (100% DYNAMIQUE EN DB/STORE)                                 */
/* -------------------------------------------------------------------------- */

export function getDynamicEvents(): Ae2vEvent[] {
  if (typeof window === "undefined") return demoEvents;
  try {
    const raw = localStorage.getItem(DYNAMIC_EVENTS_KEY);
    if (!raw) return demoEvents;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return demoEvents;
    return parsed.map((event) => {
      const fallback = demoEvents.find((candidate) => candidate.id === event?.id);
      const image = typeof event?.image === "string" ? event.image : "";
      return {
        ...(fallback ?? {}),
        ...event,
        tiers: normalizeEventTiers(event?.tiers),
        image: image && !image.startsWith("/images/") ? image : (fallback?.image ?? ""),
      } as Ae2vEvent;
    });
  } catch {
    return demoEvents;
  }
}

export function saveDynamicEvents(events: Ae2vEvent[]) {
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
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : shopProducts;
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

/* -------------------------------------------------------------------------- */
/* 4. PARTENAIRES                                                              */
/* -------------------------------------------------------------------------- */

export type Ae2vPartner = {
  id: string;
  name: string;
  category: string;
  discount: string;
  description: string;
  website?: string;
  active: boolean;
};

const initialPartners: Ae2vPartner[] = [
  {
    id: "part-01",
    name: "Burger King Vélizy",
    category: "Restauration",
    discount: "-15% sur présentation de la carte",
    description: "Menu étudiant ou -15% sur la commande globale au BK Vélizy 2.",
    website: "https://www.burgerking.fr",
    active: true,
  },
  {
    id: "part-02",
    name: "Auto-École Louvois",
    category: "Permis & Conduite",
    discount: "50€ offerts sur le permis B",
    description: "Remise exclusive pour les étudiants inscrits à l'IUT de Vélizy.",
    active: true,
  },
  {
    id: "part-03",
    name: "Laser Game Evolution",
    category: "Loisirs",
    discount: "1 partie achetée = 1 offerte",
    description: "Offre valable du lundi au jeudi sur présentation de la carte cotisant.",
    active: true,
  },
];

export function getDynamicPartners(): Ae2vPartner[] {
  if (typeof window === "undefined") return initialPartners;
  try {
    const raw = localStorage.getItem(DYNAMIC_PARTNERS_KEY);
    if (!raw) return initialPartners;
    return JSON.parse(raw);
  } catch {
    return initialPartners;
  }
}

export function saveDynamicPartners(partners: Ae2vPartner[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DYNAMIC_PARTNERS_KEY, JSON.stringify(partners));
    window.dispatchEvent(new CustomEvent("ae2v_partners_changed", { detail: partners }));
  } catch (e) {
    console.error("Erreur sauvegarde partenaires:", e);
  }
}

/* -------------------------------------------------------------------------- */
/* 5. JOURNAL D'AUDIT                                                         */
/* -------------------------------------------------------------------------- */

export type AuditLogEntry = {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
};

const initialAuditLogs: AuditLogEntry[] = [
  {
    id: "log-101",
    timestamp: "08/09/2026 14:32",
    user: "Bureau Admin",
    action: "VALIDATION_DOSSIER",
    details: "Dossier ADH-2026-310 validé (Léo Moreau)",
  },
  {
    id: "log-102",
    timestamp: "08/09/2026 15:10",
    user: "Trésorerie",
    action: "CONFIRMATION_COTISATION",
    details: "Cotisation encaissée 12,00 € pour ADH-2026-310",
  },
  {
    id: "log-103",
    timestamp: "08/09/2026 16:45",
    user: "Événementiel",
    action: "SCAN_BILLET",
    details: "Billet AE2V-TK-9X82 validé pour Soirée d'intégration",
  },
];

export function getDynamicAuditLogs(): AuditLogEntry[] {
  if (typeof window === "undefined") return initialAuditLogs;
  try {
    const raw = localStorage.getItem(DYNAMIC_AUDIT_KEY);
    if (!raw) return initialAuditLogs;
    return JSON.parse(raw);
  } catch {
    return initialAuditLogs;
  }
}

export function addAuditLog(action: string, details: string, user = "Membre bureau") {
  if (typeof window === "undefined") return;
  try {
    const current = getDynamicAuditLogs();
    const entry: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: `${new Date().toLocaleDateString("fr-FR")} ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
      user,
      action,
      details,
    };
    const updated = [entry, ...current];
    localStorage.setItem(DYNAMIC_AUDIT_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("ae2v_audit_changed", { detail: updated }));
  } catch {
    /* ignore */
  }
}
