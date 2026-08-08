import { createFileRoute } from "@tanstack/react-router";

import { LegalBlock, LegalMail, LegalPage } from "@/components/layout/legal-page";

export const Route = createFileRoute("/remboursements")({
  head: () => ({
    meta: [
      { title: "Politique de remboursement — AE2V" },
      {
        name: "description",
        content:
          "Conditions d'annulation et de remboursement des adhésions, billets d'événement et commandes boutique de l'AE2V.",
      },
      { property: "og:title", content: "Politique de remboursement — AE2V" },
      {
        property: "og:description",
        content: "Annulations et remboursements : adhésions, billets et boutique AE2V.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/remboursements" },
    ],
    links: [{ rel: "canonical", href: "/remboursements" }],
  }),
  component: RemboursementsPage,
});

function RemboursementsPage() {
  return (
    <LegalPage
      eyebrow="Paiements"
      title="Remboursements"
      intro="Dans quels cas un remboursement est possible, et comment le demander."
    >
      <LegalBlock title="1. Adhésion">
        <p>
          La cotisation d'adhésion soutient le fonctionnement de l'association et n'est pas
          remboursable une fois validée, sauf erreur manifeste de facturation (double paiement,
          montant erroné) ou refus d'adhésion par le bureau.
        </p>
      </LegalBlock>

      <LegalBlock title="2. Billets d'événement">
        <ul className="space-y-1">
          <li>
            <strong>Annulation par l'AE2V</strong> : remboursement intégral, automatique, sans
            démarche de ta part.
          </li>
          <li>
            <strong>Report de l'événement</strong> : billet valable à la nouvelle date, ou
            remboursement sur demande avant celle-ci.
          </li>
          <li>
            <strong>Annulation par le participant</strong> : possible jusqu'à 48 h avant
            l'événement, hors événements expressément indiqués comme non remboursables. Passé ce
            délai, le billet reste dû (places et prestations déjà engagées).
          </li>
          <li>
            <strong>Cas de force majeure ou situation exceptionnelle</strong> : étudié par le bureau
            au cas par cas, sur justificatif.
          </li>
        </ul>
      </LegalBlock>

      <LegalBlock title="3. Boutique">
        <p>
          Un produit non retiré peut être annulé et remboursé tant qu'il n'a pas été personnalisé ni
          remis. Un produit défectueux ou non conforme est échangé ou remboursé sur signalement dans
          les 14 jours suivant le retrait. Les produits personnalisés (taille, nom, floquage) ne sont
          ni repris ni échangés, sauf défaut.
        </p>
      </LegalBlock>

      <LegalBlock title="4. Comment demander un remboursement">
        <p>
          Écris à <LegalMail /> en précisant ton nom, la référence de la commande ou du billet, et le
          motif de la demande. Le bureau répond sous 14 jours.
        </p>
      </LegalBlock>

      <LegalBlock title="5. Délais et modalités">
        <p>
          Les remboursements acceptés sont effectués via le moyen de paiement d'origine, sous 14
          jours après validation. Le délai d'apparition sur ton compte dépend ensuite de ta banque.
        </p>
      </LegalBlock>
    </LegalPage>
  );
}
