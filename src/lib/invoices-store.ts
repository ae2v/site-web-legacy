/**
 * Store dynamique pour la gestion des factures et reçus de règlement AE2V.
 */

import { generateRandom2026Code } from "@/lib/id-generator";

export type PaymentMethod =
  "Espèces" | "Carte bancaire (CB)" | "Chèque" | "Pass Culture" | "HelloAsso";

export type InvoiceLine = {
  description: string;
  qty: number;
  unitPriceCents: number;
  totalCents: number;
};

export type Invoice = {
  id: string; // Ex. AE2V-2026-FAC-7K9P2M4X
  date: string;
  customerName: string;
  customerEmail: string;
  paymentMethod: PaymentMethod;
  totalCents: number;
  lines: InvoiceLine[];
  status?: "EMISE" | "ANNULEE" | "REMBOURSEE" | "PARTIELLEMENT_REMBOURSEE";
  notes?: string;
  /** Paiement serveur rattaché, lorsqu’il existe. */
  paymentId?: string | null;
  paymentStatus?: string | null;
  refundedAmountCents?: number;
};

const STORAGE_KEY = "ae2v_dynamic_invoices_v1";

const initialInvoices: Invoice[] = [
  {
    id: "AE2V-2026-FAC-9K2M4P7X",
    date: new Date().toLocaleDateString("fr-FR"),
    customerName: "Inès Faure",
    customerEmail: "ines.demo@etu.uvsq.fr",
    paymentMethod: "Carte bancaire (CB)",
    totalCents: 1200,
    lines: [
      {
        description: "Cotisation Annuelle Adhérent BDE AE2V 2026-2027",
        qty: 1,
        unitPriceCents: 1200,
        totalCents: 1200,
      },
    ],
    notes: "Règlement effectué lors du forum de rentrée.",
  },
  {
    id: "AE2V-2026-FAC-3R8W1L9V",
    date: new Date().toLocaleDateString("fr-FR"),
    customerName: "Hugo Nguyen",
    customerEmail: "hugo.demo@ae2v.fr",
    paymentMethod: "Espèces",
    totalCents: 2500,
    lines: [
      {
        description: "Billet Gala de fin d'année (Tarif cotisant)",
        qty: 1,
        unitPriceCents: 2500,
        totalCents: 2500,
      },
    ],
  },
];

export function getDynamicInvoices(): Invoice[] {
  if (typeof window === "undefined") return initialInvoices;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialInvoices;
    return JSON.parse(raw);
  } catch {
    return initialInvoices;
  }
}

export function saveDynamicInvoices(invoices: Invoice[]): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
      window.dispatchEvent(new CustomEvent("ae2v_invoices_changed", { detail: invoices }));
    } catch (e) {
      console.error("Erreur sauvegarde factures:", e);
    }
  }
}

export function createInvoice({
  customerName,
  customerEmail,
  paymentMethod,
  lines,
  notes,
}: {
  customerName: string;
  customerEmail: string;
  paymentMethod: PaymentMethod;
  lines: InvoiceLine[];
  notes?: string;
}): Invoice {
  const totalCents = lines.reduce((acc, l) => acc + l.totalCents, 0);
  const newInvoice: Invoice = {
    id: generateRandom2026Code("FAC"),
    date: new Date().toLocaleDateString("fr-FR"),
    customerName,
    customerEmail,
    paymentMethod,
    totalCents,
    lines,
    ...(notes ? { notes } : {}),
  };

  const current = getDynamicInvoices();
  saveDynamicInvoices([newInvoice, ...current]);
  return newInvoice;
}
