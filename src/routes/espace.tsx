import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CreditCard, Gift, ShoppingBag, Ticket, UserRound } from "lucide-react";

import { TapeLabel } from "@/components/brand";
import { QrCode } from "@/components/demo/qr-code";
import { MemberCard } from "@/components/membre/member-card";
import { PageHero } from "@/components/layout/page-hero";
import { EmptyState, HardCard, Section } from "@/components/layout/section";
import { TabPanel, TabsNav } from "@/components/layout/tabs-nav";
import { Button } from "@/components/ui/button";
import { getDynamicTeamMembers } from "@/lib/dynamic-store";
import { displayedTeamTitles, initials, type TeamPole } from "@/data/team";
import { demoEvents, publicRecordToEvent, type Ae2vEvent } from "@/data/events";
import { poles as bdePolesData } from "@/data/poles";
import {
  contributionStatusLabels,
  formatCents,
  hasDiscount,
  isMember,
  membershipStatusLabels,
  roleLabels,
  useDemoSession,
  type Candidature,
} from "@/lib/demo-session";
import {
  EMAIL_CATEGORIES,
  getEmailPreferencesServer,
  updateEmailPreferencesServer,
  type EmailCategory,
} from "@/lib/server-functions/email-preferences";
import { getOwnTeamMemberServer, type ServerTeamMember } from "@/lib/server-functions/team";
import { downloadInvoicePdf } from "@/lib/invoice-pdf";
import { getPublicEventsServer } from "@/lib/server-functions/events";
import {
  getOwnCandidaturesServer,
  submitCandidatureServer,
} from "@/lib/server-functions/candidatures";

export const Route = createFileRoute("/espace")({
  head: () => ({
    meta: [
      { title: "Mon espace — AE2V" },
      {
        name: "description",
        content:
          "Espace étudiant AE2V : carte de membre, cotisation, billets, commandes boutique et profil.",
      },
      { property: "og:title", content: "Mon espace — AE2V" },
      { property: "og:description", content: "Carte de membre, billets et commandes AE2V." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/espace" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/espace" }],
  }),
  component: EspacePage,
});

const modules = [
  {
    icon: CreditCard,
    title: "Ma carte",
    text: "Carte de membre avec QR code et année d'adhésion.",
  },
  { icon: Ticket, title: "Mes billets", text: "Billets d'événement avec QR code d'entrée." },
  { icon: ShoppingBag, title: "Mes commandes", text: "Suivi des commandes boutique." },
  { icon: Gift, title: "Ma cotisation", text: "État de la cotisation et avantages associés." },
  { icon: UserRound, title: "Mon profil", text: "Informations, promo et gestion du compte." },
];

const poles = bdePolesData.map((p) => p.name);

const TABS = [
  { id: "apercu", label: "Aperçu" },
  { id: "carte", label: "Ma carte" },
  { id: "cotisation", label: "Cotisation" },
  { id: "evenements", label: "Événements" },
  { id: "commandes", label: "Commandes" },
  { id: "factures", label: "Factures" },
  { id: "profil", label: "Profil" },
];

