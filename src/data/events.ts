/**
 * Événements publiés par l'AE2V.
 */

import afterworkImg from "@/assets/events/afterwork.jpg";
import galaImg from "@/assets/events/gala.jpg";
import soireeImg from "@/assets/events/soiree-integration.jpg";
import tournoiImg from "@/assets/events/tournoi-esport.jpg";
import weekendImg from "@/assets/events/weekend.jpg";

export type EventStatus = "NON_PUBLIE" | "OUVERT" | "BIENTOT" | "COMPLET" | "TERMINE";

export type EventTier = {
  id: string;
  label: string;
  priceCents: number;
  /** Audience autorisée pour ce tarif. */
  audience: "adherent" | "public" | "bureau";
  note?: string;
  disabled?: boolean;
  isMandatory?: boolean;
  /** Tarif système public/adhérent/bureau, désactivable mais non supprimable. */
  system?: boolean;
};

export type EventProgramStep = {
  time: string;
  label: string;
  detail?: string;
};

export type EventCustomSection = {
  title: string;
  body: string;
};

export type Ae2vEvent = {
  id: string;
  /** Identifiant interne éventuel utilisé par une source distante. */
  serverId?: string;
  title: string;
  kind: string;
  date: string;
  isoDate: string;
  doors: string;
  place: string;
  address: string;
  summary: string;
  description: string;
  /** Visuel public de l'événement. */
  image: string;
  /** Déroulé indicatif de la journée / soirée. */
  program: EventProgramStep[];
  /** Comment venir (transports, accès). */
  access: string;
  /** Informations pratiques complémentaires. */
  practical: string[];
  /** Sections éditoriales facultatives affichées sur la page publique. */
  customSections?: EventCustomSection[];
  capacity: number;
  registered: number;
  registrationOpensAt: string;
  registrationClosesAt: string;
  status: EventStatus;
  waitlist: boolean;
  tiers: EventTier[];
};

export type PublicEventRecord = {
  id: string;
  serverId: string;
  title: string;
  slug: string;
  kind: string;
  date: string;
  doors: string;
  place: string;
  address: string;
  summary: string;
  capacity: number;
  registered: number;
  status: EventStatus;
  waitlist: boolean;
  description: string;
  image: string | null;
  registrationOpensAt: string | null;
  registrationClosesAt: string;
  program?: EventProgramStep[];
  access?: string | null;
  practical?: string[];
  customSections?: EventCustomSection[];
  tiers: EventTier[];
};

/**
 * Normalise les anciennes fiches d’événement avant affichage ou inscription.
 * Les tarifs système public/cotisant/bureau sont toujours présents, peuvent
 * être désactivés, mais ne sont jamais supprimables. L’ancien tarif « compte
 * étudiant » est explicitement retiré.
 */
export function normalizeEventTiers(input: EventTier[] | null | undefined): EventTier[] {
  const source = Array.isArray(input) ? input : [];
  const allowedAudiences = new Set<EventTier["audience"]>(["public", "adherent", "bureau"]);
  const cleaned = source.filter((tier) => {
    if (!allowedAudiences.has(tier.audience)) return false;
    return !/compte\s+étudiant/i.test(tier.label);
  });
  const defaults: Array<Pick<EventTier, "id" | "label" | "audience">> = [
    { id: "public", label: "Tarif public", audience: "public" },
    { id: "adherent", label: "Tarif cotisant", audience: "adherent" },
    { id: "bureau", label: "Tarif membre du bureau", audience: "bureau" },
  ];
  const legacySystemIds = new Set(["public", "pub", "adherent", "adh", "bureau", "staff"]);
  const systemSourceIds = new Set<string>();
  const result = defaults.map((fallback) => {
    const existing = cleaned.find(
      (tier) =>
        (tier.system === true ||
          legacySystemIds.has(tier.id) ||
          tier.label.trim().toLowerCase() === fallback.label.toLowerCase()) &&
        tier.audience === fallback.audience,
    );
    if (existing) systemSourceIds.add(existing.id);
    return {
      ...(existing ?? { priceCents: 0, disabled: false }),
      id: fallback.id,
      label: fallback.label,
      audience: fallback.audience,
      system: true,
      isMandatory: true,
    } satisfies EventTier;
  });
  const custom = cleaned.filter((tier) => !systemSourceIds.has(tier.id) && !tier.system);
  return [...result, ...custom];
}

