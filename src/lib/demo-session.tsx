/**
 * SESSION DE DÉMONSTRATION AE2V — 100 % côté navigateur.
 *
 * ⚠️ Ceci n'est PAS une authentification. Aucun secret, aucun contrôle d'accès
 * réel : c'est une maquette interactive permettant de tester les parcours
 * (adhérent cotisant, non cotisant, bureau avec ou sans droits de validation)
 * avant la mise en place du backend (auth + rôles + RLS côté serveur).
 *
 * Toute décision sensible (validation d'un dossier, statut payé, quota
 * d'événement) devra être recalculée et autorisée côté serveur.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { generateRandom2026Code } from "@/lib/id-generator";

/* -------------------------------------------------------------------------- */
/*  Rôles & permissions                                                        */
/* -------------------------------------------------------------------------- */

export type DemoRole =
  | "membre" // compte étudiant, adhésion non payée
  | "adherent" // membre cotisant à jour
  | "bureau" // membre du bureau, droits limités
  | "bureau_admin"; // bureau avec tous les droits

export type DemoPermission =
  | "dossiers:read"
  | "dossiers:edit"
  | "dossiers:validate"
  | "candidatures:read"
  | "candidatures:decide"
  | "events:manage"
  | "messages:read";

const PERMISSIONS: Record<DemoRole, DemoPermission[]> = {
  membre: [],
  adherent: [],
  bureau: ["dossiers:read", "dossiers:edit", "candidatures:read", "messages:read"],
  bureau_admin: [
    "dossiers:read",
    "dossiers:edit",
    "dossiers:validate",
    "candidatures:read",
    "candidatures:decide",
    "events:manage",
    "messages:read",
  ],
};

export const roleLabels: Record<DemoRole, string> = {
  membre: "Membre",
  adherent: "Membre",
  bureau: "Bureau — droits limités",
  bureau_admin: "Bureau — tous les droits",
};

/* -------------------------------------------------------------------------- */
/*  Comptes de démonstration                                                   */
/* -------------------------------------------------------------------------- */

export type DemoTicket = {
  id: string;
  eventId: string;
  eventTitle: string;
  date: string;
  place: string;
  tier: string;
  priceCents: number;
  code: string;
  status: "valide" | "utilise";
};

export type DemoOrder = {
  id: string;
  date: string;
  status: "À préparer" | "Prête" | "Retirée" | "Annulée";
  lines: { name: string; variant: string; qty: number; priceCents: number }[];
};

export type DemoAccount = {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: DemoRole;
  pole?: string;
  roleTitle?: string;
  departement: string;
  niveau: string;
  /** Cotisation versée en centimes (0 = aucune cotisation). */
  contributionCents: number;
  schoolYear: string;
  /** Statut du dossier d'adhésion (indépendant de la cotisation). */
  membershipStatus: MembershipStatus;
  /** Statut de cotisation (seul « COTISANT » ouvre les réductions). */
  contributionStatus: ContributionStatus;
  /** Date de dépôt de la demande d'adhésion. */
  requestedAt: string | null;
  /** Date de validation du dossier par le bureau. */
  validatedAt: string | null;
  /** Date d'adhésion (membre depuis). */
  memberSince: string | null;
  cardCode: string;
  tickets: DemoTicket[];
  orders: DemoOrder[];
  emailPrefs: string[];
};

const YEAR = "2026-2027";

