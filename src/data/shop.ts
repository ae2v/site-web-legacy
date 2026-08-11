import hoodieNoir from "@/assets/shop/hoodie-noir.jpg";
import sweatRouge from "@/assets/shop/sweat-rouge.jpg";
import toteBag from "@/assets/shop/tote-bag.jpg";
import tshirtBlanc from "@/assets/shop/tshirt-blanc.jpg";

/** Boutique officielle AE2V (HelloAsso) — tous les articles y renvoient. */
export const HELLOASSO_SHOP_URL =
  "https://www.helloasso.com/associations/ae2v/boutiques/pulls-de-formation";

export type ShopProduct = {
  id: string;
  name: string;
  tagline: string;
  helloAssoUrl?: string;
  /** Champs de compatibilité utilisés par la gestion minimale du catalogue. */
  category?: string;
  priceCents?: number;
  description?: string;
  stock?: number;
  slug?: string;
  status?: "DISPONIBLE" | "EPUISE";
  /** Prix en centimes (entiers). */
  priceMember: number;
  pricePublic: number;
  sizes: string[];
  image: string;
  badge?: string;
  /** Article de démonstration : visuel et tarif indicatifs. */
  isDemo?: boolean;
};

const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export function formatPrice(cents: number) {
  return eur.format(cents / 100);
}

export const shopProducts: ShopProduct[] = [
  {
    id: "pull-formation-rouge",
    name: "Pull de formation rouge",
    tagline: "Sweat col rond molletonné, broderie promo et formation au dos.",
    priceMember: 2900,
    pricePublic: 3500,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    image: sweatRouge,
    badge: "Best-seller",
    isDemo: true,
  },
  {
    id: "hoodie-noir",
    name: "Hoodie AE2V noir",
    tagline: "Capuche doublée, poche kangourou, coton lourd 300 g/m².",
    priceMember: 3400,
    pricePublic: 4000,
    sizes: ["S", "M", "L", "XL"],
    image: hoodieNoir,
    isDemo: true,
  },
  {
    id: "tshirt-ecru",
    name: "T-shirt écru sérigraphié",
    tagline: "Coton bio, coupe droite unisexe, marquage AE2V poitrine.",
    priceMember: 1500,
    pricePublic: 1900,
    sizes: ["XS", "S", "M", "L", "XL"],
    image: tshirtBlanc,
    badge: "Coton bio",
    isDemo: true,
  },
  {
    id: "tote-bag",
    name: "Tote bag toile naturelle",
    tagline: "Toile épaisse, anses longues, format A4 pour les cours.",
    priceMember: 800,
    pricePublic: 1200,
    sizes: ["Taille unique"],
    image: toteBag,
    isDemo: true,
  },
];
