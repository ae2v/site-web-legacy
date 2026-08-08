import { useMemo, useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Mail,
  Users,
  Trash2,
  Plus,
  Eye,
  CheckCheck,
  QrCode,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Send,
  Upload,
  CreditCard,
  UserCheck,
  Layers,
  Receipt,
  Copy,
  RotateCcw,
  Calendar,
  ListFilter,
  DollarSign,
  Clock,
  Printer,
  X,
  Edit,
  FileText,
  MessageSquare,
  Shield,
  Tag,
  PackageCheck,
  Search,
  Check,
} from "lucide-react";

import { DataTable, StatusPill, TableFilter } from "@/components/bureau/data-table";
import { contributionTone, membershipTone } from "@/components/bureau/dossier-fiche";
import { PageHero } from "@/components/layout/page-hero";
import { Section, EmptyState } from "@/components/layout/section";
import { TabPanel, TabsNav } from "@/components/layout/tabs-nav";
import { Button } from "@/components/ui/button";
import {
  candidatureStatusLabels,
  contactMessageStatusLabels,
  formatCents,
  membershipStatusLabels,
  roleLabels,
  useDemoSession,
  demoAccounts,
  type ContactMessage,
  type ContactMessageStatus,
  type Dossier,
  type Candidature,
  type DemoOrder,
  type DemoTicket,
} from "@/lib/demo-session";
import {
  getDynamicTeamMembers,
  saveDynamicTeamMembers,
  getDynamicEvents,
  saveDynamicEvents,
  getDynamicShopProducts,
  saveDynamicShopProducts,
  getDynamicAuditLogs,
  addAuditLog,
  type TeamMember,
  type AuditLogEntry,
} from "@/lib/dynamic-store";
import { teamPoles, type TeamPole } from "@/data/team";
import { eventStatusLabels, type Ae2vEvent, type EventStatus, type EventTier } from "@/data/events";
import { formatPrice, type ShopProduct } from "@/data/shop";
import { sendEmailFromBureau, getSiteConfig } from "@/lib/site-config";
import { processImageFile } from "@/lib/image-utils";
import { generateRandom2026Code } from "@/lib/id-generator";
import {
  getDynamicInvoices,
  saveDynamicInvoices,
  type Invoice,
  type PaymentMethod,
} from "@/lib/invoices-store";
import {
  getDynamicOrders,
  saveDynamicOrders,
  updateOrder,
  addOrder,
  type Ae2vOrder,
  type OrderStatus,
} from "@/lib/orders-store";
import { EmailComposerModal } from "@/components/bureau/email-composer-modal";
import { PersonSheetModal, type UnifiedPerson } from "@/components/bureau/person-sheet-modal";
import { PaymentModal } from "@/components/bureau/payment-modal";