export const demoAccounts: DemoAccount[] = [
  {
    id: "acc-noa",
    email: "noa.demo@etu.uvsq.fr",
    password: "demo1234",
    firstName: "Noa",
    lastName: "Perrin",
    role: "membre",
    departement: "MMI",
    niveau: "1re année",
    contributionCents: 0,
    schoolYear: YEAR,
    membershipStatus: "VALIDE",
    contributionStatus: "NON_COTISANT",
    requestedAt: "05/09/2026",
    validatedAt: "07/09/2026",
    memberSince: "07/09/2026",
    cardCode: "AE2V-2026-USR-7K9P2M4X",
    tickets: [],
    orders: [],
    emailPrefs: ["Événements"],
  },
  {
    id: "acc-ines",
    email: "ines.demo@etu.uvsq.fr",
    password: "demo1234",
    firstName: "Inès",
    lastName: "Faure",
    role: "adherent",
    departement: "Informatique",
    niveau: "2e année",
    contributionCents: 1200,
    schoolYear: YEAR,
    membershipStatus: "VALIDE",
    contributionStatus: "COTISANT",
    requestedAt: "02/09/2026",
    validatedAt: "12/09/2026",
    memberSince: "12/09/2026",
    cardCode: "AE2V-2026-USR-3R8W1L9V",
    tickets: [
      {
        id: "tk-1",
        eventId: "soiree-integration",
        eventTitle: "Soirée d'intégration",
        date: "Jeudi 24 septembre 2026 · 21h00",
        place: "Le Hangar — Vélizy",
        tier: "Tarif adhérent",
        priceCents: 800,
        code: "AE2V-2026-TK-9F3K2210",
        status: "valide",
      },
      {
        id: "tk-2",
        eventId: "tournoi-esport",
        eventTitle: "Tournoi e-sport",
        date: "Mercredi 14 octobre 2026 · 14h00",
        place: "Amphi B — IUT de Vélizy",
        tier: "Tarif adhérent",
        priceCents: 0,
        code: "AE2V-2026-TK-4B7Z1077",
        status: "utilise",
      },
    ],
    orders: [
      {
        id: "CMD-2026-0148",
        date: "02/10/2026",
        status: "Prête",
        lines: [
          { name: "Sweat AE2V", variant: "Taille M · Rouge", qty: 1, priceCents: 3200 },
          { name: "Tote bag", variant: "Unique", qty: 1, priceCents: 900 },
        ],
      },
    ],
    emailPrefs: ["Événements", "Boutique", "Partenariats"],
  },
  {
    id: "acc-hugo",
    email: "hugo.demo@ae2v.fr",
    password: "demo1234",
    firstName: "Hugo",
    lastName: "Nguyen",
    role: "bureau",
    pole: "Événementiel",
    roleTitle: "Membre du pôle événementiel",
    departement: "GEII",
    niveau: "2e année",
    contributionCents: 1200,
    schoolYear: YEAR,
    membershipStatus: "VALIDE",
    contributionStatus: "COTISANT",
    requestedAt: "01/09/2026",
    validatedAt: "03/09/2026",
    memberSince: "03/09/2026",
    cardCode: "AE2V-2026-USR-8M2P5N9Q",
    tickets: [
      {
        id: "tk-3",
        eventId: "gala",
        eventTitle: "Gala de fin d'année",
        date: "Vendredi 12 juin 2027 · 19h30",
        place: "Salle Ravel — Vélizy",
        tier: "Tarif adhérent",
        priceCents: 2500,
        code: "AE2V-2026-TK-1QT83390",
        status: "valide",
      },
    ],
    orders: [],
    emailPrefs: ["Événements", "Vie du bureau"],
  },
  {
    id: "acc-camille",
    email: "presidence@ae2v.fr",
    password: "demo1234",
    firstName: "Camille",
    lastName: "Rousseau",
    role: "bureau_admin",
    pole: "Direction",
    roleTitle: "Présidente",
    departement: "TC",
    niveau: "3e année",
    contributionCents: 2000,
    schoolYear: YEAR,
    membershipStatus: "VALIDE",
    contributionStatus: "COTISANT",
    requestedAt: "30/08/2026",
    validatedAt: "01/09/2026",
    memberSince: "01/09/2026",
    cardCode: "AE2V-2026-USR-1A4C7E9K",
    tickets: [],
    orders: [],
    emailPrefs: ["Événements", "Vie du bureau", "Partenariats"],
  },
];

/* -------------------------------------------------------------------------- */
/*  Dossiers d'adhésion (back-office de démonstration)                         */
/* -------------------------------------------------------------------------- */

