import { useMemo, useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Mail,
  Users,
  Trash2,
  Plus,
  Eye,
  CheckCheck,
  Clock,
  QrCode,
  ShoppingBag,
  Newspaper,
  Handshake,
  Download,
  ShieldAlert,
  FileText,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { DataTable, StatusPill, TableFilter, type Column } from "@/components/bureau/data-table";
import { contributionTone, membershipTone, today } from "@/components/bureau/dossier-fiche";
import { PageHero } from "@/components/layout/page-hero";
import { HardCard, Section, EmptyState } from "@/components/layout/section";
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
  type Candidature,
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
  getDynamicNews,
  saveDynamicNews,
  getDynamicPartners,
  saveDynamicPartners,
  getDynamicAuditLogs,
  addAuditLog,
  type TeamMember,
  type Ae2vNewsArticle,
  type Ae2vPartner,
  type AuditLogEntry,
} from "@/lib/dynamic-store";
import { teamPoles, type TeamPole } from "@/data/team";
import { eventStatusLabels, type Ae2vEvent, type EventStatus } from "@/data/events";
import { formatPrice, type ShopProduct } from "@/data/shop";

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
  const [tab, setTab] = useState("demandes");
  const [membershipFilter, setMembershipFilter] = useState("TOUS");
  const [contribFilter, setContribFilter] = useState("TOUS");
  const [candFilter, setCandFilter] = useState("TOUS");
  const [msgFilter, setMsgFilter] = useState("TOUS");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(getDynamicTeamMembers());
  const [events, setEvents] = useState<Ae2vEvent[]>(getDynamicEvents());
  const [products, setProducts] = useState<ShopProduct[]>(getDynamicShopProducts());
  const [newsArticles, setNewsArticles] = useState<Ae2vNewsArticle[]>(getDynamicNews());
  const [partners, setPartners] = useState<Ae2vPartner[]>(getDynamicPartners());
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(getDynamicAuditLogs());

  useEffect(() => {
    const teamHandler = () => setTeamMembers(getDynamicTeamMembers());
    const eventHandler = () => setEvents(getDynamicEvents());
    const shopHandler = () => setProducts(getDynamicShopProducts());
    const newsHandler = () => setNewsArticles(getDynamicNews());
    const partnerHandler = () => setPartners(getDynamicPartners());
    const auditHandler = () => setAuditLogs(getDynamicAuditLogs());

    window.addEventListener("ae2v_team_changed", teamHandler);
    window.addEventListener("ae2v_events_changed", eventHandler);
    window.addEventListener("ae2v_products_changed", shopHandler);
    window.addEventListener("ae2v_news_changed", newsHandler);
    window.addEventListener("ae2v_partners_changed", partnerHandler);
    window.addEventListener("ae2v_audit_changed", auditHandler);

    return () => {
      window.removeEventListener("ae2v_team_changed", teamHandler);
      window.removeEventListener("ae2v_events_changed", eventHandler);
      window.removeEventListener("ae2v_products_changed", shopHandler);
      window.removeEventListener("ae2v_news_changed", newsHandler);
      window.removeEventListener("ae2v_partners_changed", partnerHandler);
      window.removeEventListener("ae2v_audit_changed", auditHandler);
    };
  }, []);

  const requests = useMemo(
    () =>
      dossiers.filter(
        (d) =>
          (d.status === "EN_ATTENTE" || d.status === "A_CORRIGER" || d.status === "REFUSE") &&
          (membershipFilter === "TOUS" || d.status === membershipFilter),
      ),
    [dossiers, membershipFilter],
  );

  const members = useMemo(
    () =>
      dossiers.filter(
        (d) =>
          d.status === "VALIDE" &&
          (contribFilter === "TOUS" || d.contributionStatus === contribFilter),
      ),
    [dossiers, contribFilter],
  );

  const visibleCandidatures = useMemo(
    () => candidatures.filter((c) => candFilter === "TOUS" || c.status === candFilter),
    [candidatures, candFilter],
  );

  const visibleMessages = useMemo(
    () => messages.filter((m) => msgFilter === "TOUS" || m.status === msgFilter),
    [messages, msgFilter],
  );

  if (!account) return null;

  const pendingCount = dossiers.filter((d) => d.status === "EN_ATTENTE").length;
  const toFixCount = dossiers.filter((d) => d.status === "A_CORRIGER").length;
  const candPending = candidatures.filter((c) => c.status === "EN_ATTENTE").length;
  const msgNew = messages.filter((m) => m.status === "NOUVEAU").length;
  const collected = dossiers
    .filter((d) => d.contributionStatus === "COTISANT")
    .reduce((sum, d) => sum + d.contributionCents, 0);

  const nameColumn: Column<Dossier> = {
    key: "name",
    label: "Nom / Prénom",
    sortValue: (d) => `${d.lastName} ${d.firstName}`,
    render: (d) => (
      <div className="min-w-0">
        <p className="font-bold">
          {d.lastName.toUpperCase()} {d.firstName}
        </p>
        <p className="text-[0.65rem] tracking-[0.14em] text-muted-foreground uppercase">{d.id}</p>
      </div>
    ),
  };

  const emailColumn: Column<Dossier> = {
    key: "email",
    label: "E-mail",
    sortValue: (d) => d.email,
    render: (d) => <span className="text-xs break-words">{d.email}</span>,
  };

  const contributionColumn: Column<Dossier> = {
    key: "contribution",
    label: "Cotisation choisie",
    className: "min-w-[11rem]",
    sortValue: (d) => d.contributionCents,
    render: (d) => (
      <span className="inline-flex flex-col items-start gap-1">
        <span className="font-bold">
          {d.contributionCents > 0 ? formatCents(d.contributionCents) : "Sans cotisation"}
        </span>
        <StatusPill tone={contributionTone[d.contributionStatus]}>
          {contributionStatusLabels[d.contributionStatus]}
        </StatusPill>
      </span>
    ),
  };

  const openColumn: Column<Dossier> = {
    key: "open",
    label: "Fiche",
    render: (d) => (
      <Button asChild size="sm" variant="black">
        <Link to="/bureau/$dossierId" params={{ dossierId: d.id }}>
          Voir la fiche
        </Link>
      </Button>
    ),
  };

  return (
    <>
      <PageHero
        eyebrow={roleLabels[account.role]}
        title="Bureau"
        intro={
          can("dossiers:validate")
            ? "Tu disposes de tous les droits : consultation, correction et validation des dossiers."
            : "Droits limités : tu peux consulter et corriger les dossiers, mais pas les valider."
        }
      />

      <TabsNav
        tone="red"
        label="Sections de l'espace bureau"
        idPrefix="bureau"
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "demandes", label: "Demandes d'adhésion", badge: pendingCount + toFixCount },
          { id: "membres", label: "Membres validés", badge: members.length },
          { id: "candidatures", label: "Candidatures bureau", badge: candPending },
          { id: "messages", label: "Messages", badge: msgNew },
          { id: "equipe", label: "Équipe BDE", badge: teamMembers.length },
          { id: "evenements", label: "Événements", badge: events.length },
          { id: "boutique", label: "Boutique", badge: products.length },
          { id: "scanner", label: "Scanner QR" },
          { id: "commandes", label: "Commandes" },
          { id: "actualites", label: "Actualités BDE", badge: newsArticles.length },
          { id: "partenaires", label: "Partenaires", badge: partners.length },
          { id: "exports", label: "Exports & Audit" },
        ]}
      />

      {/* ------------------------- Demandes d'adhésion ---------------------- */}
      <TabPanel id="demandes" idPrefix="bureau" active={tab}>
        <Section
          number={1}
          ghost="DEMANDES"
          title="Demandes d'adhésion"
          intro="Valide ou refuse directement depuis la liste. La modification des données saisies se fait dans la fiche complète."
        >
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi value={String(dossiers.length)} label="Dossiers au total" />
            <Kpi value={String(pendingCount)} label="En attente" tone="green" />
            <Kpi value={String(toFixCount)} label="À corriger" />
            <Kpi value={formatCents(collected)} label="Cotisations encaissées" />
          </div>

          <DataTable<Dossier>
            idPrefix="requests"
            caption="Liste des demandes d'adhésion en attente, à corriger ou refusées"
            rows={requests}
            searchable={(d) => `${d.firstName} ${d.lastName} ${d.email} ${d.studentId} ${d.id}`}
            emptyLabel="Aucune demande ne correspond à ces critères."
            filters={
              <TableFilter
                id="filter-membership"
                label="Statut d'adhésion"
                value={membershipFilter}
                onChange={setMembershipFilter}
                options={[
                  { value: "TOUS", label: "Tous" },
                  { value: "EN_ATTENTE", label: "En attente" },
                  { value: "A_CORRIGER", label: "Correction demandée" },
                  { value: "REFUSE", label: "Refusé" },
                ]}
              />
            }
            columns={[
              nameColumn,
              {
                key: "submitted",
                label: "Déposé le",
                sortValue: (d) => d.submittedAt.split("/").reverse().join(""),
                render: (d) => d.submittedAt,
              },
              {
                key: "contact",
                label: "E-mail / N° étudiant",
                sortValue: (d) => d.email,
                render: (d) => (
                  <div className="min-w-0">
                    <p className="text-xs break-words">{d.email}</p>
                    <p className="font-mono text-xs text-muted-foreground">{d.studentId}</p>
                  </div>
                ),
              },
              {
                key: "formation",
                label: "Année / Filière",
                sortValue: (d) => `${d.niveau} ${d.departement}`,
                render: (d) => (
                  <div className="min-w-0">
                    <p className="font-bold">{d.niveau}</p>
                    <p className="text-xs text-muted-foreground">{d.departement}</p>
                  </div>
                ),
              },
              contributionColumn,
              {
                key: "status",
                label: "Adhésion",
                className: "min-w-[9rem]",
                sortValue: (d) => membershipStatusLabels[d.status],
                render: (d) => (
                  <StatusPill tone={membershipTone[d.status]}>
                    {membershipStatusLabels[d.status]}
                  </StatusPill>
                ),
              },
              {
                key: "actions",
                label: "Actions",
                className: "min-w-[13rem]",
                render: (d) => (
                  <div className="flex flex-col items-stretch gap-2">
                    <Button asChild size="sm" variant="black" className="w-full">
                      <Link to="/bureau/$dossierId" params={{ dossierId: d.id }}>
                        Voir la demande
                      </Link>
                    </Button>
                    {can("dossiers:validate") && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={d.status === "REFUSE"}
                          onClick={() => updateDossier(d.id, { status: "REFUSE" })}
                        >
                          Refuser
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            updateDossier(d.id, {
                              status: "VALIDE",
                              validatedAt: d.validatedAt ?? today(),
                              memberSince: d.memberSince ?? today(),
                            })
                          }
                        >
                          Valider
                        </Button>
                      </div>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </Section>
      </TabPanel>

      {/* --------------------------- Membres validés ------------------------ */}
      <TabPanel id="membres" idPrefix="bureau" active={tab}>
        <Section
          number={2}
          ghost="MEMBRES"
          title="Membres validés"
          intro="Adhésion validée : ces personnes sont membres, qu'elles cotisent ou non. Seule une cotisation confirmée ouvre les réductions."
        >
          <DataTable<Dossier>
            idPrefix="members"
            caption="Liste des membres dont l'adhésion est validée"
            rows={members}
            searchable={(d) => `${d.firstName} ${d.lastName} ${d.email} ${d.studentId} ${d.id}`}
            emptyLabel="Aucun membre validé ne correspond à ces critères."
            filters={
              <TableFilter
                id="filter-contribution"
                label="Statut de cotisation"
                value={contribFilter}
                onChange={setContribFilter}
                options={[
                  { value: "TOUS", label: "Tous" },
                  { value: "COTISANT", label: "Cotisant" },
                  { value: "PAIEMENT_EN_ATTENTE", label: "Paiement en attente" },
                  { value: "NON_COTISANT", label: "Non cotisant" },
                ]}
              />
            }
            columns={[
              nameColumn,
              emailColumn,
              {
                key: "formation",
                label: "Formation",
                sortValue: (d) => `${d.departement} ${d.niveau}`,
                render: (d) => (
                  <span>
                    {d.departement}
                    <span className="block text-xs text-muted-foreground">{d.niveau}</span>
                  </span>
                ),
              },
              {
                key: "since",
                label: "Membre depuis",
                sortValue: (d) => (d.memberSince ?? "").split("/").reverse().join(""),
                render: (d) => d.memberSince ?? "—",
              },
              contributionColumn,
              openColumn,
            ]}
          />
        </Section>
      </TabPanel>

      {/* ------------------------ Candidatures bureau ----------------------- */}
      <TabPanel id="candidatures" idPrefix="bureau" active={tab}>
        <Section
          number={3}
          ghost="ÉQUIPE"
          title="Candidatures au bureau"
          intro="Demandes des membres souhaitant rejoindre un pôle, participer aux votes et à l'organisation."
        >
          <DataTable<Candidature>
            idPrefix="candidatures"
            caption="Liste des candidatures pour rejoindre le bureau"
            rows={visibleCandidatures}
            searchable={(c) => `${c.name} ${c.email} ${c.pole}`}
            searchPlaceholder="Nom, e-mail, pôle…"
            emptyLabel="Aucune candidature ne correspond à ces critères."
            filters={
              <TableFilter
                id="filter-candidature"
                label="Statut"
                value={candFilter}
                onChange={setCandFilter}
                options={[
                  { value: "TOUS", label: "Tous" },
                  { value: "EN_ATTENTE", label: "En attente" },
                  { value: "ENTRETIEN", label: "Entretien proposé" },
                  { value: "ACCEPTEE", label: "Acceptée" },
                  { value: "REFUSEE", label: "Refusée" },
                ]}
              />
            }
            columns={[
              {
                key: "name",
                label: "Candidat",
                sortValue: (c) => c.name,
                render: (c) => (
                  <div className="min-w-0">
                    <p className="font-bold">{c.name}</p>
                    <p className="text-xs break-words text-muted-foreground">{c.email}</p>
                  </div>
                ),
              },
              { key: "pole", label: "Pôle", sortValue: (c) => c.pole, render: (c) => c.pole },
              {
                key: "submitted",
                label: "Déposée le",
                sortValue: (c) => c.submittedAt.split("/").reverse().join(""),
                render: (c) => c.submittedAt,
              },
              {
                key: "status",
                label: "Statut",
                sortValue: (c) => candidatureStatusLabels[c.status],
                render: (c) => (
                  <StatusPill
                    tone={
                      c.status === "ACCEPTEE"
                        ? "green"
                        : c.status === "REFUSEE"
                          ? "black"
                          : "neutral"
                    }
                  >
                    {candidatureStatusLabels[c.status]}
                  </StatusPill>
                ),
              },
            ]}
            renderDetails={(c) => (
              <div className="border-2 border-ae2v-black bg-card p-4">
                <p className="text-sm">{c.motivation}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Disponibilités : {c.availability}
                </p>
                {can("candidatures:decide") ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <CandidatureButton
                      c={c}
                      status="ENTRETIEN"
                      label="Proposer un entretien"
                      onClick={updateCandidature}
                    />
                    <CandidatureButton
                      c={c}
                      status="ACCEPTEE"
                      label="Accepter"
                      onClick={updateCandidature}
                    />
                    <CandidatureButton
                      c={c}
                      status="REFUSEE"
                      label="Refuser"
                      onClick={updateCandidature}
                    />
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-muted-foreground">
                    Lecture seule : la décision revient au bureau habilité.
                  </p>
                )}
              </div>
            )}
          />
        </Section>
      </TabPanel>

      {/* ------------------------------ Messages --------------------------- */}
      <TabPanel id="messages" idPrefix="bureau" active={tab}>
        <Section
          number={4}
          ghost="INBOX"
          title="Boîte de réception"
          intro="Messages reçus via le formulaire de contact. Marquez-les comme lus ou traités."
        >
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <Kpi value={String(messages.length)} label="Messages reçus" />
            <Kpi value={String(msgNew)} label="Non lus" tone="green" />
            <Kpi
              value={String(messages.filter((m) => m.status === "TRAITE").length)}
              label="Traités"
            />
          </div>

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
            <EmptyState
              label="Aucun message"
              detail="Aucun message ne correspond aux critères sélectionnés."
            />
          ) : (
            <ul className="space-y-3">
              {visibleMessages.map((msg) => (
                <MessageCard key={msg.id} msg={msg} onUpdateStatus={updateMessageStatus} />
              ))}
            </ul>
          )}
        </Section>
      </TabPanel>

      {/* ------------------------------- Événements ------------------------- */}
      <TabPanel id="evenements" idPrefix="bureau" active={tab}>
        <Section
          number={6}
          ghost="AGENDA"
          title="Gestion des événements & billetterie"
          intro="Modifiez les jauges, statuts, dates ou ajoutez de nouveaux événements au calendrier."
        >
          <EventManager events={events} />
        </Section>
      </TabPanel>

      {/* -------------------------------- Scanner QR ------------------------ */}
      <TabPanel id="scanner" idPrefix="bureau" active={tab}>
        <Section
          number={8}
          ghost="SCANNER"
          title="Scanner & contrôle d'accès QR"
          intro="Saisissez ou scannez un code de billet (ex: AE2V-TK-...) ou de carte membre pour vérifier la validité."
        >
          <TicketScanner />
        </Section>
      </TabPanel>

      {/* -------------------------------- Commandes ------------------------- */}
      <TabPanel id="commandes" idPrefix="bureau" active={tab}>
        <Section
          number={9}
          ghost="COMMANDES"
          title="Gestion des commandes boutique"
          intro="Suivez l'état des commandes passées par les étudiants et modifiez les statuts de retrait."
        >
          <OrdersManager />
        </Section>
      </TabPanel>

      {/* ------------------------------- Actualités ------------------------- */}
      <TabPanel id="actualites" idPrefix="bureau" active={tab}>
        <Section
          number={10}
          ghost="ACTUS"
          title="Publication d'actualités"
          intro="Publiez des annonces ou communiqués sur le fil d'actualités public."
        >
          <NewsManager newsArticles={newsArticles} />
        </Section>
      </TabPanel>

      {/* ------------------------------- Partenaires ------------------------ */}
      <TabPanel id="partenaires" idPrefix="bureau" active={tab}>
        <Section
          number={11}
          ghost="OFFRES"
          title="Gestion des partenaires & réductions"
          intro="Gérez les offres partenaires négociées pour les membres cotisants."
        >
          <PartnersManager partners={partners} />
        </Section>
      </TabPanel>

      {/* ---------------------------- Exports & Audit ---------------------- */}
      <TabPanel id="exports" idPrefix="bureau" active={tab}>
        <Section
          number={12}
          ghost="EXPORT"
          title="Exports CSV & Journal d'audit"
          intro="Téléchargez les récapitulatifs au format CSV et consultez l'historique des actions admin."
        >
          <ExportsManager dossiers={dossiers} auditLogs={auditLogs} />
        </Section>
      </TabPanel>
    </>
  );
}

