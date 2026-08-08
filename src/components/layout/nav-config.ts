/**
 * Navigation publique AE2V.
 * Une seule source de vérité pour l'en-tête, le menu mobile et le pied de page.
 */
export type NavItem = {
  to: string;
  label: string;
  description: string;
};

export const publicNav: NavItem[] = [
  { to: "/", label: "Accueil", description: "Page d'accueil de l'AE2V." },
  { to: "/bde", label: "Le BDE", description: "L'association, les pôles et l'équipe." },
  { to: "/evenements", label: "Événements", description: "Soirées, gala, afterworks et sorties." },
  { to: "/adherer", label: "Adhérer", description: "Rejoindre l'AE2V pour l'année en cours." },
  { to: "/boutique", label: "Boutique", description: "Goodies, textile et packs étudiants." },
];

export const accountNav: NavItem = {
  to: "/espace",
  label: "Mon espace",
  description: "Adhésion, billets et commandes.",
};

export const secondaryNav: NavItem[] = [
  { to: "/actualites", label: "Actualités", description: "Annonces et vie de l'association." },
  { to: "/contact", label: "Contact", description: "Écrire au bureau AE2V." },
];

export const legalNav = [
  { to: "/mentions-legales", label: "Mentions légales" },
  { to: "/confidentialite", label: "Confidentialité" },
  { to: "/conditions-vente", label: "CGV" },
  { to: "/remboursements", label: "Remboursements" },
] as const;

