/**
 * Données équipe AE2V.
 *
 * RÈGLES (docs/ae2v/03 + 05) :
 * - les adresses sont explicites, nullables, et doivent finir par `@ae2v.fr` ;
 * - aucune adresse personnelle / d'authentification n'est jamais affichée ;
 * - aucune adresse n'est déduite du nom.
 *
 * Deux adresses possibles par fiche :
 * - `roleEmail`     : adresse de FONCTION (statut officiel : présidence, trésorerie…) ;
 * - `personalAe2vEmail` : adresse NOMINATIVE AE2V de la personne.
 * Les deux s'affichent quand elles existent toutes les deux.
 *
 * ⚠️ Les entrées ci-dessous sont des DONNÉES DE DÉMONSTRATION (`isDemo: true`) :
 * noms fictifs et portraits générés (visages inexistants). Elles servent à
 * valider la maquette en attendant la saisie réelle depuis /bureau/equipe.
 */

import member1 from "@/assets/team/member-1.jpg.asset.json";
import member2 from "@/assets/team/member-2.jpg.asset.json";
import member3 from "@/assets/team/member-3.jpg.asset.json";
import member4 from "@/assets/team/member-4.jpg.asset.json";
import member5 from "@/assets/team/member-5.jpg.asset.json";
import member6 from "@/assets/team/member-6.jpg.asset.json";
import member7 from "@/assets/team/member-7.jpg.asset.json";
import member8 from "@/assets/team/member-8.jpg.asset.json";
import member9 from "@/assets/team/member-9.jpg.asset.json";
import member10 from "@/assets/team/member-10.jpg.asset.json";
import member11 from "@/assets/team/member-11.jpg.asset.json";

export type TeamPole =
  | "Direction"
  | "Événementiel"
  | "Communication"
  | "Partenariats"
  | "Trésorerie";

export type TeamMember = {
  id: string;
  displayName: string;
  /** Titre d'affichage public (≠ rôle de sécurité). */
  roleTitle: string;
  /** Statut officiel du bureau (rôle essentiel) ; null pour les membres de pôle. */
  isOfficer: boolean;
  pole: TeamPole;
  /** Année de mandat, ex. "2026–2027". */
  mandate: string;
  /** Portrait public ; null → repli graphique AE2V. */
  photoUrl: string | null;
  /** Adresse de fonction (statut), uniquement si elle existe réellement. */
  roleEmail: string | null;
  /** Adresse nominative AE2V de la personne, uniquement si elle existe réellement. */
  personalAe2vEmail: string | null;
  /** Bio courte facultative. */
  bio: string | null;
  /** Fiche fictive de démonstration (nom + portrait générés). */
  isDemo: boolean;
  isPlaceholder: boolean;
};

export const AE2V_EMAIL_DOMAIN = "@ae2v.fr";

function safeEmail(value: string | null | undefined): string | null {
  const email = value?.trim().toLowerCase();
  if (!email) return null;
  return email.endsWith(AE2V_EMAIL_DOMAIN) ? email : null;
}

/** Garde-fou : n'affiche que des adresses réellement saisies et du domaine AE2V. */
export function memberEmails(member: TeamMember): {
  role: string | null;
  personal: string | null;
  any: boolean;
} {
  const role = safeEmail(member.roleEmail);
  const personal = safeEmail(member.personalAe2vEmail);
  return { role, personal, any: Boolean(role || personal) };
}

