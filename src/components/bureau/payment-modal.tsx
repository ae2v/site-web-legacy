import { useState } from "react";
import { CreditCard, X, CheckCircle2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createInvoice, type PaymentMethod, type Invoice } from "@/lib/invoices-store";
import { formatCents } from "@/lib/demo-session";
import { addAuditLog } from "@/lib/dynamic-store";

export type PaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  customerEmail: string;
  defaultDescription: string;
  defaultPriceCents: number;
  onSuccessPay?: (invoice: Invoice) => void;
};

const PAYMENT_METHODS: PaymentMethod[] = [
  "Carte bancaire (CB)",
  "Espèces",
  "Chèque",
  "Pass Culture",
  "HelloAsso",
];

export function PaymentModal({
  isOpen,
  onClose,
  customerName,
  customerEmail,
  defaultDescription,
  defaultPriceCents,
  onSuccessPay,
}: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("Carte bancaire (CB)");
  const [givenAmount, setGivenAmount] = useState((defaultPriceCents / 100).toString());
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);

  if (!isOpen) return null;

  const priceEuros = defaultPriceCents / 100;
  const givenEuros = parseFloat(givenAmount) || 0;
  const changeEuros = Math.max(0, givenEuros - priceEuros);

  const inputClass =
    "min-h-[40px] w-full border-2 border-ae2v-black/25 bg-ae2v-offwhite px-3 py-2 text-sm text-ae2v-black outline-none focus-visible:border-ae2v-red focus-visible:ring-2 focus-visible:ring-ae2v-red/40";

  function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setProcessing(true);

    try {
      const inv = createInvoice({
        customerName,
        customerEmail,
        paymentMethod: method,
        lines: [
          {
            description: defaultDescription,
            qty: 1,
            unitPriceCents: defaultPriceCents,
            totalCents: defaultPriceCents,
          },
        ],
        notes: notes.trim() || undefined,
      });

      addAuditLog(
        "ENCAISSEMENT_PAIEMENT",
        `Paiement encaissé (${method}) : ${formatCents(defaultPriceCents)} pour ${customerName} (${defaultDescription})`,
      );

      if (onSuccessPay) onSuccessPay(inv);
      setCreatedInvoice(inv);
      setProcessing(false);
    } catch {
      setProcessing(false);
      alert("Erreur lors de la génération de la facture.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ae2v-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg border-2 border-ae2v-black bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b-2 border-ae2v-black bg-ae2v-black px-5 py-3 text-white">
          <div className="flex items-center gap-2 font-impact text-lg uppercase tracking-wide">
            <CreditCard className="size-5 text-ae2v-green" />
            Encaissement & Émission de Reçu
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-white/20 text-white">
            <X className="size-5" />
          </button>
        </div>

        {createdInvoice ? (
          <div className="p-6 text-center space-y-4">
            <CheckCircle2 className="size-12 text-ae2v-green mx-auto" />
            <h3 className="font-impact text-xl uppercase">Paiement Validé avec Succès !</h3>
            <p className="text-xs text-muted-foreground">
              Facture N°{" "}
              <span className="font-mono font-bold text-ae2v-red">{createdInvoice.id}</span> générée
              le {createdInvoice.date}.
            </p>
            <div className="border-2 border-ae2v-black bg-ae2v-offwhite p-4 text-xs text-left space-y-1 font-mono">
              <p>
                <strong>Client :</strong> {createdInvoice.customerName}
              </p>
              <p>
                <strong>Mode :</strong> {createdInvoice.paymentMethod}
              </p>
              <p>
                <strong>Montant :</strong> {formatCents(createdInvoice.totalCents)}
              </p>
              {method === "Espèces" && changeEuros > 0 && (
                <p className="text-ae2v-red font-bold">
                  <strong>Monnaie rendue :</strong> {changeEuros.toFixed(2)} €
                </p>
              )}
            </div>
            <Button className="w-full" onClick={onClose}>
              Terminer & Revenir
            </Button>
          </div>
        ) : (
          <form onSubmit={handleConfirm} className="p-6 space-y-4">
            <div className="border-2 border-ae2v-black/10 bg-ae2v-offwhite p-4 space-y-1 text-xs">
              <p className="font-bold text-muted-foreground uppercase">Objet du règlement</p>
              <p className="font-impact text-base text-ae2v-black">{defaultDescription}</p>
              <p className="text-muted-foreground">
                Client : <strong>{customerName}</strong> ({customerEmail})
              </p>
              <p className="font-impact text-lg text-ae2v-red mt-1">
                Total à payer : {formatCents(defaultPriceCents)}
              </p>
            </div>

            <div className="text-xs">
              <label className="block font-bold uppercase tracking-wider text-muted-foreground">
                Moyen de règlement *
              </label>
              <select
                className={`${inputClass} mt-1 font-bold`}
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {method === "Espèces" && (
              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div>
                  <label className="block font-bold uppercase text-muted-foreground">
                    Montant perçu (€)
                  </label>
                  <input
                    className={`${inputClass} mt-1 font-mono font-bold`}
                    type="number"
                    step="0.5"
                    value={givenAmount}
                    onChange={(e) => setGivenAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-muted-foreground">
                    Monnaie à rendre (€)
                  </label>
                  <input
                    className={`${inputClass} mt-1 font-mono font-bold text-ae2v-red bg-card`}
                    value={`${changeEuros.toFixed(2)} €`}
                    disabled
                  />
                </div>
              </div>
            )}

            <div className="text-xs">
              <label className="block font-bold uppercase tracking-wider text-muted-foreground">
                Remarques / Numéro de référence (optionnel)
              </label>
              <input
                className={`${inputClass} mt-1`}
                placeholder="Ex. N° chèque 089231 / Reçu papier"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t-2 border-ae2v-black/10">
              <Button type="button" variant="secondary" onClick={onClose} disabled={processing}>
                Annuler
              </Button>
              <Button type="submit" disabled={processing}>
                <Receipt className="size-4" />
                {processing ? "Encaissement..." : "Valider & Générer Facture"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
