import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { strToU8, zipSync } from "fflate";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Mail,
  ArrowDown,
  ArrowUp,
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
  Download,
  CreditCard,
  UserCheck,
  Layers,
  Receipt,
  Copy,
  Link2,
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
  Camera,
  LayoutDashboard,
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
  contributionStatusLabels,
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
import { displayedTeamTitles, initials, teamPoles, type TeamPole } from "@/data/team";
import {
  eventStatusLabels,
  publicRecordToEvent,
  type Ae2vEvent,
  type EventStatus,
  type EventTier,
} from "@/data/events";
import { formatPrice, HELLOASSO_SHOP_URL, type ShopProduct } from "@/data/shop";
import { getSiteConfig } from "@/lib/site-config";
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
import { downloadInvoicePdf } from "@/lib/invoice-pdf";
import { PersonSheetModal, type UnifiedPerson } from "@/components/bureau/person-sheet-modal";
import { PaymentModal } from "@/components/bureau/payment-modal";
import { BureauModal } from "@/components/bureau/bureau-modal";
import { confirmSite, notifySite } from "@/components/ui/site-feedback";
import {
  getBureauBillingServer,
  importHelloAssoOrderServer,
  updateOrderServer,
  refundOrderServer,
  updateInvoiceServer,
} from "@/lib/server-functions/billing";
import {
  getBureauMembersServer,
  getPerson360Server,
  updatePaymentStatusServer,
  type BureauPerson360,
  type BureauServerMember,
} from "@/lib/server-functions/people";
import {
  downloadBureauEmailListServer,
  getBureauEmailListsServer,
  EMAIL_CATEGORIES,
  type BureauEmailListRow,
  type EmailCategory,
} from "@/lib/server-functions/email-preferences";
import {
  getTeamMembersServer,
  saveTeamMemberServer,
  reorderTeamMembersServer,
  type ServerTeamMember,
} from "@/lib/server-functions/team";
import {
  getBureauProductsServer,
  saveProductServer,
  deleteProductServer,
  type ServerProduct,
} from "@/lib/server-functions/products";
import {
  decideMembershipServer,
  getMembershipCorrectionByDossierServer,
  type MembershipCorrectionThread,
} from "@/lib/server-functions/membership";
import {
  getBureauCandidaturesServer,
  updateCandidatureServer,
} from "@/lib/server-functions/candidatures";
import {
  checkInTicketServer,
  getTicketScanContextServer,
  getEventRegistrationsServer,
  getEventStatsServer,
  getBureauEventsServer,
  cancelEventRegistrationServer,
  saveEventServer,
} from "@/lib/server-functions/events";
import {
  getContactMessagesServer,
  markContactMessageReadServer,
  updateContactMessageServer,
} from "@/lib/server-functions/contact";

function fuzzyScore(query: string, candidate: string): number {
  const a = query.trim().toLowerCase();
  const b = candidate.trim().toLowerCase();
  if (!a || !b) return 0;
  if (b.includes(a)) return 1;
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0]!;
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = previous[j]!;
      previous[j] = Math.min(
        previous[j]! + 1,
        previous[j - 1]! + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return 1 - previous[b.length]! / Math.max(a.length, b.length);
}
function opaqueMemberCode(value: string): string {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `AE2V-2026-MBR-${(hash >>> 0).toString(36).toUpperCase().padStart(8, "0")}`;
}

function invoiceExportRows(rows: Invoice[]) {
  return rows.map((invoice) => ({
    numero: invoice.id,
    date: invoice.date,
    client: invoice.customerName,
    email: invoice.customerEmail,
    paiement: invoice.paymentMethod,
    statut: invoice.status ?? "EMISE",
    totalCents: invoice.totalCents,
    totalEuros: (invoice.totalCents / 100).toFixed(2),
    description: (invoice.lines ?? [])
      .map((line) => `${line.qty}x ${line.description}`)
      .join(" | "),
  }));
}

function invoiceExportCsv(rows: Invoice[]) {
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const values = invoiceExportRows(rows);
  const headers = [
    "N° facture",
    "Date",
    "Client",
    "E-mail",
    "Paiement",
    "Statut",
    "Total centimes",
    "Total euros",
    "Lignes",
  ];
  return [
    headers.map(escape).join(","),
    ...values.map((row) =>
      [
        row.numero,
        row.date,
        row.client,
        row.email,
        row.paiement,
        row.statut,
        String(row.totalCents),
        row.totalEuros,
        row.description,
      ]
        .map(escape)
        .join(","),
    ),
  ].join("\n");
}