function EspacePage() {
  const { account, candidatures, addCandidature } = useDemoSession();
  const [tab, setTab] = useState("apercu");
  const [emailCategories, setEmailCategories] = useState<EmailCategory[]>([]);
  const [emailUnsubscribed, setEmailUnsubscribed] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [serverBureauMember, setServerBureauMember] = useState<ServerTeamMember | null>(null);
  const [serverCandidatures, setServerCandidatures] = useState<Candidature[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Ae2vEvent[]>(
    import.meta.env.DEV ? demoEvents : [],
  );
  const loadEmailPreferences = useServerFn(getEmailPreferencesServer);
  const saveEmailPreferences = useServerFn(updateEmailPreferencesServer);
  const loadOwnTeamMember = useServerFn(getOwnTeamMemberServer);
  const loadPublicEvents = useServerFn(getPublicEventsServer);
  const loadOwnCandidatures = useServerFn(getOwnCandidaturesServer);
  const submitCandidature = useServerFn(submitCandidatureServer);

  useEffect(() => {
    let active = true;
    void loadPublicEvents({ data: undefined })
      .then((records) => {
        if (!active) return;
        if (records.length > 0) setUpcomingEvents(records.map(publicRecordToEvent));
        else if (import.meta.env.DEV) setUpcomingEvents(demoEvents);
        else setUpcomingEvents([]);
      })
      .catch(() => {
        if (active && import.meta.env.DEV) setUpcomingEvents(demoEvents);
      });
    return () => {
      active = false;
    };
  }, [loadPublicEvents]);

  useEffect(() => {
    if (!account) return;
    const legacyCategories: EmailCategory[] = account.emailPrefs.flatMap((value) => {
      const upper = value.toUpperCase();
      if (upper.includes("ÉVÉN") || upper.includes("EVEN")) return ["EVENEMENTS"];
      if (upper.includes("BOUTIQUE")) return ["BOUTIQUE"];
      if (upper.includes("PARTEN") || upper.includes("BUREAU")) return ["BDE"];
      return [];
    });
    setEmailCategories(Array.from(new Set(legacyCategories)));
    if (account.id.startsWith("acc-")) return;
    let active = true;
    void loadEmailPreferences({ data: undefined })
      .then((snapshot) => {
        if (!active) return;
        setEmailCategories(snapshot.categories);
        setEmailUnsubscribed(snapshot.unsubscribed);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [account, loadEmailPreferences]);

  useEffect(() => {
    if (!account || account.id.startsWith("acc-")) {
      setServerBureauMember(null);
      return;
    }
    let active = true;
    void loadOwnTeamMember()
      .then((member) => {
        if (active) setServerBureauMember(member);
      })
      .catch(() => {
        if (active) setServerBureauMember(null);
      });
    return () => {
      active = false;
    };
  }, [account, loadOwnTeamMember]);

  useEffect(() => {
    if (!account || account.id.startsWith("acc-")) {
      setServerCandidatures([]);
      return;
    }
    void loadOwnCandidatures({ data: undefined })
      .then((rows) =>
        setServerCandidatures(
          rows.map((row) => ({
            ...row,
            status: row.status as Candidature["status"],
          })),
        ),
      )
      .catch(() => setServerCandidatures([]));
  }, [account, loadOwnCandidatures]);

  if (!account) {
    return (
      <>
        <PageHero
          eyebrow="Espace étudiant"
          title="Mon espace"
          intro="Ta carte, tes billets, tes commandes et ta participation à la vie de l'association."
        />
        <Section
          number={1}
          ghost="ACCÈS"
          title="Connexion requise"
          intro="Connecte-toi pour retrouver ta carte de membre, tes billets et tes commandes."
        >
          <div className="border-2 border-ae2v-black bg-card p-8">
            <h3 className="ae2v-headline text-[clamp(1.8rem,4.5vw,2.8rem)]">
              Tu n'es pas connecté
            </h3>
            <p className="mt-4 max-w-xl text-sm text-muted-foreground">
              Des comptes de démonstration sont disponibles (membre cotisant, membre non cotisant,
              bureau) pour tester l'ensemble des parcours.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/connexion">Se connecter (démo)</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/adherer">Adhérer</Link>
              </Button>
            </div>
          </div>
        </Section>

        <Section number={2} ghost="ESPACE" title="Ce que tu y trouveras" tone="dark">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <HardCard key={module.title} interactive={false} title={module.title} tone="dark">
                  <Icon aria-hidden="true" className="mb-3 h-6 w-6 text-ae2v-green" />
                  {module.text}
                </HardCard>
              );
            })}
          </div>
        </Section>
      </>
    );
  }

  const membre = isMember(account);
  const cotisant = hasDiscount(account);
  const pendingPayment = account.contributionStatus === "PAIEMENT_EN_ATTENTE";
  const currentCandidatures = account.id.startsWith("acc-") ? candidatures : serverCandidatures;
  const myCandidature = currentCandidatures.find(
    (c) => c.email.toLowerCase() === account.email.toLowerCase(),
  );
  const localBureauMember = getDynamicTeamMembers().find(
    (member) =>
      member.displayName.toLowerCase() === `${account.firstName} ${account.lastName}`.toLowerCase(),
  );
  const derivedOfficerRole: ServerTeamMember["officerRole"] =
    account.roleTitle === "Président" || account.roleTitle === "Présidente"
      ? "Président"
      : account.roleTitle === "Vice-président" || account.roleTitle === "Vice-présidente"
        ? "Vice-président"
        : account.roleTitle === "Secrétaire"
          ? "Secrétaire"
          : account.roleTitle === "Trésorier"
            ? "Trésorier"
            : account.roleTitle === "Trésorière"
              ? "Trésorière"
              : null;
  const derivedBureauMember: ServerTeamMember | null =
    account.role === "bureau" || account.role === "bureau_admin"
      ? {
          id: `account-team-${account.id}`,
          displayName: `${account.firstName} ${account.lastName}`,
          roleTitle: account.roleTitle ?? "Membre du bureau",
          roleTitles: [account.roleTitle ?? "Membre du bureau"],
          officerRole: derivedOfficerRole,
          poles: account.pole ? [account.pole] : [],
          showDefaultPoleTitles: false,
          personalAe2vEmail: account.email.toLowerCase().endsWith("@ae2v.fr")
            ? account.email
            : null,
          roleEmail: null,
          isOfficer: Boolean(derivedOfficerRole),
          bio: null,
          photoUrl: null,
          mandateYear: account.schoolYear,
          displayOrder: 0,
          publicVisible: true,
          userId: account.id,
        }
      : null;
  const bureauMember = serverBureauMember ?? localBureauMember ?? derivedBureauMember;

  return (
    <>
      <PageHero
        eyebrow={roleLabels[account.role]}
        title={`Salut ${account.firstName}`}
        intro={
          membre
            ? `Membre depuis le ${account.memberSince ?? "—"} · ${contributionStatusLabels[account.contributionStatus]}`
            : "Ta demande d'adhésion n'est pas encore validée par le bureau."
        }
      />

      <TabsNav
        tabs={TABS}
        active={tab}
        onChange={setTab}
        label="Sections de mon espace"
        idPrefix="espace"
      />

      {/* ------------------------------ Aperçu ------------------------------ */}
      <TabPanel id="apercu" idPrefix="espace" active={tab}>
        <Section number={1} ghost="APERÇU" title="Vue d'ensemble">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi
              value={membre ? "Adhérent" : membershipStatusLabels[account.membershipStatus]}
              label="Statut d'adhésion"
              tone={membre ? "green" : undefined}
            />
            <Kpi
              value={contributionStatusLabels[account.contributionStatus]}
              label="Statut de cotisation"
            />
            <Kpi value={account.memberSince ?? "—"} label="Adhérent depuis" />
            <Kpi value={String(account.tickets.length)} label="Billets" />
          </div>

          {pendingPayment ? <PendingNotice className="mt-6" /> : null}

          {bureauMember && (
            <div className="mt-6">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-ae2v-red">
                    Membre du bureau
                  </p>
                  <h3 className="font-impact text-2xl uppercase">Ta carte du bureau</h3>
                </div>
                <Button size="sm" variant="outline" onClick={() => setTab("carte")}>
                  Ouvrir les cartes
                </Button>
              </div>
              <BureauMemberCard member={bureauMember} />
            </div>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <HardCard interactive={false} eyebrow="Carte" title="Ma carte de membre">
              Ton QR code d'accès aux événements et à la boutique.
              <Button className="mt-4 w-full" size="sm" onClick={() => setTab("carte")}>
                Voir ma carte
              </Button>
            </HardCard>
            <HardCard interactive={false} eyebrow="Billets" title="Mes événements">
              {account.tickets.length} billet(s) enregistré(s).
              <Button
                className="mt-4 w-full"
                size="sm"
                variant="black"
                onClick={() => setTab("evenements")}
              >
                Voir mes billets
              </Button>
            </HardCard>
            <HardCard interactive={false} eyebrow="Boutique" title="Mes commandes">
              {account.orders.length} commande(s) en cours ou passées.
              <Button
                className="mt-4 w-full"
                size="sm"
                variant="black"
                onClick={() => setTab("commandes")}
              >
                Voir mes commandes
              </Button>
            </HardCard>
          </div>
        </Section>
      </TabPanel>

      {/* ------------------------------- Carte ------------------------------ */}
      <TabPanel id="carte" idPrefix="espace" active={tab}>
        <Section
          number={2}
          ghost="CARTE"
          title="Ma carte de membre"
          intro="Présente ce QR code à l'entrée des événements et en boutique. Le code est un jeton opaque : il ne contient aucune donnée personnelle."
        >
          {membre ? (
            <div className="grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start">
              <MemberCard
                data={{
                  firstName: account.firstName,
                  lastName: account.lastName,
                  membershipStatus: account.membershipStatus,
                  contributionStatus: account.contributionStatus,
                  departement: account.departement,
                  niveau: account.niveau,
                  schoolYear: account.schoolYear,
                  memberSince: account.memberSince,
                  cardCode: account.cardCode,
                }}
              />
              <div className="space-y-4">
                <div className="border-2 border-ae2v-black bg-card p-5">
                  <p className="text-[0.65rem] font-bold tracking-[0.16em] uppercase">
                    Historique de l'adhésion
                  </p>
                  <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <Info label="Demande déposée le" value={account.requestedAt ?? "—"} />
                    <Info label="Adhésion validée le" value={account.validatedAt ?? "—"} />
                    <Info label="Membre depuis" value={account.memberSince ?? "—"} />
                    <Info label="Année scolaire" value={account.schoolYear} />
                  </dl>
                </div>
                {pendingPayment ? <PendingNotice /> : null}
              </div>
              {bureauMember && (
                <div className="lg:col-span-2">
                  <BureauMemberCard member={bureauMember} />
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              label="Carte indisponible"
              detail={`Statut du dossier : ${membershipStatusLabels[account.membershipStatus]}. Ta carte sera générée dès la validation de ton adhésion par le bureau.`}
            />
          )}
        </Section>
      </TabPanel>

      {/* ---------------------------- Cotisation ---------------------------- */}
      <TabPanel id="cotisation" idPrefix="espace" active={tab}>
        <Section
          number={3}
          ghost="COTISATION"
          title="Ma cotisation"
          intro="Adhésion et cotisation sont deux choses distinctes : tu es membre dès la validation de ton dossier, la cotisation ouvre les réductions."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Kpi
              value={contributionStatusLabels[account.contributionStatus]}
              label="Statut de cotisation"
              tone={cotisant ? "green" : undefined}
            />
            <Kpi
              value={
                account.contributionCents > 0 ? formatCents(account.contributionCents) : "0,00 €"
              }
              label="Montant"
            />
            <Kpi value={cotisant ? "Actives" : "Non actives"} label="Réductions" />
          </div>

          <div className="mt-6 border-2 border-ae2v-black bg-card p-5 text-sm">
            {cotisant ? (
              <p>
                Ta cotisation est confirmée : les tarifs réduits cotisant s'appliquent sur les
                événements et la boutique.
              </p>
            ) : pendingPayment ? (
              <p className="flex gap-2">
                <AlertTriangle
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-ae2v-red"
                />
                <span>
                  <strong>
                    Cotisation en attente : les réductions ne sont pas encore actives.
                  </strong>{" "}
                  Le règlement se fait au bureau du BDE. Elles seront activées dès la confirmation
                  du paiement par le trésorier.
                </span>
              </p>
            ) : (
              <p>
                Tu es membre sans cotisation. Cotiser (montant libre à partir de 3 €, réglé au
                bureau du BDE) débloque les tarifs réduits.
              </p>
            )}
            {!cotisant ? (
              <Button asChild className="mt-4" variant="black">
                <Link to="/contact">Contacter le bureau</Link>
              </Button>
            ) : null}
          </div>
        </Section>
      </TabPanel>

      {/* ---------------------------- Événements ---------------------------- */}
      <TabPanel id="evenements" idPrefix="espace" active={tab}>
        <Section
          number={4}
          ghost="BILLETS"
          title="Mes billets"
          tone="dark"
          intro="Chaque billet est nominatif. Le QR code est scanné une seule fois à l'entrée."
        >
          {account.tickets.length === 0 ? (
            <EmptyState
              label="Aucun billet"
              detail="Tes billets d'événement apparaîtront ici dès ta première inscription."
              action={
                <Button asChild size="lg">
                  <Link to="/evenements">Voir les événements</Link>
                </Button>
              }
            />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {account.tickets.map((ticket) => (
                <li
                  key={ticket.id}
                  className="flex flex-col gap-4 border-2 border-ae2v-offwhite/20 bg-ae2v-black p-5 sm:flex-row"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.65rem] font-bold tracking-[0.18em] uppercase opacity-70">
                      {ticket.tier} · {formatCents(ticket.priceCents)}
                    </p>
                    <h3 className="ae2v-headline mt-1 text-2xl">{ticket.eventTitle}</h3>
                    <p className="mt-2 text-sm opacity-85">{ticket.date}</p>
                    <p className="text-sm opacity-85">{ticket.place}</p>
                    <p
                      className={`mt-3 inline-block border-2 px-2 py-1 text-xs font-bold uppercase ${
                        ticket.status === "valide"
                          ? "border-ae2v-green bg-ae2v-green text-ae2v-black"
                          : ticket.status === "en_attente_paiement"
                            ? "border-yellow-300 bg-yellow-300 text-ae2v-black"
                            : "border-ae2v-offwhite/40 text-ae2v-offwhite/70"
                      }`}
                    >
                      {ticket.status === "valide"
                        ? "✓ Valide"
                        : ticket.status === "en_attente_paiement"
                          ? "Paiement en attente"
                          : ticket.status === "annule"
                            ? "Annulé"
                            : "Déjà utilisé"}
                    </p>
                  </div>
                  {ticket.status === "valide" && (
                    <QrCode
                      value={ticket.code}
                      size={120}
                      label={`QR code du billet ${ticket.eventTitle}`}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}

          <h3 className="ae2v-headline mt-12 text-2xl">Prochainement</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {upcomingEvents
              .filter((e) => e.status === "OUVERT" || e.status === "BIENTOT")
              .slice(0, 3)
              .map((event) => (
                <HardCard
                  key={event.id}
                  interactive={false}
                  tone="dark"
                  eyebrow={event.kind}
                  title={event.title}
                >
                  {event.date} · {event.place}
                  <Button asChild className="mt-4 w-full" size="sm">
                    <Link to="/evenements">Voir la billetterie</Link>
                  </Button>
                </HardCard>
              ))}
          </div>
        </Section>
      </TabPanel>

      {/* ---------------------------- Commandes ----------------------------- */}
      <TabPanel id="commandes" idPrefix="espace" active={tab}>
        <Section
          number={5}
          ghost="BOUTIQUE"
          title="Mes commandes"
          intro="Suivi de tes commandes textile et goodies, avec le détail des articles."
        >
          {account.orders.length === 0 ? (
            <EmptyState
              label="Aucune commande"
              detail="Tes commandes boutique apparaîtront ici avec leur état de préparation."
              action={
                <Button asChild size="lg">
                  <Link to="/boutique">Voir la boutique</Link>
                </Button>
              }
            />
          ) : (
            <ul className="space-y-4">
              {account.orders.map((order) => {
                const total = order.lines.reduce((sum, l) => sum + l.priceCents * l.qty, 0);
                return (
                  <li key={order.id} className="border-2 border-ae2v-black bg-card p-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="ae2v-headline text-xl">{order.id}</h3>
                      <span className="border-2 border-ae2v-black bg-ae2v-green px-2 py-1 text-xs font-bold uppercase">
                        {order.status}
                      </span>
                      <span className="text-sm text-muted-foreground">Passée le {order.date}</span>
                    </div>
                    <ul className="mt-4 divide-y divide-ae2v-black/10 border-y border-ae2v-black/10">
                      {order.lines.map((line) => (
                        <li key={line.name} className="flex justify-between gap-4 py-2 text-sm">
                          <span>
                            {line.qty} × {line.name}{" "}
                            <span className="text-muted-foreground">({line.variant})</span>
                          </span>
                          <span className="font-bold">
                            {formatCents(line.priceCents * line.qty)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-right font-impact text-lg">
                      Total : {formatCents(total)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </TabPanel>

      {/* ----------------------------- Factures ----------------------------- */}
      <TabPanel id="factures" idPrefix="espace" active={tab}>
        <Section
          number={6}
          ghost="FACTURES"
          title="Mes factures"
          tone="dark"
          intro="Retrouve les justificatifs liés à tes paiements confirmés."
        >
          {(account.payments ?? []).length > 0 ? (
            <div className="mb-8">
              <h3 className="font-impact text-xl uppercase">Historique des paiements</h3>
              <ul className="mt-3 space-y-3">
                {(account.payments ?? []).map((payment) => (
                  <li
                    key={payment.id}
                    className="flex flex-wrap items-center justify-between gap-3 border-2 border-ae2v-offwhite/25 bg-ae2v-black p-4 text-sm"
                  >
                    <span>
                      <strong>{payment.kind.replaceAll("_", " ")}</strong>
                      <span className="ml-2 opacity-70">{payment.createdAt}</span>
                    </span>
                    <span className="font-bold">
                      {formatCents(payment.amountCents)} · {payment.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {(account.invoices ?? []).length === 0 ? (
            <EmptyState
              label="Aucune facture"
              detail="Une facture sera générée automatiquement dès qu’un paiement est confirmé par le bureau."
            />
          ) : (
            <ul className="space-y-4">
              {(account.invoices ?? []).map((invoice) => (
                <li
                  key={invoice.id}
                  className="flex flex-wrap items-center justify-between gap-4 border-2 border-ae2v-offwhite/25 bg-ae2v-black p-5"
                >
                  <div>
                    <p className="font-impact text-xl">{invoice.id}</p>
                    <p className="mt-1 text-sm opacity-80">
                      {invoice.description} · {invoice.date}
                    </p>
                    <p className="mt-1 text-sm font-bold">
                      {formatCents(invoice.totalCents)} · {invoice.status}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      downloadInvoicePdf({
                        id: invoice.id,
                        date: invoice.date,
                        customerName: `${account.firstName} ${account.lastName}`,
                        customerEmail: account.email,
                        paymentMethod: invoice.paymentMethod,
                        totalCents: invoice.totalCents,
                        description: invoice.description,
                        status: invoice.status,
                      })
                    }
                  >
                    Télécharger le PDF
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </TabPanel>

      {/* ------------------------------ Profil ------------------------------ */}
      <TabPanel id="profil" idPrefix="espace" active={tab}>
        <Section
          number={7}
          ghost="PROFIL"
          title="Mon profil"
          intro="Tes informations et ta participation à la vie de l'association."
        >
          <div className="border-2 border-ae2v-black bg-card p-5">
            <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <Info label="Nom complet" value={`${account.firstName} ${account.lastName}`} />
              <Info label="E-mail" value={account.email} />
              <Info label="Formation" value={`${account.departement} · ${account.niveau}`} />
              <Info label="Rôle" value={roleLabels[account.role]} />
              <Info
                label="Statut d'adhésion"
                value={membershipStatusLabels[account.membershipStatus]}
              />
              <Info
                label="Statut de cotisation"
                value={contributionStatusLabels[account.contributionStatus]}
              />
              <Info label="Membre depuis" value={account.memberSince ?? "—"} />
              <Info label="Préférences e-mail" value={account.emailPrefs.join(", ") || "Aucune"} />
            </dl>
          </div>

          <div className="mt-6 border-2 border-ae2v-black bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="font-impact text-xl uppercase">Mes préférences email</h3>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Choisis les catégories facultatives que tu souhaites recevoir. Les confirmations
                  de paiement et messages liés à une action restent séparés.
                </p>
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.12em]">
                {emailUnsubscribed
                  ? "Tout est désactivé"
                  : `${emailCategories.length} catégorie(s)`}
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {EMAIL_CATEGORIES.map((category) => {
                const checked = emailCategories.includes(category) && !emailUnsubscribed;
                return (
                  <label
                    key={category}
                    className="flex min-h-12 items-center gap-3 border-2 border-ae2v-black/15 bg-ae2v-offwhite px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={emailSaving}
                      onChange={(event) => {
                        setEmailUnsubscribed(false);
                        setEmailCategories((current) =>
                          event.target.checked
                            ? Array.from(new Set([...current, category]))
                            : current.filter((item) => item !== category),
                        );
                      }}
                    />
                    <span>{emailCategoryLabel(category)}</span>
                  </label>
                );
              })}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                variant="black"
                disabled={emailSaving}
                onClick={() => {
                  setEmailSaving(true);
                  setEmailMessage(null);
                  void saveEmailPreferences({
                    data: { categories: emailCategories, unsubscribeAll: false },
                  })
                    .then((snapshot) => {
                      setEmailCategories(snapshot.categories);
                      setEmailUnsubscribed(snapshot.unsubscribed);
                      setEmailMessage("Préférences enregistrées.");
                    })
                    .catch(() =>
                      setEmailMessage("Impossible d’enregistrer les préférences pour le moment."),
                    )
                    .finally(() => setEmailSaving(false));
                }}
              >
                {emailSaving ? "Enregistrement…" : "Enregistrer mes choix"}
              </Button>
              <Button
                variant="outline"
                disabled={emailSaving}
                onClick={() => {
                  setEmailSaving(true);
                  void saveEmailPreferences({ data: { categories: [], unsubscribeAll: true } })
                    .then((snapshot) => {
                      setEmailCategories(snapshot.categories);
                      setEmailUnsubscribed(snapshot.unsubscribed);
                      setEmailMessage("Toutes les communications facultatives sont désactivées.");
                    })
                    .catch(() =>
                      setEmailMessage("Impossible de modifier les préférences pour le moment."),
                    )
                    .finally(() => setEmailSaving(false));
                }}
              >
                Tout désactiver
              </Button>
            </div>
            {emailMessage && (
              <p className="mt-3 text-sm font-bold" role="status">
                {emailMessage}
              </p>
            )}
          </div>

          <h3 className="ae2v-headline mt-12 text-2xl">Participer à l'organisation</h3>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Tout membre peut demander à rejoindre un pôle du bureau, participer aux votes et à
            l'organisation des événements.
          </p>
          <div className="mt-6">
            <JoinBureauBlock
              alreadyApplied={Boolean(myCandidature)}
              statusLabel={myCandidature?.status ?? null}
              onSubmit={async (pole, motivation, availability) => {
                if (account.id.startsWith("acc-")) {
                  addCandidature({
                    name: `${account.firstName} ${account.lastName}`,
                    email: account.email,
                    pole,
                    motivation,
                    availability,
                  });
                  return;
                }
                const row = await submitCandidature({
                  data: { pole, motivation, availability },
                });
                setServerCandidatures((current) => [
                  {
                    ...row,
                    status: row.status as Candidature["status"],
                  },
                  ...current,
                ]);
              }}
            />
          </div>
        </Section>
      </TabPanel>
    </>
  );
}

function emailCategoryLabel(category: EmailCategory): string {
  return {
    ADHESION: "Adhésion et vie membre",
    EVENEMENTS: "Événements",
    BOUTIQUE: "Boutique et commandes",
    BDE: "Vie du BDE",
    INFORMATIONS_GENERALES: "Informations générales",
  }[category];
}

function PendingNotice({ className }: { className?: string }) {
  return (
    <p
      className={`flex gap-2 border-2 border-ae2v-red bg-ae2v-red/10 p-4 text-sm ${className ?? ""}`}
    >
      <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ae2v-red" />
      <span>
        <strong>Cotisation en attente.</strong> Les réductions ne sont pas encore actives : elles le
        seront dès la confirmation du paiement par le bureau.
      </span>
    </p>
  );
}

function BureauMemberCard({
  member,
}: {
  member: ServerTeamMember | ReturnType<typeof getDynamicTeamMembers>[number];
}) {
  const titles = displayedTeamTitles(
    "mandate" in member
      ? member
      : {
          ...member,
          poles: member.poles as TeamPole[],
          showDefaultPoleTitles: member.showDefaultPoleTitles,
          mandate: member.mandateYear,
          isDemo: false,
          isPlaceholder: !member.photoUrl,
        },
  );
  const poles = member.poles.join(" · ") || "À définir";
  const mandate = "mandate" in member ? member.mandate : member.mandateYear;
  return (
    <article className="relative overflow-hidden border-2 border-ae2v-black bg-ae2v-black p-6 text-ae2v-offwhite shadow-[8px_8px_0_0_var(--ae2v-red)]">
      <div className="pointer-events-none absolute -right-8 -top-8 size-36 rotate-45 border-2 border-ae2v-green/40" />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[0.65rem] font-bold tracking-[0.18em] uppercase text-ae2v-green">
            Carte membre du bureau
          </p>
          <h3 className="mt-2 font-impact text-3xl uppercase">{member.displayName}</h3>
          {member.officerRole && (
            <span className="mt-2 inline-flex border-2 border-ae2v-green bg-ae2v-green px-2 py-1 text-xs font-black uppercase text-ae2v-black">
              {member.officerRole}
            </span>
          )}
        </div>
        {member.photoUrl ? (
          <img
            src={member.photoUrl}
            alt={`Portrait de ${member.displayName}`}
            className="size-20 border-2 border-ae2v-green object-cover"
          />
        ) : (
          <div className="flex size-20 items-center justify-center border-2 border-ae2v-green bg-ae2v-red font-impact text-2xl text-ae2v-offwhite">
            {initials(member.displayName)}
          </div>
        )}
      </div>
      <div className="relative mt-6 grid gap-4 border-t-2 border-ae2v-offwhite/20 pt-4 sm:grid-cols-2">
        <div>
          <p className="text-[0.6rem] font-bold tracking-[0.16em] uppercase text-ae2v-offwhite/60">
            Titres
          </p>
          <p className="mt-1 font-bold">{titles.join(" · ")}</p>
        </div>
        <div>
          <p className="text-[0.6rem] font-bold tracking-[0.16em] uppercase text-ae2v-offwhite/60">
            Pôles
          </p>
          <p className="mt-1 font-bold">{poles}</p>
        </div>
        <div>
          <p className="text-[0.6rem] font-bold tracking-[0.16em] uppercase text-ae2v-offwhite/60">
            Mandat
          </p>
          <p className="mt-1 font-bold">{mandate}</p>
        </div>
        {(member.roleEmail || member.personalAe2vEmail) && (
          <div>
            <p className="text-[0.6rem] font-bold tracking-[0.16em] uppercase text-ae2v-offwhite/60">
              Contacts AE2V
            </p>
            {member.roleEmail && (
              <a
                className="mt-1 block font-mono text-xs text-ae2v-green underline"
                href={`mailto:${member.roleEmail}`}
              >
                {member.roleEmail}
              </a>
            )}
            {member.personalAe2vEmail && (
              <a
                className="mt-1 block font-mono text-xs text-ae2v-green underline"
                href={`mailto:${member.personalAe2vEmail}`}
              >
                {member.personalAe2vEmail}
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function Kpi({ value, label, tone }: { value: string; label: string; tone?: "green" | undefined }) {
  return (
    <div
      className={`border-2 border-ae2v-black p-5 ${tone === "green" ? "bg-ae2v-green text-ae2v-black" : "bg-card"}`}
    >
      <p className="font-impact text-2xl leading-tight break-words">{value}</p>
      <p className="mt-1 text-xs font-bold tracking-[0.14em] uppercase">{label}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.65rem] font-bold tracking-[0.16em] uppercase opacity-70">{label}</dt>
      <dd className="mt-0.5 font-bold break-words">{value}</dd>
    </div>
  );
}

function JoinBureauBlock({
  alreadyApplied,
  statusLabel,
  onSubmit,
}: {
  alreadyApplied: boolean;
  statusLabel: string | null;
  onSubmit: (pole: string, motivation: string, availability: string) => void | Promise<void>;
}) {
  const [pole, setPole] = useState(poles[0]!);
  const [motivation, setMotivation] = useState("");
  const [availability, setAvailability] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const done = useMemo(() => sent || alreadyApplied, [sent, alreadyApplied]);

  const inputClass =
    "min-h-[44px] w-full border-2 border-ae2v-black/25 bg-ae2v-offwhite px-3 py-2 text-base text-ae2v-black outline-none focus-visible:border-ae2v-red focus-visible:ring-2 focus-visible:ring-ae2v-red/40";

  if (done) {
    return (
      <div className="border-2 border-ae2v-offwhite/30 bg-ae2v-black p-6 text-ae2v-offwhite">
        <TapeLabel tone="green">Candidature envoyée</TapeLabel>
        <h3 className="ae2v-headline mt-5 text-2xl">Ta demande est enregistrée</h3>
        <p className="mt-3 max-w-xl text-sm opacity-85">
          Le bureau examine les candidatures en réunion. Statut actuel :{" "}
          <strong>{statusLabel ?? "EN_ATTENTE"}</strong>. Tu seras recontacté par e-mail.
        </p>
      </div>
    );
  }

  return (
    <form
      noValidate
      className="max-w-2xl border-2 border-ae2v-black bg-ae2v-offwhite p-6 text-ae2v-black"
      onSubmit={(e) => {
        e.preventDefault();
        if (motivation.trim().length < 20) {
          setError("Explique ta motivation en 20 caractères minimum.");
          return;
        }
        setError(null);
        void Promise.resolve(
          onSubmit(pole, motivation.trim(), availability.trim() || "Non précisé"),
        )
          .then(() => setSent(true))
          .catch(() => setError("La candidature n’a pas pu être enregistrée. Réessaie plus tard."));
      }}
    >
      <h3 className="ae2v-headline text-2xl">Demander à rejoindre le bureau</h3>
      <p className="mt-2 text-sm text-ae2v-black/70">
        Aucune expérience requise. Tu peux participer aux votes et à l'organisation dès validation.
      </p>

      <div className="mt-5">
        <label htmlFor="join-pole" className="block text-xs font-bold tracking-[0.14em] uppercase">
          Pôle souhaité <span className="text-ae2v-red">*</span>
        </label>
        <select
          id="join-pole"
          className={`${inputClass} mt-2`}
          value={pole}
          onChange={(e) => setPole(e.target.value)}
        >
          {poles.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <label
          htmlFor="join-motivation"
          className="block text-xs font-bold tracking-[0.14em] uppercase"
        >
          Motivation <span className="text-ae2v-red">*</span>
        </label>
        <textarea
          id="join-motivation"
          rows={4}
          maxLength={500}
          className={`${inputClass} mt-2`}
          value={motivation}
          onChange={(e) => setMotivation(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "join-motivation-error" : undefined}
        />
        {error ? (
          <p id="join-motivation-error" className="mt-2 text-sm font-bold text-ae2v-red">
            <span aria-hidden="true">✕ </span>
            {error}
          </p>
        ) : null}
      </div>

      <div className="mt-4">
        <label
          htmlFor="join-availability"
          className="block text-xs font-bold tracking-[0.14em] uppercase"
        >
          Disponibilités{" "}
          <span className="font-medium tracking-normal text-ae2v-black/50 normal-case">
            (facultatif)
          </span>
        </label>
        <input
          id="join-availability"
          className={`${inputClass} mt-2`}
          placeholder="Ex. mercredi après-midi, week-ends"
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
        />
      </div>

      <Button type="submit" className="mt-6" size="lg" variant="black">
        Envoyer ma candidature
      </Button>
    </form>
  );
}
