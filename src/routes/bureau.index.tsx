import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { DataTable, StatusPill, TableFilter, type Column } from "@/components/bureau/data-table";
import {
  contributionTone,
  membershipTone,
  today,
} from "@/components/bureau/dossier-fiche";
import { PageHero } from "@/components/layout/page-hero";
import { HardCard, Section } from "@/components/layout/section";
import { TabPanel, TabsNav } from "@/components/layout/tabs-nav";
import { Button } from "@/components/ui/button";
import {
  candidatureStatusLabels,
  contributionStatusLabels,
  formatCents,
  membershipStatusLabels,
  roleLabels,
  useDemoSession,
  type Candidature,
  type Dossier,
} from "@/lib/demo-session";

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
  const { account, can, dossiers, candidatures, updateCandidature, updateDossier } =
    useDemoSession();
  const [tab, setTab] = useState("demandes");
  const [membershipFilter, setMembershipFilter] = useState("TOUS");
  const [contribFilter, setContribFilter] = useState("TOUS");
  const [candFilter, setCandFilter] = useState("TOUS");

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

  if (!account) return null;

  const pendingCount = dossiers.filter((d) => d.status === "EN_ATTENTE").length;
  const toFixCount = dossiers.filter((d) => d.status === "A_CORRIGER").length;
  const candPending = candidatures.filter((c) => c.status === "EN_ATTENTE").length;
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
          { id: "modules", label: "Modules" },
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

      {/* ------------------------------ Modules ----------------------------- */}
      <TabPanel id="modules" idPrefix="bureau" active={tab}>
        <Section number={4} ghost="MODULES" title="Modules prévus">
          <div className="mb-6 flex items-start gap-3 border-2 border-ae2v-black bg-ae2v-black p-5 text-ae2v-offwhite">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ae2v-green" />
            <p className="text-sm">
              Démonstration côté navigateur uniquement. Les rôles, la validation des dossiers et les
              montants seront contrôlés côté serveur (authentification, autorisation, audit).
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Adhérents",
              "Équipe & rôles",
              "Événements & participants",
              "Scanner QR",
              "Boutique & stocks",
              "Commandes",
              "Partenaires",
              "Contenu & médias",
              "Exports & audit",
            ].map((module) => (
              <HardCard key={module} interactive={false} title={module}>
                Module à brancher lors de la phase backend.
              </HardCard>
            ))}
          </div>
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