function CandidatureButton({
  c,
  status,
  label,
  onClick,
}: {
  c: Candidature;
  status: Candidature["status"];
  label: string;
  onClick: (id: string, status: Candidature["status"]) => void;
}) {
  return (
    <Button
      size="sm"
      variant={status === "REFUSEE" ? "secondary" : "default"}
      disabled={c.status === status}
      onClick={() => onClick(c.id, status)}
    >
      {label}
    </Button>
  );
}

function Kpi({ value, label, tone }: { value: string; label: string; tone?: "green" | undefined }) {
  return (
    <div
      className={`border-2 border-ae2v-black p-5 ${tone === "green" ? "bg-ae2v-green text-ae2v-black" : "bg-card"}`}
    >
      <p className="ae2v-headline text-[clamp(1.8rem,4.5vw,2.6rem)]">{value}</p>
      <p className="mt-1 text-xs font-bold tracking-[0.14em] uppercase">{label}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* MessageCard — carte de message de contact                                   */
/* -------------------------------------------------------------------------- */

function MessageCard({
  msg,
  onUpdateStatus,
}: {
  msg: ContactMessage;
  onUpdateStatus: (id: string, status: ContactMessageStatus) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const toneMap: Record<ContactMessageStatus, string> = {
    NOUVEAU: "border-ae2v-red bg-ae2v-red/5",
    LU: "border-ae2v-black/40 bg-card",
    TRAITE: "border-ae2v-black/20 bg-muted/30",
  };

  return (
    <li className={`border-2 p-4 ${toneMap[msg.status]}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold">{msg.name}</p>
            <StatusPill
              tone={msg.status === "NOUVEAU" ? "red" : msg.status === "LU" ? "neutral" : "black"}
            >
              {contactMessageStatusLabels[msg.status]}
            </StatusPill>
          </div>
          <p className="text-xs text-muted-foreground break-all">{msg.email}</p>
          <p className="mt-1 text-xs font-bold tracking-[0.12em] uppercase text-muted-foreground">
            {msg.sujet} · {msg.sentAt}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => setExpanded((v) => !v)}>
            <Eye aria-hidden="true" className="size-3.5" />
            {expanded ? "Réduire" : "Lire"}
          </Button>
          {msg.status === "NOUVEAU" && (
            <Button size="sm" variant="black" onClick={() => onUpdateStatus(msg.id, "LU")}>
              <Mail aria-hidden="true" className="size-3.5" />
              Marquer lu
            </Button>
          )}
          {msg.status !== "TRAITE" && (
            <Button size="sm" onClick={() => onUpdateStatus(msg.id, "TRAITE")}>
              <CheckCheck aria-hidden="true" className="size-3.5" />
              Traité
            </Button>
          )}
          {msg.status === "TRAITE" && (
            <Button size="sm" variant="secondary" onClick={() => onUpdateStatus(msg.id, "NOUVEAU")}>
              <Clock aria-hidden="true" className="size-3.5" />
              Rouvrir
            </Button>
          )}
        </div>
      </div>
      {expanded && (
        <div className="mt-3 border-l-4 border-ae2v-red bg-ae2v-offwhite p-3 text-sm text-ae2v-black">
          <p className="whitespace-pre-wrap">{msg.message}</p>
          <a
            href={`mailto:${msg.email}?subject=Re: [${msg.sujet}]`}
            className="mt-3 inline-block text-xs font-bold text-ae2v-red underline"
          >
            Répondre par e-mail →
          </a>
        </div>
      )}
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* TeamManager — gestion de l'équipe bureau depuis le back-office             */
/* -------------------------------------------------------------------------- */

const inputClass =
  "min-h-[44px] w-full border-2 border-ae2v-black/25 bg-ae2v-offwhite px-3 py-2 text-base text-ae2v-black outline-none focus-visible:border-ae2v-red focus-visible:ring-2 focus-visible:ring-ae2v-red/40";

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
  const [formError, setFormError] = useState<string | null>(null);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.displayName.trim() || !form.roleTitle.trim()) {
      setFormError("Nom d'affichage et titre de rôle sont obligatoires.");
      return;
    }
    setFormError(null);
    const current = getDynamicTeamMembers();
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
    saveDynamicTeamMembers([newMember, ...current]);
    setForm({
      displayName: "",
      roleTitle: "",
      pole: teamPoles[0] as TeamPole,
      personalAe2vEmail: "",
      roleEmail: "",
      isOfficer: false,
      bio: "",
      mandate: `${currentYear}–${currentYear + 1}`,
    });
    setShowForm(false);
  }

  function handleDelete(id: string) {
    const updated = getDynamicTeamMembers().filter((m) => m.id !== id);
    saveDynamicTeamMembers(updated);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {teamMembers.length} membre{teamMembers.length > 1 ? "s" : ""} dans l'équipe.
        </p>
        <Button
          size="sm"
          onClick={() => setShowForm((v) => !v)}
          variant={showForm ? "secondary" : "default"}
        >
          <Plus aria-hidden="true" />
          {showForm ? "Annuler" : "Ajouter un membre"}
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="border-2 border-ae2v-black bg-ae2v-offwhite p-5 text-ae2v-black"
        >
          <p className="text-xs font-bold tracking-[0.14em] uppercase">Nouveau membre</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold tracking-[0.14em] uppercase">
                Nom d'affichage <span className="text-ae2v-red">*</span>
              </label>
              <input
                className={`${inputClass} mt-1`}
                placeholder="Ex. Marie Dupont"
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold tracking-[0.14em] uppercase">
                Titre du rôle <span className="text-ae2v-red">*</span>
              </label>
              <input
                className={`${inputClass} mt-1`}
                placeholder="Ex. Secrétaire général"
                value={form.roleTitle}
                onChange={(e) => setForm((f) => ({ ...f, roleTitle: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold tracking-[0.14em] uppercase">
                Pôle <span className="text-ae2v-red">*</span>
              </label>
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
              <label className="block text-xs font-bold tracking-[0.14em] uppercase">
                E-mail nominatif @ae2v.fr
              </label>
              <input
                className={`${inputClass} mt-1`}
                type="email"
                placeholder="prenom.nom@ae2v.fr"
                value={form.personalAe2vEmail}
                onChange={(e) => setForm((f) => ({ ...f, personalAe2vEmail: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold tracking-[0.14em] uppercase">
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
            <div>
              <label className="block text-xs font-bold tracking-[0.14em] uppercase">
                Année de mandat
              </label>
              <input
                className={`${inputClass} mt-1`}
                placeholder="2026–2027"
                value={form.mandate}
                onChange={(e) => setForm((f) => ({ ...f, mandate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold tracking-[0.14em] uppercase">Bio</label>
              <input
                className={`${inputClass} mt-1`}
                placeholder="Courte présentation (optionnel)"
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <input
                id="is-officer"
                type="checkbox"
                className="size-5 accent-ae2v-red"
                checked={form.isOfficer}
                onChange={(e) => setForm((f) => ({ ...f, isOfficer: e.target.checked }))}
              />
              <label htmlFor="is-officer" className="text-sm font-bold">
                Rôle essentiel (officier) — affiché en priorité
              </label>
            </div>
          </div>
          {formError && <p className="mt-3 text-sm font-bold text-ae2v-red">✕ {formError}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="submit">Ajouter à l'équipe</Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
          </div>
        </form>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {teamMembers.map((member) => (
          <div key={member.id} className="flex flex-col border-2 border-ae2v-black bg-card p-4">
            <div className="min-w-0 flex-1">
              <p className="font-bold">{member.displayName}</p>
              <p className="text-xs text-muted-foreground">{member.roleTitle}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                <StatusPill tone="neutral">{member.pole}</StatusPill>
                {member.isOfficer && <StatusPill tone="green">Officier</StatusPill>}
                {member.isDemo && <StatusPill tone="red">Démo</StatusPill>}
              </div>
              {member.personalAe2vEmail && (
                <p className="mt-1 text-xs text-muted-foreground break-all">
                  {member.personalAe2vEmail}
                </p>
              )}
              {member.roleEmail && (
                <p className="mt-0.5 text-xs text-muted-foreground break-all">{member.roleEmail}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">{member.mandate}</p>
            </div>
            <Button
              className="mt-3 w-full"
              size="sm"
              variant="secondary"
              onClick={() => handleDelete(member.id)}
            >
              <Trash2 aria-hidden="true" className="size-3.5" />
              Supprimer
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* EventManager — gestion des événements bureau                               */
/* -------------------------------------------------------------------------- */

function EventManager({ events }: { events: Ae2vEvent[] }) {
  function handleUpdateStatus(id: string, status: EventStatus) {
    const updated = events.map((e) => (e.id === id ? { ...e, status } : e));
    saveDynamicEvents(updated);
  }

  function handleUpdateCapacity(id: string, delta: number) {
    const updated = events.map((e) => {
      if (e.id === id) {
        const newCap = Math.max(10, e.capacity + delta);
        return {
          ...e,
          capacity: newCap,
          status: e.registered >= newCap ? ("COMPLET" as const) : e.status,
        };
      }
      return e;
    });
    saveDynamicEvents(updated);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <div key={event.id} className="flex flex-col border-2 border-ae2v-black bg-card p-4">
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-ae2v-red">
                  {event.kind}
                </span>
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
              <h3 className="mt-2 font-bold text-base">{event.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {event.date} · {event.place}
              </p>

              <div className="mt-4 border-t-2 border-ae2v-black/10 pt-3">
                <div className="flex justify-between text-xs font-bold">
                  <span>Inscrits / Jauge :</span>
                  <span>
                    {event.registered} / {event.capacity}
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 w-full border border-ae2v-black bg-ae2v-offwhite">
                  <div
                    className={
                      event.registered >= event.capacity
                        ? "h-full bg-ae2v-red"
                        : "h-full bg-ae2v-green"
                    }
                    style={{
                      width: `${Math.min(100, Math.round((event.registered / event.capacity) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-t-2 border-ae2v-black/10 pt-3">
              <p className="w-full text-[0.65rem] font-bold uppercase text-muted-foreground">
                Changer le statut :
              </p>
              {(["OUVERT", "BIENTOT", "COMPLET", "TERMINE"] as EventStatus[]).map((st) => (
                <Button
                  key={st}
                  size="sm"
                  variant={event.status === st ? "default" : "secondary"}
                  className="px-2 py-1 text-xs"
                  onClick={() => handleUpdateStatus(event.id, st)}
                >
                  {st}
                </Button>
              ))}
              <div className="mt-2 flex w-full items-center justify-between gap-2">
                <span className="text-xs font-bold text-muted-foreground">Ajuster jauge :</span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleUpdateCapacity(event.id, -10)}
                  >
                    -10
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleUpdateCapacity(event.id, 10)}
                  >
                    +10
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ShopManager — gestion boutique & produits bureau                          */
/* -------------------------------------------------------------------------- */

function ShopManager({ products }: { products: ShopProduct[] }) {
  function handleToggleBadge(id: string) {
    const updated = products.map((p) => {
      if (p.id === id) {
        return { ...p, badge: p.badge ? null : "NOUVEAU" };
      }
      return p;
    });
    saveDynamicShopProducts(updated);
  }

  function handleUpdatePrice(id: string, deltaCents: number) {
    const updated = products.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          priceMember: Math.max(100, p.priceMember + deltaCents),
          pricePublic: Math.max(100, p.pricePublic + deltaCents),
        };
      }
      return p;
    });
    saveDynamicShopProducts(updated);
  }

  return (
    <div className="space-y-6">
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

            <div className="mt-4 flex flex-wrap gap-2 border-t-2 border-ae2v-black/10 pt-3">
              <Button
                size="sm"
                variant={prod.badge ? "secondary" : "default"}
                className="w-full text-xs"
                onClick={() => handleToggleBadge(prod.id)}
              >
                {prod.badge ? "Retirer le badge NOUVEAU" : "Mettre badge NOUVEAU"}
              </Button>
              <div className="flex w-full items-center justify-between gap-2">
                <span className="text-xs font-bold text-muted-foreground">Prix :</span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleUpdatePrice(prod.id, -100)}
                  >
                    -1€
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleUpdatePrice(prod.id, 100)}
                  >
                    +1€
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TicketScanner — scanner & contrôle d'accès QR                              */
/* -------------------------------------------------------------------------- */

function TicketScanner() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<{
    type: "ticket" | "card";
    owner: string;
    details: string;
    status: string;
    valid: boolean;
    ticketObj?: DemoTicket;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    const cleaned = code.trim().toUpperCase();
    if (!cleaned) return;

    // Check custom and demo accounts
    const allAccs = demoAccounts;
    let foundTicket: DemoTicket | null = null;
    let ticketOwner = "";

    for (const acc of allAccs) {
      const matchTk = acc.tickets.find((t) => t.code.toUpperCase() === cleaned);
      if (matchTk) {
        foundTicket = matchTk;
        ticketOwner = `${acc.firstName} ${acc.lastName} (${acc.email})`;
        break;
      }
      if (acc.cardCode.toUpperCase() === cleaned) {
        setResult({
          type: "card",
          owner: `${acc.firstName} ${acc.lastName}`,
          details: `Carte de membre · Filière ${acc.departement} (${acc.niveau})`,
          status: acc.membershipStatus === "VALIDE" ? "Valide (Adhérent cotisant)" : "En attente",
          valid: acc.membershipStatus === "VALIDE",
        });
        addAuditLog(
          "SCAN_CARTE",
          `Carte membre scannée: ${acc.cardCode} (${acc.firstName} ${acc.lastName})`,
        );
        return;
      }
    }

    if (foundTicket) {
      setResult({
        type: "ticket",
        owner: ticketOwner,
        details: `${foundTicket.eventTitle} · Tarif: ${foundTicket.tier}`,
        status: foundTicket.status === "valide" ? "VALIDE (Prêt pour contrôle)" : "DÉJÀ UTILISÉ",
        valid: foundTicket.status === "valide",
        ticketObj: foundTicket,
      });
      addAuditLog("SCAN_BILLET", `Billet scanné: ${foundTicket.code} (${foundTicket.eventTitle})`);
      return;
    }

    setError("Code invalide ou introuvable. Vérifiez la saisie.");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <form onSubmit={handleVerify} className="border-2 border-ae2v-black bg-card p-6">
        <label htmlFor="scanner-input" className="block font-impact text-lg uppercase">
          Saisir ou scanner un QR Code
        </label>
        <p className="mt-1 text-xs text-muted-foreground">
          Exemples de codes billets : AE2V-TK-..., ou carte membre : AE2V-USER-...
        </p>
        <div className="mt-4 flex gap-2">
          <input
            id="scanner-input"
            className={`${inputClass} flex-1 font-mono uppercase`}
            placeholder="AE2V-TK-XXXX-YYYY"
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
          className={`border-2 p-6 ${
            result.valid ? "border-ae2v-green bg-ae2v-green/10" : "border-ae2v-red bg-ae2v-red/10"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-ae2v-black">
              {result.type === "ticket" ? "Billet Événement" : "Carte Membre"}
            </span>
            <StatusPill tone={result.valid ? "green" : "red"}>{result.status}</StatusPill>
          </div>
          <h3 className="mt-3 font-impact text-2xl uppercase text-ae2v-black">{result.owner}</h3>
          <p className="mt-1 text-sm font-bold text-ae2v-black/80">{result.details}</p>

          {result.valid && result.type === "ticket" && (
            <div className="mt-5 border-t-2 border-ae2v-black/20 pt-4">
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
                Valider l'entrée (Composter le billet)
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* OrdersManager — gestion des commandes boutique                             */
/* -------------------------------------------------------------------------- */

function OrdersManager() {
  const [ordersFilter, setOrdersFilter] = useState("TOUS");
  const allOrders = useMemo(() => {
    const list: (DemoOrder & { customer: string })[] = [];
    demoAccounts.forEach((acc) => {
      acc.orders.forEach((ord) => {
        list.push({ ...ord, customer: `${acc.firstName} ${acc.lastName} (${acc.email})` });
      });
    });
    return list;
  }, []);

  const [orders, setOrders] = useState(allOrders);

  function handleUpdateStatus(orderId: string, status: DemoOrder["status"]) {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    addAuditLog("STATUT_COMMANDE", `Commande ${orderId} passée au statut: ${status}`);
  }

  const filtered = orders.filter((o) => ordersFilter === "TOUS" || o.status === ordersFilter);

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <TableFilter
          id="filter-orders"
          label="Statut"
          value={ordersFilter}
          onChange={setOrdersFilter}
          options={[
            { value: "TOUS", label: "Toutes" },
            { value: "En préparation", label: "En préparation" },
            { value: "Prête", label: "Prête" },
            { value: "Retirée", label: "Retirée" },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState label="Aucune commande" detail="Aucune commande boutique pour l'instant." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((ord) => (
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
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Articles :
                </p>
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
                <span className="w-full text-[0.65rem] font-bold uppercase text-muted-foreground">
                  Changer statut :
                </span>
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
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* NewsManager — publication des actualités BDE                               */
/* -------------------------------------------------------------------------- */

function NewsManager({ newsArticles }: { newsArticles: Ae2vNewsArticle[] }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "Annonce",
    summary: "",
    content: "",
    author: "Bureau AE2V",
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.summary.trim()) return;

    const newArticle: Ae2vNewsArticle = {
      id: `news-${Date.now()}`,
      title: form.title.trim(),
      category: form.category,
      date: new Date().toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      summary: form.summary.trim(),
      content: form.content.trim() || form.summary.trim(),
      author: form.author.trim() || "Bureau AE2V",
    };

    saveDynamicNews([newArticle, ...newsArticles]);
    addAuditLog("PUBLICATION_ACTU", `Nouvel article publié: "${newArticle.title}"`);
    setForm({ title: "", category: "Annonce", summary: "", content: "", author: "Bureau AE2V" });
    setShowForm(false);
  }

  function handleDelete(id: string) {
    const updated = newsArticles.filter((n) => n.id !== id);
    saveDynamicNews(updated);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{newsArticles.length} article(s) publiés.</p>
        <Button
          size="sm"
          onClick={() => setShowForm((v) => !v)}
          variant={showForm ? "secondary" : "default"}
        >
          <Plus className="size-4" />
          {showForm ? "Annuler" : "Nouvel article"}
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="border-2 border-ae2v-black bg-ae2v-offwhite p-5 text-ae2v-black space-y-4"
        >
          <p className="text-xs font-bold uppercase tracking-wider">Créer une actualité</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase">Titre de l'article *</label>
              <input
                className={`${inputClass} mt-1`}
                placeholder="Ex. Résultats du tournoi E-sport"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase">Catégorie</label>
              <select
                className={`${inputClass} mt-1`}
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                <option value="Annonce">Annonce</option>
                <option value="Événement">Événement</option>
                <option value="Vie étudiante">Vie étudiante</option>
                <option value="Partenariat">Partenariat</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase">Auteur</label>
              <input
                className={`${inputClass} mt-1`}
                value={form.author}
                onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase">Résumé *</label>
              <input
                className={`${inputClass} mt-1`}
                placeholder="Description courte affichée dans la carte"
                value={form.summary}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase">Contenu complet</label>
              <textarea
                className={`${inputClass} mt-1 min-h-[100px]`}
                placeholder="Texte complet du communiqué..."
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit">Publier sur le site</Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
          </div>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {newsArticles.map((art) => (
          <div key={art.id} className="flex flex-col border-2 border-ae2v-black bg-card p-5">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase">
              <span className="text-ae2v-red">{art.category}</span>
              <span>{art.date}</span>
            </div>
            <h3 className="mt-2 font-impact text-xl uppercase">{art.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground flex-1">{art.summary}</p>
            <Button
              size="sm"
              variant="secondary"
              className="mt-4 w-full"
              onClick={() => handleDelete(art.id)}
            >
              <Trash2 className="size-3.5" />
              Supprimer l'article
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* PartnersManager — gestion des partenaires BDE                             */
/* -------------------------------------------------------------------------- */

function PartnersManager({ partners }: { partners: Ae2vPartner[] }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "Restauration",
    discount: "",
    description: "",
    website: "",
  });

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.discount.trim()) return;

    const newPartner: Ae2vPartner = {
      id: `part-${Date.now()}`,
      name: form.name.trim(),
      category: form.category.trim(),
      discount: form.discount.trim(),
      description: form.description.trim(),
      website: form.website.trim() || undefined,
      active: true,
    };

    saveDynamicPartners([newPartner, ...partners]);
    addAuditLog("Nouveau Partenaire", `Partenaire ajouté: ${newPartner.name}`);
    setForm({ name: "", category: "Restauration", discount: "", description: "", website: "" });
    setShowForm(false);
  }

  function handleToggleActive(id: string) {
    const updated = partners.map((p) => (p.id === id ? { ...p, active: !p.active } : p));
    saveDynamicPartners(updated);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {partners.length} partenaire(s) enregistrés.
        </p>
        <Button
          size="sm"
          onClick={() => setShowForm((v) => !v)}
          variant={showForm ? "secondary" : "default"}
        >
          <Plus className="size-4" />
          {showForm ? "Annuler" : "Ajouter un partenaire"}
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="border-2 border-ae2v-black bg-ae2v-offwhite p-5 text-ae2v-black space-y-4"
        >
          <p className="text-xs font-bold uppercase tracking-wider">Nouveau partenaire</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase">Nom du partenaire *</label>
              <input
                className={`${inputClass} mt-1`}
                placeholder="Ex. Fitness Park Vélizy"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase">Catégorie</label>
              <input
                className={`${inputClass} mt-1`}
                placeholder="Ex. Sport, Restauration..."
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase">Avantage / Réduction *</label>
              <input
                className={`${inputClass} mt-1`}
                placeholder="Ex. -20% sur l'abonnement annuel"
                value={form.discount}
                onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase">Description</label>
              <input
                className={`${inputClass} mt-1`}
                placeholder="Conditions d'obtention de la remise..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit">Ajouter le partenaire</Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
          </div>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {partners.map((p) => (
          <div key={p.id} className="flex flex-col border-2 border-ae2v-black bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-ae2v-red">
                {p.category}
              </span>
              <StatusPill tone={p.active ? "green" : "red"}>
                {p.active ? "Actif" : "Inactif"}
              </StatusPill>
            </div>
            <h3 className="mt-2 font-impact text-xl uppercase">{p.name}</h3>
            <p className="mt-1 text-xs font-bold text-ae2v-black">{p.discount}</p>
            <p className="mt-1 text-xs text-muted-foreground flex-1">{p.description}</p>
            <Button
              size="sm"
              variant="secondary"
              className="mt-4 w-full"
              onClick={() => handleToggleActive(p.id)}
            >
              {p.active ? "Désactiver" : "Activer"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ExportsManager — exports CSV & journal d'audit                             */
/* -------------------------------------------------------------------------- */

function ExportsManager({
  dossiers,
  auditLogs,
}: {
  dossiers: Dossier[];
  auditLogs: AuditLogEntry[];
}) {
  function downloadCsv(filename: string, content: string) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    addAuditLog("EXPORT_CSV", `Export réalisé: ${filename}`);
  }

  function exportDossiersCsv() {
    let csv = "ID,Nom,Prenom,Email,Filiere,Niveau,StatutAdhesion,StatutCotisation,SubmittedAt\n";
    dossiers.forEach((d) => {
      csv += `"${d.id}","${d.lastName}","${d.firstName}","${d.email}","${d.departement}","${d.niveau}","${d.status}","${d.contributionStatus}","${d.submittedAt}"\n`;
    });
    downloadCsv(`ae2v-dossiers-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="border-2 border-ae2v-black bg-card p-5">
          <h3 className="font-impact text-xl uppercase">Exports de données</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Téléchargez les données archivées pour l'administration et la comptabilité du BDE.
          </p>
          <div className="mt-4 space-y-2">
            <Button className="w-full" onClick={exportDossiersCsv}>
              <Download className="size-4" />
              Exporter les dossiers adhérents (CSV)
            </Button>
          </div>
        </div>

        <div className="border-2 border-ae2v-black bg-card p-5">
          <h3 className="font-impact text-xl uppercase">Sécurité & conformité</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Conforme RGPD : données conservées uniquement pour l'année universitaire en cours.
          </p>
          <div className="mt-4 border-l-2 border-ae2v-green bg-ae2v-green/10 p-3 text-xs">
            <p className="font-bold">✓ Sauvegarde automatique activée</p>
            <p className="mt-0.5 text-muted-foreground">
              Données synchronisées dans le stockage sécurisé du navigateur.
            </p>
          </div>
        </div>
      </div>

      <div className="border-2 border-ae2v-black bg-card p-5">
        <h3 className="font-impact text-xl uppercase mb-3">Journal d'Audit des Actions Admin</h3>
        <div className="space-y-2">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="flex flex-wrap items-center justify-between gap-2 border-2 border-ae2v-black/10 bg-ae2v-offwhite p-3 text-xs"
            >
              <span className="font-mono text-muted-foreground">{log.timestamp}</span>
              <span className="font-bold text-ae2v-red uppercase tracking-wider">{log.action}</span>
              <span className="font-bold text-ae2v-black">{log.details}</span>
              <span className="text-muted-foreground">par {log.user}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
