import { createFileRoute } from "@tanstack/react-router";

import { LegalBlock, LegalMail, LegalPage, legalInfo } from "@/components/layout/legal-page";

export const Route = createFileRoute("/conditions-vente")({
  head: () => ({
    meta: [
      { title: "Conditions générales de vente — AE2V" },
      {
        name: "description",
        content:
          "CGV de l'AE2V : adhésions, billetterie et boutique, prix, paiement, retrait des commandes et droit de rétractation.",
      },
      { property: "og:title", content: "Conditions générales de vente — AE2V" },
      {
        property: "og:description",
        content: "Adhésions, billetterie et boutique : conditions de vente de l'AE2V.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/conditions-vente" },
    ],
    links: [{ rel: "canonical", href: "/conditions-vente" }],
  }),
  component: CgvPage,
});

function CgvPage() {
  return (
    <LegalPage
      eyebrow="Boutique & billetterie"
      title="Conditions de vente"
      intro="Règles applicables aux adhésions, aux billets d'événement et aux commandes boutique."
    >
      <LegalBlock title="1. Objet et vendeur">
        <p>
          Les présentes conditions régissent toute vente réalisée par {legalInfo.legalName} via ce
          site : cotisation d'adhésion, billetterie d'événements et produits de la boutique. Toute
          commande vaut acceptation des présentes.
        </p>
      </LegalBlock>

      <LegalBlock title="2. Produits et services">
        <ul className="space-y-1">
          <li>
            <strong>Adhésion</strong> : valable pour une année scolaire, nominative et non cessible.
          </li>
          <li>
            <strong>Billets</strong> : associés à un événement daté, à une place et le cas échéant à
            un tarif adhérent. Un billet est personnel et contrôlé à l'entrée.
          </li>
          <li>
            <strong>Boutique</strong> : produits proposés dans la limite des stocks disponibles,
            avec description, taille et prix affichés avant validation.
          </li>
        </ul>
      </LegalBlock>

      <LegalBlock title="3. Prix">
        <p>
          Les prix sont indiqués en euros toutes taxes comprises. Le montant total, incluant le
          détail de chaque ligne, est affiché avant la confirmation de commande. Les tarifs
          préférentiels sont réservés aux adhérents à jour de cotisation pour l'année en cours.
        </p>
      </LegalBlock>

      <LegalBlock title="4. Commande et paiement">
        <p>
          Le paiement s'effectue en ligne via un prestataire sécurisé. La commande n'est confirmée
          qu'après validation du paiement par ce prestataire : le total est systématiquement
          recalculé côté serveur. Un récapitulatif est ensuite disponible dans ton espace étudiant.
        </p>
      </LegalBlock>

      <LegalBlock title="5. Livraison et retrait">
        <p>
          Les produits boutique sont à retirer en main propre, sur les créneaux et lieux annoncés
          par le bureau (permanence, stand, événement). Aucun envoi postal n'est assuré, sauf
          mention contraire explicite sur la fiche produit. Les billets sont dématérialisés et
          disponibles dans ton espace étudiant.
        </p>
      </LegalBlock>

      <LegalBlock title="6. Droit de rétractation">
        <p>
          Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne
          s'applique pas aux prestations de loisirs fournies à une date déterminée : les billets
          d'événement ne sont donc pas rétractables. Pour les produits boutique, les conditions
          d'annulation et de remboursement sont détaillées sur la page{" "}
          <a className="ae2v-link font-bold text-ae2v-red" href="/remboursements">
            remboursements
          </a>
          .
        </p>
      </LegalBlock>

      <LegalBlock title="7. Annulation ou modification d'un événement">
        <p>
          En cas d'annulation à l'initiative de l'association, les billets sont remboursés
          intégralement. En cas de report, le billet reste valable pour la nouvelle date ; un
          remboursement peut être demandé si cette date ne convient pas.
        </p>
      </LegalBlock>

      <LegalBlock title="8. Règles de comportement">
        <p>
          L'accès aux événements peut être refusé ou interrompu en cas de non-respect du règlement
          intérieur, de la législation ou de la sécurité des participants, sans droit à
          remboursement.
        </p>
      </LegalBlock>

      <LegalBlock title="9. Réclamations et litiges">
        <p>
          Toute réclamation est à adresser à <LegalMail />. À défaut d'accord amiable, le litige
          relève des juridictions françaises compétentes. Un consommateur peut également recourir à
          la plateforme européenne de règlement en ligne des litiges.
        </p>
      </LegalBlock>
    </LegalPage>
  );
}