function downloadInvoicesCsv(rows: Invoice[]) {
  const blob = new Blob(["\uFEFF" + invoiceExportCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ae2v-factures-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadInvoicesZip(rows: Invoice[]) {
  const values = invoiceExportRows(rows);
  const archive = zipSync({
    "factures.csv": strToU8("\uFEFF" + invoiceExportCsv(rows)),
    "factures.json": strToU8(JSON.stringify(values, null, 2)),
  });
  const blob = new Blob([archive], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ae2v-factures-${new Date().toISOString().slice(0, 10)}.zip`;
  link.click();
  URL.revokeObjectURL(url);
}

function emailCategoryLabel(category: (typeof EMAIL_CATEGORIES)[number]): string {
  return {
    ADHESION: "Adhésion et vie membre",
    EVENEMENTS: "Événements",
    BOUTIQUE: "Boutique et commandes",
    BDE: "Vie du BDE",
    INFORMATIONS_GENERALES: "Informations générales",
  }[category];
}

function serverTeamMemberToLocal(member: ServerTeamMember): TeamMember {
  return {
    id: member.id,
    userId: member.userId,
    displayName: member.displayName,
    roleTitle: member.roleTitle,
    roleTitles: member.roleTitles,
    officerRole: member.officerRole,
    poles: member.poles as TeamPole[],
    showDefaultPoleTitles: member.showDefaultPoleTitles,
    mandate: member.mandateYear,
    publicVisible: member.publicVisible,
    photoUrl: member.photoUrl,
    roleEmail: member.roleEmail,
    personalAe2vEmail: member.personalAe2vEmail,
    bio: member.bio,
    isOfficer: member.isOfficer,
    isDemo: false,
    isPlaceholder: !member.photoUrl,
  };
}

function serverProductToLocal(product: ServerProduct): ShopProduct {
  return {
    id: product.id,
    name: product.name,
    tagline: product.tagline,
    priceMember: product.priceMemberCents,
    pricePublic: product.pricePublicCents,
    sizes: product.sizes,
    image: product.image ?? "",
    ...(product.badge ? { badge: product.badge } : {}),
    ...(product.helloAssoUrl ? { helloAssoUrl: product.helloAssoUrl } : {}),
    isDemo: true,
  };
}

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

function EventMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "neutral";
}) {
  return (
    <div
      className={`border-2 border-ae2v-black p-3 ${tone === "green" ? "bg-ae2v-green" : "bg-card"}`}
    >
      <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-impact text-2xl">{value}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Bureau Page                                                           */
/* -------------------------------------------------------------------------- */

function BureauPage() {
  const search = Route.useSearch();
  const importHelloAssoOrder = useServerFn(importHelloAssoOrderServer);
  const updateOrderServerFn = useServerFn(updateOrderServer);
  const refundOrder = useServerFn(refundOrderServer);
  const updateInvoice = useServerFn(updateInvoiceServer);
  const getBureauBilling = useServerFn(getBureauBillingServer);
  const getBureauMembers = useServerFn(getBureauMembersServer);
  const getPerson360 = useServerFn(getPerson360Server);
  const updatePaymentStatus = useServerFn(updatePaymentStatusServer);
  const getBureauEmailLists = useServerFn(getBureauEmailListsServer);
  const downloadBureauEmailList = useServerFn(downloadBureauEmailListServer);
  const getTeamMembers = useServerFn(getTeamMembersServer);
  const saveTeamMember = useServerFn(saveTeamMemberServer);
  const reorderTeamMembers = useServerFn(reorderTeamMembersServer);
  const getBureauProducts = useServerFn(getBureauProductsServer);
  const saveProduct = useServerFn(saveProductServer);
  const archiveProduct = useServerFn(deleteProductServer);
  const decideMembership = useServerFn(decideMembershipServer);
  const getMembershipCorrection = useServerFn(getMembershipCorrectionByDossierServer);
  const getBureauCandidatures = useServerFn(getBureauCandidaturesServer);
  const updateCandidatureRemote = useServerFn(updateCandidatureServer);
  const saveEvent = useServerFn(saveEventServer);
  const checkInTicket = useServerFn(checkInTicketServer);
  const getTicketScanContext = useServerFn(getTicketScanContextServer);
  const getEventRegistrations = useServerFn(getEventRegistrationsServer);
  const getEventStats = useServerFn(getEventStatsServer);
  const getBureauEvents = useServerFn(getBureauEventsServer);
  const cancelEventRegistration = useServerFn(cancelEventRegistrationServer);
  const getContactMessages = useServerFn(getContactMessagesServer);
  const markContactMessageRead = useServerFn(markContactMessageReadServer);
  const updateContactMessage = useServerFn(updateContactMessageServer);
  const {
    ready,
    sessionResolved,
    account,
    can,
    dossiers,
    candidatures,
    messages,
    updateCandidature,
    updateDossier,
    updateMessageStatus,
  } = useDemoSession();
  const canFinance = account?.role === "bureau_admin";
  const isRemoteSession = Boolean(account && !account.id.startsWith("acc-"));

  // Navigation principale par Section
  const [mainSection, setMainSection] = useState<
    "dashboard" | "scanner" | "demandes" | "personnes" | "gestion"
  >("dashboard");

  // Sous-onglets par section
  const [demandesTab, setDemandesTab] = useState<
    "messages" | "adhesions" | "cotisations_attente" | "candidatures"
  >("messages");
  const [personnesTab, setPersonnesTab] = useState<"membres_valides" | "equipe_bde" | "emails">(
    "membres_valides",
  );
  const [gestionTab, setGestionTab] = useState<
    "evenements" | "boutique" | "commandes" | "factures"
  >("evenements");

  // Filtres de recherche
  const [membershipFilter, setMembershipFilter] = useState("TOUS");
  const [contribFilter, setContribFilter] = useState("TOUS");
  const [paymentFilter, setPaymentFilter] = useState("TOUS");
  const [memberSchoolYearFilter, setMemberSchoolYearFilter] = useState("TOUS");
  const [msgFilter, setMsgFilter] = useState("TOUS");
  const [showTreatedMessages, setShowTreatedMessages] = useState(false);
  const [messageSearch, setMessageSearch] = useState("");
  const [messageStatusFilter, setMessageStatusFilter] = useState<"TOUS" | ContactMessageStatus>(
    "TOUS",
  );
  const [messageReadFilter, setMessageReadFilter] = useState<
    "TOUS" | "NON_LUS_PAR_MOI" | "LUS_PAR_AUTRE"
  >("TOUS");
  const [messageDateFrom, setMessageDateFrom] = useState("");
  const [messageDateTo, setMessageDateTo] = useState("");
  const [messageSort, setMessageSort] = useState<"RECENT" | "ANCIEN">("RECENT");
  const [showValidatedMemberships, setShowValidatedMemberships] = useState(false);
  const [poleFilter, setPoleFilter] = useState("TOUS");
  const [emailCategoryFilter, setEmailCategoryFilter] = useState<EmailCategory>("EVENEMENTS");
  const [emailMembershipFilter, setEmailMembershipFilter] = useState("TOUS");
  const [emailDepartementFilter, setEmailDepartementFilter] = useState("TOUS");
  const [emailNiveauFilter, setEmailNiveauFilter] = useState("TOUS");
  const [emailVolunteerFilter, setEmailVolunteerFilter] = useState("TOUS");
  const [invoicePayFilter, setInvoicePayFilter] = useState("TOUS");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("TOUS");
  const [selectedContactMessage, setSelectedContactMessage] = useState<ContactMessage | null>(null);
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);
  const [selectedDossierThread, setSelectedDossierThread] =
    useState<MembershipCorrectionThread | null>(null);
  const [correctionDraft, setCorrectionDraft] = useState<{
    dossierId: string;
    note: string;
  } | null>(null);
  const [copiedShareLink, setCopiedShareLink] = useState<string | null>(null);
  const handledShareRef = useRef<string | null>(null);

  async function copyBureauShareLink(kind: "dossier" | "candidature" | "message", id: string) {
    const url = `${window.location.origin}/bureau?${kind}=${encodeURIComponent(id)}#demandes`;
    await navigator.clipboard?.writeText(url);
    setCopiedShareLink(`${kind}:${id}`);
    window.setTimeout(() => setCopiedShareLink(null), 2200);
  }

  async function downloadThematicEmailList(category: EmailCategory) {
    if (!isRemoteSession) {
      notifySite("Les listes email sont disponibles après connexion à la base du bureau.", {
        kind: "info",
      });
      return;
    }
    setEmailDownloadingCategory(category);
    try {
      const result = await downloadBureauEmailList({
        data: {
          category,
          ...(emailMembershipFilter !== "TOUS"
            ? {
                membershipStatus: emailMembershipFilter as
                  "DEMANDE_SOUMISE" | "A_CORRIGER" | "MEMBRE_VALIDE" | "REFUSE",
              }
            : {}),
          ...(emailDepartementFilter !== "TOUS" ? { departement: emailDepartementFilter } : {}),
          ...(emailNiveauFilter !== "TOUS" ? { niveau: emailNiveauFilter } : {}),
          ...(emailVolunteerFilter !== "TOUS"
            ? { volunteer: emailVolunteerFilter as "oui" | "peut-etre" | "non" }
            : {}),
          ...(memberSchoolYearFilter !== "TOUS" ? { schoolYear: memberSchoolYearFilter } : {}),
        },
      });
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ae2v-${category.toLowerCase()}-emails-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      notifySite(
        `${result.count} adresse(s) exportée(s) pour « ${emailCategoryLabel(category)} ».`,
        {
          kind: "success",
        },
      );
    } catch {
      notifySite("La liste email n’a pas pu être téléchargée.", { kind: "error" });
    } finally {
      setEmailDownloadingCategory(null);
    }
  }

  useEffect(() => {
    const section = window.location.hash.replace("#", "");
    if (
      section === "scanner" ||
      section === "dashboard" ||
      section === "personnes" ||
      section === "gestion" ||
      section === "demandes"
    ) {
      setMainSection(section);
    }
  }, []);

  useEffect(() => {
    const tab = search.tab;
    if (
      tab === "messages" ||
      tab === "adhesions" ||
      tab === "cotisations_attente" ||
      tab === "candidatures"
    ) {
      setMainSection("demandes");
      setDemandesTab(tab);
    } else if (tab === "membres_valides" || tab === "equipe_bde" || tab === "emails") {
      setMainSection("personnes");
      setPersonnesTab(tab);
    } else if (
      tab === "evenements" ||
      tab === "boutique" ||
      tab === "commandes" ||
      tab === "factures"
    ) {
      setMainSection("gestion");
      setGestionTab(tab);
    }
  }, [search.tab]);

  useEffect(() => {
    if (!selectedDossier || !isRemoteSession) {
      setSelectedDossierThread(null);
      return;
    }
    setSelectedDossierThread(null);
    void getMembershipCorrection({ data: { dossierId: selectedDossier.id } })
      .then(setSelectedDossierThread)
      .catch(() => setSelectedDossierThread(null));
  }, [getMembershipCorrection, isRemoteSession, selectedDossier]);

  useEffect(() => {
    if (!isRemoteSession) {
      setServerCandidatures([]);
      return;
    }
    void getBureauCandidatures({ data: undefined })
      .then((rows) =>
        setServerCandidatures(
          rows.map((row) => ({ ...row, status: row.status as Candidature["status"] })),
        ),
      )
      .catch(() => setServerCandidatures([]));
  }, [getBureauCandidatures, isRemoteSession]);

  // Dynamic Stores
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [events, setEvents] = useState<Ae2vEvent[]>([]);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orders, setOrders] = useState<Ae2vOrder[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [serverMembers, setServerMembers] = useState<BureauServerMember[]>([]);
  const [serverMembersLoaded, setServerMembersLoaded] = useState(false);
  const [serverEventsLoaded, setServerEventsLoaded] = useState(false);
  const [serverTeamLoaded, setServerTeamLoaded] = useState(false);
  const [serverProductsLoaded, setServerProductsLoaded] = useState(false);
  const [serverBillingLoaded, setServerBillingLoaded] = useState(false);
  const [serverMessagesLoaded, setServerMessagesLoaded] = useState(false);
  const [serverEmailRows, setServerEmailRows] = useState<BureauEmailListRow[]>([]);
  const [serverEmailRowsLoaded, setServerEmailRowsLoaded] = useState(false);
  const [emailDownloadingCategory, setEmailDownloadingCategory] = useState<EmailCategory | null>(
    null,
  );
  const [serverMessages, setServerMessages] = useState<ContactMessage[]>([]);
  const [serverCandidatures, setServerCandidatures] = useState<Candidature[]>([]);
  const [serverBilling, setServerBilling] = useState<Awaited<
    ReturnType<typeof getBureauBillingServer>
  > | null>(null);

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

  useEffect(() => {
    if (!account || account.id.startsWith("acc-")) {
      setServerMembers([]);
      setServerMembersLoaded(false);
      return;
    }
    let active = true;
    setServerMembersLoaded(false);
    void getBureauMembers({
      data: memberSchoolYearFilter === "TOUS" ? {} : { schoolYear: memberSchoolYearFilter },
    })
      .then((members) => {
        if (active) {
          setServerMembers(members);
          setServerMembersLoaded(true);
        }
      })
      .catch(() => {
        if (active) {
          setServerMembers([]);
          setServerMembersLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, [account, getBureauMembers, memberSchoolYearFilter]);

  useEffect(() => {
    if (!account || account.id.startsWith("acc-")) {
      setServerEventsLoaded(false);
      return;
    }
    let active = true;
    setServerEventsLoaded(false);
    void getBureauEvents()
      .then((records) => {
        if (active) {
          setEvents(records.map(publicRecordToEvent));
          setServerEventsLoaded(true);
        }
      })
      .catch(() => {
        if (active) {
          setEvents([]);
          setServerEventsLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, [account, getBureauEvents]);

  useEffect(() => {
    if (!account || account.id.startsWith("acc-")) {
      setServerEmailRows([]);
      setServerEmailRowsLoaded(true);
      return;
    }
    let active = true;
    setServerEmailRowsLoaded(false);
    void getBureauEmailLists({
      data: {
        category: emailCategoryFilter,
        ...(emailMembershipFilter !== "TOUS"
          ? {
              membershipStatus: emailMembershipFilter as
                "DEMANDE_SOUMISE" | "MEMBRE_VALIDE" | "REFUSE",
            }
          : {}),
        ...(emailDepartementFilter !== "TOUS" ? { departement: emailDepartementFilter } : {}),
        ...(emailNiveauFilter !== "TOUS" ? { niveau: emailNiveauFilter } : {}),
        ...(emailVolunteerFilter !== "TOUS"
          ? { volunteer: emailVolunteerFilter as "oui" | "peut-etre" | "non" }
          : {}),
        ...(memberSchoolYearFilter !== "TOUS" ? { schoolYear: memberSchoolYearFilter } : {}),
      },
    })
      .then((rows) => {
        if (active) {
          setServerEmailRows(rows);
          setServerEmailRowsLoaded(true);
        }
      })
      .catch(() => {
        if (active) {
          setServerEmailRows([]);
          setServerEmailRowsLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, [
    account,
    emailCategoryFilter,
    emailDepartementFilter,
    emailMembershipFilter,
    emailNiveauFilter,
    emailVolunteerFilter,
    memberSchoolYearFilter,
    getBureauEmailLists,
  ]);

  useEffect(() => {
    if (!account || account.id.startsWith("acc-")) {
      setServerTeamLoaded(false);
      return;
    }
    let active = true;
    setServerTeamLoaded(false);
    void getTeamMembers()
      .then((members) => {
        if (active) {
          setTeamMembers(members.map(serverTeamMemberToLocal));
          setServerTeamLoaded(true);
        }
      })
      .catch(() => {
        if (active) {
          setTeamMembers([]);
          setServerTeamLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, [account, getTeamMembers]);

  useEffect(() => {
    if (!account || account.id.startsWith("acc-")) {
      setServerProductsLoaded(false);
      return;
    }
    let active = true;
    setServerProductsLoaded(false);
    void getBureauProducts()
      .then((serverProducts) => {
        if (active) {
          setProducts(serverProducts.map(serverProductToLocal));
          setServerProductsLoaded(true);
        }
      })
      .catch(() => {
        if (active) {
          setProducts([]);
          setServerProductsLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, [account, getBureauProducts]);

  useEffect(() => {
    if (!account || account.id.startsWith("acc-")) {
      setServerMessages([]);
      setServerMessagesLoaded(false);
      return;
    }
    let active = true;
    setServerMessagesLoaded(false);
    void getContactMessages()
      .then((messagesFromServer) => {
        if (active) {
          setServerMessages(messagesFromServer);
          setServerMessagesLoaded(true);
        }
      })
      .catch(() => {
        if (active) {
          setServerMessages([]);
          setServerMessagesLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, [account, getContactMessages]);

  useEffect(() => {
    if (!account || account.id.startsWith("acc-")) {
      setServerBilling(null);
      setServerBillingLoaded(false);
      return;
    }
    let active = true;
    setServerBillingLoaded(false);
    void getBureauBilling()
      .then((billing) => {
        if (active) {
          setServerBilling(billing);
          setServerBillingLoaded(true);
        }
      })
      .catch(() => {
        if (active) {
          setServerBilling(null);
          setServerBillingLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, [account, getBureauBilling]);

  // Modals & Selection states
  const [selectedPerson, setSelectedPerson] = useState<UnifiedPerson | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailDefaultRecipient, setEmailDefaultRecipient] = useState("");
  const [emailDefaultSubject, setEmailDefaultSubject] = useState("");
  const [emailDefaultBody, setEmailDefaultBody] = useState("");
  const [emailDefaultCategory, setEmailDefaultCategory] = useState<
    "BDE" | "ADHESION" | "EVENEMENTS" | "BOUTIQUE" | "INFORMATIONS_GENERALES" | "TRANSACTIONNEL"
  >("BDE");
  const [emailShowTemplates, setEmailShowTemplates] = useState(true);
  const [payModalConfig, setPayModalConfig] = useState<{
    customerName: string;
    customerEmail: string;
    description: string;
    priceCents: number;
    editableDetails?: boolean;
    pendingPaymentId?: string;
    onSuccessPay?: (inv: Invoice) => void;
  } | null>(null);

  // Scanner State
  const [scanCodeInput, setScanCodeInput] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<
    { id: string; label: string; code: string }[]
  >([]);
  const [scannedPerson, setScannedPerson] = useState<UnifiedPerson | null>(null);
  const [scannedServerPerson, setScannedServerPerson] = useState<BureauPerson360 | null>(null);
  const [scannedTicketContext, setScannedTicketContext] = useState<Awaited<
    ReturnType<typeof getTicketScanContextServer>
  > | null>(null);

  useEffect(() => {
    if (!cameraOpen) return;
    let stream: MediaStream | null = null;
    let animationFrame = 0;
    let cancelled = false;
    setCameraError(null);

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(
          "La caméra n’est pas disponible dans ce navigateur. Utilisez la saisie manuelle.",
        );
        return;
      }
      const BarcodeDetectorConstructor = (
        window as typeof window & {
          BarcodeDetector?: new (options?: { formats?: string[] }) => {
            detect(video: HTMLVideoElement): Promise<Array<{ rawValue?: string }>>;
          };
        }
      ).BarcodeDetector;
      if (!BarcodeDetectorConstructor) {
        setCameraError("La détection QR native n’est pas disponible. Utilisez la saisie manuelle.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const detector = new BarcodeDetectorConstructor({ formats: ["qr_code"] });
        const scan = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const results = await detector.detect(videoRef.current);
            const rawValue = results[0]?.rawValue?.trim();
            if (rawValue) {
              setScanCodeInput(rawValue);
              setCameraOpen(false);
              return;
            }
          } catch {
            // La saisie manuelle reste disponible si une image ne peut pas être décodée.
          }
          animationFrame = window.requestAnimationFrame(() => void scan());
        };
        animationFrame = window.requestAnimationFrame(() => void scan());
      } catch {
        setCameraError("Accès caméra refusé ou indisponible. Utilisez la saisie manuelle.");
      }
    }

    void startCamera();
    const videoElement = videoRef.current;
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(animationFrame);
      stream?.getTracks().forEach((track) => track.stop());
      if (videoElement) videoElement.srcObject = null;
    };
  }, [cameraOpen]);

  // Event Editing / Creation State
  const [editingEvent, setEditingEvent] = useState<Ae2vEvent | null>(null);
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [showTerminatedEvents, setShowTerminatedEvents] = useState(false);
  const [selectedAttendeesEvent, setSelectedAttendeesEvent] = useState<Ae2vEvent | null>(null);
  const [selectedEventDetail, setSelectedEventDetail] = useState<Ae2vEvent | null>(null);
  const [eventAttendees, setEventAttendees] = useState<
    Awaited<ReturnType<typeof getEventRegistrationsServer>> extends infer T
      ? T extends readonly (infer R)[]
        ? R[]
        : never[]
      : never[]
  >([]);
  const [eventAttendeesLoading, setEventAttendeesLoading] = useState(false);
  const [eventStats, setEventStats] = useState<Awaited<
    ReturnType<typeof getEventStatsServer>
  > | null>(null);

  // Product Editing / Creation State
  const [editingProduct, setEditingProduct] = useState<ShopProduct | null>(null);
  const [productFormOpen, setProductFormOpen] = useState(false);

  // Team Member Editing Modal State
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [draggedMemberId, setDraggedMemberId] = useState<string | null>(null);
  const [teamOrderModalOpen, setTeamOrderModalOpen] = useState(false);

  // Candidature Full Reader & Comment Modal State
  const [selectedCandidature, setSelectedCandidature] = useState<Candidature | null>(null);
  const [candidatureNoteInput, setCandidatureNoteInput] = useState("");

  // Order Detail & Notes Modal State
  const [selectedOrder, setSelectedOrder] = useState<Ae2vOrder | null>(null);
  const [orderNoteInput, setOrderNoteInput] = useState("");
  const [refundDraft, setRefundDraft] = useState<{
    kind: "order" | "invoice";
    id: string;
    maxCents: number;
    amountEuros: string;
    note: string;
  } | null>(null);
  const [orderFormOpen, setOrderFormOpen] = useState(false);
  const [orderDraft, setOrderDraft] = useState({
    memberId: "",
    customerName: "",
    customerEmail: "",
    items: [{ productName: "", amountEuros: "", quantity: "1" }],
    helloAssoId: "",
    paymentStatus: "CONFIRME" as "EN_ATTENTE" | "CONFIRME",
    notes: "",
  });

  // Invoice Detail / Receipt Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceEditStatus, setInvoiceEditStatus] = useState<
    "EMISE" | "ANNULEE" | "REMBOURSEE" | "PARTIELLEMENT_REMBOURSEE"
  >("EMISE");
  const [invoiceEditNotes, setInvoiceEditNotes] = useState("");

  async function submitCorrectionRequest() {
    if (!correctionDraft?.note.trim()) return;
    const dossier = selectedDossier;
    if (!dossier || correctionDraft.dossierId !== dossier.id) return;
    const note = correctionDraft.note.trim();
    const isLocalDemo = !account || account.id.startsWith("acc-");
    if (!isLocalDemo) {
      try {
        await decideMembership({
          data: { dossierId: dossier.id, decision: "A_CORRIGER", note },
        });
        setServerMembers(
          await getBureauMembers({
            data: memberSchoolYearFilter === "TOUS" ? {} : { schoolYear: memberSchoolYearFilter },
          }),
        );
      } catch {
        notifySite("La demande de correction n’a pas pu être enregistrée.", { kind: "error" });
        return;
      }
    }
    updateDossier(dossier.id, { status: "A_CORRIGER", note });
    addAuditLog("CORRECTION_ADHESION", `Dossier ${dossier.id} à corriger`);
    setCorrectionDraft(null);
    setSelectedDossier(null);
  }

  async function submitRefund() {
    if (!refundDraft?.note.trim()) return;
    const amountCents = Math.round(Number(refundDraft.amountEuros.replace(",", ".")) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0 || amountCents > refundDraft.maxCents) {
      notifySite(
        `Le montant doit être compris entre 0,01 € et ${formatCents(refundDraft.maxCents)}.`,
        { kind: "warning" },
      );
      return;
    }
    const note = refundDraft.note.trim();
    try {
      if (refundDraft.kind === "order") {
        const order = selectedOrder;
        if (!order) return;
        if (order.serverId) {
          await refundOrder({ data: { orderId: order.serverId, amountCents, note } });
        }
        const nextStatus = amountCents === order.totalCents ? "ANNULEE" : "PAYEE";
        const nextNotes = `${order.notes ? `${order.notes} · ` : ""}Remboursement ${formatCents(amountCents)} : ${note}`;
        updateOrder(order.id, { status: nextStatus, notes: nextNotes });
        setSelectedOrder({ ...order, status: nextStatus, notes: nextNotes });
        addAuditLog("REMBOURSEMENT_COMMANDE", `Commande ${order.id} : ${formatCents(amountCents)}`);
      } else {
        const invoice = selectedInvoice;
        if (!invoice?.paymentId) return;
        await updatePaymentStatus({
          data: {
            paymentId: invoice.paymentId,
            status: amountCents === refundDraft.maxCents ? "REMBOURSE" : "PARTIELLEMENT_REMBOURSE",
            refundAmountCents: amountCents,
            notes: note,
          },
        });
        const refreshed = await getBureauBilling();
        setServerBilling(refreshed);
        const refreshedInvoice = refreshed.invoices.find((item) => item.id === invoice.id);
        if (refreshedInvoice) {
          const { notes, ...invoiceWithoutNotes } = refreshedInvoice;
          setSelectedInvoice({
            ...invoiceWithoutNotes,
            paymentMethod: invoiceWithoutNotes.paymentMethod as PaymentMethod,
            status: invoiceWithoutNotes.status as
              "EMISE" | "ANNULEE" | "REMBOURSEE" | "PARTIELLEMENT_REMBOURSEE",
            ...(notes ? { notes } : {}),
          });
          setInvoiceEditStatus(refreshedInvoice.status as typeof invoiceEditStatus);
        }
        addAuditLog("REMBOURSEMENT_FACTURE", `Facture ${invoice.id} : ${formatCents(amountCents)}`);
      }
      setRefundDraft(null);
    } catch {
      notifySite("Le remboursement n’a pas pu être enregistré.", { kind: "error" });
    }
  }

  const openEventAttendees = useCallback(
    (event: Ae2vEvent) => {
      const serverEventId = event.serverId ?? event.id;
      setSelectedAttendeesEvent(event);
      setEventStats(null);
      setEventAttendees([]);
      setEventAttendeesLoading(true);
      void getEventStats({ data: { eventId: serverEventId } })
        .then(setEventStats)
        .catch(() => setEventStats(null));
      void getEventRegistrations({ data: { eventId: serverEventId } })
        .then((registrations) => {
          setEventAttendees(Array.isArray(registrations) ? registrations : []);
        })
        .catch(() => setEventAttendees([]))
        .finally(() => setEventAttendeesLoading(false));
    },
    [getEventRegistrations, getEventStats],
  );

  // Safe Arrays
  const safeDossiers = useMemo<Dossier[]>(() => {
    if (!isRemoteSession) return dossiers ?? [];
    if (!serverMembersLoaded) return [];
    return serverMembers.map((member) => {
      const dossier = member.dossier;
      const status =
        member.membershipStatus === "MEMBRE_VALIDE"
          ? ("VALIDE" as const)
          : member.membershipStatus === "REFUSE"
            ? ("REFUSE" as const)
            : member.membershipStatus === "A_CORRIGER"
              ? ("A_CORRIGER" as const)
              : ("EN_ATTENTE" as const);
      const contributionStatus =
        member.contributionStatus === "PAYEE"
          ? ("COTISANT" as const)
          : member.contributionStatus === "PAIEMENT_EN_ATTENTE"
            ? ("PAIEMENT_EN_ATTENTE" as const)
            : ("NON_COTISANT" as const);
      return {
        id: dossier?.id ?? member.id,
        personId: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: dossier?.phone ?? "",
        studentId: dossier?.studentId ?? "",
        schoolYear: dossier?.schoolYear ?? member.schoolYear,
        birthDate: dossier?.birthDate ?? null,
        groupe: dossier?.groupe ?? null,
        interests: dossier?.interests ?? [],
        volunteer: dossier?.volunteer ?? null,
        message: dossier?.message ?? null,
        imageRight: dossier?.imageRight ?? false,
        rgpdAcceptedAt: dossier?.rgpdAcceptedAt ?? null,
        statutsAcceptedAt: dossier?.statutsAcceptedAt ?? null,
        departement: member.departement,
        niveau: member.niveau,
        contributionCents: member.contributionCents,
        contributionStatus,
        emailPrefs: member.emailPrefs,
        submittedAt: dossier?.submittedAt ?? member.memberSince ?? "—",
        validatedAt: dossier?.validatedAt ?? member.memberSince,
        memberSince: member.memberSince,
        status,
        note: dossier?.notes ?? "",
      };
    });
  }, [dossiers, isRemoteSession, serverMembers, serverMembersLoaded]);
  const safeCandidatures = useMemo(
    () => (isRemoteSession ? serverCandidatures : (candidatures ?? [])),
    [candidatures, isRemoteSession, serverCandidatures],
  );
  const safeMessages = useMemo(() => messages ?? [], [messages]);
  const displayMessages = useMemo(
    () => (isRemoteSession ? (serverMessagesLoaded ? serverMessages : []) : safeMessages),
    [isRemoteSession, safeMessages, serverMessages, serverMessagesLoaded],
  );
  const safeEvents = useMemo(
    () => (isRemoteSession ? (serverEventsLoaded ? events : []) : (events ?? [])),
    [events, isRemoteSession, serverEventsLoaded],
  );
  const safeProducts = useMemo(
    () => (isRemoteSession ? (serverProductsLoaded ? products : []) : (products ?? [])),
    [isRemoteSession, products, serverProductsLoaded],
  );
  const safeInvoices = useMemo(() => invoices ?? [], [invoices]);
  const safeOrders = useMemo(() => orders ?? [], [orders]);

  useEffect(() => {
    const eventId = new URLSearchParams(window.location.search).get("eventId");
    if (!eventId || selectedAttendeesEvent) return;
    const event = safeEvents.find((candidate) => candidate.id === eventId);
    if (event) openEventAttendees(event);
  }, [openEventAttendees, safeEvents, selectedAttendeesEvent]);
  const displayInvoices: Invoice[] = useMemo(
    () =>
      isRemoteSession
        ? serverBillingLoaded && serverBilling
          ? serverBilling.invoices.map((invoice) => {
              const { notes, ...invoiceWithoutNotes } = invoice;
              return {
                ...invoiceWithoutNotes,
                paymentMethod: invoice.paymentMethod as PaymentMethod,
                status: ["EMISE", "ANNULEE", "REMBOURSEE", "PARTIELLEMENT_REMBOURSEE"].includes(
                  invoice.status,
                )
                  ? (invoice.status as
                      "EMISE" | "ANNULEE" | "REMBOURSEE" | "PARTIELLEMENT_REMBOURSEE")
                  : "EMISE",
                ...(notes ? { notes } : {}),
              };
            })
          : []
        : safeInvoices,
    [isRemoteSession, safeInvoices, serverBilling, serverBillingLoaded],
  );
  const visibleInvoices = useMemo(() => {
    const query = invoiceSearch.trim().toLowerCase();
    return displayInvoices.filter((invoice) => {
      const matchesSearch =
        !query ||
        [invoice.id, invoice.customerName, invoice.customerEmail]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesPayment =
        invoicePayFilter === "TOUS" || invoice.paymentMethod === invoicePayFilter;
      const matchesStatus =
        invoiceStatusFilter === "TOUS" || (invoice.status ?? "EMISE") === invoiceStatusFilter;
      return matchesSearch && matchesPayment && matchesStatus;
    });
  }, [displayInvoices, invoicePayFilter, invoiceSearch, invoiceStatusFilter]);
  const displayOrders: Ae2vOrder[] = useMemo(
    () =>
      isRemoteSession
        ? serverBillingLoaded && serverBilling
          ? serverBilling.orders.map((order) => {
              const { helloAssoId, notes, ...orderWithoutOptionalFields } = order;
              return {
                ...orderWithoutOptionalFields,
                serverId: order.id,
                status: ["EN_ATTENTE", "PAYEE", "LIVREE", "ANNULEE"].includes(order.status)
                  ? (order.status as OrderStatus)
                  : "EN_ATTENTE",
                ...(helloAssoId ? { helloAssoId } : {}),
                ...(notes ? { notes } : {}),
              };
            })
          : []
        : safeOrders,
    [isRemoteSession, safeOrders, serverBilling, serverBillingLoaded],
  );
  const safeTeamMembers = useMemo(
    () => (isRemoteSession ? (serverTeamLoaded ? teamMembers : []) : (teamMembers ?? [])),
    [isRemoteSession, serverTeamLoaded, teamMembers],
  );

  useEffect(() => {
    const invoiceId = new URLSearchParams(window.location.search).get("invoiceId");
    if (invoiceId && !selectedInvoice) {
      const invoice = displayInvoices.find((candidate) => candidate.id === invoiceId);
      if (invoice) {
        setSelectedInvoice(invoice);
        setInvoiceEditStatus(
          (invoice.status ?? "EMISE") as
            "EMISE" | "ANNULEE" | "REMBOURSEE" | "PARTIELLEMENT_REMBOURSEE",
        );
        setInvoiceEditNotes(invoice.notes ?? "");
      }
    }
  }, [displayInvoices, selectedInvoice]);

  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get("orderId");
    if (orderId && !selectedOrder) {
      const order = displayOrders.find((candidate) => candidate.id === orderId);
      if (order) {
        setSelectedOrder(order);
        setOrderNoteInput(order.notes ?? "");
      }
    }
  }, [displayOrders, selectedOrder]);

  // Filtered Arrays
  const pendingContributions = useMemo(
    () =>
      safeDossiers.filter(
        (d) => d.contributionCents > 0 && d.contributionStatus === "PAIEMENT_EN_ATTENTE",
      ),
    [safeDossiers],
  );

  const validatedMembers = useMemo<BureauServerMember[]>(() => {
    if (isRemoteSession) {
      if (!serverMembersLoaded) return [];
      return serverMembers.map((member) => ({
        ...member,
        membershipStatus:
          member.membershipStatus === "MEMBRE_VALIDE"
            ? ("VALIDE" as const)
            : member.membershipStatus === "REFUSE"
              ? ("REFUSE" as const)
              : member.membershipStatus === "A_CORRIGER"
                ? ("A_CORRIGER" as const)
                : ("EN_ATTENTE" as const),
        contributionStatus:
          member.contributionStatus === "PAYEE"
            ? ("COTISANT" as const)
            : member.contributionStatus === "PAIEMENT_EN_ATTENTE"
              ? ("PAIEMENT_EN_ATTENTE" as const)
              : ("NON_COTISANT" as const),
        tickets: [],
        orders: [],
      }));
    }
    return safeDossiers.map((dossier) => {
      const account = (demoAccounts ?? []).find(
        (candidate) => candidate.email.toLowerCase() === dossier.email.toLowerCase(),
      );
      return {
        id: dossier.id,
        userId: null,
        firstName: dossier.firstName,
        lastName: dossier.lastName,
        email: dossier.email,
        departement: dossier.departement,
        niveau: dossier.niveau,
        schoolYear: account?.schoolYear ?? "2026-2027",
        membershipStatus: dossier.status,
        contributionStatus: dossier.contributionStatus,
        contributionCents: dossier.contributionCents,
        memberSince: dossier.memberSince,
        cardCode: account?.cardCode ?? opaqueMemberCode(dossier.email),
        role: "MEMBRE",
        pole: null,
        poles: [],
        roleTitle: null,
        emailPrefs: account?.emailPrefs ?? [],
        emailUnsubscribed: false,
        dossier: {
          id: dossier.id,
          schoolYear: account?.schoolYear ?? "2026-2027",
          birthDate: null,
          phone: dossier.phone,
          studentId: dossier.studentId,
          groupe: null,
          interests: [],
          volunteer: null,
          message: null,
          imageRight: false,
          submittedAt: dossier.submittedAt,
          validatedAt: dossier.validatedAt,
          notes: dossier.note || null,
          rgpdAcceptedAt: null,
          statutsAcceptedAt: null,
          emailPreferenceToken: null,
          emailUnsubscribed: false,
        },
        memberships: [],
        payments: [],
        orderCount: account?.orders.length ?? 0,
        invoiceCount: account?.invoices?.length ?? 0,
        ticketCount: account?.tickets.length ?? 0,
        tickets: account?.tickets ?? [],
        orders: account?.orders ?? [],
      };
    });
  }, [isRemoteSession, safeDossiers, serverMembers, serverMembersLoaded]);

  const executiveOfficers = useMemo(
    () => safeTeamMembers.filter((m) => m.isOfficer),
    [safeTeamMembers],
  );

  const poleMembers = useMemo(() => safeTeamMembers.filter((m) => !m.isOfficer), [safeTeamMembers]);

  // Scan Action Handler
  async function handleExecuteScan(codeToScan?: string) {
    const targetCode = (codeToScan ?? scanCodeInput).trim().toUpperCase();
    if (!targetCode) return;

    if (targetCode.includes("-TK-") && account && !account.id.startsWith("acc-")) {
      try {
        const context = await getTicketScanContext({ data: { ticketCode: targetCode } });
        setScannedTicketContext(context);
        setSearchSuggestions([]);
        if (context.person) {
          setScannedPerson({
            id: context.person.id,
            status: "VALIDE",
            firstName: context.person.firstName,
            lastName: context.person.lastName,
            email: context.person.email,
            departement: "—",
            niveau: "—",
            membershipStatus: "VALIDE",
            contributionStatus: "NON_COTISANT",
            schoolYear: "—",
            tickets: [],
            orders: [],
          });
          setScannedServerPerson(await getPerson360({ data: { personId: context.person.id } }));
        } else {
          setScannedPerson(null);
          setScannedServerPerson(null);
        }
        addAuditLog("SCAN_QR", `Billet identifié : ${targetCode}`);
        setScanCodeInput("");
      } catch {
        setScannedTicketContext(null);
        notifySite("Billet introuvable ou code non reconnu.", { kind: "warning" });
      }
      return;
    }

    if (isRemoteSession && !serverMembersLoaded) {
      notifySite("Chargement des adhérents…", { kind: "info" });
      return;
    }

    const foundMember = validatedMembers.find(
      (member) =>
        member.cardCode.toUpperCase() === targetCode ||
        member.id.toUpperCase() === targetCode ||
        member.email.toLowerCase() === targetCode.toLowerCase(),
    );

    if (foundMember) {
      setSearchSuggestions([]);
      const memberStatus: UnifiedPerson["status"] = [
        "VALIDE",
        "EN_ATTENTE",
        "A_CORRIGER",
        "REFUSE",
      ].includes(foundMember.membershipStatus)
        ? (foundMember.membershipStatus as UnifiedPerson["status"])
        : "EN_ATTENTE";
      const contributionStatus = ["NON_COTISANT", "PAIEMENT_EN_ATTENTE", "COTISANT"].includes(
        foundMember.contributionStatus,
      )
        ? foundMember.contributionStatus
        : "NON_COTISANT";
      setScannedPerson({
        id: foundMember.id,
        status: memberStatus,
        firstName: foundMember.firstName,
        lastName: foundMember.lastName,
        email: foundMember.email,
        departement: foundMember.departement,
        niveau: foundMember.niveau,
        schoolYear: foundMember.schoolYear,
        membershipStatus: memberStatus,
        contributionStatus,
        memberSince: foundMember.memberSince,
        cardCode: foundMember.cardCode,
        tickets: foundMember.tickets,
        orders: foundMember.orders.map((order) => ({
          id: order.id,
          date: order.date,
          totalCents: order.lines.reduce((total, line) => total + line.priceCents * line.qty, 0),
          status: order.status,
        })),
      });
      if (!foundMember.id.startsWith("acc-")) {
        try {
          setScannedServerPerson(await getPerson360({ data: { personId: foundMember.id } }));
        } catch {
          setScannedServerPerson(null);
        }
      } else {
        setScannedServerPerson(null);
      }
      addAuditLog("SCAN_QR", `Membre identifié : ${foundMember.email}`);
      return;
    }

    // Compatibilité avec les profils de démonstration
    const foundAcc = (demoAccounts ?? []).find(
      (a) =>
        a.cardCode.toUpperCase() === targetCode ||
        a.id.toUpperCase() === targetCode ||
        a.email.toLowerCase() === targetCode.toLowerCase(),
    );

    if (foundAcc) {
      setScannedServerPerson(null);
      setSearchSuggestions([]);
      setScannedPerson({
        id: foundAcc.id,
        status: foundAcc.membershipStatus,
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
      setSearchSuggestions([]);
      try {
        setScannedServerPerson(await getPerson360({ data: { personId: foundDossier.id } }));
      } catch {
        setScannedServerPerson(null);
      }
      setScannedPerson({
        id: foundDossier.id,
        status: foundDossier.status,
        firstName: foundDossier.firstName,
        lastName: foundDossier.lastName,
        email: foundDossier.email,
        departement: foundDossier.departement,
        niveau: foundDossier.niveau,
        schoolYear: "2026-2027",
        membershipStatus: foundDossier.status,
        contributionStatus: foundDossier.contributionStatus,
        memberSince: foundDossier.memberSince,
        cardCode: opaqueMemberCode(foundDossier.email),
        tickets: [],
      });
      addAuditLog("SCAN_QR", `Dossier scanné : ${foundDossier.id}`);
      return;
    }

    const candidates = [
      ...validatedMembers.map((candidate) => ({
        id: candidate.id,
        label: `${candidate.firstName} ${candidate.lastName} · ${candidate.email}`,
        code: candidate.cardCode,
        identity: candidate.email.trim().toLowerCase(),
        score: Math.max(
          fuzzyScore(targetCode, candidate.cardCode),
          fuzzyScore(targetCode, candidate.id),
          fuzzyScore(targetCode, candidate.email),
          fuzzyScore(targetCode, `${candidate.firstName} ${candidate.lastName}`),
        ),
      })),
      ...(isRemoteSession
        ? []
        : (demoAccounts ?? []).map((candidate) => ({
            id: candidate.id,
            label: `${candidate.firstName} ${candidate.lastName} · ${candidate.email}`,
            code: candidate.cardCode,
            identity: candidate.email.trim().toLowerCase(),
            score: Math.max(
              fuzzyScore(targetCode, candidate.cardCode),
              fuzzyScore(targetCode, candidate.id),
              fuzzyScore(targetCode, candidate.email),
              fuzzyScore(targetCode, `${candidate.firstName} ${candidate.lastName}`),
            ),
          }))),
      ...safeDossiers
        .filter(
          (candidate) =>
            !validatedMembers.some(
              (member) =>
                member.email.trim().toLowerCase() === candidate.email.trim().toLowerCase(),
            ),
        )
        .map((candidate) => ({
          id: candidate.personId ?? candidate.id,
          label: `${candidate.firstName} ${candidate.lastName} · ${candidate.email}`,
          code: candidate.id,
          identity: candidate.email.trim().toLowerCase(),
          score: Math.max(
            fuzzyScore(targetCode, candidate.id),
            fuzzyScore(targetCode, candidate.email),
            fuzzyScore(targetCode, `${candidate.firstName} ${candidate.lastName}`),
          ),
        })),
    ]
      .filter((candidate) => candidate.score >= 0.35)
      .sort((a, b) => b.score - a.score)
      .filter(
        (candidate, index, all) =>
          index === all.findIndex((other) => other.identity === candidate.identity),
      )
      .slice(0, 5)
      .map(({ id, label, code }) => ({ id, label, code }));
    setSearchSuggestions(candidates);
    if (candidates.length === 0)
      notifySite(`Aucun membre ni dossier trouvé pour le code : ${targetCode}`, {
        kind: "warning",
      });
  }

  async function validateScannedTicket() {
    if (!scannedTicketContext || scannedTicketContext.ticket.status !== "valide") return;
    try {
      await checkInTicket({ data: { ticketCode: scannedTicketContext.ticket.code } });
      setScannedTicketContext({
        ...scannedTicketContext,
        ticket: { ...scannedTicketContext.ticket, status: "utilise" },
      });
      if (scannedServerPerson) {
        setScannedServerPerson(await getPerson360({ data: { personId: scannedServerPerson.id } }));
      }
      addAuditLog(
        "CHECK_IN_BILLET",
        `Billet ${scannedTicketContext.ticket.code} validé à l'entrée`,
      );
    } catch {
      notifySite(
        "Le billet ne peut pas être validé : déjà utilisé, annulé ou paiement non confirmé.",
        { kind: "warning" },
      );
    }
  }

  async function confirmScannedPendingPayments() {
    if (!scannedServerPerson) return;
    const pending = scannedServerPerson.payments.filter(
      (payment) => payment.status === "EN_ATTENTE",
    );
    if (!pending.length) return;
    try {
      for (const payment of pending) {
        await updatePaymentStatus({ data: { paymentId: payment.id, status: "CONFIRME" } });
      }
      setScannedServerPerson(await getPerson360({ data: { personId: scannedServerPerson.id } }));
      notifySite(`${pending.length} paiement(s) confirmé(s), facture(s) créée(s).`, {
        kind: "success",
      });
    } catch {
      notifySite("Au moins un paiement n’a pas pu être confirmé.", { kind: "error" });
    }
  }

  async function confirmScannedPayment(paymentId: string) {
    try {
      await updatePaymentStatus({ data: { paymentId, status: "CONFIRME" } });
      if (scannedServerPerson) {
        setScannedServerPerson(await getPerson360({ data: { personId: scannedServerPerson.id } }));
      }
      if (scannedTicketContext) {
        setScannedTicketContext(
          await getTicketScanContext({ data: { ticketCode: scannedTicketContext.ticket.code } }),
        );
      }
    } catch {
      notifySite("Ce paiement n’a pas pu être confirmé. Vérifiez vos droits et son état.", {
        kind: "error",
      });
    }
  }

  // Open Email Composer
  function openEmailComposer(
    email: string,
    subject = "",
    body = "",
    options?: {
      category?:
        | "BDE"
        | "ADHESION"
        | "EVENEMENTS"
        | "BOUTIQUE"
        | "INFORMATIONS_GENERALES"
        | "TRANSACTIONNEL";
      showTemplates?: boolean;
    },
  ) {
    setEmailDefaultRecipient(email);
    setEmailDefaultSubject(subject);
    setEmailDefaultBody(body);
    setEmailDefaultCategory(options?.category ?? "BDE");
    setEmailShowTemplates(options?.showTemplates ?? true);
    setEmailModalOpen(true);
  }

  function openEventEditor(event: Ae2vEvent) {
    setEditingEvent(event);
    setSelectedEventDetail(null);
    setEventFormOpen(true);
  }

  async function saveCandidaturePatch(
    candidatureId: string,
    patch: Partial<Pick<Candidature, "status" | "internalNotes">>,
  ) {
    if (isRemoteSession) {
      const updated = await updateCandidatureRemote({
        data: {
          candidatureId,
          ...(patch.status ? { status: patch.status } : {}),
          ...(patch.internalNotes !== undefined ? { internalNotes: patch.internalNotes } : {}),
        },
      });
      setServerCandidatures((current) =>
        current.map((candidate) =>
          candidate.id === candidatureId
            ? { ...candidate, ...updated, status: updated.status as Candidature["status"] }
            : candidate,
        ),
      );
      return;
    }
    updateCandidature(candidatureId, patch);
  }

  const openContactMessage = useCallback(
    async (message: ContactMessage) => {
      setSelectedContactMessage(message);
      if (serverMessages.some((candidate) => candidate.id === message.id)) {
        try {
          const updated = await markContactMessageRead({
            data: { messageId: message.id },
          });
          setServerMessages((current) =>
            current.map((candidate) => (candidate.id === message.id ? updated.message : candidate)),
          );
          setSelectedContactMessage(updated.message);
        } catch {
          // La lecture reste visible même si la mise à jour distante échoue.
        }
      } else {
        if (message.status === "NOUVEAU") updateMessageStatus(message.id, "LU");
        setSelectedContactMessage({
          ...message,
          status: message.status === "NOUVEAU" ? "LU" : message.status,
          readByMe: true,
          readByCount: Math.max(message.readByCount ?? 0, 1),
          readByOtherCount: message.readByOtherCount ?? 0,
        });
      }
    },
    [markContactMessageRead, serverMessages, updateMessageStatus],
  );

  async function changeContactMessageStatus(
    message: ContactMessage,
    status: ContactMessage["status"],
  ) {
    try {
      if (isRemoteSession && serverMessages.some((candidate) => candidate.id === message.id)) {
        const updated = await updateContactMessage({
          data: { messageId: message.id, status },
        });
        setServerMessages((current) =>
          current.map((candidate) => (candidate.id === message.id ? updated.message : candidate)),
        );
        setSelectedContactMessage(updated.message);
      } else {
        updateMessageStatus(message.id, status);
        setSelectedContactMessage({ ...message, status });
      }
    } catch {
      notifySite("L’état du message n’a pas pu être enregistré.", { kind: "error" });
    }
  }

  function personIdForEmail(email: string): string | null {
    const normalized = email.trim().toLowerCase();
    return (
      serverMembers.find((member) => member.email.trim().toLowerCase() === normalized)?.id ??
      safeDossiers.find((dossier) => dossier.email.trim().toLowerCase() === normalized)?.personId ??
      null
    );
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dossierId = params.get("dossier");
    const candidatureId = params.get("candidature");
    const messageId = params.get("message");
    if (dossierId) {
      if (handledShareRef.current === `dossier:${dossierId}`) return;
      const dossier = safeDossiers.find((item) => item.id === dossierId);
      if (dossier) {
        handledShareRef.current = `dossier:${dossierId}`;
        setMainSection("demandes");
        setDemandesTab("adhesions");
        setSelectedDossier(dossier);
      }
    } else if (candidatureId) {
      if (handledShareRef.current === `candidature:${candidatureId}`) return;
      const candidature = safeCandidatures.find((item) => item.id === candidatureId);
      if (candidature) {
        handledShareRef.current = `candidature:${candidatureId}`;
        setMainSection("demandes");
        setDemandesTab("candidatures");
        setSelectedCandidature(candidature);
        setCandidatureNoteInput(candidature.internalNotes ?? "");
      }
    } else if (messageId) {
      if (handledShareRef.current === `message:${messageId}`) return;
      const message = displayMessages.find((item) => item.id === messageId);
      if (message) {
        handledShareRef.current = `message:${messageId}`;
        setMainSection("demandes");
        setDemandesTab("messages");
        void openContactMessage(message);
      }
    }
  }, [displayMessages, openContactMessage, safeCandidatures, safeDossiers]);

  if (
    ready &&
    sessionResolved &&
    (!account || !["bureau", "bureau_admin"].includes(account.role))
  ) {
    return (
      <main className="min-h-screen bg-ae2v-offwhite py-16">
        <Section
          title="Accès Bureau requis"
          intro="Cette interface est réservée aux membres autorisés du bureau AE2V."
        >
          <Button asChild variant="black">
            <Link to="/connexion">Se connecter</Link>
          </Button>
        </Section>
      </main>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="Gouvernance & Opérations"
        title="Bureau AE2V"
        intro={`Espace de gestion interne du bureau. Connecté en tant que ${account ? `${account.firstName} ${account.lastName}` : "Membre bureau"} (${account?.role ? roleLabels[account.role] : "Officier"}).`}
      />

      <section className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
        {/* Navigation Principale par Grandes Sections */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mb-8">
          <button
            type="button"
            onClick={() => setMainSection("dashboard")}
            className={`border-2 border-ae2v-black p-5 text-left transition-colors ${
              mainSection === "dashboard"
                ? "bg-ae2v-red text-white"
                : "bg-card text-ae2v-black hover:bg-ae2v-black hover:text-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <LayoutDashboard className="size-6" />
              <span className="text-[0.65rem] font-bold uppercase tracking-widest border border-current px-2 py-0.5">
                Vue générale
              </span>
            </div>
            <h2 className="font-impact text-xl uppercase mt-3">Dashboard</h2>
            <p className="mt-1 text-xs opacity-80">Priorités et activité du bureau</p>
          </button>
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
                {displayMessages.filter((m) => m.status === "NOUVEAU").length +
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
                {validatedMembers.length} adhérents
              </span>
            </div>
            <h2 className="font-impact text-xl uppercase mt-3">Adhérents & membres du bureau</h2>
            <p className="mt-1 text-xs opacity-80">Adhérents validés & membres du bureau</p>
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
        {/* DASHBOARD                                                          */}
        {/* ------------------------------------------------------------------ */}
        {mainSection === "dashboard" && (
          <div className="space-y-6">
            <div className="border-2 border-ae2v-black bg-ae2v-black p-6 text-ae2v-offwhite">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-ae2v-green">
                À traiter maintenant
              </p>
              <h2 className="mt-2 font-impact text-3xl uppercase">Pilotage du bureau</h2>
              <p className="mt-2 max-w-2xl text-sm text-ae2v-offwhite/75">
                Une vue courte des actions prioritaires. Ouvre une section pour traiter les
                dossiers, paiements, messages ou inscriptions sans perdre le contexte.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <button
                type="button"
                onClick={() => setMainSection("demandes")}
                className="border-2 border-ae2v-black bg-card p-5 text-left hover:bg-ae2v-green"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Demandes ouvertes
                </p>
                <p className="mt-2 font-impact text-4xl">
                  {
                    safeDossiers.filter(
                      (d) => d.status === "EN_ATTENTE" || d.status === "A_CORRIGER",
                    ).length
                  }
                </p>
                <p className="mt-1 text-xs">Adhésions à examiner</p>
              </button>
              <button
                type="button"
                onClick={() => setMainSection("demandes")}
                className="border-2 border-ae2v-black bg-card p-5 text-left hover:bg-ae2v-green"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Messages non traités
                </p>
                <p className="mt-2 font-impact text-4xl">
                  {displayMessages.filter((m) => m.status !== "TRAITE").length}
                </p>
                <p className="mt-1 text-xs">À lire ou à traiter</p>
              </button>
              <button
                type="button"
                onClick={() => setMainSection("demandes")}
                className="border-2 border-ae2v-black bg-card p-5 text-left hover:bg-ae2v-green"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Cotisations en attente
                </p>
                <p className="mt-2 font-impact text-4xl">{pendingContributions.length}</p>
                <p className="mt-1 text-xs">Paiements à confirmer</p>
              </button>
              <button
                type="button"
                onClick={() => setMainSection("personnes")}
                className="border-2 border-ae2v-black bg-ae2v-green p-5 text-left hover:bg-ae2v-red hover:text-white"
              >
                <p className="text-xs font-bold uppercase tracking-wider">Adhérents validés</p>
                <p className="mt-2 font-impact text-4xl">{validatedMembers.length}</p>
                <p className="mt-1 text-xs">Accéder aux profils</p>
              </button>
            </div>
          </div>
        )}

        {selectedEventDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ae2v-black/60 p-4 backdrop-blur-sm sm:p-6">
            <div className="my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col overflow-hidden border-2 border-ae2v-black bg-card shadow-2xl sm:max-h-[calc(100dvh-3rem)]">
              <div className="mb-5 flex shrink-0 items-start justify-between gap-4 border-b-2 border-ae2v-black px-6 pb-3 pt-6">
                <div>
                  <p className="text-xs font-bold uppercase text-ae2v-red">Fiche événement</p>
                  <h3 className="font-impact text-3xl uppercase">{selectedEventDetail.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedEventDetail.kind} · {eventStatusLabels[selectedEventDetail.status]}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEventDetail(null)}
                  aria-label="Fermer la fiche événement"
                  className="tap-44 border-2 border-ae2v-black p-2"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Date", selectedEventDetail.date],
                    ["Horaires", selectedEventDetail.doors],
                    ["Lieu", selectedEventDetail.place],
                    ["Adresse", selectedEventDetail.address],
                    ["Ouverture", selectedEventDetail.registrationOpensAt],
                    ["Clôture", selectedEventDetail.registrationClosesAt],
                    [
                      "Jauge",
                      `${selectedEventDetail.registered} / ${selectedEventDetail.capacity}`,
                    ],
                    ["Liste d’attente", selectedEventDetail.waitlist ? "Activée" : "Désactivée"],
                  ].map(([label, value]) => (
                    <div key={label} className="border-2 border-ae2v-black/15 bg-ae2v-offwhite p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[0.65rem] font-bold uppercase text-muted-foreground">
                          {label}
                        </p>
                        <button
                          type="button"
                          className="text-[0.6rem] font-bold uppercase text-ae2v-red underline underline-offset-2"
                          onClick={() => openEventEditor(selectedEventDetail)}
                        >
                          Modifier
                        </button>
                      </div>
                      <p className="mt-1 text-sm font-bold">{value || "À déterminer"}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="space-y-3 border-2 border-ae2v-black/15 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase">Contenu de l’événement</p>
                      <button
                        type="button"
                        className="text-[0.6rem] font-bold uppercase text-ae2v-red underline underline-offset-2"
                        onClick={() => openEventEditor(selectedEventDetail)}
                      >
                        Modifier
                      </button>
                    </div>
                    <InfoRow label="Résumé" value={selectedEventDetail.summary || "À déterminer"} />
                    <InfoRow
                      label="Description"
                      value={selectedEventDetail.description || "À déterminer"}
                    />
                    <InfoRow label="Accès" value={selectedEventDetail.access || "À déterminer"} />
                    <InfoRow
                      label="Informations pratiques"
                      value={selectedEventDetail.practical.join(" · ") || "À déterminer"}
                    />
                    <InfoRow
                      label="Visuel"
                      value={selectedEventDetail.image ? "Configuré" : "Aucun visuel"}
                    />
                    <div className="overflow-hidden border-2 border-ae2v-black/15 bg-ae2v-black/5">
                      {selectedEventDetail.image ? (
                        <img
                          src={selectedEventDetail.image}
                          alt={`Visuel de ${selectedEventDetail.title}`}
                          className="h-32 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-32 items-center justify-center text-xs font-bold uppercase text-muted-foreground">
                          Aucun visuel · placeholder AE2V
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3 border-2 border-ae2v-black/15 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase">Tarifs</p>
                      <button
                        type="button"
                        className="text-[0.6rem] font-bold uppercase text-ae2v-red underline underline-offset-2"
                        onClick={() => openEventEditor(selectedEventDetail)}
                      >
                        Modifier
                      </button>
                    </div>
                    {selectedEventDetail.tiers.map((tier) => (
                      <div
                        key={tier.id}
                        className="flex items-start justify-between gap-3 border-b border-ae2v-black/15 pb-2 text-sm last:border-0"
                      >
                        <span>
                          <strong>{tier.label}</strong>
                          {tier.disabled && (
                            <span className="ml-2 text-xs text-muted-foreground">désactivé</span>
                          )}
                          {tier.note && (
                            <span className="block text-xs text-muted-foreground">{tier.note}</span>
                          )}
                        </span>
                        <span className="font-bold">
                          {tier.priceCents ? formatCents(tier.priceCents) : "Gratuit"}
                        </span>
                      </div>
                    ))}
                    {!selectedEventDetail.tiers.length && (
                      <p className="text-sm">Aucun tarif configuré.</p>
                    )}
                  </div>
                </div>

                {selectedEventDetail.program.length > 0 && (
                  <div className="mt-4 border-2 border-ae2v-black/15 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase">Programme</p>
                      <button
                        type="button"
                        className="text-[0.6rem] font-bold uppercase text-ae2v-red underline underline-offset-2"
                        onClick={() => openEventEditor(selectedEventDetail)}
                      >
                        Modifier
                      </button>
                    </div>
                    <div className="mt-2 space-y-2">
                      {selectedEventDetail.program.map((item, index) => (
                        <p key={`${item.time}-${index}`} className="text-sm">
                          <strong>{item.time || ""}</strong>
                          {item.label ? ` · ${item.label}` : ""}
                          {item.detail ? ` — ${item.detail}` : ""}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {(selectedEventDetail.customSections ?? []).length > 0 && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2 flex items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase">Sections personnalisées</p>
                      <button
                        type="button"
                        className="text-[0.6rem] font-bold uppercase text-ae2v-red underline underline-offset-2"
                        onClick={() => openEventEditor(selectedEventDetail)}
                      >
                        Modifier
                      </button>
                    </div>
                    {(selectedEventDetail.customSections ?? []).map((section, index) => (
                      <div
                        key={`${section.title}-${index}`}
                        className="border-2 border-ae2v-black/15 p-4"
                      >
                        <p className="text-xs font-bold uppercase">{section.title}</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm">{section.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t-2 border-ae2v-black px-6 pb-6 pt-4">
                <Button variant="outline" onClick={() => openEventAttendees(selectedEventDetail)}>
                  <Users className="size-4" /> Voir les participants
                </Button>
                <Button
                  variant="black"
                  onClick={() => {
                    setEditingEvent(selectedEventDetail);
                    setSelectedEventDetail(null);
                    setEventFormOpen(true);
                  }}
                >
                  <Edit className="size-4" /> Éditer l’événement
                </Button>
              </div>
            </div>
          </div>
        )}

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
                  placeholder="Ex. AE2V-2026-TK-9X82 ou prenom.nom@etu.uvsq.fr"
                  className="flex-1 min-h-[44px] border-2 border-ae2v-black bg-ae2v-offwhite px-4 font-mono text-sm outline-none focus-visible:border-ae2v-red"
                />
                <Button onClick={() => handleExecuteScan()} size="lg">
                  Rechercher / Scanner
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  onClick={() => setCameraOpen((open) => !open)}
                >
                  <Camera className="size-4" />{" "}
                  {cameraOpen ? "Fermer la caméra" : "Ouvrir la caméra"}
                </Button>
              </div>
              {isRemoteSession && !serverMembersLoaded && (
                <p className="mt-3 max-w-xl text-xs font-bold uppercase text-muted-foreground">
                  Chargement des adhérents…
                </p>
              )}

              {cameraOpen && (
                <div className="mt-4 max-w-xl border-2 border-ae2v-black bg-ae2v-offwhite p-3">
                  <video
                    ref={videoRef}
                    className="aspect-video w-full bg-ae2v-black object-cover"
                    muted
                    playsInline
                    aria-label="Aperçu de la caméra pour scanner un code"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Placez le code dans le cadre. Le résultat sera copié dans le champ ; vérifiez-le
                    avant de lancer la recherche.
                  </p>
                </div>
              )}
              {cameraError && (
                <p role="alert" className="mt-3 max-w-xl text-xs font-bold text-ae2v-red">
                  {cameraError}
                </p>
              )}

              {searchSuggestions.length > 0 && (
                <div className="mt-4 max-w-xl border-2 border-ae2v-red bg-ae2v-offwhite p-4 text-ae2v-black">
                  <p className="text-xs font-bold uppercase tracking-wider">
                    Résultats proches — sélectionne la bonne personne
                  </p>
                  <div className="mt-3 grid gap-2">
                    {searchSuggestions.map((suggestion) => (
                      <button
                        key={`${suggestion.id}-${suggestion.code}`}
                        type="button"
                        className="flex min-h-11 items-center justify-between border-2 border-ae2v-black/20 px-3 text-left text-sm hover:bg-ae2v-green"
                        onClick={() => {
                          setScanCodeInput(suggestion.code);
                          handleExecuteScan(suggestion.code);
                        }}
                      >
                        <span>{suggestion.label}</span>
                        <span className="font-mono text-xs">Sélectionner</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {scannedTicketContext && (
              <div className="border-2 border-ae2v-black bg-ae2v-black p-5 text-ae2v-offwhite">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-ae2v-green">
                      Billet identifié
                    </p>
                    <h3 className="mt-1 font-impact text-2xl uppercase">
                      {scannedTicketContext.ticket.eventTitle}
                    </h3>
                    <p className="mt-1 text-sm text-ae2v-offwhite/75">
                      {scannedTicketContext.ticket.eventDate} ·{" "}
                      {scannedTicketContext.ticket.eventPlace}
                    </p>
                    <p className="mt-2 font-mono text-xs">{scannedTicketContext.ticket.code}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill
                      tone={
                        scannedTicketContext.ticket.status === "valide"
                          ? "green"
                          : scannedTicketContext.ticket.status === "en_attente_paiement"
                            ? "yellow"
                            : "black"
                      }
                    >
                      {scannedTicketContext.ticket.status === "valide"
                        ? "Paiement confirmé"
                        : scannedTicketContext.ticket.status === "en_attente_paiement"
                          ? "Paiement en attente"
                          : scannedTicketContext.ticket.status === "utilise"
                            ? "Déjà utilisé"
                            : "Annulé"}
                    </StatusPill>
                    {scannedTicketContext.ticket.status === "valide" && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => void validateScannedTicket()}
                      >
                        <CheckCircle2 className="size-4" /> Valider l’entrée
                      </Button>
                    )}
                    {scannedTicketContext.ticket.status === "en_attente_paiement" &&
                      scannedTicketContext.ticket.paymentId && (
                        <Button
                          size="sm"
                          variant="default"
                          disabled={!canFinance}
                          title={!canFinance ? "Droits trésorerie requis" : undefined}
                          onClick={() =>
                            void confirmScannedPayment(scannedTicketContext.ticket.paymentId!)
                          }
                        >
                          <CreditCard className="size-4" /> Confirmer le paiement
                        </Button>
                      )}
                    {scannedTicketContext.ticket.invoiceId && (
                      <Button asChild size="sm" variant="outline">
                        <Link
                          to="/bureau"
                          search={{ invoiceId: scannedTicketContext.ticket.invoiceId }}
                          hash="gestion"
                        >
                          <Receipt className="size-4" /> Voir la facture
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
                {(scannedTicketContext.person || scannedTicketContext.ticket.participantName) && (
                  <p className="mt-4 border-t border-ae2v-offwhite/20 pt-3 text-sm">
                    Personne rattachée :{" "}
                    <strong>
                      {scannedTicketContext.person
                        ? `${scannedTicketContext.person.firstName} ${scannedTicketContext.person.lastName}`
                        : scannedTicketContext.ticket.participantName}
                    </strong>{" "}
                    · {scannedTicketContext.person?.email ?? scannedTicketContext.ticket.userEmail}
                  </p>
                )}
              </div>
            )}

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
                      disabled={!canFinance}
                      title={!canFinance ? "Droits trésorerie requis" : undefined}
                      onClick={() =>
                        (() => {
                          const pendingCotisation = scannedServerPerson?.payments.find(
                            (payment) =>
                              payment.status === "EN_ATTENTE" &&
                              /COTISATION|ADHESION/i.test(payment.kind),
                          );
                          setPayModalConfig({
                            customerName: `${scannedPerson.firstName} ${scannedPerson.lastName}`,
                            customerEmail: scannedPerson.email,
                            description: "Cotisation annuelle AE2V 2026-2027",
                            priceCents: pendingCotisation?.amountCents ?? 1200,
                            ...(pendingCotisation
                              ? { pendingPaymentId: pendingCotisation.id }
                              : {}),
                            onSuccessPay: () => {
                              addAuditLog(
                                "COTISATION_VALIDEE",
                                `Cotisation validée pour ${scannedPerson.firstName}`,
                              );
                              if (scannedServerPerson) {
                                void getPerson360({
                                  data: { personId: scannedServerPerson.id },
                                }).then(setScannedServerPerson);
                              }
                            },
                          });
                        })()
                      }
                    >
                      <CreditCard className="size-4" /> Encaisser Cotisation
                    </Button>
                    <Button asChild size="sm" variant="secondary">
                      <Link
                        to="/bureau/personnes/$personId"
                        params={{ personId: scannedPerson.id }}
                      >
                        Voir Fiche Complète
                      </Link>
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
                {scannedServerPerson && (
                  <div className="border-2 border-ae2v-red bg-ae2v-offwhite p-4 text-ae2v-black">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-ae2v-red">
                          Paiements à traiter
                        </p>
                        <p className="mt-1 text-sm">
                          {
                            scannedServerPerson.payments.filter(
                              (payment) => payment.status === "EN_ATTENTE",
                            ).length
                          }{" "}
                          paiement(s) en attente · les confirmations génèrent automatiquement les
                          factures.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="black"
                        disabled={
                          !canFinance ||
                          !scannedServerPerson.payments.some(
                            (payment) => payment.status === "EN_ATTENTE",
                          )
                        }
                        title={!canFinance ? "Droits trésorerie requis" : undefined}
                        onClick={() => void confirmScannedPendingPayments()}
                      >
                        <CreditCard className="size-4" /> Confirmer les paiements
                      </Button>
                    </div>
                    {scannedServerPerson.payments.filter(
                      (payment) => payment.status === "EN_ATTENTE",
                    ).length > 0 && (
                      <ul className="mt-4 grid gap-2">
                        {scannedServerPerson.payments
                          .filter((payment) => payment.status === "EN_ATTENTE")
                          .map((payment) => (
                            <li
                              key={payment.id}
                              className="flex flex-wrap items-center justify-between gap-3 border-2 border-ae2v-black/15 bg-white p-3 text-sm"
                            >
                              <span>
                                <strong>{payment.kind}</strong> · {formatCents(payment.amountCents)}{" "}
                                · {payment.paymentMethod ?? "Mode à préciser"}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={!canFinance}
                                title={!canFinance ? "Droits trésorerie requis" : undefined}
                                onClick={() => void confirmScannedPayment(payment.id)}
                              >
                                Confirmer ce paiement
                              </Button>
                            </li>
                          ))}
                      </ul>
                    )}
                    <div className="mt-4 grid gap-2 border-t-2 border-ae2v-black/15 pt-4 sm:grid-cols-3">
                      <Link
                        to="/bureau/personnes/$personId/paiements"
                        params={{ personId: scannedServerPerson.id }}
                        className="flex min-h-11 items-center justify-between border-2 border-ae2v-black bg-white px-3 py-2 text-xs font-bold uppercase hover:bg-ae2v-green"
                      >
                        <span className="flex items-center gap-2">
                          <CreditCard className="size-4" /> Tous les paiements
                        </span>
                        <span>{scannedServerPerson.payments.length}</span>
                      </Link>
                      <Link
                        to="/bureau/personnes/$personId/commandes"
                        params={{ personId: scannedServerPerson.id }}
                        className="flex min-h-11 items-center justify-between border-2 border-ae2v-black bg-white px-3 py-2 text-xs font-bold uppercase hover:bg-ae2v-green"
                      >
                        <span className="flex items-center gap-2">
                          <ShoppingBag className="size-4" /> Commandes
                        </span>
                        <span>{scannedServerPerson.orders.length}</span>
                      </Link>
                      <Link
                        to="/bureau/personnes/$personId/factures"
                        params={{ personId: scannedServerPerson.id }}
                        className="flex min-h-11 items-center justify-between border-2 border-ae2v-black bg-white px-3 py-2 text-xs font-bold uppercase hover:bg-ae2v-green"
                      >
                        <span className="flex items-center gap-2">
                          <Receipt className="size-4" /> Factures / remboursements
                        </span>
                        <span>{scannedServerPerson.invoices.length}</span>
                      </Link>
                    </div>
                  </div>
                )}
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
                Messages ({displayMessages.filter((m) => m.status === "NOUVEAU").length} nouveaux)
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
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex min-h-10 items-center gap-2 border-2 border-ae2v-black bg-card px-3 py-2 text-xs font-bold uppercase">
                      <input
                        type="checkbox"
                        checked={showTreatedMessages}
                        onChange={(event) => setShowTreatedMessages(event.target.checked)}
                        className="size-4 accent-ae2v-red"
                      />
                      Afficher les traités
                    </label>
                    <Button size="sm" variant="default" onClick={() => openEmailComposer("")}>
                      <Send className="size-4" /> Rédiger un e-mail BDE
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid gap-2 border-2 border-ae2v-black bg-ae2v-offwhite p-3 sm:grid-cols-2 lg:grid-cols-6">
                    <label className="text-xs font-bold uppercase">
                      Recherche avancée
                      <input
                        type="search"
                        value={messageSearch}
                        onChange={(event) => setMessageSearch(event.target.value)}
                        placeholder="Nom, e-mail, sujet ou contenu…"
                        className="mt-1 min-h-10 w-full border-2 border-ae2v-black bg-card px-3 text-sm font-normal"
                      />
                    </label>
                    <label className="text-xs font-bold uppercase">
                      État
                      <select
                        value={messageStatusFilter}
                        onChange={(event) =>
                          setMessageStatusFilter(event.target.value as typeof messageStatusFilter)
                        }
                        className="mt-1 min-h-10 border-2 border-ae2v-black bg-card px-3 text-xs"
                      >
                        <option value="TOUS">Tous</option>
                        <option value="NOUVEAU">Nouveaux</option>
                        <option value="LU">Lus</option>
                        <option value="TRAITE">Traités</option>
                      </select>
                    </label>
                    <label className="text-xs font-bold uppercase">
                      Lecture
                      <select
                        value={messageReadFilter}
                        onChange={(event) =>
                          setMessageReadFilter(event.target.value as typeof messageReadFilter)
                        }
                        className="mt-1 min-h-10 border-2 border-ae2v-black bg-card px-3 text-xs"
                      >
                        <option value="TOUS">Toutes</option>
                        <option value="NON_LUS_PAR_MOI">Non lus par moi</option>
                        <option value="LUS_PAR_AUTRE">Lus par un autre membre</option>
                      </select>
                    </label>
                    <label className="text-xs font-bold uppercase">
                      Du
                      <input
                        type="date"
                        value={messageDateFrom}
                        onChange={(event) => setMessageDateFrom(event.target.value)}
                        className="mt-1 min-h-10 w-full border-2 border-ae2v-black bg-card px-3 text-xs font-normal"
                      />
                    </label>
                    <label className="text-xs font-bold uppercase">
                      Au
                      <input
                        type="date"
                        value={messageDateTo}
                        onChange={(event) => setMessageDateTo(event.target.value)}
                        className="mt-1 min-h-10 w-full border-2 border-ae2v-black bg-card px-3 text-xs font-normal"
                      />
                    </label>
                    <label className="text-xs font-bold uppercase">
                      Tri
                      <select
                        value={messageSort}
                        onChange={(event) =>
                          setMessageSort(event.target.value as typeof messageSort)
                        }
                        className="mt-1 min-h-10 w-full border-2 border-ae2v-black bg-card px-3 text-xs"
                      >
                        <option value="RECENT">Plus récents</option>
                        <option value="ANCIEN">Plus anciens</option>
                      </select>
                    </label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="self-end"
                      onClick={() => {
                        setMessageSearch("");
                        setMessageStatusFilter("TOUS");
                        setMessageReadFilter("TOUS");
                        setMessageDateFrom("");
                        setMessageDateTo("");
                        setMessageSort("RECENT");
                      }}
                    >
                      Réinitialiser
                    </Button>
                  </div>
                  {displayMessages
                    .filter((msg) => showTreatedMessages || msg.status !== "TRAITE")
                    .filter(
                      (msg) => messageStatusFilter === "TOUS" || msg.status === messageStatusFilter,
                    )
                    .filter((msg) => {
                      if (messageReadFilter === "NON_LUS_PAR_MOI") return !msg.readByMe;
                      if (messageReadFilter === "LUS_PAR_AUTRE")
                        return Boolean(msg.readByOtherCount);
                      return true;
                    })
                    .filter((msg) => {
                      const query = messageSearch.trim().toLocaleLowerCase("fr-FR");
                      if (!query) return true;
                      return [msg.name, msg.email, msg.sujet, msg.message].some((value) =>
                        value.toLocaleLowerCase("fr-FR").includes(query),
                      );
                    })
                    .filter((msg) => {
                      const date = msg.sentAt.slice(0, 10);
                      return (
                        (!messageDateFrom || date >= messageDateFrom) &&
                        (!messageDateTo || date <= messageDateTo)
                      );
                    })
                    .sort((a, b) => {
                      const left = Date.parse(a.sentAt);
                      const right = Date.parse(b.sentAt);
                      return messageSort === "RECENT" ? right - left : left - right;
                    })
                    .map((msg) => (
                      <div
                        key={msg.id}
                        role="button"
                        tabIndex={0}
                        aria-label={`Ouvrir le message ${msg.sujet}`}
                        className="cursor-pointer border-2 border-ae2v-black bg-card px-3 py-2 flex items-center justify-between gap-3 hover:bg-ae2v-green/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ae2v-red"
                        onClick={() => void openContactMessage(msg)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            void openContactMessage(msg);
                          }
                        }}
                      >
                        <div className="min-w-0 flex items-center gap-3">
                          <span className="truncate font-bold text-sm">{msg.sujet}</span>
                          <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                            {msg.name} · {msg.email}
                          </span>
                          <StatusPill tone={msg.status === "NOUVEAU" ? "red" : "neutral"}>
                            {contactMessageStatusLabels[msg.status] ?? msg.status}
                          </StatusPill>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(event) => {
                            event.stopPropagation();
                            void openContactMessage(msg);
                          }}
                        >
                          <Eye className="size-3.5" /> Voir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          aria-label="Copier le lien direct du message"
                          className={
                            copiedShareLink === `message:${msg.id}`
                              ? "bg-blue-600 text-white"
                              : undefined
                          }
                          onClick={(event) => {
                            event.stopPropagation();
                            void copyBureauShareLink("message", msg.id);
                          }}
                        >
                          <Link2 className="size-3.5" />
                          {copiedShareLink === `message:${msg.id}` ? "Copié" : "Lien"}
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Demandes > Adhésions */}
            {demandesTab === "adhesions" && (
              <div className="space-y-4">
                <label className="inline-flex min-h-10 items-center gap-2 border-2 border-ae2v-black bg-card px-3 text-xs font-bold uppercase">
                  <input
                    type="checkbox"
                    checked={showValidatedMemberships}
                    onChange={(event) => setShowValidatedMemberships(event.target.checked)}
                    className="size-4 accent-ae2v-red"
                  />
                  Afficher aussi les adhésions validées/refusées
                </label>
                <DataTable
                  rows={safeDossiers.filter(
                    (dossier) =>
                      showValidatedMemberships ||
                      dossier.status === "EN_ATTENTE" ||
                      dossier.status === "A_CORRIGER",
                  )}
                  onRowClick={(dossier) => setSelectedDossier(dossier)}
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
                        <StatusPill tone={membershipTone[d.status]}>
                          {membershipStatusLabels[d.status]}
                        </StatusPill>
                      ),
                    },
                    {
                      key: "actions",
                      header: "Actions",
                      render: (d) => (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            aria-label="Copier le lien direct de la demande"
                            className={
                              copiedShareLink === `dossier:${d.id}`
                                ? "bg-blue-600 text-white"
                                : undefined
                            }
                            onClick={(event) => {
                              event.stopPropagation();
                              void copyBureauShareLink("dossier", d.id);
                            }}
                          >
                            <Link2 className="size-3.5" />
                            {copiedShareLink === `dossier:${d.id}` ? "Copié" : "Lien"}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setSelectedDossier(d)}
                          >
                            <Eye className="size-3.5" /> Ouvrir
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
                      render: (d) => {
                        const member = serverMembers.find(
                          (candidate) => candidate.email.toLowerCase() === d.email.toLowerCase(),
                        );
                        const pendingPayment = member?.payments.find(
                          (payment) =>
                            payment.status === "EN_ATTENTE" &&
                            /COTISATION|ADHESION/i.test(payment.kind),
                        );
                        return (
                          <div className="flex flex-wrap gap-2">
                            <Button asChild size="sm" variant="outline">
                              <Link
                                to="/bureau/personnes/$personId"
                                params={{ personId: d.personId ?? d.id }}
                              >
                                <UserCheck className="size-3.5" /> Voir le profil
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              disabled={!canFinance}
                              title={!canFinance ? "Droits trésorerie requis" : undefined}
                              onClick={() =>
                                setPayModalConfig({
                                  customerName: `${d.firstName} ${d.lastName}`,
                                  customerEmail: d.email,
                                  description: `Cotisation Annuelle Adhérent ${d.id}`,
                                  priceCents: pendingPayment?.amountCents ?? d.contributionCents,
                                  ...(pendingPayment
                                    ? { pendingPaymentId: pendingPayment.id }
                                    : {}),
                                  onSuccessPay: () => {
                                    updateDossier(d.id, { contributionStatus: "COTISANT" });
                                    if (isRemoteSession) {
                                      void getBureauMembers({
                                        data:
                                          memberSchoolYearFilter === "TOUS"
                                            ? {}
                                            : { schoolYear: memberSchoolYearFilter },
                                      })
                                        .then(setServerMembers)
                                        .catch(() => undefined);
                                    }
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
                          </div>
                        );
                      },
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
                  onRowClick={(candidature) => {
                    setSelectedCandidature(candidature);
                    setCandidatureNoteInput(candidature.internalNotes ?? "");
                  }}
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
                            variant="outline"
                            aria-label="Copier le lien direct de la candidature"
                            className={
                              copiedShareLink === `candidature:${c.id}`
                                ? "bg-blue-600 text-white"
                                : undefined
                            }
                            onClick={(event) => {
                              event.stopPropagation();
                              void copyBureauShareLink("candidature", c.id);
                            }}
                          >
                            <Link2 className="size-3.5" />
                            {copiedShareLink === `candidature:${c.id}` ? "Copié" : "Lien"}
                          </Button>
                          <Button
                            size="sm"
                            variant="black"
                            onClick={() => {
                              setSelectedCandidature(c);
                              setCandidatureNoteInput(c.internalNotes ?? "");
                            }}
                          >
                            <Eye className="size-3.5" /> Ouvrir la candidature
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
        {/* SECTION 3: PERSONNES (Adhérents & Membres du bureau)              */}
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
                Adhérents ({validatedMembers.length})
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
                Membres du bureau ({safeTeamMembers.length})
              </button>

              <button
                type="button"
                onClick={() => setPersonnesTab("emails")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 border-ae2v-black transition-colors ${
                  personnesTab === "emails"
                    ? "bg-ae2v-red text-white border-ae2v-red"
                    : "bg-card text-ae2v-black hover:bg-ae2v-black hover:text-white"
                }`}
              >
                Listes e-mail ({serverEmailRows.length})
              </button>
            </div>

            {personnesTab === "membres_valides" && (
              <DataTable
                rows={validatedMembers.filter(
                  (member) =>
                    (memberSchoolYearFilter === "TOUS" ||
                      member.schoolYear === memberSchoolYearFilter) &&
                    (membershipFilter === "TOUS" || member.membershipStatus === membershipFilter) &&
                    (contribFilter === "TOUS" || member.contributionStatus === contribFilter) &&
                    (paymentFilter === "TOUS" ||
                      (paymentFilter === "AUCUN"
                        ? member.payments.length === 0
                        : member.payments.some((payment) => payment.status === paymentFilter))),
                )}
                filters={
                  <>
                    <TableFilter
                      id="personnes-school-year"
                      label="Année"
                      value={memberSchoolYearFilter}
                      onChange={setMemberSchoolYearFilter}
                      options={[
                        { value: "TOUS", label: "Toutes les années" },
                        { value: "2026-2027", label: "2026–2027" },
                        { value: "2025-2026", label: "2025–2026" },
                      ]}
                    />
                    <TableFilter
                      id="personnes-membership-status"
                      label="Adhésion"
                      value={membershipFilter}
                      onChange={setMembershipFilter}
                      options={[
                        { value: "TOUS", label: "Tous les statuts" },
                        { value: "VALIDE", label: "Validée" },
                        { value: "EN_ATTENTE", label: "En attente" },
                        { value: "A_CORRIGER", label: "Correction demandée" },
                        { value: "REFUSE", label: "Refusée" },
                      ]}
                    />
                    <TableFilter
                      id="personnes-contribution-status"
                      label="Cotisation"
                      value={contribFilter}
                      onChange={setContribFilter}
                      options={[
                        { value: "TOUS", label: "Tous les statuts" },
                        { value: "COTISANT", label: "Payée" },
                        { value: "PAIEMENT_EN_ATTENTE", label: "En attente" },
                        { value: "NON_COTISANT", label: "Non cotisant" },
                      ]}
                    />
                    <TableFilter
                      id="personnes-payment-status"
                      label="Paiements"
                      value={paymentFilter}
                      onChange={setPaymentFilter}
                      options={[
                        { value: "TOUS", label: "Tous les paiements" },
                        { value: "EN_ATTENTE", label: "Paiement en attente" },
                        { value: "CONFIRME", label: "Paiement confirmé" },
                        { value: "PARTIELLEMENT_REMBOURSE", label: "Remboursement partiel" },
                        { value: "REMBOURSE", label: "Remboursé" },
                        { value: "AUCUN", label: "Aucun paiement" },
                      ]}
                    />
                  </>
                }
                emptyLabel={
                  isRemoteSession && !serverMembersLoaded
                    ? "Chargement des adhérents…"
                    : "Aucun adhérent ne correspond aux filtres."
                }
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
                      <StatusPill
                        tone={
                          contributionTone[m.contributionStatus as keyof typeof contributionTone] ??
                          "neutral"
                        }
                      >
                        {m.contributionStatus}
                      </StatusPill>
                    ),
                  },
                  {
                    key: "membership",
                    header: "Adhésion",
                    render: (m) => (
                      <StatusPill
                        tone={
                          membershipTone[m.membershipStatus as keyof typeof membershipTone] ??
                          "neutral"
                        }
                      >
                        {m.membershipStatus}
                      </StatusPill>
                    ),
                  },
                  {
                    key: "activity",
                    header: "Activité liée",
                    render: (m) => (
                      <span className="text-xs">
                        {m.payments.length} paiement{m.payments.length > 1 ? "s" : ""} ·{" "}
                        {m.orderCount} commande
                        {m.orderCount > 1 ? "s" : ""} · {m.invoiceCount} facture
                        {m.invoiceCount > 1 ? "s" : ""}
                      </span>
                    ),
                  },
                  {
                    key: "action",
                    header: "Fiche",
                    render: (m) => (
                      <Button asChild size="sm" variant="black">
                        <Link to="/bureau/personnes/$personId" params={{ personId: m.id }}>
                          <Eye className="size-3.5" /> Fiche adhérent
                        </Link>
                      </Button>
                    ),
                  },
                ]}
                searchable={(m) =>
                  [
                    m.firstName,
                    m.lastName,
                    m.email,
                    m.departement,
                    m.niveau,
                    m.schoolYear,
                    m.membershipStatus,
                    m.contributionStatus,
                    m.roleTitle ?? "",
                    m.poles.join(" · "),
                    m.dossier?.studentId ?? "",
                    m.dossier?.phone ?? "",
                    m.dossier?.groupe ?? "",
                  ].join(" ")
                }
                allowColumnSelection
                renderDetails={(m) => (
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <div>
                      <h3 className="font-impact text-lg uppercase">Informations du formulaire</h3>
                      {m.dossier ? (
                        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                          <InfoRow label="Téléphone" value={m.dossier.phone ?? "Non renseigné"} />
                          <InfoRow
                            label="Identifiant étudiant"
                            value={m.dossier.studentId ?? "Non renseigné"}
                          />
                          <InfoRow label="Groupe" value={m.dossier.groupe ?? "Non renseigné"} />
                          <InfoRow label="Année du dossier" value={m.schoolYear} />
                          <InfoRow
                            label="Volontariat"
                            value={m.dossier.volunteer ?? "Non renseigné"}
                          />
                          <InfoRow
                            label="Droit à l’image"
                            value={m.dossier.imageRight ? "Accordé" : "Non accordé"}
                          />
                          <InfoRow label="Dossier soumis le" value={m.dossier.submittedAt} />
                          <InfoRow
                            label="Dossier validé le"
                            value={m.dossier.validatedAt ?? "Non validé"}
                          />
                          <InfoRow
                            label="RGPD accepté le"
                            value={m.dossier.rgpdAcceptedAt ?? "Non renseigné"}
                          />
                          <InfoRow
                            label="Statuts acceptés le"
                            value={m.dossier.statutsAcceptedAt ?? "Non renseigné"}
                          />
                          <InfoRow
                            label="Centres d’intérêt"
                            value={m.dossier.interests.join(" · ") || "Aucun"}
                          />
                        </dl>
                      ) : (
                        <p className="mt-3 text-sm text-muted-foreground">
                          Formulaire d’origine introuvable pour ce compte.
                        </p>
                      )}
                      {m.dossier?.message ? (
                        <p className="mt-4 whitespace-pre-wrap border-l-4 border-ae2v-red pl-3 text-sm">
                          <strong>Motivation :</strong> {m.dossier.message}
                        </p>
                      ) : null}
                      {m.dossier?.notes ? (
                        <p className="mt-3 whitespace-pre-wrap border-l-4 border-ae2v-green pl-3 text-sm">
                          <strong>Notes Bureau :</strong> {m.dossier.notes}
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <h3 className="font-impact text-lg uppercase">Statuts et suivi</h3>
                      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                        <InfoRow label="Rôle sécurité" value={m.role} />
                        <InfoRow label="Intitulé public" value={m.roleTitle ?? "Membre"} />
                        <InfoRow label="Pôles" value={m.poles.join(" · ") || "À définir"} />
                        <InfoRow
                          label="Préférences email"
                          value={
                            m.emailUnsubscribed
                              ? "Désinscrit de tout"
                              : m.emailPrefs.join(" · ") || "Aucune"
                          }
                        />
                        <InfoRow label="Adhésions" value={String(m.memberships.length)} />
                        <InfoRow label="Billets" value={String(m.ticketCount)} />
                        <InfoRow label="Paiements" value={String(m.payments.length)} />
                        <InfoRow label="Factures" value={String(m.invoiceCount)} />
                      </dl>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="black">
                          <Link to="/bureau/personnes/$personId" params={{ personId: m.id }}>
                            Ouvrir la fiche 360°
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEmailComposer(m.email)}
                        >
                          <Mail className="size-3.5" /> Écrire
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              />
            )}

            {personnesTab === "emails" && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-end justify-between gap-4 border-2 border-ae2v-black bg-card p-4">
                  <div>
                    <h3 className="font-impact text-xl uppercase">Listings e-mail opérationnels</h3>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                      Choisissez une thématique : seuls les adhérents ayant accepté cette catégorie
                      dans « Mes préférences email » et n’ayant pas désactivé les emails sont
                      inclus.
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {EMAIL_CATEGORIES.map((category) => (
                    <div
                      key={category}
                      className={`border-2 p-4 ${
                        emailCategoryFilter === category
                          ? "border-ae2v-red bg-ae2v-red/5"
                          : "border-ae2v-black bg-card"
                      }`}
                    >
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => setEmailCategoryFilter(category)}
                      >
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-ae2v-red">
                          Liste thématique
                        </span>
                        <span className="mt-1 block font-impact text-lg uppercase">
                          {emailCategoryLabel(category)}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          Préférence activée + consentement email conservé
                        </span>
                      </button>
                      <Button
                        size="sm"
                        variant={emailCategoryFilter === category ? "black" : "outline"}
                        className="mt-3 w-full"
                        disabled={emailDownloadingCategory !== null || !isRemoteSession}
                        onClick={() => void downloadThematicEmailList(category)}
                      >
                        <Download className="size-3.5" />
                        {emailDownloadingCategory === category
                          ? "Préparation…"
                          : "Télécharger le CSV"}
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-end justify-between gap-4 border-2 border-ae2v-black bg-card p-4">
                  <div className="flex flex-wrap gap-2">
                    <label className="text-xs font-bold uppercase">
                      Catégorie
                      <select
                        className="mt-1 block min-h-10 border-2 border-ae2v-black bg-ae2v-offwhite px-3 text-sm"
                        value={emailCategoryFilter}
                        onChange={(event) =>
                          setEmailCategoryFilter(event.target.value as EmailCategory)
                        }
                      >
                        {EMAIL_CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {emailCategoryLabel(category)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs font-bold uppercase">
                      Statut adhésion
                      <select
                        className="mt-1 block min-h-10 border-2 border-ae2v-black bg-ae2v-offwhite px-3 text-sm"
                        value={emailMembershipFilter}
                        onChange={(event) => setEmailMembershipFilter(event.target.value)}
                      >
                        <option value="TOUS">Tous les statuts</option>
                        <option value="MEMBRE_VALIDE">Adhérents validés</option>
                        <option value="DEMANDE_SOUMISE">Demandes en attente</option>
                        <option value="A_CORRIGER">Corrections demandées</option>
                        <option value="REFUSE">Refusés</option>
                      </select>
                    </label>
                    <label className="text-xs font-bold uppercase">
                      Formation
                      <select
                        className="mt-1 block min-h-10 border-2 border-ae2v-black bg-ae2v-offwhite px-3 text-sm"
                        value={emailDepartementFilter}
                        onChange={(event) => setEmailDepartementFilter(event.target.value)}
                      >
                        <option value="TOUS">Toutes les formations</option>
                        {Array.from(new Set(serverMembers.map((member) => member.departement)))
                          .sort()
                          .map((departement) => (
                            <option key={departement} value={departement}>
                              {departement}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label className="text-xs font-bold uppercase">
                      Niveau
                      <select
                        className="mt-1 block min-h-10 border-2 border-ae2v-black bg-ae2v-offwhite px-3 text-sm"
                        value={emailNiveauFilter}
                        onChange={(event) => setEmailNiveauFilter(event.target.value)}
                      >
                        <option value="TOUS">Tous les niveaux</option>
                        {Array.from(new Set(serverMembers.map((member) => member.niveau)))
                          .sort()
                          .map((niveau) => (
                            <option key={niveau} value={niveau}>
                              {niveau}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label className="text-xs font-bold uppercase">
                      Souhaite aider sur les événements
                      <select
                        className="mt-1 block min-h-10 border-2 border-ae2v-black bg-ae2v-offwhite px-3 text-sm"
                        value={emailVolunteerFilter}
                        onChange={(event) => setEmailVolunteerFilter(event.target.value)}
                      >
                        <option value="TOUS">Toutes les réponses</option>
                        <option value="oui">Oui</option>
                        <option value="peut-etre">Peut-être</option>
                        <option value="non">Non</option>
                      </select>
                    </label>
                    <Button
                      size="sm"
                      variant="black"
                      disabled={
                        emailDownloadingCategory !== null ||
                        !isRemoteSession ||
                        !serverEmailRowsLoaded
                      }
                      onClick={() => void downloadThematicEmailList(emailCategoryFilter)}
                    >
                      <Download className="size-4" /> Télécharger cette liste
                    </Button>
                    <p className="basis-full text-xs text-muted-foreground">
                      La liste contient uniquement les personnes ayant accepté de recevoir les
                      e-mails AE2V et qui ne se sont pas désinscrites. Les catégories correspondent
                      au champ « Ce que tu veux recevoir ».
                    </p>
                  </div>
                </div>
                {!serverEmailRowsLoaded ? (
                  <div className="border-2 border-ae2v-black bg-card p-8 text-center text-sm">
                    Chargement de la liste « {emailCategoryLabel(emailCategoryFilter)} »…
                  </div>
                ) : serverEmailRows.length ? (
                  <DataTable
                    rows={serverEmailRows}
                    columns={[
                      {
                        key: "name",
                        header: "Nom",
                        render: (row) => `${row.firstName} ${row.lastName}`,
                      },
                      {
                        key: "email",
                        header: "E-mail",
                        render: (row) => <span className="font-mono text-xs">{row.email}</span>,
                      },
                      { key: "status", header: "Statut", render: (row) => row.membershipStatus },
                      {
                        key: "categories",
                        header: "Catégories actives",
                        render: (row) => row.categories.join(" · ") || "Aucune",
                      },
                      { key: "source", header: "Source", render: (row) => row.source },
                      {
                        key: "action",
                        header: "Fiche",
                        render: (row) => {
                          const member = serverMembers.find((item) => item.email === row.email);
                          return member ? (
                            <Button asChild size="sm" variant="outline">
                              <Link
                                to="/bureau/personnes/$personId"
                                params={{ personId: member.id }}
                              >
                                <Eye className="size-3.5" /> Ouvrir
                              </Link>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">Dossier</span>
                          );
                        },
                      },
                    ]}
                  />
                ) : (
                  <EmptyState
                    label="Aucun destinataire"
                    detail="Aucun membre ne correspond à cette catégorie ou la base n’est pas disponible."
                  />
                )}
              </div>
            )}

            {personnesTab === "equipe_bde" && (
              <div className="space-y-8">
                {/* Barre de Filtre par Pôle */}
                <div className="flex flex-wrap items-center justify-between border-2 border-ae2v-black bg-card p-4 gap-4">
                  <div className="flex items-center gap-2">
                    <ListFilter className="size-4 text-ae2v-red" />
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
                        userId: null,
                        displayName: "",
                        roleTitle: "Membre du bureau",
                        roleTitles: ["Membre du bureau"],
                        officerRole: null,
                        isOfficer: false,
                        poles: ["Événementiel"],
                        showDefaultPoleTitles: true,
                        mandate: "2026-2027",
                        photoUrl: null,
                        roleEmail: null,
                        personalAe2vEmail: "",
                        bio: "",
                        isDemo: false,
                        isPlaceholder: false,
                        publicVisible: true,
                      })
                    }
                  >
                    <Plus className="size-4" /> Ajouter un membre du bureau
                  </Button>
                </div>

                <div className="flex items-center justify-between gap-3 border-2 border-ae2v-black bg-ae2v-offwhite p-4">
                  <div>
                    <h3 className="font-impact text-lg uppercase">Ordre d’affichage public</h3>
                    <p className="text-xs text-muted-foreground">
                      Gérer l’ordre des cartes affichées sur <code>/bde/equipe</code>.
                    </p>
                  </div>
                  <Button size="sm" variant="black" onClick={() => setTeamOrderModalOpen(true)}>
                    <ListFilter className="size-4" /> Réorganiser
                  </Button>
                </div>

                {teamOrderModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-ae2v-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-2xl border-2 border-ae2v-black bg-card p-6 shadow-2xl">
                      <div className="flex items-start justify-between gap-4 border-b-2 border-ae2v-black pb-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-ae2v-red">
                            Affichage public
                          </p>
                          <h3 className="font-impact text-2xl uppercase">Ordre des membres</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Glissez-déposez une carte. Le nouvel ordre sera utilisé sur le site.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTeamOrderModalOpen(false)}
                          aria-label="Fermer"
                        >
                          <X className="size-5" />
                        </button>
                      </div>
                      <div className="mt-5 grid gap-2" aria-label="Réordonner les membres">
                        {safeTeamMembers.map((member, memberIndex) => (
                          <div
                            key={member.id}
                            draggable
                            onDragStart={() => setDraggedMemberId(member.id)}
                            onDragEnd={() => setDraggedMemberId(null)}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={async () => {
                              if (!draggedMemberId || draggedMemberId === member.id) return;
                              const current = [...safeTeamMembers];
                              const from = current.findIndex((item) => item.id === draggedMemberId);
                              const to = current.findIndex((item) => item.id === member.id);
                              if (from < 0 || to < 0) return;
                              const [moved] = current.splice(from, 1);
                              if (!moved) return;
                              current.splice(to, 0, moved);
                              setTeamMembers(current);
                              setDraggedMemberId(null);
                              if (account && !account.id.startsWith("acc-")) {
                                try {
                                  await reorderTeamMembers({
                                    data: { ids: current.map((item) => item.id) },
                                  });
                                } catch {
                                  notifySite("L’ordre n’a pas pu être enregistré côté serveur.", {
                                    kind: "error",
                                  });
                                }
                              } else {
                                saveDynamicTeamMembers(current);
                              }
                            }}
                            className={`flex items-center gap-3 border-2 border-ae2v-black bg-card px-3 py-2 text-left text-xs transition-opacity ${
                              draggedMemberId === member.id ? "opacity-40" : ""
                            }`}
                            title="Glisser-déposer pour réordonner"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block font-bold">{member.displayName}</span>
                              <span className="block text-muted-foreground">
                                {member.officerRole ??
                                  (member.roleTitles.join(" · ") || "Membre du bureau")}
                              </span>
                            </span>
                            <span className="flex shrink-0 gap-1" aria-label="Déplacer">
                              <button
                                type="button"
                                className="tap-44 border-2 border-ae2v-black px-2 hover:bg-ae2v-green disabled:opacity-30"
                                aria-label={`Monter ${member.displayName}`}
                                disabled={memberIndex === 0}
                                onClick={async () => {
                                  if (memberIndex === 0) return;
                                  const current = [...safeTeamMembers];
                                  const [moved] = current.splice(memberIndex, 1);
                                  if (!moved) return;
                                  current.splice(memberIndex - 1, 0, moved);
                                  setTeamMembers(current);
                                  try {
                                    if (account && !account.id.startsWith("acc-")) {
                                      await reorderTeamMembers({
                                        data: { ids: current.map((item) => item.id) },
                                      });
                                    } else saveDynamicTeamMembers(current);
                                  } catch {
                                    notifySite("L’ordre n’a pas pu être enregistré côté serveur.", {
                                      kind: "error",
                                    });
                                  }
                                }}
                              >
                                <ArrowUp className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                className="tap-44 border-2 border-ae2v-black px-2 hover:bg-ae2v-green disabled:opacity-30"
                                aria-label={`Descendre ${member.displayName}`}
                                disabled={memberIndex === safeTeamMembers.length - 1}
                                onClick={async () => {
                                  if (memberIndex >= safeTeamMembers.length - 1) return;
                                  const current = [...safeTeamMembers];
                                  const [moved] = current.splice(memberIndex, 1);
                                  if (!moved) return;
                                  current.splice(memberIndex + 1, 0, moved);
                                  setTeamMembers(current);
                                  try {
                                    if (account && !account.id.startsWith("acc-")) {
                                      await reorderTeamMembers({
                                        data: { ids: current.map((item) => item.id) },
                                      });
                                    } else saveDynamicTeamMembers(current);
                                  } catch {
                                    notifySite("L’ordre n’a pas pu être enregistré côté serveur.", {
                                      kind: "error",
                                    });
                                  }
                                }}
                              >
                                <ArrowDown className="size-3.5" />
                              </button>
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-5 flex justify-end border-t-2 border-ae2v-black/15 pt-4">
                        <Button variant="secondary" onClick={() => setTeamOrderModalOpen(false)}>
                          Fermer
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bureau Exécutif (Officiers) */}
                {(poleFilter === "TOUS" ||
                  poleFilter === "Direction" ||
                  poleFilter === "Finance") && (
                  <div className="space-y-4">
                    <div className="border-b-2 border-ae2v-black pb-2 flex items-center justify-between">
                      <h3 className="font-impact text-xl uppercase text-ae2v-red flex items-center gap-2">
                        <Shield className="size-5" /> Bureau Exécutif (Officiers Dirigeants)
                      </h3>
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {executiveOfficers.length} officiers
                      </span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {executiveOfficers
                        .filter(
                          (m) => poleFilter === "TOUS" || m.poles.includes(poleFilter as TeamPole),
                        )
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
                              <Edit className="size-3.5" /> Éditer le membre du bureau
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Membres du bureau */}
                <div className="space-y-4">
                  <div className="border-b-2 border-ae2v-black pb-2 flex items-center justify-between">
                    <h3 className="font-impact text-xl uppercase text-ae2v-black flex items-center gap-2">
                      <Users className="size-5" /> Membres du bureau
                    </h3>
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {poleMembers.length} membres du bureau
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {poleMembers
                      .filter(
                        (m) => poleFilter === "TOUS" || m.poles.includes(poleFilter as TeamPole),
                      )
                      .map((m) => (
                        <div
                          key={m.id}
                          className="border-2 border-ae2v-black bg-card p-4 space-y-3 flex flex-col justify-between"
                        >
                          <div>
                            <span className="border border-ae2v-black bg-ae2v-offwhite px-2 py-0.5 text-[0.65rem] font-bold uppercase text-ae2v-black">
                              Pôles {m.poles.join(" · ") || "À définir"}
                            </span>
                            <h4 className="font-impact text-lg mt-2">{m.displayName}</h4>
                            <p className="mt-1 text-xs font-bold text-ae2v-red">
                              {displayedTeamTitles(m).join(" · ") || "Membre du bureau"}
                            </p>
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
                Commandes & HelloAsso ({displayOrders.length})
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
                Factures & Reçus ({displayInvoices.length})
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
                    onClick={async () => {
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
                        customSections: [],
                        capacity: 200,
                        registered: 0,
                        registrationOpensAt: "01/10/2026",
                        registrationClosesAt: "14/10/2026",
                        status: "OUVERT",
                        waitlist: true,
                        tiers: [
                          {
                            id: "public",
                            label: "Tarif public",
                            priceCents: 1500,
                            audience: "public",
                            isMandatory: true,
                            disabled: false,
                            system: true,
                          },
                          {
                            id: "adherent",
                            label: "Tarif cotisant",
                            priceCents: 800,
                            audience: "adherent",
                            isMandatory: true,
                            disabled: false,
                            system: true,
                          },
                          {
                            id: "bureau",
                            label: "Tarif membre du bureau",
                            priceCents: 500,
                            audience: "bureau",
                            isMandatory: true,
                            disabled: false,
                            system: true,
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

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="border-2 border-ae2v-black bg-card p-4">
                    <p className="text-xs font-bold uppercase text-muted-foreground">
                      Événements publiés
                    </p>
                    <p className="mt-1 font-impact text-3xl">
                      {safeEvents.filter((event) => event.status !== "NON_PUBLIE").length}
                    </p>
                  </div>
                  <div className="border-2 border-ae2v-black bg-card p-4">
                    <p className="text-xs font-bold uppercase text-muted-foreground">
                      Inscriptions
                    </p>
                    <p className="mt-1 font-impact text-3xl">
                      {safeEvents.reduce((total, event) => total + event.registered, 0)}
                    </p>
                  </div>
                  <div className="border-2 border-ae2v-black bg-card p-4">
                    <p className="text-xs font-bold uppercase text-muted-foreground">
                      Places restantes
                    </p>
                    <p className="mt-1 font-impact text-3xl">
                      {safeEvents.reduce(
                        (total, event) => total + Math.max(0, event.capacity - event.registered),
                        0,
                      )}
                    </p>
                  </div>
                </div>

                <DataTable
                  rows={safeEvents.filter(
                    (event) => showTerminatedEvents || event.status !== "TERMINE",
                  )}
                  onRowClick={(event) => setSelectedEventDetail(event)}
                  filters={
                    <label className="inline-flex min-h-10 items-center gap-2 border-2 border-ae2v-black bg-card px-3 text-xs font-bold uppercase">
                      <input
                        type="checkbox"
                        checked={showTerminatedEvents}
                        onChange={(event) => setShowTerminatedEvents(event.target.checked)}
                        className="size-4 accent-ae2v-red"
                      />
                      Afficher les événements terminés
                    </label>
                  }
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
                          <Button size="sm" variant="black" onClick={() => openEventAttendees(e)}>
                            <Users className="size-3.5" /> Participants ({e.registered})
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
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <div>
                    <h3 className="font-impact text-xl uppercase">Aperçu HelloAsso</h3>
                    <p className="text-xs text-muted-foreground">
                      Catalogue minimal : les ventes et paiements sont confirmés dans HelloAsso puis
                      rattachés à une personne.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setEditingProduct({
                        id: `prod-${Date.now()}`,
                        name: "",
                        tagline: "",
                        priceMember: 0,
                        pricePublic: 0,
                        sizes: [],
                        image: "",
                        helloAssoUrl: HELLOASSO_SHOP_URL,
                        isDemo: true,
                      })
                    }
                  >
                    <Plus className="size-4" /> Ajouter un produit
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
                            {p.category ?? "Vêtements"}
                          </span>
                          <span className="font-impact text-ae2v-red text-lg">
                            {formatPrice(p.priceCents ?? p.priceMember)}
                          </span>
                        </div>
                        <h4 className="font-impact text-lg">{p.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {p.description ?? p.tagline}
                        </p>
                        <p className="text-xs font-bold mt-2">Vente et paiement : HelloAsso</p>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <Button asChild size="sm" variant="black">
                          <a
                            href={p.helloAssoUrl ?? HELLOASSO_SHOP_URL}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Ouvrir HelloAsso
                          </a>
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setEditingProduct(p)}>
                          <Edit className="size-3.5" /> Éditer
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            if (
                              await confirmSite(`Supprimer l’aperçu « ${p.name} » ?`, {
                                title: "Supprimer cet aperçu ?",
                                confirmLabel: "Supprimer",
                              })
                            ) {
                              if (
                                account &&
                                !account.id.startsWith("acc-") &&
                                !p.id.startsWith("prod-")
                              ) {
                                try {
                                  await archiveProduct({ data: { id: p.id } });
                                  setProducts((current) =>
                                    current.filter((product) => product.id !== p.id),
                                  );
                                  return;
                                } catch {
                                  notifySite("Le produit n’a pas pu être archivé côté serveur.", {
                                    kind: "error",
                                  });
                                  return;
                                }
                              }
                              saveDynamicShopProducts(
                                safeProducts.filter((product) => product.id !== p.id),
                              );
                            }
                          }}
                        >
                          <Trash2 className="size-3.5" /> Supprimer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gestion > Commandes */}
            {gestionTab === "commandes" && (
              <div className="space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <div>
                    <h3 className="font-impact text-xl uppercase">
                      Suivi des Commandes & HelloAsso
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Ajoute ici une commande HelloAsso, puis indique si son paiement est confirmé
                      ou encore en attente pour conserver son historique.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setOrderDraft({
                        memberId: "",
                        customerName: "",
                        customerEmail: "",
                        items: [{ productName: "", amountEuros: "", quantity: "1" }],
                        helloAssoId: "",
                        paymentStatus: "CONFIRME",
                        notes: "",
                      });
                      setOrderFormOpen(true);
                    }}
                  >
                    <Plus className="size-4" /> Ajouter une commande
                  </Button>
                </div>

                <DataTable
                  rows={displayOrders}
                  onRowClick={(order) => {
                    setSelectedOrder(order);
                    setOrderNoteInput(order.notes ?? "");
                  }}
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
                      render: (o) => {
                        const linkedMember = serverMembers.find(
                          (member) => member.email.toLowerCase() === o.customerEmail.toLowerCase(),
                        );
                        return (
                          <div className="flex flex-wrap gap-2">
                            {linkedMember && (
                              <Button asChild size="sm" variant="outline">
                                <Link
                                  to="/bureau/personnes/$personId"
                                  params={{ personId: linkedMember.id }}
                                >
                                  <UserCheck className="size-3.5" /> Fiche
                                </Link>
                              </Button>
                            )}
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
                          </div>
                        );
                      },
                    },
                  ]}
                />
              </div>
            )}

            {/* Gestion > Factures */}
            {gestionTab === "factures" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-impact text-xl uppercase">
                    Historique Factures & Reçus ({visibleInvoices.length}/{displayInvoices.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!visibleInvoices.length}
                      onClick={() => downloadInvoicesCsv(visibleInvoices)}
                    >
                      <Download className="size-3.5" /> CSV
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!visibleInvoices.length}
                      onClick={() => downloadInvoicesZip(visibleInvoices)}
                    >
                      <Download className="size-3.5" /> ZIP
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() =>
                        setPayModalConfig({
                          customerName: "",
                          customerEmail: "",
                          description: "",
                          priceCents: 0,
                          editableDetails: true,
                        })
                      }
                    >
                      <Plus className="size-4" /> Créer une facture libre
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 border-2 border-ae2v-black/15 bg-ae2v-offwhite p-3 md:grid-cols-[1.5fr_1fr_1fr]">
                  <label className="text-xs font-bold uppercase">
                    Rechercher une facture
                    <input
                      value={invoiceSearch}
                      onChange={(event) => setInvoiceSearch(event.target.value)}
                      placeholder="N°, nom ou e-mail"
                      className="mt-1 min-h-10 w-full border-2 border-ae2v-black bg-card px-3 font-sans text-sm font-normal"
                    />
                  </label>
                  <label className="text-xs font-bold uppercase">
                    Moyen de paiement
                    <select
                      value={invoicePayFilter}
                      onChange={(event) => setInvoicePayFilter(event.target.value)}
                      className="mt-1 min-h-10 w-full border-2 border-ae2v-black bg-card px-2 font-sans text-sm font-normal"
                    >
                      <option value="TOUS">Tous</option>
                      <option value="Espèces">Espèces</option>
                      <option value="Carte bancaire (CB)">Carte bancaire</option>
                      <option value="Chèque">Chèque</option>
                      <option value="Pass Culture">Pass Culture</option>
                      <option value="HelloAsso">HelloAsso</option>
                    </select>
                  </label>
                  <label className="text-xs font-bold uppercase">
                    État de la facture
                    <select
                      value={invoiceStatusFilter}
                      onChange={(event) => setInvoiceStatusFilter(event.target.value)}
                      className="mt-1 min-h-10 w-full border-2 border-ae2v-black bg-card px-2 font-sans text-sm font-normal"
                    >
                      <option value="TOUS">Tous</option>
                      <option value="EMISE">Émise</option>
                      <option value="ANNULEE">Annulée</option>
                      <option value="REMBOURSEE">Remboursée</option>
                      <option value="PARTIELLEMENT_REMBOURSEE">Partiellement remboursée</option>
                    </select>
                  </label>
                </div>

                <DataTable
                  rows={visibleInvoices}
                  onRowClick={(invoice) => {
                    setSelectedInvoice(invoice);
                    setInvoiceEditStatus(
                      (invoice.status ?? "EMISE") as
                        "EMISE" | "ANNULEE" | "REMBOURSEE" | "PARTIELLEMENT_REMBOURSEE",
                    );
                    setInvoiceEditNotes(invoice.notes ?? "");
                  }}
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
                      render: (inv) => {
                        const linkedMember = serverMembers.find(
                          (member) =>
                            member.email.toLowerCase() === inv.customerEmail.toLowerCase(),
                        );
                        return (
                          <div className="flex flex-wrap gap-2">
                            {linkedMember && (
                              <Button asChild size="sm" variant="outline">
                                <Link
                                  to="/bureau/personnes/$personId"
                                  params={{ personId: linkedMember.id }}
                                >
                                  <UserCheck className="size-3.5" /> Fiche
                                </Link>
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="black"
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setInvoiceEditStatus(
                                  (inv.status ?? "EMISE") as
                                    "EMISE" | "ANNULEE" | "REMBOURSEE" | "PARTIELLEMENT_REMBOURSEE",
                                );
                                setInvoiceEditNotes(inv.notes ?? "");
                              }}
                            >
                              <Printer className="size-3.5" /> Reçu PDF
                            </Button>
                          </div>
                        );
                      },
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
                <h3 className="font-impact text-2xl uppercase">Édition membre du bureau</h3>
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
                    <label className="block font-bold uppercase mb-1">Pôles</label>
                    <p className="mb-2 text-[0.65rem] text-muted-foreground">
                      Un membre peut être affecté à plusieurs pôles, sans pôle principal.
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {teamPoles.map((pole) => {
                        const checked = editingMember.poles.includes(pole);
                        return (
                          <label
                            key={pole}
                            className="flex items-center gap-2 border-2 border-ae2v-black/20 bg-ae2v-offwhite px-2 py-2 font-bold"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const selected = new Set(editingMember.poles);
                                if (selected.has(pole)) selected.delete(pole);
                                else selected.add(pole);
                                setEditingMember({
                                  ...editingMember,
                                  poles: teamPoles.filter((item) => selected.has(item)),
                                });
                              }}
                              className="size-4 accent-ae2v-red"
                            />
                            {pole}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <label className="mt-3 flex items-start gap-2 border-2 border-ae2v-black/20 bg-card px-2 py-2 font-bold">
                    <input
                      type="checkbox"
                      checked={editingMember.showDefaultPoleTitles}
                      disabled={
                        editingMember.roleTitles.filter(
                          (title) => title.trim() && title.trim() !== "Membre du bureau",
                        ).length === 0
                      }
                      onChange={(e) =>
                        setEditingMember({
                          ...editingMember,
                          showDefaultPoleTitles: e.target.checked,
                        })
                      }
                      className="mt-0.5 size-4 accent-ae2v-red"
                    />
                    Afficher les intitulés par défaut des pôles
                  </label>
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <label className="block font-bold uppercase mb-1">Titre(s) / rôle(s)</label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setEditingMember({
                            ...editingMember,
                            roleTitles: [...editingMember.roleTitles, ""],
                          })
                        }
                      >
                        <Plus className="size-3.5" /> Ajouter
                      </Button>
                    </div>
                    <div className="grid gap-2">
                      {editingMember.roleTitles.map((title, titleIndex) => (
                        <div key={`role-title-${titleIndex}`} className="flex gap-2">
                          <input
                            type="text"
                            value={title}
                            aria-label={`Titre ou rôle ${titleIndex + 1}`}
                            onChange={(event) => {
                              const roleTitles = editingMember.roleTitles.map((item, index) =>
                                index === titleIndex ? event.target.value : item,
                              );
                              setEditingMember({
                                ...editingMember,
                                roleTitles,
                                roleTitle:
                                  roleTitles.find((item) => item.trim())?.trim() ??
                                  "Membre du bureau",
                              });
                            }}
                            className="min-w-0 flex-1 border-2 border-ae2v-black bg-ae2v-offwhite p-2"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            aria-label={`Supprimer le titre ${titleIndex + 1}`}
                            onClick={() => {
                              const roleTitles = editingMember.roleTitles.filter(
                                (_, index) => index !== titleIndex,
                              );
                              setEditingMember({
                                ...editingMember,
                                roleTitles,
                                roleTitle:
                                  roleTitles.find((item) => item.trim())?.trim() ??
                                  "Membre du bureau",
                                showDefaultPoleTitles: roleTitles.length === 0,
                              });
                            }}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <p className="mt-1 text-[0.65rem] text-muted-foreground">
                      Chaque ligne est un titre indépendant. Dès qu’un titre personnalisé existe,
                      les intitulés automatiques des pôles peuvent être masqués.
                    </p>
                  </div>
                </div>

                <div className="border-2 border-ae2v-black/15 bg-ae2v-offwhite p-3">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden border-2 border-ae2v-black bg-card">
                      {editingMember.photoUrl ? (
                        <img
                          src={editingMember.photoUrl}
                          alt={`Aperçu de ${editingMember.displayName || "la personne"}`}
                          className="size-full object-cover"
                        />
                      ) : (
                        <span className="font-impact text-2xl text-ae2v-red">
                          {initials(editingMember.displayName || "AE2V")}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold uppercase">Photo de profil</p>
                      <p className="mt-1 text-[0.65rem] text-muted-foreground">
                        Image carrée recadrée automatiquement. Sans photo, le placeholder AE2V est
                        utilisé partout.
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <label className="inline-flex min-h-10 cursor-pointer items-center border-2 border-ae2v-black bg-card px-3 py-2 text-xs font-bold uppercase hover:bg-ae2v-black hover:text-white">
                          Remplacer la photo
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="sr-only"
                            onChange={async (event) => {
                              const file = event.target.files?.[0];
                              event.target.value = "";
                              if (!file) return;
                              if (!file.type.startsWith("image/") || file.size > 5_000_000) {
                                notifySite(
                                  "Choisissez une image JPG, PNG ou WebP de moins de 5 Mo.",
                                  { kind: "warning" },
                                );
                                return;
                              }
                              try {
                                const photoUrl = await processImageFile(file, "1:1", 600);
                                setEditingMember({ ...editingMember, photoUrl });
                              } catch {
                                notifySite("La photo n’a pas pu être traitée.", { kind: "error" });
                              }
                            }}
                          />
                        </label>
                        {editingMember.photoUrl && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingMember({ ...editingMember, photoUrl: null })}
                          >
                            Supprimer la photo
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {serverMembers.length > 0 && (
                  <div>
                    <label className="block font-bold uppercase mb-1">Compte membre lié</label>
                    <select
                      value={editingMember.userId ?? ""}
                      onChange={(event) =>
                        setEditingMember({
                          ...editingMember,
                          userId: event.target.value || null,
                        })
                      }
                      className="w-full border-2 border-ae2v-black bg-ae2v-offwhite p-2 font-bold"
                    >
                      <option value="">Aucun compte lié</option>
                      {serverMembers
                        .filter((member) => member.userId)
                        .map((member) => (
                          <option key={member.userId} value={member.userId ?? ""}>
                            {member.firstName} {member.lastName} · {member.email}
                          </option>
                        ))}
                    </select>
                    <p className="mt-1 text-[0.65rem] text-muted-foreground">
                      Le compte lié verra automatiquement sa carte de bureau dans /espace.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block font-bold uppercase mb-1" htmlFor="officerRoleSelect">
                    Fonction dirigeante spéciale
                  </label>
                  <select
                    id="officerRoleSelect"
                    value={editingMember.officerRole ?? ""}
                    onChange={(event) =>
                      setEditingMember({
                        ...editingMember,
                        officerRole: (event.target.value || null) as TeamMember["officerRole"],
                        isOfficer: Boolean(event.target.value),
                      })
                    }
                    className="w-full border-2 border-ae2v-black bg-ae2v-offwhite p-2 font-bold"
                  >
                    <option value="">Aucune fonction dirigeante</option>
                    <option value="Président">Président</option>
                    <option value="Vice-président">Vice-président</option>
                    <option value="Secrétaire">Secrétaire</option>
                    <option value="Trésorier">Trésorier</option>
                    <option value="Trésorière">Trésorière</option>
                  </select>
                  <p className="mt-1 text-[0.65rem] text-muted-foreground">
                    Cette fonction est affichée séparément des titres et réservée aux officiers
                    dirigeants.
                  </p>
                </div>

                <div className="flex items-start gap-2 border-2 border-ae2v-black/15 bg-ae2v-offwhite p-3">
                  <input
                    type="checkbox"
                    id="publicVisibleCheck"
                    checked={editingMember.publicVisible}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, publicVisible: e.target.checked })
                    }
                    className="mt-0.5 size-4 accent-ae2v-red"
                  />
                  <div>
                    <label htmlFor="publicVisibleCheck" className="font-bold uppercase">
                      Afficher sur le site public
                    </label>
                    <p className="mt-1 text-[0.65rem] text-muted-foreground">
                      Désactive cette option pour conserver une fiche interne sans l’afficher dans
                      <code className="ml-1">/bde/equipe</code>.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block font-bold uppercase mb-1">
                    E-mail Nominatif @ae2v.fr *
                  </label>
                  <input
                    type="email"
                    required
                    value={editingMember.personalAe2vEmail ?? ""}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, personalAe2vEmail: e.target.value })
                    }
                    className="w-full border-2 border-ae2v-black bg-ae2v-offwhite p-2 font-mono"
                    placeholder="prenom.nom@ae2v.fr"
                  />
                </div>

                {editingMember.isOfficer && (
                  <div>
                    <label className="block font-bold uppercase mb-1">
                      E-mail statutaire de fonction @ae2v.fr *
                    </label>
                    <input
                      type="email"
                      required
                      value={editingMember.roleEmail ?? ""}
                      onChange={(event) =>
                        setEditingMember({ ...editingMember, roleEmail: event.target.value })
                      }
                      className="w-full border-2 border-ae2v-black bg-ae2v-offwhite p-2 font-mono"
                      placeholder="president@ae2v.fr"
                    />
                    <p className="mt-1 text-[0.65rem] text-muted-foreground">
                      Cette adresse est affichée avec la fonction dirigeante, séparément de
                      l’adresse nominative.
                    </p>
                  </div>
                )}

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
                  onClick={async () => {
                    if (editingMember.isOfficer && !editingMember.roleEmail?.trim()) {
                      notifySite(
                        "Renseignez l’e-mail statutaire @ae2v.fr pour cet officier dirigeant.",
                        { kind: "warning" },
                      );
                      return;
                    }
                    const personalEmail = editingMember.personalAe2vEmail?.trim().toLowerCase();
                    if (!personalEmail || !personalEmail.endsWith("@ae2v.fr")) {
                      notifySite("Renseignez l’e-mail nominatif @ae2v.fr du membre.", {
                        kind: "warning",
                      });
                      return;
                    }
                    const normalizedRoleTitles = editingMember.roleTitles
                      .map((title) => title.trim())
                      .filter(Boolean);
                    const normalizedEditingMember = {
                      ...editingMember,
                      roleTitles: normalizedRoleTitles,
                      roleTitle: normalizedRoleTitles[0] ?? "Membre du bureau",
                    };
                    const existingOfficer = editingMember.officerRole
                      ? safeTeamMembers.find(
                          (member) =>
                            member.id !== editingMember.id &&
                            member.officerRole === editingMember.officerRole,
                        )
                      : undefined;
                    if (editingMember.officerRole) {
                      if (
                        existingOfficer &&
                        !(await confirmSite(
                          `${existingOfficer.displayName} possède déjà la fonction « ${editingMember.officerRole} ». Voulez-vous lui retirer cette fonction et l’attribuer à ${editingMember.displayName} ?`,
                          {
                            title: "Réattribuer la fonction dirigeante ?",
                            confirmLabel: "Réattribuer",
                          },
                        ))
                      ) {
                        return;
                      }
                    }
                    const isLocalDemo = !account || account.id.startsWith("acc-");
                    if (!isLocalDemo) {
                      try {
                        if (existingOfficer) {
                          await saveTeamMember({
                            data: {
                              id: existingOfficer.id,
                              displayName: existingOfficer.displayName,
                              roleTitle: existingOfficer.roleTitle,
                              roleTitles: existingOfficer.roleTitles.filter((title) =>
                                title.trim(),
                              ),
                              officerRole: null,
                              poles: existingOfficer.poles,
                              showDefaultPoleTitles: existingOfficer.showDefaultPoleTitles,
                              personalAe2vEmail: existingOfficer.personalAe2vEmail,
                              roleEmail: null,
                              isOfficer: false,
                              bio: existingOfficer.bio,
                              photoUrl: existingOfficer.photoUrl,
                              mandateYear: existingOfficer.mandate.replace("–", "-"),
                              publicVisible: existingOfficer.publicVisible,
                              userId: existingOfficer.userId ?? null,
                            },
                          });
                        }
                        await saveTeamMember({
                          data: {
                            ...(editingMember.id.startsWith("db-member-")
                              ? {}
                              : { id: editingMember.id }),
                            displayName: editingMember.displayName,
                            roleTitle: normalizedEditingMember.roleTitle,
                            roleTitles: normalizedRoleTitles,
                            officerRole: editingMember.officerRole as
                              | "Président"
                              | "Vice-président"
                              | "Secrétaire"
                              | "Trésorier"
                              | "Trésorière"
                              | null,
                            poles: editingMember.poles,
                            showDefaultPoleTitles: editingMember.showDefaultPoleTitles,
                            personalAe2vEmail: personalEmail,
                            roleEmail: editingMember.roleEmail || null,
                            isOfficer: Boolean(editingMember.officerRole),
                            bio: editingMember.bio,
                            photoUrl: editingMember.photoUrl,
                            mandateYear: editingMember.mandate.replace("–", "-"),
                            publicVisible: editingMember.publicVisible,
                            userId: editingMember.userId ?? null,
                          },
                        });
                      } catch {
                        notifySite("La fiche équipe n’a pas pu être enregistrée côté serveur.", {
                          kind: "error",
                        });
                        return;
                      }
                    }
                    const current = getDynamicTeamMembers();
                    const currentWithoutConflict = existingOfficer
                      ? current.map((m) =>
                          m.id === existingOfficer.id
                            ? { ...m, officerRole: null, isOfficer: false, roleEmail: null }
                            : m,
                        )
                      : current;
                    const exists = currentWithoutConflict.some((m) => m.id === editingMember.id);
                    const updated = exists
                      ? currentWithoutConflict.map((m) =>
                          m.id === editingMember.id ? normalizedEditingMember : m,
                        )
                      : [normalizedEditingMember, ...currentWithoutConflict];
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

        {editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ae2v-black/60 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border-2 border-ae2v-black bg-card p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b-2 border-ae2v-black pb-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-ae2v-red">
                    Catalogue HelloAsso
                  </p>
                  <h2 className="font-impact text-2xl uppercase">
                    {editingProduct.name ? "Modifier l’article" : "Ajouter un article"}
                  </h2>
                </div>
                <button type="button" onClick={() => setEditingProduct(null)} aria-label="Fermer">
                  <X className="size-5" />
                </button>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["name", "Nom de l’article"],
                    ["tagline", "Description courte"],
                    ["pricePublic", "Prix public (€)"],
                    ["priceMember", "Prix cotisant (€)"],
                    ["helloAssoUrl", "Lien HelloAsso"],
                  ] as const
                ).map(([field, label]) => (
                  <label key={field} className="text-xs font-bold uppercase sm:col-span-1">
                    {label}
                    <input
                      className="mt-1 min-h-10 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-3 text-sm font-normal"
                      type={
                        field.startsWith("price")
                          ? "number"
                          : field === "helloAssoUrl"
                            ? "url"
                            : "text"
                      }
                      min={field.startsWith("price") ? 0 : undefined}
                      step={field.startsWith("price") ? "0.01" : undefined}
                      value={
                        field.startsWith("price")
                          ? ((Number(editingProduct[field]) || 0) / 100).toFixed(2)
                          : String(editingProduct[field] ?? "")
                      }
                      onChange={(event) =>
                        setEditingProduct({
                          ...editingProduct,
                          [field]: field.startsWith("price")
                            ? Math.max(0, Math.round((Number(event.target.value) || 0) * 100))
                            : event.target.value,
                        })
                      }
                    />
                  </label>
                ))}
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold uppercase">
                    Visuel de l’article
                    <input
                      className="mt-1 block min-h-10 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-3 py-2 text-sm font-normal file:mr-3 file:border-0 file:bg-ae2v-black file:px-3 file:py-2 file:font-bold file:uppercase file:text-ae2v-offwhite"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        if (!file.type.startsWith("image/") || file.size > 5_000_000) {
                          notifySite("Choisissez une image JPG, PNG ou WebP de moins de 5 Mo.", {
                            kind: "warning",
                          });
                          event.target.value = "";
                          return;
                        }
                        try {
                          const image = await processImageFile(file, "1:1", 900);
                          if (image.length > 550_000) {
                            notifySite(
                              "Le visuel recadré reste trop lourd. Choisissez une image plus légère.",
                              {
                                kind: "warning",
                              },
                            );
                            event.target.value = "";
                            return;
                          }
                          setEditingProduct((current) =>
                            current ? { ...current, image } : current,
                          );
                        } catch {
                          notifySite("Le visuel n’a pas pu être traité.", { kind: "error" });
                          event.target.value = "";
                        }
                      }}
                    />
                  </label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Image carrée 900 × 900 px. Le recadrage et la compression sont automatiques ;
                    aucun lien d’image n’est nécessaire.
                  </p>
                  {editingProduct.image ? (
                    <img
                      src={editingProduct.image}
                      alt="Aperçu du visuel de l’article"
                      width={180}
                      height={180}
                      className="mt-3 aspect-square size-36 border-2 border-ae2v-black object-cover"
                    />
                  ) : null}
                </div>
                <label className="text-xs font-bold uppercase sm:col-span-2">
                  Tailles / variantes, séparées par des virgules
                  <input
                    className="mt-1 min-h-10 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-3 text-sm font-normal"
                    value={editingProduct.sizes.join(", ")}
                    onChange={(event) =>
                      setEditingProduct({
                        ...editingProduct,
                        sizes: event.target.value
                          .split(",")
                          .map((value) => value.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </label>
              </div>
              <div className="mt-5 flex justify-end gap-2 border-t-2 border-ae2v-black/15 pt-4">
                <Button variant="outline" onClick={() => setEditingProduct(null)}>
                  Annuler
                </Button>
                <Button
                  variant="black"
                  disabled={!editingProduct.name.trim() || !editingProduct.tagline.trim()}
                  onClick={async () => {
                    const isRemote = Boolean(account && !account.id.startsWith("acc-"));
                    if (isRemote) {
                      try {
                        const result = await saveProduct({
                          data: {
                            ...(editingProduct.id && !editingProduct.id.startsWith("prod-")
                              ? { id: editingProduct.id }
                              : {}),
                            name: editingProduct.name.trim(),
                            tagline: editingProduct.tagline.trim(),
                            priceMemberCents: Math.max(0, Math.round(editingProduct.priceMember)),
                            pricePublicCents: Math.max(0, Math.round(editingProduct.pricePublic)),
                            sizes: editingProduct.sizes,
                            image: editingProduct.image || null,
                            helloAssoUrl: editingProduct.helloAssoUrl || HELLOASSO_SHOP_URL,
                            active: true,
                          },
                        });
                        setProducts((current) => [
                          serverProductToLocal(result.product),
                          ...current.filter((item) => item.id !== result.product.id),
                        ]);
                      } catch {
                        notifySite("L’article n’a pas pu être enregistré.", { kind: "error" });
                        return;
                      }
                    } else {
                      const next = {
                        ...editingProduct,
                        name: editingProduct.name.trim(),
                        tagline: editingProduct.tagline.trim(),
                        isDemo: true as const,
                      };
                      saveDynamicShopProducts([
                        ...safeProducts.filter((item) => item.id !== next.id),
                        next,
                      ]);
                      setProducts(getDynamicShopProducts());
                    }
                    addAuditLog("ARTICLE_ENREGISTRE", `Article ${editingProduct.name} enregistré`);
                    setEditingProduct(null);
                  }}
                >
                  Enregistrer l’article
                </Button>
              </div>
            </div>
          </div>
        )}

        {selectedDossier && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ae2v-black/60 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto border-2 border-ae2v-black bg-card p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b-2 border-ae2v-black pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-ae2v-red">
                    Demande d’adhésion · {selectedDossier.id}
                  </p>
                  <h2 className="mt-1 font-impact text-3xl uppercase">
                    {selectedDossier.firstName} {selectedDossier.lastName}
                  </h2>
                  <p className="font-mono text-sm">{selectedDossier.email}</p>
                </div>
                <button type="button" onClick={() => setSelectedDossier(null)} aria-label="Fermer">
                  <X className="size-5" />
                </button>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <InfoRow label="Statut" value={membershipStatusLabels[selectedDossier.status]} />
                <InfoRow label="Téléphone" value={selectedDossier.phone || "Non renseigné"} />
                <InfoRow
                  label="Identifiant étudiant"
                  value={selectedDossier.studentId || "Non renseigné"}
                />
                <InfoRow label="Filière" value={selectedDossier.departement} />
                <InfoRow label="Niveau" value={selectedDossier.niveau} />
                <InfoRow label="Montant" value={formatCents(selectedDossier.contributionCents)} />
                <InfoRow label="Soumise le" value={selectedDossier.submittedAt} />
                <InfoRow
                  label="Cotisation"
                  value={contributionStatusLabels[selectedDossier.contributionStatus]}
                />
              </div>
              <div className="mt-5 grid gap-4 border-2 border-ae2v-black/15 bg-card p-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-ae2v-red">
                    Réponses du formulaire
                  </p>
                  <div className="mt-3 space-y-2 text-sm">
                    <InfoRow
                      label="Année universitaire"
                      value={selectedDossier.schoolYear || "Non renseignée"}
                    />
                    <InfoRow label="Groupe" value={selectedDossier.groupe || "Non renseigné"} />
                    <InfoRow
                      label="Souhaite aider sur les événements"
                      value={selectedDossier.volunteer || "Non renseigné"}
                    />
                    <InfoRow
                      label="Droit à l'image"
                      value={selectedDossier.imageRight ? "Accepté" : "Non accepté"}
                    />
                    <InfoRow
                      label="Consentement RGPD"
                      value={
                        selectedDossier.rgpdAcceptedAt
                          ? `Accepté le ${selectedDossier.rgpdAcceptedAt}`
                          : "Non renseigné"
                      }
                    />
                    <InfoRow
                      label="Statuts acceptés"
                      value={
                        selectedDossier.statutsAcceptedAt
                          ? `Acceptés le ${selectedDossier.statutsAcceptedAt}`
                          : "Non renseigné"
                      }
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-ae2v-red">
                    Intérêts et motivation
                  </p>
                  <div className="mt-3 space-y-3 text-sm">
                    <div>
                      <p className="text-xs font-bold uppercase text-muted-foreground">Intérêts</p>
                      <p className="mt-1 whitespace-pre-wrap">
                        {selectedDossier.interests?.join(", ") || "Non renseignés"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-muted-foreground">
                        Message / raison d'être là
                      </p>
                      <p className="mt-1 whitespace-pre-wrap">
                        {selectedDossier.message || "Non renseigné"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 border-2 border-ae2v-black/15 bg-ae2v-offwhite p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em]">
                    Échange avec l’adhérent
                  </p>
                  {selectedDossierThread && (
                    <span className="text-[0.65rem] font-bold uppercase text-muted-foreground">
                      {selectedDossierThread.messages.length} message(s)
                    </span>
                  )}
                </div>
                {selectedDossierThread?.messages.length ? (
                  <div className="mt-3 space-y-2">
                    {selectedDossierThread.messages.map((message) => (
                      <div
                        key={message.id}
                        className="border-2 border-ae2v-black/15 bg-card p-3 text-sm"
                      >
                        <div className="flex flex-wrap justify-between gap-2 text-xs font-bold uppercase">
                          <span>
                            {message.authorType === "ADHERENT" ? "Adhérent" : "Bureau"} ·{" "}
                            {message.authorName}
                          </span>
                          <span className="text-muted-foreground">
                            {new Date(message.createdAt).toLocaleString("fr-FR")}
                          </span>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap">{message.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 whitespace-pre-wrap text-sm">
                    {selectedDossier.note || "Aucun échange enregistré."}
                  </p>
                )}
              </div>
              <div className="mt-5 flex flex-wrap gap-2 border-t-2 border-ae2v-black/15 pt-4">
                {selectedDossier.personId && (
                  <Button asChild size="sm" variant="secondary">
                    <Link
                      to="/bureau/personnes/$personId"
                      params={{ personId: selectedDossier.personId }}
                    >
                      <Eye className="size-3.5" /> Voir le profil
                    </Link>
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const url = `${window.location.origin}/bureau?dossier=${encodeURIComponent(selectedDossier.id)}`;
                    void navigator.clipboard?.writeText(url);
                    notifySite("Lien de la demande copié.", { kind: "success" });
                  }}
                >
                  <Copy className="size-3.5" /> Copier le lien
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openEmailComposer(selectedDossier.email)}
                >
                  <Mail className="size-3.5" /> Écrire à l’adhérent
                </Button>
                {(selectedDossier.status === "EN_ATTENTE" ||
                  selectedDossier.status === "A_CORRIGER") && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={async () => {
                      const isLocalDemo = !account || account.id.startsWith("acc-");
                      if (!isLocalDemo) {
                        try {
                          await decideMembership({
                            data: { dossierId: selectedDossier.id, decision: "MEMBRE_VALIDE" },
                          });
                          setServerMembers(
                            await getBureauMembers({
                              data:
                                memberSchoolYearFilter === "TOUS"
                                  ? {}
                                  : { schoolYear: memberSchoolYearFilter },
                            }),
                          );
                        } catch {
                          notifySite("La validation n’a pas pu être enregistrée côté serveur.", {
                            kind: "error",
                          });
                          return;
                        }
                      }
                      updateDossier(selectedDossier.id, {
                        status: "VALIDE",
                        validatedAt: new Date().toLocaleDateString("fr-FR"),
                      });
                      addAuditLog("VALIDATION_ADHESION", `Dossier ${selectedDossier.id} validé`);
                      setSelectedDossier(null);
                    }}
                  >
                    <CheckCircle2 className="size-3.5" /> Valider
                  </Button>
                )}
                {selectedDossier.status === "EN_ATTENTE" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCorrectionDraft({ dossierId: selectedDossier.id, note: "" })}
                  >
                    Demander une correction
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {correctionDraft && selectedDossier && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ae2v-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl border-2 border-ae2v-black bg-card p-6 shadow-2xl">
              <div className="mb-4 flex items-start justify-between gap-4 border-b-2 border-ae2v-black pb-3">
                <div>
                  <p className="text-[0.65rem] font-bold uppercase tracking-widest text-ae2v-red">
                    Échange avec l’adhérent
                  </p>
                  <h3 className="font-impact text-2xl uppercase">Demander une correction</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Un e-mail contenant le lien sécurisé de réponse sera envoyé à{" "}
                    {selectedDossier.email}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCorrectionDraft(null)}
                  aria-label="Fermer"
                  className="p-1 hover:bg-ae2v-black/10"
                >
                  <X className="size-5" />
                </button>
              </div>
              {selectedDossierThread?.messages?.length ? (
                <div className="mb-4 max-h-40 space-y-2 overflow-y-auto border-2 border-ae2v-black/15 bg-ae2v-offwhite p-3 text-xs">
                  <p className="font-bold uppercase tracking-wider">Échanges précédents</p>
                  {selectedDossierThread.messages.map((message) => (
                    <div key={message.id} className="border-l-2 border-ae2v-red pl-2">
                      <p className="font-bold">{message.authorName}</p>
                      <p className="whitespace-pre-wrap">{message.message}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              <label className="block text-xs font-bold uppercase">
                Informations à corriger *
                <textarea
                  autoFocus
                  rows={6}
                  value={correctionDraft.note}
                  onChange={(event) =>
                    setCorrectionDraft({ ...correctionDraft, note: event.target.value })
                  }
                  placeholder="Ex. Merci de préciser ta filière et de joindre une adresse e-mail valide."
                  className="mt-1 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-3 py-2 font-sans text-sm font-normal"
                  required
                />
              </label>
              <div className="mt-4 flex justify-end gap-2 border-t-2 border-ae2v-black/10 pt-3">
                <Button type="button" variant="secondary" onClick={() => setCorrectionDraft(null)}>
                  Annuler
                </Button>
                <Button
                  type="button"
                  disabled={!correctionDraft.note.trim()}
                  onClick={() => void submitCorrectionRequest()}
                >
                  <Send className="size-3.5" /> Envoyer la demande
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
                      void saveCandidaturePatch(selectedCandidature.id, {
                        internalNotes: candidatureNoteInput,
                      })
                        .then(() => {
                          addAuditLog(
                            "NOTE_CANDIDATURE",
                            `Commentaire ajouté sur la candidature ${selectedCandidature.id}`,
                          );
                          notifySite("Commentaire sauvegardé avec succès !", { kind: "success" });
                        })
                        .catch(() =>
                          notifySite("Le commentaire n’a pas pu être sauvegardé.", {
                            kind: "error",
                          }),
                        );
                    }}
                  >
                    Sauvegarder le commentaire
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t-2 border-ae2v-black/10">
                <div className="flex gap-2">
                  {personIdForEmail(selectedCandidature.email) && (
                    <Button asChild size="sm" variant="outline">
                      <Link
                        to="/bureau/personnes/$personId"
                        params={{ personId: personIdForEmail(selectedCandidature.email)! }}
                      >
                        <Users className="size-3.5" /> Voir le profil
                      </Link>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => {
                      void saveCandidaturePatch(selectedCandidature.id, { status: "ACCEPTEE" })
                        .then(() => {
                          addAuditLog(
                            "VALIDATION_CANDIDATURE",
                            `Candidature ${selectedCandidature.id} acceptée`,
                          );
                          setSelectedCandidature(null);
                        })
                        .catch(() =>
                          notifySite("La décision n’a pas pu être enregistrée.", { kind: "error" }),
                        );
                    }}
                  >
                    Accepter Candidature
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      void saveCandidaturePatch(selectedCandidature.id, { status: "ENTRETIEN" })
                        .then(() =>
                          openEmailComposer(
                            selectedCandidature.email,
                            "[AE2V] Proposition d’entretien — candidature au BDE",
                            `Bonjour ${selectedCandidature.name.split(" ")[0]},\n\nMerci pour ta candidature pour rejoindre le BDE AE2V. Nous souhaitons te proposer un entretien afin d’échanger sur tes motivations et le pôle ${selectedCandidature.pole}.\n\nPeux-tu nous répondre avec tes disponibilités afin que nous fixions un créneau ?\n\nÀ bientôt,\nL’équipe du BDE AE2V`,
                            { category: "TRANSACTIONNEL", showTemplates: false },
                          ),
                        )
                        .then(() => setSelectedCandidature(null))
                        .catch(() =>
                          notifySite("Le statut de la candidature n’a pas pu être enregistré.", {
                            kind: "error",
                          }),
                        );
                    }}
                  >
                    Proposer un entretien
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
        {orderFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ae2v-black/60 p-4 backdrop-blur-sm">
            <form
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border-2 border-ae2v-black bg-card p-6 shadow-2xl"
              onSubmit={async (event) => {
                event.preventDefault();
                const lineItems = orderDraft.items.map((item) => {
                  const quantity = Number.parseInt(item.quantity, 10);
                  const unitPrice = Number(item.amountEuros.replace(",", "."));
                  return {
                    productName: item.productName.trim(),
                    quantity,
                    unitPriceCents: Math.round(unitPrice * 100),
                  };
                });
                if (
                  lineItems.some(
                    (item) =>
                      !item.productName ||
                      !Number.isInteger(item.quantity) ||
                      item.quantity <= 0 ||
                      !Number.isInteger(item.unitPriceCents) ||
                      item.unitPriceCents <= 0,
                  )
                ) {
                  notifySite(
                    "Chaque ligne doit avoir un article, une quantité et un prix valides.",
                    { kind: "warning" },
                  );
                  return;
                }
                const totalCents = lineItems.reduce(
                  (total, item) => total + item.quantity * item.unitPriceCents,
                  0,
                );
                const isLocalDemo = !account || account.id.startsWith("acc-");
                try {
                  if (isLocalDemo) {
                    addOrder({
                      customerName: orderDraft.customerName.trim(),
                      customerEmail: orderDraft.customerEmail.trim().toLowerCase(),
                      items: [
                        ...lineItems.map((item) => ({
                          productId: "helloasso-manual",
                          productName: item.productName,
                          qty: item.quantity,
                          unitPriceCents: item.unitPriceCents,
                        })),
                      ],
                      totalCents,
                      status: orderDraft.paymentStatus === "CONFIRME" ? "PAYEE" : "EN_ATTENTE",
                      notes: orderDraft.notes.trim() || "Vente importée depuis HelloAsso.",
                    });
                    setOrders(getDynamicOrders());
                  } else {
                    const result = await importHelloAssoOrder({
                      data: {
                        ...(orderDraft.memberId ? { userId: orderDraft.memberId } : {}),
                        customerName: orderDraft.customerName.trim(),
                        customerEmail: orderDraft.customerEmail.trim().toLowerCase(),
                        productName: lineItems[0]?.productName ?? "Commande HelloAsso",
                        amountCents: totalCents,
                        items: lineItems,
                        ...(orderDraft.helloAssoId.trim()
                          ? { helloAssoId: orderDraft.helloAssoId.trim() }
                          : {}),
                        paymentStatus: orderDraft.paymentStatus,
                        ...(orderDraft.notes.trim() ? { notes: orderDraft.notes.trim() } : {}),
                      },
                    });
                    if (result.ok) setServerBilling(await getBureauBilling());
                  }
                  addAuditLog(
                    "COMMANDE_FORMULAIRE",
                    `Commande saisie pour ${orderDraft.customerEmail}`,
                  );
                  setOrderFormOpen(false);
                } catch {
                  notifySite(
                    "La commande n’a pas pu être enregistrée. Vérifiez les informations.",
                    { kind: "error" },
                  );
                }
              }}
            >
              <div className="flex items-center justify-between border-b-2 border-ae2v-black pb-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-ae2v-red">
                    HelloAsso
                  </p>
                  <h2 className="font-impact text-2xl uppercase">Ajouter une commande</h2>
                </div>
                <button type="button" onClick={() => setOrderFormOpen(false)} aria-label="Fermer">
                  <X className="size-5" />
                </button>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {serverMembers.length > 0 && (
                  <label className="text-xs font-bold uppercase sm:col-span-2">
                    Rattacher à un adhérent
                    <select
                      value={orderDraft.memberId}
                      onChange={(event) => {
                        const memberId = event.target.value;
                        const linked = serverMembers.find((member) => member.id === memberId);
                        setOrderDraft({
                          ...orderDraft,
                          memberId,
                          ...(linked
                            ? {
                                customerName: `${linked.firstName} ${linked.lastName}`,
                                customerEmail: linked.email,
                              }
                            : {}),
                        });
                      }}
                      className="mt-1 min-h-10 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-3 text-sm font-normal"
                    >
                      <option value="">Aucun rattachement automatique</option>
                      {serverMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.firstName} {member.lastName} · {member.email}
                        </option>
                      ))}
                    </select>
                    <span className="mt-1 block text-[0.65rem] font-normal normal-case text-muted-foreground">
                      La commande, le paiement et la facture seront visibles sur sa fiche 360°.
                    </span>
                  </label>
                )}
                {(
                  [
                    ["customerName", "Nom du client", "text", true],
                    ["customerEmail", "E-mail du client", "email", true],
                    ["helloAssoId", "Référence HelloAsso (facultative)", "text", false],
                  ] as const
                ).map(([field, label, type, required]) => (
                  <label key={field} className="text-xs font-bold uppercase">
                    {label}
                    <input
                      required={required}
                      type={type}
                      value={orderDraft[field]}
                      onChange={(event) =>
                        setOrderDraft({ ...orderDraft, [field]: event.target.value })
                      }
                      className="mt-1 min-h-10 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-3 text-sm font-normal"
                    />
                  </label>
                ))}
                <label className="text-xs font-bold uppercase">
                  État du paiement
                  <select
                    value={orderDraft.paymentStatus}
                    onChange={(event) =>
                      setOrderDraft({
                        ...orderDraft,
                        paymentStatus: event.target.value as "EN_ATTENTE" | "CONFIRME",
                      })
                    }
                    className="mt-1 min-h-10 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-3 text-sm font-normal"
                  >
                    <option value="EN_ATTENTE">Paiement en attente</option>
                    <option value="CONFIRME">Paiement confirmé</option>
                  </select>
                  <span className="mt-1 block text-[0.65rem] font-normal normal-case text-muted-foreground">
                    La facture est créée après confirmation du paiement.
                  </span>
                </label>
                <div className="sm:col-span-2 border-2 border-ae2v-black bg-ae2v-offwhite p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase">Articles de la commande</p>
                      <p className="text-[0.65rem] normal-case text-muted-foreground">
                        Ajoutez chaque article HelloAsso avec sa quantité et son prix unitaire.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setOrderDraft({
                          ...orderDraft,
                          items: [
                            ...orderDraft.items,
                            { productName: "", amountEuros: "", quantity: "1" },
                          ],
                        })
                      }
                    >
                      <Plus className="size-3.5" /> Ajouter une ligne
                    </Button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {orderDraft.items.map((item, index) => (
                      <div
                        key={`order-line-${index}`}
                        className="grid gap-2 border-2 border-ae2v-black/15 bg-card p-2 sm:grid-cols-[minmax(0,1fr)_7rem_6rem_auto] sm:items-end"
                      >
                        <label className="text-[0.65rem] font-bold uppercase">
                          Article {index + 1}
                          <input
                            required
                            value={item.productName}
                            onChange={(event) =>
                              setOrderDraft({
                                ...orderDraft,
                                items: orderDraft.items.map((line, lineIndex) =>
                                  lineIndex === index
                                    ? { ...line, productName: event.target.value }
                                    : line,
                                ),
                              })
                            }
                            className="mt-1 min-h-10 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-2 text-sm font-normal"
                            placeholder="Sweat AE2V"
                          />
                        </label>
                        <label className="text-[0.65rem] font-bold uppercase">
                          Quantité
                          <input
                            required
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={(event) =>
                              setOrderDraft({
                                ...orderDraft,
                                items: orderDraft.items.map((line, lineIndex) =>
                                  lineIndex === index
                                    ? { ...line, quantity: event.target.value }
                                    : line,
                                ),
                              })
                            }
                            className="mt-1 min-h-10 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-2 text-sm font-normal"
                          />
                        </label>
                        <label className="text-[0.65rem] font-bold uppercase">
                          Prix unitaire (€)
                          <input
                            required
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.amountEuros}
                            onChange={(event) =>
                              setOrderDraft({
                                ...orderDraft,
                                items: orderDraft.items.map((line, lineIndex) =>
                                  lineIndex === index
                                    ? { ...line, amountEuros: event.target.value }
                                    : line,
                                ),
                              })
                            }
                            className="mt-1 min-h-10 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-2 text-sm font-normal"
                          />
                        </label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={orderDraft.items.length === 1}
                          onClick={() =>
                            setOrderDraft({
                              ...orderDraft,
                              items: orderDraft.items.filter((_, lineIndex) => lineIndex !== index),
                            })
                          }
                        >
                          <Trash2 className="size-3.5" />
                          <span className="sr-only">Supprimer la ligne {index + 1}</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                <label className="text-xs font-bold uppercase sm:col-span-2">
                  Notes personnalisées
                  <textarea
                    rows={4}
                    value={orderDraft.notes}
                    onChange={(event) =>
                      setOrderDraft({ ...orderDraft, notes: event.target.value })
                    }
                    className="mt-1 w-full border-2 border-ae2v-black bg-ae2v-offwhite p-3 text-sm font-normal"
                    placeholder="Taille, retrait, précision HelloAsso…"
                  />
                </label>
              </div>
              <div className="mt-5 flex justify-end gap-2 border-t-2 border-ae2v-black/15 pt-4">
                <Button type="button" variant="outline" onClick={() => setOrderFormOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" variant="black">
                  Enregistrer la commande
                </Button>
              </div>
            </form>
          </div>
        )}

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
                        onClick={async () => {
                          const isLocalDemo = !account || account.id.startsWith("acc-");
                          if (!isLocalDemo && selectedOrder.serverId) {
                            try {
                              await updateOrderServerFn({
                                data: {
                                  orderId: selectedOrder.serverId,
                                  status: st,
                                  notes: orderNoteInput,
                                },
                              });
                            } catch {
                              notifySite("Le statut de la commande n’a pas pu être enregistré.", {
                                kind: "error",
                              });
                              return;
                            }
                          }
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

                <div className="border-t-2 border-ae2v-black/10 pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!canFinance || selectedOrder.status === "ANNULEE"}
                    title={!canFinance ? "Droits trésorerie requis" : undefined}
                    onClick={() =>
                      setRefundDraft({
                        kind: "order",
                        id: selectedOrder.id,
                        maxCents: selectedOrder.totalCents,
                        amountEuros: (selectedOrder.totalCents / 100).toFixed(2),
                        note: "",
                      })
                    }
                  >
                    <RotateCcw className="size-3.5" /> Créer un remboursement
                  </Button>
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

        {refundDraft && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ae2v-black/60 p-4 backdrop-blur-sm">
            <form
              className="w-full max-w-lg border-2 border-ae2v-black bg-card p-6 shadow-2xl"
              onSubmit={(event) => {
                event.preventDefault();
                void submitRefund();
              }}
            >
              <div className="mb-4 flex items-start justify-between gap-4 border-b-2 border-ae2v-black pb-3">
                <div>
                  <p className="text-[0.65rem] font-bold uppercase tracking-widest text-ae2v-red">
                    Action financière contrôlée
                  </p>
                  <h3 className="font-impact text-2xl uppercase">Créer un remboursement</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Maximum remboursable : {formatCents(refundDraft.maxCents)}. L’opération sera
                    journalisée.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRefundDraft(null)}
                  aria-label="Fermer"
                  className="p-1 hover:bg-ae2v-black/10"
                >
                  <X className="size-5" />
                </button>
              </div>
              <label className="block text-xs font-bold uppercase">
                Montant à rembourser (€) *
                <input
                  autoFocus
                  type="number"
                  min="0.01"
                  max={(refundDraft.maxCents / 100).toFixed(2)}
                  step="0.01"
                  value={refundDraft.amountEuros}
                  onChange={(event) =>
                    setRefundDraft({ ...refundDraft, amountEuros: event.target.value })
                  }
                  className="mt-1 min-h-11 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-3 text-sm"
                  required
                />
              </label>
              <label className="mt-4 block text-xs font-bold uppercase">
                Motif du remboursement *
                <textarea
                  rows={4}
                  value={refundDraft.note}
                  onChange={(event) => setRefundDraft({ ...refundDraft, note: event.target.value })}
                  placeholder="Ex. Désistement avant l’événement, commande indisponible…"
                  className="mt-1 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-3 py-2 font-sans text-sm font-normal"
                  required
                />
              </label>
              <div className="mt-4 flex justify-end gap-2 border-t-2 border-ae2v-black/10 pt-3">
                <Button type="button" variant="secondary" onClick={() => setRefundDraft(null)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={!refundDraft.note.trim()}>
                  <RotateCcw className="size-3.5" /> Confirmer le remboursement
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* MODAL 4: Édition rapide d'événement                               */}
        {/* ------------------------------------------------------------------ */}
        {eventFormOpen && editingEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ae2v-black/60 p-4 backdrop-blur-sm sm:p-6">
            <div className="my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden border-2 border-ae2v-black bg-card shadow-2xl sm:max-h-[calc(100dvh-3rem)]">
              <div className="mb-4 flex shrink-0 items-center justify-between border-b-2 border-ae2v-black bg-card px-6 pb-3 pt-6">
                <h3 className="font-impact text-2xl uppercase">Éditer un événement</h3>
                <button type="button" onClick={() => setEventFormOpen(false)} aria-label="Fermer">
                  <X className="size-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <div className="grid gap-4 text-xs sm:grid-cols-2">
                  <label className="sm:col-span-2 font-bold uppercase">
                    Titre
                    <input
                      className="mt-1 min-h-10 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-3 font-sans text-sm font-normal"
                      value={editingEvent.title}
                      onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                      required
                    />
                  </label>
                  <label className="font-bold uppercase">
                    Date affichée
                    <input
                      className="mt-1 min-h-10 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-3 font-sans text-sm font-normal"
                      value={editingEvent.date}
                      onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                      required
                    />
                  </label>
                  <label className="font-bold uppercase">
                    Horaires
                    <input
                      className="mt-1 min-h-10 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-3 font-sans text-sm font-normal"
                      value={editingEvent.doors}
                      onChange={(e) => setEditingEvent({ ...editingEvent, doors: e.target.value })}
                      placeholder="À déterminer"
                      required
                    />
                  </label>
                  <label className="font-bold uppercase">
                    Lieu
                    <input
                      className="mt-1 min-h-10 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-3 font-sans text-sm font-normal"
                      value={editingEvent.place}
                      onChange={(e) => setEditingEvent({ ...editingEvent, place: e.target.value })}
                      required
                    />
                  </label>
                  <label className="font-bold uppercase">
                    Adresse / accès précis
                    <input
                      className="mt-1 min-h-10 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-3 font-sans text-sm font-normal"
                      value={editingEvent.address}
                      onChange={(e) =>
                        setEditingEvent({ ...editingEvent, address: e.target.value })
                      }
                      placeholder="À déterminer"
                      required
                    />
                  </label>
                  <label className="font-bold uppercase">
                    Capacité
                    <input
                      type="number"
                      min={1}
                      className="mt-1 min-h-10 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-3 font-sans text-sm font-normal"
                      value={editingEvent.capacity}
                      onChange={(e) =>
                        setEditingEvent({
                          ...editingEvent,
                          capacity: Math.max(editingEvent.registered, Number(e.target.value) || 1),
                        })
                      }
                    />
                  </label>
                  <label className="font-bold uppercase">
                    Statut
                    <select
                      className="mt-1 min-h-10 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-3 font-sans text-sm font-normal"
                      value={editingEvent.status}
                      onChange={(e) =>
                        setEditingEvent({ ...editingEvent, status: e.target.value as EventStatus })
                      }
                    >
                      {Object.entries(eventStatusLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center gap-2 self-end pb-2 font-bold uppercase">
                    <input
                      type="checkbox"
                      checked={editingEvent.waitlist}
                      onChange={(e) =>
                        setEditingEvent({ ...editingEvent, waitlist: e.target.checked })
                      }
                    />
                    Liste d’attente activée
                  </label>
                  <label className="font-bold uppercase">
                    Ouverture des inscriptions
                    <input
                      className="mt-1 min-h-10 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-3 font-sans text-sm font-normal"
                      value={editingEvent.registrationOpensAt}
                      onChange={(e) =>
                        setEditingEvent({ ...editingEvent, registrationOpensAt: e.target.value })
                      }
                      placeholder="À déterminer"
                      required
                    />
                  </label>
                  <label className="font-bold uppercase">
                    Fermeture des inscriptions
                    <input
                      className="mt-1 min-h-10 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-3 font-sans text-sm font-normal"
                      value={editingEvent.registrationClosesAt}
                      onChange={(e) =>
                        setEditingEvent({ ...editingEvent, registrationClosesAt: e.target.value })
                      }
                      placeholder="À déterminer"
                      required
                    />
                  </label>
                  <div className="sm:col-span-2 border-2 border-ae2v-black bg-ae2v-offwhite p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-impact text-lg uppercase">Tarifs</p>
                        <p className="text-[0.65rem] font-normal normal-case opacity-70">
                          Public, cotisant et membre du bureau restent disponibles mais peuvent être
                          désactivés. Pour un événement gratuit, laissez les montants à 0 € et
                          désactivez les tarifs qui ne doivent pas être proposés.
                        </p>
                      </div>
                      <label className="flex min-h-10 shrink-0 items-center gap-2 border-2 border-ae2v-black bg-card px-3 py-2 text-xs font-bold uppercase">
                        <input
                          type="checkbox"
                          checked={editingEvent.tiers
                            .filter((tier) => !tier.disabled)
                            .every((tier) => tier.priceCents === 0)}
                          onChange={(event) => {
                            if (!event.target.checked) return;
                            setEditingEvent({
                              ...editingEvent,
                              tiers: editingEvent.tiers.map((tier) => ({
                                ...tier,
                                priceCents: 0,
                                disabled:
                                  tier.audience === "public" ? false : (tier.disabled ?? false),
                              })),
                            });
                          }}
                          className="size-4 accent-ae2v-red"
                        />
                        Événement gratuit
                      </label>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          setEditingEvent({
                            ...editingEvent,
                            tiers: [
                              ...editingEvent.tiers,
                              {
                                id: `custom-${Date.now()}`,
                                label: "Nouveau tarif",
                                priceCents: 0,
                                audience: "public",
                                disabled: false,
                                system: false,
                              },
                            ],
                          })
                        }
                      >
                        <Plus className="size-3.5" /> Ajouter un tarif
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {editingEvent.tiers.map((tier, index) => (
                        <div
                          key={tier.id}
                          className="grid gap-2 border-2 border-ae2v-black/15 bg-card p-2 sm:grid-cols-[1.4fr_0.7fr_0.8fr_auto_auto] sm:items-center"
                        >
                          <input
                            aria-label={`Nom du tarif ${index + 1}`}
                            className="min-h-9 border-2 border-ae2v-black bg-ae2v-offwhite px-2 text-xs"
                            value={tier.label}
                            onChange={(e) =>
                              setEditingEvent({
                                ...editingEvent,
                                tiers: editingEvent.tiers.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, label: e.target.value } : item,
                                ),
                              })
                            }
                          />
                          <input
                            aria-label={`Prix du tarif ${index + 1}`}
                            type="number"
                            min={0}
                            step={0.01}
                            className="min-h-9 border-2 border-ae2v-black bg-ae2v-offwhite px-2 text-xs"
                            value={(tier.priceCents / 100).toFixed(2)}
                            onChange={(e) =>
                              setEditingEvent({
                                ...editingEvent,
                                tiers: editingEvent.tiers.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        priceCents: Math.max(
                                          0,
                                          Math.round(Number(e.target.value || 0) * 100),
                                        ),
                                      }
                                    : item,
                                ),
                              })
                            }
                          />
                          <select
                            aria-label={`Accès du tarif ${index + 1}`}
                            disabled={tier.system}
                            className="min-h-9 border-2 border-ae2v-black bg-ae2v-offwhite px-2 text-xs"
                            value={tier.audience}
                            onChange={(e) =>
                              setEditingEvent({
                                ...editingEvent,
                                tiers: editingEvent.tiers.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, audience: e.target.value as EventTier["audience"] }
                                    : item,
                                ),
                              })
                            }
                          >
                            <option value="public">Public</option>
                            <option value="adherent">Cotisant</option>
                            <option value="bureau">Bureau</option>
                          </select>
                          <label className="flex items-center gap-1 text-[0.65rem] font-bold uppercase">
                            <input
                              type="checkbox"
                              checked={!tier.disabled}
                              onChange={(e) =>
                                setEditingEvent({
                                  ...editingEvent,
                                  tiers: editingEvent.tiers.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, disabled: !e.target.checked }
                                      : item,
                                  ),
                                })
                              }
                            />
                            Actif
                          </label>
                          <input
                            aria-label={`Avertissement du tarif ${index + 1}`}
                            className="min-h-9 border-2 border-ae2v-black bg-ae2v-offwhite px-2 text-xs sm:col-span-3"
                            value={tier.note ?? ""}
                            onChange={(e) =>
                              setEditingEvent({
                                ...editingEvent,
                                tiers: editingEvent.tiers.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, note: e.target.value } : item,
                                ),
                              })
                            }
                            placeholder="Avertissement facultatif avant validation (tarif custom)"
                          />
                          {!tier.system && (
                            <button
                              type="button"
                              className="min-h-9 border-2 border-ae2v-red px-2 text-xs font-bold text-ae2v-red"
                              onClick={() =>
                                setEditingEvent({
                                  ...editingEvent,
                                  tiers: editingEvent.tiers.filter(
                                    (_, itemIndex) => itemIndex !== index,
                                  ),
                                })
                              }
                            >
                              Supprimer
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <label className="sm:col-span-2 font-bold uppercase">
                    Résumé
                    <textarea
                      rows={3}
                      className="mt-1 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-3 py-2 font-sans text-sm font-normal"
                      value={editingEvent.summary}
                      onChange={(e) =>
                        setEditingEvent({ ...editingEvent, summary: e.target.value })
                      }
                      required
                    />
                  </label>
                  <label className="sm:col-span-2 font-bold uppercase">
                    Description complète
                    <textarea
                      rows={4}
                      className="mt-1 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-3 py-2 font-sans text-sm font-normal"
                      value={editingEvent.description}
                      onChange={(e) =>
                        setEditingEvent({ ...editingEvent, description: e.target.value })
                      }
                      placeholder="Présentez l’événement aux participants."
                      required
                    />
                  </label>
                  <label className="sm:col-span-2 font-bold uppercase">
                    Visuel (facultatif)
                    <input
                      type="url"
                      className="mt-1 min-h-10 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-3 font-sans text-sm font-normal"
                      value={editingEvent.image}
                      onChange={(e) => setEditingEvent({ ...editingEvent, image: e.target.value })}
                      placeholder="https://… ou laisser vide"
                    />
                    <span className="mt-1 block text-[0.65rem] font-normal normal-case text-muted-foreground">
                      Le visuel est facultatif. Sans image, la page utilise sa mise en page de
                      secours.
                    </span>
                    <div className="mt-3 overflow-hidden border-2 border-ae2v-black/15 bg-ae2v-black/5">
                      {editingEvent.image ? (
                        <img
                          src={editingEvent.image}
                          alt="Aperçu du visuel de l’événement"
                          className="h-32 w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-32 items-center justify-center text-xs font-bold uppercase text-muted-foreground">
                          Aucun visuel · placeholder AE2V
                        </div>
                      )}
                    </div>
                  </label>
                  <label className="font-bold uppercase">
                    Accès
                    <textarea
                      rows={3}
                      className="mt-1 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-3 py-2 font-sans text-sm font-normal"
                      value={editingEvent.access}
                      onChange={(e) => setEditingEvent({ ...editingEvent, access: e.target.value })}
                      placeholder="Adresse, transports, accès PMR…"
                    />
                  </label>
                  <label className="font-bold uppercase">
                    Informations pratiques
                    <textarea
                      rows={3}
                      className="mt-1 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-3 py-2 font-sans text-sm font-normal"
                      value={editingEvent.practical.join("\n")}
                      onChange={(e) =>
                        setEditingEvent({
                          ...editingEvent,
                          practical: e.target.value
                            .split("\n")
                            .map((line) => line.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="Une information par ligne"
                    />
                  </label>
                  <div className="sm:col-span-2 border-2 border-ae2v-black bg-ae2v-offwhite p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold uppercase">Programme</p>
                        <p className="text-[0.65rem] font-normal normal-case text-muted-foreground">
                          Facultatif. Ajoutez les étapes directement, sans format technique.
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          setEditingEvent({
                            ...editingEvent,
                            program: [...editingEvent.program, { time: "", label: "", detail: "" }],
                          })
                        }
                      >
                        <Plus className="size-3.5" /> Ajouter une étape
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {editingEvent.program.map((step, index) => (
                        <div
                          key={`${index}-${step.time}`}
                          className="grid gap-2 border-2 border-ae2v-black/15 bg-card p-2 sm:grid-cols-[0.6fr_1fr_1fr_auto]"
                        >
                          <input
                            aria-label={`Horaire de l’étape ${index + 1}`}
                            value={step.time}
                            placeholder="18h00"
                            onChange={(e) =>
                              setEditingEvent({
                                ...editingEvent,
                                program: editingEvent.program.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, time: e.target.value } : item,
                                ),
                              })
                            }
                            className="min-h-9 border-2 border-ae2v-black bg-ae2v-offwhite px-2 text-xs"
                          />
                          <input
                            aria-label={`Nom de l’étape ${index + 1}`}
                            value={step.label}
                            placeholder="Accueil"
                            onChange={(e) =>
                              setEditingEvent({
                                ...editingEvent,
                                program: editingEvent.program.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, label: e.target.value } : item,
                                ),
                              })
                            }
                            className="min-h-9 border-2 border-ae2v-black bg-ae2v-offwhite px-2 text-xs"
                          />
                          <input
                            aria-label={`Détail de l’étape ${index + 1}`}
                            value={step.detail ?? ""}
                            placeholder="Détail facultatif"
                            onChange={(e) =>
                              setEditingEvent({
                                ...editingEvent,
                                program: editingEvent.program.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, detail: e.target.value } : item,
                                ),
                              })
                            }
                            className="min-h-9 border-2 border-ae2v-black bg-ae2v-offwhite px-2 text-xs"
                          />
                          <button
                            type="button"
                            className="min-h-9 border-2 border-ae2v-red px-2 text-xs font-bold text-ae2v-red"
                            onClick={() =>
                              setEditingEvent({
                                ...editingEvent,
                                program: editingEvent.program.filter(
                                  (_, itemIndex) => itemIndex !== index,
                                ),
                              })
                            }
                          >
                            Supprimer
                          </button>
                        </div>
                      ))}
                      {!editingEvent.program.length && (
                        <p className="text-xs text-muted-foreground">Aucune étape ajoutée.</p>
                      )}
                    </div>
                  </div>
                  <div className="sm:col-span-2 border-2 border-ae2v-black bg-ae2v-offwhite p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold uppercase">Sections de texte personnalisées</p>
                        <p className="text-[0.65rem] font-normal normal-case text-muted-foreground">
                          Facultatif. Utilisez-les pour ajouter une information libre à la page
                          publique.
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          setEditingEvent({
                            ...editingEvent,
                            customSections: [
                              ...(editingEvent.customSections ?? []),
                              { title: "", body: "" },
                            ],
                          })
                        }
                      >
                        <Plus className="size-3.5" /> Ajouter une section
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(editingEvent.customSections ?? []).map((section, index) => (
                        <div
                          key={`${index}-${section.title}`}
                          className="border-2 border-ae2v-black/15 bg-card p-2"
                        >
                          <div className="flex gap-2">
                            <input
                              aria-label={`Titre de la section ${index + 1}`}
                              value={section.title}
                              placeholder="Titre de la section"
                              onChange={(e) =>
                                setEditingEvent({
                                  ...editingEvent,
                                  customSections: (editingEvent.customSections ?? []).map(
                                    (item, itemIndex) =>
                                      itemIndex === index
                                        ? { ...item, title: e.target.value }
                                        : item,
                                  ),
                                })
                              }
                              className="min-h-9 min-w-0 flex-1 border-2 border-ae2v-black bg-ae2v-offwhite px-2 text-xs"
                            />
                            <button
                              type="button"
                              className="min-h-9 border-2 border-ae2v-red px-2 text-xs font-bold text-ae2v-red"
                              onClick={() =>
                                setEditingEvent({
                                  ...editingEvent,
                                  customSections: (editingEvent.customSections ?? []).filter(
                                    (_, itemIndex) => itemIndex !== index,
                                  ),
                                })
                              }
                            >
                              Supprimer
                            </button>
                          </div>
                          <textarea
                            aria-label={`Contenu de la section ${index + 1}`}
                            rows={3}
                            value={section.body}
                            placeholder="Contenu de la section"
                            onChange={(e) =>
                              setEditingEvent({
                                ...editingEvent,
                                customSections: (editingEvent.customSections ?? []).map(
                                  (item, itemIndex) =>
                                    itemIndex === index ? { ...item, body: e.target.value } : item,
                                ),
                              })
                            }
                            className="mt-2 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-2 py-2 text-xs"
                          />
                        </div>
                      ))}
                      {!(editingEvent.customSections ?? []).length && (
                        <p className="text-xs text-muted-foreground">
                          Aucune section personnalisée.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 justify-end gap-2 border-t-2 border-ae2v-black/10 px-6 pb-6 pt-4">
                <Button variant="secondary" onClick={() => setEventFormOpen(false)}>
                  Annuler
                </Button>
                <Button
                  variant="black"
                  disabled={
                    !editingEvent.title.trim() ||
                    !editingEvent.date.trim() ||
                    !editingEvent.doors.trim() ||
                    !editingEvent.place.trim() ||
                    !editingEvent.address.trim() ||
                    !editingEvent.summary.trim() ||
                    !editingEvent.description.trim() ||
                    !editingEvent.registrationOpensAt.trim() ||
                    !editingEvent.registrationClosesAt.trim()
                  }
                  onClick={async () => {
                    const requiredEventFields = [
                      [editingEvent.title, "titre"],
                      [editingEvent.date, "date"],
                      [editingEvent.doors, "horaires"],
                      [editingEvent.place, "lieu"],
                      [editingEvent.address, "adresse"],
                      [editingEvent.summary, "résumé"],
                      [editingEvent.description, "description"],
                      [editingEvent.registrationOpensAt, "ouverture des inscriptions"],
                      [editingEvent.registrationClosesAt, "fermeture des inscriptions"],
                    ] as const;
                    const missing = requiredEventFields.find(([value]) => !value.trim());
                    if (missing) {
                      notifySite(`Le champ ${missing[1]} est obligatoire.`, { kind: "warning" });
                      return;
                    }
                    const incompleteCustomSection = (editingEvent.customSections ?? []).find(
                      (section) => !section.title.trim(),
                    );
                    if (incompleteCustomSection) {
                      notifySite("Chaque section personnalisée doit avoir un titre.", {
                        kind: "warning",
                      });
                      return;
                    }
                    const current = getDynamicEvents();
                    const exists = current.some((event) => event.id === editingEvent.id);
                    const next = exists
                      ? current.map((event) =>
                          event.id === editingEvent.id ? editingEvent : event,
                        )
                      : [editingEvent, ...current];
                    const isLocalDemo = !account || account.id.startsWith("acc-");
                    if (!isLocalDemo) {
                      try {
                        await saveEvent({
                          data: {
                            eventId: editingEvent.id,
                            title: editingEvent.title.trim(),
                            slug: editingEvent.id.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                            kind: editingEvent.kind,
                            date: editingEvent.date,
                            doors: editingEvent.doors,
                            place: editingEvent.place,
                            address: editingEvent.address,
                            summary: editingEvent.summary,
                            capacity: editingEvent.capacity,
                            registered: editingEvent.registered,
                            status: editingEvent.status,
                            waitlist: editingEvent.waitlist,
                            description: editingEvent.description || editingEvent.summary,
                            image: editingEvent.image,
                            registrationOpensAt: editingEvent.registrationOpensAt,
                            registrationClosesAt: editingEvent.registrationClosesAt,
                            program: editingEvent.program,
                            access: editingEvent.access,
                            practical: editingEvent.practical,
                            customSections: editingEvent.customSections ?? [],
                            tiers: editingEvent.tiers,
                          },
                        });
                        const refreshedEvents = await getBureauEvents();
                        setEvents(refreshedEvents.map(publicRecordToEvent));
                      } catch {
                        notifySite("L’événement n’a pas pu être enregistré côté serveur.", {
                          kind: "error",
                        });
                        return;
                      }
                    }
                    if (isLocalDemo) {
                      saveDynamicEvents(next);
                      setEvents(next);
                    }
                    addAuditLog(
                      "EVENEMENT_ENREGISTRE",
                      `Événement ${editingEvent.title} enregistré`,
                    );
                    setEventFormOpen(false);
                    setEditingEvent(null);
                  }}
                >
                  Enregistrer l’événement
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* MODAL 5: Vue participants                                           */}
        {/* ------------------------------------------------------------------ */}
        {selectedAttendeesEvent && (
          <BureauModal
            open
            onOpenChange={(open) => {
              if (!open) setSelectedAttendeesEvent(null);
            }}
            title={`Participants — ${selectedAttendeesEvent.title}`}
            description="Recherchez une inscription, consultez son paiement et effectuez les actions d’accueil."
            className="max-w-6xl"
            footer={
              <Button variant="black" onClick={() => setSelectedAttendeesEvent(null)}>
                Fermer
              </Button>
            }
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <EventMetric
                label="Inscrits"
                value={String(selectedAttendeesEvent.registered)}
                tone="neutral"
              />
              <EventMetric
                label="Capacité"
                value={String(selectedAttendeesEvent.capacity)}
                tone="neutral"
              />
              <EventMetric
                label="Places restantes"
                value={String(
                  Math.max(0, selectedAttendeesEvent.capacity - selectedAttendeesEvent.registered),
                )}
                tone={
                  selectedAttendeesEvent.registered >= selectedAttendeesEvent.capacity
                    ? "neutral"
                    : "green"
                }
              />
            </div>
            {eventStats && (
              <div className="mt-3 grid gap-3 sm:grid-cols-4">
                <EventMetric
                  label="Paiements en attente"
                  value={String(eventStats.pendingPayments)}
                  tone="neutral"
                />
                <EventMetric
                  label="Paiements confirmés"
                  value={String(eventStats.confirmedPayments)}
                  tone="green"
                />
                <EventMetric label="Présents" value={String(eventStats.present)} tone="green" />
                <EventMetric
                  label="Annulations"
                  value={String(eventStats.cancelled)}
                  tone="neutral"
                />
                <EventMetric
                  label="Liste d’attente"
                  value={String(eventStats.waitlisted)}
                  tone="neutral"
                />
                <EventMetric
                  label="Recette confirmée"
                  value={formatCents(eventStats.revenueConfirmedCents)}
                  tone="green"
                />
              </div>
            )}
            <div className="mt-5 border-2 border-ae2v-black/15 bg-ae2v-offwhite p-4 text-sm">
              <p className="font-bold">Liste des participants</p>
              {eventAttendeesLoading ? (
                <p className="mt-2 text-xs text-muted-foreground">Chargement des inscriptions…</p>
              ) : !Array.isArray(eventAttendees) || eventAttendees.length === 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Aucun participant inscrit à cet événement.
                </p>
              ) : (
                <div className="mt-3">
                  <DataTable
                    rows={eventAttendees}
                    idPrefix="event-participants"
                    searchable={(attendee) =>
                      `${attendee.name} ${attendee.email} ${attendee.tier} ${attendee.paymentStatus ?? ""} ${attendee.ticketStatus ?? ""}`
                    }
                    searchLabel="Rechercher un participant"
                    searchPlaceholder="Nom, e-mail, tarif ou statut…"
                    caption={`Participants de ${selectedAttendeesEvent.title}`}
                    columns={[
                      {
                        key: "name",
                        header: "Participant",
                        render: (attendee) => (
                          <div className="min-w-0">
                            <p className="truncate font-bold">{attendee.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {attendee.email}
                            </p>
                          </div>
                        ),
                      },
                      {
                        key: "tier",
                        header: "Tarif",
                        render: (attendee) => (
                          <span>
                            {attendee.tier} · {formatCents(attendee.priceCents)}
                          </span>
                        ),
                      },
                      {
                        key: "paymentStatus",
                        header: "Paiement",
                        render: (attendee) => (
                          <StatusPill
                            tone={attendee.paymentStatus === "CONFIRME" ? "green" : "neutral"}
                          >
                            {attendee.paymentStatus === "CONFIRME" ? "Payé" : "En attente"}
                          </StatusPill>
                        ),
                      },
                      {
                        key: "ticketStatus",
                        header: "Billet",
                        render: (attendee) => (
                          <StatusPill
                            tone={attendee.ticketStatus === "utilise" ? "green" : "neutral"}
                          >
                            {attendee.ticketStatus === "utilise"
                              ? "Présent"
                              : (attendee.ticketStatus ?? "À vérifier")}
                          </StatusPill>
                        ),
                      },
                      {
                        key: "actions",
                        header: "Actions",
                        render: (attendee) => (
                          <div className="flex min-w-[14rem] flex-wrap justify-end gap-2">
                            {attendee.personId && (
                              <Button asChild size="sm" variant="outline">
                                <Link
                                  to="/bureau/personnes/$personId"
                                  params={{ personId: attendee.personId }}
                                >
                                  <Eye className="size-3.5" /> Voir le profil
                                </Link>
                              </Button>
                            )}
                            {attendee.paymentId && attendee.paymentStatus === "EN_ATTENTE" && (
                              <Button
                                size="sm"
                                variant="default"
                                disabled={!canFinance}
                                title={!canFinance ? "Droits trésorerie requis" : undefined}
                                onClick={async () => {
                                  try {
                                    await updatePaymentStatus({
                                      data: { paymentId: attendee.paymentId!, status: "CONFIRME" },
                                    });
                                    const refreshed = await getEventRegistrations({
                                      data: {
                                        eventId:
                                          selectedAttendeesEvent.serverId ??
                                          selectedAttendeesEvent.id,
                                      },
                                    });
                                    setEventAttendees(refreshed);
                                  } catch {
                                    notifySite("Le paiement n’a pas pu être confirmé.", {
                                      kind: "error",
                                    });
                                  }
                                }}
                              >
                                <CreditCard className="size-3.5" /> Confirmer le paiement
                              </Button>
                            )}
                            {attendee.ticketCode && attendee.ticketStatus === "valide" ? (
                              <Button
                                size="sm"
                                variant="black"
                                onClick={async () => {
                                  try {
                                    await checkInTicket({
                                      data: { ticketCode: attendee.ticketCode! },
                                    });
                                    const refreshed = await getEventRegistrations({
                                      data: {
                                        eventId:
                                          selectedAttendeesEvent.serverId ??
                                          selectedAttendeesEvent.id,
                                      },
                                    });
                                    setEventAttendees(refreshed);
                                  } catch {
                                    notifySite(
                                      "Le billet ne peut pas être pointé : paiement non confirmé ou billet invalide.",
                                    );
                                  }
                                }}
                              >
                                <Check className="size-3.5" /> Valider le check-in
                              </Button>
                            ) : (
                              <StatusPill
                                tone={attendee.ticketStatus === "utilise" ? "green" : "neutral"}
                              >
                                {attendee.ticketStatus === "utilise" ? "Présent" : "À vérifier"}
                              </StatusPill>
                            )}
                            {attendee.status !== "ANNULEE" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  if (
                                    !(await confirmSite(
                                      `Annuler l’inscription de ${attendee.name} ?`,
                                      {
                                        title: "Annuler cette inscription ?",
                                        confirmLabel: "Annuler l’inscription",
                                      },
                                    ))
                                  )
                                    return;
                                  try {
                                    await cancelEventRegistration({
                                      data: { registrationId: attendee.id },
                                    });
                                    const refreshed = await getEventRegistrations({
                                      data: {
                                        eventId:
                                          selectedAttendeesEvent.serverId ??
                                          selectedAttendeesEvent.id,
                                      },
                                    });
                                    setEventAttendees(refreshed);
                                  } catch {
                                    notifySite("L’inscription n’a pas pu être annulée.", {
                                      kind: "error",
                                    });
                                  }
                                }}
                              >
                                <XCircle className="size-3.5" /> Annuler l’inscription
                              </Button>
                            )}
                          </div>
                        ),
                      },
                    ]}
                  />
                </div>
              )}
            </div>
          </BureauModal>
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
                <div>ÉTAT: {selectedInvoice.status ?? "EMISE"}</div>
                {serverMembers.find(
                  (member) =>
                    member.email.toLowerCase() === selectedInvoice.customerEmail.toLowerCase(),
                ) && (
                  <div className="flex items-center justify-between gap-3 border-t border-ae2v-black/20 pt-2 font-sans">
                    <span>Profil adhérent lié : {selectedInvoice.customerName}</span>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedInvoice(null)}
                    >
                      <Link
                        to="/bureau/personnes/$personId"
                        params={{
                          personId:
                            serverMembers.find(
                              (member) =>
                                member.email.toLowerCase() ===
                                selectedInvoice.customerEmail.toLowerCase(),
                            )?.id ?? "",
                        }}
                      >
                        Voir le profil
                      </Link>
                    </Button>
                  </div>
                )}

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

              <div className="grid gap-3 border-2 border-ae2v-black/15 bg-ae2v-offwhite p-4 sm:grid-cols-2">
                <label className="text-xs font-bold uppercase">
                  Statut de la facture
                  <select
                    className="mt-1 block min-h-10 w-full border-2 border-ae2v-black bg-card px-2 font-sans text-sm font-normal"
                    value={invoiceEditStatus}
                    onChange={(event) =>
                      setInvoiceEditStatus(
                        event.target.value as
                          "EMISE" | "ANNULEE" | "REMBOURSEE" | "PARTIELLEMENT_REMBOURSEE",
                      )
                    }
                  >
                    <option value="EMISE">Émise</option>
                    <option value="ANNULEE">Annulée</option>
                    <option value="REMBOURSEE">Remboursée</option>
                    <option value="PARTIELLEMENT_REMBOURSEE">Partiellement remboursée</option>
                  </select>
                </label>
                <label className="text-xs font-bold uppercase sm:col-span-1">
                  Note interne
                  <textarea
                    rows={2}
                    className="mt-1 block w-full border-2 border-ae2v-black bg-card px-2 py-2 font-sans text-sm font-normal"
                    value={invoiceEditNotes}
                    onChange={(event) => setInvoiceEditNotes(event.target.value)}
                    placeholder="Motif, référence ou précision comptable"
                  />
                </label>
                <div className="flex items-center justify-between gap-2 sm:col-span-2">
                  {selectedInvoice.paymentId &&
                  selectedInvoice.paymentStatus !== "REMBOURSE" &&
                  selectedInvoice.paymentStatus !== "ANNULE" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!canFinance}
                      title={!canFinance ? "Droits trésorerie requis" : undefined}
                      onClick={async () => {
                        const paymentId = selectedInvoice.paymentId;
                        if (!paymentId) return;
                        const alreadyRefunded = selectedInvoice.refundedAmountCents ?? 0;
                        const remaining = Math.max(0, selectedInvoice.totalCents - alreadyRefunded);
                        if (!remaining) {
                          notifySite("Cette facture est déjà totalement remboursée.", {
                            kind: "warning",
                          });
                          return;
                        }
                        setRefundDraft({
                          kind: "invoice",
                          id: selectedInvoice.id,
                          maxCents: remaining,
                          amountEuros: (remaining / 100).toFixed(2),
                          note: "",
                        });
                      }}
                    >
                      <RotateCcw className="size-3.5" /> Rembourser
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!canFinance}
                    title={!canFinance ? "Droits trésorerie requis" : undefined}
                    onClick={async () => {
                      const isLocalDemo = !account || account.id.startsWith("acc-");
                      if (!isLocalDemo) {
                        try {
                          await updateInvoice({
                            data: {
                              invoiceId: selectedInvoice.id,
                              description:
                                selectedInvoice.lines?.[0]?.description ?? "Règlement AE2V",
                              paymentMethod: selectedInvoice.paymentMethod,
                              lines: (selectedInvoice.lines ?? []).map((line) => ({
                                description: line.description,
                                qty: line.qty,
                                unitPriceCents: line.unitPriceCents,
                              })),
                              status: invoiceEditStatus,
                              notes: invoiceEditNotes,
                            },
                          });
                          const refreshed = await getBureauBilling();
                          setServerBilling(refreshed);
                        } catch {
                          notifySite("La facture n’a pas pu être mise à jour.", { kind: "error" });
                          return;
                        }
                      } else {
                        saveDynamicInvoices(
                          safeInvoices.map((invoice) =>
                            invoice.id === selectedInvoice.id
                              ? { ...invoice, notes: invoiceEditNotes }
                              : invoice,
                          ),
                        );
                      }
                      addAuditLog("FACTURE_MODIFIEE", `Facture ${selectedInvoice.id} mise à jour`);
                      notifySite("Facture mise à jour.", { kind: "success" });
                    }}
                  >
                    <FileText className="size-3.5" /> Enregistrer la gestion
                  </Button>
                  <StatusPill tone={invoiceEditStatus === "EMISE" ? "green" : "neutral"}>
                    {invoiceEditStatus}
                  </StatusPill>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button
                  variant="black"
                  onClick={() =>
                    downloadInvoicePdf({
                      id: selectedInvoice.id,
                      date: selectedInvoice.date,
                      customerName: selectedInvoice.customerName,
                      customerEmail: selectedInvoice.customerEmail,
                      paymentMethod: selectedInvoice.paymentMethod,
                      totalCents: selectedInvoice.totalCents,
                      description: selectedInvoice.lines?.[0]?.description ?? "Règlement AE2V",
                      lines: selectedInvoice.lines,
                      status: selectedInvoice.status,
                      notes: selectedInvoice.notes,
                    })
                  }
                >
                  <Printer className="size-4" /> Télécharger le PDF
                </Button>
                <Button variant="secondary" onClick={() => setSelectedInvoice(null)}>
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        )}

        {selectedContactMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ae2v-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl border-2 border-ae2v-black bg-card shadow-2xl">
              <div className="flex items-center justify-between border-b-2 border-ae2v-black bg-ae2v-red px-5 py-3 text-white">
                <div>
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em]">
                    Message reçu
                  </p>
                  <h3 className="font-impact text-2xl uppercase">{selectedContactMessage.sujet}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedContactMessage(null)}
                  aria-label="Fermer"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="space-y-4 p-6">
                <div className="grid gap-3 border-2 border-ae2v-black/15 bg-ae2v-offwhite p-4 text-sm sm:grid-cols-2">
                  <InfoRow
                    label="Expéditeur"
                    value={`${selectedContactMessage.name} · ${selectedContactMessage.email}`}
                  />
                  <InfoRow
                    label="État"
                    value={
                      contactMessageStatusLabels[selectedContactMessage.status] ??
                      selectedContactMessage.status
                    }
                  />
                  <InfoRow
                    label="Lecture par moi"
                    value={selectedContactMessage.readByMe ? "Oui" : "Non"}
                  />
                  <InfoRow
                    label="Lecture par un autre membre"
                    value={
                      selectedContactMessage.readByOtherCount
                        ? `${selectedContactMessage.readByOtherCount} · ${selectedContactMessage.readByOtherNames?.join(", ") ?? ""}`
                        : "Non lu par un autre membre"
                    }
                  />
                </div>
                <div className="min-h-40 whitespace-pre-wrap border-2 border-ae2v-black bg-card p-5 text-sm leading-relaxed">
                  {selectedContactMessage.message}
                </div>
                <div className="flex flex-wrap justify-end gap-2 border-t-2 border-ae2v-black/10 pt-4">
                  {personIdForEmail(selectedContactMessage.email) && (
                    <Button asChild variant="outline">
                      <Link
                        to="/bureau/personnes/$personId"
                        params={{ personId: personIdForEmail(selectedContactMessage.email)! }}
                      >
                        <Users className="size-4" /> Voir le profil
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() =>
                      void changeContactMessageStatus(
                        selectedContactMessage,
                        selectedContactMessage.status === "TRAITE" ? "LU" : "TRAITE",
                      )
                    }
                  >
                    {selectedContactMessage.status === "TRAITE"
                      ? "Rouvrir le message"
                      : "Marquer comme traité"}
                  </Button>
                  <Button
                    variant="black"
                    onClick={() => {
                      setSelectedContactMessage(null);
                      openEmailComposer(
                        selectedContactMessage.email,
                        selectedContactMessage.sujet.toLowerCase().startsWith("re:")
                          ? selectedContactMessage.sujet
                          : `Re: ${selectedContactMessage.sujet}`,
                        `Bonjour ${selectedContactMessage.name.split(" ")[0]},\n\n\n\n— Message original —\n${selectedContactMessage.message}`,
                      );
                    }}
                  >
                    <Mail className="size-4" /> Répondre
                  </Button>
                  <Button variant="secondary" onClick={() => setSelectedContactMessage(null)}>
                    Fermer
                  </Button>
                </div>
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
            defaultDescription={payModalConfig.description}
            defaultPriceCents={payModalConfig.priceCents}
            editableDetails={Boolean(payModalConfig.editableDetails)}
            {...(payModalConfig.pendingPaymentId
              ? { pendingPaymentId: payModalConfig.pendingPaymentId }
              : {})}
            {...(payModalConfig.onSuccessPay ? { onSuccessPay: payModalConfig.onSuccessPay } : {})}
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
          defaultSubject={emailDefaultSubject}
          defaultBody={emailDefaultBody}
          category={emailDefaultCategory}
          showTemplates={emailShowTemplates}
        />
      </section>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.65rem] font-bold uppercase text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words font-medium">{value}</dd>
    </div>
  );
}
