import { createFileRoute, Link } from "@tanstack/react-router";

import { ProductGrid } from "@/components/boutique/product-grid";
import { PageHero } from "@/components/layout/page-hero";
import { FaqList, HardCard, Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { HELLOASSO_SHOP_URL } from "@/data/shop";

export const Route = createFileRoute("/boutique")({
  head: () => ({
    meta: [
      { title: "Boutique AE2V — Textile et goodies étudiants" },
      {
        name: "description",
        content:
          "Sweats, t-shirts, goodies et packs aux couleurs de l'AE2V, avec tarif cotisant et retrait sur le campus de Vélizy.",
      },
      { property: "og:title", content: "Boutique AE2V" },
      {
        property: "og:description",
        content: "Textile, goodies et packs étudiants aux couleurs de l'AE2V.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/boutique" },
    ],
    links: [{ rel: "canonical", href: "/boutique" }],
  }),
  component: BoutiquePage,
});

function BoutiquePage() {
  return (
    <>
      <PageHero
        eyebrow="Merch officiel"
        title="Boutique"
        intro="Textile, goodies et packs aux couleurs de l'AE2V : tarif cotisant, retrait sur le campus."
      />

      <Section
        number={1}
        ghost="SHOP"
        title="Le catalogue"
        intro="Cette page est un aperçu du catalogue : elle présente les visuels, les tailles et les tarifs. La commande et le paiement se font ensuite sur la boutique officielle HelloAsso de l'AE2V."
      >
        <ProductGrid />

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <a href={HELLOASSO_SHOP_URL} target="_blank" rel="noopener noreferrer">
              Commander sur HelloAsso
            </a>
          </Button>
          <Button asChild size="lg" variant="black">
            <Link to="/adherer">Débloquer le tarif cotisant</Link>
          </Button>
        </div>
      </Section>

      <Section
        number={2}
        ghost="RETRAIT"
        title="Commander et retirer"
        tone="dark"
        intro="Aucun envoi postal : le paiement passe par HelloAsso, le retrait se fait en main propre sur le campus."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <HardCard eyebrow="01" title="Repère ton article ici" tone="dark" interactive={false}>
            La page Boutique sert d'aperçu : photo, tailles, prix cotisant et prix public. Rien
            n'est encaissé sur ce site.
          </HardCard>
          <HardCard eyebrow="02" title="Paie sur HelloAsso" tone="dark" interactive={false}>
            Le clic sur un article ouvre la boutique officielle HelloAsso de l'AE2V, qui gère le
            panier, le paiement sécurisé et le reçu.
          </HardCard>
          <HardCard eyebrow="03" title="Retire quand tu veux" tone="dark" interactive={false}>
            Retrait permanent sur le campus de Vélizy auprès du bureau, pendant les permanences ou
            les événements annoncés. Munis-toi de ta confirmation HelloAsso.
          </HardCard>
        </div>
      </Section>

      <Section number={3} ghost="INFOS" title="Bon à savoir">
        <FaqList
          items={[
            {
              q: "Comment sont fixés les prix ?",
              a: "Au coût réel majoré d'une marge réinvestie dans les événements. Le prix cotisant est systématiquement affiché à côté du prix public.",
            },
            {
              q: "Que faire si ma taille n'est plus disponible ?",
              a: "Le stock est indiqué produit par produit. Les réassorts sont annoncés par le bureau selon les commandes groupées.",
            },
            {
              q: "Un produit est défectueux, que faire ?",
              a: (
                <>
                  Signale-le sous 14 jours après le retrait : conditions d'échange et de
                  remboursement sur la page{" "}
                  <Link className="ae2v-link font-bold text-ae2v-red" to="/remboursements">
                    remboursements
                  </Link>
                  .
                </>
              ),
            },
          ]}
        />
      </Section>
    </>
  );
}