/**
 * Statut d'ADHÉSION : décrit l'état du dossier. Une adhésion validée fait de la
 * personne un membre, qu'elle cotise ou non.
 */
export type MembershipStatus = "EN_ATTENTE" | "A_CORRIGER" | "VALIDE" | "REFUSE";
export type DossierStatus = MembershipStatus;

export const membershipStatusLabels: Record<MembershipStatus, string> = {
  EN_ATTENTE: "En attente",
  A_CORRIGER: "Correction demandée",
  VALIDE: "Validé",
  REFUSE: "Refusé",
};
export const dossierStatusLabels = membershipStatusLabels;

/**
 * Statut de COTISATION : totalement séparé de l'adhésion. Seul « COTISANT »
 * donne droit aux réductions ; un paiement en attente n'ouvre aucun avantage.
 */
export type ContributionStatus = "NON_COTISANT" | "PAIEMENT_EN_ATTENTE" | "COTISANT";

export const contributionStatusLabels: Record<ContributionStatus, string> = {
  NON_COTISANT: "Non cotisant",
  PAIEMENT_EN_ATTENTE: "Paiement en attente",
  COTISANT: "Cotisant",
};

/** Membre = dossier d'adhésion validé, indépendamment de la cotisation. */
export function isMember(account: { membershipStatus: MembershipStatus } | null): boolean {
  return account?.membershipStatus === "VALIDE";
}

/** Réductions : réservées aux cotisants confirmés. */
export function hasDiscount(
  account: { membershipStatus: MembershipStatus; contributionStatus: ContributionStatus } | null,
): boolean {
  return account?.membershipStatus === "VALIDE" && account.contributionStatus === "COTISANT";
}

export type Dossier = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  /** Téléphone saisi au formulaire (facultatif dans la démo). */
  phone: string;
  studentId: string;
  departement: string;
  niveau: string;
  contributionCents: number;
  contributionStatus: ContributionStatus;
  /** Thématiques d'e-mails acceptées par la personne. */
  emailPrefs: string[];
  /** Date de dépôt de la demande. */
  submittedAt: string;
  /** Date de validation du dossier (null tant qu'il n'est pas validé). */
  validatedAt: string | null;
  /** Date d'adhésion effective (null tant que non validé). */
  memberSince: string | null;
  status: DossierStatus;
  note: string;
};

const initialDossiers: Dossier[] = [
  {
    id: "ADH-2026-0311",
    firstName: "Noa",
    lastName: "Perrin",
    email: "noa.demo@etu.uvsq.fr",
    phone: "06 12 34 56 78",
    studentId: "22301188",
    departement: "MMI",
    niveau: "1re année",
    contributionCents: 500,
    contributionStatus: "PAIEMENT_EN_ATTENTE",
    emailPrefs: ["Événements"],
    submittedAt: "05/09/2026",
    validatedAt: null,
    memberSince: null,
    status: "EN_ATTENTE",
    note: "",
  },
  {
    id: "ADH-2026-0312",
    firstName: "Sacha",
    lastName: "Bonnet",
    email: "sacha.demo@etu.uvsq.fr",
    phone: "06 98 76 54 32",
    studentId: "22300471",
    departement: "GMP",
    niveau: "2e année",
    contributionCents: 1500,
    contributionStatus: "PAIEMENT_EN_ATTENTE",
    emailPrefs: ["Événements", "Vie du bureau"],
    submittedAt: "05/09/2026",
    validatedAt: null,
    memberSince: null,
    status: "EN_ATTENTE",
    note: "",
  },
  {
    id: "ADH-2026-0298",
    firstName: "Inès",
    lastName: "Faure",
    email: "ines.demo@etu.uvsq.fr",
    phone: "07 45 12 88 03",
    studentId: "22299034",
    departement: "Informatique",
    niveau: "2e année",
    contributionCents: 1200,
    contributionStatus: "COTISANT",
    emailPrefs: ["Événements", "Boutique", "Partenariats"],
    submittedAt: "02/09/2026",
    validatedAt: "12/09/2026",
    memberSince: "12/09/2026",
    status: "VALIDE",
    note: "Paiement confirmé en présentiel.",
  },
  {
    id: "ADH-2026-0305",
    firstName: "Yanis",
    lastName: "Chauvet",
    email: "yanis.demo@etu.uvsq.fr",
    phone: "",
    studentId: "2230",
    departement: "RT",
    niveau: "1re année",
    contributionCents: 0,
    contributionStatus: "NON_COTISANT",
    emailPrefs: [],
    submittedAt: "04/09/2026",
    validatedAt: null,
    memberSince: null,
    status: "A_CORRIGER",
    note: "Numéro étudiant incomplet.",
  },
];

