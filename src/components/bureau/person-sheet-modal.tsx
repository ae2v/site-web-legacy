import { useState } from "react";
import {
  X,
  CheckCircle2,
  Mail,
  CreditCard,
  Lock,
  Unlock,
  QrCode,
  Ticket,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/bureau/data-table";
import { formatCents, type Dossier, type CustomAccount } from "@/lib/demo-session";
import { EmailComposerModal } from "@/components/bureau/email-composer-modal";
import { addAuditLog } from "@/lib/dynamic-store";

export type UnifiedPerson = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  departement: string;
  niveau: string;
  status: "VALIDE" | "EN_ATTENTE" | "A_CORRIGER" | "REFUSE";
  contributionStatus: "PAYEE" | "EN_ATTENTE";
  cardCode?: string;
  tickets?: { id: string; eventTitle: string; date: string; code: string; status: string }[];
  orders?: { id: string; date: string; totalCents: number; status: string }[];
};

export type PersonSheetModalProps = {
  isOpen: boolean;
  onClose: () => void;
  person: UnifiedPerson | null;
  onUpdateContribution?: (id: string) => void;
};

export function PersonSheetModal({
  isOpen,
  onClose,
  person,
  onUpdateContribution,
}: PersonSheetModalProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [showEmailComposer, setShowEmailComposer] = useState(false);

  if (!isOpen || !person) return null;

  function handleUnlockToggle() {
    setUnlocked((v) => !v);
    addAuditLog(
      "DEVERROUILLAGE_MEMBRE",
      `Déverrouillage exceptionnel de la fiche: ${person?.id} (${person?.firstName} ${person?.lastName})`,
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ae2v-black/70 p-4 backdrop-blur-sm">
        <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto border-2 border-ae2v-black bg-card shadow-2xl">
          {/* En-tête de la fiche */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-ae2v-black bg-ae2v-black px-6 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="size-10 flex items-center justify-center border-2 border-ae2v-green bg-ae2v-green text-ae2v-black font-bold">
                {person.firstName[0]}
                {person.lastName[0]}
              </div>
              <div>
                <h2 className="font-impact text-xl uppercase tracking-wide">
                  {person.firstName} {person.lastName}
                </h2>
                <p className="text-xs text-ae2v-offwhite/80">{person.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 text-white"
              aria-label="Fermer"
            >
              <X className="size-6" />
            </button>
          </div>

          {/* Barre d'Actions Rapides */}
          <div className="border-b-2 border-ae2v-black bg-ae2v-offwhite p-4 flex flex-wrap gap-2 items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Actions rapides :
            </span>
            <div className="flex flex-wrap gap-2">
              {person.contributionStatus === "EN_ATTENTE" && onUpdateContribution && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => {
                    onUpdateContribution(person.id);
                    addAuditLog(
                      "VALIDER_COTISATION",
                      `Cotisation validée pour ${person.firstName} ${person.lastName}`,
                    );
                  }}
                >
                  <CreditCard className="size-4" />
                  Valider la cotisation (12 €)
                </Button>
              )}
              <Button size="sm" variant="black" onClick={() => setShowEmailComposer(true)}>
                <Mail className="size-4" />
                Rédiger un mail
              </Button>
              <Button
                size="sm"
                variant={unlocked ? "secondary" : "ghost"}
                className={unlocked ? "border-ae2v-red text-ae2v-red font-bold" : ""}
                onClick={handleUnlockToggle}
              >
                {unlocked ? <Unlock className="size-4" /> : <Lock className="size-4" />}
                {unlocked ? "Statut déverrouillé" : "Déverrouillage exceptionnel"}
              </Button>
            </div>
          </div>

          {/* Corps de la fiche */}
          <div className="p-6 space-y-6">
            {/* Statuts & Carte */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="border-2 border-ae2v-black p-4 bg-card">
                <p className="text-[0.65rem] font-bold uppercase text-muted-foreground">
                  Statut Adhésion
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <StatusPill tone={person.status === "VALIDE" ? "green" : "red"}>
                    {person.status}
                  </StatusPill>
                </div>
              </div>
              <div className="border-2 border-ae2v-black p-4 bg-card">
                <p className="text-[0.65rem] font-bold uppercase text-muted-foreground">
                  Cotisation BDE
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <StatusPill tone={person.contributionStatus === "PAYEE" ? "green" : "neutral"}>
                    {person.contributionStatus === "PAYEE" ? "PAYÉE (12 €)" : "EN ATTENTE"}
                  </StatusPill>
                </div>
              </div>
              <div className="border-2 border-ae2v-black p-4 bg-card">
                <p className="text-[0.65rem] font-bold uppercase text-muted-foreground">
                  Code Carte Membre
                </p>
                <p className="mt-1 font-mono font-bold text-sm">
                  {person.cardCode || "AE2V-USER-2026"}
                </p>
              </div>
            </div>

            {/* Identité & Scolarité */}
            <div className="border-2 border-ae2v-black bg-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b-2 border-ae2v-black/10 pb-2">
                <h3 className="font-impact text-lg uppercase">Informations Étudiantes</h3>
                {unlocked && (
                  <span className="text-xs font-bold text-ae2v-red">
                    ⚠️ Mode édition déverrouillé
                  </span>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 text-xs">
                <div>
                  <label className="block font-bold uppercase text-muted-foreground">Prénom</label>
                  <input
                    className="mt-1 min-h-[38px] w-full border-2 border-ae2v-black/20 bg-ae2v-offwhite px-3 py-1 text-sm font-bold"
                    value={person.firstName}
                    disabled={!unlocked}
                    readOnly={!unlocked}
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-muted-foreground">Nom</label>
                  <input
                    className="mt-1 min-h-[38px] w-full border-2 border-ae2v-black/20 bg-ae2v-offwhite px-3 py-1 text-sm font-bold"
                    value={person.lastName}
                    disabled={!unlocked}
                    readOnly={!unlocked}
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-muted-foreground">
                    Filière / Département
                  </label>
                  <input
                    className="mt-1 min-h-[38px] w-full border-2 border-ae2v-black/20 bg-ae2v-offwhite px-3 py-1 text-sm"
                    value={person.departement}
                    disabled={!unlocked}
                    readOnly={!unlocked}
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-muted-foreground">
                    Niveau d'étude
                  </label>
                  <input
                    className="mt-1 min-h-[38px] w-full border-2 border-ae2v-black/20 bg-ae2v-offwhite px-3 py-1 text-sm"
                    value={person.niveau}
                    disabled={!unlocked}
                    readOnly={!unlocked}
                  />
                </div>
              </div>
            </div>

            {/* Billets Événements de la personne */}
            <div className="border-2 border-ae2v-black bg-card p-5">
              <h3 className="font-impact text-lg uppercase flex items-center gap-2 mb-3">
                <Ticket className="size-5 text-ae2v-red" />
                Billets Événements réservés
              </h3>
              {!person.tickets || person.tickets.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Aucun billet réservé pour le moment.
                </p>
              ) : (
                <div className="space-y-2">
                  {person.tickets.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between border-2 border-ae2v-black/10 bg-ae2v-offwhite p-3 text-xs"
                    >
                      <div>
                        <p className="font-bold">{t.eventTitle}</p>
                        <p className="text-muted-foreground">
                          {t.date} · Code: <span className="font-mono font-bold">{t.code}</span>
                        </p>
                      </div>
                      <StatusPill tone={t.status === "valide" ? "green" : "neutral"}>
                        {t.status}
                      </StatusPill>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Commandes Boutique */}
            <div className="border-2 border-ae2v-black bg-card p-5">
              <h3 className="font-impact text-lg uppercase flex items-center gap-2 mb-3">
                <ShoppingBag className="size-5 text-ae2v-red" />
                Commandes Boutique & HelloAsso
              </h3>
              {!person.orders || person.orders.length === 0 ? (
                <p className="text-xs text-muted-foreground">Aucune commande enregistrée.</p>
              ) : (
                <div className="space-y-2">
                  {person.orders.map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between border-2 border-ae2v-black/10 bg-ae2v-offwhite p-3 text-xs"
                    >
                      <div>
                        <p className="font-bold font-mono text-ae2v-red">{o.id}</p>
                        <p className="text-muted-foreground">
                          {o.date} · Montant: {formatCents(o.totalCents)}
                        </p>
                      </div>
                      <StatusPill tone={o.status === "Retirée" ? "green" : "neutral"}>
                        {o.status}
                      </StatusPill>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <EmailComposerModal
        isOpen={showEmailComposer}
        onClose={() => setShowEmailComposer(false)}
        defaultRecipient={person.email}
        defaultSubject={`[BDE AE2V] Information concernant ton compte ${person.firstName}`}
      />
    </>
  );
}
