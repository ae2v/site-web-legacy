/**
 * Pôles de l'AE2V — description publique, sans fait réel inventé.
 */
export type PoleInfo = {
  slug: string;
  name: string;
  mission: string;
};

export const poles: PoleInfo[] = [
  {
    slug: "direction",
    name: "Direction",
    mission:
      "Coordonne l'association, représente l'AE2V auprès de l'IUT et garantit le suivi des projets.",
  },
  {
    slug: "evenementiel",
    name: "Événementiel",
    mission:
      "Imagine et organise les soirées, le gala, les afterworks et les sorties de l'année.",
  },
  {
    slug: "communication",
    name: "Communication",
    mission:
      "Fait vivre l'identité AE2V : réseaux sociaux, affiches, annonces et couverture des events.",
  },
  {
    slug: "partenariats",
    name: "Partenariats",
    mission:
      "Négocie les avantages étudiants et construit les relations avec les partenaires locaux.",
  },
  {
    slug: "tresorerie",
    name: "Trésorerie",
    mission:
      "Suit le budget, les encaissements, les remboursements et la transparence financière.",
  },
];
