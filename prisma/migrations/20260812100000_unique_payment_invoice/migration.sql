-- Un paiement confirmé ne peut produire qu'une seule facture.
-- PostgreSQL autorise plusieurs NULL, ce qui conserve les paiements non facturés.
CREATE UNIQUE INDEX "Payment_invoiceId_key" ON "Payment"("invoiceId");