export function publicRecordToEvent(record: PublicEventRecord): Ae2vEvent {
  return {
    id: record.slug,
    serverId: record.serverId,
    title: record.title,
    kind: record.kind,
    date: record.date,
    isoDate: record.date,
    doors: record.doors,
    place: record.place,
    address: record.address,
    summary: record.summary,
    description: record.description,
    image: record.image && !record.image.startsWith("/images/") ? record.image : "",
    access: record.access ?? "Informations d’accès communiquées par le BDE.",
    practical: record.practical ?? [],
    customSections: record.customSections ?? [],
    program: record.program ?? [],
    capacity: record.capacity,
    registered: record.registered,
    registrationOpensAt: record.registrationOpensAt ?? "",
    registrationClosesAt: record.registrationClosesAt,
    status: record.status,
    waitlist: record.waitlist,
    tiers: normalizeEventTiers(record.tiers),
  };
}

const catalogEvents: Ae2vEvent[] = [
  {
    id: "soiree-integration",
    title: "Soirée d'intégration",
    kind: "Soirée",
    date: "Jeudi 24 septembre 2026",
    isoDate: "2026-09-24T21:00",
    doors: "21h00 — 03h00",
    place: "Le Hangar",
    address: "Vélizy-Villacoublay",
    summary: "Le premier gros rendez-vous de l'année pour toutes les promos.",
    description:
      "Rencontre des promos, DJ set, vestiaire et navette retour. Entrée sur billet nominatif avec QR code présenté à l'entrée.",
    image: soireeImg,
    program: [
      {
        time: "21h00",
        label: "Ouverture des portes",
        detail: "Contrôle des billets et vestiaire.",
      },
      { time: "21h30", label: "Warm-up", detail: "Set d'ouverture par le pôle événementiel." },
      { time: "23h00", label: "DJ set principal" },
      { time: "02h30", label: "Dernier service" },
      { time: "03h00", label: "Fermeture", detail: "Navette retour vers le campus." },
    ],
    access: "Bus 379 arrêt Louvois, puis 5 minutes à pied. Parking gratuit sur place.",
    practical: [
      "Pièce d'identité obligatoire à l'entrée.",
      "Billet nominatif : le QR code n'est valable qu'une fois.",
      "Vestiaire inclus dans le prix du billet.",
    ],
    capacity: 400,
    registered: 356,
    registrationOpensAt: "01/09/2026",
    registrationClosesAt: "23/09/2026",
    status: "OUVERT",
    waitlist: true,
    tiers: [
      { id: "adh", label: "Tarif cotisant", priceCents: 800, audience: "adherent" },
      { id: "pub", label: "Tarif public", priceCents: 1500, audience: "public" },
      {
        id: "staff",
        label: "Bénévole bureau",
        priceCents: 0,
        audience: "bureau",
        note: "Créneau de tenue de poste obligatoire.",
      },
    ],
  },
  {
    id: "afterwork-octobre",
    title: "Afterwork d'octobre",
    kind: "Afterwork",
    date: "Jeudi 15 octobre 2026",
    isoDate: "2026-10-15T18:30",
    doors: "18h30 — 22h00",
    place: "Café des Arcades",
    address: "Vélizy 2",
    summary: "Format court en semaine, entre les cours et la maison.",
    description:
      "Une conso offerte aux adhérents, tables réservées pour l'AE2V. Inscription utile pour dimensionner la réservation.",
    image: afterworkImg,
    program: [
      { time: "18h30", label: "Accueil", detail: "Tables réservées au nom de l'AE2V." },
      { time: "19h00", label: "Conso offerte aux adhérents" },
      { time: "20h30", label: "Quiz de la promo" },
      { time: "22h00", label: "Fin du créneau réservé" },
    ],
    access: "Centre commercial Vélizy 2, niveau restauration. Tramway T6 arrêt Vélizy 2.",
    practical: [
      "Inscription gratuite pour les adhérents cotisants.",
      "Aucune obligation de consommation d'alcool.",
    ],
    capacity: 80,
    registered: 41,
    registrationOpensAt: "20/09/2026",
    registrationClosesAt: "14/10/2026",
    status: "OUVERT",
    waitlist: false,
    tiers: [
      { id: "adh", label: "Tarif cotisant", priceCents: 0, audience: "adherent" },
      { id: "pub", label: "Tarif public", priceCents: 700, audience: "public" },
    ],
  },
  {
    id: "tournoi-esport",
    title: "Tournoi e-sport",
    kind: "Tournoi",
    date: "Mercredi 14 octobre 2026",
    isoDate: "2026-10-14T14:00",
    doors: "14h00 — 20h00",
    place: "Amphi B",
    address: "IUT de Vélizy",
    summary: "Équipes de 5, arbitrage assuré par le pôle événementiel.",
    description:
      "Inscription par équipe. Les places sont attribuées dans l'ordre d'arrivée, la liste d'attente est ouverte dès que la jauge est atteinte.",
    image: tournoiImg,
    program: [
      { time: "14h00", label: "Check-in des équipes" },
      { time: "14h30", label: "Phase de poules" },
      { time: "17h30", label: "Demi-finales" },
      { time: "19h00", label: "Finale et remise des lots" },
    ],
    access: "IUT de Vélizy, bâtiment principal, amphi B. Accès par l'entrée étudiants.",
    practical: [
      "Périphériques personnels autorisés (clavier, souris, casque).",
      "Une inscription par joueur, l'équipe est constituée au check-in.",
    ],
    capacity: 60,
    registered: 60,
    registrationOpensAt: "25/09/2026",
    registrationClosesAt: "13/10/2026",
    status: "COMPLET",
    waitlist: true,
    tiers: [{ id: "adh", label: "Tarif cotisant", priceCents: 0, audience: "adherent" }],
  },
  {
    id: "gala",
    title: "Gala de fin d'année",
    kind: "Gala",
    date: "Vendredi 12 juin 2027",
    isoDate: "2027-06-12T19:30",
    doors: "19h30 — 04h00",
    place: "Salle Ravel",
    address: "Vélizy-Villacoublay",
    summary: "Le grand rendez-vous annuel : dîner, remise des diplômes, soirée.",
    description:
      "Billetterie ouverte plus tard dans l'année. Tarif dégressif pour les adhérents et possibilité d'inviter un accompagnant.",
    image: galaImg,
    program: [
      { time: "19h30", label: "Cocktail d'accueil" },
      { time: "20h30", label: "Dîner assis" },
      { time: "22h00", label: "Remise des diplômes" },
      { time: "23h00", label: "Soirée dansante" },
    ],
    access: "Salle Ravel, Vélizy-Villacoublay. Navette retour prévue en fin de soirée.",
    practical: [
      "Tenue de soirée souhaitée.",
      "Un accompagnant par membre, au tarif public.",
      "Choix du menu demandé à l'inscription.",
    ],
    capacity: 300,
    registered: 0,
    registrationOpensAt: "02/03/2027",
    registrationClosesAt: "05/06/2027",
    status: "BIENTOT",
    waitlist: false,
    tiers: [
      { id: "adh", label: "Tarif cotisant", priceCents: 2500, audience: "adherent" },
      { id: "pub", label: "Tarif public / accompagnant", priceCents: 4000, audience: "public" },
    ],
  },
  {
    id: "weekend-integration",
    title: "Week-end d'intégration",
    kind: "Sortie",
    date: "Samedi 5 septembre 2026",
    isoDate: "2026-09-05T09:00",
    doors: "Départ 09h00",
    place: "Base de loisirs",
    address: "Saint-Quentin-en-Yvelines",
    summary: "Édition passée : archivée pour l'historique.",
    description: "L'événement est terminé. Les billets associés apparaissent comme utilisés.",
    image: weekendImg,
    program: [
      { time: "09h00", label: "Départ du campus" },
      { time: "11h00", label: "Activités par équipes" },
      { time: "13h00", label: "Déjeuner sur place" },
      { time: "18h00", label: "Retour" },
    ],
    access: "Départ en car depuis le parking de l'IUT.",
    practical: ["Événement terminé : les billets apparaissent comme utilisés."],
    capacity: 120,
    registered: 118,
    registrationOpensAt: "01/07/2026",
    registrationClosesAt: "30/08/2026",
    status: "TERMINE",
    waitlist: false,
    tiers: [{ id: "adh", label: "Tarif cotisant", priceCents: 3500, audience: "adherent" }],
  },
];

const integrationEvent = catalogEvents.find((event) => event.id === "soiree-integration");

export const publicEvents: Ae2vEvent[] = integrationEvent
  ? [
      {
        ...integrationEvent,
        date: "Après la rentrée",
        isoDate: "",
        doors: "",
        place: "",
        address: "",
        summary: "Quelque chose se prépare pour commencer l'année ensemble.",
        description: "Une première rencontre se prépare. Les détails seront révélés prochainement sur nos canaux officiels.",
        capacity: 0,
        registered: 0,
        registrationOpensAt: "",
        registrationClosesAt: "",
        status: "BIENTOT",
        waitlist: false,
        tiers: [],
      },
    ]
  : [];

export const eventStatusLabels: Record<EventStatus, string> = {
  NON_PUBLIE: "Brouillon / Non publié",
  OUVERT: "Inscriptions ouvertes",
  BIENTOT: "À venir",
  COMPLET: "Complet",
  TERMINE: "Terminé / Archivé",
};

export function findEvent(id: string): Ae2vEvent | undefined {
  return publicEvents.find((e) => e.id === id);
}
