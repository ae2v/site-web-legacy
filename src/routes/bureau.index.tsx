import { useMemo, useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, Users, Trash2, Plus, Eye, CheckCheck, Clock } from "lucide-react";

import { DataTable, StatusPill, TableFilter, type Column } from "@/components/bureau/data-table";
import {
  contributionTone,
  membershipTone,
  today,
} from "@/components/bureau/dossier-fiche";
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
  type Candidature,
  type ContactMessage,
  type ContactMessageStatus,
  type Dossier,
} from "@/lib/demo-session";
import {
  getDynamicTeamMembers,
  saveDynamicTeamMembers,
  getDynamicEvents,
  saveDynamicEvents,
  getDynamicShopProducts,
  saveDynamicShopProducts,
  type TeamMember,
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
  const { account, can, dossiers, candidatures, messages, updateCandidature, updateDossier, updateMessageStatus } =
    useDemoSession();
  const [tab, setTab] = useState("demandes");
  const [membershipFilter, setMembershipFilter] = useState("TOUS");
  const [contribFilter, setContribFilter] = useState("TOUS");
  const [candFilter, setCandFilter] = useState("TOUS");
  const [msgFilter, setMsgFilter] = useState("TOUS");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(getDynamicTeamMembers());
  const [events, setEvents] = useState<Ae2vEvent[]>(getDynamicEvents());
  const [products, setProducts] = useState<ShopProduct[]>(getDynamicShopProducts());

  useEffect(() => {
    const teamHandler = () => setTeamMembers(getDynamicTeamMembers());
    const eventHandler = () => setEvents(getDynamicEvents());
    const shopHandler = () => setProducts(getDynamicShopProducts());

    window.addEventListener("ae2v_team_changed", teamHandler);
    window.addEventListener("ae2v_events_changed", eventHandler);
    window.addEventListener("ae2v_products_changed", shopHandler);

    return () => {
      window.removeEventListener("ae2v_team_changed", teamHandler);
      window.removeEventListener("ae2v_events_changed", eventHandler);
      window.removeEventListener("ae2v_products_changed", shopHandler);
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
            <EmptyState label="Aucun message" detail="Aucun message ne correspond aux critères sélectionnés." />
          ) : (
            <ul className="space-y-3">
              {visibleMessages.map((msg) => (
                <MessageCard
                  key={msg.id}
                  msg={msg}
                  onUpdateStatus={updateMessageStatus}
                />
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

      {/* -------------------------------- Boutique -------------------------- */}
      <TabPanel id="boutique" idPrefix="bureau" active={tab}>
        <Section
          number={7}
          ghost="BOUTIQUE"
          title="Gestion de la boutique & produits"
          intro="Modifiez les tarifs, disponibiltés ou basculez la visibilité des produits du catalogue."
        >
          <ShopManager products={products} />
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

function Kpi({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone?: "green" | undefined;
}) {
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
              tone={
                msg.status === "NOUVEAU" ? "red" : msg.status === "LU" ? "neutral" : "black"
              }
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
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setExpanded((v) => !v)}
          >
            <Eye aria-hidden="true" className="size-3.5" />
            {expanded ? "Réduire" : "Lire"}
          </Button>
          {msg.status === "NOUVEAU" && (
            <Button
              size="sm"
              variant="black"
              onClick={() => onUpdateStatus(msg.id, "LU")}
            >
              <Mail aria-hidden="true" className="size-3.5" />
              Marquer lu
            </Button>
          )}
          {msg.status !== "TRAITE" && (
            <Button
              size="sm"
              onClick={() => onUpdateStatus(msg.id, "TRAITE")}
            >
              <CheckCheck aria-hidden="true" className="size-3.5" />
              Traité
            </Button>
          )}
          {msg.status === "TRAITE" && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onUpdateStatus(msg.id, "NOUVEAU")}
            >
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
                  <option key={p} value={p}>{p}</option>
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
          {formError && (
            <p className="mt-3 text-sm font-bold text-ae2v-red">✕ {formError}</p>
          )}
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
          <div
            key={member.id}
            className="flex flex-col border-2 border-ae2v-black bg-card p-4"
          >
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
                <p className="mt-0.5 text-xs text-muted-foreground break-all">
                  {member.roleEmail}
                </p>
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
        return { ...e, capacity: newCap, status: e.registered >= newCap ? ("COMPLET" as const) : e.status };
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
              <p className="mt-1 text-xs text-muted-foreground">{event.date} · {event.place}</p>
              
              <div className="mt-4 border-t-2 border-ae2v-black/10 pt-3">
                <div className="flex justify-between text-xs font-bold">
                  <span>Inscrits / Jauge :</span>
                  <span>{event.registered} / {event.capacity}</span>
                </div>
                <div className="mt-1.5 h-2.5 w-full border border-ae2v-black bg-ae2v-offwhite">
                  <div
                    className={event.registered >= event.capacity ? "h-full bg-ae2v-red" : "h-full bg-ae2v-green"}
                    style={{ width: `${Math.min(100, Math.round((event.registered / event.capacity) * 100))}%` }}
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
                <p className="font-bold text-ae2v-red">Adhérent : {formatPrice(prod.priceMember)}</p>
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