/* -------------------------------------------------------------------------- */
/*  Candidatures bureau                                                        */
/* -------------------------------------------------------------------------- */

export type Candidature = {
  id: string;
  name: string;
  email: string;
  pole: string;
  motivation: string;
  availability: string;
  submittedAt: string;
  status: "EN_ATTENTE" | "ENTRETIEN" | "ACCEPTEE" | "REFUSEE";
};

export const candidatureStatusLabels: Record<Candidature["status"], string> = {
  EN_ATTENTE: "En attente",
  ENTRETIEN: "Entretien proposé",
  ACCEPTEE: "Acceptée",
  REFUSEE: "Refusée",
};

const initialCandidatures: Candidature[] = [
  {
    id: "CAN-2026-014",
    name: "Sacha Bonnet",
    email: "sacha.demo@etu.uvsq.fr",
    pole: "Événementiel",
    motivation: "Envie d'aider sur la logistique des soirées et le montage.",
    availability: "Mercredi après-midi et week-end",
    submittedAt: "06/09/2026",
    status: "EN_ATTENTE",
  },
];

/* -------------------------------------------------------------------------- */
/*  Messages de contact (formulaire → boîte de réception bureau)              */
/* -------------------------------------------------------------------------- */

export type ContactMessageStatus = "NOUVEAU" | "LU" | "TRAITE";

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  sujet: string;
  message: string;
  sentAt: string;
  status: ContactMessageStatus;
};

export const contactMessageStatusLabels: Record<ContactMessageStatus, string> = {
  NOUVEAU: "Nouveau",
  LU: "Lu",
  TRAITE: "Traité",
};

const initialMessages: ContactMessage[] = [
  {
    id: "MSG-2026-001",
    name: "Alice Martin",
    email: "alice.martin@etu.uvsq.fr",
    sujet: "Adhésion",
    message:
      "Bonjour, je souhaite adhérer à l'AE2V mais je ne comprends pas la différence entre adhésion et cotisation. Pouvez-vous m'expliquer ?",
    sentAt: "04/09/2026",
    status: "NOUVEAU",
  },
  {
    id: "MSG-2026-002",
    name: "Lucas Dufour",
    email: "lucas.dufour@etu.uvsq.fr",
    sujet: "Événement",
    message:
      "Y a-t-il une liste d'attente pour la soirée d'intégration ? Je n'ai pas eu le temps de m'inscrire.",
    sentAt: "05/09/2026",
    status: "LU",
  },
  {
    id: "MSG-2026-003",
    name: "Marine Petit",
    email: "marine.petit@entreprise.fr",
    sujet: "Partenariat",
    message:
      "Notre entreprise souhaite sponsoriser un événement. Pouvez-vous nous envoyer votre dossier de partenariat ?",
    sentAt: "06/09/2026",
    status: "TRAITE",
  },
];

/* -------------------------------------------------------------------------- */
/*  Contexte                                                                   */
/* -------------------------------------------------------------------------- */

type DemoState = {
  accountId: string | null;
  dossiers: Dossier[];
  candidatures: Candidature[];
  messages: ContactMessage[];
  customAccounts: DemoAccount[];
};

