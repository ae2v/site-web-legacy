/** Données publiques de l'équipe AE2V. */
import bastianPortrait from "@/assets/team/bastian-noel.png";
export type TeamPole =
  "Direction" | "Communication" | "Numérique" | "Finance" | "Événementiel" | "Partenarial";

export type TeamMember = {
  id: string;
  userId?: string | null;
  displayName: string;
  roleTitle: string;
  roleTitles: string[];
  officerRole: string | null;
  isOfficer: boolean;
  poles: TeamPole[];
  showDefaultPoleTitles: boolean;
  mandate: string;
  photoUrl: string | null;
  roleEmail: string | null;
  personalAe2vEmail: string | null;
  bio: string | null;
  isPlaceholder: boolean;
  publicVisible: boolean;
};

export const AE2V_EMAIL_DOMAIN = "@ae2v.fr";
const MANDATE = "2026–2027";

export const teamPoles: TeamPole[] = [
  "Direction",
  "Communication",
  "Numérique",
  "Finance",
  "Événementiel",
  "Partenarial",
];

export function defaultTitlesForPoles(poles: TeamPole[]): string[] {
  return poles.map((pole) => {
    if (pole === "Numérique") return "Chargé du numérique";
    if (pole === "Communication") return "Chargé de communication";
    if (pole === "Finance") return "Chargé de la finance";
    if (pole === "Événementiel") return "Chargé de l’événementiel";
    if (pole === "Partenarial") return "Chargé du partenarial";
    return "Membre de la direction";
  });
}

export function displayedTeamTitles(member: TeamMember): string[] {
  const custom = member.roleTitles.filter(
    (title) => title.trim().length > 0 && title.trim() !== "Membre du bureau",
  );
  // Les intitulés par pôle restent le filet de sécurité lorsqu'aucun titre
  // personnalisé n'existe. Ils ne peuvent être masqués qu'en présence d'au
  // moins un intitulé custom.
  if (custom.length && !member.showDefaultPoleTitles) return custom;
  if (custom.length) return custom;
  return defaultTitlesForPoles(member.poles);
}

function member(
  id: string,
  displayName: string,
  roleTitle: string,
  poles: TeamPole[],
  options: Partial<
    Pick<
      TeamMember,
      | "roleEmail"
      | "personalAe2vEmail"
      | "bio"
      | "photoUrl"
      | "roleTitles"
      | "officerRole"
      | "poles"
      | "showDefaultPoleTitles"
    >
  > = {},
): TeamMember {
  return {
    id,
    displayName,
    roleTitle,
    roleTitles: options.roleTitles ?? [roleTitle],
    officerRole:
      options.officerRole ??
      (["Président", "Vice-président", "Secrétaire", "Trésorière"].includes(roleTitle)
        ? roleTitle
        : null),
    isOfficer: ["Président", "Vice-président", "Secrétaire", "Trésorière"].includes(roleTitle),
    poles: options.poles ?? poles,
    showDefaultPoleTitles: options.showDefaultPoleTitles ?? true,
    mandate: MANDATE,
    photoUrl: options.photoUrl ?? null,
    roleEmail: options.roleEmail ?? null,
    personalAe2vEmail: options.personalAe2vEmail ?? null,
    bio: options.bio ?? null,
    isPlaceholder: options.photoUrl == null,
    publicVisible: true,
  };
}

export const teamMembers: TeamMember[] = [
  member("hey-tham-kortas", "Heytham KORTAS", "Président", ["Direction", "Partenarial"], {
    personalAe2vEmail: "heytham.kortas@ae2v.fr",
    roleEmail: "president@ae2v.fr",
  }),
  member("alexandre-mariette", "Alexandre MARIETTE", "Vice-président", ["Direction"], {
    personalAe2vEmail: "alexandre.mariette@ae2v.fr",
    roleEmail: "vice-president@ae2v.fr",
  }),
  member("carla-barruet", "Carla BARRUET", "Secrétaire", ["Direction"], {
    personalAe2vEmail: "carla.barruet@ae2v.fr",
    roleEmail: "secretaire@ae2v.fr",
  }),
  member("jaden-brival", "Jaden BRIVAL", "Trésorière", ["Finance", "Direction"], {
    personalAe2vEmail: "jaden.brival@ae2v.fr",
    roleEmail: "tresoriere@ae2v.fr",
  }),
  member(
    "bastian-noel",
    "Bastian NOËL",
    "Responsable de l’infrastructure numérique",
    ["Numérique", "Communication"],
    {
      roleTitles: ["Responsable de l’infrastructure numérique", "Webmaster adjoint"],
      showDefaultPoleTitles: false,
      personalAe2vEmail: "bastian.noel@ae2v.fr",
      photoUrl: bastianPortrait,
    },
  ),
  member("loan-jean", "Loan JEAN", "Responsable Web & Discord", ["Numérique", "Communication"], {
    personalAe2vEmail: "loan.jean@ae2v.fr",
  }),
  member("franck-manickam", "Franck MANICKAM", "Chargé de l’événementiel", ["Événementiel"], {
    personalAe2vEmail: "franck.manickam@ae2v.fr",
  }),
  member("selma-chadli", "Selma CHADLI", "Chargée de communication", ["Communication"], {
    personalAe2vEmail: "selma.chadli@ae2v.fr",
  }),
  member(
    "mathis-laporte-kouassi",
    "Mathis LAPORTE KOUASSI",
    "Chargé de communication",
    ["Communication"],
    { personalAe2vEmail: "mathis.laporte.kouassi@ae2v.fr" },
  ),
  member("yasmine-lachheb", "Yasmine LACHHEB", "Chargée de communication", ["Communication"], {
    personalAe2vEmail: "yasmine.lacheb@ae2v.fr",
  }),
  member(
    "gaelle-rasolomanana",
    "Gaelle RASOLOMANANA",
    "Chargée de communication",
    ["Communication"],
    {
      personalAe2vEmail: "gaelle.rasolomanana@ae2v.fr",
    },
  ),
  member("julline-azer", "Julline AZER", "Chargée de communication", ["Communication"], {
    personalAe2vEmail: "julline.azer@ae2v.fr",
  }),
  member("zohra-sekkal", "Zohra SEKKAL", "Membre du bureau", [], {
    personalAe2vEmail: "zohra.sekkal@ae2v.fr",
  }),
  member("matteo-cakarun", "Matteo CAKARUN", "Membre du bureau", [], {
    personalAe2vEmail: "matteo.cakarun@ae2v.fr",
  }),
];

export function memberEmails(member: TeamMember) {
  const valid = (value: string | null) =>
    value?.trim().toLowerCase().endsWith(AE2V_EMAIL_DOMAIN) ? value.trim().toLowerCase() : null;
  const role = valid(member.roleEmail);
  const personal = valid(member.personalAe2vEmail);
  return { role, personal, any: Boolean(role || personal) };
}

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

export function membersByPole(members: TeamMember[] = teamMembers) {
  return teamPoles
    .map((pole) => ({
      pole,
      members: members.filter((member) => member.poles.includes(pole)),
    }))
    .filter((group) => group.members.length > 0);
}
