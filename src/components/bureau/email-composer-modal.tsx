import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send, X, Mail, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addAuditLog } from "@/lib/dynamic-store";
import { useDemoSession } from "@/lib/demo-session";
import { getEmailUnsubscribeLinkServer } from "@/lib/server-functions/email-preferences";
import { sendEmailServer, type EmailCategory } from "@/lib/server-functions/email-preferences";

export type EmailComposerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  defaultRecipient?: string;
  defaultSubject?: string;
  defaultBody?: string;
  onSuccess?: () => void;
  category?: EmailCategory | "TRANSACTIONNEL";
  showTemplates?: boolean;
};

const SENDER_ACCOUNTS = [
  { label: "Hey’tham KORTAS — Président (president@ae2v.fr)", email: "president@ae2v.fr" },
  {
    label: "Alexandre MARIETTE — Vice-président (vice-president@ae2v.fr)",
    email: "vice-president@ae2v.fr",
  },
  { label: "Carla BARRUET — Secrétaire (secretaire@ae2v.fr)", email: "secretaire@ae2v.fr" },
  { label: "Jaden BRIVAL — Trésorière (tresoriere@ae2v.fr)", email: "tresoriere@ae2v.fr" },
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

function sanitizePreviewMarkup(value: string): string {
  if (typeof DOMParser === "undefined") return value.replaceAll("\n", "<br />");
  const document = new DOMParser().parseFromString(value, "text/html");
  document.querySelectorAll("script,style,iframe,object,embed,form").forEach((node) => {
    node.remove();
  });
  document.querySelectorAll("*").forEach((element) => {
    [...element.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      if (name.startsWith("on") || name === "srcdoc") element.removeAttribute(attribute.name);
      if (element.tagName === "A" && name === "href" && !/^https?:\/\//i.test(attribute.value)) {
        element.removeAttribute(attribute.name);
      }
    });
  });
  return document.body.innerHTML.replaceAll("\n", "<br />");
}

