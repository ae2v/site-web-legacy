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
  { to: "/bde", label: "Le BDE", description: "L'association, ses actions et son équipe." },
  { to: "/evenements", label: "Événements", description: "Soirées, gala, afterworks et sorties." },
];

export const secondaryNav: NavItem[] = [
  { to: "/contact", label: "Contact", description: "Écrire au bureau AE2V." },
];

export const legalNav = [
  { to: "/mentions-legales", label: "Mentions légales" },
  { to: "/confidentialite", label: "Confidentialité" },
] as const;
