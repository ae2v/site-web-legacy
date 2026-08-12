import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ClipboardCheck,
  CreditCard,
  FileText,
  Mail,
  Package,
  QrCode,
  Ticket,
  UserRound,
  Edit,
  CheckCircle2,
} from "lucide-react";

import { PageHero } from "@/components/layout/page-hero";
import { EmptyState, Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/bureau/data-table";
import { PaymentModal } from "@/components/bureau/payment-modal";
import { notifySite } from "@/components/ui/site-feedback";
import { EmailComposerModal } from "@/components/bureau/email-composer-modal";
import { MemberCard } from "@/components/membre/member-card";
import {
  demoAccounts,
  formatCents,
  membershipStatusLabels,
  contributionStatusLabels,
  useDemoSession,
  type DemoAccount,
} from "@/lib/demo-session";
import { getDynamicInvoices } from "@/lib/invoices-store";
import { getDynamicOrders } from "@/lib/orders-store";
import { getDynamicTeamMembers } from "@/lib/dynamic-store";
import { initials } from "@/data/team";
import { downloadInvoicePdf } from "@/lib/invoice-pdf";
import {
  getPerson360Server,
  updatePersonProfileServer,
  updatePaymentStatusServer,
  type BureauPerson360,
} from "@/lib/server-functions/people";
import {
  EMAIL_CATEGORIES,
  updatePersonEmailPreferencesServer,
  type EmailCategory,
} from "@/lib/server-functions/email-preferences";
import { decideMembershipServer } from "@/lib/server-functions/membership";

function opaqueCardCode(value: string): string {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `AE2V-2026-MBR-${(hash >>> 0).toString(36).toUpperCase().padStart(8, "0")}`;
}

export const Route = createFileRoute("/bureau/personnes/$personId")({
  head: () => ({
    meta: [
      { title: "Fiche membre — Bureau AE2V" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PersonProfilePage,
});

function PersonProfilePage() {
  const { personId } = Route.useParams();
  const navigate = Route.useNavigate();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentResolved, setPaymentResolved] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [paymentRefundDraft, setPaymentRefundDraft] = useState<{
    paymentId: string;
    maxCents: number;
    amountEuros: string;
    note: string;
  } | null>(null);
  const [decisionDraft, setDecisionDraft] = useState<{
    decision: "A_CORRIGER" | "REFUSE";
    note: string;
  } | null>(null);
  const [serverPerson, setServerPerson] = useState<BureauPerson360 | null>(null);
  const [personLoadState, setPersonLoadState] = useState<
    "loading" | "ready" | "not-found" | "error"
  >("loading");
  const { dossiers, ready, sessionResolved, account } = useDemoSession();
  const loadPerson = useServerFn(getPerson360Server);
  const updatePaymentStatus = useServerFn(updatePaymentStatusServer);
  const updatePersonProfile = useServerFn(updatePersonProfileServer);
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileDraft, setProfileDraft] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    phone: "",
    studentId: "",
    departement: "",
    niveau: "",
    schoolYear: "",
    groupe: "",
    interests: "",
    volunteer: "",
    message: "",
    imageRight: false,
    notes: "",
  });
  const updateEmailPreferences = useServerFn(updatePersonEmailPreferencesServer);
  const decideMembership = useServerFn(decideMembershipServer);

  useEffect(() => {
    if (!sessionResolved) {
      setPersonLoadState("loading");
      return;
    }
    if (!account || account.id.startsWith("acc-")) {
      setPersonLoadState("ready");
      return;
    }
    let active = true;
    setPersonLoadState("loading");
    void loadPerson({ data: { personId } })
      .then((result) => {
        if (active) {
          setServerPerson(result);
          setPersonLoadState("ready");
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        setServerPerson(null);
        const status =
          error instanceof Response
            ? error.status
            : typeof error === "object" && error !== null && "status" in error
              ? Number(error.status)
              : null;
        setPersonLoadState(status === 404 ? "not-found" : "error");
      });
    return () => {
      active = false;
    };
  }, [account, loadPerson, personId, sessionResolved]);

  useEffect(() => {
    if (!serverPerson) return;
    setProfileDraft({
      firstName: serverPerson.firstName,
      lastName: serverPerson.lastName,
      birthDate: serverPerson.dossier?.birthDate ?? "",
      phone: serverPerson.dossier?.phone ?? "",
      studentId: serverPerson.dossier?.studentId ?? "",
      departement: serverPerson.dossier?.departement ?? serverPerson.departement,
      niveau: serverPerson.dossier?.niveau ?? serverPerson.niveau,
      schoolYear: serverPerson.dossier?.schoolYear ?? serverPerson.schoolYear,
      groupe: serverPerson.dossier?.groupe ?? "",
      interests: serverPerson.dossier?.interests.join(", ") ?? "",
      volunteer: serverPerson.dossier?.volunteer ?? "",
      message: serverPerson.dossier?.message ?? "",
      imageRight: serverPerson.dossier?.imageRight ?? false,
      notes: serverPerson.dossier?.notes ?? "",
    });
  }, [serverPerson]);
  if (
    ready &&
    sessionResolved &&
    (!account || !["bureau", "bureau_admin"].includes(account.role))
  ) {
    return (
      <main className="min-h-screen bg-ae2v-offwhite py-16">
        <Section
          title="Accès Bureau requis"
          intro="Cette fiche est réservée aux membres autorisés du bureau AE2V."
        >
          <Button asChild variant="black">
            <Link to="/connexion">Se connecter</Link>
          </Button>
        </Section>
      </main>
    );
  }
  const demoPerson = demoAccounts.find((account) => account.id === personId);
  const dossier = dossiers.find((candidate) => candidate.id === personId);
  const linkedDemo = dossier
    ? demoAccounts.find((account) => account.email.toLowerCase() === dossier.email.toLowerCase())
    : undefined;
  const localPerson: DemoAccount | undefined =
    demoPerson ??
    (dossier
      ? {
          id: dossier.id,
          email: dossier.email,
          password: "",
          firstName: dossier.firstName,
          lastName: dossier.lastName,
          role: "membre",
          departement: dossier.departement,
          niveau: dossier.niveau,
          contributionCents: dossier.contributionCents,
          schoolYear: "2026-2027",
          membershipStatus: dossier.status,
          contributionStatus: dossier.contributionStatus,
          requestedAt: dossier.submittedAt,
          validatedAt: dossier.validatedAt,
          memberSince: dossier.memberSince,
          cardCode: linkedDemo?.cardCode ?? opaqueCardCode(dossier.email),
          tickets: linkedDemo?.tickets ?? [],
          orders: linkedDemo?.orders ?? [],
          emailPrefs: dossier.emailPrefs,
        }
      : undefined);

  const remotePerson: DemoAccount | undefined = serverPerson
    ? {
        id: serverPerson.id,
        email: serverPerson.email,
        password: "",
        firstName: serverPerson.firstName,
        lastName: serverPerson.lastName,
        role: "bureau_admin",
        departement: serverPerson.departement,
        niveau: serverPerson.niveau,
        contributionCents: serverPerson.contributionCents,
        schoolYear: serverPerson.schoolYear,
        membershipStatus:
          serverPerson.membershipStatus === "MEMBRE_VALIDE"
            ? "VALIDE"
            : serverPerson.membershipStatus === "A_CORRIGER"
              ? "A_CORRIGER"
              : serverPerson.membershipStatus === "REFUSE"
                ? "REFUSE"
                : "EN_ATTENTE",
        contributionStatus:
          serverPerson.contributionStatus === "PAYEE"
            ? "COTISANT"
            : serverPerson.contributionStatus === "PAIEMENT_EN_ATTENTE"
              ? "PAIEMENT_EN_ATTENTE"
              : "NON_COTISANT",
        requestedAt: null,
        validatedAt: null,
        memberSince: serverPerson.memberSince,
        cardCode: serverPerson.cardCode,
        tickets: serverPerson.tickets.map((ticket) => ({
          id: ticket.id,
          eventId: ticket.id,
          eventTitle: ticket.eventTitle,
          date: ticket.eventDate,
          place: "",
          tier: ticket.tier,
          priceCents: ticket.priceCents,
          code: ticket.code,
          status:
            ticket.status === "utilise"
              ? "utilise"
              : ticket.status === "en_attente_paiement"
                ? "en_attente_paiement"
                : ticket.status === "annule"
                  ? "annule"
                  : "valide",
        })),
        orders: serverPerson.orders.map((order) => ({
          id: order.id,
          date: order.date,
          status:
            order.status === "LIVREE"
              ? "Retirée"
              : order.status === "ANNULEE"
                ? "Annulée"
                : order.status === "PAYEE"
                  ? "Prête"
                  : "À préparer",
          lines: order.lines.map((line) => ({
            name: line.productName,
            variant: "",
            qty: line.quantity,
            priceCents: line.unitPriceCents,
          })),
        })),
        emailPrefs: [],
      }
    : undefined;
  const resolvedPerson = localPerson ?? remotePerson;

  if (!resolvedPerson && personLoadState === "loading") {
    return (
      <main className="min-h-screen bg-ae2v-offwhite py-16" aria-busy="true">
        <Section title="Chargement…" intro="Récupération de la fiche adhérent en cours." />
      </main>
    );
  }

  if (!resolvedPerson) {
    if (personLoadState === "error") {
      return (
        <main className="min-h-screen bg-ae2v-offwhite py-16">
          <Section
            title="Fiche indisponible"
            intro="La fiche n’a pas pu être chargée. Réessayez dans quelques instants."
          >
            <Button variant="black" onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </Section>
        </main>
      );
    }
    return (
      <main className="min-h-screen bg-ae2v-offwhite py-16">
        <Section
          title="Membre introuvable"
          intro="La fiche demandée n’existe pas ou n’est plus accessible."
        >
          <Button asChild variant="black">
            <Link to="/bureau">Retour au bureau</Link>
          </Button>
        </Section>
      </main>
    );
  }

  const person = resolvedPerson;
  const teamMember = getDynamicTeamMembers().find(
    (member) =>
      member.displayName.toLowerCase() === `${person.firstName} ${person.lastName}`.toLowerCase(),
  );
  const invoices = getDynamicInvoices().filter(
    (invoice) => invoice.customerEmail.toLowerCase() === person.email.toLowerCase(),
  );
  const profileInvoices = serverPerson
    ? serverPerson.invoices.map((invoice) => ({
        id: invoice.id,
        date: invoice.date,
        totalCents: invoice.totalCents,
        description: invoice.description,
        status: invoice.status,
        paymentMethod: invoice.paymentMethod,
        lines: invoice.lines,
      }))
    : invoices.map((invoice) => ({
        id: invoice.id,
        date: invoice.date,
        totalCents: invoice.totalCents,
        description: invoice.lines[0]?.description ?? "Règlement AE2V",
        status: invoice.status ?? "EMISE",
        paymentMethod: invoice.paymentMethod,
      }));
  const profileOrders = serverPerson
    ? serverPerson.orders.map((order) => ({
        id: order.id,
        date: order.date,
        totalCents: order.totalCents,
        status: order.status,
        lines: order.lines,
      }))
    : getDynamicOrders()
        .filter((order) => order.customerEmail.toLowerCase() === person.email.toLowerCase())
        .map((order) => ({
          id: order.id,
          date: order.date,
          totalCents: order.totalCents,
          status: order.status,
          lines: order.items.map((item) => ({
            productName: item.productName,
            quantity: item.qty,
            unitPriceCents: item.unitPriceCents,
          })),
        }));
  const pendingServerPayment = serverPerson?.payments.find(
    (payment) => payment.status === "EN_ATTENTE" && /COTISATION|ADHESION/i.test(payment.kind),
  );
  const pending = !paymentResolved && person.contributionStatus !== "COTISANT";
  const canFinance = account?.role === "bureau_admin";

  async function changePaymentStatus(
    paymentId: string,
    status: "CONFIRME" | "ANNULE" | "REMBOURSE" | "PARTIELLEMENT_REMBOURSE",
    refundAmountCents?: number,
    notes?: string,
  ) {
    try {
      await updatePaymentStatus({
        data: {
          paymentId,
          status,
          ...(refundAmountCents ? { refundAmountCents } : {}),
          ...(notes ? { notes } : {}),
        },
      });
      const refreshed = await loadPerson({ data: { personId } });
      setServerPerson(refreshed);
    } catch {
      notifySite("Le statut du paiement n’a pas pu être enregistré.", { kind: "error" });
    }
  }

  async function submitPaymentRefund() {
    if (!paymentRefundDraft?.note.trim()) return;
    const amountCents = Math.round(Number(paymentRefundDraft.amountEuros.replace(",", ".")) * 100);
    if (
      !Number.isFinite(amountCents) ||
      amountCents <= 0 ||
      amountCents > paymentRefundDraft.maxCents
    ) {
      notifySite(
        `Le montant doit être compris entre 0,01 € et ${formatCents(paymentRefundDraft.maxCents)}.`,
        { kind: "warning" },
      );
      return;
    }
    await changePaymentStatus(
      paymentRefundDraft.paymentId,
      amountCents === paymentRefundDraft.maxCents ? "REMBOURSE" : "PARTIELLEMENT_REMBOURSE",
      amountCents,
      paymentRefundDraft.note.trim(),
    );
    setPaymentRefundDraft(null);
  }

  async function toggleEmailCategory(category: EmailCategory) {
    if (!serverPerson) return;
    const current = serverPerson.emailPrefs.includes(category);
    try {
      await updateEmailPreferences({
        data: {
          personId,
          categories: current
            ? serverPerson.emailPrefs.filter((item): item is EmailCategory => item !== category)
            : [...serverPerson.emailPrefs, category].filter(
                (item, index, values): item is EmailCategory =>
                  EMAIL_CATEGORIES.includes(item as EmailCategory) &&
                  values.indexOf(item) === index,
              ),
          unsubscribeAll: false,
        },
      });
      setServerPerson(await loadPerson({ data: { personId } }));
    } catch {
      notifySite("La préférence email n’a pas pu être enregistrée.", { kind: "error" });
    }
  }

  async function toggleAllEmails() {
    if (!serverPerson) return;
    try {
      await updateEmailPreferences({
        data: {
          personId,
          categories: serverPerson.emailUnsubscribed ? [...EMAIL_CATEGORIES] : [],
          unsubscribeAll: !serverPerson.emailUnsubscribed,
        },
      });
      setServerPerson(await loadPerson({ data: { personId } }));
    } catch {
      notifySite("Les préférences email n’ont pas pu être enregistrées.", { kind: "error" });
    }
  }

  async function decidePersonMembership(decision: "MEMBRE_VALIDE" | "A_CORRIGER" | "REFUSE") {
    if (!serverPerson?.dossier) return;
    try {
      const result = await decideMembership({
        data: {
          dossierId: serverPerson.dossier.id,
          decision,
        },
      });
      if (result.userId) {
        await navigate({
          to: "/bureau/personnes/$personId",
          params: { personId: result.userId },
          replace: true,
        });
      } else {
        setServerPerson(await loadPerson({ data: { personId } }));
      }
    } catch {
      notifySite("La décision d’adhésion n’a pas pu être enregistrée.", { kind: "error" });
    }
  }

  async function submitPersonDecision() {
    if (!serverPerson?.dossier || !decisionDraft?.note.trim()) return;
    try {
      const result = await decideMembership({
        data: {
          dossierId: serverPerson.dossier.id,
          decision: decisionDraft.decision,
          note: decisionDraft.note.trim(),
        },
      });
      setDecisionDraft(null);
      if (result.userId) {
        await navigate({
          to: "/bureau/personnes/$personId",
          params: { personId: result.userId },
          replace: true,
        });
      } else {
        setServerPerson(await loadPerson({ data: { personId } }));
      }
    } catch {
      notifySite("La décision d’adhésion n’a pas pu être enregistrée.", { kind: "error" });
    }
  }

  return (
    <main className="min-h-screen bg-ae2v-offwhite pb-20">
      <PageHero
        eyebrow="Bureau / Adhérents / Fiche 360°"
        title={`${person.firstName} ${person.lastName}`}
        intro="Toutes les informations administratives, adhésions, règlements, commandes, billets et factures au même endroit."
      />

      <Section title="Fiche adhérent">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost">
            <Link to="/bureau">
              <ArrowLeft className="size-4" /> Retour aux adhérents
            </Link>
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="black" onClick={() => setEmailOpen(true)}>
              <Mail className="size-4" /> Écrire un mail
            </Button>
            <Button asChild variant="outline">
              <Link to="/bureau" hash="scanner">
                <QrCode className="size-4" /> Scanner / identifier
              </Link>
            </Button>
            {serverPerson && (
              <Button variant="outline" onClick={() => setProfileEditing((current) => !current)}>
                <Edit className="size-4" />{" "}
                {profileEditing ? "Annuler la modification" : "Modifier la fiche"}
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <article className="border-2 border-ae2v-black bg-ae2v-black p-5 text-ae2v-offwhite">
            <div className="mb-5 flex items-center gap-4">
              <div className="flex size-16 items-center justify-center border-2 border-ae2v-green bg-ae2v-green text-xl font-black text-ae2v-black">
                {initials(`${person.firstName} ${person.lastName}`)}
              </div>
              <div>
                <h2 className="font-impact text-2xl uppercase">
                  {person.firstName} {person.lastName}
                </h2>
                <p className="text-sm text-ae2v-offwhite/75">{person.email}</p>
              </div>
            </div>
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-xs uppercase text-ae2v-offwhite/60">Filière</dt>
                <dd className="font-bold">{person.departement}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-ae2v-offwhite/60">Année</dt>
                <dd className="font-bold">{person.niveau}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-ae2v-offwhite/60">Année scolaire</dt>
                <dd className="font-bold">{person.schoolYear}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-ae2v-offwhite/60">Code carte opaque</dt>
                <dd className="font-mono font-bold">{person.cardCode}</dd>
              </div>
            </dl>
          </article>

          <div className="grid gap-4 sm:grid-cols-2">
            <StatusCard
              label="Dossier d’adhésion"
              value={membershipStatusLabels[person.membershipStatus]}
              tone={person.membershipStatus === "VALIDE" ? "green" : "neutral"}
            />
            <StatusCard
              label="Cotisation"
              value={contributionStatusLabels[person.contributionStatus]}
              tone={person.contributionStatus === "COTISANT" ? "green" : "neutral"}
            />
            {(teamMember || serverPerson?.teamMember) && (
              <>
                <StatusCard
                  label="Pôles du membre du bureau"
                  value={
                    [...(teamMember?.poles ?? []), ...(serverPerson?.teamMember?.poles ?? [])]
                      .filter(Boolean)
                      .filter((value, index, values) => values.indexOf(value) === index)
                      .join(" · ") || "À définir"
                  }
                  tone="neutral"
                />
                <StatusCard
                  label="Titre(s) du membre du bureau"
                  value={
                    teamMember?.roleTitles?.join(" · ") ??
                    serverPerson?.teamMember?.roleTitles?.join(" · ") ??
                    serverPerson?.teamMember?.roleTitle ??
                    "À définir"
                  }
                  tone="neutral"
                />
                <StatusCard
                  label="E-mails du membre du bureau"
                  value={
                    [
                      serverPerson?.teamMember?.personalAe2vEmail,
                      serverPerson?.teamMember?.roleEmail,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "À renseigner"
                  }
                  tone="neutral"
                />
              </>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <QuickAction
            icon={ClipboardCheck}
            label="Voir la demande d’adhésion"
            href="#dossier-complet"
          />
          <QuickAction
            icon={CreditCard}
            label={pending ? "Traiter les paiements en attente" : "Voir les paiements"}
            href="#paiements"
          />
          <QuickAction icon={Package} label="Gérer les commandes HelloAsso" href="#commandes" />
          <QuickAction icon={Ticket} label="Voir les événements et billets" href="#evenements" />
          <QuickAction icon={FileText} label="Créer / consulter une facture" href="#factures" />
        </div>

        <div className="mt-8 border-t-2 border-ae2v-black/15 pt-8">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-ae2v-red">
              Carte du membre
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Aperçu de la carte utilisée dans l’espace personnel, avec son code opaque.
            </p>
          </div>
          <MemberCard
            data={{
              firstName: person.firstName,
              lastName: person.lastName,
              membershipStatus: person.membershipStatus,
              contributionStatus: person.contributionStatus,
              departement: person.departement,
              niveau: person.niveau,
              schoolYear: person.schoolYear,
              memberSince: person.membershipStatus === "VALIDE" ? person.schoolYear : null,
              cardCode: person.cardCode,
            }}
          />
        </div>
      </Section>

      {serverPerson && (
        <Section number={1} ghost="BASE" title="Données persistées">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatusCard
              label="Adhésions annuelles"
              value={String(serverPerson.memberships.length)}
              tone="neutral"
            />
            <StatusCard
              label="Paiements"
              value={String(serverPerson.payments.length)}
              tone="neutral"
            />
            <StatusCard
              label="Commandes"
              value={String(serverPerson.orders.length)}
              tone="neutral"
            />
            <StatusCard
              label="Factures"
              value={String(serverPerson.invoices.length)}
              tone="green"
            />
          </div>
          {serverPerson.dossier && (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <ProfilePanel
                id="dossier-complet"
                icon={UserRound}
                title="Formulaire d’adhésion complet"
              >
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <Info label="Année scolaire du dossier" value={serverPerson.dossier.schoolYear} />
                  <Info label="Téléphone" value={serverPerson.dossier.phone ?? "Non renseigné"} />
                  <Info
                    label="Identifiant étudiant"
                    value={serverPerson.dossier.studentId ?? "Non renseigné"}
                  />
                  <Info label="Groupe" value={serverPerson.dossier.groupe ?? "Non renseigné"} />
                  <Info
                    label="Volontariat"
                    value={serverPerson.dossier.volunteer ?? "Non renseigné"}
                  />
                  <Info
                    label="Droit à l’image"
                    value={serverPerson.dossier.imageRight ? "Accordé" : "Non accordé"}
                  />
                  <Info label="Dossier soumis le" value={serverPerson.dossier.submittedAt} />
                  <Info
                    label="Dossier validé le"
                    value={serverPerson.dossier.validatedAt ?? "Non validé"}
                  />
                  <Info
                    label="RGPD accepté le"
                    value={serverPerson.dossier.rgpdAcceptedAt ?? "Non renseigné"}
                  />
                  <Info
                    label="Statuts acceptés le"
                    value={serverPerson.dossier.statutsAcceptedAt ?? "Non renseigné"}
                  />
                </dl>
                <div className="mt-4 border-t-2 border-ae2v-black/10 pt-4 text-sm">
                  <p className="text-xs font-bold uppercase text-muted-foreground">
                    Centres d’intérêt
                  </p>
                  <p className="mt-1">
                    {serverPerson.dossier.interests.join(" · ") || "Aucun renseigné"}
                  </p>
                  <p className="mt-4 text-xs font-bold uppercase text-muted-foreground">
                    Raison d’être / motivation
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">
                    {serverPerson.dossier.message || "Aucun message"}
                  </p>
                  {serverPerson.dossier.notes && (
                    <>
                      <p className="mt-4 text-xs font-bold uppercase text-muted-foreground">
                        Notes Bureau
                      </p>
                      <p className="mt-1 whitespace-pre-wrap">{serverPerson.dossier.notes}</p>
                    </>
                  )}
                </div>
                {(serverPerson.dossier.status === "DEMANDE_SOUMISE" ||
                  serverPerson.dossier.status === "A_CORRIGER") && (
                  <div className="mt-5 flex flex-wrap gap-2 border-t-2 border-ae2v-red pt-4">
                    <Button
                      size="sm"
                      variant="black"
                      onClick={() => void decidePersonMembership("MEMBRE_VALIDE")}
                    >
                      <CheckCircle2 className="size-4" /> Valider l’adhésion
                    </Button>
                    {serverPerson.dossier.status === "DEMANDE_SOUMISE" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDecisionDraft({ decision: "A_CORRIGER", note: "" })}
                      >
                        Demander correction
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDecisionDraft({ decision: "REFUSE", note: "" })}
                    >
                      Refuser la demande
                    </Button>
                  </div>
                )}
                {profileEditing && (
                  <div className="mt-5 border-t-2 border-ae2v-red pt-4">
                    <p className="text-xs font-bold uppercase text-ae2v-red">
                      Modifier les informations
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {(
                        [
                          ["firstName", "Prénom"],
                          ["lastName", "Nom"],
                          ["phone", "Téléphone"],
                          ["studentId", "Identifiant étudiant"],
                          ["departement", "Filière / département"],
                          ["niveau", "Niveau d’étude"],
                          ["schoolYear", "Année scolaire"],
                          ["groupe", "Groupe"],
                        ] as const
                      ).map(([field, label]) => (
                        <label key={field} className="text-xs font-bold uppercase">
                          {label}
                          <input
                            className="mt-1 min-h-10 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-3 text-sm font-normal"
                            value={profileDraft[field]}
                            onChange={(event) =>
                              setProfileDraft((current) => ({
                                ...current,
                                [field]: event.target.value,
                              }))
                            }
                          />
                        </label>
                      ))}
                    </div>
                    <label className="mt-3 block text-xs font-bold uppercase">
                      Centres d’intérêt
                      <input
                        className="mt-1 min-h-10 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-3 text-sm font-normal"
                        value={profileDraft.interests}
                        onChange={(event) =>
                          setProfileDraft((current) => ({
                            ...current,
                            interests: event.target.value,
                          }))
                        }
                        placeholder="Événements, sport, communication…"
                      />
                      <span className="mt-1 block text-[0.65rem] font-normal normal-case text-muted-foreground">
                        Sépare les centres d’intérêt par des virgules.
                      </span>
                    </label>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="text-xs font-bold uppercase">
                        Volontariat
                        <select
                          className="mt-1 min-h-10 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-3 text-sm font-normal"
                          value={profileDraft.volunteer}
                          onChange={(event) =>
                            setProfileDraft((current) => ({
                              ...current,
                              volunteer: event.target.value,
                            }))
                          }
                        >
                          <option value="">Non renseigné</option>
                          <option value="oui">Oui</option>
                          <option value="peut-etre">Peut-être</option>
                          <option value="non">Non</option>
                        </select>
                      </label>
                      <label className="flex min-h-10 items-center gap-3 border-2 border-ae2v-black bg-ae2v-offwhite px-3 text-xs font-bold uppercase sm:mt-5">
                        <input
                          type="checkbox"
                          className="size-4 accent-ae2v-red"
                          checked={profileDraft.imageRight}
                          onChange={(event) =>
                            setProfileDraft((current) => ({
                              ...current,
                              imageRight: event.target.checked,
                            }))
                          }
                        />
                        Droit à l’image accordé
                      </label>
                    </div>
                    <label className="mt-3 block text-xs font-bold uppercase">
                      Message de motivation
                      <textarea
                        className="mt-1 min-h-20 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-3 py-2 text-sm font-normal"
                        value={profileDraft.message}
                        onChange={(event) =>
                          setProfileDraft((current) => ({
                            ...current,
                            message: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="mt-3 block text-xs font-bold uppercase">
                      Notes Bureau
                      <textarea
                        className="mt-1 min-h-20 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-3 py-2 text-sm font-normal"
                        value={profileDraft.notes}
                        onChange={(event) =>
                          setProfileDraft((current) => ({ ...current, notes: event.target.value }))
                        }
                      />
                    </label>
                    <Button
                      className="mt-3"
                      variant="black"
                      disabled={profileSaving}
                      onClick={() => {
                        setProfileSaving(true);
                        void updatePersonProfile({
                          data: {
                            personId,
                            firstName: profileDraft.firstName,
                            lastName: profileDraft.lastName,
                            phone: profileDraft.phone || null,
                            studentId: profileDraft.studentId || null,
                            departement: profileDraft.departement,
                            niveau: profileDraft.niveau,
                            schoolYear: profileDraft.schoolYear,
                            groupe: profileDraft.groupe || null,
                            interests: profileDraft.interests
                              .split(",")
                              .map((value) => value.trim())
                              .filter(Boolean),
                            volunteer: profileDraft.volunteer || null,
                            message: profileDraft.message || null,
                            imageRight: profileDraft.imageRight,
                            notes: profileDraft.notes || null,
                          },
                        })
                          .then(async () => {
                            setServerPerson(await loadPerson({ data: { personId } }));
                            setProfileEditing(false);
                          })
                          .catch(() =>
                            notifySite("La fiche n’a pas pu être mise à jour.", { kind: "error" }),
                          )
                          .finally(() => setProfileSaving(false));
                      }}
                    >
                      {profileSaving ? "Enregistrement…" : "Enregistrer les informations"}
                    </Button>
                  </div>
                )}
              </ProfilePanel>
              <ProfilePanel id="preferences-email" icon={Mail} title="Préférences email et statuts">
                <dl className="grid gap-3 text-sm">
                  <Info
                    label="Catégories actives"
                    value={serverPerson.emailPrefs.join(" · ") || "Aucune"}
                  />
                  <Info
                    label="Désinscription globale"
                    value={serverPerson.emailUnsubscribed ? "Oui" : "Non"}
                  />
                  <Info label="Statut adhésion" value={serverPerson.membershipStatus} />
                  <Info label="Statut cotisation" value={serverPerson.contributionStatus} />
                  <Info label="Rôle sécurité" value={serverPerson.role} />
                  {(serverPerson.teamMember || teamMember) && (
                    <>
                      <Info
                        label="Pôles du membre du bureau"
                        value={
                          [...(serverPerson.teamMember?.poles ?? []), ...(teamMember?.poles ?? [])]
                            .filter(Boolean)
                            .filter((value, index, values) => values.indexOf(value) === index)
                            .join(" · ") || "À définir"
                        }
                      />
                      <Info
                        label="Intitulés du membre du bureau"
                        value={
                          [
                            ...(serverPerson.teamMember?.roleTitles ?? []),
                            ...(teamMember?.roleTitles ?? []),
                          ]
                            .filter(Boolean)
                            .filter((value, index, values) => values.indexOf(value) === index)
                            .join(" · ") || "À définir"
                        }
                      />
                    </>
                  )}
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  {EMAIL_CATEGORIES.map((category) => (
                    <Button
                      key={category}
                      size="sm"
                      variant={serverPerson.emailPrefs.includes(category) ? "black" : "outline"}
                      onClick={() => void toggleEmailCategory(category)}
                    >
                      {serverPerson.emailPrefs.includes(category) ? "✓ " : "+ "}
                      {category}
                    </Button>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => void toggleAllEmails()}>
                    {serverPerson.emailUnsubscribed ? "Réactiver tout" : "Désactiver tout"}
                  </Button>
                </div>
                {serverPerson.emailPreferenceToken && (
                  <div className="mt-4 border-2 border-ae2v-black/15 bg-ae2v-offwhite p-3">
                    <p className="text-xs font-bold uppercase">
                      Lien de désinscription à insérer dans un mail
                    </p>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <a
                        className="min-w-0 flex-1 break-all font-mono text-xs underline"
                        href={`/email/desinscription/${serverPerson.emailPreferenceToken}`}
                      >
                        {`/email/desinscription/${serverPerson.emailPreferenceToken}`}
                      </a>
                      <Button
                        size="sm"
                        variant="black"
                        onClick={() =>
                          void navigator.clipboard?.writeText(
                            `${window.location.origin}/email/desinscription/${serverPerson.emailPreferenceToken}`,
                          )
                        }
                      >
                        Copier le lien
                      </Button>
                    </div>
                  </div>
                )}
              </ProfilePanel>
              <ProfilePanel id="journal-membre" icon={FileText} title="Journal d’activité">
                {serverPerson.auditLogs.length ? (
                  serverPerson.auditLogs.slice(0, 20).map((entry) => (
                    <div
                      key={entry.id}
                      className="border-2 border-ae2v-black/10 bg-ae2v-offwhite p-3 text-sm"
                    >
                      <div className="flex flex-wrap justify-between gap-2">
                        <span className="font-bold">{entry.action}</span>
                        <span className="text-xs text-muted-foreground">{entry.timestamp}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {entry.details} · {entry.author}
                      </p>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    label="Aucune activité ciblée"
                    detail="Les prochaines actions sur cette fiche seront journalisées ici."
                  />
                )}
              </ProfilePanel>
              <ProfilePanel id="messages-membre" icon={Mail} title="Messages de contact">
                {serverPerson.messages.length ? (
                  serverPerson.messages.map((message) => (
                    <div
                      key={message.id}
                      className="border-2 border-ae2v-black/10 bg-ae2v-offwhite p-3 text-sm"
                    >
                      <div className="flex flex-wrap justify-between gap-2">
                        <span className="font-bold">{message.sujet}</span>
                        <StatusPill tone={message.status === "TRAITE" ? "green" : "neutral"}>
                          {message.status}
                        </StatusPill>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-xs">{message.message}</p>
                      <p className="mt-2 text-[0.65rem] text-muted-foreground">
                        {message.sentAt} · reçu le{" "}
                        {new Date(message.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    label="Aucun message de contact"
                    detail="Les demandes envoyées avec cette adresse apparaîtront ici."
                  />
                )}
              </ProfilePanel>
            </div>
          )}
          {!serverPerson.dossier && (
            <ProfilePanel id="messages-membre" icon={Mail} title="Messages de contact">
              {serverPerson.messages.length ? (
                serverPerson.messages.map((message) => (
                  <div
                    key={message.id}
                    className="border-2 border-ae2v-black/10 bg-ae2v-offwhite p-3 text-sm"
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="font-bold">{message.sujet}</span>
                      <StatusPill tone={message.status === "TRAITE" ? "green" : "neutral"}>
                        {message.status}
                      </StatusPill>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-xs">{message.message}</p>
                    <p className="mt-2 text-[0.65rem] text-muted-foreground">
                      {message.sentAt} · reçu le{" "}
                      {new Date(message.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState
                  label="Aucun message de contact"
                  detail="Les demandes envoyées avec cette adresse apparaîtront ici."
                />
              )}
            </ProfilePanel>
          )}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <ProfilePanel
              id="paiements-serveur"
              icon={CreditCard}
              title="Historique des paiements serveur"
            >
              {serverPerson.payments.length ? (
                serverPerson.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-wrap items-center justify-between gap-3 border-2 border-ae2v-black/15 bg-ae2v-offwhite p-3 text-sm"
                  >
                    <div>
                      <p className="font-bold">
                        {payment.kind} · {formatCents(payment.amountCents)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payment.createdAt} · {payment.paymentMethod ?? "Mode non précisé"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={payment.status === "CONFIRME" ? "green" : "neutral"}>
                        {payment.status}
                      </StatusPill>
                      {payment.status === "EN_ATTENTE" && (
                        <>
                          <Button
                            size="sm"
                            variant="black"
                            disabled={!canFinance}
                            title={!canFinance ? "Droits trésorerie requis" : undefined}
                            onClick={() => void changePaymentStatus(payment.id, "CONFIRME")}
                          >
                            Confirmer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!canFinance}
                            title={!canFinance ? "Droits trésorerie requis" : undefined}
                            onClick={() => void changePaymentStatus(payment.id, "ANNULE")}
                          >
                            Annuler
                          </Button>
                        </>
                      )}
                      {(payment.status === "CONFIRME" ||
                        payment.status === "PARTIELLEMENT_REMBOURSE") &&
                        payment.amountCents - payment.refundedAmountCents > 0 && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!canFinance}
                              title={!canFinance ? "Droits trésorerie requis" : undefined}
                              onClick={() =>
                                setPaymentRefundDraft({
                                  paymentId: payment.id,
                                  maxCents: payment.amountCents - payment.refundedAmountCents,
                                  amountEuros: (
                                    (payment.amountCents - payment.refundedAmountCents) /
                                    100
                                  ).toFixed(2),
                                  note: "",
                                })
                              }
                            >
                              Remb. partiel
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!canFinance}
                              title={!canFinance ? "Droits trésorerie requis" : undefined}
                              onClick={() => void changePaymentStatus(payment.id, "REMBOURSE")}
                            >
                              Rembourser le solde
                            </Button>
                          </>
                        )}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  label="Aucun paiement serveur"
                  detail="Les règlements apparaîtront ici après migration."
                />
              )}
            </ProfilePanel>
            <ProfilePanel id="factures-serveur" icon={FileText} title="Factures serveur">
              {serverPerson.invoices.length ? (
                serverPerson.invoices.map((invoice) => (
                  <ActionRow
                    key={invoice.id}
                    label={invoice.id}
                    meta={`${invoice.date} · ${formatCents(invoice.totalCents)} · ${invoice.description}`}
                    action={
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          downloadInvoicePdf({
                            id: invoice.id,
                            date: invoice.date,
                            customerName: `${person.firstName} ${person.lastName}`,
                            customerEmail: person.email,
                            paymentMethod: invoice.paymentMethod,
                            totalCents: invoice.totalCents,
                            description: invoice.description,
                            lines: invoice.lines,
                            status: invoice.status,
                          })
                        }
                      >
                        PDF
                      </Button>
                    }
                  />
                ))
              ) : (
                <EmptyState
                  label="Aucune facture serveur"
                  detail="Les factures générées seront regroupées ici."
                />
              )}
            </ProfilePanel>
          </div>
        </Section>
      )}

      <Section number={1} ghost="ACTIVITÉ" title="Historique transversal">
        <div className="grid gap-6 lg:grid-cols-2">
          <ProfilePanel id="paiements" icon={CreditCard} title="Paiements & cotisations">
            {pending ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-ae2v-black/15 bg-ae2v-offwhite p-3 text-sm">
                <div>
                  <p className="font-bold">Cotisation annuelle</p>
                  <p className="text-xs text-muted-foreground">Paiement à vérifier</p>
                </div>
                <Button
                  size="sm"
                  variant="black"
                  disabled={!canFinance}
                  title={!canFinance ? "Droits trésorerie requis" : undefined}
                  onClick={() => setPaymentOpen(true)}
                >
                  Valider / facturer
                </Button>
              </div>
            ) : (
              <EmptyState
                label="Aucun paiement en attente"
                detail="La cotisation actuelle est enregistrée comme payée."
              />
            )}
          </ProfilePanel>
          <ProfilePanel id="commandes" icon={Package} title="Commandes & HelloAsso">
            {profileOrders.length ? (
              profileOrders.map((order) => (
                <ActionRow
                  key={order.id}
                  label={order.id}
                  meta={`${order.date} · ${formatCents(order.totalCents)}`}
                  action={order.status}
                />
              ))
            ) : (
              <EmptyState
                label="Aucune commande liée"
                detail="Les commandes importées depuis HelloAsso apparaîtront ici."
              />
            )}
          </ProfilePanel>
          <ProfilePanel id="evenements" icon={Ticket} title="Événements & billets">
            {person.tickets.length ? (
              person.tickets.map((ticket) => (
                <ActionRow
                  key={ticket.id}
                  label={ticket.eventTitle}
                  meta={`${ticket.date} · ${ticket.place}`}
                  action={ticket.status}
                />
              ))
            ) : (
              <EmptyState
                label="Aucun billet lié"
                detail="Les inscriptions et présences de cette personne seront regroupées ici."
              />
            )}
          </ProfilePanel>
          <ProfilePanel id="factures" icon={FileText} title="Factures">
            {profileInvoices.length ? (
              profileInvoices.map((invoice) => (
                <ActionRow
                  key={invoice.id}
                  label={`${invoice.id} · ${invoice.status}`}
                  meta={`${invoice.date} · ${formatCents(invoice.totalCents)} · ${invoice.description}`}
                  action={
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        downloadInvoicePdf({
                          id: invoice.id,
                          date: invoice.date,
                          customerName: `${person.firstName} ${person.lastName}`,
                          customerEmail: person.email,
                          paymentMethod: invoice.paymentMethod,
                          totalCents: invoice.totalCents,
                          description: invoice.description,
                          lines: "lines" in invoice ? invoice.lines : undefined,
                          status: invoice.status,
                        })
                      }
                    >
                      PDF
                    </Button>
                  }
                />
              ))
            ) : (
              <EmptyState
                label="Aucune facture"
                detail="Une facture peut être créée depuis une opération de paiement."
              />
            )}
          </ProfilePanel>
        </div>
      </Section>
      {paymentRefundDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ae2v-black/60 p-4 backdrop-blur-sm">
          <form
            className="w-full max-w-lg border-2 border-ae2v-black bg-card p-6 shadow-2xl"
            onSubmit={(event) => {
              event.preventDefault();
              void submitPaymentRefund();
            }}
          >
            <div className="mb-4 flex items-start justify-between gap-4 border-b-2 border-ae2v-black pb-3">
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-widest text-ae2v-red">
                  Paiement du profil
                </p>
                <h3 className="font-impact text-2xl uppercase">Rembourser le paiement</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Maximum remboursable : {formatCents(paymentRefundDraft.maxCents)}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentRefundDraft(null)}
                aria-label="Fermer"
                className="p-1 hover:bg-ae2v-black/10"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>
            <label className="block text-xs font-bold uppercase">
              Montant (€) *
              <input
                autoFocus
                type="number"
                min="0.01"
                max={(paymentRefundDraft.maxCents / 100).toFixed(2)}
                step="0.01"
                value={paymentRefundDraft.amountEuros}
                onChange={(event) =>
                  setPaymentRefundDraft({ ...paymentRefundDraft, amountEuros: event.target.value })
                }
                className="mt-1 min-h-11 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-3 text-sm"
                required
              />
            </label>
            <label className="mt-4 block text-xs font-bold uppercase">
              Motif *
              <textarea
                rows={4}
                value={paymentRefundDraft.note}
                onChange={(event) =>
                  setPaymentRefundDraft({ ...paymentRefundDraft, note: event.target.value })
                }
                className="mt-1 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-3 py-2 font-sans text-sm font-normal"
                required
              />
            </label>
            <div className="mt-4 flex justify-end gap-2 border-t-2 border-ae2v-black/10 pt-3">
              <Button type="button" variant="secondary" onClick={() => setPaymentRefundDraft(null)}>
                Annuler
              </Button>
              <Button type="submit" disabled={!paymentRefundDraft.note.trim()}>
                Confirmer le remboursement
              </Button>
            </div>
          </form>
        </div>
      )}
      {decisionDraft && serverPerson?.dossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ae2v-black/60 p-4 backdrop-blur-sm">
          <form
            className="w-full max-w-xl border-2 border-ae2v-black bg-card p-6 shadow-2xl"
            onSubmit={(event) => {
              event.preventDefault();
              void submitPersonDecision();
            }}
          >
            <div className="mb-4 flex items-start justify-between gap-4 border-b-2 border-ae2v-black pb-3">
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-widest text-ae2v-red">
                  Décision d’adhésion
                </p>
                <h3 className="font-impact text-2xl uppercase">
                  {decisionDraft.decision === "A_CORRIGER"
                    ? "Demander une correction"
                    : "Refuser la demande"}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {decisionDraft.decision === "A_CORRIGER"
                    ? "Un e-mail avec un lien de réponse sera envoyé à " + serverPerson.email + "."
                    : "Le motif sera conservé dans l’historique de la demande."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDecisionDraft(null)}
                aria-label="Fermer"
                className="p-1 hover:bg-ae2v-black/10"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>
            <label className="block text-xs font-bold uppercase">
              {decisionDraft.decision === "A_CORRIGER"
                ? "Informations à corriger *"
                : "Motif du refus *"}
              <textarea
                autoFocus
                rows={6}
                value={decisionDraft.note}
                onChange={(event) =>
                  setDecisionDraft({ ...decisionDraft, note: event.target.value })
                }
                className="mt-1 w-full border-2 border-ae2v-black bg-ae2v-offwhite px-3 py-2 font-sans text-sm font-normal"
                required
              />
            </label>
            <div className="mt-4 flex justify-end gap-2 border-t-2 border-ae2v-black/10 pt-3">
              <Button type="button" variant="secondary" onClick={() => setDecisionDraft(null)}>
                Annuler
              </Button>
              <Button type="submit" disabled={!decisionDraft.note.trim()}>
                {decisionDraft.decision === "A_CORRIGER"
                  ? "Envoyer la correction"
                  : "Confirmer le refus"}
              </Button>
            </div>
          </form>
        </div>
      )}
      <PaymentModal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        customerName={`${person.firstName} ${person.lastName}`}
        customerEmail={person.email}
        defaultDescription={`Cotisation annuelle AE2V ${person.schoolYear}`}
        defaultPriceCents={pendingServerPayment?.amountCents ?? (person.contributionCents || 1200)}
        {...(pendingServerPayment ? { pendingPaymentId: pendingServerPayment.id } : {})}
        onSuccessPay={() => {
          setPaymentResolved(true);
          if (serverPerson) void loadPerson({ data: { personId } }).then(setServerPerson);
        }}
      />
      <EmailComposerModal
        isOpen={emailOpen}
        onClose={() => setEmailOpen(false)}
        defaultRecipient={person.email}
      />
    </main>
  );
}

function StatusCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "neutral";
}) {
  return (
    <div className="border-2 border-ae2v-black bg-card p-4">
      <p className="text-xs font-bold uppercase text-muted-foreground">{label}</p>
      <StatusPill tone={tone}>{value}</StatusPill>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words font-medium">{value}</dd>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  href,
}: {
  icon: typeof UserRound;
  label: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex min-h-12 items-center gap-3 border-2 border-ae2v-black bg-card px-4 text-sm font-bold transition-colors hover:bg-ae2v-green"
    >
      <Icon className="size-5 text-ae2v-red" />
      {label}
    </a>
  );
}

function ProfilePanel({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: typeof UserRound;
  title: string;
  children: ReactNode;
}) {
  return (
    <article id={id} className="border-2 border-ae2v-black bg-card p-5">
      <h2 className="mb-4 flex items-center gap-2 font-impact text-xl uppercase">
        <Icon className="size-5 text-ae2v-red" />
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </article>
  );
}

function ActionRow({ label, meta, action }: { label: string; meta: string; action: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-ae2v-black/15 bg-ae2v-offwhite p-3 text-sm">
      <div>
        <p className="font-bold">{label}</p>
        <p className="text-xs text-muted-foreground">{meta}</p>
      </div>
      {typeof action === "string" ? (
        <Button size="sm" variant="outline">
          {action}
        </Button>
      ) : (
        action
      )}
    </div>
  );
}
