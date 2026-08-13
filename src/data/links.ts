/**
 * Liens officiels AE2V mis en avant sur le site.
 * Aucune URL n'est inventée : un lien inconnu reste `href: null` et s'affiche
 * comme « à venir » plutôt que de pointer vers une adresse hasardeuse.
 */
export type Ae2vLink = {
  id: string;
  label: string;
  detail: string;
  href: string | null;
  /** Mention affichée quand le lien n'est pas encore actif. */
  status?: string;
  external?: boolean;
  icon: "discord" | "instagram" | "facebook" | "mail" | "globe";
};

export const ae2vLinks: Ae2vLink[] = [
  {
    id: "discord",
    label: "Discord",
    detail: "Rejoins la communauté AE2V",
    href: "https://discord.gg/z85wnSmdnH",
    external: true,
    icon: "discord",
  },
  {
    id: "instagram",
    label: "Instagram",
    detail: "@bde.velizy",
    href: "https://www.instagram.com/bde.velizy/",
    external: true,
    icon: "instagram",
  },
  {
    id: "facebook",
    label: "Facebook",
    detail: "AE2 Vélizy",
    href: "https://www.facebook.com/Ae2velizy",
    external: true,
    icon: "facebook",
  },
  {
    id: "mail",
    label: "Nous écrire",
    detail: "contact@ae2v.fr",
    href: "mailto:contact@ae2v.fr",
    icon: "mail",
  },
  {
    id: "site",
    label: "Site officiel",
    detail: "ae2v.fr",
    href: "/",
    icon: "globe",
  },
];