/** Adresse à privilégier pour un bouton « écrire » unique. */
export function primaryEmail(member: TeamMember): string | null {
  const { role, personal } = memberEmails(member);
  return role ?? personal;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export const teamPoles: TeamPole[] = [
  "Direction",
  "Événementiel",
  "Communication",
  "Partenariats",
  "Trésorerie",
];

const MANDATE = "2026–2027";

export const teamMembers: TeamMember[] = [
  /* --- Rôles essentiels (statut + fonction) --- */
  {
    id: "presidence",
    displayName: "Camille Rousseau",
    roleTitle: "Présidente",
    isOfficer: true,
    pole: "Direction",
    mandate: MANDATE,
    photoUrl: member1.url,
    roleEmail: "presidence@ae2v.fr",
    personalAe2vEmail: "camille.rousseau@ae2v.fr",
    bio: "Coordonne le bureau, représente l'association et pilote les projets de l'année.",
    isDemo: true,
    isPlaceholder: false,
  },
  {
    id: "vice-presidence",
    displayName: "Malik Bertrand",
    roleTitle: "Vice-président",
    isOfficer: true,
    pole: "Direction",
    mandate: MANDATE,
    photoUrl: member2.url,
    roleEmail: "vice-presidence@ae2v.fr",
    personalAe2vEmail: "malik.bertrand@ae2v.fr",
    bio: "Appuie la présidence sur le suivi des pôles et la vie quotidienne de l'asso.",
    isDemo: true,
    isPlaceholder: false,
  },
  {
    id: "secretariat",
    displayName: "Awa Diallo",
    roleTitle: "Secrétaire générale",
    isOfficer: true,
    pole: "Direction",
    mandate: MANDATE,
    photoUrl: member3.url,
    roleEmail: "secretariat@ae2v.fr",
    personalAe2vEmail: "awa.diallo@ae2v.fr",
    bio: "Comptes rendus, adhésions, archives et relation avec l'administration.",
    isDemo: true,
    isPlaceholder: false,
  },
  {
    id: "tresorerie",
    displayName: "Thomas Lemoine",
    roleTitle: "Trésorier",
    isOfficer: true,
    pole: "Trésorerie",
    mandate: MANDATE,
    photoUrl: member4.url,
    roleEmail: "tresorerie@ae2v.fr",
    personalAe2vEmail: "thomas.lemoine@ae2v.fr",
    bio: "Budget, encaissements, remboursements et transparence des comptes.",
    isDemo: true,
    isPlaceholder: false,
  },

  /* --- Membres de pôle (sans statut de bureau) --- */
  {
    id: "event-lea",
    displayName: "Léa Marchand",
    roleTitle: "Membre du pôle",
    isOfficer: false,
    pole: "Événementiel",
    mandate: MANDATE,
    photoUrl: member5.url,
    roleEmail: null,
    personalAe2vEmail: "lea.marchand@ae2v.fr",
    bio: "Programmation des soirées et des temps forts du campus.",
    isDemo: true,
    isPlaceholder: false,
  },
  {
    id: "event-noe",
    displayName: "Noé Fabre",
    roleTitle: "Membre du pôle",
    isOfficer: false,
    pole: "Événementiel",
    mandate: MANDATE,
    photoUrl: member8.url,
    roleEmail: null,
    personalAe2vEmail: "noe.fabre@ae2v.fr",
    bio: "Logistique, matériel et installation sur site.",
    isDemo: true,
    isPlaceholder: false,
  },
  {
    id: "event-ines",
    displayName: "Inès Chevalier",
    roleTitle: "Membre du pôle",
    isOfficer: false,
    pole: "Événementiel",
    mandate: MANDATE,
    photoUrl: member9.url,
    roleEmail: null,
    personalAe2vEmail: "ines.chevalier@ae2v.fr",
    bio: "Accueil, billetterie et check-in des participants.",
    isDemo: true,
    isPlaceholder: false,
  },
  {
    id: "com-mei",
    displayName: "Mei Tanaka",
    roleTitle: "Membre du pôle",
    isOfficer: false,
    pole: "Communication",
    mandate: MANDATE,
    photoUrl: member7.url,
    roleEmail: null,
    personalAe2vEmail: "mei.tanaka@ae2v.fr",
    bio: "Identité visuelle et création des supports AE2V.",
    isDemo: true,
    isPlaceholder: false,
  },
  {
    id: "com-sofiane",
    displayName: "Sofiane Traoré",
    roleTitle: "Membre du pôle",
    isOfficer: false,
    pole: "Communication",
    mandate: MANDATE,
    photoUrl: member10.url,
    roleEmail: null,
    personalAe2vEmail: "sofiane.traore@ae2v.fr",
    bio: "Réseaux sociaux, photo et couverture des événements.",
    isDemo: true,
    isPlaceholder: false,
  },
  {
    id: "partenariats-yanis",
    displayName: "Yanis Belkacem",
    roleTitle: "Membre du pôle",
    isOfficer: false,
    pole: "Partenariats",
    mandate: MANDATE,
    photoUrl: member6.url,
    roleEmail: null,
    personalAe2vEmail: "yanis.belkacem@ae2v.fr",
    bio: "Prospection des commerces et suivi des réductions étudiantes.",
    isDemo: true,
    isPlaceholder: false,
  },
  {
    id: "partenariats-jade",
    displayName: "Jade Nguyen",
    roleTitle: "Membre du pôle",
    isOfficer: false,
    pole: "Partenariats",
    mandate: MANDATE,
    photoUrl: member11.url,
    roleEmail: null,
    personalAe2vEmail: "jade.nguyen@ae2v.fr",
    bio: "Relations partenaires et suivi des conventions.",
    isDemo: true,
    isPlaceholder: false,
  },
];

/** Membres regroupés par pôle, dans l'ordre officiel des pôles. */
export function membersByPole(members: TeamMember[] = teamMembers) {
  return teamPoles
    .map((pole) => ({ pole, members: members.filter((m) => m.pole === pole) }))
    .filter((group) => group.members.length > 0);
}
