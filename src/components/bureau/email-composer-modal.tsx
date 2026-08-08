import { useState } from "react";
import { Send, X, Mail, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendEmailFromBureau } from "@/lib/site-config";
import { addAuditLog } from "@/lib/dynamic-store";
import { useDemoSession } from "@/lib/demo-session";

export type EmailComposerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  defaultRecipient?: string;
  defaultSubject?: string;
  defaultBody?: string;
  onSuccess?: () => void;
};

const SENDER_ACCOUNTS = [
  { label: "Camille Rousseau — Présidente (presidence@ae2v.fr)", email: "presidence@ae2v.fr" },
  { label: "Awa Diallo — Secrétaire (secretariat@ae2v.fr)", email: "secretariat@ae2v.fr" },
  { label: "Thomas Lemoine — Trésorier (tresorerie@ae2v.fr)", email: "tresorerie@ae2v.fr" },
  { label: "Pôle Événementiel (evenementiel@ae2v.fr)", email: "evenementiel@ae2v.fr" },
  { label: "Support AE2V Général (contact@ae2v.fr)", email: "contact@ae2v.fr" },
];

const TEMPLATES = [
  {
    name: "Validation Adhésion",
    subject: "[AE2V] Validation de ton adhésion 2026-2027",
    body: "Bonjour,\n\nNous avons le plaisir de t'informer que ta demande d'adhésion à l'AE2V pour l'année 2026-2027 a été validée par le bureau.\n\nTu peux dès à présent retrouver ta carte de membre numérique et son QR code dans ton espace (« Mon espace »).\n\nÀ très vite sur le campus,\nL'équipe du BDE AE2V.",
  },
  {
    name: "Rappel Cotisation",
    subject: "[AE2V] Règlement de ta cotisation annuelle",
    body: "Bonjour,\n\nTa demande d'adhésion est en attente de cotisation. Pour débloquer tes avantages et tarifs réduits, tu peux venir régler ta cotisation au bureau de l'AE2V (espèces, CB ou chèque) pendant nos permanences.\n\nCordialement,\nLa Trésorerie AE2V.",
  },
  {
    name: "Réponse Question",
    subject: "[AE2V] Suite à votre message",
    body: "Bonjour,\n\nMerci d'avoir contacté l'AE2V. Nous avons bien pris en compte ta demande et voici nos éléments de réponse :\n\n[Rédiger la réponse ici]\n\nRestant à ta disposition,\nL'équipe AE2V.",
  },
];

export function EmailComposerModal({
  isOpen,
  onClose,
  defaultRecipient = "",
  defaultSubject = "",
  defaultBody = "",
  onSuccess,
}: EmailComposerModalProps) {
  const session = useDemoSession();
  const currentAcc = session?.account;

  const initialSender = currentAcc?.email?.endsWith("@ae2v.fr")
    ? currentAcc.email
    : "contact@ae2v.fr";

  const [sender, setSender] = useState(initialSender);
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [sending, setSending] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  function applyTemplate(tpl: (typeof TEMPLATES)[0]) {
    setSubject(tpl.subject);
    setBody(tpl.body);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!recipient.trim() || !subject.trim() || !body.trim()) return;

    setSending(true);
    setStatusNotice(null);
    try {
      const res = await sendEmailFromBureau(recipient.trim(), subject.trim(), body.trim());
      setSending(false);
      setStatusNotice(`✓ E-mail envoyé à ${recipient} depuis ${sender} à ${res.timestamp}`);
      addAuditLog("ENVOI_EMAIL", `E-mail envoyé à ${recipient} depuis ${sender} (${subject})`);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
        setStatusNotice(null);
      }, 1200);
    } catch {
      setSending(false);
      setStatusNotice("✕ Erreur lors de l'envoi de l'e-mail.");
    }
  }

  const inputClass =
    "min-h-[40px] w-full border-2 border-ae2v-black/25 bg-ae2v-offwhite px-3 py-2 text-sm text-ae2v-black outline-none focus-visible:border-ae2v-red focus-visible:ring-2 focus-visible:ring-ae2v-red/40";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ae2v-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl border-2 border-ae2v-black bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b-2 border-ae2v-black bg-ae2v-red px-5 py-3 text-white">
          <div className="flex items-center gap-2 font-impact text-lg uppercase tracking-wide">
            <Mail className="size-5" />
            Rédiger un e-mail officiel BDE
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-white hover:bg-white/20"
            aria-label="Fermer"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSend} className="p-6 space-y-4">
          {/* Sélection des Modèles Rapides */}
          <div className="border-2 border-ae2v-black/20 bg-ae2v-offwhite p-3">
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
              <FileText className="size-3.5 text-ae2v-red" /> Modèles de réponse rapide
            </p>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.name}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="border border-ae2v-black bg-card px-2.5 py-1 text-xs font-bold hover:bg-ae2v-black hover:text-white transition-colors"
                >
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 text-xs">
            <div>
              <label className="block font-bold uppercase tracking-wider text-muted-foreground">
                Expéditeur de la fonction *
              </label>
              <select
                className={`${inputClass} mt-1`}
                value={sender}
                onChange={(e) => setSender(e.target.value)}
              >
                {SENDER_ACCOUNTS.map((acc) => (
                  <option key={acc.email} value={acc.email}>
                    {acc.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold uppercase tracking-wider text-muted-foreground">
                Destinataire *
              </label>
              <input
                className={`${inputClass} mt-1`}
                type="email"
                placeholder="etudiant@domaine.fr"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-bold uppercase tracking-wider text-muted-foreground">
              Objet de l'e-mail *
            </label>
            <input
              className={`${inputClass} mt-1`}
              placeholder="Ex. Validation de ton adhésion BDE 2026"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="text-xs">
            <label className="block font-bold uppercase tracking-wider text-muted-foreground">
              Corps du message *
            </label>
            <textarea
              className={`${inputClass} mt-1 min-h-[160px] font-sans`}
              placeholder="Rédige ton message ici..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </div>

          {statusNotice && (
            <div className="border-2 border-ae2v-green bg-ae2v-green/10 p-3 text-xs font-bold text-ae2v-black flex items-center gap-2">
              <CheckCircle className="size-4 text-ae2v-green" />
              <span>{statusNotice}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t-2 border-ae2v-black/10">
            <p className="text-[0.65rem] text-muted-foreground font-mono">
              Domaine d'envoi certifié @ae2v.fr
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={onClose} disabled={sending}>
                Annuler
              </Button>
              <Button type="submit" disabled={sending}>
                <Send className="size-4" />
                {sending ? "Envoi..." : "Envoyer l'e-mail"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