export const Route = createFileRoute("/bureau/")({
  head: () => ({
    meta: [
      { title: "Bureau — AE2V" },
      {
        name: "description",
        content: "Espace de gestion réservé aux membres du bureau de l'AE2V.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Bureau — AE2V" },
      { property: "og:description", content: "Espace de gestion réservé au bureau AE2V." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/bureau" },
    ],
    links: [{ rel: "canonical", href: "/bureau" }],
  }),
  component: BureauPage,
});

/* -------------------------------------------------------------------------- */
/* Main Bureau Page                                                           */
/* -------------------------------------------------------------------------- */

function BureauPage() {
  const {
    account,
    can,
    dossiers,
    candidatures,
    messages,
    updateCandidature,
    updateDossier,
    updateMessageStatus,
  } = useDemoSession();

  // Navigation principale par Section
  const [mainSection, setMainSection] = useState<"scanner" | "demandes" | "personnes" | "gestion">(
    "demandes",
  );

  // Sous-onglets par section
  const [demandesTab, setDemandesTab] = useState<
    "messages" | "adhesions" | "cotisations_attente" | "candidatures"
  >("messages");
  const [personnesTab, setPersonnesTab] = useState<"membres_valides" | "equipe_bde">(
    "membres_valides",
  );
  const [gestionTab, setGestionTab] = useState<
    "evenements" | "boutique" | "commandes" | "factures"
  >("evenements");

  // Filtres de recherche
  const [membershipFilter, setMembershipFilter] = useState("TOUS");
  const [contribFilter, setContribFilter] = useState("TOUS");
  const [msgFilter, setMsgFilter] = useState("TOUS");
  const [poleFilter, setPoleFilter] = useState("TOUS");
  const [invoicePayFilter, setInvoicePayFilter] = useState("TOUS");

  // Dynamic Stores
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [events, setEvents] = useState<Ae2vEvent[]>([]);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orders, setOrders] = useState<Ae2vOrder[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    setTeamMembers(getDynamicTeamMembers());
    setEvents(getDynamicEvents());
    setProducts(getDynamicShopProducts());
    setInvoices(getDynamicInvoices());
    setOrders(getDynamicOrders());
    setAuditLogs(getDynamicAuditLogs());

    const hTeam = () => setTeamMembers(getDynamicTeamMembers());
    const hEvents = () => setEvents(getDynamicEvents());
    const hProducts = () => setProducts(getDynamicShopProducts());
    const hInvoices = () => setInvoices(getDynamicInvoices());
    const hOrders = () => setOrders(getDynamicOrders());
    const hAudit = () => setAuditLogs(getDynamicAuditLogs());

    window.addEventListener("ae2v_team_changed", hTeam);
    window.addEventListener("ae2v_events_changed", hEvents);
    window.addEventListener("ae2v_products_changed", hProducts);
    window.addEventListener("ae2v_invoices_changed", hInvoices);
    window.addEventListener("ae2v_orders_changed", hOrders);
    window.addEventListener("ae2v_audit_changed", hAudit);

    return () => {
      window.removeEventListener("ae2v_team_changed", hTeam);
      window.removeEventListener("ae2v_events_changed", hEvents);
      window.removeEventListener("ae2v_products_changed", hProducts);
      window.removeEventListener("ae2v_invoices_changed", hInvoices);
      window.removeEventListener("ae2v_orders_changed", hOrders);
      window.removeEventListener("ae2v_audit_changed", hAudit);
    };
  }, []);

  // Modals & Selection states
  const [selectedPerson, setSelectedPerson] = useState<UnifiedPerson | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailDefaultRecipient, setEmailDefaultRecipient] = useState("");
  const [payModalConfig, setPayModalConfig] = useState<{
    customerName: string;
    customerEmail: string;
    description: string;
    priceCents: number;
    onSuccessPay?: (inv: Invoice) => void;
  } | null>(null);

  // Scanner State
  const [scanCodeInput, setScanCodeInput] = useState("");
  const [scannedPerson, setScannedPerson] = useState<UnifiedPerson | null>(null);

  // Event Editing / Creation State
  const [editingEvent, setEditingEvent] = useState<Ae2vEvent | null>(null);
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [selectedAttendeesEvent, setSelectedAttendeesEvent] = useState<Ae2vEvent | null>(null);

  // Product Editing / Creation State
  const [editingProduct, setEditingProduct] = useState<ShopProduct | null>(null);
  const [productFormOpen, setProductFormOpen] = useState(false);

  // Team Member Editing Modal State
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // Candidature Full Reader & Comment Modal State
  const [selectedCandidature, setSelectedCandidature] = useState<Candidature | null>(null);
  const [candidatureNoteInput, setCandidatureNoteInput] = useState("");

  // Order Detail & Notes Modal State
  const [selectedOrder, setSelectedOrder] = useState<Ae2vOrder | null>(null);
  const [orderNoteInput, setOrderNoteInput] = useState("");

  // Invoice Detail / Receipt Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Safe Arrays
  const safeDossiers = dossiers ?? [];
  const safeCandidatures = candidatures ?? [];
  const safeMessages = messages ?? [];
  const safeEvents = events ?? [];
  const safeProducts = products ?? [];
  const safeInvoices = invoices ?? [];
  const safeOrders = orders ?? [];
  const safeTeamMembers = teamMembers ?? [];

  // Filtered Arrays
  const pendingContributions = useMemo(
    () =>
      safeDossiers.filter(
        (d) =>
          d.contributionCents > 0 &&
          (d.contributionStatus === "PAIEMENT_EN_ATTENTE" || d.contributionStatus === "EN_ATTENTE"),
      ),
    [safeDossiers],
  );

  const validatedMembers = useMemo(() => {
    return (demoAccounts ?? []).map((acc) => ({
      id: acc.id,
      firstName: acc.firstName,
      lastName: acc.lastName,
      email: acc.email,
      departement: acc.departement,
      niveau: acc.niveau,
      schoolYear: acc.schoolYear,
      membershipStatus: acc.membershipStatus,
      contributionStatus: acc.contributionStatus,
      memberSince: acc.memberSince,
      cardCode: acc.cardCode,
      tickets: acc.tickets ?? [],
      orders: acc.orders ?? [],
    }));
  }, []);

  const executiveOfficers = useMemo(
    () => safeTeamMembers.filter((m) => m.isOfficer),
    [safeTeamMembers],
  );

  const poleMembers = useMemo(() => safeTeamMembers.filter((m) => !m.isOfficer), [safeTeamMembers]);

  // Scan Action Handler
  function handleExecuteScan(codeToScan?: string) {
    const targetCode = (codeToScan ?? scanCodeInput).trim().toUpperCase();
    if (!targetCode) return;

    // Search in demoAccounts
    const foundAcc = (demoAccounts ?? []).find(
      (a) =>
        a.cardCode.toUpperCase() === targetCode ||
        a.id.toUpperCase() === targetCode ||
        a.email.toLowerCase() === targetCode.toLowerCase(),
    );

    if (foundAcc) {
      setScannedPerson({
        firstName: foundAcc.firstName,
        lastName: foundAcc.lastName,
        email: foundAcc.email,
        departement: foundAcc.departement,
        niveau: foundAcc.niveau,
        schoolYear: foundAcc.schoolYear,
        membershipStatus: foundAcc.membershipStatus,
        contributionStatus: foundAcc.contributionStatus,
        memberSince: foundAcc.memberSince,
        cardCode: foundAcc.cardCode,
        tickets: foundAcc.tickets ?? [],
      });
      addAuditLog("SCAN_QR", `QR Code scanné avec succès : ${foundAcc.cardCode}`);
      return;
    }

    // Search in dossiers
    const foundDossier = safeDossiers.find(
      (d) =>
        d.id.toUpperCase() === targetCode || d.email.toLowerCase() === targetCode.toLowerCase(),
    );

    if (foundDossier) {
      setScannedPerson({
        firstName: foundDossier.firstName,
        lastName: foundDossier.lastName,
        email: foundDossier.email,
        departement: foundDossier.departement,
        niveau: foundDossier.niveau,
        schoolYear: "2026-2027",
        membershipStatus: foundDossier.status,
        contributionStatus: foundDossier.contributionStatus,
        memberSince: foundDossier.memberSince,
        cardCode: `AE2V-2026-USR-${foundDossier.id}`,
        tickets: [],
      });
      addAuditLog("SCAN_QR", `Dossier scanné : ${foundDossier.id}`);
      return;
    }

    alert(`Aucun membre ni dossier trouvé pour le code : ${targetCode}`);
  }

  // Open Email Composer
  function openEmailComposer(email: string) {
    setEmailDefaultRecipient(email);
    setEmailModalOpen(true);
  }

  return (
    <>
      <PageHero
        eyebrow="Gouvernance & Opérations"
        title="Bureau AE2V"
        intro={`Espace de gestion interne du bureau. Connecté en tant que ${account?.displayName ?? "Membre bureau"} (${account?.role ? roleLabels[account.role] : "Officier"}).`}
      />

      <section className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
        {/* Navigation Principale par Grandes Sections */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <button
            type="button"
            onClick={() => setMainSection("scanner")}
            className={`border-2 border-ae2v-black p-5 text-left transition-colors ${
              mainSection === "scanner"
                ? "bg-ae2v-red text-white"
                : "bg-card text-ae2v-black hover:bg-ae2v-black hover:text-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <QrCode className="size-6" />
              <span className="text-[0.65rem] font-bold uppercase tracking-widest border border-current px-2 py-0.5">
                Accès direct
              </span>
            </div>
            <h2 className="font-impact text-xl uppercase mt-3">Scanneur QR Code</h2>
            <p className="mt-1 text-xs opacity-80">Contrôle d'accès rapide & fiches membres</p>
          </button>

          <button
            type="button"
            onClick={() => setMainSection("demandes")}
            className={`border-2 border-ae2v-black p-5 text-left transition-colors ${
              mainSection === "demandes"
                ? "bg-ae2v-red text-white"
                : "bg-card text-ae2v-black hover:bg-ae2v-black hover:text-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <Mail className="size-6" />
              <span className="text-[0.65rem] font-bold uppercase tracking-widest border border-current px-2 py-0.5">
                {safeMessages.filter((m) => m.status === "NOUVEAU").length +
                  safeDossiers.filter((d) => d.status === "EN_ATTENTE").length}{" "}
                en attente
              </span>
            </div>
            <h2 className="font-impact text-xl uppercase mt-3">Demandes & Reçus</h2>
            <p className="mt-1 text-xs opacity-80">
              Messages, adhésions, cotisations & candidatures
            </p>
          </button>

          <button
            type="button"
            onClick={() => setMainSection("personnes")}
            className={`border-2 border-ae2v-black p-5 text-left transition-colors ${
              mainSection === "personnes"
                ? "bg-ae2v-red text-white"
                : "bg-card text-ae2v-black hover:bg-ae2v-black hover:text-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <Users className="size-6" />
              <span className="text-[0.65rem] font-bold uppercase tracking-widest border border-current px-2 py-0.5">
                {validatedMembers.length} membres
              </span>
            </div>
            <h2 className="font-impact text-xl uppercase mt-3">Personnes & Bureau</h2>
            <p className="mt-1 text-xs opacity-80">Membres validés & Équipe du bureau</p>
          </button>

          <button
            type="button"
            onClick={() => setMainSection("gestion")}
            className={`border-2 border-ae2v-black p-5 text-left transition-colors ${
              mainSection === "gestion"
                ? "bg-ae2v-red text-white"
                : "bg-card text-ae2v-black hover:bg-ae2v-black hover:text-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <Layers className="size-6" />
              <span className="text-[0.65rem] font-bold uppercase tracking-widest border border-current px-2 py-0.5">
                Catalogue
              </span>
            </div>
            <h2 className="font-impact text-xl uppercase mt-3">Gestion Globale</h2>
            <p className="mt-1 text-xs opacity-80">Événements, boutique, commandes & factures</p>
          </button>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* SECTION 1: SCANNEUR QR CODE                                       */}
        {/* ------------------------------------------------------------------ */}
        {mainSection === "scanner" && (
          <div className="space-y-6">
            <div className="border-2 border-ae2v-black bg-card p-6">
              <h2 className="font-impact text-2xl uppercase text-ae2v-black flex items-center gap-2">
                <QrCode className="size-6 text-ae2v-red" />
                Scanneur de Billet & Carte Membre
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Saisissez ou scannez un QR code (`AE2V-2026-TK-...`, `AE2V-2026-USR-...` ou e-mail
                étudiant).
              </p>

              <div className="mt-4 flex flex-wrap gap-3 max-w-xl">
                <input
                  type="text"
                  value={scanCodeInput}
                  onChange={(e) => setScanCodeInput(e.target.value)}
                  placeholder="Ex. AE2V-2026-TK-9X82 ou sacha.demo@etu.uvsq.fr"
                  className="flex-1 min-h-[44px] border-2 border-ae2v-black bg-ae2v-offwhite px-4 font-mono text-sm outline-none focus-visible:border-ae2v-red"
                />
                <Button onClick={() => handleExecuteScan()} size="lg">
                  Rechercher / Scanner
                </Button>
              </div>

              {/* Codes de démonstration rapides */}
              <div className="mt-4 pt-3 border-t border-ae2v-black/10 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-muted-foreground uppercase">
                  Exemples rapides :
                </span>
                {(demoAccounts ?? []).slice(0, 3).map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      setScanCodeInput(acc.cardCode);
                      handleExecuteScan(acc.cardCode);
                    }}
                    className="border border-ae2v-black/30 bg-ae2v-offwhite px-2 py-1 font-mono text-[0.7rem] hover:bg-ae2v-black hover:text-white"
                  >
                    {acc.cardCode} ({acc.firstName})
                  </button>
                ))}
              </div>
            </div>

            {/* Résultat du Scan */}
            {scannedPerson && (
              <div className="border-2 border-ae2v-black bg-ae2v-black p-6 text-white space-y-4">
                <div className="flex items-center justify-between border-b border-white/20 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="size-12 border-2 border-ae2v-green bg-ae2v-green text-ae2v-black font-impact text-xl flex items-center justify-center">
                      {scannedPerson.firstName[0]}
                      {scannedPerson.lastName[0]}
                    </div>
                    <div>
                      <h3 className="font-impact text-2xl uppercase text-white">
                        {scannedPerson.firstName} {scannedPerson.lastName}
                      </h3>
                      <p className="text-xs text-ae2v-green font-mono">{scannedPerson.cardCode}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() =>
                        setPayModalConfig({
                          customerName: `${scannedPerson.firstName} ${scannedPerson.lastName}`,
                          customerEmail: scannedPerson.email,
                          description: "Cotisation annuelle AE2V 2026-2027",
                          priceCents: 1200,
                          onSuccessPay: () => {
                            addAuditLog(
                              "COTISATION_VALIDEE",
                              `Cotisation validée pour ${scannedPerson.firstName}`,
                            );
                          },
                        })
                      }
                    >
                      <CreditCard className="size-4" /> Encaisser Cotisation
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setSelectedPerson(scannedPerson)}
                    >
                      Voir Fiche Complète
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 text-xs">
                  <div>
                    <span className="text-ae2v-offwhite/60 uppercase font-sans">
                      Statut Adhésion
                    </span>
                    <p className="font-bold text-white mt-0.5">{scannedPerson.membershipStatus}</p>
                  </div>
                  <div>
                    <span className="text-ae2v-offwhite/60 uppercase font-sans">
                      Statut Cotisation
                    </span>
                    <p className="font-bold text-ae2v-green mt-0.5">
                      {scannedPerson.contributionStatus}
                    </p>
                  </div>
                  <div>
                    <span className="text-ae2v-offwhite/60 uppercase font-sans">Formation</span>
                    <p className="font-bold text-white mt-0.5">
                      {scannedPerson.departement} · {scannedPerson.niveau}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* SECTION 2: DEMANDES (Messages, Adhésions, Cotisations, Candidatures) */}
        {/* ------------------------------------------------------------------ */}
        {mainSection === "demandes" && (
          <div className="space-y-6">
            {/* Sous-onglets Demandes */}
            <div className="flex flex-wrap gap-2 border-b-2 border-ae2v-black pb-3">
              <button
                type="button"
                onClick={() => setDemandesTab("messages")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 border-ae2v-black transition-colors ${
                  demandesTab === "messages"
                    ? "bg-ae2v-red text-white border-ae2v-red"
                    : "bg-card text-ae2v-black hover:bg-ae2v-black hover:text-white"
                }`}
              >
                Messages ({safeMessages.filter((m) => m.status === "NOUVEAU").length} nouveaux)
              </button>

              <button
                type="button"
                onClick={() => setDemandesTab("adhesions")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 border-ae2v-black transition-colors ${
                  demandesTab === "adhesions"
                    ? "bg-ae2v-red text-white border-ae2v-red"
                    : "bg-card text-ae2v-black hover:bg-ae2v-black hover:text-white"
                }`}
              >
                Adhésions ({safeDossiers.filter((d) => d.status === "EN_ATTENTE").length} en
                attente)
              </button>

              <button
                type="button"
                onClick={() => setDemandesTab("cotisations_attente")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 border-ae2v-black transition-colors ${
                  demandesTab === "cotisations_attente"
                    ? "bg-ae2v-red text-white border-ae2v-red"
                    : "bg-card text-ae2v-black hover:bg-ae2v-black hover:text-white"
                }`}
              >
                Cotisations en attente ({pendingContributions.length})
              </button>

              <button
                type="button"
                onClick={() => setDemandesTab("candidatures")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 border-ae2v-black transition-colors ${
                  demandesTab === "candidatures"
                    ? "bg-ae2v-red text-white border-ae2v-red"
                    : "bg-card text-ae2v-black hover:bg-ae2v-black hover:text-white"
                }`}
              >
                Candidatures Bureau ({safeCandidatures.length})
              </button>
            </div>

            {/* Demandes > Messages */}
            {demandesTab === "messages" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-impact text-xl uppercase">Boîte de Réception Messages</h3>
                  <Button size="sm" variant="default" onClick={() => openEmailComposer("")}>
                    <Send className="size-4" /> Rédiger un e-mail BDE
                  </Button>
                </div>

                <div className="space-y-3">
                  {safeMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="border-2 border-ae2v-black bg-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-impact text-lg">{msg.name}</span>
                          <span className="text-xs font-mono text-muted-foreground">
                            &lt;{msg.email}&gt;
                          </span>
                          <StatusPill
                            tone={
                              msg.status === "NOUVEAU"
                                ? "red"
                                : msg.status === "TRAITE"
                                  ? "green"
                                  : "neutral"
                            }
                          >
                            {contactMessageStatusLabels[msg.status] ?? msg.status}
                          </StatusPill>
                        </div>
                        <p className="text-xs font-bold text-ae2v-red">Sujet : {msg.sujet}</p>
                        <p className="text-xs text-muted-foreground">{msg.message}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          className="border-2 border-ae2v-black bg-ae2v-offwhite px-2 py-1 text-xs font-bold"
                          value={msg.status}
                          onChange={(e) => {
                            updateMessageStatus(msg.id, e.target.value as ContactMessageStatus);
                            addAuditLog(
                              "STATUT_MESSAGE",
                              `Message ${msg.id} passé à ${e.target.value}`,
                            );
                          }}
                        >
                          <option value="NOUVEAU">Nouveau</option>
                          <option value="LU">Lu</option>
                          <option value="TRAITE">Traité</option>
                        </select>
                        <Button
                          size="sm"
                          variant="black"
                          onClick={() => openEmailComposer(msg.email)}
                        >
                          <Mail className="size-3.5" /> Répondre
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Demandes > Adhésions */}
            {demandesTab === "adhesions" && (
              <div className="space-y-4">
                <DataTable
                  rows={safeDossiers}
                  columns={[
                    {
                      key: "id",
                      header: "ID",
                      render: (d) => <span className="font-mono font-bold text-xs">{d.id}</span>,
                    },
                    { key: "name", header: "Nom", render: (d) => `${d.firstName} ${d.lastName}` },
                    {
                      key: "email",
                      header: "E-mail",
                      render: (d) => <span className="text-xs font-mono">{d.email}</span>,
                    },
                    {
                      key: "formation",
                      header: "Formation",
                      render: (d) => `${d.departement} · ${d.niveau}`,
                    },
                    {
                      key: "status",
                      header: "Statut",
                      render: (d) => (
                        <StatusPill tone={membershipTone(d.status)}>
                          {membershipStatusLabels[d.status]}
                        </StatusPill>
                      ),
                    },
                    {
                      key: "actions",
                      header: "Actions",
                      render: (d) => (
                        <div className="flex gap-2">
                          {d.status === "EN_ATTENTE" && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                updateDossier(d.id, {
                                  status: "VALIDE",
                                  validatedAt: new Date().toLocaleDateString("fr-FR"),
                                });
                                addAuditLog("VALIDATION_ADHESION", `Dossier ${d.id} validé`);
                              }}
                            >
                              Valider
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openEmailComposer(d.email)}
                          >
                            Mail
                          </Button>
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            )}

            {/* Demandes > Cotisations en attente */}
            {demandesTab === "cotisations_attente" && (
              <div className="space-y-4">
                <DataTable
                  rows={pendingContributions}
                  columns={[
                    {
                      key: "id",
                      header: "ID",
                      render: (d) => <span className="font-mono font-bold text-xs">{d.id}</span>,
                    },
                    {
                      key: "name",
                      header: "Membre",
                      render: (d) => `${d.firstName} ${d.lastName}`,
                    },
                    {
                      key: "email",
                      header: "E-mail",
                      render: (d) => <span className="text-xs font-mono">{d.email}</span>,
                    },
                    {
                      key: "montant",
                      header: "Montant à Régler",
                      render: (d) => (
                        <span className="font-bold text-ae2v-red">
                          {formatCents(d.contributionCents)}
                        </span>
                      ),
                    },
                    {
                      key: "action",
                      header: "Encaisser & Facturer",
                      render: (d) => (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() =>
                            setPayModalConfig({
                              customerName: `${d.firstName} ${d.lastName}`,
                              customerEmail: d.email,
                              description: `Cotisation Annuelle Adhérent ${d.id}`,
                              priceCents: d.contributionCents,
                              onSuccessPay: () => {
                                updateDossier(d.id, { contributionStatus: "COTISANT" });
                                addAuditLog(
                                  "ENCAISSEMENT",
                                  `Cotisation ${formatCents(d.contributionCents)} encaissée pour ${d.id}`,
                                );
                              },
                            })
                          }
                        >
                          <CreditCard className="size-3.5" /> Encaisser Cotisation
                        </Button>
                      ),
                    },
                  ]}
                />
              </div>
            )}

            {/* Demandes > Candidatures */}
            {demandesTab === "candidatures" && (
              <div className="space-y-4">
                <DataTable
                  rows={safeCandidatures}
                  columns={[
                    {
                      key: "id",
                      header: "ID",
                      render: (c) => <span className="font-mono font-bold text-xs">{c.id}</span>,
                    },
                    { key: "name", header: "Candidat", render: (c) => c.name },
                    {
                      key: "pole",
                      header: "Pôle Visé",
                      render: (c) => <span className="font-bold text-ae2v-red">{c.pole}</span>,
                    },
                    {
                      key: "status",
                      header: "Statut",
                      render: (c) => (
                        <StatusPill
                          tone={
                            c.status === "ACCEPTEE"
                              ? "green"
                              : c.status === "ENTRETIEN"
                                ? "yellow"
                                : "neutral"
                          }
                        >
                          {candidatureStatusLabels[c.status]}
                        </StatusPill>
                      ),
                    },
                    {
                      key: "actions",
                      header: "Actions & Dossier",
                      render: (c) => (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="black"
                            onClick={() => {
                              setSelectedCandidature(c);
                              setCandidatureNoteInput(c.internalNotes ?? "");
                            }}
                          >
                            <Eye className="size-3.5" /> Voir Dossier Propre
                          </Button>
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* SECTION 3: PERSONNES (Membres validés & Équipe BDE)                */}
        {/* ------------------------------------------------------------------ */}
        {mainSection === "personnes" && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 border-b-2 border-ae2v-black pb-3">
              <button
                type="button"
                onClick={() => setPersonnesTab("membres_valides")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 border-ae2v-black transition-colors ${
                  personnesTab === "membres_valides"
                    ? "bg-ae2v-red text-white border-ae2v-red"
                    : "bg-card text-ae2v-black hover:bg-ae2v-black hover:text-white"
                }`}
              >
                Membres Validés ({validatedMembers.length})
              </button>

              <button
                type="button"
                onClick={() => setPersonnesTab("equipe_bde")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 border-ae2v-black transition-colors ${
                  personnesTab === "equipe_bde"
                    ? "bg-ae2v-red text-white border-ae2v-red"
                    : "bg-card text-ae2v-black hover:bg-ae2v-black hover:text-white"
                }`}
              >
                Équipe BDE & Pôles ({safeTeamMembers.length})
              </button>
            </div>

            {personnesTab === "membres_valides" && (
              <DataTable
                rows={validatedMembers}
                columns={[
                  {
                    key: "cardCode",
                    header: "Code QR",
                    render: (m) => <span className="font-mono text-xs">{m.cardCode}</span>,
                  },
                  { key: "name", header: "Nom", render: (m) => `${m.firstName} ${m.lastName}` },
                  {
                    key: "email",
                    header: "E-mail",
                    render: (m) => <span className="font-mono text-xs">{m.email}</span>,
                  },
                  {
                    key: "formation",
                    header: "Formation",
                    render: (m) => `${m.departement} · ${m.niveau}`,
                  },
                  {
                    key: "contrib",
                    header: "Cotisation",
                    render: (m) => (
                      <StatusPill tone={contributionTone(m.contributionStatus)}>
                        {m.contributionStatus}
                      </StatusPill>
                    ),
                  },
                  {
                    key: "action",
                    header: "Fiche",
                    render: (m) => (
                      <Button size="sm" variant="black" onClick={() => setSelectedPerson(m)}>
                        <Eye className="size-3.5" /> Fiche Personne
                      </Button>
                    ),
                  },
                ]}
              />
            )}

            {personnesTab === "equipe_bde" && (
              <div className="space-y-8">
                {/* Barre de Filtre par Pôle */}
                <div className="flex flex-wrap items-center justify-between border-2 border-ae2v-black bg-card p-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="size-4 text-ae2v-red" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Filtrer par Pôle :
                    </span>
                    <select
                      className="border-2 border-ae2v-black bg-ae2v-offwhite px-3 py-1 text-xs font-bold outline-none"
                      value={poleFilter}
                      onChange={(e) => setPoleFilter(e.target.value)}
                    >
                      <option value="TOUS">Tous les pôles ({safeTeamMembers.length})</option>
                      {teamPoles.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    size="sm"
                    variant="default"
                    onClick={() =>
                      setEditingMember({
                        id: `db-member-${Date.now()}`,
                        displayName: "",
                        roleTitle: "Membre de pôle",
                        isOfficer: false,
                        pole: "Événementiel",
                        mandate: "2026-2027",
                        photoUrl: null,
                        roleEmail: null,
                        personalAe2vEmail: "",
                        bio: "",
                        isDemo: false,
                        isPlaceholder: false,
                      })
                    }
                  >
                    <Plus className="size-4" /> Ajouter un Membre
                  </Button>
                </div>

                {/* Bureau Exécutif (Officiers) */}
                {(poleFilter === "TOUS" ||
                  poleFilter === "Direction" ||
                  poleFilter === "Trésorerie") && (
                  <div className="space-y-4">
                    <div className="border-b-2 border-ae2v-black pb-2 flex items-center justify-between">
                      <h3 className="font-impact text-xl uppercase text-ae2v-red flex items-center gap-2">
                        <Shield className="size-5" /> Bureau Exécutif (Officiers Dirigeants)
                      </h3>
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {executiveOfficers.length} membres
                      </span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {executiveOfficers
                        .filter((m) => poleFilter === "TOUS" || m.pole === poleFilter)
                        .map((m) => (
                          <div
                            key={m.id}
                            className="border-2 border-ae2v-black bg-card p-4 space-y-3 flex flex-col justify-between"
                          >
                            <div>
                              <span className="border-2 border-ae2v-black bg-ae2v-green px-2 py-0.5 text-[0.65rem] font-bold uppercase text-ae2v-black">
                                {m.roleTitle}
                              </span>
                              <h4 className="font-impact text-xl mt-2">{m.displayName}</h4>
                              <p className="text-xs font-mono text-ae2v-red mt-1">
                                {m.roleEmail ?? m.personalAe2vEmail}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">{m.bio}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="black"
                              className="w-full"
                              onClick={() => setEditingMember(m)}
                            >
                              <Edit className="size-3.5" /> Éditer Membre
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Membres des Pôles */}
                <div className="space-y-4">
                  <div className="border-b-2 border-ae2v-black pb-2 flex items-center justify-between">
                    <h3 className="font-impact text-xl uppercase text-ae2v-black flex items-center gap-2">
                      <Users className="size-5" /> Membres des Pôles
                    </h3>
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {poleMembers.length} membres
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {poleMembers
                      .filter((m) => poleFilter === "TOUS" || m.pole === poleFilter)
                      .map((m) => (
                        <div
                          key={m.id}
                          className="border-2 border-ae2v-black bg-card p-4 space-y-3 flex flex-col justify-between"
                        >
                          <div>
                            <span className="border border-ae2v-black bg-ae2v-offwhite px-2 py-0.5 text-[0.65rem] font-bold uppercase text-ae2v-black">
                              Pôle {m.pole}
                            </span>
                            <h4 className="font-impact text-lg mt-2">{m.displayName}</h4>
                            <p className="text-xs font-mono text-muted-foreground mt-1">
                              {m.personalAe2vEmail}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">{m.bio}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="w-full"
                            onClick={() => setEditingMember(m)}
                          >
                            <Edit className="size-3.5" /> Éditer / Réattribuer
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* SECTION 4: GESTION GLOBALE (Événements, Boutique, Commandes, Factures) */}
        {/* ------------------------------------------------------------------ */}
        {mainSection === "gestion" && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 border-b-2 border-ae2v-black pb-3">
              <button
                type="button"
                onClick={() => setGestionTab("evenements")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 border-ae2v-black transition-colors ${
                  gestionTab === "evenements"
                    ? "bg-ae2v-red text-white border-ae2v-red"
                    : "bg-card text-ae2v-black hover:bg-ae2v-black hover:text-white"
                }`}
              >
                Événements ({safeEvents.length})
              </button>

              <button
                type="button"
                onClick={() => setGestionTab("boutique")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 border-ae2v-black transition-colors ${
                  gestionTab === "boutique"
                    ? "bg-ae2v-red text-white border-ae2v-red"
                    : "bg-card text-ae2v-black hover:bg-ae2v-black hover:text-white"
                }`}
              >
                Boutique Produits ({safeProducts.length})
              </button>

              <button
                type="button"
                onClick={() => setGestionTab("commandes")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 border-ae2v-black transition-colors ${
                  gestionTab === "commandes"
                    ? "bg-ae2v-red text-white border-ae2v-red"
                    : "bg-card text-ae2v-black hover:bg-ae2v-black hover:text-white"
                }`}
              >
                Commandes & HelloAsso ({safeOrders.length})
              </button>

              <button
                type="button"
                onClick={() => setGestionTab("factures")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 border-ae2v-black transition-colors ${
                  gestionTab === "factures"
                    ? "bg-ae2v-red text-white border-ae2v-red"
                    : "bg-card text-ae2v-black hover:bg-ae2v-black hover:text-white"
                }`}
              >
                Factures & Reçus ({safeInvoices.length})
              </button>
            </div>

            {/* Gestion > Événements */}
            {gestionTab === "evenements" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-impact text-xl uppercase">Gestion des Événements</h3>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => {
                      setEditingEvent({
                        id: `evt-${Date.now()}`,
                        title: "",
                        kind: "Soirée",
                        date: "Jeudi 15 octobre 2026",
                        isoDate: "2026-10-15T21:00",
                        doors: "21h00 — 03h00",
                        place: "Le Hangar",
                        address: "Vélizy",
                        summary: "",
                        description: "",
                        image: "/assets/events/soiree-integration.jpg",
                        program: [],
                        access: "",
                        practical: [],
                        capacity: 200,
                        registered: 0,
                        registrationOpensAt: "01/10/2026",
                        registrationClosesAt: "14/10/2026",
                        status: "OUVERT",
                        waitlist: true,
                        tiers: [
                          {
                            id: "adh",
                            label: "Membre cotisant",
                            priceCents: 800,
                            audience: "adherent",
                            isMandatory: true,
                            disabled: false,
                          },
                          {
                            id: "non-cotisant",
                            label: "Membre non-cotisant",
                            priceCents: 1200,
                            audience: "membre",
                            isMandatory: true,
                            disabled: false,
                          },
                          {
                            id: "uvsq",
                            label: "Étudiant UVSQ non-membre",
                            priceCents: 1200,
                            audience: "membre",
                            isMandatory: true,
                            disabled: false,
                          },
                          {
                            id: "ext",
                            label: "Personne extérieure",
                            priceCents: 1500,
                            audience: "public",
                            isMandatory: true,
                            disabled: false,
                          },
                        ],
                        isDemo: true,
                      });
                      setEventFormOpen(true);
                    }}
                  >
                    <Plus className="size-4" /> Créer un Événement
                  </Button>
                </div>

                <DataTable
                  rows={safeEvents}
                  columns={[
                    {
                      key: "title",
                      header: "Titre",
                      render: (e) => <span className="font-bold">{e.title}</span>,
                    },
                    { key: "date", header: "Date", render: (e) => e.date },
                    {
                      key: "jauge",
                      header: "Inscrits / Jauge",
                      render: (e) => `${e.registered} / ${e.capacity}`,
                    },
                    {
                      key: "status",
                      header: "Statut",
                      render: (e) => (
                        <StatusPill
                          tone={
                            e.status === "OUVERT"
                              ? "green"
                              : e.status === "COMPLET"
                                ? "yellow"
                                : "neutral"
                          }
                        >
                          {eventStatusLabels[e.status]}
                        </StatusPill>
                      ),
                    },
                    {
                      key: "actions",
                      header: "Actions",
                      render: (e) => (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="black"
                            onClick={() => setSelectedAttendeesEvent(e)}
                          >
                            <Users className="size-3.5" /> Inscrits ({e.registered})
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setEditingEvent(e);
                              setEventFormOpen(true);
                            }}
                          >
                            <Edit className="size-3.5" /> Éditer
                          </Button>
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            )}

            {/* Gestion > Boutique */}
            {gestionTab === "boutique" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-impact text-xl uppercase">Catalogue Boutique AE2V</h3>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => {
                      setEditingProduct({
                        id: `prod-${Date.now()}`,
                        name: "",
                        slug: `prod-${Date.now()}`,
                        priceCents: 1500,
                        stock: 20,
                        image: "/assets/shop/tshirt.jpg",
                        description: "",
                        category: "Vêtements",
                        sizes: ["S", "M", "L", "XL"],
                        status: "DISPONIBLE",
                      });
                      setProductFormOpen(true);
                    }}
                  >
                    <Plus className="size-4" /> Ajouter un Produit
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {safeProducts.map((p) => (
                    <div
                      key={p.id}
                      className="border-2 border-ae2v-black bg-card p-4 space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="border border-ae2v-black bg-ae2v-offwhite px-2 py-0.5 text-[0.65rem] font-bold uppercase">
                            {p.category}
                          </span>
                          <span className="font-impact text-ae2v-red text-lg">
                            {formatPrice(p.priceCents)}
                          </span>
                        </div>
                        <h4 className="font-impact text-lg">{p.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                        <p className="text-xs font-bold mt-2">
                          Stock disponible : {p.stock} unités
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="black"
                        className="w-full"
                        onClick={() => {
                          setEditingProduct(p);
                          setProductFormOpen(true);
                        }}
                      >
                        <Edit className="size-3.5" /> Éditer Produit
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gestion > Commandes */}
            {gestionTab === "commandes" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-impact text-xl uppercase">Suivi des Commandes & HelloAsso</h3>
                </div>

                <DataTable
                  rows={safeOrders}
                  columns={[
                    {
                      key: "id",
                      header: "ID Commande",
                      render: (o) => <span className="font-mono font-bold text-xs">{o.id}</span>,
                    },
                    {
                      key: "customer",
                      header: "Client",
                      render: (o) => `${o.customerName} (${o.customerEmail})`,
                    },
                    {
                      key: "total",
                      header: "Total",
                      render: (o) => (
                        <span className="font-bold text-ae2v-red">{formatCents(o.totalCents)}</span>
                      ),
                    },
                    {
                      key: "status",
                      header: "Statut",
                      render: (o) => (
                        <StatusPill
                          tone={
                            o.status === "LIVREE"
                              ? "green"
                              : o.status === "PAYEE"
                                ? "yellow"
                                : "neutral"
                          }
                        >
                          {o.status}
                        </StatusPill>
                      ),
                    },
                    {
                      key: "notes",
                      header: "Remarques",
                      render: (o) => (
                        <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
                          {o.notes ?? "Aucune remarque"}
                        </span>
                      ),
                    },
                    {
                      key: "action",
                      header: "Détails & Suivi",
                      render: (o) => (
                        <Button
                          size="sm"
                          variant="black"
                          onClick={() => {
                            setSelectedOrder(o);
                            setOrderNoteInput(o.notes ?? "");
                          }}
                        >
                          <Eye className="size-3.5" /> Gérer
                        </Button>
                      ),
                    },
                  ]}
                />
              </div>
            )}

            {/* Gestion > Factures */}
            {gestionTab === "factures" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-impact text-xl uppercase">Historique Factures & Reçus</h3>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() =>
                      setPayModalConfig({
                        customerName: "Client Passage",
                        customerEmail: "client@etu.uvsq.fr",
                        description: "Vente en caisse BDE",
                        priceCents: 1000,
                      })
                    }
                  >
                    <Plus className="size-4" /> Éditer Reçu Manuel
                  </Button>
                </div>

                <DataTable
                  rows={safeInvoices}
                  columns={[
                    {
                      key: "id",
                      header: "N° Facture",
                      render: (inv) => (
                        <span className="font-mono font-bold text-xs">{inv.id}</span>
                      ),
                    },
                    { key: "date", header: "Date", render: (inv) => inv.date },
                    { key: "client", header: "Nom Client", render: (inv) => inv.customerName },
                    {
                      key: "methode",
                      header: "Règlement",
                      render: (inv) => (
                        <span className="border border-ae2v-black bg-ae2v-offwhite px-2 py-0.5 text-xs font-bold">
                          {inv.paymentMethod}
                        </span>
                      ),
                    },
                    {
                      key: "total",
                      header: "Montant",
                      render: (inv) => (
                        <span className="font-bold text-ae2v-green">
                          {formatCents(inv.totalCents)}
                        </span>
                      ),
                    },
                    {
                      key: "action",
                      header: "Imprimer / Reçu",
                      render: (inv) => (
                        <Button size="sm" variant="black" onClick={() => setSelectedInvoice(inv)}>
                          <Printer className="size-3.5" /> Reçu PDF
                        </Button>
                      ),
                    },
                  ]}
                />
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* MODAL 1: Édition Membre d'Équipe                                  */}
        {/* ------------------------------------------------------------------ */}
        {editingMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ae2v-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg border-2 border-ae2v-black bg-card shadow-2xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b-2 border-ae2v-black pb-3">
                <h3 className="font-impact text-2xl uppercase">Édition Fiche Membre</h3>
                <button type="button" onClick={() => setEditingMember(null)}>
                  <X className="size-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold uppercase mb-1">Nom Complet *</label>
                  <input
                    type="text"
                    value={editingMember.displayName}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, displayName: e.target.value })
                    }
                    className="w-full border-2 border-ae2v-black bg-ae2v-offwhite p-2"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block font-bold uppercase mb-1">Pôle *</label>
                    <select
                      value={editingMember.pole}
                      onChange={(e) =>
                        setEditingMember({ ...editingMember, pole: e.target.value as TeamPole })
                      }
                      className="w-full border-2 border-ae2v-black bg-ae2v-offwhite p-2 font-bold"
                    >
                      {teamPoles.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold uppercase mb-1">Rôle / Titre *</label>
                    <input
                      type="text"
                      value={editingMember.roleTitle}
                      onChange={(e) =>
                        setEditingMember({ ...editingMember, roleTitle: e.target.value })
                      }
                      className="w-full border-2 border-ae2v-black bg-ae2v-offwhite p-2"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isOfficerCheck"
                    checked={editingMember.isOfficer}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, isOfficer: e.target.checked })
                    }
                    className="size-4 accent-ae2v-red"
                  />
                  <label htmlFor="isOfficerCheck" className="font-bold uppercase text-ae2v-red">
                    Membre du Bureau Exécutif (Officier Dirigeant)
                  </label>
                </div>

                <div>
                  <label className="block font-bold uppercase mb-1">
                    E-mail Nominatif @ae2v.fr *
                  </label>
                  <input
                    type="email"
                    value={editingMember.personalAe2vEmail ?? ""}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, personalAe2vEmail: e.target.value })
                    }
                    className="w-full border-2 border-ae2v-black bg-ae2v-offwhite p-2 font-mono"
                    placeholder="prenom.nom@ae2v.fr"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase mb-1">Bio / Description</label>
                  <textarea
                    rows={3}
                    value={editingMember.bio ?? ""}
                    onChange={(e) => setEditingMember({ ...editingMember, bio: e.target.value })}
                    className="w-full border-2 border-ae2v-black bg-ae2v-offwhite p-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t-2 border-ae2v-black/10">
                <Button variant="secondary" onClick={() => setEditingMember(null)}>
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    const current = getDynamicTeamMembers();
                    const exists = current.some((m) => m.id === editingMember.id);
                    const updated = exists
                      ? current.map((m) => (m.id === editingMember.id ? editingMember : m))
                      : [editingMember, ...current];
                    saveDynamicTeamMembers(updated);
                    setTeamMembers(updated);
                    addAuditLog(
                      "EDITION_MEMBRE",
                      `Fiche membre mise à jour : ${editingMember.displayName}`,
                    );
                    setEditingMember(null);
                  }}
                >
                  Enregistrer
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* MODAL 2: Lecture Grand Format Candidature + Commentaires          */}
        {/* ------------------------------------------------------------------ */}
        {selectedCandidature && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ae2v-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl border-2 border-ae2v-black bg-card shadow-2xl p-6 space-y-6">
              <div className="flex justify-between items-center border-b-2 border-ae2v-black pb-3">
                <div>
                  <span className="border border-ae2v-black bg-ae2v-red px-2 py-0.5 text-xs font-bold text-white uppercase">
                    Candidature Pôle {selectedCandidature.pole}
                  </span>
                  <h3 className="font-impact text-2xl uppercase mt-1">
                    {selectedCandidature.name}
                  </h3>
                </div>
                <button type="button" onClick={() => setSelectedCandidature(null)}>
                  <X className="size-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid gap-2 sm:grid-cols-2 border-2 border-ae2v-black/10 bg-ae2v-offwhite p-3 font-mono">
                  <div>
                    <span className="text-muted-foreground uppercase font-sans">E-mail :</span>{" "}
                    {selectedCandidature.email}
                  </div>
                  <div>
                    <span className="text-muted-foreground uppercase font-sans">Déposé le :</span>{" "}
                    {selectedCandidature.submittedAt}
                  </div>
                  <div>
                    <span className="text-muted-foreground uppercase font-sans">
                      Disponibilité :
                    </span>{" "}
                    {selectedCandidature.availability}
                  </div>
                  <div>
                    <span className="text-muted-foreground uppercase font-sans">Statut :</span>{" "}
                    {selectedCandidature.status}
                  </div>
                </div>

                <div>
                  <h4 className="font-impact text-base uppercase text-ae2v-black mb-1">
                    Lettre de Motivation
                  </h4>
                  <div className="border-2 border-ae2v-black bg-ae2v-offwhite p-4 leading-relaxed text-sm">
                    {selectedCandidature.motivation}
                  </div>
                </div>

                <div>
                  <h4 className="font-impact text-base uppercase text-ae2v-red mb-1">
                    Note / Commentaire Interne
                  </h4>
                  <textarea
                    rows={3}
                    value={candidatureNoteInput}
                    onChange={(e) => setCandidatureNoteInput(e.target.value)}
                    placeholder="Ajoutez une remarque interne sans modifier le statut..."
                    className="w-full border-2 border-ae2v-black bg-ae2v-offwhite p-3 text-xs"
                  />
                  <Button
                    size="sm"
                    variant="black"
                    className="mt-2"
                    onClick={() => {
                      updateCandidature(selectedCandidature.id, {
                        internalNotes: candidatureNoteInput,
                      });
                      addAuditLog(
                        "NOTE_CANDIDATURE",
                        `Commentaire ajouté sur la candidature ${selectedCandidature.id}`,
                      );
                      alert("Commentaire sauvegardé avec succès !");
                    }}
                  >
                    Sauvegarder le commentaire
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t-2 border-ae2v-black/10">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => {
                      updateCandidature(selectedCandidature.id, { status: "ACCEPTEE" });
                      addAuditLog(
                        "VALIDATION_CANDIDATURE",
                        `Candidature ${selectedCandidature.id} acceptée`,
                      );
                      setSelectedCandidature(null);
                    }}
                  >
                    Accepter Candidature
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      updateCandidature(selectedCandidature.id, { status: "ENTRETIEN" });
                      setSelectedCandidature(null);
                    }}
                  >
                    Proposer Entretien
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="black"
                  onClick={() => openEmailComposer(selectedCandidature.email)}
                >
                  <Mail className="size-3.5" /> Écrire au candidat
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* MODAL 3: Détails & Remarques Commande                             */}
        {/* ------------------------------------------------------------------ */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ae2v-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl border-2 border-ae2v-black bg-card shadow-2xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b-2 border-ae2v-black pb-3">
                <h3 className="font-impact text-2xl uppercase">Commande {selectedOrder.id}</h3>
                <button type="button" onClick={() => setSelectedOrder(null)}>
                  <X className="size-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid gap-2 sm:grid-cols-2 border-2 border-ae2v-black/10 bg-ae2v-offwhite p-3 font-mono">
                  <div>
                    <span className="font-sans font-bold">Client :</span>{" "}
                    {selectedOrder.customerName}
                  </div>
                  <div>
                    <span className="font-sans font-bold">E-mail :</span>{" "}
                    {selectedOrder.customerEmail}
                  </div>
                  <div>
                    <span className="font-sans font-bold">Ref HelloAsso :</span>{" "}
                    {selectedOrder.helloAssoId ?? "N/A"}
                  </div>
                  <div>
                    <span className="font-sans font-bold">Montant Total :</span>{" "}
                    {formatCents(selectedOrder.totalCents)}
                  </div>
                </div>

                <div>
                  <h4 className="font-impact text-sm uppercase mb-1">Articles Commandés</h4>
                  <ul className="border-2 border-ae2v-black bg-card divide-y border-ae2v-black/10 p-2">
                    {selectedOrder.items.map((it, idx) => (
                      <li key={idx} className="flex justify-between py-1 text-xs">
                        <span>
                          {it.qty}x {it.productName}
                        </span>
                        <span className="font-bold">{formatCents(it.unitPriceCents * it.qty)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-impact text-sm uppercase mb-1">
                    Champ Libre / Remarques de Suivi
                  </h4>
                  <textarea
                    rows={3}
                    value={orderNoteInput}
                    onChange={(e) => setOrderNoteInput(e.target.value)}
                    className="w-full border-2 border-ae2v-black bg-ae2v-offwhite p-2 text-xs"
                  />
                </div>

                <div>
                  <h4 className="font-impact text-sm uppercase mb-1">Changer Statut Commande</h4>
                  <div className="flex flex-wrap gap-2">
                    {(["EN_ATTENTE", "PAYEE", "LIVREE", "ANNULEE"] as OrderStatus[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          updateOrder(selectedOrder.id, { status: st, notes: orderNoteInput });
                          setSelectedOrder({ ...selectedOrder, status: st, notes: orderNoteInput });
                          addAuditLog(
                            "STATUT_COMMANDE",
                            `Commande ${selectedOrder.id} passée à ${st}`,
                          );
                        }}
                        className={`px-3 py-1 text-xs font-bold uppercase border-2 border-ae2v-black ${
                          selectedOrder.status === st
                            ? "bg-ae2v-red text-white"
                            : "bg-ae2v-offwhite"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-ae2v-black/10">
                <Button variant="black" onClick={() => setSelectedOrder(null)}>
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* MODAL 4: Réçu PDF / Impression Facture                            */}
        {/* ------------------------------------------------------------------ */}
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ae2v-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg border-2 border-ae2v-black bg-card shadow-2xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b-2 border-ae2v-black pb-3">
                <h3 className="font-impact text-2xl uppercase text-ae2v-red">Facture BDE AE2V</h3>
                <button type="button" onClick={() => setSelectedInvoice(null)}>
                  <X className="size-5" />
                </button>
              </div>

              <div className="border-2 border-ae2v-black bg-ae2v-offwhite p-5 space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-ae2v-black/20 pb-2">
                  <span>FAC-NUM: {selectedInvoice.id}</span>
                  <span>DATE: {selectedInvoice.date}</span>
                </div>
                <div>
                  CLIENT: {selectedInvoice.customerName} (&lt;{selectedInvoice.customerEmail}&gt;)
                </div>
                <div>PAIEMENT: {selectedInvoice.paymentMethod}</div>

                <div className="pt-2">
                  <p className="font-bold font-sans uppercase mb-1">Détail du Reçu :</p>
                  {(selectedInvoice.lines ?? []).map((l, i) => (
                    <div key={i} className="flex justify-between">
                      <span>
                        {l.qty}x {l.description}
                      </span>
                      <span>{formatCents(l.totalCents)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-ae2v-black/20 flex justify-between font-bold text-sm text-ae2v-red">
                  <span>TOTAL PAYÉ:</span>
                  <span>{formatCents(selectedInvoice.totalCents)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button variant="black" onClick={() => window.print()}>
                  <Printer className="size-4" /> Imprimer Reçu (PDF)
                </Button>
                <Button variant="secondary" onClick={() => setSelectedInvoice(null)}>
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modaux d'Encaissement & E-mail */}
        {payModalConfig && (
          <PaymentModal
            isOpen={Boolean(payModalConfig)}
            onClose={() => setPayModalConfig(null)}
            customerName={payModalConfig.customerName}
            customerEmail={payModalConfig.customerEmail}
            description={payModalConfig.description}
            priceCents={payModalConfig.priceCents}
            onSuccessPay={payModalConfig.onSuccessPay}
          />
        )}

        {selectedPerson && (
          <PersonSheetModal
            isOpen={Boolean(selectedPerson)}
            onClose={() => setSelectedPerson(null)}
            person={selectedPerson}
          />
        )}

        <EmailComposerModal
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          defaultRecipient={emailDefaultRecipient}
        />
      </section>
    </>
  );
}
