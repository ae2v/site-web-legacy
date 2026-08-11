/**
 * Store dynamique pour la gestion des commandes de la boutique & HelloAsso.
 */

import { generateRandom2026Code } from "@/lib/id-generator";

export type OrderStatus = "EN_ATTENTE" | "PAYEE" | "LIVREE" | "ANNULEE";

export type OrderItem = {
  productId: string;
  productName: string;
  qty: number;
  unitPriceCents: number;
};

export type Ae2vOrder = {
  id: string; // Ex. AE2V-2026-CMD-8X92
  serverId?: string;
  date: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  totalCents: number;
  status: OrderStatus;
  notes?: string;
  helloAssoId?: string;
};

const STORAGE_KEY = "ae2v_dynamic_orders_v1";

const initialOrders: Ae2vOrder[] = [
  {
    id: generateRandom2026Code("CMD"),
    date: "02/09/2026",
    customerName: "Camille Marchand",
    customerEmail: "camille.marchand@etu.uvsq.fr",
    items: [
      {
        productId: "sweat-ae2v",
        productName: "Sweat à capuche AE2V 2026",
        qty: 1,
        unitPriceCents: 2800,
      },
      { productId: "ecocup", productName: "Ecocup AE2V Collector", qty: 2, unitPriceCents: 200 },
    ],
    totalCents: 3200,
    status: "LIVREE",
    notes: "Commande remise en main propre lors du forum des associations.",
    helloAssoId: "HA-2026-9812",
  },
  {
    id: generateRandom2026Code("CMD"),
    date: "05/09/2026",
    customerName: "Lucas Bernard",
    customerEmail: "lucas.bernard@etu.uvsq.fr",
    items: [
      {
        productId: "tshirt-ae2v",
        productName: "T-Shirt Officiel AE2V",
        qty: 1,
        unitPriceCents: 1500,
      },
    ],
    totalCents: 1500,
    status: "PAYEE",
    notes: "À récupérer au local BDE jeudi 14h.",
    helloAssoId: "HA-2026-4410",
  },
  {
    id: generateRandom2026Code("CMD"),
    date: "07/09/2026",
    customerName: "Sophie Martin",
    customerEmail: "sophie.martin@etu.uvsq.fr",
    items: [
      { productId: "gourde", productName: "Gourde Inox AE2V", qty: 1, unitPriceCents: 1200 },
      { productId: "tote-bag", productName: "Tote Bag AE2V", qty: 1, unitPriceCents: 500 },
    ],
    totalCents: 1700,
    status: "EN_ATTENTE",
    notes: "Paiement en attente de validation chèque BDE.",
  },
  {
    id: generateRandom2026Code("CMD"),
    date: "08/09/2026",
    customerName: "Alexandre Petit",
    customerEmail: "alex.petit@etu.uvsq.fr",
    items: [
      { productId: "ecocup", productName: "Ecocup AE2V Collector", qty: 5, unitPriceCents: 200 },
    ],
    totalCents: 1000,
    status: "PAYEE",
    notes: "Achat groupé pour le pôle e-sport.",
    helloAssoId: "HA-2026-7731",
  },
];

export function getDynamicOrders(): Ae2vOrder[] {
  if (typeof window === "undefined") return initialOrders;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialOrders;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialOrders;
  } catch {
    return initialOrders;
  }
}

export function saveDynamicOrders(orders: Ae2vOrder[]): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
      window.dispatchEvent(new CustomEvent("ae2v_orders_changed", { detail: orders }));
    } catch (e) {
      console.error("Erreur sauvegarde commandes:", e);
    }
  }
}

export function updateOrder(id: string, patch: Partial<Ae2vOrder>): void {
  const current = getDynamicOrders();
  const updated = current.map((o) => (o.id === id ? { ...o, ...patch } : o));
  saveDynamicOrders(updated);
}

export function addOrder(input: Omit<Ae2vOrder, "id" | "date">): Ae2vOrder {
  const newOrder: Ae2vOrder = {
    ...input,
    id: generateRandom2026Code("CMD"),
    date: new Date().toLocaleDateString("fr-FR"),
  };
  const current = getDynamicOrders();
  saveDynamicOrders([newOrder, ...current]);
  return newOrder;
}