export function EmailComposerModal({
  isOpen,
  onClose,
  defaultRecipient = "",
  defaultSubject = "",
  defaultBody = "",
  onSuccess,
  category: defaultCategory = "BDE",
  showTemplates = true,
}: EmailComposerModalProps) {
  const session = useDemoSession();
  const currentAcc = session?.account;
  const getUnsubscribeLink = useServerFn(getEmailUnsubscribeLinkServer);
  const sendEmailRemote = useServerFn(sendEmailServer);

  const initialSender = currentAcc?.email?.endsWith("@ae2v.fr")
    ? currentAcc.email
    : "contact@ae2v.fr";

  const [sender, setSender] = useState(initialSender);
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [category, setCategory] = useState<EmailCategory | "TRANSACTIONNEL">(defaultCategory);
  const [sending, setSending] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [visualEditor, setVisualEditor] = useState(true);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const visualEditorRef = useRef<HTMLDivElement>(null);
  const isDemo = !currentAcc || currentAcc.id.startsWith("acc-");

  useEffect(() => {
    if (currentAcc?.email) setSender(currentAcc.email);
  }, [currentAcc?.email]);

  useEffect(() => {
    if (!isOpen) return;
    setRecipient(defaultRecipient);
    setSubject(defaultSubject);
    setBody(defaultBody);
    setCategory(defaultCategory);
    setStatusNotice(null);
    setPreviewMode(false);
    setVisualEditor(true);
  }, [defaultBody, defaultCategory, defaultRecipient, defaultSubject, isOpen]);

  useEffect(() => {
    if (!isOpen || !visualEditor || !visualEditorRef.current) return;
    const current = visualEditorRef.current.innerHTML;
    const next = sanitizePreviewMarkup(body || "");
    if (current !== next) visualEditorRef.current.innerHTML = next;
  }, [body, isOpen, visualEditor]);

  if (!isOpen) return null;

  function applyTemplate(tpl: (typeof TEMPLATES)[0]) {
    setSubject(tpl.subject);
    setBody(tpl.body);
  }

  function insertAtCursor(snippet: string) {
    if (visualEditor && visualEditorRef.current) {
      visualEditorRef.current.focus();
      document.execCommand("insertHTML", false, snippet);
      setBody(visualEditorRef.current.innerHTML);
      return;
    }
    const textarea = bodyRef.current;
    if (!textarea) {
      setBody((current) => `${current}${current ? "\n\n" : ""}${snippet}`);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    setBody(`${body.slice(0, start)}${snippet}${body.slice(end)}`);
    requestAnimationFrame(() => {
      textarea.focus();
      const position = start + snippet.length;
      textarea.setSelectionRange(position, position);
    });
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!recipient.trim() || !subject.trim() || !body.trim()) return;

    setSending(true);
    setStatusNotice(null);
    try {
      let finalBody = sanitizePreviewMarkup(body.trim());
      if (isDemo && category !== "TRANSACTIONNEL") {
        try {
          const preference = await getUnsubscribeLink({
            data: { email: recipient.trim(), category },
          });
          if (preference.link) {
            finalBody += `\n\n—\nGérer mes préférences ou me désinscrire : ${preference.link}`;
          }
        } catch {
          // Le lien sera ajouté par le transport serveur lorsque la base sera indisponible côté démo.
        }
      }
      let deliveryStatus: "ENVOYE" | "EN_ATTENTE_ENVOI" = "ENVOYE";
      const timestamp = isDemo
        ? new Date().toLocaleTimeString("fr-FR")
        : (() => {
            return sendEmailRemote({
              data: {
                recipient: recipient.trim(),
                sender: currentAcc?.email ?? sender,
                subject: subject.trim(),
                body: finalBody,
                category,
              },
            }).then((result) => {
              if (!result.ok) throw new Error("email-not-allowed");
              deliveryStatus = result.deliveryStatus === "ENVOYE" ? "ENVOYE" : "EN_ATTENTE_ENVOI";
              return new Date().toLocaleTimeString("fr-FR");
            });
          })();
      const resolvedTimestamp = await timestamp;
      setSending(false);
      setStatusNotice(
        deliveryStatus === "ENVOYE"
          ? `✓ E-mail envoyé à ${recipient} depuis ${sender} à ${resolvedTimestamp}`
          : `✓ E-mail enregistré en attente d’envoi pour ${recipient}`,
      );
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
  const formattingActions: Array<[string, string]> = [
    ["Gras", "<strong>texte important</strong>"],
    ["Italique", "<em>texte mis en avant</em>"],
    ["H1", "<h1>Titre principal</h1>"],
    ["H2", "<h2>Sous-titre</h2>"],
    ["Liste", "<ul>\n  <li>Élément</li>\n</ul>"],
    ["Lien", '<a href="https://bde-velizy.fr">Texte du lien</a>'],
    ["Bouton", '<a href="https://bde-velizy.fr">Accéder à la page</a>'],
    [
      "Tableau",
      "<table>\n  <tr><th>Élément</th><th>Valeur</th></tr>\n  <tr><td>Nom</td><td>À compléter</td></tr>\n</table>",
    ],
  ];

  function applyVisualCommand(command: string, value?: string) {
    if (!visualEditorRef.current) return;
    visualEditorRef.current.focus();
    document.execCommand(command, false, value);
    setBody(visualEditorRef.current.innerHTML);
  }

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
          {showTemplates && (
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
          )}

          <div className="grid gap-4 sm:grid-cols-2 text-xs">
            <div>
              <label className="block font-bold uppercase tracking-wider text-muted-foreground">
                Expéditeur de la fonction *
              </label>
              {isDemo ? (
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
              ) : (
                <>
                  <input
                    className={`${inputClass} mt-1`}
                    value={currentAcc?.email ?? ""}
                    readOnly
                    aria-describedby="sender-help"
                  />
                  <p id="sender-help" className="mt-1 text-[0.65rem] text-muted-foreground">
                    Adresse du compte Bureau connecté.
                  </p>
                </>
              )}
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
              Catégorie de communication
            </label>
            <select
              className={`${inputClass} mt-1`}
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as EmailCategory | "TRANSACTIONNEL")
              }
            >
              <option value="BDE">Vie du BDE</option>
              <option value="ADHESION">Adhésion et vie membre</option>
              <option value="EVENEMENTS">Événements</option>
              <option value="BOUTIQUE">Boutique et commandes</option>
              <option value="INFORMATIONS_GENERALES">Informations générales</option>
              <option value="TRANSACTIONNEL">Transactionnel obligatoire</option>
            </select>
          </div>

          <div className="text-xs">
            <label className="block font-bold uppercase tracking-wider text-muted-foreground">
              Corps du message *
            </label>
            <div className="mt-1 flex flex-wrap gap-1 border-2 border-b-0 border-ae2v-black bg-ae2v-offwhite p-2">
              {formattingActions.map(([label, snippet]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => insertAtCursor(snippet)}
                  className="min-h-9 border-2 border-ae2v-black bg-card px-2 text-[0.65rem] font-bold uppercase hover:bg-ae2v-black hover:text-white"
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPreviewMode((current) => !current)}
                className="min-h-9 border-2 border-ae2v-red bg-ae2v-red px-2 text-[0.65rem] font-bold uppercase text-white hover:bg-ae2v-black"
                aria-pressed={previewMode}
              >
                {previewMode ? "Revenir à l’éditeur" : "Aperçu"}
              </button>
            </div>
            {previewMode ? (
              <div
                className="prose prose-sm mt-1 min-h-[160px] max-w-none border-2 border-ae2v-black bg-white p-5 text-ae2v-black"
                aria-label="Aperçu du message"
                dangerouslySetInnerHTML={{ __html: sanitizePreviewMarkup(body) }}
              />
            ) : (
              <>
                {visualEditor ? (
                  <div
                    ref={visualEditorRef}
                    contentEditable
                    suppressContentEditableWarning
                    role="textbox"
                    aria-multiline="true"
                    aria-label="Corps du message mis en forme"
                    data-placeholder="Rédige ton message ici..."
                    onInput={(event) => setBody(event.currentTarget.innerHTML)}
                    className={`${inputClass} mt-1 min-h-[180px] whitespace-normal font-sans leading-relaxed [&:empty]:before:pointer-events-none [&:empty]:before:text-muted-foreground [&:empty]:before:content-[attr(data-placeholder)]`}
                  />
                ) : (
                  <textarea
                    ref={bodyRef}
                    className={`${inputClass} mt-1 min-h-[160px] font-sans`}
                    placeholder="Rédige ton message ici..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                  />
                )}
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[0.65rem]">
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      className="min-h-8 border border-ae2v-black px-2 font-bold"
                      onClick={() => applyVisualCommand("bold")}
                    >
                      Gras
                    </button>
                    <button
                      type="button"
                      className="min-h-8 border border-ae2v-black px-2 font-bold italic"
                      onClick={() => applyVisualCommand("italic")}
                    >
                      Italique
                    </button>
                    <button
                      type="button"
                      className="min-h-8 border border-ae2v-black px-2 font-bold"
                      onClick={() => applyVisualCommand("formatBlock", "<h1>")}
                    >
                      H1
                    </button>
                    <button
                      type="button"
                      className="min-h-8 border border-ae2v-black px-2 font-bold"
                      onClick={() => applyVisualCommand("formatBlock", "<h2>")}
                    >
                      H2
                    </button>
                    <button
                      type="button"
                      className="min-h-8 border border-ae2v-black px-2 font-bold"
                      onClick={() => applyVisualCommand("insertUnorderedList")}
                    >
                      Liste
                    </button>
                    <button
                      type="button"
                      className="min-h-8 border border-ae2v-black px-2 font-bold"
                      onClick={() =>
                        insertAtCursor('<a href="https://bde-velizy.fr">Lien à personnaliser</a>')
                      }
                    >
                      Lien
                    </button>
                    <button
                      type="button"
                      className="min-h-8 border border-ae2v-black px-2 font-bold"
                      onClick={() =>
                        insertAtCursor(
                          '<a href="https://bde-velizy.fr" style="display:inline-block;padding:10px 16px;background:#D60106;color:#fff;text-decoration:none;font-weight:700">Bouton à personnaliser</a>',
                        )
                      }
                    >
                      Bouton
                    </button>
                    <button
                      type="button"
                      className="min-h-8 border border-ae2v-black px-2 font-bold"
                      onClick={() =>
                        insertAtCursor(
                          "<table><tbody><tr><th>Élément</th><th>Valeur</th></tr><tr><td>À compléter</td><td>À compléter</td></tr></tbody></table>",
                        )
                      }
                    >
                      Tableau
                    </button>
                  </div>
                  <button
                    type="button"
                    className="min-h-8 border border-ae2v-red px-2 font-bold text-ae2v-red"
                    onClick={() => setVisualEditor((current) => !current)}
                  >
                    {visualEditor ? "Éditer le HTML" : "Éditeur visuel"}
                  </button>
                </div>
              </>
            )}
          </div>

          {statusNotice && (
            <div className="border-2 border-ae2v-green bg-ae2v-green/10 p-3 text-xs font-bold text-ae2v-black flex items-center gap-2">
              <CheckCircle className="size-4 text-ae2v-green" />
              <span>{statusNotice}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t-2 border-ae2v-black/10">
            <p className="text-[0.65rem] text-muted-foreground font-mono">
              Envoi journalisé par le compte Bureau connecté
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