const STORAGE_KEY = "ae2v-demo-session-v2";

const defaultState: DemoState = {
  accountId: null,
  dossiers: initialDossiers,
  candidatures: initialCandidatures,
  messages: initialMessages,
  customAccounts: [],
};

type DemoContextValue = {
  ready: boolean;
  account: DemoAccount | null;
  role: DemoRole | null;
  isBureau: boolean;
  can: (permission: DemoPermission) => boolean;
  signIn: (accountId: string) => void;
  signInWithCredentials: (email: string, password: string) => { ok: boolean; error?: string };
  signUp: (params: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    departement: string;
    niveau: string;
  }) => { ok: boolean; error?: string };
  signOut: () => void;
  dossiers: Dossier[];
  addDossier: (
    newDossier: Omit<
      Dossier,
      "id" | "submittedAt" | "validatedAt" | "memberSince" | "status" | "note"
    >,
  ) => void;
  updateDossier: (id: string, patch: Partial<Dossier>) => void;
  candidatures: Candidature[];
  addCandidature: (input: Omit<Candidature, "id" | "submittedAt" | "status">) => void;
  updateCandidature: (id: string, status: Candidature["status"]) => void;
  messages: ContactMessage[];
  addMessage: (input: Omit<ContactMessage, "id" | "sentAt" | "status">) => void;
  updateMessageStatus: (id: string, status: ContactMessageStatus) => void;
  addTicket: (ticket: Omit<DemoTicket, "id">) => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(defaultState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<DemoState>;
          setState({
            accountId: parsed.accountId ?? null,
            dossiers: Array.isArray(parsed.dossiers) ? parsed.dossiers : defaultState.dossiers,
            candidatures: Array.isArray(parsed.candidatures)
              ? parsed.candidatures
              : defaultState.candidatures,
            messages: Array.isArray(parsed.messages) ? parsed.messages : defaultState.messages,
            customAccounts: Array.isArray(parsed.customAccounts)
              ? parsed.customAccounts
              : defaultState.customAccounts,
          });
        }
      }
    } catch {
      /* stockage indisponible : on reste sur l'état par défaut */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
    } catch {
      /* ignore */
    }
  }, [state, ready]);

  const account = useMemo(
    () =>
      demoAccounts.find((a) => a.id === state.accountId) ??
      state.customAccounts.find((a) => a.id === state.accountId) ??
      null,
    [state.accountId, state.customAccounts],
  );

  const can = useCallback(
    (permission: DemoPermission) =>
      account ? PERMISSIONS[account.role].includes(permission) : false,
    [account],
  );

  const value: DemoContextValue = {
    ready,
    account,
    role: account?.role ?? null,
    isBureau: account?.role === "bureau" || account?.role === "bureau_admin",
    can,
    signIn: (accountId) => setState((s) => ({ ...s, accountId })),
    signInWithCredentials: (email, password) => {
      const normalizedEmail = email.trim().toLowerCase();
      const allAccounts = [...demoAccounts, ...state.customAccounts];
      const found = allAccounts.find(
        (a) => a.email.toLowerCase() === normalizedEmail && a.password === password,
      );
      if (!found) return { ok: false, error: "Identifiants inconnus ou mot de passe incorrect." };
      setState((s) => ({ ...s, accountId: found.id }));
      return { ok: true };
    },
    signUp: ({ email, password, firstName, lastName, departement, niveau }) => {
      const normalizedEmail = email.trim().toLowerCase();
      const allAccounts = [...demoAccounts, ...state.customAccounts];
      if (allAccounts.some((a) => a.email.toLowerCase() === normalizedEmail)) {
        return { ok: false, error: "Un compte existe déjà avec cette adresse e-mail." };
      }
      const accountId = `acc-user-${Date.now()}`;
      const cardCode = generateRandom2026Code("USR");
      const today = new Date().toLocaleDateString("fr-FR");
      const newAccount: DemoAccount = {
        id: accountId,
        email: normalizedEmail,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: "membre",
        departement,
        niveau,
        contributionCents: 0,
        schoolYear: "2026-2027",
        membershipStatus: "EN_ATTENTE",
        contributionStatus: "NON_COTISANT",
        requestedAt: today,
        validatedAt: null,
        memberSince: null,
        cardCode,
        tickets: [],
        orders: [],
        emailPrefs: [],
      };
      // Auto-crée un dossier EN_ATTENTE pour que le bureau le voit
      const newDossier: Dossier = {
        id: `ADH-${new Date().getFullYear()}-${String(400 + Math.floor(Math.random() * 100))}`,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        phone: "",
        studentId: "",
        departement,
        niveau,
        contributionCents: 0,
        contributionStatus: "NON_COTISANT",
        emailPrefs: [],
        submittedAt: today,
        validatedAt: null,
        memberSince: null,
        status: "EN_ATTENTE",
        note: "Compte créé depuis le formulaire d'inscription.",
      };
      setState((s) => ({
        ...s,
        accountId: newAccount.id,
        customAccounts: [...(s.customAccounts ?? []), newAccount],
        dossiers: [newDossier, ...(s.dossiers ?? [])],
      }));
      return { ok: true };
    },
    signOut: () => setState((s) => ({ ...s, accountId: null })),
    dossiers: state.dossiers ?? [],
    addDossier: (newDossier) =>
      setState((s) => {
        const safeDossiers = s.dossiers ?? [];
        return {
          ...s,
          dossiers: [
            {
              ...newDossier,
              id: `ADH-${new Date().getFullYear()}-${String(315 + safeDossiers.length)}`,
              submittedAt: new Date().toLocaleDateString("fr-FR"),
              validatedAt: null,
              memberSince: null,
              status: "EN_ATTENTE",
              note: "",
            },
            ...safeDossiers,
          ],
        };
      }),
    updateDossier: (id, patch) =>
      setState((s) => ({
        ...s,
        dossiers: (s.dossiers ?? []).map((d) => (d.id === id ? { ...d, ...patch } : d)),
      })),
    candidatures: state.candidatures ?? [],
    addCandidature: (input) =>
      setState((s) => {
        const safeCands = s.candidatures ?? [];
        return {
          ...s,
          candidatures: [
            {
              ...input,
              id: `CAN-${new Date().getFullYear()}-${String(100 + safeCands.length)}`,
              submittedAt: new Date().toLocaleDateString("fr-FR"),
              status: "EN_ATTENTE" as const,
            },
            ...safeCands,
          ],
        };
      }),
    updateCandidature: (id, status) =>
      setState((s) => ({
        ...s,
        candidatures: (s.candidatures ?? []).map((c) => (c.id === id ? { ...c, status } : c)),
      })),
    messages: state.messages ?? [],
    addMessage: (input) =>
      setState((s) => {
        const safeMsgs = s.messages ?? [];
        return {
          ...s,
          messages: [
            {
              ...input,
              id: `MSG-${new Date().getFullYear()}-${String(100 + safeMsgs.length).padStart(3, "0")}`,
              sentAt: new Date().toLocaleDateString("fr-FR"),
              status: "NOUVEAU" as const,
            },
            ...safeMsgs,
          ],
        };
      }),
    updateMessageStatus: (id, status) =>
      setState((s) => ({
        ...s,
        messages: (s.messages ?? []).map((m) => (m.id === id ? { ...m, status } : m)),
      })),
    addTicket: (ticket) =>
      setState((s) => {
        const newTicket: DemoTicket = {
          ...ticket,
          id: `tk-user-${Date.now()}`,
        };
        const updatedCustomAccounts = s.customAccounts.map((a) =>
          a.id === s.accountId ? { ...a, tickets: [...a.tickets, newTicket] } : a,
        );
        return { ...s, customAccounts: updatedCustomAccounts };
      }),
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemoSession(): DemoContextValue {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemoSession doit être utilisé dans <DemoSessionProvider>");
  return ctx;
}

export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}
