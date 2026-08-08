import { useState } from "react";
import { Send, X, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSiteConfig, sendEmailFromBureau } from "@/lib/site-config";
import { addAuditLog } from "@/lib/dynamic-store";

export type EmailComposerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  defaultRecipient?: string;
  defaultSubject?: string;
  defaultBody?: string;
  onSuccess?: () => void;
};

export function EmailComposerModal({
  isOpen,
  onClose,
  defaultRecipient = "",
  defaultSubject = "",
  defaultBody = "",
  onSuccess,
}: EmailComposerModalProps) {
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [sending, setSending] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const senderEmail = getSiteConfig().smtp.senderEmail || "contact@ae2v.fr";

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!recipient.trim() || !subject.trim() || !body.trim()) return;

    setSending(true);
    setStatusNotice(null);
    try {
      const res = await sendEmailFromBureau(recipient.trim(), subject.trim(), body.trim());
      setSending(false);
      setStatusNotice(`✓ E-mail envoyé à ${recipient} à ${res.timestamp}`);
      addAuditLog("ENVOI_EMAIL", `E-mail envoyé à ${recipient} (${subject})`);
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
      <div className="w-full max-w-xl border-2 border-ae2v-black bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b-2 border-ae2v-black bg-ae2v-red px-5 py-3 text-white">
          <div className="flex items-center gap-2 font-impact text-lg uppercase tracking-wide">
            <Mail className="size-5" />
            Rédiger un e-mail BDE
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
          <div className="grid gap-4 sm:grid-cols-2 text-xs">
            <div>
              <label className="block font-bold uppercase tracking-wider text-muted-foreground">
                Expéditeur (SMTP AE2V)
              </label>
              <input
                className={`${inputClass} mt-1 cursor-not-allowed opacity-75`}
                value={senderEmail}
                disabled
              />
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
              className={`${inputClass} mt-1 min-h-[140px] font-sans`}
              placeholder="Rédige ton message ici..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </div>

          {statusNotice && (
            <div className="border-2 border-ae2v-green bg-ae2v-green/10 p-3 text-xs font-bold text-ae2v-black">
              {statusNotice}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t-2 border-ae2v-black/10">
            <Button type="button" variant="secondary" onClick={onClose} disabled={sending}>
              Annuler
            </Button>
            <Button type="submit" disabled={sending}>
              <Send className="size-4" />
              {sending ? "Envoi..." : "Envoyer l'e-mail"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
