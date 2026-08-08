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

  // Dynamic Stores
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(getDynamicTeamMembers());
  const [events, setEvents] = useState<Ae2vEvent[]>(getDynamicEvents());
  const [products, setProducts] = useState<ShopProduct[]>(getDynamicShopProducts());
  const [invoices, setInvoices] = useState<Invoice[]>(getDynamicInvoices());
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(getDynamicAuditLogs());

  // Person Sheet, Payment & Global Email Modal State
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

  useEffect(() => {
    const teamHandler = () => setTeamMembers(getDynamicTeamMembers());
    const eventHandler = () => setEvents(getDynamicEvents());
    const shopHandler = () => setProducts(getDynamicShopProducts());
    const invoiceHandler = () => setInvoices(getDynamicInvoices());
    const auditHandler = () => setAuditLogs(getDynamicAuditLogs());

    window.addEventListener("ae2v_team_changed", teamHandler);
    window.addEventListener("ae2v_events_changed", eventHandler);
    window.addEventListener("ae2v_products_changed", shopHandler);
    window.addEventListener("ae2v_invoices_changed", invoiceHandler);
    window.addEventListener("ae2v_audit_changed", auditHandler);

    return () => {
      window.removeEventListener("ae2v_team_changed", teamHandler);
      window.removeEventListener("ae2v_events_changed", eventHandler);
      window.removeEventListener("ae2v_products_changed", shopHandler);
      window.removeEventListener("ae2v_invoices_changed", invoiceHandler);
      window.removeEventListener("ae2v_audit_changed", auditHandler);
    };
  }, []);

  // Dossiers de demandes (en attente / à corriger)
  const requests = useMemo(
    () =>
      dossiers.filter(
        (d) =>
          (d.status === "EN_ATTENTE" || d.status === "A_CORRIGER" || d.status === "REFUSE") &&
          (membershipFilter === "TOUS" || d.status === membershipFilter),
      ),
    [dossiers, membershipFilter],
  );

  // Membres validés
  const members = useMemo(
    () =>
      dossiers.filter(
        (d) =>
          d.status === "VALIDE" &&
          (contribFilter === "TOUS" || d.contributionStatus === contribFilter),
      ),
    [dossiers, contribFilter],
  );

  // Cotisations en attente
  const pendingContributions = useMemo(
    () => dossiers.filter((d) => d.status === "VALIDE" && d.contributionStatus === "EN_ATTENTE"),
    [dossiers],
  );

  const visibleMessages = useMemo(
    () => messages.filter((m) => msgFilter === "TOUS" || m.status === msgFilter),
    [messages, msgFilter],
  );

  const pendingCount = dossiers.filter((d) => d.status === "EN_ATTENTE").length;
  const toFixCount = dossiers.filter((d) => d.status === "A_CORRIGER").length;
  const candPending = candidatures.filter((c) => c.status === "EN_ATTENTE").length;
  const msgNew = messages.filter((m) => m.status === "NOUVEAU").length;

  function openPersonModal(dossier: Dossier) {
    const matchedAccount = demoAccounts.find((a) => a.email === dossier.email);
    setSelectedPerson({
      id: dossier.id,
      firstName: dossier.firstName,
      lastName: dossier.lastName,
      email: dossier.email,
      departement: dossier.departement,
      niveau: dossier.niveau,
      status: dossier.status,
      contributionStatus: dossier.contributionStatus,
      cardCode: matchedAccount?.cardCode || generateRandom2026Code("USR"),
      tickets: matchedAccount?.tickets || [],
      orders: matchedAccount?.orders || [],
    });
  }

  function handleOpenPayModalForContribution(dossier: Dossier) {
    setPayModalConfig({
      customerName: `${dossier.firstName} ${dossier.lastName}`,
      customerEmail: dossier.email,
      description: "Cotisation Annuelle Adhérent BDE AE2V 2026-2027",
      priceCents: 1200,
      onSuccessPay: () => {
        updateDossier(dossier.id, { contributionStatus: "PAYEE" });
      },
    });
  }

  return (
    <>
      <PageHero
        eyebrow={roleLabels[account.role]}
        title="Bureau BDE AE2V"
        intro={
          can("dossiers:validate")
            ? "Outil d'administration unifié : scanner QR 2026, adhésions, membres, billetterie, boutique et facturation."
            : "Droits limités : consultation et correction des demandes."
        }
      />

      {/* NAV PRINCIPALE : 4 SECTIONS STRICTES */}
      <div className="border-y-2 border-ae2v-black bg-ae2v-black p-2 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Button
              size="lg"
              variant={mainSection === "scanner" ? "default" : "black"}
              className={mainSection === "scanner" ? "bg-ae2v-red text-white" : ""}
              onClick={() => setMainSection("scanner")}
            >
              <QrCode className="size-5" />
              1. SCANNER QRCODE
            </Button>
            <Button
              size="lg"
              variant={mainSection === "demandes" ? "default" : "black"}
              className={mainSection === "demandes" ? "bg-ae2v-red text-white" : ""}
              onClick={() => setMainSection("demandes")}
            >
              <Mail className="size-5" />
              2. DEMANDES{" "}
              {pendingCount + toFixCount + msgNew > 0 && `(${pendingCount + toFixCount + msgNew})`}
            </Button>
            <Button
              size="lg"
              variant={mainSection === "personnes" ? "default" : "black"}
              className={mainSection === "personnes" ? "bg-ae2v-red text-white" : ""}
              onClick={() => setMainSection("personnes")}
            >
              <Users className="size-5" />
              3. PERSONNES ({members.length})
            </Button>
            <Button
              size="lg"
              variant={mainSection === "gestion" ? "default" : "black"}
              className={mainSection === "gestion" ? "bg-ae2v-red text-white" : ""}
              onClick={() => setMainSection("gestion")}
            >
              <Layers className="size-5" />
              4. GESTION
            </Button>
          </div>
        </div>
      </div>

      {/* SECTION 1 : SCANNER QRCODE */}
      {mainSection === "scanner" && (
        <Section
          number={1}
          ghost="SCANNER"
          title="Scanner & Contrôle QR Code 2026"
          intro="Scannez un code billet ou membre pour afficher en priorité ses paiements et cotisations en attente avec encaissement direct."
        >
          <TicketScanner
            onOpenPersonSheet={(person) => setSelectedPerson(person)}
            onOpenPaymentModal={(config) => setPayModalConfig(config)}
          />
        </Section>
      )}

      {/* SECTION 2 : DEMANDES (DÉFAUT) */}
      {mainSection === "demandes" && (
        <>
          <TabsNav
            tone="red"
            label="Sous-sections des demandes"
            idPrefix="demandes"
            active={demandesTab}
            onChange={(t) => setDemandesTab(t as typeof demandesTab)}
            tabs={[
              { id: "messages", label: "Messages (Formulaire contact)", badge: msgNew },
              { id: "adhesions", label: "Adhésions", badge: pendingCount + toFixCount },
              {
                id: "cotisations_attente",
                label: "Cotisations en attente",
                badge: pendingContributions.length,
              },
              { id: "candidatures", label: "Candidatures bureau", badge: candPending },
            ]}
          />

          {/* Sub-tab 1: Messages (Défaut) */}
          <TabPanel id="messages" idPrefix="demandes" active={demandesTab}>
            <Section
              number={2}
              ghost="MESSAGES"
              title="Boîte de réception des messages"
              intro="Consultez les messages reçus et répondez directement par e-mail au sein de l'application."
            >
              <div className="mb-4">
                <TableFilter
                  id="filter-messages"
                  label="Statut"
                  value={msgFilter}
                  onChange={setMsgFilter}
                  options={[
                    { value: "TOUS", label: "Tous" },
                    { value: "NOUVEAU", label: "Nouveau" },
                    { value: "LU", label: "Lu" },
                    { value: "TRAITE", label: "Traité" },
                  ]}
                />
              </div>

              {visibleMessages.length === 0 ? (
                <EmptyState label="Aucun message" detail="Aucun message ne correspond au filtre." />
              ) : (
                <ul className="space-y-3">
                  {visibleMessages.map((msg) => (
                    <MessageCard key={msg.id} msg={msg} onUpdateStatus={updateMessageStatus} />
                  ))}
                </ul>
              )}
            </Section>
          </TabPanel>

          {/* Sub-tab 2: Adhésions */}
          <TabPanel id="adhesions" idPrefix="demandes" active={demandesTab}>
            <Section
              number={2}
              ghost="ADHÉSIONS"
              title="Demandes d'adhésion"
              intro="Validez ou demandez des corrections sur les dossiers étudiants soumis."
            >
              <DataTable
                data={requests}
                columns={[
                  {
                    key: "id",
                    label: "N° Dossier",
                    render: (d) => <span className="font-mono font-bold text-xs">{d.id}</span>,
                  },
                  {
                    key: "name",
                    label: "Étudiant",
                    render: (d) => (
                      <button
                        onClick={() => openPersonModal(d)}
                        className="font-bold underline text-left"
                      >
                        {d.firstName} {d.lastName}
                      </button>
                    ),
                  },
                  {
                    key: "email",
                    label: "E-mail",
                    render: (d) => <span className="text-xs break-all">{d.email}</span>,
                  },
                  {
                    key: "departement",
                    label: "Filière",
                    render: (d) => `${d.departement} (${d.niveau})`,
                  },
                  {
                    key: "status",
                    label: "Statut",
                    render: (d) => (
                      <StatusPill tone={membershipTone(d.status)}>
                        {membershipStatusLabels[d.status]}
                      </StatusPill>
                    ),
                  },
                  {
                    key: "actions",
                    label: "Action",
                    render: (d) => (
                      <Button size="sm" variant="black" onClick={() => openPersonModal(d)}>
                        Examiner la fiche
                      </Button>
                    ),
                  },
                ]}
              />
            </Section>
          </TabPanel>

          {/* Sub-tab 3: Cotisations en attente */}
          <TabPanel id="cotisations_attente" idPrefix="demandes" active={demandesTab}>
            <Section
              number={2}
              ghost="COTISATIONS"
              title="Cotisations en attente de règlement"
              intro="Encaissez les cotisations BDE (12 €) avec sélection du mode de paiement et émission de facture."
            >
              {pendingContributions.length === 0 ? (
                <EmptyState
                  label="Toutes les cotisations sont à jour"
                  detail="Aucun membre en attente de paiement."
                />
              ) : (
                <DataTable
                  data={pendingContributions}
                  columns={[
                    {
                      key: "id",
                      label: "Dossier",
                      render: (d) => <span className="font-mono text-xs">{d.id}</span>,
                    },
                    {
                      key: "name",
                      label: "Nom & Prénom",
                      render: (d) => (
                        <button
                          onClick={() => openPersonModal(d)}
                          className="font-bold underline text-left"
                        >
                          {d.firstName} {d.lastName}
                        </button>
                      ),
                    },
                    { key: "email", label: "E-mail", render: (d) => d.email },
                    { key: "filiere", label: "Filière", render: (d) => d.departement },
                    {
                      key: "action",
                      label: "Encaissement",
                      render: (d) => (
                        <Button size="sm" onClick={() => handleOpenPayModalForContribution(d)}>
                          <CreditCard className="size-3.5" />
                          Encaisser Cotisation (12 €)
                        </Button>
                      ),
                    },
                  ]}
                />
              )}
            </Section>
          </TabPanel>

          {/* Sub-tab 4: Candidatures Bureau */}
          <TabPanel id="candidatures" idPrefix="demandes" active={demandesTab}>
            <Section
              number={2}
              ghost="RECRUTEMENT"
              title="Candidatures pour intégrer le bureau BDE"
              intro="Étudiants ayant postulé pour s'investir dans l'un des 5 pôles de l'association."
            >
              <DataTable
                data={candidatures}
                columns={[
                  {
                    key: "candidateName",
                    label: "Candidat",
                    render: (c) => <span className="font-bold">{c.candidateName}</span>,
                  },
                  { key: "email", label: "Contact", render: (c) => c.email },
                  {
                    key: "pole",
                    label: "Pôle demandé",
                    render: (c) => <StatusPill tone="neutral">{c.pole}</StatusPill>,
                  },
                  {
                    key: "motivation",
                    label: "Motivation",
                    render: (c) => <p className="text-xs max-w-xs truncate">{c.motivation}</p>,
                  },
                  {
                    key: "status",
                    label: "Statut",
                    render: (c) => candidatureStatusLabels[c.status],
                  },
                  {
                    key: "actions",
                    label: "Décision",
                    render: (c) => (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => updateCandidature(c.id, "ACCEPTEE")}
                          disabled={c.status === "ACCEPTEE"}
                        >
                          Accepter
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => updateCandidature(c.id, "REFUSEE")}
                          disabled={c.status === "REFUSEE"}
                        >
                          Refuser
                        </Button>
                      </div>
                    ),
                  },
                ]}
              />
            </Section>
          </TabPanel>
        </>
      )}

      {/* SECTION 3 : PERSONNES */}
      {mainSection === "personnes" && (
        <>
          <TabsNav
            tone="red"
            label="Sous-sections personnes"
            idPrefix="personnes"
            active={personnesTab}
            onChange={(t) => setPersonnesTab(t as typeof personnesTab)}
            tabs={[
              { id: "membres_valides", label: "Membres validés", badge: members.length },
              { id: "equipe_bde", label: "Équipe BDE (Pôles & Rôles)", badge: teamMembers.length },
            ]}
          />

          {/* Sub-tab 1: Membres validés */}
          <TabPanel id="membres_valides" idPrefix="personnes" active={personnesTab}>
            <Section
              number={3}
              ghost="ANNUAIRE"
              title="Annuaire des Membres Validés"
              intro="Données verrouillées par sécurité. Cliquez sur un membre pour ouvrir sa fiche unifiée."
            >
              <DataTable
                data={members}
                columns={[
                  {
                    key: "id",
                    label: "N° Carte",
                    render: (d) => <span className="font-mono text-xs">AE2V-2026-USR-{d.id}</span>,
                  },
                  {
                    key: "name",
                    label: "Nom & Prénom",
                    render: (d) => (
                      <button
                        onClick={() => openPersonModal(d)}
                        className="font-bold underline text-left"
                      >
                        {d.firstName} {d.lastName}
                      </button>
                    ),
                  },
                  { key: "email", label: "E-mail", render: (d) => d.email },
                  {
                    key: "departement",
                    label: "Filière",
                    render: (d) => `${d.departement} (${d.niveau})`,
                  },
                  {
                    key: "cotisation",
                    label: "Cotisation",
                    render: (d) => (
                      <StatusPill tone={d.contributionStatus === "PAYEE" ? "green" : "neutral"}>
                        {d.contributionStatus === "PAYEE" ? "PAYÉE (12 €)" : "EN ATTENTE"}
                      </StatusPill>
                    ),
                  },
                  {
                    key: "fiche",
                    label: "Profil",
                    render: (d) => (
                      <Button size="sm" variant="black" onClick={() => openPersonModal(d)}>
                        Voir profil unifié
                      </Button>
                    ),
                  },
                ]}
              />
            </Section>
          </TabPanel>

          {/* Sub-tab 2: Équipe BDE */}
          <TabPanel id="equipe_bde" idPrefix="personnes" active={personnesTab}>
            <Section
              number={3}
              ghost="ÉQUIPE"
              title="Gestion de l'Équipe BDE"
              intro="Définissez les rôles, pôles et adresses de fonction @ae2v.fr affichés sur /bde/equipe."
            >
              <TeamManager teamMembers={teamMembers} />
            </Section>
          </TabPanel>
        </>
      )}

      {/* SECTION 4 : GESTION */}
      {mainSection === "gestion" && (
        <>
          <TabsNav
            tone="red"
            label="Sous-sections gestion"
            idPrefix="gestion"
            active={gestionTab}
            onChange={(t) => setGestionTab(t as typeof gestionTab)}
            tabs={[
              { id: "evenements", label: "Événements & Billetterie", badge: events.length },
              { id: "boutique", label: "Boutique & Catalogue", badge: products.length },
              { id: "commandes", label: "Commandes HelloAsso" },
              { id: "factures", label: "Factures & Reçus", badge: invoices.length },
            ]}
          />

          {/* Sub-tab 1: Événements */}
          <TabPanel id="evenements" idPrefix="gestion" active={gestionTab}>
            <Section
              number={4}
              ghost="AGENDA"
              title="Gestion Avancée des Événements"
              intro="Statuts complets (Brouillon, Ouvert, Complet, Terminé -> Republier), duplication, tarifs dynamiques & liste d'inscrits."
            >
              <EventManager
                events={events}
                onOpenPayModal={(config) => setPayModalConfig(config)}
              />
            </Section>
          </TabPanel>

          {/* Sub-tab 2: Boutique */}
          <TabPanel id="boutique" idPrefix="gestion" active={gestionTab}>
            <Section
              number={4}
              ghost="CATALOGUE"
              title="Gestion de la Boutique & produits"
              intro="Ajout/suppression et personnalisation d'articles avec drop et découpe d'images (1:1)."
            >
              <ShopManager products={products} />
            </Section>
          </TabPanel>

          {/* Sub-tab 3: Commandes HelloAsso */}
          <TabPanel id="commandes" idPrefix="gestion" active={gestionTab}>
            <Section
              number={4}
              ghost="COMMANDES"
              title="Commandes Boutique & HelloAsso"
              intro="Enregistrez une commande HelloAsso, associez-la à un membre et gérez les statuts de retrait."
            >
              <OrdersManager dossiers={dossiers} />
            </Section>
          </TabPanel>

          {/* Sub-tab 4: Factures & Reçus */}
          <TabPanel id="factures" idPrefix="gestion" active={gestionTab}>
            <Section
              number={4}
              ghost="COMPTA"
              title="Registre des Factures & Reçus de Règlement"
              intro="Historique de tous les encaissements effectués par l'association avec mode de paiement et détail des lignes."
            >
              <InvoicesManager invoices={invoices} />
            </Section>
          </TabPanel>
        </>
      )}

      {/* Modals Transversales */}
      <PersonSheetModal
        isOpen={!!selectedPerson}
        onClose={() => setSelectedPerson(null)}
        person={selectedPerson}
        onUpdateContribution={(id) => {
          const dossier = dossiers.find((d) => d.id === id);
          if (dossier) handleOpenPayModalForContribution(dossier);
        }}
      />

      <EmailComposerModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        defaultRecipient={emailDefaultRecipient}
      />

      {payModalConfig && (
        <PaymentModal
          isOpen={!!payModalConfig}
          onClose={() => setPayModalConfig(null)}
          customerName={payModalConfig.customerName}
          customerEmail={payModalConfig.customerEmail}
          defaultDescription={payModalConfig.description}
          defaultPriceCents={payModalConfig.priceCents}
          onSuccessPay={(inv) => {
            if (payModalConfig.onSuccessPay) payModalConfig.onSuccessPay(inv);
          }}
        />
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* TicketScanner Component with Priority Pending Payments                     */
/* -------------------------------------------------------------------------- */

function TicketScanner({
  onOpenPersonSheet,
  onOpenPaymentModal,
}: {
  onOpenPersonSheet: (p: UnifiedPerson) => void;
  onOpenPaymentModal: (config: {
    customerName: string;
    customerEmail: string;
    description: string;
    priceCents: number;
    onSuccessPay?: (inv: Invoice) => void;
  }) => void;
}) {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<{
    type: "ticket" | "card";
    owner: string;
    email: string;
    details: string;
    status: string;
    valid: boolean;
    matchedDossier?: Dossier;
    ticketObj?: DemoTicket;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { dossiers } = useDemoSession();

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    const cleaned = code.trim().toUpperCase();
    if (!cleaned) return;

    let foundTicket: DemoTicket | null = null;
    let ticketOwner = "";
    let matchedEmail = "";

    for (const acc of demoAccounts) {
      const matchTk = acc.tickets.find((t) => t.code.toUpperCase() === cleaned);
      if (matchTk) {
        foundTicket = matchTk;
        ticketOwner = `${acc.firstName} ${acc.lastName}`;
        matchedEmail = acc.email;
        break;
      }
      if (acc.cardCode.toUpperCase() === cleaned) {
        const dossier = dossiers.find((d) => d.email === acc.email);
        setResult({
          type: "card",
          owner: `${acc.firstName} ${acc.lastName}`,
          email: acc.email,
          details: `Carte de membre · Filière ${acc.departement} (${acc.niveau})`,
          status: acc.membershipStatus === "VALIDE" ? "Valide (Adhérent cotisant)" : "En attente",
          valid: acc.membershipStatus === "VALIDE",
          matchedDossier: dossier,
        });
        addAuditLog("SCAN_CARTE", `Carte membre scannée: ${acc.cardCode}`);
        return;
      }
    }

    if (foundTicket) {
      const dossier = dossiers.find((d) => d.email === matchedEmail);
      setResult({
        type: "ticket",
        owner: ticketOwner,
        email: matchedEmail,
        details: `${foundTicket.eventTitle} · Tarif: ${foundTicket.tier}`,
        status: foundTicket.status === "valide" ? "VALIDE (Prêt pour contrôle)" : "DÉJÀ UTILISÉ",
        valid: foundTicket.status === "valide",
        matchedDossier: dossier,
        ticketObj: foundTicket,
      });
      addAuditLog("SCAN_BILLET", `Billet scanné: ${foundTicket.code} (${foundTicket.eventTitle})`);
      return;
    }

    setError("Code 2026 invalide ou introuvable dans la base.");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <form onSubmit={handleVerify} className="border-2 border-ae2v-black bg-card p-6">
        <label htmlFor="scanner-input" className="block font-impact text-lg uppercase">
          Saisir ou scanner un QR Code 2026
        </label>
        <p className="mt-1 text-xs text-muted-foreground">
          Format imprévisible ex : AE2V-2026-TK-X7K9P2M4 ou AE2V-2026-USR-3R8W1L9V
        </p>
        <div className="mt-4 flex gap-2">
          <input
            id="scanner-input"
            className="min-h-[44px] flex-1 border-2 border-ae2v-black/25 bg-ae2v-offwhite px-3 font-mono text-sm uppercase outline-none focus:border-ae2v-red"
            placeholder="AE2V-2026-TK-XXXXXXXX"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button type="submit">
            <QrCode className="size-4" />
            Vérifier
          </Button>
        </div>
      </form>

      {error && (
        <div className="flex items-center gap-3 border-2 border-ae2v-red bg-ae2v-red/10 p-4 text-ae2v-red">
          <XCircle className="size-5 shrink-0" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {result && (
        <div
          className={`border-2 p-6 space-y-4 ${
            result.valid ? "border-ae2v-green bg-ae2v-green/10" : "border-ae2v-red bg-ae2v-red/10"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-ae2v-black">
              {result.type === "ticket" ? "Billet Événement" : "Carte Membre"}
            </span>
            <StatusPill tone={result.valid ? "green" : "red"}>{result.status}</StatusPill>
          </div>

          <div>
            <h3 className="font-impact text-2xl uppercase text-ae2v-black">{result.owner}</h3>
            <p className="text-xs text-muted-foreground">{result.email}</p>
            <p className="mt-1 text-sm font-bold text-ae2v-black/80">{result.details}</p>
          </div>

          {/* Affichage Prioritaire des Paiements en Attente */}
          {result.matchedDossier && result.matchedDossier.contributionStatus === "EN_ATTENTE" && (
            <div className="border-2 border-ae2v-red bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase text-ae2v-red flex items-center gap-1">
                  ⚠️ Cotisation BDE en Attente de Règlement
                </p>
                <span className="font-impact text-base text-ae2v-black">12,00 €</span>
              </div>
              <Button
                size="sm"
                className="w-full"
                onClick={() => {
                  onOpenPaymentModal({
                    customerName: result.owner,
                    customerEmail: result.email,
                    description: "Cotisation Annuelle Adhérent BDE AE2V 2026-2027",
                    priceCents: 1200,
                  });
                }}
              >
                <CreditCard className="size-4" />
                Encaisser Cotisation & Générer Facture (12 €)
              </Button>
            </div>
          )}

          <div className="border-t-2 border-ae2v-black/20 pt-4 flex flex-wrap gap-2">
            {result.valid && result.type === "ticket" && (
              <Button
                variant="black"
                onClick={() => {
                  if (result.ticketObj) {
                    result.ticketObj.status = "utilise";
                    setResult({ ...result, status: "DÉJÀ UTILISÉ", valid: false });
                    addAuditLog(
                      "VALIDER_ENTREE",
                      `Entrée validée pour le billet ${result.ticketObj.code}`,
                    );
                  }
                }}
              >
                <CheckCircle2 className="size-4" />
                Valider l'entrée (Composter)
              </Button>
            )}
            {result.matchedDossier && (
              <Button
                variant="secondary"
                onClick={() => {
                  onOpenPersonSheet({
                    id: result.matchedDossier!.id,
                    firstName: result.matchedDossier!.firstName,
                    lastName: result.matchedDossier!.lastName,
                    email: result.matchedDossier!.email,
                    departement: result.matchedDossier!.departement,
                    niveau: result.matchedDossier!.niveau,
                    status: result.matchedDossier!.status,
                    contributionStatus: result.matchedDossier!.contributionStatus,
                  });
                }}
              >
                <UserCheck className="size-4" />
                Voir la fiche complète
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* MessageCard Component with In-App Mail Reply                               */
/* -------------------------------------------------------------------------- */

const inputClass =
  "min-h-[44px] w-full border-2 border-ae2v-black/25 bg-ae2v-offwhite px-3 py-2 text-sm text-ae2v-black outline-none focus-visible:border-ae2v-red focus-visible:ring-2 focus-visible:ring-ae2v-red/40";

function MessageCard({
  msg,
  onUpdateStatus,
}: {
  msg: ContactMessage;
  onUpdateStatus: (id: string, status: ContactMessageStatus) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [replying, setReplying] = useState(false);
  const [subject, setSubject] = useState(`Re: [${msg.sujet}]`);
  const [body, setBody] = useState(
    `Bonjour ${msg.name},\n\nMerci pour ton message. \n\nCordialement,\nLe bureau AE2V`,
  );
  const [sending, setSending] = useState(false);
  const [sentNotice, setSentNotice] = useState<string | null>(null);

  const senderEmail = getSiteConfig().smtp.senderEmail || "contact@ae2v.fr";

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;

    setSending(true);
    try {
      const res = await sendEmailFromBureau(msg.email, subject.trim(), body.trim());
      setSending(false);
      setSentNotice(`✓ E-mail envoyé avec succès à ${msg.email} à ${res.timestamp}`);
      onUpdateStatus(msg.id, "TRAITE");
      addAuditLog("REPONSE_EMAIL", `Réponse envoyée à ${msg.email} (${subject})`);
      setReplying(false);
    } catch {
      setSending(false);
      setSentNotice("✕ Erreur d'envoi e-mail.");
    }
  }

  return (
    <li
      className={`border-2 p-4 ${msg.status === "NOUVEAU" ? "border-ae2v-red bg-ae2v-red/5" : "border-ae2v-black/30 bg-card"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold">{msg.name}</p>
            <StatusPill tone={msg.status === "NOUVEAU" ? "red" : "neutral"}>
              {contactMessageStatusLabels[msg.status]}
            </StatusPill>
          </div>
          <p className="text-xs text-muted-foreground break-all">{msg.email}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {msg.sujet} · {msg.sentAt}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => setExpanded((v) => !v)}>
            <Eye className="size-3.5" />
            {expanded ? "Réduire" : "Lire"}
          </Button>
          <Button
            size="sm"
            variant="black"
            onClick={() => {
              setExpanded(true);
              setReplying((v) => !v);
            }}
          >
            <Send className="size-3.5" />
            Répondre dans l'app
          </Button>
          {msg.status !== "TRAITE" && (
            <Button size="sm" onClick={() => onUpdateStatus(msg.id, "TRAITE")}>
              <CheckCheck className="size-3.5" />
              Traité
            </Button>
          )}
        </div>
      </div>

      {sentNotice && (
        <div className="mt-3 border-2 border-ae2v-green bg-ae2v-green/10 p-3 text-xs font-bold text-ae2v-black">
          {sentNotice}
        </div>
      )}

      {expanded && (
        <div className="mt-3 space-y-4 border-l-4 border-ae2v-red bg-ae2v-offwhite p-4 text-sm text-ae2v-black">
          <div>
            <p className="text-xs font-bold uppercase text-muted-foreground">Message reçu :</p>
            <p className="mt-1 whitespace-pre-wrap">{msg.message}</p>
          </div>

          {replying && (
            <form
              onSubmit={handleSendReply}
              className="mt-4 border-t-2 border-ae2v-black/20 pt-4 space-y-3"
            >
              <p className="font-impact text-base uppercase text-ae2v-red">
                Rédiger une réponse e-mail
              </p>
              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div>
                  <label className="block font-bold uppercase">Expéditeur (SMTP AE2V)</label>
                  <input className={`${inputClass} opacity-75`} value={senderEmail} disabled />
                </div>
                <div>
                  <label className="block font-bold uppercase">Destinataire</label>
                  <input className={`${inputClass} opacity-75`} value={msg.email} disabled />
                </div>
              </div>
              <div>
                <label className="block font-bold uppercase text-xs">Objet</label>
                <input
                  className={inputClass}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block font-bold uppercase text-xs">Message</label>
                <textarea
                  className={`${inputClass} min-h-[120px]`}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={sending}>
                  <Send className="size-3.5" />
                  {sending ? "Envoi..." : "Envoyer l'e-mail"}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setReplying(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* TeamManager Component                                                      */
/* -------------------------------------------------------------------------- */

function TeamManager({ teamMembers }: { teamMembers: TeamMember[] }) {
  const [showForm, setShowForm] = useState(false);
  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState({
    displayName: "",
    roleTitle: "",
    pole: teamPoles[0] as TeamPole,
    personalAe2vEmail: "",
    roleEmail: "",
    isOfficer: false,
    bio: "",
    mandate: `${currentYear}–${currentYear + 1}`,
  });

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.displayName.trim() || !form.roleTitle.trim()) return;

    const newMember: TeamMember = {
      id: `custom-${Date.now()}`,
      displayName: form.displayName.trim(),
      roleTitle: form.roleTitle.trim(),
      pole: form.pole,
      personalAe2vEmail: form.personalAe2vEmail.trim() || null,
      roleEmail: form.roleEmail.trim() || null,
      isOfficer: form.isOfficer,
      bio: form.bio.trim() || null,
      photoUrl: null,
      mandate: form.mandate.trim() || `${currentYear}–${currentYear + 1}`,
      isDemo: false,
      isPlaceholder: false,
    };
    saveDynamicTeamMembers([newMember, ...getDynamicTeamMembers()]);
    addAuditLog("AJOUT_EQUIPE", `Nouveau membre équipe ajouté: ${newMember.displayName}`);
    setShowForm(false);
  }

  function handleDelete(id: string) {
    const updated = getDynamicTeamMembers().filter((m) => m.id !== id);
    saveDynamicTeamMembers(updated);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {teamMembers.length} membres dans l'équipe BDE.
        </p>
        <Button
          size="sm"
          onClick={() => setShowForm((v) => !v)}
          variant={showForm ? "secondary" : "default"}
        >
          <Plus className="size-4" />
          {showForm ? "Annuler" : "Ajouter un membre"}
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="border-2 border-ae2v-black bg-ae2v-offwhite p-5 text-ae2v-black space-y-4"
        >
          <p className="text-xs font-bold uppercase tracking-wider">Nouveau membre de l'équipe</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase">Nom d'affichage *</label>
              <input
                className={`${inputClass} mt-1`}
                placeholder="Ex. Marie Dupont"
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase">Titre du rôle *</label>
              <input
                className={`${inputClass} mt-1`}
                placeholder="Ex. Secrétaire général"
                value={form.roleTitle}
                onChange={(e) => setForm((f) => ({ ...f, roleTitle: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase">Pôle *</label>
              <select
                className={`${inputClass} mt-1`}
                value={form.pole}
                onChange={(e) => setForm((f) => ({ ...f, pole: e.target.value as TeamPole }))}
              >
                {teamPoles.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase">E-mail nominatif @ae2v.fr</label>
              <input
                className={`${inputClass} mt-1`}
                type="email"
                placeholder="prenom.nom@ae2v.fr"
                value={form.personalAe2vEmail}
                onChange={(e) => setForm((f) => ({ ...f, personalAe2vEmail: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase">
                E-mail de fonction @ae2v.fr
              </label>
              <input
                className={`${inputClass} mt-1`}
                type="email"
                placeholder="presidence@ae2v.fr"
                value={form.roleEmail}
                onChange={(e) => setForm((f) => ({ ...f, roleEmail: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit">Ajouter à l'équipe BDE</Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
          </div>
        </form>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {teamMembers.map((member) => (
          <div key={member.id} className="flex flex-col border-2 border-ae2v-black bg-card p-4">
            <div className="flex-1">
              <p className="font-bold">{member.displayName}</p>
              <p className="text-xs text-muted-foreground">{member.roleTitle}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                <StatusPill tone="neutral">{member.pole}</StatusPill>
                {member.isOfficer && <StatusPill tone="green">Officier</StatusPill>}
              </div>
              {member.personalAe2vEmail && (
                <p className="mt-1 text-xs text-muted-foreground break-all">
                  {member.personalAe2vEmail}
                </p>
              )}
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="mt-3 w-full"
              onClick={() => handleDelete(member.id)}
            >
              <Trash2 className="size-3.5" />
              Supprimer
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* EventManager Component with Duplication, Multi-Tiers & Attendees List      */
/* -------------------------------------------------------------------------- */

function EventManager({
  events,
  onOpenPayModal,
}: {
  events: Ae2vEvent[];
  onOpenPayModal: (config: {
    customerName: string;
    customerEmail: string;
    description: string;
    priceCents: number;
    onSuccessPay?: (inv: Invoice) => void;
  }) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewAttendeesId, setViewAttendeesId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("Soirée");
  const [date, setDate] = useState("");
  const [place, setPlace] = useState("Campus Vélizy");
  const [capacity, setCapacity] = useState(150);
  const [status, setStatus] = useState<EventStatus>("OUVERT");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  // Paliers de tarifs configurables
  const [tiers, setTiers] = useState<EventTier[]>([
    { id: "adh", label: "Tarif Adhérent Cotisant", priceCents: 500, audience: "adherent" },
    { id: "membre", label: "Tarif Membre Non-Cotisant", priceCents: 800, audience: "membre" },
    { id: "pub", label: "Tarif Public Extérieur", priceCents: 1000, audience: "public" },
  ]);

  const [customTierLabel, setCustomTierLabel] = useState("");
  const [customTierPrice, setCustomTierPrice] = useState(1200);

  async function handleImageDrop(file: File) {
    try {
      const croppedDataUrl = await processImageFile(file, "16:9", 800);
      setImagePreview(croppedDataUrl);
    } catch {
      alert("Impossible d'importer l'image");
    }
  }

  function handleAddCustomTier() {
    if (!customTierLabel.trim()) return;
    const newTier: EventTier = {
      id: `custom-${Date.now()}`,
      label: customTierLabel.trim(),
      priceCents: Number(customTierPrice),
      audience: "public",
    };
    setTiers([...tiers, newTier]);
    setCustomTierLabel("");
  }

  function handleRemoveTier(id: string) {
    setTiers(tiers.filter((t) => t.id !== id));
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date.trim()) return;

    if (editingId) {
      const updated = events.map((ev) =>
        ev.id === editingId
          ? {
              ...ev,
              title: title.trim(),
              kind: kind.trim(),
              date: date.trim(),
              place: place.trim(),
              capacity: Number(capacity),
              status,
              description: description.trim() || ev.description,
              tiers,
            }
          : ev,
      );
      saveDynamicEvents(updated);
      addAuditLog("EDIT_EVENEMENT", `Événement édité: ${title}`);
    } else {
      const newEvent: Ae2vEvent = {
        id: `event-${Date.now()}`,
        slug: title.toLowerCase().replace(/\s+/g, "-"),
        title: title.trim(),
        subtitle: "Événement officiel BDE",
        kind: kind.trim(),
        date: date.trim(),
        isoDate: new Date().toISOString(),
        doors: "20h00",
        place: place.trim(),
        address: "Campus Vélizy",
        summary: title.trim(),
        description: description.trim() || "Événement BDE AE2V.",
        image: imagePreview || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800",
        program: [],
        access: "Campus Vélizy",
        practical: ["Billet nominatif", "Pièce d'identité obligatoire"],
        capacity: Number(capacity),
        registered: 0,
        registrationOpensAt: "Immédiat",
        registrationClosesAt: "Veille de l'événement",
        status,
        waitlist: true,
        tiers,
        isDemo: true,
      };
      saveDynamicEvents([newEvent, ...events]);
      addAuditLog("CREATION_EVENEMENT", `Événement créé: ${newEvent.title}`);
    }

    resetForm();
  }

  function handleDuplicate(event: Ae2vEvent) {
    const clone: Ae2vEvent = {
      ...event,
      id: `event-${Date.now()}`,
      title: `${event.title} [COPIE]`,
      registered: 0,
      status: "NON_PUBLIE",
    };
    saveDynamicEvents([clone, ...events]);
    addAuditLog("DUPLIQUER_EVENEMENT", `Événement dupliqué: ${event.title}`);
  }

  function resetForm() {
    setTitle("");
    setDate("");
    setCapacity(150);
    setImagePreview(null);
    setDescription("");
    setEditingId(null);
    setShowForm(false);
  }

  function handleStartEdit(event: Ae2vEvent) {
    setEditingId(event.id);
    setTitle(event.title);
    setKind(event.kind);
    setDate(event.date);
    setPlace(event.place);
    setCapacity(event.capacity);
    setStatus(event.status);
    setDescription(event.description);
    setTiers(event.tiers || []);
    setShowForm(true);
  }

  function handleUpdateStatus(id: string, newStatus: EventStatus) {
    const updated = events.map((e) => (e.id === id ? { ...e, status: newStatus } : e));
    saveDynamicEvents(updated);
    addAuditLog("STATUT_EVENEMENT", `Statut événement ${id} changé pour : ${newStatus}`);
  }

  const selectedAttendeesEvent = events.find((e) => e.id === viewAttendeesId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{events.length} événements répertoriés.</p>
        <Button
          size="sm"
          onClick={() => setShowForm((v) => !v)}
          variant={showForm ? "secondary" : "default"}
        >
          <Plus className="size-4" />
          {showForm ? "Annuler" : "Créer un événement"}
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSave}
          className="border-2 border-ae2v-black bg-ae2v-offwhite p-5 text-ae2v-black space-y-4"
        >
          <p className="text-xs font-bold uppercase tracking-wider">
            {editingId ? "Éditer l'événement & Grille tarifaire" : "Créer un nouvel événement"}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase">Titre de l'événement *</label>
              <input
                className={`${inputClass} mt-1`}
                placeholder="Ex. Soirée d'Intégration AE2V"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase">Catégorie *</label>
              <input
                className={`${inputClass} mt-1`}
                placeholder="Ex. Soirée, Gala, Tournoi"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase">Date & Heure *</label>
              <input
                className={`${inputClass} mt-1`}
                placeholder="Ex. Jeudi 24 Octobre 2026 à 21h00"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase">Lieu *</label>
              <input
                className={`${inputClass} mt-1`}
                placeholder="Ex. Le Wunderbar / Campus Vélizy"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase">Jauge (Capacité max) *</label>
              <input
                className={`${inputClass} mt-1`}
                type="number"
                min="10"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase mb-1">
                Statut initial de l'événement
              </label>
              <select
                className={`${inputClass} font-bold`}
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
              >
                <option value="NON_PUBLIE">Brouillon / Non publié</option>
                <option value="OUVERT">Inscriptions ouvertes</option>
                <option value="BIENTOT">Bientôt disponible</option>
                <option value="COMPLET">Complet</option>
                <option value="TERMINE">Terminé / Archivé</option>
              </select>
            </div>

            {/* Grille Tarifaire Dynamique */}
            <div className="sm:col-span-2 border-2 border-ae2v-black bg-card p-4 space-y-3">
              <p className="text-xs font-bold uppercase text-ae2v-red">
                Grille Tarifaire Multi-Paliers
              </p>
              <div className="space-y-2">
                {tiers.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between border-2 border-ae2v-black/10 bg-ae2v-offwhite p-2 text-xs"
                  >
                    <span className="font-bold">{t.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm">
                        {formatCents(t.priceCents)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTier(t.id)}
                        className="text-ae2v-red font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2 text-xs">
                <input
                  className={`${inputClass} flex-1 text-xs`}
                  placeholder="Nom du tarif custom"
                  value={customTierLabel}
                  onChange={(e) => setCustomTierLabel(e.target.value)}
                />
                <input
                  className={`${inputClass} w-28 text-xs`}
                  type="number"
                  step="50"
                  placeholder="Prix (cts)"
                  value={customTierPrice}
                  onChange={(e) => setCustomTierPrice(Number(e.target.value))}
                />
                <Button type="button" size="sm" variant="secondary" onClick={handleAddCustomTier}>
                  + Ajouter tarif
                </Button>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase mb-1">
                Bannière (Upload & Recadrage 16:9 Auto)
              </label>
              <div
                className="border-2 border-dashed border-ae2v-black/40 p-6 text-center bg-card hover:bg-ae2v-offwhite cursor-pointer"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files[0]) handleImageDrop(e.dataTransfer.files[0]);
                }}
              >
                <Upload className="size-6 mx-auto text-muted-foreground" />
                <p className="mt-2 text-xs font-bold">
                  Glissez une image ici ou cliquez pour choisir
                </p>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="event-img-upload"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleImageDrop(e.target.files[0]);
                  }}
                />
                <label
                  htmlFor="event-img-upload"
                  className="mt-2 inline-block text-xs underline font-bold text-ae2v-red cursor-pointer"
                >
                  Sélectionner un fichier
                </label>
              </div>
            </div>
          </div>

          {/* Live Preview */}
          {(title || imagePreview) && (
            <div className="mt-4 border-2 border-ae2v-black bg-card p-4">
              <p className="text-[0.65rem] font-bold uppercase tracking-widest text-ae2v-red mb-2">
                Aperçu en temps réel (Live Preview)
              </p>
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full aspect-[16/9] object-cover border-2 border-ae2v-black mb-3"
                />
              )}
              <h4 className="font-impact text-xl uppercase">{title || "Titre de l'événement"}</h4>
              <p className="text-xs text-muted-foreground">
                {date || "Date"} · {place || "Lieu"}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit">{editingId ? "Enregistrer" : "Créer l'événement"}</Button>
            <Button type="button" variant="secondary" onClick={resetForm}>
              Annuler
            </Button>
          </div>
        </form>
      )}

      {/* Tableau des Événements avec Statuts Complexe & Duplication */}
      <div className="border-2 border-ae2v-black bg-card">
        <div className="border-b-2 border-ae2v-black bg-ae2v-black px-4 py-3 text-white font-impact text-sm uppercase tracking-wide">
          Tableau de gestion des événements
        </div>
        <div className="divide-y-2 divide-ae2v-black/10">
          {events.map((event) => (
            <div key={event.id} className="p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-sm">{event.title}</span>
                  <StatusPill
                    tone={
                      event.status === "OUVERT"
                        ? "green"
                        : event.status === "COMPLET"
                          ? "red"
                          : "black"
                    }
                  >
                    {eventStatusLabels[event.status]}
                  </StatusPill>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {event.date} · {event.place} · Jauge : {event.registered} / {event.capacity}
                </p>
              </div>

              {/* Actions flexibles de statuts */}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleDuplicate(event)}
                  title="Dupliquer"
                >
                  <Copy className="size-3.5" />
                  Dupliquer
                </Button>

                <Button size="sm" variant="secondary" onClick={() => setViewAttendeesId(event.id)}>
                  <Users className="size-3.5" />
                  Inscrits & Paiements
                </Button>

                <Button size="sm" variant="secondary" onClick={() => handleStartEdit(event)}>
                  Éditer
                </Button>

                {event.status === "TERMINE" ? (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleUpdateStatus(event.id, "OUVERT")}
                  >
                    <RotateCcw className="size-3.5" />
                    Republier
                  </Button>
                ) : (
                  <>
                    {event.status === "NON_PUBLIE" && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleUpdateStatus(event.id, "OUVERT")}
                      >
                        Publier
                      </Button>
                    )}
                    {event.status === "OUVERT" && (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleUpdateStatus(event.id, "COMPLET")}
                        >
                          Marquer complet
                        </Button>
                        <Button
                          size="sm"
                          variant="black"
                          onClick={() => handleUpdateStatus(event.id, "TERMINE")}
                        >
                          Terminer / Archiver
                        </Button>
                      </>
                    )}
                    {event.status === "COMPLET" && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleUpdateStatus(event.id, "OUVERT")}
                        >
                          Réouvrir
                        </Button>
                        <Button
                          size="sm"
                          variant="black"
                          onClick={() => handleUpdateStatus(event.id, "TERMINE")}
                        >
                          Terminer
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Liste des Inscrits par Événement */}
      {selectedAttendeesEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ae2v-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto border-2 border-ae2v-black bg-card shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-ae2v-black pb-3">
              <h3 className="font-impact text-xl uppercase">
                Inscrits & Paiements — {selectedAttendeesEvent.title}
              </h3>
              <button
                type="button"
                onClick={() => setViewAttendeesId(null)}
                className="p-1 font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Jauge actuelle :{" "}
              <strong>
                {selectedAttendeesEvent.registered} / {selectedAttendeesEvent.capacity}
              </strong>{" "}
              inscrits.
            </p>

            <div className="space-y-2">
              {demoAccounts
                .filter((a) => a.tickets.some((t) => t.eventId === selectedAttendeesEvent.id))
                .map((acc) => {
                  const tk = acc.tickets.find((t) => t.eventId === selectedAttendeesEvent.id);
                  return (
                    <div
                      key={acc.id}
                      className="flex items-center justify-between border-2 border-ae2v-black/10 bg-ae2v-offwhite p-3 text-xs"
                    >
                      <div>
                        <p className="font-bold">
                          {acc.firstName} {acc.lastName}
                        </p>
                        <p className="text-muted-foreground">
                          {acc.email} · Billet N°{" "}
                          <span className="font-mono font-bold">{tk?.code}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill tone={tk?.status === "valide" ? "green" : "neutral"}>
                          {tk?.status}
                        </StatusPill>
                        <Button
                          size="sm"
                          onClick={() => {
                            onOpenPayModal({
                              customerName: `${acc.firstName} ${acc.lastName}`,
                              customerEmail: acc.email,
                              description: `Billet : ${selectedAttendeesEvent.title} (${tk?.tier})`,
                              priceCents: tk?.priceCents || 800,
                            });
                          }}
                        >
                          Encaisser & Facture
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>

            <Button className="w-full" variant="secondary" onClick={() => setViewAttendeesId(null)}>
              Fermer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ShopManager Component with Canvas Image Crop (1:1 Square)                   */
/* -------------------------------------------------------------------------- */

function ShopManager({ products }: { products: ShopProduct[] }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [priceMember, setPriceMember] = useState(2500);
  const [pricePublic, setPricePublic] = useState(3000);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  async function handleImageDrop(file: File) {
    try {
      const croppedDataUrl = await processImageFile(file, "1:1", 600);
      setImagePreview(croppedDataUrl);
    } catch {
      alert("Erreur lors de la conversion de l'image produit.");
    }
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const newProd: ShopProduct = {
      id: `prod-${Date.now()}`,
      name: name.trim(),
      tagline: tagline.trim() || "Textile officiel AE2V",
      priceMemberCents: Number(priceMember),
      pricePublicCents: Number(pricePublic),
      priceMember: Number(priceMember),
      pricePublic: Number(pricePublic),
      badge: "NOUVEAU",
      sizes: ["S", "M", "L", "XL"],
      image: imagePreview || "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600",
      description: "Textile et goodies aux couleurs de l'AE2V.",
    };

    saveDynamicShopProducts([newProd, ...products]);
    addAuditLog("CREATION_PRODUIT", `Nouveau produit ajouté: ${newProd.name}`);
    setName("");
    setTagline("");
    setImagePreview(null);
    setShowForm(false);
  }

  function handleToggleBadge(id: string) {
    const updated = products.map((p) =>
      p.id === id ? { ...p, badge: p.badge ? null : "NOUVEAU" } : p,
    );
    saveDynamicShopProducts(updated);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{products.length} articles au catalogue.</p>
        <Button
          size="sm"
          onClick={() => setShowForm((v) => !v)}
          variant={showForm ? "secondary" : "default"}
        >
          <Plus className="size-4" />
          {showForm ? "Annuler" : "Ajouter un produit"}
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="border-2 border-ae2v-black bg-ae2v-offwhite p-5 text-ae2v-black space-y-4"
        >
          <p className="text-xs font-bold uppercase tracking-wider">Nouveau produit boutique</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase">Nom de l'article *</label>
              <input
                className={`${inputClass} mt-1`}
                placeholder="Ex. Sweat Capuche AE2V 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase">Slogan / Tagline</label>
              <input
                className={`${inputClass} mt-1`}
                placeholder="Ex. Broderie haute qualité"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase">
                Prix Adhérent (en centimes) *
              </label>
              <input
                className={`${inputClass} mt-1`}
                type="number"
                step="100"
                value={priceMember}
                onChange={(e) => setPriceMember(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase">
                Prix Public (en centimes) *
              </label>
              <input
                className={`${inputClass} mt-1`}
                type="number"
                step="100"
                value={pricePublic}
                onChange={(e) => setPricePublic(Number(e.target.value))}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase mb-1">
                Image Produit (Upload & Crop 1:1 Carré)
              </label>
              <div
                className="border-2 border-dashed border-ae2v-black/40 p-6 text-center bg-card hover:bg-ae2v-offwhite cursor-pointer"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files[0]) handleImageDrop(e.dataTransfer.files[0]);
                }}
              >
                <Upload className="size-6 mx-auto text-muted-foreground" />
                <p className="mt-2 text-xs font-bold">
                  Glissez l'image produit ici (Conversion & Découpe 1:1)
                </p>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="prod-img-upload"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleImageDrop(e.target.files[0]);
                  }}
                />
                <label
                  htmlFor="prod-img-upload"
                  className="mt-2 inline-block text-xs underline font-bold text-ae2v-red cursor-pointer"
                >
                  Sélectionner l'image
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit">Ajouter au catalogue</Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
          </div>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((prod) => (
          <div key={prod.id} className="flex flex-col border-2 border-ae2v-black bg-card p-4">
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                {prod.badge ? (
                  <StatusPill tone="green">{prod.badge}</StatusPill>
                ) : (
                  <StatusPill tone="neutral">Standard</StatusPill>
                )}
                <span className="text-xs text-muted-foreground font-mono">{prod.id}</span>
              </div>
              <h3 className="mt-2 font-bold text-base">{prod.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-snug">{prod.tagline}</p>
              <div className="mt-3 border-t-2 border-ae2v-black/10 pt-2 text-xs">
                <p className="font-bold text-ae2v-red">
                  Adhérent : {formatPrice(prod.priceMember)}
                </p>
                <p className="text-muted-foreground">Public : {formatPrice(prod.pricePublic)}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant={prod.badge ? "secondary" : "default"}
              className="mt-4 w-full text-xs"
              onClick={() => handleToggleBadge(prod.id)}
            >
              {prod.badge ? "Retirer badge NOUVEAU" : "Mettre badge NOUVEAU"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* OrdersManager Component                                                    */
/* -------------------------------------------------------------------------- */

function OrdersManager({ dossiers }: { dossiers: Dossier[] }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedStudentEmail, setSelectedStudentEmail] = useState("");
  const [helloAssoRef, setHelloAssoRef] = useState("");
  const [itemName, setItemName] = useState("Sweat Capuche AE2V 2026");
  const [priceCents, setPriceCents] = useState(2500);

  const initialOrders = useMemo(() => {
    const list: (DemoOrder & { customer: string })[] = [];
    demoAccounts.forEach((acc) => {
      acc.orders.forEach((ord) => {
        list.push({ ...ord, customer: `${acc.firstName} ${acc.lastName} (${acc.email})` });
      });
    });
    return list;
  }, []);

  const [orders, setOrders] = useState(initialOrders);

  function handleCreateHelloAssoOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudentEmail || !helloAssoRef.trim()) return;

    const matchedDossier = dossiers.find((d) => d.email === selectedStudentEmail);
    const newOrd: DemoOrder & { customer: string } = {
      id: `HA-${helloAssoRef.trim().toUpperCase()}`,
      date: new Date().toLocaleDateString("fr-FR"),
      totalCents: Number(priceCents),
      status: "En préparation",
      customer: matchedDossier
        ? `${matchedDossier.firstName} ${matchedDossier.lastName} (${matchedDossier.email})`
        : selectedStudentEmail,
      lines: [
        {
          name: itemName,
          variant: "Taille M",
          qty: 1,
          priceCents: Number(priceCents),
        },
      ],
    };

    setOrders([newOrd, ...orders]);
    addAuditLog(
      "COMMANDE_HELLOASSO",
      `Commande HelloAsso rattachée: ${newOrd.id} à ${newOrd.customer}`,
    );
    setHelloAssoRef("");
    setShowAddForm(false);
  }

  function handleUpdateStatus(orderId: string, status: DemoOrder["status"]) {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    addAuditLog("STATUT_COMMANDE", `Commande ${orderId} passée au statut: ${status}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{orders.length} commande(s) répertoriée(s).</p>
        <Button
          size="sm"
          onClick={() => setShowAddForm((v) => !v)}
          variant={showAddForm ? "secondary" : "default"}
        >
          <Plus className="size-4" />
          {showAddForm ? "Annuler" : "Ajouter une commande HelloAsso"}
        </Button>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleCreateHelloAssoOrder}
          className="border-2 border-ae2v-black bg-ae2v-offwhite p-5 text-ae2v-black space-y-4"
        >
          <p className="text-xs font-bold uppercase tracking-wider">
            Associer un paiement HelloAsso à un membre
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase">
                Sélectionner l'étudiant / Membre *
              </label>
              <select
                className={`${inputClass} mt-1 text-xs`}
                value={selectedStudentEmail}
                onChange={(e) => setSelectedStudentEmail(e.target.value)}
                required
              >
                <option value="">-- Choisir un étudiant --</option>
                {dossiers.map((d) => (
                  <option key={d.id} value={d.email}>
                    {d.firstName} {d.lastName} ({d.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase">N° Référence HelloAsso *</label>
              <input
                className={`${inputClass} mt-1`}
                placeholder="Ex. HA-98210"
                value={helloAssoRef}
                onChange={(e) => setHelloAssoRef(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase">Nom du Produit *</label>
              <input
                className={`${inputClass} mt-1`}
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase">Montant (en centimes) *</label>
              <input
                className={`${inputClass} mt-1`}
                type="number"
                value={priceCents}
                onChange={(e) => setPriceCents(Number(e.target.value))}
                required
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit">Enregistrer la commande</Button>
            <Button type="button" variant="secondary" onClick={() => setShowAddForm(false)}>
              Annuler
            </Button>
          </div>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {orders.map((ord) => (
          <div key={ord.id} className="flex flex-col border-2 border-ae2v-black bg-card p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-impact text-lg uppercase text-ae2v-red">{ord.id}</span>
              <StatusPill tone={ord.status === "Retirée" ? "green" : "neutral"}>
                {ord.status}
              </StatusPill>
            </div>
            <p className="mt-2 text-xs font-bold text-muted-foreground">{ord.customer}</p>
            <p className="text-xs text-muted-foreground">{ord.date}</p>

            <div className="mt-3 flex-1 border-t border-ae2v-black/10 pt-3">
              <ul className="space-y-1 text-xs">
                {ord.lines.map((line, idx) => (
                  <li key={idx} className="flex justify-between font-bold">
                    <span>
                      {line.qty}× {line.name} ({line.variant})
                    </span>
                    <span>{formatCents(line.priceCents)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 border-t border-ae2v-black/10 pt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={ord.status === "En préparation" ? "default" : "secondary"}
                onClick={() => handleUpdateStatus(ord.id, "En préparation")}
              >
                En préparation
              </Button>
              <Button
                size="sm"
                variant={ord.status === "Prête" ? "default" : "secondary"}
                onClick={() => handleUpdateStatus(ord.id, "Prête")}
              >
                Prête au retrait
              </Button>
              <Button
                size="sm"
                variant={ord.status === "Retirée" ? "default" : "secondary"}
                onClick={() => handleUpdateStatus(ord.id, "Retirée")}
              >
                Marquer retirée
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* InvoicesManager Component (Factures & Reçus AE2V)                          */
/* -------------------------------------------------------------------------- */

function InvoicesManager({ invoices }: { invoices: Invoice[] }) {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{invoices.length} facture(s) émise(s).</p>
      </div>

      <DataTable
        data={invoices}
        columns={[
          {
            key: "id",
            label: "N° Facture",
            render: (inv) => (
              <span className="font-mono font-bold text-xs text-ae2v-red">{inv.id}</span>
            ),
          },
          { key: "date", label: "Date", render: (inv) => inv.date },
          {
            key: "customer",
            label: "Client",
            render: (inv) => <span className="font-bold">{inv.customerName}</span>,
          },
          {
            key: "method",
            label: "Mode de règlement",
            render: (inv) => <StatusPill tone="neutral">{inv.paymentMethod}</StatusPill>,
          },
          {
            key: "total",
            label: "Montant TTC",
            render: (inv) => (
              <span className="font-impact text-base">{formatCents(inv.totalCents)}</span>
            ),
          },
          {
            key: "action",
            label: "Reçu",
            render: (inv) => (
              <Button size="sm" variant="secondary" onClick={() => setSelectedInvoice(inv)}>
                <Printer className="size-3.5" />
                Voir le Reçu
              </Button>
            ),
          },
        ]}
      />

      {/* Modal Reçu de Facture */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ae2v-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg border-2 border-ae2v-black bg-card shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-ae2v-black pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="size-5 text-ae2v-red" />
                <h3 className="font-impact text-xl uppercase">Reçu de Règlement AE2V</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="p-1 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="border-2 border-ae2v-black bg-ae2v-offwhite p-5 font-mono text-xs text-ae2v-black space-y-3">
              <div className="flex justify-between border-b border-ae2v-black/20 pb-2">
                <span className="font-bold">BDE AE2V VÉLIZY</span>
                <span className="font-bold text-ae2v-red">{selectedInvoice.id}</span>
              </div>
              <p>
                <strong>Date :</strong> {selectedInvoice.date}
              </p>
              <p>
                <strong>Client :</strong> {selectedInvoice.customerName} (
                {selectedInvoice.customerEmail})
              </p>
              <p>
                <strong>Mode de paiement :</strong> {selectedInvoice.paymentMethod}
              </p>

              <div className="border-t border-b border-ae2v-black/20 py-2 space-y-1">
                {selectedInvoice.lines.map((l, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>
                      {l.qty}× {l.description}
                    </span>
                    <span className="font-bold">{formatCents(l.totalCents)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-sm font-bold pt-1">
                <span>TOTAL REÇU :</span>
                <span className="font-impact text-base text-ae2v-red">
                  {formatCents(selectedInvoice.totalCents)}
                </span>
              </div>
              {selectedInvoice.notes && (
                <p className="text-[0.65rem] opacity-75">Note : {selectedInvoice.notes}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => window.print()}>
                <Printer className="size-4" />
                Imprimer le reçu
              </Button>
              <Button variant="secondary" onClick={() => setSelectedInvoice(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
